import mongoose from 'mongoose';
import PurchaseOrder from '../models/PurchaseOrder.js';
import Product from '../models/Product.js';
import Location, { locationStatus } from '../models/Location.js';
import StockMovement from '../models/StockMovement.js';
import { nextSeq } from '../models/Counter.js';
import { emit } from '../socket.js';
import { notifyAll } from '../utils/notify.js';
import { logActivity } from '../utils/activity.js';
import { withTx } from '../utils/tx.js';
import { sendPurchaseReceivedEmail } from '../utils/emailService.js';

export async function list(req, res) {
  const { status, page = 1, limit = 25 } = req.query;
  const filter = status ? { status } : {};
  const pg = Math.max(1, Number(page));
  const lim = Math.min(100, Math.max(1, Number(limit)));
  const [items, total] = await Promise.all([
    PurchaseOrder.find(filter).populate('vendor', 'name phone').populate('items.product', 'sku name unit').sort({ createdAt: -1 }).skip((pg - 1) * lim).limit(lim),
    PurchaseOrder.countDocuments(filter)
  ]);
  res.json({ items, total, page: pg, pages: Math.ceil(total / lim) });
}

export async function getOne(req, res) {
  const po = await PurchaseOrder.findById(req.params.id).populate('vendor').populate('items.product').populate('items.location', 'code');
  if (!po) return res.status(404).json({ error: 'Page not found' });
  res.json(po);
}

export async function create(req, res) {
  const { vendorId, vendor, items, expectedDate = null, note = '', status = 'Draft' } = req.body;
  if (!Array.isArray(items) || items.length === 0) return res.status(400).json({ error: 'Add at least one item.' });
  const seq = await nextSeq('po');
  const poNo = `PO-${String(seq).padStart(5, '0')}`;
  const po = await PurchaseOrder.create({
    poNo, vendor: vendorId || vendor, items: items.map((it) => ({ product: it.productId || it.product, qty: Number(it.qty), rate: Number(it.rate) || 0, location: it.locationId || it.location || undefined })),
    status, expectedDate, note, createdBy: req.user._id
  });
  await logActivity({ actor: req.user._id, action: 'po.create', entity: 'PurchaseOrder', entityId: String(po._id), detail: poNo });
  res.status(201).json(po);
}

// RECEIVE — adds stock (INWARD ledger per item). Supports partial receives.
export async function receive(req, res) {
  try {
    const { lines } = req.body; // [{product, qty, locationId?}]
    let poDoc;
    await withTx(async (session) => {
      const po = await PurchaseOrder.findById(req.params.id).populate('items.product').session(session);
      if (!po) throw Object.assign(new Error('Page not found'), { status: 404 });
      if (['Received', 'Cancelled'].includes(po.status)) throw Object.assign(new Error(`PO is already ${po.status}.`), { status: 400 });
      const toReceive = Array.isArray(lines) && lines.length ? lines : po.items.filter((i) => i.receivedQty < i.qty).map((i) => ({ product: String(i.product._id || i.product), qty: i.qty - i.receivedQty, locationId: i.location ? String(i.location) : undefined }));
      for (const ln of toReceive) {
        const qty = Number(ln.qty);
        if (!qty || qty <= 0) continue;
        const item = po.items.find((i) => String(i.product._id || i.product) === String(ln.product));
        if (!item) throw Object.assign(new Error('Item not in this purchase order.'), { status: 400 });
        if (item.receivedQty + qty > item.qty) throw Object.assign(new Error('Cannot receive more than ordered.'), { status: 400 });
        const p = await Product.findById(item.product._id || item.product).session(session);
        const locId = ln.locationId || item.location || p.defaultLocationId;
        if (!locId) throw Object.assign(new Error('Select a storage location.'), { status: 400 });
        const loc = await Location.findById(locId).session(session);
        if (!loc || loc.status === 'blocked') throw Object.assign(new Error('Location unavailable.'), { status: 400 });
        if (loc.occupied + qty > loc.capacity) throw Object.assign(new Error('Location capacity exceeded.'), { status: 400 });
        await Product.findByIdAndUpdate(p._id, { $inc: { totalQuantity: qty }, $set: { defaultLocationId: loc._id } }, { session });
        const newOcc = loc.occupied + qty;
        await Location.findByIdAndUpdate(loc._id, { $inc: { occupied: qty }, $set: { status: locationStatus(newOcc, loc.capacity, loc.status) } }, { session });
        await StockMovement.create([{ product: p._id, type: 'INWARD', quantity: qty, toLocation: loc._id, reference: po.poNo, performedBy: req.user._id, note: `purchase receive ${po.poNo}` }], session ? { session } : {});
        item.receivedQty += qty;
      }
      const allDone = po.items.every((i) => i.receivedQty >= i.qty);
      const anyDone = po.items.some((i) => i.receivedQty > 0);
      po.status = allDone ? 'Received' : anyDone ? 'Partially Received' : po.status === 'Draft' ? 'Ordered' : po.status;
      if (allDone) po.receivedAt = new Date();
      await po.save(session ? { session } : {});
      await notifyAll({ kind: 'inward', message: `Purchase received against ${po.poNo}.`, link: '/purchases' }, session);
      poDoc = po;
    });
    await logActivity({ actor: req.user._id, action: 'po.receive', entity: 'PurchaseOrder', entityId: String(poDoc._id), detail: poDoc.poNo });
    emit('inventory_updated', { type: 'INWARD', poNo: poDoc.poNo });
    const totalReceived = Array.isArray(lines) && lines.length
      ? lines.reduce((s, l) => s + Number(l.qty || 0), 0)
      : (poDoc.items || []).reduce((s, i) => s + Number(i.receivedQty || 0), 0);
    sendPurchaseReceivedEmail({
      poNo: poDoc.poNo,
      grnNo: '',
      vendorName: poDoc.vendor?.name || poDoc.vendorName || 'Vendor',
      itemsCount: poDoc.items?.length || 0,
      totalQty: totalReceived,
      operator: req.user
    }).catch((err) => console.error('[Email Purchase Error]', err.message));
    res.json(poDoc);
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message });
  }
}

// RECEIVE via /pos contract: { items:[{product, qty}], locationId } → 201 + grnNo.
export async function receiveGRN(req, res) {
  const { items = [], locationId } = req.body;
  const lines = items.map((it) => ({ product: it.product, qty: it.qty, locationId: it.locationId || locationId }));
  try {
    let grnNo;
    let poDoc;
    await withTx(async (session) => {
      const po = await PurchaseOrder.findById(req.params.id).session(session);
      if (!po) throw Object.assign(new Error('Page not found'), { status: 404 });
      if (['Received', 'Cancelled'].includes(po.status)) throw Object.assign(new Error(`PO is already ${po.status}.`), { status: 400 });
      for (const ln of lines) {
        const qty = Number(ln.qty);
        if (!Number.isInteger(qty) || qty <= 0) throw Object.assign(new Error('Quantity must be greater than 0.'), { status: 400 });
        const item = po.items.find((i) => String(i.product) === String(ln.product));
        if (!item) throw Object.assign(new Error('Item not in this purchase order.'), { status: 400 });
        if (item.receivedQty + qty > item.qty) throw Object.assign(new Error('Cannot receive more than ordered.'), { status: 400 });
        const p = await Product.findById(item.product).session(session);
        const locId = ln.locationId || item.location || p.defaultLocationId;
        if (!locId) throw Object.assign(new Error('Select a storage location.'), { status: 400 });
        const loc = await Location.findById(locId).session(session);
        if (!loc || loc.status === 'blocked') throw Object.assign(new Error('Location unavailable.'), { status: 400 });
        if (loc.occupied + qty > loc.capacity) throw Object.assign(new Error('Location capacity exceeded.'), { status: 400 });
        await Product.findByIdAndUpdate(p._id, { $inc: { totalQuantity: qty }, $set: { defaultLocationId: loc._id } }, { session });
        const newOcc = loc.occupied + qty;
        await Location.findByIdAndUpdate(loc._id, { $inc: { occupied: qty }, $set: { status: locationStatus(newOcc, loc.capacity, loc.status) } }, { session });
        await StockMovement.create([{ product: p._id, type: 'INWARD', quantity: qty, toLocation: loc._id, reference: po.poNo, performedBy: req.user._id, note: `purchase receive ${po.poNo}` }], session ? { session } : {});
        item.receivedQty += qty;
      }
      const seq = await nextSeq('grn', session);
      grnNo = `GRN-${String(seq).padStart(5, '0')}`;
      po.grns.push({ grnNo, items: lines.map((l) => ({ product: l.product, qty: Number(l.qty) })) });
      const allDone = po.items.every((i) => i.receivedQty >= i.qty);
      const anyDone = po.items.some((i) => i.receivedQty > 0);
      po.status = allDone ? 'Received' : anyDone ? 'Partially Received' : po.status === 'Draft' ? 'Ordered' : po.status;
      if (allDone) po.receivedAt = new Date();
      await po.save(session ? { session } : {});
      poDoc = po;
    });
    await logActivity({ actor: req.user._id, action: 'po.receive', entity: 'PurchaseOrder', entityId: String(req.params.id), detail: grnNo });
    emit('inventory_updated', { type: 'INWARD', grnNo });
    sendPurchaseReceivedEmail({
      poNo: poDoc.poNo,
      grnNo,
      vendorName: poDoc.vendor?.name || poDoc.vendorName || 'Vendor',
      itemsCount: poDoc.items?.length || 0,
      totalQty: Array.isArray(lines) ? lines.reduce((s, l) => s + Number(l.qty || 0), 0) : 0,
      operator: req.user
    }).catch((err) => console.error('[Email GRN Error]', err.message));
    res.status(201).json({ grnNo, poId: req.params.id });
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message });
  }
}

export async function setStatus(req, res) {
  const { status } = req.body;
  if (!['Draft', 'Ordered', 'Cancelled'].includes(status)) return res.status(400).json({ error: 'Invalid status.' });
  const po = await PurchaseOrder.findById(req.params.id);
  if (!po) return res.status(404).json({ error: 'Page not found' });
  if (['Received', 'Partially Received'].includes(po.status) && status === 'Cancelled') {
    return res.status(400).json({ error: 'Cannot cancel a received purchase order.' });
  }
  po.status = status;
  await po.save();
  res.json(po);
}
