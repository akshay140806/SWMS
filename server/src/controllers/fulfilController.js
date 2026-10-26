import mongoose from 'mongoose';
import { Package, Shipment, SalesReturn } from '../models/Fulfil.js';
import Order from '../models/Order.js';
import Product, { availOf } from '../models/Product.js';
import StockMovement from '../models/StockMovement.js';
import { nextSeq } from '../models/Counter.js';
import { emit } from '../socket.js';
import { logActivity } from '../utils/activity.js';
import { withTx } from '../utils/tx.js';
import { sendPackageCreatedEmail, sendShipmentCreatedEmail, sendSalesReturnEmail } from '../utils/emailService.js';

// PACK — snapshot picked items of a Picked order into a package.
export async function packOrder(req, res) {
  const order = await Order.findById(req.params.id).populate('items.product', 'sku name');
  if (!order) return res.status(404).json({ error: 'Page not found' });
  if (!['Picked', 'Picking'].includes(order.status)) return res.status(400).json({ error: 'Only picked orders can be packed.' });
  const seq = await nextSeq('pkg');
  const doc = await Package.create({
    packageNo: `PKG-${String(seq).padStart(5, '0')}`,
    order: order._id,
    items: order.items.map((i) => ({ product: i.product._id || i.product, qty: i.qty })),
    weight: Number(req.body.weight) || 0,
    packedBy: req.user._id
  });
  await logActivity({ actor: req.user._id, action: 'package.pack', entity: 'Package', entityId: String(doc._id), detail: doc.packageNo });
  sendPackageCreatedEmail({
    packageNo: doc.packageNo,
    orderNo: order.orderNo,
    weight: doc.weight,
    itemsCount: doc.items.length,
    operator: req.user
  }).catch((err) => console.error('[Email Package Error]', err.message));
  res.status(201).json(doc);
}

export async function listPackages(req, res) {
  const items = await Package.find({}).populate('order', 'orderNo customerName').sort({ createdAt: -1 }).limit(100);
  res.json({ items });
}

// SHIP — called automatically on dispatch; also listable.
export async function createShipment(order, { carrier = '', trackingNo = '', packages = [] }, userId, session = null) {
  const seq = await nextSeq('shp', session);
  const docs = await Shipment.create(
    [{ shipmentNo: `SHP-${String(seq).padStart(5, '0')}`, order: order._id, packages, carrier, trackingNo, status: 'Shipped', shippedBy: userId }],
    session ? { session } : {}
  );
  const shipmentDoc = Array.isArray(docs) ? docs[0] : docs;
  sendShipmentCreatedEmail({
    shipmentNo: shipmentDoc.shipmentNo,
    orderNo: order.orderNo,
    customerName: order.customerName,
    carrier,
    trackingNo,
    operator: { name: 'Dispatch Staff' }
  }).catch((err) => console.error('[Email Shipment Error]', err.message));
  return shipmentDoc;
}

export async function listShipments(req, res) {
  const items = await Shipment.find({}).populate('order', 'orderNo customerName status').sort({ createdAt: -1 }).limit(100);
  res.json({ items });
}

// Delivery challan payload (printable): shipment + order + items.
export async function challan(req, res) {
  const sh = await Shipment.findById(req.params.id).populate({ path: 'order', populate: { path: 'items.product', select: 'sku name unit' } });
  if (!sh) return res.status(404).json({ error: 'Page not found' });
  res.json({ shipment: sh });
}

// SALES RETURN — restock returned units (INWARD ledger).
export async function createReturn(req, res) {
  try {
    let { orderId, customerName = '', items, reason = 'Other' } = req.body;
    if (orderId === '__no_order__' || !orderId) orderId = undefined;
    let doc;
    await withTx(async (session) => {
      if (orderId) {
        const Order = (await import('../models/Order.js')).default;
        const ord = await Order.findById(orderId).session(session);
        if (ord && !customerName) customerName = ord.customerName;
      }
      customerName = (customerName || '').trim() || 'Walk-in Customer';

      for (const it of items) {
        const qty = Number(it.qty);
        if (!Number.isInteger(qty) || qty <= 0) throw Object.assign(new Error('Quantity must be greater than 0.'), { status: 400 });
        const p = await Product.findById(it.product).session(session);
        if (!p) throw Object.assign(new Error('Page not found'), { status: 404 });
        await Product.findByIdAndUpdate(it.product, { $inc: { totalQuantity: it.qty } }, { session });
        if (p.defaultLocationId) {
          const Location = (await import('../models/Location.js')).default;
          const { locationStatus } = await import('../models/Location.js');
          const loc = await Location.findById(p.defaultLocationId).session(session);
          if (loc) {
            const newOcc = loc.occupied + it.qty;
            if (newOcc > loc.capacity) throw Object.assign(new Error('Location capacity exceeded.'), { status: 400 });
            await Location.findByIdAndUpdate(loc._id, { $inc: { occupied: it.qty }, $set: { status: locationStatus(newOcc, loc.capacity, loc.status) } }, { session });
          }
        }
        await StockMovement.create([{ product: it.product, type: 'INWARD', quantity: it.qty, performedBy: req.user._id, note: `sales return: ${reason}` }], session ? { session } : {});
      }
      const seq = await nextSeq('ret', session);
      [doc] = await SalesReturn.create([{ returnNo: `SR-${String(seq).padStart(5, '0')}`, order: orderId || undefined, customerName, items, reason, createdBy: req.user._id }], session ? { session } : {});
    });
    await logActivity({ actor: req.user._id, action: 'salesreturn.create', entity: 'SalesReturn', entityId: String(doc._id), detail: doc.returnNo });
    emit('inventory_updated', { type: 'INWARD' });
    sendSalesReturnEmail({
      returnNo: doc.returnNo,
      customerName,
      itemsCount: items.length,
      reason,
      operator: req.user
    }).catch((err) => console.error('[Email Return Error]', err.message));
    res.status(201).json(doc);
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message });
  }
}

export async function listReturns(req, res) {
  const items = await SalesReturn.find({})
    .populate({
      path: 'order',
      select: 'orderNo customerName customerPhone deliveryAddress createdAt status items',
      populate: { path: 'items.product', select: 'sku name unit' }
    })
    .populate('items.product', 'sku name unit totalQuantity')
    .sort({ createdAt: -1 })
    .limit(100);
  res.json({ items });
}

export { availOf };
