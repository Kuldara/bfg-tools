import { appState } from "./state.js";
import { KEY_INFO, KEY_PLAY, PLAY_VERSION, lsGet, lsSet, normaliseUntracked } from "./storage.js";
import { MID } from "./helpers.js";
import { resolveFleet } from "./fleet-document.js";
import { unitName } from "./derived.js";
import { fleetRR } from "./render.js";
import { esc, title } from "../../../packages/ui/format.js";
import PLAY from "../rules.js";
import DOMAIN from "../../../packages/rules/domain.js";
import { DATA } from "../../../packages/ui/catalog.js";
import { pregameRolls, pregameEffects } from "../../../packages/ui/pregame-tables.js";

/* ============================================================== STATE ===== */
appState.G = null;      /* the game: persisted */
appState.U = [];        /* resolved units, rebuilt from G.doc */
appState.L0 = null;
/* The view (user 19.10.2026): "full" rows carry the weapons table, the
   compact rows only what a hit or a critical needs - the whole fleet on one
   screen for the enemy's turn. Per device, never in the game record. */
export const KEY_VIEW = "gothic-fleet-play-view";
/* Keep the screen on while a game is open (Screen Wake Lock); "0" = off. */
export const KEY_WAKE = "gothic-fleet-play-awake";
/* Fleets that came by a link or a file: the page's own list, newest first
   (the builder's key is never written). */
export const KEY_LINKED = "gothic-fleet-play-linked";
appState.V = { screen: "load", sheet: null, pop: null, menu: false, info: lsGet(KEY_INFO) === "1", note: "", loadErr: "", saveErr: false,
          compact: lsGet(KEY_VIEW) === "compact", endph: false, guardUntil: 0, lastScreen: null, linkNew: null, copied: "" };
/* The way back: the builder sits beside play/ (dev and the shared ZIP);
   make_site.py rewrites this to the site root. */
/* The builder is the page one level up: the site serves Play at /play/. */
export const BUILDER_URL = "../";
/* Outline icons for the top bar, one stroke weight. */
export const TOOL_ICON = {
  info: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.01"/></svg>',
  undo: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 14L4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/></svg>',
  menu: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
  back: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4"/><path d="M10 16l-4-4 4-4M6 12h10"/></svg>',
  view: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4" width="16" height="5" rx="1"/><rect x="4" y="11" width="16" height="5" rx="1"/><path d="M4 20h16"/></svg>'
};
export const toolBtn = (act, icon, word, extra) => `<button class="tool${extra && extra.on ? " on" : ""}" data-act="${act}"${extra && extra.off ? " disabled" : ""} title="${esc(extra && extra.tip || word)}">${TOOL_ICON[icon]}<span>${word}</span></button>`;
export const builderTool = () => `<a class="tool" href="${BUILDER_URL}" title="Back to the fleet builder">${TOOL_ICON.back}<span>Builder</span></a>`;
appState.UNDO = [];

export function newGame(res){
  const fleet = PLAY.freshFleet();
  const st = res.units.map(x => PLAY.freshUnit(x.R));
  /* The fleet commander is the commander that stands first in the fleet
     LIST, whatever the roster's order (PLAY.fleetCommander): a Veteran
     Captain added before the Admiral does not lead the fleet. */
  const cmd = PLAY.fleetCommander(res.units.map(x => {
    const si = x.R.entry ? res.L0.secs.findIndex(sec => sec.t === x.R.entry.section) : -1;
    const ei = si >= 0 ? res.L0.secs[si].ents.findIndex(en => en.l === x.R.entry.label) : -1;
    return { kind: x.R.kind, s: si < 0 ? 1e6 : si, e: ei < 0 ? 1e6 : ei };
  }));
  /* The commander's re-rolls, included and bought; without a commander the
     fleet's own (Necrons p. 406, Demiurg p. 486). Abaddon's come back every
     turn (Fleets p. 241). */
  const crr = cmd >= 0 ? res.units[cmd].R.rerolls : null;
  const frr0 = cmd < 0 ? DOMAIN.fleetRerolls(res.L0, res.units.map(x => x.R)) : null;
  const pool0 = crr || frr0;
  PLAY.setRerolls(fleet, pool0 ? pool0.total : 0, !!(crr && crr.unit === "per turn"), rrKinds(pool0));
  /* a further commander's re-rolls are his own (a Veteran Captain's, a
     Farseer's, a second Warlord's): they stay on his own row */
  res.units.forEach((x, j) => {
    if(x.R.kind === "commander" && j !== cmd && x.R.rerolls)
      PLAY.setRerolls(st[j], x.R.rerolls.total, x.R.rerolls.unit === "per turn", rrKinds(x.R.rerolls));
    /* a ship's own re-rolls (Scion of Prospero p. 260, a Mark of Tzeentch
       p. 244, a fortress-monastery p. 111) stay on its own card */
    if(x.R.kind === "ship" && x.R.rerolls)
      PLAY.setRerolls(st[j], x.R.rerolls.total, false, rrKinds(x.R.rerolls));
  });
  /* J233: the roster first - where a commander may board is asked of the
     fleet as a whole (carriersOf, DOMAIN.resolveFleet) */
  appState.U = res.units; appState.L0 = res.L0; FR = null;
  appState.G = { v: 1, play: PLAY_VERSION, fp: res.fp, src: res.src || "builder", ln: res.doc.ln, limit: res.doc.limit, doc: res.doc,
        fleet: fleet, st: st, grp: builderGroups(res.units), flag: null, cmd: cmd >= 0 ? cmd : null, ac: 0, started: false };
  if(cmd >= 0){
    /* the flagship defaults to the biggest capital ship; a platform, a
       station or a defence vessel never carries the commander, a star fort
       or a Haven only when there is no ship (PLAY.defaultFlagship) */
    const caps = carriersOf(cmd), flag0 = PLAY.defaultFlagship(res.units.map(x => x.R));
    /* J215: the builder's placement when the book or the player decided it -
       a Master of the Fleet on his battle barge, a Warmaster on the most
       expensive ship that is no Daemonship, the ship picked in the builder,
       a Clanz Warlord on the dearest ship of his own command (J233) */
    const ab = aboardOf(cmd);
    appState.G.flag = ab && (ab.ruled || ab.chosen) && caps.indexOf(ab.ship) >= 0 ? ab.ship
      : caps.indexOf(flag0) >= 0 ? flag0 : caps.length ? caps[0] : null;
  }
  appState.G.on = placeOthers();
  fixedLds();
  applyCommanderLd();
}
/* J233 (RULINGS.md T43): every commander aboard a ship of his own - "Assign
   the Fleet Commander(s) to their ship(s)" (Rulebook p. 123). An Ork
   fleet's every Warlord "must be assigned to a ship or squadron" (Fleets
   pp. 367, 368), a Da Ork Clanz Warlord to "the most expensive ship under
   his own command ... even if it is an escort" (p. 374). The fleet
   commander's ship is G.flag as before, every other commander's G.on[j]. */
export let FR = null;
export function fleetRes(){
  return FR || (FR = DOMAIN.resolveFleet({ list: appState.L0.nm, limit: appState.G.doc.limit | 0, units: appState.U.map(x => x.it) }, DATA));
}
/* peer.js draws the opponent's fleet with these same functions: it swaps
   their game in for a moment, and the cached fleet resolution with it. */
export function swapFleetRes(v){ const o = FR; FR = v; return o; }
export function aboardOf(j){ return (fleetRes().aboard || []).filter(a => a.unit === j)[0] || null; }
export const isWarlord = j => !!(appState.U[j] && appState.U[j].R.kind === "commander" && /^orks/i.test(String(appState.L0 && appState.L0.nm || "")) &&
  /warlord/i.test(String(appState.U[j].R.entry && appState.U[j].R.entry.label || "")));
/* Where he may board. A Warlord: the ships the builder gives him, escort
   squadrons too; anyone else as before: a capital ship, a star fort or a
   Haven (PLAY.mayCarryCommander, T32). */
export function carriersOf(j){
  if(isWarlord(j)){
    const ab = aboardOf(j);
    const ks = ab && ab.choices && ab.choices.length ? ab.choices
      : appState.U.map((y, k) => y.R.kind === "ship" && !y.R.defence ? k : -1).filter(k => k >= 0);
    return ks.filter(k => appState.U[k] && appState.U[k].R.kind === "ship");
  }
  return appState.U.map((y, k) => PLAY.mayCarryCommander(y.R) ? k : -1).filter(k => k >= 0);
}
/* Every commander but the fleet commander: the builder's placement when
   the book or the player decided it, else the first of his ships no other
   commander is on. */
export function placeOthers(){
  const on = {}, used = {};
  if(appState.G.flag != null) used[appState.G.flag] = 1;
  appState.U.forEach((x, j) => {
    if(x.R.kind !== "commander" || j === appState.G.cmd) return;
    const caps = carriersOf(j);
    if(!caps.length) return;
    const ab = aboardOf(j);
    let s = ab && (ab.ruled || ab.chosen) && caps.indexOf(ab.ship) >= 0 ? ab.ship : null;
    if(s == null) s = caps.filter(k => !used[k])[0];
    if(s == null) s = caps[0];
    on[j] = s; used[s] = 1;
  });
  return on;
}
/* The commanders aboard ship i, the fleet commander first. */
export function cmdsAboard(i){
  const out = appState.G.cmd != null && i === appState.G.flag ? [appState.G.cmd] : [];
  Object.keys(appState.G.on || {}).forEach(j => { if(appState.G.on[j] === i) out.push(+j); });
  return out;
}
/* A commander aboard an escort squadron (a Warlord "must be embarked on the
   most expensive ship under his own command ... even if it is an escort -
   annotate which one it is", Fleets p. 374): the card's last paid ship
   carries him - its box has a crown (the owner, 6.11.2026). -1: none. */
export function cmdCrown(i){
  const st = appState.G.st[i], R = appState.U[i] && appState.U[i].R;
  if(!R || R.kind !== "ship" || !PLAY.isEscort(R) || !Array.isArray(st.members) || !cmdsAboard(i).length) return -1;
  for(let k = st.members.length - 1; k >= 0; k--) if(!st.members[k].free) return k;
  return -1;
}
/* The crowned ship gone, the commander is gone with it (the owner,
   6.11.2026, RULINGS.md T64): his re-rolls are lost as with a Bridge
   Smashed (p. 67), his +2 boarding roll too, and a Leadership his line gave
   the squadron goes back to its roll. The ship back (a mis-tap), all of it
   comes back. st.cmdDead on the card marks the state. */
export function syncCmdShip(i){
  const k = cmdCrown(i);
  if(k < 0) return;
  const st = appState.G.st[i], dead = !!st.members[k].dead;
  if(dead === !!st.cmdDead) return;
  if(dead) st.cmdDead = true; else delete st.cmdDead;
  cmdsAboard(i).forEach(j => {
    const pool = j === appState.G.cmd ? appState.G.fleet : appState.G.st[j];
    if(!pool) return;
    if(dead){ pool.cmdGone = true; if(!pool.rerollsLost){ PLAY.flagshipBridgeSmashed(pool); pool.lostWithShip = true; } }
    else { delete pool.cmdGone; if(pool.lostWithShip){ delete pool.lostWithShip; PLAY.flagshipBridgeRestored(pool); } }
  });
  if(i === appState.G.flag){
    if(dead) skwCards(i).forEach(j => { const s = appState.G.st[j]; if(s.ldFrom === "commander"){ s.ld = s.ldRoll; s.ldFrom = null; } });
    else applyCommanderLd();
  }
}
/* commander j's ship is gone (syncCmdShip) */
export const cmdGone = j => { const p = j === appState.G.cmd ? appState.G.fleet : appState.G.st[j]; return !!(p && p.cmdGone); };
/* A commander equal to the fleet commander - a second or third Ork
   Warlord: he leads ships of his own, so a Bridge Smashed on his ship loses
   his re-rolls as the flagship's loses the fleet commander's (p. 67, T43). */
export const coCmd = j => appState.G.cmd != null && j !== appState.G.cmd && !!appState.U[j] && appState.U[j].R.kind === "commander" &&
  String(appState.U[j].R.entry && appState.U[j].R.entry.label) === String(appState.U[appState.G.cmd].R.entry && appState.U[appState.G.cmd].R.entry.label);
/* Da Ork Clanz: whose ships these are (the builder's command, J216) - a
   Warlord's re-rolls "only count for the skwadrons under his command"
   (Fleets p. 374). */
export function warlordOf(i){
  const ws = (fleetRes().warlords || []).filter(W => W && W.units);
  return ws.length < 2 ? null : ws.filter(W => W.units.indexOf(i) >= 0)[0] || null;
}
/* the builder's colours for a Warlord (the Registry's CLAN_COLOR and
   WL_PALETTE, J226): his clan's, else one of six by his number */
export const CLAN_COL = { "Goffs": "#8d939c", "Evil Sunz": "#c8372d", "Bad Moonz": "#d4a017", "Deathskullz": "#2f6fd0", "Blood Axes": "#3f9b4f", "Snakebites": "#8a5a2b" };
export const WL_PAL = ["#d9711c", "#1b9aa0", "#8e5bd0", "#d0457f", "#6f8f2e", "#4a6fa5"];
export function wlColor(W){ const u = appState.U[W.unit] && appState.U[W.unit].u; return (u && u.clan && CLAN_COL[u.clan]) || WL_PAL[(W.n - 1) % WL_PAL.length]; }
export function wlTag(i){
  const W = warlordOf(i);
  return W ? `<span class="tag wl" style="--wl:${wlColor(W)}" title="${esc("Under " + unitName(W.unit) + ": his re-rolls only (Fleets p. 374)")}">W${W.n}</span>` : "";
}
/* What an Ork Warlord does besides his re-rolls: in Da Ork Clanz he "adds
   +2 to one boarding dice roll per game" (Fleets p. 374) - one box; in the
   Waaagh! and the Cyclops Cluster "a vessel carrying a Warlord doubles its
   boarding value" (pp. 368, 367), not a space hulk's (p. 392). */
/* the Clanz Warlord's +2: one box in the row of his re-roll boxes, used or
   not like them (a once-per-game thing at the same place on the card) */
export function wl2Box(j){
  if(!(j >= 0 && isWarlord(j) && appState.L0.clanz)) return "";
  const used = !!appState.G.st[j].wl2, gone = cmdGone(j);
  return `<button class="rrx b2${used || gone ? " used" : ""}" data-act="wl2" data-i="${j}" aria-pressed="${used}"${gone ? " disabled" : ""} aria-label="${used ? "Plus 2 to a boarding roll: used" : "Plus 2 to one boarding roll this game: free"}" title="Fleets p. 374: a Warlord adds +2 to one boarding dice roll per game"><b>+2</b><small>boarding</small></button>`;
}
export function wlExtra(j){
  if(!isWarlord(j)) return "";
  if(appState.L0.clanz) return "";
  const sh = j === appState.G.cmd ? appState.G.flag : (appState.G.on || {})[j];
  const hulk = sh != null && appState.U[sh] && /hulk/i.test(String(appState.U[sh].R.className || ""));
  return `<small>${hulk ? MID + " on a space hulk: boarding value not doubled (Fleets p. 392)" : MID + " his ship doubles its boarding value (Fleets p. " + (/cyclops/i.test(appState.L0.nm) ? 365 : 366) + ")"}</small>`;
}
/* The ships the SQN button is offered to: capital ships; a star fort
   "cannot squadron with other orbital defences" (Rulebook p. 100). */
export function sqnShip(R){ return R.kind === "ship" && !PLAY.isEscort(R) && !PLAY.isFort(R); }
/* A capital squadron's letter: the builder's own alphabet (freeSqTag,
   apps/registry/src/warlords.js). */
export const SQN_LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const isSqnLetter = t => t.length === 1 && SQN_LETTERS.indexOf(t) >= 0;
/* J222: the builder's squadrons (u.sq, the same tag = one squadron, J216)
   start the game squadroned. A tag shared by two or more such ships is an
   SQN group under the builder's own letter, however many there are (user
   4.11.2026: since J232 the Clanz kroozers and Roks are skwadrons by their
   tag, so four or more are common), and the phone says what the builder and
   the printed roster say. A tag that is no letter (the builder writes none:
   a hand-made file, a crafted link) takes the first letter no tag of the
   fleet has. A tag on one ship alone starts free, as does an escort
   (RULINGS.md T42). The SQN button changes it as before (nextSqn). */
export function builderGroups(units){
  const tagOf = units.map(x => x.u && x.u.sq && sqnShip(x.R) ? String(x.u.sq) : null);
  const tags = tagOf.filter((t, j) => t && tagOf.indexOf(t) === j && tagOf.filter(s => s === t).length >= 2).sort();
  const letter = {}, taken = units.map(x => x.u && x.u.sq ? String(x.u.sq) : "");
  tags.forEach(t => { if(isSqnLetter(t)) letter[t] = t; });
  tags.forEach(t => {
    if(letter[t]) return;
    const given = Object.keys(letter).map(k => letter[k]);
    letter[t] = SQN_LETTERS.split("").filter(c => taken.indexOf(c) < 0 && given.indexOf(c) < 0)[0] || null;
  });
  /* A mixed escort squadron (28.10.2026): escort cards with one letter are
     one squadron here too - one Leadership, one order, one Brace - under
     the key "e:" + the builder's letter, which the SQN button never gives.
     Each card keeps its own members to kill. A Clanz mixed tiddla is one,
     with a Blood Axe tiddla's commandeered escorts (RULINGS.md "T42, escort
     squadrons", the user's decision 4.11.2026). */
  const escOf = units.map(x => x.u && x.u.sq && x.R.kind === "ship" && PLAY.isEscort(x.R) ? String(x.u.sq) : null);
  return tagOf.map((t, j) => t && letter[t] ? letter[t]
    : escOf[j] && escOf.filter(s => s === escOf[j]).length >= 2 ? "e:" + escOf[j] : null);
}
export const grpLabel = g => String(g || "").replace(/^e:/, "");
/* the label in a page: an escort squadron's is the tag of a link or a file */
export const grpHTML = g => esc(grpLabel(g));
export const isEscGrp = g => /^e:/.test(String(g || ""));
/* The SQN button (T42): none, the letters of the fleet's capital squadrons
   in order (this ship's own among them), then one new letter - the first no
   other ship has, in this game or in the builder - and none again. A ship
   alone in that new letter goes on to none, never to another new one. */
export function nextSqn(i){
  const grp = appState.G.grp, cur = grp[i] == null ? null : grp[i];
  const others = grp.filter((g, j) => j !== i && g);
  const fresh = SQN_LETTERS.split("").filter(c => others.every(g => grpLabel(g) !== c) &&
    appState.U.every((x, j) => j === i || !x.u || String(x.u.sq || "") !== c))[0] || null;
  const mine = cur && !isEscGrp(cur) && cur !== fresh ? [cur] : [];
  const seq = [null].concat(others.filter(g => !isEscGrp(g)).concat(mine).filter((g, k, a) => a.indexOf(g) === k).sort(), fresh ? [fresh] : []);
  return seq[(seq.indexOf(cur) + 1) % seq.length];
}
/* A unit whose Leadership is not rolled has it from the start: planetary
   defences Ld 7 (Rulebook p. 100, Fleets p. 499), the Fortress-Monastery
   Ld 10 (Fleets p. 111). A value the player tapped for such a unit in an
   older record gives way to the book's. */
export function fixedLds(){
  appState.U.forEach((x, i) => {
    const fx = PLAY.fixedLd(x.R), st = appState.G.st[i];
    if(x.R.kind !== "ship" || st.ldFrom === "commander") return;
    if(fx){ st.ld = fx.value; st.ldRoll = null; st.ldFrom = "fixed"; return; }
    /* a value the book sets without a roll (Tyranids pp. 418, 429, an Ork
       Hulk's 6, a Sepulchre's 10, a Demiurg's start): put in at the start,
       once (user 8.11.2026: "do they even roll Ld?") - a value already
       there, the player's or an older record's, stays */
    if(st.ld != null) return;
    const p = ldPlanOf(i);
    if(!p || p.roll) return;
    if(p.vanguard){ st.ld = st.ldRoll = Math.min(10, PLAY.alive(st) || (st.members || []).length || 1); st.ldFrom = "vanguard"; return; }
    if(p.value != null){ st.ld = st.ldRoll = p.value; st.ldFrom = "book"; }
  });
}
/* The Leadership a unit has without a commander: its fixed value, else
   its roll (null until it is rolled). */
export function ownLd(i){
  const fx = PLAY.fixedLd(appState.U[i].R);
  return fx ? fx.value : (appState.G.st[i].ldRoll == null ? null : appState.G.st[i].ldRoll);
}
/* The boxes a pool starts with: the re-rolls that are the fleet's as built
   - the open options are not, until one is taken into use. */
export function rrKinds(rr){ return rr && rr.boxes ? rr.boxes.filter(k => k !== "optional") : []; }
/* A game saved before the boxes existed gets them laid over its counts. */
export function adoptPools(){
  const cr = appState.G.cmd != null ? appState.U[appState.G.cmd].R.rerolls : null;
  /* a fleet without a commander had no count at all before the boxes: its
     boxes start free; the per-turn flag comes from the roster every time */
  PLAY.adoptRerolls(appState.G.fleet, rrKinds(cr || fleetRR()), { fresh: appState.G.cmd == null, perTurn: !!(cr && cr.unit === "per turn") });
  appState.U.forEach((x, j) => {
    if(x.R.kind === "commander" && j !== appState.G.cmd && x.R.rerolls)
      PLAY.adoptRerolls(appState.G.st[j], rrKinds(x.R.rerolls), { perTurn: x.R.rerolls.unit === "per turn" });
    if(x.R.kind === "ship" && x.R.rerolls) PLAY.adoptRerolls(appState.G.st[j], rrKinds(x.R.rerolls), { fresh: true });
  });
}
/* The commander's Leadership line (Fleets book, e.g. p. 35 "improves its
   Leadership to the value shown"): a fixed value replaces the roll, a
   modifier is added to it (RULINGS.md T8). */
/* Every commander aboard a ship, not only the fleet commander (user
   8.11.2026: "when something changes the Ld - Chaos Lords for one - a
   colour mark after the roll and an explanation, as Clanz does with Mob
   Rule"; T40's "another commander's line is yours to add" no longer
   holds): the fleet commander on his flagship first, then each other
   commander on his ship (G.on). */
export function cmdShips(){
  const G = appState.G, out = {};
  if(G.cmd != null && G.flag != null) out[G.flag] = G.cmd;
  Object.keys(G.on || {}).forEach(j => { const s = G.on[j]; if(s != null && out[s] == null) out[s] = +j; });
  return out;
}
export function applyCommanderLd(){
  const G = appState.G, on = cmdShips();
  /* a ship that carried a commander's line before gets its own roll back
     (or nothing, until it rolls) */
  G.st.forEach((s, j) => { if(on[j] == null && s.ldFrom === "commander"){ s.ld = ownLd(j); s.ldFrom = PLAY.fixedLd(appState.U[j].R) ? "fixed" : null; } });
  Object.keys(on).forEach(k => {
    const s = +k, ld = appState.U[on[s]].R.leadership, st = G.st[s];
    if(!st || !ld || ld.value == null) return;
    /* aboard a star fort too "their own Leadership value is used by the
       fort" (Fleets p. 503; the Fortress-Monastery "even if less!", p. 111) */
    const own = ownLd(s);
    if(ld.kind === "fixed"){ st.ld = ld.value; st.ldFrom = "commander"; }
    else if(own != null){ st.ld = Math.min(ld.max || 10, own + ld.value); st.ldFrom = "commander"; }
  });
}
export function setLd(i, v){
  /* a mixed escort squadron rolls one Leadership (p. 45: "per escort
     squadron"): the value goes on every card of the squadron */
  const g = appState.G.grp[i];
  const ms = isEscGrp(g) ? appState.G.grp.map((x, j) => x === g ? j : -1).filter(j => j >= 0) : [i];
  ms.forEach(j => { const st = appState.G.st[j]; st.ldRoll = v; st.ld = v; st.ldFrom = null; delete st.ldKept; });
  const on = cmdShips();
  if(ms.some(j => on[j] != null)) applyCommanderLd();
}

/* ---- Da Ork Clanz: Young Gunz, Mob Rule and the Leadership swaps -------
   The owner's design of 4.11.2026 (RULINGS.md T63): under Roll Ld, Apply
   works Young Gunz and Mob Rule out on the values the set-up shows, in the
   book's order - a battleship's swap (Fleets pp. 376-381), then a
   Warlord's (p. 374), then Young Gunz on the value after them, then Mob
   Rule (p. 372). Everything stays the player's to change: a tapped value
   always wins (T44). The state: st.mob on every card of an applied
   skwadron; st.yg (a class label or "none") and st.ygPick (the class
   remembered) on its first card; st.swap (the partner) on the battleship or
   the Warlord who swaps; a free escort is one more member {free: true} of
   a card of its class, or a card of its own appended at the end (u.yg). */

/* the cards of unit i's skwadron: its escort squadron (one Leadership,
   Rulebook p. 45), else itself */
export function skwCards(i){
  const g = appState.G.grp[i];
  return isEscGrp(g) ? appState.G.grp.map((x, j) => x === g ? j : -1).filter(j => j >= 0) : [i];
}
export const skwHead = i => skwCards(i)[0];
export const skwUnits = h => skwCards(h).map(j => ({ R: appState.U[j].R, st: appState.G.st[j] }));
/* a card the page added for Young Gunz: a free escort of a class the
   skwadron has no card of, appended after every card of the builder */
export const isFreeCard = j => !!(appState.U[j] && appState.U[j].u && appState.U[j].u.yg);
export const paidCards = h => skwCards(h).filter(j => !isFreeCard(j));
/* the escorts paid for, commandeered ones too: "the skwadron cannot exceed
   ten escorts" (Fleets p. 372) */
export const paidModels = h => paidCards(h).reduce((a, j) => a + (appState.U[j].R.hulls | 0), 0);
export const isApplied = h => skwCards(h).some(j => !!appState.G.st[j].mob);
export const skwName = h => isEscGrp(appState.G.grp[h]) ? "Squadron " + grpLabel(appState.G.grp[h]) : unitName(h);
/* the skwadron's Leadership now, Mob Rule and all (PLAY.squadronLd /
   PLAY.leadership) */
export function skwLd(h, opt){
  const us = skwUnits(h);
  return us.length > 1 ? PLAY.squadronLd(us, appState.G.fleet, opt) : PLAY.leadership(us[0].R, us[0].st, appState.G.fleet, opt);
}
/* the Ork tiddla skwadrons of a Da Ork Clanz fleet, by their first card */
export function tiddlaHeads(){
  if(!appState.L0 || !appState.L0.clanz || !appState.G) return [];
  const seen = {};
  return appState.U.map((x, i) => {
    if(x.R.kind !== "ship" || isFreeCard(i)) return -1;
    const h = skwHead(i);
    if(seen[h]) return -1;
    seen[h] = 1;
    return skwCards(h).some(j => PLAY.isTiddla(appState.U[j].R)) ? h : -1;
  }).filter(i => i >= 0);
}
/* the list's Ork escort classes in its order, from the data: the Clanz
   tiddla's five (Fleets p. 374) */
export function ygClasses(){
  const L0 = appState.L0, c = L0 && L0.clanz;
  const sec = c && c.tiddla ? L0.secs.find(s => new RegExp(c.tiddla, "i").test(s.t)) : null;
  return sec ? sec.ents.filter(e => e.k === "unit").map(e => ({ label: e.l, price: e.p, ref: e.r })) : [];
}
export const ygChoice = h => PLAY.youngGunzChoice(paidCards(h).map(j => appState.U[j].R), ygClasses());
/* Young Gunz is tested on the value after the swaps and before Mob Rule
   (p. 372): st.ld, which Mob Rule never touches */
export const ygEligible = h => PLAY.youngGunz(appState.G.st[h].ld, paidModels(h));
/* the free escort is one more member of a paid card of its class: the
   free ship is like the skwadron's cheapest one (the owner, 6.11.2026: "it
   gives one like the cheapest ship of the squadron ... the same card"), a
   Grunt card with Klaws included - its per-vessel options come with it.
   Of two cards of the class, the one paid least per vessel. A class the
   skwadron has no card of is a card of its own (T63). */
function ygHost(h, label){
  const cards = paidCards(h).filter(j => { const R = appState.U[j].R; return PLAY.isTiddla(R) && R.entry.label === label; });
  return cards.sort((a, b) => PLAY.vesselPaid(appState.U[a].R) - PLAY.vesselPaid(appState.U[b].R))[0];
}
/* where the skwadron's free escort is now: { label, card, own } */
export function ygFree(h){
  const st = appState.G.st[h], lab = st && st.yg;
  if(!lab || lab === "none") return null;
  const own = skwCards(h).find(j => isFreeCard(j) && appState.U[j].R.entry.label === lab);
  if(own != null) return { label: lab, card: own, own: true };
  const host = skwCards(h).find(j => !isFreeCard(j) && (appState.G.st[j].members || []).some(m => m.free));
  return host != null ? { label: lab, card: host, own: false } : null;
}
/* the free escorts the decisions ask for, put on the cards: a member more,
   or a card of its own. Returns true when the fleet document changed. */
export function syncFree(){
  const G = appState.G, U = appState.U, heads = tiddlaHeads(), want = {};
  heads.forEach(h => {
    const lab = G.st[h].yg;
    /* after Start Young Gunz is read-only (T63 decision 9): an un-applied
       skwadron keeps the free escort it took at the set-up */
    if(lab && lab !== "none" && (isApplied(h) || G.started)) want[h] = { label: lab, host: ygHost(h, lab) };
  });
  const hosts = Object.keys(want).map(h => want[h].host).filter(k => k != null);
  U.forEach((x, k) => {
    const st = G.st[k];
    if(!Array.isArray(st.members) || isFreeCard(k)) return;
    const has = st.members.some(m => m.free), host = hosts.indexOf(k) >= 0;
    if(has && !host) st.members = st.members.filter(m => !m.free);
    else if(host && !has) st.members.push({ dead: false, free: true });
  });
  const first = U.findIndex((x, k) => isFreeCard(k)), b = first < 0 ? U.length : first;
  const desired = heads.filter(h => want[h] && want[h].host == null).map(h => ({ h: h, label: want[h].label }));
  const have = U.slice(b).map(x => ({ h: x.u.ygOf, label: x.R.entry.label }));
  if(JSON.stringify(desired) === JSON.stringify(have)) return false;
  return rebuildFree(b, desired);
}
/* The free cards are the last rows of the game's own fleet document and of
   every list kept by unit (G.st, G.grp, G.nm, G.order): they are rebuilt
   there, and nothing of the builder's rows moves (AGENTS.md: a shifted index
   shows nowhere). A free card is one ship at 0 pts (the saved field adj),
   in its skwadron's letter, so its clan and Gubbins cover it (Fleets
   pp. 371-372, T60); a lone tiddla is given a letter for it, and gives it
   back when the card goes. */
function rebuildFree(b, desired){
  const G = appState.G, L0 = appState.L0, U0 = appState.U;
  const keep = JSON.stringify(G);
  G.doc = JSON.parse(JSON.stringify(G.doc));     /* the game's own copy, never the builder's */
  const rowOf = k => U0[k] && U0[k].d != null ? G.doc.units[U0[k].d] : null;
  G.doc.units = G.doc.units.filter(u => !(u && u.yg));
  G.st.length = b; G.grp.length = b;
  if(G.nm) Object.keys(G.nm).forEach(k => { if(+k >= b) delete G.nm[k]; });
  if(Array.isArray(G.order)) G.order = G.order.filter(k => k < b);
  /* a skwadron of one card left: no squadron of its own any more */
  for(let k = 0; k < b; k++){
    const g = G.grp[k];
    if(!isEscGrp(g) || G.grp.filter(x => x === g).length > 1 || desired.some(w => w.h === k)) continue;
    G.grp[k] = null;
    const row = rowOf(k);
    if(row && row.ygSq){ delete row.sq; delete row.ygSq; }
  }
  const si = L0.secs.findIndex(s => new RegExp(L0.clanz.tiddla, "i").test(s.t));
  const used = () => G.doc.units.map(u => u && u.sq).filter(Boolean).map(String);
  for(const w of desired){
    const sec = L0.secs[si], ei = sec ? sec.ents.findIndex(e => e.l === w.label) : -1, en = ei >= 0 ? sec.ents[ei] : null, hrow = rowOf(w.h);
    if(!en || !hrow){ appState.G = JSON.parse(keep); return false; }
    let letter = hrow.sq;
    if(!letter){ letter = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").find(c => used().indexOf(c) < 0) || "Z"; hrow.sq = letter; hrow.ygSq = 1; }
    const g = "e:" + letter;
    G.grp[w.h] = g;
    /* named for the strip and the lists: "Free Grunt" (the class in full is on its card) */
    const sh = DATA.ships[String(en.r)];
    G.doc.units.push({ s: si, e: ei, sn: sec.t, el: en.l, ref: en.r, n: 1, name: "Free " + title(String(sh ? sh.nm : en.l).split(/\s+/)[0]), adj: -(en.p | 0), sq: letter, cmd: hrow.cmd, yg: 1, ygOf: w.h });
    G.grp.push(g);
  }
  const res = resolveFleet(G.doc);
  if(res.error || res.units.length !== b + desired.length){ appState.G = JSON.parse(keep); return false; }
  appState.U = res.units; appState.L0 = res.L0; FR = null;
  /* a free card shares its skwadron's one Leadership and Mob Rule (p. 45) */
  desired.forEach(w => {
    const k = G.st.length, st0 = G.st[w.h], st = PLAY.freshUnit(res.units[k].R);
    st.ld = st0.ld; st.ldRoll = st0.ldRoll; st.ldFrom = st0.ldFrom;
    if(st0.mob) st.mob = true;
    (st.members || []).forEach(m => { m.free = true; });
    G.st.push(st);
  });
  return true;
}
/* Apply (one act, one UNDO step): every Ork tiddla skwadron, Young Gunz on
   the value after the swaps - kept "none", the class remembered if still
   allowed, else the page's proposal; off when it is not on Ld 5-6 or has ten
   - then Mob Rule's +1 on. After Start Young Gunz is read-only: Mob Rule
   only (T63). Returns what it did, for the toast. */
export function applyYG(){
  const G = appState.G, heads = tiddlaHeads();
  const before = {};
  heads.forEach(h => { before[h] = skwLd(h).now; });
  heads.forEach(h => {
    const st = G.st[h];
    if(!G.started){
      const ch = ygChoice(h);
      if(ygEligible(h) && ch && ch.allowed.length){
        const ok = lab => !!lab && lab !== "none" && ch.allowed.some(c => c.label === lab);
        if(st.yg !== "none") st.yg = ok(st.yg) ? st.yg : ok(st.ygPick) ? st.ygPick : ch.proposal;
      }else if(st.yg && st.yg !== "none"){ st.ygPick = st.yg; delete st.yg; }
    }
    skwCards(h).forEach(k => { G.st[k].mob = true; });
  });
  G.ygApplied = true;
  syncFree();
  const out = [];
  tiddlaHeads().forEach(h => {
    const f = ygFree(h), now = skwLd(h).now;
    if(f && !G.started) out.push("+1 " + title(appState.U[f.card].R.className));
    if(now !== before[h] || PLAY.mobRule(skwUnits(h))) out.push(skwName(h) + " Ld " + G.st[h].ld + " \u2192 " + now);
  });
  return out;
}
/* A skwadron no longer applied - its value changed after Apply: Mob Rule
   off until Apply again; before Start its free escort comes off, its class
   remembered, and a "none" stays (T63). */
export function unapply(h){
  const G = appState.G;
  if(!isApplied(h)) return false;
  skwCards(h).forEach(k => { delete G.st[k].mob; });
  const st = G.st[h];
  if(!G.started && st.yg && st.yg !== "none"){ st.ygPick = st.yg; delete st.yg; }
  return true;
}
/* the skwadrons of these cards, un-applied; the free escorts follow */
export function unapplyCards(cards){
  const heads = tiddlaHeads(), done = {};
  let any = false;
  (cards || []).forEach(k => { const h = skwHead(k); if(done[h] || heads.indexOf(h) < 0) return; done[h] = 1; if(unapply(h)) any = true; });
  if(any) syncFree();
  return any;
}
/* the mark's choice: another class allowed, or "none" (Young Gunz is
   optional: "gets", but the book's example "may have", T63) */
export function setYG(h, val){
  const G = appState.G, st = G.st[h];
  if(G.started || !isApplied(h) || !st) return false;
  if(val === "none") st.yg = "none";
  else{
    const ch = ygChoice(h);
    if(!ch || !ch.allowed.some(c => c.label === val)) return false;
    st.yg = val; st.ygPick = val;
  }
  syncFree();
  return true;
}
/* --- the swaps: a battleship's (Fleets pp. 376-381) and a Clanz Warlord's
   (p. 374), chosen on their rows; the values are worked out from the first
   values (the roll or the tap, st.ldRoll) with the swaps in the book's
   order: the battleships' first, then the Warlords' (T63 decision 5) --- */
/* the ship a Warlord is aboard (J233) */
export const wlShip = j => j === appState.G.cmd ? appState.G.flag : (appState.G.on || {})[j];
export const isBbSwapper = j => !!(appState.U[j] && appState.U[j].R.kind === "ship" && !isFreeCard(j) && PLAY.bbSwapRule(appState.U[j].R));
export const isClanzWarlord = j => !!(appState.L0 && appState.L0.clanz && isWarlord(j));
/* the partners a battleship may take: a Kill Kroozer, a Terror Ship or
   Zukov's Klaw of the fleet (pp. 376-381, 383), whose Leadership is rolled */
export function bbPartners(j){
  const rule = PLAY.bbSwapRule(appState.U[j].R);
  return appState.U.map((x, k) => k !== j && PLAY.bbSwapPartner(x.R, rule) && (ldPlanOf(k) || {}).roll ? k : -1).filter(k => k >= 0);
}
/* the partners a Warlord may take: one ship or escort squadron of his own
   command (p. 374), each by its first card */
export function wlPartners(j){
  const W = (fleetRes().warlords || []).filter(w => w && w.unit === j)[0], ship = wlShip(j);
  if(!W || ship == null || !W.units) return [];
  const us = W.units.filter(k => appState.U[k] && !isFreeCard(k)).map(k => ({ i: k, R: appState.U[k].R, grp: appState.G.grp[k] }));
  return PLAY.warlordSwapPartners(us, ship).map(k => skwHead(k));
}
/* the swaps in force, in the order they apply: { j (who chose it), a (his
   ship's skwadron), b (the partner's), page } */
export function swapRecs(){
  const G = appState.G, out = [];
  if(!G) return out;
  appState.U.forEach((x, j) => {
    const p = G.st[j] && G.st[j].swap;
    if(p == null || !isBbSwapper(j) || bbPartners(j).indexOf(p) < 0) return;
    out.push({ j: j, a: j, b: p, page: PLAY.bbSwapRule(x.R).page || 376 });
  });
  appState.U.forEach((x, j) => {
    const p = G.st[j] && G.st[j].swap, a = isClanzWarlord(j) ? wlShip(j) : null;
    if(p == null || a == null || wlPartners(j).indexOf(p) < 0) return;
    out.push({ j: j, a: skwHead(a), b: p, page: 374 });
  });
  return out;
}
/* a card's first value: its roll or tap before any swap */
const firstLd = k => { const st = appState.G.st[k]; return st.ldFrom == null && st.ldRoll != null ? st.ldRoll : st.ld; };
/* the swaps played out on the first values (PLAY.applySwaps), by skwadron */
export function swapPlay(recs){
  const vals = {};
  (recs || swapRecs()).forEach(r => [r.a, r.b].forEach(h => { if(!(h in vals)) vals[h] = firstLd(h); }));
  return PLAY.applySwaps(vals, recs || swapRecs());
}
/* every card's value from the first values and the swaps; touched: cards of
   a swap that has just ended, back to their first values */
export function syncSwaps(touched){
  const G = appState.G, recs = swapRecs(), play = swapPlay(recs);
  const cards = (touched || []).slice();
  recs.forEach(r => cards.push.apply(cards, skwCards(r.a).concat(skwCards(r.b))));
  cards.forEach(k => { const st = G.st[k]; if(st && st.ldFrom == null && st.ldRoll != null) st.ld = st.ldRoll; });
  Object.keys(play.vals).forEach(h => skwCards(+h).forEach(k => { const st = G.st[k]; if(st && st.ldFrom == null && play.vals[h] != null) st.ld = play.vals[h]; }));
}
/* A tap on a value ends the swaps it is in (T44: a tapped value always
   wins); the other side keeps the value it has now - "kept from an ended
   swap", the owner's prototype - and so does each value a chain of swaps
   passed through. Returns the cards it touched. */
export function endSwapsAt(i){
  const G = appState.G, recs = swapRecs(), h = skwHead(i);
  const comp = [h], hit = [];
  let grew = true;
  while(grew){
    grew = false;
    recs.forEach((r, n) => {
      if(hit.indexOf(n) >= 0 || (comp.indexOf(r.a) < 0 && comp.indexOf(r.b) < 0)) return;
      hit.push(n); grew = true;
      [r.a, r.b].forEach(u => { if(comp.indexOf(u) < 0) comp.push(u); });
    });
  }
  if(!hit.length) return [];
  const touched = [], page = {};
  hit.forEach(n => [recs[n].a, recs[n].b].forEach(u => { if(!(u in page)) page[u] = recs[n].page || true; }));
  comp.forEach(u => skwCards(u).forEach(k => {
    const st = G.st[k];
    touched.push(k);
    if(u === h || st.ldFrom != null || st.ld == null || st.ldRoll === st.ld) return;
    st.ldRoll = st.ld; st.ldKept = page[u] || true; delete st.ldDie; delete st.ldWhy;
  }));
  hit.forEach(n => { delete G.st[recs[n].j].swap; });
  return touched;
}
/* A swap chosen on its row, or "no swap" (p = null): the two values are
   exchanged at once, or back; the skwadrons it touches are no longer
   applied (T63). */
export function setSwap(j, p){
  const G = appState.G, st = G.st[j];
  if(!st) return false;
  const old = swapRecs().filter(r => r.j === j), touched = [];
  old.forEach(r => touched.push.apply(touched, skwCards(r.a).concat(skwCards(r.b))));
  const ok = p == null ? true : isBbSwapper(j) ? bbPartners(j).indexOf(p) >= 0 : isClanzWarlord(j) && wlPartners(j).indexOf(p) >= 0;
  if(!ok) return false;
  const was = G.st.map(s => s.ld);
  if(p == null) delete st.swap; else st.swap = p;
  syncSwaps(touched);
  swapRecs().filter(r => r.j === j).forEach(r => touched.push.apply(touched, skwCards(r.a).concat(skwCards(r.b))));
  G.st.forEach((s, k) => { if(s.ld !== was[k]) touched.push(k); });
  if(!G.started) unapplyCards(touched);
  return true;
}
/* a Warlord who moves to another ship: his swap ends first, the values back */
export function endSwapOf(j){
  const G = appState.G;
  if(!G.st[j] || G.st[j].swap == null) return;
  const old = swapRecs().filter(r => r.j === j), touched = [];
  old.forEach(r => touched.push.apply(touched, skwCards(r.a).concat(skwCards(r.b))));
  delete G.st[j].swap;
  syncSwaps(touched);
  if(!G.started) unapplyCards(touched);
}

export function save(){
  if(!appState.G) return;
  appState.V.saveErr = !lsSet(KEY_PLAY, JSON.stringify(appState.G));
}
export function loadPlay(){
  const raw = lsGet(KEY_PLAY);
  if(!raw) return null;
  try{ const g = JSON.parse(raw); return (g && g.v === 1 && g.doc && Array.isArray(g.st)) ? g : null; }catch(e){ return null; }
}
/* Open a saved game against its own roster copy. */
export function resumeGame(g){
  const res = resolveFleet(g.doc);
  if(res.error || res.units.length !== g.st.length) return false;
  normaliseUntracked(g);
  appState.G = g; appState.U = res.units; appState.L0 = res.L0; FR = null;
  delete appState.G.report;   /* the game report is gone (J235) */
  adoptPools();
  /* a game saved before J233 had the fleet commander aboard only */
  if(!appState.G.on) appState.G.on = placeOthers();
  /* a record from before the quadrant tracks, the member boxes of one-hit
     defences or the unrolled Leaderships is brought up to them */
  appState.U.forEach((x, i) => PLAY.adoptUnit(x.R, appState.G.st[i]));
  syncAllPre();                            /* a game saved before st.fx existed */
  fixedLds();
  return true;
}


/* ---- Rolling before the game (user 31.10.2026, RULINGS.md T44) --------
   The page rolls when the player asks it to; every value stays the
   player's to change (the Ld tiles, the selects). */
/* a unit's Leadership plan on its fleet's table (PLAY.ldPlan); an escort
   squadron of several cards rolls once, a Clanz tiddla on the Orks' table
   whatever its first card is (PLAY.skwadronPlan, T63) */
export const ldPlanOf = i => {
  const g = appState.G && appState.G.grp ? appState.G.grp[i] : null, nm = appState.L0 && appState.L0.nm;
  return isEscGrp(g) ? PLAY.skwadronPlan(skwCards(i).map(j => appState.U[j].R), nm) : PLAY.ldPlan(appState.U[i].R, nm);
};
/* the units that roll: a ship whose plan rolls, one card per escort
   squadron (p. 45: "per escort squadron") */
export function ldRollers(){
  const seen = {};
  return appState.U.map((x, i) => {
    if(x.R.kind !== "ship") return -1;
    const p = ldPlanOf(i);
    /* a value the book sets (an Ork Hulk's 6, a Sepulchre's 10, a Demiurg's
       start) is put in by the same button; fixedLd's units have theirs */
    if(!p || (!p.roll && (p.value == null || PLAY.fixedLd(x.R)))) return -1;
    const g = appState.G.grp[i];
    if(isEscGrp(g)){ if(seen[g]) return -1; seen[g] = 1; }
    return i;
  }).filter(i => i >= 0);
}
/* Roll unit i's Leadership: the value goes in as if tapped (setLd), with
   the die and the sum kept for the row. A natural 6 on the Mechanicus
   table lets a ship choose its Gift (Fleets p. 118). */
export function rollLd(i, rng){
  const p = ldPlanOf(i);
  const r = p && !p.roll && p.value != null ? { value: p.value, die: null, why: "not rolled: " + p.note + " (Fleets p. " + p.page + ")" }
    : PLAY.ldFromDie(p, PLAY.d6(rng));
  if(!r) return null;
  setLd(i, r.value);
  const g = appState.G.grp[i];
  const ms = isEscGrp(g) ? appState.G.grp.map((x, j) => x === g ? j : -1).filter(j => j >= 0) : [i];
  ms.forEach(j => {
    const st = appState.G.st[j]; st.ldDie = r.die; st.ldWhy = r.why;
    if(p.table === PLAY.LD_TABLES.mechanicus && r.die === 6) st.giftChoice = true; else delete st.giftChoice;
  });
  /* a value rolled into a swap already chosen takes its place in it */
  if(swapRecs().length) syncSwaps(ms);
  return r;
}
/* only the units still without a value; all = true rolls every one again
   (not offered on the page: user 31.10.2026, no re-roll buttons) */
export function rollAllLd(all, rng){
  ldRollers().forEach(i => { if(all || appState.G.st[i].ld == null) rollLd(i, rng); });
}
/* A tap on an Ld tile after a roll: the player's value, the die forgotten */
export function forgetLdDie(i){
  const g = appState.G.grp[i];
  const ms = isEscGrp(g) ? appState.G.grp.map((x, j) => x === g ? j : -1).filter(j => j >= 0) : [i];
  ms.forEach(j => { const st = appState.G.st[j]; delete st.ldDie; delete st.ldWhy; });
}
/* The other pre-game rolls (packages/ui/pregame-tables.js): stored as
   st.pre[key] = { d } or { k, d } (the two-dice refit), how "roll" or "pick" */
export const preRollsOf = i => pregameRolls(appState.U[i].R);
/* What the rolls do to the profile, in numbers the rules read (PLAY.view:
   hits, speed, shields, turrets, Leadership, repair dice): st.fx, written
   whenever st.pre changes and when a game is resumed. Reinforced Hull's
   +25 % is turned into hits here, from the card's starting hits. */
export function syncPre(i){
  const R = appState.U[i].R, st = appState.G.st[i];
  const fx = pregameEffects(preRollsOf(i), st.pre);
  if(fx.hitsPct){ fx.hits = Math.ceil(((R.stats && R.stats.hits) | 0) * fx.hitsPct / 100); delete fx.hitsPct; }
  if(Object.keys(fx).length) st.fx = fx; else delete st.fx;
}
export function syncAllPre(){ appState.U.forEach((x, i) => syncPre(i)); }
export function rollPre(i, roll, rng){
  const st = appState.G.st[i]; st.pre = st.pre || {};
  st.pre[roll.key] = roll.two ? { k: PLAY.d6(rng), d: PLAY.d6(rng), how: "roll" } : { d: PLAY.d6(rng), how: "roll" };
  syncPre(i);
}
export function rollAllPre(all, rng){
  appState.U.forEach((x, i) => preRollsOf(i).forEach(roll => {
    if(roll.pick) return;                    /* bought as a choice: the player picks */
    const cur = (appState.G.st[i].pre || {})[roll.key];
    if(all || !cur) rollPre(i, roll, rng);
  }));
}
/* the player's own choice from the select: "" clears, "3" or "5-2" (kind-die) */
export function setPre(i, key, val){
  const st = appState.G.st[i]; st.pre = st.pre || {};
  const m = String(val || "").match(/^(?:(\d)-)?(\d)$/);
  if(!m) delete st.pre[key];
  else st.pre[key] = m[1] ? { k: parseInt(m[1], 10), d: parseInt(m[2], 10), how: "pick" } : { d: parseInt(m[2], 10), how: "pick" };
  syncPre(i);
}
/* how many pre-game rolls are still open / exist in the fleet */
export function preCounts(){
  let n = 0, open = 0;
  appState.U.forEach((x, i) => preRollsOf(i).forEach(roll => { n++; if(!(appState.G.st[i].pre || {})[roll.key]) open++; }));
  return { n, open };
}
