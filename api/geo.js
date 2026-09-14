// Proxy geocoding + routing per il tool "Trasferte & trasporti" (area riservata).
//
// Due provider, scelti automaticamente:
//  • se ORS_API_KEY è impostata → OpenRouteService (qualità migliore).
//  • altrimenti → OpenStreetMap Nominatim (geocoding) + OSRM demo (routing),
//    che NON richiedono chiave: il tool funziona out-of-the-box.
//
// La chiave (quando c'è) resta SOLO lato server. La route è protetta da isAuthed:
// solo gli utenti loggati consumano il servizio (e la quota, se ORS). Fallback
// morbido: se il provider non risponde si torna { fallback:true } e il client
// resta usabile inserendo i chilometri a mano.
//
// GET /api/geo?action=autocomplete&q=<testo>            → { suggestions:[{label,lat,lng}], provider }
// GET /api/geo?action=route&from=<lat,lng>&to=<lat,lng>  → { distance_km, duration_min, provider }
"use strict";

const { isAuthed } = require("./_lib/auth");

const ORS = "https://api.openrouteservice.org";
const NOMINATIM = "https://nominatim.openstreetmap.org";
const OSRM = "https://router.project-osrm.org";
// Nominatim/OSRM richiedono uno User-Agent identificativo (policy d'uso OSM).
const UA = "MagixSrl-Trasferte/1.0 (area riservata; +https://magixsrl.it)";

// ── AUTOCOMPLETE ──
async function autocompleteORS(key, text) {
  const url = ORS + "/geocode/autocomplete?text=" + encodeURIComponent(text) +
    "&boundary.country=IT&size=6&api_key=" + encodeURIComponent(key);
  const r = await fetch(url, { headers: { Accept: "application/json" } });
  if (!r.ok) throw new Error("ORS geocode HTTP " + r.status);
  const data = await r.json();
  return (data.features || []).map((f) => {
    const c = (f.geometry && f.geometry.coordinates) || [];
    return { label: f.properties && f.properties.label, lng: c[0], lat: c[1] };
  });
}
async function autocompleteNominatim(text) {
  const url = NOMINATIM + "/search?format=jsonv2&addressdetails=0&limit=6&countrycodes=it&q=" + encodeURIComponent(text);
  const r = await fetch(url, { headers: { Accept: "application/json", "User-Agent": UA } });
  if (!r.ok) throw new Error("Nominatim HTTP " + r.status);
  const data = await r.json();
  return (Array.isArray(data) ? data : []).map((d) => ({
    label: d.display_name, lat: parseFloat(d.lat), lng: parseFloat(d.lon),
  }));
}

// ── ROUTING (from/to = [lat, lng]) ──
async function routeORS(key, from, to) {
  const url = ORS + "/v2/directions/driving-car?api_key=" + encodeURIComponent(key) +
    "&start=" + from[1] + "," + from[0] + "&end=" + to[1] + "," + to[0];
  const r = await fetch(url, { headers: { Accept: "application/json, application/geo+json" } });
  if (!r.ok) throw new Error("ORS directions HTTP " + r.status);
  const data = await r.json();
  const sum = data.features && data.features[0] && data.features[0].properties && data.features[0].properties.summary;
  if (!sum) throw new Error("Percorso non trovato");
  return { distance: sum.distance, duration: sum.duration };
}
async function routeOSRM(from, to) {
  const url = OSRM + "/route/v1/driving/" + from[1] + "," + from[0] + ";" + to[1] + "," + to[0] + "?overview=false";
  const r = await fetch(url, { headers: { Accept: "application/json", "User-Agent": UA } });
  if (!r.ok) throw new Error("OSRM HTTP " + r.status);
  const data = await r.json();
  const route = data.routes && data.routes[0];
  if (!route) throw new Error("Percorso non trovato");
  return { distance: route.distance, duration: route.duration };
}

module.exports = async function handler(req, res) {
  if (!isAuthed(req)) return res.status(401).json({ error: "Non autorizzato" });

  const key = process.env.ORS_API_KEY || "";
  const provider = key ? "ors" : "osm";
  const q = req.query || {};
  const action = q.action || "";

  try {
    if (action === "autocomplete") {
      const text = String(q.q || "").trim();
      if (text.length < 3) return res.status(200).json({ suggestions: [], provider });
      const raw = key ? await autocompleteORS(key, text) : await autocompleteNominatim(text);
      const suggestions = raw.filter((s) => s.label && isFinite(s.lat) && isFinite(s.lng));
      return res.status(200).json({ suggestions, provider });
    }

    if (action === "route") {
      const from = String(q.from || "").split(",").map(Number); // "lat,lng"
      const to = String(q.to || "").split(",").map(Number);
      const bad = (a) => a.length !== 2 || a.some((n) => !isFinite(n));
      if (bad(from) || bad(to)) return res.status(400).json({ error: "Coordinate non valide" });
      const rt = key ? await routeORS(key, from, to) : await routeOSRM(from, to);
      return res.status(200).json({
        distance_km: Math.round((rt.distance / 1000) * 10) / 10,
        duration_min: Math.round(rt.duration / 60),
        provider,
      });
    }

    return res.status(400).json({ error: "Azione non valida (autocomplete|route)" });
  } catch (e) {
    console.error("geo error (" + provider + "):", e && e.message);
    return res.status(502).json({ error: "Servizio mappe non disponibile", fallback: true });
  }
};
