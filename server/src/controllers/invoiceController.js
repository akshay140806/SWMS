import Order from '../models/Order.js';
import Invoice from '../models/Invoice.js';
import { nextSeq } from '../models/Counter.js';
import { logActivity } from '../utils/activity.js';

export async function list(req, res) {
  const { status, page = 1, limit = 25 } = req.query;
  const filter = status ? { status } : {};
  const pg = Math.max(1, Number(page));
  const lim = Math.min(100, Math.max(1, Number(limit)));
  const [items, total] = await Promise.all([
    Invoice.find(filter).populate('order', 'orderNo').sort({ createdAt: -1 }).skip((pg - 1) * lim).limit(lim),
    Invoice.countDocuments(filter)
  ]);
  res.json({ items, total, page: pg, pages: Math.ceil(total / lim) });
}

export async function getOne(req, res) {
  const inv = await Invoice.findById(req.params.id).populate('order', 'orderNo customerName');
  if (!inv) return res.status(404).json({ error: 'Page not found' });
  res.json(inv);
}

// Create an invoice from a dispatched/delivered sales order (snapshot prices).
export async function createFromOrder(req, res) {
  const { orderId, taxRate = 0 } = req.body;
  const order = await Order.findById(orderId).populate('items.product', 'sku name sellingPrice');
  if (!order) return res.status(404).json({ error: 'Page not found' });
  if (!['Dispatched', 'Delivered'].includes(order.status)) {
    return res.status(400).json({ error: 'Invoice can be raised only after dispatch.' });
  }
  const dupe = await Invoice.findOne({ order: order._id, status: { $ne: 'Cancelled' } });
  if (dupe) return res.status(400).json({ error: `Invoice ${dupe.invoiceNo} already exists for this order.` });
  const seq = await nextSeq('invoice');
  const items = order.items.map((it) => {
    const rate = it.product?.sellingPrice || 0;
    return { product: it.product?._id || it.product, name: it.product?.name || '', sku: it.product?.sku || '', qty: it.qty, rate, amount: rate * it.qty };
  });
  const subTotal = items.reduce((s, i) => s + i.amount, 0);
  const taxAmount = Math.round((subTotal * Number(taxRate)) / 100);
  const inv = await Invoice.create({
    invoiceNo: `INV-${String(seq).padStart(5, '0')}`,
    order: order._id,
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    deliveryAddress: order.deliveryAddress,
    items, subTotal, taxRate: Number(taxRate), taxAmount, grandTotal: subTotal + taxAmount,
    createdBy: req.user._id
  });
  await logActivity({ actor: req.user._id, action: 'invoice.create', entity: 'Invoice', entityId: String(inv._id), detail: inv.invoiceNo });
  res.status(201).json(inv);
}

export async function markPaid(req, res) {
  const inv = await Invoice.findById(req.params.id);
  if (!inv) return res.status(404).json({ error: 'Page not found' });
  inv.status = 'Paid';
  await inv.save();
  res.json(inv);
}
