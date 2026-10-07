// Factory CRUD per collezioni "array di oggetti con id" (news, documenti, posizioni).
// GET = pubblico; POST/PUT/DELETE = protetti da requireAuth.
"use strict";

const { readCollection, writeCollection, newId } = require("./store");
const { requireAuth, isAuthed } = require("./auth");

function parseBody(req) {
  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  return body || {};
}

// contenuti in "bozza" (prodotti, news): visibili solo all'area riservata
const isPublished = (x) => String((x && x.stato) || "pubblicato").toLowerCase() !== "bozza";

// URL di immagini e documenti salvati dall'admin: solo percorsi del sito o http(s).
// Altri schemi (javascript:, data:, …) diventerebbero link eseguibili sul sito pubblico.
// Tab e a capo si tolgono come fa il browser ("java\tscript:" vale "javascript:").
function safeUrl(v) {
  const s = String(v == null ? "" : v).replace(/[\t\n\r]/g, "").replace(/^[\u0000-\u0020]+|[\u0000-\u0020]+$/g, "");
  if (!s) return "";
  const scheme = /^([a-z][a-z0-9+.-]*):/i.exec(s);
  if (scheme) return /^https?$/i.test(scheme[1]) ? s : "";
  return s.startsWith("//") || s.startsWith("\\") ? "" : s;
}

// risposte delle API mai salvate in cache: con la sessione admin includono le bozze
const noStore = (res) => res.setHeader("Cache-Control", "private, no-store");

// opts.protectGet: se true, anche la GET richiede autenticazione (dati privati,
// es. storico trasferte). Default: GET pubblica (catalogo/news/documenti/posizioni).
// opts.publicFilter: sulla GET senza sessione restituisce solo gli item che lo
// soddisfano (es. niente bozze); con sessione valida l'admin riceve tutto.
function arrayCrud(name, sanitize, opts) {
  sanitize = sanitize || ((x) => x);
  const protectGet = !!(opts && opts.protectGet);
  const publicFilter = opts && opts.publicFilter;
  return async function handler(req, res) {
    noStore(res);
    try {
      if (req.method === "GET") {
        if (protectGet && !(await requireAuth(req, res))) return;
        const items = await readCollection(name);
        if (publicFilter && !protectGet && !(await isAuthed(req))) return res.status(200).json(items.filter(publicFilter));
        return res.status(200).json(items);
      }
      if (!(await requireAuth(req, res))) return;

      const body = parseBody(req);
      const list = await readCollection(name);

      if (req.method === "POST") {
        const item = sanitize(Object.assign({}, body, { id: body.id || newId() }));
        list.unshift(item);
        await writeCollection(name, list);
        return res.status(201).json(item);
      }
      if (req.method === "PUT") {
        const i = list.findIndex((x) => x.id === body.id);
        if (i === -1) return res.status(404).json({ error: "Elemento non trovato" });
        list[i] = sanitize(Object.assign({}, list[i], body, { id: list[i].id }));
        await writeCollection(name, list);
        return res.status(200).json(list[i]);
      }
      if (req.method === "DELETE") {
        const id = body.id || (req.query && req.query.id);
        if (!id) return res.status(400).json({ error: "id mancante" }); // senza id cancellerebbe gli elementi privi di id
        const next = list.filter((x) => x.id !== id);
        await writeCollection(name, next);
        return res.status(200).json({ ok: true, deleted: id });
      }
      return res.status(405).json({ error: "Metodo non consentito" });
    } catch (e) {
      console.error(name, "CRUD error:", e && e.message);
      return res.status(500).json({ error: "Errore server" });
    }
  };
}

module.exports = { arrayCrud, parseBody, isPublished, safeUrl, noStore };
