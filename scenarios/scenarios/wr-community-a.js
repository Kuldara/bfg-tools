/* Warp Rift community scenarios with play experience (class L3), part A:
   Who Goes There? (WR14), Fannon's Patrol (WR21), the Planet Killer house rule (WR22),
   Minor Engagement (WR22), Commerce Raiders (WR38/40), Nest Raid, Planetary Disease
   and The Corpse (WR49). Summarised in our own words; each scenario hand-made. */
(function () {
  const SI = "Si (Grotesque Misalignment)";
  const SI_INFO = "One of three scenarios Si’s group created and played during their own campaign (Warp Rift 49, p. 3).";
  const TIMER = { k: "timer", id: "clock", l: "Game clock", min: 150 };
  const ALT_PLACE = "Roll off for who places first; then take turns placing one ship at a time.";
  const NO_FIRST = "The scenario’s “First Turn” paragraph only covers who places first — roll off again for the first turn, or agree.";

  addScenarios([
  /* ------------------------------------------------------------ WHO GOES THERE? */
  {
    id: "wr-who-goes-there", grp: "community", name: "Who Goes There?", series: "Hulks and roks", trust: "community",
    why: "Community scenario; the author says their group played it many times — and makes no promise of balance.", src: "Warp Rift 14, pp. 29–30", book: "O", suggest: ["Imperial Navy", "Orks"],
    others: "It is built around an Ork space hulk and roks hidden as asteroids. Any lurking fleet with a single big target can stand in; the surprise is the point.",
    sides: { a: { n: "Imperial investigators", f: "Imperial Navy (one or two players)" }, b: { n: "Hidden Orks", f: "Orks with a space hulk and roks" } },
    pitch: "Imperial ships investigate a silent colony. The asteroids at the far end of the system are not asteroids. Keep this page from the Imperial players!",
    glance: [["Points", "About 1000 each (2–3 hours)"], ["Table", "180 × 120 cm, played lengthways"], ["Battlezone", "Fixed: two planets and rear asteroid clusters"], ["First turn", "Not given"], ["Victory", "Imperials must destroy the hulk"]],
    bring: ["A large planet and a small planet", "Asteroid clusters at the far end", "An Ork space hulk and roks (they start as asteroids)"],
    forces: { a: ["About 1000 pts (the author’s suggestion). Two players may share the Imperial side."], b: ["About 1000 pts including a space hulk and roks.", "Until activated, your ships are the asteroids of the rear clusters."] },
    draw: (v, W, H, st, sc) => { const d = agN(sc, st, "dep"); return [
      R(0, 0, d, H, "a", ""), { z: "text", x: d / 2 + 1.5, y: H / 2, l: "Imperials " + d + " cm", s: "a", rot: -90 },
      { z: "planet", cx: Math.min(45, W * .25), cy: H * .45, r: 7, l: "large planet" }, { z: "planet", cx: Math.max(W * .25 + 40, W - 100), cy: H * .45, r: 4, l: "small planet" },
      { z: "hatch", x: W - 30, y: 12, w: 24, h: 26, l: "" }, { z: "hatch", x: W - 30, y: H / 2 - 13, w: 24, h: 26, l: "" }, { z: "hatch", x: W - 30, y: H - 38, w: 24, h: 26, l: "" },
      { z: "text", x: W - 18, y: 46, l: "1–2", s: "b" }, { z: "text", x: W - 18, y: H / 2 + 20, l: "3–4", s: "b" }, { z: "text", x: W - 18, y: H - 5, l: "5–6", s: "b" },
      { z: "hatch", x: W - 70, y: H - 22, w: 16, h: 14, l: "" },
      { z: "dim", x1: Math.max(30, W - 100), y1: H * .7, x2: W - 40, y2: H * .7, l: "60 cm" }
    ]; },
    fit: () => [150, 90], srcTable: [180, 120],
    mapNote: "Drawn from the article’s sketch: the small planet sits 60 cm from the rear asteroid clusters, numbered for the scan roll.",
    steps: [
      { t: "Set up a 180 × 120 cm table lengthways with the terrain of the sketch: a large and a small planet, and asteroid clusters at the far end." },
      { s: "b", t: "Take the Ork player aside. Your hulk and roks start as asteroids in the rear clusters; do not tell the Imperial players what they face." },
      { s: "a", t: "Deploy within {a:dep} cm of the baseline opposite the clusters (agreed above)." },
      { t: "Brief the Imperial players: contact with a colony has been lost; investigate with caution, and destroy any enemies found." }
    ],
    notes: ["The source gives no first turn, deployment depth or game length — agree them. The author advises the Imperials to move their minimum distance until the enemy is found.", "The author’s first game kept the Imperial players in the dark until the Orks moved — part of the fun."],
    refs: [["Ork hulk", "FL p. 389"], ["Rok", "FL p. 392"], ["Asteroid fields", "RB p. 104–116"]],
    play: [
      { w: "Every turn: scanning", s: "a", t: "Each capital ship rolls a D6; a 6 is a ‘ping’. A ship’s first ping reveals that something is in one of the rear clusters (roll which: 1–2, 3–4, 5–6). The same ship’s second ping confirms enemy ships there — but not what they are." },
      { w: "Activation", s: "b", t: "When an Imperial ship reaches the orbit of the small planet (60 cm from the rear clusters), the Orks wake up and move and fight normally." },
      { w: "Goal", s: "a", t: "Destroy the hulk." }
    ],
    tools: [
      { k: "roll", id: "cl", l: "Which cluster pinged?", sub: "D6 on a ship’s first ping", rows: () => [[1, 2, "Cluster 1–2 (top)"], [3, 4, "Cluster 3–4 (middle)"], [5, 6, "Cluster 5–6 (bottom)"]] },
      { k: "toggle", id: "act", l: "The Orks have woken up", s: "b" }
    ],
    end: ["The hulk is destroyed, or the players agree the game is over."],
    win: ["The Imperials win by destroying the hulk.", "The source names no other result; if the hulk survives, the Orks have won."],
    rtools: [{ k: "ending", id: "how", l: "How did it end?", rows: [["The hulk was destroyed", "a"], ["The hulk survived", "b"]] }],
    result(st, v, S) { return endingResult(st, S, "how"); },
    info: { bg: "A colony has gone silent and an Imperial force is sent to find out why. The author made it to show off home-made hulks and roks — and to surprise players who had no idea what was waiting among the asteroids.", cr: [wrCredit(14, "Alun “Fafrin” Lucas"), "The same issue has their scratch-build article “Cheap Orks: Hulks & Roks”."] }
  },
  /* ------------------------------------------------------------ FANNON'S PATROL */
  {
    id: "wr-fannons-patrol", grp: "community", name: "Fannon’s Patrol", series: "Narrative campaign scenario", trust: "community",
    why: "Community scenario from the author’s narrative campaign, meant to be replayed with different forces.", src: "Warp Rift 21, p. 24", book: "K", suggest: ["Imperial Navy", "Orks"],
    others: "The author suggests Eldar pirates, Chaos or even Imperial ships as the hidden raiders — any fleet with plenty of escorts works.",
    sides: { a: { n: "Patrol", f: "Imperial Navy" }, b: { n: "Pirates", f: "Orks" } },
    pitch: "A patrol sweeps the only safe route through an asteroid belt, hunting a pirate swarm of unknown size hiding in the fields.",
    glance: [["Points", "Fixed patrol · random pirates"], ["Table", "180 × 120 cm"], ["Battlezone", "Fixed: gas planet and three asteroid fields"], ["First turn", "Patrol"], ["Game ends", "A side destroyed or gone"]],
    bring: ["A gas planet", "Three 15 × 25 cm asteroid fields", "Paper to note the hidden pirate groups"],
    forces: {
      a: ["Two cruisers (at most one battlecruiser).", "Two squadrons of three Sword frigates."],
      b: ["Choose three escort types, then roll a D6 for each: 1 or 6 = none, 2–5 = that many. Do this twice: two hidden groups (tool below).", "For a really tough game, roll a third group for the third field."]
    },
    draw: (v, W, H) => [
      { z: "planet", cx: 13, cy: 13, r: 8, l: "" }, { z: "text", x: 24 + textLen("gas planet", W) / 2, y: 12, l: "gas planet", s: "n" },
      { z: "hatch", x: 0, y: 0, w: W, h: 4, l: "" }, { z: "edge", e: "t", s: "n", l: "the great asteroid field: leaving here = destroyed" },
      { z: "hatch", x: 30, y: H - 15, w: 25, h: 15, l: "" }, { z: "hatch", x: 80, y: H - 15, w: 25, h: 15, l: "" }, { z: "hatch", x: 130, y: H - 15, w: 25, h: 15, l: "" },
      { z: "text", x: 92, y: H - 22, l: "pirates hide in two of the three fields", s: "b" },
      { z: "edge", e: "l", s: "a", l: "Patrol enters" }, { z: "edge", e: "r", s: "n", dash: 1, l: "open: leaving = escaped" },
      { z: "dim", x1: 0, y1: H - 30, x2: 30, y2: H - 30, l: "30 cm" }
    ],
    fit: () => [160, 60], srcTable: [180, 120],
    mapNote: "Fields 15 × 25 cm, 25 cm apart, against the long edge opposite the planet; the first starts 30 cm from the patrol’s edge.",
    steps: [
      { t: "On a 180 × 120 cm table, place a gas planet in one corner, 5 cm from both edges. That short edge is the patrol’s edge." },
      { t: "On the long edge opposite the planet, place three asteroid fields 15 × 25 cm against the edge: the first 30 cm from the patrol’s edge, then 25 cm apart." },
      { t: "The long edge on the planet’s side is one great asteroid field: any ship leaving it is destroyed. Both short edges are open: leaving there is escaping." },
      { s: "b", t: "Roll your two hidden groups (tool below) and write down their ships and which field each hides in. Keep it secret." },
      { s: "a", t: "Enter from the short edge nearest the planet on turn 1. You go first." }
    ],
    stools: [{ k: "shiproll", id: "orks", l: "Pirate groups — D6 per escort type", cl: "Rolls (3 per group)", il: i => "Group " + (Math.floor(i / 3) + 1) + ", type " + (i % 3 + 1), out: d => d === 1 || d === 6 ? "none" : d + " escorts" }],
    refs: [["Victory points", "RB p. 122"]],
    play: [
      { w: "Hidden pirates", s: "b", t: "Your groups lie near the edge of their fields, running silent. You may attack at any time; when a group attacks, every ship in that field is revealed — the other group only if it also attacks that turn." },
      { w: "Leaving the table", t: "Over the great asteroid field: destroyed. Over a short edge: escaped." }
    ],
    end: ["One side has been destroyed or has left the table."],
    win: ["Standard victory points, but only for destroyed and crippled ships — escaped ships count for neither side."],
    result() { return [null, "Count victory points", "Only destroyed and crippled ships count."]; },
    info: { bg: "The last convoy to Laura’s Planet barely outran a swarm of pirate ships. Fleet-Admiral Fannon, bragging of past victories, talks Admiral Smithson into sending a patrol to clear the only safe route through the asteroids.", cr: [wrCredit(21, "Reg Steiner"), "From the author’s narrative campaign of Imperial resettlement in Ork-held space."] }
  },
  /* ------------------------------------------------------------ PLANET KILLER HOUSE RULE */
  {
    id: "wr-planet-killer-defence", grp: "community", name: "Planetary Defence", series: "From a battle report", trust: "community", type: "Battle report",
    why: "Not a written scenario: a battle report in which the players made up quick rules for the Planet Killer. The Fleets book has the official rule for exactly this game — the Planet Killer in Exterminatus (FL p. 254) — so that is the default here.", src: "Warp Rift 22, pp. 8–11", book: "O", suggest: ["Imperial Navy", "Chaos"],
    variants: [["fl", "Fleets book rule (FL p. 254)"], ["report", "As played (report)"]],
    others: "The attacker needs the Planet Killer (FL p. 252), so Chaos; any fleet can defend.",
    sides: { a: { n: "Defenders", f: "Imperial Navy" }, b: { n: "Planet Killer fleet", f: "Chaos (required)" } },
    pitch: "The Planet Killer goes for a defended world. Get it into position and kill the planet; the defenders have to stop it first.",
    glance: v => v === "fl"
      ? [["Points", "2000 each (as played)"], ["Table", "As Exterminatus"], ["Battlezone", "Primary or inner biosphere, a planet"], ["First turn", "Roll-off"], ["Victory", "Planet destroyed, or the Planet Killer stopped"]]
      : [["Points", "2000 each (as played)"], ["Table", "Not given"], ["Battlezone", "Medium planet with gas clouds and asteroids"], ["First turn", "Roll-off"], ["Victory", "Planet destroyed, or standard victory points"]],
    bring: v => v === "fl" ? ["The Planet Killer (FL p. 252)", "A planet", "Low orbit table", "Nova cannon template (Armageddon gun)"] : ["The Planet Killer (FL p. 252)", "Medium planet", "Gas clouds and asteroid fields"],
    forces: v => v === "fl"
      ? { a: ["2000 pts (the report’s size), plus D6×10 pts of planetary defences per 500 pts or part (RB p. 140).", "One capital ship or escort squadron per 500 pts is on patrol and arrives later (RB p. 140–141)."], b: ["2000 pts including the Planet Killer as the exterminator (FL p. 254); it loses no weapons for it."] }
      : { a: ["2000 pts (the report’s size)."], b: ["2000 pts including the Planet Killer."] },
    draw: (v, W, H) => v === "fl"
      ? [{ z: "planet", cx: Math.min(W - 20, 150), cy: H / 2, r: 8, l: "planet" }, R(30, 30, Math.max(0, W - 60), Math.max(0, H - 60), "a", "", { dash: 1 }), { z: "text", x: W / 2, y: 40, l: "defenders: not within 30 cm of an edge", s: "a" },
        R(0, 0, 15, H, "b", ""), { z: "text", x: 9, y: H / 2, l: "Chaos 15 cm", s: "b", rot: -90 }]
      : [{ z: "planet", cx: W * .72, cy: H / 2, r: 8, l: "planet" }, R(W * .7, 0, W * .3, H, "a", "", { dash: 1 }), { z: "text", x: W * .85, y: 14, l: "defenders (as played)", s: "a" },
        R(0, 0, W * .3, H, "b", "", { dash: 1 }), { z: "text", x: W * .15, y: 14, l: "Chaos (as played)", s: "b" }],
    fit: v => v === "fl" ? [100, 80] : [90, 60],
    mapNote: v => v === "fl" ? "Exterminatus set-up (RB p. 140): the planet no more than 150 cm from one short edge, the Chaos fleet within 15 cm of the edge furthest from it." : "The report gives no deployment zones; this sketch follows how the game was set up.",
    steps: [
      { t: "Agree the points (the report used 2000). Battlezone: primary or inner biosphere. Place a planet no more than 150 cm from one short edge (roll its size: 1 small, 2–5 medium, 6 large) and declare a sunward edge (RB p. 140).", only: ["fl"] },
      { s: "a", t: "Pick one capital ship or escort squadron per 500 pts to be on patrol, kept off the table. Deploy the rest anywhere, but not within 30 cm of a table edge.", only: ["fl"] },
      { s: "b", t: "Deploy the whole fleet within 15 cm of the edge furthest from the planet. The Planet Killer is your exterminator (FL p. 254).", only: ["fl"] },
      { t: "Set out the low orbit table. Roll off: the higher roll chooses to go first or second.", only: ["fl"] },
      { t: "Agree the points (the report used 2000). Place a medium planet with some gas clouds and asteroid fields around it.", only: ["report"] },
      { t: "Roll off: the winner chooses to set up first or second (in the report the Chaos player chose second).", only: ["report"] },
      { s: "a", t: "Set up around the planet.", only: ["report"] },
      { s: "b", t: "Set up facing the defenders, the Planet Killer’s group angled towards the planet.", only: ["report"] },
      { t: "Roll off again for the first turn.", only: ["report"] }
    ],
    notes: v => v === "fl"
      ? ["The players’ own quick rules (6+, reload, then 5+) are the other version. The Fleets book’s rule for this exact situation — the Planet Killer as an exterminator — is used here.", "The report’s analysis: the Chaos player could only win by bombing the planet and disengaging — a single huge ship is not a good fleet."]
      : ["These were the players’ “rudimentary rules” for one game; they never fixed zones, game length or how often the shot may be tried. The report’s pattern: 6+ on the first try, then reload, then 5+ on each later try.", "The report’s analysis: the Chaos player could only win by bombing the planet and disengaging — a single huge ship is not a good fleet."],
    refs: v => v === "fl" ? [["Exterminatus", "RB p. 140–141"], ["The Planet Killer", "FL p. 252–254"], ["Low orbit", "RB p. 116"]] : [["The Planet Killer", "FL p. 252"], ["Reload Ordnance", "RB p. 46"]],
    play: [
      { w: "Destroying the planet", s: "b", t: "Two ways (FL p. 254). Low orbit: like any exterminator, enter low orbit; at the start of each turn the Planet Killer is within 60 cm of the planet table edge, the planet is destroyed — no 4+ roll needed.", only: ["fl"] },
      { w: "Armageddon Overcharge", s: "b", t: "Or declare a charge for three consecutive turns: no turning, shooting or special orders, +2 shields. After movement in the third turn fire the nova cannon template 60 cm straight ahead; the first planet or moon its centre hole touches is removed on 2+ in D3 turns (FL p. 253).", only: ["fl"] },
      { w: "Losing the gun", s: "b", t: "If the Armageddon gun cannot be used for any reason, the Planet Killer can no longer exterminate and Chaos loses (FL p. 254).", only: ["fl"] },
      { w: "Patrols", s: "a", t: "At the start of each of your turns roll for each patrol not yet in play: speed up to 20 cm arrives on 5+, 25 cm on 4+, 30 cm or more on 3+, on a random table edge (RB p. 141).", only: ["fl"] },
      { w: "Destroying the planet", s: "b", t: "Once the Planet Killer has arrived in orbit, roll a D6 at the start of your next turn: on 6 the planet is destroyed.", only: ["report"] },
      { w: "Trying again", s: "b", t: "The next turn the Planet Killer must reload; after that it may roll again, now needing 5+.", only: ["report"] }
    ],
    tools: [
      { k: "counter", id: "chg", l: "Armageddon Overcharge counters", s: "b", max: 3, only: ["fl"], warn: v => v >= 3 ? "Fire after movement this turn: template 60 cm straight ahead." : "" },
      { k: "toggle", id: "orb", l: "The Planet Killer is in orbit", s: "b" },
      { k: "counter", id: "tries", l: "Attempts made to destroy the planet", s: "b", only: ["report"], warn: v => v === 0 ? "First attempt: 6 destroys the planet." : "Reload next turn, then roll again: 5+ destroys the planet." }
    ],
    end: v => v === "fl" ? ["One fleet disengages, the Planet Killer can no longer exterminate, or the planet is destroyed (RB p. 141, FL p. 254)."] : ["The planet is destroyed, or a fleet disengages or is destroyed."],
    win: v => v === "fl" ? ["The planet destroyed: Chaos wins.", "The Planet Killer destroyed or its gun lost: the defenders win.", "A fleet that disengages loses (RB p. 141)."] : ["Chaos wins by destroying the planet.", "Otherwise standard victory points (RB p. 122) — in the report the Imperial fleet held the field 1362 VP to 350."],
    rtools: [{ k: "ending", id: "how", l: "How did it end?", rows: [["The planet was destroyed", "b"], ["The Planet Killer was destroyed or lost its gun", "a"], ["The defenders disengaged", "b"], ["The Chaos fleet disengaged", "a"]], only: ["fl"] },
      { k: "ending", id: "howr", l: "How did it end?", rows: [["The planet was destroyed", "b"], ["The planet survived — count victory points", "draw"]], only: ["report"] }],
    result(st, v, S) { return endingResult(st, S, v === "fl" ? "how" : "howr"); },
    info: { bg: "Admiral Kratz reports a 2000 pt game in which Cav’s freshly built Planet Killer went for a world defended by Vaaish’s battleship-heavy Imperial fleet. The players wrote quick rules for blowing up the planet; Cav got two attempts, failed both, and lost the fleet.", cr: [wrCredit(22, "Admiral Kratz (report and analysis)"), "Game played by Vaaish (Imperial Navy) and Cav (Chaos)."] }
  },
  /* ------------------------------------------------------------ MINOR ENGAGEMENT */
  {
    id: "wr-minor-engagement", grp: "community", name: "Minor Engagement", series: "A pick-up battle", trust: "community",
    why: "Community scenario the author says they play-tested “quite a bit over the last year and a half”. Book rules only.", src: "Warp Rift 22, p. 29", book: "K", suggest: null,
    others: "Written for any fleets: a bare-knuckle brawl, Cruiser Clash without its limits.",
    sides: { a: { n: "Fleet A" }, b: { n: "Fleet B" } },
    variants: [["corner", "Corner zones"], ["edge", "Edge zones"]],
    pitch: "A quick pick-up battle: roll terrain square by square, pick a corner or an edge, put the whole fleet down at once and fight.",
    glance: [["Points", "Equal, up to 1500"], ["Table", "120 × 120 to 120 × 180 cm"], ["Battlezone", "D6 per 60 × 60 cm square"], ["First turn", "Initiative winner chooses"], ["Game ends", "A fleet disengages or is destroyed"]],
    bring: ["Gas clouds, asteroid fields and one planet, as rolled"],
    forces: { a: ["Equal points, up to 1500. No other restrictions."], b: ["Equal points, up to 1500. No other restrictions."] },
    draw: (v, W, H, st) => {
      const g = gridOf(W, H, 60), t0 = get(st, "terr", null), terr = t0 && t0.length === g.c * g.r ? t0 : null, o = [];
      for (let i = 1; i < g.c; i++) o.push({ z: "line", x1: i * g.sw, y1: 0, x2: i * g.sw, y2: H });
      for (let j = 1; j < g.r; j++) o.push({ z: "line", x1: 0, y1: j * g.sh, x2: W, y2: j * g.sh });
      for (let j = 0; j < g.r; j++) for (let i = 0; i < g.c; i++) {
        const k = j * g.c + i, t = terr ? terr[k] : "?", cx = i * g.sw + g.sw / 2, cy = j * g.sh + g.sh / 2;
        if (t === "Asteroids") o.push({ z: "hatch", x: cx - 12, y: cy - 8, w: 24, h: 16, l: "" });
        if (t === "Gas cloud") o.push({ z: "ring", cx, cy, r: 6, sw: 12, gas: 1 });
        if (t === "Planet") o.push({ z: "planet", cx, cy, r: 7, l: "" });
        o.push({ z: "text", x: cx, y: cy + 14, l: terr ? (k + 1) + ": " + t : "?", s: "n" });
      }
      if (v === "edge") o.push(R(W / 2 - 22.5, 0, 45, 15, "a", ""), { z: "text", x: W / 2 - 17, y: 6, l: "A", s: "a" }, R(W / 2 - 22.5, H - 15, 45, 15, "b", ""), { z: "text", x: W / 2 - 17, y: H - 6, l: "B", s: "b" });
      else o.push(R(W - 30, 0, 30, 30, "a", ""), { z: "text", x: W - 6, y: 6, l: "A", s: "a" }, R(0, H - 30, 30, 30, "b", ""), { z: "text", x: 6, y: H - 6, l: "B", s: "b" });
      return o;
    },
    fit: () => [90, 90],
    mapNote: v => "Terrain is rolled per 60 × 60 cm square (tool below); the exact spot inside a square is up to the players. " + (v === "edge" ? "Edge zones: 45 × 15 cm in the middle of opposite edges." : "Corner zones: 30 × 30 cm in opposite corners."),
    steps: [
      { t: "Pick equal fleets of up to 1500 pts." },
      { t: "Divide the table into 60 × 60 cm squares and roll a D6 for each (tool below): 1 nothing, 2–3 gas/dust cloud, 4–5 asteroid field, 6 planet (only one allowed). Place each inside its square as you like." },
      { t: "Both roll a D6 for initiative. The winner chooses: set up first and take the first turn, or set up second and take the second turn." },
      { t: "The player setting up first picks one of the two zones and places the whole fleet in it; the other player then fills the other zone." }
    ],
    stools: [{ k: "terrain", id: "terr", l: "Terrain per square", sub: "D6 for each 60 × 60 cm square of your table", size: 60, once: 6, rows: [[1, 1, "Nothing", "Empty"], [2, 3, "Gas or dust cloud", "Gas cloud"], [4, 5, "Asteroid field", "Asteroids"], [6, 6, "Planet (only one allowed)", "Planet"]] }],
    notes: ["The article shows two deployment diagrams (corners and edge centres) without saying how to choose between them — agree before play.", "Only one planet is allowed; the terrain tool re-rolls any second planet."],
    refs: [["Cruiser Clash (the scenario it grows from)", "RB p. 128"], ["Sub-plots (optional)", "RB p. 124"], ["Victory points", "RB p. 122"]],
    play: [{ w: "All game", t: "No special rules — a bare-knuckle brawl. Sub-plots are a good addition (Sub-plots tab)." }],
    tools: [],
    end: ["One fleet disengages or is destroyed."],
    win: ["Both fleets score standard victory points (RB p. 122). The higher total wins."],
    result() { return [null, "Count victory points", "Standard victory points, RB p. 122."]; },
    info: { bg: "The author’s write-up of the one-off pick-up games they played most: fast terrain, fast deployment, no special rules — a natural outgrowth of Cruiser Clash without its limits.", cr: [wrCredit(22, "Andy “Ruckdog” Rucker")] }
  },
  /* ------------------------------------------------------------ COMMERCE RAIDERS */
  {
    id: "wr-commerce-raiders", grp: "community", name: "Commerce Raiders", series: "Moose Musings", trust: "community",
    why: "Community scenario, play-tested and updated by its author (Warp Rift 40, p. 47) and reused in later Warp Rift campaigns. Book rules only.", src: "Warp Rift 38, pp. 29–31 · update Warp Rift 40, p. 47", book: "K", suggest: null,
    others: "Written for any fleets: roving capital squadrons against a big convoy. Fleets with their own cargo ships may mix them in (see Forces).",
    sides: { a: { n: "Raiders" }, b: { n: "Convoy" } },
    variants: [["orig", "WR38 original"], ["upd", "WR40 update"]],
    pitch: "Capital ship squadrons fall on a large convoy. Every transport that dies or gets out is worth 100 VP — and the raiders score nothing else.",
    glance: [["Points", "Equal + 1 transport per 100 pts"], ["Table", "180 × 120 cm (WR40: better on 6 × 4)"], ["Battlezone", "D6: 1–3 Outer Reaches, 4–6 Deep Space"], ["First turn", "Raiders"], ["Game ends", "Transports through, dead, or raiders gone"]],
    bring: ["Transports: points ÷ 100, rounded up (e.g. 15 for 1500 pts)"],
    forces: {
      a: ["Up to the agreed points."],
      b: ["Up to the agreed points, plus one standard transport per 100 pts (rounded up) — tool below.", "You may spend fleet points upgrading transports to other cargo ships of the same capacity: two transports become one heavy transport, one transport two fast clippers — but no Q-ships.", "Cargo ships bought from your own fleet list (such as Rogue Trader transports) are normal warships for victory points. Q-ships and such may hide in the convoy — keep track of which is which."]
    },
    draw: (v, W, H) => {
      const sh = v === "upd" ? 30 : 0, cy = H / 2;
      return [R(sh, cy - 7.5, 30, 15, "b", "Convoy"), R(sh + 30, cy - 7.5, 30, 15, "b", "Leaders"),
        R(W - 6, 30, 6, Math.max(4, H - 60), "b", ""), { z: "edge", e: "r", s: "b", l: "Escape corridor (30 cm from each long edge)" },
        { z: "tick", e: "t", list: [1, 2, 3, 4, 5, 6].map(t => [W - 30 * t, "T" + t]).filter(t => t[0] > 4) }, { z: "tick", e: "b", list: [1, 2, 3, 4, 5, 6].map(t => [W - 30 * t, "T" + t]).filter(t => t[0] > 4) },
        { z: "text", x: W / 2, y: 33, l: "raiders enter: corridor edge (turn 1)\nor along the long edges", s: "a" },
        { z: "edge", e: "l", s: "b", dash: 1, l: "rearguard enters turn 2" }];
    },
    fit: () => [120, 75], srcTable: [180, 120],
    mapNote: v => v === "upd" ? "WR40 update: the convoy zones are moved 30 cm up the board to shorten the run. The update’s other “little tweaks” to deployment are not printed." : "Ticks mark how far along the long edges the raiders may enter each turn (30 cm per turn from the corridor end).",
    steps: [
      { t: "Agree a points total. Roll a D6 for the battlezone: 1–3 Outer Reaches, 4–6 Deep Space, and set it up with that generator." },
      { s: "b", t: "Set up first. The Convoy Leaders zone may hold up to a third of your warships’ points; the Convoy zone holds the rest and the transports. Any warships may be kept back as a rearguard." },
      { s: "b", t: "Convoy zones moved 30 cm up the board (WR40 update).", only: ["upd"] },
      { s: "a", t: "No deployment. You move on from the corridor edge or along the long edges (tool in Play), and you go first. At least one unit must come on in turn 1." }
    ],
    stools: [{ k: "num", id: "pts", l: "Agreed points total", s: "b", after: v => v ? "Convoy: <b>" + Math.ceil(v / 100) + " transports</b>" : "Enter the points to get the number of transports" }],
    refs: [["Convoy (the book’s smaller version)", "RB p. 134"], ["Heavy transports", "FL p. 182"], ["Battlezone generators", "RB p. 107–108"]],
    play: [
      { w: "Raider entry", s: "a", t: "Turn 1: from the escape corridor edge, or up to 30 cm along either long edge from that end. Each later turn: 30 cm further along the long edges (not the corridor edge). Units never brought on count as disengaged." },
      { w: "Turn 2", s: "b", t: "The rearguard moves on from the convoy’s board edge." },
      { w: "Scoring", t: "Raiders score only for transports: 100 VP each (plus upgrade points). Escaped transports score the same for the convoy, which also scores normally for raider ships damaged, destroyed or disengaged." }
    ],
    fx: T => [["a", T === 1 ? "Entry: corridor edge, or up to 30 cm along the long edges" : "Entry: up to " + 30 * T + " cm along the long edges"]].concat(T === 2 ? [["b", "Rearguard moves on from the convoy edge"]] : []),
    tools: [
      { k: "counter", id: "dead", l: "Transports destroyed", s: "a", res: 1 },
      { k: "counter", id: "out", l: "Transports through the corridor", s: "b", res: 1 },
      { k: "num", id: "ext", l: "Convoy VP from raider ships (standard)", s: "b", after: v => "" }
    ],
    end: ["Every transport has escaped or been destroyed.", "Or the raiders are destroyed or driven off — transports still on the table then count for the convoy."],
    win: ["Raiders: 100 VP per transport destroyed (plus its upgrade points). Nothing for warships.", "Convoy: 100 VP per transport through the escape corridor (plus upgrades), plus standard VP for raider ships.", "Higher total wins."],
    result(st) {
      const a = get(st, "dead", 0) * 100, b = get(st, "out", 0) * 100 + num(st, "ext");
      return [a === b ? (a ? "draw" : null) : a > b ? "a" : "b", a === b ? (a ? "Level" : "Battle in progress") : (a > b ? "Raiders lead" : "Convoy leads"), "Raiders " + a + " VP – Convoy " + b + " VP (add upgrade points by hand)."];
    },
    info: { bg: "The book’s Convoy is a small affair; this one is about roving capital squadrons hitting commercial traffic — at its most extreme, a planetary assault fleet caught off guard in the outer reaches.", cr: [wrCredit(38, "Italianmoose"), "Update in their “Moose Musings”, Warp Rift 40 (July 2023), after play-tests showed the convoy needed 11–12 turns on a 6 × 4 table.", "Drawing by Christian Schwager; artwork by John “Magelord” Reed."] }
  },
  /* ------------------------------------------------------------ NEST RAID */
  {
    id: "wr-nest-raid", grp: "community", name: "Nest Raid", series: "Stellar fauna", trust: "community",
    why: "Community scenario created and played in the author’s campaign.", src: "Warp Rift 49, p. 37", book: "O", suggest: null,
    others: "Any fleets. Orks find eggs more easily (see Play).",
    sides: { a: { n: "Fleet A" }, b: { n: "Fleet B" } },
    pitch: "A nest of Psultoroth space fauna: harvest as many eggs as you can and get them home in your egg carrier.",
    glance: [["Points", "Any; 500–1250 suggested"], ["Table", "Not given"], ["Battlezone", "Rolled as standard + the nest"], ["First turn", "Not given"], ["Game ends", "At 2 h 30 min"]],
    bring: ["A 15 cm circle for the nest", "Egg tokens"],
    forces: { a: ["Any points; 500–1250 recommended.", "Name one capital ship as the egg carrier."], b: ["Any points; 500–1250 recommended.", "Name one capital ship as the egg carrier."] },
    draw: (v, W, H) => [{ z: "circ", cx: W / 2, cy: H / 2, r: 7.5, s: "n", l: "" }, { z: "text", x: W / 2, y: H / 2 + 14, l: "Psultoroth nest (15 cm)", s: "n" },
      R(0, 0, W, 20, "a", "Fleet A: 20 cm"), R(0, H - 20, W, 20, "b", "Fleet B: 20 cm")],
    fit: () => [60, 70],
    steps: [
      { t: "Roll the battlezone and phenomena as standard. Put the Psultoroth nest, a 15 cm circle, in the centre." },
      { t: "Each player names a capital ship as egg carrier." },
      { t: ALT_PLACE + " Deploy along opposite long edges, within 20 cm." },
      { t: "Start the game clock: the game lasts at most 2 hours 30 minutes." }
    ],
    notes: [NO_FIRST],
    refs: [["Leadership tests", "RB p. 49"], ["Disengaging", "RB p. 56"]],
    play: [
      { w: "End of your turn", t: "Each ship in base contact with the nest, or inside it, takes a Leadership test: a pass harvests one egg. Orks roll 3D6 and keep the two lowest. The egg carrier may not harvest." },
      { w: "Carrying eggs", t: "The carrier holds any number of eggs; every other ship one at a time. Ships within 10 cm of each other at the end of a movement phase may pass eggs (declare it) — to each other or to the carrier, never from the carrier." },
      { w: "Leaving", t: "The carrier may disengage as normal and keeps its eggs; if it is destroyed, its eggs are lost." }
    ],
    tools: [
      { k: "counter", id: "ca", l: "Fleet A: eggs in the carrier", s: "a", res: 1 }, { k: "counter", id: "oa", l: "Fleet A: eggs in other ships", s: "a", res: 1 },
      { k: "counter", id: "cb", l: "Fleet B: eggs in the carrier", s: "b", res: 1 }, { k: "counter", id: "ob", l: "Fleet B: eggs in other ships", s: "b", res: 1 },
      TIMER
    ],
    end: ["After 2 hours 30 minutes at most."],
    win: ["The player holding the most eggs (in any ship) at the end wins.", "Egg VP: 200 per egg in the carrier, 100 per egg in another ship that survived or left. All other VP as normal — the loser may still score more VP overall."],
    result(st) {
      const ea = get(st, "ca", 0) + get(st, "oa", 0), eb = get(st, "cb", 0) + get(st, "ob", 0), va = get(st, "ca", 0) * 200 + get(st, "oa", 0) * 100, vb = get(st, "cb", 0) * 200 + get(st, "ob", 0) * 100;
      return [ea === eb ? (ea ? "draw" : null) : ea > eb ? "a" : "b", ea === eb ? (ea ? "Level on eggs" : "Battle in progress") : (ea > eb ? "Fleet A" : "Fleet B") + " has the most eggs", "Eggs " + ea + " – " + eb + " · egg VP " + va + " – " + vb + "."];
    },
    info: { bg: "Stellar fauna is booming in the sector, and Psultoroth swarms keep savaging cargo fleets. On a routine patrol you find a big nest — and orders to bring back as many eggs as you can, to learn why the creatures are multiplying.", cr: [wrCredit(49, SI), SI_INFO] }
  },
  /* ------------------------------------------------------------ PLANETARY DISEASE */
  {
    id: "wr-planetary-disease", grp: "community", name: "Planetary Disease", series: "Stellar fauna", trust: "community",
    why: "Community scenario created and played in the author’s campaign.", src: "Warp Rift 49, p. 38", book: "O", suggest: null,
    others: "Any fleets. Eldar are more prone to madness, Orks much less (see Play).",
    sides: { a: { n: "Attacker" }, b: { n: "Defender" } },
    pitch: "A world gripped by a madness-inducing plague. Send ships into low orbit to study it — and hope their crews stay sane.",
    glance: [["Points", "Any; 500–1250 suggested"], ["Table", "Not given"], ["Battlezone", "Any, plus a large planet"], ["First turn", "Not given"], ["Game ends", "At 2 h 30 min"]],
    bring: ["A large planet", "Low orbit table (RB p. 116)"],
    forces: { a: ["Any points; 500–1250 recommended."], b: ["Any points; 500–1250 recommended.", "You place the large planet as if it were your last ship."] },
    draw: (v, W, H) => [R(0, 0, 20, H, "a", "Attacker: 20 cm", { rot: -90 }), R(W - 20, 0, 20, H, "b", "Defender: 20 cm", { rot: 90 }),
      { z: "planet", cx: W - 20 - 10 - 12, cy: H / 2, r: 12, l: "" }, { z: "text", x: W - 48, y: H / 2 + 24, l: "large planet, 10 cm\nfrom the defender’s zone", s: "n" }],
    fit: () => [90, 50],
    steps: [
      { t: "Decide who attacks and who defends (the source does not say how — roll off or agree)." },
      { t: "Set up phenomena by the rulebook or by agreement. A large planet is required, 10 cm from the edge of the defender’s zone." },
      { t: ALT_PLACE + " Deploy along opposite short edges, within 20 cm. The defender places the planet as if it were their last ship." },
      { t: "Set up the low orbit table and start the game clock (2 hours 30 minutes at most)." }
    ],
    notes: [NO_FIRST, "The source does not say how attacker and defender are chosen."],
    refs: [["Low orbit table", "RB p. 116"], ["Leadership tests", "RB p. 49"], ["Critical hits table", "RB p. 67"]],
    play: [
      { w: "Attacker scoring", s: "a", t: "+20 scenario VP for each ship that enters low orbit, at once, and +20 for each turn it spends there without going mad." },
      { w: "Defender scoring", s: "b", t: "+20 scenario VP for each of your ships that damages an enemy ship while it is in low orbit in a turn, and +20 for each enemy ship that never enters low orbit." },
      { w: "Start of a ship’s turn in low orbit", t: "Madness test: Leadership minus the hits it has lost this game (escort squadrons: −1 per escort lost). Eldar −1, Orks +2. On a failure roll on the madness table (tool below)." }
    ],
    tools: [
      { k: "roll", id: "mad", l: "Madness", sub: "D6 when a madness test fails", rows: () => [[1, 1, "Listless: next turn the ship may only move at half speed, may not turn and may not shoot."], [2, 2, "Pleasure-seeking: next movement phase it moves straight for the nearest table edge (back to high orbit) and does not shoot."], [3, 3, "Infighting: roll 2D6 on the critical hit table; next phase it may only move at half speed and may not turn."], [4, 4, "Terror: it immediately moves 2D6 cm towards the nearest table edge (back up from low orbit)."], [5, 5, "Reckless: it moves 2D6 cm towards the nearest enemy ship and shoots it at the end of the move."], [6, 6, "Paranoia: it immediately shoots the nearest ship of its own side (allies too) with every weapon that can bear; if none can, roll twice on the critical hit table."]] },
      { k: "counter", id: "va", l: "Attacker: scenario VP", s: "a", res: 1 }, { k: "counter", id: "vb", l: "Defender: scenario VP", s: "b", res: 1 },
      TIMER
    ],
    end: ["After 2 hours 30 minutes at most."],
    win: ["The player with the most scenario VP wins. Other VP are scored as normal — the loser may still have more VP overall."],
    result(st) { const a = get(st, "va", 0), b = get(st, "vb", 0); return [a === b ? (a ? "draw" : null) : a > b ? "a" : "b", a === b ? (a ? "Level" : "Battle in progress") : (a > b ? "Attacker" : "Defender") + " leads", "Scenario VP " + a + " – " + b + "."]; },
    info: { bg: "A world in the sector has been overrun by a bacterium that drives people mad — like the void-borne keytrangis noxum dar, but able to descend from orbit to the ground.", cr: [wrCredit(49, SI), SI_INFO] }
  },
  /* ------------------------------------------------------------ THE CORPSE */
  {
    id: "wr-the-corpse", grp: "community", name: "The Corpse", series: "Stellar fauna", trust: "community", players: 3,
    why: "Community scenario created and played in the author’s campaign; works with more than two fleets.", src: "Warp Rift 49, p. 39", book: "O", suggest: null,
    others: "Any fleets, and any number of them. Orks are keen on dead animals (see Play).",
    sides: { a: { n: "Fleet A" }, b: { n: "Fleet B" } },
    pitch: "The carcass of an ancient space beast drifts in the void. Land harvest squads on it, keep them alive, and get them out again.",
    glance: [["Points", "Any; 500–1250 suggested"], ["Table", "Not given"], ["Battlezone", "Any, plus the corpse"], ["First turn", "Not given"], ["Game ends", "At 2 h 30 min"]],
    bring: ["A corpse model on a 60 mm (battleship) base", "Harvest squad tokens"],
    forces: { a: ["Any points; 500–1250 recommended."], b: ["Any points; 500–1250 recommended.", "More fleets may join — it works as a multiplayer game."] },
    draw: (v, W, H) => [{ z: "mark", x: W / 2, y: H / 2, s: "n", l: "the corpse" }, { z: "circ", cx: W / 2, cy: H / 2, r: 10, s: "n", l: "" },
      R(0, 0, W, 20, "a", "Fleet A: 20 cm"), R(0, H - 20, W, 20, "b", "Fleet B: 20 cm")],
    fit: () => [60, 70],
    steps: [
      { t: "Set up phenomena by the rulebook or by agreement, and put the corpse on its 60 mm base in the centre." },
      { t: ALT_PLACE + " Deploy along opposite long edges, within 20 cm." },
      { t: "Start the game clock: 2 hours 30 minutes at most." }
    ],
    notes: [NO_FIRST, "The Battlezone paragraph says a large planet is required “as described below”, but what follows describes the corpse — read it as the corpse."],
    refs: [["Burn Retros", "RB p. 46"], ["Gunnery table", "RB p. 62"]],
    play: [
      { w: "Landing harvest squads", t: "In the shooting phase a ship within 10 cm of the corpse may launch squads instead of shooting: roll a D6 for the number landed (Orks +2). Each landed squad scores 20 VP, and 20 more for every full turn it stays — banked only when it is extracted." },
      { w: "Extracting", t: "A ship within 10 cm that passes Burn Retros may extract: roll a D6 for the number of squads taken off (your choice which)." },
      { w: "Killing squads", t: "Shoot the corpse: armour 4+, 15 hits, a capital ship closing on the gunnery table. Each hit while squads are on it rolls a D6: 5 kills D3 squads, 6 kills D6 squads. The shooter chooses which — even their own." },
      { w: "The corpse itself", t: "Destroying it scores nothing." }
    ],
    fx: () => [[null, "End of each full turn: +20 VP per squad on the corpse (banked on extraction)"]],
    tools: [
      { k: "counter", id: "sa", l: "Fleet A: squads on the corpse", s: "a" }, { k: "counter", id: "sb", l: "Fleet B: squads on the corpse", s: "b" },
      { k: "num", id: "ba", l: "Fleet A: harvest VP banked", s: "a", after: v => "" }, { k: "num", id: "bb", l: "Fleet B: harvest VP banked", s: "b", after: v => "" },
      { k: "roll", id: "kill", l: "Hit on the corpse with squads aboard", sub: "D6 per hit", rows: () => [[1, 4, "No squads lost"], [5, 5, "D3 squads destroyed"], [6, 6, "D6 squads destroyed"]] },
      TIMER
    ],
    end: ["After 2 hours 30 minutes at most."],
    win: ["The player with the most harvesting VP wins. Other VP still count — the winner may have fewer VP overall."],
    result(st) { const a = num(st, "ba"), b = num(st, "bb"); return [a === b ? (a ? "draw" : null) : a > b ? "a" : "b", a === b ? (a ? "Level" : "Battle in progress") : (a > b ? "Fleet A" : "Fleet B") + " leads", "Banked harvest VP " + a + " – " + b + "."]; },
    info: { bg: "The floating corpse of some ancient space creature has been found, and your fleet is sent to harvest its flesh.", cr: [wrCredit(49, SI), SI_INFO] }
  }
  ]);
})();
