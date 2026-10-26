import Location, { locationStatus } from '../models/Location.js';
import Product, { availOf } from '../models/Product.js';
import { logActivity } from '../utils/activity.js';
import { withTx } from '../utils/tx.js';

export async function list(req, res) {
  const { zone, status } = req.query;
  const filter = {};
  if (zone) filter.zone = zone;
  if (status) filter.status = status;
  const items = await Location.find(filter).sort({ code: 1 });
  const totalCapacity = items.reduce((s, l) => s + l.capacity, 0);
  const totalOccupied = items.reduce((s, l) => s + l.occupied, 0);
  res.json({ items, totalCapacity, totalOccupied });
}

export async function create(req, res) {
  try {
    const payload = { ...req.body, code: String(req.body.code).toUpperCase() };
    const loc = await Location.create(payload);
    await logActivity({ actor: req.user._id, action: 'location.create', entity: 'Location', entityId: String(loc._id), detail: loc.code });
    res.status(201).json(loc);
  } catch (e) {
    if (e.code === 11000) return res.status(400).json({ error: 'Location code already exists.' });
    throw e;
  }
}

export async function contents(req, res) {
  const loc = await Location.findById(req.params.id);
  if (!loc) return res.status(404).json({ error: 'Page not found' });
  const products = await Product.find({ defaultLocationId: loc._id });
  res.json({ location: loc, products: products.map((p) => ({ id: p._id, sku: p.sku, name: p.name, totalQuantity: p.totalQuantity, available: availOf(p), unit: p.unit })) });
}

export async function assign(req, res) {
  // Assign a product (and its quantity) to a location without changing totals.
  try {
    const { productId, locationId, qty = 0 } = req.body;
    let result;
    await withTx(async (session) => {
      const loc = await Location.findById(locationId).session(session);
      if (!loc) throw Object.assign(new Error('Page not found'), { status: 404 });
      if (loc.status === 'blocked') throw Object.assign(new Error('This location is blocked.'), { status: 400 });
      if (loc.occupied + qty > loc.capacity) throw Object.assign(new Error('Location capacity exceeded.'), { status: 400 });
      const product = await Product.findById(productId).session(session);
      if (!product) throw Object.assign(new Error('Page not found'), { status: 404 });
      // Move occupancy bookkeeping from old default location if different.
      if (product.defaultLocationId && String(product.defaultLocationId) !== String(loc._id) && qty > 0) {
        const old = await Location.findById(product.defaultLocationId).session(session);
        if (old) {
          const occ = Math.max(0, old.occupied - qty);
          await Location.findByIdAndUpdate(old._id, { $inc: { occupied: -Math.min(qty, old.occupied) }, $set: { status: locationStatus(occ, old.capacity, old.status) } }, { session });
        }
      }
      const newOcc = loc.occupied + qty;
      await Location.findByIdAndUpdate(loc._id, { $inc: { occupied: qty }, $set: { status: locationStatus(newOcc, loc.capacity, loc.status) } }, { session });
      await Product.findByIdAndUpdate(productId, { $set: { defaultLocationId: loc._id } }, { session });
      result = await Location.findById(loc._id).session(session);
    });
    res.json(result);
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message });
  }
}

export async function qr(req, res) {
  const loc = await Location.findById(req.params.id);
  if (!loc) return res.status(404).json({ error: 'Page not found' });
  const { default: QRCode } = await import('qrcode');
  const payload = `WMS:LOC:${loc.code}`;
  const dataUrl = await QRCode.toDataURL(payload, { margin: 1, width: 256 });
  res.json({ code: loc.code, payload, dataUrl });
}
