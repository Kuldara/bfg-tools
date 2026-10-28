import { $, APP_VERSION } from "./boot.js";
import { optCount } from "./card-model.js";
import { resolveUnit } from "./cards.js";
import { ARM_CLS, FLEET_FOLD_KEY, FOLDS, FOLD_KEY, L, LAST_PTS, LEND_TAG, SRC, UOPEN, applyRequired, applyTransition, armLineHTML, foldKey, isUpgradeEnt, lendCount, lendOf, midY, routeNeedsMet, routeOf, routeTag, rowLendOf, rowCards, rowSelOf, rowStepFor, rowUnits, setHull, setOptState, setUpState, shipOf, total, totalMax, unitPts } from "./model.js";
import { placeSaves } from "./panels.js";
import { renderPrintSetup } from "./print.js";
import { STASH_PTS, ensureUids, save, stashUnits } from "./save.js";
import { renderSaves } from "./saved-fleets.js";
import { appState } from "./state.js";
import { mixActive, mixGroups, mixGroupHTML, mixHulls, mixMember, mixRowHTML, mixRule, mixSec, mixStart, mixStop, mixUnits, sqErrorsHTML } from "./mixed.js";
import { aboardHTML, fleetResolved } from "./validation.js";
import { infoBtnHTML, rowHasInfo } from "./info.js";
import { SKW_MAX, activeWarlordIdx, clanzAfterMove, clanzDimUps, clanzHiddenUps, clanzIn, clanzMoveBlock, clanzPin, clanzSkwadronSec, factRowsHTML, fleetControlsHTML, freeSqTag, fxTagsHTML, isCommandeered, isOrkHulkUnit, optFxHTML, orkTiddlaHint, skwKind, upKind, orkPlain, orkSecGloss, sendSkwadron, setClan, setWarlordRerolls, upFx, warlordColor, warlordIdx, warlordNeeds, warlordSkwadrons } from "./warlords.js";
import { DATA, LISTS, SHIPS } from "../../../packages/ui/catalog.js";
import { arcGlyph, arcParts, esc, optCostLabel, shortRange, title, upCostText } from "../../../packages/ui/format.js";
import DOMAIN from "../../../packages/rules/domain.js";


export function renderTop(){
  $("#srcline").textContent = DATA.src + " \u00b7 Gothic Fleet Registry v" + APP_VERSION;
  const ln = $("#loadnote");
  if(ln){ const msg = appState.LOAD_NOTE || appState.FILE_NOTE; ln.textContent = msg; ln.hidden = !msg; }
  const sel = $("#listsel");
  /* A list that already holds a fleet says so with its points, so the menu
     shows where the player's work is without opening each list. */
  sel.innerHTML = LISTS.map((l,i) => {
    const pts = i === appState.S.li ? (appState.S.units.length ? total() : 0) : (stashUnits(l.nm).length ? STASH_PTS[l.nm] || 0 : 0);
    return `<option value="${i}"${i===appState.S.li?" selected":""}>${esc(l.nm)}${
      pts ? esc(" \u00b7 " + pts + " pts") : ""}</option>`;
  }).join("");
  $("#limit").value = appState.S.limit;
  /* the Save button and Saved fleets (named library, J208) */
  renderSaves();
  renderPrintSetup();
  placeSaves();
  const tot = total(), over = tot > (appState.S.limit|0);
  const t = $("#tally");
  t.className = "tally" + (over ? " over" : "");
  const mx = totalMax();
  /* By how much the total just moved, above the number where nothing has to
     make room for it. Only within one fleet: opening another list is not a
     change of points. A later render inside the same two seconds (the limit
     box, a second pane) writes the mark again at the age it has by then. */
  const nmT = L().nm, nowT = Date.now();
  const moved = !!appState.LAST_TOT && appState.LAST_TOT.nm === nmT && appState.LAST_TOT.tot !== tot;
  if(moved) appState.DELTA = { nm: nmT, d: tot - appState.LAST_TOT.tot, at: nowT };
  appState.LAST_TOT = { nm: nmT, tot: tot };
  const age = appState.DELTA && appState.DELTA.nm === nmT ? nowT - appState.DELTA.at : -1;
  t.innerHTML = `<b${moved ? ' class="bump"' : ""}>${tot}</b><i>/ ${appState.S.limit|0} pts</i>${
    mx > tot ? `<i class="maxp">max ${mx} if every open option is taken</i>` : ""}${
    age >= 0 && age < 1900 ? `<span class="dl" style="animation-delay:-${age}ms">${
      appState.DELTA.d > 0 ? "+" : "&minus;"}${Math.abs(appState.DELTA.d)}</span>` : ""}`;
  /* The heading follows the catalogue, not the fleet: reading "Available to
     this list" over another list's ships would be a plain untruth. */
  const SL0 = SRC(), ch = $("#cathead");
  /* Route mode: nothing is borrowed from that list - the ships come from
     this fleet's own section - so the heading must not say "Borrowed". */
  const r0 = SL0 === L() ? null : DOMAIN.lendRouteFor(L(), SL0, DATA);
  if(ch) ch.textContent = SL0 === L() ? "Available to this list"
    : r0 ? "Hulls of " + SL0.nm + " \u2014 added via " + title(r0.title)
    : "Borrowed from " + SL0.nm;
  $("#listmeta").textContent = "Fleets WiP pg. " + SL0.pg;
}

/* The book sets its sub-headings in caps above the paragraph; lifted out
   of the PDF they end up glued to the first sentence. Splitting is display
   only - every word stays, in order, so a wrong split can look odd but
   cannot lose a rule. */
export const SUBHEAD = /^((?:[A-Z][A-Z0-9&,\u2019'-]*(?:\s+|$)){2,})(?=[A-Z][a-z])/;

export function ruleLine(t){
  const m = SUBHEAD.exec(t);
  if(!m) return `<p>${esc(t)}</p>`;
  const w = m[1].trim().split(/\s+/);
  let rest = t.slice(m[1].length).trim();
  /* "WARP TRANSLATION A Daemonship..." - the lone A starts the sentence. */
  while(w.length > 1 && w[w.length - 1].length <= 1) rest = w.pop() + " " + rest;
  if(!w.length || rest.length < 15) return `<p>${esc(t)}</p>`;
  return `<b class="sub">${esc(w.join(" "))}</b><p>${esc(rest)}</p>`;
}

/* ---- Section sentences by group (J212, docs/check-yourself) ------------
   Every section sentence used to land under "Check yourself" unless it was
   word for word the source of one of the section's own rules: 2 497 lines,
   of which a reading of each against the book found 15 for the player to
   check. build_data.py now gives each sentence a group (sec.cls) from that
   hand classification (reference/check_yourself.json): checked, open (a
   rule of the book the builder does not check), info, models, play,
   campaign, row (describes a row) or drop (narrative). The cards do not
   read the groups; they pick their sentences as before. */
export const secGroup = (sec, g) =>
  (sec.text || []).filter((t, i) => ((sec.cls || [])[i] || "open") === g);
/* The same with the page the classification read the sentence on. */
export const secGroupPg = (sec, g) => (sec.text || [])
  .map((t, i) => ({ t: t, pg: (sec.cpg || [])[i], g: (sec.cls || [])[i] || "open" }))
  .filter(x => x.g === g);
/* What the builder checks for a section: its rules' sentences, once each,
   and the sentences found enforced some other way. */
export function secChecked(sec){
  const srcs = (sec.rules || []).map(r => r.src).filter((t, i, a) => t && a.indexOf(t) === i);
  return srcs.concat(secGroup(sec, "checked").filter(t => srcs.indexOf(t) < 0));
}
/* A row's own description sentences (label), or with label null the
   section's descriptions that name none of its rows. */
export function secRowText(sec, label){
  const own = sec.own || [], labels = (sec.ents || []).map(e => e.l);
  return (sec.text || []).filter((t, i) => (sec.cls || [])[i] === "row" &&
    (label == null ? !(own[i] && labels.indexOf(own[i]) >= 0) : own[i] === label));
}
/* A line with the page it is printed on, where the classification knows it. */
export const pgLine = (t, pg) => ruleLine(t).replace(/<\/p>$/,
  pg ? ` <span class="pg" title="Fleets page ${pg}">p.&nbsp;${pg}</span></p>` : "</p>");
/* The book's rules the builder does not check: the one list the player
   has to read for legality, each with its page. */
export function openGroupHTML(items){
  return items.length ? `<div class="rules open"><b class="hd">Not checked by the builder</b>${
    items.map(x => pgLine(x.t, x.pg)).join("")}</div>` : "";
}
/* Fleet rules: the list's rule-only sections and every in-play, campaign,
   models and fleet-fact sentence of the others, in one folded block at the
   top of the catalogue (user 20.10.2026: "the fleet rules could be a group
   of their own, separating what the builder checks and what it does not"). Each group
   keeps the book's section titles as subheadings. */
/* Every group starts folded (J237, user 25.10.2026: "the rule drop-downs
   with no units to choose always start minimised, everywhere"); the
   player's own opening is remembered (FOLDS). */
export const FR_GROUPS = [
  ["open", "Not checked by the builder", "0"],
  ["checked", "Checked by the builder", "0"],
  ["info", "Fleet facts", "0"],
  ["play", "In play", "0"],
  ["row", "Options and upgrades", "0"],
  ["models", "Models and painting", "0"],
  ["campaign", "Campaign and scenario", "0"],
  ["notes", "Builder's notes", "0"],
];
export function fleetRulesHTML(SL, foreign){
  const by = {};
  FR_GROUPS.forEach(g => { by[g[0]] = []; });
  SL.secs.forEach(sec => {
    if(foreign && sec.ct === "defence") return;
    const add = (g, items) => { if(items.length) by[g].push({ sub: title(sec.t), items: items }); };
    if(!sec.ents.length){
      add("open", secGroupPg(sec, "open"));
      add("checked", secChecked(sec).map(t => ({ t: t })));
      add("row", secGroup(sec, "row").map(t => ({ t: t })));
      add("notes", (sec.notes || []).map(t => ({ t: t })));
    }
    ["info", "play", "models", "campaign"].forEach(g => add(g, secGroupPg(sec, g)));
  });
  const n = g => by[g].reduce((a, s) => a + s.items.length, 0);
  if(!FR_GROUPS.some(g => n(g[0]))) return "";
  const fk = SL.nm + "|#fleetrules";
  const open = FOLDS[fk] != null ? !!FOLDS[fk] : false;
  const body = FR_GROUPS.map(g => {
    const k = n(g[0]);
    if(!k) return "";
    const gk = SL.nm + "|#fr-" + g[0];
    const o = FOLDS[gk] != null ? !!FOLDS[gk] : g[2] === "1";
    return `<details class="frg fr-${g[0]}" data-fold="${esc(gk)}" data-def="${g[2]}"${o ? " open" : ""}><summary>${
      esc(g[1])}<i>${k}</i></summary><div class="rules ${g[0]}">${
      by[g[0]].map(s => `<b class="sub">${esc(s.sub)}</b>` + s.items.map(x => pgLine(x.t, x.pg)).join("")).join("")
      }</div></details>`;
  }).join("");
  const chips = [["open", "not checked"], ["checked", "checked"], ["play", "in play"], ["campaign", "campaign"]]
    .filter(c => n(c[0])).map(c => `<span class="frchip fr-${c[0]}">${n(c[0])} ${c[1]}</span>`).join("");
  return `<details class="sec fleetrules ref" data-fold="${esc(fk)}" data-def="0"${open ? " open" : ""}>
    <summary>Fleet rules${foreign ? " &middot; " + esc(SL.nm) : ""}${chips}</summary>
    <div class="secbody">${body}</div></details>`;
}

/* The picker that puts another fleet list in the catalogue. The book lets a
   fleet take ships from another list as reserves or allies (Fleets pg. 14);
   which lists are allowed depends on race, on named grants and bans, and on
   what the fleet already contains, so the picker offers every list and lets
   the legality panel answer. A quiet wrong answer from a clever filter would
   be worse than a red row that quotes the book. */
export function sourceBarHTML(){
  const own = appState.SRC_LI == null || appState.SRC_LI === appState.S.li;
  const src = SRC();
  /* Four headings, allowed first, and a colour on each. "Allowed with
     limits" is deliberately narrow: almost every list has SOME row it will
     not lend - 2693 of the 3041 refusals across all pairs are rows in a
     donor's own access section, refused from every fleet alike - so a
     heading for that would be on nearly always and say nothing. This one is
     for a limit aimed at THIS fleet: a ban on some of the donor's rows
     (Armageddon's starred vessels, pg. 41), a grant that excludes rows
     (Dominion takes Rogue Traders but not the Xenos ones, pg. 101), or a
     condition the fleet has not met yet (pg. 139, pg. 316). That is 35 pairs
     out of 1024. The rest of the refusals are shown on the rows themselves,
     once the list is open. */
  const vs = LISTS.map(l => {
    const v = lendOf(l);
    if(v.kind !== "none") return v;
    const r = routeOf(l);
    return r ? { kind: "limited", verdict: v.verdict, only: null, route: r } : v;
  });
  const GROUPS = [["own", "This fleet"], ["open", "Allowed"],
                  ["limited", "Allowed with limits"], ["none", "Not allowed"]];
  const LEND_CLS = { own: "", open: "lend-ok", limited: "lend-lim", none: "lend-no" };
  const tail = i => {
    const v = vs[i];
    if(v.route) return " (via " + title(v.route.title) +
      (routeNeedsMet(v.route.needs) ? "" : ", needs " + v.route.needs.what) + ")";
    if(v.kind !== "limited" || !v.only) return "";
    return v.only.cause === "needs"
      ? " (needs " + v.only.what + ")" : " (not every ship)";
  };
  const opts = GROUPS.map(g => {
    const rows = LISTS.map((l, i) => i).filter(i => vs[i].kind === g[0]);
    if(!rows.length) return "";
    return `<optgroup label="${esc(g[1])}">` + rows.map(i =>
      `<option value="${i}" class="${LEND_CLS[g[0]]}"${
        (own ? i === appState.S.li : i === appState.SRC_LI) ? " selected" : ""}>${
        esc(LISTS[i].nm)}${i === appState.S.li ? " (this fleet)" : ""}${
        esc(tail(i))}</option>`).join("") + "</optgroup>";
  }).join("");
  const vSel = own ? null : vs[appState.SRC_LI];
  const barCls = !vSel ? "" : " " + (LEND_CLS[vSel.kind] || "");
  /* First the door, then the list. The two doors offer different lists and
     often share nothing, so choosing the list first meant picking from a
     mixed set and only afterwards finding out which half you were in. The
     counts are on the buttons because "which of these has ships in it" is
     the question you have before you open either. */
  const nRes = lendCount("reserve"), nAlly = lendCount("ally");
  /* A span, not a <label for>: a label pointed at a button forwards the
     click to it, so clicking the words "Borrow as" would have silently
     switched the door and replaced the whole list under the player. */
  const role = `<span class="srclab">Borrow as</span>
    <div class="srcrole" id="srcrole" role="group" aria-label="Borrow as">
      <button type="button" data-role="reserve" aria-pressed="${appState.SRC_ROLE !== "ally"}"
        title="Same race, and lists this one names. Counted against the 1:3 reserve budget by ship type (Fleets pg. 14-15)">reserve <i>${nRes}</i></button><button
        type="button" data-role="ally" aria-pressed="${appState.SRC_ROLE === "ally"}"
        title="Another race, allowed by the allies matrix. Counted against the 1:3 allied budget (Fleets pg. 16-17)">ally <i>${nAlly}</i></button></div>`;
  /* A list that swaps ships with nobody leaves the player with every other
     list refused and no reason on screen until something is added. The
     sentence is already on the list, so say it here. */
  const banned = own && L().res_ban
    ? `<p class="srcnote lend-no"><b>${esc(L().nm)}</b> takes no reserves and no
       allies. ${esc(L().res_ban)}</p>` : "";
  const other = appState.SRC_ROLE === "ally" ? "reserve" : "ally";
  const otherOK = !vSel || own || vSel.kind !== "none" ? false
    : DOMAIN.lendVerdict(L(), src, other).kind !== "no";
  /* A refused list is not always a dead end. The book's other route is the
     host list naming the vessels on its own pages - every Chaos list prints
     RENEGADE IMPERIAL VESSELS (pg. 222), Bastion Fleets prints Chaos hulls
     under its reserve fleet (pg. 39), and an Imperial or Space Marine list
     offers the Grey Knights Strike Cruiser under The Inquisition. Saying only
     "Not allowed" would be read as "those ships are out of reach", which is a
     different claim and a false one. */
  const route = vSel && vSel.route ? vSel.route : null;
  const why = !vSel ? "" : otherOK
    ? "Not as " + esc(appState.SRC_ROLE) + " - this list lends to you as " + esc(other) +
      ". Switch above, or add one anyway and the legality panel will name the rule."
    /* Two kinds, and they must not be described alike: renegades "do not
       count as reserves" (pg. 222), while Bastion's Chaos hulls are taken
       with "your reserve choices" (pg. 39). */
    : route && route.ct === "reserve"
    ? "Not borrowed from that list - but this fleet's own list takes " + route.n +
      " of these hulls as reserves under <b>" + esc(title(route.title)) + "</b>, " +
      "counted against its reserve allowance" + (routeNeedsMet(route.needs) ? ""
        : ", once " + esc(route.needs.what) + " leads this fleet") +
      ". The ones that qualify are marked below, and adding one adds it from that section."
    : route
    ? "Not as a reserve or an ally - but this fleet's own list takes " + route.n +
      " of these hulls under <b>" + esc(title(route.title)) + "</b>, with that " +
      "section's own limits and rules. The ones that qualify are marked below, " +
      "and adding one adds it from that section."
    : vSel.kind === "none"
    ? "This fleet may not take them. You can still add one, and the legality panel will name the rule and the page it is printed on."
    : vSel.kind === "limited" && vSel.only && vSel.only.cause === "needs"
      ? "Until " + esc(vSel.only.what) + " leads this fleet, every ship below is marked - you can still add one and see the rule."
      : vSel.kind === "limited"
        ? "Not every ship here may be taken by this fleet. The ones that may not are marked below."
        : "Adding one keeps it on its own list for price, options and upgrades, and the legality panel counts it into this fleet.";
  const note = own ? banned : `<p class="srcnote${barCls}">These are <b>${esc(src.nm)}</b> ships.
      ${why}</p>`;
  return `<div class="srcbar${own ? "" : " foreign" + barCls}">
    <div class="srcgrp">${role}</div>
    <div class="srcgrp wide"><label class="srclab" for="srcsel">Ships from</label><select
      id="srcsel">${opts}</select></div></div>${note}`;
}

/* The Warlord the catalogue adds to, as its chip says it (J226). */
export let WL_TO = "", WL_TO_COLOR = "";
/* "Buying for": the bar over the catalogue of a Da Ork Clanz fleet (J226,
   user 20.10.2026: "buying should be: buy for clan X, Y, Z"). One
   button per Warlord in his colour, + Warlord, and what the chosen one still
   needs, in words - the player need not know the skwadron rules by heart.
   It sticks under the top of the screen while the catalogue scrolls. */
export function renderWarlordBar(RF){
  const bar = $("#wlbar");
  if(!bar) return;
  if(!L().clanz){ bar.hidden = true; bar.innerHTML = ""; return; }
  const ws = warlordIdx(RF), wa = activeWarlordIdx(RF);
  const wlRow = (() => { const C = L().clanz; for(let si = 0; si < L().secs.length; si++){
    const ei = (L().secs[si].ents || []).findIndex(e => e.k === "cmd" && new RegExp(C.warlord, "i").test(e.l));
    if(ei >= 0) return [si, ei]; } return null; })();
  const cnt = RF.checks.filter(c => c.t === "WARLORD")[0];
  const W = (RF.warlords || []).filter(x => x.unit === wa)[0], need = warlordNeeds(W, RF);
  bar.hidden = false;
  /* it sticks under the screen's own sticky top: the whole top bar on a wide
     screen, the points strip on a phone */
  const strip = $(".tb-strip"), tb = $(".topbar");
  const stuck = window.matchMedia && window.matchMedia("(max-width:1020px)").matches
    ? (strip ? strip.offsetHeight : 0) : (tb ? tb.offsetHeight : 0);
  bar.style.top = stuck + "px";
  bar.innerHTML = `<div class="wlrow"><span class="abl">Buying for</span><span class="seg wrap">${ws.map((wi, k) => {
      const w = appState.S.units[wi], on = wi === wa;
      return `<button type="button" class="segb wlpick${on ? " on" : ""}" data-wlpick="${wi}" aria-pressed="${on}"
        style="--wl:${warlordColor(w, k)}"><i class="wldot"></i>Warlord ${k + 1}${w.clan ? " \u00b7 " + esc(w.clan) : ""}</button>`; }).join("")}${
      wlRow ? `<button type="button" class="segb" data-wladd="${wlRow[0]}:${wlRow[1]}" title="One Warlord for every 500 points, or part, of the fleet (Fleets p. 372)">+ Warlord</button>` : ""}</span>${
      cnt ? `<span class="wlhint${cnt.ok ? "" : " bad"}">Warlords ${esc(String(cnt.v).replace(/\s*exactly$/, ""))}</span>` : ""}</div>${
    wa >= 0 ? `<div class="wlrow"><span class="abl">${need.ok ? "Done" : "Needs"}</span><span class="wlneed ${need.ok ? "ok" : "bad"}">${esc(need.text)}</span></div>`
            : `<div class="wlrow"><span class="wlneed bad">Start with a Warlord: every skwadron belongs to one (Fleets p. 372).</span></div>`}`;
  bar.querySelectorAll("[data-wlpick]").forEach(b => b.onclick = () => {
    const w = appState.S.units[+b.dataset.wlpick]; if(!w) return; appState.ACTIVE_WL = w.uid; render(); });
  bar.querySelectorAll("[data-wladd]").forEach(b => b.onclick = () => {
    const [si, ei] = b.dataset.wladd.split(":").map(Number); addUnitFrom(appState.S.li, si, ei, null); });
}
export function renderCatalogue(){
  WL_TO = ""; WL_TO_COLOR = "";
  { const RF = fleetResolved();
    renderWarlordBar(RF);
    if(L().clanz){ const ws = warlordIdx(RF), wa = activeWarlordIdx(RF);
      if(wa >= 0){ WL_TO = "Warlord " + (ws.indexOf(wa) + 1); WL_TO_COLOR = warlordColor(appState.S.units[wa], ws.indexOf(wa)); } } }
  const wrap = $("#catalogue");
  const SL = SRC(), foreign = SL !== L();
  /* Route mode: the list is shown for its hulls, but a ship is added from
     this fleet's own section (DOMAIN.lendRouteFor maps each qualifying row to
     that section's row by hull reference, never by name - the Chaos
     renegade section prints both an Endeavour and a Bakka Endeavour, at
     different prices). */
  const srcRoute = foreign ? routeOf(SL) : null;
  wrap.innerHTML = sourceBarHTML() + fleetRulesHTML(SL, foreign) + SL.secs.map((sec, si) => {
    if(!sec.ents.length && !sec.rules.length && !sec.text.length) return "";
    /* A section with nothing to buy is rules only, and every one of its
       sentences now has a place in the Fleet rules block above (J212). */
    if(!sec.ents.length) return "";
    /* Another list's planetary defences are not on offer: a reserve or an
       ally is a ship of that fleet list (Fleets pp. 14, 16), and the engine
       lends no defence row. Shown here, the section would be fifteen rows
       that can only ever be marked "not allowed". */
    if(foreign && sec.ct === "defence") return "";
    const hdr = (sec.rules||[]).find(r => r.kind === "section_count" && r.hdr);
    /* One heading over the group, not the same words over every line. */
    const grp = (cls, head, items) => items.length
      ? `<div class="rules ${cls}"><b class="hd">${head}</b>${
          items.map(ruleLine).join("")}</div>`
      : "";
    /* What the builder checks for this section: the rules' own sentences
       (two rules can rest on one sentence - the Inquisitor Lord's 750 points
       and his place as commander - so print it once) and the sentences the
       hand classification found enforced some other way (J212: a row's
       condition, a group, another section's rule). Folded: it is the answer
       to "what does the builder do here", not something to read while
       shopping. */
    const autoT = secChecked(sec);
    const auto = autoT.length ? `<details class="rules auto"><summary><b class="hd">Checked by the builder <i>${
        autoT.length}</i></b></summary>${autoT.map(ruleLine).join("")}</details>` : "";
    /* The book's rules this section has and the builder does not check:
       the only list the player has to read for legality (J212). */
    const man = openGroupHTML(secGroupPg(sec, "open"));
    /* A sentence that describes one row is printed with that row; one that
       names no row stays with the section, quietly. */
    const rowInfo = grp("note book", "About these rows", secRowText(sec, null));
    /* The builder's own notes are not the book's sentences and must not
       read as rules: a separate, quieter group with its own heading. */
    const note = grp("note", "Builder's notes", sec.notes || []);
    /* Mixed squadron (prototype): while one is filling, this section's + is marked */
    const mixFill = !foreign && mixActive(si);
    const rows = sec.ents.map((en, ei) => {
      const sh = en.r ? SHIPS[String(en.r)] : null;
      const up = isUpgradeEnt(en);
      const targets = up && en.at
        ? en.at.map(p => { const s2 = SL.secs[p[0]], e2 = s2 && s2.ents[p[1]];
                           return e2 ? title(e2.l) : ""; })
               .filter((v,i,a) => v && a.indexOf(v)===i)
        : null;
      const routeAt = srcRoute && !up && en.k === "unit" ? srcRoute.map[si + ":" + ei] : null;
      /* A note is a qualifier, not a warning, and its heading must not
         talk about how the builder derived the row. The yellow box is
         kept only for a page reference the builder could not resolve. */
      const warn = (!en.nt ? ""
        : en.badref
          ? `<div class="warn"><b>Check the page reference</b>${esc(en.nt)}</div>`
          : `<div class="qual">${esc(en.nt)}</div>`) +
        /* The book's own sentences about this row (J212): what the option
           does or costs, printed where the row is, not in a rules list. */
        secRowText(sec, en.l).map(t => `<div class="qual book">${esc(t)}</div>`).join("");
      /* An upgrade is not a unit of its own, so it cannot be added as a row:
         it is ticked on the ship or commander it belongs to. */
      /* Fleets pg. 14: a fleet taking reserves "may not take any special
         characters from the reserve fleet list to use with the primary
         fleet". A commander on another list's page is exactly that, so it
         is shown with its price but cannot be added. */
      const noChar = foreign && en.k === "cmd";
      /* What a commander's price includes, in words (user 5.10.2026): the
         included re-rolls as a tag beside the name, their limit - or the
         fact that none is included although the list sells them - on the
         line under it. */
      const rrO = DOMAIN.commanderRerollOffer(SL, si, ei);
      /* The row's own verdict. A list can be allowed and still not lend this
         particular ship - its access sections are not its ships to lend
         (pg. 15), a hull that is not a battleship, cruiser or escort cannot
         be taken this way at all (pg. 14), and a named ban or a grant's
         exclusion can cut out rows by name. The button stays live either
         way: the mark says what the book says, it does not lock anything. */
      const rv0 = !foreign || up || noChar ? null
        : srcRoute
          ? (routeAt ? { ok: true, why: "", cause: "" }
                     : { ok: false, cause: "route",
                         why: "Not offered under " + title(srcRoute.title) + " on this fleet's own list." })
          : rowLendOf(SL, si, en);
      /* Added from this fleet's own section instead: a route list's row, or a
         row the donor may not lend as a reserve of a reserve (pg. 15) that
         this list prints in a reserve section of its own (pg. 142). */
      const resRow = rv0 && !rv0.ok && rv0.cause === "reserve" ? DOMAIN.hostReserveRow(L(), en) : null;
      const hostAt = routeAt || resRow;
      const hostEn = hostAt ? L().secs[hostAt.si].ents[hostAt.ei] : null;
      const via = !hostEn ? null : routeAt ? srcRoute : resRow;
      const rv = !via ? rv0
        : routeNeedsMet(via.needs) ? { ok: true, why: "", cause: "" }
        : { ok: false, cause: "needs", what: via.needs.what,
            why: "Needs " + via.needs.what + " - added from " + title(via.title) + " on this fleet's own list." };
      /* The row's own list decides what the ship is: a borrowed hull keeps its
         own list (pg. 14), a route row is added from this fleet's section. A
         required list upgrade is on the ship before the player chooses anything
         - the Explorator's +1 turret (Fleets p. 120) - so the line counts it in
         rather than printing the bare profile. */
      const rowList = hostEn ? L() : SL;
      const reqMod = sh ? (DOMAIN.requiredHullChanges(rowList, sh).mod || {}) : {};
      const st = (k, v) => reqMod[k] ? (+v + reqMod[k]) : v;
      const sub = sh
        ? `${sh.ty} \u00b7 ${st("hp", sh.hp)||"\u2013"} hits \u00b7 ${sh.sp} \u00b7 ${
            st("sh", sh.sh)} sh \u00b7 ${sh.ar} \u00b7 ${st("tu", sh.tu)} tur`
        : en.k === "cmd"
          ? "commander \u2014 assign to a ship when you deploy" +
            (!rrO ? "" : rrO.included ? (rrO.scope ? " \u00b7 re-roll: " + rrO.scope : "")
                       : rrO.text ? " \u00b7 " + rrO.text : "")
        : up
          ? (targets ? "tick it on: " + targets.slice(0,3).join(", ") +
              (targets.length > 3 ? " ..." : "")
            : "tick it on any ship in the fleet")
          /* A defence the book gives no profile (orbital mine p. 512,
             minefield p. 513): say what it is and what the player gets,
             not the builder's word for a row without a hull. */
          : sec.ct === "defence" ? "defence \u00b7 no ship profile \u00b7 prints a rules card"
          : "fleet option";
      /* The price is the host section's own: an Explorator Tyrant is 220 as a
         Mechanicus ship (pg. 125) but a renegade cruiser is "up to 185
         points" (pg. 222), and the renegade row carries that price. */
      const priced = hostEn || en;
      const cost = priced.p == null ? "?" : (priced.a || up ? "+" : "") + priced.p;
      const rowNo = !!rv && !rv.ok;
      const rvTag = !rowNo ? "" : (rv.cause === "needs"
        ? "needs " + rv.what : rv.cause === "route" ? "not offered"
        : (LEND_TAG[rv.cause] || "not allowed"));
      const viaTitle = hostEn ? title(via.title) : "";
      /* How many of this row the fleet already holds: the count on the
         button's corner. A row added from this fleet's own section counts
         there. */
      const rowUs = up || noChar ? []
        : hostEn ? rowUnits(null, hostAt.si, hostAt.ei) : rowUnits(foreign ? SL.nm : null, si, ei);
      /* What one + buys. An escort row sells a squadron: a CARD for two to
         six ships, and the price beside it is each ship's. Since 28.10.2026
         a press is one squadron card again (user: + grew the row's bottom
         card, "it should always add a new squadron card; now it is
         confusing"): + opens a new card at the squadron's minimum, - takes
         the row's last card, and the newest card's own - n + stands on the
         row (user 28.10.2026: "so it can be grown there without going to Your
         fleet") as well as on the card in Your fleet - which is what four
         presses for four frigates (four squadrons of two, 13.10.2026) lacked.
         A row sold on one card (orbital mines, a ground unit) is still one a
         press (18.10.2026; DOMAIN.rowStep). The row says it before the
         press: a tag by the name, "each" under the price, the buttons'
         titles; the count on the + is ships. */
      const buy = up || noChar ? null : DOMAIN.rowPurchase(rowList, hostEn ? hostAt.si : si, hostEn || en, sh);
      const many = !!buy && buy.kind !== "single";
      const nCards = rowUs.length;
      const nIn = many ? rowUs.reduce((a, u) => a + (u.n || 1), 0) : nCards;
      const perCard = !many ? "" : buy.kind === "count" ? (buy.max == null ? "any number" : "up to " + buy.max)
        : buy.min === buy.max ? String(buy.max) : buy.kind === "group" ? "up to " + buy.max : buy.min + "&ndash;" + buy.max;
      const cardWord = !many ? "" : buy.kind === "squadron" ? "squadron card" : "one card";
      const cardName = !many ? "" : buy.kind === "squadron" ? "squadron card" : "card";
      const minOn = !many ? 1 : Math.max(1, buy.min || 1);
      const buyTip = !many ? "" : buy.kind === "squadron"
        ? "A squadron card, " + perCard + " ships. Each + is a new squadron card of " + minOn +
          "; the newest card's own \u2212 and + under the name set its size. Each \u2212 beside the + takes this row's last card away"
        : "Sold by the card, " + perCard + " on a card. Each + is one more on this row's last " +
          cardName + (buy.max == null ? "" : ", and a full card is followed by a new one") +
          "; each \u2212 is one less, and at " + minOn + " the card goes";
      /* The newest card of a squadron row, with its own - n + under the
         name: the card + just made, so it grows here (28.10.2026). The cards
         the row's buttons work on (rowCards): not a mixed squadron's, in
         Clanz the active Warlord's. Not while a mixed squadron is filling,
         when this section's + puts ships into that. */
      const newest = !buy || buy.kind !== "squadron" || mixFill ? null
        : rowCards(hostEn ? L() : SL, hostEn || !foreign ? null : SL.nm, hostEn ? hostAt.si : si, hostEn ? hostAt.ei : ei, 1, mixMember).slice(-1)[0];
      const newestAt = newest ? appState.S.units.indexOf(newest) : -1;
      const rowCard = newestAt < 0 ? "" : (() => {
        const n = newest.n || 1, max = buy.max == null ? Infinity : buy.max;
        const which = [newest.sq ? "squadron " + newest.sq : "", newest.name || ""].filter(Boolean).join(" \u00b7 ");
        return `<div class="rowcard"><span>${nCards > 1 ? "Newest card" : "Its card"}${which ? " <i>" + esc(which) + "</i>" : ""}</span>
          <span class="stepper"><button type="button" data-rcu="${newestAt}" data-d="-1"${n <= 1 ? " disabled" : ""} title="One ship less on this card">&minus;</button><span>${n}</span><button
            type="button" data-rcu="${newestAt}" data-d="1" data-max="${max === Infinity ? "" : max}"${n >= max ? " disabled" : ""} title="One ship more on this card">+</button></span>
          <small>squadron ${buy.min}&ndash;${buy.max}</small></div>`;
      })();
      /* the ship's info popup shows the unit + would add (info.js) */
      const infoKey = up || !rowHasInfo(hostEn || en) ? null : hostEn ? "c:" + appState.S.li + "." + hostAt.si + "." + hostAt.ei
        : "c:" + (appState.SRC_LI == null ? appState.S.li : appState.SRC_LI) + "." + si + "." + ei;
      return `<div class="pick${up ? " upg" : ""}${rowNo ? " lend-no" : ""}"><div class="nm">${esc(title(en.l))}${
        infoKey ? infoBtnHTML(infoKey, "Everything about this ship") : ""}${
        up ? `<span class="tag">${en.incl ? "included" : en.req ? "required" : "upgrade"}</span>` : ""}${
        rrO && rrO.included ? `<span class="tag rr" title="${esc("Included in the points cost" + (rrO.scope ? " - " + rrO.scope : ""))}">${esc(rrO.head)}</span>` : ""}${
        noChar ? `<span class="tag">own fleet only</span>` : ""}${
        many ? `<span class="tag sq" title="${buyTip}">${cardWord} &middot; ${perCard}</span>` : ""}${
        rowNo ? `<span class="tag no" title="${esc(rv.why)}">${esc(rvTag)}</span>` : ""}${
        hostEn ? `<span class="tag via" title="${esc("Added from " + viaTitle + " on this fleet's own list")}">${
          esc(routeTag(via.title))}</span>` : ""}
        <small>${esc(noChar
          ? "Fleets pg. 14: you may not take special characters from a reserve fleet list"
          : sub)}</small>${noChar ? "" : armLineHTML(sh, hostEn || en, rowList)}${rowCard}</div>
        <div class="p">${cost}${many ? "<small>each</small>" : ""}</div>
        ${up || noChar ? "" : `<span class="acts">${
          /* The count on the + has its way back beside it: one of this row
             out of the fleet again. Only where there is one to take. */
          nIn ? `<button class="sub" data-s="${si}" data-e="${ei}"${
            hostEn ? ` data-hs="${hostAt.si}" data-he="${hostAt.ei}"` : ""} title="${
            buy.kind === "squadron" ? "Take this row's last squadron card away"
            : many ? "One less on this row's last " + cardName + "; at " + minOn + " the card goes" : "Remove one from your fleet"}">&minus;</button>` : ""
        }<button class="add${rowNo ? " no" : ""}${mixFill ? " into" : ""}" data-s="${si}" data-e="${ei}"${
          hostEn ? ` data-hs="${hostAt.si}" data-he="${hostAt.ei}"` : ""}${nIn ? ` data-n="${nIn}"` : ""} title="${
          rowNo ? esc(rv.why) : hostEn ? esc("Add from " + viaTitle)
          : (foreign ? "Add as " + esc(appState.SRC_ROLE) : "Add")}${
          buy && buy.kind === "squadron" ? " a new squadron card of " + minOn + " (" + perCard + " on a card)"
          : many ? " one more to this row's last " + cardName + " (" + perCard + " on a card)" : ""}${
          nIn ? " &middot; " + nIn + " in your fleet" + (many ? " on " + nCards + " card" + (nCards > 1 ? "s" : "") : "") : ""}">+</button></span>`}
        ${warn}</div>`;
    }).join("");
    /* A section with nothing to pick is reference text. It used to look
       exactly like a section full of ships, so the eye kept stopping at
       it while shopping for hulls. */
    const pick = sec.ents.length;
    /* A fleet without a commander: its own re-roll is said on the section
       that sells the extra ones (Necrons p. 404, Demiurg p. 486). */
    const frr = SL.frr && SL.frr.sec === sec.t ? DOMAIN.fleetRerolls(SL, []) : null;
    const fk = foldKey(SL, sec), open = FOLDS[fk] != null ? !!FOLDS[fk] : !!pick;
    /* Clanz (J226): which Warlord a + here adds to */
    const wlTo = WL_TO && SL === L() && clanzSkwadronSec(L().secs.indexOf(sec)) ? WL_TO : "";
    /* Mixed squadron (prototype): the section's top row, and the chip while one is filling */
    const mixTop = !foreign && mixSec(si) ? mixRowHTML(si) : "";
    const mixOn = !foreign ? mixActive(si) : null;
    return `<details class="sec${pick ? "" : " ref"}" data-fold="${esc(fk)}"${open ? " open" : ""}>
      <summary>${esc(title(sec.t))}${orkSecGloss(SL, sec) ? `<span class="gloss">${esc(orkSecGloss(SL, sec))}</span>` : ""}${hdr ? `<span class="limitchip">max ${hdr.max}</span>` : ""}${
        wlTo ? `<span class="limitchip wlto" style="--wl:${WL_TO_COLOR}" title="The catalogue's + adds a skwadron to this Warlord; pick another one in Buying for">for ${esc(wlTo)}</span>` : ""}${
        mixOn ? `<span class="limitchip mixinto" title="The + of this section adds one ship to the mixed squadron">into squadron ${esc(mixOn.tag)}</span>` : ""}${
        frr ? `<span class="limitchip" title="${esc(frr.source + " (Fleets p. " + frr.page + ")")}">${esc("fleet: " + frr.text)}</span>` : ""}
      ${pick ? `<span class="n">${
          sec.ents.filter(e => !isUpgradeEnt(e)).length || ""}</span>`
        : `<span class="refchip">rules only</span>`}</summary>
      <div class="secbody">${man}${auto}${rowInfo}${note}${mixTop}${rows}</div></details>`;
  }).join("");
  /* The source list is read at click time, not baked into the button: the
     catalogue is rebuilt on every render, and one place deciding it is one
     place to get it wrong. */
  wrap.querySelectorAll(".add").forEach(b => b.onclick = () => {
    /* The button is rebuilt by the render this causes, so the answer is left
       for that render to put on the button standing in the same place. */
    const sel = `.add[data-s="${b.dataset.s}"][data-e="${b.dataset.e}"]`;
    appState.JUST = { did: sel, keep: [{ sel: "#catalogue " + sel, mid: midY(b) }] };
    /* Mixed squadron (prototype): while one is filling, + in its section
       puts one ship of this row into it; + anywhere else ends the filling */
    if(appState.MIX){
      const M = b.dataset.hs == null && !foreign ? mixActive(+b.dataset.s) : null;
      if(!M){ mixStop(); }
      else { mixAddOne(M, +b.dataset.s, +b.dataset.e); appState.JUST = null; return; }
    }
    /* A squadron card's row opens a new card a press (user 28.10.2026);
       a row sold on one card puts one more on its last card while it has
       room (18.10.2026), and a full card, or no card yet, opens a new one at
       its minimum through addUnitFrom. */
    const grow = rowStepFor(b, 1, mixMember);
    if(grow && grow.act === "grow"){
      grow.unit.n = (grow.unit.n || 1) + 1;
      appState.JUST.unit = grow.unit;
      render();
    }
    /* A route row is this fleet's own ship: added from its own section, with
       no borrowed list and no role, exactly as if picked from its own page. */
    else if(b.dataset.hs != null) addUnitFrom(appState.S.li, +b.dataset.hs, +b.dataset.he, null);
    else addUnitFrom(appState.SRC_LI == null ? appState.S.li : appState.SRC_LI, +b.dataset.s, +b.dataset.e, appState.SRC_ROLE);
    appState.JUST = null;
  });
  /* Minus takes out the unit of this row that was added last - the same
     units the count on the + counts. When that was the only one the minus
     itself goes, and the + beside it is what must not move. */
  /* the newest card's own - n + on its row: as the card's in Your fleet */
  wrap.querySelectorAll("[data-rcu]").forEach(b => b.onclick = () => {
    const u = appState.S.units[+b.dataset.rcu];
    if(!u) return;
    u.n = Math.min(+b.dataset.max || Infinity, Math.max(1, (u.n || 1) + (+b.dataset.d)));
    appState.JUST = { unit: u, keep: [{ sel: `#catalogue [data-rcu="${b.dataset.rcu}"][data-d="${b.dataset.d}"]`, mid: midY(b) }] };
    render();
  });
  wrap.querySelectorAll("[data-mixstart]").forEach(b => b.onclick = () => { mixStart(+b.dataset.mixstart); render(); });
  wrap.querySelectorAll("[data-mixdone]").forEach(b => b.onclick = () => { mixStop(); render(); });
  wrap.querySelectorAll(".sub").forEach(b => b.onclick = () => {
    if(appState.MIX && b.dataset.hs == null && !foreign && mixActive(+b.dataset.s)){
      const M = appState.MIX, u = mixUnits(M.tag).find(x => x.s === +b.dataset.s && x.e === +b.dataset.e);
      if(!u) return;
      if((u.n || 1) > 1) u.n--; else appState.S.units.splice(appState.S.units.indexOf(u), 1);
      render(); return;
    }
    const step = rowStepFor(b, -1, mixMember);
    if(!step) return;
    const at = `[data-s="${b.dataset.s}"][data-e="${b.dataset.e}"]`, plus = b.parentNode.querySelector(".add");
    /* A row sold on one card: one less on its last card while it stays
       above its minimum (user 18.10.2026); at the minimum, and on a
       squadron card's row always (28.10.2026), the card itself goes. */
    if(step.act === "shrink"){
      step.unit.n = (step.unit.n || 1) - 1;
      appState.JUST = { did: ".sub" + at, unit: step.unit,
               keep: [{ sel: "#catalogue .sub" + at, mid: midY(b) }, { sel: "#catalogue .add" + at, mid: midY(plus) }] };
      render();
      return;
    }
    const i = appState.S.units.indexOf(step.unit);
    if(i < 0) return;
    appState.S.units.splice(i, 1);
    appState.JUST = { did: ".sub" + at, pop: ".add" + at,
             keep: [{ sel: "#catalogue .sub" + at, mid: midY(b) }, { sel: "#catalogue .add" + at, mid: midY(plus) }] };
    render();
  });
  if(appState.JUST) [["did", appState.JUST.did], ["pop", appState.JUST.pop]].forEach(m => {
    const el = m[1] ? wrap.querySelectorAll(m[1])[0] : null;
    if(el) el.classList.add(m[0]);
  });
  /* Remember what the player folded; no re-render here (see .upmore). A
     section written open fires the event too, so only a change is stored. */
  wrap.querySelectorAll("details[data-fold]").forEach(d => d.addEventListener("toggle", () => {
    /* data-def: the group's own default (Fleet rules groups, J212); a
       section is open by default unless it is reference text. */
    const k = d.dataset.fold, def = d.dataset.def != null ? d.dataset.def === "1" : !d.classList.contains("ref");
    const want = d.open === def ? null : (d.open ? 1 : 0);
    if((FOLDS[k] == null ? null : FOLDS[k]) === want) return;
    if(want == null) delete FOLDS[k]; else FOLDS[k] = want;
    try{ localStorage.setItem(FOLD_KEY, JSON.stringify(FOLDS)); }catch(e){}
  }));
  const ss = $("#srcsel");
  if(ss) ss.onchange = () => {
    const i = +ss.value;
    appState.SRC_LI = i === appState.S.li ? null : i;
    /* renderTop too: the heading over this pane names the list being
       shown, and it would otherwise still say "this list". */
    renderTop(); renderCatalogue();
  };
  wrap.querySelectorAll(".srcrole button").forEach(b => b.onclick = () => {
    appState.SRC_ROLE = b.dataset.role; renderCatalogue(); });
}

/* One unit of the fleet view. A ship goes through the resolver and the pure
   projection; a commander or fleet option keeps the legacy path until P1-8e. */
export function unitRowHTML(u, ui, ab){
  const R = resolveUnit(u);
  if(!R) return "";
  /* Raw field values are viewer state, not domain: the inputs must show
     exactly what was typed, so they come from the unit, not from R. */
  return unitHTML(R, ui, { name: u.name, members: u.members, note: u.note,
                           adj: u.adj, upsOpen: u.upsOpen,
                           /* Only the unit knows its role: the resolver
                              reports the donor list but not what the player
                              called the ship. */
                           lst: u.lst, role: u.role, ab: ab || null });
}

/* Structured problems of the resolved unit, as the builder shows them: an
   error means the choices contradict the book (both counted until fixed), a
   warning means a choice that is not counted. */
export function issuesHTML(R){
  if(!R.issues || !R.issues.length) return "";
  return `<div class="issues">${R.issues.map(x =>
    `<p class="${x.severity}">${x.severity === "error" ? "\u26a0 " : ""}${esc(x.message)}</p>`).join("")}</div>`;
}

export function unitHTML(R, ui, st){
  const ship = R.kind === "ship";
  /* Bought N at a time on one card: the resolved unit says so (R.squadron),
     not the book type - a weapons platform is type Defence and still comes
     one to six to a card. cardOnly: the card holds that many, but the book
     gives the unit no squadron rule (ground units, Fleets p. 517), so the
     word "squadron" is not used for it anywhere. */
  const sq = ship ? R.squadron : null;
  const esc_ = !!sq, grouped = esc_ && !sq.cardOnly;
  /* A row without a hull that is bought by the piece (orbital mines,
     minefields): a count, with no ceiling of the builder's own - the list's
     own limit on the row is the legality panel's to report. */
  const counted = !ship && !!R.countable;
  const fixedDef = !!R.defence && !!R.defence.stationary;
  /* Everything shown here is the resolved unit, never sh.* - a value an
     option can change must come from the same place the card reads. */
  const stats = ship ? `<div class="stats">
      <span><b>Hits</b> ${R.stats.hits||"\u2013"}</span><span><b>Speed</b> ${esc(R.stats.speed)}</span>
      <span><b>Turns</b> ${esc(R.stats.turns)}</span><span><b>Shields</b> ${esc(R.stats.shields)}</span>
      <span><b>Armour</b> ${esc(R.stats.armour)}</span><span><b>${
        esc(title(R.stats.turretLabel))}</b> ${esc(R.stats.turrets)}</span>
      <span><b>pg.</b> ${R.source.page}</span></div>` : "";
  /* noopt: the list forbids this hull's variants (RT Exploration p.180) -
     nothing to offer, so the block is not drawn at all. */
  /* forbidden: the list forbids that one option (Mechanicus Sharks, p. 125). */
  const opts = R.options.some(o => !o.forbidden) && !(R.entry && R.entry.noopt)
    ? R.options.filter(o => !o.forbidden).map(o => {
    const st2 = o.state;
    const blocked = !o.dependencyMet;
    const c = optCostLabel(o.cost);
    const b = (v, lab, cls) => `<button type="button" class="${cls||""}"
        data-u="${ui}" data-o="${o.index}" data-v="${v}" aria-pressed="${st2===v}"
        ${v === "take" && blocked ? "disabled" : ""}
        title="${v==="take" ? "Counted in the points and printed ticked"
              : v==="opt" ? "Printed on the card as an empty box, not counted"
              : "Left off the card entirely"}">${lab}</button>`;
    /* The book lets some options be bought more than once - the
       Warsphere's hull grows in steps of 2 HP, up to three times. */
    const qty = o.max > 1 && st2 === "take"
      ? `<span class="oq"><button type="button" data-u="${ui}" data-oq="${o.index}"
           data-d="-1">\u2212</button><span>\u00d7${o.qty}</span>
         <button type="button" data-u="${ui}" data-oq="${o.index}"
           data-d="1">+</button><em>max ${o.max}</em></span>` : "";
    return `<div class="opt${blocked ? " dis" : ""}">
      <span class="tri">${b("take","Take")}${b("opt","Option")}${b("off","Hide","off")}</span>
      <span>${esc(o.text)}${qty}</span><span class="c">${
        c}${o.max > 1 && st2 === "take" && o.qty > 1
            ? " \u00d7" + o.qty : ""}</span>${optFxHTML(o.text, R.entry && R.entry.list)}</div>`;
  }).join("") : "";
  const upRow = up => {
    const [si, ei] = up.key.split(":");
    const st2 = up.state;
    const c = upCostText(up);
    const b = (v, lab, cls) => `<button type="button" class="${cls||""}"
      data-u="${ui}" data-us="${si}" data-ue="${ei}" data-v="${v}"
      aria-pressed="${st2===v}"
      title="${v==="take" ? "Counted in the points and printed ticked"
            : v==="opt" ? "Printed on the card as an empty box, not counted"
            : "Left off the card entirely"}">${lab}</button>`;
    /* J229: game effects as tags in place of the source note; the book's
       text and the note go to the tooltip */
    const fx = upFx(up, R.entry && R.entry.label, st.ab && st.ab.hulk);
    /* the kind the book names (Gubbin, More Gubbins, clan, bio-enhancement ...) */
    const kind = upKind(up);
    /* greyed: a Gubbin his re-rolls no longer cover (clanzDimUps) */
    const dim = ((st.ab && st.ab.dim) || []).indexOf(up.key) >= 0;
    return `<div class="opt${up.required ? " req" : ""}${dim ? " dis" : ""}"${dim ? ` title="All his re-rolls are spent on Gubbins: another needs another re-roll (Fleets p. 372)"` : ""}>
      <span class="tri">${dim ? b("take","Take").replace("<button", "<button disabled") : b("take","Take")}${b("opt","Option")}${b("off","Hide","off")}</span>
      <span${fx ? ` title="${esc([up.description, up.note].filter(Boolean).join(" "))}"` : ""}>${kind ? `<span class="ukind">${esc(kind)}</span>` : ""}${esc(title(up.label))}${up.included ? " \u2014 included, no cost"
        : up.required ? " \u2014 automatic, required by the fleet list" : ""}
        ${!fx && up.note ? `<span class="src">${esc(up.note)}</span>` : ""}</span>
      <span class="c">${c}</span>${fx ? `
      <span class="upfx"${fx.color ? ` style="--wl:${fx.color}"` : ""}>${fxTagsHTML(fx.tags, [up.description, up.note].filter(Boolean).join(" "))}</span>` : ""}</div>`;
  };
  /* Rows the fleet pane leaves out (Clanz, J226: clanzHiddenUps) */
  const hideKeys = (st.ab && st.ab.hide) || [];
  const hidden = up => hideKeys.indexOf(up.key) >= 0;
  const own = R.upgrades.filter(x => x.owner === "own" && !hidden(x)), other = R.upgrades.filter(x => x.owner === "other" && !hidden(x));
  const upOwn = own.map(upRow).join("");
  /* The whole fleet pane is re-rendered on every click, so a plain
     <details> snapped shut after each choice and the list could not be
     worked through. The open state lives on the unit instead. */
  const upOther = other.length
    ? `<details class="upmore" data-u="${ui}"${st.upsOpen ? " open" : ""}>
       <summary>Other fleet-list upgrades<span class="n">${other.length}</span></summary>
       ${other.map(upRow).join("")}</details>`
    : "";
  const upBlock = (upOwn || upOther)
    ? `<div class="ups"><h5>Fleet-list upgrades</h5>${upOwn}${upOther}</div>` : "";
  const cust = R.entry && R.entry.openPrice ? `<input type="text" inputmode="numeric" class="cpts"
    data-u="${ui}" value="${R.custom||0}" style="width:70px" title="Points (varies \u2014 enter it)">` : "";
  /* Hull choice (Fleets p.102): the row names no ship, the player picks
     one. Price follows the hull: listed cost +35 for the Space Marine
     crew, or the Seditio Opprimere at its own price. */
  /* J69: the stepper stops at the list's squadron maximum and shows the range. */
  const sqMin = R.squadron ? R.squadron.min : 2, sqMax = R.squadron ? R.squadron.max : 6;
  const hullSel = R.hull ? `<select class="hullsel" data-u="${ui}" title="Hull (Fleets p. 102): listed cost +35 for the Space Marine crew">${
    R.hull.options.map(h =>
      `<option value="${h.ref}"${R.hull.chosen === h.ref ? " selected" : ""}>${
        esc(title(h.name))} \u2014 ${h.points} pts</option>`).join("")}</select>` : "";
  /* A borrowed ship (Fleets pg. 14) says so where the player reads the
     price, because the price, the options and the upgrades all come from
     the other list. The role is a choice, so it is a control and not a
     label. */
  const role = st.lst ? `<span class="rolebadge">
      <b>${esc(st.role === "ally" ? "ally" : "reserve")}</b>
      <span>${esc(R.entry && R.entry.list ? R.entry.list : st.lst)}</span>
      <button type="button" class="rolebtn" data-u="${ui}" data-role="reserve"
        aria-pressed="${st.role !== "ally"}" title="Counted against the reserve budget (Fleets pg. 14)">R</button><button
        type="button" class="rolebtn" data-u="${ui}" data-role="ally"
        aria-pressed="${st.role === "ally"}" title="Counted against the allied budget (Fleets pg. 16)">A</button>
    </span>` : "";
  /* J234: in Compact the name opens and closes the unit, and so does the
     arrow beside it, which says which way it is (user 27.10.2026: the name
     alone did not look like it would; an arrow, not + / -, which reads as
     "add" everywhere else) */
  const fold = (st.ab && st.ab.fold) || "";
  const foldTip = fold === "open" ? "Close this unit to one line" : "Open this unit";
  /* a squadron's count and the price of one (user 27.10.2026: "40 x 3",
     smaller), and what the squadron bought on top, so the total adds up */
  const unitPrice = R.entry && R.entry.price > 0 ? R.entry.price : 0, extraPts = R.points - unitPrice * R.hulls;
  const each = unitPrice && R.hulls > 1 ? `<span class="each" title="${R.hulls} ships at ${unitPrice} pts each${
    extraPts ? ", " + (extraPts > 0 ? "+" : "") + extraPts + " pts of options and upgrades" : ""}">${R.hulls} × ${unitPrice}${
    extraPts ? (extraPts > 0 ? " + " : " − ") + Math.abs(extraPts) : ""}</span>` : "";
  const head = `<div class="uhead">
      <button type="button" class="grip" data-grip="${ui}" draggable="true" aria-label="Move this unit"
        title="Drag to reorder, or move it a step with the arrow keys">${GRIP}</button>${st.ab && st.ab.send || ""}
      ${fold ? `<button type="button" class="ufold" data-unfold="${ui}" aria-expanded="${fold === "open"}" aria-label="${foldTip}" title="${foldTip}">${fold === "open" ? "▾" : "▸"}</button><button type="button" class="cls" data-unfold="${ui}" aria-expanded="${fold === "open"}" title="${foldTip}">${esc(title(R.className))}</button>`
             : `<span class="cls">${esc(title(R.className))}</span>`}${ship ? infoBtnHTML("u:" + ui, "Everything about this ship") : ""}${role}
      ${R.entry && R.entry.badRef ? '<span class="ty" style="color:var(--bad)">source page ref wrong</span>' : ""}
      <span class="ty">${esc(ship ? R.stats.type
        : R.kind === "commander" ? "commander"
        : R.defence ? (R.defence.ground ? "low orbit defence" : "high orbit defence")
        : "fleet option")}${grouped ? " squadron" : ""}</span>
      <span class="pts">${R.points} pts${each}${
        R.maxPoints > R.points ? `<span class="maxp">max ${R.maxPoints}</span>` : ""}</span>
      <button class="del" data-del="${ui}" title="Remove this unit">Remove</button>
    </div>`;
  if(fold === "shut") return `<div class="unit folded${st.lst ? " borrowed" : ""}" data-ui="${ui}">${head}${unitSummaryHTML(R, st)}${issuesHTML(R)}</div>`;
  return `<div class="unit${st.lst ? " borrowed" : ""}" data-ui="${ui}">
    ${head}
    <div class="uctl">
      ${ship ? `<input type="text" class="nmin" data-u="${ui}" placeholder="${
        grouped ? "Squadron name" : esc_ || fixedDef ? "Name (optional)" : "Ship name (optional)"}" value="${esc(st.name||"")}">` : ""}
      ${esc_ ? `<div class="stepper"><button data-u="${ui}" data-d="-1">\u2212</button>
         <span>${R.hulls}</span><button data-u="${ui}" data-d="1" data-max="${sqMax}"${
           R.hulls >= sqMax ? " disabled" : ""}>+</button></div>
         ${grouped ? `<span class="sqr" title="Squadron size in this list">squadron ${sqMin}\u2013${sqMax}</span>`
                   : `<span class="sqr" title="One card holds this many">up to ${sqMax} per card</span>`}` : ""}
      ${counted ? `<div class="stepper"><button data-u="${ui}" data-d="-1">\u2212</button>
         <span>${R.hulls}</span><button data-u="${ui}" data-d="1">+</button></div>${
           R.entry && R.entry.price != null ? `<span class="sqr" title="Bought by the piece">${R.entry.price} pts each</span>` : ""}` : ""}
      ${hullSel}${cust}
    </div>
    ${esc_ ? `<div class="uctl"><input type="text" class="memin" data-u="${ui}"
      style="flex:1 1 300px;min-width:180px"
      placeholder="${grouped ? (fixedDef ? "Names" : "Ship names") + ", comma separated - printed in the squadron boxes"
                             : "Names, comma separated - printed in the boxes"}"
      value="${esc(st.members||"")}"></div>` : ""}
    <div class="uctl">
      <input type="text" class="notein" data-u="${ui}" style="flex:1 1 240px;min-width:150px"
        placeholder="Refit, gift, gubbins or other fleet-rule upgrade \u2014 prints on the card"
        value="${esc(st.note||"")}">
      <label style="display:flex;align-items:center;gap:5px;font:400 11px/1 var(--mono);color:var(--ink-3)">
        \u00b1 pts <input type="text" inputmode="numeric" class="adjin" data-u="${ui}"
          style="width:62px" value="${st.adj|0}"></label>
    </div>
    ${stats}${ship ? weaponChipsHTML(R) : R.kind === "commander" ? commanderChipsHTML(R) : ""}${
      st.ab && st.ab.a ? aboardHTML(ui, st.ab.a, st.ab.RF) : ""}${st.ab && st.ab.extra || ""}${issuesHTML(R)}${opts}${upBlock}</div>`;
}
/* J234: a folded unit's one line - its name and count, re-rolls, the
   upgrades taken, how many options and the card note; a problem stays below
   it (issuesHTML). */
export function unitSummaryHTML(R, st){
  const bits = [];
  if(st.name) bits.push(`<b>${esc(st.name)}</b>`);
  if(R.kind === "ship" && R.squadron) bits.push("&times;" + (R.hulls | 0));
  if(R.kind === "commander" && R.rerolls && R.rerolls.total) bits.push(R.rerolls.total + " re-roll" + (R.rerolls.total > 1 ? "s" : ""));
  (R.upgrades || []).filter(up => up.state === "take" && !up.included).forEach(up => bits.push(esc(up.label)));
  const on = (R.options || []).filter(o => o.state === "take" && !o.forbidden).length;
  if(on) bits.push(on + " option" + (on > 1 ? "s" : ""));
  if(st.note) bits.push(esc(st.note));
  return bits.length ? `<div class="usum">${bits.join(" &middot; ")}</div>` : "";
}
/* A ship's own re-rolls, for the few that have any (the Scion of Prospero's
   two, Fleets p. 258; a Mark of Tzeentch; a fortress-monastery's). */
export function shipRerollChip(R){
  const rr = R.rerolls;
  if(!rr || !(rr.included || rr.total)) return "";
  return `<span class="wchip rr${rr.included ? " inc" : ""}" title="${esc(rr.included ? "Included in the ship's points cost" : "Bought for this ship")}">${esc(rr.text)}</span>`;
}
/* A commander's Leadership as the screens and the card write it: a fixed
   value replaces the ship's, a modifier is added to it. */
export function ldLabel(ld){
  if(!ld || ld.value == null) return "";
  return ld.kind === "modifier"
    ? (ld.value >= 0 ? "+" : "") + ld.value + (ld.max != null ? " (max " + ld.max + ")" : "")
    : "Ld " + ld.value;
}
/* The chosen commander's line (user 5.10.2026): Leadership, and the
   re-rolls in words - what the price includes, what was bought on top. */
export function commanderChipsHTML(R){
  const ld = ldLabel(R.leadership), rr = R.rerolls || {};
  const chips = [];
  if(ld) chips.push(`<span class="wchip"><b>LD</b>${esc(ld.replace(/^Ld /, ""))}</span>`);
  if(rr.text) chips.push(`<span class="wchip rr${rr.included ? " inc" : ""}" title="${
    esc(rr.included ? "Included in the points cost" : "The points cost includes no re-roll")}">${esc(rr.text)}</span>`);
  return chips.length ? `<div class="arms wchips">${chips.join("")}</div>` : "";
}
/* A weapon range as the fleet screens show it: the card's short form with
   the unit kept, so it reads as a distance - "30 cm", "30-150 cm" for a
   nova cannon, "25/30 cm" for launch bays' craft. Repeats once. */
export function rangeLabel(rs){
  const out = [];
  (rs || []).forEach(r => {
    const t = shortRange(r).replace(/\s*cm\s*$/i, "").trim();
    if(t && t !== "\u2013" && t !== "-" && out.indexOf(t) < 0) out.push(t);
  });
  return out.length ? out.join("/") + " cm" : "";
}
/* The chosen ship's weapons one by one (user 29.9.2026): class and
   strength in the card's colours, range and fire arc. These are the
   RESOLVED unit's rows, so an option taken adds or swaps a chip. */
export function weaponChipsHTML(R){
  const rows = (R.weapons || []).filter(w => w.state !== "offered").map(w => w.a);
  if(!rows.length) return "";
  /* One box per class, strength and range (DOMAIN.weaponBoxes): every row's
     arc is in it, launch bays are added up, and the full rows are in the
     tooltip. Rows with no arc to draw are counted instead. */
  return `<div class="arms wchips">${DOMAIN.weaponBoxes(rows).map(b => {
    const rl = rangeLabel([b.rng]);
    const arcs = b.arcs.filter(a => arcParts(a));
    const times = !b.summed && b.n > 1 && arcs.length < b.n ? "\u00d7" + b.n : "";
    const tip = b.names.map((nm, i) => [nm, b.arcs[i]].filter(x => x && x !== "\u2013" && x !== "-").join(" \u00b7 ")).join("\n") +
      (b.summed ? "\n" + b.n + " rows added up" : "");
    return `<span class="wchip" title="${esc(tip)}"><b class="${ARM_CLS[b.k] || ""}">${esc(b.k)}</b>${
      esc(b.v == null ? "Spec." : b.v)}${times}${rl ? `<i>${esc(rl)}</i>` : ""}${arcs.map(arcGlyph).join("")}</span>`;
  }).join("")}${shipRerollChip(R)}</div>`;
}
export const GRIP = '<svg viewBox="0 0 10 16" aria-hidden="true"><circle cx="3" cy="3" r="1.5"/><circle cx="7" cy="3" r="1.5"/><circle cx="3" cy="8" r="1.5"/><circle cx="7" cy="8" r="1.5"/><circle cx="3" cy="13" r="1.5"/><circle cx="7" cy="13" r="1.5"/></svg>';
/* Move a unit to another slot. Returns false when nothing moved. */
export function moveUnit(from, to){
  const n = appState.S.units.length;
  if(!(from >= 0 && from < n && to >= 0 && to < n) || from === to) return false;
  const u = appState.S.units.splice(from, 1)[0];
  appState.S.units.splice(to, 0, u);
  appState.JUST = { unit: u };                  /* the moved row is washed where it lands */
  save();
  return true;
}

/* Units whose Remove was pressed and that go when their moment of red is
   over (GOING_MS). Kept by the unit itself, so a render in between marks the
   rebuilt row again and a second tap on it is not a second removal. */
export const GOING = new WeakSet(), GOING_MS = 200;
/* Auto-scroll while a fleet row is dragged (user 14.10.2026): with the
   pointer near the top or the bottom of the window the page scrolls, the
   faster the closer to the edge, so a unit can travel the whole list in one
   drag. The top edge is the bottom of the sticky bar, not the window's own.
   A drag sends dragover as long as the pointer is over the page, also when
   it stands still; when they stop coming (pointer outside the window, drop,
   cancel) the scrolling stops with them. The speed is per second, not per
   frame: a busy or throttled page scrolls as far, only in bigger steps. */
export const DRAG_EDGE = 90, DRAG_MAX = 1300;              /* px from the edge, px/s at it */
export const DRAGS = { on: false, v: 0, t: 0, raf: 0, last: 0, acc: 0 };
export function dragTopEdge(){
  let y = 0;
  document.querySelectorAll(".topbar, .tb-strip, .tb-acts").forEach(el => {
    const r = el.getBoundingClientRect();
    if(r.height && r.top <= 1 && r.bottom > y) y = r.bottom;
  });
  return y;
}
export function dragScrollStep(){
  DRAGS.raf = 0;
  const now = performance.now();
  if(!DRAGS.on || !DRAGS.v || now - DRAGS.t > 250) return;
  DRAGS.acc += DRAGS.v * Math.min(120, now - DRAGS.last) / 1000;
  DRAGS.last = now;
  const px = Math.trunc(DRAGS.acc);
  DRAGS.acc -= px;
  if(px) window.scrollBy(0, px);
  DRAGS.raf = requestAnimationFrame(dragScrollStep);
}
export function dragScrollAt(y){
  const top = dragTopEdge(), h = window.innerHeight;
  let v = 0;
  if(y < top + DRAG_EDGE) v = -DRAG_MAX * Math.min(1, (top + DRAG_EDGE - y) / DRAG_EDGE);
  else if(y > h - DRAG_EDGE) v = DRAG_MAX * Math.min(1, (y - (h - DRAG_EDGE)) / DRAG_EDGE);
  DRAGS.v = v; DRAGS.t = performance.now();
  if(DRAGS.v && !DRAGS.raf){
    DRAGS.last = DRAGS.t; DRAGS.acc = 0;
    DRAGS.raf = requestAnimationFrame(dragScrollStep);
  }
}
export function dragScrollStop(){
  DRAGS.on = false; DRAGS.v = 0;
  if(DRAGS.raf) cancelAnimationFrame(DRAGS.raf);
  DRAGS.raf = 0;
}
export function renderFleet(){
  const box = $("#fleet");
  const swn = $("#swn");
  if(swn) swn.textContent = appState.S.units.length;
  const fb = $("#fleetfold");
  /* the tests' stub elements have no setAttribute */
  if(fb.setAttribute) fb.setAttribute("aria-pressed", appState.FLEET_FOLD ? "true" : "false");
  fb.className = "fold" + (appState.FLEET_FOLD ? " on" : "");
  fb.hidden = !appState.S.units.length;
  fb.onclick = () => {
    appState.FLEET_FOLD = !appState.FLEET_FOLD;
    try{ localStorage.setItem(FLEET_FOLD_KEY, appState.FLEET_FOLD ? "1" : "0"); }catch(e){}
    render();
  };
  /* Open all / Close all beside Compact (user 27.10.2026): every unit at
     once, the way the arrow opens one; shown only in Compact */
  const fa = $("#fleetall");
  if(fa){
    const allOpen = appState.S.units.length > 0 && appState.S.units.every(u => UOPEN.has(u));
    fa.hidden = !appState.FLEET_FOLD || !appState.S.units.length;
    fa.textContent = allOpen ? "Close all" : "Open all";
    fa.title = allOpen ? "Every unit to one line" : "Open every unit";
    fa.onclick = () => {
      appState.S.units.forEach(u => { if(allOpen) UOPEN.delete(u); else UOPEN.add(u); });
      render();
    };
  }
  if(!appState.S.units.length){
    box.innerHTML = `<p class="empty">Nothing added yet. Pick ships from the list on the left \u2014
      only entries this fleet list allows are shown.</p>`;
    $("#fleetmeta").textContent = "";
    return;
  }
  const frr = L().frr ? DOMAIN.fleetRerolls(L(), appState.S.units.map(u => resolveUnit(u))) : null;
  $("#fleetmeta").textContent = appState.S.units.length + " units \u00b7 " +
    fleetResolved().totals.hulls + " hulls" +
    (frr ? " \u00b7 fleet: " + frr.text : "") +
    (appState.NOTICE && appState.S.units.indexOf(appState.NOTICE.u) >= 0
      ? " \u00b7 Adjusted: " + appState.NOTICE.items.map(n => n.message).join("; ") : "");
  appState.NOTICE = null;
  const RF = fleetResolved(), abOf = {}, extra = fleetControlsHTML(RF);
  /* Clanz (J226): every row in its Warlord's colour, the Warlord's own row
     heading his group */
  const wsC = L().clanz ? warlordIdx(RF) : [];
  const wlOf = i => wsC.indexOf(i) >= 0 ? i : (RF.command && RF.command[i] >= 0 ? RF.command[i] : -1);
  (RF.aboard || []).forEach(a => { abOf[a.unit] = a; });
  const hideOf = clanzHiddenUps(RF), dimOf = clanzDimUps(RF);
  /* J232: Send to beside the grip; a Warlord aboard an Ork hulk shows his
     upgrades as they work there (Fleets p. 390) */
  const sendOf = extra.send || [];
  const onHulk = ui => { const a = abOf[ui]; return !!(a && a.ship != null && isOrkHulkUnit(RF.units[a.ship])); };
  /* a Clanz tiddla card: Mob Rule and Young Gunz, as information (p. 370) */
  const tidHint = u => L().clanz && skwKind(u) === "tiddla" ? `<div class="uctl">${orkTiddlaHint(u.n || 1)}</div>` : "";
  const rowOf = (u, ui, more) => unitRowHTML(u, ui,
    { a: abOf[ui] || null, RF: RF, extra: (extra[ui] || "") + tidHint(u) + (more || ""), hide: hideOf[ui] || [], dim: dimOf[ui] || [], send: sendOf[ui] || "", hulk: onHulk(ui),
      /* J234: "" without Compact, else this unit "shut" or "open" */
      fold: appState.FLEET_FOLD ? (UOPEN.has(u) ? "open" : "shut") : "" });
  /* Mixed squadron (prototype): two or more cards with one letter are one
     group row, drawn where the first card is; its cards show under it when
     the row is open. The squadron being filled is a row even while empty. */
  const groups = mixGroups(), memberOf = {};
  groups.forEach(g => g.idx.forEach(j => { memberOf[j] = g; }));
  appState.MIXOPEN = appState.MIXOPEN || new Set();
  box.innerHTML = appState.S.units.map((u, ui) => {
    const g = memberOf[ui];
    /* a card alone with its letter is a squadron too: its red rows on it */
    if(!g) return rowOf(u, ui, u.sq && !u.lst && mixSec(u.s) ? sqErrorsHTML(u.sq) : "");
    if(ui !== g.first) return "";
    const open = appState.MIXOPEN.has(g.tag);
    return mixGroupHTML(g, open) + (open ? g.idx.map(j => rowOf(appState.S.units[j], j)).join("") : "");
  }).join("") + groups.filter(g => !g.idx.length).map(g => mixGroupHTML(g, false)).join("");
  box.querySelectorAll("[data-unfold]").forEach(b => b.onclick = () => {
    const u = appState.S.units[+b.dataset.unfold];
    if(!u) return;
    if(UOPEN.has(u)) UOPEN.delete(u); else UOPEN.add(u);
    render();
  });
  box.querySelectorAll("[data-mixfold]").forEach(b => b.onclick = () => {
    const t = b.dataset.mixfold;
    if(appState.MIXOPEN.has(t)) appState.MIXOPEN.delete(t); else appState.MIXOPEN.add(t);
    render();
  });
  box.querySelectorAll("[data-mixdone]").forEach(b => b.onclick = () => { mixStop(); render(); });
  box.querySelectorAll("[data-mixmore]").forEach(b => b.onclick = () => {
    const g = groups.filter(x => x.tag === b.dataset.mixmore)[0];
    if(!g) return;
    appState.MIX = { tag: g.tag, si: g.si, list: L().nm };
    render();
  });
  box.querySelectorAll("[data-mixrm]").forEach(b => b.onclick = () => {
    const g = groups.filter(x => x.tag === b.dataset.mixrm)[0];
    if(!g) return;
    g.idx.slice().sort((a, c) => c - a).forEach(j => appState.S.units.splice(j, 1));
    if(appState.MIX && appState.MIX.tag === g.tag) mixStop();
    render();
  });
  if(wsC.length) box.querySelectorAll(".unit").forEach(row => {
    const i = row.dataset.ui != null ? +row.dataset.ui : +row.dataset.mixui, w = i >= 0 ? wlOf(i) : -1;
    if(w < 0) return;
    row.classList.add("wlc");
    if(w === i) row.classList.add("wlhead");
    row.style.setProperty("--wl", warlordColor(appState.S.units[w], wsC.indexOf(w)));
  });
  /* Squadron and Warlord (J216): a tag and a uid on the unit; the empty
     choice drops it. */
  box.querySelectorAll(".sqin").forEach(sel => sel.onchange = () => {
    const u = appState.S.units[+sel.dataset.u];
    if(!u) return;
    if(sel.value) u.sq = sel.value; else delete u.sq;
    render();
  });
  box.querySelectorAll(".wlin").forEach(sel => sel.onchange = () => {
    const u = appState.S.units[+sel.dataset.u];
    if(!u) return;
    if(sel.value) sendSkwadron(u, sel.value);
    render();
  });
  /* J232: the Warlord block's skwadron menu - split, or join another of his
     of the same kind */
  box.querySelectorAll(".wlsq").forEach(sel => sel.onchange = () => {
    const us = sel.dataset.wlsq.split(",").map(i => appState.S.units[+i]).filter(Boolean), v = sel.value;
    if(!us.length || !v) return;
    if(v === "split") us.forEach(u => { delete u.sq; });
    else if(/^join:/.test(v)){
      const t2 = appState.S.units[+v.slice(5)];
      if(!t2) return;
      const tag = t2.sq || freeSqTag();
      t2.sq = tag; us.forEach(u => { u.sq = tag; });
    }
    /* UX-01: a new tiddla of these escorts at its minimum, his and with his
       clan, as + from the catalogue gives it */
    else if(/^again:/.test(v)){
      const src = appState.S.units[+v.slice(6)], RF = fleetResolved();
      const wi = src && RF.command ? RF.command[appState.S.units.indexOf(src)] : -1;
      if(wi < 0) return;
      appState.ACTIVE_WL = appState.S.units[wi].uid;
      addUnitFrom(appState.S.li, src.s, src.e, null);
      return;
    }
    appState.JUST = { unit: us[0] };
    render();
  });
  /* The Warlord block (J226): one tap each - the Warlord new skwadrons go
     to, his re-rolls, his clan on every skwadron, a kroozer pair. */
  box.querySelectorAll("[data-wlactive]").forEach(b => b.onclick = () => {
    const w = appState.S.units[+b.dataset.wlactive]; if(!w) return;
    appState.ACTIVE_WL = w.uid; render(); });
  box.querySelectorAll("[data-wlrr]").forEach(b => b.onclick = () => {
    const w = appState.S.units[+b.dataset.wlrr]; if(!w) return;
    setWarlordRerolls(w, +b.dataset.n); render(); });
  box.querySelectorAll("[data-wlclan]").forEach(b => b.onclick = () => {
    const wi = +b.dataset.wlclan, R0 = fleetResolved(), w = appState.S.units[wi];
    const W = (R0.warlords || []).filter(x => x.unit === wi)[0]; if(!W || !w) return;
    if(b.dataset.c) w.clan = b.dataset.c; else delete w.clan;
    /* a commandeered escort's tiddla pays the clan once (Fleets p. 369) */
    W.units.forEach(i => { if(!isCommandeered(appState.S.units[i])) setClan(appState.S.units[i], b.dataset.c); });
    render(); });
  /* Aboard (J215): the player's pick is the ship's uid; Automatic drops it. */
  box.querySelectorAll(".abin").forEach(sel => sel.onchange = () => {
    const u = appState.S.units[+sel.dataset.u];
    if(!u) return;
    if(sel.value) u.aboard = sel.value; else delete u.aboard;
    render();
  });
  /* What changed since the last render says so itself: the row just added
     or moved is washed, and a price that moved (an option, an upgrade, the
     squadron's size) answers on its own number. */
  box.querySelectorAll(".unit").forEach(row => {
    const u = appState.S.units[+row.dataset.ui], el = row.querySelector(".pts");
    if(!u || !el) return;
    const now = parseInt(el.textContent, 10), was = LAST_PTS.get(u);
    if(was != null && was !== now) el.classList.add("bump");
    LAST_PTS.set(u, now);
    if(appState.JUST && appState.JUST.unit === u) row.classList.add("new");
    if(GOING.has(u)) row.classList.add("going");
  });

  /* Remove answers first and acts after: the button and its row turn red
     for a moment, then the unit goes, and the next unit's Remove is brought
     under the same finger. The unit is looked up again when the moment is
     over - itself, not its index - because another tap may have rebuilt the
     pane in between. The last unit of the list leaves nothing under the
     finger: there the next tap must not find a Remove it did not aim at. */
  box.querySelectorAll("[data-del]").forEach(b => b.onclick = () => {
    const u = appState.S.units[+b.dataset.del];
    if(!u || GOING.has(u)) return;
    GOING.add(u); b.closest(".unit").classList.add("going");
    setTimeout(() => {
      GOING.delete(u);
      const i = appState.S.units.indexOf(u);
      if(i < 0) return;
      const at = `#fleet .unit[data-ui="${i}"] [data-del]`, now = document.querySelectorAll(at)[0];
      appState.S.units.splice(i, 1);
      appState.JUST = { pop: rowSelOf(u), keep: now && i < appState.S.units.length ? [{ sel: at, mid: midY(now) }] : null };
      render();
    }, GOING_MS); });
  /* Reorder: drag a row's grip onto another row (above or below its
     middle), or press an arrow key on the grip. */
  let dragFrom = null;
  const clearMarks = () => box.querySelectorAll(".unit").forEach(u => u.classList.remove("dragging", "over-before", "over-after"));
  box.querySelectorAll(".grip").forEach(g => {
    g.ondragstart = e => {
      dragFrom = +g.dataset.grip;
      try{ e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", String(dragFrom)); }catch(x){}
      g.closest(".unit").classList.add("dragging");
      DRAGS.on = true;
    };
    g.ondragend = () => { dragFrom = null; clearMarks(); dragScrollStop(); };
    g.onkeydown = e => {
      if(e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
      e.preventDefault();
      const from = +g.dataset.grip, dir = e.key === "ArrowUp" ? -1 : 1, mu = appState.S.units[from];
      /* J232: a Warlord's arrow moves his whole group; a row that crosses
         a Warlord becomes his */
      if(L().clanz) clanzPin();
      if(L().clanz && clanzMoveBlock(mu, dir)){ /* nothing else moves */ }
      else {
        if(!moveUnit(from, from + dir)) return;
        if(L().clanz) clanzAfterMove(mu);
      }
      render();
      const ng = $("#fleet").querySelector(`.grip[data-grip="${appState.S.units.indexOf(mu)}"]`);
      if(ng) ng.focus();
    };
  });
  box.querySelectorAll(".unit").forEach(row => {
    const half = e => { const r = row.getBoundingClientRect(); return e.clientY < r.top + r.height / 2; };
    row.ondragover = e => {
      if(dragFrom == null) return;
      e.preventDefault();
      try{ e.dataTransfer.dropEffect = "move"; }catch(x){}
      const before = half(e);
      row.classList.toggle("over-before", before); row.classList.toggle("over-after", !before);
    };
    row.ondragleave = () => row.classList.remove("over-before", "over-after");
    row.ondrop = e => {
      if(dragFrom == null) return;
      e.preventDefault();
      const idx = +row.dataset.ui, from = dragFrom;
      dragFrom = null;
      dragScrollStop();
      let to = half(e) ? idx : idx + 1;
      if(to > from) to--;                 /* the row leaves its old slot first */
      const mu = appState.S.units[from];
      /* J232: under another Warlord it is his (clanzAfterMove) */
      if(L().clanz) clanzPin();
      if(moveUnit(from, to)){ if(L().clanz) clanzAfterMove(mu); render(); } else clearMarks();
    };
  });
  box.querySelectorAll(".rolebtn").forEach(b => b.onclick = () =>
    setRole(appState.S.units[+b.dataset.u], b.dataset.role));
  box.querySelectorAll(".stepper button").forEach(b => b.onclick = () => {
    const u = appState.S.units[+b.dataset.u];
    u.n = Math.min(+b.dataset.max || Infinity, Math.max(1, (u.n||1) + (+b.dataset.d))); render(); });
  box.querySelectorAll(".hullsel").forEach(sel => sel.onchange = () => {
    const u = appState.S.units[+sel.dataset.u];
    if(!u) return;
    setHull(u, sel.value);
    render();
  });
  box.querySelectorAll(".nmin").forEach(i => i.oninput = () => {
    appState.S.units[+i.dataset.u].name = i.value; save(); });
  box.querySelectorAll(".notein").forEach(i => i.oninput = () => {
    appState.S.units[+i.dataset.u].note = i.value; save(); });
  /* A price being typed is not a price that jumped: the number the next
     render compares against follows the typing. */
  box.querySelectorAll(".cpts").forEach(i => i.oninput = () => {
    const u = appState.S.units[+i.dataset.u];
    u.custom = parseInt(i.value, 10) || 0; LAST_PTS.set(u, unitPts(u));
    renderTop(); renderChecks(); save(); });
  box.querySelectorAll(".adjin").forEach(i => i.oninput = () => {
    const u = appState.S.units[+i.dataset.u];
    u.adj = parseInt(i.value, 10) || 0; LAST_PTS.set(u, unitPts(u));
    i.closest(".unit").querySelector(".pts").textContent = unitPts(u) + " pts";
    renderTop(); renderChecks(); save(); });
  box.querySelectorAll("[data-oq]").forEach(b => b.onclick = () => {
    const u = appState.S.units[+b.dataset.u], i = +b.dataset.oq, sh2 = shipOf(u);
    if(!sh2 || !sh2.ol[i]) return;
    applyTransition(u, { type: "quantity", id: sh2.ol[i].id, qty: optCount(u, i) + (+b.dataset.d) });
    render(); });
  box.querySelectorAll(".tri button").forEach(b => b.onclick = () => {
    const u = appState.S.units[+b.dataset.u];
    if(b.dataset.us != null && b.dataset.us !== "")
      setUpState(u, +b.dataset.us, +b.dataset.ue, b.dataset.v);
    else
      setOptState(u, +b.dataset.o, b.dataset.v);
    render(); });
  box.querySelectorAll(".memin").forEach(i => i.oninput = () => {
    appState.S.units[+i.dataset.u].members = i.value; save(); });
  /* Remember the open state; do not re-render here, or the click that
     opened the panel would immediately rebuild it. */
  box.querySelectorAll(".upmore").forEach(d => d.addEventListener("toggle", () => {
    const u = appState.S.units[+d.dataset.u];
    if(u){ u.upsOpen = d.open ? 1 : 0; save(); }
  }));
}

export function renderChecks(){
  const RF = fleetResolved(), cs = RF.checks, bad = cs.filter(c => !c.ok).length;
  $("#facts").innerHTML = factRowsHTML(RF.facts || []);
  /* "All clear" reads as "this list is legal", which is more than the
     machine can promise: every list also carries rules only the player can
     check. Say what was actually checked. */
  /* Only the book's rules the builder does not check are the player's to
     read (J212); the count used to take every section sentence. */
  const manual = L().secs.reduce((a, s2) => a + secGroup(s2, "open").length, 0);
  $("#chkmeta").innerHTML = bad
    ? bad + " problem" + (bad > 1 ? "s" : "")
    : "machine checks clear" + (manual ? " &middot; " + manual + " not checked" : "");
  /* One row per squadron rule, not one per squadron (J228, user 21.10.2026:
     "does it make sense that every one has its own row"). domain.js still checks every
     squadron on its own; the row names each with its size, a wrong one in
     red, and the book's sentence is printed once. */
  const rows = [];
  cs.forEach(c => {
    const g = /^Squadrons of \d/.test(String(c.s || "")) ? c.s : null;
    const r = g ? rows.find(x => x.g === g) : null;
    if(r) r.cs.push(c); else rows.push({ g: g, cs: [c] });
  });
  rows.forEach(r => {
    const c = r.cs[0];
    r.k = r.cs.length > 1 ? "squadrons|" + r.g : c.t + "|" + c.s;
    r.side = r.cs.some(x => !x.ok) ? "bad" : r.cs.every(x => x.warn) ? "warn" : "ok";
  });
  /* "7 ships" -> "x7"; a lettered squadron's "6 ships: 3 Cobra + ..." -> "x6 \u00b7 3 Cobra + ..." */
  const sqSize = v => String(v).replace(/^(\d+) (ships?|escorts?|defences?)\b(:\s*)?\s*/, (m, n, w, c) => "\u00d7" + n + (c ? " \u00b7 " : " "));
  /* J232: a Da Ork Clanz row in plain English beside the Ork words */
  const pl = L().clanz ? orkPlain : (x => x);
  const rowHTML = (r, ix) => {
    const c = r.cs[0], cls = r.side === "bad" ? "bad" : r.side === "warn" ? "warn" : "";
    if(r.cs.length < 2) return `<div class="chk ${cls}" data-r="${ix}">
      <span class="dot"></span>
      <span><b>${esc(pl(c.t))}</b><span class="src">${esc(c.s)}</span></span>
      <span class="val">${esc(pl(c.v))}</span></div>`;
    const m = /^Squadrons of (\d+\u2013\d+)\./.exec(r.g);
    return `<div class="chk ${cls}" data-r="${ix}">
      <span class="dot"></span>
      <span><b>Escort squadrons${m ? " of " + m[1] : ""}</b><span class="sqs">${r.cs.map(x =>
        `<span class="sq${x.ok ? "" : " bad"}">${esc(x.t)} <i>${esc(sqSize(x.v).trim())}</i></span>`).join("")}</span><span class="src">${esc(r.g)}</span></span>
      <span class="val">${r.side === "bad" ? r.cs.filter(x => !x.ok).length + " of " + r.cs.length + " wrong" : r.cs.length + " squadrons"}</span></div>`;
  };
  /* J234 (Discord 25.10.2026, a user said far too much time went on
     min-maxing those categories): a problem stays in sight above Your fleet; the checks
     that pass, the fleet facts and the note wait behind one line that only
     the player opens and closes (remembered with the other folds). */
  $("#checks").innerHTML = rows.map((r, ix) => r.side === "bad" ? rowHTML(r, ix) : "").join("");
  $("#checksok").innerHTML = rows.map((r, ix) => r.side !== "bad" ? rowHTML(r, ix) : "").join("");
  const passN = rows.filter(r => r.side !== "bad").length, factN = (RF.facts || []).length;
  /* the stored state every time (setting it to what it is fires nothing);
     the player's toggle stores it */
  const fd = $("#chkfold"), want = FOLDS["~legality"] === 1;
  if(!!fd.open !== want) fd.open = want;
  fd.ontoggle = () => {
    if((FOLDS["~legality"] === 1) === !!fd.open) return;
    if(fd.open) FOLDS["~legality"] = 1; else delete FOLDS["~legality"];
    try{ localStorage.setItem(FOLD_KEY, JSON.stringify(FOLDS)); }catch(e){}
  };
  fd.hidden = !(passN || factN || manual);
  $("#chkfoldsum").innerHTML = (bad ? "Other checks: " : "") + passN + " pass" +
    (factN ? " &middot; fleet facts" : "") + (manual ? " &middot; " + manual + " rule" + (manual > 1 ? "s" : "") + " not checked" : "");
  /* A check that changed sides since the last render - went red, or came
     clear - is washed, so the eye lands on what the last tap did to the
     list. A count that only moved (1 / 12 to 2 / 12) is not a change of
     sides and stays quiet. */
  const seen = appState.LAST_CHK && appState.LAST_CHK.nm === L().nm ? appState.LAST_CHK.map : null, map = {};
  let cleared = false;
  rows.forEach((r, ix) => {
    if(seen && seen[r.k] && seen[r.k] !== r.side){
      const el = document.querySelector('#checks [data-r="' + ix + '"], #checksok [data-r="' + ix + '"]');
      if(el && el.classList) el.classList.add("chg");
      /* came clear behind the fold: the fold's line says so */
      if(r.side !== "bad") cleared = true;
    }
    map[r.k] = r.side;
  });
  const sum = $("#chkfoldsum");
  sum.className = "";
  if(cleared && !fd.open){ void sum.offsetWidth; sum.className = "chg"; }
  appState.LAST_CHK = { nm: L().nm, map: map };
  const n = manual;
  const e = L().secs.reduce((a,s) => a + s.rules.length, 0);
  $("#manualnote").innerHTML = `<b>What this checks.</b> ${e} restriction${e===1?"":"s"}
    in this list are machine-readable and enforced above &mdash; each one shows the sentence it
    came from. ${n ? `${n} more rule${n===1?"":"s"} of the book ${n===1?"is":"are"} not checked by the builder:
    listed under <b>Fleet rules</b> and in ${n===1?"its":"their"} section, marked <b>Not checked by the builder</b>,
    with the page.` : "Every rule of this list that limits what the fleet may take is checked."}
    In-play rules and campaign and scenario rules are under <b>Fleet rules</b> on their own.`;
}

/* Add a ship. li2 is the list it is bought FROM: the fleet's own list for a
   normal purchase, another list for a borrowed ship (Fleets pg. 14). Every
   lookup below reads that list, and the unit then carries its own list and
   role, so nothing afterwards has to know which catalogue was open.

   The golden driver builds the same object by switching the selected list
   first (test_golden.js buildFleet). The app must not do that: render()
   sweeps applyRequired over the whole fleet, so a moment with the wrong
   list selected rewrites every ship's required upgrades (backlog J103). */
/* Mixed squadron (prototype): one ship of row (si, ei) into the squadron
   being filled - the row's card with the letter grows by one, or a card of
   one is added with the letter. A full squadron ends the filling. */
function mixAddOne(M, si, ei){
  const same = mixUnits(M.tag).find(x => x.s === si && x.e === ei);
  if(same) same.n = (same.n || 1) + 1;
  else {
    const before = appState.S.units.slice();
    addUnitFrom(appState.S.li, si, ei, null);
    const u = appState.S.units.find(x => before.indexOf(x) < 0);
    if(!u) return;
    u.n = 1; u.sq = M.tag;
  }
  const r = mixRule(si);
  if(r && mixHulls(M.tag) >= r.max) mixStop();
  appState.JUST = { unit: same || appState.S.units[appState.S.units.length - 1] };
  render();
}
export function addUnitFrom(li2, si, ei, role){
  const L2 = LISTS[li2] || L();
  const u = newUnit(li2, si, ei, role);
  if(!u) return;
  const en = L2.secs[si].ents[ei];
  ensureUids(appState.S.units);
  u.uid = "u" + (++appState.UID_N);
  /* Da Ork Clanz (J226): a skwadron goes to the Warlord new skwadrons go
     to, right after his other ships, with his clan; a kroozer that would be
     one skwadron too many for him joins his lone kroozer. A new Warlord is
     the one from then on. */
  let at = appState.S.units.length;
  const CZ = L2 === L() ? L().clanz : null;
  if(CZ && new RegExp(CZ.warlord, "i").test(en.l)) appState.ACTIVE_WL = u.uid;
  else if(CZ && clanzSkwadronSec(si)){
    const RF0 = fleetResolved(), wa = activeWarlordIdx(RF0);
    if(wa >= 0){
      u.cmd = appState.S.units[wa].uid;
      at = wa + 1;
      appState.S.units.forEach((x, i) => { if(RF0.command && RF0.command[i] === wa) at = Math.max(at, i + 1); });
      const W = (RF0.warlords || []).filter(x => x.unit === wa)[0];
      /* only the clan chosen for him: a clan bought on one skwadron is that
         skwadron's own choice */
      if(appState.S.units[wa].clan) setClan(u, appState.S.units[wa].clan);
      /* J232: a Rok joins his Rok skwadron the same way (1-4, Fleets p. 372) */
      const kk = clanzIn(si, CZ.big) ? "kroozer" : clanzIn(si, CZ.rok) ? "rok" : "";
      if(W && !W.hulk && kk){
        const others = (W.total || 0) - Math.min(W.tiddla || 0, W.rr);
        const g = others + 1 > W.rr ? warlordSkwadrons(RF0, wa).filter(x => x.kind === kk && x.hulls + 1 <= SKW_MAX[kk])[0] : null;
        if(g){ const tag = appState.S.units[g.units[0]].sq || freeSqTag(); g.units.forEach(j => { appState.S.units[j].sq = tag; }); u.sq = tag; }
      }
    }
  }
  appState.S.units.splice(at, 0, u);
  appState.JUST = Object.assign(appState.JUST || {}, { unit: u });
  render();
}
/* addUnitFrom's new unit, not yet in the fleet (the ship info popup shows a
   catalogue row as this). */
export function newUnit(li2, si, ei, role){
  const L2 = LISTS[li2] || L();
  const sec = L2.secs[si], en = sec && sec.ents[ei];
  if(!en || isUpgradeEnt(en)) return null;
  const sh = en.r ? SHIPS[String(en.r)] : null;
  const u = { s:si, e:ei, ref:en.r || null, n:1, opts:[], name:"" };
  /* Stamped BEFORE applyRequired: selOf(u) resolves through u.lst, so the
     required upgrades come from the list the ship was actually bought on. */
  if(L2 !== L()){
    u.lst = L2.nm;
    u.role = role === "ally" ? "ally" : "reserve";
  }
  /* An open price ("varies") starts from the profile's own price: the book
     leaves the list row open, but the ship's page gives a number. The player
     can type over it - that is what an open price is for. */
  if(en.p == null && sh && sh.bp != null) u.custom = sh.bp;
  /* A unit bought N to a card starts at its section's squadron minimum: an
     escort by its book type, a one-hit planetary defence by the profile flag
     sq (same test as isEscort). The defence section's own rule says one to
     six (Rulebook p. 100), so a platform starts at one and not at the
     escorts' two. */
  if(sh && (sh.sq || /escort/i.test(sh.ty))){
    /* Look for the squadron rule that governs THIS section, wherever the
       sentence itself was printed. */
    const sq = L2.secs.reduce((f, s2) => f || (s2.rules||[]).find(r =>
      r.kind === "squadron" && (r.sec || []).indexOf(si) >= 0), null);
    u.n = sq ? sq.min : 2;
  }
  applyRequired(u);
  return u;
}
export function addUnit(si, ei){ addUnitFrom(appState.S.li, si, ei, null); }

/* Reserve or ally is the player's call, and the engine reports either way
   (Fleets pg. 14 for reserves, pg. 16 for allies). Switching it must not
   disturb anything the ship already carries. */
export function setRole(u, role){
  if(!u.lst) return;
  u.role = role === "ally" ? "ally" : "reserve";
  render();
}

export function render(){
  appState.S.units.forEach(applyRequired);      /* bring old saves along */
  renderTop(); renderCatalogue(); renderFleet(); renderChecks(); save();
  /* The tapped control, or what now stands in its place, stays under the
     finger: whatever the render moved above it - the top bar grows when the
     first ship brings a "max" figure - is taken back out of the scroll. */
  if(appState.JUST && appState.JUST.keep) appState.JUST.keep.some(k => {
    const el = document.querySelectorAll(k.sel)[0];
    const dy = el ? Math.round(midY(el) - k.mid) : 0;
    if(dy) window.scrollBy(0, dy);
    return !!el;
  });
  appState.JUST = null;                         /* answered; the next render is someone else's */
}

