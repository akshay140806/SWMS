import { test, expect } from '@playwright/test';

// Scratch-flow proof (also run manually with SKIP_GLOBAL_SETUP=1 on an empty DB).
// On an initialized DB it verifies the login gate instead of failing.
test('visual: scratch onboarding to live dashboard', async ({ page }) => {
  await page.goto('/onboarding');
  await page.waitForTimeout(2000);
  if (!page.url().includes('/onboarding')) {
    await expect(page.getByTestId('login-submit')).toBeVisible({ timeout: 15000 });
    return;
  }
  await expect(page.getByTestId('setup-store')).toBeVisible({ timeout: 15000 });
  await page.screenshot({ path: 'test-results/scratch-onboarding.png' });
  await page.getByTestId('setup-store').fill('Kumar General Store');
  await page.getByTestId('setup-name').fill('Owner');
  await page.getByTestId('setup-email').fill(`owner${Date.now()}@store.com`);
  await page.getByTestId('setup-password').fill('Owner@1234');
  await page.getByTestId('setup-submit').click();
  await expect(page.getByText('Warehouse Overview')).toBeVisible({ timeout: 20000 });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: 'test-results/scratch-dashboard.png', fullPage: true });
});
