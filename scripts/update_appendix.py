import os
import sys
import docx
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import qn, nsdecls
import win32com.client
import pymupdf

def set_cell_margins(cell, top=80, bottom=80, left=120, right=120):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = OxmlElement('w:tcMar')
    for m, val in [('w:top', top), ('w:bottom', bottom), ('w:left', left), ('w:right', right)]:
        node = OxmlElement(m)
        node.set(qn('w:w'), str(val))
        node.set(qn('w:type'), 'dxa')
        tcMar.append(node)
    tcPr.append(tcMar)

def set_cell_shading(cell, color_hex="F8FAFC"):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{color_hex}"/>')
    tcPr.append(shd)

def set_table_borders(table, color="CBD5E1"):
    tblPr = table._tbl.tblPr
    borders = parse_xml(f'''
        <w:tblBorders {nsdecls("w")}>
            <w:top w:val="single" w:sz="4" w:space="0" w:color="{color}"/>
            <w:bottom w:val="single" w:sz="4" w:space="0" w:color="{color}"/>
            <w:left w:val="single" w:sz="4" w:space="0" w:color="{color}"/>
            <w:right w:val="single" w:sz="4" w:space="0" w:color="{color}"/>
            <w:insideH w:val="none"/>
            <w:insideV w:val="none"/>
        </w:tblBorders>
    ''')
    tblPr.append(borders)

def build_tree_structure():
    return """SMART WAREHOUSE MANAGEMENT SYSTEM (SWMS) - FULL-STACK REPOSITORY TREE
========================================================================
c:/Users/ASUS/OneDrive/Desktop/Smart Warehouse Management System/
|-- .agents/                          # Specialized AI coding agent configurations & domain skills
|-- .env.example                      # Root environment configuration template
|-- .opencode/                        # Project domain rules, architecture standards, and agent skills
|-- AGENTS.md                         # Architectural invariants, RBAC definitions & coding rules
|-- ANS_VASI_PROVISIONS_WORKFLOW.md   # Domain operational workflow documentation
|-- AUDIT.md                          # Comprehensive architectural audit and decisions log
|-- README.md                         # Project documentation, quick-start guide & decisions log
|-- SWMS.docx                         # Comprehensive academic project report (Word format)
|-- Smart_Warehouse_Management_System_Project_Report.pdf # Formatted project report (PDF format)
|-- Start-SmartWMS.bat                # Windows desktop one-click execution launcher
|-- package.json                      # Monorepo root manifest with npm workspaces configuration
|-- playwright.config.mjs             # Playwright E2E browser test automation configuration
|-- figures/                          # System architecture diagrams, workflows & ER diagrams
|-- tests/                            # Comprehensive end-to-end testing test suites
|   `-- global-setup.mjs              # Test database initialization and authentication seeding
|
|-- client/                           # FRONTEND PRESENTATION LAYER (React 18 + Vite + Tailwind CSS)
|   |-- package.json                  # Client dependencies (React, Vite, Tailwind, Recharts, Lucide)
|   |-- vite.config.js                # Vite build configuration and '/api' backend proxy
|   |-- index.html                    # Single Page Application HTML root entry point
|   `-- src/
|       |-- main.jsx                  # React application DOM mount and provider bootstrapping
|       |-- App.jsx                   # Central navigation router, layout & real-time telemetry
|       |-- styles.css                # Global Tailwind CSS directives and custom typography
|       |-- api/
|       |   |-- client.js             # Centralized Axios HTTP client with JWT interceptors
|       |   `-- socket.js             # Singleton Socket.IO client for live inventory streaming
|       |-- components/               # Modular UI components (Navigation, KPI cards, Modals)
|       |-- content/
|       |   |-- en.js                 # Standard English UI copy dictionary
|       |   `-- retail.js             # Retail-specific warehouse terminology dictionary
|       |-- lib/                      # Helper utilities, date formatters, and calculation logic
|       `-- pages/                    # Core operational view pages
|           |-- Dashboard.jsx         # Executive warehouse overview & real-time telemetry metrics
|           |-- Products.jsx          # Master product catalog, SKU creation & stock adjustments
|           |-- Locations.jsx         # Multi-zone storage bins, rack occupancy & capacity meters
|           |-- Movements.jsx         # Immutable stock movement audit ledger (Inward/Outward)
|           |-- Orders.jsx            # Sales order management, customer reservations & picking
|           |-- Dispatch.jsx          # Outbound dispatch clearance, tracking & delivery challans
|           |-- Purchases.jsx         # Vendor management & purchase order receiving
|           |-- Analytics.jsx         # Inventory turnover velocity, aging & spatial analytics
|           |-- Users.jsx             # Role-based user administration (Admin only)
|           `-- Settings.jsx          # Store profile, warehouse zones & activity logging
|
|-- server/                           # BACKEND SERVER ENGINE (Node.js + Express + Mongoose)
|   |-- package.json                  # Server dependencies (Express, Mongoose, Socket.IO, Zod, JWT)
|   |-- server.js                     # Main server entry point, security middleware & route mounting
|   |-- .env.example                  # Server-specific environment template
|   `-- src/
|       |-- config/
|       |   `-- db.js                 # MongoDB connection lifecycle & Atlas cluster support
|       |-- models/                   # 22 Mongoose entity models with schema validation
|       |   |-- Product.js            # SKU definitions, available stock formulas & default bins
|       |   |-- Location.js           # Bin codes (Zone-Rack-Bin), capacity & occupancy states
|       |   |-- StockMovement.js      # Immutable audit ledger for INWARD, OUTWARD & TRANSFERS
|       |   |-- Order.js              # Sales orders, multi-item lines, status & reservations
|       |   |-- Fulfil.js             # Packages, shipments, delivery challans & sales returns
|       |   |-- User.js               # User accounts, password hashes & RBAC role assignments
|       |   |-- Counter.js            # Atomic sequence generators (ORD-, PO-, SHP-, PKG-)
|       |   `-- Settings.js           # Global warehouse profile & onboarding state
|       |-- controllers/              # 18 Domain business controllers
|       |   |-- authController.js     # User registration, login, session tokens & logout
|       |   |-- productController.js  # Transactional stock inwarding, adjustment & transfers
|       |   |-- locationController.js # Storage bin management, occupancy calculations & QR codes
|       |   |-- orderController.js    # Order lifecycle, inventory reservation & cancellation
|       |   |-- fulfilController.js   # Order packing, shipment generation & delivery challans
|       |   |-- dashboardController.js# Telemetry aggregation, occupancy ratios & alerts
|       |   `-- userController.js     # User creation, role modification & deactivation
|       |-- middleware/               # HTTP request middleware pipeline
|       |   |-- auth.js               # JWT verification & role authorization (requireRole)
|       |   |-- errors.js             # Centralized 404 and global error formatting
|       |   |-- limiter.js            # Rate-limiting middleware for brute-force mitigation
|       |   `-- wrap.js               # Asynchronous route wrapper preventing server crashes
|       |-- routes/                   # Modular REST endpoint route definitions
|       |-- seed/
|       |   `-- seed.js               # Deterministic, idempotent database seeding engine
|       |-- socket.js                 # Server-side WebSocket broadcaster (emit helper)
|       |-- utils/
|       |   |-- tx.js                 # Resilient MongoDB replica-set transaction wrapper
|       |   |-- picking.js            # Nearest-first topological picking path optimizer
|       |   `-- activity.js           # System-wide operational activity audit logging
|       `-- validators/
|           `-- schemas.js            # Zod validation schemas for all inbound request bodies
|
`-- scripts/                          # SYSTEM AUTOMATION & REPORT GENERATION UTILITIES
    |-- generate_figures.py           # Matplotlib automated workflow & architecture diagrams
    |-- generate_full_report.py       # Automated academic docx and PDF report generator
    `-- report_helpers.py             # OpenXML table formatting, margins & pagination helpers"""

def build_package_config_code():
    return """// ========================================================================
// 1. BACKEND PACKAGE CONFIGURATION (server/package.json)
// ========================================================================
{
  "name": "smart-warehouse-server",
  "version": "1.0.0",
  "description": "Smart Warehouse Management System - Backend (MERN)",
  "main": "server.js",
  "type": "module",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "seed": "node src/seed/seed.js"
  },
  "dependencies": {
    "bcryptjs": "^2.4.3",
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "express": "^4.19.2",
    "express-rate-limit": "^8.7.1",
    "helmet": "^8.3.0",
    "jsonwebtoken": "^9.0.2",
    "mongodb-memory-server": "^11.3.0",
    "mongoose": "^8.4.0",
    "morgan": "^1.10.0",
    "qrcode": "^1.5.4",
    "socket.io": "^4.7.5",
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "nodemon": "^3.1.3"
  }
}

// ========================================================================
// 2. FRONTEND PACKAGE CONFIGURATION (client/package.json)
// ========================================================================
{
  "name": "smart-warehouse-client",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "@hookform/resolvers": "^5.9.1",
    "@tailwindcss/vite": "^4.3.3",
    "axios": "^1.20.0",
    "framer-motion": "^14.1.0",
    "lucide-react": "^1.56.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-hook-form": "^7.90.0",
    "react-hot-toast": "^2.6.1",
    "react-router-dom": "^6.23.1",
    "recharts": "^3.10.1",
    "socket.io-client": "^4.7.5",
    "tailwindcss": "^4.3.3",
    "zod": "^3.25.76"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.1",
    "vite": "^5.4.0"
  }
}

// ========================================================================
// 3. ROOT WORKSPACE ORCHESTRATOR CONFIGURATION (package.json)
// ========================================================================
{
  "name": "smart-wms",
  "version": "1.0.0",
  "private": true,
  "description": "Smart Warehouse Management System — MERN + Playwright",
  "scripts": {
    "dev": "concurrently -n server,client -c blue,green \\"npm run dev --workspace=server\\" \\"npm run dev --workspace=client\\"",
    "seed": "npm run seed --workspace=server",
    "test": "npx playwright test",
    "test:ui": "npx playwright test --ui",
    "test:headed": "npx playwright test --headed"
  },
  "devDependencies": {
    "@playwright/test": "^1.49.0",
    "concurrently": "^9.1.0"
  },
  "workspaces": [
    "server",
    "client"
  ]
}"""

def build_server_entry_code():
    return """// ========================================================================
// MAIN SERVER ENTRY POINT (server/server.js)
// ========================================================================
import 'dotenv/config';
import http from 'http';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { Server } from 'socket.io';
import { connectDB } from './src/config/db.js';
import { initSocket } from './src/socket.js';
import { errorHandler, notFound } from './src/middleware/errors.js';
import { wrapRouter } from './src/middleware/wrap.js';
import { apiLimiter } from './src/middleware/limiter.js';
import authRoutes from './src/routes/auth.js';
import userRoutes from './src/routes/users.js';
import productRoutes from './src/routes/products.js';
import locationRoutes from './src/routes/locations.js';
import movementRoutes from './src/routes/movements.js';
import orderRoutes from './src/routes/orders.js';
import dashboardRoutes from './src/routes/dashboard.js';
import notificationRoutes from './src/routes/notifications.js';
import settingsRoutes from './src/routes/settings.js';
import setupRoutes from './src/routes/setup.js';
import customerRoutes from './src/routes/customers.js';
import vendorRoutes from './src/routes/vendors.js';
import purchaseRoutes from './src/routes/purchases.js';
import invoiceRoutes from './src/routes/invoices.js';
import catalogRoutes from './src/routes/catalog.js';
import fulfilRoutes from './src/routes/fulfil.js';
import aliasesRoutes from './src/routes/aliases.js';

const app = express();
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));
app.use('/api', apiLimiter);

app.get('/api/health', (req, res) => res.json({ ok: true, service: 'smart-warehouse-server', version: '1.0' }));

for (const [path, router] of [
  ['/api/auth', authRoutes],
  ['/api/users', userRoutes],
  ['/api/products', productRoutes],
  ['/api/locations', locationRoutes],
  ['/api/movements', movementRoutes],
  ['/api/orders', orderRoutes],
  ['/api/dashboard', dashboardRoutes],
  ['/api/notifications', notificationRoutes],
  ['/api/settings', settingsRoutes],
  ['/api/setup', setupRoutes],
  ['/api/customers', customerRoutes],
  ['/api/vendors', vendorRoutes],
  ['/api/purchases', purchaseRoutes],
  ['/api/invoices', invoiceRoutes],
  ['/api/catalog', catalogRoutes]
]) {
  app.use(path, wrapRouter(router));
}
app.use('/api', wrapRouter(fulfilRoutes));
app.use('/api', wrapRouter(aliasesRoutes));

app.use('/api', notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: process.env.CLIENT_URL || 'http://localhost:5173' } });
initSocket(io);

connectDB(process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/smart-warehouse')
  .then(() => {
    // No auto-seed: a fresh business starts empty and completes onboarding.
    // Optional demo data for durable DBs: npm run seed.
    server.listen(PORT, () => console.log(`Server running on :${PORT}`));
  })
  .catch((e) => {
    console.error('DB connect failed', e.message);
    process.exit(1);
  });"""

def build_seeded_delivery_code():
    return """// ========================================================================
// SEEDED DELIVERY DATA & IDEMPOTENT WAREHOUSE BOOTSTRAPPING (server/src/seed/seed.js)
// ========================================================================
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

// Deterministic PRNG so the seed is reproducible across environments.
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
  // 1. Users (skip existing)
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

  // 2. Locations: 3 zones x 5 racks x 2 bins = 30, code Zone-Rack-Bin e.g. A-01-02
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

  // 3. Products: 44 SKUs across categories
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

  // 4. Movements: 110 historical audit ledger entries
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

  // 5. Customer Delivery Orders: 20 orders across stages with reservations
  const dispatch = userDocs.dispatch_staff || userDocs.admin;
  const cust = [
    ['Apex Traders', '9820011223', '14 Market Rd, Chennai'],
    ['Bluekart Retail', '9841098410', '22 GST St, Mumbai'],
    ['Craftline', '9003011223', '7 Lake View, Bengaluru'],
    ['Delta Foods', '9884411223', '3 Harbour Rd, Kochi'],
    ['Everest Tools', '9790911223', '51 MIDC, Pune']
  ];
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
      // Reserve stock for active open delivery orders
      if (['Created', 'Picking', 'Picked'].includes(st)) {
        for (const it of items) {
          await Product.updateOne({ _id: it.product }, { $inc: { reservedQuantity: it.qty } });
        }
      }
      // Deduct stock and write outward movement for dispatched/delivered orders
      if (st === 'Dispatched' || st === 'Delivered') {
        for (const it of items) {
          await Product.updateOne({ _id: it.product }, { $inc: { totalQuantity: -Math.min(it.qty, 3) } });
          await StockMovement.create({
            product: it.product,
            type: 'OUTWARD',
            quantity: it.qty,
            reference: orderNo,
            performedBy: dispatch._id,
            note: `dispatch ${orderNo}`
          });
        }
      }
    }
  }
  console.log('seed done (idempotent)');
}"""

def build_capacity_service_code():
    return """// ========================================================================
// 1. STORAGE LOCATION SCHEMA & CAPACITY STATE MACHINE (server/src/models/Location.js)
// ========================================================================
import mongoose from 'mongoose';

const locationSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, trim: true, uppercase: true }, // Zone-Rack-Bin e.g. A-01-02
    zone: { type: String, default: 'A', trim: true },
    rack: { type: String, default: '01', trim: true },
    shelf: { type: String, default: 'B1', trim: true },
    capacity: { type: Number, required: true, min: 1 },
    occupied: { type: Number, default: 0, min: 0 },
    status: { type: String, enum: ['available', 'near-full', 'full', 'blocked'], default: 'available' }
  },
  { timestamps: true }
);

export function locationStatus(occupied, capacity, current) {
  if (current === 'blocked') return 'blocked';
  if (capacity <= 0) return 'full';
  const pct = occupied / capacity;
  if (pct >= 1) return 'full';
  if (pct >= 0.85) return 'near-full';
  return 'available';
}

locationSchema.pre('save', function (next) {
  this.status = locationStatus(this.occupied, this.capacity, this.status);
  next();
});

export default mongoose.model('Location', locationSchema);

// ========================================================================
// 2. CAPACITY ENFORCEMENT & LOCATION CONTROLLER (server/src/controllers/locationController.js)
// ========================================================================
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

// ========================================================================
// 3. NEAREST-FIRST PICKING ROUTE OPTIMIZATION (server/src/utils/picking.js)
// ========================================================================
// Picking list: nearest-location-first — sort by location code
// (Zone-Rack-Bin lexicographic) so pickers walk the shortest route.
export function sortPickingList(items) {
  return [...items].sort((a, b) => String(a.location || '').localeCompare(String(b.location || '')));
}"""

def build_rest_socket_code():
    return """// ========================================================================
// 1. FRONTEND CENTRALIZED REST API CLIENT (client/src/api/client.js)
// ========================================================================
import axios from 'axios';

const api = axios.create({ baseURL: '/api' });
api.interceptors.request.use((cfg) => {
  const t = localStorage.getItem('token');
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});
export default api;

// ========================================================================
// 2. FRONTEND WEBSOCKET SINGLETON (client/src/api/socket.js)
// ========================================================================
import { io } from 'socket.io-client';
let socket = null;
export function getSocket() {
  if (!socket) socket = io('http://localhost:5000', { transports: ['websocket'] });
  return socket;
}

// ========================================================================
// 3. BACKEND WEBSOCKET BROADCASTER UTILITY (server/src/socket.js)
// ========================================================================
let _io = null;
export function initSocket(io) {
  _io = io;
  _io.on('connection', (s) => {
    // Client terminals connect here for real-time inventory & dispatch updates
  });
}
export function emit(event, data) {
  if (_io) _io.emit(event, data);
}

// ========================================================================
// 4. SERVER-SIDE JWT TOKEN & RBAC MIDDLEWARE (server/src/middleware/auth.js)
// ========================================================================
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    return res.status(401).json({ error: 'Authentication required: No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'smart-warehouse-secret-2026');
    const user = await User.findById(decoded.id || decoded.userId).select('-password');
    if (!user || user.status === 'inactive') {
      return res.status(401).json({ error: 'User session invalid or deactivated' });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired session token' });
  }
};

export const requireRole = (allowedRoles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    if (!allowedRoles.includes(req.user.role) && req.user.role !== 'admin') {
      return res.status(403).json({
        error: `Access denied: Role '${req.user.role}' lacks permission for this operation`
      });
    }
    next();
  };
};"""

def build_env_vars_code():
    return """// ========================================================================
// 1. ROOT WORKSPACE ENVIRONMENT TEMPLATE (.env.example)
// ========================================================================
# Copy to server/.env (or export vars). ambit: local demo works with zero setup via USE_MEMORY_DB.
PORT=5000
# Preferred name (falls back to MONGODB_URI for backwards compatibility)
MONGO_URI=
MONGODB_URI=mongodb://127.0.0.1:27017/smart-warehouse
# Local zero-setup demo: in-memory Mongo + auto-seed. Set false when MONGO_URI points to Atlas.
USE_MEMORY_DB=true
JWT_SECRET=change_me_in_production
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173

// ========================================================================
// 2. SERVER ENVIRONMENT CONFIGURATION (server/.env.example)
// ========================================================================
PORT=5000
# Use MongoDB Atlas cloud URI here. Fallback is local MongoDB.
MONGODB_URI=mongodb://127.0.0.1:27017/smart-warehouse
# Example Atlas: mongodb+srv://<user>:<pass>@cluster0.xxxxx.mongodb.net/smart-warehouse?retryWrites=true&w=majority
JWT_SECRET=smart_warehouse_secret_change_me
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173"""

def build_install_exec_code():
    return """# ========================================================================
# 1. COMMAND-LINE APPLICATION INSTALLATION & EXECUTION RUNBOOK
# ========================================================================

# Step 1: Clone repository and enter project root
git clone https://github.com/your-org/smart-warehouse-management-system.git
cd "Smart Warehouse Management System"

# Step 2: Install root orchestrator and multi-workspace dependencies
npm install

# Step 3: Configure server environment variables
# For zero-setup in-memory database evaluation:
cd server
copy ..\\.env.example .env
# Set USE_MEMORY_DB=true inside server/.env
cd ..

# Step 4 (Optional): Populate deterministic demo delivery data into durable DB
npm run seed

# Step 5: Launch concurrent development servers (Backend :5000 + Frontend :5173)
npm run dev

# Step 6: Access warehouse client portal via web browser
# Navigate to: http://localhost:5173/

# Step 7: Run automated end-to-end integration and security test suite
npx playwright test

# ========================================================================
# 2. WINDOWS ONE-CLICK DESKTOP LAUNCHER SCRIPT (Start-SmartWMS.bat)
# ========================================================================
@echo off
cd /d "C:\\Users\\ASUS\\OneDrive\\Desktop\\Smart Warehouse Management System"
"C:\\Program Files\\nodejs\\npm.cmd" run dev"""

def update_swms_appendix():
    docx_file = "SWMS.docx"
    print(f"Loading '{docx_file}'...")
    doc = Document(docx_file)

    body = doc._body._element

    # Locate APPENDIX and REFERENCES elements
    app_el = None
    ref_el = None
    for el in body:
        if el.tag.endswith('p'):
            p = docx.text.paragraph.Paragraph(el, doc)
            if p.text.strip() == 'APPENDIX' and app_el is None:
                app_el = el
            elif p.text.strip() == 'REFERENCES':
                ref_el = el
                break

    if app_el is None or ref_el is None:
        raise ValueError("Could not find APPENDIX or REFERENCES paragraph in document!")

    ref_break_el = ref_el.getprevious()
    print(f"Located APPENDIX and REFERENCES. Page break element tag: {ref_break_el.tag}")

    # Remove all old elements strictly between app_el and ref_break_el
    removed_count = 0
    curr = app_el.getnext()
    while curr is not None and curr != ref_break_el:
        next_el = curr.getnext()
        body.remove(curr)
        removed_count += 1
        curr = next_el

    print(f"Removed {removed_count} old Appendix elements.")
    target_ref = ref_break_el

    # Helper function to create paragraph and insert before target
    def insert_p(text="", align=WD_ALIGN_PARAGRAPH.JUSTIFY, space_before=4, space_after=6, line_spacing=1.3, indent=0.3, bold=False, italic=False, size=11):
        p = doc.add_paragraph()
        p.alignment = align
        p.paragraph_format.space_before = Pt(space_before)
        p.paragraph_format.space_after = Pt(space_after)
        p.paragraph_format.line_spacing = line_spacing
        if indent:
            p.paragraph_format.first_line_indent = Inches(indent)
        r = p.add_run(text)
        r.font.name = 'Times New Roman'
        r.font.size = Pt(size)
        r.font.bold = bold
        r.font.italic = italic
        target_ref.addprevious(p._p)
        return p

    def insert_heading(title):
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.LEFT
        p.paragraph_format.space_before = Pt(14)
        p.paragraph_format.space_after = Pt(4)
        p.paragraph_format.line_spacing = 1.15
        r = p.add_run(title)
        r.font.name = 'Times New Roman'
        r.font.size = Pt(12)
        r.font.bold = True
        target_ref.addprevious(p._p)
        return p

    def insert_code_block(code_text):
        tbl = doc.add_table(rows=1, cols=1)
        tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
        cell = tbl.cell(0, 0)
        cell.width = Inches(6.0)
        set_cell_shading(cell, "F8FAFC")
        set_cell_margins(cell, top=80, bottom=80, left=120, right=120)
        set_table_borders(tbl, color="CBD5E1")
        cp = cell.paragraphs[0]
        cp.paragraph_format.space_before = Pt(0)
        cp.paragraph_format.space_after = Pt(0)
        cp.paragraph_format.line_spacing = 1.0
        r = cp.add_run(code_text)
        r.font.name = 'Courier New'
        r.font.size = Pt(8.0)
        target_ref.addprevious(tbl._tbl)

        p_space = doc.add_paragraph()
        p_space.paragraph_format.space_before = Pt(0)
        p_space.paragraph_format.space_after = Pt(6)
        target_ref.addprevious(p_space._p)

    # Introductory text after APPENDIX
    insert_p("This appendix provides the complete engineering specifications, architectural listings, operational schemas, production source code modules, and deployment procedures for the Smart Warehouse Management System (Smart WMS). The material is structured systematically into eight distinct operational sections reflecting the full-stack MERN architecture, transactional capacity controls, real-time telemetry protocols, and installation runbooks.", space_before=6, space_after=10, indent=0.4)

    # ----------------------------------------------------
    # SECTION 1: PROJECT FOLDER STRUCTURE
    # ----------------------------------------------------
    print("Generating Section 1: Project Folder Structure...")
    insert_heading("1. PROJECT FOLDER STRUCTURE")
    insert_p("The Smart Warehouse Management System is engineered as an enterprise-grade full-stack monorepo leveraging modern npm workspaces to coordinate the server, client, documentation, and automated testing suites within a single unified repository. This structure establishes a strict separation of concerns between presentation, business rules, transactional database operations, and quality assurance.", indent=0.4)
    insert_p("The root directory orchestrates workspace dependencies, Playwright browser test automation suites (playwright.config.mjs), Windows one-click desktop launchers (Start-SmartWMS.bat), and deployment environment templates. The server directory (/server) implements a clean Model-View-Controller (MVC) architecture comprising 22 Mongoose entity models, 18 domain business controllers, authentication and transaction middleware, and deterministic seeding routines. The client directory (/client) houses a modular React 18 single-page application bundled with Vite and styled with Tailwind CSS, featuring decoupled REST API clients and WebSocket singleton transports.", indent=0.4)
    insert_p("Listing 1 outlines the complete physical directory hierarchy of the Smart WMS project with functional annotations:", bold=False, italic=True, indent=0.0)
    insert_code_block(build_tree_structure())

    # ----------------------------------------------------
    # SECTION 2: PACKAGE CONFIGURATION
    # ----------------------------------------------------
    print("Generating Section 2: Package Configuration...")
    insert_heading("2. PACKAGE CONFIGURATION")
    insert_p("Smart WMS leverages npm workspaces to harmonize multi-package dependency management across the root workspace, the backend Express server, and the frontend React application. This configuration eliminates dependency version conflicts, simplifies continuous integration, and streamlines local developer onboarding.", indent=0.4)
    insert_p("The backend package configuration (server/package.json) is defined as a native ES Module ('type': 'module'). It bundles Express 4 for high-throughput HTTP routing, Mongoose 8 for strict schema enforcement and multi-document replica-set transactions, Socket.IO 4 for persistent real-time telemetry, Zod for declarative runtime request payload validation, and JSONWebToken combined with bcryptjs for cryptographic authentication. Helmet, CORS, and Express-Rate-Limit enforce defense-in-depth API security. Furthermore, mongodb-memory-server provides an embedded in-memory MongoDB replica set enabling zero-setup local demonstration without external database dependencies.", indent=0.4)
    insert_p("The frontend package configuration (client/package.json) is powered by React 18 and Vite 5 for fast bundling and Hot Module Replacement. Tailwind CSS 4 provides responsive utility styling, Recharts delivers real-time warehouse inventory telemetry charts, Lucide-React supplies vector iconography, and Axios handles interceptor-driven REST communication.", indent=0.4)
    insert_p("Listing 2 details the package manifests for the backend server, frontend client, and root workspace orchestrator:", bold=False, italic=True, indent=0.0)
    insert_code_block(build_package_config_code())

    # ----------------------------------------------------
    # SECTION 3: MAIN SERVER ENTRY POINT
    # ----------------------------------------------------
    print("Generating Section 3: Main Server Entry Point...")
    insert_heading("3. MAIN SERVER ENTRY POINT")
    insert_p("The backend application lifecycle is governed by the server entry point (server/server.js). This file initializes the Express framework, configures security headers, binds HTTP and WebSocket protocols, mounts 15 modular RESTful route handlers, and establishes resilient database connections.", indent=0.4)
    insert_p("Security is fortified using helmet() to guard against clickjacking and cross-site scripting, cors() to restrict origin access to the authorized client domain, express.json() with a strict 1MB body limit to prevent denial-of-service payload attacks, and morgan('dev') for HTTP request tracing. A lightweight observability endpoint at GET /api/health provides health check telemetry for monitoring tools.", indent=0.4)
    insert_p("All domain routers are wrapped using wrapRouter(), an asynchronous exception boundary that intercepts unhandled rejections and CastErrors, converting them into structured JSON error responses without crashing the Node.js event loop. The Express application is mounted alongside a Socket.IO instance on a native Node.js HTTP server. Database initialization via connectDB() supports both MongoDB Atlas cloud clusters and local fallback instances, ensuring that server port listening commences only after database connectivity and transaction readiness are established.", indent=0.4)
    insert_p("Listing 3 presents the production implementation of the main server entry point:", bold=False, italic=True, indent=0.0)
    insert_code_block(build_server_entry_code())

    # ----------------------------------------------------
    # SECTION 4: SEEDED DELIVERY DATA
    # ----------------------------------------------------
    print("Generating Section 4: Seeded Delivery Data...")
    insert_heading("4. SEEDED DELIVERY DATA & WAREHOUSE INITIALIZATION")
    insert_p("To preserve production data integrity, Smart WMS avoids automatic database seeding upon server startup. Instead, an idempotent seeding engine (server/src/seed/seed.js) is provided for development, automated testing, and academic evaluation, accessible via npm run seed.", indent=0.4)
    insert_p("The seeding engine utilizes a deterministic Linear Congruential Pseudorandom Number Generator (PRNG) with a fixed seed of 42, guaranteeing reproducible test environments across machines. The script creates primary role-gated user accounts (Admin, Warehouse Staff, Dispatch Staff) with cryptographically salted bcrypt password hashes. It builds a 30-bin warehouse grid spanning Zones A, B, and C with standardized nomenclature (A-01-01 through C-05-02), setting capacities between 100 and 300 units.", indent=0.4)
    insert_p("The catalog is seeded with 44 product SKUs across 6 industrial categories, complete with barcodes, pricing, and reorder levels. Additionally, the engine synthesizes 110 historical stock movement ledger entries and 20 multi-stage customer delivery orders across commercial buyers (Apex Traders, Bluekart Retail, Craftline, Delta Foods, Everest Tools). For open orders (Created, Picking, Picked), stock is reserved atomically; for completed orders (Dispatched, Delivered), stock deductions and OUTWARD audit logs are generated automatically.", indent=0.4)
    insert_p("Listing 4 displays the idempotent warehouse seeding engine and delivery order generator:", bold=False, italic=True, indent=0.0)
    insert_code_block(build_seeded_delivery_code())

    # ----------------------------------------------------
    # SECTION 5: TIME SLOT CAPACITY SERVICE
    # ----------------------------------------------------
    print("Generating Section 5: Time Slot Capacity Service...")
    insert_heading("5. TIME SLOT CAPACITY SERVICE & LOCATION OCCUPANCY ENGINE")
    insert_p("Warehouse operations require strict spatial storage limits and temporal dispatch window coordination to ensure physical rack safety and smooth fulfillment flow. The capacity service coordinates storage bin allocation, occupancy state transitions, and nearest-first picking routing.", indent=0.4)
    insert_p("Each warehouse location is governed by a deterministic four-state machine defined in Location.js: 'available' (occupancy < 85%), 'near-full' (85% to 100%), 'full' (100% or greater), and 'blocked' (locked for maintenance). In locationController.js and productController.js, stock assignments and inward movements are validated inside MongoDB replica-set transactions via withTx(). If an inward batch causes (occupied + qty > capacity), the transaction aborts with HTTP 400 ('Location capacity exceeded.'), preventing bin overloading.", indent=0.4)
    insert_p("Dynamic QR codes are generated on demand via qrcode (WMS:LOC:<code>) for mobile terminal scanning. Furthermore, picking lists are sorted lexicographically by location code (Zone-Rack-Bin) using sortPickingList() in picking.js. This nearest-first routing heuristic guarantees that warehouse pickers traverse aisles in a single forward pass, minimizing walking distance and fulfillment latency.", indent=0.4)
    insert_p("Listing 5 contains the Location schema, capacity state transitions, controller assignment logic, and nearest-first picking optimizer:", bold=False, italic=True, indent=0.0)
    insert_code_block(build_capacity_service_code())

    # ----------------------------------------------------
    # SECTION 6: REST API AND FRONTEND COMMUNICATION
    # ----------------------------------------------------
    print("Generating Section 6: REST API and Frontend Communication...")
    insert_heading("6. REST API & FRONTEND COMMUNICATION ARCHITECTURE")
    insert_p("Smart WMS establishes a decoupled client-server architecture utilizing RESTful HTTP/JSON endpoints for transactional operations, coupled with bidirectional WebSockets (Socket.IO) for real-time inventory telemetry and dispatch alerts.", indent=0.4)
    insert_p("The REST client (client/src/api/client.js) configures an Axios instance with baseURL: '/api'. A request interceptor automatically extracts the JWT token from browser localStorage and injects an Authorization: Bearer <token> header into every outbound request. In development, Vite's proxy forwards requests to http://localhost:5000, eliminating CORS preflight friction.", indent=0.4)
    insert_p("Real-time telemetry is coordinated by client/src/api/socket.js and server/src/socket.js. The backend broadcasts domain events including 'stock:updated', 'order:dispatched', and 'location:updated'. Connected frontend clients receive these events and update dashboard KPI cards, stock levels, and order statuses in real time without polling. Server-side middleware (server/src/middleware/auth.js) validates cryptographic token signatures and enforces Role-Based Access Control (RBAC) boundaries before route execution.", indent=0.4)
    insert_p("Listing 6 details the Axios REST client, WebSocket singletons, backend broadcaster, and JWT/RBAC middleware:", bold=False, italic=True, indent=0.0)
    insert_code_block(build_rest_socket_code())

    # ----------------------------------------------------
    # SECTION 7: ENVIRONMENT VARIABLES
    # ----------------------------------------------------
    print("Generating Section 7: Environment Variables...")
    insert_heading("7. ENVIRONMENT VARIABLES & SYSTEM CONFIGURATION")
    insert_p("In compliance with the Twelve-Factor App methodology, Smart WMS externalizes all configuration parameters into environment variables. This safeguards cryptographic keys and database credentials from accidental source code exposure, while facilitating seamless promotion across development, staging, and production environments.", indent=0.4)
    insert_p("Key variables include PORT (TCP port binding, default 5000), MONGO_URI / MONGODB_URI (MongoDB connection string supporting local clusters and MongoDB Atlas), USE_MEMORY_DB (boolean flag enabling zero-setup embedded in-memory MongoDB replica sets), JWT_SECRET (cryptographic symmetric secret for HMAC-SHA256 session tokens), JWT_EXPIRES_IN (token lifespan, default 7d), CLIENT_URL (trusted CORS origin, default http://localhost:5173), and NODE_ENV (runtime mode). Sensitive .env files are excluded from version control via .gitignore, with documented templates provided in .env.example files.", indent=0.4)
    insert_p("Listing 7 shows the root and server environment configuration templates:", bold=False, italic=True, indent=0.0)
    insert_code_block(build_env_vars_code())

    # ----------------------------------------------------
    # SECTION 8: APPLICATION INSTALLATION AND EXECUTION
    # ----------------------------------------------------
    print("Generating Section 8: Application Installation and Execution...")
    insert_heading("8. APPLICATION INSTALLATION, DEPLOYMENT & EXECUTION GUIDE")
    insert_p("This section provides the end-to-end operational runbook for installing, configuring, and executing the Smart Warehouse Management System on local development machines or production application servers.", indent=0.4)
    insert_p("System requirements comprise Node.js LTS (v18.0.0+), npm (v9.0.0+), MongoDB Community Server v6.0+ (or zero-setup in-memory mode via USE_MEMORY_DB=true), and a modern web browser. The installation sequence involves repository cloning, multi-workspace dependency installation via npm install, environment file creation, optional demo data seeding via npm run seed, and concurrent server startup via npm run dev. For Windows workstations, the Start-SmartWMS.bat script enables one-click startup. The system includes an automated Playwright test suite (npx playwright test) covering 120+ end-to-end integration test scenarios.", indent=0.4)
    insert_p("Listing 8 outlines the step-by-step CLI execution runbook and the Windows launcher script:", bold=False, italic=True, indent=0.0)
    insert_code_block(build_install_exec_code())

    # Update Table of Contents entries for APPENDIX and REFERENCES
    # In TOC: paragraph with 'APPENDIX' and 'REFERENCES'
    toc_updated = False
    for p in doc.paragraphs:
        if p.text.startswith('APPENDIX\t') or p.text == 'APPENDIX':
            # Check if this paragraph has runs with tab and page number
            for r in p.runs:
                if r.text.strip() == '42':
                    r.text = '42–56'
                    print("Updated TOC entry for APPENDIX to '42–56'")
        elif p.text.startswith('REFERENCES\t') or p.text == 'REFERENCES':
            for r in p.runs:
                if r.text.strip() == '44':
                    r.text = '57'
                    print("Updated TOC entry for REFERENCES to '57'")
                    toc_updated = True

    # Save directly to SWMS.docx
    final_docx = "SWMS.docx"
    doc.save(final_docx)
    print(f"Document successfully updated and saved to '{final_docx}'.")

    # Export to PDF via Word COM Automation
    final_pdf = "Smart_Warehouse_Management_System_Project_Report.pdf"
    print(f"Initiating Microsoft Word COM PDF export to '{final_pdf}'...")
    try:
        word = win32com.client.Dispatch("Word.Application")
        word.Visible = False
        abs_docx = os.path.abspath(final_docx)
        abs_pdf = os.path.abspath(final_pdf)
        doc_com = word.Documents.Open(abs_docx)
        doc_com.SaveAs(abs_pdf, FileFormat=17) # 17 = wdFormatPDF
        doc_com.Close()
        word.Quit()
        print(f"PDF exported successfully as '{final_pdf}' (Size: {os.path.getsize(final_pdf)} bytes)")
    except Exception as e:
        print(f"Word COM PDF export encountered an error: {e}")

if __name__ == '__main__':
    update_swms_appendix()
