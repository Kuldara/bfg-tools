import { importRec, recB, recS } from "./bookkeeping.js";
import { INFO } from "./credits.js";
import { FAN_TAG, SC, TAG_ALIAS, TRUST, WR_TAG, v0, val } from "./data.js";
import { moreCue } from "./events.js";
import { renderList } from "./front-page.js";
import { esc, vis } from "./helpers.js";
import { applyLayout, layout } from "./layout.js";
import { fitsTable, renderPrep } from "./prep.js";
import { renderSc } from "./scenario-page.js";
import { DB, num, prep } from "./state.js";
import { renderSources, renderSubplots } from "./subplots.js";

/* ---------------------------------------------------------------- views */
export const app = document.getElementById("app"), nav = document.getElementById("nav");
export let route = { view: "list" };
/* Views a separate script adds to the page, { name: render }. The discovery lab
   (lab/lab.js, linked only in BFG_LAB=1 builds) registers "lab" here. */
export const EXTRA_VIEWS = {};

/* tests/browser.js renders every route without touching the hash (Chrome throttles
   history.replaceState after about a hundred calls): a hook returns the route instead */
export let routeHook = null;
export function setRouteHook(f) { routeHook = f; }
export function parseHash() {
  const h = location.hash.replace(/^#\/?/, "").split("/");
  if (h[0] === "s" && SC.some(s => s.id === h[1])) return { view: "sc", id: h[1], tab: ["setup", "subplots", "play", "result"].includes(h[2]) ? h[2] : "setup" };
  if (h[0] === "prep") return { view: "prep" };
  if (h[0] === "subplots") return { view: "subplots" };
  if (h[0] === "sources") return { view: "sources" };
  if (EXTRA_VIEWS[h[0]]) return { view: h[0], tab: h[1] || "" };
  return { view: "list" };
}
export function render(keepScroll) {
  const y = window.scrollY, stick = document.querySelector(".mapstick > .col:last-child"), sy = stick ? stick.scrollTop : 0;
  if (/^#\/rec\//.test(location.hash)) { importRec(decodeURIComponent(location.hash.slice(6))); try { history.replaceState(null, "", "#/"); } catch (e) {} }
  route = (routeHook && routeHook()) || parseHash();
  applyLayout();
  if (route.view === "list") renderList(); else if (route.view === "prep") renderPrep(); else if (route.view === "subplots") renderSubplots(); else if (route.view === "sources") renderSources(); else if (EXTRA_VIEWS[route.view]) EXTRA_VIEWS[route.view](); else renderSc();
  document.documentElement.style.setProperty("--topH", document.getElementById("top").offsetHeight + "px");
  const tb = document.querySelector("main .tabs");
  document.documentElement.style.setProperty("--tabsH", (tb ? tb.offsetHeight : 0) + "px");
  if (keepScroll) window.scrollTo(0, y);
  const stick2 = document.querySelector(".mapstick > .col:last-child");
  if (keepScroll && stick2 && sy) stick2.scrollTop = sy;
  if (stick2) moreCue(stick2);
}

export const CATS = [["core", "Core 10"], ["campaign", "Books"], ["classic", "Classic GW"], ["wr", "Warp Rift"], ["fan", "Fan supplements"], ["all", "All"]];
export const CL_GRPS = ["cl-ws", "cl-mag", "cl-inv", "cl-fan"];
export const WR_GRPS = ["committee", "lore", "community", "untested"];
/* fan supplements (21.10.): Tournament Mission Pack + Advanced Scenarios, Book of Nemesis, Project Distant Darkness, Starblade */
export const FAN_GRPS = ["fan-tour", "fan-nem", "fan-pdd", "fan-sb", "fan-botv"];
/* Warp Rift is one category, in issue order (secOf, wrIssue). wro/comm = saves from 0.7 */
export const CAT_GRPS = { campaign: ["campaign", "fleets"], classic: CL_GRPS, wr: WR_GRPS, fan: FAN_GRPS };
export const CAT_OLD = { wro: "wr", comm: "wr" };
export function secOf(s) { return WR_GRPS.includes(s.grp) ? "wr" : s.grp; }
export function wrIssue(s) { const m = /Warp Rift (\d+)/.exec(s.src || ""); return m ? +m[1] : 99; }
/* run once, when every scenario file is loaded. Open points (a), our note (r) and tags (t): for WR from
   scenarios/wr-rating.js (WR_RATE), for the others from scenarios/open-points.js (OPEN). Agree first = a tag when an
   open point decides the victory (v: 1) or the source is a sketch (sketch: 1); not a class or a grade. */
export function wrInit() {
  const rate = typeof WR_RATE === "undefined" ? {} : WR_RATE, open = typeof OPEN === "undefined" ? {} : OPEN;
  for (const sc of SC) {
    const wr = WR_GRPS.includes(sc.grp), r = (wr ? rate[sc.id] : open[sc.id]) || {};
    sc.agree = r.a || [];
    sc.rate = r.r || "";
    sc.tags = (wr ? (WR_TAG[sc.grp] || []).concat(/^wr-sw-/.test(sc.id) ? ["Play both sides"] : []) : (FAN_TAG[sc.grp] || [])).concat(r.t || [], r.sketch || sc.agree.some(x => x.v) ? ["Agree first"] : []);
    if (wr) sc.trust = "wr";
  }
}
/* agreed values (Agree before you start): an empty field = the default. Saved in st.w["ag_" + id]. */
export function agItems(sc, st) { const v = st && st.v; return (sc && sc.agree || []).filter(x => !v || vis(x, v)); }
export function agItem(sc, id, st) { return agItems(sc, st).find(x => x.id === id) || (sc && sc.agree || []).find(x => x.id === id); }
export function agV(sc, st, id) {
  const it = agItem(sc, id, st), x = st && st.w ? st.w["ag_" + id] : undefined;
  return x !== undefined && String(x).trim() !== "" ? String(x).trim() : it ? String(it.d) : "";
}
/* a numeric value for the map: empty, zero, negative or text -> the default; over it.max (default 60 cm) is drawn at the maximum */
export function agN(sc, st, id) {
  const it = agItem(sc, id, st), n = parseFloat(String(agV(sc, st, id)).replace(",", ".")), d = it && typeof it.d === "number" ? it.d : 0;
  return isFinite(n) && n > 0 ? Math.min(n, it && it.max || 60) : d;
}
export function agreeBlock(sc, st) {
  const items = agItems(sc, st);
  if (!items.length) return "";
  return "<h2>Agree before you start</h2><div class='agrbox'><p class='small muted' style='margin:0 0 8px'>The source leaves these open. Each has a default — from the nearest official scenario, or our own suggestion — so change it if you agree something else.</p>" +
    items.map(x => {
      const cur = st.w && st.w["ag_" + x.id] !== undefined ? st.w["ag_" + x.id] : "", num = typeof x.d === "number";
      /* a number = a one-line field; text = a wrapping text area, so a long default shows whole on a phone too */
      const field = num
        ? "<input type='text' inputmode='decimal' class='n' data-a='agr' data-id='" + x.id + "' value='" + esc(cur) + "' placeholder='" + esc(String(x.d)) + "' aria-label='" + esc(x.l) + "'>"
        : "<textarea rows='" + Math.min(4, Math.max(1, Math.ceil(String(x.d).length / 34))) + "' data-a='agr' data-id='" + x.id + "' placeholder='" + esc(String(x.d)) + "' aria-label='" + esc(x.l) + "'>" + esc(cur) + "</textarea>";
      return "<label class='agr'><span class='agl'>" + esc(x.l) + "</span><span class='agi'>" + field + (x.u ? "<span class='u'>" + esc(x.u) + "</span>" : "") + "</span>" +
        "<span class='ags'>" + (x.o ? "Our suggestion" + (x.s ? " — " + esc(x.s.replace(/^(Our )?suggestion\s*[,:]?\s*/i, "").replace(/^\((.*)\)$/, "$1")) : "") : "Default from " + esc(x.s || "the rulebook")) + "</span></label>";
    }).join("") + "</div>";
}
export function agreeList(sc, st, only) {
  const items = agItems(sc, st).filter(x => !only || only(x));
  if (!items.length) return "";
  return "<div class='agreed'><b>Agreed before the game</b> (Set-up tab)<ul>" + items.map(x => "<li><span class='k'>" + esc(x.l) + ":</span> " + esc(agV(sc, st, x.id)) + (x.u ? " " + esc(x.u) : "") + "</li>").join("") + "</ul></div>";
}
export function inCat(s, c) { return c === "all" || (CAT_GRPS[c] ? CAT_GRPS[c].includes(s.grp) : s.grp === c); }
export const PLAYERS = [["2", "2 players"], ["3", "3 or more"], ["1", "Solo"]];
/* scenario size (0.12, owner 21.10.: "about 750, 1250, and 1500 or bigger"): classes by the bigger side's points,
   the table scenarios/sizes.js. "any" (an agreed size, campaigns) shows in every class like any fleets; a missing row = any. */
export const SIZES = [["S", "Small (up to 1000)"], ["M", "Medium (1000–1500)"], ["L", "Large (1500+)"]];
export function sizeOk(sc, k) {
  const z = k && typeof SIZE !== "undefined" ? SIZE[sc.id] : null;
  return !z || z.s === "any" || z.s.includes(k);
}
export function plChip(s) {
  const pl = [].concat(s.players || 2);
  if (pl.length === 1 && pl[0] === 2) return "";
  const w = pl.map(n => n === 1 ? "Solo" : n === 3 ? "3+" : String(n));
  return pl.length === 1 ? (pl[0] === 1 ? "Solo" : pl[0] === 3 ? "3+ players" : pl[0] + " players") : w.join(" or ") + (pl.some(n => n > 1) ? " players" : "");
}
export function lf() {
  if (!DB.lf) DB.lf = {};
  const t = DB.lf.trust;
  /* saves from 0.7: four Warp Rift sources -> one */
  if (t && ["committee", "lore", "community", "untested"].some(k => k in t)) {
    if (["committee", "lore", "community", "untested"].some(k => t[k])) t.wr = true;
    ["committee", "lore", "community", "untested"].forEach(k => delete t[k]);
  }
  return DB.lf;
}
export function lfActive(f) {
  return Object.values(f.trust || {}).filter(Boolean).length + Object.values(f.book || {}).filter(Boolean).length + (f.fits ? 1 : 0) + (f.pl ? 1 : 0) + (f.size ? 1 : 0) + (f.sug ? 1 : 0) + (f.sug2 ? 1 : 0) + (f.noany && (f.sug || f.sug2) ? 1 : 0) + (f.rec ? 1 : 0) + (f.bm ? 1 : 0);
}
export function hay(sc) {
  const i = sc.info || INFO[sc.id];
  const tags = (sc.tags || []).map(t => t + " " + (TAG_ALIAS[t] || "")).join(" ");
  return [sc.name, sc.series, val(sc.pitch, v0(sc)), sc.src, sc.why || "", (sc.suggest || []).join(" "), Object.values(sc.sides).map(x => x.n + " " + (x.f || "")).join(" "), i ? i.cr.join(" ") : "", sc.type || "",
    TRUST[sc.trust].l, tags].join(" ").toLowerCase();
}
export function listMatches(cat) {
  const f = lf(), q = (DB.lq || "").trim().toLowerCase(), tr = Object.keys(f.trust || {}).filter(k => f.trust[k]), bk = Object.keys(f.book || {}).filter(k => f.book[k]);
  return SC.filter(sc => (q ? true : inCat(sc, cat)) &&
    (!q || q.split(/\s+/).every(w => hay(sc).includes(w))) &&
    (!tr.length || tr.includes(sc.trust)) && (!bk.length || bk.includes(sc.book)) &&
    (!f.fits || fitsTable(sc)) && (!f.pl || [].concat(sc.players || 2).some(n => f.pl === "3" ? n >= 3 : String(n) === f.pl)) && sizeOk(sc, f.size) &&
    (!f.rec || String(recS(sc.id)) === f.rec) && (!f.bm || recB(sc.id)) &&
    /* two fleets (owner 21.10.: "ork vs imperium"): both in the recommendation; any fleets scenarios stay in,
       unless "Ignore any fleets" is on (owner 23.10.: "could add an ignore-any choice as a checkbox") */
    (!sc.suggest ? !(f.noany && (f.sug || f.sug2)) : [f.sug, f.sug2].every(g => !g || sc.suggest.some(x => x.includes(g)))));
}
