import Vendor from '../models/Vendor.js';
import { logActivity } from '../utils/activity.js';

export async function list(req, res) {
  const { q, page = 1, limit = 25 } = req.query;
  const filter = q ? { $text: { $search: q } } : {};
  const pg = Math.max(1, Number(page));
  const lim = Math.min(100, Math.max(1, Number(limit)));
  const [items, total] = await Promise.all([
    Vendor.find(filter).sort({ createdAt: -1 }).skip((pg - 1) * lim).limit(lim),
    Vendor.countDocuments(filter)
  ]);
  res.json({ items, total, page: pg, pages: Math.ceil(total / lim) });
}

export async function create(req, res) {
  const v = await Vendor.create(req.body);
  await logActivity({ actor: req.user._id, action: 'vendor.create', entity: 'Vendor', entityId: String(v._id), detail: v.name });
  res.status(201).json(v);
}

export async function update(req, res) {
  const v = await Vendor.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!v) return res.status(404).json({ error: 'Page not found' });
  res.json(v);
}
