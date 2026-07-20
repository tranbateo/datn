# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: full-system-flow.spec.ts >> E2E Real User Journey Flow >> Teacher Flow: Create Course
- Location: tests\full-system-flow.spec.ts:39:7

# Error details

```
Test timeout of 180000ms exceeded.
```

```
Error: locator.click: Test timeout of 180000ms exceeded.
Call log:
  - waiting for locator('button').filter({ hasText: 'Lưu & Sử dụng' })

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]:
    - complementary [ref=e3]:
      - generic [ref=e5]:
        - generic [ref=e6]: E
        - generic [ref=e7]:
          - heading "EduAI" [level=2] [ref=e8]
          - paragraph [ref=e9]: Teacher Portal
      - navigation [ref=e11]:
        - link "Tổng quan" [ref=e12] [cursor=pointer]:
          - /url: /vi/teacher
          - img [ref=e13]
          - text: Tổng quan
        - link "Quản lý Bài giảng" [ref=e18] [cursor=pointer]:
          - /url: /vi/teacher/courses
          - img [ref=e19]
          - text: Quản lý Bài giảng
        - link "Ngân hàng Trắc nghiệm" [ref=e21] [cursor=pointer]:
          - /url: /vi/teacher/quiz
          - img [ref=e22]
          - text: Ngân hàng Trắc nghiệm
        - link "Tài liệu AI (RAG)" [ref=e25] [cursor=pointer]:
          - /url: /vi/teacher/documents
          - img [ref=e26]
          - text: Tài liệu AI (RAG)
        - link "Theo dõi Học sinh" [ref=e29] [cursor=pointer]:
          - /url: /vi/teacher/students
          - img [ref=e30]
          - text: Theo dõi Học sinh
        - link "Cài đặt cá nhân" [ref=e35] [cursor=pointer]:
          - /url: /vi/teacher/settings
          - img [ref=e36]
          - text: Cài đặt cá nhân
      - generic [ref=e40]:
        - link "Help & Support" [ref=e41] [cursor=pointer]:
          - /url: /vi/teacher/help
          - img [ref=e42]
          - text: Help & Support
        - button "Đăng xuất" [ref=e45]:
          - img [ref=e46]
          - text: Đăng xuất
    - generic [ref=e49]:
      - banner [ref=e50]:
        - generic [ref=e51]:
          - heading "Teacher Portal" [level=1] [ref=e52]:
            - text: Teacher
            - text: Portal
          - generic [ref=e53]:
            - img [ref=e54]
            - textbox "Search..." [ref=e57]
        - generic [ref=e58]:
          - generic [ref=e59]:
            - button "Toggle Dark Mode" [ref=e60]:
              - img [ref=e61]
            - button "vi" [ref=e63]:
              - img [ref=e64]
              - generic [ref=e67]: vi
            - button [ref=e68]:
              - img [ref=e69]
          - button "Teacher EduAI Staff" [ref=e73]:
            - img [ref=e75]
            - generic [ref=e78]:
              - paragraph [ref=e79]: Teacher
              - paragraph [ref=e80]: EduAI Staff
      - main [ref=e81]:
        - generic [ref=e83]:
          - generic [ref=e84]:
            - generic [ref=e85]:
              - heading "Ngân hàng Trắc nghiệm" [level=2] [ref=e86]
              - paragraph [ref=e87]: Soạn câu hỏi và cấu hình bài thi tự động chấm.
            - generic [ref=e88]:
              - button "Import Excel" [ref=e89]:
                - img [ref=e90]
                - text: Import Excel
              - button "AI Builder" [ref=e93]:
                - img [ref=e94]
                - text: AI Builder
              - button "Export" [ref=e97]:
                - img [ref=e98]
                - text: Export
              - button "Add Question" [ref=e101]:
                - img [ref=e102]
                - text: Add Question
          - generic [ref=e103]:
            - generic [ref=e104]:
              - generic [ref=e105]:
                - combobox [ref=e106]:
                  - option "All Subjects" [selected]
                  - option "Computer Science"
                  - option "Mathematics"
                  - option "Physics"
                - combobox [ref=e107]:
                  - option "Any Difficulty" [selected]
                  - option "Easy"
                  - option "Medium"
                  - option "Hard"
                - combobox [ref=e108]:
                  - option "Any Type" [selected]
                  - option "Multiple Choice"
                  - option "True / False"
                  - option "Short Answer"
              - generic [ref=e109]: Showing 1-10 of 1,245 questions
            - table [ref=e111]:
              - rowgroup [ref=e112]:
                - row "Tên đề thi Môn học Số câu hỏi Số lượt làm bài Thời gian Ngày tạo" [ref=e113]:
                  - columnheader [ref=e114]:
                    - checkbox [ref=e115]
                  - columnheader "Tên đề thi" [ref=e116]
                  - columnheader "Môn học" [ref=e117]
                  - columnheader "Số câu hỏi" [ref=e118]
                  - columnheader "Số lượt làm bài" [ref=e119]
                  - columnheader "Thời gian" [ref=e120]
                  - columnheader "Ngày tạo" [ref=e121]
                  - columnheader [ref=e122]
              - rowgroup [ref=e123]:
                - row "Chưa có đề thi nào." [ref=e124]:
                  - cell "Chưa có đề thi nào." [ref=e125]
            - generic [ref=e126]:
              - button "Previous" [ref=e127]
              - generic [ref=e128]:
                - button "1" [ref=e129]
                - button "2" [ref=e130]
                - button "3" [ref=e131]
                - generic [ref=e132]: ...
                - button "125" [ref=e133]
              - button "Next" [ref=e134]
          - generic [ref=e136]:
            - generic [ref=e137]:
              - generic [ref=e138]:
                - img [ref=e140]
                - generic [ref=e143]:
                  - heading "AI Quiz Builder" [level=2] [ref=e144]
                  - paragraph [ref=e145]: Tạo câu hỏi từ tài liệu đã học
              - button [ref=e146]:
                - img [ref=e147]
            - generic [ref=e151]:
              - generic [ref=e152]:
                - generic [ref=e153]:
                  - generic [ref=e154]: Tên đề thi *
                  - 'textbox "VD: Kiểm tra 15 phút" [ref=e155]': Bài thi Vượt cấp E2E
                - generic [ref=e156]:
                  - generic [ref=e157]: Khóa học (Course ID) *
                  - textbox "Nhập ID khóa học" [ref=e158]: "1"
              - generic [ref=e159]:
                - generic [ref=e160]:
                  - generic [ref=e161]: Chủ đề (Topic) - Optional
                  - 'textbox "Ví dụ: Đại số tuyến tính..." [ref=e162]'
                - generic [ref=e163]:
                  - generic [ref=e164]: Thời gian (Phút)
                  - spinbutton [ref=e165]: "15"
              - generic [ref=e166]:
                - generic [ref=e167]:
                  - generic [ref=e168]: Số lượng câu hỏi
                  - spinbutton [ref=e169]: "5"
                - generic [ref=e171] [cursor=pointer]:
                  - checkbox "Đề thi Vượt cấp (Graduation)" [checked] [ref=e173]
                  - generic [ref=e175]: Đề thi Vượt cấp (Graduation)
            - generic [ref=e176]:
              - button "Hủy" [ref=e177]
              - button "Tạo câu hỏi" [ref=e178]:
                - img [ref=e179]
                - text: Tạo câu hỏi
  - generic [ref=e186] [cursor=pointer]:
    - button "Open Next.js Dev Tools" [ref=e187]:
      - img [ref=e188]
    - generic [ref=e191]:
      - button "Open issues overlay" [ref=e192]:
        - generic [ref=e193]:
          - generic [ref=e194]: "1"
          - generic [ref=e195]: "2"
        - generic [ref=e196]:
          - text: Issue
          - generic [ref=e197]: s
      - button "Collapse issues badge" [ref=e198]:
        - img [ref=e199]
  - alert [ref=e201]
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
> 80  |     await page.locator('button').filter({ hasText: 'Lưu & Sử dụng' }).click();
      |                                                                       ^ Error: locator.click: Test timeout of 180000ms exceeded.
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
  99  |     await expect(page.locator(`text=${courseName}`).first()).toBeVisible({ timeout: 15000 });
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