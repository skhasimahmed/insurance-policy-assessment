import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    message: { type: String, required: true, trim: true },
    scheduledMessageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ScheduledMessage',
      required: true,
    },
    postedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model('Message', messageSchema);
