import { appState } from "./state.js";
import { OPT, TRACK, lsDel, lsGet, lsSet } from "./storage.js";
import { MID } from "./helpers.js";
import { fleetPoints, resolveFleet } from "./fleet-document.js";
import { swapFleetRes } from "./game-state.js";
import { CLOSE_X, render, rosterRows, vpTotal } from "./render.js";
import { toast } from "./actions.js";
import { copyText, shareText } from "./share.js";
import { esc, factionCols } from "../../../packages/ui/format.js";
import { qrFull, qrSvg } from "../../../packages/ui/qr.js";
import { PHONE_LINK } from "../../../packages/ui/share-link.js";
import PLAY from "../rules.js";

/* ===================================================== OPPONENT'S FLEET ===== */
/* Two players link their pages (user 31.10.2026: "two players can join their
   sessions before the game or during it ... the main purpose is that I see
   the other's ships and their state live"). Optional: nothing changes for a
   player who never links.

   A room with a four-letter code (user 31.10.2026, after the first version -
   two QR codes and a direct WebRTC link - never connected once on two phones
   and a PC: "linking should happen at a set step, and more clearly"). One
   player taps Create a room and gets a code; the other taps Join and types
   it, or scans its QR code. The pages talk through bfgtools' own relay
   (services/relay: a Cloudflare Worker that passes messages between the
   pages of a room and stores nothing), so it works on any network. The room
   is remembered: a reload or a phone that slept goes back in by itself.

   What travels: this page's game record (appState.G, which carries the
   fleet document) and its tracking switches, whenever they change. The
   other page draws it with the same rows, read-only. The last copy is kept
   (KEY_PEER), so a reload still shows it, marked as not live. */
export const KEY_PEER = "gothic-fleet-play-peer";
export const KEY_PEER_NAME = "gothic-fleet-play-name";
export const KEY_PEER_HINT = "gothic-fleet-play-swipe-hint";
export const KEY_ROOM = "gothic-fleet-play-room";
/* a relay of one's own for testing: localStorage[KEY_RELAY] = "ws://..." */
export const KEY_RELAY = "gothic-fleet-play-relay";
export const RELAY = "wss://play-relay.kuldare.com";
/* no I or O: they read as 1 and 0 */
const LETTERS = "ABCDEFGHJKLMNPQRSTUVWXYZ";
const PROTO = 2;

/* P.st: "off" (in no room) | "joining" (reaching the relay) | "wait" (in the
   room, the other player is not) | "live" | "retry" (the line dropped; the
   page tries again by itself) */
appState.P = { st: "off", err: "", room: "", who: "", name: "", G: null, opt: null, at: 0, fp: "", U: [], L0: null, rerr: "", n: 0 };
/* appState.V.side ("me" | "peer"), V.peerPanel and V.sideTop are set as they are used:
   this module is read before game-state.js makes V. */
let WS = null, LAST_SENT = "", PUSH_T = 0, RETRY_T = 0, RETRY_N = 0, PING_T = 0, HINTED = false, MSG_N = 0;

const wsCan = () => typeof WebSocket === "function";
export const myName = () => String(lsGet(KEY_PEER_NAME) || "").slice(0, 24);
const peerHas = () => !!appState.P.G;
const live = () => appState.P.st === "live";
const inRoom = () => !!appState.P.room;
/* the opponent as the page names them: their name, else their fleet list */
export function peerLabel(){
  const P = appState.P;
  return P.name || (P.G && P.G.ln) || P.who || "Opponent";
}
/* The opponent's side is shown when there is something to show. */
export function peerSide(){ return appState.V.side === "peer" && peerHas(); }

/* ---------------------------------------------------------- the room --- */
export function relayUrl(){
  const own = lsGet(KEY_RELAY);
  if(own && /^wss?:\/\/[A-Za-z0-9.:\-]+$/.test(own)) return own;
  const loc = typeof location !== "undefined" ? location : null;
  return loc && /^(localhost|127\.0\.0\.1)$/.test(loc.hostname) ? "ws://" + loc.hostname + ":8787" : RELAY;
}
export function newRoomCode(){
  const a = new Uint8Array(4);
  try{ crypto.getRandomValues(a); }catch(e){ for(let k = 0; k < 4; k++) a[k] = Math.floor(Math.random() * 256); }
  return [...a].map(b => LETTERS[b % LETTERS.length]).join("");
}
/* A code as typed, or a link with one (#room=KRAK); O and I are read as 0
   and 1 would be: as the letters the code cannot have, so they fail. */
export function parseRoom(text){
  const t = String(text || "").trim();
  const m = /[#&?]room=([A-Za-z]{4})(?![A-Za-z])/.exec(t) || /^([A-Za-z]{4})$/.exec(t.replace(/[\s-]/g, ""));
  if(!m) return null;
  const c = m[1].toUpperCase();
  return [...c].every(ch => LETTERS.indexOf(ch) >= 0) ? c : null;
}
/* Where the other phone opens the room's QR code: this page on the web, the
   published one from a disk or localhost (a phone reaches neither). */
export function peerBase(){
  const loc = typeof location !== "undefined" ? location : null;
  const local = !loc || loc.protocol !== "https:" || /^(localhost|127\.0\.0\.1|\[::1\])$/.test(loc.hostname);
  return local ? PHONE_LINK.play : loc.origin + loc.pathname;
}
export const roomLink = code => peerBase() + "#room=" + code;

function send(msg){
  if(!WS || WS.readyState !== 1) return false;
  try{ WS.send(typeof msg === "string" ? msg : JSON.stringify(msg)); return true; }catch(e){ return false; }
}
function hangUp(){
  clearTimeout(RETRY_T); clearInterval(PING_T);
  if(WS){ const w = WS; WS = null; w.onclose = null; w.onmessage = null; w.onerror = null; try{ w.close(1000); }catch(e){} }
}
function connect(){
  hangUp();
  const P = appState.P;
  if(!P.room) return;
  if(!wsCan()){ P.err = "This browser cannot link (no WebSocket)."; P.st = "off"; refresh(); return; }
  if(P.st !== "retry") P.st = "joining";
  let ws;
  try{ ws = new WebSocket(relayUrl() + "/room/" + P.room); }catch(e){ retry(); return; }
  WS = ws;
  ws.onopen = () => {
    if(ws !== WS) return;
    RETRY_N = 0; P.err = "";
    if(P.st !== "live") P.st = "wait";
    send({ t: "hi", v: PROTO, n: myName() });
    clearInterval(PING_T); PING_T = setInterval(() => send("ping"), 25000);
    refresh();
  };
  ws.onmessage = e => { if(ws === WS) take(e.data); };
  ws.onclose = () => { if(ws === WS){ WS = null; retry(); } };
  ws.onerror = () => {};
}
/* The line dropped: back in by itself, sooner at first, and at once when the
   page is looked at again or the network comes back. */
function retry(){
  const P = appState.P;
  clearInterval(PING_T);
  if(!P.room) return;
  P.st = "retry"; P.n = 0;
  refresh();
  clearTimeout(RETRY_T);
  RETRY_T = setTimeout(connect, Math.min(15000, 1000 * Math.pow(2, RETRY_N++)));
}
export function openRoom(code){
  const P = appState.P;
  if(P.room && P.room !== code) leaveRoom(false, true);
  P.room = code; P.err = ""; P.st = "joining"; P.n = 0; RETRY_N = 0;
  lsSet(KEY_ROOM, code);
  connect();
  render();
}
export function leaveRoom(forget, quiet){
  send({ t: "bye" });
  hangUp();
  const P = appState.P;
  P.room = ""; P.st = "off"; P.n = 0; P.err = "";
  lsDel(KEY_ROOM);
  if(forget){ lsDel(KEY_PEER); Object.assign(P, { G: null, opt: null, at: 0, fp: "", U: [], L0: null, rerr: "", name: "", who: "" }); appState.V.side = "me"; }
  if(!quiet) render();
}

/* This page's state goes to the other one whenever it changes (render()
   calls this after every draw; unchanged state is not sent again). */
export function push(now){
  if(!WS || WS.readyState !== 1 || !live()) return;
  clearTimeout(PUSH_T);
  const go = () => {
    const opt = {}; TRACK.forEach(t => { opt[t[0]] = !!OPT[t[0]]; });
    const body = JSON.stringify({ t: "g", n: myName(), G: appState.G || null, opt: opt, scr: appState.V.screen });
    if(body === LAST_SENT || body.length > 60000) return;
    if(send(body)) LAST_SENT = body;
  };
  if(now) go(); else PUSH_T = setTimeout(go, 120);
}

/* Their record, kept clean: no markup can ride in a name. The page escapes
   what it prints; this is a second wall for data from another device. */
/* (The fleet document keeps its quotes: the builder's labels are matched
   by name, and some carry them.) */
function scrub(v, d, q){
  if(d > 12) return null;
  if(typeof v === "string") return v.replace(q ? /[<>`]/g : /[<>"`]/g, "").slice(0, 400);
  if(Array.isArray(v)) return v.slice(0, 400).map(x => scrub(x, d + 1, q));
  if(v && typeof v === "object"){ const o = {}; Object.keys(v).slice(0, 200).forEach(k => { o[k] = scrub(v[k], d + 1, q || k === "doc"); }); return o; }
  return typeof v === "number" || typeof v === "boolean" || v == null ? v : null;
}
export function takeSnapshot(m){
  const P = appState.P;
  const G = m.G && typeof m.G === "object" && m.G.doc && Array.isArray(m.G.st) ? scrub(m.G, 0) : null;
  P.name = typeof m.n === "string" ? scrub(m.n, 0).slice(0, 24) : P.name;
  P.opt = m.opt && typeof m.opt === "object" ? scrub(m.opt, 0) : {};
  P.scr = m.scr === "setup" || m.scr === "roster" ? m.scr : "load";
  P.at = m.at || Date.now();
  P.G = G;
  if(G && G.fp !== P.fp){
    const res = resolveFleet(G.doc);
    P.rerr = res.error ? res.error : res.units.length !== G.st.length ? "Their roster does not resolve here as it does on their phone (" + res.units.length + " of " + G.st.length + " units): the two pages may be different versions." : "";
    P.U = P.rerr ? [] : res.units; P.L0 = P.rerr ? null : res.L0; P.fp = G.fp; P.FR = null;
  }
  if(!G){ P.U = []; P.L0 = null; P.fp = ""; }
}
function take(raw){
  if(raw === "pong") return;
  let m = null; try{ m = JSON.parse(raw); }catch(e){ return; }
  if(!m || typeof m !== "object") return;
  const P = appState.P;
  /* who is in the room (the relay's own word) */
  if(m.t === "peers"){
    P.n = m.n | 0;
    const was = P.st;
    P.st = P.n >= 2 ? "live" : "wait";
    if(P.st === "live" && was !== "live"){
      LAST_SENT = ""; push(true);
      appState.V.peerPanel = false;
      toast("Linked" + (P.who || P.name ? " with " + (P.who || P.name) : "") + ": swipe the roster sideways, or tap their tab, to see their fleet.");
      render(); hint(true);
    }else refresh();
    return;
  }
  /* someone (re)joined: they get this page's state again */
  if(m.t === "hi"){ P.who = typeof m.n === "string" ? scrub(m.n, 0).slice(0, 24) : ""; LAST_SENT = ""; push(true); return; }
  if(m.t === "bye"){ toast(peerLabel() + " left the room."); return; }
  if(m.t !== "g") return;
  const had = peerHas();
  takeSnapshot(m);
  MSG_N++;
  lsSet(KEY_PEER, JSON.stringify({ n: P.name, G: P.G, opt: P.opt, scr: P.scr, at: P.at }));
  if(peerSide() || !had || appState.V.peerPanel) render(); else freshStrip();
}
/* A change on the other phone while this one shows its own fleet: only the
   tab redraws and blinks - a full draw would close what the player has open. */
function freshStrip(){
  if(typeof document === "undefined" || !document.querySelector) return;
  const el = document.querySelector(".sides");
  if(el) el.outerHTML = sidesStrip(true);
  const c = document.querySelector(".peercard");
  if(c) c.outerHTML = peerSetupCard();
}
function refresh(){ if(appState.V.peerPanel || peerSide() || appState.V.screen === "load") render(); else freshStrip(); }

/* An address with a room in it (the camera opened the room's QR code, or a
   second one in the same tab: hashchange). Returns whether there was one. */
export function takePeerFromAddress(){
  const loc = typeof location !== "undefined" ? location : null;
  const code = loc && /^#room=/.test(loc.hash || "") ? parseRoom(loc.hash) : null;
  if(!code) return false;
  try{ history.replaceState(null, "", loc.pathname + loc.search); }catch(e){}
  appState.V.peerPanel = true;
  openRoom(code);
  return true;
}
export function peerBoot(){
  /* the last copy of their fleet: shown, marked as not live */
  try{
    const s = JSON.parse(lsGet(KEY_PEER) || "null");
    if(s && s.G) takeSnapshot(s);
  }catch(e){}
  if(typeof document !== "undefined" && document.addEventListener){
    document.addEventListener("visibilitychange", () => { if(document.visibilityState === "visible" && appState.P.room && !WS) connect(); });
    if(typeof window !== "undefined" && window.addEventListener) window.addEventListener("online", () => { if(appState.P.room && !WS) connect(); });
  }
  if(takePeerFromAddress()) return;
  /* back into the room this page was in (a reload, a phone that slept) */
  const r = parseRoom(lsGet(KEY_ROOM) || "");
  if(r){ appState.P.room = r; appState.P.st = "joining"; connect(); }
}

/* ------------------------------------------------------ their roster --- */
/* Their fleet drawn by the page's own rows: their game, units and tracking
   switches are swapped in for the draw and put back. No popover, no card. */
export function withPeer(fn){
  const P = appState.P;
  const keep = { G: appState.G, U: appState.U, L0: appState.L0, pop: appState.V.pop, sheet: appState.V.sheet };
  const opt0 = {}; TRACK.forEach(t => { opt0[t[0]] = OPT[t[0]]; OPT[t[0]] = !!(P.opt && P.opt[t[0]]); });
  const fr0 = swapFleetRes(P.FR || null);
  appState.G = P.G; appState.U = P.U; appState.L0 = P.L0; appState.V.pop = null; appState.V.sheet = null;
  try{ return fn(); }
  finally{
    P.FR = swapFleetRes(fr0);
    appState.G = keep.G; appState.U = keep.U; appState.L0 = keep.L0; appState.V.pop = keep.pop; appState.V.sheet = keep.sheet;
    TRACK.forEach(t => { OPT[t[0]] = opt0[t[0]]; });
  }
}
const clock = t => { const d = new Date(t); return ("0" + d.getHours()).slice(-2) + ":" + ("0" + d.getMinutes()).slice(-2); };
function statusWord(){
  const P = appState.P;
  return P.st === "live" ? "live" : P.at ? "not live " + MID + " last seen " + clock(P.at) : "not linked";
}
export function renderPeerSide(){
  const P = appState.P, G = P.G;
  let body = "", top = "", vp = 0, toPlay = 0, ships = 0;
  try{
    if(P.rerr) body = `<p class="note bad">${esc(P.rerr)}</p>`;
    else body = withPeer(() => {
      vp = vpTotal();
      appState.U.forEach((x, i) => { if(x.R.kind === "ship"){ ships++; if(!PLAY.destroyed(x.R, appState.G.st[i]) && appState.G.st[i].played < 2) toPlay++; } });
      return rosterRows().join("");
    });
  }catch(e){ body = `<p class="note bad">Their fleet could not be drawn here (${esc(String(e && e.message || e))}). The two pages may be different versions.</p>`; }
  const fl = G.fleet || {};
  const [kd] = factionCols(G.ln, "");
  const when = P.scr === "setup" ? "setting up" : P.scr === "load" ? "on the fleet list" : "turn " + (fl.turn | 0) + (P.opt && P.opt.orders && fl.mine === false ? " " + MID + " their enemy turn" : "");
  top = `<div class="top one peer-top" style="--kd:${kd}">
      <h1><span class="pdot ${live() ? "on" : ""}"></span>${esc(peerLabel())}<small>${esc(G.ln || "")} ${MID} ${esc(when)}</small></h1>
      <div class="tools">
        <button class="tool" data-act="side" data-arg="me" title="Back to my fleet"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg><span>My fleet</span></button>
        <button class="tool" data-act="peerpanel" title="Link, status, disconnect"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/></svg><span>Link</span></button>
      </div></div>`;
  const pts = P.U.length ? fleetPoints(P.U) : 0;
  return top + sidesStrip() +
    (!live() ? `<p class="note stale">Not live: their fleet as it was at ${clock(P.at)}. <button class="mini" data-act="peerpanel">${inRoom() ? "Room " + esc(P.room) : "Link"}</button></p>` : "") +
    `<div class="main peerview${appState.V.compact ? " compact" : ""}">${body}</div>${edgeHandle()}
    <div class="bottom"><div class="brow peerbar">
      <div class="psum"><b>${esc(peerLabel())}</b>${ships} ship${ships === 1 ? "" : "s"} ${MID} ${pts} pts ${MID} ${toPlay} to play<small>read-only ${MID} ${esc(statusWord())}</small></div>
      <div class="vp">they concede<b>VP ${vp}</b></div>
    </div></div>`;
}

/* --------------------------------------------- the two sides and swipe --- */
/* The tabs under the top bar once there is an opponent: my fleet, theirs.
   The bar under them slides with the finger (the swipe's own cue). */
export function sidesStrip(fresh){
  if(!peerHas()) return "";
  const peer = peerSide(), P = appState.P;
  const shy = hintCount() < 3;
  return `<div class="sides${peer ? " at-peer" : ""}${fresh ? " fresh" : ""}" role="tablist">
    <button class="${peer ? "" : "on"}" role="tab" aria-selected="${!peer}" data-act="side" data-arg="me">My fleet${shy && peer ? `<small class="swipe-cue" aria-hidden="true">&rsaquo;&rsaquo; swipe</small>` : ""}</button>
    <button class="${peer ? "on" : ""}" role="tab" aria-selected="${peer}" data-act="side" data-arg="peer"><span class="pdot ${live() ? "on" : ""}"></span>${esc(peerLabel())}${shy && !peer ? `<small class="swipe-cue" aria-hidden="true">swipe &lsaquo;&lsaquo;</small>` : P.G && P.G.ln && P.name ? `<small>${esc(P.G.ln)}</small>` : ""}</button>
    <i class="ind" aria-hidden="true"></i>
  </div>`;
}
/* A tab at the screen's edge: the other side peeks in, and a tap turns to it. */
export function edgeHandle(){
  if(!peerHas()) return "";
  const peer = peerSide();
  return `<button class="edge ${peer ? "l" : "r"}${hintCount() < 3 ? " cue" : ""}" data-act="side" data-arg="${peer ? "me" : "peer"}" aria-label="${peer ? "My fleet" : "Opponent's fleet"}">
    <b>${peer ? "&lsaquo;" : "&rsaquo;"}</b><span>${peer ? "MY FLEET" : esc(peerLabel().toUpperCase())}</span></button>`;
}
function hintCount(){ return parseInt(lsGet(KEY_PEER_HINT), 10) || 0; }
/* The first times the opponent's side appears, the roster nudges toward it
   by itself: the cards slide a little and come back. */
function hint(force){
  if(HINTED && !force) return;
  if(typeof document === "undefined" || !document.querySelector || peerSide() || !peerHas()) return;
  const n = hintCount();
  if(n >= 3) return;
  const m = document.querySelector(".main");
  if(!m || !m.classList) return;
  HINTED = true;
  lsSet(KEY_PEER_HINT, String(n + 1));
  m.classList.remove("peek"); void m.offsetWidth; m.classList.add("peek");
  const e = document.querySelector(".edge"); if(e) e.classList.add("pulse");
}
const swipeScreen = () => peerHas() && (peerSide() || appState.V.screen === "roster" || appState.V.screen === "setup") && appState.V.sheet == null && !appState.V.menu && !appState.V.peerPanel && !appState.V.endph;
export function turnTo(side, how){
  if(side === "peer" && !peerHas()) return;
  if((appState.V.side === "peer" ? "peer" : "me") === side) return;
  const se = typeof document !== "undefined" ? document.scrollingElement : null;
  const tops = appState.V.sideTop = appState.V.sideTop || {};
  tops[appState.V.side === "peer" ? "peer" : "me"] = se ? se.scrollTop : 0;
  appState.V.side = side;
  appState.V.pop = null;
  if(how === "swipe" && hintCount() < 3) lsSet(KEY_PEER_HINT, "3");   /* learned it */
  render();
  if(se) se.scrollTop = tops[side] || 0;
  const m = document.querySelector(".main");
  if(m && m.classList){ m.classList.add(side === "peer" ? "in-r" : "in-l"); setTimeout(() => m.classList.remove("in-r", "in-l"), 320); }
}
/* The swipe: the cards follow the finger sideways; far enough and the other
   side comes in, else they spring back. Only a mostly sideways move counts,
   so scrolling the roster is never taken for one. */
let SW = null;
if(typeof document !== "undefined" && document.addEventListener){
  document.addEventListener("touchstart", ev => {
    SW = null;
    if(!swipeScreen() || !ev.touches || ev.touches.length !== 1) return;
    const t = ev.target;
    if(t && t.closest && t.closest("input,textarea,select,.pop,.jump,.seg,.hits,.sides")) return;
    const m = document.querySelector(".main");
    if(!m) return;
    SW = { x: ev.touches[0].clientX, y: ev.touches[0].clientY, dx: 0, lock: null, m: m, e: document.querySelector(".edge") };
  }, { passive: true });
  document.addEventListener("touchmove", ev => {
    if(!SW || !ev.touches || !ev.touches[0]) return;
    const dx = ev.touches[0].clientX - SW.x, dy = ev.touches[0].clientY - SW.y;
    if(!SW.lock && (Math.abs(dx) > 12 || Math.abs(dy) > 12)) SW.lock = Math.abs(dx) > Math.abs(dy) * 1.3 ? "x" : "y";
    if(SW.lock !== "x") return;
    const peer = peerSide(), ok = peer ? dx > 0 : dx < 0;
    SW.dx = dx;
    const shown = ok ? dx : dx / 6;
    SW.m.style.transition = "none";
    SW.m.style.transform = "translateX(" + shown.toFixed(1) + "px)";
    SW.m.style.opacity = String(Math.max(.45, 1 - Math.abs(shown) / 600));
    if(SW.e){ SW.e.style.transition = "none"; SW.e.style.transform = ok ? "translateX(" + (peer ? 1 : -1) * Math.min(40, Math.abs(dx) / 3) + "px)" : ""; }
  }, { passive: true });
  const end = () => {
    if(!SW) return;
    const s = SW; SW = null;
    if(s.lock !== "x") return;
    const peer = peerSide(), ok = peer ? s.dx > 0 : s.dx < 0;
    const far = Math.abs(s.dx) > Math.min(90, window.innerWidth * .22);
    s.m.style.transition = ""; s.m.style.transform = ""; s.m.style.opacity = "";
    if(s.e){ s.e.style.transition = ""; s.e.style.transform = ""; }
    if(ok && far){ appState.V.guardUntil = Date.now() + 250; turnTo(peer ? "me" : "peer", "swipe"); }
  };
  document.addEventListener("touchend", end, { passive: true });
  document.addEventListener("touchcancel", end, { passive: true });
  /* a laptop: the arrow keys turn the sides */
  document.addEventListener("keydown", ev => {
    if(!swipeScreen() || ev.target && /^(INPUT|TEXTAREA|SELECT)$/.test(ev.target.tagName || "")) return;
    if(ev.key === "ArrowRight" && !peerSide()) turnTo("peer");
    if(ev.key === "ArrowLeft" && peerSide()) turnTo("me");
  });
  document.addEventListener("input", ev => {
    const t = ev.target;
    if(t && t.id === "peername") lsSet(KEY_PEER_NAME, String(t.value || "").replace(/[<>"`]/g, "").slice(0, 24));
    if(t && t.id === "peerjoin"){ const v = String(t.value || "").toUpperCase().replace(/[^A-Z]/g, "").slice(0, 4); if(t.value !== v) t.value = v; appState.V.peerJoin = v; }
  });
  document.addEventListener("keydown", ev => {
    if(ev.key === "Enter" && ev.target && ev.target.id === "peerjoin"){ ev.preventDefault(); joinTyped(); }
  });
}
export function peerAfterRender(){
  push(false);
  if(!HINTED && live()) hint(false);
}

/* --------------------------------------------------------- the panel --- */
export function peerMenuWord(){
  const P = appState.P;
  return live() ? "room " + P.room + " " + MID + " linked with " + peerLabel()
    : inRoom() ? "room " + P.room + " " + MID + " " + statusWord()
    : peerHas() ? peerLabel() + " " + MID + " " + statusWord() : "create a room or join one: see the other's ships live";
}
export function peerTool(){
  return `<button class="tool${live() ? " on" : ""}" data-act="peerpanel" title="Link with the opponent's phone"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/></svg><span>Opponent</span></button>`;
}
/* The two ways in, side by side: make a room, or type the other's code. */
function joinRow(){
  return `<div class="roomjoin">
      <button class="btn" data-act="peercreate" ${wsCan() ? "" : "disabled"}>Create a room<small>you get a code</small></button>
      <div class="jn"><input id="peerjoin" type="text" inputmode="text" maxlength="4" autocapitalize="characters" autocomplete="off" spellcheck="false" enterkeyhint="go" placeholder="CODE" value="${esc(appState.V.peerJoin || "")}" aria-label="The other player's room code">
        <button class="btn sec" data-act="peerjoin" ${wsCan() ? "" : "disabled"}>Join</button></div>
    </div>`;
}
function roomState(){
  const P = appState.P;
  const word = live() ? `<span class="pdot on"></span>Linked with <b>${esc(peerLabel())}</b>`
    : P.st === "wait" ? `<span class="pdot wait"></span>Waiting for the other player&hellip;`
    : P.st === "retry" ? `<span class="pdot"></span>Connection lost, trying again&hellip;`
    : `<span class="pdot"></span>Connecting&hellip;`;
  return `<p class="pstat">${word}</p>`;
}
/* The set-up screen's step (user 31.10.2026: linking at a set step):
   before the Leadership, the opponent's phone, optional. */
export function peerSetupCard(){
  const P = appState.P;
  if(!inRoom()) return `<div class="card peercard"><h2>Opponent <em>optional</em></h2>
    <p>See the other player's ships live beside yours. One of you creates a room, the other joins with its code.</p>
    ${joinRow()}</div>`;
  return `<div class="card peercard in"><h2>Opponent <em>room ${esc(P.room)}</em></h2>
    ${roomState()}
    ${live() ? "" : `<p class="foot">The other player taps <b>Join</b> and types <b class="code">${esc(P.room)}</b>, or scans the code under <button class="linkbtn" data-act="peerpanel">Room</button>.</p>`}
    ${live() && peerHas() ? `<button class="btn sec" data-act="side" data-arg="peer">See their fleet</button>` : ""}</div>`;
}
export function peerLoadCard(){
  return peerSetupCard();
}
export function renderPeerPanel(){
  const P = appState.P;
  const canShare = typeof navigator !== "undefined" && !!navigator.share;
  let body = "";
  if(inRoom()){
    let svg = ""; try{ svg = qrSvg(roomLink(P.room)); }catch(e){}
    body = `${roomState()}
      <div class="roomcode" aria-label="Room code"><span>Room</span><b>${esc(P.room)}</b></div>
      ${live() ? `<p class="foot">Their ships and their damage come as they tap. Swipe the roster sideways or tap their tab to see them; yours go to them the same way. If the line drops, both phones go back into the room by themselves.</p>
        ${peerHas() ? `<button class="btn" data-act="side" data-arg="peer">See their fleet</button>` : `<p class="foot">They have no game open yet.</p>`}`
      : `<p class="lead">On the other phone: open Play, tap <b>Join</b> and type <b>${esc(P.room)}</b>. Or scan this with its camera:</p>
        ${svg ? `<div class="phone peercode"><div class="qr" data-act="peerqr" title="Full screen">${svg}</div>
        <div class="r4"><button data-act="peerqr">Full screen</button><button data-act="peercopy">${appState.V.copied === "peer" ? "Copied" : "Copy link"}</button>${canShare ? `<button data-act="peershare">Share</button>` : ""}</div></div>` : ""}`}
      <button class="btn sec" data-act="peerleave">Leave the room<small>${peerHas() ? "their last copy stays, marked not live" : "the code stops working for this phone"}</small></button>`;
  }else{
    body = `${peerHas() ? `<p class="pstat"><span class="pdot"></span>${esc(peerLabel())} ${MID} ${esc(statusWord())}</p>` : ""}
      <p>See the other player's ships and their damage live, beside your own, before the game or in the middle of it. Nothing changes in either game.</p>
      <ol class="steps"><li>One of you taps <b>Create a room</b> and gets a four-letter code.</li><li>The other types the code and taps <b>Join</b>.</li></ol>
      <label class="nmrow">Your name for them<input id="peername" type="text" maxlength="24" value="${esc(myName())}" placeholder="${esc(appState.G ? appState.G.ln : "e.g. Joona")}" autocomplete="off" spellcheck="false" enterkeyhint="done"></label>
      ${joinRow()}
      ${peerHas() ? `<button class="btn sec" data-act="side" data-arg="peer">See their last copy</button><button class="btn warn" data-act="peerforget">Forget their fleet</button>` : ""}`;
  }
  return `<div class="menu" data-act="peerpanel"><div class="box">
    <div class="mhd"><h2>Opponent's fleet</h2><button class="x" data-act="peerpanel" aria-label="Close">${CLOSE_X}</button></div>
    ${P.err ? `<p class="note bad">${esc(P.err)}</p>` : ""}${body}
    <p class="foot">The two pages talk through bfgtools' own relay, which passes the messages on and stores nothing.</p>
  </div></div>`;
}
function joinTyped(){
  const el = typeof document !== "undefined" && document.getElementById ? document.getElementById("peerjoin") : null;
  const code = parseRoom((el && el.value) || appState.V.peerJoin || "");
  if(!code){ appState.P.err = "A room code is four letters, for example KRAK."; appState.V.peerPanel = true; render(); return; }
  appState.V.peerJoin = "";
  openRoom(code);
}
/* The panel's and the sides' taps (events.js asks first). */
export function peerAct(name, el){
  const arg = el && el.getAttribute ? el.getAttribute("data-arg") : null;
  if(name === "side"){
    appState.V.peerPanel = false; appState.V.menu = false;
    const to = arg === "peer" ? "peer" : "me";
    if((to === "peer" && !peerHas()) || (appState.V.side === "peer" ? "peer" : "me") === to) render(); else turnTo(to, "tap");
    return true;
  }
  if(name === "peerpanel"){ appState.V.peerPanel = !appState.V.peerPanel; appState.V.menu = false; if(!appState.V.peerPanel) appState.P.err = ""; render(); return true; }
  if(name === "peercreate"){ appState.V.peerPanel = true; openRoom(newRoomCode()); return true; }
  if(name === "peerjoin"){ joinTyped(); return true; }
  if(name === "peerqr"){ if(inRoom()){ try{ qrFull(qrSvg(roomLink(appState.P.room))); }catch(e){} } return true; }
  if(name === "peercopy"){ copyText(roomLink(appState.P.room), "peer"); return true; }
  if(name === "peershare"){ shareText("Gothic Fleet Play: room " + appState.P.room, roomLink(appState.P.room)); return true; }
  if(name === "peerleave"){ leaveRoom(false); return true; }
  if(name === "peerforget"){ if(confirm("Forget the opponent's fleet on this device?")) leaveRoom(true); return true; }
  return false;
}
export function peerMessages(){ return MSG_N; }
