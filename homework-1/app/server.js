const http = require('node:http');

const port = Number(process.env.PORT) || 3000;
const name = process.env.STUDENT_NAME || 'Unknown';
const studentId = process.env.STUDENT_ID || '000000';
const headline = `FCSE Skopje, Homework 1, ${studentId}`;

const escapeHtml = (value) =>
  value.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

const text = `${headline}\n${name}\n`;

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(headline)}</title>
<style>
html, body { height: 100%; margin: 0; }
body { display: grid; place-items: center; font-family: system-ui, sans-serif; background: #0f172a; color: #e2e8f0; }
main { text-align: center; padding: 2rem; }
h1 { font-size: clamp(1.5rem, 5vw, 3rem); margin: 0 0 .5rem; }
p { margin: 0; font-size: 1.25rem; color: #94a3b8; }
</style>
</head>
<body>
<main>
<h1>${escapeHtml(headline)}</h1>
<p>${escapeHtml(name)}</p>
</main>
</body>
</html>
`;

const server = http.createServer((req, res) => {
  const { pathname } = new URL(req.url, 'http://localhost');

  if (pathname !== '/' || (req.method !== 'GET' && req.method !== 'HEAD')) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not Found\n');
    return;
  }

  const wantsHtml = (req.headers.accept || '').includes('text/html');
  const body = wantsHtml ? html : text;

  res.writeHead(200, {
    'Content-Type': wantsHtml ? 'text/html; charset=utf-8' : 'text/plain; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'Cache-Control': 'no-store',
    Vary: 'Accept',
    'X-Content-Type-Options': 'nosniff',
  });
  res.end(req.method === 'HEAD' ? undefined : body);
});

server.listen(port, '0.0.0.0');

for (const signal of ['SIGTERM', 'SIGINT']) {
  process.on(signal, () => server.close(() => process.exit(0)));
}
