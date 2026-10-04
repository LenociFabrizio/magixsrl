// ─────────────────────────────────────────────────────────────────────────
// Autenticazione area riservata — account admin (username/email + password)
// con sessioni registrate lato server. Nessuna dipendenza esterna: solo `crypto`.
//
// Credenziali da env: ADMIN_USERNAME (username o email, confronto case-insensitive)
// e ADMIN_PASSWORD (in chiaro, oppure hash "scrypt:<salt hex>:<hash hex>").
// Senza configurazione completa nessun login è possibile (mai aperto di default).
//
// Login → id di sessione casuale, registrato nella collezione privata "sessions"
// (solo hash dell'id + scadenza) e inviato al browser in un cookie HttpOnly firmato:
//   base64url(payload).hmac     payload = { sid, exp }
// Ogni richiesta protetta verifica firma, scadenza e presenza nel registro: il
// logout rimuove la sessione, quindi il vecchio cookie non vale più (anche se copiato).
// ─────────────────────────────────────────────────────────────────────────
"use strict";

const crypto = require("crypto");
const { promisify } = require("util");
const { readCollection, writeCollection } = require("./store");

const scrypt = promisify(crypto.scrypt);

const COOKIE = "magix_session";
const TTL_MS = 12 * 60 * 60 * 1000; // 12 ore
const SESSIONS = "sessions"; // { sha256(sid): scadenza in epoch ms }
const MAX_SESSIONS = 10; // sessioni contemporanee (dispositivi) tenute nel registro

// valori d'esempio delle vecchie versioni di .env.example: se sono stati copiati
// così come sono, l'area riservata non deve aprirsi con credenziali note a tutti
const PLACEHOLDERS = ["cambia-questa-password", "cambia-questo-segreto-lungo-e-casuale"];

function config() {
  const user = String(process.env.ADMIN_USERNAME || "").trim();
  const pass = String(process.env.ADMIN_PASSWORD || "").trim();
  const secret = String(process.env.AUTH_SECRET || "").trim();
  if (!user || !pass) throw new Error("ADMIN_USERNAME / ADMIN_PASSWORD non configurati");
  if (secret.length < 32) throw new Error("AUTH_SECRET mancante o troppo corto (min 32 caratteri)");
  if (PLACEHOLDERS.includes(pass) || PLACEHOLDERS.includes(secret)) throw new Error("valori d'esempio di .env.example ancora in uso");
  return { user, pass, secret };
}

// La chiave di firma dipende anche dalle credenziali: cambiare username o password
// invalida subito tutte le sessioni aperte.
function sign(c, data) {
  const key = crypto.createHmac("sha256", c.secret).update("magix-session\n" + c.user.toLowerCase() + "\n" + c.pass).digest();
  return crypto.createHmac("sha256", key).update(data).digest("base64url");
}

// confronto a tempo costante che non rivela la lunghezza
function safeEqual(a, b) {
  const ha = crypto.createHash("sha256").update(String(a)).digest();
  const hb = crypto.createHash("sha256").update(String(b)).digest();
  return crypto.timingSafeEqual(ha, hb);
}

async function passwordMatches(input, stored) {
  if (stored.startsWith("scrypt:")) {
    const [, saltHex, hashHex] = stored.split(":");
    const expected = Buffer.from(hashHex || "", "hex");
    if (!saltHex || expected.length < 32) throw new Error("ADMIN_PASSWORD: hash scrypt non valido");
    const got = await scrypt(input, Buffer.from(saltHex, "hex"), expected.length);
    return crypto.timingSafeEqual(got, expected);
  }
  return safeEqual(input, stored);
}

// true solo se username/email e password coincidono con l'account configurato.
// Lancia un errore se la configurazione manca (il chiamante risponde 500).
async function checkCredentials(username, password) {
  const c = config();
  if (typeof username !== "string" || typeof password !== "string" || !username.trim() || !password) return false;
  if (username.length > 254 || password.length > 1024) return false;
  const userOk = safeEqual(username.trim().toLowerCase(), c.user.toLowerCase());
  // la password si verifica sempre: i tempi di risposta non rivelano se lo username è giusto
  const passOk = await passwordMatches(password, c.pass);
  return userOk && passOk;
}

const sidKey = (sid) => crypto.createHash("sha256").update(sid).digest("hex");

function parseCookies(req) {
  const out = {};
  const raw = req.headers && req.headers.cookie;
  if (!raw) return out;
  raw.split(";").forEach((part) => {
    const i = part.indexOf("=");
    if (i === -1) return;
    const name = part.slice(0, i).trim();
    if (name in out) return;
    try { out[name] = decodeURIComponent(part.slice(i + 1).trim()); } catch { /* valore malformato: ignorato */ }
  });
  return out;
}

// cookie → { sid, exp } se firma e scadenza sono valide, altrimenti null.
// Non tocca lo storage: cookie falsi o scaduti vengono scartati subito.
function readToken(req) {
  const token = parseCookies(req)[COOKIE];
  if (!token || typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 2 || !parts[0] || !parts[1]) return null;
  let c;
  try { c = config(); } catch { return null; }
  const got = Buffer.from(parts[1]), want = Buffer.from(sign(c, parts[0]));
  if (got.length !== want.length || !crypto.timingSafeEqual(got, want)) return null;
  try {
    const data = JSON.parse(Buffer.from(parts[0], "base64url").toString());
    if (data && typeof data.sid === "string" && typeof data.exp === "number" && data.exp > Date.now()) return data;
  } catch { /* payload malformato */ }
  return null;
}

// registro illeggibile = errore (mai "vuoto"): il login non sovrascrive le altre
// sessioni e il logout non dichiara chiusa una sessione che non ha potuto revocare
async function loadSessions() {
  const s = await readCollection(SESSIONS, { strict: true });
  return s && typeof s === "object" && !Array.isArray(s) ? s : {};
}

// registro sessioni: via le scadute, tenute solo le MAX_SESSIONS più recenti
function prune(sessions) {
  const now = Date.now();
  const live = Object.entries(sessions)
    .filter(([, exp]) => typeof exp === "number" && exp > now)
    .sort((a, b) => b[1] - a[1])
    .slice(0, MAX_SESSIONS);
  return Object.fromEntries(live);
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

// da chiamare solo dopo checkCredentials() riuscito
async function createSession(res) {
  const c = config();
  const sid = crypto.randomBytes(32).toString("base64url");
  const exp = Date.now() + TTL_MS;
  const sessions = prune(await loadSessions());
  sessions[sidKey(sid)] = exp;
  await writeCollection(SESSIONS, prune(sessions));
  const payload = Buffer.from(JSON.stringify({ sid, exp })).toString("base64url");
  res.setHeader("Set-Cookie", sessionCookie(payload + "." + sign(c, payload), Math.floor(TTL_MS / 1000)));
}

// Logout: toglie la sessione dal registro, poi cancella il cookie. Se lo storage non
// risponde lancia PRIMA di cancellare il cookie, così il logout si può ripetere.
async function destroySession(req, res) {
  const t = readToken(req);
  if (t) {
    const sessions = await loadSessions();
    if (sessions[sidKey(t.sid)] !== undefined) {
      delete sessions[sidKey(t.sid)];
      await writeCollection(SESSIONS, prune(sessions));
    }
  }
  res.setHeader("Set-Cookie", sessionCookie("", 0));
}

async function isAuthed(req) {
  const t = readToken(req);
  if (!t) return false;
  let exp;
  try {
    exp = (await loadSessions())[sidKey(t.sid)];
  } catch (e) {
    console.error("registro sessioni non leggibile:", e && e.message);
    return false; // nel dubbio, accesso negato
  }
  return typeof exp === "number" && exp > Date.now();
}

// Gate per le route protette. ASYNC: usarlo sempre come
//   if (!(await requireAuth(req, res))) return;
// Ritorna true se la sessione è valida, altrimenti risponde 401 e ritorna false.
async function requireAuth(req, res) {
  if (await isAuthed(req)) return true;
  res.status(401).json({ error: "Non autorizzato" });
  return false;
}

module.exports = {
  COOKIE,
  checkCredentials,
  createSession,
  destroySession,
  isAuthed,
  requireAuth,
};
