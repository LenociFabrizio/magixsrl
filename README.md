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
| `script.js` | Router delle viste, reveal on scroll, accordion FAQ, form, **bootstrap dati da API** |
| `catalog-data.js` | Catalogo prodotti statico (usato come fallback se l'API non risponde) |
| `api/` | **Serverless Functions** (area riservata: auth + CRUD catalogo/news/documenti/posizioni) |
| `vercel.json` | Configurazione deploy |

## Area riservata (admin) — backend

L'area riservata (`Area riservata` nel footer → `/admin`) usa **Vercel Serverless Functions** (`api/`)
con storage su **Vercel Blob** e una **passphrase unica** per l'accesso.

Le GET sono pubbliche (il sito legge i contenuti); ogni operazione di scrittura (create/update/delete)
richiede l'autenticazione tramite cookie di sessione firmato. Se il backend non è configurato o non
risponde, il sito pubblico **ricade automaticamente sui dati statici** e resta perfettamente funzionante.

### Setup (una tantum)

1. **Crea il Blob store**: Vercel → progetto → **Storage → Create → Blob** → connetti al progetto
   (Vercel inserisce in automatico `BLOB_READ_WRITE_TOKEN`).
2. **Imposta le variabili d'ambiente** (Settings → Environment Variables), vedi `.env.example`:
   - `ADMIN_PASSWORD` — la passphrase d'accesso all'area riservata.
   - `AUTH_SECRET` — segreto per firmare il cookie (`openssl rand -hex 32`).
3. Redeploy.

### Sviluppo locale dell'area riservata

```bash
npm install
npm i -g vercel        # se non presente
vercel link            # collega la cartella al progetto Vercel
vercel env pull .env.local   # scarica BLOB_READ_WRITE_TOKEN
# aggiungi ADMIN_PASSWORD e AUTH_SECRET in .env.local (vedi .env.example)
vercel dev             # serve sito + functions su http://localhost:3000
```

> Senza `vercel dev` (es. `npm start`) le API non sono attive: il sito gira comunque sui dati statici,
> ma l'area riservata non potrà salvare.

## Deploy su Vercel

Il progetto è pronto per Vercel come sito statico (nessuna build necessaria):

1. Importa la repository su [vercel.com](https://vercel.com/new).
2. **Framework Preset:** Other — **Build Command:** _(vuoto)_ — **Output Directory:** `.` (root).
3. Deploy.

Ad ogni `git push` sul branch `main` Vercel pubblica automaticamente la nuova versione.
