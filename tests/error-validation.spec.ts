import { test, expect } from '@playwright/test';

test.describe('Error Validation Tests', () => {
  test('Home page loads without console errors', async ({ page }) => {
    // Listen for console errors
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Navigate to home page
    await page.goto('/');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Check for console errors
    expect(consoleErrors).toHaveLength(0);
    
    // Verify page elements are present
    await expect(page.locator('text=Does Google, Apple, or FB know you\'re human...?')).toBeVisible();
    await expect(page.locator('text=...only your loved ones know!')).toBeVisible();
    await expect(page.locator('button:has-text("ENTER")')).toBeVisible();
  });

  test('Member dashboard loads without console errors', async ({ page }) => {
    // Listen for console errors
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Navigate to member dashboard with demo user
    await page.goto('/member-dashboard?memberCode=demo');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Check for console errors
    expect(consoleErrors).toHaveLength(0);
    
    // Verify page elements are present
    await expect(page.locator('text=Demo User')).toBeVisible();
  });

  test('API endpoints return valid responses', async ({ page }) => {
    // Test demo user creation
    const response = await page.request.post('/api/admin/create-demo-user');
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data.ok).toBe(true);
    expect(data.demoUser.memberCode).toBe('demo');
  });

  test('Trust units API works correctly', async ({ page }) => {
    const response = await page.request.get('/api/trust/units/list?memberCode=demo');
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data.ok).toBe(true);
    expect(Array.isArray(data.units)).toBe(true);
  });

  test('Trust bonds API works correctly', async ({ page }) => {
    const response = await page.request.get('/api/trust/bonds/list?memberCode=demo');
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data.ok).toBe(true);
    expect(Array.isArray(data.bonds)).toBe(true);
  });

  test('Profile API works correctly', async ({ page }) => {
    const response = await page.request.get('/api/user/profile?memberCode=demo');
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data.ok).toBe(true);
    expect(data.profile.memberCode).toBe('demo');
  });

  test('Voice prints API works correctly', async ({ page }) => {
    const response = await page.request.get('/api/voice-prints?memberCode=demo');
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data.ok).toBe(true);
    expect(data.voicePrints).toBeDefined();
  });

  test('Invites API works correctly', async ({ page }) => {
    const response = await page.request.get('/api/invites/list?memberCode=demo');
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data.ok).toBe(true);
    expect(Array.isArray(data.invites)).toBe(true);
  });
});
