import mongoose from 'mongoose';

// Atomic counters (orderNo sequence, ...).
const counterSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  seq: { type: Number, default: 0 }
});

export async function nextSeq(key, session = null) {
  const doc = await mongoose
    .model('Counter')
    .findOneAndUpdate({ key }, { $inc: { seq: 1 } }, { upsert: true, new: true, session });
  return doc.seq;
}

export default mongoose.model('Counter', counterSchema);
