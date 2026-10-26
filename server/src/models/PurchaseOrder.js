import mongoose from 'mongoose';

// Purchase Order: buying from a vendor. Receiving adds stock (INWARD ledger).
const poItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    qty: { type: Number, required: true, min: 1 },
    rate: { type: Number, default: 0, min: 0 },
    location: { type: mongoose.Schema.Types.ObjectId, ref: 'Location' },
    receivedQty: { type: Number, default: 0 }
  },
  { _id: false }
);

const purchaseOrderSchema = new mongoose.Schema(
  {
    poNo: { type: String, required: true, unique: true, trim: true }, // PO-00001
    vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true },
    items: { type: [poItemSchema], validate: (v) => v.length > 0 },
    status: { type: String, enum: ['Draft', 'Ordered', 'Partially Received', 'Received', 'Cancelled'], default: 'Draft' },
    expectedDate: { type: Date },
    note: { type: String, default: '' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    receivedAt: { type: Date },
    grns: {
      type: [{ grnNo: String, items: [{ product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' }, qty: Number }], at: { type: Date, default: Date.now } }],
      default: []
    }
  },
  { timestamps: true }
);

export default mongoose.model('PurchaseOrder', purchaseOrderSchema);
