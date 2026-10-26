import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    qty: { type: Number, required: true, min: 1 },
    location: { type: String, default: '' }, // snapshot of pick location code
    pickedQty: { type: Number, default: 0 }
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderNo: { type: String, required: true, unique: true, trim: true }, // ORD-00001
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
    customerName: { type: String, required: true, trim: true },
    customerPhone: { type: String, default: '' },
    deliveryAddress: { type: String, default: '' },
    items: { type: [orderItemSchema], validate: (v) => v.length > 0 },
    status: {
      type: String,
      enum: ['Created', 'Picking', 'Picked', 'Dispatched', 'Delivered', 'Cancelled'],
      default: 'Created'
    },
    pickingList: { type: [{ location: String, sku: String, name: String, qty: Number }], default: [] },
    instructions: { type: String, default: '' },
    carrier: { type: String, default: '' },
    trackingNo: { type: String, default: '' },
    dispatchNotes: { type: String, default: '' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    dispatchedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    dispatchedAt: { type: Date }
  },
  { timestamps: true }
);

export default mongoose.model('Order', orderSchema);
