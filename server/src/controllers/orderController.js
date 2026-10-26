import mongoose from 'mongoose';
import Order from '../models/Order.js';
import Product, { availOf } from '../models/Product.js';
import Location, { locationStatus } from '../models/Location.js';
import StockMovement from '../models/StockMovement.js';
import { nextSeq } from '../models/Counter.js';
import { sortPickingList } from '../utils/picking.js';
import { createShipment } from './fulfilController.js';
import { emit } from '../socket.js';
import { notifyAll } from '../utils/notify.js';
import { logActivity } from '../utils/activity.js';
import { withAvail } from './productController.js';
import { withTx } from '../utils/tx.js';
import { sendOrderCreatedEmail, sendPickingGeneratedEmail, sendOrderDispatchedEmail } from '../utils/emailService.js';

async function buildPickingList(order) {
  const rows = [];
  for (const it of order.items) {
    const p = await Product.findById(it.product).populate('defaultLocationId', 'code');
    rows.push({
      location: p?.defaultLocationId?.code || it.location || '',
      sku: p?.sku || '',
      name: p?.name || '',
      qty: it.qty,
      picked: it.pickedQty || 0
    });
  }
  return sortPickingList(rows);
}

export async function list(req, res) {
  const { status, q, page = 1, limit = 25 } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (q) filter.$or = [{ orderNo: new RegExp(q, 'i') }, { customerName: new RegExp(q, 'i') }];
  const pg = Math.max(1, Number(page));
  const lim = Math.min(100, Math.max(1, Number(limit)));
  const [items, total] = await Promise.all([
    Order.find(filter).populate('items.product', 'sku name unit').sort({ createdAt: -1 }).skip((pg - 1) * lim).limit(lim),
    Order.countDocuments(filter)
  ]);
  res.json({ items, total, page: pg, pages: Math.ceil(total / lim) });
}

function orderQuery(idOrNo) {
  if (mongoose.Types.ObjectId.isValid(idOrNo)) {
    return { _id: idOrNo };
  }
  return { orderNo: idOrNo };
}

export async function getOne(req, res) {
  const order = await Order.findOne(orderQuery(req.params.id))
    .populate('customer', 'name phone email address gstin')
    .populate('items.product')
    .populate('createdBy', 'name')
    .populate('dispatchedBy', 'name');
  if (!order) return res.status(404).json({ error: 'Order not found' });
  res.json(order);
}

// CREATE — validate available stock and RESERVE it (reservedQuantity += qty).
export async function create(req, res) {
  try {
    const { customerId, customer: custOid, customerName, customerPhone = '', deliveryAddress = '', instructions = '', items } = req.body;
    const custRef = customerId || custOid || undefined;
    let order;
    let enriched = [];
    await withTx(async (session) => {
      const seq = await nextSeq('order', session);
      const orderNo = `ORD-${String(seq).padStart(5, '0')}`;
      enriched = [];
      for (const it of items) {
        const pid = it.productId || it.product;
        const qty = Number(it.qty ?? it.quantity ?? 0);
        const p = await Product.findById(pid).populate('defaultLocationId', 'code').session(session);
        if (!p) throw Object.assign(new Error('Product not found'), { status: 404 });
        if (p.status !== 'active') throw Object.assign(new Error(`${p.sku} is inactive.`), { status: 400 });
        if (availOf(p) < qty) throw Object.assign(new Error(`Only ${availOf(p)} available. Reduce the quantity.`), { status: 400 });
        await Product.findByIdAndUpdate(pid, { $inc: { reservedQuantity: qty } }, { session });
        enriched.push({ product: p._id, qty, location: p.defaultLocationId?.code || '' });
      }
      [order] = await Order.create(
        [{ orderNo, customer: custRef, customerName, customerPhone, deliveryAddress, instructions, items: enriched, status: 'Created', createdBy: req.user._id }],
        session ? { session } : {}
      );
      await notifyAll({ kind: 'order', message: `New order ${orderNo} created for ${customerName}.`, link: `/orders/${order._id}` }, session);
    });
    await logActivity({ actor: req.user._id, action: 'order.create', entity: 'Order', entityId: String(order._id), detail: order.orderNo });
    emit('order_created', { orderId: order._id, orderNo: order.orderNo });
    emit('inventory_updated', { type: 'order_created', orderNo: order.orderNo });
    sendOrderCreatedEmail({
      order,
      customerName,
      items: enriched,
      totalUnits: enriched.reduce((s, i) => s + i.qty, 0)
    }).catch((err) => console.error('[Email OrderCreate Error]', err.message));
    res.status(201).json(order);
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message });
  }
}

async function setStatus(orderId, to, user) {
  const FLOW = ['Created', 'Picking', 'Picked', 'Dispatched', 'Delivered'];
  const order = await Order.findOne(orderQuery(orderId));
  if (!order) throw Object.assign(new Error('Order not found'), { status: 404 });
  if (order.status === 'Cancelled' || order.status === 'Delivered') {
    throw Object.assign(new Error(`Order is already ${order.status}.`), { status: 400 });
  }
  const fromIdx = FLOW.indexOf(order.status);
  const toIdx = FLOW.indexOf(to);
  if (toIdx < 0 || toIdx > fromIdx + 1) throw Object.assign(new Error(`Cannot move from ${order.status} to ${to}.`), { status: 400 });
  if (to === 'Picking') {
    order.pickingList = await buildPickingList(order);
  }
  if (to === 'Picked') {
    order.items = order.items.map((it) => ({ ...it.toObject(), pickedQty: it.qty }));
  }
  order.status = to;
  await order.save();
  await logActivity({ actor: user._id, action: `order.${to.toLowerCase()}`, entity: 'Order', entityId: String(order._id), detail: order.orderNo });
  emit('order_updated', { orderId: order._id, orderNo: order.orderNo, status: to });
  return order;
}

export async function toPicking(req, res) {
  try {
    const order = await setStatus(req.params.id, 'Picking', req.user);
    const populated = await Order.findById(order._id).populate('items.product', 'sku name unit');
    sendPickingGeneratedEmail({
      order: populated,
      pickerName: req.user.name,
      totalItems: populated.items.length
    }).catch((err) => console.error('[Email Picking Error]', err.message));
    res.json({ order: populated, pickingList: order.pickingList });
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message });
  }
}

export async function toPicked(req, res) {
  try {
    const order = await setStatus(req.params.id, 'Picked', req.user);
    res.json(order);
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message });
  }
}

export async function toDelivered(req, res) {
  try {
    const order = await setStatus(req.params.id, 'Delivered', req.user);
    res.json(order);
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message });
  }
}

// DISPATCH — deduct stock, write OUTWARD ledger, release reservation.
export async function dispatch(req, res) {
  try {
    const { carrier = '', trackingNo = '', dispatchNotes = '' } = req.body || {};
    let orderDoc;
    await withTx(async (session) => {
      const order = await Order.findOne(orderQuery(req.params.id)).session(session);
      if (!order) throw Object.assign(new Error('Order not found'), { status: 404 });
      if (!['Created', 'Picking', 'Picked'].includes(order.status)) {
        throw Object.assign(new Error(`Cannot dispatch an order that is ${order.status}.`), { status: 400 });
      }
      for (const it of order.items) {
        const p = await Product.findById(it.product).session(session);
        if (!p) throw Object.assign(new Error('Product not found'), { status: 400 });
        if (p.reservedQuantity < it.qty) throw Object.assign(new Error(`Reservation mismatch for ${p.sku}.`), { status: 400 });
        if (p.totalQuantity - p.damagedQuantity < it.qty) {
          throw Object.assign(new Error(`Insufficient stock. Only ${availOf(p)} available.`), { status: 400 });
        }
        await Product.findByIdAndUpdate(p._id, { $inc: { totalQuantity: -it.qty, reservedQuantity: -it.qty } }, { session });
        if (p.defaultLocationId) {
          const loc = await Location.findById(p.defaultLocationId).session(session);
          if (loc) {
            const newOcc = Math.max(0, loc.occupied - it.qty);
            await Location.findByIdAndUpdate(loc._id, { $inc: { occupied: -Math.min(it.qty, loc.occupied) }, $set: { status: locationStatus(newOcc, loc.capacity, loc.status) } }, { session });
          }
        }
        await StockMovement.create([{ product: p._id, type: 'OUTWARD', quantity: it.qty, fromLocation: p.defaultLocationId || undefined, reference: order.orderNo, performedBy: req.user._id, note: `dispatch ${order.orderNo}` }], session ? { session } : {});
      }
      order.status = 'Dispatched';
      order.carrier = carrier;
      order.trackingNo = trackingNo;
      order.dispatchNotes = dispatchNotes;
      order.dispatchedBy = req.user._id;
      order.dispatchedAt = new Date();
      await order.save(session ? { session } : {});
      // Auto-create the shipment record (packages + carrier/tracking) in the same transaction.
      await createShipment(order, { carrier, trackingNo, packages: [] }, req.user._id, session);
      // Auto-create the shipment (delivery challan source) in the same transaction.
      const { Shipment } = await import('../models/Fulfil.js');
      const sseq = await nextSeq('shp', session);
      await Shipment.create([{
        shipmentNo: `SHP-${String(sseq).padStart(5, '0')}`,
        order: order._id, packages: [], carrier, trackingNo,
        status: 'Shipped', shippedBy: req.user._id
      }], session ? { session } : {});
      await notifyAll({ kind: 'dispatch', message: `Order ${order.orderNo} has been dispatched.`, link: `/orders/${order._id}` }, session);
      orderDoc = order;
    });
    await logActivity({ actor: req.user._id, action: 'order.dispatch', entity: 'Order', entityId: String(orderDoc._id), detail: orderDoc.orderNo });
    emit('order_dispatched', { orderId: orderDoc._id, orderNo: orderDoc.orderNo });
    emit('inventory_updated', { type: 'dispatch', orderNo: orderDoc.orderNo });
    sendOrderDispatchedEmail({
      order: orderDoc,
      carrier,
      trackingNo,
      operator: req.user,
      dispatchNotes
    }).catch((err) => console.error('[Email Dispatch Error]', err.message));
    res.json(await Order.findById(orderDoc._id).populate('items.product', 'sku name unit'));
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message });
  }
}

// CANCEL — release reserved stock.
export async function cancel(req, res) {
  try {
    let orderDoc;
    await withTx(async (session) => {
      const order = await Order.findOne(orderQuery(req.params.id)).session(session);
      if (!order) throw Object.assign(new Error('Order not found'), { status: 404 });
      if (['Dispatched', 'Delivered', 'Cancelled'].includes(order.status)) {
        throw Object.assign(new Error(`Cannot cancel an order that is ${order.status}.`), { status: 400 });
      }
      for (const it of order.items) {
        await Product.findByIdAndUpdate(it.product, { $inc: { reservedQuantity: -Math.min(it.qty, (await Product.findById(it.product).session(session)).reservedQuantity) } }, { session });
      }
      order.status = 'Cancelled';
      await order.save(session ? { session } : {});
      orderDoc = order;
    });
    await logActivity({ actor: req.user._id, action: 'order.cancel', entity: 'Order', entityId: String(orderDoc._id), detail: orderDoc.orderNo });
    emit('order_updated', { orderId: orderDoc._id, orderNo: orderDoc.orderNo, status: 'Cancelled' });
    emit('inventory_updated', { type: 'order_cancelled', orderNo: orderDoc.orderNo });
    res.json(orderDoc);
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message });
  }
}

export async function pickingList(req, res) {
  const order = await Order.findOne(orderQuery(req.params.id)).populate('items.product', 'sku name unit');
  if (!order) return res.status(404).json({ error: 'Order not found' });
  const list = order.pickingList?.length ? order.pickingList : await buildPickingList(order);
  res.json({ orderNo: order.orderNo, status: order.status, pickingList: list });
}

export async function history(req, res) {
  const { status } = req.query;
  const filter = status ? { status } : { status: { $in: ['Dispatched', 'Delivered', 'Cancelled'] } };
  const items = await Order.find(filter).populate('items.product', 'sku name').sort({ updatedAt: -1 }).limit(100);
  res.json({ items });
}

export async function update(req, res) {
  try {
    const { customerName, customerPhone, deliveryAddress, instructions, carrier, trackingNo, dispatchNotes } = req.body;
    const order = await Order.findOne(orderQuery(req.params.id));
    if (!order) return res.status(404).json({ error: 'Order not found' });

    if (customerName !== undefined) order.customerName = customerName;
    if (customerPhone !== undefined) order.customerPhone = customerPhone;
    if (deliveryAddress !== undefined) order.deliveryAddress = deliveryAddress;
    if (instructions !== undefined) order.instructions = instructions;
    if (carrier !== undefined) order.carrier = carrier;
    if (trackingNo !== undefined) order.trackingNo = trackingNo;
    if (dispatchNotes !== undefined) order.dispatchNotes = dispatchNotes;

    await order.save();
    await logActivity({ actor: req.user._id, action: 'order.update', entity: 'Order', entityId: String(order._id), detail: order.orderNo });
    emit('order_updated', { orderId: order._id, orderNo: order.orderNo, status: order.status });
    res.json(await Order.findById(order._id).populate('items.product', 'sku name unit'));
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message });
  }
}

export { withAvail };
