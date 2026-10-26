import { bzSVG } from "./battlezone.js";
import { dimSVG } from "./dimensions.js";
import { esc } from "./helpers.js";
import { layout, mapNarrow } from "./layout.js";
import { terrHit } from "./terrain-legend.js";

export function mapGrid(W, H) { return Math.max(W, H) >= 200 ? 50 : 30; }
export function mapSize(W, H) { return W + " × " + H + " cm · grid " + mapGrid(W, H) + " cm"; }
export function mapSVG(m) {
  const W = m.w, H = m.h, S = (W + 30) / 210, narrow = mapNarrow();
  const fs = (narrow ? 6.8 : 5.4) * S, P = 15 * S;
  const col = s => s === "a" ? "var(--a)" : s === "b" ? "var(--b)" : s === "c" ? "var(--c)" : "var(--ink-3)";
  const soft = s => s === "a" ? "var(--a-soft)" : s === "b" ? "var(--b-soft)" : s === "c" ? "var(--c-soft)" : "var(--n-soft)";
  /* the texts' estimated boxes: the measurements (dimSVG) avoid them */
  const boxes = [];
  const T = (x, y, l, s, extra, size) => {
    const f = size || fs, lines = String(l).split("\n"), lh = f * 1.18, y0 = y - (lines.length - 1) * lh / 2, rot = /rotate/.test(extra || "");
    if (!rot && x >= 0 && x <= W) { const half = tw(l, f) / 2 + .5; x = half * 2 < W ? Math.min(W - half, Math.max(half, x)) : W / 2; }
    { const bw = tw(l, f) / 2, bh = lines.length * lh / 2; boxes.push(rot ? { x0: x - bh, x1: x + bh, y0: y - bw, y1: y + bw } : { x0: x - bw, x1: x + bw, y0: y - bh, y1: y + bh }); }
    return "<text x='" + x + "' y='" + y0 + "' text-anchor='middle' dominant-baseline='middle' font-size='" + f + "' font-weight='650' fill='" + (s ? col(s) : "var(--chart-label)") + "'" + (extra || "") + ">" +
      lines.map((t, i) => "<tspan x='" + x + "' dy='" + (i ? lh : 0) + "'>" + esc(t) + "</tspan>").join("") + "</text>";
  };
  /* the estimated text width (semibold, 0.56 em on average) and a size factor that makes it fit */
  const tw = (l, f) => Math.max(...String(l).split("\n").map(t => t.length)) * (f || fs) * .6;
  const fitK = (l, room) => Math.max(.62, Math.min(1, room / tw(l)));
  /* a zone's text inside the zone: one line, or two lines split at the space nearest the middle, and a smaller font
     if needed (at least 55 %) */
  const fitBox = (l, along, across) => {
    const one = String(l), lines = one.split("\n").length;
    const k1 = Math.min(1, along * .94 / tw(one), across * .9 / (lines * fs * 1.4));
    let best = [one, k1];
    if (lines === 1 && k1 < .85 && one.includes(" ")) {
      const mid = one.length / 2, sp = [...one].map((c, i) => c === " " ? i : -1).filter(i => i > 0).sort((a, b) => Math.abs(a - mid) - Math.abs(b - mid))[0];
      const two = one.slice(0, sp) + "\n" + one.slice(sp + 1), k2 = Math.min(1, along * .94 / tw(two), across * .9 / (2 * fs * 1.4));
      if (k2 > k1) best = [two, k2];
    }
    return [best[0], fs * Math.max(.55, best[1])];
  };
  let g = "", step = mapGrid(W, H);
  for (let x = step; x < W; x += step) g += "<line x1='" + x + "' y1='0' x2='" + x + "' y2='" + H + "' stroke='var(--chart-grid)' stroke-width='.4'/>";
  for (let y = step; y < H; y += step) g += "<line x1='0' y1='" + y + "' x2='" + W + "' y2='" + y + "' stroke='var(--chart-grid)' stroke-width='.4'/>";
  const defs = "<clipPath id='tbl'><rect x='0' y='0' width='" + W + "' height='" + H + "'/></clipPath>" +
    "<pattern id='hat' width='4' height='4' patternUnits='userSpaceOnUse' patternTransform='rotate(45)'><line x1='0' y1='0' x2='0' y2='4' stroke='var(--ast)' stroke-width='.8' opacity='.45'/></pattern>" +
    "<marker id='ar' viewBox='0 0 10 10' refX='8' refY='5' markerWidth='5' markerHeight='5' orient='auto-start-reverse'><path d='M0 0L10 5L0 10z' fill='context-stroke'/></marker>" +
    "<marker id='da' viewBox='0 0 10 5' refX='10' refY='2.5' markerUnits='userSpaceOnUse' markerWidth='" + (3 * S) + "' markerHeight='" + (1.5 * S) + "' orient='auto-start-reverse'><path d='M0 0L10 2.5L0 5z' fill='var(--chart-label)'/></marker>" +
    [["sunl", "x1='0' x2='1' y1='0' y2='0'"], ["sunr", "x1='1' x2='0' y1='0' y2='0'"], ["sunt", "x1='0' x2='0' y1='0' y2='1'"], ["sunb", "x1='0' x2='0' y1='1' y2='0'"]].map(([id, d]) =>
      "<linearGradient id='" + id + "' " + d + "><stop offset='0' stop-color='var(--sun)' stop-opacity='.55'/><stop offset='1' stop-color='var(--sun)' stop-opacity='0'/></linearGradient>").join("");
  let body = "", over = "";
  for (const it of m.items) {
    const s = it.s;
    if (it.z === "rect") {
      body += "<rect x='" + it.x + "' y='" + it.y + "' width='" + it.w + "' height='" + it.h + "' fill='" + soft(s) + "' stroke='" + col(s) + "' stroke-width='.8'" + (it.dash ? " stroke-dasharray='3 2'" : "") + "/>";
      const cx = it.x + it.w / 2, cy = it.y + it.h / 2;
      if (it.l) { const turned = it.rot && Math.abs(it.rot) === 90, [lab, f] = fitBox(it.l, turned ? it.h : it.w, turned ? it.w : it.h);
        over += T(cx, cy, lab, s, it.rot ? " transform='rotate(" + it.rot + " " + cx + " " + cy + ")'" : "", f); }
    } else if (it.z === "poly") {
      body += "<polygon points='" + it.pts.map(p => p[0] + "," + p[1]).join(" ") + "' fill='" + (it.pat ? "url(#hat)" : soft(s)) + "' stroke='" + col(s) + "' stroke-width='.8'" + (it.dash ? " stroke-dasharray='3 2'" : "") + " clip-path='url(#tbl)'/>";
    } else if (it.z === "circ") {
      body += "<circle cx='" + it.cx + "' cy='" + it.cy + "' r='" + it.r + "' fill='" + soft(s) + "' stroke='" + col(s) + "' stroke-width='.8' clip-path='url(#tbl)'/>";
      if (it.l) over += T(it.cx, it.cy, it.l, s);
    } else if (it.z === "ring") {
      if (it.gas) body += "<circle cx='" + it.cx + "' cy='" + it.cy + "' r='" + it.r + "' fill='none' stroke='var(--gas)' stroke-opacity='.35' stroke-width='" + it.sw + "' clip-path='url(#tbl)'/>";
      else if (it.ast) body += "<circle cx='" + it.cx + "' cy='" + it.cy + "' r='" + it.r + "' fill='none' stroke='url(#hat)' stroke-width='" + it.sw + "' clip-path='url(#tbl)'/>";
      else body += "<circle cx='" + it.cx + "' cy='" + it.cy + "' r='" + it.r + "' fill='none' stroke='" + col(s) + "' stroke-width='.7' stroke-dasharray='3 2' clip-path='url(#tbl)'/>";
    } else if (it.z === "planet") {
      body += "<circle cx='" + it.cx + "' cy='" + it.cy + "' r='" + it.r + "' fill='var(--pln)' opacity='.9'/>";
      if (it.l) over += T(it.cx, it.cy + it.r + fs * 1.1, it.l, "n");
    } else if (it.z === "hatch") {
      body += "<rect x='" + it.x + "' y='" + it.y + "' width='" + it.w + "' height='" + it.h + "' fill='url(#hat)'/>";
      if (it.l) { const n = String(it.l).split("\n").length; over += T(it.x + it.w / 2, it.y + it.h - fs * (.9 + (n - 1) * .59), it.l, null, " fill-opacity='.9'"); }
    } else if (it.z === "line") {
      body += "<line x1='" + it.x1 + "' y1='" + it.y1 + "' x2='" + it.x2 + "' y2='" + it.y2 + "' stroke='var(--chart-frame)' stroke-width='.5' stroke-dasharray='2 2'/>";
    } else if (it.z === "mark") {
      const r = 3.2 * S; over += "<path d='M" + it.x + " " + (it.y - r) + "L" + (it.x + r) + " " + it.y + "L" + it.x + " " + (it.y + r) + "L" + (it.x - r) + " " + it.y + "z' fill='" + col(s) + "'/>";
      if (it.l) over += T(it.x, it.y - r - fs * .9, it.l, s);
    } else if (it.z === "cm") {
      /* a centre mark (0.9.3): the position of a symbol-sized feature, dimensioned like a marker */
      const k = 2.6 * S; over += "<path d='M" + (it.x - k) + " " + it.y + "H" + (it.x + k) + "M" + it.x + " " + (it.y - k) + "V" + (it.y + k) + "' stroke='" + (s ? col(s) : "var(--chart-frame)") + "' stroke-width='.6'/>";
      if (it.l) over += T(it.x, it.y - k - fs * .8, it.l, s);
    } else if (it.z === "text") {
      over += T(it.x, it.y, it.l, s, it.rot ? " transform='rotate(" + it.rot + " " + it.x + " " + it.y + ")'" : "");
    } else if (it.z === "arrow") {
      over += "<line x1='" + it.x1 + "' y1='" + it.y1 + "' x2='" + it.x2 + "' y2='" + it.y2 + "' stroke='" + col(s) + "' stroke-width='" + (1.3 * S) + "' marker-end='url(#ar)'/>";
      if (it.l) over += T((it.x1 + it.x2) / 2, (it.y1 + it.y2) / 2 - fs * 1.6, it.l, s);
    } else if (it.z === "edge") {
      const o = 2.2 * S, sw = 2.4 * S, d = it.dash ? " stroke-dasharray='4 3'" : "";
      let x1, y1, x2, y2, tx, ty;
      if (it.e === "t") { x1 = 0; y1 = -o; x2 = W; y2 = -o; tx = W / 2; ty = -o - fs * 1.05; }
      if (it.e === "b") { x1 = 0; y1 = H + o; x2 = W; y2 = H + o; tx = W / 2; ty = H + o + fs * 1.15; }
      if (it.e === "l") { x1 = -o; y1 = 0; x2 = -o; y2 = H; tx = -o - fs * .9; ty = H / 2; }
      if (it.e === "r") { x1 = W + o; y1 = 0; x2 = W + o; y2 = H; tx = W + o + fs * 1.0; ty = H / 2; }
      over += "<line x1='" + x1 + "' y1='" + y1 + "' x2='" + x2 + "' y2='" + y2 + "' stroke='" + col(s) + "' stroke-width='" + sw + "'" + d + "/>";
      const side = it.e === "l" || it.e === "r", room = (side ? H : W + 2 * P) * .96, k = it.l ? fitK(it.l, room) : 1;
      if (it.l) over += side ? T(tx, ty, it.l, s, " transform='rotate(" + (it.e === "l" ? -90 : 90) + " " + tx + " " + ty + ")'", fs * k) : T(tx, ty, it.l, s, "", fs * k);
    } else if (it.z === "tick") {
      for (const [x, l] of it.list) {
        const y = it.e === "t" ? 0 : H, dy = it.e === "t" ? 1 : -1;
        over += "<line x1='" + x + "' y1='" + y + "' x2='" + x + "' y2='" + (y + dy * 5 * S) + "' stroke='" + col(it.s || 'a') + "' stroke-width='.9'/>";
        over += T(x, y + dy * 8.5 * S, l, it.s || "a");
      }
    } else if (it.z === "corner") {
      const cx = it.c[1] === "l" ? 0 : W, cy = it.c[0] === "t" ? 0 : H;
      body += "<circle cx='" + cx + "' cy='" + cy + "' r='" + it.r + "' fill='" + soft(s) + "' stroke='" + col(s) + "' stroke-width='.7' stroke-dasharray='3 2' clip-path='url(#tbl)'/>";
      over += T(cx + (it.c[1] === "l" ? 1 : -1) * it.r * .42, cy + (it.c[0] === "t" ? 1 : -1) * it.r * .42, it.l, s);
    } else if (it.z === "sun") {
      const e = it.e || "l", o = 2.2 + fs * .9;
      if (e === "l" || e === "r") {
        body += "<rect x='" + (e === "l" ? 0 : W - 22) + "' y='0' width='22' height='" + H + "' fill='url(#sun" + e + ")'/>";
        const tx = e === "l" ? -o : W + o;
        over += T(tx, H / 2, it.l || "sunward edge", null, " fill='var(--sun)' transform='rotate(" + (e === "l" ? -90 : 90) + " " + tx + " " + (H / 2) + ")'");
      } else {
        body += "<rect x='0' y='" + (e === "t" ? 0 : H - 22) + "' width='" + W + "' height='22' fill='url(#sun" + e + ")'/>";
        over += T(W / 2, e === "t" ? -o : H + o + fs * .1, it.l || "sunward edge", null, " fill='var(--sun)'");
      }
    }
  }
  /* clickable terrain (0.13): transparent hit areas; the chosen one gets an outline. The rest of the map has
     pointer-events: none in CSS, so texts and markers do not cover the hit. Rings and lines take hits only on their line (hs). */
  const hl = " fill='none' stroke='var(--sun)' stroke-width='.9' stroke-dasharray='3 2'";
  const hitOf = it => {
    const h = terrHit(it);
    if (!h) return null;
    const on = m.sel === h.id, A = " data-a='bzsel' data-id='" + h.id + "' class='hit", tr = " fill='transparent'";
    const box = (x, y, w, hh) => ["<rect" + A + "' x='" + x + "' y='" + y + "' width='" + w + "' height='" + hh + "'" + tr + "/>", "<rect x='" + (x - 1) + "' y='" + (y - 1) + "' width='" + (w + 2) + "' height='" + (hh + 2) + "'" + hl + "/>"];
    const ln = (x1, y1, x2, y2) => ["<line" + A + " hs' x1='" + x1 + "' y1='" + y1 + "' x2='" + x2 + "' y2='" + y2 + "' stroke='transparent' stroke-width='6'/>", "<line x1='" + x1 + "' y1='" + y1 + "' x2='" + x2 + "' y2='" + y2 + "' stroke='var(--sun)' stroke-width='1.4' stroke-dasharray='3 2'/>"];
    let p = 2, r;
    if (it.z === "planet" || it.z === "circ") r = ["<circle" + A + "' cx='" + it.cx + "' cy='" + it.cy + "' r='" + (it.r + 2) + "'" + tr + "/>", "<circle cx='" + it.cx + "' cy='" + it.cy + "' r='" + (it.r + 3) + "'" + hl + "/>"];
    else if (it.z === "ring") { p = 0; r = ["<circle" + A + " hs' cx='" + it.cx + "' cy='" + it.cy + "' r='" + it.r + "' fill='none' stroke='transparent' stroke-width='" + ((it.sw || 0) + 4) + "'/>", "<circle cx='" + it.cx + "' cy='" + it.cy + "' r='" + (it.r + (it.sw || 0) / 2 + 1.5) + "'" + hl + "/>"]; }
    else if (it.z === "hatch" || it.z === "rect") { p = 1; r = box(it.x, it.y, it.w, it.h); }
    else if (it.z === "poly") { p = 1; const pts = it.pts.map(q => q[0] + "," + q[1]).join(" "); r = ["<polygon" + A + "' points='" + pts + "'" + tr + "/>", "<polygon points='" + pts + "'" + hl + "/>"]; }
    else if (it.z === "mark" || it.z === "cm") { const k = 4.5 * S; r = ["<circle" + A + "' cx='" + it.x + "' cy='" + it.y + "' r='" + k + "'" + tr + "/>", "<circle cx='" + it.x + "' cy='" + it.y + "' r='" + (k + 1) + "'" + hl + "/>"]; }
    else if (it.z === "line" || it.z === "arrow") { p = 0; r = ln(it.x1, it.y1, it.x2, it.y2); }
    else if (it.z === "edge") { p = 0; const b = 2.2 * S + fs * 1.8; r = it.e === "l" ? box(-b, 0, b, H) : it.e === "r" ? box(W, 0, b, H) : it.e === "t" ? box(0, -b, W, b) : box(0, H, W, b); }
    else if (it.z === "text" && !it.rot) {
      const l = String(it.l || ""), n = l.split("\n").length, lh = fs * 1.18, half = tw(l) / 2 + .5;
      const x = it.x >= 0 && it.x <= W ? (half * 2 < W ? Math.min(W - half, Math.max(half, it.x)) : W / 2) : it.x;
      r = box(x - half, it.y - n * lh / 2, half * 2, n * lh);
    } else return null;
    return [p, r[0] + (on ? r[1] : "")];
  };
  const hit = m.items.map(hitOf).filter(Boolean).sort((a, b) => a[0] - b[0]).map(x => x[1]).join("");
  const frame = "<rect x='0' y='0' width='" + W + "' height='" + H + "' fill='none' stroke='var(--chart-frame)' stroke-width='.9'/>";
  /* measurements (0.9.3): edge rows enlarge the picture's margin only on the side that has them */
  const D = dimSVG(m, S, fs, boxes), pl = Math.max(P, D.pad.l), pt = Math.max(P, D.pad.t), pr = Math.max(P, D.pad.r), pb = Math.max(P, D.pad.b);
  /* the low orbit table (RB p. 116) under the main table at the same scale: 60 × 120 cm (the book: 45–60 × 90–135 cm),
     the planet edge at the bottom, the entry at the top; a dashed arrow from the scenario planet's gravity well (21.10.) */
  let lo = "", loUnder = "", extra = 0;
  if (m.lo) {
    const LW = Math.min(W, 120), LD = 60, gap = 14 + fs * 2.6, x0 = (W - LW) / 2, y0 = H + pb + gap, ink = "var(--chart-label)";
    const pull = { small: 5, medium: 8, large: 10 }[m.lo.size];
    const pls = m.items.filter(i => i.z === "planet").sort((a, b) => b.r - a.r), pz = pls[0];
    const ah = (x, y1, y2, c) => "<line x1='" + x + "' y1='" + y1 + "' x2='" + x + "' y2='" + (y2 - 3 * Math.sign(y2 - y1)) + "' stroke='" + c + "' stroke-width='.9'/><path d='M" + x + " " + y2 + " l-2.4 " + (-4 * Math.sign(y2 - y1)) + " h4.8 z' fill='" + c + "'/>";
    /* a short title to the left; the connecting line always comes down on its right (the measurements are in the legend) */
    const ttl = "Low orbit table", tW = tw(ttl);
    lo += T(x0 + tW / 2, y0 - fs * 1.1, ttl);
    lo += "<rect x='" + x0 + "' y='" + y0 + "' width='" + LW + "' height='" + LD + "' fill='var(--chart-bg)' stroke='var(--chart-frame)' stroke-width='.9'/>";
    lo += "<rect x='" + x0 + "' y='" + (y0 + LD - 45) + "' width='" + LW + "' height='45' fill='var(--pln)' fill-opacity='.12'/><line x1='" + x0 + "' y1='" + (y0 + LD - 45) + "' x2='" + (x0 + LW) + "' y2='" + (y0 + LD - 45) + "' stroke='var(--pln)' stroke-width='.6' stroke-dasharray='3 2'/>";
    lo += "<line x1='" + x0 + "' y1='" + y0 + "' x2='" + (x0 + LW) + "' y2='" + y0 + "' stroke='var(--a)' stroke-width='2'/>";
    lo += "<rect x='" + x0 + "' y='" + (y0 + LD - 4) + "' width='" + LW + "' height='4' fill='var(--pln)'/>";
    for (const f of [.12, .88]) lo += ah(x0 + LW * f, y0 + LD - 40, y0 + LD - 8, "var(--pln)");
    lo += T(W / 2, y0 + 7.5, "① enter here", "a");
    lo += T(W / 2, y0 + LD - 25, "② within 45 cm: pulled\n" + (pull ? pull + " cm" : "5 / 8 / 10 cm") + " each turn");
    lo += T(W / 2, y0 + LD + fs * 1.9, "③ planet edge: destroyed\n④ other edges: back, touching the planet");
    if (pz) {
      const tx = Math.min(x0 + LW - 6, Math.max(x0 + tW + 8, pz.cx)), fromY = Math.min(H - 1, pz.cy + pz.r + 3);
      /* the connecting line under the texts (the main table's texts stay readable) */
      loUnder = "<path d='M" + pz.cx + " " + fromY + " L" + tx + " " + (y0 - 4) + "' fill='none' stroke='var(--a)' stroke-width='.9' stroke-dasharray='3 2'/><path d='M" + tx + " " + y0 + " l-2.4 -4 h4.8 z' fill='var(--a)'/>";
    }
    extra = gap + LD + fs * 3.6;
  }
  return "<svg viewBox='" + (-pl) + " " + (-pt) + " " + (W + pl + pr) + " " + (H + pt + pb + extra) + "' role='img' aria-label='Deployment map'><defs>" + defs + "</defs>" +
    "<rect x='0' y='0' width='" + W + "' height='" + H + "' fill='var(--chart-bg)'/>" + g + body + hit + (m.bz ? bzSVG(m.bz, W, H, m.sel, fs) : "") + D.body + loUnder + frame + over + D.over + lo + "</svg>";
}
