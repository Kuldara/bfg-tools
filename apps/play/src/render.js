import { appState } from "./state.js";
import { wepClass } from "./setup.js";
import { OPT, PLAY_VERSION, TRACK, builderRaw, lsGet } from "./storage.js";
import { $, MID, TIMES, fnv } from "./helpers.js";
import { fleetFactsNow, fleetPoints, fleetsIn, parseDoc, resolveFleet } from "./fleet-document.js";
import { KEY_WAKE, builderTool, carriersOf, cmdsAboard, coCmd, grpLabel, isEscGrp, ldPlanOf, ldRollers, loadPlay, preCounts, preRollsOf, sqnShip, toolBtn, wl2Box, wlExtra, wlTag } from "./game-state.js";
import { IN_REFITS, inRefitKind, pregameRolls, pregameText } from "../../../packages/ui/pregame-tables.js";
import { cataLabel, critLabel, groupUnits } from "./actions.js";
import { upgradeLine, baseName, classTag, crippledNow, critChips, ldTile, memberWord, ordChip, ordnancePills, renderFleetPop, statsLine, unitName, weaponsLine, weaponsTable } from "./derived.js";
import { builderFleets, endPending, jumpStrip, linkedFleets, renderEndPhase } from "./share.js";
import PLAY from "../rules.js";
import { arcGlyph, esc, factionCols, shortArmour, shortRange, starHTML, title } from "../../../packages/ui/format.js";
import DOMAIN from "../../../packages/rules/domain.js";
import { boardNoteLine, renderBoardSheet } from "./board.js";
import { edgeHandle, peerAfterRender, peerLoadCard, peerMenuWord, peerSetupCard, peerSide, renderPeerPanel, renderPeerSide, sidesStrip } from "./peer.js";

/* ============================================================= RENDER ===== */
/* Scroll the open popover's anchor (the button line above it) to just
   under the sticky bar - in the page or inside the sheet. */
export function showPop(){
  /* No scrolling for a popover opened from a button: it opens right under
     the button that was tapped (user 30.9.2026: the screen must not move).
     Only a table that opened by itself with its top off the screen - the
     Catastrophic table after a hit on the sheet - is brought into view. */
  const pop = document.querySelector(".pop");
  if(!pop) return;
  const r = pop.getBoundingClientRect(), bar = document.querySelector(appState.V.sheet != null ? ".sh-hd" : ".top");
  const barH = bar ? bar.getBoundingClientRect().height : 0;
  if(r.top >= barH && r.top < window.innerHeight - 60) return;
  const anchor = pop.previousElementSibling || pop;
  anchor.style.scrollMarginTop = (barH + 8) + "px";
  anchor.scrollIntoView({ block: "start" });
}
/* The embarked commanders' points ride with their ship's VP: "any
   Admiral, Warmaster or Chaos Lord on board" (p. 123) - since J233 every
   commander's on his own ship. */
export const cmdPts = i => appState.G ? cmdsAboard(i).reduce((a, j) => a + (appState.U[j].R.points | 0), 0) : 0;
/* Victory points conceded by the whole roster: ships (p. 123), planetary
   defences one installation at a time (p. 123) and orbital mines bought
   one by one (Fleets p. 512) - PLAY.conceded knows which row pays what;
   a commander's own row and a minefield pay nothing. */
/* What a unit concedes; a mixed escort squadron of several cards concedes
   once, as a whole (p. 123), on its first card - its other cards give 0 */
export function vpOf(i){
  const g = appState.G.grp[i];
  if(isEscGrp(g)){
    const ms = groupUnits(g);
    return ms[0] !== i ? 0 : PLAY.squadronConceded(ms.map(j => ({ R: appState.U[j].R, st: appState.G.st[j], plus: cmdPts(j) })));
  }
  return PLAY.conceded(appState.U[i].R, appState.G.st[i], cmdPts(i));
}
/* the squadron's figure, for any of its cards */
export const vpOfGroup = i => isEscGrp(appState.G.grp[i]) ? vpOf(groupUnits(appState.G.grp[i])[0]) : null;
export const vpTotal = () => appState.U.reduce((a, x, i) => a + vpOf(i), 0);
/* The selector that finds a control again after a render. */
appState.TAP = null;
export function tapSel(el){
  const a = ["data-act", "data-i", "data-arg"].filter(k => el.hasAttribute(k))
    .map(k => "[" + k + '="' + String(el.getAttribute(k)).replace(/"/g, '\\"') + '"]').join("");
  return (el.closest(".pop") ? ".pop " : el.closest(".sheet") ? ".sheet " : "") + a;
}
export function render(){
  const tap = appState.TAP; appState.TAP = null;
  const top = document.scrollingElement ? document.scrollingElement.scrollTop : 0;
  const sh0 = document.querySelector(".sheet"), shTop = sh0 ? sh0.scrollTop : 0;
  /* a panel's own scroll (the menu, the End Phase) survives its re-render */
  const bx0 = document.querySelector(".menu .box"), bxTop = bx0 ? bx0.scrollTop : 0;
  let html = "";
  const peer = peerSide();
  if(peer) html = renderPeerSide();
  else if(appState.V.screen === "load") html = renderLoad();
  else if(appState.V.screen === "setup") html = renderSetup();
  else html = renderRoster();
  if(!peer && appState.V.sheet != null && appState.G) html += renderSheet(appState.V.sheet);
  if(!peer && appState.G && appState.V.screen === "roster") html = boardNoteLine() + html;
  if(!peer && appState.V.board && appState.G) html += renderBoardSheet();
  if(appState.V.peerPanel) html += renderPeerPanel();
  else if(!peer && appState.V.menu && appState.G) html += renderMenu();
  else if(!peer && appState.V.endph && appState.G && appState.V.screen === "roster") html += renderEndPhase();
  $("#app").innerHTML = html;
  /* A new screen starts at its top, not at the old one's scroll (user
     19.10.2026: the set-up opened half-way down, its first ship off the
     screen), and taps are not taken for a moment (the click handler). */
  const changed = appState.V.lastScreen !== appState.V.screen;
  if(changed){
    if(document.scrollingElement) document.scrollingElement.scrollTop = 0;
    if(appState.V.lastScreen != null) appState.V.guardUntil = Date.now() + 400;
    appState.V.lastScreen = appState.V.screen;
  }
  else if(appState.V.sheet == null && document.scrollingElement) document.scrollingElement.scrollTop = top;
  else { const sh1 = document.querySelector(".sheet"); if(sh1) sh1.scrollTop = shTop; }
  const bx1 = document.querySelector(".menu .box"); if(bx1 && bx0) bx1.scrollTop = bxTop;
  if(tap && !changed){
    let el = null;
    try{ el = document.querySelector(tap.sel); }catch(e){}
    if(el){
      const nr = el.getBoundingClientRect(), d = nr.top + nr.height / 2 - tap.top;
      if(Math.abs(d) >= 1){
        const sh2 = appState.V.sheet != null ? document.querySelector(".sheet") : null;
        if(sh2) sh2.scrollTop += d; else window.scrollBy(0, d);
      }
    }
  }
  if(appState.V.screen === "roster" || peer) paginate();
  wake();
  peerAfterRender();
}

/* ------------------------------------------------- screen wake lock --- */
/* A phone locks its screen after half a minute; at the table every look
   would then start with an unlock. While a game is open the page asks the
   browser to keep the screen on (Screen Wake Lock); the browser lets it go
   when the tab is hidden, and it is asked for again when the tab is back.
   Menu > Keep the screen on turns it off for this device. */
export let WAKE = null, WAKING = false;
export const wakeOff = () => lsGet(KEY_WAKE) === "0";
export const wakeCan = () => typeof navigator !== "undefined" && !!navigator.wakeLock;
export function wakeWanted(){ return !!appState.G && appState.V.screen === "roster" && !wakeOff() && document.visibilityState !== "hidden"; }
export function wake(){
  if(!wakeCan()) return;
  if(wakeWanted()){
    if(WAKE || WAKING) return;
    WAKING = true;
    navigator.wakeLock.request("screen").then(l => {
      WAKING = false; WAKE = l;
      l.addEventListener("release", () => { if(WAKE === l) WAKE = null; });
      if(!wakeWanted()){ WAKE = null; l.release().catch(() => {}); }
    }).catch(() => { WAKING = false; });
  }else if(WAKE){ const l = WAKE; WAKE = null; l.release().catch(() => {}); }
}
document.addEventListener("visibilitychange", wake);

/* ----------------------------------------------- the row at the top --- */
/* The row whose top part is at the top of the screen, and where it is:
   a change of view keeps it there. */
export function barBottom(){ const t = document.querySelector(".top"); return t ? t.getBoundingClientRect().bottom : 0; }
export function topRow(){
  if(!document.querySelectorAll) return null;
  const y = barBottom();
  const rows = [...document.querySelectorAll("section.row[data-u]")];
  for(const r of rows){ const b = r.getBoundingClientRect(); if(b.bottom > y + 8) return { u: r.getAttribute("data-u"), top: b.top }; }
  return null;
}
/* The strip's tap: that ship's row just under the top bar. */
export function jumpTo(i){
  const el = document.querySelector('section.row[data-u="' + i + '"]');
  if(!el) return;
  window.scrollBy(0, el.getBoundingClientRect().top - barBottom() - 6);
}

/* A laptop shows the fleet as a grid; what does not fit the screen goes
   on a second page rather than below the fold. Rows of the grid are
   measured after the render, so a card that grew (a popover) is counted. */
/* A laptop shows the fleet as a grid that scrolls; the pager's pages are
   the scroll positions at which a whole screenful of rows begins, so the
   arrows jump a screen at a time and the wheel still works. Rows are
   measured after the render, so a card that grew (a popover) is counted. */
export function paginate(){
  const main = $(".main"), pager = $(".pager");
  if(!main) return;
  const cards = [...main.children];
  appState.V.pages = 1; appState.V.pageTops = [0];
  const desktop = window.matchMedia("(min-width:900px)").matches;
  if(!desktop || !cards.length){ if(pager) pager.classList.add("hide"); return; }
  const cols = Math.max(1, getComputedStyle(main).gridTemplateColumns.split(" ").filter(Boolean).length);
  const topH = ($(".top") || { getBoundingClientRect: () => ({ height: 0 }) }).getBoundingClientRect().height;
  const botH = ($(".bottom") || { getBoundingClientRect: () => ({ height: 0 }) }).getBoundingClientRect().height;
  const avail = window.innerHeight - topH - botH - 24;
  const gap = 10;
  const heights = cards.map(c => c.getBoundingClientRect().height);
  const tops = cards.map(c => c.getBoundingClientRect().top + window.scrollY - topH - 10);
  const pageTops = [tops[0]]; let used = 0;
  for(let r = 0; r * cols < cards.length; r++){
    const idx = []; for(let k = r * cols; k < Math.min(cards.length, r * cols + cols); k++) idx.push(k);
    const rh = Math.max.apply(null, idx.map(k => heights[k])) + gap;
    if(used + rh > avail && used > 0){ pageTops.push(tops[idx[0]]); used = 0; }
    used += rh;
  }
  appState.V.pages = pageTops.length; appState.V.pageTops = pageTops;
  if(pager) pager.classList.toggle("hide", appState.V.pages <= 1);
  pageLabel();
}
/* Which page the window is on, from the scroll position. */
export function pageLabel(){
  const pager = $(".pager"); if(!pager || !appState.V.pageTops) return;
  const y = window.scrollY, maxY = document.documentElement.scrollHeight - window.innerHeight;
  let cur = 0; appState.V.pageTops.forEach((t, k) => { if(y >= t - 2) cur = k; });
  if(maxY > 0 && y >= maxY - 2) cur = appState.V.pages - 1;
  appState.V.page = cur;
  const lab = pager.querySelector("b"); if(lab) lab.textContent = (cur + 1) + " / " + appState.V.pages;
  const prev = pager.querySelector("[data-arg='-1']"), next = pager.querySelector("[data-arg='1']");
  if(prev) prev.disabled = cur <= 0;
  if(next) next.disabled = cur >= appState.V.pages - 1;
}
window.addEventListener("scroll", () => { if((appState.V.screen === "roster" || peerSide()) && appState.V.sheet == null) pageLabel(); }, { passive: true });
window.addEventListener("resize", () => { if((appState.V.screen === "roster" || peerSide()) && appState.V.sheet == null) paginate(); });

export function renderLoad(){
  const raw = builderRaw();
  const g = loadPlay();
  let cards = "";
  if(g){
    const res = resolveFleet(g.doc);
    const same = !res.error && (g.src && g.src !== "builder" || (function(){ const p = raw ? parseDoc(raw) : null; if(!p || !p.o) return true;
      return fleetsIn(p.o).some(f => fnv(JSON.stringify([f.ln, f.units])) === g.fp); })());
    cards += `<div class="card"><h2>Game in progress</h2>
      <p>${esc(g.ln)} ${MID} turn ${g.fleet.turn} ${MID} ${g.st.length} units${res.error ? "" : " " + MID + " " + fleetPoints(res.units) + " pts"}</p>
      ${same ? "" : `<p class="note">The fleet in the builder has changed since this game began. Resume keeps playing with the roster as it was; a new game reads the current one.</p>`}
      ${res.error ? `<p class="note bad">${esc(res.error)}</p>` : res.units.length !== g.st.length ? `<p class="note bad">The roster no longer resolves to the saved units (${res.units.length} of ${g.st.length}${res.lost.length ? ", " + res.lost.length + " could not be matched" : ""}). Start a new game.</p>` : `<button class="btn" data-act="resume">Resume game<small>turn ${g.fleet.turn}</small></button>`}
    </div>`;
  }
  /* this device's own saved fleets - from links, QR codes and files (J208):
     the newest ones are marked, and each keeps the name it was sent with */
  const lk = linkedFleets();
  const isNew = fp => Array.isArray(appState.V.linkNew) && appState.V.linkNew.indexOf(fp) >= 0;
  if(lk.length){
    cards += `<div class="card"><h2>Saved fleets</h2>` + lk.map((f, k) => {
      const res = resolveFleet(f.doc);
      return `<div class="fl${isNew(f.fp) ? " fresh" : ""}">${res.error ? `<p class="note bad">${esc(f.doc.name || f.doc.ln || "")}: ${esc(res.error)}</p>` :
        `<button class="btn ${isNew(f.fp) || (!appState.V.linkNew && k === 0) ? "" : "sec"}" data-act="linked" data-arg="${k}">${esc(f.doc.name || f.doc.ln)}<small>${f.doc.name ? esc(f.doc.ln) + " " + MID + " " : ""}${res.units.length} units ${MID} ${fleetPoints(res.units)} pts ${MID} ${f.how === "file" ? "file" : "link"} ${esc(f.date || "")}${isNew(f.fp) ? " " + MID + " new" : ""}</small></button>`}
        <span class="side"><button class="mini${appState.V.phone === "s:" + k ? " on" : ""}" data-act="phone" data-arg="s:${k}" aria-label="Send this fleet to another phone">to phone</button>
        <button class="mini" data-act="unlink" data-arg="${k}" aria-label="Forget this fleet on this device">forget</button></span></div>
        ${appState.V.phone === "s:" + k ? phonePanel() : ""}`;
    }).join("") + (lk.length > 1 ? `<button class="btn sec${appState.V.phone === "all" ? " on" : ""}" data-act="phone" data-arg="all">All to phone<small>every saved fleet in one QR code</small></button>${appState.V.phone === "all" ? phonePanel() : ""}` : "") + `</div>`;
  }
  /* the builder's own fleets on this device: its saved fleets by name, then
     the fleet each list is editing; play one here, or send it to a phone (a
     QR code of the link, under the tapped button) */
  const bad = raw ? parseDoc(raw).error : "";
  if(bad) cards += `<div class="card"><h2>Fleet in this browser</h2><p class="note bad">${esc(bad)}</p></div>`;
  const bf = builderFleets();
  if(bf.length){
    cards += `<div class="card"><h2>Fleets from the builder</h2>` + bf.map((f, k) => {
      const res = resolveFleet(f);
      return res.error ? `<p class="note bad">${esc(f.name || f.ln)}: ${esc(res.error)}</p>` :
        `<div class="fl"><button class="btn ${k ? "sec" : ""}" data-act="newfrom" data-arg="${k}">${esc(f.name || f.ln)}<small>${f.name ? esc(f.ln) + " " + MID + " " : ""}${res.units.length} units ${MID} ${fleetPoints(res.units)} pts${res.lost.length ? " " + MID + " " + res.lost.length + " could not be matched" : ""} ${MID} ${f.saved ? "saved" : f.open ? "being edited" : "being edited, kept"}</small></button>
          <button class="mini${appState.V.phone === "b:" + k ? " on" : ""}" data-act="phone" data-arg="b:${k}" aria-label="Send this fleet to a phone">to phone</button></div>
        ${appState.V.phone === "b:" + k ? phonePanel() : ""}`;
    }).join("") + `</div>`;
  }else if(!lk.length && !g && !bad){
    cards += `<div class="card"><h2>No fleet on this device</h2><p>Three ways to bring one: open this page from the builder (its Play button) and its fleets are here by themselves; in the builder's <b>Saved fleets</b>, tap <b>To phone</b> and scan the code; or open a fleet file below.</p></div>`;
  }
  cards += peerLoadCard();
  cards += `<div class="card"><h2>Open a fleet file</h2>
    <p>The builder's <b>Saved fleets &rsaquo; Export</b> or <b>Export all as file</b>. On a phone it can come by mail or chat; its fleets go on this page's Saved fleets.</p>
    <label class="btn sec">Open a fleet file<input type="file" id="fleetfile" accept=".json,application/json,text/plain" style="display:none"></label>
    ${appState.V.loadErr ? `<p class="note bad">${esc(appState.V.loadErr)}</p>` : ""}
    <details class="paste"><summary>or paste the file's text</summary>
      <textarea id="paste" placeholder="Paste the fleet document (JSON) here"></textarea>
      <button class="btn sec" data-act="paste">Load pasted fleet</button></details></div>`;
  return `<div class="top"><h1 style="flex:1 1 auto">Gothic Fleet Play<small>prototype ${PLAY_VERSION}</small></h1><div class="tools">${builderTool()}</div></div>
    <div class="main">${cards}
    <p class="foot" style="padding:0 6px">Record, do not adjudicate: the page keeps what happened to each ship and shows what the rulebook makes of it. It never changes the fleet you built.</p></div>`;
}
/* The phone panel under a builder fleet: the QR code, the link, copy and
   share. The fleet travels inside the link; nothing is uploaded. */
export function phonePanel(){
  const V = appState.V, canShare = typeof navigator !== "undefined" && !!navigator.share;
  const link = `<input class="link" readonly value="${esc(V.phoneUrl || "")}" aria-label="The link">`;
  const send = `<button data-act="copylink" ${V.phoneUrl ? "" : "disabled"}>${V.copied === "link" ? "Copied" : "Copy link"}</button>${canShare ? `<button data-act="sharelink" ${V.phoneUrl ? "" : "disabled"}>Share</button>` : ""}`;
  const opens = `the fleet builder opens there${V.phoneRemote ? " (the published page, bfgtools.kuldare.com)" : ""} ${V.phoneN > 1 ? "with all " + V.phoneN + " fleets in its Saved fleets" : "with the fleet on screen"}`;
  /* too long for a code a camera can read: the file first, the link as it is */
  if(V.phoneUrl && !V.phoneSvg && !V.phoneErr) return `<div class="phone">
    <p class="foot">${V.phoneN > 1 ? "These " + V.phoneN + " fleets are" : "This fleet is"} too much for a QR code a camera can read. Save a file and send it to the other phone, where Open a fleet file reads it. Or send the link: ${opens}. Some chat apps cut a link this long (${V.phoneUrl.length} characters).</p>
    ${link}
    <div class="r4"><button data-act="savefile" data-arg="${esc(String(V.phone))}">Save file</button>${send}</div>
  </div>`;
  return `<div class="phone">
    ${V.phoneErr ? `<p class="note bad">${esc(V.phoneErr)}</p>` : V.phoneSvg ? `<div class="qr" data-act="qrfull" title="Full screen">${V.phoneSvg}</div>` : `<p class="foot">Making the code&hellip;</p>`}
    <p class="foot">Hold this screen up to the other phone's camera (brightness up helps), or ${canShare ? "Share the link to it" : "send it the link"}: ${opens}: Save keeps it, Play plays it. The fleet is inside the link itself; nothing is uploaded.</p>
    ${link}
    <div class="r4"><button data-act="qrfull" ${V.phoneSvg ? "" : "disabled"}>Full screen</button>${send}</div>
  </div>`;
}

export function factsCard(){
  const fs = fleetFactsNow();
  return fs.length ? `<div class="card"><h2>Fleet facts</h2>${fs.map(f =>
    `<div class="setrow"><div class="who"><b>${esc(f.t)}</b><small>${esc(f.s)}</small></div><span class="pill on"><b>${esc(f.v)}</b></span></div>`).join("")}</div>` : "";
}
/* ---- Rolling before the game (user 31.10.2026, RULINGS.md T44) -------- */
const bookPg = (book, page) => (book === "Fleets" ? "Fleets p. " : "p. ") + page;
/* the range a plan gives: its table's lowest and highest, the modifiers,
   at most 10 (p. 48) */
function ldRange(p){
  const add = p.mods.reduce((a, m) => a + m.v, 0), vals = p.table.d.slice(1).map(v => Math.min(10, v + add));
  return Math.min.apply(null, vals) + "-" + Math.max.apply(null, vals);
}
/* The fleet's own Leadership rules, shut until opened: which table each
   ship rolls on with what it adds, who does not roll, and the other dice
   of the set-up with their tables in full. */
export function ldGuide(){
  const groups = {}, order = [], fixed = [], manual = [];
  appState.U.forEach((x, i) => {
    if(x.R.kind !== "ship") return;
    const p = ldPlanOf(i);
    if(!p) return;
    if(!p.roll){ (p.manual ? manual : fixed).push({ i, p }); return; }
    const key = p.table.name + "|" + p.mods.map(m => m.t + m.v).join(",");
    if(!groups[key]){ groups[key] = { p, ships: [] }; order.push(key); }
    groups[key].ships.push(i);
  });
  const names = is => { const c = {}; is.forEach(i => { const n = title(appState.U[i].R.className); c[n] = (c[n] || 0) + 1; }); return Object.keys(c).map(n => esc(n) + (c[n] > 1 ? " " + TIMES + c[n] : "")).join(", "); };
  const rows = order.map(k => { const g = groups[k], p = g.p;
    return `<li><b>${esc(p.table.name)} table</b> (${bookPg(p.table.book, p.table.page)}): D6 ${esc(p.table.rows)}${p.mods.map(m => `; ${m.v > 0 ? "+" : ""}${m.v} ${esc(m.t)} (Fleets p. ${m.page})`).join("")} ${MID} <b>Ld ${ldRange(p)}</b><br><small>${names(g.ships)}</small></li>`; });
  fixed.forEach(f => rows.push(`<li><b>${esc(unitName(f.i))}</b>: Ld ${f.p.value}, not rolled ${MID} ${esc(f.p.note)} (${bookPg(f.p.book, f.p.page)})</li>`));
  if(manual.length) rows.push(`<li><b>${names(manual.map(f => f.i))}</b>: ${esc(manual[0].p.note)}. Tap the value yourself.</li>`);
  const R0 = appState.U.map(x => x.R);
  const txt = R0.map(R => (R.rules || []).map(r => String(r.t || "")).join(" ")).join(" ");
  const extra = [
    "Roll Ld rolls a D6 for every ship still without a value, on its own table with what the book adds; Roll upgrades does the same for the dice below. Nothing is rolled twice: change a value as you would set it by hand, with an Ld tile or the upgrade's list.",
    "One roll per capital ship and one per escort squadron (p. 45); a capital squadron tests on its highest Ld (p. 95). Nothing goes above 10 (p. 48).",
    appState.G.cmd != null ? "The fleet commander's Leadership goes on his flagship after the roll: a fixed value replaces it, a bonus is added (max 10). Another commander's line is yours to add (T40)." : "",
    R0.some(R => R.gifts) ? "Adeptus Mechanicus: a ship that rolls a natural 6 for its Leadership may choose its Mechanicus Gift instead of rolling it, unless it carries an Archmagos (Fleets p. 118)." : "",
    /swap Leadership ratings with a Kill Kroozer or Terror Ship/i.test(txt) ? "Ork battleships: once the Leadership is rolled, the battleship may swap its value with a Kill Kroozer or Terror Ship (Fleets pp. 376-381) - tap the swapped values." : "",
    appState.L0 && appState.L0.clanz ? "Da Ork Clanz: a Warlord may swap Leadership with any one ship or escort squadron under his command (Fleets p. 374)." : "",
    R0.some(R => pregameRolls(R).some(r => r.key === "xeno")) ? "Xenotech Long Range Sensors: +1 to base Leadership, max 10 (Fleets p. 185) - add it to the ship's value." : ""
  ].filter(Boolean);
  /* the other dice: each table once, with the ships that roll on it */
  const tabs = {}, tOrder = [];
  appState.U.forEach((x, i) => pregameRolls(x.R).forEach(r => { if(!tabs[r.key]){ tabs[r.key] = { r, who: [] }; tOrder.push(r.key); } tabs[r.key].who.push(i); }));
  const tabHTML = tOrder.map(k => { const t = tabs[k], r = t.r;
    const body = r.two ? r.tables.map(T => `<div class="pg-t"><h6>${esc(T.roll)} ${esc(T.name)} <span>Rulebook p. ${T.page}</span></h6><ol>${T.rows.map(x => `<li><i>${esc(x[0])}</i> &ndash; ${x[1]}</li>`).join("")}</ol></div>`).join("")
      : r.rows ? `<ol>${r.rows.map(x => `<li><i>${esc(x[0])}</i> &ndash; ${x[1]}</li>`).join("")}</ol>` : "";
    return `<div class="pg-tab"><h5>${esc(r.title)} <span>Fleets p. ${r.page}</span></h5><p>${esc(r.note)}</p>${body}<small>${t.who.map(i => esc(unitName(i))).join(", ")}</small></div>`; }).join("");
  return `<details class="ldguide"${appState.V.ldGuide ? " open" : ""}><summary>Leadership rules of this fleet${tOrder.length ? " and the other pre-game dice" : ""}</summary>
    <ul>${rows.join("")}</ul>${extra.map(t => `<p>${esc(t)}</p>`).join("")}${tabHTML ? `<h4>Rolled before the game</h4>${tabHTML}` : ""}</details>`;
}
/* the roll buttons, an option beside the taps: only while something is
   still without a value. No re-roll (user 31.10.2026): once rolled, a change
   is made as a manual input - an Ld tile or the upgrade's select. */
function rollBar(){
  const rollers = ldRollers(), open = rollers.filter(i => appState.G.st[i].ld == null).length;
  const pc = preCounts();
  const ldBtn = open ? `<button class="btn sec" data-act="rollld">Roll Ld<small>${open === rollers.length ? open + " to roll" : open + " still to roll"}</small></button>` : "";
  const preBtn = pc.open ? `<button class="btn sec" data-act="rollpre">Roll upgrades<small>${pc.open} to roll</small></button>` : "";
  return ldBtn || preBtn ? `<div class="rollbar">${ldBtn}${preBtn}</div>` : "";
}
/* the row's dice: the Leadership's die and sum; one select per pre-game
   roll, to pick by hand or change what was rolled */
function rowDice(i){
  const st = appState.G.st[i], p = ldPlanOf(i);
  const ld = st.ldWhy && st.ld != null ? ` ${MID} <span class="dice">${st.ldDie == null ? "" : "rolled "}${esc(st.ldWhy)}</span>` : "";
  const man = p && p.manual ? ` ${MID} ${esc(p.note)}` : "";
  const pre = preRollsOf(i).map(r => {
    const v = (st.pre || {})[r.key];
    const cur = v ? (r.two ? v.k + "-" + v.d : String(v.d)) : "";
    const opts = r.two
      ? IN_REFITS.map((T, t) => `<optgroup label="${esc(T.roll + " " + T.name)}">${T.rows.map((x, d) => { const val = (2 * t + 1) + "-" + (d + 1); const sel = v && inRefitKind(v.k) === T && v.d === d + 1; return `<option value="${val}"${sel ? " selected" : ""}>${esc(T.name.replace(/ refit$/, ""))} ${d + 1}: ${esc(x[0])}</option>`; }).join("")}</optgroup>`).join("")
      : [1, 2, 3, 4, 5, 6].map(d => `<option value="${d}"${cur === String(d) ? " selected" : ""}>${d}${r.rows ? " " + esc(r.rows[d - 1][0]) : ""}</option>`).join("");
    const choose = r.key === "gift" && st.giftChoice ? ` <em class="dice">natural 6 on Ld: may choose (Fleets p. 118)</em>` : "";
    const how = v ? (v.how === "roll" ? "rolled" : "chosen") : (r.pick ? "pick" : "to roll");
    return `<label class="pre${v ? "" : " open"}"><span>${esc(r.title)} <i>${how}</i></span><select data-sel="pre" data-i="${i}" data-key="${r.key}" aria-label="${esc(r.title)}"><option value="">${r.pick ? "choose" : "roll or choose"}</option>${opts}</select>${choose}</label>`;
  }).join("");
  return { line: ld + man, pre: pre ? `<div class="pres">${pre}</div>` : "" };
}
/* on the card: what was rolled before the game, with its page */
export function preLine(i){
  const st = appState.G.st[i], rs = preRollsOf(i).filter(r => (st.pre || {})[r.key]);
  if(!rs.length) return "";
  return `<p class="preline">${rs.map(r => { const v = st.pre[r.key]; const row = r.two ? inRefitKind(v.k).rows[v.d - 1] : r.rows ? r.rows[v.d - 1] : null;
    return `<b>${esc(r.title)}:</b> ${esc(pregameText(r, v))}${row ? " &ndash; " + row[1] : ""} (${r.two ? "Rulebook pp. 158-159" : (r.key === "crew" ? "Rulebook" : "Fleets") + " p. " + r.page})`; }).join("<br>")}</p>`;
}
export function renderSetup(){
  const rows = appState.U.map((x, i) => {
    const R = x.R, st = appState.G.st[i];
    if(R.kind === "commander"){
      /* who he may board: a capital ship, a star fort (Fleets p. 503,
         p. 111) or a Haven (p. 334) - never a platform, a station or a
         defence vessel (PLAY.mayCarryCommander); an Ork Warlord the ships
         the builder gives him, an escort squadron too (J233, carriersOf) */
      const caps = carriersOf(i), fc = i === appState.G.cmd, cur = fc ? appState.G.flag : (appState.G.on || {})[i];
      const ld = R.leadership;
      /* the fleet commander's Leadership goes on the flagship; another
         commander's is the player's to put in the ship's value (T40) */
      const ldTxt = !ld || ld.value == null ? ""
        : fc ? (ld.kind === "fixed" ? "Ld " + ld.value + " for the flagship" : "+" + ld.value + " Ld for the flagship (max " + (ld.max || 10) + ")")
        : (ld.kind === "fixed" ? "Ld " + ld.value : "+" + ld.value + " Ld") + " for his ship: put it in the value you tap";
      /* every commander boards (J233): one ship is said, more are a choice */
      const pick = !caps.length ? "" : caps.length === 1
        ? `<span class="pill on">aboard ${esc(unitName(caps[0]))}</span>`
        : `<select data-sel="${fc ? "flag" : "on"}" data-i="${i}" aria-label="Aboard">${caps.map(j => `<option value="${j}" ${cur === j ? "selected" : ""}>aboard ${esc(unitName(j))}</option>`).join("")}</select>`;
      return `<div class="setrow"><div class="who"><b>${esc(unitName(i))}</b><small>${ldTxt}${rrWords(R)}</small>${rowDice(i).pre}</div>
        ${pick}</div>`;
    }
    if(R.kind !== "ship") return "";
    const esq = PLAY.isEscort(R);
    /* Ld 5 to Ld 10: the rulebook's table gives 6-9 (p. 45), the fleets'
       own tables 5 (Orks, Fleets p. 360) to 10 (Space Marines, p. 94), and
       a fleet may hold ships of another table (PLAY.LD_VALUES) */
    const tiles = PLAY.LD_VALUES.map(v => `<button class="${st.ldRoll === v ? "on" : ""}" data-act="ld" data-i="${i}" data-arg="${v}">${v}</button>`).join("");
    /* no roll: the commander's own line on the flagship, or a Leadership
       the book fixes - the pill carries the value, the line the reason and
       its page */
    const fx = PLAY.fixedLd(R);
    const fixed = (st.ldFrom === "commander" && st.ldRoll == null) || !!fx;
    /* The page derives nothing of the ship's own into the value (user
       decision 13.10.2026, RULINGS.md T40: no Leadership automation here, a
       plain choice by the player) - the Emperor's +1 (Fleets p. 53) is the
       player's to add before tapping. */
    const why = st.ldFrom === "commander" ? " " + MID + " Ld " + st.ld + " from the commander"
      : fx ? " " + MID + " " + esc(fx.note || "fixed") + (fx.page ? " (Fleets p. " + fx.page + ")" : "") : "";
    const sqn = sqnShip(R);
    /* J235 (user 25.10.2026: "the squadron choice in a different colour and
       shape from the Ld choice ... it is hard to find which Ld is missing"):
       the squadron switch is a pill of its own under the name,
       away from the Ld tiles; a ship still without its Ld is marked */
    const need = st.ld == null;
    const sqBtn = sqn ? `<button class="sqb${appState.G.grp[i] ? " on" : ""}" data-act="grp" data-i="${i}"${appState.G.grp[i] ? ` style="--sqc:${sqColor(appState.G.grp[i])}"` : ""} title="Squadron: tap for A, B, C or none (p. 95, 99)">${appState.G.grp[i] ? "SQN " + appState.G.grp[i] : "+ SQN"}</button>` : "";
    return `<div class="setrow${need ? " need" : ""}" data-u="${i}"><div class="who"><input class="nm" type="text" data-nm="${i}" value="${esc(unitName(i))}" placeholder="${esc(baseName(i))}" maxlength="40" autocomplete="off" autocapitalize="words" spellcheck="false" enterkeyhint="done" aria-label="Name of this ship in the game"><small>${classTag(R)}${esq ? " " + TIMES + R.hulls + (fx ? "" : isEscGrp(appState.G.grp[i]) ? " " + MID + " one Ld for squadron " + grpLabel(appState.G.grp[i]) + " (" + groupUnits(appState.G.grp[i]).length + " cards)" : " " + MID + " one Ld for the squadron") : ""}${why}${youngGunzNote(i)}${rowDice(i).line}${need ? ` ${MID} <span class="needs">pick its Ld</span>` : ""}</small>${sqBtn}${rowDice(i).pre}</div>
      <div class="ctl">${fixed ? `<span class="pill on"><b>Ld ${st.ld}</b></span>` : `<div class="seg ld">${tiles}</div>`}</div></div>`;
  }).join("");
  /* a grey Start says why, and each name takes you to its row */
  const missing = appState.U.map((x, i) => x.R.kind === "ship" && appState.G.st[i].ld == null ? i : -1).filter(i => i >= 0);
  const ready = !missing.length;
  /* a game under way, come back from the menu: back to it, and no Exit
     that would forget its record (user 31.10.2026). A record from before
     G.started is under way once its roster has been seen (resume sets it). */
  const started = !!appState.G.started;
  const anyFixed = appState.U.some(x => PLAY.fixedLd(x.R) && PLAY.fixedLd(x.R).value === 7);
  const frr = fleetRR();
  const frrRow = frr ? `<div class="setrow"><div class="who"><b>Fleet re-rolls</b><small>${esc(frr.text)} ${MID} the fleet's own, no commander (Fleets p. ${frr.page})</small></div><span class="pill on">RR <b>${appState.G.fleet.rerolls | 0}</b></span></div>` : "";
  return `<div class="top"><h1>Set up<small>${esc(appState.G.ln)} ${MID} ${fleetPoints(appState.U)} pts</small></h1>
      <div class="tools">${builderTool()}${started ? toolBtn("start", "undo", "Game", { off: !ready, tip: "Back to the game" }) : `<button class="tool" data-act="newgame" title="Back to the fleets: this set-up is not kept">Exit</button>`}</div></div>
    ${sidesStrip()}
    <div class="main">${peerSetupCard()}${factsCard()}<div class="card"><h2>Leadership</h2>
      ${ldGuide()}${rollBar()}
      <p>Tap the value each ship fights on, or let Roll Ld roll the ships still without one. SQN groups capital ships into a squadron: one Ld, one order, combined fire (p. 95, 99). Tap a ship's name to give it another one for this game.${appState.L0.clanz ? " Da Ork Clanz: a Warlord may swap Leadership with any one ship or escort squadron under his command (Fleets p. 374) - tap the swapped values." : ""}${anyFixed ? " Planetary defences do not roll: their checks are made on Ld 7 (Rulebook p. 100)." : ""}</p>
      ${frrRow}${rows}
      <button class="btn" data-act="start" ${ready ? "" : "disabled"}>${started ? "Back to the game" : "Start the game"}</button>
      ${ready ? "" : `<p class="why">To start, pick the Ld of ${missing.length === 1 ? "one more ship" : missing.length + " more ships"}: ${missing.map(i => `<button data-act="seek" data-i="${i}">${esc(unitName(i))}</button>`).join(", ")}</p>`}</div></div>${edgeHandle()}`;
}

/* The roster's cards in their order, squadrons under their heads: the
   player's own and, read-only, the opponent's (peer.js swaps the game in). */
export function rosterRows(){
  const done = {}, out = [];
  appState.U.forEach((x, i) => {
    if(done[i]) return;
    const g = appState.G.grp[i];
    /* a capital squadron, or a mixed escort squadron (builderGroups "e:") */
    if(g && x.R.kind === "ship"){
      const ms = groupUnits(g);
      out.push(renderGroupHead(g, ms));
      ms.forEach(j => { done[j] = 1; out.push(renderRow(j, true)); });
    }else{ done[i] = 1; out.push(renderRow(i, false)); }
  });
  /* A fleet without a commander has no flagship card to carry its re-rolls:
     they get a line of their own at the head of the roster. */
  const frr = fleetRR();
  if(frr) out.unshift(`<section class="row" style="--kd:${factionCols(appState.G.ln, "")[0]};--km:${factionCols(appState.G.ln, "")[1]};padding:6px 8px 6px 10px">
      <div class="r1"><span class="tag">RR</span><div class="name" style="min-height:32px"><b>Fleet re-rolls</b><small style="white-space:normal">${esc(frr.text)} ${MID} Fleets p. ${frr.page}</small></div></div>${rrBoxesHTML(-1)}</section>`);
  return out;
}
export function renderRoster(){
  const fl = appState.G.fleet;
  const toPlay = appState.U.filter((x, i) => x.R.kind === "ship" && !PLAY.destroyed(x.R, appState.G.st[i]) && appState.G.st[i].played < 2).length;
  const vp = vpTotal();
  const out = rosterRows();
  /* launch bays for the attack craft limit (p. 73): every survivor of a
     one-hit squadron, all four quadrants of a star fort and a Ramilies
     doubled (Fleets p. 502) - PLAY.launchBays */
  let baysText = false;
  const bays = !OPT.fleet ? 0 : appState.U.reduce((a, x, i) => {
    if(x.R.kind !== "ship") return a;
    const b = PLAY.launchBays(x.R, appState.G.st[i]);
    if(b.text) baysText = true;
    return a + b.n;
  }, 0);
  /* One line at the top (user 19.10.2026: the bar took two): the turn,
     the view, UNDO and the menu - INFO and the way to the builder are in
     the menu, they are not needed in the middle of a game. */
  const pend = endPending();
  return `<div class="top one">
      <h1>Turn ${fl.turn}${OPT.orders && !fl.mine ? " " + MID + " enemy" : ""}${OPT.orders && fl.orderLock ? `<span class="lock">ORDERS LOCKED</span>` : `<small>${esc(appState.G.ln)}</small>`}</h1>
      ${OPT.fleet ? `<button class="pill ${fl.enemyOrders ? "on" : ""}" data-act="enemy" title="Enemy ships on special orders: +1 Ld (p. 48)">ENEMY+1</button>` : ""}
      ${OPT.fleet && (appState.G.cmd != null || fleetRR()) && !appState.U.some((x, j) => coCmd(j)) ? `<button class="pill ${fl.rerollsLost ? "bad" : fl.rerolls ? "on" : ""}" data-act="pop" data-i="-1" data-arg="rr">RR <b>${fl.rerolls | 0}</b></button>` : ""}
      ${OPT.fleet && (bays || baysText) ? `<button class="pill ${appState.G.ac > bays && !baysText ? "bad" : ""}" data-act="pop" data-i="-1" data-arg="ac">AC <b>${appState.G.ac | 0}</b>/${bays}${baysText ? "+?" : ""}</button>` : ""}
      <div class="tools">
        ${builderTool()}${toolBtn("view", "view", "Compact", { on: appState.V.compact, tip: "Compact rows: hits and criticals of the whole fleet on one screen; the weapons are on the cards" })}
        ${toolBtn("undo", "undo", "Undo", { off: !appState.UNDO.length, tip: "Undo the last tap" })}
        ${toolBtn("menu", "menu", "Menu", { tip: "Victory points, rules text, tracking, fleets, new game" })}
      </div>
    </div>
    ${sidesStrip()}
    ${appState.V.saveErr ? `<p class="note bad" style="margin:8px">This browser would not store the game record; it lives only in this tab.</p>` : ""}
    ${appState.V.pop && appState.V.pop.i === -1 ? renderFleetPop() : ""}
    <div class="main${appState.V.compact ? " compact" : ""}">${out.join("")}</div>${edgeHandle()}
    <div class="bottom">
      ${appState.V.compact ? "" : jumpStrip()}
      <div class="brow">
        <button class="endbtn" data-act="endph" ${pend.n ? "" : "disabled"}>End phase<small>${pend.n ? pend.crits + " to repair" + (pend.fires ? " " + MID + " " + pend.fires + " fire" + (pend.fires > 1 ? "s" : "") : "") : "nothing to repair"}</small></button>
        ${OPT.orders ? `<button class="turnbtn ${fl.mine ? "" : "enemy"}" data-act="${fl.mine ? "endturn" : "newturn"}">${fl.mine ? "End turn " + fl.turn : "Start turn " + (fl.turn + 1)}</button>`
                     : `<button class="turnbtn" data-act="newturn">New turn ${fl.turn + 1}</button>`}
        <div class="pager hide"><button class="ico" data-act="page" data-arg="-1" aria-label="Previous page">&lsaquo;</button><b>1 / 1</b><button class="ico" data-act="page" data-arg="1" aria-label="Next page">&rsaquo;</button></div>
        <div class="vp">${OPT.orders && !fl.mine ? "brace, hits, crits" : toPlay + " to play"}<b>VP ${vp}</b></div>
      </div>
    </div>`;
}



/* Da Ork Clanz, Fleets p. 372 (user 28.10.2026: information only, the
   player adds it - RULINGS.md T40): "Ork escort skwadrons gain a +1 bonus
   to their Leadership while they contain more than five models". */
export function mobChip(n){
  return appState.L0 && appState.L0.clanz && n > 5
    ? `<span class="chip" title="Ork escort skwadrons gain +1 Leadership while they contain more than five models (Fleets p. 372). Add it to the Ld you play with.">mob rule: +1 Ld (${n} ships)</span>` : "";
}
/* Young Gunz, Fleets p. 372: "Any Ork escort skwadron with a Leadership of 5
   or 6 gets a bonus escort ship added for free" - said at set-up, where the
   Ld is picked; the free ship is the player's to add */
export function youngGunzNote(i){
  if(!appState.L0 || !appState.L0.clanz) return "";
  const R = appState.U[i].R, st = appState.G.st[i], g = appState.G.grp[i];
  if(!PLAY.isEscort(R) || (st.ld !== 5 && st.ld !== 6)) return "";
  if(isEscGrp(g) && groupUnits(g)[0] !== i) return "";
  return ` ${MID} <span class="yg" title="Any Ork escort skwadron with a Leadership of 5 or 6 gets a bonus escort ship added for free: any Ork escort class of the list costing no more than the cheapest paid for in the skwadron, ten at most. Young Gunz comes before Mob Rule (Fleets p. 372).">Young Gunz: one free escort (Fleets p. 372)</span>`;
}
/* A squadron's own colour ties its header and its members together. */
/* A squadron's colour: the capital squadrons A, B, C take the first three,
   each escort squadron (a card of its own) the next in the fleet's order. */
export const SQ_COLS = ["var(--sq1)", "var(--sq2)", "var(--sq3)", "var(--sq4)", "var(--sq5)", "var(--sq6)"];
export function sqColor(letter){ return isEscGrp(letter) ? SQ_COLS[(3 + "ABCDEFGHIJKLMNOPQRSTUVWXYZ".indexOf(grpLabel(letter))) % SQ_COLS.length] : SQ_COLS[Math.max(0, "ABC".indexOf(letter))]; }
export function escColor(i){
  const k = appState.U.slice(0, i).filter(x => x.R.kind === "ship" && PLAY.isEscort(x.R)).length;
  return SQ_COLS[(3 + k) % SQ_COLS.length];
}
export function renderGroupHead(letter, ms){
  const units = ms.map(j => ({ R: appState.U[j].R, st: appState.G.st[j] }));
  const names = ms.map(j => unitName(j));
  const st0 = appState.G.st[ms[0]];
  const [kd, km] = factionCols(appState.G.ln, "");
  const from = PLAY.squadronLd(units, appState.G.fleet);
  /* who is still on the table: a member out of action is struck through
     with the reason, a crippled one marked (its values are halved already) */
  const status = PLAY.squadronStatus(units);
  const escG = isEscGrp(letter), lab = grpLabel(letter);
  /* a mixed escort squadron: each card's ships alive, and the total */
  const alive = escG ? ms.map(j => PLAY.alive(appState.G.st[j])) : [];
  const total = escG ? ms.reduce((a, j) => a + (appState.U[j].R.hulls | 0), 0) : 0;
  const members = ms.map((j, k) => {
    const o = status.out.find(x => x.idx === k);
    if(o) return `<s>${esc(names[k])}</s> <i>${o.why}</i>`;
    return esc(names[k]) + (escG ? " " + TIMES + alive[k] : "") + (status.crippled.indexOf(k) >= 0 ? ` <i class="cr">crippled</i>` : "");
  }).join(", ");
  const mob = escG ? mobChip(alive.reduce((a, n) => a + n, 0)) : "";
  return `<section class="row grp-hd${escG ? " esc" : ""}" data-g="${letter}" style="--kd:${kd};--km:${km};--sq:${sqColor(letter)}">
    <div class="r1"><span class="tag grp">SQN ${lab}</span>
      <div class="name"><b>${escG ? "Escort squadron " + lab + " " + TIMES + alive.reduce((a, n) => a + n, 0) + " of " + total : "Squadron " + lab}</b><small>${members}${from.idx != null ? " " + MID + " Ld of " + esc(names[from.idx]) + " (p. 95)" : ""}</small></div>
      ${ldTile(ms[0])}
      <button class="played p${st0.played}" data-act="played" data-i="${ms[0]}">${["TO PLAY", "MOVED", "SHOT"][st0.played]}</button></div>
    ${mob ? `<div class="r3">${mob}</div>` : ""}
    ${appState.V.compact || escG ? "" : squadronTable(units, names)}
    ${OPT.orders && ordChip(st0) ? `<div class="r2">${ordChip(st0)}</div>` : ""}
    ${OPT.orders ? `<div class="r4">
      <button class="brace ${PLAY.braced(st0) ? "on" : ""}" data-act="brace" data-i="${ms[0]}" ${PLAY.canOrder(st0, appState.G.fleet, "BFI") ? "" : "disabled"}>Brace<small>all ${ms.length}</small></button>
      <button class="order ${st0.order && st0.order !== "BFI" ? "on" : ""}" data-act="pop" data-i="${ms[0]}" data-arg="order">${st0.order && st0.order !== "BFI" ? esc(PLAY.ORDER_BY[st0.order].name) : "Order"}<small>squadron</small></button>
    </div>` : ""}
    ${appState.V.pop && ms.indexOf(appState.V.pop.i) >= 0 && /^(ld|order)$/.test(appState.V.pop.kind) && appState.V.sheet == null ? renderPop(appState.V.pop.i) : ""}
  </section>`;
}

/* The squadron's combined fire as the same table the ships use: only the
   systems that add up (weapons batteries' Firepower, lances' Strength,
   p. 99), by arc and range; each ship's value is already its own current
   one (crippled ships halve individually, p. 99). Dice strengths (Ork
   gunz) cannot be added and stay on the ships' own rows. */
export function squadronTable(units, names){
  /* the sum follows the ships: a destroyed, hulked or disengaged member
     is out of it, a silenced weapon (critical) is struck under its row */
  const status = PLAY.squadronStatus(units);
  const who = k => (names && names[k]) || ("ship " + (k + 1));
  const firing = status.out.length ? " " + MID + " " + status.firing.length + " of " + units.length + " firing" : "";
  if(!status.firing.length) return `<p class="foot">No ship left firing: ${status.out.map(o => esc(who(o.idx)) + " " + o.why).join(", ")}.</p>`;
  const all = PLAY.squadronFire(units);
  const SUMS = /^(battery|lance|torpedoes|launch bays|heavy gunz|bombardment cannon)$/;
  const rows = all.filter(r => SUMS.test(r.kind) && (r.total > 0 || (r.silent || []).some(s => typeof s.now === "number")));
  /* a dice strength (Ork gunz) is rolled ship by ship and stays on the
     ships' cards (T13): the table says so rather than dropping it */
  const diceRows = all.filter(r => SUMS.test(r.kind) && !(r.total > 0) && (r.dice || []).length);
  const diceFoot = diceRows.length ? `<p class="foot">Rolled ship by ship, not summed: ${diceRows.map(r => esc(r.kind) + " " + r.dice.map(d => esc(d)).join(", ")).join("; ")} (Fleets p. 362).</p>` : "";
  if(!rows.length) return `<p class="foot">No combined fire: nothing with a number to add (p. 99).${firing}</p>${diceFoot}`;
  const trs = rows.map(r => {
    const name = r.kind === "battery" ? "Weapons batteries" : r.kind === "lance" ? "Lances" : r.kind === "torpedoes" ? "Torpedoes, one salvo" : r.kind === "launch bays" ? "Launch bays, one wave" :
                 r.kind === "heavy gunz" ? "Heavy gunz, 2 hits each (Fleets p. 362)" : "Bombardment cannons";
    const [letter, badge] = wepClass(r.kind === "lance" ? "lance battery" : r.kind === "torpedoes" ? "torpedoes" : r.kind === "launch bays" ? "launch bays" : "weapons battery");
    const nums = r.parts.filter(p => PLAY.num(p.now) != null);
    const half = nums.reduce((a, p) => a + PLAY.half(PLAY.num(p.now)), 0);
    const dice = (r.dice || []).length;
    /* several ranges in one row: what the sum is at each distance */
    const bands = (r.bands || []).length > 1 ? r.bands.map((b, k) => b.total + (k === 0 ? " within " : " to ") + b.range).join(" " + MID + " ") : "";
    /* what a critical took out of this row, struck through, and why */
    const struck = (r.silent || []).filter(s => typeof s.now === "number");
    const lost = struck.length ? (nums.length || bands ? " + " : "") + struck.map(s => `<s>${s.now}</s>`).join(" + ") : "";
    const why = struck.length ? " " + MID + " " + struck.map(s => esc(who(s.ship)) + ": " + esc(String(s.name).toLowerCase()) + " " + esc(s.why)).join("; ") : "";
    return `<tr>
      <td class="bd"><span class="bg" style="--bd:${badge}">${letter}</span></td>
      <td class="nm">${name}<small style="color:var(--card-mute)">${bands ? bands + " cm" : nums.map(p => PLAY.num(p.now)).join(" + ")}${lost}${dice ? " + dice on " + dice + (dice > 1 ? " rows" : " row") : ""}${r.contact ? " " + MID + " base contact (p. 99)" : ""}${why}</small></td>
      <td class="rg">${esc(shortRange(r.range))}</td>
      <td class="st">${r.total}</td>
      <td class="hf">${half}</td>
      <td class="ar">${arcGlyph(r.arc)}</td></tr>`;
  }).join("");
  return `<table class="wt"><thead><tr><th></th><th>Combined fire${firing}</th><th>Range</th><th class="st">Str</th><th class="hf">&frac12;</th><th></th></tr></thead><tbody>${trs}</tbody></table>${diceFoot}`;
}

/* A commander's line on the card of his ship (J233: every commander's). */
export function cmdLine(j){
  const C = appState.U[j].R, ld = C.leadership;
  /* another commander's Leadership is the player's, in the tapped value (T40) */
  const ldTxt = !ld || ld.value == null ? "" : (ld.kind === "fixed" ? "Ld " + ld.value : "+" + ld.value + " Ld") + (j === appState.G.cmd ? "" : " (in the tapped value)");
  return `<div class="cmdl"><span class="tag">CMD</span><b>${esc(unitName(j))}</b><small>${ldTxt}${rrWords(C)}</small>${wlExtra(j)}</div>${rrBoxesHTML(j)}`;
}
/* A ship's own re-rolls on its card: the sentence and the boxes. */
export function shipRRLine(i){
  const rr = appState.U[i].R.rerolls;
  if(!rr) return "";
  /* A star fort with the fleet commander aboard: its re-rolls are his and
     the whole fleet's (J168 b) - the boxes stay here, the words say so. */
  if(PLAY.rerollsJoinFleet(appState.U[i].R, i === appState.G.flag && appState.G.cmd != null))
    return `<div class="cmdl"><span class="tag">RR</span><b>Fleet re-rolls from the fort</b><small>${esc(rr.head || rr.text || "")} \u00b7 commander aboard: any ship may use them (Fleets p. ${rr.joins.page})</small></div>${rrBoxesHTML(i)}`;
  return `<div class="cmdl"><span class="tag">RR</span><b>Ship's own re-rolls</b><small>${esc(rr.head || rr.text || "")}</small></div>${rrBoxesHTML(i)}`;
}
/* Whose re-rolls a box belongs to: the fleet's pool - its commander's, or
   the fleet's own without one (i = -1) - or a further commander's own. */
export function rrPool(i){ return i === -1 || i === appState.G.cmd ? appState.G.fleet : appState.G.st[i]; }
export const RR_WORD = { included: "included", bought: "bought", optional: "option", added: "added" };
export const RR_TIP = { included: "included in the points cost", bought: "bought with the fleet",
                 optional: "an open option of the list, taken into use at the table",
                 added: "added on the counter" };
/* Open options of the list still on offer to this pool: not in the fleet's
   points, and none once the bridge is smashed. */
export function rrOpen(i){
  const pool = rrPool(i), src = i >= 0 ? appState.U[i] && appState.U[i].R.rerolls : fleetRR();
  if(!pool || !src || pool.rerollsLost) return 0;
  return Math.max(0, (src.optional | 0) - PLAY.rerollBoxes(pool).filter(b => b.kind === "optional").length);
}
/* The boxes of one pool (user 5.10.2026): a tap uses that re-roll, a second
   tap gives it back. Dashed ones are the list's open options, not in the
   fleet's points: tapped, one becomes a box of its own. */
export function rrBoxesHTML(i){
  const pool = rrPool(i), src = i >= 0 ? appState.U[i].R.rerolls : fleetRR();
  if(!pool || !src) return "";
  const boxes = PLAY.rerollBoxes(pool);
  const open = rrOpen(i);
  if(!boxes.length && !open) return "";
  const left = boxes.filter(b => !b.used).length;
  /* Abaddon's one comes back every turn (Fleets p. 241). Without the
     orders track the page has no enemy turn to start, so it says who
     brings the box back then. */
  const perTurn = !pool.rerollsPerTurn ? "" : OPT.orders ? " " + MID + " back every turn (Fleets p. 241)"
    : " " + MID + " 1 per turn (Fleets p. 241): back at NEW TURN - tap it back yourself for the enemy's turn";
  const note = pool.rerollsLost ? (i >= 0 && i !== appState.G.cmd ? "lost: his ship's bridge smashed (p. 67)" : "lost: flagship bridge smashed (p. 67)")
    : (left + " of " + boxes.length + " left") + perTurn + (open ? " " + MID + " + open option: tap if bought" : "");
  return `<div class="rrb">${boxes.map((b, k) =>
      `<button class="rrx ${b.kind}${b.used ? " used" : ""}" data-act="rrbox" data-i="${i}" data-arg="${k}" aria-pressed="${b.used}"${b.lost ? " disabled" : ""} aria-label="${esc("Re-roll " + (k + 1) + " of " + boxes.length + ", " + (RR_TIP[b.kind] || "") + ": " + (b.lost ? "lost" : b.used ? "used" : "free"))}" title="${esc(RR_TIP[b.kind] || "")}"><b>RR</b><small>${RR_WORD[b.kind] || ""}</small></button>`).join("")}${
    Array.from({ length: open }, () =>
      `<button class="rrx open" data-act="rropt" data-i="${i}" aria-label="Open option of the fleet list, not in the fleet's points: tap if this re-roll was bought" title="An open option of the fleet list, not in the fleet's points: tap if you bought it"><b>+</b><small>option</small></button>`).join("")}${wl2Box(i)}<span class="rrn">${note}</span></div>`;
}
/* A commander's re-rolls in the builder's own words (DOMAIN.rerollText):
   what the price includes, what was bought, and the book's limit on them. */
export function rrWords(R){ return R.rerolls && R.rerolls.text ? " " + MID + " " + esc(R.rerolls.text) : ""; }
/* A fleet without a commander: its own re-rolls (Necrons p. 406, Demiurg p. 486). */
export function fleetRR(){ return appState.G.cmd == null && appState.L0 && appState.L0.frr ? DOMAIN.fleetRerolls(appState.L0, appState.U.map(x => x.R)) : null; }
/* The wreck: what it is now and what it still does (p. 71 / Fleets p. 425). */
/* The close button's cross: drawn, not the "\u00d7" letter, so it sits in the
   middle of its square whatever the font's metrics. */
export const CLOSE_X = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';
export const ICON = {
  drifting: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 15l4-2 3 2 4-3 3 2 4-2v4H3z"/><path d="M8 13l1-6 3 1-1 5zM14 12l2-5 2 1-2 4z" opacity=".7"/></svg>',
  blazing: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 22c-4 0-7-3-7-7 0-3 2-5 3-7 0 2 1 3 2 3 0-4 2-6 5-8 0 3 1 4 3 6 2 2 3 4 3 6 0 4-3 7-7 7zm0-2c2 0 3-1 3-3 0-1-1-2-2-3 0 1-1 2-2 2 0-2-1-3-1-4-1 1-2 2-2 4 0 2 1 4 4 4z"/></svg>',
  gone: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2l2 5 5-2-2 5 5 2-5 2 2 5-5-2-2 5-2-5-5 2 2-5-5-2 5-2-2-5 5 2z"/></svg>'
};
export function hulkChip(st){
  const kind = st.hulk || (st.destroyed ? "gone" : "");
  const name = st.hulkName || (st.hulk ? PLAY.HULKS[st.hulk] : "DESTROYED");
  return `<span class="chip hulk ${kind}">${ICON[kind] || ""}${esc(name)}</span>`;
}
export function hulkLine(R, st){
  const c = PLAY.catastrophic(R);
  if(!st.hulkName){
    return `<div class="hulkl"><b>OUT OF ACTION</b> ${c.dice ? "roll " + c.dice + " on the " + esc(c.title) + " table (" + (c.fleets ? "Fleets " : "") + "p. " + c.page + ") - tap CATASTROPHIC" : esc(c.rows[0].text)}</div>`;
  }
  /* a hulk's line carries what the table needs: armour, no shields, and
     the roll every attacker forces (p. 71); the full list is under
     CATASTROPHIC */
  const kind = st.hulk || "gone";
  return `<div class="hulkl ${kind}">${ICON[kind] || ""}<span><b>${esc(st.hulkName).toUpperCase()}</b> ${esc(st.hulkText || "")}${st.hulk ? " " + MID + " " + esc(c.hulk.brief) : ""}</span></div>`;
}
export function playedBtn(i){
  const p = appState.G.st[i].played | 0;
  return `<button class="played p${p}" data-act="played" data-i="${i}">${["TO PLAY", "MOVED", "SHOT"][p]}</button>`;
}
/* A star fort's quadrant selector (Fleets p. 501): four buttons, each with
   its own hits left; the selected one is the track, the shields, the
   turrets and the quadrant weapons the card shows, and where the next hit
   or critical goes. The names are the printed card's (RULINGS.md T29). */
export function quadSelector(i, v){
  return `<div class="quads" role="group" aria-label="Quadrant">${v.quads.map(q =>
    `<button class="${q.i === v.quad ? "on" : ""}${q.gone ? " gone" : q.crippled ? " cr" : ""}" data-act="quad" data-i="${i}" data-arg="${q.i}" aria-pressed="${q.i === v.quad}" aria-label="${q.name} quadrant: ${q.gone ? "at 0, an asteroid field" : q.remaining + " of " + q.max + " hits left" + (q.crippled ? ", crippled" : "")}"><b>${q.name}</b><small>${q.gone ? "at 0" : q.remaining + "/" + q.max + (q.crippled ? " crip." : "")}</small></button>`).join("")}</div>`;
}
/* A rule card's steps (R.ruleCard, from the builder): heading and sentence. */
export function ruleSteps(R){
  return `<ul class="steps">${R.ruleCard.steps.map(s => `<li><b>${esc(s.h)}</b>${esc(s.t)}</li>`).join("")}</ul>`;
}
/* What a rule card tracks: orbital mines one box each - ticked when that
   mine has left play, however it went (it then counts for victory points,
   Fleets p. 512); a minefield only its size, rolled at set-up (p. 513). */
export function ruleTrack(i){
  const R = appState.U[i].R, st = appState.G.st[i], rc = R.ruleCard;
  const label = `<p class="noarm">${esc(rc.track.label || "")}</p>`;
  if(!PLAY.tickUnit(R)) return label;
  return `${label}<div class="r3"><div class="hits mem">${st.members.map((m, k) => `<b class="${m.dead ? "on" : ""}" data-act="kill" data-i="${i}" data-arg="${k}" role="button" aria-label="${esc(rc.each)} ${k + 1}">${k + 1}</b>`).join("")}</div>
    <span class="stat">${PLAY.alive(st)} of ${st.members.length} in play</span><span class="stat" title="${esc(PLAY.concededPage(R))}">VP <b>${PLAY.conceded(R, st, 0)}</b></span></div>`;
}
export const ruleCount = R => (R.hulls | 0) + " " + R.ruleCard.each + ((R.hulls | 0) === 1 ? "" : "s");
/* A rule card without a profile (orbital mines Fleets p. 512, minefields
   p. 513): a row of its own - how many were bought, their points, what
   the thing is in one line and what it tracks. The steps are on its card
   (the name opens it), and on the row when INFO is on. */
export function renderRuleRow(i){
  const R = appState.U[i].R, rc = R.ruleCard;
  const [kd, km] = factionCols(appState.G.ln, "");
  return `<section class="row" data-u="${i}" style="--kd:${kd};--km:${km}">
    <div class="r1"><span class="tag">DEF${TIMES}${PLAY.tickUnit(R) ? PLAY.alive(appState.G.st[i]) : (R.hulls | 0)}</span>
      <button class="name" data-act="sheet" data-i="${i}"><b>${esc(unitName(i))}</b><small>${esc(ruleCount(R))} ${MID} ${R.points | 0} pts ${MID} Fleets p. ${rc.page}</small></button></div>
    <p class="lead">${esc(rc.lead || "")}</p>
    ${ruleTrack(i)}
    ${appState.V.info && !appState.V.compact ? ruleSteps(R) : ""}
  </section>`;
}
/* ... and its card: the same, with every step. */
export function renderRuleSheet(i){
  const R = appState.U[i].R, st = appState.G.st[i], rc = R.ruleCard;
  const [kd, km] = factionCols(appState.G.ln, "");
  return `<div class="sheet" style="--kd:${kd};--km:${km}">
    <div class="sh-hd"><div class="t"><h2>${esc(unitName(i))}</h2><p>${esc(ruleCount(R))} | pg. ${rc.page} | ${R.points | 0} pts</p></div><button class="x" data-act="closesheet" aria-label="Close">${CLOSE_X}</button></div>
    <div class="sh-body"><p class="lead">${esc(rc.lead || "")}</p>
      <div class="sec">${ruleTrack(i)}</div>
      <div class="sec"><h3>${esc(rc.title)}<em>Fleets p. ${rc.page}</em></h3>${ruleSteps(R)}</div>
      <button class="btn sec" data-act="closesheet">Back to the fleet</button>
    </div></div>`;
}
export function renderRow(i, inGroup){
  const R = appState.U[i].R, st = appState.G.st[i];
  if(R.kind === "commander"){
    /* aboard a ship the commander rides on that card (J233: every one) */
    if((appState.G.flag != null && i === appState.G.cmd) || (appState.G.on && appState.G.on[i] != null)) return "";
    return `<section class="row" style="--kd:${factionCols(appState.G.ln, "")[0]};--km:${factionCols(appState.G.ln, "")[1]};padding:6px 8px 6px 10px">
      <div class="r1"><span class="tag">CMD</span><div class="name" style="min-height:32px"><b>${esc(unitName(i))}</b><small style="white-space:normal">${esc(R.rerolls && R.rerolls.text || "")}</small></div></div>${rrBoxesHTML(i)}</section>`;
  }
  if(R.kind !== "ship" && R.ruleCard) return renderRuleRow(i);
  if(R.kind !== "ship") return `<section class="row" style="--kd:var(--line);--km:var(--ink-3);padding:6px 8px 6px 10px"><div class="r1"><span class="tag">+</span><div class="name" style="min-height:32px"><b>${esc(unitName(i))}</b><small>fleet entry, ${R.points | 0} pts</small></div></div></section>`;
  const v = PLAY.view(R, st, appState.G.fleet);
  const [kd, km] = factionCols(R.entry ? R.entry.list : appState.G.ln, R.source.faction || "");
  const esq = v.escort;
  const sqc = inGroup ? sqColor(appState.G.grp[i]) : esq ? escColor(i) : null;
  const cls = ["row", esq ? "esc" : "cap", v.crippled ? "crippled" : "", v.destroyed ? "dead" : "", v.destroyed && !esq && !st.hulk && st.hulkName ? "gone" : "", "pl" + st.played, inGroup ? "ingrp" : "", sqc ? "sqd" : ""].join(" ");
  const sub = [R.name ? title(R.className) : "", R.stats.type, esq ? R.hulls + " " + memberWord(R, R.hulls) : (R.points | 0) + " pts"].filter(Boolean).join(" " + MID + " ");
  /* a star fort's chips are the selected quadrant's, and say which */
  const qn = v.fort ? PLAY.QUADS[v.quad] + " " : "";
  const chips = (OPT.orders && !inGroup ? ordChip(st) : "") + (v.crippled ? `<span class="chip crip">${qn}CRIPPLED</span>` : "") +
    (esq && !inGroup ? mobChip(PLAY.alive(st)) : "") +
    (v.quadGone && !v.destroyed ? `<span class="chip crip">${qn}AT 0 ${MID} ASTEROID FIELD</span>` : "") +
    (v.destroyed ? hulkChip(st) : "") +
    critChips(R, st, i) + (st.disengaged ? `<span class="chip">disengaged</span>` : "") +
    (OPT.orders ? (st.braceLock ? `<span class="chip lock">brace locked</span>` : "") + (st.boarding ? `<span class="chip lock">boarding</span>` : "") + (st.noOrdersTurn ? `<span class="chip lock">no fire/orders</span>` : "") : "");
  let r3;
  if(esq){
    /* one box per ship, filled when it is gone (p. 66: one hit or any
       critical destroys an escort) */
    r3 = `<div class="hits mem">${st.members.map((m, k) => `<b class="${m.dead ? "on" : ""}" data-act="kill" data-i="${i}" data-arg="${k}" role="button" aria-label="${memberWord(R, 1)} ${k + 1}">${k + 1}</b>`).join("")}</div>
      <span class="stat">${v.alive} of ${R.hulls}</span>` +
      (OPT.shields ? `<button class="stat ${st.blast ? "off" : ""}" data-act="blast" data-i="${i}" data-arg="${st.blast ? 0 : 1}">UNDER FIRE <b>${st.blast ? "-1 Ld" : "no"}</b></button>` : "");
  }else{
    r3 = hitsTrack(i, v, false) +
      (OPT.shields ? `<button class="stat ${v.shields.now != null && v.shields.up < v.shields.now ? "off" : ""}" data-act="pop" data-i="${i}" data-arg="blast">SH <b>${v.shields.now == null ? esc(v.shields.text) : v.shields.up + "/" + v.shields.now}</b>${st.blast ? "<small>BM " + st.blast + "</small>" : ""}</button>` : "") +
      (OPT.ordnance ? ordnancePills(i, v) : "");
  }
  const orderBtns = !OPT.orders || inGroup ? "" : `<button class="brace ${v.braced ? "on" : ""}" data-act="brace" data-i="${i}" ${PLAY.canOrder(st, appState.G.fleet, "BFI", R) ? "" : "disabled"}>Brace</button>
      <button class="order ${st.order && st.order !== "BFI" ? "on" : ""}" data-act="pop" data-i="${i}" data-arg="order">${st.order && st.order !== "BFI" ? esc(PLAY.ORDER_BY[st.order].name) : "Order"}</button>`;
  /* a star fort's HIT and CRIT go to the selected quadrant; one at 0
     takes no further damage (Fleets p. 501) */
  const critLine = (v.quadGone ? qn + "at 0" : (v.crits.length ? v.crits.length + " active" : "2D6") + (qn && v.crits.length ? " " + qn.trim() : ""));
  /* The compact row (user 19.10.2026): what a hit or a critical needs and
     nothing else - the name, Ld, CRIT, the spec line the enemy asks about
     (armour, shields), the track and the chips. The track takes a hit in
     one tap, so HIT +1 is not repeated; the weapons are on the card (the
     name). Brace and orders stay when they are tracked: they are the enemy
     turn's own taps. */
  const compact = appState.V.compact;
  const boardBtn = R.kind === "ship" ? `<button class="board" data-act="board" data-i="${i}">Board</button>` : "";
  const r4 = v.destroyed ? (esq ? "" : `<div class="r4"><button data-act="pop" data-i="${i}" data-arg="hulk">Catastrophic<small>${cataLabel(R, st)}</small></button></div>`)
    : esq || compact ? (orderBtns || boardBtn ? `<div class="r4">${orderBtns}${boardBtn}</div>` : "") : `<div class="r4">
      <button class="hit" data-act="hit" data-i="${i}" ${v.quadGone ? "disabled" : ""}>Hit<small>${v.quadGone ? qn + "at 0" : "+1" + (qn ? " " + qn.trim() : "")}</small></button>
      ${orderBtns}
      <button class="crit" data-act="pop" data-i="${i}" data-arg="crit" ${v.quadGone ? "disabled" : ""}>Crit<small>${critLine}</small></button>
      ${boardBtn}
    </div>`;
  const r1tail = compact
    ? (v.destroyed ? "" : (inGroup ? "" : ldTile(i, "", true)) + (esq ? "" : `<button class="crit cmini" data-act="pop" data-i="${i}" data-arg="crit" ${v.quadGone ? "disabled" : ""}>Crit<small>${critLine}</small></button>`) + (inGroup ? "" : playedBtn(i, v)))
    : (inGroup || v.destroyed ? "" : ldTile(i) + playedBtn(i, v));
  return `<section class="${cls}" data-u="${i}" style="--kd:${kd};--km:${km}${sqc ? ";--sq:" + sqc : ""}">
    <div class="r1"><span class="tag">${classTag(R)}${esq ? TIMES + v.alive : ""}</span>${inGroup ? `<span class="tag sq" title="Squadron ${grpLabel(appState.G.grp[i])}">SQN ${grpLabel(appState.G.grp[i])}</span>` : ""}${wlTag(i)}
      <button class="name" data-act="sheet" data-i="${i}"><b>${esc(unitName(i))}</b><small>${esc(sub)}</small></button>
      ${r1tail}</div>
    ${upgradeLine(i)}
    ${cmdsAboard(i).map(cmdLine).join("")}${shipRRLine(i)}
    ${v.fort && !v.destroyed ? quadSelector(i, v) : ""}
    ${v.destroyed && !esq ? hulkLine(R, st) : statsLine(v, R, esq)}
    ${v.destroyed && !esq ? "" : compact ? weaponsLine(R, st, esq) : weaponsTable(R, st, esq)}
    ${R.ruleCard && !v.destroyed && !compact ? ruleSteps(R) : ""}
    <div class="r3">${r3}${chips}</div>
    ${r4}
    ${appState.V.pop && appState.V.pop.i === i && appState.V.sheet == null && !(inGroup && /^(ld|order)$/.test(appState.V.pop.kind)) ? renderPop(i) : ""}
  </section>`;
}

export function hitsTrack(i, v, big){
  const max = v.max, at = v.crippledAt;
  let s = `<div class="hits ${max > 16 ? "many" : ""}">`;
  for(let n = 1; n <= max; n++){
    const cr = v.crippledAt && n >= at && v.max > 1;
    s += `<b class="${n <= v.hits ? "on" : ""} ${cr ? "cr" : ""} ${n === at ? "first" : ""}" data-act="dmg" data-i="${i}" data-arg="${n}" role="button" aria-label="hits ${n}">${n}</b>`;
  }
  return s + "</div>";
}


export function renderPop(i){
  const R = appState.U[i].R, st = appState.G.st[i], fl = appState.G.fleet, kind = appState.V.pop.kind;
  const v = PLAY.view(R, st, fl);
  /* the unit's own rule line for a slot ("orders", "blast"), as the builder
     wrote it with its page: the page shows it, it does not retell it */
  const slotRule = slot => { const r = (R.rules || []).find(x => x.slot === slot); return r ? String(r.t).replace(/^\*\s*/, "") : ""; };
  if(kind === "ld"){
    const l = PLAY.leadership(R, st, fl);
    const others = appState.G.grp[i] ? groupUnits(appState.G.grp[i]).filter(j => j !== i) : [];
    /* a Leadership the book fixes (planetary defences Ld 7, Rulebook
       p. 100; the Fortress-Monastery Ld 10, Fleets p. 111) is not rolled:
       no dice tiles, the reason instead */
    const fx = PLAY.fixedLd(R);
    const others2 = others.length ? `<p>Squadron: the highest surviving Leadership counts (p. 95). ${others.map(j => esc(unitName(j)) + " Ld " + (appState.G.st[j].ld == null ? "?" : appState.G.st[j].ld)).join(", ")} ${MID} ${others.map(j => `<button class="chip" data-act="pop" data-i="${j}" data-arg="ld">set ${esc(unitName(j)).slice(0, 12)}</button>`).join(" ")}</p>` : "";
    if(fx) return `<div class="pop"><h4>Leadership ${appState.G.grp[i] ? MID + " " + esc(unitName(i)) + " " : ""}${MID} Ld ${fx.value}, not rolled${fx.page ? " " + MID + " Fleets p. " + fx.page : ""}</h4>
      ${others2}
      <p>${esc(slotRule("orders") || ("Ld " + fx.value + ": " + (fx.note || "fixed") + "."))}</p>
      ${st.ldFrom === "commander" ? `<p>The commander aboard: his own Leadership is used instead (Fleets p. 111).</p>` : ""}
      <button class="close" data-act="closepop">close</button></div>`;
    return `<div class="pop"><h4>Leadership ${appState.G.grp[i] ? MID + " " + esc(unitName(i)) + " " : ""}${MID} rolled ${l.base == null ? "?" : l.base}${st.ldPerm ? " " + MID + " bridge smashed " + st.ldPerm : ""}</h4>
      ${others2}
      <p>${l.base == null ? "Roll a D6 (p. 45): 1 = 6, 2-3 = 7, 4-5 = 8, 6 = 9 - or on the fleet's own table: Ld 5 (Orks, Fleets p. 360) to Ld 10 (Space Marines, Fleets p. 94)." : "Command checks: 2D6 equal to or under Ld; -1 under fire, +1 enemy contacts, never above 10 (p. 48) - count those from the table."}</p>
      ${(() => { const p = ldPlanOf(i); return p && p.roll && st.ld == null ? `<p><button class="chip" data-act="rollone" data-i="${i}">Roll D6</button> on the ${esc(p.table.name)} table (${bookPg(p.table.book, p.table.page)})${p.mods.map(m => `, ${m.v > 0 ? "+" : ""}${m.v} ${esc(m.t)}`).join("")}${st.ldWhy ? ` ${MID} rolled ${esc(st.ldWhy)}` : ""}</p>` : ""; })()}
      <div class="tiles c6">${PLAY.LD_VALUES.map(n => `<button class="${st.ldRoll === n ? "on" : ""}" data-act="ld" data-i="${i}" data-arg="${n}"><b>${n}</b></button>`).join("")}</div>
      ${st.ldFrom === "commander" ? `<p>The commander's Leadership line applies to this flagship: a fixed value stands in for the roll, a bonus is added to it.</p>` : ""}
      <button class="close" data-act="closepop">close</button></div>`;
  }
  if(kind === "blast"){
    return `<div class="pop"><h4>Blast markers touching the base</h4>
      <p>One is placed per hit the shields block (p. 70); each one in contact takes a shield off when fired upon (p. 69), -1 Ld (p. 48) and halves damage-control dice (p. 88). Shields come back when the ship moves clear (p. 70).</p>
      ${slotRule("blast") ? `<p>${esc(slotRule("blast"))}</p>` : ""}
      <div class="steprow"><button data-act="blast" data-i="${i}" data-arg="-1">&minus;</button><div class="val">${st.blast | 0}<small>shields up ${v.shields.up == null ? "-" : v.shields.up + " of " + v.shields.now}</small></div><button data-act="blast" data-i="${i}" data-arg="1">+</button></div>
      <button class="btn sec" data-act="blast" data-i="${i}" data-arg="0">${v.still ? "All removed" : "Moved clear"} ${MID} shields up</button>
      <button class="close" data-act="closepop">close</button></div>`;
  }
  if(kind === "order"){
    const l = appState.G.grp[i] ? PLAY.squadronLd(groupUnits(appState.G.grp[i]).map(j => ({ R: appState.U[j].R, st: appState.G.st[j] })), fl) : PLAY.leadership(R, st, fl);
    /* only the orders this unit may take at all (R.orders): a planetary
       defence Reload Ordnance and Brace (Rulebook p. 100), a star fort and
       a Haven Lock On as well (Fleets p. 503, 111, 334) - its own rule
       line says which and where */
    const tiles = PLAY.ordersFor(R).filter(o => o.id !== "BFI").map(o =>
      `<button class="${st.order === o.id ? "on" : ""}" data-act="order" data-i="${i}" data-arg="${o.id}" ${PLAY.canOrder(st, fl, o.id, R) || st.order === o.id ? "" : "disabled"}>${esc(o.name)}${appState.V.info ? `<small>${esc(o.line)}</small>` : ""}</button>`).join("");
    const only = R.orders ? slotRule("orders") : "";
    return `<div class="pop"><h4>Special orders ${MID} check vs Ld ${l.now == null ? "?" : l.now}</h4>
      <p>${fl.orderLock ? "A check failed this turn: no more orders except Brace (p. 48)." : st.braceTurn ? "Braced: no other orders this turn (p. 47)." : "Tap an order = declared and passed. One per ship or squadron per turn (p. 46, 95)."}</p>
      ${only ? `<p>${esc(only)}</p>` : ""}
      <div class="tiles">${tiles}
        <button class="bad" data-act="orderfail" data-i="${i}" ${fl.orderLock ? "disabled" : ""}>Check failed<small>locks the fleet</small></button>
        <button class="warn" data-act="bracefail" data-i="${i}" ${st.braceLock ? "disabled" : ""}>Brace failed<small>p. 47</small></button>
        ${st.braceLock ? `<button class="ok" data-act="bracelock" data-i="${i}">Attacker done<small>brace again</small></button>` : ""}
        <button class="${st.boarding ? "on" : ""}" data-act="boarding" data-i="${i}">Boarding<small>no fire this turn p. 89</small></button>
        ${v.still ? "" : `<button class="${st.noOrdersTurn ? "on" : ""}" data-act="nofire" data-i="${i}">Disengage failed<small>no fire/orders p. 57</small></button>
        <button class="${st.disengaged ? "on" : ""}" data-act="diseng" data-i="${i}">Disengaged<small>left the table p. 57</small></button>`}
        ${st.order || st.braceTurn ? `<button data-act="clearorder" data-i="${i}">Clear order</button>` : ""}
      </div>
      <button class="close" data-act="closepop">close</button></div>`;
  }
  if(kind === "crit"){
    const cm = R.damage.critical;
    const std = PLAY.standardCrits(R);
    const fl = appState.V.flash && appState.V.flash.i === i && Date.now() - appState.V.flash.t < 1500 ? appState.V.flash : null;
    /* a star fort: the selected quadrant's criticals (Fleets p. 501) */
    const tk = PLAY.track(R, st);
    const cnt = key => (tk.crits && tk.crits[String(key)]) | 0;
    const badge = key => cnt(key) ? `<i class="n">${cnt(key) > 1 ? TIMES + cnt(key) : "on"}</i>` : "";
    const tcls = key => [cnt(key) ? "has" : "", fl && String(fl.key) === String(key) ? "just" : ""].join(" ").trim();
    /* each result: the minus right beside the plus; the minus is disabled
       when there is nothing of it on the ship */
    const minus = key => `<button class="minus" data-act="critminus" data-i="${i}" data-arg="${esc(String(key))}"${cnt(key) ? "" : " disabled"} aria-label="${esc("Take one " + critLabel(R, key) + " off")}">\u2212</button>`;
    const pair = (key, cls, plusAttrs, inner) => `<div class="cp ${cls}">${minus(key)}<button class="plus ${tcls(key)}" ${plusAttrs} aria-label="${esc("Add " + critLabel(R, key))}">${badge(key)}${inner}</button></div>`;
    const tiles = cm.rows.map(r => pair(r[0], cnt(r[0]) ? "has" : "", `data-act="crit" data-i="${i}" data-arg="${esc(String(r[0]))}"`,
      `<b>${esc(String(r[0]))}</b>${esc(r[1])}${r[2] ? `<small>${esc(r[2])}</small>` : ""}`)).join("");
    const wide = (cm.wide || []).map(w => {
      const m = String(w).match(/^(\d+)\s+(.*?)\s*\+D(\d)$/);
      const k0 = String(w).split(" ")[0];
      if(!m) return pair(k0, cnt(k0) ? "has" : "", `data-act="crit" data-i="${i}" data-arg="${esc(k0)}"`, esc(w));
      const open = appState.V.pop.x === m[1];
      return pair(m[1], "warn" + (open ? " on" : "") + (cnt(m[1]) ? " has" : ""), `data-act="critpick" data-i="${i}" data-arg="${open ? "" : m[1]}"`,
        `<b>${m[1]}</b>${esc(m[2])}<small>+D${m[3]}: pick the roll</small>`);
    }).join("");
    /* the D3/D6 for 11 or 12, in place - nothing above it moves */
    let xrow = "";
    if(appState.V.pop.x){
      const n = appState.V.pop.x === "12" ? 6 : 3;
      const bs = []; for(let k = 1; k <= n; k++) bs.push(`<button data-act="critx" data-i="${i}" data-arg="${esc(appState.V.pop.x)}:${k}">+${k}</button>`);
      xrow = `<div class="xrow"><span>${esc(critLabel(R, appState.V.pop.x))}: roll the D${n} and tap the result - the hits go on at once (p. 67)</span>${bs.join("")}<button class="cx" data-act="critpick" data-i="${i}" data-arg="">cancel</button></div>`;
    }
    /* The order is for the finger: the status line (always there, so it
       never pushes anything), then the tiles - each with its own minus, so
       the table itself says what is on the ship (user 30.9.2026: the
       summary list and its REPAIR buttons went). */
    return `<div class="pop"><h4>${esc(cm.title)}${v.fort ? " " + MID + " " + PLAY.QUADS[v.quad] + " quadrant" : ""} ${MID} ${R.damage.triggerHint}</h4>
      <p class="last ${fl ? "fresh" : ""}">${fl ? esc(fl.msg) : (appState.V.flash && appState.V.flash.i === i ? esc(appState.V.flash.msg) : "Tap a result to add it; the table stays open until you close it.")}</p>
      <div class="tiles">${tiles}${wide}</div>
      ${xrow}
      <p>Damage control: <b>${v.repairDice}D6</b> (half with blast markers in contact), each 6 repairs one system or puts out one fire (p. 88).${R.damage.repair ? " " + esc(R.damage.repair) : ""}</p>
      ${appState.V.info && cm.foot ? `<p class="foot">${esc(cm.foot)}</p>` : ""}
      <button class="close" data-act="closepop">close</button></div>`;
  }
  if(kind === "hulk"){
    const c = PLAY.catastrophic(R);
    const tiles = c.rows.map((r, k) => `<button class="${r.kind === "gone" ? "bad" : (st.hulk === r.kind && st.hulkName === r.name ? "on" : "")}" data-act="hulk" data-i="${i}" data-arg="${k}"><b>${esc(r.roll)}</b>${esc(r.name)}<small>${r.extra ? esc(r.extra) + " " + MID + " " : ""}${esc(r.text)}</small></button>`).join("");
    return `<div class="pop cata"><h4>${esc(c.title)}${c.dice ? " " + MID + " roll " + c.dice : ""} ${MID} ${c.fleets ? "Fleets" : "Rulebook"} p. ${c.page}</h4>
      <p>${esc(unitName(i))} ${v.fort ? "has all four quadrants at 0 hits (" + R.stats.hits + " each to start)" : "is at 0 hits (" + R.stats.hits + " to start)"}. ${esc(c.note)}</p>
      <div class="tiles c2">${tiles}
        ${c.boarded ? `<button data-act="hulk" data-i="${i}" data-arg="boarded">Boarded to 0<small>no roll: a drifting hulk (p. 90)</small></button>` : ""}
      </div>
      <p class="hr"><b>While it is a hulk</b></p><ul class="hulkrules">${c.hulk.list.map(t => `<li>${esc(t)}</li>`).join("")}</ul>
      ${c.explode ? `<p class="hr">${esc(c.explode)}</p>` : ""}
      <button class="close" data-act="closepop">close</button></div>`;
  }
  return "";
}

/* The card: the same blocks as the printed one, current values first. */
export function renderSheet(i){
  const R = appState.U[i].R, st = appState.G.st[i], fl = appState.G.fleet;
  if(R.kind !== "ship") return R.ruleCard ? renderRuleSheet(i) : "";
  const v = PLAY.view(R, st, fl);
  const [kd, km] = factionCols(R.entry ? R.entry.list : appState.G.ln, R.source.faction || "");
  const esq = v.escort;
  const sub = [title(R.className), R.source.faction ? title(R.source.faction) : "", R.stats.type, "pg. " + R.source.page, (R.points | 0) + " pts", cmdsAboard(i).length ? cmdsAboard(i).map(unitName).join(", ") + " aboard" : ""].filter(Boolean).join(" | ");
  /* a star fort: the band, the track and the criticals are the selected
     quadrant's (Fleets p. 501) */
  const qn = v.fort ? PLAY.QUADS[v.quad] + " quadrant" : "";
  const band = v.destroyed ? `<div class="band dead">${esq ? (memberWord(R, 2) === "ships" ? "SQUADRON DESTROYED" : "ALL DESTROYED") : hulkLine(R, st)}</div>` :
    v.quadGone ? `<div class="band dead">${esc(qn.toUpperCase())} AT 0 ${MID} it takes no further damage; that quarter of the base is an asteroid field from now on (Fleets p. 501)</div>` :
    (v.crippled ? `<div class="band crip">${qn ? esc(qn.toUpperCase()) + " " : ""}CRIPPLED ${MID} ${esc(crippledNow(R, st))} (${v.fort ? "Fleets p. 501" : "p. 65"})</div>` : "");
  const stat = (label, now, base, extra, tap) => `<div class="${tap ? "tapp" : ""}">${tap ? `<button data-act="pop" data-i="${i}" data-arg="${tap}">` : ""}<span>${label}</span><b>${now}${base != null && String(base) !== String(now) ? `<s>${esc(String(base))}</s>` : ""}${extra ? `<i>${esc(extra)}</i>` : ""}</b>${tap ? "</button>" : ""}</div>`;
  const stats = `<div class="stats">
    ${stat("SPEED", v.speed.now != null ? v.speed.now + " cm" : esc(v.speed.text), v.speed.now != null ? v.speed.base + " cm" : null, v.speed.mods.map(m => m.t).join(", "))}
    ${stat("TURNS", esc(v.turns.text), null, v.turns.none ? "NONE (crit 6)" : "")}
    ${esq || !OPT.shields ? stat("SHIELDS", v.shields.now == null ? esc(v.shields.text) : v.shields.now, v.shields.now == null ? null : v.shields.base, esq ? "per ship" : "")
      : stat("SHIELDS", v.shields.now == null ? esc(v.shields.text) : v.shields.up + "/" + v.shields.now, v.shields.now == null ? null : v.shields.base, st.blast ? "BM " + st.blast + (v.shields.up < v.shields.now ? ": tap when moved clear" : "") : "up", "blast")}
    ${stat("ARMOUR", esc(shortArmour(R.stats.armour)), null, "")}
    ${stat(esc(R.stats.turretLabel || "TURRETS"), v.turrets.now == null ? esc(v.turrets.text) : v.turrets.now, v.turrets.now == null ? null : v.turrets.text, "")}
    ${stat("LEADERSHIP", v.ld.now == null ? "?" : v.ld.now, v.ld.base, v.ld.mods.map(m => (m.v > 0 ? "+" : "") + m.v + " " + m.t).join(", "), "ld")}
  </div>`;
  const cm = R.damage.critical;
  const crits = esq ? "" : `<div class="sec"><h3>Criticals<em>${qn ? qn + " " + MID + " " : ""}${v.crits.length ? v.crits.length + " active" : "none"} ${MID} damage control ${v.repairDice}D6 (p. 88)</em></h3>
    ${v.crits.length ? `<div class="r3">${critChips(R, st, i)}</div>` : ""}
    <div class="r4"><button class="crit" data-act="pop" data-i="${i}" data-arg="crit">Criticals<small>${R.damage.triggerHint}</small></button></div>
    ${appState.V.pop && appState.V.pop.i === i && /^crit/.test(appState.V.pop.kind) ? renderPop(i) : ""}
  </div>`;
  const damage = esq ? `<div class="sec"><h3>Squadron<em>${v.alive} of ${R.hulls} ${MID} ${R.squadron ? "squadron " + R.squadron.min + "-" + R.squadron.max : ""}</em></h3>
      <div class="hits mem">${st.members.map((m, k) => `<b class="${m.dead ? "on" : ""}" data-act="kill" data-i="${i}" data-arg="${k}" role="button">${esc(R.members[k] || String(k + 1))}</b>`).join("")}</div>
      ${OPT.orders ? `<div class="r4"><button class="brace ${v.braced ? "on" : ""}" data-act="brace" data-i="${i}" ${PLAY.canOrder(st, fl, "BFI", R) ? "" : "disabled"}>Brace</button>
        <button class="order ${st.order && st.order !== "BFI" ? "on" : ""}" data-act="pop" data-i="${i}" data-arg="order">${st.order && st.order !== "BFI" ? esc(PLAY.ORDER_BY[st.order].name) : "Order"}</button></div>
      ${appState.V.pop && appState.V.pop.i === i && appState.V.pop.kind === "order" ? renderPop(i) : ""}` : ""}
      <p class="foot">${esc(R.damage.note)} ${MID} VP conceded ${isEscGrp(appState.G.grp[i]) ? "by squadron " + grpLabel(appState.G.grp[i]) + " " + vpOfGroup(i) + " (all its cards, p. 123)" : PLAY.conceded(R, st, cmdPts(i)) + " (" + PLAY.concededPage(R) + ")"}</p></div>`
    : `<div class="sec"><h3>Damage<em>${qn ? qn + " " + MID + " " : ""}${v.hits} of ${v.max} ${MID} crippled from box ${v.crippledAt}</em></h3>
      ${v.destroyed ? "" : hitsTrack(i, v, true)}
      <p class="crline">${esc(R.damage.note)}</p>
      <div class="r4">${v.destroyed ? "" : `<button class="hit" data-act="hit" data-i="${i}" ${v.quadGone ? "disabled" : ""}>Hit<small>${v.quadGone ? "at 0" : "+1"}</small></button>`}
        ${v.destroyed ? `<button data-act="pop" data-i="${i}" data-arg="hulk">Catastrophic<small>${cataLabel(R, st)}</small></button>`
          : OPT.orders ? `<button class="brace ${v.braced ? "on" : ""}" data-act="brace" data-i="${i}" ${PLAY.canOrder(st, fl, "BFI", R) ? "" : "disabled"}>Brace</button>
        <button class="order ${st.order && st.order !== "BFI" ? "on" : ""}" data-act="pop" data-i="${i}" data-arg="order">${st.order && st.order !== "BFI" ? esc(PLAY.ORDER_BY[st.order].name) : "Order"}</button>` : ""}</div>
      ${appState.V.pop && appState.V.pop.i === i && /^(hulk|order)$/.test(appState.V.pop.kind) ? renderPop(i) : ""}
      <p class="foot">${v.boarding.fort ? "Only a space hulk may board it: it defends with " + v.boarding.defend + ", all four quadrants' hits left and this quadrant's turrets (Fleets p. 502)"
        : "Boarding value " + v.boarding.attack + ", defending " + v.boarding.defend + " (p. 89)"} ${MID} VP conceded ${PLAY.conceded(R, st, cmdPts(i))}${cmdPts(i) ? " incl. the commander" : ""} (${PLAY.concededPage(R)})</p></div>`;
  /* a unit that cannot move cannot leave the table either (p. 56: the
     test is made "at the end of its Movement Phase"; p. 101: defences
     "always remain in place"): no disengage switches for it */
  const flagBtns = [
      OPT.ordnance && !esq ? ordnancePills(i, v) : "",
      OPT.shields && esq ? `<button class="${st.blast ? "on bad" : ""}" data-act="blast" data-i="${i}" data-arg="${st.blast ? 0 : 1}">under fire: -1 Ld (p. 48, 95)</button>` : "",
      OPT.orders ? `<button class="${st.boarding ? "on" : ""}" data-act="boarding" data-i="${i}">boarding declared</button>` : "",
      OPT.orders && !v.still ? `<button class="${st.noOrdersTurn ? "on bad" : ""}" data-act="nofire" data-i="${i}">disengage failed</button>` : "",
      OPT.orders && st.braceLock ? `<button class="on bad" data-act="bracelock" data-i="${i}">brace locked: attacker done</button>` : "",
      v.still ? "" : `<button class="${st.disengaged ? "on" : ""}" data-act="diseng" data-i="${i}">disengaged (VP, p. 57)</button>`
    ].join("");
  const flags = flagBtns ? `<div class="sec"><h3>Status</h3><div class="flags">${flagBtns}</div></div>` : "";
  const rules = R.rules.slice();
  if(R.damage.trigger) rules.push({ t: R.damage.trigger, ast: false, refs: [] });
  if(R.damage.repair) rules.push({ t: R.damage.repair, ast: false, refs: [] });
  /* the orders this unit may take at all (R.orders; its own rule line
     above says which and where) */
  const info = !appState.V.info ? "" : `<div class="sec"><h3>Special rules</h3><ul class="rules">${rules.map(r => `<li>${starHTML(r.refs)}${esc(r.t.replace(/^\*\s*/, ""))}</li>`).join("")}</ul></div>
    ${!esq ? `<div class="sec"><h3>${esc(cm.title)}<em>${R.damage.triggerHint}</em></h3><table class="crtab">${cm.rows.map(r => `<tr><td>${esc(String(r[0]))}</td><td>${esc(r[1])}</td><td>${esc(r[2] || "")}</td></tr>`).join("")}${(cm.wide || []).map(w => `<tr><td colspan="3">${esc(w)}</td></tr>`).join("")}</table><p class="foot">${esc(cm.foot || "")}</p></div>` : ""}
    <div class="sec"><h3>Special orders<em>${R.orders ? "the only ones this unit may take " + MID + " " : ""}p. 46-48, tracked with dice on the table</em></h3><table class="ordtab">${PLAY.ordersFor(R).map(o => `<tr><td>${esc(o.name)}</td><td>${esc(o.line)} (p. ${o.page})</td></tr>`).join("")}</table>
      <p class="foot">Command check: 2D6 equal to or under Ld. -1 under fire (blast markers), +1 enemy contacts (enemy on orders). 11 or 12 always fails. One failure ends the fleet's orders this turn, Brace excepted (p. 48).</p></div>`;
  /* a ship that is a rule (the fire ship, Fleets p. 516): its steps are
     its armament, always on the card */
  const ruleSec = R.ruleCard ? `<div class="sec"><h3>${esc(R.ruleCard.title)}<em>Fleets p. ${R.ruleCard.page}</em></h3><p class="lead">${esc(R.ruleCard.lead || "")}</p>${ruleSteps(R)}</div>` : "";
  return `<div class="sheet" style="--kd:${kd};--km:${km}">
    <div class="sh-hd"><div class="t"><h2>${esc(unitName(i))}</h2><p>${esc(sub)}</p></div>${ldTile(i)}<button class="x" data-act="closesheet" aria-label="Close">${CLOSE_X}</button></div>
    <div class="sh-body">${band}${upgradeLine(i)}${cmdsAboard(i).map(cmdLine).join("")}${shipRRLine(i)}${v.fort && !v.destroyed ? quadSelector(i, v) : ""}${stats}${preLine(i)}
      ${appState.V.pop && appState.V.pop.i === i && /^(ld|blast)$/.test(appState.V.pop.kind) ? renderPop(i) : ""}
      <div class="sec"><h3>Armament<em>Str as printed ${MID} &frac12; when halved</em></h3>${weaponsTable(R, st, esq)}</div>
      ${ruleSec}${damage}${crits}${flags}${info}
      <button class="btn sec" data-act="closesheet">Back to the fleet</button>
    </div></div>`;
}

/* The menu (J235, user 25.10.2026: "rethink the play menu so it is simpler.
   bloat!" and the game report gone: "no reporting at all"). One screen: the
   victory points in one line with the ships
   behind it, the two switches, tracking as one switch with its parts behind
   a tap, the fleet list and a new game. The way to the builder is in the
   top bar, always. A fold keeps its state over the taps (V.menuOpen). */
export function renderMenu(){
  /* every row that can concede points: ships, and orbital mines bought one
     by one (Fleets p. 512) */
  const rows = appState.U.map((x, i) => x.R.kind === "ship" || PLAY.tickUnit(x.R) ? `<tr><td>${esc(unitName(i))}${cmdPts(i) ? " + " + esc(cmdsAboard(i).map(unitName).join(", ")) : ""}${appState.G.st[i].disengaged ? " (disengaged)" : ""}${isEscGrp(appState.G.grp[i]) ? " (squadron " + grpLabel(appState.G.grp[i]) + ")" : ""}</td><td>${vpOf(i)}</td></tr>` : "").join("");
  const vp = vpTotal(), mo = appState.V.menuOpen || {};
  const nec = appState.U.some(u => u.R && u.R.source && /NECRON/i.test(String(u.R.source.faction || ""))) ? "; Necrons Fleets p. 404" : "";
  const all = TRACK.every(t => OPT[t[0]]), some = TRACK.some(t => OPT[t[0]]);
  return `<div class="menu" data-act="menu"><div class="box">
    <div class="mhd"><h2>Menu</h2><button class="x" data-act="menu" aria-label="Close the menu">${CLOSE_X}</button></div>
    <p class="foot">${esc(appState.G.ln)} ${MID} ${appState.G.limit} pts ${MID} turn ${appState.G.fleet.turn}</p>
    <details data-keep="vp"${mo.vp ? " open" : ""}><summary>Victory points conceded<b>${vp}</b></summary><table>${rows}</table><p class="foot" style="margin:0 12px 8px">Each ship with any commander aboard (p. 123${nec}).</p></details>
    ${OPT.fleet ? `<div class="steprow" style="margin:8px 0"><button data-act="rad" data-i="-1" data-arg="-1">&minus;</button><div class="val">${appState.G.fleet.radiation | 0}<small>radiation burst: -Ld this turn (p. 115)</small></div><button data-act="rad" data-i="-1" data-arg="1">+</button></div>` : ""}
    <div class="togs">
      <button class="${appState.V.info ? "on" : ""}" data-act="info">Rules text on the cards<i>${appState.V.info ? "on" : "off"}</i></button>
      <button class="${wakeOff() || !wakeCan() ? "" : "on"}" data-act="wake" ${wakeCan() ? "" : "disabled"}>Keep the screen on<i>${!wakeCan() ? "n/a" : wakeOff() ? "off" : "on"}</i></button>
      <button class="${all ? "on" : ""}" data-act="track" data-arg="all">Track the table's tokens<i>${all ? "on" : some ? "some" : "off"}</i></button>
    </div>
    <details data-keep="track"${mo.track ? " open" : ""}><summary>Choose what to track</summary><div class="togs">
      ${TRACK.map(t => `<button class="${OPT[t[0]] ? "on" : ""}" data-act="track" data-arg="${t[0]}">${esc(t[1])}<i>${OPT[t[0]] ? "on" : "off"}</i><small>${esc(t[2])}</small></button>`).join("")}
    </div></details>
    <button class="btn sec" data-act="setupback">Set-up<small>Leadership, squadrons, the opponent's room ${MID} the game stays</small></button>
    <button class="btn sec" data-act="peerpanel">Opponent's fleet<small>${esc(peerMenuWord())}</small></button>
    <button class="btn sec" data-act="fleets">Fleets and phone link<small>the game stays: Resume on the list</small></button>
    <button class="btn warn" data-act="newgame">New game (forget this record)</button>
    <p class="foot">Saved in this browser only ${MID} ${PLAY_VERSION}</p>
  </div></div>`;
}
/* a fold in the menu keeps its state when the menu is drawn again */
document.addEventListener("toggle", ev => {
  const d = ev.target, k = d && d.getAttribute && d.getAttribute("data-keep");
  if(!k) return;
  appState.V.menuOpen = appState.V.menuOpen || {};
  appState.V.menuOpen[k] = !!d.open;
}, true);

