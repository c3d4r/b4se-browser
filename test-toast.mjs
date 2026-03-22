import { chromium } from '@playwright/test';

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
});
const page = await context.newPage();

await page.goto('http://localhost:5001');
await page.waitForTimeout(2000);

// Inject a few toast variants to compare
await page.evaluate(() => {
  const toasts = [
    { msg: 'Vault synced successfully', icon: '✓', style: 'success' },
    { msg: 'Exporting to PDF…', icon: '↻', style: 'info' },
    { msg: 'Note saved to cloud', icon: '☁', style: 'success' },
  ];

  const container = document.createElement('div');
  container.style.cssText = `
    position: fixed;
    bottom: 36px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 200;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    pointer-events: none;
  `;

  toasts.forEach(t => {
    const el = document.createElement('div');
    const accentColor = t.style === 'success' ? '#4ade80' : '#a78bfa';
    el.style.cssText = `
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 18px;
      background: rgba(28, 25, 23, 0.92);
      backdrop-filter: blur(16px);
      border: 1px solid ${t.style === 'success' ? 'rgba(74, 222, 128, 0.2)' : 'rgba(167, 139, 250, 0.2)'};
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(139, 92, 246, 0.08);
      font-size: 13px;
      color: #e7e5e4;
      white-space: nowrap;
      pointer-events: auto;
    `;

    const icon = document.createElement('span');
    icon.textContent = t.icon;
    icon.style.cssText = `
      color: ${accentColor};
      font-size: 15px;
      font-weight: 700;
      ${t.icon === '↻' ? 'animation: spin 1s linear infinite;' : ''}
    `;

    const text = document.createElement('span');
    text.textContent = t.msg;

    el.appendChild(icon);
    el.appendChild(text);
    container.appendChild(el);
  });

  document.body.appendChild(container);
});

await page.screenshot({ path: '/home/sprite/markdown_page/screenshot-toast-stack.png' });

// Now show just a single toast as it would appear in practice
await page.evaluate(() => {
  // Remove the stack
  document.body.lastElementChild.remove();

  const el = document.createElement('div');
  el.style.cssText = `
    position: fixed;
    bottom: 44px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 200;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 20px;
    background: rgba(28, 25, 23, 0.92);
    backdrop-filter: blur(16px);
    border: 1px solid rgba(74, 222, 128, 0.2);
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(74, 222, 128, 0.08);
    font-size: 13px;
    color: #e7e5e4;
    white-space: nowrap;
  `;
  el.innerHTML = `<span style="color:#4ade80; font-size:14px;">✓</span> Vault synced successfully`;
  document.body.appendChild(el);
});

await page.screenshot({ path: '/home/sprite/markdown_page/screenshot-toast-single.png' });

await browser.close();
console.log('Done — toast screenshots saved');
