import { chromium } from '@playwright/test';

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
});
const page = await context.newPage();
await page.goto('http://localhost:5002');
await page.waitForTimeout(2000);

await page.screenshot({ path: '/home/sprite/markdown_page/screenshot-chat-page.png' });

await browser.close();
console.log('Done');
