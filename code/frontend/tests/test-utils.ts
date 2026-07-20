import { Page, expect } from '@playwright/test';

type Role = 'admin' | 'teacher' | 'parent' | 'student';

const roleCredentials = {
  admin: { email: 'admin@eduai.com', password: 'password123', tabText: null },
  teacher: { email: 'teacher@eduai.com', password: 'password123', tabText: 'Giáo viên' },
  parent: { email: 'parent@eduai.com', password: 'password123', tabText: 'Phụ huynh' },
  student: { email: 'student@eduai.com', password: 'password123', tabText: 'Học sinh' },
};

/**
 * Helper function to authenticate as a specific role
 */
export async function loginAs(page: Page, role: Role) {
  const credentials = roleCredentials[role];

  if (role === 'admin') {
    await page.goto('/vi/admin/login');
  } else {
    await page.goto('/vi/login');
    // For non-admin, select the proper role tab
    if (credentials.tabText) {
      await page.click(`button:has-text("${credentials.tabText}")`);
    }
  }

  await page.fill('input[name="email"]', credentials.email);
  await page.fill('input[name="password"]', credentials.password);
  await page.click('button[type="submit"]');

  // Wait for the redirect to finish based on role
  if (role === 'admin') {
    await expect(page).toHaveURL(/.*\/admin/, { timeout: 45000 });
  } else if (role === 'teacher') {
    await expect(page).toHaveURL(/.*\/teacher/, { timeout: 45000 });
  } else if (role === 'parent') {
    await expect(page).toHaveURL(/.*\/parent/, { timeout: 45000 });
  } else if (role === 'student') {
    await expect(page).toHaveURL(/.*\/dashboard/, { timeout: 45000 });
  }
}
