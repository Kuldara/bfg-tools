/* Fan supplements: Book of the Void (25.10.2026). The Discordia sector campaign books of the Battlefleet Gothic
   Discord community:
     Book of the Void I: The Discordia Incident (project leads Robert C. M. "Zelnik" Passovoy, Lucas F. "Fr05ty" Zocco
       and Roy "horizon" Amkreutz) — four historical scenarios (p. 51–56) and three bonus scenarios (p. 57–59).
     Book of the Void II: Xenos Tide (project lead Roy "horizon" Amkreutz) — the linked scenarios "Devourer
       Unleashed" (PDF p. 53–57; the printed number is one lower).
   Book of the Void III (The Draupnir War), BFG Dreadnoughts, Rogue Traders Reforged and the Rak'Gol pre-release in the
   same download are fleet lists and rules without scenarios. Page numbers are PDF pages, as for the other supplements. Summarised in our own
   words; every scenario is hand-made (see the app's README). Owner 25.10.: "add them so they reach the same level of
   quality and certainty as the existing ones". */
(function () {
  /* horizon 25.10.: "I wrote all scenarios ... Only thing I really did for BotV1" and "For BotV2 I did almost everything" */
  const V1 = "Scenario by Roy “horizon” Amkreutz, from Book of the Void I: The Discordia Incident, a fan supplement by the Battlefleet Gothic Discord community — project leads Robert C. M. “Zelnik” Passovoy, Lucas F. “Fr05ty” Zocco and horizon; edited by Italianmoose and horizon; layout by Christopher “Grifftofer” Griffiths.";
  const V2 = "Scenario by Roy “horizon” Amkreutz, from Book of the Void II: Xenos Tide, a fan supplement he led and largely wrote; text editing by Captain Ardias, ArcaneShipyard and Hexagrammaton, with story and rules input from Robert C. M. Passovoy, Fr05ty, Alpharisus, NateHA-FlybyWire, IFoldyGo and Captain Ardias; Tyranid drawings by Wintermans.";
  const P1 = n => "Book of the Void I p. " + n;
  const P2 = n => "Book of the Void II p. " + n;
  const OTHERS_V1 = "Written for the Book of the Void fleets: the Adepta Sororitas, the Diasporex nomads and Da Grot Rev’looshun (Book of the Void I p. 14–50). Any fleets can play with ships of similar size; the Grots follow the Ork rules (FL p. 359–).";
  const OTHERS_V2 = "Written for the Book of the Void II lists (Battlegroups “Seiche” and “Storm Surge”, Hivefleet Devourer). Book alternative: an Imperial Navy fleet with merchants (FL p. 454) against a Tyranid hive fleet (FL p. 430) or vanguard fleet (FL p. 429).";
  const CAMP2 = "Devourer Unleashed is a linked series: Avaheim leads to Vallar’s Gambit (Imperial win) or Vallar’s Eulogy (Tyranid win), then The Sirvos Disaster and The Last Wave. Each can also be played on its own.";
  const vpTools = (a, b) => [{ k: "num", id: "va", s: "a", l: a + ": victory points", after: v => v + " VP" }, { k: "num", id: "vb", s: "b", l: b + ": victory points", after: v => v + " VP" }];
  const vpr = (st, a, b) => { const x = num(st, "va"), y = num(st, "vb"); if (!x && !y) return [null, "Count victory points", "Enter both totals below."]; return x === y ? ["draw", "Level", "Both " + x + " VP."] : [x > y ? "a" : "b", wins(x > y ? a : b), a + " " + x + " VP, " + b + " " + y + " VP."]; };
  const ending = (st, rows, id) => { const i = get(st, id || "how", -1); if (i < 0 || !rows[i]) return [null, "Battle in progress", "Mark how the game ended below."]; return [rows[i][1], rows[i][2], rows[i][0] + "."]; };
  const endTool = rows => ({ k: "ending", id: "how", l: "How did it end?", rows });
  /* the solar collector (BotV I p. 43): the same profile as in Warp Rift 15's older version */
  const COLLECTOR = "<h3>Solar collector (Book of the Void I p. 43)</h3><table class='ltab'><tr><td>Type</td><td>Defence / 1 hit · speed 0 · armour 4+ · no shields or turrets</td></tr>" +
    "<tr><td>Volatile cargo</td><td>When destroyed it explodes on a 3+: blast 3D6 cm, a number of lance hits equal to twice the turns it spent charging. These ignore shields, shadowfields and holofields.</td></tr></table>";
  const BLAST = { k: "info", html: st => "<h3>If a collector is destroyed now</h3><p class='calc'>Roll a D6: on 3+ it explodes, 3D6 cm, <b>" + (2 * st.turn) + " lance hits</b> to every ship in the blast (turn " + st.turn + " × 2, our reading of “turns spent charging”). Shields, shadowfields and holofields do not help.</p>" };
  /* the mountains of Avaheim (BotV II p. 53): the picture's shapes; the picture is not to scale (1066 × 551 px) */
  const AVA = [
    [[0, 0], [590, 0], [500, 60], [462, 170], [440, 262], [330, 142], [232, 156], [150, 88], [0, 112]],
    [[600, 0], [1066, 0], [1066, 185], [860, 168], [830, 75]],
    [[0, 392], [270, 505], [470, 460], [555, 551], [0, 551]],
    [[565, 551], [1066, 551], [1066, 338], [862, 345], [850, 465], [770, 505]],
    [[538, 236], [628, 130], [705, 215], [665, 262]],
    [[270, 337], [318, 358], [320, 440], [253, 404]],
    [[650, 345], [745, 393], [705, 418], [628, 436]]
  ];
  const AVA_DRONES = [[543, 108], [730, 255], [370, 410], [732, 462]];

  addScenarios([
  /* ============================================================ BOTV I · 1 FIRST CONTACT */
  {
    id: "fan-v-first-contact", grp: "fan-botv", name: "First Contact", series: "Book of the Void I · Historical scenario one", trust: "fan",
    why: "A Sororitas strike cruiser and a Diasporex combat cruiser meet in the Lokannun system, each with its escorts, and neither trusts the other.", src: P1(51), book: "E", suggest: ["Imperial Navy", "Diasporex (fan)"],
    others: OTHERS_V1 + " Here: a strike cruiser and five frigates against a cruiser and six escorts.",
    sides: { a: { n: "Adepta Sororitas", f: "Adepta Sororitas (fan list)" }, b: { n: "Diasporex", f: "Diasporex (fan list)" } },
    pitch: "On its way to purge a heretic world, the Flame of the Saint picks up the forgotten sensor pattern of a Diasporex cruiser. Two small flotillas, two agendas, one lethal engagement.",
    glance: [["Points", "Fixed forces"], ["Table", "Not given — use your table"], ["Battlezone", "Primary biosphere: a medium planet and a moon"], ["First turn", "Roll-off, winner chooses"], ["Game ends", "After 8 turns, or a fleet disengages"]],
    bring: ["A medium planet and a small moon", "Celestial phenomena"],
    forces: {
      a: ["Canoness Alicosha, Ld 8, aboard the Flame of the Saint, a Priory class strike cruiser.", "Balmung squadron: five Sword class frigates under Commander Zolic, Ld 8."],
      b: ["Fleet Master Grahamitch, Ld 8, aboard the Ajax, a Callisto class combat cruiser with the Archaeotech upgrade.", "Faraday: five Terran escorts, Ld 7.", "Galea: a Mercury class escort, Ld 9."]
    },
    draw: (v, W, H) => [{ z: "ring", cx: W / 2, cy: H / 2, r: 60, s: "n" }, { z: "planet", cx: W / 2, cy: H / 2, r: 7, l: "medium planet" },
      { z: "planet", cx: W / 2 - 25, cy: H / 2, r: 2.5, l: "", free: "x" }, { z: "text", x: W / 2 - 25, y: H / 2 - 9, l: "moon", s: "n" },
      { z: "text", x: W / 2, y: Math.max(8, H / 2 - 54), l: "60 cm", s: "n" },
      { z: "mark", x: 8, y: 8, s: "a", l: "", free: 1 }, { z: "text", x: 40, y: 24, l: "Sororitas:\na corner", s: "a" },
      { z: "mark", x: W - 8, y: H - 8, s: "b", l: "", free: 1 }, { z: "text", x: W - 42, y: H - 26, l: "Diasporex:\nanother corner", s: "b" }],
    fit: () => [150, 100],
    mapNote: "The medium planet sits in the centre with a small moon 25 cm toward one short edge. Each fleet sets up in a corner, no closer than 60 cm to the planet (the dashed circle).",
    steps: [
      { t: "Battlezone: primary biosphere. Place a medium planet in the centre, and a small moon 25 cm from it toward one of the short edges. Set up other phenomena in any agreed way." },
      { t: "Roll off for corners: {a:corner}." },
      { s: "a", t: "Deploy in your corner, no closer than 60 cm to the planet." },
      { s: "b", t: "Deploy in your corner, no closer than 60 cm to the planet." },
      { t: "Both roll a D6; the higher roll chooses to go first or second (re-roll ties)." }
    ],
    notes: ["“The fleets are deployed in either one of the corners” — the source does not say which corners or who places first; the default is ours.", "“25 cm away from the planet” is read as edge to edge, as distances in Battlefleet Gothic are measured (RB p. 22)."],
    refs: [["Victory points", "RB p. 122"], ["Planets and moons", "RB p. 112–113"], ["Sword class frigate", "FL p. 82"]],
    play: [{ w: "Turn 8", t: "Last turn." }],
    turnMax: () => 8,
    fx: T => T === 8 ? [[null, "Last turn"]] : [],
    tools: [],
    rtools: vpTools("Adepta Sororitas", "Diasporex"),
    end: ["After eight turns, or when one fleet disengages."],
    win: ["Both fleets score victory points as normal (RB p. 122). The higher total wins."],
    result(st) { return vpr(st, "Adepta Sororitas", "Diasporex"); },
    info: { bg: "The Sororitas were bound for Lokannun to purge its only inhabited world when the Flame of the Saint found the Diasporex — remnants of a colony fleet that left Terra in the Dark Age of Technology and have hidden from the Imperium ever since.", cr: [V1 + " " + P1(51) + "."] }
  },
  /* ============================================================ BOTV I · 2 SMASH'COLLECTA */
  {
    id: "fan-v-smash", grp: "fan-botv", name: "Smash’Collecta", series: "Book of the Void I · Historical scenario two", trust: "fan",
    why: "Da Red Gobbo’s Grots go full speed for a Diasporex solar collector farm; a command carrier stands in the way and may not run.", src: P1(52), book: "E", suggest: ["Orks", "Diasporex (fan)"],
    others: OTHERS_V1 + " The collector profile is given below, so any defender can guard them.",
    sides: { a: { n: "Grot Rev’looshun", f: "Grot Rev’looshun (fan list)" }, b: { n: "Diasporex", f: "Diasporex (fan list)" } },
    pitch: "A Grot krooza has already blown itself up on one collector. Now Da Red Gobbo wants the rest — and the Hyppolyta puts itself between the green wave and the farm.",
    glance: [["Points", "Fixed forces"], ["Table", "Not given — use your table"], ["Battlezone", "Outer reaches"], ["First turn", "Grots"], ["Game ends", "8 turns, all collectors gone, or a fleet destroyed"]],
    bring: ["Three solar collector markers", "Celestial phenomena"],
    forces: {
      a: ["Da Red Gobbo (+2 Ld) aboard the Hack’r, a Terror krooza.", "Krunch Fasta: a Grot krooza, Ld 6.", "Ham’Stap: six Savage gunships with Soopa Boostas, Ld 6.", "Grapperers: three Onslaught attack ships, Ld 6."],
      b: ["Hyppolyta: a Neptune class command carrier, Ld 8.", "Pilus: six Terran escorts, Ld 9.", "Three solar collectors (tools)."]
    },
    draw: (v, W, H) => [R(0, 0, 20, H, "b", ""), R(0, 0, 10, H, "b", "", { dash: 1 }), { z: "text", x: 15, y: H / 2, l: "Diasporex: 20 cm", s: "b", rot: -90 },
      { z: "text", x: 22 + textLen("3 solar collectors: within 10 cm", W) / 2, y: 14, l: "3 solar collectors: within 10 cm", s: "b" },
      R(W - 20, 0, 20, H, "a", "Grots: 20 cm", { rot: 90 })],
    fit: () => [90, 60],
    mapNote: "From the supplement’s map: the Diasporex zone is 20 cm along one short edge with the collectors in its first 10 cm, the Grots 20 cm along the other. Where the collectors stand in that strip is up to the Diasporex player.",
    steps: [
      { t: "Battlezone: outer reaches. Set up phenomena in any agreed way." },
      { s: "b", t: "Deploy the whole fleet first, within 20 cm of your short edge. Add the three solar collectors within 10 cm of that edge." },
      { s: "a", t: "Deploy within 20 cm of the opposite short edge." },
      { s: "a", t: "The Grots, as the attackers, take the first turn." }
    ],
    notes: ["The text only says the collectors go in the deployment zone “as shown”; the map puts them in a 10 cm strip at the edge and the Grots in a 20 cm zone opposite.", "The collector explosion counts “turns spent charging”, which these scenarios never define. We count the turns played (tool in Play); agree otherwise if you like."],
    refs: [["Terror ship", "FL p. 380"], ["Savage gunship", "FL p. 385"], ["Onslaught attack ship", "FL p. 384"], ["Victory points", "RB p. 122"]],
    play: [
      { w: "All game", s: "b", t: "You may not disengage: the solar fields matter too much." },
      { w: "Collectors", t: "Each one destroyed is worth 50 VP to the Grots; each one standing at the end is worth 25 VP to the Diasporex." },
      { w: "Turn 8", t: "Last turn." }
    ],
    turnMax: () => 8,
    fx: T => T === 8 ? [[null, "Last turn"]] : [],
    tools: [{ k: "html", html: COLLECTOR }, BLAST, { k: "counter", id: "dead", s: "a", l: "Solar collectors destroyed (50 VP each)", max: 3, res: 1 }],
    rtools: vpTools("Grot Rev’looshun", "Diasporex"),
    end: ["After eight turns, or when every solar collector is destroyed, or when one fleet has been destroyed."],
    win: ["Victory points as normal (RB p. 122), plus 50 to the Grots for each solar collector destroyed and 25 to the Diasporex for each one still standing. The higher total wins."],
    result(st) { return vpr(st, "Grot Rev’looshun", "Diasporex"); },
    info: { bg: "The first clash between Da Red Gobbo’s band and the Diasporex: the Grot krooza Biggun Shanka exploded into a solar collector, and the Hyppolyta moved to cover the rest of the farm.", cr: [V1 + " " + P1(52) + "."] }
  },
  /* ============================================================ BOTV I · 3 THE ROYAL FLEET OF ERES */
  {
    id: "fan-v-eres", grp: "fan-botv", name: "The Royal Fleet of Eres", series: "Book of the Void I · Historical scenario three", trust: "fan",
    why: "Two big fleets arrive division by division around a graveyard of ancient warships, and every hulk is worth capturing.", src: P1(53) + "–54", book: "E", suggest: ["Imperial Navy", "Orks"],
    others: OTHERS_V1 + " The set-up is Escalating Engagement’s (RB p. 138–139), so any two fleets split into five divisions can play it.",
    sides: { a: { n: "Adepta Sororitas", f: "Adepta Sororitas (fan list)" }, b: { n: "Grot Rev’looshun", f: "Grot Rev’looshun (fan list)" } },
    pitch: "The Inquisitor has led the Sororitas to the lost Royal Fleet of Eres — and Da Red Gobbo has found it too. A graveyard of majestic ancient vessels becomes a battlefield.",
    glance: [["Points", "Fixed forces, five divisions each"], ["Table", "Not given — use your table"], ["Battlezone", "Any, rolled as per the rulebook"], ["First turn", "Roll-off after deployment"], ["Game ends", "A fleet disengages or is destroyed"]],
    bring: ["5 contact markers per player", "Seven hulks for the Royal fleet: a Victory, an Armageddon, an Overlord, two Lunars, two Dauntless"],
    forces: {
      a: ["Gerome the Pious, Solar Admiral of the Frateris Templar, Ld 10, aboard the Holy Light.",
        "[1] Holy Light, Oberon class battleship. Xisor Phantine XX: six Sword frigates, Ld 8.",
        "[2] Blood of the Holy, Chalice class battlecruiser, Ld 10. Rays of Nerroth: six Firestorm frigates, Ld 7.",
        "[3] Punctuality and Flame, Chapel class strike cruisers, Ld 10 and 7.",
        "[4] Torch of the Emperor and Saviour of Light, Priory class strike cruisers with extra shields, Ld 9 and 8.",
        "[5] Chariot of Olivia, Chalice class battlecruiser, Ld 7."],
      b: ["Da Red Gobbo (+2 Ld) aboard the Hack’r; Gruglok Krunkmek (+1 Ld) aboard the Krunch; two Grot Honchos with a re-roll each aboard the Mork’z’em and the Gork’z’em.",
        "[1] Hack’r, Terror krooza, Ld 7. Braawza: six Ravager attack ships, Ld 6.",
        "[2] Mash’em, Hammer class battlekrooza with Mad Meks, Ld 7. Grapperers: nine Onslaught attack ships, Ld 7.",
        "[3] Krunch Fasta and Squish’ed Lootaz: two squadrons of three Grot kroozas, Ld 6. Mork’z’em, Freeboota Basha krooza with Mega-Armoured Boarding Parties, Ld 7.",
        "[4] Gork’z’em, Freeboota Basha krooza, Ld 6.",
        "[5] Ham’Stap: nine Savage gunships with Soopa Boostas, Ld 7."]
    },
    draw: (v, W, H) => {
      const cx = W / 2, cy = H / 2, ring = [0, 1, 2, 3, 4, 5].map(k => [cx + 8 * Math.cos(-Math.PI / 2 + k * Math.PI / 3), cy + 6 * Math.sin(-Math.PI / 2 + k * Math.PI / 3)]);
      return [R(30, 30, W - 60, H - 60, "n", ""), { z: "text", x: W / 2, y: 39, l: "Contact markers: anywhere in here,\n60 cm+ from the enemy marker", s: "n" },
        { z: "cm", x: cx, y: cy, s: "c", l: "" }, ...ring.map(p => ({ z: "mark", x: p[0], y: p[1], s: "c", free: 1 })), { z: "text", x: cx, y: cy + 21, l: "Royal fleet of Eres", s: "c" },
        { z: "edge", e: "l", s: "n", l: "1" }, { z: "edge", e: "t", s: "n", l: "2–3" }, { z: "edge", e: "b", s: "n", l: "4–5" }, { z: "edge", e: "r", s: "n", l: "6" }];
    },
    fit: () => [150, 100],
    mapNote: "The Victory class battleship sits in the centre of the table, the other six hulks fanning out clockwise from it, each within 5 cm of the next. Edge numbers are for the D6 that places each new contact marker.",
    steps: [
      { t: "Battlezone: any, generated as per the rulebook." },
      { t: "Place the Royal fleet of Eres in the centre: the Victory class battleship first, then an Armageddon and an Overlord battlecruiser, two Lunar cruisers and two Dauntless light cruisers, each within 5 cm of the next, fanning out clockwise." },
      { t: "Each player draws one of their five contact markers at random (keep it hidden): that is the starting division. The divisions are the numbers in Forces." },
      { t: "Roll off: the higher roll chooses to place their marker first or second. Markers go at least 30 cm from every edge and 60 cm from the enemy marker." },
      { t: "Reveal the markers. Starting with whoever placed last, deploy each starting division within 10 cm of its marker." },
      { t: "Both roll a D6. The higher roll chooses to go first or second." }
    ],
    stools: [],
    notes: ["The bracketed numbers in the supplement’s fleet lists assign each ship to a division (contact marker).", "“25 points to the player who has ships left on the battlefield” for each uncaptured hulk: if both players still have ships there, the source does not say — agree it (Agree before you start)."],
    refs: [["Escalating Engagement (the same set-up)", "RB p. 138–139"], ["Victory class battleship", "FL p. 55"], ["Armageddon class battlecruiser", "FL p. 65"], ["Overlord class battlecruiser", "FL p. 66"], ["Lunar class cruiser", "FL p. 71"], ["Dauntless class light cruiser", "FL p. 77"], ["Oberon class battleship", "FL p. 56"], ["Hammer class battlekroozer", "FL p. 374"]],
    play: [
      { w: "End phase of your turn", t: "Draw another of your markers at random and place it on a random table edge (tool below): not within 60 cm of enemy ships, and if you have ships within 30 cm of that edge, within 30 cm of one of them." },
      { w: "Start of your turn", t: "Roll a D6 for each of your markers on an edge. The slowest ship in the division decides: up to 20 cm needs 5+, 21–29 cm 4+, 30 cm or more 3+; +2 if friendly ships are within 30 cm of the marker." },
      { w: "Arrival", t: "Success: every ship of the division moves on from the marker’s edge within 10 cm of the marker; remove the marker. Failure: you may slide the marker along its edge up to the slowest ship’s speed." },
      { w: "Capturing a hulk", t: "Move one of your capital ships into base contact with an uncaptured hulk of the Royal fleet. If it stays in contact and survives one full round, the hulk is yours: battleship 200 VP, battlecruiser 150, cruiser 100, light cruiser 50." }
    ],
    tools: [
      { k: "roll", id: "edge", l: "Random table edge", sub: "D6, for the marker drawn in your end phase", rows: EDGE_ROWS },
      ARRIVAL("arr2", "Arrival rolls — markers on an edge", { cl: "Markers on an edge", il: i => "Marker " + (i + 1),
        sub: "D6 per marker; the slowest ship in its division decides: up to 20 cm needs 5+, 21–29 cm 4+, 30 cm or more 3+. +2 if friendly ships are within 30 cm of the marker.",
        out: d => ARRIVE_TXT(d) + (d < 5 ? "; with +2 (friendly ships within 30 cm): " + ARRIVE_TXT(d + 2) : "") }),
      { k: "counter", id: "offa", l: "Adepta Sororitas: divisions still to arrive", s: "a", start: 4, max: 4 },
      { k: "counter", id: "offb", l: "Grot Rev’looshun: divisions still to arrive", s: "b", start: 4, max: 4 }
    ],
    fx: (T, st) => { const o = [], txt = T === 1 ? "End phase: place your first marker on a random edge (no arrival rolls yet)" : "Arrival rolls at the start, a new marker in the end phase";
      if (get(st, "offa", 4) > 0) o.push(["a", txt]); if (get(st, "offb", 4) > 0) o.push(["b", txt]); return o; },
    rtools: vpTools("Adepta Sororitas", "Grot Rev’looshun"),
    end: ["One fleet disengages or is destroyed."],
    win: ["Victory points as normal (RB p. 122), plus each captured hulk: battleship 200, battlecruiser 150, cruiser 100, light cruiser 50.", "Each hulk still uncaptured at the end gives 25 VP to the player who has ships left on the battlefield.", "The higher total wins."],
    result(st) { return vpr(st, "Adepta Sororitas", "Grot Rev’looshun"); },
    info: { bg: "The loss of the Damnation’s Fear bought the Inquisitor the location of the Royal fleet of Eres, an ancient fleet of majestic warships. Gerome the Pious and the Sororitas arrived to claim it — and found Da Red Gobbo’s Grots already there.", cr: [V1 + " " + P1(53) + "–54."] }
  },
  /* ============================================================ BOTV I · 4 CLASH OF THE ANCIENTS */
  {
    id: "fan-v-ancients", grp: "fan-botv", name: "Clash of the Ancients", series: "Book of the Void I · Historical scenario four", trust: "fan",
    why: "The Sororitas, now with ships of the Royal fleet, close on the Diasporex battlefleet from three sides.", src: P1(55) + "–56", book: "E", suggest: ["Imperial Navy", "Diasporex (fan)"],
    others: OTHERS_V1 + " The Imperial side here mixes Sororitas, Navy and Mechanicus ships; any big fleet split into three groups works.",
    sides: { a: { n: "Adepta Sororitas", f: "Adepta Sororitas (fan list)" }, b: { n: "Diasporex", f: "Diasporex (fan list)" } },
    pitch: "Bolstered by vessels of the Royal fleet, the Adepta Sororitas set course for the main Diasporex fleet. The nomads’ high command musters everything to cover the rest of their operation.",
    glance: [["Points", "Fixed forces (large)"], ["Table", "180 × 120 cm (the map)"], ["Battlezone", "Outer reaches, rolled as per the rulebook"], ["First turn", "Roll-off, winner chooses"], ["Game ends", "A fleet disengages or is destroyed"]],
    bring: ["Celestial phenomena"],
    forces: {
      a: ["Canoness Immacoris, Ld 9 with a re-roll, aboard the Carmina Indomitas; the Living Saint (+2 Ld) aboard the Saviour of the Light; Archmagos Calculus, Ld 9, aboard Omnissiah’s Wrath.",
        "Division 1: Punctuality, Chapel class strike cruiser with an extra shield, Ld 10; Nova Eterna, Chapel class, Ld 8; Peregrine, five Cobra destroyers with the Widowmaker refit, Ld 10.",
        "Division 2: Carmina Indomitas, modified Retribution class battleship; Omnissiah’s Wrath, Mechanicus Gothic class cruiser with a nova cannon; Saviour of the Light, Priory class strike cruiser with an extra shield, Ld 8; Pride of Eres, Lunar class cruiser, Ld 7.",
        "Division 3: Immortal, Victory class battleship, Ld 7; Eres’ Fury, Armageddon class battlecruiser, Ld 7; Balmung, six Sword frigates, Ld 8."],
      b: ["High Senator Davo (+2 Ld) aboard the Illiad; Fleet Master Digines Akrites (+1 Ld, an extra re-roll) aboard the Odyssey.",
        "Illiad, Saturn class fleet carrier with the Xenotech upgrade, Ld 9. Odyssey, Jupiter class command battleship with the Archaeotech upgrade, Ld 8.",
        "Lotus, Io class superiority cruiser with Archaeotech, Ld 7. Basilisk, Callisto class combat cruiser, Ld 6. Pollux (Xenotech) and Castor, Ganymede class artillery cruisers, Ld 6 and 7.",
        "Serpentine and Python, Enceladus class support cruisers, Ld 8 and 7. Scipio, Metis class support cruiser, Ld 7. Kr’gg’hshh, Ceti Bulwark class cruiser, Ld 9.",
        "Faraday: five Terran escorts, Ld 8. Galea: a Mercury class escort, Ld 9."]
    },
    draw: (v, W, H) => [R(0, 0, 30, H, "a", "Division 1: 30 cm", { rot: -90 }), R(W - 30, 0, 30, H, "a", "Division 3: 30 cm", { rot: 90 }), R(30, H - 30, W - 60, 30, "a", "Division 2: 30 cm"),
      R(W / 2 - 30, 0, 60, 30, "b", "Diasporex: 60 × 30 cm"),
      { z: "arrow", x1: W / 2, y1: 22, x2: W / 2, y2: 38, s: "b" }, { z: "arrow", x1: W / 2, y1: H - 22, x2: W / 2, y2: H - 38, s: "a" },
      { z: "arrow", x1: 12, y1: H - 14, x2: 26, y2: H - 28, s: "a" }, { z: "arrow", x1: W - 12, y1: H - 14, x2: W - 26, y2: H - 28, s: "a" }],
    fit: () => [150, 120], srcTable: [180, 120],
    mapNote: "From the supplement’s map (not drawn to scale; its measurements are used): the Diasporex zone is 60 cm wide in the middle of one long edge, 30 cm from each side zone; Division 2 has the 30 cm strip along the opposite edge, 60 cm from the Diasporex; Divisions 1 and 3 the 30 cm strips along the short edges. The arrows give the facing.",
    steps: [
      { t: "Battlezone: outer reaches, generated as per the rulebook." },
      { s: "b", t: "Deploy in your zone, facing the opposite long edge." },
      { s: "a", t: "Deploy each division in its zone (Forces), facing as the arrows show: Division 2 straight ahead, Divisions 1 and 3 angled toward the centre." },
      { t: "Both roll a D6. The higher roll chooses to go first or second." }
    ],
    notes: ["The map gives no depth for the Diasporex zone; with 30 cm, 60 cm and 30 cm it fills the 120 cm table width, so we use 30 cm.", "The source does not say who deploys first; the default (Agree before you start) is the Diasporex, as defenders."],
    refs: [["Retribution class battleship", "FL p. 54"], ["Victory class battleship", "FL p. 55"], ["Armageddon class battlecruiser", "FL p. 65"], ["Lunar class cruiser", "FL p. 71"], ["Cobra class destroyer (Widowmakers)", "FL p. 84"], ["Victory points", "RB p. 122"]],
    play: [],
    tools: [],
    rtools: vpTools("Adepta Sororitas", "Diasporex"),
    end: ["One fleet disengages or is destroyed."],
    win: ["Both fleets score victory points as normal (RB p. 122). The higher total wins."],
    result(st) { return vpr(st, "Adepta Sororitas", "Diasporex"); },
    info: { bg: "With ships of the Royal fleet of Eres now under the Sororitas banner, Canoness Immacoris went after the largest part of the Diasporex fleet, while the nomads’ high command tried to save as much of their operation as they could.", cr: [V1 + " " + P1(55) + "–56."] }
  },
  /* ============================================================ BOTV I · BONUS 1 SOLAR COLLECTORS */
  {
    id: "fan-v-solar", grp: "fan-botv", name: "Solar Collectors", series: "Book of the Void I · Bonus scenario one", trust: "fan",
    why: "Raid or battle on a Diasporex collector farm in the flare region: every collector is worth twice as much alive as dead.", src: P1(57), book: "O", suggest: ["Diasporex (fan)"],
    others: "Written for the Diasporex as defenders against the Sororitas or the Grots, but the collector profile is given below, so any defending fleet can guard a farm. An older version of this mission, with charging and pick-up, is Warp Rift 15’s The Solar Collectors.",
    sides: { a: { n: "Attacker", f: "Any fleet" }, b: { n: "Diasporex", f: "Diasporex (or any defender)" } },
    variants: [["raid", "Raid (500–1000 pts)"], ["battle", "Battle (1000–2000 pts)"]],
    pitch: "The Diasporex farms are their Achilles heel: lose them and the fleet cannot refuel. This time the enemy has found one.",
    glance: v => [["Points", v === "raid" ? "500–1000 each, agreed" : "1000–2000 each, agreed"], ["Table", "Not given — use your table"], ["Battlezone", "Flare region, sunward short edge"], ["First turn", "Roll-off, winner chooses"], ["Game ends", "After 8 turns, a fleet gone, or every collector destroyed"]],
    bring: v => [(v === "raid" ? "D6+2" : "D6+4") + " solar collector markers", "Celestial phenomena"],
    forces: v => ({ a: ["Any fleet up to the agreed points (" + (v === "raid" ? "500–1000" : "1000–2000") + ")."], b: ["Any fleet up to the agreed points.", "Plus " + (v === "raid" ? "D6+2" : "D6+4") + " solar collectors (tools)."] }),
    draw: (v, W, H) => [{ z: "sun", e: "l" }, R(0, 0, 20, H, "b", ""), R(0, 0, 10, H, "b", "", { dash: 1 }), { z: "text", x: 15, y: H / 2, l: "Diasporex: 20 cm", s: "b", rot: -90 },
      { z: "text", x: 22 + textLen("collectors: within 10 cm, placed last", W) / 2, y: 14, l: "collectors: within 10 cm, placed last", s: "b" },
      { z: "text", x: W - 30, y: H / 2, l: "Attacker:\nsee Agree", s: "a" }],
    fit: () => [80, 50],
    mapNote: "One short edge is sunward: the Diasporex set up within 20 cm of it, and their collectors go within 10 cm of it after everything else is deployed.",
    steps: [
      { t: "Agree the points: a raid of 500–1000 or a battle of 1000–2000 each." },
      { t: "Battlezone: the flare region. Set up phenomena in any agreed way, or with the rulebook generator. Choose one short edge to be sunward." },
      { s: "b", t: "Deploy every ship within 20 cm of the sunward edge." },
      { s: "b", t: "Roll for the number of collectors (Set-up tools)." },
      { s: "a", t: "Deploy: {a:atk}." },
      { s: "b", t: "Place the collectors last, within 10 cm of your edge." },
      { t: "Both roll a D6; the higher roll chooses to go first or second (re-roll ties)." }
    ],
    stools: [
      { k: "roll", id: "ncol", only: ["raid"], l: "Solar collectors (raid)", sub: "D6+2", rows: () => [1, 2, 3, 4, 5, 6].map(n => [n, n, (n + 2) + " collectors"]) },
      { k: "roll", id: "ncolb", only: ["battle"], l: "Solar collectors (battle)", sub: "D6+4", rows: () => [1, 2, 3, 4, 5, 6].map(n => [n, n, (n + 4) + " collectors"]) }],
    notes: ["The source does not say where the attacker sets up; the default (Agree before you start) follows the Warp Rift 15 version.", "The collector explosion counts “turns spent charging”, which this scenario never defines. We count the turns played (tool in Play); agree otherwise if you like."],
    refs: [["Flare region", "RB p. 107"], ["Victory points", "RB p. 122"], ["Miserable defeat", "RB p. 124"]],
    play: [
      { w: "Collectors", t: "Each collector destroyed is worth 100 VP to the attacker; each still standing at the end is worth 200 VP to the Diasporex." },
      { w: "All collectors gone", s: "b", t: "If every collector is destroyed, you suffer a Miserable Defeat at once and the game ends." },
      { w: "Turn 8", t: "Last turn." }
    ],
    turnMax: () => 8,
    fx: T => T === 8 ? [[null, "Last turn"]] : [],
    tools: [{ k: "html", html: COLLECTOR }, BLAST, { k: "counter", id: "dead", s: "a", l: "Solar collectors destroyed (100 VP each)", res: 1 }],
    rtools: [endTool([["Every collector was destroyed", "a", "Miserable defeat"], ["Played to the end: count VP below", "draw", "Count VP"]]), ...vpTools("Attacker", "Diasporex")],
    end: ["After eight turns, or when one fleet disengages or is destroyed.", "At once if every solar collector is destroyed."],
    win: ["Victory points as normal (RB p. 122), plus 100 to the attacker for each collector destroyed and 200 to the Diasporex for each one still standing. The higher total wins.", "If every collector is destroyed, the Diasporex suffer a Miserable Defeat."],
    result(st) { if (get(st, "how", -1) === 0) return ["a", "Attacker wins", "Every collector destroyed: Miserable Defeat for the Diasporex."]; return vpr(st, "Attacker", "Diasporex"); },
    info: { bg: "During the Diasporex wars in Discordia the collector fields were fought over again and again, as the Adepta Sororitas tried to destroy them and the Grots tried to loot them.", cr: [V1 + " " + P1(57) + ".", "The collector profile: " + P1(43) + ". The original Solar Collectors mission by Mitch is in Warp Rift 15."] }
  },
  /* ============================================================ BOTV I · BONUS 2 KRUMP DA BIGG'UNS */
  {
    id: "fan-v-krump", grp: "fan-botv", name: "Krump da Bigg’uns", series: "Book of the Void I · Bonus scenario two", trust: "fan",
    why: "A Grot raid on a sleeping fleet that wants enemy ships crippled, not dead — crippled ships pay double.", src: P1(58), book: "O", suggest: ["Orks"],
    others: "Written for Da Grot Rev’looshun against the Diasporex or the Sororitas. Any raiding fleet works; the victory bonus is the scenario’s.",
    sides: { a: { n: "Grots", f: "Grot Rev’looshun (or any raider)" }, b: { n: "Defender", f: "Diasporex or Adepta Sororitas" } },
    pitch: "The Grots do not want to sink anything big — they want it crippled and towed home. Strike before the defenders are fully awake.",
    glance: [["Points", "Grots up to 1000 · defender up to 1500"], ["Table", "Not given — use your table"], ["Battlezone", "Any, agreed or rolled"], ["First turn", "Grots"], ["Game ends", "After 8 turns, or a fleet disengages or is destroyed"]],
    bring: ["A D6 for the alert penalty", "Contact markers 1–5 (campaign only)"],
    forces: { a: ["Up to 1000 pts."], b: ["Up to 1500 pts."] },
    draw: (v, W, H) => [R(30, 30, W - 60, H - 60, "b", "Defender\n30 cm+ from every edge\n20 cm apart, same facing"), ...EDGES4("a", "Grots enter from one edge"),
      { z: "dim", x1: 0, y1: H - 20, x2: 30, y2: H - 20, l: "30 cm" }],
    fit: () => [90, 70],
    mapNote: "As The Raiders (RB p. 131): the defender sets up at least 30 cm from every edge; the Grots come on from any one edge in their first turn.",
    steps: [
      { t: "Battlezone: any. Set up phenomena in any agreed way, or with the rulebook generator." },
      { s: "b", t: "Deploy the whole fleet first: every ship facing the same table edge, at least 30 cm from any edge, each ship or squadron at least 20 cm from the others." },
      { s: "b", t: "Roll a D6 for the alert penalty (tool in Play)." },
      { s: "a", t: "No deployment: you move on from any one edge in your first turn, which you take." }
    ],
    notes: ["“For the first D6 turns” does not say when to roll; rolling before the first turn is the natural reading, as in The Raiders."],
    refs: [["The Raiders (the same set-up)", "RB p. 131"], ["Victory points, crippled ships", "RB p. 122"]],
    play: [
      { w: "First D6 turns", s: "b", t: "All your ships suffer −2 Leadership: your crews are not on full alert." },
      { w: "Victory points", s: "a", t: "An enemy ship crippled at the end scores you 50% of its value instead of 25%. A crippled ship that disengages still gives you 25%: the Mad Meks fitted a tracker." },
      { w: "In a campaign", s: "a", t: "Put a contact marker (1–5) on each enemy ship as it is crippled. After the battle roll a D6: a matching number joins your roster from the owner’s. On a 6 you pick one." },
      { w: "Turn 8", t: "Last turn." }
    ],
    turnMax: () => 8,
    fx: (T, st) => { const n = get(st, "alert", 0), o = []; if (!n && T === 1) o.push(["b", "Roll the alert penalty (D6) — tool below"]); if (n && T <= n) o.push(["b", "At −2 Leadership (not on full alert, turns 1–" + n + ")"]); if (T === 1) o.push(["a", "Move on from one table edge"]); if (T === 8) o.push([null, "Last turn"]); return o; },
    tools: [
      { k: "roll", id: "alert", l: "Defender alert penalty", sub: "D6 = number of turns at −2 Ld", rows: () => [1, 2, 3, 4, 5, 6].map(n => [n, n, n === 1 ? "Turn 1" : "Turns 1–" + n]) },
      { k: "info", html: st => { const n = get(st, "alert", 0); return "<h3>Defender Leadership now</h3><p class='calc'>" + (!n ? "Roll the alert penalty above." : st.turn <= n ? "Turn " + st.turn + ": defending ships are at <b>−2 Leadership</b> (until the end of turn " + n + ")." : "Turn " + st.turn + ": the alert penalty is over.") + "</p>"; } }
    ],
    rtools: vpTools("Grots", "Defender"),
    end: ["After eight turns, or when one fleet disengages or is destroyed."],
    win: ["Victory points as normal (RB p. 122), except that the Grots score 50% for every enemy ship crippled at the end, and 25% for a crippled ship that disengaged. The higher total wins."],
    result(st) { return vpr(st, "Grots", "Defender"); },
    info: { bg: "The Grot Rev’looshun roaming Discordia were a real problem for the Diasporex and the Sororitas alike: their raids aimed to cripple ships rather than destroy them, so that as much loot as possible could be dragged home.", cr: [V1 + " " + P1(58) + "."] }
  },
  /* ============================================================ BOTV I · BONUS 3 SEIZE THE RELIC */
  {
    id: "fan-v-relic", grp: "fan-botv", name: "Seize the Relic", series: "Book of the Void I · Bonus scenario three", trust: "fan",
    why: "Two treasure-hunting fleets race for an ancient vessel in deep space: board it, hold it two turns, and tow it home.", src: P1(59), book: "O", suggest: null,
    others: "Written for any two fleets. The relic can be any big model: an Oberon, a Gloriana, or a Ramilies star fort embedded in a space hulk.",
    sides: { a: { n: "Player A" }, b: { n: "Player B" } },
    pitch: "With the warp storms gone from Discordia, treasure seekers hunt for the lost vessels of Battlefleet Discordia. This one has been found by two rivals at once.",
    glance: [["Points", "1500–2000 each, agreed"], ["Table", "Not given — use your table"], ["Battlezone", "Deep space"], ["First turn", "D6 + fleet attack rating"], ["Game ends", "A fleet gone, or the relic taken off an edge"]],
    bring: ["A relic model (an ancient battleship, or a star fort in a space hulk)"],
    forces: { a: ["Up to the agreed points (1500–2000)."], b: ["Up to the agreed points (1500–2000)."] },
    draw: (v, W, H) => [R(0, 0, 30, H, "a", "Player A: 30 cm", { rot: -90 }), R(W - 30, 0, 30, H, "b", "Player B: 30 cm", { rot: 90 }),
      { z: "mark", x: W / 2, y: H / 2, s: "c", l: "relic" }, { z: "arrow", x1: W / 2 - 8, y1: H / 2 + 10, x2: W / 2 - 26, y2: H / 2 + 10, s: "c", l: "" },
      { z: "text", x: W / 2, y: H / 2 + 20, l: "captured: 10 cm a turn\ntoward the captor’s edge", s: "c" }],
    fit: () => [100, 60],
    mapNote: "The relic sits in the centre; each fleet sets up within 30 cm of its own short edge.",
    steps: [
      { t: "Agree a points value between 1500 and 2000." },
      { t: "Battlezone: deep space. Set up phenomena in any agreed way, or with the rulebook generator." },
      { t: "Place the relic in the centre of the table." },
      { t: "Both players deploy within 30 cm of their own short edge: {a:dep}." },
      { t: "Roll a D6 each and add your fleet’s attack rating (RB p. 120): the higher total goes first." }
    ],
    notes: ["“Board the relic with at least a (combined) boarding value of 10” — the source does not say whether a boarding action is rolled. The default (Agree before you start) is ours: no roll, just the boarding value and two full turns in contact."],
    refs: [["Attack ratings", "RB p. 120"], ["Boarding actions", "RB p. 89–90"], ["Ramilies class star fort", "FL p. 500"], ["Activated Blackstone Fortress", "FL p. 284"]],
    play: [
      { w: "Capturing the relic", t: "Board it with a combined boarding value of at least 10 and stay in base contact for two full turns. The relic has 20 hits and a boarding value of 20." },
      { w: "Taking it home", t: "Once captured, the captor may move the relic 10 cm a turn toward their own table edge." },
      { w: "Destroying it", t: "From then on the other player tries to destroy it: armour 5+, 1 shield, no weapons." },
      { w: "Escape", t: "Taking the relic off your own table edge ends the game and scores 500 VP. Destroying it scores nothing extra." }
    ],
    tools: [{ k: "counter", id: "rhits", l: "Hits on the relic (20)", max: 20 },
      { k: "roll", id: "camp", l: "In a campaign: what the relic adds to the captor’s roster", sub: "D6", rows: () => [[1, 3, "An Imperial or Chaos battleship of up to 400 pts"], [4, 5, "An inactive Blackstone Fortress"], [6, 6, "A Ramilies star fort"]] }],
    rtools: [endTool([["Player A escaped with the relic", "a", "Relic taken (+500 VP)"], ["Player B escaped with the relic", "b", "Relic taken (+500 VP)"], ["A fleet disengaged or was destroyed", "draw", "Count victory points"]]), ...vpTools("Player A", "Player B")],
    end: ["One fleet disengages or is destroyed.", "Or a player escapes off their own table edge with the relic."],
    win: ["Victory points as normal (RB p. 122). Escaping with the relic adds 500 VP; destroying it adds nothing. The higher total wins."],
    result(st) { return vpr(st, "Player A", "Player B"); },
    info: { bg: "Relieved of its warp storms, the Discordia sector drew treasure seekers hunting the ancient vessels and relics of Battlefleet Discordia. Most were salvaged quietly — but sometimes two rival fleets found the same one.", cr: [V1 + " " + P1(59) + "."] }
  },
  /* ============================================================ BOTV II · 1 AVAHEIM */
  {
    id: "fan-v-avaheim", grp: "fan-botv", name: "Avaheim", series: "Book of the Void II · Devourer Unleashed, scenario one", trust: "fan",
    why: "Three Cobras skim the mountains of a dead world in low orbit, with four pairs of Tyranid drones closing in.", src: P2(53), book: "O", suggest: ["Imperial Navy", "Tyranids"],
    others: OTHERS_V2 + " Here: three Cobra destroyers (FL p. 84) against eight Tyranid escort drones (FL p. 437) with the same weapons.",
    sides: { a: { n: "Peregrine Squadron", f: "Battlefleet Discordia" }, b: { n: "Tyranids", f: "Hivefleet Devourer (fan list)" } },
    pitch: "Investigating the silence from Avaheim, Peregrine Squadron dived into low orbit to escape a Devourer Alpha. Now the drones are hunting them through the mountains.",
    glance: [["Points", "Fixed forces"], ["Table", "180 × 120 cm: the planet’s surface"], ["Battlezone", "Low orbit, impassable mountains"], ["First turn", "Peregrine Squadron"], ["Game ends", "A Cobra escapes, or one side is destroyed"]],
    bring: ["Templates or markers for the mountain regions", "Four drone squadron markers"],
    forces: { a: ["Peregrine Squadron: three Cobra class destroyers, Ld 9, 1 re-roll."], b: ["Avaheim Xenos One and Three: two Devourer “Beta” drones each, with feeder tentacles.", "Avaheim Xenos Two and Four: two Devourer “Beta” drones each, with pyro-acid batteries."] },
    draw: (v, W, H) => [...AVA.map(p => ({ z: "poly", pts: p.map(q => [q[0] * W / 1066, q[1] * H / 551]), s: "n", pat: 1, free: 1 })),
      { z: "text", x: W * .22, y: H * .1, l: "mountains (hatched)", s: "n" },
      ...AVA_DRONES.map(q => ({ z: "circ", cx: q[0] * W / 1066, cy: q[1] * H / 551, r: 6, s: "b", l: "", free: 1, nr: 1 })),
      R(0, H / 2 - 10, 10, 20, "a", "", { free: "y" }), { z: "text", x: 22 + textLen("Peregrine: 10 cm", W) / 2, y: H / 2 - 14, l: "Peregrine: 10 cm", s: "a" },
      { z: "edge", e: "r", s: "a", l: "escape: the opposite short edge" }],
    fit: () => [150, 100], srcTable: [180, 120],
    mapNote: "The mountain regions (hatched) are copied from the supplement’s picture, which is not to scale: lay them out to match, or agree templates. The four circles are where the drone squadrons set up, at least 30 cm apart. Peregrine Squadron starts at the middle of either short edge.",
    steps: [
      { t: "The whole table is the surface of Avaheim, seen in low orbit. Place the high mountain regions as on the map, or mark them with templates. No other phenomena." },
      { s: "a", t: "Place Peregrine Squadron at the middle of either short edge, no more than 10 cm onto the table." },
      { s: "b", t: "Place the four drone squadrons in the marked areas, at least 30 cm from each other." },
      { s: "a", t: "Peregrine Squadron takes the first turn." }
    ],
    notes: ["“The battle takes place in low orbit” with the whole table as the surface: we read that the low orbit firing rules apply (RB p. 116) but there is no planet edge, so nothing is pulled down.", "The source refers to the old Armada rulebook (p. 82) for instinctive behaviour; it is in the Fleets book now (FL p. 416).", "The book does not say what happens if all three Cobras are destroyed; the Tyranids have won by then (the Imperials win only by escaping)."],
    refs: [["Low orbit", "RB p. 116"], ["Instinctive Behaviour", "FL p. 416"], ["Cobra class destroyer", "FL p. 84"], ["Escort drone", "FL p. 437"]],
    play: [
      { w: "Mountains", t: "The mountain regions are impassable to both sides: the Cobras fly too low, and the drones will not cross them." },
      { w: "Start of your turn", s: "b", t: "No hive ship is in range: take one Leadership test, at an unmodifiable 6, to override Instinctive Behaviour. It is one test for all your squadrons." },
      { w: "Low orbit", t: "Firepower shifts one column right; lances need a 4+ to fire; no torpedoes; ships need not move before turning (RB p. 116)." },
      { w: "Escape", s: "a", t: "Get at least one Cobra off the opposite short edge to win." }
    ],
    tools: [{ k: "roll", id: "instinct", s: "b", d2: 1, l: "Override Instinctive Behaviour", sub: "2D6 against Ld 6 — one roll for all squadrons", rows: () => [[2, 6, "Passed: move the drones as you like"], [7, 12, "Failed: Instinctive Behaviour (FL p. 416)"]] }],
    rtools: [endTool([["A Cobra escaped off the opposite short edge", "a", "Imperial win"], ["No Cobra escaped", "b", "Tyranid win"]])],
    end: ["Peregrine Squadron escapes with at least one ship off the opposite short edge, or the drones are destroyed."],
    win: ["The Imperials win if Peregrine Squadron escapes; otherwise the Tyranids win.", "Campaign: an Imperial win leads to Vallar’s Gambit (2A), a Tyranid win to Vallar’s Eulogy (2B)."],
    result(st) { const r = ending(st, [["A Cobra escaped off the opposite short edge", "a", "Imperial win"], ["No Cobra escaped", "b", "Tyranid win"]]);
      return r[0] === "a" ? [r[0], r[1], r[2] + " Next in the campaign: Vallar’s Gambit."] : r[0] === "b" ? [r[0], r[1], r[2] + " Next in the campaign: Vallar’s Eulogy."] : r; },
    info: { bg: "Investigating the loss of contact with Avaheim, Peregrine Squadron came face to face with an approaching Devourer Alpha and escaped only by dropping into low orbit — the first warning of the Tyranid incursion into Discordia.", cr: [V2 + " " + P2(53) + ".", CAMP2] }
  },
  /* ============================================================ BOTV II · 2A VALLAR'S GAMBIT */
  {
    id: "fan-v-gambit", grp: "fan-botv", name: "Vallar’s Gambit", series: "Book of the Void II · Devourer Unleashed, scenario 2A", trust: "fan",
    why: "The Bait with a merchant as the bait and Tyranid cruisers in pursuit: Battlegroup Seiche lures the swarm out of position.", src: P2(54), book: "O", suggest: ["Imperial Navy", "Tyranids"],
    others: OTHERS_V2 + " The set-up is The Bait’s (RB p. 130).",
    sides: { a: { n: "Battlegroup Seiche", f: "Battlegroup Seiche (fan list)" }, b: { n: "Tyranids", f: "Hivefleet Devourer (fan list)" } },
    pitch: "Warned by Peregrine Squadron, the Seiche initiative sends a merchant flotilla out as bait to draw the xenos into position for the next blow.",
    glance: [["Points", "Seiche 1000 (bait 250–500) · Tyranids 500"], ["Table", "Not given — use your table"], ["Battlezone", "Any, rolled as per the rulebook"], ["First turn", "The bait"], ["Game ends", "A fleet disengages or is destroyed"]],
    bring: ["Reinforcements waiting off the table"],
    forces: { a: ["Up to 1000 pts from the Battlegroup Seiche list.", "The bait, 250–500 pts of it, from the Mercantile fleet list; the rest are reinforcements."], b: ["Up to 500 pts from the Hivefleet Devourer list: only Alpha (cruiser) and Gamma (Hafgufa) classes."] },
    draw: (v, W, H) => MAPS["the-bait"](v, W, H),
    fit: () => [140, 50],
    mapNote: "As The Bait (RB p. 130): the bait in the centre, the Tyranids more than 60 cm behind it, the reinforcements entering from the edge ahead — after turn 1 also along the long edges, 30 cm further each turn.",
    steps: [
      { t: "Battlezone: any, generated as per the rulebook." },
      { s: "a", t: "Place the merchant bait first in the centre, facing one short edge." },
      { s: "b", t: "Deploy at least 60 cm behind it." },
      { s: "a", t: "Keep the reinforcements off the table: they enter from the edge in front of the bait." },
      { s: "a", t: "The bait takes the first turn." }
    ],
    notes: [CAMP2],
    refs: [["The Bait (the same set-up)", "RB p. 130"], ["Merchant fleet list", "FL p. 454"], ["Tyranid hive fleet list", "FL p. 430"], ["Victory points", "RB p. 122"]],
    play: [
      { w: "Any turn", s: "a", t: "Reinforcements may enter on any turn, turn 1 included. After turn 1 they may also enter up to 30 cm along a long edge for each turn after the first (a ship arriving on turn 4: up to 90 cm)." },
      { w: "Campaign", t: "Imperial win: add one surviving merchant of up to 100 pts free to The Last Wave. Tyranid win: one Devourer Alpha cruiser gets the Psychic Scream evolution in The Last Wave." }
    ],
    fx: T => entryFx(T),
    tools: [{ k: "info", html: st => entryInfo(st.turn) }],
    rtools: vpTools("Battlegroup Seiche", "Tyranids"),
    end: ["One fleet disengages or is destroyed."],
    win: ["Standard victory points for ships crippled or destroyed (RB p. 122). The higher total wins."],
    result(st) { return vpr(st, "Battlegroup Seiche", "Tyranids"); },
    info: { bg: "After the Avaheim escape, Imperial Command knew what was coming. A strike force mustered from the Seiche initiative set out to lure the xenos out of position for the next step of the war.", cr: [V2 + " " + P2(54) + ".", CAMP2] }
  },
  /* ============================================================ BOTV II · 2B VALLAR'S EULOGY */
  {
    id: "fan-v-eulogy", grp: "fan-botv", name: "Vallar’s Eulogy", series: "Book of the Void II · Devourer Unleashed, scenario 2B", trust: "fan",
    why: "Surprise Attack on Vallar: the swarm bursts into a system that never got the warning.", src: P2(55), book: "O", suggest: ["Imperial Navy", "Tyranids"],
    others: OTHERS_V2 + " The set-up is Surprise Attack’s (RB p. 132).",
    sides: { a: { n: "Tyranids", f: "Hivefleet Devourer (fan list)" }, b: { n: "Battlegroup Seiche", f: "Battlegroup Seiche (fan list)" } },
    pitch: "With Peregrine Squadron lost at Avaheim, nobody warned Vallar. The hive fleet arrives in an endless wave of teeth and claws while most of the defenders still sit in dock.",
    glance: [["Points", "1000 each + 75 pts of defences"], ["Table", "Not given — use your table"], ["Battlezone", "Primary biosphere: Vallar and a moon"], ["First turn", "Tyranids"], ["Game ends", "A fleet disengages or is destroyed"]],
    bring: ["A medium planet and a small moon", "75 pts of planetary defences"],
    forces: { a: ["Up to 1000 pts from the Hivefleet Devourer list: only Alpha (cruiser) and Gamma (Hafgufa) classes."], b: ["Up to 1000 pts from the Battlegroup Seiche list, at least a quarter from the Mercantile fleet list.", "Plus 75 pts of planetary defences."] },
    draw: (v, W, H) => MAPS["surprise-attack"](v, W, H).concat([{ z: "planet", cx: W / 2 + 60, cy: H / 2 + 20, r: 2.5, l: "moon: 60 cm", free: 1 }]),
    fit: () => [120, 90],
    mapNote: "As Surprise Attack (RB p. 132): Vallar in the centre, a small moon 60 cm from it in any direction, no rings. D3 defending ships on full alert anywhere 30 cm or more from the edges; the rest on standby within 15 cm of the planet.",
    steps: [
      { t: "Battlezone: primary biosphere. Place a medium planet (Vallar, no rings) in the centre and a small moon 60 cm from it. Choose the sunward edge and place other phenomena at random." },
      { s: "b", t: "Choose D3 ships or squadrons to be on full alert (tool below). Set them up anywhere at least 30 cm from every table edge." },
      { s: "b", t: "Everything else is on standby: each squadron with at least one ship within 15 cm of the planet, every ship abeam of its surface." },
      { s: "a", t: "No deployment: you move on from the edge of your choice in your first turn, which you take." }
    ],
    stools: [{ k: "roll", id: "alertn", l: "Ships on full alert", sub: "D3 — roll a D6", rows: () => [[1, 2, "1 ship or squadron"], [3, 4, "2 ships or squadrons"], [5, 6, "3 ships or squadrons"]] }],
    notes: [CAMP2],
    refs: [["Surprise Attack (the same set-up)", "RB p. 132"], ["Planetary defences", "FL p. 496–"], ["Victory points", "RB p. 122"]],
    play: [
      { w: "Standby", s: "b", t: "Ships on standby may not move, fire or launch ordnance. They may Brace for Impact and repair critical damage; turrets and shields work normally." },
      { w: "Going on alert", s: "b", t: "Pass a Leadership test. It is not a command check: a failure does not stop you testing the others. No special orders in the turn a ship goes on alert." },
      { w: "Campaign", t: "Imperial win: two free veteran captains (Ld 8) in The Last Wave. Tyranid win: the Omega hive ship gets the Adrenaline Sacs evolution in The Last Wave." }
    ],
    fx: (T, st) => { const o = []; if (T === 1) o.push(["a", "Move on from the edge of your choice"]); if (get(st, "stb", 0) > 0) o.push(["b", get(st, "stb", 0) + " still on standby: Leadership test to go on alert"]); return o; },
    tools: [{ k: "counter", id: "stb", l: "Ships or squadrons still on standby", s: "b" }],
    rtools: vpTools("Tyranids", "Battlegroup Seiche"),
    end: ["One fleet disengages or is destroyed."],
    win: ["Both fleets score victory points as normal (RB p. 122). The higher total wins."],
    result(st) { return vpr(st, "Tyranids", "Battlegroup Seiche"); },
    info: { bg: "Imperial Command stayed in the dark about Avaheim until the hive fleets burst into the neighbouring Vallar system.", cr: [V2 + " " + P2(55) + ".", CAMP2] }
  },
  /* ============================================================ BOTV II · 3 THE SIRVOS DISASTER */
  {
    id: "fan-v-sirvos", grp: "fan-botv", name: "The Sirvos Disaster", series: "Book of the Void II · Devourer Unleashed, scenario three", trust: "fan",
    why: "A strike on the hive ship Omega, coiled inside the rings of a giant planet with escorts in low orbit — and two sub-plots set by the story.", src: P2(56), book: "O", suggest: ["Imperial Navy", "Tyranids"],
    others: OTHERS_V2 + " The Immortal Flame is an Apocalypse class battleship (FL p. 52); the Immaterium is a Rogue Trader cruiser.",
    sides: { a: { n: "Battlegroup Storm Surge", f: "Battlegroup Storm Surge (fan list)" }, b: { n: "Tyranids", f: "Hivefleet Devourer (fan list)" } },
    pitch: "The Silenzio found the hive ship Omega. Led by the Immortal Flame and Baron von Altenfels’ Immaterium, Battlefleet Discordia broke warp at Sirvos to kill it — and began one of the most horrific battles in its history.",
    glance: [["Points", "1500 each"], ["Table", "Not given — use your table"], ["Battlezone", "Primary or inner biosphere, a ringed large planet"], ["First turn", "Storm Surge"], ["Game ends", "A fleet disengages or is destroyed"]],
    bring: ["A large planet with a gas ring and an asteroid ring", "A low orbit table (RB p. 116)", "At most one asteroid field and one dust cloud"],
    forces: { a: ["Up to 1500 pts from the Battlegroup Storm Surge list, including the Immortal Flame (Apocalypse class battleship) and the Immaterium (Baron von Altenfels)."], b: ["Up to 1500 pts from the Hivefleet Devourer list: one hive ship at Ld 9 (the Omega); the rest only Shield Drones and Hafgufa. No hive cruiser."] },
    draw: (v, W, H) => { const px = W - 40, py = H / 2; return [
      { z: "ring", cx: px, cy: py, r: 10 + 30 + 2, sw: 4, ast: 1, free: 1 }, { z: "ring", cx: px, cy: py, r: 10 + 35 + 2, sw: 4, gas: 1, free: 1 }, { z: "planet", cx: px, cy: py, r: 10, l: "large planet", free: 1 },
      { z: "mark", x: px - 22, y: py, s: "b", l: "Omega", free: 1 }, { z: "text", x: W / 2 + 8, y: H - 14, l: "planet: up to 150 cm from a short edge;\nasteroid ring 30 cm out, gas ring 35 cm", s: "n" },
      R(0, 0, 15, H, "a", "Storm Surge: 15 cm", { rot: -90 })]; },
    fit: () => [150, 100],
    mapNote: "The large planet is no more than 150 cm from one short edge, with an asteroid ring 30 cm and a gas ring 35 cm from its edge. The Omega sits between the rings and the planet; half the escort squadrons are in low orbit. Storm Surge sets up within 15 cm of the far short edge.",
    steps: [
      { t: "Battlezone: primary or inner biosphere. Place a large planet no more than 150 cm from one short edge, with an asteroid ring 30 cm and a gas ring 35 cm from its edge." },
      { t: "Declare one table edge sunward and set up other phenomena as normal, but at most one asteroid field and one dust cloud." },
      { s: "b", t: "Place the Omega between the rings and the planet. Put half of your escort squadrons in low orbit (RB p. 116); the rest around the planet facing a random direction (roll per squadron), two of them outside the rings, 60 cm from the planet’s edge." },
      { s: "a", t: "Deploy within 15 cm of the short edge furthest from the planet." },
      { s: "a", t: "You take the first turn." }
    ],
    notes: ["Sub-plots are set by the story here, not rolled: Storm Surge has Vendetta against the Omega, the Tyranids have Gunnery Practice with the 4+ active (RB p. 125).", CAMP2],
    refs: [["Low orbit", "RB p. 116"], ["Rings", "RB p. 113"], ["Sub-plots: Vendetta, Gunnery Practice", "RB p. 125"], ["Apocalypse class battleship", "FL p. 52"]],
    play: [
      { w: "Sub-plot", s: "a", t: "Vendetta, aimed at the Omega hive ship (RB p. 125)." },
      { w: "Sub-plot", s: "b", t: "Gunnery Practice, with the 4+ active (RB p. 125)." },
      { w: "Campaign", t: "Into The Last Wave: the loser’s fleet is at −1 Leadership for its first three turns. If Storm Surge completes its sub-plot, the Omega starts The Last Wave crippled; if the Tyranids complete theirs, roll a D6 for every Imperial capital ship there: on 4+ it takes D2 damage." }
    ],
    tools: [],
    rtools: vpTools("Battlegroup Storm Surge", "Tyranids"),
    end: ["One fleet disengages or is destroyed."],
    win: ["Both fleets score victory points as normal (RB p. 122), sub-plots included. The higher total wins."],
    result(st) { return vpr(st, "Battlegroup Storm Surge", "Tyranids"); },
    info: { bg: "When the Silenzio discovered the hive ship Omega, the admirals of Imperial Command formed a strike fleet to kill it and break the swarms’ cohesion. Sirvos became one of the most famous and horrific battles in Battlefleet Discordia’s history.", cr: [V2 + " " + P2(56) + ".", CAMP2] }
  },
  /* ============================================================ BOTV II · 4 THE LAST WAVE */
  {
    id: "fan-v-last-wave", grp: "fan-botv", name: "The Last Wave", series: "Book of the Void II · Devourer Unleashed, scenario four", trust: "fan",
    why: "The battle of Drakmar: 2000 points a side, with the Helian rearguard arriving on the Tyranid flank in turn 3.", src: P2(57), book: "O", suggest: ["Imperial Navy", "Tyranids"],
    others: OTHERS_V2 + " The rearguard (historically all Helian ships) can be any 500 pts or more of your fleet.",
    sides: { a: { n: "Battlegroup Storm Surge", f: "Battlegroup Storm Surge (fan list)" }, b: { n: "Tyranids", f: "Hivefleet Devourer (fan list)" } },
    pitch: "In a last attempt to halt the Tyranids short of the heart of Discordia, every remaining Imperial ship goes hunting the hive ships. At Drakmar the Helian rearguard waits for its moment.",
    glance: [["Points", "2000 each"], ["Table", "180 × 120 cm (the map)"], ["Battlezone", "Deep space, a short edge sunward"], ["First turn", "Tyranids"], ["Game ends", "A fleet disengages or is destroyed"]],
    bring: ["Celestial phenomena"],
    forces: { a: ["Up to 2000 pts from the Battlegroup Storm Surge list, without the Immortal Flame.", "At least 500 pts of it are the rearguard, arriving in turn 3."], b: ["Up to 2000 pts from the Hivefleet Devourer list."] },
    draw: (v, W, H) => [R(W / 2 - 30, 0, 60, 30, "b", "Tyranids: 60 × 30 cm"), { z: "arrow", x1: W / 2, y1: 24, x2: W / 2, y2: 40, s: "b" },
      R(0, H - 60, 30, 60, "a", ""), R(30, H - 30, 30, 30, "a", ""), { z: "text", x: 30, y: H - 12, l: "Storm Surge", s: "a" }, { z: "arrow", x1: 18, y1: H - 42, x2: 32, y2: H - 56, s: "a" },
      R(W - 15, 0, 15, 60, "a", "Rearguard: turn 3", { rot: 90 }), { z: "arrow", x1: W - 18, y1: 30, x2: W - 34, y2: 30, s: "a" }],
    fit: () => [150, 100], srcTable: [180, 120],
    mapNote: "From the supplement’s map (to scale): the Tyranids 60 × 30 cm in the middle of one long edge; Storm Surge in an L in the corner opposite — 30 × 60 cm along the short edge and 30 × 30 cm beside it; the rearguard enters in turn 3 from a 15 × 60 cm strip at the far end of the Tyranids’ long edge. The arrows give the facing.",
    steps: [
      { t: "Battlezone: deep space. Set up phenomena by the rulebook or in any agreed way; one short edge is sunward." },
      { s: "b", t: "Deploy in your zone, facing as the arrow shows." },
      { s: "a", t: "Deploy the main fleet in your corner zone, facing toward the centre. Keep the rearguard (at least 500 pts) off the table." },
      { s: "b", t: "The Tyranids take the first turn." }
    ],
    notes: ["The source does not say how the rearguard arrives; the default (Agree before you start) is ours: it moves on in turn 3 from its 15 × 60 cm strip, facing as the map shows.", CAMP2],
    refs: [["Tyranid hive fleet list", "FL p. 430"], ["Victory points", "RB p. 122"]],
    play: [
      { w: "Turn 3", s: "a", t: "The rearguard arrives: {a:rear}." },
      { w: "Campaign carry-over", t: "Apply what the earlier games gave: a free merchant or Psychic Scream (Vallar’s Gambit), veteran captains or Adrenaline Sacs (Vallar’s Eulogy), and the Leadership and damage effects of The Sirvos Disaster." }
    ],
    fx: T => T === 3 ? [["a", "The rearguard arrives"]] : [],
    tools: [],
    rtools: vpTools("Battlegroup Storm Surge", "Tyranids"),
    end: ["One fleet disengages or is destroyed."],
    win: ["Both fleets score victory points as normal (RB p. 122). The higher total wins."],
    result(st) { return vpr(st, "Battlegroup Storm Surge", "Tyranids"); },
    info: { bg: "Towards the end of 112.M42 the allied Imperial fleet mustered everything it had left. Having learned from Sirvos, the Helian faction was held back as a flanking force — and the battle of Drakmar became the single most important engagement of the Xenos Tide.", cr: [V2 + " " + P2(57) + ".", CAMP2] }
  }
  ]);
})();
