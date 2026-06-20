/* ════════════════════════════════════════════════════════════════════════
   MAGIX — Catalogo prodotti (fonte: schede tecniche ufficiali Magix Srl)
   Struttura dati unica del catalogo. Ogni prodotto riporta SOLO i dati
   presenti nella scheda tecnica: nessun valore è stato inventato.
   I campi vuoti/non presenti nel PDF sono omessi.

   Chiavi categoria = stesse usate dalle subcat-card (data-name) in index.html
   così la navigazione esistente resta invariata.
   ════════════════════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  // nota legale comune a tutte le schede tecniche Magix
  const DISCLAIMER =
    "I valori si riferiscono a prove effettuate in laboratorio in ambiente controllato e possono variare secondo le condizioni di messa in opera. L'applicatore deve valutare la piena idoneità del materiale all'impiego previsto. Magix Srl si riserva il diritto di modificare le specifiche tecniche senza preavviso. Consultare sempre la versione aggiornata della scheda tecnica su www.magixsrl.it.";

  const CATALOG = {
    "malte da intonaco": {
      label: "Malte da intonaco",
      mat: "mat-white",
      intro:
        "Intonaci di fondo premiscelati a base cementizia e a base gesso per interni ed esterni, applicabili a macchina o a mano su laterizio, calcestruzzo e tufo.",
      seo: {
        title: "Malte da intonaco premiscelate | Magix",
        description:
          "Intonaci di fondo Magix a base cemento, cemento bianco e gesso, fibrorinforzati e CAM. Schede tecniche complete: MT01, MT06, MT11, INTOPLASTER, INTOFIBRA.",
      },
      products: [
        {
          code: "MT01",
          name: "MT01",
          subtitle: "Intonaco di fondo a base di cemento e calce per interni ed esterni",
          mat: "mat-grey",
          norma: "UNI EN 998-1 GP-CSIV",
          cam: false,
          availability: "stock",
          composizione:
            "Malta secca composta da cemento grigio Portland, calce idrata, inerti calcarei ed additivi specifici che ne migliorano le caratteristiche di lavorabilità e prestazionali.",
          impiego:
            "Intonaco di fondo cementizio per interni ed esterni da applicare su supporti in laterizio, blocchi in calcestruzzo, calcestruzzo grezzo, tufo. Per applicazioni particolari consultare l'ufficio tecnico.",
          fornitura: ["Sacchi da 25 kg in carta kraft con triplo strato di cui uno in polietilene", "Sfuso in silo"],
          applicazione:
            "Lavorabile con macchine intonacatrici tipo PFT, PUTZKNECHT, TURBOSOL o similari. Per applicazione manuale aggiungere il 23% di acqua pulita ad ogni sacco (circa 5,75 litri). Si applica in un unico strato da 10-15 mm; per spessori superiori applicare più strati a distanza di 1 giorno irruvidendo lo strato precedente.",
          avvertenze: [
            "Miscelare con sola acqua, senza aggiunta di altri prodotti.",
            "Temperatura di impiego tra +5°C e +35°C.",
            "Non applicare su supporti gelati o disgregati.",
            "Finiture e pitture solo dopo completa essiccazione e stagionatura (28 gg).",
            "Non idoneo a rivestimenti in ceramica.",
          ],
          spec: {
            "Granulometria (EN-1015-1)": "< 1,5 mm",
            "Acqua d'impasto": "23%",
            "Massa volumica apparente": "1450 ± 50 Kg/m³",
            "Densità malta fresca (EN-1015-6)": "1550 ± 50 Kg/m³",
            "Densità malta indurita": "1300 Kg/m³",
            "Resa teorica a spessore 10 mm": "12,6 Kg/m² ± 5%",
            "Resistenza a flessione (EN-1015-11)": "1 N/mm²",
            "Resistenza a compressione (EN-1015-11)": "3 N/mm²",
            "Resistenza diffusione vapore (EN-1015-19)": "μ=15",
            "Conducibilità termica (EN-1745)": "λ = 0,45 W/mK",
            "Reazione al fuoco (EN-13501-1)": "Classe A1",
            "Tempo di presa (EN-196-3)": "350 ± 30 min",
            "Spessore di applicazione": "10 – 15 mm",
            "pH": "12,1",
          },
          seo: {
            title: "MT01 — Intonaco di fondo cemento e calce | Magix",
            description:
              "MT01 Magix: intonaco di fondo cementizio per interni ed esterni, conforme UNI EN 998-1 GP-CSIV. Scheda tecnica, resa e modalità di applicazione.",
          },
        },
        {
          code: "MT06",
          name: "MT06",
          subtitle: "Intonaco di fondo a base di cemento bianco e calce per interni ed esterni",
          mat: "mat-white",
          norma: "UNI EN 998-1 GP-CSII-W0",
          cam: false,
          availability: "stock",
          composizione:
            "Malta secca composta da cemento bianco Portland, calce idrata, inerti calcarei ed additivi specifici che ne migliorano le caratteristiche di lavorabilità e prestazionali.",
          impiego:
            "Intonaco di fondo cementizio per interni ed esterni da applicare su supporti in laterizio, blocchi in calcestruzzo, calcestruzzo grezzo, tufo. Per applicazioni particolari consultare l'ufficio tecnico.",
          fornitura: ["Sacchi da 25 kg in carta kraft con triplo strato di cui uno in polietilene", "Sfuso in silo"],
          applicazione:
            "Lavorabile con macchine intonacatrici tipo PFT, PUTZKNECHT, TURBOSOL o similari. Per applicazione manuale aggiungere il 21% di acqua pulita ad ogni sacco (circa 5,25 litri). Si applica in un unico strato da 10-15 mm; per spessori superiori applicare più strati a distanza di 1 giorno irruvidendo lo strato precedente.",
          avvertenze: [
            "Miscelare con sola acqua, senza aggiunta di altri prodotti.",
            "Temperatura di impiego tra +5°C e +35°C.",
            "Non applicare su supporti gelati o disgregati.",
            "Finiture e pitture solo dopo completa essiccazione e stagionatura (28 gg).",
            "Non idoneo a rivestimenti in ceramica.",
          ],
          spec: {
            "Granulometria (EN-1015-1)": "< 1,5 mm",
            "Acqua d'impasto": "21%",
            "Massa volumica apparente": "1450 ± 50 Kg/m³",
            "Densità malta fresca": "1550 ± 50 Kg/m³",
            "Densità malta indurita": "1300 Kg/m³",
            "Resa teorica a spessore 10 mm": "12,81 Kg/m² ± 5%",
            "Resistenza a flessione (EN-1015-11)": "1,5 N/mm²",
            "Resistenza a compressione (EN-1015-11)": "3,2 N/mm²",
            "Resistenza diffusione vapore (EN-1015-19)": "μ=15",
            "Conducibilità termica (EN-1745)": "λ = 0,44 W/mK",
            "Reazione al fuoco (EN-13501-1)": "Classe A1",
            "Tempo di presa (EN-196-3)": "250 ± 30 min",
            "Spessore minimo di applicazione": "10 mm",
          },
          seo: {
            title: "MT06 — Intonaco di fondo cemento bianco | Magix",
            description:
              "MT06 Magix: intonaco di fondo a base di cemento bianco e calce, interni ed esterni, conforme UNI EN 998-1 GP-CSII-W0. Scheda tecnica completa.",
          },
        },
        {
          code: "MT11",
          name: "MT11",
          subtitle:
            "Intonaco di fondo fibrorinforzato-resinato a base di cemento e calce, antistrappo da rivestimento ceramico",
          mat: "mat-grey",
          norma: "UNI EN 998-1 GP-CSII-W0",
          cam: false,
          availability: "order",
          composizione:
            "Malta secca composta da cemento grigio Portland, calce idrata, fibre polimeriche sintetiche, inerti calcarei ed additivi specifici che ne migliorano le caratteristiche di lavorabilità e prestazionali.",
          impiego:
            "Intonaco di fondo cementizio fibrorinforzato, resinato, per interni ed esterni su laterizio, termolaterizio, blocchi in cemento (normale o alleggerito), tufo o calcestruzzo. Particolarmente adatto su facciate esterne e a sostenere rivestimenti in marmo o pietra (con adesivi idonei).",
          fornitura: ["Sacchi da 25 kg in carta kraft con triplo strato di cui uno in polietilene", "Sfuso in silo"],
          applicazione:
            "Lavorabile con macchine intonacatrici tipo PFT, PUTZKNECHT, TURBOSOL o similari. Per applicazione manuale aggiungere il 23% di acqua pulita ad ogni sacco (circa 5,75 litri). Si applica in un unico strato da 10-15 mm; per spessori superiori applicare più strati a distanza di 1 giorno. Frattazzare o grattare l'intonaco.",
          avvertenze: [
            "Miscelare con sola acqua, senza aggiunta di altri prodotti.",
            "Temperatura di impiego tra +5°C e +35°C.",
            "Non applicare su supporti gelati o disgregati.",
            "Finiture, rivestimenti e pitture solo dopo completa essiccazione e stagionatura (28 gg).",
          ],
          spec: {
            "Granulometria (EN-1015-1)": "< 1,5 mm",
            "Acqua d'impasto": "23%",
            "Massa volumica apparente": "1450 ± 50 Kg/m³",
            "Densità malta fresca": "1600 ± 50 Kg/m³",
            "Densità malta indurita": "1300 Kg/m³",
            "Resa teorica a spessore 10 mm": "13 Kg/m² ± 5%",
            "Resistenza a flessione (EN-1015-11)": "1,1 N/mm²",
            "Resistenza a compressione (EN-1015-11)": "3,3 N/mm²",
            "Resistenza diffusione vapore (EN-1015-19)": "μ=15",
            "Conducibilità termica (EN-1745)": "λ = 0,46 W/mK",
            "Reazione al fuoco (EN-13501-1)": "Classe A1",
            "Tempo di presa (EN-196-3)": "250 ± 30 min",
            "Spessore di applicazione": "10 – 15 mm",
            "pH": "12,2",
          },
          seo: {
            title: "MT11 — Intonaco fibrorinforzato resinato | Magix",
            description:
              "MT11 Magix: intonaco di fondo fibrorinforzato e resinato antistrappo per rivestimenti ceramici, interni ed esterni. Conforme UNI EN 998-1 GP-CSII-W0.",
          },
        },
        {
          code: "INTOPLASTER",
          name: "INTOPLASTER",
          subtitle: "Intonaco di fondo a base di gesso e calce per interni",
          mat: "mat-white",
          norma: "UNI EN 13279-1 B1-50-2",
          cam: true,
          availability: "stock",
          composizione:
            "Intonaco di fondo a base di gesso emidrato, calce idrata, inerte calcareo e additivi specifici che ne migliorano le caratteristiche di lavorabilità e prestazionali.",
          impiego:
            "Intonaco di fondo per soli interni da applicare su supporti in laterizio, blocchi in calcestruzzo, calcestruzzo grezzo, tufo.",
          fornitura: ["Sacchi da 25 kg in carta kraft con triplo strato di cui uno in polietilene", "Sfuso in silo"],
          applicazione:
            "Lavorabile con macchine intonacatrici tipo PFT, PUTZKNECHT, TURBOSOL o similari. Per applicazione manuale aggiungere circa 6,50 litri di acqua pulita ad ogni sacco. Si applica in un unico strato da 10-20 mm; per spessori superiori applicare più strati con tecnica «fresco su fresco».",
          cam_note:
            "INTOPLASTER CAM, su richiesta, può essere fornita con un contenuto di materia riciclata del 20% sul peso del prodotto, certificato REMADE IN ITALY (CAM) secondo D.M. 23 Giugno 2022 n.256.",
          avvertenze: [
            "Miscelare con sola acqua, senza aggiunta di altri prodotti.",
            "Temperatura di impiego tra +5°C e +35°C.",
            "Non applicare su supporti gelati o disgregati.",
            "Non idoneo a rivestimenti in ceramica di ogni tipo.",
          ],
          spec: {
            "Granulometria (EN-1015-1)": "< 1,5 mm",
            "Acqua d'impasto": "26%",
            "Massa volumica apparente": "1150 ± 50 Kg/m³",
            "Densità malta fresca": "1600 ± 50 Kg/m³",
            "Densità malta indurita": "1300 Kg/m³",
            "Resa teorica a spessore 10 mm": "12,7 Kg/m² ± 5%",
            "Resistenza a flessione (EN-1015-11)": "1,1 N/mm²",
            "Resistenza a compressione (EN-1015-11)": "2,3 N/mm²",
            "Resistenza diffusione vapore (EN-1015-19)": "μ=10",
            "Conducibilità termica (EN-1745)": "λ = 0,47 W/mK",
            "Reazione al fuoco (EN-13501-1)": "Classe A1",
            "Tempo di presa (EN-13279-2)": "150 ± 30 min",
            "Spessore di applicazione": "10 – 20 mm",
            "pH": "10",
            "Contenuto di riciclato (CAM 2022)": "20%",
          },
          seo: {
            title: "INTOPLASTER — Intonaco di fondo a gesso CAM | Magix",
            description:
              "INTOPLASTER Magix: intonaco di fondo a base gesso e calce per interni, conforme UNI EN 13279-1 e disponibile in versione CAM. Scheda tecnica completa.",
          },
        },
        {
          code: "INTOFIBRA",
          name: "INTOFIBRA",
          subtitle: "Intonaco di fondo fibrorinforzato a base di cemento e calce per interni ed esterni",
          mat: "mat-ochre",
          norma: "UNI EN 998-1 GP-CSII-W0",
          cam: true,
          availability: "stock",
          composizione:
            "Malta secca composta da cemento grigio Portland, calce idrata, inerti calcarei, fibre sintetiche polimeriche ed additivi specifici che ne migliorano le caratteristiche di lavorabilità e prestazionali.",
          impiego:
            "Intonaco di fondo cementizio fibrorinforzato per interni ed esterni da applicare su supporti in laterizio, blocchi in calcestruzzo, calcestruzzo grezzo, tufo. Per applicazioni particolari consultare l'ufficio tecnico.",
          fornitura: ["Sacchi da 25 kg in carta kraft con triplo strato di cui uno in polietilene", "Sfuso in silo"],
          applicazione:
            "Lavorabile con macchine intonacatrici tipo PFT, PUTZKNECHT, TURBOSOL o similari. Per applicazione manuale aggiungere il 22% di acqua pulita ad ogni sacco (circa 5,50 litri). Si applica in un unico strato da 10-15 mm; per spessori superiori applicare più strati a distanza di 1 giorno irruvidendo lo strato precedente.",
          cam_note:
            "INTOFIBRA CAM, su richiesta, può essere fornita con un contenuto di materia riciclata del 20% sul peso del prodotto, certificato REMADE IN ITALY (CAM) secondo D.M. 23 Giugno 2022 n.256.",
          avvertenze: [
            "Miscelare con sola acqua, senza aggiunta di altri prodotti.",
            "Temperatura di impiego tra +5°C e +35°C.",
            "Non applicare su supporti gelati, disgregati o rivestimenti in ceramica.",
            "Finiture, rivestimenti e pitture solo dopo completa essiccazione e stagionatura (28 gg).",
            "Non idoneo a rivestimenti ceramici.",
          ],
          spec: {
            "Granulometria (EN-1015-1)": "< 1,5 mm",
            "Acqua d'impasto": "22%",
            "Massa volumica apparente": "1400 ± 50 Kg/m³",
            "Densità malta fresca (EN-1015-6)": "1600 ± 50 Kg/m³",
            "Densità malta indurita (EN-1015-10)": "1280 Kg/m³",
            "Resa teorica a spessore 10 mm": "13,1 Kg/m² ± 5%",
            "Resistenza a flessione (EN-1015-11)": "0,9 N/mm²",
            "Resistenza a compressione (EN-1015-11)": "2,4 N/mm²",
            "Resistenza diffusione vapore (EN-1015-19)": "μ=15",
            "Conducibilità termica (EN-1745)": "λ = 0,42 W/mK",
            "Reazione al fuoco (EN-13501-1)": "Classe A1",
            "Tempo di presa (EN-196-3)": "200 ± 30 min",
            "Spessore di applicazione": "10 – 15 mm",
            "pH": "13,3",
            "Contenuto di riciclato (CAM 2022)": "20%",
          },
          seo: {
            title: "INTOFIBRA — Intonaco fibrorinforzato CAM | Magix",
            description:
              "INTOFIBRA Magix: intonaco di fondo fibrorinforzato a base cemento e calce per interni ed esterni, conforme UNI EN 998-1 e disponibile CAM.",
          },
        },
      ],
    },

    "malte da rinzaffo": {
      label: "Malte da rinzaffo",
      mat: "mat-white",
      intro:
        "Rinzaffi cementizi che fungono da ponte d'adesione tra il supporto e l'intonaco di fondo, migliorandone l'aggrappo grazie alla maggiore ruvidità.",
      seo: {
        title: "Malte da rinzaffo cementizio | Magix",
        description:
          "Rinzaffi cementizi Magix come ponte d'adesione per intonaci: RZ16 e RZ19 fibrorinforzato. Schede tecniche, resa e modalità di applicazione.",
      },
      products: [
        {
          code: "RZ16",
          name: "RZ16",
          subtitle: "Rinzaffo cementizio per interni ed esterni",
          mat: "mat-anthr",
          norma: "UNI EN 998-1 GP-CSII-W0",
          cam: false,
          availability: "order",
          composizione:
            "Malta secca composta da cemento grigio Portland, inerti calcarei ed additivi specifici che ne migliorano le caratteristiche di lavorabilità e prestazionali.",
          impiego:
            "Rinzaffo cementizio impiegato come ponte d'adesione tra il supporto e l'intonaco di fondo. Migliora l'adesione per effetto della maggiore ruvidità e riduce l'assorbimento del supporto a favore di una maggiore ritenzione d'acqua dell'intonaco.",
          fornitura: ["Sacchi da 25 kg in carta kraft con triplo strato di cui uno in polietilene"],
          applicazione:
            "Lavorabile con macchine intonacatrici tipo PFT, PUTZKNECHT, TURBOSOL o similari. Per applicazione manuale aggiungere il 19% di acqua pulita ad ogni sacco (circa 5,70 litri). Si applica in un unico strato da 3-5 mm. La malta, dopo miscelazione, va applicata entro 1 ora.",
          avvertenze: [
            "Miscelare con sola acqua, senza aggiunta di altri prodotti.",
            "Temperatura di impiego tra +5°C e +35°C.",
            "Non applicare su supporti gelati o disgregati.",
            "Proteggere la parete dalla rapida essiccazione in presenza di temperature elevate.",
          ],
          spec: {
            "Granulometria (EN-1015-1)": "< 2,5 mm",
            "Acqua d'impasto": "19%",
            "Massa volumica apparente": "1550 ± 50 Kg/m³",
            "Densità malta fresca (EN-1015-6)": "1700 ± 50 Kg/m³",
            "Densità malta indurita (EN-1015-10)": "1400 Kg/m³",
            "Resa teorica a spessore 10 mm": "14,3 Kg/m² ± 5%",
            "Resistenza a flessione (EN-1015-11)": "1,7 N/mm²",
            "Resistenza a compressione (EN-1015-11)": "4,2 N/mm²",
            "Resistenza diffusione vapore (EN-1015-19)": "μ=15",
            "Conducibilità termica (EN-1745)": "λ = 0,49 W/mK",
            "Reazione al fuoco (EN-13501-1)": "Classe A1",
            "Tempo di presa (EN-196-3)": "120 ± 30 min",
            "Spessore di applicazione": "3 – 5 mm",
            "pH": "12,5",
          },
          seo: {
            title: "RZ16 — Rinzaffo cementizio interni ed esterni | Magix",
            description:
              "RZ16 Magix: rinzaffo cementizio ponte d'adesione per intonaci, interni ed esterni. Conforme UNI EN 998-1 GP-CSII-W0. Scheda tecnica e resa.",
          },
        },
        {
          code: "RZ19",
          name: "RZ19",
          subtitle: "Rinzaffo cementizio fibrorinforzato per interni ed esterni",
          mat: "mat-grey",
          norma: "UNI EN 998-1 GP-CSII-W0",
          cam: false,
          availability: "order",
          composizione:
            "Malta secca composta da cemento grigio Portland, fibre sintetiche polimeriche, inerti calcarei ed additivi specifici che ne migliorano le caratteristiche di lavorabilità e prestazionali.",
          impiego:
            "Rinzaffo cementizio fibrorinforzato impiegato come ponte d'adesione tra il supporto e l'intonaco di fondo. Migliora l'adesione per effetto della maggiore ruvidità e riduce l'assorbimento del supporto a favore di una maggiore ritenzione d'acqua dell'intonaco.",
          fornitura: ["Sacchi da 25 kg in carta kraft con triplo strato di cui uno in polietilene"],
          applicazione:
            "Lavorabile con macchine intonacatrici tipo PFT, PUTZKNECHT, TURBOSOL o similari. Per applicazione manuale aggiungere il 19% di acqua pulita ad ogni sacco (circa 5,70 litri). Si applica in un unico strato da 3-5 mm. La malta, dopo miscelazione, va applicata entro due ore.",
          avvertenze: [
            "Miscelare con sola acqua, senza aggiunta di altri prodotti.",
            "Temperatura di impiego tra +5°C e +35°C.",
            "Non applicare su supporti gelati o disgregati.",
            "Proteggere la parete dalla rapida essiccazione in presenza di temperature elevate.",
          ],
          spec: {
            "Granulometria (EN-1015-1)": "< 2,5 mm",
            "Acqua d'impasto": "19%",
            "Massa volumica apparente": "1550 ± 50 Kg/m³",
            "Densità malta fresca (EN-1015-6)": "1700 ± 50 Kg/m³",
            "Densità malta indurita (EN-1015-6)": "1400 Kg/m³",
            "Resa teorica a spessore 10 mm": "14,3 Kg/m² ± 5%",
            "Resistenza a flessione (EN-1015-11)": "1,8 N/mm²",
            "Resistenza a compressione (EN-1015-11)": "4,3 N/mm²",
            "Resistenza diffusione vapore (EN-1015-19)": "μ=15",
            "Conducibilità termica (EN-1745)": "λ = 0,51 W/mK",
            "Reazione al fuoco (EN-13501-1)": "Classe A1",
            "Tempo di presa (EN-196-3)": "120 ± 30 min",
            "Spessore di applicazione": "3 – 5 mm",
            "pH": "12,5",
          },
          seo: {
            title: "RZ19 — Rinzaffo cementizio fibrorinforzato | Magix",
            description:
              "RZ19 Magix: rinzaffo cementizio fibrorinforzato, ponte d'adesione per intonaci, interni ed esterni. Conforme UNI EN 998-1 GP-CSII-W0.",
          },
        },
      ],
    },

    "malte da ripristino": {
      label: "Malte da ripristino",
      mat: "mat-grey",
      intro:
        "Malte cementizie per il ripristino del calcestruzzo degradato: soluzioni non strutturali e strutturali, anche rapide e tissotropiche, conformi alla EN 1504.",
      seo: {
        title: "Malte da ripristino calcestruzzo EN 1504 | Magix",
        description:
          "Malte da ripristino Magix per calcestruzzo: MM40, MM40-FAST, TISSOTROPIC-MIX, FAST e STRAIN. Soluzioni R1-R4 conformi UNI EN 1504-3.",
      },
      products: [
        {
          code: "MM40",
          name: "MM40",
          subtitle: "Malta cementizia da ripristino non strutturale per interni ed esterni",
          mat: "mat-red",
          norma: "UNI EN 1504-3 R1",
          cam: true,
          availability: "stock",
          composizione:
            "Malta secca composta da cemento grigio Portland, inerti calcarei ed additivi specifici che ne migliorano le caratteristiche di lavorabilità e prestazionali.",
          impiego:
            "Malta cementizia da riparazione non strutturale, ad alta resistenza, per interni ed esterni, impiegata nei risanamenti corticali del calcestruzzo e nella ristrutturazione di superfici degradate e ammalorate nel tempo.",
          fornitura: ["Sacchi da 25 kg in carta kraft con triplo strato di cui uno in polietilene"],
          applicazione:
            "Lavorata manualmente aggiungendo il 21% di acqua pulita ad ogni sacco (circa 5,25 litri) fino ad impasto omogeneo e tixotropico. Si applica in un unico strato da 10-20 mm; per spessori superiori applicare più strati a distanza di 1 giorno. Va applicata entro 1-2 ore dall'impasto.",
          cam_note:
            "MM40 CAM, su richiesta, può essere fornita con un contenuto di materia riciclata del 20% sul peso del prodotto, certificato REMADE IN ITALY (CAM) secondo D.M. 23 Giugno 2022 n.256.",
          avvertenze: [
            "Miscelare con sola acqua, senza aggiunta di altri prodotti.",
            "Temperatura di impiego tra +5°C e +35°C.",
            "Non applicare su supporti gelati o disgregati.",
          ],
          spec: {
            "Granulometria (EN-1015-1)": "< 2,5 mm",
            "Acqua d'impasto": "21%",
            "Massa volumica apparente": "1350 ± 50 Kg/m³",
            "Densità malta fresca": "1700 ± 50 Kg/m³",
            "Densità malta indurita": "1550 Kg/m³",
            "Resa teorica a spessore 10 mm": "14 Kg/m² ± 5%",
            "Resistenza a flessione a 28 gg (EN-12190)": "5 N/mm²",
            "Resistenza a compressione a 28 gg (EN-12190)": "10 N/mm²",
            "Reazione al fuoco (EN-13501-1)": "Classe A1",
            "Tempo di irrigidimento (EN-13294)": "180 ± 30 min",
            "Spessore di applicazione": "20 – 30 mm",
            "pH": "12,9",
            "Contenuto ioni cloruro (EN-1015-17)": "0,03% (≤ 0,05%)",
            "Legame di aderenza (EN-1542)": "1,1 MPa (≥ 0,8 MPa)",
            "Contenuto di riciclato (CAM 2022)": "20%",
          },
          seo: {
            title: "MM40 — Malta da ripristino non strutturale CAM | Magix",
            description:
              "MM40 Magix: malta cementizia da ripristino non strutturale per calcestruzzo, conforme UNI EN 1504-3 R1, disponibile CAM. Scheda tecnica completa.",
          },
        },
        {
          code: "MM40-FAST",
          name: "MM40-FAST",
          subtitle: "Malta cementizia da ripristino rapido non strutturale per interni ed esterni",
          mat: "mat-red",
          norma: "UNI EN 1504-3 R2",
          cam: false,
          availability: "order",
          composizione:
            "Malta secca composta da cemento grigio Portland, inerti calcarei ed additivi specifici che ne migliorano le caratteristiche di lavorabilità e prestazionali.",
          impiego:
            "Malta cementizia da riparazione non strutturale rapida, ad alta resistenza, per interni ed esterni, impiegata nei risanamenti corticali del calcestruzzo e nella ristrutturazione di superfici degradate e ammalorate nel tempo.",
          fornitura: ["Sacchi da 25 kg in carta kraft con triplo strato di cui uno in polietilene"],
          applicazione:
            "Lavorata manualmente aggiungendo il 21% di acqua pulita ad ogni sacco (circa 5,25 litri) fino ad impasto omogeneo e tixotropico. Si applica in un unico strato da 10-20 mm; per spessori superiori applicare più strati a distanza di 1 giorno. Va applicata entro 30 minuti dall'impasto.",
          avvertenze: [
            "Miscelare con sola acqua, senza aggiunta di altri prodotti.",
            "Temperatura di impiego tra +5°C e +35°C.",
            "Non applicare su supporti gelati o disgregati.",
          ],
          spec: {
            "Granulometria (EN-1015-1)": "< 2,5 mm",
            "Acqua d'impasto": "21%",
            "Massa volumica apparente": "1350 ± 50 Kg/m³",
            "Densità malta fresca": "1700 ± 50 Kg/m³",
            "Densità malta indurita": "1550 Kg/m³",
            "Resa teorica a spessore 10 mm": "14 Kg/m² ± 5%",
            "Resistenza a flessione a 28 gg (EN-196/1)": "6,5 N/mm²",
            "Resistenza a compressione a 28 gg (EN-12190)": "15,8 N/mm²",
            "Reazione al fuoco (EN-13501-1)": "Classe A1",
            "Tempo di irrigidimento (EN-13294)": "40 ± 10 min",
            "Spessore di applicazione": "10 – 20 mm",
            "pH": "12,9",
            "Contenuto ioni cloruro (EN-1015-17)": "0,02% (≤ 0,05%)",
            "Legame di aderenza (EN-1542)": "1,2 MPa (≥ 0,8 MPa)",
          },
          seo: {
            title: "MM40-FAST — Malta da ripristino rapido | Magix",
            description:
              "MM40-FAST Magix: malta cementizia da ripristino rapido non strutturale per calcestruzzo, conforme UNI EN 1504-3 R2. Scheda tecnica e tempi.",
          },
        },
        {
          code: "TISSOTROPIC-MIX",
          name: "TISSOTROPIC-MIX",
          subtitle: "Malta da ripristino strutturale cementizia per interni ed esterni",
          mat: "mat-red",
          norma: "UNI EN 1504-3 R4",
          cam: true,
          availability: "stock",
          composizione:
            "Malta secca composta da una miscela di speciali cementi ad alta resistenza, fibre sintetiche polimeriche, inerti calcarei ed additivi specifici che ne migliorano le caratteristiche di lavorabilità e prestazionali.",
          impiego:
            "Malta cementizia strutturale ad elevate resistenze meccaniche, tissotropica, fibrorinforzata a ritiro contrastato, per il ripristino corticale delle strutture in calcestruzzo degradate e ammalorate nel tempo.",
          fornitura: ["Sacchi da 25 kg in carta kraft con triplo strato di cui uno in polietilene"],
          applicazione:
            "Lavorabile manualmente o con macchine intonacatrici tipo TURBOSOL, PFT, PUTZKNECHT o similari. Per applicazione manuale aggiungere il 14% di acqua pulita ad ogni sacco (circa 3,5 litri) fino ad impasto omogeneo e tixotropico. Si applica fino a 30 mm per mano; per spessori superiori applicare lo strato successivo dopo l'indurimento del primo. Va applicata entro 1 ora dall'impasto.",
          cam_note:
            "TISSOTROPIC-MIX, su richiesta, può essere fornita con un contenuto di materia riciclata del 20% sul peso del prodotto, certificato REMADE IN ITALY (CAM) secondo D.M. 23 Giugno 2022 n.256.",
          avvertenze: [
            "Miscelare con sola acqua, senza aggiunta di altri prodotti.",
            "Temperatura di impiego tra +5°C e +35°C.",
            "Non applicare su supporti gelati, disgregati o con elevato calore superficiale.",
            "Evitare le gettate pomeridiane: l'abbassamento delle temperature notturne può compromettere le resistenze meccaniche.",
          ],
          spec: {
            "Granulometria (EN-1015-1)": "< 2,5 mm",
            "Acqua d'impasto": "14%",
            "Massa volumica apparente": "1450 ± 50 Kg/m³",
            "Densità malta fresca": "2050 ± 50 Kg/m³",
            "Densità malta indurita": "1950 Kg/m³",
            "Resa teorica a spessore 10 mm": "18 Kg/m² ± 5%",
            "Resistenza a flessione a 28 gg (EN-196/1)": "9 N/mm²",
            "Resistenza a compressione a 28 gg (EN-12190)": "65 N/mm²",
            "Reazione al fuoco (EN-13501-1)": "Classe A1",
            "Tempo di irrigidimento (EN-13294)": "150 ± 30 min",
            "Modulo elastico secante (EN-13412)": "22 GPa",
            "Ritiro idraulico (EN-6687-73)": "1116 μm/m",
            "Spessore massimo eseguibile": "30 mm",
            "pH": "12,3",
            "Contenuto ioni cloruro (EN-1015-17)": "0,02% (≤ 0,05%)",
            "Legame di aderenza (EN-1542)": "> 2,0 MPa (≥ 2,0 MPa)",
            "Contenuto di riciclato (CAM 2022)": "20%",
          },
          seo: {
            title: "TISSOTROPIC-MIX — Ripristino strutturale R4 CAM | Magix",
            description:
              "TISSOTROPIC-MIX Magix: malta tissotropica strutturale fibrorinforzata a ritiro contrastato per calcestruzzo, conforme UNI EN 1504-3 R4, disponibile CAM.",
          },
        },
        {
          code: "TISSOTROPIC FAST",
          name: "TISSOTROPIC FAST",
          subtitle: "Malta da ripristino rapida strutturale per interni ed esterni",
          mat: "mat-red",
          norma: "UNI EN 1504-3 R3",
          cam: false,
          availability: "order",
          composizione:
            "Malta secca composta da una miscela di speciali cementi ad alta resistenza, fibre sintetiche polimeriche, inerti calcarei ed additivi specifici che ne migliorano le caratteristiche di lavorabilità e prestazionali.",
          impiego:
            "Malta cementizia strutturale ad elevate resistenze meccaniche, tissotropica, fibrorinforzata a ritiro contrastato, per il ripristino rapido corticale delle strutture in calcestruzzo degradate e ammalorate nel tempo.",
          fornitura: ["Sacchi da 25 kg in carta kraft con triplo strato di cui uno in polietilene"],
          applicazione:
            "Lavorabile manualmente o con macchine intonacatrici tipo TURBOSOL, PFT, PUTZKNECHT o similari. Per applicazione manuale aggiungere il 14% di acqua pulita ad ogni sacco (circa 3,5 litri) fino ad impasto omogeneo e tixotropico. Si applica fino a 30 mm per mano; per spessori superiori applicare lo strato successivo dopo l'indurimento del primo. Va applicata entro 30 minuti dall'impasto.",
          avvertenze: [
            "Miscelare con sola acqua, senza aggiunta di altri prodotti.",
            "Temperatura di impiego tra +5°C e +35°C.",
            "Non applicare su supporti gelati, disgregati o con elevato calore superficiale.",
            "Evitare le gettate pomeridiane: l'abbassamento delle temperature notturne può compromettere le resistenze meccaniche.",
          ],
          spec: {
            "Granulometria (EN-1015-1)": "< 2,5 mm",
            "Acqua d'impasto": "14%",
            "Massa volumica apparente": "1450 ± 50 Kg/m³",
            "Densità malta fresca": "2050 ± 50 Kg/m³",
            "Densità malta indurita": "1950 Kg/m³",
            "Resa teorica a spessore 10 mm": "18 Kg/m² ± 5%",
            "Resistenza a flessione a 28 gg (EN-196/1)": "8,3 N/mm²",
            "Resistenza a compressione a 28 gg (EN-12190)": "26,2 N/mm²",
            "Reazione al fuoco (EN-13501-1)": "Classe A1",
            "Tempo di irrigidimento (EN-13294)": "40 ± 10 min",
            "Modulo elastico secante (EN-13412)": "22 GPa",
            "Ritiro idraulico (EN-6687-73)": "1116 μm/m",
            "Spessore massimo di applicazione": "30 mm",
            "pH": "12,3",
            "Contenuto ioni cloruro (EN-1015-17)": "0,02% (≤ 0,05%)",
            "Legame di aderenza (EN-1542)": "> 1,6 MPa (≥ 1,5 MPa)",
          },
          conservazione_note: "Conserva le proprie caratteristiche per circa 10 settimane dalla data di produzione.",
          seo: {
            title: "TISSOTROPIC FAST — Ripristino rapido strutturale R3 | Magix",
            description:
              "TISSOTROPIC FAST Magix: malta tissotropica strutturale rapida fibrorinforzata per calcestruzzo, conforme UNI EN 1504-3 R3. Scheda tecnica e tempi.",
          },
        },
        {
          code: "TISSOTROPIC STRAIN",
          name: "TISSOTROPIC STRAIN",
          subtitle: "Malta tissotropica a ritiro controllato strutturale fibrorinforzata colabile",
          mat: "mat-red",
          norma: "UNI EN 1504-3 R3",
          cam: false,
          availability: "order",
          composizione:
            "Malta secca composta da una miscela di speciali cementi ad alta resistenza, fibre sintetiche polimeriche, inerti calcarei ed additivi specifici che ne migliorano le caratteristiche di lavorabilità e prestazionali.",
          impiego:
            "Malta cementizia strutturale ad elevate resistenze meccaniche, tissotropica, fibrorinforzata a ritiro contrastato, impiegata nel riempimento di strutture in calcestruzzo ad applicazione colabile.",
          fornitura: ["Sacchi da 25 kg in carta kraft con triplo strato di cui uno in polietilene"],
          applicazione:
            "Lavorabile manualmente o con macchine intonacatrici tipo TURBOSOL, PFT, PUTZKNECHT o similari. Per applicazione manuale aggiungere il 14% di acqua pulita ad ogni sacco (circa 3,5 litri) fino ad impasto omogeneo e tixotropico. Viene applicata per colaggio fino a 30 mm per mano; per spessori superiori applicare lo strato successivo dopo l'indurimento del primo. Va applicata entro 1 ora dall'impasto.",
          avvertenze: [
            "Miscelare con sola acqua, senza aggiunta di altri prodotti.",
            "Temperatura di impiego tra +5°C e +35°C.",
            "Non applicare su supporti gelati, disgregati o con elevato calore superficiale.",
            "Evitare le gettate pomeridiane: l'abbassamento delle temperature notturne può compromettere le resistenze meccaniche.",
          ],
          spec: {
            "Granulometria (EN-1015-1)": "< 2,5 mm",
            "Acqua d'impasto": "14%",
            "Massa volumica apparente": "1450 ± 50 Kg/m³",
            "Densità malta fresca": "2050 ± 50 Kg/m³",
            "Densità malta indurita": "1950 Kg/m³",
            "Resa teorica a spessore 10 mm": "18 Kg/m² ± 5%",
            "Resistenza a flessione a 28 gg (EN-196/1)": "6,2 N/mm²",
            "Resistenza a compressione a 28 gg (EN-12190)": "25 N/mm²",
            "Reazione al fuoco (EN-13501-1)": "Classe A1",
            "Tempo di irrigidimento (EN-13294)": "150 ± 30 min",
            "Ritiro idraulico (EN-6687-73)": "1116 μm/m",
            "Spessore massimo di applicazione": "30 mm",
            "pH": "12,3",
            "Contenuto ioni cloruro (EN-1015-17)": "0,023% (≤ 0,05%)",
            "Legame di aderenza (EN-1542)": "> 1,5 MPa (≥ 1,5 MPa)",
          },
          seo: {
            title: "TISSOTROPIC STRAIN — Malta colabile strutturale R3 | Magix",
            description:
              "TISSOTROPIC STRAIN Magix: malta tissotropica a ritiro controllato, strutturale, fibrorinforzata e colabile per il riempimento del calcestruzzo. UNI EN 1504-3 R3.",
          },
        },
      ],
    },

    "malte da muratura": {
      label: "Malte da muratura",
      mat: "mat-grey",
      intro:
        "Malte cementizie premiscelate per la realizzazione di murature, tramezzature e muri portanti, anche per tompagnatura e riempimento.",
      consumi: {
        title: "Consumo di malta per murature",
        head: ["Tipo di mattone (PxLxH cm)", "Fugatura semplice", "Fugatura doppia"],
        rows: [
          ["8x25x25", "4,80 Kg/m²", "9,60 Kg/m²"],
          ["10x25x25", "6 Kg/m²", "12 Kg/m²"],
          ["15x25x25", "9 Kg/m²", "18 Kg/m²"],
          ["20x25x25", "12 Kg/m²", "24 Kg/m²"],
          ["25x25x25", "15 Kg/m²", "30 Kg/m²"],
          ["30x25x25", "18 Kg/m²", "36 Kg/m²"],
        ],
      },
      seo: {
        title: "Malte da muratura cementizie | Magix",
        description:
          "Malte da muratura Magix per tramezzature e muri portanti: MM105 e MM110 strutturale. Conformi UNI EN 998-2. Schede tecniche e tabella consumi.",
      },
      products: [
        {
          code: "MM105",
          name: "MM105",
          subtitle: "Malta muratura cementizia per interni ed esterni",
          mat: "mat-ochre",
          norma: "UNI EN 998-2 M5",
          cam: true,
          availability: "stock",
          composizione:
            "Malta secca composta da cemento grigio Portland, calce idrata, inerti calcarei ed additivi specifici che ne migliorano le caratteristiche di lavorabilità e prestazionali.",
          impiego:
            "Malta muratura cementizia per interni ed esterni per la realizzazione di tramezzature in laterizio, blocchi in calcestruzzo, pietra, tufo, ecc. Utilizzabile anche come malta da tompagnatura per la chiusura delle tracce e come malta da riempimento.",
          fornitura: ["Sacchi da 25 kg in carta kraft con triplo strato di cui uno in polietilene", "Sfuso in silo"],
          applicazione:
            "Lavorata manualmente aggiungendo circa il 17% di acqua d'impasto ad ogni sacco (circa 4,25 litri). Per una corretta posa riempire accuratamente le fughe orizzontali e verticali. Va applicata entro 2 ore dall'impasto.",
          cam_note:
            "MM105 CAM, su richiesta, può essere fornita con un contenuto di materia riciclata del 20% sul peso del prodotto, certificato REMADE IN ITALY (CAM) secondo D.M. 23 Giugno 2022 n.256.",
          avvertenze: [
            "Miscelare con sola acqua, senza aggiunta di altri prodotti.",
            "Temperatura di impiego tra +5°C e +35°C.",
            "Non applicare su supporti gelati o disgregati.",
          ],
          spec: {
            "Granulometria (EN-1015-1)": "< 2,5 mm",
            "Acqua d'impasto": "17%",
            "Massa volumica apparente": "1500 ± 50 Kg/m³",
            "Densità malta fresca (EN-1015-6)": "1950 ± 50 Kg/m³",
            "Densità malta indurita (EN-1015-10)": "1720 Kg/m³",
            "Resa teorica a spessore 10 mm": "16,6 Kg/m² ± 5%",
            "Resistenza a flessione (EN-1015-11)": "2,4 N/mm²",
            "Resistenza a compressione (EN-1015-11)": "5,6 N/mm²",
            "Resistenza diffusione vapore (EN-1015-19)": "μ=15/35",
            "Conducibilità termica (EN-1745)": "λ = 0,82 W/mK (tabulare)",
            "Reazione al fuoco (EN-13501-1)": "Classe A1",
            "Tempo di presa (EN-196-3)": "150 ± 30 min",
            "Spessore di applicazione": "10 – 20 mm",
            "pH": "12,3",
            "Contenuto di riciclato (CAM 2022)": "20%",
          },
          seo: {
            title: "MM105 — Malta da muratura cementizia CAM | Magix",
            description:
              "MM105 Magix: malta muratura cementizia per tramezzature, tompagnatura e riempimento, interni ed esterni. Conforme UNI EN 998-2 M5, disponibile CAM.",
          },
        },
        {
          code: "MM110",
          name: "MM110",
          subtitle: "Malta muratura cementizia strutturale per interni ed esterni",
          mat: "mat-grey",
          norma: "UNI EN 998-2 M15",
          cam: false,
          availability: "order",
          composizione:
            "Malta secca composta da cemento grigio Portland, calce idrata, inerti calcarei ed additivi specifici che ne migliorano le caratteristiche di lavorabilità e prestazionali.",
          impiego:
            "Malta muratura cementizia per interni ed esterni per la realizzazione di muri portanti strutturali. Utilizzabile anche come malta da tompagnatura per la chiusura delle tracce e come malta da riempimento.",
          fornitura: ["Sacchi da 25 kg in carta kraft con triplo strato di cui uno in polietilene", "Sfuso in silo"],
          applicazione:
            "Lavorata manualmente aggiungendo il 17% di acqua pulita ad ogni sacco (circa 4,25 litri). Per una corretta posa riempire accuratamente le fughe orizzontali e verticali. Va applicata entro 1 ora dall'impasto.",
          avvertenze: [
            "Miscelare con sola acqua, senza aggiunta di altri prodotti.",
            "Temperatura di impiego tra +5°C e +35°C.",
            "Non applicare su supporti gelati o disgregati.",
          ],
          spec: {
            "Granulometria (EN-1015-1)": "< 2,5 mm",
            "Acqua d'impasto": "17%",
            "Massa volumica apparente": "1500 ± 50 Kg/m³",
            "Densità malta fresca (EN-1015-6)": "2000 ± 50 Kg/m³",
            "Densità malta indurita (EN-1015-10)": "1750 Kg/m³",
            "Resa teorica a spessore 10 mm": "16,9 Kg/m² ± 5%",
            "Resistenza a flessione (EN-1015-11)": "4,2 N/mm²",
            "Resistenza a compressione (EN-1015-11)": "15,8 N/mm²",
            "Resistenza diffusione vapore (EN-1015-19)": "μ=15/35",
            "Conducibilità termica (EN-1745)": "λ = 0,82 W/mK (tabulare)",
            "Reazione al fuoco (EN-13501-1)": "Classe A1",
            "Tempo di presa (EN-196-3)": "150 ± 30 min",
            "Spessore di applicazione": "10 – 20 mm",
            "pH": "12,3",
          },
          seo: {
            title: "MM110 — Malta da muratura strutturale | Magix",
            description:
              "MM110 Magix: malta muratura cementizia strutturale per muri portanti, interni ed esterni. Conforme UNI EN 998-2 M15. Scheda tecnica completa.",
          },
        },
      ],
    },

    "malte da muratura facciavista": {
      label: "Malte da muratura facciavista",
      mat: "mat-grey",
      intro:
        "Malte cementizie idrofugate per murature in mattoni a faccia a vista, disponibili nelle versioni bianca e grigia, per interni ed esterni.",
      seo: {
        title: "Malte da muratura faccia a vista | Magix",
        description:
          "Malte muratura idrofugate Magix per faccia a vista: MM20 grigia e MM20 B bianca. Conformi UNI EN 998-2 M5. Schede tecniche complete.",
      },
      products: [
        {
          code: "MM20",
          name: "MM20",
          subtitle: "Malta muratura cementizia per faccia a vista grigia per interni ed esterni",
          mat: "mat-grey",
          norma: "UNI EN 998-2 M5",
          cam: false,
          availability: "order",
          composizione:
            "Malta secca composta da cemento grigio Portland, calce idrata, agente idrofugo, inerti calcarei ed additivi specifici che ne migliorano le caratteristiche di lavorabilità e prestazionali.",
          impiego:
            "Malta muratura cementizia idrofugata per faccia a vista, per interni ed esterni, per la realizzazione di murature con mattoni a faccia a vista.",
          fornitura: ["Sacchi da 25 kg in carta kraft con triplo strato di cui uno in polietilene", "Sfuso in silo"],
          applicazione:
            "Lavorata manualmente aggiungendo il 19% di acqua pulita ad ogni sacco (circa 4,75 litri). Va applicata entro 2 ore dall'impasto.",
          avvertenze: [
            "Miscelare con sola acqua, senza aggiunta di altri prodotti.",
            "Temperatura di impiego tra +5°C e +35°C.",
            "Non applicare su supporti gelati o disgregati.",
          ],
          spec: {
            "Granulometria (EN-1015-1)": "< 1,5 mm",
            "Acqua d'impasto": "19%",
            "Massa volumica apparente": "1400 ± 50 Kg/m³",
            "Densità malta fresca": "1800 ± 50 Kg/m³",
            "Densità malta indurita": "1600 Kg/m³",
            "Resa teorica a spessore 10 mm": "15 Kg/m² ± 5%",
            "Resistenza a flessione (EN-1015-11)": "2,2 N/mm²",
            "Resistenza a compressione (EN-1015-11)": "5,1 N/mm²",
            "Resistenza diffusione vapore (EN-1015-19)": "μ=15/35",
            "Conducibilità termica (EN-1745)": "λ = 0,78 W/mK",
            "Reazione al fuoco (EN-13501-1)": "Classe A1",
            "Tempo di presa (EN-196-3)": "180 ± 30 min",
            "Spessore di applicazione": "10 – 20 mm",
            "pH": "12,4",
          },
          seo: {
            title: "MM20 — Malta muratura faccia a vista grigia | Magix",
            description:
              "MM20 Magix: malta muratura cementizia idrofugata per faccia a vista grigia, interni ed esterni. Conforme UNI EN 998-2 M5. Scheda tecnica.",
          },
        },
        {
          code: "MM20 B",
          name: "MM20 B",
          subtitle: "Malta muratura cementizia per faccia a vista bianca per interni ed esterni",
          mat: "mat-white",
          norma: "UNI EN 998-2 M5",
          cam: false,
          availability: "order",
          composizione:
            "Malta secca composta da cemento bianco Portland, calce idrata, agente idrofugo, inerti calcarei ed additivi specifici che ne migliorano le caratteristiche di lavorabilità e prestazionali.",
          impiego:
            "Malta muratura cementizia idrofugata per faccia a vista, per interni ed esterni, per la realizzazione di murature con mattoni a faccia a vista.",
          fornitura: ["Sacchi da 25 kg in carta kraft con triplo strato di cui uno in polietilene", "Sfuso in silo"],
          applicazione:
            "Lavorata manualmente aggiungendo il 19% di acqua pulita ad ogni sacco (circa 4,75 litri). Va applicata entro 2 ore dall'impasto.",
          avvertenze: [
            "Miscelare con sola acqua, senza aggiunta di altri prodotti.",
            "Temperatura di impiego tra +5°C e +35°C.",
            "Non applicare su supporti gelati o disgregati.",
          ],
          spec: {
            "Granulometria (EN-1015-1)": "< 1,5 mm",
            "Acqua d'impasto": "19%",
            "Massa volumica apparente": "1400 ± 50 Kg/m³",
            "Densità malta fresca (EN-1015-6)": "1800 ± 50 Kg/m³",
            "Densità malta indurita (EN-1015-10)": "1600 Kg/m³",
            "Resa teorica a spessore 10 mm": "15 Kg/m² ± 5%",
            "Resistenza a flessione (EN-1015-11)": "2,8 N/mm²",
            "Resistenza alla compressione (EN-1015-11)": "7,2 N/mm²",
            "Resistenza diffusione vapore (EN-1015-19)": "μ=15/35",
            "Conducibilità termica (EN-1745)": "λ = 0,76 W/mK",
            "Reazione al fuoco (EN-13501-1)": "Classe A1",
            "Tempo di presa (EN-196-3)": "150 ± 30 min",
            "Spessore di applicazione": "10 – 20 mm",
            "pH": "12,5",
          },
          seo: {
            title: "MM20 B — Malta muratura faccia a vista bianca | Magix",
            description:
              "MM20 B Magix: malta muratura cementizia idrofugata per faccia a vista bianca, interni ed esterni. Conforme UNI EN 998-2 M5. Scheda tecnica.",
          },
        },
      ],
    },
  };

  // indice piatto codice → { catKey, product } per lookup rapido nelle schede
  const INDEX = {};
  Object.keys(CATALOG).forEach((catKey) => {
    (CATALOG[catKey].products || []).forEach((p) => {
      INDEX[p.code] = { catKey, product: p };
    });
  });

  window.MAGIX_CATALOG = CATALOG;
  window.MAGIX_CATALOG_INDEX = INDEX;
  window.MAGIX_CATALOG_DISCLAIMER = DISCLAIMER;
})();
