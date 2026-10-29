import { defenceOwnPoints } from "./crits.js";

/* Fleet-level helpers the checks share: Xenos members, victory worth, fleet
   facts, squadron classes, Demiurg, where commanders ride (placeCommanders)
   and the Clanz command. resolveFleet itself is in resolve-fleet.js. */

/* An alien vessel for the Mechanicus reserve rules ("alien vessels of any
   type", "Xenos vessels", Fleets pp. 121-123, J213): a hull whose profile is
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
   (p. 304): a borrowed ship its own list's race and name, a ship from the
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
     Lord's 3, p. 149; T53). */
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
  /* What the enemy fleet adds for free: with an Ordo Malleus Inquisitor
     Lord one, and one more per Grey Knights Strike Cruiser (Fleets p. 154,
     needs), one for an Ordo Malleus Inquisitor (p. 152), D6x50 points of
     escorts for an Ordo Xenos Inquisitor (p. 151). */
  (L.opp || []).forEach(function(o){
    if(o.needs && !members.some(function(m){ return m.en && new RegExp(o.needs, "i").test(String(m.en.l)); })) return;
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
   on the Inquisitorial Cruiser, else the Blackship (p. 148), a Chaos
   Warmaster on the most expensive ship but never a Daemonship (pp. 242-253),
   a Chaos Lord on any capital ship but the Warmaster's or Abaddon's (pp. 232,
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
     fleet's points (pp. 500, 334) - never a platform or a station */
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
   p. 374). intent.cmd names him (his uid); without it the ship is the
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
  /* A Blood Axe tiddla's commandeered escorts (Fleets p. 371) are in the
     command of their tiddla's Warlord: his summary, his dearest ship (p. 374)
     and his checks see them (ChatGPT audit RAW-03, 27.10.2026). */
  clanzTiddlas(L, members).forEach(function(t){
    var wi = of[t.ork[0]];
    t.com.forEach(function(i){ of[i] = wi; });
  });
  return { warlords: ws, of: of };
}
/* Explicit escort squadrons (L.esq, 27.10.2026): in a list whose rules count
   escort squadrons - Rogue Traders p. 184, Exploration p. 187, Pirates and
   Wolf Packs p. 189, Tau Commerce Protection p. 457, Demiurg War Host
   p. 487 - escort cards with the same squadron letter are one squadron, a
   card without one is a squadron by itself. The size check (ruleSquadron)
   and the counting rules (count with units) both read these keys, as the
   Clanz tiddlas do. Returns each member's key: "sq:<letter>" or "u:<index>". */
export function escortSquadronKeys(L, members){
  return members.map(function(m, i){
    return L && L.esq && m.escort && !m.defence && m.unitRow && m.intent && m.intent.sq ? "sq:" + m.intent.sq : "u:" + i; });
}
/* Da Ork Clanz tiddla skwadrons: "3-10 Escorts, chosen from the following
   list in any mix desired" (Fleets p. 374). Escort rows of one tag are one
   skwadron, a row without a tag is a skwadron by itself, and a Blood Axe
   tiddla's commandeered Imperial Navy and Chaos escorts (p. 371) are members
   of the tiddla of their tag. Every Clanz check reads these, so two rows are
   never one skwadron for the size check and two for the Warlord's count
   (ChatGPT audit RAW-01, 27.10.2026). Returns [{ tag, ork: [member index],
   com: [member index], orkN, comN, n }] - n counts the escorts. */
export function clanzTiddlas(L, members){
  var C = L && L.clanz;
  if(!C) return [];
  var inS = function(m, re){
    return !!re && m.own && m.unitRow && !!L.secs[m.si] && new RegExp(re, "i").test(String(L.secs[m.si].t).trim()); };
  var out = [], byTag = {};
  members.forEach(function(m, i){
    if(!inS(m, C.tiddla)) return;
    var tg = (m.intent && m.intent.sq) || null, t = tg && byTag[tg];
    if(!t){ t = { tag: tg, ork: [], com: [] }; out.push(t); if(tg) byTag[tg] = t; }
    t.ork.push(i);
  });
  members.forEach(function(m, i){
    var tg = m.intent && m.intent.sq;
    if(tg && byTag[tg] && inS(m, L.bloodaxe && L.bloodaxe.sec)) byTag[tg].com.push(i);
  });
  var hullsOf = function(ix){ return ix.reduce(function(a, i){ return a + Math.max(1, members[i].hulls); }, 0); };
  out.forEach(function(t){ t.orkN = hullsOf(t.ork); t.comN = hullsOf(t.com); t.n = t.orkN + t.comN; });
  return out;
}
export function placeCommanders(L, members, cmdOf){
  var P = (L && L.place) || [];
  var ships = members.filter(carriesCommander);
  var cost = function(m){ return m.points / Math.max(1, m.hulls); };
  var byUid = {};
  members.forEach(function(m){ if(m.intent && m.intent.uid) byUid[m.intent.uid] = m; });
  /* a borrowed commander keeps his own list's placement rule (Yriel's
     Dragonship, Fleets p. 317, aboard an Exploration fleet - J221) */
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
       Fleets p. 374), not of the whole fleet */
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

