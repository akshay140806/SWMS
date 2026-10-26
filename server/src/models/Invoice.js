import mongoose from 'mongoose';

// Sales invoice generated from a dispatched/delivered sales order.
const invItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    name: { type: String, default: '' },
    sku: { type: String, default: '' },
    qty: { type: Number, required: true, min: 1 },
    rate: { type: Number, default: 0, min: 0 },
    amount: { type: Number, default: 0 }
  },
  { _id: false }
);

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNo: { type: String, required: true, unique: true, trim: true }, // INV-00001
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    customerName: { type: String, default: '' },
    customerPhone: { type: String, default: '' },
    deliveryAddress: { type: String, default: '' },
    items: { type: [invItemSchema], validate: (v) => v.length > 0 },
    subTotal: { type: Number, default: 0 },
    taxRate: { type: Number, default: 0 },
    taxAmount: { type: Number, default: 0 },
    grandTotal: { type: Number, default: 0 },
    status: { type: String, enum: ['Unpaid', 'Paid', 'Cancelled'], default: 'Unpaid' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

export default mongoose.model('Invoice', invoiceSchema);
