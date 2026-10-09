// Tiny dependency-free server: serves the static app and proxies quadratic
// generation to Claude Haiku so the API key never reaches the browser.
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = Number(process.env.PORT) || 3000;
const MODEL = 'claude-haiku-5-5';
const STATIC_FILES = {
  '/': ['index.html', 'text/html; charset=utf-8'],
  '/index.html': ['index.html', 'text/html; charset=utf-8'],
  '/script.js': ['script.js', 'text/javascript; charset=utf-8'],
};

const HINTS = ['two distinct real roots', 'a repeated real root', 'two complex (imaginary) roots'];

function isValid({ a, b, c } = {}) {
  return [a, b, c].every((n) => Number.isInteger(n) && Math.abs(n) <= 20) && a !== 0;
}

function randomCoefficients() {
  const rnd = () => Math.floor(Math.random() * 21) - 10;
  let a = 0;
  while (a === 0) a = rnd();
  return { a, b: rnd(), c: rnd() };
}

async function askHaiku(apiKey) {
  const hint = HINTS[Math.floor(Math.random() * HINTS.length)];
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 100,
      messages: [{
        role: 'user',
        content:
          `Generate a quadratic equation ax^2+bx+c=0 for a student exercise with ${hint}. ` +
          'Use small integers (|a|,|b|,|c| <= 20, a != 0). ' +
          'Reply with ONLY JSON like {"a":1,"b":-5,"c":6}.',
      }],
    }),
  });
  if (!res.ok) throw new Error(`Anthropic API ${res.status}`);
  const data = await res.json();
  const text = (data.content || []).map((p) => p.text || '').join('');
  const match = text.match(/\{[^}]*\}/);
  if (!match) throw new Error('No JSON in model reply');
  return JSON.parse(match[0]);
}

async function generateQuadratic() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    const err = new Error('ANTHROPIC_API_KEY is not set on the server.');
    err.status = 500;
    throw err;
  }
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const coeffs = await askHaiku(apiKey);
      if (isValid(coeffs)) return { a: coeffs.a, b: coeffs.b, c: coeffs.c, source: 'claude' };
    } catch (e) {
      console.error('Haiku attempt failed:', e.message);
    }
  }
  return { ...randomCoefficients(), source: 'fallback' };
}

function sendJson(res, status, body) {
  res.writeHead(status, { 'content-type': 'application/json' });
  res.end(JSON.stringify(body));
}

http.createServer(async (req, res) => {
  const url = req.url.split('?')[0];

  if (req.method === 'POST' && url === '/api/quadratic') {
    try {
      sendJson(res, 200, await generateQuadratic());
    } catch (e) {
      sendJson(res, e.status || 502, { error: e.message });
    }
    return;
  }

  const file = req.method === 'GET' && STATIC_FILES[url];
  if (file) {
    fs.readFile(path.join(__dirname, file[0]), (err, buf) => {
      if (err) return sendJson(res, 500, { error: 'Could not read file' });
      res.writeHead(200, { 'content-type': file[1] });
      res.end(buf);
    });
    return;
  }

  sendJson(res, 404, { error: 'Not found' });
}).listen(PORT, () => console.log(`Math app running at http://localhost:${PORT}`));
