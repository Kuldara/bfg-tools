import { $ } from "./boot.js";

/* Every dropdown of the top bar opens in one place, whichever button opened
   it (user 2.11.2026: panels on top of each other, in changing places, now and
   then off the screen): under the block of buttons, against the right edge of
   the window. Only one is open at a time (the details' shared name in
   index.html). A list taller than the screen scrolls inside the panel, and the
   panel stays on the screen when the page scrolls the buttons away. On a
   narrow screen the pinned points strip stays above it. */
export function placePanel(d, p){
  if(!d || !d.open || !p || !p.getBoundingClientRect) return;
  const root = document.documentElement, acts = $(".tb-acts"), bar = $(".topbar"), strip = $(".tb-strip");
  const block = acts.getBoundingClientRect().height ? acts : bar;
  const floor = strip.getBoundingClientRect().height ? strip.getBoundingClientRect().bottom : 0;
  const top = Math.max(floor + 6, block.getBoundingClientRect().bottom + 6);
  p.style.top = top + "px";
  p.style.right = (window.innerWidth - root.clientWidth + 8) + "px";
  p.style.maxHeight = Math.max(80, root.clientHeight - top - 8) + "px";
}
/* Both dropdowns of the top bar: the saved fleets and the print setup. */
export function placeSaves(){
  placePanel($("#savenow"), $("#savebody"));
  placePanel($("#saves"), $("#savesbody"));
  placePanel($("#printset"), $("#printbody"));
}
