/* A list's own section rules. Rule kinds (from the catalogue's list):
     section_count, cap, ratio, per_points, mandatory_at, squadron   (as before)
     allowed_at       a purchase permitted only from a points threshold (or a
                      remainder), optionally also needing another row present
     conditional_cap  a row capped differently when a condition row is present
     requires         if row A is present, row B must be too
     min_ratio        at least N of A for every B
     compare          count(A) op count(B), with a multiplier on A
     points_share     points of A at most a share of the fleet / a pick
     tiers            a cap that steps with the points limit
     upgrade_ratio    units that bought an upgrade, per B
     unit_upgrade_max at most N upgrades from a section on one unit
     option_ratio     units that took an own option (opt_re), per N hulls
   A pick is [{sec, re?}]: a section index and an optional name filter. */

import { citeText, clanzTiddlas, escortSquadronKeys } from "./fleet.js";
import { upCost } from "./pricing.js";
import { HOST_OFF, isUpgradeEnt, optState, upState, upgradeTakenAnyWay, upgradesFor } from "./upgrades.js";
import { secNameIssues } from "./validation.js";

/* The counting helpers the checks share, over this list and these members. */
export function fleetCounters(L, catalog, members){
  /* Fleets p. 14: "the restrictions on maximum and minimum numbers of ships
     are determined for the fleet as a whole, regardless of whether they were
     purchased from the list or as reserves."

     The app counts by section, the book by type, and the bridge between them
     is the section HEADING - the book's own way of classifying that ship in
     the list it is printed in. A borrowed ship therefore counts in a host
     rule when both headings name a ship category (ct "type") and they are the
     same heading. A heading that names specific ships or a list's own access
     to another race (Planet Killer, Chaos Space Hulk, Kroot Vessels) is "own":
     nothing borrowed counts there, because p. 15 keeps named access and
     reserves apart. An index alone would be worse than useless here - index 3
     is "Battleships" on one list and "Battlecruisers" on another. */
  var secKey = function(sec){ return String((sec && sec.t) || "").trim().toLowerCase(); };
  /* The ship category p. 14 counts by: "battlecruisers, grand cruisers, heavy
     cruisers, cruisers, and light cruisers all count as 'cruisers'". */
  var rtOf = function(en2){
    var sh2 = en2 && en2.r != null ? catalog.ships[String(en2.r)] : null;
    return sh2 ? sh2.rt : null;
  };
  var matches = function(m, si, re){
    if(!m.unitRow) return false;
    if(m.own) return m.si === si && (!re || re.test(m.en.l));
    var sec = L.secs[si];
    if(!sec || sec.ct !== "type") return false;
    var ds = m.sel.list && m.sel.list.secs[m.si];
    if(!ds || ds.ct !== "type" || secKey(ds) !== secKey(sec)) return false;
    /* The heading alone is not enough. Bastion Fleets prints battleships,
       grand cruisers AND battlecruisers under one "Battleships" heading, so
       heading identity alone made a borrowed Avenger (a grand cruiser, and
       p. 14 says grand cruisers count as cruisers) eat the host's single
       battleship slot. The host section must also hold a row of the same
       p. 14 category; otherwise the ship is counted nowhere and the fleet
       says so (the "no counterpart" row below). */
    var mine = rtOf(m.en);
    if(mine && !sec.ents.some(function(e2){
        return e2.k === "unit" && rtOf(e2) === mine; })) return false;
    return !re || re.test(m.en.l);
  };
  var secShips = function(si, re){ return members.filter(function(m){ return matches(m, si, re); })
    .reduce(function(a, m){ return a + m.hulls; }, 0); };
  var secUnits = function(si, re){ return members.filter(function(m){ return matches(m, si, re); }).length; };
  var rx = function(p){ return p.re ? new RegExp(p.re, "i") : null; };
  /* A pick can also name what no section of this list holds (J144): race -
     a ship borrowed from a list of that race; hull - a profile name, own or
     borrowed. Fleets p. 142: a fleet taking Chaos ships through an Ordo
     Malleus Inquisitor must not "include Space Marine vessels" and "may not
     take any Grey Knights vessels" - an Imperial fleet can have those from
     its own Inquisition section, as reserves or as allies alike. */
  var pickHas = function(m, p){
    if(p.race == null && p.hull == null) return matches(m, p.sec, rx(p));
    if(!m.unitRow) return false;
    if(p.race != null && (m.own || !m.sel.list || m.sel.list.race !== p.race)) return false;
    if(p.hull != null && !(m.sel.sh && new RegExp(p.hull, "i").test(String(m.sel.sh.nm || "")))) return false;
    return !p.re || rx(p).test(m.en.l);
  };
  /* A pick narrows a section by ship name where the heading alone counts
     the wrong hulls (Bastion Fleets prints three kinds under "Battleships"). */
  /* units in a list of explicit escort squadrons (L.esq): squadrons, not
     cards - escort cards with one letter are one squadron, whichever picks
     they match (escortSquadronKeys) */
  var esqKeys = L.esq ? escortSquadronKeys(L, members) : null;
  var count = function(pick, secs, units){
    if(units && esqKeys){
      var seen = {};
      members.forEach(function(m, i){
        if(pick ? pick.some(function(p){ return pickHas(m, p); }) : (secs || []).some(function(si){ return matches(m, si, null); }))
          seen[esqKeys[i]] = 1; });
      return Object.keys(seen).length;
    }
    var f = units ? secUnits : secShips;
    return pick ? pick.reduce(function(a, p){
                    var ms = members.filter(function(m){ return pickHas(m, p); });
                    return a + (units ? ms.length : ms.reduce(function(b, m){ return b + m.hulls; }, 0)); }, 0)
                : (secs || []).reduce(function(a, i){ return a + f(i, null); }, 0);
  };
  var pointsOfPick = function(pick, secs){
    return members.filter(function(m){
      return pick ? pick.some(function(p){ return pickHas(m, p); })
                  : (secs || []).indexOf(m.si) >= 0 && m.unitRow;
    }).reduce(function(a, m){ return a + m.points; }, 0);
  };
  var distinctKinds = function(pick){
    var seen = {};
    members.forEach(function(m){
      if(pick.some(function(p){ return pickHas(m, p); }))
        seen[String(m.en.l).split(" \u2014 ")[0].trim().toLowerCase()] = 1;
    });
    return Object.keys(seen).length;
  };
  /* up_sec: points spent on the rows of an upgrade section - Tyranid Ordnance
     markers are bought for a ship, not as units (Fleets p. 431). */
  var upShare = function(secIdx){
    return members.reduce(function(a, m){
      if(!m.sel || !m.sel.sh) return a;
      var ups;
      try { ups = upgradesFor(m.sel); } catch(e){ return a; }
      return a + ups.own.concat(ups.other).filter(function(x){
        return x[0] === secIdx && upState(m.sel, x[0], x[1]) === "take";
      }).reduce(function(b, x){ return b + upCost(m.sel, x[2]); }, 0);
    }, 0);
  };
  var condMet = function(r){ return !r.cond_pick || count(r.cond_pick, null) >= (r.cond_min == null ? 1 : r.cond_min); };
  /* J118: si/ei are the HOST's indexes. For a borrowed ship the host's row
     is moved by HOST_OFF in its selection (p. 14, upgrades from either list);
     without the move the key hit the donor list's row and the host's budget
     row stayed green (spot check 20, seed 2026091443). */
  var tookUp = function(m, si, ei){ return upgradeTakenAnyWay(m.sel, m.own ? si : HOST_OFF + si, ei); };
  var upRows = function(secIdx, re){
    var rows = [];
    (L.secs[secIdx] ? L.secs[secIdx].ents : []).forEach(function(en, ei){
      if(isUpgradeEnt(en) && (!re || re.test(en.l))) rows.push([secIdx, ei, en]);
    });
    return rows;
  };

  /* J221: an ally's special character, where the fleet list allows one
     (Exploration, Fleets p. 177) - counted below, not refused here */
  var allySpecial = function(m){
    return !!(L.ally_cmd && m.role === "ally" && m.en && m.en.k === "cmd" &&
              new RegExp(L.ally_cmd.re, "i").test(String(m.en.l))); };
  return { secKey: secKey, matches: matches, secShips: secShips, secUnits: secUnits, pickHas: pickHas, count: count, pointsOfPick: pointsOfPick, distinctKinds: distinctKinds, upShare: upShare, condMet: condMet, tookUp: tookUp, upRows: upRows, allySpecial: allySpecial };
}

/* The list's own section rules (the rule kinds above), one row per rule. */
export function checkSectionRules(F){
  var L = F.L, out = F.out;
  L.secs.forEach(function(sec, si){ (sec.rules || []).forEach(function(r){
    var lab = r.label || sec.t;
    /* interp: the book can be read two ways and the app takes the lenient one;
       the check says so, and warns when the strict reading fails (T20, T23). */
    if(r.interp) lab += " (open interpretation " + r.interp.id + ")";
    /* The rule's section references must still point at the sections they
       name. A rule that fails this is not counted: a wrong count reads like a
       rule of the game, and that is worse than a visible data error. */
    var badSec = secNameIssues(L, r, []);
    if(badSec.length){
      out.push({ ok: false, t: "Data error: " + lab,
        v: "section index does not match its name (" + badSec.join(", ") + ")",
        s: r.src });
      return;
    }
    if(Object.prototype.hasOwnProperty.call(SECTION_RULES, r.kind)) SECTION_RULES[r.kind](F, r, sec, si, lab);
  }); });
}

/* r.kind -> its check. Each pushes its rows to F.out; lab is the rule's label. */
var SECTION_RULES = {
  section_count: ruleSectionCount,
  cap: ruleCap,
  ratio: ruleRatio,
  per_points: rulePerPoints,
  mandatory_at: ruleMandatoryAt,
  squadron: ruleSquadron,
  allowed_at: ruleAllowedAt,
  conditional_cap: ruleConditionalCap,
  requires: ruleRequires,
  min_ratio: ruleMinRatio,
  compare: ruleCompare,
  points_share: rulePointsShare,
  tiers: ruleTiers,
  upgrade_ratio: ruleUpgradeRatio,
  option_ratio: ruleOptionRatio,
  notice: ruleNotice,
  one_donor: ruleOneDonor,
  agreement: ruleAgreement,
  hook_capacity: ruleHookCapacity,
  up_budget: ruleUpBudget,
  unit_upgrade_max: ruleUnitUpgradeMax
};

function ruleSectionCount(F, r, sec, si, lab){
  var out = F.out, secShips = F.secShips, count = F.count;
  /* pick: the heading's count reaches rows outside its own section -
     Chaos renegade Imperial hulls "count as Chaos vessels in all
     respects" (Fleets p. 222), so they fill the list's own cruiser and
     escort headings even though the book prints them apart. */
  var c = r.pick ? count(r.pick, null) : secShips(si);
  out.push({ ok: c <= r.max && (c === 0 || c >= r.min), t: lab, v: c + " / " + r.max, s: r.src });
}

function ruleCap(F, r, sec, si, lab){
  var out = F.out, secShips = F.secShips, count = F.count;
  var cc = r.pick ? count(r.pick, null) : (r.sec || [si]).reduce(function(a, i){ return a + secShips(i); }, 0);
  out.push({ ok: cc <= r.max, t: lab, v: cc + " / " + r.max, s: r.src });
}

/* when_pick: the ratio only applies while that row is present - "If no
   hive ships are chosen, only Kraken and Vanguard drone ships may be
   included in the fleet" (Tyranids p. 431). */
function ruleRatio(F, r, sec, si, lab){
  var out = F.out, count = F.count, distinctKinds = F.distinctKinds;
  if(r.when_pick && count(r.when_pick, null) < 1) return;
  var have = count(r.allow_pick, r.allow_sec || [si], !!r.units);
  /* distinct: count kinds, not hulls - Commerce Protection "one Hero class
     starship for every other type of capital ship" (p. 456). A class's
     configurations are one type: the label before the dash. */
  var base = r.distinct ? distinctKinds(r.per_pick) : count(r.per_pick, r.per_sec);
  var allowed = Math.floor(base / r.per) * r.allow;
  /* min_one: "for every two" plus "at least one must" (Rogue Trader
     Exploration) and the Hive Mind Imperative: one is allowed as soon as
     the base exists. exempt: a flagship that does not count (Iyanden). */
  if(r.min_one && base >= 1) allowed = Math.max(1, allowed);
  if(r.exempt && count(r.exempt.cond_pick, null) >= (r.exempt.cond_min == null ? 1 : r.exempt.cond_min))
    allowed += (r.exempt.count == null ? 1 : r.exempt.count);
  /* at_least: a floor, not an addition. The Chaos Space Hulk needs no
     cruisers, but "it counts as a battleship for purposes of taking
     another so in order to take a second battleship, the fleet must
     already have six cruisers" (Fleets p. 288). */
  if(r.at_least && count(r.at_least.cond_pick, null) >= (r.at_least.cond_min == null ? 1 : r.at_least.cond_min))
    allowed = Math.max(allowed, r.at_least.count == null ? 1 : r.at_least.count);
  out.push({ ok: have <= allowed, t: lab, v: have + " / " + allowed, s: r.src });
  var strictR = Math.floor(base / r.per) * r.allow;
  if(r.interp && r.interp.strict === "min_one" && have <= allowed && have > strictR)
    out.push({ ok: true, warn: true, t: "Open interpretation (" + r.interp.id + "): " + r.label,
      v: have + " / " + strictR + " on the strict reading", s: r.interp.note });
}

function rulePerPoints(F, r, sec, si, lab){
  var lim = F.lim, worth = F.worth, out = F.out, secUnits = F.secUnits, count = F.count, pointsOfPick = F.pointsOfPick, condMet = F.condMet;
  var cp = r.pick ? count(r.pick, null) : (r.sec || [si]).reduce(function(a, i){ return a + secUnits(i); }, 0);
  /* The denominator is the fleet's own points: every one of these sentences
     says so - "for every 500 points, or part, that the fleet is worth"
     (Clanz p. 372), "for every full 1,000 points it contains" (Corsairs),
     "or part thereof in your fleet" (Space Marines). basis: "limit" is for
     a sentence that names the game instead. When the book names a set of
     ships (Tau "per FULL 750 points of Tau vessels"), of_pick wins.
     User decision T26, 14.9.2026. */
  var basePts = r.of_pick ? pointsOfPick(r.of_pick, null)
              : (r.basis === "limit" ? lim : worth);
  /* Two roundings: "per 500 points, or part" starts a new allowance at
     the first point of a band; "for every FULL 1,000 points" only counts
     completed bands. */
  var ap = r.full ? Math.floor(basePts / r.per) * r.each
                  : Math.max(1, Math.ceil(basePts / r.per)) * r.each;
  if(!condMet(r)) ap = 0;
  /* exact: "one Warlord for every 500 points, or part, that the fleet
     is worth - no more, no less" (Clanz p. 372). */
  out.push({ ok: r.exact ? cp === ap : cp <= ap, t: lab,
    v: cp + " / " + ap + (r.exact ? " exactly" : ""), s: r.src });
  if(r.interp && r.interp.strict_max != null && cp <= ap && cp > r.interp.strict_max)
    out.push({ ok: true, warn: true, t: "Open interpretation (" + r.interp.id + "): " + r.label,
      v: cp + " / " + r.interp.strict_max + " on the strict reading", s: r.interp.note });
}

function ruleMandatoryAt(F, r, sec, si, lab){
  var worth = F.worth, out = F.out, secUnits = F.secUnits, count = F.count;
  var cm = r.pick ? count(r.pick, null) : (r.sec || [si]).reduce(function(a, i){ return a + secUnits(i); }, 0);
  /* "If the fleet is worth over 750 points" is the fleet's own points, not
     the game's limit: a 700-point list still being built for a 1000-point
     game does not need its commander yet (user decision T24, 11.9.2026). */
  var need = r.over ? worth > r.points : worth >= r.points;
  out.push({ ok: !need || cm >= 1,
    t: lab + (r.points ? " (" + (r.over ? "over " : "from ") + r.points + " pts)" : " required"),
    v: need ? (cm >= 1 ? "included" : "missing") : "not required", s: r.src, warn: !need });
}

function ruleSquadron(F, r, sec, si, lab){
  var members = F.members, out = F.out, pickHas = F.pickHas;
  var insec = r.sec || [si];
  /* A squadron the player made with a letter says what is wrong with its
     size (user 28.10.2026: a custom squadron always reports it when it is
     short of the minimum): "2 ships: ... - too few, at least 3". */
  var sizeV = function(n, word){
    return n + " " + word + (n === 1 ? "" : "s") + ": "; };
  var sizeWhy = function(n){
    return n < r.min ? " - too few, at least " + r.min : n > r.max ? " - too many, at most " + r.max : ""; };
  /* Da Ork Clanz tiddla skwadrons are the player's own (clanzTiddlas): the
     rows of one tag in any mix (Fleets p. 372) with a Blood Axe tiddla's
     commandeered escorts (p. 369), a row without a tag by itself. A short row
     does not join a squadron the player did not make, because the Warlord's
     count reads the same skwadrons (ChatGPT audit RAW-01: two Brutes and two
     Onslaughts were green as one mixed tiddla here and two tiddlas there). */
  var CZ = F.L.clanz;
  if(CZ && !r.pick && insec.some(function(i){
        return F.L.secs[i] && new RegExp(CZ.tiddla, "i").test(String(F.L.secs[i].t).trim()); })){
    clanzTiddlas(F.L, members).forEach(function(t){
      var ok = t.n >= r.min && t.n <= r.max;
      if(!t.tag){
        var m = members[t.ork[0]];
        out.push({ ok: ok, t: m.sel.sh.nm, v: t.n + " ships", s: "Squadrons of " + r.min + "–" + r.max + ". " + r.src });
        return;
      }
      var names = t.ork.concat(t.com).map(function(i){ return members[i].hulls + " " + members[i].en.l; });
      out.push({ ok: ok, t: "Tiddla skwadron " + t.tag, v: sizeV(t.n, "escort") + names.join(" + ") + sizeWhy(t.n),
        s: "Squadrons of " + r.min + "–" + r.max + ". " + r.src });
    });
    return;
  }
  /* pick: the rule names a class rather than a heading. Tau p.455
     "Defenders are fielded in squadrons of 2-6 ships" sits under
     SQUADRONS, which lists no ships, and Messengers may operate alone. */
  var inRule = members.filter(function(m){
    return m.escort && (r.pick ? r.pick.some(function(p){ return pickHas(m, p); })
                               : insec.indexOf(m.si) >= 0);
  });
  /* Fleets p. 13: "The escorts in a squadron do not have to all be of
     the same class." A unit short of the minimum joins other escorts the
     rule covers - a squadron with room left, or other short units.
     split_fl: Armageddon, Fleets p. 41 "Space Marine vessels may not be
     squadroned with non-Space Marine vessels". with_pick: ships it may
     also join, Tau p. 455 "They may be combined in squadrons with
     Messengers if you wish". lone: "A single escort may be taken in a
     fleet as long as there are no other escorts in the fleet and no
     other restrictions due to the fleet list, such as a minimum of six
     escorts in a squadron, these restrictions cannot be ignored" - only
     where the list's sentence defers to p. 13. */
  /* Not the planetary defences: a Defence Monitor is printed Escort/1,
     but it is bought from the defences list (Fleets p. 499) and is not
     one of "the escorts in the fleet" that p. 13 speaks of. */
  var escortsInFleet = members.filter(function(m){ return m.escort && !m.defence; })
    .reduce(function(a, m){ return a + m.hulls; }, 0);
  /* A list whose rules count escort squadrons (L.esq) has the player's own
     squadrons, as the Clanz tiddlas above: one letter is one squadron in any
     mix, a card without one is a squadron by itself, and the counting rules
     read the same squadrons. A short card used to join a mixed squadron here
     while the count saw it as a squadron of its own: two cruisers with two
     Swords and two Cobras were green in Pirates and Wolf Packs, which asks
     for "at least one squadron of 3-6 escort vessels ... for each cruiser"
     (Fleets p. 179). A squadron of several rules (a Messenger beside
     Defenders) is said once; sep names sections that may not share one
     (Demiurg p. 487). */
  if(F.L.esq && inRule.length && !inRule.some(function(m){ return m.defence; })){
    var ek = escortSquadronKeys(F.L, members), said = F.esqSaid || (F.esqSaid = {});
    var srcOf = "Squadrons of " + r.min + "–" + r.max + ". " + r.src;
    inRule.forEach(function(m){
      var k = ek[members.indexOf(m)];
      if(k.indexOf("sq:") !== 0){
        var n = m.hulls, ok = n >= r.min && n <= r.max, v = n + " ships";
        if(n < r.min && !!r.lone && escortsInFleet === 1){ ok = true; v += " (the only escort in the fleet)"; }
        out.push({ ok: ok, t: m.sel.sh.nm, v: v, s: srcOf });
        return;
      }
      if(said[k]) return;
      said[k] = 1;
      var g = members.filter(function(x, j){ return ek[j] === k; });
      var gn = g.reduce(function(a, x){ return a + x.hulls; }, 0);
      var sep = ((F.L.esq.sep) || []).filter(function(re){
        return g.some(function(x){ return x.own && F.L.secs[x.si] && new RegExp(re, "i").test(String(F.L.secs[x.si].t).trim()); }); });
      out.push({ ok: gn >= r.min && gn <= r.max && sep.length <= 1, t: "Escort squadron " + k.slice(3),
        v: sizeV(gn, "ship") + g.map(function(x){ return x.hulls + " " + x.en.l; }).join(" + ") + sizeWhy(gn) + (sep.length > 1 ? " - may not be mixed" : ""),
        s: srcOf + (sep.length > 1 ? " " + citeText(F.L.esq.sep_cite) : "") });
    });
    return;
  }
  /* Every other list (28.10.2026): escort cards the player gave one letter
     are one mixed squadron (Rulebook p. 95, Fleets p. 13), checked as a
     squadron - its size across the cards, and split_fl's Space Marine
     vessels apart (Armageddon, Fleets p. 41). A lettered card is the
     player's squadron, so it does not join others by itself; the cards
     without a letter keep the implicit joining below, as before, so no saved
     fleet changes. Said once per letter (a Messenger beside Defenders). */
  var letterOf = function(m){
    return m.escort && !m.defence && m.unitRow && m.own && m.intent && m.intent.sq ? "sq:" + m.intent.sq : null; };
  var lettered = inRule.filter(letterOf);
  if(lettered.length){
    var saidL = F.esqSaid || (F.esqSaid = {});
    var srcL = "Squadrons of " + r.min + "–" + r.max + ". " + r.src;
    lettered.forEach(function(m){
      var k = letterOf(m);
      if(saidL[k]) return;
      saidL[k] = 1;
      var g = members.filter(function(x){ return letterOf(x) === k; });
      var gn = g.reduce(function(a, x){ return a + x.hulls; }, 0);
      var fls = r.split_fl ? g.map(function(x){ return String((x.sel.sh && x.sel.sh.fl) || ""); })
        .filter(function(f, j, a){ return a.indexOf(f) === j; }) : [];
      var split = fls.length > 1 && fls.some(function(f){ return /SPACE MARINE/i.test(f); });
      out.push({ ok: gn >= r.min && gn <= r.max && !split, t: "Escort squadron " + k.slice(3),
        v: sizeV(gn, "ship") + g.map(function(x){ return x.hulls + " " + x.en.l; }).join(" + ") + sizeWhy(gn) +
           (split ? " - Space Marine vessels with others" : ""),
        s: srcL + (split ? " Space Marine vessels may not be squadroned with non-Space Marine vessels. (Fleets p. 41)" : "") });
    });
    inRule = inRule.filter(function(m){ return !letterOf(m); });
    if(!inRule.length) return;
  }
  var poolKey = function(m){ return r.split_fl ? String((m.sel.sh && m.sel.sh.fl) || "") : ""; };
  var pools = {};
  inRule.forEach(function(m){ var k = poolKey(m); (pools[k] = pools[k] || []).push(m); });
  var partners = r.with_pick ? members.filter(function(m){
    return inRule.indexOf(m) < 0 && !letterOf(m) && r.with_pick.some(function(p){ return pickHas(m, p); });
  }) : [];
  var fits = function(x){
    if(x === 0) return true;
    for(var q = 1; q * r.min <= x; q++) if(x <= q * r.max) return true;
    return false;
  };
  Object.keys(pools).forEach(function(k){
    var pool = pools[k];
    var shortN = pool.filter(function(m){ return m.hulls < r.min; })
      .reduce(function(a, m){ return a + m.hulls; }, 0);
    var room = pool.filter(function(m){ return m.hulls >= r.min && m.hulls <= r.max; })
      .reduce(function(a, m){ return a + (r.max - m.hulls); }, 0) +
      partners.filter(function(m){ return poolKey(m) === k; })
      .reduce(function(a, m){ return a + Math.max(0, r.max - m.hulls); }, 0);
    var placed = false;
    for(var j = 0; j <= Math.min(shortN, room) && !placed; j++) placed = fits(shortN - j);
    var lone = !!r.lone && escortsInFleet === 1;
    pool.forEach(function(m){
      var n = m.hulls, ok = n >= r.min && n <= r.max, v = n + " ships";
      if(n < r.min && lone){ ok = true; v += " (the only escort in the fleet)"; }
      else if(n < r.min && placed){ ok = true; v += " (joins other escorts in a mixed squadron)"; }
      out.push({ ok: ok, t: m.sel.sh.nm, v: m.defence ? n + (n === 1 ? " defence" : " defences") : v,
        s: "Squadrons of " + r.min + "\u2013" + r.max + ". " + r.src });
    });
  });
}

function ruleAllowedAt(F, r, sec, si, lab){
  var worth = F.worth, out = F.out, count = F.count, pointsOfPick = F.pointsOfPick, condMet = F.condMet;
  var ca = count(r.pick, null);
  /* "A fleet of 1,000 points or more": the fleet's points, as above (T24). */
  var basis = r.basis === "remainder" ? worth - pointsOfPick(r.pick, null) : worth;
  var okPts = r.over ? basis > r.points : basis >= r.points;
  var okCond = condMet(r);
  out.push({ ok: ca === 0 || (okPts && okCond), t: lab,
    v: ca === 0 ? "none" : (okPts && okCond ? "allowed" : "not allowed"),
    s: r.src, warn: ca === 0 });
}

function ruleConditionalCap(F, r, sec, si, lab){
  var members = F.members, out = F.out, count = F.count, condMet = F.condMet;
  var cq = count(r.pick, null);
  /* cond_role: the condition is that the fleet HAS a borrowed ship, not
     that it has a particular row - "When reserves are taken in this
     manner, the fleet can have up to twelve cruisers" (Fleets p. 101). */
  var met = r.cond_role
    ? members.some(function(m){ return m.role === r.cond_role; })
    : condMet(r);
  var cap = met ? r.max_met : r.max_unmet;
  out.push({ ok: cap == null || cq <= cap, t: lab,
    v: cq + " / " + (cap == null ? "any" : cap), s: r.src });
}

function ruleRequires(F, r, sec, si, lab){
  var out = F.out, count = F.count;
  /* if_min: the rule starts from that many - "more than one Rogue Trader
     cruiser" (Fleets p. 174); if_units counts squadrons, not hulls. */
  var ifc = count(r.if_pick, null, !!r.if_units), thenc = count(r.then_pick, null), min = r.min == null ? 1 : r.min;
  var ifMin = r.if_min == null ? 1 : r.if_min;
  /* unless_pick: the requirement lapses while that row is present - the
     Bakka Emperor "can only be taken as reserves unless Admiral Rath
     leads the fleet" (Fleets p. 49). */
  var need = ifc >= ifMin && !(r.unless_pick && count(r.unless_pick, null) >= 1);
  out.push({ ok: !need || thenc >= min, t: lab,
    v: !need ? "not required" : (thenc >= min ? "included" : "missing"), s: r.src, warn: !need });
}

function ruleMinRatio(F, r, sec, si, lab){
  var out = F.out, count = F.count;
  /* units: squadrons rather than hulls - "At least one squadron of 3-6
     escort vessels must be included for each cruiser" (Fleets p. 179). */
  var b2 = count(r.per_pick, null), h2 = count(r.allow_pick, null, !!r.units), needN = b2 * r.min;
  out.push({ ok: b2 === 0 || h2 >= needN, t: lab, v: h2 + " / " + needN + " min", s: r.src });
}

function ruleCompare(F, r, sec, si, lab){
  var out = F.out, count = F.count;
  /* a_units/b_units count squadrons, b_add a fixed extra: Commerce
     Protection "one Rogue Trader cruiser and its attendant escorts ...
     Additionally, a single squadron of up to six Xenos escorts" (p. 457). */
  var a3 = count(r.a_pick, null, !!r.a_units) * (r.a_mult || 1),
      b3 = count(r.b_pick, null, !!r.b_units) + (r.b_add || 0);
  var okc = r.op === "<=" ? a3 <= b3 : r.op === "<" ? a3 < b3 : r.op === ">=" ? a3 >= b3
          : r.op === ">" ? (b3 === 0 || a3 > b3) : a3 === b3;
  out.push({ ok: okc, t: lab, v: a3 + " " + r.op + " " + b3, s: r.src });
}

function rulePointsShare(F, r, sec, si, lab){
  var lim = F.lim, worth = F.worth, out = F.out, pointsOfPick = F.pointsOfPick, upShare = F.upShare, condMet = F.condMet;
  var share = r.up_sec != null ? upShare(r.up_sec) : pointsOfPick(r.pick, null);
  var baseP = r.of === "limit" ? lim : r.of === "pick" ? pointsOfPick(r.of_pick, null) : worth;
  var allow = r.pct != null ? baseP * r.pct / 100 : baseP * (r.frac || 1);
  if(!condMet(r)) allow = 0;
  out.push({ ok: share <= allow + 1e-9, t: lab, v: share + " / " + Math.floor(allow) + " pts", s: r.src });
}

function ruleTiers(F, r, sec, si, lab){
  var lim = F.lim, worth = F.worth, out = F.out, count = F.count;
  /* "up to one Warsphere if the fleet is worth 1500 points" (Tau p. 457):
     the fleet's own points, as with per_points (T26). */
  var ct = count(r.pick, null), capT = 0, tierBase = r.basis === "limit" ? lim : worth;
  (r.tiers || []).forEach(function(t){ if(tierBase >= t[0]) capT = t[1]; });
  out.push({ ok: ct <= capT, t: lab, v: ct + " / " + capT, s: r.src });
}

function ruleUpgradeRatio(F, r, sec, si, lab){
  var members = F.members, out = F.out, count = F.count, tookUp = F.tookUp, upRows = F.upRows;
  var rows = upRows(r.up_sec, r.up_re ? new RegExp(r.up_re, "i") : null);
  var nU = members.filter(function(m){ return rows.some(function(x){ return tookUp(m, x[0], x[1]); }); }).length;
  var bU = count(r.per_pick, null);
  var aU = Math.floor(bU / r.per) * r.allow;
  if(r.min_one && bU >= 1) aU = Math.max(1, aU);
  out.push({ ok: nU <= aU, t: lab, v: nU + " / " + aU, s: r.src });
}

function ruleOptionRatio(F, r, sec, si, lab){
  var members = F.members, out = F.out, pickHas = F.pickHas;
  /* Units of a pick that took an own option matching opt_re, at most
     allow per `per` hulls of the pick: "Up to half of the Grey Knights
     strike cruisers in a fleet may replace their launch bays" (Fleets
     p. 151). */
  var orx = new RegExp(r.opt_re, "i");
  var inPick = members.filter(function(m){
    return (r.pick || []).some(function(p){ return pickHas(m, p); }); });
  var tookO = inPick.filter(function(m){
    var shO = m.sel && m.sel.sh;
    return !!shO && (shO.ol || []).some(function(o, i){
      return orx.test(o.t || "") && optState(m.sel, i) === "take"; });
  }).length;
  var baseO = inPick.reduce(function(a, m){ return a + m.hulls; }, 0);
  var allowO = Math.floor(baseO / r.per) * r.allow;
  out.push({ ok: tookO <= allowO, t: lab, v: tookO + " / " + allowO, s: r.src, warn: tookO === 0 });
}

/* notice: a book rule the app does not check yet (v1.1: gravitic hook
   capacity, cross-list reserves) is shown as a warning, not left silent. */
function ruleNotice(F, r, sec, si, lab){
  var out = F.out;
  out.push({ ok: true, warn: true, t: lab, v: "not checked by the app", s: r.src });
}

/* one_donor: the borrowed ships of these roles come from one list only -
   "they can only be from one fleet" (Fleets p. 177, J213). */
function ruleOneDonor(F, r, sec, si, lab){
  var L = F.L, members = F.members, out = F.out;
  var donors = {};
  members.forEach(function(m){
    if((r.roles || []).indexOf(m.role) >= 0 && m.sel && m.sel.list && m.sel.list !== L) donors[m.sel.list.nm] = 1; });
  var nd = Object.keys(donors).length;
  if(nd) out.push({ ok: nd <= 1, t: lab, v: nd + " / 1" + (nd > 1 ? ": " + Object.keys(donors).join(", ") : ""), s: r.src });
}

/* agreement: rows the book allows only by the opponent's consent - the
   outdated Siluria and Havoc (Fleets p. 174), Tyranid bio-enhancements in
   a one-off game (p. 426). Said in yellow while one is in the fleet. */
function ruleAgreement(F, r, sec, si, lab){
  var members = F.members, out = F.out, count = F.count, tookUp = F.tookUp, upRows = F.upRows;
  var agN = r.pick ? count(r.pick, null) : 0;
  if(r.up_sec != null) upRows(r.up_sec, null).forEach(function(x){
    members.forEach(function(m){ if(tookUp(m, x[0], x[1])) agN++; }); });
  if(agN) out.push({ ok: true, warn: true, t: "By agreement with your opponent: " + lab,
                     v: agN + " in the fleet", s: r.src });
}

/* hook_capacity: "You may not have more Orcas and Wardens than the gravitic
   hook capacity of the fleet" (Fleets p. 454). The profile's capacity line
   names what each hook carries, so a Warden-only hook (Custodian p. 468,
   Emissary p. 472) is no capacity for Orcas or Dhows: "Gravitic hooks on a
   Custodian battleship or Emissary starship cannot count toward this total"
   (p. 457). caps indexes sh.hk: 0 = Orca/Warden, 1 = Warden only,
   2 = Dhow only. */
function ruleHookCapacity(F, r, sec, si, lab){
  var members = F.members, out = F.out, count = F.count;
  var carriedH = count(r.carry, null);
  var capH = members.reduce(function(a, m){
    var hk = m.sel && m.sel.sh && m.sel.sh.hk;
    /* An orbital's hook carries the Orcas and Wardens "assigned to
       guard" it, which are bought separately (Fleets pp. 478, 480, 481):
       left out of the capacity, those guards made the fleet illegal
       (review 9.10.2026). But on an Orbital or a Waystation the hook is
       one of four systems to choose from, so it counts only when the
       row is really on the unit. */
    if(!hk) return a;
    var hkRow = ((m.R && m.R.weapons) || []).filter(function(w){
         return (w.box == null || w.box === "on") && /gravitic hook/i.test(String((w.a && w.a[0]) || "")); })[0];
    if(m.defence && !hkRow) return a;
    /* two hook modules on one Orbital carry two (Fleets p. 480, J171) */
    var hkN = m.defence && hkRow ? Math.max(1, hkRow.count || 1) : 1;
    return a + (r.caps || [0]).reduce(function(b, i){ return b + (hk[i] || 0); }, 0) * m.hulls * hkN;
  }, 0);
  /* soft: an open reading (War Host, Fleets p. 487, T50) - going over is
     said in yellow, not counted against the fleet. */
  out.push({ ok: carriedH <= capH || !!r.soft, warn: !!r.soft && carriedH > capH,
             t: lab, v: carriedH + " / " + capH, s: r.src + (r.interp ? " " + r.interp.note : "") });
}

/* up_budget: rows of an upgrade section limited by a budget of units and
   taken upgrades - Clanz "A vessel or escort skwadron led by a Warlord
   may be given up to one of the following upgrades per Command re-roll
   the Warlord has" (p. 370): each Warlord has one re-roll and may buy
   more. The ship-to-Warlord binding is not modelled, the sum is. */
function ruleUpBudget(F, r, sec, si, lab){
  var members = F.members, out = F.out, count = F.count, tookUp = F.tookUp, upRows = F.upRows;
  var usedB = 0, budget = 0;
  /* up_re: only these rows use the budget - a Strand of Fortune per Lord
     of Tzeentch (Fleets p. 236), not every Force of Chaos. */
  var budRows = upRows(r.up_sec, r.up_re ? new RegExp(r.up_re, "i") : null);
  members.forEach(function(m){ budRows.forEach(function(x){ if(tookUp(m, x[0], x[1])) usedB++; }); });
  (r.budget || []).forEach(function(b){
    if(b.pick) budget += (b.units || 1) * count(b.pick, null, true);
    if(b.up_re) upRows(b.up_sec, new RegExp(b.up_re, "i")).forEach(function(x){
      members.forEach(function(m){ if(tookUp(m, x[0], x[1])) budget += (b.weight || 1); });
    });
  });
  out.push({ ok: usedB <= budget, t: lab, v: usedB + " / " + budget, s: r.src, warn: usedB === 0 });
}

function ruleUnitUpgradeMax(F, r, sec, si, lab){
  var members = F.members, out = F.out, pickHas = F.pickHas, tookUp = F.tookUp, upRows = F.upRows;
  var rowsM = upRows(r.up_sec, r.up_re ? new RegExp(r.up_re, "i") : null);
  var over = 0;
  members.forEach(function(m){
    if(!r.unit_pick.some(function(p){ return pickHas(m, p); })) return;
    var k = rowsM.filter(function(x){ return tookUp(m, x[0], x[1]); }).length;
    if(k > r.max){ over++; out.push({ ok: false, t: lab + ": " + (m.R ? m.R.className : m.en.l),
      v: k + " / " + r.max, s: r.src }); }
  });
  if(!over) out.push({ ok: true, t: lab, v: "max " + r.max, s: r.src, warn: true });
}

/* Row limits of this list, and rows that are alternatives of one purchase. */
export function checkRowLimits(F){
  var L = F.L, members = F.members, out = F.out, tookUp = F.tookUp;
  /* Row limits are this list's own: a borrowed ship carries ANOTHER list's
     section and row indexes, and index 4:0 is "Venerable battle barge" here
     but "Xenos Vessel" there. Only the fleet's own rows are counted; a
     borrowed row's own limit is the donor list's business (Fleets p. 14
     counts types, not rows). */
  L.secs.forEach(function(sec, si){ sec.ents.forEach(function(en, ei){
    if(en.mx == null) return;
    if(isUpgradeEnt(en)){
      var n = members.filter(function(m){ return m.own && tookUp(m, si, ei); }).length;
      if(n > 0 || en.mx === 0)
        out.push({ ok: n <= en.mx, t: en.l, v: n + " / " + en.mx,
          s: "The fleet may take this upgrade " + en.mx + (en.mx === 1 ? " time." : " times.") });
      return;
    }
    var c = members.filter(function(m){ return m.own && m.si === si && m.ei === ei; }).reduce(function(a, m){ return a + m.hulls; }, 0);
    if(c > 0 || en.mx === 0)
      out.push({ ok: c <= en.mx, t: en.l, v: c + " / " + en.mx, s: "Entry is limited to " + en.mx + " in the list." });
  }); });
  /* fxg: rows that are alternatives of one fleet purchase. "The fleet gets
     one re-roll and can purchase extra re-rolls at the cost shown" (Necrons
     p. 404, Demiurg p. 486): One or Two, not one of each on two ships. */
  var fxg = {};
  L.secs.forEach(function(sec, si){ sec.ents.forEach(function(en, ei){
    if(!en.fxg || !isUpgradeEnt(en)) return;
    var g = fxg[en.fxg] || (fxg[en.fxg] = { n: 0, t: sec.t, labels: [] });
    g.labels.push(en.l);
    g.n += members.filter(function(m){ return tookUp(m, si, ei); }).length;
  }); });
  Object.keys(fxg).forEach(function(k){
    var g = fxg[k];
    if(g.n > 0) out.push({ ok: g.n <= 1, t: g.t + " (bought once for the fleet)", v: g.n + " / 1",
      s: "One purchase for the whole fleet: " + g.labels.join(" or ") + "." });
  });
}
