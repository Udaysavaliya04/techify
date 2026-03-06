import express from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User.js';
import RoomModel from '../models/Room.js';
import RoomInvite from '../models/RoomInvite.js';

const router = express.Router();

// JWT Secret - in production, use environment variable
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const INVITE_SECRET = process.env.INVITE_SECRET || JWT_SECRET;

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

export const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: 'Authentication required.' });
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ error: 'Insufficient permissions.' });
  }
  return next();
};

export const hasRoomAccess = (user, roomId) => {
  if (!user || !roomId) return false;
  if (user.role === 'admin') return true;
  return user.interviewHistory?.some((item) => item.roomId === roomId) || false;
};

export const requireRoomAccess = (opts = {}) => {
  const { interviewerOnly = false } = opts;
  return (req, res, next) => {
    const roomId = req.params.roomId || req.body.roomId || req.query.roomId;
    if (!roomId) return res.status(400).json({ error: 'Room ID is required' });
    if (!hasRoomAccess(req.user, roomId)) {
      return res.status(403).json({ error: 'Unauthorized room access' });
    }
    if (interviewerOnly && !['interviewer', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Interviewer access required' });
    }
    req.roomId = roomId;
    return next();
  };
};

const buildUserPayload = (user) => ({
  id: user._id,
  username: user.username,
  email: user.email,
  role: user.role,
  stats: user.stats,
  preferences: user.preferences,
  profilePicture: user.profilePicture,
  profileCompleted: user.profileCompleted,
  candidateProfile: user.candidateProfile,
  lastActive: user.lastActive
});

const validateCandidateProfile = (candidateProfile = {}) => {
  const requiredFields = ['fullName', 'targetRole', 'experienceLevel', 'country'];
  for (const field of requiredFields) {
    if (!candidateProfile[field] || !String(candidateProfile[field]).trim()) {
      return `Field "${field}" is required`;
    }
  }

  if (!Array.isArray(candidateProfile.comfortableLanguages) || candidateProfile.comfortableLanguages.length === 0) {
    return 'At least one comfortable language is required';
  }

  return null;
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
      user: buildUserPayload(user)
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
      user: buildUserPayload(user)
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
        ...buildUserPayload(user),
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
    const { preferences, profilePicture, candidateProfile, currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);

    if (preferences) {
      user.preferences = { ...user.preferences.toObject(), ...preferences };
    }
    if (profilePicture !== undefined) user.profilePicture = profilePicture;

    if (candidateProfile && req.user.role === 'candidate') {
      const normalizedLanguages = Array.isArray(candidateProfile.comfortableLanguages)
        ? candidateProfile.comfortableLanguages.map((l) => String(l).trim()).filter(Boolean)
        : String(candidateProfile.comfortableLanguages || '')
          .split(',')
          .map((l) => l.trim())
          .filter(Boolean);

      user.candidateProfile = {
        ...(user.candidateProfile?.toObject ? user.candidateProfile.toObject() : {}),
        ...candidateProfile,
        comfortableLanguages: normalizedLanguages
      };

      const validationError = validateCandidateProfile(user.candidateProfile);
      if (!validationError) {
        user.profileCompleted = true;
      }
    }

    if (newPassword && String(newPassword).trim()) {
      if (!currentPassword) {
        return res.status(400).json({ error: 'Current password is required to set a new password' });
      }
      const validCurrentPassword = await user.comparePassword(currentPassword);
      if (!validCurrentPassword) {
        return res.status(400).json({ error: 'Current password is incorrect' });
      }
      if (String(newPassword).length < 6) {
        return res.status(400).json({ error: 'New password must be at least 6 characters long' });
      }
      user.password = String(newPassword);
    }

    user.lastActive = new Date();
    await user.save();

    res.json({
      message: 'Profile updated successfully',
      user: buildUserPayload(user)
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
        profilePicture: user.profilePicture,
        profileCompleted: user.profileCompleted,
        candidateProfile: user.candidateProfile
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

    if (req.user.role !== 'admin' && role !== req.user.role) {
      return res.status(403).json({ error: 'Role mismatch' });
    }

    if (role === 'interviewer') {
      if (!['interviewer', 'admin'].includes(req.user.role)) {
        return res.status(403).json({ error: 'Only interviewer can start interviewer sessions' });
      }
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
      role: req.user.role,
      profileCompleted: req.user.profileCompleted,
      candidateProfile: req.user.candidateProfile
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

// Candidate onboarding profile setup (mandatory fields)
router.post('/profile/setup', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'candidate') {
      return res.status(403).json({ error: 'Profile setup is only required for candidates.' });
    }

    const { fullName, targetRole, comfortableLanguages, experienceLevel, currentCompany, location, bio } = req.body;
    const user = await User.findById(req.user._id);

    const normalizedLanguages = Array.isArray(comfortableLanguages)
      ? comfortableLanguages.map((l) => String(l).trim()).filter(Boolean)
      : String(comfortableLanguages || '')
        .split(',')
        .map((l) => l.trim())
        .filter(Boolean);

    const updatedProfile = {
      fullName: String(fullName || '').trim(),
      targetRole: String(targetRole || '').trim(),
      comfortableLanguages: normalizedLanguages,
      country: String(req.body.country || '').trim(),
      experienceLevel: String(experienceLevel || '').trim(),
      preferredInterviewTrack: String(req.body.preferredInterviewTrack || '').trim(),
      openToRemote: req.body.openToRemote !== undefined ? Boolean(req.body.openToRemote) : true,
      preferredWorkType: String(req.body.preferredWorkType || '').trim(),
      noticePeriod: String(req.body.noticePeriod || '').trim(),
      timezone: String(req.body.timezone || '').trim(),
      careerGoal: String(req.body.careerGoal || '').trim(),
      githubUrl: String(req.body.githubUrl || '').trim(),
      linkedinUrl: String(req.body.linkedinUrl || '').trim(),
      portfolioUrl: String(req.body.portfolioUrl || '').trim(),
      currentCompany: String(currentCompany || '').trim(),
      location: String(location || '').trim(),
      bio: String(bio || '').trim()
    };

    const validationError = validateCandidateProfile(updatedProfile);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    user.candidateProfile = updatedProfile;
    user.profileCompleted = true;
    user.lastActive = new Date();
    await user.save();

    return res.json({
      message: 'Profile setup completed successfully',
      user: buildUserPayload(user)
    });
  } catch (error) {
    console.error('Profile setup error:', error);
    return res.status(500).json({ error: 'Failed to complete profile setup' });
  }
});

// Generate a signed candidate invite link for a room (interviewer/admin only)
router.post('/interview/:roomId/invite', verifyToken, requireRole('interviewer', 'admin'), async (req, res) => {
  try {
    const { roomId } = req.params;
    const ttlSeconds = Math.max(300, Math.min(7200, Number(req.body?.ttlSeconds || 1800)));

    const payload = {
      roomId,
      role: 'candidate',
      issuedBy: req.user._id.toString()
    };
    const inviteToken = jwt.sign(payload, INVITE_SECRET, { expiresIn: ttlSeconds });
    const tokenHash = crypto.createHash('sha256').update(inviteToken).digest('hex');
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000);

    await RoomInvite.create({
      roomId,
      tokenHash,
      issuedBy: req.user._id,
      expiresAt
    });

    res.json({
      roomId,
      inviteToken,
      expiresAt
    });
  } catch (error) {
    console.error('Invite generation error:', error);
    res.status(500).json({ error: 'Failed to generate invite' });
  }
});

// Validate and consume candidate invite token
router.post('/invite/consume', verifyToken, requireRole('candidate', 'admin'), async (req, res) => {
  try {
    const { inviteToken } = req.body;
    if (!inviteToken) {
      return res.status(400).json({ error: 'inviteToken is required' });
    }

    const decoded = jwt.verify(inviteToken, INVITE_SECRET);
    if (!decoded.roomId || decoded.role !== 'candidate') {
      return res.status(400).json({ error: 'Invalid invite token payload' });
    }

    const tokenHash = crypto.createHash('sha256').update(inviteToken).digest('hex');
    const invite = await RoomInvite.findOne({ tokenHash });
    if (!invite || invite.usedAt || invite.expiresAt < new Date()) {
      return res.status(403).json({ error: 'Invite expired or already used' });
    }

    const room = await RoomModel.findOne({ roomId: decoded.roomId });
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    const user = await User.findById(req.user._id);
    if (!user.interviewHistory.some((entry) => entry.roomId === decoded.roomId)) {
      user.addInterview({
        roomId: decoded.roomId,
        role: 'candidate',
        status: 'ongoing'
      });
      await user.save();
    }

    invite.usedAt = new Date();
    invite.usedBy = req.user._id;
    await invite.save();

    res.json({ valid: true, roomId: decoded.roomId });
  } catch (error) {
    res.status(400).json({ error: 'Invalid or expired invite token' });
  }
});

export default router;
