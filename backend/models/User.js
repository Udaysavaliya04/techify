import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 20
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['candidate', 'interviewer', 'admin'],
    default: 'candidate'
  },
  profilePicture: {
    type: String,
    default: null
  },
  interviewHistory: [{
    roomId: {
      type: String,
      required: true
    },
    role: {
      type: String,
      enum: ['candidate', 'interviewer'],
      required: true
    },
    questionTitle: String,
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard']
    },
    codeSubmitted: String,
    language: String,
    status: {
      type: String,
      enum: ['completed', 'ongoing', 'abandoned'],
      default: 'ongoing'
    },
    score: {
      type: Number,
      min: 0,
      max: 100,
      default: null
    },
    feedback: String,
    duration: Number, // in minutes
    createdAt: {
      type: Date,
      default: Date.now
    },
    completedAt: Date
  }],
  preferences: {
    theme: {
      type: String,
      enum: ['light', 'dark'],
      default: 'dark'
    },
    defaultLanguage: {
      type: String,
      default: 'javascript'
    },
    emailNotifications: {
      type: Boolean,
      default: true
    }
  },
  stats: {
    totalInterviews: {
      type: Number,
      default: 0
    },
    completedInterviews: {
      type: Number,
      default: 0
    },
    averageScore: {
      type: Number,
      default: 0
    },
    favoriteLanguage: String,
    totalTimeSpent: {
      type: Number,
      default: 0
    } // in minutes
  },
  lastActive: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Update stats method
userSchema.methods.updateStats = function () {
  const completedInterviews = this.interviewHistory.filter(interview =>
    interview.status === 'completed'
  );

  this.stats.totalInterviews = this.interviewHistory.length;
  this.stats.completedInterviews = completedInterviews.length;

  if (completedInterviews.length > 0) {
    const totalScore = completedInterviews.reduce((sum, interview) =>
      sum + (interview.score || 0), 0
    );
    this.stats.averageScore = Math.round(totalScore / completedInterviews.length);

    const totalTime = completedInterviews.reduce((sum, interview) =>
      sum + (interview.duration || 0), 0
    );
    this.stats.totalTimeSpent = totalTime;

    // Find most used language
    const languageCount = {};
    completedInterviews.forEach(interview => {
      if (interview.language) {
        languageCount[interview.language] = (languageCount[interview.language] || 0) + 1;
      }
    });

    const mostUsedLanguage = Object.keys(languageCount).reduce((a, b) =>
      languageCount[a] > languageCount[b] ? a : b, null
    );

    this.stats.favoriteLanguage = mostUsedLanguage;
  }
};

// Clean up duplicate interviews (keep only the latest one for each roomId)
userSchema.methods.cleanupDuplicateInterviews = function () {
  const roomMap = new Map();

  // Group interviews by roomId, keeping only the latest
  this.interviewHistory.forEach(interview => {
    const roomId = interview.roomId;
    if (!roomMap.has(roomId) || interview.createdAt > roomMap.get(roomId).createdAt) {
      roomMap.set(roomId, interview);
    }
  });

  // Replace interview history with cleaned up version
  this.interviewHistory = Array.from(roomMap.values());
  this.updateStats();
};

// Add interview to history (only if not already exists for this room)
userSchema.methods.addInterview = function (interviewData) {
  // Check if interview with this roomId already exists
  const existingInterview = this.interviewHistory.find(i => i.roomId === interviewData.roomId);

  if (!existingInterview) {
    this.interviewHistory.push(interviewData);
    this.updateStats();
  }
  this.lastActive = new Date();
};

// Complete interview
userSchema.methods.completeInterview = function (roomId, completionData) {
  const interview = this.interviewHistory.find(i => i.roomId === roomId && i.status !== 'completed');
  if (interview) {
    interview.status = 'completed';
    interview.completedAt = new Date();
    if (completionData.score !== undefined) interview.score = completionData.score;
    if (completionData.feedback) interview.feedback = completionData.feedback;
    if (completionData.duration) interview.duration = completionData.duration;
    if (completionData.codeSubmitted) interview.codeSubmitted = completionData.codeSubmitted;

    this.updateStats();
    this.lastActive = new Date();
  }
};

export default mongoose.model('User', userSchema);