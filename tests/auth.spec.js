import { test, expect } from '@playwright/test';
import { CREDS, loginAs } from './helpers.js';

test.describe('auth', () => {
  test('login success redirects to dashboard', async ({ page }) => {
    await page.goto('/login');
    await page.getByTestId('login-email').fill(CREDS.admin.email);
    await page.getByTestId('login-password').fill(CREDS.admin.password);
    await page.getByTestId('login-submit').click();
    await expect(page).toHaveURL(/\/$/, { timeout: 15000 });
    await expect(page.getByText('Warehouse Overview')).toBeVisible();
  });

  test('wrong password shows error toast', async ({ page }) => {
    await page.goto('/login');
    await page.getByTestId('login-email').fill(CREDS.admin.email);
    await page.getByTestId('login-password').fill('Wrong@1234');
    await page.getByTestId('login-submit').click();
    await expect(page.getByText('Incorrect email or password. Please try again.')).toBeVisible({ timeout: 10000 });
  });

  test('register creates warehouse account', async ({ page }) => {
    const email = `t${Date.now()}@warehouse.com`;
    await page.goto('/register');
    await page.getByTestId('reg-name').fill('Test User');
    await page.getByTestId('reg-email').fill(email);
    await page.getByTestId('reg-password').fill('Test@1234');
    await page.locator('input[name="confirmPassword"], input[type="password"]').nth(1).fill('Test@1234');
    await page.getByTestId('reg-submit').click();
    await expect(page).toHaveURL(/\/$/, { timeout: 15000 });
  });

  test('logout returns to login', async ({ page }) => {
    await loginAs(page, 'admin');
    await page.goto('/');
    await page.getByLabel('Profile menu').click();
    await page.getByText('Sign out').click();
    await expect(page).toHaveURL(/\/login/);
  });

  test('protected route redirects when unauthenticated', async ({ page }) => {
    await page.goto('/products');
    await expect(page).toHaveURL(/\/login/);
  });
});
