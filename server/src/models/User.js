import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['admin', 'warehouse_staff', 'dispatch_staff'], default: 'warehouse_staff', required: true },
    active: { type: Boolean, default: true },
    lastActiveAt: { type: Date }
  },
  { timestamps: true }
);

export default mongoose.model('User', userSchema);
