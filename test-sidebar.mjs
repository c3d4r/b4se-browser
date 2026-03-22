import { chromium } from '@playwright/test';

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 390, height: 844 }, // iPhone 14 size
});
const page = await context.newPage();

await page.goto('http://localhost:5001');
await page.waitForTimeout(2000); // let Alpine + icons load

// Screenshot 1: initial state (sidebar closed)
await page.screenshot({ path: '/home/sprite/markdown_page/screenshot-1-closed.png' });

// Click the hamburger button
await page.click('button[title="Toggle navigation"]');
await page.waitForTimeout(500); // let transition finish

// Screenshot 2: sidebar open (icon mode)
await page.screenshot({ path: '/home/sprite/markdown_page/screenshot-2-icons.png' });

// Click a section icon to expand fully
await page.click('button[title="Files"]');
await page.waitForTimeout(500);

// Screenshot 3: sidebar fully expanded
await page.screenshot({ path: '/home/sprite/markdown_page/screenshot-3-full.png' });

await browser.close();
console.log('Done — 3 screenshots saved');
