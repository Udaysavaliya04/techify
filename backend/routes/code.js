import express from 'express';
import axios from 'axios';
import CodeSnippet from '../models/CodeSnippet.js';
import RoomModel from '../models/Room.js';

const router = express.Router();

// Store socket.io instance
let io;

export const setSocketIO = (socketIO) => {
  io = socketIO;
};

// Execute code via JDoodle
router.post('/execute', async (req, res) => {
  const { code, language, roomId, executedBy } = req.body;
  try {
    const response = await axios.post('https://api.jdoodle.com/v1/execute', {
      clientId: process.env.JDOODLE_CLIENT_ID,
      clientSecret: process.env.JDOODLE_CLIENT_SECRET,
      script: code,
      language,
      versionIndex: '0'
    });

    const outputData = {
      output: response.data.output || '',
      error: response.data.error || '',
      executedBy: executedBy || 'unknown',
      timestamp: new Date()
    };

    // Save execution to room if roomId is provided
    if (roomId) {
      const executionData = {
        code,
        language,
        ...outputData,
        executedAt: new Date()
      };

      // Also save to execution history with additional metrics
      const historyData = {
        code,
        language,
        output: response.data.output || '',
        success: !response.data.error,
        executionTime: response.data.cpuTime || 0,
        timestamp: new Date(),
        executedBy: executedBy || 'unknown'
      };

      await RoomModel.updateOne(
        { roomId },
        { 
          $push: { 
            executions: executionData,
            executionHistory: historyData
          },
          $set: {
            code: code,
            language: language
          }
        }
      );

      // Emit output to all users in the room via socket
      if (io) {
        io.to(roomId).emit('outputChange', outputData);
      }
    }

    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: 'JDoodle execution failed' });
  }
});

// Save code snippet
router.post('/save', async (req, res) => {
  const { code, language, output } = req.body;
  try {
    const snippet = new CodeSnippet({ code, language, output });
    await snippet.save();
    res.json(snippet);
  } catch (err) {
    res.status(500).json({ error: 'Failed to save snippet' });
  }
});

// Get all code snippets
router.get('/snippets', async (req, res) => {
  try {
    const snippets = await CodeSnippet.find().sort({ createdAt: -1 });
    res.json(snippets);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch snippets' });
  }
});

// Get room execution history
router.get('/room/:roomId/executions', async (req, res) => {
  const { roomId } = req.params;
  try {
    const room = await RoomModel.findOne({ roomId });
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }
    res.json(room.executions || []);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch execution history' });
  }
});

export default router; 