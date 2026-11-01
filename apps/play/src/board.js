import { appState } from "./state.js";
import { MID } from "./helpers.js";
import { lsGet, lsSet } from "./storage.js";
import { cmdsAboard, save } from "./game-state.js";
import { act } from "./actions.js";
import { unitName } from "./derived.js";
import { render } from "./render.js";
import { peerHas, withPeer } from "./peer.js";
import { esc } from "../../../packages/ui/format.js";
import { optsFromUnit } from "../../boarding/src/play-link.js";
import PLAY from "../rules.js";

/* =================================================== BOARDING ACTIONS ===== */
/* The Board button on a ship's card opens Boarding Actions with the ship on it
   (boarding.html, the same app, apps/boarding), in a new tab or over the page: the
   player's choice, kept on this device. What the fleet
   decides comes along, its clan, crew, marks and commanders, its remaining hits
   and turrets, its orders and Blast Markers. Everything the rules can do there
   stays there; the result comes back and goes on the ship. */

const alive = j => {
  const x = appState.U[j], st = appState.G.st[j];
  return !!x && x.R.kind === "ship" && !PLAY.destroyed(x.R, st) && !st.disengaged && !st.hulkName;
};
/* The ships of unit j as Boarding reads them; a squadron's are one each. Reads
   appState.G, so it works on the opponent's fleet inside withPeer. */
export function boardShips(j, own){
  const x = appState.U[j], R = x.R, st = appState.G.st[j];
  const cmds = cmdsAboard(j).filter(c => appState.U[c]).map(c => ({ label: String(appState.U[c].R.entry && appState.U[c].R.entry.label || ""), R: appState.U[c].R }));
  const { opts, hints } = optsFromUnit(R, cmds, appState.L0.nm);
  const spent = appState.G.wlSpent && appState.G.wlSpent[j];
  const base = { list: R.entry.list, sec: R.entry.section, label: R.entry.label, ref: R.ref, opts: opts,
                 hints: hints.filter(h => !(spent && h === "clanzwarlord")) };
  /* the book's Holofield result on the Eldar table (FL p. 305) */
  const tk = PLAY.track(R, st);
  if(/ELDAR/i.test(String(R.source && R.source.faction)) && tk.crits && tk.crits["10"] > 0) base.noField = true;
  const tu = PLAY.num(R.stats && R.stats.turrets);
  if(tu != null) base.tu = PLAY.quadGone(R, st) ? 0 : tu;
  const mark = (o, m) => own ? Object.assign(o, { pj: j, m: m }) : o;
  if(PLAY.isEscort(R) && (st.members || []).length){
    const out = [];
    st.members.forEach((mb, m) => { if(!mb.dead) out.push(mark(Object.assign({}, base, { dp: (R.stats && R.stats.hits) || 1 }), m)); });
    return out;
  }
  const dp = PLAY.remaining(R, st), bv = PLAY.boardingValue(R, st);
  return [mark(Object.assign({}, base, { dp: dp }, bv.fort ? { q: Math.max(0, bv.attack - dp) } : {}), 0)];
}
function sideOf(js, own){
  const sts = js.map(j => appState.G.st[j]);
  return { ships: js.reduce((a, j) => a.concat(boardShips(j, own)), []),
           blast: sts.some(st => st.blast > 0), orders: sts.some(st => !!st.order) };
}
const sig = js => js.slice().sort((a, b) => a - b).join(",");

/* ------------------------------------------------ a new tab or this page --- */
const KEY_BOARD_WHERE = "gothic-fleet-play-board-where";
/* An installed app may open a tab in the browser, which cannot send the result
   back: there the page is the default. */
const installed = () => typeof matchMedia === "function" && matchMedia("(display-mode: standalone)").matches;
export const boardWhere = () => lsGet(KEY_BOARD_WHERE) || (installed() ? "here" : "tab");
/* the open action: { win, mine, close() } */
let frame = null;
export const boardOpen = () => frame;
function closeFrame(){ if(frame){ frame.close(); frame = null; } }
function openFrame(mine, enemy){
  const att = sideOf(mine, true);
  const def = enemy >= 0 ? withPeer(() => sideOf([enemy], false)) : { ships: [] };
  const b = appState.G.board;
  const round = b && b.sig === sig(mine) ? b.round : 1;
  closeFrame();
  const src = "boarding.html#play=" + encodeURIComponent(JSON.stringify({ att: att, def: def, round: round }));
  /* no noopener: the tab sends the result back through window.opener. A blocked
     tab falls back to this page. */
  const tab = boardWhere() === "tab" ? window.open(src, "_blank") : null;
  if(tab){
    frame = { win: tab, mine: sig(mine), close(){ try{ tab.close(); }catch(e){} try{ window.focus(); }catch(e){} } };
    return;
  }
  const el = document.createElement("iframe");
  el.className = "boardframe";
  el.title = "Boarding Actions";
  el.src = src;
  document.body.appendChild(el);
  frame = { win: el.contentWindow, mine: sig(mine), close(){ el.remove(); } };
}
function lost(x){
  const hurt = x.before - x.fin, bits = [];
  if(x.state === "destroyed") bits.push("destroyed");
  else if(hurt > 0) bits.push("−" + hurt);
  if(x.state !== "destroyed") (x.crits || []).forEach(c => bits.push(c.n + " " + c.name));
  if(x.state === "hulk") bits.push("drifting hulk");
  if(x.cata) bits.push(x.cata.name);
  return bits.length ? x.name + ": " + bits.join(", ") : "";
}
if(typeof window !== "undefined" && window.addEventListener) window.addEventListener("message", ev => {
  const m = ev.data;
  if(!frame || ev.source !== frame.win || !m || !m.bfgBoarding) return;
  if(m.t === "close"){ closeFrame(); return; }
  const G = appState.G; if(!G) return;
  const mine = frame.mine ? frame.mine.split(",").map(Number) : [];
  if(m.spent){ G.wlSpent = G.wlSpent || {}; mine.forEach(j => { G.wlSpent[j] = 1; }); }
  if(m.t === "round"){ G.board = { sig: frame.mine, round: m.round }; save(); return; }
  if(m.t !== "result") return;
  G.board = null;
  closeFrame();
  const ships = m.ships || [], byUnit = {};
  ships.forEach(x => { if(x.pj != null) (byUnit[x.pj] = byUnit[x.pj] || []).push(x); });
  /* a squadron's losses in one: "Grunt: destroyed x3" */
  const counted = a => { const n = {}; a.map(lost).filter(Boolean).forEach(t => { n[t] = (n[t] | 0) + 1; }); return Object.keys(n).map(t => t + (n[t] > 1 ? " \u00d7" + n[t] : "")); };
  const theirs = counted(ships.filter(x => x.pj == null)), ours = counted(ships.filter(x => x.pj != null));
  appState.V.boardNote = { ours: ours, theirs: theirs };
  Object.keys(byUnit).forEach(j => act("boardres", +j, byUnit[j]));
  save(); render();
});

/* -------------------------------------------------- who, before opening --- */
export function boardAct(name, el){
  const V = appState.V, argOf = () => parseInt(el.getAttribute("data-arg"), 10);
  if(name === "board"){
    const i = parseInt(el.getAttribute("data-i"), 10);
    const others = appState.U.some((x, j) => j !== i && alive(j));
    V.actions = null;
    /* nothing to choose: straight to the action */
    if(!others && !peerHas()){ render(); go([i], -1); return true; }
    V.board = { i: i, join: [] }; render(); return true;
  }
  if(name === "boardclose"){ V.board = null; render(); return true; }
  if(name === "boardwhere"){ lsSet(KEY_BOARD_WHERE, el.getAttribute("data-arg")); render(); return true; }
  if(name === "boardjoin"){
    const j = argOf(), at = V.board.join.indexOf(j);
    if(at < 0) V.board.join.push(j); else V.board.join.splice(at, 1);
    render(); return true;
  }
  if(name === "boardgo"){
    const mine = [V.board.i].concat(V.board.join);
    V.board = null; render(); go(mine, argOf()); return true;
  }
  if(name === "boardnote"){ V.boardNote = null; render(); return true; }
  return false;
}
const go = openFrame;

export function renderBoardSheet(){
  const b = appState.V.board;
  const chips = appState.U.map((x, j) => j !== b.i && alive(j)
    ? `<button class="bchip${b.join.indexOf(j) >= 0 ? " on" : ""}" data-act="boardjoin" data-arg="${j}">${esc(unitName(j))}</button>` : "").join("");
  const foes = peerHas() ? withPeer(() => appState.U.map((x, j) => alive(j)
    ? `<button class="btn sec" data-act="boardgo" data-arg="${j}">${esc(unitName(j))}<small>${PLAY.remaining(x.R, appState.G.st[j])} hits left</small></button>` : "").join("")) : "";
  return `<div class="menu" data-act="boardclose"><div class="box">
    <div class="mhd"><h2>Board with ${esc(unitName(b.i))}</h2><button class="x" data-act="boardclose" aria-label="Close">&#10005;</button></div>
    ${chips ? `<p class="foot">Boarding together? Their values add up and one die is rolled (Rulebook p. 90).</p><div class="bchips">${chips}</div>` : ""}
    ${foes ? `<p class="foot">Which enemy ship?</p>${foes}` : ""}
    <button class="btn${foes ? " sec" : ""}" data-act="boardgo" data-arg="-1">${foes ? "Another ship" : "Choose the enemy"}<small>from every fleet in the book</small></button>
    <p class="foot">Opens in</p><div class="bchips">${[["tab", "A new tab"], ["here", "This page"]].map(w => `<button class="bchip${boardWhere() === w[0] ? " on" : ""}" data-act="boardwhere" data-arg="${w[0]}">${w[1]}</button>`).join("")}</div>
  </div></div>`;
}
/* What the last action did, until it is tapped away: the enemy's part is for
   the other player to mark. */
export function boardNoteLine(){
  const n = appState.V.boardNote;
  if(!n || !(n.ours.length || n.theirs.length)) return "";
  const line = (w, a) => a.length ? `<b>${w}</b> ${esc(a.join(` ${MID} `))}` : "";
  return `<button class="boardnote" data-act="boardnote">${[line("Marked:", n.ours), line("Tell them:", n.theirs)].filter(Boolean).join("<br>")}</button>`;
}
