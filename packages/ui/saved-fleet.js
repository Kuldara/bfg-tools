import { DATA, LISTS, SHIPS } from "./catalog.js";

/* A saved fleet document back to a fleet the app can open (docs/SAVE_SCHEMA.md).
   Shared by the Registry and Play. */
import DOMAIN from "../rules/domain.js";

/* Resolve one saved fleet against its list: sections and rows by name with
   the index as a fallback, then ship options and upgrade choices. Runs once
   for the open fleet and once for every stashed one (J146), so a fleet kept
   under another list survives a book update on exactly the same terms. */
export function resolveSaved(units, L0, lost){
  /* Schema 3: a unit may name the list it was bought from. Everything
     about it - section, row, options, upgrades - is then read on THAT
     list. A missing donor list is reported, never quietly resolved
     against the host: the host's row at the same index is a different
     ship at a different price, and the player would never be told. */
  const LX = u => (u && u.lst) ? (LISTS.filter(x => x.nm === u.lst)[0] || null) : L0;

  const findSec = (u, Lx) => {
    if(u.sn){
      const i = Lx.secs.findIndex(x => x.t === u.sn);
      if(i >= 0) return i;
    }
    return (Lx.secs[u.s] ? u.s : -1);
  };
  const kept = [];
  (units || []).forEach(u => {
    if(!u || typeof u !== "object"){ lost.push("a damaged row"); return; }
    const Lx = LX(u);
    if(!Lx){ lost.push(u.el || ("a ship from " + u.lst)); return; }
    let si = findSec(u, Lx);
    let ei = -1;
    if(si >= 0){
      const ents = Lx.secs[si].ents;
      if(!u.el) ei = ents[u.e] ? u.e : -1;
      else if(ents[u.e] && ents[u.e].l === u.el) ei = u.e;
      else ei = ents.findIndex(e => e.l === u.el);
    }
    if(ei < 0 && u.el){
      /* The row moved to another section - look for it by name. */
      for(let i = 0; i < Lx.secs.length && ei < 0; i++){
        const j = Lx.secs[i].ents.findIndex(e => e.l === u.el);
        if(j >= 0){ si = i; ei = j; }
      }
    }
    /* A role that is neither reserve nor ally means core to the engine,
       and a borrowed ship without a role is a red check - so a damaged
       role is repaired to reserve rather than carried through. */
    if(u.lst) u.role = u.role === "ally" ? "ally" : "reserve";
    if(si < 0 || ei < 0){ lost.push(u.el || "a row"); return; }
    u.s = si; u.e = ei;
    /* A chosen hull is saved by page and by name; the name wins when the
       page no longer resolves to it (a renumbered book). */
    if(u.hn && !(SHIPS[String(u.ref)] && SHIPS[String(u.ref)].nm === u.hn)){
      const k = Object.keys(SHIPS).find(p => SHIPS[p].nm === u.hn);
      if(k) u.ref = isNaN(+k) ? k : +k;
    }
    kept.push(u);
  });

  /* Ship options (schema 2): id first, then the 40-character text key,
     and only a save without oi falls back to the index-keyed os/oq. An
     option that matches neither is reported, not silently dropped. */
  kept.forEach(u => {
    if(!u.oi || typeof u.oi !== "object") return;
    const Lx = LX(u) || L0;
    const sh = DOMAIN.shipFor(u.ref, Lx.secs[u.s] ? Lx.secs[u.s].ents[u.e] : null, DATA);
    if(!sh) return;
    const os = {}, oq = {};
    const place = id => DOMAIN.optionIndex(sh, id, u.on && u.on[id]);
    Object.keys(u.oi).forEach(id => {
      const i = place(id);
      if(i < 0){ lost.push((u.on && u.on[id]) || "an option"); return; }
      os[i] = u.oi[id];
      if(u.oqi && u.oqi[id] > 1) oq[i] = u.oqi[id];
    });
    Object.keys(u.oqi || {}).forEach(id => {
      if(u.oi[id]) return;
      const i = place(id);
      if(i >= 0 && u.oqi[id] > 1) oq[i] = u.oqi[id];
    });
    u.os = os; u.oq = oq; u.opts = [];
  });

  /* Upgrade choices are stored by section + row name, so they survive a
     section moving. One saved purchase must produce exactly one purchase:
     resolving row by row instead let a same-named row in another section
     take the choice by fallback and the right row take it again by exact
     match, which doubled a paid Mark of Khorne. Exact matches are settled
     first, leftovers only afterwards and only when a single row fits. */
  kept.forEach(u => {
    if(!u.upn) return;
    const ups = {}, usedKey = {}, filled = {};
    /* Only rows this unit is actually offered: a row with an attachment
       list must name this unit. */
    const targets = [];
    const Lx = LX(u) || L0;
    Lx.secs.forEach((sec, si) => sec.ents.forEach((en, ei) => {
      if(en.k !== "up") return;
      if(en.at && !en.at.some(p => p[0] === u.s && p[1] === u.e)) return;
      targets.push({ si: si, ei: ei, label: en.l,
                     key: sec.t + "\u0001" + en.l });
    }));
    /* A borrowed ship is also offered the HOST list's own fleet-wide
       rows (Fleets pg. 14). The index is shifted by 1000 the same way
       domain.js HOST_OFF does, and the key carries the list name. */
    if(u.lst && Lx !== L0)
      L0.secs.forEach((sec, si) => sec.ents.forEach((en, ei) => {
        if(en.k !== "up" || en.at || en.req) return;
        targets.push({ si: 1000 + si, ei: ei, label: en.l,
                       key: L0.nm + "\u0001" + sec.t + "\u0001" + en.l });
      }));
    targets.forEach(t => {
      const v = u.upn[t.key];
      if(!v || usedKey[t.key]) return;
      ups[t.si + ":" + t.ei] = v;
      usedKey[t.key] = 1; filled[t.si + ":" + t.ei] = 1;
    });
    Object.keys(u.upn).forEach(k => {
      if(usedKey[k] || u.upn[k] === "off") return;
      const nm = k.split("\u0001")[1];
      const fit = targets.filter(t => t.label === nm &&
                                      !filled[t.si + ":" + t.ei]);
      if(fit.length !== 1) return;      /* ambiguous: report it instead */
      ups[fit[0].si + ":" + fit[0].ei] = u.upn[k];
      usedKey[k] = 1; filled[fit[0].si + ":" + fit[0].ei] = 1;
    });
    Object.keys(u.upn).forEach(k => {
      if(!usedKey[k] && u.upn[k] !== "off")
        lost.push(k.split("\u0001")[1] || k);
    });
    u.ups = ups;
  });
  return kept;
}
