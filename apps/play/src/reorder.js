import { appState } from "./state.js";
import { act, groupUnits } from "./actions.js";

/* ============================================= THE ORDER OF THE CARDS ===== */
/* The player's own order of the roster (user 1.11.2026), kept in the game record:
   G.order lists the rows. The small tag at the head of a card is the handle, so a
   finger on the card still scrolls. A squadron moves as a whole. UNDO takes a move
   back. Nothing else reads the order: rows keep their numbers everywhere. */
export function rosterOrder(){
  const n = appState.U.length, o = (appState.G && appState.G.order) || [];
  const seen = {}, out = [];
  o.forEach(i => { if(i >= 0 && i < n && !seen[i]){ seen[i] = 1; out.push(i); } });
  for(let i = 0; i < n; i++) if(!seen[i]) out.push(i);
  return out;
}
const blockOf = i => { const g = appState.G.grp[i]; return g && appState.U[i].R.kind === "ship" ? groupUnits(g) : [i]; };
/* the order with the block of row `from` moved before or after the block of `to` */
export function movedOrder(order, from, to, after){
  const a = blockOf(from), b = blockOf(to);
  if(b.indexOf(from) >= 0) return order;
  const rest = order.filter(i => a.indexOf(i) < 0);
  const at = after ? Math.max.apply(null, b.map(i => rest.indexOf(i))) + 1 : Math.min.apply(null, b.map(i => rest.indexOf(i)));
  const ms = order.filter(i => a.indexOf(i) >= 0);
  return rest.slice(0, at).concat(ms, rest.slice(at));
}
const rowOf = el => el && el.closest && el.closest("section.row[data-u],section.row[data-g]");
const unitOf = row => row.hasAttribute("data-u") ? parseInt(row.getAttribute("data-u"), 10) : groupUnits(row.getAttribute("data-g"))[0];

let drag = null;
function endDrag(commit){
  if(!drag) return;
  const d = drag; drag = null;
  d.row.classList.remove("dragging");
  if(d.line) d.line.remove();
  if(!commit || d.to == null) return;
  const order = rosterOrder(), next = movedOrder(order, d.from, d.to, d.after);
  if(next.join() !== order.join()) act("reorder", null, next);
}
if(typeof document !== "undefined" && document.addEventListener){
  document.addEventListener("pointerdown", ev => {
    if(ev.button) return;
    const tag = ev.target.closest && ev.target.closest(".main .r1 > .tag:first-child");
    const row = tag && rowOf(tag);
    if(!row || row.closest(".peerview") || appState.V.screen !== "roster" || appState.V.sheet != null) return;
    ev.preventDefault();
    drag = { row, from: unitOf(row), startY: ev.clientY, on: false, to: null, after: false, line: null };
    try{ tag.setPointerCapture(ev.pointerId); }catch(e){}
  });
  document.addEventListener("pointermove", ev => {
    if(!drag) return;
    if(!drag.on){
      if(Math.abs(ev.clientY - drag.startY) < 6) return;
      drag.on = true;
      drag.row.classList.add("dragging");
      drag.line = document.createElement("div");
      drag.line.className = "dropline";
      document.body.appendChild(drag.line);
    }
    ev.preventDefault();
    /* the edge of the screen carries the list along */
    const edge = 70;
    if(ev.clientY < edge) window.scrollBy(0, -14);
    else if(ev.clientY > window.innerHeight - edge * 2) window.scrollBy(0, 14);
    const over = rowOf(document.elementFromPoint(ev.clientX, ev.clientY));
    if(!over) return;
    const r = over.getBoundingClientRect();
    drag.to = unitOf(over);
    drag.after = ev.clientY > r.top + r.height / 2;
    drag.line.style.cssText = "left:" + r.left + "px;width:" + r.width + "px;top:" + ((drag.after ? r.bottom + 3 : r.top - 3) - 2) + "px";
  });
  document.addEventListener("pointerup", () => endDrag(true));
  document.addEventListener("pointercancel", () => endDrag(false));
}
