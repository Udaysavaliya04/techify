import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import RoomModel from './models/Room.js';

// Load environment variables first
dotenv.config();

// Debug environment variables
console.log('Environment variables loaded:');
console.log('GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? 'Set (length: ' + process.env.GEMINI_API_KEY.length + ')' : 'Not set');
console.log('MONGO_URI:', process.env.MONGO_URI ? 'Set' : 'Not set');
console.log('JDOODLE_CLIENT_ID:', process.env.JDOODLE_CLIENT_ID ? 'Set' : 'Not set');

// Import routes after environment variables are loaded
import codeRouter, { setSocketIO } from './routes/code.js';
import roomRouter from './routes/room.js';
import aiRouter from './routes/ai.js';
import questionsRouter from './routes/questions.js';
import authRouter from './routes/auth.js';

const app = express();
app.use(express.json());
app.use(cors());

// Health check route
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

mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

// Pass socket.io instance to code router
setSocketIO(io);

// In-memory room state: { [roomId]: { code, question, users: [{id, role}] } }
const rooms = {};

io.on('connection', (socket) => {
  let currentRoom = null;
  let userRole = 'candidate';

  socket.on('joinRoom', async ({ roomId, role, username }) => {
    currentRoom = roomId;
    userRole = role || 'candidate';
    socket.join(roomId);
    let room = await RoomModel.findOne({ roomId });
    if (!room) {
      room = await RoomModel.create({ roomId, users: [{ id: socket.id, role: userRole }] });
    } else {
      room.users.push({ id: socket.id, role: userRole });
      await room.save();
    }
    
    // Emit user joined event to all other users in the room
    socket.to(roomId).emit('userJoined', {
      username: username || 'Anonymous',
      role: userRole,
      userId: socket.id
    });
    
    socket.emit('init', { code: room.code, question: room.question });
  });

  socket.on('codeChange', async (code) => {
    if (!currentRoom) return;
    await RoomModel.updateOne({ roomId: currentRoom }, { code });
    socket.to(currentRoom).emit('codeChange', code);
  });

  socket.on('setQuestion', async (question) => {
    if (!currentRoom) return;
    await RoomModel.updateOne({ roomId: currentRoom }, { question });
    io.in(currentRoom).emit('questionChange', question);
  });

  socket.on('endInterview', async () => {
    if (!currentRoom) return;
    await RoomModel.updateOne({ roomId: currentRoom }, { 
      endTime: new Date(),
      isActive: false 
    });
    io.in(currentRoom).emit('interviewEnded');
  });

  // WebRTC Video Calling Handlers
  socket.on('join-video-room', ({ roomId, role }) => {
    const videoRoomName = `video-${roomId}`;
    
    // Join the room
    socket.join(videoRoomName);
    
    // Get current users in the room
    const room = io.sockets.adapter.rooms.get(videoRoomName);
    const usersInRoom = [];
    
    if (room) {
      room.forEach(socketId => {
        if (socketId !== socket.id) {
          usersInRoom.push({ id: socketId });
        }
      });
    }
    
    // Notify the joining user about existing users
    socket.emit('users-in-room', { users: usersInRoom });
    
    // Notify other users about the new user
    socket.to(videoRoomName).emit('user-joined-video', {
      userId: socket.id,
      userRole: role
    });
    
    console.log(`${role} (${socket.id}) joined video room: ${roomId}, total users: ${room ? room.size : 1}`);
  });

  socket.on('offer', ({ roomId, offer }) => {
    socket.to(`video-${roomId}`).emit('offer', { offer });
    console.log('WebRTC offer sent for room:', roomId);
  });

  socket.on('answer', ({ roomId, answer }) => {
    socket.to(`video-${roomId}`).emit('answer', { answer });
    console.log('WebRTC answer sent for room:', roomId);
  });

  socket.on('ice-candidate', ({ roomId, candidate }) => {
    socket.to(`video-${roomId}`).emit('ice-candidate', { candidate });
    console.log('ICE candidate sent for room:', roomId);
  });

  socket.on('leave-video-room', ({ roomId }) => {
    socket.to(`video-${roomId}`).emit('user-left-video', { userId: socket.id });
    socket.leave(`video-${roomId}`);
    console.log('User left video room:', roomId);
  });

  socket.on('disconnect', async () => {
    if (currentRoom) {
      await RoomModel.updateOne({ roomId: currentRoom }, { $pull: { users: { id: socket.id } } });
      
      // Notify other users that this user left
      socket.to(currentRoom).emit('userLeft', { userId: socket.id });
      
      // Notify video room that user disconnected
      socket.to(`video-${currentRoom}`).emit('user-left-video', { userId: socket.id });
    }
  });
});

app.get('/', (req, res) => {
  res.send('API running');
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 