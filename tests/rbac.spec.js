import { test, expect } from '@playwright/test';
import { apiToken, loginAs, api } from './helpers.js';

test.describe('rbac', () => {
  test('admin sees Users page', async ({ page }) => {
    await loginAs(page, 'admin');
    await page.goto('/users');
    await expect(page.getByText('User Management')).toBeVisible();
  });

  test('warehouse staff blocked from Users (403 page)', async ({ page }) => {
    await loginAs(page, 'warehouse');
    await page.goto('/users');
    await expect(page.getByText('Access denied')).toBeVisible();
  });

  test('dispatch staff cannot add products (API 403)', async () => {
    const { token } = await apiToken('dispatch');
    const { status, body } = await api(token).call('POST', '/products', { name: 'X', sku: `RBAC-${Date.now()}` });
    expect(status).toBe(403);
    expect(body.error).toMatch(/permission/i);
  });

  test('warehouse staff cannot create orders (API 403)', async () => {
    const { token } = await apiToken('warehouse');
    const { status } = await api(token).call('POST', '/orders', { customerName: 'Nope', items: [] });
    expect(status).toBe(403);
  });

  test('warehouse staff has no New Order button', async ({ page }) => {
    await loginAs(page, 'warehouse');
    await page.goto('/orders');
    await expect(page.getByTestId('new-order-btn')).toHaveCount(0);
  });
});
