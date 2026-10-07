// CRUD Catalogo (categorie + prodotti annidati).
// GET pubblico → oggetto { [catKey]: { label, mat, intro, seo, products:[...] } }
//   (i prodotti in bozza solo con sessione admin valida)
// Mutazioni protette, body con `kind`:
//   kind:"category"  → { key, label, mat, intro, seo, oldKey? }
//   kind:"product"   → { catKey, product:{...}, oldCatKey?, code? (per PUT/DELETE) }
"use strict";

const { readCollection, writeCollection } = require("./_lib/store");
const { requireAuth, isAuthed } = require("./_lib/auth");
const { parseBody, isPublished, safeUrl, noStore } = require("./_lib/collection");

const slug = (s) => String(s || "").trim().toLowerCase();
// nomi che su un oggetto JS non sono semplici proprietà: mai usarli come chiave categoria
const RESERVED = ["__proto__", "constructor", "prototype"];
const hasCat = (catalog, k) => !!k && Object.prototype.hasOwnProperty.call(catalog, k);

// prodotto dal body: si conservano tutti i campi della scheda, ma codice e nome restano
// testo e la foto solo un URL ammesso (vedi safeUrl in _lib/collection.js)
function cleanProduct(p) {
  const out = Object.assign({}, p, { code: String(p.code), name: String(p.name) });
  const img = safeUrl(p.img);
  if (img) out.img = img; else delete out.img;
  return out;
}

function cleanCategory(b, prev) {
  return {
    label: String(b.label || (prev && prev.label) || "").trim(),
    mat: String(b.mat || (prev && prev.mat) || "mat-grey").trim(),
    intro: String(b.intro != null ? b.intro : (prev && prev.intro) || "").trim(),
    seo: b.seo || (prev && prev.seo) || undefined,
    products: (prev && prev.products) || [],
  };
}

module.exports = async function handler(req, res) {
  noStore(res);
  try {
    const catalog = await readCollection("catalog");

    if (req.method === "GET") {
      if (!(await isAuthed(req))) {
        Object.values(catalog).forEach((c) => {
          if (c && Array.isArray(c.products)) c.products = c.products.filter(isPublished);
        });
      }
      return res.status(200).json(catalog);
    }
    if (!(await requireAuth(req, res))) return;

    const body = parseBody(req);
    const kind = body.kind;

    // ── CATEGORIE ──
    if (kind === "category") {
      const key = slug(body.key);
      if (!key) return res.status(400).json({ error: "Chiave categoria mancante" });
      if (RESERVED.includes(key) || RESERVED.includes(slug(body.oldKey))) return res.status(400).json({ error: "Nome categoria non valido" });

      if (req.method === "DELETE") {
        delete catalog[key];
        await writeCollection("catalog", catalog);
        return res.status(200).json({ ok: true, deleted: key });
      }
      // POST = create, PUT = update (con eventuale rinomina via oldKey)
      const oldKey = slug(body.oldKey);
      const prev = (hasCat(catalog, oldKey) && catalog[oldKey]) || (hasCat(catalog, key) ? catalog[key] : undefined);
      if (req.method === "PUT" && oldKey && oldKey !== key && hasCat(catalog, oldKey)) {
        delete catalog[oldKey];
      }
      catalog[key] = cleanCategory(body, prev);
      await writeCollection("catalog", catalog);
      return res.status(req.method === "POST" ? 201 : 200).json({ ok: true, key, category: catalog[key] });
    }

    // ── PRODOTTI ──
    if (kind === "product") {
      const catKey = slug(body.catKey);
      if (!hasCat(catalog, catKey)) return res.status(400).json({ error: "Categoria inesistente" });
      catalog[catKey].products = catalog[catKey].products || [];
      const code = body.code || (body.product && body.product.code);

      if (req.method === "DELETE") {
        catalog[catKey].products = catalog[catKey].products.filter((p) => p.code !== code);
        await writeCollection("catalog", catalog);
        return res.status(200).json({ ok: true, deleted: code });
      }

      const raw = body.product && typeof body.product === "object" && !Array.isArray(body.product) ? body.product : {};
      if (!raw.code || !raw.name) return res.status(400).json({ error: "Codice e nome prodotto obbligatori" });
      const product = cleanProduct(raw);

      if (req.method === "PUT") {
        // rimuovi dalla vecchia categoria se spostato
        const oldCatKey = slug(body.oldCatKey) || catKey;
        if (hasCat(catalog, oldCatKey)) {
          catalog[oldCatKey].products = (catalog[oldCatKey].products || []).filter((p) => p.code !== code);
        }
        const arr = catalog[catKey].products;
        const i = arr.findIndex((p) => p.code === product.code);
        if (i > -1) arr[i] = product; else arr.push(product);
        await writeCollection("catalog", catalog);
        return res.status(200).json({ ok: true, product });
      }

      // POST = create
      if (catalog[catKey].products.some((p) => p.code === product.code)) {
        return res.status(409).json({ error: "Codice prodotto già esistente" });
      }
      catalog[catKey].products.push(product);
      await writeCollection("catalog", catalog);
      return res.status(201).json({ ok: true, product });
    }

    return res.status(400).json({ error: "kind non valido (category|product)" });
  } catch (e) {
    console.error("catalog CRUD error:", e && e.message);
    return res.status(500).json({ error: "Errore server" });
  }
};
