import mongoose from 'mongoose';

const ReportedProblemSchema = new mongoose.Schema(
  {
    roomId: { type: String, required: true, index: true },
    reporter: {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
      username: { type: String, required: true },
      email: { type: String, required: true }
    },
    message: { type: String, required: true, maxlength: 2000 },
    createdAt: { type: Date, default: Date.now }
  },
  { timestamps: false }
);

ReportedProblemSchema.index({ roomId: 1, createdAt: -1 });

export default mongoose.model('ReportedProblem', ReportedProblemSchema);
