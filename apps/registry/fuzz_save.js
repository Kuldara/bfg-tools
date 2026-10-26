/* Save fuzz: a broken save never restores the WRONG ship silently.
 *
 * docs/save-format.md promises: the name is the primary key, the index only a fallback,
 * and if something does not resolve, the original is kept as a backup and the user is
 * told. test_save.js proves it with a few hand-written
 * cases. This runs thousands of seeded breakages
 * on a schema 3 save that has a borrowed ship, and measures one
 * invariant:
 *
 *   every restored unit is the SAME row as before the breakage
 *   (the same row name, the same source list), or the unit is missing AND that
 *   is reported in LOAD_NOTE.
 *
 * "The wrong ship at the right price, silently" is exactly the defect that makes
 * the name the key - and it is a defect no green test sees, because
 * the fleet "came back".
 *
 * Units are tagged in the name field (U0, U1, ...), which survives in the save,
 * so that a restored unit can be matched with the original even if the order
 * or count changes.
 *
 *   node fuzz_save.js            2000 breakages
 *   node fuzz_save.js 500 -v     fewer, and print every finding
 */
"use strict";
const fs = require("fs"), path = require("path");
const N = parseInt(process.argv[2], 10) || 2000;
const VERBOSE = process.argv.includes("-v");

/* ---- the app in Node (the same stub as test_save.js) ------------------ */
const mkEl = () => ({
  appendChild(){}, removeChild(){}, addEventListener(){}, setAttribute(){},
  getAttribute: () => null, removeAttribute(){}, focus(){}, remove(){},
  classList: { add(){}, remove(){}, toggle(){}, contains: () => false },
  querySelectorAll: () => [], querySelector: () => null,
  insertAdjacentHTML(){}, innerHTML: "", textContent: "", value: "",
  style: {}, id: "", dataset: {}, checked: false, disabled: false,
  onclick: null, onchange: null, oninput: null, children: [],
});
const els = {};
const el = k => (els[k] || (els[k] = mkEl()));
const DATA = fs.readFileSync(path.join(__dirname, "..", "..", "data", "bfg_data.json"), "utf8");
global.document = {
  getElementById: id => (id === "bfgdata" ? { textContent: DATA } : el("#" + id)),
  querySelector: s => el(s), querySelectorAll: () => [], createElement: () => mkEl(),
  addEventListener(){}, head: { appendChild(){} },
  body: { appendChild(){}, removeChild(){}, dataset: {}, classList: { add(){}, remove(){} } },
  fonts: { ready: Promise.resolve() },
};
global.window = { addEventListener(){}, print(){}, matchMedia: () => ({ matches: false, addEventListener(){} }) };
if (!global.navigator) Object.defineProperty(global, "navigator", { value: {}, configurable: true });
global.alert = () => {}; global.confirm = () => true;
let store = {};
global.localStorage = {
  getItem: k => (k in store ? store[k] : null),
  setItem: (k, v) => { store[k] = String(v); },
  removeItem: k => { delete store[k]; },
};
/* The app's modules, loaded under the stubs above (test-support.js). */
const api = require(require("path").join(__dirname, "./test-support.js")).loadApp();
const { LISTS, load, save, setS, getS, KEY, getNote, setNote, entOf, unitPts } = api;

/* ---- siemen ------------------------------------------------------------- */
let seed = 2026091420;
const rnd = () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
  t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
const pick = a => a[Math.floor(rnd() * a.length)];
const jitter = () => (rnd() < 0.5 ? -1 : 1) * (1 + Math.floor(rnd() * 3));

/* ---- fleet: host + a borrowed ship of the same race ------------------------ */
const shipRows = L => {
  const out = [];
  L.secs.forEach((sec, si) => sec.ents.forEach((en, ei) => {
    if (en.k === "unit" && en.r && en.p != null) out.push({ si, ei, en, sec });
  }));
  return out;
};
const pairs = [];
LISTS.forEach((h, hi) => LISTS.forEach((d, di) => {
  if (hi !== di && h.race && d.race && h.race === d.race && shipRows(h).length && shipRows(d).length)
    pairs.push([hi, di]);
}));
if (!pairs.length) { console.error("no pairs of the same race"); process.exit(2); }

function freshFleet() {
  const [hi, di] = pick(pairs);
  const H = LISTS[hi], D = LISTS[di];
  const hr = pick(shipRows(H)), dr = pick(shipRows(D));
  const units = [
    { s: hr.si, e: hr.ei, ref: hr.en.r, n: 1, opts: [], name: "U0" },
    { s: hr.si, e: hr.ei, ref: hr.en.r, n: 1, opts: [], name: "U1" },
    { s: dr.si, e: dr.ei, ref: dr.en.r, n: 1, opts: [], name: "U2", lst: D.nm, role: rnd() < 0.5 ? "reserve" : "ally" },
  ];
  /* J146: another list's fleet is stashed - it travels the same route
     through saving and can be broken just like the open fleet. */
  const sr = pick(shipRows(D));
  setS({ li: hi, limit: 3000, units,
         stash: { [D.nm]: { units: [{ s: sr.si, e: sr.ei, ref: sr.en.r, n: 1, opts: [], name: "S0" }],
                            limit: 2000 } } });
  setNote("");
  store = {};
  save();
  const doc = JSON.parse(store[KEY]);
  /* truth: name -> (row name, source list) before the breakage */
  const truth = {};
  getS().units.forEach(u => { truth[u.name] = { label: entOf(u).l, lst: u.lst || null, pts: unitPts(u) }; });
  /* Stashed ones count as missing only on the basis of the document
     (stashDoc), because a breakage may remove them from the document legally. */
  return { doc, truth, H, D };
}

/* ---- breakages -------------------------------------------------------- */
const MUT = [
  ["lst -> a list that does not exist", (doc) => { const u = doc.units[2]; u.lst = "No Such Fleet List"; }],
  ["lst -> another real list", (doc) => { const u = doc.units[2]; const o = pick(LISTS.filter(L => L.nm !== u.lst)); u.lst = o.nm; }],
  ["s shifts, names unchanged", (doc) => { const u = pick(doc.units); u.s = Math.max(0, u.s + jitter()); }],
  ["e shifts, names unchanged", (doc) => { const u = pick(doc.units); u.e = Math.max(0, u.e + jitter()); }],
  ["el -> a wrong row name", (doc) => { const u = pick(doc.units); u.el = "Nonexistent class battleship"; }],
  ["sn -> a wrong section name", (doc) => { const u = pick(doc.units); u.sn = "NONEXISTENT SECTION"; }],
  ["role -> junk", (doc) => { doc.units[2].role = "banana"; }],
  ["schemaVersion -> 99", (doc) => { doc.schemaVersion = 99; }],
  ["ln -> another list", (doc) => { const o = pick(LISTS.filter(L => L.nm !== doc.ln)); doc.ln = o.nm; doc.li = LISTS.indexOf(o); }],
  ["li junk, ln unchanged", (doc) => { doc.li = 9999; }],
  ["units[2] half", (doc) => { doc.units[2] = { name: "U2" }; }],
  ["two breakages", (doc) => { doc.units[2].lst = "No Such Fleet List"; doc.units[0].el = "Nonexistent class"; }],
  /* J146: stashed fleets */
  ["fleets -> not an array", (doc) => { doc.fleets = { nope: 1 }; }],
  ["fleets[0].ln -> a list that does not exist", (doc) => { if (doc.fleets) doc.fleets[0].ln = "No Such Fleet List"; }],
  ["fleets[0].ln -> the open list", (doc) => { if (doc.fleets) doc.fleets[0].ln = doc.ln; }],
  ["fleets[0].units puolikas", (doc) => { if (doc.fleets) doc.fleets[0].units = [{ name: "S0" }]; }],
  ["fleets[0].units -> junk", (doc) => { if (doc.fleets) doc.fleets[0].units = "junk"; }],
];

/* ---- run ---------------------------------------------------------------- */
let runs = 0, silentWrong = 0, lostUnreported = 0, restoredOk = 0, lostReported = 0;
const perMut = {};
const findings = [];
for (let i = 0; i < N; i++) {
  const { doc, truth } = freshFleet();
  const [name, mut] = pick(MUT);
  const d2 = JSON.parse(JSON.stringify(doc));
  try { mut(d2); } catch (e) { continue; }
  store = {}; store[KEY] = JSON.stringify(d2);
  setS({ li: 0, limit: 1500, units: [] });
  setNote("");
  let threw = null;
  try { load(); } catch (e) { threw = e; }
  runs++;
  perMut[name] = perMut[name] || { runs: 0, wrong: 0, unreported: 0 };
  perMut[name].runs++;
  if (threw) {
    findings.push(name + ": load() threw " + String(threw.message || threw));
    perMut[name].wrong++;
    continue;
  }
  const S = getS();
  const seen = {};
  let bad = false;
    /* The invariant is measured against the LOADED document, not the state
       before the breakage: a breakage may change what the document claims (lst to another
       real list that has the same row), and then the right behaviour is
       to follow the document. Wrong is only a restored ship that does not
       match the document - a different row name or a different source list - without a word. */
  const docBy = {};
  (d2.units || []).forEach(x => { if (x && x.name) docBy[x.name] = x; });
  S.units.forEach(u => {
    const doc = docBy[u.name];
    if (!doc) return;
    seen[u.name] = 1;
    let lab = null;
    try { lab = entOf(u) ? entOf(u).l : null; } catch (e) { lab = null; }
    const lstNow = u.lst || null, lstDoc = doc.lst || null;
    const labelWrong = doc.el != null && lab !== doc.el;
    const lstWrong = lstNow !== lstDoc;
    if (labelWrong || lstWrong) {
      bad = true;
      findings.push(name + ": " + u.name + " was restored WRONG: " +
        JSON.stringify({ dokumentti: { el: doc.el, lst: lstDoc }, nyt: { label: lab, lst: lstNow } }));
    }
  });
    /* J146: a stashed fleet under the same invariant. It is restored to ITS OWN
       list, so the row name is read from that list - exactly this went
       wrong at first, when the row was resolved from the list that was open. */
  const stashDoc = {};
  (Array.isArray(d2.fleets) ? d2.fleets : []).forEach(f => {
    if (!f || !Array.isArray(f.units)) return;
    const Lx = LISTS.filter(x => x.nm === f.ln)[0];
    if (!Lx) return;
    f.units.forEach(x => { if (x && x.name) stashDoc[f.ln + "\u0001" + x.name] = { doc: x, L: Lx }; });
  });
  Object.keys(S.stash || {}).forEach(ln => {
    ((S.stash[ln] && S.stash[ln].units) || []).forEach(u => {
      const hit = stashDoc[ln + "\u0001" + u.name];
      if (!hit) return;
      seen[ln + "\u0001" + u.name] = 1;
      const sec = hit.L.secs[u.s], en = sec ? sec.ents[u.e] : null;
      const lab = en ? en.l : null;
      if (hit.doc.el != null && lab !== hit.doc.el) {
        bad = true;
        findings.push(name + ": stashed " + u.name + " was restored WRONG: " +
          JSON.stringify({ dokumentti: hit.doc.el, nyt: lab, lista: ln }));
      }
    });
  });
  const missing = Object.keys(truth).filter(k => !seen[k])
    .concat(Object.keys(stashDoc).filter(k => !seen[k]));
  if (bad) { silentWrong++; perMut[name].wrong++; continue; }
  if (missing.length && !getNote()) {
    lostUnreported++; perMut[name].unreported++;
    findings.push(name + ": " + missing.join(",") + " is missing and LOAD_NOTE says nothing");
    continue;
  }
  if (missing.length) lostReported++; else restoredOk++;
}

console.log("fuzz_save: %d breakages", runs);
console.log("  restored fully right       %d", restoredOk);
console.log("  part missing AND reported  %d", lostReported);
console.log("  missing without a notice   %d", lostUnreported);
console.log("  restored WRONG silently    %d", silentWrong);
Object.keys(perMut).sort().forEach(k => {
  const m = perMut[k];
  console.log("  " + k.padEnd(32) + String(m.runs).padStart(5) + " runs  wrong " + m.wrong + "  unreported " + m.unreported);
});
const uniq = [...new Set(findings)];
if (uniq.length) {
  console.log("\nfindings (%d distinct):", uniq.length);
  uniq.slice(0, VERBOSE ? 200 : 15).forEach(f => console.log("  - " + f));
}
process.exit(silentWrong || lostUnreported ? 1 : 0);
