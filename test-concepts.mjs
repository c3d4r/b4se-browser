import { chromium } from '@playwright/test';

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
});
const page = await context.newPage();
await page.goto('http://localhost:5001');
await page.waitForTimeout(2000);

// ── 1. Preview with navigation affordance ──
await page.evaluate(() => {
  const card = document.createElement('div');
  card.style.cssText = `
    position: fixed;
    z-index: 100;
    width: 280px;
    left: 55px;
    top: 220px;
    background: rgba(28, 25, 23, 0.95);
    backdrop-filter: blur(16px) saturate(1.4);
    border: 1px solid #44403c;
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(139, 92, 246, 0.15);
    overflow: hidden;
  `;
  card.innerHTML = `
    <div style="padding: 10px 14px 0; font-size: 14px; font-weight: 700; color: #c4b5fd;">Attention Mechanism</div>
    <div style="padding: 6px 14px 10px; font-size: 12px; line-height: 1.6; color: #d6d3d1;">
      Allows models to focus on relevant parts of the input.<br><br>
      Key innovation behind <strong>Transformers</strong> and modern LLMs.
    </div>
    <div style="border-top: 1px solid #44403c; display: flex; align-items: center; justify-content: space-between; padding: 8px 14px; cursor: pointer;">
      <span style="font-size: 11px; color: #a8a29e;">Tap to open note</span>
      <span style="color: #818cf8; font-size: 14px;">→</span>
    </div>
  `;
  document.body.appendChild(card);

  // Highlight the link that triggered it
  const links = document.querySelectorAll('a');
  for (const l of links) {
    if (l.textContent.toLowerCase().includes('obsidian')) {
      l.style.background = 'rgba(139, 92, 246, 0.15)';
      l.style.borderRadius = '3px';
      l.style.padding = '0 2px';
    }
  }
});

await page.screenshot({ path: '/home/sprite/markdown_page/screenshot-preview-nav.png' });

// Clear
await page.evaluate(() => {
  document.querySelector('[style*="z-index: 100"]').remove();
});

// ── 2a. Chat as bottom drawer (half-screen) ──
await page.evaluate(() => {
  const drawer = document.createElement('div');
  drawer.style.cssText = `
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    height: 55%;
    z-index: 60;
    background: #1c1917;
    border-top: 1px solid #44403c;
    border-radius: 16px 16px 0 0;
    display: flex;
    flex-direction: column;
    box-shadow: 0 -8px 32px rgba(0,0,0,0.5);
  `;
  drawer.innerHTML = `
    <!-- Handle -->
    <div style="display: flex; justify-content: center; padding: 8px 0 4px;">
      <div style="width: 36px; height: 4px; background: #57534e; border-radius: 2px;"></div>
    </div>
    <!-- Header -->
    <div style="display: flex; align-items: center; justify-content: space-between; padding: 4px 16px 10px;">
      <span style="font-size: 13px; font-weight: 600; color: #c4b5fd;">Chat</span>
      <span style="font-size: 11px; color: #57534e;">claude-opus-4-6</span>
    </div>
    <!-- Messages -->
    <div style="flex: 1; overflow-y: auto; padding: 0 16px 8px; display: flex; flex-direction: column; gap: 10px;">
      <div style="align-self: flex-end; background: rgba(139, 92, 246, 0.15); border: 1px solid rgba(139, 92, 246, 0.2); border-radius: 12px 12px 4px 12px; padding: 8px 12px; font-size: 13px; color: #e7e5e4; max-width: 80%;">
        Summarize my notes on attention mechanisms
      </div>
      <div style="align-self: flex-start; background: #292524; border: 1px solid #44403c; border-radius: 12px 12px 12px 4px; padding: 8px 12px; font-size: 13px; color: #d6d3d1; max-width: 85%; line-height: 1.5;">
        Based on your note, the <span style="color: #c4b5fd; font-weight: 600;">attention mechanism</span> lets models weigh relevance across input tokens. The key formula is the scaled dot-product: softmax(QK<sup>T</sup>/√d)V. It's the core of the <span style="color: #818cf8;">Transformer architecture</span>.
      </div>
      <div style="align-self: flex-end; background: rgba(139, 92, 246, 0.15); border: 1px solid rgba(139, 92, 246, 0.2); border-radius: 12px 12px 4px 12px; padding: 8px 12px; font-size: 13px; color: #e7e5e4; max-width: 80%;">
        Add a section on multi-head attention
      </div>
      <div style="align-self: flex-start; display: flex; align-items: center; gap: 6px; padding: 8px 0;">
        <div style="width: 6px; height: 6px; background: #a78bfa; border-radius: 50%; animation: pulse 1.5s infinite;"></div>
        <span style="font-size: 12px; color: #78716c;">Thinking...</span>
      </div>
    </div>
    <!-- Input -->
    <div style="padding: 8px 12px 28px; border-top: 1px solid #44403c;">
      <div style="display: flex; align-items: center; gap: 8px; padding: 8px 12px; background: #292524; border: 1px solid #44403c; border-radius: 10px;">
        <input type="text" placeholder="Ask about your notes..." style="flex: 1; background: transparent; border: none; outline: none; color: #e7e5e4; font-size: 13px;" />
        <span style="color: #a78bfa; font-size: 16px; cursor: pointer;">↑</span>
      </div>
    </div>
  `;
  document.body.appendChild(drawer);
});

await page.screenshot({ path: '/home/sprite/markdown_page/screenshot-chat-drawer.png' });

// Clear
await page.evaluate(() => {
  document.querySelector('[style*="height: 55%"]').remove();
});

// ── 2b. Chat as RHS panel tab (desktop feel) ──
// First open the RHS
await page.evaluate(() => {
  const panel = document.createElement('div');
  panel.style.cssText = `
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    width: 300px;
    z-index: 40;
    background: #1c1917;
    border-left: 1px solid #44403c;
    display: flex;
    flex-direction: column;
  `;
  panel.innerHTML = `
    <!-- Tabs -->
    <div style="display: flex; border-bottom: 1px solid #44403c; shrink: 0;">
      <div style="flex: 1; padding: 10px 2px; text-align: center; font-size: 11px; color: #57534e;">Links</div>
      <div style="flex: 1; padding: 10px 2px; text-align: center; font-size: 11px; color: #57534e;">Back</div>
      <div style="flex: 1; padding: 10px 2px; text-align: center; font-size: 11px; color: #a78bfa; border-bottom: 2px solid #a78bfa; font-weight: 600;">Chat</div>
      <div style="flex: 1; padding: 10px 2px; text-align: center; font-size: 11px; color: #57534e;">Info</div>
    </div>
    <!-- Messages -->
    <div style="flex: 1; overflow-y: auto; padding: 12px; display: flex; flex-direction: column; gap: 10px;">
      <div style="align-self: flex-end; background: rgba(139, 92, 246, 0.15); border: 1px solid rgba(139, 92, 246, 0.2); border-radius: 10px 10px 4px 10px; padding: 7px 10px; font-size: 12px; color: #e7e5e4; max-width: 85%;">
        Summarize this note
      </div>
      <div style="align-self: flex-start; background: #292524; border: 1px solid #44403c; border-radius: 10px 10px 10px 4px; padding: 7px 10px; font-size: 12px; color: #d6d3d1; max-width: 90%; line-height: 1.5;">
        This note covers the <span style="color: #c4b5fd;">attention mechanism</span> — the core of Transformers. Key concept: scaled dot-product attention.
      </div>
    </div>
    <!-- Input -->
    <div style="padding: 8px 12px 12px; border-top: 1px solid #44403c;">
      <div style="display: flex; align-items: center; gap: 6px; padding: 7px 10px; background: #292524; border: 1px solid #44403c; border-radius: 8px;">
        <input type="text" placeholder="Ask..." style="flex: 1; background: transparent; border: none; outline: none; color: #e7e5e4; font-size: 12px;" />
        <span style="color: #a78bfa; font-size: 14px;">↑</span>
      </div>
    </div>
  `;
  document.body.appendChild(panel);
});

await page.screenshot({ path: '/home/sprite/markdown_page/screenshot-chat-rhs.png' });

await browser.close();
console.log('Done — concept screenshots saved');
