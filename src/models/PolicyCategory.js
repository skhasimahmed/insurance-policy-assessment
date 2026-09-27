import mongoose from 'mongoose';

const policyCategorySchema = new mongoose.Schema(
  {
    categoryName: { type: String, required: true, trim: true, unique: true },
  },
  { timestamps: true }
);

export default mongoose.model('PolicyCategory', policyCategorySchema);
