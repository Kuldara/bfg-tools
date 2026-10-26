/* The user's own rosters through the builder's own engine -> apps/play/rosters.json

   Source: the user's own roster workbook (v22, "ork alt da slow n furius"),
   the prefilled 1200 pts tab, the "1500 expansions" tab and
   "ORKS ALT - DA SLOW N FURIUS" (a separate 1500 pts Ork list). Compared with
   v14, v22 added Bastion, Dark Eldar and Tau (1200 + 1500) and the Ork alt;
   the original seven fleets are unchanged (19.10.2026). The rows were
   read by hand below; this script runs them through the app's modules
   (addUnit, setOptState, setUpState, setHull, save) on the same path as
   a user clicking, so the documents are genuine schema 4 saves with
   option ids and required upgrades. The points are compared with the sheet's
   total and a difference is reported - not fixed silently.

     node apps/play/make_rosters.js */
"use strict";
const fs = require("fs"), path = require("path");
const ROOT = path.join(__dirname, "..", "registry");

/* --- the same DOM stub as test_save.js -------------------------------- */
const el = () => ({
  textContent: "", innerHTML: "", value: "", className: "", dataset: {},
  querySelectorAll: () => [], appendChild(){}, onclick: null, onchange: null,
  oninput: null, style: {}, id: "", classList: { add(){}, remove(){} },
  setAttribute(){}, getAttribute: () => "", closest: () => el(), hidden: false,
});
global.document = {
  getElementById: id => id === "bfgdata"
    ? { textContent: fs.readFileSync(path.join(ROOT, "..", "..", "data", "bfg_data.json"), "utf8") } : el(),
  querySelector: () => el(), querySelectorAll: () => [], createElement: () => el(),
  head: { appendChild(){} },
  body: { appendChild(){}, removeChild(){}, dataset: {}, classList: { add(){}, remove(){} } },
};
global.window = {};
try{ global.navigator = {}; }catch(e){}   /* Node 24: read-only (AGENTS.md 6) */
const store = {};
global.localStorage = { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = v; }, removeItem: k => { delete store[k]; } };
global.alert = () => {}; global.confirm = () => false;

/* The app's modules, loaded under the stubs above (test-support.js). */
const api = require(require("path").join(__dirname, "../registry/test-support.js")).loadApp();
const { LISTS, SHIPS, DOMAIN, getS, setS, switchList, addUnit, addUnitFrom, setOptState, setUpState, setHull, applyRequired, save, saveDocument, unitPts, total, shipOf, entOf, checks } = api;

function li(name){ const i = LISTS.findIndex(L => L.nm === name); if(i < 0) throw new Error("no list " + name); return i; }
function find(L, secRe, rowRe){
  for(let si = 0; si < L.secs.length; si++){
    if(!secRe.test(L.secs[si].t)) continue;
    const ei = L.secs[si].ents.findIndex(e => rowRe.test(e.l));
    if(ei >= 0) return { si, ei };
  }
  throw new Error("no row " + rowRe + " in " + secRe + " of " + L.nm);
}
function findUp(L, secRe, labelRe){ const at = find(L, secRe, labelRe); if(L.secs[at.si].ents[at.ei].k !== "up") throw new Error("not an upgrade: " + labelRe); return at; }

/* One fleet: reset, pick the list, add the rows in order. A row:
   { sec, row, n, name, opts:[re...], ups:[[secRe, labelRe]...], hull: re,
     from: "list name" (reserve bought from another list, as the catalogue's
     list picker does) } */
function build(listName, rows){
  setS({ li: 0, limit: 1500, units: [], stash: {} });
  switchList(li(listName));
  const L = LISTS[li(listName)];
  const S = getS();
  const units = [];
  rows.forEach(r => {
    const at = find(r.from ? LISTS[li(r.from)] : L, r.sec, r.row);
    if(r.from) addUnitFrom(li(r.from), at.si, at.ei, "reserve");
    else addUnit(at.si, at.ei);
    const u = S.units[S.units.length - 1];
    if(r.n) u.n = r.n;
    if(r.name) u.name = r.name;
    if(r.hull){
      const k = Object.keys(SHIPS).find(p => r.hull.test(SHIPS[p].nm));
      if(!k) throw new Error("no hull " + r.hull);
      setHull(u, isNaN(+k) ? k : +k);
    }
    applyRequired(u);
    (r.opts || []).forEach(re => {
      const sh = shipOf(u);
      const i = (sh.ol || []).findIndex(o => re.test(o.t));
      if(i < 0) throw new Error("no option " + re + " on " + sh.nm + ": " + (sh.ol || []).map(o => o.t.slice(0, 50)).join(" | "));
      setOptState(u, i, "take");
    });
    (r.ups || []).forEach(([secRe, labelRe]) => {
      const up = findUp(L, secRe, labelRe);
      setUpState(u, up.si, up.ei, "take");
    });
    units.push(u);
  });
  /* aboard: "unit name" - the commander's ship (J215), as the fleet view's
     picker sets it: the ship's uid */
  rows.forEach((r, i) => {
    if(!r.aboard) return;
    const t = units.find(x => x.name === r.aboard);
    if(!t || !t.uid) throw new Error("no ship to board: " + r.aboard);
    units[i].aboard = t.uid;
  });
  S.units.forEach(u => applyRequired(u));
  save();
  const doc = JSON.parse(store[api.KEY]);
  const pts = total();
  const ck = checks().filter(c => !c.ok && !c.warn).map(c => c.t + ": " + c.v);
  return { doc, pts, ck, lines: S.units.map(u => (u.n > 1 ? u.n + "x " : "") + entOf(u).l + " = " + unitPts(u)) };
}

const R = [];
function fleet(name, note, expect, listName, rows){
  const b = build(listName, rows);
  const flag = b.pts === expect ? "ok" : "POINTS DIFFER from the sheet: " + expect;
  console.log("== " + name + ": " + b.pts + " pts (" + flag + ")" + (b.ck.length ? "  RED: " + b.ck.join("; ") : ""));
  b.lines.forEach(l => console.log("   " + l));
  R.push({ name, note, expect, points: b.pts, doc: b.doc, checks: b.ck });
}

/* ---------------------------------------------------------------- 1200 --- */
const HIVE = [/^Prow .*Boarding torpedoes/, /^Thorax .*Launch bays/, /set 1 .*Launch bays/, /set 2 .*Launch bays/, /set 3 .*Launch bays/];
const TYR = [
  { sec: /^HIVE SHIPS/, row: /^Hive ship/, name: "Hive Ship A", opts: HIVE, ups: [[/^FLEET COMMANDER/, /^Hive Mind Influence/]] },
  { sec: /^HIVE SHIPS/, row: /^Hive ship/, name: "Hive Ship B", opts: HIVE, ups: [[/^FLEET COMMANDER/, /^Hive Mind Influence/]] },
  { sec: /^ESCORTS/, row: /^Escort drone/, n: 6, name: "Escort Drone squad A", opts: [/^Weapon .*Pyro-acid/] },
  { sec: /^ESCORTS/, row: /^Escort drone/, n: 6, name: "Escort Drone squad B", opts: [/^Weapon .*Bio-plasma/] },
  { sec: /^ESCORTS/, row: /^Kraken/, n: 4, name: "Kraken squad", opts: [/^Weapon .*Massive claws/] },
  { sec: /^ESCORTS/, row: /^Vanguard drone ship/, n: 6, name: "Vanguard Drone squad", opts: [/^Weapon .*Feeder/] },
];
const ORK = [
  { sec: /^BATTLESHIPS/, row: /^Dethdeala/, name: "Dethdeala", ups: [[/^DAKKA DAKKA/, /\+2 turrets/]] },
  { sec: /^KROOZERS/, row: /^Terror ship/, name: "Terror Ship #1", opts: [/torpedo/i] },
  { sec: /^KROOZERS/, row: /^Terror ship/, name: "Terror Ship #2", opts: [/torpedo/i] },
  { sec: /^ESCORTS/, row: /^Onslaught/, n: 5, name: "Onslaught escorts" },
  { sec: /^ESCORTS/, row: /^Ravager/, n: 2, name: "Ravager escorts" },
  { sec: /^ESCORTS/, row: /^Brute/, n: 4, name: "Brutes 1" },
  { sec: /^ESCORTS/, row: /^Brute/, n: 3, name: "Brutes 2" },
  { sec: /^WARLORD/, row: /^Ork Warlord/, ups: [[/^WARLORD/, /^Two extra re-rolls/], [/^WARLORD/, /^Extra Power Fields/]] },
];
const ADM = [
  { sec: /^Cruisers/, row: /^Dictator/, name: "Dictator" },
  { sec: /^Cruisers/, row: /^Defiant/, name: "Defiant #1" },
  { sec: /^Cruisers/, row: /^Defiant/, name: "Defiant #2" },
  { sec: /^Cruisers/, row: /^Endeavour/, name: "Endeavour #1", ups: [[/^FLEET UPGRADES/, /^Plasma-boosted/]] },
  { sec: /^Cruisers/, row: /^Endeavour/, name: "Endeavour #2", ups: [[/^FLEET UPGRADES/, /^Plasma-boosted/]] },
  { sec: /^ESCORTS/, row: /^Hunter/, n: 5, name: "Hunter squadron" },
  { sec: /^ESCORTS/, row: /^Gladius/, n: 3, name: "Gladius squadron" },
  { sec: /^Mechanicus Archmagos/, row: /^Archmagos Explorator/, ups: [[/^Mechanicus Archmagos/, /^One re-roll/]] },
];
const KHO = [
  { sec: /^Battleships/, row: /^Despoiler/, name: "Despoiler" },
  { sec: /^Heavy Cruisers/, row: /^Hecate/, name: "Hecate" },
  { sec: /^Cruisers/, row: /^Carnage/, name: "Carnage" },
  { sec: /^Cruisers/, row: /^Murder/, name: "Murder" },
  { sec: /^ESCORTS/, row: /^Idolator/, n: 2, name: "Idolator squadron" },
  { sec: /^Chaos Warmaster of Khorne/, row: /^Chaos Warmaster/, ups: [[/^Chaos Warmaster of Khorne/, /^The Mark of Khorne/]] },
];
const SMC = [
  { sec: /^Battle Barges/, row: /^Venerable battle barge/, name: "First Covenant", hull: /^STYX/ },
  { sec: /^Cruisers/, row: /^Strike cruisers/, name: "Strike Cruiser 1", opts: [/shield/i] },
  { sec: /^Cruisers/, row: /^Strike cruisers/, name: "Strike Cruiser 2", opts: [/shield/i] },
  { sec: /^Cruisers/, row: /^Strike cruisers/, name: "Strike Cruiser 3", opts: [/shield/i] },
  { sec: /^Cruisers/, row: /^Strike cruisers/, name: "Strike Cruiser T1", opts: [/torpedo/i, /shield/i] },
  { sec: /^Cruisers/, row: /^Strike cruisers/, name: "Strike Cruiser T2", opts: [/torpedo/i, /shield/i] },
  { sec: /^Master of the Fleet/, row: /^Master of the Fleet/, ups: [[/^Master of the Fleet/, /^Two re-rolls/]] },
];
const ELD = [
  { sec: /^Battleships/, row: /^Void Stalker/, name: "Bright Star" },
  { sec: /^ESCORTS/, row: /^Nightshade/, n: 2, name: "Nightshades A" },
  { sec: /^ESCORTS/, row: /^Hellebore/, n: 2, name: "Hellebores A" },
  { sec: /^ESCORTS/, row: /^Nightshade/, n: 2, name: "Nightshades B" },
  { sec: /^ESCORTS/, row: /^Hellebore/, n: 2, name: "Hellebores B" },
  { sec: /^ESCORTS/, row: /^Aconite/, n: 5, name: "Aconite squadron" },
  { sec: /^Pirate Prince/, row: /^Pirate Prince/, ups: [[/^Pirate Prince/, /^One re-roll/]] },
];
const NEC = [
  { sec: /^Tombships/, row: /^Cairn/, name: "Cairn", opts: [/Sepulchre/] },
  { sec: /^Cruisers/, row: /^Scythe/, name: "Scythe #1" },
  { sec: /^Cruisers/, row: /^Scythe/, name: "Scythe #2" },
  { sec: /^Raiders/, row: /^Jackal/, n: 2, name: "Jackal squadron" },
];

fleet("Tyranids 1200", "own roster, 1200 pts sheet", 1170, "Tyranids — Hive Fleet", TYR);
fleet("Orks 1200", "own roster; Brutes 4+3", 1200, "Orks — Waaagh!", ORK);
fleet("AdMech 1200", "own roster", 1180, "Adeptus Mechanicus — Explorator", ADM);
fleet("World Eaters 1200", "own roster; Chosen Terminators (+10) not taken: the builder wants the World Eaters crew first (Fleets pp. 224-225)", 1190, "Chaos — Khorne", KHO);
fleet("Space Marines 1200", "own roster; Styx Venerable Battle Barge", 1195, "Space Marines — Crusade", SMC);
fleet("Eldar Corsairs 1200", "own roster; mixed squadrons as 2+2", 1200, "Eldar Corsairs — Later Gothic War", ELD);
fleet("Necrons 1200", "own roster", 1200, "Necrons — Harvest Fleet", NEC);

/* ---------------------------------------------------------------- 1500 --- */
fleet("Tyranids 1500", "1500 expansions tab; the builder counts 25 escorts against 2 x 12 per hive ship", 1495, "Tyranids — Hive Fleet", TYR.concat([
  { sec: /^CAPITAL SHIPS/, row: /^Cruiser/, name: "Cruiser A", opts: [/^Prow .*Massive claws/, /^Thorax .*Massive claws/, /set 1 .*Bio-plasma/] },
  { sec: /^CAPITAL SHIPS/, row: /^Cruiser/, name: "Cruiser B", opts: [/^Prow .*Massive claws/, /^Thorax .*Massive claws/, /set 1 .*Bio-plasma/] },
  { sec: /^ESCORTS/, row: /^Kraken/, n: 1, name: "Kraken claw +1", opts: [/^Weapon .*Massive claws/] },
  { sec: /^ESCORTS/, row: /^Kraken/, n: 2, name: "Bio-plasma Kraken", opts: [/^Weapon .*Bio-plasma/] },
]));
fleet("Orks 1500", "1500 expansions tab: +3 Onslaught +3 Ravager +3 Brute (Onslaughts 5+3)", 1500, "Orks — Waaagh!", ORK.map(r => {
  const c = Object.assign({}, r);
  if(/Ravager/.test(String(r.row))) c.n = 5;
  return c;
}).concat([{ sec: /^ESCORTS/, row: /^Onslaught/, n: 3, name: "Onslaughts 2" }, { sec: /^ESCORTS/, row: /^Brute/, n: 3, name: "Brutes 3" }]));
fleet("AdMech 1500", "1500 expansions tab: +6 Gladius +2 Hunter (Hunters 4+3, Gladius 6+3)", 1490, "Adeptus Mechanicus — Explorator", ADM.map(r => {
  const c = Object.assign({}, r);
  if(/Hunter/.test(String(r.row))) c.n = 4;
  if(/Gladius/.test(String(r.row))) c.n = 6;
  return c;
}).concat([{ sec: /^ESCORTS/, row: /^Hunter/, n: 3, name: "Hunters 2" }, { sec: /^ESCORTS/, row: /^Gladius/, n: 3, name: "Gladius 2" }]));
fleet("World Eaters 1500", "1500 expansions tab: +Slaughter +Idolator +2 Infidel; Chosen Terminators not taken (see 1200)", 1480, "Chaos — Khorne", KHO.map(r => {
  const c = Object.assign({}, r); if(/Idolator/.test(String(r.row))) c.n = 3; return c;
}).concat([
  { sec: /^Cruisers/, row: /^Slaughter/, name: "Killfrenzy" },
  { sec: /^ESCORTS/, row: /^Infidel/, n: 2, name: "Infidels" },
]));
fleet("Space Marines 1500", "1500 expansions tab: 4+3 Strike Cruisers, 1 bought re-roll, Honour Guard", 1500, "Space Marines — Crusade", [
  SMC[0],
  { sec: /^Cruisers/, row: /^Strike cruisers/, name: "Strike Cruiser 1", opts: [/shield/i], ups: [[/^ORDNANCE/, /^Honour Guard/]] },
  SMC[2], SMC[3],
  { sec: /^Cruisers/, row: /^Strike cruisers/, name: "Strike Cruiser 4", opts: [/shield/i] },
  SMC[4], SMC[5],
  { sec: /^Cruisers/, row: /^Strike cruisers/, name: "Strike Cruiser T3", opts: [/torpedo/i, /shield/i] },
  { sec: /^Master of the Fleet/, row: /^Master of the Fleet/, ups: [[/^Master of the Fleet/, /^One re-roll/]] },
]);
fleet("Eldar Corsairs 1500", "1500 expansions tab: +Eclipse +1 Nightshade (3+2)", 1490, "Eldar Corsairs — Later Gothic War", [
  ELD[0], { sec: /^Cruisers/, row: /^Eclipse/, name: "Silent Warrior" },
  { sec: /^ESCORTS/, row: /^Nightshade/, n: 3, name: "Nightshades A" }, ELD[2], ELD[3], ELD[4], ELD[5], ELD[6],
]);
fleet("Necrons 1500", "1500 expansions tab: +Scythe +1 bought re-roll", 1500, "Necrons — Harvest Fleet", NEC.concat([
  { sec: /^Cruisers/, row: /^Scythe/, name: "Yuctan", ups: [[/^Re-rolls/, /^One extra re-roll/]] },
]));

/* ------------------------------------- v22: Bastion, Dark Eldar, Tau --- */
/* Added 19.10.2026 from the v22 workbook; the lists come last so that the order
   of the older rosters (the meter looks them up by name) does not change. */
const BAS = [
  { sec: /^Admiral/, row: /^Admiral \(Ld 9\)/ },
  { sec: /^Battleships/, row: /^Exorcist/, name: "Exorcist #1" },
  { sec: /^Battleships/, row: /^Exorcist/, name: "Exorcist #2" },
  { sec: /^Cruisers/, row: /^Endeavour/, name: "Endeavour #1" },
  { sec: /^Cruisers/, row: /^Endeavour/, name: "Endeavour #2" },
  { sec: /^Cruisers/, row: /^Defiant/, name: "Defiant #1" },
  { sec: /^Cruisers/, row: /^Defiant/, name: "Defiant #2" },
  { sec: /^ESCORTS/, row: /^Cobra/, n: 6, name: "Cobra squadron" },
];
const DE = [
  { sec: /^Dread Archon/, row: /^Dread Archon/, ups: [[/^Dread Archon/, /^Two re-rolls/]] },
  { sec: /^Cruisers/, row: /^Torture/, name: "Torture A", opts: [/launch bays/, /Mimic/] },
  { sec: /^Cruisers/, row: /^Torture/, name: "Torture B", opts: [/launch bays/, /Mimic/] },
  { sec: /^ESCORTS/, row: /^Corsair/, n: 5, name: "Corsair battery squadron", opts: [/weapons battery/, /Mimic/] },
  { sec: /^ESCORTS/, row: /^Corsair/, n: 4, name: "Corsair Impaler squadron", opts: [/Impaler module/, /Mimic/] },
];
const TAU = [
  { sec: /^Commander/, row: /^Kor.O.Mesme/ },
  { sec: /^Battleships/, row: /^Custodian/, name: "Custodian", ups: [[/^FLEET UPGRADES/, /^Improved Logic Engines/]] },
  { sec: /^Battleships/, row: /^Explorer.*Vash/, name: "Explorer #1" },
  { sec: /^Battleships/, row: /^Explorer.*Vash/, name: "Explorer #2" },
  { sec: /^ESCORTS/, row: /^Castellan/, n: 4, name: "Castellan squadron" },
  { sec: /^ESCORTS/, row: /^Warden/, n: 3, name: "Warden squadron" },
];

fleet("Bastion Fleet 1200", "own roster v22; 2 Exorcist + 2 Defiant = 12 launch bays, 6 Cobras", 1200, "Imperial Navy — Bastion Fleets", BAS);
fleet("Dark Eldar 1200", "own roster v22; 2 carrier Tortures, 5 battery + 4 Impaler Corsairs, all with Mimic Engines", 1185, "Dark Eldar — Pirates", DE);
fleet("Tau 1200", "own roster v22; Mesme + Custodian + 2 Explorers, 4 Castellan + 3 Warden; no torpedo bombers", 1200, "Tau — Commerce Protection", TAU);
/* The sheet's Power Ram (+5) for one Endeavour: a ram only for a 6+ prow
   (Fleets p. 32); the Endeavour's base profile is 5+, so the ship takes
   its free 6+ prow option (p. 72, turns 45°). The sheet says nothing about the prow;
   without it the ram is not legal. The builder honours the option from J223
   (20.10.2026) on. */
fleet("Bastion Fleet 1500", "1500 expansions tab: +Tyrant (45 cm batteries), +Siluria reserve from Bakka, Power Ram on one Endeavour; the ram needs a 6+ prow (Fleets p. 32), so that Endeavour takes its free 6+ prow option and turns 45 degrees (p. 72)", 1500, "Imperial Navy — Bastion Fleets", BAS.map(r => {
  const c = Object.assign({}, r);
  if(r.name === "Endeavour #1"){ c.opts = [/prow armour to 6\+/]; c.ups = [[/^FLEET UPGRADES/, /^Imperial Power Ram/]]; }
  return c;
}).concat([
  { sec: /^Cruisers/, row: /^Tyrant/, name: "Tyrant", opts: [/45 cm range weapons batteries/] },
  { from: "Imperial Navy — Bakka Sector", sec: /./, row: /^Siluria/, name: "Siluria" },
]));
fleet("Dark Eldar 1500", "1500 expansions tab: +1 battery +2 Impaler Corsairs, +3 torpedo Corsairs without Mimic Engines", 1500, "Dark Eldar — Pirates", DE.map(r => {
  const c = Object.assign({}, r);
  if(/battery/.test(String(r.name)) || /Impaler/.test(String(r.name))) c.n = 6;
  return c;
}).concat([{ sec: /^ESCORTS/, row: /^Corsair/, n: 3, name: "Corsair torpedo squadron", opts: [/— torpedoes/] }]));
fleet("Tau 1500", "1500 expansions tab: -3 Castellan -1 Warden, +2 Protector (T'olku) +1 Emissary (Dal'yth)", 1500, "Tau — Commerce Protection", TAU.map(r => {
  const c = Object.assign({}, r);
  if(/Castellan/.test(String(r.row))) c.n = 1;
  if(/Warden/.test(String(r.row))) c.n = 2;
  return c;
}).concat([
  { sec: /^Cruisers/, row: /^Protector.*T.olku/, name: "Protector #1" },
  { sec: /^Cruisers/, row: /^Protector.*T.olku/, name: "Protector #2" },
  { sec: /^Cruisers/, row: /^Emissary.*Dal.yth/, name: "Emissary" },
]));

/* ORKS ALT - DA SLOW N FURIUS: a 1500 pts list of its own, not an expansion of the 1200 base.
   The hulk Warlord's Extra Power Fields +50 (Fleets p. 390): its own row
   "Extra Power Fields (Space Hulk)" and placement on the hulk (J224, J215);
   Terror #1's Warlord on the ordinary +25 row. */
fleet("Orks Da Slow 'n' Furius 1500", "ORKS ALT sheet: Hulk + 2 Terror + Rok + 5 Brutes, two Warlords (aboard the Hulk and Terror #1) with 3 re-rolls and Extra Power Fields each; aboard the Hulk they cost +50 (Fleets p. 390)", 1500, "Orks — Waaagh!", [
  { sec: /^SPACE HULKS/, row: /^Ork hulk/, name: "Ork Space Hulk" },
  { sec: /^KROOZERS/, row: /^Terror ship/, name: "Terror Ship #1", opts: [/torpedo launcha \(/, /boarding torpedoes/], ups: [[/^FLEET UPGRADES/, /^Torpedo-bommas/]] },
  { sec: /^KROOZERS/, row: /^Terror ship/, name: "Terror Ship #2", opts: [/torpedo launcha \(/, /boarding torpedoes/], ups: [[/^FLEET UPGRADES/, /^Torpedo-bommas/]] },
  { sec: /^ORK ROKS/, row: /^Rok/, name: "Rok" },
  { sec: /^ESCORTS/, row: /^Brute/, n: 5, name: "Brute Ram Ships" },
  { sec: /^WARLORD/, row: /^Ork Warlord/, name: "Warlord (Hulk)", aboard: "Ork Space Hulk", ups: [[/^WARLORD/, /^Two extra re-rolls/], [/^WARLORD/, /^Extra Power Fields \(Space Hulk\)$/]] },
  { sec: /^WARLORD/, row: /^Ork Warlord/, name: "Warlord (Terror #1)", aboard: "Terror Ship #1", ups: [[/^WARLORD/, /^Two extra re-rolls/], [/^WARLORD/, /^Extra Power Fields$/]] },
]);

const out = R.map(r => ({ name: r.name, note: r.note, points: r.points, expect: r.expect, doc: r.doc }));
fs.writeFileSync(path.join(__dirname, "rosters.json"), JSON.stringify(out, null, 1) + "\n", "utf8");
console.log("\nplay/rosters.json: " + out.length + " fleets");
