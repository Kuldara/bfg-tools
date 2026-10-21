/* Kokotesti (0.12, 21.10.2026): skenaarion koon suodatin (scenarios/sizes.js).
   Aja:  node "scenario library/testit/kokotesti.js"   (Node, ei selainta; sekunteja)

   1. TAULUKKO  jokaisella skenaariolla on SIZE-rivi, eikä taulukossa ole tuntemattomia tunnisteita; s on "any" tai
               ei-tyhjä taulukko luokista S/M/L (ei toistoja, järjestyksessä); pts ja why ovat tekstiä ilman
               undefined/NaN-jäänteitä.
   2. JOHDONMUKAISUUS  pisteteksti ja luokka eivät ole ristiriidassa: "N each" → N:n luokka; glance "Equal" → any;
               kiinteät joukot ("Fixed", "Set fleets", "Historical") eivät ole any, ellei lähde salli sovittua kokoa.
   3. SUODATIN  sizeOk ja etusivun listMatches sekä arvonnan poolFiltered antavat samat luvut; jokaisessa luokassa
               on any-skenaariot ja vähintään 20 omaa; mikään luokka ei ole koko kirjasto; tyhjä valinta = kaikki;
               yhdistelmä laivastosuodattimen kanssa ei kasvata joukkoa.
   Tulostaa jakauman (montako skenaariota kussakin luokassa). */
"use strict";
const path = require("path");
const { lataa } = require("./_lataa.js");
const DIR = path.join(__dirname, "..");
const L = lataa(DIR, { names: "SIZE, SIZES, sizeOk, listMatches, poolFiltered, lf, prep" });
let fails = 0;
const fail = (k, m) => { fails++; if (fails <= 60) console.log("VIRHE " + k + ": " + m); };
const BAD = /undefined|NaN|\[object|function/;
const ORDER = ["S", "M", "L"];
const cls = n => n <= 1000 ? "S" : n < 1500 ? "M" : "L";

/* 1. taulukko */
const ids = new Set(L.SC.map(s => s.id));
for (const sc of L.SC) if (!L.SIZE[sc.id]) fail("TAULUKKO", sc.id + " puuttuu sizes.js:stä");
for (const id of Object.keys(L.SIZE)) {
  const z = L.SIZE[id];
  if (!ids.has(id)) fail("TAULUKKO", "tuntematon tunniste " + id);
  if (z.s !== "any") {
    if (!Array.isArray(z.s) || !z.s.length) fail("TAULUKKO", id + ": s ei ole any eikä taulukko");
    else if (z.s.some(k => !ORDER.includes(k))) fail("TAULUKKO", id + ": tuntematon luokka " + z.s.join(""));
    else if (z.s.join("") !== ORDER.filter(k => z.s.includes(k)).join("")) fail("TAULUKKO", id + ": luokat toistuvat tai väärässä järjestyksessä " + z.s.join(""));
  }
  for (const f of ["pts", "why"]) if (typeof z[f] !== "string" || !z[f].trim() || BAD.test(z[f])) fail("TAULUKKO", id + ": " + f + " puuttuu tai on rikki");
}
console.log("TAULUKKO: " + Object.keys(L.SIZE).length + " riviä, " + L.SC.length + " skenaariota");

/* 2. johdonmukaisuus */
const pointsOf = sc => { const v = sc.variants ? sc.variants[0][0] : "std"; const g = L.val(sc.glance, v) || []; const r = g.find(x => /^points$/i.test(x[0])); return r ? r[1] : ""; };
let checked = 0;
for (const sc of L.SC) {
  const z = L.SIZE[sc.id]; if (!z) continue;
  const g = pointsOf(sc), s = z.s === "any" ? "any" : z.s.join("");
  const each = z.pts.match(/^(\d+) each$/);
  if (each) { checked++; if (s !== cls(+each[1])) fail("JOHDONMUKAISUUS", sc.id + ": " + z.pts + " mutta luokka " + s); }
  if (g === "Equal") { checked++; if (s !== "any") fail("JOHDONMUKAISUUS", sc.id + ": glance Equal mutta luokka " + s); }
  if (/^(Fixed|Set fleets|Historical|Pre-made)/.test(g)) { checked++; if (s === "any" && !/agreed/i.test(g + " " + z.why)) fail("JOHDONMUKAISUUS", sc.id + ": kiinteät joukot mutta any"); }
  if (/^Equal: 1250 or 1500/.test(g)) { checked++; if (s !== "ML") fail("JOHDONMUKAISUUS", sc.id + ": 1250 or 1500 mutta luokka " + s); }
  if (sc.type === "Campaign" && s !== "any") fail("JOHDONMUKAISUUS", sc.id + ": kampanja mutta luokka " + s);
}
console.log("JOHDONMUKAISUUS: " + checked + " tarkistusta");

/* 3. suodatin */
const all = L.SC.length, anyN = L.SC.filter(sc => L.SIZE[sc.id] && L.SIZE[sc.id].s === "any").length;
if (L.SC.some(sc => !L.sizeOk(sc, ""))) fail("SUODATIN", "tyhjä valinta pudottaa skenaarioita");
const counts = {};
for (const [k, l] of L.SIZES) {
  const n = L.SC.filter(sc => L.sizeOk(sc, k)).length, own = L.SC.filter(sc => L.SIZE[sc.id].s !== "any" && L.SIZE[sc.id].s.includes(k)).length;
  counts[k] = n;
  L.DB = { lf: { size: k }, lq: "" };
  const list = L.listMatches("all").length;
  L.DB = { prep: { size: k } };
  const pool = L.poolFiltered(L.prep()).length;
  if (list !== n) fail("SUODATIN", l + ": etusivu " + list + " ≠ " + n);
  if (pool !== n) fail("SUODATIN", l + ": arvonta " + pool + " ≠ " + n);
  if (n !== own + anyN) fail("SUODATIN", l + ": " + n + " ≠ omat " + own + " + any " + anyN);
  if (own < 20) fail("SUODATIN", l + ": vain " + own + " omaa skenaariota");
  if (n >= all) fail("SUODATIN", l + ": luokka on koko kirjasto");
  /* laivastosuodattimen kanssa joukko ei kasva */
  L.DB = { lf: { size: k, sug: "Orks", sug2: "Imperial Navy" }, lq: "" };
  const both = L.listMatches("all").length;
  L.DB = { lf: { sug: "Orks", sug2: "Imperial Navy" }, lq: "" };
  const fleetOnly = L.listMatches("all").length;
  if (both > Math.min(n, fleetOnly)) fail("SUODATIN", l + " + Orks vs Imperial Navy: " + both + " > " + Math.min(n, fleetOnly));
  console.log("SUODATIN " + l + ": " + n + " skenaariota (" + own + " omaa + " + anyN + " any); etusivu " + list + ", arvonta " + pool + "; Orks vs Imperial Navy " + fleetOnly + " → " + both);
}
L.DB = { lf: {}, lq: "" };
if (L.listMatches("all").length !== all) fail("SUODATIN", "ilman suodattimia etusivu ei näytä kaikkia");

/* jakauma */
const dist = {};
for (const sc of L.SC) { const z = L.SIZE[sc.id]; const k = z.s === "any" ? "any" : z.s.join("+"); dist[k] = (dist[k] || 0) + 1; }
const keys = ["S", "M", "L", "S+M", "M+L", "S+L", "S+M+L", "any"].filter(k => dist[k]).concat(Object.keys(dist).filter(k => !["S", "M", "L", "S+M", "M+L", "S+L", "S+M+L", "any"].includes(k)));
console.log("JAKAUMA: " + keys.map(k => k + " " + dist[k]).join(" · ") + " (yhteensä " + all + ")");
console.log(fails ? "TULOS: " + fails + " virhettä" : "TULOS: 0 virhettä");
process.exit(fails ? 1 : 0);
