/* The Spreading War — Reg Steiner's narrative campaign scenarios (Warp Rift 28–29, class L3).
   Summarised in our own words; each scenario hand-made (see LUEMINUT.md). */
(function () {
  const REG = "Reg Steiner";
  const SERIES_NOTE = "The Spreading War scenarios are deliberately unbalanced: the author suggests playing each one twice, swapping sides, and comparing victory points.";
  const REBELS = "“Rebels” and “renegades” here are mostly Imperial ships gone over, topped up from the Chaos list — use either list. Not Chaos Space Marines.";
  const CAPTURE = "Capturing (the campaign’s capture rule): resolve a boarding action, but the target’s crew points equal its remaining hits, each assault boat brings 1 crew point (a Space Marine Thunderhawk 2, and the Marine +2 applies once), and hits remove crew points instead of hull. Lose more crew than the hits it had left and the ship is taken; hits on the attackers remove their crew points. Critical hits still apply. A ship that loses half its crew is crippled; a captured ship cannot attack and may only move and escape.";
  const CR = (n, extra) => [wrCredit(n, REG), "Part of the author’s narrative campaign “The Spreading War”, played over a summer at their game club."].concat(extra || []);
  const BG_RAIDS = "As the war spreads into long-quiet sectors, Admiral Rollins turns the ships gathered at a new orbital station into a fighting fleet, and Captain Fitch takes command of a quick-response task force.";
  const BG_FLEET = "Imperial task groups are being wasted by inexperienced and politically appointed commanders; Admiral Rollins sets out to replace them before the enemy can exploit the chaos.";
  const BG_SLOT = "Captain Fitch strikes the renegades’ supply lines with carrier task forces that stand off at extreme range, directed by new long-range communications ships.";
  const BG_REB = "With fleets weakened by defections and Ork clans gathering into ever larger fleets, Captain Fitch is sent to raid and disrupt in the troubled sectors.";

  addScenarios([
  /* ------------------------------------------------------------ RAID 1 */
  {
    id: "wr-sw-convoy-raid", grp: "community", name: "Ork Raiders vs Imperial Convoy", series: "The Spreading War · Raid One", trust: "community",
    why: "Community campaign scenario, played through by the author’s club. Book rules only.", src: "Warp Rift 28, p. 23", book: "K", suggest: ["Imperial Navy", "Orks"],
    others: "Swap in other escorts freely (no ram ships). Any raider fleet of escorts and one cruiser can play the Orks.",
    sides: { a: { n: "Convoy", f: "Imperial Navy" }, b: { n: "Raiders", f: "Orks" } },
    pitch: "Twelve supply ships and a thin escort run for the far edge while Ork raiders close in from the corners behind them.",
    glance: [["Points", "Fixed forces"], ["Table", "Standard"], ["Battlezone", "As The Gauntlet: primary biosphere, no planets"], ["First turn", "Convoy"], ["Victory", "Cargo out ×2 VP; normal VP for warships"]],
    bring: ["12 cargo ships (supply and fuel; at most 2 troop carriers)"],
    forces: {
      a: ["12 cargo ships (supply and fuel), no more than 2 of them troop carriers — 35 pts each for victory points.", "Two squadrons of two Sword frigates.", "A squadron of three destroyers (Cobra or equivalent).", "One Dauntless (or equivalent) light cruiser."],
      b: ["Two squadrons of three escorts (Savages and Ravagers).", "Two squadrons of two Onslaughts.", "One Kill Kroozer.", "Substitute other escorts as your collection needs — but no ram ships."]
    },
    draw: (v, W, H) => [R(0, 0, 20, H, "a", "Convoy: 20 cm", { rot: -90 }), { z: "edge", e: "r", s: "a", l: "Cargo exit (and raider entry from its corners)" },
      { z: "mark", x: W - 4, y: 4, s: "b", l: "" }, { z: "mark", x: W - 4, y: H - 4, s: "b", l: "" }, { z: "text", x: W - 30, y: 16, l: "Orks enter at a corner", s: "b" }],
    fit: () => [80, 50],
    steps: [
      { t: "Set up phenomena as for The Gauntlet (RB p. 178): primary biosphere, ignore planets. (The author points to Convoy or The Gauntlet and prefers The Gauntlet’s terrain.)" },
      { s: "a", t: "Set up within 20 cm of one short edge. You take the first turn." },
      { s: "b", t: "After the convoy’s first turn, enter from either corner of the opposite short edge." }
    ],
    notes: [SERIES_NOTE, "The source says the convoy “begins 20 cm into the table”; read here as within 20 cm of its edge."],
    refs: [["The Gauntlet (terrain)", "RB p. 178"], ["Convoy", "RB p. 134"]],
    play: [{ w: "All game", s: "a", t: "Get cargo ships off the opposite short edge — the edge the Orks came in from." }, { w: "All game", s: "b", t: "Destroy every cargo ship." }],
    tools: [{ k: "counter", id: "out", l: "Cargo ships escaped (70 VP each to the convoy)", s: "a", res: 1 }, { k: "counter", id: "dead", l: "Cargo ships destroyed (35 VP each)", s: "b", res: 1 }],
    end: ["When the cargo ships have escaped or been destroyed, or a fleet is gone."],
    win: ["Each cargo ship is worth 35 pts. The convoy scores double — 70 VP — for each one leaving the opposite short edge.", "Warships score normal victory points for both sides."],
    result(st) { const o = get(st, "out", 0), d = get(st, "dead", 0); return [null, "Count victory points", "Convoy +" + o * 70 + " VP from escaped cargo · raiders +" + d * 35 + " VP from destroyed cargo."]; },
    info: { bg: BG_RAIDS + " The first raids hit the convoys.", cr: CR(28) }
  },
  /* ------------------------------------------------------------ RAID 2 */
  {
    id: "wr-sw-orbital-raid", grp: "community", name: "Ork Raiders vs Orbital Installation", series: "The Spreading War · Raid Two", trust: "community", players: 3,
    why: "Community campaign scenario, played through by the author’s club; meant for three Imperial players.", src: "Warp Rift 28, pp. 23–24", book: "O", suggest: ["Imperial Navy", "Orks"],
    others: "Substitutes must fit closely: a ship without launch bays may only be replaced by one without them.",
    sides: { a: { n: "Imperial groups", f: "Imperial Navy (up to three players)" }, b: { n: "Raiders", f: "Orks" } },
    pitch: "An Ork horde hits a jump-route way station. The Imperial ships have orders elsewhere — do they jump out, or stay and fight?",
    glance: [["Points", "Fixed forces"], ["Table", "Standard"], ["Battlezone", "A planet, the station behind it"], ["First turn", "Not given"], ["Victory", "Normal victory points"]],
    bring: ["A medium or large planet", "An orbital terminal station", "6 cargo ships"],
    forces: {
      a: ["Two naval groups, each a Dominator, two Swords and a Firestorm.", "A cargo group of six supply and fuel ships.", "The orbital terminal station: weapons battery strength 8 all round, plus 3 bombers and 3 fighters.", "Ideally each group has its own player."],
      b: ["Two Terror Kroozers.", "Four Ravagers and four Onslaughts.", "A Kill Kroozer escorted by four Savages.", "Six ram ships."]
    },
    draw: (v, W, H) => { const px = Math.min(W - 40, W / 2 + 30), sx = Math.min(W - 6, px + 10 + 20);
      return [{ z: "planet", cx: px, cy: H / 2, r: 10, l: "" }, { z: "mark", x: sx, y: H / 2, s: "a", l: "station" },
        { z: "circ", cx: sx, cy: H / 2, r: 18, s: "a", l: "" }, { z: "text", x: sx - 6, y: H / 2 + 28, l: "Imperial groups\nnear the station", s: "a" },
        { z: "edge", e: "r", s: "a", l: "Jump route: two All Ahead Full moves this way" }, { z: "edge", e: "l", s: "b", dash: 1, l: "Orks (see note)" },
        { z: "dim", x1: W / 2, y1: 12, x2: px, y2: 12, l: "30 cm" }]; },
    fit: () => [130, 60],
    steps: [
      { t: "Place a medium or large planet 30 cm from the centre of the table towards one short edge, as near the middle between the long edges as you can. The planets here are uninhabitable." },
      { s: "a", t: "Place the orbital terminal 20 cm from the planet’s edge, towards the nearest short edge, in line with the planet’s centre." },
      { s: "a", t: "Set up your three groups close to the station but no closer than 20 cm to the planet. All ships are powered up, waiting for clearance to jump." }
    ],
    notes: [SERIES_NOTE, "The source gives no Ork entry point and no first turn. The station is “behind the planet” as the Orks see it, so the far short edge is the natural entry — agree before play."],
    refs: [["All Ahead Full", "RB p. 46"]],
    play: [
      { w: "Jumping out", s: "a", t: "A group jumps by making two All Ahead Full moves in a row towards the near short edge, starting near the station. Only the first needs a command check; the second is automatic (just roll the distance). After the second the group is gone, on or off the table." },
      { w: "Stay or go", s: "a", t: "Your orders are elsewhere. Each group’s player decides whether to stay and fight." },
      { w: "Raiders", s: "b", t: "Destroy the station." }
    ],
    tools: [{ k: "toggle", id: "g1", l: "Naval group 1 has jumped", s: "a" }, { k: "toggle", id: "g2", l: "Naval group 2 has jumped", s: "a" }, { k: "toggle", id: "g3", l: "Cargo group has jumped", s: "a" }, { k: "toggle", id: "stn", l: "The station is destroyed", s: "b" }],
    end: ["Not given — when the station is destroyed or every group has jumped, or a fleet is gone."],
    win: ["Normal victory points — though the players’ own kill scores are what they usually compare."],
    result(st) { return [get(st, "stn", false) ? "b" : null, get(st, "stn", false) ? "The station is gone" : "Count victory points", "Groups jumped: " + ["g1", "g2", "g3"].filter(k => get(st, k, false)).length + " of 3."]; },
    info: { bg: BG_RAIDS + " Here the Orks hit a way station on the jump routes.", cr: CR(28) }
  },
  /* ------------------------------------------------------------ RAID 3 */
  {
    id: "wr-sw-counter-strike", grp: "community", name: "Imperial Counter-Strike", series: "The Spreading War · Raid Three", trust: "community",
    why: "Community campaign scenario, played through by the author’s club.", src: "Warp Rift 28, p. 24", book: "O", suggest: ["Imperial Navy", "Chaos"],
    others: REBELS,
    sides: { a: { n: "Imperial strike force", f: "Imperial Navy" }, b: { n: "Renegades", f: "Imperial renegades / Chaos" } },
    pitch: "Renegades guard four tankers of precious noble gas. The Imperials want them — captured, not destroyed — using assault boats.",
    glance: [["Points", "Fixed forces"], ["Table", "180 × 120 cm"], ["Battlezone", "Large planet in the centre"], ["First turn", "Imperials, entering"], ["Victory", "Normal VP; tankers 50 each"]],
    bring: ["A large planet", "4 container ships (fuel cargo ships)", "Assault boat markers"],
    forces: {
      a: ["4 cruisers (one may be a battlecruiser). One cruiser must carry launch bays with assault boats as well as bombers and fighters.", "10 escorts."],
      b: ["2 cruisers (one may be a battlecruiser; at most one with launch bays).", "6 escorts.", "4 liquid-gas container ships (fuel cargo ships will do)."]
    },
    draw: (v, W, H) => [{ z: "planet", cx: W / 2, cy: H / 2, r: 12, l: "" }, R(56, H / 2 - 22, 8, 44, "b", ""), { z: "text", x: 60, y: H / 2 + 30, l: "2 cruisers + 3 escorts, 60 cm in", s: "b" },
      R(W / 2 - 15, H / 2 - 12 - 20 - 8, 30, 12, "b", "tankers + 3 escorts"),
      { z: "edge", e: "l", s: "a", l: "Imperials enter" }, { z: "edge", e: "r", s: "b", l: "Renegade escape edge" }],
    fit: () => [150, 80], srcTable: [180, 120],
    mapNote: "The tankers and three escorts orbit 20 cm from the planet’s edge on the side nearest a long edge.",
    steps: [
      { t: "Place a large planet in the centre of a 180 × 120 cm table. Roll other phenomena per table section with the random method." },
      { s: "b", t: "Place the two cruisers and three escorts 60 cm from one short edge." },
      { s: "b", t: "Place the four tankers and the other three escorts 20 cm from the planet’s edge, on the side nearest a long edge (in orbit)." },
      { s: "a", t: "Enter from the short edge nearest the renegade cruisers in the first part of turn 1, in any squadrons you like." }
    ],
    notes: [SERIES_NOTE],
    refs: [["Boarding actions", "RB p. 89"], ["Assault boats", "RB p. 85"]],
    play: [
      { w: "Capturing a tanker", s: "a", t: "Use assault boats. Each tanker has 1 crew; each assault boat that gets through adds 1 to your boarding roll. Roll it as a boarding action (you D6 + boats, the tanker D6) where damage means crew losses: lose, and your boarding party shrinks; the fight goes on each end phase. A critical-hit result on the tanker destroys it with everyone aboard; a critical on the attackers is ignored." },
      { w: "Leaving the table", s: "b", t: "Your tankers and ships escape only over the short edge on the far side of the planet from where your cruisers started — that gives the enemy nothing. Leaving anywhere else gives the Imperials full victory points. Imperial ships may disengage over any edge." }
    ],
    tools: [{ k: "counter", id: "imp", l: "Tankers held by the Imperials", s: "a", max: 4, res: 1 }, { k: "counter", id: "ren", l: "Tankers escaped or still held by the renegades", s: "b", max: 4, res: 1 }],
    end: ["Not given — when the tankers are taken, escaped or destroyed, or a fleet is gone."],
    win: ["Normal victory points, but each tanker is worth 50 to whoever holds it at the end."],
    result(st) { return [null, "Count victory points", "Tankers: Imperials " + get(st, "imp", 0) * 50 + " VP · renegades " + get(st, "ren", 0) * 50 + " VP."]; },
    info: { bg: BG_RAIDS + " Now the Imperials strike back, after cargo the renegades badly need.", cr: CR(28) }
  },
  /* ------------------------------------------------------------ DEATH AND GLORY */
  {
    id: "wr-sw-death-and-glory", grp: "community", name: "Death and Glory!", series: "The Spreading War · Fleet Battle One", trust: "community",
    why: "Community campaign scenario, played through by the author’s club.", src: "Warp Rift 28, p. 26", book: "O", suggest: ["Imperial Navy", "Chaos"],
    others: REBELS + " Ship classes are left open so you can use your own collections.",
    sides: { a: { n: "Imperial fleet", f: "Imperial Navy" }, b: { n: "Renegades", f: "Imperial renegades / Chaos" } },
    pitch: "A full fleet battle under a commander who should never have had the job: every Imperial ship fights at −1 Leadership.",
    glance: [["Points", "Fixed ship counts"], ["Table", "Standard"], ["Battlezone", "Outer Reaches"], ["First turn", "Imperials"], ["Game ends", "One side gone"]],
    bring: ["Big fleets: 22 Imperial ships and 19 renegades"],
    forces: {
      a: ["2 light cruisers, 2 cruisers, 2 battlecruisers, 2 battleships.", "14 escorts, any mix.", "At most two ships with launch bays and at most two with Nova Cannons."],
      b: ["4 cruisers, 2 battlecruisers, 1 battleship.", "12 escorts, any mix.", "At most two ships with launch bays. If they are only battleships or light cruisers, keep it secret until the game starts."]
    },
    draw: (v, W, H) => [R(W / 2 - 20, H - 20, 40, 20, "a", "Imperial box 40 × 20"), R(0, 0, 20, 20, "b", "box"), R(W - 20, 0, 20, 20, "b", "box"), { z: "text", x: W / 2, y: 16, l: "renegades: either or both\n20 × 20 corner boxes", s: "b" }],
    fit: () => [80, 60],
    steps: [
      { t: "Outer Reaches fleet battle: set up the phenomena." },
      { s: "a", t: "Roll Leadership as normal for each ship and squadron, then subtract 1 from every value — the amateur command." },
      { s: "a", t: "Deploy in a 40 × 20 cm box centred on one long edge (anywhere inside it)." },
      { s: "b", t: "Deploy in one or both 20 × 20 cm corner boxes on the opposite long edge, split however you like." },
      { s: "a", t: "The Imperials take the first turn." }
    ],
    notes: [SERIES_NOTE, "The −1 Leadership applies to this scenario only."],
    refs: [["Leadership", "RB p. 45"], ["Victory points", "RB p. 122"]],
    play: [{ w: "All game", s: "a", t: "Every ship is at its rolled Leadership −1 (amateur command)." }],
    end: ["Every ship of one side is destroyed, captured or has escaped off any edge."],
    win: ["Normal victory points (RB p. 122)."],
    result() { return [null, "Count victory points", "Standard victory points, RB p. 122."]; },
    info: { bg: BG_FLEET, cr: CR(28) }
  },
  /* ------------------------------------------------------------ DEATH AND GLORY 2 */
  {
    id: "wr-sw-rear-guard", grp: "community", name: "Death and Glory 2: Rear Guard", series: "The Spreading War · Fleet Battle Two", trust: "community",
    why: "Community campaign scenario, played through by the author’s club.", src: "Warp Rift 28, p. 27", book: "O", suggest: ["Imperial Navy", "Chaos"],
    others: REBELS,
    sides: { a: { n: "Imperial rear guard", f: "Imperial Navy" }, b: { n: "Renegades", f: "Imperial renegades / Chaos" } },
    pitch: "A desperate Imperial rear guard may reload torpedoes during the enemy’s turn — at the risk of blowing itself up.",
    glance: [["Points", "Fixed ship counts"], ["Table", "Not given"], ["Battlezone", "Not given"], ["First turn", "Not given"], ["Victory", "Drive the enemy off the table"]],
    bring: ["Torpedo markers"],
    forces: {
      a: ["3 light cruisers, 2 cruisers (only one with launch bays), 6 escorts.", "Normal Leadership in this battle."],
      b: ["2 cruisers (no heavy or battlecruisers), 1 battleship, 5 escorts.", "Only one ship — a cruiser or the battleship — may have launch bays."]
    },
    draw: (v, W, H) => [R(W / 2 - 20, H - 20, 40, 20, "a", "Imperial box 40 × 20"), R(0, 0, 20, 20, "b", "box"), R(W - 20, 0, 20, 20, "b", "box"), { z: "text", x: W / 2, y: 16, l: "renegades: either or both\n20 × 20 corner boxes", s: "b" }],
    fit: () => [80, 60],
    mapNote: "The scenario gives no set-up. This is the default above: the set-up of Death and Glory, the scenario it continues (Warp Rift 28, p. 26).",
    steps: [{ t: "Battlezone: {a:bz}. Set up phenomena for it by the rulebook." }, { t: "Set-up: {a:setup}." }, { t: "First turn: {a:first}." }],
    notes: [SERIES_NOTE, "No table set-up, deployment or first turn is given."],
    refs: [["Torpedoes and Reload Ordnance", "RB p. 46, 76–77"], ["Critical hits table", "RB p. 67"]],
    play: [
      { w: "Once per game, per torpedo ship", s: "a", t: "Double torpedo attack: after firing torpedoes in your own turn, a ship may launch again in the enemy’s following turn. It needs a passed reload command check; a roll of double six is an accident — treat it as an 11 on the critical hits table. If it works, place and move the second salvo in the enemy’s shooting and ordnance phases." },
      { w: "Retreating", t: "Each side tries to force every enemy ship off the table (any edge)." }
    ],
    end: ["When one side has been driven off or destroyed."],
    win: ["Normal victory points for destroyed ships.", "A ship that escapes with less than 50% damage gives the opponent its full value; with 50% or more, nothing."],
    result() { return [null, "Count victory points", "Remember: escaping with under 50% damage gives the enemy full value."]; },
    info: { bg: BG_FLEET + " This time the Imperial ships fight a rear-guard action.", cr: CR(28) }
  },
  /* ------------------------------------------------------------ DOWN THE SLOT */
  {
    id: "wr-sw-down-the-slot", grp: "community", name: "Down the ’Slot", series: "The Spreading War · Black Star Express 1", trust: "community",
    why: "Community campaign scenario, played through by the author’s club.", src: "Warp Rift 29, pp. 19–20", book: "O", suggest: ["Imperial Navy", "Chaos"],
    others: REBELS + " The attackers need only attack craft markers and one escort.",
    sides: { a: { n: "Carrier strike", f: "Imperial Navy (off-table carriers)" }, b: { n: "Supply run", f: "Renegades" } },
    pitch: "Five Iconoclasts carry vital war gear down the length of the table while waves of bombers from unseen carriers strike from every side.",
    glance: [["Points", "Fixed forces"], ["Table", "Standard"], ["Battlezone", "As The Gauntlet"], ["First turn", "Not given"], ["Victory", "VP; Iconoclasts +25 each"]],
    bring: ["12 bomber, 4 torpedo bomber and 4 fighter markers", "4 numbered contact markers", "A Sword frigate as the communications ship"],
    forces: { a: ["12 bombers, 4 torpedo bombers and 4 fighters as markers (the carriers stay off the table).", "One Sword frigate: the communications ship."], b: ["1 light cruiser without launch bays.", "One squadron of 5 Iconoclast escorts carrying the supplies."] },
    draw: (v, W, H) => [{ z: "edge", e: "l", s: "b", l: "Supply run enters" }, R(W - 20, 0, 20, H, "b", "Jump point: exit 20 cm from the edge", { rot: 90 }),
      { z: "mark", x: W * .45, y: H * .3, s: "a", l: "comms ship" }, { z: "edge", e: "t", s: "a", dash: 1, l: "attack craft waves enter along the long edges" }, { z: "edge", e: "b", s: "a", dash: 1, l: "" },
      { z: "text", x: 40, y: H / 2, l: "4 numbered markers\nnear the entry", s: "a" }],
    fit: () => [90, 50],
    steps: [
      { t: "Set up the table as in The Gauntlet (RB p. 178), placing phenomena at random." },
      { s: "a", t: "Place the communications ship anywhere on the table." },
      { s: "a", t: "Place four numbered contact markers near the renegade entry point, within attack range, and secretly note which numbers are real ordnance." },
      { s: "b", t: "You enter from one short edge and must reach the jump point, 20 cm from the far short edge." }
    ],
    notes: [SERIES_NOTE, "No first turn is given. The ordnance is revealed after the renegades’ first move, so the renegades going first is the natural reading."],
    refs: [["The Gauntlet (table)", "RB p. 178"], ["Special torpedoes (optional)", "FL p. 19–21"]],
    play: [
      { w: "Contact markers", s: "a", t: "After the renegades’ first move, swap the numbered markers for the real ordnance. A visible marker (not hidden behind a planet or the like) may be shot by renegade ships in range." },
      { w: "New waves", s: "a", t: "Lost or spent markers come back on your next turn, but only in groups of four of one type, entering along either long edge. There is no limit." },
      { w: "Communications ship", s: "a", t: "It must drift 10 cm if not moved. If it is destroyed or leaves the table, no new attack craft come in (those on the table finish their attacks)." },
      { w: "Special torpedoes", s: "a", t: "Optional, by agreement: allow each special torpedo type only one torpedo bomber attack." }
    ],
    tools: [{ k: "counter", id: "ico", l: "Iconoclasts destroyed (55 VP each)", s: "a", max: 5, res: 1 }, { k: "toggle", id: "comms", l: "The communications ship is gone (no new waves)", s: "b" }],
    end: ["When the supply run has got through or been destroyed."],
    win: ["Normal victory points; each Iconoclast is worth 25 extra (55 instead of 30).", "Best played twice, swapping sides, and adding up the scores."],
    result(st) { return [null, "Count victory points", "Iconoclasts destroyed: " + get(st, "ico", 0) + " × 55 VP."]; },
    info: { bg: BG_SLOT + " The Iconoclasts are carrying war gear and troops to a renegade front — mission-critical cargo for both sides.", cr: CR(29) }
  },
  /* ------------------------------------------------------------ DOWN THE SLOT 2 */
  {
    id: "wr-sw-wrecking-yard", grp: "community", name: "Through the Wrecking Yard", series: "The Spreading War · Black Star Express 2", trust: "community",
    why: "Community campaign scenario, played through by the author’s club.", src: "Warp Rift 29, pp. 20–21", book: "O", suggest: ["Imperial Navy", "Chaos"],
    others: REBELS,
    sides: { a: { n: "Carrier strike", f: "Imperial Navy (off-table carriers)" }, b: { n: "Supply run", f: "Renegades" } },
    pitch: "Down the ’Slot again — but now the carriers send assault boats to seize crippled renegade cruisers.",
    glance: [["Points", "Fixed forces"], ["Table", "Standard"], ["Battlezone", "As The Gauntlet"], ["First turn", "Not given"], ["Victory", "VP; captures count as kills"]],
    bring: ["12 bomber, 8 torpedo bomber and 8 fighter markers", "Assault boat markers", "A Sword frigate as the communications ship"],
    forces: { a: ["12 bombers, 8 torpedo bombers and 8 fighters as markers, plus unlimited assault boats (rules in Play).", "One Sword frigate: the communications ship."], b: ["A heavy cruiser (with or without launch bays).", "A cruiser without launch bays.", "6 Iconoclast escorts."] },
    draw: (v, W, H) => [{ z: "edge", e: "l", s: "b", l: "Supply run enters" }, R(W - 20, 0, 20, H, "b", "Jump point: exit 20 cm from the edge", { rot: 90 }),
      { z: "mark", x: W * .45, y: H * .3, s: "a", l: "comms ship" }, { z: "edge", e: "t", s: "a", dash: 1, l: "attack craft and assault boats enter along the long edges" }, { z: "edge", e: "b", s: "a", dash: 1, l: "" }],
    fit: () => [90, 50],
    steps: [
      { t: "Set up exactly as Down the ’Slot: The Gauntlet’s table (RB p. 178) with random phenomena, the communications ship anywhere, four numbered contact markers near the renegade entry." },
      { s: "b", t: "You enter from one short edge and must reach the jump point, 20 cm from the far short edge." }
    ],
    notes: [SERIES_NOTE, "No first turn is given (see Down the ’Slot)."],
    refs: [["Boarding actions", "RB p. 89"], ["The Gauntlet (table)", "RB p. 178"]],
    play: [
      { w: "As Down the ’Slot", s: "a", t: "Contact markers, waves of four of a type along the long edges, the communications ship (drifts 10 cm; if lost, no new waves)." },
      { w: "Assault boats", s: "a", t: "From your second turn on, bombers or torpedo bombers may be replaced by assault boats, also in groups of four." },
      { w: "Capturing", s: "a", t: CAPTURE }
    ],
    tools: [{ k: "counter", id: "ico", l: "Iconoclasts destroyed (55 VP each)", s: "a", max: 6, res: 1 }, { k: "counter", id: "cap", l: "Cruisers captured (count as destroyed)", s: "a", max: 2, res: 1 }, { k: "toggle", id: "comms", l: "The communications ship is gone (no new waves)", s: "b" }],
    end: ["When the supply run has got through or been destroyed."],
    win: ["Normal victory points; captured ships count as destroyed for the captor. Iconoclasts +25 each.", "Best played twice, swapping sides, with or without special torpedoes."],
    result(st) { return [null, "Count victory points", get(st, "ico", 0) + " Iconoclasts and " + get(st, "cap", 0) + " captured cruisers."]; },
    info: { bg: BG_SLOT + " Fitch now copies one of Rollins’ tactics: capture ships, to make up the Imperial losses.", cr: CR(29) }
  },
  /* ------------------------------------------------------------ STRIKE ON A REBEL WORLD */
  {
    id: "wr-sw-rebel-world", grp: "community", name: "Strike on a Rebel World", series: "The Spreading War · Black Star Express 3", trust: "community",
    why: "Community campaign scenario, played through by the author’s club. Untitled in the source.", src: "Warp Rift 29, pp. 21–22", book: "O", suggest: ["Imperial Navy", "Chaos"],
    others: REBELS + " Meant to be linked to Warhammer 40,000 or Epic games on the planet.",
    sides: { a: { n: "Imperial assault", f: "Imperial Navy" }, b: { n: "Rebel fleet", f: "Imperial renegades / Chaos" } },
    pitch: "Rollins catches a rebel fleet unsupported over its world: smash it, capture what you can, silence the airfields and land the troops.",
    glance: [["Points", "Imperials 2000 + 5 transports · rebels 1200"], ["Table", "Standard"], ["Battlezone", "A planet; no stations or defences"], ["First turn", "Not given"], ["Victory", "VP; rebels escaping score double"]],
    bring: ["A planet with two airfields", "5 transports", "Low orbit table (RB p. 116)", "Assault boat markers"],
    forces: {
      a: ["2000 pts of warships, plus 5 transports at no cost.", "Up to four launch-capable ships, at most 16 launch bay markers in all.", "Assault ships allowed (see Play); they count towards the 16."],
      b: ["1200 pts of warships; one may be launch-capable.", "Two airfields on the planet: 12 attack craft markers between them from turn 3, every other turn."]
    },
    draw: (v, W, H) => [{ z: "circ", cx: W / 2, cy: H / 2, r: 30, s: "b", l: "" }, { z: "planet", cx: W / 2, cy: H / 2, r: 10, l: "" },
      { z: "text", x: W / 2, y: Math.max(9, H / 2 - 36), l: "rebels: within 20 cm of the planet", s: "b" },
      { z: "edge", e: "l", s: "a", l: "Imperials enter (either short edge)" }, { z: "edge", e: "r", s: "a", l: "" }],
    fit: () => [90, 70],
    steps: [
      { t: "Set up the table as the source’s “Armada page 150” scenario (see note). The rebels have no working stations or orbital defences." },
      { s: "b", t: "Place your ships in orbit within 20 cm of the planet’s rim." },
      { s: "a", t: "You enter on turn 1 from either short edge." }
    ],
    notes: [SERIES_NOTE, "The source points to “page 150 of the Armada rulebook” for the table; that page has not been matched to the Remastered rulebook. No first turn is given."],
    refs: [["Low orbit table", "RB p. 116"], ["Boarding actions", "RB p. 89"]],
    play: [
      { w: "Rebels waking", s: "b", t: "Each rebel ship must pass an unmodified Leadership test (no re-rolls, each ship on its own) before it can move and fight." },
      { w: "Rebel goal", s: "b", t: "Escape: every rebel warship leaving the table (any edge) scores double victory points." },
      { w: "Airfields", t: "Each airfield is guarded by two lances (strength 2, 30 cm). To silence one, an Imperial ship in low orbit, within 30 cm, must do 4 hits against armour 6+ and one shield. With one airfield gone the ordnance halves to 6 markers; with both gone, none." },
      { w: "Capturing", s: "a", t: CAPTURE },
      { w: "Assault ships", s: "a", t: "Any launch-bay model, from cargo-ship to cruiser size, with only launch bays on its sides (no side batteries or lances) may be an assault ship: priced as the carrier plus +5 pts per bay for assault boats, no fighters or bombers. Tell your opponent which ships they are." }
    ],
    fx: T => T >= 3 && (T - 3) % 2 === 0 ? [["b", "Airfields launch their attack craft this turn"]] : [],
    tools: [{ k: "toggle", id: "af1", l: "Airfield 1 destroyed", s: "a" }, { k: "toggle", id: "af2", l: "Airfield 2 destroyed", s: "a" },
      { k: "info", html: st => { const n = (get(st, "af1", false) ? 0 : 1) + (get(st, "af2", false) ? 0 : 1); return "<h3>Airfield ordnance</h3><p class='calc'>" + (n === 2 ? "<b>12 markers</b>" : n === 1 ? "<b>6 markers</b>" : "<b>None</b> — both airfields are down") + ", from turn 3 and every other turn after.</p>"; } },
      { k: "counter", id: "esc", l: "Rebel warships escaped (double VP)", s: "b", res: 1 }],
    end: ["Not given — when the rebels are destroyed, captured or escaped."],
    win: ["Normal victory points; rebel warships escaping score double."],
    result() { return [null, "Count victory points", "Rebel escapes score double."]; },
    info: { bg: BG_SLOT + " After Fitch’s raids, one big rebel base is left without support — Rollins strikes to sweep its fleet away and bring help to loyal troops still fighting on the surface.", cr: CR(29, ["Assault ship modelled on the World War II US Navy assault transports."]) }
  },
  /* ------------------------------------------------------------ TAKE THE STATIONS */
  {
    id: "wr-sw-take-the-stations", grp: "community", name: "Take the Stations!", series: "The Spreading War · Rebellion", trust: "community",
    why: "Community campaign scenario, played through by the author’s club.", src: "Warp Rift 29, pp. 23–24", book: "O", suggest: ["Space Marines", "Imperial Navy", "Chaos"],
    others: REBELS,
    sides: { a: { n: "Imperial assault", f: "Space Marines + Imperial Navy" }, b: { n: "Rebels", f: "Imperial renegades / Chaos" } },
    pitch: "Marines and the Navy assault a remote rebel factory system: cripple the stations, then storm and capture them nearly intact.",
    glance: [["Points", "Fixed forces"], ["Table", "180 × 120 cm"], ["Battlezone", "Fixed: planet, two curved asteroid fields"], ["First turn", "Not given"], ["Victory", "VP; captures +50%"]],
    bring: ["A medium planet", "Two curved asteroid fields", "A large and a small station model", "Assault boat and Thunderhawk markers"],
    forces: {
      a: ["Marines: 1 Battle Barge, 4 Strike Cruisers, 8 escorts.", "Navy: 1 battlecruiser (may have launch bays), 1 cruiser, 1 light cruiser, 6 escorts."],
      b: ["1 battleship (may have launch bays), 3 cruisers (one may have launch bays).", "An airbase on the planet, the orbital factory/battle station, a mining battle station by the asteroids, and an asteroid defence platform."]
    },
    draw: (v, W, H) => [{ z: "planet", cx: 60, cy: H - 60, r: 9, l: "" }, { z: "mark", x: 60 + 9 + 15, y: H - 60, s: "b", l: "" }, { z: "text", x: 60 + 9 + 15 + 5 + textLen("factory station", W) / 2, y: H - 60, l: "factory station", s: "b" },
      { z: "hatch", x: 90, y: H - 12, w: 25, h: 12, l: "" }, { z: "hatch", x: W / 2 - 5, y: 0, w: 35, h: 14, l: "" }, { z: "mark", x: W / 2 + 12, y: 16, s: "b", l: "" }, { z: "text", x: W / 2 + 12, y: 29, l: "mining station", s: "b" },
      { z: "edge", e: "l", s: "b", l: "Rebels enter" }, { z: "edge", e: "r", s: "a", l: "Imperials enter" },
      { z: "dim", x1: 0, y1: H - 30, x2: 60, y2: H - 30, l: "60 cm" }],
    fit: () => [150, 90], srcTable: [180, 120],
    mapNote: "Asteroid fields are curved in the source (10–12 × 25 cm and 12–15 × 35 cm); drawn here as boxes.",
    steps: [
      { t: "On a 180 × 120 cm table, place a medium planet 60 cm from one short edge and 60 cm from one long edge." },
      { t: "30 cm further along that long edge, start a curved asteroid field 10–12 cm wide and 25 cm long, curving away from the planet towards the centre." },
      { t: "On the opposite long edge, 40 cm in from its centre, start a mirrored curved field 35 cm long and 12–15 cm wide." },
      { s: "b", t: "Place the factory station 15 cm from the planet’s edge, and the mining station in the larger field (furthest from the planet), centred on the edge nearest the planet." },
      { s: "b", t: "Enter from the short edge nearest the planet on turn 1." },
      { s: "a", t: "Enter from the opposite short edge on turn 1." }
    ],
    notes: [SERIES_NOTE, "The asteroid defence platform is listed but never described; no first turn is given. The mid-table measurements are read from the long edge — check the source if your table differs."],
    refs: [["Boarding actions", "RB p. 89"], ["Low orbit table", "RB p. 116"]],
    play: [
      { w: "Factory station", s: "b", t: "A ship with armour 5+, 1 shield, 10 hits, 2 turrets; 8 weapon batteries and 3 lances all round, 30 cm. Port or starboard weapon crits halve the batteries; a dorsal crit stops the lances until repaired; manoeuvre and engine crits only cost extra hits; plasma drive results as a ship." },
      { w: "Mining station", s: "b", t: "6 hits, 1 shield, 2 turrets, armour 5+, 8 batteries all round at 30 cm. Dorsal crits are ignored." },
      { w: "Airbase", s: "b", t: "2 turrets, 1 shield, 4 batteries (30 cm), 4 hits at armour 6+; launches 4 attack craft every other turn. Can be attacked and boarded from low orbit." },
      { w: "Capturing", s: "a", t: CAPTURE + " Ship-to-ship boarding and teleport attacks may join the same assault." }
    ],
    tools: [{ k: "toggle", id: "big", l: "Factory station captured (60 VP; destroyed 30)", s: "a" }, { k: "toggle", id: "small", l: "Mining station captured (30 VP; destroyed 15)", s: "a" }, { k: "toggle", id: "air", l: "Airbase captured (15 VP; destroyed 5)", s: "a" }, { k: "counter", id: "ships", l: "Rebel ships captured (VP +50%)", s: "a", res: 1 }],
    end: ["Not given — when one side is destroyed or the system is taken."],
    win: ["Normal victory points; captured ships score their value +50%.", "Factory station 30 VP destroyed / 60 captured; mining station 15 / 30; airbase 5 / 15."],
    result() { return [null, "Count victory points", "Captures are worth more than kills here."]; },
    info: { bg: "Space Marine forces join Admiral Rollins. Their first target: a remote rebel system with a huge orbital factory, a mining station and a farm world — to be taken as intact as possible, while the rebel security fleet is present.", cr: CR(29) }
  },
  /* ------------------------------------------------------------ REBELLION 1 */
  {
    id: "wr-sw-rebellion-1", grp: "community", name: "Rebellion! First Raid", series: "The Spreading War · Fifth Entry 1", trust: "community",
    why: "Community campaign scenario, played through by the author’s club; linked with Rebellion! Second Raid.", src: "Warp Rift 29, pp. 26–27", book: "O", suggest: ["Imperial Navy", "Orks"],
    others: "Any raider fleet can be the Orks; any defending fleet can follow them.",
    sides: { a: { n: "Fitch’s force", f: "Imperial Navy" }, b: { n: "Ork raid", f: "Orks" } },
    pitch: "An Ork fleet has split in two to raid two worlds. Fitch follows one — and doesn’t know whether he chose the big half.",
    glance: [["Points", "1200 or 1500, drawn blind"], ["Table", "Standard"], ["Battlezone", "A planet only"], ["First turn", "Orks"], ["Victory", "VP; undamaged installations are Imperial bonus"]],
    bring: ["A planet with an airbase, 2 laser silos and 2 orbital weapons platforms", "Envelopes (or the draw tool)"],
    forces: {
      a: ["Two rosters: 1200 and 1500 pts, two launch-bay ships in each.", "Each capital ship takes one crew skill (campaign rules); escorts only in squadrons of three or more."],
      b: ["Two rosters: 1200 and 1500 pts; up to three launch-bay ships in the larger, two in the smaller.", "Only each force’s flagship takes a crew skill."]
    },
    draw: (v, W, H) => [{ z: "planet", cx: 40, cy: H / 2, r: 10, l: "" }, { z: "text", x: 40, y: H / 2 + 18, l: "airbase, silos, platforms", s: "a" },
      R(W - 30, 0, 30, H, "b", "Orks: 30 cm", { rot: 90 }),
      { z: "tick", e: "t", list: [[W - 30, "T1"], [W - 60, "T2–3"]] }, { z: "tick", e: "b", list: [[W - 30, "T1"], [W - 60, "T2–3"]] },
      { z: "text", x: W * .4, y: 27, l: "Fitch arrives along a chosen long edge", s: "a" }],
    fit: () => [120, 60],
    mapNote: "Fitch enters 30 cm along his chosen long edge from the Ork edge on turn 1 (5+), or 60 cm on turn 2 (3+) or turn 3 (automatic).",
    steps: [
      { t: "Both players write two rosters, 1200 and 1500 pts. Put each in an envelope with two blank ones; each player draws until a roster comes out — that is the force for this battle, and the other roster fights the second raid. (The tool below does the same draw.)" },
      { t: "Set up a planet only, placed as in Planetary Assault (RB p. 136; the source’s old rulebook page 76), with one airbase, two laser silos and two orbital weapons platforms just outside its gravity well." },
      { s: "b", t: "Place your force 30 cm in from the short edge furthest from the planet. You go first." },
      { s: "a", t: "Choose a long edge for your arrival (see Play)." }
    ],
    stools: [{ k: "roll", id: "env", l: "Envelope draw (same odds)", sub: "D6 per player", rows: () => [[1, 3, "Your 1200 pt roster fights this battle"], [4, 6, "Your 1500 pt roster fights this battle"]] }],
    notes: [SERIES_NOTE, "“Blue Rulebook page 76” is the original rulebook’s Planetary Assault, now RB p. 136; its planetary defence pages (142, 146) are now FL p. 496–."],
    refs: [["Planetary defences", "FL p. 496–"], ["Crew skills (campaign)", "RB p. 159"], ["Victory points", "RB p. 122"]],
    play: [{ w: "Fitch arrives", s: "a", t: "Turn 1: on 5+ enter 30 cm along your chosen long edge, measured from the Ork edge. Turn 2: on 3+ enter 60 cm along it. Turn 3: enter there automatically." }, { w: "Ork targets", s: "b", t: "The airbase, its silos and the orbital platforms." }],
    fx: T => T === 1 ? [["a", "Arrival: 5+ at 30 cm along your long edge"]] : T === 2 ? [["a", "Arrival: 3+ at 60 cm (if not on yet)"]] : T === 3 ? [["a", "Arrival: automatic at 60 cm (if not on yet)"]] : [],
    tools: [{ k: "toggle", id: "on", l: "Fitch’s force has arrived", s: "a" }],
    end: ["Not given — when one side is destroyed or gone."],
    win: ["Installations and ships are worth their points cost in VP.", "Every installation or platform the Orks fail to destroy gives the Imperials a bonus equal to its points cost."],
    result() { return [null, "Count victory points", "Add the Imperial bonus for installations still standing."]; },
    info: { bg: BG_REB + " An Ork fleet has split in two to hit two human worlds at once; Fitch splits his force too, without knowing which half is bigger.", cr: CR(29) }
  },
  /* ------------------------------------------------------------ REBELLION 2 */
  {
    id: "wr-sw-rebellion-2", grp: "community", name: "Rebellion! Second Raid", series: "The Spreading War · Fifth Entry 2", trust: "community",
    why: "Community campaign scenario, played through by the author’s club; linked with Rebellion! First Raid.", src: "Warp Rift 29, pp. 26–27", book: "O", suggest: ["Imperial Navy", "Orks"],
    others: "Any raider fleet can be the Orks; any defending fleet can race them.",
    sides: { a: { n: "Fitch’s force", f: "Imperial Navy" }, b: { n: "Ork raid", f: "Orks" } },
    pitch: "This time Fitch gets to the planet first — and the Orks come in on a flank he has to guess.",
    glance: [["Points", "The roster left over from the first raid"], ["Table", "Standard"], ["Battlezone", "A planet only"], ["First turn", "Fitch"], ["Victory", "VP; undamaged installations are Imperial bonus"]],
    bring: ["A planet with two airbases, each with 2 laser silos"],
    forces: { a: ["The roster that did not fight the first raid (1200 or 1500 pts), with its crew skills."], b: ["The roster that did not fight the first raid (1200 or 1500 pts)."] },
    draw: (v, W, H) => [{ z: "planet", cx: W * .62, cy: H / 2, r: 10, l: "" }, { z: "text", x: W * .62, y: H / 2 + 18, l: "two airbases, 4 laser silos", s: "a" },
      { z: "edge", e: "l", s: "a", l: "Fitch races in" }, { z: "edge", e: "t", s: "b", dash: 1, l: "Ork flank (one long edge, chosen secretly)" }, { z: "edge", e: "b", s: "b", dash: 1, l: "" }],
    fit: () => [120, 60],
    steps: [
      { t: "Set up a planet only, placed as in Surprise Attack (RB p. 132; the source’s old rulebook page 72), with two airbases each guarded by two laser silos." },
      { s: "b", t: "Secretly write down which long edge you will enter from." },
      { s: "a", t: "Enter first from one short edge, racing for the planet." }
    ],
    notes: [SERIES_NOTE, "“Blue Rulebook page 72” is the original rulebook’s Surprise Attack, now RB p. 132."],
    refs: [["Planetary defences", "FL p. 496–"], ["Victory points", "RB p. 122"]],
    play: [{ w: "Orks arrive", s: "b", t: "Turn 1: on 5+ enter anywhere on your chosen long edge, but not within 45 cm of the Imperial force. Turn 2: on 4+. Turn 3: automatically." }],
    fx: T => T === 1 ? [["b", "Ork arrival: 5+"]] : T === 2 ? [["b", "Ork arrival: 4+ (if not on yet)"]] : T === 3 ? [["b", "Ork arrival: automatic (if not on yet)"]] : [],
    tools: [{ k: "toggle", id: "on", l: "The Orks have arrived", s: "b" }],
    end: ["Not given — when one side is destroyed or gone."],
    win: ["Installations and ships are worth their points cost in VP.", "Every installation the Orks fail to destroy gives the Imperials a bonus equal to its points cost."],
    result() { return [null, "Count victory points", "If the first raid was lopsided, this one is lopsided the other way."]; },
    info: { bg: BG_REB + " The second half of the split Ork fleet heads for another world, and the rest of Fitch’s force races to get there first.", cr: CR(29) }
  }
  ]);
})();
