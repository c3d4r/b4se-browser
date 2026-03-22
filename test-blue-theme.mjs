import { chromium } from '@playwright/test';

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
});
const page = await context.newPage();
await page.goto('http://localhost:5001');
await page.waitForTimeout(2000);

// Inject dark blue theme overrides
await page.addStyleTag({ content: `
  /* ── Dark Blue Theme ─────────────────────────── */
  body {
    background: #020617 !important;   /* slate-950 */
    color: #e2e8f0 !important;        /* slate-200 */
  }

  /* Panels & chrome */
  header, footer,
  .lhs-panel, .rhs-panel,
  .bg-stone-900, .bg-stone-900\\/80 {
    background: #0f172a !important;    /* slate-900 */
  }
  footer {
    background: rgba(15, 23, 42, 0.85) !important;
  }
  header {
    background: rgba(15, 23, 42, 0.85) !important;
  }

  /* Borders */
  .border-stone-800,
  .border-stone-800\\/50,
  [style*="border"] {
    border-color: #1e293b !important; /* slate-800 */
  }
  .border-t, .border-b, .border-r, .border-l {
    border-color: #1e293b !important;
  }

  /* Text colors */
  .text-stone-200 { color: #e2e8f0 !important; }
  .text-stone-400, .text-stone-500 { color: #94a3b8 !important; }
  .text-stone-600 { color: #64748b !important; }

  /* Accent: violet → sky blue */
  .text-violet-400,
  .cm-header,
  .prose h1, .prose h2, .prose h3,
  .link-preview-title {
    color: #38bdf8 !important;        /* sky-400 */
  }
  .border-violet-400 {
    border-color: #38bdf8 !important;
  }
  .lhs-item-active {
    background: rgba(56, 189, 248, 0.1) !important;
    color: #7dd3fc !important;        /* sky-300 */
  }
  .lhs-icon-btn.text-violet-400 {
    color: #38bdf8 !important;
  }

  /* Active icon button bg */
  .bg-stone-800,
  .hover\\:bg-stone-800:hover,
  .hover\\:bg-stone-800\\/50:hover {
    background: #1e293b !important;
  }

  /* Links: indigo → cyan */
  .prose a, .cm-link, .rhs-link-item {
    color: #22d3ee !important;        /* cyan-400 */
  }
  .cm-url {
    color: #06b6d4 !important;        /* cyan-500 */
  }

  /* Inline code: green → teal */
  .cm-monospace, .cm-inline-code,
  .prose code {
    color: #2dd4bf !important;        /* teal-400 */
  }

  /* Strong: amber → amber (keep warm contrast) */
  .cm-strong { color: #fbbf24 !important; }

  /* Emphasis: cyan → sky-200 (lighter) */
  .cm-em { color: #bae6fd !important; }

  /* Caret & selection */
  .cm-editor .cm-content {
    caret-color: #38bdf8 !important;
  }
  .cm-editor .cm-cursor {
    border-left-color: #38bdf8 !important;
  }
  .cm-editor .cm-selectionBackground,
  .cm-editor .cm-content ::selection {
    background: rgba(56, 189, 248, 0.2) !important;
  }

  /* Active line */
  .cm-editor .cm-activeLine {
    background: rgba(255,255,255,.03) !important;
  }

  /* Gutters */
  .cm-editor .cm-gutters {
    color: #475569 !important;        /* slate-600 */
  }
  .cm-editor .cm-activeLineGutter {
    color: #94a3b8 !important;
  }

  /* Code blocks */
  .prose pre {
    background: #0f172a !important;
    border-color: #1e293b !important;
  }

  /* Blockquotes */
  .prose blockquote, .lp-blockquote {
    border-left-color: #334155 !important; /* slate-700 */
    color: #94a3b8 !important;
  }
  .cm-quote { color: #94a3b8 !important; }

  /* HR */
  .cm-hr, .prose hr, .lp-hr {
    border-color: #334155 !important;
  }

  /* Scrollbar */
  ::-webkit-scrollbar-thumb {
    background: #334155 !important;
  }
  ::-webkit-scrollbar-thumb:hover {
    background: #475569 !important;
  }

  /* Bullet */
  .lp-bullet { color: #38bdf8 !important; }

  /* Checkbox */
  .lp-checkbox {
    border-color: #475569 !important;
  }
  .lp-checkbox:checked {
    background: #0ea5e9 !important;   /* sky-500 */
    border-color: #0ea5e9 !important;
  }

  /* Status bar text */
  footer span {
    color: #64748b !important;        /* slate-500 */
  }
`});

await page.waitForTimeout(300);

// Screenshot 1: reading mode
await page.screenshot({ path: '/home/sprite/markdown_page/screenshot-blue-read.png' });

// Screenshot 2: with sidebar icons
await page.click('button[title="Toggle navigation"]');
await page.waitForTimeout(500);
await page.screenshot({ path: '/home/sprite/markdown_page/screenshot-blue-icons.png' });

// Screenshot 3: sidebar expanded
await page.click('button[title="Files"]');
await page.waitForTimeout(500);
await page.screenshot({ path: '/home/sprite/markdown_page/screenshot-blue-full.png' });

// Screenshot 4: scroll down to see more content variety
await page.click('button[title="Toggle navigation"]'); // close sidebar
await page.waitForTimeout(300);
await page.evaluate(() => {
  document.querySelector('.overflow-y-auto')?.scrollBy(0, 400);
});
await page.waitForTimeout(300);
await page.screenshot({ path: '/home/sprite/markdown_page/screenshot-blue-scroll.png' });

await browser.close();
console.log('Done — blue theme screenshots saved');
