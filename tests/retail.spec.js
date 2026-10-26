import { test, expect } from '@playwright/test';
import { apiToken, loginAs, api } from './helpers.js';

test.describe('retail: setup to live trade', () => {
  test('setup gate: fresh flow uses onboarding, not demo data', async ({ request }) => {
    // On a used DB setup is complete; the endpoint must refuse re-setup.
    const st = await request.get('http://localhost:5000/api/setup/status').then((r) => r.json());
    expect(typeof st.needsSetup).toBe('boolean');
    if (!st.needsSetup) {
      const r = await request.post('http://localhost:5000/api/setup', { data: { warehouseName: 'X', name: 'X', email: 'x@x.com', password: 'Xx@12345' } });
      expect(r.status()).toBe(403);
    }
  });

  test('onboarding gate: setup form on empty DB, login redirect once initialized', async ({ page }) => {
    await page.goto('/onboarding');
    await page.waitForTimeout(2000);
    const url = page.url();
    if (url.includes('/onboarding')) {
      await expect(page.getByTestId('setup-store')).toBeVisible({ timeout: 15000 });
      await expect(page.getByTestId('setup-submit')).toBeVisible();
    } else {
      // DB already initialized (global-setup ran) → gate correctly sends us to login.
      await expect(page).toHaveURL(/\/login/);
      await expect(page.getByTestId('login-submit')).toBeVisible();
    }
  });

  test('customers + vendors CRUD (UI + API)', async ({ page }) => {
    await loginAs(page, 'admin');
    const { token } = await apiToken('admin');
    const A = api(token);
    const stamp = Date.now().toString().slice(-5);

    const c = await A.call('POST', '/customers', { name: `Cust ${stamp}`, phone: '9000000001' });
    expect(c.status).toBe(201);
    const v = await A.call('POST', '/vendors', { name: `Vend ${stamp}`, phone: '9000000002' });
    expect(v.status).toBe(201);

    await page.goto('/customers');
    await expect(page.getByText(`Cust ${stamp}`).first()).toBeVisible({ timeout: 15000 });
    await page.goto('/vendors');
    await expect(page.getByText(`Vend ${stamp}`).first()).toBeVisible({ timeout: 15000 });
  });

  test('purchase order: create → receive adds stock + ledger', async ({ page }) => {
    await loginAs(page, 'warehouse');
    const { token } = await apiToken('warehouse');
    const W = api(token);

    const v = await W.call('POST', '/vendors', { name: `PO-Vend ${Date.now().toString().slice(-5)}` });
    const p = await W.call('POST', '/products', { name: 'PO Item', sku: `POI-${Date.now()}` });
    const l = await W.call('POST', '/locations', { code: `PO-${Date.now().toString().slice(-5)}`, zone: 'T', rack: 'PO', shelf: 'P', capacity: 500 });
    const po = await W.call('POST', '/purchases', {
      vendorId: v.body._id, items: [{ productId: p.body._id, qty: 12, rate: 50, locationId: l.body._id }], status: 'Ordered'
    });
    expect(po.status).toBe(201);
    expect(po.body.poNo).toMatch(/^PO-\d{5}$/);

    const rec = await W.call('POST', `/purchases/${po.body._id}/receive`, {});
    expect(rec.status).toBe(200);
    expect(rec.body.status).toBe('Received');

    const after = await W.call('GET', `/products/${p.body._id}`).then((r) => r.body.product);
    expect(after.totalQuantity).toBe(12);
    const led = await W.call('GET', `/movements?productId=${p.body._id}`).then((r) => r.body.items);
    expect(led.some((m) => m.type === 'INWARD' && m.reference === po.body.poNo)).toBe(true);

    await page.goto('/purchases');
    await expect(page.getByText(po.body.poNo).first()).toBeVisible({ timeout: 15000 });
  });

  test('invoice from dispatched order + pay + print view', async ({ page }) => {
    await loginAs(page, 'dispatch');
    const { token: dt } = await apiToken('dispatch');
    const { token: wt } = await apiToken('warehouse');
    const D = api(dt);
    const W = api(wt);

    const p = await W.call('POST', '/products', { name: 'Billable', sku: `BIL-${Date.now()}`, sellingPrice: 120 });
    const l = await W.call('POST', '/locations', { code: `BI-${Date.now().toString().slice(-5)}`, zone: 'T', rack: 'BI', shelf: 'L', capacity: 500 });
    await W.call('POST', `/products/${p.body._id}/inward`, { qty: 10, locationId: l.body._id });
    const o = await D.call('POST', '/orders', { customerName: 'Invoice Co', items: [{ productId: p.body._id, qty: 2 }] });
    await D.call('POST', `/orders/${o.body._id}/dispatch`, { carrier: 'FastRoad', trackingNo: 'TRK1' });

    const inv = await D.call('POST', '/invoices/from-order', { orderId: o.body._id, taxRate: 18 });
    expect(inv.status).toBe(201);
    expect(inv.body.invoiceNo).toMatch(/^INV-\d{5}$/);
    expect(inv.body.grandTotal).toBe(240 + Math.round(240 * 0.18));

    // duplicate invoice blocked
    const dup = await D.call('POST', '/invoices/from-order', { orderId: o.body._id });
    expect(dup.status).toBe(400);

    const paid = await D.call('POST', `/invoices/${inv.body._id}/pay`, {});
    expect(paid.body.status).toBe('Paid');

    await page.goto(`/invoices/${inv.body._id}`);
    await expect(page.getByText(inv.body.invoiceNo).first()).toBeVisible({ timeout: 15000 });
  });

  test('fulfil: pack → auto-shipment on dispatch → challan → sales return restocks', async ({ page }) => {
    await loginAs(page, 'dispatch');
    const { token: dt } = await apiToken('dispatch');
    const { token: wt } = await apiToken('warehouse');
    const D = api(dt);
    const W = api(wt);

    const p = await W.call('POST', '/products', { name: 'Shippable', sku: `SHP-${Date.now()}` });
    const l = await W.call('POST', '/locations', { code: `SH-${Date.now().toString().slice(-5)}`, zone: 'T', rack: 'SH', shelf: 'P', capacity: 500 });
    await W.call('POST', `/products/${p.body._id}/inward`, { qty: 20, locationId: l.body._id });
    const o = await D.call('POST', '/orders', { customerName: 'Ship Co', items: [{ productId: p.body._id, qty: 4 }] });
    await D.call('POST', `/orders/${o.body._id}/to-picking`, {});

    const pack = await D.call('POST', `/packages/orders/${o.body._id}/pack`, { weight: 2.5 });
    // pack endpoint: /api/orders/:id/pack OR /api/packages/orders/:id/pack — accept either
    let pkg = pack;
    if (pkg.status === 404) pkg = await D.call('POST', `/orders/${o.body._id}/pack`, { weight: 2.5 });
    expect(pkg.status).toBe(201);
    expect(pkg.body.packageNo).toMatch(/^PKG-\d{5}$/);

    await D.call('POST', `/orders/${o.body._id}/to-picked`, {});
    await D.call('POST', `/orders/${o.body._id}/dispatch`, { carrier: 'C', trackingNo: 'T' });

    // auto-shipment exists
    const ships = await D.call('GET', '/shipments').then((r) => r.body.items);
    const mine = ships.find((s) => s.order?.orderNo === o.body.orderNo || String(s.order?._id || s.order) === String(o.body._id));
    expect(mine).toBeTruthy();
    expect(mine.shipmentNo).toMatch(/^SHP-\d{5}$/);

    const challan = await D.call('GET', `/shipments/${mine._id}/challan`);
    expect(challan.status).toBe(200);
    expect(challan.body.shipment.order).toBeTruthy();

    // sales return restocks
    const ret = await D.call('POST', '/returns', { orderId: o.body._id, customerName: 'Ship Co', items: [{ product: p.body._id, qty: 1 }], reason: 'Quality defect' });
    expect(ret.status).toBe(201);
    const after = await W.call('GET', `/products/${p.body._id}`).then((r) => r.body.product);
    expect(after.totalQuantity).toBe(20 - 4 + 1);

    await page.goto('/shipments');
    await expect(page.getByText(mine.shipmentNo).first()).toBeVisible({ timeout: 15000 });
    await page.goto('/packages');
    await expect(page.getByText(pkg.body.packageNo).first()).toBeVisible({ timeout: 15000 });
  });

  test('catalog: groups + price lists', async ({ page }) => {
    await loginAs(page, 'admin');
    const { token } = await apiToken('admin');
    const A = api(token);
    const g = await A.call('POST', '/catalog/groups', { name: `Grp ${Date.now().toString().slice(-5)}` });
    expect(g.status).toBe(201);
    const pl = await A.call('POST', '/catalog/price-lists', { name: `PL ${Date.now().toString().slice(-5)}` });
    expect(pl.status).toBe(201);

    await page.goto('/groups');
    await expect(page.getByText(g.body.name).first()).toBeVisible({ timeout: 15000 });
    await page.goto('/pricelists');
    await expect(page.getByText(pl.body.name).first()).toBeVisible({ timeout: 15000 });
  });
});
