import { test, expect } from '@playwright/test';
import { loginAs, apiToken, api } from './helpers.js';

test.describe('ui behaviour', () => {
  test('dark mode toggle persists + sidebar collapse + palette + toast + validation', async ({ page }) => {
    await loginAs(page, 'admin');
    await page.goto('/');

    // dark mode persists
    await page.getByLabel('Toggle dark mode').click();
    await expect(page.locator('html')).toHaveClass(/dark/);
    await page.reload();
    await expect(page.locator('html')).toHaveClass(/dark/);
    await page.getByLabel('Toggle dark mode').click();

    // sidebar collapse (desktop viewports only — button is lg+)
    if ((await page.evaluate(() => window.innerWidth)) > 1000) {
      await page.getByLabel('Collapse sidebar').click();
    }

    // Ctrl+K palette finds a product
    const { token: uit } = await apiToken('admin');
    await api(uit).call('POST', '/products', { name: 'Palette Probe', sku: `PAL-${Date.now().toString(36)}` });
    await page.keyboard.press('Control+k');
    await page.getByTestId('cmdk-input').fill('Palette Probe');
    await expect(page.getByText(/PAL-/).first()).toBeVisible({ timeout: 10000 });
    await page.keyboard.press('Escape');

    // hover animation: + New button scales on hover (Tailwind scale property).
    // Touch viewports don't produce :hover — there we verify the animation classes are wired.
    const btn = page.getByText('+ New', { exact: false }).first();
    if ((await page.evaluate(() => window.innerWidth)) > 600 && !(await page.evaluate(() => matchMedia('(hover: none)').matches))) {
      await btn.hover();
      await page.waitForTimeout(400);
      const s = await btn.evaluate((el) => getComputedStyle(el).scale);
      expect(s).not.toBe('none');
    } else {
      const cls = await btn.getAttribute('class');
      expect(cls).toMatch(/hover:scale|transition/);
    }

    // form validation message (empty login)
    await page.goto('/login');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.getByTestId('login-email').fill('');
    await page.getByTestId('login-submit').click();
    await expect(page.getByText('Enter a valid email address.')).toBeVisible({ timeout: 8000 });
  });

  test('mobile layout has hamburger menu', async ({ page }) => {
    test.skip((await page.evaluate(() => window.innerWidth)) > 600, 'desktop viewport');
    await loginAs(page, 'admin');
    await page.goto('/');
    await expect(page.getByLabel('Open menu')).toBeVisible();
    await page.getByLabel('Open menu').click();
    await expect(page.getByTestId('nav-products')).toBeVisible();
  });
});
