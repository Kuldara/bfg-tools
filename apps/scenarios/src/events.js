import { bzOf } from "./battlezone.js";
import { clearImportNote, recOf } from "./bookkeeping.js";
import { SC, val } from "./data.js";
import { SPLIT_Q, listZone, prevSplit } from "./front-page.js";
import { esc } from "./helpers.js";
import { NARROW, SHORT_Q, WIDE_Q, XWIDE_Q, layout, mapNarrow } from "./layout.js";
import { R } from "./maps.js";
import { rollPool } from "./prep.js";
import { mapBlock, verdict } from "./scenario-page.js";
import { DB, d6, dn, get, num, prep, save, stOf, treeAt } from "./state.js";
import { FREE_SC, freeSt, spState, spTools } from "./subplots.js";
import { TABLES, tableWH } from "./table.js";
import { CATS, lf, listMatches, render, route } from "./views.js";
import { gridOf, n0Of, reinfAgain } from "./widgets.js";

/* ---------------------------------------------------------------- events */
export function moreCue(c) { c.classList.toggle("more", c.scrollHeight - c.scrollTop - c.clientHeight > 12); }

/* The page's listeners. Registered by boot() after the scenario files have
   loaded; the tests in Node never call this. */
export function wireEvents() {
  document.addEventListener("click", e => {
    const el = e.target.closest("[data-a]");
    if (!el || el.tagName === "INPUT") return;
    const a = el.dataset.a;
    if (a === "filter") { DB.filter = el.dataset.f; save(); render(true); return; }
    if (a === "cat") { DB.cat = el.dataset.v; save(); render(true); return; }
    if (a === "lv") { DB.lv = el.dataset.v === "names" ? "names" : ""; save(); render(true); return; }
    /* a name: its picture; on a narrow page a second tap on the same name folds it away */
    if (a === "nsel") { const id = el.dataset.id; DB.lsel = DB.lsel === id && !prevSplit() ? "" : id; save(); render(true); return; }
    if (a === "rec" || a === "bm") { e.preventDefault(); const r = recOf(el.dataset.id); if (a === "rec") r.s = (r.s + 1) % 3; else r.b = r.b ? 0 : 1; save(); render(true); return; }
    if (a === "recopen") { DB.recopen = !DB.recopen; save(); render(true); return; }
    if (a === "reccopy") { if (navigator.clipboard) navigator.clipboard.writeText(el.dataset.url).then(() => { el.textContent = "Copied"; }, () => {}); return; }
    if (route.view === "list" && ["lfo", "lft", "lfb", "lfp", "lff", "lfs", "lfa", "lfr", "lfm", "lfclr"].includes(a)) {
      const f = lf(), k = el.dataset.k;
      if (a === "lfo") DB.fopen = !DB.fopen;
      else if (a === "lft") { if (!f.trust) f.trust = {}; f.trust[k] = !f.trust[k]; }
      else if (a === "lfb") { if (!f.book) f.book = {}; f.book[k] = !f.book[k]; }
      else if (a === "lfp") f.pl = f.pl === k ? "" : k;
      else if (a === "lff") f.fits = !f.fits;
      else if (a === "lfa") f.noany = !f.noany;
      else if (a === "lfs") f.size = f.size === k ? "" : k;
      else if (a === "lfr") f.rec = f.rec === k ? "" : k;
      else if (a === "lfm") f.bm = !f.bm;
      else if (a === "lfclr") DB.lf = {};
      /* The bookkeeping row's number is for the whole library: if some hits are on another tab, go to the All tab,
         so the list shows as many as the button's number (otherwise "★ 3 bookmarked" on the Books tab = 0 scenarios). */
      if (el.dataset.all && (f.rec || f.bm)) { const cur = CATS.some(c => c[0] === DB.cat) ? DB.cat : "core"; if (listMatches(cur).length < listMatches("all").length) DB.cat = "all"; }
      save(); render(true); return;
    }
    if (a === "info" && route.view === "sc") { if (!DB.info) DB.info = {}; DB.info[route.id] = !DB.info[route.id]; save(); render(true); return; }
    if (route.view === "prep") {
      const p = prep();
      if (a === "ptyp") p.typ = p.typ === el.dataset.val ? "" : el.dataset.val;
      else if (a === "pface") { const f = +el.dataset.f; p.face = p.face === f ? 0 : f; }
      else if (a === "proll") { p.typ = d6() <= 3 ? "raid" : "battle"; p.face = d6(); }
      else if (a === "pbm") p.bmode = el.dataset.val;
      else if (a === "psrc") { if (!p.src) p.src = {};
        if (p.src.wr === false) { ["wro", "played", "untested"].forEach(k => { p.src[k] = false; }); delete p.src.wr; }
        p.src[el.dataset.k] = p.src[el.dataset.k] === false; }
      else if (a === "pbook") p.bookOnly = !p.bookOnly;
      else if (a === "pfits") p.fits = !p.fits;
      else if (a === "pnoany") p.noany = !p.noany;
      else if (a === "psize") p.size = p.size === el.dataset.k ? "" : el.dataset.k;
      else if (a === "pex") { if (!p.excl) p.excl = {}; p.excl[el.dataset.id] = !p.excl[el.dataset.id]; }
      else if (a === "plroll") rollPool(p);
      else if (a === "plclr") p.lpick = "";
      else if (a === "prat") { if (el.dataset.k === "rmode") p.rmode = el.dataset.val; else { p[el.dataset.k] = +el.dataset.val; p.d1 = p.d2 = null; } }
      else if (a === "pratroll") { p.d1 = Array.from({ length: p.r1 || 2 }, d6); p.d2 = Array.from({ length: p.r2 || 2 }, d6); }
      else return;
      save(); render(true); return;
    }
    if (route.view !== "sc" && route.view !== "subplots") return;
    const sc = route.view === "sc" ? SC.find(s => s.id === route.id) : FREE_SC, st = route.view === "sc" ? stOf(sc) : freeSt(), id = el.dataset.id;
    if (!st.w) st.w = {};
    const t = sc.tools.concat(sc.rtools || [], sc.stools || [], spTools(sc, st)).find(x => x.id === id);
    if (a === "step") { st.done[el.dataset.k] = !st.done[el.dataset.k]; }
    else if (a === "turn") { st.turn = Math.max(1, st.turn + (+el.dataset.d)); }
    else if (a === "tset") { st.turn = +el.dataset.t; }
    else if (a === "sps") { const ps = spState(st, el.dataset.k), val = +el.dataset.val; ps.t = ps.t === val ? undefined : val; }
    else if (a === "spf") { const ps = spState(st, el.dataset.side), f = +el.dataset.f; ps.e = ps.e === f ? 0 : f; }
    else if (a === "spr") { const ps = spState(st, el.dataset.side), r = d6(); ps.t = r <= 2 ? 0 : r <= 4 ? 1 : 2; ps.e = d6(); }
    else if (a === "spn") { st.sp[el.dataset.side] = {}; }
    else if (a === "sph") { const ps = spState(st, el.dataset.side); ps.hide = !ps.hide; }
    else if (a === "mw") { const val = el.dataset.val; st.w.mainwin = get(st, "mainwin", "") === val ? "" : val; }
    else if (a === "cnt2") { const own = sc.tools.concat(sc.rtools || [], sc.stools || []).find(x => x.id + "_n" === id); st.w[id] = Math.max(1, Math.min(20, get(st, id, own ? n0Of(own, st) : 4) + (+el.dataset.d))); }
    else if (a === "shr") { st.w[id] = Array.from({ length: get(st, id + "_n", t ? n0Of(t, st) : 4) }, () => t && t.roll ? t.roll() : d6()); }
    else if (a === "shc") { st.w[id] = null; }
    else if (a === "valset") { const k = el.dataset.k, raw = el.dataset.val, val = raw !== "" && !isNaN(+raw) ? +raw : raw; st.w[k] = get(st, k, 0) === val ? 0 : val; }
    else if (a === "valr") { st.w[id] = t.roll(); }
    else if (a === "slr" || a === "slf" || a === "sln" || a === "sle" || a === "slm" || a === "slc") {
      const r = Object.assign({ need: 5, found: 0, empty: false, pend: false, last: "" }, get(st, id, null) || {});
      const hit = () => { r.found++; r.need = 5; r.pend = r.found >= 2; }, miss = () => { r.need = Math.max(2, r.need - 1); };
      if (a === "slr" && r.pend) { const d = d6(); if (d <= r.found - 1) { r.empty = true; r.pend = false; r.last = "Rolled " + d + ": the hulk is empty."; } else { r.pend = false; r.last = "Rolled " + d + ": there is more to find."; } }
      else if (a === "slr") { const d = d6(), need = r.need; if (d >= need) { hit(); r.last = "Rolled " + d + " (needed " + need + "+): tech found!"; } else { miss(); r.last = "Rolled " + d + " (needed " + need + "+): nothing this time."; } }
      else if (a === "slf") { hit(); r.last = ""; }
      else if (a === "sln") { miss(); r.last = ""; }
      else if (a === "sle") { r.empty = true; r.pend = false; r.last = ""; }
      else if (a === "slm") { r.pend = false; r.last = ""; }
      else if (a === "slc") { r.need = 5; r.last = "A new crew starts searching at 5+."; }
      st.w[id] = r;
    }
    else if (a === "trk") { const path = (get(st, id, null) || []).slice(); path.push([treeAt(t, path), +el.dataset.i]); st.w[id] = path; }
    else if (a === "trb") { const path = (get(st, id, null) || []).slice(0, -1); st.w[id] = path; }
    else if (a === "rfr" || a === "rft") {
      const r = Object.assign({ arr: {}, last: null }, get(st, id, null) || {}); r.arr = Object.assign({}, r.arr);
      if (a === "rfr" && r.last && r.last[0] === st.turn && !reinfAgain(t, r, st.turn)) { /* already rolled this turn */ }
      else if (a === "rfr") { const n = dn(t.die || 20), i = t.rows.findIndex(x => x[0] === n), rep = i >= 0 && !!t.rows[i][2], fresh = i >= 0 && (rep || !r.arr[i]); if (fresh && !rep) r.arr[i] = st.turn; r.last = [st.turn, n, fresh]; }
      else { const i = +el.dataset.i; if (t.rows[i][2]) { /* a repeating row: not marked */ } else if (r.arr[i]) delete r.arr[i]; else r.arr[i] = st.turn; }
      st.w[id] = r;
    }
    else if (a === "trr") {
      const [W, H] = tableWH(), g = gridOf(W, H, t.size || 60), out = []; let unique = false;
      for (let i = 0; i < g.c * g.r; i++) { let d = d6(), r = t.rows.find(x => d >= x[0] && d <= x[1]);
        while (t.once && r[0] <= t.once && t.once <= r[1] && unique) { d = d6(); r = t.rows.find(x => d >= x[0] && d <= x[1]); }
        if (t.once && r[0] <= t.once && t.once <= r[1]) unique = true;
        out.push(r[3] || r[2]); }
      st.w[id] = out;
    }
    else if (a === "trc") { st.w[id] = null; }
    else if (a === "tmr") { st.w[id] = get(st, id, 0) ? 0 : Date.now(); }
    else if (a === "rr") { const n = get(st, id + "_n", 4), u = new Uint32Array(1); crypto.getRandomValues(u); st.w[id] = 1 + (u[0] % n); }
    else if (a === "var") { st.v = el.dataset.v; st.vSet = 1; }
    else if (a === "cnt") { const cur = get(st, id, t.start || 0), nv = cur + (+el.dataset.d); st.w[id] = Math.max(t.min || 0, t.max !== undefined ? Math.min(t.max, nv) : nv); }
    else if (a === "tog") { st.w[id] = !get(st, id, false); }
    else if (a === "obj") { st.w[id] = get(st, id, "") === el.dataset.val ? "" : el.dataset.val; }
    else if (a === "pick" || a === "end") { const i = +el.dataset.i; st.w[id] = get(st, id, -1) === i ? -1 : i; }
    else if (a === "face") { const f = +el.dataset.f; st.w[id] = get(st, id, 0) === f ? 0 : f; }
    else if (a === "rnd") { st.w[id] = t && t.d2 ? d6() + d6() : t && t.die ? dn(t.die) : d6(); }
    else if (a === "sec") { st.w[id] = +el.dataset.i; st.w[id + "_s"] = false; }
    else if (a === "secr") { st.w[id] = t.roll ? t.roll() : dn(t.opts.length) - 1; st.w[id + "_s"] = false; }
    else if (a === "secshow") { st.w[id + "_s"] = !get(st, id + "_s", false); }
    else if (a === "secclr") { st.w[id] = -1; st.w[id + "_s"] = false; }
    else if (a === "bset") { const k = el.dataset.k, val = +el.dataset.val; st.w[k] = (k === "f1" || k === "f2") && get(st, k, -1) === val ? -1 : val; }
    else if (a === "reset") { const keepV = st.v; DB.s[sc.id] = { turn: 1, v: keepV, done: {}, w: {} }; if (st.fl) DB.s[sc.id].fl = st.fl; }
    else if (a === "psec") { if (!DB.ph) DB.ph = {}; DB.ph[el.dataset.k] = !DB.ph[el.dataset.k]; }
    else if (a === "bzgo") { if (!st.bz) st.bz = {}; let s; do s = dn(999999); while (s === st.bz.seed); st.bz.seed = s; st.bz.ev = {}; if (st.bz.sel && st.bz.sel !== "zone" && st.bz.sel !== "sun") st.bz.sel = ""; }
    else if (a === "bzclr") { if (st.bz) { delete st.bz.seed; st.bz.sel = ""; st.bz.ev = {}; } }
    else if (a === "bzsel") { if (!st.bz) st.bz = {}; st.bz.sel = st.bz.sel === id ? "" : id; }
    else if (a === "bzev") {
      const res = bzOf(sc, st, st.v), k = el.dataset.k, R = BZ.EVENT_RULES[k], n = res ? res.meta.events[k] : 0;
      if (!n) return;
      if (!st.bz.ev) st.bz.ev = {};
      const T = st.bz.ev[st.turn] = st.bz.ev[st.turn] || {};
      if (T[k]) return;
      const dice = Array.from({ length: n }, d6), hit = dice.some(x => x >= R.trigger);
      T[k] = { dice, hit, lvl: hit && k === "radiation" ? d6() : 0 };
    }
    else return;
    save(); render(true);
  });
  document.addEventListener("change", e => {
    const el = e.target;
    if (el.dataset.a === "agr" && route.view === "sc") { render(true); return; }
    if ((el.dataset.a === "bzz" || el.dataset.a === "bzp") && route.view === "sc") {
      const st = stOf(SC.find(x => x.id === route.id)); if (!st.bz) st.bz = {};
      st.bz[el.dataset.a === "bzz" ? "z" : "p"] = el.value; save(); render(true); return;
    }
    if (el.dataset.a === "flp" && route.view === "sc") {
      const st = stOf(SC.find(x => x.id === route.id)); if (!st.fl) st.fl = {};
      st.fl[el.dataset.k] = el.value; save(); render(true); return;
    }
    if (el.dataset.a === "psug" && route.view === "prep") { prep().sug = el.value; save(); render(true); return; }
    if (el.dataset.a === "psug2" && route.view === "prep") { prep().sug2 = el.value; save(); render(true); return; }
    if (el.dataset.a === "lsug" && route.view === "list") { lf().sug = el.value; save(); render(true); return; }
    if (el.dataset.a === "lsug2" && route.view === "list") { lf().sug2 = el.value; save(); render(true); return; }
    if (el.dataset.a !== "tblsel") return;
    if (el.value === "custom") {
      const [W, H] = tableWH(); DB.table = { w: W, h: H, c: true }; save();
      const i = document.querySelector("[data-a='tblin'][data-k='w']"); if (i) { i.focus(); i.select(); }
      return;
    }
    const [w, h] = el.value.split("x").map(Number);
    DB.table = { w, h }; save(); render(true);
  });
  let lqFrame = 0;
  document.addEventListener("input", e => {
    const el = e.target;
    if (el.dataset.a === "lq" && route.view === "list") {
      DB.lq = el.value; save();
      cancelAnimationFrame(lqFrame);
      lqFrame = requestAnimationFrame(() => { const z = document.getElementById("listzone"); if (z) z.innerHTML = listZone(CATS.some(c => c[0] === DB.cat) ? DB.cat : "core"); });
      return;
    }
    if (el.dataset.a === "tblin") {
      const n = parseInt(el.value, 10);
      if (!(n >= 40 && n <= 400)) return;
      const [W, H] = tableWH();
      DB.table = { w: W, h: H }; DB.table[el.dataset.k] = n;
      const pre = TABLES.find(t => t[0] === DB.table.w && t[1] === DB.table.h);
      if (!pre) DB.table.c = true;
      save();
      document.querySelectorAll("[data-a='tblsel']").forEach(sel => { sel.value = pre ? pre[0] + "x" + pre[1] : "custom"; });
      const z = document.getElementById("mapzone");
      if (z && route.view === "sc") { const sc = SC.find(x => x.id === route.id); z.innerHTML = mapBlock(sc, stOf(sc).v); }
      return;
    }
    if (el.dataset.a === "agr" && route.view === "sc") {
      const sc = SC.find(x => x.id === route.id), st = stOf(sc); if (!st.w) st.w = {};
      st.w["ag_" + el.dataset.id] = el.value; save();
      const z = document.getElementById("mapzone"); if (z) z.innerHTML = mapBlock(sc, st.v);
      return;
    }
    if (el.dataset.a === "txt" && (route.view === "sc" || route.view === "subplots")) {
      const st = route.view === "sc" ? stOf(SC.find(x => x.id === route.id)) : freeSt(); if (!st.w) st.w = {};
      st.w[el.dataset.id] = el.value; save(); return;
    }
    if (el.dataset.a !== "num" || route.view !== "sc") return;
    const sc = SC.find(s => s.id === route.id), st = stOf(sc), t = sc.tools.concat(sc.rtools || [], sc.stools || []).find(x => x.id === el.dataset.id);
    if (!st.w) st.w = {};
    st.w[el.dataset.id] = el.value;
    save();
    const out = document.querySelector("[data-after='" + el.dataset.id + "']");
    if (out) out.innerHTML = t.after(num(st, el.dataset.id));
    const vd = document.querySelector(".verdict");
    if (vd) { const r = verdict(sc, st, st.v); vd.className = "verdict " + (r[0] || ""); vd.innerHTML = "<span class='k'>Result</span>" + esc(r[1]) + "<small>" + esc(r[2]) + "</small>"; }
  });
  /* the wide Set-up's map column scrolls inside itself: "More below" shows while there is more below (UX review 22.10.) */
  document.addEventListener("scroll", e => { const c = e.target; if (c && c.matches && c.matches(".mapstick > .col:last-child")) moreCue(c); }, true);
  /* the roll log: open/closed remembered (it does not close by itself on a redraw) */
  document.addEventListener("toggle", e => {
    const el = e.target;
    if (el.dataset && el.dataset.k === "tblopen") { if (!!DB.tblopen !== el.open) { DB.tblopen = el.open; save(); } return; }
    if (!el.dataset || (el.dataset.k !== "bzlog" && el.dataset.k !== "bzfull") || route.view !== "sc") return;
    const st = stOf(SC.find(x => x.id === route.id)), key = el.dataset.k === "bzlog" ? "log" : "full"; if (!st.bz) st.bz = {};
    if (st.bz[key] !== el.open) { st.bz[key] = el.open; save(); }
  }, true);
  /* keyboard (PC): 1–4 tabs, ← → the turn on the Play tab. Not inside fields, not with modifier keys. */
  document.addEventListener("keydown", e => {
    if (e.ctrlKey || e.metaKey || e.altKey || e.repeat) return;
    const tg = e.target;
    if (tg && (tg.tagName === "INPUT" || tg.tagName === "SELECT" || tg.tagName === "TEXTAREA" || tg.isContentEditable)) return;
    if (route.view !== "sc") return;
    const TABS = ["setup", "subplots", "play", "result"];
    if (/^[1-4]$/.test(e.key)) { const t = TABS[+e.key - 1]; if (route.tab !== t) location.hash = "#/s/" + route.id + "/" + t; e.preventDefault(); return; }
    if (route.tab === "play" && (e.key === "ArrowRight" || e.key === "ArrowLeft")) {
      const sc = SC.find(s => s.id === route.id), st = stOf(sc);
      if (sc.type === "Campaign") return;
      const nt = Math.max(1, st.turn + (e.key === "ArrowRight" ? 1 : -1));
      if (nt !== st.turn) { st.turn = nt; save(); render(true); }
      e.preventDefault();
    }
  });
  window.addEventListener("hashchange", () => { if (!/^#\/rec\//.test(location.hash)) clearImportNote();
    const prev = route, y = window.scrollY;
    render(false);
    const head = document.querySelector(".shead");
    if (prev.view === "sc" && route.view === "sc" && prev.id === route.id && head) {
      /* tab switch: keep the tab bar where it was instead of jumping to the top */
      const top = head.getBoundingClientRect().bottom + window.scrollY - document.getElementById("top").offsetHeight;
      window.scrollTo(0, Math.min(y, top));
    } else window.scrollTo(0, 0);
  });
  window.addEventListener("resize", () => document.documentElement.style.setProperty("--topH", document.getElementById("top").offsetHeight + "px"));
  NARROW.addEventListener("change", () => render(true));
  [WIDE_Q, XWIDE_Q, SHORT_Q, SPLIT_Q].forEach(q => q.addEventListener("change", () => render(true)));
  let lastMapNarrow = null;
  window.addEventListener("resize", () => { const n = mapNarrow(); if (lastMapNarrow !== null && n !== lastMapNarrow) render(true); lastMapNarrow = n; });
}
