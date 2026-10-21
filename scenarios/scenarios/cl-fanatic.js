/* Classic scenarios from Games Workshop's Fanatic: Fanatic Magazine and Fanatic Online (2004–2008).
   Privateer (Matt Keefe, Fanatic Magazine 7): The Wolf Packs; Tau Space, Tau Trade.
   BFG Scenario Competition (Fanatic Online): The Port Maw Blockade (winner), Surprise at Lachlon II
   and Reunion at Daemon Run (runners-up); The Fate of the Abhorrence; Planet Fall (Medusa V);
   Battle over Kotol, a five-battle ladder campaign.
   Written for the Armada-era rules; Remastered places are given in the notes.
   Summarised in our own words; every scenario is hand-made (see LUEMINUT.md). */
(function () {
  const FO = "Fanatic Online";
  const OLD = "Written for the Armada-era rules. ";
  const link = (id, text) => "<a href='#/s/" + id + "/setup'>" + esc(text) + " ›</a>";
  const vp2 = (st, a, b, an, bn) => {
    const A = num(st, a), B = num(st, b);
    if (!A && !B) return [null, "Count victory points", "Enter both totals below."];
    return A === B ? ["draw", "Level", A + " – " + B + " VP."] : [A > B ? "a" : "b", wins(A > B ? an : bn), an + " " + A + " – " + bn + " " + B + " VP."];
  };
  const over = (r, st) => get(st, "over", false) || !r[0] ? r : [r[0], r[1] + " — if it ended now", r[2]];
  /* critical hits table, RB p. 67 (2D6) */
  const CRIT = ["", "", "Dorsal armament damaged", "Starboard armament damaged", "Port armament damaged", "Prow armament damaged", "Engine room damaged (+1 damage)", "Fire!", "Thrusters damaged (+1 damage)", "Bridge smashed", "Shields collapse", "Hull breach (+D3 damage)", "Bulkhead collapse (+D6 damage)"];
  const critRoll = (id, n, only, who) => ({ k: "shiproll", id, l: "Critical hits before the battle", sub: who + " · 2D6 on the critical hits table (RB p. 67)", cl: "Attacking cruisers", n0: n, il: i => "Cruiser " + (i + 1), roll: () => [d6(), d6()], btn: k => "Roll 2D6 for " + k + " cruisers", out: d => CRIT[d[0] + d[1]], only });

  /* Privateer special rules (Fanatic Magazine 7 p. 82–83) */
  const PRIV_PLAY = [
    { w: "Damaged escorts", t: "When an escort takes a hit that would destroy it, roll a D6 instead (tool below): 1–3 out of action, 4–5 damage control, 6 it battles on with an extra blast marker on its base. Capital ships do not get this." },
    { w: "Lone escorts", t: "Escorts may operate alone at −1 Leadership. A lone escort stays lone all game: no forming or breaking up squadrons." }
  ];
  const PRIV_TOOLS = [
    { k: "roll", id: "esc1", l: "An escort would be destroyed", sub: "D6", rows: () => [[1, 3, "Out of action: remove it and place a blast marker"], [4, 5, "Damage control: leave it; at the start of its next movement phase it moves straight ahead half its speed, then roll again with +1 (tool below)"], [6, 6, "Battles on: place a blast marker on its base and fight on"]] },
    { k: "roll", id: "esc2", l: "Rolling again after damage control", sub: "D6, the +1 is already counted · it never rises above +1", rows: () => [[1, 2, "Out of action: remove it and place a blast marker"], [3, 4, "Damage control again: half speed straight ahead, roll again"], [5, 6, "Battles on: place a blast marker on its base and fight on"]] }
  ];
  const REVEAL_PLAY = [
    { w: "Contact markers", s: "b", t: "A face-down marker is revealed as soon as a defending ship moves within 30 cm of it; finish that ship’s move. When the defender has moved everything, place the models for every marker revealed that turn." },
    { w: "Springing the trap", s: "b", t: "At the start of your movement phase you may reveal any markers yourself. Roll a D6 for each one: on a 5 or 6 the trap is sprung early and the defender gains one bonus re-roll for this game." }
  ];
  const REVEAL_TOOLS = [
    { k: "roll", id: "trap", l: "A marker revealed by its own player", s: "b", sub: "D6 for each marker the attacker reveals", rows: () => [[1, 4, "The pack strikes unseen"], [5, 6, "Sprung early: the defender gains a bonus re-roll"]] },
    { k: "counter", id: "rr", l: "Defender’s bonus re-rolls", s: "a" }
  ];
  const PRIV_NOTES = "Privateer special rules (Fanatic Magazine 7 p. 82–83): damaged escorts get a second chance, escorts may fight alone at −1 Leadership, and a fleet with no single ship worth more than 50 pts gets a free fleet commander — no Leadership bonus, but one fleet re-roll.";
  const PRIV_CR = "Matt Keefe — “Privateer”, part 2 of the series, Fanatic Magazine 7 (2004), p. 82–87; also published as a Fanatic Online article.";

  /* Battle over Kotol (Fanatic Online) */
  const KV = ["b1", "b2", "b3", "b4", "b5"];
  const KDP = { b1: 3, b2: 3, b3: 2, b4: 1, b5: 2 };
  const KNAME = { b1: "Contact", b2: "Hold the Line", b3: "It Begins", b4: "Counter Attack", b5: "The Defence of Kotol" };
  const KOTOL_CAMPAIGN = "<h3>The Kotol ladder</h3><ul class='plain'>" + [
    "Any attacker may challenge any defender to Battle 1. The defender is always the Imperial Navy; the attackers can be any of its enemies.",
    "If the defender wins, they score the battle’s defence points and the attacker must challenge someone new to the same battle.",
    "If the attacker wins, the defender scores nothing and the attacker moves on to the next battle.",
    "An attacker may challenge any defender except the one faced in the previous battle.",
    "The first attacker to win Battle 5 wins the campaign. Defence points then freeze, and the defender with the most of them wins the defending side."].map(x => "<li>" + fmt(x) + "</li>").join("") + "</ul>";

  addScenarios([
  /* ------------------------------------------------------------ PRIVATEER I · THE WOLF PACKS */
  {
    id: "cl-wolf-packs", grp: "cl-fan", name: "The Wolf Packs", series: "Privateer · Scenario I", trust: "classic",
    why: "A tiny convoy runs a lane full of hidden raiders. The defender sets a secret value on every transport — and the raiders only learn what they got when they kill it.", src: "Fanatic Magazine 7 p. 83–84", book: "O", suggest: ["Rogue Traders", "Orks"],
    others: "The attackers can be any fleet with good escorts — the magazine suggests Orks, Eldar or Tau Commerce Protection fleets, or its own Wolf Pack list. Any fleet can defend; Rogue Traders fit best.",
    sides: { a: { n: "Convoy", f: "Rogue Traders" }, b: { n: "Wolf Pack", f: "Pirates and Wolf Packs" } },
    pitch: "A few transports and their thin escort must cross a stretch of space where the wolf packs lie in wait — somewhere ahead, behind face-down markers.",
    glance: [["Points", "Agreed, 400 or less"], ["Table", "Not given — the map shows 180 × 120"], ["Battlezone", "Agreed phenomena"], ["First turn", "Convoy"], ["Game ends", "The convoy is gone, or the pack disengages"]],
    bring: ["At least 2 transports", "A face-down contact marker per pack squadron, escort or attack craft marker", "Escorts only for the pack"],
    forces: {
      a: ["Up to the agreed points (400 or less): at most one capital ship, the rest escorts.", "Any number of transports, at least two. Give each a cargo value of 10 pts or more and write it on your roster — keep it secret. Paid transport variants cost extra and do not count as cargo.", "Up to a third of the transports may be heavy; each heavy transport carries at least 60 pts of cargo."],
      b: ["Up to the agreed points from any one fleet list, escorts only.", "A fleet with no ship over 50 pts gets a free fleet commander: one re-roll, no Leadership bonus."]
    },
    draw: (v, W, H, st) => {
      const f = get(st, "entry", 0), left = f ? f <= 3 : true, y = H / 2;
      return [
        R(0, 0, W, 45, "b", ""), R(0, H - 45, W, 45, "b", ""),
        R(30, 30, W - 60, 15, "b", "markers 30–45 cm from the edge", { dash: 1 }), R(30, H - 45, W - 60, 15, "b", "markers 30–45 cm from the edge", { dash: 1 }),
        { z: "text", x: W / 2, y: 14, l: "Wolf Pack deployment zone (magazine’s map)", s: "b" },
        { z: "arrow", x1: left ? 2 : W - 2, y1: y, x2: left ? 34 : W - 34, y2: y, s: "a", l: f ? "convoy enters" : "convoy enters (roll)" },
        { z: "edge", e: left ? "r" : "l", s: "a", dash: 1, l: "Convoy escapes here" }
      ];
    },
    fit: () => [120, 100],
    mapNote: "The text keeps markers at least 30 cm from every edge and 30 cm apart; the magazine’s map marks a 45 cm Wolf Pack deployment zone along each long edge. Read together, the markers go 30–45 cm in from a long edge. The convoy enters on a short edge, at least 45 cm from either long edge, and escapes off the opposite one.",
    steps: [
      { t: "Agree the points (400 or less) and set up phenomena as you both like: near a planet or in deep space." },
      { s: "b", t: "Place one face-down contact marker for each escort, squadron or attack craft marker: at least 30 cm apart and at least 30 cm from any edge. If they do not all fit, stack the extra ones on markers already placed." },
      { s: "a", t: "Roll a D6 for your entry edge (tool below). Place one ship on that short edge to mark where the convoy enters — not within 45 cm of either long edge." },
      { s: "a", t: "The convoy takes the first turn. It moves on at the marked point during turns 1 and 2; everything must be on the table by the end of your second movement phase." }
    ],
    stools: [{ k: "roll", id: "entry", l: "Convoy’s entry edge", sub: "D6", rows: () => [[1, 3, "The left short edge, as on the map"], [4, 6, "The right short edge"]] }],
    notes: [OLD + PRIV_NOTES,
      "Victory points come only from transports: the attacker scores the cargo value of each transport destroyed, the convoy the value of each transport that leaves by the opposite short edge. Nobody scores for warships. Defending ships that disengage count as destroyed; pack ships may disengage freely.",
      "The magazine’s Wolf Pack fleet list grew into the Fleets book’s Pirates and Wolf Packs list (FL p. 178–), and its Commerce Protection fleet into FL p. 456. Transports and their variants: FL p. 520–."],
    refs: [["Pirates and Wolf Packs list", "FL p. 178–"], ["Commerce Protection fleet list", "FL p. 456"], ["Transports, heavy transports", "FL p. 520–"], ["Disengaging", "RB p. 56"]],
    play: [
      { w: "Turns 1–2", s: "a", t: "Bring the convoy on at the marked point; all of it must be on by the end of your second movement phase." }
    ].concat(REVEAL_PLAY, PRIV_PLAY, [
      { w: "Leaving", s: "a", t: "Transports that leave by the short edge opposite your entry score their cargo value. Defending ships that disengage count as destroyed." },
      { w: "Leaving", s: "b", t: "Disengage freely once you think you have taken enough cargo — the defender scores nothing for it." }
    ]),
    fx: T => T === 1 ? [["a", "The convoy starts coming on at the marked point"]] : T === 2 ? [["a", "The whole convoy must be on the table by the end of this movement phase"]] : [],
    tools: REVEAL_TOOLS.concat(PRIV_TOOLS),
    rtools: [
      { k: "num", id: "bv", l: "Wolf Pack: cargo value of transports destroyed", s: "b", after: v => v + " VP" },
      { k: "num", id: "av", l: "Convoy: cargo value of transports that escaped", s: "a", after: v => v + " VP" },
      { k: "html", html: "<p class='small muted' style='margin:0'>Next in the series: " + link("cl-tau-trade", "Tau Space, Tau Trade") + ".</p>" }
    ],
    end: ["When the last convoy ship has left the table or been destroyed.", "Or when the attackers disengage."],
    win: ["Only cargo counts: the pack scores the value of every transport destroyed, the convoy the value of every transport that escaped.", "The higher total wins."],
    result(st) { return vp2(st, "av", "bv", "The convoy", "The Wolf Pack"); },
    info: { bg: "Wherever there are shipping lanes there are wolf packs: loose bands of renegades, deserters and disaffected merchants in small, fast ships. They rarely face a battlefleet; their prey is the convoy too thinly escorted to stop them.", cr: [PRIV_CR] }
  },
  /* ------------------------------------------------------------ PRIVATEER II · TAU SPACE, TAU TRADE */
  {
    id: "cl-tau-trade", grp: "cl-fan", name: "Tau Space, Tau Trade", series: "Privateer · Scenario II", trust: "classic",
    why: "The pirates become the prey: deep in-system, they cannot jump to warp and must race past hidden licensed hunters to escape.", src: "Fanatic Magazine 7 p. 86", book: "O", suggest: ["Rogue Traders", "Tau"],
    others: "Written for Tau Commerce Protection fleets hunting raiders; any escort fleet can hunt, and Orks, Eldar, wolf packs or Rogue Traders make good quarry.",
    sides: { a: { n: "Raiders", f: "Rogue Traders" }, b: { n: "Hunters", f: "Tau" } },
    pitch: "The raiders’ base deep in the system has been found. A Commerce Protection fleet with a dubious licence is waiting between them and the jump point.",
    glance: [["Points", "Raiders: agreed · Hunters: +50%"], ["Table", "Not given — the map shows 180 × 120"], ["Battlezone", "Primary or inner biosphere"], ["First turn", "Roll-off"], ["Game ends", "The last raider has escaped or died"]],
    bring: ["Escorts only, both sides", "A face-down contact marker per hunter escort, squadron or attack craft marker"],
    forces: {
      a: ["The agreed points, escorts only.", "A fleet with no ship over 50 pts gets a free fleet commander: one re-roll, no Leadership bonus."],
      b: ["The agreed points plus 50%, escorts only."]
    },
    draw: (v, W, H) => [
      R(0, 45, 60, H - 90, "a", "Raiders: within 60 cm"),
      R(90, 0, W - 90, 45, "b", "hunter markers", { dash: 1 }), R(90, H - 45, W - 90, 45, "b", "hunter markers", { dash: 1 }),
      { z: "sun", e: "l", l: "sunward edge" },
      { z: "edge", e: "r", s: "a", dash: 1, l: "Raiders escape here" }
    ],
    fit: () => [120, 100],
    mapNote: "The raiders start within 60 cm of the sunward edge and at least 45 cm from both long edges. Hunter markers go at least 90 cm from the sunward edge and within 45 cm of either long edge. Raiders escape only off the far short edge.",
    steps: [
      { t: "Primary or inner biosphere, phenomena by agreement. Choose a short edge as sunward." },
      { s: "a", t: "Set up within 60 cm of the sunward edge and at least 45 cm from either long edge." },
      { s: "b", t: "Place one face-down contact marker for each escort, squadron or attack craft marker: at least 90 cm from the sunward edge and no more than 45 cm from a long edge." },
      { t: "Roll off. The higher roll chooses to go first or second." }
    ],
    notes: [OLD + PRIV_NOTES, "This deep in the system the raiders cannot jump to warp: they may not disengage. They score the cost of every ship that leaves by the short edge opposite the sunward edge; the hunters score the cost of every raider destroyed. Nothing else counts.",
      "The magazine prints the contact-marker rules from The Wolf Packs again, word for word.", "The Commerce Protection fleet list is now FL p. 456."],
    refs: [["Commerce Protection fleet list", "FL p. 456"], ["Pirates and Wolf Packs list", "FL p. 178–"], ["Battlezones", "RB p. 106–108"]],
    play: REVEAL_PLAY.concat(PRIV_PLAY, [{ w: "All game", s: "a", t: "You may not disengage. Get your ships off the short edge opposite the sunward edge." }]),
    tools: REVEAL_TOOLS.concat(PRIV_TOOLS),
    rtools: [
      { k: "num", id: "av", l: "Raiders: points of ships that escaped", s: "a", after: v => v + " VP" },
      { k: "num", id: "bv", l: "Hunters: points of raiders destroyed", s: "b", after: v => v + " VP" },
      { k: "html", html: "<p class='small muted' style='margin:0'>The first Privateer scenario: " + link("cl-wolf-packs", "The Wolf Packs") + ".</p>" }
    ],
    end: ["When the last raider has left the table or been destroyed."],
    win: ["Raiders score the cost of every ship that escapes off the far short edge; hunters the cost of every raider destroyed.", "The higher total wins."],
    result(st) { return vp2(st, "av", "bv", "The raiders", "The hunters"); },
    info: { bg: "Privateers seldom draw the Imperial Navy’s attention. Their real danger is rivals just as ruthless — above all the Tau Commerce Protection fleets: pirates with a licence, who drive other traders off their routes in the name of the Greater Good and then take the routes over.", cr: [PRIV_CR] }
  },
  /* ------------------------------------------------------------ REUNION AT DAEMON RUN */
  {
    id: "cl-daemon-run", grp: "cl-fan", name: "Reunion at Daemon Run", series: "Gothic War · historical refight", trust: "classic",
    why: "A Slaaneshi battleship must break through a Grey Knights fleet to escape — and being boarded on the way costs it the big win.", src: "Fanatic Online p. 1–2", book: "O", suggest: ["Inquisition", "Chaos"],
    others: "Written as a refight with set fleets: Grey Knights against a Slaaneshi Chaos fleet. The source gives no points; to play other fleets, agree forces of similar size and pick a battleship to flee.",
    sides: { a: { n: "Grey Knights", f: "Inquisition (Grey Knights)" }, b: { n: "Chaos", f: "Chaos (Slaanesh)" } },
    pitch: "Inquisitor Lord Coldiron has run Lady Erzsebet’s Slaaneshi fleet to ground as it flees for the Eye of Terror. The Warmistress, they say, is his twin sister.",
    glance: [["Points", "Set fleets (no points given)"], ["Table", "Not given — use your table"], ["Battlezone", "Deep space + one Grey Knights asteroid field"], ["First turn", "Chaos"], ["Game ends", "The Favoured Concubine escapes or dies"]],
    bring: ["A Despoiler: the Favoured Concubine", "A Grey Knights battle barge, 4 strike cruisers and 10 escorts", "Chaos: a Repulsive, 5 cruisers, 4 Infidels", "One extra asteroid field"],
    forces: {
      a: ["Brother-Captain Andros, Master of the Fleet: Ld 10, 1 re-roll, aboard the battle barge Divine Blade with Inquisitor Coldiron and a Grey Knights Terminator boarding party.", "Strike cruisers Nemesis, Valorus, Emperor’s Chosen and Aegis.", "Hammerhands: 3 Gladius frigates. Bannishers: 3 Nova frigates. Exorcists: 4 Hunter destroyers."],
      b: ["Warmistress Lady Erzsebet Coldiron: Ld 9, 1 re-roll, Mark of Slaanesh, aboard the Despoiler battleship Favoured Concubine.", "Daemonette: Repulsive grand cruiser, a daemonship with the Mark of Slaanesh.", "Cruisers: Devastation Insatiable, Carnage Deviant Lust, Murder Wanton Desire, Slaughters Incubus and Succubus.", "Sirens of Cruelty: 4 Infidel raiders."]
    },
    draw: (v, W, H) => [
      R(0, 0, 30, H, "b", "Chaos: 30 cm", { rot: -90 }), R(W - 30, 0, 30, H, "a", "Grey Knights: 30 cm", { rot: 90 }),
      { z: "line", x1: W / 2, y1: 0, x2: W / 2, y2: H },
      { z: "text", x: (W / 2 + W - 30) / 2, y: H * 0.18, l: "extra asteroid field:\nanywhere in this half", s: "a" },
      { z: "arrow", x1: 36, y1: H * 0.62, x2: W - 36, y2: H * 0.62, s: "b", l: "the Favoured Concubine’s escape" },
      { z: "sun", e: "l", l: "sunward edge (either short edge)" }
    ],
    fit: () => [90, 60],
    mapNote: "Chaos sets up within 30 cm of the sunward short edge (either one), the Grey Knights within 30 cm of the other. After Chaos has set up, the Grey Knights add one asteroid field anywhere between the middle of the table and their own edge. The Concubine escapes off the Grey Knights’ edge.",
    steps: [
      { t: "Generate deep space phenomena (RB p. 106–108). Choose either short edge as sunward." },
      { s: "b", t: "Set up the whole fleet within 30 cm of the sunward edge." },
      { s: "a", t: "Place one extra asteroid field anywhere between the middle of the table and your own edge." },
      { s: "a", t: "Set up the whole fleet within 30 cm of the opposite short edge." },
      { s: "b", t: "Chaos takes the first turn." }
    ],
    notes: [OLD + "Grey Knights had no fleet list then. The scenario says: use the Space Marine fleet rules (FL p. 94–96); Inquisitor Coldiron gives +1 in boarding actions; Grey Knight ships ignore the Mark of Slaanesh. As an option it allows the Daemonhunter rules from BFG Magazine 16 instead. Today the Fleets book’s Grey Knights list (FL p. 144–151, Daemonhunters p. 145) is their descendant — agree which rules you use.",
      "The Favoured Concubine may not disengage; the rest of the Chaos fleet may.", "“Boarded” is not defined. Suggestion: only a boarding action counts, not hit-and-run teleport attacks.",
      "The same author wrote the Favoured Concubine up as a character ship for Fanatic Online; this scenario uses a plain Despoiler."],
    refs: [["Grey Knights fleet list", "FL p. 144–151"], ["Space Marine special rules", "FL p. 94–96"], ["Despoiler class battleship", "FL p. 266"], ["Repulsive grand cruiser", "FL p. 269"], ["Daemonships", "FL p. 226–229"], ["Mark of Slaanesh", "FL p. 232"], ["Boarding actions", "RB p. 89–90"]],
    play: [
      { w: "All game", s: "b", t: "The Favoured Concubine may not disengage. Get her off the Grey Knights’ short edge — without being boarded, if you can." },
      { w: "All game", s: "a", t: "Your ships ignore the Mark of Slaanesh. Inquisitor Coldiron aboard the Divine Blade gives +1 in boarding actions." },
      { w: "Boarding the Concubine", s: "a", t: "Board her before you destroy her: that turns a minor victory into a major one — and denies Chaos its major victory if she escapes." }
    ],
    tools: [{ k: "toggle", id: "brd", l: "The Favoured Concubine has been boarded", s: "a" }],
    rtools: [
      { k: "ending", id: "how", l: "How did it end?", rows: [["The Favoured Concubine escaped off the Grey Knights’ edge", "b"], ["The Favoured Concubine was destroyed", "a"], ["Neither", "draw", "Draw"]] },
      { k: "toggle", id: "brd", l: "The Favoured Concubine was boarded", s: "a" }
    ],
    end: ["When the Favoured Concubine is destroyed, or escapes off the short edge opposite her set-up area."],
    win: ["Escapes without being boarded: major Chaos victory.", "Escapes after being boarded: minor Chaos victory.", "Destroyed without being boarded: minor Grey Knights victory.", "Destroyed after being boarded: major Grey Knights victory.", "Anything else: draw."],
    result(st) {
      const i = get(st, "how", -1), b = get(st, "brd", false);
      if (i === 0) return ["b", b ? "Minor Chaos victory" : "Major Chaos victory", b ? "She escaped, but the Grey Knights got aboard." : "She escaped untouched by Grey Knights boarders."];
      if (i === 1) return ["a", b ? "Major Grey Knights victory" : "Minor Grey Knights victory", b ? "Boarded, then destroyed." : "Destroyed without being boarded."];
      if (i === 2) return ["draw", "Draw", "Neither escape nor destruction."];
      return [null, "Battle in progress", b ? "The Concubine has been boarded." : "Mark how it ended."];
    },
    info: { bg: "Late in the Gothic War, Lady Erzsebet’s Slaaneshi fleet lingered in the Orar Sub-Sector until Abaddon’s withdrawal left it outnumbered. As it ran for the Eye of Terror, Inquisitor Lord Gyorgy Coldiron of the Ordo Malleus caught it with a Grey Knights task force out of Anvil 206. The Divine Blade drove into the Favoured Concubine and Coldiron led the boarders to her bridge himself; soon after the battle barge pulled away, her warp drive imploded.", cr: ["Michael Pike — “Reunion at Daemon Run”, runner-up in the BFG Scenario Competition, " + FO + ", 2 pp.", "The same author’s “Favoured Concubine” was a finalist in the " + FO + " character ship competition."] }
  },
  /* ------------------------------------------------------------ SURPRISE AT LACHLON II */
  {
    id: "cl-lachlon", grp: "cl-fan", name: "Surprise at Lachlon II", series: "BFG Scenario Competition · runner-up", trust: "classic",
    why: "A crippled Emperor battleship must reach a dock between two randomly placed moons while a Chaos squadron hunts it. Destroy it, or dock it, and the game is over.", src: "Fanatic Online p. 1–2", book: "O", suggest: ["Imperial Navy", "Chaos"],
    others: "Written for the Legatus Stygies against the Foe-Reaper. Any fleet can escort a damaged battleship to a dock, and any can hunt it.",
    sides: { a: { n: "Imperial Navy", f: "Imperial Navy" }, b: { n: "Chaos", f: "Chaos" } },
    pitch: "The damaged Legatus Stygies limps towards the only dock in reach, a forgotten station between the moons of Lachlon. Abaddon has guessed where it is going.",
    glance: [["Points", "1000 each + a free flagship"], ["Table", "180 × 120 cm"], ["Battlezone", "Primary biosphere: planet, 2 moons, asteroids"], ["First turn", "Chaos"], ["Game ends", "Legatus docks or dies, or after 10 turns"]],
    bring: ["An Emperor class battleship (Legatus Stygies)", "A Repulsive grand cruiser (Foe-Reaper)", "A space station", "A medium planet, two moons, an asteroid field"],
    forces: {
      a: ["1000 pts, plus the Legatus Stygies free as flagship.", "The space station costs 130 pts of the 1000.", "Choose an admiral as normal. No other battleships, battlecruisers, grand cruisers or heavy cruisers."],
      b: ["1000 pts, plus the Foe-Reaper (Repulsive grand cruiser) free; it must be the flagship.", "Choose an admiral as normal. No other battleships, battlecruisers, grand cruisers or heavy cruisers."]
    },
    draw: (v, W, H, st) => {
      const r = 8, px = W - r, py = H - r;
      const moon = i => {
        const d = get(st, "m" + i + "d", 0), z = get(st, "m" + i + "z", 0), dd = d || 50, zz = z || (i === 1 ? 1 : 6), a = (zz - .5) * 15 * Math.PI / 180;
        return { x: px - dd * Math.cos(a), y: py - dd * Math.sin(a) };
      };
      const m1 = moon(1), m2 = moon(2), sx = (m1.x + m2.x) / 2, sy = (m1.y + m2.y) / 2;
      return [
        { z: "line", x1: W / 2, y1: 0, x2: W / 2, y2: H }, { z: "line", x1: 0, y1: H / 2, x2: W, y2: H / 2 },
        { z: "hatch", x: W / 2, y: 0, w: W / 2, h: 18, l: "asteroid field" },
        R(0, 0, 15, H / 2, "a", "Imperial: 15 cm", { rot: -90 }), R(W - 15, 0, 15, H / 2, "b", "Chaos: 15 cm", { rot: 90 }),
        { z: "text", x: W / 4, y: H / 4 + 4, l: "SW quadrant" }, { z: "text", x: W * .62, y: H / 4 + 10, l: "NW quadrant" }, { z: "text", x: W / 4, y: H * .75, l: "SE quadrant" },
        { z: "planet", cx: px, cy: py, r, l: "" },
        { z: "planet", cx: m1.x, cy: m1.y, r: 2.5, l: "" }, { z: "planet", cx: m2.x, cy: m2.y, r: 2.5, l: "" },
        { z: "mark", x: sx, y: sy, s: "a", l: "" }, { z: "text", x: sx, y: sy + mapFont(W) * 1.6, l: "space station", s: "a" },
        { z: "sun", e: "l", l: "south: sunward edge" }, { z: "edge", e: "r", l: "north edge" }
      ];
    },
    fit: () => [180, 120],
    mapNote: "Drawn with north to the right: the sunward south edge is on the left, west at the top. The planet sits in the north-east corner touching both edges; the moons are placed by the tools below and the station sits halfway between them. Deployment zones: 15 cm strips along the south and north edges, each as wide as its quadrant.",
    steps: [
      { t: "Table 180 cm long, 120 cm wide; the short edges are south (sunward) and north. Place a medium planet in the north-east corner, touching the north and east edges." },
      { t: "Place two moons south-west of the planet. For each, roll D6 × 10 cm for the distance from the planet’s centre and a D6 for the direction: divide the 90° from due south to due west into six 15° zones, 1 to 6. Tools below; the map follows them." },
      { t: "Place the space station exactly halfway between the two moons." },
      { t: "Place an asteroid field in the north-west corner, reaching at least halfway south along the table. Extra phenomena may go in the two southern quadrants if you both want them." },
      { s: "a", t: "Deploy first: within 15 cm of the south edge, across the south-west quadrant. One cruiser or one escort squadron may start at the space station instead." },
      { s: "b", t: "Deploy within 15 cm of the north edge, across the north-west quadrant. Your ships have already found a gap in the asteroids." },
      { s: "b", t: "Chaos takes the first turn." }
    ],
    stools: [
      { k: "val", id: "m1d", l: "First moon: distance (D6 × 10 cm)", opts: [10, 20, 30, 40, 50, 60], roll: () => 10 * d6(), unit: " cm" },
      { k: "val", id: "m1z", l: "First moon: direction (D6: 1 = due south … 6 = due west)", opts: [1, 2, 3, 4, 5, 6], roll: () => d6(), unit: "" },
      { k: "val", id: "m2d", l: "Second moon: distance (D6 × 10 cm)", opts: [10, 20, 30, 40, 50, 60], roll: () => 10 * d6(), unit: " cm" },
      { k: "val", id: "m2z", l: "Second moon: direction (D6: 1 = due south … 6 = due west)", opts: [1, 2, 3, 4, 5, 6], roll: () => d6(), unit: "" }
    ],
    notes: [OLD + "The source has no map. The battlefield is “120 cm wide by 180 cm long” with north at the top, so the north and south edges are the short ones: “as wide as the quadrant, 15 cm deep” means strips along the short south and north edges, and the north-west asteroid field then runs partly through the Chaos zone, as the text warns.",
      "The Emperor class is FL p. 53 (365 pts) and names the Legatus Stygies; the Repulsive is FL p. 269 and names the Foe-Reaper. Use the current costs for victory points.",
      "Space station: FL p. 507 (150 pts there, 130 here because its weapons battery reaches only 30 cm).",
      "Victory points after 10 turns: the Foe-Reaper counts 125% of its cost if destroyed (and only then); the Legatus Stygies counts 50% if crippled but not destroyed. Holding the field counts for nothing."],
    refs: [["Emperor class battleship", "FL p. 53"], ["Repulsive grand cruiser", "FL p. 269"], ["Space station", "FL p. 507"], ["Planets, moons", "RB p. 112–113"], ["Asteroid fields", "RB p. 110"], ["Victory points", "RB p. 122"]],
    play: [
      { w: "Legatus Stygies", s: "a", t: "10 hits instead of 12 (crippled at 5 damage). No Shark assault boats. No special orders except Brace for Impact. It starts with its ordnance but may never reload: each launch bay launches once." },
      { w: "The space station", s: "a", t: "Its weapons battery reaches only 30 cm (column shifts as for a 60 cm weapon); lances and launch bays work as normal. It can be crippled and put out of action but never destroyed: no catastrophic damage roll." },
      { w: "Docking", s: "a", t: "Move the Legatus Stygies into base contact with the station and declare it in high orbit. If it then survives one turn, you win at once — even if the station is out of action." },
      { w: "All game", s: "b", t: "Destroy the Legatus Stygies and you win at once." }
    ],
    turnMax: () => 10,
    fx: T => T === 10 ? [[null, "Last turn: if nobody has won outright, count victory points"]] : [],
    tools: [{ k: "toggle", id: "dock", l: "The Legatus Stygies has docked — survive one turn", s: "a" }],
    rtools: [
      { k: "ending", id: "how", l: "How did it end?", rows: [["The Legatus Stygies was destroyed", "b"], ["The Legatus Stygies docked and survived a turn", "a"], ["Ten turns passed — count victory points", "draw", "Count VP"]] },
      { k: "num", id: "av", l: "Imperial victory points (Foe-Reaper destroyed: 125%)", s: "a", after: v => v + " VP" },
      { k: "num", id: "bv", l: "Chaos victory points (Legatus crippled: 50%)", s: "b", after: v => v + " VP" }
    ],
    end: ["As soon as the Legatus Stygies is destroyed, or has docked and survived a turn.", "Otherwise after 10 turns."],
    win: ["Legatus Stygies destroyed: Chaos wins at once.", "Legatus Stygies docked and alive a turn later: the Imperial Navy wins at once.", "After 10 turns: victory points, with the Foe-Reaper at 125% if destroyed and the Legatus at 50% if crippled. Holding the field counts nothing."],
    result(st, v, S) { const i = get(st, "how", -1); return i === 0 || i === 1 ? endingResult(st, S, "how") : i === 2 ? vp2(st, "av", "bv", "The Imperial Navy", "Chaos") : [null, "Battle in progress", get(st, "dock", false) ? "Docked: one more turn to survive." : "Mark how it ended."]; },
    info: { bg: "After the disaster at Ulthanx, Lord Admiral Ravensburg sent the damaged Legatus Stygies to the only dock nearby that could take a battleship: a run-down station between the moons of Lachlon, a mining world long in decline. Abaddon guessed where it would go and sent the Foe-Reaper and a cruiser squadron through the asteroid belts to meet it. In the story both flagships were crippled, and both survived.", cr: ["Reinout Hubbers — “Surprise at Lachlon II”, runner-up in the BFG Scenario Competition, " + FO + ", 3 pp."] }
  },
  /* ------------------------------------------------------------ THE PORT MAW BLOCKADE */
  {
    id: "cl-port-maw", grp: "cl-fan", name: "The Port Maw Blockade", series: "BFG Scenario Competition · winner", trust: "classic",
    why: "Chaos minelayers race into the primary biosphere to sow a minefield. Count the mines, count the minelayers lost — a five-way victory table decides.", src: "Fanatic Online p. 1–2", book: "O", suggest: ["Imperial Navy", "Chaos"],
    others: "Written for Chaos raiders against Port Maw’s defenders. Any fleet with launch-bay cruisers can lay mines; any fleet can defend.",
    sides: { a: { n: "Defender", f: "Imperial Navy" }, b: { n: "Attacker", f: "Chaos" } },
    pitch: "Port Maw cannot be taken, so Chaos means to starve it. Converted cruisers dash for the inner system to seed it with orbital mines.",
    glance: [["Points", "Agreed + defences for the defender"], ["Table", "180 cm long (the map)"], ["Battlezone", "Primary biosphere: Port Maw, two moons"], ["First turn", "Attacker"], ["Game ends", "After 6 turns"]],
    bring: ["A medium planet and two moons", "Devastation or Styx cruisers (minelayers)", "Orbital mine markers", "Planetary defences"],
    forces: {
      a: ["The agreed points.", "Plus 2D6 × 10 pts of planetary defences per 500 pts (or part) of your fleet — tool below.", "You may spend up to 25% of your fleet points on more defences."],
      b: ["The agreed points.", "For every 500 pts (or part), one Devastation or Styx cruiser, upgraded to a minelayer for free."]
    },
    fixed: {
      a: ["Fleet-Admiral Hoshi aboard the Dictator Lux Imperator; Lunar Retribution; Dominator Hammer of Justice.", "12th Destroyer Squadron: 4 Cobras. Port Maw Patrol Squadrons Alpha and Gamma: 3 Swords each.", "3 orbital weapons platforms and 2 orbital torpedo launchers."],
      b: ["Warmaster Ferrix aboard the Styx Death Bringer (minelayer); Devastation Unforgivable (minelayer); Murder Monstrous.", "Damnators: 3 Infidels. Bloodied Claws: 6 Iconoclasts."]
    },
    draw: (v, W, H) => {
      const r = 7.5, px = W - 15 - r, py = H / 2;
      return [
        R(0, 0, 15, H, "b", "Attacker: 15 cm", { rot: -90 }),
        R(67.5, 0, 15, H, "b", "Area to be mined: 15 cm", { rot: -90, dash: 1 }), { z: "line", x1: 75, y1: 0, x2: 75, y2: H },
        { z: "circ", cx: px, cy: py, r: r + 30, s: "a" },
        { z: "planet", cx: px, cy: py, r, l: "" },
        { z: "text", x: px - 3, y: py + r + 13, l: "Defender:\nwithin 30 cm", s: "a" },
        { z: "dim", x1: 15, y1: H * .2, x2: 75, y2: H * .2, l: "60 cm" },
        { z: "dim", x1: 75, y1: H * .85, x2: px - r, y2: H * .85, l: Math.round(px - r - 75) + " cm" },
        { z: "sun", e: "r", l: "sunward edge" }
      ];
    },
    fit: () => [150, 80],
    mapNote: "From the article’s map: the attacker sets up within 15 cm of the short edge furthest from Port Maw. The area to be mined is a 15 cm band centred 75 cm from that edge; Port Maw sits no more than 15 cm from the other short edge. Moons are placed as normal.",
    steps: [
      { t: "Primary biosphere. Place a medium planet, Port Maw, no more than 15 cm from one short edge: that edge is sunward. Give it two moons as normal; a moon that lands off the table is left out. Other phenomena as normal." },
      { t: "Mark the area to be mined: a 15 cm band across the table, centred 75 cm from the attacker’s edge." },
      { s: "a", t: "Set up within 30 cm of the planet, facing any way. Defences go in the gravity well of the planet or a moon." },
      { s: "b", t: "Set up within 15 cm of the short edge opposite the planet." },
      { s: "b", t: "The attacker takes the first turn." }
    ],
    stools: [
      { k: "shiproll", id: "dp", l: "Defender’s free planetary defences", cl: "Dice pairs: one per 500 pts of your fleet (or part)", n0: 3, il: i => "Pair " + (i + 1), roll: () => [d6(), d6()], btn: n => "Roll 2D6 × " + n, out: d => (d[0] + d[1]) * 10 + " pts", foot: st => { const r = get(st, "dp", null); return r ? "<p class='calc' style='margin:4px 0 0'>Total: <b>" + r.reduce((a, d) => a + (d[0] + d[1]) * 10, 0) + " pts</b> of defences, free. Up to 25% of your fleet points may buy more.</p>" : ""; } },
      { k: "counter", id: "ml", l: "Minelayers in the attacking fleet", s: "b", start: 2, min: 1, max: 12 }
    ],
    notes: [OLD + "Its minelayer rules became the Fleets book’s orbital mines refit (FL p. 23), which differs in two points: the refit costs +5 pts per launch bay there (free here), and only cruisers may take it (here: no battleships).",
      "Orbital mines: FL p. 512 says shields protect against mines normally; the Collected FAQ 2026 (question “Do orbital mines interact with shields when exploding?”) says a mine that attacks a ship ignores shields — 8 dice against armour, 4 if turrets hit it. The FAQ wins.",
      "Only mines launched inside the area to be mined count. The original pointed to orbital mines on old rulebook p. 142."],
    refs: [["Orbital mines refit", "FL p. 23"], ["Orbital mine", "FL p. 512"], ["Planetary defences", "FL p. 496–515"], ["Styx, Devastation", "FL p. 272, 276"], ["Planets, moons", "RB p. 112–113"]],
    play: [
      { w: "Minelayers", s: "b", t: "Each launch bay launches one orbital mine instead of attack craft, at the end of the movement phase like a squadron. Mines cannot form waves and have no ordnance limit. Only mines launched inside the area to be mined count." },
      { w: "Minelayers", s: "b", t: "A critical hit on a minelayer’s launch bays does D3 extra damage as mines go off." },
      { w: "Orbital mines", t: "A mine moves 10 cm towards the nearest enemy ship in each ordnance phase and detonates on contact: 8 dice to hit, 4 if turrets hit it, shields ignored (FAQ 2026)." },
      { w: "Turrets", t: "In one ordnance phase a ship’s turrets fire at attack craft, or at torpedoes and mines — not both." }
    ],
    turnMax: () => 6,
    fx: T => T === 6 ? [[null, "Last turn: count the mines laid and the minelayers lost"]] : [],
    tools: [
      { k: "counter", id: "mines", l: "Mines launched inside the area", s: "b", res: 1, goal: 15, bulk: 4 },
      { k: "counter", id: "mlx", l: "Minelayers destroyed", s: "a", res: 1, max: 12 }
    ],
    rtools: [{ k: "toggle", id: "over", l: "Six turns are done — the game is over" }],
    end: ["After 6 turns."],
    win: ["15+ mines, every minelayer survived: attacker’s major victory.", "15+ mines and some minelayers lost, or 10–14 mines with all surviving: attacker’s minor victory.", "15+ mines but every minelayer lost: draw.", "0–9 mines with all surviving, or 0–14 mines and some lost: defender’s minor victory.", "0–14 mines and every minelayer lost: defender’s major victory."],
    result(st) {
      const m = get(st, "mines", 0), tot = get(st, "ml", 2), lost = Math.min(get(st, "mlx", 0), tot), all = lost >= tot, none = lost === 0;
      const r = m >= 15 ? (none ? ["b", "Attacker’s major victory"] : all ? ["draw", "Draw"] : ["b", "Attacker’s minor victory"]) :
        m >= 10 && none ? ["b", "Attacker’s minor victory"] : all ? ["a", "Defender’s major victory"] : ["a", "Defender’s minor victory"];
      return over([r[0], r[1], m + " mine" + (m === 1 ? "" : "s") + " laid; " + lost + " of " + tot + " minelayers lost."], st);
    },
    info: { bg: "Port Maw’s orbital defences and system fleet held through the whole Gothic War, so Chaos tried to starve it instead. The blockade lasted nearly seven years. Fast raiders — Devastation and Styx cruisers with converted launch bays — darted into the primary biosphere to sow it with orbital mines. One such raid, led by Warmaster Ferrix, ran into Fleet-Admiral Hoshi.", cr: ["Alan Jackson — “The Port Maw Blockade”, winner of the BFG Scenario Competition, " + FO + ", 3 pp.", "Its minelayers live on as the Fleets book’s orbital mines refit (FL p. 23), which still tells of the Unforgivable."] }
  },
  /* ------------------------------------------------------------ THE FATE OF THE ABHORRENCE */
  {
    id: "cl-abhorrence", grp: "cl-fan", name: "The Fate of the Abhorrence", series: "Gothic War · historical refight", trust: "classic",
    why: "A tug of war in low orbit over a drifting Chaos battleship: tow it off your edge for 500 VP, but let it fall into the gravity well and the game ends.", src: "Fanatic Online p. 2", book: "O", suggest: ["Imperial Navy", "Eldar Corsairs"],
    others: "Written as a refight: Imperial Navy against Eldar pirates. Any two fleets can play it as a points match, as long as the Abhorrence is there.",
    sides: { a: { n: "Imperial Navy", f: "Imperial Navy" }, b: { n: "Eldar", f: "Eldar Corsairs" } },
    pitch: "The crippled Chaos flagship Abhorrence drifts towards the planet. An Imperial detachment moves in to tow it to safety — and the Eldar pirates who wiped out the convoy want it too.",
    glance: [["Points", "Set fleets, or an agreed points match"], ["Table", "A low orbit table"], ["Battlezone", "Low orbit only"], ["First turn", "Eldar"], ["Game ends", "Abhorrence towed off or crashed, or a fleet destroyed"]],
    bring: ["A Desolator battleship (the Abhorrence)", "The two fleets below", "A low orbit table (RB p. 116)"],
    forces: {
      a: ["Vengeance grand cruiser Undeniable (Ld 9) and Tyrant cruiser Crown of Steel (Ld 8).", "A Gothic, a Lunar, a Dictator and a Dauntless; 4 Cobras, 3 Swords, 3 Firestorms.", "At the start only the Crown of Steel, the Gothic, the Lunar and the Swords are on the table. The rest arrive on turn 5.", "Or an agreed points match — the Abhorrence is always there."],
      b: ["Shadow class cruiser Shrouded (Ld 9) and an Eclipse.", "6 Hellebores, 3 Aconites, 6 Nightshades, 3 Hemlocks.", "Or an agreed points match."]
    },
    draw: (v, W, H, st, sc) => {
      const D = Math.min(H, 60), top = H - D, di = agN(sc, st, "idep"), de = agN(sc, st, "edep");
      return [
        top > 0 ? R(0, 0, W, top, "n", "Not used: the whole battle is in low orbit") : null,
        R(0, top, di, D, "a", "Imperial: " + di + " cm", { rot: -90 }), R(W - de, top, de, D, "b", "Eldar: " + de + " cm", { rot: 90 }),
        { z: "line", x1: di, y1: H - 45, x2: W - de, y2: H - 45 },
        { z: "text", x: W / 2, y: H - 45 + 5, l: "gravity pull (45 cm)" },
        { z: "mark", x: W / 2, y: top + 7, s: "n", l: "Abhorrence" },
        { z: "edge", e: "b", l: "planet edge" }
      ];
    },
    fit: () => [90, 45],
    mapNote: "A low orbit table 60 cm deep, with the planet along one long edge (RB p. 116). The Abhorrence starts at the far edge, opposite the planet. The short edges and set-up depths are the defaults above — the article does not give them.",
    steps: [
      { t: "The battle is fought entirely on a low orbit table, 45–60 cm deep and 90–135 cm long, one long edge being the planet (RB p. 116). Agreed: {a:lo}." },
      { t: "Place the Abhorrence on the long edge opposite the planet." },
      { t: "Short edges: {a:edge}." },
      { s: "a", t: "Set up the Crown of Steel, the Gothic, the Lunar and the Swords within {a:idep} cm of your short edge. The rest arrive on turn 5 from any of the three edges that are not the planet’s." },
      { s: "b", t: "Set up within {a:edep} cm of your short edge." },
      { s: "b", t: "The Eldar take the first turn." }
    ],
    notes: [OLD + "The Abhorrence starts with four damage points. A Desolator has 12 hits; four damage would leave it uncrippled, while the story calls it crippled. Suggestion: read it as four hits left. Agree before play.",
      "Where the sides set up and which edge is “yours” is not given; the defaults above are our suggestion. Nor does the article say who moves the Abhorrence: suggestion — it does not move by itself, only when towed or pulled by the planet. It can be shot and boarded like any ship; if it is destroyed, nobody scores the 500 VP.",
      "Apart from the 500 VP for towing the Abhorrence away, victory points are counted as normal (RB p. 122).",
      "Low orbit (RB p. 116): ships nearer than 45 cm to the planet edge are pulled towards it at the start of each player’s turn — 5, 8 or 10 cm for a small, medium or large planet. Off the planet edge means destroyed."],
    refs: [["Low orbit", "RB p. 116"], ["Desolator class battleship", "FL p. 267"], ["Critical hits", "RB p. 66–67"], ["Vengeance grand cruiser", "FL p. 58"], ["Eldar Corsair ships", "FL p. 316–328"], ["Victory points", "RB p. 122"]],
    play: [
      { w: "Towing", t: "Only ships in base contact can tow the Abhorrence. A battleship or grand cruiser tows at half speed, one cruiser at a quarter, two cruisers of the same speed at full. Two escorts of the same type tow at half speed; three or four at full. Towing never shortens the distance a ship must move before turning." },
      { w: "Low orbit", t: "All shooting is one column to the right; lances and nova cannon need a 4+ to fire; ships may not fire torpedoes. Ships nearer than 45 cm to the planet edge are pulled towards it at the start of each player’s turn." },
      { w: "The Abhorrence", t: "Port, starboard and prow armament damaged, shields collapsed, engine room and thrusters damaged — none of which can be repaired. Only its dorsal battery (60 cm, firepower 6, left/front/right) still works." },
      { w: "The planet", t: "If the Abhorrence is pulled off the planet edge, the game ends at once." },
      { w: "Scoring", t: "Tow the Abhorrence off your own edge: 500 VP." }
    ],
    fx: T => T === 5 ? [["a", "Reinforcements: the Undeniable and the rest enter from any edge except the planet edge"]] : T >= 6 ? [[null, "After both players’ turns: the Abhorrence fires its dorsal battery at the closest ship in range"]] : [],
    tools: [],
    rtools: [
      { k: "ending", id: "how", l: "How did it end?", rows: [["Towed off the Imperial edge", "a", "+500 VP"], ["Towed off the Eldar edge", "b", "+500 VP"], ["It fell into the planet", "draw", "Count VP"], ["A fleet was destroyed", "draw", "Count VP"]] },
      { k: "num", id: "av", l: "Imperial victory points (ships, not the 500)", s: "a", after: v => v + " VP" },
      { k: "num", id: "bv", l: "Eldar victory points (ships, not the 500)", s: "b", after: v => v + " VP" }
    ],
    end: ["As soon as the Abhorrence falls into the planet or is towed off a table edge.", "Or when one side is destroyed."],
    win: ["Towing the Abhorrence off your own edge is worth 500 VP.", "Otherwise victory points as normal; the higher total wins."],
    result(st) {
      const i = get(st, "how", -1);
      if (i < 0) return [null, "Battle in progress", "Mark how it ended, then enter victory points."];
      const A = num(st, "av") + (i === 0 ? 500 : 0), B = num(st, "bv") + (i === 1 ? 500 : 0);
      return A === B ? ["draw", "Level", A + " – " + B + " VP."] : [A > B ? "a" : "b", wins(A > B ? "The Imperial Navy" : "The Eldar"), "Imperial Navy " + A + " – Eldar " + B + " VP" + (i < 2 ? ", the 500 for the Abhorrence included." : ".")];
    },
    info: { bg: "Admiral Ivan Durke smashed a Chaos raid on the Stranivar system, and its flagship, the Desolator Abhorrence, was left crippled and drifting towards the planet. He sent a detachment to tow it in as a prize — only for Farseer Ithrail’s Eldar pirates, who had just destroyed his convoy, to strike. The tug of war ended when Eldar torpedoes broke the Abhorrence’s warp drive, taking two Imperial cruisers with it.", cr: ["Nicholas Beach — “The Fate of the Abhorrence”, a scenario from the Gothic War, " + FO + ", 2 pp."] }
  },
  /* ------------------------------------------------------------ PLANET FALL */
  {
    id: "cl-planet-fall", grp: "cl-fan", name: "Planet Fall", series: "Fall of Medusa V", trust: "classic",
    why: "Raiders come in from a random edge and must hang in low orbit doing nothing to land supplies — every idle turn is a point.", src: "Fanatic Online p. 2", book: "O", suggest: ["Imperial Navy", "Any attacker"],
    others: "Written for the Imperial blockade of Medusa V. Any fleet can be the raiders, from Eldar to Orks; any fleet can hold the blockade.",
    sides: { a: { n: "Blockade", f: "Imperial Navy" }, b: { n: "Raiders", f: "Any" } },
    pitch: "Medusa V is under blockade and its defenders on the ground are starving for supplies. A raider fleet tries to break through and make planet fall.",
    glance: [["Points", "Imperial 750 + 250 defences · Raiders 1000"], ["Table", "120 × 120 cm"], ["Battlezone", "One planet in the centre, D3 dust clouds"], ["First turn", "Raiders"], ["Game ends", "After 8 turns, or a fleet is destroyed"]],
    bring: ["A planet (Medusa V)", "Up to 250 pts of orbital defences", "D3 dust clouds about 10 cm across"],
    forces: { a: ["Up to 750 pts from a standard Imperial fleet list.", "Plus up to 250 pts of orbital defences."], b: ["Up to 1000 pts from any one fleet list."] },
    draw: (v, W, H, st) => {
      const A = Math.min(W, H, 120), x0 = (W - A) / 2, y0 = (H - A) / 2, cx = W / 2, cy = H / 2, e = get(st, "edge", 0), out = [];
      const nu = (d, l) => d >= 10 ? l : "";
      if (x0 > 0) out.push(R(0, 0, x0, H, "n", nu(x0, "not used"), { rot: -90 }), R(W - x0, 0, x0, H, "n", nu(x0, "not used"), { rot: 90 }));
      if (y0 > 0) out.push(R(x0, 0, A, y0, "n", nu(y0, "not used")), R(x0, H - y0, A, y0, "n", nu(y0, "not used")));
      out.push({ z: "ring", cx, cy, r: 33, s: "a" }, { z: "planet", cx, cy, r: 8, l: "Medusa V" },
        { z: "text", x: cx, y: cy - 38, l: "Imperial: within 25 cm", s: "a" },
        { z: "text", x: x0 + A * .22, y: y0 + A * .88, l: "dust clouds: 30+ cm\nfrom the planet" });
      const ar = { Top: [cx + 25, y0 + 2, cx + 25, y0 + 20], Bottom: [cx + 25, y0 + A - 2, cx + 25, y0 + A - 20], Left: [x0 + 2, cy + 25, x0 + 20, cy + 25], Right: [x0 + A - 2, cy + 25, x0 + A - 20, cy + 25] }[e];
      out.push(ar ? { z: "arrow", x1: ar[0], y1: ar[1], x2: ar[2], y2: ar[3], s: "b", l: "raiders" } : { z: "text", x: cx, y: y0 + A * .06, l: "raiders: random edge (tool)", s: "b" });
      return out;
    },
    fit: () => [120, 120],
    mapNote: "A 120 × 120 cm table with Medusa V in the centre. The Imperial fleet and defences start within 25 cm of the planet; the raiders come on from a random edge. Dust clouds go anywhere at least 30 cm from the planet.",
    steps: [
      { t: "Use a 120 × 120 cm table with one planet, Medusa V, in the centre." },
      { t: "Place D3 dust clouds about 10 cm across anywhere at least 30 cm from the planet (tool below)." },
      { s: "a", t: "Set up the fleet and the orbital defences within 25 cm of Medusa V." },
      { s: "b", t: "No deployment: roll a scatter dice for the edge you come on from (tool below)." },
      { s: "b", t: "The raiders take the first turn and must use it to move onto the table." }
    ],
    stools: [
      { k: "val", id: "dust", l: "Dust clouds: D3", opts: [1, 2, 3], roll: () => Math.ceil(d6() / 2), unit: "" },
      { k: "val", id: "edge", l: "Raiders’ edge (scatter dice)", opts: ["Top", "Right", "Bottom", "Left"], roll: () => ["Top", "Right", "Bottom", "Left"][dn(4) - 1], unit: " edge, as on the map" }
    ],
    notes: [OLD + "“Low orbit” here is the article’s own rule: within 2 cm of the planet on the main table, not the rulebook’s low orbit table.",
      "“Dust clouds” are the rulebook’s gas and dust clouds (RB p. 109).",
      "Victory: the Imperial player scores 1 for every own ship at half its hits or more at the end, plus 1 for every raider crippled or destroyed. The raiders score their planet-fall points plus 1 for every Imperial ship crippled or destroyed. A tie is not covered: call it a draw. Suggestion: orbital defences are not ships and count for neither side.",
      "A ship can spend at most one turn at the planet per hit point on its profile."],
    refs: [["Gas and dust clouds", "RB p. 109"], ["Planets", "RB p. 112"], ["Planetary defences", "FL p. 496–515"]],
    play: [
      { w: "Planet fall", s: "b", t: "A ship that spends a whole turn within 2 cm of Medusa V doing nothing else scores 1 point. A carrier may still launch attack craft that turn — or instead score 1 extra point." },
      { w: "Planet fall", s: "b", t: "Each ship may spend at most one turn at the planet per hit point." }
    ],
    turnMax: () => 8,
    fx: T => T === 1 ? [["b", "Bring the whole fleet on from your entry edge"]] : T === 8 ? [[null, "Last turn: the raiders break off afterwards"]] : [],
    tools: [
      { k: "counter", id: "pf", l: "Raiders’ planet-fall points", s: "b", res: 1 },
      { k: "counter", id: "rk", l: "Imperial score: raider ships crippled or destroyed", s: "a", res: 1 },
      { k: "counter", id: "ik", l: "Raiders’ score: Imperial ships crippled or destroyed", s: "b", res: 1 }
    ],
    rtools: [
      { k: "counter", id: "ok", l: "At the end: Imperial ships at half hits or more", s: "a" },
      { k: "toggle", id: "over", l: "The game is over (8 turns, or a fleet destroyed)" }
    ],
    end: ["After 8 turns: the raiders break off.", "Or when one fleet is destroyed."],
    win: ["Imperial: 1 point per own ship at half hits or more, +1 per raider crippled or destroyed.", "Raiders: planet-fall points, +1 per Imperial ship crippled or destroyed.", "The higher total wins."],
    result(st) {
      const A = get(st, "ok", 0) + get(st, "rk", 0), B = get(st, "pf", 0) + get(st, "ik", 0);
      if (!A && !B) return [null, "Battle in progress", "Count planet-fall points and losses on the Play tab."];
      return over(A === B ? ["draw", "Draw", A + " – " + B + "."] : [A > B ? "a" : "b", wins(A > B ? "The blockade" : "The raiders"), "Blockade " + A + " – raiders " + B + "."], st);
    },
    info: { bg: "As war engulfed Medusa V, the Imperial Navy held a blockade around the planet while Eldar corsairs, Chaos raiders and others tried to slip supplies and troops through to their forces on the surface. Every run that got through could change the war on the ground.", cr: ["Nick Schindler — “Planet Fall”, a Battlefleet Gothic introduction and scenario for the Medusa V campaign, " + FO + ", 2 pp. The author ran it at Warhammer World during the Dark Stars campaign."] }
  },
  /* ------------------------------------------------------------ BATTLE OVER KOTOL */
  {
    id: "cl-kotol", grp: "cl-fan", name: "Battle over Kotol", series: "Ladder campaign · 5 battles", trust: "classic",
    why: "A club campaign in five escalating battles: every battle starts with damaged ships and set handicaps, and defenders collect points for each attack they stop.", src: "Fanatic Online p. 1–4", book: "O", suggest: ["Imperial Navy", "Any attacker"],
    others: "The defenders are always the Imperial Navy; the attackers can be any of its enemies — the story never says who they are. Best with several players on each side.",
    sides: { a: { n: "Defender", f: "Imperial Navy" }, b: { n: "Attacker", f: "Any" } },
    variants: [["b1", "1 · Contact"], ["b2", "2 · Hold the Line"], ["b3", "3 · It Begins"], ["b4", "4 · Counter Attack"], ["b5", "5 · Kotol"]],
    pitch: v => ({
      b1: "The Cobra Avenger spots unknown ships closing on Kotol. The patrol group gathers to meet them, scattered and outgunned.",
      b2: "The patrol is falling back towards the planet, battered. It must hold long enough for reinforcements to assemble.",
      b3: "The reinforcements from Kotol’s battle stations wait by the moon’s airbase as the patrol’s survivors run for their lines.",
      b4: "A second Imperial fleet arrives. Admiral Griffiths and Admiral Terhit turn together and counter-attack.",
      b5: "Everything left falls back on Kotol’s battle stations and orbital platforms for the last stand."
    })[v],
    glance: v => ({
      b1: [["Points", "Attacker 750 · Defender 500"], ["Table", "Not given — we use the long edges"], ["Battlezone", "Deep space, no scenery"], ["First turn", "Roll-off"], ["Game ends", "After 6 turns"]],
      b2: [["Points", "750 each"], ["Table", "Not given — we use the long edges"], ["Battlezone", "Deep space, no scenery"], ["First turn", "Roll-off"], ["Game ends", "After 6 turns"]],
      b3: [["Points", "1000 each"], ["Table", "Not given — we use the long edges"], ["Battlezone", "A moon with an airbase"], ["First turn", "Roll-off"], ["Game ends", "After 6 turns"]],
      b4: [["Points", "Attacker 1000 · Defender 1250"], ["Table", "Not given — we use the long edges"], ["Battlezone", "A moon, its airbase destroyed"], ["First turn", "Roll-off"], ["Game ends", "After 6 turns"]],
      b5: [["Points", "1500 each + defences"], ["Table", "180 × 120, short edge to short edge"], ["Battlezone", "Kotol, 2 battle stations, 6 defences"], ["First turn", "Attacker"], ["Game ends", "After 6 turns"]]
    })[v],
    bring: v => ({ b1: ["Nothing but the fleets"], b2: ["A scatter dice"], b3: ["A moon and an airbase model"], b4: ["A moon"], b5: ["A planet", "2 battle stations", "3 orbital weapons platforms", "3 planetary batteries"] })[v],
    forces: v => ({
      b1: { a: ["Up to 500 pts."], b: ["Up to 750 pts."] },
      b2: { a: ["Up to 750 pts.", "One cruiser (the attacker picks) starts with D3 damage, never enough to cripple it, and another starts crippled with the fewest hits needed. No critical hits are rolled for either."], b: ["Up to 750 pts."] },
      b3: { a: ["Up to 1000 pts.", "Three ships set up in the centre, retreating: cruisers among them start crippled, escorts with no shields and armour 3+. They must reload before using ordnance.", "The airbase on the moon is yours."], b: ["Up to 1000 pts.", "Three cruisers (the defender picks) roll on the critical hits table before the battle. All your ships must reload before using ordnance."] },
      b4: { a: ["Up to 1250 pts.", "Two cruisers (the attacker picks) start crippled.", "Roll a D6 for each ship: on a 5+ it must reload before using ordnance (our reading)."], b: ["Up to 1000 pts.", "Three cruisers (the defender picks) roll on the critical hits table; three cruisers (the defender picks) take D3 damage, no critical rolls. All your ships must reload before using ordnance."] },
      b5: { a: ["Up to 1500 pts, plus 2 battle stations, 3 orbital weapons platforms and 3 planetary batteries.", "Three cruisers (the attacker picks) start with D2 damage, rolling for critical hits as normal. All ships must reload before using ordnance."], b: ["Up to 1500 pts.", "Four cruisers (the defender picks) roll on the critical hits table; one more (the defender picks) starts crippled, no critical rolls. All ships must reload before using ordnance."] }
    })[v],
    draw: (v, W, H) => {
      const sun = { z: "sun", e: "l", l: "sunward: the defender’s left" };
      const att = R(30, 0, W - 60, 30, "b", "Attacker: 30 cm"), def = R(30, H - 30, W - 60, 30, "a", "Defender: 30 cm");
      if (v === "b1") return [att, R(30, H - 30, W - 60, 30, "a", "Defender: 30 cm · ships 15 cm apart"), sun];
      if (v === "b2") return [att, R(30, H - 60, W - 60, 40, "a", "Defender: 20–60 cm from the edge"), sun];
      if (v === "b3") return [att, def, sun, { z: "mark", x: W / 2, y: H / 2, s: "a", l: "3 retreating ships, facing away" },
        { z: "planet", cx: W * .72, cy: H - 46, r: 4, l: "moon + airbase" }];
      if (v === "b4") return [att, def, sun, { z: "planet", cx: W * .3, cy: 46, r: 4, l: "moon (airbase destroyed)" }];
      const cy = H / 2, px = W - 24;
      return [
        R(0, 30, 30, H - 60, "b", "Attacker: 30 cm", { rot: -90 }), R(W - 90, 30, 60, H - 60, "a", "Defender: 30–90 cm from the edge", { rot: 90 }),
        { z: "planet", cx: px, cy, r: 10, l: "" },
        { z: "mark", x: px, y: cy - 22, s: "a", l: "" }, { z: "mark", x: px, y: cy + 22, s: "a", l: "" },
        { z: "mark", x: W - 50, y: cy - 34, s: "a", l: "" }, { z: "mark", x: W - 50, y: cy + 34, s: "a", l: "" }, { z: "mark", x: W - 12, y: cy + 40, s: "a", l: "" },
        { z: "text", x: W - 40, y: 18, l: "Kotol, stations and platforms", s: "a" },
        { z: "sun", e: "b", l: "sunward: the defender’s left" }
      ];
    },
    fit: v => v === "b5" ? [180, 120] : [120, 100],
    mapNote: v => v === "b5" ? "Short edge to short edge on a 180 × 120 cm table. The defender sets up first, between 30 and 90 cm from their edge and 30 cm from the long edges; Kotol, its battle stations and platforms lie nearer the defender’s edge. The sunward edge is on the defender’s left." :
      "The article does not say which edges; only the last battle says short edge to short edge, so we lay the first four across the long edges. Both sides keep 30 cm from the short (flank) edges. The sunward edge is always on the defender’s left." + (v === "b2" ? " The defender’s zone runs from 20 to 60 cm out." : ""),
    steps: [
      { t: "No scenery: deep space with no phenomena at all.", only: ["b1", "b2"] },
      { t: "Place a moon nearer the defender’s edge, with the defender’s airbase on it.", only: ["b3"] },
      { t: "Place a moon nearer the attacker’s edge. Its airbase counts as destroyed.", only: ["b4"] },
      { t: "Place Kotol, two battle stations and three orbital weapons platforms nearer the defender’s edge, around the planet. The three planetary batteries are on the planet.", only: ["b5"] },
      { t: "The sunward edge is on the defender’s left." },
      { s: "b", t: "The defender picks three of your cruisers to roll on the critical hits table (tool below). All your ships must reload before using ordnance.", only: ["b3"] },
      { s: "b", t: "The defender picks three of your cruisers to roll on the critical hits table and three to take D3 damage without critical rolls (tools below). All your ships must reload before using ordnance.", only: ["b4"] },
      { s: "b", t: "The defender picks four of your cruisers to roll on the critical hits table and one to start crippled, no critical rolls (tools below).", only: ["b5"] },
      { s: "a", t: "The attacker picks one of your cruisers to take D3 damage (never enough to cripple it, tool below) and another to start crippled with the fewest hits that cripple it. No critical rolls.", only: ["b2"] },
      { s: "a", t: "The attacker picks two of your cruisers to start crippled. Roll for each ship whether it must reload (tool below).", only: ["b4"] },
      { s: "a", t: "The attacker picks three of your cruisers to take D2 damage, rolling for critical hits as normal (tool below).", only: ["b5"] },
      { t: "Deploy in the normal order: within 30 cm of your edge and at least 30 cm from the flank edges. Defenders must keep each ship or squadron at least 15 cm from the next.", only: ["b1"] },
      { t: "Deploy in the normal order. Attackers: within 30 cm of their edge. Defenders: 20 to 60 cm from their edge. Both at least 30 cm from the flank edges. The attacker then turns up to three ships or squadrons to face a scatter-dice direction (tool below).", only: ["b2"] },
      { t: "Deploy in the normal order within 30 cm of your edge and 30 cm from the flanks — except three defending ships of the defender’s choice, set up in the centre facing away from the enemy.", only: ["b3"] },
      { t: "The attacker sets up everything first, then the defender: within 30 cm of your edge and 30 cm from the flanks.", only: ["b4"] },
      { t: "The defender sets up everything first, 30 to 90 cm from their edge; then the attacker within 30 cm of theirs. Both 30 cm from the long edges.", only: ["b5"] },
      { t: "Roll a D6 each; the higher roll goes first.", not: ["b5"] },
      { s: "b", t: "The attacker goes first.", only: ["b5"] }
    ],
    stools: [
      { k: "shiproll", id: "face", l: "Turned by the attacker", sub: "A scatter dice for each of up to three defending ships or squadrons the attacker picks", cl: "Ships or squadrons", n0: 3, il: i => "Pick " + (i + 1), roll: () => dn(12), btn: n => "Roll " + n + " directions", out: d => "turn to face " + d + " o’clock (12 = straight at the attacker’s edge)", only: ["b2"] },
      { k: "val", id: "d3", l: "One defending cruiser: D3 damage", opts: [1, 2, 3], roll: () => Math.ceil(d6() / 2), unit: " damage — capped below crippling, no critical rolls", only: ["b2"] },
      critRoll("cr3", 3, ["b3"], "Three attacking cruisers, picked by the defender"),
      critRoll("cr4", 3, ["b4"], "Three attacking cruisers, picked by the defender"),
      { k: "shiproll", id: "dm4", l: "D3 damage before the battle", sub: "Three attacking cruisers, picked by the defender · no critical rolls", cl: "Attacking cruisers", n0: 3, il: i => "Cruiser " + (i + 1), roll: () => Math.ceil(d6() / 2), btn: n => "Roll D3 for " + n + " cruisers", out: d => d + " damage", only: ["b4"] },
      { k: "shiproll", id: "rl4", l: "Defending ships: loaded or not?", sub: "D6 for each defending ship · 5+ must reload before using ordnance", cl: "Defending ships", n0: 6, il: i => "Ship " + (i + 1), out: d => d >= 5 ? "must reload first" : "ready to launch", only: ["b4"] },
      critRoll("cr5", 4, ["b5"], "Four attacking cruisers, picked by the defender"),
      { k: "shiproll", id: "dm5", l: "D2 damage before the battle", sub: "Three defending cruisers, picked by the attacker · a 6 on each damage point’s D6 is a critical hit", cl: "Defending cruisers", n0: 3, il: i => "Cruiser " + (i + 1), roll: () => { const n = d6() <= 3 ? 1 : 2, c = []; for (let k = 0; k < n; k++) if (d6() === 6) c.push(CRIT[d6() + d6()]); return n + " damage" + (c.length ? " · critical: " + c.join(", ") : " · no critical"); }, btn: n => "Roll for " + n + " cruisers", out: () => "apply it before the battle", only: ["b5"] }
    ],
    notes: v => [OLD + "The article’s title says Kotol, its text Kolot — the same planet.",
      "Every battle is decided on victory points (RB p. 122). A draw is not covered. Suggestion: the attacker has not won, so must try the same battle again; nobody scores defence points.",
      "Pre-battle critical hits use the critical hits table (RB p. 66–67), including any extra damage it gives."].concat(
      v === "b3" ? ["“Armour value 3+ if an escort”: we read it as the retreating escorts’ armour dropping to 3+."] :
      v === "b4" ? ["“Defending ships must reload ordnance on a 5+”: we read it as a D6 per ship before the battle, on 5+ it must reload first. Agree before play."] :
      v === "b5" ? ["The defences are not priced: we read them as free, on top of the 1500 pts.", "Profiles of the battle stations, platforms and batteries are on the Play tab."] : []),
    refs: [["Victory points", "RB p. 122"], ["Critical hits", "RB p. 66–67"], ["Special orders (Reload Ordnance)", "RB p. 46–47"], ["Planetary defences (general rules)", "RB p. 100–101"]],
    play: [
      { w: "Kotol’s defences", t: "Airbase: defence, armour 6+, 1 shield, 2 hits, 2 turrets, hangars for 8 squadrons of fighters or bombers. Only the defender uses it.", only: ["b3"] },
      { w: "Kotol’s defences", t: "Battle stations (×2): armour 5+, 2 shields, 8 hits, 4 turrets, batteries 10 and lances 2 at 45 cm all round, 4 squadrons of fighters or bombers. Orbital weapons platforms (×3): armour 5+, 1 shield, 2 hits, 2 turrets, batteries 5 at 45 cm all round. Planetary batteries (×3): the same, but 60 cm range.", only: ["b5"] }
    ],
    turnMax: () => 6,
    fx: T => T === 6 ? [[null, "Last turn: count victory points"]] : [],
    tools: [],
    rtools: [
      { k: "num", id: "av", l: "Defender’s victory points", s: "a", after: v => v + " VP" },
      { k: "num", id: "bv", l: "Attacker’s victory points", s: "b", after: v => v + " VP" },
      { k: "html", html: KOTOL_CAMPAIGN }
    ],
    end: ["After 6 turns."],
    win: v => ["Victory points decide.", "Defender wins: " + KDP[v] + " defence points.", v === "b5" ? "Attacker wins: the campaign — the first attacker to win here is its attacking winner." : "Attacker wins: move on to battle " + (KV.indexOf(v) + 2) + ", " + KNAME[KV[KV.indexOf(v) + 1]] + "."],
    result(st, v) {
      const A = num(st, "av"), B = num(st, "bv"), i = KV.indexOf(v);
      if (!A && !B) return [null, "Count victory points", "Enter both totals below."];
      if (A === B) return ["draw", "Level", "Not covered. Suggestion: the attacker fights " + KNAME[v] + " again; no defence points."];
      if (A > B) return ["a", "Defender wins", "+" + KDP[v] + " defence points. The attacker must challenge someone new to " + KNAME[v] + "."];
      return ["b", v === "b5" ? "Attacker wins the campaign" : "Attacker wins", v === "b5" ? "Defence points freeze; the defender with the most of them wins the defending side." : "Move on to battle " + (i + 2) + ": " + KNAME[KV[i + 1]] + "."];
    },
    info: { bg: "An enemy fleet falls on Kotol, a loyal world whose only moon holds a deep-dug airbase and whose orbit is guarded by two great battle stations. Captain Kabar’s Cobra Avenger sees them first. Five battles later the stations lie in ruin, the planet is encircled, and the last Imperial ships — the Avenger among them — run for the warp.", cr: ["Wesley Vickers — “Battle over Kotol”, a narrative campaign first run at Games Workshop Stoke, " + FO + ", 5 pp."] }
  }
  ]);
})();
