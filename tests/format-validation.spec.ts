import { test, expect } from '@playwright/test';

test.describe('Format Validation Tests', () => {
  test('All member pages have consistent layout', async ({ page }) => {
    const pages = [
      '/member-dashboard?memberCode=demo',
      '/network?memberCode=demo',
      '/profile?memberCode=demo',
      '/settings?memberCode=demo',
      '/vaults?memberCode=demo'
    ];

    for (const pagePath of pages) {
      await page.goto(pagePath);
      await page.waitForLoadState('networkidle');
      
      // Check for consistent layout elements
      await expect(page.locator('[data-testid="topbar"]')).toBeVisible();
      await expect(page.locator('[data-testid="sidebar"]')).toBeVisible();
      
      // Check for no layout errors
      const layoutErrors = await page.evaluate(() => {
        const errors: string[] = [];
        
        // Check for missing elements
        if (!document.querySelector('[data-testid="topbar"]')) {
          errors.push('Missing topbar');
        }
        if (!document.querySelector('[data-testid="sidebar"]')) {
          errors.push('Missing sidebar');
        }
        
        return errors;
      });
      
      expect(layoutErrors).toHaveLength(0);
    }
  });

  test('CSS styles are properly loaded', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check that CSS is loaded
    const stylesheets = await page.evaluate(() => {
      return Array.from(document.styleSheets).length;
    });
    
    expect(stylesheets).toBeGreaterThan(0);
    
    // Check for specific CSS classes
    const hasGlobalsCSS = await page.evaluate(() => {
      return Array.from(document.styleSheets).some(sheet => {
        try {
          return sheet.href?.includes('globals.css') || 
                 Array.from(sheet.cssRules).some(rule => 
                   rule.cssText.includes('btn') || 
                   rule.cssText.includes('landing-bg')
                 );
        } catch {
          return false;
        }
      });
    });
    
    expect(hasGlobalsCSS).toBe(true);
  });

  test('Responsive design works on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check that elements are visible on mobile
    await expect(page.locator('text=Does Google, Apple, or FB know you\'re human...?')).toBeVisible();
    await expect(page.locator('button:has-text("ENTER")')).toBeVisible();
    
    // Check for mobile-specific layout issues
    const mobileLayoutErrors = await page.evaluate(() => {
      const errors: string[] = [];
      
      // Check for horizontal overflow
      if (document.documentElement.scrollWidth > window.innerWidth) {
        errors.push('Horizontal overflow detected');
      }
      
      // Check for elements that might be too small on mobile
      const buttons = document.querySelectorAll('button');
      buttons.forEach(button => {
        const rect = button.getBoundingClientRect();
        if (rect.width < 44 || rect.height < 44) {
          errors.push(`Button too small: ${button.textContent}`);
        }
      });
      
      return errors;
    });
    
    expect(mobileLayoutErrors).toHaveLength(0);
  });

  test('No broken links or missing resources', async ({ page }) => {
    const failedRequests: string[] = [];
    
    page.on('requestfailed', request => {
      failedRequests.push(`${request.method()} ${request.url()} - ${request.failure()?.errorText}`);
    });
    
    await page.goto('/member-dashboard?memberCode=demo');
    await page.waitForLoadState('networkidle');
    
    // Filter out expected failures (like favicon)
    const criticalFailures = failedRequests.filter(req => 
      !req.includes('favicon') && 
      !req.includes('manifest') &&
      !req.includes('robots.txt')
    );
    
    expect(criticalFailures).toHaveLength(0);
  });
});
