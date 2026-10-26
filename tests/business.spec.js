import { test, expect } from '@playwright/test';
import { apiToken, loginAs, api } from './helpers.js';

test.describe('business modules', () => {
  test('customers + vendors CRUD with RBAC', async ({ page }) => {
    await loginAs(page, 'admin');
    const { token } = await apiToken('admin');
    const A = api(token);

    const c = await A.call('POST', '/customers', { name: `Buyer ${Date.now()}`, phone: '9000000001' });
    expect(c.status).toBe(201);
    const v = await A.call('POST', '/vendors', { name: `Supplier ${Date.now()}` });
    expect(v.status).toBe(201);

    // dispatch staff cannot create vendors (warehouse-only)
    const { token: dt } = await apiToken('dispatch');
    const denied = await api(dt).call('POST', '/vendors', { name: 'Nope' });
    expect(denied.status).toBe(403);

    await page.goto('/customers');
    await expect(page.getByTestId('customer-row').first()).toBeVisible({ timeout: 15000 });
    await page.goto('/vendors');
    await expect(page.getByRole('heading', { name: 'Vendors' })).toBeVisible();
  });

  test('groups + price lists', async ({ page }) => {
    await loginAs(page, 'admin');
    const { token } = await apiToken('admin');
    const A = api(token);
    const g = await A.call('POST', '/groups', { name: `Grp-${Date.now()}` });
    expect(g.status).toBe(201);

    let prods = await A.call('GET', '/products?limit=1').then((r) => r.body.items);
    if (!prods.length) {
      const created = await A.call('POST', '/products', { name: 'Pricelist Probe', sku: `PRB-${Date.now()}` });
      prods = [created.body];
    }
    const pl = await A.call('POST', '/pricelists', { name: `PL-${Date.now()}`, type: 'sales', isDefault: false, items: [{ product: prods[0]._id, price: 999 }] });
    expect(pl.status).toBe(201);

    await page.goto('/groups');
    await expect(page.getByTestId('group-row').first()).toBeVisible({ timeout: 15000 });
    await page.goto('/pricelists');
    await expect(page.getByTestId('pricelist-row').first()).toBeVisible({ timeout: 15000 });
  });

  test('PO create → receive adds stock + GRN', async () => {
    const { token: wt } = await apiToken('warehouse');
    const W = api(wt);
    const v = await W.call('POST', '/vendors', { name: `V-${Date.now()}` });
    const p = await W.call('POST', '/products', { name: 'PO Part', sku: `POP-${Date.now()}` });
    const loc = await W.call('POST', '/locations', { code: `PO-${Date.now().toString().slice(-5)}`, zone: 'T', rack: 'PO', shelf: 'P', capacity: 500 });
    const po = await W.call('POST', '/pos', { vendor: v.body._id, status: 'Ordered', items: [{ product: p.body._id, qty: 20, rate: 50 }] });
    expect(po.status).toBe(201);
    expect(po.body.poNo).toMatch(/^PO-\d{5}$/);

    const recv = await W.call('POST', `/pos/${po.body._id}/receive`, { items: [{ product: p.body._id, qty: 12 }], locationId: loc.body._id });
    expect(recv.status).toBe(201);
    expect(recv.body.grnNo).toMatch(/^GRN-\d{5}$/);

    const after = await W.call('GET', `/products/${p.body._id}`).then((r) => r.body.product);
    expect(after.totalQuantity).toBe(12);
    const ledger = await W.call('GET', `/movements?productId=${p.body._id}`).then((r) => r.body.items);
    expect(ledger.some((m) => m.type === 'INWARD' && m.reference === po.body.poNo)).toBe(true);
  });

  test('dispatch auto-creates shipment + challan; pack + return restock', async ({ page }) => {
    await loginAs(page, 'dispatch');
    const { token: dt } = await apiToken('dispatch');
    const { token: wt } = await apiToken('warehouse');
    const D = api(dt);
    const W = api(wt);
    const p = await W.call('POST', '/products', { name: 'Ship Part', sku: `SHP-${Date.now()}` });
    const loc = await W.call('POST', '/locations', { code: `SH-${Date.now().toString().slice(-5)}`, zone: 'T', rack: 'SH', shelf: 'S', capacity: 500 });
    await W.call('POST', `/products/${p.body._id}/inward`, { qty: 30, locationId: loc.body._id });
    const o = await D.call('POST', '/orders', { customerName: 'Ship Co', items: [{ product: p.body._id, qty: 5 }] });
    await D.call('POST', `/orders/${o.body._id}/to-picking`, {});
    await D.call('POST', `/orders/${o.body._id}/to-picked`, {});
    const pkg = await D.call('POST', `/orders/${o.body._id}/pack`, { weight: 2.5 });
    expect(pkg.status).toBe(201);
    expect(pkg.body.packageNo).toMatch(/^PKG-\d{5}$/);
    const disp = await D.call('POST', `/orders/${o.body._id}/dispatch`, { carrier: 'FastRoad', trackingNo: 'TRK1' });
    expect(disp.status).toBe(200);

    const ships = await D.call('GET', '/shipments').then((r) => r.body.items);
    const mine = ships.find((s) => s.order?.orderNo === o.body.orderNo || String(s.order?._id || s.order) === String(o.body._id));
    expect(mine).toBeTruthy();
    expect(mine.shipmentNo).toMatch(/^SHP-\d{5}$/);

    await page.goto(`/shipments/${mine._id}`);
    await expect(page.getByText('Delivery Challan')).toBeVisible({ timeout: 15000 });

    // sales return restocks
    const ret = await D.call('POST', '/returns', { customerName: 'Ship Co', items: [{ product: p.body._id, qty: 2 }], reason: 'Quality defect' });
    expect(ret.status).toBe(201);
    const after = await W.call('GET', `/products/${p.body._id}`).then((r) => r.body.product);
    expect(after.totalQuantity).toBe(27); // 30 - 5 + 2
  });

  test('onboarding wizard on fresh org, completes end-to-end', async ({ page }) => {
    await loginAs(page, 'admin');
    const { token } = await apiToken('admin');
    await api(token).call('PUT', '/settings', { onboarded: false });
    await page.goto('/');
    await expect(page.getByText('Name your store')).toBeVisible({ timeout: 15000 });
    await page.getByTestId('onboard-store').fill(`Store ${Date.now()}`);
    await page.getByTestId('onboard-next-1').click();
    await expect(page.getByText('Create your first location')).toBeVisible({ timeout: 10000 });
    await page.getByTestId('onboard-next-2').click();
    await expect(page.getByText('Add your first product')).toBeVisible({ timeout: 10000 });
    await page.getByTestId('onboard-product').fill('First Widget');
    await page.getByTestId('onboard-sku').fill(`WIZ-${Date.now().toString().slice(-6)}`);
    await page.getByTestId('onboard-finish').click();
    // Wait for the wizard to actually close (its product + settings saves must finish first).
    await expect(page.getByText('Add your first product')).toBeHidden({ timeout: 15000 });
    await expect(page.getByText('Warehouse Overview')).toBeVisible({ timeout: 15000 });
    const s = await api(token).call('GET', '/settings').then((r) => r.body);
    expect(s.onboarded).toBe(true);
    // restore test-org state for other suites
    await api(token).call('PUT', '/settings', { onboarded: true });
  });
});
