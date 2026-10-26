import mongoose from 'mongoose';

const party = {
  name: { type: String, required: true, trim: true },
  phone: { type: String, default: '' },
  email: { type: String, default: '', lowercase: true, trim: true },
  address: { type: String, default: '' },
  gstin: { type: String, default: '', uppercase: true, trim: true },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' }
};

export const Customer = mongoose.model('Customer', new mongoose.Schema(party, { timestamps: true }));
export const Vendor = mongoose.model('Vendor', new mongoose.Schema(party, { timestamps: true }));
