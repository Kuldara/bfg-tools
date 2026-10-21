/* Fan supplements: Book of Nemesis (2007), the Polish Cypra Probatii community's book of
   BFG rules and scenarios, edited by Marcin "MKG" Gerkowicz. The Gehenna System campaign's four
   special scenarios (p. 42–45) and the scenarios chapter (p. 46–59): historical, tournament and special.
   Page numbers are PDF pages; the printed page number is two lower.
   Summarised in our own words; every scenario is hand-made (see LUEMINUT.md). */
(function () {
  const NEM = "Book of Nemesis (2007), the book of BFG rules and scenarios of the Polish Cypra Probatii community, edited by Marcin “MKG” Gerkowicz, with Filip “Ardis de Levender” Domurad, Dorian “NairoD” Kulesza, Piotr “Lord Everkeeper” Nazar, Krzysztof “Kreepus_Maximus” Płatek, Juliusz “BORS” Sabak and Marcin “AunO’res” Zahorowicz; proofread by Iain “Cybershadow” Werry. The book does not say who wrote which scenario.";
  const GEH = "One of the four special scenarios of the Gehenna System campaign, first played as a one-day event campaign in Lublin (2006); the book also gives its tree-campaign rules and a Gehenna celestial phenomena generator (p. 38–41).";
  const pg = n => "Book of Nemesis p. " + n + " (printed " + (n - 2) + ")";
  const DEF_PROFILES = "<h3>Defences of Gehenna (Book of Nemesis p. 26–27)</h3><ul class='plain small'>" +
    "<li><b>Orbital Command Center</b>, 30 pts — Defence/1, shields 2, armour 6+, turrets 2. Weapons battery 45 cm, firepower 4, all round. Raises the Leadership of every defence within 30 cm to 8, and lets one installation or installation squadron within 30 cm use Lock On each turn (not star forts, hulks or roks).</li>" +
    "<li><b>Orbital Flak Platform</b>, 30 pts — Defence/1, shields 1, armour 6+, turrets 2. Fleet defence turret, 15 cm, strength 2, all round. On a large flying base.</li>" +
    "<li><b>Phoenix Launcher</b>, 10 pts — counts as ordnance (hit on 6s, removed by fighters). At the start of any of your ordnance phases, replace it with D6+1 seeking torpedoes (FL p. 20), then roll a D6: on a 1 they lose their target and the enemy takes control of them. One use.</li></ul>";
  const STANDBY = { w: "Ships on standby", t: "They may not move, fire or launch ordnance, but may brace and repair. To go on alert a ship or squadron passes a Leadership test — not a command check — and may not use special orders that turn (RB p. 132)." };

  addScenarios([
  /* ------------------------------------------------------------ GEHENNA: DEATH OF THE GOVERNOR */
  {
    id: "fan-n-governor", grp: "fan-nem", name: "Death of the Governor", series: "Gehenna System campaign · special scenario", trust: "fan",
    why: "A small, fast raiding force must land assassins on a planet guarded by a fleet twice its size, within six turns.", src: pg(42), book: "O", suggest: ["Chaos", "Imperial Navy"],
    others: "Written for the Gehenna campaign’s attackers (forces of Disorder) and defenders (forces of Order). Any raider with fast ships can attack; any fleet with a planet to defend can defend.",
    sides: { a: { n: "Attackers", f: "forces of Disorder" }, b: { n: "Defenders", f: "Imperial Navy" } },
    pitch: "The governor of Gehenna II is hiding in a bunker beneath his palace. A handful of fast ships must break through the orbiting battlegroup and drop strike teams before the defenders wake up.",
    glance: [["Points", "Defenders 1000 + ground defences · Attackers 500"], ["Table", "Square, 120–140 cm"], ["Battlezone", "A small planet in the centre; standard generator"], ["First turn", "Attackers"], ["Game ends", "Governor dead, end of turn 6, or the attack fails"]],
    bring: ["A small planet", "A low orbit table (RB p. 116)", "Markers for the palace, an airfield, a laser battery and a missile battery"],
    forces: { a: ["500 pts."], b: ["1000 pts.", "On the planet’s surface: the governor’s palace, an airfield, a laser battery and a missile battery (as an air base, a defence laser silo and a missile silo, FL p. 517)."] },
    draw: (v, W, H) => [R(20, 20, W - 40, H - 40, "b", "", { dash: 1 }), { z: "planet", cx: W / 2, cy: H / 2, r: 7 }, { z: "ring", cx: W / 2, cy: H / 2, r: 17, s: "b" },
      { z: "text", x: W / 2, y: 28, l: "D3 on full alert: 20 cm from the edges", s: "b" }, { z: "text", x: W / 2, y: H / 2 + 24, l: "the rest on standby in orbit", s: "b" },
      { z: "edge", e: "t", s: "a", dash: 1, l: "Attackers enter from any edges" }, { z: "edge", e: "b", s: "a", dash: 1, l: "" }, { z: "edge", e: "l", s: "a", dash: 1, l: "" }, { z: "edge", e: "r", s: "a", dash: 1, l: "" }],
    fit: () => [90, 90], srcTable: [130, 130],
    mapNote: "The book plays on a square table 120–140 cm across. The ring marks the small planet’s gravity well, where the standby ships orbit.",
    steps: [
      { t: "Place a small planet (Gehenna II) in the centre and generate the other celestial phenomena with the standard generator (RB p. 107–108). Set up a low orbit table." },
      { s: "b", t: "Place the palace, the airfield, the laser battery and the missile battery on the planet’s surface (the low orbit table)." },
      { s: "b", t: "Roll a D3 (tool below): that many ships or squadrons are on full alert, placed anywhere at least 20 cm from every table edge. The rest are on standby in orbit around the planet." },
      { s: "a", t: "Keep your fleet off the table: it enters from any table edge or edges in the first turn." },
      { s: "a", t: "You take the first turn." }
    ],
    stools: [{ k: "val", id: "alert", l: "Defenders on full alert (D3)", opts: [1, 2, 3], roll: () => dn(3) }],
    notes: ["The book does not say where the palace can be attacked from. It is on the planet, so the default sends the hit-and-run from the low orbit table (Agree before you start).", "The palace has no hits and cannot be destroyed: only the hit-and-run matters. It has 2 turrets, so attacking assault boats are shot at as usual.", "Effect on the campaign: if the attackers win, D3 random ships or squadrons in each defending fleet lose 1 Leadership; if the defenders win, D3 random ships or squadrons in each defending fleet gain 1."],
    refs: [["Fighting in low orbit", "RB p. 116"], ["Hit-and-run attacks", "RB p. 91"], ["Surprise Attack (standby)", "RB p. 132"], ["Low orbit defences", "FL p. 517"], ["Battlezone generators", "RB p. 107–108"]],
    play: [
      STANDBY,
      { w: "Turn 1", s: "a", t: "Your ships move onto the table from any edge or edges." },
      { w: "Killing the governor", s: "a", t: "Make a hit-and-run attack on the palace ({a:where}). It succeeds on a D6 roll of 4+ — the governor is well guarded. The palace has 2 turrets, no shields, and cannot be destroyed." },
      { w: "Turn 6", t: "Last turn: if the governor is still alive at its end, the defenders win." }
    ],
    turnMax: () => 6,
    fx: T => T === 1 ? [["a", "Enter from any table edges"]] : T === 6 ? [[null, "Last turn"]] : [],
    tools: [{ k: "roll", id: "hr", s: "a", l: "Hit-and-run on the palace", rows: () => [[1, 3, "Repelled: the guards hold"], [4, 6, "The governor is dead: the attackers win"]] }],
    rtools: [{ k: "ending", id: "how", l: "How did it end?", rows: [["The governor was killed", "a"], ["Turn 6 ended with the governor alive", "b"], ["The attacking fleet was destroyed or disengaged", "b"]] }],
    end: ["The governor is killed, turn 6 ends, or the attacking fleet is destroyed or has disengaged."],
    win: ["Attackers: kill the governor with a hit-and-run attack on the palace (4+).", "Defenders: anything else."],
    result(st, v, S) { return endingResult(st, S, "how"); },
    info: { bg: "Gehenna’s governor commands no troops, but his death would shatter Imperial morale. The planet itself can resist any invasion, and a full battlegroup orbits it. The only chance is a few fast ships dropping strike teams to dig him out of his bunker beneath the palace.", cr: [GEH, NEM + " " + pg(42) + "."] }
  },
  /* ------------------------------------------------------------ GEHENNA: GUNS OF NARAVONA */
  {
    id: "fan-n-naravona", grp: "fan-nem", name: "Guns of Naravona", series: "Gehenna System campaign · special scenario", trust: "fan",
    why: "Fight through the only safe passage into the system, guarded by an asteroid battlestation with a giant cannon.", src: pg(43), book: "O", suggest: ["Chaos", "Imperial Navy"],
    others: "Any attacker against any defender. The Naravona battlestation is the book’s own defence; without it, use a space station (FL p. 507).",
    sides: { a: { n: "Attackers", f: "forces of Disorder" }, b: { n: "Defenders", f: "Imperial Navy" } },
    pitch: "For three thousand years the Naravona battlestation has held the only safe route into Gehenna. Whoever takes the passage takes the system’s supply line — and the attackers must break the station at any cost.",
    glance: [["Points", "1000 each + the Naravona battlestation"], ["Table", "Not given — use your table"], ["Battlezone", "A clear passage in the middle; phenomena only on the sides"], ["First turn", "Attackers"], ["Game ends", "Naravona destroyed, or the attack fails"]],
    bring: ["A model for the Naravona battlestation", "Celestial phenomena for the sides"],
    forces: { a: ["1000 pts."], b: ["1000 pts.", "Plus the Naravona battlestation (profile on the Play tab), in the middle of your deployment zone."] },
    draw: (v, W, H, st, sc) => { const d = agN(sc, st, "dep"), p = Math.min(W - 20, agN(sc, st, "pass")), x0 = (W - p) / 2; return [
      { z: "hatch", x: 0, y: d, w: x0, h: Math.max(0, H - 2 * d), l: "" }, { z: "hatch", x: x0 + p, y: d, w: x0, h: Math.max(0, H - 2 * d), l: "" },
      R(0, 0, W, d, "b", ""), { z: "text", x: W / 4, y: d / 2, l: "Defenders: " + d + " cm", s: "b" }, R(0, H - d, W, d, "a", "Attackers: " + d + " cm"), { z: "mark", x: W / 2, y: d / 2, s: "b", l: "" },
      { z: "text", x: W / 2, y: H / 2, l: "Naravona passage:\nno phenomena", s: "n" }, x0 >= 14 ? { z: "text", x: x0 / 2, y: H / 2, l: "phenomena", s: "n", rot: -90 } : null]; },
    fit: () => [100, 80],
    mapNote: "Phenomena are generated only on the sides (hatched); the passage between them stays clear. The diamond in the defenders’ zone is the battlestation.",
    steps: [
      { t: "Leave a clear passage {a:pass} cm wide up the middle of the table, and generate celestial phenomena as normal on either side of it." },
      { s: "b", t: "Place the Naravona battlestation in the middle of your deployment zone, {a:dep} cm deep along a long edge." },
      { t: "Deploy as normal, each in your own zone. Roll a D6 first: on a 4+ the attackers place one of the defenders’ ships or squadrons ({a:once})." },
      { s: "a", t: "You take the first turn." }
    ],
    stools: [{ k: "roll", id: "dep4", l: "Do the attackers place a defending ship?", rows: () => [[1, 3, "No — the defenders deploy everything"], [4, 6, "Yes — the attackers place one defending ship or squadron"]] }],
    notes: ["“Standard deployment rules” is all the book says. Its map shows zones along the long edges 80 cm apart, which on a 120 cm table leaves 20 cm for each.", "The passage’s width is read from the map, which shows phenomena in roughly the outer third on either side.", "Effect on the campaign: the side that holds the passage may re-roll a failed Reload Ordnance test once per battle for the rest of the campaign, and any of its lost ships or squadrons returns at Leadership 7 on a 4+."],
    refs: [["Nova cannon", "RB p. 63"], ["Space station", "FL p. 507"], ["Battlezone generators", "RB p. 107–108"]],
    play: [
      { w: "The Naravona battlestation", s: "b", t: "Defence/12, shields 3, armour 5+, turrets 4. Lance battery 60 cm, strength 4; weapons battery 60 cm, firepower 14; 4 launch bays; Van Holderman’s cannon 30–120 cm, all round, used exactly like a nova cannon. 250 pts (Book of Nemesis p. 26)." },
      { w: "The attackers’ goal", s: "a", t: "Destroy Naravona — the game goes on until it is destroyed, or until your fleet is destroyed or has disengaged." }
    ],
    tools: [],
    rtools: [{ k: "ending", id: "how", l: "How did it end?", rows: [["Naravona was destroyed", "a"], ["The attacking fleet was destroyed or disengaged", "b"]] }],
    end: ["Naravona is destroyed, or the attacking fleet is destroyed or has disengaged."],
    win: ["Attackers: destroy the Naravona battlestation, at any cost.", "Defenders: keep it alive until the attack is spent."],
    result(st, v, S) { return endingResult(st, S, "how"); },
    info: { bg: "The Naravona battlestation, built on an asteroid to take the recoil of its huge Van Holderman cannons, has guarded the only safe passage into Gehenna for three millennia. Every supply ship to the system goes past its guns.", cr: [GEH, NEM + " " + pg(43) + "; the battlestation’s profile is on p. 26."] }
  },
  /* ------------------------------------------------------------ GEHENNA: SHADOW OF THE COMET */
  {
    id: "fan-n-comet", grp: "fan-nem", name: "Shadow of the Comet", series: "Gehenna System campaign · special scenario", trust: "fan",
    why: "Sneak up on an Adeptus Mechanicus moon base in a comet’s shadow, board its command centre and get the data out.", src: pg(44), book: "O", suggest: ["Chaos", "Adeptus Mechanicus"],
    others: "Any attacker against any defender. The command centre and flak platform are the book’s own defences; the book alternatives are on the Play tab.",
    sides: { a: { n: "Attackers", f: "forces of Disorder" }, b: { n: "Defenders", f: "Adeptus Mechanicus" } },
    pitch: "On the second moon of Gehenna III the Mechanicus keeps a treasure of knowledge. A comet is passing — and in its shadow an attacking fleet creeps toward the moon before anyone knows it is there.",
    glance: [["Points", "500 each + defences"], ["Table", "Not given — the map is square"], ["Battlezone", "A large planet and two moons on one edge; a comet"], ["First turn", "Attackers"], ["Game ends", "After 6 turns"]],
    bring: ["A large planet and two moons", "A comet: a small model with a teardrop tail about 20 × 5 cm", "Defences: a command centre, 2 orbital weapons platforms, a flak platform, 2 orbital torpedo launchers"],
    forces: { a: ["500 pts."], b: ["500 pts.", "In high orbit around the second moon: an Orbital Command Center, 2 Orbital Weapons Platforms (FL p. 511), an Orbital Flak Platform and 2 Orbital Torpedo Launchers (FL p. 510)."] },
    draw: (v, W, H, st) => { const mx = 34, my = H / 2 + 8, cx = Math.min(W - 10, mx + 45), end = get(st, "end", 0), top = end >= 4;
      /* komeetan lähtöpää heitetään (Set-up tools): ennen heittoa ei komeettaa eikä hyökkääjien laatikkoa (käyttäjä 21.10.) */
      const comet = end ? [R(cx - 10, top ? 0 : H - 20, 20, 20, "a", "", { free: 1 }), { z: "mark", x: cx, y: top ? 4 : H - 4, s: "n", free: 1 }, { z: "text", x: cx + 26, y: top ? 28 : H - 28, l: "Attackers:\nwithin 10 cm\nof the comet", s: "a" }]
        : [{ z: "text", x: cx + 30, y: H - 24, l: "Comet and attackers:\nroll which end\nit starts from", s: "a" }];
      return [R(20, 20, W - 40, H - 40, "b", "", { dash: 1 }), { z: "planet", cx: 4, cy: H / 2 - 6, r: 14, free: 1 }, { z: "planet", cx: 30, cy: H / 2 - 30, r: 3, free: 1 }, { z: "planet", cx: mx, cy: my, r: 3, l: "moon 2", free: 1 },
      { z: "line", x1: cx, y1: 0, x2: cx, y2: H }, { z: "dim", x1: mx, y1: my - 9, x2: cx, y2: my - 9, l: "45 cm" }, ...comet,
      { z: "text", x: Math.min(W - 26, cx + 30), y: 30, l: "comet path", s: "n" }, { z: "text", x: W / 2 + 18, y: H / 2 - 18, l: "Defenders", s: "b" }]; },
    fit: () => [110, 90],
    mapNote: "The comet starts at a random end of its path (roll it below) and moves 10 cm a turn toward the far edge. The large planet and its moons sit on the left edge.",
    steps: [
      { t: "Place a large planet on one table edge and its two moons next to it." },
      { t: "Mark the comet’s path, 45 cm from the second moon and across the table (map). Roll which end it starts from (tool below) and place the comet there, its tail pointing away from the sunward edge." },
      { s: "b", t: "Place the defences in high orbit around the second moon: the command centre, the two weapons platforms, the flak platform and the two torpedo launchers." },
      { t: "Deploy: {a:dep}. Roll a D6 first: on a 4+ the attackers place one of the defenders’ ships or squadrons." },
      { s: "a", t: "You take the first turn, hidden by the comet." }
    ],
    stools: [{ k: "roll", id: "end", l: "Which end does the comet start from?", rows: () => [[1, 3, "The bottom of its path (as on the map)"], [4, 6, "The top of its path"]] }, { k: "roll", id: "dep4", l: "Do the attackers place a defending ship?", rows: () => [[1, 3, "No"], [4, 6, "Yes — one defending ship or squadron"]] }],
    notes: ["The book’s comet rules are in a Specialist Games article; the same comet is in Fanatic Online’s New Celestial Phenomena: it counts as an asteroid field, its tail as a gas cloud that blocks line of sight, and it moves 10 cm a turn toward the far edge, turning back when it gets there.", "“Standard deployment rules” is all the book says; its map shows the attackers next to the comet and the defenders over most of the table.", "The command centre and flak platform have no book profiles. Without them, use an orbital weapons platform (FL p. 511) for the command centre and leave out the flak platform.", "Effect on the campaign: every fleet of the winning side gains D3 refits."],
    refs: [["Orbital weapons platform", "FL p. 511"], ["Orbital torpedo launcher", "FL p. 510"], ["Boarding actions", "RB p. 89–90"], ["Asteroid fields", "RB p. 110"], ["Moons", "RB p. 113"]],
    play: [
      { w: "Start of every turn", t: "The comet moves 10 cm along its path. It counts as an asteroid field; its tail as a gas cloud that blocks line of sight." },
      { w: "Hidden in the comet’s shadow", s: "a", t: "While every attacking ship is within 10 cm of the comet, has not fired anything (ordnance and hit-and-run included) and is not on special orders, none of them can be attacked." },
      { w: "Start of each defender turn: detection", s: "b", t: "Roll a D6: a 6 spots the attackers (+1 if any of your ships is within 10 cm of an attacking ship)." },
      { w: "Until detected", s: "b", t: "Your ships are on patrol: in your movement phase roll a D6 for each ship or squadron — on a 4+ the attacker moves it instead of you." },
      { w: "Goal", s: "a", t: "Win a boarding action against the Orbital Command Center, then disengage at least one ship: the captured data has been passed to every ship." },
      { w: "Defences", t: "The Orbital Command Center raises defences within 30 cm to Leadership 8 and lets one of them Lock On each turn (profiles in the tools)." }
    ],
    turnMax: () => 6,
    fx: T => [[null, "The comet moves 10 cm"], ["b", "Roll for detection (6+)"]].concat(T === 6 ? [[null, "Last turn"]] : []),
    tools: [{ k: "roll", id: "det", s: "b", l: "Detection roll", sub: "D6 at the start of each defender turn", rows: () => [[1, 4, "Still hidden"], [5, 5, "Spotted only if a defending ship is within 10 cm of an attacking ship"], [6, 6, "Spotted: the attack is detected"]] },
      { k: "shiproll", id: "pat", s: "b", l: "Patrol moves", cl: "Ships and squadrons", n0: 4, il: i => "Ship or squadron " + (i + 1), out: d => d >= 4 ? "the attacker moves it" : "you move it", sub: "Only until the attack is detected." },
      { k: "toggle", id: "found", l: "The attack has been detected" }, { k: "html", html: DEF_PROFILES }],
    rtools: [{ k: "ending", id: "how", l: "How did it end?", rows: [["Command centre boarded and an attacking ship disengaged", "a"], ["Six turns passed without that", "b"]] }],
    end: ["After 6 turns."],
    win: ["Attackers: win a boarding action against the Orbital Command Center and disengage at least one ship.", "Defenders: stop them."],
    result(st, v, S) { return endingResult(st, S, "how"); },
    info: { bg: "The Adeptus Mechanicus base on the second moon of Gehenna III is famous for its sophisticated defence systems — and for the knowledge stored there. Comets often pass through this part of the system, and one of them is about to hide an attack.", cr: [GEH, NEM + " " + pg(44) + "; the defences are on p. 27.", "Comet rules: Fanatic Online, “New Celestial Phenomena”."] }
  },
  /* ------------------------------------------------------------ GEHENNA: LINE OF GEHENNA */
  {
    id: "fan-n-line", grp: "fan-nem", name: "Line of Gehenna", series: "Gehenna System campaign · special scenario", trust: "fan",
    why: "Two defence lines against a Chaos space hulk heading for low orbit: stop it before it unloads its armies.", src: pg(45), book: "O", suggest: ["Chaos", "Imperial Navy"], players: [2, 3],
    others: "Written for a Chaos space hulk (FL p. 286) and two Imperial fleets; any fleet with a space hulk can attack, and any can defend. The two defending fleets can be one player or two.",
    sides: { a: { n: "Attackers", f: "Chaos, with a space hulk" }, b: { n: "Defenders", f: "Imperial Navy" } },
    pitch: "Millions of traitors wait aboard a Chaos space hulk, packed into landing pods. If it reaches low orbit over Gehenna II they will flood the planet — so two fleets and a ring of defences stand in its way.",
    glance: [["Points", "Attackers 1000 + space hulk · Defenders 500 + 1000 + defences"], ["Table", "Not given — use your table"], ["Battlezone", "Gehenna II (medium planet) at one end; standard generator"], ["First turn", "Roll-off: the winner chooses"], ["Game ends", "The hulk is destroyed, disengages or reaches low orbit"]],
    bring: ["A medium planet", "A Chaos space hulk (FL p. 286)", "Defences: 2 orbital weapons platforms, 2 orbital torpedo launchers, a command centre", "Up to 2D6 phoenix launchers"],
    forces: { a: ["1000 pts.", "Plus the Chaos space hulk."], b: ["Two fleets: 500 pts and 1000 pts.", "Two orbital weapons platforms (FL p. 511), two orbital torpedo launchers (FL p. 510) and an Orbital Command Center.", "D6 phoenix launchers in each deployment zone (roll for each)."] },
    draw: (v, W, H, st, sc) => { const orb = 35, z1 = orb + 20, a0 = Math.min(W - 10, orb + 65); return [R(0, 0, orb, H, "b", ""), { z: "text", x: orb - 8, y: H * .22, l: "2nd line", s: "b", rot: -90 }, { z: "planet", cx: 10, cy: H / 2, r: 10, free: "x" },
      R(z1, 0, 15, H, "b", "1st line", { rot: -90 }), R(a0, 0, W - a0, H, "a", "Attackers"),
      { z: "dim", x1: orb, y1: H - 10, x2: z1, y2: H - 10, l: "20" }, { z: "dim", x1: orb, y1: 10, x2: a0, y2: 10, l: "65 cm" }]; },
    fit: () => [130, 60],
    mapNote: "The planet sits against the middle of a short edge. Its orbit — {a:orbit} — is the second defence line; the first is a 15 cm band 20 cm beyond it, and the attackers set up at least 65 cm from the orbit.",
    steps: [
      { t: "Place Gehenna II, a medium planet, against the middle of one short edge ({a:planet}), and generate the other celestial phenomena with the standard generator. Set up a low orbit table." },
      { s: "b", t: "Deploy first: one fleet in the second defence line (the planet’s orbit), the other in the first line, a 15 cm band 20 cm further out (map). Place the defences and roll a D6 for the phoenix launchers in each zone." },
      { s: "a", t: "Deploy your fleet and the space hulk at least 65 cm from the planet’s orbit." },
      { t: "Roll off: the winner chooses who takes the first turn." }
    ],
    stools: [{ k: "val", id: "ph1", s: "b", l: "Phoenix launchers in the 1st line (D6)", opts: [1, 2, 3, 4, 5, 6], roll: () => d6() }, { k: "val", id: "ph2", s: "b", l: "Phoenix launchers in the 2nd line (D6)", opts: [1, 2, 3, 4, 5, 6], roll: () => d6() }],
    notes: ["The book refers to a Specialist Games article for the Chaos space hulk; it is now in the Fleets book (FL p. 286–288).", "The map’s distances are read relative to the “planetary orbit”, which the book does not define further; the default uses the planet’s gravity well (RB p. 113).", "The book’s own defences (command centre, phoenix launchers) have no book profiles; without them, use another orbital weapons platform and leave the launchers out.", "With three players, the two defending fleets are played by two people, taking their turn together."],
    refs: [["Chaos space hulk", "FL p. 286–288"], ["Fighting in low orbit", "RB p. 116"], ["Gravity wells", "RB p. 112–113"], ["Seeking torpedoes", "FL p. 20"], ["Orbital weapons platform", "FL p. 511"], ["Orbital torpedo launcher", "FL p. 510"]],
    play: [
      { w: "The hulk", s: "a", t: "Get the Chaos space hulk into low orbit over Gehenna II: the moment it enters, you win." },
      { w: "Phoenix launchers", s: "b", t: "At the start of any of your ordnance phases, replace a launcher with D6+1 seeking torpedoes, then roll a D6: on a 1 they lose their target and the attackers take control of them. Each launcher works once." },
      { w: "Command centre", s: "b", t: "Defences within 30 cm of it are Leadership 8, and one of them may Lock On each turn." }
    ],
    tools: [{ k: "roll", id: "phx", s: "b", l: "Phoenix launcher fires", rows: () => [[1, 1, "Misguided: the attackers take control of the torpedoes"], [2, 6, "On target"]] }, { k: "val", id: "phn", s: "b", l: "Seeking torpedoes from one launcher (D6+1)", opts: [], roll: () => d6() + 1 }, { k: "html", html: DEF_PROFILES }],
    rtools: [{ k: "ending", id: "how", l: "How did it end?", rows: [["The space hulk entered low orbit", "a"], ["The space hulk was destroyed", "b"], ["The space hulk disengaged", "b"]] }],
    end: ["The Chaos space hulk is destroyed, disengages or enters low orbit."],
    win: ["Attackers: the space hulk enters low orbit.", "Defenders: anything else."],
    result(st, v, S) { return endingResult(st, S, "how"); },
    info: { bg: "Gehenna II is defended by countless Imperial Guard regiments, so the invaders bring their ultimate weapon: a Chaos space hulk carrying hundreds of thousands of traitors in landing pods and assault boats. Once in low orbit, it will pour them onto the planet.", cr: [GEH, NEM + " " + pg(45) + "; the defences are on p. 27."] }
  },
  /* ------------------------------------------------------------ HISTORICAL: INCIDENT AT KRAVERTUS II */
  {
    id: "fan-n-kravertus", grp: "fan-nem", name: "Incident at Kravertus II", series: "Nemesis sector · historical scenario", trust: "fan",
    why: "Two grand cruisers on a supply run — until one of them opens fire on the other at point-blank range.", src: pg(48) + "–49", book: "O", suggest: ["Chaos", "Imperial Navy"],
    others: "Written for a Chaos Repulsive and an Imperial Vengeance class grand cruiser; any two grand cruisers or heavy cruisers of similar worth will do, the betrayer with the patrols’ points in reserve against it.",
    sides: { a: { n: "Event Horizon", f: "Chaos" }, b: { n: "Imperials", f: "Imperial Navy" } },
    pitch: "Two grand cruisers bring supplies to a mining world. Within sight of the planet, the Event Horizon turns its guns on its companion.",
    glance: [["Points", "Fixed: two grand cruisers, a station, two patrols"], ["Table", "Not given — use your table"], ["Battlezone", "Outer reaches: a medium planet, an asteroid belt"], ["First turn", "Event Horizon (Chaos)"], ["Game ends", "After 12 turns, or the Event Horizon is destroyed or escapes"]],
    bring: ["A Repulsive class grand cruiser (FL p. 269) and an Imperial Vengeance class grand cruiser (FL p. 58)", "A space station (FL p. 507)", "Two patrol groups: 2 Firestorms + 1 Sword, and 1 Firestorm + 2 Swords", "A medium planet and an asteroid belt", "A scatter dice"],
    forces: { a: ["Event Horizon: Repulsive class grand cruiser, Ld 8, special torpedoes (roll for the type as usual, FL p. 19) and Overload Shield Capacitors (RB p. 158)."], b: ["Arbitrum: Vengeance class grand cruiser, Ld 8, Adept Trimsman (RB p. 159) and Navigational Shields (RB p. 158).", "LCV-67: an orbital space station.", "Patrol group Thames: 2 Firestorms and a Sword. Patrol group Rhein: a Firestorm and 2 Swords — both in reserve."] },
    draw: (v, W, H) => { const px = W - 30, ax = px - 10 - 60; return [{ z: "planet", cx: px, cy: H / 2, r: 10, l: "Kravertus II", free: 1 }, { z: "mark", x: px - 12, y: H / 2 - 16, s: "b", l: "station", free: 1 },
      { z: "mark", x: ax, y: H / 2, s: "b", l: "Arbitrum", free: 1 }, { z: "circ", cx: ax, cy: H / 2, r: 20, s: "a", l: "", free: 1 }, { z: "text", x: ax, y: H / 2 - 32, l: "Event Horizon:\n20 cm + 4D6", s: "a" },
      { z: "dim", x1: ax, y1: H / 2 + 40, x2: px - 10, y2: H / 2 + 40, l: "60 cm" }, { z: "edge", e: "t", s: "b", dash: 1, l: "patrols arrive on a random long edge" }, { z: "edge", e: "b", s: "b", dash: 1, l: "" }]; },
    fit: () => [120, 100],
    mapNote: "Both grand cruisers start facing the planet. The Event Horizon’s spot is chosen within 20 cm of the Arbitrum, then scattered 4D6 cm (roll again if it leaves the table).",
    steps: [
      { t: "Place Kravertus II, a medium planet with no moons and an asteroid belt, then roll on the outer reaches generator for the rest (RB p. 108), re-rolling any planet." },
      { s: "b", t: "Place the Arbitrum 60 cm from the planet, facing it, and the station LCV-67 in orbit." },
      { s: "a", t: "Pick a point within 20 cm of the Arbitrum, then roll a scatter dice and 4D6 (tools below): the Event Horizon sets up where it lands, facing the planet. Roll again if it leaves the table." },
      { s: "b", t: "Keep patrol groups Thames and Rhein off the table." },
      { s: "a", t: "Choose the table edge you may disengage from: {a:edge}." },
      { s: "a", t: "You take the first turn." }
    ],
    stools: [{ k: "val", id: "scat", s: "a", l: "Scatter distance (4D6 cm)", opts: [], roll: () => d6() + d6() + d6() + d6(), unit: " cm" }],
    notes: ["The book says the Event Horizon may disengage only off “the assigned table edge” without saying which one; the default is our suggestion.", "The historical background calls the Event Horizon a venerable Repulsive; the book uses the normal Repulsive rules.", "The Remastered books have no orbital station named for this; the standard space station (FL p. 507) fits."],
    refs: [["Repulsive class grand cruiser", "FL p. 269"], ["Vengeance class grand cruiser", "FL p. 58"], ["Space station", "FL p. 507"], ["Special torpedoes", "FL p. 19"], ["Ship refits", "RB p. 158"], ["Crew skills", "RB p. 159"], ["Battlezone generators", "RB p. 107–108"]],
    play: [
      { w: "Turn 1", t: "No ship may use special orders except Brace for Impact." },
      { w: "From the start of turn 3: reinforcements", s: "b", t: "Roll a D6 for each patrol group still off the table: on a 4+ it arrives at any point of a random long table edge." },
      { w: "Low supplies", s: "b", t: "The station may launch only Fury interceptors, at most 2 squadrons." },
      { w: "Disengaging", t: "Imperial ships disengage only by moving into Kravertus II’s low orbit — they hide in the upper atmosphere; there is no low orbit table. The Event Horizon disengages only off its own edge. Any other ship leaving the table counts as destroyed." }
    ],
    turnMax: () => 12,
    fx: T => T === 1 ? [[null, "No special orders but Brace for Impact"]] : T >= 3 ? [["b", "Roll for each patrol group still off the table (4+)"]].concat(T === 12 ? [[null, "Last turn"]] : []) : [],
    tools: [{ k: "roll", id: "thames", s: "b", l: "Patrol group Thames", sub: "D6 at the start of each turn from turn 3", rows: () => [[1, 3, "Not yet"], [4, 6, "Arrives: any point of a random long edge"]] },
      { k: "roll", id: "rhein", s: "b", l: "Patrol group Rhein", sub: "D6 at the start of each turn from turn 3", rows: () => [[1, 3, "Not yet"], [4, 6, "Arrives: any point of a random long edge"]] },
      { k: "roll", id: "edge2", s: "b", l: "Which long edge?", rows: () => [[1, 3, "The top long edge"], [4, 6, "The bottom long edge"]] }],
    rtools: [{ k: "pick", id: "eh", l: "The Event Horizon", rows: [["Escaped, uncrippled", "+3"], ["Escaped, crippled", "+2"], ["Still fighting, uncrippled", "0"], ["Still fighting, crippled", "−1"], ["Destroyed", "−3"]] },
      { k: "pick", id: "ar", l: "The Arbitrum", rows: [["Not crippled", "0"], ["Crippled", "+1"], ["Destroyed", "+3"]] },
      { k: "pick", id: "lcv", l: "Station LCV-67", rows: [["Not crippled", "0"], ["Crippled", "+1"], ["Destroyed", "+3"]] },
      { k: "toggle", id: "th", s: "b", l: "Patrol group Thames destroyed (+1)" }, { k: "toggle", id: "rh", s: "b", l: "Patrol group Rhein destroyed (+1)" }],
    end: ["After 12 turns, or when the Event Horizon is destroyed or disengages."],
    win: ["Add up: Event Horizon escapes +3; Arbitrum crippled +1 or destroyed +3; the station crippled +1 or destroyed +3; each patrol group destroyed +1; Event Horizon crippled −1 or destroyed −3.", "0 or less: Imperial major victory. 1: Imperial minor victory. 2: draw. 3: Chaos minor victory. 4 or more: Chaos major victory."],
    result(st) {
      const eh = [3, 2, 0, -1, -3][get(st, "eh", -1)], ar = [0, 1, 3][get(st, "ar", -1)], lc = [0, 1, 3][get(st, "lcv", -1)];
      if (eh === undefined && ar === undefined && lc === undefined && !get(st, "th", false) && !get(st, "rh", false)) return [null, "Score the battle", "Mark what happened to each ship below."];
      const p = (eh || 0) + (ar || 0) + (lc || 0) + (get(st, "th", false) ? 1 : 0) + (get(st, "rh", false) ? 1 : 0), t = "Total " + p + " points.";
      return p <= 0 ? ["b", "Imperial major victory", t.replace("-", "−")] : p === 1 ? ["b", "Imperial minor victory", t] : p === 2 ? ["draw", "Draw", t] : p === 3 ? ["a", "Chaos minor victory", t] : ["a", "Chaos major victory", t];
    },
    info: { bg: "Kravertus II is a grim mining world that lives on supplies from out-system, delivered in the 34th millennium by old warships able to fend off pirates. In 895.M34 the grand cruisers Arbitrum and Event Horizon arrived with its supplies — and close to the planet, the Event Horizon opened fire.", cr: [NEM + " " + pg(48) + "–49. The battle is described in the book’s history of the Nemesis sector."] }
  },
  /* ------------------------------------------------------------ HISTORICAL: THE FALL OF GREAT ARMADA */
  {
    id: "fan-n-armada", grp: "fan-nem", name: "The Fall of Great Armada", series: "Nemesis sector · historical scenario", trust: "fan",
    why: "A big Imperial fleet caught loading troops on standby; fireships come first, then the renegades.", src: pg(50) + "–51", book: "O", suggest: ["Chaos", "Imperial Navy"],
    others: "Any attacker against a larger defending fleet. The book’s historical re-fight uses its own Warhost Nemesis list for Chaos; the fleets can be any.",
    sides: { a: { n: "Chaos", f: "Chaos renegades" }, b: { n: "Imperial Navy", f: "Imperial Navy" } },
    pitch: "The Great Armada stops at Valeis to take its Guard regiments aboard. The renegades strike while it is still loading, sending fireships ahead to scatter the formations.",
    glance: [["Points", "Chaos 1500 + 8 fireships · Imperial 2500"], ["Table", "Not given — the map shows a long table"], ["Battlezone", "A small planet; outer reaches generator"], ["First turn", "Chaos"], ["Game ends", "After 8 turns"]],
    bring: ["A small planet", "8 fireships for Chaos (FL p. 516)"],
    forces: { a: ["1500 pts.", "Plus 8 free fireships."], b: ["2500 pts."] },
    fixed: { a: ["Admiral Sir Francis Gherkov aboard the Blasphemer class fast battleship Revenge (the book’s Warhost Nemesis list; use a Despoiler, FL p. 266, without it), the Heretic class light cruiser Triumph and the Hades class heavy cruiser Nonpareil, from the Warhost Nemesis fleet list."], b: ["Admiral Sedina Nidonia (Ld 9, one extra re-roll) aboard the Apocalypse class battleship São Sanguinius; the Dominion class battlecruiser Santiago III, the Lunar class cruiser El Sanson and the Dauntless class light cruiser Falcon Blanco Mediano are on record."] },
    draw: (v, W, H) => { const cx = Math.min(W - 25, 20 + 80 + 22); return [R(0, 0, 20, H, "a", "Chaos: 20 cm", { rot: -90 }), { z: "planet", cx, cy: H / 2, r: 7, l: "Valeis", free: 1 }, { z: "circ", cx, cy: H / 2, r: 22, s: "b", l: "", free: 1 },
      { z: "text", x: cx, y: H / 2 - 29, l: "Imperial: on standby\nwithin 15 cm", s: "b" }, { z: "dim", x1: 20, y1: H - 12, x2: cx - 22, y2: H - 12, l: "80 cm" }, { z: "edge", e: "l", s: "b", l: "Imperial ships leaving here score" }]; },
    fit: () => [150, 70],
    mapNote: "Chaos sets up within 20 cm of its short edge, at least 80 cm from the Imperial zone around Valeis. The D3 Imperial ships on alert go anywhere at least 30 cm from the Chaos zone.",
    steps: [
      { t: "Place Valeis, a small planet with no moons, and roll for the other phenomena on the outer reaches generator (RB p. 108)." },
      { s: "b", t: "Your fleet starts on standby within 15 cm of Valeis, except D3 escort squadrons or light cruisers (tool below), which may go anywhere at least 30 cm from the Chaos deployment zone." },
      { s: "a", t: "Deploy second, within 20 cm of your short edge and at least 80 cm from the Imperial zone. Each fireship may be placed D6 × 10 cm further forward (roll for each)." },
      { s: "a", t: "You take the first turn." }
    ],
    stools: [{ k: "val", id: "alert", s: "b", l: "Imperial units on alert (D3)", opts: [1, 2, 3], roll: () => dn(3) }, { k: "shiproll", id: "fire", s: "a", l: "Fireships forward", cl: "Fireships", n0: 8, il: i => "Fireship " + (i + 1), out: d => "up to " + 10 * d + " cm further" }],
    notes: ["“The player gains” the points of Imperial ships leaving by the Chaos edge — read as the Imperial player, whose ships break through.", "The historical re-fight uses ships from the book’s Warhost Nemesis list; the Blasphemer class has no book profile.", "Standby rules: RB p. 132 (Surprise Attack)."],
    refs: [["Fire ship", "FL p. 516"], ["Surprise Attack (standby)", "RB p. 132"], ["Battlezone generators", "RB p. 107–108"], ["Victory points", "RB p. 122"]],
    play: [
      STANDBY,
      { w: "Turn 1", s: "b", t: "Your ships suffer −1 Leadership when testing to go on alert." },
      { w: "Turns 1 to D3", s: "b", t: "No special orders (tool below)." },
      { w: "Breaking through", s: "b", t: "Each of your ships that leaves the table by the Chaos short edge scores half its points value — a tenth if crippled." }
    ],
    turnMax: () => 8,
    fx: (T, st) => { const d = get(st, "noso", 0); return (T === 1 ? [["b", "−1 Ld to go on alert"]] : []).concat(d && T <= d ? [["b", "No special orders"]] : !d && T === 1 ? [["b", "Roll the D3: no special orders until then"]] : []).concat(T === 8 ? [[null, "Last turn"]] : []); },
    tools: [{ k: "val", id: "noso", s: "b", l: "No Imperial special orders until the end of turn… (D3)", opts: [1, 2, 3], roll: () => dn(3) }],
    rtools: [{ k: "num", id: "vc", s: "a", l: "Chaos: victory points", after: v => v + " VP" }, { k: "num", id: "vi", s: "b", l: "Imperial Navy: victory points", after: v => v + " VP" }, { k: "num", id: "out", s: "b", l: "Imperial: points of ships off the Chaos edge (half, crippled a tenth)", after: v => "+" + v + " VP" }],
    end: ["After 8 turns."],
    win: ["Victory points as normal (RB p. 122).", "The Imperial player also scores half the points value of each ship that leaves by the Chaos short edge, a tenth if it is crippled.", "Most victory points wins."],
    result(st) { const c = num(st, "vc"), i = num(st, "vi") + num(st, "out"); if (!c && !i) return [null, "Count victory points", "Enter both totals below."]; return c === i ? ["draw", "Level", "Chaos " + c + " – Imperial " + i + " VP."] : [c > i ? "a" : "b", wins(c > i ? "Chaos" : "Imperial Navy"), "Chaos " + c + " – Imperial " + i + " VP."]; },
    info: { bg: "The last great Imperial offensive in the sector before Gilleard’s Crusade aimed at the Blackness forge world. Led by Admiral Sedina Nidonia, the Armada stopped at Valeis, a Guard training world, to take its regiments aboard — and there the renegades struck, fireships first.", cr: [NEM + " " + pg(50) + "–51."] }
  },
  /* ------------------------------------------------------------ HISTORICAL: THE LONGEST TRAVEL */
  {
    id: "fan-n-longest", grp: "fan-nem", name: "The Longest Travel", series: "Nemesis sector · historical scenario", trust: "fan",
    why: "A Convoy variant: a Tau battleship carrying Ethereal envoys must cross a field of hidden Eldar raiders.", src: pg(52) + "–53", book: "O", suggest: ["Tau", "Eldar Corsairs"],
    others: "Any escort fleet with one big, slow ship to protect against any raiders. For the Ambassador class battleship the book suggests an Explorer with an Additional Shield Generator and one random refit, or a Custodian (FL p. 468).",
    sides: { a: { n: "Expedition", f: "Tau" }, b: { n: "Raiders", f: "Eldar" } },
    pitch: "The Ethereals send envoys to call their followers out of the sector’s war. Their ship has barely arrived when the Eldar fall on it.",
    glance: [["Points", "Expedition 1200, with the Fynd’yon · Raiders 700"], ["Table", "Not given — use your table"], ["Battlezone", "Deep space generator"], ["First turn", "Expedition"], ["Game ends", "The Fynd’yon leaves the table or is destroyed"]],
    bring: ["Contact markers: one per raider capital ship or squadron, plus D6 dummies", "A big ship for the Fynd’yon"],
    forces: { a: ["1200 pts, including the Ambassador class battleship Fynd’yon (Play tab)."], b: ["700 pts.", "Up to 200 of them may be escort squadrons from the Imperial or Chaos lists: allied human pirates."] },
    draw: (v, W, H) => [R(30, 30, W - 60, H - 60, "b", "", { dash: 1 }), { z: "text", x: W / 2, y: 38, l: "markers: 30 cm from edges, 30 cm apart", s: "b" },
      H > 90 ? R(0, 45, 8, H - 90, "a", "", { free: "x" }) : null, { z: "arrow", x1: 10, y1: H / 2, x2: 26, y2: H / 2, s: "a" }, { z: "text", x: 42, y: H / 2 + 8, l: "expedition enters", s: "a" },
      { z: "dim", x1: 4, y1: 0, x2: 4, y2: 45, l: "45 cm" }, { z: "edge", e: "r", s: "a", l: "The Fynd’yon must leave here" }],
    fit: () => [100, 100],
    mapNote: "The expedition enters from a short edge (rolled), not within 45 cm of either long edge, and must leave by the opposite short edge.",
    steps: [
      { t: "Generate celestial phenomena with the deep space generator (RB p. 108)." },
      { s: "b", t: "Place a face-down contact marker for each capital ship or squadron, plus D6 dummies (tool below): at least 30 cm apart and not within 30 cm of a table edge. Stack extra markers if they do not fit." },
      { s: "a", t: "Roll a D6 for the short edge you enter from and place one ship at the edge to mark the entry point, not within 45 cm of either long edge." },
      { s: "a", t: "You take the first turn. Ships that do not enter in turn 1 must enter in your second turn." }
    ],
    stools: [{ k: "val", id: "dum", s: "b", l: "Dummy markers (D6)", opts: [1, 2, 3, 4, 5, 6], roll: () => d6() }, { k: "roll", id: "edge", s: "a", l: "Which short edge do you enter from?", rows: () => [[1, 3, "The left short edge (seen from the raiders)"], [4, 6, "The right short edge (seen from the raiders)"]] }],
    notes: ["This is Convoy (RB p. 134–135) with the Fynd’yon as the only ship that counts. The book does not say how activated markers are deployed (“as follows” is missing); the default uses Convoy’s.", "The book has no rules for the Ambassador class: it suggests an Explorer with an Additional Shield Generator (RB p. 158) and one random refit, both paid for, or the Custodian from the Kor’Or’Vesh list (FL p. 468).", "The book does not say what happens if the Fynd’yon leaves by another edge; the default is our suggestion."],
    refs: [["Convoy", "RB p. 134–135"], ["Contact markers", "RB p. 134"], ["Explorer", "FL p. 458"], ["Custodian class battleship", "FL p. 468"], ["Ship refits", "RB p. 158"]],
    play: [
      { w: "Your movement", s: "a", t: "Any ship moving within 30 cm of a face-down marker reveals it: turn it over, then finish the move. After your movement phase the raiders deploy every revealed marker ({a:place})." },
      { w: "Start of the raiders’ movement", s: "b", t: "You may reveal one marker yourself — two if any expedition ship is on special orders." },
      { w: "The Fynd’yon", s: "a", t: "Get it off the opposite short edge. Leaving by any other edge: {a:other}." }
    ],
    fx: T => T === 2 ? [["a", "Last chance for expedition ships to enter"]] : [],
    tools: [],
    rtools: [{ k: "ending", id: "how", l: "How did it end?", rows: [["The Fynd’yon left by the far short edge, uncrippled", "a", "Expedition wins"], ["The Fynd’yon left by the far short edge, crippled", "b", "Raiders: marginal"], ["The Fynd’yon was destroyed", "b", "Raiders: total"], ["The Fynd’yon left by another edge", "b", "As agreed"]] }],
    end: ["The Fynd’yon leaves the table or is destroyed."],
    win: ["The Fynd’yon leaves by the opposite short edge uncrippled: expedition victory.", "It leaves that way crippled: the raiders’ marginal victory.", "It is destroyed: the raiders’ total victory."],
    result(st) { const i = get(st, "how", -1); return i < 0 ? [null, "Battle in progress", "Mark how the game ended."] : [["a", "Expedition victory"], ["b", "Raiders’ marginal victory"], ["b", "Raiders’ total victory"], ["b", "Raiders’ marginal victory (agreed)"]][i].concat(["The Fynd’yon’s fate decides the battle."]); },
    info: { bg: "Early in the Pirate War the Ethereals sent envoys to call their followers away from the madness, aboard the Ambassador class battleship Fynd’yon. It had only just arrived in the Nemesis sector when Avercenna’s Eldar fell on it.", cr: [NEM + " " + pg(52) + "–53. The book’s note: there are no rules for the Ambassador class yet."] }
  },
  /* ------------------------------------------------------------ TOURNAMENT: RECON IN FORCE */
  {
    id: "fan-n-recon", grp: "fan-nem", name: "Recon in Force", series: "Book of Nemesis · tournament scenario", trust: "fan",
    why: "Tournament scenario: each fleet starts with one battlegroup in a corner; the rest arrive from random edges.", src: pg(54), book: "O", suggest: null,
    others: "Any two fleets of equal points.",
    sides: { a: { n: "Player A" }, b: { n: "Player B" } },
    pitch: "High Command sends a reconnaissance force into a vast unknown region where the enemy fleet is most likely to be. Spreading out may win the battle — or lose it.",
    glance: [["Points", "Equal, in 3 battlegroups"], ["Table", "Not given — the map shows a long table"], ["Battlezone", "Agreed"], ["First turn", "Attack-rating roll"], ["Game ends", "After 8 turns, or one side has no ships left"]],
    bring: ["Celestial phenomena"],
    forces: { a: ["The agreed points, split into 3 battlegroups, each with at least 1 capital ship or 3 escorts."], b: ["The same."] },
    draw: (v, W, H) => { const L = Math.min(90, W / 2), S = Math.min(60, H / 2); return [{ z: "poly", pts: [[0, 0], [L, 0], [0, S]], s: "a" }, { z: "poly", pts: [[W, H], [W - L, H], [W, H - S]], s: "b" }, { z: "poly", pts: [[W, 0], [W - L, 0], [W, S]], s: "n" }, { z: "poly", pts: [[0, H], [L, H], [0, H - S]], s: "n" },
      { z: "text", x: L / 3, y: S / 3, l: "1", s: "a" }, { z: "text", x: W - L / 3, y: S / 3, l: "2", s: "n" }, { z: "text", x: W - L / 3, y: H - S / 3, l: "3", s: "b" }, { z: "text", x: L / 3, y: H - S / 3, l: "4", s: "n" },
      { z: "dim", x1: 0, y1: S + 6, x2: L, y2: S + 6, l: "" }, { z: "text", x: W / 2, y: H / 2, l: "corner zones: 90 cm along the long edge,\n60 cm along the short edge", s: "n" }]; },
    fit: () => [120, 80],
    mapNote: "The first player picks any corner (the map shows corner 1); the opponent takes the opposite one.",
    steps: [
      { t: "Set up celestial phenomena in any agreed way." },
      { t: "Split each fleet into 3 battlegroups, each with at least 1 capital ship or 3 escorts." },
      { t: "Roll off: the winner picks a corner and places one battlegroup there, chosen at random. The other player places one random battlegroup in the opposite corner. Everything else waits in reserve." },
      { t: "Roll attack ratings (Before the battle): the winner takes the first turn." }
    ],
    stools: [{ k: "rand", id: "bg", l: "Pick a battlegroup at random" }],
    notes: ["The book shows the corner zones as triangles, 90 cm along the long edge and 60 cm along the short one.", "“Friendly” and “enemy” edges are the two edges meeting at your starting corner and at the enemy’s."],
    refs: [["Attack ratings", "RB p. 120"], ["Victory points", "RB p. 122"]],
    play: [
      { w: "Start of each of your turns: reserves", t: "Roll a D6 for each battlegroup still in reserve; it arrives on 5+ if its slowest ship does 20 cm or less, 4+ at 25 cm, 3+ at 30 cm or more. Add +1 for every turn after the 2nd." },
      { w: "Arriving battlegroups", t: "Roll a D6 for the edge: 1 the enemy’s short edge, 2 the enemy’s long edge, 3–4 your short edge, 5–6 your long edge." }
    ],
    turnMax: () => 8,
    fx: T => [[null, "Start of each player turn: roll for battlegroups in reserve"]].concat(T === 8 ? [[null, "Last turn"]] : []),
    tools: [{ k: "info", html: st => { const m = Math.max(0, st.turn - 2), n = x => Math.max(2, x - m); return "<h3>Reserves: roll needed in turn " + st.turn + "</h3><table class='ltab'><tr><td>Slowest ship 20 cm or less</td><td>" + n(5) + "+</td></tr><tr><td>25 cm</td><td>" + n(4) + "+</td></tr><tr><td>30 cm or more</td><td>" + n(3) + "+</td></tr></table><p class='small muted' style='margin:6px 0 0'>+1 to the roll for every turn after the 2nd; a natural 1 is not mentioned by the book.</p>"; } },
      { k: "roll", id: "edge", l: "Where does it arrive?", rows: () => [[1, 1, "The enemy’s short edge"], [2, 2, "The enemy’s long edge"], [3, 4, "Your short edge"], [5, 6, "Your long edge"]] }],
    rtools: [{ k: "num", id: "va", s: "a", l: "Player A: victory points", after: v => v + " VP" }, { k: "num", id: "vb", s: "b", l: "Player B: victory points", after: v => v + " VP" }],
    end: ["After 8 turns, or when one side has no ships left on the table."],
    win: ["Victory points as normal (RB p. 122); the highest total wins."],
    result(st) { const a = num(st, "va"), b = num(st, "vb"); if (!a && !b) return [null, "Count victory points", "Enter both totals below."]; return a === b ? ["draw", "Level", "Both " + a + " VP."] : [a > b ? "a" : "b", wins(a > b ? "Player A" : "Player B"), "A " + a + " – B " + b + " VP."]; },
    info: { bg: "A reconnaissance in force heads into a huge unexplored region where the enemy fleet is thought to lie. Scattering the fleet may find the enemy faster — or hand it over piece by piece.", cr: [NEM + " " + pg(54) + ". Play-tested at several events, the book says."] }
  },
  /* ------------------------------------------------------------ TOURNAMENT: TEARING THE FLANKS */
  {
    id: "fan-n-flanks", grp: "fan-nem", name: "Tearing the Flanks", series: "Book of Nemesis · tournament scenario", trust: "fan",
    why: "Tournament scenario: both fleets deploy broadside-on, spread across three sectors, heading a random way.", src: pg(55), book: "K", suggest: null,
    others: "Any two fleets of equal points.",
    sides: { a: { n: "Player A" }, b: { n: "Player B" } },
    pitch: "“Enemy fleet to starboard! Come to new heading and fire at will!” Two lines of battle pass each other — and the first to turn in wins.",
    glance: [["Points", "Equal"], ["Table", "Not given — the map shows a long table"], ["Battlezone", "Agreed"], ["First turn", "Attack-rating roll"], ["Game ends", "A fleet disengages or is destroyed"]],
    bring: ["Celestial phenomena"],
    forces: { a: ["The agreed points."], b: ["The same."] },
    draw: (v, W, H) => { const w = W / 3, out = []; ["A", "B", "C"].forEach((l, i) => { out.push(R(i * w, 0, w, 30, "a", l)); out.push(R(i * w, H - 30, w, 30, "b", l + "′")); });
      return out.concat([{ z: "arrow", x1: W / 2 - 12, y1: H / 2 - 7, x2: W / 2 + 12, y2: H / 2 - 7, s: "n" }, { z: "arrow", x1: W / 2 + 12, y1: H / 2 + 7, x2: W / 2 - 12, y2: H / 2 + 7, s: "n" }, { z: "text", x: W / 2, y: H / 2 + 18, l: "parallel to the long edges,\nheading a random way", s: "n" }]); },
    fit: () => [90, 80],
    mapNote: "Each zone is 30 cm deep along a long edge, 60 cm apart, divided into three equal sectors.",
    steps: [
      { t: "Set up celestial phenomena in any agreed way." },
      { t: "Roll off: the winner chooses a deployment zone. Each player rolls for the direction their fleet faces (tools below)." },
      { t: "The winner deploys the whole fleet, then the opponent. Every ship parallel to the long edges, facing the rolled way, with at least one capital ship or escort squadron in each of the three sectors." },
      { t: "Roll attack ratings (Before the battle): the winner takes the first turn." }
    ],
    stools: [{ k: "roll", id: "da", s: "a", l: "Player A: which way do you face?", rows: () => [[1, 3, "Left to right"], [4, 6, "Right to left"]] }, { k: "roll", id: "db", s: "b", l: "Player B: which way do you face?", rows: () => [[1, 3, "Left to right"], [4, 6, "Right to left"]] }],
    notes: ["The book’s direction roll does not say whose left and right; read it from your own long edge, or agree one view for both fleets before rolling.", "The book does not say whether one roll covers both fleets; here each fleet rolls."],
    refs: [["Attack ratings", "RB p. 120"], ["Victory points", "RB p. 122"]],
    play: [{ w: "No special rules", t: "Standard victory points for ships crippled or destroyed." }],
    tools: [],
    rtools: [{ k: "num", id: "va", s: "a", l: "Player A: victory points", after: v => v + " VP" }, { k: "num", id: "vb", s: "b", l: "Player B: victory points", after: v => v + " VP" }],
    end: ["One fleet disengages or is destroyed."],
    win: ["Standard victory points for ships crippled or destroyed (RB p. 122); most points wins."],
    result(st) { const a = num(st, "va"), b = num(st, "vb"); if (!a && !b) return [null, "Count victory points", "Enter both totals below."]; return a === b ? ["draw", "Level", "Both " + a + " VP."] : [a > b ? "a" : "b", wins(a > b ? "Player A" : "Player B"), "A " + a + " – B " + b + " VP."]; },
    info: { bg: "Two battle lines meet broadside-on, already moving. Whoever turns into the enemy’s flank first — or tears it open — will decide the day.", cr: [NEM + " " + pg(55) + "."] }
  },
  /* ------------------------------------------------------------ TOURNAMENT: TITAN CLASH */
  {
    id: "fan-n-titan", grp: "fan-nem", name: "Titan Clash", series: "Book of Nemesis · tournament scenario", trust: "fan",
    why: "Tournament scenario: a straight fleet battle, with an optional race to board the enemy flagship.", src: pg(56), book: "K", suggest: null,
    others: "Any two fleets of equal points.",
    sides: { a: { n: "Player A" }, b: { n: "Player B" } },
    variants: [["std", "Standard"], ["intel", "Intelligence service"]],
    pitch: v => v === "intel" ? "Take, burn or destroy the enemy fleet — and be the first to put a boarding party on its flagship for the secrets aboard." : "Take, burn or destroy the enemy fleet.",
    glance: [["Points", "Equal"], ["Table", "Not given — the map shows a long table"], ["Battlezone", "Agreed"], ["First turn", "Attack-rating roll"], ["Game ends", "A fleet disengages or is destroyed"]],
    bring: ["Celestial phenomena"],
    forces: { a: ["The agreed points."], b: ["The same."] },
    draw: (v, W, H) => [R(0, 0, W, 30, "a", "Player A: 30 cm"), R(0, H - 30, W, 30, "b", "Player B: 30 cm")],
    fit: () => [60, 80],
    mapNote: "The roll-off winner picks either zone.",
    steps: [
      { t: "Set up celestial phenomena in any agreed way." },
      { t: "Roll off: the winner chooses a zone and deploys the whole fleet, 30 cm deep along a long edge; the opponent deploys in the other." },
      { t: "Roll attack ratings (Before the battle): the winner takes the first turn." }
    ],
    stools: [],
    notes: ["Intelligence service is the book’s optional extra: the spy, documents or samples are aboard the flagships."],
    refs: [["Boarding actions", "RB p. 89–90"], ["Hit-and-run attacks", "RB p. 91"], ["Attack ratings", "RB p. 120"], ["Victory points", "RB p. 122"]],
    play: [{ only: ["std"], w: "No special rules", t: "Standard victory points for ships crippled or destroyed." },
      { only: ["intel"], w: "Intelligence service", t: "The first player to win a boarding action or a hit-and-run attack against the enemy flagship scores an extra 200 VP." }],
    tools: [],
    rtools: [{ k: "num", id: "va", s: "a", l: "Player A: victory points", after: v => v + " VP" }, { k: "num", id: "vb", s: "b", l: "Player B: victory points", after: v => v + " VP" }, { k: "pick", id: "intel", only: ["intel"], l: "First to board or raid the enemy flagship", rows: [["Player A", "+200 VP"], ["Player B", "+200 VP"], ["Nobody", ""]] }],
    end: ["One fleet disengages or is destroyed."],
    win: v => ["Standard victory points for ships crippled or destroyed (RB p. 122); most points wins."].concat(v === "intel" ? ["+200 VP to the first player to board or hit-and-run the enemy flagship."] : []),
    result(st, v) { const i = v === "intel" ? get(st, "intel", -1) : -1, a = num(st, "va") + (i === 0 ? 200 : 0), b = num(st, "vb") + (i === 1 ? 200 : 0); if (!a && !b) return [null, "Count victory points", "Enter both totals below."]; return a === b ? ["draw", "Level", "Both " + a + " VP."] : [a > b ? "a" : "b", wins(a > b ? "Player A" : "Player B"), "A " + a + " – B " + b + " VP."]; },
    info: { bg: "Sometimes there is no clever plan: two fleets meet and fight it out. Bring me the head of the enemy admiral, as one Ork warboss puts it in the book.", cr: [NEM + " " + pg(56) + "."] }
  },
  /* ------------------------------------------------------------ TOURNAMENT: CAPTURE THE HULK */
  {
    id: "fan-n-hulk", grp: "fan-nem", name: "Capture the Hulk", series: "Book of Nemesis · tournament scenario", trust: "fan",
    why: "Tournament scenario: board a derelict hulk for its treasure and get it off the table — 500 VP if you make it.", src: pg(57), book: "O", suggest: null,
    others: "Any two fleets of equal points.",
    sides: { a: { n: "Player A" }, b: { n: "Player B" } },
    pitch: "An unidentified hulk has just been thrown out of the warp, probably full of ancient technology. The only problem is the enemy fleet.",
    glance: [["Points", "Equal"], ["Table", "Not given — the map shows a long table"], ["Battlezone", "Agreed; a hulk in the middle"], ["First turn", "Attack-rating roll"], ["Game ends", "A fleet disengages or is destroyed"]],
    bring: ["A hulk model (3 hits)", "Celestial phenomena", "A marker for the booty"],
    forces: { a: ["The agreed points."], b: ["The same."] },
    draw: (v, W, H) => [R(0, 0, W, 15, "a", "Player A: 15 cm"), R(0, H - 15, W, 15, "b", "Player B: 15 cm"), { z: "mark", x: W / 2, y: H / 2, s: "n", l: "the hulk" }],
    fit: () => [60, 60],
    mapNote: "The roll-off winner picks either zone.",
    steps: [
      { t: "Set up celestial phenomena in any agreed way, and place the hulk in the middle of the table." },
      { t: "Roll off: the winner chooses a zone, 15 cm deep along a long edge; deploy as the map shows ({a:dep})." },
      { t: "Roll attack ratings (Before the battle): the winner takes the first turn." }
    ],
    stools: [],
    notes: ["The book gives the order of choosing zones but not of placing ships; the default is our suggestion.", "Booty lost to something nobody did — a solar flare, say — costs and gives nobody anything."],
    refs: [["Boarding actions", "RB p. 89–90"], ["Disengaging", "RB p. 56"], ["Attack ratings", "RB p. 120"], ["Victory points", "RB p. 122"]],
    play: [
      { w: "The hulk", t: "3 hits, no turrets or shields. Only one ship from each side may try to board it at a time. A failed boarding action does nothing to the boarding ship: the booty just has not been found yet." },
      { w: "Finding the booty", t: "A capital ship that boards the hulk successfully takes the booty aboard. Then it has to disengage with it." },
      { w: "Losing the booty", t: "If the enemy boards the carrier successfully, the booty passes to the boarding ship — and so on until it leaves the table. If the carrier is destroyed, so is the booty." }
    ],
    tools: [],
    rtools: [{ k: "num", id: "va", s: "a", l: "Player A: victory points", after: v => v + " VP" }, { k: "num", id: "vb", s: "b", l: "Player B: victory points", after: v => v + " VP" },
      { k: "pick", id: "boot", l: "The booty", rows: [["Escaped with Player A", "A +500"], ["Escaped with Player B", "B +500"], ["Destroyed by Player A", "A −400"], ["Destroyed by Player B", "B −400"], ["Lost to a celestial phenomenon", "nothing"], ["Never found", "nothing"]] }],
    end: ["One fleet disengages or is destroyed."],
    win: ["Standard victory points (RB p. 122).", "Escaping with the booty: +500 VP. Destroying the ship that carries it: −400 VP for the side that did it.", "Most victory points wins."],
    result(st) { const b = get(st, "boot", -1), a = num(st, "va") + (b === 0 ? 500 : b === 2 ? -400 : 0), c = num(st, "vb") + (b === 1 ? 500 : b === 3 ? -400 : 0); if (!num(st, "va") && !num(st, "vb") && b < 0) return [null, "Count victory points", "Enter both totals and the booty’s fate below."]; return a === c ? ["draw", "Level", "Both " + a + " VP."] : [a > c ? "a" : "b", wins(a > c ? "Player A" : "Player B"), "A " + a + " – B " + c + " VP."]; },
    info: { bg: "Your fleet has detected an unidentified hulk just thrown out of the warp. It may carry ancient technology or other treasures of the past — and the enemy has detected it too.", cr: [NEM + " " + pg(57) + "."] }
  },
  /* ------------------------------------------------------------ SPECIAL: AMBUSH */
  {
    id: "fan-n-ambush", grp: "fan-nem", name: "Ambush", series: "Book of Nemesis · special scenario · three players", trust: "fan", players: 3,
    why: "Two small allied fleets ambush one twice their size: a scenario for events with an odd number of players.", src: pg(58), book: "K", suggest: null,
    others: "Any three fleets: two small allied attackers against one large defender.",
    sides: { a: { n: "Attacker 1" }, b: { n: "Defender" }, c: { n: "Attacker 2" } },
    pitch: "Two light, fast allied fleets lie in wait for a heavier enemy force, ready to strike it from two sides at once.",
    glance: [["Points", "Two attackers of 500–750 each · Defender twice that"], ["Table", "Not given — use your table"], ["Battlezone", "Standard generator, two dice each time"], ["First turn", "Roll-off, attackers +1"], ["Game ends", "Not given — see Agree"]],
    bring: ["Celestial phenomena"],
    forces: { a: ["500–750 pts, its own fleet in every respect (composition, re-rolls)."], b: ["Twice the size: 1000–1500 pts."], c: ["500–750 pts, its own fleet in every respect."] },
    draw: (v, W, H, st, sc) => { const z = agN(sc, st, "zone"); return [R(0, 0, z, z, "n", "A"), R(W - z, 0, z, z, "n", "B"), R(0, H - z, z, z, "n", "C"), R(W - z, H - z, z, z, "n", "D"),
      { z: "dim", x1: z, y1: z / 2, x2: W - z, y2: z / 2, l: "" }, { z: "text", x: W / 2, y: H / 2, l: "four corner zones;\nthe attackers may not share one", s: "n" }]; },
    fit: () => [100, 80],
    mapNote: "Four corner zones, {a:zone} cm square. Each fleet takes one; the two attacking fleets may not share a zone.",
    steps: [
      { t: "Generate celestial phenomena with the standard generator, but roll two dice each time: the attackers choose which one to use." },
      { t: "Roll attack ratings to decide the order of choosing zones (re-roll ties). If the two attacking fleets’ ratings differ, the attackers use the lower one. Each fleet takes a different corner zone." },
      { t: "Both sides roll a D6, the attackers adding +1: the higher roll chooses who takes the first turn. The two attacking fleets take their turn together." }
    ],
    stools: [],
    notes: ["The book’s Game Length paragraph repeats the victory conditions by mistake, so the game’s length is open; the default is the rulebook’s for a fleet battle.", "Zone size is read from the book’s map: square corner zones 60 cm apart along both edges."],
    refs: [["Battlezone generators", "RB p. 107–108"], ["Attack ratings", "RB p. 120"], ["Victory points", "RB p. 122"]],
    play: [{ w: "Two attacking fleets", t: "They are separate fleets for composition and re-rolls, but one side: they win or lose together. Game length: {a:len}." }],
    tools: [],
    rtools: [{ k: "num", id: "va", s: "a", l: "Attackers: victory points (both fleets)", after: v => v + " VP" }, { k: "num", id: "vb", s: "b", l: "Defender: victory points", after: v => v + " VP" }],
    end: ["{a:len}."],
    win: ["Both sides score victory points as normal (RB p. 122); the higher total wins."],
    result(st) { const a = num(st, "va"), b = num(st, "vb"); if (!a && !b) return [null, "Count victory points", "Enter both sides’ totals below."]; return a === b ? ["draw", "Level", "Both " + a + " VP."] : [a > b ? "a" : "b", a > b ? "The attackers win" : "The defender wins", "Attackers " + a + " – Defender " + b + " VP."]; },
    info: { bg: "Small, fast fleets sometimes join forces against a heavier common enemy. The book offers this as an example of a two-sided game for three players, so that nobody sits out at an event.", cr: [NEM + " " + pg(58) + "."] }
  },
  /* ------------------------------------------------------------ SPECIAL: GUNNERY PRACTICE */
  {
    id: "fan-n-gunnery", grp: "fan-nem", name: "Gunnery Practice", series: "Book of Nemesis · solo scenario", trust: "fan", players: 1,
    why: "A solo game: one green cruiser shoots at a stream of asteroids for six turns — and must come out without a scratch.", src: pg(59), book: "O", suggest: null,
    others: "Any fleet’s cruiser with the lowest Leadership you can give it.",
    sides: { a: { n: "Your cruiser" }, b: { n: "Asteroids" } },
    pitch: "Green crews learn to shoot on asteroids. It is dangerous enough that the Navy loses a few ships doing it — and nothing motivates recruits like real danger.",
    glance: [["Points", "One cruiser"], ["Table", "About 120 × 120 cm"], ["Battlezone", "No celestial phenomena"], ["First turn", "Yours, every turn"], ["Game ends", "After 6 turns, or the cruiser is destroyed"]],
    bring: ["One cruiser", "Plenty of small asteroids — stones or kitty litter", "Small dice to mark each asteroid’s hits", "A D10 and a scatter dice"],
    forces: { a: ["One cruiser with the lowest Leadership possible in your fleet."], b: ["Asteroids: 2D6 enter every turn."] },
    draw: (v, W, H) => [{ z: "edge", e: "t", s: "b", l: "asteroids’ entry edge: 10 zones" }, { z: "tick", e: "t", s: "b", list: Array.from({ length: 10 }, (x, i) => [W * (i + .5) / 10, String(i + 1)]) },
      { z: "mark", x: W / 2, y: H / 2, s: "a", l: "your cruiser" }, { z: "arrow", x1: W - 14, y1: 24, x2: W - 14, y2: H - 20, s: "b" }, { z: "text", x: W - 26, y: H / 2, l: "4D6 cm a turn", s: "b", rot: -90 }],
    fit: () => [90, 90], srcTable: [120, 120],
    mapNote: "Your cruiser starts in the middle, facing a random way. The asteroids come from one edge, divided into 10 equal zones, and move toward the opposite edge.",
    steps: [
      { t: "Clear the table: no celestial phenomena." },
      { t: "Name the asteroids’ entry edge and divide it into 10 equal zones." },
      { s: "a", t: "Place your cruiser in the middle of the table and roll a scatter dice for its facing." }
    ],
    stools: [],
    notes: ["The book does not say whether one 4D6 roll moves every asteroid or each rolls its own; the default is our suggestion.", "In a campaign (if your opponents agree): failing the training costs 1 Renown, a damaged cruiser 2, crippled 4, destroyed 7. Completing it earns a crew promotion roll. Only green crews may train."],
    refs: [["Asteroid fields", "RB p. 110"], ["Leadership", "RB p. 45"], ["Renown", "RB p. 152"]],
    play: [
      { w: "Start of your turn", s: "b", t: "Roll 2D6: that many asteroids enter. Roll a D10 for each one’s zone and a D6 for its hits (mark it with a small die). Then move every asteroid on the table 4D6 cm toward the opposite edge ({a:move})." },
      { w: "An asteroid passing you", s: "a", t: "Avoid it as you would an asteroid field (RB p. 110), but at −1 Leadership for its speed." },
      { w: "Shooting", s: "a", t: "Shoot at the asteroids as normal: armour 6, no turrets, no shields. Place D3 blast markers when you destroy one." }
    ],
    turnMax: () => 6,
    fx: T => [["b", "2D6 new asteroids, then all move 4D6 cm"]].concat(T === 6 ? [[null, "Last turn"]] : []),
    tools: [{ k: "val", id: "n", s: "b", l: "Asteroids entering (2D6)", opts: [], roll: () => d6() + d6() },
      { k: "shiproll", id: "ast", s: "b", l: "New asteroids: zone and hits", cl: "Asteroids", n0: st => get(st, "n", 0) || 7, roll: () => [dn(10), d6()], btn: n => "Roll " + n, il: i => "Asteroid " + (i + 1), out: d => "zone " + d[0] + ", " + d[1] + " hit" + (d[1] > 1 ? "s" : "") },
      { k: "val", id: "mv", s: "b", l: "Asteroid move (4D6 cm)", opts: [], roll: () => d6() + d6() + d6() + d6(), unit: " cm" },
      { k: "counter", id: "kill", s: "a", res: 1, l: "Asteroids destroyed" }],
    rtools: [{ k: "pick", id: "ship", l: "Your cruiser at the end", rows: [["Undamaged", ""], ["Damaged", ""], ["Crippled", ""], ["Destroyed", ""]] }],
    end: ["After six complete turns, or when your cruiser is destroyed."],
    win: ["Your cruiser is still on the table, undamaged, at the end of turn 6, and you destroyed at least one asteroid: you win."],
    result(st) { const s = get(st, "ship", -1), k = get(st, "kill", 0); if (s < 0) return [null, "Training in progress", "Mark your cruiser’s state below."]; return s === 0 && k > 0 ? ["a", "Training passed", k + " asteroid" + (k === 1 ? "" : "s") + " destroyed, not a scratch."] : ["b", "Training failed", s === 0 ? "No asteroid destroyed." : "The cruiser was " + ["", "damaged", "crippled", "destroyed"][s] + " — there is little more shameful than losing to a pile of stones."]; },
    info: { bg: "Green crews are often sent into dangerous regions to practise gunnery on asteroids. It is risky enough that the Imperial Navy loses a few ships doing it — but nothing motivates recruits like real danger.", cr: [NEM + " " + pg(59) + "."] }
  }
  ]);
})();
