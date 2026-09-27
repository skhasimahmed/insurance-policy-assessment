import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true },
    dob: { type: String, trim: true },
    address: String,
    phoneNumber: String,
    state: String,
    zipCode: String,
    email: { type: String, trim: true, lowercase: true },
    gender: String,
    userType: String,
    agentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Agent' },
  },
  { timestamps: true }
);

userSchema.index({ firstName: 1 });
userSchema.index({ email: 1 });

export default mongoose.model('User', userSchema);
