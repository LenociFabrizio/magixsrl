// Factory CRUD per collezioni "array di oggetti con id" (news, documenti, posizioni).
// GET = pubblico; POST/PUT/DELETE = protetti da requireAuth.
"use strict";

const { readCollection, writeCollection, newId } = require("./store");
const { requireAuth } = require("./auth");

function parseBody(req) {
  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  return body || {};
}

// opts.protectGet: se true, anche la GET richiede autenticazione (dati privati,
// es. storico trasferte). Default: GET pubblica (catalogo/news/documenti/posizioni).
function arrayCrud(name, sanitize, opts) {
  sanitize = sanitize || ((x) => x);
  const protectGet = !!(opts && opts.protectGet);
  return async function handler(req, res) {
    try {
      if (req.method === "GET") {
        if (protectGet && !requireAuth(req, res)) return;
        return res.status(200).json(await readCollection(name));
      }
      if (!requireAuth(req, res)) return;

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

module.exports = { arrayCrud, parseBody };
