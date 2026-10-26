import { QR } from "../../../packages/ui/qr.js";
export { QR };
import { SC } from "./data.js";
import { esc } from "./helpers.js";
import { DB, save } from "./state.js";
import { lf } from "./views.js";

/* ---------------------------------------------------------------- your own bookkeeping (0.17, 25.10.)
   Owner: in the card's top-right corner "a three-position dot" (unplayed / in progress / played), a bookmark star,
   a filter for them and "export site status": a link or QR code that moves the marks from one device to another.
   DB.rec[id] = { s: 0 | 1 | 2, b: 0 | 1 }. Link: #/rec/<id>[.s][*],...  — read in render() and merged. */
export function qrSvg(text) {
  const q = QR.encode(text), n = q.size + 8;
  let d = "";
  q.rows.forEach((row, y) => row.forEach((on, x) => { if (on) d += "M" + (x + 4) + " " + (y + 4) + "h1v1h-1z"; }));
  return "<svg class='qrsvg' viewBox='0 0 " + n + " " + n + "' shape-rendering='crispEdges' role='img' aria-label='QR code of the link'><rect width='" + n + "' height='" + n + "' fill='#fff'/><path d='" + d + "' fill='#000'/></svg>";
}
export const REC_LBL = ["Not played", "In progress", "Played"];
export function recOf(id) { if (!DB.rec) DB.rec = {}; if (!DB.rec[id]) DB.rec[id] = { s: 0, b: 0 }; return DB.rec[id]; }
export function recS(id) { return DB.rec && DB.rec[id] ? DB.rec[id].s || 0 : 0; }
export function recB(id) { return !!(DB.rec && DB.rec[id] && DB.rec[id].b); }
export function recCtl(id, inline) {
  const sv = recS(id), b = recB(id);
  return "<span class='recc" + (inline ? " inl" : "") + "'>" + (inline ? "<span class='lbl'>" + REC_LBL[sv] + "</span>" : "") +
    "<button class='dot' data-a='rec' data-id='" + id + "' data-s='" + sv + "' title='" + REC_LBL[sv] + " — tap to change' aria-label='Record: " + REC_LBL[sv] + "'><i></i></button>" +
    "<button class='star' data-a='bm' data-id='" + id + "' aria-pressed='" + b + "' title='" + (b ? "Bookmarked" : "Bookmark") + "' aria-label='Bookmark'>" + (b ? "★" : "☆") + "</button></span>";
}
export function recCounts() { const c = { s1: 0, s2: 0, b: 0 }; for (const id in DB.rec || {}) { const r = DB.rec[id]; if (r.s === 1) c.s1++; if (r.s === 2) c.s2++; if (r.b) c.b++; } return c; }
/* The transfer link compact (test: with all 216 marked, the id list was 4 065 characters, too long for a QR code):
   "#/rec/1" + for each marked scenario a 4-character id (FNV-1a of its id, base36) and a state mark:
   1 = in progress, 2 = played, a/b/c = star + unplayed/in progress/played. The id does not depend on the number or the
   order of scenarios, so new scenarios do not break old links; an unknown id is skipped.
   tests/bookkeeping.js checks that no two scenarios have the same id. */
export function recH(id) { let h = 2166136261; for (let i = 0; i < id.length; i++) { h ^= id.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } return (h % 1679616).toString(36).padStart(4, "0"); }
export function recLink() {
  let d = "";
  for (const sc of SC) { const r = DB.rec && DB.rec[sc.id]; if (r && (r.s || r.b)) d += recH(sc.id) + (r.b ? "abc"[r.s || 0] : String(r.s)); }
  return location.origin + location.pathname + "#/rec/1" + d;
}
export let IMPORT_NOTE = "";
export function importRec(data) {
  let n = 0;
  if (data.charAt(0) === "1") {
    const map = {}; for (const sc of SC) map[recH(sc.id)] = sc.id;
    for (let i = 1; i + 5 <= data.length; i += 5) {
      const id = map[data.slice(i, i + 4)], c = data.charAt(i + 4), k = "12abc".indexOf(c);
      if (!id || k < 0) continue;
      const r = recOf(id); r.s = k < 2 ? k + 1 : k - 2; r.b = k < 2 ? 0 : 1; n++;
    }
  }
  save();
  IMPORT_NOTE = n ? "Imported " + n + " mark" + (n === 1 ? "" : "s") + " from the link." : "The link held no marks.";
}
export function recLine() {
  const c = recCounts(), any = c.s1 || c.s2 || c.b;
  let h = "<div class='recline'>";
  if (!any) h += "<span>Keep a record: the dot on a card marks a scenario <b>in progress</b> or <b>played</b>, the star bookmarks it.</span>";
  /* the numbers are filter buttons (owner 25.10.: "clicking e.g. bookmarked could work as a filter right away"):
     the same f.rec / f.bm as in the Filters panel; a second tap removes the limit */
  else { const f = lf(), k = (act, key, on, body, t) => "<button class='k' data-a='" + act + "' data-k='" + key + "' data-all='1' aria-pressed='" + !!on + "' title='" + t + "'>" + body + "</button>";
    h += "<span>Your record:</span>" + k("lfr", "2", f.rec === "2", "<i class='s2'></i>" + c.s2 + " played", "Show only played") +
      k("lfr", "1", f.rec === "1", "<i class='s1'></i>" + c.s1 + " in progress", "Show only in progress") + k("lfm", "", f.bm, "★ " + c.b + " bookmarked", "Show only bookmarked") +
      "<button class='btn' data-a='recopen' aria-expanded='" + !!DB.recopen + "'>To another device</button>"; }
  if (IMPORT_NOTE) h += "<span class='impnote'>" + esc(IMPORT_NOTE) + "</span>";
  h += "</div>";
  if (any && DB.recopen) {
    const url = recLink();
    let qr = "";
    try { qr = qrSvg(url); } catch (e) { qr = "<p class='small muted'>Too many marks for a QR code: use the link.</p>"; }
    h += "<div class='recbox'>" + qr + "<div class='rtxt'><p>Scan the code with the other device, or send it this link. Opening it adds these marks to that device’s record; marks it already has for other scenarios stay.</p>" +
      "<input type='text' readonly value='" + esc(url) + "' aria-label='Link with your record' onfocus='this.select()'><button class='btn' data-a='reccopy' data-url='" + esc(url) + "'>Copy link</button></div></div>";
  }
  return h;
}
/* the hash change clears the note (events.js); a module cannot assign another's let */
export function clearImportNote() { IMPORT_NOTE = ""; }
