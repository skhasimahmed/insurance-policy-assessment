import mongoose from 'mongoose';

const policyCarrierSchema = new mongoose.Schema(
  {
    companyName: { type: String, required: true, trim: true, unique: true },
  },
  { timestamps: true }
);

export default mongoose.model('PolicyCarrier', policyCarrierSchema);
