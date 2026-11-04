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
import { LISTS, SHIPS } from "../../../packages/ui/catalog.js";
import { resolveFleet } from "./fleet-document.js";

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
/* Leadership for these tests: the ship's own - Long Range Sensors (Fleets
   p. 185), a smashed bridge, a radiation burst (p. 115) and a Clanz
   skwadron's Mob Rule (Fleets p. 372, T63) - from the same rules as every
   other Ld on the card. p. 48's Under Fire and enemy contacts are "Command
   check modifiers" and stay out (opt test); disengaging has its own list
   (p. 56). An escort squadron tests on its one Leadership. */
function testLd(i){
  const ms = covers(i), fl = appState.G.fleet, opt = { test: true };
  const l = ms.length > 1 ? PLAY.squadronLd(ms.map(j => ({ R: appState.U[j].R, st: appState.G.st[j] })), fl, opt)
    : PLAY.leadership(appState.U[i].R, appState.G.st[i], fl, opt);
  return l.now;
}
/* the first free re-roll, the fleet's or the ship's own */
export function freeRR(i){
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
  if(name === "actions"){ V.actions = { i: parseInt(el.getAttribute("data-i"), 10), tab: "", size: 1, armour: 5, hits: 8, headOn: false, blast: 0, enemies: 0, celestial: false, boats: false, cat: "", res: null }; render(); return true; }
  const A = V.actions;
  if(!A) return false;
  const st = appState.G.st[A.i];
  if(name === "acclose"){ V.actions = null; render(); return true; }
  if(name === "actab"){
    A.tab = argS(); A.res = null; A.cel = "";
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
    withPeer(() => { const R = appState.U[j].R; A.size = PLAY.ramSize(R); A.hits = PLAY.ramDice(R, appState.G.st[j]); A.armour = PLAY.frontArmour(R) || A.armour; A.foe = j; });
    A.res = null; render(); return true;
  }
  /* a class from the books fills the target in (user 2.11.2026: without the
     opponent's fleet linked, three dials were the only way) */
  if(name === "acfoecat"){
    const v = String(el.value || "");
    A.cat = v; A.foe = null; A.res = null;
    const m = /^(\d+)\|(\d+)\|(\d+)$/.exec(v);
    if(m){
      const L = LISTS[+m[1]], sec = L && L.secs[+m[2]], en = sec && sec.ents[+m[3]];
      const res = en ? resolveFleet({ ln: L.nm, limit: 0, units: [{ s: +m[2], e: +m[3], ref: en.r, n: 1, opts: [], os: {}, name: "", sn: sec.t, el: en.l }] }) : null;
      const R = res && !res.error && res.units[0] && res.units[0].R;
      if(R && R.kind === "ship"){ A.size = PLAY.ramSize(R); A.hits = PLAY.ramDice(R); A.armour = PLAY.frontArmour(R) || A.armour; }
      else A.cat = "";
    }
    render(); return true;
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
    const R = appState.U[A.i].R, mine = rollN(PLAY.ramDice(R, appState.G.st[A.i])), def = A.size === 3;
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
  /* own dice: they roll theirs on the table, the player taps what hit this ship */
  if(name === "acramown"){
    const taken = parseInt(argS(), 10), R = appState.U[A.i].R;
    A.res = Object.assign({}, A.res, { own: true, taken: taken });
    if(taken) act("ramhits", A.i, taken);
    if(!appState.G.st[A.i] || PLAY.destroyed(R, appState.G.st[A.i])) V.actions = null;
    render(); return true;
  }
  if(name === "actele"){
    const how = argS(), d = how === "roll" ? PLAY.d6() : parseInt(how, 10);
    /* an assault boat's raid is the ordnance's, not the ship's one a turn */
    if(!A.boats) act("teleported", A.i);
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
    if(!ok) act("warplost", A.i);
    A.res = { test: ok, dice: dice, ld: ld, far: null };
    render(); return true;
  }
  if(name === "acriftfar"){ A.res = Object.assign({}, A.res, { far: rollN(2) }); render(); return true; }
  /* the failed roll taken back and made again with one re-roll (p. 48) */
  if(name === "acreroll"){
    const free = freeRR(A.i), kind = argS(), prev = A.res;
    if(!free) return true;
    /* own dice: the box is spent and the same question asked again */
    if(!prev.dice){
      if(kind === "dis") act("undo");
      act("rrbox", free.who, free.k);
      A.res = null; render(); return true;
    }
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

/* ------------------------------------------- the command check (p. 48) --- */
/* The Leadership a special order is checked against (T49): the page's own view
   of the ship, or the squadron's highest (p. 95), with what it tracks; Under
   Fire and Enemy Contacts are the pop's chips when it does not. */
export function orderLd(i){
  const fl = appState.G.fleet, g = appState.G.grp[i], P = appState.V.pop || {};
  const l = g ? PLAY.squadronLd(groupUnits(g).map(j => ({ R: appState.U[j].R, st: appState.G.st[j] })), fl) : PLAY.leadership(appState.U[i].R, appState.G.st[i], fl);
  if(l.now == null) return null;
  return Math.max(0, Math.min(10, l.now + (!OPT.blast && P.uf ? -1 : 0) + (!OPT.fleet && P.ec ? 1 : 0)));
}
/* Roll 2D6 in the orders pop, the option after the player's own dice: a pass leaves the order to tap, a failure is
   Check failed (through act, so UNDO takes it back); Re-roll spends one. */
export function orderAct(name, el){
  const P = appState.V.pop;
  if(!P || P.kind !== "order" || !/^ord(mod|roll|rr)$/.test(name)) return false;
  const i = P.i;
  if(name === "ordmod"){ const k = el.getAttribute("data-arg"); P[k] = !P[k]; P.res = null; render(); return true; }
  if(name === "ordrr"){
    const free = freeRR(i);
    if(!free || !P.res || P.res.ok) return true;
    act("undo"); act("rrbox", free.who, free.k);
  }
  const ld = orderLd(i);
  if(ld == null) return true;
  const dice = rollN(2), ok = sum(dice) <= ld;
  const keep = { i: i, kind: "order", uf: P.uf, ec: P.ec, res: { dice: dice, ld: ld, ok: ok } };
  if(!ok) act("orderfail", i);
  appState.V.pop = keep; render(); return true;
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
    bar === "escort" ? "" : row("tele", "Hit-and-run", "teleport attack, or an assault boat's raid (pp. 85, 92)"),
    row("cel", "Celestial phenomena", "asteroids, clouds, warp rifts, planets, flares (pp. 109-115)")
  ].join("");
}
function renderDis(i){
  const A = appState.V.actions, ld = testLd(i), r = A.res;
  if(ld == null) return `<p class="foot">Set this ship's Leadership first.</p>${backBtn}`;
  const total = PLAY.disengageLd(ld, A.blast, A.celestial, A.enemies);
  const R = appState.U[i].R, esq = PLAY.isEscort(R);
  const rr = r && !r.ok && freeRR(i);
  const after = !r ? "" : r.ok
    ? `<p class="acres ok">${r.dice ? diceLine(r.dice) + " against Ld " + r.ld + ": " : ""}<b>Disengaged.</b> ${esq ? "The squadron leaves" : "It leaves"} the table and may not return. For the enemy it counts 10% of its points, 25% if crippled first (p. 57).</p>`
    : `<p class="acres bad">${r.dice ? diceLine(r.dice) + " against Ld " + r.ld + ": " : ""}<b>Failed.</b> It stays, and may not fire, launch ordnance or use special orders except Brace this turn (p. 57).</p>${rr ? `<button class="btn sec" data-act="acreroll" data-arg="dis">Re-roll<small>uses one re-roll</small></button>` : ""}`;
  return `<p class="foot">At the end of its Movement Phase. ${esq ? "The squadron goes together: if one ship disengages, all must (p. 57)." : appState.G.grp[i] ? "A capital ship in a squadron tests alone, and a failure takes it out of the squadron (p. 57)." : ""}</p>
    <p class="aclab">Blast Markers within 5 cm: +1 each</p>${stepper("blast", A.blast, "+" + A.blast)}
    <p class="aclab">Enemy ships and ordnance markers within 15 cm: &minus;1 each</p>${stepper("enemies", A.enemies, "&minus;" + A.enemies)}
    <div class="bchips acgap">${chip("acset", "celestial:" + !A.celestial, "Celestial phenomena within 15 cm: +3", A.celestial)}</div>
    <p class="actotal">Ld ${ld} ${MID} roll 2D6, <b>${Math.min(total, 10)} or under</b>${total > 10 ? ` (Ld ${total}, but 11 and 12 fail)` : ""}</p>
    ${r ? after : `<div class="r4"><button data-act="acdis" data-arg="pass">Passed</button><button data-act="acdis" data-arg="fail">Failed</button><button class="rollb" data-act="acdis" data-arg="roll">Roll 2D6</button></div>`}
    ${backBtn}`;
}
function renderRam(i){
  const A = appState.V.actions, R = appState.U[i].R, r = A.res, ld = testLd(i);
  if(ld == null) return `<p class="foot">Set this ship's Leadership first.</p>${backBtn}`;
  const n = PLAY.ramTestDice(PLAY.ramSize(R), A.size), def = A.size === 3;
  const foes = peerHas() ? withPeer(() => appState.U.map((x, j) => x.R.kind === "ship" && !PLAY.destroyed(x.R, appState.G.st[j]) ? chip("acfoe", j, esc(unitName(j)), A.foe === j) : "").join("")) : "";
  const back = PLAY.rammedDice(A.hits, A.headOn, def), mine = PLAY.ramDice(R, appState.G.st[i]), auto = PLAY.powerRam(R), front = PLAY.frontArmour(R);
  const own = (R.rules || []).filter(x => /\bram(s|ming)?\b/i.test(String(x.t)) && !/power ram/i.test(String(x.t))).map(x => `<p class="foot">${esc(String(x.t).replace(/^\*\s*/, ""))}</p>`).join("");
  const rr = r && r.test === false && freeRR(i);
  let step;
  if(!r) step = `<div class="r4"><button data-act="acramtest" data-arg="pass">Passed</button><button data-act="acramtest" data-arg="fail">Failed</button><button class="rollb" data-act="acramtest" data-arg="roll">Roll ${n}D6</button></div>`;
  else if(!r.test) step = `<p class="acres bad">${r.dice ? diceLine(r.dice) + " against Ld " + r.ld + ": " : ""}<b>Missed.</b> It moves normally under All Ahead Full (p. 55).</p>${rr ? `<button class="btn sec" data-act="acreroll" data-arg="ram">Re-roll<small>uses one re-roll</small></button>` : ""}`;
  else if(r.own) step = `<p class="acres ${r.taken ? "bad" : "ok"}"><b>${r.taken} hit${r.taken === 1 ? "" : "s"} on this ship</b>${r.taken ? ", marked" : ""}.</p>
      <p class="foot">An explosion is resolved now and catches both ships. Then finish the move; it may board only a ship it touches at the end of it (p. 56).</p>`;
  else if(r.mine == null) step = `<p class="acres ok">${r.dice ? diceLine(r.dice) + " against Ld " + r.ld + ": " : ""}<b>In position.</b> Move the full distance; on base contact, stop and resolve (p. 55).</p>
      <p class="actotal">On base contact: you roll <b>${mine}D6</b> against Armour ${A.armour}+${auto ? " + 1 automatic (power ram)" : ""}; they roll <b>${back}D6</b> against your ${front}+</p>
      <p class="aclab">Hits on this ship</p><div class="bchips">${Array.from({ length: back + 1 }, (x, k) => chip("acramown", k, k, false)).join("")}</div>
      <button class="btn sec rollb" data-act="acramroll">Roll both<small>the page rolls the two sides</small></button>`;
  else step = `<p class="acres ok">You rolled ${r.mine.join(" ")}${r.auto ? " + power ram" : ""}: <b>${r.dealt} hit${r.dealt === 1 ? "" : "s"} on them</b>, no shields (p. 55). Tell them.</p>
      <p class="acres ${r.taken ? "bad" : "ok"}">They rolled ${r.theirs.join(" ")} against ${r.front}+: <b>${r.taken} hit${r.taken === 1 ? "" : "s"} on this ship</b>${r.taken ? ", marked" : ""}.</p>
      <p class="foot">An explosion is resolved now and catches both ships. Then finish the move; it may board only a ship it touches at the end of it (p. 56).</p>`;
  /* the books' classes when the opponent's fleet is not linked: one pick fills
     the three values below */
  const cat = foes ? "" : `<p class="aclab">Their ship</p><select class="acsel" data-sel="ramfoe" aria-label="Their ship's class, from the books"><option value="">pick a class, or set the values below</option>${LISTS.map((L, li) =>
    `<optgroup label="${esc(L.nm)}">${L.secs.map((s, si) => s.ents.map((e, ei) => { if(!SHIPS[String(e.r)]) return ""; const v = li + "|" + si + "|" + ei; return `<option value="${v}"${A.cat === v ? " selected" : ""}>${esc(e.l || "")}</option>`; }).join("")).join("")}</optgroup>`).join("")}</select>`;
  return `<p class="foot">Pass All Ahead Full, name the target, test Leadership, and only then roll the extra distance. One ram per Movement Phase; the choice cannot change (p. 55).</p>${own}
    ${foes ? `<p class="aclab">Their ship</p><div class="bchips">${foes}</div>` : cat}
    <p class="aclab">Target</p><div class="bchips">${PLAY.RAM_SIZES.map((s, k) => chip("acset", "size:" + k, s[0].toUpperCase() + s.slice(1), A.size === k)).join("")}</div>
    <p class="aclab">Its armour where you hit it</p><div class="bchips">${[3, 4, 5, 6].map(v => chip("acset", "armour:" + v, v + "+", A.armour === v)).join("")}</div>
    <p class="aclab">Its starting hits</p>${stepper("hits", A.hits, "not what it has left")}
    ${def ? `<p class="foot">A defence rolls its full starting hits, as if prow-on (p. 56).</p>` : `<div class="bchips acgap">${chip("acset", "headOn:false", "Side or rear", !A.headOn)}${chip("acset", "headOn:true", "Head on", A.headOn)}</div>`}
    <p class="actotal">Ld ${ld} ${MID} <b>${n}D6, ${ld} or under</b>${n === 3 ? " (smaller target)" : n === 1 ? " (larger target)" : " (same size)"}</p>
    ${step}${backBtn}`;
}
/* One Hit-and-Run attack (p. 92): a teleport attack, with the ship's own
   conditions, or an assault boat squadron's raid (p. 85). Own dice as well
   (user 2.11.2026: the other helpers took them, this one did not). */
function renderTele(i){
  const A = appState.V.actions, r = A.res, boats = !!A.boats, bar = boats ? "" : teleportBar(i);
  const mode = `<div class="bchips">${chip("acset", "boats:false", "Teleport attack", !boats)}${chip("acset", "boats:true", "Assault boats", boats)}</div>`;
  const dice = `<div class="bchips">${[1, 2, 3, 4, 5, 6].map(d => chip("actele", d, d, false)).join("")}${chip("actele", "roll", "Roll D6", false)}</div>`;
  const out = r ? (r.d <= 1 ? `<p class="acres bad"><b>${r.d}: failed.</b></p>`
      : `<p class="acres ok"><b>${r.d}.</b> Tell them: critical ${r.d} on their table, repaired as normal (p. 92); an escort is destroyed on 4+.</p>`)
    : bar ? `<p class="foot">This ship may not teleport now: ${esc(bar)}.</p>` : dice;
  const list = boats
    ? `<ul class="acchk"><li>On contact, after the turrets: one raid at once for each assault boat squadron left (p. 85)</li><li>The target may Brace against any Hit-and-Run, before the roll</li></ul>`
    : `<ul class="acchk"><li>End Phase, on Lock On or Reload Ordnance</li><li>The target has no shields and is within 10 cm</li><li>The target has no more hits left than this ship</li><li>Not crippled; one a turn</li></ul>`;
  return `${mode}${list}
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
  if(!r) step = `<div class="r4"><button data-act="acast" data-arg="pass">Passed</button><button data-act="acast" data-arg="fail">Failed</button><button class="rollb" data-act="acast" data-arg="roll">Roll ${n}D6</button></div>`;
  else if(r.test) step = `<p class="acres ok">${r.dice ? diceLine(r.dice) + " against Ld " + r.ld + ": " : ""}<b>Through safely.</b></p>`;
  else if(r.d == null) step = `<p class="acres bad">${r.dice ? diceLine(r.dice) + " against Ld " + r.ld + ": " : ""}<b>Failed:</b> D6 damage.</p>
      ${esq && r.dice && !r.again ? `<button class="btn sec" data-act="acastagain">Re-roll<small>an escort's is free; the second roll stands</small></button>` : ""}
      <div class="bchips">${[1, 2, 3, 4, 5, 6].map(d => chip("acastdmg", d, d, false)).join("")}${chip("acastdmg", "roll", "Roll D6", false)}</div>`;
  else step = `<p class="acres ${r.hits ? "bad" : "ok"}">D6 = <b>${r.d}</b> against ${r.up} shield${r.up === 1 ? "" : "s"} up: <b>${r.hits} hit${r.hits === 1 ? "" : "s"}</b>${r.hits ? (esq ? ": tap them on the ships that touched the field, in the order they moved" : ", marked") : ""}. No Blast Markers, but it is slowed 5 cm this turn (p. 110).</p>`;
  return `${list(TERR_SHORT.asteroid)}
    ${appState.G.grp[i] && !esq ? `<p class="foot">A squadron tests once; on a failure each ship that touched takes D6 (p. 110). Roll it on each ship.</p>` : ""}
    <p class="actotal">Ld ${ld} ${MID} <b>${n}D6, ${ld} or under</b>${n === 3 ? " (All Ahead Full)" : ""}</p>
    ${step}${celBack}`;
}
function renderRift(i){
  const A = appState.V.actions, R = appState.U[i].R, r = A.res, ld = testLd(i), n = PLAY.riftTestDice(R);
  if(ld == null) return `<p class="foot">Set this ship's Leadership first.</p>${celBack}`;
  const step = !r ? `<div class="r4"><button data-act="acrift" data-arg="pass">Passed</button><button data-act="acrift" data-arg="fail">Failed</button><button class="rollb" data-act="acrift" data-arg="roll">Roll ${n}D6</button></div>`
    : r.test ? `<p class="acres ok">${r.dice ? diceLine(r.dice) + " against Ld " + r.ld + ": " : ""}<b>Through.</b> Place it up to ${r.far ? sum(r.far) * 10 + " cm from the rift (" + r.far.join(" + ") + ", ×10)" : "2D6 × 10 cm from the rift"}, facing any way (p. 111).</p>${r.far ? "" : `<div class="bchips">${chip("acriftfar", "", "Roll 2D6", false)}</div>`}`
    : `<p class="acres bad">${r.dice ? diceLine(r.dice) + " against Ld " + r.ld + ": " : ""}<b>Lost in the warp.</b> It counts as destroyed, for its full points. After the game a D6: on a 1 lost forever, on 2-6 it finds its way back (p. 112).</p>`;
  return `${list(TERR_SHORT.rift)}
    <p class="actotal">Ld ${ld} ${MID} <b>${n}D6, ${ld} or under</b></p>
    ${step}${celBack}`;
}
function renderCel(i){
  const A = appState.V.actions;
  if(!A.cel) return CEL.map(c => `<button class="btn sec" data-act="accel" data-arg="${c[0]}">${c[1]}<small>${c[2]}</small></button>`).join("") + backBtn;
  if(A.cel === "asteroid") return renderAsteroid(i);
  if(A.cel === "rift") return renderRift(i);
  if(A.cel === "planet") return list(TERR_SHORT.planet.concat(TERR_SHORT.moon)) + celBack;
  return list(A.cel === "gas" ? TERR_SHORT.gas : TEXT[A.cel]) + celBack;
}
export function renderActions(){
  const A = appState.V.actions, i = A.i;
  const celName = A.tab === "cel" && A.cel ? CEL.find(c => c[0] === A.cel)[1] : "Celestial phenomena";
  const title = { ram: "Ram", dis: "Disengage", tele: "Hit-and-run", cel: celName }[A.tab] || "Actions";
  const body = A.tab === "ram" ? renderRam(i) : A.tab === "dis" ? renderDis(i) : A.tab === "tele" ? renderTele(i) : A.tab === "cel" ? renderCel(i) : renderMain(i);
  return `<div class="menu acts" data-act="acclose"><div class="box">
    <div class="mhd"><h2>${title}: ${esc(unitName(i))}</h2><button class="x" data-act="acclose" aria-label="Close">${CLOSE}</button></div>
    ${body}
  </div></div>`;
}
