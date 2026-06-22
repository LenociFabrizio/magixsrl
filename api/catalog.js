// CRUD Catalogo (categorie + prodotti annidati).
// GET pubblico → oggetto { [catKey]: { label, mat, intro, seo, products:[...] } }
// Mutazioni protette, body con `kind`:
//   kind:"category"  → { key, label, mat, intro, seo, oldKey? }
//   kind:"product"   → { catKey, product:{...}, oldCatKey?, code? (per PUT/DELETE) }
"use strict";

const { readCollection, writeCollection } = require("./_lib/store");
const { requireAuth } = require("./_lib/auth");
const { parseBody } = require("./_lib/collection");

const slug = (s) => String(s || "").trim().toLowerCase();

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
  try {
    const catalog = await readCollection("catalog");

    if (req.method === "GET") return res.status(200).json(catalog);
    if (!requireAuth(req, res)) return;

    const body = parseBody(req);
    const kind = body.kind;

    // ── CATEGORIE ──
    if (kind === "category") {
      const key = slug(body.key);
      if (!key) return res.status(400).json({ error: "Chiave categoria mancante" });

      if (req.method === "DELETE") {
        delete catalog[key];
        await writeCollection("catalog", catalog);
        return res.status(200).json({ ok: true, deleted: key });
      }
      // POST = create, PUT = update (con eventuale rinomina via oldKey)
      const oldKey = slug(body.oldKey);
      const prev = (oldKey && catalog[oldKey]) || catalog[key];
      if (req.method === "PUT" && oldKey && oldKey !== key && catalog[oldKey]) {
        delete catalog[oldKey];
      }
      catalog[key] = cleanCategory(body, prev);
      await writeCollection("catalog", catalog);
      return res.status(req.method === "POST" ? 201 : 200).json({ ok: true, key, category: catalog[key] });
    }

    // ── PRODOTTI ──
    if (kind === "product") {
      const catKey = slug(body.catKey);
      if (!catKey || !catalog[catKey]) return res.status(400).json({ error: "Categoria inesistente" });
      catalog[catKey].products = catalog[catKey].products || [];
      const code = body.code || (body.product && body.product.code);

      if (req.method === "DELETE") {
        catalog[catKey].products = catalog[catKey].products.filter((p) => p.code !== code);
        await writeCollection("catalog", catalog);
        return res.status(200).json({ ok: true, deleted: code });
      }

      const product = body.product || {};
      if (!product.code || !product.name) return res.status(400).json({ error: "Codice e nome prodotto obbligatori" });

      if (req.method === "PUT") {
        // rimuovi dalla vecchia categoria se spostato
        const oldCatKey = slug(body.oldCatKey) || catKey;
        if (catalog[oldCatKey]) {
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
