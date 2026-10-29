/* Warp Rift community scenarios without play reports (class L4), part A:
   Forcing the Mobeel Narrows (WR5), Choir of a Thousand Voices (WR9), the two Space Wolf
   scenarios (WR13) and the two Diasporex scenarios (WR15). Summarised in our own words;
   each scenario hand-made (see docs/history/scenarios/LUEMINUT.md, in Finnish). */
(function () {
  const NO_REPORT = "Community scenario; the source gives no play report.";
  const DIASP = "Written for the fan-made Diasporex fleet (Warp Rift 15).";

  addScenarios([
  /* ------------------------------------------------------------ MOBEEL NARROWS */
  {
    id: "wr-mobeel-narrows", grp: "untested", name: "Damn the Torpedoes! — Forcing the Mobeel Narrows", series: "Gothic War · historical analogue", trust: "untested",
    why: NO_REPORT + " Modelled on the Battle of Mobile Bay (1864).", src: "Warp Rift 5, pp. 27–32", book: "O", suggest: ["Imperial Navy", "Chaos"],
    others: "Any attacker with a cruiser core and a defender with one battleship, two stations and a minefield can refight it — the forces are fixed lists, not points.",
    sides: { a: { n: "Port-breaking fleet", f: "Imperial Navy" }, b: { n: "Narrows defence", f: "Chaos" } },
    pitch: "An Imperial fleet forces a 60 cm gap between two forts, through a minefield, with a traitor-crewed Desolator waiting behind it. Reinforcements arrive on a D20.",
    glance: [["Points", "Fixed forces"], ["Table", "Not given (map only)"], ["Battlezone", "Impassable asteroid barrier with a 60 cm gap"], ["First turn", "Not given"], ["Victory", "First to reach their objective"]],
    bring: ["Asteroid fields for a barrier across the table", "2 space stations (the forts)", "An orbital torpedo launcher", "3 minefields", "A D20"],
    forces: {
      a: ["Admiral (Ld 9, 2 re-rolls) on a cruiser of your choice.", "2 Dominators, 2 Gothics, 4 Dauntless, 4 Swords, 6 Cobras.", "Reinforcements on a D20 from turn 3 (Play tab): 4 Space Marine Firestorms (Ld 9), 2 escort carriers, 4 defence monitors."],
      b: ["Chaos Lord with the Mark of Tzeentch on the Desolator: Ld +1 and 1 re-roll.", "Desolator with vortex torpedoes and a Thousand Sons crew with Terminators (Ld +1).", "4 Infidels with vortex torpedoes, as one squadron.", "2 space stations (Fort Morgan and Fort Gaines), an orbital torpedo launcher with vortex torpedoes, and 3 minefields.", "Reinforcements on a D20 from turn 3: 4 more Infidels, 6 Iconoclasts, a Styx."]
    },
    draw: (v, W, H) => { const yb = Math.min(H * .5, H - 15 - 20 - 8), gx = W / 2;
      return [R(0, H - 15, W, 15, "a", "Imperial deployment and reinforcements: 15 cm"),
        { z: "hatch", x: 0, y: yb - 9, w: gx - 30, h: 18, l: "", free: "y" }, { z: "hatch", x: gx + 30, y: yb - 9, w: W - gx - 30, h: 18, l: "", free: "y" },
        { z: "text", x: (gx - 30) / 2, y: yb + 17, l: "impassable\nasteroids" }, { z: "text", x: gx + 30 + (W - gx - 30) / 2, y: yb + 17, l: "impassable\nasteroids" },
        { z: "mark", x: gx - 30, y: yb, s: "b", l: "Fort Gaines" }, { z: "mark", x: gx + 30, y: yb, s: "b", l: "Fort Morgan" },
        R(gx - 22, yb - 5, 44, 10, "b", "3 minefields", { dash: 1, free: 1 }), { z: "mark", x: gx, y: yb - 20, s: "b", l: "torpedo launcher", free: 1 },
        { z: "dim", x1: gx - 30, y1: yb + 18, x2: gx + 30, y2: yb + 18, l: "60 cm gap" },
        R(W - 50, 0, 50, Math.min(28, yb - 22), "b", "Chaos zone\n(size not given)", { dash: 1, free: 1 })]; },
    fit: () => [100, 80],
    mapNote: "Drawn from the article’s sketch, which gives only the 15 cm Imperial zone and the 60 cm gap. The Chaos zone is an oval in one corner behind the barrier.",
    steps: [
      { t: "Build an asteroid barrier across the table, leaving a gap of at least 60 cm. For this game the asteroids are impassable." },
      { s: "b", t: "Place the two forts (space stations) against the asteroids on either side of the gap, so no ship can pass behind them." },
      { s: "b", t: "Place the three minefields in the gap, no closer than 20 cm to the Imperial start line, and the torpedo launcher behind them on your side." },
      { s: "b", t: "Set up the Desolator and the Infidels in your zone behind the barrier." },
      { s: "a", t: "Set up within 15 cm of your long edge." }
    ],
    notes: ["The source gives no table size, first turn or game length. Roll off for the first turn.", "The source’s “no loser than 20cm” is read as “no closer than 20 cm”.", "The original minefields predate the Fleets book; use the minefield rules of FL p. 513 (the source places them itself, so ignore the 15 cm placement limit).", "The line objective is hard to read: three Imperial capital ships (light cruiser or bigger) must form an unbroken chain through the narrows, from one end of the table to the other, with no Chaos ship within 10 cm of the line. Agree how you measure it before play."],
    refs: [["Space station", "FL p. 507"], ["Orbital torpedo launcher", "FL p. 510"], ["Minefield", "FL p. 513"], ["Vortex torpedoes", "FL p. 21"], ["Chaos Space Marine crews", "FL p. 235"], ["Defence monitor", "FL p. 514"], ["Escort carrier", "FL p. 521"]],
    play: [
      { w: "From turn 3", t: "Each side rolls a D20 every turn for reinforcements, entering from its own deployment zone. Each result arrives only once; repeats are ignored." },
      { w: "Imperial goal", s: "a", t: "Destroy both forts — or destroy a Chaos capital ship and one fort and hold the narrows: three capital ships in an unbroken line through the gap with no Chaos ship within 10 cm of it." },
      { w: "Chaos goal", s: "b", t: "Destroy all four Imperial cruisers." },
      { w: "Asteroids", t: "Impassable. Ships must go through the 60 cm gap." }
    ],
    fx: T => T >= 3 ? [["a", "Roll a D20 for reinforcements"], ["b", "Roll a D20 for reinforcements"]] : T === 2 ? [[null, "Reinforcement rolls start next turn"]] : [],
    tools: [
      { k: "reinf", id: "rfa", l: "Imperial reinforcements", s: "a", die: 20, from: 3, where: "in the Imperial zone", rows: [[7, "4 Firestorms of the White Consuls (Ld 9)"], [14, "2 escort carriers"], [20, "4 defence monitors"]] },
      { k: "reinf", id: "rfb", l: "Chaos reinforcements", s: "b", die: 20, from: 3, where: "in the Chaos zone", rows: [[7, "4 Infidels with vortex torpedoes (one squadron)"], [14, "6 Iconoclasts (one squadron)"], [20, "A Styx heavy cruiser"]] },
      { k: "toggle", id: "f1", l: "Fort Gaines destroyed", s: "a" }, { k: "toggle", id: "f2", l: "Fort Morgan destroyed", s: "a" },
      { k: "toggle", id: "cap", l: "A Chaos capital ship destroyed", s: "a" },
      { k: "counter", id: "cr", l: "Imperial cruisers destroyed", s: "b", max: 4, goal: 4 }
    ],
    end: ["As soon as one side reaches its objective."],
    win: ["The first player to reach their objective wins."],
    rtools: [{ k: "ending", id: "how", l: "How did it end?", rows: [["Both forts destroyed", "a"], ["A capital ship and a fort destroyed, and the narrows held", "a"], ["All four Imperial cruisers destroyed", "b"]] }],
    result(st, v, S) { return endingResult(st, S, "how"); },
    info: { bg: "Abaddon’s rebels hold the only spaceport of a weapons-producing system, reached only through a gap blasted in a dense asteroid belt and guarded by two forts. An Imperial admiral sets out to force the narrows. The author built it on the Battle of Mobile Bay (1864) — forts, “torpedoes”, an ironclad and Farragut’s famous order — and strengthened the defence so the game is closer than the history.", cr: [wrCredit(5, "Gaunts Ghost"), "The author lists two Osprey and Scholarly Books histories of the US Civil War at sea as sources."] }
  },
  /* ------------------------------------------------------------ CHOIR OF A THOUSAND VOICES */
  {
    id: "wr-choir-thousand-voices", grp: "untested", name: "Choir of a Thousand Voices", series: "Convoy attack", trust: "untested",
    why: NO_REPORT + " Written by Warp Rift’s editor of the time.", src: "Warp Rift 9, pp. 31–33 (also Warp Rift Lite 9)", book: "O", suggest: ["Imperial Navy", "Chaos"],
    others: "Any raider can try to seize a valuable transport; the desecration can stand for any boarding party with a special job.",
    sides: { a: { n: "Black Ship escort", f: "Imperial Navy" }, b: { n: "Raiders", f: "Chaos" } },
    pitch: "Chaos raiders hide in the dark along the flanks of an Inquisition prison ship full of psykers — and want it whole, to turn it into a daemon ship.",
    glance: [["Points", "Fixed forces"], ["Table", "Played lengthways"], ["Battlezone", "Outer Reaches or deep space"], ["First turn", "Imperials"], ["Victory", "Major or minor, by the Black Ship’s fate"]],
    bring: ["A super-heavy transport (the Black Ship)", "4 hidden set-up markers"],
    forces: {
      a: ["The Black Ship: a heavy transport with the Super-Heavy Transport option (FL p. 192).", "Two cruisers and one squadron of five escorts. At most one cruiser with launch bays, and fighters only — no bombers."],
      b: ["Four cruisers; at most one with launch bays."]
    },
    draw: (v, W, H) => [{ z: "circ", cx: 5, cy: H / 2, r: 15, s: "a", l: "", free: 1 }, { z: "mark", x: 5, y: H / 2, s: "a", l: "", free: 1 }, { z: "text", x: 44, y: H / 2 - 22, l: "Black Ship + escort\nwithin 15 cm", s: "a" },
      { z: "edge", e: "t", s: "b", dash: 1, l: "Chaos markers: anywhere along the long edges, 45 cm+ from Imperial ships" }, { z: "edge", e: "b", s: "b", dash: 1, l: "" },
      { z: "ring", cx: 5, cy: H / 2, r: 45 + 15, s: "b", free: 1 },
      { z: "edge", e: "r", s: "a", l: "Black Ship exit (Imperial)" }, { z: "edge", e: "l", s: "b", l: "Black Ship exit (if desecrated)" }],
    fit: () => [120, 60],
    mapNote: "The Black Ship may start anywhere on its short edge; drawn here at the middle. The outer circle shows roughly where no Chaos marker may go.",
    steps: [
      { t: "Choose Outer Reaches or deep space phenomena. Play along the length of the table." },
      { s: "a", t: "Place the Black Ship on one short edge, then the rest of your fleet within 15 cm of it (at least one escort within 15 cm)." },
      { s: "b", t: "Secretly assign one cruiser to each of four hidden set-up markers. Place them anywhere along either long edge, but not within 45 cm of an Imperial ship." },
      { s: "a", t: "You take the first turn. Your ships may leave the formation as soon as play starts." }
    ],
    notes: ["The original points to the Merchantmen article’s Super Heavy Troop Transporter; the Remastered equivalent is the heavy transport’s Super-Heavy Transport option (FL p. 192).", "The source lets the desecration be a hit-and-run attack “within 15 cm”. Use that range for this attack only.", "If Chaos destroys the Black Ship after desecrating it, the source names no result — agree it."],
    refs: [["Heavy transport (Super-Heavy option)", "FL p. 192"], ["Hit-and-run attacks", "RB p. 91"], ["Daemonships", "FL p. 236"]],
    play: [
      { w: "Hidden markers", s: "b", t: "In your turn, either reveal any markers as their ships (before acting, so they may move and use special orders at once), or move a marker up to 15 cm. A marker cannot shoot or launch." },
      { w: "Desecration", s: "b", t: "Only a hit-and-run attack within 15 cm of the Black Ship can do it — not boarding torpedoes or assault boats. Declare it before rolling. It causes no damage; if it succeeds, roll a D6: 4+ the Black Ship becomes a daemon vessel under your control and may act this turn; 1–3 nothing happens. One attempt per Chaos ship per turn." },
      { w: "Leaving the table", t: "The Black Ship may only leave over a short edge: the far one under Imperial control, its starting edge under Chaos control. Other ships may leave over any edge but cannot come back." }
    ],
    tools: [
      { k: "counter", id: "mk", l: "Hidden markers still on the table", s: "b", start: 4, max: 4 },
      { k: "roll", id: "des", l: "Desecration", sub: "D6 after a successful hit-and-run", rows: () => [[1, 3, "Interrupted — no effect. Try again next turn."], [4, 6, "The Black Ship is corrupted: it is now a Chaos daemon vessel."]] },
      { k: "toggle", id: "dem", l: "The Black Ship is a daemon vessel (Chaos controls it)", s: "b" }
    ],
    end: ["The Black Ship leaves over a short edge, or is destroyed (reduced to a hulk counts)."],
    win: ["Imperial major: the Black Ship leaves over the far short edge.", "Imperial minor: it was desecrated, then the Imperials destroyed it.", "Chaos minor: Chaos destroyed it.", "Chaos major: desecrated and escorted off its starting edge."],
    rtools: [{ k: "ending", id: "how", l: "How did it end?", rows: [["Imperial major — the Black Ship escaped", "a"], ["Imperial minor — desecrated, then destroyed by the Imperials", "a"], ["Chaos minor — Chaos destroyed it", "b"], ["Chaos major — desecrated and taken off its starting edge", "b"]] }],
    result(st, v, S) { return endingResult(st, S, "how"); },
    info: { bg: "Black Ships carry the psykers the Inquisition has gathered to the Emperor’s table. Packed with thousands of weak psychic minds, they are a lure for Chaos: perform the right rites aboard, and the ship becomes a gateway for daemons. Here the prison vessel is a lightly armed transport needing escort, not the Inquisition flagship of the fleet lists.", cr: [wrCredit(9, "CyberShadow (Iain)"), "The author edited Warp Rift from 2004 to 2006. The scenario was reprinted in Warp Rift Lite 9."] }
  },
  /* ------------------------------------------------------------ WOLF HUNT */
  {
    id: "wr-wolf-hunt", grp: "untested", name: "Wolf Hunt", series: "Space Wolf scenarios · I", trust: "untested",
    why: NO_REPORT, src: "Warp Rift 13, pp. 36–37", book: "O", suggest: ["Space Marines", "Imperial Navy"],
    others: "Any hunter fleet versus any escorted convoy: the twist is that one of two identical cruisers is a traitor nobody can identify until turn 3.",
    sides: { a: { n: "Task force", f: "Imperial Navy" }, b: { n: "Wolves", f: "Space Marines (Space Wolves)" } },
    pitch: "One of two identical cruisers in an Imperial convoy will betray it — but which? The Space Wolves must take it without destroying any loyal ship.",
    glance: [["Points", "Wolves 1250 · Imperials 750 + 500 transports"], ["Table", "Rectangular, played lengthways"], ["Battlezone", "Deep space, asteroids before the jump point"], ["First turn", "Imperials"], ["Game length", "8 turns"]],
    bring: ["Two cruisers of the same class", "Transports worth 500 pts", "An asteroid field", "Two paper slips (or the hidden draw below)"],
    forces: {
      a: ["Up to 750 pts of warships escorting 500 pts of transports.", "Include two cruisers of the same class. The task force commander rides one of them.", "No ship over 185 pts (as in Cruiser Clash)."],
      b: ["Up to 1250 pts; no ship over 185 pts.", "You must not destroy Imperial ships — crippling them is allowed. The Imperials have no such qualms."]
    },
    draw: (v, W, H) => [R(0, 0, W, 45, "b", "A — Wolves: 45 cm"), R(0, H - 45, W, 45, "b", "B — Wolves: 45 cm"),
      { z: "text", x: W - 18, y: H / 2, l: "convoy zone", s: "a" },
      { z: "hatch", x: 45, y: H / 2 - 10, w: 8, h: 20, l: "", free: 1 }, { z: "text", x: 70, y: H / 2, l: "asteroids\nD6×5 cm" },
      { z: "dim", x1: 0, y1: H / 2 - 14, x2: 45, y2: H / 2 - 14, l: "45 cm" },
      { z: "edge", e: "l", s: "a", l: "Jump point — the convoy’s exit" }, { z: "edge", e: "r", s: "a", l: "Convoy enters (not within 45 cm of a long edge)" }],
    fit: () => [120, 100],
    mapNote: "On tables under 100 cm deep the two 45 cm zones squeeze the convoy zone to nothing; the author recommends a long rectangular table.",
    steps: [
      { t: "Set up deep space phenomena by agreement, then an asteroid field D6×5 cm long across the convoy’s path, 45 cm from the jump point edge (moving through asteroids: RB p. 110)." },
      { s: "b", t: "Roll a D6 for each ship or squadron to see whether it sets up in zone A or zone B, then deploy." },
      { s: "a", t: "Put one ship on the far short edge to mark where the convoy will enter. The convoy may not enter within 45 cm of either long edge." },
      { s: "a", t: "Draw the traitor at random with the hidden draw below — reveal it on turn 3." }
    ],
    stools: [
      { k: "roll", id: "zone", l: "Wolf deployment zone", sub: "D6 per ship or squadron", rows: () => [[1, 3, "Zone A"], [4, 6, "Zone B"]] },
      { k: "secret", id: "traitor", l: "Which cruiser is the traitor?", sub: "Draw it now and keep it hidden. The traitor sends its signal on turn 3.", rnd: 1, opts: ["The commander’s flagship", "The other cruiser of the class"] }
    ],
    notes: ["The source says to roll for A or B without saying which numbers mean which — 1–3 and 4–6 are used here.", "The source suggests paper slips for the traitor; the hidden draw does the same.", "How a capture works is not given (the Wolves may not destroy the ship) — agree it before play, for example a won boarding action against the crippled traitor.", "“Move off the jump point edge” does not say which ships must get away — the transports and the traitor are the natural reading."],
    refs: [["Cruiser Clash (185 pt limit)", "RB p. 128"], ["Asteroid fields", "RB p. 110"], ["Boarding actions", "RB p. 89"]],
    play: [
      { w: "Turns 1–2", s: "a", t: "The convoy moves on from the marked point. Anything not on by your second turn is lost. If either cruiser of the pair is not on by turn 2, the Wolves win." },
      { w: "Turn 3", t: "The traitor sends its signal: reveal the hidden draw." },
      { w: "All game", s: "b", t: "Cripple, do not destroy. Capture the traitor." }
    ],
    fx: T => T === 1 ? [["a", "The convoy starts moving onto the table"]] : T === 2 ? [["a", "Last chance to enter — both same-class cruisers must be on"]] : T === 3 ? [[null, "The traitor reveals itself"]] : T === 8 ? [[null, "Last turn"]] : [],
    tools: [{ k: "toggle", id: "cap", l: "The traitor is captured", s: "b" }],
    end: ["After eight turns, or when one side has won."],
    win: ["Wolves: capture the traitor ship, or one of the two cruisers never entered by turn 2.", "Imperials: get off the jump point edge, or destroy the Wolves."],
    rtools: [{ k: "ending", id: "how", l: "How did it end?", rows: [["The traitor was captured", "b"], ["A cruiser of the pair never entered", "b"], ["The convoy got off the jump point edge", "a"], ["The Wolves were destroyed", "a"]] }],
    result(st, v, S) { return endingResult(st, S, "how"); },
    info: { bg: "A raid on a renegade station gives the Space Wolves fragments of a plot: a ship in an Imperial task force will betray it to a Chaos ambush. The data names only the class — and there are two ships of that class, one of them the commander’s flagship. The Wolves cannot warn anyone they trust, so they attack the convoy themselves.", cr: [wrCredit(13, "Dex “Admiral D’Artagnan” Sy"), "The author was later thanked in the rules committee’s Armada Indomitus: Orks codex."] }
  },
  /* ------------------------------------------------------------ HUNTER HUNTED */
  {
    id: "wr-hunter-hunted", grp: "untested", name: "Hunter Hunted", series: "Space Wolf scenarios · II", trust: "untested",
    why: NO_REPORT + " A heavily modified Blockade Run.", src: "Warp Rift 13, pp. 38–39", book: "O", suggest: ["Space Marines", "Imperial Navy"],
    others: "Any fleet escorting a captured, crippled prize past a stronger blockade.",
    sides: { a: { n: "Blockade", f: "Imperial Navy" }, b: { n: "Wolves with their prize", f: "Space Marines (Space Wolves)" } },
    pitch: "The Navy wants its captured cruiser back. The Wolves limp it towards the far edge, half-wrecked and without All Ahead Full.",
    glance: [["Points", "Imperials 1500 · Wolves 1000 + the prize"], ["Table", "Played lengthways"], ["Battlezone", "Outer Reaches"], ["First turn", "Roll off; winner chooses"], ["Game length", "8 turns"]],
    bring: ["A Lunar (or other cruiser) as the captured ship", "Up to 3 minefields", "A small asteroid field"],
    forces: {
      a: ["Up to 1500 pts, only escorts, cruisers, battlecruisers and battleships."],
      b: ["Up to 1000 pts plus the captured cruiser (a Lunar is suggested).", "May buy up to 3 minefields.", "The prize: Ld 6, half its starting hits, no All Ahead Full. Everything else works."]
    },
    draw: (v, W, H) => [R(0, 0, 20, H / 2, "a", "1–3"), R(0, H / 2, 20, H / 2, "a", "4–6"), R(W - 10, 0, 10, H, "b", "Wolves: 10 cm", { rot: 90 }),
      { z: "hatch", x: W / 2 - 6, y: H / 2 - 6, w: 12, h: 12, l: "", free: 1 }, { z: "cm", x: W / 2, y: H / 2 }, { z: "text", x: W / 2, y: H / 2 + 14, l: "asteroids D3×5 by D3×5 cm" },
      { z: "arrow", x1: W - 25, y1: H / 2 - 25, x2: 40, y2: H / 2 - 25, s: "b", l: "the prize runs this way" }],
    fit: () => [90, 60],
    steps: [
      { t: "Outer Reaches. Place an asteroid field D3×5 cm by D3×5 cm in the middle of the table." },
      { s: "a", t: "Deploy within 20 cm of one short edge. Roll a D6 for each ship or squadron for its half of the zone. Ships may face any direction." },
      { s: "b", t: "Deploy everything, the prize included, within 10 cm of the opposite short edge." },
      { t: "Roll off: the winner chooses who goes first." }
    ],
    stools: [{ k: "roll", id: "half", l: "Blockade half", sub: "D6 per ship or squadron", rows: () => [[1, 3, "Upper half"], [4, 6, "Lower half"]] }],
    notes: ["The source says nova cannon ships “follow the rules under the Captured Cruiser entry”, which is not in the current books — agree how they work.", "“Ships with torpedoes have access to boarding torpedoes for free” sits in the Wolves’ forces text but does not name a side — agree it.", "The minefields’ placement is not given; FL p. 513 needs an edge within 15 cm of a feature."],
    refs: [["Blockade Run", "RB p. 133"], ["Minefield", "FL p. 513"], ["Boarding torpedoes", "RB p. 78"]],
    play: [
      { w: "All game", s: "b", t: "Get the prize off the Imperial short edge — that is an automatic win." },
      { w: "The prize", t: "It must not be destroyed: whoever’s fleet did not destroy it scores double its points value." }
    ],
    fx: T => T === 8 ? [[null, "Last turn"]] : [],
    tools: [{ k: "toggle", id: "out", l: "The prize got off the Imperial edge", s: "b" }, { k: "toggle", id: "dead", l: "The prize was destroyed (double VP to the other side)" }],
    end: ["After eight turns, or when the prize leaves the table."],
    win: ["Wolves win at once if the prize leaves over the Imperial edge.", "Otherwise victory points, with double value for the prize to the side that did not destroy it."],
    result(st) { return get(st, "out", false) ? ["b", "Wolves win", "The prize reached safety."] : [null, "Count victory points", get(st, "dead", false) ? "Remember the double value for the prize." : "Standard victory points."]; },
    info: { bg: "The Imperium’s patience has run out: an Inquisitor sends a task force to take back the cruiser the Wolves seized — and the Wolves, sure the ship’s records prove a conspiracy, will not give it up without a fight.", cr: [wrCredit(13, "Dex “Admiral D’Artagnan” Sy")] }
  },
  /* ------------------------------------------------------------ CAT AND MOUSE */
  {
    id: "wr-cat-and-mouse", grp: "untested", name: "Cat and Mouse", series: "Diasporex scenarios", trust: "untested",
    why: NO_REPORT + " " + DIASP, src: "Warp Rift 15, p. 31", book: "K", suggest: ["Diasporex (fan)", "Any patrol"],
    others: "Any small, fast fleet can be the mouse. The ratio matters more than the race.",
    sides: { a: { n: "The mouse", f: "Diasporex (or any small fleet)" }, b: { n: "The cat", f: "Any patrol fleet" } },
    pitch: "A small decoy force leads a patrol a merry chase through dense terrain. Survive ten turns and the rest of your fleet has done its job.",
    glance: [["Points", "Cat 4 : mouse 1 (e.g. 1000 : 250)"], ["Table", "Any; dense terrain"], ["Battlezone", "Any but Mercurial"], ["First turn", "The mouse"], ["Victory", "Mouse survives to turn 11"]],
    bring: ["Plenty of phenomena to hide among"],
    forces: { a: ["A quarter of the agreed limit (250 pts against 1000)."], b: ["The full agreed limit."] },
    draw: (v, W, H, st, sc) => { const d = agN(sc, st, "dep"); return [{ z: "circ", cx: W / 2, cy: H / 2, r: 10, s: "a", l: "", free: 1 }, { z: "text", x: W / 2, y: H / 2 - 16, l: "mouse: within 10 cm of each other", s: "a" },
      R(0, 0, d, H, "b", ""), { z: "text", x: d / 2 + 1.5, y: H / 2, l: "Cat " + d + " cm", s: "b", rot: -90 }, { z: "dim", x1: d, y1: H / 2 + 18, x2: W / 2 - 10, y2: H / 2 + 18, l: "60 cm +" }]; },
    fit: () => [140, 60],
    mapNote: "The mouse must be over 60 cm from the cat’s edge, so the centre only works on tables at least about 140 cm long — otherwise set it further from the cat.",
    steps: [
      { t: "Pick any battlezone except Mercurial and set up plenty of phenomena by agreement — enough for a chase." },
      { s: "a", t: "Deploy first, near the centre: all ships within 10 cm of each other, more than 60 cm from the cat’s short edge." },
      { s: "b", t: "Deploy within {a:dep} cm of your short edge (agreed above), more than 60 cm from every mouse ship." },
      { s: "a", t: "You take the first turn." }
    ],
    notes: ["The cat’s deployment depth is not given."],
    refs: [["Celestial phenomena", "RB p. 104–116"], ["Disengaging", "RB p. 56"]],
    play: [{ w: "Turns 1–10", s: "a", t: "Stay on the table. You may not disengage until turn 11." }, { w: "Turn 11", s: "a", t: "If any of your ships is still intact at the start of turn 11, you win; you may now disengage." }],
    fx: T => T <= 10 ? [["a", "The mouse may not disengage (" + (11 - T) + " turn" + (T === 10 ? "" : "s") + " to go)"]] : [["a", "Any mouse ship still intact: the mouse wins and may disengage"]],
    tools: [{ k: "toggle", id: "gone", l: "The mouse has been wiped out", s: "b" }],
    end: ["The mouse is wiped out, or either side disengages."],
    win: ["The mouse wins if any ship survives to the start of turn 11. The cat wins by wiping it out first."],
    result(st, v, S) { return get(st, "gone", false) ? ["b", wins(sideName(S, "b")), "The mouse was wiped out before turn 11."] : st.turn >= 11 ? ["a", wins(sideName(S, "a")), "Survived to turn 11."] : [null, "Battle in progress", "The mouse must last until turn 11."]; },
    info: { bg: "A patrol thinks it has caught a few Diasporex ships by surprise. The surprise is staged: the decoys lure the patrol into a maze of gas clouds and asteroids while the rest of the fleet finishes its work deeper in the system.", cr: [wrCredit(15, "Mitch"), "Published with the author’s Diasporex fleet list in the same issue."] }
  },
  /* ------------------------------------------------------------ THE SOLAR COLLECTORS */
  {
    id: "wr-solar-collectors", grp: "untested", name: "The Solar Collectors", series: "Diasporex scenarios", trust: "untested",
    why: NO_REPORT + " " + DIASP + " The collector rules are given here, so any fleet can defend.", src: "Warp Rift 15, p. 32 (collector rules p. 11)", book: "O", suggest: ["Diasporex (fan)"],
    others: "The collector rules are given below, so any defending fleet can refuel this way.",
    sides: { a: { n: "Diasporex", f: "Diasporex (or any defender)" }, b: { n: "Attacker", f: "Any fleet" } },
    pitch: "Collectors soak up a star’s energy for six turns. The longer they charge, the harder they explode — and the defenders must carry them out.",
    glance: [["Points", "Equal"], ["Table", "Any"], ["Battlezone", "Flare region"], ["First turn", "Roll off"], ["Victory", "VP + 100 per charged collector rescued"]],
    bring: ["One solar collector marker per 250 pts of the defender"],
    forces: { a: ["The agreed points limit.", "One solar collector per full 250 pts (free)."], b: ["The agreed points limit."] },
    draw: (v, W, H) => [{ z: "sun" }, R(0, 0, 20, H, "a", ""), { z: "text", x: 16.5, y: H / 2, l: "Defender: 20 cm", s: "a", rot: -90 }, R(W - 20, 0, 20, H, "b", "Attacker: 20 cm", { rot: 90 }),
      R(0, 0, 10, H, "a", "", { dash: 1 }), { z: "text", x: 23 + textLen("the table, as far apart as you like", W) / 2, y: 16, l: "collectors: up to 10 cm onto\nthe table, as far apart as you like", s: "a" }],
    fit: () => [80, 50],
    steps: [
      { t: "Generate flare-region phenomena by the rulebook. Choose the sunward edge." },
      { s: "a", t: "Deploy within 20 cm of the sunward edge. Place the collectors no more than 10 cm onto the table, as far apart as you like." },
      { s: "b", t: "Deploy within 20 cm of the opposite edge." },
      { t: "Roll a D6 for the first turn." }
    ],
    notes: ["The source does not say whether the deployment edges are long or short."],
    refs: [["Battlezones and phenomena", "RB p. 104–116"], ["Disengaging", "RB p. 56"]],
    play: [
      { w: "Charging", s: "a", t: "Collectors need six turns to charge fully. After that you may pick them up and try to get them away." },
      { w: "Pick-up", s: "a", t: "Fly over a collector, as if ramming or boarding but without All Ahead Full. A capital ship takes it aboard (remove it; it is safe). An escort tows it in base contact every move." },
      { w: "Towed collectors", s: "b", t: "Pass a Leadership test to shoot the towed collector instead of its escort — if it explodes, it may take the escort with it." },
      { w: "Escaping", s: "a", t: "A ship carrying or towing a charged collector may only disengage by leaving over a table edge." }
    ],
    fx: T => T <= 6 ? [["a", "Collectors charging: " + T + " of 6 turns"]] : [["a", "Collectors fully charged — pick them up and get them off"]],
    tools: [
      { k: "html", html: "<h3>Solar collector</h3><table class='ltab'><tr><td>Type</td><td>Defence / 1 hit · speed 0 · armour 4+ · no shields or turrets</td></tr><tr><td>Explodes</td><td>On 3+ when destroyed: blast 3D6 cm. Every ship inside takes one lance hit per turn the collector has charged. Shields and holofields do not help.</td></tr></table>" },
      { k: "info", html: st => "<h3>If a collector is destroyed now</h3><p class='calc'>Roll a D6: on 3+ it explodes, 3D6 cm, <b>" + st.turn + " lance hit" + (st.turn === 1 ? "" : "s") + "</b> to every ship in the blast (if it has charged since turn 1).</p>" },
      { k: "counter", id: "res", l: "Charged collectors rescued (100 VP each)", s: "a", res: 1 },
      { k: "counter", id: "dead", l: "Collectors destroyed", s: "b", res: 1 }
    ],
    end: ["When either fleet is destroyed or disengages."],
    win: ["Victory points, plus 100 to the defender for each fully charged collector taken off any table edge.", "If every collector is destroyed, the attacker wins outright."],
    result(st) { return [null, "Count victory points", "Defender +" + get(st, "res", 0) * 100 + " VP from rescued collectors. If all were destroyed, the attacker wins outright."]; },
    info: { bg: "The Diasporex have no bases. They refuel by leaving collectors in a star’s corona, and here an enemy finds them mid-refuelling — without the energy, the fleet cannot jump to the warp.", cr: [wrCredit(15, "Mitch"), "The collector profile comes from the author’s Diasporex fleet list (Warp Rift 15, p. 11)."] }
  }
  ]);
})();
