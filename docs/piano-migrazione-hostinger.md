# Piano di migrazione dell'hosting: Vercel → Hostinger

> **Stato:** pronto, non avviato. Scritto il 4 ottobre 2026 sullo stato del codice di quella data
> (area riservata su `/admin` con login username/password e sessioni registrate sul Blob).
> Prima di partire, ricontrolla la sezione 1: se nel frattempo il backend è cambiato, l'inventario va aggiornato.

## In breve

| Opzione | Cosa si fa | Quando sceglierla |
|---|---|---|
| **A — consigliata** | Hostinger con **Node.js** + un piccolo `server.js`; lo storage resta su **Vercel Blob** | prima migrazione: modifiche minime, nessun dato da spostare, rollback immediato |
| B | come A, ma lo storage passa su **disco Hostinger** | fase successiva, solo se si vuole uscire del tutto da Vercel |
| ✗ sconsigliata | hosting solo statico o PHP | l'area riservata andrebbe riscritta da zero in PHP |

Se lo scopo è solo avere **dominio o email su Hostinger**, non serve migrare: basta puntare il DNS del dominio
a Vercel (Vercel → Project → Domains), senza toccare il codice.

---

## 1. Inventario: cosa dipende oggi da Vercel

| Componente | Dove | Dipendenza da Vercel | Su Hostinger |
|---|---|---|---|
| API (`auth`, `catalog`, `news`, `documents`, `positions`, `settings`, `trips`, `geo`, `upload`) | `api/*.js` | eseguite come Vercel Functions | servono tramite `server.js`. Usano solo `req.method/query/body/headers`, `res.status().json()` e `res.setHeader`: **gli handler restano invariati** |
| Rewrite `/admin` → `index.html` | `vercel.json` | sì | nel `server.js` |
| `X-Robots-Tag: noindex, nofollow` su `/admin` e `/api/*` | `vercel.json` | sì | nel `server.js` |
| Header di sicurezza su tutte le risposte (Content-Security-Policy, `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`, `Cross-Origin-Opener-Policy`) | `vercel.json` | sì | nel `server.js`, **stessi valori** (copiarli da `vercel.json`) |
| Cache dei file statici (`img/`, `documents/` 1 giorno; `fonts/`, `vendor/` 1 anno, `immutable`) | `vercel.json` | sì | nel `server.js` |
| `cleanUrls` (`/index.html` → `/`) e `trailingSlash: false` (`/admin/` → `/admin`) | `vercel.json` | sì | redirect nel `server.js` |
| File **non** pubblicati (`api/**`, `package.json`; `docs/`, `README.md`, `.env.example` via `.vercelignore`) | regola di Vercel + `.vercelignore` | sì | **elenco esplicito** dei file servibili nel `server.js` (vedi 3.1) |
| Storage (contenuti, sessioni, storico trasferte, upload) | `api/_lib/store.js`, `api/upload.js` | Vercel Blob | Opzione A: resta Blob (funziona anche fuori da Vercel con `BLOB_READ_WRITE_TOKEN`); Opzione B: disco |
| Upload diretto browser → Blob | `script.js` (`uploadFile`, importa `@vercel/blob@0.27.3/client` da esm.sh) | Blob | A: invariato · B: da riscrivere |
| Variabili d'ambiente | pannello Vercel | sì | pannello Hostinger, oppure `.env` **fuori** dalla cartella pubblica |
| Deploy automatico a ogni push su `main` | integrazione Git di Vercel | sì | integrazione GitHub di Hostinger, se disponibile sul piano, altrimenti deploy manuale |
| HTTPS, CDN, compressione | Vercel | sì | SSL gratuito Hostinger (**obbligatorio**: il cookie di sessione è `Secure`); verificare gzip/brotli |

Indipendenti dall'hosting (nessuna modifica): Tailwind e font sono file del sito (`vendor/`, `fonts/`), esm.sh, i servizi di
geocoding/percorso (Nominatim/OSRM/ORS, chiamati dal server), link WhatsApp/Instagram.

Versione di Node: serve **≥ 18** (`fetch` globale, `base64url`, `crypto.randomUUID`); meglio **≥ 20.6**
per usare `node --env-file` in locale.

## 2. Requisiti del piano Hostinger (da verificare PRIMA di acquistare)

Al 4 ottobre 2026 la pagina prezzi di Hostinger indica "Node.js" sui piani Premium, Unlimited e Cloud
Startup. Nomi e contenuti dei piani cambiano: verifica sul piano che scegli.

- [ ] App **Node.js** supportate, con versione selezionabile **≥ 20** (ideale 22)
- [ ] Comando di avvio configurabile (`npm start`) e porta letta da `process.env.PORT`
- [ ] `npm install` eseguito al deploy (serve `@vercel/blob`)
- [ ] **Variabili d'ambiente** impostabili da pannello
- [ ] Processo sempre attivo con riavvio automatico; **quante istanze** (conta per la cache in memoria e per l'Opzione B)
- [ ] Richieste in uscita verso internet consentite (Vercel Blob, Nominatim/OSRM/ORS)
- [ ] Log del processo consultabili
- [ ] SSL gratuito, redirect HTTP → HTTPS, compressione
- [ ] Deploy da GitHub (meglio se automatico a ogni push)
- [ ] Limiti di RAM e timeout (il login usa scrypt, ~16 MB; un login fallito risponde dopo ~0,8 s)
- [ ] *Solo per l'Opzione B:* filesystem **persistente tra un deploy e l'altro** e backup

Se il piano non ha Node.js → **VPS Hostinger** (nginx + Node + pm2/systemd + certbot), con lo stesso `server.js`.

## 3. Opzione A — passi

### 3.1 `server.js` (nuovo, solo moduli di Node + `@vercel/blob` già presente)

- [ ] `http.createServer`, in ascolto su `process.env.PORT || 3000`
- [ ] **API:** `/api/<nome>` solo per i nomi dell'elenco `auth, catalog, news, documents, positions, settings, trips, geo, upload`
      → `require("./api/<nome>.js")(req, res)`, con un adattatore in stile Vercel:
  - `req.query` dai parametri dell'URL
  - `req.body`: JSON parsato se `Content-Type` è json (400 se malformato), altrimenti stringa; **limite 1 MB** (413)
  - `res.status(code)` concatenabile, `res.json(obj)` (imposta `content-type` e chiude la risposta)
  - eccezioni dell'handler → 500, con log
- [ ] **Redirect:** `/index.html` → `/` (301) e slash finale → senza (`/admin/` → `/admin`, 308)
- [ ] **`/admin`** → contenuto di `index.html` + `X-Robots-Tag: noindex, nofollow`
- [ ] **File statici, solo questi:** `/`, `/index.html`, `/script.js`, `/styles.css`, `/catalog-data.js`,
      `/tailwind-config.js`, `/fonts.css`, `/favicon.ico`, `/img/**`, `/documents/**`, `/fonts/**`, `/vendor/**`. Tutto il resto → 404, così `api/`, `package.json`, `README.md`, `.env*`, `docs/`
      e `.git` non vengono **mai** serviti. Protezione dal path traversal (decodifica, normalizza, controlla la radice).
- [ ] Header dei file statici: `content-type` per estensione (html, js, css, png, jpg, webp, svg, pdf, json, ico, woff2);
      `Cache-Control: public, max-age=0, must-revalidate` per html/js/css (i nomi non hanno hash), quelli di `vercel.json`
      per `img/`, `documents/`, `fonts/`, `vendor/`; `ETag` / `Last-Modified` con risposta 304
- [ ] Header di sicurezza **su ogni risposta**, uguali a quelli di `vercel.json` (CSP compresa), più
      `Strict-Transport-Security` (su Vercel lo aggiunge la piattaforma)

L'adattatore esiste già nell'harness di test (`authsrv.mjs`, sezione 7): la versione di produzione è quella,
senza i mock e con l'elenco dei file servibili e i limiti.

### 3.2 `package.json`

- [ ] `"start": "node server.js"`. **Non** lasciare l'attuale `serve -l 3000 .`: non esegue le API e pubblicherebbe i sorgenti.
- [ ] `"dev": "node --env-file=.env.local server.js"` (sviluppo locale senza Vercel CLI)
- [ ] `"engines": { "node": ">=20" }`
- [ ] Togliere `serve` dalle devDependencies se non serve più; `@vercel/blob` resta (allineato allo `0.27.3` usato da `script.js`)

### 3.3 Storage: Vercel Blob resta

- [ ] Copiare il `BLOB_READ_WRITE_TOKEN` dello store dal dashboard Vercel (Storage → store). Sui progetti Vercel
      l'autenticazione predefinita ora è OIDC, ma **fuori da Vercel serve il read-write token**
      (documentazione Vercel Blob, "When to use a read-write token").
- [ ] L'account Vercel (anche gratuito) e lo store devono restare attivi. Lo store appartiene al team, non al
      progetto: prima di eliminare il progetto Vercel, verificare che lo store resti.
- [ ] Nessuna migrazione di dati: Vercel e Hostinger leggono e scrivono **lo stesso store**, quindi possono
      convivere durante il passaggio e il rollback è immediato.

### 3.4 Variabili d'ambiente su Hostinger

`ADMIN_USERNAME`, `ADMIN_PASSWORD` (meglio l'hash `scrypt:…`, vedi `.env.example`), `AUTH_SECRET`
(si può generarne uno nuovo: obbliga solo a rifare il login), `BLOB_READ_WRITE_TOKEN`, `ORS_API_KEY` (facoltativa).
Mai in un file dentro una cartella servita.

### 3.5 Documentazione

- [ ] README: sezione "Deploy su Hostinger" (avvio, variabili, verifiche)
- [ ] `vercel.json`: tenerlo finché il progetto Vercel serve da rollback, poi rimuoverlo
- [ ] Spuntare questo piano e annotare data e esito

## 4. Verifiche in staging (prima di toccare il DNS)

Pubblica su un dominio temporaneo o su un sottodominio (es. `staging.<dominio>`) **con HTTPS**: senza HTTPS il cookie `Secure` non viene salvato.

- [ ] **Sito pubblico:** home, prodotti → categoria → scheda, preferiti, ricerca, news, download (PDF), tasto
      indietro; nessun link o testo "Area riservata"
- [ ] **`/admin`:** login visibile; credenziali errate → negato; corrette → pannello con dati (bozze comprese),
      storico trasferte, autocomplete indirizzi funzionante
- [ ] **Scritture:** crea, modifica ed elimina in ogni pannello; il risultato si vede sul sito pubblico
- [ ] **Upload** di un'immagine prodotto → URL del Blob, visibile in pubblico
- [ ] **Logout:** un vecchio cookie copiato e riusato (es. con `curl`) → `401`
- [ ] **Non serviti (404):** `/api/_lib/auth.js`, `/api/_seed/catalog.json`, `/package.json`, `/README.md`,
      `/.env`, `/.env.example`, `/docs/piano-migrazione-hostinger.md`
- [ ] **Header e redirect:** `X-Robots-Tag` su `/admin`, HTTP → HTTPS, `/index.html` → `/`, `/admin/` → `/admin`,
      cookie `HttpOnly; Secure; SameSite=Strict`
- [ ] **Prestazioni:** Lighthouse simile a Vercel, compressione attiva
- [ ] **Log** del server puliti

## 5. Passaggio DNS e rollback

1. 48 ore prima: abbassare il TTL dei record del dominio e di `www` a 300 s.
2. Puntare i record A/AAAA (e `www`) ai valori indicati da Hostinger e togliere quelli di Vercel. **Non toccare i record MX** (posta).
3. Attendere l'emissione dell'SSL e ripetere in produzione le verifiche della sezione 4.
4. **Rollback:** ripuntare il DNS a Vercel. Lasciare il progetto Vercel attivo, con le stesse variabili, per almeno 2 settimane. I dati sono coerenti perché lo store è lo stesso.
5. A regime: togliere il dominio dal progetto Vercel, ma tenere account e store Blob.

## 6. Opzione B — uscire anche da Vercel Blob (facoltativa, dopo A)

- [ ] `api/_lib/store.js`: `readCollection`/`writeCollection` su file JSON in una `DATA_DIR` **fuori** dalle cartelle
      servite, con scrittura atomica (file temporaneo + `rename`). Stessa interfaccia, quindi gli handler non cambiano.
      Le collezioni private (`trips`, `sessions`) non vengono servite e il suffisso casuale non serve più.
      La lettura `strict` va mantenuta.
- [ ] Upload: il browser oggi carica direttamente sul Blob. Al suo posto va un **upload multipart al server**
      (`/api/upload` valida tipo e dimensione, max 25 MB, salva in `UPLOAD_DIR` e restituisce `/uploads/…`).
      Va riscritto `uploadFile` in `script.js` (`fetch` con `FormData`) e tolto l'import da esm.sh.
      Il parsing multipart senza dipendenze è laborioso: valutare `busboy`.
- [ ] Migrazione dati: scaricare `magix-data/*.json`, l'ultima versione di `magix-private/*` e tutti i file
      caricati; negli JSON sostituire gli URL `*.public.blob.vercel-storage.com/…` con `/uploads/…`.
- [ ] Requisiti: filesystem persistente tra i deploy, **una sola istanza** (altrimenti le scritture vanno in
      conflitto), backup automatici e copia periodica dei JSON.
- MySQL è possibile ma sproporzionato per questi volumi di dati.

## 7. Strumenti di test già pronti

Scritti per il lavoro sull'area riservata (4 ottobre 2026), oggi in **`%TEMP%\mxt\`**. È una cartella temporanea:
**come primo passo della migrazione, spostarli nel repo** (es. `tests/`).

- `authsrv.mjs`: server compatibile con Vercel che esegue i veri `api/*.js`, con `@vercel/blob` simulato in memoria
- `api-tests.mjs`: ~105 controlli su login, sessioni, logout, API protette, bozze, storico privato, configurazione mancante
- `browser-tests.mjs`: Edge headless; `auth` per il flusso completo dell'area riservata, `public` per l'"impronta"
  del sito pubblico da confrontare prima/dopo
- `cdp.mjs`: pilotaggio di Edge via DevTools Protocol (su questa macchina Chrome non si avvia da script)

Dopo la migrazione, `server.js` può prendere il posto di `authsrv.mjs` nei test: così si verifica lo stesso server che va in produzione.

## 8. Da valutare durante la migrazione (fuori ambito, emersi dall'analisi)

- **I form Contatti e "Lavora con noi" non inviano nulla:** `script.js` mostra "Richiesta inviata" e svuota il
  form, ma i dati non vanno da nessuna parte. Hostinger include caselle email/SMTP: è il momento giusto per un
  vero invio (es. `/api/contact` via SMTP, con anti-spam e allegato CV per le candidature).
- **Cache in memoria delle GET pubbliche** nel `server.js`: il processo resta attivo, quindi si possono ridurre le
  operazioni `list()` sul Blob (oggi una per ogni GET pubblica a ogni visita), invalidando la cache a ogni scrittura.
  Vale solo con un'istanza unica.
- **Store Blob privati:** Vercel Blob ora li offre. Se si crea un nuovo store, valutarlo per `trips`/`sessions`
  al posto del suffisso casuale.

## 9. Stima indicativa

- Opzione A: `server.js`, `package.json` e documentazione ~½ giornata; staging e verifiche ~½ giornata;
  passaggio DNS e monitoraggio 1–2 giorni di calendario, con poco lavoro attivo.
- Opzione B: 2–3 giornate in più, soprattutto per upload e migrazione dei file.
