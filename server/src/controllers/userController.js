import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { logActivity } from '../utils/activity.js';

const safe = (u) => ({ id: u._id, name: u.name, email: u.email, role: u.role, active: u.active, lastActiveAt: u.lastActiveAt, createdAt: u.createdAt });

export async function list(req, res) {
  const users = await User.find({}).sort({ createdAt: -1 }).select('-passwordHash');
  res.json({ items: users.map(safe) });
}

export async function create(req, res) {
  const { name, email, password, role } = req.body;
  const exists = await User.findOne({ email: email.toLowerCase() });
  if (exists) return res.status(400).json({ error: 'An account with this email already exists.' });
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({ name, email: email.toLowerCase(), passwordHash, role });
  await logActivity({ actor: req.user._id, action: 'user.create', entity: 'User', entityId: String(user._id), detail: email });
  res.status(201).json(safe(user));
}

export async function update(req, res) {
  const { name, role } = req.body;
  const user = await User.findByIdAndUpdate(req.params.id, { ...(name && { name }), ...(role && { role }) }, { new: true }).select('-passwordHash');
  if (!user) return res.status(404).json({ error: 'Page not found' });
  res.json(safe(user));
}

export async function setActive(req, res) {
  const { active } = req.body;
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ error: 'Page not found' });
  if (String(user._id) === String(req.user._id)) return res.status(400).json({ error: 'You cannot deactivate your own account.' });
  user.active = !!active;
  await user.save();
  res.json(safe(user));
}

export async function resetPassword(req, res) {
  const { password } = req.body;
  if (!password || password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters and include a number and a symbol.' });
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ error: 'Page not found' });
  user.passwordHash = await bcrypt.hash(password, 10);
  await user.save();
  await logActivity({ actor: req.user._id, action: 'user.resetPassword', entity: 'User', entityId: String(user._id) });
  res.json({ ok: true });
}
