/* Card sheet definitions for the generator make_fleet_cards.js.
 *
 * One sheet = one fleet list in the app. The split EXISTING / MISSING
 * follows whether the hull has really been printed (the ship cards README in
 * the owner's print folder). The cards are made with the app's own buildCardSheet(), so
 * profiles, prices and rules come from the app's data - this file only
 * decides WHICH cards, under which names and which choices stay open.
 *
 * Sheet fields:
 *   out    the PDF path
 *   list   a regular expression for the list name (LISTS[].nm)
 *   title  the sheet title (empty -> "<list> - fleet cards")
 *   sub    the second heading line: what is on the table (at most two lines)
 *   ups    the sheet's defaults for list upgrades [[regex, state]]: applies to
 *          every card the app OFFERS the upgrade to
 *   units  the cards in order
 *
 * Card fields:
 *   row      a regex for the list row (ship or commander row)
 *   name     the card title (empty -> the class name)
 *   n        hulls; for escorts the squadron size
 *   members  the names of the escort squadron's ships
 *   opt      the ship's own options [[regex for the option text, state]]
 *   rest     the state for options opt does not name (default: the app's own)
 *   ups      list upgrades for this card; beats the sheet default, and
 *            fails if the app does not offer the upgrade
 *
 * States: "take" = ticked (belongs to the hull), "opt" = an empty box (chosen
 * at the table), "off" = not printed.
 *
 * POLICY (10.9.2026): a choice stays open unless the printed hull locks it.
 * Only built differences are locked - Crassus's nova cannon, Gutstabba's
 * torpedo launcha, Deathdeala's Dakka Dakka, the tyranids' grown weapons -
 * and the named identities of the old cards (Killfrenzy = Daemonship,
 * Soulless = World Eaters crew). Left open are the ship's own options and,
 * of the list upgrades, only those that change the ship: power ram, plasma-
 * boosted batteries, torpedo bombers, Dakka Dakka, crew, Daemonship,
 * commander re-rolls. Left off the card are whole-fleet purchases
 * (Necron and tyranid re-rolls, bio-enhancements x 15), orbital mines
 * (BACKLOG J21: the card does not yet swap attack craft for mines) and
 * the tyranids' ordnance markers. */
const path = require("path");

/* Where the sheets go: BFG_CARDS_DIR (the owner points it at the print folder
   on their drive), else out/cards/ in the repository (gitignored). */
const CARDS = process.env.BFG_CARDS_DIR || path.resolve(__dirname, "..", "..", "out", "cards", "ship cards");
const MISSING = path.join(CARDS, "puuttuvat");
const pdf = (dir, name) => path.join(dir, name + "_150pct_2up_A4.pdf");

/* Roman numerals for the default squadron names. */
const roman = n => ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"][n - 1];
const numbered = (stem, from, to) => {
  const out = [];
  for (let i = from; i <= to; i++) out.push(stem + " " + roman(i));
  return out;
};

/* ------------------------------------------------------------------ */
/* ADEPTUS MECHANICUS                                                  */
/* ------------------------------------------------------------------ */

const ADMECH_UPS = [
  [/^Imperial Power Ram$/i, "opt"],
  [/^Plasma-boosted batteries$/i, "opt"],
  [/^Torpedo bombers$/i, "opt"],
  [/^Dorsal lance instead of prow torpedoes$/i, "opt"],
  [/^\+1 turret \(escort squadron\)$/i, "opt"],
  [/^(One|Two) re-rolls?$/i, "opt"],
];

const admech = {
  out: pdf(CARDS, "BFG_OLEMASSA_Adeptus_Mechanicus"),
  list: /^Adeptus Mechanicus/,
  limit: 5000,
  title: "Adeptus Mechanicus – printed and ready",
  sub: "On the table: Oberon · Dictator · Gothic (nova) · Gothic (torpedoes) · " +
       "Lunar · 4 light cruisers · 6 Firestorm (also play as Sword / Falchion) · " +
       "7 Cobra · 4 Hunter. Proxies: Glory of Gehenna on the Oberon, Tyrant on either " +
       "Gothic. Each light cruiser has its named card in its default class; the three " +
       "unnamed class cards let any hull switch class for a game.",
  ups: ADMECH_UPS,
  units: [
    { row: /^Oberon class battleship$/i,  name: "PRIDE OF MARS" },
    { row: /^Dictator class cruiser$/i,   name: "RHADAMANTHINE" },
    /* The Gothic hulls are built with different prows: nova and torpedoes. */
    { row: /^Gothic class cruiser$/i,     name: "CRASSUS",
      ups: [[/^Nova Cannon instead of prow torpedoes$/i, "take"]] },
    { row: /^Gothic class cruiser$/i,     name: "EMPEROR'S WRATH" },
    { row: /^Lunar class cruiser$/i,      name: "LORD DAROS" },
    /* An alternative profile for a Gothic hull; name = class. */
    { row: /^Tyrant class cruiser$/i },
    { row: /^Retribution class battleship$/i, name: "GLORY OF GEHENNA",
      ups: [[/^Nova Cannon instead of prow torpedoes \(Retribution\)$/i, "opt"]] },
    /* Four light cruiser hulls in their default classes (the place cards README v2)
       and three unnamed class cards for swapping. */
    { row: /^Defiant class light cruiser$/i,   name: "FOREBEARER" },
    { row: /^Defiant class light cruiser$/i,   name: "ARCHANGEL" },
    { row: /^Defiant class light cruiser$/i,   name: "LAND'S VISION" },
    { row: /^Endeavour class light cruiser$/i, name: "PEREGRINUS" },
    { row: /^Endeavour class light cruiser$/i },
    { row: /^Endurance class light cruiser$/i },
    { row: /^Defiant class light cruiser$/i },
    { row: /^Firestorm Class Frigate$/i, name: "CELAENO SQUADRON", n: 6,
      members: ["Celaeno", "Cape Wrath", "Sabre", "Mourningstar"] },
    { row: /^Sword Class Frigate$/i, name: "CAESTUS METALICAN SQUADRON", n: 6,
      members: ["Caestus Metalican", "Land's Vision", "Zar-Quaesitor", "Principia Gravis"] },
    { row: /^Falchion Class Frigate$/i, name: "GUARDIAN OF AQUINAS SQUADRON", n: 6,
      members: ["Guardian of Aquinas", "Fortitude", "Resolute"] },
    { row: /^Cobra Class Destroyer$/i, name: "VIGIL SQUADRON", n: 6,
      members: ["Spiteful", "Nuntius Mortis", "Silencia", "Honoured Prophecy",
                "Molech's Enlightenment", "Cobra VI"] },
    { row: /^Hunter Class Destroyer$/i, name: "THE SPIRIT OF MARS SQUADRON", n: 4,
      members: ["The Spirit of Mars", "Hunter II", "Hunter III"] },
    { row: /^Archmagos Explorator/i, name: "ARCHMAGOS EXPLORATOR LEXELL KOTOV" },
    { row: /^Archmagos Veneratus/i,  name: "ARCHMAGOS VENERATUS" },
  ],
};

const admech_puuttuu = {
  out: pdf(MISSING, "BFG_PUUTTUU_Adeptus_Mechanicus"),
  list: /^Adeptus Mechanicus/,
  limit: 5000,
  title: "Adeptus Mechanicus – not printed",
  sub: "Ark Mechanicus: STL staged in models/lisälaivat tulostus kansio but never " +
       "printed – meant to be proxied on the Oberon, which already carries Glory of " +
       "Gehenna. Emperor: no STL in the collection, would have to be kitbashed.",
  ups: ADMECH_UPS,
  units: [
    { row: /^Omnissiah/i,              name: "OMNISSIAH'S VICTORY" },
    { row: /^Emperor class battleship$/i, name: "LEGATUS STYGIES" },
  ],
};

/* ------------------------------------------------------------------ */
/* ORKS - Waaagh!                                                      */
/* ------------------------------------------------------------------ */

const ORK_UPS = [
  [/^Dakka Dakka/i, "opt"],
  [/^Torpedo-bommas$/i, "opt"],
  [/^(One|Two) extra re-rolls?$/i, "opt"],
  [/^(Maniac Gunners|Mad Meks|Extra Power Fields|Mega-armoured Boarding Parties|Looted Torpedoes)$/i, "opt"],
];

const orks = {
  out: pdf(CARDS, "BFG_OLEMASSA_Orks"),
  list: /^Orks . Waaagh/,
  limit: 5000,
  title: "Ork Waaagh! – printed and ready",
  sub: "On the table: Dethdeala · Hammer · Terror Ship · 3 Kill Kroozer · " +
       "6 gunz escorts · 6 torpedo escorts · 8 Brute. Gorbag's Revenge and Slamblasta " +
       "are alternative profiles for the Dethdeala and Hammer hulls. The six gunz escorts " +
       "play as Onslaught, Savage or Grunt – one squadron card at a time.",
  ups: ORK_UPS,
  units: [
    { row: /^Dethdeala$/i, name: "DEATHDEALA",
      ups: [[/^Dakka Dakka: \+2 turrets$/i, "take"]] },
    { row: /^Gorbag/i,     name: "GORBAG'S REVENGE" },
    { row: /^Hammer class battlekroozer$/i, name: "STARKRUSHA" },
    { row: /^Slamblasta$/i, name: "SLAMBLASTA" },
    { row: /^Terror ship$/i, name: "BOMMABOSS" },
    { row: /^Kill kroozer$/i, name: "BUTCHER" },
    { row: /^Kill kroozer$/i, name: "GUTSTABBA",
      opt: [[/^May replace its prow heavy gun battery with a torpedo launcha/i, "take"]] },
    { row: /^Kill kroozer$/i, name: "SKULLKRUMPA" },
    { row: /^Onslaught attack ship$/i, name: "DA RIPPAS", n: 6,
      members: ["Rippa", "Snappa", "Slasha"] },
    { row: /^Savage gunship$/i, name: "DA SAVAGEZ", n: 6,
      members: ["Savage", "Rippa", "Grinda", "Chompa"] },
    { row: /^Grunt assault ship$/i, name: "DA GRABBAZ", n: 6,
      members: ["Grabba", "Snatcha", "Klampa"] },
    { row: /^Ravager attack ship$/i, name: "DA STIKKAZ", n: 6,
      members: ["Stikka", "Skewa", "Spitta", "Prodda", "Jabba", "Poka"] },
    { row: /^Brute ramship$/i, name: "DA RAMMAZ", n: 8,
      members: ["Hedbutt", "Krunch", "Splatta", "Nutta"] },
    { row: /^Ork Warlord$/i, name: "WARBOSS GUTREK DA UNKILLABLE" },
  ],
};

const orks_puuttuu = {
  out: pdf(MISSING, "BFG_PUUTTUU_Orks"),
  list: /^Orks . Waaagh/,
  limit: 5000,
  title: "Ork Waaagh! – not printed",
  sub: "Only one Terror Ship hull was printed in phase 1, so Bommaboss and Fightaboss " +
       "cannot both be on the table – a second Terror Ship is a reprint of the phase 1 STL set.",
  ups: ORK_UPS,
  units: [
    { row: /^Terror ship$/i, name: "FIGHTABOSS" },
  ],
};

/* ------------------------------------------------------------------ */
/* CHAOS - Khorne (World Eaters)                                       */
/* ------------------------------------------------------------------ */

const CHAOS_UPS = [
  [/^World Eaters Chaos Space Marine crew$/i, "opt"],
  [/^Daemonship:/i, "opt"],
  [/^Torpedo bombers$/i, "opt"],
  [/^The Mark of Khorne$/i, "opt"],
  [/^One (extra )?re-roll/i, "opt"],
];

const chaos = {
  out: pdf(CARDS, "BFG_OLEMASSA_Chaos_World_Eaters"),
  list: /^Chaos . Khorne/,
  limit: 5000,
  title: "Chaos / World Eaters – printed and ready",
  sub: "On the table: Despoiler · Slaverer battle barge · Hecate · Acheron · " +
       "Murder · Carnage · 2 Slaughter · 3 Idolator · 4 Infidel. The Chaos " +
       "Battle Barge is an alternative profile on the Slaverer hull. Warmaker (Hades) has " +
       "no hull of its own – proxy it on the Acheron or the Hecate.",
  ups: CHAOS_UPS,
  units: [
    { row: /^Despoiler class battleship$/i, name: "MERCILESS DEATH" },
    { row: /^Slaverer$/i, name: "SLAVERER" },
    /* Seven own options are enough; torpedo bombers do not fit sensibly. */
    { row: /^Chaos battle barge$/i,
      ups: [[/^Torpedo bombers$/i, "off"]] },
    { row: /^Hecate class heavy cruiser$/i,  name: "BLADE OF FURY" },
    { row: /^Acheron class heavy cruiser$/i, name: "CHAOS ETERNUS" },
    { row: /^Hades class heavy cruiser$/i,   name: "WARMAKER" },
    { row: /^Murder class cruiser$/i,        name: "DOOMBRINGER" },
    { row: /^Carnage class cruiser$/i,       name: "ANARCHIC VENDETTA" },
    /* Two Slaughters: the old identities stay as ticks. */
    { row: /^Slaughter class cruiser$/i, name: "KILLFRENZY",
      ups: [[/^Daemonship: Cruiser$/i, "take"]] },
    { row: /^Slaughter class cruiser$/i, name: "SOULLESS",
      ups: [[/^World Eaters Chaos Space Marine crew$/i, "take"]] },
    { row: /^Idolator class raider$/i, name: "KHORNE'S TEETH", n: 3,
      members: ["Skullcarver", "Blood Tithe", "Deathhowl"] },
    { row: /^Infidel class raider$/i, name: "FELLCLAWS", n: 4,
      members: numbered("Infidel", 1, 4) },
    { row: /^Chaos Warmaster/i, name: "WARMASTER VHALEK SKULLBOUND" },
    { row: /^Chaos Lord/i,      name: "CHAOS LORD" },
  ],
};

const chaos_puuttuu = {
  out: pdf(MISSING, "BFG_PUUTTUU_Chaos_World_Eaters"),
  list: /^Chaos . Khorne/,
  limit: 5000,
  title: "Chaos / World Eaters – not printed",
  sub: "Five hulls from the expansion plan that were never printed: Desolator, Styx, " +
       "Devastation and Repulsive are capital hulls; Iconoclast is a four-ship escort squadron.",
  ups: CHAOS_UPS,
  units: [
    { row: /^Desolator class battleship$/i,      name: "TORMENT" },
    { row: /^Styx class heavy cruiser$/i,        name: "HORRIFIC" },
    { row: /^Devastation class cruiser$/i,       name: "UNFORGIVABLE" },
    { row: /^Repulsive class grand cruiser$/i,   name: "FOE-REAPER" },
    { row: /^Iconoclast class destroyer$/i, name: "LOST SOULS", n: 4,
      members: ["Lost Soul", "Fearmonger", "Carrion", "Inculpator"] },
  ],
};

/* Pool extension 9.10.2026: 8 new hulls that have not been printed yet.
 * Names from the book's Famous Ships rows (p. 268-280).
 *
 * The grand cruisers are NO LONGER on this sheet (the user on the evening of 9.10.:
 * configurable like IN Bastion, the carrier as a unique model). They are made by their own
 * stack "chaos lisäys (tehtävä ja printattava)/tekija/tee_chaos_gc.js":
 *   CH-31 FOEBANE       Retaliator, a fixed card
 *   CH-32 BLOOD ROYALE  one configurable card: Repulsive / Vengeance / Executor
 * The earlier version (four class cards for each hull, 14 cards) is
 * kept in the folder "luokkakortit (vanha)".
 *
 * 10.10.2026: the six cruiser cards (CH-25...CH-30) also moved to their own
 * stack "chaos lisäys (tehtävä ja printattava)/tekija/tee_lisays.js", because
 * they get additions the app does not print on an open card
 * (Mark of Khorne with a crew, Daemonship / crew -or, the right max).
 * The sheet key chaos_lisays was removed ON PURPOSE: the generator
 * would write over the same PDF with a version without the additions. */

/* ------------------------------------------------------------------ */
/* NECRONS - Harvest Fleet                                             */
/* ------------------------------------------------------------------ */

/* Re-rolls are whole-fleet purchases and do not belong on a single card. */
const necrons = {
  out: pdf(CARDS, "BFG_OLEMASSA_Necrons"),
  list: /^Necrons/,
  limit: 5000,
  title: "Necrons – printed and ready",
  sub: "On the table: 1 Cairn · 2 Scythe · 2 Shroud = 1360 pts of the pool. " +
       "The fleet is growing to 16 hulls – the other eleven cards are on the " +
       "\"not printed\" sheet.",
  units: [
    { row: /^Cairn class tombship$/i,       name: "NIGHTBRINGER" },
    { row: /^Scythe class harvest ship$/i,  name: "DECEIVER" },
    { row: /^Scythe class harvest ship$/i,  name: "FLAYER" },
    { row: /^Shroud class light cruiser$/i, name: "OUTSIDER" },
    { row: /^Shroud class light cruiser$/i, name: "VOID DRAGON" },
  ],
};

const necrons_puuttuu = {
  out: pdf(MISSING, "BFG_PUUTTUU_Necrons"),
  list: /^Necrons/,
  limit: 5000,
  title: "Necrons – not printed",
  sub: "Pool growing to 16 hulls (15.9.2026): +2 Scythe, +1 Shroud, +4 Jackal, " +
       "+4 Dirge. Jackal and Dirge are the list's only escorts, up to twelve of " +
       "each in squadrons of 2–6.",
  units: [
    { row: /^Scythe class harvest ship$/i,  name: "YUCTAN" },
    { row: /^Scythe class harvest ship$/i,  name: "BORA CULPA" },
    { row: /^Shroud class light cruiser$/i, name: "MARS GAMBIT" },
    { row: /^Jackal class raiders$/i, name: "JACKAL SQUADRON", n: 4,
      members: ["Adinbur", "Tiryns", "Sol Edge", "Feint"] },
    { row: /^Dirge class raiders$/i,  name: "DIRGE SQUADRON", n: 4,
      members: ["Angelis Boat", "Sand Rise", "Trackless", "Explorator's Ghost"] },
  ],
};

/* ------------------------------------------------------------------ */
/* TYRANIDS - Hive Fleet                                               */
/* ------------------------------------------------------------------ */

/* The large ships' weapons are grown: the old card's weapon load is locked
   (rest: "off") and only the unused side pair stays open. Escort weapons
   are chosen per game, so on a squadron card every weapon is open -
   one card replaces the old eight Kraken variants. */
const P = /^Prow\W+/.source, T = /^Thorax\W+/.source;
const side = k => "^Port\\/starboard set " + k + "\\W+";
const ty = (src, state) => [new RegExp(src, "i"), state];

const tyranids = {
  out: pdf(CARDS, "BFG_OLEMASSA_Tyranids"),
  list: /^Tyranids . Hive Fleet/,
  limit: 5000,
  title: "Tyranids – printed and ready",
  sub: "On the table: 2 Hive Ships · 4 Cruisers · 12 Escort Drones · " +
       "12 Vanguard Drones · 10 Kraken (one shoal of six plus one of four). Capital " +
       "ships keep their grown weapons and only an unused side set stays open; escort " +
       "weapons are chosen per game on the squadron card.",
  units: [
    { row: /^Hive ship/i, name: "BROOD MOTHER", rest: "off",
      opt: [ty(P + "Pyro-acid", "take"), ty(T + "Launch bays", "take"),
            ty(side(1) + "Launch bays", "take"), ty(side(2) + "Bio-plasma", "take"),
            ty(side(3).replace(/\\W\+$/, ""), "opt")],
      ups: [[/^Increase to Ld 9$/i, "take"],
            [/^Hive Mind Influence re-roll$/i, "opt"],
            [/^Hive Mind Imperative$/i, "opt"]] },
    { row: /^Hive ship/i, name: "DEVOURER", rest: "off",
      opt: [ty(P + "Feeder tentacles & massive claws", "take"), ty(T + "Pyro-acid", "take"),
            ty(side(1) + "Pyro-acid", "take"), ty(side(2) + "Bio-plasma", "take"),
            ty(side(3).replace(/\\W\+$/, ""), "opt")],
      ups: [[/^Increase to Ld 9$/i, "opt"]] },
    { row: /^Cruiser$/i, name: "GUN BEAST", rest: "off",
      opt: [ty(P + "Pyro-acid", "take"), ty(T + "Massive claws", "take"),
            ty(side(1) + "Pyro-acid", "take"), ty(side(2) + "Bio-plasma", "take")] },
    { row: /^Cruiser$/i, name: "BORER", rest: "off",
      opt: [ty(P + "Boarding torpedoes", "take"), ty(T + "Boarding torpedoes", "take"),
            ty(side(1) + "Pyro-acid", "take"), ty(side(2).replace(/\\W\+$/, ""), "opt")] },
    { row: /^Cruiser$/i, name: "CLAW BEAST", rest: "off",
      opt: [ty(P + "Massive claws", "take"), ty(T + "Feeder tentacles", "take"),
            ty(side(1) + "Bio-plasma", "take"), ty(side(2).replace(/\\W\+$/, ""), "opt")] },
    { row: /^Cruiser$/i, name: "HUNTER", rest: "off",
      opt: [ty(P + "Pyro-acid", "take"), ty(T + "Feeder tentacles", "take"),
            ty(side(1) + "Pyro-acid", "take"), ty(side(2).replace(/\\W\+$/, ""), "opt")] },
    { row: /^Escort drone$/i, name: "DRONE SHOAL A", n: 6, members: numbered("Drone", 1, 6) },
    { row: /^Escort drone$/i, name: "DRONE SHOAL B", n: 6, members: numbered("Drone", 7, 12) },
    { row: /^Vanguard drone ship$/i, name: "VANGUARD SWARM", n: 6 },
    { row: /^Vanguard drone ship$/i, name: "HARBINGER SWARM", n: 6 },
    { row: /^Kraken$/i, name: "SMELTFEASTER SHOAL", n: 6, members: numbered("Kraken", 1, 6) },
    { row: /^Kraken$/i, name: "VOIDMAW SHOAL", n: 4, members: numbered("Kraken", 7, 10) },
  ],
};

/* ------------------------------------------------------------------ */
/* SPACE MARINES - Crusade (6.9.2026)                                  */
/* ------------------------------------------------------------------ */

/* Honour Guard: +10 / ship, only for the battle barge and the strike cruiser
   (Fleets p. 96). Escorts may not take it, so they do not ask for it.
   The strike cruiser's prow and launch bay slot are magnetised: every
   weapon choice stays open. */
const HG = [[/^Honour Guard$/i, "opt"]];

/* Fleets p.105: "At a minimum, as many strike cruisers in the fleet must be
   armed with their basic weapons as listed above as all other variants (with
   replaced launch bays and/or prow bombardment cannon) combined." Four
   hulls (user 10.9.2026) are therefore locked to the basic weapons: three
   weapon swaps off, the extra shield (+15) and Honour Guard (+10) stay open -
   they are not variants. The other four are freely configurable,
   so the fleet follows the rule with any ticks. */
const SC_BASIC = [[/^May replace its launch bays/i, "off"],
                  [/^May replace its prow bombardment cannon/i, "off"]];

/* A fleet may have only one Venerable battle barge (p. 99, 102), so
   all five profiles have the same name (user 11.9.2026, SM-V1). */
const VEN = "FIRST COVENANT";

const crusade = {
  out: pdf(MISSING, "BFG_PUUTTUU_Space_Marines_Crusade"),
  list: /^Space Marines . Crusade/,
  limit: 1500,
  /* Honour Guard open on the Venerable cards when offered (p. 99). */
  ups: [[/^Honour Guard$/i, "opt"]],
  title: "Space Marines — Crusade – not printed",
  sub: "Anvil of Faith and eight strike cruisers – four on basic weapons (Fleets p. 105), " +
       "four configurable. Venerable battle barges (0–1, from 1000 pts, replaces a battle " +
       "barge – p. 99, 102) are alternative profiles: proxy the Oberon on the AdMech model. " +
       "Hunters are played on the AdMech models; Master of the Fleet is on the roster sheets.",
  units: [
    { row: /^Battle barge$/i,          name: "ANVIL OF FAITH", ups: HG },
    /* Venerable battle barge (p. 102): the hull is chosen from the row, everything the
       app offers stays open - the prow S6 torpedo swap, Honour Guard,
       the Desolator's special torpedoes. Orbital mines off as elsewhere (J21).
       Five hulls: resilience + ordnance + 60 cm weapons (user 11.9.2026). */
    { row: /^Venerable battle barge$/i, name: VEN, hull: /^OBERON CLASS/ },
    /* The Desolator's S9 prow torpedoes: special torpedoes (Rulebook p. 19,
       a general one-game purchase, not a profile refit) open. */
    { row: /^Venerable battle barge$/i, name: VEN, hull: /^DESOLATOR CLASS/,
      ups: [[/^Special torpedoes \(Strength 7 or more\)$/i, "opt"]] },
    { row: /^Venerable battle barge$/i, name: VEN, hull: /^EMPEROR CLASS/ },
    { row: /^Venerable battle barge$/i, name: VEN, hull: /^DESPOILER CLASS/ },
    { row: /^Venerable battle barge$/i, name: VEN, hull: /^STYX CLASS/ },
    { row: /^Strike cruisers$/i,       name: "OATHKEEPER",     ups: HG, opt: SC_BASIC },
    { row: /^Strike cruisers$/i,       name: "ZEALOT",         ups: HG, opt: SC_BASIC },
    { row: /^Strike cruisers$/i,       name: "CENSURE",        ups: HG, opt: SC_BASIC },
    { row: /^Strike cruisers$/i,       name: "IMPLACABLE",     ups: HG, opt: SC_BASIC },
    { row: /^Strike cruisers$/i,       name: "SANCTITY",       ups: HG },
    { row: /^Strike cruisers$/i,       name: "UNBOWED",        ups: HG },
    { row: /^Strike cruisers$/i,       name: "REPRISAL",       ups: HG },
    /* The eighth hull (SM-09, added 11.9.2026). */
    { row: /^Strike cruisers$/i,       name: "RELENTLESS",     ups: HG },
    { row: /^Nova class Frigate$/i,    n: 6 },
    { row: /^Gladius class Frigate$/i, n: 6 },
    { row: /^Hunter class Destroyer$/i, n: 6 },
  ],
};

/* Standard rosters. These are lists following the project's anti-optimisation
   principle, not matchup min-maxing: 1200 = everything six models give,
   1500 = the whole capital ship pool on the table. The roster sheet is the only place
   where the Master of the Fleet shows - a commander has no hull and so no
   card of its own. */
const crusade1200 = {
  kind: "roster",
  out: path.resolve(CARDS, "..", "BFG_Crusade_rosteri_1200_A4.pdf"),
  list: /^Space Marines . Crusade/,
  limit: 1200,
  units: [
    { row: /^Master of the Fleet/i },
    { row: /^Battle barge$/i,    name: "ANVIL OF FAITH" },
    { row: /^Strike cruisers$/i, name: "OATHKEEPER", opt: SC_BASIC },
    { row: /^Strike cruisers$/i, name: "ZEALOT",     opt: SC_BASIC },
    { row: /^Strike cruisers$/i, name: "CENSURE",    opt: SC_BASIC },
    { row: /^Strike cruisers$/i, name: "IMPLACABLE", opt: SC_BASIC },
    { row: /^Strike cruisers$/i, name: "SANCTITY" },
  ],
};

const crusade1500 = {
  kind: "roster",
  out: path.resolve(CARDS, "..", "BFG_Crusade_rosteri_1500_A4.pdf"),
  list: /^Space Marines . Crusade/,
  limit: 1500,
  units: [
    { row: /^Master of the Fleet/i },
    { row: /^Battle barge$/i,    name: "ANVIL OF FAITH", ups: [[/^Honour Guard$/i, "take"]] },
    { row: /^Strike cruisers$/i, name: "OATHKEEPER", opt: SC_BASIC },
    { row: /^Strike cruisers$/i, name: "ZEALOT",     opt: SC_BASIC },
    { row: /^Strike cruisers$/i, name: "CENSURE",    opt: SC_BASIC },
    { row: /^Strike cruisers$/i, name: "IMPLACABLE", opt: SC_BASIC },
    { row: /^Strike cruisers$/i, name: "SANCTITY" },
    { row: /^Strike cruisers$/i, name: "UNBOWED" },
    { row: /^Strike cruisers$/i, name: "REPRISAL" },
  ],
};

/* ------------------------------------------------------------------ */
/* ELDAR CORSAIRS - Later Gothic War                                   */
/* ------------------------------------------------------------------ */

/* Every ORDNANCE purchase of the list stays open (user 14.9.2026: "all
   options open"). Orbital mines are included, unlike on the other
   sheets: J21 fixed the card's mine row, and this sheet is the first
   made after it. The app offers each row only to the
   ship the book allows it for - torpedo bombers only for the cargo hold,
   special torpedoes only for torpedo ships, mines only for cruisers. */
const ELDAR_UPS = [
  [/^Torpedo bombers$/i, "opt"],
  [/^Special torpedoes \(Eldar, Strength up to 6\)$/i, "opt"],
  [/^Special torpedoes \(Eldar, Strength 7 or more\)$/i, "opt"],
  [/^Orbital mines$/i, "opt"],
  [/^(One|Two|Three) re-rolls?$/i, "opt"],
];

/* The four light cruiser hulls play both Aurora and Solaris, so
   each gets two cards with the same name. The name plate reads
   "AURORA / SOLARIS". */
const LC = [
  ["WIND RUNNER", /^Aurora class light cruiser$/i],
  ["WIND RUNNER", /^Solaris class light cruiser$/i],
  ["STORM CHASER", /^Aurora class light cruiser$/i],
  ["STORM CHASER", /^Solaris class light cruiser$/i],
  ["VOID SERPENT", /^Aurora class light cruiser$/i],
  ["VOID SERPENT", /^Solaris class light cruiser$/i],
  ["MEMORY OF LAMENT", /^Aurora class light cruiser$/i],
  ["MEMORY OF LAMENT", /^Solaris class light cruiser$/i],
].map(function(x){ return { row: x[1], name: x[0] }; });

const eldar = {
  out: pdf(CARDS, "BFG_Eldar_Corsairs"),
  list: /^Eldar Corsairs . Later Gothic War/,
  limit: 5000,
  title: "Eldar Corsairs - the Executioners",
  sub: "On the table: Void Stalker Bright Star \u00b7 2 Eclipse \u00b7 2 Shadow \u00b7 " +
       "4 light cruiser hulls, each with an Aurora card and a Solaris card \u00b7 " +
       "6 Hellebore \u00b7 6 Aconite \u00b7 6 Hemlock \u00b7 6 Nightshade = 33 hulls. " +
       "A Pirate Prince must lead any fleet over 750 pts; only an Eldar Hero unlocks " +
       "Craftworld reserves. Every purchase is left open - tick what you paid for.",
  ups: ELDAR_UPS,
  units: [
    /* Commanders. The book requires a Pirate Prince in a fleet over 750 points
       (p. 317), so the sheet must have a commander card. */
    { row: /^Pirate Prince/i, name: "PRINCE CONANMAOL" },
    { row: /^Eldar Hero/i,    name: "AUTARCH NEIRATHIL" },
    { row: /^Void Stalker class battleship$/i, name: "BRIGHT STAR" },
    { row: /^Eclipse class cruiser$/i, name: "SILENT WARRIOR" },
    { row: /^Eclipse class cruiser$/i, name: "STARDEATH" },
    { row: /^Shadow class cruiser$/i,  name: "BLACK STAR" },
    { row: /^Shadow class cruiser$/i,  name: "CHILD OF KHAINE" },
  ].concat(LC).concat([
    { row: /^Hellebore class frigate$/i, name: "WHISPERBLADE SQUADRON", n: 6,
      members: ["Whisperblade", "Bright Edge", "Silent Cut", "Dawnblade",
                "Swift Reaver", "Keening Blade"] },
    { row: /^Aconite class frigate$/i, name: "STARFLARE SQUADRON", n: 6,
      members: ["Starflare", "Emberwind", "Sunfall", "Firedance",
                "Bright Wrath", "Solar Wake"] },
    { row: /^Hemlock class destroyer$/i, name: "SWIFT SPEAR SQUADRON", n: 6,
      members: ["Swift Spear", "Needlestar", "Piercing Light", "Spear of Dusk",
                "Sharp Silence", "Voidneedle"] },
    { row: /^Nightshade class destroyer$/i, name: "NIGHTWIND SQUADRON", n: 6,
      members: ["Nightwind", "Shadowdance", "Duskrunner", "Moonfall",
                "Starless", "Dark Tide"] },
  ]),
};

/* ------------------------------------------------------------------ */
/* DARK ELDAR - Pirates (Fleets p. 351-353)                            */
/* ------------------------------------------------------------------ */

/* The user 2.10.2026: 4 cruisers and 13 escorts, all configurable with
   full options. Nothing is ticked: the Torture's
   extra weapon (launch bays / phantom lance / torpedoes / 1-2 Impalers) and
   the Corsair's weapon stay open, as do Mimic engines and every ordnance purchase.

   Identity: the Sky Serpents, Duke Traevelliath Sliscus's Dark Eldar
   corsairs (Lexicanum: Codex Dark Eldar 5th p. 51). Canonical ships:
   Incessant Agony = Sliscus's flagship (Lukas the Trickster, chapter 3; the class
   is not named), Ribald Blade = Torture class (same, chapter 9). The Fleets book
   names no Dark Eldar ship at all, so the other names are in the lore style
   (a serpent and poison theme).

   Squadrons: 13 hulls in squadrons of 2-6 (p. 351) = 3-6 squadrons, and a card is
   one weapon choice. Six cards cover every legal split; four
   have default members 4+3+3+3 (one squadron per cruiser, the book's "at least
   3 escorts for each capital ship"), two are empty spare cards. */
const DARK_ELDAR_UPS = [
  [/^Torpedo bombers$/i, "opt"],
  [/^Special torpedoes \(Eldar, Strength up to 6\)$/i, "opt"],
  [/^Special torpedoes \(Eldar, Strength 7 or more\)$/i, "opt"],
  [/^Orbital mines$/i, "opt"],
  [/^(One|Two|Three) re-rolls?$/i, "opt"],
];

const darkeldar = {
  out: pdf(path.join(CARDS, "dark eldar tekija"),
           "BFG_Dark_Eldar_Sky_Serpents_configurable"),
  list: /^Dark Eldar . Pirates/,
  limit: 5000,
  title: "Dark Eldar - the Sky Serpents",
  sub: "On the table: 4 Torture class cruisers · 13 Corsair class escorts. Duke Sliscus " +
       "must lead any fleet over 750 pts; at least 3 escorts per capital ship. Every weapon " +
       "and purchase is open - tick what you field. 13 escorts in squadrons of 2-6 = 3-6 " +
       "squadrons: any squadron card fits any squadron, write the hulls in.",
  ups: DARK_ELDAR_UPS,
  units: [
    /* Required in a fleet over 750 points (p. 351). */
    { row: /^Dread Archon/i, name: "DUKE SLISCUS" },
    { row: /^Torture class cruiser$/i, name: "INCESSANT AGONY" },
    { row: /^Torture class cruiser$/i, name: "RIBALD BLADE" },
    { row: /^Torture class cruiser$/i, name: "GLEEFUL VENOM" },
    { row: /^Torture class cruiser$/i, name: "SILKEN GARROTE" },
    { row: /^Corsair Class Escort$/i, name: "FANG SQUADRON", n: 6,
      members: ["Venomkiss", "Needlefang", "Hissing Spite", "Bitter Bite"] },
    { row: /^Corsair Class Escort$/i, name: "COIL SQUADRON", n: 6,
      members: ["Silken Coil", "Slow Strangle", "Tightening Smile"] },
    { row: /^Corsair Class Escort$/i, name: "SCALE SQUADRON", n: 6,
      members: ["Duskscale", "Glimmerhide", "Shed Skin"] },
    { row: /^Corsair Class Escort$/i, name: "VENOM SQUADRON", n: 6,
      members: ["Sweet Poison", "Lingering Sting", "Numbing Grace"] },
    /* Spare cards for the 5th and 6th squadron: the members are written by hand. */
    { row: /^Corsair Class Escort$/i, name: "TONGUE SQUADRON", n: 6 },
    { row: /^Corsair Class Escort$/i, name: "HOOD SQUADRON", n: 6 },
  ],
};

/* ------------------------------------------------------------------ */
/* DEFENCES, HULKS AND PLANET KILLER (9.10.2026)          */
/* ------------------------------------------------------------------ */

/* One card per model in the print project models/defences/Defences.3mf
 * (edited by the user 7.10., it sets the counts). The models are shared by
 * several fleets, but a sheet = one fleet list in the app, so
 * the cards are split by list; make_puolustuskortit.py runs the sheets and joins
 * the PDFs into one print file (BFG_PUOLUSTUKSET_KAIKKI). Names and
 * codes PD-01...: the "Puolustukset" sheet of the name register and the folder's README.
 *
 * The shared human pool (platforms, system ships, mines, Blackstone,
 * Ramilies) runs from the Bastion list: the general defence rows are the same on every
 * list (Fleets p. 499), so the same cards work for AdMech, Space
 * Marines, Chaos and as captured by the orks (p. 360).
 *
 * A fort (Ramilies, Fortress-Monastery) prints as two cards and gets
 * its own page: it is kept first on the sheet so the other cards pair
 * in order. */
/* On the evening of 9.10.: the printable sheet is the COMPILATION in the folder root,
 * made by its own stack tekija/tee_koonti.js (several lists on one sheet +
 * a combined platform card). These per-list sheets are in the subfolder
 * osa-arkit and serve as the compilation's reference (tekija/vertaa_koonti.py). */
const PD = path.resolve(CARDS, "..", "ship cards - tekijät ja arkisto", "puolustukset (ready)", "osa-arkit");
const pdOut = name => pdf(PD, "BFG_PUOLUSTUKSET_" + name);
const ordinals = stem => ["Primus", "Secundus", "Tertius"].map(o => stem + " " + o);

const pd_imperial = {
  out: pdOut("1_Imperial_yhteinen_pooli"),
  list: /^Imperial Navy . Bastion Fleets/,
  limit: 5000,
  title: "Planetary defences – shared Imperial pool, models to print",
  sub: "One card per model: Ramilies star fort · Blackstone fortress · 3 weapons platforms · " +
       "3 defence laser platforms · 3 torpedo launchers · 4 system ships · 12 orbital mines. " +
       "The same cards serve the Bastion, Mechanicus, Space Marine and Chaos fleets, and Orks as captured defences.",
  units: [
    { row: /^Ramilies class star fort$/i, name: "DIVINE RAMPART" },
    { row: /^Blackstone fortress$/i, name: "BLACKSTONE IV" },
    { row: /^Orbital weapons platform$/i, name: "VIGIL BATTERY", n: 3,
      members: ordinals("Vigil") },
    { row: /^Orbital defence laser platform$/i, name: "AEGIS LANCES", n: 3,
      members: ordinals("Aegis") },
    { row: /^Orbital torpedo launcher$/i, name: "BULWARK SILOS", n: 3,
      members: ordinals("Bulwark") },
    { row: /^System ship$/i, name: "HOME GUARD", n: 4,
      members: ["Vigilant", "Steadfast", "Resolute", "Watchful"] },
    { row: /^Orbital mine$/i, n: 12 },
  ],
};

/* The same Ramilies model is the Space Marines' fortress-monastery (Fleets p. 110). */
const pd_marines = {
  out: pdOut("2_Space_Marines_Fortress-Monastery"),
  list: /^Space Marines . Crusade/,
  limit: 5000,
  title: "Space Marines / Crusade – Fortress-Monastery, model to print",
  sub: "The Ramilies model plays the Fortress-Monastery for the Crusade fleet: 1000 pts from the " +
       "fleet's own points, deployed as a defence or in place of the planet (Fleets pg. 99, 110).",
  units: [
    { row: /^Fortress-Monastery$/i, name: "CITADEL OF OATHS" },
  ],
};

const pd_chaos = {
  out: pdOut("3_Chaos_hulk_Planet_Killer_Blackstone"),
  list: /^Chaos . Khorne/,
  limit: 5000,
  title: "Chaos / World Eaters – hulk, Planet Killer, Blackstone",
  sub: "Three models: Chaos Space Hulk · the Planet Killer · the Blackstone model as an Activated " +
       "Blackstone Fortress (the dormant Imperial profile is BLACKSTONE IV on the shared sheet).",
  ups: CHAOS_UPS,
  units: [
    { row: /^Chaos Space Hulk$/i, name: "DEVOURER OF STARS" },
    { row: /^Planet Killer$/i },
    { row: /^Activated Blackstone Fortress$/i, name: "WILL OF ETERNITY" },
  ],
};

const pd_orks = {
  out: pdOut("4_Orks_hulk_ja_Rok"),
  list: /^Orks . Waaagh/,
  limit: 5000,
  title: "Orks – space hulk and Rok, models to print",
  sub: "Three models: Ork Hulk · 2 Roks. Captured platforms, system ships and mines use the cards on " +
       "the shared Imperial sheet (Fleets pg. 360).",
  ups: ORK_UPS,
  /* 10.10.2026 (external review): Dakka Dakka is an "Ork capital ships"
     rule (Fleets p. 367) and boarding torpedoes +5 "any capital ship ...
     armed with torpedoes" (p. 359, which lists the Space Hulk separately).
     The hulk is Defence/40 and a Rok Defence/8: the rows are off. The hulk's own boarding
     torpedoes +15 (p. 389) stays. From 20.10.2026 the app no longer offers these
     rows to the hulk or the Roks, so their "off" is gone (the sheet fails if
     the app does not offer a named row). */
  units: [
    { row: /^Ork hulk$/i, name: "WURLD KILLA" },
    { row: /^Rok$/i, name: "LUMPA" },
    { row: /^Rok$/i, name: "THUMPA" },
  ],
};

/* Three small orbital models (1-, 2- and 3-storey): each gets a Security
 * orbital card with its own name; the modular Orbital is an alternative profile
 * for the same hulls (like the Chaos battle barge on the Slaverer hull). */
const pd_tau = {
  out: pdOut("5_Tau_orbitaalit_ja_Warsphere"),
  list: /^Tau . Commerce Protection/,
  limit: 5000,
  title: "Tau – orbitals and Kroot Warsphere, models to print",
  sub: "Five models: Kor caste orbital city · 3 small orbitals · Kroot Warsphere. Each small " +
       "orbital has a Security Orbital card; the Orbitals card is an alternative profile for " +
       "any of the three. Tau may field no other planetary defences (Fleets pg. 452).",
  units: [
    { row: /^Kor caste orbital city$/i, name: "DAL'YTH KOR'SHUTO EL'TAN" },
    { row: /^Security orbital$/i, name: "DAL'YTH RUN'AL TA'SHI" },
    { row: /^Security orbital$/i, name: "DAL'YTH RUN'AL REN'KA" },
    { row: /^Security orbital$/i, name: "DAL'YTH RUN'AL OL'UE" },
    { row: /^Orbitals \(core module\)$/i },
    { row: /^Kroot Warsphere$/i, name: "EYRIE OF GHOK" },
  ],
};

/* The same Haven model for both: the Eldar Haven and the Dark Eldar pirate base
 * with swapped weapons (Fleets p. 334, 337, 347). */
const pd_eldar = {
  out: pdOut("6_Eldar_Haven"),
  list: /^Eldar Corsairs . Later Gothic War/,
  limit: 5000,
  title: "Eldar Corsairs – Haven space station, model to print",
  sub: "One model, two cards: this Haven card for the Corsairs and the pirate base card on the " +
       "Dark Eldar sheet. Bought from the fleet's own points (Fleets pg. 337).",
  ups: ELDAR_UPS,
  units: [
    { row: /^Haven space station$/i, name: "RASH NIEAED" },
  ],
};

const pd_darkeldar = {
  out: pdOut("7_Dark_Eldar_pirate_base"),
  list: /^Dark Eldar . Pirates/,
  limit: 5000,
  title: "Dark Eldar – pirate base, the same Haven model",
  sub: "The Haven model as a Dark Eldar pirate base: Slavebringers for bombers and lances for " +
       "pulsars, the rest of the profile unchanged (Fleets pg. 337, 347).",
  ups: DARK_ELDAR_UPS,
  units: [
    { row: /^Haven space station \(pirate base\)$/i, name: "THE GILDED OUBLIETTE" },
  ],
};

/* The Necron asteroid station plays the general Space station profile (p. 507). */
const pd_necrons = {
  out: pdOut("8_Necrons_asema"),
  list: /^Necrons/,
  limit: 5000,
  title: "Necrons – space station, model to print",
  sub: "The tomb-asteroid model plays the generic Space Station profile (Fleets pg. 507); " +
       "Tyranids have no station and may spend defence points on ordnance (pg. 428).",
  units: [
    { row: /^Space station$/i, name: "PACIFICUS ANOMALY" },
  ],
};

/* Order = run order when no keys are given. */
/* ------------------------------------------------------------------ */
/* COMPILATIONS 12.10.2026 - one sheet per fleet */
/* ------------------------------------------------------------------ */

/* The user 12.10.2026: every earlier sheet has been printed, and each
 * fleet gets one compilation with the app's current card. Compilation =
 * the cards of the fleet's EXISTING and MISSING sheets + the ordinary cards of the
 * extra card sheets. Configurable special cards (IN Bastion, Tau, Dark Eldar, Chaos
 * grand cruisers, AdMech's CRUISER cards, defences) stay in their own
 * stacks. The Chaos compilation is made by its own machine (ship cards/
 * tekija_yhteinen/koonti_chaos.js), because its cards get extra rows.
 * The old sheet keys (admech, orks, ..._puuttuu, crusade, eldar) are
 * kept, but their PDFs were moved to the archive. */
/* The compilation parts go to the makers' folder; yhdista_koonnit.py assembles the root PDFs. */
const WORK = path.resolve(CARDS, "..", "ship cards - tekijät ja arkisto");
const koonti = name => pdf(path.join(WORK, "koontien osat"), "BFG_KOONTI_" + name);
const COMMANDER = /^(ARCHMAGOS|WARBOSS|PRINCE|AUTARCH)\b/;
/* Extra cards before the commanders, who are at the end of the sheet. */
const beforeCommanders = (units, extra) => {
  const i = units.findIndex(u => COMMANDER.test(u.name || ""));
  return i < 0 ? units.concat(extra) : units.slice(0, i).concat(extra, units.slice(i));
};

const koonti_admech = {
  out: koonti("Adeptus_Mechanicus"),
  list: admech.list, limit: 5000, ups: ADMECH_UPS,
  title: "Adeptus Mechanicus – all ship cards",
  sub: "Every Adeptus Mechanicus card except the four configurable CRUISER cards (Lunar / Gothic / " +
       "Tyrant), which stay on the add-on sheet. Proxies and class cards share hulls: one hull, one card per game.",
  units: beforeCommanders(admech.units, [
    ...admech_puuttuu.units,
    { row: /^Endurance class light cruiser$/i, name: "BELLEROPHON" },
    /* An unnamed carrier card for the modular hull; the nova prow now fits
       every hull (extra card sheet 11.10.2026). */
    { row: /^Dictator class cruiser$/i,
      ups: [[/^Nova Cannon instead of prow torpedoes$/i, "opt"]] },
    { row: /^Hunter Class Destroyer$/i, name: "THE SPIRIT OF MARS II SQUADRON", n: 3,
      members: ["Sagittarius", "Indagator", "Speculator"] },
  ]),
};

const koonti_orks = {
  out: koonti("Orks"),
  list: orks.list, limit: 5000, ups: ORK_UPS,
  title: "Ork Waaagh! – all ship cards",
  sub: "Every Ork card: the printed fleet, Fightaboss, Kroolboy as a fourth battleship profile for the " +
       "Dethdeala hull, and unnamed Terror Ship and Kill Kroozer cards for the extra hulls – write the " +
       "hull name in NOTES.",
  units: beforeCommanders(orks.units, [
    ...orks_puuttuu.units,
    { row: /^Kroolboy$/i, name: "KROOLBOY" },
    { row: /^Terror ship$/i },
    { row: /^Kill kroozer$/i },
    { row: /^Kill kroozer$/i },
  ]),
};

const koonti_necrons = {
  out: koonti("Necrons"),
  list: necrons.list, limit: 5000,
  title: "Necrons – all ship cards",
  sub: "The whole pool of 16 hulls: 1 Cairn · 4 Scythe · 3 Shroud · 4 Jackal · 4 Dirge.",
  units: [...necrons.units, ...necrons_puuttuu.units],
};

const koonti_tyranids = {
  out: koonti("Tyranids"),
  list: tyranids.list, limit: 5000, ups: tyranids.ups,
  title: "Tyranids – all ship cards",
  sub: tyranids.sub,
  units: tyranids.units,
};

const koonti_crusade = {
  out: koonti("Space_Marines_Crusade"),
  list: crusade.list, limit: 5000, ups: crusade.ups,
  title: "Space Marines — Crusade – all ship cards",
  sub: "Anvil of Faith, eight strike cruisers (four on basic weapons, Fleets p. 105), three escort " +
       "squadrons and the Master of the Fleet. First Covenant is one Venerable battle barge (0–1, " +
       "p. 99, 102) with seven alternative hull cards.",
  units: [
    ...crusade.units.filter(u => u.name === "ANVIL OF FAITH" || u.name === VEN),
    /* Two more hulls for the same Venerable: the user's own prints 12.-17.9.2026. */
    { row: /^Venerable battle barge$/i, name: VEN, hull: /^APOCALYPSE CLASS/ },
    { row: /^Venerable battle barge$/i, name: VEN, hull: /SEDITIO OPPRIMERE/i },
    ...crusade.units.filter(u => u.name !== "ANVIL OF FAITH" && u.name !== VEN),
    { row: /^Master of the Fleet \(Ld 10\)/i, name: "MASTER OF THE FLEET" },
  ],
};

/* Eldar Corsairs: the printed sheet is configurable (one Aurora / Solaris
   card for a light cruiser), so it stays as it is and gets no compilation. */

module.exports = {
  koonti_admech, koonti_orks, koonti_necrons, koonti_tyranids, koonti_crusade,
  admech, orks, chaos, necrons, tyranids,
  admech_puuttuu, orks_puuttuu, chaos_puuttuu, necrons_puuttuu, crusade,
  crusade1200, crusade1500, eldar, darkeldar,
  pd_imperial, pd_marines, pd_chaos, pd_orks, pd_tau, pd_eldar, pd_darkeldar, pd_necrons,
};
