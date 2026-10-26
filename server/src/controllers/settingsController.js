import Settings from '../models/Settings.js';
import ActivityLog from '../models/ActivityLog.js';
import { sendTestEmail } from '../utils/emailService.js';

export async function get(req, res) {
  let s = await Settings.findOne({ key: 'global' });
  if (!s) s = await Settings.create({ key: 'global' });
  res.json(s);
}

export async function update(req, res) {
  const allowed = [
    'warehouseName', 'address', 'timeZone', 'currency', 'defaultReorderLevel',
    'allowNegativeStock', 'lowStockThreshold', 'inAppAlerts', 'emailAlerts', 'smsAlerts',
    'notificationEmail', 'smtpHost', 'smtpPort', 'smtpUser', 'smtpPass', 'smtpFrom', 'smtpSecure',
    'theme', 'compactTables', 'geminiApiKey', 'geminiModel', 'onboarded'
  ];
  const patch = {};
  for (const k of allowed) if (req.body[k] !== undefined) patch[k] = req.body[k];
  const s = await Settings.findOneAndUpdate({ key: 'global' }, { $set: patch }, { upsert: true, new: true });
  res.json(s);
}

export async function activity(req, res) {
  const { page = 1, limit = 50 } = req.query;
  const pg = Math.max(1, Number(page));
  const lim = Math.min(100, Math.max(1, Number(limit)));
  const [items, total] = await Promise.all([
    ActivityLog.find({}).populate('actor', 'name email').sort({ createdAt: -1 }).skip((pg - 1) * lim).limit(lim),
    ActivityLog.countDocuments({})
  ]);
  res.json({ items, total, page: pg, pages: Math.ceil(total / lim) });
}

// Live email dispatcher test endpoint
export async function notifyStub(req, res) {
  try {
    const { to = '', smtpConfig = null } = req.body || {};
    const result = await sendTestEmail({ to, smtpConfig });
    res.json(result);
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
}
