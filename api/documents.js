// CRUD Documenti (Area download).  GET pubblico · POST/PUT/DELETE protetti.
// Item: { id, nome, cat, tipo, url, badge }
"use strict";

const { arrayCrud } = require("./_lib/collection");

function sanitize(d) {
  return {
    id: d.id,
    nome: String(d.nome || "").trim(),
    cat: String(d.cat || "company").trim().toLowerCase(),
    tipo: String(d.tipo || "PDF").trim().toUpperCase(),
    url: String(d.url || "").trim(),
    badge: String(d.badge || "").trim(),
  };
}

module.exports = arrayCrud("documents", sanitize);
