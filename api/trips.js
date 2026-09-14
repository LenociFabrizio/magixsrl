// CRUD Storico trasferte (tool "Trasferte & trasporti" dell'area riservata).
// A differenza di catalog/news/documenti/posizioni, QUI anche la GET è protetta:
// lo storico è un dato privato dell'area riservata (protectGet: true).
// Item: { id, data, partenza, arrivo, km, andataRitorno, veicolo, carburante,
//         consumo, prezzoUnita, caricoKg, costoCarburante, costoUsura,
//         pedaggi, extra, totale, note }
"use strict";

const { arrayCrud } = require("./_lib/collection");

const num = (v) => {
  const n = parseFloat(String(v == null ? "" : v).replace(",", "."));
  return isFinite(n) ? n : 0;
};

function sanitize(t) {
  return {
    id: t.id,
    data: String(t.data || "").trim(),
    partenza: String(t.partenza || "").trim(),
    arrivo: String(t.arrivo || "").trim(),
    km: num(t.km),
    andataRitorno: t.andataRitorno === true || t.andataRitorno === "true",
    veicolo: String(t.veicolo || "").trim(),
    carburante: String(t.carburante || "").trim(),
    consumo: num(t.consumo),
    prezzoUnita: num(t.prezzoUnita),
    caricoKg: num(t.caricoKg),
    costoCarburante: num(t.costoCarburante),
    costoUsura: num(t.costoUsura),
    pedaggi: num(t.pedaggi),
    extra: num(t.extra),
    totale: num(t.totale),
    note: String(t.note || "").trim(),
  };
}

module.exports = arrayCrud("trips", sanitize, { protectGet: true });
