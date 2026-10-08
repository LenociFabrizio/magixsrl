// Test delle protezioni aggiunte nell'ottimizzazione di ottobre 2026 (veri handler api/*.js, Blob in memoria):
// controllo Origin, URL ammessi, chiavi riservate, DELETE senza id, Cache-Control, header di sicurezza.
import crypto from 'node:crypto';
import { start, BLOBS } from './testsrv.mjs';

const ROOT = null; // si testa sempre questo repo (vedi testsrv.mjs)
const PORT = 4650, B = `http://localhost:${PORT}`;
const USER = 'admin@magix.it', PASS = 'Corretta-Password-2026!';
Object.assign(process.env, { ADMIN_USERNAME: USER, ADMIN_PASSWORD: PASS, AUTH_SECRET: crypto.randomBytes(32).toString('hex'), BLOB_READ_WRITE_TOKEN: 'fake' });

let pass = 0, fail = 0;
const ok = (c, label, extra) => { if (c) { pass++; console.log('  ✔', label); } else { fail++; console.log('  ✘', label, extra !== undefined ? JSON.stringify(extra) : ''); } };
const section = (t) => console.log('\n■ ' + t);
async function call(method, path, { body, cookie, headers = {} } = {}) {
  const h = { Accept: 'application/json', ...headers };
  if (body !== undefined) h['Content-Type'] = 'application/json';
  if (cookie) h.Cookie = cookie;
  const r = await fetch(B + path, { method, headers: h, body: body !== undefined ? JSON.stringify(body) : undefined });
  const text = await r.text(); let json = null; try { json = JSON.parse(text); } catch {}
  return { status: r.status, json, text, headers: r.headers, setCookie: r.headers.getSetCookie() };
}
const SAME = { Origin: B }, EVIL = { Origin: 'https://evil.example' };

const srv = await start(ROOT, PORT);
try {
  section('Origin (CSRF, difesa in profondità)');
  ok((await call('POST', '/api/auth?action=login', { body: { username: USER, password: PASS }, headers: EVIL })).status === 403, 'login da altra origine → 403');
  ok((await call('POST', '/api/auth?action=login', { body: { username: USER, password: PASS }, headers: { Origin: 'null' } })).status === 403, 'login con Origin: null → 403');
  const lg = await call('POST', '/api/auth?action=login', { body: { username: USER, password: PASS }, headers: SAME });
  ok(lg.status === 200, 'login dalla stessa origine → 200', lg.status);
  const cookie = (lg.setCookie.find((c) => c.startsWith('magix_session=')) || '').split(';')[0];
  ok(!!cookie, 'cookie di sessione ricevuto');
  ok((await call('POST', '/api/auth?action=login', { body: { username: USER, password: PASS } })).status === 200, 'login senza Origin (client non browser) → 200');
  ok((await call('POST', '/api/news', { cookie, body: { titolo: 'csrf' }, headers: EVIL })).status === 403, 'POST news con sessione ma da altra origine → 403');
  ok((await call('PUT', '/api/settings', { cookie, body: { homeFeatured: { mode: 'random' } }, headers: EVIL })).status === 403, 'PUT settings da altra origine → 403');
  ok((await call('DELETE', '/api/catalog', { cookie, body: { kind: 'category', key: 'linea bio' }, headers: EVIL })).status === 403, 'DELETE catalogo da altra origine → 403');
  ok((await call('POST', '/api/upload', { cookie, body: { type: 'blob.generate-client-token', payload: { pathname: 'a.png' } }, headers: EVIL })).status === 403, 'upload da altra origine → 403');
  ok((await call('POST', '/api/upload', { cookie, body: { type: 'blob.generate-client-token', payload: { pathname: 'a.png' } }, headers: SAME })).status === 200, 'upload dalla stessa origine → 200');
  ok((await call('POST', '/api/auth?action=logout', { cookie, headers: EVIL })).status === 403, 'logout da altra origine → 403 (sessione non toccata)');
  ok((await call('GET', '/api/trips', { cookie, headers: EVIL })).status === 200, 'GET (lettura) non soggetta al controllo Origin');
  ok((await call('POST', '/api/positions', { cookie, body: { titolo: 'ok' }, headers: { Origin: 'https://www.magix.it', 'X-Forwarded-Host': 'www.magix.it' } })).status === 201, 'Origin uguale a X-Forwarded-Host (dietro proxy) → consentito');
  ok((await call('POST', '/api/positions', { cookie, body: { titolo: 'x' }, headers: { Origin: 'http://localhost:9999' } })).status === 403, 'stesso host ma porta diversa → 403');

  section('URL ammessi (niente javascript:/data:)');
  const n1 = await call('POST', '/api/news', { cookie, body: { titolo: 'xss', img: 'javascript:alert(1)' }, headers: SAME });
  ok(n1.status === 201 && n1.json.img === '', 'news: img "javascript:" scartata', n1.json);
  const n2 = await call('POST', '/api/news', { cookie, body: { titolo: 'ok', img: 'https://abc.public.blob.vercel-storage.com/a.webp' }, headers: SAME });
  ok(n2.json.img === 'https://abc.public.blob.vercel-storage.com/a.webp', 'news: img https conservata');
  const d1 = await call('POST', '/api/documents', { cookie, body: { nome: 'x', url: 'java\tscript:alert(1)' }, headers: SAME });
  ok(d1.json.url === '', 'documento: url "java<TAB>script:" scartato', d1.json);
  const d2 = await call('POST', '/api/documents', { cookie, body: { nome: 'y', url: '/documents/Catalogo%20Magix%20srl_.pdf' }, headers: SAME });
  ok(d2.json.url === '/documents/Catalogo%20Magix%20srl_.pdf', 'documento: percorso del sito conservato');
  const p1 = await call('POST', '/api/catalog', { cookie, body: { kind: 'product', catKey: 'linea bio', product: { code: 'T-XSS', name: 'Prova', img: 'data:text/html,<script>alert(1)</script>', spec: { Resa: '1' } } }, headers: SAME });
  ok(p1.status === 201 && !('img' in p1.json.product) && p1.json.product.spec.Resa === '1', 'prodotto: img "data:" tolta, altri campi della scheda conservati', p1.json);
  const p2 = await call('PUT', '/api/catalog', { cookie, body: { kind: 'product', catKey: 'linea bio', code: 'T-XSS', product: { code: 'T-XSS', name: 'Prova', img: 'img/img_prd/MT01.png' } }, headers: SAME });
  ok(p2.status === 200 && p2.json.product.img === 'img/img_prd/MT01.png', 'prodotto: img del sito conservata');
  ok((await call('POST', '/api/catalog', { cookie, body: { kind: 'product', catKey: 'linea bio', product: 'abc' }, headers: SAME })).status === 400, 'prodotto non oggetto → 400');

  section('Chiavi riservate (prototype pollution)');
  ok((await call('POST', '/api/catalog', { cookie, body: { kind: 'category', key: '__proto__', label: 'x' }, headers: SAME })).status === 400, 'categoria "__proto__" → 400');
  ok((await call('PUT', '/api/catalog', { cookie, body: { kind: 'category', key: 'nuova', oldKey: 'constructor', label: 'x' }, headers: SAME })).status === 400, 'oldKey "constructor" → 400');
  const pp = await call('POST', '/api/catalog', { cookie, body: { kind: 'product', catKey: '__proto__', product: { code: 'Z', name: 'Z' } }, headers: SAME });
  ok(pp.status === 400 && ({}).products === undefined, 'prodotto in "__proto__" → 400 e Object.prototype intatto', pp.status);
  ok((await call('POST', '/api/catalog', { cookie, body: { kind: 'product', catKey: 'toString', product: { code: 'Z', name: 'Z' } }, headers: SAME })).status === 400, 'catKey "toString" (proprietà ereditata) → 400');

  section('DELETE senza id');
  const before = (await call('GET', '/api/positions')).json.length;
  ok((await call('DELETE', '/api/positions', { cookie, body: {}, headers: SAME })).status === 400, 'DELETE senza id → 400');
  ok((await call('GET', '/api/positions')).json.length === before, 'nessun elemento cancellato');

  section('Cache-Control delle API');
  for (const p of ['/api/catalog', '/api/news', '/api/documents', '/api/positions', '/api/settings']) {
    const r = await call('GET', p);
    ok(r.status === 200 && /no-store/.test(r.headers.get('cache-control') || ''), p + ' → no-store', r.headers.get('cache-control'));
  }
  ok(/no-store/.test((await call('GET', '/api/trips', { cookie })).headers.get('cache-control') || ''), '/api/trips → no-store');

  section('geo: validazione input');
  ok((await call('GET', '/api/geo?action=autocomplete&q=' + 'a'.repeat(201), { cookie })).status === 400, 'indirizzo > 200 caratteri → 400');
  ok((await call('GET', '/api/geo?action=route&from=95,10&to=41,16', { cookie })).status === 400, 'latitudine fuori intervallo → 400');
  ok((await call('GET', '/api/geo?action=route&from=41,190&to=41,16', { cookie })).status === 400, 'longitudine fuori intervallo → 400');

  section('Header di sicurezza (vercel.json)');
  for (const p of ['/', '/admin']) {
    const r = await fetch(B + p);
    const csp = r.headers.get('content-security-policy') || '';
    ok(/default-src 'self'/.test(csp) && /frame-ancestors 'none'/.test(csp) && !/script-src[^;]*'unsafe-inline'/.test(csp), p + ': CSP senza script inline', csp.slice(0, 80));
    ok(r.headers.get('x-frame-options') === 'DENY', p + ': X-Frame-Options DENY');
    ok(r.headers.get('x-content-type-options') === 'nosniff', p + ': nosniff');
    ok(!!r.headers.get('referrer-policy') && !!r.headers.get('permissions-policy'), p + ': Referrer-Policy e Permissions-Policy');
  }
  ok(/noindex/.test((await fetch(B + '/admin')).headers.get('x-robots-tag') || ''), '/admin: noindex');
  ok(/noindex/.test((await fetch(B + '/api/catalog')).headers.get('x-robots-tag') || ''), '/api/*: noindex');
  ok(/max-age=86400/.test((await fetch(B + '/img/logo.png')).headers.get('cache-control') || ''), '/img: cache 1 giorno');
  ok(/immutable/.test((await fetch(B + '/fonts/hankengrotesk-v12-latin.woff2')).headers.get('cache-control') || ''), '/fonts: cache immutabile');
} finally { srv.close(); }
console.log(`\n${pass} ok, ${fail} falliti`);
process.exit(fail ? 1 : 0);
