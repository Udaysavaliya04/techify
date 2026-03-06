import mongoose from 'mongoose';

const RoomInviteSchema = new mongoose.Schema(
  {
    roomId: { type: String, required: true, index: true },
    tokenHash: { type: String, required: true, unique: true },
    issuedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    usedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    expiresAt: { type: Date, required: true, index: true },
    usedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

RoomInviteSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model('RoomInvite', RoomInviteSchema);
