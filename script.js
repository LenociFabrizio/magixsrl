  // ── view router ──
  const views = { home: "view-home", prodotti: "view-prodotti", cemento: "view-cemento", news: "view-news", contatti: "view-contatti", lavora: "view-lavora", download: "view-download", product: "view-product", admin: "view-admin" };
  function setView(name) {
    const targetId = views[name] || views.home;
    Object.values(views).forEach(id => { const el = document.getElementById(id); if (el) el.classList.remove("active"); });
    document.getElementById(targetId).classList.add("active");
    const fab = document.getElementById("waFab");
    if (fab) fab.classList.toggle("hidden", targetId === "view-admin");
    window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
    runReveal();
  }

  // ── nav links (logo, header nav, footer, in-page CTAs) ──
  document.querySelectorAll("[data-view]").forEach(el =>
    el.addEventListener("click", (e) => { e.preventDefault(); setView(el.dataset.view); })
  );

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

  // ── qty stepper ──
  let qty = 1;
  document.querySelectorAll(".qty-btn").forEach(b => b.addEventListener("click", () => {
    qty = Math.max(1, qty + parseInt(b.dataset.d, 10));
    document.getElementById("qty").textContent = qty;
  }));

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

  // ── init ──
  setView("home");
