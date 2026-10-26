import { $ } from "./boot.js";

/* The panel hangs from the left edge of its button, and the top bar wraps, so
   the button can sit anywhere along its row: on a wide screen it is the last
   thing on the right and the panel ran off the screen (user 12.10.2026). The
   panel moves left by what it overshoots and never past the left edge, and a
   list taller than the screen scrolls inside the panel - the top bar is
   sticky, so the page cannot scroll the rest into view. The height is set
   first: a panel that scrolls is wider by its scrollbar. */
export function placePanel(d, p){
  if(!d || !d.open || !p || !p.getBoundingClientRect) return;
  const root = document.documentElement;
  p.style.left = "0px";
  p.style.maxHeight = Math.max(80, root.clientHeight - p.getBoundingClientRect().top - 8) + "px";
  const r = p.getBoundingClientRect(), over = r.right - (root.clientWidth - 8);
  if(over > 0) p.style.left = -Math.min(over, Math.max(0, r.left - 8)) + "px";
}
/* Both dropdowns of the top bar: the saved fleets and the print setup. */
export function placeSaves(){
  placePanel($("#savenow"), $("#savebody"));
  placePanel($("#saves"), $("#savesbody"));
  placePanel($("#printset"), $("#printbody"));
}
