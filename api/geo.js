// Proxy geocoding + routing verso OpenRouteService (openrouteservice.org).
// Usato dal tool "Trasferte & trasporti" dell'area riservata.
//
// • La API key (ORS_API_KEY) resta SOLO lato server e non arriva mai al browser.
// • La route è protetta da isAuthed: solo gli utenti loggati possono consumare
//   la quota gratuita ORS (evita abusi della chiave).
// • Fallback morbido: se la key manca o ORS non risponde, si risponde con
//   { fallback: true } e il client resta usabile inserendo i km a mano.
//
// GET /api/geo?action=autocomplete&q=<testo>          → { suggestions:[{label,lat,lng}] }
// GET /api/geo?action=route&from=<lat,lng>&to=<lat,lng> → { distance_km, duration_min }
"use strict";

const { isAuthed } = require("./_lib/auth");

const ORS = "https://api.openrouteservice.org";

module.exports = async function handler(req, res) {
  if (!isAuthed(req)) return res.status(401).json({ error: "Non autorizzato" });

  const key = process.env.ORS_API_KEY;
  if (!key) {
    // niente chiave configurata → il client userà i km manuali
    return res.status(503).json({ error: "Routing non configurato (ORS_API_KEY mancante)", fallback: true });
  }

  const q = req.query || {};
  const action = q.action || "";

  try {
    // ── autocomplete indirizzi (Pelias, limitato all'Italia) ──
    if (action === "autocomplete") {
      const text = String(q.q || "").trim();
      if (text.length < 3) return res.status(200).json({ suggestions: [] });
      const url = ORS + "/geocode/autocomplete?text=" + encodeURIComponent(text)
        + "&boundary.country=IT&size=6&api_key=" + encodeURIComponent(key);
      const r = await fetch(url, { headers: { Accept: "application/json" } });
      if (!r.ok) throw new Error("ORS geocode HTTP " + r.status);
      const data = await r.json();
      const suggestions = (data.features || []).map((f) => {
        const c = (f.geometry && f.geometry.coordinates) || [];
        return { label: f.properties && f.properties.label, lng: c[0], lat: c[1] };
      }).filter((s) => s.label && isFinite(s.lat) && isFinite(s.lng));
      return res.status(200).json({ suggestions });
    }

    // ── distanza/durata su strada (profilo auto) ──
    if (action === "route") {
      const from = String(q.from || "").split(",").map(Number); // "lat,lng"
      const to = String(q.to || "").split(",").map(Number);
      const bad = (a) => a.length !== 2 || a.some((n) => !isFinite(n));
      if (bad(from) || bad(to)) return res.status(400).json({ error: "Coordinate non valide" });
      // ORS vuole l'ordine lng,lat
      const url = ORS + "/v2/directions/driving-car?api_key=" + encodeURIComponent(key)
        + "&start=" + from[1] + "," + from[0] + "&end=" + to[1] + "," + to[0];
      const r = await fetch(url, { headers: { Accept: "application/json, application/geo+json" } });
      if (!r.ok) throw new Error("ORS directions HTTP " + r.status);
      const data = await r.json();
      const sum = data.features && data.features[0] && data.features[0].properties
        && data.features[0].properties.summary;
      if (!sum) throw new Error("Percorso non trovato");
      return res.status(200).json({
        distance_km: Math.round((sum.distance / 1000) * 10) / 10,
        duration_min: Math.round(sum.duration / 60),
      });
    }

    return res.status(400).json({ error: "Azione non valida (autocomplete|route)" });
  } catch (e) {
    console.error("geo error:", e && e.message);
    return res.status(502).json({ error: "Servizio routing non disponibile", fallback: true });
  }
};
