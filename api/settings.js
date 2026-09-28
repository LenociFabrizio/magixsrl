// Impostazioni del sito (oggetto unico, non array di item).
// GET pubblico → { homeFeatured: { mode: "random"|"manual", code } }
// PUT protetto → aggiorna solo i campi noti presenti nel body (sanitizzati).
//   homeFeatured: prodotto mostrato nella card "in evidenza" della home.
//     mode "manual" + code = prodotto scelto dall'admin; "random" = casuale a ogni visita.
"use strict";

const { readCollection, writeCollection } = require("./_lib/store");
const { requireAuth } = require("./_lib/auth");
const { parseBody } = require("./_lib/collection");

function cleanHomeFeatured(v) {
  const code = String((v && v.code) || "").trim();
  return v && v.mode === "manual" && code ? { mode: "manual", code } : { mode: "random", code: "" };
}

module.exports = async function handler(req, res) {
  try {
    const settings = await readCollection("settings");

    if (req.method === "GET") return res.status(200).json(settings);
    if (!requireAuth(req, res)) return;
    if (req.method !== "PUT") return res.status(405).json({ error: "Metodo non consentito" });

    const body = parseBody(req);
    if (body.homeFeatured !== undefined) settings.homeFeatured = cleanHomeFeatured(body.homeFeatured);
    await writeCollection("settings", settings);
    return res.status(200).json(settings);
  } catch (e) {
    console.error("settings error:", e && e.message);
    return res.status(500).json({ error: "Errore server" });
  }
};
