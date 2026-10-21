/* Scenario Library: skenaarioiden omat maastot kartan selitteessä (0.13, 21.10.2026).

   Käyttäjä 21.10.: "terrain click saisi tuoda esiin jonkun selvennuksen että mikä terrain ja vaikka tiiviisti sen
   säännöt. eräänlainen popup. tämä siis kaikissa" ja "tuo sama terrain selitys sitten skenaarioiden custom terrainille
   kanssa samaan tyyliin". Kirjan maastot (planeetat, kuut, asteroidikentät, kaasurenkaat, arvotut palat) selittyvät
   itsestään ytimen RULES-taulusta (index.html: terrHit, terrPop). Tähän tulevat skenaarioiden OMAT maastot: komeetat,
   musta aukko, neutronitähti, anomalia, hylyt, pesä, portti, räjähdykset, läpipääsemättömät asteroidit jne.

   TERR_INFO[skenaario] = lista selitteitä:
     n   otsikko (ja tunniste: "m:" + n)
     m   (esine, versio) => osuuko tähän karttaesineeseen (mapOf merkitsee esineen: it.ti). Yksi selite voi
         osua moneen esineeseen (komeetta + sen reitti), jolloin kaikki korostuvat yhdessä.
     g   arvotun palan laji ("gas"...): selite liitetään tämän skenaarion arvottuihin paloihin, ei karttaesineeseen
     w   Play-välilehden sääntörivien otsikot: rivit luetaan skenaariosta (vain tämän version rivit), ei kopioida tänne
     t   lisärivit (tpl: {a:...} toimii)
     k   kirjan maastolaji, jonka säännöt näytetään perässä ("asteroid", "gas", "rift", "planet", "moon"), tai funktio(v)
   Säännöt ovat skenaarion omia; kun lähde ei anna sääntöä (Hyran romukentät), tulkinta sanotaan ääneen. */
"use strict";
const TERR_INFO = {
  /* ---- kirjat ja Fleets */
  "fan-n-comet": [
    { n: "The comet", m: it => (it.z === "mark" && it.s === "n") || (it.z === "line") || (it.z === "text" && /^comet path$/.test(it.l || "")), k: "asteroid",
      w: ["Start of every turn", "Hidden in the comet’s shadow"],
      t: ["A small model with a teardrop tail about 20 × 5 cm. Its tail is a gas cloud that blocks line of sight (RB p. 110).", "Which end of the path it starts from is rolled in the Set-up tools; it moves 10 cm a turn toward the far edge and turns back there."] },
    { n: "Gehenna III", m: it => it.z === "planet" && it.r > 10, k: "planet", t: ["The large planet on the left edge, with its two moons."] },
    { n: "Moon of Gehenna III", m: it => it.z === "planet" && it.r <= 10, k: "moon", t: ["The second moon carries the Mechanicus base: the Orbital Command Center and its defences."] }
  ],
  "fan-p-no-way-out": [
    { n: "The comet", m: it => it.z === "planet" || (it.z === "ring" && it.s === "n") || (it.z === "text" && /^comet$/.test(it.l || "")), w: ["The comet"],
      t: ["A moon in the centre with a 5 cm gravity well (the dashed ring): a free turn of up to 45° toward it at the start and at the end of a move, as with a planet (RB p. 113)."] },
    { n: "The comet’s tail", m: it => (it.z === "rect" && it.dash && it.s === "n") || (it.z === "text" && /^tail:/.test(it.l || "")), k: "gas", w: ["The comet"],
      t: ["A dust cloud 3D6 cm long (rolled in the Set-up tools), pointing away from the sunward edge. The Merchant’s contact marker sits in it, inside the gravity well."] }
  ],
  "fan-n-hulk": [
    { n: "The hulk", m: it => it.z === "mark", w: ["The hulk", "Finding the booty", "Losing the booty"] }
  ],
  "fan-n-naravona": [
    { n: "Phenomena on the sides", m: it => it.z === "hatch" || (it.z === "text" && /phenomena/i.test(it.l || "")),
      t: ["Celestial phenomena are generated only in the hatched strips; the Naravona passage between them stays clear ({a:pass} cm wide)."] }
  ],
  "fan-p-rising-shadow": [
    { n: "The warp rift", m: it => (it.z === "rect" && it.dash && it.s === "n") || (it.z === "text" && /warp rift box/.test(it.l || "")), k: "rift",
      t: ["About 20 × 35 cm, placed by scatter dice in this box up to 45 cm from a short edge: {a:rift}."] }
  ],
  "fan-p-hunter-prey": [
    { n: "Nebula cloud", g: "gas", w: ["The nebula"] }
  ],
  /* ---- Classic GW */
  "cl-corribra-4": [
    { n: "The asteroid field", m: it => it.z === "hatch" || it.z === "cm" || (it.z === "text" && /^field/.test(it.l || "")), k: "asteroid",
      w: ["End of each Imperial turn", "Asteroids"], t: ["At least 15 × 30 cm, in the centre. The dashed box is 15 cm around it: an Imperial ship ending its turn inside lets the Gork’s Pay appear."] }
  ],
  "cl-planet-fall": [
    { n: "Low orbit (the article’s rule)", m: it => (it.z === "ring" && it.r === 10) || (it.z === "text" && /low orbit/.test(it.l || "")), w: ["Planet fall"],
      t: ["Within 2 cm of Medusa V on the main table: not the rulebook’s low orbit table (RB p. 116)."] }
  ],
  "bc-alien-intervention": [
    { n: "The drifting hulk", m: it => it.z === "mark" && it.s === "n",
      t: ["Anywhere within 30 cm of the table centre, with the planet.", "A drifting hulk blocks lines of fire that pass over its base; it has no shields and its turrets count as 0 (RB p. 71)."] }
  ],
  /* ---- Warp Rift */
  "wr-fall-of-hyra": [
    { n: "Hyra", m: it => it.z === "planet" || (it.z === "ring" && it.s === "n"), k: "planet", w: ["Hyra’s gravity", "Orbital support"],
      t: ["The article gives Hyra a 20 cm gravity well (the dashed ring)."] },
    { n: "Debris fields", m: it => it.z === "hatch", k: "asteroid",
      t: ["The article scatters debris fields around Hyra but gives them no rules of their own: play them as asteroid fields, or agree otherwise."] }
  ],
  "wr-the-corpse": [
    { n: "The corpse", m: it => it.z === "mark" || it.z === "circ", w: ["Landing harvest squads", "Extracting", "Killing squads", "The corpse itself"],
      t: ["A model on a 60 mm (battleship) base; the circle is 10 cm from it."] }
  ],
  "wr-nest-raid": [
    { n: "The Psultoroth nest", m: it => it.z === "circ" || (it.z === "text" && /nest/.test(it.l || "")), w: ["End of your turn", "Carrying eggs", "Leaving"],
      t: ["A 15 cm circle; the article gives it no other properties."] }
  ],
  "wr-shattered-gate": [
    { n: "The webway gate", m: it => it.z === "mark" || (it.z === "ring" && it.s === "n"), w: ["The Gate", "If it is destroyed", "Turn 3", "Controlling the Gate"],
      t: ["No phenomena within 15 cm of it (the dashed ring)."] }
  ],
  "wr-mobeel-narrows": [
    { n: "Impassable asteroids", m: it => it.z === "hatch" || (it.z === "text" && /impassable/.test(it.l || "")), w: ["Asteroids"],
      t: ["Not the rulebook’s asteroid field: nothing goes through. The only way is the 60 cm gap between the forts."] },
    { n: "The minefields", m: it => it.z === "rect" && /minefields/.test(it.l || ""),
      t: ["Three minefields in the gap, no closer than 20 cm to the Imperial start line. Use the Fleets book’s minefield rules (FL p. 513); the source places them itself, so ignore the 15 cm placement limit."] }
  ],
  "wr-fannons-patrol": [
    { n: "The great asteroid field", m: it => (it.z === "hatch" && it.h === 4) || (it.z === "edge" && it.e === "t"), w: ["Leaving the table"],
      t: ["Runs along the whole long edge opposite the planet: a ship that leaves the table over it is destroyed."] },
    { n: "The three asteroid fields", m: it => it.z === "hatch" && it.h !== 4, k: "asteroid", w: ["Hidden pirates"],
      t: ["15 × 25 cm each, 25 cm apart against the long edge; the first starts 30 cm from the patrol’s edge. The pirates lie in two of the three."] },
    { n: "The gas planet", m: it => it.z === "planet" || (it.z === "text" && /gas planet/.test(it.l || "")), k: "planet", t: ["In the corner, 5 cm from both edges; the article does not give its size."] }
  ],
  "wr-norduun": [
    { n: "The warp gate", m: it => it.z === "text" && /warp gate/.test(it.l || ""), w: ["The convoy"],
      t: ["On the right short edge near the convoy’s corner: the transports head roughly toward it."] }
  ],
  "wr-diasporex-diversions": [
    { n: "Mighty explosions", m: it => (it.z === "rect" && it.s === "n") || (it.z === "text" && /explosions/.test(it.l || "")), w: ["Moving through an explosion", "Every end phase"],
      t: ["Templates 5 × 10, 10 × 10 and 10 × 15 cm for each player, at least 5 cm apart and 10 cm from any ship; the ones drawn are only examples."] }
  ],
  "wr-depth-of-space": [
    { n: "Pirate hideout", m: it => it.z === "hatch", t: ["A strong defensive position for the pirates. The article suggests a modified Hunter and the Prey or The Bait; agree what the hideout is made of."] }
  ],
  "wr-looting-the-hulk": [
    { n: "The hulk", m: it => it.z === "mark" && /hulk/.test(it.l || ""), w: ["Boarding the hulk", "Searching", "Fighting over it", "Towing", "Shooting the hulk"] }
  ],
  /* ---- fanilisäosat: Tournament Mission Pack ja Advanced Scenarios */
  "fan-t-hide": [
    { n: "The anomaly", m: it => it.s === "c" && (it.z === "mark" || it.z === "ring" || it.z === "text"), w: ["End of each movement phase, before shooting", "Cover"] }
  ],
  "fan-t-black-hole": [
    { n: "The black hole", m: it => it.s === "c" && (it.z === "edge" || it.z === "arrow" || (it.z === "text" && it.l === "pull")),
      w: ["Start of each game turn: gravity pull", "Start of the first player’s turn: gravity pull", "Point of no return", "Victory points"],
      t: ["Which short edge it is: rolled after deployment (Set-up tools); the map shows the left one."] }
  ],
  "fan-t-wrecks": [
    { n: "The wrecks", m: it => it.z === "mark" || (it.z === "text" && /wrecks/.test(it.l || "")), w: ["Wrecks", "Salvaging", "Open Sesame"],
      t: ["Seven, evenly spaced 10 cm from the planet’s edge."] }
  ],
  "fan-t-neutron": [
    { n: "The neutron star", m: it => it.z === "circ" || (it.z === "text" && /neutron/.test(it.l || "")), w: ["Start of every player turn: the pull", "Touching the star"],
      t: ["The pack does not give its size; 6 cm across is our default."] },
    { n: "The mysterious wreck", m: it => it.z === "mark", w: ["Every game turn: the mysterious wreck", "Recovering the wreck (450 VP)"] }
  ],
  "fan-t-brace": [
    { n: "Hurtling asteroids", m: it => it.s === "c" && (it.z === "arrow" || it.z === "text"), k: "asteroid",
      w: ["Start of each game turn: next wave", "Incoming", "One goes in…", "Start of each game turn", "Hits", "Through an asteroid field"],
      t: ["Entrance points 2–12 along the short edge; each new asteroid’s entry is rolled on 2D6 (tools on the Play tab). Small asteroid markers, moved 30 cm a turn."] }
  ],
  "fan-t-shepard": [
    { n: "The rings", m: it => (it.z === "rect" && it.s === "n") || (it.z === "text" && it.l === "ring"), t: ["Two large rings crossing in the middle. What they are made of: {a:rings}."] },
    { n: "The shepherd moon", m: it => it.z === "planet", k: "moon", w: ["The shepherd moon", "No take-backs"], t: ["Where it sits: {a:moon}."] }
  ],
  "fan-t-retrieve-salvage": [
    { n: "Salvage markers", m: it => it.z === "mark" || (it.z === "text" && /salvage markers/.test(it.l || "")), w: ["Picking up salvage"],
      t: ["Ten markers in two lines parallel to the long edges; the map shows the default agreed in the Set-up."] }
  ]
};
