import { findEntry, findUpgradeEntry, optionIndex, shipFor, splitUpgradeId } from "./legacy.js";
import { listOfIntent } from "./lending.js";
import { coveredRowExcludes, coversExcludedRow } from "./unit.js";

/* frees: what a row includes for free, so a purchase it replaces is said to
   be included rather than in conflict (Assault Karrier, Fleets p. 373). A
   row label is read as it is; an option's sentence anywhere ("it may carry
   boarding torpedoes"). */
function inclIn(en, text, anywhere){
  if(!en || !en.frees) return false;
  return new RegExp(anywhere ? String(en.frees).replace(/^\^/, "") : en.frees, "i").test(String(text || ""));
}
import { HOST_OFF, condOK, coveredByShipOption, hostUpgradesAllowed, optCount, optState, rowAttached, secOf, selectionOf } from "./upgrades.js";

/* ===================== P1-8e: validation and transitions =====================
   Three responsibilities, kept apart (docs/DOMAIN_CONTRACT.md, rule 6):
     validateIntent(intent, ctx, catalog) -> Issue[]        never changes the intent
     transition(intent, action, ctx, catalog) -> {intent, notices}   the UI's deliberate change
     resolveUnit(...)                              deterministic for a valid AND an invalid intent
   An invalid intent - loaded from an old save, or built by a test - stays as it
   is and is described by structured issues; only a transition changes choices,
   and every choice it drops is reported as a notice the UI shows. */
export function issue(code, severity, path, message, page){
  return { code: code, severity: severity, path: path, message: message, sourcePage: page == null ? null : page };
}
export function shortText(t){ var s = String(t || ""); return s.length > 48 ? s.slice(0, 45) + "..." : s; }

export function validateIntent(intent, ctx, catalog){
  var out = [];
  var L = listOfIntent(intent, ctx, catalog);
  var at = intent.entry && L ? findEntry(L, intent.entry.section, intent.entry.label) : null;
  if(intent.entry && !at) out.push(issue("entry.unknown", "error", "entry", "list row not found: " + intent.entry.label));
  var en = at ? L.secs[at.si].ents[at.ei] : null;
  var sh = shipFor(intent.ref, en, catalog);
  if(intent.ref != null && !sh) out.push(issue("ship.unknown", "error", "ref", "profile not found: " + intent.ref));
  if(en && en.hc && sh && (en.hulls || []).map(String).indexOf(String(intent.ref)) < 0)
    out.push(issue("hull.unknown", "error", "hull", "hull " + intent.ref + " is not one this row offers", sh.pg));
  var sel = selectionOf(intent, ctx, catalog);
  var ol = (sh && sh.ol) || [];
  Object.keys(intent.options || {}).forEach(function(id){
    if(optionIndex(sh, id, null) < 0)
      out.push(issue("option.unknown_id", "error", "options." + id, "option id not in profile " + intent.ref, sh ? sh.pg : null));
  });
  var seenGrp = {};
  ol.forEach(function(o, i){
    if(optState(sel, i) !== "take") return;
    var path = "options." + o.id;
    if(o.dep != null && ol[o.dep] && optState(sel, o.dep) !== "take")
      out.push(issue("option.dependency", "error", path,
        "'" + shortText(o.t) + "' needs '" + shortText(ol[o.dep].t) + "' taken first", sh.pg));
    if(o.grp && !seenGrp[o.grp]){
      var max = Math.max(1, o.gmax || 1);
      var taken = ol.filter(function(p, j){ return p.grp === o.grp && optState(sel, j) === "take"; });
      if(taken.length > max){
        seenGrp[o.grp] = 1;
        out.push(issue("option.exclusive", "error", path,
          taken.length + " options taken where the profile allows " + max, sh.pg));
      }
    }
    if(o.sw) ol.forEach(function(p, j){
      if(j <= i || !p.sw || optState(sel, j) !== "take") return;
      if((o.sw.f || []).some(function(f){ return (p.sw.f || []).indexOf(f) >= 0; }))
        out.push(issue("option.swap_conflict", "error", path,
          "'" + shortText(o.t) + "' and '" + shortText(p.t) + "' replace the same weapon", sh.pg));
    });
  });
  /* (J20 a) a taken option the configuration blocks - a Warsphere's +1
     shield with the ship cut below 10 Hits (Fleets p. 494) */
  if(sh){
    var hpIn = +sh.hp || 0;
    ol.forEach(function(p, j){ if(optState(sel, j) === "take" && p.mod && p.mod.hp) hpIn += p.mod.hp * optCount(sel, j); });
    ol.forEach(function(o, i){
      if(optState(sel, i) === "take" && o.hpmin && hpIn < o.hpmin)
        out.push(issue("option.hpmin", "error", "options." + o.id,
          "'" + shortText(o.t) + "' needs " + o.hpmin + " Hits; the ship has " + hpIn + " as configured", sh.pg));
    });
  }
  /* (J171) a module cap over several repeatable options: "no more than four
     other modules can be added to a single core" (Fleets p. 480) */
  if(sh && sh.modmax){
    var modN = 0;
    ol.forEach(function(o, i){ if(o.mods && optState(sel, i) === "take") modN += optCount(sel, i); });
    if(modN > sh.modmax.n)
      out.push(issue("option.modules", "error", "options",
        modN + " modules where the core takes " + sh.modmax.n, sh.modmax.pg));
  }
  var seenUpGrp = {};
  /* A host-list row (p. 14, upgrades from either list) is a legal id just
     like a row of the unit's own list, and its section index is moved by
     HOST_OFF as selectionOf does - otherwise a legal, correctly priced
     purchase would show the player a red error (spot check 20, seed
     2026091412). */
  var hostUpV = hostUpgradesAllowed(L, ctx && ctx.host ? ctx.host : null) ? ctx.host : null;
  var rowOf = function(id){
    var p = splitUpgradeId(id);
    var a2 = p && L && p.list === L.nm ? findUpgradeEntry(L, p.section, p.label, sel.si, sel.ei) : null;
    if(a2) return { at: a2, en: L.secs[a2.si].ents[a2.ei] };
    var a3 = p && hostUpV && p.list === hostUpV.nm
           ? findUpgradeEntry(hostUpV, p.section, p.label, -1, -1) : null;
    return a3 ? { at: { si: HOST_OFF + a3.si, ei: a3.ei }, en: hostUpV.secs[a3.si].ents[a3.ei] } : null;
  };
  Object.keys(intent.upgrades || {}).forEach(function(id){
    var st = intent.upgrades[id];
    var row = rowOf(id);
    if(!row){ out.push(issue("upgrade.unknown_id", "error", "upgrades." + id, "upgrade row not found or not attached to this unit")); return; }
    if(st === "off") return;
    var e2 = row.en;
    if(e2.req) return;
    if(st === "take" && !rowAttached(sel, row.at.si, e2)){
      out.push(issue("upgrade.unattached", "error", "upgrades." + id,
        "'" + e2.l + "' is aimed at other ships of the list, not this one", e2.src_page));
      return;
    }
    if(coveredByShipOption(sel, e2))
      out.push(issue("upgrade.covered", "warning", "upgrades." + id,
        "'" + e2.l + "' is one of the ship's own options; the list row is not counted", e2.src_page));
    else if(!condOK(sel, e2, row.at.si, row.at.ei))
      out.push(issue("upgrade.ineligible", "warning", "upgrades." + id,
        "'" + e2.l + "' is not available to this ship as configured; it is not counted", e2.src_page));
    if(st === "take" && e2.grp && !seenUpGrp[e2.grp]){
      var others = Object.keys(intent.upgrades).filter(function(id2){
        if(id2 === id || intent.upgrades[id2] !== "take") return false;
        var r2 = rowOf(id2);
        return r2 && r2.en.grp === e2.grp;
      });
      if(others.length){
        seenUpGrp[e2.grp] = 1;
        out.push(issue("upgrade.exclusive", "error", "upgrades." + id,
          (others.length + 1) + " upgrades taken from a group that allows one", e2.src_page));
      }
    }
  });
  /* Fleets p. 426: "No hive ship may ever have more than three different
     special refits, no cruiser more than two and no escort more than one."
     A repeatable refit taken several times (Reinforced Carapace x3) is one. */
  if(sel && sel.sh && L){
    var bioKinds = {};
    Object.keys(intent.upgrades || {}).forEach(function(id){
      if(intent.upgrades[id] !== "take") return;
      var row = rowOf(id);
      var secB = row ? secOf(sel, row.at.si) : null;
      if(!secB || String(secB.t).trim().toUpperCase() !== "BIO-ENHANCEMENTS") return;
      bioKinds[row.en.grp || row.en.l] = 1;
    });
    var nBio = Object.keys(bioKinds).length, tyB = String(sel.sh.ty || "");
    var capB = /escort/i.test(tyB) ? 1 : /battleship/i.test(tyB) ? 3 : 2;
    if(nBio > capB)
      out.push(issue("upgrade.bio_limit", "error", "upgrades",
        nBio + " different bio-enhancements taken; a " +
        (capB === 3 ? "hive ship" : capB === 2 ? "cruiser" : "escort") + " may have at most " + capB, 426));
  }
  return out;
}

/* A deliberate change to the intent. Returns a NEW intent and the notices
   for every other choice the change had to reopen or drop - the same rules
   the old setters applied silently: one replacement per weapon slot, one
   option per exclusive group (the earliest taken reopens first), a
   dependent option cannot stay taken without its prerequisite, and an
   upgrade the ship no longer qualifies for is dropped. */
export function transition(intent, action, ctx, catalog){
  var it = JSON.parse(JSON.stringify(intent)), notices = [];
  it.options = it.options || {}; it.upgrades = it.upgrades || {};
  var L = listOfIntent(it, ctx, catalog);
  var at0 = it.entry && L ? findEntry(L, it.entry.section, it.entry.label) : null;
  var sh = shipFor(it.ref, at0 ? L.secs[at0.si].ents[at0.ei] : null, catalog);
  var ol = (sh && sh.ol) || [];
  var note = function(code, path, message){ notices.push({ code: code, path: path, message: message }); };
  var byId = function(id){ return ol.filter(function(o){ return o.id === id; })[0] || null; };
  var stateOf = function(o){ var x = it.options[o.id]; return x && x.state ? x.state : "opt"; };
  var setState = function(o, st){ var x = it.options[o.id] || { state: "opt", qty: 1 }; x.state = st; it.options[o.id] = x; };
  if(action.type === "option"){
    var o = byId(action.id);
    if(!o){ note("option.unknown_id", "options." + action.id, "unknown option"); return { intent: it, notices: notices }; }
    /* What the builder hides, the API refuses (J20 a): "Warspheres 10HP or
       greater" (Fleets p. 494) on a ship already cut below 10 Hits is not
       taken and not charged. */
    var hpIn = function(){
      var h = +(sh && sh.hp) || 0;
      ol.forEach(function(p){ var x = it.options[p.id];
        if(x && x.state === "take" && p.mod && p.mod.hp) h += p.mod.hp * (p.qty ? Math.max(1, x.qty | 0) : 1); });
      return h;
    };
    if(action.state === "take" && stateOf(o) !== "take" && o.hpmin && hpIn() < o.hpmin){
      note("option.blocked", "options." + o.id, "'" + shortText(o.t) + "' needs " + o.hpmin + " Hits; the ship has " + hpIn());
      return { intent: it, notices: notices };
    }
    setState(o, action.state);
    /* ...and a later cut below the minimum reopens it: the later choice wins */
    ol.forEach(function(p){
      if(p !== o && p.hpmin && stateOf(p) === "take" && hpIn() < p.hpmin){
        setState(p, "opt");
        note("option.hpmin", "options." + p.id, "'" + shortText(p.t) + "' reopened: it needs " + p.hpmin + " Hits");
      }
    });
    if(action.state === "take"){
      /* The group rule first: when two options are both a choose-one group
         and replacements of the same slot (Lite Kroozer, Fleets p.385), the
         notice names the group - the reason the player sees in the book. */
      if(o.grp){
        var max = Math.max(1, o.gmax || 1);
        var others = ol.filter(function(p){ return p !== o && p.grp === o.grp && stateOf(p) === "take"; });
        while(others.length >= max){
          var q = others.shift();
          setState(q, "opt");
          note("option.exclusive", "options." + q.id,
            "'" + shortText(q.t) + "' reopened: only " + max + " of this group can be taken");
        }
      }
      if(o.sw) ol.forEach(function(p){
        if(p === o || !p.sw || stateOf(p) !== "take") return;
        if((o.sw.f || []).some(function(f){ return (p.sw.f || []).indexOf(f) >= 0; })){
          setState(p, "opt");
          note("option.swap_conflict", "options." + p.id,
            "'" + shortText(p.t) + "' reopened: it replaces the same weapon as '" + shortText(o.t) + "'");
        }
      });
    }
    /* The option covers a list row that a taken upgrade excludes (noup): the
       later choice wins and the upgrade drops with a notice, as in a group. */
    if(action.state === "take" && o.cov && L){
      Object.keys(it.upgrades).forEach(function(id3){
        if(it.upgrades[id3] !== "take") return;
        var q3 = splitUpgradeId(id3);
        var sel3 = selectionOf(it, ctx, catalog);
        var a4 = q3 && findUpgradeEntry(L, q3.section, q3.label, sel3.si, sel3.ei);
        var e4 = a4 && L.secs[a4.si].ents[a4.ei];
        if(!e4 || !e4.cond || !e4.cond.noup) return;
        if(coversExcludedRow(L, o, e4.cond.noup)){
          it.upgrades[id3] = "off";
          note("upgrade.conflict", "upgrades." + id3,
            "'" + e4.l + "' dropped: it may not be combined with '" + shortText(o.t) + "'");
        }
      });
    }
    ol.forEach(function(p){
      if(p.dep != null && ol[p.dep] && stateOf(p) === "take" && stateOf(ol[p.dep]) !== "take"){
        setState(p, "opt");
        note("option.dependency", "options." + p.id,
          "'" + shortText(p.t) + "' reopened: it needs '" + shortText(ol[p.dep].t) + "'");
      }
    });
  }else if(action.type === "quantity"){
    var o2 = byId(action.id);
    if(o2){
      var x2 = it.options[o2.id] || { state: "opt", qty: 1 };
      var mx = o2.qty ? (o2.qty.max || 1) : 1;
      x2.qty = Math.min(mx, Math.max(1, action.qty | 0));
      it.options[o2.id] = x2;
    }
  }else if(action.type === "upgrade"){
    var pre = splitUpgradeId(action.id);
    var selP = selectionOf(it, ctx, catalog);
    var atP = pre && L ? findUpgradeEntry(L, pre.section, pre.label, selP.si, selP.ei) : null;
    var eP = atP ? L.secs[atP.si].ents[atP.ei] : null;
    /* A row aimed at other hulls is refused (J20 d) - the Warmaster's Mark
       is his, not a cruiser's. */
    if(action.state === "take" && eP && !rowAttached(selP, atP.si, eP)){
      note("upgrade.unattached", "upgrades." + action.id, "'" + eP.l + "' is not one of this ship's rows");
      return { intent: it, notices: notices };
    }
    it.upgrades[action.id] = action.state;
    var sel0 = selectionOf(it, ctx, catalog);
    var p2 = splitUpgradeId(action.id);
    var at2 = p2 && L ? findUpgradeEntry(L, p2.section, p2.label, sel0.si, sel0.ei) : null;
    var e2 = at2 ? L.secs[at2.si].ents[at2.ei] : null;
    /* Two upgrades that exclude each other (noup: a Daemonship may not have a
       Chaos Space Marine crew, Fleets pp. 237, 245): the later choice wins,
       as in a group, instead of both falling in the clean-up (J20 b). */
    if(action.state === "take" && e2){
      Object.keys(it.upgrades).forEach(function(id5){
        if(id5 === action.id || it.upgrades[id5] !== "take") return;
        var q5 = splitUpgradeId(id5);
        var a5 = q5 && findUpgradeEntry(L, q5.section, q5.label, sel0.si, sel0.ei);
        var e5 = a5 && L.secs[a5.si].ents[a5.ei];
        if(!e5) return;
        var hit = (e2.cond && e2.cond.noup && new RegExp(e2.cond.noup, "i").test(String(e5.l))) ||
                  (e5.cond && e5.cond.noup && new RegExp(e5.cond.noup, "i").test(String(e2.l)));
        if(!hit) return;
        if(e5.dflt) it.upgrades[id5] = "off"; else delete it.upgrades[id5];
        note("upgrade.conflict", "upgrades." + id5, "'" + e5.l + "' dropped: " + (inclIn(e2, e5.l) ?
          "'" + e2.l + "' includes it for free" : "it may not be combined with '" + e2.l + "'"));
      });
    }
    /* The upgrade excludes a row (noup) that a taken option covers: the
       option reopens with a notice (Daemonship vs. embarked Chaos Space
       Marines, Fleets pp. 253, 257). The other way too: a covered row that
       gives way to this upgrade (the Terror ship's boarding torpedoes and an
       Assault Karrier that "takes boarding torpedoes for free", Fleets
       p. 373, RAW-06). */
    if(action.state === "take" && e2){
      ol.forEach(function(p){
        if(stateOf(p) !== "take") return;
        if((p.cov && e2.cond && e2.cond.noup && coversExcludedRow(L, p, e2.cond.noup)) || coveredRowExcludes(L, p, e2.l)){
          setState(p, "opt");
          note("option.conflict", "options." + p.id, "'" + shortText(p.t) + "' reopened: " + (inclIn(e2, p.t, true) ?
            "'" + e2.l + "' includes it for free" : "it may not be combined with '" + e2.l + "'"));
        }
      });
    }
    if(action.state === "take" && e2 && e2.grp){
      Object.keys(it.upgrades).forEach(function(id2){
        if(id2 === action.id || it.upgrades[id2] !== "take") return;
        var q2 = splitUpgradeId(id2);
        var a3 = q2 && findUpgradeEntry(L, q2.section, q2.label, sel0.si, sel0.ei);
        var e3 = a3 && L.secs[a3.si].ents[a3.ei];
        if(e3 && e3.grp === e2.grp){
          /* back to the default: closed while the sibling is taken, open
             again when it is dropped (a default-take row stays off) */
          if(e3.dflt) it.upgrades[id2] = "off"; else delete it.upgrades[id2];
          note("upgrade.exclusive", "upgrades." + id2, "'" + e3.l + "' dropped: one of this group at a time");
        }
      });
    }
  }else if(action.type === "hull"){
    if(catalog.ships[String(action.ref)]){
      var had = Object.keys(it.options).length + Object.keys(it.upgrades).length;
      it.ref = String(action.ref); it.hull = String(action.ref);
      it.options = {}; it.upgrades = {};
      if(had) note("hull.changed", "hull", "hull changed: options and upgrades start over");
    }
  }
  /* Clean-up until nothing more falls (J20 c): a dropped crew takes its
     Mark with it on the next pass, because the Mark's condition reads the
     crew. Each pass drops at least one row, so it ends. */
  if(L && action.type !== "hull"){
    for(var pass = 0; pass < 20; pass++){
      var sel1 = selectionOf(it, ctx, catalog), fell = 0;
      Object.keys(it.upgrades).forEach(function(id2){
        if(it.upgrades[id2] === "off") return;
        var q = splitUpgradeId(id2);
        var a3 = q && findUpgradeEntry(L, q.section, q.label, sel1.si, sel1.ei);
        var e3 = a3 && L.secs[a3.si].ents[a3.ei];
        if(e3 && !e3.req && !condOK(sel1, e3, a3.si, a3.ei)){
          if(e3.dflt) it.upgrades[id2] = "off"; else delete it.upgrades[id2];
          fell++;
          note("upgrade.ineligible", "upgrades." + id2, "'" + e3.l + "' dropped: not available to this ship as configured");
        }
      });
      if(!fell) break;
    }
  }
  return { intent: it, notices: notices };
}

/* A section index is a silent reference: if a section moves or is dropped,
   the index still points at something - the wrong section. Bastion Fleets'
   battleship ratio failed exactly this way. Every reference in the data
   therefore carries the section's NAME (build_data.py writes "sn", "up_sn"
   and "<key>_sn" and refuses to build when they disagree), and the engine
   compares the name before it counts anything. A mismatch is reported as a
   failing check, never silently computed. */
export function secTitleIs(L, i, want){
  var sec = L.secs[i];
  return !!sec && String(sec.t).trim().toLowerCase() === String(want);
}
export function secNameIssues(L, node, out){
  var i, k, v, want;
  if(Object.prototype.toString.call(node) === "[object Array]"){
    for(i = 0; i < node.length; i++) secNameIssues(L, node[i], out);
    return out;
  }
  if(!node || typeof node !== "object") return out;
  for(k in node){
    if(!Object.prototype.hasOwnProperty.call(node, k)) continue;
    v = node[k];
    if((k === "sec" || k === "allow_sec" || k === "per_sec")
       && Object.prototype.toString.call(v) === "[object Array]" && node[k + "_sn"]){
      for(i = 0; i < v.length; i++)
        if(!secTitleIs(L, v[i], node[k + "_sn"][i])) out.push(k + "[" + i + "]");
    } else if((k === "sec" || k === "up_sec") && typeof v === "number"){
      want = k === "sec" ? node.sn : node.up_sn;
      if(want != null && !secTitleIs(L, v, want)) out.push(k);
    } else if(v && typeof v === "object" && k !== "sn" && k.slice(-3) !== "_sn"){
      secNameIssues(L, v, out);
    }
  }
  return out;
}
