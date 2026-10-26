import { test, expect } from '@playwright/test';
import { apiToken, loginAs, api } from './helpers.js';

test.describe('products', () => {
  test('create, search, edit, low-stock badge, delete', async ({ page }) => {
    await loginAs(page, 'admin');
    const sku = `TST-${Date.now().toString().slice(-6)}`;
    await page.goto('/products');
    await page.getByTestId('add-product-btn').click();
    await page.getByTestId('product-name').fill('Test Widget');
    await page.getByTestId('product-sku').fill(sku);
    await page.getByTestId('product-save').click();
    await expect(page.getByText('Product created successfully.')).toBeVisible({ timeout: 10000 });

    await page.getByTestId('product-search').fill(sku);
    await expect(page.getByText(sku).first()).toBeVisible({ timeout: 10000 });

    // duplicate SKU rejected
    const { token } = await apiToken('admin');
    const dup = await api(token).call('POST', '/products', { name: 'Dup', sku });
    expect(dup.status).toBe(400);

    // low-stock badge: reorderLevel default 10, qty 0 → Low Stock
    await expect(page.getByText('Low Stock').first()).toBeVisible();

    // delete via API (row has no stock so allowed)
    const created = await api(token).call('GET', `/products?q=${sku}`);
    const id = created.body.items[0]._id;
    const del = await api(token).call('DELETE', `/products/${id}`);
    expect(del.status).toBe(200);
  });

  test('CSV export downloads', async ({ page }) => {
    await loginAs(page, 'admin');
    await page.goto('/products');
    const download = page.waitForEvent('download', { timeout: 15000 });
    await page.getByText('Export CSV').click();
    const dl = await download;
    expect(dl.suggestedFilename()).toMatch(/products\.csv/);
  });

  test('pagination and filter work', async ({ page }) => {
    await loginAs(page, 'admin');
    const { token } = await apiToken('admin');
    const probe = await api(token).call('POST', '/products', { name: 'Filter Probe Alpha', sku: `FIL-${Date.now().toString(36)}${Math.floor(Math.random() * 999)}` });
    const sku = probe.body.sku;
    await page.goto('/products');
    await expect(page.getByText(/items$/).first()).toBeVisible({ timeout: 10000 });
    await page.getByTestId('product-search').fill('Filter Probe Alpha');
    await expect(page.getByText(sku).first()).toBeVisible({ timeout: 10000 });
    await api(token).call('DELETE', `/products/${probe.body._id}`);
  });
});
