import Customer from '../models/Customer.js';
import { logActivity } from '../utils/activity.js';

export async function list(req, res) {
  const { q, page = 1, limit = 25 } = req.query;
  const filter = q
    ? {
        $or: [
          { name: new RegExp(q, 'i') },
          { phone: new RegExp(q, 'i') },
          { email: new RegExp(q, 'i') }
        ]
      }
    : {};
  const pg = Math.max(1, Number(page));
  const lim = Math.min(100, Math.max(1, Number(limit)));
  const [items, total] = await Promise.all([
    Customer.find(filter).sort({ createdAt: -1 }).skip((pg - 1) * lim).limit(lim),
    Customer.countDocuments(filter)
  ]);
  res.json({ items, total, page: pg, pages: Math.ceil(total / lim) });
}

export async function create(req, res) {
  const c = await Customer.create(req.body);
  await logActivity({ actor: req.user._id, action: 'customer.create', entity: 'Customer', entityId: String(c._id), detail: c.name });
  res.status(201).json(c);
}

export async function update(req, res) {
  const c = await Customer.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!c) return res.status(404).json({ error: 'Page not found' });
  res.json(c);
}
