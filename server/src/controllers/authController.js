import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { logActivity } from '../utils/activity.js';

function sign(user) {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET || 'change_me_in_production',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

const safe = (u) => ({ id: u._id, name: u.name, email: u.email, role: u.role, active: u.active });

export async function register(req, res) {
  const { name, email, password, confirmPassword, role } = req.body;
  if (confirmPassword && confirmPassword !== password) {
    return res.status(400).json({ error: 'Passwords do not match.' });
  }
  const allowedRoles = ['admin', 'warehouse_staff', 'dispatch_staff'];
  const finalRole = allowedRoles.includes(role) ? role : 'warehouse_staff';
  const exists = await User.findOne({ email: email.toLowerCase() });
  if (exists) return res.status(400).json({ error: 'An account with this email already exists.' });
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({ name, email: email.toLowerCase(), passwordHash, role: finalRole });
  await logActivity({ actor: user._id, action: 'auth.register', entity: 'User', entityId: String(user._id) });
  res.status(201).json({ token: sign(user), user: safe(user) });
}

export async function googleLogin(req, res) {
  try {
    const { email, name, role = 'admin' } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required for Google Sign-In.' });

    let user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      const allowedRoles = ['admin', 'warehouse_staff', 'dispatch_staff'];
      const finalRole = allowedRoles.includes(role) ? role : 'admin';
      const randomPw = Math.random().toString(36).slice(-10) + 'A1!';
      const passwordHash = await bcrypt.hash(randomPw, 10);
      user = await User.create({
        name: name || email.split('@')[0],
        email: email.toLowerCase(),
        passwordHash,
        role: finalRole,
        active: true
      });
      await logActivity({ actor: user._id, action: 'auth.google_register', entity: 'User', entityId: String(user._id) });
    } else {
      if (user.active === false) {
        return res.status(403).json({ error: 'Your account is inactive. Contact your administrator.' });
      }
      user.lastActiveAt = new Date();
      await user.save();
      await logActivity({ actor: user._id, action: 'auth.google_login', entity: 'User', entityId: String(user._id) });
    }

    res.json({ token: sign(user), user: safe(user) });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Google authentication failed.' });
  }
}

export async function login(req, res) {
  const { email, password } = req.body;
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) return res.status(401).json({ error: 'Incorrect email or password. Please try again.' });
  if (user.active === false) return res.status(403).json({ error: 'Your account is inactive. Contact your administrator.' });
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: 'Incorrect email or password. Please try again.' });
  user.lastActiveAt = new Date();
  await user.save();
  await logActivity({ actor: user._id, action: 'auth.login', entity: 'User', entityId: String(user._id) });
  res.json({ token: sign(user), user: safe(user) });
}

export async function logout(req, res) {
  await logActivity({ actor: req.user._id, action: 'auth.logout', entity: 'User', entityId: String(req.user._id) });
  res.json({ ok: true });
}

export async function me(req, res) {
  res.json({ user: safe(req.user) });
}
