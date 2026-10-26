import mongoose from 'mongoose';

const poItem = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    qty: { type: Number, required: true, min: 1 },
    rate: { type: Number, default: 0, min: 0 },
    receivedQty: { type: Number, default: 0, min: 0 }
  },
  { _id: false }
);

export const PurchaseOrder = mongoose.model(
  'PurchaseOrder',
  new mongoose.Schema(
    {
      poNo: { type: String, required: true, unique: true },
      vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true },
      items: { type: [poItem], validate: (v) => v.length > 0 },
      status: { type: String, enum: ['Draft', 'Ordered', 'PartiallyReceived', 'Received', 'Cancelled'], default: 'Draft' },
      expectedDate: { type: Date },
      notes: { type: String, default: '' },
      createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    },
    { timestamps: true }
  )
);

export const PurchaseReceive = mongoose.model(
  'PurchaseReceive',
  new mongoose.Schema(
    {
      grnNo: { type: String, required: true, unique: true },
      purchaseOrder: { type: mongoose.Schema.Types.ObjectId, ref: 'PurchaseOrder', required: true },
      items: { type: [{ product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' }, qty: Number, location: String }], default: [] },
      receivedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    },
    { timestamps: true }
  )
);
