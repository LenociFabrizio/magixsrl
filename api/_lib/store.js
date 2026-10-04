// ─────────────────────────────────────────────────────────────────────────
// Storage delle collezioni su Vercel Blob (un file JSON per collezione).
// Se il blob non esiste ancora, si ricade sul seed bundle (api/_seed/*.json),
// così la prima GET funziona anche prima di qualsiasi scrittura.
//
// Lettura: list(prefix) → fetch dell'URL pubblico con cache-busting (i dati
// devono riflettere subito le scritture dell'admin).
// Scrittura: put(pathname, json) con path stabile e overwrite.
//
// Collezioni PRIVATE (area riservata): lo store è ad accesso "public", cioè chi
// conosce l'URL di un file lo legge senza autenticazione — e l'host dello store
// compare negli URL delle immagini caricate. Un path fisso sarebbe deducibile,
// quindi questi dati si salvano con suffisso casuale sotto un prefisso dedicato
// e si ritrovano con list(), che richiede il token del server.
// ─────────────────────────────────────────────────────────────────────────
"use strict";

const { put, list, del } = require("@vercel/blob");
const crypto = require("crypto");

// seed statici (require espliciti così il bundler li include sempre)
const SEEDS = {
  catalog: require("../_seed/catalog.json"),
  news: require("../_seed/news.json"),
  documents: require("../_seed/documents.json"),
  positions: require("../_seed/positions.json"),
  trips: require("../_seed/trips.json"), // storico trasferte (area riservata)
  settings: require("../_seed/settings.json"), // impostazioni sito (oggetto, non array)
  sessions: {}, // registro sessioni area riservata (vedi _lib/auth.js), parte vuoto
};

const PRIVATE = {
  trips: "magix-private/trips/",
  sessions: "magix-private/sessions/",
};

const PREFIX = "magix-data/";
const pathFor = (name) => `${PREFIX}${name}.json`;

function assertName(name) {
  if (!Object.prototype.hasOwnProperty.call(SEEDS, name)) {
    throw new Error("Collezione sconosciuta: " + name);
  }
}

// ritorna l'URL del blob a path fisso della collezione, o null se non esiste ancora
async function blobUrl(name) {
  const { blobs } = await list({ prefix: pathFor(name), limit: 1 });
  const exact = blobs.find((b) => b.pathname === pathFor(name)) || blobs[0];
  return exact ? exact.url : null;
}

// versioni salvate di una collezione privata, la più recente per prima
async function privateBlobs(name) {
  const { blobs } = await list({ prefix: PRIVATE[name] });
  return blobs.slice().sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
}

async function currentUrl(name) {
  if (!PRIVATE[name]) return blobUrl(name);
  const [latest] = await privateBlobs(name);
  // nessuna versione privata ancora: vale il vecchio file a path fisso (migrazione storico trasferte)
  return latest ? latest.url : blobUrl(name);
}

// opts.strict: un errore di lettura viene propagato invece di ricadere sul seed, per i
// dati in cui "illeggibile" non deve valere come "vuoto" (es. il registro sessioni)
async function readCollection(name, opts) {
  assertName(name);
  try {
    const url = await currentUrl(name);
    if (url) {
      const res = await fetch(url + "?t=" + Date.now(), { cache: "no-store" });
      if (res.ok) return await res.json();
      throw new Error("HTTP " + res.status);
    }
  } catch (e) {
    if (opts && opts.strict) throw e;
    // blob non configurato o errore di rete → fallback al seed
    console.error("readCollection fallback per", name, e && e.message);
  }
  // copia profonda del seed per non mutarlo
  return JSON.parse(JSON.stringify(SEEDS[name]));
}

async function writeCollection(name, data) {
  assertName(name);
  const isPrivate = !!PRIVATE[name];
  const blob = await put(isPrivate ? PRIVATE[name] + name + ".json" : pathFor(name), JSON.stringify(data), {
    access: "public",
    contentType: "application/json",
    addRandomSuffix: isPrivate, // privata: URL non indovinabile
    allowOverwrite: true,
    cacheControlMaxAge: 0,
  });
  if (isPrivate) await dropOldVersions(name, blob.url);
  return data;
}

// Dopo una scrittura privata elimina le versioni precedenti e l'eventuale vecchio
// file pubblico a path fisso. Non fa fallire il salvataggio: al più ci riprova la
// scrittura successiva.
async function dropOldVersions(name, keepUrl) {
  try {
    const all = await privateBlobs(name);
    const mine = all.find((b) => b.url === keepUrl);
    if (!mine) return;
    // solo le versioni PIÙ VECCHIE di quella appena scritta: una scrittura concorrente
    // più recente non va toccata (vince l'ultima, come per i file a path fisso)
    const stale = all.filter((b) => new Date(b.uploadedAt) < new Date(mine.uploadedAt)).map((b) => b.url);
    const legacy = await blobUrl(name);
    if (legacy) stale.push(legacy);
    if (stale.length) await del(stale);
  } catch (e) {
    console.error("pulizia versioni precedenti di", name, e && e.message);
  }
}

const newId = () => crypto.randomUUID();

module.exports = { readCollection, writeCollection, newId, SEEDS };
