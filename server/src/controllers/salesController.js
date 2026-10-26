import Customer from '../models/Customer.js';
import Vendor from '../models/Vendor.js';
import Invoice from '../models/Invoice.js';
import Payment from '../models/Payment.js';
import CreditNote from '../models/CreditNote.js';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import StockMovement from '../models/StockMovement.js';
import { nextSeq } from '../models/Counter.js';
import { logActivity } from '../utils/activity.js';
import mongoose from 'mongoose';
import { withTx } from '../utils/tx.js';

export const crud = (Model, entity) => ({
  list: async (req, res) => {
    const { q, page = 1, limit = 25 } = req.query;
    const filter = q ? { $text: { $search: q } } : {};
    const pg = Math.max(1, Number(page));
    const lim = Math.min(100, Math.max(1, Number(limit)));
    const [items, total] = await Promise.all([
      Model.find(filter).sort({ createdAt: -1 }).skip((pg - 1) * lim).limit(lim),
      Model.countDocuments(filter)
    ]);
    res.json({ items, total, page: pg, pages: Math.ceil(total / lim) });
  },
  create: async (req, res) => {
    const doc = await Model.create(req.body);
    await logActivity({ actor: req.user._id, action: `${entity}.create`, entity, detail: doc.name || '' });
    res.status(201).json(doc);
  },
  update: async (req, res) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!doc) return res.status(404).json({ error: 'Page not found' });
    res.json(doc);
  }
});

export const customers = crud(Customer, 'customer');
export const vendors = crud(Vendor, 'vendor');

// Invoice from a dispatched/delivered order (sales) — totals from selling prices.
export async function createSalesInvoice(req, res) {
  const order = await Order.findById(req.params.orderId).populate('items.product');
  if (!order) return res.status(404).json({ error: 'Page not found' });
  if (!['Dispatched', 'Delivered', 'Picked'].includes(order.status)) {
    return res.status(400).json({ error: 'Invoice can be raised once the order is picked or dispatched.' });
  }
  const exists = await Invoice.findOne({ order: order._id, kind: 'sales' });
  if (exists) return res.json(exists);
  const seq = await nextSeq('invoice');
  const items = order.items.map((it) => ({
    product: it.product._id, qty: it.qty,
    rate: it.product.sellingPrice || 0, amount: it.qty * (it.product.sellingPrice || 0)
  }));
  const subtotal = items.reduce((s, i) => s + i.amount, 0);
  const inv = await Invoice.create({
    invNo: `INV-${String(seq).padStart(5, '0')}`, kind: 'sales', order: order._id,
    partyName: order.customerName, items, subtotal, tax: 0, total: subtotal, createdBy: req.user._id
  });
  await logActivity({ actor: req.user._id, action: 'invoice.create', entity: 'Invoice', entityId: String(inv._id), detail: inv.invNo });
  res.status(201).json(inv);
}

export async function listInvoices(req, res) {
  const { kind, status } = req.query;
  const filter = {};
  if (kind) filter.kind = kind;
  if (status) filter.status = status;
  const items = await Invoice.find(filter).sort({ createdAt: -1 }).limit(100);
  res.json({ items });
}

// Record a payment against an invoice; auto-marks Paid/Partially Paid.
export async function addPayment(req, res) {
  try {
    const { invoiceId, kind, partyName = '', amount, method = 'Cash', reference = '' } = req.body;
    let inv = null;
    await withTx(async (session) => {
      if (invoiceId) {
        inv = await Invoice.findById(invoiceId).session(session);
        if (!inv) throw Object.assign(new Error('Page not found'), { status: 404 });
        inv.amountPaid = (inv.amountPaid || 0) + Number(amount);
        inv.status = inv.amountPaid >= inv.total ? 'Paid' : 'Partially Paid';
        await inv.save(session ? { session } : {});
      }
      await Payment.create([{ kind, invoice: invoiceId || undefined, partyName: partyName || inv?.partyName || '', amount: Number(amount), method, reference, createdBy: req.user._id }], session ? { session } : {});
    });
    res.status(201).json({ ok: true, invoice: inv });
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message });
  }
}

export async function listPayments(req, res) {
  const { kind } = req.query;
  const items = await Payment.find(kind ? { kind } : {}).populate('invoice', 'invNo total').sort({ createdAt: -1 }).limit(100);
  res.json({ items });
}

// Sales return: stock comes back (INWARD) + sales credit note.
export async function salesReturn(req, res) {
  try {
    const { orderId, productId, qty, reason = 'Sales return' } = req.body;
    let credit;
    await withTx(async (session) => {
      const p = await Product.findById(productId).session(session);
      if (!p) throw Object.assign(new Error('Page not found'), { status: 404 });
      await Product.findByIdAndUpdate(productId, { $inc: { totalQuantity: qty } }, { session });
      const locId = p.defaultLocationId;
      if (locId) {
        const Location = (await import('../models/Location.js')).default;
        const { locationStatus } = await import('../models/Location.js');
        const loc = await Location.findById(locId).session(session);
        if (loc) {
          const occ = Math.min(loc.capacity, loc.occupied + qty);
          await Location.findByIdAndUpdate(locId, { $set: { occupied: occ, status: locationStatus(occ, loc.capacity, loc.status) } }, { session });
        }
      }
      await StockMovement.create([{ product: productId, type: 'INWARD', quantity: qty, toLocation: locId || undefined, reference: 'SALES-RETURN', performedBy: req.user._id, note: reason }], session ? { session } : {});
      const seq = await nextSeq('credit', session);
      const amount = qty * (p.sellingPrice || 0);
      [credit] = await CreditNote.create([{
        creditNo: `CN-${String(seq).padStart(5, '0')}`, kind: 'sales',
        partyName: '', order: orderId || undefined, product: productId, qty, amount, reason, createdBy: req.user._id
      }], session ? { session } : {});
    });
    res.status(201).json(credit);
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message });
  }
}

export async function createCredit(req, res) {
  const seq = await nextSeq('credit');
  const doc = await CreditNote.create({ ...req.body, creditNo: `CN-${String(seq).padStart(5, '0')}`, createdBy: req.user._id });
  res.status(201).json(doc);
}

export async function listCredits(req, res) {
  const { kind } = req.query;
  const items = await CreditNote.find(kind ? { kind } : {}).populate('product', 'sku name').sort({ createdAt: -1 }).limit(100);
  res.json({ items });
}
