import { test, expect } from '@playwright/test';
import { apiToken, loginAs, api } from './helpers.js';

test.describe('locations', () => {
  test('create + assign + over-capacity blocked + move + rack map', async ({ page }) => {
    await loginAs(page, 'warehouse');
    const { token } = await apiToken('warehouse');

    const code = `Z-09-${Date.now().toString().slice(-4)}`;
    const created = await api(token).call('POST', '/locations', { code, zone: 'Z', rack: '09', shelf: 'B9', capacity: 10 });
    expect(created.status).toBe(201);
    const locId = created.body._id;

    // assign product to location
    const prods = await api(token).call('GET', '/products?limit=2');
    const pid = prods.body.items[0]._id;
    const asg = await api(token).call('POST', '/locations/assign', { productId: pid, locationId: locId, qty: 4 });
    expect(asg.status).toBe(200);
    expect(asg.body.occupied).toBe(4);

    // over-capacity blocked
    const over = await api(token).call('POST', '/locations/assign', { productId: pid, locationId: locId, qty: 999 });
    expect(over.status).toBe(400);

    // inward to fill, then over-capacity inward blocked
    const full = await api(token).call('POST', `/products/${pid}/inward`, { qty: 6, locationId: locId, reference: 'T' });
    expect(full.status).toBe(200);
    const over2 = await api(token).call('POST', `/products/${pid}/inward`, { qty: 1, locationId: locId });
    expect(over2.status).toBe(400);

    // move 2 units to a fresh location with room
    const dest = await api(token).call('POST', '/locations', { code: `Z-08-${Date.now().toString().slice(-4)}`, zone: 'Z', rack: '08', shelf: 'B8', capacity: 500 });
    const other = dest.body;
    const mv = await api(token).call('POST', `/products/${pid}/transfer`, { qty: 2, fromLocationId: locId, toLocationId: other._id });
    expect(mv.status).toBe(200);

    // rack map shows occupancy
    await page.goto('/locations');
    await expect(page.getByTestId(`bin-${code}`).first()).toBeVisible({ timeout: 15000 });
    await expect(page.getByTestId(`bin-${code}`).first()).toContainText('8/10');
  });
});
