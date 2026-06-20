  // ── view router ──
  const views = { home: "view-home", prodotti: "view-prodotti", cemento: "view-cemento", news: "view-news", contatti: "view-contatti", lavora: "view-lavora", download: "view-download", product: "view-product", privacy: "view-privacy", cookie: "view-cookie", admin: "view-admin" };
  function setView(name) {
    const targetId = views[name] || views.home;
    Object.values(views).forEach(id => { const el = document.getElementById(id); if (el) el.classList.remove("active"); });
    document.getElementById(targetId).classList.add("active");
    const fab = document.getElementById("waFab");
    if (fab) fab.classList.toggle("hidden", targetId === "view-admin");
    highlightNav(name);
    window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
    runReveal();
  }

  // evidenzia la voce di menu attiva nell'header della view corrente
  function highlightNav(name) {
    const nav = document.querySelector(".view.active header nav");
    if (!nav) return;
    const key = name === "product" ? "prodotti" : name;
    nav.querySelectorAll("a[data-view]").forEach(a => a.classList.toggle("text-red", a.dataset.view === key));
  }

  // ── menus (mega menu desktop + drawer mobile) ──
  const megaMenu = document.getElementById("megaMenu");
  const mobileNav = document.getElementById("mobileNav");
  let megaTimer;
  function openMega() {
    if (!megaMenu) return;
    clearTimeout(megaTimer);
    const hdr = document.querySelector(".view.active header");
    // -12px: il padding-top del pannello fa da "ponte" sul gap header→menu (così l'hover non si interrompe)
    if (hdr) megaMenu.style.top = Math.max(0, hdr.getBoundingClientRect().bottom - 12) + "px";
    megaMenu.classList.remove("hidden");
    requestAnimationFrame(() => megaMenu.classList.add("open"));
  }
  function closeMega(now) {
    if (!megaMenu) return;
    clearTimeout(megaTimer);
    if (now) {
      megaMenu.classList.remove("open");
      megaMenu.classList.add("hidden");
      return;
    }
    // Chiusura ritardata: .open (e quindi pointer-events:auto) resta attivo durante
    // il periodo di grazia, così il puntatore può transitare verso il pannello e
    // riaprirlo. La .open viene tolta solo allo scadere del timer.
    megaTimer = setTimeout(() => {
      megaMenu.classList.remove("open");
      megaTimer = setTimeout(() => megaMenu.classList.add("hidden"), 200);
    }, 200);
  }
  function openMobile() { if (mobileNav) { mobileNav.classList.remove("hidden"); requestAnimationFrame(() => mobileNav.classList.add("open")); } }
  function closeMobile() { if (mobileNav) { mobileNav.classList.remove("open"); setTimeout(() => mobileNav.classList.add("hidden"), 300); } }

  // ── nav routing (delegated: copre anche elementi iniettati/clonati) ──
  document.addEventListener("click", (e) => {
    const el = e.target.closest("[data-view]");
    if (!el) return;
    e.preventDefault();
    if (el.dataset.view === "product") {
      const cat = el.dataset.name || (el.classList.contains("mega-cat") ? el.textContent : "");
      if (cat) setProductCategory(cat.trim());
    }
    setView(el.dataset.view);
    closeMega(true); closeMobile();
  });

  // ── product: applica la categoria scelta (mega menu / catalogo) ──
  function setProductCategory(name) {
    if (!name) return;
    const label = name.replace(/\b\w/g, c => c.toUpperCase());
    const crumb = document.getElementById("pCrumbCat");
    if (crumb) crumb.textContent = label;
  }

  // desktop: chevron su "Prodotti" + mega menu su hover/focus
  document.querySelectorAll('.view header nav a[data-view="prodotti"]').forEach(link => {
    if (!link.querySelector(".nav-chev")) {
      link.insertAdjacentHTML("beforeend", ' <svg class="nav-chev inline-block align-middle -mt-0.5 transition" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>');
    }
    link.addEventListener("mouseenter", openMega);
    link.addEventListener("focus", openMega);
    link.addEventListener("mouseleave", () => closeMega());
  });
  if (megaMenu) {
    // openMega è idempotente: annulla la chiusura e riporta .open se era in fase di fade-out
    megaMenu.addEventListener("mouseenter", openMega);
    megaMenu.addEventListener("mouseleave", () => closeMega());
    window.addEventListener("scroll", () => closeMega(true), { passive: true });
  }
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") { closeMega(true); closeMobile(); } });

  // mobile: inietta hamburger in ogni header pubblico
  document.querySelectorAll(".view header .ml-auto").forEach(c => {
    if (c.querySelector(".burger")) return;
    const b = document.createElement("button");
    b.className = "burger lg:hidden h-10 w-10 grid place-items-center rounded-xl border border-line bg-surface/70 text-ink hover:border-ink/30 transition";
    b.setAttribute("aria-label", "Apri menu");
    b.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16"/></svg>';
    b.addEventListener("click", openMobile);
    c.appendChild(b);
  });

  // mobile drawer: chiusura, accordion, clone categorie malte
  if (mobileNav) {
    mobileNav.querySelectorAll("[data-mclose]").forEach(x => x.addEventListener("click", closeMobile));
    const acc = mobileNav.querySelector(".mnav-acc");
    const accBtn = mobileNav.querySelector(".mnav-acc-btn");
    if (acc && accBtn) accBtn.addEventListener("click", () => {
      const open = acc.classList.toggle("open");
      accBtn.setAttribute("aria-expanded", open ? "true" : "false");
    });
    const cloneLinks = (srcId, destId) => {
      const src = document.getElementById(srcId), dest = document.getElementById(destId);
      if (!src || !dest) return;
      src.querySelectorAll("a").forEach(a => {
        const link = document.createElement("a");
        link.href = "#"; link.dataset.view = "product"; link.dataset.name = a.textContent.trim();
        link.className = "block py-1 text-muted hover:text-red transition";
        link.textContent = a.textContent;
        dest.appendChild(link);
      });
    };
    cloneLinks("megaMalteLinks", "mnavMalte");
    cloneLinks("megaRivLinks", "mnavRiv");
  }

  // ── reveal on scroll ──
  let io;
  function runReveal() {
    const els = document.querySelectorAll(".view.active .reveal:not(.in)");
    if (!io) {
      io = new IntersectionObserver((entries) => {
        entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
      }, { threshold: 0.12 });
    }
    els.forEach(el => io.observe(el));
  }

  // ── faq accordion ──
  document.querySelectorAll(".faq-q").forEach(q => q.addEventListener("click", () => {
    const item = q.closest(".faq-item");
    const open = item.classList.toggle("open");
    q.setAttribute("aria-expanded", open ? "true" : "false");
  }));

  // ── product: variant + price ──
  const fmt = { "14,90": ["€ 14,90", "sacco 25 kg", '↳ Listino "Impresa": <span class="font-bold">€ 13,40</span> (accedi)'],
                "690,00": ["€ 690,00", "bancale 1.200 kg", '↳ Listino "Impresa": <span class="font-bold">€ 624,00</span> (accedi)'],
                "preventivo": ["Su preventivo", "silo / sfuso", "↳ Quotazione su misura per cantiere"] };
  document.querySelectorAll(".variant").forEach(v => {
    v.addEventListener("click", () => {
      document.querySelectorAll(".variant").forEach(x => x.classList.remove("active"));
      v.classList.add("active");
      const [price, unit, tier] = fmt[v.dataset.price];
      document.getElementById("pPrice").textContent = price;
      document.getElementById("pUnit").textContent = "· " + unit;
      document.getElementById("pTier").innerHTML = tier;
    });
  });

  // ── gallery thumbs ──
  const matClasses = ["mat-grey","mat-white","mat-anthr","mat-ochre","mat-bio","mat-red"];
  document.querySelectorAll(".thumb").forEach(t => t.addEventListener("click", () => {
    document.querySelectorAll(".thumb").forEach(x => x.classList.replace("border-red","border-transparent"));
    if (t.classList.contains("mat")) {
      t.classList.remove("border-transparent"); t.classList.add("border-red");
      const main = document.getElementById("mainSwatch");
      matClasses.forEach(c => main.classList.remove(c));
      t.classList.forEach(c => { if (matClasses.includes(c)) main.classList.add(c); });
    }
  }));

  // ── admin: bulk select ──
  const rowChks = document.querySelectorAll(".rowChk");
  const bulkBar = document.getElementById("bulkBar");
  const bulkCount = document.getElementById("bulkCount");
  const checkAll = document.getElementById("checkAll");
  function syncBulk() {
    const n = [...rowChks].filter(c => c.checked).length;
    bulkCount.textContent = n;
    bulkBar.classList.toggle("hidden", n === 0);
    bulkBar.classList.toggle("flex", n > 0);
  }
  rowChks.forEach(c => c.addEventListener("change", syncBulk));
  checkAll && checkAll.addEventListener("change", () => { rowChks.forEach(c => c.checked = checkAll.checked); syncBulk(); });

  // ── contact form ──
  const contactForm = document.getElementById("contactForm");
  if (contactForm) {
    contactForm.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!contactForm.checkValidity()) { contactForm.reportValidity(); return; }
      const msg = document.getElementById("formMsg");
      contactForm.reset();
      msg.textContent = "✓ Richiesta inviata — ti ricontatteremo al più presto.";
      msg.classList.remove("hidden");
      msg.classList.add("flex");
    });
  }

  // ── job application form ──
  const jobForm = document.getElementById("jobForm");
  if (jobForm) {
    const cvFile = document.getElementById("cv-file");
    const cvName = document.getElementById("cv-name");
    if (cvFile) cvFile.addEventListener("change", () => {
      cvName.textContent = cvFile.files[0] ? cvFile.files[0].name : "Nessun file selezionato";
    });
    jobForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const f = cvFile && cvFile.files[0];
      if (f) {
        if (!/\.(doc|docx|pdf)$/i.test(f.name)) { alert("Formati ammessi: .doc, .docx, .pdf"); return; }
        if (f.size > 1024 * 1024) { alert("Il curriculum supera 1 MB."); return; }
      }
      if (!jobForm.checkValidity()) { jobForm.reportValidity(); return; }
      const msg = document.getElementById("jobFormMsg");
      jobForm.reset();
      if (cvName) cvName.textContent = "Nessun file selezionato";
      msg.textContent = "✓ Candidatura inviata — ti ricontatteremo se il profilo è in linea.";
      msg.classList.remove("hidden");
      msg.classList.add("flex");
    });
  }

  // ── download center: search + category filter ──
  const dlGrid = document.getElementById("downloadGrid");
  if (dlGrid) {
    const cards = [...dlGrid.querySelectorAll(".doc-card")];
    const pills = [...document.querySelectorAll(".dl-pill")];
    const search = document.getElementById("dlSearch");
    const empty = document.getElementById("dlEmpty");
    let cat = "all";
    function apply() {
      const q = (search && search.value || "").trim().toLowerCase();
      let shown = 0;
      cards.forEach(c => {
        const ok = (cat === "all" || c.dataset.cat === cat) && (!q || c.dataset.title.includes(q));
        c.classList.toggle("hidden", !ok);
        if (ok) shown++;
      });
      if (empty) empty.classList.toggle("hidden", shown !== 0);
    }
    pills.forEach(p => p.addEventListener("click", () => {
      cat = p.dataset.filter;
      pills.forEach(x => {
        const on = x === p;
        x.classList.toggle("bg-graphite", on);
        x.classList.toggle("text-white", on);
        x.classList.toggle("border", !on);
        x.classList.toggle("border-line", !on);
        x.classList.toggle("bg-surface", !on);
      });
      apply();
    }));
    if (search) search.addEventListener("input", apply);
  }

  // ── admin: panel switching ──
  const adminTitles = { dashboard: "Dashboard", prodotti: "Prodotti", news: "News", download: "Cataloghi & download" };
  const adminPanels = [...document.querySelectorAll(".admin-panel")];
  const apanelLinks = [...document.querySelectorAll(".apanel-link")];
  function showAdminPanel(name) {
    if (!adminPanels.length) return;
    adminPanels.forEach(p => p.classList.toggle("hidden", p.dataset.panel !== name));
    apanelLinks.forEach(l => {
      const on = l.dataset.panel === name;
      l.classList.toggle("bg-white/10", on);
      l.classList.toggle("text-white", on);
      l.classList.toggle("font-medium", on);
      const dot = l.querySelector(".dot");
      if (dot) { dot.classList.toggle("bg-red", on); dot.classList.toggle("bg-white/20", !on); }
    });
    const t = document.getElementById("adminTitle");
    if (t && adminTitles[name]) t.textContent = adminTitles[name];
  }
  document.querySelectorAll("[data-panel]").forEach(el =>
    el.addEventListener("click", (e) => { e.preventDefault(); showAdminPanel(el.dataset.panel); })
  );

  // ── admin: dynamic technical-data rows ──
  const specRows = document.getElementById("specRows");
  const addSpec = document.getElementById("addSpec");
  if (addSpec && specRows) {
    addSpec.addEventListener("click", () => {
      const row = document.createElement("div");
      row.className = "spec-row flex gap-2";
      row.innerHTML = '<input class="adm-in flex-1" placeholder="Caratteristica" /><input class="adm-in flex-1" placeholder="Valore" /><button type="button" class="spec-del h-11 w-11 grid place-items-center rounded-xl border border-line text-faint hover:text-red hover:border-red/40 transition shrink-0" aria-label="Rimuovi riga">✕</button>';
      specRows.appendChild(row);
    });
    specRows.addEventListener("click", (e) => {
      const del = e.target.closest(".spec-del");
      if (del && specRows.querySelectorAll(".spec-row").length > 1) del.closest(".spec-row").remove();
    });
  }

  // ── admin: image previews ──
  function bindImgPreview(inputId, previewId) {
    const input = document.getElementById(inputId), prev = document.getElementById(previewId);
    if (!input || !prev) return;
    input.addEventListener("change", () => {
      const f = input.files[0];
      if (!f) return;
      prev.style.backgroundImage = "url(" + URL.createObjectURL(f) + ")";
      prev.style.backgroundSize = "cover";
      prev.style.backgroundPosition = "center";
      prev.classList.remove("mat", "mat-grey", "mat-ochre");
      prev.innerHTML = "";
    });
  }
  bindImgPreview("p-img", "p-imgPreview");
  bindImgPreview("n-img", "n-imgPreview");

  // ── admin: download file name ──
  const fFile = document.getElementById("f-file"), fName = document.getElementById("f-name");
  if (fFile && fName) fFile.addEventListener("change", () => {
    fName.textContent = fFile.files[0] ? fFile.files[0].name : "Nessun file selezionato";
  });

  // ── admin: fake submits (prototype) ──
  function bindFakeSubmit(formId, msgId, text) {
    const form = document.getElementById(formId), msg = document.getElementById(msgId);
    if (!form) return;
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      form.reset();
      if (fName && formId === "fileForm") fName.textContent = "Nessun file selezionato";
      if (msg) { msg.textContent = text; msg.classList.remove("hidden"); }
    });
  }
  bindFakeSubmit("productForm", "productMsg", "✓ Prodotto salvato — la scheda è pronta per la pubblicazione.");
  bindFakeSubmit("newsForm", "newsMsg", "✓ News pubblicata nella sezione News.");
  bindFakeSubmit("fileForm", "fileMsg", "✓ Documento caricato nell'Area download.");

  // ── prodotti: category tabs + malte search ──
  const catTabs = [...document.querySelectorAll(".cat-tab")];
  const catPanels = [...document.querySelectorAll(".cat-panel")];
  if (catTabs.length) {
    catTabs.forEach(tab => tab.addEventListener("click", () => {
      const cat = tab.dataset.cat;
      catPanels.forEach(p => p.classList.toggle("hidden", p.dataset.cat !== cat));
      catTabs.forEach(t => {
        const on = t === tab;
        t.classList.toggle("border-red", on);
        t.classList.toggle("border-transparent", !on);
      });
      runReveal();
    }));
  }
  const malteSearch = document.getElementById("malteSearch");
  if (malteSearch) {
    const cards = [...document.querySelectorAll(".subcat-card")];
    const empty = document.getElementById("malteEmpty");
    malteSearch.addEventListener("input", () => {
      const q = malteSearch.value.trim().toLowerCase();
      let shown = 0;
      cards.forEach(c => { const ok = !q || c.dataset.name.includes(q); c.classList.toggle("hidden", !ok); if (ok) shown++; });
      if (empty) empty.classList.toggle("hidden", shown !== 0);
    });
  }

  // ── prodotti: auto-carica le immagini categoria se presenti in img/categorie/ ──
  // Convenzione: <nome categoria in minuscolo, spazi -> trattini>.{jpg|png|webp}
  // Finché il file non esiste resta lo sfondo materico. Vedi img/categorie/README.md
  function autoCatImage(thumb, slug) {
    if (!thumb || !slug) return;
    const exts = ["jpg", "png", "webp"];
    let i = 0;
    (function tryNext() {
      if (i >= exts.length) return;
      const url = "img/categorie/" + slug + "." + exts[i++];
      const probe = new Image();
      probe.onload = () => {
        thumb.style.backgroundImage = 'url("' + url + '")';
        thumb.style.backgroundSize = "cover";
        thumb.style.backgroundPosition = "center";
        thumb.classList.remove("mat", "mat-grey", "mat-white", "mat-ochre", "mat-bio", "mat-anthr", "mat-red");
      };
      probe.onerror = tryNext;
      probe.src = url;
    })();
  }
  document.querySelectorAll(".subcat-card").forEach(card => {
    autoCatImage(card.querySelector("div"), (card.dataset.name || "").replace(/\s+/g, "-"));
  });
  document.querySelectorAll(".cat-tab").forEach(tab => {
    autoCatImage(tab.querySelector("div"), "famiglia-" + tab.dataset.cat);
  });

  // ── global search overlay ──
  (function () {
    const overlay = document.getElementById("searchOverlay");
    const input = document.getElementById("searchInput");
    const results = document.getElementById("searchResults");
    if (!overlay || !input || !results) return;

    const pages = [
      { label: "Home", sub: "Pagina principale", view: "home" },
      { label: "Prodotti", sub: "Catalogo malte e rivestimenti", view: "prodotti" },
      { label: "Cemento sfuso", sub: "Fornitura in silo e autobotte", view: "cemento" },
      { label: "News", sub: "Notizie ed eventi", view: "news" },
      { label: "Contatti", sub: "Dove trovarci e come scriverci", view: "contatti" },
      { label: "Area download", sub: "Cataloghi e documenti", view: "download" },
      { label: "Lavora con noi", sub: "Posizioni e candidature spontanee", view: "lavora" },
      { label: "Chi siamo", sub: "L'azienda dal 1990", view: "home" },
    ];
    // categorie prodotto lette direttamente dal catalogo (si auto-aggiornano)
    const cats = [...document.querySelectorAll(".subcat-card")].map(c => {
      const name = (c.dataset.name || "").trim();
      const fam = c.closest("#fam-rivestimenti") ? "Rivestimenti e idropitture" : "Malte";
      return { label: name.replace(/\b\w/g, x => x.toUpperCase()), sub: fam, view: "product", cat: name };
    });
    const seen = new Set();
    const items = [...cats, ...pages].filter(it => {
      const k = it.view + "|" + (it.cat || it.label);
      if (seen.has(k)) return false; seen.add(k); return true;
    });

    let active = 0, shown = [];
    function icon(it) {
      if (it.view === "product") return '<span class="sr-ico bg-red/10 text-red"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m21 16-9 5-9-5V8l9-5 9 5Z"/><path d="m3 8 9 5 9-5M12 13v8"/></svg></span>';
      return '<span class="sr-ico bg-bg2 text-ink border border-line"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16v16H4z"/><path d="M4 9h16M9 21V9"/></svg></span>';
    }
    function render(q) {
      q = (q || "").trim().toLowerCase();
      shown = items.filter(it => !q || it.label.toLowerCase().includes(q) || it.sub.toLowerCase().includes(q)).slice(0, 14);
      active = 0;
      if (!shown.length) { results.innerHTML = '<div class="px-4 py-7 text-center text-muted text-sm">Nessun risultato. Prova un\'altra parola o <a href="#" data-view="contatti" data-search-close class="text-red font-semibold">contattaci</a>.</div>'; return; }
      results.innerHTML = shown.map((it, i) => (
        '<div class="sr-item' + (i === 0 ? ' active' : '') + '" data-i="' + i + '">' + icon(it) +
        '<div class="min-w-0"><div class="font-semibold text-sm truncate">' + it.label + '</div><div class="text-[12px] text-muted truncate">' + it.sub + '</div></div>' +
        '<span class="ml-auto text-faint text-sm shrink-0">→</span></div>'
      )).join("");
    }
    function go(it) { if (!it) return; close(); if (it.view === "product" && it.cat) setProductCategory(it.cat); setView(it.view); }
    function open() { overlay.classList.remove("hidden"); document.body.classList.add("ov-lock"); input.value = ""; render(""); setTimeout(() => input.focus(), 30); }
    function close() { overlay.classList.add("hidden"); document.body.classList.remove("ov-lock"); }

    document.querySelectorAll("[data-search]").forEach(b => b.addEventListener("click", open));
    overlay.querySelectorAll("[data-search-close]").forEach(x => x.addEventListener("click", close));
    input.addEventListener("input", () => render(input.value));
    results.addEventListener("click", (e) => {
      if (e.target.closest("[data-search-close]")) { close(); return; }
      const row = e.target.closest(".sr-item");
      if (row) go(shown[+row.dataset.i]);
    });
    input.addEventListener("keydown", (e) => {
      if (e.key === "ArrowDown") { e.preventDefault(); active = Math.min(active + 1, shown.length - 1); }
      else if (e.key === "ArrowUp") { e.preventDefault(); active = Math.max(active - 1, 0); }
      else if (e.key === "Enter") { e.preventDefault(); go(shown[active]); return; }
      else return;
      results.querySelectorAll(".sr-item").forEach((r, i) => r.classList.toggle("active", i === active));
      const el = results.querySelector(".sr-item.active"); if (el) el.scrollIntoView({ block: "nearest" });
    });
    document.addEventListener("keydown", (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); overlay.classList.contains("hidden") ? open() : close(); }
      if (e.key === "Escape" && !overlay.classList.contains("hidden")) close();
    });
  })();

  // ── news: lettore articolo (overlay leggero) ──
  (function () {
    const overlay = document.getElementById("articleOverlay");
    if (!overlay) return;
    const elCat = document.getElementById("articleCat"), elDate = document.getElementById("articleDate"),
          elTitle = document.getElementById("articleTitle"), elBody = document.getElementById("articleBody"),
          elCover = document.getElementById("articleCover");

    const articles = {
      "Linea KREATIV by Rofix": { cat: "NEWS", date: "23 NOV 2019", mat: "mat-ochre", body: [
        "Le facciate prendono vita con la linea KREATIV by Rofix: una gamma di finiture decorative pensata come alternativa creativa alle rifiniture tradizionali dei sistemi a cappotto.",
        "Texture, effetti materici e una vasta scelta cromatica permettono di personalizzare l'estetica dell'edificio mantenendo intatte le prestazioni di isolamento e protezione del sistema ETICS.",
        "Una soluzione ideale per progettisti e imprese che vogliono unire resa estetica e durabilità nel tempo."
      ] },
      "Incontro tecnico": { cat: "EVENTO", date: "27 APR 2018", mat: "mat-grey", body: [
        "Si è tenuto presso la nostra sede un incontro tecnico dedicato al sistema contro l'umidità di risalita, con il coinvolgimento di tecnici, applicatori e imprese del territorio.",
        "Durante la giornata sono state illustrate le cause dell'umidità di risalita e le soluzioni Magix per il risanamento delle murature, con dimostrazioni pratiche di applicazione.",
        "Un'occasione di formazione e confronto diretto, in linea con il nostro impegno nel supporto tecnico al cantiere."
      ] },
      "Future now — 2019": { cat: "NEWS", date: "29 MAR 2018", mat: "mat-anthr", body: [
        "Future now: una nuova generazione di edifici nasce da un approccio progettuale e costruttivo innovativo, efficiente e misurabile.",
        "Materiali ad alte prestazioni, attenzione all'efficienza energetica e processi controllati sono i pilastri di un modo di costruire orientato al futuro.",
        "Magix accompagna questa evoluzione con prodotti studiati per durare e per ridurre l'impatto ambientale delle costruzioni."
      ] },
      "La vita è piena di colori": { cat: "PRODOTTI", date: "29 MAG 2017", mat: "mat-ochre", body: [
        "È disponibile la nuova mazzetta colori per esterni e interni: 695 tonalità suddivise in 10 segmenti di colore, per dare libertà espressiva a ogni progetto.",
        "Le tinte sono studiate per garantire stabilità e resistenza nel tempo, anche in condizioni di forte esposizione, mantenendo brillantezza e uniformità.",
        "Uno strumento pratico per architetti, imprese e privati alla ricerca della finitura perfetta."
      ] },
      "DM 28 Maggio 2015": { cat: "NORMATIVA", date: "13 GEN 2017", mat: "mat-white", body: [
        "A seguito dell'entrata in vigore della direttiva 2015/830/CE, le schede di sicurezza dei prodotti sono state aggiornate secondo il nuovo formato previsto dalla normativa.",
        "L'aggiornamento riguarda la classificazione, l'etichettatura e le informazioni sulla manipolazione e lo stoccaggio in sicurezza dei materiali.",
        "Le schede aggiornate sono disponibili nell'Area download del sito o su richiesta tramite i nostri contatti."
      ] },
      "Isolamento termico": { cat: "TECNICA", date: "12 GEN 2017", mat: "mat-bio", body: [
        "L'isolamento termico degli edifici può essere realizzato con diverse tecniche: sistema a cappotto, intonaco termoisolante o incollaggio di pannelli, sia per interni che per esterni.",
        "La scelta della soluzione più adatta dipende dalle caratteristiche dell'edificio, dagli obiettivi di efficienza energetica e dai vincoli di cantiere.",
        "Magix offre cicli completi e supporto tecnico per individuare la configurazione ottimale in ogni situazione."
      ] },
    };

    function open(title, a) {
      elCat.textContent = a.cat; elDate.textContent = a.date; elTitle.textContent = title;
      elCover.className = "mat " + (a.mat || "mat-ochre") + " h-44 relative shrink-0";
      elBody.innerHTML = a.body.map(p => '<p>' + p + '</p>').join("");
      overlay.classList.remove("hidden"); document.body.classList.add("ov-lock");
      overlay.scrollTop = 0;
    }
    function close() { overlay.classList.add("hidden"); document.body.classList.remove("ov-lock"); }

    overlay.querySelectorAll("[data-article-close]").forEach(x => x.addEventListener("click", close));
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !overlay.classList.contains("hidden")) close(); });

    document.querySelectorAll("#view-news a").forEach(a => {
      const h = a.querySelector("h2, h3");
      if (!h) return;
      const art = articles[h.textContent.trim()];
      if (!art) return;
      a.addEventListener("click", (e) => { e.preventDefault(); open(h.textContent.trim(), art); });
    });
  })();

  // ── init ──
  setView("home");
