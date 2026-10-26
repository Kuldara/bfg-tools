import { foreignReserveRow, isMechanicusVessel } from "./crits.js";
import { findEntry, findUpgradeEntry, shipFor, splitUpgradeId } from "./legacy.js";
import { listOfIntent } from "./lending.js";
import { statSet, weaponRows } from "./weapons.js";

export function isUpgradeEnt(en){ return !!(en && en.k === "up"); }
export function upgradeKey(si, ei){ return si + ":" + ei; }
/* ---- upgrades from both lists (Fleets p. 14 and p. 16) -------------------
   p. 14: "Reserve vessels may take any upgrades, refits, etc. available to
   either fleet list". p. 16 limits it: "Allied and reserve vessels cannot use
   refits and upgrades from the fleet list they are allied to unless they are
   of the same race or the rules for that fleet specifically allow it."

   The implementation does not change the key format. The host list's
   sections get the index HOST_OFF + si, so the key is still "si:ei" and no
   old save, test or checker changes. In a one-list fleet sel.host is null
   and the whole mechanism does not exist - which is why 357 unit cases and
   66 fleet cases measure the same as before.

   Two limits follow from the data's own logic, not from convenience:
     - a targeted row (en.at) is left out, because its targets are the HOST's
       coordinates and the borrowed ship is not among them;
     - a required row (en.req) is left out, because p. 14 says "may take",
       which is a permission, not an obligation (owner's decision T35,
       14 Sept 2026).

   Race is a game-mechanical group (T37): a list without a race is "the same
   race" as nothing, so it gets none of the host's upgrades. p. 16's "or the
   rules for that fleet specifically allow it" is not implemented, because
   the data has no field for it - it can only ADD permission, so leaving it
   out errs on the careful side. */
export var HOST_OFF = 1000;

export function hostUpgradesAllowed(donor, host){
  if(!donor || !host || donor === host) return false;
  return !!(donor.race && host.race && donor.race === host.race);
}
/* The sections of both lists as one array. The host's sections are at
   indexes HOST_OFF and up, and the gap between is sparse - forEach skips it,
   so the loops keep their old shape. */
export function upSecs(sel){
  if(!sel.list) return [];
  if(!sel.host) return sel.list.secs;
  var a = sel.list.secs.slice();
  sel.host.secs.forEach(function(sec, i){ a[HOST_OFF + i] = sec; });
  return a;
}
export function secOf(sel, si){
  if(si >= HOST_OFF) return sel.host ? sel.host.secs[si - HOST_OFF] : null;
  return sel.list ? sel.list.secs[si] : null;
}
export function listOfSec(sel, si){ return si >= HOST_OFF ? sel.host : sel.list; }
/* An upgrade on both lists is offered ONCE. 63 % of the host's rows have the
   same name as the donor's (Torpedo bombers, Orbital mines and so on), and as
   two rows the player would see the same purchase twice and could pay for it
   twice. The book's "available to either fleet list" is about availability,
   not quantity. The suppression goes as far as upState, so a key left in an
   old save cannot affect the profile or the price on a row that is not
   shown. */
/* A host row aimed at EVERY ship of one type heading is a row about the type
   (BACKLOG J120): a Daemonship's cost is "based upon the type of vessel
   chosen" (Fleets p. 235), and a borrowed ship counts under the heading it
   has on its own list (T34, p. 14). So a borrowed cruiser is offered the
   host's "Daemonship: Cruiser" when its own heading is "Cruisers" too. A row
   aimed at chosen hulls stays the host's own (J117), and a row the ship's
   own list prints under the same name is offered once, from there. */
export function hostTypeRow(sel, si, en){
  if(!sel.host || !sel.list || si < HOST_OFF || !en || !en.at || !en.at.length) return false;
  var ds = sel.list.secs[sel.si];
  if(!ds || ds.ct !== "type") return false;
  var tsi = en.at[0][0];
  if(!en.at.every(function(p){ return p[0] === tsi; })) return false;
  var ts = sel.host.secs[tsi];
  var key = function(s){ return String(s.t || "").trim().toLowerCase(); };
  if(!ts || ts.ct !== "type" || key(ts) !== key(ds)) return false;
  var every = ts.ents.every(function(e2, j){
    return isUpgradeEnt(e2) || e2.r == null || en.at.some(function(p){ return p[1] === j; }); });
  if(!every) return false;
  return !sel.list.secs.some(function(s2){ return s2.ents.some(function(e2){
    return isUpgradeEnt(e2) && e2.l === en.l; }); });
}
export function hostRowShadowed(sel, en){
  if(!sel.list || !en) return false;
  var lab = String(en.l || ""), grp = en.grp || null, hit = false;
  sel.list.secs.forEach(function(sec){ sec.ents.forEach(function(e2){
    if(hit || !isUpgradeEnt(e2) || e2.at) return;
    if(String(e2.l || "") === lab) hit = true;
    /* The same group is the same purchase under another name: "Chaos Space
       Marine crew" and "Thousand Sons Chaos Space Marine crew" are one crew. */
    else if(grp && e2.grp === grp) hit = true;
  }); });
  return hit;
}


export function selectionOf(intent, ctx, catalog){
  var L = listOfIntent(intent, ctx, catalog);
  var at = intent.entry && L ? findEntry(L, intent.entry.section, intent.entry.label) : null;
  var en = at ? L.secs[at.si].ents[at.ei] : null;
  var sh = shipFor(intent.ref, en, catalog);
  var ol = (sh && sh.ol) || [];
  var opts = intent.options || {};
  /* A list row can forbid the ship's own variants (Rogue Traders using a
     Lunar, Tyrant, Carnage or Murder, Fleets p. 180): the default state is
     off. An explicit state still wins, as it did in the legacy optState. */
  var dflt = en && en.noopt ? "off" : "opt";
  /* optno: the list forbids one of the hull's options outright - Mechanicus
     carriers "may not use assault boats, even if their Imperial Navy
     counterparts may have access to this type of ordnance (such as Emperor
     battleships)" (Fleets p. 125). Off, whatever a saved state says. */
  var optno = en && en.optno ? new RegExp(en.optno, "i") : null;
  var ost = ol.map(function(o){
    if(optno && optno.test(String(o.t || ""))) return "off";
    var x = opts[o.id]; return x && x.state ? x.state : dflt; });
  var oqty = ol.map(function(o){
    var x = opts[o.id], q = x && x.qty > 1 ? +x.qty : 1;
    if(!o.qty) return 1;
    return Math.min(Math.max(q, 1), o.qty.max || 1);
  });
  /* For a borrowed ship the host list is the one it is lent TO. ctx.host is
     named separately because ctx.list means different things on two call
     paths: resolveFleet passes the fleet's list there, the app the unit's own
     list. */
  var host = ctx && ctx.host ? ctx.host : null;
  var hostUp = hostUpgradesAllowed(L, host) ? host : null;
  var ups = {};
  Object.keys(intent.upgrades || {}).forEach(function(id){
    var p = splitUpgradeId(id);
    if(!p || !L) return;
    var at2 = p.list === L.nm
      ? findUpgradeEntry(L, p.section, p.label, at ? at.si : -1, at ? at.ei : -1) : null;
    if(at2 && intent.upgrades[id]){ ups[upgradeKey(at2.si, at2.ei)] = intent.upgrades[id]; return; }
    /* A host-list row: the same lookup, but the key is moved by HOST_OFF. The
       target condition is -1/-1, because targeted host rows are not offered. */
    if(hostUp && p.list === hostUp.nm){
      var at3 = findUpgradeEntry(hostUp, p.section, p.label, -1, -1);
      if(at3 && intent.upgrades[id])
        ups[upgradeKey(HOST_OFF + at3.si, at3.ei)] = intent.upgrades[id];
    }
  });
  /* fleet: the list of the FLEET the ship serves in, whatever list the ship
     itself came from. Not hostUp - that is null for a fleet's own ships and
     for another race's. Callers without a host pass the fleet as ctx.list. */
  var fleet = ctx ? (ctx.host || ctx.list || null) : null;
  return {
    list: L, host: hostUp, fleet: fleet, sh: sh, en: en, si: at ? at.si : -1, ei: at ? at.ei : -1,
    ost: ost, oqty: oqty, ups: ups,
    hulls: intent.hulls > 0 ? intent.hulls : 1,
    custom: intent.custom == null ? null : intent.custom,
    adjust: intent.adjust ? +intent.adjust : 0,
    /* escort = the SHAPE of the unit: one-hit hulls bought N at a time on one
       card. The book type Escort, and the one-hit planetary defences that
       Rulebook p. 100 groups the same way ("1HP defences grouped in up to
       six units") - sh.sq, because their printed type is Defence or Ground.
       defence = the KIND: bought from the planetary defences list (Fleets
       p. 499), not from the fleet list. A row without a hull (orbital mine,
       minefield) is one by its section. */
    escort: !!(sh && (sh.sq || /escort/i.test(sh.ty || ""))),
    defence: !!((sh && sh.df) || (at && L.secs[at.si].ct === "defence"))
  };
}

export function optState(sel, i){ return sel.ost[i] || "opt"; }
export function optCount(sel, i){ return sel.oqty[i] || 1; }

/* The rows this unit is offered (upgradesFor), keyed "si:ei", for the
   default state below. Cached per selection and its answers: upgradesFor
   walks every condition, and upState is asked once per row. While the set
   is being built its own condition checks ask upState only about "take",
   so they get the old answer for a row with no answer ("off") instead of
   recursing. */
export var OFFERED = typeof WeakMap === "function" ? new WeakMap() : null, OFFERED_BUSY = false;
export function offeredUpKeys(sel){
  var sig = JSON.stringify(sel.ups || {});
  var c = OFFERED ? OFFERED.get(sel) : null;
  if(c && c.sig === sig) return c.keys;
  var keys = {};
  OFFERED_BUSY = true;
  try{
    var u = upgradesFor(sel);
    u.own.concat(u.other).forEach(function(x){ keys[upgradeKey(x[0], x[1])] = 1; });
  }finally{ OFFERED_BUSY = false; }
  if(OFFERED) OFFERED.set(sel, { sig: sig, keys: keys });
  return keys;
}

/* Is another row of the group g taken? Read from the answers alone (no
   condition checks), so upState can ask it without recursing. */
export function grpTakenElsewhere(sel, si, ei, g){
  var hit = false;
  upSecs(sel).forEach(function(sec, sj){ (sec.ents || []).forEach(function(e2, ej){
    if(hit || !isUpgradeEnt(e2) || e2.grp !== g || (sj === si && ej === ei)) return;
    var k2 = upgradeKey(sj, ej);
    if(sel.ups[k2] === "take" || (e2.req && sel.si === sj) ||
       (e2.dflt && sel.si === sj && !Object.prototype.hasOwnProperty.call(sel.ups, k2))) hit = true;
  }); });
  return hit;
}
export function upState(sel, si, ei){
  var sec = secOf(sel, si);
  var en = sec && sec.ents[ei];
  if(si >= HOST_OFF && (!en || (en.at && !hostTypeRow(sel, si, en)) || en.req || hostRowShadowed(sel, en))) return "off";
  if(en && en.req && sel.si === si) return "take";   /* required, not removable */
  /* A default row opens on "take" and stays there until the player says
     otherwise. The difference from req is the whole fix: an explicit answer
     wins, so the Chaos Warmaster's Mark can be dropped beside the battle
     barge that already carries it (Fleets pp. 258, 260, 262, 264). Absent
     key, not absent value - "off" is an answer and must survive. */
  var k = upgradeKey(si, ei);
  if(en && en.dflt && sel.si === si &&
     !Object.prototype.hasOwnProperty.call(sel.ups, k)) return "take";
  if(sel.ups[k] === "take") return "take";
  /* off0: a row that is a way of BUYING the ship, not a choice at the table
     - the Webway Portal's half price (Fleets p. 337). An open box on every
     card would offer it in play, so it opens on Hide. */
  if(en && en.off0 && !Object.prototype.hasOwnProperty.call(sel.ups, k)) return "off";
  /* One of a choose-one group taken: the others are not open choices any
     more (the Admiral's one, two or three re-rolls). They come back when it
     is dropped. */
  if(en && en.grp && grpTakenElsewhere(sel, si, ei, en.grp)) return "off";
  if(sel.ups[k]) return sel.ups[k];
  /* No answer yet: an offered row opens on Option - an empty box on the
     card, no points - like the ship's own options (user 30.9.2026; it used
     to open on Hide). A row this unit is not offered stays out, so it adds
     nothing to the "every open option" maximum or to the weapon rows. */
  if(OFFERED_BUSY || !sel.list) return "off";
  return offeredUpKeys(sel)[k] ? "opt" : "off";
}

/* Launch bay strength = the sum of the strengths on every launch bay row. The
   book's own example: Terror Ship 2 + 2 = 4, so torpedo bommas cost 4 x 10 =
   40 points. Dice values count at their maximum ("per (maximal) launch bay
   strength"), which makes an Ork hulk's D6+2 + D6+2 = 16 and the price 160 -
   that figure is the book's too. */
/* With a selection, only the launch bays actually on the ship count: a
   menu weapon owned by options counts once for every owner taken and not
   at all when none is (Hive Ship p.432: the unchosen side launch bays do
   not raise the Mega-Spore Mines price, p.427). List swaps are ignored on
   purpose - the upgrade being priced may itself replace the bays. */
export function bayStrength(sh, sel){
  var n = 0, exact = true;
  var owner = {};
  if(sel) ((sh && sh.ol) || []).forEach(function(o, i){
    (o.aws || []).forEach(function(r){ (owner[r] = owner[r] || []).push(i); });
  });
  ((sh && sh.aw) || []).forEach(function(a, ai){
    if(!/launch bay/i.test(a[0])) return;
    var times = 1;
    if(sel && owner[ai]){
      times = owner[ai].filter(function(oi){ return optState(sel, oi) === "take"; }).length;
      if(!times) return;
    }
    var n0 = n;
    var txt = String(a[2] || "");
    var dice = txt.match(/D(\d+)\s*\+\s*(\d+)/i);
    if(dice){ n += (+dice[1]) + (+dice[2]); return; }
    var nums = (txt.match(/\d+/g) || []).map(Number);
    if(!nums.length){ exact = false; return; }
    /* "Port / Starboard Launch bays  1 / 1 squadron" = one per side */
    if(/\bport\b/i.test(a[0]) && /\bstarboard\b/i.test(a[0]))
      n += nums.reduce(function(x, y){ return x + y; }, 0);
    else {
      /* "3 squadrons / 4" (Demiurg dorsal bays, Fleets p. 489): the bays hold
         three squadrons; the 4 is the torpedo salvo they may launch instead. */
      var sq = txt.match(/(\d+)\s*squadrons?\b/i);
      if(sq) n += +sq[1];
      else {
        n += Math.max.apply(null, nums);
        if(nums.length > 1) exact = false;
      }
    }
    n = n0 + (n - n0) * times;
  });
  return { n: n, exact: exact };
}

/* Prow armour as a number: "6+ front / 5+" -> 6, "5+" -> 5. */
export function prowArmour(sh){
  var t = String((sh && sh.ar) || "");
  var m = t.match(/(\d)\+\s*(?:front|prow)/i) || t.match(/(\d)\+/);
  return m ? +m[1] : 0;
}

export function upTokens(t){
  return String(t || "").toLowerCase().replace(/[^a-z0-9 ]/g, " ")
    .split(/\s+/).filter(function(w){ return w.length > 2; });
}

/* Is this upgrade already one of the ship's own options at the same price? */
export function coveredByShipOption(sel, en){
  var sh = sel.sh;
  if(!sh || en.p == null) return false;
  var want = upTokens(en.l);
  if(!want.length) return false;
  return (sh.ol || []).some(function(o){ return optionCoversRow(o, en); });
}

/* One ship option is the same purchase as one list row when the row's
   words are all in the option and the price agrees. A per-bay or per-hull
   row is priced by the ship, so its unit price never equals the option's
   total (Gorbag's Revenge p.377 "torpedo bommas +80" vs "+10 / launch bay");
   there the words decide. An option may also name the row it covers (cov,
   build_data.py): the Chaos battle barge p.255 "Can embark Chaos Space
   Marines for +35 points" is the list's "<Legion> Chaos Space Marine crew"
   row (p.244), whose legion name is not in the option text. */
export function optionCoversRow(o, en){
  if(o.cov && new RegExp(o.cov, "i").test(String(en.l || ""))) return o.c === en.p;
  var want = upTokens(en.l);
  if(!want.length) return false;
  if(!want.every(function(w){ return upTokens(o.t).indexOf(w) >= 0; })) return false;
  return en.per ? true : o.c === en.p;
}

/* The same upgrade can be taken two ways: as the list's own upgrade row or
   as an option printed on the ship's profile. The Necron Sepulchre is both,
   and the list row is hidden whenever the ship option covers it - so
   counting only the list row missed every real choice. */
export function upgradeTakenAnyWay(sel, si, ei){
  if(upState(sel, si, ei) === "take") return true;
  var sh = sel.sh, sec0 = secOf(sel, si), en = sec0 && sec0.ents[ei];
  if(!sh || !en || en.p == null) return false;
  var want = upTokens(en.l);
  if(!want.length) return false;
  return (sh.ol || []).some(function(o, i){
    return optionCoversRow(o, en) && optState(sel, i) === "take";
  });
}

/* Eligibility condition. An empty condition always passes. Armament is
   read AFTER THE SWAPS, so taking a nova cannon rules out the Power Ram
   exactly as the book says. */
export function condOK(sel, en, si, ei){
  var c = en && en.cond;
  if(!c) return true;
  var sh = sel.sh;
  if(!sh) return false;
  /* nohost: a host list's row a borrowed ship may not take - Bakka's
     +1 turret: "Reserve vessels may not be given this upgrade, but any
     vessels from the Battlefleet Bakka fleet list used as reserves in other
     fleets may take it with them" (Fleets p. 50, J213). A host row reaches
     a borrowed ship at si >= HOST_OFF; the ship's own list's rows do not. */
  if(c.nohost && si != null && si >= HOST_OFF) return false;
  /* mech / nomech: a Mechanicus vessel or not - Bakka's Adeptus Mechanicus
     cruisers take the Fleet Defence Turrets refit, its Navy ships the +1
     turret (Fleets p. 50, J217) */
  if(c.mech != null || c.nomech != null){
    var isMech = isMechanicusVessel(sh, sel.list, sel.en);
    if(c.mech && !isMech) return false;
    if(c.nomech && isMech) return false;
  }
  var esc = /escort/i.test(sh.ty || "");
  if(c.cap && esc) return false;
  if(c.esc && !esc) return false;
  /* qd: the type test has one exception, the quadrant forts. "Escort
     squadrons and defences may not be equipped with special torpedoes at
     all" (Fleets p. 19), but "A Ramilies can purchase special torpedoes"
     (p. 503), and a Fortress-Monastery "follows all rules for the Ramilies"
     (p. 110). User decision 13.10.2026 (BACKLOG J174). */
  if(c.ty && !new RegExp(c.ty, "i").test(sh.ty || "") && !(c.qd && sh.qd)) return false;
  /* Fleets p.99/102: a Venerable battle barge counts as one of the fleet's
     battle barges ("counting as one of the three allowed"), so a condition
     that names a battle barge - Honour Guard, "any battle barge or strike
     cruiser" (p.99) - matches it although the hull is a Navy or Chaos ship. */
  var nmT = (sh.nm || "") + (sh.ven ? " / VENERABLE BATTLE BARGE" : "");
  if(c.nm && !new RegExp(c.nm, "i").test(nmT)) return false;
  if(c.nmno && new RegExp(c.nmno, "i").test(nmT)) return false;
  /* fl / flno: the race line of the profile - Eldar and Tau vessels pay +15
     per launch bay for torpedo bombers, others +10 (Fleets p. 22). */
  if(c.fl && !new RegExp(c.fl, "i").test(sh.fl || "")) return false;
  if(c.flno && new RegExp(c.flno, "i").test(sh.fl || "")) return false;
  /* prow: the armour the ship has, a taken option's included - the Power Ram
     asks for "a 6+ prow" (Fleets p. 32), and an Endeavour, Endurance or
     Defiant gets one from its free option (pp. 72-76, J223) */
  if(c.prow && prowArmour({ ar: statSet(sel, "ar") || sh.ar }) < +c.prow) return false;
  /* Only the configuration in force, with the row's own effect excluded:
     otherwise "requires prow torpedoes" would cancel itself the moment the
     torpedoes are swapped for a nova cannon. */
  var skip = si == null ? null : upgradeKey(si, ei);
  /* A row with a box is on the ship only while its option is taken: the
     Dragonship's keel launch bays (Fleets p. 330) carry torpedo bombers only
     once chosen (p. 319). An exclusion is stricter: a Ghostship "may not be
     armed with launch bays" (p. 307), so an open weapon choice that could
     still add them counts against it until the choice is settled (torpedoes
     taken, or the bays' option otherwise blocked). Replacement rows (alt)
     never count while open: the Tyrant keeps its Power Ram offer until the
     nova cannon is actually taken. */
  var all = weaponRows(sel, skip);
  var takeable = function(oi){
    var o = sh.ol && sh.ol[oi];
    if(!o) return false;
    if(optState(sel, oi) === "take") return true;
    if(o.dep != null && optState(sel, o.dep) !== "take") return false;
    if(o.grp){
      var max = Math.max(1, o.gmax || 1);
      var n = sh.ol.filter(function(p, j){ return j !== oi && p.grp === o.grp && optState(sel, j) === "take"; }).length;
      if(n >= max) return false;
    }
    return true;
  };
  var inForce = all.filter(function(r){ return r.box == null || r.box === "on"; });
  var maybe = all.filter(function(r){ return r.box === "open" && !r.alt && r.own && r.own.some(takeable); });
  var rowHit = function(pat, list){
    var p = String(pat).split("@");
    var rx = new RegExp(p[0], "i");
    return list.some(function(r){
      var a = r.a;
      return rx.test(a[0]) && (p.length < 2 || String(a[1]).indexOf(p[1]) >= 0);
    });
  };
  /* has reads the armament as the ship's own choices leave it, before list
     swaps: two list swaps on one ship share the slots by specificity
     (weaponRows), so the Shokk-Attack Lance keeps the prow heavy gunz even
     when Looted Lances was taken first (Fleets pp. 370-371). */
  if(c.has){
    var own = weaponRows(sel, skip, true).filter(function(r){ return r.box == null || r.box === "on"; });
    if(!(Array.isArray(c.has) ? c.has : [c.has]).every(function(p){ return rowHit(p, own); })) return false;
  }
  /* tsmin / tsmax: the Strength of the torpedoes in force. A roll on the
     Special Torpedoes table costs 20 points up to Strength 6 and 30 points
     from Strength 7 (Fleets p. 19). */
  if(c.tsmin != null || c.tsmax != null){
    var ts = 0, torps = false;
    inForce.forEach(function(r){
      if(!/torpedo|launcha/i.test(r.a[0]) || /bomb|boarding/i.test(r.a[0])) return;
      torps = true;
      var tm = String(r.a[2]).match(/\d+/);
      if(tm) ts = Math.max(ts, +tm[0]);
    });
    /* No torpedoes left in force - a list's "Nova Cannon instead of prow
       torpedoes" taken (BACKLOG J120): Strength 0 is not "up to 6", it is
       nothing to load. has above reads the hull before list swaps on
       purpose (the Shokk-Attack Lance), so the check is made here. */
    if(!torps) return false;
    if(c.tsmin != null && ts < +c.tsmin) return false;
    if(c.tsmax != null && ts > +c.tsmax) return false;
  }
  if(c.no && rowHit(c.no, inForce.concat(maybe))) return false;
  if(c.noopt && (sh.ol || []).some(function(o){ return new RegExp(c.noopt, "i").test(o.t); }))
    return false;
  /* offopt: gone while one of the hull's own options matching it is taken.
     p.192 Fast Clipper is taken "Instead of taking a refit normally", so it
     replaces the Xenotech refit (Fleets pp. 175, 192). noopt above asks only
     whether the hull has such an option at all. */
  if(c.offopt && (sh.ol || []).some(function(o, i){
        return (sel.ost || [])[i] === "take" && new RegExp(c.offopt, "i").test(o.t); }))
    return false;
  /* up / noup: another list upgrade taken on this unit, by label. A Chaos
     Mark is bought only with a Chaos Space Marine crew or, on the Tzeentch
     list, a Daemonship (Fleets pp. 236-249); a Daemonship may not have a
     Chaos Space Marine crew (pp. 227, 237, 241, 245, 249). */
  if(c.up || c.noup){
    var taken = takenUpgradeLabels(sel, si, ei);
    if(c.up && !taken.some(function(l){ return new RegExp(c.up, "i").test(l); })) return false;
    if(c.noup && taken.some(function(l){ return new RegExp(c.noup, "i").test(l); })) return false;
  }
  return true;
}

/* Is a targeted row (en.at) aimed at this unit? A targetless row is for
   every ship its condition fits; a host row aimed at a whole type heading is
   the borrowed ship's by hostTypeRow (J120). */
export function rowAttached(sel, si, en){
  if(!en || !en.at) return true;
  if(si >= HOST_OFF) return hostTypeRow(sel, si, en);
  return en.at.some(function(p){ return p[0] === sel.si && p[1] === sel.ei; });
}
/* Labels of the list upgrades taken on this unit, the row at (si, ei)
   excluded so that a condition never reads its own state. */
export function takenUpgradeLabels(sel, si, ei){
  var out = [];
  if(!sel.list) return out;
  var sh = sel.sh;
  upSecs(sel).forEach(function(sec, sj){ sec.ents.forEach(function(en, ej){
    if(!isUpgradeEnt(en) || (sj === si && ej === ei)) return;
    /* a row aimed at other hulls is not on this one, whatever the record
       says (J20 d): it would answer an "up" condition for free */
    if(!rowAttached(sel, sj, en)) return;
    if(upState(sel, sj, ej) === "take") out.push(String(en.l || ""));
    /* A row hidden behind the ship's own option counts as taken with the
       option: the battle barge's embarked Chaos Space Marines (p.255) are
       the crew that lets it take a Mark (p.244). */
    else if(sh && (sh.ol || []).some(function(o, i){
        return o.cov && optionCoversRow(o, en) && optState(sel, i) === "take"; }))
      out.push(String(en.l || ""));
  }); });
  return out;
}

/* Every fleet list upgrade in two sets: the ones belonging to this row and
   the rest. Entries are [si, ei, en]; en is the catalogue's row object,
   read-only by contract. */
/* upgradesFor walks every condition of every list row; a selection asks it
   many times over (optionsOf once per option, the prices, the ceiling), so
   the answer is kept per selection object and its answers. */
export var UPFOR = typeof WeakMap === "function" ? new WeakMap() : null;
export function upgradesFor(sel){
  var sig = UPFOR ? JSON.stringify([sel.ups || {}, sel.ost || {}, sel.oqty || {}, OFFERED_BUSY]) : "";
  var hit = UPFOR ? UPFOR.get(sel) : null;
  if(hit && hit.sig === sig) return hit.res;
  var res = upgradesForRaw(sel);
  if(UPFOR) UPFOR.set(sel, { sig: sig, res: res });
  return res;
}
export function upgradesForRaw(sel){
  var own = [], other = [];
  if(!sel.list) return { own: own, other: other };
  /* A planetary defence is bought from the price list of Fleets p. 499, which
     sells no refits, crews or marks; a fleet list's upgrades are for that
     list's ships. Without this gate a Space Station on a Chaos list was
     offered Chaos Space Marine crews, on the Explorator list it was FORCED to
     take the Mechanicus turret refit, and a platform could buy a Power Ram
     (mapping 7.10.2026: 29 of 32 lists leaked at least one row). p. 19 says
     the same of the one upgrade the book does mention: "Escort squadrons and
     defences may not be equipped with special torpedoes at all."
     The book makes one exception itself: "A Ramilies can purchase special
     torpedoes" (p. 503). So a quadrant fort bought as a defence is offered
     the rows that name the forts (cond.qd, see condOK) and nothing else
     (user decision 13.10.2026, BACKLOG J174). */
  var fortRows = !!sel.defence;
  if(fortRows && !(sel.sh && sel.sh.qd)) return { own: own, other: other };
  var foreign = foreignReserveRow(sel.list, sel.en, sel.sh);
  upSecs(sel).forEach(function(sec, si){ sec.ents.forEach(function(en, ei){
    if(!isUpgradeEnt(en)) return;
    if(fortRows && !(en.cond && en.cond.qd)) return;
    /* From the host list only optional rows offered to the whole fleet: a
       targeted row's targets are the host's coordinates and the borrowed ship
       is not among them, and a required row concerns that list's own ships
       (T35). */
    var hostType = si >= HOST_OFF && hostTypeRow(sel, si, en);
    if(si >= HOST_OFF && ((en.at && !hostType) || en.req || hostRowShadowed(sel, en))) return;
    if(foreign && si < HOST_OFF) return;
    if(coveredByShipOption(sel, en)) return;
    if(!condOK(sel, en, si, ei)) return;
    var at = en.at;
    /* A required upgrade must not hide under the collapsed list: it is always
       in force and appears on the card, so it appears in the builder too. */
    /* A required row with targets belongs to those targets only: the Chaos
       Warmaster's mandatory Mark (Fleets pp. 236-248) is his row, and used
       to appear as a "required" row on every ship of the list. */
    if(en.req){
      if(!at || at.some(function(p){ return p[0] === sel.si && p[1] === sel.ei; })) own.push([si, ei, en]);
      return;
    }
    if(hostType){ own.push([si, ei, en]); return; }
    if(!at){ other.push([si, ei, en]); return; }
    if(at.some(function(p){ return p[0] === sel.si && p[1] === sel.ei; })) own.push([si, ei, en]);
  }); });
  return { own: own, other: other };
}

/* Required upgrades attach the moment a unit is added. Evaluated in list
   order with each found requirement already in force for the next one -
   the same order the legacy applyRequired mutated in. Returns "si:ei" keys;
   the caller decides how to record them. */
export function requiredUpgradeKeys(sel){
  var keys = [];
  if(!sel.list || sel.defence || foreignReserveRow(sel.list, sel.en, sel.sh)) return keys;
  var ups = {};
  Object.keys(sel.ups).forEach(function(k){ ups[k] = sel.ups[k]; });
  var cur = Object.assign({}, sel, { ups: ups });
  sel.list.secs.forEach(function(sec, si){ sec.ents.forEach(function(en, ei){
    if(!isUpgradeEnt(en) || !en.req) return;
    /* A targetless requirement applies to every ship the condition fits: that
       is how the AdMech +1 turret and dorsal lance land on the right hulls. */
    var mine = en.at ? en.at.some(function(p){ return p[0] === sel.si && p[1] === sel.ei; })
                     : condOK(cur, en, si, ei);
    if(!mine) return;
    var k = upgradeKey(si, ei);
    ups[k] = "take";
    keys.push(k);
  }); });
  return keys;
}

/* Rows the catalogue ticks when the ship is ADDED, and never again. The
   difference from requiredUpgradeKeys matters: a required row is forced on
   every render and so cannot be untaken, while a default row is the opening
   position the player may change.

   The four Chaos Warmasters' Marks are default rows, not required ones,
   because the god's own battle barge already carries the Mark in its price -
   "it does not have to be paid for separately by the ship's commander"
   (Fleets pp. 258, 260, 262, 264). Locked, the app charged it twice: a
   Nurgle Warmaster is 135 (100 + 35) beside a Terminus Est whose 430 already
   includes it, and for Nurgle the Mark's extra hit is in the profile too
   (hp 13 against a plain Chaos battle barge's 12). The requirement itself did
   not go away - it moved to resolveFleet, which can see which of the two
   situations the fleet is in. */
export function defaultUpgradeKeys(sel){
  var keys = [];
  if(!sel.list || sel.defence) return keys;
  var ups = {};
  Object.keys(sel.ups).forEach(function(k){ ups[k] = sel.ups[k]; });
  var cur = Object.assign({}, sel, { ups: ups });
  sel.list.secs.forEach(function(sec, si){ sec.ents.forEach(function(en, ei){
    if(!isUpgradeEnt(en) || !en.dflt) return;
    var mine = en.at ? en.at.some(function(p){ return p[0] === sel.si && p[1] === sel.ei; })
                     : condOK(cur, en, si, ei);
    if(!mine) return;
    var k = upgradeKey(si, ei);
    ups[k] = "take";
    keys.push(k);
  }); });
  return keys;
}
