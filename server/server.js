import 'dotenv/config';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });
import http from 'http';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import mongoose from 'mongoose';
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
import aiRoutes from './src/routes/ai.js';

const allowedOrigins = (origin, callback) => {
  if (!origin) return callback(null, true);
  const clientEnv = process.env.CLIENT_URL ? process.env.CLIENT_URL.trim().replace(/\/+$/, '') : '';
  const cleanOrigin = origin.trim().replace(/\/+$/, '');
  if (
    !clientEnv ||
    clientEnv === '*' ||
    cleanOrigin === clientEnv ||
    cleanOrigin.endsWith('.vercel.app') ||
    cleanOrigin.includes('localhost') ||
    cleanOrigin.includes('127.0.0.1')
  ) {
    return callback(null, true);
  }
  return callback(null, true);
};

const app = express();
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));
app.use('/api', apiLimiter);

const DB_STATES = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };

app.get('/api/health', (req, res) => {
  const readyState = mongoose.connection.readyState;
  res.json({
    ok: true,
    service: 'smart-warehouse-server',
    version: '1.0',
    database: {
      status: DB_STATES[readyState] || 'unknown',
      connected: readyState === 1,
      host: mongoose.connection.host || null,
      name: mongoose.connection.name || null
    }
  });
});

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
  ['/api/catalog', catalogRoutes],
  ['/api/ai', aiRoutes]
]) {
  app.use(path, wrapRouter(router));
}
app.use('/api', wrapRouter(fulfilRoutes));
app.use('/api', wrapRouter(aliasesRoutes));

app.use('/api', notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: allowedOrigins, credentials: true } });
initSocket(io);

// Listen immediately on PORT so cloud platforms (Render, Railway) detect open port without timing out
server.listen(PORT, '0.0.0.0', () => console.log(`Server listening on port :${PORT}`));

let isConnecting = false;
async function initDatabase() {
  if (mongoose.connection.readyState === 1 || isConnecting) return;
  isConnecting = true;
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/smart-warehouse';
  try {
    await connectDB(uri);
    isConnecting = false;
  } catch (e) {
    isConnecting = false;
    console.error('MongoDB connection attempt failed:', e.message);
    console.warn('-> Tip: If deploying on Render, make sure MongoDB Atlas Network Access allows 0.0.0.0/0 (IP whitelist).');
    console.log('-> Retrying MongoDB connection in 5 seconds...');
    setTimeout(initDatabase, 5000);
  }
}

initDatabase();
