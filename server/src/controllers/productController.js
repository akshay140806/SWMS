import mongoose from 'mongoose';
import Product, { availOf } from '../models/Product.js';
import ItemGroup from '../models/ItemGroup.js';
import Location, { locationStatus } from '../models/Location.js';
import StockMovement from '../models/StockMovement.js';
import { emit } from '../socket.js';
import { notifyAll } from '../utils/notify.js';
import { logActivity } from '../utils/activity.js';
import { withTx } from '../utils/tx.js';
import {
  sendStockInwardEmail,
  sendLowStockEmail,
  sendStockDamagedEmail,
  sendStockTransferEmail
} from '../utils/emailService.js';

export function withAvail(p) {
  const o = p.toObject ? p.toObject() : { ...p };
  o.availableQuantity = availOf(p);
  o.lowStock = o.availableQuantity <= (p.reorderLevel ?? 10);
  return o;
}

async function checkLowStock(product, session) {
  const avail = availOf(product);
  if (avail <= (product.reorderLevel ?? 10)) {
    await notifyAll(
      { kind: 'low-stock', message: `Low stock: ${product.name} is down to ${avail} ${product.unit} (reorder level ${product.reorderLevel}).`, link: `/products/${product._id}` },
      session
    );
    emit('low_stock_alert', { sku: product.sku, qty: avail });
    sendLowStockEmail({
      product,
      available: avail,
      reorderLevel: product.reorderLevel ?? 10
    }).catch((err) => console.error('[Email LowStock Error]', err.message));
  }
}

export async function list(req, res) {
  const { q, category, group, status, low, sort = '-updatedAt', page = 1, limit = 25 } = req.query;
  const filter = {};
  if (category) filter.category = category;
  if (group) filter.group = group;
  if (status) filter.status = status;
  if (q) filter.$text = { $search: q };
  const pg = Math.max(1, Number(page));
  const lim = Math.min(100, Math.max(1, Number(limit)));
  const [items, total] = await Promise.all([
    Product.find(filter).populate('defaultLocationId', 'code').sort(sort).skip((pg - 1) * lim).limit(lim),
    Product.countDocuments(filter)
  ]);
  let mapped = items.map(withAvail);
  if (low === 'true') mapped = mapped.filter((p) => p.lowStock);
  res.json({ items: mapped, total, page: pg, pages: Math.ceil(total / lim) });
}

export async function getOne(req, res) {
  const p = await Product.findById(req.params.id).populate('defaultLocationId');
  if (!p) return res.status(404).json({ error: 'Product not found' });
  const [locations, movements] = await Promise.all([
    Location.find({}).sort({ code: 1 }),
    StockMovement.find({ product: p._id }).populate('fromLocation', 'code').populate('toLocation', 'code').populate('performedBy', 'name').sort({ createdAt: -1 }).limit(50)
  ]);
  res.json({ product: withAvail(p), locations, movements: movements.map((m) => m.toObject()) });
}

export async function create(req, res) {
  try {
    const payload = { ...req.body, sku: String(req.body.sku).toUpperCase() };
    if (payload.group && !payload.category) {
      const grp = await ItemGroup.findById(payload.group);
      if (grp) payload.category = grp.name;
    } else if (payload.category && !payload.group) {
      const grp = await ItemGroup.findOne({ name: new RegExp(`^${payload.category.trim()}$`, 'i') });
      if (grp) payload.group = grp._id;
    }
    if (payload.reorderLevel === undefined) {
      const s = await (await import('../models/Settings.js')).default.findOne({ key: 'global' });
      payload.reorderLevel = s?.defaultReorderLevel ?? 10;
    }
    const p = await Product.create(payload);
    await logActivity({ actor: req.user._id, action: 'product.create', entity: 'Product', entityId: String(p._id), detail: p.sku });
    emit('inventory_updated', { sku: p.sku });
    res.status(201).json(withAvail(p));
  } catch (e) {
    if (e.code === 11000) return res.status(400).json({ error: 'SKU already exists.' });
    throw e;
  }
}

export async function update(req, res) {
  try {
    const payload = { ...req.body };
    if (payload.sku) payload.sku = String(payload.sku).toUpperCase();
    if (payload.group && !payload.category) {
      const grp = await ItemGroup.findById(payload.group);
      if (grp) payload.category = grp.name;
    } else if (payload.category) {
      const grp = await ItemGroup.findOne({ name: new RegExp(`^${payload.category.trim()}$`, 'i') });
      if (grp) payload.group = grp._id;
    }

    const existing = await Product.findById(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Product not found' });

    // Handle stock quantity update if provided
    const rawStock = payload.totalQuantity !== undefined ? payload.totalQuantity : payload.stock;
    if (rawStock !== undefined && rawStock !== null && rawStock !== '') {
      const newStock = Number(rawStock);
      if (!isNaN(newStock) && newStock >= 0 && newStock !== existing.totalQuantity) {
        const delta = newStock - (existing.totalQuantity || 0);
        const locId = payload.defaultLocationId || existing.defaultLocationId;
        if (locId && delta !== 0) {
          const loc = await Location.findById(locId);
          if (loc) {
            const newOcc = Math.max(0, loc.occupied + delta);
            await Location.findByIdAndUpdate(loc._id, { $set: { occupied: newOcc, status: locationStatus(newOcc, loc.capacity, loc.status) } });
          }
        }
        await StockMovement.create([{
          product: existing._id,
          type: 'ADJUSTMENT',
          quantity: Math.max(1, Math.abs(delta)),
          fromLocation: delta < 0 ? (locId || undefined) : undefined,
          toLocation: delta > 0 ? (locId || undefined) : undefined,
          performedBy: req.user._id,
          note: `Stock updated directly from ${existing.totalQuantity} to ${newStock}`
        }]);
        payload.totalQuantity = newStock;
      }
    }

    const p = await Product.findByIdAndUpdate(req.params.id, payload, { new: true }).populate('defaultLocationId', 'code');
    await logActivity({ actor: req.user._id, action: 'product.update', entity: 'Product', entityId: String(p._id) });
    emit('inventory_updated', { sku: p.sku });
    res.json(withAvail(p));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function remove(req, res) {
  const p = await Product.findById(req.params.id);
  if (!p) {
    emit('inventory_updated', { type: 'DELETE', id: req.params.id });
    return res.json({ ok: true, message: 'Product already deleted.' });
  }

  // Prevent deletion if reserved in pending sales orders
  if ((p.reservedQuantity || 0) > 0) {
    return res.status(400).json({
      error: `Cannot delete product while ${p.reservedQuantity} units are reserved in active orders. Cancel or dispatch active orders first.`
    });
  }

  // Cleanly free location occupied space if product had remaining stock
  const totalPhysical = p.totalQuantity || 0;
  if (totalPhysical > 0 && p.defaultLocationId) {
    const loc = await Location.findById(p.defaultLocationId);
    if (loc) {
      const newOcc = Math.max(0, loc.occupied - totalPhysical);
      await Location.findByIdAndUpdate(loc._id, {
        $set: { occupied: newOcc, status: locationStatus(newOcc, loc.capacity, loc.status) }
      });
    }
    await StockMovement.create([{
      product: p._id,
      type: 'OUTWARD',
      quantity: totalPhysical,
      fromLocation: p.defaultLocationId,
      performedBy: req.user._id,
      note: `Stock cleared on product deletion (${p.sku})`
    }]).catch(() => {});
  }

  await Product.deleteOne({ _id: p._id });
  await logActivity({ actor: req.user._id, action: 'product.delete', entity: 'Product', entityId: String(p._id), detail: p.sku });
  emit('inventory_updated', { type: 'DELETE', sku: p.sku, id: String(p._id) });
  res.json({ ok: true });
}

function qtyOf(body) {
  return Number(body.qty ?? body.quantity ?? 0);
}

// INWARD — receive goods into a location (capacity-checked, atomic).
export async function inward(req, res) {
  try {
    const qty = qtyOf(req.body);
    const productId = req.params.id || req.body.productId;
    const { locationId, reference = '', note = '', remark = '' } = req.body;
    let result;
    let locCode = '';
    await withTx(async (session) => {
      const product = await Product.findById(productId).session(session);
      if (!product) throw Object.assign(new Error('Page not found'), { status: 404 });
      const locId = locationId || product.defaultLocationId;
      if (!locId) throw Object.assign(new Error('Select a storage location.'), { status: 400 });
      const loc = await Location.findById(locId).session(session);
      if (!loc) throw Object.assign(new Error('Page not found'), { status: 404 });
      if (loc.status === 'blocked') throw Object.assign(new Error('This location is blocked.'), { status: 400 });
      if (loc.occupied + qty > loc.capacity) {
        throw Object.assign(new Error('Location capacity exceeded.'), { status: 400 });
      }
      locCode = loc.code;
      await Product.findByIdAndUpdate(productId, { $inc: { totalQuantity: qty }, $set: { defaultLocationId: loc._id } }, { session });
      const newOcc = loc.occupied + qty;
      await Location.findByIdAndUpdate(loc._id, { $inc: { occupied: qty }, $set: { status: locationStatus(newOcc, loc.capacity, loc.status) } }, { session });
      await StockMovement.create([{ product: productId, type: 'INWARD', quantity: qty, toLocation: loc._id, reference, performedBy: req.user._id, note: note || remark }], { session });
      result = await Product.findById(productId).populate('defaultLocationId', 'code').session(session);
      await checkLowStock(result, session);
      if (newOcc / loc.capacity >= 0.95) {
        await notifyAll({ kind: 'location', message: `Location ${loc.code} is 95% full.`, link: '/locations' }, session);
      }
      await notifyAll({ kind: 'inward', message: `Stock received: ${qty} ${result.unit} of ${result.name} added to ${loc.code}.`, link: '/movements' }, session);
    });
    await logActivity({ actor: req.user._id, action: 'stock.inward', entity: 'Product', entityId: String(productId), detail: `+${qty}` });
    emit('inventory_updated', { productId, type: 'INWARD', qty });
    sendStockInwardEmail({
      product: result,
      qty,
      location: locCode,
      operator: req.user,
      note: note || remark,
      reference
    }).catch((err) => console.error('[Email Inward Error]', err.message));
    res.json(withAvail(result));
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message });
  }
}

// OUTWARD — issue goods (never negative).
export async function outward(req, res) {
  try {
    const qty = qtyOf(req.body);
    const productId = req.params.id || req.body.productId;
    const { locationId, reference = '', note = '', remark = '', reason = '' } = req.body;
    let result;
    await withTx(async (session) => {
      const product = await Product.findById(productId).session(session);
      if (!product) throw Object.assign(new Error('Page not found'), { status: 404 });
      if (availOf(product) < qty) {
        throw Object.assign(new Error(`Insufficient stock. Only ${availOf(product)} available.`), { status: 400 });
      }
      const locId = locationId || product.defaultLocationId;
      let loc = null;
      if (locId) {
        loc = await Location.findById(locId).session(session);
        const newOcc = Math.max(0, (loc?.occupied || 0) - qty);
        if (loc) await Location.findByIdAndUpdate(loc._id, { $inc: { occupied: -qty }, $set: { status: locationStatus(newOcc, loc.capacity, loc.status) } }, { session });
      }
      await Product.findByIdAndUpdate(productId, { $inc: { totalQuantity: -qty } }, { session });
      await StockMovement.create([{ product: productId, type: 'OUTWARD', quantity: qty, fromLocation: loc?._id, reference, performedBy: req.user._id, note: [reason, note || remark].filter(Boolean).join(' — ') }], { session });
      result = await Product.findById(productId).populate('defaultLocationId', 'code').session(session);
      await checkLowStock(result, session);
    });
    await logActivity({ actor: req.user._id, action: 'stock.outward', entity: 'Product', entityId: String(productId), detail: `-${qty}` });
    emit('inventory_updated', { productId, type: 'OUTWARD', qty });
    res.json(withAvail(result));
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message });
  }
}

// TRANSFER — move between locations.
export async function transfer(req, res) {
  try {
    const qty = qtyOf(req.body);
    const productId = req.params.id || req.body.productId;
    const { fromLocationId, toLocationId, note = '', remark = '' } = req.body;
    let result;
    let fromLocCode = '';
    let toLocCode = '';
    await withTx(async (session) => {
      const product = await Product.findById(productId).session(session);
      if (!product) throw Object.assign(new Error('Page not found'), { status: 404 });
      const fromLoc = await Location.findById(fromLocationId || product.defaultLocationId).session(session);
      const toLoc = await Location.findById(toLocationId).session(session);
      if (!fromLoc || !toLoc) throw Object.assign(new Error('Page not found'), { status: 404 });
      if (String(fromLoc._id) === String(toLoc._id)) throw Object.assign(new Error('Source and destination are the same.'), { status: 400 });
      if (toLoc.status === 'blocked') throw Object.assign(new Error('This location is blocked.'), { status: 400 });
      if (toLoc.occupied + qty > toLoc.capacity) throw Object.assign(new Error('Location capacity exceeded.'), { status: 400 });
      if (fromLoc.occupied < qty) throw Object.assign(new Error('Not enough stock at the source location.'), { status: 400 });
      fromLocCode = fromLoc.code;
      toLocCode = toLoc.code;
      const fOcc = fromLoc.occupied - qty;
      const tOcc = toLoc.occupied + qty;
      await Location.findByIdAndUpdate(fromLoc._id, { $inc: { occupied: -qty }, $set: { status: locationStatus(fOcc, fromLoc.capacity, fromLoc.status) } }, { session });
      await Location.findByIdAndUpdate(toLoc._id, { $inc: { occupied: qty }, $set: { status: locationStatus(tOcc, toLoc.capacity, toLoc.status) } }, { session });
      await Product.findByIdAndUpdate(productId, { $set: { defaultLocationId: toLoc._id } }, { session });
      await StockMovement.create([{ product: productId, type: 'TRANSFER', quantity: qty, fromLocation: fromLoc._id, toLocation: toLoc._id, performedBy: req.user._id, note: note || remark }], { session });
      result = await Product.findById(productId).populate('defaultLocationId', 'code').session(session);
    });
    await logActivity({ actor: req.user._id, action: 'stock.transfer', entity: 'Product', entityId: String(productId), detail: `x${qty}` });
    emit('inventory_updated', { productId, type: 'TRANSFER' });
    sendStockTransferEmail({
      product: result,
      qty,
      fromLoc: fromLocCode,
      toLoc: toLocCode,
      operator: req.user,
      note: note || remark
    }).catch((err) => console.error('[Email Transfer Error]', err.message));
    res.json(withAvail(result));
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message });
  }
}

// DAMAGED — remove from sellable, keep counted separately.
export async function markDamaged(req, res) {
  try {
    const qty = qtyOf(req.body);
    const productId = req.params.id || req.body.productId;
    const { locationId, reason = 'Other', note = '', remark = '' } = req.body;
    let result;
    await withTx(async (session) => {
      const product = await Product.findById(productId).session(session);
      if (!product) throw Object.assign(new Error('Page not found'), { status: 404 });
      if (availOf(product) < qty) throw Object.assign(new Error(`Insufficient stock. Only ${availOf(product)} available.`), { status: 400 });
      await Product.findByIdAndUpdate(productId, { $inc: { damagedQuantity: qty } }, { session });
      await StockMovement.create([{ product: productId, type: 'DAMAGED', quantity: qty, fromLocation: locationId || product.defaultLocationId || undefined, performedBy: req.user._id, note: [reason, note || remark].filter(Boolean).join(' — ') }], { session });
      result = await Product.findById(productId).populate('defaultLocationId', 'code').session(session);
      await notifyAll({ kind: 'damage', message: `${qty} units of ${result.name} flagged as damaged by ${req.user.name}.`, link: '/movements' }, session);
      await checkLowStock(result, session);
    });
    await logActivity({ actor: req.user._id, action: 'stock.damaged', entity: 'Product', entityId: String(productId), detail: `damaged x${qty}` });
    emit('inventory_updated', { productId, type: 'DAMAGED', qty });
    sendStockDamagedEmail({
      product: result,
      qty,
      reason,
      location: result.defaultLocationId?.code,
      operator: req.user
    }).catch((err) => console.error('[Email Damaged Error]', err.message));
    res.json(withAvail(result));
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message });
  }
}

// ADJUSTMENT — set counted quantity (Zoho-style inventory adjustment).
// ADJUST — set absolute quantity (stock-taking correction). Writes ADJUSTMENT ledger.
export async function adjust(req, res) {
  try {
    const qty = Number(req.body.qty);
    if (!Number.isInteger(qty) || qty < 0) throw Object.assign(new Error('Quantity must be greater than 0.'), { status: 400 });
    const productId = req.params.id || req.body.productId;
    const { reason = 'Stock-taking correction', note = '' } = req.body;
    let result;
    await withTx(async (session) => {
      const product = await Product.findById(productId).session(session);
      if (!product) throw Object.assign(new Error('Page not found'), { status: 404 });
      const delta = qty - (product.totalQuantity || 0);
      if (product.defaultLocationId && delta !== 0) {
        const loc = await Location.findById(product.defaultLocationId).session(session);
        if (loc) {
          const newOcc = loc.occupied + delta;
          if (newOcc < 0) throw Object.assign(new Error('Adjustment would make location stock negative.'), { status: 400 });
          if (newOcc > loc.capacity) throw Object.assign(new Error('Location capacity exceeded.'), { status: 400 });
          await Location.findByIdAndUpdate(loc._id, { $set: { occupied: newOcc, status: locationStatus(newOcc, loc.capacity, loc.status) } }, { session });
        }
      }
      await Product.findByIdAndUpdate(productId, { $set: { totalQuantity: qty } }, { session });
      await StockMovement.create([{ product: productId, type: 'ADJUSTMENT', quantity: Math.max(1, Math.abs(delta)), fromLocation: delta < 0 ? product.defaultLocationId || undefined : undefined, toLocation: delta > 0 ? product.defaultLocationId || undefined : undefined, performedBy: req.user._id, note: `${reason}${note ? ` — ${note}` : ''} (→ ${qty})` }], { session });
      result = await Product.findById(productId).populate('defaultLocationId', 'code').session(session);
      await checkLowStock(result, session);
    });
    await logActivity({ actor: req.user._id, action: 'stock.adjust', entity: 'Product', entityId: String(productId), detail: `→ ${qty}` });
    emit('inventory_updated', { productId, type: 'ADJUSTMENT', qty });
    res.json(withAvail(result));
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message });
  }
}

export async function exportCsv(req, res) {  const items = await Product.find({}).sort({ sku: 1 });
  const rows = [['SKU', 'Name', 'Category', 'Unit', 'Total', 'Damaged', 'Reserved', 'Available', 'ReorderLevel', 'CostPrice', 'SellingPrice', 'Status']];
  for (const p of items) rows.push([p.sku, p.name, p.category, p.unit, p.totalQuantity, p.damagedQuantity, p.reservedQuantity, availOf(p), p.reorderLevel, p.costPrice, p.sellingPrice, p.status]);
  const csv = rows.map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
  res.header('Content-Type', 'text/csv');
  res.attachment('products.csv');
  res.send(csv);
}

export async function importJson(req, res) {
  const { rows } = req.body;
  if (!Array.isArray(rows) || rows.length === 0) return res.status(400).json({ error: 'No rows to import.' });
  let created = 0;
  const errors = [];
  for (const [i, r] of rows.entries()) {
    try {
      if (!r.sku || !r.name) throw new Error('SKU and name are required.');
      await Product.updateOne(
        { sku: String(r.sku).toUpperCase() },
        { $setOnInsert: { sku: String(r.sku).toUpperCase(), name: r.name, category: r.category || 'General', unit: r.unit || 'pcs', costPrice: Number(r.costPrice) || 0, sellingPrice: Number(r.sellingPrice) || 0, reorderLevel: Number(r.reorderLevel) ?? 10, totalQuantity: 0, damagedQuantity: 0, reservedQuantity: 0, status: 'active' } },
        { upsert: true }
      );
      created++;
    } catch (e) {
      errors.push(`Row ${i + 1}: ${e.message}`);
      if (errors.length > 20) break;
    }
  }
  await logActivity({ actor: req.user._id, action: 'product.import', entity: 'Product', detail: `${created} rows` });
  res.json({ created, errors });
}
