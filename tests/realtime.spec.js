import { test, expect } from '@playwright/test';
import { apiToken, api } from './helpers.js';

test.describe('realtime', () => {
  test('stock change in one context updates the other without refresh + bell increments', async ({ browser }) => {
    const ctxA = await browser.newContext();
    const ctxB = await browser.newContext();
    const pageA = await ctxA.newPage();
    const pageB = await ctxB.newPage();

    const { token: tA, user: uA } = await apiToken('admin');
    const { token: tB, user: uB } = await apiToken('warehouse');
    for (const [page, sess] of [[pageA, { token: tA, user: uA }], [pageB, { token: tB, user: uB }]]) {
      await page.addInitScript((s) => {
        window.__NO_ANIM__ = true;
        localStorage.setItem('token', s.token);
        localStorage.setItem('user', JSON.stringify(s.user));
      }, sess);
    }

    await pageA.goto('/');
    await pageB.goto('/products');
    await expect(pageA.getByText('Warehouse Overview')).toBeVisible({ timeout: 15000 });
    // Ensure A's socket is connected before capturing the baseline, else the update event is missed.
    await expect(pageA.getByTestId('live-badge')).toContainText('Live', { timeout: 15000 });
    await pageA.waitForTimeout(1500); // count-up animation settles

    const kpi = pageA.getByTestId('kpi-total-products');
    const beforeTxt = await kpi.textContent();
    const before = await api(tA).call('GET', '/notifications?tab=unread&limit=1').then((r) => r.body.unread);

    // act in B's session: create + receive a product
    const W = api(tB);
    const p = await W.call('POST', '/products', { name: 'Realtime Part', sku: `RT-${Date.now()}` });
    const rl = await W.call('POST', '/locations', { code: `RT-${Date.now().toString().slice(-5)}`, zone: 'T', rack: 'RT', shelf: 'T', capacity: 500 });
    expect(rl.status).toBe(201);
    const iw = await W.call('POST', `/products/${p.body._id}/inward`, { qty: 25, locationId: rl.body._id });
    expect(iw.status).toBe(200);

    // A's dashboard KPI updates via socket without refresh
    const expected = parseInt(beforeTxt.replace(/\D/g, ''), 10) + 1;
    await expect(kpi).toContainText(String(expected), { timeout: 30000 });

    // notification bell count increments for admin
    const after = await api(tA).call('GET', '/notifications?tab=unread&limit=1').then((r) => r.body.unread);
    expect(after).toBeGreaterThan(before);

    await ctxA.close();
    await ctxB.close();
  });
});
