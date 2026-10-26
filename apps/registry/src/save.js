import { $ } from "./boot.js";
import { fleetPoints } from "./model.js";
import { appState } from "./state.js";
import { DATA, LISTS } from "../../../packages/ui/catalog.js";
import { resolveSaved } from "../../../packages/ui/saved-fleet.js";
import DOMAIN from "../../../packages/rules/domain.js";

/* stash: the fleet built on every OTHER list, by list name. Switching lists
   used to throw the fleet away; now it is put here and comes back when the
   player returns to that list (user 20.9.). The open fleet always lives in
   S.units - one place to read, whatever the list. */
appState.S = { li:0, limit:1500, units:[], stash:{} };
/* Points of the stashed fleets, for the list menu. Computed when a fleet is
   stashed and when one is restored, never on every render: resolveFleet walks
   every rule, and the menu is drawn on every click. */
export let STASH_PTS = {};
/* S is replaced wholesale by load() and by the test harness, so the stash is
   read through here rather than assumed to exist. Each entry is
   { units, limit }: the limit belongs to the fleet, not to the app - it feeds
   the legality panel, so carrying the previous list's number over would turn
   checks green or red on a figure the player never typed for this fleet.
   A list with no fleet of its own opens on the limit already on screen.

   NOTE for anything that touches a stashed fleet: its units must never go
   through listOf / entOf / shipOf / selOf / unitPts. Those resolve against
   L(), the OPEN list, where the same indexes name a real row of a different
   ship. Pass the fleet's own list explicitly, as unitDoc(u, L0) and
   fleetPoints(units, ln) do. */
export const stashAll = () => (appState.S.stash = appState.S.stash || {});
export const stashUnits = nm => (stashAll()[nm] && stashAll()[nm].units) || [];
/* What could not be restored from the previous save, shown once in the
   top bar. Empty means everything came back. */
appState.LOAD_NOTE = "";
/* What the last file import or export had to say; shown in the same place
   while no restore note is up, and gone again after a while. */
appState.FILE_NOTE = "";
export const KEY = "gothic-fleet-registry-v1";
/* The saved document (docs/SAVE_SCHEMA.md, schema 3). Built fresh from the
   state through the adapter, never by serialising S: the store holds only
   the fields the schema names, ship options by id and list upgrades by
   name. Indexes (li, s, e) ride along as the last-resort fallback for a
   list whose names changed; index-keyed option state (os/oq) is gone.

   Schema 3 adds two per-unit fields for a borrowed ship (Fleets pg. 14):
   `lst` names the list it was bought from and `role` says whether it is a
   reserve or an ally. Both are omitted for a ship from the fleet's own
   list, so a single-list document is byte-identical to schema 2 - which is
   what lets an old save load unchanged and a new one stay readable. Every
   other per-unit field (s, e, sn, el, oi, upn) is read on the unit's OWN
   list, so `upn` can stay a section+row key without a list in it. */
/* One saved unit. L0 is the fleet's own list - a borrowed ship keeps its own
   list's section and row, and the host only decides which fleet-wide upgrade
   rows it was offered. */
/* J215: a unit's own handle, for a commander's "aboard" (the uid of his
   ship). Every unit of the open fleet gets one when it is first seen; the
   save keeps it only when another unit points at it, so a fleet without a
   choice saves exactly as before. */
appState.UID_N = 0;
export function ensureUids(units){
  units.forEach(u => { const m = /^u(\d+)$/.exec(String(u.uid || "")); if(m) appState.UID_N = Math.max(appState.UID_N, +m[1]); });
  const seen = {};
  units.forEach(u => { if(!u.uid || seen[u.uid]) u.uid = "u" + (++appState.UID_N); seen[u.uid] = 1; });
}
export function unitDocs(units, L0){
  const refs = {};
  units.forEach(u => { if(u.aboard) refs[u.aboard] = 1; if(u.cmd) refs[u.cmd] = 1; });
  return units.map(u => unitDoc(u, L0, refs));
}
export function unitDoc(u, L0, refs){
  {
      /* The unit's own list, not the fleet's: reading a borrowed ship's
         section and row off the host would name a real section and a real
         row that are the wrong ones, at the right price, silently. L0 is
         passed in rather than read from the open fleet, because a stashed
         fleet is saved while another list is open (J146) - resolving its
         rows against the open list named real rows of the wrong ship. */
      const Lu = (u.lst && LISTS.filter(x => x.nm === u.lst)[0]) || L0;
      const sc = Lu && u.s >= 0 ? Lu.secs[u.s] : null;
      const en = sc ? sc.ents[u.e] : null;
      const sh = u.ref ? DOMAIN.shipFor(u.ref, en, DATA) : null;
      const it = DOMAIN.fromLegacyUnit(u, { list: Lu, host: L0 }, DATA);
      const d = { s: u.s, e: u.e, ref: u.ref == null ? null : u.ref, n: u.n || 1, name: u.name || "" };
      if(sc) d.sn = sc.t;
      if(en) d.el = en.l;
      if(u.lst && Lu !== L0){
        d.lst = Lu.nm;
        d.role = u.role === "ally" ? "ally" : "reserve";
      }
      if(u.hn) d.hn = u.hn;
      if(u.custom != null) d.custom = u.custom;
      if(u.adj) d.adj = u.adj;
      if(u.note) d.note = u.note;
      if(u.members) d.members = u.members;
      if(u.upsOpen) d.upsOpen = 1;
      if(u.uid && refs && refs[u.uid]) d.uid = u.uid;
      if(u.aboard) d.aboard = u.aboard;
      /* J216: squadron tag and a Clanz Warlord's command */
      if(u.sq) d.sq = u.sq;
      if(u.cmd) d.cmd = u.cmd;
      /* J226: a Clanz Warlord's own clan, which his new skwadrons take */
      if(u.clan) d.clan = u.clan;
      d.oi = {}; d.oqi = {}; d.on = {};
      Object.keys(it.options).forEach(id => {
        const o = it.options[id], i = DOMAIN.optionIndex(sh, id, null);
        d.oi[id] = o.state;
        if(o.qty > 1) d.oqi[id] = o.qty;
        if(i >= 0) d.on[id] = DOMAIN.textKey(sh.ol[i].t);
      });
      d.upn = {};
      Object.keys(it.upgrades).forEach(id => {
        const p = DOMAIN.splitUpgradeId(id);
        if(!p) return;
        /* A row taken from the HOST list (Fleets pg. 14, "either fleet
           list") keeps the list name in its key: two lists can carry a
           section and a row of the same name, and a two-part key would
           come back on the wrong one. */
        d.upn[p.list === Lu.nm ? p.section + "\u0001" + p.label
                               : p.list + "\u0001" + p.section + "\u0001" + p.label]
          = it.upgrades[id];
      });
      return d;
  }
}
export function saveDocument(){
  const L0 = LISTS[appState.S.li];
  const doc = {
    schemaVersion: DOMAIN.SCHEMA_VERSION,
    li: appState.S.li, ln: L0 ? L0.nm : undefined, limit: appState.S.limit,
    units: unitDocs(appState.S.units, L0)
  };
  /* Every other list's fleet, each under its own list name. The open fleet
     stays in `units` where it has always been, so a build that knows nothing
     of this key still restores the fleet the player has open. */
  const other = Object.keys(stashAll()).filter(nm => stashUnits(nm).length);
  if(other.length)
    doc.fleets = other.map(nm => {
      const Lx = LISTS.filter(x => x.nm === nm)[0];
      return { ln: nm, limit: appState.S.stash[nm].limit | 0,
               units: unitDocs(stashUnits(nm), Lx) };
    });
  return doc;
}

export function save(){
  /* A restore that failed leaves the original in place. Writing the empty
     default over it on the first render would destroy the very data the
     backup was taken to protect; saving resumes the moment the player puts
     something in the fleet. */
  if(appState.LOAD_NOTE && !appState.S.units.length && !Object.keys(stashAll()).length) return;
  /* The document is built OUTSIDE the try. Only the write can fail for a
     reason that is not a bug; a bug in the builder used to be swallowed here,
     which is exactly how a stashed fleet went out saved against the wrong
     list without a word (J146). And a write that fails now loses every list's
     fleet, not one, so the player is told. */
  const doc = JSON.stringify(saveDocument());
  try{ localStorage.setItem(KEY, doc); }
  catch(e){
    appState.LOAD_NOTE = "This browser would not store the fleet (" +
      ((e && e.name) || "storage error") + "). Everything on screen still works, " +
      "but it will not come back after a reload.";
    const ln = $("#loadnote");
    if(ln){ ln.textContent = appState.LOAD_NOTE; ln.hidden = false; }
  }
}

export function load(){
  /* A saved fleet points at its list and sections by index, and indexes move
     whenever the book data grows: a new fleet list, or a new first section.
     Names are therefore the primary key and the index only a fallback. If
     anything fails to resolve, the original save is kept as a backup and is
     never overwritten by the empty fleet that used to replace it. */
  /* Even reading the store can throw when the browser blocks site data,
     and that must not stop the app from starting: without a save there is
     simply nothing to restore. */
  let r = null;
  try{ r = localStorage.getItem(KEY); }catch(e){
    appState.LOAD_NOTE = "This browser is blocking storage for this page, so fleets " +
      "cannot be saved or restored. Everything else works.";
    return;
  }
  if(!r) return;
  let o = null;
  try{ o = JSON.parse(r); }catch(e){
    keepBackup(r, "the saved data could not be read");
    return;
  }
  if(!o || !Array.isArray(o.units)){
    keepBackup(r, "the save has no fleet in it");
    return;
  }
  /* A save from a newer build may hold fields this version cannot read; it
     is kept untouched rather than half-restored. */
  if(typeof o.schemaVersion === "number" && o.schemaVersion > DOMAIN.SCHEMA_VERSION){
    keepBackup(r, "the save was written by a newer version of this page (schema " +
                  o.schemaVersion + ", this page reads " + DOMAIN.SCHEMA_VERSION + ")");
    return;
  }
  /* Schema 1 (before option ids) restores ship options by their position
     in the profile. That is right as long as the book data has not moved
     them, which the player cannot know - so it is said, once. The next
     save writes schema 2 and the note goes away. */
  const legacyOptions = !(o.schemaVersion >= 2) && o.units.some(u => u && u.os &&
    Object.keys(u.os).some(k => u.os[k] === "take"));
  try{

    let li = o.ln ? LISTS.findIndex(x => x.nm === o.ln) : -1;
    if(li < 0 && typeof o.li === "number" && LISTS[o.li]
       && (!o.ln || o.ln === LISTS[o.li].nm)) li = o.li;
    if(li < 0){
      keepBackup(r, "the fleet list " + (o.ln || "in the save") +
                    " is no longer in this version");
      return;
    }
    const L0 = LISTS[li];

    const lost = [];
    const kept = resolveSaved(o.units, L0, lost);
    /* Other lists' fleets (schema 4). A stash for a list this build no longer
       has is reported like any other row that could not be matched, never
       dropped in silence. */
    const stash = {};
    (Array.isArray(o.fleets) ? o.fleets : []).forEach(f => {
      if(!f || typeof f !== "object" || !Array.isArray(f.units)) return;
      const Lx = LISTS.filter(x => x.nm === f.ln)[0];
      if(!Lx){ lost.push("the fleet kept for " + (f.ln || "an unknown list")); return; }
      /* The same list twice - once open, once stashed - is a damaged document,
         not a choice to make silently: the open fleet stands and the other
         copy is reported. */
      if(Lx === L0){ lost.push("a second fleet saved for " + Lx.nm); return; }
      const us = resolveSaved(f.units, Lx, lost);
      if(us.length) stash[Lx.nm] = { units: us,
        limit: typeof f.limit === "number" && f.limit >= 0 ? f.limit : (typeof o.limit === "number" ? o.limit : 1500) };
    });
    if(lost.length)
      keepBackup(r, lost.length + " entr" + (lost.length > 1 ? "ies" : "y") +
                    " could not be matched (" + lost.slice(0, 3).join(", ") +
                    (lost.length > 3 ? ", ..." : "") + ")");

    /* Zero is a value, not a missing one: "|| 1500" turned a saved 0 into
       1500 on every reload. */
    appState.S = { li: li, units: kept, ln: L0.nm, schemaVersion: DOMAIN.SCHEMA_VERSION,
          limit: typeof o.limit === "number" && o.limit >= 0 ? o.limit : 1500,
          stash: stash };
    Object.keys(stash).forEach(nm => { STASH_PTS[nm] = fleetPoints(stash[nm].units, nm); });
    if(legacyOptions && !appState.LOAD_NOTE)
      appState.LOAD_NOTE = "This fleet was saved by an older version of the page, which stored " +
        "ship options by position. They were restored by position - check them once; " +
        "the next save records them by name.";
  }catch(e){
    keepBackup(r, "restoring the save failed part way through");
  }
}

/* Never let a failed restore overwrite the player's work. The first
   failure's copy is never overwritten - a later failure would otherwise
   replace the very data the first one was protecting - and the most
   recent one is kept beside it. */
export function keepBackup(raw, why){
  try{
    if(!localStorage.getItem(KEY + "-backup"))
      localStorage.setItem(KEY + "-backup", raw);
    localStorage.setItem(KEY + "-backup-last", raw);
    appState.LOAD_NOTE = "Part of the saved fleet could not be restored: " + why +
      ". Nothing was overwritten \u2014 the previous save is kept in this " +
      "browser under " + KEY + "-backup.";
  }catch(e){}
}

/* The list this FLEET is built from. */
