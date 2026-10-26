/* The event tape for the play page's input meter, from simulator games.

   The simulator (a separate, private repository; point BFG_SIMULATOR at it) plays
   the owner's 1200-point lists against opponents. This script listens to the game's
   damage functions and records the events of the MEASURED side's (A) ships in the
   order they happened in the game:

     turn  {t, f}         side f's turn starts (f = "A" own, "B" opponent)
     act   {s}            an own ship activates on its own turn (move + fire)
     hit   {s, n}         n damage (not fire, not a critical's extra damage)
     crit  {s, roll}      a critical hit, the final result (p. 67)
     xtra  {s, n}         the extra damage rolled for critical 11/12 (D3/D6)
     fire  {s, n}         fire damage in the End Phase (p. 67)
     repair {s, roll}     a repaired critical (p. 88)
     kill  {s}            an escort was destroyed (p. 66, 71)
     cata  {s, kind}      a capital ship at zero: drifting / blazing / gone (p. 71)

   s is the index of the simulator's ship in the roster; the ships list gives its name and
   type, so that measure.js can match it to a unit on the play page.

     BFG_SIMULATOR=<path> BFG_SIM_OWN=<prefix> BFG_SIM_OPP=<prefix> \
       node apps/play/metrics/make_tape.js [games per list, default 3]
   -> apps/play/metrics/tape.json

   The simulator names its preset lists after the players who own them; this
   repository does not. Here a list is own_<faction> (the measured player's)
   or opp_<faction> (the opponent's), and BFG_SIM_OWN / BFG_SIM_OPP give the
   simulator's key prefix for each (its keys are <prefix><faction>).

   The simulator's AI is not a person, but the hits, criticals, fires and
   kills are spread as the game goes and not by guessing. The meter tells how many
   inputs the play page needs to record the same game. */
"use strict";
const fs = require("fs"), path = require("path");
const SIM = process.env.BFG_SIMULATOR;
if(!SIM){ console.error("Set BFG_SIMULATOR to the simulator checkout (a separate, private repository)."); process.exit(2); }
const PREFIX = { own: process.env.BFG_SIM_OWN, opp: process.env.BFG_SIM_OPP };
if(!PREFIX.own || !PREFIX.opp){ console.error("Set BFG_SIM_OWN and BFG_SIM_OPP to the simulator's key prefixes of the two players' lists."); process.exit(2); }
const lib = require(path.join(SIM, "tools/lib"));
lib.loadEngine();
const { Game } = global.BFGEngine;
const { ROSTERS } = global.BFG;

const GAMES = Math.max(1, parseInt(process.argv[2] || "3", 10));
/* the measured lists (list id -> name in rosters.json) and the opponents
   in rotation, so that the damage comes from different weapons */
const LISTS = [
  ["own_tyranids", "Tyranids 1200"], ["own_orks", "Orks 1200"], ["own_admech", "AdMech 1200"],
  ["own_chaos", "World Eaters 1200"], ["own_spacemarines", "Space Marines 1200"],
  ["own_eldar", "Eldar Corsairs 1200"], ["own_necrons", "Necrons 1200"]
];
const OPPS = ["opp_tyranids", "own_chaos", "own_orks", "own_spacemarines", "own_tau", "own_eldar", "own_bastion"];
/* own_tyranids -> the simulator's <BFG_SIM_OWN>tyranids */
const simList = id => { const m = /^(own|opp)_(.+)$/.exec(id); return ROSTERS[PREFIX[m[1]] + m[2]]; };

/* --- listeners -------------------------------------------------------- */
let REC = null;               /* the recorder of the current game */
const P = Game.prototype;
const wrapGen = (name, fn) => { const orig = P[name]; P[name] = function*(...a){ return yield* fn.call(this, orig, ...a); }; };
const wrap = (name, fn) => { const orig = P[name]; P[name] = function(...a){ return fn.call(this, orig, ...a); }; };
const mine = s => REC && s && s.fleet === "A";
const sx = s => REC.idx.get(s.id);

wrapGen("say", function*(orig, text, cls){
  if(REC && cls === "turnhead"){
    REC.ev.push({ k: "turn", t: this.turn, f: this.activeFleet });
    if(this.activeFleet === "A") this.ships.filter(s => s.fleet === "A" && !s.dead && !s.hulk && s.hits > 0).forEach(s => REC.ev.push({ k: "act", s: sx(s) }));
  }
  return yield* orig.call(this, text, cls);
});
wrap("rawDamage", function(orig, target, n, attacker, source){
  const before = target.hits;
  const out = orig.call(this, target, n, attacker, source);
  const got = before - target.hits;
  if(mine(target) && got > 0 && !REC.quiet){
    /* "kriittinen" and "tulipalo" are the simulator's own source codes (critical, fire) */
    if(source === "kriittinen") REC.ev.push({ k: "xtra", s: sx(target), n: got });
    else REC.ev.push({ k: source === "tulipalo" ? "fire" : "hit", s: sx(target), n: got });
  }
  return out;
});
wrap("applyCritical", function(orig, target, attacker, forced){
  const n0 = target.crits.length;
  const c = orig.call(this, target, attacker, forced);
  if(c && mine(target)){
    REC.ev.push({ k: "crit", s: sx(target), roll: c.roll, key: c.def.key });
    /* a repair needs the result's number: it is pinned to the stored critical */
    if(target.crits.length > n0) target.crits[target.crits.length - 1]._roll = c.roll;
    /* 6 and 8 (+1) the play page adds itself; only D3/D6 are asked */
    const last = REC.ev[REC.ev.length - 1];
    if(c.extra > 0 && (c.def.dmg === "D3" || c.def.dmg === "D6")) last.extra = c.extra;
  }
  return c;
});
wrapGen("destroyEscort", function*(orig, target, attacker, source){
  if(mine(target) && !target.dead){
    REC.ev.push({ k: "kill", s: sx(target) });
    REC.quiet = true;
    try{ return yield* orig.call(this, target, attacker, source); } finally { REC.quiet = false; }
  }
  return yield* orig.call(this, target, attacker, source);
});
wrapGen("catastrophic", function*(orig, target, attacker, again){
  if(!mine(target) || again) return yield* orig.call(this, target, attacker, again);
  REC.quiet = true;
  let out;
  try{ out = yield* orig.call(this, target, attacker, again); } finally { REC.quiet = false; }
  REC.ev.push({ k: "cata", s: sx(target), kind: target.dead && !target.hulk ? "gone" : target.blazing ? "blazing" : "drifting" });
  return out;
});
wrapGen("repair", function*(orig, ship){
  const before = mine(ship) ? ship.crits.slice() : null;
  const out = yield* orig.call(this, ship);
  if(before) before.filter(c => ship.crits.indexOf(c) < 0).forEach(c => REC.ev.push({ k: "repair", s: sx(ship), roll: c._roll || null, key: c.key }));
  return out;
});

/* --- games -------------------------------------------------------------- */
const out = { made: new Date().toISOString().slice(0, 10), games: [] };
LISTS.forEach(([id, roster], li) => {
  const ra = simList(id);
  if(!ra) throw new Error("the simulator has no list for " + id);
  for(let g = 0; g < GAMES; g++){
    const opp = OPPS[(li + g) % OPPS.length] === id ? "opp_tyranids" : OPPS[(li + g) % OPPS.length];
    const rb = simList(opp);
    if(!rb) throw new Error("the simulator has no list for " + opp);
    const opts = { scenarioType: "fleetengagement", factions: { A: ra.faction, B: rb.faction }, fleets: { A: ra.ships, B: rb.ships },
                   skills: { A: 100, B: 100 }, squadrons: { A: ra.squads || [], B: rb.squads || [] }, rerolls: { A: ra.rerolls || 0, B: rb.rerolls || 0 } };
    const seed = 1000 + li * 37 + g;
    REC = { ev: [], idx: new Map(), quiet: false };
    const game = new Game(seed, Object.assign({}, opts, { headless: true }));
    const shipsA = game.ships.filter(s => s.fleet === "A");
    shipsA.forEach((s, k) => REC.idx.set(s.id, k));
    const it = game.play();
    let guard = 0;
    while(!it.next().done){ if(++guard > 400000) break; }
    out.games.push({ list: id, roster, opp, seed, turns: game.turn,
      ships: shipsA.map(s => ({ name: s.profile.name, type: s.profile.type, hits: s.hitsMax })),
      squads: ra.squads || [], ev: REC.ev });
    REC = null;
  }
});
const dst = path.join(__dirname, "tape.json");
fs.writeFileSync(dst + ".tmp", JSON.stringify(out));
fs.renameSync(dst + ".tmp", dst);
const tally = {};
out.games.forEach(g => g.ev.forEach(e => { tally[e.k] = (tally[e.k] || 0) + 1; }));
console.log(out.games.length + " games -> " + path.relative(process.cwd(), dst));
console.log(Object.keys(tally).map(k => k + " " + tally[k]).join(", "));
