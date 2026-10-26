import mongoose from 'mongoose';

// Payments Received (from customers) and Payments Made (to vendors).
const paymentSchema = new mongoose.Schema(
  {
    kind: { type: String, enum: ['received', 'made'], required: true },
    invoice: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice' },
    partyName: { type: String, default: '' },
    amount: { type: Number, required: true, min: 1 },
    method: { type: String, default: 'Cash' },
    reference: { type: String, default: '' },
    paidAt: { type: Date, default: Date.now },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export default mongoose.model('Payment', paymentSchema);
