import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Product from '../models/Product.js';
import Location from '../models/Location.js';
import StockMovement from '../models/StockMovement.js';
import Order from '../models/Order.js';
import Counter from '../models/Counter.js';
import Settings from '../models/Settings.js';
import { locationStatus } from '../models/Location.js';

// Deterministic PRNG so the seed is reproducible.
let _s = 42;
const rnd = () => ((_s = (_s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
const pick = (arr) => arr[Math.floor(rnd() * arr.length)];

const USERS = [
  { name: 'Admin', email: 'admin@warehouse.com', password: 'Admin@123', role: 'admin' },
  { name: 'Warehouse Staff', email: 'staff@warehouse.com', password: 'Staff@123', role: 'warehouse_staff' },
  { name: 'Dispatch Staff', email: 'dispatch@warehouse.com', password: 'Dispatch@123', role: 'dispatch_staff' }
];

const CATS = [
  ['Hardware', 'pcs', ['Steel Bolts M8', 'Hex Nuts M8', 'Flat Washers', 'Angle Brackets', 'Hinges 4in', 'Door Handles', 'Padlocks 50mm', 'Screwdriver Set', 'Allen Key Set', 'Clamps 4in']],
  ['Electrical', 'pcs', ['Copper Wire 2mm', 'LED Bulb 9W', 'Switch Board 8M', 'MCB 32A', 'Extension Cord 5m', 'Ceiling Fan 48in', 'Tube Light 20W', 'Solar Lantern']],
  ['Packaging', 'pcs', ['Packing Box L', 'Bubble Wrap Roll', 'Stretch Film', 'Packing Tape', 'Corrugated Sheets', 'Pouches 500g', 'Shrink Wrap Roll']],
  ['Safety', 'pcs', ['Safety Gloves', 'Helmets White', 'Hi-Vis Vests', 'Safety Shoes 9', 'Ear Plugs Pack', 'Dust Masks N95', 'Fire Extinguisher 5kg']],
  ['Consumables', 'ltr', ['Hydraulic Oil 5L', 'Cutting Oil 1L', 'Grease Cartridge', 'Coolant 5L']],
  ['Tools', 'pcs', ['Hammer 500g', 'Wrench Set 12pc', 'Drill Machine 13mm', 'Measuring Tape 5m', 'Level Scale 2ft', 'Pliers Combo', 'WD-40 Spray']]
];

export async function seedData() {
  // Users (skip existing)
  const userDocs = {};
  for (const u of USERS) {
    let doc = await User.findOne({ email: u.email });
    if (!doc) {
      doc = await User.create({ name: u.name, email: u.email, passwordHash: await bcrypt.hash(u.password, 10), role: u.role });
      console.log('seed user', u.email);
    }
    userDocs[u.role] = doc;
  }
  await Settings.updateOne({ key: 'global' }, { $setOnInsert: { key: 'global' } }, { upsert: true });
  await Settings.updateOne({ key: 'global' }, { $set: { onboarded: true, warehouseName: 'Demo Warehouse' } });

  // Locations: 3 zones x 5 racks x 2 bins = 30, code Zone-Rack-Bin e.g. A-01-03
  const locs = [];
  for (const zone of ['A', 'B', 'C']) {
    for (let rack = 1; rack <= 5; rack++) {
      for (let bin = 1; bin <= 2; bin++) {
        const code = `${zone}-0${rack}-0${bin}`;
        const cap = 100 + Math.floor(rnd() * 200);
        const doc = await Location.findOneAndUpdate(
          { code },
          { $setOnInsert: { code, zone, rack: `0${rack}`, shelf: `B${bin}`, capacity: cap, occupied: 0, status: 'available' } },
          { upsert: true, new: true }
        );
        locs.push(doc);
      }
    }
  }

  // Products: 44 across categories
  const products = [];
  let skuN = 1001;
  for (const [cat, unit, names] of CATS) {
    for (const name of names) {
      const sku = `SKU-${skuN++}`;
      const cost = 20 + Math.floor(rnd() * 900);
      products.push({
        sku, name, category: cat, unit,
        barcode: `890${skuN}001`,
        description: `${name} — quality ${cat.toLowerCase()} item.`,
        costPrice: cost, sellingPrice: Math.round(cost * 1.35),
        reorderLevel: 8 + Math.floor(rnd() * 15)
      });
    }
  }
  const prodDocs = [];
  let li = 0;
  for (const [i, p] of products.entries()) {
    // A few low-stock + damaged items on purpose
    const low = i % 11 === 3;
    const dmg = i % 9 === 4;
    const total = low ? 3 + Math.floor(rnd() * 5) : 25 + Math.floor(rnd() * 180);
    const damaged = dmg ? 2 + Math.floor(rnd() * 6) : 0;
    const loc = locs[li++ % locs.length];
    const doc = await Product.findOneAndUpdate(
      { sku: p.sku },
      { $setOnInsert: { ...p, totalQuantity: total, damagedQuantity: damaged, reservedQuantity: 0, status: 'active', defaultLocationId: loc._id } },
      { upsert: true, new: true }
    );
    prodDocs.push(doc);
  }
  // Reconcile occupancy from product totals (cap at capacity)
  for (const loc of locs) {
    const ps = await Product.find({ defaultLocationId: loc._id });
    const occ = Math.min(loc.capacity, ps.reduce((s, x) => s + (x.totalQuantity || 0), 0));
    await Location.updateOne({ _id: loc._id }, { $set: { occupied: occ, status: locationStatus(occ, loc.capacity, 'available') } });
  }

  // Movements: 110 ledger entries
  const staff = userDocs.warehouse_staff || userDocs.admin;
  const types = ['INWARD', 'INWARD', 'INWARD', 'OUTWARD', 'OUTWARD', 'TRANSFER', 'DAMAGED', 'ADJUSTMENT'];
  const refs = ['PO-4481', 'PO-4510', 'SO-2210', 'GRN-118', ''];
  const existing = await StockMovement.countDocuments({});
  if (existing < 50) {
    const bulk = [];
    for (let i = 0; i < 110; i++) {
      const p = pick(prodDocs);
      const t = pick(types);
      bulk.push({
        product: p._id,
        type: t,
        quantity: 1 + Math.floor(rnd() * 20),
        fromLocation: t === 'OUTWARD' || t === 'TRANSFER' ? p.defaultLocationId : undefined,
        toLocation: t === 'INWARD' || t === 'TRANSFER' ? p.defaultLocationId : undefined,
        reference: pick(refs),
        performedBy: staff._id,
        note: 'Seeded history',
        createdAt: new Date(Date.now() - Math.floor(rnd() * 75) * 24 * 3600 * 1000)
      });
    }
    await StockMovement.insertMany(bulk);
  }

  // Orders: 20 in mixed statuses with reservations for open ones
  const dispatch = userDocs.dispatch_staff || userDocs.admin;
  const cust = [['Apex Traders', '9820011223', '14 Market Rd, Chennai'], ['Bluekart Retail', '9841098410', '22 GST St, Mumbai'], ['Craftline', '9003011223', '7 Lake View, Bengaluru'], ['Delta Foods', '9884411223', '3 Harbour Rd, Kochi'], ['Everest Tools', '9790911223', '51 MIDC, Pune']];
  const statuses = ['Created', 'Created', 'Created', 'Created', 'Picking', 'Picking', 'Picking', 'Picked', 'Picked', 'Picked', 'Dispatched', 'Dispatched', 'Dispatched', 'Dispatched', 'Dispatched', 'Delivered', 'Delivered', 'Delivered', 'Cancelled', 'Cancelled'];
  const oCount = await Order.countDocuments({});
  if (oCount === 0) {
    for (let i = 0; i < 20; i++) {
      const seq = await Counter.findOneAndUpdate({ key: 'order' }, { $inc: { seq: 1 } }, { upsert: true, new: true });
      const orderNo = `ORD-${String(seq.seq).padStart(5, '0')}`;
      const [cn, ph, ad] = pick(cust);
      const nItems = 1 + Math.floor(rnd() * 3);
      const items = [];
      for (let k = 0; k < nItems; k++) {
        const p = pick(prodDocs);
        const qty = 1 + Math.floor(rnd() * 4);
        items.push({ product: p._id, qty, location: '' });
      }
      const st = statuses[i];
      const order = await Order.create({
        orderNo, customerName: cn, customerPhone: ph, deliveryAddress: ad,
        items, status: st,
        createdBy: dispatch._id,
        ...(st === 'Dispatched' || st === 'Delivered'
          ? { dispatchedBy: dispatch._id, dispatchedAt: new Date(Date.now() - Math.floor(rnd() * 10) * 24 * 3600 * 1000) }
          : {})
      });
      if (['Created', 'Picking', 'Picked'].includes(st)) {
        for (const it of items) {
          await Product.updateOne({ _id: it.product }, { $inc: { reservedQuantity: it.qty } });
        }
      }
      if (st === 'Dispatched' || st === 'Delivered') {
        for (const it of items) {
          await Product.updateOne({ _id: it.product }, { $inc: { totalQuantity: -Math.min(it.qty, 3) } });
          await StockMovement.create({ product: it.product, type: 'OUTWARD', quantity: it.qty, reference: orderNo, performedBy: dispatch._id, note: `dispatch ${orderNo}` });
        }
      }
    }
  }
  console.log('seed done (idempotent)');
}

async function connectForSeed() {
  if (process.env.USE_MEMORY_DB === 'true') {
    const { MongoMemoryReplSet } = await import('mongodb-memory-server');
    const mem = await MongoMemoryReplSet.create({ replSet: { count: 1, storageEngine: 'wiredTiger' } });
    await mongoose.connect(mem.getUri());
    console.log('seed: connected (in-memory, throwaway — use the running server for durable seeding)');
    return mem;
  }
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/smart-warehouse';
  await mongoose.connect(uri);
  console.log('seed: connected');
  return null;
}

const isMain = process.argv[1]?.endsWith('seed.js');
if (isMain) {
  const mem = await connectForSeed();
  try {
    if (process.argv.includes('--reset')) {
      await mongoose.connection.db.dropDatabase();
      console.log('db dropped (--reset)');
    }
    await seedData();
  } finally {
    await mongoose.disconnect();
    if (mem) await mem.stop();
  }
}
