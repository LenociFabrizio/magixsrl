// CRUD Posizioni lavorative ("Lavora con noi").  GET pubblico · POST/PUT/DELETE protetti.
// Item: { id, titolo, luogo, tipo, descrizione, aperta }
"use strict";

const { arrayCrud } = require("./_lib/collection");

function sanitize(p) {
  return {
    id: p.id,
    titolo: String(p.titolo || "").trim(),
    luogo: String(p.luogo || "").trim(),
    tipo: String(p.tipo || "").trim(),
    descrizione: String(p.descrizione || "").trim(),
    aperta: p.aperta === false ? false : true,
  };
}

module.exports = arrayCrud("positions", sanitize);
