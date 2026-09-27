import mongoose from 'mongoose';

const scheduledMessageSchema = new mongoose.Schema(
  {
    message: { type: String, required: true, trim: true },
    scheduledAt: { type: Date, required: true, index: true },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending',
      index: true,
    },
    error: String,
  },
  { timestamps: true }
);

scheduledMessageSchema.index({ status: 1, scheduledAt: 1 });

export default mongoose.model('ScheduledMessage', scheduledMessageSchema);
