// Test HTTP dell'autenticazione contro i veri handler api/*.js (Blob in memoria).
import crypto from 'node:crypto';
import { start, BLOBS, blobCtl } from './testsrv.mjs';

const ROOT = null; // si testa sempre questo repo (vedi testsrv.mjs)
const PORT = 4610;
const B = `http://localhost:${PORT}`;
const USER = 'Admin@Magix.it', PASS = 'Corretta-Password-2026!';
const SECRET = crypto.randomBytes(32).toString('hex');
Object.assign(process.env, { ADMIN_USERNAME: USER, ADMIN_PASSWORD: PASS, AUTH_SECRET: SECRET, BLOB_READ_WRITE_TOKEN: 'fake', ADMIN_BYPASS: '1' });

let pass = 0, fail = 0;
const ok = (cond, label, extra) => { if (cond) { pass++; console.log('  ✔', label); } else { fail++; console.log('  ✘', label, extra !== undefined ? JSON.stringify(extra) : ''); } };
const section = (t) => console.log('\n■ ' + t);

async function call(method, path, { body, cookie, raw } = {}) {
  const headers = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (cookie) headers.Cookie = cookie;
  const t0 = Date.now();
  const r = await fetch(B + path, { method, headers, body: body !== undefined ? (raw ? body : JSON.stringify(body)) : undefined });
  const text = await r.text();
  let json = null; try { json = JSON.parse(text); } catch {}
  return { status: r.status, json, text, ms: Date.now() - t0, setCookie: r.headers.getSetCookie(), headers: r.headers };
}
const cookieOf = (r) => { const c = (r.setCookie || []).find((x) => x.startsWith('magix_session=')); return c ? c.split(';')[0] : null; };
const login = (username, password) => call('POST', '/api/auth?action=login', { body: { username, password } });

// richieste riservate: [metodo, path, body]
const PROTECTED = [
  ['GET', '/api/trips'],
  ['POST', '/api/trips', { data: '2026-10-04', partenza: 'A', arrivo: 'B', km: 10 }],
  ['PUT', '/api/trips', { id: 'x' }],
  ['DELETE', '/api/trips', { id: 'x' }],
  ['POST', '/api/catalog', { kind: 'category', key: 'test-cat', label: 'Test' }],
  ['PUT', '/api/catalog', { kind: 'category', key: 'test-cat', label: 'Test' }],
  ['DELETE', '/api/catalog', { kind: 'category', key: 'test-cat' }],
  ['POST', '/api/news', { titolo: 'x' }],
  ['PUT', '/api/news', { id: 'x' }],
  ['DELETE', '/api/news', { id: 'x' }],
  ['POST', '/api/documents', { nome: 'x' }],
  ['PUT', '/api/documents', { id: 'x' }],
  ['DELETE', '/api/documents', { id: 'x' }],
  ['POST', '/api/positions', { titolo: 'x' }],
  ['PUT', '/api/positions', { id: 'x' }],
  ['DELETE', '/api/positions', { id: 'x' }],
  ['PUT', '/api/settings', { homeFeatured: { mode: 'random' } }],
  ['GET', '/api/geo?action=nope'],
];
const uploadReq = (cookie) => call('POST', '/api/upload', { cookie, body: { type: 'blob.generate-client-token', payload: { pathname: 'x.png' } } });

const srv = await start(ROOT, PORT);
try {
  // storico trasferte "vecchio": file pubblico a path fisso, da migrare
  BLOBS.set('magix-data/trips.json', { url: `http://localhost:${blobCtl.port}/magix-data/trips.json`, pathname: 'magix-data/trips.json', uploadedAt: new Date(1), body: JSON.stringify([{ id: 'legacy-1', partenza: 'Gravina', arrivo: 'Bari', km: 60 }]) });

  section('Login: credenziali errate / malformate (ADMIN_BYPASS=1 impostato apposta)');
  let r = await call('GET', '/api/auth?action=me');
  ok(r.status === 200 && r.json.authed === false && !('bypass' in r.json), 'me senza cookie → authed:false (nessun campo bypass)', r.json);
  ok(r.headers.get('cache-control') === 'no-store', 'risposte auth con Cache-Control: no-store');
  r = await call('GET', '/api/auth?action=login');
  ok(r.status === 405, 'login via GET → 405', r.status);
  r = await login(USER, 'sbagliata');
  ok(r.status === 401 && !cookieOf(r), 'password errata → 401, nessun cookie', r.status);
  ok(r.ms >= 700, 'risposta ritardata sul fallimento (' + r.ms + ' ms)');
  r = await login('altro@magix.it', PASS);
  ok(r.status === 401 && !cookieOf(r), 'username errato → 401', r.status);
  r = await call('POST', '/api/auth?action=login', { body: { password: PASS } });
  ok(r.status === 401 && !cookieOf(r), 'solo password (vecchio client a passphrase) → 401', r.status);
  r = await call('POST', '/api/auth?action=login', { body: {} });
  ok(r.status === 401 && !cookieOf(r), 'body vuoto → 401 (il bypass non apre più nulla)', r.status);
  r = await call('POST', '/api/auth?action=login', { body: { username: ['x'], password: { a: 1 } } });
  ok(r.status === 401, 'tipi non stringa → 401', r.status);
  r = await login(USER, PASS + ' ');
  ok(r.status === 401, 'password con spazio in più → 401', r.status);

  section('Senza sessione: tutte le API riservate negate');
  for (const [m, p, b] of PROTECTED) {
    r = await call(m, p, { body: b });
    ok(r.status === 401, `${m} ${p} senza cookie → 401`, r.status);
  }
  r = await uploadReq();
  ok(r.status === 400 && r.json.error === 'Non autorizzato' && !r.json.clientToken, 'upload senza cookie → nessun token', r.json);

  section('Login corretto');
  r = await login('  admin@magix.it ', PASS);
  const c1 = cookieOf(r);
  ok(r.status === 200 && !!c1, 'username case-insensitive + password giusta → 200 con cookie', r.status);
  const sc = (r.setCookie || [])[0] || '';
  ok(/HttpOnly/.test(sc) && /Secure/.test(sc) && /SameSite=Strict/.test(sc) && /Path=\//.test(sc) && /Max-Age=43200/.test(sc), 'cookie HttpOnly; Secure; SameSite=Strict; Path=/; 12h', sc);
  r = await call('GET', '/api/auth?action=me', { cookie: c1 });
  ok(r.json && r.json.authed === true, 'me con cookie → authed:true', r.json);
  const sessBlobs = [...BLOBS.keys()].filter((k) => k.startsWith('magix-private/sessions/'));
  ok(sessBlobs.length === 1 && /sessions-[A-Za-z0-9]{30}\.json$/.test(sessBlobs[0]), 'registro sessioni su path privato con suffisso casuale', sessBlobs);
  const reg = JSON.parse(BLOBS.get(sessBlobs[0]).body);
  const sid = JSON.parse(Buffer.from(c1.split('=')[1].split('.')[0], 'base64url')).sid;
  ok(!JSON.stringify(reg).includes(sid), 'nel registro solo l\'hash dell\'id sessione, non l\'id');

  section('Con sessione: le API riservate rispondono');
  for (const [m, p, b] of PROTECTED) {
    r = await call(m, p, { body: b, cookie: c1 });
    ok(r.status !== 401 && r.status < 500, `${m} ${p} con cookie → ${r.status}`, r.json);
  }
  r = await uploadReq(c1);
  ok(r.status === 200 && r.json.clientToken, 'upload con cookie → token generato', r.json);

  section('Storico trasferte: migrazione dal vecchio file pubblico + path non indovinabile');
  r = await call('GET', '/api/trips', { cookie: c1 });
  ok(Array.isArray(r.json) && r.json.some((t) => t.id === 'legacy-1'), 'i dati del vecchio magix-data/trips.json sono conservati', r.json);
  ok(!BLOBS.has('magix-data/trips.json'), 'il vecchio file pubblico a path fisso è stato eliminato');
  r = await fetch(`http://localhost:${blobCtl.port}/magix-data/trips.json`);
  ok(r.status === 404, 'URL deducibile magix-data/trips.json → 404 dall\'esterno', r.status);
  await call('POST', '/api/trips', { cookie: c1, body: { data: '2026-10-05', partenza: 'C', arrivo: 'D', km: 5 } });
  const tripBlobs = [...BLOBS.keys()].filter((k) => k.startsWith('magix-private/trips/'));
  ok(tripBlobs.length === 1, 'una sola versione privata tenuta dopo più scritture', tripBlobs);
  r = await call('GET', '/api/trips', { cookie: c1 });
  ok(r.json.length >= 3 && r.json.some((t) => t.id === 'legacy-1'), 'storico completo dopo scritture successive (' + r.json.length + ')');

  section('Bozze: escluse dalle GET pubbliche');
  await call('POST', '/api/catalog', { cookie: c1, body: { kind: 'category', key: 'zz-test', label: 'ZZ test' } });
  await call('POST', '/api/catalog', { cookie: c1, body: { kind: 'product', catKey: 'zz-test', product: { code: 'BOZZA-1', name: 'Prodotto in bozza', stato: 'bozza' } } });
  await call('POST', '/api/catalog', { cookie: c1, body: { kind: 'product', catKey: 'zz-test', product: { code: 'PUB-1', name: 'Prodotto pubblicato', stato: 'pubblicato' } } });
  await call('POST', '/api/news', { cookie: c1, body: { titolo: 'News in bozza', stato: 'bozza' } });
  r = await call('GET', '/api/catalog');
  const pubCodes = (r.json['zz-test'].products || []).map((p) => p.code);
  ok(pubCodes.includes('PUB-1') && !pubCodes.includes('BOZZA-1'), 'catalogo pubblico: niente prodotti in bozza', pubCodes);
  r = await call('GET', '/api/catalog', { cookie: c1 });
  ok(r.json['zz-test'].products.some((p) => p.code === 'BOZZA-1'), 'catalogo con sessione: bozze presenti');
  r = await call('GET', '/api/news');
  ok(!r.json.some((n) => n.titolo === 'News in bozza') && r.json.length > 0, 'news pubbliche: niente bozze (' + r.json.length + ' pubblicate)');
  r = await call('GET', '/api/news', { cookie: c1 });
  ok(r.json.some((n) => n.titolo === 'News in bozza'), 'news con sessione: bozze presenti');

  section('Cookie falsificati o del vecchio formato');
  const [nm, tok] = c1.split('=');
  const [pl, sg] = tok.split('.');
  const flip = (s) => s.slice(0, -1) + (s.slice(-1) === 'A' ? 'B' : 'A');
  const cases = {
    'firma alterata': `${nm}=${pl}.${flip(sg)}`,
    'payload alterato (exp allungata) con firma originale': `${nm}=${Buffer.from(JSON.stringify({ sid, exp: Date.now() + 9e9 })).toString('base64url')}.${sg}`,
    'vecchio formato {exp} firmato con AUTH_SECRET': (() => { const p = Buffer.from(JSON.stringify({ exp: Date.now() + 9e6 })).toString('base64url'); return `${nm}=${p}.${crypto.createHmac('sha256', SECRET).update(p).digest('base64url')}`; })(),
    'vecchio bypass (DEV_SECRET)': (() => { const p = Buffer.from(JSON.stringify({ exp: Date.now() + 9e6 })).toString('base64url'); return `${nm}=${p}.${crypto.createHmac('sha256', 'magix-dev-bypass-secret-NON-PER-PRODUZIONE').update(p).digest('base64url')}`; })(),
    'spazzatura': `${nm}=abc.def`,
    'firma con caratteri multibyte': `${nm}=${pl}.${'é'.repeat(43)}`,
  };
  for (const [label, ck] of Object.entries(cases)) {
    r = await call('GET', '/api/auth?action=me', { cookie: ck });
    const w = await call('POST', '/api/news', { cookie: ck, body: { titolo: 'hack' } });
    ok(r.status === 200 && r.json.authed === false && w.status === 401, label + ' → negato', [r.status, r.json, w.status]);
  }
  r = await call('GET', '/api/catalog', { cookie: 'magix_session=%E0%A4%A; foo=%' });
  ok(r.status === 200, 'cookie con escape malformato: la GET pubblica non va in errore', r.status);
  // sessione con firma valida ma assente dal registro (es. forgiata da chi conosce il segreto ma non passa dal login)
  r = await call('GET', '/api/auth?action=me', { cookie: c1 });
  ok(r.json.authed === true, 'la sessione originale resta valida');

  section('Più dispositivi e logout');
  r = await login(USER, PASS);
  const c2 = cookieOf(r);
  r = await call('GET', '/api/auth?action=logout');
  ok(r.status === 405, 'logout via GET → 405', r.status);
  r = await call('POST', '/api/auth?action=logout', { cookie: c1, body: {} });
  ok(r.status === 200 && /magix_session=;/.test(r.setCookie[0] || '') && /Max-Age=0/.test(r.setCookie[0] || ''), 'logout → 200 e cookie cancellato', r.setCookie);
  r = await call('GET', '/api/auth?action=me', { cookie: c1 });
  ok(r.json.authed === false, 'vecchio cookie riusato dopo il logout → authed:false', r.json);
  for (const [m, p, b] of [['GET', '/api/trips'], ['POST', '/api/news', { titolo: 'x' }], ['PUT', '/api/settings', { homeFeatured: {} }], ['GET', '/api/geo?action=nope']]) {
    r = await call(m, p, { body: b, cookie: c1 });
    ok(r.status === 401, `vecchio cookie dopo logout: ${m} ${p} → 401`, r.status);
  }
  r = await uploadReq(c1);
  ok(!r.json.clientToken, 'vecchio cookie dopo logout: nessun token di upload');
  r = await call('GET', '/api/catalog', { cookie: c1 });
  ok(!r.json['zz-test'].products.some((p) => p.code === 'BOZZA-1'), 'vecchio cookie dopo logout: niente bozze');
  r = await call('GET', '/api/auth?action=me', { cookie: c2 });
  ok(r.json.authed === true, 'il logout di un dispositivo non chiude l\'altro');
  r = await call('POST', '/api/auth?action=logout', { body: {} });
  ok(r.status === 200, 'logout senza cookie → 200 (idempotente)', r.status);

  section('Scadenza e invalidazione per cambio credenziali');
  const regKey = [...BLOBS.keys()].find((k) => k.startsWith('magix-private/sessions/'));
  const regObj = JSON.parse(BLOBS.get(regKey).body);
  for (const k of Object.keys(regObj)) regObj[k] = Date.now() - 1000;
  BLOBS.get(regKey).body = JSON.stringify(regObj);
  r = await call('GET', '/api/auth?action=me', { cookie: c2 });
  ok(r.json.authed === false, 'sessione scaduta nel registro → negata', r.json);
  r = await login(USER, PASS); const c3 = cookieOf(r);
  process.env.ADMIN_PASSWORD = 'Nuova-Password-2026!';
  r = await call('GET', '/api/auth?action=me', { cookie: c3 });
  ok(r.json.authed === false, 'cambio password → sessioni esistenti invalidate', r.json);
  r = await login(USER, PASS);
  ok(r.status === 401, 'vecchia password non più valida', r.status);
  process.env.ADMIN_PASSWORD = PASS;

  section('Password come hash scrypt');
  const salt = crypto.randomBytes(16);
  process.env.ADMIN_PASSWORD = 'scrypt:' + salt.toString('hex') + ':' + crypto.scryptSync('Hash-Pass-2026', salt, 64).toString('hex');
  r = await login(USER, 'Hash-Pass-2026');
  ok(r.status === 200 && cookieOf(r), 'hash scrypt: password giusta → 200', r.status);
  r = await login(USER, 'Hash-Pass-2025');
  ok(r.status === 401, 'hash scrypt: password errata → 401', r.status);
  r = await login(USER, process.env.ADMIN_PASSWORD);
  ok(r.status === 401, 'hash scrypt: inviare l\'hash stesso come password → 401', r.status);
  process.env.ADMIN_PASSWORD = 'scrypt:zz:00';
  r = await login(USER, 'x');
  ok(r.status === 500, 'hash scrypt malformato → 500 (chiuso)', r.status);
  process.env.ADMIN_PASSWORD = PASS;

  section('Configurazione mancante o debole → area chiusa (con ADMIN_BYPASS=1)');
  const envCases = {
    'ADMIN_PASSWORD assente': { ADMIN_PASSWORD: '' },
    'ADMIN_USERNAME assente': { ADMIN_USERNAME: '' },
    'AUTH_SECRET assente': { AUTH_SECRET: '' },
    'AUTH_SECRET corto': { AUTH_SECRET: 'corto' },
    'password d\'esempio di .env.example': { ADMIN_PASSWORD: 'cambia-questa-password' },
    'segreto d\'esempio di .env.example': { AUTH_SECRET: 'cambia-questo-segreto-lungo-e-casuale' },
  };
  r = await login(USER, PASS); const c4 = cookieOf(r);
  for (const [label, env] of Object.entries(envCases)) {
    const saved = {}; for (const k of Object.keys(env)) { saved[k] = process.env[k]; process.env[k] = env[k]; }
    const lr = await login(USER, env.ADMIN_PASSWORD || PASS);
    const me = await call('GET', '/api/auth?action=me', { cookie: c4 });
    const w = await call('POST', '/api/news', { cookie: c4, body: { titolo: 'x' } });
    ok(lr.status === 500 && !cookieOf(lr) && me.json.authed === false && w.status === 401, label + ' → login 500, sessioni non valide', [lr.status, me.json, w.status]);
    Object.assign(process.env, saved);
  }

  section('Blob irraggiungibile → chiuso, non aperto');
  blobCtl.fail = true;
  r = await call('GET', '/api/auth?action=me', { cookie: c4 });
  ok(r.json.authed === false, 'registro sessioni illeggibile → authed:false', r.json);
  r = await call('POST', '/api/news', { cookie: c4, body: { titolo: 'x' } });
  ok(r.status === 401, 'registro illeggibile → scritture 401', r.status);
  r = await login(USER, PASS);
  ok(r.status === 503 && !cookieOf(r), 'login con Blob giù → 503, nessun cookie', r.status);
  r = await call('POST', '/api/auth?action=logout', { cookie: c4, body: {} });
  ok(r.status === 503 && !(r.setCookie || []).length, 'logout con Blob giù → 503 e cookie NON cancellato (si può riprovare)', [r.status, r.setCookie]);
  r = await call('GET', '/api/catalog');
  ok(r.status === 200 && Object.keys(r.json).length > 0, 'sito pubblico: catalogo dal seed anche con Blob giù');
  blobCtl.fail = false;
  r = await call('GET', '/api/auth?action=me', { cookie: c4 });
  ok(r.json.authed === true, 'Blob tornato su → la sessione non revocata vale di nuovo');

  section('Pagine');
  r = await call('GET', '/admin');
  ok(r.status === 200 && r.text.includes('id="adminLoginForm"') && r.headers.get('x-robots-tag') === 'noindex, nofollow', '/admin → index.html con X-Robots-Tag noindex', [r.status, r.headers.get('x-robots-tag')]);
  r = await call('GET', '/');
  ok(r.status === 200 && (r.text.match(/data-view="cookie"/g) || []).length >= 10, 'index.html servito, footer con link Cookie Policy presenti', r.status);
  const pub = r.text.replace(/<section id="view-admin"[\s\S]*?<\/section>/, '');
  ok(pub.length < r.text.length && !pub.includes('data-view="admin"') && !/riservat|\/admin\b/i.test(pub.replace(/<!--[\s\S]*?-->/g, '')), 'index.html fuori dalla view admin: nessun link/testo verso l\'area riservata');
  ok(/<div id="adminLogin" class="fixed/.test(r.text) && /<div id="adminShell" class="hidden/.test(r.text), 'login visibile e pannello nascosto di default');
  r = await call('GET', '/api/_lib/auth.js');
  ok(r.status === 404, 'sorgenti api/_lib non serviti', r.status);
} finally {
  srv.close();
  console.log(`\n${pass} ok, ${fail} falliti`);
  process.exitCode = fail ? 1 : 0;
}
