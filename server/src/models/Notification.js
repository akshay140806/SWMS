import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // null = broadcast to all
    kind: { type: String, enum: ['low-stock', 'order', 'dispatch', 'damage', 'inward', 'location', 'system'], default: 'system' },
    message: { type: String, required: true },
    link: { type: String, default: '' },
    read: { type: Boolean, default: false }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

notificationSchema.index({ user: 1, read: 1, createdAt: -1 });

export default mongoose.model('Notification', notificationSchema);
