import mongoose from 'mongoose';

const InterviewEventSchema = new mongoose.Schema(
  {
    roomId: { type: String, required: true, index: true },
    type: {
      type: String,
      required: true,
      enum: [
        'room_joined',
        'room_left',
        'code_changed',
        'code_executed',
        'question_set',
        'notes_updated',
        'rubric_saved',
        'interview_ended'
      ]
    },
    actor: {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
      username: { type: String, default: 'anonymous' },
      role: { type: String, default: 'unknown' }
    },
    payload: { type: Object, default: {} },
    createdAt: { type: Date, default: Date.now, index: true }
  },
  { timestamps: false }
);

InterviewEventSchema.index({ roomId: 1, createdAt: 1 });

export default mongoose.model('InterviewEvent', InterviewEventSchema);
