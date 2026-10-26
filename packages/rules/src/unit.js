import { pairRows, rangeCell } from "./arms.js";
import { commanderRules, namedCommanderRules } from "./commanders.js";
import { CRIT, CRIT_ICONS, DEFENCE_ONE_HIT_LINE, ESCORT_LINE, crippledLine, critOnce, criticalModel, criticalTriggerHint, criticalTriggerLine, defenceOwnPoints, hulkLoss, isChaosHulk, isMechanicusVessel, isSpaceHulk, isStationaryDefence, repairLine, squadronLimits } from "./crits.js";
import { victoryWorth } from "./fleet.js";
import { upgradeId } from "./legacy.js";
import { roleOfIntent } from "./lending.js";
import { hullPts, maxPointsOf, pointsOf, upCost } from "./pricing.js";
import { boughtDefs, hullOptionsOf, optStars, ownedText, specialLines, starredKeys, starsForRow } from "./special-rules.js";
import { HOST_OFF, bayStrength, isUpgradeEnt, listOfSec, optCount, optState, optionCoversRow, secOf, selectionOf, takenUpgradeLabels, upState, upgradeKey, upgradesFor } from "./upgrades.js";
import { validateIntent } from "./validation.js";
import { effHits, effShieldsText, effSpeed, effTurrets, statSet, weaponRows } from "./weapons.js";

/* ======================= P1-8c: resolveUnit v1 =======================
   One resolved view of a unit for every surface (docs/DOMAIN_CONTRACT.md).
   Pure: the Selection is built once from (intent, ctx, catalog); every
   field below is computed from it and nothing is read from anywhere else.
   Nothing returned is a reference into the intent or the catalogue. */
export function weaponState(row){ return row.box == null || row.box === "on" ? "active" : "offered"; }

/* Every option of the profile with its state, price, count and the reasons
   it cannot be taken right now. blockedBy lists the ids of taken options in
   the same exclusive group (when the group is full) or sharing a swapped
   armament row. dependsOn is the option that must be taken first. */
export function optionsOf(sel){
  var sh = sel.sh, ol = (sh && sh.ol) || [];
  return ol.map(function(o, i){
    var st = optState(sel, i);
    var blockedBy = [];
    if(st !== "take"){
      var max = Math.max(1, o.gmax || 1);
      var inGroup = o.grp ? ol.filter(function(p, j){
        return j !== i && p.grp === o.grp && optState(sel, j) === "take"; }) : [];
      if(o.grp && inGroup.length >= max) inGroup.forEach(function(p){ blockedBy.push(p.id); });
      if(o.sw) ol.forEach(function(p, j){
        if(j === i || !p.sw || optState(sel, j) !== "take" || blockedBy.indexOf(p.id) >= 0) return;
        if((o.sw.f || []).some(function(f){ return (p.sw.f || []).indexOf(f) >= 0; })) blockedBy.push(p.id);
      });
      /* A list upgrade taken whose condition excludes the weapon this option
         would fit (Power Ram: "unless it has a Nova Cannon", Fleets p. 118)
         blocks the option, as the option would block the upgrade. */
      if(o.sw && sel.list){
        var names = (o.sw.t || []).map(function(t){ return String(t[0] || ""); });
        var ups = upgradesFor(sel);
        ups.own.concat(ups.other).forEach(function(x){
          var en2 = x[2];
          if(!en2.cond || !en2.cond.no || upState(sel, x[0], x[1]) !== "take") return;
          var rx = new RegExp(String(en2.cond.no).split("@")[0], "i");
          if(names.some(function(nm){ return rx.test(nm); }))
            blockedBy.push(upgradeId(listOfSec(sel, x[0]).nm, secOf(sel, x[0]).t, en2.l));
        });
        /* A taken list swap already holds a row this option would replace. */
        ups.own.concat(ups.other).forEach(function(x){
          var en2 = x[2];
          if(!en2.swp || upState(sel, x[0], x[1]) !== "take") return;
          var rx2 = new RegExp(en2.swp.f, "i");
          if((o.sw.f || []).some(function(fi){ return sh.aw[fi] && rx2.test(String(sh.aw[fi][0])); })){
            var uid = upgradeId(listOfSec(sel, x[0]).nm, secOf(sel, x[0]).t, en2.l);
            if(blockedBy.indexOf(uid) < 0) blockedBy.push(uid);
          }
        });
      }
    }
    /* "10HP or greater" (Kroot Warsphere, Fleets p. 494): Hits in force - the
       base plus taken option mods - below the minimum block the option, and
       a reduction that would take the ship below a taken option's minimum
       is blocked in turn. */
    if(st !== "take" && sh){
      var hpNow = +sh.hp || 0;
      ol.forEach(function(p, j){
        if(optState(sel, j) === "take" && p.mod && p.mod.hp) hpNow += p.mod.hp * optCount(sel, j);
      });
      if(o.hpmin && hpNow < o.hpmin) ol.forEach(function(p, j){
        if(optState(sel, j) === "take" && p.mod && p.mod.hp < 0 && blockedBy.indexOf(p.id) < 0) blockedBy.push(p.id);
      });
      if(o.mod && o.mod.hp < 0) ol.forEach(function(p, j){
        if(optState(sel, j) === "take" && p.hpmin && hpNow + o.mod.hp < p.hpmin && blockedBy.indexOf(p.id) < 0) blockedBy.push(p.id);
      });
    }
    /* An option that covers a list row (cov) inherits the row's exclusions:
       a taken upgrade whose noup names the covered row blocks the option (a
       Daemonship may not have a Chaos Space Marine crew, Fleets p. 249). */
    if(st !== "take" && o.cov && sel.list){
      var ups3 = upgradesFor(sel);
      ups3.own.concat(ups3.other).forEach(function(x){
        var en3 = x[2];
        if(!en3.cond || !en3.cond.noup || upState(sel, x[0], x[1]) !== "take") return;
        if(coversExcludedRow(sel.list, o, en3.cond.noup))
          blockedBy.push(upgradeId(listOfSec(sel, x[0]).nm, secOf(sel, x[0]).t, en3.l));
      });
    }
    var dep = o.dep != null && ol[o.dep] ? ol[o.dep].id : null;
    return {
      id: o.id, text: o.t, cost: o.c == null ? null : o.c, variable: !!o.var,
      state: st, qty: optCount(sel, i), max: o.qty ? (o.qty.max || 1) : 1,
      group: o.grp || null, groupMax: o.grp ? Math.max(1, o.gmax || 1) : null,
      dependsOn: dep, dependencyMet: dep == null || optState(sel, o.dep) === "take",
      blockedBy: blockedBy, index: i,
      forbidden: !!(sel.en && sel.en.optno && new RegExp(sel.en.optno, "i").test(String(o.t || "")))
    };
  });
}

/* Does option o cover a list row whose label the noup pattern names? */
export function coversExcludedRow(list, o, noup){
  var rx = new RegExp(String(noup), "i"), hit = false;
  (list ? list.secs : []).forEach(function(sec){ (sec.ents || []).forEach(function(en){
    if(!hit && isUpgradeEnt(en) && rx.test(String(en.l || "")) && optionCoversRow(o, en)) hit = true;
  }); });
  return hit;
}

/* A commander's re-rolls in words (user 5.10.2026: what the price already
   includes must be said plainly wherever the commander is shown). One
   sentence builder for the catalogue, the fleet row, the card and the play
   page, so the four cannot say it four ways.
     included  re-rolls that come with the points cost (en.rr, from the book)
     bought    re-rolls taken on top (re-roll rows, Mark of Tzeentch)
     can       the list sells this commander re-rolls at all
     q         the book's own limit on them (en.rrq, build_data): scope - whose
               rolls they may be spent on (a Veteran Captain's "own vessel or
               another vessel in their own squadron", p. 38) - or unit
               (Abaddon's is "1 per turn", p. 231, not once per game)
   Nothing included and nothing for sale says nothing: a Space Marine
   Captain (Fleets p. 100) has no re-roll to talk about. */
export function rerollText(included, bought, can, q){
  var inc = included | 0, b = bought | 0;
  var unit = q && q.unit ? " " + q.unit : "", scope = q && q.scope ? ", " + q.scope : "";
  var rr = function(k){ return k + (k === 1 ? " re-roll" : " re-rolls") + unit; };
  if(inc && b) return rr(inc + b) + " (" + inc + " included + " + b + " bought)" + scope;
  if(inc) return rr(inc) + " included" + scope;
  if(b) return rr(b) + " bought (none included)" + scope;
  return can ? "no re-roll included" : "";
}
/* Re-roll boxes (user 5.10.2026): one box per re-roll, of the kind it came
   as, for the card and the play page to tick off as they are used.
     included  in the points cost
     bought    a re-roll row that is taken
     optional  an open option - printed, not counted in the points: ticked
               into use if it is bought
   Open rows of one choose-one group ("One / Two / Three extra re-rolls")
   offer the largest of them, not their sum; separate groups add up (an
   extra re-roll and the Mark of Tzeentch, Fleets p. 234). rows are resolved
   upgrade rows (upgradesOf). */
export function openRerolls(rows){
  var best = {};
  (rows || []).forEach(function(x){
    if(x.state !== "opt" || !(x.rerolls > 0)) return;
    var g = x.group || x.id;
    best[g] = Math.max(best[g] || 0, x.rerolls);
  });
  return Object.keys(best).reduce(function(a, g){ return a + best[g]; }, 0);
}
export function rerollBoxes(included, bought, optional){
  var out = [], i;
  for(i = 0; i < (included | 0); i++) out.push("included");
  for(i = 0; i < (bought | 0); i++) out.push("bought");
  for(i = 0; i < (optional | 0); i++) out.push("optional");
  return out;
}
/* A ship's OWN re-rolls (review 5.10.2026): the ones its profile carries in
   its cost (sh.rr - the Scion of Prospero's Mark of Tzeentch and Vagaries
   of Fate, Fleets p. 258) and the re-roll rows taken on it that are not the
   fleet's purchase: a Mark of Tzeentch ("This ship has an extra re-roll",
   p. 234), a fortress-monastery's ("usable only by the fortress-monastery
   itself", p. 111). Open options count only for rows that are the ship's
   own - a Mark any ship of the list could take is not an offer to draw on
   every card. null for a ship with none. */
export function shipRerolls(sh, ups){
  var rows = (ups || []).filter(function(x){ return x.rerolls > 0 && !x.fleetWide; });
  var inc = (sh.rr | 0) + rows.reduce(function(a, x){ return a + (x.state === "take" && x.included ? x.rerolls : 0); }, 0);
  var purchased = rows.filter(function(x){ return x.state === "take" && !x.included; })
    .map(function(x){ return { id: x.id, label: x.label, cost: x.cost, count: x.rerolls }; });
  var b = purchased.reduce(function(a, x){ return a + x.count; }, 0);
  var ownRows = rows.filter(function(x){ return x.owner === "own"; });
  var open = openRerolls(ownRows);
  if(!inc && !b && !open) return null;
  var q = { scope: "this ship's own" }, can = ownRows.length > 0;
  return { included: inc, purchased: purchased, total: inc + b, optional: open, boxes: rerollBoxes(inc, b, open),
           purchasable: can, scope: q.scope, unit: null,
           /* joins: with the fleet commander aboard they are his - "added to
              the commander's own re-rolls and can be used by the entire
              fleet" (Fortress-Monastery, Fleets p. 111; Ramilies p. 503) */
           joins: sh.rrj ? { page: sh.rrj } : null,
           text: rerollText(inc, b, can, inc || b ? q : null), head: rerollText(inc, b, can, null),
           base: rerollText(inc, 0, can, inc ? q : null) };
}
/* The same for a commander ROW of the catalogue, before anything is chosen:
   what its price includes and whether its list sells it more. null for a
   row that is not a commander. */
export function commanderRerollOffer(list, si, ei){
  var sec = list && list.secs[si], en = sec && sec.ents[ei];
  if(!en || en.k !== "cmd") return null;
  var can = list.secs.some(function(s2){ return s2.ents.some(function(u){
    return isUpgradeEnt(u) && u.rr > 0 && (u.at || []).some(function(p){ return p[0] === si && p[1] === ei; });
  }); });
  var inc = en.rr || 0;
  return { included: inc, purchasable: can, text: rerollText(inc, 0, can, en.rrq),
           /* head: the count alone, for a tag; scope: the limit, for the line under it */
           head: rerollText(inc, 0, can, en.rrq && en.rrq.unit ? { unit: en.rrq.unit } : null),
           scope: (en.rrq && en.rrq.scope) || null };
}
/* A fleet without a commander can still have a re-roll of its own: "The
   fleet gets one re-roll and can purchase extra re-rolls at the cost shown"
   (Necrons p. 404, Demiurg p. 486). list.frr is that sentence with its page
   (build_data); units are the fleet's resolved units, whose taken
   fleet-wide rows are the extra ones. null when the list has no such rule. */
export function fleetRerolls(list, units){
  var f = list && list.frr;
  if(!f) return null;
  var per = (units || []).map(function(R){
    var rows = ((R && R.upgrades) || []).filter(function(x){ return x.fleetWide && x.rerolls > 0; });
    return { took: rows.reduce(function(a, x){ return a + (x.state === "take" ? x.rerolls : 0); }, 0),
             open: openRerolls(rows),
             cap: R && R.entry && f.per && R.entry.section === f.per ? (R.hulls || 1) : 0 };
  });
  var bought, open;
  if(f.each){
    /* one for each ship of the capping section ("A maximum of one Hive Mind
       Influence re-roll can be purchased per hive ship in the fleet",
       p. 430): the taken ones add up, and what is left of the cap is open */
    bought = per.reduce(function(a, x){ return a + x.took; }, 0);
    open = Math.max(0, per.reduce(function(a, x){ return a + x.cap; }, 0) - bought);
    if(!per.some(function(x){ return x.open > 0; })) open = 0;
  }else{
    /* one purchase for the fleet (p. 404, 486): a row ticked on two ships is
       still one purchase - the legality check says so - and every ship shows
       the same offer, of which nothing is left once a row is taken */
    bought = per.reduce(function(a, x){ return Math.max(a, x.took); }, 0);
    open = bought ? 0 : per.reduce(function(a, x){ return Math.max(a, x.open); }, 0);
  }
  return { included: f.n, bought: bought, total: f.n + bought, page: f.pg, source: f.src, how: f.how || f.src,
           optional: open, boxes: rerollBoxes(f.n, bought, open),
           section: f.sec, scope: f.scope || null,
           text: rerollText(f.n, bought, true, f.scope ? { scope: f.scope } : null) };
}

/* Every list upgrade offered to this unit (upgradesFor: covered and
   ineligible rows are absent), with its resolved cost and state. key is the
   list position the legacy setters still use; P1-8e removes it. */
export function upgradesOf(sel){
  var ups = upgradesFor(sel), L = sel.list;
  var mk = function(owner){ return function(x){
    var si = x[0], ei = x[1], en = x[2];
    return {
      id: upgradeId(listOfSec(sel, si).nm, secOf(sel, si).t, en.l), label: en.l,
      cost: upCost(sel, en), price: en.p == null ? null : en.p, per: en.per || null,
      state: upState(sel, si, ei), owner: owner, required: !!en.req,
      /* incl: a Mark that comes with the ship, not a choice (build_data). */
      included: !!en.incl,
      group: en.grp || null, source: en.src_page || null, key: upgradeKey(si, ei),
      /* P1-8d: the card prints the book's own text for the row, the fleet
         view its note, and a per-bay price shows its multiplier. */
      /* The row's own book sentence (desc) wins: a section sentence can be
         owned by the wrong row (Tyranid "Increase to Ld 9" owned the weapon
         choice heading, Fleets p. 430). */
      /* A host row (si >= HOST_OFF): the sentence and the list name from its
         own list - the donor list's section at the moved index was empty, and
         the card sold an ability without its mechanics (spot check 20, seed 2026091443). */
      list: listOfSec(sel, si) ? listOfSec(sel, si).nm : L.nm,
      description: en.desc || ownedText(listOfSec(sel, si) || L, si >= HOST_OFF ? si - HOST_OFF : si, en.l) || "", note: en.nt || "",
      bays: en.per === "bay" ? bayStrength(sel.sh, sel) : null,
      ships: en.per === "bay" && sel.escort ? sel.hulls : 1,
      rerolls: en.rr || 0,
      /* fxg: bought once for the whole fleet, not for this ship (p. 404,
         486); frw: a fleet re-roll bought ship by ship (Tyranid Hive Mind
         Influence, p. 430) */
      fleetWide: !!(en.fxg || en.frw)
    };
  }; };
  return ups.own.map(mk("own")).concat(ups.other.map(mk("other")));
}

/* Rule cards: planetary defences that are a rule rather than a profile.
   An orbital mine (Fleets p. 512) and a minefield (p. 513) have no stat line
   at all; a fire ship (p. 516) has one and no weapons - the ship is the
   weapon. The player asked for a printable card with the instructions on it
   (7.10.2026), so the steps are data here, in play order, in the app's own
   words with the page; the card and the play page print the same list.
   track: what the card gives to tick or write - "each" = one box per item
   bought, "size" = two write-in boxes per minefield (its size is rolled at
   set-up, p. 513). */
export const RULE_CARDS = {
  orbital_mine: {
    title: "Orbital mine", page: 512, each: "mine",
    lead: "Heavy ordnance that homes on the nearest enemy ship.",
    steps: [
      ["Deploy", "Set up as a high orbit defence, inside the gravity well of the planet or moon it guards (Fleets p. 498). From then on it is active until destroyed."],
      ["Ordnance phase", "Every Ordnance phase, move it 10 cm toward the nearest enemy ship."],
      ["Contact", "When it touches an enemy ship's base it detonates: roll 8 dice to hit that ship. The ship fires its turrets first as normal - if they hit the mine, roll 4 dice instead. Shields do not protect against it (FAQ 2026; Fleets p. 512 said they did)."],
      ["As ordnance", "It is an ordnance marker for movement, Blast Markers and being shot at. Only fighters interact with it: mine and fighters remove each other. Other ordnance ignores it, and friendly attack craft never attack it."],
      ["Victory points", "A mine bought on its own is worth its points to the enemy when destroyed, however it leaves play."]
    ],
    track: { kind: "each", label: "MINES - tick when gone" }
  },
  minefield: {
    title: "Minefield", page: 513, each: "minefield",
    lead: "An area that releases orbital mines at enemy ships that come near.",
    steps: [
      ["Set up", "Roll D3 x 5 cm for each of its two sides. Place it with one edge within 15 cm of a tabletop feature such as a planet, moon or asteroid field."],
      ["Terrain", "It blocks line of sight. To your ships it is an asteroid field in every way; an enemy ship may try to cross it on the same Leadership check. Torpedoes that touch it are destroyed. Attack craft do not set it off and may hide in it (destroyed on a 6)."],
      ["Your Ordnance phase", "Roll a D6 for each enemy ship within 30 cm of its edge: 5+ detects the ship. +1 if the ship is on All Ahead Full, -1 on Burn Retros, -1 if it is an escort, -1 if a Blast Marker touches the minefield."],
      ["Mines", "For each ship detected you may place one orbital mine touching the edge. It then acts as an orbital mine: 10 cm toward the nearest enemy ship each Ordnance phase, 8 dice on contact, 4 if turrets hit it (Fleets p. 512)."],
      ["Ships inside", "Enemy ships inside the field set off mines just the same and are attacked first; with several inside, you choose the order."],
      ["Suppression", "It is shot at like an ordnance marker, armour 6 (ordnance for target priority). Each hit puts a Blast Marker on it. Each End Phase it sheds D6 Blast Markers of its own."],
      ["Victory points", "Mines it releases are not worth victory points."]
    ],
    track: { kind: "size", label: "SIZE - roll D3 x 5 cm twice" }
  },
  fire_ship: {
    title: "Fire ship", page: 516, each: "fire ship",
    lead: "A hulk packed with plasma and explosives. It has no weapons: the ship is the weapon.",
    steps: [
      ["Move", "It moves and is shot at as an escort with the profile above. As a planetary defence it has no Leadership: it may Brace for Impact on Ld 7 and takes no other special order (Fleets p. 499)."],
      ["Detonate", "At any point in its Movement phase you may detonate it. Roll 3D6: every ship within that many cm suffers D3 Fire critical hits."],
      ["Blast", "Escorts in the blast are destroyed outright, as any escort that suffers a critical hit is; ordnance markers in it are removed too."],
      ["Afterwards", "Remove the fire ship and put a Blast Marker in its place."]
    ],
    track: { kind: "each", label: "FIRE SHIPS - tick when gone" }
  }
};
/* What the mine cards add for the fleet that owns the mines and for the one
   ship that never sets them off (BACKLOG J175). Eldar and Dark Eldar
   ordnance "can only be hit by defensive turrets on a roll of 6 ... This
   includes ... orbital mines" (Fleets p. 304; Dark Eldar p. 345, "turrets
   on a 6"). The Necron Shroud: "As long as it is not crippled a Shroud will
   never activate orbital mines" (p. 407) - the card is the defender's, so
   it names the exception for whichever enemy brings one. */
export var MINE_TURRETS_6 = [[/^dark eldar$/, "Dark Eldar", 345], [/eldar/, "Eldar", 304]];
export function mineSteps(key, list){
  if(key !== "orbital_mine" && key !== "minefield") return [];
  var out = [], race = String((list && list.race) || "").toLowerCase();
  var e6 = MINE_TURRETS_6.filter(function(x){ return x[0].test(race); })[0];
  if(e6) out.push({ h: e6[1] + " mines", t: "Turrets hit " + (key === "minefield" ? "the mines it releases" : "this mine") +
    " only on a 6, like all " + e6[1] + " ordnance (Fleets p. " + e6[2] + ")." });
  out.push({ h: "Necron Shroud", t: "An uncrippled Necron Shroud never activates orbital mines (Fleets p. 407)." });
  return out;
}
export function ruleCardOf(key, limit, list){
  var c = key ? RULE_CARDS[key] : null;
  if(!c) return null;
  return { key: key, title: c.title, page: c.page, each: c.each, lead: c.lead, limit: limit == null ? null : limit,
           steps: c.steps.map(function(x){ return { h: x[0], t: x[1] }; }).concat(mineSteps(key, list)),
           track: { kind: c.track.kind, label: c.track.label } };
}
/* What the card and the play page need to know about a ship's Leadership
   when the book fixes it: a planetary defence has none and uses a nominal 7
   (Fleets p. 499), a Fortress-Monastery has "a base leadership of 10"
   (p. 111). null = rolled as usual. orders: the special orders it may take
   at all (RO, LO, BFI ...), null = no restriction. */
/* Reload Ordnance only "where applicable" (Fleets p. 499): a platform, monitor
   or fire ship with no torpedoes and no launch bays has nothing to reload, so
   the order is not offered to it. Optional rows count - a Waystation may buy
   a launch bay (p. 481). */
export function hasOrdnance(sh){
  return ((sh && sh.aw) || []).some(function(a){ return /torpedo|launch bay|missile/i.test(String(a[0] || "")); });
}
export function shipOrders(sh){
  if(!sh || !sh.dor) return null;
  var ord = hasOrdnance(sh);
  return sh.dor.filter(function(o){ return o !== "RO" || ord; });
}
export function shipLeadership(sh){
  if(!sh || !sh.dld) return null;
  return sh.dld === 7
    ? { kind: "fixed", value: 7, max: null, rolled: false, note: "no Ld roll", page: 499 }
    : { kind: "fixed", value: sh.dld, max: null, rolled: false, note: "base Ld", page: 111 };
}

export function resolveUnit(intent, ctx, catalog){
  var sel = selectionOf(intent, ctx, catalog);
  var sh = sel.sh, en = sel.en;
  if(!sh){
    /* A list row without a hull: a commander, or a fleet option bought as
       a row. It has a price, upgrades and (for a commander) leadership and
       re-rolls; it has no stats, weapons or damage. */
    if(!en) return null;
    var kindE = en.k === "cmd" ? "commander" : "entry";
    var upsE = upgradesOf(sel);
    var bought = upsE.filter(function(x){ return x.state === "take" && x.rerolls > 0; })
      .map(function(x){ return { id: x.id, label: x.label, cost: x.cost, count: x.rerolls }; });
    var incl = en.rr || 0;
    var boughtN = bought.reduce(function(a, x){ return a + x.count; }, 0);
    /* a re-roll row of his own on offer: the list sells him re-rolls */
    var canBuy = kindE === "commander" && upsE.some(function(x){ return x.owner === "own" && x.rerolls > 0; });
    var openN = kindE === "commander" ? openRerolls(upsE.filter(function(x){ return x.owner === "own"; })) : 0;
    return {
      kind: kindE, className: en.l, mechanicus: false,
      /* card: which printed card this unit gets. A row with a rule card
         (orbital mine, minefield) prints one; any other hull-less row that is
         not a commander prints none. countable: bought N at a time. */
      card: kindE === "commander" ? "commander" : en.rc ? "rule" : null,
      ruleCard: ruleCardOf(en.rc, en.mx, sel.list),
      countable: !!en.cnt, defence: sel.defence ? { stationary: true, ground: false, ownPoints: false } : null,
      orders: null,
      /* A borrowed ship carries its role into the resolved unit too, so the
         card and the fleet view do not read the legacy unit directly. */
      role: roleOfIntent(intent),
      ref: null, name: String(intent.name || "").trim(), hulls: sel.hulls,
      entry: { list: sel.list.nm, section: sel.list.secs[sel.si].t, label: en.l,
               basePoints: en.p == null ? sel.custom : en.p,
               price: en.p == null ? null : en.p, openPrice: en.p == null && !en.hc,
               note: en.nt || "", badRef: !!en.badref, noopt: false },
      source: { page: en.src_page || null, faction: "" },
      members: [], note: intent.note || "", adjust: sel.adjust, custom: sel.custom,
      points: pointsOf(sel), maxPoints: maxPointsOf(sel),
      stats: null, weapons: [], damage: null,
      leadership: en.ld ? { kind: en.ld.kind, value: en.ld.value, max: en.ld.max == null ? null : en.ld.max } : null,
      rerolls: { included: incl, purchased: bought, total: incl + boughtN,
                 /* optional: open re-roll rows, not in the points; boxes: one per re-roll by kind */
                 optional: openN, boxes: kindE === "commander" ? rerollBoxes(incl, boughtN, openN) : [],
                 purchasable: canBuy, scope: (en.rrq && en.rrq.scope) || null, unit: (en.rrq && en.rrq.unit) || null,
                 text: kindE === "commander" ? rerollText(incl, boughtN, canBuy, en.rrq) : "",
                 /* head: the same without the scope (the card's box); base: what
                    the entry cost alone includes (the card's first row) */
                 head: kindE === "commander" ? rerollText(incl, boughtN, canBuy, en.rrq && en.rrq.unit ? { unit: en.rrq.unit } : null) : "",
                 base: kindE === "commander" ? rerollText(incl, 0, canBuy, en.rrq) : "" },
      rules: (kindE === "commander"
        ? commanderRules(sel.list, sel.si, en).concat(namedCommanderRules(en)).map(function(t){ return { t: t, ast: false }; }) : [])
        .concat(boughtDefs(sel, null, sel.list).map(function(dd){ return { t: dd.text, ast: false, canonical: true }; })),
      hull: null, options: [], upgrades: upsE, issues: validateIntent(intent, ctx, catalog), warnings: []
    };
  }
  var hits = effHits(sel);
  var escort = sel.escort;
  var cm = criticalModel(sh);
  /* Fleets p. 307 Deathless: a Ghostship suffers a critical only on a 6. */
  var ghost = takenUpgradeLabels(sel).some(function(l){ return /^ghostship/i.test(l); });
  /* Fleets p. 182 Fuel Tanker: "suffer critical damage on a roll of 5+ instead of a 6". */
  var tanker = (sh.ol || []).some(function(o, i){ return optState(sel, i) === "take" && /^fuel tanker/i.test(String(o.t || "")); });
  var rows = weaponRows(sel).map(function(r){ r.state = weaponState(r); return r; });
  /* v1.2: how the card prints the range - one value in its band's frame, or
     null for a cell that is not one range (rangeCell above) */
  rows.forEach(function(r){ r.range = rangeCell(r.a[1]); });
  /* Stars: which special rules a row or an option refers to. The card used
     to look these up itself (starredKeys / starsForRow / optStars). */
  var rules = specialLines(sh, sel.list, sel);
  var starred = starredKeys(rules, sh, sel.list);
  rows.forEach(function(r){
    r.stars = (r.alt || r.swapped) ? starsForRow(sh, rules, r.a, sel.list, sel.en) : (starred[r.i] || []).slice();
  });
  var opts = optionsOf(sel);
  opts.forEach(function(o, i){ o.stars = optStars(sh, sh.ol[i], rules, sel.list); });
  var upsS = upgradesOf(sel);
  /* Quadrant forts print their weapons in two groups: the book's table heads
     them QUADRANT WEAPONS and BASILICA WEAPONS (Fleets pp. 110, 500), which
     the extractor drops. The Basilica rows are the ones that fire all round;
     a quadrant's fire into its own quarter, and its launch bays have no arc. */
  if(sh.qd) rows.forEach(function(r){
    r.zone = /all\s*round/i.test(String((r.a && r.a[3]) || "")) ? "basilica" : "quadrant"; });
  /* Space hulks: a critical wears a weapon row down for the rest of the game
     ("Space Hulks cannot repair any critical damage", Fleets p. 391), so the
     standard rows carry how they are ticked. */
  var hulk = isSpaceHulk(sh);
  if(hulk) rows.forEach(function(r){ if(r.box == null) r.loss = hulkLoss(r.a, isChaosHulk(sh)); });
  /* v1.2: port / starboard pairs (pairRows). Not on a hulk: every row there
     is worn down on its own (Fleets p. 391). */
  if(!hulk) pairRows(rows);
  var trackN = function(key){
    var v = key === "shields" ? parseInt(effShieldsText(sel), 10) : key === "turrets" ? parseInt(effTurrets(sel), 10) : 6;
    return isNaN(v) ? 4 : Math.max(1, Math.min(8, v));
  };
  return {
    kind: "ship",
    /* card: which printed card. rule = an instruction card (fire ship),
       fort = the quadrant plan plus the ordinary card, squadron = one-hit
       hulls bought N at a time, capital = everything else. */
    card: sh.rc ? "rule" : sh.qd ? "fort" : escort ? "squadron" : "capital",
    /* brief: the card prints the hull's own rules only, not the rules of its
       standard weapons (rules[].weapon) - the space hulks. */
    brief: hulk,
    ruleCard: ruleCardOf(sh.rc, en ? en.mx : null, sel.list),
    countable: false,
    defence: sel.defence || sh.qd ? { stationary: isStationaryDefence(sh), ground: /ground/i.test(String(sh.ty || "")),
                                      ownPoints: defenceOwnPoints(sh) } : null,
    leadership: shipLeadership(sh),
    orders: shipOrders(sh),
    className: sh.nm,
    mechanicus: isMechanicusVessel(sh, sel.list, sel.en),
    /* no gift when the Fleet Defence Turrets refit is taken "instead of
       rolling randomly on the Mechanicus Gifts table" (Fleets p. 50) */
    gifts: isMechanicusVessel(sh, sel.list, sel.en) && !/omnissiah.s victory/i.test(sh.nm || "") &&
           !upsS.some(function(u){ return u.state === "take" && /^fleet defence turrets/i.test(String(u.label)); }),
    ref: String(intent.ref), name: String(intent.name || "").trim(),
    hulls: sel.hulls,
    entry: en ? { list: sel.list.nm, section: sel.list.secs[sel.si].t, label: en.l,
                  basePoints: en.hc ? hullPts(sel, en) : (en.p == null ? sel.custom : en.p),
                  price: en.p == null ? null : en.p, openPrice: en.p == null && !en.hc,
                  note: en.nt || "", badRef: !!en.badref, noopt: !!en.noopt } : null,
    source: { page: sh.pg, faction: String(sh.fl || "") },
    role: roleOfIntent(intent),
    members: (intent.members || []).slice(),
    squadron: escort ? squadronLimits(sel) : null,
    note: intent.note || "", adjust: sel.adjust, custom: sel.custom,
    points: pointsOf(sel), maxPoints: maxPointsOf(sel),
    stats: {
      type: sh.ty, hits: hits,
      speed: effSpeed(sel), turns: statSet(sel, "tn") || sh.tn,
      shields: effShieldsText(sel), armour: statSet(sel, "ar") || sh.ar,
      turrets: effTurrets(sel), turretLabel: sh.tl || "TURRETS",
      quadrant: !!sh.qd
    },
    weapons: rows,
    damage: {
      crippledAt: Math.ceil(hits / 2),
      /* Escorts are destroyed by one unsaved hit, never crippled; the card
         prints ESCORT_LINE for them, so the resolver says the same. */
      crippled: !isSpaceHulk(sh) && !escort,
      note: escort ? (sh.sq ? DEFENCE_ONE_HIT_LINE : ESCORT_LINE) : crippledLine(sh, rows),
      critTable: cm.title,
      critical: { title: cm.title, rows: cm.rows.map(function(r){ return r.slice(); }),
                  once: critOnce(cm),
                  icons: cm.rows === CRIT ? JSON.parse(JSON.stringify(CRIT_ICONS)) : null,
                  wide: cm.wide.slice(), foot: ghost ? String(cm.foot).replace("Critical on 4+", "Critical only on a 6 (Ghostship)") : cm.foot,
                  groups: cm.groups ? cm.groups.map(function(g){
                    return { roll: g.roll, name: g.name, how: g.how, subs: g.subs.map(function(x){
                      return { roll: x.roll, text: x.text, on: x.on || null, both: !!x.both,
                               track: x.track ? { key: x.track, n: trackN(x.track) } : null }; }) }; }) : null },
      /* Rulebook p. 66: "Escort ships which suffer a critical hit for any
         reason, such as during a boarding action, are automatically
         destroyed." ESCORT_LINE says so; an Eldar 4+ trigger would send the
         player to a table that is never rolled. */
      trigger: escort && !tanker ? null
             : ghost ? String(criticalTriggerLine(sh) || "").replace("on 4+", "only on a 6 (Ghostship)")
             : tanker ? "CRITICAL: a Hit that gets through the shields causes critical damage on 5+ (Fuel Tanker); roll 2D6."
             : criticalTriggerLine(sh),
      triggerHint: ghost ? String(criticalTriggerHint(sh) || "").replace("4+", "6 (Ghostship)")
                 : tanker ? String(criticalTriggerHint(sh) || "").replace(": 6", ": 5+ (Fuel Tanker)")
                 : criticalTriggerHint(sh),
      repair: repairLine(sh, sel.list, sel.en)
    },
    rules: rules,
    hull: en && en.hc ? { chosen: String(intent.ref), choices: (en.hulls || []).map(String),
                          options: hullOptionsOf(en, catalog) } : null,
    options: opts,
    upgrades: upsS,
    /* the ship's own re-rolls, null for nearly every ship */
    rerolls: shipRerolls(sh, upsS),
    /* victory points when they are not the cost (Demiurg, Fleets p. 486) */
    victory: victoryWorth(sh, en, ctx && ctx.host),
    issues: validateIntent(intent, ctx, catalog),
    warnings: []
  };
}
