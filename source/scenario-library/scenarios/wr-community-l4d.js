/* Warp Rift community scenarios without play reports (class L4), part D:
   The Trap (WR42), Hive Ship pirate base (WR43), The Engagement at Norduun (WR44),
   The Fall of Hyra (WR45), The Shattered Gate (WR47) and the Battle of Srinagar (WR48).
   Summarised in our own words; each scenario hand-made (see LUEMINUT.md). */
(function () {
  const NO_REPORT = "Community scenario; the source gives no play report.";
  /* The Trap: lyhyemmällä pöydällä puolustaja saapuu myöhemmin (vuoro per täysi 30 cm) */
  const trapDelay = () => Math.max(0, Math.floor((180 - tableWH()[0]) / 30));

  addScenarios([
  /* ------------------------------------------------------------ THE TRAP */
  {
    id: "wr-the-trap", grp: "untested", name: "The Trap", series: "Raid", trust: "untested",
    why: NO_REPORT, src: "Warp Rift 42, p. 38", book: "O", suggest: null,
    others: "Any fleets. Eldar defend with a Haven, Tau with a Kor’vattra orbital city; Tyranids and Necrons always attack.",
    sides: { a: { n: "Raiders", f: "Any fleet" }, b: { n: "Outpost and hidden fleet", f: "Any fleet with high orbit defences" } },
    pitch: "A lonely outpost looks like easy prey. The raiders strike — and a waiting fleet comes in behind them, closing further every turn.",
    glance: [["Points", "Raiders 500 · outpost 250 + 500 reinforcements"], ["Table", "180 × 120 cm (120+ playable)"], ["Battlezone", "D6: 1–2 primary biosphere, 3–6 outer reaches"], ["First turn", "Raiders"], ["Victory", "Victory points"]],
    bring: ["A space station", "Up to 100 pts of other high orbit defences (no mines)"],
    forces: {
      a: ["Up to 500 pts."],
      b: ["High orbit defences up to 250 pts: a space station (150) and up to 100 pts of others — no mines (a minefield gives the trap away).", "Up to 500 pts of ships as reinforcements.", "Eldar: a Haven (200 pts) and nothing else. Tau: a Kor Caste Orbital City instead of the station, with Tau defences."]
    },
    draw: (v, W, H) => { const sx = Math.min(90, W - 30), d = trapDelay(), out = [{ z: "mark", x: sx, y: H / 2, s: "b", l: "station" }, { z: "dim", x1: 0, y1: H / 2 + 8, x2: sx, y2: H / 2 + 8, l: "90 cm" },
        { z: "edge", e: "l", s: "a", l: "Raiders enter (turn 1)" }, { z: "edge", e: "r", s: "b", l: "Reinforcements" }], ticks = [];
      for (let k = 1; W - 30 * k > 0 && k <= 5; k++) ticks.push([W - 30 * k, "T" + (k + 1 + d)]);
      return out.concat([{ z: "tick", e: "t", s: "b", list: ticks }, { z: "tick", e: "b", s: "b", list: ticks }]); },
    fit: () => [120, 60], srcTable: [180, 120],
    mapNote: () => { const d = trapDelay(); return "The ticks show how far along the long edges reinforcements may arrive on each turn" + (d ? " — on this table the defender arrives " + d + " turn" + (d > 1 ? "s" : "") + " late." : "."); },
    steps: [
      { t: "Roll the battlezone (1–2 primary biosphere, 3–6 outer reaches) and place phenomena." },
      { s: "b", t: "Place the station and its defences 90 cm from the raiders’ short edge — the centre of a 180 cm table." },
      { s: "a", t: "Choose the short edge you will enter from on turn 1. You take the first turn." }
    ],
    notes: ["On a shorter table the station stays 90 cm from the raiders’ edge; for each full 30 cm of length lost, the defender arrives one turn later (the map’s ticks follow your table). Not playable under 120 cm.", "With agreed homebrew lists other defences may be used, as long as one station-like defence costs 150–250 pts; still no mines."],
    refs: [["Space station", "FL p. 507"], ["High orbit defences", "FL p. 498–"], ["Haven space station", "FL p. 334"], ["Kor Caste Orbital City", "FL p. 478"]],
    play: [{ w: "Reinforcements", s: "b", t: "Your ships may arrive from turn 1 on your short edge. For each turn after the first they may instead arrive up to 30 cm further along either long edge, measured from your edge." }],
    fx: T => { const d = trapDelay(), t = T - d; return t < 1 ? [["b", "Reinforcements may not arrive yet (shorter table)"]] : t === 1 ? [["b", "Reinforcements: your short edge only"]] : [["b", "Reinforcements: up to " + Math.min(90, 30 * (t - 1)) + (t > 4 ? "+" : "") + " cm along the long edges"]]; },
    tools: [],
    end: ["When one fleet disengages or is destroyed."],
    win: ["Standard victory points for ships and defences crippled or destroyed."],
    result() { return [null, "Count victory points", "Standard victory points, defences included."]; },
    info: { bg: "An isolated outpost seems ripe for a raid. What the raiders don’t know is that a defending fleet is waiting just out of sight for them to commit.", cr: [wrCredit(42, "Francis")] }
  },
  /* ------------------------------------------------------------ HIVE SHIP PIRATE BASE */
  {
    id: "wr-hive-ship-base", grp: "untested", name: "Hive Ship Pirate Base", series: "Tyranids in a campaign", trust: "untested", type: "Scenario set",
    variants: [["raiders", "The Raiders"], ["queen", "Queenslayer"], ["surprise", "Surprise Attack"]],
    why: NO_REPORT + " Campaign rules for a Tyranid vanguard fleet whose base is a single hive ship.", src: "Warp Rift 43, pp. 47–48", book: "O", suggest: ["Any attacker", "Tyranids"],
    others: "Written for Tyranids; any pirate fleet with one big mobile base can use the three set-ups.",
    sides: { a: { n: "Attacker", f: "Any fleet" }, b: { n: "Vanguard fleet", f: "Tyranids" } },
    pitch: v => ({ raiders: "Raid the vanguard fleet’s nest: cripple or destroy the hive ship that serves as its base.", queen: "The hive ship runs for an escape corridor with escort drones in place of the convoy. Kill the queen before she slips away.", surprise: "Catch the vanguard fleet asleep around its hive ship and cripple it before the swarm wakes." })[v],
    glance: v => [["Points", "As the base scenario"], ["Base scenario", { raiders: "The Raiders (RB)", queen: "Commerce Raiders (Warp Rift 38)", surprise: "Surprise Attack (RB)" }[v]], ["Table", "As the base scenario"], ["Tyranids", "Defend, with one hive ship"], ["Choosing", "D6: 1–2 Raiders, 3–4 Queenslayer, 5–6 Surprise Attack"], ["Victory", { raiders: "Cripple or destroy the hive ship", queen: "Hive ship escapes or dies", surprise: "Cripple the hive ship" }[v]]],
    bring: ["A hive ship (the base)"],
    forces: v => ({ a: ["As the base scenario."], b: [v === "surprise" ? "As the base scenario, plus the hive ship for free; it starts on standby like the rest. Planetary defence points may buy escort drones." : "As the base scenario, with one hive ship bought from your points — it is the base, not part of your fleet roster.", "Outfit the hive ship freely, with up to three different Evolutions; the Hive Mind commands it."] }),
    noMap: v => "Set up as " + { raiders: "The Raiders", queen: "Commerce Raiders (in this library)", surprise: "Surprise Attack" }[v] + (v === "surprise" ? ", with the Tyranids around the hive ship instead of a planet." : ".") + " Open it from the link on the Play tab.",
    steps: [{ t: "Roll a D6 (or agree): 1–2 The Raiders, 3–4 Queenslayer, 5–6 Surprise Attack. Pick that version above." }, { t: "Set up the base scenario with the changes listed here." }],
    stools: [{ k: "roll", id: "which", l: "Which scenario?", sub: "D6, rolled by the attacker", rows: () => [[1, 2, "The Raiders"], [3, 4, "Queenslayer"], [5, 6, "Surprise Attack"]] }],
    notes: ["Queenslayer’s escort drones: 10 pts of drones per 100 pts (rounding up), in place of the transports."],
    refs: v => [[{ raiders: "The Raiders", queen: "Commerce Raiders", surprise: "Surprise Attack" }[v], v === "queen" ? "Warp Rift 38 (in this library)" : "RB"], ["Tyranid fleets", "FL p. 430–"], ["Vanguard fleet", "FL p. 429"]],
    play: [
      { w: "The Raiders", only: ["raiders"], t: "Play The Raiders, but the attacker wins by crippling or destroying the hive ship instead of the normal victory conditions." },
      { w: "Queenslayer", only: ["queen"], t: "Play Commerce Raiders. If the hive ship leaves through the escape corridor the Tyranids win; if the attacker destroys it, the attacker wins." },
      { w: "Surprise Attack", only: ["surprise"], t: "Play Surprise Attack with the Tyranids stationed around the hive ship. The attacker must cripple it to win." }
    ],
    tools: [{ k: "html", html: "<p class='calc'>Base scenarios: <a href='#/s/the-raiders/setup'>The Raiders ›</a> · <a href='#/s/wr-commerce-raiders/setup'>Commerce Raiders ›</a> · <a href='#/s/surprise-attack/setup'>Surprise Attack ›</a></p>" },
      { k: "toggle", id: "crip", l: "The hive ship is crippled", s: "a" }, { k: "toggle", id: "dead", l: "The hive ship is destroyed", s: "a" }, { k: "toggle", id: "esc", l: "The hive ship escaped", s: "b", only: ["queen"] }],
    end: ["As the base scenario."],
    win: v => ({ raiders: ["The attacker wins by crippling or destroying the hive ship."], queen: ["The Tyranids win if the hive ship escapes through the corridor; the attacker wins by destroying it."], surprise: ["The attacker wins by crippling the hive ship."] })[v],
    result(st, v, S) { const c = get(st, "crip", false), d = get(st, "dead", false);
      if (v === "queen") return d ? ["a", "Attacker wins", "The hive ship is destroyed."] : get(st, "esc", false) ? ["b", "Tyranids win", "The hive ship escaped."] : [null, "Battle in progress", "Destroy it, or get it out."];
      return d || c ? ["a", "Attacker wins", "The hive ship is " + (d ? "destroyed" : "crippled") + "."] : [null, "Battle in progress", "The hive ship must be " + (v === "surprise" ? "crippled" : "crippled or destroyed") + "."]; },
    info: { bg: "Part of a fuller article adapting the campaign rules to Tyranids: a vanguard fleet raids like pirates from a single hive ship, until a Reinforcement appeal brings a second and it becomes a true hive fleet.", cr: [wrCredit(43, "Fr05ty")] }
  },
  /* ------------------------------------------------------------ NORDUUN */
  {
    id: "wr-norduun", grp: "untested", name: "The Engagement at Norduun", series: "Historical refight", trust: "untested",
    variants: [["veng", "Vengeance grand cruiser"], ["vanq", "Vanquisher alternative"]],
    why: NO_REPORT + " Fixed historical forces; the author notes they are unusual but balance the scenario.", src: "Warp Rift 44, pp. 15–17", book: "O", suggest: ["Imperial Navy", "Chaos"],
    others: "The forces are fixed. Any small raider against a convoy and two hunting groups can use the storm rules.",
    sides: { a: { n: "Imperial raiders", f: "Imperial Navy" }, b: { n: "Chaos convoy and hunters", f: "Chaos" } },
    pitch: "A lone Imperial grand cruiser and four Cobras hunt a Chaos convoy through a storm nebula where nothing can be seen clearly beyond 15 cm.",
    glance: v => [["Points", "Fixed forces"], ["Table", "About 180 × 120 cm"], ["Battlezone", "Deep space generator; storms"], ["Target", v === "vanq" ? "300 VP" : "230 VP"], ["Victory", "VP + the flagship’s fate"]],
    bring: ["12 transports (blips will do)"],
    forces: v => ({
      a: ["Admiral (Ld 9, 1 re-roll).", v === "vanq" ? "Vanquisher battleship with Auxiliary Power Relays and Expert Gunnery, as flagship." : "Vengeance grand cruiser with Expert Gunnery (Lock On test: roll 3D6, drop the highest), as flagship.", "4 Cobras in one squadron."],
      b: ["Force A: Warmaster (Ld 9, 1 re-roll) on a Desolator with Improved Sensor Array; an Endurance (no 6+ prow option); " + (v === "vanq" ? 4 : 3) + " Infidels.", "Force B: an Inferno; 2 torpedo Dauntless in a squadron; " + (v === "vanq" ? 4 : 3) + " Iconoclasts.", "Convoy: 12 transports in one squadron."]
    }),
    draw: (v, W, H) => [R(30, 0, 30, 15, "b", "Convoy →"), R(W - 60, 0, 60, 15, "b", "Chaos B ↙"), R(0, H - 45, 30, 45, "b", "Chaos A ↗"), R(W - 60, H - 45, 60, 45, "a", "Imperials ↖"),
      { z: "corner", c: "tr", r: 8, s: "b", l: "" }, { z: "text", x: W - 12, y: 22, l: "warp gate", s: "b" }],
    fit: () => [150, 90], srcTable: [180, 120],
    mapNote: "From the article’s map; the arrows give each group’s facing. The warp gate sits on the right short edge near the convoy’s corner.",
    steps: [
      { t: "Generate phenomena with the deep space generator (RB battlezones)." },
      { t: "Set up everything fully inside its zone, facing as the arrows show." },
      { t: "Roll Leadership on the RB p. 45 table; transports roll at −1." }
    ],
    notes: ["No first turn or game length is given — roll off, and play until one side is gone or has left.", "The source uses the Remastered refit and crew skill names; Expert Gunnery here works as the author describes."],
    refs: [["Leadership table", "RB p. 45"], ["Deep space battlezone", "RB p. 107–"], ["Gunnery table", "RB p. 62"]],
    play: [
      { w: "Volatile nebulae", t: "Escorts and light cruisers cannot go All Ahead Full; capital ships drop their highest die for the extra distance." },
      { w: "Poor targeting", t: "Batteries always shift one more column right. Lances hit only on 5+." },
      { w: "Unreliable torpedoes", t: "No targets beyond 30 cm. At the start of every ordnance phase roll a D6 per point of each salvo’s strength; each 4+ removes a point — this includes the phase straight after launching." },
      { w: "Keep track!", t: "To shoot a unit that is beyond 15 cm and not on special orders, pass a Leadership test: −1 at 15–30 cm, −2 at 30–45, −3 at 45–60, plus the usual modifiers. Improved Sensor Array gives +1 even with no enemy on special orders; Expert Gunnery applies. Fail, and you may try another target the same way." },
      { w: "Disengaging", t: "Every ship counts as within range of a celestial phenomenon." },
      { w: "The convoy", s: "b", t: "Transports cannot disengage and must head roughly towards the warp gate edge." }
    ],
    tools: [{ k: "counter", id: "tr", l: "Transports destroyed (50 VP each)", s: "a", max: 12 }, { k: "toggle", id: "gc", l: "The Imperial flagship was destroyed", s: "b" }],
    rtools: [{ k: "num", id: "vp", l: "Imperial victory points (transports included)", s: "a", after: v => "" }],
    end: ["Not given — when one side is destroyed or gone."],
    win: v => ["The Imperials score normal victory points; each Chaos transport is worth 50. A disengaged flagship counts as surviving.", "Under " + (v === "vanq" ? 300 : 230) + " VP: Chaos wins — major if the flagship was destroyed. Over: the Imperials win — major if the flagship survived."],
    result(st, v) { const p = num(st, "vp"), lim = v === "vanq" ? 300 : 230, dead = get(st, "gc", false); if (!p) return [null, "Enter the Imperial score", "Victory points on this tab decide it."];
      return p > lim ? ["a", (dead ? "Marginal" : "Major") + " Imperial victory", p + " VP (over " + lim + ")" + (dead ? "; the flagship was lost." : "; the flagship survived.")] : ["b", (dead ? "Major" : "Marginal") + " Chaos victory", p + " VP (not over " + lim + ")" + (dead ? "; the flagship was lost." : "; the flagship survived.")]; },
    info: { bg: "Early M40, Rustroja sector: Chaos supplies must pass the storm-wracked Norduun cluster, one of the few places Imperial raiders can strike them. The Warmaster keeps strong flotillas hunting there — and an Imperial raiding force has just found a convoy.", cr: [wrCredit(44, "Bleachhawk")] }
  },
  /* ------------------------------------------------------------ THE FALL OF HYRA */
  {
    id: "wr-fall-of-hyra", grp: "untested", name: "The Fall of Hyra", series: "Badab War · linked event game", trust: "untested", players: 6, type: "Event",
    why: "Played at the author’s weekend event, linked live to Kill Team and One Page Rules games; on its own, play the space battle and skip the ground effects.", src: "Warp Rift 45, pp. 33–42 (scenario pp. 40–41)", book: "O", suggest: ["Space Marines", "Imperial Navy", "Chaos"],
    others: "The ten pre-made lists mix Space Marine, Navy and Chaos ships. Without the linked games, play the space battle alone and skip the ground effects.",
    sides: { a: { n: "Loyalists", f: "Three players, pre-made lists" }, b: { n: "Secessionists", f: "Three players, pre-made lists" } },
    pitch: "Three against three over a shattered world. Kill teams fight aboard the ships while the fleets above decide what falls on the battle below.",
    glance: [["Points", "Pre-made lists, about 740 each"], ["Table", "180 × 120 cm"], ["Battlezone", "Hyra in the centre, debris fields"], ["Players", "Six (three a side)"], ["Game length", "10 turns"]],
    bring: ["Pre-made fleet lists (below)", "Kill Team and One Page Rules games running alongside (optional)"],
    forces: {
      a: ["Each player picks one of five pre-made lists (about 730–750 pts): mixes of Space Marine strike cruisers, battle barges and Gladius frigates with Navy battlecruisers, cruisers and escorts.", "The side shares 3 re-rolls and acts as one player for turn order."],
      b: ["Each player picks one of five pre-made lists the same way, including some Chaos Acheron and Infidel ships.", "The side shares 2 re-rolls."]
    },
    draw: (v, W, H) => [R(0, 0, W - 10, 25, "b", "Secessionists: 25 cm"), R(0, H - 25, W - 10, 25, "a", "Loyalists: 25 cm"), R(W - 10, 0, 10, H, "b", "escape zone", { dash: 1, rot: 90 }),
       { z: "planet", cx: W / 2, cy: H / 2, r: 9, l: "Hyra" }, { z: "ring", cx: W / 2, cy: H / 2, r: 29, s: "n" },
      { z: "hatch", x: W / 2 - 50, y: H / 2 - 22, w: 12, h: 9, l: "" }, { z: "hatch", x: W / 2 + 30, y: H / 2 - 30, w: 12, h: 9, l: "" }, { z: "hatch", x: W / 2 + 45, y: H / 2 + 12, w: 12, h: 9, l: "" }, { z: "hatch", x: W / 2 - 55, y: H / 2 + 14, w: 12, h: 9, l: "" }],
    fit: () => [150, 90], srcTable: [180, 120],
    mapNote: "From the article’s picture: zones 25 cm deep stopping 10 cm short of one short edge, Hyra in the centre with its 20 cm gravity well (dashed), debris fields around it. The 10 cm strip is read here as the escape zone.",
    steps: [
      { t: "Place Hyra in the centre of a 180 × 120 cm table and scatter debris fields around it." },
      { t: "Take turns placing fleets in your zone, Secessionists first." },
      { t: "When all are placed, each side rolls to see which of its capital ships is hit by a kill team boarding action." }
    ],
    notes: ["The source lets a cruiser give 1 orbital support and a battleship 3, but also says a ship can support only once — agree which applies.", "The escape zone is only shown on the picture; the 10 cm strip is our reading.", "How the side rolls to pick the boarded ship is not given — roll among its capital ships."],
    refs: [["Catastrophic damage table", "RB p. 71"], ["Gravity wells", "RB p. 112–113"]],
    play: [
      { w: "Kill team boarding", t: "The boarded ship’s fate follows the Kill Team game. If the attackers win it, they roll on the table below at once, whatever the phase." },
      { w: "Hyra’s gravity", t: "Hyra has a 20 cm gravity well. A wreck inside it turns 45° towards the planet at the start of its move and after every full 10 cm. A wreck touching the planet is destroyed and removed — and debris rains on the battle below." },
      { w: "Orbital support", t: "A capital ship that stays on the planet’s template a whole turn, doing nothing but Brace, may in the end phase drop troops or bombard the battle below. Next turn it must move at least 5 cm or crash and be destroyed." },
      { w: "Secessionist points", s: "b", t: "1 per orbital support; 1 per capital ship or escort squadron that leaves through the escape zone (a ship still fighting a kill team aboard still counts its result)." },
      { w: "Loyalist points", s: "a", t: "1 per orbital support; 1 per Secessionist capital ship or escort squadron destroyed." }
    ],
    tools: [{ k: "roll", id: "kt", l: "Kill team won the boarding", sub: "D6, rolled by the winner", rows: () => [[1, 2, "Drifting hulk: life support wrecked, the crew can no longer run the ship."], [3, 5, "Plasma drive overload."], [6, 6, "Warp drive implosion."]] },
      { k: "counter", id: "la", l: "Loyalist points", s: "a" }, { k: "counter", id: "sb", l: "Secessionist points", s: "b" }],
    end: ["After 10 turns."],
    win: ["Most points wins."],
    result(st, v, S) { const a = get(st, "la", 0), b = get(st, "sb", 0); return a === b ? ["draw", "Draw", a + " points each."] : [a > b ? "a" : "b", sideName(S, a > b ? "a" : "b") + " win", "Loyalists " + a + " · Secessionists " + b + "."]; },
    info: { bg: "A Badab War event: the moon “Der Rotstern” has struck Hyra, and loyalist and secessionist Space Marines fight over the ruined world. The Battlefleet Gothic table was linked to Kill Team boarding games and a One Page Rules battle on the surface — orbital bombardments, drop pods and falling wrecks crossing between them.", cr: [wrCredit(45, "Chris “DoublebaseFanatic” Kraus"), "The article closes with the author’s questions for improving the cross-game links."] }
  },
  /* ------------------------------------------------------------ THE SHATTERED GATE */
  {
    id: "wr-shattered-gate", grp: "untested", name: "The Shattered Gate", series: "Multiplayer", trust: "untested", players: [2, 3],
    why: NO_REPORT, src: "Warp Rift 47, pp. 27–28", book: "K", suggest: null,
    others: "Any number of fleets. If Eldar are present they guard the Gate.",
    sides: { a: { n: "Contenders", f: "Any fleets" }, b: { n: "Gate’s Protectors", f: "Eldar (if present)" } },
    pitch: "Every fleet in the sector converges on an Eldar webway gate. Take it, destroy it — or, as the Eldar, keep it out of everyone’s hands.",
    glance: [["Points", "750–1250 each"], ["Table", "180 × 120 cm"], ["Battlezone", "Gate in the centre, D6+2 phenomena"], ["Players", "Two or more"], ["Game length", "6 turns"]],
    bring: ["A large webway gate piece", "D6+2 phenomena"],
    forces: { a: ["750–1250 pts each, as agreed."], b: ["If Eldar play, they are the Protectors. They may hold back one escort squadron or one cruiser to come through the Gate."] },
    draw: (v, W, H) => [{ z: "mark", x: W / 2, y: H / 2, s: "b", l: "webway gate" }, { z: "circ", cx: W / 2, cy: H / 2, r: 30, s: "b", l: "" }, { z: "ring", cx: W / 2, cy: H / 2, r: 15, s: "n" },
      R(0, 0, W, 30, "a", "30 cm"), R(0, H - 30, W, 30, "a", "30 cm"), { z: "text", x: W / 2, y: H / 2 + 22, l: "Eldar: within 30 cm", s: "b" }],
    fit: () => [120, 90], srcTable: [180, 120],
    mapNote: "No phenomena within 15 cm of the Gate (dashed). With more than two players, share the long edges as you agree.",
    steps: [
      { t: "Place the Webway Gate in the exact centre, then D6+2 phenomena, none within 15 cm of it." },
      { t: "Roll off: the winner chooses a long edge. Each fleet deploys within 30 cm of its long edge." },
      { s: "b", t: "Eldar deploy last, anywhere within 30 cm of the Gate." }
    ],
    notes: ["“Defender roll for holofields if eldar are not present” is unclear — read here as: without Eldar, roll off for who controls the Gate’s holofield saves.", "How more than two fleets share the long edges is not given."],
    refs: [["Warp rifts", "RB p. 101"], ["Holofields", "FL p. 303"]],
    play: [
      { w: "The Gate", t: "Immobile: 10 hits, armour 6+, holofield, 3 turrets. It never fires, moves or takes orders." },
      { w: "If it is destroyed", t: "Remove it: every ship within 15 cm takes D6 lance hits (shields and armour as normal). A warp rift opens in its place for the rest of the game, and Leadership checks within 15 cm of it are at −1." },
      { w: "Turn 3", s: "b", t: "Bring your held-back squadron or cruiser through the Gate: place it touching the Gate’s base, facing any way; it acts normally." },
      { w: "Controlling the Gate", t: "At the end of the game: at least one of your capital ships within 10 cm of it, with no enemy ship within 10 cm of that ship." }
    ],
    fx: T => T === 3 ? [["b", "Eldar reinforcements come through the Gate"]] : T === 6 ? [[null, "Last turn — check who controls the Gate"]] : [],
    tools: [{ k: "toggle", id: "gone", l: "The Gate is destroyed" }, { k: "html", html: "<p class='calc'>Gate damage: track it on the Gate itself — 10 hits.</p>" }],
    end: ["After 6 turns, or when a fleet disengages."],
    win: ["Normal victory points for ships, plus: destroying the Gate 200; controlling it intact 300 (non-Eldar). Eldar: 300 if it is intact and not under enemy control at the end.", "Most victory points wins."],
    result() { return [null, "Count victory points", "Add the Gate bonus: 200 destroyed, 300 controlled, Eldar 300 if it is intact and free."]; },
    info: { bg: "Above the dead world Cindara II drifts an Eldar webway gate. Imperial intelligence reports Chaos warbands, Ork freebooters and Eldar craftworld ships all converging on it — and the Imperium’s orders are to secure it or destroy it.", cr: [wrCredit(47, "Turbidious Tom")] }
  },
  /* ------------------------------------------------------------ SRINAGAR */
  {
    id: "wr-srinagar", grp: "untested", name: "Battle of Srinagar", series: "Indomitus Crusade era", trust: "untested",
    why: NO_REPORT + " Named ships with fan-made profiles in the same issue; any fleets can play it.", src: "Warp Rift 48, p. 27 (ships p. 7)", book: "O", suggest: ["Imperial Navy", "Chaos (Word Bearers)"],
    others: "Any defender guarding a world against a raid that must land troops and get out again.",
    sides: { a: { n: "Battlegroup Iotus", f: "Imperial Navy" }, b: { n: "Word Bearers", f: "Chaos" } },
    pitch: "Kor Phaeron’s Word Bearers raid an astropathic relay to learn of the Star Child: land troops, then get at least half the fleet out — with a hidden Imperial ship waiting in their path.",
    glance: [["Points", "2000 each"], ["Table", "Not given"], ["Battlezone", "Primary or inner biosphere; two sunward edges"], ["First turn", "Roll off; winner chooses"], ["Victory", "Assault, then escape"]],
    bring: ["A medium planet and a small moon", "The Saint Aster, the Dominant Will and the Cantatum Bellum"],
    forces: {
      a: ["2000 pts, with the Saint Aster as flagship and Group Mistress Athagey as fleet commander.", "Include the Cantatum Bellum."],
      b: ["2000 pts, with the Dominant Will and Kor Phaeron as fleet commander."]
    },
    draw: (v, W, H) => [{ z: "sun" }, { z: "edge", e: "t", s: "n", dash: 1, l: "second sunward edge" }, { z: "planet", cx: W / 2, cy: H / 2, r: 7.5, l: "Srinagar" }, { z: "planet", cx: W / 2 + 7.5 + 15, cy: H / 2 - 8, r: 3, l: "moon" },
      R(30, 30, Math.max(0, W - 60), Math.max(0, H - 60), "a", "", { dash: 1 }), { z: "text", x: W / 2, y: 36, l: "defenders: over 30 cm from every edge", s: "a" },
      R(W - 15, 0, 15, H, "b", "1–3", { dash: 1 }), R(0, H - 15, W - 15, 15, "b", "4–6", { dash: 1 })],
    fit: () => [100, 80],
    mapNote: "Two adjacent sunward edges (left and top here). The attackers roll for one of the other two edges and deploy within 15 cm of it.",
    steps: [
      { t: "Primary or inner biosphere. Place a medium planet in the centre (Srinagar) with a small moon in orbit. Two adjacent edges are sunward." },
      { s: "a", t: "Deploy anywhere more than 30 cm from every edge, on patrol or on standby in high orbit — except the Cantatum Bellum." },
      { s: "b", t: "Decide which non-sunward edge is 1–3 and which 4–6, roll, and deploy within 15 cm of that edge." },
      { s: "a", t: "Place the Cantatum Bellum last, between Srinagar and the attackers, at least 15 cm from every attacking ship." },
      { t: "Roll off: the winner chooses who goes first." }
    ],
    stools: [{ k: "roll", id: "edge", l: "Attackers’ edge", sub: "D6", rows: () => [[1, 3, "The first non-sunward edge"], [4, 6, "The second non-sunward edge"]] }],
    notes: ["The Cantatum Bellum has no profile in the source, and the end of its explosion rule is cut off (“place it in the place of the …”) — agree a ship, and read it as the rift opening where the ship was.", "Athagey and Kor Phaeron have no profiles either; use a fleet commander from each list.", "No table size is given."],
    refs: [["Radiation bursts", "RB p. 115"], ["Warp rifts", "RB p. 101"], ["Catastrophic damage (warp drive implosion)", "RB p. 71"]],
    play: [
      { w: "Every turn", t: "At the start of each turn roll a D6: on 5–6 a radiation burst occurs (RB p. 115)." },
      { w: "Relay interference", t: "No teleport attacks inside Srinagar’s gravity well." },
      { w: "Silent running", s: "a", t: "The Cantatum Bellum cannot be targeted until it attacks or launches ordnance. Until then it moves at half speed and cannot use special orders. If destroyed, treat it as a warp drive implosion, and a warp rift opens in its place." },
      { w: "Planetary assault", s: "b", t: "A capital ship in Srinagar’s gravity well may launch an assault in its turn, doing nothing else (no firing, moving, turning or orders)." },
      { w: "Escape", s: "b", t: "After an assault, leave over a non-sunward edge with at least half your capital ships, the flagship among them." }
    ],
    fx: T => [[null, "Radiation burst on 5–6"]].concat(T === 10 ? [["a", "Last chance: no assault by the end of this turn means an Imperial win"]] : []),
    tools: [
      { k: "html", html: "<h3>Saint Aster · Overlord battlecruiser · 250 pts</h3><table class='ltab'><tr><td>Profile</td><td>Cruiser/8 · 20 cm · 45° · shields 2 · armour 6+ prow / 5+ · turrets 3</td></tr><tr><td>Weapons</td><td>Port and starboard batteries 60 cm, 8 · dorsal lances 45 cm, 3 (left/front/right) · prow torpedoes 30 cm, 6</td></tr></table><h3 style='margin-top:12px'>Dominant Will · cathedral ship · 450 pts</h3><table class='ltab'><tr><td>Profile</td><td>Battleship/12 · 20 cm · 45° · shields 4 · armour 5+ · turrets 4</td></tr><tr><td>Weapons</td><td>Port, starboard and prow batteries 60 cm, 6 each · prow lances 30 cm, 4 · dorsal lances 60 cm, 3 (left/front/right)</td></tr><tr><td>Special</td><td>No Come to New Heading. No Mark of Chaos, but enemy ships and ordnance ending a move within 15 cm count as touching a blast marker. +1 boarding value in defence; hit-and-run attacks against it succeed only on 3+.</td></tr></table>" },
      { k: "toggle", id: "csr", l: "The Cantatum Bellum has revealed itself", s: "a" },
      { k: "toggle", id: "pa", l: "A planetary assault was launched", s: "b" }, { k: "toggle", id: "flag", l: "The Dominant Will was destroyed", s: "a" },
      { k: "toggle", id: "half", l: "At least half the capital ships, flagship included, got out", s: "b" }
    ],
    end: ["When the attackers have assaulted and left, after 10 turns without an assault, or when the Chaos flagship dies."],
    win: ["Word Bearers: launch an assault, then leave with half the capital ships and the flagship. An assault with fewer ships out is only a Pyrrhic victory.", "Imperials: win if there is no assault in 10 turns or the Chaos flagship is destroyed."],
    result(st) { if (get(st, "flag", false)) return ["a", "Imperial victory", "The Dominant Will was destroyed."];
      if (!get(st, "pa", false)) return st.turn > 10 ? ["a", "Imperial victory", "No planetary assault in 10 turns."] : [null, "Battle in progress", "The Word Bearers must land troops."];
      return get(st, "half", false) ? ["b", "Word Bearers win", "Troops landed and the fleet got out."] : [null, "Pyrrhic Word Bearer victory (if they leave)", "Troops landed, but fewer than half the capital ships got out."]; },
    info: { bg: "Kor Phaeron’s Word Bearers, aided by the Black Legion sorcerer Tenebrus, raid the astropathic relay of Srinagar to learn the nature and whereabouts of the Star Child. Warned by the Astra Telepathica and the Inquisition, Group Mistress Athagey’s battlegroup is sent to defend it. The Saint Aster and its commander come from Guy Haley’s novels.", cr: [wrCredit(48, "Gagassi"), "Ship profiles for the Saint Aster and the Dominant Will on p. 7 of the same issue."] }
  }
  ]);
})();
