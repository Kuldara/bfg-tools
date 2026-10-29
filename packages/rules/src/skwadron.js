import { clanzTiddlas } from "./fleet.js";
import { upgradeId } from "./legacy.js";
import { isUpgradeEnt, selectionOf, upState, upgradeKey, upgradesFor } from "./upgrades.js";

/* ---- A tiddla skwadron's own upgrades (ruling T60, 28.10.2026) ----
   Da Ork Clanz: "The point cost for clan upgrades for tiddla skwadrons count
   for the whole skwadron (regardless of how large it is!), not individual
   escorts" (Fleets p. 371), and "For tiddla skwadrons, the point cost for
   Gubbins count for the whole skwadron (regardless of how large it is!), not
   individual escorts" (p. 372). A mixed tiddla is the rows of one tag
   (clanzTiddlas), so a clan or a Gubbin is the skwadron's, not a row's:
   taken on any of its rows, every row of the skwadron that is offered it has
   it, and it is paid once - on the first row that took it itself, else on
   the first row offered it, in fleet order. A row priced per escort (Klaws
   for Grunts, "+5 points per escort", p. 373) stays each row's own. A Blood
   Axe tiddla's commandeered escorts (p. 371) are of its skwadron too.

   Read with the simulator's own workaround (28.10.2026: bought on one row,
   the effect copied to the others), which this replaces. */

/* A row whose price and effect are the tiddla skwadron's: the list's clan
   and Gubbins rows, not one priced per hull or per launch bay. */
export function isSkwadronUpgrade(L, si, en){
  var C = L && L.clanz, sec = L && L.secs[si];
  if(!C || !sec || !isUpgradeEnt(en) || en.incl || en.req || en.per === "hull" || en.per === "bay") return false;
  var t = String(sec.t).trim();
  return [C.clan_sec, C.gub_sec].some(function(re){ return !!re && new RegExp(re, "i").test(t); });
}

function skwadrons(intents, L, catalog){
  var c0 = { list: L, host: L };
  var members = intents.map(function(it){
    var sel = it ? selectionOf(it, c0, catalog) : null;
    return { intent: it || {}, own: !!(sel && sel.list && sel.list.nm === L.nm), unitRow: !!(sel && sel.en) && !isUpgradeEnt(sel.en),
             si: sel ? sel.si : -1, hulls: sel ? sel.hulls : 1 };
  });
  return clanzTiddlas(L, members).filter(function(t){ return !!t.tag; }).map(function(t){
    return t.ork.concat(t.com).sort(function(a, b){ return a - b; }); });
}

/* The other rows of the tiddla skwadron that intents[i] is a row of, by
   index; [] when it is not one. The builder gives them the answer the
   player gives one of them (one choice for the skwadron). */
export function skwadronMates(intents, i, ctx, catalog){
  var L = ctx && (ctx.host || ctx.list);
  if(!L || !L.clanz || !intents[i] || !intents[i].sq) return [];
  var g = skwadrons(intents, L, catalog).filter(function(ix){ return ix.indexOf(i) >= 0; })[0];
  return g ? g.filter(function(j){ return j !== i; }) : [];
}

/* Returns the intents with every row of such a skwadron as a copy: the
   skwadron's upgrades taken (upgrades[id] = "take") and, on every row but
   the one that pays, shared[id] = the paying row's label. shared is derived,
   never saved: resolveFleet and the apps call this before they resolve the
   rows, and an incoming shared is worked out again. Rows outside such a
   skwadron are the same objects. */
export function shareSkwadronUpgrades(intents, ctx, catalog){
  var L = ctx && (ctx.host || ctx.list);
  var list = intents || [];
  var stale = list.some(function(it){ return it && it.shared; });
  if(!L || !L.clanz || (!stale && !list.some(function(it){ return it && it.sq; }))) return list;
  var c0 = { list: L, host: L };
  var copy = function(it){
    var x = JSON.parse(JSON.stringify(it));
    x.upgrades = x.upgrades || {};
    delete x.shared;
    return x;
  };
  var cur = list.map(function(it){ return it && it.shared ? copy(it) : it; });
  var own = function(i){ if(cur[i] === list[i]) cur[i] = copy(list[i]); return cur[i]; };
  /* the skwadron rows a row is offered: key -> upgrade id */
  var rowsOf = function(sel){
    var out = {}, u = upgradesFor(sel);
    u.own.concat(u.other).forEach(function(x){
      if(isSkwadronUpgrade(L, x[0], x[2])) out[upgradeKey(x[0], x[1])] = upgradeId(L.nm, L.secs[x[0]].t, x[2].l);
    });
    return out;
  };
  var takenIn = function(sel, rows){
    return Object.keys(rows).filter(function(key){ var p = key.split(":"); return upState(sel, +p[0], +p[1]) === "take"; }); };
  skwadrons(cur, L, catalog).forEach(function(ix){
    if(ix.length < 2) return;
    /* who took it on his own row, before anything is shared: a row that
       came in with shared[id] has it from the skwadron, not of its own, so
       sharing again changes nothing */
    var first = {};
    ix.forEach(function(i){
      var s = selectionOf(cur[i], c0, catalog), rows = rowsOf(s), was = (list[i] && list[i].shared) || {};
      takenIn(s, rows).forEach(function(key){ if(!(key in first) && !was[rows[key]]) first[key] = i; });
    });
    /* a clan opens rows of its own on every row it reaches (Deathskullz'
       free looted upgrades, p. 371), so this runs until nothing is added */
    var offer = [], taken = {};
    for(var pass = 0; pass < 4; pass++){
      var sels = ix.map(function(i){ return selectionOf(cur[i], c0, catalog); });
      offer = sels.map(rowsOf);
      taken = {};
      sels.forEach(function(s, k){ takenIn(s, offer[k]).forEach(function(key){ taken[key] = offer[k][key]; }); });
      var added = false;
      ix.forEach(function(i, k){ Object.keys(taken).forEach(function(key){
        var p = key.split(":");
        if(!offer[k][key] || upState(sels[k], +p[0], +p[1]) === "take") return;
        own(i).upgrades[taken[key]] = "take"; added = true;
      }); });
      if(!added) break;
    }
    Object.keys(taken).forEach(function(key){
      var at = ix.filter(function(i, k){ return !!offer[k][key]; });
      var payer = at.indexOf(first[key]) >= 0 ? first[key] : at[0];
      var by = String((cur[payer].entry && cur[payer].entry.label) || "another row");
      at.forEach(function(i){
        if(i === payer) return;
        var x = own(i);
        x.shared = x.shared || {};
        x.shared[taken[key]] = by;
      });
    });
  });
  return cur;
}
