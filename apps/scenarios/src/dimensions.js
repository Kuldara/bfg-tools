import { esc } from "./helpers.js";
import { R } from "./maps.js";

/* ---------------------------------------------------------------- dimensions (0.9.3)
   Measurements (owner 21.10.): every fixed feature's position and size is read from the table's edges, so the map
   can be reproduced on your own table. A general engine, not hand work on 245 maps:
   - Features: zones and fields (rect, hatch, poly), planets, markers, circles and rings, corner circles, dividing
     lines and turn markers. free: 1 = the position is free (the source: "anywhere", "up to" ...), no measurements;
     free: "x" / "y" = free in that direction only; nr: 1 = no radius measurement (the size is given elsewhere).
   - A hand-made dim is a constraint: when one end is known, so is the other. A bare number from the table's edge
     ("45 cm") becomes an edge measurement; conditional ones ("up to 100 cm", "at least 60 cm") stay where they are.
   - Missing measurements are added outside the table: x measurements to the nearer edge (top/bottom), y to the
     sides. The left half is measured from the left edge and the right half from the right; features of the same
     half as a chain on one row.
   - Radius: a line from the centre to the circumference and "R30" outside it, unless the map's text already gives
     the number ("within 30 cm").
   - Rolled terrain (0.9) gets no measurements (owner: "that terrain is not to the millimetre"); the grid is in the legend.
   m.dims (after mapSVG) lists the drawn measurements; tests/measurements.js checks from them that every fixed
   feature is measured and every number matches the geometry. */
export const DIM_E = .05;
export const DIM_PURE = /^\s*\d+(\.\d+)?\s*(cm)?\s*$/;
export function dimNum(v) { const r = Math.round(Math.abs(v) * 10) / 10; return Math.abs(r - Math.round(r)) < .05 ? String(Math.round(r)) : r.toFixed(1); }
/* a planet at the centre of a circle: its radius (0 if there is no planet) */
export function dimHub(items, c) { const p = items.find(p => p.z === "planet" && Math.abs(p.cx - c.cx) < DIM_E && Math.abs(p.cy - c.cy) < DIM_E && p.r < c.r); return p ? p.r : 0; }
/* features to measure: { ax, v, side, px, py, force }; side = the edge the measurement is drawn on; (px, py) = start of the extension line */
export function dimFeatures(items, W, H) {
  const E = DIM_E, lim = ax => ax === "x" ? W : H, inner = (ax, v) => v > E && v < lim(ax) - E;
  const lab = { t: 0, b: 0, l: 0, r: 0 };
  for (const it of items) if (it.z === "edge") lab[it.e] += it.l ? 2 : 1; else if (it.z === "sun") lab[it.e || "l"] += 2;
  /* the nearer edge; exactly in the middle, the one with fewer edge texts */
  const pick = (a, b, da, db) => Math.abs(da - db) < E ? (lab[a] <= lab[b] ? a : b) : da < db ? a : b;
  const sX = (y0, y1) => pick("t", "b", y0, H - y1), sY = (x0, x1) => pick("l", "r", x0, W - x1);
  const feats = [], links = [], keep = [], radial = [];
  const fx = (v, side, px, py, force) => { if (inner("x", v)) feats.push({ ax: "x", v, side, px, py, force }); };
  const fy = (v, side, px, py, force) => { if (inner("y", v)) feats.push({ ax: "y", v, side, px, py, force }); };
  const pt = (it, x, y) => { if (it.free !== "x") fx(x, sX(y, y), x, y); if (it.free !== "y") fy(y, sY(x, x), x, y); };
  const texts = items.map(it => String(it.l || "")).join("\n");
  const said = r => new RegExp("(^|[^\\d.])" + dimNum(r).replace(".", "\\.") + "\\s?cm").test(texts);
  /* around a planet the radius is also read from the planet's edge (the planet symbol's size is only a picture) */
  const stated = it => { const r0 = dimHub(items, it); return said(it.r) || (r0 > 0 && said(it.r - r0)); };
  for (const it of items) {
    const z = it.z;
    if (it.free === 1 || it.free === true) { if (z === "dim") keep.push(it); continue; }
    if (z === "rect" || z === "hatch") {
      if (it.w < E || it.h < E) continue;
      const sx = sX(it.y, it.y + it.h), sy = sY(it.x, it.x + it.w), ey = sx === "t" ? it.y : it.y + it.h, ex = sy === "l" ? it.x : it.x + it.w;
      if (it.free !== "x") { fx(it.x, sx, it.x, ey); fx(it.x + it.w, sx, it.x + it.w, ey); }
      if (it.free !== "y") { fy(it.y, sy, ex, it.y); fy(it.y + it.h, sy, ex, it.y + it.h); }
    } else if (z === "poly") for (const [x, y] of it.pts) pt(it, x, y);
    else if (z === "planet") pt(it, it.cx, it.cy);
    else if (z === "mark" || z === "cm") pt(it, it.x, it.y);
    /* gas and asteroid bands (gas/ast): width and distance come from the steps; only the centre is measured */
    else if (z === "circ" || z === "ring") { pt(it, it.cx, it.cy); if (!it.nr && !it.gas && !it.ast && !stated(it)) radial.push(it); }
    else if (z === "corner") { const x = it.c[1] === "l" ? it.r : W - it.r, t = it.c[0] === "t"; fx(x, t ? "t" : "b", x, t ? 0 : H); }
    else if (z === "line") {
      if (Math.abs(it.x1 - it.x2) < E) { const y0 = Math.min(it.y1, it.y2), y1 = Math.max(it.y1, it.y2), s = sX(y0, y1); fx(it.x1, s, it.x1, s === "t" ? y0 : y1); }
      else if (Math.abs(it.y1 - it.y2) < E) { const x0 = Math.min(it.x1, it.x2), x1 = Math.max(it.x1, it.x2), s = sY(x0, x1); fy(it.y1, s, s === "l" ? x0 : x1, it.y1); }
    } else if (z === "tick") { for (const [x] of it.list) fx(x, it.e, x, it.e === "t" ? 0 : H); }
    else if (z === "dim") {
      const hz = Math.abs(it.y1 - it.y2) < E, ax = hz ? "x" : "y", a = hz ? it.x1 : it.y1, b = hz ? it.x2 : it.y2, pure = DIM_PURE.test(String(it.l));
      const end = !inner(ax, a) && inner(ax, b) ? b : !inner(ax, b) && inner(ax, a) ? a : null;
      if (pure && end !== null && !it.keep) { if (hz) fx(end, it.y1 < H / 2 ? "t" : "b", end, it.y1, 1); else fy(end, it.x1 < W / 2 ? "l" : "r", it.x1, end, 1); }
      else { keep.push(it); if (pure) links.push([ax, a, b]); }
    }
  }
  return { feats, links, keep, radial };
}
/* the measurement plan: which values are measured from the edges (the fewest, the shortest first), where extension lines start */
export function dimPlan(items, W, H) {
  const E = DIM_E, lim = ax => ax === "x" ? W : H, F = dimFeatures(items, W, H);
  const det = { x: [0, W], y: [0, H] }, has = (ax, v) => det[ax].some(d => Math.abs(d - v) < E);
  const learn = (ax, v) => {
    if (has(ax, v)) return; det[ax].push(v);
    for (const [a, p, q] of F.links) if (a === ax) { if (Math.abs(p - v) < E) learn(ax, q); else if (Math.abs(q - v) < E) learn(ax, p); }
  };
  const chosen = [], add = f => { chosen.push({ ax: f.ax, v: f.v, side: f.side }); learn(f.ax, f.v); };
  for (const f of F.feats) if (f.force && !chosen.some(c => c.ax === f.ax && Math.abs(c.v - f.v) < E)) add(f);
  const near = f => Math.min(f.v, lim(f.ax) - f.v);
  for (const f of F.feats.filter(f => !f.force).sort((p, q) => near(p) - near(q))) if (!has(f.ax, f.v)) add(f);
  /* the extension line starts from the farthest feature with the same value on the same edge (the nearer ones lie along it) */
  for (const c of chosen) {
    const same = F.feats.filter(f => f.ax === c.ax && f.side === c.side && Math.abs(f.v - c.v) < E), real = same.filter(f => !f.force), pool = real.length ? real : same;
    const far = f => c.side === "t" ? f.py : c.side === "b" ? H - f.py : c.side === "l" ? f.px : W - f.px;
    c.from = pool.reduce((p, q) => far(q) > far(p) ? q : p);
  }
  return { chosen, keep: F.keep, radial: F.radial, links: F.links };
}
/* measurements as SVG: edge rows outside the table, hand-made ones in place, and radii; also returns the edges' space */
export function dimSVG(m, S, fs, boxes) {
  const W = m.w, H = m.h, E = DIM_E, fd = fs * .8, al = 3 * S, plan = dimPlan(m.items, W, H), list = [];
  let body = "", over = "";
  /* the same colour as the numbers: in the dark theme --chart-frame would stay too dim */
  const ink = "var(--chart-label)", line = (x1, y1, x2, y2, extra) => "<line x1='" + x1 + "' y1='" + y1 + "' x2='" + x2 + "' y2='" + y2 + "' stroke='" + ink + "'" + extra + "/>";
  const txt = (x, y, l, rot) => { const w = String(l).length * fd * .6, h = fd * 1.1;
    boxes.push(rot ? { x0: x - h / 2, x1: x + h / 2, y0: y - w / 2, y1: y + w / 2, dim: 1 } : { x0: x - w / 2, x1: x + w / 2, y0: y - h / 2, y1: y + h / 2, dim: 1 });
    return "<text x='" + x + "' y='" + y + "' text-anchor='middle' dominant-baseline='middle' font-size='" + fd + "' font-weight='600' fill='var(--chart-label)'" + (rot ? " transform='rotate(" + rot + " " + x + " " + y + ")'" : "") + ">" + esc(l) + "</text>"; };
  /* a dimension line with arrows; on a short span the arrows from outside */
  const arrow = (x1, y1, x2, y2) => {
    const len = Math.hypot(x2 - x1, y2 - y1);
    if (len >= 2 * al + S) return line(x1, y1, x2, y2, " stroke-width='.45' marker-start='url(#da)' marker-end='url(#da)'");
    const ux = (x2 - x1) / (len || 1), uy = (y2 - y1) / (len || 1);
    return line(x1, y1, x2, y2, " stroke-width='.45'") + line(x1 - ux * 2.6 * al, y1 - uy * 2.6 * al, x1, y1, " stroke-width='.45' marker-end='url(#da)'") + line(x2 + ux * 2.6 * al, y2 + uy * 2.6 * al, x2, y2, " stroke-width='.45' marker-end='url(#da)'");
  };
  /* the edges' reserved space: the edge line and its text, the sunward edge's text */
  const ext = { t: 0, b: 0, l: 0, r: 0 }, o = 2.2 * S;
  for (const it of m.items) {
    if (it.z === "edge") ext[it.e] = Math.max(ext[it.e], it.l ? o + fs * ({ t: 1.05, b: 1.15, l: .9, r: 1 })[it.e] + fs * .62 : o + 1.3 * S);
    else if (it.z === "sun") { const e = it.e || "l", c = 2.2 + fs * .9; ext[e] = Math.max(ext[e], (e === "b" ? c + fs * .1 : e === "t" ? 2.2 + fs * .9 : c) + fs * .62); }
  }
  const pad = { t: 0, b: 0, l: 0, r: 0 };
  for (const side of ["t", "b", "l", "r"]) {
    const vals = plan.chosen.filter(c => c.side === side);
    if (!vals.length) continue;
    const hz = side === "t" || side === "b", L = hz ? W : H, D = ext[side] ? ext[side] + 2.4 * S : 3.4 * S, ov = 1.6 * S;
    /* the row's position: top/left negative, bottom/right past the table */
    const at = d => side === "t" || side === "l" ? -d : (hz ? H : W) + d;
    /* a half: at most two values are measured from the edge (the rule's number stays, the other row further out),
       more (grids, turn markers) as a chain on one row */
    const RS = fd * 1.35 + 1.4 * S, rowD = k => D + (k - 1) * RS;
    const lo = vals.filter(c => c.v <= L / 2 + E).sort((p, q) => p.v - q.v), hi = vals.filter(c => c.v > L / 2 + E).sort((p, q) => q.v - p.v);
    const segs = [];
    const half = (cs, o) => {
      if (!cs.length) return 0;
      if (cs.length <= 2) { cs.forEach((c, k) => { c.row = k + 1; segs.push({ a: Math.min(o, c.v), b: Math.max(o, c.v), row: k + 1, o }); }); return cs.length; }
      let p = o; for (const c of cs) { c.row = 1; segs.push({ a: Math.min(p, c.v), b: Math.max(p, c.v), row: 1, o, chain: 1 }); p = c.v; } return 1;
    };
    const nLo = half(lo, 0), nHi = half(hi, L), rows = Math.max(nLo, nHi);
    let far = rowD(rows) + fd * 1.3;
    /* extension lines: dashed from the feature to the edge, solid outside the edge up to its own row */
    const thin = " stroke-width='.35' opacity='.75'";
    for (const c of vals) {
      const f = c.from, to = at(rowD(c.row) + ov);
      if (hz) { const edgeY = side === "t" ? 0 : H; if (Math.abs(f.py - edgeY) > E) body += line(c.v, f.py, c.v, edgeY, " stroke-width='.35' stroke-dasharray='1.2 1.2' opacity='.6'"); over += line(c.v, edgeY, c.v, to, thin); }
      else { const edgeX = side === "l" ? 0 : W; if (Math.abs(f.px - edgeX) > E) body += line(f.px, c.v, edgeX, c.v, " stroke-width='.35' stroke-dasharray='1.2 1.2' opacity='.6'"); over += line(edgeX, c.v, to, c.v, thin); }
    }
    /* the table's corner is where measurements start: the edge extended outwards */
    for (const [n, o] of [[nLo, 0], [nHi, L]]) if (n) { const to = at(rowD(n) + ov), e0 = side === "t" || side === "l" ? 0 : (hz ? H : W); over += hz ? line(o, e0, o, to, thin) : line(e0, o, to, o, thin); }
    let prev = null;
    for (const sg of segs.sort((p, q) => p.row - q.row || p.a - q.a)) {
      const { a, b, row } = sg, l = dimNum(b - a), tl = l.length * fd * .6, mid = (a + b) / 2, rowP = at(rowD(row));
      over += hz ? arrow(a, rowP, b, rowP) : arrow(rowP, a, rowP, b);
      const fits = b - a >= tl + 2 * al + .8 * S;
      let c = mid, pos = at(rowD(row) + fd * .72);
      if (!sg.chain && !fits) c = sg.o === 0 ? b + 1.2 * S + tl / 2 : a - 1.2 * S - tl / 2;   /* a short one measured from the edge: the number outside */
      else if (sg.chain) {
        /* in a chain, a number that does not fit or would hit the previous one is staggered outwards */
        const hit = prev && prev.row === row && mid - tl / 2 < prev.hi + .8 * S;
        if (!fits || hit) { pos = at(rowD(row) + fd * 1.85); far = Math.max(far, rowD(row) + fd * 2.45); } else prev = { row, hi: mid + tl / 2 };
      }
      over += hz ? txt(Math.min(W - tl / 2, Math.max(tl / 2, c)), pos, l) : txt(pos, c, l, side === "l" ? -90 : 90);
      list.push({ kind: "edge", ax: hz ? "x" : "y", side, a, b, l });
    }
    pad[side] = far + .8 * S;
  }
  /* hand-made measurements in place (thin, a small number; "60 cm" -> "60") */
  for (const it of plan.keep) {
    const hz = Math.abs(it.y1 - it.y2) < E, l0 = String(it.l), l = DIM_PURE.test(l0) ? l0.replace(/\s*cm\s*$/, "") : l0, tl = l.length * fd * .6;
    over += arrow(it.x1, it.y1, it.x2, it.y2);
    if (l) {
      const half = tl / 2 + fd * .5, right = it.x1 + 2 * half <= W - .5 || it.x1 >= W;
      let ly = it.y1 - fd * .9;
      if (ly - fd * .6 < 0 && it.y1 >= 0) ly = it.y1 + fd * .9;
      over += hz ? txt(Math.min(W - tl / 2, Math.max(tl / 2, (it.x1 + it.x2) / 2)), ly, l) : txt(right ? it.x1 + half : it.x1 - half, (it.y1 + it.y2) / 2, l);
    }
    list.push({ kind: "hand", ax: hz ? "x" : "y", a: hz ? it.x1 : it.y1, b: hz ? it.x2 : it.y2, l: l0, free: !!it.free });
  }
  /* radii: a line from the centre (or from the planet's edge) to the circumference, the number outside it where it
     does not hit texts; around a planet the number is the distance from the planet's edge ("30"), otherwise the radius ("R30") */
  for (const it of plan.radial) {
    const r0 = dimHub(m.items, it), l = r0 ? dimNum(it.r - r0) : "R" + dimNum(it.r), tl = l.length * fd * .6, th = fd * 1.1;
    /* text boxes are estimates: avoid them with a small margin */
    const pd = S, hitN = b => boxes.reduce((n, q) => n + Math.max(0, Math.min(b.x1 + pd, q.x1) - Math.max(b.x0 - pd, q.x0)) * Math.max(0, Math.min(b.y1 + pd, q.y1) - Math.max(b.y0 - pd, q.y0)), 0);
    let best = null;
    for (const out of [1, 0]) for (const deg of [-50, -130, 50, 130, -90, 90, -20, -160, 20, 160, 0, 180]) {
      const c = Math.cos(deg * Math.PI / 180), s = Math.sin(deg * Math.PI / 180), ex = it.cx + it.r * c, ey = it.cy + it.r * s;
      if (ex < .5 || ex > W - .5 || ey < .5 || ey > H - .5) continue;
      const g = 1.2 * S + Math.abs(c) * tl / 2 + Math.abs(s) * th / 2, d = out ? it.r + g : it.r - g - al;
      if (!out && d < r0 + tl) continue;
      const bx = it.cx + d * c, by = it.cy + d * s, b = { x0: bx - tl / 2, x1: bx + tl / 2, y0: by - th / 2, y1: by + th / 2 };
      const offT = Math.max(0, -b.x0, b.x1 - W, -b.y0, b.y1 - H), score = hitN(b) + offT * 50 + (out ? 0 : 5);
      if (!best || score < best.score) best = { score, c, s, bx, by, ex, ey };
      if (score === 0) break;
    }
    if (!best) continue;
    body += line(it.cx + r0 * best.c, it.cy + r0 * best.s, best.ex, best.ey, " stroke-width='.45' marker-end='url(#da)'");
    over += txt(best.bx, best.by, l);
    list.push({ kind: "radius", cx: it.cx, cy: it.cy, r: it.r, r0, l });
  }
  m.dims = list;
  return { body, over, pad };
}
/* a 30 cm grid, 50 cm from 200 cm up; the legend says so and gives the unit of measurement (0.9.3) */
