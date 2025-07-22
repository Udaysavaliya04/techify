import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  id: String,
  role: String
}, { _id: false });

const CodeExecutionSchema = new mongoose.Schema({
  code: String,
  language: String,
  output: String,
  error: String,
  executedBy: String, // role of the person who executed
  executedAt: { type: Date, default: Date.now }
}, { _id: false });

const AIAnalysisSchema = new mongoose.Schema({
  code: String,
  language: String,
  analysis: String,
  question: String,
  timestamp: { type: Date, default: Date.now }
}, { _id: false });

const AIQuestionSchema = new mongoose.Schema({
  question: String,
  response: String,
  code: String,
  language: String,
  context: String,
  timestamp: { type: Date, default: Date.now }
}, { _id: false });

const ExecutionHistorySchema = new mongoose.Schema({
  code: String,
  language: String,
  output: String,
  success: Boolean,
  executionTime: Number,
  timestamp: { type: Date, default: Date.now },
  executedBy: String
}, { _id: false });

const RubricScoreSchema = new mongoose.Schema({
  score: { type: Number, min: 0, max: 10 },
  notes: String
}, { _id: false });

const RubricScoringSchema = new mongoose.Schema({
  scores: {
    technical_knowledge: RubricScoreSchema,
    problem_solving: RubricScoreSchema,
    code_quality: RubricScoreSchema,
    communication: RubricScoreSchema,
    debugging: RubricScoreSchema
  },
  weightedScore: { type: Number, min: 0, max: 10 },
  recommendation: String,
  overallNotes: String,
  evaluatedAt: { type: Date, default: Date.now }
}, { _id: false });

const RoomSchema = new mongoose.Schema({
  roomId: { type: String, required: true, unique: true },
  code: { type: String, default: '' },
  question: { type: String, default: '' },
  language: { type: String, default: 'javascript' },
  users: [UserSchema],
  executions: [CodeExecutionSchema],
  aiAnalyses: [AIAnalysisSchema],
  aiQuestions: [AIQuestionSchema],
  executionHistory: [ExecutionHistorySchema],
  interviewNotes: { type: String, default: '' },
  rubricScores: RubricScoringSchema,
  startTime: { type: Date, default: Date.now },
  endTime: { type: Date, default: null },
  isActive: { type: Boolean, default: true }
});

export default mongoose.model('Room', RoomSchema); 