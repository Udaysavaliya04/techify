import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const router = express.Router();

// JWT Secret - in production, use environment variable
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Middleware to verify JWT token
export const verifyToken = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid token.' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token.' });
  }
};

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, role = 'candidate' } = req.body;

    // Validation
    if (!username || !email || !password) {
      return res.status(400).json({ 
        error: 'Please provide all required fields: username, email, password' 
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ 
        error: 'Password must be at least 6 characters long' 
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { username }]
    });

    if (existingUser) {
      return res.status(400).json({ 
        error: existingUser.email === email.toLowerCase() 
          ? 'Email already registered' 
          : 'Username already taken' 
      });
    }

    // Create new user
    const user = new User({
      username,
      email: email.toLowerCase(),
      password,
      role
    });

    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, username: user.username },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        stats: user.stats,
        preferences: user.preferences
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error during registration' });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Please provide email and password' });
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Update last active
    user.lastActive = new Date();
    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, username: user.username },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        stats: user.stats,
        preferences: user.preferences,
        lastActive: user.lastActive
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error during login' });
  }
});

// Get current user profile
router.get('/profile', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json({
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        stats: user.stats,
        preferences: user.preferences,
        profilePicture: user.profilePicture,
        lastActive: user.lastActive,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ error: 'Error fetching profile' });
  }
});

// Update user profile
router.put('/profile', verifyToken, async (req, res) => {
  try {
    const { preferences, profilePicture } = req.body;
    const user = await User.findById(req.user._id);

    if (preferences) {
      user.preferences = { ...user.preferences.toObject(), ...preferences };
    }
    if (profilePicture !== undefined) user.profilePicture = profilePicture;

    user.lastActive = new Date();
    await user.save();

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        stats: user.stats,
        preferences: user.preferences,
        profilePicture: user.profilePicture,
        lastActive: user.lastActive
      }
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Error updating profile' });
  }
});

// Get user dashboard data (interview history, stats)
router.get('/dashboard', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    
    // Clean up any duplicate interviews
    user.cleanupDuplicateInterviews();
    await user.save();
    
    // Get recent interviews (last 10), properly filtered
    const uniqueInterviews = new Map();
    
    // Group by roomId and keep only the most recent/relevant interview
    user.interviewHistory.forEach(interview => {
      const roomId = interview.roomId;
      if (!uniqueInterviews.has(roomId) || 
          interview.createdAt > uniqueInterviews.get(roomId).createdAt ||
          (interview.status === 'completed' && uniqueInterviews.get(roomId).status !== 'completed')) {
        uniqueInterviews.set(roomId, interview);
      }
    });
    
    const recentInterviews = Array.from(uniqueInterviews.values())
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 10);

    // Calculate additional stats
    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);
    
    const thisMonthInterviews = Array.from(uniqueInterviews.values()).filter(
      interview => new Date(interview.createdAt) >= thisMonth
    );

    const difficultyStats = Array.from(uniqueInterviews.values()).reduce((acc, interview) => {
      if (interview.difficulty && interview.status === 'completed') {
        acc[interview.difficulty] = (acc[interview.difficulty] || 0) + 1;
      }
      return acc;
    }, {});

    res.json({
      user: {
        id: user._id,
        username: user.username,
        role: user.role,
        profilePicture: user.profilePicture
      },
      stats: {
        ...user.stats.toObject(),
        thisMonthInterviews: thisMonthInterviews.length,
        difficultyBreakdown: difficultyStats
      },
      recentInterviews,
      preferences: user.preferences
    });
  } catch (error) {
    console.error('Dashboard fetch error:', error);
    res.status(500).json({ error: 'Error fetching dashboard data' });
  }
});

// Add interview to user history
router.post('/interview', verifyToken, async (req, res) => {
  try {
    const { roomId, role, questionTitle, difficulty, language } = req.body;
    
    if (!roomId || !role) {
      return res.status(400).json({ error: 'Room ID and role are required' });
    }

    const user = await User.findById(req.user._id);
    
    // Check if interview already exists for this room
    const existingInterview = user.interviewHistory.find(i => i.roomId === roomId);
    
    if (existingInterview) {
      return res.json({
        message: 'Interview already exists for this room',
        interviewId: existingInterview._id,
        status: existingInterview.status
      });
    }
    
    user.addInterview({
      roomId,
      role,
      questionTitle,
      difficulty,
      language,
      status: 'ongoing'
    });

    await user.save();

    res.json({
      message: 'Interview started and added to history',
      interviewId: user.interviewHistory[user.interviewHistory.length - 1]._id
    });
  } catch (error) {
    console.error('Add interview error:', error);
    res.status(500).json({ error: 'Error adding interview to history' });
  }
});

// Complete interview
router.put('/interview/:roomId/complete', verifyToken, async (req, res) => {
  try {
    const { roomId } = req.params;
    const { score, feedback, duration, codeSubmitted } = req.body;

    const user = await User.findById(req.user._id);
    
    user.completeInterview(roomId, {
      score,
      feedback,
      duration,
      codeSubmitted
    });

    await user.save();

    res.json({
      message: 'Interview completed successfully',
      stats: user.stats
    });
  } catch (error) {
    console.error('Complete interview error:', error);
    res.status(500).json({ error: 'Error completing interview' });
  }
});

// Verify token endpoint
router.get('/verify', verifyToken, (req, res) => {
  res.json({
    valid: true,
    user: {
      id: req.user._id,
      username: req.user.username,
      email: req.user.email,
      role: req.user.role
    }
  });
});

// Logout (client-side token removal, but we can track it)
router.post('/logout', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.lastActive = new Date();
    await user.save();
    
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    res.json({ message: 'Logged out successfully' }); // Still return success
  }
});

export default router;
