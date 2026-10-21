/* Classic scenarios: Battlefleet Gothic: Invasion (Games Workshop US, 2002).
   Seven short scenarios for any fleets (The Chart, Conquest, Breakthrough, Head of the Snake,
   Retrieval, Defensive Ring, Port Maw) and two linked with Warhammer 40,000 (Boarding Party, Deadline).
   Written for the original 1999 rules; the booklet's page references point to the old rulebook
   and are given here as their Remastered places.
   The 2002 Annual adds no scenarios of its own (reprints and scenario ideas; see LUEMINUT.md).
   Summarised in our own words; every scenario is hand-made (see LUEMINUT.md). */
(function () {
  const INV = "Battlefleet Gothic: Invasion (Games Workshop US, 2002)";
  const CR = (t, p, pdf) => "Games Workshop US — “" + t + "”, " + INV + ", p. " + p + " (PDF p. " + pdf + ").";
  const OLD = "Written for the original 1999 rules. ";
  const VPOLD = "The booklet’s “standard Victory Points, p. 66” are today RB p. 122.";
  const vp2 = (st, a, b, an, bn, extra) => {
    const A = num(st, a) + ((extra && extra.a) || 0), B = num(st, b) + ((extra && extra.b) || 0);
    if (!A && !B) return [null, "Count victory points", "Enter both totals below."];
    return A === B ? ["draw", "Level", A + " – " + B + " VP."] : [A > B ? "a" : "b", wins(A > B ? an : bn), an + " " + A + " – " + bn + " " + B + " VP."];
  };
  const ALT_SETUP = "Roll off. The higher roll places a ship or squadron first; then take turns until everything is placed. No ship may be placed within 50 cm of an enemy ship.";
  /* opposite long-edge zones of the given depth, drawn for edges chosen by the players */
  const zones = (W, H, d, la, lb) => [R(0, 0, W, d, "b", lb), R(0, H - d, W, d, "a", la)];
  /* Deadline: does the Macro Cannon fire on turn T? Generators destroyed on 40K turns g1..g3 (0 = survived) */
  const cannon = (T, st) => {
    const ev = [get(st, "g1", 0), get(st, "g2", 0), get(st, "g3", 0)].filter(x => x > 0).sort((a, b) => a - b);
    const lost = ev.filter(x => x <= T).length, g = 3 - lost;
    if (g === 0) return [false, "No generators left: the Macro Cannon is dead."];
    if (ev.includes(T)) return [false, "A generator falls this turn: the Macro Cannon cannot fire."];
    const before = ev.filter(x => x < T), last = before.length ? before[before.length - 1] : 0;
    if (!last) return [true, "All three generators run: the Macro Cannon fires."];
    const p = g === 2 ? 2 : 3, fire = (T - (last + 1)) % p === 0;
    return [fire, (fire ? "The Macro Cannon fires" : "The Macro Cannon recharges") + " (" + g + " generator" + (g === 1 ? "" : "s") + " left: every " + (p === 2 ? "other" : "third") + " turn)."];
  };

  addScenarios([
  /* ------------------------------------------------------------ THE CHART */
  {
    id: "cl-inv-chart", grp: "cl-inv", name: "The Chart", series: "Invasion · Scenario", trust: "classic",
    why: "An ambush across an asteroid belt: the attacker has a Rogue Trader’s charts and re-rolls navigation; the defender wins points by getting through.", src: "Invasion p. 2", book: "O", suggest: null,
    others: "Written for any two fleets.",
    sides: { a: { n: "Defender", f: "Any" }, b: { n: "Attacker", f: "Any" } },
    pitch: "A Rogue Trader has sold you charts of an asteroid field beside a trade route. An enemy force is about to pass along it.",
    glance: [["Points", "Equal"], ["Table", "Not given — use your table"], ["Battlezone", "One long asteroid field, 15 cm wide"], ["First turn", "Attacker"], ["Game ends", "After 8 turns, or a fleet is gone"]],
    bring: ["An asteroid field the length of the table, about 15 cm wide"],
    forces: { a: ["Equal points."], b: ["Equal points."] },
    draw: (v, W, H) => {
      const y = H / 2 - 7.5;
      return [
        { z: "hatch", x: 0, y, w: W, h: 15, l: "asteroid field, 15 cm" },
        R(0, 0, W, y, "b", "Attacker: anywhere on this side", { dash: 1 }),
        R(0, y + 15, 20, H - y - 15, "a", "Defender: 20 cm", { rot: -90 }),
        { z: "edge", e: "r", s: "a", dash: 1, l: "Defender’s exit: half value as bonus VP" }
      ];
    },
    fit: () => [100, 70],
    mapNote: "The asteroid field runs along the centre line from short edge to short edge. The attacker sets up on one side of it; the defender on the other, within 20 cm of a short edge. Defending ships that leave by the opposite short edge earn bonus points.",
    steps: [
      { t: "Agree or roll off who attacks." },
      { t: "Place an asteroid field about 15 cm wide along the centre line, from short edge to short edge. The booklet names no other phenomena." },
      { t: ALT_SETUP + " The attacker sets up on one side of the field; the defender on the other, within 20 cm of a short edge." },
      { s: "b", t: "The attacker takes the first turn." }
    ],
    notes: [OLD + "Asteroid fields: the booklet’s p. 44 is RB p. 110. " + VPOLD, "The attacker’s chart: its ships may re-roll a failed Leadership test to cross the asteroid field; the second roll stands. Escorts already have that re-roll (RB p. 110) and gain nothing more."],
    refs: [["Asteroid fields", "RB p. 110"], ["Victory points", "RB p. 122"]],
    play: [
      { w: "The chart", s: "b", t: "Your ships may re-roll a failed Leadership test to cross the asteroid field; the second roll stands. Escorts gain nothing more — they have that re-roll already." },
      { w: "Getting through", s: "a", t: "Every ship that leaves by the short edge opposite your set-up earns you half its points value as bonus victory points." }
    ],
    turnMax: () => 8,
    fx: T => T === 8 ? [[null, "Last turn"]] : [],
    tools: [],
    rtools: [
      { k: "num", id: "av", l: "Defender: victory points (with the exit bonus)", s: "a", after: v => v + " VP" },
      { k: "num", id: "bv", l: "Attacker: victory points", s: "b", after: v => v + " VP" }
    ],
    end: ["After 8 turns, or when a fleet is destroyed or disengages."],
    win: ["Standard victory points.", "The defender adds half the value of every ship that leaves by the short edge opposite its set-up."],
    result(st) { return vp2(st, "av", "bv", "The defender", "The attacker"); },
    info: { bg: "Charts of a hidden passage are worth a fortune to a fleet commander — and a Rogue Trader will sell them to whoever pays. This time they show an asteroid field beside a trade route, and an enemy battle force is due.", cr: [CR("The Chart", 2, 4)] }
  },
  /* ------------------------------------------------------------ CONQUEST */
  {
    id: "cl-inv-conquest", grp: "cl-inv", name: "Conquest", series: "Invasion · Scenario", trust: "classic",
    why: "A race to a planet full of archeotech: at the end, only the points of undamaged ships within 20 cm of it count.", src: "Invasion p. 3", book: "O", suggest: null,
    others: "Written for any two fleets.",
    sides: { a: { n: "First fleet", f: "Any" }, b: { n: "Second fleet", f: "Any" } },
    pitch: "On the planet lie the archives of an unknown race and its forgotten weapons. Two fleets race to claim it.",
    glance: [["Points", "Equal"], ["Table", "Not given — use your table"], ["Battlezone", "A planet in the centre"], ["First turn", "Roll-off"], ["Game ends", "After 8 turns, or a fleet is gone"]],
    bring: ["A planet"],
    forces: { a: ["Equal points."], b: ["Equal points."] },
    draw: (v, W, H) => zones(W, H, 30, "30 cm from your edge", "30 cm from your edge").concat([
      { z: "ring", cx: W / 2, cy: H / 2, r: 28, s: "n" }, { z: "planet", cx: W / 2, cy: H / 2, r: 8, l: "" },
      { z: "text", x: W / 2, y: H / 2 + 17, l: "within 20 cm: scores" }
    ]),
    fit: () => [90, 90],
    mapNote: "The first player picks any table edge; the other takes the opposite one (drawn here on the long edges). Only undamaged ships within 20 cm of the planet score.",
    steps: [
      { t: "Place a planet in the centre of the table." },
      { t: "Roll off. The higher roll picks a zone within 30 cm of any table edge and places a ship or squadron first; the other player uses the opposite edge. Take turns placing; no ship within 50 cm of an enemy ship." },
      { t: "Roll off again. The higher roll chooses to go first or second." }
    ],
    notes: [OLD + "“Within 20 cm of the planet” is measured from the planet’s edge, as ranges are."],
    refs: [["Planets", "RB p. 112"]],
    play: [{ w: "At the end", t: "Add up the points value of your ships within 20 cm of the planet. Crippled ships do not count." }],
    turnMax: () => 8,
    fx: T => T === 8 ? [[null, "Last turn: count the points within 20 cm of the planet"]] : [],
    tools: [],
    rtools: [
      { k: "num", id: "av", l: "First fleet: points of undamaged ships within 20 cm", s: "a", after: v => v + " pts" },
      { k: "num", id: "bv", l: "Second fleet: points of undamaged ships within 20 cm", s: "b", after: v => v + " pts" }
    ],
    end: ["After 8 turns, or when a fleet disengages or is destroyed."],
    win: ["Add the points value of each side’s ships within 20 cm of the planet; crippled and destroyed ships do not count. The higher sum wins."],
    result(st) {
      const A = num(st, "av"), B = num(st, "bv");
      if (!A && !B) return [null, "Count the ships at the planet", "Enter both sums below."];
      return A === B ? ["draw", "Level", A + " – " + B + " pts."] : [A > B ? "a" : "b", wins(A > B ? "The first fleet" : "The second fleet"), A + " – " + B + " pts at the planet."];
    },
    info: { bg: "Somewhere on the world below lie technological archives left by an unknown race — enough archeotech to change the balance of a war. Two fleets have learned of it at the same time.", cr: [CR("Conquest", 3, 5)] }
  },
  /* ------------------------------------------------------------ BREAKTHROUGH */
  {
    id: "cl-inv-breakthrough", grp: "cl-inv", name: "Breakthrough", series: "Invasion · Scenario", trust: "classic",
    why: "Reinforcements with transports punch straight through a blocking force. Every big ship that gets off the far edge is worth 50 points.", src: "Invasion p. 4", book: "O", suggest: null,
    others: "Written for any two fleets.",
    sides: { a: { n: "Convoy Runner", f: "Any" }, b: { n: "Attacker", f: "Any" } },
    pitch: "Reinforcements are on their way to a major offensive elsewhere in the sector. A blocking force has been sent to stall them — or stop them for good.",
    glance: [["Points", "Equal"], ["Table", "Not given — use your table"], ["Battlezone", "The attacker places it"], ["First turn", "D6: 1 runner, 2–6 attacker"], ["Game ends", "After 8 turns, or a fleet is gone"]],
    bring: ["Transports for the runner: up to one per cruiser or escort squadron"],
    forces: { a: ["Equal points.", "Up to one transport for each cruiser or escort squadron."], b: ["Equal points."] },
    draw: (v, W, H) => zones(W, H, 20, "Convoy Runner: 20 cm", "Attacker: 20 cm").concat([
      { z: "arrow", x1: W / 2, y1: H - 26, x2: W / 2, y2: 26, s: "a" }, { z: "text", x: W * .27, y: H / 2, l: "+50 VP per big ship\noff the far edge", s: "a" },
      { z: "edge", e: "t", s: "a", dash: 1, l: "" }
    ]),
    fit: () => [60, 70],
    mapNote: "The players set up within 20 cm of opposite edges — any pair, drawn here on the long edges. The runner’s goal is the attacker’s edge.",
    steps: [
      { t: "Each player rolls a D6 and adds the fleet’s attack rating (Before the battle page). The higher total chooses to be the Attacker or the Convoy Runner." },
      { s: "b", t: "Place any celestial phenomena you want." },
      { t: "The player who chose places a ship or squadron within 20 cm of a table edge; the other player then places one within 20 cm of the opposite edge. Take turns until everything is placed." },
      { t: "Roll a D6 for the first turn (tool below): on a 1 the Convoy Runner goes first, on 2–6 the Attacker." }
    ],
    stools: [{ k: "roll", id: "ft", l: "Who goes first?", rows: () => [[1, 1, "The Convoy Runner"], [2, 6, "The Attacker"]] }],
    notes: [OLD + VPOLD, "“Makes it off the Attacker’s deployment zone” is read as leaving the table by the attacker’s edge."],
    refs: [["Attack ratings", "RB p. 120"], ["Victory points", "RB p. 122"]],
    play: [
      { w: "Getting through", s: "a", t: "+50 VP for each cruiser, each escort squadron whose survivors are worth 150 pts or more, and each transport that leaves by the attacker’s edge." },
      { w: "Stopping them", s: "b", t: "+10% of the points value of every convoy ship crippled or destroyed by the end, on top of the normal victory points." }
    ],
    turnMax: () => 8,
    fx: T => T === 8 ? [[null, "Last turn"]] : [],
    tools: [{ k: "counter", id: "out", l: "Big ships and transports off the attacker’s edge", s: "a", res: 1, warn: v => v ? "+" + v * 50 + " VP to the Convoy Runner." : "" }],
    rtools: [
      { k: "num", id: "av", l: "Convoy Runner: standard victory points", s: "a", after: v => v + " VP" },
      { k: "num", id: "bv", l: "Attacker: standard victory points", s: "b", after: v => v + " VP" },
      { k: "num", id: "bx", l: "Attacker: points value of convoy ships crippled or destroyed", s: "b", after: v => "+" + Math.round(v / 10) + " VP (10%)" }
    ],
    end: ["After 8 turns, or when a fleet disengages or is destroyed."],
    win: ["Standard victory points, plus:", "Convoy Runner: +50 VP for every cruiser, escort squadron with 150+ pts of survivors, and transport that leaves by the attacker’s edge.", "Attacker: +10% of the value of every convoy ship crippled or destroyed."],
    result(st) { return vp2(st, "av", "bv", "The Convoy Runner", "The Attacker", { a: get(st, "out", 0) * 50, b: Math.round(num(st, "bx") / 10) }); },
    info: { bg: "A major offensive is under way in another part of the sector, and fresh ships are racing to join it. The enemy cannot stop the offensive itself — but it can stop the reinforcements.", cr: [CR("Breakthrough", 4, 6)] }
  },
  /* ------------------------------------------------------------ HEAD OF THE SNAKE */
  {
    id: "cl-inv-snake", grp: "cl-inv", name: "Head of the Snake", series: "Invasion · Scenario", trust: "classic",
    why: "Both flagships get +1 Leadership — and lose the whole fleet 2 Leadership if they are crippled. 200 points for the enemy flagship.", src: "Invasion p. 4", book: "O", suggest: null,
    others: "Written for any two fleets.",
    sides: { a: { n: "First fleet", f: "Any" }, b: { n: "Second fleet", f: "Any" } },
    pitch: "Kill the ringleader and the rest falls into disorder. Both admirals know it, and both are aiming for the other’s flagship.",
    glance: [["Points", "Equal"], ["Table", "Not given — use your table"], ["Battlezone", "Placed in turns"], ["First turn", "Roll-off"], ["Game ends", "After 8 turns, or a fleet is gone"]],
    bring: ["A flagship for each fleet"],
    forces: { a: ["Equal points, with a flagship."], b: ["Equal points, with a flagship."] },
    draw: (v, W, H) => zones(W, H, 30, "First fleet: 30 cm", "Second fleet: 30 cm"),
    fit: () => [60, 80],
    mapNote: "The first player picks any table edge; the other takes the opposite one (drawn here on the long edges). Ships set up at least 50 cm from enemy ships.",
    steps: [
      { t: "Roll off. Starting with the higher roll, take turns placing celestial phenomena until all are placed." },
      { t: "Roll off. The higher roll picks a zone within 30 cm of any table edge and places a ship or squadron first; the other uses the opposite edge. Take turns placing; no ship within 50 cm of an enemy ship." },
      { t: "Roll off again. The higher roll chooses to go first or second." }
    ],
    notes: [OLD + VPOLD, "The flagship is the ship carrying the fleet commander. The booklet does not say whether the −2 also applies after a flagship disengages; suggestion: only crippled or destroyed, as written."],
    refs: [["Leadership", "RB p. 45"], ["Victory points", "RB p. 122"]],
    play: [
      { w: "All game", t: "Each flagship has +1 Leadership (10 at most)." },
      { w: "Losing the head", t: "Once your flagship is crippled or destroyed, every other ship and squadron in your fleet is at −2 Leadership for the rest of the game." },
      { w: "At the end", t: "+200 VP if the enemy flagship is crippled, destroyed or has disengaged." }
    ],
    turnMax: () => 8,
    fx: T => T === 8 ? [[null, "Last turn"]] : [],
    tools: [
      { k: "toggle", id: "fa", l: "First fleet’s flagship is crippled or destroyed: −2 Ld for its fleet", s: "a" },
      { k: "toggle", id: "fb", l: "Second fleet’s flagship is crippled or destroyed: −2 Ld for its fleet", s: "b" }
    ],
    rtools: [
      { k: "toggle", id: "xa", l: "First fleet’s flagship crippled, destroyed or disengaged at the end", s: "a" },
      { k: "toggle", id: "xb", l: "Second fleet’s flagship crippled, destroyed or disengaged at the end", s: "b" },
      { k: "num", id: "av", l: "First fleet: standard victory points", s: "a", after: v => v + " VP" },
      { k: "num", id: "bv", l: "Second fleet: standard victory points", s: "b", after: v => v + " VP" }
    ],
    end: ["After 8 turns, or when a fleet disengages or is destroyed."],
    win: ["Standard victory points.", "+200 VP if the enemy flagship is crippled, destroyed or has disengaged at the end."],
    result(st) { return vp2(st, "av", "bv", "The first fleet", "The second fleet", { a: get(st, "xb", false) || get(st, "fb", false) ? 200 : 0, b: get(st, "xa", false) || get(st, "fa", false) ? 200 : 0 }); },
    info: { bg: "Every officer knows the way to throw a fleet into disorder: kill its admiral. Today both sides mean to try.", cr: [CR("Head of the Snake", 4, 6)] }
  },
  /* ------------------------------------------------------------ RETRIEVAL */
  {
    id: "cl-inv-retrieval", grp: "cl-inv", name: "Retrieval", series: "Invasion · Scenario", trust: "classic",
    why: "Six derelicts, one ancient artifact. Search the wrecks, carry it, steal it by boarding — whoever holds it at the end wins.", src: "Invasion p. 6", book: "O", suggest: null,
    others: "Written for any two fleets.",
    sides: { a: { n: "Escort fleet", f: "Any" }, b: { n: "Enemy fleet", f: "Any" } },
    pitch: "The transports carrying an ancient artifact were found as six drifting hulks. One of them still holds it — and an enemy fleet has just arrived.",
    glance: [["Points", "Equal"], ["Table", "Not given — use your table"], ["Battlezone", "Six numbered derelicts + phenomena"], ["First turn", "Roll-off"], ["Game ends", "After 8 turns, or a fleet is gone"]],
    bring: ["Six derelicts (or counters) numbered 1–6 underneath"],
    forces: { a: ["Equal points."], b: ["Equal points."] },
    draw: (v, W, H) => {
      const pts = [[.18, .3], [.42, .24], [.7, .3], [.3, .84], [.58, .8], [.84, .84]];
      return pts.map(([x, y]) => ({ z: "mark", x: W * x, y: H * y, s: "n", l: "?" })).concat([
        { z: "text", x: W / 2, y: H / 2, l: "derelicts: 20 cm apart" }
      ]);
    },
    fit: () => [90, 60],
    mapNote: "An example only: the six derelicts go anywhere, placed blind, at least 20 cm from each other and from the table edges. Ships may then set up anywhere, at least 50 cm from enemy ships.",
    steps: [
      { t: "Number six derelicts (or counters) 1–6 underneath. Take turns placing them face down so neither player knows which is which: at least 20 cm from each other and from the table edges." },
      { t: "Roll off. Starting with the higher roll, take turns placing celestial phenomena." },
      { t: "Roll a D6 for the artifact (tool below): the derelict with that number has it." },
      { t: "Roll off. The higher roll places a ship or squadron first, anywhere on the table; take turns. No ship within 50 cm of an enemy ship." },
      { t: "Roll off again. The higher roll chooses to go first or second." }
    ],
    stools: [{ k: "roll", id: "art", l: "Which derelict holds the artifact?", rows: () => [1, 2, 3, 4, 5, 6].map(n => [n, n, "Derelict number " + n])}],
    notes: [OLD + "Boarding actions: RB p. 89–90. Hulks: RB p. 71.", "The artifact is rolled openly: both players know the number, neither knows which derelict carries it."],
    refs: [["Boarding actions", "RB p. 89–90"], ["Blazing and drifting hulks", "RB p. 71"]],
    play: [
      { w: "Searching", t: "A ship that moves within 5 cm of a derelict turns it over. If its number is the one rolled, that ship now carries the artifact." },
      { w: "Stealing", t: "Reduce the carrier to a hulk and search it the same way — or win a boarding action against it: no damage is done, but the artifact changes hands." },
      { w: "Passing it on", t: "A ship within 5 cm of the carrier may take the artifact over. Only one transfer per turn." }
    ],
    turnMax: () => 8,
    fx: T => T === 8 ? [[null, "Last turn: who holds the artifact?"]] : [],
    tools: [{ k: "ending", id: "hold", l: "Who holds the artifact?", rows: [["Nobody — not found, or on a hulk", "draw", "Nobody"], ["A ship of the escort fleet", "a"], ["A ship of the enemy fleet", "b"]] }],
    rtools: [],
    end: ["After 8 turns, or when a fleet is destroyed or disengages."],
    win: ["The fleet holding the artifact at the end wins.", "If neither holds it, it is a draw."],
    result(st) {
      const i = get(st, "hold", -1);
      if (i === 1) return ["a", "The escort fleet wins", "It holds the artifact."];
      if (i === 2) return ["b", "The enemy fleet wins", "It holds the artifact."];
      return i === 0 ? ["draw", "Draw", "Nobody holds the artifact."] : [null, "Battle in progress", "Mark who holds the artifact on the Play tab."];
    },
    info: { bg: "A small group of transports had recovered an ancient artifact. Their escort reached the rendezvous to find the wreckage of a vicious battle and half a dozen derelicts. As the search began, an enemy fleet appeared.", cr: [CR("Retrieval", 6, 8)] }
  },
  /* ------------------------------------------------------------ DEFENSIVE RING */
  {
    id: "cl-inv-ring", grp: "cl-inv", name: "Defensive Ring", series: "Invasion · Scenario", trust: "classic",
    why: "A strike on an enemy refuelling station ringed with defences. Destroy it for double points; leave it uncrippled and the defender scores.", src: "Invasion p. 7", book: "O", suggest: null,
    others: "Written for any two fleets; the defender needs a space station and orbital defences.",
    sides: { a: { n: "Defender", f: "Any" }, b: { n: "Attacker", f: "Any" } },
    pitch: "The enemy’s hit-and-run raids depend on one refuelling station. Wreck it, and they slow down.",
    glance: [["Points", "Equal; 30%+ of the defender’s in defences"], ["Table", "Not given — use your table"], ["Battlezone", "The defender places it; station in the centre"], ["First turn", "Attacker"], ["Game ends", "After 8 turns, or a fleet is gone"]],
    bring: ["A space station (the refuelling station)", "Orbital defences", "Escorts and a few cruisers"],
    forces: {
      a: ["Equal points. At least 30% on orbital defences, including a space station: the refuelling station.", "The rest on escorts, and up to one cruiser per 750 pts of your fleet."],
      b: ["Equal points, any ships.", "You may launch only six attack craft markers per 750 pts in your fleet over the whole game. Torpedoes do not count."]
    },
    draw: (v, W, H) => [
      { z: "circ", cx: W / 2, cy: H / 2, r: 30, s: "a" }, { z: "mark", x: W / 2, y: H / 2, s: "a", l: "refuelling station" },
      { z: "text", x: W / 2, y: H / 2 + 22, l: "defences and escorts: 30 cm", s: "a" },
      R(0, 0, 20, H, "b", "Attacker: 20 cm from one edge", { rot: -90 })
    ],
    fit: () => [90, 70],
    mapNote: "The refuelling station sits in the centre with its defences and escorts within 30 cm. The attacker sets up within 20 cm of any one table edge.",
    steps: [
      { s: "a", t: "Place any celestial phenomena, then the refuelling station in the centre of the table." },
      { s: "a", t: "Set up the orbital defences and escorts within 30 cm of the station (suggestion: your cruisers too)." },
      { s: "b", t: "Set up within 20 cm of any one table edge." },
      { s: "b", t: "The attacker takes the first turn." }
    ],
    stools: [{ k: "counter", id: "lim", l: "Attacker’s attack craft allowance (6 per 750 pts)", s: "b", start: 12, min: 6 }],
    notes: [OLD + "The booklet’s orbital defences (old p. 147) and space station (old p. 145) are now FL p. 496–515 and FL p. 507. " + VPOLD,
      "Station points as the booklet gives them (a 150 pt station): destroyed, the attacker scores 300 instead of 150; crippled, 150 instead of 37. Uncrippled at the end, the defender scores 150. Use your station’s actual cost if it differs.",
      "“Six stands of ordnance per 750 pts” — suggestion: count per full 750 pts, at least six. Set the allowance above."],
    refs: [["Space station", "FL p. 507"], ["Planetary defences", "FL p. 496–515"], ["Victory points", "RB p. 122"]],
    play: [
      { w: "Ordnance limit", s: "b", t: "Only six attack craft markers per 750 pts may be launched in the whole game (tool below). Torpedoes do not count." },
      { w: "The station", t: "Destroyed: 300 VP to the attacker. Crippled: 150 VP. Intact or only damaged at the end: 150 VP to the defender." }
    ],
    turnMax: () => 8,
    fx: T => T === 8 ? [[null, "Last turn"]] : [],
    tools: [
      { k: "counter", id: "used", l: "Attack craft markers launched", s: "b" },
      { k: "info", html: st => { const l = get(st, "lim", 12), u = get(st, "used", 0); return "<p class='calc' style='margin:0'>" + (u > l ? "<b>Over the limit:</b> " + u + " of " + l + "." : "<b>" + (l - u) + "</b> of " + l + " attack craft markers left.") + "</p>"; } }
    ],
    rtools: [
      { k: "ending", id: "stn", l: "The refuelling station at the end", rows: [["Destroyed", "b", "+300 VP"], ["Crippled", "b", "+150 VP"], ["Intact or only damaged", "a", "+150 VP"]] },
      { k: "num", id: "av", l: "Defender: victory points", s: "a", after: v => v + " VP" },
      { k: "num", id: "bv", l: "Attacker: victory points, not counting the station", s: "b", after: v => v + " VP" },
      { k: "html", html: "<h3>Part of a campaign</h3><ul class='plain'><li>Attacker wins: in the next game, a former defender’s ship that rolls a double on a Leadership test for All Ahead Full or Burn Retros is low on fuel and may not try those orders again that game.</li><li>Defender wins: before the next game, the former attacker rolls a D6 for each capital ship; on a 1 it starts that game one hit down.</li></ul>" }
    ],
    end: ["After 8 turns, or when a fleet disengages or is destroyed."],
    win: ["Standard victory points, with the station scored as above."],
    result(st) { const i = get(st, "stn", -1); return i < 0 ? [null, "Mark the station", "Then enter victory points."] : vp2(st, "av", "bv", "The defender", "The attacker", { a: i === 2 ? 150 : 0, b: i === 0 ? 300 : i === 1 ? 150 : 0 }); },
    info: { bg: "The enemy keeps raiding and running, never standing to fight. Its ships have to refuel somewhere — and that station, heavily defended as it is, could be overwhelmed by a sudden attack.", cr: [CR("Defensive Ring", 7, 9)] }
  },
  /* ------------------------------------------------------------ PORT MAW (INVASION) */
  {
    id: "cl-inv-port-maw", grp: "cl-inv", name: "Port Maw", series: "Invasion · Scenario", trust: "classic",
    why: "A desperate fleet falls on an enemy base crippled by solar flares: four times outnumbered, but the defenders are stuck in their docks.", src: "Invasion p. 8–9", book: "O", suggest: ["Chaos", "Imperial Navy"],
    others: "Written for a Chaos strike on the Imperial base of Port Maw; any fleet can attack any base. The booklet admits it is not balanced.",
    sides: { a: { n: "Defender", f: "Imperial Navy" }, b: { n: "Attacker", f: "Chaos" } },
    pitch: "Solar flares have blinded Port Maw and dropped its shields. A warp rift opens nearby, and the fleet the Imperium nearly destroyed sees its chance.",
    glance: [["Points", "Defender: 4 × the attacker"], ["Table", "Room for a 60 × 60 cm station"], ["Battlezone", "Port Maw in the centre"], ["First turn", "Attacker"], ["Game ends", "After 12 turns, or a fleet is gone"]],
    bring: ["Port Maw: a station about 60 × 60 cm (books or foam will do)", "A large defending fleet"],
    forces: { a: ["Four times the attacker’s points."], b: ["The agreed points."] },
    draw: (v, W, H) => {
      const s = Math.min(60, H - 30), cx = W / 2, cy = H / 2;
      return [
        R(cx - s / 2 - 30, cy - s / 2 - 30, s + 60, s + 60, "a", "", { dash: 1 }),
        R(cx - s / 2, cy - s / 2, s, s, "a", "Port Maw: docked fleet"),
        { z: "text", x: cx, y: Math.max(6, cy - s / 2 - 25), l: "low-power fire reaches 30 cm", s: "a" },
        R(0, 0, 10, H, "b", "Attacker: 10 cm", { rot: -90 })
      ];
    },
    fit: () => [120, 90],
    mapNote: "Port Maw (about 60 × 60 cm) sits in the centre with the defending fleet docked around it. The dashed line marks the 30 cm reach of its low-power fire. The attacker sets up within 10 cm of any one table edge.",
    steps: [
      { s: "a", t: "Place Port Maw in the centre of the table and any celestial phenomena." },
      { s: "a", t: "Set up every ship in the docking bays around Port Maw." },
      { s: "b", t: "Set up within 10 cm of any one table edge." },
      { s: "b", t: "The warp rift gives you surprise: the attacker takes the first turn." }
    ],
    notes: [OLD + VPOLD, "Port Maw is huge: attacking it has no effect on this game.", "The booklet says plainly that the scenario is not balanced — which makes a defender’s win all the sweeter."],
    refs: [["Victory points", "RB p. 122"]],
    play: [
      { w: "Docked", s: "a", t: "Docked ships fight at half strength and have no shields. All shots against them count as closing." },
      { w: "Your turn, at the start", s: "a", t: "Roll a D6 for each docked ship or squadron (tool below): on a 6 it is released. Its shields come up and its weapons work normally from then on." },
      { w: "Manoeuvring thrusters", s: "a", t: "A released ship moves only 5 cm a turn until it is at least 10 cm from the station." },
      { w: "Low power", s: "a", t: "In your shooting phase roll a D6 for each enemy ship and ordnance marker within 30 cm of Port Maw: ships take a hit on 4+, ordnance is destroyed on a 6." }
    ],
    turnMax: () => 12,
    fx: T => T === 12 ? [[null, "Last turn"]] : [],
    tools: [
      { k: "shiproll", id: "rel", l: "Release rolls", s: "a", sub: "D6 for each docked ship or squadron · 6 = released", cl: "Still docked", n0: 6, il: i => "Docked " + (i + 1), out: d => d === 6 ? "released" : "still docked" },
      { k: "shiproll", id: "lp", l: "Low-power fire at ships", s: "a", sub: "D6 for each enemy ship within 30 cm · 4+ = one hit", cl: "Enemy ships in range", n0: 3, il: i => "Ship " + (i + 1), out: d => d >= 4 ? "one hit" : "no effect" },
      { k: "shiproll", id: "lo", l: "Low-power fire at ordnance", s: "a", sub: "D6 for each enemy ordnance marker within 30 cm · 6 = destroyed", cl: "Ordnance markers in range", n0: 3, il: i => "Marker " + (i + 1), out: d => d === 6 ? "destroyed" : "survives" }
    ],
    rtools: [
      { k: "num", id: "av", l: "Defender: victory points", s: "a", after: v => v + " VP" },
      { k: "num", id: "bv", l: "Attacker: victory points", s: "b", after: v => v + " VP" }
    ],
    end: ["After 12 turns, or when a fleet disengages or is destroyed."],
    win: ["Standard victory points."],
    result(st) { return vp2(st, "av", "bv", "The defender", "The attacker"); },
    info: { bg: "Hounded across the sector by the Imperial Navy, a Chaos fleet has been all but annihilated. Then the Dark Gods offer it one chance: solar flares have blinded Port Maw, its shields are down, and a warp rift has opened close by.", cr: [CR("Port Maw", "8–9", "10–11"), "The booklet’s own Port Maw model, built at the US studio, covered 2 × 2 feet and could dock an enormous fleet."] }
  },
  /* ------------------------------------------------------------ BOARDING PARTY (BFG + 40K) */
  {
    id: "cl-inv-boarding", grp: "cl-inv", name: "Boarding Party", series: "Invasion · linked with Warhammer 40,000", trust: "classic",
    why: "An outnumbered fleet sends a suicide squad aboard the enemy flagship. The boarding action is played out as a game of Warhammer 40,000.", src: "Invasion p. 16–17", book: "O", suggest: null,
    others: "Written for any two fleets, with Warhammer 40,000 armies to match.",
    sides: { a: { n: "Defender", f: "Any" }, b: { n: "Attacker", f: "Any" } },
    pitch: "Outgunned, your only hope is the enemy flagship’s torpedo bay. Get a squad aboard, plant the charges, and let the chain reaction do the rest.",
    glance: [["Points", "Defender: +25%"], ["Table", "Not given — use your table"], ["Battlezone", "Placed in turns"], ["First turn", "Attacker"], ["Game ends", "A fleet disengages or is destroyed"]],
    bring: ["A flagship for the defender", "Warhammer 40,000 forces: 500 pts boarders, 250 pts defenders", "Ship-interior terrain: six rooms and a torpedo bay"],
    forces: { a: ["25% more points than the attacker."], b: ["The agreed points."] },
    draw: (v, W, H) => zones(W, H, 30, "Defender: 30 cm", "Attacker: 30 cm"),
    fit: () => [60, 80],
    mapNote: "Both fleets set up within 30 cm of opposite table edges — the first player picks the edge (drawn here on the long edges). No ship within 50 cm of an enemy ship.",
    steps: [
      { t: "Roll off. Starting with the higher roll, take turns placing celestial phenomena." },
      { t: "Roll off. The higher roll picks its edge and places a ship or squadron first, within 30 cm of that edge; the other uses the opposite edge. Take turns; no ship within 50 cm of an enemy ship." },
      { s: "b", t: "The attacker takes the first turn." }
    ],
    stools: [{ k: "html", html: "<h3>The Warhammer 40,000 half</h3><ul class='plain'><li>Boarders up to 500 pts, defenders up to 250 pts; standard force organisation, no vehicles, bikes or Dreadnoughts.</li><li>Six rooms in a row of the ship: the boarders start in the warehouse, the defenders in the chapel and the torpedo bay. More than one path must lead to the bay.</li><li>Rooms count as buildings (Cityfight rules); defenders may use Sustained Attack, arriving in a random room.</li><li>A boarder in contact with the big torpedo sets a charge; if it survives until the end of the defender’s turn, it goes off.</li><li>8 turns. Boarders win by setting off a charge, defenders by wiping out the boarders; otherwise a draw.</li></ul>" }],
    notes: [OLD + VPOLD, "The Warhammer 40,000 half was written for its 3rd edition (Cityfight rules, White Dwarf 264 Imperial Guard). Adapt it to the edition you play.",
      "Without a 40K game: not covered. Suggestion — resolve it as a normal boarding action (RB p. 89–90) and, if the attackers win, the charges go off as below."],
    refs: [["Boarding actions", "RB p. 89–90"], ["Victory points", "RB p. 122"]],
    play: [
      { w: "Boarding the flagship", s: "b", t: "If you start a boarding action against the defender’s flagship, do not roll for it: stop and play the Warhammer 40,000 boarding scenario, then come back." },
      { w: "The charges", s: "b", t: "If the boarders win the 40K game, the flagship’s ordnance goes up: D6+2 damage to it (tool below)." }
    ],
    tools: [
      { k: "ending", id: "brd", l: "The 40K boarding action", rows: [["Not played yet", "draw", "—"], ["The boarders won: charges detonated", "b"], ["The boarders failed", "a"]] },
      { k: "val", id: "boom", l: "The flagship takes D6+2 damage", opts: [3, 4, 5, 6, 7, 8], roll: () => d6() + 2, unit: " damage" }
    ],
    rtools: [
      { k: "num", id: "av", l: "Defender: victory points", s: "a", after: v => v + " VP" },
      { k: "num", id: "bv", l: "Attacker: victory points", s: "b", after: v => v + " VP" }
    ],
    end: ["When a fleet disengages or is destroyed."],
    win: ["Standard victory points."],
    result(st) { return vp2(st, "av", "bv", "The defender", "The attacker"); },
    info: { bg: "Outnumbered and outgunned, the fleet has one desperate plan: a suicide squad to fight its way to the enemy flagship’s torpedo bay and set off its ordnance from inside.", cr: [CR("Boarding Party", "16–17", "18–19")] }
  },
  /* ------------------------------------------------------------ DEADLINE (BFG + 40K) */
  {
    id: "cl-inv-deadline", grp: "cl-inv", name: "Deadline", series: "Invasion · linked with Warhammer 40,000", trust: "classic",
    why: "A Macro Cannon on the planet blasts the attacking fleet — until the ground war knocks out its generators. The 40K game sets its firing schedule.", src: "Invasion p. 18–19", book: "O", suggest: null,
    others: "Written for any two fleets, with Warhammer 40,000 armies to match.",
    sides: { a: { n: "Attacker", f: "Any" }, b: { n: "Defender", f: "Any" } },
    pitch: "An ancient Macro Cannon guards the planet, and it is stopping the invasion cold. Down on the surface, troops are fighting for the three generators that feed it.",
    glance: [["Points", "Equal"], ["Table", "As Planetary Assault"], ["Battlezone", "The Macro Cannon planet + phenomena"], ["First turn", "Roll-off"], ["Game ends", "A fleet disengages or is destroyed"]],
    bring: ["A planet with the Macro Cannon", "The result of the 40K game: when each generator fell"],
    forces: { a: ["Equal points."], b: ["Equal points."] },
    draw: (v, W, H, st) => MAPS["planetary-assault"](v, W, H, st),
    fit: () => [100, 80],
    mapNote: "Set up as in Planetary Assault, with the Macro Cannon’s planet in the defender’s zone.",
    steps: [
      { t: "Play the Warhammer 40,000 game first (summary below) and note the turn each generator was destroyed." },
      { s: "b", t: "Place the planet with the Macro Cannon in your deployment zone. Then take turns placing any other celestial phenomena." },
      { t: "Set up as in Planetary Assault (RB p. 136–137)." },
      { t: "Roll off. The higher roll chooses to go first or second." }
    ],
    stools: [
      { k: "counter", id: "g1", l: "First generator destroyed on 40K turn (0 = survived)", max: 8 },
      { k: "counter", id: "g2", l: "Second generator destroyed on 40K turn (0 = survived)", max: 8 },
      { k: "counter", id: "g3", l: "Third generator destroyed on 40K turn (0 = survived)", max: 8 },
      { k: "html", html: "<h3>The Warhammer 40,000 half (play it first)</h3><ul class='plain'><li>The attackers have 50% more points than the defenders.</li><li>Three bunkers in the defenders’ zone house the generators; the attackers start within 12″ of the south edge, the defenders within 18″ of the north edge.</li><li>8 turns. All three generators destroyed in turns 1–6: attacker wins; in turn 7 or 8: draw; any generator left: defender wins.</li></ul>" }
    ],
    notes: [OLD + "The booklet’s Scenario Seven (old p. 76) is Planetary Assault, RB p. 136–137. " + VPOLD,
      "The Warhammer 40,000 half was written for its 3rd edition (bunker rules p. 133 of that rulebook). Adapt it to the edition you play.",
      "The 40K turn on which a generator falls is applied to the same-numbered BFG turn, as the booklet’s example shows: first generator lost on turn 4, so no shot on turn 4, then turns 5 and 7. Without a 40K game, suggestion: roll a D6+2 for each generator’s turn."],
    refs: [["Planetary Assault (set-up)", "RB p. 136–137"], ["Nova cannon", "RB p. 63"], ["Victory points", "RB p. 122"]],
    play: [
      { w: "The Macro Cannon", s: "b", t: "Fires as a nova cannon with no minimum range. The planet does not block its line of fire, and it cannot be attacked." },
      { w: "Generators", t: "Three generators: it fires every turn. Two: every other turn. One: every third turn. None: never. On the turn a generator falls it cannot fire. The turn track shows when it fires." }
    ],
    fx: (T, st) => { const c = cannon(T, st); return [["b", c[1]]]; },
    tools: [],
    rtools: [
      { k: "num", id: "av", l: "Attacker: victory points", s: "a", after: v => v + " VP" },
      { k: "num", id: "bv", l: "Defender: victory points", s: "b", after: v => v + " VP" }
    ],
    end: ["When a fleet disengages or is destroyed."],
    win: ["Standard victory points."],
    result(st) { return vp2(st, "av", "bv", "The attacker", "The defender"); },
    info: { bg: "The enemy has made a strategically vital world its base and woken a Macro Cannon from the Dark Age of Technology to guard it. No full-scale landing is possible while it fires. Down on the surface, assault troops go for the three generators; above, the fleets fight it out.", cr: [CR("Deadline", "18–19", "20–21")] }
  }
  ]);
})();
