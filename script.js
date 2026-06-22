  // ── view router ──
  const views = { home: "view-home", prodotti: "view-prodotti", cemento: "view-cemento", news: "view-news", contatti: "view-contatti", lavora: "view-lavora", download: "view-download", catalog: "view-catalog", product: "view-product", privacy: "view-privacy", cookie: "view-cookie", admin: "view-admin" };
  // ── catalogo prodotti (dati da catalog-data.js) ──
  const CATALOG = window.MAGIX_CATALOG || {};
  const CINDEX = window.MAGIX_CATALOG_INDEX || {};
  let currentCatKey = null; // categoria attualmente mostrata (per breadcrumb "indietro")
  let currentProductCode = null; // prodotto attualmente in scheda (per il pulsante preferiti)

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
    const key = (name === "product" || name === "catalog") ? "prodotti" : name;
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
    let targetView = el.dataset.view;

    // prodotto specifico (card elenco categoria o "spesso ordinati insieme")
    if (targetView === "product" && el.dataset.prod) {
      if (renderProduct(el.dataset.prod.trim())) { setView("product"); closeMega(true); closeMobile(); return; }
    }

    // categoria: card subcat / voce mega menu. Se la categoria ha prodotti a catalogo
    // mostro l'elenco (view-catalog), altrimenti mantengo il vecchio comportamento.
    if (targetView === "product" || targetView === "catalog") {
      const cat = (el.dataset.name || (el.classList.contains("mega-cat") ? el.textContent : "") || "").trim();
      if (cat && CATALOG && CATALOG[cat.toLowerCase()]) {
        renderCatalog(cat.toLowerCase());
        setView("catalog"); closeMega(true); closeMobile(); return;
      }
      // fallback: categoria non ancora popolata → vecchia scheda mockup
      if (cat) setProductCategory(cat);
      targetView = "product";
    }

    setView(targetView);
    closeMega(true); closeMobile();
  });

  // ── product: applica la categoria scelta (mega menu / catalogo) ──
  function setProductCategory(name) {
    if (!name) return;
    const label = name.replace(/\b\w/g, c => c.toUpperCase());
    const crumb = document.getElementById("pCrumbCat");
    if (crumb) crumb.textContent = label;
  }

  // ── helpers catalogo ──
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const skuOf = (code) => "MGX-" + String(code).toUpperCase().replace(/[^A-Z0-9]+/g, "-").replace(/^-|-$/g, "");

  function setSeo(title, description) {
    if (title) document.title = title;
    if (description != null) {
      let m = document.querySelector('meta[name="description"]');
      if (!m) { m = document.createElement("meta"); m.setAttribute("name", "description"); document.head.appendChild(m); }
      m.setAttribute("content", description);
    }
  }

  function setProductJsonLd(p) {
    let s = document.getElementById("pJsonLd");
    if (!s) { s = document.createElement("script"); s.type = "application/ld+json"; s.id = "pJsonLd"; document.head.appendChild(s); }
    s.textContent = JSON.stringify({
      "@context": "https://schema.org", "@type": "Product",
      name: "Magix " + p.name, sku: skuOf(p.code), brand: { "@type": "Brand", name: "Magix" },
      category: (CINDEX[p.code] && CINDEX[p.code].catKey) || undefined,
      description: (p.seo && p.seo.description) || p.subtitle || ""
    });
  }

  // elenco prodotti di una categoria (view-catalog)
  function renderCatalog(catKey) {
    const cat = CATALOG[catKey];
    if (!cat) return false;
    currentCatKey = catKey;
    const title = document.getElementById("catTitle");
    const crumb = document.getElementById("catCrumb");
    const intro = document.getElementById("catIntro");
    const grid = document.getElementById("catalogGrid");
    const extra = document.getElementById("catalogExtra");
    if (title) title.textContent = cat.label;
    if (crumb) crumb.textContent = cat.label;
    if (intro) intro.textContent = cat.intro || "";
    setSeo((cat.seo && cat.seo.title) || (cat.label + " | Magix"), cat.seo && cat.seo.description);

    if (grid) {
      grid.innerHTML = (cat.products || []).map(p => {
        const badge = p.cam
          ? '<span class="text-[10px] font-semibold text-bio bg-biosoft border border-bio/20 rounded-full px-2 py-0.5">CAM</span>'
          : (p.availability === "order"
            ? '<span class="text-[10px] font-semibold text-faint bg-bg2 border border-line rounded-full px-2 py-0.5">su ordinazione</span>'
            : '<span class="text-[10px] font-semibold text-bio bg-biosoft border border-bio/20 rounded-full px-2 py-0.5">disponibile</span>');
        const media = p.img
          ? '<div class="h-32 bg-white border-b border-line flex items-center justify-center overflow-hidden"><img src="' + encodeURI(p.img) + '" alt="' + esc(p.name) + '" loading="lazy" class="max-h-full max-w-full object-contain p-2"></div>'
          : '<div class="mat ' + esc(p.mat || cat.mat || "mat-grey") + ' h-32"></div>';
        return '<a href="#" data-view="product" data-prod="' + esc(p.code) + '" class="subcat-card reveal lift group bg-surface rounded-2xl border border-line shadow-soft overflow-hidden hover:shadow-lift hover:border-ink/20 flex flex-col">'
          + media
          + '<div class="p-5 flex-1 flex flex-col">'
          + '<div class="flex items-center justify-between gap-2"><span class="mono text-[12px] text-faint">' + esc(p.code) + '</span>' + badge + '</div>'
          + '<h3 class="display font-bold text-lg leading-snug mt-1.5">' + esc(p.name) + '</h3>'
          + '<p class="text-muted text-sm mt-1.5 leading-relaxed flex-1">' + esc(p.subtitle) + '</p>'
          + '<div class="flex items-center justify-between mt-4"><span class="mono text-[10px] bg-bg2 border border-line rounded px-2 py-1">' + esc(p.norma || "") + '</span>'
          + '<span class="text-red font-semibold group-hover:translate-x-1 transition shrink-0">→</span></div>'
          + '</div></a>';
      }).join("");
    }

    // blocco extra di categoria (es. tabella consumi muratura)
    if (extra) {
      if (cat.consumi) {
        const c = cat.consumi;
        extra.innerHTML = '<div class="kicker text-red flex items-center gap-2"><span>◢</span> ' + esc(c.title.toUpperCase()) + '</div>'
          + '<h2 class="display font-bold text-2xl mt-2 mb-5">' + esc(c.title) + '</h2>'
          + '<div class="bg-surface rounded-2xl border border-line shadow-soft overflow-hidden overflow-x-auto"><table class="w-full text-sm"><thead><tr class="bg-bg2 text-left">'
          + c.head.map(h => '<th class="px-5 py-3 font-semibold">' + esc(h) + '</th>').join("")
          + '</tr></thead><tbody class="divide-y divide-linesoft">'
          + c.rows.map((r, i) => '<tr' + (i % 2 ? ' class="bg-bg/40"' : '') + '>' + r.map((cell, j) => '<td class="px-5 py-3 ' + (j ? 'mono text-right' : 'font-medium') + '">' + esc(cell) + '</td>').join("") + '</tr>').join("")
          + '</tbody></table></div>';
      } else {
        extra.innerHTML = "";
      }
    }
    runReveal();
    return true;
  }

  // scheda tecnica prodotto (view-product, template esistente popolato da dati)
  function renderProduct(code) {
    const entry = CINDEX[code];
    if (!entry) return false;
    const p = entry.product;
    const cat = CATALOG[entry.catKey];
    currentCatKey = entry.catKey;
    currentProductCode = p.code;
    // sincronizza il cuore preferiti con lo stato salvato per questo prodotto
    paintFav(document.getElementById("favBtn"), isFav(p.code));

    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    set("pName", "Magix " + p.name);
    set("pCrumbName", p.name);
    set("pDesc", p.subtitle || "");
    set("pSku", "SKU · " + skuOf(p.code));
    set("pNormaChip", p.norma ? ("CE · " + p.norma) : "CE");

    // breadcrumb categoria → torna all'elenco categoria
    const crumbCat = document.getElementById("pCrumbCat");
    if (crumbCat) { crumbCat.textContent = cat ? cat.label : ""; crumbCat.dataset.name = entry.catKey; }

    // hero: foto reale del prodotto se disponibile, altrimenti swatch materico
    const swatch = document.getElementById("mainSwatch");
    if (swatch) {
      let heroImg = document.getElementById("pHeroImg");
      if (p.img) {
        swatch.className = "rounded-3xl aspect-[4/3] shadow-soft border border-line relative bg-white flex items-center justify-center overflow-hidden cursor-zoom-in";
        if (!heroImg) {
          heroImg = document.createElement("img");
          heroImg.id = "pHeroImg";
          heroImg.className = "max-h-full max-w-full object-contain p-6 transition-transform duration-200 ease-out will-change-transform";
          swatch.insertBefore(heroImg, swatch.firstChild);
        }
        heroImg.style.transform = "scale(1)";
        heroImg.style.transformOrigin = "center center";
        heroImg.src = encodeURI(p.img);
        heroImg.alt = "Magix " + p.name;
      } else {
        swatch.className = "mat " + (p.mat || "mat-grey") + " rounded-3xl aspect-[4/3] shadow-soft border border-line relative";
        if (heroImg) heroImg.remove();
      }
    }
    // miniature materiche: nascoste quando c'è una foto reale (galleria a immagine singola)
    const thumbs = document.getElementById("pThumbs");
    if (thumbs) thumbs.classList.toggle("hidden", !!p.img);

    // badge disponibilità + CAM
    const avail = document.getElementById("pAvail");
    if (avail) {
      if (p.availability === "order") {
        avail.className = "text-[11px] font-semibold text-faint bg-bg2 border border-line rounded-full px-2.5 py-1 flex items-center gap-1.5";
        avail.innerHTML = '<span class="w-1.5 h-1.5 rounded-full bg-faint"></span> Disponibile su ordinazione';
      } else {
        avail.className = "text-[11px] font-semibold text-bio bg-biosoft border border-bio/20 rounded-full px-2.5 py-1 flex items-center gap-1.5";
        avail.innerHTML = '<span class="w-1.5 h-1.5 rounded-full bg-bio"></span> Disponibile · pronta consegna';
      }
    }
    const camBadge = document.getElementById("pCam");
    if (camBadge) camBadge.classList.toggle("hidden", !p.cam);

    // tabella scheda tecnica
    const body = document.getElementById("pSpecBody");
    if (body && p.spec) {
      const rows = [["Norma di riferimento", p.norma || "—"]].concat(Object.keys(p.spec).map(k => [k, p.spec[k]]));
      body.innerHTML = rows.map(([k, v], i) =>
        '<tr' + (i % 2 ? ' class="bg-bg/40"' : '') + '><td class="px-5 py-3.5 text-muted w-1/2">' + esc(k) + '</td><td class="px-5 py-3.5 mono font-medium text-right">' + esc(v) + '</td></tr>'
      ).join("");
    }

    // sezioni descrittive
    const sections = document.getElementById("pSections");
    if (sections) {
      const block = (label, txt) => txt ? '<div><div class="kicker text-faint">' + esc(label) + '</div><p class="text-inksoft mt-2 leading-relaxed">' + esc(txt) + '</p></div>' : "";
      let html = "";
      html += block("Composizione", p.composizione);
      html += block("Impiego", p.impiego);
      html += block("Applicazione e lavorazione", p.applicazione);
      if (p.fornitura && p.fornitura.length) {
        html += '<div><div class="kicker text-faint">Fornitura</div><ul class="mt-2 space-y-1.5 text-inksoft">' + p.fornitura.map(f => '<li class="flex gap-2"><span class="text-red">•</span><span>' + esc(f) + '</span></li>').join("") + '</ul></div>';
      }
      if (p.cam_note) html += block("CAM — Criteri Ambientali Minimi", p.cam_note);
      if (p.conservazione_note) html += block("Conservazione", p.conservazione_note);
      if (p.avvertenze && p.avvertenze.length) {
        html += '<div class="bg-bg2 border border-line rounded-2xl p-5"><div class="kicker text-red">Avvertenze</div><ul class="mt-2 space-y-1.5 text-inksoft text-sm">' + p.avvertenze.map(a => '<li class="flex gap-2"><span class="text-red">•</span><span>' + esc(a) + '</span></li>').join("") + '</ul></div>';
      }
      html += '<p class="text-[11px] text-faint leading-relaxed">' + esc(window.MAGIX_CATALOG_DISCLAIMER || "") + '</p>';
      sections.innerHTML = html;
    }

    setSeo((p.seo && p.seo.title) || ("Magix " + p.name), p.seo && p.seo.description);
    setProductJsonLd(p);
    runReveal();
    return true;
  }

  // espongo per debug/uso esterno
  window.renderCatalog = renderCatalog;
  window.renderProduct = renderProduct;

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

  // ── product hero: zoom fluido al passaggio del mouse (solo sull'area immagine) ──
  // Usa transform:scale con transform-origin che segue il cursore (GPU, performante).
  // Lo scale è animato (transition-transform); l'origin si aggiorna istantaneo così
  // lo zoom resta agganciato al punto sotto al puntatore. Layout/aspect-ratio invariati
  // (il contenitore è overflow-hidden). Funziona con foto orizzontali e verticali.
  (function () {
    const box = document.getElementById("mainSwatch");
    if (!box) return;
    const ZOOM = 2.2;
    box.addEventListener("mousemove", (e) => {
      const img = document.getElementById("pHeroImg");
      if (!img) return; // attivo solo quando c'è una foto reale, non sullo swatch materico
      const r = box.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width) * 100;
      const y = ((e.clientY - r.top) / r.height) * 100;
      img.style.transformOrigin = x + "% " + y + "%";
      img.style.transform = "scale(" + ZOOM + ")";
    });
    box.addEventListener("mouseleave", () => {
      const img = document.getElementById("pHeroImg");
      if (!img) return;
      img.style.transform = "scale(1)";
      img.style.transformOrigin = "center center";
    });
  })();

  // ── preferiti (localStorage, nessun login richiesto) ──
  const FAV_KEY = "magix_favorites";
  function getFavs() { try { return JSON.parse(localStorage.getItem(FAV_KEY)) || []; } catch (e) { return []; } }
  function setFavs(a) { try { localStorage.setItem(FAV_KEY, JSON.stringify(a)); } catch (e) {} }
  function isFav(code) { return getFavs().indexOf(code) !== -1; }
  function toggleFav(code) {
    const a = getFavs(); const i = a.indexOf(code);
    if (i === -1) a.push(code); else a.splice(i, 1);
    setFavs(a); return i === -1; // true = aggiunto
  }
  // aggiorna l'aspetto del cuore (riempito/rosso quando attivo)
  function paintFav(btn, active) {
    if (!btn) return;
    btn.classList.toggle("border-red", active);
    btn.classList.toggle("text-red", active);
    btn.classList.toggle("bg-red/5", active);
    btn.setAttribute("aria-pressed", active ? "true" : "false");
    btn.title = active ? "Rimuovi dai preferiti" : "Aggiungi ai preferiti";
    const svg = btn.querySelector("svg");
    if (svg) svg.setAttribute("fill", active ? "currentColor" : "none");
  }
  const favBtn = document.getElementById("favBtn");
  if (favBtn) favBtn.addEventListener("click", () => {
    if (!currentProductCode) return;
    paintFav(favBtn, toggleFav(currentProductCode));
  });

  // ── prodotti: barra famiglie con stato attivo (click + scrollspy) ──
  (function () {
    const links = [...document.querySelectorAll(".fam-link")];
    if (!links.length) return;
    function setActive(id) {
      links.forEach(l => {
        const on = l.dataset.fam === id;
        l.classList.toggle("bg-graphite", on);
        l.classList.toggle("text-white", on);
        l.classList.toggle("border", !on);
        l.classList.toggle("border-line", !on);
        l.classList.toggle("bg-surface", !on);
        const badge = l.querySelector(".fam-badge");
        if (badge) {
          badge.classList.toggle("bg-white/20", on);
          badge.classList.toggle("bg-bg2", !on);
          badge.classList.toggle("border", !on);
          badge.classList.toggle("border-line", !on);
        }
      });
    }
    links.forEach(l => l.addEventListener("click", () => setActive(l.dataset.fam)));
    // scrollspy: evidenzia la famiglia visibile mentre si scorre la pagina
    const targets = links.map(l => document.getElementById(l.dataset.fam)).filter(Boolean);
    if ("IntersectionObserver" in window && targets.length) {
      const spy = new IntersectionObserver((entries) => {
        entries.forEach(e => { if (e.isIntersecting) setActive(e.target.id); });
      }, { rootMargin: "-45% 0px -50% 0px", threshold: 0 });
      targets.forEach(t => spy.observe(t));
    }
  })();

  // ── contatti: teaser Instagram ──
  // Senza API ufficiale (Instagram Basic Display / Graph richiedono app + token lato
  // server), si riusano le foto prodotto già presenti a catalogo come tessere che
  // rimandano al profilo. Soluzione leggera, senza script esterni né tracciamento.
  (function () {
    const feed = document.getElementById("igFeed");
    if (!feed) return;
    const PROFILE = "https://www.instagram.com/magix.srl/";
    const seen = new Set(), tiles = [];
    Object.keys(CINDEX).forEach(code => {
      const p = CINDEX[code].product;
      if (p && p.img && !seen.has(p.img)) { seen.add(p.img); tiles.push({ img: p.img, name: p.name }); }
    });
    const ig = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>';
    feed.innerHTML = tiles.slice(0, 6).map(t =>
      '<a href="' + PROFILE + '" target="_blank" rel="noopener" class="group relative block aspect-square rounded-xl overflow-hidden border border-line bg-white" title="Seguici su Instagram">'
      + '<img src="' + encodeURI(t.img) + '" alt="' + esc(t.name) + ' — Magix su Instagram" loading="lazy" class="w-full h-full object-contain p-3 transition-transform duration-300 group-hover:scale-105">'
      + '<span class="absolute inset-0 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition" style="background:linear-gradient(45deg,rgba(245,133,41,.85),rgba(221,42,123,.85),rgba(129,52,175,.85))">' + ig + '</span>'
      + '</a>'
    ).join("");
  })();

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
    const pills = [...document.querySelectorAll(".dl-pill")];
    const search = document.getElementById("dlSearch");
    const empty = document.getElementById("dlEmpty");
    let cat = "all";
    // ri-interroga le card ad ogni filtro: così funziona anche dopo che
    // l'Area download viene rigenerata dai dati API (vedi renderDocs).
    function apply() {
      const cards = [...dlGrid.querySelectorAll(".doc-card")];
      const q = (search && search.value || "").trim().toLowerCase();
      let shown = 0;
      cards.forEach(c => {
        const ok = (cat === "all" || c.dataset.cat === cat) && (!q || (c.dataset.title || "").includes(q));
        c.classList.toggle("hidden", !ok);
        if (ok) shown++;
      });
      if (empty) empty.classList.toggle("hidden", shown !== 0);
    }
    window.__magixReapplyDocFilter = apply;
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
  const adminTitles = { dashboard: "Dashboard", categorie: "Categorie", prodotti: "Prodotti", news: "News", download: "Cataloghi & download", lavora: "Posizioni" };
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

  // ── admin: i submit reali (CRUD via API) sono gestiti nel controller admin
  //    in fondo al file. Qui niente più "fake submit" prototipo. ──

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
      "Linea KREATIV by Rofix": { cat: "NEWS", date: "23 NOV 2019", img: "img/news/rofix.webp", body: [
        "Le facciate prendono vita con la linea KREATIV by Rofix: una gamma di finiture decorative pensata come alternativa creativa alle rifiniture tradizionali dei sistemi a cappotto.",
        "Texture, effetti materici e una vasta scelta cromatica permettono di personalizzare l'estetica dell'edificio mantenendo intatte le prestazioni di isolamento e protezione del sistema ETICS.",
        "Una soluzione ideale per progettisti e imprese che vogliono unire resa estetica e durabilità nel tempo."
      ] },
      "Incontro tecnico": { cat: "EVENTO", date: "27 APR 2018", img: "img/news/incontro.webp", body: [
        "Si è tenuto presso la nostra sede un incontro tecnico dedicato al sistema contro l'umidità di risalita, con il coinvolgimento di tecnici, applicatori e imprese del territorio.",
        "Durante la giornata sono state illustrate le cause dell'umidità di risalita e le soluzioni Magix per il risanamento delle murature, con dimostrazioni pratiche di applicazione.",
        "Un'occasione di formazione e confronto diretto, in linea con il nostro impegno nel supporto tecnico al cantiere."
      ] },
      "Future now — 2019": { cat: "NEWS", date: "29 MAR 2018", img: "img/news/future_now.webp", body: [
        "Future now: una nuova generazione di edifici nasce da un approccio progettuale e costruttivo innovativo, efficiente e misurabile.",
        "Materiali ad alte prestazioni, attenzione all'efficienza energetica e processi controllati sono i pilastri di un modo di costruire orientato al futuro.",
        "Magix accompagna questa evoluzione con prodotti studiati per durare e per ridurre l'impatto ambientale delle costruzioni."
      ] },
      "La vita è piena di colori": { cat: "PRODOTTI", date: "29 MAG 2017", img: "img/news/colori.webp", body: [
        "È disponibile la nuova mazzetta colori per esterni e interni: 695 tonalità suddivise in 10 segmenti di colore, per dare libertà espressiva a ogni progetto.",
        "Le tinte sono studiate per garantire stabilità e resistenza nel tempo, anche in condizioni di forte esposizione, mantenendo brillantezza e uniformità.",
        "Uno strumento pratico per architetti, imprese e privati alla ricerca della finitura perfetta."
      ] },
      "DM 28 Maggio 2015": { cat: "NORMATIVA", date: "13 GEN 2017", img: "img/news/gazzetta_ufficiale-copia.webp", body: [
        "A seguito dell'entrata in vigore della direttiva 2015/830/CE, le schede di sicurezza dei prodotti sono state aggiornate secondo il nuovo formato previsto dalla normativa.",
        "L'aggiornamento riguarda la classificazione, l'etichettatura e le informazioni sulla manipolazione e lo stoccaggio in sicurezza dei materiali.",
        "Le schede aggiornate sono disponibili nell'Area download del sito o su richiesta tramite i nostri contatti."
      ] },
      "Isolamento termico": { cat: "TECNICA", date: "12 GEN 2017", img: "img/news/isolamento-termico.webp", body: [
        "L'isolamento termico degli edifici può essere realizzato con diverse tecniche: sistema a cappotto, intonaco termoisolante o incollaggio di pannelli, sia per interni che per esterni.",
        "La scelta della soluzione più adatta dipende dalle caratteristiche dell'edificio, dagli obiettivi di efficienza energetica e dai vincoli di cantiere.",
        "Magix offre cicli completi e supporto tecnico per individuare la configurazione ottimale in ogni situazione."
      ] },
    };

    // normalizza sia la forma statica {cat,date,img,body} sia quella API {cat,data,img,corpo,titolo}
    function norm(a, titolo) {
      return {
        titolo: a.titolo || titolo || "",
        cat: a.cat || "NEWS",
        data: a.data || a.date || "",
        img: a.img || "",
        mat: a.mat || "mat-ochre",
        corpo: Array.isArray(a.corpo) ? a.corpo : (Array.isArray(a.body) ? a.body : []),
      };
    }

    // registro per id: parte dal fallback statico (slug del titolo), poi sovrascritto da __magixSetNews
    function slug(s) { return String(s || "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }
    const FALLBACK = {};
    Object.keys(articles).forEach(t => { FALLBACK[slug(t)] = norm(articles[t], t); });
    let REG = Object.assign({}, FALLBACK);
    // i titoli statici puntano allo stesso id-slug (per i link non rigenerati)
    const TITLE2ID = {}; Object.keys(articles).forEach(t => { TITLE2ID[t] = slug(t); });

    window.__magixSetNews = function (list) {
      const next = {};
      (list || []).forEach(n => { if (n && n.id) next[n.id] = norm(n, n.titolo); });
      REG = Object.keys(next).length ? next : Object.assign({}, FALLBACK);
    };

    function open(a) {
      if (!a) return;
      elCat.textContent = String(a.cat || "").toUpperCase(); elDate.textContent = a.data; elTitle.textContent = a.titolo;
      if (a.img) {
        elCover.className = "h-44 relative shrink-0 overflow-hidden bg-bg2";
        elCover.style.backgroundImage = "url('" + encodeURI(a.img) + "')";
        elCover.style.backgroundSize = "cover";
        elCover.style.backgroundPosition = "center";
      } else {
        elCover.className = "mat " + (a.mat || "mat-ochre") + " h-44 relative shrink-0";
        elCover.style.backgroundImage = "";
      }
      elBody.innerHTML = a.corpo.map(p => '<p>' + esc(p) + '</p>').join("");
      overlay.classList.remove("hidden"); document.body.classList.add("ov-lock");
      overlay.scrollTop = 0;
    }
    function close() { overlay.classList.add("hidden"); document.body.classList.remove("ov-lock"); }

    overlay.querySelectorAll("[data-article-close]").forEach(x => x.addEventListener("click", close));
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !overlay.classList.contains("hidden")) close(); });

    // apre per id (usato dai link rigenerati con data-news-id)
    window.openArticle = function (id) { open(REG[id]); };

    // delega: copre sia le card rigenerate (data-news-id) sia quelle statiche (match per titolo)
    const newsView = document.getElementById("view-news");
    if (newsView) newsView.addEventListener("click", (e) => {
      const byId = e.target.closest("[data-news-id]");
      if (byId) { e.preventDefault(); open(REG[byId.getAttribute("data-news-id")]); return; }
      const link = e.target.closest("a");
      if (!link) return;
      const h = link.querySelector("h2, h3");
      if (h && TITLE2ID[h.textContent.trim()]) { e.preventDefault(); open(REG[TITLE2ID[h.textContent.trim()]]); }
    });
  })();

  // ── mappa contatti: niente apertura automatica su touch ──
  // Su desktop (puntatore fine) l'iframe si carica subito come prima.
  // Su dispositivi touch resta un placeholder: l'iframe viene iniettato solo
  // al tap, così la pagina Google Maps non può deep-linkare l'app al caricamento.
  (function () {
    const frame = document.getElementById("mapFrame");
    if (!frame) return;
    const ph = document.getElementById("mapPlaceholder");
    const src = frame.getAttribute("data-src");
    const coarse = window.matchMedia("(hover: none), (pointer: coarse)").matches;

    function loadMap() {
      if (frame.src || !src) return;
      frame.src = src;
      if (ph) ph.classList.add("hidden");
    }

    if (coarse && ph) {
      ph.classList.remove("hidden");
      ph.addEventListener("click", loadMap);
    } else {
      loadMap();
    }
  })();

  // ══════════════════════════════════════════════════════════════════════
  //  BACKEND LIVE — client API, bootstrap dati pubblici, controller admin
  //  GET pubblici (catalogo/news/documenti/posizioni); mutazioni protette via
  //  cookie di sessione (vedi /api/*). Se il backend è irraggiungibile il sito
  //  pubblico continua a mostrare i dati statici bundle (fallback morbido).
  // ══════════════════════════════════════════════════════════════════════
  (function () {
    const API = {
      async get(path) {
        const r = await fetch(path, { headers: { Accept: "application/json" }, cache: "no-store" });
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.json();
      },
      async send(path, method, body) {
        const r = await fetch(path, {
          method,
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: body != null ? JSON.stringify(body) : undefined,
        });
        let data = null;
        try { data = await r.json(); } catch (_) { /* no body */ }
        if (!r.ok) { const e = new Error((data && data.error) || ("HTTP " + r.status)); e.status = r.status; throw e; }
        return data;
      },
    };

    // stato live
    let NEWS = [];
    let DOCS = [];
    let POSITIONS = [];

    // ── helper data: "2019-11-23" → "23 NOV 2019" ──
    const MESI = ["GEN", "FEB", "MAR", "APR", "MAG", "GIU", "LUG", "AGO", "SET", "OTT", "NOV", "DIC"];
    function fmtDate(iso) {
      if (!iso) return "";
      const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
      if (!m) return iso; // già in formato display
      return String(+m[3]) + " " + MESI[+m[2] - 1] + " " + m[1];
    }
    // "23 NOV 2019" → "2019-11-23" (per ripopolare <input type=date> in modifica)
    function toISO(s) {
      if (!s) return "";
      if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
      const m = /^(\d{1,2})\s+([A-Za-zÀ-ÿ]{3})\w*\s+(\d{4})$/.exec(String(s).trim());
      if (!m) return "";
      const i = MESI.indexOf(m[2].toUpperCase().slice(0, 3));
      if (i < 0) return "";
      return m[3] + "-" + String(i + 1).padStart(2, "0") + "-" + m[1].padStart(2, "0");
    }
    const cap = (s) => String(s || "").replace(/\b\w/g, (c) => c.toUpperCase());

    // ── catalogo: applica i dati live mutando CATALOG/CINDEX in-place ──
    function applyCatalog(obj) {
      if (!obj || typeof obj !== "object") return;
      Object.keys(CATALOG).forEach((k) => { delete CATALOG[k]; });
      Object.keys(obj).forEach((k) => { CATALOG[k] = obj[k]; });
      Object.keys(CINDEX).forEach((k) => { delete CINDEX[k]; });
      Object.keys(CATALOG).forEach((catKey) => {
        (CATALOG[catKey].products || []).forEach((p) => {
          if (p && p.code) CINDEX[p.code] = { catKey, product: p };
        });
      });
      window.MAGIX_CATALOG = CATALOG;
      window.MAGIX_CATALOG_INDEX = CINDEX;
    }

    // ── catalogo: aggiunge nel grid "malte" le card delle categorie create da admin
    //    (le categorie statiche restano; appendiamo solo le chiavi non già presenti) ──
    const MATS = ["mat-grey", "mat-white", "mat-ochre", "mat-red", "mat-bio", "mat-anthr"];
    function injectNewCategoryCards() {
      const anchor = document.querySelector("#fam-malte .subcat-card");
      if (!anchor) return;
      const grid = anchor.parentElement;
      const existing = new Set(
        [...grid.querySelectorAll(".subcat-card[data-name]")].map((c) => (c.dataset.name || "").trim().toLowerCase())
      );
      let i = 0;
      Object.keys(CATALOG).forEach((key) => {
        if (existing.has(key)) return;
        const cat = CATALOG[key];
        const mat = cat.mat && MATS.indexOf(cat.mat) > -1 ? cat.mat : MATS[i++ % MATS.length];
        const a = document.createElement("a");
        a.href = "#";
        a.dataset.view = "catalog";
        a.dataset.name = key;
        a.className = "subcat-card reveal lift group bg-surface rounded-2xl border border-line shadow-soft overflow-hidden hover:shadow-lift hover:border-ink/20";
        a.innerHTML = '<div class="mat ' + esc(mat) + ' h-28"></div>'
          + '<div class="p-4 flex items-center justify-between gap-2"><h3 class="display font-bold text-[15px] leading-snug">'
          + esc(cat.label || cap(key)) + '</h3><span class="text-red font-semibold group-hover:translate-x-1 transition shrink-0">→</span></div>';
        grid.appendChild(a);
        existing.add(key);
      });
      runReveal();
    }

    // ── NEWS pubbliche (view-news) ──
    function newsCardBadge(catRaw) {
      const c = String(catRaw || "NEWS").toUpperCase();
      const cls = c === "EVENTO"
        ? "text-red bg-red/10 border border-red/20"
        : (c === "NEWS" ? "text-white bg-graphite" : "text-bio bg-biosoft border border-bio/20");
      return '<span class="text-[10px] font-semibold ' + cls + ' rounded-full px-2.5 py-0.5">' + esc(c) + "</span>";
    }
    function renderNews() {
      const pub = NEWS.filter((n) => (n.stato || "pubblicato") !== "bozza");
      const featured = document.getElementById("newsFeatured");
      const grid = document.getElementById("newsGrid");
      if (!pub.length) { window.__magixSetNews(NEWS); return; }
      const list = pub.slice();
      const f = list.shift();
      if (featured && f) {
        const media = f.img
          ? '<img src="' + encodeURI(f.img) + '" alt="' + esc(f.titolo) + '" loading="lazy" class="absolute inset-0 w-full h-full object-cover">'
          : '<div class="mat mat-ochre absolute inset-0"></div>';
        featured.innerHTML =
          '<div class="min-h-[240px] lg:min-h-full relative overflow-hidden">' + media
          + '<span class="absolute top-4 left-4 text-[11px] font-semibold bg-white/90 backdrop-blur text-ink rounded-full px-3 py-1">IN EVIDENZA</span></div>'
          + '<div class="p-8 lg:p-12 flex flex-col justify-center">'
          + '<div class="flex items-center gap-3 mono text-[12px] text-faint"><span class="text-red font-semibold">' + esc(String(f.cat || "NEWS").toUpperCase()) + '</span><span>·</span><span>' + esc(f.data) + '</span></div>'
          + '<h2 class="display font-extrabold text-[clamp(1.7rem,3vw,2.5rem)] leading-tight mt-3">' + esc(f.titolo) + '</h2>'
          + '<p class="text-muted mt-4 leading-relaxed max-w-lg">' + esc(f.estratto || "") + '</p>'
          + '<a href="#" data-news-id="' + esc(f.id) + '" class="mt-7 inline-flex items-center gap-2 font-semibold text-red underline-grow w-fit">Leggi l\'articolo <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path d="M5 12h14m0 0-6-6m6 6-6 6"/></svg></a></div>';
        featured.setAttribute("data-news-id", f.id);
      }
      if (grid) {
        grid.innerHTML = list.map((n) => {
          const media = n.img
            ? '<div class="h-40 overflow-hidden relative shrink-0"><img src="' + encodeURI(n.img) + '" alt="' + esc(n.titolo) + '" loading="lazy" class="w-full h-full object-cover group-hover:scale-105 transition duration-500"></div>'
            : '<div class="mat mat-ochre h-40 shrink-0"></div>';
          return '<a href="#" data-news-id="' + esc(n.id) + '" class="reveal lift group bg-surface rounded-2xl border border-line shadow-soft overflow-hidden hover:shadow-lift hover:border-ink/20 flex flex-col">'
            + media
            + '<div class="p-6 flex flex-col flex-1"><div class="flex items-center gap-2">' + newsCardBadge(n.cat)
            + '<span class="mono text-[11px] text-faint">' + esc(n.data) + '</span></div>'
            + '<h3 class="display font-bold text-xl mt-4 leading-snug">' + esc(n.titolo) + '</h3>'
            + '<p class="text-muted text-sm mt-2 leading-relaxed flex-1">' + esc(n.estratto || "") + '</p>'
            + '<span class="mt-5 text-red font-semibold text-sm group-hover:translate-x-1 transition inline-block">Leggi →</span></div></a>';
        }).join("");
      }
      window.__magixSetNews(NEWS);
      runReveal();
    }

    // ── DOCUMENTI pubblici (view-download) ──
    function docTypeBadge(tipo) {
      const t = String(tipo || "PDF").toUpperCase();
      const cls = t.indexOf("XLS") > -1 ? "bg-bio text-white" : (t.indexOf("DOC") > -1 ? "bg-graphite text-white" : "bg-red text-white");
      return '<span class="px-2.5 py-1 rounded-md text-[11px] font-bold mono ' + cls + '">' + esc(t) + "</span>";
    }
    function renderDocs() {
      const grid = document.getElementById("downloadGrid");
      if (!grid || !DOCS.length) return;
      grid.innerHTML = DOCS.map((d) => {
        const href = d.url ? encodeURI(d.url) : "#";
        const corner = d.badge
          ? '<span class="text-[10px] font-semibold text-bio bg-biosoft border border-bio/20 rounded-full px-2 py-0.5">' + esc(d.badge) + "</span>"
          : '<svg class="text-faint group-hover:text-red transition" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 3v12m0 0 4-4m-4 4-4-4M4 21h16"/></svg>';
        return '<a href="' + href + '"' + (d.url ? " download" : "") + ' class="doc-card reveal lift group bg-surface rounded-2xl border border-line shadow-soft p-6 hover:shadow-lift hover:border-ink/20 flex flex-col" data-cat="' + esc(d.cat || "company") + '" data-title="' + esc(String(d.nome || "").toLowerCase()) + '">'
          + '<div class="flex items-start justify-between">' + docTypeBadge(d.tipo) + corner + "</div>"
          + '<h3 class="display font-bold text-lg mt-5 leading-snug flex-1">' + esc(d.nome) + "</h3>"
          + '<div class="mono text-[11px] text-faint mt-2">' + esc(String(d.cat || "").toUpperCase()) + " · " + esc(String(d.tipo || "PDF").toUpperCase()) + "</div></a>";
      }).join("");
      if (window.__magixReapplyDocFilter) window.__magixReapplyDocFilter();
      runReveal();
    }

    // ── POSIZIONI pubbliche (view-lavora) ──
    function renderPositions() {
      const list = document.getElementById("posizioniList");
      const empty = document.getElementById("posizioniEmpty");
      const sel = document.getElementById("j-pos");
      const open = POSITIONS.filter((p) => p.aperta !== false);
      if (list) {
        if (open.length) {
          list.innerHTML = open.map((p) =>
            '<div class="reveal lift bg-surface rounded-2xl border border-line shadow-soft p-6 hover:shadow-lift hover:border-ink/20">'
            + '<div class="flex items-center gap-2 flex-wrap">'
            + (p.tipo ? '<span class="text-[11px] font-semibold text-red bg-red/10 border border-red/20 rounded-full px-2.5 py-0.5">' + esc(p.tipo) + "</span>" : "")
            + (p.luogo ? '<span class="mono text-[11px] text-faint">📍 ' + esc(p.luogo) + "</span>" : "")
            + "</div>"
            + '<h3 class="display font-bold text-xl mt-4 leading-snug">' + esc(p.titolo) + "</h3>"
            + (p.descrizione ? '<p class="text-muted text-sm mt-2 leading-relaxed">' + esc(p.descrizione) + "</p>" : "")
            + '<a href="#lavora-form" class="mt-5 inline-flex items-center gap-2 font-semibold text-red text-sm underline-grow w-fit">Candidati per questa posizione →</a></div>'
          ).join("");
          list.classList.remove("hidden");
          if (empty) empty.classList.add("hidden");
        } else {
          list.innerHTML = "";
          list.classList.add("hidden");
          if (empty) empty.classList.remove("hidden");
        }
      }
      if (sel) {
        const cur = sel.value;
        sel.innerHTML = '<option value="">Seleziona un\'area…</option>'
          + (open.length
            ? open.map((p) => '<option>' + esc(p.titolo) + "</option>").join("")
            : ["Produzione", "Logistica", "Commerciale", "Amministrazione", "Tecnico di cantiere"].map((x) => "<option>" + x + "</option>").join(""));
        if (cur) sel.value = cur;
      }
      runReveal();
    }

    // ── select categoria nel form prodotto: chiavi live (value=key, testo=label) ──
    function populateProductCatSelect() {
      const sel = document.getElementById("p-cat");
      if (!sel) return;
      const cur = sel.value;
      sel.innerHTML = '<option value="">Seleziona…</option>'
        + Object.keys(CATALOG).map((k) => '<option value="' + esc(k) + '">' + esc(CATALOG[k].label || cap(k)) + "</option>").join("");
      if (cur) sel.value = cur;
    }

    // ── upload diretto browser→Blob (supera il limite body delle functions) ──
    async function uploadFile(file) {
      const mod = await import("https://esm.sh/@vercel/blob@0.27.3/client");
      const res = await mod.upload(file.name, file, {
        access: "public",
        handleUploadUrl: "/api/upload",
        contentType: file.type || undefined,
      });
      return res.url;
    }

    // ══════════════════════ CONTROLLER ADMIN ══════════════════════
    const loginOverlay = document.getElementById("adminLogin");
    const loginForm = document.getElementById("adminLoginForm");
    const loginMsg = document.getElementById("adminLoginMsg");
    const passInput = document.getElementById("adminPass");
    let authed = false;
    let adminLoaded = false;

    function showMsg(id, text, ok) {
      const el = document.getElementById(id);
      if (!el) return;
      el.textContent = text;
      el.classList.remove("hidden", "text-bio", "text-red");
      el.classList.add(ok === false ? "text-red" : "text-bio");
      if (ok !== false) setTimeout(() => el.classList.add("hidden"), 4000);
    }
    async function checkAuth() {
      try {
        const me = await API.get("/api/auth?action=me");
        authed = !!(me && me.authed);
      } catch (_) { authed = false; }
      if (loginOverlay) loginOverlay.classList.toggle("hidden", authed);
      if (authed && !adminLoaded) { adminLoaded = true; loadAdmin(); }
      return authed;
    }

    if (loginForm) {
      loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        if (loginMsg) loginMsg.classList.add("hidden");
        try {
          await API.send("/api/auth?action=login", "POST", { password: passInput ? passInput.value : "" });
          authed = true;
          if (passInput) passInput.value = "";
          if (loginOverlay) loginOverlay.classList.add("hidden");
          adminLoaded = true;
          loadAdmin();
        } catch (err) {
          if (loginMsg) { loginMsg.textContent = err.status === 401 ? "Passphrase errata." : "Backend non disponibile."; loginMsg.classList.remove("hidden"); }
        }
      });
    }
    const logoutBtn = document.getElementById("adminLogout");
    if (logoutBtn) logoutBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      try { await API.send("/api/auth?action=logout", "POST", {}); } catch (_) {}
      authed = false; adminLoaded = false;
      if (loginOverlay) loginOverlay.classList.remove("hidden");
    });

    // gate all'apertura dell'area admin
    document.querySelectorAll('[data-view="admin"]').forEach((a) =>
      a.addEventListener("click", () => { setTimeout(checkAuth, 0); })
    );

    // ── caricamento dati admin + render liste ──
    function loadAdmin() {
      renderProdTable();
      renderCatList();
      renderNewsList();
      renderDocList();
      renderPosList();
      updateKpis();
    }
    function updateKpis() {
      const nProd = Object.values(CATALOG).reduce((s, c) => s + ((c.products || []).length), 0);
      const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
      set("kpiProducts", nProd);
      set("kpiNews", NEWS.length);
      set("kpiDownloads", DOCS.length);
      set("kpiCategories", Object.keys(CATALOG).length);
    }

    function actionBtns(editAttrs, delAttrs) {
      return '<button type="button" ' + editAttrs + ' class="js-edit text-[13px] font-semibold text-ink hover:text-red transition">Modifica</button>'
        + '<button type="button" ' + delAttrs + ' class="js-del text-[13px] font-semibold text-faint hover:text-red transition ml-3">Elimina</button>';
    }

    // ── PRODOTTI: tabella dashboard ──
    function renderProdTable() {
      const tb = document.getElementById("prodTableBody");
      const count = document.getElementById("prodCount");
      if (!tb) return;
      const rows = [];
      Object.keys(CATALOG).forEach((catKey) => {
        (CATALOG[catKey].products || []).forEach((p) => rows.push({ catKey, p }));
      });
      if (count) count.textContent = rows.length + " referenze";
      tb.innerHTML = rows.length ? rows.map(({ catKey, p }) => {
        const stato = (p.stato || "pubblicato").toLowerCase() === "bozza"
          ? '<span class="text-[11px] font-semibold text-faint bg-bg2 border border-line rounded-full px-2 py-0.5">Bozza</span>'
          : '<span class="text-[11px] font-semibold text-bio bg-biosoft border border-bio/20 rounded-full px-2 py-0.5">Pubblicato</span>';
        return '<tr><td class="px-5 py-3"><input type="checkbox" class="accent-red w-4 h-4 rowChk" /></td>'
          + '<td class="px-3 py-3 font-medium">' + esc(p.name) + "</td>"
          + '<td class="px-3 py-3 mono text-faint">' + esc(p.code) + "</td>"
          + '<td class="px-3 py-3 text-muted">' + esc(CATALOG[catKey].label || catKey) + "</td>"
          + '<td class="px-3 py-3">' + stato + "</td>"
          + '<td class="px-3 py-3 text-right whitespace-nowrap">' + actionBtns('data-edit-prod="' + esc(p.code) + '" data-cat="' + esc(catKey) + '"', 'data-del-prod="' + esc(p.code) + '" data-cat="' + esc(catKey) + '"') + "</td></tr>";
      }).join("") : '<tr><td colspan="6" class="px-5 py-10 text-center text-muted">Nessun prodotto.</td></tr>';
    }

    // ── CATEGORIE: lista ──
    function renderCatList() {
      const box = document.getElementById("catList");
      const count = document.getElementById("catCount");
      if (!box) return;
      const keys = Object.keys(CATALOG);
      if (count) count.textContent = keys.length + " categorie";
      box.innerHTML = keys.length ? keys.map((k) => {
        const c = CATALOG[k];
        return '<div class="px-5 py-3.5 flex items-center gap-3">'
          + '<span class="mat ' + esc(c.mat || "mat-grey") + ' w-8 h-8 rounded-lg border border-line shrink-0"></span>'
          + '<div class="min-w-0"><div class="font-medium truncate">' + esc(c.label || k) + '</div><div class="mono text-[11px] text-faint">' + ((c.products || []).length) + " prodotti</div></div>"
          + '<div class="ml-auto whitespace-nowrap">' + actionBtns('data-edit-cat="' + esc(k) + '"', 'data-del-cat="' + esc(k) + '"') + "</div></div>";
      }).join("") : '<div class="px-5 py-10 text-center text-muted">Nessuna categoria.</div>';
    }

    // ── NEWS: lista admin ──
    function renderNewsList() {
      const box = document.getElementById("newsList");
      const count = document.getElementById("newsCount");
      if (!box) return;
      if (count) count.textContent = NEWS.length + " articoli";
      box.innerHTML = NEWS.length ? NEWS.map((n) => {
        const stato = (n.stato || "pubblicato") === "bozza"
          ? '<span class="text-[11px] font-semibold text-faint bg-bg2 border border-line rounded-full px-2 py-0.5">Bozza</span>'
          : '<span class="text-[11px] font-semibold text-bio bg-biosoft border border-bio/20 rounded-full px-2 py-0.5">Pubblicato</span>';
        return '<div class="px-5 py-3.5 flex items-center gap-3"><div class="min-w-0">'
          + '<div class="font-medium truncate">' + esc(n.titolo) + "</div>"
          + '<div class="mono text-[11px] text-faint">' + esc(String(n.cat || "").toUpperCase()) + " · " + esc(n.data) + "</div></div>"
          + '<div class="ml-auto flex items-center gap-3 whitespace-nowrap">' + stato + actionBtns('data-edit-news="' + esc(n.id) + '"', 'data-del-news="' + esc(n.id) + '"') + "</div></div>";
      }).join("") : '<div class="px-5 py-10 text-center text-muted">Nessun articolo.</div>';
    }

    // ── DOCUMENTI: lista admin ──
    function renderDocList() {
      const box = document.getElementById("docList");
      const count = document.getElementById("docCount");
      if (!box) return;
      if (count) count.textContent = DOCS.length + " documenti";
      box.innerHTML = DOCS.length ? DOCS.map((d) =>
        '<div class="px-5 py-3.5 flex items-center gap-3">' + docTypeBadge(d.tipo)
        + '<div class="min-w-0"><div class="font-medium truncate">' + esc(d.nome) + "</div>"
        + '<div class="mono text-[11px] text-faint">' + esc(String(d.cat || "").toUpperCase()) + (d.url ? "" : " · nessun file") + "</div></div>"
        + '<div class="ml-auto whitespace-nowrap">' + actionBtns('data-edit-doc="' + esc(d.id) + '"', 'data-del-doc="' + esc(d.id) + '"') + "</div></div>"
      ).join("") : '<div class="px-5 py-10 text-center text-muted">Nessun documento.</div>';
    }

    // ── POSIZIONI: lista admin ──
    function renderPosList() {
      const box = document.getElementById("posList");
      const count = document.getElementById("posCount");
      if (!box) return;
      if (count) count.textContent = POSITIONS.length + " posizioni";
      box.innerHTML = POSITIONS.length ? POSITIONS.map((p) => {
        const stato = p.aperta !== false
          ? '<span class="text-[11px] font-semibold text-bio bg-biosoft border border-bio/20 rounded-full px-2 py-0.5">Aperta</span>'
          : '<span class="text-[11px] font-semibold text-faint bg-bg2 border border-line rounded-full px-2 py-0.5">Chiusa</span>';
        return '<div class="px-5 py-3.5 flex items-center gap-3"><div class="min-w-0">'
          + '<div class="font-medium truncate">' + esc(p.titolo) + "</div>"
          + '<div class="mono text-[11px] text-faint">' + esc([p.luogo, p.tipo].filter(Boolean).join(" · ")) + "</div></div>"
          + '<div class="ml-auto flex items-center gap-3 whitespace-nowrap">' + stato + actionBtns('data-edit-pos="' + esc(p.id) + '"', 'data-del-pos="' + esc(p.id) + '"') + "</div></div>";
      }).join("") : '<div class="px-5 py-10 text-center text-muted">Nessuna posizione.</div>';
    }

    // ── refresh completo dopo una mutazione ──
    function refreshPublicCatalog() {
      injectNewCategoryCards();
      populateProductCatSelect();
      if (currentCatKey && CATALOG[currentCatKey]) renderCatalog(currentCatKey);
    }

    // ═════════════ FORM: PRODOTTO ═════════════
    let prodEditCat = null; // categoria d'origine quando si modifica
    const productForm = document.getElementById("productForm");
    if (productForm) {
      productForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const val = (id) => { const el = document.getElementById(id); return el ? el.value.trim() : ""; };
        const name = val("p-nome");
        const catKey = val("p-cat");
        if (!name || !catKey) { showMsg("productMsg", "Nome e categoria sono obbligatori.", false); return; }
        let code = val("p-sku") || val("p-editcode");
        if (!code) code = (name.toUpperCase().replace(/[^A-Z0-9]+/g, "-").replace(/^-|-$/g, "")) || ("P" + name.length);
        // spec dalle righe dinamiche
        const spec = {};
        document.querySelectorAll("#specRows .spec-row").forEach((row) => {
          const ins = row.querySelectorAll("input");
          const k = ins[0] && ins[0].value.trim(), v = ins[1] && ins[1].value.trim();
          if (k && v) spec[k] = v;
        });
        // upload immagine se selezionata
        let img = val("p-img-url");
        const imgInput = document.getElementById("p-img");
        try {
          if (imgInput && imgInput.files && imgInput.files[0]) { showMsg("productMsg", "Caricamento immagine…", true); img = await uploadFile(imgInput.files[0]); }
        } catch (err) { showMsg("productMsg", "Upload immagine fallito: " + err.message, false); return; }

        const tags = val("p-tag") ? val("p-tag").split(",").map((s) => s.trim()).filter(Boolean) : undefined;
        const product = {
          code, name,
          subtitle: val("p-sintesi"),
          norma: val("p-norma"),
          mat: (CATALOG[catKey] && CATALOG[catKey].mat) || "mat-grey",
          availability: val("p-disp").toLowerCase().indexOf("richiesta") > -1 ? "order" : "stock",
          stato: val("p-stato").toLowerCase() === "bozza" ? "bozza" : "pubblicato",
          composizione: val("p-comp"),
          impiego: val("p-impiego"),
          applicazione: val("p-appl"),
          conservazione_note: val("p-conserv"),
          spec: Object.keys(spec).length ? spec : undefined,
          formato: val("p-formato") || undefined,
          tags,
          img: img || undefined,
        };
        const editing = !!val("p-editcode");
        try {
          if (editing) {
            await API.send("/api/catalog", "PUT", { kind: "product", catKey, oldCatKey: prodEditCat || catKey, code: val("p-editcode"), product });
          } else {
            await API.send("/api/catalog", "POST", { kind: "product", catKey, product });
          }
          await reloadCatalog();
          productForm.reset();
          document.getElementById("p-editcode").value = "";
          document.getElementById("p-img-url").value = "";
          prodEditCat = null;
          showMsg("productMsg", editing ? "Prodotto aggiornato." : "Prodotto creato.");
        } catch (err) { showMsg("productMsg", "Errore: " + err.message, false); }
      });
      productForm.addEventListener("reset", () => {
        const h = document.getElementById("p-editcode"); if (h) h.value = "";
        const u = document.getElementById("p-img-url"); if (u) u.value = "";
        prodEditCat = null;
      });
    }

    // ═════════════ FORM: CATEGORIA ═════════════
    const catForm = document.getElementById("catForm");
    if (catForm) {
      catForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const label = (document.getElementById("cat-label") || {}).value || "";
        const oldKey = (document.getElementById("cat-oldkey") || {}).value || "";
        if (!label.trim()) { showMsg("catMsg", "Il nome categoria è obbligatorio.", false); return; }
        const key = label.trim().toLowerCase();
        const payload = {
          kind: "category", key, oldKey: oldKey || undefined,
          label: label.trim(),
          mat: (document.getElementById("cat-mat") || {}).value || "mat-grey",
          intro: (document.getElementById("cat-intro") || {}).value || "",
        };
        try {
          await API.send("/api/catalog", oldKey ? "PUT" : "POST", payload);
          await reloadCatalog();
          catForm.reset();
          document.getElementById("cat-oldkey").value = "";
          showMsg("catMsg", oldKey ? "Categoria aggiornata." : "Categoria creata.");
        } catch (err) { showMsg("catMsg", "Errore: " + err.message, false); }
      });
      const catReset = document.getElementById("catReset");
      if (catReset) catReset.addEventListener("click", () => { catForm.reset(); document.getElementById("cat-oldkey").value = ""; });
    }

    // ═════════════ FORM: NEWS ═════════════
    const newsForm = document.getElementById("newsForm");
    if (newsForm) {
      newsForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const val = (id) => { const el = document.getElementById(id); return el ? el.value.trim() : ""; };
        const titolo = val("n-titolo");
        if (!titolo) { showMsg("newsMsg", "Il titolo è obbligatorio.", false); return; }
        let img = val("n-img-url");
        const imgInput = document.getElementById("n-img");
        try {
          if (imgInput && imgInput.files && imgInput.files[0]) { showMsg("newsMsg", "Caricamento immagine…", true); img = await uploadFile(imgInput.files[0]); }
        } catch (err) { showMsg("newsMsg", "Upload immagine fallito: " + err.message, false); return; }
        const id = val("n-editid");
        const corpo = val("n-corpo").split(/\n{1,}/).map((s) => s.trim()).filter(Boolean);
        const payload = {
          titolo,
          cat: val("n-cat") || "News",
          data: fmtDate(val("n-data")),
          dataISO: val("n-data") || undefined,
          estratto: val("n-estratto"),
          corpo,
          img: img || undefined,
          stato: val("n-stato").toLowerCase() === "bozza" ? "bozza" : "pubblicato",
        };
        try {
          if (id) await API.send("/api/news", "PUT", Object.assign({ id }, payload));
          else await API.send("/api/news", "POST", payload);
          await reloadNews();
          newsForm.reset();
          document.getElementById("n-editid").value = "";
          document.getElementById("n-img-url").value = "";
          showMsg("newsMsg", id ? "Articolo aggiornato." : "Articolo pubblicato.");
        } catch (err) { showMsg("newsMsg", "Errore: " + err.message, false); }
      });
      const newsReset = document.getElementById("newsReset");
      if (newsReset) newsReset.addEventListener("click", () => { newsForm.reset(); document.getElementById("n-editid").value = ""; document.getElementById("n-img-url").value = ""; });
    }

    // ═════════════ FORM: DOCUMENTO ═════════════
    const fileForm = document.getElementById("fileForm");
    if (fileForm) {
      fileForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const val = (id) => { const el = document.getElementById(id); return el ? el.value.trim() : ""; };
        const nome = val("f-nome");
        if (!nome) { showMsg("fileMsg", "Il nome documento è obbligatorio.", false); return; }
        let url = val("f-url");
        let tipo = "PDF";
        const fileInput = document.getElementById("f-file");
        try {
          if (fileInput && fileInput.files && fileInput.files[0]) {
            const f = fileInput.files[0];
            tipo = (f.name.split(".").pop() || "pdf").toUpperCase();
            showMsg("fileMsg", "Caricamento file…", true);
            url = await uploadFile(f);
          } else if (url) {
            tipo = (url.split(".").pop() || "pdf").toUpperCase().slice(0, 4);
          }
        } catch (err) { showMsg("fileMsg", "Upload file fallito: " + err.message, false); return; }
        const id = val("f-editid");
        const payload = { nome, cat: (document.getElementById("f-cat") || {}).value || "company", tipo, url: url || "", badge: "" };
        // normalizza la categoria a slug minuscolo per il filtro pubblico
        payload.cat = String(payload.cat).toLowerCase();
        try {
          if (id) await API.send("/api/documents", "PUT", Object.assign({ id }, payload));
          else await API.send("/api/documents", "POST", payload);
          await reloadDocs();
          fileForm.reset();
          document.getElementById("f-editid").value = "";
          document.getElementById("f-url").value = "";
          const fn = document.getElementById("f-name"); if (fn) fn.textContent = "Nessun file selezionato";
          showMsg("fileMsg", id ? "Documento aggiornato." : "Documento caricato.");
        } catch (err) { showMsg("fileMsg", "Errore: " + err.message, false); }
      });
    }

    // ═════════════ FORM: POSIZIONE ═════════════
    const posForm = document.getElementById("posForm");
    if (posForm) {
      posForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const val = (id) => { const el = document.getElementById(id); return el ? el.value.trim() : ""; };
        const titolo = val("pos-titolo");
        if (!titolo) { showMsg("posMsg", "Il titolo è obbligatorio.", false); return; }
        const id = val("pos-editid");
        const aperta = !!(document.getElementById("pos-aperta") && document.getElementById("pos-aperta").checked);
        const payload = { titolo, luogo: val("pos-luogo"), tipo: val("pos-tipo"), descrizione: val("pos-desc"), aperta };
        try {
          if (id) await API.send("/api/positions", "PUT", Object.assign({ id }, payload));
          else await API.send("/api/positions", "POST", payload);
          await reloadPositions();
          posForm.reset();
          document.getElementById("pos-editid").value = "";
          showMsg("posMsg", id ? "Posizione aggiornata." : "Posizione creata.");
        } catch (err) { showMsg("posMsg", "Errore: " + err.message, false); }
      });
      const posReset = document.getElementById("posReset");
      if (posReset) posReset.addEventListener("click", () => { posForm.reset(); document.getElementById("pos-editid").value = ""; });
    }

    // ── edit/delete delegati su tutte le liste admin ──
    document.addEventListener("click", async (e) => {
      const t = e.target.closest("button");
      if (!t) return;

      // PRODOTTO
      if (t.dataset.editProd) {
        const code = t.dataset.editProd, catKey = t.dataset.cat;
        const p = CATALOG[catKey] && (CATALOG[catKey].products || []).find((x) => x.code === code);
        if (!p) return;
        prodEditCat = catKey;
        const set = (id, v) => { const el = document.getElementById(id); if (el) el.value = v == null ? "" : v; };
        populateProductCatSelect();
        set("p-editcode", p.code); set("p-nome", p.name); set("p-cat", catKey); set("p-sku", p.code);
        set("p-norma", p.norma); set("p-sintesi", p.subtitle); set("p-comp", p.composizione);
        set("p-impiego", p.impiego); set("p-appl", p.applicazione); set("p-conserv", p.conservazione_note);
        set("p-formato", p.formato); set("p-img-url", p.img);
        set("p-disp", p.availability === "order" ? "Su richiesta" : "Disponibile · pronta consegna");
        set("p-stato", (p.stato || "pubblicato") === "bozza" ? "Bozza" : "Pubblicato");
        set("p-tag", (p.tags || []).join(", "));
        // ricostruisci righe spec
        const rowsBox = document.getElementById("specRows");
        if (rowsBox) {
          const entries = Object.entries(p.spec || {});
          rowsBox.innerHTML = (entries.length ? entries : [["", ""]]).map(([k, v]) =>
            '<div class="spec-row flex gap-2"><input class="adm-in flex-1" placeholder="Caratteristica" value="' + esc(k) + '" /><input class="adm-in flex-1" placeholder="Valore" value="' + esc(v) + '" /><button type="button" class="spec-del h-11 w-11 grid place-items-center rounded-xl border border-line text-faint hover:text-red hover:border-red/40 transition shrink-0" aria-label="Rimuovi riga">✕</button></div>'
          ).join("");
        }
        showAdminPanel("prodotti");
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      if (t.dataset.delProd) {
        if (!confirm("Eliminare il prodotto " + t.dataset.delProd + "?")) return;
        try { await API.send("/api/catalog", "DELETE", { kind: "product", catKey: t.dataset.cat, code: t.dataset.delProd }); await reloadCatalog(); } catch (err) { alert("Errore: " + err.message); }
        return;
      }

      // CATEGORIA
      if (t.dataset.editCat) {
        const k = t.dataset.editCat, c = CATALOG[k];
        if (!c) return;
        const set = (id, v) => { const el = document.getElementById(id); if (el) el.value = v == null ? "" : v; };
        set("cat-oldkey", k); set("cat-label", c.label || k); set("cat-mat", c.mat || "mat-grey"); set("cat-intro", c.intro);
        showAdminPanel("categorie");
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      if (t.dataset.delCat) {
        const k = t.dataset.delCat;
        const n = (CATALOG[k] && (CATALOG[k].products || []).length) || 0;
        if (!confirm("Eliminare la categoria \"" + ((CATALOG[k] && CATALOG[k].label) || k) + "\"" + (n ? " e i suoi " + n + " prodotti" : "") + "?")) return;
        try { await API.send("/api/catalog", "DELETE", { kind: "category", key: k }); await reloadCatalog(); } catch (err) { alert("Errore: " + err.message); }
        return;
      }

      // NEWS
      if (t.dataset.editNews) {
        const n = NEWS.find((x) => x.id === t.dataset.editNews);
        if (!n) return;
        const set = (id, v) => { const el = document.getElementById(id); if (el) el.value = v == null ? "" : v; };
        set("n-editid", n.id); set("n-titolo", n.titolo); set("n-cat", n.cat); set("n-data", n.dataISO || toISO(n.data));
        set("n-estratto", n.estratto); set("n-corpo", (n.corpo || []).join("\n\n")); set("n-img-url", n.img);
        set("n-stato", (n.stato || "pubblicato") === "bozza" ? "Bozza" : "Pubblicato");
        showAdminPanel("news");
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      if (t.dataset.delNews) {
        if (!confirm("Eliminare questo articolo?")) return;
        try { await API.send("/api/news", "DELETE", { id: t.dataset.delNews }); await reloadNews(); } catch (err) { alert("Errore: " + err.message); }
        return;
      }

      // DOCUMENTO
      if (t.dataset.editDoc) {
        const d = DOCS.find((x) => x.id === t.dataset.editDoc);
        if (!d) return;
        const set = (id, v) => { const el = document.getElementById(id); if (el) el.value = v == null ? "" : v; };
        set("f-editid", d.id); set("f-nome", d.nome); set("f-cat", cap(d.cat)); set("f-url", d.url);
        const fn = document.getElementById("f-name"); if (fn) fn.textContent = d.url ? "File attuale mantenuto" : "Nessun file selezionato";
        showAdminPanel("download");
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      if (t.dataset.delDoc) {
        if (!confirm("Eliminare questo documento?")) return;
        try { await API.send("/api/documents", "DELETE", { id: t.dataset.delDoc }); await reloadDocs(); } catch (err) { alert("Errore: " + err.message); }
        return;
      }

      // POSIZIONE
      if (t.dataset.editPos) {
        const p = POSITIONS.find((x) => x.id === t.dataset.editPos);
        if (!p) return;
        const set = (id, v) => { const el = document.getElementById(id); if (el) el.value = v == null ? "" : v; };
        set("pos-editid", p.id); set("pos-titolo", p.titolo); set("pos-luogo", p.luogo); set("pos-tipo", p.tipo); set("pos-desc", p.descrizione);
        const chk = document.getElementById("pos-aperta"); if (chk) chk.checked = p.aperta !== false;
        showAdminPanel("lavora");
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      if (t.dataset.delPos) {
        if (!confirm("Eliminare questa posizione?")) return;
        try { await API.send("/api/positions", "DELETE", { id: t.dataset.delPos }); await reloadPositions(); } catch (err) { alert("Errore: " + err.message); }
        return;
      }
    });

    // ── reload per dominio (riflette subito su pubblico + admin) ──
    async function reloadCatalog() {
      try { applyCatalog(await API.get("/api/catalog")); } catch (_) {}
      refreshPublicCatalog();
      renderProdTable(); renderCatList(); updateKpis();
    }
    async function reloadNews() {
      try { NEWS = await API.get("/api/news"); } catch (_) {}
      renderNews(); renderNewsList(); updateKpis();
    }
    async function reloadDocs() {
      try { DOCS = await API.get("/api/documents"); } catch (_) {}
      renderDocs(); renderDocList(); updateKpis();
    }
    async function reloadPositions() {
      try { POSITIONS = await API.get("/api/positions"); } catch (_) {}
      renderPositions(); renderPosList(); updateKpis();
    }

    // ── BOOT: carica i dati pubblici; su errore mantiene i bundle statici ──
    (async function boot() {
      const results = await Promise.allSettled([
        API.get("/api/catalog"),
        API.get("/api/news"),
        API.get("/api/documents"),
        API.get("/api/positions"),
      ]);
      const [cat, news, docs, pos] = results;
      if (cat.status === "fulfilled" && cat.value && typeof cat.value === "object") {
        applyCatalog(cat.value);
        injectNewCategoryCards();
        populateProductCatSelect();
        if (currentCatKey && CATALOG[currentCatKey]) renderCatalog(currentCatKey);
      }
      if (news.status === "fulfilled" && Array.isArray(news.value)) { NEWS = news.value; renderNews(); }
      if (docs.status === "fulfilled" && Array.isArray(docs.value)) { DOCS = docs.value; renderDocs(); }
      if (pos.status === "fulfilled" && Array.isArray(pos.value)) { POSITIONS = pos.value; renderPositions(); }
    })();
  })();

  // ── init ──
  setView("home");
