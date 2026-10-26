import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export async function auth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'Your session has expired. Please sign in again.' });
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'change_me_in_production');
    const user = await User.findById(payload.id).select('-passwordHash');
    if (!user) return res.status(401).json({ error: 'Your session has expired. Please sign in again.' });
    if (user.active === false) return res.status(403).json({ error: 'Your account is inactive. Contact your administrator.' });
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: 'Your session has expired. Please sign in again.' });
  }
}
