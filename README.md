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
| `api/` | **Serverless Functions** (area riservata: auth + CRUD catalogo/news/documenti/posizioni + impostazioni sito) |
| `vercel.json` | Configurazione deploy |

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
  > ⚠️ Le funzioni serverless servono solo online (Vercel) o in locale con `vercel dev`: con `npm start`
  > (server statico) le `/api/*` non girano, quindi autocomplete/routing e storico non sono disponibili
  > (il calcolo con km manuali resta comunque utilizzabile).
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
npm i -g vercel        # se non presente
vercel link            # collega la cartella al progetto Vercel
vercel env pull .env.local   # scarica BLOB_READ_WRITE_TOKEN
# aggiungi ADMIN_USERNAME, ADMIN_PASSWORD e AUTH_SECRET in .env.local (vedi .env.example)
vercel dev             # serve sito + functions su http://localhost:3000 (area riservata: /admin)
```

> Senza `vercel dev` (es. `npm start`) le API non sono attive: il sito gira comunque sui dati statici,
> ma l'area riservata non è raggiungibile (né `/admin` né il login funzionano).

## Deploy su Vercel

Il progetto è pronto per Vercel come sito statico (nessuna build necessaria):

1. Importa la repository su [vercel.com](https://vercel.com/new).
2. **Framework Preset:** Other — **Build Command:** _(vuoto)_ — **Output Directory:** `.` (root).
3. Deploy.

Ad ogni `git push` sul branch `main` Vercel pubblica automaticamente la nuova versione.
