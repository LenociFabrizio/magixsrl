# Magix S.r.l. — Sito (prototipo 2026)

Sito statico (HTML + Tailwind via CDN + JS vanilla) per Magix S.r.l.
Single-page con più viste commutate via JavaScript: **Home**, **Cemento sfuso**, **News**, **Contatti**, **Scheda prodotto** e **Admin**.

## Sviluppo locale

```bash
npm install
npm start
```

Apri http://localhost:3000

> In alternativa, essendo un sito statico, è sufficiente aprire `index.html` con un server statico qualsiasi.

## Struttura

| File | Descrizione |
|------|-------------|
| `index.html` | Markup di tutte le viste + config Tailwind inline |
| `styles.css` | Utility custom (animazioni, swatch materici, accordion, ecc.) |
| `script.js` | Router delle viste, reveal on scroll, accordion FAQ, form contatti |
| `vercel.json` | Configurazione deploy statico |

## Deploy su Vercel

Il progetto è pronto per Vercel come sito statico (nessuna build necessaria):

1. Importa la repository su [vercel.com](https://vercel.com/new).
2. **Framework Preset:** Other — **Build Command:** _(vuoto)_ — **Output Directory:** `.` (root).
3. Deploy.

Ad ogni `git push` sul branch `main` Vercel pubblica automaticamente la nuova versione.
