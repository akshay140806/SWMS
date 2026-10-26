import mongoose from 'mongoose';

// Credit Note (to customer, e.g. sales return) or Vendor Credit (from vendor).
const creditSchema = new mongoose.Schema(
  {
    creditNo: { type: String, required: true, unique: true },
    kind: { type: String, enum: ['sales', 'purchase'], required: true },
    partyName: { type: String, default: '' },
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    qty: { type: Number, default: 0 },
    amount: { type: Number, required: true, min: 0 },
    reason: { type: String, default: '' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export default mongoose.model('CreditNote', creditSchema);
