import { Customer, Vendor } from '../models/Party.js';
import { logActivity } from '../utils/activity.js';

function ctrl(Model, entity) {
  return {
    async list(req, res) {
      const { q = '', page = 1, limit = 25 } = req.query;
      const filter = q ? { $or: [{ name: new RegExp(q, 'i') }, { phone: new RegExp(q, 'i') }] } : {};
      const pg = Math.max(1, Number(page));
      const lim = Math.min(100, Math.max(1, Number(limit)));
      const [items, total] = await Promise.all([
        Model.find(filter).sort({ createdAt: -1 }).skip((pg - 1) * lim).limit(lim),
        Model.countDocuments(filter)
      ]);
      res.json({ items, total, page: pg, pages: Math.ceil(total / lim) });
    },
    async create(req, res) {
      const doc = await Model.create(req.body);
      await logActivity({ actor: req.user._id, action: `${entity}.create`, entity, detail: doc.name });
      res.status(201).json(doc);
    },
    async update(req, res) {
      const doc = await Model.findByIdAndUpdate(req.params.id, req.body, { new: true });
      if (!doc) return res.status(404).json({ error: 'Page not found' });
      res.json(doc);
    },
    async remove(req, res) {
      await Model.deleteOne({ _id: req.params.id });
      res.json({ ok: true });
    }
  };
}

export const customers = ctrl(Customer, 'Customer');
export const vendors = ctrl(Vendor, 'Vendor');
