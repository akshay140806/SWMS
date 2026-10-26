import mongoose from 'mongoose';

// Named selling-price overrides per product (e.g. Wholesale, Retail, MRP).
const priceListSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    description: { type: String, default: '' },
    items: { type: [{ product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' }, price: { type: Number, min: 0 } }], default: [] }
  },
  { timestamps: true }
);

export default mongoose.model('PriceList', priceListSchema);
