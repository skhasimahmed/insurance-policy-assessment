import mongoose from 'mongoose';

const importJobSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ['queued', 'processing', 'completed', 'failed'],
      default: 'queued',
      index: true,
    },
    fileName: String,
    totalRows: { type: Number, default: 0 },
    processedRows: { type: Number, default: 0 },
    addedRows: { type: Number, default: 0 },
    skippedRows: { type: Number, default: 0 },
    failedRows: { type: Number, default: 0 },
    error: String,
  },
  { timestamps: true }
);

export default mongoose.model('ImportJob', importJobSchema);
