import { test, expect } from '@playwright/test';
import { apiToken, loginAs, api } from './helpers.js';

test.describe('orders & dispatch', () => {
  test('full lifecycle: reserve → pick → dispatch deducts → history + cancel releases', async ({ page }) => {
    await loginAs(page, 'dispatch');
    const { token } = await apiToken('dispatch');
    const D = api(token);
    const { token: wt } = await apiToken('warehouse');
    const W = api(wt);

    // stock a product via warehouse API
    const p = await W.call('POST', '/products', { name: 'Orderable', sku: `ORDP-${Date.now()}` });
    const pid = p.body._id;
    const oloc = await W.call('POST', '/locations', { code: `ORD-${Date.now().toString().slice(-5)}`, zone: 'T', rack: 'OR', shelf: 'D', capacity: 500 });
    await W.call('POST', `/products/${pid}/inward`, { qty: 30, locationId: oloc.body._id });

    // insufficient stock rejected
    const bad = await D.call('POST', '/orders', { customerName: 'Big Buyer', items: [{ productId: pid, qty: 999 }] });
    expect(bad.status).toBe(400);

    // create reserves
    const created = await D.call('POST', '/orders', { customerName: 'Buyer One', customerPhone: '9000000001', items: [{ productId: pid, qty: 6 }] });
    expect(created.status).toBe(201);
    expect(created.body.orderNo).toMatch(/^ORD-\d{5}$/);
    const oid = created.body._id;
    const afterCreate = await W.call('GET', `/products/${pid}`);
    // available excludes reserved
    expect(afterCreate.body.product.reservedQuantity).toBe(6);

    // picking list sorted by location
    const pick = await D.call('POST', `/orders/${oid}/to-picking`, {});
    expect(pick.status).toBe(200);
    expect(pick.body.pickingList.length).toBe(1);

    // status flow UI: open detail, mark picked, dispatch with carrier
    await page.goto(`/orders/${oid}`);
    await expect(page.getByTestId('order-status')).toContainText('Picking');
    await page.getByTestId('mark-picked').click();
    await expect(page.getByTestId('order-status')).toContainText('Picked', { timeout: 10000 });
    await page.getByTestId('mark-dispatched').click();
    await page.getByRole('button', { name: 'Confirm Dispatch' }).click();
    await expect(page.getByTestId('order-status')).toContainText('Dispatched', { timeout: 15000 });

    // stock deducted, reservation cleared
    const after = await W.call('GET', `/products/${pid}`);
    expect(after.body.product.totalQuantity).toBe(24);
    expect(after.body.product.reservedQuantity).toBe(0);

    // cancel releases reserved stock
    const c2 = await D.call('POST', '/orders', { customerName: 'Buyer Two', items: [{ productId: pid, qty: 4 }] });
    const cancel = await D.call('POST', `/orders/${c2.body._id}/cancel`, {});
    expect(cancel.status).toBe(200);
    const afterCancel = await W.call('GET', `/products/${pid}`);
    expect(afterCancel.body.product.reservedQuantity).toBe(0);

    // history filter
    await page.goto('/dispatch-history');
    await expect(page.getByText(created.body.orderNo).first()).toBeVisible({ timeout: 15000 });
  });

  test('kanban drag-and-drop updates status', async ({ page }) => {
    await loginAs(page, 'dispatch');
    const { token } = await apiToken('dispatch');
    const D = api(token);
    const { token: wt } = await apiToken('warehouse');
    const W = api(wt);
    const p = await W.call('POST', '/products', { name: 'Kanban Item', sku: `KBN-${Date.now()}` });
    const kloc = await W.call('POST', '/locations', { code: `KBN-${Date.now().toString().slice(-5)}`, zone: 'T', rack: 'KB', shelf: 'N', capacity: 500 });
    await W.call('POST', `/products/${p.body._id}/inward`, { qty: 20, locationId: kloc.body._id });
    const o = await D.call('POST', '/orders', { customerName: 'Drag Co', items: [{ productId: p.body._id, qty: 2 }] });

    await page.goto('/orders');
    await page.getByText('Board', { exact: true }).click();
    const card = page.getByTestId(`kanban-card-${o.body.orderNo}`);
    await expect(card).toBeVisible({ timeout: 15000 });
    await card.dragTo(page.getByTestId('kanban-Picking'), { targetPosition: { x: 60, y: 20 } });
    await expect(page.getByTestId('kanban-Picking').getByText(o.body.orderNo)).toBeVisible({ timeout: 10000 });
  });
});
