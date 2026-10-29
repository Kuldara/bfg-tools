/* Classic scenarios: Nate Montes's two linked mini-campaigns.
   The War of Belis Corona (Battlefleet Gothic Magazine 16): The Crown Belt, Bairsten Prime,
   Laurentix, Belis Corona — not the same battles as the rulebook's 13th Black Crusade.
   The Damocles Gulf Crusade (BFG Magazine 19 and Fanatic Magazine 1): Cruiser Crash at
   Hydrass, Evacuation of Sy'l'kell, Pursuit at Resvar Six, Assault on Pra'yen.
   Written for the original 1999 rules and Armada; Remastered places are given in the notes.
   Summarised in our own words; every scenario is hand-made (see docs/history/scenarios/LUEMINUT.md, in Finnish). */
(function () {
  const BM = n => "Battlefleet Gothic Magazine " + n + " (Fanatic Press)";
  const OLD = "Written for the original 1999 rules and Armada. ";
  const BELIS = "Nate Montes — “The War of Belis Corona”, an Eye of Terror mini-campaign in " + BM(16) + ", p. 18–31 (PDF p. 20–33).";
  const DAMO = "Nate Montes — “The Damocles Gulf Crusade”: scenarios 1–2 in " + BM(19) + " (p. 10–13), scenarios 3–4 in Fanatic Magazine issue 1 (Games Workshop’s Fanatic, p. 26–29).";
  const link = (id, text) => "<a href='#/s/" + id + "/setup'>" + esc(text) + " ›</a>";
  const vp2 = (st, a, b, an, bn) => {
    const A = num(st, a), B = num(st, b);
    if (!A && !B) return [null, "Count victory points", "Enter both totals below."];
    return A === B ? ["draw", "Level", A + " – " + B + " VP."] : [A > B ? "a" : "b", wins(A > B ? an : bn), an + " " + A + " – " + bn + " " + B + " VP."];
  };
  /* Planetary Assault (RB p. 136–137) result: assault points + VP adjustments */
  const PA_RT = (as, ds) => [
    { k: "num", id: "avp", l: "Attacker’s victory points", s: as, after: v => "+" + Math.floor(v / 500) + " assault points" },
    { k: "num", id: "dvp", l: "Defender’s victory points", s: ds, after: v => "−" + Math.ceil(v / 500) + " assault points" }
  ];
  const paResult = (st, as, ds) => {
    const t = get(st, "ap", 0) + Math.floor(num(st, "avp") / 500) - Math.ceil(num(st, "dvp") / 500);
    const r = t >= 10 ? [as, "Attacker’s victory"] : t >= 6 ? [as, "Attacker’s marginal win"] : t >= 2 ? [ds, "Defender’s marginal win"] : [ds, "Defender’s victory"];
    return [r[0], r[1], "Adjusted total: " + t + " assault points."];
  };
  const PA_WIN = ["As Planetary Assault: assault points, +1 per full 500 VP the attacker scored, −1 per 500 VP (rounding up) the defender scored.", "0–1 defender’s victory · 2–5 defender’s marginal win · 6–9 attacker’s marginal win · 10+ attacker’s victory."];
  /* reserve contact markers, Bairsten Prime and Laurentix */
  const reserveNeed = (T, first) => T < first ? "No rolls yet." : "Each unrevealed marker appears on a D6 of <b>" + Math.max(1, 6 - (T - first)) + "+</b> this turn (+2 with enemy ships or ordnance within 30 cm).";

  const BELIS_CAMPAIGN = "<h3>Belis Corona campaign rules</h3><ul class='plain'>" + [
    "Both sides start with 2000-pt campaign fleet lists. Chaos gets the repair points of the lost Phonosar (hive) and Ankeny (mining) systems; the Imperium those of Belis Corona (mining and fleet bases).",
    "After every battle each player rolls one extra Appeal.",
    "No refits are rolled during the campaign, but up to 10% of the starting list (and any reinforcement gained on an Appeal of 5+) may take one random refit at +10% of its cost. No ship takes more than one; no ship starts with crew skills.",
    "Imperial Appeal “Other” (5+): instead of the normal table, petition the Space Marines — D6: 3–4 a strike cruiser, 5 two strike cruisers, 6 a battle barge.",
    "Chaos Appeal “Other” (5+): petition the Dark Eldar — on 3+, up to D6×75 pts. Before each Chaos movement phase roll 2D6: on 11–12 they betray Chaos, take a turn at once as the Imperial player directs, then disengage for free and leave the list.",
    "Either side, Appeal 5+: Demiurg — D6: 2–4 a Bastion, 5 two Bastions, 6 a Stronghold (+1 repair point after every battle while on the list). Space Marines and Demiurg never serve together.",
    "Every reinforcement is paid for from the fleet allowance."].map(x => "<li>" + fmt(x) + "</li>").join("") + "</ul>";

  const JALLAQUE = { w: "Admiral Orin Jallaque (200 pts)", s: "a", t: "Aboard the Retribution Blade of Woe: Ld 10, two re-rolls. +1 to the D6 for the first turn. His ship has the Disciplined Crew skill and an Iron Hands company aboard (+1 in boarding actions)." };

  addScenarios([
  /* ------------------------------------------------------------ BELIS CORONA 1 THE CROWN BELT */
  {
    id: "cl-belis-1", grp: "cl-mag", name: "The Crown Belt", series: "War of Belis Corona · Battle 1", trust: "classic",
    why: "Raid on a lonely monitoring station beside a radioactive asteroid belt that can go critical when torpedoes hit it.", src: "BFG Magazine 16 p. 21–22", book: "O", suggest: ["Chaos", "Imperial Navy"],
    others: "Written for a Chaos raid on an Imperial station; any attacker and defender can play it.",
    sides: { a: { n: "Defender", f: "Imperial Navy" }, b: { n: "Attacker", f: "Chaos" } },
    pitch: "The only gap in Belis Corona’s sensor net lies behind the Crown Belt, watched by one orbital dock. A Chaos raiding force is coming to close its eyes.",
    glance: [["Points", "Equal; the dock costs the defender 90"], ["Table", "Not given — use your table"], ["Battlezone", "Outer reaches, the radioactive Crown Belt"], ["First turn", "Roll-off"], ["Game ends", "A fleet is gone, or the dock is destroyed"]],
    bring: ["An orbital dock", "An asteroid field D6×5 cm wide", "Planetary defences (optional)"],
    forces: {
      a: ["Equal points, 90 of them for the orbital dock Adelphia.", "Up to D6×30 pts of the fleet may be planetary defences within 15 cm of the dock.", "Each side’s fleet commander may fight in Battle 1 or Battle 2, not both."],
      b: ["Equal points."]
    },
    fixed: {
      a: ["Flotilla Malleus: Dictator Lourdes Divina (Ld 7); Dauntless Macedon (Ld 9); Endeavour Just Cause (Ld 6, squadroned with Lourdes Divina); Ghost Wing, three Swords (Ld 8).", "Orbital dock Adelphia, an orbital weapons battery platform and two minefields."],
      b: ["Acheron heavy cruiser Chaos Eternus (Ld 8); Devastations Blood Scythe (Ld 7, Lord of Tzeentch) and Eternal Suffering (Ld 7, squadroned); Blood Singers raider pack, three Infidels and an Iconoclast (Ld 6)."]
    },
    draw: (v, W, H) => {
      const fx = W * 2 / 3, fw = 15;
      return [
        R(0, 0, 15, H, "b", "Attacker: 15 cm", { rot: -90 }), R(W - 15, 0, 15, H, "a", "Defender: 15 cm", { rot: 90 }),
        { z: "hatch", x: fx - fw / 2, y: 0, w: fw, h: H / 2, l: "Crown Belt", free: "x" }, { z: "line", x1: fx, y1: 0, x2: fx, y2: H / 2 },
        { z: "mark", x: fx, y: Math.min(H - 8, H / 2 + 20), s: "a", l: "", free: "y" }, { z: "text", x: fx - 6 - textLen("orbital dock", W) / 2, y: Math.min(H - 8, H / 2 + 20), l: "orbital dock", s: "a" },
        { z: "dim", x1: fx + 6, y1: H / 2, x2: fx + 6, y2: Math.min(H, H / 2 + 30), l: "up to 30 cm" },
        { z: "sun", e: "r", l: "sunward (defender’s) edge" }
      ];
    },
    fit: () => [120, 80],
    mapNote: "As the magazine’s map: the Crown Belt lies a third of the way along the table from the defender’s (sunward) edge and stretches halfway across the table; the dock sits the same distance from that edge, within 30 cm of the belt.",
    steps: [
      { t: "Place the Crown Belt: an asteroid field D6×5 cm wide (tool below), a third of the way along the table from one short edge, reaching halfway across. That short edge is sunward and the defender’s." },
      { t: "Roll outer reaches phenomena as normal, none within 45 cm of the belt; ignore extra asteroid fields. A planet result may become one battered moon of Malusoir." },
      { s: "a", t: "Place the orbital dock the same distance from your edge as the belt, within 30 cm of it; any planetary defences within 15 cm of the dock." },
      { t: "Both deploy within 15 cm of their own short edge." },
      { t: "Roll off. The higher roll chooses to go first or second." }
    ],
    stools: [{ k: "val", id: "bw", l: "Crown Belt width: D6×5 cm", opts: [5, 10, 15, 20, 25, 30], roll: () => 5 * d6(), unit: " cm" }],
    notes: [OLD + "Orbital dock and planetary defences: FL p. 496–515. Critical hits: RB p. 66–67 (the magazine points to old p. 36).", "The campaign rules (appeals, reinforcements, refits) are under Check on the Result tab."],
    refs: [["Orbital dock, defences", "FL p. 496–515"], ["Asteroid fields", "RB p. 110"], ["Critical hits", "RB p. 66–67"]],
    play: [
      { w: "The Crown Belt", t: "Radioactive heavy metals: ships and squadrons crossing it are at −1 Leadership; attack craft markers crossing it are lost on 5+ instead of 6." },
      { w: "Going critical", t: "Whenever torpedoes strike the belt, attack craft markers in it are removed, or ships crossing it take hits, roll a D6: on a 6 every ordnance marker within 3D6 cm is removed and every ship within that distance takes D3 fire criticals." },
      { w: "The dock adrift", s: "a", t: "Adelphia orbits the sun, not a planet: an “orbit lost” critical makes it drift D6 cm towards the belt each turn until repaired." }
    ],
    tools: [
      { k: "roll", id: "crit", l: "The belt is struck", rows: () => [[1, 5, "Nothing more happens"], [6, 6, "It goes critical: 3D6 cm blast — ordnance removed, D3 fire criticals on every ship in range"]] },
      { k: "val", id: "rad", l: "Blast radius: 3D6 cm", opts: [], roll: () => d6() + d6() + d6(), unit: " cm" },
      { k: "toggle", id: "dock", l: "The orbital dock has been destroyed", s: "b" }
    ],
    rtools: [
      { k: "ending", id: "how", l: "How did it end?", rows: [["The dock was destroyed", "b"], ["The attackers were driven off, dock intact", "a"], ["Neither — count victory points", "draw", "Count VP"]] },
      { k: "num", id: "av", l: "Defender: victory points", s: "a", after: v => v + " VP" }, { k: "num", id: "bv", l: "Attacker: victory points", s: "b", after: v => v + " VP" },
      { k: "html", html: BELIS_CAMPAIGN + "<p>Next: " + link("cl-belis-2", "Bairsten Prime") + ".</p>" }
    ],
    end: ["When one fleet is destroyed or disengages, or the orbital dock is destroyed."],
    win: ["Both score victory points as normal.", "The attacker wins by destroying the dock; the defender wins by driving the attackers off with the dock intact (crippled is fine)."],
    result(st, v, S) { const i = get(st, "how", -1); return i === 0 || i === 1 ? endingResult(st, S, "how") : i === 2 ? vp2(st, "av", "bv", "The defender", "The attacker") : [null, "Battle in progress", "Mark how it ended."]; },
    info: { bg: "As the 13th Black Crusade fell on Cadia, Belis Corona braced for attack. Its only sensor gap lay behind the Crown Belt, watched by the station Adelphia. Captain Abearsen’s Flotilla Malleus raced there while Admiral Benadorn took the rest of the fleet to the mining world Bairsten Prime — and a Chaos raiding force was already closing on the station.", cr: [BELIS] }
  },
  /* ------------------------------------------------------------ BELIS CORONA 2 BAIRSTEN PRIME */
  {
    id: "cl-belis-2", grp: "cl-mag", name: "Bairsten Prime", series: "War of Belis Corona · Battle 2", trust: "classic",
    why: "A planetary assault where most of the defenders are still strung out on the way — contact markers that arrive turn by turn.", src: "BFG Magazine 16 p. 23–24", book: "O", suggest: ["Chaos", "Imperial Navy"],
    others: "Any attacker against any defender; the arriving reserve is the heart of it.",
    sides: { a: { n: "Defender", f: "Imperial Navy" }, b: { n: "Attacker", f: "Chaos" } },
    pitch: "Admiral Benadorn has the bigger fleet, but it is stretched out across the system. Only his flagship and a covering force are in place when the invasion fleet arrives.",
    glance: [["Points", "Attacker: agreed · Defender: +50%"], ["Table", "Not given — use your table"], ["Battlezone", "Outer reaches, medium planet"], ["First turn", "Roll-off"], ["Game ends", "A fleet is gone, or 10 assault points"]],
    bring: ["A medium planet", "Low orbit table (RB p. 116)", "At least four numbered contact markers", "Transports for the attacker"],
    forces: {
      a: ["Up to 50% more than the agreed points. No ships that fought in Battle 1 (reinforcements won on Appeals may).", "Plus D6×10 pts of planetary defences per 500 pts (or part) of the attacker.", "A third of the fleet starts on the table; the rest waits in at least four divisions on contact markers (escort squadrons stay whole)."],
      b: ["The agreed points. No ships that fought in Battle 1.", "Two free transports or one free heavy transport per 500 pts; for every heavy transport you must take two transports before another heavy one. Transport variants cost points."]
    },
    draw: (v, W, H) => [
      R(30, 30, W - 60, H - 60, "a", "", { dash: 1 }), { z: "text", x: W / 2 - 10, y: 44, l: "defenders’ third: as Planetary Assault", s: "a" },
      { z: "planet", cx: W - 45, cy: H / 2 + 2, r: 8, l: "", free: 1 },
      R(0, 0, 15, H, "b", "Attacker: 15 cm", { rot: -90 }),
      R(W - 15, 0, 15, 5, "a", "", { free: "y" }), R(W - 15, H - 5, 15, 5, "a", "", { free: "y" }),
      { z: "text", x: W - 52, y: 21, l: "reserve markers: on the\nlong edge, within 15 cm\nof the short edge", s: "a" }, { z: "text", x: W - 52, y: H - 21, l: "reserve markers: on the\nlong edge, within 15 cm\nof the short edge", s: "a" },
      { z: "edge", e: "r", s: "a", dash: 1, l: "Defender’s reserve edge" }
    ],
    fit: () => [120, 80],
    mapNote: "Planetary Assault layout. The defenders’ reserve markers start on either long edge, within 15 cm of the short edge nearest the planet, and creep towards the attackers.",
    steps: [
      { t: "Place a medium planet as in Planetary Assault (roll for a moon if you like) and roll outer reaches phenomena, ignoring another planet." },
      { s: "a", t: "Set up a third of your fleet with the normal Planetary Assault rules (patrols and standby)." },
      { s: "b", t: "Deploy within 15 cm of the short edge furthest from the planet." },
      { s: "a", t: "Split the rest into at least four numbered contact markers and place them on either long edge, within 15 cm of the short edge nearest the planet." },
      { t: "Set up the low orbit table. Roll off; the higher roll chooses to go first or second." }
    ],
    notes: [OLD + "Planetary Assault: RB p. 136–137 (old p. 76).", "The magazine’s playtest found a “ruse”: the attacker can disengage the whole fleet early to save it for the next battle. That is allowed — and Laurentix follows directly."],
    refs: [["Planetary Assault", "RB p. 136–137"], ["Low orbit table", "RB p. 116"], ["Planetary defences", "FL p. 496–"]],
    play: [
      { w: "Defender’s turn, after moving", s: "a", t: "Before shooting, you may slide each contact marker along its long edge towards the enemy, up to the speed of its slowest ship." },
      { w: "From your turn 2, after moving", s: "a", t: "Roll a D6 for each marker: on a 6 it is replaced by its ships, placed along the edge within 10 cm of it. The roll needed drops by 1 every turn after; +2 if enemy ships or ordnance are within 30 cm, −1 if celestial phenomena are within 15 cm." },
      { w: "Arriving ships", s: "a", t: "They may face any way but take no special orders that turn except Brace for Impact. Enemy ships cannot shoot at unrevealed markers." },
      { w: "Withdrawing", s: "a", t: "In your movement phase you may remove any unrevealed marker that has no enemy ship or ordnance within 30 cm." },
      { w: "Landing troops", s: "b", t: "As Planetary Assault: on the low orbit table, 1 assault point per capital ship and 2 per transport for each turn within 30 cm of the planet edge." }
    ],
    fx: T => [["a", T < 2 ? "Reserve markers may creep, not yet arrive" : "Reserve markers arrive on " + Math.max(1, 6 - (T - 2)) + "+ (±modifiers)"]],
    tools: [
      { k: "info", html: st => "<h3>Reserve markers</h3><p class='calc'>" + reserveNeed(st.turn, 2) + " −1 with phenomena within 15 cm.</p>" },
      { k: "counter", id: "ap", l: "Assault points", s: "b", goal: 10, res: 1 }
    ],
    rtools: PA_RT("b", "a").concat([{ k: "html", html: BELIS_CAMPAIGN + "<p>Next: " + link("cl-belis-3", "Laurentix") + ". Ships that disengaged before turn 4 or never arrived here can join it.</p>" }]),
    end: ["When one fleet is destroyed or disengages, or the attacker has 10 or more assault points."],
    win: PA_WIN,
    provisional: PA_PROV,
    result(st) { return paResult(st, "b", "a"); },
    info: { bg: "Admiral Benadorn took Flotilla Incudis to guard the duralium mines of distant Bairsten Prime — and his hunch seemed right when an invasion fleet appeared. But his ships were strung out over hundreds of thousands of kilometres, and only the flagship and a covering force were in position.", cr: [BELIS] }
  },
  /* ------------------------------------------------------------ BELIS CORONA 3 LAURENTIX */
  {
    id: "cl-belis-3", grp: "cl-mag", name: "Laurentix", series: "War of Belis Corona · Battle 3", trust: "classic",
    why: "The real target: a planetary assault where both sides’ ships from the last battle rush in, still damaged, on contact markers.", src: "BFG Magazine 16 p. 26", book: "O", suggest: ["Chaos", "Imperial Navy"],
    others: "Any attacker and defender. Without the campaign, both sides can still keep some ships back as arriving divisions of up to 500 pts.",
    sides: { a: { n: "Defender", f: "Imperial Navy" }, b: { n: "Attacker", f: "Chaos" } },
    pitch: "Bairsten Prime was a ruse. Laurentix is under attack, and every ship that can still fly is racing back across the system.",
    glance: [["Points", "Normal fleets + late arrivals from Battle 2"], ["Table", "Not given — use your table"], ["Battlezone", "Primary biosphere, medium planet"], ["First turn", "Roll-off"], ["Game ends", "A fleet is gone, or 10 assault points"]],
    bring: ["A medium planet", "Low orbit table (RB p. 116)", "Numbered contact markers", "Transports for the attacker"],
    forces: {
      a: ["Your fleet as normal, without ships used in Battle 2 (Battle 1 ships and Appeal reinforcements may play).", "Plus D6×10 pts of planetary defences per 500 pts (or part) of the attacker."],
      b: ["Your fleet as normal, with the same Battle 2 restriction. Two free transports or one heavy per 500 pts, as before.", "A Chaos commander who fought in Battle 2 is absent at the start."],
    },
    fixed: {
      a: ["Flotilla Malleus: Victory battleship Warspite (Ld 6); Ghost Wing; Armageddon battlecruiser Allegiance (Ld 8, power ram); Space Marine strike cruisers Unyielding (Ld 9) and Victorious (Ld 7) in squadron.", "Reserve: Torchbearers (four Cobras and two Swords, Ld 8); Endeavour Henderson (Ld 6).", "Defences: two defence monitors, an orbital weapons battery platform, two minefields."],
      b: ["Invasion fleet: the Desecrator Treacherous (Ld 6/8, Lord of Tzeentch); Carnage Raining Death; Devastation Deathbane; Acheron Chaos Eternus; Hades Injustice; Skull Breakers (four Idolators, two Iconoclasts).", "Reserve: Desolator Wage of Sin; Retaliator Insidious Horror; Slaughters Killfrenzy and Heathen Promise; Devastation Dangerous Wind; Murder Revolution; Destructors (six Infidels)."]
    },
    draw: (v, W, H) => [
      R(30, 30, W - 60, H - 60, "a", "", { dash: 1 }), { z: "text", x: W / 2 - 10, y: 44, l: "as Planetary Assault", s: "a" },
      { z: "planet", cx: W - 45, cy: H / 2 + 2, r: 8, l: "", free: 1 },
      R(0, 0, 15, H, "b", "Attacker: 15 cm", { rot: -90 }),
      R(W - 15, 0, 15, 5, "n", "", { free: "y" }), R(W - 15, H - 5, 15, 5, "n", "", { free: "y" }),
      { z: "text", x: W - 55, y: 21, l: "late-arrival markers: on\nthe long edge, within 15 cm\nof the short edge", s: "n" }, { z: "text", x: W - 55, y: H - 21, l: "late-arrival markers: on\nthe long edge, within 15 cm\nof the short edge", s: "n" }
    ],
    fit: () => [120, 80],
    mapNote: "Planetary Assault layout. Both sides’ late-arrival markers start on either long edge within 15 cm of the short edge nearest the planet.",
    steps: [
      { t: "Place a medium planet as in Planetary Assault and roll primary biosphere phenomena, ignoring another planet." },
      { t: "Both set up as in Planetary Assault (RB p. 136)." },
      { t: "Then both sides take their ships (not transports) from Battle 2 that disengaged before turn 4 or never arrived, and split them into numbered contact markers of up to 500 pts each (escort squadrons stay whole). Their hits from Battle 2 are not repaired; their criticals are." },
      { t: "Place the markers on either long edge within 15 cm of the short edge nearest the planet. Set up the low orbit table." },
      { t: "Roll off. The higher roll chooses to go first or second." }
    ],
    notes: [OLD + "Planetary Assault: RB p. 136–137.", "The marker rules are written for the defender. Suggestion: the attacker’s late arrivals follow the same rules in the attacker’s own turn."],
    refs: [["Planetary Assault", "RB p. 136–137"], ["Low orbit table", "RB p. 116"]],
    play: [
      { w: "Your turn, after moving", t: "Before shooting, slide your markers along the long edge towards the enemy, up to the slowest ship’s speed." },
      { w: "From your turn 2, after moving", t: "D6 per marker: on a 6 its ships appear along the edge within 10 cm of it. The roll needed drops by 1 every turn after; +2 if enemy ships or ordnance are within 30 cm." },
      { w: "Arriving ships", t: "No special orders that turn except Brace for Impact. Unrevealed markers cannot be shot at." },
      { w: "Landing troops", s: "b", t: "As Planetary Assault: 1 assault point per capital ship, 2 per transport, for each turn within 30 cm of the planet edge on the low orbit table." }
    ],
    fx: T => [[null, T < 2 ? "Markers may creep, not yet arrive" : "Markers arrive on " + Math.max(1, 6 - (T - 2)) + "+ (+2 with enemies near)"]],
    tools: [
      { k: "info", html: st => "<h3>Late-arrival markers</h3><p class='calc'>" + reserveNeed(st.turn, 2) + "</p>" },
      { k: "counter", id: "ap", l: "Assault points", s: "b", goal: 10, res: 1 }
    ],
    rtools: PA_RT("b", "a").concat([{ k: "html", html: BELIS_CAMPAIGN + "<p>Next: the finale, " + link("cl-belis-4", "Belis Corona") + ".</p>" }]),
    end: ["When one fleet is destroyed or disengages, or the attacker has 10 or more assault points."],
    win: PA_WIN,
    provisional: PA_PROV,
    result(st) { return paResult(st, "b", "a"); },
    info: { bg: "While Benadorn chased the invasion at Bairsten Prime, the real blow fell on Laurentix, a mining world already lost to cultist riots. Captain Sorensen of the Warspite held its orbit with what he had, and the ships racing back from the other side of the system arrived one group at a time.", cr: [BELIS] }
  },
  /* ------------------------------------------------------------ BELIS CORONA 4 BELIS CORONA */
  {
    id: "cl-belis-4", grp: "cl-mag", name: "Belis Corona", series: "War of Belis Corona · Battle 4", trust: "classic",
    why: "The finale: everything both sides have left, a Ramilies star fort over the shipyards — and a Chaos space hulk brought to break it.", src: "BFG Magazine 16 p. 29", book: "O", suggest: ["Chaos", "Imperial Navy"],
    others: "Any attacker and defender. The star fort and space hulk are optional, but they go together.",
    sides: { a: { n: "Defender", f: "Imperial Navy" }, b: { n: "Attacker", f: "Chaos" } },
    pitch: "“There is nothing in space that can take a Ramilies.” Twelve capital ships are escorting the one thing that can.",
    glance: [["Points", "Agreed — ideally every ship on both lists"], ["Table", "Not given — use your table"], ["Battlezone", "Primary biosphere, planet on a long edge"], ["First turn", "Roll-off"], ["Game ends", "A fleet is gone, or 10 assault points"]],
    bring: ["A medium planet", "Low orbit table (RB p. 116)", "A Ramilies star fort and a Chaos space hulk (optional)", "Transports for the attacker"],
    forces: {
      a: ["The agreed points — ideally your whole fleet list.", "You may field a Ramilies star fort.", "Plus D6×10 pts of planetary defences per 500 pts (or part) of the attacker, and 3D6 more for the shipyards (see note)."],
      b: ["The agreed points. If the defender has a Ramilies, you may bring a space hulk and up to 200 pts of free reinforcements (Leadership −1, never below 6).", "Two free transports or one heavy per 500 pts of the defender’s fleet (the Ramilies included)."]
    },
    draw: (v, W, H) => [
      R(Math.max(0, W / 2 - 30), 0, Math.min(60, W), 30, "a", ""), { z: "text", x: W / 2, y: 22, l: "Defender\n60 × 30 cm", s: "a" },
      { z: "planet", cx: W / 2, cy: 0, r: 10, l: "" },
      R(0, H - 15, W, 15, "b", "Attacker: within 15 cm"),
      { z: "text", x: W / 2, y: H - 26, l: "space hulk: 90 cm+ from the star fort", s: "b" }
    ],
    fit: () => [70, 60],
    mapNote: "The planet touches the centre of the defender’s long edge; the defender deploys in a 60 × 30 cm area centred on it. The attacker spreads out within 15 cm of the opposite long edge.",
    steps: [
      { t: "Place a medium planet touching the centre of one long edge (the defender’s). Roll the sunward edge and primary biosphere phenomena, ignoring another planet." },
      { s: "a", t: "Deploy in an area 30 cm deep and 60 cm wide, centred on the planet. A Ramilies goes anywhere in it; other defences anywhere as normal." },
      { s: "b", t: "Deploy anywhere within 15 cm of the opposite long edge, facing any way. A space hulk must be at least 90 cm from the star fort, and may not enter low orbit." },
      { t: "Set up the low orbit table. Roll off; the higher roll chooses to go first or second." }
    ],
    notes: [OLD + "Planetary Assault: RB p. 136–137. Ramilies star fort: FL p. 500–. Chaos Space Hulk: FL p. 288.",
      "“An additional 3D6 of planetary defences” is read as 3D6×10 more points of them, in line with the other rolls; agree before play.",
      "Only a space hulk may try to board a Ramilies."],
    refs: [["Planetary Assault", "RB p. 136–137"], ["Ramilies star fort", "FL p. 500–"], ["Chaos Space Hulk", "FL p. 286–287"], ["Low orbit table", "RB p. 116"]],
    play: [
      { w: "Landing troops", s: "b", t: "As Planetary Assault: 1 assault point per capital ship, 2 per transport, for each turn within 30 cm of the planet edge on the low orbit table. The space hulk may not enter low orbit." },
      { w: "Star fort and hulk", t: "Destroying the Ramilies earns the attacker +1 (boarding it, +2 — only the hulk can try). The defender earns +1 renown for destroying the hulk, +2 for beating it in a boarding action, including one it starts against the star fort." }
    ],
    tools: [{ k: "counter", id: "ap", l: "Assault points", s: "b", goal: 10, res: 1 }, { k: "toggle", id: "ram", l: "The Ramilies has been destroyed or boarded", s: "b" }, { k: "toggle", id: "hulk", l: "The space hulk has been destroyed or beaten in a boarding action", s: "a" }],
    rtools: PA_RT("b", "a").concat([{ k: "html", html: BELIS_CAMPAIGN }]),
    end: ["When one fleet is destroyed or disengages, or the attacker has 10 or more assault points."],
    win: PA_WIN.concat(["Victory points also count normally, with the star fort and space hulk bonuses above."]),
    provisional: PA_PROV,
    result(st) { return paResult(st, "b", "a"); },
    info: { bg: "After weeks of raids, the Chaos fleet went quiet. Benadorn moved his flag to the Ramilies star fort Shield of the Emperor over the shipyards of Belis Corona — just as twelve capital ships appeared, escorting an object so vast it could only be one thing.", cr: [BELIS] }
  },
  /* ------------------------------------------------------------ DAMOCLES 1 CRUISER CRASH AT HYDRASS */
  {
    id: "cl-damocles-1", grp: "cl-mag", name: "Cruiser Crash at Hydrass", series: "Damocles Gulf Crusade · Scenario 1", trust: "classic",
    why: "First contact with the Tau: Cruiser Clash without the points cap, Tau ships held in an Imperial sensor lock.", src: "BFG Magazine 19 p. 12–13", book: "O", suggest: ["Imperial Navy", "Tau"],
    others: "Written for the first battles between the Imperium and the Tau; any two fleets can use it, the restrictions show the historical shapes.",
    sides: { a: { n: "Crusade fleet", f: "Imperial Navy + Space Marines" }, b: { n: "Kor’vattra", f: "Tau" } },
    pitch: "Hydrass: a dim star, almost empty space, and the first fleet action between mankind and an upstart alien empire.",
    glance: [["Points", "Equal"], ["Table", "As Cruiser Clash"], ["Battlezone", "Outer reaches, at most D3 phenomena"], ["First turn", "Roll-off"], ["Game ends", "A fleet is destroyed or disengages"]],
    bring: ["Space Marine strike cruisers and a Sword squadron", "Tau Explorers, Merchants and Orcas"],
    forces: {
      a: ["Equal points. At least two Space Marine strike cruisers (squadroned only with each other) and at least one squadron of Swords."],
      b: ["Equal points, at most seven capital ships: Explorers and Merchants (with their variants) and Orca gunships only. At least one Explorer must be the Bork’an variant."]
    },
    draw: (v, W, H) => MAPS["cruiser-clash"](v, W, H).map(it => it.z === "rect" ? Object.assign({}, it, { l: it.s === "a" ? "Crusade fleet" : "Kor’vattra" }) : it),
    fit: () => [90, 70],
    mapNote: "Cruiser Clash zones; the 185 pt limit per cruiser does not apply.",
    steps: [
      { t: "Roll the sunward edge and a D3: that many outer reaches phenomena at most, ignoring planets." },
      { t: "Set up as in Cruiser Clash, without its points limit per ship." },
      { t: "Roll off. The higher roll chooses to go first or second." }
    ],
    notes: [OLD + "Cruiser Clash: RB p. 128 (old p. 66). Tau Explorer, Merchant and Orca: FL p. 458–.", "“The Tau ships get a +1 bonus as if the enemy is on special orders” is printed without saying which test it helps; read it as the Leadership bonus a ship gets for an enemy on special orders, always on."],
    refs: [["Cruiser Clash", "RB p. 128"], ["Tau vessels", "FL p. 458–"], ["Victory points, holding the field", "RB p. 122"]],
    play: [
      { w: "Sensor lock", s: "b", t: "Adeptus Mechanicus and Inquisition auguries track every Tau ship: the Tau always count as if the enemy were on special orders (+1, see note), but suffer −1 Leadership to disengage. They may still disengage off any edge." }
    ],
    tools: [],
    rtools: [
      { k: "num", id: "av", l: "Crusade fleet: victory points (Tau ships that disengaged count 25%)", s: "a", after: v => v + " VP" },
      { k: "num", id: "bv", l: "Kor’vattra: victory points", s: "b", after: v => v + " VP" },
      { k: "toggle", id: "hulk", l: "The Imperials held the field with a Tau capital ship hulk (+1 renown)", s: "a" },
      { k: "html", html: "<p>Next: " + link("cl-damocles-2", "Evacuation of Sy’l’kell") + ". Note which Tau ships survived — they are all the Tau have there.</p>" }
    ],
    end: ["When one fleet is destroyed or disengages."],
    win: ["Standard victory points; every Tau ship that disengages counts as 25% destroyed, crippled or not.", "The Imperial commander gains +1 renown for holding the field with at least one Tau capital ship hulk to examine."],
    result(st) { return vp2(st, "av", "bv", "The crusade fleet", "The Kor’vattra"); },
    info: { bg: "Cardinal Esau Gurney’s crusade, led by the Retribution Blade of Woe, chased rumours of a Demiurg supply ship into the dim Hydrass system and met the Tau fleet for the first time. The Bork’an missile ships broke up the Imperial advance, but against massed broadsides the Tau were outgunned and pulled back, leaving a hulk behind.", cr: [DAMO] }
  },
  /* ------------------------------------------------------------ DAMOCLES 2 EVACUATION OF SY'L'KELL */
  {
    id: "cl-damocles-2", grp: "cl-mag", name: "Evacuation of Sy’l’kell", series: "Damocles Gulf Crusade · Scenario 2", trust: "classic",
    why: "A planetary assault while the Tau evacuate: transport Merchants wake one by one on the planet and try to escape.", src: "BFG Magazine 19 p. 12–13", book: "O", suggest: ["Imperial Navy", "Tau"],
    others: "Any attacker; any defender with ships that can act as heavy transports.",
    sides: { a: { n: "Crusade fleet", f: "Imperial Navy + Space Marines" }, b: { n: "Kor’vattra", f: "Tau" } },
    pitch: "The crusade punches into Sy’l’kell. The Tau fleet holds the line only long enough for its Merchants to lift people and cargo off the agri-world.",
    glance: [["Points", "Imperial: any · Tau: Hydrass survivors"], ["Table", "Not given — use your table"], ["Battlezone", "Primary biosphere, medium planet"], ["First turn", "Roll-off"], ["Game ends", "A fleet is gone, or 10 assault points"]],
    bring: ["A medium planet", "Low orbit table (RB p. 116)", "Gravitic-hook Merchants as Tau transports", "Imperial transports"],
    forces: {
      a: ["Any ships from your list, except up to 750 pts of cruisers, light cruisers and escorts set aside for Scenario 3.", "Must include the flagship (the Retribution Blade of Woe, with any ships needed to field it) and at least two Space Marine strike cruisers.", "Two transports per 500 pts of Imperial Navy ships (not Space Marines); a heavy transport may replace two for 30 pts."],
      b: ["Only the ships that survived Hydrass, fully repaired.", "A free orbital dock; no other high orbit defences. D6×10 pts of low orbit defences per 500 pts of attackers.", "One gravitic-hook (Ke’lshan) Merchant without Orcas per 500 pts of attackers, as heavy transports: −1 Leadership, squadroned only with each other."]
    },
    draw: (v, W, H) => [
      R(30, 30, W - 60, H - 60, "b", "", { dash: 1 }), { z: "text", x: W / 2 - 10, y: 38, l: "Tau place everything (no patrol roll)", s: "b" },
      { z: "planet", cx: W - 45, cy: H / 2 + 2, r: 8, l: "", free: 1 }, { z: "text", x: W - 45, y: H / 2 + 18, l: "Merchants on the planet", s: "b" },
      R(0, 0, 15, H, "a", "Crusade fleet: 15 cm", { rot: -90 })
    ],
    fit: () => [120, 70],
    mapNote: "Planetary Assault layout, but the Tau place every ship themselves. Their transport Merchants sit on the planet template.",
    steps: [
      { t: "Place a medium planet as in Planetary Assault (moon if you like); roll primary biosphere phenomena, ignoring another planet." },
      { s: "b", t: "Set up first: place all your ships yourself (no patrol roll), the orbital dock anywhere in your area, and the transport Merchants on the planet template." },
      { s: "a", t: "Set up as normal for Planetary Assault. Set up the low orbit table." },
      { t: "Roll off. The higher roll chooses to go first or second (Admiral Jallaque adds +1)." }
    ],
    notes: [OLD + "Planetary Assault: RB p. 136–137. Orbital dock: FL p. 496– (the magazine points to old p. 144). Tau gravitic hook Merchant: FL p. 458–."],
    refs: [["Planetary Assault", "RB p. 136–137"], ["Tau vessels", "FL p. 458–"], ["Low orbit defences", "FL p. 517"]],
    play: [
      { w: "Merchants on the planet", s: "b", t: "They start on standby: no moving or shooting, but shields and turrets work and they may take special orders." },
      { w: "Before your movement, from turn 2", s: "b", t: "Roll a D6: on a 6 one Merchant activates and may leave the planet (not while squadroned with an inactive one). The roll needed drops by 1 every turn: 5+ in turn 3, 4+ in turn 4…" },
      { w: "Disengaging", s: "b", t: "Your fleet cannot disengage freely until every transport Merchant is active." },
      JALLAQUE,
      { w: "Landing troops", s: "a", t: "As Planetary Assault: 1 assault point per capital ship and 2 per transport for each turn within 30 cm of the planet edge." }
    ],
    fx: T => T < 2 ? [] : [["b", "Activate a Merchant on " + Math.max(1, 6 - (T - 2)) + "+"]],
    tools: [{ k: "counter", id: "ap", l: "Assault points", s: "a", goal: 10, res: 1 }, { k: "counter", id: "mo", l: "Merchants that disengaged (not crippled)", s: "b", res: 1 }, { k: "counter", id: "mc", l: "Merchants that disengaged crippled", s: "b", res: 1 }],
    rtools: [
      { k: "num", id: "avp", l: "Attacker’s victory points", s: "a", after: v => "+" + Math.floor(v / 500) + " assault points" },
      { k: "num", id: "dvp", l: "Defender’s victory points (without the Merchants)", s: "b", after: v => "−" + Math.ceil(v / 500) + " assault points" },
      { k: "html", html: "<p>Next: " + link("cl-damocles-3", "Pursuit at Resvar Six") + ", with the 750 pts you set aside.</p>" }
    ],
    end: ["When one fleet is destroyed or disengages, or the attacker has 10 or more assault points."],
    win: PA_WIN.concat(["The defender scores 150 VP for every transport Merchant that disengages (75 if crippled) — they carry people and cargo."]),
    provisional: PA_PROV,
    result(st) {
      const dv = num(st, "dvp") + 150 * get(st, "mo", 0) + 75 * get(st, "mc", 0), t = get(st, "ap", 0) + Math.floor(num(st, "avp") / 500) - Math.ceil(dv / 500);
      const r = t >= 10 ? ["a", "Attacker’s victory"] : t >= 6 ? ["a", "Attacker’s marginal win"] : t >= 2 ? ["b", "Defender’s marginal win"] : ["b", "Defender’s victory"];
      return [r[0], r[1], "Adjusted total: " + t + " assault points (Tau VP " + dv + " with the Merchants)."];
    },
    info: { bg: "Captured traitors said Sy’l’kell, near the Perdus Rift, was a fertile agri-world trading with Imperial worlds. Captain Rumann of the Iron Hands led the assault; the orbital station fell to boarding parties, and the Tau fleet stayed only long enough for its Merchants to finish loading evacuees.", cr: [DAMO] }
  },
  /* ------------------------------------------------------------ DAMOCLES 3 PURSUIT AT RESVAR SIX */
  {
    id: "cl-damocles-3", grp: "cl-mag", name: "Pursuit at Resvar Six", series: "Damocles Gulf Crusade · Scenario 3", trust: "classic",
    why: "Catch a fleeing Demiurg ship before a Tau relief fleet arrives — and survive seeing who the Tau trade with.", src: "Fanatic Magazine 1 p. 26–27", book: "O", suggest: ["Imperial Navy", "Tau"],
    others: "Any pursuers; the defenders are a Demiurg ship (or two Bastions) with a Tau escort and its allies.",
    sides: { a: { n: "Task force", f: "Imperial Navy" }, b: { n: "Tau and Demiurg", f: "Tau + Demiurg" } },
    pitch: "After months of hide-and-seek in the plasma clouds, the Demiurg ship breaks cover and runs. Then a Tau fleet appears from behind the asteroids.",
    glance: [["Points", "Task force 1000 · defenders up to 2000 + Hydrass survivors"], ["Table", "Not given — use your table"], ["Battlezone", "Flare or mercurial region"], ["First turn", "Task force"], ["Game ends", "The Demiurg are out or destroyed"]],
    bring: ["A Demiurg Stronghold, or two Bastion cruisers", "Nicassar Dhows (or stand-ins), if you have them"],
    forces: {
      a: ["Up to 1000 pts — the force set aside in Scenario 2 — without the fleet commander’s flagship or re-rolls."],
      b: ["A Demiurg Stronghold or two Bastion cruisers, plus a Tau fleet from the Tau or allied lists (no Hero cruisers); no more than 2000 pts in all.", "Plus any Tau ships that survived Hydrass, arriving later. Nicassar Dhows are encouraged."]
    },
    draw: (v, W, H) => [
      R(0, 0, 15, H, "a", "Task force: 15 cm", { rot: -90 }),
      { z: "mark", x: Math.min(W - 20, 60), y: H / 2, s: "b", l: "Demiurg", free: "x" }, { z: "arrow", x1: Math.min(W - 20, 60) + 4, y1: H / 2, x2: Math.min(W - 6, 78), y2: H / 2, s: "b" },
      { z: "dim", x1: 0, y1: H / 2 + mapFont(W) * 2.5, x2: Math.min(W - 20, 60), y2: H / 2 + mapFont(W) * 2.5, l: "up to 60 cm" },
      { z: "edge", e: "r", s: "b", l: "Tau edge: the Demiurg escape here" }
    ],
    fit: () => [90, 40],
    mapNote: "As the magazine’s map: the Demiurg ship in the middle of the table’s width, no more than 60 cm from the task force’s edge, facing away. The Tau start on the opposite short edge.",
    steps: [
      { t: "Roll for the battlezone (flare or mercurial region) and phenomena as normal." },
      { s: "b", t: "Place the Demiurg ship(s) in the centre, no more than 60 cm from the task force’s short edge, facing straight away from it." },
      { s: "a", t: "Deploy within 15 cm of the short edge nearest the Demiurg." },
      { s: "b", t: "Place the rest of the Tau fleet along the opposite short edge. The Hydrass survivors stay off the table." },
      { s: "a", t: "The task force takes the first turn." }
    ],
    notes: [OLD + "Demiurg (BFG Magazine 6 and 10): FL p. 483–. Tau and allies (BFG Magazine 17): FL p. 438–, 488–.", "With two Bastions, the Tau major victory needs both to survive, or the one survivor to be uncrippled."],
    refs: [["Demiurg", "FL p. 483–"], ["Tau and allied vessels", "FL p. 458–, 488–"]],
    play: [
      { w: "The Demiurg", s: "b", t: "They move, shoot and take special orders as normal — but anything that would make them disengage or turn for the nearest edge instead sends them straight towards the far short edge, where their friends are." },
      { w: "Each turn after the first, after special orders", s: "b", t: "Roll a D6 for the Hydrass survivors: on a 6 they arrive on your edge; the roll needed drops by 1 every turn (5+ in turn 3, 4+ in turn 4…). Escort squadrons bring only surviving ships; damaged capital ships repair D2 hits first (criticals are all repaired); Orcas need their carriers." },
      { w: "Witnesses", s: "a", t: "Any of your capital ships that comes within 30 cm of a Demiurg ship or a Nicassar Dhow has seen too much: the Tau will try to destroy it; you want it to escape off the nearest edge." }
    ],
    fx: T => T < 2 ? [] : [["b", "Hydrass survivors arrive on " + Math.max(1, 6 - (T - 2)) + "+"]],
    tools: [{ k: "toggle", id: "arr", l: "The Hydrass survivors have arrived", s: "b" }],
    rtools: [
      { k: "pick", id: "dem", l: "The Demiurg…", rows: [["Escaped off the far edge", ""], ["Were destroyed", ""]] },
      { k: "toggle", id: "wit", l: "Every capital ship that came within 30 cm of a Demiurg or Dhow was destroyed", s: "b" },
      { k: "toggle", id: "esc", l: "A capital ship that came within 30 cm of a Demiurg or Dhow escaped off the nearest edge", s: "a" },
      { k: "num", id: "av", l: "Task force: victory points", s: "a", after: v => v + " VP" }, { k: "num", id: "bv", l: "Tau and Demiurg: victory points", s: "b", after: v => v + " VP" },
      { k: "html", html: "<p>Next: " + link("cl-damocles-4", "Assault on Pra’yen") + ".</p>" }
    ],
    end: ["When every Demiurg ship has left by the far short edge or been destroyed."],
    win: ["Defender’s major victory (+2 renown): the Demiurg get away (crippled is fine) and every enemy capital ship that came within 30 cm of a Demiurg ship or Dhow was destroyed.", "Attacker’s victory (+1 renown): the Demiurg are destroyed.", "Attacker’s major victory (+2 renown): the Demiurg are destroyed and a capital ship that came within 30 cm of them or of a Dhow escaped off the nearest edge.", "Otherwise victory points decide."],
    result(st) {
      const d = get(st, "dem", -1);
      if (d === 1) return get(st, "esc", false) ? ["a", "Attacker’s major victory (+2 renown)", "The Demiurg are gone, and the secret is out."] : ["a", "Attacker’s victory (+1 renown)", "The Demiurg are destroyed."];
      if (d === 0 && get(st, "wit", false)) return ["b", "Defender’s major victory (+2 renown)", "The Demiurg are safe, and no witness got away."];
      if (d === 0) return vp2(st, "av", "bv", "The task force", "The Tau");
      return [null, "Battle in progress", "Mark what happened to the Demiurg."];
    },
    info: { bg: "For months Captain Stenhoffor’s task force hunted a Demiurg ship among Resvar Six’s plasma clouds. When a reactor leak finally drove it into the open, a Tau fleet under Kor’O Mesme came out from behind the asteroids — with Nicassar Dhows in tow that the Imperium was never supposed to see.", cr: [DAMO] }
  },
  /* ------------------------------------------------------------ DAMOCLES 4 ASSAULT ON PRA'YEN */
  {
    id: "cl-damocles-4", grp: "cl-mag", name: "Assault on Pra’yen", series: "Damocles Gulf Crusade · Scenario 4", trust: "classic",
    why: "A planetary assault on what looks like a lightly defended outpost — and is a trap, with a Tau orbital station and the whole fleet waiting.", src: "Fanatic Magazine 1 p. 28–29", book: "O", suggest: ["Imperial Navy", "Tau"],
    others: "Any attacker; any defender with an orbital station.",
    sides: { a: { n: "Crusade fleet", f: "Imperial Navy + Space Marines" }, b: { n: "Dal’yth Sept", f: "Tau" } },
    pitch: "The crusade finally crosses the Damocles Gulf to strike the Dal’yth Sept, starting with its weakly defended outermost world. It is not weakly defended.",
    glance: [["Points", "Equal + a free Tau orbital station"], ["Table", "Not given — use your table"], ["Battlezone", "Outer reaches, medium planet"], ["First turn", "Roll-off"], ["Game ends", "A fleet is gone, or 10 assault points"]],
    bring: ["A medium planet", "Low orbit table (RB p. 116)", "A Tau orbital station", "Imperial transports"],
    forces: {
      a: ["Equal points from your list. Must include the flagship (with the ships needed to field it) and at least two Space Marine strike cruisers.", "Two transports per 500 pts of Imperial Navy ships; a heavy transport may replace two for 30 pts."],
      b: ["Equal points; no Nicassar ships.", "Free: one Tau Security Orbital Station (profile on the Play tab).", "D6×10 pts of planetary defences per 500 pts of attackers. High orbit platforms may only be built from the orbital cluster options (Play tab), one weapon system each."]
    },
    draw: (v, W, H) => [
      R(30, 30, W - 60, H - 60, "b", "", { dash: 1 }), { z: "text", x: W / 2 - 10, y: 38, l: "Tau place their own ships", s: "b" },
      { z: "planet", cx: W - 45, cy: H / 2, r: 8, l: "", free: 1 }, { z: "mark", x: W - 45 - 8 - 12, y: H / 2, s: "b", l: "station", free: 1 },
      R(0, 0, 15, H, "a", "Crusade fleet: 15 cm", { rot: -90 })
    ],
    fit: () => [120, 70],
    mapNote: "Planetary Assault layout. The Security Orbital Station sits on the planet’s side facing the attackers, midway between the long edges, within 15 cm of the planet’s edge.",
    steps: [
      { t: "Place a medium planet as in Planetary Assault (moon if you like); roll outer reaches phenomena, ignoring another planet." },
      { s: "b", t: "Set up first as in Planetary Assault, but place all your ships yourself — the attacker places none of them. The Security Orbital Station goes on the side of the planet facing the attackers, midway between the long edges, within 15 cm of the planet’s edge." },
      { s: "a", t: "Set up as normal for Planetary Assault. Set up the low orbit table." },
      { t: "Roll off. The higher roll chooses to go first or second (Admiral Jallaque adds +1)." }
    ],
    notes: [OLD + "Planetary Assault: RB p. 136–137. Tau vessels: FL p. 458–.",
      "The magazine prints an “Orbital Cluster” with a battleship-like profile (Battleship/12, 15 cm, 1 shield, armour 5+/4+ rear, 5 turrets) whose weapons are bought one at a time. The text only says high orbit platforms are built from its weapon options; how the cluster itself is fielded is not explained.", "The forces text gives the defender “a Tau Orbital cluster” for free, but the set-up places the Security Orbital Station; this page reads the free item as the station (120 pts)."],
    refs: [["Planetary Assault", "RB p. 136–137"], ["Tau vessels", "FL p. 458–"], ["Planetary defences", "FL p. 496–"]],
    play: [
      { w: "Tau Security Orbital Station (120 pts, free)", s: "b", t: "Defence/12, speed 0, 1 shield, armour 5+, 2 turrets. Railgun batteries 45 cm, firepower 3; ion cannon 30 cm, strength 3; launch bays, one squadron of Barracudas (25 cm) or Mantas (20 cm). All around." },
      { w: "Orbital platforms", s: "b", t: "One weapon system each: railgun batteries (45 cm, firepower 3) 30 pts; ion cannon (30 cm, strength 1) 30 pts; launch bays (one squadron) 35 pts; gravitic hook (one Orca) 25 pts plus the Orca; torpedoes (speed 40 cm, strength 4) 35 pts." },
      JALLAQUE,
      { w: "Landing troops", s: "a", t: "As Planetary Assault: 1 assault point per capital ship and 2 per transport for each turn within 30 cm of the planet edge." }
    ],
    tools: [{ k: "counter", id: "ap", l: "Assault points", s: "a", goal: 10, res: 1 }],
    rtools: PA_RT("a", "b"),
    end: ["When one fleet is destroyed or disengages, or the attacker has 10 or more assault points."],
    win: PA_WIN,
    provisional: PA_PROV,
    result(st) { return paResult(st, "a", "b"); },
    info: { bg: "Two years after the crusade was raised, Admiral Jallaque crossed the Damocles Gulf to strike the Dal’yth Sept, starting with its outermost world, Pra’yen. Its defences looked as flimsy as the habitat clusters swept aside at Viss’el. In fact it was a fully armed outpost, with the Tau fleet waiting nearby as the patient hunter.", cr: [DAMO] }
  }
  ]);
})();
