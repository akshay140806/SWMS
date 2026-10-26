import { test, expect } from '@playwright/test';
import { apiToken, loginAs, api } from './helpers.js';

// Full journey: staff adds product + location + inward → dispatch creates order → pick → dispatch → verify.
test.describe('e2e journey', () => {
  test('staff-to-dispatch full flow', async ({ page }) => {
    await loginAs(page, 'warehouse');
    const { token: wt } = await apiToken('warehouse');
    const { token: dt } = await apiToken('dispatch');
    const W = api(wt);
    const D = api(dt);
    const sku = `E2E-${Date.now().toString().slice(-6)}`;

    // 1. add product (UI)
    await page.goto('/products');
    await page.getByTestId('add-product-btn').click();
    await page.getByTestId('product-name').fill('E2E Widget');
    await page.getByTestId('product-sku').fill(sku);
    await page.getByTestId('product-save').click();
    await expect(page.getByText('Product created successfully.')).toBeVisible({ timeout: 10000 });

    // 2. assign location + inward (API as warehouse)
    const prod = await W.call('GET', `/products?q=${sku}`).then((r) => r.body.items[0]);
    const eloc = await W.call('POST', '/locations', { code: `E2E-${Date.now().toString().slice(-5)}`, zone: 'T', rack: 'E2', shelf: 'E', capacity: 500 });
    const iw = await W.call('POST', `/products/${prod._id}/inward`, { qty: 40, locationId: eloc.body._id, reference: 'E2E-PO' });
    expect(iw.status).toBe(200);

    // 3. dispatch creates order (UI)
    await loginAs(page, 'dispatch');
    await page.goto('/orders');
    await page.getByTestId('new-order-btn').click();
    await page.getByTestId('order-customer').fill('E2E Customer');
    await page.getByTestId('order-product').selectOption(prod._id);
    await page.getByTestId('order-qty').fill('5');
    await page.getByText('+', { exact: true }).click();
    await expect(page.getByTestId('order-line')).toBeVisible({ timeout: 10000 });
    await page.getByTestId('order-create-submit').click();
    await expect(page.getByText(/created\./)).toBeVisible({ timeout: 15000 });

    // 4. pick → dispatch via detail page
    const created = await D.call('GET', '/orders?q=E2E Customer').then((r) => r.body.items[0]);
    await page.goto(`/orders/${created._id}`);
    await page.getByTestId('gen-pick').click();
    await expect(page.getByText('Picking List').first()).toBeVisible({ timeout: 10000 });
    await page.getByTestId('mark-picked').click();
    await page.getByTestId('mark-dispatched').click();
    await page.getByRole('button', { name: 'Confirm Dispatch' }).click();
    await expect(page.getByTestId('order-status')).toContainText('Dispatched', { timeout: 15000 });

    // 5. verify: stock reduced, ledger entries, dashboard, notification
    const after = await W.call('GET', `/products?q=${sku}`).then((r) => r.body.items[0]);
    expect(after.totalQuantity).toBe(35);
    const ledger = await W.call('GET', `/movements?productId=${prod._id}`).then((r) => r.body.items);
    expect(ledger.some((m) => m.type === 'INWARD')).toBe(true);
    expect(ledger.some((m) => m.type === 'OUTWARD')).toBe(true);
    const dash = await D.call('GET', '/dashboard/stats').then((r) => r.body);
    expect(dash.orders.dispatchedTotal).toBeGreaterThan(0);
    const notifs = await D.call('GET', '/notifications?tab=unread').then((r) => r.body.items);
    expect(notifs.some((n) => n.message.includes(created.orderNo))).toBe(true);
  });
});
