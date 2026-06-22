// CRUD News.  GET pubblico · POST/PUT/DELETE protetti.
// Item: { id, titolo, cat, data, estratto, corpo:[paragrafi], img, stato }
"use strict";

const { arrayCrud } = require("./_lib/collection");

function sanitize(n) {
  let corpo = n.corpo;
  if (typeof corpo === "string") corpo = corpo.split(/\n\s*\n/).map((s) => s.trim()).filter(Boolean);
  if (!Array.isArray(corpo)) corpo = [];
  return {
    id: n.id,
    titolo: String(n.titolo || "").trim(),
    cat: String(n.cat || "News").trim(),
    data: String(n.data || "").trim(),
    estratto: String(n.estratto || "").trim(),
    corpo,
    img: String(n.img || "").trim(),
    stato: n.stato === "bozza" ? "bozza" : "pubblicato",
  };
}

module.exports = arrayCrud("news", sanitize);
