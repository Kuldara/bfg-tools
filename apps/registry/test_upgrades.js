/* Regression test for list upgrades and weapon swaps.

   Covers the six defects the user reported:
     A  a re-roll was counted as an admiral -> the section limit complained for nothing
     B  a re-roll must be the commander's extra purchase, choosable only once
        the commander is taken
     C  a weapon swap option shows in the armament table as both alternatives
     D  Dakka Dakka was missing entirely
     E  the ceiling price shows to support the options
     F  the Khorne Warmaster's required Mark in the price, the Lord's re-roll
        choosable

   Run:  node test_upgrades.js
*/
const fs = require("fs");
const path = require("path");

const el = () => ({
  textContent: "", innerHTML: "", value: "", className: "", dataset: {},
  querySelectorAll: () => [], appendChild(){}, onclick: null, onchange: null,
  oninput: null, style: {}, id: "", classList: { add(){}, remove(){} },
  setAttribute(){}, getAttribute: () => "", closest: () => el(),
});
global.document = {
  getElementById: id => id === "bfgdata"
    ? { textContent: fs.readFileSync(path.join(__dirname, "..", "..", "data", "bfg_data.json"), "utf8") }
    : el(),
  querySelector: () => el(),
  querySelectorAll: () => [],
  createElement: () => el(),
  head: { appendChild(){} },
  body: { appendChild(){}, removeChild(){}, dataset: {}, classList: { add(){}, remove(){} } },
};
global.window = {}; global.navigator = {};
const store = {};
global.localStorage = {
  getItem: k => (k in store ? store[k] : null),
  setItem: (k, v) => { store[k] = v; },
};
global.alert = () => {}; global.confirm = () => false;

/* The app's modules, loaded under the stubs above (test-support.js). */
const api = require(require("path").join(__dirname, "./test-support.js")).loadApp();
/* load() replaces S with a new object, so getS is exported and not S itself. */
const KEY = api.KEY;

const { LISTS, SHIPS } = api;
let fails = 0;
const eq = (got, want, what) => {
  const ok = got === want;
  if (!ok) fails++;
  console.log((ok ? "  PASS  " : "  FAIL  ") + what + "  ->  " + JSON.stringify(got) +
              (ok ? "" : "  (expected " + JSON.stringify(want) + ")"));
};
const ok = (cond, what) => eq(!!cond, true, what);

function useList(frag, limit) {
  const i = LISTS.findIndex(l => l.nm.includes(frag));
  if (i < 0) throw new Error("list not found: " + frag);
  const S = api.getS();
  S.li = i; S.limit = limit || 1500; S.units = [];
  return LISTS[i];
}
/* Find a row by name: [section index, row index] */
function findEnt(L, frag, secFrag) {
  for (let si = 0; si < L.secs.length; si++) {
    if (secFrag && !L.secs[si].t.includes(secFrag)) continue;
    for (let ei = 0; ei < L.secs[si].ents.length; ei++)
      if (L.secs[si].ents[ei].l.toLowerCase().includes(frag.toLowerCase()))
        return [si, ei];
  }
  throw new Error("row not found: " + frag + (secFrag ? " / " + secFrag : ""));
}
function add(L, frag, secFrag) {
  const [si, ei] = findEnt(L, frag, secFrag);
  api.addUnit(si, ei);
  const U = api.getS().units;
  return U[U.length - 1];
}
function chk(t) { return api.checks().find(c => c.t === t); }

/* ================================================================ A + B */
console.log("\n=== A/B  a re-roll is the commander's extra purchase, not a second admiral ===");
{
  const L = useList("Gothic Sector");
  const adm = add(L, "Admiral (Ld 9)", "Admiral");
  const [rsi, rei] = findEnt(L, "One extra re-roll", "Admiral");

  const ups = api.upgradesFor(adm);
  ok(ups.own.some(x => x[0] === rsi && x[1] === rei),
     "a re-roll is offered to the chosen admiral");
  /* 30.9.2026: an offered list row opens as Option (an empty box, no
     points), not as Hide */
  eq(api.upState(adm, rsi, rei), "opt", "a re-roll is Option at first (offered, not counted)");

  api.setUpState(adm, rsi, rei, "take");
  eq(api.unitPts(adm), 125, "admiral 100 + re-roll 25");
  eq(api.secShips(adm.s), 1, "the section counter sees one commander, not two");
  const c = chk("Admiral");
  eq(c.v, "1 / 1", "the 0-1 Admiral check shows 1/1");
  ok(c.ok, "the 0-1 Admiral check does not complain");

  /* re-rolls exclude each other: three rows cannot be taken at once */
  const [, r2] = findEnt(L, "Two extra re-rolls", "Admiral");
  api.setUpState(adm, rsi, r2, "take");
  eq(api.upState(adm, rsi, rei), "off", "the second re-roll row closes the first");
  eq(api.unitPts(adm), 175, "admiral 100 + two re-rolls 75");

  /* an upgrade must not be added as its own row */
  ok(api.isUpgradeEnt(L.secs[rsi].ents[rei]),
     "a re-roll is marked as an upgrade, not a unit");
}

/* ==================================================================== F */
console.log("\n=== F  Khorne: required Mark in the price, the Lord's re-roll choosable ===");
{
  const L = useList("Khorne");
  const wm = add(L, "Chaos Warmaster", "Chaos Warmaster of Khorne");
  const [msi, mei] = findEnt(L, "The Mark of Khorne", "Chaos Warmaster of Khorne");
  eq(api.upState(wm, msi, mei), "take", "the Mark is chosen in advance");
  eq(api.unitPts(wm), 120, "Warmaster 100 + required Mark 20");
  /* dflt not req: the row opens chosen but can be removed, because
     the god's own battle barge carries the Mark in its price already (p.264). */
  ok(L.secs[msi].ents[mei].dflt && !L.secs[msi].ents[mei].req,
     "the Mark is a default choice, not locked");

  const [rsi, rei] = findEnt(L, "One extra re-roll", "Chaos Warmaster of Khorne");
  api.setUpState(wm, rsi, rei, "take");
  eq(api.unitPts(wm), 145, "Warmaster + Mark + re-roll 25");

  const lord = add(L, "Chaos Lord (Ld +1)", "Chaos Lords");
  const [lsi, lei] = findEnt(L, "One re-roll (his own", "Chaos Lords");
  const lups = api.upgradesFor(lord);
  ok(lups.own.some(x => x[0] === lsi && x[1] === lei),
     "the Lord's +25 re-roll is choosable");
  api.setUpState(lord, lsi, lei, "take");
  eq(api.unitPts(lord), 50, "Chaos Lord 25 + re-roll 25");
  const c = chk("Chaos Lords");
  ok(!c || c.ok, "the Chaos Lords check does not complain about one lord");
}

/* ==================================================================== D */
console.log("\n=== D  Dakka Dakka is choosable ===");
{
  const L = useList("Waaagh");
  const terror = add(L, "Terror ship", "KROOZERS");
  const [dsi, dei] = findEnt(L, "Dakka Dakka: +2 turrets");
  const ups = api.upgradesFor(terror);
  ok(ups.other.some(x => x[0] === dsi && x[1] === dei),
     "Dakka Dakka is offered to the ship");
  api.setUpState(terror, dsi, dei, "take");
  eq(api.unitPts(terror), 205, "Terror ship 185 + Dakka Dakka 20");

  /* an escort's price multiplies per hull */
  const sq = add(L, "Ravager attack ship", "ESCORTS");
  sq.n = 4;
  const [esi, eei] = findEnt(L, "Dakka Dakka: +1 turret");
  api.setUpState(sq, esi, eei, "take");
  eq(api.unitPts(sq), 4 * 40 + 4 * 5, "a four-escort squadron pays for the turrets separately");
}

/* ==================================================================== C */
console.log("\n=== C  a weapon swap shows in the armament table ===");
{
  const L = useList("Waaagh");
  const terror = add(L, "Terror ship", "KROOZERS");
  const sh = SHIPS["380"];
  const swi = sh.ol.findIndex(o => o.sw);
  ok(swi >= 0, "the Terror ship's swap option is parsed");

  /* the prow slot's own group; the list rows (orbital mines, torpedo-
     bommas) now open as Option and make groups of their own elsewhere */
  const prowGroup = html => {
    const gs = html.match(/<tbody class="g">[\s\S]*?<\/tbody>/g) || [];
    return gs.filter(g => /Prow (heavy gunz|torpedo launcha)/.test(g)).join("");
  };
  api.setOptState(terror, swi, "opt");
  let h = api.cardHTML(terror, "top");
  ok(/Prow heavy gunz/.test(h), "open: the original heavy gunz shows");
  ok(/Prow torpedo launcha/.test(h), "open: the replacing torpedo launcha shows");
  eq((prowGroup(h).match(/class="rb/g) || []).length, 2,
     "open: both rows have a choice circle");
  eq((prowGroup(h).match(/class="rb on"/g) || []).length, 1,
     "open: the base row is marked as in use");
  /* every choice group on the card has exactly one marked row */
  ok((h.match(/<tbody class="g">[\s\S]*?<\/tbody>/g) || []).every(g => (g.match(/class="rb on"/g) || []).length === 1),
     "open: exactly one marked row in every group");
  ok(/<tbody class="g">/.test(h), "open: the alternatives are in the same group");

  api.setOptState(terror, swi, "take");
  h = api.cardHTML(terror, "top");
  ok(!/Prow heavy gunz/.test(h), "locked: the heavy gunz is removed");
  /* the slot has nothing left to choose: the launcha is a plain row now,
     no round box and no OR (30.9.2026) */
  ok(/Prow torpedo launcha/.test(h) && !/OR<\/i>[^<]*Prow torpedo launcha/.test(h), "locked: the torpedo launcha is an ordinary row without OR");
  ok((h.match(/<tbody class="g">[\s\S]*?<\/tbody>/g) || []).every(g => (g.match(/class="rb on"/g) || []).length === 1),
     "locked: still exactly one marked row in every group");

  api.setOptState(terror, swi, "off");
  h = api.cardHTML(terror, "top");
  ok(/Prow heavy gunz/.test(h), "hidden: only the original shows");
  ok(!/Prow torpedo launcha/.test(h), "hidden: the replacement does not show");
}

/* ==================================================================== E */
console.log("\n=== E  ceiling price ===");
{
  const L = useList("Gothic Sector");
  const lunar = add(L, "Lunar class cruiser", "Cruisers");
  eq(api.unitPts(lunar), 180, "Lunar base price");
  /* 30.9.2026: the ceiling is the dearest LEGAL combination - the nova
     (+20) closes the Power Ram (Fleets p. 32) and the special torpedoes
     (no torpedoes left), so Ram 5 + Special torpedoes 20 = 205 wins over
     nova 200; never the unreachable sum 225 */
  eq(api.unitMaxPts(lunar), 205, "ceiling = the dearest legal: Lunar 180 + Power Ram 5 + Special torpedoes 20 (nova 200 closes both)");
  ok(api.totalMax() >= api.total(), "the fleet's ceiling price is not below the sum");
  const h = api.cardHTML(lunar, "top");
  ok(/max 205/.test(h), "the ceiling price prints in the LOADOUT heading");
}

/* ============================================ search for classification errors */
console.log("\n=== Whole book: no upgrades left counted as units ===");
{
  let suspicious = 0;
  const ruleRows = {};
  LISTS.forEach(L => L.secs.forEach(sec => sec.ents.forEach(en => {
    if (en.k === "up") return;
    if (en.r) return;
    /* A row without a page reference may be a unit only if it is a
       commander: otherwise it is an extra purchase that would corrupt the section counter. */
    /* A third legal kind 8.10.2026: a planetary defence for which the book
       prints no profile at all. Fleets p.512 ORBITAL MINE and p.513 MINEFIELD
       are a price row and a SPECIAL block without a TYPE/HITS row, and the p.499
       price list sells them as rows ("Orbital mine (pg. 512) 5 pts", "0-2
       Minefields (pg. 513) 40 pts"). They are buyable units that have
       their own rule card (the row's rc) and a count (cnt), not upgrades.
       The exception is limited to exactly them: a defence section (ct "defence") AND
       a rule card - any other hull-less row is still suspect. */
    if (en.k === "unit" && sec.ct === "defence" && en.rc && en.cnt) { ruleRows[en.l] = 1; return; }
    if (en.k !== "cmd") {
      suspicious++;
      console.log("     ?  " + L.nm + " / " + sec.t + " / " + en.l);
    }
  })));
  eq(suspicious, 0, "every row without a page reference is either a commander or an upgrade");
  eq(Object.keys(ruleRows).sort().join(" | "), "Minefield | Orbital mine",
     "the hull-less defence rows are exactly Orbital mine (p.512) and Minefield (p.513)");

  let orphan = 0;
  LISTS.forEach(L => L.secs.forEach(sec => sec.ents.forEach(en => {
    if (en.k === "up" && en.at && !en.at.length) orphan++;
  })));
  eq(orphan, 0, "no upgrade has an empty target list");
}

/* ================================= G  launch bay pricing and conditions */
console.log("\n=== G  torpedo bombers cost by launch bay strength ===");
{
  const L = useList("Explorator");
  const dic = add(L, "Dictator class cruiser", "Cruisers");
  const [bsi, bei] = findEnt(L, "Torpedo bombers", "ORDNANCE");
  api.setUpState(dic, bsi, bei, "take");
  /* The Dictator has 2 + 2 launch bays, so +10 / bay = +40 */
  eq(api.unitPts(dic), 255 + 40, "Dictator 255 + torpedo bombers 4 x 10");

  const emp = add(L, "Emperor class battleship", "Battleships");
  api.setUpState(emp, bsi, bei, "take");
  eq(api.unitPts(emp), 400 + 80, "Emperor 400 + torpedo bombers 8 x 10");

  /* not offered at all to a ship without launch bays */
  const goth = add(L, "Gothic class cruiser", "Cruisers");
  const gups = api.upgradesFor(goth);
  ok(!gups.other.some(x => x[0] === bsi && x[1] === bei),
     "without launch bays torpedo bombers are not on offer");
}

console.log("\n=== G  Power Ram, Nova Cannon and plasma-boosted batteries ===");
{
  const L = useList("Explorator");
  const lun = add(L, "Lunar class cruiser", "Cruisers");
  const [psi, pei] = findEnt(L, "Imperial Power Ram", "FLEET UPGRADES");
  const [nsi, nei] = findEnt(L, "Nova Cannon instead of prow torpedoes", "FLEET UPGRADES");
  const [bsi, bei] = findEnt(L, "Plasma-boosted batteries", "FLEET UPGRADES");
  let ups = api.upgradesFor(lun);
  const hasUp = (a, b) => ups.other.concat(ups.own).some(x => x[0] === a && x[1] === b);
  ok(hasUp(psi, pei), "the Power Ram is offered to a cruiser with a 6+ prow");
  ok(!hasUp(nsi, nei), "no list Nova row for the Lunar: the same purchase is its own option (Fleets p. 71)");
  ok(hasUp(bsi, bei), "plasma-boosted batteries are offered for 30 cm batteries");

  api.setUpState(lun, bsi, bei, "take");
  eq(api.unitPts(lun), 215 + 10, "Lunar 215 + plasma-boosted 10");
  let h = api.cardHTML(lun, "top");
  /* v1.2 (J183): the card prints the range as a number in a colour frame and the unit
     in the column heading, so "45 cm" is no longer on the card as one string.
     The claim is the same: the battery's range cell reads 45 - and before the upgrade
     the Lunar has no range of 45 at all. */
  const rangeCells = html => (html.match(/<span class="rp[^"]*"[^>]*>([^<]*)<\/span>/g) || []).map(x => x.replace(/<[^>]+>/g, ""));
  api.setUpState(lun, bsi, bei, "off");
  ok(!rangeCells(api.cardHTML(lun, "top")).includes("45"), "without plasma-boosted (row hidden) the Lunar has no 45 cm range");
  api.setUpState(lun, bsi, bei, "take");
  ok(rangeCells(h).includes("45") && /Range cm/.test(h), "plasma-boosted raises the range to 45 cm on the card");

  /* the list nova for the Gothic, which has no option of its own (Fleets p. 121):
     replaces the prow torpedoes and closes the Power Ram */
  const goth = add(L, "Gothic class cruiser", "Cruisers");
  ups = api.upgradesFor(goth);
  ok(hasUp(nsi, nei), "the Nova Cannon is offered to a cruiser with prow torpedoes (Gothic)");
  const gbase = api.unitPts(goth);
  api.setUpState(goth, nsi, nei, "take");
  eq(api.unitPts(goth), gbase + 20, "Gothic + nova cannon 20");
  h = api.cardHTML(goth, "top");
  ok(/Prow nova cannon/.test(h), "the nova cannon shows in the armament table");
  ok(!/Prow torpedoes/.test(h), "the prow torpedoes go when the nova cannon is taken");
  ups = api.upgradesFor(goth);
  ok(!hasUp(psi, pei), "the Power Ram is no longer offered with the nova cannon");
  /* and the other way: a taken Power Ram closes the list nova (Fleets p. 118) */
  const goth2 = add(L, "Gothic class cruiser", "Cruisers");
  api.setUpState(goth2, psi, pei, "take");
  ups = api.upgradesFor(goth2);
  ok(!hasUp(nsi, nei), "a taken Power Ram closes the list Nova row");

  /* a light cruiser does not get a nova cannon */
  const end = add(L, "Endeavour class light cruiser", "Cruisers");
  ups = api.upgradesFor(end);
  ok(!hasUp(nsi, nei), "a light cruiser does not get a nova cannon");
  const [dsi, dei] = findEnt(L, "Dorsal lance instead of prow torpedoes", "FLEET UPGRADES");
  ok(hasUp(dsi, dei), "the Endeavour gets a free dorsal lance swap");

  /* the escorts' +1 turret only for escorts, and per hull */
  const [tsi, tei] = findEnt(L, "+1 turret (escort squadron)", "FLEET UPGRADES");
  ups = api.upgradesFor(lun);
  ok(!hasUp(tsi, tei), "a capital ship does not get the escorts' +1 turret");
  const sq = add(L, "Cobra Class Destroyer", "ESCORTS");
  sq.n = 3;
  ups = api.upgradesFor(sq);
  ok(hasUp(tsi, tei), "an escort squadron gets +1 turret");
  api.setUpState(sq, tsi, tei, "take");
  eq(api.unitPts(sq), 3 * 30 + 3 * 5, "a three-escort squadron pays for the turrets separately");
}

console.log("\n=== G  ork torpedo-bommas in all three lists ===");
{
  ["Cyclops", "Waaagh", "Da Ork Clanz"].forEach(nm => {
    const L = useList(nm);
    const [si, ei] = findEnt(L, "Torpedo-bommas", "FLEET UPGRADES");
    ok(si != null, nm + ": torpedo-bommas found");
  });
  const L = useList("Waaagh");
  const terror = add(L, "Terror ship", "KROOZERS");
  const [si, ei] = findEnt(L, "Torpedo-bommas", "FLEET UPGRADES");
  api.setUpState(terror, si, ei, "take");
  /* the book's own example: "a Terror Ship must pay +40 points" */
  eq(api.unitPts(terror), 185 + 40, "Terror Ship 185 + torpedo-bommas 40 (the book's example)");

  const hulk = add(L, "Ork hulk", "SPACE HULKS");
  api.setUpState(hulk, si, ei, "take");
  /* the book's own example: "a Space Hulk must pay +160 points" */
  eq(api.unitPts(hulk), 600 + 160, "Ork hulk 600 + torpedo-bommas 160 (the book's example)");
}

/* =========================================== an overlap does not double */
console.log("\n=== The same extra purchase does not show twice ===");
{
  const L = useList("Tyranids \u2014 Hive Fleet");
  const hive = add(L, "Hive ship", "HIVE SHIPS");
  const ups = api.upgradesFor(hive);
  const all = ups.own.concat(ups.other).map(x => x[2].l.toLowerCase());
  const sh = api.SHIPS[String(hive.ref)];
  const clash = all.filter(l =>
    (sh.ol || []).some(o => o.t.toLowerCase().includes(l)));
  eq(clash.length, 0,
     "the hive ship's bio-weapons are not offered again as list upgrades");

  /* the Torture cruiser's extra weapons are the ship's own options */
  const L2 = useList("Dark Eldar");
  const tort = add(L2, "Torture class cruiser", "Cruisers");
  const u2 = api.upgradesFor(tort);
  eq(u2.own.length, 0, "the Torture cruiser has no overlapping extra weapons left");
}

/* ====================================== menu weapon: Hide removes the row */
console.log("\n=== Hide removes a menu weapon from the armament table too ===");
{
  const L = useList("Tyranids \u2014 Hive Fleet");
  const hive = add(L, "Hive ship", "HIVE SHIPS");
  const sh = SHIPS[String(hive.ref)];

  /* The default state is "opt": every alternative shows as tickable. */
  let h = api.cardHTML(hive, "top");
  eq((h.match(/<tr class="w"/g) || []).length, sh.aw.length,
     "by default the whole menu shows");

  /* The user's case: only the launch bays on, everything else hidden. */
  sh.ol.forEach((o, i) => {
    if(!o.aws) return;
    api.setOptState(hive, i, /launch bay/i.test(o.t) ? "take" : "off");
  });
  /* "everything else hidden" includes the list's mega-spore swap, which
     now opens as Option by itself (30.9.2026) */
  L.secs.forEach((sec, si) => sec.ents.forEach((en, ei) => {
    if(en.k === "up" && /mega-spore/i.test(en.l)) api.setUpState(hive, si, ei, "off");
  }));
  h = api.cardHTML(hive, "top");
  const names = (h.match(/<td class="nm">[\s\S]*?<\/td>/g) || [])
    .map(x => x.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim())
    .filter(x => x && x !== "Armament");
  eq(names.filter(x => /pyro|tentacle|claw|bio-plasma|boarding/i.test(x)).length,
     0, "hidden weapons do not stay in the table");
  ok(names.length > 0 && names.every(x => /launch bay/i.test(x)),
     "only the launch bays are left:" + JSON.stringify(names));
  ok(/class="wb on"/.test(h), "the chosen weapon is ticked");

  /* The Option state: the row shows, but the box is empty. */
  sh.ol.forEach((o, i) => {
    if(o.aws && /pyro-acid/i.test(o.t)) api.setOptState(hive, i, "opt");
  });
  h = api.cardHTML(hive, "top");
  ok(/Pyro-acid battery/i.test(h), "Option brings the row back into view");

  /* The standard armament does not disappear: on the Kraken every row is a menu, but
     e.g. the Hammer's prow gunz is not, so it always stays. */
  const L2 = useList("Waaagh");
  const hammer = add(L2, "Hammer class battlekroozer", "BATTLESHIPS");
  const hs = SHIPS[String(hammer.ref)];
  hs.ol.forEach((o, i) => { if(o.aws) api.setOptState(hammer, i, "off"); });
  const hh = api.cardHTML(hammer, "top");
  ok(/Prow gunz battery/i.test(hh),
     "the standard armament stays even when every menu choice is hidden");
}

/* ========================================== Download for editing sheet */
console.log("\n=== Downloadable editable sheet ===");
{
  const src = api.editorScript();
  ok(/^\(function\(\)\{/.test(src.trim()),
     "the script starts with its own closure");
  ok(/\}\)\(\);\s*$/.test(src),
     "the script ends with the closure call");
  ok(src.includes("function fitCards"),
     "the fit function goes in as source code, not as a copy");
  ok(/addEventListener\("input"/.test(src),
     "an edit triggers a refit");
  ok(/insertText/.test(src), "pasted text is cleaned");
  ok(/data-act=save/.test(src), "the save button is wired");

  /* The script is assembled from strings: a broken quote or
     backslash would otherwise show only in the browser. */
  let compiled = true;
  try { new Function(src); } catch (e) { compiled = false;
    console.log("     compile error: " + e.message); }
  ok(compiled, "the assembled script compiles");

  ok(api.EDITOR_CSS.includes("@media print"),
     "the toolbar is hidden in print");
  ok(api.EDITOR_CSS.includes(".sheet{display:block}"),
     "the sheet is visible in the downloaded file");
}

/* ================================= save robustness when the data changes */
console.log("\n=== A save survives rows moving ===");
{
  const L = useList("Gothic Sector");
  const adm = add(L, "Admiral (Ld 9)", "Admiral");
  const [rsi, rei] = findEnt(L, "One extra re-roll", "Admiral");
  api.setUpState(adm, rsi, rei, "take");
  api.save();
  const saved = store[KEY];

  /* A new row at the start of a section moves every index by one. */
  L.secs[rsi].ents.unshift({ l: "Test row that shifts the indexes",
                             r: null, p: 5, a: 1, k: "up" });
  api.getS().units = [];
  store[KEY] = saved;
  api.load();

  const u2 = api.getS().units[0];
  eq(api.LISTS[api.getS().li].secs[u2.s].ents[u2.e].l, "Admiral (Ld 9)",
     "after the move the unit points to the same row");
  eq(api.unitPts(u2), 125, "the re-roll stays chosen across the move");
  L.secs[rsi].ents.shift();
}

/* ============================ one weapon cannot become two different weapons */
console.log("\n=== Overlapping swap options exclude each other ===");
{
  const L = useList("Armageddon Sector");
  const sc = add(L, "Strike Cruiser", "");
  const sh = SHIPS[String(sc.ref)];
  /* Two options point to the same armament row (launch bays). */
  const same = [];
  (sh.ol || []).forEach((o, i) => { if (o.sw && (o.sw.f || []).includes(2)) same.push(i); });
  eq(same.length, 2, "the Strike Cruiser has two options for the same weapon row");

  api.setOptState(sc, same[0], "take");
  api.setOptState(sc, same[1], "take");
  eq(api.optState(sc, same[0]), "opt",
     "taking the latter releases the former: the same weapon is not swapped twice");
  eq(api.optState(sc, same[1]), "take", "the latter stays in force");

  const h = api.cardHTML(sc, "top");
  const grp = (h.match(/<tbody class="g">[\s\S]*?<\/tbody>/g) || [])[0] || "";
  eq((grp.match(/class="rb on"/g) || []).length, 1,
     "the group has exactly one marked row");

  /* An old save may contain a conflict. Loading does NOT clean it silently
     (P1-8e, a requirement of the review): the state is kept, the resolver reports it
     as a structured issue row and the legality check shows red. */
  sc.os[same[0]] = "take";
  sc.os[same[1]] = "take";
  api.save();
  api.load();
  const u3 = api.getS().units[0];
  const both = [api.optState(u3, same[0]), api.optState(u3, same[1])]
    .filter(x => x === "take").length;
  eq(both, 2, "loading keeps the old save's state as it is");
  const R3 = api.resolveUnit(u3);
  ok(R3.issues.some(x => x.code === "option.swap_conflict" && x.severity === "error"),
     "the conflict is reported as an issue row (option.swap_conflict)");
  ok(api.checks().some(c => !c.ok && /^Unit issues/.test(c.t)),
     "the legality check shows the unit's problem");
  /* and the user's next choice cleans it up visibly */
  api.setOptState(u3, same[1], "take");
  eq(api.optState(u3, same[0]), "opt", "a new choice releases the old one (transition)");
  eq(api.resolveUnit(u3).issues.filter(x => x.severity === "error").length, 0,
     "the transition leaves the state valid");
}

/* ---- the same build, the same result regardless of the choice order ----
   A ship's own option and a list upgrade may mean the same thing.
   Then the price, armament and visibility must be the same regardless of
   which end the choice was made from. Before 8.9.2026 a hidden Power
   Ram stayed in the bill (240) and two routes to the same prow slot charged
   twice (255) and drew two Novas. */
{
  const li = api.LISTS.findIndex(L => /Adeptus Mechanicus/.test(L.nm));
  api.getS().li = li; api.getS().limit = 9999;
  const L = api.LISTS[li];
  let si = -1, ei = -1;
  L.secs.forEach((sec, i) => sec.ents.forEach((e, j) => {
    if (si < 0 && /^Lunar/i.test(e.l) && e.r) { si = i; ei = j; }
  }));
  const sh = api.SHIPS[String(L.secs[si].ents[ei].r)];
  const novaOpt = (sh.ol || []).findIndex(o => /nova cannon/i.test(o.t));
  const base = L.secs[si].ents[ei].p;
  const mk = () => {
    const u = { s: si, e: ei, ref: L.secs[si].ents[ei].r, n: 1,
                opts: [], os: {}, name: "" };
    api.getS().units = [u];
    return u;
  };
  const up = (u, re_) => {
    const g = api.upgradesFor(u);
    return g.own.concat(g.other).find(x => re_.test(x[2].l));
  };
  const takeUp = (u, re_) => {
    const x = up(u, re_);
    if (x) api.setUpState(u, x[0], x[1], "take");
    return !!x;
  };
  const novaRows = u => api.armModel(u, sh)
    .filter(r => (!r.alt || r.box === "on") && /nova/i.test(r.a[0])).length;

  const orders = [
    ["ram, then own Nova", u => { takeUp(u, /Power Ram/i);
                                    api.setOptState(u, novaOpt, "take"); }],
    ["own Nova, then ram", u => { api.setOptState(u, novaOpt, "take");
                                    takeUp(u, /Power Ram/i); }],
    ["own Nova, then the list's", u => { api.setOptState(u, novaOpt, "take");
                                       takeUp(u, /Nova Cannon/i); }],
    ["only own Nova", u => { api.setOptState(u, novaOpt, "take"); }],
  ];
  /* 30.9.2026: the list's nova row is not offered beside the Lunar's own
     nova option - it is the same purchase (noopt) - so there is one route,
     and nothing to print twice on the card */
  {
    const u = mk();
    ok(!up(u, /Nova Cannon instead/i), "the Lunar is not offered the list Nova row beside its own option");
    const alts = api.armModel(u, sh).filter(r => /nova/i.test(r.a[0])).length;
    eq(alts, 1, "one OR Prow nova cannon on the default card, not two");
  }
  orders.forEach(([nm, go]) => {
    const u = mk(); go(u);
    eq(api.unitPts(u), base + 20, "Nova " + nm + ": price");
    eq(novaRows(u), 1, "Nova " + nm + ": one active Nova");
  });
  /* the ram alone must not change */
  {
    const u = mk(); takeUp(u, /Power Ram/i);
    eq(api.unitPts(u), base + 5, "Power Ram alone: price");
    eq(novaRows(u), 0, "Power Ram alone: no Nova");
  }
}

/* ---- a paid option changes the profile, not only the price ----
   Before 8.9.2026 a ship's own options changed only the sum: the Dominator's
   cheaper armament left the batteries as they were, the Hammer's turret upgrade
   left TURRETS 2 and the Warsphere's hull changes left the HP. The card
   described a different ship from the one the player paid for. */
{
  const seen = (u, sh) => ({
    hp: api.effHits(u, sh), tu: api.effTurrets(u, sh),
    sh: api.effShieldsText(u, sh),
    /* a set effect changes a text stat (armour, turns, speed) - they
       are read from the resolver, as the surfaces do */
    st: (() => { const R = api.resolveUnit(u); return R ? [R.stats.speed, R.stats.turns, R.stats.armour].join("|") : ""; })(),
    /* The box state is part of the visible profile: an added row (add) is
       on the card already in the "opt" state as an empty box, and "take" ticks it.
       Without the state the effect would look non-existent. */
    aw: api.armModel(u, sh).filter(r => !r.alt || r.box === "on")
          .map(r => r.a.join("|") + (r.box ? "#" + r.box : "")).join(" ~ "),
  });
  /* The first row that allows the option: a list row may forbid it (optno) -
     Bastion's reserve fleet forbids the class variants (p.39, J144), so
     the Repulsive's ancient targeting is measured on a Chaos list row. */
  const place = (shipPage, o) => {
    for (let li = 0; li < api.LISTS.length; li++) {
      const L = api.LISTS[li];
      for (let si = 0; si < L.secs.length; si++)
        for (let ei = 0; ei < L.secs[si].ents.length; ei++) {
          const en = L.secs[si].ents[ei];
          if (String(en.r) !== String(shipPage)) continue;
          if (o && en.optno && new RegExp(en.optno, "i").test(String(o.t || ""))) continue;
          return { li: li, si: si, ei: ei };
        }
    }
    return null;
  };
  /* 1. a general invariant for every effect option */
  let checked = 0;
  Object.keys(api.SHIPS).forEach(pg => {
    const sh = api.SHIPS[pg];
    (sh.ol || []).forEach((o, i) => {
      if (!o.mod && !o.set && !o.swp && !o.qty && !o.add) return;
      const at = place(pg, o);
      if (!at) return;
      api.getS().li = at.li; api.getS().limit = 99999;
      /* a page key may be "472b" (a configuration of the same ship) - forced
         to a number it is NaN and the ship disappears, and then the effect looks
         non-existent */
      const u = { s: at.si, e: at.ei, ref: isNaN(+pg) ? pg : +pg, n: 1, opts: [], os: {},
                  oq: {}, name: "" };
      api.getS().units = [u];
      /* A dependent option (assault torpedoes need torpedo tubes) cannot
         be "take" without its prerequisite - setOptState drops it to the
         "opt" state. The prerequisite is taken BEFORE measuring, so that its own
         effect is not counted as this option's effect. */
      if (o.dep != null) api.setOptState(u, o.dep, "take");
      const before = JSON.stringify(seen(u, sh));
      api.setOptState(u, i, "take");
      const after = JSON.stringify(seen(u, sh));
      checked++;
      eq(after !== before, true,
         "the effect shows in the profile:" + sh.nm + " / " + o.t.slice(0, 42));
    });
  });
  eq(checked >= 7, true, "effect options tested (" + checked + ")");

  /* 2. expectations read from the book (Fleets p. 68, 374, 494) */
  const one = (pg, re_, want) => {
    const sh = api.SHIPS[String(pg)], at = place(pg);
    const i = (sh.ol || []).findIndex(o => re_.test(o.t));
    api.getS().li = at.li; api.getS().limit = 99999;
    const u = { s: at.si, e: at.ei, ref: pg, n: 1, opts: [], os: {},
                oq: {}, name: "" };
    api.getS().units = [u];
    api.setOptState(u, i, "take");
    if (want.qty) u.oq[i] = want.qty;
    Object.keys(want).forEach(k => {
      if (k === "qty") return;
      const got = k === "pts" ? api.unitPts(u)
        : k === "hp" ? api.effHits(u, sh)
        : k === "tu" ? api.effTurrets(u, sh)
        : k === "sh" ? api.effShieldsText(u, sh)
        : api.armModel(u, sh).filter(r => !r.alt || r.box === "on")
            .map(r => r.a.join("/"))[0];
      eq(got, want[k], sh.nm.slice(0, 18) + " " + k);
    });
  };
  one(68, /Originally fitted/, { pts: 185, aw: "Port weapons battery/45 cm/6/Left" });
  one(374, /upgrade its turrets/, { pts: 255, tu: "3" });
  one(494, /may add 2HP/, { pts: 165, hp: 12, aw: "Weapons battery/30 cm/14/All round" });
  one(494, /may add 2HP/, { qty: 3, pts: 205, hp: 16,
                            aw: "Weapons battery/30 cm/18/All round" });
  one(494, /may subtract 2HP/, { qty: 2, pts: 105, hp: 6,
                                 aw: "Weapons battery/30 cm/8/All round" });
  one(494, /add \+1 shield/, { pts: 155, sh: "3" });
  one(494, /extend the range/, { pts: 170,
                                 aw: "Weapons battery/45 cm/12/All round" });
}

console.log(fails ? "\n" + fails + " tests failed" : "\nall tests passed");
process.exit(fails ? 1 : 0);
