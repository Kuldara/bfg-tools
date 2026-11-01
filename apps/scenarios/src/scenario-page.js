import { recCtl } from "./bookkeeping.js";
import { infoPanel } from "./credits.js";
import { BOOK, SC, TRUST, val } from "./data.js";
import { tagChips } from "./front-page.js";
import { SIDECLS, esc, fmt, pickV, seg, sugText, vis, whoTag } from "./helpers.js";
import { SHORT_Q, cols, layout } from "./layout.js";
import { lowOrbitBlock } from "./low-orbit.js";
import { mapSize } from "./map-svg.js";
import { SRC_TABLE, fitOf, hideBtn, hsec, mapFn, mapOf, phHidden, playMapBlock } from "./maps.js";
import { origHtml } from "./originals.js";
import { DB, num, prep, stOf } from "./state.js";
import { allSteps, spOf, spPlay, spResultBlock, spSides, subplotsView } from "./subplots.js";
import { TABLES, tableWH, tpl } from "./table.js";
import { bzBox, bzCtl, bzEvTool, bzPlay, mapFig, terrHint } from "./terrain-legend.js";
import { turnTrack } from "./turn-track.js";
import { agreeBlock, agreeList, app, nav, route } from "./views.js";
import { widget } from "./widgets.js";

export function tabLink(sc, tab, label, cur, extra, cls, title) {
  return "<a href='#/s/" + sc.id + "/" + tab + "'" + (cls ? " class='" + cls + "'" : "") + (title ? " title='" + title + "'" : "") + (cur === tab ? " aria-current='page'" : "") + ">" + label + (extra || "") + "</a>";
}
export function stepKey(sc, x) { return x.k || String(sc.steps.indexOf(x)); }

export function renderSc() {
  const sc = SC.find(s => s.id === route.id), st = stOf(sc);
  if (sc.variants && !sc.variants.some(x => x[0] === st.v)) st.v = sc.variants[0][0];
  if (!sc.variants) st.v = "std";
  const v = st.v, tab = route.tab;
  document.title = sc.name + " · Scenario Library";
  const steps = allSteps(sc, st, v), nd = steps.filter(x => st.done[stepKey(sc, x)]).length, nsp = spSides(sc).filter(x => spOf(st, x)).length;
  const tabsIn = "<div class='tabs-in'>" + tabLink(sc, "setup", "Set-up", tab, "<span class='n'>" + nd + "/" + steps.length + "</span>") + tabLink(sc, "subplots", "Sub-plots", tab, nsp ? "<span class='n'>" + nsp + "</span>" : "", nsp ? "" : "opt", "Optional: a secret second goal for each player (RB p. 124)") + tabLink(sc, "play", "Play", tab, "<span class='n'>T" + st.turn + "</span>") + tabLink(sc, "result", "Result", tab) + "</div>";
  /* when wide the tabs are in the top bar: one sticky row between the back link and BFG Tools */
  const topTabs = layout() !== "narrow";
  nav.innerHTML = "<a class='back' href='#/'>‹ Scenarios</a>" + (topTabs ? "<nav class='tabs toptabs' aria-label='Scenario tabs'>" + tabsIn + "</nav>" : "") +
    "<button class='navclr' data-a='reset' title='New game: clear this scenario’s progress (your record mark stays)'>Clear progress</button>";
  let h = "<div class='shead'><div class='series'>" + esc(sc.series) + "</div><h1>" + esc(sc.name) + "</h1>" +
    "<div class='chips'><span class='badge t-" + sc.trust + "'>" + TRUST[sc.trust].l + "</span><span class='badge bk'>" + esc(BOOK[sc.book]) + "</span><span class='chip" + (sc.suggest ? "" : " any") + "'>" + esc(sugText(sc)) + "</span>" + tagChips(sc) + recCtl(sc.id, true) + "</div>" +
    "<div class='src'>Source: " + esc(sc.src) + origHtml(sc) + " · <a href='#/sources'>about the sources</a></div><div class='why'>" + esc(sc.why) +
    (sc.rate ? "<span class='rate'><b>Our note:</b> " + esc(sc.rate) + "</span>" : "") + "</div>" +
    "<button class='btn infobtn' data-a='info' aria-expanded='" + !!(DB.info && DB.info[sc.id]) + "'>ⓘ Background & credits</button>" + (DB.info && DB.info[sc.id] ? infoPanel(sc) : "") + "</div>";
  if (!topTabs) h += "<nav class='tabs'>" + tabsIn + "</nav>";
  const vp = varPending(sc, st);
  if (sc.variants) h += "<div class='varrow'><span>" + (vp ? "Set-up: to be decided" : "Version") + "</span><div class='seg' role='group'>" + sc.variants.map(([id, l]) => "<button data-a='var' data-v='" + id + "' aria-pressed='" + (!vp && v === id) + "'>" + esc(l) + "</button>").join("") + "</div></div>";
  if (tab === "setup") h += setupView(sc, st, v, steps, nd);
  else if (tab === "subplots") h += subplotsView(sc, st, v);
  else if (tab === "play") h += playView(sc, st, v);
  else h += resultView(sc, st, v);
  app.innerHTML = h;
}

export function sideCards(sc, lists) {
  return "<div class='sides'>" + Object.keys(sc.sides).filter(k => lists[k]).map(k =>
    "<div class='side " + k + "'><h3><span class='" + SIDECLS[k] + "'>" + esc(sc.sides[k].n) + "</span><small>" + esc(sc.sides[k].f && !/^any( fleets?)?$/i.test(sc.sides[k].f) ? "suggested: " + sc.sides[k].f : "any fleet") + "</small></h3><ul>" +
    lists[k].map(x => "<li>" + fmt(x) + "</li>").join("") + "</ul></div>").join("") + "</div>";
}

export function tableCtl() {
  const [W, H] = tableWH(), custom = !!(DB.table && DB.table.c) || !TABLES.some(t => t[0] === W && t[1] === H);
  return "<div class='tblctl'><select data-a='tblsel' aria-label='Table size'>" +
    TABLES.map(([w, h, ft]) => "<option value='" + w + "x" + h + "'" + (!custom && w === W && h === H ? " selected" : "") + ">" + w + " × " + h + " cm" + (ft ? " — " + ft : "") + "</option>").join("") +
    "<option value='custom'" + (custom ? " selected" : "") + ">Custom size</option></select>" +
    "<span class='tblin'><input type='number' inputmode='numeric' min='40' max='400' data-a='tblin' data-k='w' value='" + W + "' aria-label='Table length in cm'><span>×</span>" +
    "<input type='number' inputmode='numeric' min='40' max='400' data-a='tblin' data-k='h' value='" + H + "' aria-label='Table width in cm'><span class='muted'>cm</span></span></div>";
}
export function bzLegend(m) {
  if (!m.bz) return "";
  const me = m.bz.meta;
  return "<span><i class='bzsw'></i>Rolled phenomena</span>" + (!m.bz.sunMap && me.sunEdge !== "none" ? "<span><i style='background:var(--sun)'></i>Sunward" + (me.sunDie ? " (rolled)" : "") + "</span>" : "");
}
/* a set-up decided only at the table (formations and a roll): before the choice the map is empty (owner 21.10.) */
export const PENDING_VAR = {
  "fleet-engagement": "Enter both formations in the\nFormations tool and roll off (step 3)",
  "fan-p-art-command-1": "Enter both formations in the\nFormations tool and roll off (step 3)",
  "fan-b-chance": "Enter both formations in the\nFormations tool and roll off (step 4)"
};
/* decided only when the set-up is chosen in this game (st.vSet; New game resets it). An earlier saved st.v is not enough:
   the owner saw last time's Set-up B although this game's formations had not been chosen (21.10.) */
export function varPending(sc, st) { return !!PENDING_VAR[sc.id] && !st.vSet; }
export function mapBlock(sc, v) {
  const [W, H] = tableWH(), fit = fitOf(sc, v), src = sc.srcTable || SRC_TABLE[sc.id], st = stOf(sc), m = mapOf(sc, v);
  if (varPending(sc, st)) {
    const e = Object.assign({}, m, { items: [{ z: "text", x: W / 2, y: H / 2, l: "Set-up to be decided\n" + PENDING_VAR[sc.id] }] });
    return bzCtl(sc, st, v, e) + "<div class='mapwrap'>" + mapFig(e) + "<div class='legend'>" + bzLegend(e) + "<span class='msize'>" + mapSize(W, H) + "</span></div></div>" + bzBox(sc, st, v, e);
  }
  if (!mapFn(sc)) return bzCtl(sc, st, v, m) + "<div class='mapwrap'>" + (m.bz ? mapFig(m) + "<div class='legend'>" + bzLegend(m) + terrHint(m) + "<span class='msize'>" + mapSize(W, H) + "</span></div>" : "") + "<div class='mapnote' style='padding:10px 6px'>" + esc(val(sc.noMap, v) || "This scenario has no fixed table layout.") + "</div></div>" + bzBox(sc, st, v, m);
  let h = bzCtl(sc, st, v, m) + "<div class='mapwrap'>" + mapFig(m) + "<div class='legend'>" + (sc.legend || Object.keys(sc.sides).map(k => [k, sc.sides[k].n])).map(([k, n]) => "<span><i style='background:var(--" + k + ")'></i>" + esc(n) + "</span>").join("") + bzLegend(m) + terrHint(m) + "<span class='msize'>" + mapSize(W, H) + "</span></div>" +
    (val(sc.mapNote, v) ? "<div class='mapnote'>" + esc(tpl(val(sc.mapNote, v), sc, stOf(sc))) + "</div>" : "") +
    (src && (src[0] !== W || src[1] !== H) ? "<div class='mapnote'>The source plays on " + src[0] + " × " + src[1] + " cm.</div>" : "") + "</div>";
  if (W < fit[0] || H < fit[1]) h += "<div class='note' style='margin-top:8px'><b>Small table.</b> This scenario’s distances need at least " + fit[0] + " × " + fit[1] + " cm. On " + W + " × " + H + " cm some zones overlap or run off the table.</div>";
  return h + bzBox(sc, st, v, m);
}

/* Fleet-specific scenario rules (0.14, data in scenarios/fleet-rules.js). Owner 23.10.: "Tyranids get +1 to Escalating
   Engagement's ship arrival rolls ... does the scenario database notice this and say so?" The players choose their
   fleets (optional, saved in the scenario's state st.fl), and the page says what the Fleets Book changes. Without a
   choice every fleet rule of this scenario shows; the general ones ("*") only for a chosen fleet. */
export function fleetHits(sc, st) {
  const pk = st.fl || {}, sides = Object.keys(sc.sides), on = [], off = [];
  fleetRulesFor(sc, pk).forEach(r => {
    const rs = fleetRuleSide(r, sc);
    if (r.bad && pk[r.bad] === r.f) on.push({ r, k: r.bad, bad: true });
    const ks = sides.filter(k => pk[k] === r.f && (!rs || rs === k) && k !== r.bad);
    if (ks.length) ks.forEach(k => on.push({ r, k }));
    else if (!(r.bad && pk[r.bad] === r.f) && r.sc !== "*" && !r.ok) off.push(r);
  });
  return { pk, sides, on, off };
}
export function fleetBlock(sc, st) {
  const { pk, sides, on, off } = fleetHits(sc, st), pg = r => " <span class='pg'>" + esc(r.p) + "</span>";
  const side = (r, k) => (k ? "<span class='" + SIDECLS[k] + "'>" + esc(sc.sides[k].n) + "</span> · " : "") + esc(r.f);
  let h = "<div class='flpicks'>" + sides.map(k => "<label class='flpick'><span class='" + SIDECLS[k] + "'>" + esc(sc.sides[k].n) + "</span><select data-a='flp' data-k='" + k + "' aria-label='" + esc(sc.sides[k].n) + ": fleet'><option value=''>Fleet: not chosen</option>" +
    FLEET_LIST.map(f => "<option" + (pk[k] === f ? " selected" : "") + ">" + esc(f) + "</option>").join("") + "</select></label>").join("") + "</div>";
  h += on.sort((x, y) => (y.bad ? 1 : 0) - (x.bad ? 1 : 0)).map(x => "<div class='flrule" + (x.bad ? " bad" : "") + "'><span class='fh'>" + (x.bad ? "Not allowed · " : "") + side(x.r, x.k) + "</span>" + fmt(x.r.t) + pg(x.r) + "</div>").join("");
  const none = sides.filter(k => pk[k] && !on.some(x => x.k === k)).map(k => esc(pk[k]));
  if (none.length) h += "<p class='calc' style='margin:0 0 8px'>" + none.join(" and ") + ": no Fleets book changes for this scenario — play it as written.</p>";
  /* the other fleets' rules fold, so Set-up does not grow on a phone (the UX review: Set-up was 5 300 px) */
  if (off.length) h += "<details class='fixed' style='margin-top:" + (on.length || none.length ? 8 : 0) + "px'><summary>" + (on.length || none.length ? "Other fleets with their own rules here" : "Fleets with their own rules here") + ": " + [...new Set(off.map(r => esc(r.f)))].join(", ") + "</summary>" +
    (on.length || none.length ? "" : "<p class='small muted' style='margin:8px 0 0'>Choose the fleets above to see only what applies to you.</p>") +
    "<ul class='flother'>" + off.map(r => { const rs = fleetRuleSide(r, sc); return "<li><b>" + esc(r.f) + "</b>" + (rs ? " (" + esc(sc.sides[rs].n) + ")" : r.bad ? " (not as " + esc(sc.sides[r.bad].n) + ")" : "") + ": " + fmt(r.t) + pg(r) + "</li>"; }).join("") + "</ul></details>";
  else if (!on.length && !none.length) h += "<p class='small muted' style='margin:0'>No fleet list changes in this scenario. Choose the fleets to see rules that apply in every scenario (e.g. Necron victory points).</p>";
  return hsec("fleetrules", "Fleet rules for this scenario", h);
}
export function fleetPlay(sc, st) { return fleetHits(sc, st).on.filter(x => x.r.play).map(x => ({ w: x.r.w || "All game", s: x.k, t: x.r.f + ": " + x.r.play })); }
/* the arrival roll bonus for the chosen fleet (Tyranids +1, FL p. 428) */
export function fleetArr(id, st) { const sc = SC.find(x => x.id === id), { on } = fleetHits(sc, st); return on.filter(x => x.r.arr).map(x => [x.r.f, x.r.arr]); }

export function setupView(sc, st, v, steps, nd) {
  const pitch = "<p class='pitch' style='margin-top:14px'>" + esc(val(sc.pitch, v)) + "</p>";
  const glance = "<div class='glance'>" + val(sc.glance, v).map(([k, x]) => "<div class='gl'><b>" + esc(k) + "</b><span>" + esc(x) + "</span></div>").join("") + "</div>";
  /* UX review 22.10.: Set-up was 5 300 px on a phone and the steps started only at about 1 500 px. A player who knows
     the scenario hides the reading sections (Hide); the choice applies to every scenario, as in Play. */
  const bring = hsec("bring", "Bring to the table", "<div class='bring'>" + val(sc.bring, v).map(x => "<span>" + fmt(x) + "</span>").join("") + "</div>");
  let forcesB = sideCards(sc, val(sc.forces, v));
  if (val(sc.fixed, v)) forcesB += "<details class='fixed'><summary>Or use the published fixed forces</summary>" + sideCards(sc, val(sc.fixed, v)) + "</details>";
  forcesB += "<div class='others'><b>" + (sc.suggest ? "Playing with other fleets" : "Fleets") + "</b> " + fmt(val(sc.others, v)) + "</div>";
  const forces = hsec("forces", "Forces", forcesB), others = fleetBlock(sc, st);
  const stools = (sc.stools || []).filter(x => vis(x, v)), stH = stools.length ? "<h2>Set-up tools</h2>" + stools.map(t => widget(sc, st, v, t)).join("") : "";
  const table = "<h2>Table</h2>" + tableCtl() + "<div id='mapzone'>" + mapBlock(sc, v) + "</div>";
  let stepsH = "<h2>Set-up, step by step</h2><div class='donebar'>" + nd + " of " + steps.length + " done · tap a step when it is done</div><ol class='steps'>";
  steps.forEach((x, i) => {
    const k = stepKey(sc, x), d = !!st.done[k];
    stepsH += "<li><button class='stepbtn' data-a='step' data-k='" + k + "' aria-pressed='" + d + "'><span class='num'>" + (d ? "✓" : i + 1) + "</span><span class='txt'>" + whoTag(sc, x.s) + fmt(tpl(x.t, sc, st)) + "</span></button></li>";
  });
  stepsH += "</ol>";
  const notes = val(sc.notes, v), refs = val(sc.refs, v);
  const notesH = notes && notes.length ? hsec("notes", "Source notes", notes.map(n => "<div class='note'><b>Note.</b> " + fmt(n) + "</div>").join("")) : "";
  const refsH = refs && refs.length ? hsec("refs", "Rules you will need", "<div class='refs'>" + refs.map(([a, b]) => "<span>" + esc(a) + "</span><span>" + esc(b) + "</span>").join("") + "</div>") : "";
  const foot = "<p class='small muted' style='margin-top:18px'>Optional sub-plots: the <a href='#/s/" + sc.id + "/subplots'>Sub-plots</a> tab. The pre-battle order: the <a href='#/prep'>Before the battle</a> page.</p>";
  const pre = (sc.stoolsFirst ? stH : "") + agreeBlock(sc, st), post = sc.stoolsFirst ? "" : stH, L = layout();
  const lo = lowOrbitBlock(sc, st), loH = lo ? hsec("lowo", "Low orbit table <span class='bzcite'>RB p. 116</span>", lo) : "";
  if (L === "narrow") return pitch + glance + bring + forces + others + pre + table + loH + stepsH + post + notesH + refsH + foot;
  /* turned phone: details | map + steps. Wide: text, steps and tools on the left, the map sticks on the right
     (visible while using the steps and the tools that change the map). xwide: the steps in a column of their own. */
  if (SHORT_Q.matches) return cols([[pitch, glance, bring, forces, others, notesH, refsH, foot], [pre, table, loH, stepsH, post]], "c-setup");
  if (L === "wide") return cols([[pitch, glance, bring, forces, others, pre, stepsH, post, loH, notesH, refsH, foot], [table]], "c-setup mapstick");
  return cols([[pitch, glance, bring, forces, others, foot], [table, loH, notesH, refsH], [pre, stepsH, post]], "c-setup");
}

export function playView(sc, st, v) {
  const max = sc.turnMax ? sc.turnMax(v) : 0;
  const camp = sc.type === "Campaign";
  const turnH = camp ? "" : "<div class='turnpanel'><div class='turnbar'><span class='lbl'>Turn</span><button class='sq' data-a='turn' data-d='-1' aria-label='Previous turn'" + (st.turn <= 1 ? " disabled" : "") + ">−</button><span class='val'>" + st.turn + "</span><button class='sq' data-a='turn' data-d='1' aria-label='Next turn'>+</button>" + (max ? "<span class='of'>of " + max + "</span>" : "") + hideBtn("turn", "Show turn guide", "Hide guide") + "</div>" + (phHidden("turn") ? "" : turnTrack(sc, st, v)) + "</div>";
  const campH = camp ? sc.tools.filter(x => vis(x, v)).map(t => widget(sc, st, v, t)).join("") : "";
  const rem = sc.play.filter(x => vis(x, v)).concat(spPlay(sc, st), bzPlay(sc, st), fleetPlay(sc, st));
  const rulesH = hsec("rules", "Scenario rules in play", agreeList(sc, st) + "<ul class='rem'>" + rem.map(x => "<li><div class='when'>" + (x.s ? "<span class='" + SIDECLS[x.s] + "'>" + esc(sc.sides[x.s].n) + "</span> · " : "") + esc(x.w) + "</div>" + fmt(tpl(x.t, sc, st)) + "</li>").join("") + "</ul>");
  const tools = camp ? [] : sc.tools.filter(x => vis(x, v)), bzT = camp ? "" : bzEvTool(sc, st);
  const toolsH = tools.length || bzT ? hsec("tools", "Tools", bzT + tools.map(t => widget(sc, st, v, t)).join("")) : "";
  const reset = "<div class='reset'>Finished, or starting over? <button class='btn' data-a='reset'>New game: clear this scenario’s progress</button></div>";
  /* the map during the game (0.10): under the turn, smaller than in Set-up */
  const lo = lowOrbitBlock(sc, st), pmapH = playMapBlock(sc, st, v) + (lo ? hsec("lowo", "Low orbit table", lo) : "");
  const L = layout();
  if (L === "narrow") return turnH + pmapH + campH + rulesH + toolsH + reset;
  /* when wide: the turn (sticky) and the tools on the left, the map and rules on the right - the map does not end up
     under the sticky turn panel; xwide: the tools in a column of their own */
  if (camp) return cols([[campH], [pmapH, rulesH, reset]], "c-play");
  if (L === "wide" || !toolsH) return cols([[turnH, toolsH], [pmapH, rulesH, reset]], "c-play" + (toolsH ? "" : " even"));
  return cols([[turnH, reset], [pmapH, rulesH], [toolsH]], "c-play");
}

/* The verdict shows: an untouched game gets no ready winner, and sc.provisional(st, v) marks the verdict
   provisional (the Planetary Assault family: until the VPs are entered). */
export function verdict(sc, st, v) {
  const r = sc.result(st, v, sc);
  if (!r || !r[0]) return r;
  const ids = [].concat(sc.tools || [], sc.rtools || []).map(t => t.id).filter(Boolean);
  const touched = st.turn > 1 || ids.some(id => { const x = st.w[id]; return !(x === undefined || x === null || x === "" || x === 0 || x === false || x === -1 || (Array.isArray(x) && !x.length)); });
  if (!touched) return [null, "Nothing recorded yet", "Record the battle on the Play tab and below; the verdict follows."];
  if (sc.provisional && sc.provisional(st, v) && !/if it ended now|so far/.test(r[1])) return [r[0], r[1] + " — if it ended now", r[2]];
  return r;
}
export function resultView(sc, st, v) {
  const r = verdict(sc, st, v);
  const verdictH = "<div class='verdict " + (r[0] || "") + "'><span class='k'>Result</span>" + esc(r[1]) + "<small>" + esc(r[2]) + "</small></div>";
  const endH = "<h2>The game ends when</h2><ul class='plain'>" + pickV(sc.end, v).map(x => "<li>" + fmt(tpl(x, sc, st)) + "</li>").join("") + "</ul>";
  const winH = "<h2>Victory</h2><ul class='plain'>" + pickV(sc.win, v).map(x => "<li>" + fmt(tpl(x, sc, st)) + "</li>").join("") + "</ul>";
  const tools = (sc.rtools || []).filter(x => vis(x, v)), counters = sc.tools.filter(x => vis(x, v) && x.res);
  const checkH = tools.length || counters.length ? "<h2>Check</h2>" + counters.map(t => widget(sc, st, v, t)).join("") + tools.map(t => widget(sc, st, v, t)).join("") : "";
  const spH = spResultBlock(sc, st, v, r);
  /* agreed points about the game's end or victory are also shown next to the verdict (spot check 21.10.): the
     verdict counts by the source or the default, and the players see what they agreed */
  const agH = agreeList(sc, st, x => x.v || /length|tie|draw|result|victor|win|score|band|lose|escape|captur|defeat/i.test(x.l));
  if (layout() === "narrow") return verdictH + agH + endH + winH + checkH + spH;
  /* when wide: the verdict and the inputs on the left (sticky), rules and sub-plots on the right */
  return cols([[verdictH, agH, checkH], [endH, winH, spH]], "c-res even");
}
