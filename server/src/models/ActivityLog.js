import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema(
  {
    actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    action: { type: String, required: true }, // e.g. product.create, stock.inward, order.dispatch
    entity: { type: String, default: '' },
    entityId: { type: String, default: '' },
    detail: { type: String, default: '' }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

activitySchema.index({ createdAt: -1 });

export default mongoose.model('ActivityLog', activitySchema);
