import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import http from 'http';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { Server as SocketIOServer } from 'socket.io';
import RoomModel from './models/Room.js';
import User from './models/User.js';
import RoomInvite from './models/RoomInvite.js';
import { logInterviewEvent } from './utils/interviewEvents.js';

dotenv.config();

import codeRouter, { setSocketIO } from './routes/code.js';
import roomRouter from './routes/room.js';
import aiRouter from './routes/ai.js';
import questionsRouter from './routes/questions.js';
import authRouter from './routes/auth.js';

const app = express();
app.use(express.json());

const configuredOrigins = [
  ...(process.env.ALLOWED_ORIGINS || '').split(','),
  process.env.FRONTEND_URL || ''
]
  .map((item) => item.trim())
  .filter(Boolean);

const defaultOrigins = [
  'http://localhost:3000',
  'https://techify-platform.onrender.com'
];

const allowedOrigins = [...new Set([...configuredOrigins, ...defaultOrigins])];

const corsOptions = {
  origin(origin, callback) {
    // Allow non-browser/CLI tools without Origin header.
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    console.warn(`CORS blocked origin: ${origin}`);
    return callback(new Error(`CORS blocked origin: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

console.log('CORS allowed origins:', allowedOrigins);

app.get('/', (req, res) => {
  res.json({ message: 'Techify Backend API is running!', timestamp: new Date().toISOString() });
});

app.use('/api/code', codeRouter);
app.use('/api/room', roomRouter);
app.use('/api/ai', aiRouter);
app.use('/api/questions', questionsRouter);
app.use('/api/auth', authRouter);

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const INVITE_SECRET = process.env.INVITE_SECRET || JWT_SECRET;

mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err));

const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: { origin: allowedOrigins, methods: ['GET', 'POST'], credentials: true }
});

setSocketIO(io);

const hasRoomAccess = (user, roomId) => {
  if (!user || !roomId) return false;
  if (user.role === 'admin') return true;
  return user.interviewHistory?.some((item) => item.roomId === roomId) || false;
};

io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (!token) return next(new Error('Missing auth token'));
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    if (!user) return next(new Error('Unauthorized'));
    socket.user = user;
    next();
  } catch {
    next(new Error('Unauthorized'));
  }
});

io.on('connection', (socket) => {
  let currentRoom = null;
  const userRole = socket.user.role;
  let lastCodeEventAt = 0;
  let lastCodeSnapshot = '';

  socket.on('joinRoom', async ({ roomId, inviteToken }) => {
    try {
      const normalizedRoomId = String(roomId || '').trim().toUpperCase();
      if (!normalizedRoomId) return;

      const user = await User.findById(socket.user._id);
      if (!user) return;

      let allowed = hasRoomAccess(user, normalizedRoomId);

      if (!allowed && user.role === 'candidate' && inviteToken) {
        try {
          const decodedInvite = jwt.verify(inviteToken, INVITE_SECRET);
          const tokenHash = crypto.createHash('sha256').update(inviteToken).digest('hex');
          const invite = await RoomInvite.findOne({ tokenHash });
          if (
            invite &&
            !invite.usedAt &&
            invite.expiresAt > new Date() &&
            decodedInvite.roomId === normalizedRoomId &&
            decodedInvite.role === 'candidate'
          ) {
            invite.usedAt = new Date();
            invite.usedBy = user._id;
            await invite.save();

            if (!user.interviewHistory.some((entry) => entry.roomId === normalizedRoomId)) {
              user.addInterview({ roomId: normalizedRoomId, role: 'candidate', status: 'ongoing' });
              await user.save();
            }
            allowed = true;
          }
        } catch {
          allowed = false;
        }
      }

      if (!allowed) {
        socket.emit('socketError', { message: 'Unauthorized room access' });
        return;
      }

      currentRoom = normalizedRoomId;
      socket.join(currentRoom);

      let room = await RoomModel.findOne({ roomId: currentRoom });
      if (!room) {
        if (!['interviewer', 'admin'].includes(user.role)) {
          socket.emit('socketError', { message: 'Only interviewer can create room' });
          return;
        }
        room = await RoomModel.create({ roomId: currentRoom, users: [{ id: socket.id, role: userRole }] });
      } else {
        room.users.push({ id: socket.id, role: userRole });
        await room.save();
      }

      socket.to(currentRoom).emit('userJoined', {
        username: socket.user.username || 'Anonymous',
        role: userRole,
        userId: socket.id
      });

      // Send existing participants to the joining user so UI can render immediately.
      const roomSocketIds = io.sockets.adapter.rooms.get(currentRoom) || new Set();
      const existingUsers = [];
      roomSocketIds.forEach((sid) => {
        if (sid === socket.id) return;
        const peerSocket = io.sockets.sockets.get(sid);
        if (peerSocket?.user) {
          existingUsers.push({
            userId: sid,
            username: peerSocket.user.username || 'Anonymous',
            role: peerSocket.user.role || 'candidate'
          });
        }
      });
      socket.emit('roomUsers', { users: existingUsers });

      socket.emit('init', { code: room.code, question: room.question });
      await logInterviewEvent({
        roomId: currentRoom,
        type: 'room_joined',
        actor: {
          userId: socket.user._id,
          username: socket.user.username,
          role: userRole
        },
        payload: { socketId: socket.id }
      });
    } catch (error) {
      console.error('joinRoom error:', error);
      socket.emit('socketError', { message: 'Failed to join room' });
    }
  });

  socket.on('codeChange', async (code) => {
    if (!currentRoom) return;
    await RoomModel.updateOne({ roomId: currentRoom }, { code });
    socket.to(currentRoom).emit('codeChange', code);

    const now = Date.now();
    const shouldLog = code !== lastCodeSnapshot || now - lastCodeEventAt > 2000;
    if (shouldLog) {
      lastCodeSnapshot = code || '';
      lastCodeEventAt = now;
      await logInterviewEvent({
        roomId: currentRoom,
        type: 'code_changed',
        actor: {
          userId: socket.user._id,
          username: socket.user.username,
          role: userRole
        },
        payload: { code: code || '' }
      });
    }
  });

  socket.on('setQuestion', async (question) => {
    if (!currentRoom || !['interviewer', 'admin'].includes(userRole)) return;
    await RoomModel.updateOne({ roomId: currentRoom }, { question });
    io.in(currentRoom).emit('questionChange', question);
    await logInterviewEvent({
      roomId: currentRoom,
      type: 'question_set',
      actor: {
        userId: socket.user._id,
        username: socket.user.username,
        role: userRole
      },
      payload: { question: question || '' }
    });
  });

  socket.on('endInterview', async () => {
    if (!currentRoom || !['interviewer', 'admin'].includes(userRole)) return;
    await RoomModel.updateOne({ roomId: currentRoom }, {
      endTime: new Date(),
      isActive: false
    });
    io.in(currentRoom).emit('interviewEnded');
    await logInterviewEvent({
      roomId: currentRoom,
      type: 'interview_ended',
      actor: {
        userId: socket.user._id,
        username: socket.user.username,
        role: userRole
      },
      payload: {}
    });
  });

  socket.on('join-video-room', ({ roomId }) => {
    const normalizedRoomId = String(roomId || '').trim().toUpperCase();
    if (!normalizedRoomId || !hasRoomAccess(socket.user, normalizedRoomId)) {
      socket.emit('socketError', { message: 'Unauthorized video room access' });
      return;
    }
    const videoRoomName = `video-${normalizedRoomId}`;
    socket.join(videoRoomName);

    const room = io.sockets.adapter.rooms.get(videoRoomName);
    const usersInRoom = [];
    if (room) {
      room.forEach((socketId) => {
        if (socketId !== socket.id) usersInRoom.push({ id: socketId });
      });
    }

    socket.emit('users-in-room', { users: usersInRoom });
    socket.to(videoRoomName).emit('user-joined-video', { userId: socket.id, userRole });
  });

  socket.on('offer', ({ roomId, offer }) => {
    const normalizedRoomId = String(roomId || '').trim().toUpperCase();
    if (!normalizedRoomId || !hasRoomAccess(socket.user, normalizedRoomId)) return;
    socket.to(`video-${normalizedRoomId}`).emit('offer', { offer });
  });

  socket.on('answer', ({ roomId, answer }) => {
    const normalizedRoomId = String(roomId || '').trim().toUpperCase();
    if (!normalizedRoomId || !hasRoomAccess(socket.user, normalizedRoomId)) return;
    socket.to(`video-${normalizedRoomId}`).emit('answer', { answer });
  });

  socket.on('ice-candidate', ({ roomId, candidate }) => {
    const normalizedRoomId = String(roomId || '').trim().toUpperCase();
    if (!normalizedRoomId || !hasRoomAccess(socket.user, normalizedRoomId)) return;
    socket.to(`video-${normalizedRoomId}`).emit('ice-candidate', { candidate });
  });

  socket.on('leave-video-room', ({ roomId }) => {
    const normalizedRoomId = String(roomId || '').trim().toUpperCase();
    if (!normalizedRoomId || !hasRoomAccess(socket.user, normalizedRoomId)) return;
    socket.to(`video-${normalizedRoomId}`).emit('user-left-video', { userId: socket.id });
    socket.leave(`video-${normalizedRoomId}`);
  });

  socket.on('disconnect', async () => {
    if (currentRoom) {
      await RoomModel.updateOne({ roomId: currentRoom }, { $pull: { users: { id: socket.id } } });
      socket.to(currentRoom).emit('userLeft', {
        userId: socket.id,
        username: socket.user.username || 'Anonymous',
        role: userRole
      });
      socket.to(`video-${currentRoom}`).emit('user-left-video', { userId: socket.id });
      await logInterviewEvent({
        roomId: currentRoom,
        type: 'room_left',
        actor: {
          userId: socket.user._id,
          username: socket.user.username,
          role: userRole
        },
        payload: { socketId: socket.id }
      });
    }

    // Handle video-only socket disconnects too.
    for (const roomName of socket.rooms) {
      if (roomName.startsWith('video-')) {
        socket.to(roomName).emit('user-left-video', { userId: socket.id });
      }
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
