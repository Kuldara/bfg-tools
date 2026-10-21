/* Pelisivun syotemittarin tapahtumanauha simulaattorin peleista.

   Simulaattori (../../../simulaattorit yms/simulaattori, oma git-repo) pelaa
   Joonan 1200-listat vastustajia vastaan. Tama skripti kuuntelee pelin
   vauriofunktioita ja kirjaa MITATTAVAN puolen (A) alusten tapahtumat siina
   jarjestyksessa kuin ne pelissa sattuivat:

     turn  {t, f}         puolen f vuoro alkaa (f = "A" oma, "B" vastustaja)
     act   {s}            oma alus aktivoituu omalla vuorollaan (liike + tuli)
     hit   {s, n}         n vauriota (ei tulipaloa, ei kritin lisavauriota)
     crit  {s, roll}      kriittinen vaurio, lopullinen tulos (s. 67)
     xtra  {s, n}         kriittisen 11/12 heitetty lisavaurio (D3/D6)
     fire  {s, n}         tulipalon vaurio End Phasessa (s. 67)
     repair {s, roll}     korjattu kriittinen (s. 88)
     kill  {s}            escort tuhoutui (s. 66, 71)
     cata  {s, kind}      capital ship nollassa: drifting / blazing / gone (s. 71)

   s on simulaattorin aluksen indeksi rosterissa; ships-lista kertoo nimen ja
   tyypin, jotta mittaa.js voi sovittaa sen pelisivun yksikkoon.

     node play/mittari/tee_tapahtumat.js [peleja per lista, oletus 3]
   -> play/mittari/tapahtumat.json

   Simulaattorin tekoaly ei ole ihminen, mutta osumat, kritit, tulipalot ja
   tuhot jakautuvat pelin mukaan eika arvaamalla. Mittari kertoo, montako
   syotetta pelisivu vaatii saman pelin kirjaamiseen. */
"use strict";
const fs = require("fs"), path = require("path");
const SIM = path.resolve(__dirname, "../../../simulaattorit yms/simulaattori");
const lib = require(path.join(SIM, "tools/lib"));
lib.loadEngine();
const { Game } = global.BFGEngine;
const { ROSTERS } = global.BFG;

const GAMES = Math.max(1, parseInt(process.argv[2] || "3", 10));
/* mitattavat listat (simulaattorin id -> rosters.json:n nimi) ja vastustajat
   kiertona, jotta vauriot tulevat eri aseista */
const LISTS = [
  ["joona_tyranids", "Tyranids 1200"], ["joona_orks", "Orks 1200"], ["joona_admech", "AdMech 1200"],
  ["joona_chaos", "World Eaters 1200"], ["joona_spacemarines", "Space Marines 1200"],
  ["joona_eldar", "Eldar Corsairs 1200"], ["joona_necrons", "Necrons 1200"]
];
const OPPS = ["kalle_tyranids", "joona_chaos", "joona_orks", "joona_spacemarines", "joona_tau", "joona_eldar", "joona_bastion"];

/* --- kuuntelijat ------------------------------------------------------ */
let REC = null;               /* nykyisen pelin kirjuri */
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
    /* korjaus tarvitsee tuloksen numeron: kiinnitetaan se tallennettuun */
    if(target.crits.length > n0) target.crits[target.crits.length - 1]._roll = c.roll;
    /* 6 ja 8 (+1) lisaa pelisivu itse; vain D3/D6 kysytaan */
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

/* --- pelit -------------------------------------------------------------- */
const out = { made: new Date().toISOString().slice(0, 10), games: [] };
LISTS.forEach(([id, roster], li) => {
  const ra = ROSTERS[id];
  if(!ra) throw new Error("simulaattorissa ei ole listaa " + id);
  for(let g = 0; g < GAMES; g++){
    const opp = OPPS[(li + g) % OPPS.length] === id ? "kalle_tyranids" : OPPS[(li + g) % OPPS.length];
    const rb = ROSTERS[opp];
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
const dst = path.join(__dirname, "tapahtumat.json");
fs.writeFileSync(dst + ".tmp", JSON.stringify(out));
fs.renameSync(dst + ".tmp", dst);
const tally = {};
out.games.forEach(g => g.ev.forEach(e => { tally[e.k] = (tally[e.k] || 0) + 1; }));
console.log(out.games.length + " pelia -> " + path.relative(process.cwd(), dst));
console.log(Object.keys(tally).map(k => k + " " + tally[k]).join(", "));
