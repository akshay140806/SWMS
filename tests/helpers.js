import { request as baseRequest } from '@playwright/test';

export const CREDS = {
  admin: { email: 'admin@warehouse.com', password: 'Admin@123' },
  warehouse: { email: 'staff@warehouse.com', password: 'Staff@123' },
  dispatch: { email: 'dispatch@warehouse.com', password: 'Dispatch@123' }
};

export async function apiToken(role = 'admin') {
  const req = await baseRequest.newContext({ baseURL: 'http://localhost:5000' });
  const res = await req.post('/api/auth/login', { data: CREDS[role] });
  if (!res.ok()) throw new Error(`seed login failed for ${role}: ${await res.text()}`);
  const { token, user } = await res.json();
  await req.dispose();
  return { token, user };
}

export async function loginAs(page, role = 'admin') {
  const { token, user } = await apiToken(role);
  await page.addInitScript(
    ({ token, user }) => {
      window.__NO_ANIM__ = true; // deterministic KPI numbers for assertions
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
    },
    { token, user }
  );
}

export function api(token) {
  return {
    async call(method, path, data) {
      const req = await baseRequest.newContext({
        baseURL: 'http://localhost:5000',
        extraHTTPHeaders: { Authorization: `Bearer ${token}` }
      });
      const res = await req.fetch(`/api${path}`, { method, data });
      const body = await res.json().catch(() => ({}));
      await req.dispose();
      return { status: res.status(), body };
    }
  };
}
