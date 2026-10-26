import Notification from '../models/Notification.js';

export async function list(req, res) {
  const { tab = 'all', page = 1, limit = 25 } = req.query;
  const filter = { $or: [{ user: null }, { user: req.user._id }] };
  if (tab === 'unread') filter.read = false;
  if (tab === 'alerts') filter.kind = { $in: ['low-stock', 'damage', 'location'] };
  const pg = Math.max(1, Number(page));
  const lim = Math.min(100, Math.max(1, Number(limit)));
  const [items, total, unread] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).skip((pg - 1) * lim).limit(lim),
    Notification.countDocuments(filter),
    Notification.countDocuments({ $or: [{ user: null }, { user: req.user._id }], read: false })
  ]);
  res.json({ items, total, unread, page: pg, pages: Math.ceil(total / lim) });
}

export async function markRead(req, res) {
  await Notification.findByIdAndUpdate(req.params.id, { read: true });
  res.json({ ok: true });
}

export async function markAllRead(req, res) {
  await Notification.updateMany({ $or: [{ user: null }, { user: req.user._id }], read: false }, { read: true });
  res.json({ ok: true });
}

export async function clearAll(req, res) {
  await Notification.deleteMany({ $or: [{ user: null }, { user: req.user._id }] });
  res.json({ ok: true });
}
