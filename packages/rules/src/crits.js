import { weaponState } from "./unit.js";

export const CRIT = [
  ["2", "DORSAL", ""], ["3", "STARBOARD", ""], ["4", "PORT", ""], ["5", "PROW", ""],
  ["6", "ENGINE +1", "NO TURNS"], ["7", "FIRE! +1/turn", ""],
  ["8", "THRUST +1", "SPEED -10"], ["9", "BRIDGE -3Ld*", ""], ["10", "SHIELDS 0*", ""]
];
export const CRIT_WIDE = ["11 Hull Breach +D3", "12 Bulkhead Collapse +D6"];
export const CRIT_FOOT = "* flagship also loses its remaining re-rolls; 9 and 10 cannot be repaired";
/* v1.2 (owner 12 Oct 2026: "not every crit can happen more than once, so one
   box"). Rulebook p. 67: "Critical hits that can be repaired are cumulative;
   box"). Rulebook p. 67: "Critical hits that can be repaired are cumulative;
   meaning ships that take a multiple number of the same critical damage must
   repair all incidences" - its example has three fires burning - but "If a
   critical hit is rolled which cannot be applied, or multiple criticals are
   rolled for a location that cannot be repaired (such as Shields Collapse),
   apply the next highest critical hit instead." A result that cannot be
   repaired is therefore taken at most once and needs one box; every table
   marks those results with a star (the pages are in the tables' feet). The
   hulks' D6 tables have their own boxes (groups). */
export function critOnce(cm){
  if(cm.groups) return [];
  return cm.rows.filter(function(r){ return /\*\s*$/.test(String(r[1])) || /\*\s*$/.test(String(r[2])); })
                .map(function(r){ return r[0]; });
}
/* Pictograms for the standard table only: its nine results are places on the
   ship, a fire and the shields. The other tables keep their text - most of
   their results (an Infinity Circuit, a Sepulchre) are no place a top view
   could show. */
export const CRIT_ICONS = { "2": "dorsal", "3": "starboard", "4": "port", "5": "prow", "6": "engine",
                     "7": "fire", "8": "thrusters", "9": "bridge", "10": "shields" };
/* Ramilies Class Star Fort Critical Hits Table, Fleets p. 505 - per quadrant.
   The Fortress-Monastery "follows all rules for the Ramilies" (p. 110) and
   p. 111 does not change its criticals. */
export const RAMILIES_CRIT = [
  ["2-3", "LANCES", "OFF"], ["4", "MAIN ARMAMENT", "1/2"], ["5", "ORDNANCE BAYS", "OFF"],
  ["6", "REACTORS +1", "SHLD+TURRETS 1/2"], ["7", "FIRE! +1/turn", ""],
  ["8", "HULL BREACH +D3", ""], ["9", "COMMAND TOWER", "-2Ld*"], ["10", "SHIELDS", "0*"]
];
export const RAMILIES_CRIT_WIDE = ["11 Basilica Penetrated +D3: every quadrant D3, Basilica weapons lost",
                            "12 Reactor Struck +D6: every quadrant +D6, roll again"];
export const RAMILIES_CRIT_FOOT = "Per quadrant; * 9 and 10 cannot be repaired (Fleets pp. 111, 505).";
/* DEFENCES CRITICAL HITS TABLE, Rulebook p. 101: "Some large defensive
   platforms, such as space stations and the huge Blackstone Fortresses, have
   multiple hits. When it comes to taking damage, these work just like capital
   ships. They suffer critical hits just like capital ships and get crippled
   once they have lost half their damage points." The table is in the Rulebook
   only - the Fleets chapter prints the Ramilies table alone (p. 505).
   Two things the table says that the short form must not lose: 4 SILENCES the
   batteries (the Ramilies table halves them), and 8-9 is its own result, a
   station knocked out of orbit. Book oddity, recorded and not harmonised:
   2-3 literally reads "The station may not fire until its lance armament has
   been repaired" under the heading "Lances Damaged: The station's lance array
   is taken off-line" - read here as the lances, as on every other table.
   The title must not begin "CRITICAL DAMAGE": the play page applies the
   ship table's derived effects to titles that do (play_rules.js). */
export const DEFENCE_CRIT = [
  ["2-3", "LANCES", "OFF"], ["4", "MAIN ARMAMENT", "OFF"], ["5", "ORDNANCE BAYS", "OFF"],
  ["6", "REACTORS +1", "SHLD+TURRETS 1/2"], ["7", "FIRE! +1/turn", ""],
  ["8-9", "ORBIT LOST +1", "FALLS D6 cm/turn"], ["10", "SHIELDS", "0*"]
];
export const DEFENCE_CRIT_WIDE = ["11 Hull Breach +D3", "12 Bulkhead Collapse +D6"];
export const DEFENCE_CRIT_FOOT = "A result it cannot suffer counts as the next highest. 8-9: falls D6 cm toward the planet " +
  "in each of its Movement Phases until repaired; destroyed if it hits. * 10 cannot be repaired (Rulebook p. 101).";
/* Haven Space Station CRITICAL HITS TABLE, Fleets p. 335 (read from the page
   image; it matches the text layer). p. 334: "The Haven suffers critical
   damage on a roll of 5+" in place of the Eldar 4+. Row 9 speaks of a ship
   (printed as the book has it). Row 4 is "Pulsar Lances Off-line" in the
   book and is not renamed for the Dark Eldar base, whose lances are Phantom
   lances (p. 349): the card says LANCES, which is true of both. */
export const HAVEN_CRIT = [
  ["2", "INFINITY CIRCUIT", "-1Ld"], ["3", "BATTERIES", "OFF"], ["4", "LANCES", "OFF"],
  ["5", "LAUNCH BAYS", "OFF"], ["6", "MAINSAIL", "WEAPONS 1/2"], ["7", "SUPERSTRUCTURE +1", "D6: 1 = +1 HIT"],
  ["8", "POLARIZATION FIELD", "OFF"], ["9", "CIRCUIT SMASHED +1", "-3Ld*"], ["10", "HOLOFIELDS", "LOST*"]
];
export const HAVEN_CRIT_WIDE = ["11 Hull Breach +D3", "12 Bulkhead Collapse +D6"];
export const HAVEN_CRIT_FOOT = "Critical on 5+. 7: roll a D6 at the start of each turn, on a 1 it takes one more Hit. " +
  "8: drifts 5 cm toward the nearest celestial phenomenon and no longer ignores Blast Markers and solar flares. " +
  "10 also ends the Netherfield. * 9 and 10 cannot be repaired (Fleets pp. 334-335).";
export const NECRON_CRIT = [
  ["2", "PORT POWER", "ARC + WHIP OFF"], ["3", "STBD POWER", "ARC + WHIP OFF"],
  ["4", "LIGHTNING ARC OFF", "ALL ARCS"], ["5", "POWER FLOW", "ARC + WHIP OFF"],
  ["6", "DRIVE", "NO TURNS; -1Ld"], ["7", "DRIVE", "SPEED -5; -1Ld"],
  ["8", "INERTIALESS", "NO AAF; -1Ld"], ["9", "SEPULCHRE", "OFF; -2Ld"],
  ["10", "COMMAND CORE", "-3Ld"]
];
export const NECRON_CRIT_WIDE = ["11 Power Surge +D3; -2Ld", "12 Ruptured Power Core +D6; -2Ld"];
export const NECRON_CRIT_FOOT = "Necron critical repairs succeed on 4+ (Fleets pg. 404).";
/* Fleets p.393 "ORK HULK CRITICAL HITS TABLE": the ATTACKER rolls a D6, not
   2D6 on the Critical Damage table. Sub-results get their own rows because
   each -1 is its own tally on the table. Only the Ork hulk: the table is
   titled for it and sits on its pages; the Chaos hulk's page (p.288) says
   nothing, and the Rulebook has no hulk critical rule. */
export const ORK_HULK_CRIT = [
  ["1-2", "HIGH ENERGY: D6 1-2", "-1 DORSAL LANCE"],
  ["1-2", "HIGH ENERGY: D6 3-4", "-1 SHIELD"],
  ["1-2", "HIGH ENERGY: D6 5-6", "-1 TURRET STR"],
  ["3-4", "WEAPONS, ARC HIT: D6 1-2", "-1 LAUNCH BAY (not prow/aft)"],
  ["3-4", "WEAPONS, ARC HIT: D6 3-4", "-1 TORPEDO STR (not aft)"],
  ["3-4", "WEAPONS, ARC HIT: D6 5-6", "-2 WEAPONS BATTERY FP"],
  ["5-6", "THRUSTERS", "to turn: D6 > thruster crits taken"],
];
export const ORK_HULK_CRIT_WIDE = ["Attacker rolls D6 (Fleets p. 393)",
                            "Result that cannot apply: next higher result"];
export const ORK_HULK_CRIT_FOOT = "Space hulks cannot repair any critical damage during a battle.";
/* Fleets p.290 "CHAOS SPACE HULK CRITICAL HITS TABLE" - the same shape as the
   Ork table with one cell of its own: "-1 prow and dorsal lance". */
export const CHAOS_HULK_CRIT = [
  ["1-2", "HIGH ENERGY: D6 1-2", "-1 PROW AND DORSAL LANCE"],
  ["1-2", "HIGH ENERGY: D6 3-4", "-1 SHIELD"],
  ["1-2", "HIGH ENERGY: D6 5-6", "-1 TURRET STR"],
  ["3-4", "WEAPONS, ARC HIT: D6 1-2", "-1 LAUNCH BAY (not prow/aft)"],
  ["3-4", "WEAPONS, ARC HIT: D6 3-4", "-1 TORPEDO STR (not aft)"],
  ["3-4", "WEAPONS, ARC HIT: D6 5-6", "-2 WEAPONS BATTERY FP"],
  ["5-6", "THRUSTERS", "to turn: D6 > thruster crits taken"],
];
export const CHAOS_HULK_CRIT_WIDE = ["Attacker rolls D6 (Fleets p. 290)",
                              "Result that cannot apply: next higher result"];
export const TYRANID_CRIT = [
  ["2", "SPORE CYSTS", "OFF"], ["3", "STARBOARD", "OFF"],
  ["4", "PORT", "OFF"], ["5", "PROW", "OFF"],
  ["6", "THORAX +1", "OFF"], ["7", "HEAVY WOUND", "+1/turn until fixed"],
  ["8", "VENTS +1", "NO TURNS"], ["9", "SYNAPSE", "NO HIVE OVERRIDE"],
  ["10", "SPORES OFF*", "PERMANENT"]
];
export const TYRANID_CRIT_WIDE = ["11 Severe Wound +D3", "12 Massive Haemorrhage +D6; bio-plasma splash"];
export const TYRANID_CRIT_FOOT = "* result 10 cannot be repaired; result 12 is a Strength 1 bio-plasma attack on another target within 2D6 cm, holofields do not protect";
export const ELDAR_CRIT = [
  ["2", "INFINITY CIRCUIT", "-1Ld"], ["3", "KEEL", "OFF"],
  ["4", "PROW", "OFF"], ["5", "MAST LINES", "MAX TURN 90"],
  ["6", "MAINSAIL", "ALL SPEEDS -5"], ["7", "SUPERSTRUCTURE +1", "TURN >45: 1 = +1"],
  ["8", "MAINSAIL", "NO 2ND MOVE"], ["9", "INFINITY CIRCUIT +1", "-3Ld*"],
  ["10", "HOLOFIELDS", "OFF*"]
];
export const ELDAR_CRIT_WIDE = ["11 Hull Breach +D3", "12 Bulkhead Collapse +D6"];
export const ELDAR_CRIT_FOOT = "Critical on 4+; * results 9 and 10 cannot be repaired (Fleets p. 307).";
export const DARK_ELDAR_CRIT = [
  ["2", "WEAPON SYSTEMS", "ALL OFF"], ["3", "PROW MAIN", "OFF"],
  ["4", "MANOEUVRING", "TEST FOR CTNH"], ["5", "BATTERIES", "OFF"],
  ["6", "TURNING FINS", "MAX TURN 45"], ["7", "ENGINES", "SPEED -10"],
  ["8", "SUPERSTRUCTURE +1", "SO: 1 = +1"], ["9", "COMMANDERS", "-1Ld*"],
  ["10", "SHADOWFIELDS", "OFF*"]
];
export const DARK_ELDAR_CRIT_WIDE = ["11 Hull Breach +D3", "12 Bulkhead Collapse +D6"];
export const DARK_ELDAR_CRIT_FOOT = "* results 9 and 10 cannot be repaired (Fleets p. 346).";

/* A Chaos hull in a list's own reserve section: Bastion's five (Fleets p. 39)
   and the same five taken through an Ordo Malleus Inquisitor (p. 152, J144).
   The list prints them, but they are not its vessels. "Allied and reserve
   vessels cannot use refits and upgrades from the fleet list they are allied
   to unless they are of the same race" (p. 16), and an Explorator's Chaos
   cruiser is no Mechanicus vessel - no Gifts, no repair bonus, no Mechanicus
   crew. Bakka's Jovian in its RESERVES section is Imperial and stays native.
   Without the row (profile-level callers) nothing is foreign. */
export function foreignReserveRow(list, en, sh){
  if(!list || !en || !sh || !/^CHAOS/i.test(String(sh.fl || "")) || /^chaos/i.test(String(list.race || ""))) return false;
  var sec = null;
  (list.secs || []).forEach(function(s2){ if(!sec && (s2.ents || []).indexOf(en) >= 0) sec = s2; });
  return !!sec && sec.ct === "reserve";
}
export function isMechanicusVessel(sh, list, en){
  /* sh.df: a station or platform bought beside a Mechanicus fleet is not a
     Mechanicus vessel - the gifts and the repair bonus are for "Mechanicus
     vessels" (Fleets pp. 118-120), and the defences come from p. 499. */
  /* en.mech: an Adeptus Mechanicus cruiser bought in the Bakka list as a
     battlecruiser - "They utilize all rules for Adeptus Mechanicus vessels"
     (Fleets p. 49, J217) */
  if(en && en.mech) return !/escort/i.test(sh.ty || "") && !sh.df;
  /* a Demiurg mercenary in a Mechanicus fleet stays a Demiurg ship (Fleets
     p. 483, J217) */
  if(/^DEMIURG$/i.test(String(sh.fl || ""))) return false;
  return !!list && /Mechanicus/i.test(list.nm) && !/escort/i.test(sh.ty || "") && !sh.df && !foreignReserveRow(list, en, sh);
}

export const CRIP_LINE = "CRIPPLED: Speed -5 cm; weapons, ordnance, shields and turrets 1/2.";
export const REPAIR_LINE = "REPAIR: End Phase, D6 / remaining Hit; 6 = 1 crit; " +
  "blast contact 1/2 dice.";
export const CRIT_LINE = "A hit that gets through the shields: D6, a 6 rolls 2D6 on this table.";
export const ESCORT_LINE = "ESCORT: one unsaved Hit destroys the ship; a Critical Hit destroys " +
  "the escort outright.";
/* A one-hit planetary defence whose printed type is not Escort (Defence/1 on
   pp. 509-511, Ground/1 on p. 517). The book gives it no damage rule of its
   own - one damage point is simply all it has - and Rulebook p. 66's
   "escort ships which suffer a critical hit" names escorts only, so the line
   does not speak of criticals. */
export const DEFENCE_ONE_HIT_LINE = "DEFENCE: one unsaved Hit destroys it; tick one box per defence lost.";


/* Fleets p.393: "Space hulks are not crippled by damage like ordinary
   ships. They are so big that they must be gradually eroded by enemy
   fire." The name, not the type: "Defence" also covers orbital platforms,
   which do cripple. */
export function isSpaceHulk(sh){ return /\bhulk\b/i.test(String(sh.nm || "")); }
/* Planetary defences that are bought as part of the fleet rather than from a
   defence allowance: the Ramilies (Fleets p. 500) and the Eldar Haven
   (p. 335). They sit in the defences section but not in its one-third sum. */
export function isHaven(sh){ return !!sh && /^HAVEN\b/i.test(String(sh.nm || "")); }
export function defenceOwnPoints(sh){
  return !!sh && (!!sh.qd || isHaven(sh));
}
/* A defence that stays where it is put: every planetary defence except the
   three vessels the book prints as Escort/1 (Defence Monitor, System Ship,
   Fire Ship). The quadrant forts are stationary too (speed 0 cm, pp. 110,
   500), whichever list sells them. */
export function isStationaryDefence(sh){
  return !!sh && (!!sh.qd || (!!sh.df && !/escort/i.test(String(sh.ty || ""))));
}

/* The squadron size the list allows this escort (J69): the rules the fleet
   check uses (resolveFleet "squadron"), the tightest when several cover the
   row, and the rulebook's 2-6 (Fleets p. 13) when the list prints none. */
export function squadronLimits(sel){
  var L = sel.list, lo = null, hi = null, lone = null, src = "";
  var label = String((sel.en && sel.en.l) || "");
  if(L) L.secs.forEach(function(sec, secIdx){ (sec.rules || []).forEach(function(r){
    if(r.kind !== "squadron") return;
    var covers = r.pick
      ? r.pick.some(function(p){ return p.sec === sel.si && (!p.re || new RegExp(p.re, "i").test(label)); })
      : (r.sec || [secIdx]).indexOf(sel.si) >= 0;
    if(!covers) return;
    lo = lo == null ? r.min : Math.max(lo, r.min);
    hi = hi == null ? r.max : Math.min(hi, r.max);
    lone = lone == null ? !!r.lone : lone && !!r.lone;
    if(!src) src = String(r.src || "");
  }); });
  /* A one-hit planetary defence the section's rule does not name - the three
     ground units of Fleets p. 517, which Rulebook p. 100's squadron sentence
     ("Orbital defences or ships that count as defences") does not cover. The
     card still holds up to six of one type; the row's own limit (0-4 Air
     bases, 0-8 silos, p. 499) is the fleet check's business. No source: this
     is the card's capacity, not a rule of the book. */
  if(lo == null && sel.sh && sel.sh.df){
    var cap = sel.en && sel.en.mx != null ? Math.min(6, sel.en.mx) : 6;
    return { min: 1, max: cap, lone: false, src: "", cardOnly: true };
  }
  if(lo == null) return { min: 2, max: 6, lone: true, src: "Fleets p. 13" };
  return { min: lo, max: hi, lone: !!lone, src: src };
}
/* What ONE purchase of a list row is, for the catalogue to say before the
   player presses +: a single hull on a card of its own, a squadron card
   (one-hit hulls, min to max of them on one card), a group card (the ground
   units, which the book gives no squadron rule - same card, different word)
   or a counted row (orbital mines, minefields: a number written on one rules
   card, up to the row's own limit when the list gives one). The same tests
   the resolved unit uses - sel.escort and squadronLimits - so the catalogue
   cannot promise a card the fleet pane then draws differently. */
export function rowPurchase(list, si, en, sh){
  if(sh && (sh.sq || /escort/i.test(sh.ty || ""))){
    var q = squadronLimits({ list: list, si: si, en: en, sh: sh });
    return { kind: q.cardOnly ? "group" : "squadron", min: q.min, max: q.max };
  }
  if(!sh && en && en.cnt) return { kind: "count", max: en.mx == null ? null : en.mx };
  return { kind: "single" };
}

/* What one press of the catalogue row's + or - does to the row's cards in
   the fleet. A squadron card (escorts, one-hit defences) is one card a
   press (owner 28 Oct 2026: + added one ship to the row's bottom card,
   "it should always add a new squadron card; now it is confusing"): + opens
   a new card at the squadron's minimum, - takes the row's last card away,
   and the card's own - n + in the fleet sets its size. This replaces 18 Oct
   2026's one ship a press; the four squadrons of two that four presses made
   before that (13 Oct) are now one card made bigger on the card. A row sold
   on one card - a count (orbital mines) or a ground unit's group - is still
   one a press: + grows the last card until it is full and then opens
   another, - shrinks it to its minimum and then takes it away. A
   single-ship row is one unit a press. units: the row's cards in fleet
   order. The answer says what to do; the caller does it. */
export function rowStep(buy, units, dir){
  var last = units.length ? units[units.length - 1] : null;
  if(!buy || buy.kind === "single" || buy.kind === "squadron")
    return dir > 0 ? { act: "open" } : (last ? { act: "remove", unit: last } : null);
  var min = Math.max(1, buy.min || 1), max = buy.max == null ? Infinity : buy.max;
  if(dir > 0) return last && (last.n || 1) < max ? { act: "grow", unit: last } : { act: "open" };
  if(!last) return null;
  return (last.n || 1) > min ? { act: "shrink", unit: last } : { act: "remove", unit: last };
}

export function crippledLine(sh, rows){
  const ctx = String(sh.fl || "") + " " + String(sh.nm || "");
  /* Fleets p.501: "The Ramilies star fort is so large that its weapons, hits
     and defences are divided up into four 'quadrants'... Quadrants are
     crippled individually once they are reduced to 6 Damage Points." The
     stat line is therefore per quadrant, which the card has to say once -
     the book prints "(quadrant)" three times, which will not fit a box. */
  if(sh.qd)
    return "PER QUADRANT: hits, shields and turrets above are one quarter's. " +
           "The fort has four; damage, criticals and boarding are resolved " +
           "against the quadrant hit, and each is crippled on its own. " +
           "(Fleets p. 501)";
  if(isSpaceHulk(sh))
    return "NOT CRIPPLED: a hulk is eroded hit by hit, never crippled. At 0 " +
           "Damage roll on the Catastrophic Damage table: Plasma Drive " +
           "Overload = no damage to others, it becomes an asteroid field " +
           "D3\u00d75 cm; Warp Drive Implosion = replace with a Warp rift. " +
           "(Fleets p. " + hulkPage(sh) + ")";
  if(/TYRANID/i.test(ctx))
    return "CRIPPLED: Speed -5 cm; Bio-plasma and Pyro-acid 1/2; Spores unchanged; no Torpedoes, Attack Craft, Claws or Tentacles.";
  if(/NECRON/i.test(ctx))
    return "CRIPPLED: Speed -5 cm; weapons and Turrets 1/2; Star Pulse off; Portals 1/2 (round down).";
  /* The Haven does not move (speed is printed as a dash, Fleets p. 332). */
  if(isHaven(sh))
    return "CRIPPLED: weapons and ordnance 1/2; Holofields unchanged.";
  if(/^ELDAR\b/i.test(String(sh.fl || "")))
    return "CRIPPLED: all Speed values -5 cm; weapons and ordnance 1/2; Holofields unchanged.";
  if(/DARK ELDAR/i.test(ctx))
    return "CRIPPLED: Speed -5 cm; weapons and ordnance 1/2; Shadowfields unchanged.";
  /* Fleets pp. 207, 395, 495: "Due to their low speed and considerable
     momentum, Caravan Vessels which are crippled or moving though Blast
     markers do not reduce their speed" - the same sentence for Roks and
     Warspheres. p. 492: a Nicassar Caravan "is not slowed down by blast
     markers, celestial phenomena or being crippled." */
  if(isRockVessel(sh) || isCaravan(sh))
    return "CRIPPLED: Speed unchanged; weapons, ordnance, shields and turrets 1/2.";
  /* A hull that does not move (the Nicassar Rig, p. 493: 0 cm) has no speed
     to lose. */
  if(/^\s*0\s*(cm)?\s*$/.test(String(sh.sp || "")))
    return "CRIPPLED: weapons, ordnance, shields and turrets 1/2.";
  /* Rulebook p. 65: "Crippled ships also reduce their move by 5 cm and will
     not be able to fire their nova cannon." The loadout decides, so a Lunar
     that took the nova cannon option is told too. */
  const nova = rows
    ? rows.some(function(r){ return weaponState(r) === "active" && /nova cannon/i.test(String((r.a && r.a[0]) || "")); })
    : (sh.aw || []).some(a => /nova cannon/i.test(a[0]));
  return CRIP_LINE + (nova ? " No Nova Cannon." : "");
}


export function isOrkHulk(sh){ return isSpaceHulk(sh) && /\bORK\b/i.test(String(sh.nm || "")); }
export function isChaosHulk(sh){ return isSpaceHulk(sh) && /\bCHAOS\b/i.test(String(sh.nm || "")); }
/* Both hulks have their own D6 table on the pages after their profile:
   Ork p.393, Chaos p.290. The first P1-5 pass read only the Chaos profile
   page and missed p.290 - a ship's rules can continue past its profile. */
export function hulkPage(sh){ return isChaosHulk(sh) ? 288 : 391; }

/* The hulk table as the book draws it: three results, each with its own
   sub-results (Fleets p. 393 Ork, p. 290 Chaos). The flat rows above stay
   for the play page; the printed card uses the groups (user 9.10.2026:
   three main boxes with their sub-categories, and boxes beside the weapon
   rows for the minuses a system has taken).
   on: the loss is ticked on the weapon rows of that kind (see hulkLoss);
   track: boxes inside the group itself - shields, turrets, thrusters. */
export function hulkCritGroups(chaos){
  return [
    { roll: "1-2", name: "HIGH ENERGY SYSTEMS", how: "roll a D6", subs: [
        { roll: "1-2", text: chaos ? "-1 PROW AND DORSAL LANCE" : "-1 DORSAL LANCE", on: "lance", both: !!chaos },
        { roll: "3-4", text: "-1 SHIELD", track: "shields" },
        { roll: "5-6", text: "-1 TURRET STR", track: "turrets" } ] },
    { roll: "3-4", name: "WEAPONS CLUSTERS", how: "roll a D6 - only the arc that was hit", subs: [
        { roll: "1-2", text: "-1 LAUNCH BAY (not prow/aft)", on: "bay" },
        { roll: "3-4", text: "-1 TORPEDO STR (not aft)", on: "torp" },
        { roll: "5-6", text: "-2 WEAPONS BATTERY FP", on: "wb" } ] },
    { roll: "5-6", name: "THRUSTERS", how: "every one counts", subs: [
        { roll: "", text: "TO TURN: ROLL A D6 HIGHER THAN THE BOXES TICKED", track: "thrusters" } ] }
  ];
}
/* Which critical a weapon row can lose strength to, and by how much: the
   dorsal lance (Chaos: "prow and dorsal lance") -1, a launch bay -1, a
   torpedo salvo -1, a weapons battery -2 Firepower. Ork gunz and heavy gunz
   are weapons batteries (Fleets p. 362). Four boxes a row, fewer when the
   printed strength runs out sooner. */
export function hulkLoss(a, chaos){
  var nm = String((a && a[0]) || ""), st = String((a && a[2]) || "").trim();
  var key = /lance/i.test(nm) ? ((chaos ? /prow|dorsal/i : /dorsal/i).test(nm) ? "lance" : null)
          : /launch bay/i.test(nm) ? "bay" : /torpedo/i.test(nm) ? "torp"
          : /batter|gunz/i.test(nm) ? "wb" : null;
  if(!key) return null;
  var per = key === "wb" ? 2 : 1;
  var num = /^\d+(\s|$)/.test(st) ? parseInt(st, 10) : null;
  return { key: key, per: per, n: num == null ? 4 : Math.max(1, Math.min(4, Math.ceil(num / per))) };
}
export function criticalModel(sh){
  const ctx = String(sh.fl || "") + " " + String(sh.nm || "");
  /* Quadrant star forts: the Ramilies table (Fleets p. 505). */
  if(sh.qd) return {
    title:"STAR FORT CRITICAL DAMAGE (2D6)", rows:RAMILIES_CRIT,
    wide:RAMILIES_CRIT_WIDE, foot:RAMILIES_CRIT_FOOT
  };
  if(isChaosHulk(sh)) return {
    title:"CHAOS SPACE HULK CRITICAL HITS (D6)", rows:CHAOS_HULK_CRIT,
    wide:CHAOS_HULK_CRIT_WIDE, foot:ORK_HULK_CRIT_FOOT, groups:hulkCritGroups(true)
  };
  if(isOrkHulk(sh)) return {
    title:"ORK HULK CRITICAL HITS (D6)", rows:ORK_HULK_CRIT,
    wide:ORK_HULK_CRIT_WIDE, foot:ORK_HULK_CRIT_FOOT, groups:hulkCritGroups(false)
  };
  /* Stationary planetary defences with several hits: the Rulebook's own
     table (p. 101), not the ship table - a station has no prow, engines or
     bridge to lose. Tau orbitals "follow all High Orbit and Satellite defence
     rules" (Fleets p. 451). The Haven has a table of its own (p. 335),
     matched before this one. */
  if(isHaven(sh)) return {
    title:"HAVEN CRITICAL HITS (2D6)", rows:HAVEN_CRIT, wide:HAVEN_CRIT_WIDE, foot:HAVEN_CRIT_FOOT
  };
  /* A Rok bought as a defence (Fleets p. 362) keeps the Rok's own critical
     rule below: "Roks are sufficiently different to both Orbital Defences
     and true spaceships to require a number of special rules" (p. 395). */
  if(sh.df && isStationaryDefence(sh) && (sh.hp | 0) > 1 && !isHaven(sh) && !isRockVessel(sh)) return {
    title:"DEFENCES CRITICAL HITS (2D6)", rows:DEFENCE_CRIT,
    wide:DEFENCE_CRIT_WIDE, foot:DEFENCE_CRIT_FOOT
  };
  if(/TYRANID/i.test(ctx)) return {
    title:"TYRANID CRITICAL DAMAGE (2D6)", rows:TYRANID_CRIT,
    wide:TYRANID_CRIT_WIDE, foot:TYRANID_CRIT_FOOT
  };
  if(/NECRON/i.test(ctx)) return {
    title:"NECRON CRITICAL DAMAGE (2D6)", rows:NECRON_CRIT,
    wide:NECRON_CRIT_WIDE, foot:NECRON_CRIT_FOOT
  };
  if(/^ELDAR\b/i.test(String(sh.fl || ""))) return {
    title:"ELDAR CRITICAL DAMAGE (2D6)", rows:ELDAR_CRIT,
    wide:ELDAR_CRIT_WIDE, foot:ELDAR_CRIT_FOOT
  };
  if(/DARK ELDAR/i.test(ctx)) return {
    title:"DARK ELDAR CRITICAL DAMAGE (2D6)", rows:DARK_ELDAR_CRIT,
    wide:DARK_ELDAR_CRIT_WIDE, foot:DARK_ELDAR_CRIT_FOOT
  };
  /* Roks, Kroot Warspheres and Stryxis Caravan Vessels "lack the complex
     systems of true space craft, so critical hits are not rolled on the
     Critical table. Instead each critical hit inflicts +1 point of damage"
     (Fleets pp. 395, 495, 207) - rules on the page after the profile. */
  if(isRockVessel(sh)) return {
    title:"CRITICAL DAMAGE", rows:[["2-12", "NO CRITICAL", "+1 Hp"]],
    wide:["no critical table", "at 0 Hp: 4 Blast Markers"],
    foot:"Takes no critical damage: each critical hit inflicts +1 point of damage. At 0 Damage it breaks up " +
         "into 4 Blast Markers - no Catastrophic Damage roll (Fleets p. " + rockPage(sh) + ")."
  };
  /* Fleets p. 492: a Caravan "does not take critical damage in the normal
     sense" - a critical is one extra Hp of damage instead. */
  if(isCaravan(sh)) return {
    title:"CRITICAL DAMAGE", rows:[["2-12", "NO CRITICAL", "1 EXTRA Hp"]],
    wide:["Rig and Dhows are one vessel", "at 0 Hp: four Blast Markers"],
    foot:"Takes no critical damage: each critical is 1 extra Hp of damage instead (Fleets p. 492)."
  };
  /* Every other hull the book prints as type Defence with more than one hit:
     the Activated Blackstone Fortress (Fleets p. 286, Defence/16) and the
     Nicassar Rig (p. 493, Defence/4, "stationary in the same manner as any
     other planetary defence"). Neither page gives a critical rule of its
     own, so Rulebook p. 101 decides - "Some large defensive platforms, such
     as space stations and the huge Blackstone Fortresses, have multiple
     hits ... They suffer critical hits just like capital ships" - and the
     table printed there is the Defences one. They used to get the ship
     table (dorsal, port, prow, engine room, thrusters, bridge), none of
     which they have (user's card check 9.10.2026). The hulks, the rock
     vessels, the Caravan and the star forts have their own rules above. */
  if(/^defence/i.test(String(sh.ty || "")) && (sh.hp | 0) > 1) return {
    title:"DEFENCES CRITICAL HITS (2D6)", rows:DEFENCE_CRIT,
    wide:DEFENCE_CRIT_WIDE, foot:DEFENCE_CRIT_FOOT
  };
  return {title:"CRITICAL DAMAGE (2D6)", rows:CRIT, wide:CRIT_WIDE, foot:CRIT_FOOT};
}
/* The Nicassar Caravan (Fleets p. 492) - not the Stryxis Caravan Vessel. */
export function isCaravan(sh){ return /^\s*CARAVAN\s*$/i.test(String(sh.nm || "")); }
/* Roks, Kroot Warspheres and Stryxis Caravan Vessels share one set of rules
   for movement, criticals and break-up (Fleets pp. 395, 495, 207). */
export function isRockVessel(sh){
  return /^\s*ROK\s*$|WARSPHERE|STRYXIS CARAVAN/i.test(String((sh && sh.nm) || ""));
}
export function rockPage(sh){
  var n = String((sh && sh.nm) || "");
  return /WARSPHERE/i.test(n) ? 495 : /STRYXIS/i.test(n) ? 197 : 393;
}

export function repairLine(sh, list, en){
  const ctx = String(sh.fl || "") + " " + String(sh.nm || "");
  /* Rulebook p. 66: an escort that suffers a critical hit for any reason is
     destroyed, so there is never a critical to repair. */
  if(/escort/i.test(String(sh.ty || ""))) return "";
  /* A one-hit defence has no critical to repair either: one hit removes it. */
  if(sh.sq) return "";
  /* No critical damage to repair: every critical is +1 Damage instead. */
  if(isRockVessel(sh)) return "";
  /* Fleets p.393: "Space Hulks cannot repair any critical damage in the
     course of a battle." */
  if(isOrkHulk(sh) || isChaosHulk(sh))
    return "NO REPAIR: a space hulk cannot repair critical damage during a battle (Fleets p. " +
           hulkPage(sh) + ").";
  if(/NECRON/i.test(ctx))
    return "REPAIR: End Phase, D6 / remaining Hit; 4+ = 1 crit; blast contact 1/2 dice.";
  /* "Mechanicus vessels always add +1D6 to their rolls when attempting to
     repair critical damage" (Fleets p. 120). The list's escorts are Imperial
     Navy ships "otherwise unmodified", so the bonus applies to capitals --
     the same limit as the gifts table. The card only needs the deviation. */
  if(isMechanicusVessel(sh, list, en)) return "ALL ADMECH: REPAIR +1D6.";
  return REPAIR_LINE;
}

/* A standard launcher does not deserve a line of its own among the special
   rules: it is the caption for the table it applies to, and so goes on the
   header row. Eldar and Dark Eldar launchers differ from standard, so those
   stay as real rules. */
export function criticalTriggerLine(sh){
  /* Fleets p. 334: the Haven's own threshold, not the Eldar ships' 4+. */
  if(isHaven(sh))
    return "CRITICAL: Every Hit causes critical damage on 5+; roll 2D6 on the Haven table.";
  if(/^ELDAR\b/i.test(String(sh.fl || "")))
    return "CRITICAL: Every Hit causes critical damage on 4+; roll 2D6 on the Eldar table.";
  if(/DARK ELDAR/i.test(String(sh.fl || "") + " " + String(sh.nm || "")))
    return "CRITICAL: Every Hit causes critical damage on 6; roll 2D6 on the Dark Eldar table.";
  return null;
}

export function criticalTriggerHint(sh){
  const ctx = String(sh.fl || "") + " " + String(sh.nm || "");
  if(isCaravan(sh)) return "through shields: 6 &rarr; 1 extra Hp, no critical";
  if(isOrkHulk(sh) || isChaosHulk(sh)) return "through shields: 6 &rarr; attacker rolls D6";
  if(isHaven(sh)) return "every Hit: 5+ &rarr; 2D6";
  if(/^ELDAR\b/i.test(String(sh.fl || ""))) return "every Hit: 4+ &rarr; 2D6";
  if(/DARK ELDAR/i.test(ctx)) return "every Hit: 6 &rarr; 2D6";
  return "through shields: 6 &rarr; 2D6";
}
