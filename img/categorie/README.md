# Immagini delle categorie prodotto

Le card del catalogo (pagina **Prodotti**) caricano automaticamente un'immagine
se presente in questa cartella. Finché il file non esiste, resta lo sfondo
materico di default — quindi puoi aggiungere o sostituire le foto **una alla volta**, quando vuoi.

La foto si scarica solo quando la card sta per comparire sullo schermo (le altre
pagine del sito non la caricano) e riempie l'area foto della card (proporzione
**4:3**) ritagliata al centro, senza deformarla.

## Come aggiungere o sostituire un'immagine

1. Prepara la foto (consigliato **1200×900**, formato orizzontale; il soggetto
   al centro, perché i bordi possono essere tagliati per adattarla alla card).
2. Salvala in `img/categorie/` con **esattamente** il nome indicato sotto.
3. Formati supportati: `.jpg` · `.png` · `.webp` (provati in quest'ordine:
   il `.jpg` è il più rapido da trovare).
4. Ricarica la pagina: l'immagine compare al posto dello sfondo materico.

Nessuna modifica al codice è necessaria.

## Immagini presenti

Tutte recuperate dalle card categoria del vecchio sito (pagine *Prodotti* e
*Rivestimenti e idropitture*). L'abbinamento segue la card del vecchio sito su cui
era mostrata la foto (verificato anche sui prodotti contenuti), **non** il nome del
file originale: ad esempio `malte-da-finitura.jpg` del vecchio sito era la foto
dei *rinzaffi*.

### Sottocategorie — Malte
| File | Foto originale (vecchio sito) |
|---|---|
| `adesivi-cementizi.jpg` | `2021/01/adesivi_cementizi.jpg` |
| `linea-bio.jpg` | `2021/02/malte-bio-preview.png` |
| `malte-da-intonaco.jpg` | `2021/01/malte-da-intonaco.jpg` |
| `malte-rapide.jpg` | `2021/01/malte-rapide.jpg` |
| `malte-da-ripristino.jpg` | `2021/01/malte-da-ripristino.jpg` |
| `malta-antincendio.jpg` | `2021/01/malta-antincendio.jpg` |
| `legante-premiscelato.jpg` | `2021/01/legante-premiscelato.jpg` |
| `malte-da-massetto.jpg` | `2021/01/malte-da-massetto.jpg` |
| `malte-da-rasatura.jpg` | `2021/02/malte-rasatura.png` |
| `sistema-a-cappotto.jpg` | `2021/01/sistema-a-cappotto.jpg` |
| `malta-impermeabilizzante.jpg` | `2021/01/malta-impermeabile.jpg` |
| `linea-deumidificanti.jpg` | `2021/03/risananti.jpg` |
| `malte-da-muratura.jpg` | `2021/02/malte-muratura-termica.png` |
| `primer-monocomponente.jpg` | `2023/10/bg-primer.jpg` |
| `ciclo-calcestruzzo-autoclavato.jpg` | `2021/02/calcestruzzo-autoclavato-preview.png` |
| `malte-da-finitura.jpg` | `2021/02/malte_finitura_magix.png` |
| `malte-da-muratura-facciavista.jpg` | `2021/01/malte-da-muratura.jpg` |
| `malte-da-rinzaffo.jpg` | `2021/01/malte-da-finitura.jpg` |

### Sottocategorie — Rivestimenti e idropitture
| File | Foto originale (vecchio sito) |
|---|---|
| `rivestimenti.jpg` | `2025/10/acrilico-rivestimento.webp` |
| `idropitture.jpg` | `2025/10/idropittura-bg.webp` |
| `rivestimenti-per-esterni.jpg` | `2025/10/rivestimenti-ext.webp` |

I `.jpg` originali sono copiati senza ricompressione; i `.png` e i `.webp` sono
stati convertiti in `.jpg` (i `.webp` ridotti a 1200 px di larghezza).

> Il nome del file corrisponde al nome della categoria in minuscolo, con i
> trattini al posto degli spazi. Vale anche per le categorie create dall'area
> riservata: basta aggiungere qui il file con il nome giusto.
