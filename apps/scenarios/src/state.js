import { tableWH } from "./table.js";

/* ---------------------------------------------------------------- state */
export const KEY = "bfg-scenario-library-v1";
export let DB = {};
try { DB = JSON.parse(localStorage.getItem(KEY) || "{}") || {}; } catch (e) { DB = {}; }
export function save() { try { localStorage.setItem(KEY, JSON.stringify(DB)); } catch (e) {} }
export function stOf(sc) {
  if (!DB.s) DB.s = {};
  if (!DB.s[sc.id]) DB.s[sc.id] = { turn: 1, v: sc.variants ? sc.variants[0][0] : "std", done: {}, w: {} };
  return DB.s[sc.id];
}
export function prep() { if (!DB.prep) DB.prep = {}; return DB.prep; }
export function get(st, id, d) { return st.w && st.w[id] !== undefined ? st.w[id] : d; }
export function num(st, id) { const v = parseInt(get(st, id, 0), 10); return isFinite(v) && v > 0 ? v : 0; }
export function wins(n) { return n + ((/s$/.test(n) && !/(ss|Chaos)$/.test(n)) || /Eldar$/.test(n) || /^(The )?\w+s of /i.test(n) ? " win" : " wins"); }
export function endingResult(st, S, id) {
  const w = S.rtools.find(t => t.id === id), i = get(st, id, -1);
  if (i < 0) return [null, "Battle in progress", "Mark how the game ended."];
  const r = w.rows[i], s = r[1];
  const n = s === "draw" ? "" : sideName(S, s);
  return [s, (s === "draw" ? "Draw" : wins(n)), r[0] + "."];
}
export function sideName(sc, s) { return sc.sides[s] ? sc.sides[s].n : s; }
export function entryInfo(t) {
  const d = Math.max(0, t - 1) * 30;
  return "<h3>Reinforcement entry, turn " + t + "</h3><p class='calc'>" + (d === 0 ? "Only from the <b>short edge</b> in front of the fleeing ships." :
    d >= tableWH()[0] ? "From the <b>short edge</b>, or <b>anywhere</b> along either long edge." :
    "From the <b>short edge</b>, or up to <b>" + d + " cm</b> along either long edge from that end.") + "</p>";
}
export function d6() { const u = new Uint32Array(1); crypto.getRandomValues(u); return 1 + (u[0] % 6); }
export function treeAt(t, path) { return path.length ? t.nodes[path[path.length - 1][0]].kids[path[path.length - 1][1]][1] : t.start; }
export function dn(n) { const u = new Uint32Array(1); crypto.getRandomValues(u); return 1 + (u[0] % n); }

/* DB is set here only; the tests replace it through setDB (tests/_load.js) */
export function getDB() { return DB; }
export function setDB(x) { DB = x; }
