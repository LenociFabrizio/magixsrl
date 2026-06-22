// ─────────────────────────────────────────────────────────────────────────
// Autenticazione area riservata — passphrase unica + cookie di sessione HMAC.
// Nessuna dipendenza esterna: usa solo il modulo `crypto` di Node.
//
// Login: si confronta la password con ADMIN_PASSWORD (confronto a tempo costante).
// In caso di successo si emette un cookie HttpOnly firmato:  base64(payload).hmac
// payload = { exp: <epoch ms> }. Le route di scrittura chiamano requireAuth().
// ─────────────────────────────────────────────────────────────────────────
"use strict";

const crypto = require("crypto");

const COOKIE = "magix_session";
const TTL_MS = 12 * 60 * 60 * 1000; // 12 ore

// ⚠ BYPASS TEMPORANEO PER TEST — attivo SOLO se la env ADMIN_BYPASS è impostata
// (1/true/on/yes). Quando attivo, il login non richiede password e la sessione
// viene comunque firmata (con un segreto di sviluppo se AUTH_SECRET manca), così
// si può testare l'intera area admin senza configurare ADMIN_PASSWORD/AUTH_SECRET.
// DISATTIVARE prima di andare in produzione: basta rimuovere/azzerare ADMIN_BYPASS.
const DEV_SECRET = "magix-dev-bypass-secret-NON-PER-PRODUZIONE";
function bypassEnabled() {
  const v = String(process.env.ADMIN_BYPASS || "").trim().toLowerCase();
  return v === "1" || v === "true" || v === "on" || v === "yes";
}

function secret() {
  const s = process.env.AUTH_SECRET;
  if (s) return s;
  if (bypassEnabled()) return DEV_SECRET; // permette di firmare la sessione in modalità test
  throw new Error("AUTH_SECRET non configurato");
}

function b64url(buf) {
  return Buffer.from(buf).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function hmac(data) {
  return b64url(crypto.createHmac("sha256", secret()).update(data).digest());
}

// confronto a tempo costante che non rivela la lunghezza
function safeEqual(a, b) {
  const ha = crypto.createHash("sha256").update(String(a)).digest();
  const hb = crypto.createHash("sha256").update(String(b)).digest();
  return crypto.timingSafeEqual(ha, hb);
}

function checkPassword(password) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) throw new Error("ADMIN_PASSWORD non configurato");
  if (typeof password !== "string" || !password) return false;
  return safeEqual(password, expected);
}

function createToken() {
  const payload = b64url(JSON.stringify({ exp: Date.now() + TTL_MS }));
  return payload + "." + hmac(payload);
}

function verifyToken(token) {
  if (!token || typeof token !== "string" || token.indexOf(".") === -1) return false;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return false;
  let good;
  try { good = crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(hmac(payload))); }
  catch { return false; }
  if (!good) return false;
  try {
    const data = JSON.parse(Buffer.from(payload.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString());
    return data && typeof data.exp === "number" && data.exp > Date.now();
  } catch { return false; }
}

function parseCookies(req) {
  const out = {};
  const raw = req.headers && req.headers.cookie;
  if (!raw) return out;
  raw.split(";").forEach((part) => {
    const i = part.indexOf("=");
    if (i > -1) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  });
  return out;
}

function sessionCookie(token, maxAgeSec) {
  const attrs = [
    `${COOKIE}=${token}`,
    "Path=/",
    "HttpOnly",
    "Secure",
    "SameSite=Strict",
    `Max-Age=${maxAgeSec}`,
  ];
  return attrs.join("; ");
}

function setSession(res) {
  res.setHeader("Set-Cookie", sessionCookie(createToken(), Math.floor(TTL_MS / 1000)));
}

function clearSession(res) {
  res.setHeader("Set-Cookie", sessionCookie("", 0));
}

function isAuthed(req) {
  return verifyToken(parseCookies(req)[COOKIE]);
}

// Gate per le route di scrittura: ritorna true se autenticato,
// altrimenti scrive 401 e ritorna false (il chiamante deve fare `return`).
function requireAuth(req, res) {
  if (isAuthed(req)) return true;
  res.status(401).json({ error: "Non autorizzato" });
  return false;
}

module.exports = {
  COOKIE,
  checkPassword,
  setSession,
  clearSession,
  isAuthed,
  requireAuth,
  bypassEnabled,
};
