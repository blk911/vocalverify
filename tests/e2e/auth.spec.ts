import { test, expect } from 'playwright/test';

test.describe('Authentication Flow', () => {
  test('should display login page', async ({ page }) => {
    await page.goto('/');

    // Check if we're on the login/connect page
    await expect(page).toHaveTitle(/AmIHuman/);

    // Check for key elements
    await expect(page.locator('h1')).toBeVisible();
  });

  test('should navigate to member dashboard after login', async ({ page }) => {
    // Mock successful authentication
    await page.goto('/member-dashboard');

    // Check if dashboard loads
    await expect(page.locator('text=Spencer Wendt')).toBeVisible();
  });
});
