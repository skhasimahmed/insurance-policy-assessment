import mongoose from 'mongoose';

const policySchema = new mongoose.Schema(
  {
    policyNumber: { type: String, required: true, trim: true, unique: true },
    policyStartDate: { type: String, trim: true },
    policyEndDate: { type: String, trim: true },
    policyCategoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PolicyCategory',
      required: true,
    },
    carrierId: { type: mongoose.Schema.Types.ObjectId, ref: 'PolicyCarrier', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

policySchema.index({ userId: 1 });

export default mongoose.model('Policy', policySchema);
