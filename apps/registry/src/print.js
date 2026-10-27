import { $ } from "./boot.js";
import { resolveUnit, unitCards } from "./cards.js";
import { L, isUpgradeEnt, total } from "./model.js";
import { fitCards } from "./rule-card.js";
import { KEY } from "./save.js";
import { appState } from "./state.js";
import { fleetResolved, isEscort, shipCall } from "./validation.js";
import { render } from "./view.js";
import { warlordIdx, warlordSkwadrons } from "./warlords.js";
import { DATA, LISTS, SHIPS } from "../../../packages/ui/catalog.js";
import { esc, listLineOf, title } from "../../../packages/ui/format.js";
import DOMAIN from "../../../packages/rules/domain.js";

/* ---------------------------------------------------------- print setup ----
   Paper and card size (user 13.10.2026, after a player's report that Letter
   paper came out as "lots of mostly empty sheets": the sheet was an A4 page
   297 mm tall on paper 279 mm tall). 100 % is the card as designed, 144 x
   135 mm; the size the player sets decides the rest. As many cards go on a
   sheet as fit at that size, the sheet turns on its side when that holds
   more - and always for a single card, which is how the largest one fits -
   and the size stops where one card fills the paper. PR_EDGE is the strip a
   desktop printer cannot print, kept clear on every side; PR_GAP the cut
   between two cards; PR_HEAD the sheet's heading line, which is left out
   when it would cost a row of cards.
   A4 at 100 % is the format every card was laid out, measured and proofed
   in, and it keeps its own fixed sheet below - not one millimetre of it
   comes from here. The setting is this browser's (the printer is), under a
   key of its own, and each paper remembers its own size. */
export const PAPERS = { A4: [210, 297], Letter: [215.9, 279.4] };
export const CARD_W = 144, CARD_H = 135, PR_EDGE = 6, PR_GAP = 3, PR_HEAD = 5, PR_MIN = 50;
export const PRINT_KEY = KEY + "-print";
export let PRINT = { paper: "A4", pct: {} };
try{
  const p = JSON.parse(localStorage.getItem(PRINT_KEY));
  if(p && typeof p === "object" && PAPERS[p.paper])
    PRINT = { paper: p.paper, pct: p.pct && typeof p.pct === "object" && !Array.isArray(p.pct) ? p.pct : {} };
}catch(e){}
export function printLayout(paper, pct){
  const P = PAPERS[paper] || PAPERS.A4, s = pct / 100, cw = CARD_W * s, ch = CARD_H * s;
  const on = (W, H, land) => {
    const cols = Math.max(0, Math.floor((W - 2 * PR_EDGE + PR_GAP) / (cw + PR_GAP)));
    const rowsAt = head => Math.max(0, Math.floor((H - 2 * PR_EDGE - head + PR_GAP) / (ch + PR_GAP)));
    const head = rowsAt(PR_HEAD) === rowsAt(0) ? PR_HEAD : 0, rows = rowsAt(head);
    return { W: W, H: H, land: land, cols: cols, rows: rows, n: cols * rows, head: head };
  };
  const up = on(P[0], P[1], false), side = on(P[1], P[0], true);
  const lay = side.n > up.n || (side.n === 1 && up.n === 1) ? side : up;
  const bw = lay.cols * cw + (lay.cols - 1) * PR_GAP, bh = lay.rows * ch + (lay.rows - 1) * PR_GAP;
  return Object.assign(lay, { paper: PAPERS[paper] ? paper : "A4", pct: pct, s: s, cw: cw, ch: ch,
    x0: (lay.W - bw) / 2, y0: PR_EDGE + lay.head + (lay.H - 2 * PR_EDGE - lay.head - bh) / 2 });
}
/* The largest size at which one card still fits the paper, whole per cent. */
export function printMaxPct(paper){
  const P = PAPERS[paper] || PAPERS.A4, a = P[0] - 2 * PR_EDGE, b = P[1] - 2 * PR_EDGE;
  return Math.floor(100 * Math.max(Math.min(a / CARD_W, b / CARD_H), Math.min(b / CARD_W, a / CARD_H)));
}
/* The largest size at which n cards still go on one sheet. */
export function printFitPct(paper, n){
  for(let p = printMaxPct(paper); p > PR_MIN; p--) if(printLayout(paper, p).n >= n) return p;
  return PR_MIN;
}
/* The size in use: what the player set for this paper, or the card as
   designed - made no larger than two to a sheet allows, which on Letter is
   a few per cent under. */
export function printPct(){
  const v = Math.round(+PRINT.pct[PRINT.paper]);
  return v >= PR_MIN ? Math.min(v, printMaxPct(PRINT.paper)) : Math.min(100, printFitPct(PRINT.paper, 2));
}
export function setPrint(paper, pct){
  if(paper && PAPERS[paper]) PRINT.paper = paper;
  if(pct != null)
    PRINT.pct[PRINT.paper] = Math.max(PR_MIN, Math.min(printMaxPct(PRINT.paper), Math.round(+pct) || 100));
  try{ localStorage.setItem(PRINT_KEY, JSON.stringify(PRINT)); }catch(e){}
  renderPrintSetup();
}
export function renderPrintSetup(){
  const paper = PRINT.paper, pct = printPct(), lay = printLayout(paper, pct), mm = v => Math.round(v);
  $("#printsum").innerHTML = paper + " &middot; " + pct + " %";
  $("#ppaper").value = paper;
  const sc = $("#pscale"); sc.max = printMaxPct(paper); sc.value = pct;
  $("#pdesc").innerHTML = lay.n + " per sheet, " + (lay.land ? "landscape" : "portrait") +
    " &middot; card " + mm(lay.cw) + " &times; " + mm(lay.ch) + " mm";
  /* 4.2 pt is the smallest print a card is allowed at 100 % (layout_check). */
  $("#pnote").innerHTML = "100 % is the card as designed, 144 &times; 135 mm; " + PR_MIN + "&ndash;" + printMaxPct(paper) +
    " % fits this paper. Print at actual size (100 %, no &ldquo;fit to page&rdquo;): the size is already in the sheet, " +
    "and a " + PR_EDGE + " mm edge is left clear for the printer." +
    (pct < 100 ? " At " + pct + " % the smallest print is about " + (4.2 * pct / 100).toFixed(1) + " pt." : "");
}

/* The page rule for the sheet about to print. It goes at the END of the body:
   the stylesheet with the fixed "A4 portrait, margin 0" rule stands in the
   body, and a rule put in the head came before it and lost. Nothing showed
   while every sheet was A4 portrait with no margin - except the roster, whose
   14 mm margin never applied and whose table printed to the paper's edge
   (found 13.10.2026 by printing to PDF and measuring). Download for editing
   copies the styles in document order, so the rule is last there too. */
export function setPage(portrait, margin = "0"){
  let st = document.getElementById("pagecss");
  if(!st){ st = document.createElement("style"); st.id = "pagecss"; document.body.appendChild(st); }
  st.textContent = "@page{size:" + PRINT.paper + " " + (portrait ? "portrait" : "landscape") + ";margin:" + margin + "}";
}
/* fitCards at the card's own size, whatever size the sheet prints at (see
   .nat in the stylesheet). */
export function fitSheet(){
  const sheet = $("#sheet");
  if(sheet.classList) sheet.classList.add("nat");
  fitCards();
  if(sheet.classList) sheet.classList.remove("nat");
}

/* Sheet building is kept separate from printing so that Download for editing
   gets exactly the same output rather than a variant of its own. */
/* The sheet's pages: two card slots each, top and bottom. Which units have a
   card, and how many, is unitCards()'s answer - ships, commanders (no hull,
   but a card of their own) and rule rows; a unit without a card takes no
   slot. A star fort's two cards are one page, the plan above its rules, so
   the pair is read together and cut apart last. A single card that is
   waiting for a partner when a fort comes along keeps its page open: the
   next single card fills it, and no half page is left blank unless the
   number of single cards is odd. Pages keep the order in which they were
   opened, which is the fleet's order. */
export function cardSheetPages(units){
  const pages = [];
  let open = -1;
  units.forEach(u => {
    const cs = unitCards(u);
    if(cs.length === 1){
      if(open >= 0){ pages[open].push(cs[0]); open = -1; }
      else{ pages.push([cs[0]]); open = pages.length - 1; }
    }else{
      for(let i = 0; i < cs.length; i += 2) pages.push(cs.slice(i, i + 2));
    }
  });
  return pages;
}
/* The same for a sheet of n slots (print setup): a unit's cards go on the
   first page that still has room for all of them, so a fort's pair stays on
   one sheet and a single card fills the gap another left. With two slots
   this is cardSheetPages; with one, every card has its own sheet. */
export function cardSheetPagesN(units, n){
  const pages = [];
  units.forEach(u => {
    const cs = unitCards(u);
    if(!cs.length) return;
    if(cs.length > n){ for(let i = 0; i < cs.length; i += n) pages.push(cs.slice(i, i + n)); return; }
    let pg = pages.find(p => p.length + cs.length <= n);
    if(!pg){ pg = []; pages.push(pg); }
    cs.forEach(c => pg.push(c));
  });
  return pages;
}
export function buildCardSheet(){
  const paper = PRINT.paper, pct = printPct();
  /* A4 at 100 %: the fixed sheet, exactly as it has always printed. */
  const stock = paper === "A4" && pct === 100;
  const lay = stock ? null : printLayout(paper, pct);
  const pages = stock ? cardSheetPages(appState.S.units) : cardSheetPagesN(appState.S.units, lay.n);
  if(!pages.length){ alert("Add at least one unit first."); return 0; }
  let html = "";
  if(stock) pages.forEach((pg, i) => {
    html += `<div class="page">
      <div class="pghead"><b>${esc(L().nm)} &ndash; fleet cards</b>
        <i>${esc(DATA.src)}</i>
        <span class="rt">2 cards / A4 | 144 x 135 mm | print 100 % | page ${i + 1}/${pages.length}</span></div>
      ${pg[0].html("top")}
      ${pg[1] ? pg[1].html("bot") : ""}</div>`;
  });
  else pages.forEach((pg, i) => {
    const mm = v => v.toFixed(2) + "mm";
    html += `<div class="page ps" style="width:${lay.W}mm;height:${lay.H}mm;--ps:${lay.s}">
      ${lay.head ? `<div class="pghead"><b>${esc(L().nm)} &ndash; fleet cards</b>
        <i>${esc(DATA.src)}</i>
        <span class="rt">${lay.n} card${lay.n > 1 ? "s" : ""} / ${paper} ${lay.land ? "landscape" : "portrait"} | ${
          Math.round(lay.cw)} x ${Math.round(lay.ch)} mm (${pct} %) | print 100 % | page ${i + 1}/${pages.length}</span></div>` : ""}
      ${pg.map((c, k) => `<div class="slot" style="left:${mm(lay.x0 + (k % lay.cols) * (lay.cw + PR_GAP))};top:${
        mm(lay.y0 + Math.floor(k / lay.cols) * (lay.ch + PR_GAP))};width:${mm(lay.cw)};height:${mm(lay.ch)}">${
        c.html("top")}</div>`).join("")}</div>`;
  });
  setPage(stock || !lay.land);
  $("#sheet").innerHTML = html;
  fitSheet();
  return pages.reduce((a, pg) => a + pg.length, 0);
}

/* The card fonts are embedded and load on first use. A fit made before they
   arrive measures the fallback font, and the real one then runs past the
   boxes on paper - so the sheet is fitted again once the fonts are in. */
export async function printCards(){
  if(!buildCardSheet()) return;
  if(document.fonts && document.fonts.ready){ await document.fonts.ready; fitSheet(); }
  window.print();
}

/* Developer regression run: ?layout-audit=1 renders every profile with the
   real card CSS, runs the same fitting as Print cards, and stores a compact
   result in the body[data-layout-audit] attribute. It neither prints nor
   changes the saved fleet. */
export async function auditAllCardLayouts(){
  const saved = JSON.parse(JSON.stringify(appState.S));
  const chunks = [];
  let cards = 0;
  LISTS.forEach((fleet, li) => {
    appState.S.li = li; appState.S.limit = 100000; appState.S.units = [];
    fleet.secs.forEach((sec, si) => sec.ents.forEach((en, ei) => {
      /* Every row with a profile, and every row without one that still
         prints a card (the rule cards: orbital mine, minefield). A row
         bought by the piece is audited at three. */
      if(isUpgradeEnt(en) || en.k === "cmd" || (en.r && !SHIPS[String(en.r)])) return;
      const u = {s:si,e:ei,ref:en.r || null,n:1,opts:[],os:{},name:""};
      if(isEscort(u) || (!en.r && en.cnt)) u.n = 3;
      if(!en.r && !unitCards(u).length) return;
      appState.S.units.push(u);
    }));
    /* the sheet's own paging: a fort's two cards on one page */
    const pgs = cardSheetPages(appState.S.units);
    pgs.forEach(pg => {
      chunks.push(`<div class="page" data-audit-fleet="${esc(fleet.nm)}">
        ${pg[0].html("top")}
        ${pg[1] ? pg[1].html("bot") : ""}</div>`);
    });
    cards += pgs.reduce((a, pg) => a + pg.length, 0);
  });
  setPage(true);
  $("#sheet").innerHTML = chunks.join("");
  if(document.fonts && document.fonts.ready) await document.fonts.ready;
  fitCards();
  const rows = [...document.querySelectorAll("#sheet .k")].map(card => ({
    fleet: card.closest(".page").dataset.auditFleet,
    name: card.querySelector(".k-hd h3").textContent,
    options: +(card.dataset.optionCount || 0),
    optionScale: +(card.dataset.optionScale || 1),
    cardScale: +(card.dataset.cardScale || 1),
    overflow: card.dataset.contentOverflow === "true",
    zoneScale: Math.min(...[...card.querySelectorAll(".fit-content")]
      .map(zone => +(zone.dataset.fitScale || 1)))
  }));
  const summary = {
    lists: LISTS.length, cards,
    overflows: rows.filter(row => row.overflow).length,
    minOptionScale: Math.min(...rows.map(row => row.optionScale)),
    minZoneScale: Math.min(...rows.map(row => row.zoneScale)),
    minCardScale: Math.min(...rows.map(row => row.cardScale)),
    worst: rows.sort((a,b) => a.optionScale - b.optionScale).slice(0,8)
  };
  document.body.dataset.layoutAudit = JSON.stringify(summary);
  appState.S = saved; render();
  return summary;
}

/* Screen view of a single profile for visual QA, e.g. ?card-audit=432. It
   does not affect normal use or printing. */
export async function auditOneCard(ref){
  let picked = null;
  LISTS.some((fleet, li) => fleet.secs.some((sec, si) => sec.ents.some((en, ei) => {
    if(String(en.r || "") !== String(ref) || !SHIPS[String(en.r)]) return false;
    picked = {fleet, li, si, ei, en}; return true;
  })));
  if(!picked) throw new Error("Unknown card profile " + ref);
  const saved = JSON.parse(JSON.stringify(appState.S));
  appState.S.li = picked.li;
  const u = {s:picked.si,e:picked.ei,ref:picked.en.r,n:1,opts:[],os:{},name:""};
  if(isEscort(u)) u.n = 3;
  document.body.classList.add("card-audit");
  /* all of the unit's cards: a star fort shows its plan above its rules */
  const cs = unitCards(u);
  $("#sheet").innerHTML = `<div class="page"><div class="pghead"><b>${esc(picked.fleet.nm)}</b>
    <i>${esc(DATA.src)}</i><span class="rt">visual QA | ${esc(String(ref))}</span></div>
    ${cs[0] ? cs[0].html("top") : ""}${cs[1] ? cs[1].html("bot") : ""}</div>`;
  if(document.fonts && document.fonts.ready) await document.fonts.ready;
  fitCards();
  appState.S = saved;
}

/* One roster row from the resolved unit (P1-8d). */
export function rosterRowOf(R){
  const opts = R.options.filter(o => o.state === "take").map(o => o.text);
  /* Fleet-list upgrades are paid for in the unit's points, so leaving them
     out made the line unexplainable: a Master of the Fleet with two
     re-rolls read as a plain 100 pts, and an Honour Guard as a battle barge
     that costs 435. */
  R.upgrades.forEach(up => { if(up.state === "take") opts.push(title(up.label)); });
  if((R.note||"").trim()) opts.push(R.note.trim());
  /* a commander's re-rolls, included ones named as such (user 5.10.2026) */
  if(R.kind === "commander" && R.rerolls && R.rerolls.text) opts.unshift(R.rerolls.text);
  return `<tr><td>${esc(R.name)}</td>
      <td>${esc(title(R.className))}${R.hulls > 1 ? " \u00d7 " + R.hulls : ""}
        ${opts.length ? `<br><span style="font-size:7.5pt;color:#555">${esc(opts.join(" \u00b7 "))}</span>` : ""}</td>
      <td>${R.stats ? R.stats.type : R.defence ? "Defence" : "option"}</td><td class="n">${R.stats ? (R.stats.hits||"\u2013") : "\u2013"}</td>
      <td class="n">${R.points}</td></tr>`;
}
/* Commanders and fleet options until P1-8e. */

/* Boxes to cross off on the roster, for re-rolls that have no card of
   their own: solid = the fleet's, dashed = an open option (if bought). */
export function rosterBoxes(boxes){
  return (boxes || []).map(k => `<span style="display:inline-block;width:4mm;height:4mm;margin-left:1.2mm;vertical-align:-1mm;border:.9pt ${
    k === "optional" ? "dashed #777" : "solid #222"};${k === "bought" ? "background:#F4EBD0" : ""}" title="${k}"></span>`).join("");
}
export function printRoster(){
  const Rs = appState.S.units.map(u => resolveUnit(u));
  /* a fleet without a commander: its own re-rolls are a line of the roster,
     as they are of the Copy list (Necrons p. 404, Demiurg p. 486, Tyranid
     Hive Mind Influence p. 430) */
  const frr = DOMAIN.fleetRerolls(L(), Rs);
  const frrRow = !frr ? "" : `<tr><td></td><td>Fleet re-rolls: ${esc(frr.text)} (Fleets p. ${frr.page})${rosterBoxes(frr.boxes)}${
    frr.optional ? `<br><span style="font-size:7.5pt;color:#555">dashed = only if bought</span>` : ""}</td><td>fleet</td><td class="n">\u2013</td><td class="n"></td></tr>`;
  const rows = Rs.map(R => rosterRowOf(R)).join("") + frrRow;
  const RF = fleetResolved(), cs = RF.checks, fs = RF.facts || [];
  /* The roster may run onto as many A4 pages as it needs. The page's own
     print margin protects the continuation pages too; the table header
     repeats. */
  setPage(true, "14mm");
  $("#sheet").innerHTML = `<div class="rost">
    <h1>${esc(L().nm)}</h1>
    <p class="sub">${total()} / ${appState.S.limit|0} pts \u00b7 ${appState.S.units.length} units \u00b7
      ${fleetResolved().totals.hulls} hulls \u00b7 ${esc(DATA.src)}</p>
    <table><thead><tr><th>Name</th><th>Class &amp; options</th><th>Type</th><th>Hits</th><th>Pts</th></tr></thead>
      <tbody>${rows}
      <tr class="tot"><td colspan="4">Total</td><td class="n">${total()}</td></tr></tbody></table>
    <div class="rules"><h4>Legality checks</h4><ul>${cs.map(c =>
      /* An advisory row (ok, but flagged) is not a rule that was passed:
         the one-third allowance for planetary defences (Fleets p. 498) binds
         the defender of a scenario, and the builder does not know the
         scenario. It prints as a note, as the builder's panel shows it. */
      `<li>${c.ok ? (c.warn ? "NOTE" : "PASS") : "FAIL"} \u2014 ${esc(c.t)} (${esc(c.v)}): ${esc(c.s)}</li>`).join("")}</ul>
      ${fs.length ? `<h4>Fleet facts</h4><ul>${fs.map(f =>
        `<li>${esc(f.t)}: <b>${esc(f.v)}</b> \u2014 ${esc(f.s)}</li>`).join("")}</ul>` : ""}
      <p>Rules that could not be machine-checked are listed in the builder under each
      section and remain the player's responsibility.</p></div>
  </div>`;
  window.print();
}

/* Commanders and fleet options until P1-8e. */

export function listText(){
  const lines = [L().nm + " \u2014 " + total() + "/" + (appState.S.limit|0) + " pts", ""];
  const Rs = appState.S.units.map(u => resolveUnit(u));
  Rs.forEach(R => { lines.push(listLineOf(R)); });
  /* a fleet without a commander: its own re-roll (Necrons p. 404, Demiurg p. 486) */
  const frr = DOMAIN.fleetRerolls(L(), Rs);
  if(frr) lines.push("\u2022 Fleet re-rolls: " + frr.text + " (Fleets p. " + frr.page + ")");
  const RF = fleetResolved();
  /* Aboard (J215): a commander's line names his ship */
  (RF.aboard || []).forEach(a => {
    if(a.ship == null || lines[a.unit + 2] == null) return;
    const ln = lines[a.unit + 2].split("\n");
    ln[0] += " \u00b7 aboard " + shipCall(RF.units[a.ship]);
    lines[a.unit + 2] = ln.join("\n");
  });
  /* Da Ork Clanz: the list is read by its commands, so the copy says them -
     each Warlord with his clan, re-rolls, ship and points, then his
     skwadrons with their ships (ChatGPT audit UX-03: a flat list could not
     show which kroozers were one big ship skwadron, or whose they were) */
  const ws = warlordIdx(RF);
  const SKW_NAME = { tiddla: "Tiddla skwadron", kroozer: "Big ship skwadron", uge: "'Uge ship skwadron", rok: "Rok skwadron", hulk: "Space Hulk" };
  if(ws.length){
    const ind = (s, pad) => s.split("\n").map(l => pad + l).join("\n");
    const done = new Set();
    const body = [];
    ws.forEach((wi, k) => {
      const W = (RF.warlords || []).filter(x => x.unit === wi)[0] || {};
      const own = appState.S.units[wi].clan || ((W.clans || []).length === 1 ? W.clans[0] : "");
      const pts = [wi].concat(W.units || []).reduce((a, i) => a + (Rs[i] ? Rs[i].points : 0), 0);
      const ab = (RF.aboard || []).filter(a => a.unit === wi)[0];
      body.push("", ["Warlord " + (k + 1), own, Rs[wi].rerolls && Rs[wi].rerolls.text,
        ab && ab.ship != null ? "aboard " + shipCall(RF.units[ab.ship]) : "", pts + " pts"].filter(Boolean).join(" \u2014 "));
      body.push(ind(lines[wi + 2], "  ")); done.add(wi);
      warlordSkwadrons(RF, wi).forEach(g => {
        body.push("  " + SKW_NAME[g.kind] + (g.tag ? " " + g.tag : "") + ":");
        g.units.forEach(i => { body.push(ind(lines[i + 2], "    ")); done.add(i); });
      });
      (W.units || []).forEach(i => { if(!done.has(i)){ body.push(ind(lines[i + 2], "  ")); done.add(i); } });
    });
    const rest = appState.S.units.map((u, i) => i).filter(i => !done.has(i));
    if(rest.length) body.push("", "Not in a Warlord's command:", ...rest.map(i => lines[i + 2]));
    lines.splice(2, appState.S.units.length, ...body.slice(1));
  }
  /* Fleet facts (J214): the attack rating and what the enemy gets, for the
     opponent reading the list */
  if((RF.facts || []).length) lines.push("", ...RF.facts.map(f => f.t + ": " + f.v));
  const bad = RF.checks.filter(c => !c.ok);
  lines.push("", bad.length ? "Fails: " + bad.map(c => c.t + " (" + c.v + ")").join("; ")
                            : "All machine-checked restrictions pass.");
  lines.push("Built with Gothic Fleet Registry \u00b7 " + DATA.src);
  return lines.join("\n");
}

