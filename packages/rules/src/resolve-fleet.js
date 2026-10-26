/* ========================= item 8: resolveFleet =========================
   fleetIntent = { list: <list name>, limit, units: [CanonicalUnitIntent] }
   -> { list, limit, units: [ResolvedUnit], totals: { points, maxPoints, hulls },
        checks: [{ ok, t, v, s, warn? }] }
   The legality checks of the app, pure: every count comes from the resolved
   members, every rule from the catalogue's list. The checks themselves are
   in fleet-sections.js, fleet-purchases.js, fleet-reserves.js and
   fleet-specials.js; resolveFleet calls them in the order their rows appear. */

import { defenceOwnPoints } from "./crits.js";
import { citeText, clanzCommand, fleetFacts, placeCommanders } from "./fleet.js";
import { checkCommanderPrice, checkDefences, checkOptionShares, checkRequiredWeapons, checkUnitIssues, checkWarmasterMark, checkWebway } from "./fleet-purchases.js";
import { checkReserveRaces, checkReserveSources, checkReserveTypes } from "./fleet-reserves.js";
import { checkRowLimits, checkSectionRules, fleetCounters } from "./fleet-sections.js";
import { checkBorrowedShips, checkHulkPowerfields, checkListSpecials, checkOrkClanz, checkSquadrons } from "./fleet-specials.js";
import { roleOfIntent } from "./lending.js";
import { resolveUnit } from "./unit.js";
import { isUpgradeEnt, selectionOf } from "./upgrades.js";

export function resolveFleet(fleetIntent, catalog){
  var L = catalog.lists.filter(function(x){ return x.nm === fleetIntent.list; })[0] || null;
  var ctx = { list: L, host: L };
  var lim = fleetIntent.limit | 0;
  var members = (fleetIntent.units || []).map(function(it){
    var sel = selectionOf(it, ctx, catalog);
    var R = resolveUnit(it, ctx, catalog);
    var en = sel.en;
    /* A row in the fleet's OWN reserve section is a reserve even though it is
       bought from this list: that is what the heading means. Bastion Fleets
       prints five Chaos hulls under "THE RESERVE FLEETS OF SEGMENTUM
       OBSCURUS" and says they are "picked in the normal manner, so for every
       three vessels of a given type ... you may pick one vessel of that type
       from another Imperial list, or from the above selection of Chaos
       vessels (but not both)" (Fleets p. 39) - one shared 1:3 budget, which
       is exactly what counting them as reserves gives. */
    var ownSec = sel.list && sel.list.secs[sel.si];
    var role = roleOfIntent(it);
    if(role === "core" && sel.list === L && ownSec && ownSec.ct === "reserve")
      role = "reserve";
    return { intent: it, sel: sel, R: R, si: sel.si, ei: sel.ei, en: en,
             role: role, own: !sel.list || sel.list === L,
             unitRow: !!en && !isUpgradeEnt(en), hulls: sel.hulls, escort: sel.escort,
             /* a planetary defence: outside the fleet list's own counts */
             defence: sel.defence,
             points: R && R.points != null ? R.points : 0,
             maxPoints: R && R.maxPoints != null ? R.maxPoints : 0 };
  });
  var tot = members.reduce(function(a, m){ return a + m.points; }, 0);
  var totMax = members.reduce(function(a, m){ return a + m.maxPoints; }, 0);
  /* What "the fleet is worth" in a list rule (commander needed over 750
     points, one per 500 points, a fleet of 1,000 points or more): the ships,
     without the planetary defences. The defences are paid from the same
     points - "these additional defences come directly from the points
     allowed against his or her fleet list" (Fleets p. 498) - so the points
     LIMIT counts them, but the book never calls them part of the fleet's
     worth, and a 400-point Blackstone Fortress beside 540 points of cruisers
     would otherwise demand an Admiral and a second Warlord. User decision
     8.10.2026 (BACKLOG J170). */
  /* Not the Ramilies or the Haven: those are "bought from the fleet's
     points, rather than defences" (pp. 500, 337), so they are part of what
     the fleet is worth, like the Fortress-Monastery - the same reason they
     are left out of the one-third sum below (review 9.10.2026: they used to
     fall into neither). */
  var defPts = members.reduce(function(a, m){
    return a + (m.defence && !defenceOwnPoints(m.sel.sh) ? m.points : 0); }, 0);
  var worth = tot - defPts;
  var out = [];
  out.push({ ok: tot <= lim, t: "Points limit", v: tot + " / " + lim,
    s: tot <= lim ? (lim - tot) + " pts remaining" : (tot - lim) + " pts over the limit" });
  if(!L) return { list: null, limit: lim, units: members.map(function(m){ return m.R; }),
                  totals: { points: tot, maxPoints: totMax, hulls: 0 }, checks: out, facts: [], aboard: [] };
  /* The checks, in the order their rows appear. Each reads what it needs
     from F: the list, the members, the rows so far (out) and the counting
     helpers. */
  var F = fleetCounters(L, catalog, members);
  F.L = L; F.lim = lim; F.members = members; F.worth = worth; F.out = out;
  checkSectionRules(F);
  checkRowLimits(F);
  checkWarmasterMark(F);
  checkUnitIssues(F);
  checkCommanderPrice(F);
  checkDefences(F);
  checkRequiredWeapons(F);
  checkOptionShares(F);
  checkWebway(F);
  checkReserveTypes(F);
  checkReserveRaces(F);
  checkReserveSources(F);

  /* Aboard (J215): a commander a rule places gets a row - green with his
     ship, red when the player's choice breaks the rule or no ship is left
     for him. A commander no rule places is the player's free choice and
     gets none. */
  var CZ = clanzCommand(L, members);
  var aboard = placeCommanders(L, members, CZ ? CZ.of : null);
  F.CZ = CZ; F.aboard = aboard;
  var SQ = checkSquadrons(F);
  F.sqTags = SQ.sqTags; F.sqOf = SQ.sqOf;
  checkBorrowedShips(F);
  checkListSpecials(F);
  var wsum = checkOrkClanz(F);
  checkHulkPowerfields(F);
  aboard.forEach(function(a){
    if(!a.ruled) return;
    var cm = members[a.unit], sm = a.ship != null ? members[a.ship] : null;
    out.push({ ok: a.ok, t: "Aboard: " + cm.en.l,
      v: sm ? sm.en.l : "no ship he may board",
      s: a.cite ? citeText(a.cite) : "" });
  });
  return { list: L.nm, limit: lim, units: members.map(function(m){ return m.R; }),
           totals: { points: tot, maxPoints: totMax,
                     hulls: members.reduce(function(a, m){ return a + m.hulls; }, 0) },
           checks: out, facts: fleetFacts(L, members), aboard: aboard,
           /* Clanz (J216): the Warlord of each unit (unit index -> Warlord's
              unit index, -1 = none) */
           command: CZ ? CZ.of : null,
           /* Clanz (J226): per Warlord {unit, n, rr, tiddla, total, hulk,
              uge, kro, lone, clans, gub, gubOff, ship, units} */
           warlords: wsum };
}
