  // ── view router ──
  const views = { home: "view-home", cemento: "view-cemento", news: "view-news", contatti: "view-contatti", product: "view-product", admin: "view-admin" };
  function setView(name) {
    const targetId = views[name] || views.home;
    Object.values(views).forEach(id => { const el = document.getElementById(id); if (el) el.classList.remove("active"); });
    document.getElementById(targetId).classList.add("active");
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

  // ── init ──
  setView("home");
