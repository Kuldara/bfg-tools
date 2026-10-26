/* Randomised stress test: uses every ship in every list
   with random option and upgrade states and checks that the card and the
   points stay intact.

   Why this exists: print_check.js and the layout audit run the cards
   in the DEFAULT STATE. Most defects, however, are not in the default state but
   in what the user does - a swap taken, an option hidden, an upgrade
   on, an escort squadron full. This harness uses those combinations.

   The seed is fixed, so a run is repeatable. A defect prints the seed and
   the state that reproduces it.

   Run:  node stress.js            default 6 rounds / ship
         node stress.js 20         20 rounds / ship
         node stress.js 6 -v       also show the passing steps
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
  querySelector: () => el(), querySelectorAll: () => [], createElement: () => el(),
  head: { appendChild(){} },
  body: { appendChild(){}, removeChild(){}, dataset: {},
          classList: { add(){}, remove(){} } },
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

const { LISTS, SHIPS } = api;
const ROUNDS = Math.max(1, parseInt(process.argv[2], 10) || 6);
const VERBOSE = process.argv.includes("-v");
const STATES = ["off", "opt", "take"];

/* Repeatable randomness: the same seed gives the same run. */
function rng(seed){
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const found = [];
let cases = 0, checksRun = 0;
function fail(where, msg, ctx){
  found.push({ where, msg, ctx });
}
function check(cond, where, msg, ctx){
  checksRun++;
  if(!cond) fail(where, msg, ctx);
  return cond;
}

/* ------------------------------------------------------------ invariantit */

function checkCard(h, where, ctx){
  /* 1  The card must show no trace of a programming error. */
  ["undefined", "NaN", "[object Object]"].forEach(bad => {
    check(!h.includes(bad), where, "the card contains " + JSON.stringify(bad), ctx);
  });

  /* 2  tbody pairs balanced: a broken table would break printing. */
  const open = (h.match(/<tbody[ >]/g) || []).length;
  const close = (h.match(/<\/tbody>/g) || []).length;
  check(open === close, where,
        "tbody tags unbalanced " + open + " vs " + close, ctx);

  /* 3  Every weapon row has an arc, and the arc produces a mark. */
  const rows = (h.match(/<tr class="w(?: alt| ammo)?"/g) || []).length;
  const arcCells = (h.match(/<td class="ar" data-arc="[^"]*"/g) || []).length;
  const arcMarks = (h.match(/class="arcg"|class="noarc"/g) || []).length;
  check(arcCells === rows, where,
        "arc cells " + arcCells + " != weapon rows " + rows, ctx);
  check(arcMarks === rows, where,
        "arc marks " + arcMarks + " != weapon rows " + rows, ctx);

  /* 4  A colour code for every row. */
  const badges = (h.match(/class="bg" style="--bd:#[0-9A-F]{6}"/gi) || []).length;
  check(badges === rows, where, "colour codes " + badges + " != " + rows, ctx);

  /* 5  Choice circles: exactly one filled in every group. This is
        the invariant that makes the base row fill automatically. */
  const groups = h.match(/<tbody class="g">[\s\S]*?<\/tbody>/g) || [];
  groups.forEach((g, gi) => {
    const on = (g.match(/class="rb on"/g) || []).length;
    const all = (g.match(/class="rb/g) || []).length;
    check(on === 1, where,
          "group " + gi + " has " + on + " filled circles, must be 1", ctx);
    check(all >= 1, where, "group " + gi + " has no circles", ctx);
  });

  /* 6  A separator row must not come twice in a row nor at an edge. The sequence
        is read as tokens: a lazy regex backtracks forwards and jumps
        over a group in between, and then the hit is wrong. */
  const seq = (h.match(/<tbody(?: class="(?:g|gp)")?>/g) || [])
    .map(t => /class="gp"/.test(t) ? "gp" : /class="g"/.test(t) ? "g" : "p");
  seq.forEach((t, i) => {
    if(t === "gp" && seq[i + 1] === "gp")
      check(false, where, "two separator rows in a row", ctx);
  });
  if(seq.length){
    check(seq[0] !== "gp", where, "the table starts with a separator row", ctx);
    check(seq[seq.length - 1] !== "gp", where, "the table ends with a separator row", ctx);
  }

  /* 7  Damage bands: the number of boxes matches the hits value. */
  const bands = h.match(/<div class="k-hits(?: cr)?">[\s\S]*?<\/div>/g) || [];
  if(bands.length){
    const boxes = bands.reduce((a, b) => a + (b.match(/<i>\d+<\/i>/g) || []).length, 0);
    check(boxes > 0, where, "the damage bands are empty", ctx);
  }
}

function checkPoints(u, where, ctx){
  const p = api.unitPts(u), mx = api.unitMaxPts(u);
  check(Number.isFinite(p), where, "unitPts is not a number: " + p, ctx);
  check(Number.isFinite(mx), where, "unitMaxPts is not a number: " + mx, ctx);
  /* The price before the player's own +- adjustment must not be negative. The adjustment (adj)
     is a number the player types, and the fuzz draws it from -10..+29.
     The Fleets p.499 price list has 5-point rows (Missile silo, Orbital
     mine) and the Waystation costs what its single defence system costs
     (p.481: hull 0): with one item an adjustment of -9 takes the sum below zero
     without any fault in the pricing. The earlier claim "sum >= 0" held only
     as long as the cheapest row cost at least 10. The defect this guards
     - an option or upgrade that makes the HULL price negative - still shows. */
  check(p - (u.adj || 0) >= 0, where, "unitPts negative before the adjustment: " + (p - (u.adj || 0)), ctx);
  /* The ceiling price must cover the current price: it is the current price + the open ones. */
  check(mx >= p, where, "unitMaxPts " + mx + " < unitPts " + p, ctx);
}

/* Armament model: the row count must match the model, and every model row
   must be found on the card. So the card cannot silently drop a weapon. */
function checkArm(u, sh, h, where, ctx){
  const model = api.armModel(u, sh);
  const rows = (h.match(/<tr class="w(?: alt| ammo)?"/g) || []).length;
  check(model.length === rows, where,
        "model " + model.length + " rows != card " + rows, ctx);
  const grpRows = model.filter(r => r.grp);
  const grpKeys = new Set(grpRows.map(r => r.i));
  const tbodies = (h.match(/<tbody class="g">/g) || []).length;
  /* A group is a choice on the card only while it still has an alternative. A slot
     whose alternatives are gone (the swap is taken) prints as an ordinary
     weapon row without a round box and the word OR - the user 30.9.2026 saw "(o) OR
     Port weapons battery" over an empty one; armRowsHTML "solo" in the app,
     BACKLOG J157. This checker still expected one group body per model group,
     and because the RANDOM RUN is skipped in a --quick run, the difference went unnoticed
     until 7.10.2026 (281 findings). The expectation now follows the card's rule:
     a group body only for a slot of two or more rows, and a round box only
     on the rows of such a slot. The row count (above) still makes sure that no
     weapon is dropped. */
  const slotSize = {};
  grpRows.forEach(r => { slotSize[r.i] = (slotSize[r.i] || 0) + 1; });
  const choiceSlots = Object.keys(slotSize).filter(k => slotSize[k] >= 2).length;
  check(tbodies === choiceSlots, where,
        "group tbodies " + tbodies + " != choice slots in the model " + choiceSlots +
        " (model groups " + grpKeys.size + ")", ctx);
  const roundBoxes = (h.match(/<span class="rb(?: on)?"><\/span>/g) || []).length;
  const wantRound = grpRows.filter(r => slotSize[r.i] >= 2 && r.box).length;
  check(roundBoxes === wantRound, where,
        "round choice boxes " + roundBoxes + " != rows of choice slots " + wantRound, ctx);
  /* Exactly one "on" in every group of the model. */
  grpKeys.forEach(k => {
    const on = grpRows.filter(r => r.i === k && r.box === "on").length;
    check(on === 1, where, "model group " + k + " has " + on + " marked rows", ctx);
  });
}

/* A unit bought N at a time on one card: the resolved unit's
   R.squadron - escorts, and one-hit defences whose book type is
   Defence or Ground (Rulebook p.100). Reading the type word left platforms
   always one item in size. */
function squadOf(u){
  const R = api.resolveUnit(u);
  return R && R.squadron ? R.squadron : null;
}

/* A star fort (Ramilies p.500, Fortress-Monastery p.110) prints as two
   cards: the plan card and the rule card. Fleets p.501: "its weapons, hits and
   defences are divided up into four 'quadrants'" - so the plan card has
   four hit tracks and the quadrant weapon rows four times, the Basilica rows
   once. cardHTML() is the pair's rule card, for which checkCard and checkArm
   hold as they are (one armament table, the model's row count); this
   checks the other half of the pair. Other units have exactly one card. */
function checkCards(u, sh, h, where, ctx){
  const R = api.resolveUnit(u) || {};
  let cs;
  try{ cs = api.unitCards(u).map(c => c.html("top")); }
  catch(e){ fail(where, "unitCards threw: " + e.message, ctx); return; }
  if(R.card !== "fort"){
    check(cs.length === 1 && cs[0] === h, where, "unit cards " + cs.length + ", expected 1", ctx);
    return;
  }
  if(!check(cs.length === 2 && cs[1] === h, where, "fort cards " + cs.length + ", expected a pair", ctx)) return;
  const plan = cs[0];
  ["undefined", "NaN", "[object Object]"].forEach(bad => {
    check(!plan.includes(bad), where, "the plan card contains " + JSON.stringify(bad), ctx);
  });
  check(plan.length > 500 && /^<div class="k /.test(plan), where, "pohjakortti on tyhja", ctx);
  const act = (R.weapons || []).filter(w => w.state !== "hidden");
  const nq = act.filter(w => w.zone === "quadrant").length, nb = act.filter(w => w.zone === "basilica").length;
  const rows = (plan.match(/<tr style="--rw:#[0-9A-F]{6}">/gi) || []).length;
  check(rows === nq * 4 + nb, where, "plan card weapon rows " + rows + " != " + nq + " x 4 + " + nb, ctx);
  const badges = (plan.match(/class="bg" style="--bd:#[0-9A-F]{6}"/gi) || []).length;
  check(badges === rows, where, "plan card colour codes " + badges + " != " + rows, ctx);
  const bands = plan.match(/<div class="k-hits(?: cr)?">[\s\S]*?<\/div>/g) || [];
  const boxes = bands.reduce((a, b) => a + (b.match(/<i>\d+<\/i>/g) || []).length, 0);
  check(boxes === R.stats.hits * 4, where, "plan card hit boxes " + boxes + " != " + R.stats.hits + " x 4", ctx);
  check(!/class="k-hits/.test(h), where, "a damage track on the rule card, although the tracks are on the base card", ctx);
  /* every rule is on one card of the pair */
  const text = c => c.replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/\s+/g, " ");
  const both = text(plan) + " " + text(h);
  (R.rules || []).forEach(x => {
    const first = String(x.t || "").replace(/^\*\s*/, "").replace(/\s+/g, " ").slice(0, 40);
    check(both.includes(first), where, "a fort rule is missing from the pair: " + first, ctx);
  });
}

/* --------------------------------------------------- phase A: state fuzzing */

function fuzzUnit(li, si, ei, seed){
  const rand = rng(seed);
  const S = api.getS();
  S.li = li; S.limit = 2000; S.units = [];
  const en = LISTS[li].secs[si].ents[ei];
  const sh = SHIPS[String(en.r)];
  const u = { s: si, e: ei, ref: en.r, n: 1, opts: [], os: {}, name: "" };
  api.applyRequired(u);
  S.units.push(u);

  if(squadOf(u)) u.n = 1 + Math.floor(rand() * 6);
  if(rand() < .25) u.name = "Test name " + Math.floor(rand() * 1000);
  if(rand() < .15) u.note = "Fleet note " + Math.floor(rand() * 100);
  if(rand() < .10) u.adj = Math.floor(rand() * 40) - 10;
  if(en.p == null) u.custom = Math.floor(rand() * 300);

  (sh.ol || []).forEach((o, i) => {
    if(rand() < .75) api.setOptState(u, i, STATES[Math.floor(rand() * 3)]);
  });
  const ups = api.upgradesFor(u);
  ups.own.concat(ups.other).forEach(x => {
    if(rand() < .6) api.setUpState(u, x[0], x[1], STATES[Math.floor(rand() * 3)]);
  });

  const ctx = { list: LISTS[li].nm, ship: sh.nm, seed,
                os: JSON.stringify(u.os), ups: JSON.stringify(u.ups || {}) };
  const where = "A state fuzzing";
  let h;
  try{
    h = api.cardHTML(u, "top");
  }catch(e){
    fail(where, "cardHTML threw: " + e.message, ctx);
    return;
  }
  check(typeof h === "string" && h.length > 500, where, "the card is empty", ctx);
  if(typeof h !== "string") return;
  checkCard(h, where, ctx);
  checkArm(u, sh, h, where, ctx);
  checkCards(u, sh, h, where, ctx);
  checkPoints(u, where, ctx);
  cases++;
}

/* A hull-less count row (Orbital mine p.512, Minefield p.513): a rule card
   with as many record boxes as items bought, priced at the unit price
   times the count (the p.499 price row). */
function fuzzRule(li, si, ei, seed){
  const rand = rng(seed);
  const S = api.getS();
  S.li = li; S.limit = 2000; S.units = [];
  const en = LISTS[li].secs[si].ents[ei];
  const u = { s: si, e: ei, ref: null, n: 1 + Math.floor(rand() * 12), opts: [], os: {}, name: "" };
  api.applyRequired(u);
  S.units.push(u);
  if(rand() < .15) u.note = "Fleet note " + Math.floor(rand() * 100);
  if(rand() < .10) u.adj = Math.floor(rand() * 40) - 10;
  const ctx = { list: LISTS[li].nm, ship: en.l, seed, os: "n=" + u.n };
  const where = "A rule card";
  let h;
  try{ h = api.cardHTML(u, "top"); }
  catch(e){ fail(where, "cardHTML threw: " + e.message, ctx); return; }
  check(typeof h === "string" && h.length > 500, where, "the rule card is empty", ctx);
  if(typeof h !== "string") return;
  ["undefined", "NaN", "[object Object]"].forEach(bad => {
    check(!h.includes(bad), where, "the rule card contains " + JSON.stringify(bad), ctx);
  });
  const R = api.resolveUnit(u) || {};
  const ticks = h.split('<i class="rtk"></i>').length - 1, sizes = h.split('<i class="rwr"></i>').length - 1;
  if(R.ruleCard && R.ruleCard.track && R.ruleCard.track.kind === "size")
    check(sizes === 2 * u.n && ticks === 0, where, "size boxes " + sizes + " != 2 x " + u.n, ctx);
  else
    check(ticks === u.n, where, "tick boxes " + ticks + " != bought " + u.n, ctx);
  check(api.unitPts(u) === en.p * u.n + (u.adj || 0), where,
        "price " + api.unitPts(u) + " != " + en.p + " x " + u.n + " + adjustment " + (u.adj || 0), ctx);
  checkCards(u, null, h, where, ctx);
  checkPoints(u, where, ctx);
  cases++;
}

/* ------------------------------------------- phase B: extreme values per ship */

function extremes(li, si, ei){
  const S = api.getS();
  const en = LISTS[li].secs[si].ents[ei];
  const sh = SHIPS[String(en.r)];
  ["off", "opt", "take"].forEach(st => {
    S.li = li; S.limit = 2000; S.units = [];
    const u = { s: si, e: ei, ref: en.r, n: 1, opts: [], os: {}, name: "" };
    api.applyRequired(u);
    S.units.push(u);
    if(squadOf(u)) u.n = st === "take" ? 6 : 1;
    (sh.ol || []).forEach((o, i) => api.setOptState(u, i, st));
    const ups = api.upgradesFor(u);
    ups.own.concat(ups.other).forEach(x => api.setUpState(u, x[0], x[1], st));
    const ctx = { list: LISTS[li].nm, ship: sh.nm, all: st };
    const where = "B extreme all=" + st;
    let h;
    try{
      h = api.cardHTML(u, "top");
    }catch(e){
      fail(where, "cardHTML threw: " + e.message, ctx);
      return;
    }
    checkCard(h, where, ctx);
    checkArm(u, sh, h, where, ctx);
    checkCards(u, sh, h, where, ctx);
    checkPoints(u, where, ctx);
    /* With everything taken the price must be at least the hull price - minus the
       options that by the book make the ship CHEAPER. There are four of them
       (Mercury -20, Victory -10, Dominator -5, Warsphere -20), and
       with everything taken they do belong in the price. */
    if(st === "take" && en.p != null){
      const drop = (sh.ol || []).reduce((a, o) =>
        a + (o.c < 0 ? o.c * (squadOf(u) ? api.hulls(u) : 1) : 0), 0);
      /* ...and percentage discounts: a ship bought through the Webway Portal
         costs half (Fleets p.337, J175), with everything taken too. */
      const pct = ups.own.concat(ups.other).reduce((a, x) => a + (x[2].pct < 0 ? x[2].pct : 0), 0);
      const floor = Math.floor((en.p + drop) * (100 + pct) / 100);
      check(api.unitPts(u) >= floor, where,
            "with everything taken the price " + api.unitPts(u) + " < hull " +
            en.p + (drop ? " " + drop : "") + (pct ? " " + pct + " %" : ""), ctx);
    }
    cases++;
  });
}

/* ------------------------------------------- phase C: fleet level + save */

function fuzzFleet(li, seed){
  const rand = rng(seed);
  const S = api.getS();
  S.li = li; S.limit = [750, 1000, 1500, 2000][Math.floor(rand() * 4)];
  S.units = [];
  const picks = [];
  LISTS[li].secs.forEach((sec, si) => sec.ents.forEach((en, ei) => {
    if(en.r && SHIPS[String(en.r)]) picks.push([si, ei]);
    else if(!en.r && en.k === "unit" && en.cnt) picks.push([si, ei]);   /* mines, minefields */
  }));
  if(!picks.length) return;
  const n = 1 + Math.floor(rand() * 12);
  for(let i = 0; i < n; i++){
    const [si, ei] = picks[Math.floor(rand() * picks.length)];
    const en = LISTS[li].secs[si].ents[ei];
    const u = { s: si, e: ei, ref: en.r || null, n: 1, opts: [], os: {}, name: "" };
    api.applyRequired(u);
    if(api.isEscort(u) || !en.r) u.n = 1 + Math.floor(rand() * 6);
    if(en.p == null) u.custom = Math.floor(rand() * 200);
    const sh = en.r ? SHIPS[String(en.r)] : {};
    (sh.ol || []).forEach((o, k) => {
      if(rand() < .5) api.setOptState(u, k, STATES[Math.floor(rand() * 3)]);
    });
    S.units.push(u);
  }
  const ctx = { list: LISTS[li].nm, seed, units: S.units.length };
  const where = "C fleet";
  let tot, mx, ch;
  try{
    tot = api.total(); mx = api.totalMax(); ch = api.checks();
  }catch(e){
    fail(where, "the fleet calculation threw: " + e.message, ctx);
    return;
  }
  check(Number.isFinite(tot), where, "total is not a number: " + tot, ctx);
  check(Number.isFinite(mx), where, "totalMax is not a number: " + mx, ctx);
  check(mx >= tot, where, "totalMax " + mx + " < total " + tot, ctx);
  check(Array.isArray(ch), where, "checks does not return a list", ctx);
  ch.forEach(c => {
    check(typeof c.ok === "boolean", where, "a check row has no ok", ctx);
    check(!String(c.v).includes("NaN"), where, "NaN on a check row: " + c.v, ctx);
  });

  /* Save and load: the state must survive. */
  const before = { tot, mx, units: S.units.length,
                   os: S.units.map(u => JSON.stringify(u.os || {})).join("|") };
  try{
    api.save();
    api.load();
  }catch(e){
    fail(where, "save/load threw: " + e.message, ctx);
    return;
  }
  const S2 = api.getS();
  check(S2.units.length === before.units, where,
        "after loading " + S2.units.length + " units, there were " + before.units, ctx);
  const after = { tot: api.total(), mx: api.totalMax(),
                  os: S2.units.map(u => JSON.stringify(u.os || {})).join("|") };
  check(after.tot === before.tot, where,
        "the points changed in saving " + before.tot + " -> " + after.tot, ctx);
  check(after.mx === before.mx, where,
        "the ceiling price changed in saving " + before.mx + " -> " + after.mx, ctx);
  check(after.os === before.os, where, "the option states changed in saving", ctx);
  cases++;
}

/* ---------------------------------------------------------------- run */

console.log("Stress test: " + ROUNDS + " random rounds / ship\n");

let seed = 1;
LISTS.forEach((L, li) => {
  L.secs.forEach((sec, si) => sec.ents.forEach((en, ei) => {
    if(!en.r && en.k === "unit" && en.cnt){
      /* a hull-less rule card row: its own seed space, so that the ships' seeds
         (and their repeatability) do not shift */
      for(let r = 0; r < ROUNDS; r++) fuzzRule(li, si, ei, 900000 + li * 1000 + si * 50 + ei * 7 + r);
      return;
    }
    if(!en.r || !SHIPS[String(en.r)]) return;
    for(let r = 0; r < ROUNDS; r++) fuzzUnit(li, si, ei, seed++);
    extremes(li, si, ei);
  }));
  for(let r = 0; r < 8; r++) fuzzFleet(li, seed++);
});

const byMsg = {};
found.forEach(f => {
  const key = f.where + " | " + f.msg.replace(/\d+/g, "N");
  (byMsg[key] = byMsg[key] || []).push(f);
});
Object.entries(byMsg).sort((a, b) => b[1].length - a[1].length).forEach(([k, v]) => {
  console.log("\n== " + k + "  (" + v.length + ") ==");
  v.slice(0, VERBOSE ? 20 : 4).forEach(f => {
    console.log("   " + f.ctx.list + " | " + (f.ctx.ship || "-") + " | " +
                f.msg.slice(0, 90));
    if(f.ctx.seed) console.log("      seed " + f.ctx.seed +
      (f.ctx.os ? "  os=" + String(f.ctx.os).slice(0, 90) : ""));
  });
});

console.log("\nCases " + cases + ", checks " + checksRun +
            ", findings " + found.length);
process.exitCode = found.length ? 1 : 0;
