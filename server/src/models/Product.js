import mongoose from 'mongoose';

// available (sellable) is DERIVED: totalQuantity - damagedQuantity - reservedQuantity.
// Never stored, to avoid drift — use availOf() in controllers.
const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    sku: { type: String, required: true, unique: true, trim: true, uppercase: true },
    barcode: { type: String, trim: true, default: '' },
    category: { type: String, default: 'General', trim: true },
    unit: { type: String, default: 'pcs', trim: true },
    description: { type: String, default: '' },
    image: { type: String, default: '' },
    costPrice: { type: Number, default: 0, min: 0 },
    sellingPrice: { type: Number, default: 0, min: 0 },
    reorderLevel: { type: Number, default: 10, min: 0 },
    group: { type: mongoose.Schema.Types.ObjectId, ref: 'ItemGroup' },
    totalQuantity: { type: Number, default: 0, min: 0 },
    damagedQuantity: { type: Number, default: 0, min: 0 },
    reservedQuantity: { type: Number, default: 0, min: 0 },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    defaultLocationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Location' },
    itemType: { type: String, enum: ['single', 'composite'], default: 'single' },
    components: {
      type: [{ product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' }, qty: { type: Number, min: 1 } }],
      default: []
    }
  },
  { timestamps: true }
);

productSchema.index({ name: 'text', sku: 'text', barcode: 'text' });

export function availOf(p) {
  return Math.max(0, (p.totalQuantity || 0) - (p.damagedQuantity || 0) - (p.reservedQuantity || 0));
}

export default mongoose.model('Product', productSchema);
