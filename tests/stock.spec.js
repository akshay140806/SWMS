import { test, expect } from '@playwright/test';
import { apiToken, loginAs, api } from './helpers.js';

test.describe('stock ledger', () => {
  test('inward/outward/transfer/damage + negatives blocked + ledger immutable', async ({ page }) => {
    await loginAs(page, 'warehouse');
    const { token } = await apiToken('warehouse');
    const A = api(token);

    const p = await A.call('POST', '/products', { name: 'Ledger Item', sku: `LDG-${Date.now()}` });
    expect(p.status).toBe(201);
    const pid = p.body._id;
    const locs = await A.call('GET', '/locations');
    const l1 = (await A.call('POST', '/locations', { code: `STK-A-${Date.now().toString().slice(-5)}`, zone: 'T', rack: 'ST', shelf: 'A', capacity: 500 })).body;
    const l2 = (await A.call('POST', '/locations', { code: `STK-B-${Date.now().toString().slice(-5)}`, zone: 'T', rack: 'ST', shelf: 'B', capacity: 500 })).body;

    const iw = await A.call('POST', `/products/${pid}/inward`, { qty: 50, locationId: l1._id, reference: 'PO-1' });
    expect(iw.status).toBe(200);
    expect(iw.body.totalQuantity).toBe(50);

    // negative stock blocked
    const neg = await A.call('POST', `/products/${pid}/outward`, { qty: 999, reference: 'X' });
    expect(neg.status).toBe(400);

    const ow = await A.call('POST', `/products/${pid}/outward`, { qty: 10, locationId: l1._id, reference: 'SO-1' });
    expect(ow.body.totalQuantity).toBe(40);

    const tr = await A.call('POST', `/products/${pid}/transfer`, { qty: 5, fromLocationId: l1._id, toLocationId: l2._id });
    expect(tr.status).toBe(200);

    const dg = await A.call('POST', `/products/${pid}/damage`, { qty: 3, locationId: l2._id, reason: 'Expired' });
    expect(dg.body.damagedQuantity).toBe(3);
    expect(dg.body.availableQuantity).toBe(40 - 3);

    // ledger entries exist for all four types
    const led = await A.call('GET', `/movements?productId=${pid}`);
    const types = led.body.items.map((m) => m.type).sort();
    expect(types).toEqual(['DAMAGED', 'INWARD', 'OUTWARD', 'TRANSFER']);

    // ledger has no edit/delete routes
    const noEdit = await A.call('POST', `/movements/${led.body.items[0]._id}/edit`, {});
    expect([404, 405]).toContain(noEdit.status);

    // UI ledger shows the entries
    await page.goto('/movements');
    await expect(page.getByTestId('movement-row').first()).toBeVisible({ timeout: 15000 });
  });
});
