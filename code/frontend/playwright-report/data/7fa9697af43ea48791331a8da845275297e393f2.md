# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: full-system-flow.spec.ts >> E2E Real User Journey Flow >> Student Flow: Enroll and Learn
- Location: tests\full-system-flow.spec.ts:88:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('text=Khóa Học Mẫu E2E 994874').first()
Expected: visible
Timeout: 15000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 15000ms
  - waiting for locator('text=Khóa Học Mẫu E2E 994874').first()

```

```yaml
- complementary:
  - link "AI Tutor Học tập thông minh":
    - /url: /vi
    - heading "AI Tutor" [level=1]
    - paragraph: Học tập thông minh
  - navigation:
    - link "Trang chủ":
      - /url: /vi/dashboard
    - link "Gia sư AI":
      - /url: /vi/dashboard/ai-tutor
    - link "Khóa học":
      - /url: /vi/dashboard/courses
    - link "Lịch học":
      - /url: /vi/dashboard/schedule
    - link "Luyện tập":
      - /url: /vi/dashboard/practice
    - link "Tiến độ":
      - /url: /vi/dashboard/progress
  - link "Avatar Tài dz Lớp 10":
    - /url: /vi/onboarding
    - img "Avatar"
    - paragraph: Tài dz
    - paragraph: Lớp 10
  - button "Đăng xuất"
- button "vi"
- button "Toggle Dark Mode"
- button "Báo lỗi / Góp ý"
- button
- main:
  - heading "Danh sách khóa học" [level=1]
  - paragraph: Khám phá và đăng ký các khóa học mới.
  - textbox "Tìm kiếm..."
  - heading "Khóa Học Mẫu E2E 788581" [level=3]
  - paragraph: Khóa học được tạo tự động bởi Playwright E2E Test
  - button "Đăng ký học"
  - heading "Khóa Học Mẫu E2E 504131" [level=3]
  - paragraph: Khóa học được tạo tự động bởi Playwright E2E Test
  - button "Đăng ký học"
  - heading "Khóa Học Mẫu E2E 127684" [level=3]
  - paragraph: Khóa học được tạo tự động bởi Playwright E2E Test
  - button "Đăng ký học"
  - heading "Khóa Học Mẫu E2E 795684" [level=3]
  - paragraph: Khóa học được tạo tự động bởi Playwright E2E Test
  - button "Đăng ký học"
  - heading "Khóa Học Mẫu E2E 505272" [level=3]
  - paragraph: Khóa học được tạo tự động bởi Playwright E2E Test
  - button "Đăng ký học"
  - heading "Khóa Học Mẫu E2E 017507" [level=3]
  - paragraph: Khóa học được tạo tự động bởi Playwright E2E Test
  - button "Đăng ký học"
  - heading "Khóa Học Mẫu E2E 837270" [level=3]
  - paragraph: Khóa học được tạo tự động bởi Playwright E2E Test
  - button "Đăng ký học"
  - heading "Khóa Học Mẫu E2E 758559" [level=3]
  - paragraph: Khóa học được tạo tự động bởi Playwright E2E Test
  - button "Đăng ký học"
  - heading "Khóa Học Mẫu E2E 580086" [level=3]
  - paragraph: Khóa học được tạo tự động bởi Playwright E2E Test
  - button "Đăng ký học"
- alert
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | 
  3   | test.describe('E2E Real User Journey Flow', () => {
  4   |   // Give this test plenty of time
  5   |   test.setTimeout(180000); 
  6   | 
  7   |   const runId = Date.now().toString().slice(-6);
  8   |   const courseName = `Khóa Học Mẫu E2E ${runId}`;
  9   |   
  10  |   // Existing accounts from the database
  11  |   const ADMIN_EMAIL = 'tailangtund@gmail.com';
  12  |   const ADMIN_PASS = '123456';
  13  |   const TEACHER_EMAIL = 'teacher@eduai.com';
  14  |   const STUDENT_EMAIL = 'student@eduai.com';
  15  |   const PARENT_EMAIL = 'parent@eduai.com';
  16  |   const DEFAULT_PASS = 'password123';
  17  | 
  18  |   test('Admin Flow: Verify Dashboards', async ({ page }) => {
  19  |     // 1. Admin Login
  20  |     await page.goto('/vi/admin/login');
  21  |     await page.fill('input[name="email"]', ADMIN_EMAIL);
  22  |     await page.fill('input[name="password"]', ADMIN_PASS);
  23  |     await page.click('button[type="submit"]');
  24  |     // Ensure we don't match the login page itself, wait for actual redirect to admin dashboard
  25  |     await expect(page).toHaveURL(/\/admin(?:$|\/dashboard)/, { timeout: 30000 });
  26  | 
  27  |     // 2. Verify Students page
  28  |     await page.goto('/vi/admin/students');
  29  |     await expect(page.locator(`text=${STUDENT_EMAIL}`).first()).toBeVisible({ timeout: 15000 });
  30  | 
  31  |     // 3. Verify Teachers page
  32  |     await page.goto('/vi/admin/teachers');
  33  |     await expect(page.locator(`text=${TEACHER_EMAIL}`).first()).toBeVisible({ timeout: 15000 });
  34  | 
  35  |     // Logout
  36  |     await page.context().clearCookies();
  37  |   });
  38  | 
  39  |   test('Teacher Flow: Create Course', async ({ page }) => {
  40  |     // 1. Teacher Login
  41  |     await page.goto('/vi/login');
  42  |     await page.click('button:has-text("Giáo viên")');
  43  |     await page.fill('input[name="email"]', TEACHER_EMAIL);
  44  |     await page.fill('input[name="password"]', DEFAULT_PASS);
  45  |     await page.click('button[type="submit"]');
  46  |     await expect(page).toHaveURL(/.*\/teacher/, { timeout: 30000 });
  47  | 
  48  |     // 2. Create Course
  49  |     await page.goto('/vi/teacher/courses');
  50  |     
  51  |     // Find the create button (+)
  52  |     await page.locator('button').filter({ has: page.locator('svg.lucide-plus') }).click();
  53  |     await page.waitForTimeout(1000);
  54  |     
  55  |     await page.fill('.fixed.inset-0 input[type="text"]', courseName);
  56  |     await page.fill('.fixed.inset-0 textarea', 'Khóa học được tạo tự động bởi Playwright E2E Test');
  57  |     await page.fill('.fixed.inset-0 input[type="number"]', '10');
  58  |     
  59  |     // Submit
  60  |     const submitBtn = page.locator('.fixed.inset-0 button').filter({ hasText: /Tạo mới|Lưu/ }).first();
  61  |     await submitBtn.click();
  62  |     
  63  |     // Wait for it to appear
  64  |     await expect(page.locator(`text=${courseName}`).first()).toBeVisible({ timeout: 15000 });
  65  | 
  66  |     // 3. Create AI Quiz
  67  |     await page.goto('/vi/teacher/quiz');
  68  |     await page.locator('button').filter({ hasText: 'AI Builder' }).click();
  69  |     await page.fill('input[placeholder="VD: Kiểm tra 15 phút"]', 'Bài thi Vượt cấp E2E');
  70  |     // Assuming courseId input is the second input
  71  |     await page.fill('input[placeholder="Nhập ID khóa học"]', '1'); 
  72  |     
  73  |     // Check isGraduation specifically inside the modal
  74  |     // We can target the specific text next to the checkbox
  75  |     const graduationLabel = page.locator('label').filter({ hasText: 'Đề thi Vượt cấp (Graduation)' }).first();
  76  |     // Playwright check might fail if it's a hidden native checkbox, so click the custom label/toggle instead
  77  |     await graduationLabel.click({ force: true });
  78  |     
  79  |     await page.locator('button').filter({ hasText: 'Tạo câu hỏi' }).click();
  80  |     await page.locator('button').filter({ hasText: 'Lưu & Sử dụng' }).click();
  81  |     // Wait for success alert or reload (the current UI does alert then reload)
  82  |     page.on('dialog', dialog => dialog.accept());
  83  | 
  84  |     // Logout
  85  |     await page.context().clearCookies();
  86  |   });
  87  | 
  88  |   test('Student Flow: Enroll and Learn', async ({ page }) => {
  89  |     // 1. Student Login
  90  |     await page.goto('/vi/login');
  91  |     await page.click('button:has-text("Học sinh")');
  92  |     await page.fill('input[name="email"]', STUDENT_EMAIL);
  93  |     await page.fill('input[name="password"]', DEFAULT_PASS);
  94  |     await page.click('button[type="submit"]');
  95  |     await expect(page).toHaveURL(/.*\/dashboard/, { timeout: 30000 });
  96  | 
  97  |     // 2. Enroll in Course
  98  |     await page.goto('/vi/dashboard/courses');
> 99  |     await expect(page.locator(`text=${courseName}`).first()).toBeVisible({ timeout: 15000 });
      |                                                              ^ Error: expect(locator).toBeVisible() failed
  100 |     
  101 |     // Enroll
  102 |     const courseCard = page.locator(`div:has-text("${courseName}")`).first();
  103 |     const enrollBtn = page.locator('button:has-text("Đăng ký học")').first();
  104 |     if (await enrollBtn.isVisible()) {
  105 |       const dialogPromise = page.waitForEvent('dialog');
  106 |       await enrollBtn.click();
  107 |       const dialog = await dialogPromise;
  108 |       expect(dialog.message()).toContain('Đăng ký khóa học thành công');
  109 |       await dialog.accept();
  110 |     }
  111 | 
  112 |     // 3. AI Tutor Test
  113 |     await page.goto('/vi/dashboard/ai-tutor');
  114 |     const textarea = page.locator('textarea');
  115 |     await expect(textarea).toBeVisible({ timeout: 15000 });
  116 |     await textarea.fill('Xin chào AI Tutor');
  117 |     await page.locator('button').filter({ has: page.locator('svg.lucide-send') }).click();
  118 |     await expect(page.locator('text=Xin chào AI Tutor').first()).toBeVisible();
  119 | 
  120 |     // Logout
  121 |     await page.context().clearCookies();
  122 |   });
  123 |   
  124 |   test('Parent Flow: Verify Dashboard', async ({ page }) => {
  125 |     // 1. Parent Login
  126 |     await page.goto('/vi/login');
  127 |     await page.click('button:has-text("Phụ huynh")');
  128 |     await page.fill('input[name="email"]', PARENT_EMAIL);
  129 |     await page.fill('input[name="password"]', DEFAULT_PASS);
  130 |     await page.click('button[type="submit"]');
  131 |     await expect(page).toHaveURL(/.*\/parent/, { timeout: 30000 });
  132 | 
  133 |     // 2. Check dashboard content
  134 |     await expect(page.locator('text=/Chưa có tài khoản nào được liên kết|XP/').first()).toBeVisible({ timeout: 15000 });
  135 |   });
  136 | });
  137 | 
```