import { $ } from "./boot.js";
import { downloadEditable } from "./download-editable.js";
import { fileNote } from "./fleet-files.js";
import { L, defaultRole, switchList } from "./model.js";
import { placeSaves } from "./panels.js";
import { copyInPlace, openPhone } from "./phone.js";
import { PRINT, auditAllCardLayouts, auditOneCard, listText, printCards, printFitPct, printRoster, setPage, setPrint } from "./print.js";
import { STASH_PTS, load, save, stashAll, stashUnits } from "./save.js";
import { KEY_LIB, afterAdd, doSave, exportSaved, libAddText, libDelete, libDocument, libOpen, libRead, renderSaveNow, renderSaves } from "./saved-fleets.js";
import { savesChange, savesClick, savesDblClick, savesInput, savesKey } from "./saved-list.js";
import { showLinkDialog } from "./link-dialog.js";
import { appState } from "./state.js";
import { DRAGS, dragScrollAt, dragScrollStop, dragTopEdge, render, renderChecks, renderTop } from "./view.js";
import { LISTS } from "../../../packages/ui/catalog.js";
import { qrFull } from "../../../packages/ui/qr.js";
import { unpackFleet } from "../../../packages/ui/share-link.js";

export const dropKept = nm => {
  if(!stashUnits(nm).length) return;
  if(!confirm("Discard the " + nm + " fleet (" + (STASH_PTS[nm] || 0) + " pts)?")) return;
  delete appState.S.stash[nm]; delete STASH_PTS[nm];
  render();
};
/* :active press feedback on iOS Safari needs a touch listener on the page. */
/* (the test harnesses load this page with a stub document that has no listeners) */
if(document.addEventListener) document.addEventListener("touchstart", () => {}, { passive: true });
/* One column on a phone puts Your fleet under the whole catalogue. A swipe
   to the right goes straight to the fleet, a swipe to the left back to
   where the catalogue was (user 18.10.2026: "a swipe right takes you
   straight to the ships you chose, and a swipe left from there back to
   choosing ships"). Only the player's own gesture scrolls, never a
   render. A swipe that starts on a control, on a drag grip or inside
   something that scrolls sideways is theirs, not ours. */
if(document.addEventListener && typeof window !== "undefined" && window.matchMedia){
  const oneCol = window.matchMedia("(max-width:1020px)");
  let t0 = null, backY = null;
  const sideways = el => { for(let a = el; a && a !== document.body; a = a.parentElement){
    if(a.scrollWidth > a.clientWidth + 2 && /auto|scroll/.test(getComputedStyle(a).overflowX)) return true; } return false; };
  const topOf = el => el.getBoundingClientRect().top + window.scrollY - dragTopEdge() - 8;
  const go = y => window.scrollTo({ top: Math.max(0, Math.round(y)),
    behavior: window.matchMedia("(prefers-reduced-motion:reduce)").matches ? "auto" : "smooth" });
  document.addEventListener("touchstart", e => {
    t0 = null;
    if(!oneCol.matches || e.touches.length !== 1) return;
    const el = e.target;
    if(!el || !el.closest || el.closest("input,select,textarea,.grip,.sheet") || sideways(el)) return;
    t0 = { x: e.touches[0].clientX, y: e.touches[0].clientY, at: Date.now() };
  }, { passive: true });
  document.addEventListener("touchcancel", () => { t0 = null; }, { passive: true });
  document.addEventListener("touchend", e => {
    if(!t0 || !e.changedTouches.length) return;
    const t = e.changedTouches[0], dx = t.clientX - t0.x, dy = t.clientY - t0.y, dt = Date.now() - t0.at;
    t0 = null;
    if(dt > 700 || Math.abs(dx) < 60 || Math.abs(dx) < 2.5 * Math.abs(dy)) return;
    if(dx > 0) toFleet(); else toShips();
  }, { passive: true });
  function toFleet(){
    const fleet = $("#fleet");
    if(!fleet) return;
    const fleetTop = topOf(fleet.closest("section") || fleet);
    /* remember where the catalogue was, unless we are already in the fleet -
       which, with a short fleet at the foot of the page, is as far down as
       the page goes, not the section's own top */
    const maxY = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    if(window.scrollY < Math.min(fleetTop, maxY) - 1) backY = window.scrollY;
    go(fleetTop);
  }
  function toShips(){
    const cat = $("#catalogue");
    if(!cat) return;
    const y = backY != null ? backY : topOf(cat.closest("section") || cat);
    backY = null;
    go(y);
  }
  /* J238 (user 25.10.2026: "some visual help ... so that the feature is
     found"): the same two moves on the pill, and where you are on it */
  const nav = $("#swipenav");
  if(nav && nav.addEventListener){
    nav.addEventListener("click", e => {
      const b = e.target.closest && e.target.closest("[data-swipe]");
      if(b) (b.getAttribute("data-swipe") === "fleet" ? toFleet : toShips)();
    });
    let q = false;
    const mark = () => {
      q = false;
      /* the tests' stub page has no layout: nothing to mark there */
      const f = $("#fleet"), sec = f && f.closest ? (f.closest("section") || f) : null;
      if(!sec || !sec.getBoundingClientRect || !nav.querySelector) return;
      const inFleet = sec.getBoundingClientRect().top < window.innerHeight * 0.5;
      nav.querySelector('[data-swipe="fleet"]').className = inFleet ? "on" : "";
      nav.querySelector('[data-swipe="cat"]').className = inFleet ? "" : "on";
    };
    window.addEventListener("scroll", () => { if(!q){ q = true; requestAnimationFrame(mark); } }, { passive: true });
    mark();
  }
}
/* J243 (user 31.10.2026: "saisi olla selkeämpi jos on jo ylhäällä ja
   räplää sitä"): on a phone Menu shows only once the buttons have gone
   half under the points strip, where pinning them does something. */
if(document.addEventListener && typeof window !== "undefined" && window.matchMedia){
  const strip = $(".tb-strip"), head = document.querySelector && document.querySelector(".tb-head"),
    acts = document.querySelector && document.querySelector(".tb-acts");
  if(strip && head && acts && head.getBoundingClientRect && strip.classList){
    let q = false;
    const mark = () => {
      q = false;
      /* where the buttons would be if not pinned: right under the head */
      const far = head.getBoundingClientRect().bottom + acts.offsetHeight / 2 < 0;
      strip.classList.toggle("far", far);
    };
    window.addEventListener("scroll", () => { if(!q){ q = true; requestAnimationFrame(mark); } }, { passive: true });
    window.addEventListener("resize", mark);
    mark();
  }
}
/* dragover anywhere on the page - over the legality panel or the sticky bar
   too, where no fleet row listens - drives the drag auto-scroll */
if(document.addEventListener){
  document.addEventListener("dragover", e => { if(DRAGS.on) dragScrollAt(e.clientY); });
  document.addEventListener("dragend", dragScrollStop);
  document.addEventListener("drop", dragScrollStop);
}
/* the saved fleets browser: search, sort, chips, rows (saved-list.js) */
const redrawSaves = () => { renderSaves(); placeSaves(); };
const openFromList = id => { $("#saves").open = false; libOpen(id); };
$("#saves").oninput = e => { savesInput(e, redrawSaves); };
$("#saves").onchange = e => { savesChange(e, redrawSaves); };
$("#saves").ondblclick = e => { const id = savesDblClick(e); if(id) openFromList(id); };
$("#saves").onkeydown = e => {
  const r = savesKey(e, redrawSaves);
  if(typeof r === "string" && r.indexOf("open:") === 0) openFromList(r.slice(5));
  else if(r === "close"){ $("#saves").open = false; const sm = $("#saves").querySelector("summary"); if(sm) sm.focus(); }
};
$("#saves").onclick = e => {
  if(e.target.closest && savesClick(e, redrawSaves)) return;
  const cpt = e.target.closest ? e.target.closest("button[data-copytext]") : null;
  if(cpt){ const d = libDocument(cpt.dataset.copytext); if(d) copyInPlace(cpt, JSON.stringify(d, null, 1), cpt.dataset.copytext); return; }
  const lo = e.target.closest ? e.target.closest("button[data-libopen]") : null;
  if(lo){ $("#saves").open = false; libOpen(lo.dataset.libopen); return; }
  const lx = e.target.closest ? e.target.closest("button[data-libexport]") : null;
  if(lx){ exportSaved(lx.dataset.libexport); return; }
  const ld = e.target.closest ? e.target.closest("button[data-libdel]") : null;
  if(ld){
    const s = libRead().saves.filter(x => x.id === ld.dataset.libdel)[0];
    if(s && confirm("Delete the saved fleet " + s.name + "? The fleets being edited are not touched.")){
      libDelete(s.id); if(appState.PHONE.key === s.id) appState.PHONE = { key: null }; if(appState.COPYBOX && appState.COPYBOX.key === s.id) appState.COPYBOX = null; render();
    }
    return;
  }
  const cc = e.target.closest ? e.target.closest("button[data-copyclose]") : null;
  if(cc){ appState.COPYBOX = null; renderTop(); return; }
  const ph = e.target.closest ? e.target.closest("button[data-phone]") : null;
  if(ph){ openPhone(ph.dataset.phone); return; }
  const qf = e.target.closest ? e.target.closest("[data-qrfull]") : null;
  if(qf){ if(appState.PHONE.svg) qrFull(appState.PHONE.svg); return; }
  const cl = e.target.closest ? e.target.closest("button[data-copylink]") : null;
  if(cl){ if(appState.PHONE.url) copyInPlace(cl, appState.PHONE.url, null).then(() => { const i = document.querySelector(".phonebox .plink"); if(cl.textContent !== "Copied" && i && i.select){ i.focus(); i.select(); } }); return; }
  const sl = e.target.closest ? e.target.closest("button[data-sharelink]") : null;
  if(sl){ if(appState.PHONE.url && navigator.share) navigator.share({ title: "Gothic Fleet Play", url: appState.PHONE.url }).catch(() => {}); return; }
  const im = e.target.closest ? e.target.closest("button[data-import]") : null;
  if(im){ const inp = $("#importfile"); if(inp) inp.click(); return; }
  const po = e.target.closest ? e.target.closest("button[data-pasteopen]") : null;
  if(po){ appState.PASTEBOX = !appState.PASTEBOX; renderTop(); const t = $("#pastebox"); if(t) t.focus(); return; }
  const pc = e.target.closest ? e.target.closest("button[data-pasteclose]") : null;
  if(pc){ appState.PASTEBOX = false; appState.PASTE_TEXT = ""; renderTop(); return; }
  const pa = e.target.closest ? e.target.closest("button[data-pasteadd]") : null;
  if(pa){
    const t = $("#pastebox"), text = t ? String(t.value || "").trim() : "";
    if(!text){ if(t) t.focus(); return; }
    const r = libAddText(text, "paste");
    /* a text that adds nothing stays in the box, to fix or replace */
    if(r.ids.length){ appState.PASTEBOX = false; appState.PASTE_TEXT = ""; } else appState.PASTE_TEXT = text;
    afterAdd(r, "the pasted text");
    return;
  }
  const go = e.target.closest ? e.target.closest("button[data-open]") : null;
  if(go){
    const li = LISTS.findIndex(l => l.nm === go.dataset.open);
    if(li >= 0){ $("#saves").open = false; switchList(li); }
    return;
  }
  const b = e.target.closest ? e.target.closest("button[data-drop]") : null;
  if(!b) return;
  if(b.dataset.drop === L().nm) clearOpen(); else dropKept(b.dataset.drop);
};
$("#saves").ontoggle = () => {
  placeSaves();
  /* a pointer with hover (a PC): the search box takes the typing at once */
  const q = $("#savesq");
  if($("#saves").open && q && window.matchMedia && window.matchMedia("(hover:hover) and (pointer:fine)").matches) q.focus({ preventScroll: true });
};
$("#printset").ontoggle = placeSaves;
window.onresize = placeSaves;
$("#ppaper").onchange = e => setPrint(e.target.value, null);
$("#pscale").onchange = e => setPrint(null, e.target.value);
$("#printset").onclick = e => {
  const b = e.target.closest ? e.target.closest("button[data-fit]") : null;
  if(b) setPrint(null, printFitPct(PRINT.paper, +b.dataset.fit));
};
$("#limit").oninput = e => { appState.S.limit = parseInt(e.target.value, 10) || 0; renderTop(); renderChecks(); save(); };
$("#printcards").onclick = printCards;
$("#editcards").onclick = downloadEditable;
$("#printroster").onclick = printRoster;
/* Clear is for the fleet in front of the player. The fleets kept for other
   lists are theirs too, and are not swept up by a button that says nothing
   about them (user 20.9.). */
export function clearOpen(){
  const kept = Object.keys(stashAll()).filter(nm => stashUnits(nm).length).length;
  if(confirm("Clear the " + L().nm + " fleet?" + (kept
      ? " The " + kept + " fleet" + (kept > 1 ? "s" : "") + " kept for other lists " +
        (kept > 1 ? "are" : "is") + " not touched." : "")))
    { appState.S.units = []; render(); }
}
$("#copy").onclick = () => copyInPlace($("#copy"), listText(), null);
/* The Save button: the panel names the open fleet; Save, Save as new, and
   Enter in the name do the same as the buttons. */
$("#savenow").onclick = e => {
  const b = e.target.closest ? e.target.closest("button[data-saveopen]") : null;
  if(b) doSave(b.dataset.saveopen === "new");
};
$("#savenow").oninput = e => { if(e.target && e.target.id === "savename") appState.SAVE_NAME = e.target.value; };
$("#savenow").onkeydown = e => { if(e.target && e.target.id === "savename" && e.key === "Enter"){ e.preventDefault(); doSave(false); } };
$("#savenow").ontoggle = () => {
  if($("#savenow").open){ appState.SAVE_NAME = null; appState.SAVE_MSG = ""; renderSaveNow(libRead()); }
  placeSaves();
};

if(typeof location !== "undefined"){
  const qa = new URLSearchParams(location.search);
  if(qa.has("card-audit")){
    setTimeout(() => auditOneCard(qa.get("card-audit")).catch(err => {
      document.body.dataset.layoutAudit = JSON.stringify({error:String(err)});
    }), 0);
  }else if(qa.has("layout-audit")){
    document.body.dataset.layoutAudit = "running";
    setTimeout(() => auditAllCardLayouts().catch(err => {
      document.body.dataset.layoutAudit = JSON.stringify({error:String(err)});
    }), 0);
  }
}
/* Back to the stylesheet's own page - portrait, no margin - which is what was
   in force after a print all along (the landscape rule set here never won). */
window.onafterprint = () => { $("#sheet").innerHTML = ""; setPage(true); };

load();
if(!LISTS[appState.S.li]) appState.S.li = 0;
appState.SRC_ROLE = defaultRole();
render();
/* A link with fleets in it (#fleet=, the To phone codes) opened here, and
   the address loses them so a reload does not take them again. The link
   does nothing by itself: it shows the dialog (J241, link-dialog.js) - Open
   puts the fleet on this tab, Save puts it in Saved fleets, and Open says
   first what it would replace. Returns whether the text was a fleet. */
export function openReceived(text){
  let o = null;
  try{ o = JSON.parse(text); }catch(e){ return false; }
  return showLinkDialog(o);
}
/* The link is read when the page opens AND whenever the address gets a new
   one (J240): a second link opened in the same tab or app window changes
   only the part after #, which does not reload the page. */
export function takeLink(){
  if(typeof location === "undefined" || !/^#fleetj?=/.test(location.hash || "")) return false;
  const frag = location.hash.slice(1);
  try{ history.replaceState(null, "", location.pathname + location.search); }catch(e){}
  return unpackFleet(frag).then(text => { if(!openReceived(text)) fileNote("The link has no fleet this page can open (an unknown list, or written by a newer version)."); },
                                e => fileNote("The fleets in the link could not be read: " + (e && e.message || e) + "."));
}
/* Each tab keeps its own fleet (J241: "even if you click four different
   links, each tab has its own fleet open"; save.js keeps a copy per tab).
   What tabs share is the Saved fleets library: when another tab changes it,
   this one redraws the list. The redraw writes nothing (SYNCING): the fleet
   on this tab is not saved over the other tab's work just because the
   library changed. */
export function refreshLibrary(){
  appState.SYNCING = true;
  try{ render(); }finally{ appState.SYNCING = false; }
}
takeLink();
if(typeof window !== "undefined" && window.addEventListener){
  window.addEventListener("hashchange", takeLink);
  window.addEventListener("storage", e => { if(e.key === KEY_LIB) refreshLibrary(); });
}
