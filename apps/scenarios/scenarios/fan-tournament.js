/* Fan supplements: the AdeptiCon tournament missions (2007–2016) as collected in the
   BFG Tournament Mission Pack, and the six of them revised in BFG Advanced Scenarios.
   Both booklets are by Paolo Barbero (Babafleet Gothic, Baba Yaga Dungeon Club, Alessandria).
   A mission found in both booklets appears once, with a version for each (Advanced first).
   Summarised in our own words; every mission is hand-made (see docs/history/scenarios/LUEMINUT.md, in Finnish).
   Page numbers are PDF pages: Tournament Mission Pack (TMP) p. 2–21, Advanced Scenarios (AS) p. 5–11. */
(function () {
  const TP_CREDIT = "BFG Tournament Mission Pack: the AdeptiCon Battlefleet Gothic tournament missions, collected by Paolo Barbero for the Babafleet Gothic group of the Baba Yaga Dungeon Club, Alessandria (Italy). The pack credits its anti-disengage rule to the Game Kastle store of Santa Clara (CA).";
  const ADV_CREDIT = "BFG Advanced Scenarios, “a Battlefleet Gothic compendium of tournament missions” by Paolo Barbero: six AdeptiCon missions revised to one standard, play-tested at the Baba Yaga Dungeon Club. The booklet thanks Roy “horizon” Amkreutz and Andrew “Atomic Hamsters” Karolus of the BFG Discord.";
  const AC = (y, code) => "Mission of the AdeptiCon " + y + " Battlefleet Gothic tournament (roster " + code + " in the Tournament Mission Pack). The packs do not name the tournament organisers who wrote it.";
  const SIDES = { a: { n: "Fleet A" }, b: { n: "Fleet B" } };
  const OTHERS = v => v === "adv" ? "Any two fleets of up to 1250 pts from official fleet lists, each with at least one cruiser or battleship (Advanced Scenarios p. 5)." : "Any two fleets of equal points from official fleet lists, each with at least one cruiser or battleship: 1250 or 1500 pts, mission defences not counted (Tournament Mission Pack p. 2).";
  const FORCES = v => { const t = v === "adv" ? ["Up to 1250 pts from an official fleet list, with at least one cruiser or battleship.", "Roll Leadership and Adeptus Mechanicus upgrades before the battle. Tyranids may buy hive mind evolutions within their list’s limits."] : ["Equal points: 1250 or 1500 pts from an official fleet list, with at least one cruiser or battleship.", "Roll Leadership and Adeptus Mechanicus upgrades before the battle."]; return { a: t, b: t }; };
  const glance = (v, bz, len, first) => [["Points", v === "adv" ? "Equal, up to 1250 pts" : "Equal: 1250 or 1500 pts"], ["Table", "Not given — the maps show a 6′ × 4′ table"], ["Battlezone", bz], ["First turn", first || "Roll-off after deployment: the higher roll chooses"], ["Game ends", len || "After 8 turns or 2 hours"]];
  const TP_RULES = "Tournament Mission Pack rules (p. 2): fleets of 1250 or 1500 pts from an official fleet list with at least one cruiser or battleship, Leadership and Adeptus Mechanicus upgrades rolled before each battle, games of two or two and a half hours with no round started that cannot be finished, and no sub-plots. A ship that jumps through a warp rift and survives earns its player 1 battle point.";
  const ADV_RULES = "Advanced Scenarios rules (p. 5): fleets of up to 1250 pts from an official fleet list with at least one cruiser or battleship, Leadership and Adeptus Mechanicus upgrades rolled before each battle, Tyranid evolutions allowed, no round started that cannot be finished, dice down when time is called, and no sub-plots (the Adeptus Mechanicus Quest for Knowledge included).";
  const ADMIRAL = "An objective that names the Admiral uses the flagship — the vessel worth the most victory points — when a fleet has no admiral or character. An admiral whose ship suffers a Bridge Smashed critical hit counts as killed (Advanced Scenarios p. 5).";
  const LAYOUT = "Tournament tables came laid out by the organisers. At home, agree the celestial phenomena (Agree before you start) and keep them where they are: anything moved during the game goes back at the end.";
  const COWARD = "You cowards! (TMP p. 2): a fleet left alone on the table scores bonus victory points — +1000 if the enemy is gone by the end of turn 2, +750 by turn 3, +500 by turn 4, +250 by turn 5 (Result tab).";

  /* battle points: Tournament Mission Pack p. 2 (margin) and Advanced Scenarios p. 5 (difference + objectives) */
  const tpBand = m => m < 150 ? ["Draw", 9, 9] : m < 750 ? ["Solid victory", 11, 7] : m < 1350 ? ["Crushing victory", 14, 3] : ["Massacre", 17, 0];
  const advBP = d => d > 450 ? [13, 1] : d > 200 ? [11, 3] : d > 50 ? [9, 5] : [7, 7];
  const TP_COW = [[2, 1000], [3, 750], [4, 500], [5, 250]], ADV_COW = [[1, 1000], [2, 800], [3, 600], [4, 400]];
  const cowTool = (list, only) => ({ k: "pick", id: "cow", only, l: list === ADV_COW ? "Admirals, beware! (AS p. 5)" : "You cowards! (TMP p. 2)",
    foot: "A fleet with no ships left on the table — all destroyed or disengaged — hands its enemy bonus victory points, more the earlier it happens.",
    rows: [["Both fleets still on the table", "no bonus"]].concat(...[["B", "A"], ["A", "B"]].map(([gone, gets]) => list.map(([t, p]) => ["Fleet " + gone + " gone at the end of turn " + t, "Fleet " + gets + " +" + p + " VP"]))) });
  const cowVP = (st, list) => { const i = get(st, "cow", -1); if (i < 1 || i > 2 * list.length) return [0, 0]; const p = list[(i - 1) % list.length][1]; return i <= list.length ? [p, 0] : [0, p]; };
  const vpTools = () => [{ k: "num", id: "vpA", s: "a", l: "Fleet A: standard victory points", after: v => v + " VP" }, { k: "num", id: "vpB", s: "b", l: "Fleet B: standard victory points", after: v => v + " VP" }];
  const bonusTools = (l, only, f) => ["A", "B"].map(k => ({ k: "num", id: "b" + k, s: k === "A" ? "a" : "b", only, l: "Fleet " + k + ": " + l, after: f || (v => "+" + v + " VP") }));
  const BP_TP = { k: "info", html: () => "<h3>Battle points (TMP p. 2)</h3><table class='ltab'><tr><td>0–149 VP apart</td><td>Draw: 9 each</td></tr><tr><td>150–749</td><td>Solid victory: 11 to 7</td></tr><tr><td>750–1349</td><td>Crushing victory: 14 to 3</td></tr><tr><td>1350+</td><td>Massacre: 17 to 0</td></tr></table>" };
  const BP_ADV = { k: "info", html: () => "<h3>Battle points (AS p. 5)</h3><table class='ltab'><tr><td>0–50 VP apart</td><td>7 each</td></tr><tr><td>51–200</td><td>9 to 5</td></tr><tr><td>201–450</td><td>11 to 3</td></tr><tr><td>451+</td><td>13 to 1</td></tr></table><p class='small muted' style='margin:6px 0 0'>Then add the objectives’ battle points. Equal totals are a draw.</p>" };
  const only = (o, list) => list.map(t => Object.assign({ only: o }, t));

  /* secondary objectives, Tournament Mission Pack: a D6 per player before deployment, then full / partial / failed */
  const secRoll = rows => [{ k: "roll", id: "sA", l: "Fleet A: secondary objective", sub: "D6 before deployment", rows: () => rows }, { k: "roll", id: "sB", l: "Fleet B: secondary objective", sub: "D6 before deployment", rows: () => rows }];
  const secName = (st, k, rows) => { const d = get(st, k, 0), r = rows.find(x => d >= x[0] && d <= x[1]); return r ? r[2].split(":")[0] : ""; };
  const secTools = rows => [
    { k: "info", html: st => "<h3>Secondary objectives</h3><p class='calc' style='margin:0'>Fleet A: <b>" + esc(secName(st, "sA", rows) || "not rolled") + "</b> · Fleet B: <b>" + esc(secName(st, "sB", rows) || "not rolled") + "</b> (rolled on the Set-up tab)</p>" },
    { k: "pick", id: "fA", l: "Fleet A: secondary objective", rows: [["Full", ""], ["Partial", ""], ["Failed", ""]] },
    { k: "pick", id: "fB", l: "Fleet B: secondary objective", rows: [["Full", ""], ["Partial", ""], ["Failed", ""]] }];
  const secTail = (st, rows) => { const w = ["full", "partial", "failed"], a = get(st, "fA", -1), b = get(st, "fB", -1); if (a < 0 && b < 0) return ""; const one = (k, f) => (secName(st, k, rows) || "secondary") + ": " + (f < 0 ? "not recorded" : w[f]); return " Secondary — A " + one("sA", a) + "; B " + one("sB", b) + "."; };
  const tpResult = (st, A, B, rows, extra) => {
    const cw = cowVP(st, TP_COW); A += cw[0]; B += cw[1];
    if (!A && !B) return [null, "Count victory points", "Enter both fleets’ victory points below."];
    const m = Math.abs(A - B), b = tpBand(m), tail = " Fleet A " + A + " – Fleet B " + B + " VP." + (extra || "") + (rows ? secTail(st, rows) : "");
    if (m < 150) return ["draw", "Draw: " + m + " VP apart", "9 battle points each." + tail];
    const s = A > B ? "a" : "b";
    return [s, b[0] + " for Fleet " + (s === "a" ? "A" : "B"), b[1] + " to " + b[2] + " battle points." + tail];
  };
  /* secondary objectives worth tournament points (2013–2016): toggles per fleet */
  const ptsTools = list => [].concat(...["A", "B"].map(k => list.map((o, i) => ({ k: "toggle", id: "q" + (i + 1) + k, s: k === "A" ? "a" : "b", l: "Fleet " + k + ": " + o[0] + " (" + o[1] + " pt" + (o[1] > 1 ? "s" : "") + ")" }))));
  const ptsTail = (st, list, addA, addB) => { const p = k => list.reduce((t, o, i) => t + (get(st, "q" + (i + 1) + k, false) ? o[1] : 0), 0); return " Secondary points: A " + (p("A") + (addA || 0)) + ", B " + (p("B") + (addB || 0)) + "."; };

  /* Advanced Scenarios: three fixed objectives per mission, +4 / +2 / +2 battle points */
  const objTools = objs => [].concat(...["A", "B"].map(k => objs.map((o, i) => ({ k: "toggle", id: "o" + (i + 1) + k, only: ["adv"], s: k === "A" ? "a" : "b", l: "Fleet " + k + ": " + o + " (+" + (i ? 2 : 4) + " BP)" }))));
  const advResult = (st, A, B) => {
    const cw = cowVP(st, ADV_COW); A += cw[0]; B += cw[1];
    const ob = k => [4, 2, 2].reduce((t, bp, i) => t + (get(st, "o" + (i + 1) + k, false) ? bp : 0), 0), oa = ob("A"), obb = ob("B");
    if (!A && !B && !oa && !obb) return [null, "Count victory points", "Enter both fleets’ victory points and objectives below."];
    const bp = advBP(Math.abs(A - B)), ba = (A >= B ? bp[0] : bp[1]) + oa, bb = (B > A ? bp[0] : bp[1]) + obb;
    const tail = "Battle points A " + ba + " – B " + bb + " (objectives " + oa + " and " + obb + "). Victory points A " + A + " – B " + B + ".";
    if (ba === bb) return ["draw", "Draw on battle points", tail];
    return [ba > bb ? "a" : "b", "Fleet " + (ba > bb ? "A" : "B") + " wins on battle points", tail];
  };
  const advWin = (objs, extra) => ["Victory points as normal (RB p. 122)" + (extra ? ", plus " + extra : "") + ". Their difference gives battle points: 0–50 VP apart 7 each, 51–200 9 to 5, 201–450 11 to 3, 451 or more 13 to 1.", "Then add: +4 BP if you " + objs[0] + "; +2 BP if you " + objs[1] + "; +2 BP if you " + objs[2] + ".", "Most battle points wins; equal totals are a draw."];
  const TP_WIN = "Most victory points wins. Tournament scoring turns the margin into battle points: under 150 a draw, 150–749 a solid victory, 750–1349 a crushing one, 1350 or more a massacre.";

  /* shared set-up steps and reminders */
  const S_SEC = { t: "Each player rolls a D6 for a secondary objective (tools below) and reads it out." };
  const S_FIRST = { t: "Roll off: the higher roll chooses to go first or second." };
  const S_ADVDEP = d => ({ t: "Both players roll a D6 and add their fleet’s attack rating: the winner decides who deploys first. Then take turns placing one ship or squadron at a time, within " + d + " cm of your long edge." });
  const S_ACDEP = d => ({ t: "Roll attack ratings (Before the battle): the higher roll chooses whether to deploy first or second. Then take turns placing a ship or squadron at a time, within " + d + " cm of your long edge." });
  const S_DEP20 = { t: "Deploy within 20 cm of your long edge — order: {a:dep}." };
  const P_TIME = v => ({ only: v === "adv" ? ["adv"] : undefined, w: "Time limit", t: v === "adv" ? "Eight turns or two hours, whichever comes first. Do not start a round you cannot finish; dice down when time is called." : "Eight turns or two hours, whichever comes first. Do not start a new turn unless both players can finish it." });
  const P_TIME2 = [Object.assign(P_TIME("adv"), { only: ["adv"] }), Object.assign(P_TIME("tp"), { only: ["ac"] })];
  const CLOCK = { k: "timer", id: "clk", l: "Game clock", min: 120 };
  const LAST8 = T => T === 8 ? [[null, "Last turn"]] : [];
  const zones = (W, H, d) => [R(0, 0, W, d, "a", "Fleet A: " + d + " cm"), R(0, H - d, W, d, "b", "Fleet B: " + d + " cm")];
  const rift = (cx, cy, l) => [{ z: "circ", cx, cy, r: 5, s: "c", l: "", nr: 1, tk: "rift" }, l ? { z: "text", x: cx, y: cy + 10, l, s: "c" } : null]; /* tk: klikattava warp rift (0.13) */
  const REF_VP = [["Victory points", "RB p. 122"], ["Attack ratings", "RB p. 120"]];

  /* secondary tables */
  const HEADHUNTERS = "Headhunters: destroy the enemy flagship (full), or cripple it or make it disengage (partial). A hive ship counts as a flagship, and so does a Necron ship carrying the Sepulchre; other Necron fleets: −4 Ld from critical hits is full, −2 Ld partial";
  const RIFT_OBJ = "Navigate the Warp Rift: get a ship or squadron through the rift (full), or lose one trying (partial)";
  const ESCORTS = "Deplete the Enemy’s Escort Screen: every enemy escort destroyed or disengaged (full), or half of them (partial). Roll again if the enemy has no escorts";
  const BREAK = "Break the Line: get 4 points of ships off the enemy’s long edge — battleship 4, cruiser 2, escorts 1 per full three ships of a squadron. They do not count as disengaged. 4 points is full, 2 partial";
  const REVENGE = "Revenge!!!: pick an enemy capital ship at random. Destroy it (full) or cripple it (partial)";
  const PYRRHIC = "Pyrrhic Avoidance: at least half of your capital ships uncrippled at the end, disengaged ones included (full), or more capital ships left on the table than the enemy (partial)";
  const DISGRACED = "Disgraced Ship: pick one of your capital ships at random. It must deal at least one point of damage in the attack that destroys an enemy capital ship (full), or add to the damage that cripples one (partial). A battery or lance die in a squadron salvo counts";
  const FLAG = "Protect the Flag: your flagship survives uncrippled (full), or is crippled or disengages (partial). Destroyed or a Bridge Smashed critical hit: failed";
  const PICKUP = "Pickup and Retrieval: before deployment, nominate an enemy capital ship in secret. Hit-and-run or board it (full), or destroy it without doing so (partial)";
  const SEC_A1 = [[1, 2, HEADHUNTERS], [3, 4, "In the Kingdom of the Blind: destroy or drive off every enemy escort squadron (full), or bring the enemy escorts below half their starting strength (partial)"], [5, 6, PICKUP]];
  const SEC_B2 = [[1, 2, REVENGE], [3, 4, PYRRHIC], [5, 6, "Disgraced Ship (as printed, the flagship objective): your flagship survives uncrippled (full), or is crippled or disengages (partial). Destroyed or a Bridge Smashed critical hit: failed"]];
  const SEC_A2 = [[1, 2, "Into the Rift: a capital ship or escort squadron enters the rift and comes out again (full), or enters it and is destroyed (partial)"], [3, 4, "Protect the Planet: at the end, at least one uncrippled capital ship or half-strength escort squadron within 20 cm of “the planet” and none of the enemy’s (full), or more of them there than the enemy (partial). See Play for what the planet is"], [5, 6, "Rally to the Flag: your flagship is not crippled and has not disengaged at the end (full), or it was crippled and/or disengaged (partial)"]];
  const SEC_A3 = [[1, 2, "Redemption of Honor: pick one of your capital ships at random. It destroys an enemy ship worth at least as much (full), or cripples one (partial)"], [3, 4, "Pyrrhic Avoidance: half of your capital ships still alive or disengaged, and uncrippled (full), or more capital ships left at the end than the enemy (partial)"], [5, 6, "Vendetta: pick an enemy capital ship at random. Destroy it (full) or cripple it (partial)"]];
  const SEC_A4 = [[1, 2, RIFT_OBJ], [3, 4, ESCORTS], [5, 6, BREAK]];
  const SEC_A5 = [[1, 2, DISGRACED], [3, 4, REVENGE], [5, 6, "Head of the Snake: kill the enemy commander — destroy the flagship or give it a Bridge Smashed critical (full), or cripple it or make it disengage (partial). Roll again against Tyranids or Necrons"]];
  const SEC_A6 = [[1, 2, HEADHUNTERS], [3, 4, ESCORTS], [5, 6, BREAK]];
  const SEC_B1 = [[1, 2, "Pickup and Retrieval: before deployment, nominate an enemy capital ship in secret — it carries critical archaeotech. Hit-and-run or board it (full), or destroy it without doing so (partial)"], [3, 4, RIFT_OBJ], [5, 6, DISGRACED]];
  const SEC_B3 = [[1, 2, HEADHUNTERS], [3, 4, RIFT_OBJ], [5, 6, FLAG]];
  const SEC_B4 = [[1, 2, REVENGE], [3, 4, PYRRHIC], [5, 6, BREAK]];

  /* Capture the Station: rules for both versions */
  const STATION_PLAY = [
    { only: ["adv"], w: "End of each game turn: the station fires", t: "Its weapons battery fires at the closest ship, its lances at the second closest. With only one ship in range, the lances stay silent. It never fires at ships in base contact with it, even while boarded." },
    { only: ["adv"], w: "The station", t: "It cannot be targeted or affected by weapons or ordnance — only by boarding actions, as a vessel with 2 hits and 3 turrets." },
    { only: ["adv"], w: "Retrieving data-cores", t: "Add up the damage your boarding actions would inflict on the station in the same end phase: every 2 points retrieves one data-core worth 50 VP instead, and spare points are lost. A ship that has boarded the station may never board it again, even empty-handed." },
    { only: ["ac"], w: "End of each game turn: platform and pirates", t: "The platform fires each broadside at the closest non-pirate ship in that arc, then turns 45° clockwise. The pirates move toward the nearest squadron, staying within 30 cm of the platform if they can, and fire at it." },
    { only: ["ac"], w: "Pirates on patrol", t: "Until a ship comes within their shooting range or fires at them, a pirate squadron does not move and does not count as a defence for gunnery." },
    { only: ["ac"], w: "Boarding the platform", t: "Only by boarding: it defends as an 8-hit cruiser with 2 turrets, and is captured when its hits reach 0. One ship at a time, any class, resolved only in the boarding player’s turn. The boarding ship takes no damage either way." },
    { only: ["ac"], w: "Win or lose", t: "A win: the ship stays in place as in a drawn boarding action. A loss: that ship may never board again, but the damage it did still counts. When the other fleet then wins its first boarding action, the platform resets to full hits against the first." },
    { only: ["ac"], w: "Captured", t: "The platform disengages at once. While boarded it keeps firing, but not from the arc being boarded." },
    ...P_TIME2
  ];

  addScenarios([
  /* ------------------------------------------------------------ A1 / B2 MANNA FROM THE HEAVEN · SUPPLY RUN */
  {
    id: "fan-t-manna", grp: "fan-tour", name: "Manna from the Heaven", series: "AdeptiCon 2007 · with Supply Run, 2010", trust: "fan",
    why: "Tournament mission: a high-speed pass through a planet’s gravity well to drop supplies. AdeptiCon used it twice — in 2010 as Supply Run.", src: "Tournament Mission Pack p. 4, 11", book: "O", suggest: null, others: OTHERS,
    sides: SIDES,
    variants: [["m07", "2007 · Manna from the Heaven"], ["s10", "2010 · Supply Run"]],
    pitch: "War rages on the planet below, and nobody owns its orbit. Every ship that braves a full turn in the gravity well drops its supply shuttles — and earns its own worth in victory points.",
    glance: v => glance(v, v === "m07" ? "A planet in the centre; phenomena placed in turn" : "A medium planet in the centre; phenomena agreed"),
    bring: ["A planet (medium: 16–25 cm across)", "Celestial phenomena", "Paper to note which ships have earned the bonus"],
    forces: FORCES,
    draw: (v, W, H) => [...zones(W, H, 30), { z: "planet", cx: W / 2, cy: H / 2, r: 10 }, { z: "ring", cx: W / 2, cy: H / 2, r: 25, s: "n" },
      v === "m07" ? { z: "ring", cx: W / 2, cy: H / 2, r: 60, s: "b" } : null,
      { z: "text", x: W / 2 + 42, y: H / 2, l: "gravity well\n15 cm" }, v === "m07" ? { z: "text", x: W / 2 - 42, y: H / 2, l: "no set-up\nwithin 50 cm", s: "n" } : null],
    fit: () => [120, 90],
    mapNote: v => "Deployment zones run 30 cm deep along the long edges; the attack-rating roll decides who takes which." + (v === "m07" ? " The outer circle marks 50 cm from the planet’s edge: no ship sets up inside it." : ""),
    steps: [
      { t: "Place the planet in the centre of the table (Supply Run: a medium planet)." },
      { only: ["m07"], t: "Roll off: the higher roll places the next celestial phenomenon, then take turns until all are down." },
      { only: ["s10"], t: "Set up the other celestial phenomena: {a:terr}." },
      S_SEC,
      { only: ["m07"], t: "Roll attack ratings (Before the battle): the higher roll chooses a deployment zone, 30 cm deep along a long edge. The lower roll places a ship or squadron first; then take turns. No ship within 50 cm of the planet." },
      { only: ["m07"], t: "Pickup and Retrieval (secondary 5–6): nominate your target in secret before deployment." },
      { only: ["s10"], ...S_ACDEP(30) },
      S_FIRST
    ],
    stools: [...only(["m07"], secRoll(SEC_A1)), ...only(["s10"], secRoll(SEC_B2))],
    notes: v => [TP_RULES, v === "m07" ? "The mission does not say how big the planet is; Supply Run (2010) names a medium one. Its gravity well reaches 15 cm from the planet’s edge (RB p. 113)." : "The 5–6 secondary is titled Disgraced Ship, but its text is the flagship objective that 2011 calls Protect the Flag, and its partial result begins with a stray “This ship contributes to”. We follow the text.",
      "“One full game turn” means both players’ turns. A ship may use Burn Retros in that turn, but no other special order — Brace for Impact included — or it earns nothing. Each ship earns the bonus once." + (v === "s10" ? " Supply Run adds that the ship must not be crippled." : ""), COWARD],
    refs: [["Gravity wells", "RB p. 112–113"], ["Special orders", "RB p. 46"], ...REF_VP],
    play: [
      { w: "End of each game turn", t: "Any ship that spent the whole game turn inside the planet’s gravity well, on no special orders but Burn Retros, has earned its own points value as bonus victory points. Note it — each ship earns it once." },
      { only: ["s10"], w: "Supply Run", t: "Only a ship that is not crippled earns the bonus ({a:crip})." },
      P_TIME("tp")
    ],
    turnMax: () => 8,
    fx: T => T === 8 ? [[null, "Last turn: check the gravity well one more time"]] : [[null, "End of turn: note the ships that earned the bonus"]],
    tools: [{ k: "counter", id: "nA", s: "a", l: "Fleet A: ships that earned the bonus" }, { k: "counter", id: "nB", s: "b", l: "Fleet B: ships that earned the bonus" }, CLOCK],
    rtools: [...vpTools(), ...bonusTools("points value of ships that earned the bonus"), cowTool(TP_COW), ...only(["m07"], secTools(SEC_A1)), ...only(["s10"], secTools(SEC_B2)), BP_TP],
    end: ["After 8 turns, or when 2 hours are up (whole turns only)."],
    win: v => ["Victory points as normal (RB p. 122), plus each ship’s own points value once if it spent a whole game turn in the gravity well on no special orders but Burn Retros" + (v === "s10" ? " and was not crippled" : "") + ".", TP_WIN, "The secondary objectives were scored on top for the tournament standings."],
    result(st, v) { return tpResult(st, num(st, "vpA") + num(st, "bA"), num(st, "vpB") + num(st, "bB"), v === "s10" ? SEC_B2 : SEC_A1); },
    info: { bg: "Fighting rages on a world below, and its defenders scream for supplies. With nobody holding the orbit, a normal landing is suicide, so each fleet risks a high-speed pass through the gravity well, launching its shuttles on a one-way trip before turning back on the enemy.", cr: [AC(2007, "A1") + " The 2010 tournament reused it as Supply Run (roster B2).", TP_CREDIT + " Pages 4 and 11."] }
  },
  /* ------------------------------------------------------------ A2 + AS THE ROAD TO HELL */
  {
    id: "fan-t-road-to-hell", grp: "fan-tour", name: "The Road to Hell", series: "AdeptiCon 2007 · revised in Advanced Scenarios", trust: "fan",
    why: "Tournament mission around warp rifts. The 2007 original scores ships parked by the rift; the revision rewards crews who board a rift to stabilise it.", src: "Advanced Scenarios p. 6 · Tournament Mission Pack p. 5", book: "O", suggest: null, others: OTHERS,
    sides: SIDES,
    variants: [["adv", "Advanced Scenarios"], ["ac", "AdeptiCon 2007"]],
    pitch: v => v === "adv" ? "A rare pair of semi-stable warp rifts has opened. Whoever fixes them in place commands the region — so put crews aboard, and keep the enemy away." : "A fairly stable warp rift has appeared, and whoever holds it holds the advantage. Be the one parked beside it when the shooting stops.",
    glance: v => glance(v, v === "adv" ? "Two warp rifts, 4 asteroid fields, 4 gas clouds" : "A warp rift in the centre; phenomena placed in turn"),
    bring: v => v === "adv" ? ["Two warp rifts", "4 asteroid fields and 4 gas clouds", "Markers for rift stabilizers"] : ["A warp rift", "Celestial phenomena"],
    forces: FORCES,
    draw: (v, W, H) => v === "adv" ? [...zones(W, H, 30), ...rift(W / 2 - 30, H / 2, ""), ...rift(W / 2 + 30, H / 2, ""), { z: "ring", cx: W / 2 - 30, cy: H / 2, r: 20, s: "c" }, { z: "ring", cx: W / 2 + 30, cy: H / 2, r: 20, s: "c" },
        { z: "dim", x1: W / 2, y1: H / 2 - 6, x2: W / 2 + 30, y2: H / 2 - 6, l: "30 cm" }, { z: "text", x: W / 2 - 30, y: H / 2 + 10, l: "20 cm", s: "c" }]
      : [...zones(W, H, 30), ...rift(W / 2, H / 2, ""), { z: "ring", cx: W / 2, cy: H / 2, r: 20, s: "c" }, { z: "ring", cx: W / 2, cy: H / 2, r: 50, s: "n" },
        { z: "text", x: W / 2, y: H / 2 + 12, l: "20 cm", s: "c" }, { z: "text", x: W / 2 - 38, y: H / 2, l: "no set-up\nwithin 50 cm", s: "n" }],
    fit: () => [120, 90],
    mapNote: v => v === "adv" ? "The rifts sit on the centre line, 30 cm either side of the table’s centre. A ship fully within 20 cm of one may stabilise it." : "The outer circle marks 50 cm from the rift: no ship sets up inside it. Uncrippled ships within 20 cm at the end score.",
    steps: [
      { only: ["adv"], t: "Place two warp rifts on the centre line, 30 cm either side of the table’s centre (map). Then 4 asteroid fields and 4 gas clouds: {a:terr}." },
      { only: ["ac"], t: "Place the warp rift in the centre. Roll off: the higher roll places the next celestial phenomenon; take turns until all are down." },
      { only: ["ac"], ...S_SEC },
      { only: ["adv"], ...S_ADVDEP(30) },
      { only: ["ac"], t: "Roll attack ratings (Before the battle): the higher roll chooses a deployment zone, 30 cm deep along a long edge. The lower roll places a ship or squadron first; then take turns. No ship within 50 cm of the rift." },
      S_FIRST
    ],
    stools: only(["ac"], secRoll(SEC_A2)),
    notes: v => v === "adv" ? [ADV_RULES, ADMIRAL, "The booklet gives the phenomena but not how to place them. " + LAYOUT, "A stabilizer is deployed by boarding the rift. It always succeeds, so the only test is getting a ship there — fully within 20 cm at the end of its move."]
      : [TP_RULES, "Protect the Planet asks about a planet this mission never places — it was copied from Manna from the Heaven, whose planet sits in the centre. Agree what it means (Agree before you start).", COWARD],
    refs: [["Warp rifts", "RB p. 111"], ["Boarding actions", "RB p. 89–90"], ...REF_VP],
    play: [
      { only: ["adv"], w: "End of your movement", t: "A ship fully within 20 cm of a warp rift may declare a boarding action against it to deploy a rift stabilizer. It always succeeds. An escort squadron counts as one multi-ship boarding action, even with some of its ships out of range." },
      { w: "Entering a rift", t: "Navigate it with a Leadership test on 3D6; a ship that passes may be placed up to 2D6 × 10 cm away (RB p. 111)." },
      { only: ["ac"], w: "End of the game", t: "Each uncrippled ship within 20 cm of the warp rift scores its own points value as bonus victory points." },
      { only: ["ac"], w: "Protect the Planet", t: "Agreed reading: {a:planet}." },
      ...P_TIME2
    ],
    turnMax: () => 8,
    fx: (T, st, v) => T === 8 ? [[null, v === "ac" ? "Last turn: count uncrippled ships within 20 cm of the rift" : "Last turn"]] : [],
    tools: [{ k: "toggle", id: "stA", s: "a", only: ["adv"], l: "Fleet A has deployed a stabilizer" }, { k: "toggle", id: "stB", s: "b", only: ["adv"], l: "Fleet B has deployed a stabilizer" }, CLOCK],
    rtools: [...vpTools(), ...bonusTools("points of uncrippled ships within 20 cm of the rift", ["ac"]),
      ...objTools(["deployed a rift stabilizer", "destroyed a whole capital ship or escort squadron", "killed the enemy admiral, or it disengaged"]),
      cowTool(ADV_COW, ["adv"]), cowTool(TP_COW, ["ac"]), ...only(["ac"], secTools(SEC_A2)), Object.assign({ only: ["adv"] }, BP_ADV), Object.assign({ only: ["ac"] }, BP_TP)],
    end: ["After 8 turns, or when 2 hours are up (whole rounds only)."],
    win: v => v === "adv" ? advWin(["deploy one or more rift stabilizers", "destroy a whole capital ship or escort squadron", "kill the enemy admiral, or it disengages"])
      : ["Victory points as normal (RB p. 122), plus each uncrippled ship within 20 cm of the rift at the end scores its own points value.", TP_WIN, "The secondary objectives were scored on top for the tournament standings."],
    result(st, v) { return v === "adv" ? advResult(st, num(st, "vpA"), num(st, "vpB")) : tpResult(st, num(st, "vpA") + num(st, "bA"), num(st, "vpB") + num(st, "bB"), SEC_A2); },
    info: { bg: "A warp rift steady enough to use is a prize for any fleet — a way in and out of the system that the enemy cannot watch. Both fleets arrive to claim it, and neither can let the other keep it.", cr: [ADV_CREDIT + " The Road to Hell, p. 6.", AC(2007, "A2") + " Tournament Mission Pack p. 5.", TP_CREDIT] }
  },
  /* ------------------------------------------------------------ A3 THE INFLUENCE OF SPACE POWER */
  {
    id: "fan-t-space-power", grp: "fan-tour", name: "The Influence of Space Power", series: "AdeptiCon 2007 · scenario 3", trust: "fan",
    why: "Tournament mission with hidden stratagems: deploy everything, or hold a flanking force in reserve.", src: "Tournament Mission Pack p. 6", book: "O", suggest: null, others: OTHERS,
    sides: SIDES,
    pitch: "A decisive battle in the making. Each admiral picks a plan in secret: one overwhelming blow, a main line with a flanking force, or a screen that pins the enemy for the fleet to come.",
    glance: glance("tp", "Phenomena placed in turn", "After 8 turns"),
    bring: ["Celestial phenomena", "Paper to write down your stratagem", "Two or four reserve markers each"],
    forces: FORCES("tp"),
    draw: (v, W, H) => [{ z: "poly", pts: [[45, 0], [W, 0], [W, H - 45]], s: "a" }, { z: "poly", pts: [[0, 45], [0, H], [W - 45, H]], s: "b" },
      { z: "text", x: (45 + 2 * W) / 3, y: (H - 45) / 3, l: "Fleet A", s: "a" }, { z: "text", x: (W - 45) / 3, y: (45 + 2 * H) / 3, l: "Fleet B", s: "b" },
      { z: "dim", x1: 0, y1: 6, x2: 45, y2: 6, l: "45 cm" }, { z: "dim", x1: 6, y1: 0, x2: 6, y2: 45, l: "" }],
    fit: () => [120, 90],
    mapNote: "The zones are the two corner triangles, each cut off by a line that starts 45 cm from one corner — one along the long edge, one along the short edge. The attack-rating roll decides who takes which.",
    steps: [
      { t: "Roll off: the higher roll places the first celestial phenomenon; take turns until all are down." },
      { t: "Each player rolls a D6 for a secondary objective (tools below). Redemption of Honor and Vendetta pick their capital ship at random before deployment." },
      { t: "Each player chooses a stratagem in secret (tools below); reveal both together. 1 Stay in Formation: deploy the whole fleet. 2 Hold the Line: split the fleet into two elements, deploy the larger and hold the smaller in reserve. 3 Maintain Contact: deploy the smaller element and hold the larger in reserve." },
      { t: "Roll attack ratings (Before the battle): the higher roll chooses a deployment zone. The lower roll places a ship or squadron first; then take turns until both have placed everything not in reserve." },
      S_FIRST
    ],
    stools: [{ k: "secret", id: "stA", l: "Fleet A: stratagem", sub: "Choose in secret; show it when both have chosen.", opts: ["1 · Stay in Formation", "2 · Hold the Line", "3 · Maintain Contact"] },
      { k: "secret", id: "stB", l: "Fleet B: stratagem", sub: "Choose in secret; show it when both have chosen.", opts: ["1 · Stay in Formation", "2 · Hold the Line", "3 · Maintain Contact"] }, ...secRoll(SEC_A3)],
    notes: [TP_RULES, "The pack’s map is a sketch. We draw both zones the same size, as the two lines starting 45 cm from one corner suggest.", "Reserve markers go on any table edge outside the enemy deployment zone, except the third and fourth markers of Maintain Contact, which may go on any edge. The pack does not say who places markers first; take turns, starting with the player who goes first.", COWARD],
    refs: [...REF_VP],
    play: [
      { w: "Turn 2 · Hold the Line", t: "Place two reserve markers on any table edge outside the enemy deployment zone." },
      { w: "Turn 3", t: "Hold the Line: all reserves arrive. Maintain Contact: place four reserve markers — two outside the enemy deployment zone, the other two on any table edge." },
      { w: "Turn 4 · Maintain Contact", t: "All reserves arrive." },
      { w: "Arriving reserves", t: "They move onto the table within 15 cm of one of your markers and act normally that turn." },
      { w: "Victory points", t: "Every enemy ship destroyed — not crippled or disengaged — is worth double victory points." }
    ],
    turnMax: () => 8,
    fx: T => T === 2 ? [[null, "Hold the Line: place 2 reserve markers"]] : T === 3 ? [[null, "Hold the Line: reserves arrive"], [null, "Maintain Contact: place 4 reserve markers"]] : T === 4 ? [[null, "Maintain Contact: reserves arrive"]] : LAST8(T),
    tools: [],
    rtools: [...vpTools(), ...bonusTools("points of enemy ships destroyed (scored again)"), cowTool(TP_COW), ...secTools(SEC_A3), BP_TP],
    end: ["After 8 turns."],
    win: ["Victory points as normal, but every enemy ship destroyed counts double (RB p. 122).", TP_WIN, "The secondary objectives were scored on top for the tournament standings."],
    result(st) { return tpResult(st, num(st, "vpA") + num(st, "bA"), num(st, "vpB") + num(st, "bB"), SEC_A3); },
    info: { bg: "A clash meant for the history books, beside Gethsemane, Ultramar and St. Jowens. Both admirals bring a plan; which one wins depends on the choice the other made in secret.", cr: [AC(2007, "A3") + " Tournament Mission Pack p. 6.", TP_CREDIT] }
  },
  /* ------------------------------------------------------------ A4 BATTLE ON THE EDGE OF THE WARP */
  {
    id: "fan-t-edge-of-warp", grp: "fan-tour", name: "Battle on the Edge of the Warp", series: "AdeptiCon 2009 · mission 2", trust: "fan",
    why: "Tournament mission: warp eddies bounce one ship or squadron of each fleet across the table every turn.", src: "Tournament Mission Pack p. 7", book: "O", suggest: null, others: OTHERS,
    sides: SIDES,
    pitch: "The battle drifts so close to the warp that the warp joins in. Every turn, eddies fling a ship somewhere it never meant to go.",
    glance: glance("tp", "A warp rift in the centre; phenomena agreed", "Not given — 8 turns or 2 hours", "Not given — roll off"),
    bring: ["A warp rift", "Celestial phenomena", "A scatter dice"],
    forces: FORCES("tp"),
    draw: (v, W, H) => [...zones(W, H, 30), ...rift(W / 2, H / 2, "warp rift")],
    fit: () => [90, 80],
    mapNote: "Deployment zones run 30 cm deep along the long edges.",
    steps: [
      { t: "Place a warp rift in the centre and the other celestial phenomena: {a:terr}." },
      S_SEC,
      S_ACDEP(30),
      { t: "First turn: {a:first}." }
    ],
    stools: secRoll(SEC_A4),
    notes: [TP_RULES, "The mission gives no game length and no first-turn rule; the defaults come from the pack’s other missions and the rulebook.", "A bounced ship moves “as if it had navigated a warp rift” (RB p. 111), with two changes: it must go the full distance, and it stops at the table edge instead of leaving the table. It may face any way afterwards.", COWARD],
    refs: [["Warp rifts", "RB p. 111"], ...REF_VP],
    play: [
      { w: "Start of your turn: warp eddies", t: "Go through your ships and squadrons one at a time, rolling a D6 for each, until you roll a 5 or 6 or run out of fleet. The one that rolled it hits an eddy: move it D6 × 10 cm in a random direction (scatter dice), the full distance, stopping at the table edge, and face it any way you like. Then play your turn as normal. Ordnance does not roll." },
      { w: "Game length", t: "{a:len}." }
    ],
    turnMax: () => 8,
    fx: T => [[null, "Start of each player’s turn: roll for warp eddies"]].concat(LAST8(T)),
    tools: [{ k: "shiproll", id: "eddy", l: "Warp eddies", cl: "Ships and squadrons", n0: 6, roll: () => [d6(), d6()], btn: n => "Roll for " + n, il: i => "Ship or squadron " + (i + 1), sub: "Number your ships and squadrons in any order. First die: 5–6 hits an eddy. Second die: distance × 10 cm.", out: d => d[0] >= 5 ? "eddy — bounced " + 10 * d[1] + " cm" : "safe",
      foot: st => { const r = get(st, "eddy", null), i = r ? r.findIndex(d => d[0] >= 5) : -1; return r ? "<p class='calc' style='margin:6px 0 0'>" + (i < 0 ? "No eddy this turn." : "Only the first 5–6 counts: ship or squadron <b>" + (i + 1) + "</b> is bounced <b>" + 10 * r[i][1] + " cm</b>. The rest of the fleet is safe.") + "</p>" : ""; } }, CLOCK],
    rtools: [...vpTools(), cowTool(TP_COW), ...secTools(SEC_A4), BP_TP],
    end: ["{a:len}."],
    win: ["Victory points as normal, with nothing added (RB p. 122).", TP_WIN, "The secondary objectives were scored on top for the tournament standings."],
    result(st) { return tpResult(st, num(st, "vpA"), num(st, "vpB"), SEC_A4); },
    info: { bg: "Some battles are fought so close to the threshold of the warp that the warp itself takes a hand, tossing ships about at random. Winning there takes an admiral who can plan for chaos.", cr: [AC(2009, "A4") + " Tournament Mission Pack p. 7.", TP_CREDIT] }
  },
  /* ------------------------------------------------------------ A5 SCAVENGER HUNT */
  {
    id: "fan-t-scavenger", grp: "fan-tour", name: "Scavenger Hunt", series: "AdeptiCon 2009 · mission 3", trust: "fan",
    why: "Tournament mission: sixteen face-down salvage tokens, one of them the stolen plans worth 300 VP.", src: "Tournament Mission Pack p. 8", book: "O", suggest: null, others: OTHERS,
    sides: SIDES,
    pitch: "A lull in the war, and an old battlefield to strip. Somewhere among the debris drifts a cache of plans jettisoned from a dying ship — and the enemy is salvaging too.",
    glance: glance("tp", "Phenomena agreed; 16 salvage tokens", "Not given — 8 turns or 2 hours", "Not given — roll off"),
    bring: ["16 face-down tokens numbered 1–16 (8 each)", "Celestial phenomena"],
    forces: FORCES("tp"),
    draw: (v, W, H) => [...zones(W, H, 30), R(20, 20, W - 40, H - 40, "n", "", { dash: 1 }), { z: "text", x: W / 2, y: H / 2, l: "tokens: 20 cm apart,\n20 cm from every edge", s: "n" }],
    fit: () => [90, 80],
    mapNote: "Tokens go anywhere at least 20 cm from a table edge and 20 cm from each other — inside the deployment zones too.",
    steps: [
      { t: "Set up the celestial phenomena: {a:terr}." },
      S_SEC,
      { t: "Before deployment each player places 8 face-down tokens, at least 20 cm apart and 20 cm from every table edge. Number the 16 tokens 1–16." },
      S_ACDEP(30),
      { t: "Roll which token holds the plans (tool below) and announce it." },
      { t: "First turn: {a:first}." }
    ],
    stools: [{ k: "val", id: "plans", l: "The plans are in token…", opts: [], roll: () => dn(16) }, ...secRoll(SEC_A5)],
    notes: [TP_RULES, "In the tournament the organiser announced the plans token after deployment. At home, roll a D16 (tool) or draw a number in the open.", "The mission gives no game length and no first-turn rule; the defaults come from the pack’s other missions and the rulebook.", COWARD],
    refs: [["Boarding actions", "RB p. 89–90"], ...REF_VP],
    play: [
      { w: "Picking up", t: "A ship picks up a token by ending its move on it. A ship carrying tokens may not disengage on purpose." },
      { w: "Losing tokens", t: "A carrier that is destroyed drops its tokens where it was. A carrier that loses a boarding action against it hands all its tokens to the winner." },
      { w: "Game length", t: "{a:len}." }
    ],
    turnMax: () => 8,
    fx: LAST8,
    tools: [{ k: "counter", id: "kA", s: "a", res: 1, l: "Fleet A: tokens held (not the plans)" }, { k: "counter", id: "kB", s: "b", res: 1, l: "Fleet B: tokens held (not the plans)" }, CLOCK],
    rtools: [...vpTools(), { k: "pick", id: "pl", l: "Who holds the plans at the end?", rows: [["Fleet A", "+300 VP"], ["Fleet B", "+300 VP"], ["Nobody", ""]] }, cowTool(TP_COW), ...secTools(SEC_A5), BP_TP],
    end: ["{a:len}."],
    win: ["Victory points as normal (RB p. 122), plus 300 VP for holding the plans token and 50 VP for every other token held at the end.", TP_WIN, "The secondary objectives were scored on top for the tournament standings."],
    result(st) { const pl = get(st, "pl", -1); return tpResult(st, num(st, "vpA") + 50 * get(st, "kA", 0) + (pl === 0 ? 300 : 0), num(st, "vpB") + 50 * get(st, "kB", 0) + (pl === 1 ? 300 : 0), SEC_A5); },
    info: { bg: "During a brief lull, High Command sends a detachment back to a recent battle zone to salvage what it can — above all a cache of plans thrown out of a ship just before it died. The enemy has had the same idea.", cr: [AC(2009, "A5") + " Tournament Mission Pack p. 8.", TP_CREDIT] }
  },
  /* ------------------------------------------------------------ A6 + AS THE BLACK HOLE */
  {
    id: "fan-t-black-hole", grp: "fan-tour", name: "The Black Hole", series: "AdeptiCon 2010 · revised in Advanced Scenarios", trust: "fan",
    why: "Tournament mission at the edge of a black hole: every turn the pull grows and drags every ship toward one short edge.", src: "Advanced Scenarios p. 10 · Tournament Mission Pack p. 9", book: "O", suggest: null, others: OTHERS,
    sides: SIDES,
    variants: [["adv", "Advanced Scenarios"], ["ac", "AdeptiCon 2010"]],
    pitch: "The fleets meet at the rim of a black hole. Destroy as much of the enemy as you can — before the ever-stronger pull takes you too.",
    glance: v => glance(v, v === "adv" ? "A warp rift in the middle, 2 moons, 4 asteroid fields, 4 gas clouds" : "A warp rift in the centre; phenomena agreed"),
    bring: v => ["A warp rift", "Celestial phenomena" + (v === "adv" ? ": 2 moons, 4 asteroid fields, 4 gas clouds" : ""), "Plenty of D6s"],
    forces: FORCES,
    draw: (v, W, H) => [...zones(W, H, 30), ...rift(W / 2, H / 2, "warp rift"), { z: "edge", e: "l", s: "c", l: "black hole: a short edge, rolled" },
      { z: "arrow", x1: W / 2 - 20, y1: H / 2 - 9, x2: W / 2 - 46, y2: H / 2 - 9, s: "c" }, { z: "text", x: W / 2 - 33, y: H / 2 - 2, l: "pull", s: "c" }],
    fit: () => [100, 80],
    mapNote: "The black hole is a short edge, rolled after deployment; the map shows it on the left. Every ship is pulled straight toward it.",
    steps: [
      { only: ["adv"], t: "Place a warp rift in the middle, then 2 moons, 4 asteroid fields and 4 gas clouds: {a:terr}." },
      { only: ["ac"], t: "Place a warp rift in the centre and the other celestial phenomena: {a:terr}." },
      { only: ["ac"], ...S_SEC },
      { only: ["adv"], ...S_ADVDEP(30) },
      { only: ["ac"], ...S_ACDEP(30) },
      { t: "After deployment, roll which short edge is the black hole (tool below)." },
      S_FIRST
    ],
    stools: [{ k: "roll", id: "bh", l: "Which short edge is the black hole?", rows: () => [[1, 3, "The left short edge (seen from Fleet B)"], [4, 6, "The right short edge (seen from Fleet B)"]] }, ...only(["ac"], secRoll(SEC_A6))],
    notes: v => v === "adv" ? [ADV_RULES, ADMIRAL, "The booklet gives the phenomena but not how to place them. " + LAYOUT, "Pulled ships move before anything else in the turn. Blast markers do not slow them, and the effects of whatever they touch are applied together once every ship has moved."]
      : [TP_RULES, "In the tournament the organiser named the black hole edge at the start of the round; at home, roll for it (tool).", "The pull is rolled at the start of the first player’s turn, one D6 for every full turn played including this one — the same pull as the revised version.", COWARD],
    refs: [["Warp rifts", "RB p. 111"], ["Blast markers", "RB p. 68"], ["Disengaging", "RB p. 56"], ...REF_VP],
    play: [
      { only: ["adv"], w: "Start of each game turn: gravity pull", t: "Roll as many D6 as the turn number. Every ship is pulled that many cm straight toward the black hole edge. Blast markers do not slow it; apply whatever it touches once all ships have moved. A ship coming out of a warp rift unharmed counts as pulled the whole distance." },
      { only: ["ac"], w: "Start of the first player’s turn: gravity pull", t: "Roll one D6 for every full turn played, this one included. Every ship is pulled that many cm toward the black hole edge." },
      { w: "Point of no return", t: "A ship that reaches the black hole edge, for any reason, is destroyed. Ships may disengage only off the other edges." },
      { only: ["ac"], w: "Victory points", t: "A ship lost to the black hole gives the enemy only half its cost in victory points." },
      ...P_TIME2
    ],
    turnMax: () => 8,
    fx: T => [[null, "Gravity pull: " + T + "D6 cm toward the black hole"]].concat(LAST8(T)),
    tools: [{ k: "shiproll", id: "pull", l: "Gravity pull this turn", cl: "Dice (the turn)", n0: st => st.turn, btn: n => "Roll " + n + "D6", il: i => "Die " + (i + 1), sub: "One D6 per turn played, this turn included.", out: d => d + " cm", foot: st => { const r = get(st, "pull", null); return r ? "<p class='calc' style='margin:6px 0 0'>Every ship is pulled <b>" + r.reduce((a, b) => a + b, 0) + " cm</b> toward the black hole.</p>" : ""; } }, CLOCK],
    rtools: [...vpTools(), ...bonusTools("cost of enemy ships lost to the black hole", ["ac"], v => "+" + Math.floor(v / 2) + " VP (half)"),
      ...objTools(["lost no ship to the black hole", "has a capital ship or escort in the enemy deployment zone at the end", "won one or more boarding actions against enemy ships"]),
      cowTool(ADV_COW, ["adv"]), cowTool(TP_COW, ["ac"]), ...only(["ac"], secTools(SEC_A6)), Object.assign({ only: ["adv"] }, BP_ADV), Object.assign({ only: ["ac"] }, BP_TP)],
    end: ["After 8 turns, or when 2 hours are up (whole rounds only)."],
    win: v => v === "adv" ? advWin(["lose no ship to the black hole", "have a capital ship or escort in the enemy deployment zone at the end", "win one or more boarding actions against enemy ships"])
      : ["Victory points as normal (RB p. 122), but a ship sucked into the black hole gives the enemy only half its cost.", TP_WIN, "The secondary objectives were scored on top for the tournament standings."],
    result(st, v) { return v === "adv" ? advResult(st, num(st, "vpA"), num(st, "vpB")) : tpResult(st, num(st, "vpA") + Math.floor(num(st, "bA") / 2), num(st, "vpB") + Math.floor(num(st, "bB") / 2), SEC_A6); },
    info: { bg: "The enemy is met in the most dangerous place imaginable: the edge of a black hole’s gravity well, where the wreckage of a long-dead star system falls silently toward the event horizon. The longer the fleets stay, the harder it pulls.", cr: [ADV_CREDIT + " The Black Hole, p. 10.", AC(2010, "A6") + " Tournament Mission Pack p. 9.", TP_CREDIT] }
  },
  /* ------------------------------------------------------------ B1 SINK THE BISMARK */
  {
    id: "fan-t-bismark", grp: "fan-tour", name: "Sink the Bismark", series: "AdeptiCon 2010 · mission 2", trust: "fan",
    why: "Tournament mission: each fleet’s most expensive capital ship is a famous name worth double — and it may not run.", src: "Tournament Mission Pack p. 10", book: "O", suggest: null, others: OTHERS,
    sides: SIDES,
    pitch: "Every war has its famous ship, the one High Command wants dead at any price. Today both fleets brought theirs.",
    glance: glance("tp", "A warp rift in the centre; phenomena agreed"),
    bring: ["A warp rift", "Celestial phenomena", "A marker for each Bismark"],
    forces: FORCES("tp"),
    draw: (v, W, H) => [...zones(W, H, 30), ...rift(W / 2, H / 2, "warp rift")],
    fit: () => [90, 80],
    mapNote: "Deployment zones run 30 cm deep along the long edges.",
    steps: [
      { t: "Place a warp rift in the centre and the other celestial phenomena: {a:terr}." },
      S_SEC,
      { t: "Name your Bismark: your most expensive capital ship, a character aboard included. It must be a cruiser or battleship, not a defence — a space hulk cannot be the Bismark." },
      { t: "Roll attack ratings (Before the battle): the higher roll chooses whether to deploy first or second. Each player’s first ship down is the Bismark, on its own, never in a squadron. Then take turns, within 30 cm of your long edge." },
      S_FIRST
    ],
    stools: secRoll(SEC_B1),
    notes: [TP_RULES, "The Bismark cannot be the target of any secondary objective.", COWARD],
    refs: [["Disengaging", "RB p. 56"], ...REF_VP],
    play: [
      { w: "The Bismark", t: "It may not disengage on purpose. If it leaves the table any other way, it counts as destroyed. Destroyed by the enemy, it is worth double victory points." },
      P_TIME("tp")
    ],
    turnMax: () => 8,
    fx: LAST8,
    tools: [CLOCK],
    rtools: [...vpTools(), ...bonusTools("VP for the enemy Bismark, if you destroyed it (scored again)"), cowTool(TP_COW), ...secTools(SEC_B1), BP_TP],
    end: ["After 8 turns, or when 2 hours are up (whole turns only)."],
    win: ["Victory points as normal (RB p. 122), but a Bismark destroyed by the enemy is worth double.", TP_WIN, "The secondary objectives were scored on top for the tournament standings."],
    result(st) { return tpResult(st, num(st, "vpA") + num(st, "bA"), num(st, "vpB") + num(st, "bB"), SEC_B1); },
    info: { bg: "There is always one enemy ship whose name everyone knows, and when a fleet finds it, the captains go for it whatever the cost. Both admirals have just found theirs.", cr: [AC(2010, "B1") + " Tournament Mission Pack p. 10. The name recalls the 1941 hunt for the German battleship.", TP_CREDIT] }
  },
  /* ------------------------------------------------------------ B3 + AS AN UNEXPECTED ENCOUNTER */
  {
    id: "fan-t-unexpected", grp: "fan-tour", name: "An Unexpected Encounter", series: "AdeptiCon 2011 · revised in Advanced Scenarios", trust: "fan",
    why: "Tournament mission: both fleets arrive in three detachments on random squares of the table, and the battle grows as they drop in.", src: "Advanced Scenarios p. 7 · Tournament Mission Pack p. 12", book: "O", suggest: null, others: OTHERS,
    sides: SIDES,
    variants: [["adv", "Advanced Scenarios"], ["ac", "AdeptiCon 2011"]],
    pitch: "Your fleet was spread out on patrol when one detachment ran into the enemy’s spearhead. Distress calls are out, and both sides’ ships are dropping out of the warp wherever they can.",
    glance: v => glance(v, v === "adv" ? "4 asteroid fields, 4 gas clouds, a small planet with a moon, a warp rift" : "Phenomena agreed; six 2′ × 2′ squares"),
    bring: v => ["Celestial phenomena" + (v === "adv" ? ": 4 asteroid fields, 4 gas clouds, a small planet with a moon, a warp rift" : ""), "Something to mark six squares", "A D3 and a D6"],
    forces: v => { const f = FORCES(v), x = "Split the fleet into three detachments, each with at least one ship or squadron."; return { a: f.a.concat(x), b: f.b.concat(x) }; },
    draw: (v, W, H) => {
      const w = W / 3, h = H / 2, out = [];
      for (let r = 0; r < 2; r++) for (let c = 0; c < 3; c++) out.push(R(c * w, r * h, w, h, v === "adv" ? (r ? "b" : "a") : "n", v === "adv" ? (r ? "Fleet B" : "Fleet A") + " " + (c + 1) : String(r * 3 + c + 1), { dash: 1 }));
      return out;
    },
    fit: () => [90, 76],
    mapNote: v => v === "adv" ? "Six equal squares: the top row belongs to Fleet A, the bottom row to Fleet B, each numbered 1–3 for a D3. On a 6′ × 4′ table they are 2′ × 2′." : "Six 2′ × 2′ squares (61 cm), numbered 1–6 for a D6.",
    steps: [
      { t: "Set up the celestial phenomena: {a:terr}." },
      { only: ["ac"], ...S_SEC },
      { t: "Divide the table into six equal squares (map), and split each fleet into three detachments." },
      { only: ["adv"], t: "First Contact: both players roll a D6 and add their attack rating; the winner decides who deploys first — call that player Fleet A. Fleet A picks one of its detachments at random and rolls a D3 for one of its squares, then Fleet B does the same." },
      { only: ["ac"], t: "Each player deploys one detachment, chosen at random, in a square rolled at random (D6). If the second player rolls the first player’s square, roll again." },
      { only: ["adv"], t: "Mandeville Point: every ship of a detachment is placed touching just one of its square’s outer table edges, pointing straight at the opposite edge of the table." },
      S_FIRST
    ],
    stools: [{ k: "rand", id: "det", l: "Pick a detachment at random" }, { k: "val", id: "tile", l: "Roll a square (D3 or D6)", opts: [], roll: () => dn(6) }, ...only(["ac"], secRoll(SEC_B3))],
    notes: v => v === "adv" ? [ADV_RULES, ADMIRAL, "Squares in the corners have two outer edges, the middle ones one: choose which edge the detachment touches. " + LAYOUT, "A square counts as a Foothold for a player when only that player’s ships are in it, bases fully inside."]
      : [TP_RULES, "Reinforcements come in “off the board edge of a randomly selected board section”. The middle squares have one table edge, the corner squares two — choose one.", COWARD],
    refs: [...REF_VP],
    play: [
      { only: ["adv"], w: "Turns 2 and 3: reinforcements", t: "At the start of your turn, pick one of your detachments not yet in play at random and roll a D3 for one of your squares. Place it by the Mandeville Point rule." },
      { only: ["ac"], w: "Your second turn", t: "At the start of the turn, one of your two waiting detachments, chosen at random, comes on from the table edge of a random square." },
      { only: ["ac"], w: "Your third turn", t: "At the start of the turn, your last detachment joins the battle the same way." },
      { only: ["adv"], w: "Footholds", t: "A square holding only your ships, bases fully inside, is your Foothold. One or more at the end of the game is worth +4 battle points." },
      { only: ["adv"], w: "First Blood", t: "Agreed meaning: {a:fb}." },
      ...P_TIME2
    ],
    turnMax: () => 8,
    fx: (T, st, v) => T === 2 ? [[null, v === "adv" ? "Start of each player turn: a detachment arrives" : "Start of your turn: a random detachment arrives"]] : T === 3 ? [[null, "Start of your turn: your last detachment arrives"]] : LAST8(T),
    tools: [{ k: "rand", id: "det2", l: "Pick a waiting detachment at random" }, { k: "val", id: "tile2", l: "Roll the square it arrives in (D3 or D6)", opts: [], roll: () => dn(6) }, CLOCK],
    rtools: [...vpTools(), ...objTools(["has one or more Footholds at the end", "admiral alive, its ship not disengaged", "drew First Blood"]), cowTool(ADV_COW, ["adv"]), cowTool(TP_COW, ["ac"]), ...only(["ac"], secTools(SEC_B3)), Object.assign({ only: ["adv"] }, BP_ADV), Object.assign({ only: ["ac"] }, BP_TP)],
    end: ["After 8 turns, or when 2 hours are up (whole rounds only)."],
    win: v => v === "adv" ? advWin(["have one or more Footholds at the end", "have your admiral alive, its ship not disengaged", "draw First Blood"])
      : ["Victory points as normal (RB p. 122).", TP_WIN, "The secondary objectives were scored on top for the tournament standings."],
    result(st, v) { return v === "adv" ? advResult(st, num(st, "vpA"), num(st, "vpB")) : tpResult(st, num(st, "vpA"), num(st, "vpB"), SEC_B3); },
    info: { bg: "To cover more of the sector, the admiral split the fleet into detachments — and one of them has just stumbled on the enemy. Reinforcements pour in from the warp as the battle grows.", cr: [ADV_CREDIT + " An Unexpected Encounter, p. 7 (listed in the community’s BFG Scenario Listing as “An Unexpected Adventure”).", AC(2011, "B3") + " Tournament Mission Pack p. 12.", TP_CREDIT] }
  },
  /* ------------------------------------------------------------ B4 BATTLE IN THE DERELICT BASE */
  {
    id: "fan-t-derelict-base", grp: "fan-tour", name: "Battle in the Derelict Base", series: "AdeptiCon 2011 · mission 2", trust: "fan",
    why: "Tournament mission: two automated defence satellites wake up mid-battle and shoot at everyone.", src: "Tournament Mission Pack p. 13", book: "O", suggest: null, others: OTHERS,
    sides: SIDES,
    pitch: "The fleets clash in an abandoned naval base full of dead installations. Two defence satellites drift between them — and one of them has just locked on.",
    glance: glance("tp", "Phenomena agreed; two defence satellites"),
    bring: ["Two Kroot Warspheres or other models as defence satellites (FL p. 494)", "Celestial phenomena"],
    forces: FORCES("tp"),
    draw: (v, W, H) => [...zones(W, H, 30), { z: "line", x1: 0, y1: H / 2, x2: W, y2: H / 2 }, { z: "mark", x: W / 3, y: H / 2, s: "c", l: "satellite" }, { z: "mark", x: 2 * W / 3, y: H / 2, s: "c", l: "satellite" }],
    fit: () => [90, 80],
    mapNote: "The satellites start a third and two thirds of the way along the long centre line.",
    steps: [
      { t: "Set up the celestial phenomena: {a:terr}." },
      { t: "Place the two defence satellites on the long centre line, a third and two thirds of the way along it." },
      S_SEC,
      S_ACDEP(30),
      S_FIRST
    ],
    stools: secRoll(SEC_B4),
    notes: [TP_RULES, "The satellites use the Kroot Warsphere profile, which the mission calls “from the Armada book”; it is now in the Fleets book (FL p. 494). They cannot be boarded.", "The mission does not say who moves and rolls for the satellites. Suggestion: the player who did not take the first turn moves them, straight toward the nearest ship or squadron, and the other player rolls their shooting.", COWARD],
    refs: [["Kroot Warsphere", "FL p. 494–495"], ["The end phase", "RB p. 88"], ...REF_VP],
    play: [
      { w: "End phase of the second player’s first turn, and every end phase after", t: "Each satellite moves 10 cm toward the nearest ship or squadron, whichever side it belongs to, and fires at it. Satellites ignore attack craft and torpedoes." },
      { w: "Before the satellites have fired", t: "They cannot be damaged. Torpedoes launched earlier fly through them as if they were not there; attack craft launched earlier cannot attack them until they fire. Once they have fired, any attack craft may attack them." },
      { w: "Destroying a satellite", t: "It is worth 200 victory points to whoever destroys it. Satellites cannot be boarded." },
      P_TIME("tp")
    ],
    turnMax: () => 8,
    fx: T => T === 1 ? [[null, "Second player’s end phase: the satellites wake, move 10 cm and fire"]] : [[null, "Every end phase: the satellites move 10 cm and fire"]].concat(LAST8(T)),
    tools: [{ k: "counter", id: "sdA", s: "a", res: 1, max: 2, l: "Satellites destroyed by Fleet A" }, { k: "counter", id: "sdB", s: "b", res: 1, max: 2, l: "Satellites destroyed by Fleet B" }, CLOCK],
    rtools: [...vpTools(), cowTool(TP_COW), ...secTools(SEC_B4), BP_TP],
    end: ["After 8 turns, or when 2 hours are up (whole turns only)."],
    win: ["Victory points as normal (RB p. 122), plus 200 VP for each defence satellite you destroy.", TP_WIN, "The secondary objectives were scored on top for the tournament standings."],
    result(st) { return tpResult(st, num(st, "vpA") + 200 * get(st, "sdA", 0), num(st, "vpB") + 200 * get(st, "sdB", 0), SEC_B4); },
    info: { bg: "The latest clash takes place in an abandoned fleet base, littered with dead installations. Some defence satellites look intact, and some seem to drift about — until a target-lock warning sounds on every bridge.", cr: [AC(2011, "B4") + " Tournament Mission Pack p. 13.", TP_CREDIT] }
  },
  /* ------------------------------------------------------------ B5 + AS CAPTURE THE STATION */
  {
    id: "fan-t-station", grp: "fan-tour", name: "Capture the Station", series: "AdeptiCon 2013 · revised in Advanced Scenarios", trust: "fan",
    why: "Tournament mission around an armed archaeotech station that can only be taken by boarding. The 2013 original adds a pirate flotilla.", src: "Advanced Scenarios p. 9 · Tournament Mission Pack p. 14", book: "O", suggest: null, others: OTHERS,
    sides: SIDES,
    variants: [["adv", "Advanced Scenarios"], ["ac", "AdeptiCon 2013: Capture the Research Platform"]],
    pitch: v => v === "adv" ? "An ancient research station wakes as you arrive, its batteries swinging toward every ship that comes near. Your boarding parties are ready to strip its data-cores — and so are the enemy’s." : "An ancient research platform must be captured intact. Its automated guns, a pirate flotilla and the enemy fleet all stand in the way.",
    glance: v => glance(v, v === "adv" ? "Station in the middle; 4 asteroid fields, 4 gas clouds, a warp rift, a medium planet with a moon" : "Platform in the middle; 3 asteroid fields, 3 gas clouds, a warp rift, a moon or a medium planet"),
    bring: v => v === "adv" ? ["A model for the research station", "4 asteroid fields, 4 gas clouds, a warp rift, a medium planet with a moon"] : ["A model for the research platform", "Four squadrons of three frigates for the pirates (the players’ transports in the tournament)", "3 asteroid fields, 3 gas clouds, a warp rift, a moon or a medium planet"],
    forces: FORCES,
    draw: (v, W, H) => v === "adv" ? [...zones(W, H, 20), { z: "circ", cx: W / 2, cy: H / 2, r: 15, s: "c", l: "" }, { z: "mark", x: W / 2, y: H / 2, s: "c" }, { z: "ring", cx: W / 2, cy: H / 2, r: 30, s: "n" },
        { z: "text", x: W / 2, y: H / 2 - 21, l: "no terrain within 15 cm", s: "c" }, { z: "text", x: W / 2 + 46, y: H / 2, l: "guns:\n30 cm", s: "n" }]
      : [...zones(W, H, 20), { z: "mark", x: W / 2, y: H / 2, s: "c" }, { z: "mark", x: W / 2 - 15, y: H / 2, s: "n" }, { z: "mark", x: W / 2 + 15, y: H / 2, s: "n" }, { z: "mark", x: W / 2, y: H / 2 - 15, s: "n" }, { z: "mark", x: W / 2, y: H / 2 + 15, s: "n" },
        { z: "ring", cx: W / 2, cy: H / 2, r: 30, s: "n" }, { z: "text", x: W / 2 + 50, y: H / 2, l: "pirates stay\nwithin 30 cm", s: "n" }, { z: "text", x: W / 2 - 48, y: H / 2, l: "platform and\n4 pirate\nsquadrons", s: "c" }],
    fit: () => [120, 80],
    mapNote: v => v === "adv" ? "Deployment zones run 20 cm deep along the long edges. The station sits in the middle, with no terrain within 15 cm of it." : "Deployment zones run 20 cm deep along the long edges. The pirate squadrons start 15 cm from the platform in a plus: two on the long centre line, two on the short one.",
    steps: [
      { only: ["adv"], t: "Place the station in the middle of the table. Then 4 asteroid fields, 4 gas clouds, a warp rift and a medium planet with a moon, none within 15 cm of the station: {a:terr}." },
      { only: ["ac"], t: "Place the platform in the middle, then 3 asteroid fields, 3 gas clouds, a warp rift and a moon or a medium planet: {a:terr}." },
      { only: ["ac"], t: "Place the four pirate squadrons of three frigates 15 cm from the platform, in a plus: two on the long centre line, two on the short centre line." },
      { only: ["adv"], ...S_ADVDEP(20) },
      { only: ["ac"], ...S_DEP20 },
      S_FIRST
    ],
    stools: [],
    notes: v => v === "adv" ? [ADV_RULES, ADMIRAL, "The booklet gives the phenomena but not how to place them. " + LAYOUT, "Data-cores, with the booklet’s example: a battleship inflicts 3 points of boarding damage on the station and a cruiser 2, in the same end phase. That is 5 points: two data-cores, and the fifth point is lost."]
      : [TP_RULES, "The pirates use Sword class frigate profiles (FL p. 82), with the players’ transports as models. The mission does not say who moves them; suggestion: the player who did not take the first turn moves them toward the nearest squadron and rolls their shots.", "The platform fires the broadsides of a Lunar class cruiser (FL p. 71): 30 cm, 2 lances and 6 weapons battery firepower on each side.", COWARD],
    refs: v => [["Boarding actions", "RB p. 89–90"], ...(v === "ac" ? [["Sword class frigate", "FL p. 82"], ["Lunar class cruiser", "FL p. 71"]] : []), ...REF_VP],
    play: STATION_PLAY,
    turnMax: () => 8,
    fx: (T, st, v) => [[null, v === "adv" ? "End of the game turn: the station fires" : "End of the game turn: the platform and pirates act"]].concat(LAST8(T)),
    tools: [{ k: "html", only: ["adv"], html: "<h3>Research station</h3><table class='ltab'><tr><td>Weapons battery</td><td>30 cm · firepower 10 · all round</td></tr><tr><td>Lance battery</td><td>30 cm · strength 4 · all round</td></tr></table><p class='small muted' style='margin:6px 0 0'>For boarding: 2 hits, 3 turrets. It cannot be targeted.</p>" },
      { k: "counter", id: "dcA", s: "a", res: 1, only: ["adv"], l: "Fleet A: data-cores retrieved (50 VP each)" }, { k: "counter", id: "dcB", s: "b", res: 1, only: ["adv"], l: "Fleet B: data-cores retrieved (50 VP each)" },
      { k: "counter", id: "hA", s: "a", only: ["ac"], max: 8, l: "Fleet A: boarding damage on the platform (8 captures)" }, { k: "counter", id: "hB", s: "b", only: ["ac"], max: 8, l: "Fleet B: boarding damage on the platform (8 captures)" },
      { k: "counter", id: "pA", s: "a", res: 1, only: ["ac"], l: "Pirate frigates destroyed by Fleet A" }, { k: "counter", id: "pB", s: "b", res: 1, only: ["ac"], l: "Pirate frigates destroyed by Fleet B" }, CLOCK],
    rtools: [...vpTools(), { k: "pick", id: "cap", only: ["ac"], l: "Who captured the platform?", rows: [["Fleet A", "+400 VP"], ["Fleet B", "+400 VP"], ["Nobody", ""]] },
      ...objTools(["destroyed an enemy ship in base contact with the station", "killed the enemy admiral, or it disengaged", "retrieved at least one data-core"]),
      cowTool(ADV_COW, ["adv"]), cowTool(TP_COW, ["ac"]), Object.assign({ only: ["adv"] }, BP_ADV), Object.assign({ only: ["ac"] }, BP_TP)],
    end: ["After 8 turns, or when 2 hours are up (whole rounds only)."],
    win: v => v === "adv" ? advWin(["destroy an enemy ship in base contact with the station", "kill the enemy admiral, or it disengages", "retrieve at least one data-core"], "50 VP for each data-core")
      : ["Victory points as normal (RB p. 122), plus 400 VP for capturing the platform.", "Secondary: pirate frigates destroyed — more than the enemy 5 points, the same 3, fewer 1.", TP_WIN],
    result(st, v) {
      if (v === "adv") return advResult(st, num(st, "vpA") + 50 * get(st, "dcA", 0), num(st, "vpB") + 50 * get(st, "dcB", 0));
      const c = get(st, "cap", -1), pa = get(st, "pA", 0), pb = get(st, "pB", 0);
      return tpResult(st, num(st, "vpA") + (c === 0 ? 400 : 0), num(st, "vpB") + (c === 1 ? 400 : 0), null, " Pirate frigates: A " + pa + ", B " + pb + " — secondary " + (pa > pb ? "A 5, B 1" : pa < pb ? "A 1, B 5" : "3 each") + ".");
    },
    info: { bg: "An archaeotech research station has been found, and the orders are to take its secrets intact. As the fleets arrive, rows of ancient automated batteries come to life to defend their forgotten masters’ work once more.", cr: [ADV_CREDIT + " Capture the Station, p. 9.", AC(2013, "B5") + " As Capture the Research Platform, Tournament Mission Pack p. 14.", TP_CREDIT] }
  },
  /* ------------------------------------------------------------ B6 RETRIEVE THE SALVAGE */
  {
    id: "fan-t-retrieve-salvage", grp: "fan-tour", name: "Retrieve the Salvage", series: "AdeptiCon 2013 · mission 2", trust: "fan",
    why: "Tournament mission decided by salvage, not kills: ten hidden markers, and transports carry three times as much.", src: "Tournament Mission Pack p. 15", book: "O", suggest: null, others: OTHERS,
    sides: SIDES,
    pitch: "A graveyard of ancient hulks drifts in front of you. Any ship can strip a little before scuttling one, but the transports have the tools to take it all.",
    glance: glance("tp", "A moon or medium planet in the centre; 3 asteroid fields, 3 gas clouds, a warp rift; 10 salvage markers"),
    bring: ["10 face-down salvage markers", "Transports for each fleet", "3 asteroid fields, 3 gas clouds, a warp rift, a moon or medium planet"],
    forces: v => { const f = FORCES("tp"), x = "Transports, as agreed below (Agree before you start). They may form squadrons of any size, as escorts."; return { a: f.a.concat(x), b: f.b.concat(x) }; },
    draw: (v, W, H) => { const y1 = H / 2 - 15, y2 = H / 2 + 15, xs = [1, 2, 3, 4, 5].map(k => W * k / 6); return [...zones(W, H, 20), { z: "planet", cx: W / 2, cy: H / 2, r: 8 },
      { z: "line", x1: 0, y1: y1, x2: W, y2: y1 }, { z: "line", x1: 0, y1: y2, x2: W, y2: y2 }, ...xs.map(x => ({ z: "mark", x, y: y1, s: "n" })), ...xs.map(x => ({ z: "mark", x, y: y2, s: "n" })),
      { z: "text", x: W / 2, y: y1 - 11, l: "salvage markers (agreed lines)", s: "n" }]; },
    fit: () => [100, 80],
    mapNote: "Deployment zones run 20 cm deep along the long edges. The ten markers lie in two lines parallel to the long edges; the map shows the default agreed below.",
    steps: [
      { t: "Place a moon or a medium planet in the centre, then 3 asteroid fields, 3 gas clouds and a warp rift: {a:terr}." },
      { t: "Mix the ten salvage markers face down — values {a:vals} — and lay them out: {a:lines}." },
      { t: "Deployment order: {a:dep}. Deploy within 20 cm of your long edge; transports in squadrons of any size." },
      S_FIRST
    ],
    stools: [],
    notes: [TP_RULES, "The mission says the markers are worth 0, 1 or 2 but not how many of each, how many transports a fleet brings or where the lines go. These shape the result, so agree them first (Agree before you start).", "A marker counts for the kind of ship that picked it up. The mission does not say what happens to markers on a ship that is destroyed; suggestion: they are lost with it."],
    refs: [["Transport (Imperial profile; other fleets have their own)", "FL p. 85"], ...REF_VP],
    play: [
      { w: "Picking up salvage", t: "A ship picks up a marker by stopping on it; turn it over. It is worth its value × 3 if a transport picked it up, × 2 for a cruiser or battleship, × 1 for an escort." },
      P_TIME("tp")
    ],
    turnMax: () => 8,
    fx: LAST8,
    tools: [...["A", "B"].map(k => [["t", "transports", 3], ["c", "cruisers and battleships", 2], ["e", "escorts", 1]].map(([x, l, m]) => ({ k: "counter", id: x + k, s: k === "A" ? "a" : "b", res: 1, l: "Fleet " + k + ": marker value lifted by " + l + " (× " + m + ")" }))).reduce((a, b) => a.concat(b), []),
      { k: "info", res: 1, html: st => "<h3>Salvage</h3><p class='calc' style='margin:0'>Fleet A <b>" + (3 * get(st, "tA", 0) + 2 * get(st, "cA", 0) + get(st, "eA", 0)) + "</b> · Fleet B <b>" + (3 * get(st, "tB", 0) + 2 * get(st, "cB", 0) + get(st, "eB", 0)) + "</b></p>" }, CLOCK],
    rtools: [...vpTools()],
    end: ["After 8 turns, or when 2 hours are up (whole turns only)."],
    win: ["Primary: more salvage than the enemy wins — marker values × 3 for transports, × 2 for cruisers and battleships, × 1 for escorts.", "Secondary: standard victory points (RB p. 122). A margin under 150 VP is a draw; the winner scores 7 points, a draw 4, the loser 1."],
    result(st) {
      const a = 3 * get(st, "tA", 0) + 2 * get(st, "cA", 0) + get(st, "eA", 0), b = 3 * get(st, "tB", 0) + 2 * get(st, "cB", 0) + get(st, "eB", 0), va = num(st, "vpA"), vb = num(st, "vpB");
      const sec = va || vb ? " Secondary: " + (Math.abs(va - vb) < 150 ? "a draw, 4 points each" : (va > vb ? "Fleet A" : "Fleet B") + " 7 points, the other 1") + " (A " + va + " – B " + vb + " VP)." : "";
      if (!a && !b) return [null, "Count the salvage", "Record what each fleet lifted on the Play tab." + sec];
      if (a === b) return ["draw", "Level on salvage", "Both fleets " + a + "." + sec];
      return [a > b ? "a" : "b", "Fleet " + (a > b ? "A" : "B") + " wins on salvage", "Salvage A " + a + " – B " + b + "." + sec];
    },
    info: { bg: "A vast graveyard of ancient hulks offers a fortune in salvage to whoever gets there first. Every ship can strip something before scuttling a wreck, but only the transport flotilla can carry off a whole ship’s worth in time.", cr: [AC(2013, "B6") + " Tournament Mission Pack p. 15.", TP_CREDIT] }
  },
  /* ------------------------------------------------------------ C1 PROTECT THE SALVAGE */
  {
    id: "fan-t-protect-salvage", grp: "fan-tour", name: "Protect the Salvage", series: "AdeptiCon 2013 · mission 3", trust: "fan",
    why: "Tournament mission in a warp arena: no ship may disengage, the flagship is worth double, and your transports must survive.", src: "Tournament Mission Pack p. 16", book: "O", suggest: null, others: OTHERS,
    sides: SIDES,
    pitch: "You loaded the salvage onto your flagship and jumped for home — straight into a laughing voice in the warp. Only one fleet leaves this arena.",
    glance: glance("tp", "A moon or medium planet in the centre; 3 asteroid fields, 3 gas clouds, a warp rift"),
    bring: ["Transports for each fleet", "3 asteroid fields, 3 gas clouds, a warp rift, a moon or medium planet"],
    forces: v => { const f = FORCES("tp"), x = "A flotilla of transports, as agreed below (Agree before you start)."; return { a: f.a.concat(x), b: f.b.concat(x) }; },
    draw: (v, W, H) => [...zones(W, H, 20), { z: "planet", cx: W / 2, cy: H / 2, r: 8 }, { z: "edge", e: "l", s: "n", l: "no disengaging" }, { z: "edge", e: "r", s: "n", l: "no disengaging" }],
    fit: () => [90, 80],
    mapNote: "Deployment zones run 20 cm deep along the long edges. No table edge can be used to disengage.",
    steps: [
      { t: "Place a moon or a medium planet in the centre, then 3 asteroid fields, 3 gas clouds and a warp rift: {a:terr}." },
      S_DEP20,
      S_FIRST
    ],
    stools: [],
    notes: [TP_RULES, "The mission does not say how many transports each fleet has, or what they cost; the default is our suggestion.", "Necrons may disengage by the standard rules instead of their own, except the flagship."],
    refs: [["Disengaging", "RB p. 56"], ["Burn Retros", "RB p. 54"], ["Critical hits", "RB p. 66–67"], ...REF_VP],
    play: [
      { w: "The Chaos Gods want death", t: "No ship may disengage. Necrons alone may, by the standard disengagement rules — never their flagship." },
      { w: "Forced off the table", t: "If a ship’s compulsory move before it may turn would carry it off the table, it passes Burn Retros automatically and turns to run along the edge, the way it was heading. Head-on to the edge: D6 1–3 to port, 4–6 to starboard. A turn beyond its normal limit costs a Thrusters Damaged critical, but no hull point." },
      P_TIME("tp")
    ],
    turnMax: () => 8,
    fx: LAST8,
    tools: [{ k: "roll", id: "turn", l: "Head-on to the edge: which way?", rows: () => [[1, 3, "Turn to port"], [4, 6, "Turn to starboard"]] },
      { k: "counter", id: "trA", s: "a", res: 1, start: 4, l: "Fleet A: transports still alive" }, { k: "counter", id: "trB", s: "b", res: 1, start: 4, l: "Fleet B: transports still alive" }, CLOCK],
    rtools: [...vpTools(), ...bonusTools("VP for the enemy flagship (scored again)")],
    end: ["After 8 turns, or when 2 hours are up (whole turns only)."],
    win: ["Primary: victory points as normal (RB p. 122), but each flagship is worth double.", "Secondary: transports still alive — more than the enemy 5 points, the same 3, fewer 1.", TP_WIN],
    result(st) { const a = get(st, "trA", 4), b = get(st, "trB", 4); return tpResult(st, num(st, "vpA") + num(st, "bA"), num(st, "vpB") + num(st, "bB"), null, " Transports alive: A " + a + ", B " + b + " — secondary " + (a > b ? "A 5, B 1" : a < b ? "A 1, B 5" : "3 each") + "."); },
    info: { bg: "After the fight over the hulks, the battered fleets transfer their salvage to the flagships and jump for home. In the warp a voice laughs from everywhere at once: only one of them will be allowed to leave its new arena, and the gods want blood.", cr: [AC(2013, "C1") + " Tournament Mission Pack p. 16.", TP_CREDIT] }
  },
  /* ------------------------------------------------------------ C2 + AS BRACE FOR IMPACT */
  {
    id: "fan-t-brace", grp: "fan-tour", name: "Brace for Impact", series: "AdeptiCon 2014 · revised in Advanced Scenarios", trust: "fan",
    why: "Tournament mission: an exploded moon sends waves of hurtling asteroids across the battle from one short edge.", src: "Advanced Scenarios p. 8 · Tournament Mission Pack p. 17", book: "O", suggest: null, others: OTHERS,
    sides: SIDES,
    variants: [["adv", "Advanced Scenarios"], ["ac", "AdeptiCon 2014"]],
    pitch: "Mid-battle a moon splits apart, and hive-sized debris comes tumbling across the system. Secure bulkheads, evacuate the outer decks — and brace for impact.",
    glance: v => glance(v, v === "adv" ? "6 asteroid fields, 3 gas clouds; hurtling asteroids" : "5 asteroid fields, 4 gas clouds, a small planetoid, a large gas planet; hurtling asteroids"),
    bring: ["Small asteroid markers for the hurtling asteroids", "11 entrance markers numbered 2–12", "Celestial phenomena", "A scatter dice"],
    forces: FORCES,
    draw: (v, W, H) => [...zones(W, H, 20), ...[2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((n, i) => ({ z: "text", x: v === "adv" ? W - (i % 2 ? 15 : 3) : (i % 2 ? 15 : 3), y: H * (i + 1) / 12, l: String(n), s: "c" })),
      v === "adv" ? { z: "arrow", x1: W - 28, y1: H / 2, x2: W - 56, y2: H / 2, s: "c" } : { z: "arrow", x1: 28, y1: H / 2, x2: 56, y2: H / 2, s: "c" },
      { z: "text", x: v === "adv" ? W - 50 : 50, y: H / 2 + 9, l: "30 cm/turn", s: "c" }, { z: "edge", e: v === "adv" ? "r" : "l", s: "c", l: v === "adv" ? "entrance points (a short edge, rolled)" : "entrance points" }],
    fit: () => [90, 76],
    mapNote: v => v === "adv" ? "Entrance points 2–12 are spread evenly along a short edge picked at random after deployment; the map shows the right one." : "Entrance points 2–12 are spread along the left short edge.",
    steps: [
      { only: ["adv"], t: "Set up 6 asteroid fields and 3 gas clouds: {a:terr}." },
      { only: ["ac"], t: "Set up 5 asteroid fields, 4 gas clouds, a small planetoid and a large gas planet: {a:terr}." },
      { only: ["adv"], ...S_ADVDEP(20) },
      { only: ["ac"], ...S_DEP20 },
      { only: ["adv"], t: "After deployment, pick a short edge at random (tool below) and spread 11 entrance points numbered 2–12 evenly along it." },
      { only: ["ac"], t: "Spread 11 entrance points numbered 2–12 along the left short edge." },
      S_FIRST
    ],
    stools: [{ k: "roll", id: "edge", only: ["adv"], l: "Which short edge do the asteroids come from?", rows: () => [[1, 3, "The left short edge (seen from Fleet B)"], [4, 6, "The right short edge (seen from Fleet B)"]] }],
    notes: v => v === "adv" ? [ADV_RULES, ADMIRAL, "The booklet gives the phenomena but not how to place them. " + LAYOUT, "A hurtling asteroid counts as an asteroid field for every purpose (RB p. 110): a ship it passes through, or that it hits, tests Leadership on 2D6 or takes D6 damage, shields working normally; escorts re-roll."]
      : [TP_RULES, "The Auxiliary Fleet is not explained in the pack — AdeptiCon’s 2014–2016 events used one. The default is our suggestion.", "Hurtling asteroids hit like asteroid fields: test Leadership on 2D6 or take D6 hits; escorts may re-roll a failed test (RB p. 110)."],
    refs: [["Asteroid fields", "RB p. 110"], ["Gas and dust clouds", "RB p. 109"], ...REF_VP],
    play: [
      { only: ["adv"], w: "Start of each game turn: next wave", t: "Make D3 new hurtling asteroids and roll 2D6 for each one’s entrance point; place them on the table edge in line with it (tools below)." },
      { only: ["adv"], w: "Incoming", t: "Then move every hurtling asteroid 30 cm straight toward the opposite short edge. They pass through gas clouds and asteroid fields and can strike ships along the way." },
      { only: ["adv"], w: "One goes in…", t: "When a hurtling asteroid passes through an asteroid field, make 3 more, each 4D6 cm from the field’s centre in a random direction. These can strike ships on that one move, do not set off more of their own and skip the next Incoming move." },
      { only: ["ac"], w: "Start of each game turn", t: "D3 hurtling asteroids arrive from the left short edge; the players take turns rolling 2D6 for each entrance point. All hurtling asteroids move 30 cm." },
      { only: ["ac"], w: "Hits", t: "A ship hit: Leadership test on 2D6, failed = D6 hits; escorts may re-roll a failed test. Ordnance hit is removed on a 6. An asteroid that hits a planet leaves a blast marker there and is removed. They pass through gas clouds." },
      { only: ["ac"], w: "Through an asteroid field", t: "D3 new asteroids appear where it came out; roll a scatter dice for each one’s heading." },
      { only: ["ac"], w: "Secondary objectives", t: "Auxiliary Fleet: {a:aux}. First Blood: {a:fb}." },
      ...P_TIME2
    ],
    turnMax: () => 8,
    fx: T => [[null, "Start of the turn: D3 hurtling asteroids, then all move 30 cm"]].concat(LAST8(T)),
    tools: [{ k: "val", id: "wave", l: "Next wave: how many hurtling asteroids?", opts: [1, 2, 3], roll: () => dn(3) },
      { k: "shiproll", id: "ent", l: "Entrance points", cl: "Asteroids", n0: st => get(st, "wave", 0) || 1, roll: () => [d6(), d6()], btn: n => "Roll 2D6 × " + n, il: i => "Asteroid " + (i + 1), out: d => "entrance point " + (d[0] + d[1]) },
      { k: "shiproll", id: "goes", only: ["adv"], l: "One goes in…: three debris", cl: "Debris", n0: 3, roll: () => [d6(), d6(), d6(), d6()], btn: () => "Roll 4D6 × 3", il: i => "Debris " + (i + 1), out: d => d.reduce((a, b) => a + b, 0) + " cm from the field’s centre, random direction" }, CLOCK],
    rtools: [...vpTools(), ...objTools(["took no hull damage from hurtling asteroids", "admiral alive, its ship not disengaged", "has a ship or squadron in the enemy deployment zone at the end"]),
      ...only(["ac"], ptsTools([["Auxiliary Fleet survived", 1], ["Auxiliary Fleet drew First Blood", 1]])), cowTool(ADV_COW, ["adv"]), cowTool(TP_COW, ["ac"]), Object.assign({ only: ["adv"] }, BP_ADV), Object.assign({ only: ["ac"] }, BP_TP)],
    end: ["After 8 turns, or when 2 hours are up (whole rounds only)."],
    win: v => v === "adv" ? advWin(["take no hull damage from a hurtling asteroid with any ship", "have your admiral alive, its ship not disengaged", "have a ship or squadron in the enemy deployment zone at the end"])
      : ["Primary: victory points as normal (RB p. 122).", "Secondary: 1 point if your Auxiliary Fleet survives, 1 point if it drew First Blood.", TP_WIN],
    result(st, v) { return v === "adv" ? advResult(st, num(st, "vpA"), num(st, "vpB")) : tpResult(st, num(st, "vpA"), num(st, "vpB"), null, ptsTail(st, [["", 1], ["", 1]])); },
    info: { bg: "While the fleets trade broadsides over an uncharted system, a Mechanicus vessel bursts from a supposedly deserted moon and flees. Moments later the moon splits apart in a plasma eruption, flinging city-sized rubble across the battle.", cr: [ADV_CREDIT + " Brace for Impact, p. 8.", AC(2014, "C2") + " Tournament Mission Pack p. 17.", TP_CREDIT] }
  },
  /* ------------------------------------------------------------ C3 + AS WRECKS O'PLENTY */
  {
    id: "fan-t-wrecks", grp: "fan-tour", name: "Wrecks O’Plenty", series: "AdeptiCon 2014 · revised in Advanced Scenarios", trust: "fan",
    why: "Tournament mission: seven wrecks circle a ringed planet, each worth salvaging — if its unstable drive core does not blow first.", src: "Advanced Scenarios p. 11 · Tournament Mission Pack p. 18", book: "O", suggest: null, others: OTHERS,
    sides: SIDES,
    variants: [["adv", "Advanced Scenarios"], ["ac", "AdeptiCon 2014"]],
    pitch: "Long-range scans show wrecks of unknown age circling a giant ringed planet, their cogitators still warm — and an enemy fleet dropping out of the warp to take them.",
    glance: v => glance(v, v === "adv" ? "A medium ringed planet in the middle with 7 wrecks; 3 asteroid fields, 3 gas clouds, a warp rift, a small planet" : "A large ringed gas giant in the middle with 7 wrecks; 5 asteroid fields, 4 gas clouds, a small planetoid"),
    bring: ["7 numbered wreck tokens or models", "A ringed planet", "Celestial phenomena"],
    forces: FORCES,
    draw: (v, W, H) => { const pr = v === "adv" ? 10 : 15, wr = pr + 10, out = [...zones(W, H, 20), { z: "planet", cx: W / 2, cy: H / 2, r: pr }, { z: "ring", cx: W / 2, cy: H / 2, r: pr + 4, sw: 3, gas: 1 }];
      for (let k = 0; k < 7; k++) { const a = 2 * Math.PI * k / 7; out.push({ z: "mark", x: W / 2 + wr * Math.cos(a), y: H / 2 + wr * Math.sin(a), s: "n", free: 1 }); }
      const tl = "7 wrecks,\n10 cm from\nthe planet"; out.push({ z: "text", x: Math.min(W - textLen(tl, W) / 2 - 2, W / 2 + wr + 40), y: H / 2, l: tl, s: "n" }); return out; },
    fit: v => v === "adv" ? [100, 90] : [110, 100],
    mapNote: v => "Seven wrecks evenly spaced in a circle, 10 cm from the planet’s edge" + (v === "adv" ? ": one on the centre line, three in each half." : "."),
    steps: [
      { only: ["adv"], t: "Place a medium ringed planet in the middle, and 7 wreck tokens evenly spaced 10 cm from its edge (map): one on the centre line, three in each half. Then 3 asteroid fields, 3 gas clouds, a warp rift and a small planet: {a:terr}." },
      { only: ["ac"], t: "Place a large ringed gas giant in the middle and 7 numbered wrecks evenly spaced in a circle, 10 cm from its edge. Then 5 asteroid fields, 4 gas clouds and a small planetoid: {a:terr}." },
      { only: ["adv"], ...S_ADVDEP(20) },
      { only: ["ac"], ...S_DEP20 },
      S_FIRST
    ],
    stools: [],
    notes: v => v === "adv" ? [ADV_RULES, ADMIRAL, "The booklet gives the phenomena but not how to place them. " + LAYOUT]
      : [TP_RULES, "The deployment text also mentions 11 entrance markers on the left edge — a leftover from Brace for Impact; this mission has no hurtling asteroids.", "The Auxiliary Fleet is not explained in the pack; the default is our suggestion."],
    refs: v => [["Boarding actions", "RB p. 89–90"], ...(v === "ac" ? [["Catastrophic damage", "RB p. 71"], ["Blazing and drifting hulks", "RB p. 71"]] : [["Lances", "RB p. 60"]]), ...REF_VP],
    play: [
      { only: ["adv"], w: "Wrecks", t: "They cannot be targeted or affected by weapons or ordnance. At the end of each player turn, remove any blast markers touching them." },
      { only: ["adv"], w: "Salvaging", t: "At the end of its move, a ship touching a wreck may declare a boarding action against it; an escort squadron counts as one multi-ship boarding action even if not every ship touches. All salvage attempts in a player turn must target the same wreck." },
      { only: ["adv"], w: "Open Sesame", t: "Roll a D6 for each boarding action, all at once. 1: the drive core overloads and every ship within 3D6 cm takes three lance shots. 2+: salvaged — remove the token, +75 VP (once per wreck)." },
      { only: ["ac"], w: "Salvaging", t: "Move into base contact with a wreck and declare a salvage attempt: roll a D6. 2–6: salvaged — note it, take its numbered token, leave the wreck in place. 1: its power system overloads — roll 2D6 on the Catastrophic Damage table and treat the wreck as that result." },
      { only: ["ac"], w: "Wrecks", t: "Each is worth 200 VP. Until claimed or destroyed they count as drifting hulks for shooting and ordnance, and claimed wrecks can still be damaged. A wreck that blows up is removed and can no longer be claimed; its plasma can hit nearby wrecks." },
      { only: ["ac"], w: "Secondary objectives", t: "Auxiliary Fleet: {a:aux}." },
      ...P_TIME2
    ],
    turnMax: () => 8,
    fx: LAST8,
    tools: [{ k: "roll", id: "ses", only: ["adv"], l: "Open Sesame", sub: "D6 for each boarding action", rows: () => [[1, 1, "Drive core overload: every ship within 3D6 cm takes three lance shots"], [2, 6, "Salvaged: remove the token, +75 VP"]] },
      { k: "roll", id: "core", only: ["ac"], l: "Salvage attempt", sub: "D6", rows: () => [[1, 1, "Overload: roll 2D6 on the Catastrophic Damage table (RB p. 71) and treat the wreck as that result"], [2, 6, "Salvaged: take its numbered token (200 VP)"]] },
      { k: "counter", id: "wA", s: "a", res: 1, max: 7, l: "Fleet A: wrecks salvaged" }, { k: "counter", id: "wB", s: "b", res: 1, max: 7, l: "Fleet B: wrecks salvaged" }, CLOCK],
    rtools: [...vpTools(), ...objTools(["salvaged one of the three wrecks in the enemy half", "killed the enemy admiral, or it disengaged", "won a boarding action against an enemy ship"]),
      ...only(["ac"], ptsTools([["Auxiliary Fleet claimed a wreck", 1]])), cowTool(ADV_COW, ["adv"]), cowTool(TP_COW, ["ac"]), Object.assign({ only: ["adv"] }, BP_ADV), Object.assign({ only: ["ac"] }, BP_TP)],
    end: ["After 8 turns, or when 2 hours are up (whole rounds only)."],
    win: v => v === "adv" ? advWin(["salvage one of the three wrecks fully within the enemy half", "kill the enemy admiral, or it disengages", "win a boarding action against an enemy ship"], "75 VP for each wreck salvaged")
      : ["Primary: victory points as normal (RB p. 122), plus 200 VP for each wreck salvaged.", "Secondary: 1 point per wreck (at most 3), and 1 point if your Auxiliary Fleet claimed one.", TP_WIN],
    result(st, v) {
      const a = get(st, "wA", 0), b = get(st, "wB", 0);
      if (v === "adv") return advResult(st, num(st, "vpA") + 75 * a, num(st, "vpB") + 75 * b);
      return tpResult(st, num(st, "vpA") + 200 * a, num(st, "vpB") + 200 * b, null, ptsTail(st, [["", 1]], Math.min(3, a), Math.min(3, b)));
    },
    info: { bg: "A large field of wrecks circles a giant ringed planet. Nobody can tell how old they are or who built them, but their drive cores still show power — and an enemy fleet has come for them too.", cr: [ADV_CREDIT + " Wrecks O’Plenty, p. 11.", AC(2014, "C3") + " Tournament Mission Pack p. 18.", TP_CREDIT] }
  },
  /* ------------------------------------------------------------ C4 NEUTRON STAR */
  {
    id: "fan-t-neutron", grp: "fan-tour", name: "Neutron Star", series: "AdeptiCon 2014 · mission 3", trust: "fan",
    why: "Tournament mission around a neutron star that drags ships and ordnance toward it, with a mysterious wreck falling in.", src: "Tournament Mission Pack p. 19", book: "O", suggest: null, others: OTHERS,
    sides: SIDES,
    pitch: "An emergency drop from the warp lands both fleets beside an uncharted neutron star. A faint signal still comes from an ancient wreck sliding toward it.",
    glance: glance("tp", "A neutron star in the centre; a large ringed gas giant, 5 asteroid fields, 4 gas clouds, a small planetoid"),
    bring: ["A model or base for the neutron star", "A wreck", "A large ringed gas giant, 5 asteroid fields, 4 gas clouds, a small planetoid"],
    forces: FORCES("tp"),
    draw: (v, W, H) => [...zones(W, H, 20), { z: "circ", cx: W / 2, cy: H / 2, r: 3, s: "c", l: "", nr: 1 }, { z: "text", x: W / 2, y: H / 2 + 10, l: "neutron star", s: "c" },
      { z: "mark", x: W / 2 + 36, y: H / 2, s: "n", l: "wreck" }, { z: "dim", x1: W / 2, y1: H / 2 - 12, x2: W / 2 + 36, y2: H / 2 - 12, l: "36" }],
    fit: () => [110, 80],
    mapNote: "The wreck starts 36 cm from the neutron star along the long centre line; which side: {a:side}.",
    steps: [
      { t: "Place the neutron star in the centre and the wreck 36 cm from it along the long centre line ({a:side}). Then a large ringed gas giant, 5 asteroid fields, 4 gas clouds and a small planetoid: {a:terr}." },
      S_DEP20,
      S_FIRST
    ],
    stools: [],
    notes: [TP_RULES, "The deployment text also mentions 11 entrance markers on the left edge — a leftover from Brace for Impact.", "The pack does not give the neutron star’s size; the default is our suggestion. The Auxiliary Fleet is not explained either."],
    refs: [["Catastrophic damage", "RB p. 71"], ["Blazing and drifting hulks", "RB p. 71"], ["Special orders", "RB p. 46"], ...REF_VP],
    play: [
      { w: "Start of every player turn: the pull", t: "After special orders, before normal movement, every battleship moves 1D6 cm, every cruiser 2D6, every escort, defence and ordnance marker or attack craft wave 3D6, straight toward the neutron star without changing heading. All Ahead Full adds 1D6, Burn Retros takes off 1D6 (apply the order first). Then move normally." },
      { w: "Touching the star", t: "It blocks line of sight. Anything touching its base is destroyed: ordnance is removed, ships explode as a 12 on the Catastrophic Damage table. An escort exploding this way attacks every ship in range with one die; a defence explodes for half its hits in lance attacks." },
      { w: "Every game turn: the mysterious wreck", t: "Before any other movement it falls 2D6 cm toward the star; reaching it, it explodes as a 12 on the Catastrophic Damage table and is lost." },
      { w: "Recovering the wreck (450 VP)", t: "Touch its base and declare an attempt: D6 2–6 recovers it (leave it in place); a 1 overloads it — roll 2D6 on the Catastrophic Damage table and treat it as that result. It counts as a drifting hulk for shooting until claimed or destroyed." },
      { w: "Secondary objectives", t: "Auxiliary Fleet: {a:aux}. First Blood: {a:fb}." },
      P_TIME("tp")
    ],
    turnMax: () => 8,
    fx: T => [[null, "Start of the game turn: the wreck falls 2D6 cm"], [null, "Every player turn: the star pulls (1D6 / 2D6 / 3D6)"]].concat(LAST8(T)),
    tools: [{ k: "html", html: "<h3>The pull</h3><table class='ltab'><tr><td>Battleship</td><td>1D6 cm</td></tr><tr><td>Cruiser</td><td>2D6 cm</td></tr><tr><td>Escort, defence</td><td>3D6 cm</td></tr><tr><td>Ordnance, attack craft wave</td><td>3D6 cm</td></tr><tr><td>All Ahead Full</td><td>+1D6</td></tr><tr><td>Burn Retros</td><td>−1D6</td></tr></table>" },
      { k: "val", id: "fall", l: "The wreck falls (2D6 cm)", opts: [], roll: () => d6() + d6(), unit: " cm" },
      { k: "roll", id: "rec", l: "Recovery attempt", sub: "D6", rows: () => [[1, 1, "Overload: 2D6 on the Catastrophic Damage table (RB p. 71)"], [2, 6, "Recovered: 450 VP"]] }, CLOCK],
    rtools: [...vpTools(), { k: "pick", id: "wr", l: "Who recovered the wreck?", rows: [["Fleet A", "+450 VP"], ["Fleet B", "+450 VP"], ["Nobody", ""]] }, ...ptsTools([["drew First Blood", 1], ["Auxiliary Fleet claimed the wreck", 3]]), cowTool(TP_COW), BP_TP],
    end: ["After 8 turns, or when 2 hours are up (whole turns only)."],
    win: ["Primary: victory points as normal (RB p. 122), plus 450 VP for recovering the wreck.", "Secondary: 1 point for First Blood, 3 points if your Auxiliary Fleet claims the wreck.", TP_WIN],
    result(st) { const w = get(st, "wr", -1); return tpResult(st, num(st, "vpA") + (w === 0 ? 450 : 0), num(st, "vpB") + (w === 1 ? 450 : 0), null, ptsTail(st, [["", 1], ["", 3]])); },
    info: { bg: "A long patrol drops unexpectedly out of the warp beside an uncharted gravitational sinkhole: a neutron star. The sensors also find the enemy — and a faint signal from a huge wreck of unknown design, falling toward the star.", cr: [AC(2014, "C4") + " Tournament Mission Pack p. 19.", TP_CREDIT] }
  },
  /* ------------------------------------------------------------ C5 SHEPARD MOON */
  {
    id: "fan-t-shepard", grp: "fan-tour", name: "Shepard Moon", series: "AdeptiCon 2015 · mission 2", trust: "fan",
    why: "Tournament mission: board a strange moon between two crossing rings and find out what it is — fighters, a Tyranid nest, or a Kroot Warsphere.", src: "Tournament Mission Pack p. 20", book: "O", suggest: null, others: OTHERS,
    sides: SIDES,
    pitch: "A giant’s rings cross the battlefield, and the shepherd moon that keeps them in line shows unstable power readings. Whoever boards it first finds out what is inside.",
    glance: glance("tp", "Two crossing rings, a shepherd moon; 5 asteroid fields, 4 gas clouds, a small planetoid"),
    bring: ["A small planetoid for the moon", "Bands of ring material", "5 asteroid fields, 4 gas clouds", "A Kroot Warsphere, Eldar fighter and bomber markers, Tyranid boarding torpedoes"],
    forces: FORCES("tp"),
    draw: (v, W, H) => [...zones(W, H, 20), R(0, H / 2 - 5, W, 10, "n", ""), R(W / 2 - 5, 0, 10, H, "n", ""), { z: "planet", cx: W / 2, cy: H / 2, r: 4, l: "shepherd moon" },
      { z: "text", x: W / 4, y: H / 2 - 10, l: "ring", s: "n" }, { z: "text", x: W / 2 + 14, y: H / 4 + 4, l: "ring", s: "n" }],
    fit: () => [90, 80],
    mapNote: "The map shows the default agreed below: rings along both centre lines, the moon where they cross.",
    steps: [
      { t: "Lay two large rings across the table at right angles, crossing in the middle: {a:rings}. Place the shepherd moon: {a:moon}." },
      { t: "Then 5 asteroid fields, 4 gas clouds and a small planetoid: {a:terr}." },
      S_DEP20,
      S_FIRST
    ],
    stools: [],
    notes: [TP_RULES, "The pack does not say what the rings are, where the moon is, or how hard the moon is to board. Boarding it decides 345 VP, so agree that first; the default borrows the 2013 research platform (TMP p. 14).", "The Kroot Warsphere is in the Fleets book (FL p. 494). Fighters and bombers from the moon count as Eldar attack craft.", "The Auxiliary Fleet is not explained in the pack; the default is our suggestion."],
    refs: [["Moons", "RB p. 113"], ["Boarding actions", "RB p. 89–90"], ["Kroot Warsphere", "FL p. 494–495"], ["Boarding torpedoes", "RB p. 78"], ...REF_VP],
    play: [
      { w: "The shepherd moon", t: "A small planetoid in every respect. To take control, declare a boarding action against it ({a:board}) and win it; then roll on the moon table (tools below)." },
      { w: "No take-backs", t: "Once the moon has been boarded and rolled for, nobody else can take it. Controlling it is worth 345 VP." },
      { w: "Secondary objectives", t: "Auxiliary Fleet: {a:aux}." },
      P_TIME("tp")
    ],
    turnMax: () => 8,
    fx: LAST8,
    tools: [{ k: "roll", id: "moon", l: "What is the moon?", sub: "D6 after a successful boarding action", rows: () => [[1, 1, "Tyranid infestation: D6 Tyranid boarding torpedoes leave the moon for the nearest ship. The moon stays a moon"], [2, 3, "Robotic fighters: D6 fighter markers (as Eldar fighters) for the player who controls the moon"], [4, 5, "Robotic bombers: D6 bombers (as Eldar bombers) for the player who controls the moon"], [6, 6, "That’s no moon!: it powers up as a basic Kroot Warsphere under the boarding player’s control"]] }, CLOCK],
    rtools: [...vpTools(), { k: "pick", id: "ctl", l: "Who controls the moon?", rows: [["Fleet A", "+345 VP"], ["Fleet B", "+345 VP"], ["Nobody", ""]] }, ...ptsTools([["controlled the moon first", 1], ["its Auxiliary Fleet controls the moon", 1]]), cowTool(TP_COW), BP_TP],
    end: ["After 8 turns, or when 2 hours are up (whole turns only)."],
    win: ["Primary: victory points as normal (RB p. 122), plus 345 VP for controlling the moon.", "Secondary: 1 point for controlling the moon first, 1 point if your Auxiliary Fleet controls it.", TP_WIN],
    result(st) { const c = get(st, "ctl", -1); return tpResult(st, num(st, "vpA") + (c === 0 ? 345 : 0), num(st, "vpB") + (c === 1 ? 345 : 0), null, ptsTail(st, [["", 1], ["", 1]])); },
    info: { bg: "A gas giant is growing great rings, and the shepherd moon that herds them shows unstable power readings. The enemy fleet is close. Investigate it — or make sure nobody else does.", cr: [AC(2015, "C5") + " Tournament Mission Pack p. 20. A shepherd moon is a small moon that keeps a planet’s ring in shape.", TP_CREDIT] }
  },
  /* ------------------------------------------------------------ C6 HIDE N' SEEK */
  {
    id: "fan-t-hide", grp: "fan-tour", name: "Hide N’ Seek", series: "AdeptiCon 2016 · mission 2", trust: "fan",
    why: "Tournament mission: an anomaly in the centre drains the Leadership of every ship that can see it.", src: "Tournament Mission Pack p. 21", book: "O", suggest: null, others: OTHERS,
    sides: SIDES,
    pitch: "Something in the asteroid field is unravelling sensors, crews and confidence alike. Fight from behind the rocks — or stare into it.",
    glance: glance("tp", "An anomaly in the centre; 5 asteroid fields, 4 gas clouds, a small planetoid"),
    bring: ["A marker for the anomaly", "5 asteroid fields, 4 gas clouds, a small planetoid"],
    forces: FORCES("tp"),
    draw: (v, W, H) => [...zones(W, H, 20), { z: "mark", x: W / 2, y: H / 2, s: "c" }, { z: "ring", cx: W / 2, cy: H / 2, r: 10, s: "c" }, { z: "ring", cx: W / 2, cy: H / 2, r: 30, s: "c" },
      { z: "text", x: W / 2, y: H / 2 - 15, l: "10 cm: −3", s: "c" }, { z: "text", x: W / 2, y: H / 2 - 35, l: "30 cm: −2", s: "c" }, { z: "text", x: W / 2 + 42, y: H / 2, l: "−1 Ld\nbeyond", s: "c" }],
    fit: () => [100, 80],
    mapNote: "Leadership penalty for a ship that can see the anomaly: within 10 cm −3, within 30 cm −2, further away −1.",
    steps: [
      { t: "Place the anomaly in the centre, then 5 asteroid fields, 4 gas clouds and a small planetoid: {a:terr}." },
      S_DEP20,
      S_FIRST
    ],
    stools: [],
    notes: [TP_RULES, "The pack does not say whose ships check, or how long the penalty lasts; the defaults are our suggestion. The Auxiliary Fleet is not explained either."],
    refs: [["Leadership", "RB p. 45"], ["Asteroid fields", "RB p. 110"], ...REF_VP],
    play: [
      { w: "End of each movement phase, before shooting", t: "Check line of sight from each ship ({a:who}) to the centre of the anomaly. If it can see it, its Leadership drops ({a:last}): within 10 cm −3, within 30 cm −2, further away −1." },
      { w: "Cover", t: "Asteroid fields block the view. An escort squadron measures from its ship nearest the anomaly and goes with the majority of its ships for cover." },
      { w: "Secondary objectives", t: "Auxiliary Fleet: {a:aux}. First Blood: {a:fb}. Command ship: note whether it ever loses Leadership." },
      P_TIME("tp")
    ],
    turnMax: () => 8,
    fx: T => [[null, "After each movement phase: anomaly Leadership check"]].concat(LAST8(T)),
    tools: [{ k: "html", html: "<h3>Anomaly</h3><table class='ltab'><tr><td>Within 10 cm</td><td>−3 Ld</td></tr><tr><td>Within 30 cm</td><td>−2 Ld</td></tr><tr><td>Over 30 cm</td><td>−1 Ld</td></tr></table><p class='small muted' style='margin:6px 0 0'>Only if the ship can see the anomaly’s centre; asteroid fields block it.</p>" }, CLOCK],
    rtools: [...vpTools(), ...ptsTools([["Auxiliary Fleet survived", 1], ["Auxiliary Fleet drew First Blood", 1], ["command ship never lost Leadership", 1]]), cowTool(TP_COW), BP_TP],
    end: ["After 8 turns, or when 2 hours are up (whole turns only)."],
    win: ["Primary: victory points as normal (RB p. 122).", "Secondary: 1 point each if your Auxiliary Fleet survives, if it drew First Blood, and if your command ship never lost any Leadership.", TP_WIN],
    result(st) { return tpResult(st, num(st, "vpA"), num(st, "vpB"), null, ptsTail(st, [["", 1], ["", 1], ["", 1]])); },
    info: { bg: "Near the edge of a system, deep in a dense asteroid field, something is affecting everything and everyone, and sooner or later it will reach breaking point. The enemy is out there waiting — take the fight to them.", cr: [AC(2016, "C6") + " Tournament Mission Pack p. 21.", TP_CREDIT] }
  }
  ]);
})();
