import { LISTS } from "../../../packages/ui/catalog.js";

/* ============================================================ HELPERS ===== */
export function fnv(s){
  let h = 0x811c9dc5;
  for(let i = 0; i < s.length; i++){ h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
  return ("0000000" + h.toString(16)).slice(-8);
}
export const clone = o => JSON.parse(JSON.stringify(o));
export const listByName = nm => LISTS.filter(x => x.nm === nm)[0] || null;
export const listOf = (u, L0) => (u && u.lst && listByName(u.lst)) || L0;
export const $ = s => document.querySelector(s);
export const EM = "\u2014", MID = "\u00b7", TIMES = "\u00d7";

