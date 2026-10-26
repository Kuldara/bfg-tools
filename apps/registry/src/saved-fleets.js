import { $, APP_VERSION } from "./boot.js";
import { FILE_TAG, fileNote, fleetDocument } from "./fleet-files.js";
import { L, fleetPoints, switchList, total } from "./model.js";
import { placeSaves } from "./panels.js";
import { copyBoxHTML, phonePanelHTML } from "./phone.js";
import { STASH_PTS, stashAll, stashUnits, unitDocs } from "./save.js";
import { appState } from "./state.js";
import { render } from "./view.js";
import { LISTS } from "../../../packages/ui/catalog.js";
import { esc } from "../../../packages/ui/format.js";
import { resolveSaved } from "../../../packages/ui/saved-fleet.js";
import DOMAIN from "../../../packages/rules/domain.js";

/* ----------------------------------------------- named saved fleets ---- */
/* (user 19.10.2026: "add saving fleets by name, as a separate save; the QR
   code then adds fleets there; the app of course still remembers edits when
   you switch fleets, as now; and export file also as export all as file")
   The library is a store of its own (KEY_LIB, apps/registry/docs/save-format.md):
   the working save under KEY is untouched - every list still keeps its
   unsaved fleet by itself - and Save copies the open fleet in here under a
   name. A saved fleet is a fleet document in the file's shape (names first,
   indexes as a fallback) with an id, a name, its points and a date.
   lib.open says which saved fleet each list's working fleet came from, so
   Save updates it and the bar can say whether there are unsaved changes. */
export const KEY_LIB = "gothic-fleet-registry-saves-v1";
export function libRead(){
  let o = null;
  try{ o = JSON.parse(localStorage.getItem(KEY_LIB) || "null"); }catch(e){}
  const saves = o && Array.isArray(o.saves) ? o.saves.filter(s => s && typeof s === "object" && s.id && Array.isArray(s.units)) : [];
  return { v: 1, saves: saves, open: o && o.open && typeof o.open === "object" ? o.open : {} };
}
export function libWrite(lib){
  try{ localStorage.setItem(KEY_LIB, JSON.stringify(lib)); return true; }
  catch(e){ fileNote("This browser would not store the saved fleets (" + ((e && e.name) || "storage error") + ")."); return false; }
}
export const libToday = () => { const d = new Date(), p = n => (n < 10 ? "0" : "") + n; return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate()); };
export let LIB_SEQ = 0;
export const libId = () => Date.now().toString(36) + "-" + (LIB_SEQ++).toString(36);
/* Two documents are the same fleet when list, limit and ships are. */
export const libKey = d => JSON.stringify([d.ln, d.limit | 0, d.units]);
/* A name that is not taken yet: "Name", then "Name (2)" ... */
export function libName(lib, nm, skip){
  const taken = n => lib.saves.some(s => s.name === n && s.id !== skip);
  if(!taken(nm)) return nm;
  let k = 2;
  while(taken(nm + " (" + k + ")")) k++;
  return nm + " (" + k + ")";
}
/* The fleet in front of the player as a document, without the file's tags. */
export function openDoc(){
  const d = fleetDocument(L().nm);
  return d ? { ln: d.ln, limit: d.limit, units: d.units } : { ln: L().nm, limit: appState.S.limit | 0, units: [] };
}
/* A list's kept (stashed) fleet as a document, read on its own list. */
export function stashDoc(nm){
  const Lx = LISTS.filter(x => x.nm === nm)[0], k = stashAll()[nm];
  return { ln: nm, limit: k ? k.limit | 0 : 0, units: k ? unitDocs(k.units, Lx) : [] };
}
/* The saved fleet the open one came from or was last saved as. */
export function openSave(lib){
  lib = lib || libRead();
  const id = lib.open[L().nm];
  return lib.saves.filter(s => s.id === id)[0] || null;
}
/* Unsaved: ships on the list and no save of them, or changes since it. */
export function openUnsaved(lib){
  if(!appState.S.units.length) return false;
  const s = openSave(lib);
  return !s || libKey(s) !== libKey(openDoc());
}
/* Save the open fleet: over the saved fleet it came from (renamed if the
   name changed), or as a new one. Returns the saved fleet. */
export function saveOpenAs(name, asNew){
  if(!appState.S.units.length) return null;
  const lib = libRead(), doc = openDoc();
  const nm = String(name == null ? "" : name).trim() || (L().nm + " " + total());
  let s = asNew ? null : openSave(lib);
  if(s){
    s.name = libName(lib, nm, s.id); s.ln = doc.ln; s.limit = doc.limit; s.units = doc.units;
    s.pts = total(); s.saved = libToday(); delete s.from;
  }else{
    s = { id: libId(), name: libName(lib, nm), ln: doc.ln, limit: doc.limit, units: doc.units, pts: total(), saved: libToday() };
    lib.saves.unshift(s);
  }
  lib.open[doc.ln] = s.id;
  libWrite(lib);
  return s;
}
/* Fleets from a file, pasted text or a link with several fleets go into the
   library, never over a fleet on screen: nothing is lost and nothing has to
   be asked (a link with one fleet opens it: receiveFleet). A fleet already
   saved here (same list, limit and ships) is not added twice. A fleet
   document is one fleet (units) and any number more (fleets), each with an
   optional name. Returns { ids, notes }. */
export function libAdd(o, how){
  const out = { ids: [], notes: [] };
  if(!o || typeof o !== "object" || !Array.isArray(o.units)){ out.notes.push("there is no fleet in it"); return out; }
  if(typeof o.schemaVersion === "number" && o.schemaVersion > DOMAIN.SCHEMA_VERSION){
    out.notes.push("it was written by a newer version of this page (schema " + o.schemaVersion + ", this page reads " + DOMAIN.SCHEMA_VERSION + ")");
    return out;
  }
  const lib = libRead(), added = [];
  [o].concat(Array.isArray(o.fleets) ? o.fleets : []).forEach(d => {
    if(!d || typeof d !== "object" || !Array.isArray(d.units)) return;
    let Lx = LISTS.filter(x => x.nm === d.ln)[0];
    if(!Lx && !d.ln && typeof d.li === "number") Lx = LISTS[d.li];
    if(!Lx){ out.notes.push("the fleet list " + (d.ln || "in it") + " is not in this version"); return; }
    if(!d.units.length) return;
    const doc = { ln: Lx.nm, limit: typeof d.limit === "number" && d.limit >= 0 ? d.limit | 0 : appState.S.limit | 0, units: d.units };
    const same = lib.saves.concat(added).filter(s => libKey(s) === libKey(doc))[0];
    if(same){ out.notes.push((d.name || Lx.nm) + " is saved here already, as " + same.name); return; }
    const lost = [];
    const pts = fleetPoints(resolveSaved(JSON.parse(JSON.stringify(d.units)), Lx, lost), Lx.nm);
    if(lost.length)
      out.notes.push(lost.length + " entr" + (lost.length > 1 ? "ies" : "y") + " of " + (d.name || Lx.nm) + " could not be matched (" +
                     lost.slice(0, 3).join(", ") + (lost.length > 3 ? ", ..." : "") + ")");
    const s = { id: libId(), name: libName({ saves: lib.saves.concat(added) }, String(d.name || "").trim() || (Lx.nm + " " + pts)),
                ln: doc.ln, limit: doc.limit, units: doc.units, pts: pts, saved: libToday(), from: how };
    added.push(s); out.ids.push(s.id);
  });
  if(added.length){ lib.saves = added.concat(lib.saves); libWrite(lib); }
  return out;
}
export function libAddText(text, how){
  let o = null;
  try{ o = JSON.parse(text); }catch(e){ return { ids: [], notes: ["it is not a fleet: it could not be read as JSON"] }; }
  return libAdd(o, how);
}
/* A saved fleet's units as this page writes them (the shape openDoc gives),
   so a fleet that came in a file or a link compares equal to the same fleet
   once it is open. */
export function libNormal(d){
  const Lx = LISTS.filter(x => x.nm === d.ln)[0];
  if(!Lx) return d;
  return { ln: d.ln, limit: d.limit | 0, units: unitDocs(resolveSaved(JSON.parse(JSON.stringify(d.units)), Lx, []), Lx) };
}
/* The saved fleet that is this document, as written or once normalised. */
export function libFind(lib, doc){
  const k = libKey(doc);
  return lib.saves.filter(s => libKey(s) === k)[0] ||
         lib.saves.filter(s => s.ln === doc.ln && libKey(libNormal(s)) === k)[0] || null;
}
/* ------------------------------------------------ a fleet from a link ---- */
/* J240 (user 26.10.2026: opening a friend's fleet link worked once, and the
   next links opened the same fleet again; "the link's fleet always on screen
   and in Saved fleets at the same time"). A link with ONE fleet opens it on
   its own list and keeps it in Saved fleets under the name it came with, so
   the fleet on screen is a saved one and the next link can take the screen
   without asking and without losing anything. Whatever that list had before
   goes into Saved fleets first unless it is there already - the player's own
   unsaved work included. The same fleet twice is one saved fleet. A link with
   several fleets is not this case: libAdd puts them into Saved fleets.
   Returns null when the document is not one fleet this page can open, else
   { id, name, kept, keptId, lost }. The caller renders. */
export function receiveFleet(o){
  if(!o || typeof o !== "object" || !Array.isArray(o.units) || !o.units.length) return null;
  if(Array.isArray(o.fleets) && o.fleets.length) return null;
  if(typeof o.schemaVersion === "number" && o.schemaVersion > DOMAIN.SCHEMA_VERSION) return null;
  const li = LISTS.findIndex(x => x.nm === o.ln);
  if(li < 0) return null;
  const Lx = LISTS[li], here = li === appState.S.li;
  const lost = [], units = resolveSaved(JSON.parse(JSON.stringify(o.units)), Lx, lost);
  if(!units.length) return null;
  const limit = typeof o.limit === "number" && o.limit >= 0 ? o.limit | 0 : appState.S.limit | 0;
  const doc = { ln: Lx.nm, limit: limit, units: unitDocs(units, Lx) };
  const pts = fleetPoints(units, Lx.nm);
  const lib = libRead();
  /* what the list had: kept unless it is saved already, as itself or as this link */
  const cur = here ? openDoc() : stashDoc(Lx.nm);
  let kept = null;
  if(cur.units.length && libKey(cur) !== libKey(doc) && !libFind(lib, cur)){
    const was = lib.saves.filter(s => s.id === lib.open[Lx.nm])[0];
    const curPts = here ? total() : (STASH_PTS[Lx.nm] || fleetPoints(stashUnits(Lx.nm), Lx.nm));
    kept = { id: libId(), name: libName(lib, was ? was.name + " (changed)" : Lx.nm + " " + curPts),
             ln: Lx.nm, limit: cur.limit | 0, units: cur.units, pts: curPts, saved: libToday(), from: "kept" };
    lib.saves.unshift(kept);
  }
  /* the link's fleet into Saved fleets, once */
  let s = libFind(lib, doc);
  if(!s){
    s = { id: libId(), name: libName(lib, String(o.name || "").trim() || (Lx.nm + " " + pts)),
          ln: Lx.nm, limit: limit, units: doc.units, pts: pts, saved: libToday(), from: "link" };
    lib.saves.unshift(s);
  }else{
    /* stored as this page writes it, so the open fleet reads as saved */
    s.units = doc.units; s.limit = limit;
  }
  lib.open[Lx.nm] = s.id;
  /* A library that cannot be written keeps nothing: the list's own fleet is
     then not replaced (the caller says the link could not be kept). */
  if(!libWrite(lib) && kept) return null;
  if(!here) switchList(li);
  appState.S.units = units; appState.S.limit = limit;
  appState.SAVE_NAME = null;
  LIB_NEW = [s.id].concat(kept ? [kept.id] : []);
  return { id: s.id, name: s.name, kept: kept ? kept.name : null, keptId: kept ? kept.id : null, lost: lost };
}
/* Open a saved fleet on its own list. The list's working fleet gives way
   only when nothing would be lost: it is empty, the same, or saved; other
   changes are asked about first. */
export function libOpen(id){
  const lib = libRead(), s = lib.saves.filter(x => x.id === id)[0];
  if(!s) return false;
  const li = LISTS.findIndex(x => x.nm === s.ln);
  if(li < 0){ fileNote("The fleet list " + s.ln + " is not in this version."); return false; }
  const open = li === appState.S.li;
  const cur = open ? openDoc() : stashDoc(s.ln);
  const curSave = lib.saves.filter(x => x.id === lib.open[s.ln])[0];
  const lose = cur.units.length && libKey(cur) !== libKey(s) && !(curSave && libKey(curSave) === libKey(cur));
  if(lose && !confirm("The " + s.ln + " fleet on this list has changes that are not saved (" +
                      (open ? total() : (STASH_PTS[s.ln] || 0)) + " pts). Open " + s.name + " and drop them?")) return false;
  const lost = [], units = resolveSaved(JSON.parse(JSON.stringify(s.units)), LISTS[li], lost);
  if(!open) switchList(li);
  appState.S.units = units;
  if(typeof s.limit === "number") appState.S.limit = s.limit;
  lib.open[s.ln] = s.id;
  libWrite(lib);
  render();
  if(lost.length) fileNote("Opened " + s.name + " with notes: " + lost.length + " entr" + (lost.length > 1 ? "ies" : "y") + " could not be matched (" + lost.slice(0, 3).join(", ") + ").");
  return true;
}
export function libDelete(id){
  const lib = libRead();
  lib.saves = lib.saves.filter(s => s.id !== id);
  Object.keys(lib.open).forEach(k => { if(lib.open[k] === id) delete lib.open[k]; });
  libWrite(lib);
}
/* What goes to a file, the clipboard or a phone: one saved fleet, or all
   of them in one document - the first as its fleet, the rest as fleets,
   names kept (the play page and Import read the same shape). */
export const libOne = s => ({ name: s.name, ln: s.ln, limit: s.limit, units: s.units });
export function libDocument(which){
  const lib = libRead();
  const list = which === "all" ? lib.saves : lib.saves.filter(s => s.id === which);
  if(!list.length) return null;
  const doc = Object.assign({ schemaVersion: DOMAIN.SCHEMA_VERSION }, libOne(list[0]));
  if(list.length > 1) doc.fleets = list.slice(1).map(libOne);
  return doc;
}
/* Export: one saved fleet as a file, or all of them as one. */
export function exportSaved(which){
  const doc = libDocument(which);
  if(!doc) return;
  const n = 1 + (doc.fleets || []).length;
  const clean = t => String(t).replace(/ [^\w\s] /g, " - ").replace(/[^\w .()-]+/g, "_").replace(/\s+/g, " ").trim();
  const fname = which === "all" ? "Gothic Fleet Registry - " + n + " saved fleet" + (n > 1 ? "s" : "") + ".json"
                                : clean(doc.name + " - " + doc.ln) + ".json";
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([JSON.stringify(Object.assign({ app: FILE_TAG, page: APP_VERSION }, doc), null, 1)], { type: "application/json" }));
  a.download = fname;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  fileNote("Exported " + (which === "all" ? n + " saved fleet" + (n > 1 ? "s" : "") : doc.name) + " as " + fname + ".");
}
/* Fleets just added by a file or a link are marked in the panel. */
export let LIB_NEW = [];
export function afterAdd(r, where){
  LIB_NEW = r.ids.slice();
  render();
  fileNote((r.ids.length ? "Added " + r.ids.length + " fleet" + (r.ids.length > 1 ? "s" : "") + " from " + where + " to Saved fleets."
                         : "Nothing was added from " + where + ".") + (r.notes.length ? " Notes: " + r.notes.join("; ") + "." : ""));
  if(r.ids.length){ const d = $("#saves"); if(d){ d.open = true; placeSaves(); } }
}

/* The Save button's panel: the name, Save and Save as new, and what the
   open fleet is now - not saved yet, saved, or changed since it was. */
appState.SAVE_NAME = null; appState.SAVE_MSG = "";
export function renderSaveNow(lib){
  const box = $("#savebody"), dot = $("#savedot");
  const unsaved = openUnsaved(lib), s = openSave(lib);
  if(dot) dot.hidden = !unsaved;
  if(!box) return;
  if(!appState.S.units.length){ box.innerHTML = `<div class="empty">Add ships first. Save keeps the open fleet in Saved fleets under a name, and Open there brings it back.</div>`; return; }
  const nm = appState.SAVE_NAME != null ? appState.SAVE_NAME : (s ? s.name : (L().nm + " " + total()));
  const state = s ? (unsaved ? "Changed since it was saved as " + esc(s.name) + " (" + esc(s.saved) + "). Save updates it; Save as new keeps both."
                             : "Saved as " + esc(s.name) + " (" + esc(s.saved) + ").")
                  : "Not saved yet: it goes into Saved fleets. Every list also remembers its unsaved fleet by itself, as before.";
  box.innerHTML = `<div class="rowf"><span class="nm"><b>Save the open fleet as</b><i>${state}</i></span>
      <input type="text" id="savename" value="${esc(nm)}" maxlength="80" aria-label="Name of the saved fleet"></div>
    <div class="rowf"><button class="go pri" data-saveopen="">Save</button>${s ? `<button class="go" data-saveopen="new">Save as new</button>` : ""}<span class="msg">${esc(appState.SAVE_MSG)}</span></div>`;
}
export function doSave(asNew){
  const inp = $("#savename");
  const s = saveOpenAs(inp && inp.value != null ? inp.value : appState.SAVE_NAME, asNew);
  if(!s) return;
  appState.SAVE_NAME = null; appState.SAVE_MSG = "Saved as " + s.name;
  render();
}
/* The Saved fleets panel: the saved fleets with Open, Export, Copy, To
   phone and Delete; the fleets being edited, one per list, as before; and
   Export all as file, Copy all, All to phone and Import file. */
export function renderSaves(){
  const lib = libRead();
  renderSaveNow(lib);
  const sc = $("#savescount"); if(sc) sc.textContent = String(lib.saves.length);
  const sb = $("#savesbody");
  if(!sb) return;
  const openId = appState.S.units.length ? lib.open[L().nm] : null;
  const changed = openUnsaved(lib);
  const saved = lib.saves.map(s => {
    const isOpen = s.id === openId && s.ln === L().nm;
    const meta = [esc(s.ln), (s.pts | 0) + " pts", esc(s.saved || ""), s.from === "link" ? "from a link" : s.from === "file" ? "from a file" : s.from === "paste" ? "pasted" : s.from === "kept" ? "kept when a link opened" : "",
                  isOpen ? (changed ? "open, changed" : "open") : ""].filter(Boolean).join(" &middot; ");
    return `<div class="rowf${isOpen ? " open" : ""}${LIB_NEW.indexOf(s.id) >= 0 ? " fresh" : ""}"><span class="nm"><b>${esc(s.name)}</b><i>${meta}</i></span>${
      isOpen ? "" : `<button class="go" data-libopen="${esc(s.id)}" title="${esc("Open " + s.name + " on the " + s.ln + " list")}">Open</button>`
    }<button class="go" data-libexport="${esc(s.id)}" title="${esc("Save " + s.name + " as a file")}">Export</button><button class="go" data-copytext="${esc(s.id)}" title="${esc("Copy " + s.name + " as text: paste it into Gothic Fleet Play, a message, or Paste text here")}">Copy</button><button class="go${appState.PHONE.key === s.id ? " on" : ""}" data-phone="${esc(s.id)}" title="${esc("A QR code of " + s.name + " for Gothic Fleet Play on a phone")}">To phone</button><button class="del" data-libdel="${esc(s.id)}" title="${esc("Delete the saved fleet " + s.name)}">Delete</button></div>${
      appState.COPYBOX && appState.COPYBOX.key === s.id ? copyBoxHTML() : ""}${appState.PHONE.key === s.id ? phonePanelHTML() : ""}`;
  }).join("");
  const kept = Object.keys(stashAll()).filter(nm => stashUnits(nm).length).sort();
  const work = (appState.S.units.length ? [{ nm: L().nm, pts: total(), n: appState.S.units.length, open: true }] : [])
    .concat(kept.map(nm => ({ nm: nm, pts: STASH_PTS[nm] || 0, n: stashUnits(nm).length, open: false })));
  const editing = work.map(r => {
    const sv = lib.saves.filter(s => s.id === lib.open[r.nm])[0];
    const state = r.open ? (changed ? (sv ? "changed since " + esc(sv.name) : "not saved") : "saved as " + esc(sv ? sv.name : ""))
                         : (sv ? "last saved as " + esc(sv.name) : "not saved");
    return `<div class="rowf${r.open ? " open" : ""}"><span class="nm"><b>${esc(r.nm)}</b><i>${r.pts} pts &middot; ${r.n} unit${r.n === 1 ? "" : "s"} &middot; ${state}</i></span>${
      r.open ? "" : `<button class="go" data-open="${esc(r.nm)}" title="${esc("Go to the " + r.nm + " list")}">Open</button>`
    }<button class="del" data-drop="${esc(r.nm)}" title="${esc(r.open ? "Clear the open fleet (its saved copy stays)" : "Discard the " + r.nm + " fleet being edited")}">${r.open ? "Clear" : "Discard"}</button></div>`;
  }).join("");
  sb.innerHTML = `<div class="sh">Saved</div>` +
    (saved || `<div class="empty">No saved fleets yet. Save keeps the open fleet here under a name; a file or a QR code adds fleets here too.</div>`) +
    (editing ? `<div class="sh">Being edited, one per list</div>` + editing : "") +
    `<div class="rowf tools"><span class="nm"><i>Export makes a file and Copy the same as text; To phone is a QR code of it for Gothic Fleet Play. Import file and Paste text add them back here.</i></span>${
      lib.saves.length ? `<button class="go" data-libexport="all" title="Every saved fleet in one file">Export all as file</button><button class="go" data-copytext="all" title="Every saved fleet as one text">Copy all</button><button class="go${appState.PHONE.key === "all" ? " on" : ""}" data-phone="all" title="Every saved fleet in one QR code for Gothic Fleet Play on a phone">All to phone</button>` : ""
    }<button class="go" data-import title="Add the fleets in a file saved with Export">Import file</button><button class="go${appState.PASTEBOX ? " on" : ""}" data-pasteopen title="Add fleets from text made with Copy">Paste text</button></div>${
      appState.COPYBOX && appState.COPYBOX.key === "all" ? copyBoxHTML() : ""}${appState.PHONE.key === "all" ? phonePanelHTML() : ""}${appState.PASTEBOX ? pasteBoxHTML() : ""}`;
}
/* Paste text: Copy's text back into Saved fleets (user 23.10.2026: "how do
   I paste that copied text back into a fleet?"). The same reader as
   Import file and a link, so a pasted text adds what the file would. */
appState.PASTEBOX = false; appState.PASTE_TEXT = "";
export function pasteBoxHTML(){
  return `<div class="phonebox"><p>Paste the text from Copy or Copy all (the same as an exported file) and add it to Saved fleets.</p>
    <textarea id="pastebox" class="plink" rows="5" aria-label="Fleet text to add" placeholder="Paste the copied fleet here">${esc(appState.PASTE_TEXT)}</textarea>
    <div class="pbtns"><button class="go" data-pasteadd>Add to Saved fleets</button><button class="go" data-pasteclose>Cancel</button></div></div>`;
}

