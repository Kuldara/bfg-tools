import { defenceOwnPoints } from "./crits.js";
import { roleOfIntent } from "./lending.js";
import { upCost } from "./pricing.js";
import { resolveUnit } from "./unit.js";
import { HOST_OFF, isUpgradeEnt, optState, selectionOf, upState, upgradeTakenAnyWay, upgradesFor } from "./upgrades.js";
import { secNameIssues } from "./validation.js";

/* ========================= item 8: resolveFleet =========================
   fleetIntent = { list: <list name>, limit, units: [CanonicalUnitIntent] }
   -> { list, limit, units: [ResolvedUnit], totals: { points, maxPoints, hulls },
        checks: [{ ok, t, v, s, warn? }] }
   The legality checks of the app, pure: every count comes from the resolved
   members, every rule from the catalogue's list. Rule kinds:
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
/* An alien vessel for the Mechanicus reserve rules ("alien vessels of any
   type", "Xenos vessels", Fleets pp. 121-122, J213): a hull whose profile is
   not of the human fleets, or a Rogue Trader xenos vessel. Defences and
   Chaos hulls are not alien. */
export var HUMAN_FL = /^(IMPERIAL NAVY|SPACE MARINES|ADEPTUS MECHANICUS|INQUISITION|ROGUE TRADERS|CHAOS|HIGH ORBIT|LOW ORBIT|ADDITIONAL)/i;
export function isXenosMember(m){
  var sh = m && m.sel && m.sel.sh;
  if(!sh || !m.unitRow) return false;
  if(/xenos/i.test(String((m.en && m.en.l) || ""))) return true;
  return !HUMAN_FL.test(String(sh.fl || ""));
}

/* ---- Fleet facts (J214) ----
   What the builder can work out about the fleet for the player, rather
   than check: its attack rating, what the enemy gets for free, and what a
   ship is worth in victory points when that is not its cost. The book's
   rules are data (L.ar, L.opp, L.vp; build_data.py J214). */

/* What a ship is worth in victory points when that is not its cost:
   "Though their point cost remains unchanged, Strongholds are worth 400
   points, Bastions are worth 300 points and Citadels are worth 200 points
   when determining Victory Points" (Fleets p. 486) - Demiurg vessels used
   with the War Host list. null = its points. */
export function victoryWorth(sh, en, host){
  var V = host && host.vp;
  if(!V || !sh || !en || !new RegExp(V.fl, "i").test(String(sh.fl || ""))) return null;
  var row = V.rows.filter(function(r){ return new RegExp(r.re, "i").test(String(en.l)); })[0];
  return row ? { points: row.v, name: row.nm, page: V.cite[0].pg, text: V.cite[0].s } : null;
}
/* Where a ship comes from, for "any Imperial Navy, Mechanicus or Rogue
   Trader vessels at all" (Fleets p. 101) and "any Craftworld Eldar vessels"
   (p. 302): a borrowed ship its own list's race and name, a ship from the
   fleet's own access section (ROGUE TRADERS, THE INQUISITION) that heading,
   any other the fleet list's race and name. */
export function originTags(m, L){
  var src = m.sel && m.sel.list;
  if(src && src !== L) return [String(src.race || ""), String(src.nm || "")];
  var sec = L.secs[m.si];
  if(sec && sec.ct === "access") return [String(sec.t || "")];
  return [String(L.race || ""), String(L.nm || "")];
}
export function citeText(c){ return c.s + " (" + (c.rb ? "Rulebook" : "Fleets") + " p. " + c.pg + ")"; }
export function fleetFacts(L, members){
  var out = [];
  if(!L) return out;
  var labs = members.filter(function(m){ return m.en; }).map(function(m){ return String(m.en.l); });
  var has = function(re){ var x = new RegExp(re, "i"); return labs.some(function(l){ return x.test(l); }); };
  var ships = members.filter(function(m){ return m.unitRow && m.hulls > 0 && !m.defence && m.R && m.R.kind === "ship"; });
  var from = function(res){ return ships.some(function(m){ return originTags(m, L).some(function(t){
    return res.some(function(re){ return new RegExp(re, "i").test(t); }); }); }); };
  var holds = function(w){
    return (w.all || []).every(has) && !(w.none || []).some(has) && (!w.frm || from(w.frm)); };
  /* Attack rating: a rule whose condition holds replaces the list's plain
     figure. Two that hold and disagree are both shown - the book does not
     say which wins (a fortress-monastery's 1, p. 99, beside an Inquisitor
     Lord's 3, p. 139; T53). */
  var AR = L.ar;
  if(AR){
    var rules = AR.rules || [];
    var hit = rules.filter(function(r){ return r.when && holds(r.when); });
    var use = hit.length ? hit : rules.filter(function(r){ return !r.when; });
    if(!use.length){
      out.push({ k: "attack", t: "Attack rating", v: "not given", warn: true,
        s: "This fleet list gives no attack rating of its own. " + (AR.none || []).map(citeText).join(" ")
           + " Agree one with your opponent." });
    }else{
      var vals = [], cites = [];
      use.forEach(function(r){
        if(vals.indexOf(r.v) < 0) vals.push(r.v);
        r.cite.forEach(function(c){ var t = citeText(c); if(cites.indexOf(t) < 0) cites.push(t); });
      });
      vals.sort(function(a, b){ return a - b; });
      out.push({ k: "attack", t: "Attack rating", v: vals.join(" or "), warn: vals.length > 1,
        s: cites.join(" ") + (vals.length > 1
          ? " The book gives both and does not say which applies: agree one with your opponent." : "") });
    }
  }
  /* What the enemy fleet adds for free: one per Ordo Malleus Inquisitor
     Lord and Grey Knights Strike Cruiser (Fleets p. 145), one for an Ordo
     Malleus Inquisitor (p. 142), D6x50 points of escorts for an Ordo Xenos
     Inquisitor (p. 141). */
  (L.opp || []).forEach(function(o){
    var n = members.filter(function(m){
      return m.en && o.pick.some(function(re){ return new RegExp(re, "i").test(String(m.en.l)); }); })
      .reduce(function(a, m){ return a + (m.hulls || 1); }, 0);
    if(!n) return;
    out.push({ k: "opponent", t: "Enemy gets for free",
      v: o.fixed || (n + " " + (n === 1 ? o.what : o.many)), s: o.cite.map(citeText).join(" ") });
  });
  if(L.vp){
    var got = {};
    members.forEach(function(m){
      var w = m.unitRow ? victoryWorth(m.sel && m.sel.sh, m.en, L) : null;
      if(w) got[w.name] = (got[w.name] || 0) + (m.hulls || 1);
    });
    var parts = L.vp.rows.filter(function(r){ return got[r.nm]; }).map(function(r){
      return r.nm + " " + r.v + (got[r.nm] > 1 ? " (\u00d7" + got[r.nm] + ")" : ""); });
    if(parts.length)
      out.push({ k: "vp", t: "Victory points", v: parts.join(" \u00b7 "), s: L.vp.cite.map(citeText).join(" ") });
  }
  return out;
}

/* ---- Squadrons (J216) ----
   Capital ships with the same intent.sq are one squadron. Fleets p. 13:
   cruisers of every kind two to four and mixed, grand cruisers and
   battleships two to three and never together. A list's own squadron
   (L.sqx: Clanz big ship skwadron 1-2 and Rok skwadron 1-4 (J232), Waaagh
   Roks up to four and only Roks) replaces it. */
export var SQ_CR = { min: 2, max: 4, cite: { s: "Cruisers, heavy cruisers and battlecruisers may be formed into squadrons of "
  + "two to four ships. Battlecruisers, heavy cruisers and cruisers may be mixed together in the same squadron.", pg: 13 } };
export var SQ_BIG = { min: 2, max: 3, cite: { s: "Grand cruisers and battleships may be formed into squadrons of two to three "
  + "ships, but you may not mix battleships and grand cruisers in a squadron.", pg: 13 } };
export function sqClass(m){
  var t = String((m.R && m.R.stats && m.R.stats.type) || "").toLowerCase();
  return /grand cruiser/.test(t) ? "grand cruiser" : /battleship/.test(t) ? "battleship" : /cruiser/.test(t) ? "cruiser" : t || "ship";
}

/* ---- Who is aboard which ship (J215) ----
   A commander is aboard one ship of the fleet. Most lists say which: a
   Master of the Fleet on a battle barge (Fleets pp. 97-100), an Inquisitor
   on the Inquisitorial Cruiser, else the Blackship (p. 138), a Chaos
   Warmaster on the most expensive ship but never a Daemonship (pp. 232-249),
   a Chaos Lord on any capital ship but the Warmaster's or Abaddon's (pp. 222,
   231, 234). The rules are data (L.place, build_data.py J215); the player's
   own choice is intent.aboard, the uid of the ship. Placement never changes
   a ship's profile (J8): it is a fact for the cards and a check for the
   fleet. */
/* "Demiurg ships can never carry fleet commanders, use fleet commander
   re-rolls or be placed in squadrons with non-Demiurg vessels." (Fleets
   p. 483, J217) */
export var DEMIURG_CMD = { s: "Demiurg ships can never carry fleet commanders, use fleet commander re-rolls or be "
  + "placed in squadrons with non-Demiurg vessels.", pg: 483 };
export function isDemiurg(m){ return /^DEMIURG$/i.test(String((m && m.sel && m.sel.sh && m.sel.sh.fl) || "")); }
export function carriesCommander(m){
  if(!m.unitRow || !(m.hulls > 0) || !m.R || m.R.kind !== "ship") return false;
  if(isDemiurg(m)) return false;
  if(!m.defence) return true;
  var sh = m.sel && m.sel.sh;
  /* a star fort (Fleets p. 503), a Ramilies or a Haven bought from the
     fleet's points (pp. 500, 336) - never a platform or a station */
  return !!(sh && (sh.qd || defenceOwnPoints(sh)));
}
export function placeRe(re, m){
  var x = new RegExp(re, "i");
  return x.test(String((m.en && m.en.l) || "")) || x.test(String((m.sel && m.sel.sh && m.sel.sh.nm) || ""));
}
export function placeArm(m, arm){
  var x = new RegExp(arm, "i");
  return ((m.R && m.R.weapons) || []).some(function(w){
    return w.state === "active" && x.test(String((w.a && w.a[0]) || "")); });
}
export function placeTaken(m, re){
  var x = new RegExp(re, "i");
  return ((m.R && m.R.upgrades) || []).some(function(u){ return u.state === "take" && x.test(String(u.label)); }) ||
         ((m.R && m.R.options) || []).some(function(o){ return o.state === "take" && x.test(String(o.text)); });
}
/* Da Ork Clanz (J216): every skwadron belongs to one Warlord (Fleets
   p. 372). intent.cmd names him (his uid); without it the ship is the
   nearest Warlord's above it in the fleet, else the first one's. Returns
   { warlords: [member], of: [member index -> warlord member index or -1] }. */
export function clanzCommand(L, members){
  var C = L && L.clanz;
  if(!C) return null;
  var wRe = new RegExp(C.warlord, "i");
  var unitRe = [C.tiddla, C.big, C.uge, C.hulk, C.rok].map(function(x){ return new RegExp(x, "i"); });
  var ws = members.filter(function(m){ return m.en && m.en.k === "cmd" && wRe.test(String(m.en.l)); });
  var of = members.map(function(){ return -1; });
  if(!ws.length) return { warlords: ws, of: of };
  var byUid = {};
  ws.forEach(function(w){ if(w.intent && w.intent.uid) byUid[w.intent.uid] = w; });
  var last = null;
  members.forEach(function(m, i){
    if(ws.indexOf(m) >= 0){ last = m; return; }
    var sec = m.own && L.secs[m.si];
    if(!sec || !m.R || m.R.kind !== "ship" || !unitRe.some(function(x){ return x.test(String(sec.t).trim()); })) return;
    var w = (m.intent && m.intent.cmd && byUid[m.intent.cmd]) || last || ws[0];
    of[i] = members.indexOf(w);
  });
  return { warlords: ws, of: of };
}
export function placeCommanders(L, members, cmdOf){
  var P = (L && L.place) || [];
  var ships = members.filter(carriesCommander);
  var cost = function(m){ return m.points / Math.max(1, m.hulls); };
  var byUid = {};
  members.forEach(function(m){ if(m.intent && m.intent.uid) byUid[m.intent.uid] = m; });
  /* a borrowed commander keeps his own list's placement rule (Yriel's
     Dragonship, Fleets p. 319, aboard an Exploration fleet - J221) */
  var ruleOf = function(m){
    var PL = !m.own && m.sel && m.sel.list && m.sel.list.place ? m.sel.list.place : P;
    return PL.filter(function(r){ return new RegExp(r.cmd, "i").test(String(m.en.l)); })[0] || null; };
  var todo = members.filter(function(m){ return m.en && m.en.k === "cmd" && m.R && m.R.kind === "commander"; })
    .map(function(m){ return { m: m, r: ruleOf(m) }; })
    .filter(function(x){ return !(x.r && x.r.skip); });
  /* who goes first: a commander another one must keep away from (the
     Warmaster, Abaddon) is placed before the ones that keep away */
  var late = function(x){ return x.r && x.r.not_with ? 1 : 0; };
  todo = todo.filter(function(x){ return !late(x); }).concat(todo.filter(late));
  var placed = [], out = [];
  /* a ship before a star fort or a Haven, then the dearest: "the most
     expensive vessel present" is a ship of the fleet, not a station bought
     beside it (the same reading as the Slaverer's, above) */
  var desc = function(a, b){
    return (a.defence ? 1 : 0) - (b.defence ? 1 : 0) || cost(b) - cost(a) || members.indexOf(a) - members.indexOf(b); };
  todo.forEach(function(x){
    var m = x.m, r = x.r || {}, drop = [];
    var base = ships.slice();
    var cut = function(keep, cite){
      base = base.filter(function(sm){ var k = keep(sm); if(!k) drop.push({ m: sm, cite: cite }); return k; }); };
    if(r.only) cut(function(sm){
      return (!r.only.any || r.only.any.some(function(o){ return placeRe(o.re, sm) && (!o.arm || placeArm(sm, o.arm)); })) &&
             (!r.only.capital || !sm.escort) && (!r.only.mech || !!(sm.R && sm.R.mechanicus)); }, r.only.cite);
    (r.no_up || []).forEach(function(nu){ cut(function(sm){ return !placeTaken(sm, nu.re); }, nu.cite); });
    (r.not_with || []).forEach(function(nw){
      var re = new RegExp(nw.cmd, "i");
      var theirs = placed.filter(function(p){ return p.ship && re.test(String(p.m.en.l)); })
        .map(function(p){ return p.ship; });
      cut(function(sm){ return theirs.indexOf(sm) < 0; }, nw.cite); });
    var allowed = base, why = null;
    (r.prefer || []).some(function(p){
      var hit = base.filter(function(sm){ return placeRe(p.re, sm); });
      if(hit.length){ allowed = hit; why = p.cite; return true; }
      return false; });
    /* own: the most expensive ship of his own command (a Clanz Warlord,
       Fleets p. 372), not of the whole fleet */
    if(r.dearest && r.dearest.own && cmdOf){
      var mi = members.indexOf(m);
      cut(function(sm){ return cmdOf[members.indexOf(sm)] === mi; }, r.dearest.cite);
    }
    if(!why && r.dearest && base.length){
      var k = r.dearest.n ? todo.filter(function(y){ return y.r === x.r; }).length : 1;
      var pool = base.filter(function(sm){ return !sm.defence; });
      if(!pool.length) pool = base;
      var top = pool.slice().sort(desc).map(cost)[Math.min(k, pool.length) - 1];
      allowed = pool.filter(function(sm){ return cost(sm) >= top; });
      why = r.dearest.cite;
    }
    if(allowed !== base) base.forEach(function(sm){
      if(allowed.indexOf(sm) < 0) drop.push({ m: sm, cite: why }); });
    var allowedOf = function(){ return allowed.map(function(sm){ return members.indexOf(sm); }); };
    if(r.alone){
      var mine = placed.filter(function(p){ return p.ship && p.r === x.r; }).map(function(p){ return p.ship; });
      allowed = allowed.filter(function(sm){
        if(mine.indexOf(sm) < 0) return true;
        drop.push({ m: sm, cite: r.alone.cite }); return false; });
    }
    var pick = m.intent && m.intent.aboard ? byUid[m.intent.aboard] : null;
    /* a Demiurg ship picked for him: said, not ignored (Fleets p. 483) */
    if(pick && isDemiurg(pick)){
      placed.push({ m: m, r: x.r, ship: pick });
      out.push({ unit: members.indexOf(m), ship: members.indexOf(pick),
        choices: allowedOf(), chosen: true, ok: false, ruled: true, cite: DEMIURG_CMD });
      return;
    }
    if(pick && ships.indexOf(pick) < 0) pick = null;
    var ok = !pick || allowed.indexOf(pick) >= 0;
    var ship = pick || allowed.slice().sort(desc)[0] || null;
    var bad = pick && !ok ? drop.filter(function(d){ return d.m === pick; })[0] : null;
    var ruled = !!(r.prefer || r.dearest || r.only || r.no_up || r.not_with || r.alone);
    placed.push({ m: m, r: x.r, ship: ship });
    out.push({ unit: members.indexOf(m), ship: ship ? members.indexOf(ship) : null,
               choices: allowed.map(function(sm){ return members.indexOf(sm); }),
               chosen: !!pick, ok: ok && (!!ship || !ruled), ruled: ruled,
               cite: bad ? bad.cite : (why || (r.only && r.only.cite) || (r.alone && r.alone.cite) ||
                     (r.not_with && r.not_with[0].cite) || (r.no_up && r.no_up[0].cite) || null) });
  });
  return out;
}

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
  var count = function(pick, secs, units){
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
    if(r.kind === "section_count"){
      /* pick: the heading's count reaches rows outside its own section -
         Chaos renegade Imperial hulls "count as Chaos vessels in all
         respects" (Fleets p. 222), so they fill the list's own cruiser and
         escort headings even though the book prints them apart. */
      var c = r.pick ? count(r.pick, null) : secShips(si);
      out.push({ ok: c <= r.max && (c === 0 || c >= r.min), t: lab, v: c + " / " + r.max, s: r.src });
    }
    if(r.kind === "cap"){
      var cc = r.pick ? count(r.pick, null) : (r.sec || [si]).reduce(function(a, i){ return a + secShips(i); }, 0);
      out.push({ ok: cc <= r.max, t: lab, v: cc + " / " + r.max, s: r.src });
    }
    /* when_pick: the ratio only applies while that row is present - "If no
       hive ships are chosen, only Kraken and Vanguard drone ships may be
       included in the fleet" (Tyranids p. 431). */
    if(r.kind === "ratio" && !(r.when_pick && count(r.when_pick, null) < 1)){
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
    if(r.kind === "per_points"){
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
    if(r.kind === "mandatory_at"){
      var cm = r.pick ? count(r.pick, null) : (r.sec || [si]).reduce(function(a, i){ return a + secUnits(i); }, 0);
      /* "If the fleet is worth over 750 points" is the fleet's own points, not
         the game's limit: a 700-point list still being built for a 1000-point
         game does not need its commander yet (user decision T24, 11.9.2026). */
      var need = r.over ? worth > r.points : worth >= r.points;
      out.push({ ok: !need || cm >= 1,
        t: lab + (r.points ? " (" + (r.over ? "over " : "from ") + r.points + " pts)" : " required"),
        v: need ? (cm >= 1 ? "included" : "missing") : "not required", s: r.src, warn: !need });
    }
    if(r.kind === "squadron"){
      var insec = r.sec || [si];
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
         split_fl: Armageddon p. 43 "Space Marine vessels may not be
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
      var poolKey = function(m){ return r.split_fl ? String((m.sel.sh && m.sel.sh.fl) || "") : ""; };
      var pools = {};
      inRule.forEach(function(m){ var k = poolKey(m); (pools[k] = pools[k] || []).push(m); });
      var partners = r.with_pick ? members.filter(function(m){
        return inRule.indexOf(m) < 0 && r.with_pick.some(function(p){ return pickHas(m, p); });
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
    if(r.kind === "allowed_at"){
      var ca = count(r.pick, null);
      /* "A fleet of 1,000 points or more": the fleet's points, as above (T24). */
      var basis = r.basis === "remainder" ? worth - pointsOfPick(r.pick, null) : worth;
      var okPts = r.over ? basis > r.points : basis >= r.points;
      var okCond = condMet(r);
      out.push({ ok: ca === 0 || (okPts && okCond), t: lab,
        v: ca === 0 ? "none" : (okPts && okCond ? "allowed" : "not allowed"),
        s: r.src, warn: ca === 0 });
    }
    if(r.kind === "conditional_cap"){
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
    if(r.kind === "requires"){
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
    if(r.kind === "min_ratio"){
      /* units: squadrons rather than hulls - "At least one squadron of 3-6
         escort vessels must be included for each cruiser" (Fleets p. 179). */
      var b2 = count(r.per_pick, null), h2 = count(r.allow_pick, null, !!r.units), needN = b2 * r.min;
      out.push({ ok: b2 === 0 || h2 >= needN, t: lab, v: h2 + " / " + needN + " min", s: r.src });
    }
    if(r.kind === "compare"){
      /* a_units/b_units count squadrons, b_add a fixed extra: Commerce
         Protection "one Rogue Trader cruiser and its attendant escorts ...
         Additionally, a single squadron of up to six Xenos escorts" (p. 457). */
      var a3 = count(r.a_pick, null, !!r.a_units) * (r.a_mult || 1),
          b3 = count(r.b_pick, null, !!r.b_units) + (r.b_add || 0);
      var okc = r.op === "<=" ? a3 <= b3 : r.op === "<" ? a3 < b3 : r.op === ">=" ? a3 >= b3
              : r.op === ">" ? (b3 === 0 || a3 > b3) : a3 === b3;
      out.push({ ok: okc, t: lab, v: a3 + " " + r.op + " " + b3, s: r.src });
    }
    if(r.kind === "points_share"){
      var share = r.up_sec != null ? upShare(r.up_sec) : pointsOfPick(r.pick, null);
      var baseP = r.of === "limit" ? lim : r.of === "pick" ? pointsOfPick(r.of_pick, null) : worth;
      var allow = r.pct != null ? baseP * r.pct / 100 : baseP * (r.frac || 1);
      if(!condMet(r)) allow = 0;
      out.push({ ok: share <= allow + 1e-9, t: lab, v: share + " / " + Math.floor(allow) + " pts", s: r.src });
    }
    if(r.kind === "tiers"){
      /* "up to one Warsphere if the fleet is worth 1500 points" (Tau p. 457):
         the fleet's own points, as with per_points (T26). */
      var ct = count(r.pick, null), capT = 0, tierBase = r.basis === "limit" ? lim : worth;
      (r.tiers || []).forEach(function(t){ if(tierBase >= t[0]) capT = t[1]; });
      out.push({ ok: ct <= capT, t: lab, v: ct + " / " + capT, s: r.src });
    }
    if(r.kind === "upgrade_ratio"){
      var rows = upRows(r.up_sec, r.up_re ? new RegExp(r.up_re, "i") : null);
      var nU = members.filter(function(m){ return rows.some(function(x){ return tookUp(m, x[0], x[1]); }); }).length;
      var bU = count(r.per_pick, null);
      var aU = Math.floor(bU / r.per) * r.allow;
      if(r.min_one && bU >= 1) aU = Math.max(1, aU);
      out.push({ ok: nU <= aU, t: lab, v: nU + " / " + aU, s: r.src });
    }
    if(r.kind === "option_ratio"){
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
    /* up_budget: rows of an upgrade section limited by a budget of units and
       taken upgrades - Clanz "A vessel or escort skwadron led by a Warlord
       may be given up to one of the following upgrades per Command re-roll
       the Warlord has" (p. 370): each Warlord has one re-roll and may buy
       more. The ship-to-Warlord binding is not modelled, the sum is. */
    /* notice: a book rule the app does not check yet (v1.1: gravitic hook
       capacity, cross-list reserves) is shown as a warning, not left silent. */
    if(r.kind === "notice") out.push({ ok: true, warn: true, t: lab, v: "not checked by the app", s: r.src });
    /* one_donor: the borrowed ships of these roles come from one list only -
       "they can only be from one fleet" (Fleets p. 177, J213). */
    if(r.kind === "one_donor"){
      var donors = {};
      members.forEach(function(m){
        if((r.roles || []).indexOf(m.role) >= 0 && m.sel && m.sel.list && m.sel.list !== L) donors[m.sel.list.nm] = 1; });
      var nd = Object.keys(donors).length;
      if(nd) out.push({ ok: nd <= 1, t: lab, v: nd + " / 1" + (nd > 1 ? ": " + Object.keys(donors).join(", ") : ""), s: r.src });
    }
    /* agreement: rows the book allows only by the opponent's consent - the
       outdated Siluria and Havoc (Fleets p. 174), Tyranid bio-enhancements in
       a one-off game (p. 426). Said in yellow while one is in the fleet. */
    if(r.kind === "agreement"){
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
    if(r.kind === "hook_capacity"){
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
    if(r.kind === "up_budget"){
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
    if(r.kind === "unit_upgrade_max"){
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
  }); });

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
  /* The Warmaster's Mark, and who has already paid for it.

     Two book sentences meet here. The list says the Mark is compulsory - "The
     Warmaster must take the Mark of Nurgle" - and the god's own battle barge
     says it is already bought: "This ship bears the Mark of Nurgle as part of
     its point cost; it does not have to be paid for separately by the ship's
     commander" (pp. 258, 260, 262, 264). Which one applies depends on whether
     the Warmaster is aboard that barge, and the book answers that too, in the
     barge's own rule - so nothing here is inferred:

       Terminus Est / Scion of Prospero / Wage of Sin: flagship with the
       Warmaster aboard UNLESS the Planet Killer is also present (505 points,
       dearer than any of the three barges), in which case a Chaos Lord leads
       it and the Warmaster is elsewhere - and pays.

       Slaverer is the exception: it is the flagship only "unless it is the
       most expensive vessel present", and otherwise "a Chaos Lord must lead
       it".

     This is a rule about whether the row should be TICKED, not about what it
     costs. The price still follows the tick, and resolveUnit stays unit-scoped
     - which is why the cards still render one ship at a time. */
  if(L.mark_paid){
    var MP = L.mark_paid;
    var markRe = new RegExp("^the mark of " + MP.god, "i");
    var wm = members.filter(function(m){
      return m.en && m.en.k === "cmd" && /warmaster/i.test(String(m.en.l || "")); });
    if(wm.length){
      var shipRe = new RegExp(MP.ship, "i");
      var aboard = members.filter(function(m){
        return m.unitRow && m.en && shipRe.test(String(m.en.l || "")); });
      var paid = false;
      if(aboard.length){
        if(MP.dearest){
          /* "unless it is the most expensive vessel present" - strictly
             dearest, so a tie leaves the Slaverer off the flagship's seat. */
          /* "the most expensive vessel present": a ship of the fleet, not
             a station bought beside it - a 400-point Blackstone Fortress
             used to take the seat from a 380-point Slaverer. */
          var top = members.reduce(function(a2, m){
            return m.unitRow && !m.defence && m.points > a2 ? m.points : a2; }, -1);
          paid = aboard.some(function(m){ return m.points >= top; }) &&
                 members.filter(function(m){
                   return m.unitRow && !m.defence && m.points === top; }).length === 1;
        } else {
          var pkRe = new RegExp(MP.unless, "i");
          paid = !members.some(function(m){
            return m.unitRow && m.en && pkRe.test(String(m.en.l || "")); });
        }
      }
      wm.forEach(function(m){
        var ups;
        try { ups = upgradesFor(m.sel); } catch(e){ return; }
        /* upgradesFor yields [si, ei, en] triples, and the state is read
           separately - the same shape upShare uses. */
        var row = ups.own.concat(ups.other).filter(function(x){
          return x[2] && markRe.test(String(x[2].l || "")); })[0];
        if(!row) return;
        var upSt = upState(m.sel, row[0], row[1]), took = upSt === "take";
        if(paid && took)
          out.push({ ok: false, t: "Mark of " + MP.god + " paid twice",
            v: "already in the ship's cost", s: MP.src_ship });
        /* Left on Option, the row prints as an open box on the Warmaster's
           card - an offer of something the ship already has (J168 a). The
           card is drawn one unit at a time, so the fleet says it. */
        else if(paid && upSt === "opt")
          out.push({ ok: true, warn: true, t: "Mark of " + MP.god + " is in the ship's cost",
            v: "set the Warmaster's Mark row to Hide", s: MP.src_ship });
        else if(!paid && !took)
          out.push({ ok: false, t: "Warmaster without the Mark of " + MP.god,
            v: "the list requires it",
            s: "The Warmaster must take the Mark of " + MP.god + "." });
      });
    }
  }
  /* A unit whose choices contradict the book (P1-8e issues) is not legal. */
  members.forEach(function(m){
    var errs = ((m.R && m.R.issues) || []).filter(function(x){ return x.severity === "error"; });
    if(errs.length)
      out.push({ ok: false, t: "Unit issues: " + m.R.className.toLowerCase().replace(/(^|[\s(\-\u2013/])([a-z])/g, function(a, b, c){ return b + c.toUpperCase(); }),
        v: errs.length + " problem" + (errs.length > 1 ? "s" : ""), s: errs.map(function(x){ return x.message; }).join("; ") });
  });

  /* ---- A commander whose price depends on his ship (Fleets p. 319) -----
     "He must be embarked aboard the Flame of Asuryan if it is present, in
     which case his cost is 125 points." The -25 is a row the player ticks;
     the fleet can see whether the tick and the ship agree. Unticked beside
     the Flame the fleet is legal but 25 points dear (a note); ticked without
     the Flame it is 25 points short (red). */
  if(L.aboard){
    var AB = L.aboard;
    var abCmd = members.filter(function(m){
      return m.own && m.en && m.en.k === "cmd" && new RegExp(AB.cmd_re, "i").test(String(m.en.l)); })[0];
    if(abCmd){
      var abShip = members.some(function(m){
        return m.unitRow && m.en && new RegExp(AB.ship_re, "i").test(String(m.en.l)); });
      var abTook = ((abCmd.R && abCmd.R.upgrades) || []).some(function(u){
        return u.state === "take" && new RegExp(AB.up_re, "i").test(String(u.label)); });
      if(abShip || abTook)
        out.push({ ok: abShip || !abTook, warn: abShip && !abTook, t: abCmd.en.l + " aboard the Flame of Asuryan",
          v: !abShip ? "the Flame of Asuryan is not in the fleet" : abTook ? "125 pts" : "125 pts if the row is ticked",
          s: AB.src + " (Fleets p. " + AB.pg + ")" });
    }
  }

  /* ---- Planetary defences (Fleets pp. 498-500, Rulebook p. 100) --------
     Rows appear only when the fleet has a defence, so every other fleet
     reads exactly as before. They advise and never fail: how much may be
     spent depends on the scenario, which the app does not know. */
  var defs = members.filter(function(m){ return m.defence; });
  if(defs.length){
    /* The Ramilies is "bought from the fleet's points, rather than defences"
       (p. 500) and a Haven's "value counts against the fleet list" (p. 337):
       neither is paid from the one-third allowance. */
    var budget = defs.reduce(function(a, m){
      return a + (defenceOwnPoints(m.sel.sh) ? 0 : m.points); }, 0);
    var third = Math.floor(lim / 3);
    if(budget > 0 || defs.some(function(m){ return !defenceOwnPoints(m.sel.sh); }))
      out.push({ ok: true, warn: budget > third, t: "Planetary defences (up to one third of the points)",
        v: budget + " / " + third + " pts",
        s: "When desired, the defender in a scenario may spend up to one-third of his allocated "
         + "point value on planetary defences, in addition to any planetary defences provided by "
         + "the specific scenario. (Rulebook p. 100)" });
    /* need1: a profile that is priced by one choice out of a group
       (Waystation, Fleets p. 481). The group's own rule caps it at one;
       this is the other half - none chosen is not a unit you can buy. */
    defs.forEach(function(m){
      var n1 = m.sel.sh && m.sel.sh.need1;
      if(!n1) return;
      var took = ((m.R && m.R.options) || []).filter(function(o){ return o.group === n1.grp && o.state === "take"; }).length;
      if(took === 0)
        out.push({ ok: false, t: m.en.l + " (choose one " + n1.what + ")", v: "none chosen",
                   s: n1.src + " (Fleets p. " + n1.pg + ")" });
    });
    if(defs.some(function(m){ return m.sel.sh && m.sel.sh.qd; }))
      out.push({ ok: true, warn: true, t: "Ramilies class star fort", v: "by prior agreement",
        s: "Bought from the fleet's points, rather than defences, and in competitive play only "
         + "by prior agreement with the opponent. (Fleets p. 500)" });
  }

  /* ---- A weapon the ship must be armed with (J213) --------------------
     "A Kraken must be armed with one weapon chosen from the following list"
     (Fleets p. 429), and a hive ship or Tyranid cruiser takes "One prow
     weapon" and "One thorax weapon" (p. 430). The option group already
     allows at most one; need says one must be taken. */
  members.forEach(function(m){
    var nd = m.sel && m.sel.sh && m.sel.sh.need;
    if(!nd || !m.unitRow) return;
    nd.forEach(function(n){
      var took = ((m.R && m.R.options) || []).filter(function(o){ return o.group === n.grp && o.state === "take"; }).length;
      if(!took) out.push({ ok: false, t: (m.en ? m.en.l : "?") + ": choose " + n.what, v: "none chosen",
                           s: n.src + " (Fleets p. " + n.pg + ")" });
    });
  });
  /* ---- A share of one hull's own option (Fleets p. 437, J175) ---------
     "Instead of taking one of the above, up to 10% of the Tyranid escort
     drones in the fleet can elect to become fireships." frac on the profile
     names the option and the share; the count is of hulls, rounded down. The
     row appears only when the option is taken. */
  var fracs = {};
  members.forEach(function(m){
    var fr = m.sel && m.sel.sh && m.sel.sh.frac;
    if(!fr) return;
    var g = fracs[fr.what] = fracs[fr.what] || { fr: fr, all: 0, took: 0 };
    g.all += m.hulls;
    var rx = new RegExp(fr.opt, "i");
    if(((m.R && m.R.options) || []).some(function(o){ return o.state === "take" && rx.test(String(o.text || "")); }))
      g.took += m.hulls;
  });
  Object.keys(fracs).forEach(function(k){
    var g = fracs[k], cap = Math.floor(g.all * g.fr.pct / 100);
    if(g.took) out.push({ ok: g.took <= cap, t: g.fr.label, v: g.took + " / " + cap + " of " + g.all,
                          s: g.fr.src + " (Fleets p. " + g.fr.pg + ")" });
  });
  /* ---- Ships summoned through the Webway Portal (Fleets p. 337, J175) --
     "Any number of ships may be purchased against the fleet's total at 50%
     cost, but they count as reserves and start off the table" - a rule of
     the Eldar Haven, so a half-price ship needs a Haven in the fleet. */
  if(L.webway){
    var WW = L.webway, wwRe = new RegExp(WW.up, "i"), hvRe = new RegExp(WW.haven, "i");
    var wwN = members.filter(function(m){
      return ((m.R && m.R.upgrades) || []).some(function(u){ return u.state === "take" && wwRe.test(String(u.label)); }); }).length;
    if(wwN){
      var hv = members.some(function(m){ return m.unitRow && m.en && hvRe.test(String(m.en.l || "")); });
      out.push({ ok: hv, t: "Ships through the Webway Portal", v: hv ? wwN + " at half cost" : "no Eldar Haven in the fleet",
                 s: WW.src + " (Fleets p. " + WW.pg + ")" });
    }
  }

  /* ---- Reserves and allies (Fleets pp. 14-16) --------------------------
     "For every three battleships, cruisers or escorts chosen from the fleet
     list, you may also pick one ship of the same type from another fleet
     list belonging to the same race." (p. 14) The base counts only the
     fleet's own ships, and only of the SAME type: "you can't pick three
     escorts from a fleet list and then use these to qualify for a
     battleship from reserves" (p. 14). The type is the book's, read into
     the profile as rt (p. 14: grand cruisers count as cruisers).

     Rows appear only when the fleet actually has a borrowed ship, so a
     single-list fleet reads exactly as before. */
  var RES_TYPES = [["battleship", "battleships"], ["cruiser", "cruisers"],
                   ["escort", "escorts"]];
  var RES_SRC = "For every three battleships, cruisers or escorts chosen from "
    + "the fleet list, you may also pick one ship of the same type from another "
    + "fleet list belonging to the same race. (Fleets p. 14)";
  var ALLY_SRC = "In all cases these follow the standard rules for reserves in "
    + "that no more than one allied vessel may be taken for every three core "
    + "vessels in the fleet. (Fleets p. 16)";
  var typeOf = function(m){ return (m.sel && m.sel.sh && m.sel.sh.rt) || "none"; };
  /* res_exempt: one named reserve that a named commander frees from the
     reserve rules. Fleets p. 319, Prince Yriel: "if the Flame of Asuryan with
     Yriel is added to the parent fleet it is exempt from the reserve rules"
     - the book's own example is a Corsair list that does not field three
     capital ships. It is the Flame WITH Yriel, so a Hero-led fleet still
     needs its three cruisers, and so does a Dragonship carrying Yriel. One
     hull: the Flame is unique (p. 329). */
  var RX = L.res_exempt || null, rxShip = null;
  if(RX && members.some(function(x){
       return x.own && x.en && x.en.k === "cmd" && new RegExp(RX.needs_re, "i").test(String(x.en.l)); }))
    rxShip = members.filter(function(m){
      return m.role === "reserve" && m.unitRow && m.hulls === 1 && new RegExp(RX.re, "i").test(String(m.en.l)); })[0] || null;
  if(rxShip) out.push({ ok: true, t: "Exempt from the reserve rules: " + rxShip.en.l, v: "with Prince Yriel",
                        s: RX.src + " (Fleets p. " + RX.pg + ")" });
  /* The Flame is unique (p. 329). A borrowed row's own 0-1 is the donor
     list's business and is not counted here, so two Flames used to pass:
     one exempt with Yriel, one as an ordinary reserve. */
  if(RX && RX.unique_src){
    var rxN = members.reduce(function(a, m){
      return a + (m.unitRow && m.en && new RegExp(RX.re, "i").test(String(m.en.l)) ? m.hulls : 0); }, 0);
    if(rxN > 1) out.push({ ok: false, t: "Flame of Asuryan (unique)", v: rxN + " / 1",
                           s: RX.unique_src + " (Fleets p. " + RX.unique_pg + ")" });
  }
  /* res_mech: the Adeptus Mechanicus list's own reserve rules (Fleets pp.
     121-122, J213). Space Marine reserves have their own ratio and leave the
     per-type count; reserve escorts are free of the 1:3 when a reserve
     capital ship comes from the same list ("Escorts taken in this manner
     must be taken from the same fleet list reserve capital ships are being
     drawn from", read as T51), unless alien vessels and Space Marine
     reserves are in the fleet together. */
  var MECH = L.res_mech || null;
  var isSMres = function(m){
    return m.role === "reserve" && !!m.sel && !!m.sel.list && m.sel.list !== L && m.sel.list.race === "space marines"; };
  var smRes = MECH ? members.filter(isSMres) : [];
  var mechXenos = MECH ? members.some(isXenosMember) : false;
  var capLists = {};
  if(MECH) members.forEach(function(m){
    if(m.role === "reserve" && m.sel && m.sel.list && m.sel.list !== L && !isSMres(m) &&
       (typeOf(m) === "battleship" || typeOf(m) === "cruiser")) capLists[m.sel.list.nm] = 1; });
  var escFree = function(m){
    return !!MECH && !(mechXenos && smRes.length) && m.role === "reserve" && typeOf(m) === "escort" &&
      !!m.sel && !!m.sel.list && !!capLists[m.sel.list.nm]; };
  var hullsOf = function(role, ty){
    return members.reduce(function(a, m){
      if(m.role !== role || m === rxShip || typeOf(m) !== ty) return a;
      if(MECH && role === "reserve" && (isSMres(m) || escFree(m))) return a;
      return a + m.hulls; }, 0);
  };
  RES_TYPES.forEach(function(t){
    var base = Math.floor(hullsOf("core", t[0]) / 3);
    var res = hullsOf("reserve", t[0]);
    var free = t[0] !== "escort" ? 0 : members.reduce(function(a, m){ return a + (escFree(m) ? m.hulls : 0); }, 0);
    if(res || free) out.push({ ok: res <= base, t: "Reserves (" + t[1] + ")",
                       v: res + " / " + base + (free ? " (+" + free + " with their list's capital ships, no limit)" : ""),
                       s: free ? MECH.esc_src + " " + MECH.interp.note : RES_SRC });
    var ally = hullsOf("ally", t[0]);
    if(ally) out.push({ ok: ally <= base, t: "Allied vessels (" + t[1] + ")",
                        v: ally + " / " + base, s: ALLY_SRC });
  });
  if(MECH){
    var mechCap = hullsOf("core", "battleship") + hullsOf("core", "cruiser");
    var resCapN = hullsOf("reserve", "battleship") + hullsOf("reserve", "cruiser");
    if(resCapN) out.push({ ok: resCapN <= Math.floor(mechCap / 3), t: "Reserve capital ships (one per three capital ships)",
                           v: resCapN + " / " + Math.floor(mechCap / 3), s: MECH.cap_src });
    var smHulls = function(ty){ return smRes.reduce(function(a, m){ return a + (typeOf(m) === ty ? m.hulls : 0); }, 0); };
    var smCr = smHulls("cruiser"), smBs = smHulls("battleship");
    if(smCr || smBs) out.push({ ok: smCr <= Math.floor(mechCap / 3),
      t: "Space Marine strike cruisers (one per three Mechanicus capital ships)",
      v: smCr + " / " + Math.floor(mechCap / 3), s: MECH.sm_src });
    if(smBs) out.push({ ok: smBs <= Math.floor(smCr / 3),
      t: "Space Marine battle barges (one per three strike cruisers)",
      v: smBs + " / " + Math.floor(smCr / 3), s: MECH.sm_src });
  }
  /* A borrowed hull that is not one of the three types cannot be taken this
     way at all: the sentence names battleships, cruisers and escorts. */
  /* J221: an ally's special character, where the fleet list allows one
     (Exploration, Fleets p. 177) - counted below, not refused here */
  var allySpecial = function(m){
    return !!(L.ally_cmd && m.role === "ally" && m.en && m.en.k === "cmd" &&
              new RegExp(L.ally_cmd.re, "i").test(String(m.en.l))); };
  members.filter(function(m){ return m.role !== "core" && typeOf(m) === "none" && !allySpecial(m); })
    .forEach(function(m){
      out.push({ ok: false, t: "Not a reserve type: " + (m.en ? m.en.l : "?"),
        v: "battleship, cruiser or escort", s: "Only ships of the same 'type' "
          + "(battleship, cruiser or escort) count for reserves purposes. "
          + "(Fleets p. 14)" });
    });
  /* "Reserves can only ever be ships belonging to the same 'race', chosen
     from a fleet list of the same 'race'." (p. 15) A list the book's race
     list does not name has no race at all, and cannot be a reserve: its
     ships come in through that list's own rule instead (p. 15). Allies are
     cross-race by definition, so this gate is for reserves only. */
  /* One row per thing said, not per hull. Several of the rows below are
     about a PAIR OF LISTS ("Never allies: imperials and tyranids",
     "Reserve race: ...", res_ban both ways), so three tyranid hulls in an
     Imperial fleet printed the same sentence three times with nothing to
     tell them apart. The rows that are about one ship carry its name and
     so still appear once each. */
  var saidHere = {};
  var sayOnce = function(row){
    var k = row.t + " | " + row.v;
    if(saidHere[k]) return;
    saidHere[k] = 1;
    out.push(row);
  };
  members.filter(function(m){ return m.role === "reserve" || m.role === "ally"; })
    .forEach(function(m){
    var dl = m.sel && m.sel.list, dr = dl ? dl.race : null;
    /* res_ban: a list that swaps ships with nobody - "A Space Marine Crusade
       fleet will not take ships from or provide ships to any other fleet list
       as reserves or allies" (Fleets p. 99, and the same on p. 145 for the
       Grey Knights). Both directions, and it beats every grant: the sentence
       is the list's own and more specific than p. 139's Inquisitor licence. */
    if(dl && dl !== L && L.res_ban){
      sayOnce({ ok: false, t: "Takes no reserves or allies: " + L.nm,
        v: "not from " + dl.nm, s: L.res_ban });
      return;
    }
    if(dl && dl !== L && dl.res_ban){
      sayOnce({ ok: false, t: "Gives no reserves or allies: " + dl.nm,
        v: "not to " + L.nm, s: dl.res_ban });
      return;
    }
    /* lend_ban: the list lends, but not these rows. Armageddon marks its
       Space Marine vessels with a star and says (Fleets p. 41): "Imperial
       Navy fleets choosing reserves from this fleet list cannot choose
       Space Marine vessels from it." The row stays on its own list. */
    if(dl && dl !== L && dl.lend_ban && m.en &&
       new RegExp(dl.lend_ban.re, "i").test(String(m.en.l || ""))){
      sayOnce({ ok: false, t: "Not lent as a reserve: " + m.en.l,
        v: "stays with " + dl.nm, s: dl.lend_ban.src });
      return;
    }
    /* An ally is the OTHER-race mechanism (p. 16: "Some fleet lists have
       explicit access to ships from other races"); a ship from a list of the
       same race is a reserve (p. 14-15). Letting the player call a same-race
       ship an ally opened a SECOND 1:3 budget beside the reserve one, and
       both read green. */
    if(m.role === "ally" && dl && dl !== L && dr && L.race && dr === L.race){
      sayOnce({ ok: false, t: "Same race, so a reserve and not an ally: "
          + (m.en ? m.en.l : "?"),
        v: dl.nm + " is " + dr,
        s: "Reserves can only ever be ships belonging to the same \"race\", "
          + "chosen from a fleet list of the same \"race\". (Fleets p. 15)" });
      return;
    }
    /* An ally is a cross-list alliance, and p. 17 gates it: "no vessel can
       be allied to a fleet for which it is a natural enemy, nor can it ally
       itself to a fleet that already contains allies for which it is a
       natural enemy." The table that says who is whose natural enemy is the
       ALLIES MATRIX, named on p. 17 but NOT printed in this edition; the
       Remastered web version restores it from the 2010 FAQ. Verbatim text and
       provenance: books/faq2010-allies.txt.

       The matrix has its own classes (ally_race), not the p. 14 races: it
       keeps Rogue Traders and Demiurg/Kroot apart even though those lists
       have no race, or another race, for reserve purposes. A pairing is legal
       only when BOTH sides allow it - the source writes each rule one way
       round, so "Necrons do not ally with any fleet" is not repeated on every
       other line. */
    if(m.role === "ally" && dl && dl !== L){
      var mine = L.ally_rule || {}, theirs = dl.ally_rule || {};
      var okWith = function(rule, other){
        if(!rule) return true;
        if(rule.only) return rule.only.indexOf(other) >= 0;
        return (rule.never || []).indexOf(other) < 0;
      };
      var a1 = L.ally_race, a2 = dl.ally_race;
      /* A list that names this source itself overrides the matrix: the fleet
         list's own rule is more specific (p. 16, and the app's res_ok). */
      var named = false;
      (L.res_ok || []).forEach(function(g){
        if(g.race && dl.race !== g.race) return;
        if(g.list && dl.nm !== g.list) return;
        if(!g.race && !g.list) return;
        if(g.not_re && m.en && new RegExp(g.not_re, "i").test(String(m.en.l))) return;
        named = true;
      });
      if(!named && !(okWith(mine, a2) && okWith(theirs, a1))){
        sayOnce({ ok: false, t: "Never allies: " + a1 + " and " + a2,
          v: dl.nm + " cannot be an ally here",
          s: (mine.src || theirs.src || "Allies Matrix") });
        return;
      }
      /* "If it allies with or has as allies the Space Marines, it cannot ally
         with or take as allies ships from any other fleet list except Rogue
         Trader vessels (excluding Xenos ships)." A condition on the fleet's
         OTHER allies, not on the pair. */
      if(!named && L.ally_excl && a1 === L.ally_excl.who){
        var allies = {};
        members.forEach(function(x){
          if(x.role === "ally" && x.sel && x.sel.list && x.sel.list !== L)
            allies[x.sel.list.ally_race] = 1; });
        var trig = L.ally_excl.trigger;
        if(allies[trig] && a2 !== trig &&
           (L.ally_excl.allow || []).indexOf(a2) < 0){
          sayOnce({ ok: false, t: "With " + trig + " allies, no others: " + a2,
            v: dl.nm + " is a third ally", s: L.ally_excl.src });
          return;
        }
      }
      return;
    }
    if(m.role !== "reserve") return;
    /* The fleet's own reserve section needs no race check: the list names
       those ships itself, and a list may name another race (Bastion Fleets'
       Chaos hulls, p. 39). */
    if(dl === L) return;
    if(dl && dl !== L && dr && dr === L.race) return;
    /* res_ok: the host list names its own sources, against the general rule -
       "Contrary to the normal rules, a dominion fleet can take Imperial Navy
       vessels as normal reserves and reinforcements, including Adeptus
       Mechanicus and non-xenos Rogue Trader vessels" (Fleets p. 101). A grant
       can exclude rows (there, "non-xenos"), and then the row is named. */
    var hit = null, excluded = null, needs = null;
    (L.res_ok || []).forEach(function(g){
      if(g.race && (!dl || dl.race !== g.race)) return;
      if(g.list && (!dl || dl.nm !== g.list)) return;
      if(!g.race && !g.list) return;
      if(g.not_re && m.en && new RegExp(g.not_re, "i").test(String(m.en.l))){
        excluded = g; return; }
      /* needs_re: the grant is conditional on the fleet's own commander -
         "An Eldar Hero must lead the fleet in order to use Craftworld Eldar
         vessels as reserves" (Fleets p. 316, and the mirror on p. 319). */
      if(g.needs_re){
        var re2 = new RegExp(g.needs_re, "i");
        var led = members.some(function(x){
          return x.own && x.en && re2.test(String(x.en.l)); });
        if(!led){ needs = g; return; }
      }
      /* unless: the grant lapses while the fleet holds such ships - "Space
         Marines can also be used as reserves in a Mechanicus fleet that does
         not include regular Imperial Navy capital ships or alien vessels of
         any type" (Fleets p. 121, J213). Regular = borrowed, not the
         Mechanicus list's own Imperial hulls. */
      if((g.unless_fl || g.unless_xenos) && members.some(function(x){
          var sh3 = x.sel && x.sel.sh;
          if(!sh3 || !x.unitRow) return false;
          if(g.unless_fl && !x.own && /battleship|cruiser/.test(sh3.rt || "") &&
             new RegExp(g.unless_fl, "i").test(String(sh3.fl || ""))) return true;
          return !!g.unless_xenos && isXenosMember(x);
        })){ needs = g; return; }
      hit = g;
    });
    if(hit) return;
    if(excluded){
      sayOnce({ ok: false, t: "Not granted as a reserve: " + (m.en ? m.en.l : "?"),
        v: dl.nm + " is allowed, this row is not", s: L.res_src || "" });
      return;
    }
    if(needs){
      sayOnce({ ok: false, t: "Reserve needs " + (needs.needs_what || "a condition")
        + ": " + (m.en ? m.en.l : "?"),
        v: dl.nm + " is allowed only then", s: needs.src || L.res_src || "" });
      return;
    }
    sayOnce({ ok: false, t: "Reserve race: " + (dl ? dl.nm : "?"),
      v: (dr || "no race") + " / " + (L.race || "no race"),
      s: "Reserves can only ever be ships belonging to the same \"race\", "
        + "chosen from a fleet list of the same \"race\". (Fleets p. 15)" });
  });
  /* Fleets p. 15 twice over: "a given fleet list cannot take as reserves
     ships listed as reserves or allies to another fleet list ... In short,
     you cannot use a reserve of a reserve", and "Some fleet lists explicitly
     provide access to ships from other races. These may only be taken exactly
     as described on their fleet list rules and may not also be taken as
     reserves." Both ask the same question of the donor row: are these the
     donor list's OWN ships? The section's kind answers it. */
  members.filter(function(m){
    if(m.own || !m.unitRow || !m.sel.list) return false;
    var ds = m.sel.list.secs[m.si];
    return !!ds && (ds.ct === "reserve" || ds.ct === "access");
  }).forEach(function(m){
    var ds = m.sel.list.secs[m.si];
    out.push(ds.ct === "reserve"
      ? { ok: false, t: "Reserve of a reserve: " + (m.en ? m.en.l : "?"),
          v: ds.t + " on " + m.sel.list.nm,
          s: "However, a given fleet list cannot take as reserves ships listed "
            + "as reserves or allies to another fleet list. In short, you cannot "
            + "use a reserve of a reserve. (Fleets p. 15)" }
      : { ok: false, t: "Named access, not a reserve: " + (m.en ? m.en.l : "?"),
          v: ds.t + " on " + m.sel.list.nm,
          s: "Some fleet lists explicitly provide access to ships from other "
            + "races. These may only be taken exactly as described on their "
            + "fleet list rules and may not also be taken as reserves. "
            + "(Fleets p. 15)" });
  });
  /* "excluding Xenos ships", said three times over in the matrix. The Rogue
     Traders line is the widest of the three: "may ally with any fleet except
     Tyranids and Necrons but may not take Xenos vessels when allied with Space
     Marines." That end clause is a condition on the FLEET, not on a pair - a
     Rogue Trader fleet with a Space Marine ally may not field its OWN Xenos
     hulls either, and neither pairing is illegal by itself, so the pair check
     above cannot see it.

     Two reaches, because the three sentences say two different things. A Space
     Marine fleet may not take Xenos hulls AS ALLIES ("will only ally with
     Imperials ... and Rogue Trader vessels (excluding Xenos ships)"); that is
     about allying, so a reserve taken under the host list's own grant is not
     this rule's business - p. 101 excludes those rows itself, and saying it
     twice would put two red lines against one hull. But once a Space Marine
     ALLY is in the fleet, the Rogue Traders line reaches every hull in it, the
     fleet's own included.

     Xenos rows live only on the Rogue Traders lists and in the named-access
     blocks that reprint them (Tau Commerce Protection, Demiurg), and neither
     of those lists may ally with Space Marines at all - so this rule can only
     ever bite where the sentence points. build_data.py counts the rows so a
     renamed row cannot silently switch it off. */
  if(L.ally_xenos){
    var XN = L.ally_xenos;
    var smAlly = members.some(function(x){
      return x.role === "ally" && x.sel && x.sel.list &&
             x.sel.list.ally_race === XN.when; });
    if(smAlly || L.ally_race === XN.when){
      var xre = new RegExp(XN.re, "i");
      var saidX = {};
      members.forEach(function(m){
        var lab = m.en ? String(m.en.l) : "";
        if(!lab || !xre.test(lab) || saidX[lab]) return;
        if(!smAlly && m.role !== "ally") return;
        saidX[lab] = 1;
        out.push({ ok: false, t: "No Xenos vessels beside Space Marines: " + lab,
          v: (m.sel && m.sel.list ? m.sel.list.nm : L.nm) + " row",
          s: XN.src });
      });
    }
  }
  /* A borrowed ship whose heading has no counterpart on the host list counts
     in no quota at all. That is an undercount, not a wrong count, and the
     player is told which ship it is rather than left to guess. */
  members.filter(function(m){
    if(m.own || !m.unitRow) return false;
    var ds = m.sel.list && m.sel.list.secs[m.si];
    if(!ds || ds.ct !== "type") return false;
    /* The same question matches() asks: is there a host section with this
       heading that also holds a ship of this p. 14 category? A heading that
       matches but holds only another category (Bastion's "Battleships" holds
       grand cruisers too, Gothic's does not) is not a counterpart either. */
    return !L.secs.some(function(sec, si){
      return sec.ct === "type" && secKey(sec) === secKey(ds) && matches(m, si, null); });
  }).forEach(function(m){
    out.push({ ok: true, warn: true,
      t: "Not counted in this list's limits: " + (m.en ? m.en.l : "?"),
      v: (m.sel.list ? m.sel.list.secs[m.si].t : "?") + " has no counterpart here",
      s: "Basically, the restrictions on maximum and minimum numbers of ships "
        + "are determined for the fleet as a whole, regardless of whether they "
        + "were purchased from the list or as reserves. (Fleets p. 14)" });
  });
  /* A ship from another list is a reserve or an ally by definition - "core"
     means bought from the fleet's own list. */
  members.filter(function(m){ return m.role === "core" && !m.own; })
    .forEach(function(m){
      out.push({ ok: false, t: "Borrowed ship without a role: " + (m.en ? m.en.l : "?"),
        v: (m.sel.list ? m.sel.list.nm : "?") + " is not the fleet's list",
        s: "Any fleet chosen from one of the fleet lists may also include "
          + "reserves. (Fleets p. 14)" });
    });

  /* Aboard (J215): a commander a rule places gets a row - green with his
     ship, red when the player's choice breaks the rule or no ship is left
     for him. A commander no rule places is the player's free choice and
     gets none. */
  var CZ = clanzCommand(L, members);
  var aboard = placeCommanders(L, members, CZ ? CZ.of : null);
  /* Squadrons (J216) */
  var sqTags = [];
  members.forEach(function(m){
    var t = m.intent && m.intent.sq;
    if(t && m.R && m.R.kind === "ship" && !m.escort && sqTags.indexOf(t) < 0) sqTags.push(t); });
  sqTags.sort();
  var sqOf = {};
  sqTags.forEach(function(tag){
    var ms = members.filter(function(m){ return m.intent && m.intent.sq === tag && m.R && m.R.kind === "ship" && !m.escort; });
    sqOf[tag] = ms;
    var n = ms.reduce(function(a, m){ return a + Math.max(1, m.hulls); }, 0);
    var nTxt = n + (n === 1 ? " ship" : " ships");
    /* the list's own squadron kind: the first ship's, else any ship's (a Rok
       with a kroozer is "not only Roks", J232) */
    var inX = function(m, x){ return m.own && L.secs[m.si] && new RegExp(x.sec, "i").test(String(L.secs[m.si].t).trim()); };
    var X = (L.sqx || []).filter(function(x){ return ms.length && inX(ms[0], x); })[0] ||
      (L.sqx || []).filter(function(x){ return ms.some(function(m){ return inX(m, x); }); })[0];
    if(X){
      var outside = X.only && ms.some(function(m){
        return !(m.own && L.secs[m.si] && new RegExp(X.sec, "i").test(String(L.secs[m.si].t).trim())); });
      out.push({ ok: !outside && n >= X.min && n <= X.max, t: "Squadron " + tag,
        v: outside ? "not only " + X.name : nTxt, s: citeText(X.cite) });
      return;
    }
    var cls = [];
    ms.forEach(function(m){ var c = sqClass(m); if(cls.indexOf(c) < 0) cls.push(c); });
    var big = cls.length === 1 && (cls[0] === "battleship" || cls[0] === "grand cruiser");
    var lim = big ? SQ_BIG : SQ_CR;
    var mixed = cls.length > 1;
    out.push({ ok: !mixed && n >= lim.min && n <= lim.max, t: "Squadron " + tag,
      v: mixed ? cls.join(" + ") : nTxt,
      s: citeText(mixed && cls.some(function(c){ return c !== "cruiser"; }) ? SQ_BIG : lim) });
  });
  /* Demiurg ships never in a squadron with others (Fleets p. 483) */
  sqTags.forEach(function(tag){
    var dm = sqOf[tag].filter(isDemiurg).length;
    if(dm && dm < sqOf[tag].length)
      out.push({ ok: false, t: "Squadron " + tag + ": Demiurg ships only with Demiurg ships",
        v: dm + " Demiurg + " + (sqOf[tag].length - dm) + " other", s: citeText(DEMIURG_CMD) });
  });
  /* Demiurg mercenaries (Fleets p. 483, J217): said once, with the rule that
     they do not open battleships or grand cruisers */
  if(L.merc){
    var mercN = members.filter(function(m){
      return m.own && m.unitRow && L.secs[m.si] && new RegExp(L.merc.sec, "i").test(String(L.secs[m.si].t).trim()); })
      .reduce(function(a, m){ return a + Math.max(1, m.hulls); }, 0);
    if(mercN) out.push({ ok: true, t: "Demiurg mercenaries", v: mercN + (mercN === 1 ? " Bastion" : " Bastions"),
      s: citeText(L.merc.cite) + " " + citeText(DEMIURG_CMD) });
  }
  /* A borrowed ship the fleet list allows only on conditions (Void Stalker
     in an Iyanden fleet, Fleets p. 319, J217) */
  (L.borrow_cond || []).forEach(function(bc){
    var re = new RegExp(bc.re, "i");
    var hits = members.filter(function(m){ return m.unitRow && m.en && re.test(String(m.en.l)); });
    if(!hits.length) return;
    var needN = members.filter(function(m){
      return m.unitRow && !re.test(String(m.en && m.en.l || "")) && m.sel && m.sel.list &&
        new RegExp(bc.need.list_re, "i").test(String(m.sel.list.nm)) &&
        new RegExp(bc.need.type_re, "i").test(String((m.R && m.R.stats && m.R.stats.type) || "")); })
      .reduce(function(a, m){ return a + Math.max(1, m.hulls); }, 0);
    var tooMany = hits.length > bc.max, tooSmall = worth < bc.min_worth;
    out.push({ ok: !tooMany && !tooSmall && needN >= bc.need.n, t: bc.label,
      v: needN + " / " + bc.need.n + " " + bc.need.what + (tooSmall ? ", fleet under " + bc.min_worth + " pts" : "") +
         (tooMany ? ", " + hits.length + " taken" : ""),
      s: citeText(bc.cite) });
  });
  /* Rogue Trader cruiser hulls (Fleets p. 174, J218): a hull other than the
     Rogue Trader profile is read as the second cruiser onwards - a warning,
     not an error (T55) */
  if(L.rt_hulls){
    var RH = L.rt_hulls, hRe = new RegExp(RH.hull, "i"), aRe = new RegExp(RH.all, "i");
    var nH = 0, nA = 0;
    members.forEach(function(m){
      if(!m.unitRow || !m.en) return;
      if(aRe.test(String(m.en.l))) nA += Math.max(1, m.hulls);
      if(hRe.test(String(m.en.l))) nH += Math.max(1, m.hulls); });
    if(nH) out.push({ ok: true, warn: nH > nA - 1, t: "Rogue Trader cruiser hulls (second cruiser onwards)",
      v: nH + " / " + Math.max(0, nA - 1), s: citeText(RH.cite) + " " + citeText(RH.cite2) + " " + RH.interp });
  }
  /* Rogue Trader escorts with their cruiser (Fleets pp. 50, 139, J218): one
     squadron per Rogue Trader cruiser, and outside Bakka only in a fleet led
     by an Inquisitor */
  if(L.rt_esc){
    var RE = L.rt_esc, eRe = new RegExp(RE.esc, "i"), cRe = new RegExp(RE.cru, "i");
    var inSecR = function(m){ return m.own && L.secs[m.si] && new RegExp(RE.sec, "i").test(String(L.secs[m.si].t).trim()); };
    var sqR = members.filter(function(m){ return m.unitRow && m.en && inSecR(m) && eRe.test(String(m.en.l)); }).length;
    var cruR = members.filter(function(m){ return m.unitRow && m.en && cRe.test(String(m.en.l)); })
      .reduce(function(a, m){ return a + Math.max(1, m.hulls); }, 0);
    var needOk = !RE.needs || members.some(function(m){ return m.en && new RegExp(RE.needs, "i").test(String(m.en.l)); });
    if(sqR) out.push({ ok: sqR <= cruR && needOk, t: "Rogue Trader escort squadrons (one per Rogue Trader cruiser)",
      v: needOk ? sqR + " / " + cruR : "needs an Inquisitor Lord", s: citeText(RE.cite) });
  }
  /* Exploration auxiliaries (Fleets p. 177, J219): escorts borrowed from
     another race's list, from one race only and never Orks, Dark Eldar,
     Necrons or Tyranids */
  if(L.aux){
    var raceOf = function(m){ var D = m.sel && m.sel.list; return D ? String(D.race || D.ally_race || D.nm) : ""; };
    var auxM = members.filter(function(m){
      return !m.own && m.unitRow && m.escort && (m.role === "ally" || m.role === "reserve") &&
        !/^xenos vessel/i.test(String((m.en && m.en.l) || "")); });
    var races = [];
    auxM.forEach(function(m){ var r = raceOf(m); if(r && races.indexOf(r) < 0) races.push(r); });
    if(auxM.length) out.push({ ok: races.length <= 1, t: "Auxiliary vessels from one race",
      v: races.length + " / 1", s: citeText(L.aux.cite_one) });
    races.forEach(function(r){
      if(L.aux.never.indexOf(r.toLowerCase()) >= 0)
        out.push({ ok: false, t: "Auxiliary vessels: not from " + r.replace(/(^|\s)([a-z])/g, function(a, b, c){ return b + c.toUpperCase(); }),
          v: "auxiliary escorts", s: citeText(L.aux.cite_never) });
    });
  }
  /* A single allied battleship once three reserve or allied capital ships
     are taken (Fleets p. 177, J219) */
  if(L.ally_bb){
    var bbN = 0, capN = 0;
    members.forEach(function(m){
      if(m.own || !m.unitRow || m.escort || !m.R || m.R.kind !== "ship") return;
      var bs = /battleship/i.test(String(m.R.stats && m.R.stats.type || ""));
      if(bs && m.role === "ally") bbN += Math.max(1, m.hulls);
      else if(!bs && (m.role === "ally" || m.role === "reserve")) capN += Math.max(1, m.hulls);
    });
    var bbMax = capN >= 3 ? 1 : 0;
    if(bbN) out.push({ ok: bbN <= bbMax, t: "Allied battleship (0-1, with three reserve or allied capital ships)",
      v: bbN + " / " + bbMax, s: citeText(L.ally_bb.cite) });
  }
  /* Blood Axe tiddla (Fleets p. 369, J220): commandeered Imperial Navy and
     Chaos escorts join a Blood Axe tiddla of at least six (squadron tag), at
     most three of them */
  if(L.bloodaxe){
    var BA = L.bloodaxe, CZd = L.clanz;
    var baIx = function(re){ var x = new RegExp(re, "i"); return L.secs.findIndex(function(sc){ return x.test(String(sc.t).trim()); }); };
    var inSecB = function(m, re){ return m.own && L.secs[m.si] && new RegExp(re, "i").test(String(L.secs[m.si].t).trim()); };
    var baClan = upRows(baIx(CZd.clan_sec), new RegExp(BA.clan, "i"));
    var com = members.filter(function(m){ return m.unitRow && inSecB(m, BA.sec); });
    var tagsB = [];
    com.forEach(function(m){
      var tg = m.intent && m.intent.sq;
      if(!tg) out.push({ ok: false, t: "Commandeered escorts: " + m.en.l, v: "not in a Blood Axe tiddla",
        s: citeText(BA.cite) });
      else if(tagsB.indexOf(tg) < 0) tagsB.push(tg);
    });
    tagsB.sort().forEach(function(tg){
      var inTag = members.filter(function(m){ return m.unitRow && m.intent && m.intent.sq === tg; });
      var ork = inTag.filter(function(m){ return inSecB(m, CZd.tiddla); });
      var orkN = ork.reduce(function(a, m){ return a + Math.max(1, m.hulls); }, 0);
      var comN = inTag.filter(function(m){ return inSecB(m, BA.sec); }).reduce(function(a, m){ return a + Math.max(1, m.hulls); }, 0);
      var axe = ork.some(function(m){ return baClan.some(function(x){ return tookUp(m, x[0], x[1]); }); });
      out.push({ ok: axe && orkN >= BA.min && comN <= BA.max, t: "Blood Axe tiddla " + tg,
        v: orkN + " Ork + " + comN + " commandeered" + (axe ? "" : ", no Blood Axe clan"), s: citeText(BA.cite) });
    });
  }
  /* Wardens ride on ships of their own (Fleets p. 454, J220): the fleet's
     hooks must split so that no ship carries Wardens and Orcas together */
  if(L.warden_only){
    var nW = 0, nO = 0;
    members.forEach(function(m){
      if(!m.unitRow || !m.en) return;
      if(/^warden/i.test(String(m.en.l))) nW += Math.max(1, m.hulls);
      else if(/^orca/i.test(String(m.en.l))) nO += Math.max(1, m.hulls);
    });
    if(nW && nO){
      var anyCaps = [], wOnly = 0;
      members.forEach(function(m){
        var hk = m.sel && m.sel.sh && m.sel.sh.hk;
        if(!hk) return;
        if(m.defence && !((m.R && m.R.weapons) || []).some(function(w){
          return (w.box == null || w.box === "on") && /gravitic hook/i.test(String((w.a && w.a[0]) || "")); })) return;
        for(var h = 0; h < Math.max(1, m.hulls); h++){ if(hk[0]) anyCaps.push(hk[0]); wOnly += hk[1] || 0; }
      });
      var totA = anyCaps.reduce(function(a, c){ return a + c; }, 0), needW = Math.max(0, nW - wOnly);
      var sums = [0];
      anyCaps.forEach(function(c){
        sums.slice().forEach(function(x){ if(sums.indexOf(x + c) < 0) sums.push(x + c); }); });
      var split = sums.some(function(x){ return x >= needW && totA - x >= nO; });
      out.push({ ok: split, t: "Wardens on ships of their own", v: nW + " Wardens, " + nO + " Orcas",
        s: citeText(L.warden_only.cite) });
    }
  }
  /* An ally's special character (Fleets p. 177, J221): up to one */
  if(L.ally_cmd){
    var scN = members.filter(function(m){ return !m.own && m.en && m.en.k === "cmd"; });
    var scOk = scN.filter(allySpecial);
    if(scN.length) out.push({ ok: scN.length === scOk.length && scOk.length <= L.ally_cmd.max,
      t: "Allied special character (0-" + L.ally_cmd.max + ")",
      v: scOk.length === scN.length ? scOk.length + " / " + L.ally_cmd.max : "not a special character",
      s: citeText(L.ally_cmd.cite) });
  }
  /* Daemonships cannot be used in squadrons (Fleets p. 227) */
  (L.sq_noup || []).forEach(function(x){
    sqTags.forEach(function(tag){ sqOf[tag].forEach(function(m){
      if(placeTaken(m, x.re)) out.push({ ok: false, t: "Daemonship in a squadron: " + m.en.l,
        v: "squadron " + tag, s: citeText(x.cite) }); }); });
  });
  /* Ships assigned a Veteran Captain must be squadroned (Fleets p. 38) */
  (L.sq_need || []).forEach(function(x){
    aboard.forEach(function(a){
      var cm = members[a.unit];
      if(!new RegExp(x.cmd, "i").test(String(cm.en.l))) return;
      var sm = a.ship != null ? members[a.ship] : null;
      var inSq = !!sm && (sm.escort ? sm.hulls >= 2 :
        !!(sm.intent && sm.intent.sq && sqOf[sm.intent.sq] && sqOf[sm.intent.sq].length >= 2));
      out.push({ ok: inSq, t: "Squadroned: " + cm.en.l, v: sm ? sm.en.l + (inSq ? " in a squadron" : " alone") : "no ship",
        s: citeText(x.cite) });
    });
  });
  /* Da Ork Clanz (J216): each Warlord's own command, Fleets pp. 369-373.
     wsum (J226): the same counts per Warlord for the fleet pane's Warlord
     block, so it can say what is missing instead of only that it is red. */
  var wsum = [];
  if(CZ && CZ.warlords.length){
    var C = L.clanz;
    var secIx = function(re){ var x = new RegExp(re, "i"); return L.secs.findIndex(function(sc){ return x.test(String(sc.t).trim()); }); };
    var inSec = function(m, re){ return m.own && L.secs[m.si] && new RegExp(re, "i").test(String(L.secs[m.si].t).trim()); };
    var clanRows = upRows(secIx(C.clan_sec)), gubRows = upRows(secIx(C.gub_sec), new RegExp(C.gub_re, "i"));
    var clansOf = function(m){ return clanRows.filter(function(x){ return tookUp(m, x[0], x[1]); })
      .map(function(x){ return String(x[2].l).replace(/^clan:\s*/i, "").replace(/\s*\(.*$/, ""); }); };
    /* a ship of one clan by itself (J232): "(0-1) Zukov's Klaw (Goff only)"
       (Fleets p. 372) is a Goff with no clan row to buy; his Warlord's one
       clan counts it */
    var clanNames = clanRows.map(function(x){ return String(x[2].l).replace(/^clan:\s*/i, "").replace(/\s*\(.*$/, ""); });
    var bornClan = function(m){
      var o = /\(([a-z][a-z ]*?) only\)/i.exec(String((m.en && m.en.l) || ""));
      return o ? clanNames.filter(function(c){ return c.toLowerCase().indexOf(o[1].toLowerCase()) === 0; }).slice(0, 1) : []; };
    CZ.warlords.forEach(function(w, k){
      var wi = members.indexOf(w), tag = "Warlord " + (k + 1) + ": ";
      var mine = members.filter(function(m, i){ return CZ.of[i] === wi; });
      var rr = (w.R && w.R.rerolls && w.R.rerolls.total) || 1;
      var hulks = mine.filter(function(m){ return inSec(m, C.hulk); });
      var S1 = { unit: wi, n: k + 1, rr: rr, hulk: hulks.length, units: mine.map(function(m){ return members.indexOf(m); }) };
      wsum.push(S1);
      if(hulks.length){
        var others = mine.length - 1;
        out.push({ ok: hulks.length === 1 && others === 0, t: tag + "Space Hulk",
          v: others === 0 && hulks.length === 1 ? "only the hulk" : "hulk + " + others + " other",
          s: citeText(C.hulk1) + " " + citeText(C.hulk2) });
      }else{
        var tid = mine.filter(function(m){ return inSec(m, C.tiddla); }).length;
        var groups = {};
        mine.forEach(function(m){
          if(inSec(m, C.tiddla)) return;
          /* a big ship skwadron (1-2 kroozers) and a Rok skwadron (1-4 Roks,
             Fleets p. 372, J232) are one skwadron by their tag */
          var g = (inSec(m, C.big) || inSec(m, C.rok)) && m.intent && m.intent.sq ? "sq:" + m.intent.sq : "u:" + members.indexOf(m);
          groups[g] = 1; });
        var total = tid + Object.keys(groups).length, t1 = Math.min(tid, rr);
        S1.tiddla = tid; S1.total = total;
        /* lone kroozers: a big ship skwadron of one, which a second kroozer
           of his could join (1-2 kroozers, Fleets p. 372) */
        S1.lone = mine.filter(function(m){
          if(!inSec(m, C.big)) return false;
          var tg = m.intent && m.intent.sq;
          return !tg || mine.filter(function(o){ return inSec(o, C.big) && o.intent && o.intent.sq === tg; }).length === 1; })
          .map(function(m){ return members.indexOf(m); });
        out.push({ ok: tid >= rr && total === 2 * rr, t: tag + "skwadrons",
          v: t1 + " tiddla + " + (total - t1) + " other / " + rr + " + " + rr,
          s: citeText(C.sk) + " " + C.sk_interp });
      }
      var uge = mine.filter(function(m){ return inSec(m, C.uge); }).length;
      var kro = mine.filter(function(m){ return inSec(m, C.big); }).length;
      S1.uge = uge; S1.kro = kro;
      if(uge) out.push({ ok: uge <= 1 && kro >= 2, t: tag + "'Uge ship",
        v: uge + " / 1, " + kro + (kro === 1 ? " kroozer" : " kroozers"),
        s: citeText(C.uge1) + " " + citeText(C.uge2) });
      var clans = [];
      mine.concat([w]).forEach(function(m){ clansOf(m).concat(bornClan(m)).forEach(function(c){ if(clans.indexOf(c) < 0) clans.push(c); }); });
      if(clans.length) out.push({ ok: clans.length <= 1, t: tag + "one clan", v: clans.join(", "), s: citeText(C.clan) });
      S1.clans = clans;
      var ab = aboard.filter(function(a){ return a.unit === wi; })[0];
      var own = ab && ab.ship != null ? members[ab.ship] : null;
      var g = 0, off = 0;
      mine.forEach(function(m){ gubRows.forEach(function(x){
        if(tookUp(m, x[0], x[1])){ g++; if(m !== own) off++; } }); });
      if(g) out.push({ ok: g <= rr && !off, t: tag + "Gubbins",
        v: g + " / " + rr + (off ? ", " + off + " not on his own ship" : ""), s: citeText(C.gub) });
      S1.gub = g; S1.gubOff = off; S1.ship = own ? members.indexOf(own) : null;
    });
    /* every capital ship of a skwadron takes the clan (Fleets p. 369), and so
       does every Rok of a Rok skwadron (ruling T58: p. 369 counts Rok
       skwadrons among the capital ship skwadrons, and only a tiddla skwadron
       pays once). sqTags holds every non-escort skwadron, Roks included. */
    sqTags.forEach(function(tag){
      var ms = sqOf[tag], sets = ms.map(function(m){ return clansOf(m).sort().join(","); });
      if(sets.some(function(x){ return x; }) && sets.some(function(x){ return x !== sets[0]; }))
        out.push({ ok: false, t: "Squadron " + tag + ": the clan on every ship",
          v: sets.map(function(x){ return x || "none"; }).join(" / "), s: citeText(C.clan_sq) });
    });
    /* a skwadron is one Warlord's (J232, Fleets p. 373: "you can't split up
       skwadrons"); a tag across two Warlords is a split skwadron */
    if(C.split) sqTags.forEach(function(tag){
      var wl = [];
      sqOf[tag].forEach(function(m){ var w = CZ.of[members.indexOf(m)]; if(w >= 0 && wl.indexOf(w) < 0) wl.push(w); });
      if(wl.length > 1) out.push({ ok: false, t: "Squadron " + tag + ": one Warlord",
        v: wl.map(function(w){ return "Warlord " + (CZ.warlords.indexOf(members[w]) + 1); }).join(" + "), s: citeText(C.split) });
    });
  }
  /* A Warlord aboard a space hulk: "Extra Powerfields costs +50 pts instead
     of +25" (Fleets p. 390, J224). The +50 row is its own row of the
     Warlord's; which one he owes depends on the ship he is aboard (J215),
     and placement never changes a price (J8), so it is a check. */
  if(L.hulk_pf){
    var HP = L.hulk_pf;
    var hpSec = L.secs.findIndex(function(sc){ return new RegExp(HP.sec, "i").test(String(sc.t).trim()); });
    var hp25 = upRows(hpSec, new RegExp(HP.row, "i")), hp50 = upRows(hpSec, new RegExp(HP.hulk_row, "i"));
    aboard.forEach(function(a){
      var cm = members[a.unit];
      if(!cm.own || !new RegExp(HP.cmd, "i").test(String(cm.en.l))) return;
      var t25 = hp25.some(function(x){ return tookUp(cm, x[0], x[1]); });
      var t50 = hp50.some(function(x){ return tookUp(cm, x[0], x[1]); });
      if(!t25 && !t50) return;
      var sm = a.ship != null ? members[a.ship] : null;
      var onHulk = !!sm && placeRe(HP.ship, sm);
      /* a kroozer's Warlord with the +25 row: nothing to say */
      if(!onHulk && !t50) return;
      var ok = onHulk ? t50 && !t25 : t25 && !t50;
      out.push({ ok: ok, t: "Extra Power Fields: " + cm.en.l + " aboard " + (sm ? sm.en.l : "no ship"),
        v: "+" + (t50 ? 50 : 25) + " pts" + (ok ? "" : onHulk ? " (+50 aboard a space hulk)" : " (+25 off a space hulk)"),
        s: citeText(HP.cite) });
    });
  }
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
