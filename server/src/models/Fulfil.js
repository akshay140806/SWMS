import mongoose from 'mongoose';

export const Package = mongoose.model(
  'Package',
  new mongoose.Schema(
    {
      packageNo: { type: String, required: true, unique: true },
      order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
      items: { type: [{ product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' }, qty: Number }], default: [] },
      weight: { type: Number, default: 0 },
      packedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    },
    { timestamps: true }
  )
);

export const Shipment = mongoose.model(
  'Shipment',
  new mongoose.Schema(
    {
      shipmentNo: { type: String, required: true, unique: true },
      order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
      packages: { type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Package' }], default: [] },
      carrier: { type: String, default: '' },
      trackingNo: { type: String, default: '' },
      status: { type: String, enum: ['Packed', 'Shipped', 'Delivered'], default: 'Shipped' },
      shippedAt: { type: Date, default: Date.now },
      shippedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    },
    { timestamps: true }
  )
);

export const SalesReturn = mongoose.model(
  'SalesReturn',
  new mongoose.Schema(
    {
      returnNo: { type: String, required: true, unique: true },
      order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
      customerName: { type: String, default: '' },
      items: { type: [{ product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' }, qty: Number, location: String }], default: [] },
      reason: { type: String, default: 'Other' },
      status: { type: String, enum: ['Received', 'Restocked'], default: 'Restocked' },
      createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    },
    { timestamps: true }
  )
);
