import { $ } from "./boot.js";
import { fileNote } from "./fleet-files.js";
import { fleetPoints, switchList, total } from "./model.js";
import { STASH_PTS, stashUnits, unitDocs } from "./save.js";
import { libAdd, libFind, libId, libKey, libName, libRead, libToday, libWrite, openDoc, openSave, saveOpenAs, stashDoc } from "./saved-fleets.js";
import { appState } from "./state.js";
import { render } from "./view.js";
import { LISTS } from "../../../packages/ui/catalog.js";
import { esc } from "../../../packages/ui/format.js";
import { resolveSaved } from "../../../packages/ui/saved-fleet.js";
import DOMAIN from "../../../packages/rules/domain.js";

/* ------------------------------------------------- a fleet from a link ---- */
/* J241 (user 26.10.2026): "clicking a share link should always open that
   link's fleet; no need to save it automatically"; "even if you click four
   different links, each tab has its own fleet open"; "a sensible, simple
   dialog: you could save the link, or open it, and it warns that opening
   overwrites the one you have". So a link does nothing by itself: it shows
   this dialog. Open puts the fleet on its own list in THIS tab (each tab
   keeps its own fleet, save.js); Save adds it to Saved fleets and leaves the
   screen alone; the dialog says before Open when the fleet the tab has on
   that list is not in Saved fleets. Nothing closes by itself: Open and Close
   close it, Save answers in place. A link with several fleets can only be
   saved (they are not one screen). Replaces J240, which saved every linked
   fleet on arrival.
   When the tab has an unsaved fleet of its own on that list, the choice is
   the user's (26.10.2026: "save your old one and open the new one, or just
   open the new one over it?"): Save mine, then open / Open over mine. */

const shipsIn = units => (units || []).reduce((a, u) => a + (u.n || 1), 0);
const nOf = (n, one, many) => n + " " + (n === 1 ? one : many);

/* The offer a link makes, from its fleet document: null when it is not a
   fleet this page can read (the caller says why). */
export function linkOffer(o){
  if(!o || typeof o !== "object" || !Array.isArray(o.units)) return null;
  if(typeof o.schemaVersion === "number" && o.schemaVersion > DOMAIN.SCHEMA_VERSION) return null;
  const extra = Array.isArray(o.fleets) ? o.fleets.filter(f => f && Array.isArray(f.units) && f.units.length) : [];
  if(extra.length)
    return { kind: "many", doc: o, n: (o.units.length ? 1 : 0) + extra.length,
             names: [o].concat(extra).filter(f => f.units.length).map(f => String(f.name || f.ln || "").trim()) };
  if(!o.units.length) return null;
  const li = LISTS.findIndex(x => x.nm === o.ln);
  if(li < 0) return null;
  const Lx = LISTS[li];
  const lost = [], units = resolveSaved(JSON.parse(JSON.stringify(o.units)), Lx, lost);
  if(!units.length) return null;
  const limit = typeof o.limit === "number" && o.limit >= 0 ? o.limit | 0 : appState.S.limit | 0;
  const doc = { ln: Lx.nm, limit: limit, units: unitDocs(units, Lx) };
  const lib = libRead(), saved = libFind(lib, doc);
  const offer = { kind: "one", raw: o, li: li, ln: Lx.nm, name: String(o.name || "").trim() || Lx.nm, limit: limit,
                  doc: doc, pts: fleetPoints(units, Lx.nm), ships: shipsIn(units), lost: lost,
                  saved: saved ? saved.name : null, replaces: null };
  /* what this tab has on that list now */
  const here = li === appState.S.li;
  const cur = here ? openDoc() : stashDoc(Lx.nm);
  if(cur.units.length){
    const kept = libFind(lib, cur);
    offer.replaces = { same: libKey(cur) === libKey(doc), saved: kept ? kept.name : null,
                       pts: here ? total() : (STASH_PTS[Lx.nm] || fleetPoints(stashUnits(Lx.nm), Lx.nm)),
                       ships: shipsIn(here ? appState.S.units : stashUnits(Lx.nm)) };
  }
  return offer;
}

/* Open: the fleet on its own list in this tab. Returns the line for the note. */
export function linkOpen(offer){
  const Lx = LISTS[offer.li];
  const lost = [], units = resolveSaved(JSON.parse(JSON.stringify(offer.raw.units)), Lx, lost);
  if(offer.li !== appState.S.li) switchList(offer.li);
  appState.S.units = units; appState.S.limit = offer.limit;
  /* Saved already? Then the open fleet is that save, so Save updates it;
     otherwise it is a new, unsaved fleet. */
  const lib = libRead(), s = libFind(lib, offer.doc);
  if(s) lib.open[Lx.nm] = s.id; else delete lib.open[Lx.nm];
  libWrite(lib);
  appState.SAVE_NAME = offer.name;
  render();
  return "Opened " + offer.name + " from the link" + (s ? " (it is in Saved fleets as " + s.name + ")" : "; Save keeps it in Saved fleets") + "." +
    (lost.length ? " " + nOf(lost.length, "entry", "entries") + " could not be matched (" + lost.slice(0, 3).join(", ") + ")." : "");
}

/* Save mine: the fleet this tab has on the link's list goes into Saved fleets
   first - over the save it came from, as the Save button does, or as a new
   one. Returns its name, or null when there was nothing to save. */
export function linkKeepMine(offer){
  const ln = offer.ln;
  if(offer.li === appState.S.li){
    if(!appState.S.units.length) return null;
    const was = openSave();
    const s = saveOpenAs(appState.SAVE_NAME || (was ? was.name : ln + " " + total()));
    return s ? s.name : null;
  }
  const cur = stashDoc(ln);
  if(!cur.units.length) return null;
  const lib = libRead(), was = lib.saves.filter(x => x.id === lib.open[ln])[0];
  const pts = STASH_PTS[ln] || fleetPoints(stashUnits(ln), ln);
  const s = was || { id: libId(), name: libName(lib, ln + " " + pts), ln: ln };
  s.limit = cur.limit; s.units = cur.units; s.pts = pts; s.saved = libToday(); delete s.from;
  if(!was) lib.saves.unshift(s);
  lib.open[ln] = s.id;
  libWrite(lib);
  return s.name;
}

/* Save: into Saved fleets, the screen as it was. Returns what to say. */
export function linkSave(offer){
  const r = libAdd(offer.kind === "one" ? Object.assign({}, offer.raw, { name: offer.name }) : offer.doc, "link");
  if(r.ids.length) return "Saved " + (offer.kind === "one" ? offer.name : nOf(r.ids.length, "fleet", "fleets")) + " in Saved fleets.";
  return r.notes.length ? r.notes.join("; ") + "." : "Nothing was saved.";
}

/* ---------------------------------------------------------- the dialog ---- */
appState.LINK = null;
const box = () => $("#linkdlg");
export function linkDialogOpen(){ const b = box(); return !!b && !b.hidden; }
export function closeLinkDialog(){
  appState.LINK = null;
  const b = box(); if(b){ b.hidden = true; b.innerHTML = ""; }
}
function dialogHTML(st){
  const o = st.offer;
  if(o.kind === "many"){
    const shown = o.names.slice(0, 6).map(n => `<li>${esc(n || "a fleet")}</li>`).join("") + (o.names.length > 6 ? `<li>&hellip; and ${o.names.length - 6} more</li>` : "");
    return `<h3 id="linkdlg-h">${esc(nOf(o.n, "fleet", "fleets"))} from a link</h3><ul class="ld-names">${shown}</ul>
      ${st.msg ? `<p class="ld-msg">${esc(st.msg)}</p>` : ""}
      <div class="ld-acts"><button type="button" class="btn primary" data-link="save"${st.saved ? " disabled" : ""}>${st.saved ? "Saved" : "Save all to Saved fleets"}</button>
      <button type="button" class="btn" data-link="close">Close</button></div>`;
  }
  const r = o.replaces;
  /* mine: the tab has a fleet of its own on that list that is not saved */
  const mine = !!r && !r.same && !r.saved;
  const warn = !r || r.same ? "" : r.saved
    ? `<p class="ld-note">Opening it replaces your ${esc(o.ln)} fleet on this tab (${r.pts} pts). That one is in Saved fleets as ${esc(r.saved)}.</p>`
    : `<p class="ld-warn"><b>You have an unsaved ${esc(o.ln)} fleet on this tab</b> (${r.pts} pts, ${esc(nOf(r.ships, "ship", "ships"))}). Save it first, or open the new one over it?</p>`;
  const same = r && r.same ? `<p class="ld-note">This fleet is already open on this tab.</p>` : "";
  const known = o.saved && !st.saved ? `<p class="ld-note">It is in Saved fleets already, as ${esc(o.saved)}.</p>` : "";
  const saveBtn = `<button type="button" class="btn" data-link="save"${st.saved || o.saved ? " disabled" : ""}>${st.saved ? "Saved" : mine ? "Only save the new one" : "Save to Saved fleets"}</button>`;
  const acts = mine
    ? `<button type="button" class="btn primary" data-link="keepopen">Save mine, then open</button>
       <button type="button" class="btn" data-link="open">Open over mine</button>${saveBtn}`
    : `<button type="button" class="btn primary" data-link="open">Open it</button>${saveBtn}`;
  return `<h3 id="linkdlg-h">A fleet from a link</h3>
    <p class="ld-what"><b>${esc(o.name)}</b><i>${esc(o.ln)} &middot; ${o.pts} pts &middot; ${esc(nOf(o.ships, "ship", "ships"))}</i></p>
    ${warn}${same}${known}${o.lost.length ? `<p class="ld-note">${esc(nOf(o.lost.length, "entry", "entries"))} could not be matched (${esc(o.lost.slice(0, 3).join(", "))}).</p>` : ""}
    ${st.msg ? `<p class="ld-msg">${esc(st.msg)}</p>` : ""}
    <div class="ld-acts">${acts}
    <button type="button" class="btn" data-link="close">Close</button></div>`;
}
function draw(){
  const b = box(), st = appState.LINK;
  if(!b || !st) return;
  b.innerHTML = `<div class="ld-box">${dialogHTML(st)}</div>`;
  b.hidden = false;
}
/* Shows the dialog for a link's fleet document (parsed JSON). False when the
   document is not a fleet this page can read. */
export function showLinkDialog(o){
  const offer = linkOffer(o);
  if(!offer) return false;
  appState.LINK = { offer: offer, saved: false, msg: "" };
  draw();
  const b = box(), first = b && b.querySelector ? b.querySelector('[data-link="keepopen"],[data-link="open"],[data-link="save"]') : null;
  if(first && first.focus) try{ first.focus(); }catch(e){}
  return true;
}
export function linkAction(what){
  const st = appState.LINK;
  if(!st) return null;
  if(what === "close"){ closeLinkDialog(); return "closed"; }
  if(what === "open" && st.offer.kind === "one"){
    const offer = st.offer;
    closeLinkDialog();
    return linkOpen(offer);
  }
  if(what === "keepopen" && st.offer.kind === "one"){
    const offer = st.offer;
    const kept = linkKeepMine(offer);
    closeLinkDialog();
    return (kept ? "Saved yours as " + kept + ". " : "") + linkOpen(offer);
  }
  if(what === "save"){
    st.msg = linkSave(st.offer); st.saved = true;
    render();
    draw();
    return st.msg;
  }
  return null;
}
if(typeof document !== "undefined" && document.addEventListener){
  const b = box();
  if(b) b.addEventListener("click", e => {
    const t = e.target && e.target.closest ? e.target.closest("button[data-link]") : null;
    if(!t || t.disabled) return;
    const said = linkAction(t.dataset.link);
    /* what Open did goes in the note under the title, as for a file */
    if((t.dataset.link === "open" || t.dataset.link === "keepopen") && said) fileNote(said);
  });
  document.addEventListener("keydown", e => { if(e.key === "Escape" && linkDialogOpen()) closeLinkDialog(); });
}
