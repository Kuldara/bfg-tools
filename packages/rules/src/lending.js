/* ====================== P1-8b: pure calculators ======================
   A Selection is the intent resolved against the catalogue once: the ship,
   the list row, option states and counts by option index, upgrade states by
   "si:ei". Every calculator below takes it as its first argument and reads
   nothing else. Indexes exist only inside this object; the intent carries
   ids (docs/DOMAIN_CONTRACT.md). */
/* The list a unit belongs to. A fleet can hold ships from more than one
   list (Fleets p. 14, reserves and allies), so the unit's own entry decides,
   not the fleet's context: a Bastion Fleets cruiser in an Imperial Navy fleet
   keeps its own row, its own price and its own list's upgrades. The context
   is only the fallback for a unit that names no list. */
export function listByName(catalog, nm){
  var ls = (catalog && catalog.lists) || [];
  for(var i = 0; i < ls.length; i++) if(ls[i].nm === nm) return ls[i];
  return null;
}
export function listOfIntent(intent, ctx, catalog){
  var nm = intent && intent.entry && intent.entry.list;
  var own = nm ? listByName(catalog, nm) : null;
  return own || (ctx && ctx.list ? ctx.list : null);
}
/* core = bought from the fleet's own list; reserve = another list of the same
   race (p. 14); ally = another race by a list's own rule (p. 16). */
/* ---- who lends to whom, at list level (Fleets p.14-17 + 2010 FAQ) -------
   The legality panel answers this per SHIP, once a ship has been chosen. The
   catalogue's source picker has to answer it per LIST, before anything is
   chosen, so that the player can see where ships may come from at all. Those
   two answers must never disagree: a picker that quietly said "no" to a legal
   list would be worse than a red row, because the player would never see the
   book sentence that decided it. test_domain section 13f walks all 32 x 32
   pairs and fails if the two sides differ.

   Only rules that depend on the PAIR can be answered here. Three kinds
   cannot, and the picker must not pretend otherwise:
     - row rules: lend_ban's starred ships (p. 41), a grant's not_re, and the
       donor's own reserve or access sections (p. 15, reserve of a reserve)
     - fleet rules: ally_excl's third ally, ally_xenos, a grant's needs_re
   So "this list lends" is all this says. The ship still has to pass. */
export function lendGrantFor(L, D){
  /* A list can name the same source twice, once plainly and once behind a
     condition: Dominion grants Imperial Navy vessels outright (p. 101) and
     again through the Inquisitor Lord licence (p. 149). The plain one wins,
     or the picker would put an unconditional source behind a condition just
     because of the order the rows happen to sit in. */
  var hit = null;
  (L.res_ok || []).forEach(function(g){
    if(g.race && (!D || D.race !== g.race)) return;
    if(g.list && (!D || D.nm !== g.list)) return;
    if(!g.race && !g.list) return;
    if(!hit || (hit.needs_re && !g.needs_re)) hit = g;
  });
  return hit;
}
export function allyPairOk(L, D){
  var okWith = function(rule, other){
    if(!rule) return true;
    if(rule.only) return rule.only.indexOf(other) >= 0;
    return (rule.never || []).indexOf(other) < 0;
  };
  return okWith(L.ally_rule, D.ally_race) && okWith(D.ally_rule, L.ally_race);
}
/* kind: "own" | "reserve" | "ally" | "grant" | "no"
   role: the role the book gives this ship, or null
   cond: a condition the fleet must also meet, or null
   why:  the book sentence behind a refusal or a grant, or ""

   A ship can come in by two different doors, and the rules differ by door.
   Pass `role` to ask about one of them; leave it out to ask the question the
   picker asks - "is there ANY way to take a ship from this list" - which the
   least demanding open door answers.

   Getting that order wrong is not academic. A Space Marine list lent to an
   Imperial Navy fleet is legal as an ALLY with nobody in charge (the matrix
   allows imperials and space marines), and legal as a RESERVE too, but only
   with an Inquisitor Lord leading (p. 149). Reading the grant first made the
   picker announce "needs an Inquisitor Lord" and mark all nine rows red on a
   pairing resolveFleet passes green - 194 rows across 21 pairs. All 27
   granted pairs have an ally route as well, so a grant is never the only way
   in and must never be the answer while an unconditional door is open. */
export function lendVerdict(L, D, role){
  if(!L || !D) return { kind: "no", role: null, cond: null, why: "" };
  if(D === L || D.nm === L.nm)
    return { kind: "own", role: null, cond: null, why: "" };
  /* A list that swaps ships with nobody beats every grant and every door: the
     sentence is the list's own and more specific (p. 99, p. 155). */
  if(L.res_ban) return { kind: "no", role: null, cond: null, why: L.res_ban };
  if(D.res_ban) return { kind: "no", role: null, cond: null, why: D.res_ban };
  var same = !!(D.race && L.race && D.race === L.race);
  var g = same ? null : lendGrantFor(L, D);
  var asReserve = function(){
    /* Same race first, exactly as resolveFleet does it: the race gate lets
       the ship through before res_ok is ever consulted. Checking grants
       first put the three other Imperial Navy lists behind "needs an
       Inquisitor Lord", when they are ordinary same-race reserves. */
    if(same) return { kind: "reserve", role: "reserve", cond: null, why: "" };
    if(g) return { kind: "grant", role: "reserve",
                   cond: g.needs_re ? (g.needs_what || "a condition") : null,
                   why: L.res_src || "" };
    return { kind: "no", role: null, cond: null,
      why: "Reserves can only ever be ships belonging to the same \"race\", "
         + "chosen from a fleet list of the same \"race\". (Fleets p. 15)" };
  };
  var asAlly = function(){
    if(same) return { kind: "no", role: null, cond: null,
      why: "Reserves can only ever be ships belonging to the same \"race\", "
         + "chosen from a fleet list of the same \"race\". (Fleets p. 15)" };
    if(allyPairOk(L, D))
      return { kind: "ally", role: "ally", cond: null, why: "" };
    return { kind: "no", role: null, cond: null,
             why: "Never allies: " + L.ally_race + " and " + D.ally_race };
  };
  if(role === "reserve") return asReserve();
  if(role === "ally") return asAlly();
  if(same) return asReserve();
  var a = asAlly();
  if(a.kind !== "no") return a;
  var r = asReserve();
  return r.kind !== "no" ? r : a;
}

/* ---- and the same row by row ---------------------------------------------
   The pair verdict above answers "does this list lend to that one". It is
   not the whole answer, because several rules refuse a ROW while the list
   itself lends perfectly well:

     - the donor's own reserve or access sections are not the donor's ships
       to lend (p. 15, "you cannot use a reserve of a reserve", and the same
       for named access). Every Ork list carries a ROGUE TRADERS section of
       that kind (p. 184), so an Ork list lends its kroozers and not that.
     - lend_ban: Armageddon lends everything except its starred Space Marine
       vessels (p. 41).
     - a grant can exclude rows: Dominion takes Rogue Trader vessels but not
       the Xenos ones (p. 101).
     - a hull that is not a battleship, a cruiser or an escort cannot be
       taken this way at all (p. 14) - a Space Hulk or a Rok has no reserve
       type, and 21 profiles are in that class.

   So a donor list can be wholly available, partly available, or closed, and
   the player should see which BEFORE opening it. lendSummary counts the rows
   and says which of the three it is; the catalogue then marks the rows
   themselves, so the summary and the rows are one answer and not two.
   test_domain section 13g checks both against real resolveFleet runs. */
export function lendRowVerdict(L, D, si, en, catalog, ctx){
  /* ctx.role is the role the catalogue will actually stamp on the ship if
     this button is pressed. The rules differ by role, so a mark made without
     it is a mark for a door the player is not walking through. */
  var v = lendVerdict(L, D, ctx && ctx.role);
  if(v.kind === "own") return { ok: true, why: "", cause: "" };
  if(v.kind === "no") return { ok: false, why: v.why, cause: "pair" };
  /* A conditional grant refuses EVERY row until the fleet meets it: "An
     Eldar Hero must lead the fleet in order to use Craftworld Eldar vessels
     as reserves" (p. 314), and the Inquisitor Lord licence on p. 149. The
     pair verdict says the list lends, which is true; whether it lends right
     now depends on the fleet, so the caller has to say. ctx.condMet is left
     undefined when the question is about the pair and not about a fleet. */
  if(v.cond && ctx && ctx.condMet === false)
    return { ok: false, cause: "needs", what: v.cond, why: L.res_src || "" };
  var sec = D.secs[si];
  if(!sec || !en) return { ok: false, why: "", cause: "" };
  /* A planetary defence is not a ship "chosen from the fleet list": it has no
     type that p. 14 counts, hull or no hull (an orbital mine row has none). */
  if(sec.ct === "defence") return { ok: false, cause: "type",
    why: "Only ships of the same 'type' (battleship, cruiser or escort) "
       + "count for reserves purposes. (Fleets p. 14)" };
  if(sec.ct === "reserve") return { ok: false, cause: "reserve",
    why: "However, a given fleet list cannot take as reserves ships listed "
       + "as reserves or allies to another fleet list. In short, you cannot "
       + "use a reserve of a reserve. (Fleets p. 15)" };
  if(sec.ct === "access") return { ok: false, cause: "access",
    why: "Some fleet lists explicitly provide access to ships from other "
       + "races. These may only be taken exactly as described on their "
       + "fleet list rules and may not also be taken as reserves. "
       + "(Fleets p. 15)" };
  if(D.lend_ban && new RegExp(D.lend_ban.re, "i").test(String(en.l || "")))
    return { ok: false, why: D.lend_ban.src, cause: "lend_ban" };
  var g = lendGrantFor(L, D);
  if(g && g.not_re && v.kind === "grant" &&
     new RegExp(g.not_re, "i").test(String(en.l || "")))
    return { ok: false, why: L.res_src || "", cause: "not_re" };
  /* The Xenos clause reaches a row coming in as an ALLY of a Space Marine
     fleet: "Space Marines: will only ally with Imperials ... and Rogue Trader
     vessels (excluding Xenos ships)." The other half of that rule - a Space
     Marine ALLY inside somebody else's fleet - depends on what else the fleet
     contains, so only the legality panel can see it, and the catalogue does
     not pretend to. */
  if(L.ally_xenos && v.role === "ally" && L.ally_race === L.ally_xenos.when &&
     new RegExp(L.ally_xenos.re, "i").test(String(en.l || "")))
    return { ok: false, why: L.ally_xenos.src, cause: "xenos" };
  var sh = en.r != null && catalog && catalog.ships
    ? catalog.ships[String(en.r)] : null;
  if(sh && (!sh.rt || sh.rt === "none")) return { ok: false, cause: "type",
    why: "Only ships of the same 'type' (battleship, cruiser or escort) "
       + "count for reserves purposes. (Fleets p. 14)" };
  return { ok: true, why: "", cause: "" };
}
/* Which rows the catalogue offers at all: upgrades are ticked on a ship, and
   a commander on another list's page may not be taken (p. 14). Those are not
   counted, or a donor whose only refusal is its own admiral would read as
   "some ships" when every ship it lends is fine. */
export function lendOfferable(en){
  return !!en && en.k !== "up" && en.k !== "cmd";
}
/* When the matrix refuses a list, the ships may still be reachable - just not
   as allies. The book's other route is the host list naming the vessels on
   its own pages, and the two biggest cases are exactly the pair a player
   asks about:

     Every Chaos list prints RENEGADE IMPERIAL VESSELS (p. 232): "For every
     1,500 points in a Chaos fleet, one cruiser from any Imperial Navy fleet
     list up to 185 points and/or up to six Imperial Navy escorts may be
     taken."

     Imperial Navy - Bastion Fleets prints Chaos hulls under THE RESERVE
     FLEETS OF SEGMENTUM OBSCURUS (p. 39).

   Both are the list's own section, not an alliance, which is why the matrix
   and these coexist without contradiction. The picker would otherwise say
   "Not allowed" and be read as "those ships are out of reach", which is a
   different and false statement.

   The match is by hull reference, never by faction names: a row in one of the
   host's named sections that fields the very same profile the other list
   fields. Ordinary `type` sections are skipped, because two Imperial lists
   sharing a Lunar is not a route to anywhere. */
/* The condition a host section puts on its own rows (J144). "Chaos reserves
   need an Ordo Malleus Inquisitor" is a requires rule whose if_pick is the
   whole section; its `what` names the leader the way a grant's needs_what
   does, so the picker can say it before the legality panel turns red. */
export function sectionNeeds(L, si){
  var sec = L && L.secs ? L.secs[si] : null, hit = null;
  ((sec && sec.rules) || []).forEach(function(r){
    if(hit || r.kind !== "requires" || !r.what || !r.if_pick || !r.if_pick.length) return;
    if(r.if_pick.every(function(p){ return p.sec === si && !p.re; }))
      hit = { what: r.what, pick: r.then_pick || [] };
  });
  return hit;
}
/* A donor row refused as a reserve of a reserve (p. 15) may still be this
   fleet's own row. Fleets p. 152 gives an Ordo Malleus fleet "any Chaos ship
   listed in the Bastion Fleet List" in its own section: opening Bastion
   Fleets from a Gothic fleet should point there, not only say no. Same hull
   reference, in a section of this list of kind reserve. */
export function hostReserveRow(L, en){
  if(!L || !en || en.k !== "unit" || en.r == null) return null;
  var out = null;
  (L.secs || []).forEach(function(sec, si){
    if(out || sec.ct !== "reserve") return;
    (sec.ents || []).forEach(function(e2, ei){
      if(!out && e2.k === "unit" && String(e2.r) === String(en.r))
        out = { si: si, ei: ei, title: sec.t, needs: sectionNeeds(L, si) };
    });
  });
  return out;
}
export function lendOwnRoute(L, D, catalog){
  if(!L || !D || L === D) return null;
  /* A list that gives ships to nobody gives them to nobody: "A Grey Knights
     fleet will not take ships from or provide ships to any other fleet list"
     (Fleets p. 155). A host section that prints the same hulls is the host's
     own offer, and shows in the host's own catalogue - it is not a route
     FROM that list, and the picker must not paint it yellow as one. */
  if(D.res_ban) return null;
  var ships = catalog && catalog.ships;
  var native = D.native_chaps || null;
  var banRe = D.lend_ban ? new RegExp(D.lend_ban.re, "i") : null;
  /* The donor's own hulls only. A shared hull reference is not enough:
     Space Marine lists print Imperial Navy profiles as rapid strike vessels,
     which are Space Marine ships (p. 106), and Demiurg prints a Rogue Trader
     cruiser among its own (p. 487). By reference alone those read as routes -
     23 of the 68 did. Armageddon's starred rows are likewise Space Marine
     vessels by the list's own mark (p. 41), so its lend_ban applies here too. */
  var theirs = {};
  (D.secs || []).forEach(function(sec, si){
    if(sec.ct !== "type") return;
    (sec.ents || []).forEach(function(en, ei){
      if(en.k !== "unit" || en.r == null) return;
      if(banRe && banRe.test(String(en.l || ""))) return;
      var sh = ships ? ships[String(en.r)] : null;
      if(native && sh && native.indexOf(sh.chap) < 0) return;
      (theirs[String(en.r)] = theirs[String(en.r)] || []).push(si + ":" + ei);
    });
  });
  var best = null;
  (L.secs || []).forEach(function(sec, si){
    if(sec.ct !== "access" && sec.ct !== "reserve" && sec.ct !== "own") return;
    /* noroute: the host's own offer of another race's hull, not a door to
       that race's list - the Demiurg Bastion a fleet hires (Fleets p. 483,
       J217) is not a route from the War Host */
    if(sec.noroute) return;
    var n = 0, map = {};
    (sec.ents || []).forEach(function(en, ei){
      if(en.k !== "unit" || en.r == null || !theirs[String(en.r)]) return;
      n++;
      /* Every donor row fielding this hull is added as THIS host row. */
      theirs[String(en.r)].forEach(function(k){
        if(!map[k]) map[k] = { si: si, ei: ei }; });
    });
    if(n && (!best || n > best.n))
      best = { title: sec.t, n: n, ct: sec.ct, si: si, map: map, needs: sectionNeeds(L, si) };
  });
  return best;
}
/* The one predicate the picker's groups, its door counts and its note all
   use, so the three cannot disagree: both doors closed, and the host's own
   pages offer this list's hulls. */
export function lendRouteFor(L, D, catalog){
  if(!L || !D || L === D) return null;
  if(lendVerdict(L, D, "reserve").kind !== "no") return null;
  if(lendVerdict(L, D, "ally").kind !== "no") return null;
  return lendOwnRoute(L, D, catalog);
}

/* kind: "own" | "open" | "limited" | "none"

   "limited" is NOT the same as "has rows it will not lend". Almost every list
   has those: 2693 of the 3041 refusals across all 1024 pairs are rows in a
   donor's own access section - every Ork list's ROGUE TRADERS block (p. 184),
   every Chaos list's renegade block (p. 232) - and they are refused from every
   host alike. A category that is on for 406 of 408 lending pairs would tell
   the player nothing.

   What does vary is a restriction aimed at THIS fleet: lend_ban (Armageddon's
   starred Space Marine vessels, p. 41) and a grant's not_re (Dominion takes
   Rogue Trader vessels but not the Xenos ones, p. 101). That is true of 18
   pairs out of 408, so it is worth its own heading and its own colour. The
   rest of the refusals are shown where they belong - on the rows themselves,
   inside the catalogue, once the list is open. */
/* ctx.role names the door. The picker asks about one door at a time, because
   the two doors open different lists and often share nothing: an Ork fleet
   takes reserves from two lists and allies from ten, with no overlap. Leave
   the role out and the question falls back to "is there any way in at all". */
export function lendSummary(L, D, catalog, ctx){
  var v = lendVerdict(L, D, ctx && ctx.role);
  if(v.kind === "own") return { kind: "own", verdict: v, ok: 0, bad: 0, only: null };
  if(v.kind === "no")  return { kind: "none", verdict: v, ok: 0, bad: 0, only: null };
  var ok = 0, bad = 0, only = null;
  (D.secs || []).forEach(function(sec, si){
    (sec.ents || []).forEach(function(en){
      if(!lendOfferable(en)) return;
      var r = lendRowVerdict(L, D, si, en, catalog,
        { role: v.role, condMet: ctx && ctx.condMet });
      if(r.ok){ ok++; return; }
      bad++;
      if(["lend_ban", "not_re", "needs", "xenos"].indexOf(r.cause) >= 0)
        only = only || r;
    });
  });
  /* A condition the fleet has not met yet is not "no": the player can meet
     it. It belongs with the limited half, named, not with the refusals. */
  var limited = !!only;
  return { kind: (ok === 0 && !limited) ? "none"
                 : (limited ? "limited" : "open"),
           verdict: v, ok: ok, bad: bad, only: only };
}

export function roleOfIntent(intent){
  var r = intent && intent.role;
  return r === "reserve" || r === "ally" ? r : "core";
}
