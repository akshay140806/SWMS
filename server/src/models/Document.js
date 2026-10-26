import mongoose from 'mongoose';

// Simple document vault (small files as base64 + metadata). 2 MB cap enforced in controller.
const documentSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    kind: { type: String, enum: ['invoice', 'challan', 'label', 'other'], default: 'other' },
    mime: { type: String, default: '' },
    data: { type: String, default: '' },
    link: { type: String, default: '' },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export default mongoose.model('Document', documentSchema);
