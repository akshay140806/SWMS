// Global setup: guarantee the 3 role users exist on a scratch database
// (server no longer auto-seeds). Idempotent — safe to re-run.
import { request } from '@playwright/test';

const BASE = 'http://localhost:5000';
const USERS = [
  { name: 'Admin', email: 'admin@warehouse.com', password: 'Admin@123', role: 'admin', setup: true },
  { name: 'Warehouse Staff', email: 'staff@warehouse.com', password: 'Staff@123', role: 'warehouse_staff' },
  { name: 'Dispatch Staff', email: 'dispatch@warehouse.com', password: 'Dispatch@123', role: 'dispatch_staff' }
];

export default async function globalSetup() {
  if (process.env.SKIP_GLOBAL_SETUP === '1') {
    console.log('global-setup: skipped (SKIP_GLOBAL_SETUP=1) — true scratch DB');
    return;
  }
  const req = await request.newContext({ baseURL: BASE });
  const status = await req.get('/api/setup/status').then((r) => r.json());
  if (status.needsSetup) {
    const admin = USERS[0];
    const res = await req.post('/api/setup', {
      data: { warehouseName: 'Test Store', address: 'Test St', timeZone: 'Asia/Kolkata', currency: 'INR', name: admin.name, email: admin.email, password: admin.password }
    });
    if (!res.ok()) throw new Error(`setup failed: ${await res.text()}`);
    console.log('global-setup: organization + admin created');
  }
  const login = await req.post('/api/auth/login', { data: { email: USERS[0].email, password: USERS[0].password } });
  const { token } = await login.json();
  for (const u of USERS.slice(1)) {
    const r = await req.post('/api/users', {
      headers: { Authorization: `Bearer ${token}` },
      data: { name: u.name, email: u.email, password: u.password, role: u.role }
    });
    if (![201, 400].includes(r.status())) throw new Error(`user seed failed ${u.email}: ${await res_text(r)}`);
  }
  console.log('global-setup: role users ensured');
  // Skip the first-run wizard for all suites except the wizard test itself
  // (it toggles onboarded false→true explicitly).
  await req.put('/api/settings', {
    headers: { Authorization: `Bearer ${token}` },
    data: { onboarded: true }
  });
  await req.dispose();
}

async function res_text(r) {
  try { return await r.text(); } catch { return String(r.status()); }
}
