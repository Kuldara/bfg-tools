/* Fan supplements: BBGM (1.11.2026). A compilation of house rules, FAQs and errata by Bear, BinExis, DarthGoogle and
   Mazilka, version May 2026, built on the original rules and FAQ 2007 rather than on Remastered. Its scenario chapter
   (p. 60-80) prints 14 of the "fifteen" scenarios it announces; ten are versions of scenarios already here under the
   same name. Only the four that are new are added: Points of Interest (p. 64), Chance Encounter (p. 68-69), Star Fort
   Assault (p. 73) and Patrol War (p. 80). Page numbers are PDF pages, which are the printed ones. Summarised in our own
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
  }
  ]);
})();
