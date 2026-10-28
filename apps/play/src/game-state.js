import { appState } from "./state.js";
import { KEY_INFO, KEY_PLAY, PLAY_VERSION, lsGet, lsSet, normaliseUntracked } from "./storage.js";
import { MID } from "./helpers.js";
import { resolveFleet } from "./fleet-document.js";
import { unitName } from "./derived.js";
import { fleetRR } from "./render.js";
import { esc } from "../../../packages/ui/format.js";
import PLAY from "../rules.js";
import DOMAIN from "../../../packages/rules/domain.js";
import { DATA } from "../../../packages/ui/catalog.js";

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
          compact: lsGet(KEY_VIEW) === "compact", endph: false, phone: null, guardUntil: 0, lastScreen: null, linkNew: null, copied: "" };
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
     fleet's own (Necrons p. 404, Demiurg p. 486). Abaddon's come back every
     turn (Fleets p. 231). */
  const crr = cmd >= 0 ? res.units[cmd].R.rerolls : null;
  const frr0 = cmd < 0 ? DOMAIN.fleetRerolls(res.L0, res.units.map(x => x.R)) : null;
  const pool0 = crr || frr0;
  PLAY.setRerolls(fleet, pool0 ? pool0.total : 0, !!(crr && crr.unit === "per turn"), rrKinds(pool0));
  /* a further commander's re-rolls are his own (a Veteran Captain's, a
     Farseer's, a second Warlord's): they stay on his own row */
  res.units.forEach((x, j) => {
    if(x.R.kind === "commander" && j !== cmd && x.R.rerolls)
      PLAY.setRerolls(st[j], x.R.rerolls.total, x.R.rerolls.unit === "per turn", rrKinds(x.R.rerolls));
    /* a ship's own re-rolls (Scion of Prospero p. 258, a Mark of Tzeentch
       p. 234, a fortress-monastery p. 111) stay on its own card */
    if(x.R.kind === "ship" && x.R.rerolls)
      PLAY.setRerolls(st[j], x.R.rerolls.total, false, rrKinds(x.R.rerolls));
  });
  /* J233: the roster first - where a commander may board is asked of the
     fleet as a whole (carriersOf, DOMAIN.resolveFleet) */
  appState.U = res.units; appState.L0 = res.L0; FR = null;
  appState.G = { v: 1, play: PLAY_VERSION, fp: res.fp, src: res.src || "builder", ln: res.doc.ln, limit: res.doc.limit, doc: res.doc,
        fleet: fleet, st: st, grp: builderGroups(res.units), flag: null, cmd: cmd >= 0 ? cmd : null, ac: 0 };
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
   pp. 365, 366), a Da Ork Clanz Warlord to "the most expensive ship under
   his own command ... even if it is an escort" (p. 372). The fleet
   commander's ship is G.flag as before, every other commander's G.on[j]. */
export let FR = null;
export function fleetRes(){
  return FR || (FR = DOMAIN.resolveFleet({ list: appState.L0.nm, limit: appState.G.doc.limit | 0, units: appState.U.map(x => x.it) }, DATA));
}
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
/* A commander equal to the fleet commander - a second or third Ork
   Warlord: he leads ships of his own, so a Bridge Smashed on his ship loses
   his re-rolls as the flagship's loses the fleet commander's (p. 67, T43). */
export const coCmd = j => appState.G.cmd != null && j !== appState.G.cmd && !!appState.U[j] && appState.U[j].R.kind === "commander" &&
  String(appState.U[j].R.entry && appState.U[j].R.entry.label) === String(appState.U[appState.G.cmd].R.entry && appState.U[appState.G.cmd].R.entry.label);
/* Da Ork Clanz: whose ships these are (the builder's command, J216) - a
   Warlord's re-rolls "only count for the skwadrons under his command"
   (Fleets p. 372). */
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
  return W ? `<span class="tag wl" style="--wl:${wlColor(W)}" title="${esc("Under " + unitName(W.unit) + ": his re-rolls only (Fleets p. 372)")}">W${W.n}</span>` : "";
}
/* What an Ork Warlord does besides his re-rolls: in Da Ork Clanz he "adds
   +2 to one boarding dice roll per game" (Fleets p. 372) - one box; in the
   Waaagh! and the Cyclops Cluster "a vessel carrying a Warlord doubles its
   boarding value" (pp. 366, 365), not a space hulk's (p. 390). */
/* the Clanz Warlord's +2: one box in the row of his re-roll boxes, used or
   not like them (a once-per-game thing at the same place on the card) */
export function wl2Box(j){
  if(!(j >= 0 && isWarlord(j) && appState.L0.clanz)) return "";
  const used = !!appState.G.st[j].wl2;
  return `<button class="rrx b2${used ? " used" : ""}" data-act="wl2" data-i="${j}" aria-pressed="${used}" aria-label="${used ? "Plus 2 to a boarding roll: used" : "Plus 2 to one boarding roll this game: free"}" title="Fleets p. 372: a Warlord adds +2 to one boarding dice roll per game"><b>+2</b><small>boarding</small></button>`;
}
export function wlExtra(j){
  if(!isWarlord(j)) return "";
  if(appState.L0.clanz) return "";
  const sh = j === appState.G.cmd ? appState.G.flag : (appState.G.on || {})[j];
  const hulk = sh != null && appState.U[sh] && /hulk/i.test(String(appState.U[sh].R.className || ""));
  return `<small>${hulk ? MID + " on a space hulk: boarding value not doubled (Fleets p. 390)" : MID + " his ship doubles its boarding value (Fleets p. " + (/cyclops/i.test(appState.L0.nm) ? 365 : 366) + ")"}</small>`;
}
/* The ships the SQN button is offered to: capital ships; a star fort
   "cannot squadron with other orbital defences" (Rulebook p. 100). */
export function sqnShip(R){ return R.kind === "ship" && !PLAY.isEscort(R) && !PLAY.isFort(R); }
/* J222: the builder's squadrons (u.sq, the same tag = one squadron, J216)
   start the game squadroned. A tag shared by two or more such ships gets
   an SQN letter, A to C in the builder's tag order; a tag on one ship alone
   and a fourth squadron start free, as does an escort (RULINGS.md T42). The
   SQN button changes it as before. */
export function builderGroups(units){
  const tagOf = units.map(x => x.u && x.u.sq && sqnShip(x.R) ? String(x.u.sq) : null);
  const tags = tagOf.filter((t, j) => t && tagOf.indexOf(t) === j && tagOf.filter(s => s === t).length >= 2).sort().slice(0, 3);
  /* A mixed escort squadron (28.10.2026): escort cards with one letter are
     one squadron here too - one Leadership, one order, one Brace - under
     the key "e:" + the builder's letter, which the SQN button never gives.
     Each card keeps its own members to kill. */
  const escOf = units.map(x => x.u && x.u.sq && x.R.kind === "ship" && PLAY.isEscort(x.R) ? String(x.u.sq) : null);
  return tagOf.map((t, j) => t && tags.indexOf(t) >= 0 ? "ABC"[tags.indexOf(t)]
    : escOf[j] && escOf.filter(s => s === escOf[j]).length >= 2 ? "e:" + escOf[j] : null);
}
export const grpLabel = g => String(g || "").replace(/^e:/, "");
export const isEscGrp = g => /^e:/.test(String(g || ""));
/* A unit whose Leadership is not rolled has it from the start: planetary
   defences Ld 7 (Rulebook p. 100, Fleets p. 499), the Fortress-Monastery
   Ld 10 (Fleets p. 111). A value the player tapped for such a unit in an
   older record gives way to the book's. */
export function fixedLds(){
  appState.U.forEach((x, i) => {
    const fx = PLAY.fixedLd(x.R), st = appState.G.st[i];
    if(!fx || st.ldFrom === "commander") return;
    st.ld = fx.value; st.ldRoll = null; st.ldFrom = "fixed";
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
export function applyCommanderLd(){
  /* one flagship: a ship that carried the commander's line before gets its
     own roll back (or nothing, until it rolls) */
  appState.G.st.forEach((s, j) => { if(j !== appState.G.flag && s.ldFrom === "commander"){ s.ld = ownLd(j); s.ldFrom = PLAY.fixedLd(appState.U[j].R) ? "fixed" : null; } });
  if(appState.G.cmd == null || appState.G.flag == null) return;
  const ld = appState.U[appState.G.cmd].R.leadership, st = appState.G.st[appState.G.flag];
  if(!ld || ld.value == null) return;
  /* aboard a star fort too "their own Leadership value is used by the
     fort" (Fleets p. 503; the Fortress-Monastery "even if less!", p. 111) */
  const own = ownLd(appState.G.flag);
  if(ld.kind === "fixed"){ st.ld = ld.value; st.ldFrom = "commander"; }
  else if(own != null){ st.ld = Math.min(ld.max || 10, own + ld.value); st.ldFrom = "commander"; }
}
export function setLd(i, v){
  /* a mixed escort squadron rolls one Leadership (p. 45: "per escort
     squadron"): the value goes on every card of the squadron */
  const g = appState.G.grp[i];
  const ms = isEscGrp(g) ? appState.G.grp.map((x, j) => x === g ? j : -1).filter(j => j >= 0) : [i];
  ms.forEach(j => { const st = appState.G.st[j]; st.ldRoll = v; st.ld = v; st.ldFrom = null; });
  if(ms.indexOf(appState.G.flag) >= 0) applyCommanderLd();
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
  fixedLds();
  return true;
}

