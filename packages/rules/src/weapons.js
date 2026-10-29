import { isRockVessel } from "./crits.js";
import { swapRuledOutByUp, timesStrength } from "./pricing.js";
import { coveredByShipOption, isUpgradeEnt, optCount, optState, upSecs, upState, upgradeKey } from "./upgrades.js";

export function weaponRows(sel, skip, noList){
  var sh = sel.sh, L = sel.list;
  var rows = [];
  if(!sh) return rows;
  var alts = {}, gone = {};
  /* Menu weapons: which option owns which armament row. A row with no owner
     is standard armament and cannot disappear. */
  var owner = {};
  (sh.ol || []).forEach(function(o, i){
    (o.aws || []).forEach(function(r){ (owner[r] = owner[r] || []).push(i); });
  });
  /* An option can also change a row in place rather than replace it. */
  var rowFix = [];
  /* Rows a repeatable option can change get a write-in box on the card. */
  var qtyRows = [];
  (sh.ol || []).forEach(function(o, i){
    if(o.swp && o.qty && optState(sel, i) !== "off") qtyRows.push(new RegExp(o.swp.f, "i"));
    if(!o.swp || optState(sel, i) !== "take") return;
    rowFix.push([new RegExp(o.swp.f, "i"), o.swp, optCount(sel, i)]);
  });
  (sh.ol || []).forEach(function(o, i){
    if(!o.sw) return;
    var st = optState(sel, i);
    if(st === "off") return;
    /* An open option a taken list row rules out (Power Ram: "not with a
       Nova Cannon") is no choice any more, so no OR row either. */
    if(st !== "take" && swapRuledOutByUp(sel, o)) return;
    /* one option that swaps several rows at once (the Tyrant's 45 cm
       batteries, both sides): each alternative says so */
    var both = (o.sw.f || []).length > 1 ? 1 : 0;
    o.sw.f.forEach(function(fi, k){
      (alts[fi] = alts[fi] || []).push([(o.sw.t[k] || o.sw.t[0]).slice(), st, 0, both]);
      if(st === "take") gone[fi] = 1;
    });
  });
  /* A fleet list upgrade covers many different ships, so the row it replaces
     is matched by name pattern rather than by index. Conditions are not
     consulted here: chosen is chosen, and that avoids circular reasoning with
     condOK. */
  /* A slot holds one weapon. A list swap leaves alone a row that a taken
     choice has already replaced (the Kill Kroozer's torpedo launcha, or an
     earlier list swap), and the more specific pattern goes first: the
     Shokk-Attack Lance takes the prow heavy gunz, Looted Lances the rest
     (Fleets pp. 372-373). */
  var lswp = [];
  if(L && !noList) upSecs(sel).forEach(function(sec, si){ sec.ents.forEach(function(en, ei){
    if(!isUpgradeEnt(en) || !en.swp) return;
    if(skip === upgradeKey(si, ei)) return;
    /* The ship's own option already provides this, and upgradesFor hides
       the list row for exactly that reason. */
    if(coveredByShipOption(sel, en)) return;
    lswp.push({ en: en, si: si, ei: ei, n: lswp.length });
  }); });
  lswp.sort(function(p, q){ return (String(q.en.swp.f).length - String(p.en.swp.f).length) || (p.n - q.n); });
  lswp.forEach(function(x){
    var en = x.en, si = x.si, ei = x.ei;
    var st = upState(sel, si, ei);
    if(st === "off") return;
    /* A list swap the player has not answered opens as Option in the
       LOADOUT box only (30.9.2026): printed as an OR row on every weapon it
       could replace it filled every Ork and Tyranid card past legibility.
       Set to Option on purpose, or taken, it is in the table as before. */
    if(st === "opt" && !Object.prototype.hasOwnProperty.call(sel.ups, upgradeKey(si, ei))) return;
    /* Offered mines print beside the bays as their alternative, with a box
       and OR like any other swap; bought mines replace the bays (Fleets
       p. 23: "Orbital mines completely replace all the attack craft in a
       ships launch bays"). J68. */
    var rx = new RegExp(en.swp.f, "i");
    sh.aw.forEach(function(a, fi){
      if(!rx.test(a[0])) return;
      if(gone[fi]) return;
      if(en.swp.onlyrg && String(a[1]).indexOf(en.swp.onlyrg) < 0) return;
      var st2 = en.swp.st || a[2];
      if(en.swp.halfst){
        /* "launch bay strength divided in half (rounding down)" */
        st2 = String(a[2]).replace(/\d+/, function(m){ return String(Math.floor(+m / 2)); })
          .replace(/\b1 squadrons\b/, "1 squadron");
      }
      /* "One orbital mine can be launched per launch bay strength" (Fleets
         p. 23): the bays' squadron count becomes the number of mines. */
      if(en.swp.permine){
        var mc = String(a[2]).match(/\d+/);
        st2 = mc ? mc[0] + (mc[0] === "1" ? " mine" : " mines") : a[2];
      }
      var nm0 = a[0];
      if(en.swp.nm){
        nm0 = String(a[0]).replace(new RegExp(en.swp.nmf || en.swp.f, "i"), en.swp.nm);
        if(/^[A-Z]/.test(a[0])) nm0 = nm0.charAt(0).toUpperCase() + nm0.slice(1);
      }
      var row = en.swp.t ? en.swp.t.slice()
        : [nm0, en.swp.rg || a[1], st2, en.swp.ar || a[3]];
      (alts[fi] = alts[fi] || []).push([row, st, en.swp.permine ? 1 : 0]);
      if(st === "take") gone[fi] = 1;
    });
  });
  sh.aw.forEach(function(a, i){
    var own = owner[i];
    var menuBox = null, count = 1;
    if(own){
      var states = own.map(function(oi){ return optState(sel, oi); });
      if(states.every(function(x){ return x === "off"; })) return;    /* hidden weapon */
      menuBox = states.some(function(x){ return x === "take"; }) ? "on" : "open";
      /* Several options can own the same row - the Hive Ship's three side
         sets. Each one taken is another instance of the weapon. */
      count = Math.max(1, own.reduce(function(a, oi){
        return a + (optState(sel, oi) === "take" ? optCount(sel, oi) : 0); }, 0));
    }
    var alt = alts[i];
    /* A group is the slot of exactly one weapon. The base row is present only
       when no replacement has been taken (gone[i]), so when it is there it is
       the weapon in use - and a group always has exactly one marked row. */
    if(!gone[i]){
      var shown = count > 1 ? [a[0], a[1], timesStrength(a[2], count), a[3]] : a.slice();
      rows.push({ a: shown, i: i, grp: alt ? 1 : 0, box: alt ? "on" : menuBox, count: count, own: own || null });
    }
    /* Bought mines are the bays' armament now, not a choice beside them:
       no OR. Where the slot still has other alternatives (the Strike
       Cruiser's own torpedo or bombardment-cannon swaps for its bays), the
       mine row stands in for the base row as the group's marked row (J21). */
    var mineRow = null;
    (alt || []).forEach(function(pair){ if(pair[2] && pair[1] === "take") mineRow = pair; });
    var others = (alt || []).filter(function(pair){ return pair !== mineRow; });
    if(mineRow) rows.push({ a: mineRow[0], i: i, grp: others.length ? 1 : 0,
                            box: others.length ? "on" : null, swapped: 1 });
    others.forEach(function(pair){
      rows.push({ a: pair[0], i: i, alt: 1, grp: 1, box: pair[1] === "take" ? "on" : "open", both: pair[3] ? 1 : 0 });
    });
  });
  /* An extra weapon brought by the list, such as the AdMech's required 60 cm
     dorsal lance. It replaces nothing, so it goes at the end of the table
     with no box. */
  if(L) upSecs(sel).forEach(function(sec, si){ sec.ents.forEach(function(en, ei){
    if(!isUpgradeEnt(en) || !en.add) return;
    if(skip === upgradeKey(si, ei)) return;
    if(coveredByShipOption(sel, en)) return;
    if(upState(sel, si, ei) !== "take") return;
    if(rows.some(function(r){ return r.a[0] === en.add[0]; })) return;
    rows.push({ a: en.add.slice(), i: -1, box: null, extra: 1 });
  }); });
  /* A ship's own option can bring a weapon too (Ork boarding torpedoes).
     Take / Option / Hide applies: taken is ticked, offered prints an empty
     box, hidden is not on the card. add is one row or a list of rows (the
     Murder's port AND starboard lance battery, Fleets p.281). */
  (sh.ol || []).forEach(function(o, i){
    if(!o.add) return;
    var st = optState(sel, i);
    if(st === "off") return;
    var adds = Array.isArray(o.add[0]) ? o.add : [o.add];
    adds.forEach(function(a){
      rows.push({ a: a.slice(), i: -1, box: st === "take" ? "on" : "open", extra: 1, opt: i, own: [i] });
    });
  });
  /* del: a taken option removes rows (Cobra's detection gear, Fleets p.84),
     applied to the rows that survived everything above, by name. */
  (sh.ol || []).forEach(function(o, i){
    if(!o.del || optState(sel, i) !== "take") return;
    var rx = new RegExp(o.del, "i");
    /* A replacement row is never the one removed: the Lite Kroozer's
       "additional D6 gunz" puts "Prow gunz D6+2" in the heavy gunz slot and
       takes the plain "Prow gunz 2" row away (Fleets p.385). */
    for(var k = rows.length - 1; k >= 0; k--)
      if(!rows[k].alt && rx.test(String(rows[k].a[0]))) rows.splice(k, 1);
  });
  /* Options that change a row in place. Applied last, on the rows that
     survived the swaps, and only to plain numbers: "+2" on a D6+2 salvo
     is not something the book defines. */
  if(qtyRows.length) rows.forEach(function(r){
    if(qtyRows.some(function(rx){ return rx.test(r.a[0]); })) r.writeIn = 1;
  });
  if(rowFix.length) rows.forEach(function(r){
    rowFix.forEach(function(fx){
      var rx = fx[0], sp = fx[1], n = fx[2];
      if(!rx.test(r.a[0])) return;
      /* onlyrg: only rows at this range - the Mercury's 45 cm batteries go
         to 60 cm, its 60 cm batteries stay (Fleets p.64). */
      if(sp.onlyrg && String(r.a[1]).indexOf(sp.onlyrg) < 0) return;
      var a = r.a.slice();
      if(sp.rg) a[1] = sp.rg;
      /* rgadd: another ordnance type in the same bays (torpedo-bommas,
         Fleets p.361): the range cell gains an entry instead of changing. */
      if(sp.rgadd && String(a[1]).indexOf(sp.rgadd) < 0)
        a[1] = (a[1] ? String(a[1]) + " / " : "") + sp.rgadd;
      if(sp.st != null){
        var d = /^[+-]/.test(String(sp.st)) ? parseInt(sp.st, 10) * n : null;
        if(d == null) a[2] = sp.st;
        else if(/^\s*\d+\s*$/.test(String(a[2])))
          a[2] = String(Math.max(0, parseInt(a[2], 10) + d));
      }
      r.a = a;
    });
  });
  /* Boarding torpedoes are another load for the torpedo tubes a ship already
     has, not another weapon (Rulebook p. 78; user 12.10.2026): the options
     that buy them bring no row here - see OPT_EFFECTS in build_data.py. */
  return rows;
}

/* Stat delta from the list's taken upgrades and the ship's taken options. */
export function statMod(sel, key){
  var d = 0;
  if(sel.list) upSecs(sel).forEach(function(sec, si){ sec.ents.forEach(function(en, ei){
    if(!isUpgradeEnt(en) || !en.mod || en.mod[key] == null) return;
    if(coveredByShipOption(sel, en)) return;
    if(upState(sel, si, ei) !== "take") return;
    d += en.mod[key];
  }); });
  ((sel.sh && sel.sh.ol) || []).forEach(function(o, i){
    if(!o.mod || o.mod[key] == null) return;
    if(optState(sel, i) !== "take") return;
    d += o.mod[key] * optCount(sel, i);
  });
  return d;
}

/* A text stat set outright by a taken option (Endeavour, Fleets p.72).
   The last taken option wins. */
export function statSet(sel, key){
  var v = null;
  if(sel.list) upSecs(sel).forEach(function(sec, si){ sec.ents.forEach(function(en, ei){
    if(!isUpgradeEnt(en) || !en.set || en.set[key] == null) return;
    if(coveredByShipOption(sel, en)) return;
    if(upState(sel, si, ei) !== "take") return;
    v = en.set[key];
  }); });
  ((sel.sh && sel.sh.ol) || []).forEach(function(o, i){
    if(!o.set || o.set[key] == null) return;
    if(optState(sel, i) !== "take") return;
    v = o.set[key];
  });
  return v;
}

export function effHits(sel){
  return Math.max(1, ((sel.sh && sel.sh.hp) || 0) + statMod(sel, "hp"));
}
/* Ruling T57 (user 26.10.2026, read as written for now): Fleets p. 395 "In
   their Movement phase Roks travel 10 cm forward in a straight line, no more,
   no less." A +5 cm speed upgrade (Evil Sunz p. 371, Soopa Boostas p. 372)
   therefore leaves a Rok at 10 cm; the row can still be taken and is still
   paid for. The same holds for the other rock vessels that share the Rok's
   movement (Kroot Warsphere p. 495, Stryxis Caravan p. 207), none of which
   is offered a speed upgrade. */
export function fixedSpeed(sh){ return isRockVessel(sh); }
export function effSpeed(sel){
  var base = String(statSet(sel, "sp") || (sel.sh && sel.sh.sp) || "");
  var d = fixedSpeed(sel.sh) ? 0 : statMod(sel, "sp");
  if(!d) return base;
  return base.replace(/\d+/g, function(n){ return String(+n + d); });
}
export function effShieldsText(sel){
  var d = statMod(sel, "sh"), base = String((sel.sh && sel.sh.sh) || "");
  if(!d) return base;
  var m = base.match(/^\s*(\d+)/);
  return m ? base.replace(/^\s*\d+/, String(Math.max(0, +m[1] + d))) : base;
}
export function effTurrets(sel){
  var set = statSet(sel, "tu");
  var d = statMod(sel, "tu"), base = String(set != null ? set : ((sel.sh && sel.sh.tu) || ""));
  if(!d) return base;
  var m = base.match(/^\s*(\d+)/);
  return m ? base.replace(/^\s*\d+/, String(+m[1] + d)) : base;
}
