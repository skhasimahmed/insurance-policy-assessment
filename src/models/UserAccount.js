import mongoose from 'mongoose';

const userAccountSchema = new mongoose.Schema(
  {
    accountName: { type: String, required: true, trim: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

userAccountSchema.index({ userId: 1, accountName: 1 }, { unique: true });

export default mongoose.model('UserAccount', userAccountSchema);
