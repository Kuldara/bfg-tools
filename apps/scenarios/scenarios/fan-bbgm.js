/* Fan supplements: BBGM (1.11.2026). A compilation of house rules, FAQs and errata by Bear, BinExis, DarthGoogle and
   Mazilka, version May 2026, built on the original rules and FAQ 2007 rather than on Remastered. Its scenario chapter
   (p. 60-80) prints 14 of the "fifteen" scenarios it announces. Compared with the Rulebook and Invasion on 1.11.: seven get
   their own card (Points of Interest, Chance Encounter, Star Fort Assault, Patrol War, and Raiders, Defensive Ring and
   Planetary Assault, which share a name but not a game), five are a Version switch on the existing card (addVariant,
   end of this file), and Convoy and Fleet Engagement are left out because they barely differ. Page numbers are PDF pages, which are the printed ones. Summarised in our own
   words. No public address for the book is known, so there is no Open the original link. */
(function () {
  const BB = n => "BBGM p. " + n;
  const CREDIT = "From BBGM (version May 2026), a fan compilation of house rules, FAQs and errata by Bear, BinExis, DarthGoogle and Mazilka, built on the original rules and FAQ 2007.";
  const vpTools = (a, b) => [{ k: "num", id: "va", s: "a", l: a + ": victory points", after: v => v + " VP" }, { k: "num", id: "vb", s: "b", l: b + ": victory points", after: v => v + " VP" }];
  const vpr = (st, a, b) => { const x = num(st, "va"), y = num(st, "vb"); if (!x && !y) return [null, "Count victory points", "Enter both totals below."]; return x === y ? ["draw", "Level", "Both " + x + " VP."] : [x > y ? "a" : "b", wins(x > y ? a : b), a + " " + x + " VP, " + b + " " + y + " VP."]; };
  /* most completed objectives wins, a tie is a draw; nothing marked yet = still in progress */
  const most = (st, what) => { const x = get(st, "ca", 0), y = get(st, "cb", 0); if (!x && !y) return [null, "Battle in progress", "Mark the completed " + what + " below."]; return x === y ? ["draw", "Draw", "Both " + x + " " + what + "."] : [x > y ? "a" : "b", wins(x > y ? "Player A" : "Player B"), "Player A " + x + ", Player B " + y + " " + what + "."]; };
  const POI = [
    "A warp rift opens around the ship: it must pass a Leadership test on 3D6, as for moving into a rift (RB p. 111).",
    "A Warp Beast boards the ship: place a Tyranid cruiser with claws and 8 hits, facing by scatter die. Whoever kills it completes this point.",
    "The ship or squadron takes a ship experience test: roll 2D6 higher than its current Leadership.",
    "A big piece of hull: the ship carries the marker and must move off the table with it to complete this point. The enemy steals it by boarding the ship, or by destroying the ship and picking the marker up.",
    "An extra objective for this ship or squadron. Roll a D3: 1 perform a boarding action, 2 ram the enemy, 3 cripple or destroy any enemy ship or escort squadron.",
    "Resources: this point is completed at once."
  ];
  addScenarios([
  /* ============================================================ POINTS OF INTEREST */
  {
    id: "fan-b-poi", grp: "fan-bbgm", name: "Points of Interest", series: "BBGM · raid", trust: "fan",
    why: "Seven contact markers across the table, and each hides a surprise. Most points of interest wins, whatever the damage.", src: BB(64), book: "O", suggest: null,
    others: "Written for any two fleets.",
    sides: { a: { n: "Player A" }, b: { n: "Player B" } },
    pitch: "Two small fleets race across the same stretch of space to see what the augurs picked up: resources, wreckage, a warp rift, or something that bites.",
    glance: [["Points", "Up to 750 each"], ["Table", "180 × 120 cm on the source’s map"], ["Battlezone", "Any, agreed"], ["First turn", "Roll-off, winner chooses"], ["Game ends", "After 6 turns, or a fleet is gone"]],
    bring: ["7 contact markers", "A Tyranid cruiser with claws (Warp Beast)", "A cruiser model for the Alien Raider"],
    forces: { a: ["Up to 750 pts."], b: ["Up to 750 pts."] },
    draw: (v, W, H) => {
      const mk = (x, y) => ({ z: "mark", x, y, s: "c", l: "" }), cx = W / 2, cy = H / 2;
      return [R(0, 0, W, 15, "a", "Player A: within 15 cm"), R(0, H - 15, W, 15, "b", "Player B: within 15 cm"),
        mk(cx, cy), mk(cx - 45, cy), mk(cx + 45, cy), mk(cx - 22.5, cy - 20), mk(cx + 22.5, cy - 20), mk(cx - 22.5, cy + 20), mk(cx + 22.5, cy + 20)];
    },
    fit: () => [120, 80], srcTable: [180, 120],
    mapNote: "Three markers along the centre line, 45 cm apart, and two rows of two, 45 cm apart and 20 cm either side of it.",
    steps: [
      { t: "Set up phenomena in any agreed way." },
      { t: "Place one contact marker in the middle of the table and six more as on the map." },
      { t: "Each player rolls a D6. The higher roll places a ship or squadron first, within 15 cm of a long edge; the other player uses the other long edge. Take turns until everything is placed." },
      { t: "Both roll a D6. The higher roll chooses to go first or second." }
    ],
    notes: ["The source’s map labels the zones Defender and Attacker, but its text has no such roles, so here they are Player A and Player B.", "The map gives the two pairs’ spacing and distance from the centre line but not their position along it; they are drawn centred. The 45 cm from the short edges fits a 180 cm table, so on other tables the markers stay 45 cm apart around the centre.", "The Alien Raider (BBGM p. 56) leaves the table by itself at 2 hits or less, which the source does not reconcile with “any player who destroys it”; the default is in Agree before you start."],
    refs: [["Warp rifts", "RB p. 111"], ["Massive claws", "FL p. 422"], ["Alien Raider and its profile", BB(56)], ["Victory points", "RB p. 122"]],
    play: [
      { w: "Any ship touching a marker", t: "It activates the marker: remove it and roll 2D6 on the table, applying the effect at once." },
      { w: "Turn 6", t: "Last turn." }
    ],
    turnMax: () => 6,
    tools: [
      { k: "roll", id: "inside", d2: 1, l: "What’s inside", sub: "2D6 when a ship touches a marker", rows: () => [[2, 2, POI[0]], [3, 3, POI[1]], [4, 4, POI[2]], [5, 5, POI[3]], [6, 6, POI[4]], [7, 7, POI[5]], [8, 8, POI[4]], [9, 9, POI[3]], [10, 10, POI[2]],
        [11, 11, "An Alien Raider appears (tools below). Whoever destroys it completes this point."], [12, 12, "Valuable wreckage: D3 completed points of interest."]] },
      { k: "roll", id: "xeno", l: "Alien Raider: its xenolances", sub: "D6 when it appears. Cruiser, 8 hits, 25 cm, 180°, 3 shields, armour 5+, 3 turrets, Ld 8. Two 30 cm lances L/F/R, port and starboard 30 cm 3 lances", rows: () => [
        [1, 1, "Particle: a standard lance that ignores shields on a 6."], [2, 2, "Bombardment: a critical hit on 4+ instead of 6."], [3, 3, "Long range: all 45 cm; port lances left/front, starboard lances right/front."],
        [4, 4, "Impaler: no usual damage. Each hit on a shield rolls D6 on the critical table, each hit on the hull 2D6."], [5, 5, "Phantom: as Dark Eldar phantom lances."], [6, 6, "Pulsar: as Eldar Corsair pulsar lances."]] },
      { k: "roll", id: "raider", l: "Alien Raider: arriving", sub: "D6 at the start of each player turn until it is on the table", rows: () => [[1, 3, "Not yet."], [4, 6, "It arrives on a random edge next to the ship nearest that edge and fires at it before the movement phase. From now on it moves and fires at the nearest ship before that player’s movement phase, using only Brace for Impact and Lock On. It turns back at a table edge."]] }
    ],
    rtools: [{ k: "counter", id: "ca", s: "a", l: "Player A: points of interest completed", res: 1 }, { k: "counter", id: "cb", s: "b", l: "Player B: points of interest completed", res: 1 }],
    end: ["After six turns.", "Or when one fleet is destroyed or disengages."],
    win: ["The player with the most completed points of interest wins. A tie is a draw."],
    result(st) { return most(st, "points of interest"); },
    info: { bg: "A small raid where the objective is on the table from the start but nobody knows what it is. The damage only matters for what it lets you reach.", cr: [CREDIT + " " + BB(64) + "."] }
  },
  /* ============================================================ CHANCE ENCOUNTER */
  {
    id: "fan-b-chance", grp: "fan-bbgm", name: "Chance Encounter (BBGM)", series: "BBGM · raid", trust: "fan",
    why: "Two sub-plots each, and they are the whole game: the most completed sub-plots wins, not the most damage.", src: BB("68–69"), book: "O", suggest: null,
    others: "Written for any two fleets.",
    sides: { a: { n: "Dark zone" }, b: { n: "Light zone" } },
    pitch: "Neither fleet came here for this fight. Each has its own errands to finish, and for the first three turns there is no easy way out.",
    glance: [["Points", "Up to 750 each"], ["Table", "Not given — use your table"], ["Battlezone", "Any, agreed"], ["First turn", "Roll-off after deployment"], ["Game ends", "After 6 turns, or a fleet is gone"]],
    bring: ["Sub-plot tables (this app’s Sub-plots page)"],
    forces: { a: ["Up to 750 pts.", "Deploys in the dark zone of the set-up map."], b: ["Up to 750 pts.", "Deploys in the light zone of the set-up map."] },
    variants: [["A", "Set-up A"], ["B", "Set-up B"], ["C", "Set-up C"], ["D", "Set-up D"]],
    draw: (v, W, H) => MAPS["fleet-engagement"](v, W, H), legend: [["a", "Dark zone"], ["b", "Light zone"]],
    fit: v => ({ A: [140, 100], B: [70, 80], C: [140, 60], D: [110, 100] }[v] || [140, 100]),
    mapNote: "The same set-ups and formation table as Fleet Engagement (RB p. 142). Blue is the dark zone, red the light one: the formations decide which fleet takes which, so the colours are zones, not fleets. A zone split into divisions needs at least one ship or squadron in each.",
    steps: [
      { t: "Set up phenomena in any agreed way." },
      { t: "Each player rolls two sub-plots instead of one, before anything else: {a:sp}. Roll more if a fleet’s rules or a sub-plot says so." },
      { t: "Each player secretly chooses a formation — Sphere, Wedge or Cross — and both reveal. Enter them in the tool below." },
      { t: "Split result: both roll a D6. +1 if your fastest ship is faster than any enemy ship, +1 for the best fleet commander, +1 for the most escorts. The winner picks the set-up." },
      { t: "Both roll a D6. The lower roll deploys a squadron or lone ship first; then take turns, with at least one ship or squadron in every division. Every ship faces the way of its division’s arrow." },
      { t: "Both roll a D6. The higher roll chooses to go first or second." }
    ],
    stools: [{ k: "formation", id: "form" }], stoolsFirst: 1,
    notes: ["BBGM has its own sub-plot chapter (p. 81–96) with a table per race. This library has the Rulebook’s, so they are the default; use BBGM’s if you have the book.", "The Sub-plots tab follows one sub-plot per player. Roll the second on the Sub-plots page and keep it in mind, or on paper."],
    refs: [["Fleet Engagement set-ups", "RB p. 142–143"], ["Sub-plots", "RB p. 124–127"], ["Victory points", "RB p. 122"]],
    play: [
      { w: "Turns 1–3", t: "No disengaging by Leadership test. Any ship that moves off the table in these turns counts as destroyed." },
      { w: "Turn 6", t: "Last turn." }
    ],
    turnMax: () => 6,
    tools: [],
    rtools: [{ k: "counter", id: "ca", s: "a", l: "Dark zone: sub-plots completed", res: 1 }, { k: "counter", id: "cb", s: "b", l: "Light zone: sub-plots completed", res: 1 }, ...vpTools("Dark zone", "Light zone")],
    end: ["After six turns.", "Or when one fleet disengages or is destroyed."],
    win: ["The player with the most completed sub-plots wins; an equal number is a draw.", "A sub-plot that needs you to win the game counts as completed if you scored more victory points than your opponent."],
    result(st) { const x = get(st, "ca", 0), y = get(st, "cb", 0); if (!x && !y) return [null, "Battle in progress", "Mark the completed sub-plots below."]; return x === y ? ["draw", "Draw", "Both " + x + " sub-plots."] : [x > y ? "a" : "b", wins(x > y ? "Dark zone" : "Light zone"), "Dark zone " + x + ", Light zone " + y + " sub-plots."]; },
    info: { bg: "A Fleet Engagement’s opening at raid size, with the battle itself turned into the background of each commander’s private objectives.", cr: [CREDIT + " " + BB("68–69") + "."] }
  },
  /* ============================================================ STAR FORT ASSAULT */
  {
    id: "fan-b-starfort", grp: "fan-bbgm", name: "Star Fort Assault", series: "BBGM · major raid", trust: "fan",
    why: "A Ramilies star fort split between two boarding parties: each player owns two quadrants and shoots the other’s.", src: BB(73), book: "O", suggest: null,
    others: "Written for any two fleets. The star fort belongs to neither list and costs nothing.",
    sides: { a: { n: "Player A" }, b: { n: "Player B" } },
    pitch: "The fight inside the star fort has reached a stalemate, its crews dwindling and its guns firing at whatever is nearest. Two fleets arrive to settle it from outside.",
    glance: [["Points", "Up to 1000 each"], ["Table", "Not given — use your table"], ["Battlezone", "Any, agreed"], ["First turn", "Roll-off, winner chooses"], ["Game ends", "After 6 turns, or a fleet is gone"]],
    bring: ["A Ramilies star fort, or a stand-in with four marked sides"],
    forces: { a: ["Up to 1000 pts.", "Two quadrants of the star fort, as rolled."], b: ["Up to 1000 pts.", "Two quadrants of the star fort, as rolled."] },
    variants: [["A", "Deployment A"], ["B", "Deployment B"]],
    draw: (v, W, H) => {
      const zw = Math.min(60, W / 2 - 8), x = v === "B" ? W - zw : 0, d = v === "B" ? -1 : 1, ax = x + zw / 2;
      return [R(x, 0, zw, 30, "a", "Zone 1"), R(x, H - 30, zw, 30, "b", "Zone 2"),
        { z: "arrow", x1: ax - d * 10, y1: 23, x2: ax + d * 10, y2: 23, s: "a" }, { z: "arrow", x1: ax - d * 10, y1: H - 23, x2: ax + d * 10, y2: H - 23, s: "b" },
        { z: "mark", x: W / 2, y: H / 2, s: "c", l: "Ramilies" }];
    },
    fit: () => [120, 80],
    legend: [["a", "Zone 1"], ["b", "Zone 2"], ["c", "Star fort"]],
    mapNote: "The star fort is in the centre with its docking piers facing the table edges. Each zone is 60 cm along the long edge and 30 cm deep, at the same short edge. Ships face the way of the arrow.",
    steps: [
      { t: "Set up phenomena in any agreed way. No other defence may be in this scenario." },
      { t: "Place the Ramilies in the centre, docking piers toward the table edges." },
      { t: "Each player rolls a D6. The higher roll picks deployment A or B and a zone, and places their flagship parallel to the long edge, facing the fort. The other player takes the other zone of that deployment." },
      { t: "Take turns placing ships and squadrons in your own zone until all are placed." },
      { t: "Roll a D6 for each quadrant. The two highest belong to the player who placed first, the two lowest to the other. Reroll if that does not settle it." },
      { t: "Both roll a D6. The higher roll chooses to go first or second." }
    ],
    notes: ["The fort’s profile is the same in the Fleets book (FL p. 500) and BBGM (p. 348), so the book is cited. BBGM’s normal rule removes D6 blast markers from the whole fort; this scenario says each quadrant removes D6.", "“Destroyed Enemy quadrant costs 200 Victory Points, Crippled quadrant costs 100” is read as 200 for a destroyed one in place of the 100, like ships in the victory points rules. See Agree before you start."],
    refs: [["Ramilies class star fort", "FL p. 500"], ["Victory points", "RB p. 122"]],
    play: [
      { w: "Fort’s fire", t: "Each quadrant fires at the enemy fleet, never at the fort, and always at the closest target. Lances reach only 45 cm." },
      { w: "Launch bays", t: "Empty, and they cannot be reloaded." },
      { w: "Basilica", t: "Its weapons belong to the player with more hits left in their two quadrants together. That player may pass Leadership tests to ignore the closest target and may use Lock On for their quadrants." },
      { w: "Orders and damage", t: "Each quadrant may try Brace for Impact and removes D6 blast markers on its own. Shields, turrets and critical damage work as usual." },
      { w: "Shooting the fort", t: "A fleet can target only the quadrants its enemy owns. Quadrants have 12 hits each and are crippled at 6." },
      { w: "Turn 6", t: "Last turn." }
    ],
    turnMax: () => 6,
    tools: [{ k: "counter", id: "q1", l: "Quadrant 1: hits left", start: 12, max: 12 }, { k: "counter", id: "q2", l: "Quadrant 2: hits left", start: 12, max: 12 }, { k: "counter", id: "q3", l: "Quadrant 3: hits left", start: 12, max: 12 }, { k: "counter", id: "q4", l: "Quadrant 4: hits left", start: 12, max: 12 }],
    rtools: [...vpTools("Player A", "Player B")],
    end: ["After six turns.", "Or when one fleet is destroyed or disengages."],
    win: ["Both fleets score victory points as normal, plus 200 VP for each enemy quadrant destroyed and 100 VP for each crippled. The higher total wins."],
    result(st) { return vpr(st, "Player A", "Player B"); },
    info: { bg: "Rival boarding parties have fought each other to a standstill inside a Ramilies, each holding half of it. Whoever wins outside gets the fort.", cr: [CREDIT + " " + BB(73) + "."] }
  },
  /* ============================================================ PATROL WAR */
  {
    id: "fan-b-patrol", grp: "fan-bbgm", name: "Patrol War", series: "BBGM · battle", trust: "fan",
    why: "Half of each fleet starts in opposite corners, and each player secretly keeps one of the other’s reserves out of the battle.", src: BB(80), book: "O", suggest: null,
    others: "Written for any two fleets.",
    sides: { a: { n: "Player A" }, b: { n: "Player B" } },
    pitch: "Two patrol fleets meet, each with reserves on the way. You can see what the enemy has in them, and you get to choose which never arrives.",
    glance: [["Points", "Equal"], ["Table", "Not given — use your table"], ["Battlezone", "Any, agreed"], ["First turn", "Roll-off after deployment"], ["Game ends", "A fleet disengages or is destroyed"]],
    bring: ["Equal fleets, split into three divisions"],
    forces: {
      a: ["Equal points, split openly: a main division of 40–60% of the fleet’s value (500–750 pts of a 1250 pt fleet), and the rest in two reserve divisions of any size."],
      b: ["Equal points, split openly: a main division of 40–60% of the fleet’s value (500–750 pts of a 1250 pt fleet), and the rest in two reserve divisions of any size."]
    },
    variants: [["ad", "Corners A and D"], ["bc", "Corners B and C"]],
    draw: (v, W, H) => {
      const L = Math.min(90, W / 2), S = Math.min(60, H / 2), ad = v !== "bc";
      const z = ad ? [{ z: "poly", pts: [[0, 0], [L, 0], [0, S]], s: "a" }, { z: "poly", pts: [[W, H], [W - L, H], [W, H - S]], s: "b" }] : [{ z: "poly", pts: [[W, 0], [W - L, 0], [W, S]], s: "a" }, { z: "poly", pts: [[0, H], [L, H], [0, H - S]], s: "b" }];
      return [...z, { z: "text", x: ad ? L / 3 : W - L / 3, y: S / 3, l: ad ? "A" : "B", s: "a" }, { z: "text", x: ad ? W - L / 3 : L / 3, y: H - S / 3, l: ad ? "D" : "C", s: "b" },
        { z: "edge", e: "l", s: "n", l: "1" }, { z: "edge", e: "t", s: "n", l: "2–3" }, { z: "edge", e: "b", s: "n", l: "4–5" }, { z: "edge", e: "r", s: "n", l: "6" }];
    },
    fit: () => [100, 80],
    mapNote: "Four corner zones, each reaching 90 cm along the long edge and 60 cm along the short edge. The first player to place picks a corner and the other takes the opposite one: D for A, C for B. The numbers on the edges are the arrival roll for the reserves.",
    steps: [
      { t: "Pick equal fleets and split each openly into a main division (40–60% of its value) and two reserve divisions." },
      { t: "Set up phenomena in any agreed way." },
      { t: "Each player rolls a D6. The higher roll places a ship or squadron of the main division in a corner zone; the other uses the opposite corner. Take turns until both main divisions are placed." },
      { t: "Each player secretly decides which of the opponent’s reserve divisions is delayed and stays out of the battle. Reveal at the same time." },
      { t: "Both roll a D6. The higher roll chooses to go first or second." }
    ],
    notes: ["“The remaining reserve divisions enter the Battlefield from the random table edge” does not say whether one roll covers both fleets or when in the turn they arrive. The defaults are in Agree before you start.", "The source says the delayed division “won’t participate in the Battle at all” and does not mention its victory points; we read that as none for either side."],
    refs: [["Victory points", "RB p. 122"]],
    play: [{ w: "Turn 3", t: "At the start of the turn the remaining reserve divisions arrive on a random table edge: {a:edge}. Roll with the tool." }],
    tools: [{ k: "roll", id: "edge", l: "Reserves: table edge", sub: "D6 at the start of turn 3", rows: EDGE_ROWS }],
    rtools: [...vpTools("Player A", "Player B")],
    end: ["One fleet disengages or is destroyed."],
    win: ["Both fleets score victory points as normal. The higher total wins."],
    result(st) { return vpr(st, "Player A", "Player B"); },
    info: { bg: "Fleets on patrol rarely fight all at once. This battle is decided as much by the divisions that never get there as by the ones already on the table.", cr: [CREDIT + " " + BB(80) + "."] }
  },
  /* ============================================================ RAIDERS */
  {
    id: "fan-b-raiders", grp: "fan-bbgm", name: "Raiders (BBGM)", series: "BBGM · raid", trust: "fan",
    why: "The Raiders’ opening, but the target is a convoy: some of what you see is empty, and some of it shoots back.", src: BB(63), book: "O", suggest: null,
    others: "Written for any two fleets. Tau, Orks and Eldar have their own transports, below.",
    sides: { a: { n: "Raiders" }, b: { n: "Defender" } },
    pitch: "A strike force catches a transport group at anchor. It has to sink more than half the cargo it can see, without knowing which hulls hold any.",
    glance: [["Points", "Defender 1000 + transports · Raiders up to 750"], ["Table", "Not given — use your table"], ["Battlezone", "Any, agreed"], ["First turn", "Raiders"], ["Game ends", "After 8 turns, or a fleet disengages"]],
    bring: ["Transport models: rolled in Set-up", "Paper for the secret Q-ships and decoys"],
    forces: {
      a: ["Up to 750 pts."],
      b: ["Up to 1000 pts.", "Plus transports rolled in Set-up, Leadership 6.", "Corsair, Dark and Craftworld Eldar instead take 2 squadrons of 3 of their own transports, Leadership 7."]
    },
    draw: (v, W, H) => MAPS["the-raiders"](v, W, H),
    fit: () => [80, 80],
    mapNote: "All defending ships face the same edge. Capital ships may not form squadrons here. Tau ships sharing Gravity Hooks may be placed as a squadron, 15 cm apart.",
    steps: [
      { t: "Set up phenomena in any agreed way." },
      { s: "b", t: "Roll 3D6. For each 1–4 make one roll on the escort transport table, for each 5–6 one roll on the capital ship transport table. Orks and Tau roll once per die on their own table instead. Eldar skip this." },
      { s: "b", t: "For each heavy transport, fuel tanker and repair tender roll a D6: on 5–6 it is secretly a decoy, with no capacity and its weapon batteries replaced by as many lances. Write the decoys and Q-ships down." },
      { s: "b", t: "Deploy the whole fleet at least 30 cm from every table edge, all ships facing the same edge, each transport, capital ship or escort squadron at least 20 cm from the others." },
      { s: "a", t: "No deployment. You move on from one table edge in your first turn." },
      { s: "b", t: "Roll a D6 for the alert penalty (tool in Play)." },
      { s: "a", t: "The raiders take the first turn." }
    ],
    stools: [
      { k: "roll", id: "esc", l: "Escort transports", sub: "D6 for each 1–4 on the 3D6", rows: () => [[1, 2, "3 transports"], [3, 4, "3 armed freighters"], [5, 5, "2 transports + Q-ship"], [6, 6, "2 armed freighters + Q-ship"]] },
      { k: "roll", id: "cap", l: "Capital ship transports", sub: "D6 for each 5–6 on the 3D6", rows: () => [[1, 2, "Heavy transport"], [3, 4, "Fuel tanker"], [5, 5, "Repair tender"], [6, 6, "High conveyor"]] },
      { k: "roll", id: "ork", l: "Orks", sub: "D6 for each die of the 3D6", rows: () => [[1, 5, "3 transports"], [6, 6, "Ork Landa"]] },
      { k: "roll", id: "tau", l: "Tau", sub: "D6 for each die of the 3D6", rows: () => [[1, 4, "3 Tau transports"], [5, 6, "Merchant transport"]] }
    ],
    notes: ["The source gives only the raiders’ victory condition, so anything short of it is read as a win for the defender.", "Rolling a low Real Capacity can make the target out of reach. Then the raiders have to destroy every transport to win."],
    refs: [["Q-ships and decoys", BB(344)], ["Transport ships", BB("340–")], ["Victory points", "RB p. 122"]],
    play: [
      { w: "Turn 1", s: "a", t: "Move on from one table edge." },
      { w: "First D6 turns", s: "b", t: "All defending ships suffer −1 Leadership (reduced alert)." },
      { w: "Hidden ships", s: "b", t: "Q-ships and decoys look like the ship they stand in for until they fire or are fired on." },
      { w: "Leaving", s: "b", t: "Transports disengage only by moving off the table." },
      { w: "Capacity", t: "Q-ship and decoy 0. Transport, armed freighter, Tau or Eldar transport 1. Heavy transport, fuel tanker, repair tender, Ork Landa, Tau merchant 2. High conveyor 4." },
      { w: "Turn 8", t: "Last turn." }
    ],
    turnMax: () => 8,
    tools: [
      { k: "roll", id: "alert", l: "Defender alert penalty", sub: "D6 = number of turns at −1 Ld", rows: () => [[1, 1, "Turn 1"], [2, 2, "Turns 1–2"], [3, 3, "Turns 1–3"], [4, 4, "Turns 1–4"], [5, 5, "Turns 1–5"], [6, 6, "Turns 1–6"]] },
      { k: "counter", id: "tc", s: "a", l: "Target Capacity: every transport as it looks", res: 1 },
      { k: "counter", id: "rc", s: "b", l: "Real Capacity destroyed (the defender keeps this)", res: 1 }
    ],
    rtools: [{ k: "ending", id: "all", l: "Were all the transports destroyed?", rows: [["Yes", "a"], ["No", "b"]] }],
    end: ["After eight turns.", "Or when one fleet disengages."],
    win: ["The raiders win if the Real Capacity destroyed is more than half the Target Capacity.", "If that total cannot be reached, they win only by destroying every transport."],
    result(st) {
      const t = get(st, "tc", 0), r = get(st, "rc", 0);
      if (get(st, "all", -1) === 0) return ["a", wins("The raiders"), "Every transport was destroyed."];
      if (!t) return [null, "Battle in progress", "Enter the Target Capacity on the Play tab."];
      return r * 2 > t ? ["a", wins("The raiders"), r + " of a target " + t + "."] : [null, "The defender wins unless the raiders pass half", r + " of a target " + t + "."];
    },
    info: { bg: "The rulebook’s raid with the fleet replaced by a convoy and a shell game. Every hull has to be taken at face value until it opens fire.", cr: [CREDIT + " " + BB(63) + "."] }
  },
  /* ============================================================ DEFENSIVE RING */
  {
    id: "fan-b-ring", grp: "fan-bbgm", name: "Defensive Ring (BBGM)", series: "BBGM · raid", trust: "fan",
    why: "Escorts against a rolled base, with both fleets coming out of a random contact marker. Destroy the centre in six turns or lose.", src: BB(65), book: "O", suggest: null,
    others: "Written for any two fleets. The attacker needs escorts for at least half its points.",
    sides: { a: { n: "Attacker" }, b: { n: "Defender" } },
    pitch: "A fast squadron group jumps a dock or station with a small guard. Neither side knows until the dice fall where it will come from.",
    glance: [["Points", "Attacker 600 · Defender 300 + rolled defences"], ["Table", "Not given — use your table"], ["Battlezone", "Any, agreed"], ["First turn", "Attacker"], ["Game ends", "After 6 turns, the centre falls, or the attacker disengages"]],
    bring: ["An orbital dock or a space station", "6 numbered contact markers", "Orbital defences: rolled in Set-up"],
    forces: { a: ["600 pts in total, at least half of it in escort squadrons."], b: ["300 pts.", "Plus the central dock or station and three rolls on the defences tables."] },
    draw: (v, W, H) => { const cx = W / 2, cy = H / 2, m = (n, x, y) => ({ z: "mark", x: cx + x, y: cy + y, s: "c", l: String(n), free: 1 });
      return [{ z: "mark", x: cx, y: cy, s: "b", l: "Dock or station" }, m(1, -60, 0), m(2, -30, -52), m(3, 30, -52), m(4, 60, 0), m(5, 30, 52), m(6, -30, 52)]; },
    fit: () => [130, 115],
    legend: [["b", "The centre"], ["c", "Contact markers"]],
    mapNote: "Six numbered markers in a ring, each 60 cm from the centre and from its neighbours. Both fleets enter from a marker in their first turn, in any facing.",
    steps: [
      { t: "Set up phenomena in any agreed way." },
      { t: "Place the six numbered contact markers as on the map." },
      { s: "b", t: "Roll for the centre (tool below) and place it in the middle of the table." },
      { s: "b", t: "Make three rolls on the defences tables. Reroll anything over the limits: three defence monitors, two minefields, three orbital platforms of one kind." },
      { s: "b", t: "Place the defences no further than 15 cm from a phenomenon, or anywhere if there are none. Platforms may form a squadron with the centre." },
      { s: "a", t: "The attacker takes the first turn." }
    ],
    stools: [
      { k: "roll", id: "ctr", l: "The centre", sub: "D6", rows: () => [[1, 4, "Orbital dock"], [5, 6, "Space station"]] },
      { k: "roll", id: "t1", l: "Defences: first die", sub: "D6 for each of the three rolls", rows: () => [[1, 3, "Roll on Defences A"], [4, 6, "Roll on Defences B"]] },
      { k: "roll", id: "da", l: "Defences A", sub: "D6", rows: () => [[1, 3, "D3 orbital platforms: roll each below"], [4, 4, "D3 fireships"], [5, 5, "Defence monitor"], [6, 6, "Defence monitor + D3 fireships"]] },
      { k: "roll", id: "dp", l: "Orbital platform", sub: "D3, roll a D6", rows: () => [[1, 2, "Orbital defence weapons platform"], [3, 4, "Orbital defence laser platform"], [5, 6, "Orbital torpedo launcher"]] },
      { k: "roll", id: "db", l: "Defences B", sub: "D6", rows: () => [[1, 1, "Defender class system escort cruiser"], [2, 2, "Commander class system defence cruiser"], [3, 3, "Enforcer class system control cruiser"], [4, 6, "Minefield"]] }
    ],
    notes: ["The source does not say what happens if both fleets roll the same marker; here they simply both enter there.", "Only the attacker’s win is written down, so if the centre survives the defender is read as the winner.", "The library’s other Defensive Ring (Invasion p. 7) is a different game with equal points and victory points."],
    refs: [["Defences", BB("346–")], ["Space station", "FL p. 507"]],
    play: [
      { w: "Your first turn", t: "Roll a D6 (tool below). Your whole fleet enters from that marker, in any facing." },
      { w: "Turn 6", t: "Last turn." }
    ],
    turnMax: () => 6,
    tools: [{ k: "roll", id: "gate", l: "Entry marker", sub: "D6, one roll for each fleet", rows: () => [1, 2, 3, 4, 5, 6].map(n => [n, n, "Marker " + n]) }],
    rtools: [{ k: "ending", id: "ctrx", l: "The centre at the end", rows: [["Destroyed", "a"], ["Still there", "b"]] }],
    end: ["After six turns.", "Or when the centre is destroyed or the attacker disengages."],
    win: ["The attacker wins by destroying the central dock or station."],
    result(st) { const i = get(st, "ctrx", -1); return i === 0 ? ["a", wins("The attacker"), "The centre is destroyed."] : i === 1 ? ["b", wins("The defender"), "The centre still stands."] : [null, "Battle in progress", "Mark the centre on this tab."]; },
    info: { bg: "A fast raid on a fixed target, with the guard as uncertain of its approach as the attackers are.", cr: [CREDIT + " " + BB(65) + "."] }
  },
  /* ============================================================ PLANETARY ASSAULT */
  {
    id: "fan-b-assault", grp: "fan-bbgm", name: "Planetary Assault (BBGM)", series: "BBGM · battle", trust: "fan",
    why: "Transports start alone on the table and both fleets arrive on turn 2. Assault points depend on the ship type, and victory points do not count.", src: BB("78–79"), book: "O", suggest: null,
    others: "Written for any fleet list except Necrons as attacker. Tyranids take no transports, Rogue Traders buy their own.",
    sides: { a: { n: "Attacker" }, b: { n: "Defender" } },
    pitch: "The transports are already running for the planet when the fleets drop in behind them. The defender does not know where its own ships will come from.",
    glance: [["Points", "Equal + defences + rolled transports"], ["Table", "180 × 120 cm on the source’s map"], ["Battlezone", "Own table: a roll per high orbit zone"], ["First turn", "Attacker"], ["Game ends", "A fleet is gone, or the victory conditions are met"]],
    bring: ["Transports: rolled in Set-up", "Planetary defences", "A contact marker"],
    forces: {
      a: ["Equal points. Roll for transports for every 750 pts (or part), Leadership 6.", "A fleet with Drop Pod capital ships: only 3 transports per 1500 pts.", "Corsair, Craftworld and Dark Eldar: 3 of their own transports per 1500 pts, Leadership 7.", "Rogue Traders get none free. Tyranids take none. Necrons do not attack here."],
      b: ["Equal points.", "Roll randomly for defences, or spend an extra D6×10 pts on them for every 500 pts (or part)."]
    },
    draw: (v, W, H) => {
      const lo = Math.min(60, H / 2), zw = W / 6, zones = [0, 1, 2, 3, 4, 5].map(i => R(i * zw, lo, zw, Math.min(60, H - lo), "n", ""));
      const pt = (n, x) => ({ z: "mark", x, y: lo, s: "b", l: String(n), free: 1 });
      return [R(0, 0, W, lo, "n", "Low orbit: 60 cm"), { z: "edge", e: "t", s: "n", l: "Planet surface" }, ...zones,
        pt(5, 0), pt(1, 30), pt(2, 60), pt(3, W - 60), pt(4, W - 30), pt(6, W), R(0, H - 15, W, 15, "a", "Transports: 15 cm")];
    },
    fit: () => [180, 120], srcTable: [180, 120],
    legend: [["a", "Attacker’s transports"], ["b", "Defender’s arrival points"]],
    mapNote: "The long edge at the top is the planet. Six high orbit zones lie under the low orbit area, each 30 cm wide on the source’s map and shown here as a sixth of the table. Points 1–4 are spaced from the corners 5 and 6 in steps of 30 cm.",
    steps: [
      { t: "Nominate one long edge as the planet’s surface. The low orbit area reaches 60 cm from it: no phenomena there." },
      { t: "Roll on the phenomena table for each of the six high orbit zones." },
      { s: "a", t: "Roll for your transports for every 750 pts (or part)." },
      { s: "b", t: "Place only the planetary defences, within 15 cm of a phenomenon. The fleet stays off the table." },
      { s: "a", t: "Place the transports, Landas, Roks, Hulks and Warspheres within 15 cm of the edge opposite the planet. The rest of the fleet stays off the table." },
      { s: "a", t: "The attacker takes the first turn." }
    ],
    stools: [
      { k: "roll", id: "zone", l: "High orbit zone", sub: "D6 per zone", rows: () => [[1, 1, "Asteroid field"], [2, 3, "Gas and dust cloud"], [4, 5, "D3 gas and dust clouds"], [6, 6, "Moon"]] },
      { k: "roll", id: "tr", l: "Transports: Navy, AdMech, Inquisition, Chaos", sub: "D6 per 750 pts", rows: () => [[1, 3, "3 transports"], [4, 5, "Heavy transport"], [6, 6, "High conveyor"]] },
      { k: "roll", id: "tro", l: "Transports: Orks", sub: "D6 per 750 pts", rows: () => [[1, 4, "3 transports"], [5, 5, "Ork Landa"], [6, 6, "Ork Rok"]] },
      { k: "roll", id: "trt", l: "Transports: Tau", sub: "D6 per 750 pts", rows: () => [[1, 4, "3 Tau transports"], [5, 5, "Merchant transport"], [6, 6, "Kroot Warsphere (basic profile)"]] }
    ],
    notes: ["The text says the attacker wins with 6–10 assault points and the game ends when the victory conditions are met, while the result table separates 6–9 from 10. Agree before play whether the game stops at 6 or the attacker may keep going for 10.", "BBGM’s low orbit is part of the main table (p. 58), so no separate low orbit table is used."],
    refs: [["Fighting in low orbit", BB(58)], ["Defences", BB("346–")], ["Transport ships", BB("340–")]],
    fx: T => T === 1 ? [["a", "Move only the transports"], ["b", "Only your defences are on the table. At the end of your turn roll the arrival point (tool below)"]] : T === 2 ? [["a", "The fleet arrives from the long edge opposite the planet"], ["b", "The fleet arrives as rolled"]] : [],
    play: [
      { w: "Turn 2", s: "a", t: "The fleet arrives from the long edge opposite the planet." },
      { w: "Turn 2", s: "b", t: "On 1–4 the whole fleet arrives from the marker, facing away from low orbit in a 180° arc. On 5–6 you choose which ships arrive at point 5 and which at point 6, in a 90° arc facing away from the short edge and low orbit." },
      { w: "Landing", s: "a", t: "A unit that spends a full turn after its movement phase within 45 cm of the planet edge, doing nothing but falling, scores assault points (table below). It scores none if it moves, shoots, tries a special order, boards or teleports." },
      { w: "Low orbit", t: "No minimum move before turning, and a free 45° turn toward the planet. Firepower shifts one column right, nova cannon and lances need 4+ per point of Strength, no torpedoes except barrage bombs, silo and bomber torpedoes." },
      { w: "Low orbit", t: "Units inside and outside low orbit cannot target each other. Ordnance may enter but not leave. Ships within 45 cm of the planet edge fall at the start of their movement phase: small planet 5 cm, medium 8 cm, large 10 cm." },
      { w: "The planet edge", t: "A ship that falls over it is destroyed. Escorts and transports may leave over it on purpose: they have landed. Capital ships cannot land. Disengaging by Leadership test in low orbit is at −1." }
    ],
    tools: [
      { k: "roll", id: "pt", l: "Defender’s arrival point", sub: "D6 at the end of the defender’s first turn", rows: () => [[1, 4, "Place a contact marker at that numbered point"], [5, 6, "No marker: the fleet arrives at points 5 and 6"]] },
      { k: "info", html: () => "<h3>Assault points</h3><table class='ltab'>" + [["Capital ship (not a transport)", "1 once"], ["Transport", "1 per turn"], ["Heavy transport, Tau merchant", "2 per turn (1 if crippled)"], ["High conveyor", "4 per turn (2 if crippled)"], ["Ship with Drop Pods", "2 per turn (1 if crippled)"], ["Kroot Warsphere", "4 per turn if landed"], ["Ork Landa", "2 per turn (1 if crippled); 4 once if landed"], ["Ork Rok", "4 per turn; 6 once if landed"], ["Ork Hulk", "10 once landed"], ["Tyranid Cyst Spore", "1 once"], ["Tyranid Bomber", "1 once if landed"]].map(r => "<tr><td>" + r[0] + "</td><td>" + r[1] + "</td></tr>").join("") + "</table>" },
      { k: "counter", id: "ap", l: "Assault points", s: "a", goal: 10, res: 1 }
    ],
    end: ["One fleet is destroyed or disengaged.", "Or the victory conditions are met."],
    win: ["The attacker wins with 6 or more assault points, or if the defender’s fleet is gone while the attacker can still reach 6.", "The defender wins if the attacker’s fleet is gone, or if the ships it has left cannot reach 6.", "0–1: defender’s victory. 2–5: defender’s marginal win. 6–9: attacker’s marginal win. 10: attacker’s victory."],
    result(st) { const t = get(st, "ap", 0), r = t >= 10 ? ["a", "Attacker’s victory"] : t >= 6 ? ["a", "Attacker’s marginal win"] : t >= 2 ? ["b", "Defender’s marginal win"] : ["b", "Defender’s victory"]; return [r[0], r[1], t + " assault points."]; },
    info: { bg: "The same landing as the rulebook’s, played as a race: the transports are first through, and each kind of ship lands troops in its own way.", cr: [CREDIT + " " + BB("78–79") + "."] }
  }
  ]);

  /* ---- BBGM's versions of scenarios already here: a Version switch on the existing card, with its first version unchanged */
  const SRC = (p, why, bg) => ({ trust: "fan", book: "O", src: BB(p), why, info: { bg, cr: [CREDIT + " " + BB(p) + "."] } });
  addVariant("escalating-engagement", "Rulebook v1.11", {
    source: SRC(74, "BBGM’s version: no arrival roll, so every division reaches the table on schedule.", "The rulebook’s battle without the wait: reinforcements always come in the turn after their marker goes down."),
    glance: [["Points", "Equal; each fleet in 5 divisions"], ["Table", "Not given — use your table"], ["Battlezone", "Any, agreed"], ["First turn", "Roll-off after deployment"], ["Game ends", "A fleet disengages or is destroyed"]],
    keep: { steps: "all", tools: ["edge", "offa", "offb"] },
    play: [
      { w: "End phase of your turn", t: "Draw another of your markers at random and place it along a random table edge (tool below): not within 60 cm of enemy ships, and if you have ships within 30 cm of that edge, within 30 cm of them regardless. If enemy ships leave no room, put it in a corner of that edge." },
      { w: "Start of your turn", t: "No roll: bring on the ships of the marker already on the edge." }
    ],
    fx: () => [[null, "Start of your turn: the waiting division arrives. End phase: a new marker"]],
    notes: ["The source does not repeat how far from the marker the division may enter; the rulebook’s 10 cm is the natural reading.", "With no arrival roll, the Tyranid arrival bonus (FL p. 428) has nothing to add to."],
    end: ["One fleet disengages or is destroyed."],
    win: ["Both fleets score victory points as normal. The higher total wins."]
  });
  addVariant("blockade-run", "Rulebook v1.11", {
    source: SRC(70, "BBGM’s version: fixed points at 4:3 instead of 2:1, half the reward for getting through, and two more turns.", "The same run at the blockade with a stronger force and a smaller prize for each ship that makes it."),
    glance: [["Points", "Blockade 1000 · Runners 750"], ["Table", "Not given — use your table"], ["Battlezone", "Outer Reaches or Deep Space"], ["First turn", "Roll-off, winner chooses"], ["Game ends", "After 8 turns, or a fleet is destroyed or disengages"]],
    forces: { a: ["Up to 750 pts."], b: ["Up to 1000 pts."] },
    keep: { stools: ["third"] },
    steps: [
      { t: "Battlezone: Outer Reaches or Deep Space." },
      { t: "Divide the table lengthways into three equal parts (map)." },
      { s: "b", t: "Roll a D6 for each ship or squadron to see which third it goes in (tool below). Any facing, but not within 60 cm of the runners’ table edge." },
      { s: "a", t: "Deploy within 15 cm of your table edge." },
      { t: "Roll off. The winner chooses to go first or second." }
    ],
    play: [
      { w: "All game", s: "a", t: "Ships that leave over the blockade’s edge score half their points value as victory points; crippled ships a quarter. They count as disengaged for the blockade’s victory points." },
      { w: "Turn 8", t: "Last turn." }
    ],
    turnMax: 8, fx: T => T === 8 ? [[null, "Last turn"]] : [],
    end: ["After eight turns.", "Or when one fleet is destroyed or disengages."],
    win: ["Victory points as normal, plus the runners’ score for ships that got through. Most victory points wins."]
  });
  addVariant("the-bait", "Rulebook v1.11", {
    source: SRC(72, "BBGM’s version: bigger fleets, and every reinforcement that enters pays the pursued side at once.", "The rulebook’s trap at a larger size. Springing it early is now worth points in itself."),
    glance: [["Points", "Pursued 1000 · Pursuers 750"], ["Table", "Not given — use your table"], ["Battlezone", "D6: 1–3 Outer Reaches, 4–6 Deep Space"], ["First turn", "D6: 6 pursuers, 1–5 pursued"], ["Game ends", "A fleet is gone, or after 8 turns"]],
    forces: { a: ["Up to 1000 pts. The flagship starts on the table.", "Everything else waits off the table as reinforcements."], b: ["Up to 750 pts."] },
    steps: [
      { t: "Battlezone: Outer Reaches or Deep Space. With a generator roll a D6: 1–3 Outer Reaches, 4–6 Deep Space." },
      { s: "a", t: "Place your flagship in the centre of the table, facing one short edge." },
      { s: "b", t: "Deploy along the short edge behind it, 60 cm or more away." },
      { s: "a", t: "Keep the rest off the table. It enters from the edge in front of the flagship." },
      { s: "a", t: "Roll a D6 for the first turn: on a 6 the pursuers go first, on 1–5 you do." }
    ],
    keep: { play: "all", tools: "all" },
    play: [{ w: "A reinforcement enters", s: "a", t: "Each ship or squadron scores 25% of its victory points value at once, on top of the usual count at the end." }],
    tools: [{ k: "num", id: "reinf25", l: "Victory points value of reinforcements that entered", s: "a", after: v => "Pursued side’s bonus: <b>" + v * 0.25 + " VP</b>" }],
    turnMax: 8,
    end: ["One fleet is destroyed or disengages.", "Or after eight turns."],
    win: ["Standard victory points for ships crippled or destroyed, plus the pursued side’s 25%. Most points wins."],
    result(st) { return [null, "Count victory points", "Pursued side’s bonus from reinforcements: " + num(st, "reinf25") * 0.25 + " VP."]; }
  });
  addVariant("cl-inv-retrieval", "Invasion", {
    source: SRC(71, "BBGM’s version: whoever carries the artifact cannot run, and there is a way to hide the number with only two players.", "The same search among the derelicts, except that holding the artifact pins its carrier to the table."),
    glance: [["Points", "Up to 1000 each"], ["Table", "Not given — use your table"], ["Battlezone", "Six numbered derelicts + phenomena"], ["First turn", "Roll-off"], ["Game ends", "After 6 turns, or a fleet is gone"]],
    forces: { a: ["Up to 1000 pts."], b: ["Up to 1000 pts."] },
    draw: (W, H) => [[.18, .3], [.42, .24], [.7, .3], [.3, .84], [.58, .8], [.84, .84]].map(([x, y]) => ({ z: "mark", x: W * x, y: H * y, s: "n", l: "?", free: 1 })).concat([{ z: "text", x: W / 2, y: H / 2, l: "derelicts: 30 cm apart" }]),
    mapNote: "An example only: the six derelicts go anywhere, placed blind, at least 30 cm from each other and from the table edges. Ships may then set up anywhere, more than 60 cm from enemy ships.",
    steps: [
      { t: "Set up phenomena in any agreed way." },
      { t: "Number six derelicts (or counters) 1–6 underneath. Take turns placing them face down: at least 30 cm from each other and from the table edges." },
      { t: "Have a neutral person roll the artifact’s number. With nobody to do it, use the shrinking die under Play instead." },
      { t: "Each player rolls a D6. The higher roll places a ship or squadron first, anywhere on the table; take turns. Keep squadrons within 30 cm between their furthest ships, and no ship within 60 cm of an enemy ship." },
      { t: "Both roll a D6. The higher roll chooses to go first or second." }
    ],
    keep: { stools: ["art"], tools: "all" },
    play: [
      { w: "Searching", t: "A ship that moves within 5 cm of a derelict turns it over. If its number is the right one, that ship carries the artifact." },
      { w: "With two players", t: "Roll when a derelict is revealed: a D6 for the first, a D5 for the next and so on (D10 halved, or reroll the sixes). A 1 finds the artifact." },
      { w: "Stealing", t: "Reduce the carrier to a hulk and move within 5 cm of it, or win a boarding action against it." },
      { w: "Passing it on", t: "A ship within 5 cm of the carrier may take the artifact over, once per turn." },
      { w: "Carrying it", t: "A ship or escort squadron with the artifact cannot disengage willingly in any way. If it moves off the table anyway, the artifact drops where it left." }
    ],
    turnMax: 6, fx: T => T === 6 ? [[null, "Last turn: who holds the artifact?"]] : [],
    end: ["After six turns, or when a fleet is destroyed or disengages."],
    win: ["The fleet holding the artifact at the end wins.", "If neither holds it, it is a draw."]
  });
  addVariant("exterminatus", "Rulebook v1.11", {
    source: SRC(75, "BBGM’s version: low orbit is part of the table, and the weapon needs the planet in its prow arc.", "The rulebook’s race for the planet with its low orbit moved onto the main table, so the escort has to follow the Exterminators in."),
    noLowTable: 1,
    glance: [["Points", "Equal + Exterminators + defences"], ["Table", "Not given — use your table"], ["Battlezone", "Primary or inner biosphere, low orbit on the table"], ["First turn", "Roll-off, winner chooses"], ["Game ends", "Planet dies, Exterminators gone, or a fleet disengages"]],
    bring: ["Planetary defences"],
    forces: {
      a: ["Equal points.", "One Exterminator for every 1000 pts (or part): nominate a capital ship with a prow weapon. One prow armament becomes an Armageddon weapon usable only against the planet."],
      b: ["Equal points.", "Roll randomly for planetary defences, or spend an extra D6×10 pts on them for every 500 pts (or part).", "You may also move up to 25% of the fleet’s points to more defences.", "One capital ship or escort squadron per 500 pts (or part) is on patrol, off the table at the start."]
    },
    draw: (W, H) => { const lo = Math.min(60, W / 2); return [R(W - lo, 0, lo, H, "n", "Low orbit: 60 cm"), { z: "edge", e: "r", s: "n", l: "Planet surface" }, R(30, 30, Math.max(5, W - lo - 30), H - 60, "b", "Defender: 30 cm+ from edges"), R(0, 0, 15, H, "a", "Attacker: 15 cm", { rot: -90 })]; },
    mapNote: "One short edge is the planet’s surface and low orbit reaches 60 cm from it, on the main table. The defender stays out of low orbit and at least 30 cm from the table edges.",
    keep: { stools: ["psize"], tools: ["pat"], rtools: "all" },
    steps: [
      { t: "Nominate one short edge as the planet’s surface. Low orbit reaches 60 cm from it. Roll the planet’s size (D6: 1 small, 2–5 medium, 6 large) for rings or moons." },
      { t: "Roll phenomena as usual, none in low orbit. Reroll any planets." },
      { s: "a", t: "Nominate your Exterminators: one per 1000 pts (or part)." },
      { s: "b", t: "Put one capital ship or escort squadron per 500 pts (or part) aside on patrol. Deploy the rest facing the enemy, at least 30 cm from every table edge and outside low orbit." },
      { s: "b", t: "Place the defences within 15 cm of a phenomenon, or anywhere in your zone if there are none." },
      { s: "a", t: "Deploy the whole fleet within 15 cm of the short edge furthest from the planet." },
      { t: "Roll off. The higher roll chooses to go first or second." }
    ],
    notes: ["BBGM’s low orbit is part of the main table (p. 58), so no separate low orbit table is used. Fleet rules shown for this card come from the Fleets book and assume the rulebook’s version."],
    refs: [["Fighting in low orbit", BB(58)], ["Defences", BB("346–")]],
    play: [
      { w: "Start of each turn", s: "a", t: "Roll a D6 for each Exterminator within 45 cm of the planet edge with the planet in its prow arc: on 4+ the planet dies. Not while it has unrepaired prow critical damage." },
      { w: "Start of your turn", s: "b", t: "Roll a D6 for each capital ship and escort squadron on patrol (tool below). Edges beside low orbit count as arriving around the planet. If the planet’s edge is rolled, choose one of the other three." },
      { w: "Shooting", s: "b", t: "All your units except ground ones may always target an Exterminator, even in a squadron; no Leadership test even if it is not the closest." },
      { w: "Low orbit", t: "No minimum move before turning, and a free 45° turn toward the planet. Firepower shifts one column right, nova cannon and lances need 4+ per point of Strength, no torpedoes except barrage bombs, silo and bomber torpedoes." },
      { w: "Low orbit", t: "Units inside and outside low orbit cannot target each other. Ordnance may enter but not leave. Ships within 45 cm of the planet edge fall at the start of their movement phase: small planet 5 cm, medium 8 cm, large 10 cm." },
      { w: "The planet edge", t: "A ship that falls over it is destroyed. Escorts and transports may leave over it on purpose: they have landed. Capital ships cannot land. Disengaging by Leadership test in low orbit is at −1." }
    ],
    fx: () => [["a", "Start of turn: D6 per Exterminator within 45 cm with the planet in its prow arc, 4+ destroys the planet"], ["b", "Start of your turn: patrol arrival rolls"]],
    end: ["One fleet disengages.", "All the attacker’s Exterminators are destroyed.", "An Exterminator destroys the planet."],
    win: ["A fleet that disengages loses.", "All Exterminators destroyed: the defender wins.", "The planet destroyed: the attacker wins."]
  });
  addNote("the-raiders", "BBGM has a different scenario on this opening, a raid on hidden transports: see Raiders (BBGM).");
  addNote("cl-inv-ring", "BBGM has a different scenario of this name, an escort raid from random markers: see Defensive Ring (BBGM).");
  addNote("planetary-assault", "BBGM has a different scenario of this name, with both fleets arriving on turn 2: see Planetary Assault (BBGM).");
})();
