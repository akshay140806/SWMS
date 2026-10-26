import { test, expect } from '@playwright/test';
import { loginAs } from './helpers.js';

test('capture report screenshots for documentation', async ({ page }) => {
  test.setTimeout(120000);
  await page.setViewportSize({ width: 1280, height: 800 });

  // 1. Login Page
  await page.goto('/login');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'screenshots/fig6_1_login.png' });

  // Login as admin
  await loginAs(page, 'admin');

  // 2. Dashboard
  await page.goto('/');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'screenshots/fig6_2_dashboard.png' });

  // 3. Products
  await page.goto('/products');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'screenshots/fig6_3_products.png' });

  // 4. Locations
  await page.goto('/locations');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'screenshots/fig6_4_locations.png' });

  // 5. Stock Movements
  await page.goto('/movements');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'screenshots/fig6_5_movements.png' });

  // 6. Orders
  await page.goto('/orders');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'screenshots/fig6_6_orders.png' });

  // 7. Dispatch History / Shipments
  await page.goto('/dispatch-history');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'screenshots/fig6_7_dispatch.png' });

  // 8. Analytics
  await page.goto('/analytics');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'screenshots/fig6_8_analytics.png' });

  // 9. Users (RBAC)
  await page.goto('/users');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'screenshots/fig6_9_users.png' });

  console.log('Successfully captured all 9 high-res report screenshots!');
});
