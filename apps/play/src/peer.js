import { appState } from "./state.js";
import { OPT, TRACK, lsDel, lsGet, lsSet } from "./storage.js";
import { MID } from "./helpers.js";
import { fleetPoints, resolveFleet } from "./fleet-document.js";
import { swapFleetRes } from "./game-state.js";
import { render, rosterRows, vpTotal } from "./render.js";
import { toast } from "./actions.js";
import { copyText, shareText } from "./share.js";
import { esc, factionCols } from "../../../packages/ui/format.js";
import { qrFull, qrSvg } from "../../../packages/ui/qr.js";
import { PHONE_LINK, b64url, unb64url } from "../../../packages/ui/share-link.js";
import PLAY from "../rules.js";

/* ===================================================== OPPONENT'S FLEET ===== */
/* Two players link their pages (user 31.10.2026: "two players can join their
   sessions before the game or during it ... the main purpose is that I see
   the other's ships and their state live"). Optional: nothing changes for a
   player who never links.

   No server. The site is static (docs/adr/0006), so the two phones talk to
   each other directly over WebRTC, and the handshake goes by QR code: the
   first phone shows a code (its offer, deflated into a link), the second
   scans it with its camera and shows a reply code, the first scans that.
   The reply reaches the waiting page three ways: the same tab (the address
   changes, hashchange), another tab of the same browser (BroadcastChannel),
   or pasted. Only the STUN server below learns the phones' addresses, so
   two phones on different networks can find each other; on the same Wi-Fi
   they connect without it.

   What travels: this page's game record (appState.G, which carries the
   fleet document) and its tracking switches, whenever they change. The
   other page draws it with the same rows, read-only. The last copy is kept
   (KEY_PEER), so a reload still shows it, marked as not live. */
export const KEY_PEER = "gothic-fleet-play-peer";
export const KEY_PEER_NAME = "gothic-fleet-play-name";
export const KEY_PEER_HINT = "gothic-fleet-play-swipe-hint";
const ICE = [{ urls: "stun:stun.l.google.com:19302" }];
const GATHER_MS = 2500;
const PROTO = 1;

/* P.st: "off" | "offer" (making / showing my code) | "answer" (making /
   showing my reply) | "live" | "weak" (connection hiccup) | "lost" */
appState.P = { st: "off", err: "", url: "", svg: "", id: "", who: "", name: "", G: null, opt: null, at: 0, fp: "", U: [], L0: null, rerr: "", handoff: false };
/* appState.V.side ("me" | "peer"), V.peerPanel and V.sideTop are set as they are used:
   this module is read before game-state.js makes V. */
let PC = null, DC = null, LAST_SENT = "", PUSH_T = 0, BC = null, WEAK_T = 0, HINTED = false, MSG_N = 0;

const rtcCan = () => typeof RTCPeerConnection === "function";
export const myName = () => String(lsGet(KEY_PEER_NAME) || "").slice(0, 24);
const peerHas = () => !!appState.P.G;
const live = () => appState.P.st === "live" || appState.P.st === "weak";
/* the opponent as the page names them: their name, else their fleet list */
export function peerLabel(){
  const P = appState.P;
  return P.name || (P.G && P.G.ln) || P.who || "Opponent";
}
/* The opponent's side is shown when there is something to show. */
export function peerSide(){ return appState.V.side === "peer" && peerHas(); }

/* ------------------------------------------------------- the link codes --- */
async function deflate(obj){
  const bytes = new TextEncoder().encode(JSON.stringify(obj));
  if(typeof CompressionStream !== "function") return "j" + b64url(bytes);
  const st = new Blob([bytes]).stream().pipeThrough(new CompressionStream("deflate-raw"));
  return "z" + b64url(new Uint8Array(await new Response(st).arrayBuffer()));
}
async function inflate(t){
  let bytes = unb64url(t.slice(1));
  if(t[0] === "z"){
    if(typeof DecompressionStream !== "function") throw new Error("this browser cannot read the code - update it");
    const st = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
    bytes = new Uint8Array(await new Response(st).arrayBuffer());
  }
  return JSON.parse(new TextDecoder().decode(bytes));
}
/* Where the other phone opens the code: this page when it is on the web, the
   published one when it runs from a disk or localhost (a phone reaches
   neither). */
export function peerBase(){
  const loc = typeof location !== "undefined" ? location : null;
  const local = !loc || loc.protocol !== "https:" || /^(localhost|127\.0\.0\.1|\[::1\])$/.test(loc.hostname);
  return local ? PHONE_LINK.play : loc.origin + loc.pathname;
}
/* "#peer=<code>" is an invitation, "#peerok=<code>" its reply; a pasted
   link or a bare code is read the same way. */
export function parsePeerText(text){
  const m = /(?:^|[#&?])(peer|peerok)=([jz][A-Za-z0-9_-]+)/.exec(String(text || "").trim());
  return m ? { kind: m[1], code: m[2] } : null;
}

/* --------------------------------------------------------- connection --- */
function closePC(){
  if(DC){ try{ DC.onclose = null; DC.close(); }catch(e){} }
  if(PC){ try{ PC.onconnectionstatechange = null; PC.close(); }catch(e){} }
  DC = null; PC = null; clearTimeout(WEAK_T);
}
function gathered(pc){
  return new Promise(ok => {
    if(pc.iceGatheringState === "complete") return ok();
    const t = setTimeout(ok, GATHER_MS);
    pc.addEventListener("icegatheringstatechange", () => { if(pc.iceGatheringState === "complete"){ clearTimeout(t); ok(); } });
  });
}
function newPC(){
  closePC();
  const pc = new RTCPeerConnection({ iceServers: ICE });
  pc.onconnectionstatechange = () => {
    if(pc !== PC) return;
    const s = pc.connectionState;
    if(s === "disconnected" && live()){
      appState.P.st = "weak"; refresh();
      clearTimeout(WEAK_T); WEAK_T = setTimeout(() => { if(pc === PC && pc.connectionState !== "connected") lost(); }, 10000);
    }
    if(s === "connected" && appState.P.st === "weak"){ appState.P.st = "live"; refresh(); }
    if(s === "failed" || s === "closed") lost();
  };
  pc.ondatachannel = e => wire(e.channel);
  PC = pc;
  return pc;
}
function wire(dc){
  DC = dc;
  dc.onopen = () => {
    if(dc !== DC) return;
    const was = appState.P.st;
    appState.P.st = "live"; appState.P.err = ""; appState.P.url = ""; appState.P.svg = "";
    appState.V.peerPanel = false;
    LAST_SENT = ""; send({ t: "hi", v: PROTO, n: myName() }); push(true);
    if(was !== "live") toast("Linked" + (appState.P.who ? " with " + appState.P.who : "") + ": swipe the roster sideways, or tap their tab, to see their fleet.");
    render(); hint(true);
  };
  dc.onmessage = e => take(e.data);
  dc.onclose = () => { if(dc === DC) lost(); };
  if(dc.readyState === "open") dc.onopen();
}
function lost(){
  if(!PC && !DC) return;
  closePC();
  appState.P.st = peerHas() ? "lost" : "off";
  refresh();
}
function send(msg){
  if(!DC || DC.readyState !== "open") return false;
  try{ DC.send(JSON.stringify(msg)); return true; }catch(e){ return false; }
}
/* This page's state goes to the other one whenever it changes (render()
   calls this after every draw; unchanged state is not sent again). */
export function push(now){
  if(!DC || DC.readyState !== "open") return;
  clearTimeout(PUSH_T);
  const go = () => {
    const opt = {}; TRACK.forEach(t => { opt[t[0]] = !!OPT[t[0]]; });
    const body = JSON.stringify({ t: "g", n: myName(), G: appState.G || null, opt: opt, scr: appState.V.screen });
    if(body === LAST_SENT) return;
    try{ DC.send(body); LAST_SENT = body; }catch(e){}
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
  let m = null; try{ m = JSON.parse(raw); }catch(e){ return; }
  if(!m || typeof m !== "object") return;
  if(m.t === "hi"){ appState.P.who = typeof m.n === "string" ? scrub(m.n, 0).slice(0, 24) : ""; return; }
  if(m.t === "bye"){ closePC(); appState.P.st = peerHas() ? "lost" : "off"; toast(peerLabel() + " ended the link."); refresh(); return; }
  if(m.t !== "g") return;
  const had = peerHas();
  takeSnapshot(m);
  MSG_N++;
  lsSet(KEY_PEER, JSON.stringify({ n: appState.P.name, G: appState.P.G, opt: appState.P.opt, scr: appState.P.scr, at: appState.P.at }));
  if(peerSide() || !had || appState.V.peerPanel) render(); else freshStrip();
}
/* A change on the other phone while this one shows its own fleet: only the
   tab redraws and blinks - a full draw would close what the player has open. */
function freshStrip(){
  if(typeof document === "undefined" || !document.querySelector) return;
  const el = document.querySelector(".sides");
  if(!el) return;
  el.outerHTML = sidesStrip(true);
}
function refresh(){ if(appState.V.peerPanel || peerSide()) render(); else freshStrip(); }

/* I show the first code. */
export async function startOffer(){
  if(!rtcCan()){ appState.P.err = "This browser cannot link phones (no WebRTC)."; render(); return; }
  const P = appState.P;
  P.st = "offer"; P.err = ""; P.url = ""; P.svg = ""; P.handoff = false; P.id = Math.random().toString(36).slice(2, 8);
  render();
  try{
    const pc = newPC();
    wire(pc.createDataChannel("gfp", { ordered: true }));
    await pc.setLocalDescription(await pc.createOffer());
    await gathered(pc);
    if(pc !== PC) return;
    P.url = peerBase() + "#peer=" + await deflate({ v: PROTO, id: P.id, n: myName(), l: appState.G ? appState.G.ln : "", s: pc.localDescription.sdp });
    P.svg = qrSvg(P.url);
  }catch(e){ P.err = "The code could not be made: " + (e && e.message || e); P.st = peerHas() ? "lost" : "off"; }
  render();
}
/* The other phone's code reached me: I answer with a reply code. */
export async function acceptOffer(code){
  const P = appState.P;
  appState.V.peerPanel = true;
  if(!rtcCan()){ P.err = "This browser cannot link phones (no WebRTC)."; render(); return; }
  P.st = "answer"; P.err = ""; P.url = ""; P.svg = ""; P.handoff = false;
  render();
  try{
    const o = await inflate(code);
    if(!o || o.v !== PROTO || typeof o.s !== "string") throw new Error("the code is from another version of the page");
    P.who = String(o.n || "").replace(/[<>"`]/g, "").slice(0, 24); P.whoList = String(o.l || "").replace(/[<>"`]/g, "").slice(0, 60);
    P.id = String(o.id || "").replace(/[^a-z0-9]/g, "");
    const pc = newPC();
    await pc.setRemoteDescription({ type: "offer", sdp: o.s });
    await pc.setLocalDescription(await pc.createAnswer());
    await gathered(pc);
    if(pc !== PC) return;
    P.url = peerBase() + "#peerok=" + await deflate({ v: PROTO, id: P.id, n: myName(), s: pc.localDescription.sdp });
    P.svg = qrSvg(P.url);
  }catch(e){ P.err = "The code could not be read: " + (e && e.message || e) + "."; P.st = peerHas() ? "lost" : "off"; }
  render();
}
/* The reply reached me: in this tab, or handed on to the tab that waits. */
export async function takeReply(code){
  const P = appState.P;
  let o = null;
  try{ o = await inflate(code); }catch(e){ P.err = "The reply code could not be read."; appState.V.peerPanel = true; render(); return; }
  if(!o || o.v !== PROTO || typeof o.s !== "string"){ P.err = "The reply is from another version of the page."; appState.V.peerPanel = true; render(); return; }
  if(PC && P.st === "offer" && o.id === P.id && PC.signalingState === "have-local-offer"){
    try{
      P.who = String(o.n || "").replace(/[<>"`]/g, "").slice(0, 24);
      await PC.setRemoteDescription({ type: "answer", sdp: o.s });
      P.connecting = true; render();
    }catch(e){ P.err = "The reply did not fit this code: " + (e && e.message || e); render(); }
    return;
  }
  /* another tab of this browser has the code open (the camera opened the
     reply in a new tab) */
  if(BC){
    let acked = false;
    const onAck = e => { if(e.data && e.data.t === "ack" && e.data.id === o.id) acked = true; };
    BC.addEventListener("message", onAck);
    BC.postMessage({ t: "reply", id: o.id, code: code });
    await new Promise(ok => setTimeout(ok, 1200));
    BC.removeEventListener("message", onAck);
    if(acked){ P.handoff = true; appState.V.peerPanel = true; render(); return; }
  }
  P.err = "No code of this page is waiting for that reply. Tap Show my code again and scan its new reply.";
  appState.V.peerPanel = true; render();
}
export function dropLink(forget){
  send({ t: "bye" });
  closePC();
  const P = appState.P;
  P.url = ""; P.svg = ""; P.err = ""; P.connecting = false;
  if(forget){ lsDel(KEY_PEER); Object.assign(P, { G: null, opt: null, at: 0, fp: "", U: [], L0: null, rerr: "", name: "", who: "" }); appState.V.side = "me"; }
  P.st = peerHas() ? "lost" : "off";
  render();
}

/* An address with a code in it (the camera opened the page, or a second
   code in the same tab: hashchange). Returns whether there was one. */
export function takePeerFromAddress(){
  const loc = typeof location !== "undefined" ? location : null;
  const p = loc && /^#peer(ok)?=/.test(loc.hash || "") ? parsePeerText(loc.hash) : null;
  if(!p) return false;
  try{ history.replaceState(null, "", loc.pathname + loc.search); }catch(e){}
  appState.V.peerPanel = true;
  if(p.kind === "peer") acceptOffer(p.code); else takeReply(p.code);
  return true;
}
export function peerBoot(){
  /* the last copy of their fleet: shown, marked as not live */
  try{
    const s = JSON.parse(lsGet(KEY_PEER) || "null");
    if(s && s.G){ takeSnapshot(s); appState.P.st = "lost"; }
  }catch(e){}
  try{
    if(typeof BroadcastChannel === "function"){
      BC = new BroadcastChannel("gothic-fleet-play-peer");
      BC.onmessage = e => {
        const m = e.data;
        if(m && m.t === "reply" && PC && appState.P.st === "offer" && m.id === appState.P.id){
          BC.postMessage({ t: "ack", id: m.id });
          takeReply(m.code);
        }
      };
    }
  }catch(e){ BC = null; }
  takePeerFromAddress();
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
  return P.st === "live" ? "live" : P.st === "weak" ? "connection weak" : P.at ? "not live " + MID + " last seen " + clock(P.at) : "not linked";
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
    (!live() ? `<p class="note stale">Not live: their fleet as it was at ${clock(P.at)}. <button class="mini" data-act="peerpanel">Link again</button></p>` : "") +
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
    if(t && t.id === "peerpaste") appState.V.peerPaste = t.value;
  });
}
export function peerAfterRender(){
  push(false);
  if(!HINTED && live()) hint(false);
}

/* --------------------------------------------------------- the panel --- */
export function peerMenuWord(){
  const P = appState.P;
  return P.st === "live" || P.st === "weak" ? "linked with " + peerLabel() + " " + MID + " " + statusWord()
    : peerHas() ? peerLabel() + " " + MID + " " + statusWord() : "link two phones: see the other's ships live";
}
export function peerTool(){
  return `<button class="tool${live() ? " on" : ""}" data-act="peerpanel" title="Link with the opponent's phone"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/></svg><span>Opponent</span></button>`;
}
export function peerLoadCard(){
  const P = appState.P;
  return `<div class="card"><h2>Opponent's fleet</h2>
    <p>${live() ? "Linked with <b>" + esc(peerLabel()) + "</b>: their ships and their damage, live." : peerHas() ? esc(peerLabel()) + ": " + esc(statusWord()) + "." : "Link with the other player's phone and see their ships and what has happened to them, live, beside your own. Before the game or in the middle of it."}</p>
    ${peerHas() ? `<button class="btn" data-act="side" data-arg="peer">See their fleet</button>` : ""}
    <button class="btn ${peerHas() ? "sec" : ""}" data-act="peerpanel">${live() ? "Link status" : "Link with the opponent"}</button></div>`;
}
export function renderPeerPanel(){
  const P = appState.P;
  const canShare = typeof navigator !== "undefined" && !!navigator.share;
  const codeBox = (step, lead, after) => `<div class="phone peercode">
      <p class="step">${step}</p><p class="lead">${lead}</p>
      ${P.svg ? `<div class="qr" data-act="peerqr" title="Full screen">${P.svg}</div>` : `<p class="foot">Making the code&hellip;</p>`}
      <div class="r4"><button data-act="peerqr" ${P.svg ? "" : "disabled"}>Full screen</button><button data-act="peercopy" ${P.url ? "" : "disabled"}>${appState.V.copied === "peer" ? "Copied" : "Copy link"}</button>${canShare ? `<button data-act="peershare" ${P.url ? "" : "disabled"}>Share</button>` : ""}</div>
      ${after || ""}</div>`;
  let body = "";
  if(P.handoff){
    body = `<p class="note ok">The reply went to the Play tab that showed the code: the link is made there. You can close this tab.</p>`;
  }else if(live()){
    body = `<p class="pstat on"><span class="pdot on"></span>Linked with <b>${esc(peerLabel())}</b>${P.G && P.G.ln ? " " + MID + " " + esc(P.G.ln) : ""}${P.st === "weak" ? " " + MID + " connection weak, trying&hellip;" : ""}</p>
      <p class="foot">Their ships and their damage come as they tap. Swipe the roster sideways or tap their tab to see them; yours go to them the same way.</p>
      ${peerHas() ? `<button class="btn" data-act="side" data-arg="peer">See their fleet</button>` : `<p class="foot">They have no game open yet.</p>`}
      <button class="btn sec" data-act="peerdrop">Disconnect<small>both keep the last copy, marked not live</small></button>`;
  }else if(P.st === "offer"){
    body = codeBox("Step 1 of 2", "On the other phone, scan this with the camera (or open the link there). Play opens there and shows a reply code.",
      `<p class="step">Step 2 of 2</p><p class="lead">${P.connecting ? "Connecting&hellip;" : "Scan their reply code with this phone's camera: it opens here and the link is made."}</p>
      <details class="paste"${appState.V.peerPaste ? " open" : ""}><summary>or paste the reply link</summary>
        <textarea id="peerpaste" placeholder="the reply link (...#peerok=...)">${esc(appState.V.peerPaste || "")}</textarea>
        <button class="btn sec" data-act="peerpaste">Use the pasted reply</button></details>`) +
      `<button class="btn sec" data-act="peercancel">Cancel</button>`;
  }else if(P.st === "answer"){
    body = codeBox("Step 2 of 2", `Show this to ${P.who ? "<b>" + esc(P.who) + "</b>'s" : "the other"} phone: they scan it with their camera${P.whoList ? " (" + esc(P.whoList) + ")" : ""}. The link is made when it opens there.`,
      `<p class="foot">Waiting for the connection&hellip;</p>`) + `<button class="btn sec" data-act="peercancel">Cancel</button>`;
  }else{
    body = `${peerHas() ? `<p class="pstat"><span class="pdot"></span>${esc(peerLabel())} ${MID} ${esc(statusWord())}</p>` : ""}
      <p>Link with the other player's phone to see their ships and their damage live, beside your own. You can link before the game or in the middle of it; nothing changes in either game.</p>
      <label class="nmrow">Your name for them<input id="peername" type="text" maxlength="24" value="${esc(myName())}" placeholder="${esc(appState.G ? appState.G.ln : "e.g. Joona")}" autocomplete="off" spellcheck="false" enterkeyhint="done"></label>
      <button class="btn" data-act="peeroffer" ${rtcCan() ? "" : "disabled"}>${peerHas() ? "Link again: show my code" : "Show my code"}<small>the other player scans it</small></button>
      <details class="paste"${appState.V.peerPaste ? " open" : ""}><summary>I have their link: paste it</summary>
        <textarea id="peerpaste" placeholder="their link (...#peer=...)">${esc(appState.V.peerPaste || "")}</textarea>
        <button class="btn sec" data-act="peerpaste">Use the pasted link</button></details>
      ${peerHas() ? `<button class="btn sec" data-act="side" data-arg="peer">See their last copy</button><button class="btn warn" data-act="peerforget">Forget their fleet</button>` : ""}
      <p class="foot">The phones talk to each other directly; nothing is stored on a server. The same Wi-Fi works best. A reload ends the link: link again with the same two codes.</p>`;
  }
  return `<div class="menu" data-act="peerpanel"><div class="box">
    <div class="mhd"><h2>Opponent's fleet</h2><button class="x" data-act="peerpanel" aria-label="Close">&#215;</button></div>
    ${P.err ? `<p class="note bad">${esc(P.err)}</p>` : ""}${body}
  </div></div>`;
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
  if(name === "peerpanel"){ appState.V.peerPanel = !appState.V.peerPanel; appState.V.menu = false; appState.P.err = appState.V.peerPanel ? appState.P.err : ""; if(!appState.V.peerPanel) appState.P.handoff = false; render(); return true; }
  if(name === "peeroffer"){ startOffer(); return true; }
  if(name === "peercancel"){ closePC(); appState.P.st = peerHas() ? "lost" : "off"; appState.P.url = ""; appState.P.svg = ""; appState.P.connecting = false; render(); return true; }
  if(name === "peerqr"){ if(appState.P.svg) qrFull(appState.P.svg); return true; }
  if(name === "peercopy"){ copyText(appState.P.url, "peer"); return true; }
  if(name === "peershare"){ shareText("Gothic Fleet Play: link", appState.P.url); return true; }
  if(name === "peerdrop"){ dropLink(false); return true; }
  if(name === "peerforget"){ if(confirm("Forget the opponent's fleet on this device?")) dropLink(true); return true; }
  if(name === "peerpaste"){
    const t = typeof document !== "undefined" && document.getElementById ? (document.getElementById("peerpaste") || {}).value : appState.V.peerPaste;
    const p = parsePeerText(t || appState.V.peerPaste);
    appState.V.peerPaste = "";
    if(!p){ appState.P.err = "That is not a link or code from Play's Opponent's fleet."; render(); return true; }
    if(p.kind === "peer") acceptOffer(p.code); else takeReply(p.code);
    return true;
  }
  return false;
}
export function peerMessages(){ return MSG_N; }
