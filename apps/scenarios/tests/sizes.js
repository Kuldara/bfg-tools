/* Size test (0.12, 21.10.2026): the scenario size filter (scenarios/sizes.js).
   Run:  node apps/scenarios/tests/sizes.js   (Node, no browser; seconds)

   1. TABLE        every scenario has a SIZE row, and the table has no unknown ids; s is "any" or
                   a non-empty array of the classes S/M/L (no repeats, in order); pts and why are text without
                   undefined/NaN leftovers.
   2. CONSISTENCY  the points text and the class do not contradict each other: "N each" → the class of N; glance "Equal" → any;
                   fixed forces ("Fixed", "Set fleets", "Historical") are not any unless the source allows an agreed size.
   3. FILTER       sizeOk, the front page's listMatches and the draw's poolFiltered give the same numbers; every class
                   has the any scenarios and at least 20 of its own; no class is the whole library; an empty choice = all;
                   combining it with the fleet filter does not grow the set.
   Prints the distribution (how many scenarios in each class). */
"use strict";
const path = require("path");
const { loadLibrary } = require("./_load.js");
const DIR = path.join(__dirname, "..");
const L = loadLibrary(DIR, { names: "SIZE, SIZES, sizeOk, listMatches, poolFiltered, lf, prep" });
let fails = 0;
const fail = (k, m) => { fails++; if (fails <= 60) console.log("ERROR " + k + ": " + m); };
const BAD = /undefined|NaN|\[object|function/;
const ORDER = ["S", "M", "L"];
const cls = n => n <= 1000 ? "S" : n < 1500 ? "M" : "L";

/* 1. table */
const ids = new Set(L.SC.map(s => s.id));
for (const sc of L.SC) if (!L.SIZE[sc.id]) fail("TABLE", sc.id + " is missing from sizes.js");
for (const id of Object.keys(L.SIZE)) {
  const z = L.SIZE[id];
  if (!ids.has(id)) fail("TABLE", "unknown id " + id);
  if (z.s !== "any") {
    if (!Array.isArray(z.s) || !z.s.length) fail("TABLE", id + ": s is neither any nor an array");
    else if (z.s.some(k => !ORDER.includes(k))) fail("TABLE", id + ": unknown class " + z.s.join(""));
    else if (z.s.join("") !== ORDER.filter(k => z.s.includes(k)).join("")) fail("TABLE", id + ": classes repeat or are out of order " + z.s.join(""));
  }
  for (const f of ["pts", "why"]) if (typeof z[f] !== "string" || !z[f].trim() || BAD.test(z[f])) fail("TABLE", id + ": " + f + " is missing or broken");
}
console.log("TABLE: " + Object.keys(L.SIZE).length + " rows, " + L.SC.length + " scenarios");

/* 2. consistency */
const pointsOf = sc => { const v = sc.variants ? sc.variants[0][0] : "std"; const g = L.val(sc.glance, v) || []; const r = g.find(x => /^points$/i.test(x[0])); return r ? r[1] : ""; };
let checked = 0;
for (const sc of L.SC) {
  const z = L.SIZE[sc.id]; if (!z) continue;
  const g = pointsOf(sc), s = z.s === "any" ? "any" : z.s.join("");
  const each = z.pts.match(/^(\d+) each$/);
  if (each) { checked++; if (s !== cls(+each[1])) fail("CONSISTENCY", sc.id + ": " + z.pts + " but class " + s); }
  if (g === "Equal") { checked++; if (s !== "any") fail("CONSISTENCY", sc.id + ": glance Equal but class " + s); }
  if (/^(Fixed|Set fleets|Historical|Pre-made)/.test(g)) { checked++; if (s === "any" && !/agreed/i.test(g + " " + z.why)) fail("CONSISTENCY", sc.id + ": fixed forces but any"); }
  if (/^Equal: 1250 or 1500/.test(g)) { checked++; if (s !== "ML") fail("CONSISTENCY", sc.id + ": 1250 or 1500 but class " + s); }
  if (sc.type === "Campaign" && s !== "any") fail("CONSISTENCY", sc.id + ": campaign but class " + s);
}
console.log("CONSISTENCY: " + checked + " checks");

/* 3. filter */
const all = L.SC.length, anyN = L.SC.filter(sc => L.SIZE[sc.id] && L.SIZE[sc.id].s === "any").length;
if (L.SC.some(sc => !L.sizeOk(sc, ""))) fail("FILTER", "an empty choice drops scenarios");
const counts = {};
for (const [k, l] of L.SIZES) {
  const n = L.SC.filter(sc => L.sizeOk(sc, k)).length, own = L.SC.filter(sc => L.SIZE[sc.id].s !== "any" && L.SIZE[sc.id].s.includes(k)).length;
  counts[k] = n;
  L.DB = { lf: { size: k }, lq: "" };
  const list = L.listMatches("all").length;
  L.DB = { prep: { size: k } };
  const pool = L.poolFiltered(L.prep()).length;
  if (list !== n) fail("FILTER", l + ": front page " + list + " ≠ " + n);
  if (pool !== n) fail("FILTER", l + ": draw " + pool + " ≠ " + n);
  if (n !== own + anyN) fail("FILTER", l + ": " + n + " ≠ own " + own + " + any " + anyN);
  if (own < 20) fail("FILTER", l + ": only " + own + " scenarios of its own");
  if (n >= all) fail("FILTER", l + ": the class is the whole library");
  /* with the fleet filter the set does not grow */
  L.DB = { lf: { size: k, sug: "Orks", sug2: "Imperial Navy" }, lq: "" };
  const both = L.listMatches("all").length;
  L.DB = { lf: { sug: "Orks", sug2: "Imperial Navy" }, lq: "" };
  const fleetOnly = L.listMatches("all").length;
  if (both > Math.min(n, fleetOnly)) fail("FILTER", l + " + Orks vs Imperial Navy: " + both + " > " + Math.min(n, fleetOnly));
  console.log("FILTER " + l + ": " + n + " scenarios (" + own + " own + " + anyN + " any); front page " + list + ", draw " + pool + "; Orks vs Imperial Navy " + fleetOnly + " → " + both);
}
L.DB = { lf: {}, lq: "" };
if (L.listMatches("all").length !== all) fail("FILTER", "without filters the front page does not show all");

/* distribution */
const dist = {};
for (const sc of L.SC) { const z = L.SIZE[sc.id]; const k = z.s === "any" ? "any" : z.s.join("+"); dist[k] = (dist[k] || 0) + 1; }
const keys = ["S", "M", "L", "S+M", "M+L", "S+L", "S+M+L", "any"].filter(k => dist[k]).concat(Object.keys(dist).filter(k => !["S", "M", "L", "S+M", "M+L", "S+L", "S+M+L", "any"].includes(k)));
console.log("DISTRIBUTION: " + keys.map(k => k + " " + dist[k]).join(" · ") + " (total " + all + ")");
console.log(fails ? "RESULT: " + fails + " errors" : "RESULT: 0 errors");
process.exit(fails ? 1 : 0);
