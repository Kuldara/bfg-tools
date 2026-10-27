/* Regression test: runs the app's own validation logic in a Node environment
   and compares the results with hand-checked lists.

   Run:  node test_validator.js
*/
const fs = require("fs");
const path = require("path");

/* ---- minimal DOM stub so the app's script agrees to run */
const el = () => ({
  textContent: "", innerHTML: "", value: "", className: "", dataset: {},
  querySelectorAll: () => [], appendChild(){}, onclick: null, onchange: null,
  oninput: null, style: {}, id: ""
});
global.document = {
  getElementById: id => id === "bfgdata"
    ? { textContent: fs.readFileSync(path.join(__dirname, "..", "..", "data", "bfg_data.json"), "utf8") }
    : el(),
  querySelector: () => el(),
  createElement: () => el(),
  head: { appendChild(){} },
  body: { appendChild(){}, removeChild(){}, dataset: {} },
};
global.window = {}; global.navigator = {};
global.localStorage = { getItem: () => null, setItem(){} };
global.alert = () => {}; global.confirm = () => false;

/* The app's modules, loaded under the stubs above (test-support.js). */
const api = require(require("path").join(__dirname, "./test-support.js")).loadApp();

const { LISTS, SHIPS } = api;
let fails = 0;
const eq = (got, want, what) => {
  const ok = got === want;
  if (!ok) fails++;
  console.log((ok ? "  PASS  " : "  FAIL  ") + what + "  ->  " + got +
              (ok ? "" : "  (expected " + want + ")"));
};

function listIndex(frag) {
  const i = LISTS.findIndex(l => l.nm.includes(frag));
  if (i < 0) throw new Error("list not found: " + frag);
  return i;
}
function findEntry(li, frag) {
  const L = LISTS[li];
  /* Exact name first: on the Slaanesh list "Wage of Sin" first matches
     as a substring the crew row "Wage of Sin: Chosen Terminators". */
  for (let s = 0; s < L.secs.length; s++)
    for (let e = 0; e < L.secs[s].ents.length; e++)
      if (L.secs[s].ents[e].l.toLowerCase() === frag.toLowerCase())
        return { s, e, en: L.secs[s].ents[e] };
  for (let s = 0; s < L.secs.length; s++)
    for (let e = 0; e < L.secs[s].ents.length; e++)
      if (L.secs[s].ents[e].l.toLowerCase().includes(frag.toLowerCase()))
        return { s, e, en: L.secs[s].ents[e] };
  throw new Error("row not found: " + frag + " on list " + L.nm);
}
function build(li, limit, picks) {
  api.S.li = li; api.S.limit = limit; api.S.units = [];
  picks.forEach(([frag, n, opts, adj]) => {
    const { s, e, en } = findEntry(li, frag);
    api.S.units.push({ s, e, ref: en.r || null, n: n || 1, opts: opts || [],
                       name: "", adj: adj || 0 });
  });
}
const failed = () => api.checks().filter(c => !c.ok);
const summary = () => failed().map(c => c.t + " (" + c.v + ")").join("; ") || "-";

console.log("=== Adeptus Mechanicus — Explorator ===============================");
const am = listIndex("Explorator");

/* Project list A: Oberon + Dictator + Gothic + Lunar + Archmagos + 3 x Cobra.
   The Dictator's plasma-boosted batteries (+10) and the Gothic's nova cannon (+20)
   are on the Explorator list's own rules page (Fleets p. 121), not in the ship
   profile's OPTIONS block -- they are given in the unit's ±pts field. Total 1225. */
build(am, 1250, [["Archmagos Explorator", 1], ["Oberon class battleship", 1],
                 ["Dictator class cruiser", 1, [], 10],
                 ["Gothic class cruiser", 1, [], 20],
                 ["Lunar class cruiser", 1], ["Cobra Class Destroyer", 3]]);
eq(api.total(), 1225, "list A total points");
eq(summary(), "-", "list A is legal");

/* The same without the third cruiser: the battleship becomes illegal */
build(am, 1250, [["Archmagos Explorator", 1], ["Oberon class battleship", 1],
                 ["Dictator class cruiser", 1], ["Gothic class cruiser", 1],
                 ["Cobra Class Destroyer", 3]]);
eq(failed().some(c => /battleship/i.test(c.s)), true,
   "two cruisers -> the battleship ratio fails");

/* At 1000 points the Oberon does not fit at all: 370+215+215+235+50 = 1085 */
build(am, 1000, [["Archmagos Explorator", 1], ["Oberon class battleship", 1],
                 ["Gothic class cruiser", 1], ["Lunar class cruiser", 1],
                 ["Tyrant class cruiser", 1]]);
eq(api.total() > 1000, true, "the Oberon list exceeds 1000 pts (" + api.total() + ")");

/* The Archmagos is required from 1000 points */
/* T24 (user 11.9.2026): the fleet's own points, not the points limit: 215+215+220+370 = 1020 */
build(am, 1100, [["Gothic class cruiser", 1], ["Lunar class cruiser", 1],
                 ["Tyrant class cruiser", 1], ["Oberon class battleship", 1]]);
eq(api.total() >= 1000, true, "the Archmagos test fleet is at least 1000 pts (" + api.total() + ")");
eq(failed().some(c => /Archmagos/i.test(c.t)), true, "1000 pts without an Archmagos fails");
build(am, 900, [["Gothic class cruiser", 1], ["Lunar class cruiser", 1]]);
eq(failed().some(c => /Archmagos/i.test(c.t)), false, "900 pts does not need an Archmagos");

/* Escort squadron size 2-6. The list: "in squadrons of 2-6 unless specified
   (see pg 13)"; p.13: "A single escort may be taken in a fleet as long as
   there are no other escorts in the fleet" (J42: the earlier expectation skipped it). */
build(am, 1000, [["Cobra Class Destroyer", 1]]);
eq(failed().some(c => /squadron/i.test(c.s)), false, "a single escort alone is fine");
build(am, 1000, [["Cobra Class Destroyer", 1], ["Cobra Class Destroyer", 6]]);
eq(failed().some(c => /squadron/i.test(c.s)), true, "a one-ship squadron fails when the other squadrons are full");
build(am, 1000, [["Cobra Class Destroyer", 7]]);
eq(failed().some(c => /squadron/i.test(c.s)), true, "a seven-ship squadron fails");
build(am, 1000, [["Cobra Class Destroyer", 6]]);
eq(failed().some(c => /squadron/i.test(c.s)), false, "a six-ship squadron is fine");

console.log("\n=== Orks — Waaagh! ===============================================");
const ok_ = listIndex("Waaagh");

/* Project list A: Deathdeala + Bommaboss + Butcher + Gutstabba
   + 4 Brute + 3 Onslaught + 3 Ravager + Warlord + Mega-armoured */
build(ok_, 1250, [["Ork Warlord", 1], ["Mega-armoured", 1], ["Dethdeala", 1],
                  ["Terror ship", 1], ["Kill kroozer", 1],
                  ["Brute ramship", 4], ["Onslaught attack ship", 3],
                  ["Ravager attack ship", 3]]);
console.log("  ork list A points:", api.total(), " problems:", summary());
eq(failed().length, 0, "ork list A is legal");

/* Two heavies need four kroozers */
build(ok_, 1500, [["Ork Warlord", 1], ["Dethdeala", 1],
                  ["Hammer class battlekroozer", 1], ["Terror ship", 1],
                  ["Kill kroozer", 1], ["Brute ramship", 3]]);
eq(failed().some(c => /for every two kroozers/i.test(c.s)), true,
   "two heavies + two kroozers fails");
build(ok_, 1500, [["Ork Warlord", 1], ["Dethdeala", 1],
                  ["Hammer class battlekroozer", 1], ["Terror ship", 1],
                  ["Kill kroozer", 1], ["Kill kroozer", 1], ["Terror ship", 1],
                  ["Brute ramship", 3]]);
eq(failed().some(c => /for every two kroozers/i.test(c.s)), false,
   "two heavies + four kroozers is fine");

/* At most six kroozers */
build(ok_, 3000, [["Ork Warlord", 1], ["Terror ship", 1], ["Terror ship", 1],
                  ["Kill kroozer", 1], ["Kill kroozer", 1], ["Kill kroozer", 1],
                  ["Kill kroozer", 1], ["Kill kroozer", 1]]);
eq(failed().some(c => /up to six kroozers/i.test(c.s)), true, "seven kroozers fails");

/* Warlord: required from 500 pts, at most one per 500 pts */
/* T24: the fleet's own points 185+3*155 = 650 */
build(ok_, 700, [["Terror ship", 1], ["Kill kroozer", 1], ["Kill kroozer", 1], ["Kill kroozer", 1]]);
eq(api.total() >= 500, true, "the Warlord test fleet is at least 500 pts (" + api.total() + ")");
eq(failed().some(c => /WARLORD/i.test(c.t)), true, "500 pts without a warlord fails");
build(ok_, 1000, [["Ork Warlord", 1], ["Ork Warlord", 1], ["Ork Warlord", 1],
                  ["Terror ship", 1], ["Kill kroozer", 1]]);
eq(failed().some(c => /per 500 points/i.test(c.s)), true,
   "three warlords in a 460 pt fleet fails");
/* T26 (14.9.2026): the allowance is counted from the fleet's own points, so three
   Warlords need more than 1000 pts of ships (120+370+620 = 1110). */
build(ok_, 2000, [["Ork Warlord", 1], ["Ork Warlord", 1], ["Ork Warlord", 1],
                  ["Terror ship", 1], ["Terror ship", 1], ["Kill kroozer", 1],
                  ["Kill kroozer", 1], ["Kill kroozer", 1], ["Kill kroozer", 1]]);
eq(api.total() > 1000, true, "T26: the Waaagh fleet is over 1000 pts (" + api.total() + ")");
eq(failed().some(c => /per 500 points/i.test(c.s)), false,
   "three warlords in a fleet over 1000 pts is fine");

/* An escort's profile option is priced per ship, not once per squadron.
   Grunt: 2 x 30 + 2 x Klaws 5 = 70. */
const clans = listIndex("Da Ork Clanz");
build(clans, 1000, [["Grunt assault ship", 2, [0]]]);
eq(api.total(), 70, "an escort option's price is multiplied by the squadron size");

console.log("\n=== Imperial Navy — Gothic Sector ================================");
const gs = listIndex("Gothic Sector");
/* the 0-12 Cruisers heading limit */
build(gs, 4000, [["Lunar class cruiser", 1]]);
const many = [];
for (let i = 0; i < 13; i++) many.push(["Lunar class cruiser", 1]);
build(gs, 6000, many);
eq(failed().some(c => /Cruisers/i.test(c.t)), true, "13 cruisers exceed the 0-12 limit");

/* Battlecruiser ratio: 1 per 2 cruisers */
build(gs, 4000, [["Mars class battlecruiser", 1], ["Lunar class cruiser", 1]]);
eq(failed().some(c => /battlecruiser/i.test(c.s)), true,
   "battlecruiser + 1 cruiser fails");
build(gs, 4000, [["Mars class battlecruiser", 1], ["Lunar class cruiser", 1],
                 ["Gothic class cruiser", 1]]);
eq(failed().some(c => /battlecruiser/i.test(c.s)), false,
   "battlecruiser + 2 cruisers is fine");

console.log("\n=== Data integrity =============================================");
let noPts = 0, noStats = 0, refMiss = 0, ents = 0;
LISTS.forEach(L => L.secs.forEach(s => s.ents.forEach(e => {
  ents++;
  if (e.p == null) noPts++;
  if (e.r && !SHIPS[String(e.r)]) refMiss++;
})));
/* A missing armament is a defect, with one named exception: the Fire Ship,
   Fleets p.516. The book prints a type row for it (Escort/1, 15 cm, 45 degrees,
   1, 5+, 1) and a SPECIAL block but NO ARMAMENT table - "The controlling
   player can detonate a fire ship at any point in its movement phase": the ship
   itself is the weapon. The exception is tied to the page and the rule card (rc);
   stats are required for it as well. */
const noArmamentByBook = s => s.pg === 516 && !!s.rc && /^FIRE SHIP$/.test(String(s.nm || ""));
Object.values(SHIPS).forEach(s => { if (!s.sp || !s.ar || (!s.aw.length && !noArmamentByBook(s))) noStats++; });
console.log("  list rows:", ents, " without a price:", noPts, " broken page reference:", refMiss);
console.log("  ships:", Object.keys(SHIPS).length, " incomplete stats:", noStats);
eq(refMiss, 0, "no broken page reference remains");
eq(noStats, 0, "every ship has stats and armament");

/* Cross-check of page references: the book has wrong references, and they are
   either corrected by name or flagged. The marker is the e.rf flag, not a note
   text: book errors are not reported to the player, so the text cannot be
   trusted as a measure. */
let fixed = 0, flagged = 0;
LISTS.forEach(L => L.secs.forEach(s => s.ents.forEach(e => {
  if (e.rf || e.badref) (e.badref ? flagged++ : fixed++);
})));
console.log("  page reference corrected:", fixed, " flagged as suspicious:", flagged);
eq(fixed >= 30, true, "wrong page references corrected by name (" + fixed + " rows)");
eq(flagged, 0, "the book's known page reference errors are corrected explicitly");

/* These rows are on page 145 of the book, i.e. in the Grey Knights list. They
   used to sit under the Inquisition because Grey Knights had been merged
   into it; the lists were separated on 7.9.2026 by the book's own heading. */
const gk = listIndex("Grey Knights");
eq(findEntry(gk, "Rapid strike vessel (Sword)").en.r, 82,
   "Grey Knights Sword corrected to page 82");
eq(findEntry(gk, "Rapid strike vessel (Cobra)").en.r, 84,
   "Grey Knights Cobra corrected to page 84");
const iyanden = listIndex("Iyanden Craftworld");
const aspect = findEntry(iyanden, "Aspect Warrior Host").en;
eq(!aspect.r && aspect.u === 1, true,
   "Aspect Warrior Host is handled as an upgrade row, not a ship profile");
eq((SHIPS["184"].sr + SHIPS["192"].op).includes("[???]"), false,
   "Rogue Trader Xenotech cross-references corrected to page 175");
eq(SHIPS["352"].aw.length, 5,
   "the Torture profile has the base weapon and all four optional weapons");
eq(SHIPS["481"].aw.some(a => /ion cannon/i.test(a[0])), true,
   "the Waystation's last Ion Cannon row does not disappear");
eq(SHIPS["330"].ol.length, 5,
   "the Dragonship's prow/keel choices are tickable options");
eq(Object.keys(SHIPS).filter(k => /^458|^460|^462|^470|^472/.test(k)).length, 11,
   "every Tau configuration is a separate profile");

const hive = listIndex("Tyranids — Hive Fleet");
const he = findEntry(hive, "Hive Ship");
api.S.li = hive;
const hu = {s:he.s,e:he.e,ref:he.en.r,n:1,opts:[],os:{},name:""};
api.S.units = [hu];
eq(SHIPS[String(hu.ref)].ol.length, 16,
   "the Hive Ship's semicolon choices are split into 16 correctly priced choices");
api.setOptState(hu, 0, "take");
api.setOptState(hu, 1, "take");
eq(api.optState(hu, 0) === "opt" && api.optState(hu, 1) === "take", true,
   "a Choose one group allows only one choice");
eq(api.unitPts(hu), he.en.p + 15,
   "the price of the Hive Ship's chosen Feeder/claws option is counted correctly");

/* A known error in the Chaos lists: 'Chaos battle barge (pg. 266)' pointed
   to the Despoiler and 'Styx (pg. 268)' to the Retaliator. */
const chaos = listIndex("Chaos - Incursion".replace(" - ", " — "));
const bb = findEntry(chaos, "Chaos battle barge");
eq(SHIPS[String(bb.en.r)].nm, "CHAOS BATTLE BARGE", "Chaos battle barge points to the right ship");
const styx = findEntry(chaos, "Styx class heavy cruiser");
eq(SHIPS[String(styx.en.r)].nm, "STYX CLASS HEAVY CRUISER", "Styx points to the right ship");

/* ================================ disappearances found in the QA run ======= */
/* This file only has eq(); a separate helper for boolean checks. */
const ok = (cond, what) => eq(!!cond, true, what);

/* A price in words dropped a list row: the book writes
   "(0-1) Venerable battle barge (pg. 102)............varies" without the
   "pts" suffix, and the extractor's price pattern required it.

   The previous version of this test claimed that the row POINTS TO the Seditio
   Opprimere - it locked in an assumption of the implementation, not a rule of the book
   (AGENTS.md §5). Fleets p.102: the venerable battle barge is a CHOICE OF BASE
   HULL "from any available Imperial or Chaos battleship, grand cruiser,
   battlecruiser or heavy cruiser at the listed cost, plus an additional
   +35 points". The Seditio is the book's own example and the default hull, not the only one. */
["Codex Astartes", "Crusade", "Dominion"].forEach(nm => {
  const li = listIndex("Space Marines — " + nm);
  const v = findEntry(li, "Venerable battle barge");
  eq(v.en.hc, 1, nm + ": the venerable battle barge is a hull choice (hc)");
  eq(v.en.hcp, 35, nm + ": Space Marine crew +35 (p.102)");
  eq(v.en.p, null, nm + ": the list price is open as in the book (varies)");
  eq(String(v.en.r), "103", nm + ": the default hull is the Seditio Opprimere (p.103)");
  const hulls = (v.en.hulls || []).map(String);
  eq(hulls.includes("103"), true, nm + ": the Seditio is an option");
  eq(hulls.includes("61"), true, nm + ": an Imperial battlecruiser (Mars) is fine");
  eq(hulls.includes("267"), true, nm + ": a Chaos battleship (Desolator) is fine");
  eq(hulls.includes("104"), false, nm + ": the Space Marine Battle Barge is not an Imperial/Chaos hull");
  eq(hulls.includes("258"), false, nm + ": a named unique ship is not a hull");
  eq(hulls.includes("68"), false, nm + ": an ordinary cruiser (Dominator) is not allowed");
});

/* The price had stayed in the ship's name: the PDF prints it on the same line
   separated by a tab, and the card title read "... 450 Pts". */
["103", "258", "260", "476"].forEach(pg => {
  const sh = SHIPS[pg];
  ok(sh, "profile " + pg + " exists");
  ok(sh && !/\t/.test(sh.nm), "profile " + pg + " has no tab in its name");
  ok(sh && !/\bPTS\b/i.test(sh.nm), "profile " + pg + " has no price in its name");
});
eq(SHIPS["103"].bp, 450, "the Seditio Opprimere base price was read from the heading row");

/* Three Xenos variants could not be had from anywhere. */
const rt = listIndex("Rogue Traders");
[["Pthuxutl", "PTHUXUTL WAR CRUISER"],
 ["Nekulli", "NEKULLI WHIP"],
 ["Fra", "FRA\u2019AL RAIDER"]].forEach(([frag, want]) => {
  const e = findEntry(rt, "Xenos Vessel - " + frag);
  eq(SHIPS[String(e.en.r)].nm, want, frag + ": the variant can be chosen");
  eq(e.en.p, 50, frag + ": costs the same 50 points as the generic one");
});

/* The Chaos lists pointed the Vengeance cruiser to the Imperial Navy
   printing, so the card showed the wrong faction and the wrong page. */
["Black Crusade", "Tzeentch", "Nurgle", "Khorne", "Slaanesh"].forEach(nm => {
  const li = listIndex("Chaos — " + nm);
  const v = findEntry(li, "Vengeance class grand cruiser");
  eq(SHIPS[String(v.en.r)].fl, "CHAOS", nm + ": Vengeance on Chaos-painos");
});
eq(SHIPS[String(findEntry(listIndex("Imperial Navy — Bastion"),
   "Vengeance class grand cruiser").en.r)].fl, "IMPERIAL NAVY",
   "the Imperial Navy list keeps its own printing");

/* Every ship row on a list points to an existing profile: a row whose
   reference does not open would look buyable in the app but would
   produce no card at all. */
let danglingRefs = 0;
LISTS.forEach(L => L.secs.forEach(sec => sec.ents.forEach(e => {
  if (e.r != null && !SHIPS[String(e.r)]) danglingRefs++;
})));
eq(danglingRefs, 0, "no list row points to a missing profile");

/* Fleet-level spot check 10.9.2026 (report 17). Black Crusade p.234:
   "You may include Abaddon the Despoiler as the Warmaster in any Chaos
   Fleet worth more than 1,000 points." Abaddon is a Warmaster: he fills
   the required Warmaster, but not at 1 000 points nor beside a Warmaster. */
console.log("\n=== Chaos: Abaddon and named battleships ===== ======================");
const bcr = listIndex("Chaos — Black Crusade");
/* T24: "worth more than 1,000 points" = the fleet's own points
   (195+170+180+165+170+180 = 1060). */
build(bcr, 1100, [["Abaddon (Ld 10)", 1], ["Murder class cruiser", 1], ["Carnage class cruiser", 1],
                  ["Slaughter class cruiser", 1], ["Murder class cruiser", 1], ["Carnage class cruiser", 1]]);
eq(api.total() > 1000, true, "the Abaddon fleet is over 1000 pts (" + api.total() + ")");
eq(summary(), "-", "Abaddon as Warmaster in a fleet over 1 000 pts is legal");
build(bcr, 1000, [["Abaddon (Ld 10)", 1], ["Murder class cruiser", 1],
                  ["Carnage class cruiser", 1], ["Slaughter class cruiser", 1]]);
eq(failed().some(c => /Abaddon/i.test(c.t)), true, "Abaddon at 1 000 points fails ('more than 1,000')");
build(bcr, 1500, [["Abaddon (Ld 10)", 1], ["Chaos Warmaster (Ld +2)", 1],
                  ["Murder class cruiser", 1], ["Carnage class cruiser", 1]]);
eq(failed().some(c => /Abaddon/i.test(c.t + " " + c.s)), true, "Abaddon and a Warmaster together fails");
/* "A fleet 1,000 points or more may include the X as one of its
   battleships, subject to normal restrictions." (p.237, 241, 245, 249) */
[["Nurgle", "Terminus Est"], ["Slaanesh", "Wage of Sin"], ["Tzeentch", "Scion of Prospero"],
 ["Khorne", "Slaverer"]].forEach(([nm, ship]) => {
  const li = listIndex("Chaos — " + nm);
  /* T24: the fleet's own points decide - without the Slaughter under 1000 pts,
     with it at least 1000 pts. */
  const small = [["Chaos Warmaster (Ld +2)", 1], [ship, 1], ["Murder class cruiser", 1], ["Carnage class cruiser", 1]];
  const fleet = small.concat([["Slaughter class cruiser", 1]]);
  build(li, 999, small);
  eq(api.total() < 1000, true, nm + ": the small fleet is under 1000 pts (" + api.total() + ")");
  eq(failed().some(c => new RegExp(ship, "i").test(c.t) && /not allowed/.test(c.v)), true,
     nm + ": " + ship + " in a fleet under 1 000 pts fails");
  build(li, 1200, fleet);
  eq(api.total() >= 1000, true, nm + ": the fleet is at least 1000 pts (" + api.total() + ")");
  eq(failed().some(c => new RegExp(ship, "i").test(c.t)), false, nm + ": " + ship + " at 1 100 points is fine");
});

console.log("\n=== Tau Defender squadrons and Rogue Trader escorts = ============");
/* p.455: "Defenders are fielded in squadrons of 2–6 ships. They may be
   combined in squadrons with Messengers if you wish. They may not be combined
   with Orcas. Messengers operate as single ships, or in squadrons." */
["Tau — Merchant Fleet", "Tau — Commerce Protection"].forEach(nm => {
  const li = listIndex(nm);
  const sq = re => failed().some(c => re.test(c.t) && / ships$/.test(c.v));
  build(li, 1500, [["Defender class starship", 1]]);
  eq(sq(/defender/i), true, nm + ": one Defender fails");
  build(li, 1500, [["Defender class starship", 7]]);
  eq(sq(/defender/i), true, nm + ": seven Defenders fail");
  build(li, 1500, [["Defender class starship", 4]]);
  eq(sq(/defender/i), false, nm + ": four Defenders are fine");
  build(li, 1500, [["Messenger class starship", 1]]);
  eq(sq(/messenger/i), false, nm + ": a Messenger alone is fine");
});
/* p.174: "A single squadron of 2-6 Rogue Trader escorts and auxiliary vessels
   may accompany each Rogue Trader capital ship in a fleet, in any mix desired.
   Separately, it may also be accompanied by any number of cargo ships of any
   type (...), organized in squadrons of 2-6 ships, but these squadrons can
   only contain cargo ships (...)." A mixed squadron cannot be marked in the unit
   model, so the limit checked is at most six escorts per RT ship. */
const rtl = LISTS.findIndex(l => l.nm === "Rogue Traders");
const rtCap = () => failed().some(c => /escorts/i.test(c.t) && !/ ships$/.test(c.v));
build(rtl, 1000, [["Rogue Trader Cruiser", 1], ["Iconoclast", 3], ["Recommissioned", 3]]);
eq(rtCap(), false, "RT: one ship + six escorts as a mixed squadron is fine");
build(rtl, 1000, [["Rogue Trader Cruiser", 1], ["Iconoclast", 4], ["Recommissioned", 3]]);
eq(rtCap(), true, "RT: one ship + seven escorts fails");
build(rtl, 1000, [["Rogue Trader Cruiser", 1], ["Iconoclast", 6], ["Armed Cargo Vessel", 4]]);
eq(rtCap(), false, "RT: cargo ships do not belong to the escort squadron");
/* p.174: "If a fleet has more than one Rogue Trader cruiser or also includes
   more than one squadron of transports, a Veteran Rogue Trader must be
   assigned to a Rogue Trader cruiser." (spot check 18, J23). The failure must
   come from the check of this sentence, not from another row. */
const vetReq = () => failed().some(c => /Veteran Rogue Trader required/i.test(c.t));
build(rtl, 1000, [["Rogue Trader Cruiser", 1], ["Rogue Trader Cruiser", 1]]);
eq(vetReq(), true, "RT: two RT cruisers without a Veteran fails");
build(rtl, 1000, [["Rogue Trader Cruiser", 1], ["Heavy Transport", 2], ["Heavy Transport", 2]]);
eq(vetReq(), true, "RT: two transport squadrons without a Veteran fails");
build(rtl, 1000, [["Veteran Rogue Trader", 1], ["Rogue Trader Cruiser", 1], ["Rogue Trader Cruiser", 1]]);
eq(vetReq(), false, "RT: two RT cruisers with a Veteran is fine");
build(rtl, 1000, [["Rogue Trader Cruiser", 1], ["Heavy Transport", 2]]);
eq(vetReq(), false, "RT: one cruiser and one transport squadron need no Veteran");

console.log("\n=== Eldar Hero and Prince Yriel as commanders ========================");
/* p.316/317/318: "Your fleet may be led by an Eldar Hero, in place of its
   normal fleet commander." p.319: "Yriel may be taken instead of the Hero
   Fleet Commander as listed in the Corsair and Craftworld Eldar fleet lists." */
/* The failure must come from the commander limit, not another error: before
   the fix "two Heroes" only failed on the wrong "Pirate Prince missing". */
const cmdCap = () => failed().some(c => /Fleet commander/i.test(c.t));
["Eldar Corsairs — Gothic Sector", "Eldar Corsairs — Later Gothic War"].forEach(nm => {
  const li = listIndex(nm);
  build(li, 1100, [["Eldar Hero (Ld 10)", 1], ["Eclipse", 2], ["Shadow", 2]]);
  eq(summary(), "-", nm + ": an Eldar Hero leads instead of the Pirate Prince");
  build(li, 1200, [["Eldar Hero (Ld 10)", 1], ["Pirate Prince (+2 Ld)", 1], ["Eclipse", 2], ["Shadow", 2]]);
  eq(cmdCap(), true, nm + ": a Hero and a Pirate Prince together fails");
  build(li, 1200, [["Eldar Hero (Ld 10)", 2], ["Eclipse", 2], ["Shadow", 2]]);
  eq(cmdCap(), true, nm + ": two Heroes fail");
});
const iyl = listIndex("Iyanden");
build(iyl, 1000, [["Eldar Hero (Ld 10)", 1], ["Wraithship", 3]]);
eq(summary(), "-", "Iyanden: an Eldar Hero leads instead of the Autarch");
/* J215: Yriel needs a ship - "he must be placed on a Craftworld Eldar
   Dragonship with launch bays, but you may instead pick the Flame of
   Asuryan" (p.319). With Wraithships alone he has no legal place, so the
   test fleet has the Flame. */
build(iyl, 1500, [["Prince Yriel", 1], ["Flame of Asuryan", 1], ["Wraithship", 3]]);
eq(summary(), "-", "Iyanden: Prince Yriel leads");
build(iyl, 1000, [["Eldar Autarch (Ld 9)", 1], ["Eldar Hero (Ld 10)", 1], ["Wraithship", 3]]);
eq(cmdCap(), true, "Iyanden: an Autarch and a Hero together fails");
build(iyl, 1000, [["Eldar Hero (Ld 10)", 1], ["Prince Yriel", 1], ["Wraithship", 3]]);
eq(cmdCap(), true, "Iyanden: a Hero and Yriel together fails");
build(iyl, 1000, [["Prince Yriel", 2], ["Wraithship", 3]]);
eq(cmdCap(), true, "Iyanden: two Yriels fail");

console.log("\n=== Spot check 18: Chaos shares, Planet Killer, Space Hulk, Bakka reserves ===");
/* Like build, but the fifth field is the list upgrades by name. */
function buildU(li, limit, picks) {
  api.S.li = li; api.S.limit = limit; api.S.units = [];
  picks.forEach(([frag, n, opts, adj, ups]) => {
    const { s, e, en } = findEntry(li, frag);
    const u = { s, e, ref: en.r || null, n: n || 1, opts: opts || [], name: "", adj: adj || 0, ups: {} };
    (ups || []).forEach(f => { const x = findEntry(li, f); u.ups[x.s + ":" + x.e] = "take"; });
    api.S.units.push(u);
  });
}
/* J24 p.241: "Up to a third of the capital ships (not the Terminus Est or
   flagship) in a Plaguefleet may be upgraded to Daemonships"; p.245 "Up to a
   quarter of the capital ships (not battleships or the flagship) in a
   Berzerker Fleet"; p.249 "Up to half of the capital ships (not the Wage of
   Sin or the flagship) in a Pleasurefleet". */
const daemonCap = () => failed().some(c => /^Daemonships \(/.test(c.t));
const CR = ["Murder class cruiser", "Carnage class cruiser", "Slaughter class cruiser", "Inferno class cruiser"];
[["Chaos — Nurgle", 3, 1], ["Chaos — Khorne", 4, 1], ["Chaos — Slaanesh", 4, 2]].forEach(([nm, caps, allow]) => {
  const li = listIndex(nm);
  const fleet = k => [["Warmaster", 1]].concat(CR.slice(0, caps).map((c, i) =>
    i < k ? [c, 1, [], 0, ["Daemonship: Cruiser"]] : [c, 1]));
  buildU(li, 1500, fleet(allow + 1));
  eq(daemonCap(), true, nm + ": " + (allow + 1) + " Daemonships with " + caps + " large ships fails");
  buildU(li, 1500, fleet(allow));
  eq(daemonCap(), false, nm + ": " + allow + " Daemonships with " + caps + " large ships is fine");
});
/* J25 p.235: "The Planet Killer also counts as a battleship when working out
   how many heavy cruisers and cruisers the fleet requires." */
const bcl = listIndex("Black Crusade");
const bsFail = () => failed().some(c => c.t === "Battleships");
const C6 = ["Murder class cruiser", "Carnage class cruiser", "Slaughter class cruiser",
            "Inferno class cruiser", "Devastation class cruiser", "Murder class cruiser"];
const ships = list => list.map(c => [c, 1]);
build(bcl, 2500, [["Warmaster", 1], ["Planet Killer", 1], ["Despoiler class battleship", 1]].concat(ships(C6.slice(0, 3))));
eq(bsFail(), true, "Black Crusade: Planet Killer + Despoiler with three cruisers fails");
build(bcl, 3000, [["Warmaster", 1], ["Planet Killer", 1], ["Despoiler class battleship", 1]].concat(ships(C6)));
eq(bsFail(), false, "Black Crusade: Planet Killer + Despoiler with six cruisers is fine");
/* J26 p.288: "It may not be taken in a fleet that has the Planet Killer, an
   Activated Blackstone Fortress or ships that must be used as flagships such
   as the Terminus Est." "A Chaos fleet including a Space Hulk may have no
   more than two other battleships. (...) It counts as a battleship for
   purposes of taking another so in order to take a second battleship, the
   fleet must already have six cruisers and/or heavy cruisers." */
const hulkWith = () => failed().some(c => /not with the Planet Killer/.test(c.t));
const hulkBs = () => failed().some(c => /Battleships with a Chaos Space Hulk/.test(c.t));
build(bcl, 2500, [["Warmaster", 1], ["Chaos Space Hulk", 1], ["Planet Killer", 1]].concat(ships(C6.slice(0, 3))));
eq(hulkWith(), true, "Black Crusade: Space Hulk and Planet Killer together fails");
build(bcl, 1000, [["Warmaster", 1], ["Chaos Space Hulk", 1]]);
eq(bsFail() || hulkWith() || hulkBs(), false, "Black Crusade: a Space Hulk alone is fine");
build(bcl, 2500, [["Warmaster", 1], ["Chaos Space Hulk", 1], ["Despoiler class battleship", 1]].concat(ships(C6.slice(0, 3))));
eq(bsFail(), true, "Black Crusade: Space Hulk + Despoiler with three cruisers fails");
build(bcl, 3000, [["Warmaster", 1], ["Chaos Space Hulk", 1], ["Despoiler class battleship", 1]].concat(ships(C6)));
eq(bsFail(), false, "Black Crusade: Space Hulk + Despoiler with six cruisers is fine");
build(bcl, 5000, [["Warmaster", 1], ["Chaos Space Hulk", 1], ["Despoiler class battleship", 1],
                  ["Desolator class battleship", 1], ["Chaos battle barge", 1]].concat(ships(C6.concat(C6))));
eq(hulkBs(), true, "Black Crusade: Space Hulk + three other battleships fails");
const nul = listIndex("Nurgle");
build(nul, 2500, [["Warmaster", 1], ["Chaos Space Hulk", 1], ["Terminus Est", 1]].concat(ships(C6)));
eq(hulkWith(), true, "Nurgle: Space Hulk and Terminus Est together fails");
/* J27 p.49: "An Emperor class battleship can only be taken as reserves unless
   Admiral Rath leads the fleet." p.50: "Ships from any Imperial fleet list may
   be used as reserves, with one reserve cruiser, battlecruiser or grand
   cruiser for every three Bakka cruisers in the fleet, one reserve battleship
   for every three Bakka battleships in the fleet, etc." p.14: "Reserves are
   still subject to the restrictions on minimum and maximum numbers of certain
   types of vessels." */
const bkl = listIndex("Bakka");
const empRes = () => failed().some(c => /Emperor class battleship as reserve/.test(c.t));
/* Bakka's own reserve rule (p.50) was removed in 1.1 as a duplicate: the same
   1:3 ratio now comes from the book's general rule (p.14), and the row heading is
   "Reserves (cruisers)". The behaviour is the same, the name differs. */
const resCap = () => failed().some(c => /^Reserves \(cruisers\)$/.test(c.t));
const BKC = ["Lunar class cruiser", "Gothic class cruiser", "Dominator class cruiser"];
build(bkl, 1500, [["Admiral (Ld 9)", 1], ["Emperor class battleship", 1]].concat(ships(BKC)));
eq(empRes(), true, "Bakka: an Emperor without Rath and three Bakka battleships fails");
build(bkl, 2000, [["Lord Admiral Rath", 1], ["Emperor class battleship", 1]].concat(ships(BKC)));
eq(empRes(), false, "Bakka: an Emperor led by Rath is fine");
build(bkl, 5000, [["Admiral (Ld 9)", 1], ["Emperor class battleship", 1], ["Retribution class battleship", 1],
                  ["Victory class battleship", 1], ["Vanquisher class battleship", 1]]
                 .concat(ships(BKC.concat(BKC, BKC, BKC))));
eq(empRes(), false, "Bakka: an Emperor as the reserve of three Bakka battleships is fine");
build(bkl, 1000, [["Admiral (Ld 9)", 1], ["Jovian class battlecruiser", 1], ["Lunar class cruiser", 1]]);
eq(resCap(), true, "Bakka: a Jovian with one Bakka cruiser fails");
build(bkl, 1500, [["Admiral (Ld 9)", 1], ["Jovian class battlecruiser", 1]].concat(ships(BKC)));
eq(resCap(), false, "Bakka: a Jovian with three Bakka cruisers is fine");
build(bkl, 2000, [["Admiral (Ld 9)", 1], ["Jovian class battlecruiser", 1], ["Dominion class battlecruiser", 1]].concat(ships(BKC)));
eq(failed().some(c => c.t === "Battlecruisers"), true, "Bakka: the Jovian counts towards the battlecruiser ratio");
/* J28 p.151: "Up to half of the Grey Knights strike cruisers in a fleet may
   replace their launch bays with one of the refits listed below, in any mix
   desired." The third field = the ship's own options (os). */
function buildO(li, limit, picks) {
  api.S.li = li; api.S.limit = limit; api.S.units = [];
  picks.forEach(([frag, n, opts]) => {
    const { s, e, en } = findEntry(li, frag);
    const u = { s, e, ref: en.r || null, n: n || 1, opts: [], os: {}, name: "", adj: 0 };
    (opts || []).forEach(i => { u.os[i] = "take"; });
    api.S.units.push(u);
  });
}
const gkHalf = () => failed().some(c => /launch bays replaced/.test(c.t));
[["Grey Knights", "Inquisitor Lord"], ["Emperor's Inquisition", "Inquisitor Lord"]].forEach(([nm, cmd]) => {
  const li = listIndex(nm);
  buildO(li, 1500, [[cmd, 1], ["Grey Knights Strike Cruiser", 1, [0]], ["Grey Knights Strike Cruiser", 1, [1]]]);
  eq(gkHalf(), true, nm + ": two bay swaps out of two GK strike cruisers fails");
  buildO(li, 1500, [[cmd, 1], ["Grey Knights Strike Cruiser", 1, [0]], ["Grey Knights Strike Cruiser", 1]]);
  eq(gkHalf(), false, nm + ": one bay swap out of two is fine");
});
/* J30 p.178: "A human pirate fleet may have up to one cruiser for every 500
   points of ships in the fleet or portion thereof. (...) It may also include
   a single Space Marine strike cruiser!" p.179: "At least one squadron of 3-6
   escort vessels must be included for each cruiser in the fleet" and "The
   number of escort vessels that utilize ordnance or lance weaponry may not
   outnumber those that rely solely on weapon batteries." A missing row is
   recorded as a failure and does not crash the run. */
const pil = LISTS.findIndex(l => l.nm === "Rogue Traders — Pirates and Wolf Packs");
function pir(limit, picks, re, want, what) {
  try { build(pil, limit, picks); }
  catch (e) { eq("row missing: " + e.message.slice(0, 50), want, what); return; }
  eq(failed().some(c => re.test(c.t + " | " + c.v)), want, what);
}
const CAPT = ["Pirate Captain", 1];
pir(1000, [CAPT, ["Lunar class cruiser", 1], ["Murder class cruiser", 1], ["Tyrant class cruiser", 1],
           ["Sword Frigate", 3], ["Sword Frigate", 3], ["Sword Frigate", 3]],
    /^Pirate cruisers/, true, "Pirates: three cruisers at 1 000 points fails");
pir(1000, [CAPT, ["Lunar class cruiser", 1], ["Murder class cruiser", 1], ["Sword Frigate", 3], ["Iconoclast Destroyer", 3]],
    /^(Pirate cruisers|Escort squadrons per cruiser)/, false, "Pirates: two cruisers and two escort squadrons is fine");
pir(1000, [CAPT, ["Lunar class cruiser", 1], ["Murder class cruiser", 1], ["Sword Frigate", 3]],
    /^Escort squadrons per cruiser/, true, "Pirates: two cruisers and one escort squadron fails");
pir(1000, [CAPT, ["Lunar class cruiser", 1], ["Cobra Destroyer", 4], ["Sword Frigate", 3]],
    /^Escorts with ordnance or lances/, true, "Pirates: four torpedo escorts against three battery escorts fails");
pir(1000, [CAPT, ["Lunar class cruiser", 1], ["Cobra Destroyer", 3], ["Sword Frigate", 3]],
    /^Escorts with ordnance or lances/, false, "Pirates: three and three is fine");
pir(1500, [CAPT, ["Space Marine Strike Cruiser", 1], ["Space Marine Strike Cruiser", 1],
           ["Sword Frigate", 3], ["Iconoclast Destroyer", 3]],
    /strike cruiser.*2 \/ 1/i, true, "Pirates: two Space Marine strike cruisers fail");
/* J32 p.373: "However, no more than one of each of the named Ork battleships
   may be in the fleet, no more than one 'Uge ship may be taken in the fleet
   for every two kroozers, and a Space Hulk may only be taken by a fleet of no
   less than 1500 points." */
const cll = listIndex("Da Ork Clanz");
const ugeCap = () => failed().some(c => /^'Uge ships/.test(c.t));
const clHulk = () => failed().some(c => /^Space Hulk \(1,500/.test(c.t));
const TID = [["Ravager attack ship", 3], ["Grunt assault ship", 3]];
build(cll, 1000, [["Ork Warlord", 1], ["Hammer class battlekroozer", 1], ["Kill kroozer", 1]].concat(TID));
eq(ugeCap(), true, "Clanz: 'Uge ship with one kroozer fails");
build(cll, 1000, [["Ork Warlord", 1], ["Hammer class battlekroozer", 1], ["Kill kroozer", 1], ["Terror ship", 1]].concat(TID));
eq(ugeCap(), false, "Clanz: 'Uge ship with two kroozers is fine");
build(cll, 1200, [["Ork Warlord", 1], ["Ork Warlord", 1], ["Ork Warlord", 1], ["Ork hulk", 1]]);
eq(clHulk(), true, "Clanz: a Space Hulk in a 1 200 point fleet fails");
/* T24: the fleet's own points 600+185+5*155 = 1560 */
build(cll, 2000, [["Ork Warlord", 1], ["Ork Warlord", 1], ["Ork Warlord", 1], ["Ork hulk", 1], ["Terror ship", 1],
                  ["Kill kroozer", 1], ["Kill kroozer", 1], ["Kill kroozer", 1], ["Kill kroozer", 1], ["Kill kroozer", 1]]);
eq(api.total() >= 1500, true, "Clanz: the hulk fleet is at least 1500 pts (" + api.total() + ")");
eq(clHulk(), false, "Clanz: a Space Hulk in a 1 500 point fleet is fine");
/* T31 p.371 MORE GUBBINS: "The following gubbins can be taken by any number of
   capital ships in the fleet." So they do not use the Warlord's re-roll budget
   (p.370), unlike the rows of the GUBBINS list. */
const gubBudget = () => failed().some(c => /^Gubbins \(one per Warlord/.test(c.t));
buildU(cll, 1500, [["Ork Warlord", 1], ["Kill kroozer", 1, [], 0, ["Klaws", "Maniac Gunners"]]]);
eq(gubBudget(), false, "Clanz: MORE GUBBINS does not use the Warlord's budget");
buildU(cll, 1500, [["Ork Warlord", 1], ["Kill kroozer", 1, [], 0, ["Maniac Gunners", "Extra Turrets"]]]);
eq(gubBudget(), true, "Clanz: two GUBBINS rows with one re-roll fails");
/* T26 (decision 14.9.2026): allowances tied to points are counted from the fleet's
   own points, not from the game's points limit. p.372: "one Warlord for every 500
   points, or part, that the fleet is worth - no more, no less." */
build(cll, 1500, [["Ork Warlord", 1], ["Terror ship", 1], ["Kill kroozer", 1]]);
eq(api.total() < 500, true, "T26: the Clanz fleet is under 500 pts (" + api.total() + ")");
eq(failed().some(c => /^WARLORD/.test(c.t)), false, "T26: one Warlord in a fleet under 500 pts is fine");
build(cll, 1500, [["Ork Warlord", 1], ["Ork Warlord", 1], ["Terror ship", 1], ["Kill kroozer", 1]]);
eq(failed().some(c => /^WARLORD/.test(c.t)), true, "T26: two Warlords in a fleet under 500 pts fails");
/* The same applies to the tiers kind: p.457 "up to one Warsphere if the fleet is worth
   1500 points, or up to two Warspheres in games larger than that". */
const cp26 = listIndex("Commerce Protection");
build(cp26, 2000, [["Kroot Warsphere", 1], ["Protector class", 1]]);
eq(api.total() < 1500, true, "T26: the Tau fleet is under 1500 pts (" + api.total() + ")");
eq(failed().some(c => /^Kroot Warspheres/.test(c.t)), true, "T26: a Warsphere in a fleet under 1500 pts fails");
/* Counterpart: points_share reads "the fleet's points allowance" (p.431), i.e.
   the game's points limit - it does not change. */
const hf26 = listIndex("Tyranids — Hive Fleet");
buildU(hf26, 1500, [["Hive ship (Ld 8)", 1, [], 0,
                     ["Strength 4 boarding torpedo marker", "Assault boat marker", "Fighter marker"]]]);
eq(failed().some(c => /^Ordnance markers/.test(c.t)), false, "T26: Tyranid ordnance is still counted from the points limit");
/* Gravitic hook capacity (J95). p.454: "You may not have more Orcas and
   Wardens than the gravitic hook capacity of the fleet." The profile says what
   a hook carries: Explorer 3 x "Capacity: 1 Orca/Warden" (p.458). */
const hookA = () => failed().some(c => /^Gravitic hook capacity \(Orcas and Wardens\)/.test(c.t));
const hookB = () => failed().some(c => /^Gravitic hook capacity \(Dhows and Orcas\)/.test(c.t));
const tmH = listIndex("Merchant Fleet");
build(tmH, 1000, [["Explorer class starship", 1], ["Orca class gunship", 4]]);
eq(hookA(), true, "Tau: four Orcas in a fleet with three hooks fails");
build(tmH, 1000, [["Explorer class starship", 1], ["Orca class gunship", 3]]);
eq(hookA(), false, "Tau: three Orcas in a fleet with three hooks is fine");
/* p.457: "Gravitic hooks on a Custodian battleship or Emissary starship cannot
   count toward this total." In the profile they are per Warden (p.468, 472). */
build(cp26, 2000, [["Custodian class starship", 1], ["Orca class gunship", 1]]);
eq(hookB(), true, "Tau: an Orca on the Custodian's Warden hooks fails");
build(cp26, 2000, [["Custodian class starship", 1], ["Warden class gunship", 3]]);
eq(hookA(), false, "Tau: three Wardens on the Custodian's hooks is fine");
eq(hookB(), false, "Tau: Wardens do not use Dhow capacity");
/* J38 p.372: "Ork fleets always include one Warlord for every 500 points, or
   part, that the fleet is worth - no more, no less." p.370: "While there must
   be at least one Warlord for every 500 points in the fleet or portion
   thereof, not all Warlords are created equal!" */
const clWl = () => failed().some(c => c.t === "WARLORD");
/* T26: "that the fleet is worth" - the fleet's own points. The hull part is
   245+370+310+210 = 1135 pts, which needs exactly three Warlords. */
const CLBIG = [["Hammer class battlekroozer", 1], ["Terror ship", 1], ["Terror ship", 1],
               ["Kill kroozer", 1], ["Kill kroozer", 1]].concat(TID);
build(cll, 1500, [["Ork Warlord", 1]].concat(CLBIG));
eq(api.total() > 1000, true, "T26: the Clanz fleet is over 1000 pts (" + api.total() + ")");
eq(clWl(), true, "Clanz: one Warlord in a fleet over 1000 pts fails (no less)");
build(cll, 1500, [["Ork Warlord", 1], ["Ork Warlord", 1], ["Ork Warlord", 1]].concat(CLBIG));
eq(clWl(), false, "Clanz: three Warlords in a fleet over 1000 pts is fine");
build(cll, 1500, [["Ork Warlord", 1], ["Ork Warlord", 1], ["Ork Warlord", 1], ["Ork Warlord", 1], ["Kill kroozer", 1]].concat(TID));
eq(clWl(), true, "Clanz: four Warlords in a 1 500 point fleet fails (no more)");
/* J41 p.404: "A Necron fleet may purchase re-rolls, but they are purchased by
   the fleet as a whole, rather than being considered Fleet Commander
   re-rolls." "The fleet gets one re-roll and can purchase extra re-rolls at
   the cost shown." The price list is One extra re-roll or Two extra re-rolls:
   two rows bought for different units would give three, which is not sold. The
   Demiurg p.486 has the same sentence. */
const rrOnce = () => failed().some(c => /bought once for the fleet/.test(c.t));
[["Necrons — Harvest Fleet", "Cairn class tombship", "Jackal class raiders", 4],
 ["Demiurg — War Host", "Stronghold Commerce Vessel", "Bastion Commerce Vessel", 1]].forEach(([nm, a, b, nb]) => {
  const li = listIndex(nm);
  buildU(li, 3000, [[a, 1, [], 0, ["One extra re-roll"]], [b, nb, [], 0, ["Two extra re-rolls"]]]);
  eq(rrOnce(), true, nm + ": One and Two on different units fails");
  buildU(li, 3000, [[a, 1, [], 0, ["Two extra re-rolls"]], [b, nb]]);
  eq(rrOnce(), false, nm + ": Two extra re-rolls alone is fine");
});
/* J42 Fleets p.13: "The escorts in a squadron do not have to all be of the
   same class." "A single escort may be taken in a fleet as long as there are
   no other escorts in the fleet and no other restrictions due to the fleet
   list, such as a minimum of six escorts in a squadron, these restrictions
   cannot be ignored. If any more than one escort is taken in a fleet list,
   then all escorts must be formed in squadrons of at least two or whatever
   minimum is required by that particular fleet list." Armageddon p.43:
   "Space Marine vessels may not be squadroned with non-Space Marine vessels." */
const sqFail = () => failed().some(c => /^Squadrons of/.test(c.s || ""));
const bfl = listIndex("Bastion Fleets");
build(bfl, 1500, [["Admiral (Ld 9)", 1], ["Lunar class cruiser", 1], ["Cobra class destroyer", 1]]);
eq(sqFail(), false, "Bastion: a single escort alone is fine");
build(bfl, 1500, [["Admiral (Ld 9)", 1], ["Lunar class cruiser", 1], ["Firestorm class frigate", 1], ["Sword class frigate", 1]]);
eq(sqFail(), false, "Bastion: Firestorm + Sword in one squadron is fine");
build(bfl, 1500, [["Admiral (Ld 9)", 1], ["Lunar class cruiser", 1], ["Cobra class destroyer", 1], ["Sword class frigate", 3]]);
eq(sqFail(), false, "Bastion: one Cobra joins a squadron of three Swords");
build(bfl, 1500, [["Admiral (Ld 9)", 1], ["Lunar class cruiser", 1], ["Cobra class destroyer", 1], ["Sword class frigate", 6]]);
eq(sqFail(), true, "Bastion: one Cobra and a full squadron of six Swords fails");
build(pil, 1000, [CAPT, ["Lunar class cruiser", 1], ["Sword Frigate", 1]]);
eq(sqFail(), true, "Pirates: a single escort fails the list's 3-6 minimum");
const arl = listIndex("Armageddon Sector");
build(arl, 1500, [["Lunar class cruiser", 1], ["Firestorm Class Frigate", 1], ["Nova Class Frigate", 1]]);
eq(sqFail(), true, "Armageddon: a Space Marine escort and a fleet escort do not form a squadron");
/* Tau p.455: "Defenders are fielded in squadrons of 2-6 ships. They may be
   combined in squadrons with Messengers if you wish." */
["Tau — Merchant Fleet", "Tau — Commerce Protection"].forEach(nm => {
  build(listIndex(nm), 1500, [["Defender class starship", 1], ["Messenger class starship", 1]]);
  eq(failed().some(c => /defender/i.test(c.t) && / ships/.test(c.v)), false, nm + ": Defender and Messenger in one squadron is fine");
});
/* Vanguard: "Vanguard drone ships and Kraken may be deployed in squadrons of
   6 to 12 models. You may combine the two types in a single squadron if you
   wish." */
const vgl = listIndex("Vanguard Fleet");
build(vgl, 1500, [["Kraken", 3], ["Vanguard drone", 3]]);
eq(sqFail(), false, "Vanguard: three Krakens and three drone ships in one squadron is fine");
build(vgl, 1500, [["Kraken", 3]]);
eq(sqFail(), true, "Vanguard: a squadron of three Krakens alone fails");
/* J47 p.367: "An Ork fleet can include a maximum of one space hulk per 1,500
   points. So if the fleet is worth up to 1,500 points, it may include one
   Space hulk. If it is worth 1,500-3,000 points, two space hulks may be
   included, etc. Each Ork hulk must be assigned an Ork Warlord to command it." */
const wal = listIndex("Waaagh!");
const hulkWl = () => failed().some(c => /^Warlords for Ork hulks/.test(c.t));
build(wal, 3000, [["Ork Warlord", 1], ["Ork hulk", 1], ["Ork hulk", 1]]);
eq(hulkWl(), true, "Waaagh!: two hulks with one Warlord fails");
build(wal, 3000, [["Ork Warlord", 1], ["Ork Warlord", 1], ["Ork hulk", 1], ["Ork hulk", 1]]);
eq(hulkWl(), false, "Waaagh!: two hulks with two Warlords is fine");
/* Spot check 19 round 2 (M10r2, M8r2). Every sentence in full at its test. */
/* J52 p.245: "You may include up to one Space Hulk in the fleet, which must be
   the flagship if chosen. Bezerker Fleets led by a Space Hulk may have more
   than two battleships, but other restrictions remain unchanged." */
const khl = listIndex("Chaos — Khorne");
build(khl, 5000, [["Warmaster", 1], ["Chaos Space Hulk", 1], ["Despoiler class battleship", 1],
                  ["Despoiler class battleship", 1], ["Despoiler class battleship", 1]]);
eq(hulkBs(), false, "Khorne: a Space Hulk and three other battleships is fine (p.245)");
/* J55 p.456: "Your fleet may include any number of Merchant, Emissary or
   Protector class starships. It may also include up to one Hero class
   starship for every other type of capital ship in the fleet." The per-ship
   limit is common to both readings (T18). */
const cpl = listIndex("Commerce Protection");
const heroFail = () => failed().some(c => /^Hero class starships/.test(c.t));
build(cpl, 1500, [["Tau Kor'el", 1], ["Hero class starship", 1], ["Hero class starship", 1]]);
eq(heroFail(), true, "Commerce Protection: two Heroes without other capital ships fails");
build(cpl, 1500, [["Tau Kor'el", 1], ["Hero class starship", 1], ["Protector class starship", 1]]);
eq(heroFail(), false, "Commerce Protection: Hero and Protector is fine");
/* T18 (user decision 11.9.): "type" is the ship kind - configurations are the same kind. */
build(cpl, 2000, [["Tau Kor'el", 1], ["Hero class starship", 1], ["Hero class starship", 1],
                  ["Protector class starship", 1], ["Protector class starship", 1]]);
eq(heroFail(), true, "Commerce Protection: two Heroes and two Protectors (one kind) fails");
build(cpl, 2000, [["Tau Kor'el", 1], ["Hero class starship", 1], ["Hero class starship", 1],
                  ["Protector class starship", 1], ["Merchant class starship", 1]]);
eq(heroFail(), false, "Commerce Protection: two Heroes, a Protector and a Merchant (two kinds) is fine");
/* J56 p.457: "Up to one Rogue Trader cruiser and its attendant escorts may
   accompany the fleet for every 750 points of Tau ships in the fleet.
   Additionally, a single squadron of up to six Xenos escorts can be taken as
   per the Rogue Trader rules and fleet list." */
const rtEsc = () => failed().some(c => /^Rogue Trader escort squadrons/.test(c.t));
build(cpl, 2000, [["Tau Kor'el", 1], ["Protector class starship", 1], ["Xenos Vessel", 7]]);
eq(failed().some(c => /Squadrons of 2.6/.test(c.s || "") && /XENOS/i.test(c.t)), true, "Commerce Protection: a squadron of seven Xenos Vessels fails");
build(cpl, 2000, [["Tau Kor'el", 1], ["Protector class starship", 1], ["Xenos Vessel", 3], ["Iconoclast Destroyer", 3]]);
eq(rtEsc(), true, "Commerce Protection: two Rogue Trader escort squadrons without a cruiser fails");
build(cpl, 2000, [["Tau Kor'el", 1], ["Protector class starship", 1], ["Rogue Trader Cruiser", 1], ["Xenos Vessel", 3], ["Iconoclast Destroyer", 3]]);
eq(rtEsc(), false, "Commerce Protection: a cruiser and two escort squadrons is fine");
/* J57 p.487: "For every three Demiurg capital ships in the fleet, it may
   include one squadron of up to six Tau or Rogue Trader escorts." "Tau,
   Nicassar and Rogue Trader escorts may not be mixed in the same squadrons." */
const whl = listIndex("War Host");
const BCV = [["Bastion Commerce Vessel", 1], ["Bastion Commerce Vessel", 1], ["Bastion Commerce Vessel", 1]];
build(whl, 2500, BCV.concat([["Defender class starship", 7]]));
eq(failed().some(c => /Squadrons of 2.6/.test(c.s || "") && /DEFENDER/i.test(c.t)), true, "War Host: a squadron of seven Defenders fails");
build(whl, 2500, BCV.concat([["Defender class starship", 6]]));
eq(failed().some(c => /Squadrons of 2.6/.test(c.s || "") && /DEFENDER/i.test(c.t)), false, "War Host: a squadron of six Defenders is fine");
/* J61 p.177: "The fleet must include at least one squadron of escort-sized
   cargo ships of any type (whether or not the scenario requires transports),
   in a squadron of 2 to 6 ships. Any number of cargo ships beyond this number
   may be taken and organized in squadrons that only contain cargo ships." */
const exl = listIndex("Rogue Traders — Exploration");
const cargoSq = () => failed().some(c => /Squadrons of 2.6\. The fleet must include/.test(c.s || ""));
build(exl, 1500, [["Rogue Trader cruiser", 1], ["Cargo Transport", 1]]);
eq(cargoSq(), true, "Exploration: a one-ship cargo squadron fails");
build(exl, 1500, [["Rogue Trader cruiser", 1], ["Cargo Transport", 2]]);
eq(cargoSq(), false, "Exploration: a two-ship cargo squadron is fine");
/* J62 p.372: "Tiddla skwadron 3-10 Escorts, chosen from the following list in
   any mix desired". The mix is the player's: the same squadron letter makes
   two cards one tiddla, and a card without one is a tiddla by itself
   (ChatGPT audit RAW-01, 27.10.2026; J62 pooled short cards by itself, so
   the same two cards were one skwadron here and two in the Warlord's count). */
const tidSq = () => failed().some(c => /Squadrons of 3.10/.test(c.s || ""));
build(cll, 1000, [["Ork Warlord", 1], ["Ork Warlord", 1], ["Ravager attack ship", 2]]);
eq(tidSq(), true, "Clanz: a two-ship tiddla skwadron fails");
build(cll, 1000, [["Ork Warlord", 1], ["Ork Warlord", 1], ["Ravager attack ship", 2], ["Grunt assault ship", 1]]);
eq(tidSq(), true, "Clanz: two Ravagers and a Grunt on cards of their own are two short tiddlas");
api.S.units[2].sq = "A"; api.S.units[3].sq = "A";
eq(tidSq(), false, "Clanz: two Ravagers and a Grunt in one skwadron (one letter) is fine");
build(cll, 1000, [["Ork Warlord", 1], ["Ork Warlord", 1], ["Ravager attack ship", 11]]);
eq(tidSq(), true, "Clanz: an eleven-ship tiddla skwadron fails");
/* J63 p.318: "If the fleet is worth over 750 points, an Autarch must be
   included to lead it. Eldar Autarch (Ld 9) ... Iyanden Bearer of the Flame
   (Ld 10)" and "If your fleet is led by an Autarch, you may include a single
   Dragonship as his flagship which does not count against this limitation." */
const iyd = listIndex("Iyanden");
const dragFail = () => failed().some(c => /dragonship/i.test(c.t));
build(iyd, 1000, [["Iyanden Bearer of the Flame", 1], ["Dragonship", 1]]);
eq(dragFail(), false, "Iyanden: Bearer of the Flame and one Dragonship as flagship is fine");
build(iyd, 1000, [["Eldar Autarch", 1], ["Dragonship", 1], ["Dragonship", 1]]);
eq(dragFail(), true, "Iyanden: two Dragonships without Wraithships fails");
/* J64 p.431: "Up to 10 % of the fleet's points allowance may be spent on
   Ordnance markers as long as at least one hive ship is chosen." The markers
   are bought for ships, so the share is counted from the upgrades. */
const hfl = listIndex("Tyranids — Hive Fleet");
const ordFail = () => failed().some(c => /^Ordnance markers/.test(c.t));
buildU(hfl, 250, [["Hive ship", 1, [], 0, ["Strength 4 boarding torpedo marker", "Assault boat marker", "Fighter marker"]]]);
eq(ordFail(), true, "Hive Fleet: 27 points of markers in a 250 point fleet fails");
buildU(hfl, 250, [["Hive ship", 1, [], 0, ["Assault boat marker", "Fighter marker"]]]);
eq(ordFail(), false, "Hive Fleet: 15 points of markers in a 250 point fleet is fine");
/* J65 p.431: "You may include between 6 and 12 escort class ships for each
   hive ship. If no hive ships are chosen, only Kraken and Vanguard drone
   ships may be included in the fleet." */
const hiveMax = () => failed().some(c => /^Escorts per hive ship \(max\)/.test(c.t));
build(hfl, 500, [["Kraken", 2]]);
eq(hiveMax(), false, "Hive Fleet: two Krakens without a hive ship is fine");
build(hfl, 1500, [["Hive ship", 1], ["Kraken", 13]]);
eq(hiveMax(), true, "Hive Fleet: thirteen escorts with one hive ship fails");
/* J66 p.144: "If the fleet is above 750 points an Inquisitor Lord must lead
   the fleet. If an Inquisitorial Cruiser is present the Inquisitor Lord must
   be placed aboard it." One Inquisitor Lord leads the fleet (T19). */
const gkl = listIndex("Grey Knights");
const gkCmd = () => failed().some(c => /^Fleet commander \(one Inquisitor Lord\)/.test(c.t));
build(gkl, 1500, [["Inquisitor Lord (Ld 9)", 1], ["Ordo Malleus Inquisitor Lord", 1]]);
eq(gkCmd(), true, "Grey Knights: two Inquisitor Lords fail");
build(gkl, 1500, [["Ordo Malleus Inquisitor Lord", 1]]);
eq(gkCmd(), false, "Grey Knights: one Inquisitor Lord is fine");
/* Spot check 19 round 3 (M10r3). */
/* J70 p.177: "At least one Demiurg vessel of any class may be taken for every
   three Rogue Trader cruisers in the fleet." Lenient limit (T20): one at once,
   then one per three. */
const demFail = () => failed().some(c => /^Demiurg vessels/.test(c.t));
build(exl, 2000, [["Rogue Trader cruiser", 1], ["Bastion Commerce Vessel", 1], ["Bastion Commerce Vessel", 1]]);
eq(demFail(), true, "Exploration: two Demiurg ships with one RT cruiser fails");
build(exl, 2000, [["Rogue Trader cruiser", 1], ["Bastion Commerce Vessel", 1]]);
eq(demFail(), false, "Exploration: one Demiurg ship with one RT cruiser is fine");
/* J71 p.370: "A vessel or escort skwadron led by a Warlord may be given up to
   one of the following upgrades per Command re-roll the Warlord has. Each
   upgrade can only be applied once." p.372: the Warlord has one re-roll and
   may buy more. Attachment is not modelled (J8); the fleet-level sum is enforced. */
const gubFail = () => failed().some(c => /^Gubbins \(one per Warlord re-roll\)/.test(c.t));
buildU(cll, 1000, [["Ork Warlord", 1], ["Ork Warlord", 1], ["Kill kroozer", 1, [], 0, ["Soopa Boostas"]],
                   ["Kill kroozer", 1, [], 0, ["Mad Meks"]], ["Kill kroozer", 1, [], 0, ["Extra Power Fields"]]]);
eq(gubFail(), true, "Clanz: three Gubbins with two Warlords' two re-rolls fails");
buildU(cll, 1000, [["Ork Warlord", 1, [], 0, ["One extra re-roll"]], ["Ork Warlord", 1], ["Kill kroozer", 1, [], 0, ["Soopa Boostas"]],
                   ["Kill kroozer", 1, [], 0, ["Mad Meks"]], ["Kill kroozer", 1, [], 0, ["Extra Power Fields"]]]);
eq(gubFail(), false, "Clanz: three Gubbins with three re-rolls is fine");
/* J72 p.100: "Any Imperial Navy battleship, grand cruiser or battlecruiser may
   have a Space Marine Captain assigned to it." The Dominion list has no Imperial
   Navy hulls (reserves J73). */
const dml = listIndex("Space Marines — Dominion");
build(dml, 1500, [["Master of the Fleet", 1], ["Strike cruiser", 1], ["Space Marine Captain", 1]]);
eq(failed().some(c => /^Space Marine Captains/.test(c.t)), true, "Dominion: a Space Marine Captain without an Imperial Navy hull fails");
/* J77 p.145: "The vessel embarking the Inquisitor Lord or one Grey Knights
   vessel may take Grey Knight Terminators." One ship in the fleet. */
buildU(gkl, 1500, [["Ordo Malleus Inquisitor Lord", 1],
                   ["Grey Knights Strike Cruiser", 1, [], 0, ["Grey Knights Terminators"]],
                   ["Grey Knights Strike Cruiser", 1, [], 0, ["Grey Knights Terminators"]]]);
eq(failed().some(c => c.t === "Grey Knights Terminators"), true, "Grey Knights: Terminators on two ships fails");
/* J78 p.40: "As long as at least one Space Marine Battle barge is included you
   may choose a Master of the Fleet, who will always be assigned to a Battle
   barge and cannot be assigned to a non-Space Marine ship. As long as the fleet
   includes at least one Imperial capital ship it may include a fleet-admiral,
   admiral or solar admiral, who will always be assigned to an Imperial Navy
   vessel and cannot be a assigned to a Space Marine vessel." */
build(arl, 1500, [["Master of the Fleet", 1], ["Lunar class cruiser", 1]]);
eq(failed().some(c => /^Master of the Fleet needs/.test(c.t)), true, "Armageddon: a Master of the Fleet without a battle barge fails");
build(arl, 1500, [["Admiral (Ld 9)", 1], ["Space Marine Strike Cruiser", 1]]);
eq(failed().some(c => /^Admiral needs/.test(c.t)), true, "Armageddon: an admiral without an Imperial Navy capital ship fails");
build(arl, 1500, [["Admiral (Ld 9)", 1], ["Lunar class cruiser", 1]]);
eq(failed().some(c => /^Admiral needs/.test(c.t)), false, "Armageddon: an admiral and a Lunar is fine");
/* J81 p.244 (Khorne), p.240 (Nurgle): "You can only include a Chaos Warmaster
   in your fleet if it includes any capital ships." */
build(khl, 400, [["Chaos Warmaster", 1], ["Idolator", 2]]);
eq(failed().some(c => /^Chaos Warmaster needs a capital ship/.test(c.t)), true, "Khorne: a Warmaster without a capital ship fails");
build(khl, 1000, [["Chaos Warmaster", 1], ["Slaughter", 1]]);
eq(failed().some(c => /^Chaos Warmaster needs a capital ship/.test(c.t)), false, "Khorne: a Warmaster and a cruiser is fine");
build(nul, 400, [["Chaos Warmaster", 1], ["Idolator", 2]]);
eq(failed().some(c => /^Chaos Warmaster needs a capital ship/.test(c.t)), true, "Nurgle: a Warmaster without a capital ship fails");
/* J82 p.140: "The listed cost is added to that of the Inquisitor Lord, and its
   benefits apply to the ship they are embarked upon." The Ordo is an addition to
   the leading Lord: it needs the Lord, and there is one Ordo. */
const inq82 = listIndex("The Emperor's Inquisition");
build(inq82, 1000, [["Inquisitorial Cruiser", 1], ["Ordo Hereticus", 1]]);
eq(failed().some(c => /^Ordo Inquisitor needs an Inquisitor Lord/.test(c.t)), true, "Inquisition: an Ordo without an Inquisitor Lord fails");
build(inq82, 1000, [["Inquisitor Lord (Ld 9)", 1], ["Inquisitorial Cruiser", 1], ["Ordo Hereticus", 1], ["Ordo Xenos", 1]]);
eq(failed().some(c => /^Ordo affiliation/.test(c.t)), true, "Inquisition: two Ordos fail");
build(inq82, 1000, [["Inquisitor Lord (Ld 9)", 1], ["Inquisitorial Cruiser", 1], ["Ordo Hereticus", 1]]);
eq(failed().some(c => /^Ordo/.test(c.t)), false, "Inquisition: a Lord and one Ordo is fine");
/* J83 p.138: "A Space Marine fleet led by an Ordo Malleus Inquisitor including
   at least 1000 points of Inquisition vessels and Grey Knights strike cruisers
   may include a single Grey Knights battle barge." */
build(inq82, 500, [["Grey Knights Battle barge", 1]]);
eq(failed().some(c => /^Grey Knights Battle barge needs an Ordo Malleus/.test(c.t)), true, "Inquisition: a GK Battle barge without Ordo Malleus fails");
eq(failed().some(c => /^Grey Knights Battle barge \(1000 points/.test(c.t)), true, "Inquisition: a GK Battle barge without 1000 points of ships fails");
build(inq82, 2000, [["Inquisitor Lord (Ld 9)", 1], ["Ordo Malleus", 1], ["Inquisitorial Cruiser", 1], ["Inquisition Blackship", 1],
                    ["Grey Knights Strike Cruiser", 1], ["Grey Knights Strike Cruiser", 1], ["Grey Knights Strike Cruiser", 1],
                    ["Grey Knights Battle barge", 1]]);
eq(failed().some(c => /^Grey Knights Battle barge/.test(c.t)), false, "Inquisition: Ordo Malleus, 1065 pts of ships and a GK Battle barge is fine");
/* J84 p.174: "Any fleet except Necrons or Tyranids may include a single Rogue
   Trader capital ship. Tau, Demiurg and Imperial fleets may include one Rogue
   Trader cruiser for every 750 points or part thereof in their fleet." */
build(rt, 1000, [["Veteran Rogue Trader", 1], ["Rogue Trader Cruiser", 1], ["Rogue Trader Cruiser", 1], ["Rogue Trader Cruiser", 1]]);
eq(failed().some(c => /^Rogue Trader cruisers \(one per 750/.test(c.t)), true, "Rogue Traders: three cruisers at 1000 points fails");
/* T26: an allowance of two cruisers needs a fleet over 750 pts (50+370+400 = 820). */
build(rt, 1000, [["Veteran Rogue Trader", 1], ["Rogue Trader Cruiser", 1], ["Rogue Trader Cruiser", 1],
                 ["Xenos Vessel", 6], ["Xenos Vessel", 2]]);
eq(api.total() > 750, true, "T26: the RT fleet is over 750 pts (" + api.total() + ")");
eq(failed().some(c => /^Rogue Trader cruisers \(one per 750/.test(c.t)), false, "Rogue Traders: two cruisers in a fleet over 750 pts is fine");
/* J88 p.236: "Any ship led by a Lord of Tzeentch (and not the Warmaster!) may
   be granted a Strand of Fortune." Attachment is not modelled (J8). */
const tzl88 = listIndex("Chaos — Tzeentch");
buildU(tzl88, 1000, [["Chaos Warmaster", 1], ["Slaughter", 1, [], 0, ["Strand of Fortune"]]]);
eq(failed().some(c => /^Strand of Fortune/.test(c.t)), true, "Tzeentch: a Strand of Fortune without a Chaos Lord fails");
buildU(tzl88, 1000, [["Chaos Warmaster", 1], ["Chaos Lord", 1], ["Slaughter", 1, [], 0, ["Strand of Fortune"]]]);
eq(failed().some(c => /^Strand of Fortune/.test(c.t)), false, "Tzeentch: a Strand of Fortune and a Chaos Lord is fine");
/* J89 p.318: "In order to take the Flame of Asuryan, an Eldar Hero must lead the
   fleet and be embarked aboard it." p.319 Yriel (Bearer of the Flame): "you may
   instead pick the Flame of Asuryan as his command ship to be embarked on." */
build(iyd, 1500, [["Eldar Autarch", 1], ["Flame of Asuryan", 1]]);
eq(failed().some(c => /^Flame of Asuryan needs/.test(c.t)), true, "Iyanden: the Flame of Asuryan led by an Autarch fails");
build(iyd, 1500, [["Eldar Hero (Ld 10)", 1], ["Flame of Asuryan", 1]]);
eq(failed().some(c => /^Flame of Asuryan needs/.test(c.t)), false, "Iyanden: the Flame of Asuryan and an Eldar Hero is fine");
build(iyd, 1500, [["Iyanden Bearer of the Flame", 1], ["Flame of Asuryan", 1]]);
eq(failed().some(c => /^Flame of Asuryan needs/.test(c.t)), false, "Iyanden: the Flame of Asuryan and Yriel is fine");
/* T24 (user decision 11.9.2026): p.35 "If the fleet is worth over 750 points
   an Admiral must be included to lead it." The fleet's worth = the points of its
   ships, not the game's points limit: an unfinished 105 pt list in a 1000 pt game
   does not yet need an admiral. */
const gs24 = listIndex("Gothic Sector");
build(gs24, 1000, [["Sword", 3]]);
eq(failed().some(c => /^Admiral \(over 750/.test(c.t)), false, "T24: a 105 pt fleet in a 1000 pt game needs no admiral");
build(gs24, 1000, [["Lunar", 1], ["Lunar", 1], ["Lunar", 1], ["Lunar", 1], ["Sword", 3]]);
eq(failed().some(c => /^Admiral \(over 750/.test(c.t)), true, "T24: an 825 pt fleet without an admiral fails");
/* The same wording in permissive limits: p.234 "A fleet of 1,000 points or more
   may include the Planet Killer." */
build(bcl, 1500, [["Chaos Warmaster", 1], ["Planet Killer", 1]]);
eq(failed().some(c => c.t === "Planet Killer"), true, "T24: a Planet Killer in a 605 pt fleet fails");
build(bcl, 1500, [["Chaos Warmaster", 1], ["Planet Killer", 1], ["Slaughter", 1], ["Slaughter", 1], ["Slaughter", 1]]);
eq(failed().some(c => c.t === "Planet Killer"), false, "T24: a Planet Killer in an 1100 pt fleet is fine");
/* T20 and T23 are open interpretations (user 11.9.): the app allows the lenient
   reading but shows a warning when the strict reading is not met. */
const openWarn = id => api.checks().some(c => c.ok && c.warn && c.t.indexOf("Open interpretation (" + id + ")") === 0);
const ex20 = listIndex("Exploration");
build(ex20, 1000, [["Rogue Trader Cruiser", 1], ["Bastion Commerce Vessel", 1]]);
eq(openWarn("T20"), true, "T20: one RT cruiser and a Demiurg -> open interpretation warning");
build(rt, 1000, [["Veteran Rogue Trader", 1], ["Rogue Trader Cruiser", 1], ["Rogue Trader Cruiser", 1],
                 ["Xenos Vessel", 6], ["Xenos Vessel", 2]]);
eq(openWarn("T23"), true, "T23: two RT cruisers -> open interpretation warning");
build(rt, 1000, [["Rogue Trader Cruiser", 1]]);
eq(openWarn("T23"), false, "T23: one RT cruiser -> no warning");
/* v1.1 gaps show in the fleet checks (user 11.9.): gravitic hook capacity
   and the Dominion's Imperial Navy reserves. */
/* J95 (14.9.): on the Tau lists the capacity is enforced, so the warning is left
   only on the War Host, whose sentence breaks off mid-way in the book (p.487). */
const tm11 = listIndex("Merchant Fleet");
build(tm11, 1000, [["Merchant class", 1]]);
eq(api.checks().some(c => c.warn && /^Gravitic hook capacity .*check by hand/.test(c.t)), false, "J95: the Tau Merchant no longer has a hook warning");
eq(api.checks().some(c => /^Gravitic hook capacity \(Orcas and Wardens\)/.test(c.t)), true, "J95: the Tau Merchant has an enforced hook capacity");
const wh11 = listIndex("Demiurg — War Host");
build(wh11, 1000, [["Bastion Commerce Vessel", 1]]);
/* J213 (user 20.10.2026 "implement all"): the number is still missing, so the War
   Host gets the Tau lists' reading as open interpretation T50 - exceeding it is
   yellow, not red (golden war-host-hook-capacity-open-reading). */
eq(api.checks().some(c => c.ok && /^Gravitic hook capacity .*open interpretation T50/.test(c.t)), true, "J213: the War Host's hook capacity is a check, open interpretation T50");
eq(api.checks().some(c => /check by hand/.test(c.t)), false, "J213: the War Host no longer has a 'check by hand' warning");
/* J106: the Dominion reserves are now in the engine (p.101), so J92's
   "not yet in the app" note was removed. In its place is the book's own
   limit: ten cruisers without reserves, twelve with them. */
const dm11 = listIndex("Dominion");
build(dm11, 1000, [["Master of the Fleet", 1]]);
eq(api.checks().some(c => /^Imperial Navy reserves/.test(c.t)), false, "J106: the Dominion reserve note is removed");
eq(api.checks().some(c => /^Cruisers$/.test(c.t) && c.v === "0 / 10"), true, "J106: the Dominion cruiser limit is 10 without reserves");

console.log("\n" + (fails ? fails + " TESTS FAILED" : "all tests passed"));
process.exit(fails ? 1 : 0);
