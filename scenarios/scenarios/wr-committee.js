/* Warp Rift scenarios by authors who also write the rules (class L1; tag "Rules writer", rating in wr-rating.js).
   In the Depth of Space (WR16), The Diasporex Gambit 2 (WR34), Solblades 1–6 (WR40–42).
   Summarised in our own words; each scenario hand-made (see LUEMINUT.md). */
(function () {
  const HZ = "Roy “horizon” Amkreutz";

  /* ============================================================ In the Depth of Space */
  const DEPTH_V = [["show", "Show-Down"], ["prize", "The Prize"], ["mark", "The Mark"], ["merch", "Merchantmen"], ["quick", "Quicksand"], ["haven", "Shattered Haven"], ["flood", "Flood Line"]];
  const PATROL = ["Up to 750 pts, all from one fleet list.", "The cheapest admiral or commander available — give them a name.", "One battleship or grand cruiser (Rogue Traders use their normal list; a Tau Exploration fleet may take a Demiurg Stronghold).", "At least 40% of the remaining points on escorts; the rest on any ships of that list.", "Name every ship and squadron. Fan-made lists are welcome."];
  const RAIDER = "A raider fleet: up to 750 pts, no commander needed, at most three capital ships and the rest escorts. Name every ship.";
  const PATROL_OR_RAIDER = ["Another patrol or exploration fleet built the same way.", "Or " + RAIDER.charAt(0).toLowerCase() + RAIDER.slice(1)];
  const DEPTH = {
    pitch: { show: "Two patrol fleets meet out in the void. A plain fight between small fleets built around a battleship.", prize: "Something valuable floats in the middle of the table. Hold it for a turn or two — and then get it out.", mark: "High Command orders a patrol to hunt down a notorious pirate in a well-defended hideout.", merch: "A patrol escorts a convoy from one short edge to the other. Half of it must arrive.", quick: "Investigating an anomaly, a patrol is surrounded by alien ships closing in from every side. Run.", haven: "A trading haven calls for help: it is under attack, and the patrol arrives to save it.", flood: "A patrol stumbles on a huge enemy fleet gathering. Learn what you can, then get the news home." },
    goal: { show: "Standard victory points", prize: "Hold the prize 1–2 turns, then get out", mark: "As the base scenario you pick", merch: "Half the convoy crosses the table", quick: "Escape off one short edge", haven: "Save the space station", flood: "4 intel points and one ship out" }
  };

  /* ============================================================ Solblades (shared) */
  const SOL_SIDES = { a: { n: "Solblade", f: "Space Marines / Imperial strike group" }, b: { n: "Tyranids", f: "Tyranids" } };
  const SOL_OTHERS = "Without the Warp Rift 40 rules: a small, fast Imperial strike group (Space Marines, Sororitas or Mechanicus) of about 250 pts against a large Tyranid fleet. The Solblade fleet rules and the Tyranid changes are in Warp Rift 40, p. 9–14.";
  const SOL_A = pts => ["Up to " + pts + " pts built with the Solblade rules (WR40 p. 9–14): fast ships only — Space Marine Strike Cruiser, Sororitas Priory or Chapel, Mechanicus light cruisers, Dauntless, and Nova, Gladius, Firestorm or Sword frigates — each with its own command options and upgrades."];
  const SOL_B = (pts, extra) => ["A " + pts + " pt hive fleet (FL p. 430–) with the Solblade changes (WR40 p. 12–14): 6–12 escort drones per hive ship, 1–12 kraken or vanguard per hive ship in squadrons of 3–12, no evolutions unless both players agree. Big escort squadrons may use swarm bases."].concat(extra || []);
  const SOL_PLAY = [
    { w: "Solblade rules", s: "a", t: "Well prepared: no Leadership test to fire at a target that is not the closest." },
    { w: "Solblade rules", s: "a", t: "Escorts may operate alone, without coherency; each takes its own special orders on the squadron’s Leadership. Imperial escorts may make teleport attacks on ships with more hits than themselves." },
    { w: "Solblade rules", s: "a", t: "Attack craft pool: three markers of each type per launch bay. A marker shot down by spores rolls a D6: on 1–3 it is lost from the pool, on 4–6 it makes it home." },
    { w: "Solblade rules", s: "a", t: "Damaged escorts: an escort that would be destroyed rolls on the damaged escort table instead (tool below)." },
    { w: "Silent running", s: "a", t: "Declared at the start of your movement phase, no command check. Shields 0, no special orders, no shooting or other actions; the ship drifts 10 cm straight ahead and cannot be targeted. A Tyranid ending a move within 10 cm detects it (a hive ship senses 20 cm)." },
    { w: "Tyranid rules", s: "b", t: "Instinctive behaviour, step 7: with a planet on the table, end the move closer to it if possible, otherwise half speed straight ahead; without a planet, close on the nearest hive ship and circle it abeam at about 15 cm." }
  ];
  const DAMAGED = { k: "roll", id: "dmg", l: "Damaged escort", sub: "D6 when an escort would be destroyed", rows: () => [[1, 3, "Out of action: leave the model with a blast marker; it drifts 5 cm in a random direction each movement phase. End phase D6: on 1 it is lost — remove it, leave a blast marker."], [4, 5, "Damage control: next movement phase it moves straight ahead at half speed, then rolls again on this table with +1 (only one +1, ever)."], [6, 6, "Battles on: place an extra blast marker on its base; it fights on as normal."]] };
  const SOL_REFS = [["Solblade fleet rules", "WR40 p. 9–11"], ["Tyranid changes and swarm bases", "WR40 p. 12–14"], ["Tyranid fleet list", "FL p. 430–"]];
  const SOL_CR = n => [wrCredit(n, HZ), "Part of the Solblade series (Warp Rift 40–42), set in the Fourth Tyrannic War."];

  addScenarios([
  /* ------------------------------------------------------------ IN THE DEPTH OF SPACE */
  {
    id: "wr-depth-of-space", grp: "committee", name: "In the Depth of Space", series: "Patrol and exploration fleets · seven sketches", trust: "committee", type: "Scenario set",
    why: "By Roy “horizon” Amkreutz, Warp Rift’s editor. Written as quick, deliberately one-sided sketches.",
    src: "Warp Rift 16, pp. 18–22", book: "O", suggest: ["Imperial Navy", "Tau", "Chaos", "Rogue Traders", "Space Marines", "Adeptus Mechanicus"],
    others: "The article names Imperial Navy, Tau, Chaos and renegades, Rogue Traders, Space Marines and Mechanicus as patrol fleets; they meet anything — Eldar, Tyranids, Orks, or your own fan races.",
    sides: { a: { n: "Patrol fleet", f: "a fleet built around a battleship" }, b: { n: "Opponent", f: "see the sketch" } },
    variants: DEPTH_V,
    pitch: v => DEPTH.pitch[v],
    glance: v => [["Points", v === "flood" ? "Patrol 750 · enemy 1500 + defences" : v === "mark" ? "Patrol 750 · pirates 500" : v === "merch" ? "Patrol 750 + 500 pt convoy · enemy 750" : "Patrol 750 · opponent up to 750"], ["Table", v === "merch" || v === "quick" ? "180 × 120 cm" : "Any"], ["Battlezone", "Random, or set for the story"], ["First turn", "Not given — roll off"], ["Goal", DEPTH.goal[v]]],
    bring: v => ["Fleets built by the patrol guidelines", { prize: "A striking centrepiece: a hulk, an artefact or a planet", merch: "Merchants, transports and freighters (500 pts)", quick: "A large gas or dust cloud", haven: "A space station, plus some transports and escorts", flood: "A big enemy fleet (1500 pts)" }[v]].filter(Boolean),
    forces: v => ({
      a: PATROL.concat(v === "merch" ? ["Plus a convoy of merchants, (heavy) transports and freighters worth up to 500 pts (Tau may use Explorers stripped of launch bays)."] : v === "haven" ? ["The trading haven (a space station) with some transports and escorts defending it is on your side."] : []),
      b: v === "flood" ? ["“Miss Fortune”: a bigger fleet of up to 1500 pts with all standard restrictions, plus up to 25% of its value on defences — or more if you like."] :
         v === "mark" ? ["“Persecution”: pirates or a minor alien force of up to 500 pts, at most one capital ship and the rest escorts."] :
         v === "quick" ? ["Alien ships closing in from all sides. The sketch sets no size — agree one (the article’s 1500 pt ‘Miss Fortune’ or 500 pt ‘Persecution’ guidelines are both options)."] :
         PATROL_OR_RAIDER
    }),
    draw: (v, W, H) => {
      if (v === "show") { const zw = Math.min(90, W), x0 = (W - zw) / 2, d = Math.max(5, (H - 60) / 2);
        return [R(x0, 0, zw, d, "a", "Patrol"), R(x0, H - d, zw, d, "b", "Opponent"), { z: "text", x: W / 2, y: H / 2, l: "as Cruiser Clash — or opposite corners", s: "n" }]; }
      if (v === "prize") return [{ z: "circ", cx: W / 2, cy: H / 2, r: 10, s: "n", l: "" }, { z: "mark", x: W / 2, y: H / 2, s: "n", l: "the prize (~10 cm)" },
        { z: "edge", e: "t", s: "a", l: "Patrol enters" }, { z: "edge", e: "b", s: "b", l: "Opponent enters" }];
      if (v === "mark") return [{ z: "hatch", x: W * .55, y: H * .2, w: W * .35, h: H * .6, l: "pirate hideout:\na strong defensive position" }, R(W * .62, H * .4, 24, 20, "b", "Pirates"),
        { z: "edge", e: "l", s: "a", l: "Patrol arrives" }];
      if (v === "merch") return [R(0, H / 2 - 20, 20, 40, "a", "Convoy"), { z: "arrow", x1: 24, y1: H / 2, x2: W - 24, y2: H / 2, s: "a", l: "convoy crosses short edge to short edge" },
        { z: "edge", e: "r", s: "a", l: "Convoy exit" }, { z: "edge", e: "t", s: "b", dash: 1, l: "Raiders (agree where)" }];
      if (v === "quick") return [{ z: "ring", cx: W / 2 - 14, cy: H / 2, r: 16, sw: 14, gas: 1 }, R(W / 2 - 8, H / 2 - 10, 26, 20, "a", "Patrol"),
        ...EDGES4("b", "Aliens close in from every edge"), { z: "edge", e: "r", s: "a", l: "Escape edge (chosen before play)" }];
      if (v === "haven") return [{ z: "mark", x: W / 2, y: H / 2, s: "a", l: "Trading haven" }, { z: "circ", cx: W / 2, cy: H / 2, r: 14, s: "a", l: "" },
        R(W / 2 + 24, H / 2 - 20, 30, 40, "b", "Attackers"), { z: "edge", e: "l", s: "a", l: "Patrol enters to the rescue" }];
      return [R(W * .45, H * .1, W * .5, H * .58, "b", "Enemy fleet gathering\n(unaware at first)"), { z: "edge", e: "l", s: "a", l: "Patrol arrives — and must get out again" },
        { z: "text", x: W / 2, y: H * .84, l: "1 intel point per enemy ship\nwithin 30 cm of a patrol ship", s: "a" }];
    },
    mapNote: v => ({ show: "Deploy as in Cruiser Clash, or one fleet in a corner and the other in the opposite corner.", prize: "Both fleets enter from opposite long edges.", mark: "The article suggests using a modified Hunter and the Prey or The Bait.", merch: "The convoy crosses the full 180 cm length.", quick: "The patrol starts in the centre beside a large gas or dust cloud.", haven: "The attack is already under way when the patrol arrives.", flood: "Sketch of the idea: the article gives no deployment." }[v]),
    steps: [
      { t: "Build both fleets by the guidelines (Forces). Generate the battlezone with the rulebook, or set it for the story — near a planet, among asteroids, beside an anomaly." },
      { t: "Deploy as in Cruiser Clash (RB p. 128), or put the fleets in opposite corners.", only: ["show"] },
      { t: "Place the prize — a striking object, ship, hulk or even a planet — in the centre of the table.", only: ["prize"] },
      { t: "Both fleets enter from opposite long edges.", only: ["prize"] },
      { t: "Set up as a modified Hunter and the Prey (FL p. 202) or The Bait (RB p. 130): the pirates in a strong defensive position, the patrol forced to search and engage.", only: ["mark"] },
      { s: "a", t: "Set up the convoy and its escort to cross from one short edge to the other (180 cm).", only: ["merch"] },
      { s: "b", t: "Set up to intercept the convoy; the sketch leaves where to you.", only: ["merch"] },
      { s: "a", t: "Place your fleet in the centre of a 180 × 120 cm table, next to a large gas or dust cloud (or anything striking). Agree which short edge you must escape from.", only: ["quick"] },
      { s: "b", t: "Your alien ships come in from all around the table.", only: ["quick"] },
      { t: "Place the trading haven (a space station) with some defending transports and escorts.", only: ["haven"] },
      { s: "b", t: "Set up already attacking the haven.", only: ["haven"] },
      { s: "a", t: "Enter from a table edge to save the station.", only: ["haven"] },
      { s: "b", t: "Set up your gathering fleet; it does not know the patrol is there at first.", only: ["flood"] },
      { s: "a", t: "Enter the table to gather intelligence.", only: ["flood"] },
      { t: "No first turn is given — roll off." }
    ],
    notes: v => ["The author calls these scenarios “very biased”: quick sketches for fun, not balanced battles. Fill the gaps (first turn, table edges, game length) by agreement."].concat(v === "prize" ? ["How long to hold the prize is given as “1–2 turns” — agree which before play."] : []).concat(v === "quick" ? ["The sketch gives no victory conditions beyond escaping off the chosen edge — agree how many ships must make it."] : []),
    refs: v => [["Cruiser Clash", "RB p. 128"], ["The Bait", "RB p. 130"], ["The Hunter and the Prey", "FL p. 202"], ["Convoy", "RB p. 134"]].filter((r, i) => v === "show" ? i === 0 : v === "mark" ? i === 1 || i === 2 : v === "merch" ? i === 3 : false),
    play: [
      { w: "The prize", t: "The first fleet to touch the prize (or get within about 10 cm) and stay there for 1–2 turns takes it — and then has to get it out.", only: ["prize"] },
      { w: "The convoy", s: "a", t: "Get the convoy from one short edge to the other; at least half of it must survive.", only: ["merch"] },
      { w: "Run", s: "a", t: "Head for the agreed short edge and get off the table.", only: ["quick"] },
      { w: "Intel", s: "a", t: "Each enemy ship that comes within 30 cm of one of your ships gives you an intel point. Only ships that leave the table after the points are collected count.", only: ["flood"] },
      { w: "All game", t: "No scenario rules: fight it out.", only: ["show", "mark", "haven"] }
    ],
    tools: [
      { k: "counter", id: "pa", l: "Patrol: turns holding the prize", s: "a", only: ["prize"] },
      { k: "counter", id: "pb", l: "Opponent: turns holding the prize", s: "b", only: ["prize"] },
      { k: "counter", id: "intel", l: "Intel points", s: "a", goal: 4, res: 1, only: ["flood"] },
      { k: "toggle", id: "out", l: "A patrol ship escaped after collecting the intel", s: "a", only: ["flood"] }
    ],
    end: { show: ["One fleet is destroyed or disengages."], prize: ["A fleet has held the prize and got it away."], mark: ["As the base scenario you picked."], merch: ["The convoy has crossed, or cannot."], quick: ["The patrol has escaped or been destroyed."], haven: ["The station is saved or lost."], flood: ["The patrol has got out, or has been destroyed."] },
    win: { show: ["Standard victory points (RB p. 122) — the sketch gives no other goal."], prize: ["The fleet that takes the prize and gets it out wins."], mark: ["As the base scenario you picked (The Bait: standard victory points)."], merch: ["The convoy must arrive with at least 50% intact."], quick: ["The patrol wins by escaping off the agreed short edge."], haven: ["Save the trading haven — the sketch says no more; agree what counts."], flood: ["4 or more intel points and at least one ship escapes afterwards: patrol victory.", "1–3 points: a draw.", "0 points, or no ship escapes: defeat."] },
    result(st, v) {
      if (v !== "flood") return [null, "Agree the outcome", "This sketch leaves the detail to the players."];
      const p = get(st, "intel", 0), o = get(st, "out", false);
      if (p >= 4 && o) return ["a", "Patrol victory", p + " intel points brought home."];
      if (p >= 1 && o) return ["draw", "Draw", p + " intel points brought home."];
      return [null, o ? "Defeat for the patrol" : "Battle in progress", p + " intel points so far."];
    },
    info: { bg: "Inspired by the old Wing Commander games and by the deep-space patrols in the Battlefleet Gothic background, such as the Oberon and the Despoiler: small fleets built around a carrier or battleship with a few escorts, for evenings without time for a full 1500 pt battle.", cr: [wrCredit(16, HZ), "The next issue followed it with “Patrol Fleet Rules” by Marcin K. Gerkowicz (MKG), Warp Rift 17."] }
  },
  /* ------------------------------------------------------------ DIASPOREX GAMBIT 2 */
  {
    id: "wr-diasporex-diversions", grp: "committee", name: "Diversions", series: "The Diasporex Gambit · Scenario Two", trust: "committee",
    why: "By Roy “horizon” Amkreutz, Warp Rift’s editor. Written for a fan-made Inquisition escort and the fan-made Diasporex fleet; any escort squadron and lone light cruiser will do.",
    src: "Warp Rift 34, pp. 46–47", book: "O", suggest: ["Inquisition", "Diasporex (fan)"],
    others: "Any small boarding-minded escort squadron can hunt any lone light cruiser. The Operations Vessel profile is printed with the scenario (tool in Play); the Metis comes from the fan-made Diasporex list.",
    sides: { a: { n: "Hunter", f: "Inquisition" }, b: { n: "Target", f: "Diasporex (fan list)" } },
    pitch: "In the middle of a huge battle, Inquisitor Lord Crowe’s secret squadron dives through exploding wreckage to capture one intact Diasporex cruiser.",
    glance: [["Points", "Fixed forces"], ["Table", "Not given"], ["Battlezone", "Any, rolled as per the rulebook"], ["First turn", "Hunter"], ["Game ends", "Target boarded or a ship destroyed"]],
    bring: ["3 Inquisitorial Operations Vessels", "1 Diasporex Metis class light combat cruiser", "Explosion templates: 5×10, 10×10 and 10×15 cm for each player"],
    forces: {
      a: ["Jeremiah Crowe, Inquisitor Lord of the Ordo Hereticus: Ld 10, one extra re-roll; Ordo Hereticus boarding and hit-and-run rules (FL p. 131).", "Three Inquisitorial Operations Vessels (fan-made, profile in Play)."],
      b: ["One Metis class light combat cruiser, Ld 8, from the fan-made Diasporex list."]
    },
    draw: (v, W, H) => [
      { z: "mark", x: W / 2, y: H / 2, s: "b", l: "Metis" }, { z: "line", x1: W / 2, y1: 0, x2: W / 2, y2: H / 2 - 6 },
      { z: "edge", e: "t", s: "a", l: "Crowe enters in line with the Metis" },
      R(W * .18, H * .22, 10, 5, "n", ""), R(W * .72, H * .3, 10, 10, "n", ""), R(W * .3, H * .66, 10, 15, "n", ""),
      { z: "text", x: W / 2, y: H * .9, l: "mighty explosions: 5+ cm apart,\n10+ cm from ships", s: "n" }
    ],
    fit: () => [60, 60],
    mapNote: "The explosion templates shown are only examples; players place them in turn.",
    steps: [
      { t: "Roll the battlezone and phenomena as per the rulebook." },
      { s: "b", t: "Place the Metis in the centre of the table." },
      { t: "Each player takes three ‘mighty explosion’ templates: 5×10, 10×10 and 10×15 cm." },
      { t: "Place them one at a time, alternating, the hunter first: at least 5 cm from other explosions and 10 cm from any ship." },
      { s: "a", t: "Your squadron enters from a long edge, on the line straight out from the Metis. You take the first turn." }
    ],
    notes: ["“Either one of the vessels has been destroyed” is read as the Metis or Crowe’s ships; the victory text covers only the Metis — agree what happens if the hunters are wiped out (presumably a hunter loss)."],
    refs: [["Ordo Hereticus", "FL p. 131"], ["Diasporex fleet", "fan-made list (Book of the Void I)"], ["Boarding actions", "RB p. 89"]],
    play: [
      { w: "Moving through an explosion", t: "A ship that moves through a mighty explosion rolls on the explosion table (tool below). Explosions block line of fire." },
      { w: "Every end phase", t: "Each player picks up two explosion templates and places them elsewhere, following the set-up rules." },
      { w: "Goal", s: "a", t: "Board the Metis. Destroying it is only a draw — it has to be salvaged." }
    ],
    fx: () => [[null, "End phase: each player moves two explosion templates"]],
    tools: [
      { k: "roll", id: "boom", l: "Mighty explosion", sub: "D6 when a ship moves through one", rows: () => [[1, 2, "Strength 6 weapon battery attack (6 shots against armour and shields)"], [3, 4, "Strength 3 lance attack"], [5, 5, "Strength 8 weapon battery attack"], [6, 6, "Strength 4 lance attack"]] },
      { k: "html", html: "<h3>Inquisitorial Operations Vessel <span class='muted small'>50 pts · fan-made</span></h3><table class='prof'><tr><th>Type/Hits</th><th>Speed</th><th>Turns</th><th>Shields</th><th>Armour</th><th>Turrets</th></tr><tr><td>Escort/1</td><td>30 cm</td><td>90°</td><td>1</td><td>4+</td><td>2</td></tr></table>" +
        "<ul class='plain small' style='margin-top:6px'><li>Dorsal battery: 30 cm, firepower 2, left/front/right.</li><li>Hidden weapon, chosen secretly at the start: a strength 1 lance, strength 2 torpedoes or a firepower 2 battery — each 30 cm, front.</li><li>Kill team: three or more of them winning a boarding action against a cruiser or larger may skip the damage and inflict Bridge Smashed instead (Synapse Severed on a Tyranid).</li><li>Experienced boarders: +1 in boarding actions; no Space Marine crews.</li></ul>" +
        "<p class='small muted' style='margin:4px 0 0'>Rules by Robert C. Passovoy (Zelnik), WR34 p. 47.</p>" }
    ],
    end: ["Crowe boards the Metis.", "Or one of the ships is destroyed."],
    win: ["Crowe wins by boarding the Metis.", "If the Metis is destroyed it is a draw: he can still salvage it, but loses precious time.", "If he fails, he loses."],
    rtools: [{ k: "ending", id: "how", l: "How did it end?", rows: [["The Metis was boarded", "a"], ["The Metis was destroyed", "draw"], ["Crowe failed", "b"]] }],
    result(st, v, S) { return endingResult(st, S, "how"); },
    info: { bg: "While the Adepta Sororitas and Battlefleet Discordia engage the main Diasporex fleet, Crowe takes a secret squadron after a second group heading out of Discordia. Winning does not matter to him — he wants a battlefield full of explosions as cover, and one Diasporex ship intact.", cr: [wrCredit(34, HZ), "Inquisitorial Operations Vessel: rules by Robert C. Passovoy (Zelnik), ship design by Malika (Vanguard Miniatures), painted by Turbidious Tom.", "Set during horizon’s fan campaign book Book of the Void I: The Discordia Incident."] }
  },
  /* ------------------------------------------------------------ SOLBLADE 1 */
  {
    id: "wr-solblade-1", grp: "committee", name: "The Master Node", series: "Solblades · Scenario One", trust: "committee",
    why: "By Roy “horizon” Amkreutz, Warp Rift’s editor. Written for the Solblade fleet rules from Warp Rift 40; any small, fast Imperial strike group from the books works too.", src: "Warp Rift 40, p. 15", book: "O", suggest: ["Space Marines", "Tyranids"],
    others: SOL_OTHERS, sides: SOL_SIDES,
    pitch: "A Solblade must punch through a feeding hive fleet and land troops to kill the master hive node on the planet below.",
    glance: [["Points", "Solblade 250 · Tyranids 1500"], ["Table", "Not given (60 cm quadrants)"], ["Battlezone", "Inner or primary biosphere"], ["First turn", "Solblade"], ["Game ends", "A landing succeeds or the Solblade dies"]],
    bring: ["Medium planet", "Asteroid fields and gas clouds", "Attack craft or drop pod markers"],
    forces: { a: SOL_A(250), b: SOL_B(1500) },
    draw: (v, W, H) => [
      { z: "line", x1: W / 3, y1: 0, x2: W / 3, y2: H }, { z: "line", x1: 2 * W / 3, y1: 0, x2: 2 * W / 3, y2: H }, { z: "line", x1: 0, y1: H / 2, x2: W, y2: H / 2 },
      { z: "circ", cx: W / 2, cy: H / 2, r: 8 + 45, s: "b", l: "" }, { z: "circ", cx: W / 2, cy: H / 2, r: 8 + 30, s: "n", l: "" },
      { z: "planet", cx: W / 2, cy: H / 2, r: 8, l: "" }, { z: "text", x: W / 2, y: H / 2 - 50, l: "Tyranids: 30–45 cm from the planet’s edge, abeam", s: "b" },
      { z: "edge", e: "l", s: "a", l: "Solblade entry" }, { z: "edge", e: "r", s: "a", l: "or here" },
      { z: "edge", e: "t", s: "n", dash: 1, l: "sunward long edge" }
    ],
    fit: () => [120, 110],
    mapNote: "Each 60 × 60 cm quadrant gets D3−1 asteroid fields and D3−1 gas clouds, placed at random (or set up by agreement).",
    steps: [
      { t: "Place a medium planet in the centre of the table and pick one long edge as sunward." },
      { t: "In each 60 × 60 cm quadrant place D3−1 asteroid fields and D3−1 gas clouds at random — or set up phenomena by agreement." },
      { s: "b", t: "Set up around the planet, 30–45 cm from its edge, every creature abeam of the planet." },
      { s: "a", t: "You enter from either short edge and take the first turn." }
    ],
    refs: SOL_REFS,
    play: [
      { w: "Landing", s: "a", t: "To land, a ship in the planet’s gravity well launches attack craft that must reach the planet’s edge in the ordnance phase. Two Thunderhawks or assault boats are always on standby — no Reload Ordnance needed." },
      { w: "No attack craft", s: "a", t: "Use drop pods instead: two per capital ship, one per escort; the ship must touch the planet template." },
      { w: "Landing roll", s: "a", t: "Roll a D6: 4+ the landing succeeds. Each craft or pod beyond the first two lowers the score needed by 1 (tool below)." },
      { w: "Feeding", s: "b", t: "Every squadron and hive ship must spend one turn on top of the planet before it can move on; at most three squadrons or hive ships feed per turn." }
    ].concat(SOL_PLAY),
    tools: [
      { k: "counter", id: "craft", l: "Craft or pods reaching the planet together", s: "a", start: 2, min: 1, warn: v => "Landing succeeds on a " + Math.max(2, 4 - Math.max(0, v - 2)) + "+" + (v < 2 ? " (fewer than two landing — the source needs at least two)" : "") },
      { k: "num", id: "fed", l: "Tyranid points that have fed", s: "b", after: v => v >= 750 ? "<b>Half the fleet has fed</b> (major victory threshold)" : "Still " + (750 - v) + " pts to half the fleet" },
      DAMAGED
    ],
    end: ["A landing succeeds.", "Or the Solblade is destroyed."],
    win: ["Solblade victory: a successful landing — a major victory if the Tyranids have not fed half their fleet.", "Tyranid victory: the Solblade is destroyed — a major victory if at least 50% of the fleet’s value has fed."],
    notes: ["The landing roll lowers the score needed for each craft beyond the first two; the source does not set a limit — the app stops at 2+."],
    rtools: [{ k: "ending", id: "how", l: "How did it end?", rows: [["The landing succeeded", "a"], ["The Solblade was destroyed", "b"]] }],
    result(st, v, S) { const r = endingResult(st, S, "how"), f = num(st, "fed"); if (r[0] === "a") r[1] += f >= 750 ? "" : " — major victory"; if (r[0] === "b") r[1] += f >= 750 ? " — major victory" : ""; return r; },
    info: { bg: "A tendril of Hive Fleet Nautilon has engulfed an Imperial world and is feeding on it before its next push towards Terra. Intelligence says a master hive node is on the planet; killing it would set the surrounding fleet back, and buy nearby systems a little time.", cr: SOL_CR(40) }
  },
  /* ------------------------------------------------------------ SOLBLADE 2 */
  {
    id: "wr-solblade-2", grp: "committee", name: "Let Them Burn!", series: "Solblades · Scenario Two", trust: "committee",
    why: "By Roy “horizon” Amkreutz, Warp Rift’s editor. Written for the Solblade fleet rules from Warp Rift 40; any small, fast Imperial strike group from the books works too.", src: "Warp Rift 40, p. 16", book: "O", suggest: ["Space Marines", "Tyranids"],
    others: SOL_OTHERS, sides: SOL_SIDES,
    pitch: "A supernova shockwave sweeps across the table. The Tyranids flee it; the Solblade has to hold them back long enough for the wave to do the work.",
    glance: [["Points", "Solblade 250 · Tyranids 1500"], ["Table", "Not given"], ["Battlezone", "Any, rolled as per the rulebook"], ["First turn", "Tyranids"], ["Game ends", "Tyranids destroyed or escaped"]],
    bring: ["A way to mark the shockwave line (a long ruler or tape)", "Blast markers for barrage fire"],
    forces: { a: SOL_A(250), b: SOL_B(1500) },
    draw: (v, W, H) => [
      { z: "sun", e: "l" }, R(0, 0, 30, H, "b", "Tyranids: 30 cm", { rot: -90 }),
      { z: "arrow", x1: 34, y1: H * .82, x2: 64, y2: H * .82, s: "n", l: "" }, { z: "text", x: Math.max(70, W * .42), y: H * .82 - 12, l: "shockwave:\n15 cm per movement phase", s: "n" },
      { z: "edge", e: "t", s: "a", l: "Solblade enters from either long edge" }, { z: "edge", e: "b", s: "a", l: "" },
      { z: "edge", e: "r", s: "b", dash: 1, l: "escape (see note)" }
    ],
    fit: () => [90, 60],
    mapNote: "The shockwave comes in from the short edge behind the Tyranids.",
    steps: [
      { t: "Roll the battlezone and phenomena as per the rulebook, or agree them." },
      { s: "b", t: "Set up within 30 cm of a short edge." },
      { s: "a", t: "You enter from either long edge." },
      { s: "b", t: "The Tyranids take the first turn." }
    ],
    notes: ["The source does not say where the Tyranids escape; the far short edge, away from the wave, is the natural reading."],
    refs: SOL_REFS,
    play: [
      { w: "The shockwave", t: "From the Tyranids’ turn 2 the shockwave enters from the short edge behind them, 15 cm onto the table; at the start of every later movement phase (both players’) it moves 15 cm further. Anything whose stem it reaches is destroyed. The tool below tracks it." },
      { w: "Barrage gunnery", s: "a", t: "Instead of normal battery fire a Solblade ship may lay a barrage: a capital ship places one blast marker per point of battery strength, an escort two, each up to 15 cm away in the weapon’s arc. They may not touch each other and stay through the next end phase." },
      { w: "Goal", s: "b", t: "Get at least half of your fleet’s value away from the wave." }
    ].concat(SOL_PLAY),
    fx: T => T >= 2 ? [[null, "Shockwave: " + (15 + (T - 2) * 30) + " cm after the Tyranid move, " + (30 + (T - 2) * 30) + " cm after the Solblade move"]] : [[null, "No shockwave yet — it arrives in the Tyranids’ turn 2"]],
    tools: [
      { k: "info", html: st => { const T = st.turn; return "<h3>Shockwave, turn " + T + "</h3><p class='calc'>" + (T < 2 ? "Not on the table yet." : "<b>" + (15 + (T - 2) * 30) + " cm</b> in from the Tyranid edge after the Tyranid movement phase, <b>" + (30 + (T - 2) * 30) + " cm</b> after the Solblade’s.") + "</p>"; } },
      { k: "num", id: "esc", l: "Tyranid points escaped", s: "b", after: v => v >= 750 ? "<b>Half the fleet is out</b>" : "Still " + (750 - v) + " pts to half the fleet" },
      DAMAGED
    ],
    end: ["The Tyranid fleet has been destroyed or has escaped."],
    win: ["The Tyranids win by escaping the shockwave with at least 50% of their fleet value.", "Otherwise the Solblade wins."],
    result(st) { const e = num(st, "esc"); return e >= 750 ? ["b", "Tyranid victory", e + " pts escaped."] : [null, "Solblade wins unless half the fleet escapes", e + " pts escaped so far."]; },
    info: { bg: "A supernova shockwave has caught a Tyranid tendril, and the hive mind is fleeing the blast. A daring Solblade is sent to kill the leading hive ship so that the smaller creatures are caught by the wave.", cr: SOL_CR(40) }
  },
  /* ------------------------------------------------------------ SOLBLADE 3 */
  {
    id: "wr-solblade-3", grp: "committee", name: "Kill the Hive", series: "Solblades · Scenario Three", trust: "committee",
    why: "By Roy “horizon” Amkreutz, Warp Rift’s editor. Written for the Solblade fleet rules from Warp Rift 40; any small, fast Imperial strike group from the books works too.", src: "Warp Rift 41, p. 17", book: "O", suggest: ["Space Marines", "Tyranids"],
    others: SOL_OTHERS, sides: SOL_SIDES,
    pitch: "Guns cannot crack this hive ship’s shell. A tiny Solblade has to fight its way aboard and kill it from within.",
    glance: [["Points", "Solblade 175 · Tyranids 1000"], ["Table", "Not given"], ["Battlezone", "Any"], ["First turn", "Solblade"], ["Game ends", "The Solblade boards, or dies"]],
    bring: ["One hive ship (up to 300 pts)"],
    forces: { a: SOL_A(175), b: SOL_B(1000, ["Exactly one hive ship, costing at most 300 pts."]) },
    draw: (v, W, H) => [R(0, 0, 30, H, "b", "Tyranids: 30 cm", { rot: -90 }), R(W - 15, 0, 15, H, "a", "Solblade: 15 cm", { rot: 90 })],
    fit: () => [80, 40],
    steps: [
      { t: "Set up celestial phenomena by the rulebook, or by agreement, in any battlezone." },
      { s: "b", t: "Set up within 30 cm of a short edge." },
      { s: "a", t: "Set up within 15 cm of the opposite short edge. You take the first turn." }
    ],
    refs: SOL_REFS.concat([["Boarding actions", "RB p. 89"]]),
    play: [
      { w: "The hive ship", s: "b", t: "Its shell is so thick that even bombardment cannons and lances cannot damage it." },
      { w: "Boarding", s: "a", t: "Move into base contact to board as usual. Damage is applied and critical hits are rolled, but the critical results are not applied — see the victory conditions." },
      { w: "Hit and run", s: "a", t: "Each successful hit-and-run attack on the hive ship adds +1 to your boarding result." }
    ].concat(SOL_PLAY),
    tools: [{ k: "counter", id: "hr", l: "Successful hit-and-run attacks on the hive ship", s: "a", warn: v => v ? "+" + v + " to the boarding result" : "" }, DAMAGED],
    end: ["The Solblade makes a boarding attack.", "Or the Solblade is destroyed."],
    win: ["The Solblade wins by scoring a critical hit in a boarding action against the hive ship, or by killing it with boarding damage alone.", "The Tyranids win if the Solblade is destroyed."],
    rtools: [{ k: "ending", id: "how", l: "How did it end?", rows: [["Boarding scored a critical or killed the hive ship", "a"], ["The boarding failed", "b"], ["The Solblade was destroyed", "b"]] }],
    notes: ["The game ends when the Solblade makes a boarding attack, so it gets one try; a boarding that scores no critical and does not kill the hive ship is read as a Tyranid win."],
    result(st, v, S) { return endingResult(st, S, "how"); },
    info: { bg: "Other Solblades failed to stop a hive fleet because its leading hive ship shrugged off direct gunfire. The theory: it can only be killed from within.", cr: SOL_CR(41).concat(["Warp Rift 41’s Solblade part two also brought the winners of the Solblade ship competition (wintermans, Harkovast, Grifftofer, Marcus Dunning)."]) }
  },
  /* ------------------------------------------------------------ SOLBLADE 4 */
  {
    id: "wr-solblade-4", grp: "committee", name: "Asteroids?", series: "Solblades · Scenario Four", trust: "committee",
    why: "By Roy “horizon” Amkreutz, Warp Rift’s editor. Written for the Solblade fleet rules from Warp Rift 40; any small, fast Imperial strike group from the books works too.", src: "Warp Rift 41, p. 18", book: "O", suggest: ["Space Marines", "Tyranids"],
    others: SOL_OTHERS, sides: SOL_SIDES,
    pitch: "New bio-ships hurl asteroids at a fortified world. A Solblade and the orbital defences must stop the barrage getting through.",
    glance: [["Points", "Solblade 250 + 250 defences · Tyranids 1500"], ["Table", "Not given"], ["Battlezone", "Primary biosphere"], ["First turn", "Tyranids"], ["Game ends", "8 turns, or one side destroyed"]],
    bring: ["250 pts of high-orbit defences", "Asteroid markers"],
    forces: { a: SOL_A(250).concat(["Plus 250 pts of stationary high-orbit defences (FL p. 496–)."]), b: SOL_B(1500, ["At least one hive ship — preferably more."]) },
    draw: (v, W, H) => [R(0, 0, 15, H, "a", ""), { z: "text", x: 7.5, y: H * .62, l: "Defences: 15 cm", s: "a", rot: -90 }, { z: "mark", x: 6, y: H * .2, s: "a", l: "" }, { z: "text", x: 32, y: H * .2, l: "Solblade", s: "a" },
      R(W - 30, 0, 30, H, "b", "Tyranids: 30 cm", { rot: 90 }), { z: "edge", e: "l", s: "a", l: "Defensive line" },
      { z: "arrow", x1: W - 40, y1: H * .42, x2: W - 90, y2: H * .42, s: "b", l: "thrown asteroids: 25 cm a turn" }],
    fit: () => [80, 40],
    steps: [
      { t: "Primary biosphere: set up phenomena by the rulebook, or by agreement." },
      { s: "a", t: "Pick a short edge as the defensive line. Place the defences within 15 cm of it, and the Solblade in the centre of that edge." },
      { s: "b", t: "Set up within 30 cm of the opposite short edge. You take the first turn." }
    ],
    notes: ["The result bands in the source overlap (“7–10” and “3–7”): exactly 7 or 3 asteroids sits in two bands — agree which before play. Its “+10” is read as more than 10, since 10 is already in 7–10."],
    refs: SOL_REFS.concat([["Planetary defences", "FL p. 496–"]]),
    play: [
      { w: "Throwing asteroids", s: "b", t: "A hive ship or Tyranid cruiser may give up its prow weapons in the shooting phase to throw an asteroid — no asteroid field needed. It flies 25 cm a turn in a straight line and stops at planets, moons and asteroid fields. In a warp rift, D6: on 4+ it scatters 4D6+30 cm from the rift’s centre." },
      { w: "Asteroid hits", t: "An asteroid touching any ship — Tyranids too — rolls 4 dice against the armour it hits; each success is 1 damage. Shields stop hits (place blast markers as for shooting)." },
      { w: "Shooting asteroids", t: "Any ship may shoot them: escorts on the gunnery table, armour 4+, two hits to remove (place a blast marker). Ordnance ignores them." },
      { w: "Turn 8", t: "Last turn." }
    ].concat(SOL_PLAY),
    turnMax: () => 8,
    fx: T => T === 8 ? [[null, "Last turn"]] : [],
    tools: [{ k: "counter", id: "past", l: "Asteroids past the defences", s: "b", res: 1 }, DAMAGED],
    end: ["After eight turns.", "Or the Tyranid fleet, or the Solblade and all defences, are destroyed."],
    win: ["Count the asteroids hurled past the Imperial defences in eight turns.", "More than 10: major Tyranid victory. 7–10: minor Tyranid victory. 3–7: draw. 3 or fewer: Solblade victory."],
    provisional: st => st.turn < 8,
    result(st, v, sc) { const n = get(st, "past", 0), ag = sc ? agV(sc, st, "bands") : "", dflt = !sc || ag === "7 = minor Tyranid victory, 3 = draw";
      if (n > 10) return ["b", "Major Tyranid victory", n + " asteroids got through."];
      if (n >= 8) return ["b", "Minor Tyranid victory", n + " asteroids got through."];
      /* 7 ja 3 ovat lähteessä kahdessa luokassa: oletuksella sovittu luokka, muutetulla sovitulla tekstillä molemmat vaihtoehdot */
      if (n === 7) return dflt ? ["b", "Minor Tyranid victory", "7 asteroids — in two of the source’s bands; agreed: minor Tyranid victory."] : ["draw", "Minor Tyranid victory or draw", "7 asteroids — in two of the source’s bands. Agreed: " + ag + "."];
      if (n >= 4) return ["draw", "Draw", n + " asteroids got through."];
      if (n === 3) return dflt ? ["draw", "Draw", "3 asteroids — in two of the source’s bands; agreed: draw."] : ["a", "Draw or Solblade victory", "3 asteroids — in two of the source’s bands. Agreed: " + ag + "."];
      return ["a", "Solblade victory", n + " asteroids got through."]; },
    info: { bg: "A Tyranid swarm failed to break an Imperial world’s fortified defences — then new bio-ships appeared and began hurling asteroids at the positions. The overwhelmed gunners called for help, and a Solblade was close by.", cr: SOL_CR(41) }
  },
  /* ------------------------------------------------------------ SOLBLADE 5 */
  {
    id: "wr-solblade-5", grp: "committee", name: "Ahbtospar’s Folly", series: "Solblades · Scenario Five", trust: "committee",
    why: "By Roy “horizon” Amkreutz, Warp Rift’s editor. Written for the Solblade fleet rules from Warp Rift 40; any small, fast Imperial strike group from the books works too.", src: "Warp Rift 42, pp. 9–10", book: "O", suggest: ["Space Marines", "Tyranids"],
    others: SOL_OTHERS + " The scenario suggests the Ultramarines Solblade of First Captain Agemman (WR42 p. 9).",
    sides: SOL_SIDES,
    pitch: "First Captain Agemman’s Solblade must run a Tyranid gauntlet to reach a besieged world and open an escape route.",
    glance: [["Points", "Solblade 250 · Tyranids 1500"], ["Table", "Not given"], ["Battlezone", "Primary biosphere"], ["First turn", "Solblade"], ["Game ends", "The Solblade lands, or dies"]],
    bring: ["Medium planet with a 5 cm gas ring"],
    forces: {
      a: SOL_A(250).concat(["Suggested: the Ultramarines Solblade (WR42 p. 9) — Captain Severus Agemman (25 pts, Ld 10, 1 re-roll; Solblade ships within 15 cm use his Leadership; after each successful hit-and-run or boarding, D6 4+: next turn ignore D3 successful Tyranid attacks)."]),
      b: SOL_B(1500, ["At most two hive ships.", "1000 pts start in the corridor, 500 pts near the planet."])
    },
    draw: (v, W, H) => {
      const px = 30, cx = Math.min(W - 15, px + 90);
      return [{ z: "ring", cx: px, cy: H / 2, r: 8 + 12.5, sw: 5, gas: 1 }, { z: "planet", cx: px, cy: H / 2, r: 8, l: "" },
        { z: "mark", x: px + 45, y: H / 2, s: "b", l: "500 pts" },
        R(cx - 4, 0, 8, H / 3, "b", ""), R(cx - 4, H / 3, 8, H / 3, "b", ""), R(cx - 4, 2 * H / 3, 8, H / 3, "b", ""),
        { z: "text", x: cx + 12, y: H / 6, l: "A", s: "b" }, { z: "text", x: cx + 12, y: H / 2, l: "B", s: "b" }, { z: "text", x: cx + 12, y: 5 * H / 6, l: "C", s: "b" },
        { z: "dim", x1: px, y1: H - 10, x2: cx, y2: H - 10, l: "90 cm from the planet" },
        { z: "edge", e: "r", s: "a", l: "Solblade enters" }];
    },
    fit: () => [150, 60],
    mapNote: "The 1000 pt corridor sits 90 cm from the planet; a D6 picks its part: 1–2 A, 3–4 B, 5–6 C.",
    steps: [
      { t: "Primary biosphere. Place a medium planet 30 cm from a short edge, with a 5 cm gas ring 10 cm out from its edge. Add other phenomena by the rulebook or by agreement." },
      { s: "b", t: "Roll a D6 for the corridor part (tool below): 1–2 A, 3–4 B, 5–6 C. Set up 1000 pts there, 90 cm from the planet, facing one long edge." },
      { s: "b", t: "Set up the other 500 pts 45 cm from the planet, facing it." },
      { s: "a", t: "You enter from the short edge furthest from the planet, and take the first turn." }
    ],
    stools: [{ k: "roll", id: "part", l: "Corridor part", sub: "D6", rows: () => [[1, 2, "A — top third"], [3, 4, "B — middle third"], [5, 6, "C — bottom third"]] }],
    notes: ["The success roll is a Leadership test with a modifier; the source does not say whether the modifier applies to the Leadership value or to the dice — agree before play."],
    refs: SOL_REFS,
    play: [{ w: "Goal", s: "a", t: "Reach the planet with at least one ship. How much of the Solblade gets there sets the final Leadership test (tool below)." }].concat(SOL_PLAY),
    tools: [{ k: "num", id: "pts", l: "Solblade points that reached the planet", s: "a", after: v => v <= 0 ? "No ship has arrived yet" : v <= 100 ? "Leadership test <b>−1</b>" : v <= 200 ? "Leadership test, <b>no modifier</b>" : "Leadership test <b>+1</b>" }, DAMAGED],
    end: ["The Solblade lands on the planet.", "Or the Solblade is destroyed."],
    win: ["The Solblade must reach the planet with at least one ship, then pass a Leadership test: −1 if 0–100 pts arrived, no modifier for 101–200, +1 for 201–250.", "The Tyranids win if the Solblade is destroyed."],
    rtools: [{ k: "ending", id: "how", l: "How did it end?", rows: [["Reached the planet and passed the test", "a"], ["Reached it but failed the test", "b"], ["The Solblade was destroyed", "b"]] }],
    result(st, v, S) { return endingResult(st, S, "how"); },
    info: { bg: "In the Fourth Tyrannic War, First Captain Severus Agemman of the Ultramarines leads a Solblade against Hive Fleet Leviathan’s tendril Grendyllus. His force races to Ahbtospar’s Folly to hold its spaceport long enough for priority personnel to escape.", cr: SOL_CR(42).concat(["Ultramarines Solblade ship created and painted by Paul Davies."]) }
  },
  /* ------------------------------------------------------------ SOLBLADE 6 */
  {
    id: "wr-solblade-6", grp: "committee", name: "Do Not Falter!", series: "Solblades · Scenario Six", trust: "committee",
    why: "By Roy “horizon” Amkreutz, Warp Rift’s editor. Written for the Solblade fleet rules from Warp Rift 40; any small, fast Imperial strike group from the books works too.", src: "Warp Rift 42, p. 11", book: "O", suggest: ["Space Marines", "Tyranids"],
    others: SOL_OTHERS, sides: SOL_SIDES,
    pitch: "Three Solblades hold the line while a world evacuates. The hive fleet comes in three waves; every 100 pts that reaches the planet costs lives.",
    glance: [["Points", "Three Solblades (750) · Tyranids 2000"], ["Table", "Not given"], ["Battlezone", "Primary biosphere"], ["First turn", "Tyranids"], ["Game ends", "8 turns, or one side destroyed"]],
    bring: ["Medium planet with a 5 cm gas ring", "The Tyranid fleet split into waves of 750, 750 and 500 pts"],
    forces: { a: ["Up to three Solblades of 250 pts each, 750 pts in all, built with the Solblade rules (WR40 p. 9–14)."], b: SOL_B(2000, ["At least one hive ship.", "Arrives in three waves: 750 pts at the start, 750 pts in wave two, the remaining 500 pts in wave three."]) },
    draw: (v, W, H) => [{ z: "ring", cx: W / 2, cy: H - 15, r: 8 + 12.5, sw: 5, gas: 1 }, { z: "planet", cx: W / 2, cy: H - 15, r: 8, l: "" },
      { z: "circ", cx: W / 2, cy: H - 15, r: 38, s: "a", l: "" }, { z: "text", x: W / 2, y: H - 62, l: "Solblades: within 30 cm of the planet", s: "a" },
      R(0, 0, W, 15, "b", "Tyranid wave one: 750 pts, 15 cm"), { z: "edge", e: "t", s: "b", l: "waves two and three enter here" }],
    fit: () => [90, 80],
    mapNote: "The planet sits 15 cm from one long edge; the Tyranids start on the opposite long edge.",
    steps: [
      { t: "Primary biosphere. Place a medium planet 15 cm from a long edge, with a 5 cm gas ring 10 cm out from its edge. Add other phenomena by the rulebook or by agreement." },
      { s: "a", t: "Place your Solblades facing any way, within 30 cm of the planet’s edge." },
      { s: "b", t: "Deploy 750 pts along the opposite long edge, up to 15 cm onto the table. Keep 750 + 500 pts back as waves two and three." },
      { s: "b", t: "The Tyranids take the first turn." }
    ],
    refs: SOL_REFS.concat([["Planetary assault points", "RB p. 136"]]),
    play: [
      { w: "From turn 2", s: "b", t: "Roll a D6 for wave two: 4+, or 3+ after a failed roll. It moves on from your starting edge. After it arrives, roll for wave three the same way — 4+ first, 3+ after a failure." },
      { w: "Assault points", s: "b", t: "For every 100 pts of Tyranids that reach the planet, score 1 planetary assault point." },
      { w: "Turn 8", t: "Last turn." }
    ].concat(SOL_PLAY),
    turnMax: () => 8,
    fx: (T, st) => {
      const o = [], w2 = get(st, "w2", false), w3 = get(st, "w3", false);
      if (T >= 2 && !w2) o.push(["b", "Wave two: D6 " + (get(st, "f2", false) ? "3+" : "4+")]);
      else if (w2 && !w3) o.push(["b", "Wave three: D6 " + (get(st, "f3", false) ? "3+" : "4+")]);
      if (T === 8) o.push([null, "Last turn"]);
      return o;
    },
    tools: [
      { k: "toggle", id: "f2", l: "A wave two roll has failed (now 3+)", s: "b" }, { k: "toggle", id: "w2", l: "Wave two has arrived", s: "b" },
      { k: "toggle", id: "f3", l: "A wave three roll has failed (now 3+)", s: "b" }, { k: "toggle", id: "w3", l: "Wave three has arrived", s: "b" },
      { k: "counter", id: "ap", l: "Planetary assault points (100 pts each)", s: "b", max: 20, res: 1 }, DAMAGED
    ],
    end: ["After eight turns.", "Or the Tyranid fleet, or the Solblades, are destroyed."],
    win: ["0–7 assault points: the Solblades did enough — the evacuation succeeds.", "8–14: a long, heavy fight on the planet; only part of the evacuation succeeds.", "15–20: the planet is overrun and the Solblades have failed."],
    provisional: st => st.turn < 8,
    result(st) { const p = get(st, "ap", 0); return p <= 7 ? ["a", "Evacuation succeeds", p + " assault points."] : p <= 14 ? ["draw", "Partial evacuation", p + " assault points."] : ["b", "The planet is overrun", p + " assault points."]; },
    info: { bg: "As the evacuation of Ahbtospar’s Folly begins, three Solblades join forces to hold off the hive fleet for as long as they can.", cr: SOL_CR(42) }
  }
  ]);
})();
