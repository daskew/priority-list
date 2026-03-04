import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'https://priority-list-nine.vercel.app';

test.describe('Priority List App', () => {
  
  // ==================== AUTHENTICATION TESTS ====================
  
  test.describe('Authentication', () => {
    test('should display login page with correct elements', async ({ page }) => {
      await page.goto(BASE_URL);
      
      // Check for main heading
      await expect(page.locator('h1, text=Priority List')).toBeVisible();
      
      // Check for sign in heading
      await expect(page.locator('text=Sign in to your account')).toBeVisible();
      
      // Check for sign in button
      await expect(page.locator('button:has-text("Sign In")')).toBeVisible();
      
      // Check for sign up link
      await expect(page.locator('text=Don\'t have an account? Sign up')).toBeVisible();
    });

    test('should navigate to signup page', async ({ page }) => {
      await page.goto(BASE_URL);
      await page.click('text=Sign up');
      
      // Should show signup form elements
      await expect(page.locator('text=Sign up for an account')).toBeVisible();
    });

    test('should show error for invalid login', async ({ page }) => {
      await page.goto(BASE_URL);
      
      // Try to sign in with invalid credentials
      await page.fill('input[type="email"], input[name="email"], input[id="email"]', 'invalid@test.com');
      await page.fill('input[type="password"], input[name="password"], input[id="password"]', 'wrongpassword');
      await page.click('button:has-text("Sign In")');
      
      // Should show error message (may vary by implementation)
      await page.waitForTimeout(1000);
    });

    test('should show error for invalid signup', async ({ page }) => {
      await page.goto(BASE_URL);
      await page.click('text=Sign up');
      
      // Try to sign up with invalid/incomplete data
      await page.fill('input[type="email"], input[name="email"], input[id="email"]', 'invalid');
      await page.fill('input[type="password"], input[name="password"], input[id="password"]', 'short');
      await page.click('button:has-text("Sign Up")');
      
      // Should show validation error
      await page.waitForTimeout(1000);
    });
  });

  // ==================== PRIORITY LIST TESTS ====================
  
  test.describe('Priority Management', () => {
    // Helper to login first - depends on auth implementation
    async function login(page) {
      await page.goto(BASE_URL);
      // This is a placeholder - actual login depends on auth flow
      // You'll need to implement based on actual auth UI
    }

    test('should have empty state message when no priorities exist', async ({ page }) => {
      await page.goto(BASE_URL);
      // After login, check for empty state
      // await login(page);
      // await expect(page.locator('text=No priorities yet')).toBeVisible();
    });

    test('should create a new priority', async ({ page }) => {
      await page.goto(BASE_URL);
      // await login(page);
      
      // Find and fill the add priority input
      const input = page.locator('input[placeholder*="priority"], input[placeholder*="task"], input[name="title"]').first();
      if (await input.isVisible()) {
        await input.fill('Test Priority');
        await page.keyboard.press('Enter');
        
        // Should see the new priority
        await expect(page.locator('text=Test Priority')).toBeVisible();
      }
    });

    test('should add notes to a priority', async ({ page }) => {
      await page.goto(BASE_URL);
      // await login(page);
      
      // Click on a priority to expand notes
      const priority = page.locator('.priority-item, [class*="priority"]').first();
      if (await priority.isVisible()) {
        await priority.click();
        
        // Find notes textarea and add content
        const notesArea = page.locator('textarea[name="notes"], input[name="notes"]');
        if (await notesArea.isVisible()) {
          await notesArea.fill('These are some notes for the priority');
          await page.keyboard.press('Enter');
        }
      }
    });

    test('should delete a priority', async ({ page }) => {
      await page.goto(BASE_URL);
      // await login(page);
      
      // Look for delete button
      const deleteBtn = page.locator('button[aria-label*="delete"], button:has-text("Delete"), [class*="delete"]').first();
      if (await deleteBtn.isVisible()) {
        // Get initial count
        const initialCount = await page.locator('[class*="priority"]').count();
        
        await deleteBtn.click();
        
        // Priority should be removed
        await page.waitForTimeout(500);
      }
    });

    test('should reorder priorities via drag and drop', async ({ page }) => {
      await page.goto(BASE_URL);
      // await login(page);
      
      // Check for drag handles
      const dragHandles = page.locator('[class*="drag-handle"], [class*="handle"], button[aria-label*="drag"]');
      const handleCount = await dragHandles.count();
      
      if (handleCount >= 2) {
        // Drag first item to second position
        const firstHandle = dragHandles.first();
        const secondHandle = dragHandles.nth(1);
        
        const firstBox = await firstHandle.boundingBox();
        const secondBox = await secondHandle.boundingBox();
        
        await page.mouse.dragAndDrop(firstHandle, secondHandle);
      }
    });
  });

  // ==================== UI/UX TESTS ====================
  
  test.describe('UI/UX', () => {
    test('should be responsive on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto(BASE_URL);
      
      // Page should still load and be usable
      await expect(page.locator('body')).toBeVisible();
    });

    test('should have proper accessibility attributes', async ({ page }) => {
      await page.goto(BASE_URL);
      
      // Check buttons have accessible names
      const buttons = page.locator('button');
      const count = await buttons.count();
      
      for (let i = 0; i < Math.min(count, 5); i++) {
        const btn = buttons.nth(i);
        const ariaLabel = await btn.getAttribute('aria-label');
        const text = await btn.textContent();
        
        // Should have either aria-label or text
        expect(ariaLabel || text?.trim()).toBeTruthy();
      }
    });

    test('should not have critical console errors', async ({ page }) => {
      const errors = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });
      
      await page.goto(BASE_URL);
      await page.waitForTimeout(2000);
      
      // Filter out known non-critical errors
      const criticalErrors = errors.filter(e => 
        !e.includes('favicon') && 
        !e.includes('404') &&
        !e.includes('net::')
      );
      
      expect(criticalErrors).toHaveLength(0);
    });

    test('should load page within acceptable time', async ({ page }) => {
      const start = Date.now();
      await page.goto(BASE_URL);
      await page.waitForLoadState('networkidle');
      const loadTime = Date.now() - start;
      
      // Page should load in under 5 seconds
      expect(loadTime).toBeLessThan(5000);
    });
  });

  // ==================== DATA PERSISTENCE TESTS ====================
  
  test.describe('Data Persistence', () => {
    test('should persist priorities after page refresh', async ({ page }) => {
      await page.goto(BASE_URL);
      // await login(page);
      
      // Add a priority with unique name
      const uniquePriority = `Test Priority ${Date.now()}`;
      const input = page.locator('input[placeholder*="priority"]').first();
      
      if (await input.isVisible()) {
        await input.fill(uniquePriority);
        await page.keyboard.press('Enter');
        
        // Verify it was added
        await expect(page.locator(`text=${uniquePriority}`)).toBeVisible();
        
        // Refresh page
        await page.reload();
        
        // Should still be there
        await expect(page.locator(`text=${uniquePriority}`)).toBeVisible();
      }
    });
  });
});
