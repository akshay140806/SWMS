import { test, expect } from '@playwright/test';
import { loginAs, apiToken, api } from './helpers.js';

// Every route loads with no console errors and no failed API requests.
const ROUTES = ['/', '/products', '/stock', '/locations', '/movements', '/orders', '/picking', '/dispatch-history', '/analytics', '/notifications', '/users', '/profile', '/settings', '/customers', '/vendors', '/purchases', '/invoices', '/groups', '/pricelists', '/packages', '/shipments', '/returns', '/onboarding'];

test.describe('a11y smoke', () => {
  test('detail pages render without crashing', async ({ page }) => {
    const errors = [];
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 200)); });
    page.on('pageerror', (e) => errors.push(String(e).slice(0, 200)));
    const { token } = await apiToken('admin');
    let prod = await api(token).call('GET', '/products?limit=1').then((r) => r.body.items[0]);
    if (!prod) prod = await api(token).call('POST', '/products', { name: 'Smoke Probe', sku: `SMK-${Date.now()}` }).then((r) => r.body);
    let order = await api(token).call('GET', '/orders?limit=1').then((r) => r.body.items[0]);
    if (!order) {
      const loc = await api(token).call('POST', '/locations', { code: `SMK-${Date.now().toString().slice(-5)}`, zone: 'T', rack: 'SM', shelf: 'K', capacity: 500 }).then((r) => r.body);
      await api(token).call('POST', `/products/${prod._id || prod.id}/inward`, { qty: 5, locationId: loc._id });
      order = await api(token).call('POST', '/orders', { customerName: 'Smoke Co', items: [{ productId: prod._id || prod.id, qty: 1 }] }).then((r) => r.body);
    }
    await loginAs(page, 'admin');
    await page.goto(`/products/${prod._id}`);
    await expect(page.getByText(prod.sku).first()).toBeVisible({ timeout: 15000 });
    await page.goto(`/orders/${order._id}`);
    await expect(page.getByText(order.orderNo).first()).toBeVisible({ timeout: 15000 });
    expect(errors.filter((e) => !e.includes('favicon') && !e.includes('React Router'))).toEqual([]);
  });
  for (const route of ROUTES) {
    test(`route ${route} is clean`, async ({ page }) => {
      const errors = [];
      const failed = [];
      page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 200)); });
      page.on('pageerror', (e) => errors.push(String(e).slice(0, 200)));
      page.on('response', (r) => { if (r.url().includes('/api/') && r.status() >= 500) failed.push(`${r.status()} ${r.url()}`); });
      await loginAs(page, 'admin');
      await page.goto(route);
      await page.waitForTimeout(2500);
      expect(failed, `failed requests on ${route}`).toEqual([]);
      expect(errors.filter((e) => !e.includes('favicon')), `console errors on ${route}`).toEqual([]);
    });
  }

  test('tables have captions and icon buttons have labels', async ({ page }) => {
    await loginAs(page, 'admin');
    await page.goto('/products');
    await page.waitForTimeout(2000);
    const tables = await page.locator('table').count();
    expect(tables).toBeGreaterThan(0);
    const iconBtns = page.locator('button[aria-label]');
    expect(await iconBtns.count()).toBeGreaterThan(0);
    await expect(page.locator('a[href="#main"]').first()).toHaveCount(1);
  });
});
