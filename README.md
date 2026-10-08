# Magix S.r.l. — Sito (prototipo 2026)

Sito statico (HTML + Tailwind + JS vanilla) per Magix S.r.l.
Single-page con più viste commutate via JavaScript: **Home**, **Cemento sfuso**, **News**, **Contatti**, **Scheda prodotto** e **Admin**.

## Sviluppo locale

```bash
npm install
npm run dev     # server.js con le variabili di .env.local (sito + API + area riservata)
```

Apri http://localhost:3000 (area riservata: `/admin`). `npm start` avvia lo stesso server leggendo le
variabili d'ambiente del sistema, come in produzione su Hostinger.

Test (Blob simulato in memoria, nessuna variabile da impostare): `npm test`.

**CSS di Tailwind:** dopo aver aggiunto o cambiato classi in `index.html`, `script.js` o `catalog-data.js`
esegui `npm run build:css` e committa `tailwind.css` (Tailwind 3.4.17 via `npx`, nessuna dipendenza da installare).
Gli hosting non fanno build: pubblicano il file così com'è. `npm test` segnala se `tailwind.css` non è aggiornato.

## Struttura

| File | Descrizione |
|------|-------------|
| `index.html` | Markup di tutte le viste |
| `tailwind.css` | CSS di Tailwind **generato** (`npm run build:css`) con le sole classi usate: non modificarlo a mano |
| `tailwind.config.js`, `tailwind.src.css` | Configurazione Tailwind (colori, font, ombre) e sorgente da cui si genera `tailwind.css` |
| `fonts.css`, `fonts/` | Font del sito in locale (Bricolage Grotesque, Hanken Grotesk, JetBrains Mono), prima da Google Fonts |
| `styles.css` | Utility custom (animazioni, swatch materici, accordion, ecc.) |
| `script.js` | Router delle viste, reveal on scroll, accordion FAQ, form, **bootstrap dati da API** |
| `catalog-data.js` | Catalogo prodotti statico (usato come fallback se l'API non risponde) |
| `img/img_prd/web/` | Copie WebP delle foto prodotto (`<nome>.webp` 1600 px, `<nome>-sm.webp` 480 px): il sito usa queste, il catalogo continua a indicare l'originale |
| `api/` | **Serverless Functions** (area riservata: auth + CRUD catalogo/news/documenti/posizioni + impostazioni sito) |
| `vercel.json` | Configurazione deploy: rewrite `/admin`, **header di sicurezza** (CSP, anti-clickjacking, nosniff…) e cache |
| `.vercelignore` | File del repo da non pubblicare (`docs/`, README) |

### Foto prodotto nuove

Le foto in `img/img_prd/` sono gli originali ad alta risoluzione. Per una foto nuova aggiungere anche le due
copie in `img/img_prd/web/` (WebP, lato lungo 1600 px e 480 px, stesso nome + `-sm` per la piccola). Senza
copie il sito funziona lo stesso (ricade sull'originale), ma la pagina è molto più pesante.

## Area riservata (admin) — backend

L'area riservata usa **Vercel Serverless Functions** (`api/`) con storage su **Vercel Blob** e un
**account admin** (username/email + password) configurato nelle variabili d'ambiente.

- **Accesso:** solo da URL diretto **`/admin`** (da salvare nei preferiti). Il sito pubblico non contiene
  link all'area riservata; `vercel.json` riscrive `/admin` su `index.html` e lo marca `noindex`.
- **Sessione:** al login il server crea una sessione (id casuale registrato sul Blob, 12 ore) e la invia in
  un cookie `HttpOnly; Secure; SameSite=Strict` firmato HMAC. Ogni API protetta verifica firma, scadenza e
  registro. Il **logout** rimuove la sessione dal registro: il vecchio cookie non vale più, anche se copiato.
  Cambiare password, username o `AUTH_SECRET` chiude tutte le sessioni aperte.
- **Senza sessione** il pannello resta coperto dal login e ogni API riservata risponde `401`: scritture
  (catalogo, news, documenti, posizioni, impostazioni), upload, storico trasferte e `api/geo`.
  Prodotti e news in **bozza** non escono dalle GET pubbliche.
- Le collezioni private (`trips`, `sessions`) sono salvate sul Blob con un nome casuale non indovinabile,
  non a un path fisso (lo store è ad accesso pubblico per URL).

Le GET dei contenuti pubblicati sono pubbliche (il sito le legge). Se il backend non è configurato o non
risponde, il sito pubblico **ricade automaticamente sui dati statici** e resta perfettamente funzionante;
l'area riservata invece resta chiusa (nessun accesso senza le variabili d'ambiente e il Blob).

- **Prodotto in evidenza in home** (Dashboard → "Prodotto in evidenza in home"): l'admin sceglie il
  prodotto mostrato nella card in alto della home, oppure "Casuale" (cambia a ogni visita). Salvato in
  `api/settings.js` (collezione `settings`, GET pubblica / PUT protetta).
- **Tag / parole chiave** dei prodotti: usati dalla ricerca del sito insieme a nome, codice, sintesi,
  norma e categoria. I prodotti in **bozza** non compaiono sul sito pubblico.

### Tool "Trasferte & trasporti" (BETA, dentro l'area riservata)

Nel pannello admin (sidebar → sezione **Strumenti → Trasferte & trasporti**) c'è un calcolatore dei
costi di trasferta accessibile **solo dopo il login**. Calcola distanza, consumo carburante e costo
totale del viaggio, con storico salvato sul backend.

- **Distanza/percorso** (`api/geo.js`, proxy server-side, protetto da auth): funziona **senza alcuna
  chiave** usando OpenStreetMap **Nominatim** (indirizzi) + **OSRM** (percorso). Se imposti
  `ORS_API_KEY` (opzionale) usa invece **OpenRouteService**, con la chiave che resta solo lato server.
  In ogni caso si possono sempre inserire i **km a mano**.
  > ⚠️ Le `/api/*` girano solo con `server.js` (`npm run dev` / `npm start`, Hostinger) o su Vercel:
  > aprendo `index.html` con un server statico qualsiasi autocomplete/routing e storico non sono
  > disponibili (il calcolo con km manuali resta comunque utilizzabile).
- **Storico**: collezione privata `trips` su Vercel Blob (`api/trips.js`), con **GET protetta** oltre
  alle scritture (a differenza di catalogo/news/documenti/posizioni, che hanno GET pubblica).
- **Export**: ogni riepilogo è esportabile in **CSV** o via **stampa/PDF**.
- **Fallback morbido**: se `ORS_API_KEY` manca o ORS non risponde, il tool avvisa e passa ai km manuali.

### Setup (una tantum)

1. **Crea il Blob store**: Vercel → progetto → **Storage → Create → Blob** → connetti al progetto
   (Vercel inserisce in automatico `BLOB_READ_WRITE_TOKEN`).
2. **Imposta le variabili d'ambiente** (Settings → Environment Variables), vedi `.env.example`:
   - `ADMIN_USERNAME` — username o email dell'account admin.
   - `ADMIN_PASSWORD` — password (in chiaro o, meglio, hash `scrypt:…` generato col comando in `.env.example`).
   - `AUTH_SECRET` — segreto per firmare il cookie, almeno 32 caratteri (`openssl rand -hex 32`).
   - `ORS_API_KEY` — (opzionale) chiave OpenRouteService per il tool "Trasferte & trasporti".
3. Redeploy, poi apri `https://<dominio>/admin`.

### Sviluppo locale dell'area riservata

```bash
npm install
# crea .env.local con ADMIN_USERNAME, ADMIN_PASSWORD, AUTH_SECRET e BLOB_READ_WRITE_TOKEN (vedi .env.example)
npm run dev            # sito + API su http://localhost:3000 (area riservata: /admin)
```

> In alternativa `npm run dev:vercel` (Vercel CLI, `vercel link` + `vercel env pull .env.local`).
> Il cookie di sessione è `Secure`: i browser lo accettano anche su `http://localhost`, non su altri host senza HTTPS.

## Deploy su Vercel

Il progetto è pronto per Vercel come sito statico (nessuna build necessaria):

1. Importa la repository su [vercel.com](https://vercel.com/new).
2. **Framework Preset:** Other — **Build Command:** _(vuoto)_ — **Output Directory:** `.` (root).
3. Deploy.

Ad ogni `git push` sul branch `main` Vercel pubblica automaticamente la nuova versione.

## Deploy su Hostinger (app web Node.js)

`server.js` fa quello che su Vercel fanno la piattaforma e `vercel.json`: esegue gli handler `api/*.js`
invariati, serve **solo** i file statici del sito (sorgenti, `docs/`, `.env`, `package.json` → 404) e
applica rewrite di `/admin`, redirect, cache e header di sicurezza. Lo storage resta **Vercel Blob**.

1. hPanel → **Siti web → Aggiungi sito web → App web Node.js**, collegata a questo repository GitHub
   (oppure caricando lo zip del progetto). Node **22**, comando di avvio `npm start`, file `server.js`.
2. **Variabili d'ambiente** dell'app: `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `AUTH_SECRET`,
   `BLOB_READ_WRITE_TOKEN` (il *read-write token* dello store `magixsrl-data`: fuori da Vercel l'OIDC non vale),
   `ORS_API_KEY` facoltativa. Mai in un file dentro la cartella del sito.
3. **SSL** attivo e **Forza HTTPS** in hPanel: il redirect HTTP → HTTPS non lo fa `server.js`.
4. Verifiche e passaggio DNS: [`docs/piano-migrazione-hostinger.md`](docs/piano-migrazione-hostinger.md), sezioni 4 e 5.

Gli header di sicurezza sono scritti sia in `vercel.json` sia in `server.js`: vanno modificati in entrambi
(il test `tests/server-tests.mjs` segnala se divergono).
