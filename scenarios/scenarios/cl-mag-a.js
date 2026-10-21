/* Classic scenarios from Battlefleet Gothic Magazine 4–6 (Fanatic Press):
   Treasure Fleet, Evacuation, Cadian Line, Ahriman's Arrival.
   Written for the original 1999 rules; Remastered places are given in the notes.
   Summarised in our own words; every scenario is hand-made (see LUEMINUT.md). */
(function () {
  const BM = n => "Battlefleet Gothic Magazine " + n + " (Fanatic Press)";
  const OLD = "Written for the original 1999 rules. ";
  const pctVerdict = (esc, tot) => {
    if (!tot) return [null, "Count the ships", "Set how many infiltrators started and how many escaped."];
    const p = Math.floor(100 * esc / tot);
    return p >= 75 ? ["b", "Chaos major victory", p + "% escaped."] : p >= 50 ? ["b", "Chaos minor victory", p + "% escaped."] : p >= 25 ? ["a", "Imperial minor victory", p + "% escaped."] : ["a", "Imperial major victory", p + "% escaped."];
  };

  addScenarios([
  /* ------------------------------------------------------------ TREASURE FLEET */
  {
    id: "cl-treasure-fleet", grp: "cl-mag", name: "Treasure Fleet", series: "BFG Magazine 4 · raid", trust: "classic",
    why: "Raiders strike a convoy of tithe transports still in orbit. Capture transports by boarding — and keep them.", src: "BFG Magazine 4 p. 6–7", book: "O", suggest: ["Imperial Navy", "Chaos"],
    others: "Any raiders — Orks or Eldar pirates work with no changes. The author also suggests a Chaos defender stripping a captured world, or an Imperial fleet trying to win back a stolen convoy.",
    sides: { a: { n: "Defenders", f: "Imperial Navy" }, b: { n: "Raiders", f: "Chaos" } },
    pitch: "A year’s tithe — men, ore, fuel and precious metals — sits in eight transports over Moreno Prime, waiting for an escort. A spy has told the raiders.",
    glance: [["Points", "Raiders 750 · Defenders 750 + 2D6×10 defences"], ["Table", "Not given — use your table"], ["Battlezone", "Primary or inner biosphere, planet in the centre"], ["First turn", "Raiders"], ["Game ends", "A side disengages or is destroyed"]],
    bring: ["8 transports", "A medium planet", "Planetary defences (fire ships allowed)", "Markers for captured transports"],
    forces: {
      a: ["Up to 750 pts of fleet.", "Plus 2D6×10 pts of planetary defences, rolled before the battle (tool below). No more than half of it may be fire ships.", "Roll a D6 for each capital ship and squadron: 1–3 it starts on the table, 4–6 it is the relief force off the table.", "Eight transports, inactive in orbit."],
      b: ["Up to 750 pts. At least half the points must be escorts."]
    },
    draw: (v, W, H) => [
      { z: "ring", cx: W / 2, cy: H / 2, r: 20, s: "a" }, { z: "planet", cx: W / 2, cy: H / 2, r: 8, l: "" },
      { z: "text", x: W / 2, y: H / 2 + 28, l: "transports, defences and\non-table ships: 20 cm well", s: "a" },
      { z: "edge", e: "r", s: "a", dash: 1, l: "Relief 1" }, { z: "edge", e: "b", s: "a", dash: 1, l: "Relief 2–3" },
      { z: "edge", e: "t", s: "a", dash: 1, l: "Relief 4–5 · raiders enter from any edge" }, { z: "edge", e: "l", s: "a", dash: 1, l: "Relief 6" }
    ],
    fit: () => [60, 70],
    mapNote: "Edge numbers are for the relief force’s random arrival, as on the magazine’s map. The raiders choose their own edge.",
    steps: [
      { s: "a", t: "Roll your planetary defences: 2D6×10 pts (tool below). No more than half may be fire ships." },
      { s: "a", t: "Roll a D6 for each capital ship and squadron (tool below): 1–3 it starts on the table, 4–6 it waits as the relief force." },
      { t: "Place a medium planet in the centre; generate rings and moons as normal. Pick the sunward edge and place the other phenomena as normal for a primary or inner biosphere." },
      { s: "a", t: "Place the eight transports in stationary orbit within the planet’s 20 cm gravity well, with all your defences and the ships that start on the table." },
      { s: "b", t: "No deployment: you move on from any table edge you choose in turn 1." },
      { s: "b", t: "The raiders take the first turn." }
    ],
    stools: [
      { k: "val", id: "def", l: "Planetary defences: 2D6×10 pts", opts: [], roll: () => 10 * (d6() + d6()), unit: " pts" },
      { k: "shiproll", id: "grp", l: "On the table or relief force?", cl: "Capital ships and squadrons", n0: 4, il: i => "Ship or squadron " + (i + 1), out: d => d <= 3 ? "starts on the table" : "relief force" }
    ],
    notes: [OLD + "Planetary defences and fire ships: FL p. 496–, 516. Hit-and-run attacks and boarding: RB p. 89–91.", "Transports that disengage are claimed by the side holding the table at the end, even a captured one that slipped away."],
    refs: [["Planetary defences", "FL p. 496–"], ["Fire ship", "FL p. 516"], ["Boarding, hit-and-run", "RB p. 89–91"], ["Planets and gravity wells", "RB p. 113–116"]],
    play: [
      { w: "From your turn 2", s: "a", t: "Take a Leadership test for the relief force each turn. Once it passes, the relief force moves on from a random table edge (tool below)." },
      { w: "Inactive transports", t: "They cannot move or fire, but their shields and turrets work." },
      { w: "Capturing", s: "b", t: "A hit-and-run attack or a boarding action captures a transport. Only you can activate one: from your next turn you move it as normal." },
      { w: "Recapturing", s: "a", t: "You recapture a stolen transport the same way, by hit-and-run or boarding, and then control it." }
    ],
    fx: (T, st) => T >= 2 && !get(st, "rel", false) ? [["a", "Leadership test: does the relief force arrive?"]] : [],
    tools: [
      { k: "toggle", id: "rel", l: "The relief force has arrived", s: "a" },
      { k: "roll", id: "edge", l: "Relief force edge", rows: () => [[1, 1, "Right edge"], [2, 3, "Bottom edge"], [4, 5, "Top edge"], [6, 6, "Left edge"]] },
      { k: "counter", id: "rc", l: "Transports the raiders control", s: "b", max: 8, res: 1 },
      { k: "counter", id: "dc", l: "Transports the defenders have recaptured", s: "a", max: 8, res: 1 },
      { k: "counter", id: "xd", l: "Transports destroyed (they count for nobody)", max: 8, res: 1 }
    ],
    rtools: [{ k: "ending", id: "field", l: "Who holds the table at the end?", rows: [["The defenders", "a"], ["The raiders", "b"]] }],
    end: ["When one side disengages or is destroyed."],
    win: ["Each side scores 1 point for every transport it controls at the end.", "Inactive transports, and transports that disengaged, go to whoever holds the table. Destroyed ones count for nobody.", "More points wins."],
    result(st) {
      const r = get(st, "rc", 0), d = get(st, "dc", 0), rest = Math.max(0, 8 - r - d - get(st, "xd", 0)), f = get(st, "field", -1);
      if (f < 0) return [null, "Who holds the table?", "Raiders " + r + ", defenders " + d + ", and " + rest + " transport" + (rest === 1 ? "" : "s") + " go to whoever holds the table."];
      const R = r + (f === 1 ? rest : 0), D = d + (f === 0 ? rest : 0);
      return R === D ? ["draw", "Level", "Raiders " + R + " – Defenders " + D + "."] : [R > D ? "b" : "a", (R > D ? "Raiders" : "Defenders") + " win", "Raiders " + R + " – Defenders " + D + " transports."];
    },
    info: { bg: "The governor of the Moreno subsector gathered a year’s tithe — men for the Imperial Guard, ore, coal, fuel and precious metals — into transports orbiting Moreno Prime. Loading took a month, and while the escort assembled, a spy at court sent word to the raiders.", cr: ["Pendrigh Redford — “Scenario: Treasure Fleet”, " + BM(4) + ", p. 6–7 (PDF p. 8–9)."] }
  },
  /* ------------------------------------------------------------ EVACUATION */
  {
    id: "cl-evacuation", grp: "cl-mag", name: "Evacuation", series: "BFG Magazine 4 · convoy", trust: "classic",
    why: "A panicked evacuation fleet — liners, tankers, Q-ships, clippers — must get out past a renegade fleet already closing in.", src: "BFG Magazine 4 p. 8–9", book: "O", suggest: ["Imperial Navy"],
    others: "Any defending fleet with a motley convoy, against any attackers rolled from their own list. The Fleets book’s Merchantmen’s Folly (FL p. 200) builds on the same idea of an undisciplined convoy.",
    sides: { a: { n: "Evacuation fleet", f: "Imperial Navy" }, b: { n: "Attackers" } },
    pitch: "Guidus Prime will fall. Nearly twenty ships flee at once — some masters itching for one last fight, others already panicking — and the enemy is already in-system.",
    glance: [["Points", "Convoy: 200 pts of transports + 300 pts · attackers random"], ["Table", "Not given — use your table"], ["Battlezone", "Inner biosphere, no planets"], ["First turn", "Evacuation fleet"], ["Game ends", "The last transport leaves or dies"]],
    bring: ["10 or more transports of mixed types", "Paper to note which freighters are Q-ships"],
    forces: {
      a: ["Up to 200 pts of transports, at least 10 ships. No more than three of any one type, except plain transports (10 pts each here).", "Transport types: heavy transports, armed freighters, armed cargo vessels and fast clippers, Q-ships, escort carriers (FL p. 182, 192, 521–523).", "Up to 300 pts of warships.", "Every transport and civilian ship rolls Leadership on its own at −1 Ld and takes special orders on its own, even in a squadron."],
      b: ["Rolled at random: D3+3 rolls on the table below."]
    },
    draw: (v, W, H) => [
      R(Math.max(0, W - 60), 0, Math.min(60, W), 45, "b", "Attackers\n60 × 45 cm"), R(Math.max(0, W - 60), H - 45, Math.min(60, W), 45, "b", "Attackers\n60 × 45 cm"),
      H > 90 ? R(0, 45, 8, H - 90, "a", "", { free: "x" }) : null, { z: "arrow", x1: 10, y1: H / 2, x2: 26, y2: H / 2, s: "a" },
      { z: "text", x: 46, y: H / 2 + 8, l: "convoy enters", s: "a" },
      { z: "edge", e: "r", s: "a", l: "Exit: transports escape here" }
    ],
    fit: () => [110, 91],
    mapNote: "As the magazine’s map: the attackers are already in-system, within 45 cm of either long edge and 60 cm of the far short edge. The convoy enters as in Convoy.",
    steps: [
      { s: "b", t: "Roll your forces: D3+3 rolls on the table below." },
      { s: "a", t: "Choose the convoy and its warships; note in secret which freighters are Q-ships." },
      { t: "Set up phenomena for the inner biosphere; a planet result counts as nothing." },
      { s: "b", t: "Deploy within 45 cm of either long edge and no more than 60 cm from the short edge opposite the convoy’s entry point." },
      { s: "a", t: "Mark the convoy’s entry point on the other short edge, not within 45 cm of either long edge, as in Convoy." },
      { s: "a", t: "The evacuation fleet takes the first turn and moves on." }
    ],
    stools: [
      { k: "val", id: "nr", l: "Number of rolls: D3 + 3", opts: [4, 5, 6], roll: () => 3 + dn(3) },
      { k: "shiproll", id: "frc", l: "Roll the attacking forces", cl: "Rolls", n0: st => get(st, "nr", 0) || 5, il: i => "Roll " + (i + 1), out: d => [0, "One attack craft counter", "Two attack craft counters", "A squadron of escorts worth up to 100 pts", "A squadron of escorts worth up to 150 pts", "A squadron of escorts worth up to 200 pts", "One cruiser, heavy cruiser or battlecruiser worth up to 210 pts"][d] }
    ],
    notes: [OLD + "Convoy rules: RB p. 134–135. The merchant ships came from Warp Storm and the magazine’s own article; their Remastered profiles are in the Fleets book.", "The attackers set up openly here, not under contact markers. The article does not say what an attack craft counter becomes; suggestion: D3+1 squadrons of attack craft placed in the attackers’ zone, as when a Convoy marker is revealed."],
    refs: [["Convoy rules", "RB p. 134–135"], ["Transport types", "FL p. 182, 192, 521–523"], ["Victory points", "RB p. 122"]],
    play: [
      { w: "Turns 1–2", s: "a", t: "The convoy moves on from the entry point; everything must be on the table by the end of your second turn." },
      { w: "Start of your turn, from turn 3", s: "a", t: "Roll a D10 on the convoy table (tool below). You choose which ships it affects; they are affected this turn only and pass any Leadership test it calls for, unless it says otherwise." },
      { w: "Disengaging", s: "a", t: "Transports cannot disengage except by leaving the opposite short edge." },
      { w: "Q-ships", s: "a", t: "Q-ships need not be revealed until fired upon, and have no transport value." }
    ],
    fx: T => T <= 2 ? [["a", T === 2 ? "Last turn to get the convoy onto the table" : "The convoy moves on"]] : [["a", "D10 on the convoy table"]],
    tools: [{ k: "roll", id: "evt", l: "Convoy table", die: 10, sub: "D10 at the start of each convoy turn from turn 3", rows: () => [[1, 1, "Panic! Every transport goes All Ahead Full — Leadership for each separately, no re-rolls"], [2, 2, "A fast clipper panics and goes All Ahead Full"], [3, 3, "A fast clipper panics: new heading away from the closest enemy formation, full distance"], [4, 4, "An armed freighter turns towards the nearest enemy formation and moves its full distance to engage"], [5, 5, "The convoy keeps formation and follows your orders"], [6, 6, "A transport and a Q-ship turn towards friendly escorts and move their full distance to help"], [7, 7, "Two transports and a Q-ship turn towards friendly escorts and move their full distance to help"], [8, 8, "Engine trouble: a transport moves only half distance this turn"], [9, 9, "Engine trouble: two transports move only half distance this turn"], [10, 10, "The convoy keeps formation and follows your orders"]] }],
    rtools: [
      { k: "num", id: "av", l: "Evacuation fleet: standard victory points", s: "a", after: v => v + " VP" },
      { k: "num", id: "ap", l: "Evacuation fleet: points value of transports that escaped", s: "a", after: v => "+" + v + " VP" },
      { k: "num", id: "bv", l: "Attackers: standard victory points", s: "b", after: v => v + " VP" }
    ],
    end: ["When the last transport has left the table or been destroyed."],
    win: ["Standard victory points for crippling and destroying ships (RB p. 122).", "The evacuation fleet also scores the points value of every transport that leaves by the opposite short edge.", "More victory points wins."],
    result(st) {
      const A = num(st, "av") + num(st, "ap"), B = num(st, "bv");
      if (!A && !B) return [null, "Count victory points", "Enter both totals below."];
      return A === B ? ["draw", "Level", A + " – " + B + " VP."] : [A > B ? "a" : "b", (A > B ? "Evacuation fleet" : "Attackers") + " win" + (A > B ? "s" : ""), "Evacuation fleet " + A + " – Attackers " + B + " VP."];
    },
    info: { bg: "As word spread that Guidus Prime would be overrun, ships of every kind fled at once. Captain Johannes Victor and his small fleet tried to shepherd nearly twenty of them out — the fleet tanker St Helena, the stellar liner Via Lactis, Q-ships, heavy transports, Galaxy freighters and fast clippers — before the renegade fleet arrived.", cr: ["Nate Montes — “Scenario: Evacuation”, " + BM(4) + ", p. 8–9 (PDF p. 10–11). The same issue carries his “Merchant Ships of the Imperium”."] }
  },
  /* ------------------------------------------------------------ CADIAN LINE */
  {
    id: "cl-cadian-line", grp: "cl-mag", name: "Cadian Line", series: "BFG Magazine 5 · infiltration", trust: "classic",
    why: "Chaos cruisers creep through the Cadian picket lines on minimal power. They cannot be shot until they are detected.", src: "BFG Magazine 5 p. 14–16", book: "O", suggest: ["Imperial Navy", "Chaos"],
    others: "Any defender with escorts and orbital defences, against any small raiding force. The author took the idea from the Gibraltar scene in the film Das Boot.",
    sides: { a: { n: "Cadian defences", f: "Imperial Navy" }, b: { n: "Infiltrators", f: "Chaos" } },
    pitch: "Three picket lines of escorts and a fortress zone guard the way past Cadia. The infiltrators run silent — until someone comes too close.",
    glance: [["Points", "Defences up to 1500 · Infiltrators 75% of that"], ["Table", "Not given — use your table"], ["Battlezone", "D3 asteroid fields, maybe a warp rift, no planets"], ["First turn", "Not given — see note"], ["Game ends", "Every infiltrator is gone or out"]],
    bring: ["Orbital defences", "Asteroid fields (D3) and perhaps a warp rift"],
    forces: {
      a: ["The agreed points, at most 1500. No battleships.", "At least 25% of the points in escorts and at least 25% in orbital defences.", "Cruisers start on standby off the table."],
      b: ["75% of the defenders’ points. No battleships."]
    },
    draw: (v, W, H) => {
      const x3 = Math.max(40, W - 60), x2 = Math.max(27, x3 - 30), x1 = Math.max(14, x2 - 30);
      return [
        R(x3, 0, W - x3, H, "a", "Fortress zone: all orbital defences", { dash: 1, rot: 90 }),
        { z: "line", x1: x1, y1: 0, x2: x1, y2: H }, { z: "line", x1: x2, y1: 0, x2: x2, y2: H }, { z: "line", x1: x3, y1: 0, x2: x3, y2: H },
        { z: "text", x: x1 + 4, y: H * .3, l: "Patrol route 1", s: "a", rot: -90 }, { z: "text", x: x2 + 4, y: H * .5, l: "Patrol route 2", s: "a", rot: -90 }, { z: "text", x: x3 + 4, y: H * .7, l: "Patrol route 3", s: "a", rot: -90 },
        { z: "dim", x1: x1, y1: H - 10, x2: x2, y2: H - 10, l: "30" }, { z: "dim", x1: x2, y1: H - 10, x2: x3, y2: H - 10, l: "30" },
        { z: "edge", e: "l", s: "b", l: "Infiltrators start here" }, { z: "edge", e: "r", s: "b", dash: 1, l: "Infiltrators escape here · standby cruisers enter" }
      ];
    },
    fit: () => [130, 60],
    mapNote: "As the magazine’s map: three patrol routes 30 cm apart, then the fortress zone in front of the defenders’ edge.",
    steps: [
      { t: "Agree the points (1500 at most); the infiltrators take 75% of it. No battleships on either side." },
      { t: "Place at least one asteroid field (roll D3 for how many) and perhaps a warp rift. No planets." },
      { s: "a", t: "Deploy first. Give each escort squadron a patrol route. Put every orbital defence in the fortress zone. Cruisers stay off the table on standby." },
      { s: "b", t: "Deploy right on the edge of the short end opposite the defences." },
      { t: "Decide who goes first (see note)." }
    ],
    stools: [{ k: "counter", id: "tot", l: "Infiltrating ships at the start", s: "b", start: 4, min: 1 }],
    notes: [OLD + "Orbital defences: FL p. 496–.", "The article does not say who has the first turn. Suggestion: the infiltrators, who are moving in.", "How escorts move on a patrol route is not spelled out. Suggestion: they move along their line and may only turn back at its ends until the alarm is raised."],
    refs: [["Orbital defences", "FL p. 496–"], ["Asteroid fields, warp rifts", "RB p. 110–111"]],
    play: [
      { w: "Detection", t: "An infiltrating cruiser within 20 cm of any defending ship or defence is detected; an escort within 15 cm. A ship on special orders is detected 5 cm further out. A ship that fires any weapon or launches anything is detected at once." },
      { w: "Undetected ships", s: "b", t: "Cannot be fired upon. Stay quiet — firing gives you away." },
      { w: "Patrols", s: "a", t: "Escorts stay on their patrol routes until the first infiltrator is detected; then everything moves freely." },
      { w: "Start of your turn, after a detection", s: "a", t: "Roll a D6 for each cruiser on standby: on 5–6 it moves on from the short edge the infiltrators are heading for." },
      { w: "All game", s: "b", t: "Get off the opposite short edge." }
    ],
    fx: (T, st) => get(st, "det", false) ? [["a", "Standby cruisers: D6 each, 5–6 arrive"]] : [["a", "Patrols keep to their routes"]],
    tools: [
      { k: "toggle", id: "det", l: "An infiltrator has been detected — the alarm is raised", s: "a" },
      { k: "counter", id: "out", l: "Infiltrators that escaped", s: "b", res: 1 },
      { k: "info", res: 1, html: st => { const t = get(st, "tot", 4), o = get(st, "out", 0); return "<h3>Escaped</h3><p class='calc'><b>" + o + "</b> of " + t + " (" + Math.floor(100 * o / Math.max(1, t)) + "%). Set the starting number in Set-up.</p>"; } }
    ],
    end: ["When every infiltrator has been destroyed, or all that remain have left by the opposite short edge."],
    win: ["Count the share of infiltrating ships that escaped (rounding down).", "75–100%: Chaos major victory. 50–74%: Chaos minor victory. 25–49%: Imperial minor victory. 0–24%: Imperial major victory."],
    rtools: [{ k: "toggle", id: "over", l: "Every infiltrator is destroyed or out — the game is over" }],
    result(st) { const r = pctVerdict(get(st, "out", 0), get(st, "tot", 4)); return get(st, "over", false) || !r[0] ? r : [r[0], r[1] + " — if it ended now", r[2]]; },
    info: { bg: "Cadia is ringed by defence platforms and patrolled by hundreds of escorts, yet now and then a Chaos ship slips through. This battle follows one such breakthrough: a Murder class cruiser was caught by a Cobra of Theta squadron and burned, but a Carnage led two others past the platforms, crippled by torpedoes, before a battlegroup under the Retribution Imperial Vigilance hunted them down.", cr: ["Noamaan Siddiqi — “Scenario: Cadian Line”, " + BM(5) + ", p. 14–16 (PDF p. 16–18)."] }
  },
  /* ------------------------------------------------------------ AHRIMAN'S ARRIVAL */
  {
    id: "cl-ahriman", grp: "cl-mag", name: "Ahriman’s Arrival", series: "Cerberus War · BFG Magazine 6", trust: "classic",
    why: "Escalating Engagement against the Arch-Sorcerer Ahriman, whose whole fleet arrives at once on turn 2. The Imperials only have to hurt him.", src: "BFG Magazine 6 p. 19–21", book: "O", suggest: ["Imperial Navy", "Chaos"],
    others: "Any fleet can face Ahriman. He is an unofficial special character, so take him only with your opponent’s agreement; without him, give the Chaos flagship Abaddon’s re-roll rules (FL p. 230–231).",
    sides: { a: { n: "Imperial Navy", f: "Imperial Navy" }, b: { n: "Ahriman’s fleet", f: "Chaos (Tzeentch)" } },
    pitch: "Ahriman rides a warp current into the Willow system. The scattered Imperial fleet cannot win — but every hour it delays him buys warnings for the rest of the sector.",
    glance: [["Points", "2000 each"], ["Table", "Not given — use your table"], ["Battlezone", "As normal"], ["First turn", "As Escalating Engagement"], ["Game ends", "A fleet disengages or is destroyed"]],
    bring: ["5 contact markers for the Imperials, 1 for Chaos", "Ahriman (rules on the Play tab)"],
    forces: {
      a: ["Up to 2000 pts. No battleships; at most one battlecruiser, one ship with a nova cannon and one carrier with up to four launch bays.", "Split into five divisions, as in Escalating Engagement."],
      b: ["Up to 2000 pts, including Ahriman (200 pts) as fleet commander. At most one battleship; no Planet Killer or Blackstone Fortress.", "Chaos lords and warmasters may take only the Mark of Tzeentch.", "One starting division of up to 300 pts; the rest of the fleet is one contact marker."]
    },
    fixed: {
      a: ["Admiral (Ld 9, two extra re-rolls).", "Overlord battlecruiser Triumph; Dictator Vanguard; Dominator First Strike; Tyrant Implacable; Gothic Furious; Lunar Challenger.", "Dauntless light cruisers Nevsky, Hunter and Rapier.", "Three Firestorms, three Swords, three Cobras."],
      b: ["Ahriman; a Chaos Lord (Ld 8, Mark of Tzeentch).", "Despoiler battleship Severed Dreams; Repulsive grand cruiser Treacherous; Hades Vengeance; Devastation Scourge; Carnage Eliminator; Murder Malicious; Slaughter Eradicator.", "Iconoclasts Black Asps (3), Idolators Avengers (2).", "Historically the Slaughter and the Iconoclasts were the bait, and the Dauntless Nevsky found them."]
    },
    draw: (v, W, H) => MAPS["escalating-engagement"](v, W, H),
    fit: () => [120, 90],
    mapNote: "Starting divisions as in Escalating Engagement. Edge numbers are for the Imperial reinforcements; Ahriman’s fleet marker goes on any edge he chooses.",
    steps: [
      { t: "Set up celestial phenomena as normal." },
      { s: "a", t: "Split your fleet into five divisions and note which ships are in each, as in Escalating Engagement." },
      { s: "b", t: "Pick a starting division of up to 300 pts; the rest of the fleet is a single contact marker." },
      { t: "Sub-plots are part of this scenario: the Imperials take Blood Bond, and Ahriman’s ship has Desperate Mission (pick them on the Sub-plots tab)." },
      { t: "Deploy the starting divisions as in Escalating Engagement: markers at least 30 cm from every edge and 60 cm from each other, ships within 10 cm." },
      { t: "Both roll a D6. The higher roll chooses to go first or second." }
    ],
    notes: [OLD + "Escalating Engagement: RB p. 138–139. Abaddon’s re-roll and “You have failed me for the last time”: FL p. 230–231. Blood Bond and Desperate Mission: RB p. 125, 127.",
      "Ahriman is described by the magazine itself as unofficial: use him only with your opponent’s permission.",
      "The article says the result shapes the rest of the Cerberus campaign but gives no rule for it; play it on its own or as the opening of the Cerberus War scenarios."],
    refs: [["Escalating Engagement", "RB p. 138–139"], ["Abaddon’s rules", "FL p. 230–231"], ["Sub-plots", "RB p. 124–127"], ["Mark of Tzeentch", "FL p. 232"]],
    play: [
      { w: "End of Chaos turn 1", s: "b", t: "Place your fleet’s single contact marker on any table edge. The whole rest of the fleet arrives there at the start of turn 2 — no roll needed." },
      { w: "Imperial reinforcements", s: "a", t: "As in Escalating Engagement: draw a marker each end phase, place it on a random edge, roll to arrive." },
      { w: "Ahriman", s: "b", t: "Ld 10. His fleet may re-roll one command check or Leadership test each turn, and he uses Abaddon’s “You have failed me for the last time” (FL p. 231)." },
      { w: "Blessing of Tzeentch", s: "b", t: "Enemy ships firing at Ahriman’s ship shift one column right on the gunnery table." },
      { w: "Ward of Chaos", s: "b", t: "Every enemy ship within 15 cm of Ahriman’s ship counts as having one blast marker on its base." },
      { w: "Daemonic Horde, once per game", s: "b", t: "Pick one enemy ship: roll a D6, then roll that many dice to hit against its armour. Shields count; check criticals as normal. (The Cerberus War reprint in BFG Magazine 14 adds: any range, no line of sight, against the lowest armour, no Lock On re-rolls.)" },
      { w: "I’ll be back", s: "b", t: "Even if his ship is destroyed, Ahriman may return in a later campaign battle." }
    ],
    fx: T => T === 1 ? [["b", "End of your turn: place the fleet marker on any edge"]] : T === 2 ? [["b", "The rest of Ahriman’s fleet arrives"], ["a", "Reinforcement rolls"]] : [["a", "Reinforcement rolls"]],
    tools: [{ k: "toggle", id: "horde", l: "Daemonic Horde used", s: "b" }],
    rtools: [
      { k: "num", id: "iv", l: "Imperial victory points (crippled Chaos ships count 75%)", s: "a", after: v => v + " VP" },
      { k: "num", id: "cv", l: "Chaos victory points (none for holding the field)", s: "b", after: v => v + " VP" }
    ],
    end: ["When one fleet disengages or is destroyed."],
    win: ["Standard victory points, with two changes: the Imperials score 75% of a Chaos ship’s value for crippling it (not 25%), and Chaos scores nothing for holding the field.", "Sub-plots: Blood Bond for the Imperials, Desperate Mission for Ahriman’s ship."],
    result(st) {
      const A = num(st, "iv"), B = num(st, "cv");
      if (!A && !B) return [null, "Count victory points", "Enter both totals below."];
      return A === B ? ["draw", "Level", A + " – " + B + " VP."] : [A > B ? "a" : "b", (A > B ? "The Imperial Navy wins" : "Ahriman wins"), "Imperial " + A + " – Chaos " + B + " VP."];
    },
    info: { bg: "After a secret visit in a single ship, Ahriman returned to the Cerberus Shroud in force. He emerged in the Willow system and annihilated the Imperial fleet there; the planet Willow B fell to Chaos soon after. Unlike every other newcomer to the sector, he seemed to know exactly where he was going.", cr: ["Chris Lucking and James Parry — “Scenario: Ahriman’s Arrival”, " + BM(6) + ", p. 19–21 (PDF p. 21–23), part of the Cerberus campaign."] }
  }
  ]);
})();
