/* node test_fuzz.js
 *
 * Property sweep over the rules engine. test_engine.js proves the engine gets
 * the book's own examples right; this one throws tens of thousands of random
 * boarding actions at it and asserts the things that must hold for EVERY one:
 * no NaN, no negative damage, no threshold outside the printed range, no table
 * lookup without an answer, and no combination that throws.
 *
 * It is deterministic: the same seed always produces the same run, so a failure
 * can be reproduced exactly from the line it prints.
 */
var B = require("./src/engine.js");
var SHIPS = require("./src/ships.json");

var SEED = +(process.argv[2] || 20260914);
var RUNS = +(process.argv[3] || 40000);

var rnd = B.makeRng(SEED);
function pick(a) { return a[Math.floor(rnd() * a.length)]; }
function between(lo, hi) { return lo + Math.floor(rnd() * (hi - lo + 1)); }

var fails = [];
function ok(cond, what, ctx) {
  if (cond) return;
  fails.push(what + "\n      " + JSON.stringify(ctx));
}

var RACES = SHIPS.fleets.map(function (f) { return f.race; });
var OPTS = ["khorne", "nurgle", "csm", "abaddon", "berzerkers", "berzerkerfleet", "spacehulk",
  "warlord", "clanzwarlord", "goff", "megaarmour", "holofields", "marines", "greyknights",
  "inq_malleus", "inq_hereticus", "inq_xenos", "terminators", "corridor", "blackship",
  "nocrew", "noboard", "easyprey", "hp2", "critplus1", "orkhulk", "chaoshulk", "nocata4",
  "fortress", "ramilies", "haven", "aspect", "talons", "battlestance", "rath", "dicelow",
  "dicehigh", "orders2", "spores"];
var TYPES = ["Battleship", "Grand Cruiser", "Cruiser", "Escort", "Defence", "Ground"];

function randomShip() {
  var hp = pick([1, 1, 1, 4, 6, 8, 10, 12, 13, 14, 16, 40]);
  var s = {
    name: "S" + between(1, 99),
    hp: hp,
    dp: between(0, hp),
    turrets: between(0, 6),
    type: pick(TYPES),
    spores: rnd() < 0.1,
    opts: [],
  };
  var n = between(0, 3);
  for (var i = 0; i < n; i++) {
    var o = pick(OPTS);
    if (s.opts.indexOf(o) < 0) s.opts.push(o);
  }
  return s;
}
function randomSide() {
  var n = between(1, 4), ships = [];
  for (var i = 0; i < n; i++) ships.push(randomShip());
  return {
    race: pick(RACES),
    ships: ships,
    blast: rnd() < 0.4,
    orders: rnd() < 0.4,
    other: pick([0, 0, 0, 0, 2, -2, 5, -5, 9, -9]),
  };
}

var INT = function (n) { return typeof n === "number" && isFinite(n) && Math.floor(n) === n; };

console.log("fuzzing " + RUNS + " boarding actions, seed " + SEED);

for (var run = 0; run < RUNS; run++) {
  var att = randomSide(), def = randomSide();
  var round = between(1, 6);
  var ctx = null, prep = null;

  try {
    prep = B.prepare({ att: att, def: def, round: round });
  } catch (e) {
    fails.push("prepare() threw: " + e.message + "\n      " +
      JSON.stringify({ run: run, att: att, def: def, round: round }));
    continue;
  }
  ctx = { run: run, attRace: att.race, defRace: def.race, round: round };

  // ---- boarding values -----------------------------------------------------
  ["att", "def"].forEach(function (k) {
    var p = prep[k];
    ok(INT(p.value) && p.value >= 0, "boarding value must be a whole number >= 0", { ctx: ctx, k: k, v: p.value });
    ok(INT(p.modSum), "modifier total must be a whole number", { ctx: ctx, k: k, v: p.modSum });
    ok([0, 1, 2].indexOf(p.dice) >= 0, "a side throws 0, 1 or 2 dice", { ctx: ctx, k: k, v: p.dice });
    ok(p.dice === 2 ? (p.pick === "high" || p.pick === "low") : p.pick === null,
      "two dice always say which one counts, one die never does", { ctx: ctx, k: k, pick: p.pick, dice: p.dice });
    var ratio = p.mods.filter(function (m) { return m.id.indexOf("ratio") === 0; });
    ok(ratio.length <= 1, "only one ratio modifier may apply (RB p.90 asterisk)",
      { ctx: ctx, k: k, ratio: ratio.map(function (m) { return m.id; }) });
    if (ratio.length) ok([1, 2, 3, 4].indexOf(ratio[0].v) >= 0, "ratio modifiers are +1..+4",
      { ctx: ctx, k: k, v: ratio[0].v });
    var ids = p.mods.map(function (m) { return m.id; });
    ok(ids.indexOf("chaos") < 0 || ids.indexOf("csm") < 0,
      "the Chaos Space Marine +2 supersedes the +1 for Chaos, they never both apply", { ctx: ctx, k: k, ids: ids });
    ok(!(ids.indexOf("orders") >= 0 && ids.indexOf("orders2") >= 0),
      "the special-orders modifier applies once", { ctx: ctx, k: k, ids: ids });
    p.mods.forEach(function (m) {
      ok(INT(m.v), "every modifier is a whole number", { ctx: ctx, k: k, m: m });
      ok(typeof m.label === "string" && m.label.length > 0, "every modifier can say what it is",
        { ctx: ctx, k: k, m: m });
    });
    ok(p.modSum === p.mods.reduce(function (n, m) { return n + m.v; }, 0),
      "the modifier total is the sum of the modifiers", { ctx: ctx, k: k });
  });

  // a crewless side adds no die but still has a value
  ["att", "def"].forEach(function (k) {
    var living = B.alive(prep === null ? { ships: [] } : (k === "att" ? att : def));
    if (living.length && living.every(function (s) { return B.has(s, "nocrew"); })) {
      ok(prep[k].dice === 0, "a crewless side adds no D6 (FL p.284)", { ctx: ctx, k: k });
    }
  });

  // ---- eligibility ---------------------------------------------------------
  prep.problems.forEach(function (pr) {
    ok(["stop", "note", "roll", "rule"].indexOf(pr.level) >= 0, "every problem has a known level",
      { ctx: ctx, pr: pr });
    ok(typeof pr.text === "string" && pr.text.length > 0, "every problem can say what it is",
      { ctx: ctx, pr: pr });
    if (pr.level === "roll") ok(pr.target === 2 || pr.target === 3,
      "a holofield save is 2+ or 3+", { ctx: ctx, pr: pr });
  });

  // ---- the roll ------------------------------------------------------------
  function dice(n) { var a = []; for (var i = 0; i < n; i++) a.push(between(1, 6)); return a; }
  var rolls = { att: dice(prep.att.dice), def: dice(prep.def.dice) };
  var sc;
  try {
    sc = B.score(prep, rolls);
  } catch (e) {
    fails.push("score() threw: " + e.message + "\n      " + JSON.stringify({ ctx: ctx, rolls: rolls }));
    continue;
  }

  ["att", "def"].forEach(function (k) {
    var s = sc[k], p = prep[k];
    ok(INT(s.total), "a total is a whole number", { ctx: ctx, k: k, s: s });
    ok(s.dice.length === p.dice, "as many dice are recorded as were thrown", { ctx: ctx, k: k, s: s, want: p.dice });
    if (p.dice === 0) {
      ok(s.used === 0, "no dice means nothing is added to the modifiers", { ctx: ctx, k: k, s: s });
    } else {
      ok(s.used >= 1 && s.used <= 6, "the die that counts is a D6 result", { ctx: ctx, k: k, s: s });
      ok(s.dice.indexOf(s.used) >= 0, "the die that counts is one of the dice thrown", { ctx: ctx, k: k, s: s });
      ok(s.kept >= 0 && s.kept < s.dice.length, "the app can point at the die that counted", { ctx: ctx, k: k, s: s });
      if (p.pick === "high") ok(s.used === Math.max.apply(null, s.dice), "keep the highest means the highest",
        { ctx: ctx, k: k, s: s });
      if (p.pick === "low") ok(s.used === Math.min.apply(null, s.dice), "keep the lowest means the lowest",
        { ctx: ctx, k: k, s: s });
    }
    ok(s.total === s.used + p.modSum, "a total is its die plus its modifiers", { ctx: ctx, k: k, s: s });
  });

  ok(INT(sc.diff) && sc.diff >= 0, "the difference is a whole number >= 0", { ctx: ctx, sc: sc });
  ok(sc.diff === Math.abs(sc.att.total - sc.def.total), "the difference is the gap between the totals",
    { ctx: ctx, sc: sc });
  ok(sc.winner === null || sc.winner === "att" || sc.winner === "def", "there is one winner or none",
    { ctx: ctx, sc: sc });
  if (sc.winner === null) {
    ok(sc.damage === 0, "a draw inflicts no damage", { ctx: ctx, sc: sc });
    ok(sc.result.name === "Grapple", "a draw is a grapple", { ctx: ctx, sc: sc });
    ok(sc.critNeeds.win > 6 && sc.critNeeds.lose > 6, "a draw causes no critical hits", { ctx: ctx, sc: sc });
    ok(sc.loser === null, "a draw has no loser", { ctx: ctx, sc: sc });
  } else {
    ok(sc.damage === sc.diff, "the loser takes one damage per point it lost by (RB p.90)", { ctx: ctx, sc: sc });
    ok(sc.loser === (sc.winner === "att" ? "def" : "att"), "the loser is the other side", { ctx: ctx, sc: sc });
    ok(sc.critNeeds.win >= 0 && sc.critNeeds.win <= 7, "a critical threshold is 0..7", { ctx: ctx, sc: sc });
    ok(sc.critNeeds.lose >= 0 && sc.critNeeds.lose <= 7, "a critical threshold is 0..7", { ctx: ctx, sc: sc });
    ok(sc.critNeeds.win <= sc.critNeeds.lose,
      "the winner never needs a worse roll than the loser to cause a critical", { ctx: ctx, sc: sc });
  }
  ok(B.resultFor(sc.diff) === sc.result, "the result comes from the results table", { ctx: ctx, sc: sc });

  // ---- the tables ----------------------------------------------------------
  [att, def].forEach(function (side) {
    side.ships.forEach(function (sh) {
      var tid = B.critTableId(sh, side);
      ok(tid === "escort" || tid === "plus1" || !!B.CRIT_TABLES[tid],
        "every ship maps to a critical table that exists", { ctx: ctx, tid: tid, sh: sh });
      var T = B.CRIT_TABLES[tid];
      var lo = T ? (T.dice === 1 ? 1 : 2) : 0, hi = T ? (T.dice === 1 ? 6 : 12) : 0;
      for (var n = lo; n <= hi; n++) {
        var c = B.critLookup(n, tid);
        ok(c && typeof c.name === "string" && c.name.length > 0,
          "every roll on a critical table has a result", { ctx: ctx, tid: tid, n: n });
      }
      var cid = B.cataTableId(sh, side);
      ok(cid === "nocata4" || !!B.CATA_TABLES[cid],
        "every ship maps to a catastrophic table that exists", { ctx: ctx, cid: cid, sh: sh });
      var CT = B.CATA_TABLES[cid];
      var clo = CT ? (CT.dice === 1 ? 1 : 2) : 0, chi = CT ? (CT.dice === 1 ? 6 : 12) : 0;
      for (var m = clo; m <= chi; m++) {
        var r = B.cataLookup(m, cid);
        ok(r && typeof r.name === "string" && r.name.length > 0,
          "every roll on a catastrophic table has a result", { ctx: ctx, cid: cid, m: m });
      }
    });
  });

  if (fails.length > 40) break;
}

// ---- every table is internally complete, independent of the fuzz ------------
Object.keys(B.CRIT_TABLES).forEach(function (id) {
  var T = B.CRIT_TABLES[id];
  var lo = T.dice === 1 ? 1 : 2, hi = T.dice === 1 ? 6 : 12;
  for (var n = lo; n <= hi; n++) {
    ok(!!B.critLookup(n, id), "critical table " + id + " covers " + n, { id: id, n: n });
  }
  var covered = [];
  T.rows.forEach(function (r) { for (var i = r.lo; i <= r.hi; i++) covered.push(i); });
  ok(covered.length === new Set(covered).size, "critical table " + id + " has no overlapping rows",
    { id: id, covered: covered });
});
Object.keys(B.CATA_TABLES).forEach(function (id) {
  var T = B.CATA_TABLES[id];
  var lo = T.dice === 1 ? 1 : 2, hi = T.dice === 1 ? 6 : 12;
  for (var n = lo; n <= hi; n++) {
    ok(!!B.cataLookup(n, id), "catastrophic table " + id + " covers " + n, { id: id, n: n });
  }
});

// ---- the shipped data itself ------------------------------------------------
var seenName = {};
SHIPS.ships.forEach(function (s) {
  ok(INT(s.hp) && s.hp >= 1, "every ship has at least one damage point", s);
  ok(INT(s.tu) && s.tu >= 0, "every ship has a whole turret value", s);
  ok(typeof s.n === "string" && s.n.length > 0, "every ship has a name", s);
  ok(typeof s.full === "string" && s.full.length > 0, "every ship keeps its book name", s);
  ok(s.f >= 0 && s.f < SHIPS.fleets.length, "every ship belongs to a fleet that exists", s);
  var key = s.f + "|" + s.n + "|" + s.s;
  ok(!seenName[key], "no two ships in one fleet look the same in the picker", { ship: s, key: key });
  seenName[key] = 1;
});

console.log("");
if (fails.length) {
  console.log(fails.slice(0, 40).join("\n"));
  console.log("\nFAIL  " + fails.length + " broken invariants");
  process.exit(1);
}
console.log("OK    " + RUNS + " random boarding actions, every invariant held");
