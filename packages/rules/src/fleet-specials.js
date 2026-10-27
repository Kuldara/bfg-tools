/* Squadrons and the rules of single lists: Demiurg, Rogue Traders,
   auxiliaries, Blood Axes, Wardens, Clanz, space hulks. Called by resolveFleet. */

import { DEMIURG_CMD, SQ_BIG, SQ_CR, citeText, clanzTiddlas, isDemiurg, placeRe, placeTaken, sqClass } from "./fleet.js";

/* Squadrons by tag: sizes and classes. Returns the tags and their ships. */
export function checkSquadrons(F){
  var L = F.L, members = F.members, out = F.out;
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
  return { sqTags: sqTags, sqOf: sqOf };
}

/* Demiurg ships and mercenaries, conditional borrowed ships, Rogue Trader hulls and escorts, auxiliaries, the allied battleship. */
export function checkBorrowedShips(F){
  var L = F.L, members = F.members, worth = F.worth, out = F.out, sqTags = F.sqTags, sqOf = F.sqOf;
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
}

/* Blood Axe tiddlas, Wardens, an ally's special character, Daemonships and Veteran Captains in squadrons. */
export function checkListSpecials(F){
  var L = F.L, members = F.members, out = F.out, tookUp = F.tookUp, upRows = F.upRows, allySpecial = F.allySpecial, aboard = F.aboard, sqTags = F.sqTags, sqOf = F.sqOf;
  /* Blood Axe tiddla (Fleets p. 369, J220): commandeered Imperial Navy and
     Chaos escorts join a Blood Axe tiddla of at least six (squadron tag), at
     most three of them. Ruling T59 (ChatGPT audit RAW-02, 27.10.2026): "A
     Blood Axe tiddla skwadron of at least six escorts may include up to
     three" counts the skwadron as fielded, the commandeered escorts too, so
     three Brutes and three Cobras are a Blood Axe tiddla; J220 counted the
     Ork escorts only. The tiddla's 3-10 (p. 372, p. 370 "up to ten") is the
     size check's, over the same members (RAW-03). */
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
    var tids = clanzTiddlas(L, members);
    tagsB.sort().forEach(function(tg){
      var T = tids.filter(function(t){ return t.tag === tg; })[0];
      var orkN = T ? T.orkN : 0;
      var comN = com.filter(function(m){ return m.intent && m.intent.sq === tg; })
        .reduce(function(a, m){ return a + Math.max(1, m.hulls); }, 0);
      var axe = !!T && T.ork.some(function(i){ return baClan.some(function(x){ return tookUp(members[i], x[0], x[1]); }); });
      out.push({ ok: axe && orkN + comN >= BA.min && comN <= BA.max, t: "Blood Axe tiddla " + tg,
        v: orkN + " Ork + " + comN + " commandeered" + (axe ? "" : ", no Blood Axe clan"),
        s: citeText(BA.cite) + " Ruling T59: the six include the commandeered escorts." });
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
}

/* Da Ork Clanz: each Warlord's own command. Returns the per-Warlord counts. */
export function checkOrkClanz(F){
  var L = F.L, members = F.members, out = F.out, tookUp = F.tookUp, upRows = F.upRows, CZ = F.CZ, aboard = F.aboard, sqTags = F.sqTags, sqOf = F.sqOf;
  /* Da Ork Clanz (J216): each Warlord's own command, Fleets pp. 369-373.
     wsum (J226): the same counts per Warlord for the fleet pane's Warlord
     block, so it can say what is missing instead of only that it is red. */
  var wsum = [];
  if(CZ && CZ.warlords.length){
    var C = L.clanz;
    var secIx = function(re){ var x = new RegExp(re, "i"); return L.secs.findIndex(function(sc){ return x.test(String(sc.t).trim()); }); };
    var inSec = function(m, re){ return m.own && L.secs[m.si] && new RegExp(re, "i").test(String(L.secs[m.si].t).trim()); };
    var clanRows = upRows(secIx(C.clan_sec)), gubRows = upRows(secIx(C.gub_sec), new RegExp(C.gub_re, "i"));
    var tids = clanzTiddlas(L, members);
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
        /* tiddlas as the player made them (clanzTiddlas, RAW-01): a tag of
           Brutes and Onslaughts is one, an untagged row is one; commandeered
           escorts are in their tiddla, not a skwadron of their own (J220) */
        var tid = tids.filter(function(t){ return CZ.of[t.ork[0]] === wi; }).length;
        var groups = {};
        mine.forEach(function(m){
          if(inSec(m, C.tiddla) || (L.bloodaxe && inSec(m, L.bloodaxe.sec))) return;
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
      /* the Warlord's own clan (intent.clan, the clan picked for him) is
         his skwadrons' clan whether or not they buy its benefit (p. 369:
         being of a clan "does not obligate the skwadron to take the
         benefits"), so a ship that bought another clan is a second clan
         (ChatGPT audit RAW-04, 27.10.2026) */
      var wClan = w.intent && w.intent.clan ? String(w.intent.clan) : "";
      var clans = wClan ? [wClan] : [];
      mine.concat([w]).forEach(function(m){ clansOf(m).concat(bornClan(m)).forEach(function(c){ if(clans.indexOf(c) < 0) clans.push(c); }); });
      /* "Snakebite capital ship skwadrons can only use space hulks or roks"
         (p. 369): a Snakebite Warlord's kroozer is red even when it did not
         buy the clan, because it is of his clan all the same */
      if(C.snake && wClan && new RegExp(C.snake_clan, "i").test(wClan)){
        var notSnake = mine.filter(function(m){
          return !m.escort && !inSec(m, C.tiddla) && !inSec(m, C.hulk) && !inSec(m, C.rok) &&
            !(L.bloodaxe && inSec(m, L.bloodaxe.sec)); });
        out.push({ ok: !notSnake.length, t: tag + "Snakebite capital ships",
          v: notSnake.length ? notSnake.map(function(m){ return m.en.l; }).join(", ") + ": not a hulk or Rok" : "hulks and Roks only",
          s: citeText(C.snake) });
      }
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
       pays once). sqTags holds every non-escort skwadron, Roks included.
       A ship of one clan by itself counts with that clan (J242, user
       27.10.2026: Zukov's Klaw is a Goff with no clan row to buy, so Zukov
       and a kroozer that bought Goffs are one Goff skwadron - this used to
       read "none / Goffs"). */
    sqTags.forEach(function(tag){
      var ms = sqOf[tag], sets = ms.map(function(m){
        var cs = clansOf(m); bornClan(m).forEach(function(c){ if(cs.indexOf(c) < 0) cs.push(c); });
        return cs.sort().join(","); });
      if(sets.some(function(x){ return x; }) && sets.some(function(x){ return x !== sets[0]; }))
        out.push({ ok: false, t: "Squadron " + tag + ": the clan on every ship",
          v: sets.map(function(x){ return x || "none"; }).join(" / "), s: citeText(C.clan_sq) });
    });
    /* a skwadron is one Warlord's (J232, Fleets p. 373: "you can't split up
       skwadrons"); a tag across two Warlords is a split skwadron */
    var splitOf = function(label, ixs){
      var wl = [];
      ixs.forEach(function(i){ var w = CZ.of[i]; if(w >= 0 && wl.indexOf(w) < 0) wl.push(w); });
      if(wl.length > 1) out.push({ ok: false, t: label + ": one Warlord",
        v: wl.map(function(w){ return "Warlord " + (CZ.warlords.indexOf(members[w]) + 1); }).join(" + "), s: citeText(C.split) });
    };
    if(C.split){
      sqTags.forEach(function(tag){ splitOf("Squadron " + tag, sqOf[tag].map(function(m){ return members.indexOf(m); })); });
      tids.forEach(function(t){ if(t.tag) splitOf("Tiddla skwadron " + t.tag, t.ork); });
    }
  }
  return wsum;
}

/* A Warlord aboard a space hulk: Extra Powerfields at its own price. */
export function checkHulkPowerfields(F){
  var L = F.L, members = F.members, out = F.out, tookUp = F.tookUp, upRows = F.upRows, aboard = F.aboard;
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
}
