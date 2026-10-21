/* Korttiarkkien maaritykset generaattorille make_fleet_cards.js.
 *
 * Yksi arkki = yksi laivastolista sovelluksessa. Jako OLEMASSA / PUUTTUU
 * seuraa sita, onko runko oikeasti tulostettu (tulosteet/valmiit/ship cards/
 * LUEMINUT.md). Kortit tehdaan sovelluksen omalla buildCardSheet():lla, joten
 * profiilit, hinnat ja saannot tulevat sovelluksen datasta - tassa tiedostossa
 * paatetaan vain MITKA kortit, milla nimilla ja mitka valinnat jaavat auki.
 *
 * Arkin kentat:
 *   out    PDF:n polku
 *   list   saannollinen lauseke listan nimeen (LISTS[].nm)
 *   title  arkin otsikko (tyhja -> "<lista> - fleet cards")
 *   sub    toinen otsikkorivi: mita poydalla on (enintaan kaksi rivia)
 *   ups    arkin oletukset listan paivityksille [[regex, tila]]: koskee
 *          jokaista korttia, jolle sovellus paivitysta TARJOAA
 *   units  kortit jarjestyksessa
 *
 * Kortin kentat:
 *   row      regex listan riviin (alus- tai komentajarivi)
 *   name     kortin otsikko (tyhja -> luokan nimi)
 *   n        runkoja; escorteilla laivueen koko
 *   members  escort-laivueen alusten nimet
 *   opt      aluksen omat optiot [[regex optiotekstiin, tila]]
 *   rest     tila optioille joita opt ei nimea (oletus: sovelluksen oma)
 *   ups      listan paivitykset talle kortille; voittaa arkin oletuksen, ja
 *            kaatuu jos sovellus ei tarjoa paivitysta
 *
 * Tilat: "take" = rasti (kuuluu runkoon), "opt" = tyhja ruutu (valitaan
 * poydalla), "off" = ei tulostu.
 *
 * LINJA (10.9.2026): valinta jaa auki, ellei tulostettu runko lukitse sita.
 * Lukittuja ovat vain rakennetut erot - Crassuksen nova cannon, Gutstabban
 * torpedo launcha, Deathdealan Dakka Dakka, tyranidien kasvatetut aseet -
 * ja vanhojen korttien nimetyt identiteetit (Killfrenzy = Daemonship,
 * Soulless = World Eaters -miehisto). Auki jatetaan aluksen omat optiot ja
 * listan paivityksista vain ne, jotka muuttavat alusta: power ram, plasma-
 * boosted batteries, torpedo bombers, Dakka Dakka, crew, Daemonship,
 * komentajan re-rollit. Pois jatetaan koko laivaston ostot kortilta
 * (Necronien ja tyranidien re-rollit, bio-enhancements x 15), orbital mines
 * (BACKLOG J21: kortti ei viela vaihda hyokkaysaluksia miinoiksi) seka
 * tyranidien ordnance-markerit. */
const path = require("path");

const CARDS = path.resolve(__dirname, "..", "tulosteet", "valmiit", "ship cards");
const MISSING = path.join(CARDS, "puuttuvat");
const pdf = (dir, name) => path.join(dir, name + "_150pct_2up_A4.pdf");

/* Roomalaiset numerot laivueiden oletusnimiin. */
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
    /* Gothic-rungot on rakennettu eri keulilla: nova ja torpedot. */
    { row: /^Gothic class cruiser$/i,     name: "CRASSUS",
      ups: [[/^Nova Cannon instead of prow torpedoes$/i, "take"]] },
    { row: /^Gothic class cruiser$/i,     name: "EMPEROR'S WRATH" },
    { row: /^Lunar class cruiser$/i,      name: "LORD DAROS" },
    /* Vaihtoehtoprofiili Gothic-rungolle; nimi = luokka. */
    { row: /^Tyrant class cruiser$/i },
    { row: /^Retribution class battleship$/i, name: "GLORY OF GEHENNA",
      ups: [[/^Nova Cannon instead of prow torpedoes \(Retribution\)$/i, "opt"]] },
    /* Nelja kevytristeilijarunkoa oletusluokissaan (paikkalaput/LUEMINUT_v2)
       ja kolme nimetonta luokkakorttia vaihtoa varten. */
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
    /* Seitseman omaa optiota riittaa; torpedo bombers ei mahdu jarkevasti. */
    { row: /^Chaos battle barge$/i,
      ups: [[/^Torpedo bombers$/i, "off"]] },
    { row: /^Hecate class heavy cruiser$/i,  name: "BLADE OF FURY" },
    { row: /^Acheron class heavy cruiser$/i, name: "CHAOS ETERNUS" },
    { row: /^Hades class heavy cruiser$/i,   name: "WARMAKER" },
    { row: /^Murder class cruiser$/i,        name: "DOOMBRINGER" },
    { row: /^Carnage class cruiser$/i,       name: "ANARCHIC VENDETTA" },
    /* Kaksi Slaughteria: vanhat identiteetit sailyvat rasteina. */
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

/* Poolin laajennus 9.10.2026: 8 uutta runkoa, joita ei ole viela tulostettu.
 * Nimet kirjan Famous Ships -riveilta (s. 268-280).
 *
 * Grand cruiserit EIVAT ole enaa talla arkilla (kayttaja 9.10. illalla:
 * konfiguroitavat kuten IN Bastion, carrier uniikkina mallina). Ne tekee oma
 * pino "chaos lisäys (tehtävä ja printattava)/tekija/tee_chaos_gc.js":
 *   CH-31 FOEBANE       Retaliator, kiintea kortti
 *   CH-32 BLOOD ROYALE  yksi konfiguroitava kortti: Repulsive / Vengeance / Executor
 * Aiempi versio (kummallakin rungolla nelja luokkakorttia, 14 korttia) on
 * tallessa kansiossa "luokkakortit (vanha)".
 *
 * 10.10.2026: myos kuusi risteilijakorttia (CH-25...CH-30) siirtyivat omaan
 * pinoon "chaos lisäys (tehtävä ja printattava)/tekija/tee_lisays.js", koska
 * ne saavat lisayksia, joita sovellus ei avoimelle kortille tulosta
 * (Mark of Khorne miehiston kanssa, Daemonship / miehisto -or, oikea max).
 * Arkin avain chaos_lisays on poistettu TARKOITUKSELLA: generaattori
 * kirjoittaisi saman PDF:n yli lisayksettomalla versiolla. */

/* ------------------------------------------------------------------ */
/* NECRONS - Harvest Fleet                                             */
/* ------------------------------------------------------------------ */

/* Re-rollit ovat koko laivaston ostoja eivatka kuulu yksittaiselle kortille. */
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

/* Isojen alusten aseet ovat kasvatettuja: vanhan kortin aselasti lukitaan
   (rest: "off") ja vain kayttamaton sivupari jaa auki. Escorttien ase
   valitaan pelikohtaisesti, joten laivuekortilla kaikki aseet ovat auki -
   yksi kortti korvaa vanhat kahdeksan Kraken-varianttia. */
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

/* Honour Guard: +10 / alus, vain battle bargelle ja strike cruiserille
   (Fleets s. 96). Escorteille sita ei saa, joten ne eivat pyyda sita.
   Strike cruiserin keula ja launch bay -paikka ovat magnetoituja: kaikki
   asevalinnat jaavat auki. */
const HG = [[/^Honour Guard$/i, "opt"]];

/* Fleets s.105: "At a minimum, as many strike cruisers in the fleet must be
   armed with their basic weapons as listed above as all other variants (with
   replaced launch bays and/or prow bombardment cannon) combined." Neljä
   runkoa (kayttaja 10.9.2026) on siksi lukittu perusaseisiin: kolme
   asevaihtoa pois, lisakilpi (+15) ja Honour Guard (+10) jaavat auki -
   ne eivat ole variantteja. Neljä muuta ovat vapaasti konfiguroitavia,
   joten laivasto on saannon mukainen millä tahansa rasteilla. */
const SC_BASIC = [[/^May replace its launch bays/i, "off"],
                  [/^May replace its prow bombardment cannon/i, "off"]];

/* Laivastossa voi olla vain yksi Venerable battle barge (s. 99, 102), joten
   kaikilla viidellä profiililla on sama nimi (käyttäjä 11.9.2026, SM-V1). */
const VEN = "FIRST COVENANT";

const crusade = {
  out: pdf(MISSING, "BFG_PUUTTUU_Space_Marines_Crusade"),
  list: /^Space Marines . Crusade/,
  limit: 1500,
  /* Venerable-korteille Honour Guard auki kun tarjotaan (s. 99). */
  ups: [[/^Honour Guard$/i, "opt"]],
  title: "Space Marines — Crusade – not printed",
  sub: "Anvil of Faith and eight strike cruisers – four on basic weapons (Fleets p. 105), " +
       "four configurable. Venerable battle barges (0–1, from 1000 pts, replaces a battle " +
       "barge – p. 99, 102) are alternative profiles: proxy the Oberon on the AdMech model. " +
       "Hunters are played on the AdMech models; Master of the Fleet is on the roster sheets.",
  units: [
    { row: /^Battle barge$/i,          name: "ANVIL OF FAITH", ups: HG },
    /* Venerable battle barge (s. 102): runko valitaan riviltä, kaikki mitä
       sovellus tarjoaa jää auki - keulan S6-torpedovaihto, Honour Guard,
       Desolatorin special torpedoes. Orbital mines pois kuten muualla (J21).
       Viisi runkoa: kestävyys + ordnance + 60 cm aseet (käyttäjä 11.9.2026). */
    { row: /^Venerable battle barge$/i, name: VEN, hull: /^OBERON CLASS/ },
    /* Desolatorin S9-keulatorpedot: special torpedoes (Rulebook s. 19,
       yleinen yksittäispelin osto, ei profiilin refit) auki. */
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
    /* Kahdeksas runko (SM-09, lisätty 11.9.2026). */
    { row: /^Strike cruisers$/i,       name: "RELENTLESS",     ups: HG },
    { row: /^Nova class Frigate$/i,    n: 6 },
    { row: /^Gladius class Frigate$/i, n: 6 },
    { row: /^Hunter class Destroyer$/i, n: 6 },
  ],
};

/* Vakiorosterit. Nama ovat projektin anti-optimointiperiaatteen mukaiset
   listat, ei matchup-minmaxeja: 1200 = kaikki mita kuusi mallia antaa,
   1500 = koko capital ship -pooli poydalle. Rosteriarkki on ainoa paikka
   jossa Master of the Fleet nakyy - komentajalla ei ole runkoa eika siten
   omaa korttia. */
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

/* Kaikki listan ORDNANCE-ostot jaavat auki (kayttaja 14.9.2026: "optiot
   kaikki avoinaisina"). Orbital mines on mukana, toisin kuin muilla
   arkeilla: J21 korjasi kortin miinarivin, ja tama arkki on ensimmainen
   joka tehdaan sen jalkeen. Sovellus tarjoaa kunkin rivin vain sille
   alukselle jolle kirja sen sallii - torpedo bombers vain laskuruumille,
   erikoistorpedot vain torpedoaluksille, miinat vain risteilijoille. */
const ELDAR_UPS = [
  [/^Torpedo bombers$/i, "opt"],
  [/^Special torpedoes \(Eldar, Strength up to 6\)$/i, "opt"],
  [/^Special torpedoes \(Eldar, Strength 7 or more\)$/i, "opt"],
  [/^Orbital mines$/i, "opt"],
  [/^(One|Two|Three) re-rolls?$/i, "opt"],
];

/* Nelja kevytristeilijarunkoa pelaavat seka Auroraa etta Solarista, joten
   jokainen saa kaksi korttia samalla nimella. Nimikilvessa lukee
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
    /* Komentajat. Kirja vaatii Pirate Princen yli 750 pisteen laivastoon
       (s. 317), joten arkilla on oltava komentajakortti. */
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
/* DARK ELDAR - Pirates (Fleets s. 351-353)                            */
/* ------------------------------------------------------------------ */

/* Kayttaja 2.10.2026: 4 risteilijaa ja 13 escorttia, "kaikki
   konfiguroitavissa taysilla optioilla". Mitaan ei rastiteta: Torturen
   lisaase (launch bays / phantom lance / torpedot / 1-2 Impaleria) ja
   Corsairin ase jaavat auki, samoin Mimic engines ja kaikki ordnance-ostot.

   Identiteetti: Sky Serpents, Duke Traevelliath Sliscuksen Dark Eldar
   -korsaarit (Lexicanum: Codex Dark Eldar 5th s. 51). Kanoniset alukset:
   Incessant Agony = Sliscuksen lippulaiva (Lukas the Trickster, luku 3; luokkaa
   ei mainita), Ribald Blade = Torture class (sama, luku 9). Fleets-kirja ei
   nimea yhtaan Dark Eldar -alusta, joten muut nimet ovat lore-tyylisia
   (kaarme- ja myrkkyteema).

   Laivueet: 13 runkoa laivueina 2-6 (s. 351) = 3-6 laivuetta, ja kortti on
   yksi asevalinta. Kuusi korttia kattaa jokaisen laillisen jaon; neljalla
   on oletusjasenet 4+3+3+3 (yksi laivue risteilijaa kohden, kirjan "vahintaan
   3 escorttia jokaista capital shipia kohden"), kaksi on tyhjia varakortteja. */
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
    /* Pakollinen yli 750 pisteen laivastossa (s. 351). */
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
    /* Varakortit 5. ja 6. laivueelle: jasenet kirjoitetaan kasin. */
    { row: /^Corsair Class Escort$/i, name: "TONGUE SQUADRON", n: 6 },
    { row: /^Corsair Class Escort$/i, name: "HOOD SQUADRON", n: 6 },
  ],
};

/* ------------------------------------------------------------------ */
/* PUOLUSTUKSET, HULKIT JA PLANET KILLER (9.10.2026)                   */
/* ------------------------------------------------------------------ */

/* Yksi kortti per malli tulostusprojektissa models/defences/Defences.3mf
 * (kayttajan muokkaama 7.10., se maaraa kappalemaarat). Mallit ovat yhteisia
 * usealle laivastolle, mutta arkki = yksi laivastolista sovelluksessa, joten
 * kortit on jaettu listoittain; make_puolustuskortit.py ajaa arkit ja yhdistaa
 * PDF:t yhdeksi tulostustiedostoksi (BFG_PUOLUSTUKSET_KAIKKI). Nimet ja
 * tunnukset PD-01...: nimitaulukon lehti "Puolustukset" ja kansion LUEMINUT.md.
 *
 * Ihmisten yhteinen pooli (alustat, system shipit, miinat, Blackstone,
 * Ramilies) ajetaan Bastion-listalta: yleiset puolustusrivit ovat samat joka
 * listalla (Fleets s. 499), joten samat kortit kelpaavat AdMechille, Space
 * Marineille, Chaosille ja orkkien kaappaamina (s. 360).
 *
 * Linnake (Ramilies, Fortress-Monastery) tulostuu kahtena korttina ja saa
 * oman sivunsa: pidetaan se arkin ensimmaisena, jotta muut kortit parittuvat
 * jarjestyksessa. */
/* 9.10. illalla: tulostettava arkki on kansion juuressa oleva KOONTI, jonka
 * tekee oma pino tekija/tee_koonti.js (monta listaa samalla arkilla +
 * yhdistetty alustakortti). Nama listakohtaiset arkit ovat alikansiossa
 * osa-arkit ja toimivat koonnin vertailukohtana (tekija/vertaa_koonti.py). */
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

/* Sama Ramilies-malli on Space Marinejen linnakeluostari (Fleets s. 110). */
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
  /* 10.10.2026 (ulkoinen tarkastus): Dakka Dakka on "Ork capital ships"
     -saanto (Fleets s. 367) ja boarding torpedoes +5 "any capital ship ...
     armed with torpedoes" (s. 359, joka luettelee Space Hulkin erikseen).
     Hulk on Defence/40 ja Rok Defence/8: rivit pois. Hulkin oma boarding
     torpedoes +15 (s. 389) jaa. 20.10.2026 sovellus ei enaa tarjoa naita
     rivejä hulkille eika Rokeille, joten niiden "off" pois (arkki kaatuu, jos
     sovellus ei tarjoa nimettya rivia). */
  units: [
    { row: /^Ork hulk$/i, name: "WURLD KILLA" },
    { row: /^Rok$/i, name: "LUMPA" },
    { row: /^Rok$/i, name: "THUMPA" },
  ],
};

/* Kolme pienta orbitaalimallia (1-, 2- ja 3-kerroksinen): kullekin Security
 * orbital -kortti omalla nimellaan; modulaarinen Orbital on vaihtoehtoprofiili
 * samoille rungoille (kuten Chaos battle barge Slaverer-rungolla). */
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

/* Sama Haven-malli molemmille: Eldarin Haven ja Dark Eldarin pirate base
 * vaihdetuin asein (Fleets s. 334, 337, 347). */
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

/* Necron-asteroidiasema pelaa yleista Space station -profiilia (s. 507). */
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

/* Jarjestys = ajojarjestys, kun avaimia ei anneta. */
/* ------------------------------------------------------------------ */
/* KOONNIT 12.10.2026 - yksi arkki per laivasto                        */
/* ------------------------------------------------------------------ */

/* Kayttaja 12.10.2026: kaikki aiemmat arkit on tulostettu, ja jokaiselle
 * laivastolle tehdaan yksi koonti sovelluksen nykyisella kortilla. Koonti =
 * laivaston OLEMASSA- ja PUUTTUU-arkkien kortit + lisakorttiarkkien tavalliset
 * kortit. Konfiguroitavat erikoiskortit (IN Bastion, Tau, Dark Eldar, Chaos-
 * grand cruiserit, AdMechin CRUISER-kortit, puolustukset) pysyvat omissa
 * pinoissaan. Chaoksen koonti tehdaan omalla koneella (ship cards/
 * tekija_yhteinen/koonti_chaos.js), koska sen kortit saavat lisarivit.
 * Vanhat arkkiavaimet (admech, orks, ..._puuttuu, crusade, eldar) ovat
 * tallessa, mutta niiden PDF:t on siirretty arkistoon. */
/* Koontien osat menevat tekijakansioon; juuren PDF:t kokoaa yhdista_koonnit.py. */
const WORK = path.resolve(CARDS, "..", "ship cards - tekijät ja arkisto");
const koonti = name => pdf(path.join(WORK, "koontien osat"), "BFG_KOONTI_" + name);
const COMMANDER = /^(ARCHMAGOS|WARBOSS|PRINCE|AUTARCH)\b/;
/* Lisakortit ennen komentajia, jotka ovat arkin lopussa. */
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
    /* Nimeton carrier-kortti modulaariselle rungolle; nova-keula sopii nyt
       jokaiseen runkoon (lisakorttiarkki 11.10.2026). */
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
    /* Kaksi runkoa lisaa samalle Venerablelle: kayttajan omat tulosteet 12.-17.9.2026. */
    { row: /^Venerable battle barge$/i, name: VEN, hull: /^APOCALYPSE CLASS/ },
    { row: /^Venerable battle barge$/i, name: VEN, hull: /SEDITIO OPPRIMERE/i },
    ...crusade.units.filter(u => u.name !== "ANVIL OF FAITH" && u.name !== VEN),
    { row: /^Master of the Fleet \(Ld 10\)/i, name: "MASTER OF THE FLEET" },
  ],
};

/* Eldar Corsairs: tulostettu arkki on konfiguroitava (kevytristeilijalla yksi
   Aurora / Solaris -kortti), joten se jaa ennalleen eika saa koontia. */

module.exports = {
  koonti_admech, koonti_orks, koonti_necrons, koonti_tyranids, koonti_crusade,
  admech, orks, chaos, necrons, tyranids,
  admech_puuttuu, orks_puuttuu, chaos_puuttuu, necrons_puuttuu, crusade,
  crusade1200, crusade1500, eldar, darkeldar,
  pd_imperial, pd_marines, pd_chaos, pd_orks, pd_tau, pd_eldar, pd_darkeldar, pd_necrons,
};
