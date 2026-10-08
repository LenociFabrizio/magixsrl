// ─────────────────────────────────────────────────────────────────────────
// Server Node per l'hosting fuori da Vercel (Hostinger, app web Node.js).
// Fa quello che su Vercel fanno la piattaforma e vercel.json:
//  • esegue gli handler api/*.js INVARIATI, con un adattatore in stile Vercel
//    (req.query, req.body, res.status().json());
//  • serve SOLO i file statici dell'elenco qui sotto: sorgenti delle API,
//    package.json, docs/, README, .env e .git non sono mai raggiungibili;
//  • replica rewrite /admin, cleanUrls, trailingSlash, cache e header di sicurezza.
// Lo storage resta Vercel Blob (BLOB_READ_WRITE_TOKEN nelle variabili d'ambiente).
// Solo moduli di Node: nessuna dipendenza oltre a @vercel/blob usato dalle API.
// ─────────────────────────────────────────────────────────────────────────
"use strict";

const http = require("http");
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const ROOT = __dirname;
const PORT = Number(process.env.PORT) || 3000;
const MAX_BODY = 1024 * 1024; // 1 MB: le API ricevono solo JSON piccoli (gli upload vanno diretti al Blob)

// ── API ammesse (nomi dei file in api/) ──
const API = ["auth", "catalog", "news", "documents", "positions", "settings", "trips", "geo", "upload"];

// ── File statici pubblicabili: tutto il resto risponde 404 ──
const STATIC_FILES = ["/index.html", "/script.js", "/styles.css", "/catalog-data.js", "/tailwind-config.js", "/fonts.css", "/favicon.ico"];
const STATIC_DIRS = ["/img/", "/documents/", "/fonts/", "/vendor/"];

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
  ".pdf": "application/pdf",
  ".woff2": "font/woff2",
};
const COMPRESSIBLE = /^(text\/|application\/json|image\/svg)/;

// ── Header di sicurezza: stessi valori di vercel.json (tenerli allineati) ──
const SECURITY_HEADERS = {
  "Content-Security-Policy": "default-src 'self'; script-src 'self' https://esm.sh; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://*.public.blob.vercel-storage.com; font-src 'self'; connect-src 'self' https://blob.vercel-storage.com; frame-src https://www.google.com; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests",
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  "Cross-Origin-Opener-Policy": "same-origin",
  // su Vercel lo aggiunge la piattaforma
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains",
};
const NOINDEX = "noindex, nofollow";

// s-maxage: durata per la CDN di Hostinger (hcdn), che senza un valore esplicito non tiene copie
function cacheControl(p) {
  if (p.startsWith("/fonts/") || p.startsWith("/vendor/")) return "public, max-age=31536000, s-maxage=31536000, immutable";
  if (p.startsWith("/img/") || p.startsWith("/documents/")) return "public, max-age=86400, s-maxage=604800, stale-while-revalidate=604800";
  // html/js/css: i nomi non hanno hash, il browser deve sempre ricontrollare
  return "public, max-age=0, must-revalidate";
}

// ── Adattatore in stile Vercel per gli handler ──
const handlers = {};
function loadHandler(name) {
  if (!handlers[name]) handlers[name] = require(path.join(ROOT, "api", name + ".js"));
  return handlers[name];
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on("data", (c) => {
      size += c.length;
      if (size > MAX_BODY) { reject(Object.assign(new Error("body troppo grande"), { status: 413 })); req.destroy(); return; }
      chunks.push(c);
    });
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

function sendJson(res, code, obj) {
  if (res.headersSent) return res.end();
  res.statusCode = code;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(obj));
}

// ── Cache in memoria delle GET pubbliche ──
// Ogni GET pubblica legge dal Blob (list + fetch, 300-800 ms): qui si tiene l'ultima
// risposta di ogni API pubblica e la si serve subito. Oltre FRESH_MS la si serve
// comunque e la si rilegge dal Blob in background (stale-while-revalidate).
// Mai per chi ha il cookie di sessione: l'area riservata legge sempre dal Blob (bozze
// comprese). Ogni scrittura svuota la cache del processo; gli altri processi Node si
// riallineano entro FRESH_MS.
const CACHED_API = ["catalog", "news", "documents", "positions", "settings"];
const FRESH_MS = 30 * 1000;
const apiCache = new Map(); // "nome?query" -> { status, headers, body, ts }
const refreshing = new Map(); // "nome?query" -> Promise in corso
let cacheGen = 0; // cambia a ogni scrittura: un refresh partito prima non salva dati vecchi

const hasSession = (req) => /(?:^|;\s*)magix_session=/.test(String(req.headers.cookie || ""));

// esegue l'handler su una risposta "finta" e ne restituisce stato, header e corpo
async function captureHandler(name, query) {
  const out = { status: 200, headers: {}, body: "" };
  const req = { method: "GET", url: "/api/" + name, headers: {}, query, body: undefined };
  const res = {
    statusCode: 200,
    headersSent: false,
    setHeader(k, v) { out.headers[k] = v; },
    getHeader(k) { return out.headers[k]; },
    status(code) { this.statusCode = code; return this; },
    json(obj) { out.status = this.statusCode; out.headers["Content-Type"] = "application/json; charset=utf-8"; out.body = JSON.stringify(obj); this.headersSent = true; return this; },
    end(data) { out.status = this.statusCode; if (data != null) out.body = String(data); this.headersSent = true; },
  };
  await loadHandler(name)(req, res);
  return out;
}

function refreshApi(name, search, query) {
  const key = name + search;
  if (refreshing.has(key)) return refreshing.get(key);
  const gen = cacheGen;
  const p = captureHandler(name, query)
    .then((out) => {
      // solo risposte riuscite, e solo se nel frattempo nessuno ha scritto
      if (out.status === 200 && gen === cacheGen) apiCache.set(key, Object.assign(out, { ts: Date.now() }));
      return out;
    })
    .finally(() => refreshing.delete(key));
  refreshing.set(key, p);
  return p;
}

function sendCaptured(res, out, state) {
  res.statusCode = out.status;
  for (const k in out.headers) res.setHeader(k, out.headers[k]);
  res.setHeader("X-Magix-Cache", state);
  res.end(out.body);
}

async function handleCachedGet(name, url, req, res) {
  const key = name + url.search;
  const query = Object.fromEntries(url.searchParams);
  const hit = apiCache.get(key);
  if (hit) {
    if (Date.now() - hit.ts > FRESH_MS) refreshApi(name, url.search, query).catch((e) => console.error("[cache/" + name + "]", e));
    return sendCaptured(res, hit, Date.now() - hit.ts > FRESH_MS ? "STALE" : "HIT");
  }
  return sendCaptured(res, await refreshApi(name, url.search, query), "MISS");
}

function invalidateApiCache() {
  cacheGen++;
  apiCache.clear();
}

// all'avvio del processo: carica handler e @vercel/blob e riempie la cache,
// così il primo visitatore non paga l'avvio a freddo
function warmUp() {
  for (const name of API) {
    try { loadHandler(name); } catch (e) { console.error("[warmup/" + name + "]", e); }
  }
  for (const name of CACHED_API) refreshApi(name, "", {}).catch((e) => console.error("[warmup/" + name + "]", e));
}

async function handleApi(name, url, req, res) {
  res.setHeader("X-Robots-Tag", NOINDEX);
  if (req.method === "GET" && CACHED_API.includes(name) && !hasSession(req)) {
    try { return await handleCachedGet(name, url, req, res); }
    catch (e) {
      console.error("[api/" + name + "]", e);
      return sendJson(res, 500, { error: "Errore interno" });
    }
  }
  // le scritture cambiano i contenuti pubblici: la cache si svuota a fine richiesta
  if (req.method !== "GET" && req.method !== "HEAD" && CACHED_API.includes(name)) res.on("finish", invalidateApiCache);

  let raw;
  try { raw = await readBody(req); }
  catch (e) { return sendJson(res, e.status || 400, { error: e.status === 413 ? "Richiesta troppo grande" : "Richiesta non valida" }); }

  req.query = Object.fromEntries(url.searchParams);
  const type = String(req.headers["content-type"] || "");
  if (!raw.length) req.body = undefined;
  else if (type.includes("json")) {
    try { req.body = JSON.parse(raw.toString("utf8")); }
    catch { return sendJson(res, 400, { error: "JSON non valido" }); }
  } else req.body = raw.toString("utf8");

  res.status = (code) => { res.statusCode = code; return res; };
  res.json = (obj) => { sendJson(res, res.statusCode || 200, obj); return res; };

  try {
    await loadHandler(name)(req, res);
  } catch (e) {
    console.error("[api/" + name + "]", e);
    sendJson(res, 500, { error: "Errore interno" });
  }
}

// ── File statici ──
function isAllowed(p) {
  return STATIC_FILES.includes(p) || STATIC_DIRS.some((d) => p.startsWith(d) && p.length > d.length);
}

function serveStatic(p, req, res, extraHeaders) {
  // p è già decodificato e normalizzato: si ricontrolla comunque che resti nella radice
  const file = path.resolve(ROOT, "." + p);
  if (!file.startsWith(ROOT + path.sep)) return notFound(res);
  fs.stat(file, (err, st) => {
    if (err || !st.isFile()) return notFound(res);
    const type = MIME[path.extname(file).toLowerCase()] || "application/octet-stream";
    const etag = 'W/"' + st.size.toString(16) + "-" + Math.floor(st.mtimeMs).toString(16) + '"';
    res.setHeader("Content-Type", type);
    res.setHeader("Cache-Control", cacheControl(p));
    res.setHeader("ETag", etag);
    res.setHeader("Last-Modified", st.mtime.toUTCString());
    for (const k in extraHeaders || {}) res.setHeader(k, extraHeaders[k]);

    const inm = req.headers["if-none-match"];
    const ims = req.headers["if-modified-since"];
    if ((inm && inm === etag) || (!inm && ims && Date.parse(ims) >= Math.floor(st.mtimeMs / 1000) * 1000)) {
      res.statusCode = 304;
      return res.end();
    }

    const gzip = COMPRESSIBLE.test(type) && st.size > 1024 && /\bgzip\b/.test(String(req.headers["accept-encoding"] || ""));
    if (COMPRESSIBLE.test(type)) res.setHeader("Vary", "Accept-Encoding");
    if (gzip) res.setHeader("Content-Encoding", "gzip");
    else res.setHeader("Content-Length", st.size);
    res.statusCode = 200;
    if (req.method === "HEAD") return res.end();

    const stream = fs.createReadStream(file);
    stream.on("error", () => res.destroy());
    if (gzip) stream.pipe(zlib.createGzip({ level: 6 })).pipe(res);
    else stream.pipe(res);
  });
}

function notFound(res) {
  res.statusCode = 404;
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end("Pagina non trovata");
}

function redirect(res, code, location) {
  res.statusCode = code;
  res.setHeader("Location", location);
  res.end();
}

// ── Router ──
async function route(req, res) {
  for (const k in SECURITY_HEADERS) res.setHeader(k, SECURITY_HEADERS[k]);

  const url = new URL(req.url, "http://localhost");
  let p;
  try { p = decodeURIComponent(url.pathname); } catch { return notFound(res); }
  // percorsi con "..", backslash o caratteri di controllo non sono mai legittimi
  if (p.includes("\0") || p.includes("\\") || p.split("/").includes("..")) return notFound(res);

  // HTTP → HTTPS lo fa il proxy di Hostinger ("Forza HTTPS" in hPanel), non questo server:
  // dietro il proxy l'header X-Forwarded-Proto non è garantito e si rischierebbe un ciclo di redirect.

  const api = /^\/api\/([a-z]+)$/.exec(p);
  if (api) {
    if (!API.includes(api[1])) { res.setHeader("X-Robots-Tag", NOINDEX); return notFound(res); }
    return handleApi(api[1], url, req, res);
  }

  if (req.method !== "GET" && req.method !== "HEAD") {
    res.setHeader("Allow", "GET, HEAD");
    res.statusCode = 405;
    return res.end();
  }

  // trailingSlash: false → /admin/ diventa /admin (la query resta)
  if (p.length > 1 && p.endsWith("/")) return redirect(res, 308, p.replace(/\/+$/, "") + url.search);
  // cleanUrls: /index.html → /
  if (p === "/index.html") return redirect(res, 301, "/" + url.search);

  if (p === "/") return serveStatic("/index.html", req, res);
  if (p === "/admin") return serveStatic("/index.html", req, res, { "X-Robots-Tag": NOINDEX });
  if (isAllowed(p)) return serveStatic(p, req, res);
  return notFound(res);
}

const server = http.createServer((req, res) => {
  route(req, res).catch((e) => {
    console.error("[server]", e);
    if (!res.headersSent) sendJson(res, 500, { error: "Errore interno" });
    else res.end();
  });
});

// il riscaldamento parte quando il server è in ascolto: su Hostinger è lsnode.js (LiteSpeed)
// a fare require di questo file e a chiamare listen(), quindi require.main non è questo modulo
server.once("listening", warmUp);

if (require.main === module) {
  server.listen(PORT, () => console.log("MAGIX in ascolto sulla porta " + PORT));
}

module.exports = server;
// per i test
module.exports.apiCache = apiCache;
module.exports.warmUp = warmUp;
module.exports.FRESH_MS = FRESH_MS;
