/* Scenario Library map test (20.10.2026): text placement on the maps.

   Born from a finding: Mobeel Narrows' "Chaos zone (size not given)" spilled
   over its zone box. The test looks for the same class of defect on every map.

   Use: serve the built site (npm run serve), open the Scenario Library in a
   browser and run this file's contents in the page context. Returns JSON: the
   errors (err) and warnings (warn) grouped by scenario + defect + text, and
   on which tables and font sizes they show.

   Every map is drawn with the app's own mapSVG(mapOf(...)) into a
   hidden container, and the real size of the texts is measured in the browser
   (getBoundingClientRect, which also accounts for rotated texts).

   Checks (err):
     ZONE     a zone's (rect) own text does not fit in the zone
     CUT      a text is cut at the picture's edge (outside the viewBox)
     OVERLAP  two texts on top of each other
   Warnings (warn):
     EDGE     a text is half inside the table and half outside
     PLANET   a text on a planet
     MARK     a text on a marker (diamond)

   Tables: every mat in the drop-down (TABLES). A table smaller than the
   scenario's fit() is skipped: the app already warns about it ("Small table").
   Font size: both a wide (5.4·S) and a narrow screen (6.8·S, NARROW).

   Tolerance: 0.6 % of the table width (anti-aliasing of the text edge and
   rounding of the font metrics). */
/* the page's names, from the bundle's namespace (apps/scenarios/src/index.js) */
const { NARROW, SC, TABLES, fitOf, get, mapFn, mapOf, mapSVG, v0 } = window.SL;
const DB = SL.DB;   /* a let: read once, its object is never replaced on the page */
(async () => {
  const host = document.createElement("div");
  host.style.cssText = "position:absolute;left:-12000px;top:0;width:1000px;visibility:hidden";
  document.body.appendChild(host);
  const oldT = DB.table, narrowDesc = Object.getOwnPropertyDescriptor(NARROW, "matches");
  let narrowFlag = false;
  Object.defineProperty(NARROW, "matches", { configurable: true, get: () => narrowFlag });
  const found = new Map(), counts = { maps: 0, texts: 0, skippedSmall: 0 };
  const add = (sev, sc, kind, text, where, detail) => {
    const k = sev + "|" + sc.id + "|" + kind + "|" + text;
    if (!found.has(k)) found.set(k, { sev, id: sc.id, kind, text, detail, where: [] });
    const f = found.get(k); if (f.where.length < 6) f.where.push(where);
  };
  const inter = (a, b) => Math.max(0, Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0)) * Math.max(0, Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0));
  const area = a => (a.x1 - a.x0) * (a.y1 - a.y0);
  try {
    for (const sc of SC) {
      if (!mapFn(sc)) continue;
      const vs = sc.variants ? sc.variants.map(x => x[0]) : [null];
      for (const v of vs) for (const [W, H] of TABLES) {
        DB.table = { p: "custom", w: W, h: H };
        const fit = fitOf(sc, v || v0(sc));
        if (W < fit[0] || H < fit[1]) { counts.skippedSmall++; continue; }
        /* 0.10: in-game maps (scenarios/play-maps.js) with the same checks, pt = turn (0 = Set-up) */
        const pts = [0].concat(typeof PLAYMAP !== "undefined" && PLAYMAP[sc.id] && PLAYMAP[sc.id].draw ? [1, 2, 3, 4, 6, 8] : []);
        for (const [nf, pt] of [false, true].flatMap(nf => pts.map(pt => [nf, pt]))) {
          narrowFlag = nf; window.__mapNarrow = nf; /* mapNarrow() reads this before layout (0.7: the map's column width) */
          const vv = v || v0(sc), m = mapOf(sc, vv, pt);
          host.innerHTML = mapSVG(m);
          const svg = host.querySelector("svg"), vb = svg.getAttribute("viewBox").split(/\s+/).map(Number);
          const sr = svg.getBoundingClientRect(), k = vb[2] / sr.width, tol = 0.006 * W;
          const where = (v ? v + " · " : "") + W + "×" + H + (nf ? " · phone" : "") + (pt ? " · play T" + pt : "");
          counts.maps++;
          /* the rolled terrain's (0.9) labels A1, C2 … are drawn under the scenario's texts on purpose
             (the .bzl layer): they are not part of the placement check; terrain.js checks terrain */
          const texts = [...svg.querySelectorAll("text")].filter(t => !t.closest(".bzl")).map(t => {
            const r = t.getBoundingClientRect();
            return { el: t, s: t.textContent.trim(), ax: +t.getAttribute("x"), ay: +t.getAttribute("y"),
              x0: vb[0] + (r.left - sr.left) * k, x1: vb[0] + (r.right - sr.left) * k, y0: vb[1] + (r.top - sr.top) * k, y1: vb[1] + (r.bottom - sr.top) * k };
          }).filter(t => t.s && t.x1 > t.x0);
          /* the map's own size text "W × H cm" in the bottom right corner is not checked */
          const own = texts.filter(t => t.s !== W + " × " + H + " cm");
          counts.texts += own.length;
          /* CUT */
          for (const t of own) if (t.x0 < vb[0] - tol || t.x1 > vb[0] + vb[2] + tol || t.y0 < vb[1] - tol || t.y1 > vb[1] + vb[3] + tol)
            add("err", sc, "CUT", t.s, where, "outside the image by " + Math.max(vb[0] - t.x0, t.x1 - vb[0] - vb[2], vb[1] - t.y0, t.y1 - vb[1] - vb[3]).toFixed(1));
          /* OVERLAP */
          for (let i = 0; i < own.length; i++) for (let j = i + 1; j < own.length; j++) {
            const a = own[i], b = own[j], o = inter(a, b);
            if (o > 0.12 * Math.min(area(a), area(b))) add("err", sc, "OVERLAP", a.s + "  ⟷  " + b.s, where, Math.round(100 * o / Math.min(area(a), area(b))) + "% of the smaller");
          }
          /* ZONE */
          for (const it of m.items) {
            if (it.z !== "rect" || !it.l) continue;
            const cx = it.x + it.w / 2, cy = it.y + it.h / 2, label = String(it.l).replace(/\s+/g, "");
            /* the same text may be in two zones: the one nearest the zone's centre;
               the drawer may split a text into lines, so the comparison ignores spaces */
            /* the drawer may move a text inside the table: the nearest one of the same name by its centre */
            const t = own.filter(t => t.s.replace(/\s+/g, "") === label)
              .sort((p, q) => Math.hypot((p.x0 + p.x1) / 2 - cx, (p.y0 + p.y1) / 2 - cy) - Math.hypot((q.x0 + q.x1) / 2 - cx, (q.y0 + q.y1) / 2 - cy))[0];
            if (!t) continue;
            const over = Math.max(it.x - t.x0, t.x1 - (it.x + it.w), it.y - t.y0, t.y1 - (it.y + it.h));
            if (over > tol) add("err", sc, "ZONE", label, where, "sticks out of its " + it.w.toFixed(0) + "×" + it.h.toFixed(0) + " zone by " + over.toFixed(1));
          }
          /* EDGE, PLANET, MARK */
          const S = (W + 30) / 210;
          for (const t of own) {
            const cross = (lo, hi, line) => lo < line - tol && hi > line + tol;
            const inside = t.x1 > 0 && t.x0 < W && t.y1 > 0 && t.y0 < H;
            if (inside && (cross(t.x0, t.x1, 0) || cross(t.x0, t.x1, W) || cross(t.y0, t.y1, 0) || cross(t.y0, t.y1, H)))
              add("warn", sc, "EDGE", t.s, where, "crosses the table edge");
            for (const it of m.items) {
              if (it.z === "planet") {
                const nx = Math.max(t.x0, Math.min(it.cx, t.x1)), ny = Math.max(t.y0, Math.min(it.cy, t.y1));
                if (Math.hypot(nx - it.cx, ny - it.cy) < it.r * 0.8) add("warn", sc, "PLANET", t.s, where, "over a planet");
              }
              if (it.z === "mark") {
                const r = 3.2 * S * 0.8;
                if (it.x + r > t.x0 && it.x - r < t.x1 && it.y + r > t.y0 && it.y - r < t.y1) add("warn", sc, "MARK", t.s, where, "over a marker");
              }
            }
          }
        }
      }
    }
  } finally {
    if (narrowDesc) Object.defineProperty(NARROW, "matches", narrowDesc); else delete NARROW.matches;
    delete window.__mapNarrow;
    DB.table = oldT; host.remove();
  }
  const list = [...found.values()].sort((a, b) => (a.sev > b.sev ? 1 : -1) || a.id.localeCompare(b.id));
  return JSON.stringify({ counts, err: list.filter(f => f.sev === "err").length, warn: list.filter(f => f.sev === "warn").length,
    items: list.map(f => f.sev + " " + f.kind + " " + f.id + " :: " + f.text + " :: " + f.detail + " :: " + f.where.join(" | ")) });
})();
