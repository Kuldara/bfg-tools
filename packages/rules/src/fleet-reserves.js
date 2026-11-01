/* Reserves and allies (Fleets pp. 14-16): types, races, bans and sources.
   Called by resolveFleet. */

import { isXenosMember } from "./fleet.js";

/* Reserves and allies: the three types, exemptions and the Mechanicus' own rules. */
export function checkReserveTypes(F){
  var L = F.L, members = F.members, out = F.out, allySpecial = F.allySpecial;
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
     reserve rules. Fleets p. 317, Prince Yriel: "if the Flame of Asuryan with
     Yriel is added to the parent fleet it is exempt from the reserve rules"
     - the book's own example is a Corsair list that does not field three
     capital ships. It is the Flame WITH Yriel, so a Hero-led fleet still
     needs its three cruisers, and so does a Dragonship carrying Yriel. One
     hull: the Flame is unique (p. 327). */
  var RX = L.res_exempt || null, rxShip = null;
  if(RX && members.some(function(x){
       return x.own && x.en && x.en.k === "cmd" && new RegExp(RX.needs_re, "i").test(String(x.en.l)); }))
    rxShip = members.filter(function(m){
      return m.role === "reserve" && m.unitRow && m.hulls === 1 && new RegExp(RX.re, "i").test(String(m.en.l)); })[0] || null;
  if(rxShip) out.push({ ok: true, t: "Exempt from the reserve rules: " + rxShip.en.l, v: "with Prince Yriel",
                        s: RX.src + " (Fleets p. " + RX.pg + ")" });
  /* The Flame is unique (p. 327). A borrowed row's own 0-1 is the donor
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
  members.filter(function(m){ return m.role !== "core" && typeOf(m) === "none" && !allySpecial(m); })
    .forEach(function(m){
      out.push({ ok: false, t: "Not a reserve type: " + (m.en ? m.en.l : "?"),
        v: "battleship, cruiser or escort", s: "Only ships of the same 'type' "
          + "(battleship, cruiser or escort) count for reserves purposes. "
          + "(Fleets p. 14)" });
    });
}

/* Reserves and allies: race, never-allies and the list's own bans, one row per thing said. */
export function checkReserveRaces(F){
  var L = F.L, members = F.members, out = F.out;
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
       as reserves or allies" (Fleets p. 99, and the same on p. 155 for the
       Grey Knights). Both directions, and it beats every grant: the sentence
       is the list's own and more specific than p. 149's Inquisitor licence. */
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
         vessels as reserves" (Fleets p. 314, and the mirror on p. 317). */
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
}

/* Reserves and allies: a reserve of a reserve, Xenos allies, headings with no counterpart, own-list ships from elsewhere. */
export function checkReserveSources(F){
  var L = F.L, members = F.members, out = F.out, matches = F.matches;
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
    /* The same question matches() asks: is there a host section holding a
       ship of this p. 14 category and class? */
    return !L.secs.some(function(sec, si){ return matches(m, si, null); });
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
}
