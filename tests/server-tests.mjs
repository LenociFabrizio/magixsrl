// Test del routing di server.js: file serviti e non, redirect, header, cache, limiti.
// Uso: node tests/server-tests.mjs
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { start, ROOT } from './testsrv.mjs';

const PORT = 4680, B = `http://localhost:${PORT}`;
Object.assign(process.env, { ADMIN_USERNAME: 'admin@magix.it', ADMIN_PASSWORD: 'Password-Di-Test-2026!', AUTH_SECRET: crypto.randomBytes(32).toString('hex'), BLOB_READ_WRITE_TOKEN: 'fake' });

let pass = 0, fail = 0;
const ok = (cond, label, extra) => { if (cond) { pass++; console.log('  ✔', label); } else { fail++; console.log('  ✘', label, extra !== undefined ? JSON.stringify(extra) : ''); } };
const section = (t) => console.log('\n■ ' + t);
const get = (p, opts = {}) => fetch(B + p, { redirect: 'manual', ...opts });

// richiesta con il percorso esatto (fetch normalizzerebbe "..", "%2e%2e" ecc.)
const rawGet = (p) => new Promise((resolve, reject) => {
  http.get({ host: 'localhost', port: PORT, path: p }, (r) => { r.resume(); r.on('end', () => resolve(r.statusCode)); }).on('error', reject);
});

const srv = await start(null, PORT);
try {
  section('Pagine e file del sito');
  let r = await get('/');
  ok(r.status === 200 && r.headers.get('content-type').startsWith('text/html'), '/ → index.html');
  ok(!r.headers.get('x-robots-tag'), '/ indicizzabile (nessun X-Robots-Tag)');
  r = await get('/admin');
  ok(r.status === 200 && r.headers.get('x-robots-tag') === 'noindex, nofollow', '/admin → index.html con noindex');

  // ogni risorsa locale citata da index.html deve rispondere 200
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const refs = [...new Set([...html.matchAll(/(?:src|href)="([^"#:?]+)"/g)].map((m) => '/' + m[1].replace(/^\.?\//, '')))].filter((x) => x !== '/');
  const missing = [];
  for (const p of refs) { const s = (await get(encodeURI(decodeURI(p)))).status; if (s !== 200) missing.push(p + ' ' + s); }
  ok(refs.length > 20 && missing.length === 0, `tutte le ${refs.length} risorse di index.html servite`, missing);
  const fonts = [...fs.readFileSync(path.join(ROOT, 'fonts.css'), 'utf8').matchAll(/url\(([^)]+)\)/g)].map((m) => '/' + m[1]);
  const fontKo = [];
  for (const p of fonts) if ((await get(p)).status !== 200) fontKo.push(p);
  ok(fontKo.length === 0, 'font di fonts.css serviti', fontKo);
  const pdf = fs.readdirSync(path.join(ROOT, 'documents')).find((f) => f.endsWith('.pdf'));
  r = await get('/documents/' + encodeURIComponent(pdf));
  ok(r.status === 200 && r.headers.get('content-type') === 'application/pdf', 'PDF del catalogo (nome con spazi) servito come application/pdf');

  section('File che NON devono essere serviti (404)');
  for (const p of ['/api/_lib/auth.js', '/api/_seed/catalog.json', '/api/auth.js', '/package.json', '/package-lock.json', '/README.md', '/.env', '/.env.local', '/.env.example', '/docs/piano-migrazione-hostinger.md', '/server.js', '/vercel.json', '/.vercelignore', '/.gitignore', '/.git/config', '/tests/testsrv.mjs', '/node_modules/@vercel/blob/package.json', '/img', '/img/', '/api/', '/api/inesistente', '/api/_lib']) {
    const s = (await get(p)).status;
    ok(s === 404 || (s === 308 && p.endsWith('/')), `${p} → ${s}`);
  }

  section('Path traversal');
  for (const p of ['/img/../package.json', '/img/%2e%2e/package.json', '/img/%2e%2e%2fpackage.json', '/img/..%5cpackage.json', '/img/%5c..%5c..%5cpackage.json', '/img/%00.png', '/%2e%2e/%2e%2e/windows/win.ini', '/img/%E0%A4%A']) {
    const s = await rawGet(p);
    ok(s === 404, `${p} → ${s}`);
  }

  section('Redirect (cleanUrls, trailingSlash)');
  r = await get('/index.html');
  ok(r.status === 301 && r.headers.get('location') === '/', '/index.html → 301 /');
  r = await get('/admin/');
  ok(r.status === 308 && r.headers.get('location') === '/admin', '/admin/ → 308 /admin');
  r = await get('/admin/?x=1');
  ok(r.status === 308 && r.headers.get('location') === '/admin?x=1', 'la query string resta nel redirect');

  section('Header di sicurezza uguali a vercel.json');
  const vj = JSON.parse(fs.readFileSync(path.join(ROOT, 'vercel.json'), 'utf8'));
  const globalH = vj.headers.find((h) => h.source === '/(.*)').headers;
  for (const p of ['/', '/admin', '/api/catalog', '/img/logo.png', '/non-esiste']) {
    r = await get(p);
    const diff = globalH.filter((h) => r.headers.get(h.key) !== h.value).map((h) => h.key);
    ok(diff.length === 0, `${p}: header di vercel.json presenti e identici`, diff);
    ok(/max-age=\d+/.test(r.headers.get('strict-transport-security') || ''), `${p}: HSTS`);
  }

  section('Cache e compressione');
  r = await get('/img/logo.png');
  ok(r.headers.get('cache-control') === 'public, max-age=86400, stale-while-revalidate=604800', '/img: 1 giorno');
  r = await get('/vendor/tailwindcss-3.4.17.js');
  ok(r.headers.get('cache-control') === 'public, max-age=31536000, immutable', '/vendor: immutabile');
  r = await get('/script.js', { headers: { 'accept-encoding': 'gzip' } });
  const etag = r.headers.get('etag');
  ok(r.headers.get('cache-control') === 'public, max-age=0, must-revalidate', '/script.js: sempre rivalidato');
  ok(r.headers.get('content-encoding') === 'gzip', 'testi compressi con gzip');
  const body = await r.text();
  ok(body === fs.readFileSync(path.join(ROOT, 'script.js'), 'utf8'), 'contenuto compresso identico al file');
  r = await get('/script.js', { headers: { 'if-none-match': etag } });
  ok(r.status === 304, 'If-None-Match → 304', r.status);
  r = await get('/img/logo.png', { headers: { 'accept-encoding': 'gzip' } });
  ok(!r.headers.get('content-encoding'), 'immagini non ricompresse');
  r = await get('/', { method: 'HEAD' });
  ok(r.status === 200 && (await r.text()) === '', 'HEAD senza corpo');

  section('API: adattatore e limiti');
  r = await get('/api/catalog');
  const cat = await r.json();
  ok(r.status === 200 && Object.keys(cat).length > 5, 'GET /api/catalog → catalogo (seed)');
  ok(r.headers.get('x-robots-tag') === 'noindex, nofollow', '/api/*: noindex');
  r = await get('/api/news?x=1');
  ok(r.status === 200 && Array.isArray(await r.json()), 'GET con query string');
  r = await get('/api/auth?action=login', { method: 'POST', headers: { 'content-type': 'application/json', origin: B }, body: '{rotto' });
  ok(r.status === 400, 'JSON malformato → 400', r.status);
  r = await get('/api/auth?action=login', { method: 'POST', headers: { 'content-type': 'application/json', origin: B }, body: JSON.stringify({ x: 'a'.repeat(1100000) }) }).catch(() => ({ status: 'reset' }));
  ok(r.status === 413 || r.status === 'reset', 'body > 1 MB → 413', r.status);
  r = await get('/api/auth?action=login', { method: 'POST', headers: { 'content-type': 'application/json', origin: B }, body: JSON.stringify({ username: 'admin@magix.it', password: 'Password-Di-Test-2026!' }) });
  ok(r.status === 200 && (r.headers.get('set-cookie') || '').includes('Secure'), 'login reale con cookie Secure');
  r = await get('/', { method: 'POST' });
  ok(r.status === 405, 'POST su una pagina → 405', r.status);
} finally {
  srv.close();
}
console.log(`\n${pass} ok, ${fail} falliti`);
process.exit(fail ? 1 : 0);
