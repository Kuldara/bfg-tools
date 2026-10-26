/* 13th Black Crusade campaign scenarios — Rulebook v1.10 p. 191–199.
   First published in Battlefleet Gothic: Armada (Games Workshop, 2004).
   Summarised in our own words; every scenario is hand-made (see docs/history/scenarios/LUEMINUT.md, in Finnish). */
(function () {
  const BC_CREDIT = "First published in Battlefleet Gothic: Armada (Games Workshop, 2004), 13th Black Crusade campaign.";
  const ORDER = "Forces of Order", DISORDER = "Forces of Disorder";
  const sunEntry = t => {
    const d = Math.max(0, t - 1) * 30;
    return "<h3>Reinforcement entry, turn " + t + "</h3><p class='calc'>" + (d === 0 ? "Only from the <b>sunward edge</b>." :
      d >= tableWH()[0] ? "From the <b>sunward edge</b>, or <b>anywhere</b> along either long edge." :
      "From the <b>sunward edge</b>, or up to <b>" + d + " cm</b> along either long edge from that end.") + "</p>";
  };
  const alertInfo = (st, side) => {
    const n = get(st, "alert", 0);
    return "<h3>" + side + " Leadership now</h3><p class='calc'>" + (!n ? "Roll the ambush penalty above." : st.turn <= n ? "Turn " + st.turn + ": <b>−1 Leadership</b> (until the end of turn " + n + ")." : "Turn " + st.turn + ": the penalty is over.") + "</p>";
  };
  const ALERT_ROWS = () => [[1, 1, "Turn 1"], [2, 2, "Turns 1–2"], [3, 3, "Turns 1–3"], [4, 4, "Turns 1–4"], [5, 5, "Turns 1–5"], [6, 6, "Turns 1–6"]];

  addScenarios([
  /* ------------------------------------------------------------ 1 CHANCE ENCOUNTER */
  {
    id: "bc-chance-encounter", grp: "campaign", name: "Chance Encounter", series: "13th Black Crusade · Scenario One", trust: "rulebook",
    why: "Official campaign scenario with fixed fleets.", src: "RB p. 191", book: "K", suggest: ["Imperial Navy", "Chaos"],
    others: "Fixed fleets. Other fleets can stand in with the same shape: a battleship-sized flagship, two cruisers and three escorts against a battlecruiser, two cruisers and four escorts.",
    sides: { a: { n: "Patrol", f: "Imperial Navy" }, b: { n: "Planet Killer fleet", f: "Chaos" } },
    pitch: "The Planet Killer is heading for Cadia. A small Imperial patrol has six turns to stop it — or at least hurt it.",
    glance: [["Points", "Fixed fleets"], ["Table", "180 × 120 cm"], ["Battlezone", "Any phenomena you like"], ["First turn", "Patrol chooses"], ["Game ends", "After 6 turns"]],
    bring: ["The Planet Killer (FL p. 252)", "Fixed fleets below"],
    forces: {
      a: ["Mars class battlecruiser with an Admiral (Ld 9, 2 re-rolls).", "One Tyrant class cruiser and one Gothic class cruiser.", "A squadron of four Cobra destroyers."],
      b: ["The Planet Killer (FL p. 252) with a Chaos Warmaster (Ld 9, 3 re-rolls).", "One Devastation class cruiser and one Slaughter class cruiser.", "A squadron of three Iconoclast destroyers."]
    },
    draw: (v, W, H) => [
      R(W / 2 - 30, 0, 60, 30, "b", ""), { z: "mark", x: W / 2, y: 10, s: "b", l: "" },
      { z: "text", x: W / 2, y: 22, l: "Chaos zone 60 × 30 cm", s: "b" },
      R(0, H - 30, W, 30, "a", "Patrol: whole long edge, 30 cm"),
      { z: "edge", e: "b", s: "b", l: "Chaos exit: Planet Killer + 1 capital ship" }
    ],
    fit: () => [70, 70], srcTable: [180, 120],
    mapNote: "The Planet Killer starts on the centre line of the Chaos edge, 10 cm in. Zones as on the rulebook map.",
    steps: [
      { t: "Set up a 180 × 120 cm table with any celestial phenomena you like." },
      { s: "b", t: "Place the Planet Killer on the centre line of your long edge, 10 cm in from the edge." },
      { t: "Take turns placing one cruiser or one escort squadron at a time in your own zone, up to 30 cm from your edge, until everything is down." },
      { s: "a", t: "The patrol chooses to go first or second." }
    ],
    refs: [["The Planet Killer", "FL p. 252"], ["Mars class battlecruiser", "FL p. 35"]],
    play: [
      { w: "Patrol, all game", s: "a", t: "You cannot hope to win the war here — slow the fleet down. Destroying the Planet Killer is a major victory, crippling it a minor one." },
      { w: "Chaos, all game", s: "b", t: "Get the Planet Killer and one more capital ship off the opposite long edge (the patrol’s edge) while the Planet Killer is not crippled." },
      { w: "Turn 6", t: "Last turn." }
    ],
    turnMax: () => 6,
    fx: T => T === 6 ? [[null, "Last turn"]] : [],
    tools: [{ k: "counter", id: "esc", l: "Chaos capital ships off the patrol’s edge", s: "b", res: 1 }],
    end: ["After six turns."],
    win: ["Planet Killer destroyed: major victory for the patrol.", "Planet Killer crippled: minor victory for the patrol.", "Planet Killer and one other Chaos capital ship off the opposite edge (Planet Killer not crippled): Chaos victory."],
    notes: ["The book names no winner if none of the three things happens in six turns — agree before play (for example, compare victory points)."],
    rtools: [{ k: "ending", id: "how", l: "How did it end?", rows: [["Planet Killer destroyed — major victory", "a"], ["Planet Killer crippled — minor victory", "a"], ["Planet Killer and another capital ship escaped", "b"], ["None of these after six turns", "draw"]] }],
    result(st, v, S) { return endingResult(st, S, "how"); },
    info: { bg: "A Chaos fleet led by the Planet Killer is on its way to join Typhus and his plague fleet at Cadia. An Imperial patrol spots it and turns to intercept: it cannot stop the fleet, but every hour it buys helps Cadia’s defenders.", cr: [BC_CREDIT, RB_CREDIT + " p. 191.", GW_CREDIT] }
  },
  /* ------------------------------------------------------------ 2 REARGUARD ATTACK */
  {
    id: "bc-rearguard-attack", grp: "campaign", name: "Rearguard Attack", series: "13th Black Crusade · Scenario Two", trust: "rulebook",
    why: "Official campaign scenario — The Raiders with reinforcements for the defender.", src: "RB p. 192", book: "K", suggest: ["Imperial Navy", "Chaos"],
    others: "Any fleets: a small strike force against a larger rearguard. Order and Disorder are the campaign’s two sides.",
    sides: { a: { n: ORDER, f: "Imperial Navy" }, b: { n: DISORDER, f: "Chaos" } },
    pitch: "Small Imperial patrols slip through jammer mines to maul the Chaos rearguard before it can recover.",
    glance: [["Points", "Disorder: agreed (25% in reserve) · Order: half"], ["Table", "180 × 120 cm"], ["Battlezone", "Any phenomena you like"], ["First turn", "Forces of Order"], ["Game ends", "8 turns, or a fleet disengages"]],
    bring: ["Sunward edge marker", "A D6 for the ambush penalty"],
    forces: {
      a: ["Attacker. Up to half the agreed points limit."],
      b: ["Defender. Up to the agreed points limit.", "Set 25% of the fleet aside as reinforcements."]
    },
    draw: (v, W, H) => [
      { z: "sun", e: "l" },
      R(60, 30, W - 60, H - 60, "b", "Disorder: 60 cm+ from the sunward edge,\n30 cm+ from the long edges, facing the sun"),
      { z: "arrow", x1: W - 30, y1: H / 2 + 14, x2: W - 50, y2: H / 2 + 14, s: "b" },
      { z: "dim", x1: 0, y1: H - 22, x2: 60, y2: H - 22, l: "60 cm" },
      { z: "tick", e: "t", list: [[30, "T2"], [60, "T3"], [90, "T4"]] }, { z: "tick", e: "b", list: [[30, "T2"], [60, "T3"], [90, "T4"]] },
      ...EDGES4("a", "Order enters from any edge")
    ],
    fit: () => [100, 80], srcTable: [180, 120],
    mapNote: "Left = sunward edge. Disorder reinforcements enter there; from turn 2 also along the long edges, 30 cm further each turn.",
    steps: [
      { t: "Agree a points limit. Set up a 180 × 120 cm table with any phenomena you like and pick the sunward short edge." },
      { s: "b", t: "Set 25% of your fleet aside as reinforcements." },
      { s: "b", t: "Deploy the rest: all facing the sunward edge, at least 30 cm from both long edges and 60 cm from the sunward edge, each ship or squadron at least 10 cm from the others." },
      { s: "b", t: "Roll a D6 for the ambush: your ships are at −1 Leadership for that many turns (tool in Play)." },
      { s: "a", t: "No deployment. You move on from any table edge in your first turn, and you go first." }
    ],
    notes: ["The book does not say when to roll the D6 for the ambush penalty; rolling before the first turn is the natural reading."],
    refs: [["The Raiders (the scenario it builds on)", "RB p. 131"], ["Victory points", "RB p. 122"]],
    play: [
      { w: "Turn 1", s: "a", t: "Move on from any table edge." },
      { w: "Ambushed", s: "b", t: "All your ships are at −1 Leadership for the first D6 turns." },
      { w: "Any turn", s: "b", t: "Reinforcements may enter from the sunward edge, turn 1 included; from turn 2 also along the long edges (tool below)." },
      { w: "Turn 8", t: "Last turn." }
    ],
    turnMax: () => 8,
    fx: (T, st) => {
      const n = get(st, "alert", 0), o = [];
      if (!n && T === 1) o.push(["b", "Roll the ambush penalty (D6) — tool below"]);
      if (n && T <= n) o.push(["b", "At −1 Leadership (ambushed, turns 1–" + n + ")"]);
      o.push(["b", T === 1 ? "Reinforcements: sunward edge only" : (T - 1) * 30 >= tableWH()[0] ? "Reinforcements: sunward edge, or anywhere along the long edges" : "Reinforcements: sunward edge, or up to " + (T - 1) * 30 + " cm along the long edges"]);
      if (T === 8) o.push([null, "Last turn"]);
      return o;
    },
    tools: [
      { k: "roll", id: "alert", l: "Ambush penalty", sub: "D6 = number of turns at −1 Ld", rows: ALERT_ROWS },
      { k: "info", html: st => alertInfo(st, DISORDER) },
      { k: "info", html: st => sunEntry(st.turn) }
    ],
    end: ["After eight turns.", "Or when one fleet disengages."],
    win: ["Both fleets score standard victory points (RB p. 122). The higher total wins."],
    result() { return [null, "Count victory points", "Standard victory points, RB p. 122."]; },
    info: { bg: "Imperial forces across the sector split into small patrols to strike the Chaos rearguard while jammer mines blind its sensors. If they do enough damage, the rearguard fleets will be out of action long enough for the systems ahead to prepare.", cr: [BC_CREDIT, RB_CREDIT + " p. 192.", GW_CREDIT] }
  },
  /* ------------------------------------------------------------ 3 ALIEN INTERVENTION */
  {
    id: "bc-alien-intervention", grp: "campaign", name: "Alien Intervention", series: "13th Black Crusade · Scenario Three", trust: "rulebook",
    why: "Official campaign scenario. The Eldar reinforcements can be played by a third player.", src: "RB p. 193", book: "K", suggest: ["Imperial Navy", "Chaos", "Craftworld Eldar"],
    players: 3,
    others: "Any fleets: a defender who falls into a trap, a stronger attacker, and an allied reinforcement fleet (25%) from a different list that arrives at random.",
    sides: { a: { n: ORDER, f: "Imperial Navy" }, b: { n: DISORDER, f: "Chaos" }, c: { n: "Eldar reinforcements", f: "Eldar (25% of Order)" } },
    pitch: "An Imperial strike force flies into a Chaos trap around a space hulk — until Eldar ships appear on the sensors.",
    glance: [["Points", "Disorder: agreed · Order: 75% + 25% Eldar"], ["Table", "180 × 120 cm"], ["Battlezone", "Planet and drifting hulk near the centre"], ["First turn", "Disorder 2D6 vs Order D6"], ["Game ends", "8 turns, or one fleet left"]],
    bring: ["A planet", "A drifting hulk", "An Eldar fleet (25% of Order’s points)"],
    forces: {
      a: ["Defender. Up to 75% of the agreed points.", "The other 25% is an Eldar fleet arriving as reinforcements — ideal for a third player."],
      b: ["Attacker. Up to the agreed points limit."],
      c: ["25% of the agreed points, chosen from the Eldar list.", "Arrives at random from turn 2 (tool in Play)."]
    },
    draw: (v, W, H) => [
      R(W / 2 - 30, 0, 60, H, "a", ""), { z: "text", x: W / 2, y: 18, l: "Order:\n30 cm from\ncentre line", s: "a" },
      /* the planet and the hulk may be anywhere within 30 cm of the centre: an area, not fixed places (0.9.3) */
      { z: "circ", cx: W / 2, cy: H / 2, r: 30, s: "n", l: "" }, { z: "text", x: W / 2, y: H / 2 + 1, l: "planet + hulk:\nwithin 30 cm\nof the centre", s: "n" },
      { z: "planet", cx: W / 2 + 17, cy: H / 2 - 23, r: 6, l: "", free: 1 }, { z: "mark", x: W / 2 - 13, y: H / 2 + 23, s: "n", l: "", free: 1 },
      R(0, 0, 20, H, "b", "Disorder: 20 cm", { rot: -90 }), R(W - 20, 0, 20, H, "b", "or 20 cm", { rot: 90 }),
      { z: "edge", e: "t", s: "c", dash: 1, l: "Eldar arrive from a long edge" }, { z: "edge", e: "b", s: "c", dash: 1, l: "" }
    ],
    fit: () => [120, 60], srcTable: [180, 120],
    mapNote: "Planet and hulk go anywhere within 30 cm of the table centre. Disorder sets up at either short edge.",
    steps: [
      { t: "Agree a points limit. Set up a 180 × 120 cm table with any phenomena you like, plus one planet and a drifting hulk anywhere within 30 cm of the centre." },
      { s: "a", t: "Deploy the whole fleet within 30 cm of the table centre line, each ship or squadron at least 10 cm from the others, all facing the same way." },
      { s: "c", t: "Stay off the table: the Eldar arrive from turn 2." },
      { s: "b", t: "Deploy the whole fleet within 20 cm of either short edge." },
      { t: "Disorder rolls 2D6, Order rolls a D6. The higher roll chooses who goes first." }
    ],
    notes: ["“Either short table edge” is read as Disorder choosing one of the two; the book does not say whether the fleet may be split between them — agree before play.", "“The table centre line” is read as the line halfway between the short edges, since Disorder starts at the short edges."],
    refs: [["Drifting hulks and planets", "RB p. 104–116"], ["Victory points", "RB p. 122"]],
    play: [
      { w: "From Order’s turn 2", s: "c", t: "Roll a D6 at the start of each Order turn until the Eldar arrive: turn 2 on 4+, turn 3 on 3+, turns 4–5 on 2+, turn 6 automatically. The whole Eldar fleet enters from one long edge." },
      { w: "Turn 8", t: "Last turn." }
    ],
    turnMax: () => 8,
    fx: (T, st) => {
      const o = [];
      if (!get(st, "eld", false)) { const need = { 2: "4+", 3: "3+", 4: "2+", 5: "2+", 6: "automatic" }[T]; if (need) o.push(["c", "Eldar arrival roll: " + need]); }
      if (T === 8) o.push([null, "Last turn"]);
      return o;
    },
    tools: [
      { k: "pick", id: "eldtab", l: "Eldar arrival — Order’s turn", rows: [["Turn 2", "4+"], ["Turn 3", "3+"], ["Turn 4", "2+"], ["Turn 5", "2+"], ["Turn 6", "Automatic"]], foot: "D6 at the start of the Forces of Order turn." },
      { k: "toggle", id: "eld", l: "The Eldar have arrived", s: "c" }
    ],
    end: ["After eight turns.", "Or when only one side has ships left on the table."],
    win: ["Both sides score standard victory points (RB p. 122). The higher total wins."],
    result() { return [null, "Count victory points", "Standard victory points, RB p. 122."]; },
    info: { bg: "A Chaos fleet thought to have left the Chinchare sector is found raiding a space hulk near Van Sele’s World. The Imperial force sent to crush it is spotted on the way and flies into a trap — until faint traces of Eldar ships appear on its sensors.", cr: [BC_CREDIT, RB_CREDIT + " p. 193.", GW_CREDIT] }
  },
  /* ------------------------------------------------------------ 4 ABOVE BELIS CORONA */
  {
    id: "bc-above-belis-corona", grp: "campaign", name: "Above Belis Corona", series: "13th Black Crusade · Scenario Four", trust: "rulebook",
    why: "Official campaign scenario: a raid on a fortified world.", src: "RB p. 194–195", book: "K", suggest: ["Chaos", "Imperial Navy"],
    others: "Any attacker; the defender needs planetary defences (FL p. 507–515), which any fleet may use.",
    sides: { a: { n: ORDER, f: "Imperial Navy" }, b: { n: DISORDER, f: "Chaos" } },
    pitch: "A Chaos raid on the orbital docks of Belis Corona. Every station, the dock and the inner platforms must fall — and a quarter of the reinforcements with them.",
    glance: [["Points", "Disorder 1500 · Order 750 + defences"], ["Table", "180 × 120 cm"], ["Battlezone", "Planet in the centre, 30 cm gravity well"], ["First turn", "Disorder 2D6 vs Order D6"], ["Game ends", "After 8 turns"]],
    bring: ["Planet Belis Corona", "2 space stations, 1 orbital dock", "8 orbital platforms (4 outer, 4 inner)", "8 orbital mines, 2 system ships, 1 defence monitor", "2 asteroid fields"],
    forces: {
      a: ["Defender. 750 pts, no battleships, plus one free extra re-roll. This fleet starts in reserve.", "Also: 2 space stations, 1 orbital dock, 8 orbital mines, 2 system ships and 1 defence monitor (FL p. 507–515).", "Eight platforms of your choice — orbital defence laser platforms, orbital torpedo launchers, orbital weapons platforms — split into four outer and four inner."],
      b: ["Attacker. 1500 pts, split into two halves as equal in points as possible."]
    },
    draw: (v, W, H) => [
      { z: "circ", cx: W / 2, cy: H / 2, r: 30, s: "a", l: "" }, { z: "planet", cx: W / 2, cy: H / 2, r: 9, l: "" },
      { z: "text", x: W / 2, y: H / 2 - 36, l: "gravity well 30 cm: dock, stations,\ninner platforms, mines", s: "a" },
      R(0, 0, 10, H, "b", "Disorder half A: 10 cm", { rot: -90 }), R(W - 10, 0, 10, H, "b", "half B: 10 cm", { rot: 90 }),
      { z: "edge", e: "b", s: "a", dash: 1, l: "Order reinforcements: a long edge (see note)" }
    ],
    fit: () => [100, 80], srcTable: [180, 120],
    mapNote: "Outer platforms go anywhere on the table. Each player adds an asteroid field at least 30 cm from the planet.",
    steps: [
      { t: "Set up a 180 × 120 cm table. Place Belis Corona in the dead centre; its gravity well reaches 30 cm. Each player places an asteroid field at least 30 cm from the planet." },
      { s: "a", t: "Place the orbital dock and both space stations in the gravity well, then the four outer platforms anywhere on the table." },
      { s: "b", t: "Place one half of your fleet within 10 cm of a short edge and the other half within 10 cm of the opposite short edge." },
      { s: "a", t: "Place the four inner platforms, both system ships, the defence monitor and the eight orbital mines within 30 cm of the planet." },
      { s: "a", t: "Your 750 pts fleet stays in reserve and rolls to arrive (Play)." },
      { t: "Disorder rolls 2D6, Order rolls a D6. The higher roll chooses who goes first." }
    ],
    notes: ["The book says reserves enter from “the designated long table edge as per the map”, but the printed map marks no such edge — agree one before play."],
    refs: [["Space station, orbital dock, platforms, mines, monitor, system ship", "FL p. 507–515"], ["Victory points", "RB p. 122"]],
    play: [
      { w: "Start of your turn", s: "a", t: "Roll a D6 for each ship or squadron still in reserve (arrival rolls below; a mixed squadron uses its slowest ship). Each time a ship or squadron fails twice, add +1 to its later rolls — cumulative." },
      { w: "All game", s: "b", t: "To win you must destroy both space stations, the orbital dock, all four inner platforms and 25% (by points) of the reinforcement fleet. Anything less is a defender’s win." },
      { w: "Turn 8", t: "Last turn." }
    ],
    turnMax: () => 8,
    fx: T => [["a", "Start of your turn: reserve arrival rolls"]].concat(T === 8 ? [[null, "Last turn"]] : []),
    tools: [
      ARRIVAL("res", "Reserve arrival rolls", { cl: "Ships or squadrons in reserve", il: i => "Reserve " + (i + 1),
        sub: "D6 per ship or squadron in reserve. " + ARRIVE_SUB + " Add +1 to a ship's roll for every two of its failed rolls so far (cumulative) — the result below is before that bonus." }),
      { k: "counter", id: "stn", l: "Space stations destroyed", s: "b", max: 2, goal: 2, res: 1 },
      { k: "toggle", id: "dock", l: "Orbital dock destroyed", s: "b" },
      { k: "counter", id: "inner", l: "Inner platforms destroyed", s: "b", max: 4, goal: 4, res: 1 },
      { k: "toggle", id: "q25", l: "25% of the reinforcement fleet destroyed (by points)", s: "b" }
    ],
    end: ["After eight turns."],
    win: ["The attacker wins only if both space stations, the orbital dock, all four inner platforms and 25% (by points) of the reinforcement fleet are destroyed.", "Any other result is a defender’s win."],
    result(st) {
      const s2 = get(st, "stn", 0) >= 2, d = get(st, "dock", false), i4 = get(st, "inner", 0) >= 4, q = get(st, "q25", false), n = [s2, d, i4, q].filter(Boolean).length;
      if (n === 4) return ["b", "Forces of Disorder win", "Every target destroyed."];
      return [st.turn > 8 ? "a" : null, st.turn > 8 ? "Forces of Order win" : "Defender wins unless every target falls", n + " of 4 conditions met (stations, dock, inner platforms, 25% of reinforcements)."];
    },
    info: { bg: "Huge Imperial reinforcements are moving from Cypra Mundi to Belis Corona. They cannot be stopped, but a raid on the orbital docks would force the Imperium to repair them before moving on — so a small Chaos fleet strikes before the next wave arrives.", cr: [BC_CREDIT, RB_CREDIT + " p. 194–195.", GW_CREDIT] }
  },
  /* ------------------------------------------------------------ 5 DAEMON BLOCKADE */
  {
    id: "bc-daemon-blockade", grp: "campaign", name: "Daemon Blockade", series: "13th Black Crusade · Scenario Five", trust: "rulebook",
    why: "Official campaign scenario — Blockade Run with daemon-infused mines.", src: "RB p. 196", book: "K", suggest: ["Imperial Navy", "Chaos"],
    others: "Any runners; the daemon mines suit Chaos, but any blockading fleet can use them.",
    sides: { a: { n: ORDER, f: "Imperial Navy" }, b: { n: "Blockade", f: "Chaos" } },
    pitch: "Reinforcements must punch through a Chaos blockade seeded with hungry daemon mines.",
    glance: [["Points", "Blockade: agreed − 100 + 10 daemon mines · Runners: half"], ["Table", "180 × 120 cm"], ["Battlezone", "Outer Reaches or Deep Space"], ["First turn", "Roll-off, winner decides"], ["Game ends", "After 6 turns"]],
    bring: ["10 daemon mine markers", "A D6 per blockading unit"],
    forces: { a: ["Attacker (breaking the blockade). Up to half the agreed points total."], b: ["Up to the agreed points minus 100.", "Plus ten daemon mines (rules in Play)."] },
    draw: (v, W, H) => {
      const w3 = W / 3, hb = Math.max(5, H - 60);
      return [R(0, 0, w3, hb, "b", "1–2"), R(w3, 0, w3, hb, "b", "3–4"), R(2 * w3, 0, w3, hb, "b", "5–6"),
        R(0, H - 15, W, 15, "a", "Runners: 15 cm"), { z: "dim", x1: W - 8, y1: hb, x2: W - 8, y2: H, l: "60 cm" },
        { z: "edge", e: "t", s: "a", l: "Blockade’s edge: runners score by leaving here" }];
    },
    fit: () => [60, 80], srcTable: [180, 120],
    mapNote: "Thirds as in Blockade Run: blockading ships, squadrons and daemon mines each roll a D6 for their third.",
    steps: [
      { t: "Agree the points. Set up a 180 × 120 cm table as Outer Reaches or Deep Space." },
      { t: "Divide the table lengthways into thirds (map)." },
      { s: "b", t: "Roll a D6 for each ship, squadron and daemon mine to see which third it goes in (tool below). Any facing, but nothing within 60 cm of the runners’ edge." },
      { s: "a", t: "Deploy within 15 cm of your table edge." },
      { t: "Roll off. The higher roll decides who goes first." }
    ],
    stools: [{ k: "roll", id: "third", l: "Blockade placement", sub: "D6 per ship, squadron or daemon mine", rows: () => [[1, 2, "Left third"], [3, 4, "Middle third"], [5, 6, "Right third"]] }],
    refs: [["Orbital mines (daemon mines build on them)", "FL p. 23, 512"], ["Blockade Run", "RB p. 133"]],
    play: [
      { w: "Daemon mines", s: "b", t: "They work as orbital mines, except: they move 10+D6 cm every ordnance phase, and they swallow any enemy ordnance they touch — torpedoes included — with no effect on the mine." },
      { w: "Fighters vs daemon mines", t: "When enemy fighters touch a daemon mine, remove the fighters and roll a D6: on 4+ the mine stays in play." },
      { w: "All game", s: "a", t: "Ships leaving over the blockade’s edge score their points value; crippled ones a quarter. Each daemon mine destroyed (not detonated) is worth 10 VP to you." },
      { w: "Turn 6", t: "Last turn." }
    ],
    turnMax: () => 6,
    fx: T => [["b", "Ordnance phase: daemon mines move 10+D6 cm"]].concat(T === 6 ? [[null, "Last turn"]] : []),
    tools: [{ k: "counter", id: "dm", l: "Daemon mines destroyed (not detonated)", s: "a", max: 10, warn: v => v ? "Runners +" + v * 10 + " VP" : "" }],
    end: ["After six turns."],
    win: ["Standard victory points for crippling and destroying (RB p. 122).", "The runners also score the points value of ships moved off over the blockade’s edge (crippled: a quarter), and 10 VP per daemon mine destroyed.", "Most victory points wins."],
    result(st) { return [null, "Count victory points", "Runners’ daemon mine bonus: " + get(st, "dm", 0) * 10 + " VP."]; },
    info: { bg: "Reinforcements bound for Belis Corona and Scelus have to break through Chaos blockades as fast as they can, through minefields and heavy fire. Worse, the orbital mines are said to be infused with daemonic power.", cr: [BC_CREDIT, RB_CREDIT + " p. 196.", GW_CREDIT] }
  },
  /* ------------------------------------------------------------ 6 NAVIGATE THE STORM */
  {
    id: "bc-navigate-the-storm", grp: "campaign", name: "Navigate the Storm", series: "13th Black Crusade · Scenario Six", trust: "rulebook",
    why: "Official campaign scenario with sixteen warp rifts and secret deployment.", src: "RB p. 197", book: "K", suggest: ["Imperial Navy", "Chaos"],
    others: "Any convoy fleet. The Transformation rule only exists for Chaos ships — another attacker simply loses ships to the rifts as normal.",
    sides: { a: { n: "Convoy", f: "Imperial Navy" }, b: { n: "Raiders", f: "Chaos" } },
    pitch: "Ten transports must cross a corridor torn by warp rifts — and Chaos ships that fall into a rift come back as daemonships.",
    glance: [["Points", "Raiders 750 · Convoy 1000 + 10 transports"], ["Table", "180 × 120 cm"], ["Battlezone", "16 warp rifts"], ["First turn", "Raiders choose"], ["Game ends", "Victory reached or no transports left"]],
    bring: ["16 warp rifts (8 per player, RB p. 111)", "10 transports", "A screen, or paper to sketch deployment"],
    forces: { a: ["1000 pts.", "Plus 10 transports."], b: ["750 pts."] },
    draw: (v, W, H) => [
      R(90, 0, W - 100, 10, "b", ""), { z: "text", x: 90 + (W - 100) / 2, y: 16, l: "Chaos deployment (from 90 cm)", s: "b" },
      R(0, H - 60, 20, 60, "a", "Convoy: 20 cm", { rot: -90 }), { z: "text", x: 48, y: H - 30, l: "convoy\ndeployment", s: "a" },
      { z: "edge", e: "b", s: "b", dash: 1, l: "“Attacker’s deployment” (see note)" },
      R(W - 6, 0, 6, Math.min(55, H / 2), "a", ""), { z: "edge", e: "r", s: "a", l: "Exit point (upper right)" },
      { z: "dim", x1: 0, y1: 8, x2: 90, y2: 8, l: "90 cm" }
    ],
    fit: () => [130, 90], srcTable: [180, 120],
    mapNote: "Drawn from the rulebook’s small map; only some distances are printed. See the source notes.",
    steps: [
      { t: "Set up a 180 × 120 cm table. Take turns placing warp rifts, eight each (RB p. 111), each at least 10 cm from those already placed." },
      { t: "Both players set up in secret — behind a screen across the table, or by sketching ship positions on paper — in the zones on the map." },
      { t: "Reveal and place the fleets on the table." },
      { s: "b", t: "The raiders choose who goes first." }
    ],
    notes: ["The rulebook map shows a grey “Chaos Deployment” band along the top edge from 90 cm, an exit point on the upper part of the right edge, a convoy zone 20 cm deep along the lower 60 cm of the left edge, and the words “Attacker’s Deployment” on the bottom edge. It does not say whether the raiders may also deploy along the bottom edge, nor how long the exit point is — agree before play."],
    refs: [["Warp rifts", "RB p. 111"], ["Daemonships and warp translation", "FL p. 226–227"]],
    play: [
      { w: "Warp rifts", t: "Ships crossing a rift test as normal (RB p. 111). Convoy ships lost in a rift count towards the raiders’ goal." },
      { w: "Transformation", s: "b", t: "A Chaos ship that fails to navigate a warp rift is not lost: in the current Chaos end phase it returns as a daemonship by warp translation (FL p. 226–227). This is permanent, and it happens again every time it fails." },
      { w: "Exit point", s: "a", t: "Transports and escorts leave by the exit point on the right edge." }
    ],
    tools: [
      { k: "counter", id: "dead", l: "Transports destroyed", s: "b", max: 10, goal: 8, res: 1 },
      { k: "counter", id: "out", l: "Transports through the exit point", s: "a", max: 10, goal: 5, res: 1 }
    ],
    end: ["When a side has met its victory conditions.", "Or when no transports remain in play."],
    win: ["Raiders: destroy 8 transports and cripple or destroy 50% (by points) of the convoy’s fleet; ships lost in warp rifts count. Both are needed.", "Convoy: move 5 transports off through the exit point and also 25% (by points) of the fleet, crippled ships not counting. Both are needed.", "If neither side manages both, the side with more destroyed (raiders) or escaped (convoy) transports takes a minor victory."],
    rtools: [
      { k: "toggle", id: "c50", l: "Raiders crippled or destroyed 50% of the convoy’s fleet", s: "b" },
      { k: "toggle", id: "i25", l: "Convoy moved 25% of its fleet (not crippled) off through the exit", s: "a" }
    ],
    result(st) {
      const d = get(st, "dead", 0), o = get(st, "out", 0), cw = d >= 8 && get(st, "c50", false), iw = o >= 5 && get(st, "i25", false);
      if (cw) return ["b", "Raiders’ victory", d + " transports destroyed and half the fleet broken."];
      if (iw) return ["a", "Convoy victory", o + " transports and a quarter of the fleet got out."];
      if (d > o) return ["b", "Raiders lead — minor victory if it ends here", d + " destroyed vs " + o + " escaped."];
      if (o > d) return ["a", "Convoy leads — minor victory if it ends here", o + " escaped vs " + d + " destroyed."];
      return [null, "Battle in progress", d + " destroyed, " + o + " escaped."];
    },
    info: { bg: "Warp storms have torn rifts open along vital transport lanes, and the Chaos fleets have learned to use them. The convoys must still deliver on time, so their escorts have doubled.", cr: [BC_CREDIT, RB_CREDIT + " p. 197.", GW_CREDIT] }
  },
  /* ------------------------------------------------------------ 7 MACHARIA'S END */
  {
    id: "bc-macharias-end", grp: "campaign", name: "Macharia’s End", series: "13th Black Crusade · Scenario Seven", trust: "rulebook",
    why: "Official campaign finale with special rules for the Planet Killer’s overcharged gun.", src: "RB p. 198–199", book: "K", suggest: ["Imperial Navy", "Chaos"],
    others: "Any defending fleet. The attacker needs the Planet Killer (FL p. 252), so it is a Chaos fleet.",
    sides: { a: { n: "Defenders of Macharia", f: "Imperial Navy" }, b: { n: "Planet Killer fleet", f: "Chaos (required)" } },
    pitch: "The Planet Killer has reached Macharia and starts charging its gun. Cripple it before the third charge counter.",
    glance: [["Points", "Defenders 2000 · Chaos 1500 + Planet Killer"], ["Table", "180 × 120 cm"], ["Battlezone", "Macharia at the defenders’ edge"], ["First turn", "Defenders"], ["Game ends", "Macharia dies or the Planet Killer is crippled"]],
    bring: ["The Planet Killer (FL p. 252)", "Planet Macharia", "Charge counters (coins will do)", "Nova Cannon template"],
    forces: { a: ["2000 pts.", "Up to 500 pts of it may be a separate vanguard."], b: ["1500 pts.", "Plus the Planet Killer (FL p. 252)."] },
    draw: (v, W, H) => [
      R(0, 0, 20, H, "a", ""), { z: "text", x: 12.5, y: Math.max(H * .22, 3 + textLen("Main fleet\n20 cm", W) / 2), l: "Main fleet\n20 cm", s: "a", rot: -90 },
      { z: "planet", cx: 0, cy: H / 2, r: 10, l: "" }, { z: "text", x: 36, y: H / 2, l: "Macharia", s: "n" },
      R(W / 2 - 5, 0, 10, H, "a", "Vanguard ±5 cm", { rot: -90 }),
      R(W - 10, 0, 10, H, "b", "Chaos: 10 cm", { rot: 90 }),
      { z: "edge", e: "r", s: "b", l: "Planet Killer moves on, turn 1" }
    ],
    fit: () => [100, 60], srcTable: [180, 120],
    mapNote: "Left = the defenders’ edge, Macharia centred on it. The Planet Killer moves on from the right edge in the first Chaos turn.",
    steps: [
      { t: "Set up a 180 × 120 cm table. Place Macharia in the centre of the defenders’ short edge." },
      { s: "a", t: "Place the main fleet within 20 cm of your edge." },
      { s: "b", t: "Place your fleet, without the Planet Killer, within 10 cm of your edge." },
      { s: "a", t: "Place the vanguard anywhere within 5 cm of the table centre line." },
      { s: "b", t: "The Planet Killer moves on from your edge during your first turn." },
      { s: "a", t: "The defenders go first." }
    ],
    refs: [["The Planet Killer", "FL p. 252"], ["Nova Cannon template", "RB p. 63"], ["Reload Ordnance", "RB p. 46"]],
    play: [
      { w: "Start of your turn", s: "b", t: "Decide whether to start charging the Armageddon gun. If you do, put a charge counter by the Planet Killer, and another at the start of each of your turns. At three counters it must fire in that shooting phase. Once started, charging cannot stop." },
      { w: "While charging", s: "b", t: "The Planet Killer cannot turn, take special orders or fire its lances, and gains +2 shields. (It may still use the gun normally without overcharging, but only the overcharged shot can destroy Macharia.)" },
      { w: "Firing overcharged", s: "b", t: "Put the Nova Cannon template touching the Planet Killer’s stem and move it straight ahead 60 cm (not 90). Every ship whose base it passes over is obliterated. If the template’s hole touches Macharia, the planet is destroyed and the game ends." },
      { w: "After a miss", s: "b", t: "To bring the gun back online, the Planet Killer must pass Reload Ordnance on two turns in a row. Until then it fires nothing and can only move." }
    ],
    fx: (T, st) => {
      const c = get(st, "chg", 0), o = [];
      if (c > 0 && c < 3) o.push(["b", "Charging " + c + "/3: no turning, no special orders, no lances, +2 shields"]);
      if (c === 3) o.push(["b", "Three counters: the gun must fire this shooting phase"]);
      if (get(st, "rec", false)) o.push(["b", "Recharging: two Reload Ordnance passes in a row, no firing"]);
      return o;
    },
    tools: [
      { k: "counter", id: "chg", l: "Armageddon gun charge counters", s: "b", max: 3, warn: v => v === 3 ? "Must fire in this shooting phase: template 60 cm straight ahead." : v ? "Charging: no turning, no special orders, no lances, +2 shields." : "" },
      { k: "toggle", id: "rec", l: "The shot missed — recharging (two Reload Ordnance passes in a row)", s: "b" }
    ],
    end: ["Macharia is destroyed.", "Or the Planet Killer is crippled."],
    win: ["Chaos wins by destroying Macharia.", "The defenders win by crippling the Planet Killer."],
    rtools: [{ k: "ending", id: "how", l: "How did it end?", rows: [["Macharia was destroyed", "b"], ["The Planet Killer was crippled", "a"]] }],
    result(st, v, S) { return endingResult(st, S, "how"); },
    info: { bg: "Backed by a sizeable armada, the Planet Killer has fought its way to Macharia. Records of its earlier victims show that its gun needs a long time to charge enough to destroy a world — so there may still be time to strike it down.", cr: [BC_CREDIT, RB_CREDIT + " p. 198–199.", GW_CREDIT] }
  }
  ]);
})();
