import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema(
  {
    key: { type: String, default: 'global', unique: true },
    warehouseName: { type: String, default: 'WareX Warehouse' },
    address: { type: String, default: '' },
    timeZone: { type: String, default: 'Asia/Kolkata' },
    currency: { type: String, default: 'INR' },
    defaultReorderLevel: { type: Number, default: 10 },
    allowNegativeStock: { type: Boolean, default: false },
    lowStockThreshold: { type: Number, default: 10 },
    inAppAlerts: { type: Boolean, default: true },
    emailAlerts: { type: Boolean, default: true },
    smsAlerts: { type: Boolean, default: false },
    notificationEmail: { type: String, default: '' },
    smtpHost: { type: String, default: '' },
    smtpPort: { type: Number, default: 587 },
    smtpUser: { type: String, default: '' },
    smtpPass: { type: String, default: '' },
    smtpFrom: { type: String, default: '' },
    smtpSecure: { type: Boolean, default: false },
    theme: { type: String, enum: ['light', 'dark', 'system'], default: 'light' },
    compactTables: { type: Boolean, default: false },
    geminiApiKey: { type: String, default: '' },
    geminiModel: { type: String, default: 'gemini-1.5-flash' },
    onboarded: { type: Boolean, default: false } // setup wizard completed (store profile + first location)
  },
  { timestamps: true }
);

export default mongoose.model('Settings', settingsSchema);
