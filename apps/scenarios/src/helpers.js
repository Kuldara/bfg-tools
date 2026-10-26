import { ANY, val } from "./data.js";

/* ---------------------------------------------------------------- helpers */
export const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
export const HL = /(\b\d*D\d+(?:\s?[+×x]\s?\d+)?(?:\s?×\s?\d+)?|\b\d+(?:[.,]\d+)?(?:\s?[–-]\s?\d+)?\s?cm\b|\b\d{2,4}\s?pts\b|\b\d{2,4}\s?VP\b|(?:^|(?<=[\s(]))[2-6]\+(?=[\s,.;:)]|$)|\bturn\s\d+\b|\bLd\s\d+\b)/g;
export function fmt(s) { return esc(s).replace(HL, m => "<b class='n'>" + m + "</b>"); }
export function vis(it, v) { return !(it.only && !it.only.includes(v)) && !(it.not && it.not.includes(v)); }
export function pickV(x, v) { x = val(x, v); return x && !Array.isArray(x) && typeof x === "object" ? (x[v] || x[Object.keys(x)[0]]) : x; }
export const SIDECLS = { a: "sa", b: "sb", c: "sc" };
export function whoTag(sc, s) { return s && sc.sides[s] ? "<span class='who " + SIDECLS[s] + "'>" + esc(sc.sides[s].n) + "</span>" : ""; }
/* more factions than sides (e.g. Depth of Space's seven drafts): a list, not a six-fleet "vs" chain */
export function sugText(sc) { return sc.suggest ? "Suggested: " + sc.suggest.join(sc.suggest.length > Object.keys(sc.sides || {}).length ? ", " : " vs ") : ANY; }
export function seg(act, key, vals, cur, labels) {
  return "<div class='seg' role='group'>" + vals.map((x, i) => "<button data-a='" + act + "' data-k='" + key + "' data-val='" + x + "' aria-pressed='" + (String(cur) === String(x)) + "'>" + esc(labels ? labels[i] : x) + "</button>").join("") + "</div>";
}
