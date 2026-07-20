import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('Admin should be able to login and redirect to admin dashboard', async ({ page }) => {
    await page.goto('/vi/admin/login');
    
    // Fill the login form
    await page.fill('input[name="email"]', 'admin@eduai.com');
    await page.fill('input[name="password"]', 'password123');
    
    // Submit the form
    await page.click('button[type="submit"]');
    
    // Expect to be redirected to admin dashboard
    await expect(page).toHaveURL(/.*\/admin/, { timeout: 45000 });
    
    // Check if the dashboard is rendered (we can just check for any text indicating admin)
    await expect(page.locator('text=Admin')).toBeVisible();
  });

  test('Teacher should be able to login and redirect to teacher dashboard', async ({ page }) => {
    await page.goto('/vi/login');
    
    // Select Teacher role tab
    await page.click('button:has-text("Giáo viên")');

    await page.fill('input[name="email"]', 'teacher@eduai.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL(/.*\/teacher/, { timeout: 45000 });
  });

  test('Parent should be able to login and redirect to parent dashboard', async ({ page }) => {
    await page.goto('/vi/login');
    
    // Select Parent role tab
    await page.click('button:has-text("Phụ huynh")');

    await page.fill('input[name="email"]', 'parent@eduai.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL(/.*\/parent/, { timeout: 45000 });
  });

  test('Student should be able to login and redirect to student dashboard', async ({ page }) => {
    await page.goto('/vi/login');
    
    // Student is default tab
    await page.fill('input[name="email"]', 'student@eduai.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL(/.*\/dashboard/, { timeout: 45000 });
  });
});
