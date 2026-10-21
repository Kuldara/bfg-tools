/* node test_engine.js
 *
 * Golden cases for the boarding engine. Every case is a worked example that is
 * printed in a book, or a sentence from a book turned into an assertion.
 * If a book example is itself wrong, the case still encodes the BOOK's numbers
 * for everything that is not disputed, and the dispute is named in the case.
 */
var B = require("./src/engine.js");

var pass = 0, fail = 0, fails = [];
function eq(got, want, what) {
  var g = JSON.stringify(got), w = JSON.stringify(want);
  if (g === w) { pass++; return; }
  fail++; fails.push("  " + what + "\n      got  " + g + "\n      want " + w);
}

function ship(o) {
  return {
    name: o.name || "ship", hp: o.hp, dp: o.dp === undefined ? o.hp : o.dp,
    turrets: o.turrets || 0, type: o.type || "Cruiser", spores: !!o.spores, opts: o.opts || [],
  };
}
function side(race, ships, extra) {
  return Object.assign({ race: race, ships: ships, blast: false, orders: false }, extra || {});
}

// ---------------------------------------------------------------------------
console.log("== boarding value ==");

// REF example 1: Lunar 8 DP -> 8. Murder 6 DP + 2 turrets -> 8.
var lunar = ship({ name: "Lunar", hp: 8, dp: 8, turrets: 2 });
var murder = ship({ name: "Murder", hp: 8, dp: 6, turrets: 2 });
eq(B.boardingValue(side("imperial", [lunar]), "attacker").value, 8, "REF ex.1 Lunar attacking = 8");
eq(B.boardingValue(side("chaos", [murder]), "defender").value, 8, "REF ex.1 Murder defending = 6+2");

// REF example 2: two Strike Cruisers 6+5 -> 11. Tau Explorer 10 DP halved + 5 turrets -> 10.
var sc1 = ship({ name: "Strike Cruiser", hp: 6, dp: 6, turrets: 2 });
var sc2 = ship({ name: "Strike Cruiser", hp: 6, dp: 5, turrets: 2 });
var explorer = ship({ name: "Gal’leath", hp: 12, dp: 10, turrets: 5 });
eq(B.boardingValue(side("spacemarines", [sc1, sc2]), "attacker").value, 11, "REF ex.2 two Strike Cruisers = 11");
eq(B.boardingValue(side("tau", [explorer]), "defender").value, 10, "REF ex.2 Explorer = 10/2 + 5");

// REF example 3: Hive Ship 9 DP x2 + 4 spores -> 22. Two Kill Kroozers 5+4 -> 9
// (the sheet prints 8, but its own damage arithmetic later needs 9: 9 - 7 = 2 = 1+1).
var hive = ship({ name: "Hive Ship", hp: 10, dp: 9, turrets: 4 });
var kk1 = ship({ name: "Kill Kroozer", hp: 10, dp: 5 });
var kk2 = ship({ name: "Kill Kroozer", hp: 10, dp: 4 });
eq(B.boardingValue(side("tyranid", [hive]), "defender").value, 22, "REF ex.3 Hive Ship = 9x2 + 4 spores");
eq(B.boardingValue(side("ork", [kk1, kk2]), "attacker").value, 9, "REF ex.3 two Kill Kroozers = 5+4");

// REF example 4: Chaos Space Hulk 40 DP with Abaddon x2 + 6 turrets -> 86.
var hulk = ship({ name: "Chaos Space Hulk", hp: 40, dp: 40, turrets: 6, opts: ["abaddon"] });
eq(B.boardingValue(side("chaos", [hulk]), "defender").value, 86, "REF ex.4 Space Hulk with Abaddon = 40x2 + 6");
eq(B.boardingValue(side("imperial", [ship({ name: "Victory", hp: 12, dp: 12, turrets: 4 })]), "attacker").value,
  12, "REF ex.4 Victory = 12");

// Mark of Khorne doubles (RB p.89); Khorne + Abaddon on one hull is x4 (REF step 1).
eq(B.shipValue(ship({ hp: 8, dp: 8, opts: ["khorne"] }), side("chaos", []), "attacker").value, 16, "Mark of Khorne x2");
eq(B.shipValue(ship({ hp: 8, dp: 8, opts: ["khorne", "abaddon"] }), side("chaos", []), "attacker").value, 32, "Khorne + Abaddon = x4");
// Ork Warlord doubles, except aboard a Space Hulk (REF step 1).
eq(B.shipValue(ship({ hp: 10, dp: 10, opts: ["warlord"] }), side("ork", []), "attacker").value, 20, "Ork Warlord x2");
eq(B.shipValue(ship({ hp: 40, dp: 40, opts: ["warlord", "spacehulk"] }), side("ork", []), "attacker").value, 40, "Warlord on a Space Hulk: no doubling");
// Grunt assault ship counts as 2 HP before other modifiers (FB p.388).
eq(B.shipValue(ship({ hp: 1, dp: 1, opts: ["hp2"] }), side("ork", []), "attacker").value, 2, "Grunt assault ship counts as 2 HP");
// Kroot Warsphere x2 (REF step 1).
eq(B.shipValue(ship({ hp: 10, dp: 10 }), side("kroot", []), "attacker").value, 20, "Kroot Warsphere x2");
// Tau halving rounds up; Kor'or'vesh are exempt.
eq(B.shipValue(ship({ hp: 12, dp: 9 }), side("tau", []), "attacker").value, 5, "Tau 9 DP halved rounds up to 5");
eq(B.shipValue(ship({ hp: 12, dp: 9 }), side("tau_kororvesh", []), "attacker").value, 9, "Kor’or’vesh not halved");

console.log("== crippled and remaining turrets ==");
// RB p.65: a ship which has LOST half its damage points is crippled.
eq(B.isCrippled(ship({ hp: 8, dp: 5 })), false, "8 HP at 5 DP is not crippled");
eq(B.isCrippled(ship({ hp: 8, dp: 4 })), true, "8 HP at 4 DP is crippled");
eq(B.isCrippled(ship({ hp: 10, dp: 5 })), true, "10 HP at 5 DP is crippled (REF ex.3)");
eq(B.isCrippled(ship({ hp: 6, dp: 5 })), false, "6 HP at 5 DP is not crippled (REF ex.2)");
// Crippling halves turrets (RB p.65), and the defender adds its REMAINING turrets.
eq(B.effTurrets(ship({ hp: 8, dp: 4, turrets: 2 })), 1, "crippled 2 turrets -> 1");
eq(B.effTurrets(ship({ hp: 8, dp: 4, turrets: 3 })), 2, "crippled 3 turrets -> 2 (round up)");
eq(B.boardingValue(side("chaos", [ship({ hp: 8, dp: 4, turrets: 2 })]), "defender").value, 5,
  "crippled Murder defends with 4 + 1 turret");

// ---------------------------------------------------------------------------
console.log("== attack roll ==");

// REF example 1 in full.
var p1 = B.prepare({ att: side("imperial", [lunar]), def: side("chaos", [murder]) });
eq(p1.att.modSum, 0, "REF ex.1 Lunar has no modifiers");
eq(p1.def.mods.map(function (m) { return m.id; }), ["chaos"], "REF ex.1 Murder gets only +1 Chaos");
var s1 = B.score(p1, { att: [3], def: [4] });
eq([s1.att.total, s1.def.total], [3, 5], "REF ex.1 final scores 3 vs 5");
eq(s1.winner, "def", "REF ex.1 the Murder wins");
eq(s1.damage, 2, "REF ex.1 the Lunar takes 2 damage");
eq([s1.result.name, s1.critNeeds.win, s1.critNeeds.lose], ["Heavy Fighting", 4, 5],
  "REF ex.1 Heavy Fighting: 4+ / 5+");

// REF example 3 in full: this is the case that proves +2 is PER crippled enemy ship.
var p3 = B.prepare({ att: side("ork", [kk1, kk2]), def: side("tyranid", [hive]) });
eq(p3.def.mods.map(function (m) { return m.id + ":" + m.v; }), ["ratio2:2", "crippled:4"],
  "REF ex.3 Hive Ship: +2 ratio and +2 per crippled Kroozer");
eq(p3.att.mods.map(function (m) { return m.id + ":" + m.v; }), ["ork:1"], "REF ex.3 Kroozers: +1 Orks only");
eq(p3.def.dice, 2, "REF ex.3 Tyranids roll 2D6");
var s3 = B.score(p3, { att: [3], def: [2, 5] });
eq([s3.att.total, s3.def.total], [4, 11], "REF ex.3 final scores 4 vs 11");
eq(s3.damage, 7, "REF ex.3 the Ork player distributes 7 damage");
eq([s3.result.name, s3.critNeeds.win, s3.critNeeds.lose], ["Overwhelmed", 0, 7],
  "REF ex.3 Overwhelmed: automatic critical, none back");

// REF example 2: the sheet omits the +1 for the higher boarding value (11 vs 10).
// The rulebook (p.90) grants it, so the engine does too.
var p2 = B.prepare({
  att: side("spacemarines", [sc1, sc2]),
  def: side("tau", [explorer], { orders: true }),
});
eq(p2.att.mods.map(function (m) { return m.id + ":" + m.v; }), ["ratio1:1", "orders:1", "marines:2"],
  "REF ex.2 Strike Cruisers: +1 higher value, +1 enemy on special orders, +2 Space Marines");
var s2 = B.score(p2, { att: [4], def: [4] });
eq([s2.att.total, s2.def.total], [8, 4], "REF ex.2 scores by the rulebook (the sheet prints 7 vs 4)");
eq([s2.result.name, s2.critNeeds.win, s2.critNeeds.lose], ["Stormed", 2, 6], "REF ex.2 Stormed by the rulebook");

/* RB p.90, the only worked example printed in the core rulebook: "the Hyperion
   (remaining damage 3) is boarded by the Plagueclaw (remaining damage 6). After
   modifiers, the Plagueclaw scores a 6 while the Hyperion scores a 4. The
   Hyperion has lost by 2 so it loses 2 damage points. In addition, the result of
   Heavy Fighting means that the Hyperion will suffer a critical hit on a D6 roll
   of 4, 5 or 6. The Plagueclaw will also suffer a critical hit on a D6 roll of
   5 or 6." The Plagueclaw's +5 is +1 Chaos, +2 for twice the boarding value and
   +2 for the crippled Hyperion, so a die of 1 gives the printed 6. */
var rbPrep = B.prepare({
  att: side("chaos", [ship({ name: "Plagueclaw", hp: 8, dp: 6, turrets: 2 })]),
  def: side("imperial", [ship({ name: "Hyperion", hp: 8, dp: 3, turrets: 0 })]),
});
var rb = B.score(rbPrep, { att: [1], def: [4] });
eq([rb.att.total, rb.def.total], [6, 4], "RB p.90 example: the printed scores are 6 and 4");
eq(rb.winner, "att", "RB p.90 example: the Plagueclaw wins");
eq(rb.damage, 2, "RB p.90 example: the Hyperion loses 2 damage points");
eq(rb.result.name, "Heavy Fighting", "RB p.90 example: the result is Heavy Fighting");
eq([rb.critNeeds.win, rb.critNeeds.lose], [4, 5],
  "RB p.90 example: the Hyperion suffers a critical on 4+, the Plagueclaw on 5+");
eq(B.resultFor(2).name, "Heavy Fighting", "RB p.90 difference 2 = Heavy Fighting");
eq([B.resultFor(1).name, B.resultFor(2).name, B.resultFor(3).name, B.resultFor(4).name, B.resultFor(5).name,
B.resultFor(9).name],
  ["Stalemate", "Heavy Fighting", "Driven Back", "Stormed", "Overwhelmed", "Overwhelmed"],
  "RB p.90 results table names");
eq([B.resultFor(1).win, B.resultFor(2).win, B.resultFor(3).win, B.resultFor(4).win, B.resultFor(5).win],
  [5, 4, 3, 2, 0], "RB p.90 winner critical thresholds");
eq([B.resultFor(1).lose, B.resultFor(2).lose, B.resultFor(3).lose, B.resultFor(4).lose, B.resultFor(5).lose],
  [5, 5, 6, 6, 7], "RB p.90 loser critical thresholds");

console.log("== ratio group ==");
eq(B.ratioMod(8, 8), null, "equal values: no ratio modifier");
eq(B.ratioMod(9, 8).v, 1, "higher: +1");
eq(B.ratioMod(16, 8).v, 2, "twice: +2");
eq(B.ratioMod(22, 9).v, 2, "2.4x: still +2");
eq(B.ratioMod(24, 8).v, 3, "three times: +3");
eq(B.ratioMod(32, 8).v, 4, "four times: +4");
eq(B.ratioMod(86, 12).v, 4, "REF ex.4: mistakes have been made");
eq(B.ratioMod(7, 8), null, "lower: no modifier");

console.log("== race and crew modifiers ==");
function modIds(att, def, role) {
  var p = B.prepare({ att: att, def: def });
  return p[role].mods.map(function (m) { return m.id + ":" + m.v; });
}
var plain = side("imperial", [ship({ hp: 8, dp: 8, turrets: 2 })]);
eq(modIds(side("chaos", [ship({ hp: 8, dp: 8 })]), plain, "att"), ["chaos:1"], "+1 Chaos");
eq(modIds(side("chaos", [ship({ hp: 8, dp: 8, opts: ["csm"] })]), plain, "att"), ["csm:2"],
  "Chaos Space Marines supersede the +1 Chaos");
eq(modIds(side("ork", [ship({ hp: 8, dp: 8 })]), plain, "att"), ["ork:1"], "+1 Orks");
eq(modIds(side("ork", [ship({ hp: 8, dp: 8, opts: ["goff", "megaarmour"] })]), plain, "att"),
  ["ork:1", "megaarmour:1", "goff:1"], "Ork extras are cumulative");
eq(modIds(side("spacemarines", [ship({ hp: 6, dp: 6 })]), plain, "att"), ["marines:2"], "+2 Space Marines");
eq(modIds(side("inquisition", [ship({ hp: 6, dp: 6, opts: ["marines", "greyknights"] })]), plain, "att"),
  ["marines:2"], "Grey Knights count as Space Marines");
eq(B.prepare({
  att: side("inquisition", [ship({ hp: 6, dp: 6, opts: ["greyknights"] })]), def: plain,
}).att.reroll, true, "Grey Knights may re-roll");
eq(B.prepare({ att: side("chaos", [ship({ hp: 8, dp: 8 })]), def: side("admech", [ship({ hp: 8, dp: 8, turrets: 2 })]) }).att.reroll,
  true, "anybody attacking an Adeptus Mechanicus ship may re-roll");
eq(B.prepare({ att: side("admech", [ship({ hp: 8, dp: 8 })]), def: side("chaos", [ship({ hp: 8, dp: 8, turrets: 2 })]) }).def.reroll,
  false, "but defending against one grants nothing");

console.log("== situational modifiers ==");
var withBlast = side("imperial", [ship({ hp: 8, dp: 8, turrets: 2 })], { blast: true });
eq(modIds(side("chaos", [ship({ hp: 8, dp: 8 })]), withBlast, "att"), ["blast:1", "chaos:1"],
  "+1 when the enemy is in contact with Blast Markers");
// Tyranids gain the blast modifier but do not grant it.
var nidBlast = side("tyranid", [ship({ hp: 10, dp: 10, turrets: 4 })], { blast: true });
eq(modIds(side("imperial", [ship({ hp: 8, dp: 8 })]), nidBlast, "att").indexOf("blast:1"), -1,
  "Tyranids do not grant the Blast Marker modifier");
eq(modIds(nidBlast, withBlast, "att").indexOf("blast:1") >= 0, true, "Tyranids do gain it");
// Jovian sensor array: +2 replaces the normal +1 (FL p.63).
var jovian = side("imperial", [ship({ hp: 8, dp: 8, opts: ["orders2"] })]);
eq(modIds(jovian, side("chaos", [ship({ hp: 8, dp: 8 })], { orders: true }), "att")
  .indexOf("orders2:2") >= 0, true, "Jovian gets +2 instead of +1 against special orders");
// Endeavour class corridor bonus applies only when defending.
var endeavour = side("imperial", [ship({ name: "Endeavour", hp: 6, dp: 6, turrets: 2, opts: ["corridor"] })]);
eq(modIds(side("chaos", [ship({ hp: 8, dp: 8 })]), endeavour, "def").indexOf("corridor:1") >= 0, true,
  "Endeavour gets +1 defending");
eq(modIds(endeavour, side("chaos", [ship({ hp: 8, dp: 8, turrets: 2 })]), "att").indexOf("corridor:1"), -1,
  "Endeavour gets nothing when attacking");
// Dark Eldar tempo.
var de = side("darkeldar", [ship({ hp: 6, dp: 6 })]);
eq(B.prepare({ att: de, def: plain, round: 1 }).att.mods.some(function (m) { return m.id === "de1"; }), true,
  "Dark Eldar +1 in the first round");
eq(B.prepare({ att: de, def: plain, round: 2 }).att.mods.some(function (m) { return m.id === "de2"; }), true,
  "Dark Eldar -1 in later rounds");

console.log("== every modifier is worth what the book prints ==");
/* A mutation sweep of the suite found eight modifiers whose VALUE no test
   checked - only their id. These assert the number as well. */
function modVal(att, def, role, id){
  var mods = B.prepare({ att: att, def: def }).mods ? null : B.prepare({ att: att, def: def })[role].mods;
  for(var i=0;i<mods.length;i++) if(mods[i].id === id) return mods[i].v;
  return null;
}
var deSide = side("darkeldar", [ship({ hp: 6, dp: 6 })]);
eq(B.prepare({ att: deSide, def: plain, round: 1 }).att.mods.filter(function(m){return m.id==="de1";})[0].v,
  1, "Dark Eldar are +1 in the first round (FL p.342)");
eq(B.prepare({ att: deSide, def: plain, round: 2 }).att.mods.filter(function(m){return m.id==="de2";})[0].v,
  -1, "and -1 in every round after it");
var xenosLord = side("imperial", [ship({ hp: 8, dp: 8, opts: ["inq_xenos"] })]);
var alienDef = side("eldar", [ship({ hp: 6, dp: 6 })]);
eq(modVal(xenosLord, alienDef, "att", "inq_xenos"), 2,
  "an Ordo Xenos Inquisitor Lord is +2 against aliens (FL p.141)");
eq(modVal(alienDef, xenosLord, "att", "vs_xenos"), -1, "and those aliens take -1");
eq(modVal(side("imperial", [ship({ hp: 8, dp: 8, opts: ["inq_malleus"] })]), plain, "att", "inq_malleus"), 2,
  "an Ordo Malleus Inquisitor Lord is +2");
eq(modVal(side("imperial", [ship({ hp: 8, dp: 8, opts: ["inq_hereticus"] })]), plain, "att", "inq_hereticus"), 2,
  "an Ordo Hereticus Inquisitor Lord is +2");
eq(modVal(side("chaos", [ship({ hp: 8, dp: 8, opts: ["abaddon"] })]), plain, "att", "abaddon"), 1,
  "Abaddon adds +1 on top of his doubled boarding value");
eq(modVal(side("chaos", [ship({ hp: 12, dp: 12, opts: ["berzerkers"] })]), plain, "att", "berzerkers"), 2,
  "a Khorne Berzerker retinue is +2 (FL p.264)");
eq(modVal(side("ork", [ship({ hp: 8, dp: 8, opts: ["megaarmour"] })]), plain, "att", "megaarmour"), 1,
  "mega-armoured boarding parties are +1");
eq(modVal(side("ork", [ship({ hp: 8, dp: 8, opts: ["goff"] })]), plain, "att", "goff"), 1,
  "the Goff clan is +1 (FL p.369)");
eq(modVal(side("ork", [ship({ hp: 8, dp: 8, opts: ["clanzwarlord"] })]), plain, "att", "clanzwarlord"), 2,
  "an Ork Clanz Warlord is +2 once per game (FL p.372)");
eq(modVal(side("eldar", [ship({ hp: 6, dp: 6, opts: ["aspect"] })]), plain, "att", "aspect"), 2,
  "an Aspect Warrior Host is +2 (FL p.305)");
eq(modVal(plain, side("eldar", [ship({ hp: 6, dp: 6, opts: ["talons"] })]), "att", "talons"), -2,
  "the Talons refit is -2 on whoever boards it (FL p.309)");
eq(modVal(side("imperial", [ship({ hp: 6, dp: 6, opts: ["corridor"] })]),
  side("chaos", [ship({ hp: 8, dp: 8, turrets: 2 })]), "att", "corridor"), null,
  "the corridor bonus is defensive only");
eq(modVal(side("chaos", [ship({ hp: 8, dp: 8 })]),
  side("imperial", [ship({ hp: 6, dp: 6, turrets: 2, opts: ["corridor"] })]), "def", "corridor"), 1,
  "and it is +1 (FL p.72)");
eq(modVal(side("chaos", [ship({ hp: 8, dp: 8 })]),
  side("inquisition", [ship({ hp: 12, dp: 12, turrets: 5, opts: ["blackship"] })]), "def", "blackship"), 2,
  "a Blackship garrison is +2 when defending (FL p.148)");

console.log("== the audit's own cases ==");
/* Every finding the release audit confirmed gets an assertion, so none of them
   can come back unnoticed. */
var wards = side("inquisition", [ship({ hp: 6, dp: 6, turrets: 2, opts: ["greyknights", "marines"] })]);
var khorneShip2 = side("chaos", [ship({ hp: 8, dp: 8, opts: ["khorne"] })]);
eq(B.critBonus(khorneShip2, plain), 1, "the Mark of Khorne adds +1 to the roll to cause a critical");
eq(B.critBonus(khorneShip2, wards), 0,
  "but hexagrammic wards ignore that too, not only the doubled value (FL p.142)");
eq(B.shipValue(ship({ hp: 40, dp: 40, opts: ["spacehulk", "khorne"] }), side("chaos", []), "defender").value,
  40, "a space hulk may take no Chaos Mark, so the Mark of Khorne does not double it (FL p.288)");
eq(B.shipValue(ship({ hp: 40, dp: 40, opts: ["spacehulk", "warlord"] }), side("ork", []), "defender").value,
  40, "and an Ork Warlord aboard does not double it either (FL p.390)");
eq(B.sideIsAlien(side("roguetrader", [ship({ hp: 10, dp: 10, opts: ["alien"] })])), true,
  "a xenos hull in a Rogue Trader fleet is an alien vessel (FL p.141)");
eq(B.sideIsAlien(side("roguetrader", [ship({ hp: 8, dp: 8 })])), false,
  "an Imperial hull in the same fleet is not");
eq(B.prepare({ att: plain, def: side("imperial", [ship({ hp: 8, dp: 8, turrets: 2, opts: ["admech"] })]) }).att.reroll,
  true, "any hull may be a Mechanicus vessel, and its boarder re-rolls (FL p.118)");
eq(B.boardingValue(side("imperial", [{ name: "Ramilies", hp: 12, dp: 12, turrets: 4, extraHp: 36, opts: ["fortress"] }]),
  "defender").value, 52,
  "a star fort defends with all four quadrants' hit points plus the boarded quadrant's turrets (FL p.502)");
eq(B.effTurrets({ hp: 12, dp: 12, turrets: 4, extraHp: 36, opts: ["fortress"] }), 4,
  "the other quadrants add hit points only, never turrets");
eq(!!B.CRIT_TABLES.orkhulk.note, true, "the hulk tables carry their own footnote");
eq(B.critLookup(1, "orkhulk").note.indexOf("next higher level") > 0, true,
  "and it reaches every row, not just one (FL p.391)");
eq(B.extraCritRolls(side("chaos", [ship({ hp: 8, dp: 8, opts: ["berzerkerfleet"] })])), false,
  "the Berzerker Tide needs a Mark of Khorne ship");

console.log("== eligibility ==");
var nurgle = side("chaos", [ship({ name: "Plague hulk", hp: 8, dp: 8, turrets: 2, opts: ["nurgle"] })]);
eq(B.eligibility(plain, nurgle)[0].level, "stop", "Mark of Nurgle cannot be boarded");
var malleus = side("inquisition", [ship({ hp: 8, dp: 8, opts: ["inq_malleus"] })]);
eq(B.eligibility(malleus, nurgle)[0].level, "note", "an Ordo Malleus Inquisitor Lord may board a Nurgle ship");
var holo = side("eldar", [ship({ name: "Eclipse", hp: 6, dp: 6, opts: ["holofields"] })]);
eq(B.eligibility(plain, holo)[0].target, 2, "holofields ignore the attempt on a 2+");
eq(B.eligibility(side("inquisition", [ship({ hp: 8, dp: 8, opts: ["inq_xenos"] })]), holo)[0].target, 3,
  "holofields need a 3+ against an Ordo Xenos Inquisitor Lord");
// FL p.342: a Dark Eldar ship makes "a saving roll for his shadowfields" - the
// same save against the whole boarding attempt, under its own name.
var shade = side("darkeldar", [ship({ name: "Torture", hp: 6, dp: 6, opts: ["holofields"] })]);
var shadeP = B.eligibility(plain, shade)[0];
eq(shadeP.target, 2, "shadowfields ignore the attempt on a 2+ (FL p.342)");
eq(shadeP.field, "shadowfields", "a Dark Eldar save is named shadowfields (FL p.342)");
eq(/shadowfields/.test(shadeP.text) && !/holofields/.test(shadeP.text), true,
  "the Dark Eldar save text says shadowfields, not holofields");
eq(B.eligibility(plain, holo)[0].field, "holofields", "an Eldar save is named holofields (FL p.303)");
var hemlock = side("eldar", [ship({ name: "Hemlock", hp: 1, dp: 1, opts: ["noboard", "easyprey"] })]);
eq(B.eligibility(hemlock, plain)[0].level, "stop", "a Hemlock cannot initiate a boarding action");
eq(modIds(plain, hemlock, "att").indexOf("easyprey:1") >= 0, true, "boarding a Hemlock gives +1");
// Creator clarification (2026-09-13): the reverse multi-boarding case is legal.
// One Strike Cruiser boards four Vanguard drones and the action uses the normal
// combined values, modifiers, dice and damage result.
var vanguardDrones = side("tyranid", [1, 2, 3, 4].map(function () {
  return ship({ name: "Vanguard drone", hp: 1, dp: 1, turrets: 1, spores: true, type: "Escort" });
}));
var reverseMulti = B.prepare({ att: side("spacemarines", [sc1]), def: vanguardDrones });
eq(reverseMulti.problems.some(function (p) { return p.level === "stop"; }), false,
  "one ship may board several defending ships (creator clarification)");
eq([reverseMulti.att.value, reverseMulti.def.value], [6, 12],
  "Strike Cruiser 6 vs four Vanguard drones: (4 x 1 x 2) + 4 spores = 12");
eq(reverseMulti.att.mods.map(function (m) { return m.id + ":" + m.v; }), ["marines:2"],
  "the Strike Cruiser gets the Space Marine modifier once");
eq(reverseMulti.def.mods.map(function (m) { return m.id + ":" + m.v; }), ["ratio2:2"],
  "the combined drones get one 2:1 ratio modifier");
var reverseScore = B.score(reverseMulti, { att: [6], def: [1, 3] });
eq([reverseScore.att.total, reverseScore.def.total, reverseScore.winner, reverseScore.damage],
  [8, 5, "att", 3], "reverse multi-boarding uses one normal opposed roll and causes normal damage");
eq(B.prepare({ att: plain, def: holo, round: 2 }).problems
  .some(function (p) { return p.id === "holofield"; }), false,
  "a grappled combat does not roll the original holofield save again");
eq(B.prepare({ att: side("tyranid", [hive]), def: plain }).problems
  .some(function (p) { return p.id === "allislost"; }), true,
  "a capital ship boarded by Tyranids is reminded about All Is Lost (FL p.418)");

console.log("== dice ==");
eq(B.prepare({ att: side("tyranid", [hive]), def: plain }).att.dice, 2, "Tyranids roll 2D6");
eq(B.prepare({ att: side("tyranid", [hive]), def: plain }).att.pickHighest, true, "and take the highest");
var bsf = side("chaos", [ship({ name: "Blackstone Fortress", hp: 16, dp: 16, opts: ["nocrew"] })]);
eq(B.prepare({ att: plain, def: bsf }).def.dice, 0, "an activated Blackstone Fortress adds no D6");
var bsfScore = B.score(B.prepare({ att: plain, def: bsf }), { att: [4], def: [] });
eq([bsfScore.def.used, bsfScore.def.total], [0, B.prepare({ att: plain, def: bsf }).def.modSum],
  "the Blackstone Fortress scores its modifiers and nothing else");

console.log("== how many dice, and which one counts ==");
/* FL p.418: Tyranids "roll two D6 and use the highest result in boarding
   actions". The mirror image - two dice of which the LOWEST counts - is what
   the books use against Tyranids for hit-and-run (FL p.418, RB p.92), and the
   engine has to be able to say it as clearly as the other. */
var nidSide = side("tyranid", [ship({ name: "Hive Ship", hp: 10, dp: 10, turrets: 4 })]);
var impSide = side("imperial", [ship({ hp: 8, dp: 8, turrets: 2 })]);
var pn = B.prepare({ att: nidSide, def: impSide });
eq([pn.att.dice, pn.att.pick], [2, "high"], "a Tyranid side throws two dice and keeps the highest");
eq([pn.def.dice, pn.def.pick], [1, null], "an ordinary side throws one");
var sn = B.score(pn, { att: [2, 5], def: [4] });
eq([sn.att.used, sn.att.kept], [5, 1], "the higher die is the one that counts, and the engine says which");
eq(sn.att.dice, [2, 5], "both dice are kept for the record");

var lowSide = side("imperial", [ship({ hp: 8, dp: 8, opts: ["dicelow"] })]);
var pl = B.prepare({ att: lowSide, def: impSide });
eq([pl.att.dice, pl.att.pick], [2, "low"], "a take-the-lowest side also throws two");
var sl = B.score(pl, { att: [2, 5], def: [4] });
eq([sl.att.used, sl.att.kept], [2, 0], "and the LOWER die is the one that counts");
eq(B.prepare({ att: side("imperial", [ship({ hp: 8, dp: 8, opts: ["dicehigh"] })]), def: impSide }).att.pick,
  "high", "dicehigh gives any side the two-dice-keep-highest roll");
var pz = B.prepare({ att: impSide, def: side("chaos", [ship({ hp: 16, dp: 16, opts: ["nocrew"] })]) });
eq([pz.def.dice, pz.def.pick], [0, null], "a crewless hull throws none at all");
eq(B.score(pz, { att: [3], def: [] }).def.used, 0, "and scores its modifiers alone");

console.log("== criticals ==");
eq(B.critLookup(2,"standard").name, "Dorsal Armament Damaged", "2 = Dorsal Armament Damaged");
eq(B.critLookup(7,"standard").name, "Fire!", "7 = Fire!");
eq(B.critLookup(11,"standard").extra, "D3", "11 = Hull Breach, +D3 damage");
eq(B.critLookup(12,"standard").extra, "D6", "12 = Bulkhead Collapse, +D6 damage");
eq(B.critLookup(6,"standard").extra, 1, "6 = Engine Room Damaged, +1 damage");
eq(B.critLookup(8,"standard").extra, 1, "8 = Thrusters Damaged, +1 damage");
eq(B.criticalResult(ship({ hp: 10, opts: ["ignoreprow"] }), side("imperial", []), 5).name,
  "Prow critical ignored", "Vengeance-family hulls ignore Prow Armament Damaged");
eq(B.criticalResult(ship({ hp: 10, opts: ["bridgeplus1"] }), side("demiurg", []), 9).extra,
  1, "Demiurg Bridge Smashed becomes +1 damage (FL p.488-490)");
var gellarCrit = B.criticalResult(ship({ hp: 12, opts: ["blackship", "gellar"] }), side("inquisition", []), 10);
eq(B.followupLookup(gellarCrit.followup, 4).success, true, "Blackship Gellar Field is damaged on 4+");
eq(B.followupLookup(gellarCrit.followup, 3).success, false, "Blackship Gellar Field is safe on 1-3");
var hulkCrit = B.criticalResult(ship({ hp: 40, opts: ["orkhulk"] }), side("ork", []), 1);
eq(B.followupLookup(hulkCrit.followup, 5).text, "Lose 1 turret strength.",
  "Ork hulk high-energy critical resolves its second D6");
eq(B.critLookup(12,"tyranid").text.indexOf("Strength 1 bio-plasma") >= 0, true,
  "Tyranid Massive haemorrhage includes its area attack");
eq(B.CRIT_TABLES.standard.rows.length, 11, "the critical hits table has 11 entries");
eq(B.critBonus(side("chaos", [ship({ hp: 8, dp: 8, opts: ["khorne"] })])), 1,
  "Mark of Khorne adds +1 to the roll to cause a critical hit");
eq(B.escortKilledByCrit(ship({ hp: 1, dp: 1 })), true, "an escort is destroyed by any critical hit");
eq(B.escortKilledByCrit(ship({ hp: 6, dp: 1 })), false, "a cruiser at 1 DP is not");

console.log("== drawn combat ==");
var tie = B.score(B.prepare({ att: plain, def: side("imperial", [ship({ hp: 8, dp: 8, turrets: 0 })]) }),
  { att: [4], def: [4] });
eq(tie.winner, null, "equal totals are a draw");
eq(tie.damage, 0, "a draw inflicts no damage");
eq([tie.result.name, tie.critNeeds.win, tie.critNeeds.lose], ["Grapple", 7, 7],
  "a draw is a grapple and causes no criticals");

console.log("== hexagrammic wards ==");
/* An Ordo Malleus Inquisitor Lord, and Grey Knights capital ships, ignore Chaos
   marks affecting boarding actions (FL p.142, p.145; REF p.1). */
var khorneShip = ship({ name: "Slaughter", hp: 8, dp: 8, turrets: 2, opts: ["khorne"] });
var khorneSide = side("chaos", [khorneShip]);
var plainImp = side("imperial", [ship({ hp: 8, dp: 8, turrets: 2 })]);
var malleusSide = side("inquisition", [ship({ hp: 8, dp: 8, turrets: 2, opts: ["inq_malleus"] })]);
var gkSide = side("inquisition", [ship({ hp: 6, dp: 6, turrets: 2, opts: ["greyknights", "marines"] })]);
eq(B.boardingValue(khorneSide, "attacker", plainImp).value, 16, "Mark of Khorne doubles normally");
eq(B.boardingValue(khorneSide, "attacker", malleusSide).value, 8, "an Ordo Malleus Inquisitor Lord ignores the doubling");
eq(B.boardingValue(khorneSide, "attacker", gkSide).value, 8, "Grey Knights hexagrammic wards ignore it too");
var nurgleSide = side("chaos", [ship({ name: "Plague", hp: 8, dp: 8, turrets: 2, opts: ["nurgle"] })]);
eq(B.eligibility(plainImp, nurgleSide)[0].level, "stop", "the Mark of Nurgle stops an ordinary boarder");
eq(B.eligibility(gkSide, nurgleSide)[0].level, "note", "Grey Knights may board a Nurgle ship");

console.log("== Tyranid blast asymmetry ==");
/* FL p.418: boarding places a Blast Marker on the target, so a boarding Tyranid
   always has the +1; the enemy never gets it from the Tyranid's own markers. */
var nid = side("tyranid", [ship({ name: "Hive Ship", hp: 10, dp: 10, turrets: 4 })], { blast: true });
var nidAtt = B.prepare({ att: nid, def: plainImp });
eq(nidAtt.att.mods.some(function (m) { return m.id === "blast"; }), true,
  "a boarding Tyranid always has the Blast Marker modifier");
eq(nidAtt.def.mods.some(function (m) { return m.id === "blast"; }), false,
  "the enemy gets nothing for the Tyranid's own Blast Markers");
var nidDef = B.prepare({ att: plainImp, def: nid });
eq(nidDef.def.mods.some(function (m) { return m.id === "blast"; }), false,
  "a DEFENDING Tyranid does not get the automatic Blast Marker modifier");

console.log("== Inquisitor Lords do not stack with Space Marines ==");
/* FL p.144: the Inquisitor Lord bonus is not added on top of an identical
   Space Marine or Grey Knights bonus. */
function ids(att, def, role){ var p=B.prepare({att:att,def:def}); return p[role].mods.map(function(m){return m.id;}); }
var smWithLord = side("spacemarines", [ship({ hp: 6, dp: 6, opts: ["inq_malleus"] })]);
eq(ids(smWithLord, plainImp, "att"), ["marines"], "a Space Marine ship with an Inquisitor Lord still gets only +2");
var navyWithLord = side("imperial", [ship({ hp: 8, dp: 8, opts: ["inq_malleus"] })]);
eq(ids(navyWithLord, plainImp, "att"), ["inq_malleus"], "an Imperial Navy ship gets the Inquisitor Lord's +2");
eq(B.prepare({ att: navyWithLord, def: plainImp }).att.modSum, 2, "and it is worth exactly +2");

console.log("== Eldar ==");
var talons = side("eldar", [ship({ name: "Wraithship", hp: 6, dp: 6, opts: ["talons"] })]);
eq(B.prepare({ att: plainImp, def: talons }).att.mods.some(function (m) { return m.id === "talons" && m.v === -2; }),
  true, "the Talons refit gives enemies boarding this ship -2");
var aspect = side("eldar", [ship({ hp: 6, dp: 6, opts: ["aspect"] })]);
eq(B.prepare({ att: aspect, def: plainImp }).att.mods.some(function (m) { return m.id === "aspect" && m.v === 2; }),
  true, "an Aspect Warrior Host is +2");
var ghost = side("eldar", [ship({ name: "Ghostship", hp: 6, dp: 6, opts: ["noboard", "easyprey"] })]);
eq(B.eligibility(ghost, plainImp)[0].level, "stop", "a Ghostship may not initiate a boarding action");
eq(B.prepare({ att: plainImp, def: ghost }).att.mods.some(function (m) { return m.id === "easyprey"; }),
  true, "and enemies boarding it gain +1");

console.log("== Lord Admiral Rath ==");
var rath = side("imperial", [ship({ hp: 12, dp: 12, turrets: 4, opts: ["rath"] })]);
eq(B.prepare({ att: plainImp, def: rath }).def.mods.some(function (m) { return m.id === "rath"; }), true,
  "Rath's flagship crew gives +1 when defending");
eq(B.prepare({ att: rath, def: plainImp }).att.mods.some(function (m) { return m.id === "rath"; }), false,
  "and nothing when attacking");

console.log("== hand-entered modifier ==");
var handy = side("imperial", [ship({ hp: 8, dp: 8 })], { other: 2 });
eq(B.prepare({ att: handy, def: plainImp }).att.mods.some(function (m) { return m.id === "other" && m.v === 2; }),
  true, "anything the app does not know can still be entered by hand");

console.log("== race critical tables ==");
eq(B.critLookup(10, "eldar").name, "Holofield generators destroyed", "Eldar 10 destroys the holofields");
eq(B.critLookup(2, "tyranid").name, "Spore cysts injured", "Tyranid 2 injures the spore cysts");
eq(B.critLookup(10, "tyranid").name, "Spore cysts ruptured", "Tyranid 10 ruptures them permanently");
eq(B.critLookup(3, "defence").name, "Lances Damaged", "the defences table covers 2-3 with one row");
eq(B.critLookup(9, "defence").name, "Orbit Lost", "and 8-9 with another");
eq(B.critLookup(9, "defence").extra, 1, "Orbit Lost carries +1 damage");
eq(B.critLookup(1, "orkhulk").name, "Target high energy systems!", "an Ork hulk rolls a single D6");
eq(B.CRIT_TABLES.orkhulk.dice, 1, "and its table is a D6 table, not 2D6");
eq(B.critLookup(4, "plus1").extra, 1, "a Kroot Warsphere takes 1 extra damage instead of a table result");
eq([B.CRIT_TABLES.eldar.rows.length, B.CRIT_TABLES.tyranid.rows.length, B.CRIT_TABLES.defence.rows.length],
  [11, 11, 9], "every alternate table is complete");

eq(B.critTableId(ship({ hp: 6, dp: 6 }), side("eldar", [])), "eldar", "Eldar ships use the Eldar table");
eq(B.critTableId(ship({ hp: 10, dp: 10 }), side("tyranid", [])), "tyranid", "bio-ships use the Tyranid table");
eq(B.critTableId({ hp: 8, dp: 8, type: "Defence", opts: [] }, side("imperial", [])), "defence",
  "a station uses the defences table");
eq(B.critTableId({ hp: 40, dp: 40, opts: ["orkhulk"] }, side("ork", [])), "orkhulk", "an Ork hulk has its own");
eq(B.critTableId({ hp: 10, dp: 10, opts: ["critplus1"] }, side("kroot", [])), "plus1", "a Warsphere rolls nothing");
eq(B.critTableId(ship({ hp: 8, dp: 8 }), side("chaos", [])), "standard", "everyone else uses the standard table");

eq(B.critTableId(ship({ hp: 1, dp: 1 }), side("imperial", [])), "escort",
  "an escort rolls on no critical table at all");
eq(B.critLookup(0, "escort").name, "Destroyed", "it is simply destroyed");
eq(B.critLookup(0, "escort").extra, 0, "and takes no extra damage on top");

console.log("== catastrophic damage ==");
eq(B.cataLookup(2,"standard").name, "Drifting Hulk", "2-6 is a drifting hulk");
eq(B.cataLookup(6,"standard").name, "Drifting Hulk", "including 6");
eq(B.cataLookup(8,"standard").name, "Blazing Hulk", "7-8 is a blazing hulk");
eq(B.cataLookup(11,"standard").name, "Plasma Drive Overload", "9-11 is a plasma drive overload");
eq(B.cataLookup(12,"standard").name, "Warp Drive Implosion", "12 is a warp drive implosion");
eq(B.cataDice(ship({ hp: 8, opts: ["cata3"] }), side("imperial", [])), 3,
  "Mercury rolls 3D6 for catastrophic damage (FL p.64)");
eq(B.cataDice(ship({ hp: 6, opts: ["fuel_tanker"] }), side("roguetrader", [])), 3,
  "a Fuel Tanker rolls 3D6 for catastrophic damage (FL p.182)");

console.log("== space hulks ==");
/* FL p.288, p.391: space hulks are not crippled by damage like ordinary ships. */
var hulk40 = ship({ name: "Ork Hulk", hp: 40, dp: 8, turrets: 6, opts: ["spacehulk", "orkhulk"] });
eq(B.isCrippled(hulk40), false, "a space hulk at a fifth of its hits is still not crippled");
eq(B.effTurrets(hulk40), 6, "so its turrets are not halved either");
eq(B.prepare({ att: plainImp, def: side("ork", [hulk40]) }).att.mods
  .filter(function (m) { return m.id === "crippled"; }).length, 0,
  "and the enemy gets no +2 for it");
eq(B.critTableId(hulk40, side("ork", [])), "orkhulk", "the Ork hulk has its own critical table");
eq(B.critTableId({ hp: 40, dp: 40, opts: ["spacehulk", "chaoshulk"] }, side("chaos", [])), "chaoshulk",
  "and so does the Chaos one");
eq(B.critLookup(1, "chaoshulk").name, "Target high energy systems!", "Chaos hulk D6 roll 1-2");
eq(B.cataTableId(hulk40, side("ork", [])), "spacehulk", "a hulk uses the space hulk catastrophic table");
eq(B.cataLookup(10, "spacehulk").name, "Torn apart", "9-11 tears it into an asteroid field");
eq(B.cataLookup(12, "spacehulk").name, "Hurled into the Warp", "12 hurls it into the Warp");

console.log("== catastrophic damage variants ==");
eq(B.cataTableId(ship({ hp: 10, dp: 1 }), side("tyranid", [])), "tyranid", "bio-ships use their own table");
eq(B.cataLookup(7, "tyranid").name, "Drifting carcass", "Tyranid 2-7 is a drifting carcass");
eq(B.cataLookup(9, "tyranid").name, "Death throes", "8-9 death throes");
eq(B.cataLookup(10, "tyranid").name, "Biological eruption", "10-11 biological eruption");
eq(B.cataLookup(12, "tyranid").name, "Bio-plasma detonation", "12 bio-plasma detonation");
eq(B.cataTableId({ hp: 8, dp: 1, opts: ["nocata4"] }, side("ork", [])), "nocata4",
  "a Rok, a Warsphere and a Caravan roll nothing at all");
eq(B.cataLookup(0, "nocata4").bm, "4", "they are replaced by four Blast Markers");

console.log("== who gets the fragile-hull and Talons modifiers ==");
var hemlockDef = side("eldar", [ship({ name: "Hemlock", hp: 1, dp: 1, opts: ["easyprey"] })]);
eq(B.prepare({ att: plainImp, def: hemlockDef }).att.mods.some(function (m) { return m.id === "easyprey"; }),
  true, "the ship that boards a Hemlock gains +1");
eq(B.prepare({ att: hemlockDef, def: plainImp }).def.mods.some(function (m) { return m.id === "easyprey"; }),
  false, "a defender does not gain it when the Hemlock is the boarder");
var talonsDef = side("eldar", [ship({ hp: 6, dp: 6, opts: ["talons"] })]);
eq(B.prepare({ att: plainImp, def: talonsDef }).att.mods.some(function (m) { return m.id === "talons"; }),
  true, "boarding a Talons ship is -2");
eq(B.prepare({ att: talonsDef, def: plainImp }).def.mods.some(function (m) { return m.id === "talons"; }),
  false, "but a Talons ship boarding someone does not penalise its victim");

console.log("== more race tables ==");
eq(B.critTableId(ship({ hp: 6, dp: 6 }), side("darkeldar", [])), "darkeldar",
  "Dark Eldar have a critical table of their own");
eq(B.critLookup(10, "darkeldar").name, "Shadowfield Generator Destroyed", "Dark Eldar 10 kills the shadowfields");
eq(B.critTableId(ship({ hp: 12, dp: 12 }), side("necron", [])), "necron", "so do the Necrons");
eq(B.critLookup(9, "necron").name, "Sepulchre Damaged", "Necron 9 damages the Sepulchre");
eq([B.CRIT_TABLES.darkeldar.rows.length, B.CRIT_TABLES.necron.rows.length], [11, 11],
  "and both tables are complete");

console.log("== spore cysts are not halved ==");
/* FL p.424, the Tyranid crippled summary: "Spore cysts: Full strength". */
var cripNid = { name: "Hive Ship", hp: 10, dp: 4, turrets: 4, spores: true, opts: [] };
eq(B.isCrippled(cripNid), true, "a Hive Ship at 4 of 10 is crippled");
eq(B.effTurrets(cripNid), 4, "but its spore cysts stay at full strength");
eq(B.boardingValue(side("tyranid", [cripNid]), "defender").value, 12, "so it defends with 4x2 + 4");
var cripTurret = ship({ hp: 10, dp: 4, turrets: 4 });
eq(B.effTurrets(cripTurret), 2, "an ordinary crippled ship still halves its turrets");

console.log("== star forts ==");
var fort = side("imperial", [ship({ name: "Ramilies", hp: 12, dp: 12, turrets: 4, opts: ["fortress"] })]);
eq(B.eligibility(plainImp, fort)[0].level, "stop", "only a space hulk may board a star fort");
var hulkAtt = side("ork", [ship({ name: "Ork Hulk", hp: 40, dp: 40, turrets: 6, opts: ["spacehulk", "orkhulk"] })]);
eq(B.eligibility(hulkAtt, fort).filter(function (x) { return x.level === "stop"; }).length, 0,
  "and a space hulk may");

console.log("== Berzerker Tide needs the Mark ==");
eq(B.extraCritRolls(side("chaos", [ship({ hp: 8, dp: 8, opts: ["berzerkerfleet"] })])), false,
  "the Berzerker Tide needs a Mark of Khorne ship");
eq(B.extraCritRolls(side("chaos", [ship({ hp: 8, dp: 8, opts: ["berzerkerfleet", "khorne"] })])), true,
  "with the Mark it is available");

console.log("== star fort and Haven tables ==");
eq(B.critTableId({ hp: 12, dp: 12, opts: ["fortress", "ramilies"] }, side("imperial", [])), "ramilies",
  "a Ramilies uses its own critical table");
eq(B.critLookup(11, "ramilies").name, "Basilica penetrated!", "Ramilies 11 penetrates the basilica");
eq(B.criticalResult({ hp: 12, dp: 12, opts: ["ramilies"] }, side("imperial", []), 11).allQuadrants,
  true, "Ramilies 11 applies its D3 damage to all four quadrants");
eq(B.criticalResult({ hp: 12, dp: 12, opts: ["ramilies"] }, side("imperial", []), 12).repeatCritical,
  true, "Ramilies 12 immediately rolls another critical result");
eq(B.cataTableId({ hp: 12, dp: 1, opts: ["fortress", "ramilies"] }, side("imperial", [])), "ramilies",
  "and its own catastrophic table");
eq(B.CATA_TABLES.ramilies.dice, 1, "which is a D6 table, not 2D6");
eq(B.cataLookup(6, "ramilies").name, "Warpbubble Implosion", "6 draws it into the Warp");
eq(B.critTableId({ hp: 8, dp: 8, type: "Defence", opts: ["haven"] }, side("eldar", [])), "haven",
  "the Eldar Haven has a table of its own");
eq(B.critLookup(10, "haven").text.indexOf("Netherfield") > 0, true,
  "and its result 10 takes the Netherfield with the holofields");

console.log("== Blackstone Fortress ==");
var bsf2 = side("chaos", [ship({ name: "Blackstone Fortress", hp: 16, dp: 16, opts: ["nocrew"] })]);
eq(B.prepare({ att: plainImp, def: bsf2 }).def.dice, 0, "it adds no D6");
eq(B.prepare({ att: plainImp, def: bsf2 }).def.value > 0, true, "but it still has a boarding value");
eq(B.prepare({ att: plainImp, def: bsf2 }).def.mods.filter(function(m){ return m.id==="chaos"; }).length, 0,
  "and no crew means no crew-quality modifier either");
var invalidMarineBlackship = side("inquisition", [ship({ hp: 12, turrets: 5,
  opts: ["blackship", "marines"] })]);
eq(B.prepare({ att: plainImp, def: invalidMarineBlackship }).def.mods
  .filter(function(m){ return m.id === "marines"; }).length, 0,
  "a Blackship never receives Space Marine benefits even from invalid saved data (FL p.148)");
eq(B.prepare({ att: plainImp, def: bsf2 }).def.mods.some(function (m) { return m.id.indexOf("ratio") === 0; }),
  true, "a crewless hull is still compared on boarding value like anyone else");

// ---------------------------------------------------------------------------
console.log("");
if (fail) {
  console.log(fails.join("\n"));
  console.log("\nFAIL  " + pass + " passed, " + fail + " failed");
  process.exit(1);
}
console.log("OK    " + pass + " assertions passed");
