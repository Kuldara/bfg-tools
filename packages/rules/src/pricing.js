import { optionsOf } from "./unit.js";
import { bayStrength, isUpgradeEnt, optCount, optState, secOf, sharedBy, upSecs, upState, upgradeKey, upgradesFor } from "./upgrades.js";

export function upCost(sel, en){
  /* pct: "+10% point value" (Rogue Trader crew skill, Fleets p. 175) - a share
     of the unit's points before this row, rounded up as the Rulebook rounds
     (pp. 88, 99). The list has no fixed price, so the row shows "see text". */
  if(en.pct) return Math.ceil(pctBase(sel) * en.pct / 100);
  if(en.p == null) return 0;
  if(en.per === "hull") return en.p * sel.hulls;
  /* Fleets p. 22 prices torpedo bombers "per Strength point of the launch
     bays on the vessel": an escort squadron pays for the bays of each ship. */
  if(en.per === "bay") return en.p * bayStrength(sel.sh, sel).n * (sel.escort ? sel.hulls : 1);
  return en.p;
}

/* Price what is actually offered, not what the raw state still remembers.
   A row that upgradesFor() hides - because the ship no longer qualifies,
   or because the ship's own option already covers it - must not keep
   charging. Visibility, the card and the price read the same set. A row
   another row of its tiddla skwadron pays for (sharedBy, ruling T60) is
   taken and costs nothing here. */
export function upgradePts(sel){
  var p = 0;
  var ups = upgradesFor(sel);
  ups.own.concat(ups.other).forEach(function(x){
    if(upState(sel, x[0], x[1]) === "take" && !sharedBy(sel, x[0], x[1])) p += upCost(sel, x[2]);
  });
  return p;
}

/* Fleets p.102: a Venerable battle barge is "chosen from any available
   Imperial or Chaos battleship, grand cruiser, battlecruiser or heavy
   cruiser at the listed cost, plus an additional +35 points for its Space
   Marine crew". The Seditio Opprimere (p.103) is the book's own venerable
   barge and already a Space Marine vessel, so it costs its listed price. */
export function hullPts(sel, en){
  var sh = sel.sh;
  if(!sh) return 0;
  var crew = !sh.ven && /SPACE MARINES/i.test(String(sh.fl || "")) ? 0 : (en.hcp || 0);
  return (sh.bp || 0) + crew;
}

/* Final price. null for a unit without a list row: it has a profile but no
   price (a defence bought outside the list). */
/* Hull and taken ship options - the part of the price every other part
   builds on. */
export function hullOptionPts(sel){
  var en = sel.en, sh = sel.sh;
  var p = (en.hc ? hullPts(sel, en) : en.p == null ? (sel.custom | 0) : en.p) * sel.hulls;
  if(sh) sh.ol.forEach(function(o, i){
    if(o.c != null && optState(sel, i) === "take")
      p += o.c * optCount(sel, i) * (sel.escort ? sel.hulls : 1);
  });
  return p;
}

export function pointsOf(sel){
  if(!sel.en) return null;
  return hullOptionPts(sel) + upgradePts(sel) + (sel.adjust | 0);
}

/* The points a percentage row is taken of: hull, options and every other
   taken upgrade, but not the percentage rows themselves. */
export function pctBase(sel){
  if(!sel.en) return 0;
  var p = hullOptionPts(sel);
  var ups = upgradesFor(sel);
  ups.own.concat(ups.other).forEach(function(x){
    if(!x[2].pct && upState(sel, x[0], x[1]) === "take" && !sharedBy(sel, x[0], x[1])) p += upCost(sel, x[2]);
  });
  return p;
}

/* Ceiling price: what the unit costs if every choice still left open is
   ticked at the table. Only options that raise the price count; mutually
   exclusive ones count once, at the dearest. */
export function flatMaxPointsOf(sel){
  var sh = sel.sh;
  var p = pointsOf(sel);
  if(p == null) return null;
  /* The largest LEGAL price: of a choose-one group only the dearest member
     counts, and a group with a member already taken is decided - its other
     members cannot be added on top (8 Kraken with Massive Claws: 280 now,
     320 at most, never 400; Fleets p. 429). */
  var seen = {}, decided = {};
  var blockedOpt = optionsOf(sel).map(function(o){ return o.blockedBy.length > 0; });
  if(sh) sh.ol.forEach(function(o, i){
    if(o.grp && optState(sel, i) === "take") decided["opt:" + o.grp] = 1;
  });
  if(sel.list) upSecs(sel).forEach(function(sec, si){ sec.ents.forEach(function(en, ei){
    if(isUpgradeEnt(en) && en.grp && upState(sel, si, ei) === "take") decided[en.grp] = 1;
  }); });
  /* A dependent option (Impaler II needs Impaler I, boarding torpedoes need
     the launcha) rides on its prerequisite: it counts only while the
     prerequisite can still be taken, and inside the prerequisite's group it
     is added to that member - the Torture takes launch bays (40) or two
     Impalers (20 + 20), never both (Fleets p. 352). */
  var optCost = function(o){ return o.c * (o.qty ? (o.qty.max || 1) : 1) * (sel.escort ? sel.hulls : 1); };
  var depAdd = {};
  if(sh) sh.ol.forEach(function(o, i){
    if(o.dep == null || !(o.c > 0) || optState(sel, i) !== "opt" || blockedOpt[i]) return;
    var d = o.dep, pre = sh.ol[d];
    if(!pre) return;
    var ds = optState(sel, d);
    if(ds === "take"){ p += optCost(o); return; }
    if(ds !== "opt" || blockedOpt[d] || (pre.grp && decided["opt:" + pre.grp])) return;
    depAdd[d] = (depAdd[d] || 0) + optCost(o);
  });
  if(sh) sh.ol.forEach(function(o, i){
    if(o.dep != null || optState(sel, i) !== "opt" || blockedOpt[i]) return;
    var c = (o.c > 0 ? optCost(o) : 0) + (depAdd[i] || 0);
    if(!(c > 0)) return;
    if(o.grp){ if(!decided["opt:" + o.grp]) seen["opt:" + o.grp] = Math.max(seen["opt:" + o.grp] || 0, c); }
    else p += c;
  });
  if(sel.list) upSecs(sel).forEach(function(sec, si){ sec.ents.forEach(function(en, ei){
    if(!isUpgradeEnt(en) || upState(sel, si, ei) !== "opt") return;
    if(en.grp){
      if(!decided[en.grp]) seen[en.grp] = Math.max(seen[en.grp] || 0, upCost(sel, en), 0);
      return;
    }
    p += Math.max(0, upCost(sel, en));
  }); });
  Object.keys(seen).forEach(function(g){ p += seen[g]; });
  return p;
}

/* Ceiling price: the dearest LEGAL way to tick the choices still open -
   not their sum. Choices exclude each other in ways a sum cannot see: a
   Lunar's nova cannon closes the Power Ram (Fleets p. 32) and the special
   torpedoes it would have no torpedoes for, torpedo bombers and orbital
   mines share the bays (Fleets pp. 22-23), a Tyranid cruiser takes two
   bio-enhancements (p. 426). The domain's own rules say what stays open
   after a tick; a choice that neither closes nor opens another is simply
   added, and only the ones that do are searched, dearest first, cutting
   every branch that cannot beat the best so far. A unit with too many
   interacting choices falls back to the flat sum above. */
export var MAX_SEARCH_NODES = 600;
/* The same unit in the same state is asked again on every render: the
   answer is kept by what it depends on. */
export var MAXPTS = {}, MAXPTS_N = 0;
export function maxPointsOf(sel){
  var sig = JSON.stringify([sel.list && sel.list.nm, sel.host && sel.host.nm, sel.si, sel.ei, sel.sh && [sel.sh.nm, sel.sh.pg],
                            sel.ost, sel.oqty, sel.ups, sel.shared, sel.hulls, sel.adjust, sel.custom, sel.escort]);
  if(Object.prototype.hasOwnProperty.call(MAXPTS, sig)) return MAXPTS[sig];
  var v = maxPointsSearch(sel);
  if(++MAXPTS_N > 3000){ MAXPTS = {}; MAXPTS_N = 1; }
  MAXPTS[sig] = v;
  return v;
}
export function maxPointsSearch(sel){
  var base = pointsOf(sel);
  if(base == null) return null;
  var sh = sel.sh, ol = (sh && sh.ol) || [];
  var escortMul = sel.escort ? sel.hulls : 1;
  var bioCap = (function(){ var t = String(sh && sh.ty || ""); return /escort/i.test(t) ? 1 : /battleship/i.test(t) ? 3 : 2; })();
  var isBio = function(s, si){ var sec = secOf(s, si); return !!sec && String(sec.t).trim().toUpperCase() === "BIO-ENHANCEMENTS"; };
  var take = function(s, items){
    var ost = Object.assign({}, s.ost), oqty = Object.assign({}, s.oqty), ups = Object.assign({}, s.ups);
    items.forEach(function(it){
      if(it.i != null){ ost[it.i] = "take"; var q = ol[it.i].qty; if(q && q.max > 1) oqty[it.i] = q.max; }
      else ups[it.key] = "take";
    });
    return Object.assign({}, s, { ost: ost, oqty: oqty, ups: ups });
  };
  /* A free option is a choice of its own here only when a priced one hangs
     on it: the Kill Kroozer's torpedo launcha costs nothing, and its
     boarding torpedoes (+5) can be bought only once it is fitted (Fleets
     p. 382); the Dragonship's Vampire raiders (+10) need the launch bays
     (p. 330). behind[i] is the most that option i can unlock, through any
     chain of prerequisites - the search must tick the free one to reach it,
     and its bound must know what waits there. */
  var behind = {};
  for(var pass = 0; pass < ol.length; pass++){
    var next = {};
    ol.forEach(function(o, j){
      if(o.dep == null || !ol[o.dep]) return;
      next[o.dep] = (next[o.dep] || 0) + (o.c > 0 ? o.c * (o.qty ? (o.qty.max || 1) : 1) * escortMul : 0) + (behind[j] || 0);
    });
    if(JSON.stringify(next) === JSON.stringify(behind)) break;
    behind = next;
  }
  /* the priced choices still open in selection s */
  var OPEN = typeof WeakMap === "function" ? new WeakMap() : null;
  var open = function(s){
    var hit = OPEN && OPEN.get(s);
    if(hit) return hit;
    var out = [], opts = optionsOf(s);
    ol.forEach(function(o, i){
      if(optState(s, i) !== "opt" || !(o.c > 0 || behind[i] > 0)) return;
      if(s.en && s.en.optno && new RegExp(s.en.optno, "i").test(String(o.t || ""))) return;
      if(o.dep != null && optState(s, o.dep) !== "take") return;
      if(opts[i] && opts[i].blockedBy.length) return;
      out.push({ k: "o" + i, i: i, c: (o.c > 0 ? o.c : 0) * (o.qty ? (o.qty.max || 1) : 1) * escortMul, o: o });
    });
    if(s.list){
      var u = upgradesFor(s), bio = {};
      u.own.concat(u.other).forEach(function(x){
        if(isBio(s, x[0]) && upState(s, x[0], x[1]) === "take") bio[x[2].grp || x[2].l] = 1; });
      var bioFull = Object.keys(bio).length >= bioCap;
      u.own.concat(u.other).forEach(function(x){
        if(x[2].req || upState(s, x[0], x[1]) !== "opt") return;
        var b = isBio(s, x[0]);
        if(b && (bioFull || bio[x[2].grp || x[2].l])) return;
        var c = x[2].pct ? Math.ceil(base * x[2].pct / 100) + 1 : Math.max(0, upCost(s, x[2]));
        if(c > 0) out.push({ k: "u" + upgradeKey(x[0], x[1]), key: upgradeKey(x[0], x[1]), c: c, pct: !!x[2].pct, bio: b ? (x[2].grp || x[2].l) : null, en: x[2] });
      });
    }
    if(OPEN) OPEN.set(s, out);
    return out;
  };
  var keys = function(list){ return list.map(function(it){ return it.k; }); };
  var root = open(sel);
  if(!root.length) return base;
  /* Which choices interact: ticking one closes or opens another. The
     bio-enhancements only count against their cap (Fleets p. 426), so they
     are settled apart: the dearest kinds up to the cap. */
  /* Only a choice that changes what the rules look at can close or open
     another: a weapon it brings, swaps or removes (has / no / torpedo
     strength), a hull change, a choose-one group, a label another row's
     up / noup names, a condition that blocks an option, an option another
     depends on. The rest are inert and need no trial. */
  var named = [];
  upSecs(sel).forEach(function(sec){ (sec.ents || []).forEach(function(e2){
    if(isUpgradeEnt(e2) && e2.cond){ if(e2.cond.up) named.push(new RegExp(e2.cond.up, "i")); if(e2.cond.noup) named.push(new RegExp(e2.cond.noup, "i")); }
  }); });
  var depOn = {}; ol.forEach(function(o){ if(o.dep != null) depOn[o.dep] = 1; });
  var active = function(a){
    if(a.o) return !!(a.o.sw || a.o.add || a.o.del || a.o.mod || a.o.cov || a.o.grp || a.o.swp || depOn[a.i]);
    var e = a.en;
    return !!(e.grp || e.swp || e.add || e.mod || (e.cond && e.cond.no) || named.some(function(rx){ return rx.test(String(e.l || "")); }));
  };
  var rootKeys = keys(root), inter = {};
  root.forEach(function(a){
    if(a.bio || !active(a)) return;
    var aft = keys(open(take(sel, [a])));
    var lost = rootKeys.filter(function(k){ return k !== a.k && aft.indexOf(k) < 0; });
    var gained = aft.filter(function(k){ return rootKeys.indexOf(k) < 0; });
    if(lost.length || gained.length){ inter[a.k] = 1; lost.forEach(function(k){ inter[k] = 1; }); }
  });
  var indep = root.filter(function(a){ return !inter[a.k] && !a.bio; });
  var indepKey = {}; indep.forEach(function(a){ indepKey[a.k] = 1; });
  /* a state's value: its price with every independent choice still open
     ticked as well */
  var value = function(s){
    var op = open(s), o = keys(op);
    var add = indep.filter(function(a){ return o.indexOf(a.k) >= 0; });
    /* bio-enhancements: one row per kind, the dearest kinds up to the cap */
    var kinds = {}, taken = {};
    if(s.list){ var u = upgradesFor(s); u.own.concat(u.other).forEach(function(x){
      if(isBio(s, x[0]) && upState(s, x[0], x[1]) === "take") taken[x[2].grp || x[2].l] = 1; }); }
    op.forEach(function(it){ if(it.bio && !taken[it.bio] && (!kinds[it.bio] || kinds[it.bio].c < it.c)) kinds[it.bio] = it; });
    var room = Math.max(0, bioCap - Object.keys(taken).length);
    add = add.concat(Object.keys(kinds).map(function(k){ return kinds[k]; })
      .sort(function(p, q){ return q.c - p.c; }).slice(0, room));
    return pointsOf(add.length ? take(s, add) : s);
  };
  var best = base, nodes = 0, capped = false;
  var walk = function(s, skipped){
    if(++nodes > MAX_SEARCH_NODES){ capped = true; return; }
    var v = value(s);
    if(v > best) best = v;
    var items = open(s).filter(function(it){ return !indepKey[it.k] && !it.bio && !skipped[it.k]; });
    if(!items.length) return;
    /* optimistic bound: a choose-one group counts only its dearest
       members (as many as it allows), everything else in full */
    var sum = 0, pct = 0, grp = {};
    items.forEach(function(it){
      var g = it.o && it.o.grp ? "o:" + it.o.grp : it.en && it.en.grp ? "u:" + it.en.grp : null;
      /* what the choice costs and what it can unlock (behind) */
      var c = it.c + (it.i != null ? (behind[it.i] || 0) : 0);
      if(g){ (grp[g] = grp[g] || { n: it.o ? Math.max(1, it.o.gmax || 1) : 1, c: [] }).c.push(c); return; }
      if(it.pct) pct += it.c; else sum += c;
    });
    Object.keys(grp).forEach(function(g){
      grp[g].c.sort(function(p, q){ return q - p; }).slice(0, grp[g].n).forEach(function(c){ sum += c; }); });
    if(v + sum + pct * 2 <= best) return;
    items.sort(function(p, q){ return q.c - p.c; });
    var it = items[0];
    walk(take(s, [it]), skipped);
    if(capped) return;
    var sk = Object.assign({}, skipped); sk[it.k] = 1;
    walk(s, sk);
  };
  walk(sel, {});
  if(capped) return Math.max(best, flatMaxPointsOf(sel));
  return best;
}

/* Strength text multiplied for a weapon bought several times (Hive Ship
   side sets): plain numbers and "n / n squadrons" are summed, anything
   else gets " xN". */
export function timesStrength(txt, n){
  var t = String(txt == null ? "" : txt);
  if(n <= 1) return t;
  if(!/^\s*\d+(\s*\/\s*\d+)*(\s*squadrons?)?\s*$/i.test(t)) return t + " \u00d7" + n;
  var out = t.replace(/\d+/g, function(m){ return String(parseInt(m, 10) * n); });
  if(/squadron/i.test(out) && !/squadrons/i.test(out)) out = out.replace(/squadron/i, "squadrons");
  return out;
}

/* The weapon table in force: base rows, alternatives, list-brought rows,
   option-brought rows, deletions and in-place changes. Every row's a[] is a
   fresh array - never an element of the catalogue's aw/sw/add tables. */
/* Is the open swap option o ruled out by a list row already taken - a row
   whose condition excludes the weapon o would bring (Power Ram vs Nova
   Cannon, Fleets p. 32), or a taken list swap holding a row o would
   replace? Read from the answers alone: weaponRows is itself used by the
   condition checks, so it must not call them. */
export function swapRuledOutByUp(sel, o){
  if(!sel.list || !sel.sh) return false;
  var names = (o.sw.t || []).map(function(t){ return String(t[0] || ""); }), hit = false;
  upSecs(sel).forEach(function(sec, si){ (sec.ents || []).forEach(function(en, ei){
    if(hit || !isUpgradeEnt(en) || sel.ups[upgradeKey(si, ei)] !== "take") return;
    if(en.cond && en.cond.no){
      var rx = new RegExp(String(en.cond.no).split("@")[0], "i");
      if(names.some(function(nm){ return rx.test(nm); })) hit = true;
    }
    if(!hit && en.swp){
      var rx2 = new RegExp(en.swp.f, "i");
      if((o.sw.f || []).some(function(fi){ return sel.sh.aw[fi] && rx2.test(String(sel.sh.aw[fi][0])); })) hit = true;
    }
  }); });
  return hit;
}
