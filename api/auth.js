// POST /api/auth?action=login   body { password }   → set-cookie sessione
// POST /api/auth?action=logout                       → clear cookie
// GET  /api/auth?action=me                            → { authed: bool }
"use strict";

const { checkPassword, setSession, clearSession, isAuthed, bypassEnabled } = require("./_lib/auth");

module.exports = async function handler(req, res) {
  const action = (req.query && req.query.action) || "";

  if (action === "me") {
    // `bypass` informa il frontend per mostrare l'avviso "modalità test"
    return res.status(200).json({ authed: isAuthed(req), bypass: bypassEnabled() });
  }

  if (action === "logout") {
    clearSession(res);
    return res.status(200).json({ ok: true });
  }

  if (action === "login") {
    if (req.method !== "POST") return res.status(405).json({ error: "Metodo non consentito" });
    // ⚠ BYPASS TEST: con ADMIN_BYPASS attivo si entra senza password
    if (bypassEnabled()) {
      setSession(res);
      return res.status(200).json({ ok: true, bypass: true });
    }
    let password = req.body && req.body.password;
    if (password == null && typeof req.body === "string") {
      try { password = JSON.parse(req.body).password; } catch { /* ignore */ }
    }
    try {
      if (!checkPassword(password)) return res.status(401).json({ error: "Password errata" });
    } catch (e) {
      return res.status(500).json({ error: "Configurazione server incompleta" });
    }
    setSession(res);
    return res.status(200).json({ ok: true });
  }

  return res.status(400).json({ error: "Azione non valida" });
};
