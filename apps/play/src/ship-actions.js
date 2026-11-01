import { appState } from "./state.js";
import { MID } from "./helpers.js";
import { OPT } from "./storage.js";
import { isEscGrp } from "./game-state.js";
import { act, groupUnits } from "./actions.js";
import { unitName } from "./derived.js";
import { render } from "./render.js";
import { peerHas, withPeer } from "./peer.js";
import { esc } from "../../../packages/ui/format.js";
import { TERR_SHORT } from "../../../packages/ui/celestial.js";
import PLAY from "../rules.js";

/* ======================================================= A SHIP'S ACTIONS == */
/* The Actions button on a ship's card: what a ship may try beside moving and
   shooting. Each helper says the rule with its page, works out the dice, and
   rolls if asked; own dice are as good (Passed, Failed). A result goes on the
   ship through act(), so UNDO takes it back. RULINGS.md T46. */

const rollN = n => Array.from({ length: n }, () => PLAY.d6());
const sum = a => a.reduce((x, y) => x + y, 0);
const CLOSE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';
/* the ships a test covers: an escort squadron goes together, a capital ship
   alone (p. 57) */
function covers(i){
  const g = appState.G.grp[i];
  return isEscGrp(g) ? groupUnits(g) : [i];
}
/* Leadership for these tests: the ship's own, with a smashed bridge. p. 48's
   Under Fire and enemy contacts are "Command check modifiers"; disengaging has
   its own list (p. 56). A squadron of escorts tests on its highest. */
function testLd(i){
  const ms = covers(i), lds = ms.map(j => { const st = appState.G.st[j]; return st.ld == null ? null : st.ld + (st.ldPerm | 0); }).filter(v => v != null);
  return lds.length ? Math.max.apply(null, lds) : null;
}
/* the first free re-roll, the fleet's or the ship's own */
function freeRR(i){
  const G = appState.G;
  for(const [pool, who] of [[G.fleet, -1], [G.st[i], i]]){
    const k = PLAY.rerollBoxes(pool).findIndex(b => !b.used && !b.lost);
    if(k >= 0) return { who, k };
  }
  return null;
}

export function shipAct(name, el){
  const V = appState.V;
  const argS = () => el.getAttribute("data-arg");
  if(name === "actions"){ V.actions = { i: parseInt(el.getAttribute("data-i"), 10), tab: "", size: 1, armour: 5, hits: 8, headOn: false, blast: 0, enemies: 0, celestial: false, res: null }; render(); return true; }
  const A = V.actions;
  if(!A) return false;
  const st = appState.G.st[A.i];
  if(name === "acclose"){ V.actions = null; render(); return true; }
  if(name === "actab"){
    A.tab = argS(); A.res = null; A.cel = "";
    if(A.tab === "dis") A.blast = st.blast | 0;
    render(); return true;
  }
  /* a value of the helper: "field:value", or "field:+1" */
  if(name === "acset"){
    const [f, v] = argS().split(":");
    if(/^[+-]/.test(v)) A[f] = Math.max(f === "hits" ? 1 : 0, (A[f] | 0) + parseInt(v, 10));
    else A[f] = v === "true" ? true : v === "false" ? false : parseInt(v, 10);
    A.res = null; render(); return true;
  }
  /* an enemy ship from the linked fleet fills the target in */
  if(name === "acfoe"){
    const j = parseInt(argS(), 10);
    withPeer(() => { const R = appState.U[j].R; A.size = PLAY.ramSize(R); A.hits = PLAY.ramDice(R); A.armour = PLAY.frontArmour(R) || A.armour; A.foe = j; });
    A.res = null; render(); return true;
  }
  if(name === "acdis"){
    const ld = PLAY.disengageLd(testLd(A.i), A.blast, A.celestial, A.enemies);
    const how = argS(), dice = how === "roll" ? rollN(2) : null;
    const ok = dice ? PLAY.disengagePasses(ld, sum(dice)) : how === "pass";
    act("disengage", A.i, { ok: ok, ms: covers(A.i) });
    A.res = { ok: ok, dice: dice, ld: ld }; render(); return true;
  }
  if(name === "acramtest"){
    const n = PLAY.ramTestDice(PLAY.ramSize(appState.U[A.i].R), A.size), ld = testLd(A.i);
    const how = argS(), dice = how === "roll" ? rollN(n) : null;
    const ok = dice ? sum(dice) <= ld : how === "pass";
    A.res = { test: ok, dice: dice, ld: ld, n: n }; render(); return true;
  }
  if(name === "acramroll"){
    const R = appState.U[A.i].R, mine = rollN(PLAY.ramDice(R)), def = A.size === 3;
    const theirs = rollN(PLAY.rammedDice(A.hits, A.headOn, def));
    const auto = PLAY.powerRam(R) ? 1 : 0;
    /* a defence always rolls "as if prow-on" (p. 56): against the front */
    const front = PLAY.frontArmour(R);
    const dealt = PLAY.ramHits(mine, A.armour) + auto, taken = PLAY.ramHits(theirs, front);
    A.res = Object.assign({}, A.res, { mine, theirs, dealt, taken, auto, front });
    if(taken) act("ramhits", A.i, taken); else render();
    if(!appState.G.st[A.i] || PLAY.destroyed(R, appState.G.st[A.i])) V.actions = null;
    render(); return true;
  }
  if(name === "actele"){
    const how = argS(), d = how === "roll" ? PLAY.d6() : parseInt(how, 10);
    act("teleported", A.i);
    A.res = { d: d, how: how };
    render(); return true;
  }
  if(name === "accel"){ A.cel = argS(); A.res = null; render(); return true; }
  if(name === "accelback"){ A.cel = ""; A.res = null; render(); return true; }
  /* asteroids (p. 110): the test, then D6 damage against the shields */
  if(name === "acast"){
    const how = argS(), ld = testLd(A.i), n = PLAY.asteroidTestDice(st);
    const dice = how === "roll" ? rollN(n) : null;
    A.res = { test: dice ? sum(dice) <= ld : how === "pass", dice: dice, ld: ld, n: n, again: !!(A.res && A.res.again) };
    render(); return true;
  }
  if(name === "acastagain"){
    const ld = A.res.ld, dice = rollN(A.res.n);
    A.res = Object.assign({}, A.res, { test: sum(dice) <= ld, dice: dice, again: true });
    render(); return true;
  }
  if(name === "acastdmg"){
    const R = appState.U[A.i].R, how = argS(), d = how === "roll" ? PLAY.d6() : parseInt(how, 10);
    const up = PLAY.view(R, st, appState.G.fleet).shields.up;
    const hits = PLAY.asteroidHits(d, up);
    A.res = Object.assign({}, A.res, { d: d, up: up | 0, hits: hits });
    /* an escort squadron shares it among the ships that touched (p. 110): theirs to tap */
    if(hits && !PLAY.isEscort(R)) act("ramhits", A.i, hits);
    if(PLAY.destroyed(R, appState.G.st[A.i])) V.actions = null;
    render(); return true;
  }
  /* a warp rift (pp. 111-112): through it, or lost in the warp */
  if(name === "acrift"){
    const how = argS(), ld = testLd(A.i), n = PLAY.riftTestDice(appState.U[A.i].R);
    const dice = how === "roll" ? rollN(n) : null, ok = dice ? sum(dice) <= ld : how === "pass";
    const far = ok ? rollN(2) : null;
    if(!ok) act("disengage", A.i, { ok: true, ms: [A.i] });
    A.res = { test: ok, dice: dice, ld: ld, far: far };
    render(); return true;
  }
  /* the cloud works as one Blast Marker (p. 110) */
  if(name === "acgas"){ act("blast", A.i, 1); A.res = { marked: true }; render(); return true; }
  /* the failed roll taken back and made again with one re-roll (p. 48) */
  if(name === "acreroll"){
    const free = freeRR(A.i), kind = argS(), prev = A.res;
    if(!free) return true;
    if(kind === "dis") act("undo");
    act("rrbox", free.who, free.k);
    const dice = rollN(kind === "dis" ? 2 : prev.n);
    if(kind === "dis"){
      const ok = PLAY.disengagePasses(prev.ld, sum(dice));
      act("disengage", A.i, { ok: ok, ms: covers(A.i) });
      A.res = { ok: ok, dice: dice, ld: prev.ld };
    }else A.res = Object.assign({}, prev, { test: sum(dice) <= prev.ld, dice: dice });
    render(); return true;
  }
  return false;
}

/* ------------------------------------------------------------- the sheet --- */
const chip = (act2, arg, label, on, extra) => `<button class="bchip${on ? " on" : ""}" data-act="${act2}" data-arg="${esc(String(arg))}"${extra || ""}>${label}</button>`;
const stepper = (f, val, sub) => `<div class="steprow"><button data-act="acset" data-arg="${f}:-1" aria-label="Less">&minus;</button><div class="val">${val}<small>${sub}</small></div><button data-act="acset" data-arg="${f}:+1" aria-label="More">+</button></div>`;
const diceLine = d => d ? `<b>${d.join(" ")}</b>${d.length > 1 ? " = " + sum(d) : ""}` : "";
const backBtn = `<button class="btn sec" data-act="actab" data-arg="">All actions</button>`;

function teleportBar(i){
  const R = appState.U[i].R, st = appState.G.st[i];
  if(PLAY.isEscort(R)) return "escort";
  if(PLAY.crippled(R, st)) return "crippled ships may not (p. 92)";
  if(st.teleported) return "already this turn (p. 92)";
  if(OPT.orders && st.order !== "LO" && st.order !== "RO") return "needs Lock On or Reload Ordnance (p. 92)";
  return "";
}
function renderMain(i){
  const R = appState.U[i].R, st = appState.G.st[i];
  const still = PLAY.isStill(R), bar = teleportBar(i);
  const row = (tab, name, sub, off) => `<button class="btn sec" data-act="${tab === "board" ? "board" : "actab"}"${tab === "board" ? ` data-i="${i}"` : ` data-arg="${tab}"`}${off ? " disabled" : ""}>${name}<small>${sub}</small></button>`;
  return [
    row("board", "Board", "base contact, End Phase (Rulebook p. 89)"),
    still ? "" : row("ram", "Ram", "All Ahead Full, the dice and the damage (p. 55)"),
    still ? "" : row("dis", "Disengage", st.noOrdersTurn ? "failed this turn: no fire, no orders but Brace (p. 57)" : "end of the Movement Phase, Leadership test (p. 56)"),
    bar === "escort" ? "" : row("tele", "Teleport attack", bar || "End Phase, shields down, within 10 cm (p. 92)", !!bar),
    row("cel", "Celestial phenomena", "asteroids, clouds, warp rifts, planets, flares (pp. 109-115)")
  ].join("");
}
function renderDis(i){
  const A = appState.V.actions, ld = testLd(i), r = A.res;
  if(ld == null) return `<p class="foot">Set this ship's Leadership first.</p>${backBtn}`;
  const total = PLAY.disengageLd(ld, A.blast, A.celestial, A.enemies);
  const R = appState.U[i].R, esq = PLAY.isEscort(R);
  const rr = r && !r.ok && r.dice && freeRR(i);
  const after = !r ? "" : r.ok
    ? `<p class="acres ok">${r.dice ? diceLine(r.dice) + " against Ld " + r.ld + ": " : ""}<b>Disengaged.</b> ${esq ? "The squadron leaves" : "It leaves"} the table and may not return. For the enemy it counts 10% of its points, 25% if crippled first (p. 57).</p>`
    : `<p class="acres bad">${r.dice ? diceLine(r.dice) + " against Ld " + r.ld + ": " : ""}<b>Failed.</b> It stays, and may not fire, launch ordnance or use special orders except Brace this turn (p. 57).</p>${rr ? `<button class="btn sec" data-act="acreroll" data-arg="dis">Re-roll<small>uses one re-roll</small></button>` : ""}`;
  return `<p class="foot">At the end of its Movement Phase. ${esq ? "The squadron goes together: if one ship disengages, all must (p. 57)." : appState.G.grp[i] ? "A capital ship in a squadron tests alone, and a failure takes it out of the squadron (p. 57)." : ""}</p>
    <p class="aclab">Blast Markers within 5 cm: +1 each</p>${stepper("blast", A.blast, "+" + A.blast)}
    <p class="aclab">Enemy ships and ordnance markers within 15 cm: &minus;1 each</p>${stepper("enemies", A.enemies, "&minus;" + A.enemies)}
    <div class="bchips acgap">${chip("acset", "celestial:" + !A.celestial, "Celestial phenomena within 15 cm: +3", A.celestial)}</div>
    <p class="actotal">Ld ${ld} ${MID} roll 2D6, <b>${Math.min(total, 10)} or under</b>${total > 10 ? ` (Ld ${total}, but 11 and 12 fail)` : ""}</p>
    ${r ? after : `<div class="r4"><button data-act="acdis" data-arg="roll">Roll 2D6</button><button data-act="acdis" data-arg="pass">Passed</button><button data-act="acdis" data-arg="fail">Failed</button></div>`}
    ${backBtn}`;
}
function renderRam(i){
  const A = appState.V.actions, R = appState.U[i].R, r = A.res, ld = testLd(i);
  if(ld == null) return `<p class="foot">Set this ship's Leadership first.</p>${backBtn}`;
  const n = PLAY.ramTestDice(PLAY.ramSize(R), A.size), def = A.size === 3;
  const foes = peerHas() ? withPeer(() => appState.U.map((x, j) => x.R.kind === "ship" && !PLAY.destroyed(x.R, appState.G.st[j]) ? chip("acfoe", j, esc(unitName(j)), A.foe === j) : "").join("")) : "";
  const back = PLAY.rammedDice(A.hits, A.headOn, def), mine = PLAY.ramDice(R), auto = PLAY.powerRam(R), front = PLAY.frontArmour(R);
  const own = (R.rules || []).filter(x => /\bram(s|ming)?\b/i.test(String(x.t)) && !/power ram/i.test(String(x.t))).map(x => `<p class="foot">${esc(String(x.t).replace(/^\*\s*/, ""))}</p>`).join("");
  const rr = r && r.test === false && r.dice && freeRR(i);
  let step;
  if(!r) step = `<div class="r4"><button data-act="acramtest" data-arg="roll">Roll ${n}D6</button><button data-act="acramtest" data-arg="pass">Passed</button><button data-act="acramtest" data-arg="fail">Failed</button></div>`;
  else if(!r.test) step = `<p class="acres bad">${r.dice ? diceLine(r.dice) + " against Ld " + r.ld + ": " : ""}<b>Missed.</b> It moves normally under All Ahead Full (p. 55).</p>${rr ? `<button class="btn sec" data-act="acreroll" data-arg="ram">Re-roll<small>uses one re-roll</small></button>` : ""}`;
  else if(r.mine == null) step = `<p class="acres ok">${r.dice ? diceLine(r.dice) + " against Ld " + r.ld + ": " : ""}<b>In position.</b> Move the full distance; on base contact, stop and resolve (p. 55).</p>
      <p class="actotal"><b>${mine}D6</b> against Armour ${A.armour}+${auto ? " + 1 automatic (power ram)" : ""}; they roll <b>${back}D6</b> against your ${front}+</p>
      <button class="btn" data-act="acramroll">Base contact: roll both</button>`;
  else step = `<p class="acres ok">You rolled ${r.mine.join(" ")}${r.auto ? " + power ram" : ""}: <b>${r.dealt} hit${r.dealt === 1 ? "" : "s"} on them</b>, no shields (p. 55). Tell them.</p>
      <p class="acres ${r.taken ? "bad" : "ok"}">They rolled ${r.theirs.join(" ")} against ${r.front}+: <b>${r.taken} hit${r.taken === 1 ? "" : "s"} on this ship</b>${r.taken ? ", marked" : ""}.</p>
      <p class="foot">An explosion is resolved now and catches both ships. Then finish the move; it may board only a ship it touches at the end of it (p. 56).</p>`;
  return `<p class="foot">Pass All Ahead Full, name the target, test Leadership, and only then roll the extra distance. One ram per Movement Phase; the choice cannot change (p. 55).</p>${own}
    ${foes ? `<p class="aclab">Their ship</p><div class="bchips">${foes}</div>` : ""}
    <p class="aclab">Target</p><div class="bchips">${PLAY.RAM_SIZES.map((s, k) => chip("acset", "size:" + k, s[0].toUpperCase() + s.slice(1), A.size === k)).join("")}</div>
    <p class="aclab">Its armour where you hit it</p><div class="bchips">${[3, 4, 5, 6].map(v => chip("acset", "armour:" + v, v + "+", A.armour === v)).join("")}</div>
    <p class="aclab">Its starting hits</p>${stepper("hits", A.hits, "not what it has left")}
    ${def ? `<p class="foot">A defence rolls its full starting hits, as if prow-on (p. 56).</p>` : `<div class="bchips acgap">${chip("acset", "headOn:false", "Side or rear", !A.headOn)}${chip("acset", "headOn:true", "Head on", A.headOn)}</div>`}
    <p class="actotal">Ld ${ld} ${MID} <b>${n}D6, ${ld} or under</b>${n === 3 ? " (smaller target)" : n === 1 ? " (larger target)" : " (same size)"}</p>
    ${step}${backBtn}`;
}
function renderTele(i){
  const r = appState.V.actions.res;
  const out = !r ? `<div class="r4"><button data-act="actele" data-arg="roll">Roll D6</button></div>`
    : r.d <= 1 ? `<p class="acres bad"><b>${r.d}: failed.</b></p>`
    : `<p class="acres ok"><b>${r.d}.</b> Tell them: critical ${r.d} on their table, repaired as normal (p. 92); an escort is destroyed on 4+.</p>`;
  return `<ul class="acchk"><li>End Phase, on Lock On or Reload Ordnance</li><li>The target has no shields and is within 10 cm</li><li>The target has no more hits left than this ship</li><li>Not crippled; one a turn</li></ul>
    <p class="foot">One Hit-and-Run attack: a 1 fails, 2 or more is that result on the Critical Hits table. A fleet's bonus to Hit-and-Run is yours to add (p. 92).</p>
    ${out}${backBtn}`;
}
/* ------------------------------------------------- celestial phenomena --- */
const CEL = [
  ["asteroid", "Asteroid field", "Ld test on contact, D6 damage (p. 110)"],
  ["gas", "Gas or dust cloud", "one Blast Marker that stays (p. 110)"],
  ["rift", "Warp rift", "Ld test, or lost in the warp (p. 111)"],
  ["planet", "Planet or moon", "gravity well, free turns, high orbit (p. 113)"],
  ["sun", "Sunward", "double column shifts toward the sun (p. 114)"],
  ["flare", "Solar flare", "start of each turn, on a 6 (p. 115)"],
  ["radiation", "Radiation burst", "start of each turn, on 5 or 6 (p. 115)"]
];
const list = a => `<ul class="acchk">${a.map(t => `<li>${esc(t)}</li>`).join("")}</ul>`;
const celBack = `<button class="btn sec" data-act="accelback">All phenomena</button>`;
const TEXT = {
  sun: ["Only in the Flare Region, Mercurial Zone and Inner Biosphere.", "Firing toward the sunward edge: over 30 cm two column shifts right; 15 cm or under two left (p. 114)."],
  flare: ["D6 at the start of each turn, one per flare; on a 6 it happens, once a game.", "Every ship: one Blast Marker placed sunward of it. A ship without shields takes one hit, and a critical on 4+.", "Each Ordnance marker is removed on 4+.", "Eldar may pass a Leadership check to ignore it, then turn directly away and move 2D6 cm; their escorts re-roll free (p. 115)."],
  radiation: ["D6 at the start of each turn, one per burst; on 5 or 6 one burst happens this turn.", "D6 for the interference: every ship has that much less Leadership for the turn. It goes on the Radiation counter in the menu.", "Fleet Commanders may use re-rolls for Command checks only on their own ship or squadron (p. 115)."]
};
function renderAsteroid(i){
  const A = appState.V.actions, R = appState.U[i].R, st = appState.G.st[i], r = A.res, ld = testLd(i), n = PLAY.asteroidTestDice(st), esq = PLAY.isEscort(R);
  if(ld == null) return `<p class="foot">Set this ship's Leadership first.</p>${celBack}`;
  let step;
  if(!r) step = `<div class="r4"><button data-act="acast" data-arg="roll">Roll ${n}D6</button><button data-act="acast" data-arg="pass">Passed</button><button data-act="acast" data-arg="fail">Failed</button></div>`;
  else if(r.test) step = `<p class="acres ok">${r.dice ? diceLine(r.dice) + " against Ld " + r.ld + ": " : ""}<b>Through safely.</b></p>`;
  else if(r.d == null) step = `<p class="acres bad">${r.dice ? diceLine(r.dice) + " against Ld " + r.ld + ": " : ""}<b>Failed:</b> D6 damage.</p>
      ${esq && r.dice && !r.again ? `<button class="btn sec" data-act="acastagain">Re-roll<small>an escort's is free; the second roll stands</small></button>` : ""}
      <div class="bchips">${chip("acastdmg", "roll", "Roll D6", false)}${[1, 2, 3, 4, 5, 6].map(d => chip("acastdmg", d, d, false)).join("")}</div>`;
  else step = `<p class="acres ${r.hits ? "bad" : "ok"}">D6 = <b>${r.d}</b> against ${r.up} shield${r.up === 1 ? "" : "s"} up: <b>${r.hits} hit${r.hits === 1 ? "" : "s"}</b>${r.hits ? (esq ? ": tap them on the ships that touched the field, in the order they moved" : ", marked") : ""}. No Blast Markers, but it is slowed 5 cm this turn (p. 110).</p>`;
  return `${list(TERR_SHORT.asteroid)}
    ${appState.G.grp[i] && !esq ? `<p class="foot">A squadron tests once; on a failure each ship that touched takes D6 (p. 110). Roll it on each ship.</p>` : ""}
    <p class="actotal">Ld ${ld} ${MID} <b>${n}D6, ${ld} or under</b>${n === 3 ? " (All Ahead Full)" : ""}</p>
    ${step}${celBack}`;
}
function renderRift(i){
  const A = appState.V.actions, R = appState.U[i].R, r = A.res, ld = testLd(i), n = PLAY.riftTestDice(R);
  if(ld == null) return `<p class="foot">Set this ship's Leadership first.</p>${celBack}`;
  const step = !r ? `<div class="r4"><button data-act="acrift" data-arg="roll">Roll ${n}D6</button><button data-act="acrift" data-arg="pass">Passed</button><button data-act="acrift" data-arg="fail">Failed</button></div>`
    : r.test ? `<p class="acres ok">${r.dice ? diceLine(r.dice) + " against Ld " + r.ld + ": " : ""}<b>Through.</b> Place it up to ${sum(r.far) * 10} cm from the rift (${r.far.join(" + ")}, ×10), facing any way (p. 111).</p>`
    : `<p class="acres bad">${r.dice ? diceLine(r.dice) + " against Ld " + r.ld + ": " : ""}<b>Lost in the warp.</b> Marked as gone from the table. After the game a D6: on a 1 lost forever, on 2-6 it finds its way back (p. 112).</p>`;
  return `${list(TERR_SHORT.rift)}
    <p class="actotal">Ld ${ld} ${MID} <b>${n}D6, ${ld} or under</b></p>
    ${step}${celBack}`;
}
function renderCel(i){
  const A = appState.V.actions, r = A.res;
  if(!A.cel) return CEL.map(c => `<button class="btn sec" data-act="accel" data-arg="${c[0]}">${c[1]}<small>${c[2]}</small></button>`).join("") + backBtn;
  if(A.cel === "asteroid") return renderAsteroid(i);
  if(A.cel === "rift") return renderRift(i);
  if(A.cel === "gas") return `${list(TERR_SHORT.gas)}
    ${r && r.marked ? `<p class="acres ok"><b>One Blast Marker</b> on this ship. UNDO takes it back.</p>` : `<button class="btn" data-act="acgas">Touching it: mark one Blast Marker</button>`}
    ${celBack}`;
  if(A.cel === "planet") return list(TERR_SHORT.planet.concat(TERR_SHORT.moon)) + celBack;
  return list(TEXT[A.cel]) + celBack;
}
export function renderActions(){
  const A = appState.V.actions, i = A.i;
  const celName = A.tab === "cel" && A.cel ? CEL.find(c => c[0] === A.cel)[1] : "Celestial phenomena";
  const title = { ram: "Ram", dis: "Disengage", tele: "Teleport attack", cel: celName }[A.tab] || "Actions";
  const body = A.tab === "ram" ? renderRam(i) : A.tab === "dis" ? renderDis(i) : A.tab === "tele" ? renderTele(i) : A.tab === "cel" ? renderCel(i) : renderMain(i);
  return `<div class="menu acts" data-act="acclose"><div class="box">
    <div class="mhd"><h2>${title}: ${esc(unitName(i))}</h2><button class="x" data-act="acclose" aria-label="Close">${CLOSE}</button></div>
    ${body}
  </div></div>`;
}
