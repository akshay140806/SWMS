import mongoose from 'mongoose';

// IMMUTABLE ledger: no edit/delete routes exist for movements.
const movementSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    type: { type: String, enum: ['INWARD', 'OUTWARD', 'TRANSFER', 'DAMAGED', 'ADJUSTMENT'], required: true },
    quantity: { type: Number, required: true, min: 1 },
    fromLocation: { type: mongoose.Schema.Types.ObjectId, ref: 'Location' },
    toLocation: { type: mongoose.Schema.Types.ObjectId, ref: 'Location' },
    reference: { type: String, default: '' },
    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    note: { type: String, default: '' }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

movementSchema.index({ product: 1, createdAt: -1 });
movementSchema.index({ type: 1, createdAt: -1 });

export default mongoose.model('StockMovement', movementSchema);
