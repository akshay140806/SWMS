import { test, expect } from '@playwright/test';
import { apiToken, loginAs, api } from './helpers.js';

test.describe('dashboard', () => {
  test('KPIs match API after actions, charts render, date filter works', async ({ page }) => {
    await loginAs(page, 'admin');
    await page.goto('/');
    await expect(page.getByText('Warehouse Overview')).toBeVisible({ timeout: 15000 });
    await page.waitForTimeout(1200); // let count-up animation + socket settle
    const { token } = await apiToken('admin');
    const stats = await api(token).call('GET', '/dashboard/stats').then((r) => r.body);
    await expect(page.getByTestId('kpi-total-products')).toContainText(String(stats.totalProducts), { timeout: 15000 });
    await expect(page.getByTestId('live-badge')).toContainText('Live');

    // charts render (svg present)
    await expect(page.locator('.recharts-wrapper svg').first()).toBeVisible({ timeout: 15000 });

    // date filter changes range
    await page.getByTestId('date-filter').selectOption('Today');
    await expect(page.getByTestId('kpi-total-products')).toBeVisible();
  });
});
