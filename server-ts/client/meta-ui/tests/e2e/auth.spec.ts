import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should display login page', async ({ page }) => {
    await page.goto('/auth/login');

    await expect(page).toHaveTitle(/Login - RuneRogue/);
    await expect(page.locator('h2')).toContainText('Sign in to RuneRogue');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toContainText('Sign in');
  });

  test('should display register page', async ({ page }) => {
    await page.goto('/auth/register');

    await expect(page).toHaveTitle(/Register - RuneRogue/);
    await expect(page.locator('h2')).toContainText('Create your RuneRogue account');
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="username"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('input[name="confirmPassword"]')).toBeVisible();
  });

  test('should validate email format on login', async ({ page }) => {
    await page.goto('/auth/login');

    await page.fill('input[type="email"]', 'invalid-email');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    await expect(page.locator('text=Invalid email address')).toBeVisible();
  });

  test('should navigate between login and register', async ({ page }) => {
    await page.goto('/auth/login');

    await page.click('text=create a new account');
    await expect(page).toHaveURL(/\/auth\/register/);

    await page.click('text=sign in to your account');
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test('should redirect unauthenticated users to login', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/auth\/login/);

    await page.goto('/leaderboard');
    await expect(page).toHaveURL(/\/auth\/login/);

    await page.goto('/settings');
    await expect(page).toHaveURL(/\/auth\/login/);
  });
});
