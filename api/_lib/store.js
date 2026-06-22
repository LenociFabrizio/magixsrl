// ─────────────────────────────────────────────────────────────────────────
// Storage delle collezioni su Vercel Blob (un file JSON per collezione).
// Se il blob non esiste ancora, si ricade sul seed bundle (api/_seed/*.json),
// così la prima GET funziona anche prima di qualsiasi scrittura.
//
// Lettura: list(prefix) → fetch dell'URL pubblico con cache-busting (i dati
// devono riflettere subito le scritture dell'admin).
// Scrittura: put(pathname, json) con path stabile e overwrite.
// ─────────────────────────────────────────────────────────────────────────
"use strict";

const { put, list } = require("@vercel/blob");
const crypto = require("crypto");

// seed statici (require espliciti così il bundler li include sempre)
const SEEDS = {
  catalog: require("../_seed/catalog.json"),
  news: require("../_seed/news.json"),
  documents: require("../_seed/documents.json"),
  positions: require("../_seed/positions.json"),
};

const PREFIX = "magix-data/";
const pathFor = (name) => `${PREFIX}${name}.json`;

function assertName(name) {
  if (!Object.prototype.hasOwnProperty.call(SEEDS, name)) {
    throw new Error("Collezione sconosciuta: " + name);
  }
}

// ritorna l'URL del blob della collezione, o null se non esiste ancora
async function blobUrl(name) {
  const { blobs } = await list({ prefix: pathFor(name), limit: 1 });
  const exact = blobs.find((b) => b.pathname === pathFor(name)) || blobs[0];
  return exact ? exact.url : null;
}

async function readCollection(name) {
  assertName(name);
  try {
    const url = await blobUrl(name);
    if (url) {
      const res = await fetch(url + "?t=" + Date.now(), { cache: "no-store" });
      if (res.ok) return await res.json();
    }
  } catch (e) {
    // blob non configurato o errore di rete → fallback al seed
    console.error("readCollection fallback per", name, e && e.message);
  }
  // copia profonda del seed per non mutarlo
  return JSON.parse(JSON.stringify(SEEDS[name]));
}

async function writeCollection(name, data) {
  assertName(name);
  await put(pathFor(name), JSON.stringify(data), {
    access: "public",
    contentType: "application/json",
    addRandomSuffix: false,
    allowOverwrite: true,
    cacheControlMaxAge: 0,
  });
  return data;
}

const newId = () => crypto.randomUUID();

module.exports = { readCollection, writeCollection, newId, SEEDS };
