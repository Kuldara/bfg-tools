import { appState } from "./state.js";
import { MID } from "./helpers.js";
import { cmdsAboard, grpHTML, isEscGrp } from "./game-state.js";
import { groupUnits } from "./actions.js";
import { unitName } from "./derived.js";
import { CLOSE_X, render, vpOf, vpTotal } from "./render.js";
import { peerHas, peerLabel, withPeer } from "./peer.js";
import PLAY from "../rules.js";
import { esc } from "../../../packages/ui/format.js";

/* ================================================== VICTORY POINTS ===== */
/* The score and its what-ifs (user 4.11.2026: "something that shows that a
   tap takes you to the VP count, and in a linked game the whole score
   there ... in the popup the match's state, and work things out: if I
   disengage now, if that one goes crippled and these ships disengage, if
   this ship of mine is destroyed"; prototypes 2, 4 and 7 and card B picked
   from tmp/vp_protot.html). Nothing here touches the game: a what-if swaps
   a unit's state for one count and puts it back, and PLAY.conceded counts
   it with the page's own rules (p. 123, p. 57, Fleets p. 404). */

/* A unit's state as it would be: "dd" destroyed, "cr" crippled, "dg"
   disengaged (from the state it is in, so a crippled ship pays 25 %). */
function stAs(R, st, kind){
  const c = Object.assign({}, st);
  if(kind === "dd"){
    if(PLAY.isEscort(R) || PLAY.tickUnit(R)) c.members = (st.members || []).map(m => Object.assign({}, m, { dead: true }));
    else c.destroyed = true;
  }else if(kind === "cr"){
    const at = PLAY.view(R, st, appState.G.fleet).crippledAt;
    if(at != null) c.hits = Math.max(st.hits | 0, at);
  }else if(kind === "dg") c.disengaged = true;
  return c;
}
/* fn() counted with the states in ov ({ unit index: kind }) */
function withStates(ov, fn){
  const st = appState.G.st, keep = {};
  Object.keys(ov || {}).forEach(k => { keep[k] = st[k]; st[k] = stAs(appState.U[k].R, st[k], ov[k]); });
  try{ return fn(); }
  finally{ Object.keys(keep).forEach(k => { st[k] = keep[k]; }); }
}
export const vpWith = ov => withStates(ov, vpTotal);
/* what these cards (one ship, or an escort squadron's cards) concede in a state */
const vpSet = (ms, kind) => withStates(kind ? Object.fromEntries(ms.map(j => [j, kind])) : {}, () => ms.reduce((a, j) => a + vpOf(j), 0));
const ovOf = (ms, kind) => Object.fromEntries(ms.map(j => [j, kind]));

/* A unit the what-ifs know: a ship that can be crippled, disengage or be
   destroyed - not a planetary defence, a mine or a star fort (they pay only
   when destroyed, p. 123, Fleets pp. 502, 512). */
function plain(R){ return R && R.kind === "ship" && !PLAY.isInstallation(R) && !PLAY.tickUnit(R) && !PLAY.isFort(R); }
/* the cards a what-if moves together: an escort squadron of several cards
   is one (p. 123), anything else its own */
function cardsOf(i){ const g = appState.G.grp[i]; return isEscGrp(g) ? groupUnits(g) : [i]; }
function stateOf(ms){
  const U = appState.U, S = appState.G.st;
  if(ms.every(j => PLAY.destroyed(U[j].R, S[j]))) return "dd";
  if(ms.every(j => S[j].disengaged || PLAY.destroyed(U[j].R, S[j]))) return "dg";
  const esq = PLAY.isEscort(U[ms[0]].R);
  if(esq ? PLAY.escortCrippled({ members: [].concat(...ms.map(j => S[j].members || [])) }) : PLAY.crippled(U[ms[0]].R, S[ms[0]])) return "cr";
  return "ok";
}
/* every unit on this side once, the page's own state swapped in (withPeer) */
function units(){
  const out = [], seen = {};
  appState.U.forEach((x, i) => {
    if(!plain(x.R)) return;
    const ms = cardsOf(i);
    if(seen[ms[0]]) return; seen[ms[0]] = 1;
    const esq = PLAY.isEscort(x.R), g = appState.G.grp[i];
    out.push({ ms: ms, esq: esq, state: stateOf(ms),
      name: esq && isEscGrp(g) ? "squadron " + grpHTML(g) : esc(unitName(i)),
      cmd: cmdsAboard(i).map(j => esc(unitName(j))).join(", ") });
  });
  return out;
}
const names = L => L.map(u => u.name).join(", ");
/* The questions worth asking now, each with the states it sets. key is
   stable over redraws so a ticked one stays ticked. */
function myQuestions(){
  const L = units(), Q = [];
  const cr = L.filter(u => u.state === "cr");
  if(cr.length) Q.push({ key: "m:discr", text: (cr.length > 1 ? "My crippled ships disengage" : "My crippled " + cr[0].name + " disengages") + (cr.length > 1 ? " (" + names(cr) + ")" : ""), ov: Object.assign({}, ...cr.map(u => ovOf(u.ms, "dg"))) });
  cr.slice(0, 3).forEach(u => Q.push({ key: "m:dd:" + u.ms[0], text: u.name + " is destroyed", ov: ovOf(u.ms, "dd") }));
  const flag = L.find(u => u.cmd && u.state !== "dd" && u.state !== "dg" && cr.indexOf(u) < 0);
  if(flag) Q.push({ key: "m:flag", text: "My flagship " + flag.name + " is destroyed (with " + flag.cmd + ")", ov: ovOf(flag.ms, "dd") });
  const ok = L.filter(u => u.state === "ok" && !u.esq && !u.cmd);
  ok.slice(0, 2).forEach(u => Q.push({ key: "m:cr:" + u.ms[0], text: u.name + " is crippled", ov: ovOf(u.ms, "cr") }));
  /* always first (user 4.11.2026): I disengage now */
  const left = L.filter(u => u.state === "ok" || u.state === "cr");
  if(left.length) Q.unshift({ key: "m:all", text: "I disengage everything still in play", ov: Object.assign({}, ...left.map(u => ovOf(u.ms, "dg"))) });
  return Q;
}
function theirQuestions(){
  const L = units(), Q = [];
  L.filter(u => u.state === "cr").slice(0, 3).forEach(u => {
    Q.push({ key: "t:dd:" + u.ms[0], text: "I finish off their " + u.name, ov: ovOf(u.ms, "dd") });
    Q.push({ key: "t:dg:" + u.ms[0], text: "Their " + u.name + " disengages", ov: ovOf(u.ms, "dg") });
  });
  L.filter(u => u.esq && u.state === "ok" && u.ms.some(j => (appState.G.st[j].members || []).some(m => m.dead))).slice(0, 2)
    .forEach(u => Q.push({ key: "t:dd:" + u.ms[0], text: "I wipe out their " + u.name, ov: ovOf(u.ms, "dd") }));
  const flag = L.find(u => u.cmd && u.state !== "dd" && u.state !== "dg");
  if(flag) Q.push({ key: "t:flag", text: "I destroy their flagship " + flag.name + " (with " + flag.cmd + ")", ov: ovOf(flag.ms, "dd") });
  /* always second: the enemy disengages now */
  const left = L.filter(u => u.state === "ok" || u.state === "cr");
  if(left.length) Q.unshift({ key: "t:all", text: "The enemy disengages everything still in play", ov: Object.assign({}, ...left.map(u => ovOf(u.ms, "dg"))) });
  return Q;
}

/* The score: "they" is what my fleet concedes, "me" what theirs concedes -
   known only with a linked opponent. ovMe / ovThem: what-ifs on each side. */
export function score(ovMe, ovThem){
  const they = vpWith(ovMe || {});
  const me = peerHas() ? withPeer(() => vpWith(ovThem || {})) : null;
  return { me: me, they: they };
}
const lead = s => s.me == null ? "" : s.me === s.they ? "level" : s.me > s.they ? "you lead by " + (s.me - s.they) : "they lead by " + (s.they - s.me);
const pct = s => s.me + s.they ? Math.round(100 * s.me / (s.me + s.they)) : 50;
const sgn = n => n > 0 ? "+" + n : n < 0 ? String(n) : "±0";

/* The ladder's preview (V.vpPeek) as a what-if on my side */
function peekOv(){
  const p = appState.V.vpPeek;
  if(!p || !appState.U[p.i]) return null;
  return ovOf(cardsOf(p.i), p.k);
}

/* The VP button in the bar (prototype 2): it looks like a button and opens
   the score; with a linked opponent both totals and the tug line. */
export function vpButton(sub){
  const pk = peekOv();
  const s = score(), s1 = pk ? score(pk) : null;
  const theyTxt = s1 && s1.they !== s.they ? `<span class="was">${s.they}→</span><span class="then">${s1.they}</span>` : String(s.they);
  if(s.me == null)
    return `<button class="vp vpbtn" data-act="vp" aria-label="Victory points: the score and what-ifs"><span class="chev" aria-hidden="true">›</span>${sub}<b>VP ${theyTxt}</b></button>`;
  return `<button class="vp vpbtn duo" data-act="vp" aria-label="Score: you ${s.me}, ${esc(peerLabel())} ${s.they}"><span class="chev" aria-hidden="true">›</span>
    <span class="sc"><b class="me">${s.me}</b><i>:</i><b class="them">${theyTxt}</b></span>
    <span class="tug" aria-hidden="true"><i style="width:${pct(s1 || s)}%"></i></span><small>${sub}</small></button>`;
}

/* The ladder on a ship card (prototype 7): what the ship - or the escort
   squadron - gives away in each state, the one it is in marked; a tap
   previews the total in the bar, a second tap puts it back. */
export function vpLadder(i){
  if(appState.P && appState.P.G && appState.G === appState.P.G) return "";   /* their cards are to look at */
  const R = appState.U[i].R;
  if(!plain(R) || appState.V.compact) return "";
  const ms = cardsOf(i), now = stateOf(ms);
  if(now === "dd" || now === "dg") return "";
  const esq = PLAY.isEscort(R);
  const steps = (esq ? ["ok", "dg", "dd"] : ["ok", "cr", "dg", "dd"]).filter(k => !(k === "cr" && (now === "cr" || !(R.damage && R.damage.crippled))));
  const p = appState.V.vpPeek;
  const word = { ok: now === "cr" ? "crippled" : "in play", cr: "crippled", dg: "disengage", dd: "destroyed" };
  return `<div class="vpl" role="group" aria-label="Victory points the enemy gets"><span class="vpl-h">VP</span>${steps.map(k => {
    const v = k === "ok" ? vpSet(ms, null) : vpSet(ms, k);
    const on = p && p.i === ms[0] && p.k === k;
    return `<button class="${k === "ok" ? "cur" : ""}${on ? " on" : ""}" data-act="vpk" data-i="${ms[0]}" data-arg="${k}" aria-pressed="${!!on}">${word[k]}<b>${v}</b></button>`;
  }).join("")}</div>`;
}

/* Card B: a disengaged card says so in a band, with what it gave away */
export function disBand(i){
  const ms = cardsOf(i);
  return `<div class="disband">↗ DISENGAGED ${MID} the enemy gets ${ms.reduce((a, j) => a + vpOf(j), 0)} VP</div>`;
}

/* The score sheet (prototype 4): the match, then the questions worth
   asking; ticked ones stack, and the score shows now -> then. */
export function renderVpSheet(){
  const on = appState.V.vpQ || {};
  const mine = myQuestions(), theirs = peerHas() ? withPeer(theirQuestions) : [];
  const pickOv = Q => Object.assign({}, ...Q.filter(q => on[q.key]).map(q => q.ov));
  const ovMe = pickOv(mine), ovThem = pickOv(theirs), any = Object.keys(ovMe).length + Object.keys(ovThem).length > 0;
  const s0 = score(), s1 = any ? score(ovMe, ovThem) : s0;
  const num = (a, b, cls) => `<div class="n ${cls}">${a !== b ? `<span class="was">${a}→</span>` : ""}${b}</div>`;
  const head = s0.me == null
    ? `<div class="vps one"><div><small>The enemy gets from your fleet</small>${num(s0.they, s1.they, "them")}</div></div>
       <p class="foot">Link the opponent's phone (the link in the top bar) and their side is counted here too.</p>`
    : `<div class="vps"><div><small>You score</small>${num(s0.me, s1.me, "me")}</div><div class="vs">vs</div><div><small>${esc(peerLabel())} scores</small>${num(s0.they, s1.they, "them")}</div></div>
       <div class="tug big"><i style="width:${pct(s1)}%"></i>${any ? `<b style="left:${pct(s0)}%"></b>` : ""}</div>
       <p class="vplead">${lead(s0)}${any && lead(s1) !== lead(s0) ? ` <span class="then">→ ${lead(s1)}</span>` : ""}</p>`;
  const qBtn = (q, side) => {
    const d = side === "m" ? score(q.ov, {}) : score({}, q.ov);
    const dm = d.me == null ? "" : `<span class="me">${sgn(d.me - s0.me)}</span> / `;
    return `<button class="vpq${on[q.key] ? " on" : ""}" data-act="vpq" data-arg="${q.key}" aria-pressed="${!!on[q.key]}">${q.text}<small>${dm}<span class="them">${sgn(d.they - s0.they)}</span>${d.me == null ? " VP for the enemy" : " " + MID + " " + lead(d)}</small></button>`;
  };
  /* the two disengages first - mine, then theirs - then the rest */
  const top = q => /:all$/.test(q.key);
  const qs = mine.filter(top).map(q => qBtn(q, "m")).concat(theirs.filter(top).map(q => qBtn(q, "t")),
    mine.filter(q => !top(q)).map(q => qBtn(q, "m")), theirs.filter(q => !top(q)).map(q => qBtn(q, "t")));
  return `<div class="menu" data-act="vp"><div class="box vpbox">
    <div class="mhd"><h2>Victory points</h2>${any ? `<button class="vpclr" data-act="vpclr">Clear</button>` : ""}<button class="x" data-act="vp" aria-label="Close">${CLOSE_X}</button></div>
    ${head}
    ${qs.length ? `<h3 class="vpq-h">What if…<small>${s0.me == null ? "VP for the enemy" : "you / them"}</small></h3>${qs.join("")}<p class="foot">Tick several to add them up. Nothing here changes the game. Each ship's own figures are on its card.</p>` : ""}
    <p class="foot">Destroyed: full points with any commander aboard; crippled 25 %; disengaged 10 %, or 25 % if crippled; an escort squadron only when it is wholly destroyed or disengages (pp. 57, 123).</p>
  </div></div>`;
}

/* The taps */
export function vpAct(name, el){
  if(name !== "vpk") appState.V.vpPeek = null;
  if(name === "vp"){ appState.V.vp = !appState.V.vp; if(!appState.V.vp) appState.V.vpQ = {}; render(); return true; }
  if(name === "vpclr"){ appState.V.vpQ = {}; render(); return true; }
  if(name === "vpq"){
    const k = el.getAttribute("data-arg"), q = appState.V.vpQ = appState.V.vpQ || {};
    if(q[k]) delete q[k]; else q[k] = 1;
    render(); return true;
  }
  if(name === "vpk"){
    const i = parseInt(el.getAttribute("data-i"), 10), k = el.getAttribute("data-arg"), p = appState.V.vpPeek;
    appState.V.vpPeek = k === "ok" || (p && p.i === i && p.k === k) ? null : { i: i, k: k };
    render(); return true;
  }
  return false;
}
