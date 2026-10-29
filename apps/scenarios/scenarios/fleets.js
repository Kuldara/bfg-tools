/* Fleets book scenarios — BFG Remastered Fleets v0.40: the six Rogue Trader scenarios
   (FL p. 208–221) and Craftworld Assault (FL p. 336–339).
   Summarised in our own words; every scenario is hand-made (see docs/history/scenarios/LUEMINUT.md, in Finnish).
   The Fleets book still has unresolved cross-references ("[???]", old rulebook and
   Armada pages); the scenarios give their Remastered places and say so in a note. */
(function () {
  const FL_CREDIT = "BFG Remastered Fleets v0.40";
  const RT_CREDIT = "Rogue Trader scenarios, Fleets v0.40 p. 208–221. The Fleets book does not name their author.";
  const XREF = "The Fleets book’s cross-references in this scenario read “[???]” or point to page numbers in the old rulebook and Armada. They are given here as their Remastered places.";

  /* contact markers as in Convoy (RB p. 134–135) */
  const markers = (who, foe, s, fs) => [
    { w: "Your movement", s, t: "Any of your ships moving within 30 cm of a face-down contact marker activates it: flip it at once, then finish the move. After your movement phase the " + foe + (foe.endsWith("s") ? " deploy" : " deploys") + " every activated marker." },
    { w: "Start of the " + foe + (foe.endsWith("s") ? "’" : "’s") + " movement", s: fs, t: "You may activate one marker yourself — two if any enemy ship is on special orders." }
  ];

  /* escaping transport value: heavy = 2 (1 crippled), armed freighter and armed cargo vessel / fast clipper = ½, rounded down at the end (FL p. 192, 202, 523) */
  const tvOut = st => get(st, "rt", 0) + 2 * get(st, "ht", 0) + get(st, "hc", 0) + Math.floor((get(st, "af", 0) + get(st, "fc", 0)) / 2);

  /* attacker table for Merchantmen's Folly: its own (the variant "std") or a threat table (FL p. 208–209) */
  const MF_TABLE = [[1, 1, "One deadfall torpedo or attack craft cluster"], [2, 2, "Two deadfall torpedo or attack craft clusters"], [3, 3, "Three deadfall torpedo or attack craft clusters"], [4, 4, "A squadron of escorts worth up to 100 pts"], [5, 5, "A squadron of escorts worth up to 150 pts"], [6, 6, "One capital ship worth up to 200 pts"]];
  const mfRows = v => v === "std" || !THREATS[v] ? MF_TABLE : THREATS[v].rows;
  const mfName = v => v === "std" || !THREATS[v] ? "this scenario’s own table" : "the " + THREATS[v].n + " table (FL p. 208–209)";
  const rowText = (rows, d) => { const r = rows.find(x => d >= x[0] && d <= x[1]); return r ? r[2] : ""; };
  /* Space Hulk!: the attackers' own table, no threat tables (FL p. 218) */
  const SH_TABLE = [[1, 1, "Three deadfall torpedo or attack craft clusters"], [2, 2, "A squadron of escorts worth up to 100 pts"], [3, 3, "A squadron of escorts worth up to 150 pts"], [4, 4, "A squadron of escorts worth up to 200 pts"], [5, 5, "One capital ship worth up to 210 pts"], [6, 6, "One capital ship worth up to 250 pts"]];

  addScenarios([
  /* ------------------------------------------------------------ RT 1 MERCHANTMEN'S FOLLY */
  {
    id: "fl-merchantmens-folly", grp: "fleets", name: "Merchantmen’s Folly", series: "Rogue Traders · Scenario One", trust: "fleets",
    why: "Fleets book scenario: Convoy with a ragtag merchant fleet that will not keep formation.", src: "FL p. 210–211", book: "O", suggest: ["Rogue Traders"],
    others: "Written for a Rogue Trader escorting merchantmen; the convoy’s armed freighters, Q-ships and fast clippers are in the Fleets book (FL p. 202, 521–523) and any fleet can take them. The attackers use their own fleet list.",
    sides: { a: { n: "Convoy", f: "Rogue Traders" }, b: { n: "Attackers" } },
    pitch: "Ten transports’ worth of explorers and hired merchantmen head for a new colony. Pirates lie in wait — but some of these merchantmen bite back, and some panic.",
    variants: [["std", "Own table"], ["trap", "Cruiser Trap"], ["stalk", "Stalkers"], ["mine", "Old Minefield"], ["wolf", "Wolf Packs"]],
    glance: v => [["Points", "Convoy: 10 transports + " + (v === "std" ? 500 : 750) + " pts · attackers random"], ["Table", "Not given — use your table"], ["Battlezone", "Any, agreed"], ["First turn", "Convoy"], ["Game ends", "The last transport leaves or dies"]],
    bring: v => ["Transports: 2 armed freighters, 2 Q-ships, 2 fast clippers and the rest", "Contact markers, one per attacking unit", "Torpedo and attack craft markers", "Paper to note which freighters are Q-ships"].concat(v === "stalk" ? ["Daemon mine markers", "Tyranid escort drones or cruiser, a daemonship"] : v === "mine" ? ["Orbital mine markers"] : []),
    forces: v => ({
      a: ["Exactly 10 transports’ worth: a pair of armed freighters or of fast clippers counts as one transport, a heavy transport as two; Q-ships and escort carriers count zero (convoy check below).", "Must include at least 2 armed freighters, 2 Q-ships and 2 Rogue Trader fast clippers; at most 2 heavy transports (40 pts each).", v === "std" ? "Up to 100 pts per two transports’ worth: 500 pts. Transport variants come out of this first; the rest buys warships." : "Up to 150 pts per two transports’ worth, since the attackers roll on a threat table: 750 pts. Transport variants come out of this first; the rest buys warships.", "Every transport and civilian ship has −1 Leadership, rolls for Leadership and special orders on its own, and cannot join a squadron."],
      b: ["Rolled at random: D3+5 rolls on " + mfName(v) + " (tool below). Pick the version above to switch tables.", "Escort squadrons and capital ships come from your fleet list."]
    }),
    draw: (v, W, H) => MAPS.convoy(v, W, H).concat([{ z: "edge", e: "t", s: "n", dash: 1, l: "Long edges: a transport leaving here is destroyed" }, { z: "edge", e: "b", s: "n", dash: 1, l: "" }]),
    fit: () => [100, 91],
    mapNote: "As in Convoy: the convoy enters from a short edge (rolled), not within 45 cm of either long edge, and leaves by the opposite short edge.",
    stoolsFirst: false,
    steps: [
      { s: "b", t: "Choose your table: this scenario’s own, or one of the four Fleets book threat tables (the versions above). Then make D3+5 rolls on it (tool below)." },
      { s: "a", t: "Build the convoy: exactly 10 transports’ worth, with at least 2 armed freighters, 2 Q-ships and 2 fast clippers, and no more than 2 heavy transports (convoy check below)." },
      { s: "a", t: "Pay for the transport variants out of your allowance — 500 pts, or 750 pts if the attackers took a threat table — then spend the rest on warships. Note in secret which freighters are Q-ships." },
      { s: "a", t: "Roll Leadership for every transport and civilian ship on its own, at −1 Ld. They cannot form squadrons." },
      { t: "Set up celestial phenomena in any agreed way — near a planet or out in deep space." },
      { s: "b", t: "Place a face-down contact marker for each capital ship, squadron, deadfall cluster and attack craft cluster: at least 30 cm apart and not within 30 cm of a table edge. Stack extra markers if they do not fit." },
      { s: "a", t: "Roll a D6 for the short edge the convoy enters from. Place one convoy ship there to mark the entry point, not within 45 cm of either long edge." },
      { s: "a", t: "Decide which ships move on in turn 1 and which wait to enter at the start of turn 2." },
      { s: "a", t: "The convoy takes the first turn." }
    ],
    stools: [
      { k: "val", id: "nr", l: "Number of rolls: D3 + 5", opts: [6, 7, 8], roll: () => 5 + dn(3) },
      { k: "shiproll", id: "frc", l: "Roll the attacking forces", cl: "Rolls", n0: st => get(st, "nr", 0) || 7, il: i => "Roll " + (i + 1), out: (d, st) => rowText(mfRows(st.v), d), sub: "On the table of the version chosen above." },
      { k: "info", html: st => "<h3>The table: " + esc(mfName(st.v)) + "</h3><table class='ltab'>" + mfRows(st.v).map(r => "<tr><td>" + r[0] + "</td><td>" + fmt(r[2]) + "</td></tr>").join("") + "</table>" },
      { k: "html", html: "<h3>Build the convoy</h3><div class='sub' style='margin:0'>Preset to the smallest legal convoy. Change the numbers to match yours; the check below follows.</div>" },
      { k: "counter", id: "c_rt", l: "Regular transports", start: 8 },
      { k: "counter", id: "c_ht", l: "Heavy transports (count 2)", max: 2 },
      { k: "counter", id: "c_af", l: "Armed freighters (½ each)", start: 2 },
      { k: "counter", id: "c_fc", l: "Fast clippers (½ each)", start: 2 },
      { k: "counter", id: "c_qs", l: "Q-ships (count 0)", start: 2 },
      { k: "counter", id: "c_ec", l: "Escort carriers (count 0)" },
      { k: "info", html: st => {
        const rt = get(st, "c_rt", 8), ht = get(st, "c_ht", 0), af = get(st, "c_af", 2), fc = get(st, "c_fc", 2), qs = get(st, "c_qs", 2), ec = get(st, "c_ec", 0);
        const val = rt + 2 * ht + Math.floor(af / 2) + Math.floor(fc / 2), cost = 40 * ht + 20 * af + 20 * fc + 60 * qs + 60 * ec, allow = st.v && st.v !== "std" ? 750 : 500;
        const ok = (c, t) => "<li>" + (c ? "✓ " : "✗ ") + t + "</li>";
        return "<h3>Convoy check</h3><ul class='plain'>" + ok(val === 10, "Transport value <b>" + val + "</b> — must be exactly 10") + ok(af >= 2 && qs >= 2 && fc >= 2, "At least 2 armed freighters, 2 Q-ships and 2 fast clippers") + ok(ht <= 2, "At most 2 heavy transports") + "</ul>" +
          "<p class='calc'>Transport variants cost <b>" + cost + " pts</b> of the <b>" + allow + " pts</b> allowance: <b>" + Math.max(0, allow - cost) + " pts</b> left for warships" + (cost > allow ? " — over the allowance!" : "") + ".</p><p class='small muted' style='margin:0'>Costs: heavy transport 40, armed freighter 20, fast clipper (armed cargo vessel) 20, Q-ship 60, escort carrier 60 pts (FL p. 192, 202, 521–523). Regular transports cost nothing here (see note).</p>";
      } }
    ],
    notes: v => [XREF + " Convoy set-up, markers and first turn: RB p. 134–135. Threat tables: FL p. 198–199. Transport variants: FL p. 192, 202, 521–523.",
      "The scenario prices only heavy transports and says the transport variants are chosen before “any remaining available points” go on warships. We read that as: variants are paid from the escort allowance, regular transports are free as in Convoy. Agree before play.",
      "The discipline table runs from 2 to 11; a roll of 12 has no entry. Suggestion: treat 12 as “the convoy keeps formation”.",
      "How much an escaping ship counts comes from the ship profiles: a heavy transport is two transports (one if crippled), an armed freighter or a fast clipper half a transport, rounded down at the end; Q-ships and escort carriers count nothing (FL p. 192, 202, 522–523)."].concat(v === "stalk" ? ["Warp beasts and daemon mines carry victory points, but this scenario is decided by escaping transports; their points matter only for a campaign tally."] : []),
    refs: v => [["Convoy set-up and contact markers", "RB p. 134–135"], ["Threat tables", "FL p. 208–209"], ["Heavy transport", "FL p. 192"], ["Armed cargo vessel / fast clipper", "FL p. 202"], ["Escort carrier, Q-ship, armed freighter", "FL p. 521–523"], ["Rogue Traders fleet list", "FL p. 184"]].concat(
      v === "stalk" ? [["Orbital mines (daemon mines build on them)", "FL p. 23, 512"], ["Daemonships", "FL p. 236–237"], ["Tyranid escort drones and cruisers", "FL p. 432–"]] : v === "mine" ? [["Orbital mines", "FL p. 23, 512"]] : v === "wolf" ? [["Xenos vessels", "FL p. 194"]] : []),
    play: [
      { w: "Start of your turn, from turn 2", s: "a", t: "Roll 2D6 on the discipline table (tool below). Special orders it calls for pass automatically and must be taken that turn." },
      { w: "Turn 2", s: "a", t: "Convoy ships held back enter at the start of the turn." },
      ...markers("Convoy", "attackers", "a", "b"),
      { w: "Deadfall torpedoes, attack craft, ships", s: "b", t: "Activated markers deploy as in Convoy: torpedoes D6+2 strength, attack craft D3+1 squadrons, escorts on the marker in formation, a capital ship on the marker facing any way." },
      { w: "Q-ships", s: "a", t: "A Q-ship may pass as a regular transport until you reveal it, or until it is hit twice (two blast markers)." },
      { w: "Leaving the table", t: "A transport leaving a long edge for any reason is destroyed. Q-ships and escort carriers leaving it only count as disengaged." },
      ...[].concat(...Object.entries(THREAT_PLAY).map(([k, list]) => list.map(x => Object.assign({ only: [k] }, x))))
    ],
    fx: T => T === 1 ? [["a", "Ships held back enter at the start of turn 2"]] : T === 2 ? [["a", "Held-back ships enter now"], ["a", "2D6 discipline roll at the start of your turn"]] : [["a", "2D6 discipline roll at the start of your turn"]],
    tools: [
      { k: "roll", id: "disc", l: "Convoy discipline", d2: true, sub: "2D6 at the start of each convoy turn from turn 2", rows: () => [[2, 2, "Engine trouble: two regular transports (or a heavy transport, if any) lose 5 cm speed this turn"], [3, 3, "Engine trouble: one regular transport loses 5 cm speed this turn"], [4, 4, "Hothead: an armed freighter turns towards the nearest enemy contact and moves its full distance to engage"], [5, 5, "The convoy keeps formation and follows your orders"], [6, 6, "Hotheads: an armed freighter and a Q-ship turn towards the nearest enemy contact and move their full distance"], [7, 7, "The convoy keeps formation and follows your orders"], [8, 8, "Hotheads: two armed freighters and a Q-ship turn towards the nearest enemy contact and move their full distance"], [9, 9, "The convoy keeps formation and follows your orders"], [10, 10, "Panic: a fast clipper comes to a new heading directly away from the nearest enemy contact and moves its full distance"], [11, 11, "Panic: a fast clipper goes All Ahead Full at once"], [12, 12, "No entry in the book (see note) — suggestion: the convoy keeps formation"]] },
      { k: "counter", id: "rt", l: "Regular transports off the far edge", s: "a", res: 1 },
      { k: "counter", id: "ht", l: "Heavy transports off (not crippled)", s: "a", res: 1 },
      { k: "counter", id: "hc", l: "Heavy transports off (crippled)", s: "a", res: 1 },
      { k: "counter", id: "af", l: "Armed freighters off", s: "a", res: 1 },
      { k: "counter", id: "fc", l: "Fast clippers off", s: "a", res: 1 },
      { k: "info", res: 1, html: st => "<h3>Escaped transport value</h3><p class='calc'><b>" + tvOut(st) + "</b> — heavy transports count 2 (crippled 1), armed freighters and fast clippers ½ each, rounded down.</p>" }
    ],
    end: ["When the last transport has left the table by the opposite short edge or been destroyed."],
    win: ["Count the transport value that escaped by the opposite short edge (tools in Play).", "0–1: attackers’ major victory (+1 renown). 2–3: attackers’ victory. 4–5: convoy victory. 6 or more: convoy’s major victory (+1 renown).", "The points value of every escaping transport is added to the convoy’s victory points."],
    result(st) {
      const n = tvOut(st);
      return n >= 6 ? ["a", "Convoy’s major victory (+1 renown)", "Transport value " + n + " escaped."] : n >= 4 ? ["a", "Convoy victory", "Transport value " + n + " escaped."] :
        n >= 2 ? ["b", "Attackers’ victory (so far)", "Transport value " + n + " escaped."] : ["b", "Attackers’ major victory (so far)", "Transport value " + n + " escaped — 4 or more is a convoy win."];
    },
    info: { bg: "Far from controlled space, a Rogue Trader shepherds a crowd of eager explorers and hastily hired merchantmen towards a newly settled world. Such a fleet is hard to keep in line and an easy mark for pirates — though it may not be as helpless as it looks.", cr: [RT_CREDIT, FL_CREDIT + ", p. 200–201."] }
  },
  /* ------------------------------------------------------------ RT 2 THE HUNTER AND THE PREY */
  {
    id: "fl-hunter-and-prey", grp: "fleets", name: "The Hunter and the Prey", series: "Rogue Traders · Scenario Two", trust: "fleets",
    why: "Fleets book scenario: a pirate haven hidden behind contact markers, with one force docked at a secret base.", src: "FL p. 212–213", book: "O", suggest: ["Rogue Traders"],
    others: "Any hunting fleet and any raiders; both must be mostly escorts and may not take battleships.",
    sides: { a: { n: "Hunters", f: "Rogue Traders" }, b: { n: "Raiders" } },
    pitch: "Hired to clear a pirate-infested system, the hunters sweep towards two small moons. Somewhere among the rocks one raider force waits on guard — and the other sits docked at a hidden base.",
    glance: [["Points", "Hunters: agreed · Raiders: up to half + D6×10 pts of defences"], ["Table", "Not given — use your table"], ["Battlezone", "Two small planets, D3 asteroid fields per quarter"], ["First turn", "Hunters"], ["Game ends", "After 10 turns, or a fleet is gone"]],
    bring: ["Two small planets or moons", "Asteroid fields (D3 per table quarter)", "Contact markers and face-down defence counters", "Paper to note the pirate base", "Planetary defences for the raiders"],
    forces: {
      a: ["The agreed points. No battleships.", "At least half the points in escorts, in squadrons of 2–6."],
      b: ["Up to half the hunters’ points. No battleships.", "At least half the points in escorts, in squadrons of 2–6.", "Split as evenly as possible into Force 1 and Force 2.", "Plus up to D6×10 pts of orbital defences (tool below)."]
    },
    draw: (v, W, H) => {
      const r = 6, px = W - 30 - r, y1 = 30 + r, y2 = Math.max(y1 + 2 * r + 30, H - 30 - r);
      return [
        { z: "sun", e: "l" },
        R(45, 0, W - 45, H, "b", "", { dash: 1 }),
        R(0, 0, 15, H, "a", "Hunters: 15 cm", { rot: -90 }),
        { z: "line", x1: W / 2, y1: 0, x2: W / 2, y2: H }, { z: "line", x1: 0, y1: H / 2, x2: W, y2: H / 2 },
        { z: "planet", cx: px, cy: y1, r, l: "A", free: 1 }, { z: "planet", cx: px, cy: y2, r, l: "B", free: 1 },
        { z: "text", x: (45 + W / 2) / 2 + 5, y: H / 4, l: "raider markers\nbeyond 45 cm", s: "b" },
        { z: "text", x: (45 + W / 2) / 2 + 5, y: H * .75, l: "D3 asteroid\nfields per quarter", s: "n" },
        { z: "dim", x1: 0, y1: H - 12, x2: 45, y2: H - 12, l: "45 cm" },
        { z: "dim", x1: px + r, y1: y1, x2: W, y2: y1, l: "30+" }
      ];
    },
    fit: () => [120, 115],
    mapNote: "Left = sunward edge (roll which short edge it is). The planets go nearest the far short edge, at least 30 cm from every edge and from each other; asteroid fields at least 15 cm from either planet.",
    steps: [
      { t: "Agree the hunters’ points; the raiders get up to half of that. Neither side takes battleships, and each puts at least half its points into escorts in squadrons of 2–6." },
      { s: "b", t: "Split your fleet as evenly as possible into Force 1 and Force 2, and roll for your orbital defences (tool below)." },
      { t: "Roll which short edge is sunward (D6: 1–3 left, 4–6 right). The map shows it on the left." },
      { t: "Place two small planets nearest the opposite short edge, at least 30 cm from every table edge and from each other. Call them A and B." },
      { t: "Place D3 asteroid fields in each quarter of the table, none within 15 cm of either planet. Add other phenomena if you agree." },
      { s: "b", t: "Roll which force is on guard (tool below). Place a face-down contact marker for each of its cruisers and each escort squadron of two or more: at least 30 cm apart and not within 45 cm of the sunward edge. Stack markers that do not fit." },
      { s: "b", t: "The other force is on standby, docked in low orbit at one of the planets. Note in secret which planet hides the pirate base (tool below)." },
      { s: "b", t: "Put a face-down counter for each orbital defence anywhere not within 45 cm of the sunward edge — they need not be 30 cm apart." },
      { s: "a", t: "Deploy within 15 cm of the sunward edge." },
      { s: "a", t: "The hunters take the first turn." }
    ],
    stools: [
      { k: "val", id: "def", l: "Raiders’ orbital defences: up to D6×10 pts", opts: [10, 20, 30, 40, 50, 60], roll: () => 10 * dn(6), unit: " pts" },
      { k: "roll", id: "guard", l: "Which force is on guard?", rows: () => [[1, 3, "Force 1 is on guard (contact markers); Force 2 is docked"], [4, 6, "Force 2 is on guard (contact markers); Force 1 is docked"]] },
      { k: "secret", id: "base", l: "The pirate base", sub: "Raiders: note which planet hides the base. It stays hidden until you show it.", opts: ["Planet A", "Planet B"], rnd: true }
    ],
    notes: [XREF + " Contact markers: RB p. 134. Orbital defences (old rulebook p. 141–144): FL p. 496–. “D6×10 orbital defences” is read as D6×10 points of them.",
      "The text puts the hunters within 15 cm of the sunward edge; the book’s map shades a 45 cm band there and labels it the hunters’ deployment zone. We follow the text: the 45 cm band is where raider markers and defences may not go.",
      "The book does not say whether the docked force is placed on the table where the hunters can see it — if it is, the base is no secret. Suggestion: keep it off the table, in low orbit at the noted planet, and place it touching that planet when a ship passes its Leadership test.",
      "Voluntary activation is allowed “two counters if the defender is on special orders”. The original version of this scenario (White Dwarf, reprinted in Warp Storm, 2000) says it plainly: if any hunting ship is on special orders. The original also puts one planet in each of the two table quarters furthest from the sunward edge, and allowed the hunters one battleship."],
    refs: [["Contact markers", "RB p. 134"], ["Low orbit and gravity wells", "RB p. 113–116"], ["Planetary defences", "FL p. 496–"], ["Orbital mines (minefields)", "FL p. 512"], ["Victory points", "RB p. 122"]],
    play: [
      ...markers("Hunter", "raiders", "a", "b"),
      { w: "Activated escort squadron", s: "b", t: "Put one ship on the marker and the rest as close to it as you can, none closer to the hunters than the first; all facing the same way, any direction." },
      { w: "Activated capital ship, defence or minefield", s: "b", t: "Place it on the marker facing any way. A minefield rolls for its size as normal." },
      { w: "Docked raiders", s: "b", t: "Ships docked in low orbit are on standby. Each must pass a Leadership test to leave low orbit — not a command check, so a failure does not stop the others. A ship leaving low orbit may take no special orders that turn except Brace for Impact." },
      { w: "End of the game", s: "a", t: "Your ships in low orbit of the pirate base planet when the game ends score their own points value: they can storm the base." },
      { w: "Turn 10", t: "Last turn." }
    ],
    turnMax: () => 10,
    fx: T => T === 1 ? [["b", "No voluntary activation yet"]] : T === 10 ? [[null, "Last turn"], ["a", "Count your ships in low orbit of the pirate base"]] : [],
    tools: [{ k: "secret", id: "base", l: "The pirate base", sub: "Raiders: note which planet hides the base. It stays hidden until you show it.", opts: ["Planet A", "Planet B"], rnd: true }],
    rtools: [
      { k: "num", id: "hv", l: "Hunters: standard victory points", s: "a", after: v => v + " VP (none for raiders that disengaged)" },
      { k: "num", id: "hl", l: "Hunters: points of ships in low orbit of the pirate base", s: "a", after: v => "+" + v + " VP" },
      { k: "num", id: "rv", l: "Raiders: standard victory points", s: "b", after: v => v + " VP" },
      { k: "num", id: "rd", l: "Raiders: points of raider ships that disengaged, not crippled", s: "b", after: v => "+" + Math.round(v / 10) + " VP (10%)" }
    ],
    end: ["After ten turns.", "Or when one side’s fleet is destroyed or has disengaged."],
    win: ["Both sides score standard victory points for crippling and destroying (RB p. 122), but the hunters score nothing for raiders that disengage.", "Hunters: + the points value of their ships in low orbit of the pirate base planet at the end.", "Raiders: + 10% of the points value of raider ships that disengaged, unless crippled.", "Most victory points wins."],
    result(st) {
      const H = num(st, "hv") + num(st, "hl"), Rv = num(st, "rv") + Math.round(num(st, "rd") / 10);
      if (!H && !Rv) return [null, "Count victory points", "Enter both totals below."];
      return H === Rv ? ["draw", "Level", "Hunters " + H + " – Raiders " + Rv + " VP."] : [H > Rv ? "a" : "b", (H > Rv ? "Hunters" : "Raiders") + " win", "Hunters " + H + " – Raiders " + Rv + " VP."];
    },
    info: { bg: "Rogue Traders are sometimes hired just for their guns: sent into pirate-infested space to clear the lanes for honest trade. Some make a living of it; others bite off more than they can chew, and the hunters become the hunted.", cr: [RT_CREDIT, FL_CREDIT + ", p. 202–203.", "First published as “Scenario Eleven: Hunter, Prey”, a scenario left out of the 1999 rulebook for lack of space, with the White Dwarf battle report “The Raid on Vedyaria Outpost” by John Carter, Che Webster and Andy Chambers (reprinted in Warp Storm, Games Workshop 2000, p. 90–97). The same scenario appeared as “Raiders” under Matt Sprange’s name in Battlefleet Gothic Magazine 1."] }
  },
  /* ------------------------------------------------------------ RT 3 THE GAUNTLET */
  {
    id: "fl-rt-gauntlet", grp: "fleets", name: "The Gauntlet (Rogue Traders)", series: "Rogue Traders · Scenario Three", trust: "fleets",
    why: "Fleets book scenario: a lone cruiser runs a gauntlet of hidden escort squadrons. Also a good test bench for home-made ship designs.", src: "FL p. 214–215", book: "O", suggest: ["Rogue Traders"],
    others: "Any defender with one cruiser and a few escorts, against any escort-only attacker. The book suggests it for testing home-made ships: send one through against several fleet lists — if it wins easily its points are too low, if it dies in a turn or two they are too high.",
    sides: { a: { n: "Defender", f: "Rogue Traders" }, b: { n: "Attacker" } },
    pitch: "A Rogue Trader cruiser drops out of the warp straight into a hostile fleet. No time to jump back: the only way out is through.",
    glance: [["Points", "Defender: 1 cruiser + up to 3 escorts · Attacker: up to the same"], ["Table", "Not given — use your table"], ["Battlezone", "Deep space, no planets"], ["First turn", "Defender, moving on"], ["Game ends", "Every defender has escaped or died"]],
    bring: ["Contact markers, one per attacking unit", "Deep space phenomena (RB p. 107–108)"],
    forces: {
      a: ["One Rogue Trader cruiser and up to three escorts."],
      b: ["Up to the defender’s total points.", "Escort squadrons of at least two ships only.", "Split into at least two units."]
    },
    draw: (v, W, H) => [
      R(0, 0, W, 45, "b", "Attacker markers"), R(0, H - 45, W, 45, "b", "Attacker markers"),
      H > 90 ? R(0, 45, 8, H - 90, "a", "", { free: "x" }) : null,
      { z: "arrow", x1: 10, y1: H / 2, x2: 26, y2: H / 2, s: "a" },
      { z: "edge", e: "l", s: "a", l: "Defender enters (edge rolled)" },
      { z: "edge", e: "r", s: "a", dash: 1, l: "Escape edge" },
      { z: "dim", x1: W - 22, y1: 0, x2: W - 22, y2: 45, l: "45 cm" }
    ],
    fit: () => [60, 100],
    mapNote: "The defender rolls for its short edge after the markers are down; it then escapes off the opposite one. Its ships start against the edge, at least 45 cm from both long edges.",
    steps: [
      { s: "a", t: "Choose one Rogue Trader cruiser and up to three escorts." },
      { s: "b", t: "Choose escort squadrons of at least two ships, up to the defender’s total, and split them into at least two units." },
      { t: "Generate deep space phenomena (RB p. 107–108), ignoring any planet." },
      { s: "b", t: "Place a face-down contact marker for each unit, anywhere within 45 cm of a long edge." },
      { s: "a", t: "Roll for your short edge (tool below), then place your ships against it, at least 45 cm from both long edges." },
      { s: "a", t: "The defender goes first: every ship moves onto the table in turn 1." }
    ],
    stools: [{ k: "roll", id: "edge", l: "Defender’s entry edge (D2)", rows: () => [[1, 3, "Left short edge — escape off the right"], [4, 6, "Right short edge — escape off the left"]] }],
    notes: ["The text lets the markers go “within 45 cm of the table edges”; the book’s map shows the zones along the two long edges only. We follow the map.",
      "This scenario does not say how activated squadrons are placed. Suggestion: as in Convoy — one ship on the marker, the rest in formation no closer to the enemy (RB p. 134)."],
    refs: [["Contact markers", "RB p. 134"], ["Deep space generator", "RB p. 107–108"], ["Victory points", "RB p. 122"]],
    play: [
      { w: "Turn 1", s: "a", t: "Every ship moves onto the table." },
      ...markers("Defender", "attacker", "a", "b"),
      { w: "All game", s: "a", t: "Get off the opposite short edge. The cruiser escaping uncrippled is a major victory." }
    ],
    fx: T => T === 1 ? [["a", "All ships move onto the table"], ["b", "No voluntary activation yet"]] : [],
    rtools: [{ k: "ending", id: "how", l: "What happened to the cruiser?", rows: [["Escaped off the far edge, not crippled", "a"], ["Destroyed", "b"], ["Neither — count victory points", "draw", "Count VP"]] }],
    end: ["When every defending ship has escaped off the opposite short edge or been destroyed."],
    win: ["Standard victory points (RB p. 122).", "The defender wins a major victory (+1 renown) if the cruiser leaves the opposite short edge without being crippled.", "The attacker wins a major victory (+1 renown) if the cruiser is destroyed."],
    result(st) {
      const i = get(st, "how", -1);
      return i === 0 ? ["a", "Defender’s major victory (+1 renown)", "The cruiser ran the gauntlet."] : i === 1 ? ["b", "Attacker’s major victory (+1 renown)", "The cruiser was destroyed."] : i === 2 ? [null, "Count victory points", "Neither major victory — standard victory points decide."] : [null, "Battle in progress", "Mark what happened to the cruiser."];
    },
    info: { bg: "In wilderness space even the jump between two stars can be deadly. A Rogue Trader may drop out of the warp into the middle of a fight, or right in front of a hostile fleet, with no time to escape back into the warp.", cr: [RT_CREDIT, FL_CREDIT + ", p. 204–205."] }
  },
  /* ------------------------------------------------------------ RT 4 EXPLORER'S PRIZE */
  {
    id: "fl-explorers-prize", grp: "fleets", name: "Explorer’s Prize", series: "Rogue Traders · Scenario Four", trust: "fleets",
    why: "Fleets book scenario: find a derelict cruiser in an asteroid field, board it and fly it out.", src: "FL p. 216–217", book: "O", suggest: ["Rogue Traders"],
    others: "Any two fleets. The derelict can be a cruiser from any fleet except Necrons or Tyranids.",
    sides: { a: { n: "Fleet A", f: "Rogue Traders" }, b: { n: "Fleet B" } },
    pitch: "Somewhere in the asteroid belt drifts an almost intact cruiser — a fortune for whoever finds it, boards it and flies it out. You are not the only one looking.",
    glance: [["Points", "Equal, plus a derelict cruiser"], ["Table", "Not given — use your table"], ["Battlezone", "One asteroid field along a long edge"], ["First turn", "Roll-off"], ["Game ends", "The derelict escapes or is destroyed"]],
    bring: ["A derelict cruiser model (any fleet except Necrons or Tyranids)", "A long asteroid field, up to 30 cm deep", "Scatter dice and 3D6", "Critical damage markers"],
    forces: { a: ["Equal points from your fleet list."], b: ["Equal points from your fleet list."] },
    draw: (v, W, H) => [
      { z: "hatch", x: 0, y: 0, w: W, h: 30, l: "Asteroid field, up to 30 cm deep" },
      { z: "corner", c: "bl", r: 15, s: "a", l: "A" }, { z: "corner", c: "br", r: 15, s: "b", l: "B" },
      { z: "text", x: W / 2, y: H - 10, l: "fleets: within 15 cm of the far corners", s: "n" },
      { z: "edge", e: "b", s: "n", l: "Derelict escapes off this long edge" }
    ],
    fit: () => [70, 60],
    mapNote: "Fleets deploy within 15 cm of the two corners on the long edge across from the asteroid field. Roll the sunward edge at random.",
    steps: [
      { t: "Choose the derelict: a cruiser from any fleet except Necrons or Tyranids, agreed or rolled for. It belongs to nobody yet; keep it off the table." },
      { t: "Roll the sunward edge at random. Place one asteroid field, no more than 30 cm deep, along the whole length of one long edge. Other phenomena only if you agree — never a planet." },
      { t: "Roll off (attack ratings, RB p. 120, if you use them). The winner sets up first." },
      { t: "Each fleet deploys within 15 cm of one of the two corners on the long edge opposite the asteroid field." },
      { t: "Roll off again for the first turn." }
    ],
    notes: ["The book allows the derelict to be “rolled for randomly” but gives no table. Suggestion: number the cruisers you own and roll.",
      "A ship must have been in the asteroid field “for one full turn” before it can search: read as having started your previous turn there or entered during it, and still being there.",
      "The derelict starts with port, starboard, prow and dorsal criticals and “this must be repaired before any weapon systems can be used”. Read strictly, no weapon fires until all four are repaired; agree if you prefer each repair to free its own weapons."],
    refs: [["Asteroid fields", "RB p. 110"], ["Boarding actions", "RB p. 89–90"], ["Critical damage and repairs", "RB p. 66–67, 88"], ["Victory points", "RB p. 122"]],
    play: [
      { w: "Start of each player’s turn", t: "Your ships touching the asteroid field take Leadership tests as normal for asteroids." },
      { w: "Searching", t: "Until the derelict is found: roll a D6 for each of your ships that has been in the field for one full turn, and one more D6 for every three attack craft markers (or part of three) that have been in it a full turn. The first 6 finds the derelict." },
      { w: "Found", t: "Choose which of your searching ships found it. Roll the scatter dice and 3D6 (ignore “hit”): place the derelict that far from the finder in that direction, facing any way. It always stays inside the asteroid field and on the table." },
      { w: "Boarding it", t: "The first capital ship, or escort squadron of at least four, to touch the derelict boards it for free. Teleporters and assault boats cannot make this first boarding." },
      { w: "Crewed", t: "The derelict’s Leadership is the highest of the boarders’ minus 1; the boarding ship or squadron loses 1 Leadership. Later enemy boarding actions follow the normal rules with −1 for the derelict, but the boarding crew’s race modifiers (Chaos, Space Marines…) apply." },
      { w: "Waking it", t: "It starts on standby and needs a Leadership test to activate. Shields and turrets work; it moves normally once active, but starts with a port, starboard, prow and dorsal critical — repair them before any weapon fires. It never launches attack craft." },
      { w: "Escape", t: "It cannot disengage: it must leave by the long edge opposite the asteroid field." }
    ],
    fx: (T, st) => get(st, "found", false) ? [[null, "Asteroid Leadership tests at the start of each turn"]] : [[null, "Asteroid Leadership tests, then search dice"]],
    tools: [
      { k: "counter", id: "sh", l: "Searching ships (in the field a full turn)" },
      { k: "counter", id: "ac", l: "Attack craft markers in the field a full turn" },
      { k: "shiproll", id: "srch", l: "Search dice", cl: "Dice", n0: st => Math.max(1, get(st, "sh", 0) + Math.ceil(get(st, "ac", 0) / 3)), il: i => "Die " + (i + 1), out: d => d === 6 ? "found it!" : "nothing", sub: "One per searching ship, plus one per three attack craft (or part). The count follows the counters above until you change it here.", none: "Roll the search dice here, or roll your own." },
      { k: "toggle", id: "found", l: "The derelict has been found" },
      { k: "val", id: "dist", l: "Derelict distance from the finder: 3D6 cm", opts: [], roll: () => d6() + d6() + d6(), unit: " cm" },
      { k: "pick", id: "who", l: "Who boarded it first?", rows: [["Fleet A", "free boarding"], ["Fleet B", "free boarding"]] },
      { k: "toggle", id: "awake", l: "The derelict has passed its Leadership test (active)" },
      { k: "counter", id: "crit", l: "Derelict criticals still to repair", start: 4, max: 4, warn: v => v ? "No weapons until all four are repaired (see note). Never attack craft." : "Weapons may fire. Still no attack craft." }
    ],
    rtools: [{ k: "ending", id: "how", l: "How did it end?", rows: [["Fleet A flew the derelict off the far edge", "a"], ["Fleet B flew the derelict off the far edge", "b"], ["The derelict was destroyed", "draw", "Count VP"]] }],
    end: ["When the derelict leaves by the long edge opposite the asteroid field, or is destroyed."],
    win: ["Standard victory points (RB p. 122).", "Whoever flies the derelict off the far edge wins a major victory (+2 renown), even if it is crippled, and also scores its starting points value in victory points.", "If the derelict is destroyed nobody scores it — though as a capital ship hulk it still counts for whoever holds the field."],
    result(st) {
      const i = get(st, "how", -1);
      return i === 0 ? ["a", "Fleet A: major victory (+2 renown)", "The prize is theirs — add its points value to their victory points."] : i === 1 ? ["b", "Fleet B: major victory (+2 renown)", "The prize is theirs — add its points value to their victory points."] :
        i === 2 ? [null, "Count victory points", "The derelict was destroyed; standard victory points decide."] : [null, "Battle in progress", "Mark how it ended."];
    },
    info: { bg: "Now and then a Rogue Trader learns where an almost intact hulk drifts — through bought information, old contacts or sheer luck. The Adeptus Mechanicus pays well for such prizes, especially alien or archeotech ones, but finding one is only the start: others want it too.", cr: [RT_CREDIT, FL_CREDIT + ", p. 206–207.", "Developed from “Desperate Search”, scenario 2 of Nate Montes’s Battle for Antioc in Battlefleet Gothic Magazine 8 (Fanatic Press), where the prize was an experimental ship rebuilt from a captured Fra’al battlecruiser."] }
  },
  /* ------------------------------------------------------------ RT 5 SPACE HULK! */
  {
    id: "fl-space-hulk", grp: "fleets", name: "Space Hulk!", series: "Rogue Traders · Scenario Five", trust: "fleets",
    why: "Fleets book scenario: escort a half-secured space hulk while its boarding teams fight what lives inside.", src: "FL p. 218–219", book: "O", suggest: ["Rogue Traders"],
    others: "Written for a Rogue Trader with allies; any fleet can escort the hulk. The attackers are rolled from their own fleet list.",
    sides: { a: { n: "Hulk escort", f: "Rogue Traders + allies" }, b: { n: "Attackers" } },
    pitch: "A Rogue Trader has claimed a space hulk and is towing riches beyond imagining home. The boarding teams are still clearing it — and every few turns they wake something up.",
    glance: [["Points", "Escort up to 1200 pts + the hulk · attackers random"], ["Table", "Not given — use your table"], ["Battlezone", "Any, agreed"], ["First turn", "Hulk escort"], ["Game ends", "The hulk escapes or is destroyed"]],
    bring: ["A space hulk model (40 hits)", "Contact markers, one per attacking unit", "Torpedo and attack craft markers", "Damage markers for the hulk"],
    forces: {
      a: ["A space hulk: Ld 6, starts with 2D6 of its 40 hits already gone, shields and turrets working, every weapon off-line.", "Its escort: a Rogue Trader cruiser, an allied battleship, at least three allied cruisers and any escorts — no more than 1200 pts in all, not counting the hulk.", "Every escorting capital ship is at −1 Leadership (crew and gear aboard the hulk)."],
      b: ["Rolled at random: D3+5 rolls on this scenario’s table (tool below). The Fleets book threat tables may not be used here.", "Escort squadrons and capital ships come from your fleet list."]
    },
    draw: (v, W, H) => [
      R(0, 0, W, 45, "b", "Attackers (see note)"), R(0, H - 45, W, 45, "b", "Attackers (see note)"),
      { z: "mark", x: 22, y: H / 2, s: "a", l: "space hulk", free: 1 },
      { z: "arrow", x1: 34, y1: H / 2, x2: 52, y2: H / 2, s: "a" },
      { z: "edge", e: "r", s: "a", l: "Space hulk’s escape edge" },
      { z: "dim", x1: W - 22, y1: 0, x2: W - 22, y2: 45, l: "45 cm" }
    ],
    fit: () => [80, 100],
    mapNote: "Drawn as the book’s map: the hulk starts near one short edge and must leave by the opposite one. Leaving by a long edge destroys it.",
    steps: [
      { s: "b", t: "Roll your forces: D3+5 rolls on the table below." },
      { s: "a", t: "Choose the escort: a Rogue Trader cruiser, an allied battleship, three or more allied cruisers and any escorts, up to 1200 pts. Escorting capital ships are at −1 Leadership." },
      { s: "a", t: "Roll 2D6 for the hulk’s starting damage (tool below)." },
      { t: "Set up celestial phenomena in any agreed way." },
      { s: "b", t: "Set up as in Convoy: a face-down contact marker for each capital ship, squadron and cluster, at least 30 cm apart and 30 cm from every edge (see note on the map)." },
      { s: "a", t: "Place the space hulk near your short edge. Escorts may start on the table with it, or enter at the start of turn 2 in any mix and order." },
      { s: "a", t: "The hulk’s escort takes the first turn." }
    ],
    stools: [
      { k: "val", id: "nr", l: "Number of rolls: D3 + 5", opts: [6, 7, 8], roll: () => 5 + dn(3) },
      { k: "shiproll", id: "frc", l: "Roll the attacking forces", cl: "Rolls", n0: st => get(st, "nr", 0) || 7, il: i => "Roll " + (i + 1), out: d => rowText(SH_TABLE, d) },
      { k: "html", html: "<h3>Attackers’ table (FL p. 218)</h3><table class='ltab'>" + SH_TABLE.map(r => "<tr><td>" + r[0] + "</td><td>" + fmt(r[2]) + "</td></tr>").join("") + "</table>" },
      { k: "val", id: "start", l: "Hulk’s starting damage: 2D6", opts: [], roll: () => d6() + d6(), unit: " hits" }
    ],
    notes: [XREF + " Convoy set-up and first turn (old rulebook p. 74–75): RB p. 134–135.",
      "The text sets the attackers up as in Convoy (markers at least 30 cm from every edge), but the book’s map shades 45 cm zones along both long edges as their deployment zones. Agree which to use; one way to honour both is to keep the markers inside the shaded zones but 30 cm from the edges.",
      "The scenario gives no profile or points value for the hulk beyond 40 hits, Ld 6 and working shields and turrets. The Chaos Space Hulk (650 pts, FL p. 288) and the Ork Hulk (600 pts, FL p. 391) both have 40 hits, 10 cm speed, 3 shields, 4+ armour and 6 turrets; agree which one moves and counts for victory points.",
      "“Three weapons batteries (all four quadrants)” is read as +3 weapons battery firepower in each of the prow, port, starboard and aft arcs; “two torpedo launchers (all three quadrants)” as +2 torpedo strength in the prow, port and starboard arcs. Only the dorsal lance has a stated maximum (4).",
      "Read literally, a hulk the escort has to destroy after the third Genestealer result still gives the attackers a major victory (“destroyed for any reason”), while the escort gains +1 renown for what it recovered."],
    refs: [["Convoy set-up and contact markers", "RB p. 134–135"], ["Chaos Space Hulk profile", "FL p. 288–289"], ["Ork Hulk profile", "FL p. 389–390"], ["Victory points", "RB p. 122"]],
    play: [
      { w: "Start of your turn, from turn 2", s: "a", t: "Roll 2D6 on the boarding table (tool below). The result takes effect at once." },
      { w: "Turn 2", s: "a", t: "Escorts held back enter at the start of the turn." },
      ...markers("Escort", "attackers", "a", "b"),
      { w: "Deadfall torpedoes, attack craft, ships", s: "b", t: "Activated markers deploy as in Convoy: torpedoes D6+2 strength, attack craft D3+1 squadrons, escorts on the marker in formation, a capital ship on the marker facing any way." },
      { w: "All game", s: "a", t: "The hulk must leave by the opposite short edge. If it leaves by a long edge for any reason it counts as destroyed." }
    ],
    fx: (T, st) => {
      const o = T === 1 ? [["a", "Escorts held back enter at the start of turn 2"]] : T === 2 ? [["a", "Held-back escorts enter now"], ["a", "2D6 boarding roll at the start of your turn"]] : [["a", "2D6 boarding roll at the start of your turn"]];
      if (get(st, "gs", 0) >= 3) o.push(["a", "Third Genestealer result: the hulk must be destroyed"]);
      return o;
    },
    tools: [
      { k: "roll", id: "hev", l: "Boarding teams", d2: true, sub: "2D6 at the start of each escort turn from turn 2", rows: () => [[2, 2, "Chaos! Renegades fight the boarding teams: the hulk takes D3 damage"], [3, 3, "No effect"], [4, 4, "One dorsal lance strength comes on-line (up to 4; after that, reroll)"], [5, 5, "Weapons batteries: +3 firepower in all four quadrants"], [6, 6, "Torpedoes: +2 strength in all three quadrants"], [7, 7, "Orks! A firefight aboard: the hulk takes D3 damage"], [8, 8, "Torpedoes: +2 strength in all three quadrants"], [9, 9, "Weapons batteries: +3 firepower in all four quadrants"], [10, 10, "One dorsal lance strength comes on-line (up to 4; after that, reroll)"], [11, 11, "No effect"], [12, 12, "Tyranids! Genestealers: that section is purged, the hulk takes D6 damage. Count it — the third time, the hulk must be destroyed"]] },
      { k: "counter", id: "lance", l: "Dorsal lance strength on-line", s: "a", max: 4 },
      { k: "counter", id: "bat", l: "Weapons battery results", s: "a", warn: v => v ? "Batteries: firepower " + 3 * v + " in each of the four quadrants." : "" },
      { k: "counter", id: "trp", l: "Torpedo results", s: "a", warn: v => v ? "Torpedoes: strength " + 2 * v + " in each of the three quadrants." : "" },
      { k: "counter", id: "gs", l: "Genestealer results", s: "a", max: 3, warn: v => v >= 3 ? "Three times: the hulk is too dangerous to recover and must be destroyed." : v ? (3 - v) + " more and the hulk must be destroyed." : "" },
      { k: "counter", id: "dmg", l: "Further damage to the hulk", s: "a" },
      { k: "info", html: st => { const s0 = get(st, "start", 0), left = 40 - s0 - get(st, "dmg", 0);
        return "<h3>Space hulk</h3><p class='calc'>" + (s0 ? "<b>" + Math.max(0, left) + "</b> of 40 hits left" + (left <= 0 ? " — destroyed." : left <= 20 ? " — crippled." : ".") : "Roll the starting 2D6 damage in Set-up first.") + "</p>"; } }
    ],
    rtools: [{ k: "ending", id: "how", l: "How did it end?", rows: [["The hulk escaped, not crippled", "a"], ["The hulk escaped, crippled", "a"], ["The escort had to destroy it (third Genestealer result)", "b"], ["The attackers destroyed it", "b"]] }],
    end: ["When the space hulk leaves by the opposite short edge, or is destroyed."],
    win: ["Standard victory points (RB p. 122).", "Hulk off the opposite edge: the escort’s major victory (+1 renown) however damaged, plus victory points equal to the hulk’s starting value (half if crippled).", "Hulk too dangerous (third Genestealer result): the escort must destroy it; it gains +1 renown for recovered technology, and victory points only if the hulk is destroyed.", "Hulk destroyed for any reason: the attackers’ major victory (+1 renown)."],
    result(st) {
      const i = get(st, "how", -1);
      return i === 0 ? ["a", "Escort’s major victory (+1 renown)", "Add the hulk’s full starting value to the escort’s victory points."] : i === 1 ? ["a", "Escort’s major victory (+1 renown)", "Add half the hulk’s starting value to the escort’s victory points."] :
        i === 2 ? ["b", "Attackers’ major victory (+1 renown)", "The hulk was destroyed; the escort still gains +1 renown for recovered technology (see note)."] : i === 3 ? ["b", "Attackers’ major victory (+1 renown)", "The hulk was destroyed."] : [null, "Battle in progress", "Mark how it ended."];
    },
    info: { bg: "Every Rogue Trader dreams of a space hulk: a drifting tangle of wrecks full of archeotech and riches. Most are infested with Orks or worse, and only a fool would try to bring one home without help — a lot of help.", cr: [RT_CREDIT, FL_CREDIT + ", p. 208–209."] }
  },
  /* ------------------------------------------------------------ RT 6 THE VOID MALEVOLENT */
  {
    id: "fl-void-malevolent", grp: "fleets", name: "The Void Malevolent", series: "Rogue Traders · Scenario Six", trust: "fleets", players: 3,
    why: "Fleets book scenario for three players: two rivals fighting it out when an ancient horror joins in.", src: "FL p. 220–221", book: "O", suggest: ["Foe: Dark Eldar · Necrons · Tyranids"],
    others: "Any two rival fleets of equal points. The third fleet, 1.5 times their size, is ideally Dark Eldar, Necrons or Tyranids — but any fleet can play it, as long as it fights both others.",
    sides: { a: { n: "Player 1" }, b: { n: "Player 2" }, c: { n: "Foe Malevolent", f: "Dark Eldar, Necrons or Tyranids" } },
    pitch: "Two rival fleets are busy with each other when something old and hungry, hidden in the glare of a sun or the clutter of an asteroid field, decides they are both prey.",
    glance: [["Points", "Two equal fleets · Foe: 1.5 times one of them"], ["Table", "Not given — use your table"], ["Battlezone", "Any, agreed"], ["First turn", "Roll-off between Players 1 and 2"], ["Game ends", "After 8 turns, or one fleet is left"]],
    bring: ["Three fleets", "Something to mark whose ordnance has moved"],
    forces: {
      a: ["The agreed points from your fleet list."],
      b: ["The agreed points from your fleet list."],
      c: ["1.5 times the agreed points.", "Arrives after D3 turns along a random short edge."]
    },
    draw: (v, W, H) => {
      const zw = Math.min(90, W - 30), x0 = (W - zw) / 2, d = Math.max(5, (H - 60) / 2);
      return [R(x0, 0, zw, d, "a", "Player 1"), R(x0, H - d, zw, d, "b", "Player 2"),
        { z: "dim", x1: x0, y1: H / 2 + 2, x2: x0 + zw, y2: H / 2 + 2, l: "90 cm" },
        { z: "dim", x1: Math.min(W - 18, x0 + zw + 10), y1: d, x2: Math.min(W - 18, x0 + zw + 10), y2: H - d, l: "60 cm" },
        { z: "edge", e: "l", s: "c", dash: 1, l: "Foe: random short edge" }, { z: "edge", e: "r", s: "c", dash: 1, l: "Foe: random short edge" }];
    },
    fit: () => [120, 80],
    mapNote: "Players 1 and 2 set up as in Cruiser Clash: zones 90 cm wide, 60 cm apart, against the long edges. The foe appears along a random short edge.",
    steps: [
      { t: "Agree the points for Players 1 and 2; the foe gets one and a half times that." },
      { t: "Set up celestial phenomena in any agreed way — the foe may have hidden by a sun, in low orbit or among asteroids." },
      { t: "Players 1 and 2 deploy as in Cruiser Clash: take turns placing a ship or squadron in your own zone, facing the opposite long edge." },
      { s: "c", t: "Stay off the table. Roll a D3 now for how many turns pass before you arrive (tool below)." },
      { t: "Players 1 and 2 roll off for the first turn (or agree it)." }
    ],
    stools: [{ k: "val", id: "arr", l: "The foe stays away for D3 turns", opts: [1, 2, 3], roll: () => dn(3), unit: " turns" }],
    notes: [XREF + " Cruiser Clash set-up (old rulebook p. 68): RB p. 128.",
      "The book does not say whether “1st” and “2nd” player follow the first-turn roll; the map simply labels the two zones. Here Player 1 and Player 2 are the zones as drawn.",
      "The ordnance table seems to contain slips: in the 2nd player’s turn it keeps the 2nd player’s own ordnance in place, and in the 1st player’s turn the 1st player moves ordnance “a second time”. One consistent reading is that each fleet’s ordnance moves twice a round — in its own turn and once in another player’s — but agree before play."],
    refs: [["Cruiser Clash set-up", "RB p. 128"], ["Victory points", "RB p. 122"]],
    play: [
      { w: "Before the foe arrives", t: "Players 1 and 2 play normal turns." },
      { w: "Arrival", s: "c", t: "After D3 turns, play stops. Set up any part of your fleet along a randomly rolled short edge (tool below). From now on you go first every turn. Ships you held back must enter along the same edge at the start of your next turn." },
      { w: "Foe’s shooting", s: "c", t: "Your ships may only shoot at the closest enemy ships. Ordnance may target anything it is normally allowed to; every other rule of your fleet works as normal." },
      { w: "Turn order from the arrival", t: "Foe → Player 2 → Player 1, every turn." },
      { w: "Ordnance, as printed", t: "Foe’s turn: after the foe moves, shoots and launches, Player 2 moves its ordnance a second time; Player 1’s stays put. Player 2’s turn: the foe moves its ordnance a second time; “Player 2’s” stays put. Player 1’s turn: “Player 1” moves its ordnance a second time; the foe’s stays put. (See note.)" },
      { w: "Victory points", t: "Escorts score one by one, not by squadron. A capital ship gives its full value only to a player who took it from undamaged to destroyed alone; if anyone else caused even one hit, split its value equally between the two." },
      { w: "Turn 8", t: "Last turn." }
    ],
    turnMax: () => 8,
    fx: (T, st) => {
      const a = get(st, "arr", 0), o = [];
      if (!a) { if (T === 1) o.push(["c", "Roll D3 for the foe’s arrival (Set-up tools)"]); }
      else if (T <= a) o.push([null, "Players 1 and 2 only"]);
      else if (T === a + 1) { o.push(["c", "Play stops: the foe sets up on a random short edge and goes first"]); o.push([null, "Order: Foe → Player 2 → Player 1"]); }
      else { if (T === a + 2) o.push(["c", "Held-back foe ships enter now"]); o.push([null, "Order: Foe → Player 2 → Player 1"]); }
      if (T === 8) o.push([null, "Last turn"]);
      return o;
    },
    tools: [{ k: "roll", id: "fedge", l: "Foe’s short edge", rows: () => [[1, 3, "Left short edge"], [4, 6, "Right short edge"]] }],
    rtools: [
      { k: "num", id: "e1", l: "Player 1: victory points earned", s: "a", after: v => v + " VP" }, { k: "num", id: "l1", l: "Player 1: victory points lost (given away)", s: "a", after: v => v + " VP" },
      { k: "num", id: "e2", l: "Player 2: victory points earned", s: "b", after: v => v + " VP" }, { k: "num", id: "l2", l: "Player 2: victory points lost (given away)", s: "b", after: v => v + " VP" }
    ],
    end: ["After eight turns.", "Or when all but one fleet has disengaged or been destroyed."],
    win: ["Players 1 and 2: the one with the most victory points wins, provided it earned more than it lost.", "The foe wins only if both other players lost more victory points than they earned.", "Escorts count one by one; a capital ship’s value is split if two players damaged it."],
    result(st) {
      const e1 = num(st, "e1"), l1 = num(st, "l1"), e2 = num(st, "e2"), l2 = num(st, "l2");
      if (!e1 && !l1 && !e2 && !l2) return [null, "Count victory points", "Enter what Players 1 and 2 earned and lost."];
      const ok1 = e1 > l1, ok2 = e2 > l2;
      if (l1 > e1 && l2 > e2) return ["c", "Foe Malevolent wins", "Both rivals lost more than they earned."];
      if (ok1 && (!ok2 || e1 > e2)) return ["a", "Player 1 wins", "Player 1 " + e1 + "/" + l1 + " · Player 2 " + e2 + "/" + l2 + " (earned/lost)."];
      if (ok2 && (!ok1 || e2 > e1)) return ["b", "Player 2 wins", "Player 1 " + e1 + "/" + l1 + " · Player 2 " + e2 + "/" + l2 + " (earned/lost)."];
      return ["draw", "No clear winner", "Neither rival earned more than it lost and the foe’s condition is not met — or the rivals are level."];
    },
    info: { bg: "A Warrant of Trade is rarely given for wealth alone: more often it comes with a task — escort a convoy through pirate space, cleanse a system of some alien pest. But older evils stalk the void, and to them both rivals are only prey.", cr: [RT_CREDIT, FL_CREDIT + ", p. 210–211."] }
  },
  /* ------------------------------------------------------------ CRAFTWORLD ASSAULT */
  {
    id: "fl-craftworld-assault", grp: "fleets", name: "Craftworld Assault", series: "Eldar · scenario", trust: "fleets",
    why: "Fleets book scenario: Planetary Assault against a craftworld with its own fortresses, forges and webway gates.", src: "FL p. 336–339", book: "O", suggest: ["Craftworld Eldar", "Tyranids"],
    others: "Written for Iyanden against Hive Fleet Kraken. Any attacker can replay it (non-Tyranids take two free transports per 500 pts); the defender should be Eldar, since the reserves and Shadowhunters come from the Eldar lists.",
    sides: { a: { n: "Craftworld", f: "Craftworld Eldar" }, b: { n: "Attacker", f: "Tyranids" } },
    pitch: "A hive fleet has found Iyanden. Land enough swarms on the craftworld and it falls; the Eldar have fortresses, a world-sized forge and a webway gate full of reserves.",
    glance: [["Points", "Equal · Eldar reserves at half cost"], ["Table", "Not given — use your table"], ["Battlezone", "D3: primary biosphere, outer reaches or deep space"], ["First turn", "D6 + attack rating, winner chooses"], ["Game ends", "A fleet is gone, or 10 assault points"]],
    bring: ["A craftworld template (Iyanden about 25 cm across)", "Low orbit table (RB p. 116)", "Transports for a non-Tyranid attacker", "Nova Cannon template (Spear of Light)"],
    forces: {
      a: ["Equal points. No planetary defences: the craftworld’s own defences replace them.", "Reserves: any Eldar ships, the flagship included, may be bought at half cost as reserves. They start off the table, may not use re-rolls until in play, and arrive through the webway gates (Play)."],
      b: ["Equal points.", "Tyranids get no extra transports — all their ships count as transports (FL p. 428).", "Any other attacker takes two free transports for every 500 pts (or part) of its fleet."]
    },
    draw: (v, W, H, st) => {
      const sz = st ? get(st, "cws", 0) : 0, well = sz === 1 ? 10 : sz === 6 ? 20 : sz ? 15 : 20, body = sz === 1 ? 7.5 : sz === 6 ? 15 : sz ? 10 : 12.5, cx = Math.max(well + 5, W - 150), cy = H / 2;
      return [
        R(30, 30, W - 60, H - 60, "a", "", { dash: 1 }),
        { z: "text", x: W / 2 + 10, y: 38, l: "Eldar patrols: 30 cm+ from edges", s: "a" },
        /* the size is rolled: before the roll no gravity well ring (owner 21.10.: no defaults) */
        sz ? { z: "ring", cx, cy, r: well, s: "a", free: 1 } : null, { z: "planet", cx, cy, r: body, l: "", free: 1 },
        { z: "text", x: cx, y: cy + well + 7, l: sz ? "craftworld, gravity well " + well + " cm" : "craftworld: roll its size below", s: "a" },
        R(W - 15, 0, 15, H, "b", "Attacker: 15 cm", { rot: 90 }),
        { z: "dim", x1: cx, y1: H - 14, x2: W, y2: H - 14, l: "up to 150 cm" }
      ];
    },
    fit: () => [120, 80],
    mapNote: "The craftworld goes no more than 150 cm from one short edge, like the planet in Planetary Assault; the attacker deploys at the other. The gravity well follows the craftworld size rolled in the set-up tools (Iyanden if not rolled).",
    steps: [
      { t: "Roll the battlezone (tool below) and the sunward edge; set up phenomena as normal or as agreed, ignoring any planet." },
      { t: "Choose Iyanden (about 25 cm, gravity well 20 cm) or roll the craftworld’s size (tool below). Place it no more than 150 cm from one short edge. It has no moons or rings, and never moves." },
      { t: "Set up the low orbit table (RB p. 116)." },
      { s: "a", t: "Put each ship or squadron on patrol, on standby in high orbit, or in the craftworld’s gravity (on the low orbit table). Reserves stay off the table." },
      { s: "a", t: "For each patrol except Shadowhunters roll a D6 (tool below): 1–3 the attacker places it, 4–6 you do. Patrols go at least 30 cm from every edge and outside phenomena; you always choose the facing. Shadowhunters are always on patrol and you place them." },
      { s: "b", t: "Deploy within 15 cm of the short edge furthest from the craftworld." },
      { t: "Both roll a D6 and add their fleet’s attack rating. The higher total chooses who goes first." }
    ],
    stools: [
      { k: "roll", id: "bz", l: "Battlezone (D3)", rows: () => [[1, 2, "Primary biosphere"], [3, 4, "Outer reaches"], [5, 6, "Deep space"]] },
      { k: "roll", id: "cws", l: "Craftworld size (or play Iyanden: about 25 cm, well 20 cm)", rows: () => [[1, 1, "Small: up to 15 cm across, gravity well 10 cm"], [2, 5, "Medium: up to 20 cm across, gravity well 15 cm"], [6, 6, "Large: up to 30 cm across, gravity well 20 cm"]] },
      { k: "roll", id: "pat", l: "Who places this patrol?", sub: "D6 per patrolling ship or squadron (not Shadowhunters)", rows: () => [[1, 3, "The attacker places it (you choose the facing)"], [4, 6, "You place it"]] }
    ],
    notes: [XREF + " Planet placement (old rulebook p. 76): RB p. 136. Tyranid scenario notes (Armada): FL p. 428.",
      "Each assault point is stopped on a 4+ by “one of the fortresses”, but the two fortresses are damaged separately. Suggestion: roll once per assault point and use the better number of the two surviving fortresses.",
      "The fortresses’ and the Spear of Light’s End phase rolls are written as separate checks; roll them separately (tools below)."],
    refs: [["Planetary Assault (placement, low orbit, assault points)", "RB p. 136–137"], ["Low orbit table", "RB p. 116"], ["Nova Cannon", "RB p. 63"], ["Tyranid scenario notes", "FL p. 428"], ["Eldar fleet lists, Shadowhunters", "FL p. 314–317"]],
    play: [
      { w: "Landing troops", s: "b", t: "On the low orbit table, each turn a capital ship spends within 30 cm of the craftworld’s edge scores 1 assault point; a transport scores 2. A ship landing troops or bombarding does nothing else that turn. Tyranids follow their scenario notes (FL p. 428)." },
      { w: "Each assault point", s: "a", t: "Roll a D6: on 4+ the fortresses break up the landing and it does not count. A damaged fortress needs 5+, then 6+." },
      { w: "Eldar shooting phase", s: "a", t: "The Fortress of Tears and the Fortress of the Red Moon each fire one 45 cm pulsar lance at every enemy escort squadron and capital ship on the low orbit table — no more than two shots per target, rolling to hit as pulsar lances do. Damage makes them hit on 5+, then 6+; a destroyed fortress stops firing." },
      { w: "End phase", s: "a", t: "Roll a D6 for each assault point scored so far: any 6 damages one fortress by one step (4+ → 5+ → 6+ → destroyed). Only one step per End phase." },
      { w: "Spear of Light", s: "a", t: "Works as a single Nova Cannon, at targets on the main table only. End phase: a D6 per assault point scored; a 6 damages it (it then needs Reload Ordnance before every shot), a second 6 in a later End phase destroys it." },
      { w: "The forges", s: "a", t: "An Eldar capital ship on the low orbit table may dock by landing on the craftworld — no Leadership test, not destroyed — and stays a full turn. In the End phase it rolls +4D6 to repair criticals and regains 1 hit for every 6 not needed for criticals (once all are repaired), and counts as passing Reload Ordnance. While docked it cannot move, shoot or launch; it counts as defences on the gunnery table with one extra column shift right, ignores blast markers, and its holofields still work against gunnery." },
      { w: "From turn 2, after the Eldar move", s: "a", t: "Webway gates: roll a D6. On 5+, D3 reserve capital ships or escort squadrons of your choice appear along the table edge nearest the craftworld, no more than 30 cm from it. They cannot move or shoot that turn." }
    ],
    fx: T => (T >= 2 ? [["a", "After moving: webway gates, D6 5+ brings D3 reserve ships or squadrons"]] : []).concat([["a", "End phase: fortress and Spear of Light damage rolls"]]),
    tools: [
      { k: "counter", id: "ap", l: "Assault points", s: "b", goal: 10, res: 1 },
      { k: "counter", id: "ft", l: "Fortress of Tears damage", s: "a", max: 3, warn: v => ["Stops landings and hits on 4+", "Damaged: 5+", "Badly damaged: 6+", "Destroyed — no more fire"][v] },
      { k: "counter", id: "fr", l: "Fortress of the Red Moon damage", s: "a", max: 3, warn: v => ["Stops landings and hits on 4+", "Damaged: 5+", "Badly damaged: 6+", "Destroyed — no more fire"][v] },
      { k: "counter", id: "sp", l: "Spear of Light damage", s: "a", max: 2, warn: v => ["Fires as a Nova Cannon", "Damaged: Reload Ordnance before every shot", "Destroyed"][v] },
      { k: "info", html: st => { const f = [get(st, "ft", 0), get(st, "fr", 0)], up = f.filter(x => x < 3), best = up.length ? 4 + Math.min(...up) : 0;
        return "<h3>Craftworld defences now</h3><p class='calc'>" + (best ? "Each assault point is stopped on <b>" + best + "+</b> (best surviving fortress). Pulsar lance shots per low-orbit target: <b>" + up.length + "</b>." : "Both fortresses destroyed: landings cannot be stopped and nothing fires into low orbit.") + "</p>"; } },
      { k: "shiproll", id: "eph", l: "End phase: fortress damage", cl: "Dice (one per assault point)", n0: st => Math.max(1, get(st, "ap", 0)), il: i => "Die " + (i + 1), out: d => d === 6 ? "6 — one fortress loses a step" : "—", sub: "A D6 per assault point scored so far. Any 6: one fortress, one step, once per End phase.", none: "Roll here once assault points have been scored." },
      { k: "shiproll", id: "eps", l: "End phase: Spear of Light", cl: "Dice (one per assault point)", n0: st => Math.max(1, get(st, "ap", 0)), il: i => "Die " + (i + 1), out: d => d === 6 ? "6 — the Spear of Light is hit" : "—", sub: "A D6 per assault point scored so far. A 6 damages it; a 6 in a later End phase destroys it.", none: "Roll here once assault points have been scored." }
    ],
    rtools: [
      { k: "num", id: "avp", l: "Attacker’s victory points", s: "b", after: v => "+" + Math.floor(v / 500) + " assault points" },
      { k: "num", id: "dvp", l: "Defender’s victory points", s: "a", after: v => "−" + Math.ceil(v / 500) + " assault points" }
    ],
    end: ["One fleet is destroyed or disengages.", "Or the attacker has 10 or more assault points."],
    win: ["Take the assault points, +1 for every full 500 VP the attacker scored, −1 for every 500 VP (rounding up) the defender scored.", "0–1: defender’s victory (+1 renown). 2–5: defender’s marginal win. 6–9: attacker’s marginal win. 10+: attacker’s victory (+1 renown)."],
    provisional: PA_PROV,
    result(st) {
      const t = get(st, "ap", 0) + Math.floor(num(st, "avp") / 500) - Math.ceil(num(st, "dvp") / 500);
      const r = t >= 10 ? ["b", "Attacker’s victory (+1 renown)", "The craftworld is overrun."] : t >= 6 ? ["b", "Attacker’s marginal win", "Enough landed to take much of the craftworld."] : t >= 2 ? ["a", "Defender’s marginal win", "No real foothold, but invaders must be hunted down."] : ["a", "Defender’s victory (+1 renown)", "Hardly anyone got through."];
      return [r[0], r[1], "Adjusted total: " + t + " assault points. " + r[2]];
    },
    info: { bg: "Craftworlds are rarely attacked directly — huge as they are, they are hard to find. But when Hive Fleet Kraken poured into the galaxy, Iyanden could not avoid its path, and faced the greatest danger in its history.", cr: [FL_CREDIT + ", p. 312–315.", "First published as “Doom of the Eldar” by Matt Keefe in Fanatic Magazine issue 3 (Games Workshop)."] }
  }
  ]);
})();
