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
    match: [/.+@.+\..+/, 'Please enter a valid email']
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

// Password hashing middleware
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
  }
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
