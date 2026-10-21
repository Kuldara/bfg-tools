/* Tallenteen fuzz: rikottu tallenne ei koskaan palauta VAARAA alusta hiljaa.
 *
 * docs/SAVE_SCHEMA.md lupaa: nimi on ensisijainen avain, indeksi vain vara,
 * ja jos jokin ei ratkea, alkuperainen sailyy varmuuskopiona ja siita
 * kerrotaan. test_save.js todistaa sen muutamalla kasin kirjoitetulla
 * tapauksella. Tama ajaa tuhansia siemenella arvottuja rikkomuksia
 * skeema 3:n tallenteeseen, jossa on lainalaiva, ja mittaa yhden
 * invariantin:
 *
 *   jokainen palautunut yksikko on SAMA rivi kuin ennen rikkomista
 *   (sama rivin nimi, sama lahdelista), tai yksikko puuttuu JA siita
 *   kerrotaan LOAD_NOTEssa.
 *
 * "Vaara alus oikealla hinnalla, hiljaa" on tasmalleen se vika, jonka takia
 * nimi on avain - ja se on vika, jota yksikaan vihrea testi ei nae, koska
 * laivasto "tuli takaisin".
 *
 * Yksikot merkitaan name-kentalla (U0, U1, ...), joka sailyy tallenteessa,
 * jotta palautunut yksikko voidaan yhdistaa alkuperaiseen vaikka jarjestys
 * tai maara muuttuisi.
 *
 *   node fuzz_save.js            2000 rikkomusta
 *   node fuzz_save.js 500 -v     vahemman, ja tulosta jokainen loydos
 */
"use strict";
const fs = require("fs"), path = require("path");
const N = parseInt(process.argv[2], 10) || 2000;
const VERBOSE = process.argv.includes("-v");

/* ---- sovellus Nodessa (sama tynka kuin test_save.js) ------------------ */
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
const DATA = fs.readFileSync(path.join(__dirname, "bfg_data.json"), "utf8");
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
const html = fs.readFileSync(path.join(__dirname, "Gothic Fleet Registry.html"), "utf8");
const js = html.split("<script>")[1].split("</script>")[0].replace(/^"use strict";/, "");
const api = new Function(js + "\n;return {LISTS,load,save,setS:v=>{S=v;},getS:()=>S,KEY," +
  "getNote:()=>LOAD_NOTE,setNote:v=>{LOAD_NOTE=v;},entOf,unitPts,DOMAIN};")();
const { LISTS, load, save, setS, getS, KEY, getNote, setNote, entOf, unitPts } = api;

/* ---- siemen ------------------------------------------------------------- */
let seed = 2026091420;
const rnd = () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
  t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
const pick = a => a[Math.floor(rnd() * a.length)];
const jitter = () => (rnd() < 0.5 ? -1 : 1) * (1 + Math.floor(rnd() * 3));

/* ---- laivasto: isanta + samanrotuinen lainalaiva ------------------------ */
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
if (!pairs.length) { console.error("ei samanrotuisia pareja"); process.exit(2); }

function freshFleet() {
  const [hi, di] = pick(pairs);
  const H = LISTS[hi], D = LISTS[di];
  const hr = pick(shipRows(H)), dr = pick(shipRows(D));
  const units = [
    { s: hr.si, e: hr.ei, ref: hr.en.r, n: 1, opts: [], name: "U0" },
    { s: hr.si, e: hr.ei, ref: hr.en.r, n: 1, opts: [], name: "U1" },
    { s: dr.si, e: dr.ei, ref: dr.en.r, n: 1, opts: [], name: "U2", lst: D.nm, role: rnd() < 0.5 ? "reserve" : "ally" },
  ];
  /* J146: toisen listan laivasto talteen - se kulkee samaa reittia
     tallennuksen lapi ja on rikottavissa samoin kuin avoin laivasto. */
  const sr = pick(shipRows(D));
  setS({ li: hi, limit: 3000, units,
         stash: { [D.nm]: { units: [{ s: sr.si, e: sr.ei, ref: sr.en.r, n: 1, opts: [], name: "S0" }],
                            limit: 2000 } } });
  setNote("");
  store = {};
  save();
  const doc = JSON.parse(store[KEY]);
  /* totuus: nimi -> (rivin nimi, lahdelista) ennen rikkomista */
  const truth = {};
  getS().units.forEach(u => { truth[u.name] = { label: entOf(u).l, lst: u.lst || null, pts: unitPts(u) }; });
  /* Talteen pannut lasketaan puuttuviksi vasta dokumentin perusteella
     (stashDoc), koska rikkomus voi poistaa ne dokumentista laillisesti. */
  return { doc, truth, H, D };
}

/* ---- rikkomukset -------------------------------------------------------- */
const MUT = [
  ["lst -> olematon lista", (doc) => { const u = doc.units[2]; u.lst = "No Such Fleet List"; }],
  ["lst -> toinen oikea lista", (doc) => { const u = doc.units[2]; const o = pick(LISTS.filter(L => L.nm !== u.lst)); u.lst = o.nm; }],
  ["s siirtyy, nimet ennallaan", (doc) => { const u = pick(doc.units); u.s = Math.max(0, u.s + jitter()); }],
  ["e siirtyy, nimet ennallaan", (doc) => { const u = pick(doc.units); u.e = Math.max(0, u.e + jitter()); }],
  ["el -> vaara rivin nimi", (doc) => { const u = pick(doc.units); u.el = "Nonexistent class battleship"; }],
  ["sn -> vaara osion nimi", (doc) => { const u = pick(doc.units); u.sn = "NONEXISTENT SECTION"; }],
  ["role -> roskaa", (doc) => { doc.units[2].role = "banana"; }],
  ["schemaVersion -> 99", (doc) => { doc.schemaVersion = 99; }],
  ["ln -> toinen lista", (doc) => { const o = pick(LISTS.filter(L => L.nm !== doc.ln)); doc.ln = o.nm; doc.li = LISTS.indexOf(o); }],
  ["li roskaa, ln ennallaan", (doc) => { doc.li = 9999; }],
  ["units[2] puolikas", (doc) => { doc.units[2] = { name: "U2" }; }],
  ["kaksi rikkomusta", (doc) => { doc.units[2].lst = "No Such Fleet List"; doc.units[0].el = "Nonexistent class"; }],
  /* J146: talteen pannut laivastot */
  ["fleets -> ei taulukko", (doc) => { doc.fleets = { nope: 1 }; }],
  ["fleets[0].ln -> olematon lista", (doc) => { if (doc.fleets) doc.fleets[0].ln = "No Such Fleet List"; }],
  ["fleets[0].ln -> avoin lista", (doc) => { if (doc.fleets) doc.fleets[0].ln = doc.ln; }],
  ["fleets[0].units puolikas", (doc) => { if (doc.fleets) doc.fleets[0].units = [{ name: "S0" }]; }],
  ["fleets[0].units -> roskaa", (doc) => { if (doc.fleets) doc.fleets[0].units = "roskaa"; }],
];

/* ---- ajo ---------------------------------------------------------------- */
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
    findings.push(name + ": load() heitti " + String(threw.message || threw));
    perMut[name].wrong++;
    continue;
  }
  const S = getS();
  const seen = {};
  let bad = false;
  /* Invariantti mitataan LADATTUA dokumenttia vasten, ei rikkomista
     edeltavaa tilaa: rikkomus voi muuttaa dokumentin vaitteen (lst toiseksi
     oikeaksi listaksi, jolla sama rivi on), ja silloin oikea kaytos on
     noudattaa dokumenttia. Vaarin on vain se, etta palautunut alus ei
     vastaa dokumenttia - eri rivin nimi tai eri lahdelista - ilman sanaa. */
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
      findings.push(name + ": " + u.name + " palautui VAARIN: " +
        JSON.stringify({ dokumentti: { el: doc.el, lst: lstDoc }, nyt: { label: lab, lst: lstNow } }));
    }
  });
  /* J146: talteen pantu laivasto samalla invariantilla. Se palautuu OMALLE
     listalleen, joten rivin nimi luetaan silta listalta - juuri tama meni
     ensin vaarin, kun rivi ratkaistiin avoinna olevalta listalta. */
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
        findings.push(name + ": talteen pantu " + u.name + " palautui VAARIN: " +
          JSON.stringify({ dokumentti: hit.doc.el, nyt: lab, lista: ln }));
      }
    });
  });
  const missing = Object.keys(truth).filter(k => !seen[k])
    .concat(Object.keys(stashDoc).filter(k => !seen[k]));
  if (bad) { silentWrong++; perMut[name].wrong++; continue; }
  if (missing.length && !getNote()) {
    lostUnreported++; perMut[name].unreported++;
    findings.push(name + ": " + missing.join(",") + " puuttuu eika LOAD_NOTE kerro mitaan");
    continue;
  }
  if (missing.length) lostReported++; else restoredOk++;
}

console.log("fuzz_save: %d rikkomusta", runs);
console.log("  palautui kokonaan oikein   %d", restoredOk);
console.log("  osa puuttui JA kerrottiin  %d", lostReported);
console.log("  puuttui ilman ilmoitusta   %d", lostUnreported);
console.log("  palautui VAARIN hiljaa     %d", silentWrong);
Object.keys(perMut).sort().forEach(k => {
  const m = perMut[k];
  console.log("  " + k.padEnd(32) + String(m.runs).padStart(5) + " ajoa  vaarin " + m.wrong + "  ilmoittamatta " + m.unreported);
});
const uniq = [...new Set(findings)];
if (uniq.length) {
  console.log("\nloydokset (%d erilaista):", uniq.length);
  uniq.slice(0, VERBOSE ? 200 : 15).forEach(f => console.log("  - " + f));
}
process.exit(silentWrong || lostUnreported ? 1 : 0);
