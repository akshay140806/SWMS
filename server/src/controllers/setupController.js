import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Settings from '../models/Settings.js';
import { logActivity } from '../utils/activity.js';

export async function status(req, res) {
  const count = await User.countDocuments({});
  res.json({ needsSetup: count === 0 });
}

// First-run setup: creates the organization settings + the admin account. Open only when no users exist.
export async function setup(req, res) {
  const count = await User.countDocuments({});
  if (count > 0) return res.status(403).json({ error: 'Setup is already complete. Sign in as admin to manage users.' });
  const { warehouseName, address, timeZone, currency, name, email, password } = req.body;
  if (!warehouseName || !name || !email || !password) return res.status(400).json({ error: 'This field is required.' });
  if (String(password).length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters and include a number and a symbol.' });
  const exists = await User.findOne({ email: String(email).toLowerCase() });
  if (exists) return res.status(400).json({ error: 'An account with this email already exists.' });
  const user = await User.create({ name, email: String(email).toLowerCase(), passwordHash: await bcrypt.hash(password, 10), role: 'admin' });
  await Settings.findOneAndUpdate(
    { key: 'global' },
    { $set: { warehouseName, address: address || '', timeZone: timeZone || 'Asia/Kolkata', currency: currency || 'INR' } },
    { upsert: true }
  );
  await logActivity({ actor: user._id, action: 'setup.complete', entity: 'Settings', detail: warehouseName });
  const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET || 'change_me_in_production', {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
  res.status(201).json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
}
