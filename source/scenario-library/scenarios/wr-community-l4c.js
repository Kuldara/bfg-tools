/* Warp Rift community scenarios without play reports (class L4), part C:
   Battle for the Stygies System (WR27, campaign tree), Looting the Hulk and Pirate Bases (WR28),
   Battles in the Warp (WR30), Fleet Engagement Variant (WR32) and the Solitaire Campaign (WR37).
   Summarised in our own words; each scenario hand-made (see LUEMINUT.md). */
(function () {
  const NO_REPORT = "Community scenario; the source gives no play report.";
  const SANG = "Solar Admiral Nathan Gull (S.A.N.G.)";
  const HULK_BG = "Drifting wrecks still hold valuable technology, and Imperial, Chaos and Ork salvagers all want it — Tyranids might want the genes, Tau the secrets. The scenarios close the author’s modelling article on building wrecked hulks from polystyrene.";

  /* Stygies-kampanjapuu (WR27 s. 30): vasen haara = hyökkääjä (Chaos) voittaa, oikea = puolustaja (Imperial) voittaa */
  const STYGIES = {
    sa: { n: "Surprise Attack — Mersk", sc: "surprise-attack", txt: "Chaos attacks, the Imperials defend. Neutral: Orks, 500 pts.", kids: [["Chaos won", "cv"], ["The Imperials won", "bait"]] },
    cv: { n: "Convoy — The Bricabrac", sc: "convoy", txt: "Chaos attacks, the Imperials defend. Neutral: Orks, 800 pts.", kids: [["Chaos won", "br"], ["The Imperials won", "ex"]] },
    bait: { n: "The Bait — the Anomaly", sc: "the-bait", txt: "Chaos attacks, the Imperials defend. Neutral: a Necron Tomb Ship.", kids: [["Chaos won", "ex"], ["The Imperials won", "pa"]] },
    br: { n: "Blockade Run — Curtain Cloud Nebula", sc: "blockade-run", txt: "Chaos attacks, the Imperials defend (and run). Neutral: a Necron Tomb Ship.", kids: [["Chaos won", "majA"], ["The Imperials won", "minAN"]] },
    ex: { n: "Exterminatus — Stygies Major", sc: "exterminatus", txt: "The Eldar (the neutral player) attack; Chaos and the Imperials defend together but compete for points. If the Eldar lose, whichever of the two scored more chooses the result.", kids: [["Eldar lost; Chaos scored more", "minAN"], ["The Eldar won", "majN"], ["Eldar lost; the Imperials scored more", "minDN"]] },
    pa: { n: "Planetary Assault — Stygies Major", sc: "planetary-assault", txt: "The Imperials attack, Chaos defends. Neutral: Eldar, 600 pts. Marginal wins do not count: the Imperials need a full 10 assault points.", kids: [["The Imperials reached 10 assault points", "majD"], ["Anything less", "minDN"]] },
    majA: { n: "Major victory for Chaos", end: "b" },
    minAN: { n: "Minor victory for Chaos and the neutral player", end: "b" },
    majN: { n: "Major victory for the neutral player", end: "c" },
    minDN: { n: "Minor victory for the Imperials and the neutral player", end: "a" },
    majD: { n: "Major victory for the Imperials", end: "a" }
  };

  /* yksinpelikampanja (WR37 s. 15–17) */
  const SOLO = {
    bfg1: { n: "BFG-1 Outpost strike (this page)", txt: "500 pts of elite ships against 1000 pts of Tyranid escorts and cruisers. Set-up and goal on the Set-up and Play tabs.", kids: [["Success", "sh1"], ["Failure", "bfg2"]] },
    sh1: { n: "SH-1 Rescue (Space Hulk mission 3)", txt: "Recover the outpost’s sensor records. Win: +3D6×10 pts of new regular ships for BFG-5.", kids: [["Won", "bfg2"], ["Lost", "bfg2"]] },
    bfg2: { n: "BFG-2 Evacuate the outer system: Convoy", sc: "convoy", txt: "If the defenders win, the Tyranids lose 2 assault points in BFG-5.", kids: [["The defenders won", "sh2"], ["The Tyranids won", "sh2"]] },
    sh2: { n: "SH-2 Decoy (Space Hulk mission 5)", txt: "Extract a VIP. Win: +2D6×10 pts of planetary defences in BFG-5.", kids: [["Won", "bfg3"], ["Lost", "bfg3"]] },
    bfg3: { n: "BFG-3 The Raiders, Tyranids defending", sc: "the-raiders", txt: "750 pts of defenders against 1500 pts of Tyranids. If you lose, the Tyranids repair D6 hull on each hive ship.", kids: [["An elite ship hit-and-ran a hive ship that survived", "sh3"], ["Otherwise", "bfg4"]] },
    sh3: { n: "SH-3 Cleanse and Burn (Space Hulk mission 4)", txt: "Plant explosives inside the hive ship. Win: the Tyranids lose that hive ship.", kids: [["Won", "bfg4"], ["Lost", "bfg4"]] },
    bfg4: { n: "BFG-4 Fleet Engagement", sc: "fleet-engagement", txt: "1500 pts each; aim for the hive ships. Pick your formation, then roll the Tyranids’: 1–2 Sphere, 3–4 Wedge, 5–6 Cross.", kids: [["Played", "bfg5"]] },
    bfg5: { n: "BFG-5 Planetary Assault", sc: "planetary-assault", txt: "1500 pts each (or what the defenders have left). Add the bonuses won in SH-1, SH-2 and BFG-2. The Tyranids score assault points parked in high orbit within 10 cm of the planet, unless you use the low orbit table.", kids: [["The defenders won outright", "sh5"], ["The Tyranids scored 3–6 assault points", "sh6"], ["The Tyranids scored 7 or more", "sh7"]] },
    sh5: { n: "SH-5 Search and Destroy (Space Hulk generator 6)", txt: "Hunt the Tyranids that reached the surface.", kids: [["Won", "winD"], ["Lost", "sh6"]] },
    sh6: { n: "SH-6 Raid, twice (Space Hulk generator 4)", txt: "Synapse creatures or a cult found on the planet.", kids: [["Both won", "winD"], ["One or both lost", "bfg6"]] },
    sh7: { n: "SH-7 Breakout (Space Hulk generator 5)", txt: "Evacuate the planet. Lost: the elite fleet is lost too.", kids: [["Won", "bfg6"], ["Lost — the elite fleet is lost", "bfg6"]] },
    bfg6: { n: "BFG-6 Evacuation: Blockade Run", sc: "blockade-run", txt: "750 pts of defenders (or what is left) against 1500 pts of Tyranids.", kids: [["The defenders won", "bfg7"], ["The defenders lost", "silent"]] },
    bfg7: { n: "BFG-7 Exterminatus", sc: "exterminatus", txt: "A fresh 1500 pt defender fleet (repaired and topped up) against 2000 pts of Tyranids.", kids: [["The defenders won", "pyrrhic"], ["The defenders lost", "total"]] },
    winD: { n: "The defenders win the campaign", end: "a" },
    silent: { n: "Defeat: the system goes silent", end: "b" },
    pyrrhic: { n: "Pyrrhic victory: the system is lost, but the hive fleet spreads no further", end: "a" },
    total: { n: "Complete defeat: the system and its reinforcements fall to the hive fleet", end: "b" }
  };
  const treeEnd = (st, id, T) => { const path = get(st, id, null) || [], cur = treeAt(T, path), n = T.nodes[cur]; return n.end ? n : null; };

  addScenarios([
  /* ------------------------------------------------------------ STYGIES */
  {
    id: "wr-stygies-tree", grp: "untested", name: "Battle for the Stygies System", series: "Campaign tree · three players", trust: "untested", players: 3, type: "Campaign",
    why: NO_REPORT + " A branching campaign built from the rulebook scenarios.", src: "Warp Rift 27, pp. 29–30", book: "O", suggest: ["Chaos", "Imperial Navy", "Orks · Necrons · Eldar"],
    others: "Any attacker and defender work; the neutral player needs Orks, a Necron Tomb Ship and Eldar — or swap them for what you own.",
    sides: { a: { n: "Defender", f: "Imperial Navy" }, b: { n: "Attacker", f: "Chaos" }, c: { n: "Neutral", f: "Orks, Necrons, Eldar" } },
    pitch: "Three players, six rulebook battles, one branching war. Each result picks the next battle — and the neutral player chooses a side every time.",
    glance: [["Points", "1500–2000 each; neutral 500–800"], ["Table", "As each scenario"], ["Battles", "3 per campaign"], ["Players", "Three"], ["Victory", "Where the tree ends"]],
    bring: ["Master rosters for the attacker and defender", "Neutral forces: 800 pts of Orks, a Necron Tomb Ship, 600 pts of Eldar"],
    forces: {
      a: ["1500–2000 pts on a master roster. Destroyed ships stay lost; all other damage is repaired between battles."],
      b: ["1500–2000 pts on a master roster, the same way."],
      c: ["A different force each battle (see the tree). Roll Leadership fresh each game.", "Before the campaign, roll six times on the refit tables in secret. Each battle, give one refit to one ship and strike it off."]
    },
    noMap: "Each battle uses its own rulebook scenario — open it from the campaign tree on the Play tab. Let the named location inspire the terrain.",
    steps: [
      { s: "a", t: "Write a master roster of ships (campaign rules, RB p. 144–)." },
      { s: "b", t: "Write a master roster of ships the same way." },
      { s: "c", t: "Roll six times on the refit tables (RB p. 158–159) and note the results in secret." },
      { t: "Play the first battle, Surprise Attack, from the campaign tree." }
    ],
    notes: ["The source points to “Ship Experience, rulebook page 154” — an older rulebook. Use the Remastered campaign rules for renown and crew skills (RB p. 152, 159).", "Mersk, The Bricabrac, Curtain Cloud Nebula and the Anomaly are only flavour for the terrain."],
    refs: [["Campaign rules", "RB p. 144–"], ["Renown and crew skills", "RB p. 152, 159"], ["Refit tables", "RB p. 158–159"], ["Necron Tomb Ship", "FL p. 405"]],
    play: [
      { w: "Before each battle", s: "c", t: "Declare which side you fight for. You take your turn with that player and count as their ally for the game. The tree usually shows the sensible choice — except in the first battle." },
      { w: "Between battles", t: "Destroyed ships stay lost; everything else is repaired." }
    ],
    tools: [{ k: "tree", id: "path", l: "Campaign tree", start: "sa", nodes: STYGIES }],
    end: ["After three battles, at the bottom of the tree."],
    win: ["The tree’s end point names the winners: a major attacker, neutral or defender victory, or a minor one shared with the neutral player."],
    result(st, v, S) { const e = treeEnd(st, "path", S.tools[0]); return e ? [e.end, e.n, "The campaign is over."] : [null, "Campaign in progress", "Record each battle on the Play tab."]; },
    info: { bg: "Chaos infiltrates the Stygies system and strikes at the heart of the Imperial fleet, while Ork raiders, a lurking Necron ship and Eldar seeking a lost maiden world each take a hand. The author stresses fun over fairness.", cr: [wrCredit(27, "Max Porter Zasada (Moox)")] }
  },
  /* ------------------------------------------------------------ LOOTING THE HULK */
  {
    id: "wr-looting-the-hulk", grp: "untested", name: "Looting the Hulk", series: "Wreck scenarios", trust: "untested",
    variants: [["a", "A: Race for the hulk"], ["b", "B: Raid the salvage site"]],
    why: NO_REPORT, src: "Warp Rift 28, pp. 18–19", book: "K", suggest: ["Imperial Navy", "Chaos", "Orks"],
    others: "Any fleets; the author names Imperial, Chaos and Ork salvagers as the natural fit.",
    sides: { a: { n: "Fleet A", f: "Any fleet" }, b: { n: "Fleet B", f: "Any fleet" } },
    pitch: v => v === "b" ? "A salvage fleet guards its boarding crews on a wreck. A raiding force half its size slips past the picket to grab the loot and run." : "A drifting wreck full of technology sits between two fleets. Board it, search it, tow it — and get the loot off the table.",
    glance: v => v === "b" ? [["Points", "Raiders up to half the salvagers"], ["Table", "Any"], ["Battlezone", "Agreed"], ["First turn", "Not given"], ["Victory", "Campaign-style points"]] : [["Points", "Equal"], ["Table", "Any"], ["Battlezone", "Agreed"], ["First turn", "Not given"], ["Victory", "VP + loot"]],
    bring: ["A hulk model (a wrecked cruiser) on a base", "Tech markers"],
    forces: v => v === "b" ? { a: ["The raiders: up to half the salvagers’ points."], b: ["The salvagers: any size. Up to a quarter stands within 20 cm of the hulk, with at least one ship in contact, boarding it; the rest forms a picket."] } : { a: ["Equal points."], b: ["Equal points."] },
    draw: (v, W, H) => { const hx = Math.max(W * .4, 20 + 40 + 16); return v === "b"
      ? [{ z: "circ", cx: hx, cy: H / 2, r: 20, s: "b", l: "" }, { z: "mark", x: hx, y: H / 2, s: "n", l: "hulk" }, { z: "text", x: hx, y: H / 2 + 26, l: "area 4: a quarter\nof the salvagers", s: "b" },
         R(0, 0, hx - 20 - 40, H, "a", "area 5: raiders, 40 cm+ from area 4", { rot: -90, dash: 1 }),
         R(W - 40, 0, 40, 25, "b", "1", { dash: 1 }), R(W - 40, H - 25, 40, 25, "b", "2", { dash: 1 }), R(W - 20, 25, 20, H - 50, "b", "3", { dash: 1 }),
         { z: "text", x: W - 48, y: H / 2, l: "picket: 60 cm+ from area 4", s: "b", rot: -90 }]
      : [{ z: "mark", x: W / 2, y: H / 2, s: "n", l: "hulk" }, { z: "line", x1: W / 2 - 40, y1: 0, x2: W / 2 - 40, y2: H }, { z: "line", x1: W / 2 + 40, y1: 0, x2: W / 2 + 40, y2: H },
         { z: "dim", x1: W / 2 - 40, y1: H * .3, x2: W / 2, y2: H * .3, l: "40 cm" }, { z: "text", x: W / 2 - 52, y: H / 2, l: "Fleet A", s: "a", rot: -90 }, { z: "text", x: W / 2 + 52, y: H / 2, l: "Fleet B", s: "b", rot: 90 }]; },
    fit: v => v === "b" ? [150, 70] : [100, 50],
    mapNote: v => v === "b" ? "The coloured area map the text describes was not printed. Drawn from the text: the picket (areas 1–3) on the far side, at least 60 cm from area 4; areas 1 and 2 face the short edge of area 3, area 3 faces the long edges. Agree the exact areas." : "Both fleets set up 40 cm from the hulk on opposite sides.",
    steps: [
      { t: "Place the hulk in the centre of the table and agree any phenomena.", only: ["a"] },
      { t: "Both fleets set up 40 cm from the hulk, on opposite sides.", only: ["a"] },
      { s: "b", only: ["b"], t: "Place up to a quarter of your fleet within 20 cm of the hulk (area 4), at least one ship in contact and boarding it. It has found no tech yet." },
      { s: "b", only: ["b"], t: "Spread the rest evenly through picket areas 1–3, at least 60 cm from area 4, on the half of the table away from the raiders." },
      { s: "a", only: ["b"], t: "Deploy in area 5, at least 40 cm from area 4." }
    ],
    notes: v => ["No first turn or game length is given — roll off, and play until one side has left or been destroyed.", "The source does not say whether the exhaustion count is per ship or for the whole hulk; the tracker counts it for the hulk."].concat(v === "b" ? ["The author suggests a variant where the small guard force searches for tech and must run for its main fleet."] : []),
    refs: [["Boarding actions", "RB p. 89"], ["Disengaging", "RB p. 56"]],
    play: [
      { w: "Boarding the hulk", t: "Board it like a ship, but there is no crew to fight. While aboard, the boarding ship cannot move or fire." },
      { w: "Searching", t: "Roll in the end phase: the first try needs 5+. Each failure makes the next easier (4+, 3+, 2+); each find resets it to 5+. From the second find on, roll to see if the hulk is now empty: 1 after the second, 1–2 after the third, and so on. Tech is carried by the boarding ship." },
      { w: "Fighting over it", t: "An enemy ship may only board the hulk, not your ship on it. Resolve a normal boarding action with racial modifiers only; the loser becomes a drifting hulk and its tech goes to the winner. No searching in a turn you fight." },
      { w: "Towing", t: "A cruiser or bigger in contact may tow instead: it moves 10 cm a turn. If the tug dies, the hulk drifts on at its last speed and direction until boarded or towed; off the table it is lost with its tech." },
      { w: "Shooting the hulk", t: "Cruiser, 8 hits, armour 5+, shields as the ship in contact with it (none if none). Critical hits do nothing; no catastrophic damage roll." },
      { w: "Raiders", s: "a", only: ["b"], t: "You may only leave over a table edge (no disengage roll). A ship carrying tech is 10 cm slower." },
      { w: "Salvagers", s: "b", only: ["b"], t: "You may not search or tow. You may board the hulk only to stop a tow or to fight raiders aboard. You may shoot the hulk only once your guard force is gone." }
    ],
    tools: [
      { k: "salvage", id: "tech", l: "Searching the hulk" },
      { k: "counter", id: "ta", l: "Tech taken off the table — Fleet A", s: "a", res: 1, only: ["a"] }, { k: "counter", id: "tb", l: "Tech taken off the table — Fleet B", s: "b", res: 1, only: ["a"] },
      { k: "counter", id: "tr", l: "Tech taken off the table", s: "a", res: 1, only: ["b"] },
      { k: "toggle", id: "tow", l: "The hulk was towed off the table", s: "a" }
    ],
    rtools: [
      { k: "counter", id: "ac", l: "Raiders: enemy capital ships or squadrons crippled", s: "a", only: ["b"] }, { k: "counter", id: "ad", l: "Raiders: enemy capital ships or squadrons destroyed", s: "a", only: ["b"] },
      { k: "counter", id: "dc", l: "Salvagers: enemy capital ships or squadrons crippled", s: "b", only: ["b"] }, { k: "counter", id: "dd", l: "Salvagers: enemy capital ships or squadrons destroyed", s: "b", only: ["b"] },
      { k: "toggle", id: "safe", l: "The hulk was not destroyed, emptied or taken", s: "b", only: ["b"] }
    ],
    end: ["When one side has left the table or been destroyed."],
    win: v => v === "b" ? ["No victory points. Each side scores 1 per enemy capital ship or escort squadron crippled, 2 per one destroyed.", "Raiders: +1 per tech taken off, +4 for towing the hulk off. Salvagers: +2 if the hulk is not destroyed, emptied or taken."] : ["Normal victory points, plus 50 per tech carried off the table (by disengaging or leaving).", "Towing the hulk off the table: D6 × 75.", "Tech on a destroyed ship is lost; a won boarding action takes it."],
    result(st, v) {
      if (v === "b") { const a = get(st, "ac", 0) + 2 * get(st, "ad", 0) + get(st, "tr", 0) + (get(st, "tow", false) ? 4 : 0), b = get(st, "dc", 0) + 2 * get(st, "dd", 0) + (get(st, "safe", false) ? 2 : 0);
        return [a > b ? "a" : b > a ? "b" : "draw", a > b ? "The raiders win" : b > a ? "The salvagers win" : "Draw", "Raiders " + a + " · salvagers " + b + " points."]; }
      return [null, "Count victory points", "Fleet A +" + get(st, "ta", 0) * 50 + " · Fleet B +" + get(st, "tb", 0) * 50 + " VP from tech" + (get(st, "tow", false) ? "; add D6 × 75 for the tow." : ".")]; },
    info: { bg: HULK_BG, cr: [wrCredit(28, SANG)] }
  },
  /* ------------------------------------------------------------ PIRATE BASES */
  {
    id: "wr-pirate-bases", grp: "untested", name: "Pirate Bases", series: "Wreck scenarios · mini-game", trust: "untested", players: [2, 3],
    variants: [["std", "Fighters and bombers"], ["ab", "With assault boats (the author’s variant)"]],
    why: NO_REPORT + " A short game meant for the author’s fan attack craft rules; it also plays with the standard ones.", src: "Warp Rift 28, p. 19", book: "O", suggest: null,
    others: "Any fleets: it is mostly attack craft markers and a few escorts.",
    sides: { a: { n: "Pirate band A", f: "Any" }, b: { n: "Pirate band B", f: "Any" } },
    pitch: "A quick game between bigger battles: two pirate bases 60 cm apart, swarms of fighters and bombers, a handful of escorts. Destroy the other base.",
    glance: [["Points", "Free: about 9 fighters, 9 bombers, 3 escorts"], ["Table", "Small"], ["Battlezone", "None needed"], ["First turn", "Not given"], ["Victory", "Destroy the enemy base"]],
    bring: ["Two hulks (or asteroids, stations) as bases", "Plenty of fighter and bomber markers"],
    forces: { a: ["Mostly fighter and bomber squadrons, plus up to six escorts. The author used 9 fighters, 9 bombers and 3 Firestorms.", "Mark some fighter squadrons as elite (the author: 2 of 9)."], b: ["The same."] },
    draw: (v, W, H, st, sc) => { const d = agN(sc, st, "dep"); return [{ z: "circ", cx: W / 2 - 30, cy: H / 2, r: d, s: "a", l: "", free: 1 }, { z: "circ", cx: W / 2 + 30, cy: H / 2, r: d, s: "b", l: "", free: 1 },
      { z: "mark", x: W / 2 - 30, y: H / 2, s: "a", l: "base A", free: 1 }, { z: "mark", x: W / 2 + 30, y: H / 2, s: "b", l: "base B", free: 1 },
      { z: "text", x: W / 2, y: 14, l: "the bases go anywhere, 60 cm apart", s: "n" }, { z: "dim", x1: W / 2 - 30, y1: H / 2 + d + 6, x2: W / 2 + 30, y2: H / 2 + d + 6, l: "60 cm" }]; },
    fit: () => [110, 50],
    steps: [{ t: "Place two bases 60 cm apart. More players can add more bases." }, { t: "Pick your forces and set up within {a:dep} cm of your base (agreed above)." }],
    notes: ["The game was written for the author’s fan fighter and bomber rules (Warp Rift 27); with the standard rules it plays, but the author warns it gets dull fast.", "No first turn or deployment distances are given."],
    refs: [["Attack craft", "RB p. 79–86"]],
    play: [
      { w: "Bases", t: "Each base: 8 hits, armour 5+, no turrets or shields. Critical hits do nothing." },
      { w: "Elite fighters", t: "Ordinary against ordinary: hit on 4+. Ordinary against elite: 5+, elite against ordinary 3+ (2+ against bombers). Elite against elite: 4+." },
      { w: "Assault boats", t: "Both sides may also launch assault boats. The author gives no detail of how a base is taken; as agreed, a base is taken {a:take}.", only: ["ab"] }
    ],
    tools: [{ k: "counter", id: "ha", l: "Hits on base A", s: "b", max: 8, goal: 8 }, { k: "counter", id: "hb", l: "Hits on base B", s: "a", max: 8, goal: 8 },
      { k: "toggle", id: "ta", l: "Base A has been taken by boarding", s: "b", only: ["ab"] }, { k: "toggle", id: "tb", l: "Base B has been taken by boarding", s: "a", only: ["ab"] }],
    end: v => v === "ab" ? ["When a base is destroyed or taken."] : ["When a base is destroyed."],
    win: v => v === "ab" ? ["Destroy the enemy base, or take it with assault boats."] : ["Destroy the enemy base."],
    result(st, v, S) {
      if (get(st, "hb", 0) >= 8 || get(st, "tb", false)) return ["a", wins(sideName(S, "a")), get(st, "tb", false) ? "Base B is taken." : "Base B is destroyed."];
      if (get(st, "ha", 0) >= 8 || get(st, "ta", false)) return ["b", wins(sideName(S, "b")), get(st, "ta", false) ? "Base A is taken." : "Base A is destroyed."];
      return [null, "Battle in progress", "8 hits destroys a base."];
    },
    info: { bg: HULK_BG + " This one is a short pirate scrap for when time is tight.", cr: [wrCredit(28, SANG), "The fighter and bomber rules it was written for are in Warp Rift 27."] }
  },
  /* ------------------------------------------------------------ BATTLES IN THE WARP */
  {
    id: "wr-battles-in-the-warp", grp: "untested", name: "Battles in the Warp", series: "Environment rules", trust: "untested", type: "Environment",
    variants: [["cc", "Small Cruiser Clash"], ["fe", "Small Fleet Engagement"]],
    why: NO_REPORT + " An environment you play a small rulebook scenario in.", src: "Warp Rift 30, pp. 15–16", book: "K", suggest: null,
    others: "Any fleets. Keep it small: the warp rules are chaotic.",
    sides: { a: { n: "Player 1", f: "Any" }, b: { n: "Player 2", f: "Any" } },
    pitch: "Fight inside the warp: tsunamis, currents and predator shoals, weapons that fade with range, and Geller fields that fail as ships take damage.",
    glance: v => [["Points", "Small"], ["Table", "As " + (v === "fe" ? "Fleet Engagement" : "Cruiser Clash")], ["Battlezone", "The warp (own generator)"], ["Sunward edge", "None"], ["Victory", "As the base scenario"]],
    bring: ["A scatter die", "Small markers for predator shoals"],
    forces: v => ({ a: ["As " + (v === "fe" ? "Fleet Engagement (RB p. 142)" : "Cruiser Clash (RB p. 128)") + ", at a small points size."], b: ["The same."] }),
    noMap: v => "Set up as " + (v === "fe" ? "Fleet Engagement" : "Cruiser Clash") + " — open it from the rulebook scenarios — then place warp phenomena with the generator below.",
    steps: [{ t: "Set up the base scenario as the rulebook says, but roll no sunward edge." }, { t: "Roll the warp phenomena with the generator below and place them." }],
    stools: [{ k: "roll", id: "ph", l: "Warp phenomena", sub: "D6 per phenomenon", rows: () => [[1, 1, "Warp tsunami"], [2, 2, "Warp current: an arrow D3×10 cm long, direction by scatter die"], [3, 3, "D3 warp currents"], [4, 4, "A shoal of warp predators, D3×5 by D3×5 cm"], [5, 5, "D3 shoals of warp predators"], [6, 6, "A ghost planet (small)"]] }],
    notes: ["The source does not say how many phenomena to roll — use the base scenario’s usual number, or agree.", "There is no sunward edge; Eldar count as always facing away from it."],
    refs: [["Cruiser Clash", "RB p. 128"], ["Fleet Engagement", "RB p. 142"], ["Hit-and-run attacks", "RB p. 91"], ["Gunnery table", "RB p. 62"]],
    play: [
      { w: "Warp tsunami", t: "At the start of each player turn roll a D6 (one roll, however many tsunamis): on a 6 one arrives. Every ship or squadron tests Leadership; each failure takes a 2D6-strength lance attack. Shields and Brace work." },
      { w: "Warp current", t: "A ship crossing the arrow is pushed 2D6 cm along it at once, keeping its facing. Crossing two currents applies both." },
      { w: "Predator shoals", t: "A ship touching a shoal during movement suffers D6 hit-and-run attacks at the end of the movement phase. Each end phase every shoal moves D6 cm towards the nearest ship." },
      { w: "Ghost planet", t: "At the start of each player turn roll a D3 × 5 cm for the size of its gravity well." },
      { w: "Weapons", t: "Lances hit on 5+ beyond 30 cm and 6+ beyond 45 cm. Batteries shift one column right per 15 cm (or part) to the target. No nova cannons. Ordnance waves lose one squadron or torpedo each ordnance phase. Teleport attacks do not work." },
      { w: "Geller field check", t: "In each end phase, every ship or squadron damaged this turn or touching blast markers rolls a D6, adds its damage this turn and the blast markers touching it, and subtracts its remaining hits (squadrons: remaining escorts). The rest is the number of hit-and-run attacks it suffers." },
      { w: "Otherwise", t: "Normal rules: ships move, have shields and may disengage (an emergency jump to real space). Losing shields is not losing the Geller field." }
    ],
    tools: [{ k: "counter", id: "gd", l: "Geller check: damage taken this turn" }, { k: "counter", id: "gb", l: "Geller check: blast markers touching" }, { k: "counter", id: "gh", l: "Geller check: hits (or escorts) left", start: 6 },
      { k: "info", html: st => { const b = get(st, "gd", 0) + get(st, "gb", 0) - get(st, "gh", 6); return "<h3>Geller field check</h3><table class='ltab'>" + [1, 2, 3, 4, 5, 6].map(d => "<tr><td>D6 " + d + "</td><td>" + Math.max(0, d + b) + " hit-and-run attack" + (Math.max(0, d + b) === 1 ? "" : "s") + "</td></tr>").join("") + "</table>"; } }],
    end: ["As the base scenario."],
    win: ["As the base scenario."],
    result() { return [null, "Score as the base scenario", "Cruiser Clash or Fleet Engagement victory conditions."]; },
    info: { bg: "Fighting in the warp is close to suicide: auguries fail and most power goes to the Geller field that keeps a bubble of real space around the ship. Only a desperate — or mad — admiral tries it, best as a one-off or a twist in a narrative campaign.", cr: [wrCredit(30, "Dan Lee")] }
  },
  /* ------------------------------------------------------------ FLEET ENGAGEMENT VARIANT */
  {
    id: "wr-fe-variant", grp: "untested", name: "Fleet Engagement Variant", series: "Alternative deployment", trust: "untested",
    why: NO_REPORT + " An alternative to the rulebook’s formations.", src: "Warp Rift 32, pp. 10–11", book: "K", suggest: null,
    others: "Any fleets. Aggressive fleets suit stealth, defensive ones the picket.",
    sides: { a: { n: "Attacker", f: "Any" }, b: { n: "Defender", f: "Any" } },
    pitch: "Instead of formations, choose how you approach: sneak in as hidden tokens, throw out a picket of escorts and fighters, or keep a tight convoy.",
    glance: [["Points", "Equal"], ["Table", "Any"], ["Battlezone", "Agreed"], ["First turn", "Bonus roll-off"], ["Victory", "VP lead over 10% of the game size"]],
    bring: ["Numbered tokens and decoys (for stealth)"],
    forces: { a: ["Equal points."], b: ["Equal points."] },
    draw: (v, W, H, st) => { const [ea, eb] = feApproach(st), out = [{ z: "line", x1: 0, y1: H / 2, x2: W, y2: H / 2 }];
      const zone = (e, s, bottom) => { const y = bottom ? (a, h) => H - a - h : (a) => a; const lab = s === "a" ? "Attacker" : "Defender";
        if (e === 0) return [{ z: "edge", e: bottom ? "b" : "t", s, l: lab + ": stealth tokens along the edge" }];
        if (e === 1) return [R(0, y(H / 2 - 15, 15), W, 15, s, lab + ": escorts and strike craft"), R(30, y(0, H / 2 - 30), Math.max(0, W - 60), Math.max(0, H / 2 - 30), s, lab + ": cruisers and battleships")];
        if (e === 2) return [R(0, y(0, 30), W, 30, s, lab + ": convoy, 30 cm")];
        if (e === 3) return [R(30, y(30, H / 2 - 30), Math.max(0, W - 60), Math.max(0, H / 2 - 30), s, lab + ": guard down", { dash: 1 })];
        return [{ z: "text", x: W / 2, y: bottom ? 3 * H / 4 : H / 4, l: lab + ": choose an approach", s }]; };
      return out.concat(zone(eb, "b", false), zone(ea, "a", true)); },
    fit: () => [120, 90],
    mapNote: "The map follows the approaches picked below. The attacker’s half is drawn at the bottom.",
    steps: [
      { t: "Choose attacker and defender, then set up phenomena by agreement." },
      { t: "Each player picks an approach in secret, then reveal (below)." },
      { t: "Roll a D6 each: the lower roller deploys a ship or squadron first, then take turns." }
    ],
    stools: [
      { k: "pick", id: "apa", l: "Attacker’s approach", rows: [["Stealth", "hidden tokens"], ["Picket", "escorts forward"], ["Convoy", "close order"]] },
      { k: "pick", id: "apb", l: "Defender’s approach", rows: [["Stealth", "hidden tokens"], ["Picket", "escorts forward"], ["Convoy", "close order"]] },
      { k: "info", html: st => { const [a, b] = feApproach(st), N = ["Stealth", "Picket", "Convoy", "Guard down"]; return a < 0 || b < 0 ? "<p class='calc'>Pick both approaches to see the deployment.</p>" : "<h3>Deployment</h3><p class='calc'>Attacker: <b>" + N[a] + "</b> · defender: <b>" + N[b] + "</b>" + (a === 3 || b === 3 ? " — both chose the same, so one side is caught with its guard down." : "") + "</p>"; } }
    ],
    notes: ["Sensor ranges: strike craft base contact; escorts, cruisers and battleships 30 cm; space stations 50 cm."],
    refs: [["Fleet Engagement", "RB p. 142"], ["Leadership tests", "RB p. 45"]],
    play: [
      { w: "Stealth", t: "Deploy numbered tokens along your edge (note which is which), plus one decoy per three real ones. A token moves 15 cm, turns 45° like a cruiser, has no weapons and cannot be attacked. Only escorts may be squadroned. At the start of your turn you may swap a token for its ships (escorts within 10 cm of it, same facing). An enemy that ends a move within sensor range may test Leadership per token to reveal it; then the revealed ships test Leadership — fail, and they have no shields or turrets until their next turn. Mimic engines always pass." },
      { w: "Picket", t: "Escorts and strike craft in the 15 cm strip at the centre line; cruisers and battleships in the zone 30 cm in from the short edges, 15 cm behind it. Face any way. You may place all the strike craft you could launch as one deployment — then your carriers start empty and must reload." },
      { w: "Convoy", t: "Within 30 cm of your edge, all facing the same way, each ship within 10 cm of one already placed." },
      { w: "Guard down", t: "On your half, at least 30 cm from every table edge, all facing a short edge of your choice, at least 15 cm from your other ships where possible." },
      { w: "First turn", t: "Roll a D6 each: +1 for the higher-Leadership admiral, +1 for more escorts, +1 for the fastest ship. The winner chooses; re-roll ties." }
    ],
    tools: [],
    rtools: [{ k: "num", id: "size", l: "Game size (points)", after: v => v ? "To win you need more than <b>" + Math.floor(v / 10) + "</b> VP over your opponent." : "" }, { k: "num", id: "va", l: "Attacker’s victory points", s: "a", after: () => "" }, { k: "num", id: "vb", l: "Defender’s victory points", s: "b", after: () => "" }],
    end: ["When one fleet has fully disengaged or been destroyed."],
    win: ["Victory points as normal. To win you need more than 10% of the game size over your opponent; otherwise it is a draw."],
    result(st, v, S) { const n = num(st, "size"), a = num(st, "va"), b = num(st, "vb"); if (!n) return [null, "Count victory points", "Enter the game size and both scores."];
      const m = n / 10; return a - b > m ? ["a", wins(sideName(S, "a")), (a - b) + " VP ahead (needed over " + Math.floor(m) + ")."] : b - a > m ? ["b", wins(sideName(S, "b")), (b - a) + " VP ahead (needed over " + Math.floor(m) + ")."] : ["draw", "Draw", "Neither side is more than " + Math.floor(m) + " VP ahead."]; },
    info: { bg: "The rulebook’s formations often end up deployed nothing like the formation picked. Here you decide how to approach the enemy and deploy to match — with sensor ranges tuned so stealth ships reveal around 50 cm and strike within 30.", cr: [wrCredit(32, "Dan Lee"), "The page header of that issue says “Issue 30” by mistake."] }
  },
  /* ------------------------------------------------------------ SOLITAIRE CAMPAIGN */
  {
    id: "wr-solitaire-campaign", grp: "untested", name: "Solitaire Campaign", series: "Solo campaign against a hive fleet", trust: "untested", players: 1, type: "Campaign",
    variants: [["easy", "Easy"], ["medium", "Medium"], ["hard", "Hard"]],
    why: NO_REPORT + " Designed to be very hard to win.", src: "Warp Rift 37, pp. 13–17", book: "O", suggest: ["Any defender", "Tyranids (scripted)"],
    others: "Any defending fleet. The Space Hulk missions use 1st edition Space Hulk (or any skirmish game); skip them and count them as lost if you prefer pure Battlefleet Gothic.",
    sides: { a: { n: "Defenders", f: "Your fleet (regular + elite)" }, b: { n: "Hive fleet", f: "Tyranids, played by the rules below" } },
    pitch: "You against a scripted hive fleet: seven fleet battles and up to seven boarding missions, branching on every result. Once your ships are gone, they are gone.",
    glance: v => [["Points", "Set for each battle"], ["Hive ships", { easy: "4", medium: "6", hard: "8" }[v]], ["Terminators", { easy: "40", medium: "30", hard: "20" }[v]], ["Space Hulk limit", { easy: "50 pts", medium: "30 pts", hard: "20 pts" }[v]], ["Victory", "Where the tree ends"]],
    bring: ["A large regular fleet and a smaller elite fleet", "Tyranids: plenty of escorts and cruisers, plus the hive ships", "Space Hulk (1st edition) for the SH missions"],
    forces: v => ({
      a: ["A large regular fleet and a smaller elite fleet; neither replaces losses except as the tree says. Only the elite fleet can start offensive Space Hulk missions — lose all elite capital ships and those missions are lost automatically.", { easy: "40", medium: "30", hard: "20" }[v] + " Terminators (or equivalent) for Space Hulk games; once they are gone you fight with endless ordinary troops."],
      b: [{ easy: "4", medium: "6", hard: "8" }[v] + " hive ships; the hive fleet loses at once if all are destroyed.", "Escorts and cruisers are unlimited. Only hive ship hull damage carries over (critical hits are repaired)."]
    }),
    draw: (v, W, H) => [R(0, 0, 10, H, "a", "Defenders: 10 cm", { rot: -90 }), R(W - 60, 0, 30, H, "b", ""), { z: "text", x: W - 45, y: H - 3 - textLen("other escorts", W) / 2, l: "other escorts", s: "b", rot: 90 }, R(W - 30, 0, 30, H, "b", ""), { z: "text", x: W - 6, y: H / 2, l: "cruisers and escort drones", s: "b", rot: 90 },
      { z: "mark", x: W - 20, y: H / 2, s: "n", l: "" }, { z: "text", x: W - 34, y: H / 2 - 9, l: "outpost" }, { z: "sun" }, { z: "line", x1: W / 2, y1: 0, x2: W / 2, y2: H },
      { z: "text", x: W / 4, y: 12, l: "defenders may disengage\non this half", s: "a" }],
    fit: () => [120, 60],
    mapNote: "This is BFG-1, the first battle. The other battles use the rulebook scenarios named in the campaign tree.",
    steps: [
      { t: "Outer Reaches terrain; the sunward edge is your short edge." },
      { s: "b", t: "Place the outpost marker 20 cm in from the centre of the Tyranid short edge. Deploy 1000 pts of Tyranid escorts and cruisers (no hive ships) in lines from long edge to long edge, all facing you — walls between you and the outpost." },
      { s: "a", t: "Deploy 500 pts of elite ships within 10 cm of your short edge." }
    ],
    notes: ["BFG-5’s branches are “a full defender victory” (SH-5), “more than 2 assault points” (SH-6) and “more than 6” (SH-7); exactly 2 assault points is not covered — agree it.", "The author recommends the Deathwing expansion’s solo rules for Space Hulk."],
    refs: [["Tyranid instinctive behaviour", "FL p. 416"], ["Outer Reaches", "RB p. 108"], ["Rulebook scenarios", "RB p. 128–143"]],
    play: [
      { w: "BFG-1 goal", s: "a", t: "Make a teleport or hit-and-run attack on the outpost, then get every ship away — only past the halfway line on your half, or into a warp rift. You win if the ship that attacked disengages on your half." },
      { w: "Disengaging (whole campaign)", s: "a", t: "Each ship that disengages rolls a D6: on 1 or less it is lost for the rest of the campaign. −2 if it left from the Tyranid half, −4 if through a warp rift." },
      { w: "Tyranid behaviour", s: "b", t: "Over 60 cm and in the front arc: All Ahead Full towards the enemy. Under 60 cm: turn and move at full speed, trying to board the nearest enemy (slowing to do so). If guns will be in range after a straight move: Lock On. If the enemy is outside one turn’s angle: Come to New Heading and move half speed towards it (escort drones full); capital ships turn and try a full move; hive ships Burn Retros to turn if blast markers would stop them." },
      { w: "Tyranid ordnance", s: "b", t: "Torpedoes and assault boats only under 15 cm. Fighters escort the hive ships. Hive ships launch fighters to their normal capacity, then reload for assault boats with the rest (the doubling); lost fighters are relaunched at once. Crippled hive ships launch fighters only to defend themselves." },
      { w: "Tyranid terrain and bracing", s: "b", t: "Ignore phenomena except warp rifts (avoid them; Burn Retros rather than hit one). Head for a planet only in a planetary assault: within 10 cm, take high orbit and score assault points. Brace when the dice coming in could cripple; crippled hive ships always brace. When in doubt: turn and move half speed towards the nearest enemy." },
      { w: "Tyranid deployment", s: "b", t: "Hive ships as far from your zones as possible, ringed by escort drones; other ships spread evenly. Where divisions are used, assign them at random." },
      { w: "Repairs between battles", s: "a", only: ["easy"], t: "All damage on your ships is repaired." },
      { w: "Repairs between battles", s: "a", only: ["medium"], t: "Crippled ships come back at half hits +1 (not crippled); the rest — and ships that sat out — fully repaired." },
      { w: "Repairs between battles", s: "a", only: ["hard"], t: "Hull damage carries over; critical hits are repaired." }
    ],
    tools: [{ k: "tree", id: "path", l: "Campaign", start: "bfg1", nodes: SOLO }, { k: "counter", id: "hv", l: "Hive ships destroyed", s: "a" },
      { k: "info", html: st => { const tot = { easy: 4, medium: 6, hard: 8 }[st.v] || 6, d = get(st, "hv", 0); return "<p class='calc'>" + (d >= tot ? "<b>Every hive ship is gone — the defenders win the campaign.</b>" : "Hive ships left: <b>" + (tot - d) + "</b> of " + tot + ".") + "</p>"; } },
      { k: "counter", id: "term", l: "Terminators lost", s: "b" }],
    end: ["At the end of the campaign tree, or the moment the last hive ship dies."],
    win: ["The tree’s end point decides; destroying every hive ship wins at once."],
    result(st, v, S) { const tot = { easy: 4, medium: 6, hard: 8 }[v] || 6; if (get(st, "hv", 0) >= tot) return ["a", "The defenders win", "Every hive ship is destroyed."];
      const e = treeEnd(st, "path", S.tools[0]); return e ? [e.end, e.n, "The campaign is over."] : [null, "Campaign in progress", "Record each battle on the Play tab."]; },
    info: { bg: "A hive fleet descends on a system. A small elite force strikes an outpost behind the swarm, the outer worlds are evacuated, and the defenders try to blunt the assault before it reaches the main world — with Space Hulk missions fought aboard hive ships and on the planet in between.", cr: [wrCredit(37, "Italianmoose"), "Background art in the article by Kharneth; Tyranid fleet pictured by AC2110."] }
  }
  ]);

  /* Fleet Engagement Variantin lähestymistavat: 0 stealth, 1 picket, 2 convoy, 3 guard down, -1 valitsematta */
  function feApproach(st) {
    let a = get(st, "apa", -1), b = get(st, "apb", -1);
    if (a === 0 && b === 0) b = 3;
    else if (a === 1 && b === 1) a = 3;
    return [a, b];
  }
})();
