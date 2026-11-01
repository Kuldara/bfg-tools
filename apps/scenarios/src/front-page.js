import { REC_LBL, recB, recCtl, recLine, recS } from "./bookkeeping.js";
import { BOOK, GROUPS, SC, TRUST, v0, val } from "./data.js";
import { esc, seg, sugText } from "./helpers.js";
import { SHORT_Q, layout, mapNarrow } from "./layout.js";
import { mapSVG } from "./map-svg.js";
import { mapOf } from "./maps.js";
import { tableCtl } from "./scenario-page.js";
import { DB, prep } from "./state.js";
import { tableWH } from "./table.js";
import { CATS, CAT_OLD, PLAYERS, SIZES, app, inCat, lf, lfActive, listMatches, nav, plChip, secOf, wrIssue } from "./views.js";

/* ---------------------------------------------------------------- maps on cards and the names view (0.18)
   The discovery lab's ideas A and F (lab/README.md), made features after the owner chose them on 26.10.2026.
   The lab's other ideas stay in lab/lab.js; its "More like this" needs the hand-checked kinds first. */
export const THUMB = {};
/* A miniature of the deployment map: the same drawing as on the scenario's page, on the user's table, without
   texts (they would not fit) and without the terrain's tap targets, which belong to the scenario page. */
export function mapThumb(sc) {
  const [W, H] = tableWH(), k = sc.id + "|" + W + "x" + H + "|" + mapNarrow();
  if (THUMB[k] !== undefined) return THUMB[k];
  let h = "";
  try {
    const m = mapOf(sc, v0(sc));
    if (m.items.length) h = mapSVG(m).replace(/<text\b[\s\S]*?<\/text>/g, "").replace(/ data-(a|id)='[^']*'/g, "");
  } catch (e) { h = ""; }
  return THUMB[k] = h ? "<div class='mapthumb' aria-hidden='true'>" + h + "</div>" : "<div class='mapthumb none' aria-hidden='true'><span>no map</span></div>";
}
/* the whole picture of one scenario for the names view: where it is from, the chips, the pitch, the map, the
   at-a-glance table and the way in; the mark and the star work here as on its card */
export function scPreview(sc) {
  const v = v0(sc), m = mapOf(sc, v);
  return "<div class='series'>" + esc(sc.series) + " · " + TRUST[sc.trust].l + " · " + esc(sc.src) + "</div>" +
    "<div class='card-t prevt'><h2>" + esc(sc.name) + "</h2>" + recCtl(sc.id, true) + "</div>" +
    "<div class='chips'><span class='chip" + (sc.suggest ? "" : " any") + "'>" + esc(sugText(sc)) + "</span>" + (sc.type ? "<span class='chip'>" + esc(sc.type) + "</span>" : "") +
    (plChip(sc) ? "<span class='chip'>" + plChip(sc) + "</span>" : "") + tagChips(sc) + "</div>" +
    "<p class='pitch'>" + esc(val(sc.pitch, v)) + "</p>" + (sc.why ? "<p class='small muted' style='margin:0 0 8px'>" + esc(sc.why) + "</p>" : "") +
    (m.items.length ? "<div class='mapwrap'>" + mapSVG(m) + "</div>" : "") +
    "<table class='ltab' style='margin-top:8px'>" + val(sc.glance, v).map(r => "<tr><td>" + esc(r[0]) + "</td><td>" + esc(r[1]) + "</td></tr>").join("") + "</table>" +
    "<p class='prevopen'><a class='btn primary' href='#/s/" + sc.id + "/setup'>Open scenario ›</a></p>";
}
/* the list grouped as on the cards, in the order the cards show */
export function listGroups(list) {
  const out = [];
  for (const [g, title, sub] of GROUPS) {
    const gl = list.filter(s => secOf(s) === g);
    if (g === "wr") gl.sort((a, b) => wrIssue(a) - wrIssue(b));
    if (gl.length) out.push([g, title, sub, gl]);
  }
  return out;
}
/* the picture beside the list needs room for both: on a wide screen of 1180 px or more, else it opens under the name */
export const SPLIT_Q = window.matchMedia("(min-width: 1180px)");
export function prevSplit() { return layout() !== "narrow" && SPLIT_Q.matches && !SHORT_Q.matches; }
export function namesZone(list, split) {
  const groups = listGroups(list), shown = groups.flatMap(g => g[3]);
  /* the remembered choice, or on a wide screen the first name; on a narrow one nothing until a name is tapped */
  const sel = shown.find(s => s.id === DB.lsel) || (split ? shown[0] : null);
  let names = "";
  for (const [, title, , gl] of groups) {
    names += "<div class='group-h'><h2>" + esc(title) + "</h2></div>" + gl.map(s => {
      const rs = recS(s.id), mark = (rs ? " · " + REC_LBL[rs].toLowerCase() : "") + (recB(s.id) ? " · ★" : "");
      return "<button data-a='nsel' data-id='" + s.id + "' aria-pressed='" + (sel === s) + "'>" + esc(s.name) +
        "<small>" + esc(val(s.glance, v0(s))[0][1]) + " · " + esc(BOOK[s.book]) + esc(mark) + "</small></button>" +
        (!split && sel === s ? "<div class='card previn'>" + scPreview(s) + "</div>" : "");
    }).join("");
  }
  return "<div class='prevcols" + (split ? " split" : "") + "'><div class='namelist'>" + names + "</div>" +
    (split ? "<div class='prevpane'>" + (sel ? "<div class='card'>" + scPreview(sel) + "</div>" : "") + "</div>" : "") + "</div>";
}
export function lvSeg() {
  const names = DB.lv === "names";
  return "<div class='seg lvseg' role='group' aria-label='View'><button data-a='lv' data-v='' aria-pressed='" + !names + "'>Cards</button>" +
    "<button data-a='lv' data-v='names' aria-pressed='" + names + "'>Names</button></div>";
}
export function listZone(cat) {
  const list = listMatches(cat), q = (DB.lq || "").trim();
  let h = "<div class='poolhead'><span>" + (q ? "Searching all scenarios: " : "") + "<b>" + list.length + "</b> scenario" + (list.length === 1 ? "" : "s") + "</span>" + lvSeg() + "</div>";
  if (!list.length) return h + "<p class='calc'>Nothing matches. Loosen the search or the filters.</p>";
  if (DB.lv === "names") return h + namesZone(list, prevSplit());
  for (const [g, title, sub] of GROUPS) {
    const gl = list.filter(s => secOf(s) === g);
    if (g === "wr") gl.sort((a, b) => wrIssue(a) - wrIssue(b));
    if (!gl.length) continue;
    h += "<div class='group-h'><h2>" + esc(title) + "</h2><span>" + esc(sub) + "</span></div><div class='cardgrid'>";
    /* UX review 22.10.: the group heading already names the source (and sometimes "any fleets"), so the card does not repeat it */
    const oneSrc = gl.every(x => x.trust === gl[0].trust), anyHead = /any fleets/.test(sub) && !/suggested/.test(sub);
    for (const s of gl) {
      const st = DB.s && DB.s[s.id], prog = st && (Object.keys(st.done || {}).some(k => st.done[k]) || st.turn > 1) ? "<span class='prog'>· game in progress, turn " + st.turn + "</span>" : "";
      h += "<div class='card scard'><a class='cardlink' href='#/s/" + s.id + "/setup'>" + mapThumb(s) + "<div class='cbody'><div class='card-t'><h3>" + esc(s.name) + "</h3>" + (oneSrc ? "" : "<span class='badge t-" + s.trust + "'>" + TRUST[s.trust].l + "</span>") + "</div>" +
        "<div class='series'>" + esc(s.series) + "</div><div class='chips'>" + (anyHead && !s.suggest ? "" : "<span class='chip" + (s.suggest ? "" : " any") + "'>" + esc(sugText(s)) + "</span>") +
        (s.type ? "<span class='chip'>" + esc(s.type) + "</span>" : "") + (plChip(s) ? "<span class='chip'>" + plChip(s) + "</span>" : "") + tagChips(s) + "</div>" +
        "<p class='pitch'>" + esc(val(s.pitch, v0(s))) + "</p><div class='meta'>" + esc(val(s.glance, v0(s))[0][1]) + " · " + esc(BOOK[s.book]) + " " + prog + "</div></div></a>" + recCtl(s.id) + "</div>";
    }
    h += "</div>";
  }
  return h;
}
export function tagChips(s) { return (s.tags || []).map(t => "<span class='chip tag'>" + esc(t) + "</span>").join(""); }
export function filterPanel() {
  const f = lf(), facs = [...new Set(SC.flatMap(s => s.suggest || []))].sort(), [W, H] = tableWH();
  const chip = (act, k, l, on) => "<button class='fbtn' data-a='" + act + "' data-k='" + k + "' aria-pressed='" + !!on + "'>" + esc(l) + "</button>";
  return "<div class='fpanel'>" +
    "<div class='flrow'><span class='flbl'>Source</span>" + Object.keys(TRUST).map(k => chip("lft", k, TRUST[k].l, f.trust && f.trust[k])).join("") + "</div>" +
    "<div class='flrow'><span class='flbl'>Rules</span>" + Object.keys(BOOK).filter(k => SC.some(s => s.book === k) || (f.book && f.book[k])).map(k => chip("lfb", k, BOOK[k], f.book && f.book[k])).join("") + "</div>" +
    "<div class='flrow'><span class='flbl'>Players</span>" + PLAYERS.map(([k, l]) => chip("lfp", k, l, f.pl === k)).join("") + chip("lff", "", "Fits my table (" + W + " × " + H + ")", f.fits) + "</div>" +
    "<div class='flrow'><span class='flbl'>Size</span>" + SIZES.map(([k, l]) => chip("lfs", k, l, f.size === k)).join("") + "</div>" +
    "<div class='flrow'><span class='flbl'>Record</span>" + REC_LBL.map((l, i) => chip("lfr", String(i), l, f.rec === String(i))).join("") + chip("lfm", "", "★ Bookmarked", f.bm) + "</div>" +
    "<div class='flrow'><select data-a='lsug' aria-label='Suggested for'><option value=''>Suggested for: any fleet</option>" + facs.map(x => "<option value='" + esc(x) + "'" + (f.sug === x ? " selected" : "") + ">Suggested for: " + esc(x) + "</option>").join("") + "</select>" +
    "<select data-a='lsug2' aria-label='Against'><option value=''>vs any fleet</option>" + facs.map(x => "<option value='" + esc(x) + "'" + (f.sug2 === x ? " selected" : "") + ">vs " + esc(x) + "</option>").join("") + "</select>" +
    (f.sug || f.sug2 ? chip("lfa", "", "Ignore any fleets", f.noany) : "") +
    (lfActive(f) ? "<button class='btn' data-a='lfclr'>Clear filters</button>" : "") + "</div></div>";
}

export function renderList() {
  nav.innerHTML = "<a class='brand' href='#/'>Scenario Library<small>BFG</small></a>";
  document.title = "Scenario Library";
  if (CAT_OLD[DB.cat]) DB.cat = CAT_OLD[DB.cat];
  const cat = CATS.some(c => c[0] === DB.cat) ? DB.cat : "core", nf = lfActive(lf());
  let side = "<h1>Battlefleet Gothic scenarios</h1><p class='intro'>The scenarios of the BFG Remastered books, the classic Games Workshop and Fanatic publications, every scenario from the Warp Rift fan magazine and eight fan supplements, laid out for the table: what to bring, a map, a set-up checklist, turn reminders, dice tables and a victory check. Every scenario can be played with any fleets; some suggest the fleets they were written for. <a href='#/sources'>Where do these come from?</a></p>";
  side += "<div class='homecards'><a class='card prepcard' href='#/prep'><div class='card-t'><h3>Before the battle</h3><span class='badge t-rulebook'>Rulebook</span></div><p class='pitch'>Pick a scenario at random or with attack ratings, decide who attacks, and the pre-battle order (RB p. 120–123).</p></a>" +
    "<a class='card prepcard' href='#/subplots'><div class='card-t'><h3>Sub-plots</h3><span class='badge t-rulebook'>Rulebook</span></div><p class='pitch'>Roll a secret second goal for each player, see what to do and when, and browse all 18 (RB p. 124–127).</p></a></div>";
  side += "<h2 style='margin:18px 0 8px'>Your table</h2>" + tableCtl() + "<p class='small muted' style='margin:2px 0 0'>Every scenario map is drawn on this table. Rule distances stay as written; centre lines, thirds and far edges follow your table.</p>";
  let h = "<div class='varrow' style='margin:" + (layout() === "narrow" || SHORT_Q.matches ? "10px" : "16px") + " 0 8px'><div class='seg catseg' role='group' aria-label='Category'>" + CATS.map(([id, l]) => "<button data-a='cat' data-v='" + id + "' aria-pressed='" + (cat === id) + "'>" + esc(l) + " <span class='n'>" + SC.filter(s => inCat(s, id)).length + "</span></button>").join("") + "</div></div>";
  h += "<div class='searchrow'><input type='search' data-a='lq' value='" + esc(DB.lq || "") + "' placeholder='Search names, fleets, authors…' aria-label='Search scenarios'>" +
    "<button class='btn' data-a='lfo' aria-expanded='" + !!DB.fopen + "'>Filters" + (nf ? " (" + nf + ")" : "") + "</button></div>";
  if (DB.fopen) h += filterPanel();
  h += recLine();
  /* on a phone the list first (UX review 22.10.: the categories were at 768 px and the search at 869 px): a short intro,
     the categories and search, Before the battle and Sub-plots as a row of links, the table as a folding row (open/closed remembered) */
  if (layout() === "narrow" || SHORT_Q.matches) {
    const [W, H] = tableWH();
    app.innerHTML = "<h1>Battlefleet Gothic scenarios</h1><p class='intro'>Every BFG scenario laid out for the table: what to bring, a map, set-up steps, turn reminders, dice and a victory check. <a href='#/sources'>Where do these come from?</a></p>" +
      h + "<div class='quick'><a class='qlink' href='#/prep'>Before the battle ›</a><a class='qlink' href='#/subplots'>Sub-plots ›</a></div>" +
      "<details class='tbldet' data-k='tblopen'" + (DB.tblopen ? " open" : "") + "><summary>Your table: <b>" + W + " × " + H + " cm</b></summary>" + tableCtl() +
      "<p class='small muted' style='margin:2px 0 0'>Every scenario map is drawn on this table. Rule distances stay as written; centre lines, thirds and far edges follow your table.</p></details>" +
      "<div id='listzone'>" + listZone(cat) + "</div>";
    return;
  }
  h += "<div id='listzone'>" + listZone(cat) + "</div>";
  app.innerHTML = "<div class='homecols'><aside class='homeside'>" + side + "</aside><div class='homemain'>" + h + "</div></div>";
}
