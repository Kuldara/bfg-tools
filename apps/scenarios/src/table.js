import { DB } from "./state.js";
import { agV } from "./views.js";

/* ---------------------------------------------------------------- table size */
/* common gaming mats, inches/feet rounded to whole cm */
export const TABLES = [[180, 120, "BFG rulebook"], [183, 122, "6′ × 4′ mat"], [152, 112, "60″ × 44″ mat"], [122, 122, "4′ × 4′ mat"], [112, 76, "44″ × 30″ mat"], [91, 91, "3′ × 3′ mat"], [244, 122, "8′ × 4′ table"], [200, 200, "Unknown Weapons ideal"]];
export function tableWH() {
  const t = DB.table;
  return t && t.w >= 40 && t.h >= 40 && t.w <= 400 && t.h <= 400 ? [t.w, t.h] : [180, 120];
}
/* text templates for table-relative numbers: {w3} = a third of the table length */
export function tpl(s, sc, st) { const [W] = tableWH(); return String(s).replace(/\{w3\}/g, String(Math.round(W / 3))).replace(/\{a:(\w+)\}/g, (m, id) => sc ? agV(sc, st, id) : m); }
