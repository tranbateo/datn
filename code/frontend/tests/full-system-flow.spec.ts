import { test, expect } from '@playwright/test';

test.describe('E2E Real User Journey Flow', () => {
  // Give this test plenty of time
  test.setTimeout(180000); 

  const runId = Date.now().toString().slice(-6);
  const courseName = `Khóa Học Mẫu E2E ${runId}`;
  
  // Existing accounts from the database
  const ADMIN_EMAIL = 'tailangtund@gmail.com';
  const ADMIN_PASS = '123456';
  const TEACHER_EMAIL = 'teacher@eduai.com';
  const STUDENT_EMAIL = 'student@eduai.com';
  const PARENT_EMAIL = 'parent@eduai.com';
  const DEFAULT_PASS = 'password123';

  test('Admin Flow: Verify Dashboards', async ({ page }) => {
    // 1. Admin Login
    await page.goto('/vi/admin/login');
    await page.fill('input[name="email"]', ADMIN_EMAIL);
    await page.fill('input[name="password"]', ADMIN_PASS);
    await page.click('button[type="submit"]');
    // Ensure we don't match the login page itself, wait for actual redirect to admin dashboard
    await expect(page).toHaveURL(/\/admin(?:$|\/dashboard)/, { timeout: 30000 });

    // 2. Verify Students page
    await page.goto('/vi/admin/students');
    await expect(page.locator(`text=${STUDENT_EMAIL}`).first()).toBeVisible({ timeout: 15000 });

    // 3. Verify Teachers page
    await page.goto('/vi/admin/teachers');
    await expect(page.locator(`text=${TEACHER_EMAIL}`).first()).toBeVisible({ timeout: 15000 });

    // Logout
    await page.context().clearCookies();
  });

  test('Teacher Flow: Create Course', async ({ page }) => {
    // 1. Teacher Login
    await page.goto('/vi/login');
    await page.click('button:has-text("Giáo viên")');
    await page.fill('input[name="email"]', TEACHER_EMAIL);
    await page.fill('input[name="password"]', DEFAULT_PASS);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*\/teacher/, { timeout: 30000 });

    // 2. Create Course
    await page.goto('/vi/teacher/courses');
    
    // Find the create button (+)
    await page.locator('button').filter({ has: page.locator('svg.lucide-plus') }).click();
    await page.waitForTimeout(1000);
    
    await page.fill('.fixed.inset-0 input[type="text"]', courseName);
    await page.fill('.fixed.inset-0 textarea', 'Khóa học được tạo tự động bởi Playwright E2E Test');
    await page.fill('.fixed.inset-0 input[type="number"]', '10');
    
    // Submit
    const submitBtn = page.locator('.fixed.inset-0 button').filter({ hasText: /Tạo mới|Lưu/ }).first();
    await submitBtn.click();
    
    // Wait for it to appear
    await expect(page.locator(`text=${courseName}`).first()).toBeVisible({ timeout: 15000 });

    // 3. Create AI Quiz
    await page.goto('/vi/teacher/quiz');
    await page.locator('button').filter({ hasText: 'AI Builder' }).click();
    await page.fill('input[placeholder="VD: Kiểm tra 15 phút"]', 'Bài thi Vượt cấp E2E');
    // Assuming courseId input is the second input
    await page.fill('input[placeholder="Nhập ID khóa học"]', '1'); 
    
    // Check isGraduation specifically inside the modal
    // We can target the specific text next to the checkbox
    const graduationLabel = page.locator('label').filter({ hasText: 'Đề thi Vượt cấp (Graduation)' }).first();
    // Playwright check might fail if it's a hidden native checkbox, so click the custom label/toggle instead
    await graduationLabel.click({ force: true });
    
    await page.locator('button').filter({ hasText: 'Tạo câu hỏi' }).click();
    await page.locator('button').filter({ hasText: 'Lưu & Sử dụng' }).click();
    // Wait for success alert or reload (the current UI does alert then reload)
    page.on('dialog', dialog => dialog.accept());

    // Logout
    await page.context().clearCookies();
  });

  test('Student Flow: Enroll and Learn', async ({ page }) => {
    // 1. Student Login
    await page.goto('/vi/login');
    await page.click('button:has-text("Học sinh")');
    await page.fill('input[name="email"]', STUDENT_EMAIL);
    await page.fill('input[name="password"]', DEFAULT_PASS);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*\/dashboard/, { timeout: 30000 });

    // 2. Enroll in Course
    await page.goto('/vi/dashboard/courses');
    await expect(page.locator(`text=${courseName}`).first()).toBeVisible({ timeout: 15000 });
    
    // Enroll
    const courseCard = page.locator(`div:has-text("${courseName}")`).first();
    const enrollBtn = page.locator('button:has-text("Đăng ký học")').first();
    if (await enrollBtn.isVisible()) {
      const dialogPromise = page.waitForEvent('dialog');
      await enrollBtn.click();
      const dialog = await dialogPromise;
      expect(dialog.message()).toContain('Đăng ký khóa học thành công');
      await dialog.accept();
    }

    // 3. AI Tutor Test
    await page.goto('/vi/dashboard/ai-tutor');
    const textarea = page.locator('textarea');
    await expect(textarea).toBeVisible({ timeout: 15000 });
    await textarea.fill('Xin chào AI Tutor');
    await page.locator('button').filter({ has: page.locator('svg.lucide-send') }).click();
    await expect(page.locator('text=Xin chào AI Tutor').first()).toBeVisible();

    // Logout
    await page.context().clearCookies();
  });
  
  test('Parent Flow: Verify Dashboard', async ({ page }) => {
    // 1. Parent Login
    await page.goto('/vi/login');
    await page.click('button:has-text("Phụ huynh")');
    await page.fill('input[name="email"]', PARENT_EMAIL);
    await page.fill('input[name="password"]', DEFAULT_PASS);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*\/parent/, { timeout: 30000 });

    // 2. Check dashboard content
    await expect(page.locator('text=/Chưa có tài khoản nào được liên kết|XP/').first()).toBeVisible({ timeout: 15000 });
  });
});
