import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'https://priority-list-nine.vercel.app';

test.describe('Priority List App - Authentication', () => {
  
  test('should display login page with correct elements', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Check for main heading
    await expect(page.locator('h1:has-text("Priority List")')).toBeVisible();
    
    // Check for sign in heading
    await expect(page.locator('h2:has-text("Sign in")')).toBeVisible();
    
    // Check for sign in button
    await expect(page.locator('button:has-text("Sign In")')).toBeVisible();
    
    // Check for sign up link
    await expect(page.locator('text=Don\'t have an account?')).toBeVisible();
  });

  test('should navigate to signup page when clicking sign up', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.click('button:has-text("Sign up")');
    
    // Should show signup form
    await expect(page.locator('h2:has-text("Create an account")')).toBeVisible();
    
    // Should show name input
    await expect(page.locator('input[placeholder*="name"]')).toBeVisible();
  });

  test('should show error for invalid login', async ({ page }) => {
    await page.goto(BASE_URL);
    
    await page.fill('input[type="email"]', 'nonexistent@test.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button:has-text("Sign In")');
    
    // Wait for error
    await page.waitForTimeout(1000);
    
    // Should show error message
    const error = page.locator('.error');
    await expect(error).toBeVisible();
  });

  test('should register new user successfully', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Click sign up
    await page.click('button:has-text("Sign up")');
    
    // Fill form
    await page.fill('input[placeholder*="name"]', 'Test User');
    await page.fill('input[type="email"]', `test${Date.now()}@example.com`);
    await page.fill('input[type="password"]', 'password123');
    
    // Submit
    await page.click('button:has-text("Sign Up")');
    
    // Should redirect to main app
    await page.waitForTimeout(1500);
    await expect(page.locator('h1:has-text("Priority List")')).toBeVisible();
  });

  test('should login existing user', async ({ page }) => {
    // This test depends on previous test creating a user
    // In practice, you'd use a test user setup
    await page.goto(BASE_URL);
    
    // Try to login
    await page.fill('input[type="email"]', 'testuser@test.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button:has-text("Sign In")');
    
    await page.waitForTimeout(1000);
  });
});

test.describe('Priority List App - Priority Management', () => {
  
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto(BASE_URL);
    await page.click('button:has-text("Sign up")');
    await page.fill('input[placeholder*="name"]', 'Test User');
    await page.fill('input[type="email"]', `test${Date.now()}@example.com`);
    await page.fill('input[type="password"]', 'password123');
    await page.click('button:has-text("Sign Up")');
    await page.waitForTimeout(1500);
  });

  test('should display empty state when no priorities', async ({ page }) => {
    await expect(page.locator('text=No priorities yet')).toBeVisible();
  });

  test('should create a new priority', async ({ page }) => {
    // Add priority
    const input = page.locator('input[placeholder*="Add"]');
    await input.fill('Buy groceries');
    await page.keyboard.press('Enter');
    
    // Should see the priority
    await expect(page.locator('text=Buy groceries')).toBeVisible();
  });

  test('should add notes to a priority', async ({ page }) => {
    // Create priority first
    const input = page.locator('input[placeholder*="Add"]');
    await input.fill('Test Priority');
    await page.keyboard.press('Enter');
    
    // Click on priority to expand
    await page.click('text=Test Priority');
    
    // Find notes textarea
    const notesArea = page.locator('textarea');
    await expect(notesArea).toBeVisible();
    
    // Add notes
    await notesArea.fill('These are my notes');
    await page.keyboard.press('Enter');
    
    // Notes should persist (expand again to check)
    await page.click('text=Test Priority');
    await expect(page.locator('textarea')).toHaveValue('These are my notes');
  });

  test('should delete a priority', async ({ page }) => {
    // Create priority
    const input = page.locator('input[placeholder*="Add"]');
    await input.fill('To Delete');
    await page.keyboard.press('Enter');
    
    // Hover to see delete button
    await page.hover('text=To Delete');
    
    // Click delete
    const deleteBtn = page.locator('.delete-btn');
    await deleteBtn.click();
    
    // Priority should be gone
    await expect(page.locator('text=To Delete')).not.toBeVisible();
  });

  test('should show logout button when logged in', async ({ page }) => {
    await expect(page.locator('button:has-text("Logout")')).toBeVisible();
    await expect(page.locator('text=Welcome,')).toBeVisible();
  });

  test('should logout successfully', async ({ page }) => {
    await page.click('button:has-text("Logout")');
    
    // Should be back on login page
    await expect(page.locator('h2:has-text("Sign in")')).toBeVisible();
  });
});

test.describe('Priority List App - UI/UX', () => {
  
  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(BASE_URL);
    
    // Page should load
    await expect(page.locator('h1:has-text("Priority List")')).toBeVisible();
  });

  test('should not have critical console errors on login page', async ({ page }) => {
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
