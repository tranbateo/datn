import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  await page.goto('http://localhost:3000/vi/admin/login');
  await page.fill('input[name="email"]', 'tailangtund@gmail.com');
  await page.fill('input[name="password"]', '123456');
  await page.click('button[type="submit"]');
  
  await page.waitForURL(/.*\/admin/);
  console.log('URL after login:', page.url());
  
  await page.goto('http://localhost:3000/vi/admin/students');
  await page.waitForTimeout(5000);
  
  console.log('URL after goto students:', page.url());
  
  const text = await page.evaluate(() => document.body.innerText);
  console.log('TEXT:', text.substring(0, 500));

  await browser.close();
})();
