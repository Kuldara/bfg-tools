/* ---------------------------------------------------------------- map */
export const NARROW = window.matchMedia("(max-width: 560px)");
/* layout: narrow (one column), wide (PC, tablet in landscape, phone turned), xwide (≥ 1560 px) */
export const WIDE_Q = window.matchMedia("(min-width: 960px), (orientation: landscape) and (min-width: 700px)");
export const XWIDE_Q = window.matchMedia("(min-width: 1560px)");
export const SHORT_Q = window.matchMedia("(orientation: landscape) and (max-height: 520px)");
export function layout() { return XWIDE_Q.matches ? "xwide" : WIDE_Q.matches ? "wide" : "narrow"; }
export function applyLayout() { const L = layout(), c = document.documentElement.classList; c.toggle("wide", L !== "narrow"); c.toggle("xwide", L === "xwide"); c.toggle("short", SHORT_Q.matches); }
/* columns: empty ones are left out; n2/n3 tells CSS the number of columns */
export function cols(parts, cls) {
  const ps = parts.map(p => [].concat(p).filter(Boolean).join("")).filter(Boolean);
  return "<div class='cols n" + ps.length + (cls ? " " + cls : "") + "'>" + ps.map(p => "<div class='col'>" + p + "</div>").join("") + "</div>";
}
/* the map's drawing width in px: a narrow one (under 560 px) gets the phone's font size on a wide screen too */
export function mapColWidth() {
  const vw = window.innerWidth, L = layout();
  if (L === "narrow") return Math.min(vw, 760) - 32;
  if (L === "wide") return (Math.min(vw, 1500) - 48 - 32) * (SHORT_Q.matches ? 6 / 11 : 1.12 / 2.12);
  return (Math.min(vw, 1860) - 48 - 60) * 1.25 / 3.25;
}
export function mapNarrow() { return window.__mapNarrow !== undefined ? window.__mapNarrow : (NARROW.matches || mapColWidth() < 560); }
export function mapFont(W) { return (mapNarrow() ? 6.8 : 5.4) * (W + 30) / 210; }
export function textLen(l, W) { return Math.max(...String(l).split("\n").map(t => t.length)) * mapFont(W) * .6; }
