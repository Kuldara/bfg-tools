/* Classic Games Workshop scenarios, 1999–2000: White Dwarf (collected in Warp Storm, 2000),
   Planet Killer 1 (Fanatic Press, 2000) and Battlefleet Gothic Magazine 1 (Fanatic Press).
   Written for the original 1999 rules; Remastered places are given in the notes.
   Summarised in our own words; every scenario is hand-made (see docs/history/scenarios/LUEMINUT.md, in Finnish). */
(function () {
  const WS = "Warp Storm (Games Workshop, 2000), a collection of White Dwarf articles";
  const PK1 = "Planet Killer 1 (Fanatic Press, 2000)";
  const BM1 = "Battlefleet Gothic Magazine 1 (Fanatic Press)";
  const OLD = "Written for the original 1999 rules. ";
  const treeEnd = (st, id, T) => { const path = get(st, id, null) || [], cur = treeAt(T, path), n = T.nodes[cur]; return n.end ? n : null; };
  /* the path chosen at a node (the campaign's memo): returns the child's index or -1 */
  const pick = (st, id, node) => { const p = (get(st, id, null) || []).find(x => x[0] === node); return p ? p[1] : -1; };
  const link = (id, text) => "<a href='#/s/" + id + "/setup'>" + esc(text) + " ›</a>";

  /* ---------------------------------------------------------------- Invasion of Phillipa II (Planet Killer 1) */
  const PHIL = {
    bl: { n: "1 · The Blockade — Blockade Run", sc: "blockade-run", txt: "The Imperials run the blockade with 400 pts of cruisers and no fleet commander. Chaos blockades with 800 pts of cruisers, including Lord Janobeg the Vile (Ld 8, Mark of Slaanesh, 75 pts). Historical ships: Tyrant Hammer of Light (upgraded batteries) and Gothic Furies against the Styx Annihilator (Janobeg), Murder Raptor and Slaughter Tormentor.", kids: [["The Imperials broke out", "bait"], ["Chaos held the blockade", "bait"]] },
    bait: { n: "2 · The Baiting Violator — The Bait", sc: "the-bait", txt: "Chaos is the bait: one cruiser up to 250 pts plus 500 pts of reinforcements, cruisers only, including Gunther Rhea (Ld 8, Mark of Slaanesh, 75 pts). The Imperials pursue with 500 pts of cruisers and no fleet commander. Historical ships: Gothic Furies (Admiral Ramirez, Ld 8, 2 re-rolls) and Lunar Divine Retribution against the Hades Violator (Rhea), Murder Raptor and Slaughter Tormentor. Check the campaign ledger below for what the last battle changed.", kids: [["The Imperials won", "eld"], ["Chaos won", "eld"]] },
    eld: { n: "3 · The Eldar Enter the War — Cruiser Clash", sc: "cruiser-clash", txt: "A side battle: the Eldar (700 pts, no restrictions) against Chaos (700 pts, cruisers only). The Imperial player can take the Eldar. Historical ships: Eclipses Star Walker and Glide of Night, Hellebores Drake Spinner, Shadowfast and Dark Wind against the Annihilator, Raptor and Tormentor.", kids: [["The Eldar won", "esc"], ["Chaos won", "esc"]] },
    esc: { n: "4 · Escalation — Cruiser Clash (with alternatives)", sc: "cruiser-clash", txt: "1000 pts each, no restrictions: use Cruiser Clash with its alternatives. Admiral Ramirez (Ld 9) and Lord Janobeg the Vile (Ld 8, Mark of Slaanesh) must lead. Historical ships: Retribution His Will (Ramirez), Gothic Furies, Siluria Vanguard, Tyrant Damocles and two Cobras against the Annihilator, Slaughter Executor, Carnage Cruel Fist and two squadrons of three Idolators. Points changes from earlier battles are in the ledger below.", kids: [["The Imperials won", "lib"], ["Chaos won", "lib"]] },
    lib: { n: "5 · The Liberation of Phillipa II — Fleet Engagement", sc: "fleet-engagement", txt: "2000 pts each, no restrictions. Admiral Ramirez (Ld 9) leads the Imperials, who may take up to 500 pts of Eldar from the Altsain craftworld. Chaos must include Janobeg the Vile (Ld 8) and Warmaster Overfiend Drusil Spittletongue (Ld 9), both Mark of Slaanesh. The loser of Escalation may field no battleships, heavy cruisers or battlecruisers. Historical fleets: His Will (Ramirez, 2 extra re-rolls), Mars Heracles, Tyrant Damocles, Gothics Juno and Harpies, Dictator Broadsword, Siluria Nemesis and two squadrons of four Cobras, against the Desolator Debauched (Drusil), Styx Annihilator, Hades Violator, Slaughter Executor, Carnage Cruel Fist, Devastation Dark, Murder Hatred, two Idolators and five Infidels.", kids: [["The Imperials won", "impW"], ["Chaos won", "chW"]] },
    impW: { n: "The Imperium liberates Phillipa II — campaign victory", end: "a" },
    chW: { n: "Chaos keeps Phillipa II — campaign victory", end: "b" }
  };
  const philLedger = st => {
    const b = pick(st, "path", "bl"), t = pick(st, "path", "bait"), e = pick(st, "path", "eld"), x = pick(st, "path", "esc"), out = [];
    if (b === 0) out.push("The Baiting Violator: the Imperials may take another 100 pts (600 pts).");
    if (b === 1) out.push("The Baiting Violator: one Chaos ship gives the Imperials no victory points, so one reinforcement can come on without penalty.");
    const ie = t === 0 ? 200 : 0, ce = (t === 1 ? 200 : 0) - (e === 0 ? 200 : 0);
    if (t >= 0 || e >= 0) out.push("Escalation: Imperials " + (1000 + ie) + " pts, Chaos " + (1000 + ce) + " pts" + (t === 0 ? " (Imperial bonus from The Baiting Violator)" : t === 1 ? " (Chaos bonus from The Baiting Violator)" : "") + (e === 0 ? "; the Eldar victory cost Chaos 200 pts" : e === 1 ? "; the Chaos win over the Eldar changes nothing" : "") + ".");
    if (x === 0) out.push("Liberation: Chaos may field no battleships, heavy cruisers or battlecruisers.");
    if (x === 1) out.push("Liberation: the Imperials may field no battleships, heavy cruisers or battlecruisers.");
    return "<h3>Campaign ledger</h3>" + (out.length ? "<ul class='plain'>" + out.map(x => "<li>" + fmt(x) + "</li>").join("") + "</ul>" : "<p class='calc' style='margin:0'>Nothing carries over yet. Record each battle in the tree above.</p>");
  };

  /* ---------------------------------------------------------------- Corribra Sector II (BFG Magazine 1) */
  const CORR_CR = "Matt Sprange — “Corribra Sector Part II”, " + BM1 + ", p. 38–41 (PDF p. 40–43).";
  const CORR_OTHERS = "Written for an Imperial escort squadron hunting an Ork warlord; any escort-heavy fleet can stand in on either side. The four missions form a short campaign — each page says where to go next.";
  const LEIGH = "Captain Leigh: Ld 9, one extra re-roll, on an escort of your choice.";
  const corrNext = (rows) => ({ k: "html", html: "<h3>Campaign: what next?</h3><ul class='plain'>" + rows.map(([w, id, n]) => "<li>" + esc(w) + (id ? " → " + link(id, n) : " " + esc(n)) + "</li>").join("") + "</ul>" });

  addScenarios([
  /* ------------------------------------------------------------ THE BATTLE OF CALLAVELL */
  {
    id: "cl-callavell", grp: "cl-ws", name: "The Battle of Callavell", series: "White Dwarf · historical refight", trust: "classic",
    why: "A huge Escalating Engagement in which each fleet arrives as a line of battle, division after division. Bring everything you own.", src: "Warp Storm p. 14–16", book: "O", suggest: ["Imperial Navy", "Chaos"],
    others: "Both historical fleets were Imperial, one of them renegade; mix Imperial and Chaos designs freely on both sides. Any two fleets can refight it.",
    sides: { a: { n: "Loyalists", f: "Imperial Navy" }, b: { n: "Renegades", f: "Imperial Navy or Chaos" } },
    pitch: "Two admirals both want a decisive battle — and get one. The fleets meet in long columns, and every turn the next division swings in at the head of the line.",
    glance: [["Points", "As big as you can: 2000 pts or more each"], ["Table", "Not given — use your table"], ["Battlezone", "Fixed map: planet, moon, gas clouds, asteroids"], ["First turn", "Roll-off after deployment"], ["Game ends", "A fleet disengages or is destroyed"]],
    bring: ["Your biggest fleets (2000 pts or more)", "Contact markers, one per division", "A planet and moon, two gas clouds, two asteroid fields"],
    forces: {
      a: ["Any ships, no restrictions on battleships, battlecruisers or grand cruisers. 2000 pts or more is recommended.", "Divide the fleet into divisions: all battleships in one; all heavy cruisers, battlecruisers and grand cruisers in one; all cruisers in one; escorts in up to two (light cruisers may join these).", "Give each division a contact marker and roll Leadership."],
      b: ["The same: any ships, the same division rules."]
    },
    draw: (v, W, H) => [
      { z: "line", x1: W / 2, y1: 0, x2: W / 2, y2: H }, { z: "line", x1: 0, y1: H / 2, x2: W, y2: H / 2 },
      { z: "planet", cx: W * 65 / 180, cy: H * 25 / 120, r: 10, l: "Callavell" }, { z: "planet", cx: W * 25 / 180, cy: H * 50 / 120, r: 4, l: "moon" },
      { z: "ring", cx: W * .75, cy: H * .2, r: 6, sw: 12, gas: 1 }, { z: "text", x: W * .75, y: H * .2 + 17, l: "gas cloud", s: "n" },
      { z: "ring", cx: W * 105 / 180, cy: H * 65 / 120, r: 4, sw: 8, ast: 1 },
      { z: "ring", cx: W * .75, cy: H * .8, r: 7, sw: 14, ast: 1 }, { z: "text", x: W * .75, y: H * .8 - 20, l: "asteroid fields", s: "n" },
      { z: "ring", cx: W * 30 / 180, cy: H * .8, r: 6, sw: 12, gas: 1 }, { z: "text", x: W * 30 / 180, y: H * .8 - 17, l: "gas cloud", s: "n" },
      ...EDGES4("n", "Line-of-battle stacks: any edge, 60 cm+ from the enemy")
    ],
    fit: () => [120, 90],
    mapNote: "Terrain placed as on the magazine’s map, in proportion to your table. Starting divisions deploy as in Escalating Engagement; the other divisions wait in a stack on a table edge.",
    steps: [
      { t: "Choose fleets with no restrictions — as big as you can manage — and split each into divisions: battleships, heavy ships (heavy cruisers, battlecruisers, grand cruisers), cruisers, and up to two of escorts." },
      { t: "Give each division a contact marker and roll Leadership." },
      { t: "Set up the terrain as on the map." },
      { t: "Each player deploys their fastest division first (not a random one), as in Escalating Engagement: roll off to place first; markers at least 30 cm from every edge and 60 cm from the enemy marker; ships within 10 cm of their marker." },
      { t: "Each player stacks their other markers in the order the divisions will arrive: the top marker is the head of the column." },
      { t: "Roll off. In turn, place your stack anywhere on a table edge, not within 60 cm of an enemy ship or contact marker." },
      { t: "Both roll a D6. The higher roll chooses to go first or second." }
    ],
    notes: [OLD + "The Escalating Engagement it builds on is RB p. 138–139.", "“Fastest division” is read as the division whose slowest ship is fastest, as divisions move at the speed of their slowest ship in Escalating Engagement."],
    refs: [["Escalating Engagement", "RB p. 138–139"], ["Reload Ordnance and running out", "RB p. 46–47"], ["Victory points", "RB p. 122"], ["Sub-plots", "RB p. 124–127"]],
    play: [
      { w: "Start of your turn", t: "Flip the top marker of your stack: that division moves on within 10 cm of it. Ships that do not fit, or that you want in line astern, may follow in later turns — leave the marker until they are all on." },
      { w: "Then", t: "Slide the rest of the stack up to 20 cm along the table edge, all together." },
      { w: "Ordnance", t: "Every ship has been out of dock for months. Rolling a double on Reload Ordnance always counts as a failure and the ship or squadron can launch no more ordnance this battle (no last shot). No re-rolls of any kind on Reload Ordnance." }
    ],
    fx: () => [[null, "Start of your turn: flip the top marker, then slide the stack up to 20 cm"]],
    tools: [
      { k: "counter", id: "sa", l: "Loyalist divisions still in the stack", s: "a", max: 4 },
      { k: "counter", id: "sb", l: "Renegade divisions still in the stack", s: "b", max: 4 }
    ],
    end: ["When one fleet disengages or is destroyed."],
    win: ["Standard victory points and sub-plots (RB p. 122–127). The higher total wins."],
    result() { return [null, "Count victory points", "Standard victory points, RB p. 122."]; },
    info: { bg: "During the Age of Apostasy, loyalist Admiral Jielsson hunted the renegade fleet of Lord Pelver and his Regime of Iron around the Callavell system. Both wanted a decisive battle. The loyalist line closed by echelon into line astern and caught the traitors in a crossfire of battleship guns; a renegade breakout almost broke the line, but the Retribution Saint Augusta held it. Training academies still teach the battle as the model escalating engagement.", cr: ["Gav Thorpe — “The Battle of Callavell”, a historical refight scenario in White Dwarf; " + WS + ", p. 14–16."] }
  },
  /* ------------------------------------------------------------ TORPEDO RUN */
  {
    id: "cl-torpedo-run", grp: "cl-ws", name: "Torpedo Run", series: "Planet Killer preview · historical refight", trust: "classic",
    why: "A lone warship runs a gauntlet of torpedo boats. Small as a cruiser hunt, or big as the pursuit of the battleship Bloodwake.", src: "Warp Storm p. 124–125", book: "O", suggest: ["Chaos", "Imperial Navy"],
    others: "Any lone warship against any hunters with plenty of torpedoes. The author suggests swapping the roles too: one Imperial ship chased by a Chaos cruiser and her escorts.",
    sides: { a: { n: "Lone warship", f: "Chaos" }, b: { n: "Hunters", f: "Imperial Navy" } },
    pitch: "One enemy warship has broken through and must cross the system. Every torpedo boat in reach lies in wait along its path. Death or glory.",
    glance: [["Points", "Lone ship: one cruiser to battleship · Hunters: same points"], ["Table", "Not given — use your table"], ["Battlezone", "Deep space or outer reaches, uncluttered"], ["First turn", "Not given — see note"], ["Game ends", "The lone ship escapes or is destroyed"]],
    bring: ["One warship: a cruiser (small game), up to a battleship (the Bloodwake)", "One cruiser and many torpedo escorts", "Contact markers for the hunters"],
    forces: {
      a: ["A single warship: a cruiser, battlecruiser or battleship, depending on the size of game you want."],
      b: ["One cruiser and enough escorts to equal the lone ship’s points.", "Take lots of torpedo-armed escorts — that is the point of the scenario."]
    },
    draw: (v, W, H) => [
      R(0, 0, W, 45, "b", "Hunters’ markers"), R(0, H - 45, W, 45, "b", "Hunters’ markers"),
      H > 90 ? R(W - 8, 45, 8, H - 90, "a", "", { free: "x" }) : null,
      { z: "arrow", x1: W - 10, y1: H / 2, x2: W - 28, y2: H / 2, s: "a" },
      { z: "edge", e: "r", s: "a", l: "Lone ship starts here" }, { z: "edge", e: "l", s: "a", dash: 1, l: "Lone ship must exit here" },
      { z: "dim", x1: 22, y1: 0, x2: 22, y2: 45, l: "45 cm" }
    ],
    fit: () => [90, 100],
    mapNote: "As the magazine’s map: the lone ship crosses the long way; the hunters hide in 45 cm zones along both long edges.",
    steps: [
      { s: "a", t: "Choose one warship: a cruiser for a quick game, a battleship for the Bloodwake refight." },
      { s: "b", t: "Choose one cruiser and escorts up to the same points — as many torpedo boats as you can." },
      { t: "Set up a few phenomena for deep space or the outer reaches; keep the table uncluttered." },
      { s: "b", t: "Place a face-down contact marker for each squadron and the cruiser in the zones along the long edges, as in Convoy." },
      { s: "a", t: "Place the lone ship at one short edge so it has to cross the whole length of the table." },
      { t: "Decide who goes first (see note)." }
    ],
    notes: [OLD + "Contact markers work as in Convoy, RB p. 134–135.", "The scenario does not say who takes the first turn. Suggestion: the lone ship, as the convoy does in Convoy."],
    refs: [["Contact markers", "RB p. 134–135"], ["Torpedoes", "RB p. 76–77"]],
    play: [
      { w: "Lone ship movement", s: "a", t: "Moving within 30 cm of a contact marker activates it: flip it at once and finish the move; the hunters deploy it after your movement phase." },
      { w: "Start of the hunters’ movement", s: "b", t: "You may activate one marker yourself — two if the lone ship is on special orders." },
      { w: "All game", s: "a", t: "Leave by the opposite short edge. Uncrippled is a decisive victory, crippled a marginal one." }
    ],
    tools: [{ k: "toggle", id: "half", l: "The hunters have lost more than half their starting force", s: "b" }],
    rtools: [{ k: "ending", id: "how", l: "How did it end?", rows: [["The lone ship escaped, not crippled", "a"], ["The lone ship escaped, crippled", "a"], ["The lone ship was destroyed or immobilised", "b"]] }],
    end: ["When the lone warship leaves the opposite short edge, or is destroyed."],
    win: ["Lone ship off the far edge uncrippled: its decisive victory. Crippled but out: its marginal victory.", "Lone ship destroyed or immobilised: the hunters’ decisive victory — only a marginal one if they lost more than half their starting force."],
    result(st) {
      const i = get(st, "how", -1), half = get(st, "half", false);
      return i === 0 ? ["a", "Lone ship: decisive victory", "It broke through untouched."] : i === 1 ? ["a", "Lone ship: marginal victory", "It got out, crippled."] :
        i === 2 ? ["b", half ? "Hunters: marginal victory" : "Hunters: decisive victory", half ? "The kill cost more than half their force." : "The lone ship is gone."] : [null, "Battle in progress", "Mark how it ended."];
    },
    info: { bg: "The Chaos battleship Bloodwake and its escort slipped through the Cadian Gate, destroying the old flagship Admiral Holz on the way. The cruisers Narfel and Tsarfel gave chase; bombers from the Emperor class Arque Imperialis wrecked its steering, torpedo salvoes crippled it, and the Narfel finished it at point-blank range. The author freely admits the debt to the film Sink the Bismarck.", cr: ["David Camburn — “Torpedo Run”, the Planet Killer preview printed in " + WS + ", p. 124–125."] }
  },
  /* ------------------------------------------------------------ SPACE HULK CONVOY */
  {
    id: "cl-space-hulk-convoy", grp: "cl-mag", name: "Space Hulk Convoy", series: "Planet Killer 1 · scenario", trust: "classic",
    why: "Tow a captured Ork hulk past an ambush. Its guns come back to life one by one — and so do the Orks still aboard.", src: "Planet Killer 1 p. 48", book: "O", suggest: ["Imperial Navy", "Space Marines"],
    others: "Any escort fleet with two Space Marine strike cruisers (or two capital ships at Ld 6 standing in for them), against any ambushers.",
    sides: { a: { n: "Imperial convoy", f: "Imperial Navy + Space Marines" }, b: { n: "Ambushers" } },
    pitch: "The Navy and the Space Marines have taken an Ork hulk intact, at a price. Now it must be towed to a forge world — and the ambush is waiting in the ship graveyards.",
    glance: [["Points", "Convoy 1500 + the hulk · Ambushers 2000"], ["Table", "Not given — use your table"], ["Battlezone", "Ambushers place what they like in their zones"], ["First turn", "Imperial convoy"], ["Game ends", "The hulk escapes, or a side is broken"]],
    bring: ["An Ork space hulk (FL p. 391)", "Two Space Marine strike cruisers (FL p. 105)", "Asteroid fields and wrecks for the ambushers"],
    forces: {
      a: ["1500 pts, including at least two Space Marine strike cruisers at Ld 6 (skeleton crews — the rest are aboard the hulk).", "Plus the captured Ork space hulk, with only 20 hits left and no working weapons.", "Every capital ship starts with D3 hits of damage from the fight for the hulk (tool below); escorts are undamaged."],
      b: ["2000 pts of any fleet. Orks may not bring another space hulk.", "Undamaged."]
    },
    draw: (v, W, H) => [
      R(0, 0, W, 45, "b", "Ambushers’ zone"), R(0, H - 45, W, 45, "b", "Ambushers’ zone"),
      R(0, 45, 20, Math.max(5, H - 90), "a", "1–3: 20 cm", { rot: -90 }), R(W - 20, 45, 20, Math.max(5, H - 90), "a", "4–6: 20 cm", { rot: 90 }),
      { z: "dim", x1: W - 34, y1: 0, x2: W - 34, y2: 45, l: "45 cm" },
      { z: "text", x: W / 2, y: H / 2, l: "escape off the far short edge", s: "a" }
    ],
    fit: () => [80, 100],
    mapNote: "As the magazine’s map: 45 cm ambush zones along both long edges, 20 cm convoy zones at both short edges between them. The convoy rolls for its zone and escapes off the other end.",
    steps: [
      { s: "a", t: "Choose 1500 pts including two Space Marine strike cruisers at Ld 6. Roll D3 damage for each capital ship (tool below); the hulk has 20 hits left." },
      { s: "b", t: "Choose 2000 pts. Place as many asteroid fields and ship graveyards as you like in your two zones." },
      { s: "b", t: "Deploy first, in either or both of your zones." },
      { s: "a", t: "Roll a D6 for your zone (1–3 left, 4–6 right; tool below) and deploy the hulk and the fleet there." },
      { s: "a", t: "The convoy takes the first turn." }
    ],
    stools: [
      { k: "shiproll", id: "d3", l: "Starting damage on Imperial capital ships", cl: "Capital ships", n0: 4, il: i => "Capital ship " + (i + 1), out: d => "D3 = " + Math.ceil(d / 2) + " hits of damage" },
      { k: "roll", id: "zone", l: "Convoy zone", rows: () => [[1, 3, "Left short edge — escape off the right"], [4, 6, "Right short edge — escape off the left"]] }
    ],
    notes: ["Written for the original 1999 rules, when the Ork hulk profile was new (FL p. 391–392 today).", "The hulk’s launch bays are not on the reactivation table, so they stay dead.", "“Over 15 points of damage” is read as damage taken during this battle: the hulk starts with 20 hits left, so it is useless once it is down to 4 or fewer."],
    refs: [["Ork Hulk", "FL p. 391–392"], ["Space Marine strike cruiser", "FL p. 105"], ["Victory points", "RB p. 122"]],
    play: [
      { w: "Start of your turn, from turn 2", s: "a", t: "Roll a D6 (tool below). On 4+ a hulk weapon comes back on-line: roll a D10 on the reactivation table; if that weapon already works, roll again." },
      { w: "Orks!", s: "a", t: "A D10 roll of 0 (10) means Orks still aboard: the fight costs the hulk 1 hit. It can happen again." },
      { w: "All game", s: "a", t: "Get the hulk off the opposite short edge. If it takes more than 15 hits in this battle, it is useless and the ambushers win." }
    ],
    fx: T => T >= 2 ? [["a", "D6 for hulk reactivation: 4+ roll the D10"]] : [],
    tools: [
      { k: "roll", id: "react", l: "Hulk reactivation check", rows: () => [[1, 3, "Nothing comes back this turn"], [4, 6, "A weapon comes back: roll the D10 below"]] },
      { k: "reinf", id: "wpn", l: "Reactivated weapon (D10)", die: 10, from: 2, verb: "", sub: "D10 after a 4+ · weapons already working are rolled again · tap a row to mark it by hand", dup: "already working.", again: true, rows: [[1, "Prow gunz battery"], [2, "Prow torpedoes"], [3, "Prow heavy gunz"], [4, "Dorsal lance battery"], [5, "Starboard gunz battery"], [6, "Starboard torpedoes"], [7, "Port gunz battery"], [8, "Port torpedoes"], [9, "Aft gunz battery"], [10, "0 — Orks! The hulk takes 1 hit", true]] },
      { k: "counter", id: "dmg", l: "Hits the hulk has taken this battle", s: "a", max: 20, warn: v => v > 15 ? "More than 15: the hulk is useless — the ambushers win." : v ? (20 - v) + " of 20 hits left; " + (15 - v) + " more and it is useless." : "" }
    ],
    rtools: [{ k: "ending", id: "how", l: "How did it end?", rows: [["The hulk escaped with 15 or fewer hits taken", "a"], ["The ambushers were destroyed or driven off", "a"], ["The hulk took more than 15 hits, or was destroyed", "b"]] }],
    end: ["When the hulk leaves the opposite short edge or is wrecked.", "Or when one fleet is destroyed or driven off."],
    win: ["The convoy wins by getting the hulk off the opposite short edge, or by destroying or chasing away the ambushers.", "The ambushers win if the hulk takes more than 15 hits — it is useless for research after that."],
    result(st) {
      const i = get(st, "how", -1), d = get(st, "dmg", 0);
      if (i === 0) return d > 15 ? ["b", "Ambushers win", "The hulk got out, but with " + d + " hits taken it is useless."] : ["a", "Imperial victory", "The hulk is on its way to the forge world."];
      if (i === 1) return ["a", "Imperial victory", "The ambush was broken."];
      if (i === 2) return ["b", "Ambushers win", "The prize is ruined."];
      return d > 15 ? ["b", "Ambushers win", "More than 15 hits taken."] : [null, "Battle in progress", "Hulk damage this battle: " + d + "."];
    },
    info: { bg: "An Imperial fleet, with Space Marine help, has captured an Ork space hulk intact and cleansed it. It is being towed to the nearest forge world for the Adeptus Mechanicus to strip — but its enemies know what it is worth.", cr: ["Uwe Wegner — “Space Hulk Convoy”, " + PK1 + ", p. 48 (PDF p. 50)."] }
  },
  /* ------------------------------------------------------------ INVASION OF PHILLIPA II (campaign) */
  {
    id: "cl-phillipa", grp: "cl-mag", name: "Invasion of Phillipa II", series: "Corribra Sector · mini-campaign", trust: "classic", type: "Campaign",
    why: "Five battles from the rulebook with set forces, where each result changes the next. Includes the historical fleets to refight.", src: "Planet Killer 1 p. 40–46", book: "O", suggest: ["Imperial Navy", "Chaos", "Craftworld Eldar"],
    others: "Written for Imperial Navy against a Slaaneshi Chaos fleet, with an Eldar side battle. Any two fleets can play it; give the named commanders’ Leadership to your own.",
    sides: { a: { n: "Imperium", f: "Imperial Navy" }, b: { n: "Chaos", f: "Chaos (Slaanesh)" } },
    pitch: "A Slaaneshi fleet has seized the hive world Phillipa II. Twenty years of war in five battles, from a desperate blockade run to the fleet action that ends it.",
    glance: [["Points", "400–800 rising to 2000 each"], ["Table", "As each scenario"], ["Battles", "5, each from the rulebook"], ["Players", "Two (a third can play the Eldar)"], ["Victory", "Whoever wins the last battle"]],
    bring: ["Imperial and Chaos fleets up to 2000 pts", "An Eldar fleet of 700 pts for the side battle", "Mark of Slaanesh rules (FL p. 242)"],
    forces: {
      a: ["Each battle sets its own points; see the campaign tree on the Play tab.", "Admiral Ramirez leads from battle 4 (Ld 9)."],
      b: ["Each battle sets its own points.", "Lord Janobeg the Vile (Ld 8, Mark of Slaanesh) leads most battles; Warmaster Overfiend Drusil Spittletongue (Ld 9, Mark of Slaanesh) joins the last."]
    },
    noMap: "Each battle uses its rulebook scenario — open it from the campaign tree on the Play tab.",
    steps: [
      { t: "Agree who plays the Imperium and who plays Chaos; a third player can take the Eldar in battle 3." },
      { t: "Play the battles in order from the campaign tree. Each one names its scenario, points and leaders, and the historical ships if you want to refight it exactly." },
      { t: "Record each result in the tree: the ledger under it keeps track of points bonuses and penalties." }
    ],
    notes: ["Written for the original 1999 rules. Mark of Slaanesh: FL p. 242.", "Battle 4 is called Escalation but the magazine names Cruiser Clash as its scenario, at 1000 pts with battleships — so play Cruiser Clash with its alternatives. Escalating Engagement would fit the name and the historical account just as well; agree which.", "The Liberation lets the Imperials take up to 500 pts of Eldar “if the Imperials will accept their support”; the campaign does not tie this to the Eldar battle. Suggestion: only if the Eldar won it."],
    refs: [["Blockade Run, The Bait, Cruiser Clash, Fleet Engagement", "RB p. 128–143"], ["Mark of Slaanesh", "FL p. 242"], ["Siluria class light cruiser", "FL p. 78"]],
    play: [
      { w: "Between battles", t: "Apply the bonuses and penalties in the ledger to the next battle’s points." },
      { w: "Leaders", t: "The named commanders must be included where a battle says so, at the cost given." }
    ],
    tools: [
      { k: "tree", id: "path", l: "Campaign tree", start: "bl", nodes: PHIL },
      { k: "info", html: philLedger }
    ],
    end: ["After the fifth battle, The Liberation of Phillipa II."],
    win: ["The fleet that wins The Liberation of Phillipa II wins the campaign."],
    result(st, v, S) { const e = treeEnd(st, "path", S.tools[0]); return e ? [e.end, e.n, "The campaign is over."] : [null, "Campaign in progress", "Record each battle on the Play tab."]; },
    info: { bg: "The Slaaneshi fleet of Warmaster Overfiend Drusil Spittletongue dropped into the Phillipa system without warning. It took Admiral Ramirez more than twenty years to throw it out; by then most of the hive world’s people had been broken, and six of its seven hive cities are still lost.", cr: ["Matt Sprange — “Corribra Sector”, the campaign setting in " + PK1 + ", p. 36–46 (Invasion of Phillipa II, p. 40–46).", "The Siluria class light cruiser introduced there is now in the Fleets book (FL p. 78), which still mentions the Vanguard and the Thebes."] }
  },
  /* ------------------------------------------------------------ CORRIBRA II · MISSION 1 FIRST BLOOD */
  {
    id: "cl-corribra-1", grp: "cl-mag", name: "First Blood", series: "Corribra Sector II · Mission 1", trust: "classic",
    why: "Escorts and bait transports against an Ork pack, on the Blockade Run layout. The side still on the table wins.", src: "BFG Magazine 1 p. 38–39", book: "O", suggest: ["Imperial Navy", "Orks"],
    others: CORR_OTHERS,
    sides: { a: { n: "Imperium", f: "Imperial Navy" }, b: { n: "Orks", f: "Orks" } },
    pitch: "Captain Leigh’s escorts lie silent while six transports broadcast a fake distress call. The Orks come — but not the warlord’s kroozer.",
    glance: [["Points", "300 pts of escorts each + 6 Imperial transports"], ["Table", "As Blockade Run"], ["Battlezone", "Deep space"], ["First turn", "Roll-off"], ["Game ends", "A fleet is destroyed or disengages"]],
    bring: ["6 transports", "Escorts only on both sides"],
    forces: { a: ["300 pts of escorts.", LEIGH, "Six transports (the bait)."], b: ["300 pts of escorts.", "No warlord."] },
    draw: (v, W, H) => MAPS["blockade-run"](v, W, H).map(it => it.z === "rect" && it.l === "Runners: 15 cm" ? Object.assign({}, it, { l: "Imperium: 15 cm" }) : it.z === "edge" ? Object.assign({}, it, { l: "Orks’ edge", s: "b" }) : it),
    fit: () => [60, 80],
    mapNote: "Set up exactly as in Blockade Run, with the Imperials as the runners: Orks roll for their third, at least 60 cm from the Imperial edge.",
    steps: [
      { t: "Generate deep space phenomena (RB p. 107–108)." },
      { t: "Divide the table lengthways into thirds, as in Blockade Run." },
      { s: "b", t: "Roll a D6 for each squadron to see which third it goes in; nothing within 60 cm of the Imperial edge." },
      { s: "a", t: "Deploy the escorts and the six transports within 15 cm of your edge." },
      { t: "Roll off. The higher roll chooses to go first or second." }
    ],
    stools: [{ k: "roll", id: "third", l: "Ork placement", sub: "D6 per squadron", rows: () => [[1, 2, "Left third"], [3, 4, "Middle third"], [5, 6, "Right third"]] }],
    notes: ["Written for the original 1999 rules. The campaign does not price Captain Leigh; play him as a free fleet commander in all four missions."],
    refs: [["Blockade Run (set-up)", "RB p. 133"], ["Deep space generator", "RB p. 107–108"]],
    play: [{ w: "All game", t: "Nothing to escort, nothing to break through: destroy the other side, or make it run." }],
    tools: [],
    rtools: [
      { k: "ending", id: "how", l: "Who still has ships on the table?", rows: [["The Imperium", "a"], ["The Orks", "b"]] },
      corrNext([["Either way, go on to", "cl-corribra-2", "Mission 2: Running the Gork’s Pay to Ground"], ["The winner of this mission brings 500 pts there instead of 400.", "", ""]])
    ],
    end: ["When one fleet has been destroyed or has disengaged."],
    win: ["The side that still has ships on the table when the game ends wins."],
    result(st, v, S) { return endingResult(st, S, "how"); },
    info: { bg: "Captain Leigh asked to lead an escort task force across the border to strike at the Ork warlord Gutztoof before his new kroozers were finished. He baited a trap with transports — but a rival warlord drew Gutztoof and his kroozer, the Gork’s Pay, away, and only part of his fleet took the bait.", cr: [CORR_CR] }
  },
  /* ------------------------------------------------------------ MISSION 2 RUNNING THE GORK'S PAY TO GROUND */
  {
    id: "cl-corribra-2", grp: "cl-mag", name: "Running the Gork’s Pay to Ground", series: "Corribra Sector II · Mission 2", trust: "classic",
    why: "The Imperials must board and capture an Ork ship for its secrets. Cruiser Clash zones, but the Orks deploy everything first.", src: "BFG Magazine 1 p. 39", book: "O", suggest: ["Imperial Navy", "Orks"],
    others: CORR_OTHERS,
    sides: { a: { n: "Imperium", f: "Imperial Navy" }, b: { n: "Orks", f: "Orks" } },
    pitch: "The Orks know where a crippled Imperial patrol ship is hiding. To find it first, Leigh must take one of their ships and its crew alive.",
    glance: [["Points", "400 pts of escorts each (500 for Mission 1’s winner)"], ["Table", "As Cruiser Clash"], ["Battlezone", "Deep space"], ["First turn", "Imperium"], ["Game ends", "An Ork ship is boarded, or the Imperials are gone"]],
    bring: ["Escorts only on both sides"],
    forces: { a: ["400 pts of escorts — 500 if you won Mission 1.", LEIGH], b: ["400 pts of escorts — 500 if you won Mission 1.", "No warlord."] },
    draw: (v, W, H) => MAPS["cruiser-clash"](v, W, H).map(it => it.z === "rect" ? Object.assign({}, it, { l: it.s === "a" ? "Imperium" : "Orks (deploy first)", s: it.s === "a" ? "a" : "b" }) : it),
    fit: () => [90, 70],
    mapNote: "Cruiser Clash zones: 90 cm wide, 60 cm apart, against the long edges.",
    steps: [
      { t: "Generate deep space phenomena (RB p. 107–108)." },
      { s: "b", t: "Deploy your whole fleet first, in your zone." },
      { s: "a", t: "Deploy in your zone — Leigh has had time to size up the Orks." },
      { s: "a", t: "The Imperium takes the first turn." }
    ],
    notes: ["Written for the original 1999 rules. Boarding: RB p. 89–90."],
    refs: [["Cruiser Clash (zones)", "RB p. 128"], ["Boarding actions", "RB p. 89–90"]],
    play: [
      { w: "All game", s: "a", t: "Board an Ork ship successfully and you win at once." },
      { w: "All game", s: "b", t: "Destroy or drive off the whole Imperial fleet to win." }
    ],
    tools: [],
    rtools: [
      { k: "ending", id: "how", l: "How did it end?", rows: [["An Ork ship was boarded successfully", "a"], ["The Imperial fleet was destroyed or driven off", "b"], ["Neither — a draw", "draw"]] },
      corrNext([["The Imperials boarded an Ork ship:", "cl-corribra-3", "Mission 3: Saving the Thebes"], ["They did not:", "cl-corribra-4", "Mission 4: Destroy the Gork’s Pay!"]])
    ],
    end: ["When at least one Ork ship has been boarded successfully.", "Or when the Imperial fleet has been destroyed."],
    win: ["The Imperium wins at once by boarding an Ork ship successfully.", "The Orks win by destroying or driving off the whole Imperial fleet.", "Anything else is a draw. If the Imperials failed to board, the campaign skips straight to Mission 4."],
    result(st, v, S) { return endingResult(st, S, "how"); },
    info: { bg: "Listening to Ork transmissions after the first battle, Leigh learned that the Orks had caught an Imperial deep patrol and left one ship crippled. He chased the retreating Orks to capture a ship and learn where — but the Orks turned and fought.", cr: [CORR_CR] }
  },
  /* ------------------------------------------------------------ MISSION 3 SAVING THE THEBES */
  {
    id: "cl-corribra-3", grp: "cl-mag", name: "Saving the Thebes", series: "Corribra Sector II · Mission 3", trust: "classic",
    why: "Rescue a crippled light cruiser from an Ork pack, on The Bait layout. Lose here and the Orks win the whole campaign.", src: "BFG Magazine 1 p. 39–40", book: "O", suggest: ["Imperial Navy", "Orks"],
    others: CORR_OTHERS + " The Thebes is a Siluria class light cruiser (FL p. 78); a Dauntless will do.",
    sides: { a: { n: "Imperium", f: "Imperial Navy" }, b: { n: "Orks", f: "Orks" } },
    pitch: "The light cruiser Thebes limps away from an Ork pack with her thrusters and both broadsides wrecked. Leigh’s escorts jump in just in time.",
    glance: [["Points", "250 pts of escorts each + the Thebes"], ["Table", "As The Bait"], ["Battlezone", "Deep space"], ["First turn", "Imperium"], ["Game ends", "A fleet is destroyed or disengages"]],
    bring: ["A Siluria (or Dauntless) light cruiser as the Thebes", "Critical damage markers"],
    forces: { a: ["250 pts of escorts.", LEIGH, "The Thebes: a Siluria class light cruiser (or a Dauntless) with 1 hit of damage and three criticals: thrusters damaged, port armament damaged, starboard armament damaged."], b: ["250 pts of escorts.", "No warlord."] },
    draw: (v, W, H) => {
      const cx = W / 2, pz = Math.max(0, cx - 60);
      return [R(cx - 10, H / 2 - 12, 20, 24, "a", "", { free: 1 }), { z: "cm", x: cx, y: H / 2, s: "a", l: "Thebes" }, { z: "arrow", x1: cx + 12, y1: H / 2, x2: cx + 28, y2: H / 2, s: "a" },
        pz > 0 ? R(0, 0, pz, H, "b", pz >= 25 ? "Orks: 60 cm+\nbehind" : "") : null,
        { z: "dim", x1: cx - 60, y1: H - 16, x2: cx, y2: H - 16, l: "60 cm+" },
        { z: "edge", e: "r", s: "a", l: "Leigh’s escorts move on here, turn 1" }];
    },
    fit: () => [130, 60],
    mapNote: "As The Bait: the Thebes in the centre heading away from the Orks, who are at least 60 cm behind at a short edge. Leigh’s escorts move on from the other short edge in turn 1.",
    steps: [
      { t: "Generate deep space phenomena (RB p. 107–108)." },
      { s: "a", t: "Place the Thebes in the centre, facing the short edge your escorts will come from, with 1 hit of damage and its three criticals marked." },
      { s: "b", t: "Deploy at least 60 cm away, along the short edge behind the Thebes." },
      { s: "a", t: "Keep the escorts off the table; they move on from the other short edge in turn 1." },
      { s: "a", t: "The Imperium takes the first turn." }
    ],
    notes: ["Written for the original 1999 rules. The magazine calls this Scenario Two: The Bait (RB p. 130). The Siluria profile is now FL p. 78."],
    refs: [["The Bait (set-up)", "RB p. 130"], ["Critical damage", "RB p. 66–67"], ["Siluria class light cruiser", "FL p. 78"], ["Dauntless class light cruiser", "FL p. 77"]],
    play: [{ w: "Turn 1", s: "a", t: "Leigh’s escorts move on from the short edge opposite the Orks." }, { w: "All game", s: "a", t: "Destroy the whole Ork fleet; keeping the Thebes alive is the bonus." }],
    fx: T => T === 1 ? [["a", "Escorts move on from the far short edge"]] : [],
    tools: [{ k: "toggle", id: "thebes", l: "The Thebes is still alive", s: "a" }],
    rtools: [
      { k: "ending", id: "how", l: "How did it end?", rows: [["The Imperials destroyed the whole Ork fleet", "a"], ["The Orks won", "b"]] },
      corrNext([["The Imperials won:", "cl-corribra-4", "Mission 4: Destroy the Gork’s Pay! (bring the Thebes if she lived)"], ["The Orks won:", "", "the Orks win the whole campaign."]])
    ],
    end: ["When one fleet has been destroyed or has disengaged."],
    win: ["The Imperials win by destroying the entire Ork fleet — the Gork’s Pay is left without escorts. Saving the Thebes as well makes it all but certain.", "If the Orks win, all Imperial opposition in their space is gone: the Orks win the whole campaign."],
    result(st, v, S) { const r = endingResult(st, S, "how"); return get(st, "how", -1) === 0 && get(st, "thebes", false) ? ["a", "Imperial victory — and the Thebes is saved", "She joins the hunt for the Gork’s Pay."] : get(st, "how", -1) === 1 ? ["b", "Ork victory — the Orks win the campaign", "No Imperial opposition is left in their space."] : r; },
    info: { bg: "The old Siluria class light cruisers Themis and Thebes sat silent on deep patrol until an Ork test flight blundered into them. The Themis died in minutes; the Thebes drove the Orks off but was badly hurt, and could not call for help without giving herself away.", cr: [CORR_CR] }
  },
  /* ------------------------------------------------------------ MISSION 4 DESTROY THE GORK'S PAY! */
  {
    id: "cl-corribra-4", grp: "cl-mag", name: "Destroy the Gork’s Pay!", series: "Corribra Sector II · Mission 4", trust: "classic",
    why: "An Ork kill kroozer hides in an asteroid field and pounces when the escorts come close. The campaign’s finale.", src: "BFG Magazine 1 p. 40–41", book: "O", suggest: ["Imperial Navy", "Orks"],
    others: CORR_OTHERS + " Any lone capital ship can play the hidden ambusher.",
    sides: { a: { n: "Imperium", f: "Imperial Navy" }, b: { n: "Gork’s Pay", f: "Orks" } },
    pitch: "Warlord Gutztoof has powered down his kroozer deep in an asteroid field he knows like his own boot. Come within 15 cm and it strikes.",
    glance: [["Points", "250 pts of escorts (+ the Thebes) vs one kill kroozer"], ["Table", "Not given — use your table"], ["Battlezone", "Deep space, asteroid field in the centre"], ["First turn", "Imperium"], ["Game ends", "The kroozer or the escorts are gone"]],
    bring: ["An asteroid field at least 15 × 30 cm", "An Ork kill kroozer (FL p. 384)"],
    forces: {
      a: ["250 pts of escorts.", LEIGH, "The Thebes, if she survived Mission 3: all criticals repaired, damage kept."],
      b: ["The Gork’s Pay: a kill kroozer (FL p. 384) with Warlord Gutztoof, who gives it two extra re-rolls; Maniac Gunners and Mad Meks aboard (FL p. 367)."]
    },
    draw: (v, W, H) => [
      { z: "hatch", x: W / 2 - 15, y: H / 2 - 7.5, w: 30, h: 15, l: "", free: 1 }, { z: "cm", x: W / 2, y: H / 2 }, { z: "text", x: W / 2, y: H / 2 + 14, l: "field 30 × 15 cm+" },
      R(W / 2 - 30, H / 2 - 22.5, 60, 45, "b", "", { dash: 1, free: 1 }),
      { z: "text", x: W / 2, y: H / 2 - 28, l: "15 cm: the kroozer may appear", s: "b" },
      R(0, H - 30, W, 30, "a", "Imperium: within 30 cm of your edge")
    ],
    fit: () => [60, 90],
    mapNote: "The dashed line is 15 cm around the asteroid field: an Imperial ship ending its turn inside it lets the Gork’s Pay appear anywhere in the field.",
    steps: [
      { t: "Generate deep space phenomena (RB p. 107–108) and place an asteroid field at least 15 × 30 cm in the centre of the table." },
      { s: "a", t: "Deploy within 30 cm of your table edge." },
      { s: "b", t: "Keep the Gork’s Pay off the table." },
      { s: "a", t: "The Imperium takes the first turn." }
    ],
    notes: ["Written for the original 1999 rules; the kill kroozer was on p. 136 of that rulebook, now FL p. 382.", "In the Fleets book a warlord may take only one of Maniac Gunners and Mad Meks; the campaign gives Gutztoof both as a special character.", "The campaign says a Gutztoof who disengages has lost and the Imperials draw the campaign."],
    refs: [["Kill kroozer", "FL p. 384"], ["Ork warlord, Maniac Gunners, Mad Meks", "FL p. 367"], ["Asteroid fields", "RB p. 110"], ["Siluria class light cruiser", "FL p. 78"]],
    play: [
      { w: "End of each Imperial turn", s: "b", t: "If any Imperial ship is within 15 cm of the asteroid field, you may place the Gork’s Pay anywhere in the field, facing any way, and take your turn at once." },
      { w: "Asteroids", s: "b", t: "Gutztoof knows this field like his own boot: the Gork’s Pay never tests for asteroid damage, except on All Ahead Full." },
      { w: "Disengaging", s: "b", t: "Gutztoof may disengage, but a warlord who runs is soon replaced: the Orks lose the campaign and the Imperials draw it." }
    ],
    fx: (T, st) => get(st, "out", false) ? [] : [["b", "End of the Imperial turn: anyone within 15 cm of the field? The kroozer may appear"]],
    tools: [{ k: "toggle", id: "out", l: "The Gork’s Pay has appeared", s: "b" }],
    rtools: [{ k: "ending", id: "how", l: "How did it end?", rows: [["The Gork’s Pay was destroyed", "a"], ["The Imperial fleet was destroyed or driven back", "b"], ["Gutztoof disengaged", "draw", "Draw"]] }],
    end: ["When the Imperial fleet or the Gork’s Pay has been destroyed or has disengaged."],
    win: ["Gork’s Pay destroyed: Captain Leigh returns in triumph — the Imperial campaign victory.", "Imperial fleet destroyed or driven back: Gutztoof’s Waaagh! begins — the Ork campaign victory.", "If Gutztoof disengages, the Orks have lost and the Imperials draw the campaign."],
    result(st, v, S) {
      const i = get(st, "how", -1);
      return i === 0 ? ["a", "Imperial victory — the campaign is won", "Leigh returns to Corribra in triumph."] : i === 1 ? ["b", "Ork victory — the campaign is won", "Orks flock to Gutztoof’s banner."] : i === 2 ? ["draw", "The Orks have lost; the campaign is a draw", "A warlord who runs does not stay warlord."] : [null, "Battle in progress", "Mark how it ended."];
    },
    info: { bg: "Back from crushing a rival, Gutztoof learned that much of his fleet was gone and guessed who would come next. He hid the Gork’s Pay, powered down, in an asteroid field he knew well, to cripple Leigh’s whole squadron in one ambush.", cr: [CORR_CR] }
  },
  /* ------------------------------------------------------------ PIRATES (campaign) */
  {
    id: "cl-pirates-campaign", grp: "cl-mag", name: "Pirates", series: "BFG Magazine 1 · campaign variant", trust: "classic", type: "Campaign",
    why: "A two-player campaign variant: a pirate fleet raids a subsector while the Imperial Navy hunts for its hidden base.", src: "BFG Magazine 1 p. 30–31", book: "O", suggest: ["Imperial Navy", "Orks · Eldar · Chaos"],
    others: "The pirates are usually Orks or Eldar, but a small Chaos fleet works too. The hunter is Imperial; any fleet with a navy-like role can stand in.",
    sides: { a: { n: "Imperial Navy", f: "Imperial Navy" }, b: { n: "Pirates", f: "Orks, Eldar or Chaos" } },
    pitch: "The pirates must get rich before the Navy finds their base. Every game adds to their renown; every game the Navy’s grip on the subsector tightens.",
    glance: [["Points", "Rosters: Imperial 2000 · Pirates 1500"], ["Table", "As each scenario"], ["Battles", "Until a fleet or the base is gone"], ["Players", "Two"], ["Victory", "Base destroyed, fleet wiped out — or a pirate king"]],
    bring: ["A subsector map of 10–14 systems (RB p. 146–)", "Campaign rosters", "Paper for the secret base"],
    forces: { a: ["A 2000 pt fleet roster."], b: ["A 1500 pt fleet roster."] },
    noMap: "A campaign: each game uses the scenario rolled or chosen on the campaign tables.",
    steps: [
      { t: "Create a subsector as normal (RB p. 146–); 10–14 systems is a good size, and more systems help the pirates." },
      { s: "b", t: "Choose in secret the system that holds your base (tool on the Play tab)." },
      { s: "a", t: "Announce openly the system where you start your operations." },
      { t: "Play the campaign with the normal campaign rules (RB p. 144–) and the changes on the Play tab." }
    ],
    notes: ["Written for the original 1999 campaign rules; the Remastered campaign rules (RB p. 144–) work the same way. The pirate base is placed as in the rulebook campaign (the magazine points to old p. 151).", "Optional rule from the magazine: Space Marines rolled on the Appeals table do not fight the next game for free; they join the Imperial roster and are paid for every game they play."],
    refs: [["Campaign rules", "RB p. 144–"], ["Planetary Assault, Exterminatus", "RB p. 136–141"], ["Sub-plots", "RB p. 124–127"]],
    play: [
      { w: "Start of every game", s: "a", t: "Imperial domination: claim any one system linked to one you already own. The pirates cannot stop it." },
      { w: "Initiative", s: "b", t: "+1 to every initiative roll while your base is undiscovered — usually +2 in practice, since the Navy will own more systems." },
      { w: "Receive orders", t: "Only raids and major raids are fought (major raid on a D6 roll of 5–6, otherwise a raid) — unless the Imperial player wins the initiative with 21 or more renown: then they may choose a battle." },
      { w: "The pirate base", s: "a", t: "You must own its system to attack it. Once found, the pirates lose their +1 initiative. If the first attack fails, attack again only by winning initiative: then you may choose Planetary Assault or Exterminatus there." },
      { w: "Base defences", s: "b", t: "In Planetary Assault or Exterminatus at your base: double the rolled defences with 25+ renown, triple with 40+. You may also move up to 10% of your fleet points into extra defences, no more than 150 pts on any one item." },
      { w: "Aftermath", s: "b", t: "+1 renown after every game: the rest of the fleet keeps raiding elsewhere." },
      { w: "Sub-plots", t: "Strongly recommended for this campaign." }
    ],
    tools: [
      { k: "secret", id: "base", l: "Pirate base system", sub: "Pirates: pick the system’s number on your subsector map. It stays hidden until you show it.", opts: ["System 1", "System 2", "System 3", "System 4", "System 5", "System 6", "System 7", "System 8", "System 9", "System 10", "System 11", "System 12", "System 13", "System 14"] },
      { k: "counter", id: "ren", l: "Pirate renown", s: "b", warn: v => v > 50 ? "Over 50: a pirate king — free to move on to richer hunting grounds." : v >= 40 ? "40+: base defences tripled." : v >= 25 ? "25+: base defences doubled." : "" },
      { k: "counter", id: "iren", l: "Imperial renown", s: "a", warn: v => v >= 21 ? "21+: winning the initiative lets you choose a battle." : "" },
      { k: "toggle", id: "found", l: "The pirate base has been found (pirates lose +1 initiative)", s: "a" }
    ],
    end: ["When one fleet is completely destroyed, or the pirate base is destroyed. Either player may concede at any time."],
    win: ["The Navy wins by destroying the pirate base or the pirate fleet — the usual ending.", "A pirate who reaches more than 50 renown has become a pirate king and leaves for richer, less guarded systems: a pirate victory."],
    rtools: [{ k: "ending", id: "how", l: "How did it end?", rows: [["The pirate base or fleet was destroyed", "a"], ["The pirates passed 50 renown", "b"], ["The Imperial fleet was destroyed", "b"]] }],
    result(st, v, S) { if (get(st, "ren", 0) > 50 && get(st, "how", -1) < 0) return ["b", "Pirate king!", "More than 50 renown."]; return get(st, "how", -1) >= 0 ? endingResult(st, S, "how") : [null, "Campaign in progress", "Pirate renown " + get(st, "ren", 0) + "."]; },
    info: { bg: "The Navy is stretched so thin that decades can pass without a warship visiting a quiet system. Pirates set up a hidden base and strike for years — until the Navy finally comes, as it always does. Most pirates take one last profit and leave; a few stay and fight.", cr: ["Matt Sprange — “New Scenario: Pirates”, " + BM1 + ", p. 30–31 (PDF p. 32–33)."] }
  }
  ]);
})();
