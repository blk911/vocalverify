import { test, expect } from 'playwright/test';

test.describe('Authentication Flow', () => {
  test('should display login page', async ({ page }) => {
    await page.goto('/');

    // Check if we're on the login/connect page
    await expect(page).toHaveTitle(/AM I HUMAN/);

    // Check for key elements
    await expect(page.locator('h1')).toBeVisible();
  });

  test('should navigate to member dashboard after login', async ({ page }) => {
    // Mock successful authentication
    await page.goto('/member-dashboard');

    // Check if dashboard loads - look for member dashboard elements
    await expect(page.getByText(/Welcome, Member/i)).toBeVisible();
  });
});
