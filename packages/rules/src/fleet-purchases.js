/* Checks on what single units bought: the Warmaster's Mark, a commander's
   price, planetary defences, required weapons, shares of one hull's option
   and ships summoned through the Webway. Called by resolveFleet. */

import { defenceOwnPoints } from "./crits.js";
import { upState, upgradesFor } from "./upgrades.js";

/* The Warmaster's Mark, and who has already paid for it. */
export function checkWarmasterMark(F){
  var L = F.L, members = F.members, out = F.out;
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
}

/* A unit whose choices contradict the book. */
export function checkUnitIssues(F){
  var members = F.members, out = F.out;
  /* A unit whose choices contradict the book (P1-8e issues) is not legal. */
  members.forEach(function(m){
    var errs = ((m.R && m.R.issues) || []).filter(function(x){ return x.severity === "error"; });
    if(errs.length)
      out.push({ ok: false, t: "Unit issues: " + m.R.className.toLowerCase().replace(/(^|[\s(\-\u2013/])([a-z])/g, function(a, b, c){ return b + c.toUpperCase(); }),
        v: errs.length + " problem" + (errs.length > 1 ? "s" : ""), s: errs.map(function(x){ return x.message; }).join("; ") });
  });
}

/* A commander whose price depends on his ship. */
export function checkCommanderPrice(F){
  var L = F.L, members = F.members, out = F.out;
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
}

/* Planetary defences. */
export function checkDefences(F){
  var lim = F.lim, members = F.members, out = F.out;
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
}

/* A weapon the ship must be armed with. */
export function checkRequiredWeapons(F){
  var members = F.members, out = F.out;
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
}

/* A share of one hull's own option. */
export function checkOptionShares(F){
  var members = F.members, out = F.out;
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
}

/* Ships summoned through the Webway Portal. */
export function checkWebway(F){
  var L = F.L, members = F.members, out = F.out;
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
}
