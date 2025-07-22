import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import RoomModel from '../models/Room.js';

const router = express.Router();

// Initialize Gemini AI lazily
let model = null;
let initializationAttempted = false;

const initializeGemini = () => {
  if (initializationAttempted) return model;
  
  initializationAttempted = true;
  
  try {
    if (!process.env.GEMINI_API_KEY) {
      console.error('GEMINI_API_KEY is not set in environment variables');
      return null;
    } else {
      console.log('Initializing Gemini AI...');
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      // Use the current available model name
      model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      console.log('Gemini AI initialized successfully with gemini-1.5-flash');
      return model;
    }
  } catch (error) {
    console.error('Failed to initialize Gemini AI:', error);
    return null;
  }
};

// Analyze code with Gemini AI
router.post('/analyze-code', async (req, res) => {
  const { code, language, roomId, question } = req.body;
  
  try {
    // Initialize Gemini AI if not already done
    const geminiModel = initializeGemini();
    
    // Check if model is initialized
    if (!geminiModel) {
      return res.status(500).json({ 
        error: 'AI service not available',
        details: 'Gemini AI is not properly initialized. Please check API key configuration.' 
      });
    }

    // Validate required fields
    if (!code || !code.trim()) {
      return res.status(400).json({ 
        error: 'Missing required field',
        details: 'Code is required for analysis' 
      });
    }

    console.log('Processing code analysis for language:', language);

    // Construct the prompt for code analysis
    const prompt = `
You are an expert programming interviewer. Analyze this code and provide a CONCISE assessment (max 200 words):

Language: ${language || 'Not specified'}
Code:
\`\`\`${language || 'text'}
${code}
\`\`\`

Provide a brief analysis covering:
1. **Correctness**: Does it work? Any bugs?
2. **Quality**: Clean, readable code?
3. **Issues**: Key problems to address
4. **Score**: Rate 1-10 for interview performance
5. **Next**: One specific follow-up question to ask

Keep it short and actionable for the interviewer.
`;

    const result = await geminiModel.generateContent(prompt);
    const analysis = result.response.text();

    console.log('Code analysis generated successfully');

    // Save the analysis to the room
    if (roomId) {
      try {
        await RoomModel.updateOne(
          { roomId },
          { 
            $push: { 
              aiAnalyses: {
                code,
                language: language || '',
                analysis,
                timestamp: new Date(),
                question: question || null
              }
            }
          }
        );
      } catch (dbError) {
        console.error('Database error saving analysis:', dbError);
        // Don't fail the request if DB save fails
      }
    }

    res.json({ analysis });
  } catch (error) {
    console.error('Gemini AI analysis error:', error);
    res.status(500).json({ 
      error: 'Failed to analyze code with AI',
      details: error.message 
    });
  }
});

// Ask a question to Gemini about the code or interview
router.post('/ask-question', async (req, res) => {
  const { question, code, language, roomId, context } = req.body;
  
  try {
    // Initialize Gemini AI if not already done
    const geminiModel = initializeGemini();
    
    // Check if model is initialized
    if (!geminiModel) {
      return res.status(500).json({ 
        error: 'AI service not available',
        details: 'Gemini AI is not properly initialized. Please check API key configuration.' 
      });
    }

    // Validate required fields
    if (!question || !question.trim()) {
      return res.status(400).json({ 
        error: 'Missing required field',
        details: 'Question is required' 
      });
    }

    console.log('Processing AI question:', question.substring(0, 50) + '...');

    const prompt = `
You are a helpful AI assistant. Answer the following question clearly and concisely (max 200 words):

${code && code.trim() ? `Context - Current code in editor:
\`\`\`${language || 'text'}
${code}
\`\`\`` : ''}

Question: ${question}

Provide a helpful, accurate response.
`;

    const result = await geminiModel.generateContent(prompt);
    const response = result.response.text();

    console.log('AI response generated successfully');

    // Save the Q&A to the room
    if (roomId) {
      try {
        await RoomModel.updateOne(
          { roomId },
          { 
            $push: { 
              aiQuestions: {
                question,
                response,
                code: code || '',
                language: language || '',
                timestamp: new Date(),
                context: context || null
              }
            }
          }
        );
      } catch (dbError) {
        console.error('Database error saving AI question:', dbError);
        // Don't fail the request if DB save fails
      }
    }

    res.json({ response });
  } catch (error) {
    console.error('Gemini AI question error:', error);
    res.status(500).json({ 
      error: 'Failed to get AI response',
      details: error.message 
    });
  }
});

// Get AI analysis history for a room
router.get('/room/:roomId/analyses', async (req, res) => {
  const { roomId } = req.params;
  
  try {
    const room = await RoomModel.findOne({ roomId });
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }
    
    res.json({
      analyses: room.aiAnalyses || [],
      questions: room.aiQuestions || []
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch AI history' });
  }
});

// Generate interview questions based on role/topic
router.post('/generate-questions', async (req, res) => {
  const { topic, difficulty, language, count = 3 } = req.body;
  
  try {
    // Initialize Gemini AI if not already done
    const geminiModel = initializeGemini();
    
    // Check if model is initialized
    if (!geminiModel) {
      return res.status(500).json({ 
        error: 'AI service not available',
        details: 'Gemini AI is not properly initialized. Please check API key configuration.' 
      });
    }

    const prompt = `
Generate ${count} high-quality technical interview questions for:
- Topic/Role: ${topic}
- Difficulty: ${difficulty}
- Programming Language: ${language}

For each question, provide:
1. The question statement
2. Expected approach/solution outline
3. Key points to evaluate in the candidate's response
4. Follow-up questions to ask

Format as a structured list that an interviewer can easily use.
`;

    const result = await geminiModel.generateContent(prompt);
    const questions = result.response.text();

    res.json({ questions });
  } catch (error) {
    console.error('Gemini AI question generation error:', error);
    res.status(500).json({ 
      error: 'Failed to generate questions',
      details: error.message 
    });
  }
});

export default router;
