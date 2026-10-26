import mongoose from 'mongoose';

const locationSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, trim: true, uppercase: true }, // Zone-Rack-Bin e.g. A-01-03
    zone: { type: String, default: 'A', trim: true },
    rack: { type: String, default: '01', trim: true },
    shelf: { type: String, default: 'B1', trim: true },
    capacity: { type: Number, required: true, min: 1 },
    occupied: { type: Number, default: 0, min: 0 },
    status: { type: String, enum: ['available', 'near-full', 'full', 'blocked'], default: 'available' }
  },
  { timestamps: true }
);

export function locationStatus(occupied, capacity, current) {
  if (current === 'blocked') return 'blocked';
  if (capacity <= 0) return 'full';
  const pct = occupied / capacity;
  if (pct >= 1) return 'full';
  if (pct >= 0.85) return 'near-full';
  return 'available';
}

locationSchema.pre('save', function (next) {
  this.status = locationStatus(this.occupied, this.capacity, this.status);
  next();
});

export default mongoose.model('Location', locationSchema);
