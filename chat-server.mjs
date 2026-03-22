import http from 'http';
import { readFileSync } from 'fs';
import { join, extname } from 'path';

const PORT = 5002;
const messages = [];
let waitingRes = null; // holds a long-poll response for Claude

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.writeHead(200); res.end(); return; }

  // Serve chat.html
  if (url.pathname === '/' || url.pathname === '/chat.html') {
    try {
      const html = readFileSync(join(process.cwd(), 'chat.html'), 'utf8');
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(html);
    } catch (e) {
      res.writeHead(404); res.end('chat.html not found');
    }
    return;
  }

  // GET /messages — return all messages
  if (req.method === 'GET' && url.pathname === '/messages') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(messages));
    return;
  }

  // GET /messages/since/:id — return messages after index (long-poll for Claude)
  if (req.method === 'GET' && url.pathname === '/poll') {
    const since = parseInt(url.searchParams.get('since') || '0');
    const userMsgs = messages.filter((m, i) => i >= since && m.role === 'user');

    if (userMsgs.length > 0) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ index: messages.length, messages: userMsgs }));
      return;
    }

    // Long-poll: hold connection until a user message arrives (max 30s)
    waitingRes = { res, since };
    setTimeout(() => {
      if (waitingRes && waitingRes.res === res) {
        waitingRes = null;
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ index: messages.length, messages: [] }));
      }
    }, 30000);
    return;
  }

  // POST /send — user sends a message (from browser)
  if (req.method === 'POST' && url.pathname === '/send') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      try {
        const { text } = JSON.parse(body);
        if (!text?.trim()) { res.writeHead(400); res.end('empty'); return; }
        messages.push({ role: 'user', text: text.trim(), ts: Date.now() });
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, index: messages.length }));

        // Wake up long-poll
        if (waitingRes) {
          const w = waitingRes;
          waitingRes = null;
          const userMsgs = messages.filter((m, i) => i >= w.since && m.role === 'user');
          w.res.writeHead(200, { 'Content-Type': 'application/json' });
          w.res.end(JSON.stringify({ index: messages.length, messages: userMsgs }));
        }
      } catch (e) {
        res.writeHead(400); res.end('bad json');
      }
    });
    return;
  }

  // POST /respond — Claude sends a response (from terminal via curl)
  if (req.method === 'POST' && url.pathname === '/respond') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      try {
        const { text } = JSON.parse(body);
        if (!text?.trim()) { res.writeHead(400); res.end('empty'); return; }
        messages.push({ role: 'assistant', text: text.trim(), ts: Date.now() });
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, index: messages.length }));
      } catch (e) {
        res.writeHead(400); res.end('bad json');
      }
    });
    return;
  }

  res.writeHead(404); res.end('not found');
});

server.listen(PORT, () => {
  console.log(`Chat server on http://localhost:${PORT}`);
});
