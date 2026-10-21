/* Classic scenarios from Battlefleet Gothic Magazine 7–10 (Fanatic Press):
   Rath's Last Stand, the Battle for Antioc (Reconnaissance Run, Critical Intercept,
   Carrier Clash), Execution Hour, The Siege, The Defence of Macragge.
   Scenario 2 of Antioc, Desperate Search, is the original of the Fleets book's
   Explorer's Prize and is credited there.
   Written for the original 1999 rules; Remastered places are given in the notes.
   Summarised in our own words; every scenario is hand-made (see LUEMINUT.md). */
(function () {
  const BM = n => "Battlefleet Gothic Magazine " + n + " (Fanatic Press)";
  const OLD = "Written for the original 1999 rules. ";
  const ANTIOC = "Nate Montes — “The Battle for Antioc”, a four-scenario campaign in " + BM(8) + ", p. 3–9 (PDF p. 5–11).";
  const PARIS = "Admiral Natanico Paris (175 pts): always Ld 10 with two re-rolls. His ship rolls two random crew skills at the start of the battle and keeps them for the campaign. No ship may use his re-rolls on a failed Brace for Impact.";
  const link = (id, text) => "<a href='#/s/" + id + "/setup'>" + esc(text) + " ›</a>";
  const vp2 = (st, a, b, an, bn) => {
    const A = num(st, a), B = num(st, b);
    if (!A && !B) return [null, "Count victory points", "Enter both totals below."];
    return A === B ? ["draw", "Level", A + " – " + B + " VP."] : [A > B ? "a" : "b", wins(A > B ? an : bn), an + " " + A + " – " + bn + " " + B + " VP."];
  };
  const RANDOM_EDGE = () => [[1, 1, "Left short edge"], [2, 3, "Top long edge"], [4, 5, "Bottom long edge"], [6, 6, "Right short edge"]];

  addScenarios([
  /* ------------------------------------------------------------ RATH'S LAST STAND */
  {
    id: "cl-raths-last-stand", grp: "cl-mag", name: "Rath’s Last Stand", series: "First Tyrannic War · BFG Magazine 7", trust: "classic",
    why: "The Battle of Circe: Battlefleet Bakka turns at bay above a ringed gas giant. Keep one ship alive for eight turns.", src: "BFG Magazine 7 p. 6–10", book: "O", suggest: ["Imperial Navy", "Tyranids"],
    others: "Written for Battlefleet Bakka (FL p. 48) against Hive Fleet Behemoth. Any defender against any swarm works: the defenders only need to survive. It can follow The Defence of Macragge, using the survivors of the relief fleet.",
    sides: { a: { n: "Battlefleet Bakka", f: "Imperial Navy (Bakka)" }, b: { n: "Hive Fleet Behemoth", f: "Tyranids" } },
    pitch: "A second, fresh hive fleet has burst out of the warp behind the victorious Imperials. Lord Admiral Rath turns the Tempestus fleet at bay in the rings of Circe.",
    glance: [["Points", "Bakka 2000 · Tyranids 3000"], ["Table", "Not given — use your table"], ["Battlezone", "The gas giant Circe and its rings, nothing else"], ["First turn", "Tyranids"], ["Game ends", "After 8 turns, or a fleet is destroyed"]],
    bring: ["A large planet with three moons and two rings (gas and dust)", "The Emperor class battleship Dominus Astra", "Assault boats"],
    forces: {
      a: ["2000 pts from the Bakka Sector fleet list (FL p. 48).", "Must include the Emperor class battleship Dominus Astra commanded by Lord Admiral Rath (FL p. 48), carrying assault boats."],
      b: ["3000 pts of Tyranids (FL p. 430), with evolutions if you like (FL p. 426).", "The magazine added two new ships: the Devourer cruiser and the Razorfiend heavy escort (see note)."]
    },
    draw: (v, W, H) => {
      const cx = W - 40, cy = H / 2;
      return [
        R(W / 2, 0, W / 2, H, "a", "", { dash: 1 }), { z: "text", x: W * .62, y: 14, l: "Bakka: up to halfway", s: "a" },
        { z: "ring", cx, cy, r: 40, s: "a" },
        { z: "ring", cx, cy, r: 20, sw: 4, gas: 1 }, { z: "ring", cx, cy, r: 24, sw: 3, ast: 1 },
        { z: "planet", cx, cy, r: 10, l: "" },
        { z: "planet", cx: cx - 22, cy: cy - 22, r: 2.5, l: "", free: 1 }, { z: "planet", cx: cx - 27, cy: cy + 14, r: 2.5, l: "", free: 1 }, { z: "planet", cx: cx + 4, cy: cy - 28, r: 2.5, l: "", free: 1 },
        { z: "edge", e: "l", s: "b", l: "Tyranids move on, turn 1" }, { z: "edge", e: "r", s: "a", l: "Imperial edge" },
        { z: "dim", x1: cx, y1: H - 8, x2: W, y2: H - 8, l: "40 cm" }
      ];
    },
    fit: () => [100, 80],
    mapNote: "Circe is 40 cm from the Imperial short edge, with a 30 cm gravity well (dashed). Its gas and dust rings lie 10 cm out from the planet, merged into one band. Moons placed as you like.",
    steps: [
      { t: "Place Circe, a large planet, 40 cm from one short edge: that is the Imperial edge. Give it three moons and two merged rings, gas and dust, 10 cm from the planet. No other phenomena." },
      { s: "a", t: "Deploy anywhere up to halfway along the table from your edge." },
      { s: "b", t: "No deployment: the whole hive fleet moves on from the opposite edge in your first turn." },
      { s: "b", t: "The Tyranids take the first turn." }
    ],
    notes: [OLD + "The Bakka list and Lord Admiral Rath are now in the Fleets book (FL p. 48), and the Tyranid lists are FL p. 429–430.",
      "The magazine’s Devourer cruiser (170 pts: Cruiser/6, 15 cm, 45°, armour 5+, spore cysts 3, torpedoes 4, bio-plasma 8 at 15 cm, two launch bays of assault boats) and Razorfiend heavy escort (30 pts: Escort/1, 15 cm, 45°, armour 5+, spore cysts 1, pyro-acid battery 2 at 30 cm, feeder tentacles) were experimental. Today, build equivalent ships with the Fleets book’s Tyranid options."],
    refs: [["Bakka Sector fleet list, Lord Admiral Rath", "FL p. 48"], ["Tyranid fleet lists", "FL p. 429–430"], ["Planets, moons, rings, gravity wells", "RB p. 113–116"]],
    play: [
      { w: "All game", s: "a", t: "Survive. One ship of yours still on the table at the end of turn 8 — not ordnance, not disengaged — wins." },
      { w: "All game", s: "b", t: "Destroy every Imperial ship. No victory points are counted." },
      { w: "Turn 8", t: "Last turn." }
    ],
    turnMax: () => 8,
    fx: T => T === 8 ? [[null, "Last turn: is one Imperial ship still on the table?"]] : [],
    tools: [{ k: "counter", id: "left", l: "Imperial ships still on the table", s: "a", start: 1, res: 1 }],
    end: ["After eight turns.", "Or when one fleet is destroyed."],
    win: ["No victory points.", "Every Imperial ship destroyed: Tyranid victory.", "At least one Imperial ship (not ordnance, not disengaged) on the table at the end of turn 8: Imperial victory."],
    result(st) {
      const n = get(st, "left", 1);
      if (!n) return ["b", "Tyranid victory", "The Tempestus fleet is gone."];
      return st.turn >= 8 ? ["a", "Imperial victory", n + " ship" + (n === 1 ? "" : "s") + " still fighting at the end of turn 8."] : [null, "Battle in progress", n + " Imperial ship" + (n === 1 ? "" : "s") + " left; hold until the end of turn 8."];
    },
    info: { bg: "Caught between the Ultramar fleet and the relief fleet from Bakka, the first hive fleet died — then a second, fresh one tore out of the warp behind them. Lord Admiral Rath turned at bay in the rings of Circe, and when the battle was lost he drove the Dominus Astra into the heart of the swarm and triggered its warp drive, dragging the hive ships into oblivion. A dozen ships of the Tempestus fleet survived.", cr: ["Tim Driscole — “Rath’s Last Stand”, with experimental rules by Warwick Kinrade, " + BM(7) + ", p. 6–10 (PDF p. 8–12).", "The Fleets book retells the battle in its Battlefleet Bakka section (FL p. 44–47)."] }
  },
  /* ------------------------------------------------------------ ANTIOC 1 RECONNAISSANCE RUN */
  {
    id: "cl-antioc-1", grp: "cl-mag", name: "Reconnaissance Run", series: "Battle for Antioc · Scenario 1", trust: "classic",
    why: "A tiny flotilla drops into a system full of enemy ships and must scan as many as it can — then get out alive with the data.", src: "BFG Magazine 8 p. 3–4", book: "O", suggest: ["Imperial Navy", "Chaos"],
    others: "Any small fleet scouting any big one; the magazine notes it fleshes out an idea from Warp Storm for Space Marines. Space Marine or Eldar scouts get only 25% of the defenders’ points.",
    sides: { a: { n: "Flotilla Sylvanus", f: "Imperial Navy" }, b: { n: "Defenders", f: "Chaos" } },
    pitch: "Antioc has gone silent. The flotilla sent to look finds a Chaos armada massing in orbit — and a fortune in intelligence, if anyone lives to deliver it.",
    glance: [["Points", "Defenders: agreed · Flotilla: a third"], ["Table", "Not given — use your table"], ["Battlezone", "Mercurial zone, at least one planet"], ["First turn", "Flotilla"], ["Game ends", "The flotilla has disengaged or died"]],
    bring: ["A planet", "Markers for scanned enemy ships"],
    forces: {
      a: ["33% of the defenders’ points (660 pts against 2000). No battleships.", "Space Marines or Eldar: 25%."],
      b: ["The agreed points."]
    },
    draw: (v, W, H, st) => MAPS["surprise-attack"](v, W, H, st).map(it => it.z === "edge" ? Object.assign({}, it, { s: "a", l: it.l ? "Flotilla enters from an edge of choice" : "" }) : it.z === "text" && it.y === 36 ? Object.assign({}, it, { y: Math.min(36, H / 2 - 22), s: "b" }) : it.s === "b" || it.s === "a" ? Object.assign({}, it, { s: "b" }) : it),
    fit: () => [60, 60],
    mapNote: "Set up as in Surprise Attack: a planet in the middle, D3 defending ships or squadrons on alert at least 30 cm from the edges, the rest on standby within 15 cm of the planet.",
    steps: [
      { t: "Agree the defenders’ points; the flotilla gets a third (a quarter for Space Marines or Eldar), no battleships." },
      { t: "Set up a mercurial zone battlezone with at least one planet in the middle." },
      { s: "b", t: "Set up as in Surprise Attack (RB p. 132): D3 ships or squadrons on full alert at least 30 cm from every edge; the rest on standby near the planet." },
      { s: "a", t: "No deployment: you move on from the edge of your choice." },
      { s: "a", t: "The flotilla takes the first turn." }
    ],
    stools: [{ k: "counter", id: "tot", l: "Defending ships at the start", s: "b", start: 10, min: 1 }],
    notes: [OLD + "Surprise Attack: RB p. 132 (old p. 72). The mercurial zone is the innermost region of a system (RB p. 104–).",
      "“For one full turn” is read as applying to both kinds of scan: the flotilla ship must stay in range of the target from one of its turns to the next."],
    refs: [["Surprise Attack (set-up and standby)", "RB p. 132"], ["Disengaging", "RB p. 56"], ["Victory points", "RB p. 122"]],
    play: [
      { w: "Standby", s: "b", t: "As in Surprise Attack, but only one more ship or squadron may test to go on alert in each of your turns. It is not a command check: if one fails, keep trying others until one passes." },
      { w: "Scanning", s: "a", t: "A defending ship is identified when a flotilla ship stays within 45 cm of it (on alert) or within 30 cm (on standby or still in orbit) for one full turn. Each identified ship is worth 25% of its value in victory points to you." },
      { w: "Datalink", s: "a", t: "The data only counts if the ship that gets away was within 15 cm of the scanning ship for at least one turn after the scan." },
      { w: "Fighter scouts", s: "a", t: "Carriers may scout with fighters, but at least one marker of the wave must fly back to the carrier’s base to deliver the data. Markers lost on the way do not count." },
      { w: "Disengaging", s: "a", t: "Any ship that has scanned something is at −1 on its disengage roll: the enemy is tracking it. The defenders score nothing for scouts that disengage." }
    ],
    tools: [
      { k: "counter", id: "id", l: "Defending ships identified (and relayed)", s: "a", res: 1 },
      { k: "info", res: 1, html: st => { const t = get(st, "tot", 10), n = get(st, "id", 0); return "<h3>Identified</h3><p class='calc'><b>" + n + "</b> of " + t + " defending ships (" + Math.floor(100 * n / Math.max(1, t)) + "%). Set the starting number in Set-up.</p>"; } }
    ],
    rtools: [
      { k: "pick", id: "esc", l: "What got away?", rows: [["Nothing — the flotilla was destroyed", ""], ["Only lone escorts", ""], ["A whole squadron or a capital ship (crippled is fine)", ""]] },
      { k: "num", id: "av", l: "Flotilla: victory points (with scanning)", s: "a", after: v => v + " VP" },
      { k: "num", id: "bv", l: "Defenders: victory points", s: "b", after: v => v + " VP" },
      { k: "html", html: "<h3>Campaign</h3><p>Next: Desperate Search, which became the Fleets book’s " + link("fl-explorers-prize", "Explorer’s Prize") + "; then " + link("cl-antioc-3", "Critical Intercept") + " and " + link("cl-antioc-4", "Carrier Clash") + ".</p>" }
    ],
    end: ["When every flotilla ship has disengaged (by rolling or by leaving the table) or been destroyed."],
    win: ["Defenders win (+1 renown): the whole flotilla is destroyed and nothing escapes.", "Flotilla wins (+2 renown): the entire enemy fleet identified, and at least one squadron or capital ship escapes (even crippled).", "Flotilla’s marginal win (+1 renown): the entire enemy fleet identified and at least one escort escapes — or at least half of it identified and a squadron or capital ship escapes.", "Otherwise compare victory points, scanning included."],
    result(st) {
      const e = get(st, "esc", -1), t = get(st, "tot", 10), p = get(st, "id", 0) / Math.max(1, t);
      if (e < 0) return [null, "Mark what got away", "Identified so far: " + get(st, "id", 0) + " of " + t + "."];
      if (e === 0) return ["b", "Defenders win (+1 renown)", "The secret is safe for now."];
      if (p >= 1 && e === 2) return ["a", "Flotilla wins (+2 renown)", "The whole enemy fleet identified, and the data got out."];
      if ((p >= 1 && e === 1) || (p >= .5 && e === 2)) return ["a", "Flotilla’s marginal win (+1 renown)", Math.floor(100 * p) + "% identified."];
      return vp2(st, "av", "bv", "The flotilla", "The defenders");
    },
    info: { bg: "Antioc, a remote forge world on the edge of the Prath Veil, had stopped answering. Flotilla Sylvanus under Captain Marietus went to look, expecting storms in the Veil or an Ork nuisance — and came out of the warp in the middle of a massing Chaos fleet.", cr: [ANTIOC] }
  },
  /* ------------------------------------------------------------ ANTIOC 3 CRITICAL INTERCEPT */
  {
    id: "cl-antioc-3", grp: "cl-mag", name: "Critical Intercept", series: "Battle for Antioc · Scenario 3", trust: "classic",
    why: "Escorts only against a warlord’s two-cruiser convoy. He is aboard one of them — and can teleport to the other.", src: "BFG Magazine 8 p. 7–8", book: "O", suggest: ["Imperial Navy", "Chaos"],
    others: "Any escort fleet against any two cruisers with escorts. Chaos Space Marine cruisers suit the defenders well (FL p. 224). Space Marine or Eldar attackers take 75% of the points.",
    sides: { a: { n: "Interceptors", f: "Imperial Navy" }, b: { n: "Attalid’s convoy", f: "Chaos" } },
    pitch: "The warlord who holds the Chaos armada together, Attalid the Diablos, is crossing to the jump point with only two cruisers. Kill him and the alliance may fall apart.",
    glance: [["Points", "Equal: escorts against two cruisers and escorts"], ["Table", "Not given — use your table"], ["Battlezone", "Deep space"], ["First turn", "Interceptors"], ["Game ends", "Every Chaos ship has left or died"]],
    bring: ["Something to note which cruiser carries Attalid"],
    forces: {
      a: ["Escorts only, up to the defenders’ points. Space Marines or Eldar: 75%.", "Admiral Paris may lead (FL-style special character, see Play)."],
      b: ["No more than two cruisers and no battleships.", "Any number of escorts in squadrons of up to six.", "Attalid the Diablos is aboard one cruiser — chosen in secret."]
    },
    draw: (v, W, H) => [
      R(0, 0, 30, H, "b", "Convoy: 30 cm", { rot: -90 }), { z: "edge", e: "r", s: "a", l: "Interceptors start against this edge — the convoy must reach it" },
      { z: "arrow", x1: 34, y1: H / 2, x2: 54, y2: H / 2, s: "b" }
    ],
    fit: () => [60, 40],
    mapNote: "The convoy sets up within 30 cm of one short edge and must get Attalid’s cruiser off the opposite one, past the interceptors.",
    steps: [
      { t: "Generate deep space phenomena (RB p. 107–108)." },
      { s: "b", t: "Note in secret which cruiser carries Attalid (tool below)." },
      { s: "b", t: "Deploy first, anywhere within 30 cm of a short edge." },
      { s: "a", t: "Deploy anywhere against the opposite short edge." },
      { s: "a", t: "The interceptors take the first turn." }
    ],
    stools: [{ k: "secret", id: "att", l: "Attalid is aboard", sub: "Convoy: pick his cruiser. It stays hidden until you show it; choose again after a transfer.", opts: ["Cruiser 1", "Cruiser 2"] }],
    notes: [OLD + "The magazine points to Chaos Space Marine cruisers in Planet Killer 1; today see FL p. 224.", "“Leave the system” in the victory conditions is read as getting Attalid’s cruiser off the opposite short edge, as the special rules require."],
    refs: [["Deep space generator", "RB p. 107–108"], ["Teleport attacks (hit-and-run)", "RB p. 91"], ["Chaos Space Marines", "FL p. 224"]],
    play: [
      { w: "All game", s: "b", t: "Get Attalid’s cruiser off the opposite short edge — crippled is fine." },
      { w: "Changing ships", s: "b", t: "Attalid may teleport to the other cruiser if both have been within 10 cm of each other for one full turn and the ship he leaves still has hits left. Shields do not block this. He never moves to an escort." },
      { w: "Admiral Paris", s: "a", t: PARIS }
    ],
    tools: [{ k: "secret", id: "att", l: "Attalid is aboard", sub: "Convoy: pick his cruiser. It stays hidden until you show it; choose again after a transfer.", opts: ["Cruiser 1", "Cruiser 2"] }],
    rtools: [
      { k: "ending", id: "how", l: "How did it end?", rows: [["Attalid escaped aboard a cruiser", "b"], ["Both cruisers destroyed, or Attalid’s with no chance to transfer", "a"], ["Neither — count victory points", "draw", "Count VP"]] },
      { k: "num", id: "av", l: "Interceptors: victory points", s: "a", after: v => v + " VP" }, { k: "num", id: "bv", l: "Convoy: victory points", s: "b", after: v => v + " VP" }
    ],
    end: ["When every Chaos ship has disengaged (by rolling or leaving the table) or been destroyed."],
    win: ["Convoy wins (+1 renown): Attalid gets away aboard one of the cruisers, even crippled.", "Interceptors win (+1 renown): both cruisers are destroyed, or Attalid’s cruiser is destroyed before he could transfer.", "Otherwise victory points decide."],
    result(st, v, S) { const i = get(st, "how", -1); return i === 0 ? ["b", "Convoy wins (+1 renown)", "Attalid reaches the armada."] : i === 1 ? ["a", "Interceptors win (+1 renown)", "Attalid is dead — the Chaos host falls into disarray."] : i === 2 ? vp2(st, "av", "bv", "The interceptors", "The convoy") : [null, "Battle in progress", "Mark how it ended."]; },
    info: { bg: "With Antioc and Guidus fallen, word came that the champion uniting the Chaos legions, Attalid the Diablos, was travelling to the armada with only two cruisers. Every capital ship was needed elsewhere, so only a large escort force could be sent to catch him at the jump point.", cr: [ANTIOC] }
  },
  /* ------------------------------------------------------------ ANTIOC 4 CARRIER CLASH */
  {
    id: "cl-antioc-4", grp: "cl-mag", name: "Carrier Clash", series: "Battle for Antioc · Scenario 4", trust: "classic",
    why: "Escalating Engagement for carriers: hidden divisions hunt each other with waves of attack craft before a single gun fires.", src: "BFG Magazine 8 p. 8–9", book: "O", suggest: ["Imperial Navy", "Chaos"],
    others: "Any fleets heavy in carriers, with roughly equal launch capacity. Orks may use a space hulk as their carrier; Eldar may take up to two battleships per full 1500 pts but only 75% of the points, and their battleships may not swap launch bays for torpedoes.",
    sides: { a: { n: "Imperial fleet", f: "Imperial Navy" }, b: { n: "Chaos fleet", f: "Chaos" } },
    pitch: "Admiral Paris punches into Antioc with five carriers just as the Chaos armada disperses. Both sides fill the system with bombers, hunting for the other’s hidden divisions.",
    glance: [["Points", "Equal, 1000 or more · many carriers"], ["Table", "Not given — use your table"], ["Battlezone", "Any, generated"], ["First turn", "Attack ratings"], ["Game ends", "A fleet disengages or is destroyed"]],
    bring: ["5 contact markers each", "Lots of attack craft markers", "A note of each division’s ships"],
    forces: {
      a: ["Equal points, 1000 or more. No limit on battleships or battlecruisers; take many carriers, with launch capacity roughly equal to the enemy’s.", "Must include Admiral Paris (see Play).", "Split into five divisions on contact markers; each division needs some ships but not necessarily a carrier."],
      b: ["Equal points, the same way: many carriers, five divisions on contact markers."]
    },
    draw: (v, W, H) => [
      R(0, 0, 30, H, "a", "First marker: up to 30 cm", { rot: -90 }), R(W - 30, 0, 30, H, "b", "First marker: up to 30 cm", { rot: 90 }),
      { z: "text", x: W / 2, y: H / 2, l: "markers 30 cm+ apart", s: "n" }
    ],
    fit: () => [90, 40],
    mapNote: "Each player places their first division’s marker up to 30 cm from their own short edge. New markers come in at least 30 cm from any marker; attack craft within 30 cm of an enemy marker reveal it.",
    steps: [
      { t: "Choose fleets heavy in carriers; split each into five divisions on contact markers and note the ships in each (secret until revealed)." },
      { t: "Set up phenomena with the generator for the region you agree." },
      { t: "Each player rolls a D6 for their first division (re-roll 6s; the division tools are on the Play tab, turn 1) and places its marker anywhere up to 30 cm from their short edge." },
      { t: "Roll attack ratings: each rolls their fleet’s attack rating in dice and keeps the highest. The higher roll goes first." }
    ],
    notes: [OLD + "Torpedo bombers (the magazine points to Warp Storm): RB p. 84, FL p. 22. Attack ratings: RB p. 120.",
      "The article does not say where later divisions come on. Suggestion: like the first, up to 30 cm from your own short edge, and never within 30 cm of another marker."],
    refs: [["Escalating Engagement", "RB p. 138–139"], ["Torpedo bombers", "RB p. 84"], ["Attack ratings", "RB p. 120"], ["Victory points", "RB p. 122"]],
    play: [
      { w: "Markers", t: "Markers move from the start, at the speed and turns of the division’s slowest ship, with no minimum move." },
      { w: "Launching", t: "A division still on its marker may launch attack craft at once — any number of squadrons up to its ships’ total — but use no other weapons. Squadrons may form any waves, stay by the marker as a combat air patrol, or wait to build a bigger strike. Bombers may carry torpedoes for +10 pts per launch bay (+15 Eldar)." },
      { w: "Reloading", t: "A division on its marker reloads as a whole against Ld 7 (re-rolls allowed) and takes no other special orders." },
      { w: "Start of each turn after the first", t: "Roll for another division to arrive (tools below); results for divisions already in play are rolled again." },
      { w: "Spotted", t: "Attack craft within 30 cm of an enemy marker (or a marker within 30 cm of them) reveal it: replace it with its ships, none more than 15 cm from the marker. Craft already in range that ordnance phase may strike the largest ship instead of the closest. Two markers within 30 cm of each other reveal each other." },
      { w: "Admiral Paris", s: "a", t: PARIS }
    ],
    fx: T => T >= 2 ? [[null, "Roll for another division each"]] : [],
    tools: [
      { k: "reinf", id: "da", l: "Imperial divisions", s: "a", die: 6, from: 1, verb: "comes in", sub: "D6, re-roll 6s · turn 1 is the first division · each division once · tap a row to mark it", dup: "already in play.", again: true, rows: [[1, "Division 1"], [2, "Division 2"], [3, "Division 3"], [4, "Division 4"], [5, "Division 5"], [6, "6 — roll again", "again"]] },
      { k: "reinf", id: "db", l: "Chaos divisions", s: "b", die: 6, from: 1, verb: "comes in", sub: "D6, re-roll 6s · turn 1 is the first division · each division once · tap a row to mark it", dup: "already in play.", again: true, rows: [[1, "Division 1"], [2, "Division 2"], [3, "Division 3"], [4, "Division 4"], [5, "Division 5"], [6, "6 — roll again", "again"]] }
    ],
    rtools: [
      { k: "num", id: "av", l: "Imperial fleet: standard victory points", s: "a", after: v => v + " VP" },
      { k: "num", id: "ac", l: "Imperial fleet: value of enemy carriers destroyed", s: "a", after: v => "+" + Math.round(v / 4) + " VP (25%)" },
      { k: "num", id: "ak", l: "Imperial fleet: value of enemy carriers crippled", s: "a", after: v => "+" + Math.round(v / 10) + " VP (10%)" },
      { k: "num", id: "bv", l: "Chaos fleet: standard victory points", s: "b", after: v => v + " VP" },
      { k: "num", id: "bc", l: "Chaos fleet: value of enemy carriers destroyed", s: "b", after: v => "+" + Math.round(v / 4) + " VP (25%)" },
      { k: "num", id: "bk", l: "Chaos fleet: value of enemy carriers crippled", s: "b", after: v => "+" + Math.round(v / 10) + " VP (10%)" }
    ],
    end: ["When one fleet disengages or is destroyed."],
    win: ["Standard victory points, plus 25% of the value of every enemy carrier destroyed and 10% of every enemy carrier crippled (any ship that carries attack craft).", "More victory points wins."],
    result(st) {
      const A = num(st, "av") + Math.round(num(st, "ac") / 4) + Math.round(num(st, "ak") / 10), B = num(st, "bv") + Math.round(num(st, "bc") / 4) + Math.round(num(st, "bk") / 10);
      if (!A && !B) return [null, "Count victory points", "Enter the totals below."];
      return A === B ? ["draw", "Level", A + " – " + B + " VP."] : [A > B ? "a" : "b", wins(A > B ? "The Imperial fleet" : "The Chaos fleet"), "Imperial " + A + " – Chaos " + B + " VP."];
    },
    info: { bg: "Admiral Paris gathered every ship he could around five attack craft carriers, left a holding force at Guidus and struck straight into the Antioc system as the Chaos armada was dispersing. Both fleets sent wave after wave of attack craft across the system looking for each other.", cr: [ANTIOC] }
  },
  /* ------------------------------------------------------------ EXECUTION HOUR */
  {
    id: "cl-execution-hour", grp: "cl-mag", name: "Execution Hour", series: "Gothic War · BFG Magazine 8", trust: "classic",
    why: "Fixed fleets from Gordon Rennie’s novel: the evacuation of Belatis as Abaddon’s Planet Killer closes in, with three built-in sub-plots.", src: "BFG Magazine 8 p. 21–23", book: "O", suggest: ["Imperial Navy", "Chaos"],
    others: "A refight with fixed fleets. Other fleets can stand in with the same shape, but the Planet Killer (FL p. 252) is the point of the scenario.",
    sides: { a: { n: "Evacuation fleet", f: "Imperial Navy" }, b: { n: "Planet Killer fleet", f: "Chaos" } },
    pitch: "Belatis is doomed and its people are fleeing. Fifteen transports must get away before the Planet Killer arrives — and the Macharius will not leave without its captain.",
    glance: [["Points", "Fixed fleets"], ["Table", "Not given — use your table"], ["Battlezone", "Belatis 75 cm from the Chaos edge, nothing else"], ["First turn", "Chaos"], ["Game ends", "No transports left on the table"]],
    bring: ["15 transports", "The Planet Killer (FL p. 252)", "Orbital dock, 2 space stations, 4 orbital platforms", "6 ground silos (3 laser, 3 missile)"],
    forces: {
      a: ["Lord Solar Macharius, Dictator (Ld 7); Drachenfels, Gothic (Ld 9); Graf Orlock and Borodino, Lunars (Ld 8).", "Inviolable Retribution, Adeptus Arbites strike cruiser (Ld 9): a Space Marine strike cruiser that carries assault boats instead of Thunderhawks.", "Pegasus and Achilles, Sword frigates (Ld 7); 150 pts of escorts of any class (random Leadership).", "15 transports, 1 orbital dock, 2 space stations, 2 orbital laser platforms, 2 orbital weapons platforms."],
      b: ["Turn 1: Charybdis, Murder (Ld 8); two squadrons of five Infidels (Ld 8).", "From turn 2: three defence laser silos on Belatis. Turn 3: Virulent, Slaughter (Ld 8) with Bulus Sirl, Chaos Lord with the Mark of Nurgle; three defence missile silos (one shot each).", "Turn 5: Scylla, Styx (Ld 9); Kali, Slaughter (Ld 7); the Planet Killer (Ld 10) with Abaddon; Harbinger of Doom, Chaos Space Marine battle barge (Ld 10); Deathlord and Despoiler, Desolator battleships (Ld 10); 300 pts of escorts (random Leadership)."]
    },
    draw: (v, W, H) => [
      R(Math.max(0, W - 45), 0, Math.min(45, W), H, "a", "Pegasus, Achilles: 45 cm", { dash: 1, rot: 90 }),
      { z: "planet", cx: Math.max(10, W - 75), cy: H / 2, r: 9, l: "Belatis" },
      { z: "dim", x1: Math.max(10, W - 75), y1: H - 8, x2: W, y2: H - 8, l: "75 cm" },
      { z: "edge", e: "l", s: "a", l: "Imperial table edge" }, { z: "edge", e: "r", s: "b", l: "Chaos table edge: arrivals" }
    ],
    fit: () => [100, 50],
    mapNote: "Belatis sits on the centre line, 75 cm from the Chaos edge. Every Imperial ship except Pegasus and Achilles starts in low orbit around it.",
    steps: [
      { t: "Place a medium planet, Belatis, on the centre line 75 cm from the Chaos table edge. No other phenomena." },
      { s: "a", t: "Put everything except Pegasus and Achilles in low orbit around Belatis, with the orbital dock, stations and platforms." },
      { s: "a", t: "Deploy Pegasus and Achilles within 45 cm of the Chaos table edge." },
      { s: "b", t: "No deployment: your ships move on from your edge on the turns listed." },
      { s: "b", t: "Chaos takes the first turn." }
    ],
    notes: [OLD + "The Planet Killer and Abaddon: FL p. 230–231, 252. Exterminatus: RB p. 140–141. Low orbit: RB p. 116.",
      "The article does not say which edge the transports leave by. The natural reading is the Imperial table edge, away from the Planet Killer.",
      "The Chaos defence silos are the captured ground defences of Belatis; they may not be attacked until they have fired."],
    refs: [["Planet Killer", "FL p. 252"], ["Abaddon", "FL p. 230–231"], ["Exterminatus (destroying the planet)", "RB p. 140–141"], ["Low orbit", "RB p. 116"], ["Space Marine strike cruiser", "FL p. 105"]],
    play: [
      { w: "Turns 1–3", s: "a", t: "Imperial ships are not affected by gravity. The transports cannot leave orbit before turn 3." },
      { w: "The Planet Killer", s: "b", t: "It must destroy Belatis (as in Exterminatus) before it moves past the planet. Then roll a D6: after that many turns, replace Belatis with an asteroid field. The Harbinger of Doom may not exterminate the planet and ignores “You have failed me”." },
      { w: "Sub-plot 1 · turn 5", s: "a", t: "Rescue Captain Semper: the Inviolable Retribution and the Macharius send an attack craft wave to the surface; it waits one turn, then must return to base contact with either ship. If every craft dies on the way back, Semper is dead. Meanwhile the two ships count as a squadron. Rescued: the Macharius becomes Ld 8." },
      { w: "Sub-plot 2", s: "b", t: "If the Macharius is in range, the Virulent must fire every weapon that bears at it; weapons that cannot reach it may shoot elsewhere." },
      { w: "Sub-plot 3 · end of turn 4", s: "a", t: "The Plaguebearer: roll a D6. On 1–2 the Macharius suffers engines damaged, thrusters damaged and shields collapsed criticals — no extra damage, and all of them can be repaired." }
    ],
    fx: T => {
      const o = [];
      if (T <= 3) o.push(["a", "No gravity effects on Imperial ships"]);
      if (T < 3) o.push(["a", "Transports may not leave orbit yet"]);
      if (T === 1) o.push(["b", "Arriving: Charybdis and ten Infidels"]);
      if (T === 2) o.push(["b", "Defence laser silos may fire from now"]);
      if (T === 3) { o.push(["b", "Arriving: Virulent; missile silos ready"]); o.push(["a", "Transports may leave orbit"]); }
      if (T === 4) o.push(["a", "End of turn: Plaguebearer roll (1–2)"]);
      if (T === 5) { o.push(["b", "Arriving: the Planet Killer and the main fleet"]); o.push(["a", "Rescue Captain Semper"]); }
      return o;
    },
    tools: [
      { k: "counter", id: "out", l: "Transports escaped", s: "a", max: 15, res: 1 },
      { k: "toggle", id: "bel", l: "Belatis has been destroyed", s: "b" },
      { k: "toggle", id: "pk", l: "The Planet Killer has been destroyed", s: "a" },
      { k: "toggle", id: "sem", l: "Captain Semper rescued (Macharius Ld 8)", s: "a" },
      { k: "roll", id: "plague", l: "Plaguebearer, end of turn 4", rows: () => [[1, 2, "The Macharius suffers engines, thrusters and shields criticals"], [3, 6, "Nothing happens"]] }
    ],
    rtools: [{ k: "toggle", id: "over", l: "No transports left on the table — the game is over" }, { k: "html", html: "<table class='ltab'><tr><td></td><td><b>Belatis destroyed</b></td><td><b>Belatis survives</b></td></tr><tr><td>0–5 out</td><td>Chaos victory</td><td>Draw</td></tr><tr><td>6–10 out</td><td>Chaos minor victory</td><td>Imperial minor victory</td></tr><tr><td>11–15 out</td><td>Draw</td><td>Imperial victory</td></tr></table><p class='small muted' style='margin:6px 0 0'>Planet Killer destroyed: Imperial major victory, whatever else happened.</p>" }],
    end: ["When every Imperial transport has left the table or been destroyed."],
    win: ["Planet Killer destroyed: Imperial major victory.", "Otherwise it depends on Belatis and the transports that got away: see the table under Check."],
    result(st) {
      if (get(st, "pk", false)) return ["a", "Imperial major victory", "The Planet Killer is destroyed."];
      const n = get(st, "out", 0), b = get(st, "bel", false), band = n >= 11 ? 2 : n >= 6 ? 1 : 0;
      const t = b ? [["b", "Chaos victory"], ["b", "Chaos minor victory"], ["draw", "Draw"]][band] : [["draw", "Draw"], ["a", "Imperial minor victory"], ["a", "Imperial victory"]][band];
      return [t[0], t[1] + (get(st, "over", false) ? "" : " — if it ended now"), n + " transports out; Belatis " + (b ? "destroyed" : "still alive") + "."];
    },
    info: { bg: "Belatis cannot be saved: Abaddon’s Planet Killer is on its way. Cultists have taken the ground defences, and the last evacuation fleet is leaving orbit. Captain Leoten Semper of the Macharius, thought dead in a shuttle crash, signals from the surface — and aboard the plague ship Virulent, Bulus Sirl has already slipped a daemon into the Macharius’s lower decks.", cr: ["Tim Driscole — “Execution Hour”, based on Gordon Rennie’s Black Library novel, " + BM(8) + ", p. 21–23 (PDF p. 23–25)."] }
  },
  /* ------------------------------------------------------------ THE SIEGE */
  {
    id: "cl-siege", grp: "cl-mag", name: "The Siege", series: "BFG Magazine 9 · fortress assault", trust: "classic",
    why: "Crack a star fort or Blackstone Fortress while its fleet trickles back from the edges of the system.", src: "BFG Magazine 9 p. 22–23", book: "O", suggest: ["Chaos", "Imperial Navy"],
    others: "Any attacker against any defender with a Ramilies star fort or a Blackstone Fortress (Imperial or Chaos).",
    sides: { a: { n: "Defender", f: "Imperial Navy" }, b: { n: "Attacker", f: "Chaos" } },
    pitch: "Fast raiders have scattered the defenders across the system. Now the main fleet strikes at the fortress before the patrols can get back.",
    glance: [["Points", "Equal, about 1500 · fortress from the defender’s points"], ["Table", "Not given — use your table"], ["Battlezone", "Rolled: mercurial to outer reaches"], ["First turn", "Roll-off"], ["Game ends", "The fortress falls or the attacker leaves"]],
    bring: ["A Ramilies star fort or a Blackstone Fortress", "Planetary defences", "Contact markers or notes for five groups"],
    forces: {
      a: ["The agreed points, including a primary defence: a Ramilies star fort or a Blackstone Fortress, paid for from your list.", "Plus D6×10 pts of defences for every 500 pts (or part) of the attacking fleet (tool below).", "Up to 25% of your points may also go on more planetary defences.", "The rest of the fleet in five groups (at least one ship or squadron each)."],
      b: ["The agreed points."]
    },
    draw: (v, W, H) => [
      { z: "circ", cx: W / 2, cy: H / 2, r: 60, s: "a", l: "" },
      { z: "line", x1: 15, y1: 15, x2: W - 15, y2: 15 }, { z: "line", x1: 15, y1: H - 15, x2: W - 15, y2: H - 15 }, { z: "line", x1: 15, y1: 15, x2: 15, y2: H - 15 }, { z: "line", x1: W - 15, y1: 15, x2: W - 15, y2: H - 15 },
      { z: "circ", cx: W / 2, cy: H / 2, r: 20, s: "a", l: "" },
      { z: "mark", x: W / 2, y: H / 2, s: "a", l: "primary defence" },
      { z: "text", x: W / 2, y: H / 2 + 26, l: "starting group: 20 cm", s: "a" },
      { z: "text", x: W / 2, y: Math.max(22, H / 2 - 50), l: "defences: within 60 cm, 15 cm+ from edges", s: "a" },
      ...EDGES4("b", "Attacker: within 15 cm of any one edge")
    ],
    fit: () => [90, 90],
    mapNote: "The primary defence goes in the centre, at least 45 cm from every edge. The outer circle is 60 cm (clipped 15 cm inside the edges on smaller tables).",
    steps: [
      { t: "Agree the points (1500 works well). Roll the battlezone (tool below) and set up phenomena as normal." },
      { s: "a", t: "Roll your extra defences: D6×10 pts for every 500 pts (or part) of the attackers (tool below)." },
      { s: "a", t: "Place the primary defence in the centre, at least 45 cm from every edge. Place the planetary defences within 60 cm of it and at least 15 cm from every edge." },
      { s: "a", t: "Split the rest of the fleet into five groups. Roll a D6 (re-roll 6s) for the starting group and deploy it within 20 cm of the primary defence. With a Blackstone Fortress, use two groups instead: one starts on the table, the other arrives on turn 2." },
      { s: "b", t: "Deploy the whole fleet within 15 cm of any one table edge: that is your edge." },
      { t: "Roll off. The higher roll takes the first turn." }
    ],
    stools: [
      { k: "roll", id: "bz", l: "Battlezone", rows: () => [[1, 1, "Mercurial zone"], [2, 3, "Inner biosphere"], [4, 5, "Primary biosphere"], [6, 6, "Outer reaches"]] },
      { k: "shiproll", id: "def", l: "Extra defences", cl: "Dice (one per 500 pts of attackers, or part)", n0: 3, il: i => "Die " + (i + 1), out: d => d * 10 + " pts", foot: st => { const r = get(st, "def", null); return r ? "<p class='calc' style='margin:4px 0 0'>Total: <b>" + r.reduce((a, b) => a + b, 0) * 10 + " pts</b> of defences.</p>" : ""; } },
      { k: "roll", id: "grp", l: "Starting group", sub: "D6, re-roll 6s", rows: () => [[1, 1, "Group 1"], [2, 2, "Group 2"], [3, 3, "Group 3"], [4, 4, "Group 4"], [5, 5, "Group 5"], [6, 6, "Roll again"]] }
    ],
    notes: [OLD + "Ramilies star fort and Blackstone Fortress: FL p. 500– (high orbit defences). Planetary defences: FL p. 496–.", "The battlezone table prints “2–3 inner biosphere, 3–5 primary biosphere”; read as 4–5 for the primary biosphere.", "With a Blackstone Fortress, if the rolled edge for the turn 2 group cannot be used, roll again until one can."],
    refs: [["High orbit defences (Ramilies, Blackstone)", "FL p. 500–"], ["Planetary defences", "FL p. 496–"], ["Battlezone generators", "RB p. 104–108"]],
    play: [
      { w: "End of your turn", s: "a", t: "Pick one of your waiting groups at random and place it on a random table edge (tool below) — not the attacker’s edge, and not within 60 cm of any enemy ship." },
      { w: "All game", s: "b", t: "Destroy the primary defence. You get no reinforcements." }
    ],
    fx: () => [["a", "End of your turn: a random group arrives on a random edge"]],
    tools: [
      { k: "reinf", id: "rg", l: "Arriving group", s: "a", die: 6, from: 1, verb: "arrives", sub: "D6 in your end phase · groups already in play are rolled again · tap a row to mark it", dup: "already in play.", again: true, rows: [[1, "Group 1"], [2, "Group 2"], [3, "Group 3"], [4, "Group 4"], [5, "Group 5"], [6, "6 — roll again", "again"]] },
      { k: "roll", id: "edge", l: "Arrival edge (re-roll the attacker’s edge)", rows: RANDOM_EDGE }
    ],
    rtools: [{ k: "ending", id: "how", l: "How did it end?", rows: [["The primary defence was destroyed", "b"], ["The attacker disengaged", "a"]] }],
    end: ["When the primary defence is destroyed, or the attacking force disengages."],
    win: ["The attacker wins by destroying the primary defence; the defender wins by stopping it."],
    result(st, v, S) { return endingResult(st, S, "how"); },
    info: { bg: "A Ramilies star fort or a Blackstone Fortress can stop a raid cold. The usual answer is to flood the system with fast raiders, scatter the defending fleet to its far reaches, and then strike the fortress with a force big enough to break through before the defenders return.", cr: ["Eric Kelley — “Scenario: The Siege”, " + BM(9) + ", p. 22–23 (PDF p. 24–25), playtested by a dozen named players."] }
  },
  /* ------------------------------------------------------------ THE DEFENCE OF MACRAGGE */
  {
    id: "cl-defence-of-macragge", grp: "cl-mag", name: "The Defence of Macragge", series: "First Tyrannic War · BFG Magazine 10", trust: "classic", players: [2, 3],
    why: "A huge battle: the Ultramarines hold out against Hive Fleet Behemoth until the relief fleet from Bakka drops out of the warp at a secret moment.", src: "BFG Magazine 10 p. 6–9", book: "O", suggest: ["Space Marines", "Tyranids", "Imperial Navy"],
    others: "Written for Ultramarines, Battlefleet Bakka and Tyranids; a third player can take the Bakka fleet. Any defender, relief fleet and swarm can stand in. The winners can go on to Rath’s Last Stand.",
    sides: { a: { n: "Ultramarines", f: "Space Marines" }, b: { n: "Hive Fleet Behemoth", f: "Tyranids" }, c: { n: "Bakka relief fleet", f: "Imperial Navy (Bakka)" } },
    pitch: "The hive fleet has pushed in-system to Macragge. Calgar’s battered fleet must keep fighting until the Tempestus fleet arrives — whenever that is.",
    glance: [["Points", "Ultramarines 2500 + Bakka 3000 · Tyranids 5000"], ["Table", "Large — see the map"], ["Battlezone", "Outer reaches, no warp rifts"], ["First turn", "Not given — see note"], ["Game ends", "2D6 turns after the relief arrives (secret)"]],
    bring: ["Very large fleets and a large table", "The Dominus Astra (Emperor class)", "A warp rift template", "Scatter dice and 4D6"],
    forces: {
      a: ["2500 pts from the Space Marine fleet list (FL p. 97), plus system ships and defence monitors (FL p. 496–).", "At least one battle barge carrying Marneus Calgar, as a Master of the Fleet (FL p. 97)."],
      b: ["5000 pts of Tyranids (FL p. 430) with evolutions if you like — plenty of hive ships."],
      c: ["3000 pts from the Bakka Sector fleet list (FL p. 48).", "Must include the Emperor class battleship Dominus Astra with assault boats, commanded by Lord Admiral Zaccarius Rath."]
    },
    draw: (v, W, H) => {
      const top = Math.min(30, H / 3), gap = Math.min(60, H - top - 10);
      return [
        R(45, 0, Math.max(5, W - 90), top, "a", "Ultramarines"),
        R(0, top + gap, W, Math.max(5, H - top - gap), "b", "Tyranids"),
        { z: "dim", x1: 0, y1: 8, x2: 45, y2: 8, l: "45 cm" }, { z: "dim", x1: W - 45, y1: 8, x2: W, y2: 8, l: "45 cm" },
        { z: "dim", x1: W / 2, y1: top, x2: W / 2, y2: top + gap, l: "60 cm" }
      ];
    },
    fit: () => [150, 110],
    mapNote: "As the magazine’s map: the Ultramarines 30 cm deep, 45 cm in from both short edges; the Tyranids along the opposite long edge, 60 cm away. The relief fleet appears anywhere later.",
    steps: [
      { t: "Generate outer reaches phenomena; re-roll any warp rift (one arrives later)." },
      { t: "Deploy the Ultramarines and the Tyranids as on the map. The Bakka fleet stays off the table." },
      { t: "Roll damage before the battle (tools below): every Ultramarine and Tyranid cruiser-sized ship starts with D3 hits lost, every battleship with D6." },
      { s: "b", t: "Roll D6+2 in secret for the turn the relief fleet arrives (tool below)." },
      { t: "Decide who goes first (see note)." }
    ],
    stools: [
      { k: "shiproll", id: "cr", l: "Cruiser-sized ships: D3 hits lost", cl: "Cruisers (both fleets)", n0: 6, il: i => "Cruiser " + (i + 1), out: d => Math.ceil(d / 2) + " hits lost" },
      { k: "shiproll", id: "bb", l: "Battleships and hive ships: D6 hits lost", cl: "Battleships (both fleets)", n0: 2, il: i => "Battleship " + (i + 1), out: d => d + " hits lost" },
      { k: "secret", id: "arr", l: "The relief fleet arrives (D6+2)", sub: "Tyranid player: roll in secret and tell the Imperial players only when it happens.", opts: ["Turn 3", "Turn 4", "Turn 5", "Turn 6", "Turn 7", "Turn 8"], rnd: true }
    ],
    notes: [OLD + "Space Marines (Warp Storm and BFG Magazine 3), Bakka (2002 Annual) and the Tyranids (BFG Magazine 1) now all have Fleets book lists. The magazine printed temporary Tyranid profiles (hive ship, Razorfiend cruiser, Stalker and Prowler escorts) that the Fleets book replaces.",
      "The article does not say who has the first turn. Suggestion: the Tyranids, who are attacking.",
      "“Every cruiser sized vessel” is read as cruisers, heavy cruisers and battlecruisers; Tyranid hive ships count as battleships here."],
    refs: [["Space Marine fleet list, Master of the Fleet", "FL p. 97"], ["Bakka Sector fleet list, Lord Admiral Rath", "FL p. 48"], ["Tyranid fleet lists", "FL p. 429–430"], ["Warp rifts", "RB p. 111"]],
    play: [
      { w: "Relief fleet arrival", s: "c", t: "On the secret turn: roll 2D6 for every ship except the Dominus Astra (tool below) — a double 1 is lost in the warp. Place the Dominus Astra anywhere, then roll the scatter dice and 4D6 and move it that far (a hit leaves it in place). Place every other ship within 10 cm of a ship already placed." },
      { w: "The warp rift", s: "c", t: "Place a warp rift behind the Dominus Astra. It does not affect ships arriving that turn, but stays for the rest of the battle." },
      { w: "Game length", s: "b", t: "When the relief fleet arrives, roll 2D6 in secret: the game lasts that many more turns (tool below)." },
      { w: "Victory", t: "Every Tyranid ship dead at the end of the last turn: Imperial victory. Anything else: Tyranid victory." }
    ],
    tools: [
      { k: "secret", id: "arr", l: "The relief fleet arrives (D6+2)", sub: "Tyranid player: roll in secret and tell the Imperial players only when it happens.", opts: ["Turn 3", "Turn 4", "Turn 5", "Turn 6", "Turn 7", "Turn 8"], rnd: true },
      { k: "toggle", id: "in", l: "The relief fleet has arrived", s: "c" },
      { k: "shiproll", id: "warp", l: "Lost in the warp?", cl: "Arriving ships (not the Dominus Astra)", n0: 10, il: i => "Ship " + (i + 1), roll: () => [d6(), d6()], btn: n => "Roll 2D6 for " + n + " ships", out: d => d[0] === 1 && d[1] === 1 ? "double 1 — lost in the warp" : "arrives" },
      { k: "val", id: "sc", l: "Dominus Astra scatter: 4D6 cm", opts: [], roll: () => d6() + d6() + d6() + d6(), unit: " cm" },
      { k: "secret", id: "len", l: "Turns left after the relief arrives (2D6)", sub: "Tyranid player: roll in secret when the relief fleet arrives.", opts: ["2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"], rnd: true, roll: () => d6() + d6() - 2 },
      { k: "counter", id: "nids", l: "Tyranid ships still alive", s: "b", start: 1, res: 1 }
    ],
    fx: (T, st) => !get(st, "in", false) && T >= 3 && T <= 8 ? [["b", "Is this the secret arrival turn? Tell the Imperial players if so"]] : get(st, "in", false) ? [["b", "Game ends after the secret 2D6 turns"]] : [],
    rtools: [{ k: "html", html: "<h3>Campaign</h3><p>If the Imperials win, fight " + link("cl-raths-last-stand", "Rath’s Last Stand") + " with the survivors of the Bakka fleet.</p>" }],
    end: ["2D6 turns after the relief fleet arrives (rolled in secret)."],
    win: ["If every Tyranid ship is dead at the end of the last turn, the Imperials win. Otherwise the Tyranids win."],
    result(st) { const n = get(st, "nids", 1); return n === 0 ? ["a", "Imperial victory", "Hive Fleet Behemoth is broken — on to Rath’s Last Stand."] : [null, "Tyranid victory unless the last ship falls", n + " Tyranid ship" + (n === 1 ? "" : "s") + " still alive."]; },
    info: { bg: "When Hive Fleet Behemoth reached Macragge, Marneus Calgar drew it onto the planet’s defences and struck while it was spread out. Fighters from Macragge crippled a hive ship and the swarm lost its cohesion — and then the relief fleet from Bakka arrived. The story continues at Circe.", cr: ["Tim Driscole — “The Defence of Macragge”, " + BM(10) + ", p. 6–9 (PDF p. 8–11). Background from Andy Chambers’s Codex Tyranids."] }
  }
  ]);
})();
