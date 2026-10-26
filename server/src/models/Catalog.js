import mongoose from 'mongoose';

export const ItemGroup = mongoose.model(
  'ItemGroup',
  new mongoose.Schema(
    { name: { type: String, required: true, unique: true, trim: true }, description: { type: String, default: '' } },
    { timestamps: true }
  )
);

const priceEntry = new mongoose.Schema(
  { product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true }, price: { type: Number, required: true, min: 0 } },
  { _id: false }
);

export const PriceList = mongoose.model(
  'PriceList',
  new mongoose.Schema(
    { name: { type: String, required: true, unique: true, trim: true }, type: { type: String, enum: ['sales', 'purchase'], default: 'sales' }, isDefault: { type: Boolean, default: false }, items: { type: [priceEntry], default: [] } },
    { timestamps: true }
  )
);
