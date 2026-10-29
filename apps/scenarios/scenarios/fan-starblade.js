/* Fan supplements: Starblade — Akaeris & Eriel, by Roy "horizon" Amkreutz. A poem in nine chapters
   and nine scenarios (p. 22–30) following the Eldar captain Akaeris Starblade from the fall of his
   craftworld Shànn-Tal into the Eye of Terror. Fixed, named forces; every ship is in the Fleets book
   (the Craftworld Eldar list, FL p. 316–332). Page numbers are PDF pages.
   Summarised in our own words; every scenario is hand-made (see docs/history/scenarios/LUEMINUT.md, in Finnish). */
(function () {
  const SB = "Starblade — Akaeris & Eriel: words and scenarios by Roy “horizon” Amkreutz; cover, illustrations and page design by K. “Khar” Górniak, with art by Ainagoz Marina and Longinius.";
  const SBP = n => "Starblade p. " + n;
  const OTHERS = "Written for Akaeris’ Craftworld Eldar and their named ships. Any fleets can play with ships of similar size; the Spirit of Arina is the Flame of Asuryan (FL p. 327), and any Eldar flagship cruiser can stand in for it.";
  const ARINA = "The Spirit of Arina is the Flame of Asuryan (FL p. 327) with one change: no Aspect Warrior crew — it carries Vampire raiders instead, which the Fleets book’s Flame already has. The scenarios may also be played with the fan Eldar MMS rules, using the Void Dragon profile.";
  const PHANTOM = "“Phantom lances” on the Shadowhunters are the Fleets book’s shadow lances (FL p. 330).";
  const EL = { n: "Eldar", f: "Craftworld Eldar: Akaeris Starblade" };
  const SHIPS = "<h3>Akaeris’ ships</h3><ul class='plain small'><li><b>Spirit of Arina</b> — the Flame of Asuryan (FL p. 327), without its Aspect Warrior crew</li><li><b>Cerysheal</b> — Dragonship (FL p. 328): weapons battery and launch bays</li><li><b>Eternity, Destiny</b> — Wraithships (FL p. 329): pulsar lance and torpedoes</li><li><b>Starspeed</b> — Shadowhunters (FL p. 330), mixed batteries and shadow lances</li><li><b>Arith Kian, Oriosa Novar, Bennan Bahar, Karun Lir</b> — Corsair Aconites, Hemlocks and Nightshades (FL p. 324–326)</li></ul>";
  const vp = (st, a, b) => { const x = num(st, "va"), y = num(st, "vb"); if (!x && !y) return [null, "Count victory points", "Enter both totals below."]; return x === y ? ["draw", "Level", "Both " + x + " VP."] : [x > y ? "a" : "b", wins(x > y ? a : b), a + " " + x + " – " + b + " " + y + " VP."]; };
  const vpTools = (a, b) => [{ k: "num", id: "va", s: "a", l: a + ": victory points", after: v => v + " VP" }, { k: "num", id: "vb", s: "b", l: b + ": victory points", after: v => v + " VP" }];
  const swap = items => items.map(it => it && (it.s === "a" || it.s === "b") ? Object.assign({}, it, { s: it.s === "a" ? "b" : "a" }) : it);
  /* asteroid squares rolled with the terrain tool, drawn on the map */
  const squares = (W, H, st, id) => { const g = gridOf(W, H, 60), r = null /* the tool is the generator (terrain-map.js tool) */, out = [];
    for (let i = 1; i < g.c; i++) out.push({ z: "line", x1: i * g.sw, y1: 0, x2: i * g.sw, y2: H }); for (let j = 1; j < g.r; j++) out.push({ z: "line", x1: 0, y1: j * g.sh, x2: W, y2: j * g.sh });
    if (r && r.length === g.c * g.r) r.forEach((x, i) => out.push({ z: "text", x: (i % g.c + .5) * g.sw, y: (Math.floor(i / g.c) + .5) * g.sh, l: x, s: "n" }));
    return out; };
  const AST = { k: "terrain", id: "ast", l: "Asteroid fields per square", sub: "D3 asteroid fields for every 60 cm square — shown on the map", size: 60, rows: [[1, 2, "1 asteroid field", "1"], [3, 4, "2 asteroid fields", "2"], [5, 6, "3 asteroid fields", "3"]] };

  addScenarios([
  /* ------------------------------------------------------------ I DARK CRESCENT MOON */
  {
    id: "fan-s-crescent", grp: "fan-sb", name: "Dark Crescent Moon", series: "Starblade · Scenario I", trust: "fan",
    why: "Two Eldar ships race through an Ork-held asteroid field, past hidden contacts, to answer a call from home.", src: SBP(22), book: "O", suggest: ["Craftworld Eldar", "Orks"],
    others: OTHERS,
    sides: { a: EL, b: { n: "Orks", f: "Orks" } },
    pitch: "A telepathic cry from Farseer Eriel reaches Akaeris mid-strike against an Ork fleet. He turns for home at once — straight through the Orks’ asteroid field.",
    glance: [["Points", "Fixed: 2 Eldar ships against an Ork squadron force"], ["Table", "180 × 120 cm"], ["Battlezone", "D3 asteroid fields in every 60 cm square"], ["First turn", "Eldar"], ["Game ends", "The Eldar get through, or the Spirit of Arina dies"]],
    bring: ["The Spirit of Arina and the Wraithship Eternity", "An Ork Terror ship and 12 escorts", "6 contact markers: 4 for the Ork groups, 2 blanks", "Plenty of asteroid fields"],
    forces: { a: ["Spirit of Arina, Admiral Akaeris Starblade: Ld 9, 1 re-roll.", "Wraithship Eternity: Ld 8, pulsar lance and torpedoes."], b: ["Terror Kroozer Da Basha (a Terror ship, FL p. 382), Warlord Thruk Usha: Ld 8, 1 re-roll.", "6 Onslaught attack ships “Koolz Dakka”, Ld 5.", "3 Ravager attack ships “Wold Krusha”, Ld 7.", "3 Savage gunships “Meen Leens”, Ld 6.", "Split into four equal groups, each under a contact marker, plus 2 blank markers."] },
    draw: (v, W, H, st) => squares(W, H, st, "ast").concat([{ z: "sun", e: "l" }, R(0, 30, 6, Math.max(4, H - 60), "a", "", { free: "x" }), { z: "arrow", x1: 8, y1: H / 2, x2: 26, y2: H / 2, s: "a" },
      R(60, 0, W - 60, H, "b", "", { dash: 1 }), { z: "edge", e: "r", s: "a", l: "the Eldar escape here" }]),
    fit: () => [150, 90], srcTable: [180, 120],
    mapNote: "The Eldar enter from the sunward short edge, at least 30 cm from the long edges, and must leave by the far short edge. Ork markers go in the dashed area, at least 60 cm from the sunward edge and 50 cm apart. Numbers: asteroid fields rolled for each square.",
    steps: [
      { t: "Make one short edge sunward. Divide the table into 60 cm squares and place D3 asteroid fields in each (tool below)." },
      { s: "b", t: "Split your fleet into four equal groups, one per contact marker, and add two blank markers. Place them face down anywhere at least 60 cm from the sunward edge and 50 cm apart." },
      { s: "a", t: "Your two ships enter from the sunward short edge, at least 30 cm from the long edges." },
      { s: "a", t: "You take the first turn." }
    ],
    stools: [AST],
    notes: [ARINA, "Linked games: keep the Eldar ships’ damage and critical hits for the next scenario, Veil of Sorrow.", "Losing the Eternity does not lose the scenario: only the Spirit of Arina’s fate counts."],
    refs: [["Contact markers", "RB p. 134–135"], ["Flame of Asuryan", "FL p. 329"], ["Wraithship", "FL p. 329"], ["Terror ship", "FL p. 382"], ["Onslaught attack ship", "FL p. 384"], ["Asteroid fields", "RB p. 110"]],
    play: [
      { w: "Contact markers", s: "a", t: "As in Convoy (RB p. 134–135): an Eldar ship moving within 30 cm reveals a marker; the Orks deploy the group under it after your movement phase. Blank markers are removed." },
      { w: "Start of the Ork movement", s: "b", t: "You may reveal one marker yourself — two if an Eldar ship is on special orders." }
    ],
    tools: [{ k: "html", html: SHIPS }],
    rtools: [{ k: "ending", id: "how", l: "How did it end?", rows: [["The Eldar left by the far short edge", "a"], ["The Spirit of Arina was destroyed", "b"]] }],
    end: ["The Eldar ships leave by the short edge opposite the one they entered, or the Spirit of Arina is destroyed."],
    win: ["Eldar: get out by the far short edge.", "Orks: destroy the Spirit of Arina."],
    result(st, v, S) { return endingResult(st, S, "how"); },
    info: { bg: "Akaeris is leading a pre-emptive strike on a massed Ork fleet when a long-travelled telepathic message from Eriel, a gifted Farseer of his craftworld, finds him. He turns his ship, the Spirit of Arina, for home — the race has begun.", cr: [SB + " " + SBP(22) + "; the poem’s first chapter, p. 4."] }
  },
  /* ------------------------------------------------------------ II VEIL OF SORROW */
  {
    id: "fan-s-veil", grp: "fan-sb", name: "Veil of Sorrow", series: "Starblade · Scenario II", trust: "fan",
    why: "Akaeris catches up with fleeing Eldar ships just ahead of a Nurgle fleet.", src: SBP(23), book: "O", suggest: ["Craftworld Eldar", "Chaos"],
    others: OTHERS,
    sides: { a: EL, b: { n: "Chaos", f: "Chaos: Mark of Nurgle" } },
    pitch: "The survivors of Shànn-Tal flee with a Chaos fleet on their heels. Akaeris pushes his ship past its limits to reach them first.",
    glance: [["Points", "Fixed forces"], ["Table", "180 × 120 cm"], ["Battlezone", "Agreed phenomena; a sunward short edge"], ["First turn", "Eldar"], ["Game ends", "Victory points"]],
    bring: ["Two Wraithships, a Dragonship, 4 Shadowhunters and the Spirit of Arina", "A Chaos force: 3 cruisers, 6 escorts"],
    forces: { a: ["Spirit of Arina, Admiral Akaeris Starblade: Ld 9, 1 re-roll, and the Wraithship Eternity, Ld 8 — with the damage they took in Dark Crescent Moon.", "Fleeing: Dragonship Cerysheal (weapons battery and launch bays), 2 hits down, with Farseer Eriel Erychien: Ld 10.", "Fleeing: Wraithship Destiny (pulsar lance and torpedoes), 3 hits down and so crippled: Ld 9.", "Fleeing: 4 Shadowhunters “Starspeed”, two with weapons batteries and two with lances: Ld 8."], b: ["Devastation class cruiser Herald of Plague, Overlord Laquinix: Ld 8, Mark of Nurgle, 1 re-roll.", "Murder class cruiser Chagranathar: Ld 7, 2 hits down.", "Slaughter class cruiser The Locust Torch: Ld 6, 1 hit down.", "3 Idolators “Saataar”, Ld 8, and 3 Iconoclasts “Decaying Purgatory”, Ld 7."] },
    draw: (v, W, H) => [{ z: "sun", e: "l" }, R(0, 30, 6, Math.max(4, H - 60), "a", "", { free: "x" }), { z: "arrow", x1: 8, y1: H / 2, x2: 26, y2: H / 2, s: "a" }, { z: "text", x: 36, y: H / 2 + 10, l: "Akaeris enters", s: "a" },
      R(Math.max(20, W - 64), 50, 8, Math.max(4, H - 100), "a", "", { free: "x" }), { z: "line", x1: Math.max(24, W - 60), y1: 50, x2: Math.max(24, W - 60), y2: Math.max(54, H - 50) }, { z: "text", x: Math.max(20, W - 64) - 20, y: H / 2, l: "fleeing ships", s: "a", rot: -90 }, R(W - 10, 0, 10, H, "b", ""), { z: "text", x: W - 22, y: 14, l: "Chaos", s: "b" }],
    fit: () => [150, 110], srcTable: [180, 120],
    mapNote: "The fleeing ships start 60 cm from the far short edge, at least 50 cm from the long edges, facing the sunward edge. Chaos sets up within 10 cm of the far short edge.",
    steps: [
      { t: "Make one short edge sunward and set up celestial phenomena in an agreed way." },
      { s: "b", t: "Deploy within 10 cm of the short edge opposite the sunward edge." },
      { s: "a", t: "Place the fleeing ships 60 cm from that same far edge, at least 50 cm from the long edges, facing the sunward edge. The Spirit of Arina and the Eternity enter from the sunward edge, at least 30 cm from the long edges." },
      { s: "a", t: "You take the first turn." }
    ],
    stools: [],
    notes: [ARINA, PHANTOM, "Linked games: the Spirit of Arina and the Eternity keep the damage and critical hits suffered in Dark Crescent Moon."],
    refs: [["Dragonship", "FL p. 328"], ["Wraithship", "FL p. 329"], ["Shadowhunter", "FL p. 330"], ["Devastation class cruiser", "FL p. 278"], ["Marks of Chaos", "FL p. 232"], ["Victory points", "RB p. 122"]],
    play: [{ w: "No special rules", t: "Standard victory conditions." }],
    tools: [{ k: "html", html: SHIPS }],
    rtools: vpTools("Eldar", "Chaos"),
    end: ["Not given: a fleet is destroyed or disengages, as the rulebook’s battles (RB p. 143)."],
    win: ["Standard victory points (RB p. 122); most points wins."],
    result(st) { return vp(st, "Eldar", "Chaos"); },
    info: { bg: "With the Ork hulks blazing behind him, Akaeris races on. His wayfinders find fleeing Eldar ships led by Farseer Eriel Erychien, a vile Chaos fleet close on their trail.", cr: [SB + " " + SBP(23) + "; the poem’s second chapter, p. 6."] }
  },
  /* ------------------------------------------------------------ III A PATH OF SHADOWS */
  {
    id: "fan-s-path", grp: "fan-sb", name: "A Path of Shadows", series: "Starblade · Scenario III", trust: "fan",
    why: "Slip assault boats onto an Imperial space station to pick up an informant, then get the flagship away.", src: SBP(24), book: "O", suggest: ["Craftworld Eldar", "Imperial Navy"],
    others: OTHERS,
    sides: { a: EL, b: { n: "Imperial Navy", f: "Imperial Navy" } },
    pitch: "Eriel’s vision leads into Imperial space. Aspect Warriors must board the station Larish Quovis and bring out the one person who knows where Shànn-Tal’s killers went.",
    glance: [["Points", "Fixed forces"], ["Table", "180 × 120 cm"], ["Battlezone", "A space station and a small planet; D3 asteroid fields, D3 gas clouds"], ["First turn", "Eldar"], ["Game ends", "The informant is out, or the Spirit of Arina is lost"]],
    bring: ["A space station (FL p. 507) and a small planet", "D3 asteroid fields and D3 gas or dust clouds", "An Imperial force: an Overlord, a Lunar, 2 Dauntless, 8 escorts"],
    forces: { a: ["Spirit of Arina, Admiral Akaeris Starblade: Ld 9, 1 re-roll.", "Dragonship Cerysheal, Farseer Eriel Erychien: Ld 10 (weapons battery and launch bays).", "Wraithships Eternity (Ld 8) and Destiny (Ld 9): pulsar lances and torpedoes.", "3 Shadowhunters “Starspeed”: two with weapons batteries, one with a lance; Ld 9."], b: ["Space station Larish Quovis: Ld 8.", "Overlord class battlecruiser Blazing Fury, Fleet Admiral Jonathan Stainer: Ld 8, 1 re-roll.", "Lunar class cruiser Lord Vorelas, Ld 8; Dauntless class light cruisers Light of Terra (Ld 7) and Redemption (Ld 8).", "4 Firestorms “Wings of Fury” (Ld 7), 2 Swords “Blue Stars” (Ld 8), 2 Cobras “Knights of the Sky” (Ld 9)."] },
    draw: (v, W, H) => { const sx = Math.min(W - 20, 150); return [{ z: "sun", e: "l" }, { z: "edge", e: "t", s: "b", l: "Imperial Navy edge" }, R(60, 0, Math.max(10, W - 120), 15, "b", "Imperial: 15 cm"),
      { z: "mark", x: sx, y: 60, s: "b", l: "station" }, { z: "planet", cx: sx - 26, cy: 60, r: 5, free: 1 }, R(0, H - 15, 30, 15, "a", "Eldar"), { z: "dim", x1: 0, y1: 40, x2: sx, y2: 40, l: "150 cm" }]; },
    fit: () => [160, 90], srcTable: [180, 120],
    mapNote: "The station is 60 cm from the Imperial long edge and 150 cm from the sunward edge, with a small planet within 30 cm of it toward the middle. The Eldar set up in the far corner of the sunward edge.",
    steps: [
      { t: "Make one short edge sunward and one long edge the Imperial edge." },
      { s: "b", t: "Place the station 60 cm from your edge and 150 cm from the sunward edge, and a small planet within 30 cm of it toward the middle of the table. Deploy within 15 cm of your edge and at least 60 cm from either short edge." },
      { t: "Place D3 asteroid fields and D3 gas or dust clouds on the rest of the table." },
      { s: "a", t: "Deploy up to 30 cm from the sunward edge and no further than 15 cm from the long edge opposite the Imperial one." },
      { s: "a", t: "You take the first turn." }
    ],
    stools: [],
    notes: [ARINA, PHANTOM, "The source does not say how the Spirit of Arina must “leave the battlefield”; the default is our suggestion."],
    refs: [["Space station", "FL p. 507"], ["Assault boats", "RB p. 85"], ["Overlord class battlecruiser", "FL p. 66"], ["Flame of Asuryan", "FL p. 327"]],
    play: [
      { w: "Assault boats at the station", s: "a", t: "Assault boats from the Spirit of Arina that reach the station search for the informant instead of attacking." },
      { w: "End phase", s: "a", t: "Roll a D6 for each assault boat docked with the station: on a 4+ the informant is found (tool below)." },
      { w: "Getting away", s: "a", t: "Once the informant is aboard, the Spirit of Arina must leave the table ({a:leave})." }
    ],
    tools: [{ k: "shiproll", id: "inf", s: "a", l: "Searching the station", cl: "Assault boats docked", n0: 2, il: i => "Assault boat " + (i + 1), out: d => d >= 4 ? "informant found" : "nothing" }, { k: "toggle", id: "got", s: "a", l: "The informant is aboard", res: 1 }, { k: "html", html: SHIPS }],
    rtools: [{ k: "ending", id: "how", l: "How did it end?", rows: [["Informant found and the Spirit of Arina left the table", "a"], ["The Spirit of Arina was destroyed", "b"], ["The Eldar left without the informant", "b"]] }],
    end: ["The Spirit of Arina leaves the table with the informant, or is destroyed."],
    win: ["Eldar: retrieve the informant with the Spirit of Arina’s assault boats (4+ each, in the end phase), then leave the table with it.", "Imperial Navy: stop them."],
    result(st, v, S) { return endingResult(st, S, "how"); },
    info: { bg: "Burning for revenge, Akaeris follows the path Eriel has shown him into space the Mon-keigh call theirs. Aspect Warriors must be put aboard the Imperial station Larish Quovis, where an informant is waiting.", cr: [SB + " " + SBP(24) + "; the poem’s third chapter, p. 8."] }
  },
  /* ------------------------------------------------------------ IV GRACE */
  {
    id: "fan-s-grace", grp: "fan-sb", name: "Grace", series: "Starblade · Scenario IV", trust: "fan",
    why: "A big Imperial fleet pins the Eldar until Corsairs arrive in turn 4 — and the Spirit of Arina must escape through the asteroids.", src: SBP(25), book: "O", suggest: ["Craftworld Eldar", "Eldar Corsairs", "Imperial Navy"],
    others: OTHERS,
    sides: { a: EL, b: { n: "Imperial Navy", f: "Imperial Navy" } },
    pitch: "Leaving the station, the Eldar run into a large Imperial fleet that draws them into a long fight. Help comes from those who walk the outcast path.",
    glance: [["Points", "Fixed forces"], ["Table", "180 × 120 cm"], ["Battlezone", "Asteroids along the sunward short edge"], ["First turn", "Imperial Navy"], ["Game ends", "A fleet is destroyed or disengages"]],
    bring: ["Asteroid fields for a 30 cm band", "The Eldar fleet and 11 Corsair escorts", "A large Imperial fleet"],
    forces: { a: ["Spirit of Arina, Admiral Akaeris Starblade: Ld 9, 2 re-rolls.", "Dragonship Cerysheal, Farseer Eriel Erychien: Ld 10; Wraithships Eternity (Ld 8) and Destiny (Ld 9).", "2 Shadowhunters “Starspeed”, one with a weapons battery and one with a lance: Ld 9.", "Corsairs, arriving in turn 4: 2 Aconites “Arith Kian” (Ld 9), 3 Nightshades “Bennan Bahar” (Ld 8), 3 Hemlocks “Oriosa Novar” (Ld 9), 3 Hemlocks “Karun Lir” (Ld 8)."], b: ["Armageddon class battlecruiser Divine Emperor, Admiral Hendrick von Dyck: Ld 9, 2 re-rolls.", "Tyrant class cruiser Hammerfist (Ld 7), Dictator class cruiser Regal (Ld 9), Lunar class cruiser Baron of Talesar (Ld 8).", "Dauntless class light cruisers Hawk (Ld 8) and Thunderstrike (Ld 7).", "3 Swords “Birds of Prey” (Ld 6), 2 Firestorms “Purgators” (Ld 6), 3 Firestorms “Thor’s Wings” (Ld 8), 3 Swords “Hunters VIX” (Ld 9)."] },
    draw: (v, W, H) => [{ z: "sun", e: "l" }, { z: "hatch", x: 0, y: 0, w: 30, h: H, l: "asteroids" }, R(Math.max(40, W - 20), 30, 20, Math.max(4, H - 60), "a", "Eldar", { rot: 90 }),
      R(60, 0, Math.max(10, W - 120), 30, "b", "Imperial Navy: 30 cm"), { z: "arrow", x1: 34, y1: H / 2, x2: 52, y2: H / 2, s: "a" }, { z: "text", x: 48, y: H / 2 + 12, l: "Corsairs, turn 4", s: "a" }],
    fit: () => [150, 90], srcTable: [180, 120],
    mapNote: "Asteroids fill a 30 cm band along the sunward edge. The Eldar set up at the far short edge, the Imperials along a long edge; the Corsairs arrive in turn 4 from the sunward edge.",
    steps: [
      { t: "Make one short edge sunward and place asteroid fields along it, up to 30 cm onto the table, over its whole length." },
      { s: "b", t: "Deploy along one long edge, no more than 30 cm onto the table and at least 60 cm from either short edge." },
      { s: "a", t: "Deploy along the short edge opposite the sunward one: no more than 20 cm onto the table and at least 30 cm from the long edges. Keep the Corsairs off the table." },
      { s: "b", t: "You take the first turn." }
    ],
    stools: [],
    notes: [ARINA, PHANTOM, "The source names the admiral both van Dyck and von Dyck.", "The battle lasts until a fleet is destroyed or disengages, and the Spirit of Arina must also leave by the sunward edge — but the source does not say how that turns into a result. See Agree."],
    refs: [["Armageddon class battlecruiser", "FL p. 65"], ["Aconite class frigate", "FL p. 324"], ["Hemlock class destroyer", "FL p. 325"], ["Nightshade class destroyer", "FL p. 328"], ["Asteroid fields", "RB p. 110"], ["Victory points", "RB p. 122"]],
    play: [{ w: "Turn 4", s: "a", t: "The Corsairs arrive from the sunward short edge." }, { w: "The Spirit of Arina", s: "a", t: "It must leave by the sunward short edge, through the asteroids." }],
    fx: T => T === 4 ? [["a", "The Corsairs arrive from the sunward edge"]] : [],
    tools: [{ k: "html", html: SHIPS }],
    rtools: [{ k: "pick", id: "sp", l: "The Spirit of Arina", rows: [["Left by the sunward short edge", "Eldar win"], ["Destroyed", "Imperials win"], ["Neither", "victory points"]] }, ...vpTools("Eldar", "Imperial Navy")],
    end: ["A fleet is destroyed or disengages; the Spirit of Arina must also leave by the sunward short edge."],
    win: ["{a:win}."],
    result(st) { const s = get(st, "sp", -1); if (s === 0) return ["a", "The Eldar win", "The Spirit of Arina got away through the asteroids."]; if (s === 1) return ["b", "The Imperial Navy wins", "The Spirit of Arina was destroyed."]; return vp(st, "Eldar", "Imperial Navy"); },
    info: { bg: "Moving away from the station, Akaeris’ fleet runs into a large Imperial fleet, and Admiral von Dyck draws the Eldar into a long fire fight. Then the Corsairs — Eldar who chose the outcast path — come to help.", cr: [SB + " " + SBP(25) + "; the poem’s fourth chapter, p. 10."] }
  },
  /* ------------------------------------------------------------ V TRAGEDY WITHIN THE HEART */
  {
    id: "fan-s-tragedy", grp: "fan-sb", name: "Tragedy Within the Heart", series: "Starblade · Scenario V", trust: "fan",
    why: "A Fleet Engagement nobody wanted: tricked into battle, Eldar and Tau fight while the Spirit of Arina must survive.", src: SBP(26), book: "O", suggest: ["Craftworld Eldar", "Tau"],
    others: OTHERS + " The Tau ships are the Fleets book’s Tau lists (FL p. 454–478).",
    sides: { a: EL, b: { n: "Tau", f: "Tau" } },
    pitch: "Akaeris has opened talks with the Tau commander when a Tau ship is destroyed in secret — and every Tau sensor names the Eldar.",
    glance: [["Points", "Fixed forces"], ["Table", "180 × 120 cm"], ["Battlezone", "Deep space; phenomena as usual"], ["First turn", "Roll-off: the higher roll chooses"], ["Game ends", "A fleet is destroyed or disengages"]],
    bring: ["The Eldar fleet with two Corsair squadrons", "A Tau fleet: an Explorer, 3 Protectors, 2 Emissaries, 5 Castellans"],
    forces: { a: ["Spirit of Arina, Admiral Akaeris Starblade: Ld 9, 2 re-rolls.", "Dragonship Cerysheal, Farseer Eriel Erychien: Ld 10; Wraithships Eternity (Ld 8) and Destiny (Ld 9).", "2 Shadowhunters “Starspeed” (Ld 9), 2 Aconites “Arith Kian” (Ld 9), 3 Hemlocks “Oriosa Novar” (Ld 9)."], b: ["Explorer class battleship Bor’kan Ky’a’lis Ti’kol, Kor’o Ti’kol: Ld 9, 1 re-roll.", "Protector class cruisers Bor’kan Shi’tiu La’tera (Ld 8), Bor’kan Vio Ta’is (Ld 8), T’au M’senyis Sheva’s (Ld 7).", "Emissary class light cruisers Bor’kan Naya’s Shem’na (Ld 8) and Bor’kan Tly’vo (Ld 6).", "5 Castellans “Bor’kan Siu’vin’sho”, Ld 7."] },
    draw: (v, W, H) => swap(MAPS["fleet-engagement"]("D", W, H)),
    fit: () => [110, 100], srcTable: [180, 120],
    mapNote: "Fleet Engagement set-up D (RB p. 142): the Eldar in the white zone, the Tau in the three dark divisions.",
    steps: [
      { t: "Place celestial phenomena for deep space as usual (RB p. 108)." },
      { t: "Use Fleet Engagement set-up D, without choosing formations: the Eldar take the white zone, the Tau the dark grey divisions (map)." },
      { t: "Both players roll a D6 and the lower roll deploys a ship or squadron first; then take turns, as in Fleet Engagement (RB p. 142)." },
      { t: "Roll off: the higher roll chooses to go first or second." }
    ],
    stools: [],
    notes: [ARINA, PHANTOM, "“The Spirit of Arina must survive” is the only extra condition; how it combines with the battle’s result is open. See Agree."],
    refs: [["Fleet Engagement", "RB p. 142–143"], ["Explorer", "FL p. 458"], ["Protector class cruiser", "FL p. 470"], ["Castellan class escort", "FL p. 474"], ["Victory points", "RB p. 122"]],
    play: [{ w: "The Spirit of Arina", s: "a", t: "It must survive the battle." }],
    tools: [{ k: "html", html: SHIPS }],
    rtools: [{ k: "toggle", id: "lost", s: "a", l: "The Spirit of Arina was destroyed" }, ...vpTools("Eldar", "Tau")],
    end: ["A fleet is destroyed or disengages."],
    win: ["{a:win}."],
    result(st) { if (get(st, "lost", false)) return ["b", "The Tau win", "The Spirit of Arina was destroyed."]; return vp(st, "Eldar", "Tau"); },
    info: { bg: "Akaeris has just opened a dialogue with the Tau commander Kor’o Ti’kol when a Tau vessel is destroyed in secret. The Tau sensors name the Eldar as the attackers; knowing they have been betrayed, Akaeris must fight a battle he never wanted.", cr: [SB + " " + SBP(26) + "; the poem’s fifth chapter, p. 12."] }
  },
  /* ------------------------------------------------------------ VI UNRAVELLING VISIONS */
  {
    id: "fan-s-visions", grp: "fan-sb", name: "Unravelling Visions", series: "Starblade · Scenario VI", trust: "fan",
    why: "A raid on a Tau orbital city to snatch a Rogue Trader captain held prisoner there, before a patrol arrives in turn 5.", src: SBP(27), book: "O", suggest: ["Craftworld Eldar", "Tau"],
    others: OTHERS + " Any cruiser can stand for the Rogue Trader’s ship.",
    sides: { a: EL, b: { n: "Tau", f: "Tau" } },
    pitch: "A Rogue Trader who knows where Shànn-Tal’s killers went sits in a Tau prison on an orbital city. Akaeris slips deep into Tau space to take him.",
    glance: [["Points", "Fixed forces"], ["Table", "180 × 120 cm"], ["Battlezone", "As usual, with an asteroid field shielding the Eldar"], ["First turn", "Eldar"], ["Game ends", "The captain is taken out, or the raid fails"]],
    bring: ["A Tau orbital city (FL p. 478) and two orbital defences", "A cruiser for the Rogue Trader’s ship", "A Tau patrol: a Custodian and 3 Wardens"],
    forces: { a: ["Spirit of Arina, Admiral Akaeris Starblade: Ld 9, 2 re-rolls.", "Wraithship Eternity, Ld 9.", "2 Shadowhunters “Starspeed” (Ld 9), 2 Aconites “Arith Kian” (Ld 8), 3 Hemlocks “Oriosa Novar” (Ld 8)."], b: ["Orbital city Sa’cea Shu’tsai’vior, Ld 9.", "Orbital defences Sa’cea T’sai and Sa’cea V’ior, Ld 7 (security orbitals, FL p. 479).", "Protectors Sa’cea Tas’ka Yui’ni (Ld 8) and Fal’shia Mi’iu Ka’ies (Ld 7); 3 Castellans “Fal’shia Neo’syi” (Ld 8).", "Patrol, arriving in turn 5: Custodian class battleship Sa’cea Ia’sorla Ra’uyu, Kor’o Ra’uyu (Ld 9, 2 re-rolls), and 3 Wardens “Sa’cea Paluyn” (Ld 8)."] },
    draw: (v, W, H) => [{ z: "sun", e: "l" }, { z: "mark", x: 60, y: H / 2, s: "b", l: "orbital city" }, { z: "ring", cx: 60, cy: H / 2, r: 30, s: "b" },
      { z: "arrow", x1: 60, y1: 4, x2: 60, y2: 20, s: "b" }, { z: "text", x: 92, y: 10, l: "patrol, turn 5", s: "b" }, R(Math.max(70, W - 60), H - 15, Math.min(30, W - 70), 15, "a", "Eldar"), { z: "hatch", x: Math.max(70, W - 74), y: H - 40, w: 20, h: 14, l: "", free: 1 }],
    fit: () => [120, 100], srcTable: [180, 120],
    mapNote: "The orbital city is 60 cm from the sunward edge on the centre line, its fleet and two defences within 30 cm. The Eldar zone follows the default below, behind an asteroid field; the patrol enters in turn 5 straight in front of the city.",
    steps: [
      { t: "Make one short edge sunward and set up celestial phenomena as usual, with at least one asteroid field within 20 cm of the Eldar zone, between it and the city." },
      { s: "b", t: "Place the orbital city 60 cm from the sunward edge and from both long edges, and a cruiser touching it as the Rogue Trader’s ship. Scatter the two defences within 30 cm of the city, and deploy your fleet within 30 cm of it, facing the long edge the patrol will enter from." },
      { s: "a", t: "Deploy: {a:zone}." },
      { s: "a", t: "You take the first turn." }
    ],
    stools: [],
    notes: [ARINA, PHANTOM, "The Eldar zone is “30 cm away from the far short edge and no further than 15 cm onto the table” — read as a corner zone along the long edge opposite the patrol’s. Agree yours."],
    refs: [["Kor Caste orbital city", "FL p. 478"], ["Security orbital", "FL p. 479"], ["Custodian class battleship", "FL p. 468"], ["Hit-and-run attacks", "RB p. 91"], ["Assault boats", "RB p. 85"]],
    play: [{ w: "Turn 5", s: "b", t: "In your turn the patrol squadron enters from the long edge directly in front of the orbital city." },
      { w: "The captain", s: "a", t: "Make a successful hit-and-run attack — assault boats count — on the Rogue Trader’s cruiser to capture its captain. Then leave the table by any edge." }],
    fx: T => T === 5 ? [["b", "The patrol enters in front of the city"]] : [],
    tools: [{ k: "toggle", id: "got", s: "a", l: "The captain has been captured", res: 1 }, { k: "html", html: SHIPS }],
    rtools: [{ k: "ending", id: "how", l: "How did it end?", rows: [["Captain captured and the raiders left the table", "a"], ["The raid failed", "b"]] }],
    end: ["The Eldar leave with the captain, or the raid fails."],
    win: ["Eldar: capture the Rogue Trader captain with a hit-and-run attack, then leave the table by any edge.", "Tau: prevent it."],
    result(st, v, S) { return endingResult(st, S, "how"); },
    info: { bg: "After slipping past Tau patrols, Akaeris finds the Rogue Trader: held prisoner at a Tau orbital city for piracy. He takes a small fleet deep into Tau space to get him.", cr: [SB + " " + SBP(27) + "; the poem’s sixth chapter, p. 14."] }
  },
  /* ------------------------------------------------------------ VII A PROPHECY UNTOLD */
  {
    id: "fan-s-prophecy", grp: "fan-sb", name: "A Prophecy Untold", series: "Starblade · Scenario VII", trust: "fan",
    why: "A race through a moving asteroid field: everything drifts 20 cm a turn while Dark Eldar hunters close in.", src: SBP(28), book: "O", suggest: ["Craftworld Eldar", "Dark Eldar"],
    others: OTHERS,
    sides: { a: EL, b: { n: "Dark Eldar", f: "Dark Eldar" } },
    pitch: "Eriel finds a pod with a faint life sign hidden in an asteroid field — and the Dark Eldar who left it there come back for it.",
    glance: [["Points", "Fixed forces"], ["Table", "180 × 120 cm"], ["Battlezone", "D3 asteroid fields in every 60 cm square, moving"], ["First turn", "Eldar"], ["Game ends", "Eriel’s ships escape, or are destroyed"]],
    bring: ["Lots of asteroid fields", "A Dragonship and a Wraithship", "A Torture cruiser and 5 Corsair escorts"],
    forces: { a: ["Dragonship Cerysheal, Farseer Eriel Erychien: Ld 10, 1 re-roll.", "Wraithship Destiny, Ld 9: pulsar lance and torpedoes."], b: ["Hunter Group I: Torture class cruiser, Ld 10 (weapons batteries and launch bays); a Corsair escort with weapons battery, lance and mimic engines, Ld 8.", "Hunter Group II: 2 Corsairs with weapons batteries and torpedoes (Ld 9) and 2 with weapons batteries and lances (Ld 8)."] },
    draw: (v, W, H, st) => squares(W, H, st, "ast").concat([{ z: "sun", e: "t" }, { z: "mark", x: 60, y: H / 2, s: "a", l: "Eriel" }, { z: "arrow", x1: 68, y1: H / 2 + 8, x2: 86, y2: H / 2 + 8, s: "a" },
      { z: "mark", x: Math.min(W - 10, 90), y: 4, s: "b", l: "", free: "y" }, { z: "mark", x: Math.min(W - 10, 90), y: H - 4, s: "b", l: "", free: "y" }, { z: "text", x: Math.min(W - 30, 112), y: 12, l: "Group I", s: "b" }, { z: "text", x: Math.min(W - 30, 112), y: H - 12, l: "Group II", s: "b" },
      { z: "edge", e: "r", s: "a", l: "escape edge" }, { z: "edge", e: "l", s: "n", l: "everything drifts this way, 20 cm a turn" }]),
    fit: () => [150, 90], srcTable: [180, 120],
    mapNote: "Eriel’s two ships start 60 cm in from the far short edge, in the centre, facing the escape edge. The hunter groups start on the long edges, 90 cm from a short edge, facing them. Numbers: asteroid fields rolled for each square.",
    steps: [
      { t: "Divide the table into six 60 cm squares and place D3 asteroid fields in each (tool below). Name one long edge sunward and one short edge the escape edge." },
      { s: "a", t: "Place Eriel’s two ships in the centre, 60 cm from the short edge opposite the escape edge, facing the escape edge." },
      { s: "b", t: "Place Hunter Group I on the sunward long edge and Hunter Group II on the other long edge, each 90 cm from a short edge, facing the Eldar." },
      { s: "a", t: "You take the first turn." }
    ],
    stools: [AST],
    notes: ["Eriel commands here; Akaeris and the Spirit of Arina are deep in Tau space.", "Which ships must escape is not spelled out; the default is our suggestion."],
    refs: [["Dragonship", "FL p. 328"], ["Torture class cruiser", "FL p. 354"], ["Corsair class escort", "FL p. 353"], ["Asteroid fields", "RB p. 110"]],
    play: [
      { w: "Start of each turn: the field drifts", t: "Move every asteroid field, ship and ordnance marker 20 cm toward the short edge opposite the escape edge; ships keep their heading. Fields that fall off are removed. Each player then rolls D3−1 and places that many new fields within 20 cm of the escape edge." },
      { w: "Falling off", t: "A ship pushed off the table may try to come back in a later turn on a 4+. Ordnance pushed off is removed and counts as back aboard for launch capacity." },
      { w: "Escape", s: "a", t: "Fly off the escape edge — the only way out: no disengaging otherwise ({a:who})." }
    ],
    fx: () => [[null, "Start of the turn: everything drifts 20 cm; D3−1 new asteroid fields each"]],
    tools: [{ k: "shiproll", id: "new", l: "New asteroid fields (D3−1 each)", cl: "Players", n0: 2, roll: () => dn(3) - 1, il: i => "Player " + (i + 1), out: d => d + " new field" + (d === 1 ? "" : "s") }, { k: "roll", id: "back", l: "A ship tries to come back", rows: () => [[1, 3, "Not this turn"], [4, 6, "It returns"]] }],
    rtools: [{ k: "ending", id: "how", l: "How did it end?", rows: [["Eriel’s ships escaped by the escape edge", "a"], ["Eriel’s ships were destroyed or lost", "b"]] }],
    end: ["Eriel’s ships leave by the escape edge, or are destroyed."],
    win: ["Eldar: fly off the escape edge ({a:who}).", "Dark Eldar: stop them."],
    result(st, v, S) { return endingResult(st, S, "how"); },
    info: { bg: "While Akaeris goes deeper into Tau space, Eriel tracks down whoever started the battle with the Tau. In a dense asteroid field she finds traces of the Dark Eldar and a pod with a weak life signal — and as she takes it aboard, they attack.", cr: [SB + " " + SBP(28) + "; the poem’s seventh chapter, p. 16."] }
  },
  /* ------------------------------------------------------------ VIII TEARS IN MOTION */
  {
    id: "fan-s-tears", grp: "fan-sb", name: "Tears in Motion", series: "Starblade · Scenario VIII", trust: "fan",
    why: "Inside the Eye of Terror, four Chaos daemonship grand cruisers — one of each god — come out of the warp at the Eldar.", src: SBP(29), book: "O", suggest: ["Eldar Corsairs", "Chaos"],
    others: OTHERS,
    sides: { a: EL, b: { n: "Chaos", f: "Chaos daemonships" } },
    pitch: "Akaeris and the Corsairs sail into the Eye of Terror. Four grand cruisers, each marked by a different god, rise from the warp to meet them.",
    glance: [["Points", "Fixed forces"], ["Table", "180 × 120 cm"], ["Battlezone", "A rogue planet, D3 each of clouds, asteroids and warp rifts, two radiation bursts"], ["First turn", "Chaos"], ["Game ends", "Not given — see Agree"]],
    bring: ["A small planet", "D3 gas clouds, D3 asteroid fields, D3 warp rifts", "Four Chaos grand cruisers"],
    forces: { a: ["Spirit of Arina, Admiral Akaeris Starblade: Ld 10, 2 re-rolls.", "2 Aconites “Arith Kian” and 3 Hemlocks “Oriosa Novar”, Ld 9."], b: ["Repulsive class grand cruiser Red Death: Ld 8, Mark of Khorne, daemonship.", "Vengeance class grand cruiser Treachery of Light: Ld 8, Mark of Tzeentch, daemonship.", "Retaliator class grand cruiser Seduction: Ld 8, Mark of Slaanesh, daemonship.", "Executor class grand cruiser Decay of Bright: Ld 8, Mark of Nurgle, daemonship."] },
    draw: (v, W, H) => [{ z: "sun", e: "t" }, R(30, 30, W - 60, H - 60, "n", "", { dash: 1 }), { z: "text", x: W / 2, y: H / 2, l: "rogue planet: anywhere\n30 cm+ from the edges", s: "n" },
      R(60, H - 20, Math.max(10, W - 120), 20, "a", "Eldar: 20 cm")],
    fit: () => [130, 90], srcTable: [180, 120],
    mapNote: "The Eldar set up along the long edge opposite the sunward one, up to 20 cm in and at least 60 cm from either short edge. The Chaos ships arrive by the daemonship rules.",
    steps: [
      { t: "Make one long edge sunward. Place a small rogue planet anywhere at least 30 cm from every edge, then D3 gas or dust clouds, D3 asteroid fields and D3 warp rifts at random. Two radiation bursts plague the battle." },
      { s: "a", t: "Deploy along the long edge opposite the sunward edge: up to 20 cm in, at least 60 cm from a short edge." },
      { s: "b", t: "Your ships arrive using the daemonship rules (FL p. 237)." },
      { s: "b", t: "You take the first turn." }
    ],
    stools: [],
    notes: [ARINA, "The source gives no game length; the default is our suggestion."],
    refs: [["Daemonships", "FL p. 236–237"], ["Marks of Chaos", "FL p. 232"], ["Radiation bursts", "RB p. 115"], ["Warp rifts", "RB p. 111"], ["Repulsive class grand cruiser", "FL p. 271"]],
    play: [
      { w: "Start of each turn: radiation bursts", t: "Roll a D6 for each of the two bursts: a 5 or 6 sets one off (only one a turn). Roll a D6 for its strength: every ship has that much less Leadership this turn, and fleet commanders may re-roll only for their own ship or squadron (RB p. 115)." },
      { w: "Goal", s: "a", t: "Destroy all four Chaos grand cruisers." }
    ],
    fx: () => [[null, "Roll for the radiation bursts"]],
    tools: [{ k: "shiproll", id: "rad", l: "Radiation bursts", cl: "Bursts", n0: 2, il: i => "Burst " + (i + 1), out: d => d >= 5 ? "goes off" : "quiet", foot: st => { const r = get(st, "rad", null); return r && r.some(d => d >= 5) ? "<p class='calc' style='margin:6px 0 0'>One burst this turn: roll a D6 for its strength.</p>" : ""; } },
      { k: "val", id: "str", l: "Burst strength: −Ld this turn", opts: [1, 2, 3, 4, 5, 6], roll: () => d6() }, { k: "counter", id: "gc", s: "a", res: 1, max: 4, l: "Chaos grand cruisers destroyed" }],
    rtools: [],
    end: ["{a:len}."],
    win: ["Eldar: destroy all four Chaos grand cruisers.", "Chaos: prevent it."],
    result(st) { const n = get(st, "gc", 0); return n >= 4 ? ["a", "The Eldar win", "All four grand cruisers destroyed."] : st.turn > 1 || n ? ["b", "Chaos wins", n + " of 4 grand cruisers destroyed — if the battle has ended."] : [null, "Battle in progress", "Count the grand cruisers on the Play tab."]; },
    info: { bg: "From the Rogue Trader Eriel learns who attacked Shànn-Tal. Akaeris parts from her for the last time and sails into the Eye of Terror, with the Corsairs who seek to redeem themselves.", cr: [SB + " " + SBP(29) + "; the poem’s eighth chapter, p. 18."] }
  },
  /* ------------------------------------------------------------ IX STARBLADE */
  {
    id: "fan-s-starblade", grp: "fan-sb", name: "Starblade", series: "Starblade · Scenario IX", trust: "fan",
    why: "The finale in the Eye of Terror: the Spirit of Arina against a Nurgle battleship and its escort, among warp rifts.", src: SBP(30), book: "O", suggest: ["Craftworld Eldar", "Chaos"],
    others: OTHERS,
    sides: { a: EL, b: { n: "Chaos", f: "Chaos: Mark of Nurgle" } },
    pitch: "Deep in the Eye, Akaeris finally finds Mortharion’s Blight, the ship that destroyed his home. It turns its prow straight at him.",
    glance: [["Points", "Fixed forces"], ["Table", "180 × 120 cm"], ["Battlezone", "No sunward edge: D6 warp rifts, D3 gas clouds, D3 asteroid fields"], ["First turn", "Eldar"], ["Game ends", "Not given — see Agree"]],
    bring: ["D6 warp rifts, D3 gas clouds, D3 asteroid fields", "A Chaos battleship, 2 cruisers and 2 escorts"],
    forces: { a: ["Spirit of Arina, Admiral Akaeris Starblade: Ld 10, 2 re-rolls.", "2 Hemlocks “Oriosa Novar”, Ld 9."], b: ["Despoiler class battleship Mortharion’s Blight, Mark of Nurgle: Warmaster Barha’desh Dear’tuz, Ld 10, 2 re-rolls.", "Murder class cruisers Chagranathar (Ld 8) and Starving Flesh (Ld 7), Mark of Nurgle.", "2 Idolators “Dark Omen”, Ld 7."] },
    draw: (v, W, H) => [R(W / 2 - 30, H - 10, 60, 10, "a", "Eldar", { free: "x" }), R(W / 2 - 30, 0, 60, 10, "b", "Chaos", { free: "x" }), { z: "text", x: W / 2, y: H / 2, l: "D6 warp rifts, D3 gas clouds,\nD3 asteroid fields at random", s: "n" }],
    fit: () => [90, 80], srcTable: [180, 120],
    mapNote: "Both fleets set up in the middle of a long edge, up to 10 cm in; the zone’s width is not given.",
    steps: [
      { t: "There is no sunward edge. Place D6 warp rifts, D3 gas or dust clouds and D3 asteroid fields at random." },
      { s: "a", t: "Deploy in the middle of a long edge, up to 10 cm onto the table." },
      { s: "b", t: "Deploy in the middle of the opposite long edge, up to 10 cm onto the table." },
      { s: "a", t: "You take the first turn." }
    ],
    stools: [{ k: "val", id: "rifts", l: "Warp rifts (D6)", opts: [1, 2, 3, 4, 5, 6], roll: () => d6() }],
    notes: [ARINA, "“Defeat Barha’desh” is not defined, and the source gives no game length; the defaults are our suggestion."],
    refs: [["Despoiler class battleship", "FL p. 268"], ["Murder class cruiser", "FL p. 279"], ["Warp rifts", "RB p. 111"], ["Flame of Asuryan", "FL p. 329"]],
    play: [{ w: "Goal", s: "a", t: "Defeat Barha’desh: {a:defeat}." }],
    tools: [{ k: "html", html: SHIPS }],
    rtools: [{ k: "ending", id: "how", l: "How did it end?", rows: [["Barha’desh was defeated", "a"], ["The Spirit of Arina was destroyed", "b"], ["The Eldar disengaged", "b"]] }],
    end: ["{a:len}."],
    win: ["Eldar: Akaeris must defeat Barha’desh ({a:defeat}).", "Chaos: anything else."],
    result(st, v, S) { return endingResult(st, S, "how"); },
    info: { bg: "After a hazardous journey deep into the Eye of Terror, Akaeris finally locates the bloated Mortharion’s Blight. The Eye itself roars as the two ships close — and the Starblade descends.", cr: [SB + " " + SBP(30) + "; the poem’s ninth chapter, p. 20."] }
  }
  ]);
})();
