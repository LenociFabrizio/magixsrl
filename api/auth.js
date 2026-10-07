// POST /api/auth?action=login   body { username, password } → crea la sessione (cookie)
// POST /api/auth?action=logout                              → invalida la sessione e cancella il cookie
// GET  /api/auth?action=me                                   → { authed: bool }
"use strict";

const { checkCredentials, createSession, destroySession, isAuthed, sameOrigin } = require("./_lib/auth");
const { parseBody } = require("./_lib/collection");

// risposta ritardata sui tentativi falliti: rallenta i tentativi a raffica sulla password
const FAIL_DELAY_MS = 800;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  const action = (req.query && req.query.action) || "";

  if (action === "me") {
    return res.status(200).json({ authed: await isAuthed(req) });
  }
  // login e logout solo da pagine di questo sito (vedi sameOrigin in _lib/auth.js)
  if (req.method === "POST" && !sameOrigin(req)) return res.status(403).json({ error: "Origine della richiesta non consentita" });

  if (action === "logout") {
    if (req.method !== "POST") return res.status(405).json({ error: "Metodo non consentito" });
    try {
      await destroySession(req, res);
    } catch (e) {
      console.error("logout error:", e && e.message);
      return res.status(503).json({ error: "Logout non riuscito, riprova" });
    }
    return res.status(200).json({ ok: true });
  }

  if (action === "login") {
    if (req.method !== "POST") return res.status(405).json({ error: "Metodo non consentito" });
    const body = parseBody(req);
    let ok;
    try {
      ok = await checkCredentials(body.username, body.password);
    } catch (e) {
      console.error("auth config error:", e && e.message);
      return res.status(500).json({ error: "Area riservata non configurata sul server" });
    }
    if (!ok) {
      await wait(FAIL_DELAY_MS);
      return res.status(401).json({ error: "Credenziali non valide" });
    }
    try {
      await createSession(res);
    } catch (e) {
      console.error("session error:", e && e.message);
      return res.status(503).json({ error: "Impossibile avviare la sessione, riprova" });
    }
    return res.status(200).json({ ok: true });
  }

  return res.status(400).json({ error: "Azione non valida" });
};
