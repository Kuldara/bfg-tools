/* Classic scenarios from Battlefleet Gothic Magazine 12–14 (Fanatic Press):
   The Battle of Numitor, The Battle of the Cold Passage, They Come Only to Murder,
   and the Cerberus War mini-campaign (Into the Nebula, Warp Space, Hold the Line,
   Apotheosis). Ahriman's Arrival (BFG Magazine 6) is the campaign's prologue.
   Written for the original 1999 rules; Remastered places are given in the notes.
   Summarised in our own words; every scenario is hand-made (see LUEMINUT.md). */
(function () {
  const BM = n => "Battlefleet Gothic Magazine " + n + " (Fanatic Press)";
  const OLD = "Written for the original 1999 rules. ";
  const CERB = "James Parry and friends — “The Cerberus War”, a four-scenario mini-campaign in " + BM(13) + " (part I) and " + BM(14) + " (part II).";
  const link = (id, text) => "<a href='#/s/" + id + "/setup'>" + esc(text) + " ›</a>";
  const cerbLd = n => ({ t: "Campaign (if you are not using the full campaign rules): after picking your fleet you may re-roll the Leadership of " + n + " of your ships — one re-roll each, and the new roll stands." });
  const vp2 = (st, a, b, an, bn) => {
    const A = num(st, a), B = num(st, b);
    if (!A && !B) return [null, "Count victory points", "Enter both totals below."];
    return A === B ? ["draw", "Level", A + " – " + B + " VP."] : [A > B ? "a" : "b", wins(A > B ? an : bn), an + " " + A + " – " + bn + " " + B + " VP."];
  };
  const AHRIMAN = [
    { w: "Ahriman", s: "b", t: "Ld 10 on the fleet’s most expensive ship. His fleet may re-roll one command check or Leadership test each turn, and he uses Abaddon’s “You have failed me for the last time” (FL p. 231)." },
    { w: "Blessing of Tzeentch · Ward of Chaos", s: "b", t: "Enemy ships firing at his ship shift one column right on the gunnery table. Enemy ships within 15 cm of his ship count as having a blast marker on their base." },
    { w: "Daemonic Horde, once per game", s: "b", t: "Pick any one enemy ship — any range, no line of sight needed. Roll a D6, then that many dice to hit against its lowest armour. Shields count; check criticals as normal; no Lock On re-rolls." }
  ];

  /* Hold the Line: random attacking fleets, D6 + turn number (BFG Magazine 14 p. 25) */
  const SLEEPERS = [[2, 3, "1 Dirge squadron"], [4, 5, "1 escort squadron (D6 escorts)"], [6, 7, "1 Shroud, or 2 escort squadrons"], [8, 9, "3 escort squadrons"], [10, 11, "1 Shroud, or 1 Scythe"], [12, 12, "1 Scythe"], [13, 14, "2 Scythes"], [15, 15, "1 Tombship"], [16, 99, "1 Tombship with Sepulchre (once only; later ones have none)"]];
  const TIMELOST = [[2, 4, "1 attack craft wing (4 markers)"], [5, 6, "1 escort squadron (D6 escorts)"], [7, 9, "2 escort squadrons"], [10, 10, "3 escort squadrons, or 1 cruiser"], [11, 11, "1 cruiser"], [12, 13, "2 cruisers, or 1 heavy cruiser"], [14, 14, "1 grand cruiser, or 1 heavy cruiser"], [15, 99, "1 battleship — roll a D6: on 6 Warmaster Umbros is aboard (once only)"]];

  addScenarios([
  /* ------------------------------------------------------------ THE BATTLE OF NUMITOR */
  {
    id: "cl-numitor", grp: "cl-mag", name: "The Battle of Numitor", series: "Gothic War · BFG Magazine 12", trust: "classic",
    why: "A historical refight in which five fleet groups arrive one after another from all sides. Nothing starts on the table.", src: "BFG Magazine 12 p. 14–17", book: "O", suggest: ["Imperial Navy", "Chaos"],
    others: "Play the historical fleets, or agree a points total and split your fleets into the same arriving groups. Any two fleets work.",
    sides: { a: { n: "Imperial Navy", f: "Imperial Navy" }, b: { n: "Chaos", f: "Chaos" } },
    pitch: "Admiral Sankara feeds Warmaster Bale’s spies a false training exercise — and drops out of the warp behind him at Numitor, just as Baruch’s cruisers are about to be overwhelmed.",
    glance: [["Points", "Historical fleets, or agreed"], ["Table", "Not given — use your table"], ["Battlezone", "Outer reaches: only Namub and its orbital dock"], ["First turn", "Chaos"], ["Game ends", "One side has nothing left on the table"]],
    bring: ["A small planet (Namub) and an orbital dock", "A Desecrator battleship (or a stand-in) and a Vengeance grand cruiser"],
    forces: {
      a: ["Cruiser Group Baruch (Imperial turn 2): Fleet-Admiral Baruch (Ld 8, 2 re-rolls) aboard the Lunar Minotaur (with nova cannon); Lunar Valiant; Dauntless light cruisers Guardian and Star of Orion; Thoth Squadron of four Firestorms.", "Battle Group Sankara (Imperial turn 4): Admiral Sankara (Ld 9, 2 re-rolls) aboard the Retribution Bloodhawk; Dictator Formidable; Vengeance grand cruiser The Covenanter; Medulla and Bellum squadrons of three Swords each; Thalamus squadron of three Cobras.", "The Namub orbital dock, on Namub from the start."],
      b: ["Cruiser Group One (Chaos turn 1): Archus the Vile (Chaos Lord, Ld 8, 1 re-roll) aboard the Murder Ironclaw; Carnages Excessive and Heathen Cry; The Nightmares, four Infidels.", "Cruiser Group Two (Chaos turn 2): Balthia the Insane (Chaos Lord, Ld 8, 1 re-roll) aboard the Hades Warsmith of Khorne; Murder Deathblade; Slaughter Deathskull; Executors of K’lib, three Infidels.", "Warmaster Bale (Chaos turn 3): Heinrich Bale (Ld 9, 1 re-roll, Marks of Khorne and Nurgle) aboard the Desecrator battleship The Treacherous; The Plighted, four Iconoclasts."]
    },
    draw: (v, W, H) => {
      const px = Math.max(20, W - 60), py = Math.min(40, H / 2);
      return [
        { z: "planet", cx: px, cy: py, r: 6, l: "" }, { z: "text", x: px - 22, y: py, l: "Namub", s: "n" },
        { z: "mark", x: 10, y: 10, s: "a", l: "" }, { z: "arrow", x1: 12, y1: 12, x2: 26, y2: 24, s: "a" }, { z: "text", x: 36, y: 32, l: "Baruch (I2)", s: "a" },
        { z: "mark", x: W * .45, y: 3, s: "b", l: "" }, { z: "arrow", x1: W * .45, y1: 6, x2: W * .45, y2: 20, s: "b" }, { z: "text", x: W * .45, y: 26, l: "Group One (C1)", s: "b" },
        { z: "mark", x: Math.min(W - 25, px + 18), y: 3, s: "b", l: "" }, { z: "arrow", x1: Math.min(W - 25, px + 18), y1: 6, x2: Math.min(W - 25, px + 18), y2: 18, s: "b" }, { z: "text", x: Math.min(W - 25, px + 18) - 30, y: 17, l: "Group Two (C2)", s: "b" },
        { z: "mark", x: W - 3, y: Math.min(H - 30, py + 22), s: "b", l: "" }, { z: "arrow", x1: W - 6, y1: Math.min(H - 30, py + 22), x2: W - 22, y2: Math.min(H - 30, py + 22), s: "b" }, { z: "text", x: W - 28, y: Math.min(H - 30, py + 22) + 8, l: "Bale (C3)", s: "b" },
        { z: "mark", x: W - 6, y: H - 6, s: "a", l: "" }, { z: "arrow", x1: W - 9, y1: H - 9, x2: W - 23, y2: H - 21, s: "a" }, { z: "text", x: W - 40, y: H - 10, l: "Sankara (I4)", s: "a" }
      ];
    },
    fit: () => [120, 80],
    mapNote: "Entry points as on the magazine’s map, scaled to your table: agree the exact spots. C = Chaos turn, I = Imperial turn. Namub sits about 40 cm from the top edge and 60 cm from the right edge.",
    steps: [
      { t: "Place the small planet Namub (with the Imperial orbital dock) in the outer reaches, about 40 cm from one long edge and 60 cm from a short edge. No other phenomena." },
      { t: "Roll Leadership for every ship and squadron as normal." },
      { t: "Agree the five entry points, as on the map. Nothing else starts on the table." },
      { s: "b", t: "Chaos takes the first turn." }
    ],
    notes: [OLD + "The Vengeance grand cruiser is now FL p. 58. The Desecrator battleship (experimental rules by Nate Montes, BFG Magazine 9 p. 2–3, PDF p. 4–5) is not in the Fleets book; its profile is on the Play tab. Without the model, a Desolator (FL p. 267) is the nearest stand-in.",
      "If you play with your own fleets, keep the five groups and their arrival turns, and agree the points."],
    refs: [["Vengeance class grand cruiser", "FL p. 58"], ["Orbital dock", "FL p. 507–515"], ["Victory points", "RB p. 122"]],
    play: [
      { w: "Arrivals", t: "Each group moves on at its entry point at the start of its turn: Chaos turn 1 Cruiser Group One, Chaos turn 2 Cruiser Group Two, Imperial turn 2 Cruiser Group Baruch, Chaos turn 3 Warmaster Bale, Imperial turn 4 Battle Group Sankara." },
      { w: "The Formidable", s: "a", t: "Sent into battle with its engine repairs unfinished: speed 15 cm for the whole battle, and it may not Come to New Heading." },
      { w: "The Desecrator (BFG Magazine 9)", s: "b", t: "Battleship/12, 25 cm, 45°, 4 shields, armour 5+, 4 turrets. Dorsal weapons battery 60 cm, firepower 6, left/front/right. Port and starboard lance batteries 60 cm, strength 2 each. Port and starboard launch bays, 2 squadrons each (Swiftdeath 30 cm, Doomfire 20 cm, Dreadclaw 30 cm). Prow torpedoes 30 cm, strength 9. May not Come to New Heading. 350 pts." }
    ],
    fx: T => ({ 1: [["b", "Cruiser Group One arrives"]], 2: [["b", "Cruiser Group Two arrives"], ["a", "Cruiser Group Baruch arrives"]], 3: [["b", "Warmaster Bale arrives"]], 4: [["a", "Battle Group Sankara arrives"]] })[T] || [],
    tools: [],
    rtools: [{ k: "num", id: "av", l: "Imperial victory points", s: "a", after: v => v + " VP" }, { k: "num", id: "bv", l: "Chaos victory points", s: "b", after: v => v + " VP" }],
    end: ["When one side has no forces left on the table."],
    win: ["Standard victory points (RB p. 122). The higher total wins."],
    result(st) { return vp2(st, "av", "bv", "The Imperial Navy", "Chaos"); },
    info: { bg: "Warmaster Bale raided Numitor to bleed the forge world Mezoa. Admiral Sankara fed Bale’s spies a cover story about a training exercise and slipped his battle group to Numitor, where Fleet-Admiral Baruch’s cruisers were fighting for their lives. Bombers from the Formidable crippled the Warsmith of Khorne, a nova shell detonated the Ironclaw, and Bale fled while the Deathblade bought him time.", cr: ["“The Battle of Numitor”, a historical refight in " + BM(12) + ", p. 14–17 (PDF p. 16–19). The magazine’s index credits Warwick Kinrade."] }
  },
  /* ------------------------------------------------------------ THE BATTLE OF THE COLD PASSAGE */
  {
    id: "cl-cold-passage", grp: "cl-mag", name: "The Battle of the Cold Passage", series: "Battlefleet Bakka · BFG Magazine 13", trust: "classic",
    why: "Two Imperial battleships must catch a Chaos battleship before it reaches the warp gate. With an experimental fast battleship.", src: "BFG Magazine 13 p. 12–15", book: "O", suggest: ["Imperial Navy", "Chaos"],
    others: "A historical refight with fixed ships. The author suggests standing in models or similar ships for the ones you lack; the fast battleship’s profile is given on the Play tab.",
    sides: { a: { n: "Battleship hunters", f: "Imperial Navy" }, b: { n: "Soul of Hate", f: "Chaos" } },
    pitch: "The raider battleship Soul of Hate runs for the only warp gate out of the Cold Passage. A barely trained battleship, a glass-jawed fast battleship and a lone light cruiser stand in its way.",
    glance: [["Points", "Fixed ships"], ["Table", "Not given — use your table"], ["Battlezone", "Deep space, a warp gate on one short edge"], ["First turn", "Not given — see note"], ["Game ends", "The Soul of Hate dies or reaches the gate"]],
    bring: ["A nova cannon template for the warp gate", "An Imperial battleship to stand in for the Huud"],
    forces: {
      a: ["Fleet Admiral Draconis (Ld 8, 2 re-rolls) aboard the Huud, an Invincible class fast battleship (profile on the Play tab).", "Prince Issus, Victory class battleship (Ld 6). Its weapons are untested: lances hit on 5+, and its batteries shift one more column right. The nova cannon works normally.", "Faithful, Dauntless class light cruiser (Ld 8)."],
      b: ["Chaos Lord Aratah (Ld 8, Mark of Chaos of your choice) aboard the Soul of Hate, a Desolator class battleship (Ld 8, Mark of Chaos of your choice).", "Tormentation, Repulsive class grand cruiser (Ld 7)."]
    },
    draw: (v, W, H) => [
      { z: "circ", cx: 0, cy: H / 2, r: 6, s: "b", l: "" }, { z: "text", x: 16, y: H / 2 + 12, l: "warp gate", s: "b" },
      { z: "mark", x: Math.max(30, W - 52), y: H / 2, s: "b", l: "" }, { z: "text", x: Math.max(30, W - 52), y: H / 2 + mapFont(W) * 1.6, l: "Chaos flotilla", s: "b" }, { z: "arrow", x1: Math.max(28, W - 56), y1: H / 2, x2: Math.max(14, W - 72), y2: H / 2, s: "b" },
      { z: "mark", x: W - 3, y: H / 2, s: "a", l: "Faithful" },
      { z: "dim", x1: Math.max(30, W - 52), y1: H / 2 + mapFont(W) * 4, x2: W, y2: H / 2 + mapFont(W) * 4, l: "50 cm" },
      { z: "mark", x: W * .45, y: 3, s: "a", l: "" }, { z: "arrow", x1: W * .45 - 2, y1: 6, x2: W * .45 - 14, y2: 18, s: "a" }, { z: "text", x: W * .45 + 6, y: 22, l: "Imperial battleships", s: "a" }
    ],
    fit: () => [120, 60],
    mapNote: "As the magazine’s map: the warp gate (a nova cannon template) touches the left short edge. The Chaos flotilla starts within 50 cm of the right edge, the Faithful behind it on the edge, the battleships within 5 cm of the top edge, heading to intercept.",
    steps: [
      { t: "Generate deep space phenomena (RB p. 107–108)." },
      { t: "Place the warp gate — a circle the size of a nova cannon template — touching the middle of one short edge." },
      { s: "b", t: "Place the Soul of Hate and the Tormentation within 50 cm of the opposite short edge, on the bearing shown." },
      { s: "a", t: "Place the Faithful on that short edge, behind the Chaos ships, and the two battleships within 5 cm of a long edge, on intercept courses." },
      { t: "Decide who goes first (see note)." }
    ],
    notes: ["Written for the original 1999 rules. The Invincible class is an experimental magazine design not in the Fleets book (the Fleets book only lists an Invincible among the famous ships of the Gothic War).",
      "The article does not say who takes the first turn. Suggestion: roll off.",
      "The Chaos ships’ Marks are the player’s choice (FL p. 225, 232)."],
    refs: [["Deep space generator", "RB p. 107–108"], ["Victory class battleship", "FL p. 55"], ["Desolator, Repulsive", "FL p. 267, 269"], ["Marks of Chaos", "FL p. 225, 232"]],
    play: [
      { w: "The Huud (Invincible class, 290 pts)", s: "a", t: "Battleship/8, speed 25 cm, turns 45°, 2 shields, armour 5+ (6+ front), 4 turrets. Port and starboard batteries 60 cm, firepower 12; dorsal lance 60 cm, strength 4, left/front/right; prow torpedoes 30 cm, strength 6. It may Come to New Heading. Every hit it takes rolls two dice for criticals (a double 6 is two criticals)." },
      { w: "The warp gate", s: "b", t: "Any ship entering the gate disappears into the warp. The Soul of Hate may not disengage any other way; every other ship may." },
      { w: "Entering the warp", s: "b", t: "When the Soul of Hate enters the gate, the Imperial player rolls a D6: if it equals or beats the battleship’s remaining hits, it is torn apart by the warp." }
    ],
    tools: [{ k: "counter", id: "hits", l: "Soul of Hate: hits left", s: "b", start: 12, warn: v => v ? "Entering the gate: an Imperial D6 of " + v + "+ tears it apart." : "Destroyed." }],
    rtools: [{ k: "ending", id: "how", l: "How did it end?", rows: [["The Soul of Hate was destroyed", "a"], ["It entered the gate and the warp tore it apart", "a"], ["It escaped into the warp", "b"]] }],
    end: ["When the Soul of Hate is destroyed or enters the warp through the gate."],
    win: ["The Imperials win if the Soul of Hate is destroyed — by them or by the warp.", "Chaos wins if it enters the warp safely."],
    result(st, v, S) { return endingResult(st, S, "how"); },
    info: { bg: "The Desolator Soul of Hate raided Segmentum Tempestus at will, so Battlefleet Bakka formed battleship hunter groups. One of them — the untried Prince Issus and the fast battleship Huud — was sent to a quiet sub-sector, until the light cruiser Faithful spotted the raider passing through it.", cr: ["John Lambshead — “The Battle of the Cold Passage”, a scenario with experimental rules for the Invincible class fast battleship, " + BM(13) + ", p. 12–15 (PDF p. 14–17)."] }
  },
  /* ------------------------------------------------------------ THEY COME ONLY TO MURDER */
  {
    id: "cl-come-only-to-murder", grp: "cl-mag", name: "They Come Only to Murder", series: "BFG Magazine 13 · raid", trust: "classic",
    why: "A Dark Eldar slave raid on a poorly defended world. Hit-and-run attacks on the planet itself earn points.", src: "BFG Magazine 13 p. 19", book: "O", suggest: ["Dark Eldar"],
    others: "Written for Dark Eldar raiders against any defender. Any fast raiding fleet can play it; the planetary hit-and-runs are the heart of the scenario.",
    sides: { a: { n: "Defender" }, b: { n: "Raiders", f: "Dark Eldar" } },
    pitch: "The Dark Eldar have come for captives. Half the defenders are caught at low readiness, some not even on station.",
    glance: [["Points", "Defender: agreed · Raiders: 75%"], ["Table", "Long enough for 90 cm from the planet"], ["Battlezone", "Primary or inner biosphere, inhabited planet in the middle"], ["First turn", "Raiders"], ["Game ends", "The raiders leave, or the defence is wiped out"]],
    bring: ["A medium planet", "Planetary defences"],
    forces: {
      a: ["The agreed points. Up to a quarter of them may be planetary defences."],
      b: ["75% of the defender’s points."]
    },
    draw: (v, W, H) => {
      const cx = W / 2;
      return [
        { z: "circ", cx, cy: H / 2, r: Math.min(60, W / 2 - 2, H), s: "a", l: "" }, { z: "planet", cx, cy: H / 2, r: 9, l: "" },
        { z: "text", x: cx, y: H / 2 + 20, l: "defenders: within 60 cm", s: "a" },
        cx + 90 < W - 10 ? R(cx + 90, 0, W - cx - 90, H, "b", "Raiders", { rot: 90 }) : null,
        { z: "edge", e: "r", s: "b", l: "Raiders: 90 cm+ from the planet" }, { z: "edge", e: "l", s: "a", dash: 1, l: "Defender’s edge: late arrivals" }
      ];
    },
    fit: () => [180, 60],
    mapNote: "The planet sits in the middle. Defending ships go within 60 cm of it; the raiders at least 90 cm from it along their own edge — on a 180 cm table that is right on the short edge.",
    steps: [
      { t: "Place a medium planet in the middle and roll its type (RB p. 160–161); re-roll an uninhabited result. Set up phenomena for the primary or inner biosphere." },
      { s: "a", t: "Declare your squadrons, then roll a D6 for each ship or squadron (tool below): 1 off the table, arriving later; 2–3 within 60 cm of the planet on standby; 4–5 within 60 cm at −1 Ld for the first turn; 6 within 60 cm, ready." },
      { s: "a", t: "Place your planetary defences." },
      { s: "b", t: "Deploy at least 90 cm from the planet along your table edge." },
      { s: "b", t: "The raiders take the first turn." }
    ],
    stools: [{ k: "shiproll", id: "ready", l: "Defender readiness", cl: "Ships and squadrons", n0: 4, il: i => "Ship or squadron " + (i + 1), out: d => d === 1 ? "off the table — arrives later" : d <= 3 ? "within 60 cm, on standby" : d <= 5 ? "within 60 cm, −1 Ld in turn 1" : "within 60 cm, ready" }],
    notes: [OLD + "Standby, as in Surprise Attack: RB p. 132. Planet types: RB p. 160–161. Hit-and-run attacks: RB p. 91."],
    refs: [["Surprise Attack (standby)", "RB p. 132"], ["Hit-and-run attacks", "RB p. 91"], ["Planetary defences", "FL p. 496–"], ["Victory points", "RB p. 122"]],
    play: [
      { w: "Start of each defender turn", s: "a", t: "Roll a D6 for each ship still off the table: if it is equal to or below the turn number, it moves on from your edge." },
      { w: "Standby", s: "a", t: "Ships on standby do nothing until they go on alert (as in Surprise Attack)." },
      { w: "Raiding", s: "b", t: "Make hit-and-run attacks on the planet and on planetary defences as if they were ships. Each success does no damage but earns +50 VP." },
      { w: "Crippled raiders", s: "b", t: "Once crippled, a raider must try to disengage every turn." }
    ],
    fx: T => [["a", "Off-table ships arrive on a D6 of " + T + " or less"]],
    tools: [{ k: "counter", id: "raids", l: "Successful raids on the planet and defences", s: "b", res: 1, warn: v => v ? "+" + v * 50 + " VP" : "" }],
    rtools: [{ k: "num", id: "av", l: "Defender: victory points", s: "a", after: v => v + " VP" }, { k: "num", id: "bv", l: "Raiders: victory points (without raids)", s: "b", after: v => v + " VP" }],
    end: ["When the raiders have disengaged, or the defending fleet is destroyed."],
    win: ["Both score standard victory points; the raiders add 50 VP for every successful hit-and-run on the planet or its defences. The higher total wins."],
    result(st) { const A = num(st, "av"), B = num(st, "bv") + 50 * get(st, "raids", 0); if (!A && !B) return [null, "Count victory points", "Enter both totals below."]; return A === B ? ["draw", "Level", A + " – " + B + " VP."] : [A > B ? "a" : "b", A > B ? "The defender wins" : "The raiders win", "Defender " + A + " – Raiders " + B + " VP (raids included)."]; },
    info: { bg: "The Dark Eldar raid poorly defended worlds not for conquest but for captives. They strike fast, take what they can and leave before the defenders can gather.", cr: ["Matt Keefe — “They Come Only to Murder”, " + BM(13) + ", p. 19 (PDF p. 21)."] }
  },
  /* ------------------------------------------------------------ CERBERUS 1 INTO THE NEBULA */
  {
    id: "cl-cerberus-1", grp: "cl-mag", name: "Into the Nebula", series: "Cerberus War · Scenario 1", trust: "classic",
    why: "Blockade Run built on sub-plots: escort the exploration cruiser Venturer past an Ork blockade into the Shroud Nebula.", src: "BFG Magazine 13 p. 26–30", book: "O", suggest: ["Imperial Navy", "Orks"],
    others: "Any runners and any blockaders; if the runners are not Imperial, the Venturer has fallen into alien hands. The Venturer’s profile is on the Play tab.",
    sides: { a: { n: "Battlegroup Olympus", f: "Imperial Navy" }, b: { n: "Blockade", f: "Orks" } },
    pitch: "The lost exploration cruiser Venturer is broadcasting an alien code — and the warp barrier around the Shroud Nebula is collapsing. A battered battlegroup must get it past an Ork blockade.",
    glance: [["Points", "1600 each (Venturer included)"], ["Table", "As Blockade Run"], ["Battlezone", "Deep space; 2D3 clouds on the blockade’s edge"], ["First turn", "As Blockade Run"], ["Game ends", "After 6 turns"]],
    bring: ["A torpedo-armed cruiser or light cruiser as the Venturer", "2D3 gas/dust clouds"],
    forces: {
      a: ["Up to 1600 pts, including the Venturer with Captain Lysander for 255 pts, exactly as given (see note).", "Sub-plots: the Venturer has Desperate Mission; the rest of the fleet has Extended Duty (the Venturer passes it automatically) and Signalling Problems."],
      b: ["1600 pts. Historically, no space hulks.", "Sub-plots: Vendetta (against the enemy flagship) and Secret Intelligence (against the Venturer)."]
    },
    fixed: {
      a: ["Admiral Daniels (Ld 9, 2 re-rolls) aboard the Mars battlecruiser Olympus Mons.", "Venturer, Hawking class exploration cruiser, with Captain Lysander.", "Dictator Peregrine; Tyrant Righteous Duty (45 cm batteries); Gothic Kern’s Pride.", "12th Gunboat Flotilla (Swords); 18th Fast Attack Group, four Cobras."],
      b: ["Warlord Dethbringa (Extra Power Fields) aboard the Hammer battlekroozer Gork’s Maul (extra turret, boarding torpedoes).", "Terror ships Yellow Maw and Grashkul and the kill kroozer Da Nasty Grin, each with a Warlord (Extra Power Fields).", "Dakka Ladz (four Onslaughts), Da Rokkit Krew (four Ravagers), Bolg’s Boyz (four Brute ramships)."]
    },
    draw: (v, W, H) => MAPS["blockade-run"](v, W, H).concat([0.15, 0.4, 0.65, 0.88].map(f => ({ z: "ring", cx: W * f, cy: 4, r: 3, sw: 6, gas: 1 })), [{ z: "text", x: W / 2, y: H - 22, l: "Venturer: no slow ship within 20 cm", s: "a" }]).map(it => it.z === "edge" && it.e === "t" ? Object.assign({}, it, { l: "Shroud Nebula: the Venturer escapes off this edge" }) : it),
    fit: () => [60, 90],
    mapNote: "Blockade Run set-up. The Shroud Nebula lies just beyond the blockade’s edge: place 2D3 extra gas/dust clouds along it.",
    steps: [
      cerbLd(1),
      { t: "Generate deep space phenomena, then add 2D3 gas/dust clouds along the blockade’s edge (the Nebula)." },
      { t: "Pick the sub-plots on the Sub-plots tab: Desperate Mission for the Venturer, Extended Duty and Signalling Problems for the rest of the runners, Vendetta and Secret Intelligence for the blockade." },
      { s: "b", t: "Set up as in Blockade Run: a D6 per ship or squadron for its third, nothing within 60 cm of the runners’ edge." },
      { s: "a", t: "Deploy within 15 cm of your edge. No ship may be within 20 cm of the Venturer unless its speed is 25 cm or more — the fleet has only just caught up with it." },
      { t: "Roll off for the first turn, as in Blockade Run." }
    ],
    notes: [OLD + "Blockade Run: RB p. 133. Sub-plots: RB p. 124–127.",
      "The forces section prices the Venturer and Lysander together at 255 pts, while its profile reads 245 pts plus 75 pts for Lysander. The scenario asks you to pay 255.",
      "The heroic victory needs “both” of the runners’ sub-plots; they have three (Desperate Mission, Extended Duty, Signalling Problems). Read as all of them."],
    refs: [["Blockade Run", "RB p. 133"], ["Sub-plots", "RB p. 124–127"], ["Hammer battlekroozer, terror ship", "FL p. 374, 380"]],
    play: [
      { w: "The Venturer", s: "a", t: "Hawking class exploration cruiser: Cruiser/6, speed 25 cm, turns 90°, 2 shields, armour 5+, 2 turrets. Port and starboard batteries 30 cm, firepower 4; port and starboard launch bays, one Fury squadron each; prow torpedoes 30 cm, strength 6. +1D6 cm on All Ahead Full; +1 Leadership (sensors); no speed loss from blast markers or gas/dust clouds." },
      { w: "Captain Lysander", s: "a", t: "Ld 8 (9 with the sensors) and two re-rolls. The Venturer is out of contact: it cannot use the Admiral’s re-rolls, and no other ship can use Lysander’s." },
      { w: "All game", s: "a", t: "Get the Venturer off the blockade’s edge before the Orks board it (Secret Intelligence)." }
    ],
    turnMax: () => 6,
    tools: [],
    rtools: [
      { k: "pick", id: "ven", l: "The Venturer…", rows: [["Escaped off the blockade’s edge", ""], ["Was destroyed or could not get out", ""]] },
      { k: "toggle", id: "si", l: "The Orks completed Secret Intelligence against the Venturer", s: "b" },
      { k: "toggle", id: "vd", l: "The Orks completed their Vendetta", s: "b" },
      { k: "toggle", id: "asp", l: "The runners completed all their sub-plots", s: "a" },
      { k: "toggle", id: "vlive", l: "Note for Scenario 4: the Venturer survived", s: "a" },
      { k: "html", html: "<h3>Campaign</h3><p>A marginal or heroic winner gets the first choices in " + link("cl-cerberus-2", "Warp Space") + ". The prologue is " + link("cl-ahriman", "Ahriman’s Arrival") + ".</p>" }
    ],
    end: ["After six turns, as in Blockade Run."],
    win: ["Runners’ heroic victory: the Venturer escapes off the blockade’s edge, Secret Intelligence was not completed against it, and all the runners’ sub-plots are completed.", "Runners’ marginal victory: the Venturer escapes without Secret Intelligence being completed against it.", "Blockade’s marginal victory: Secret Intelligence failed, but the Venturer is destroyed or cannot get out.", "Blockade’s heroic victory: Secret Intelligence and Vendetta both completed, and the Venturer destroyed or trapped.", "Anything else is a tie."],
    result(st) {
      const v = get(st, "ven", -1), si = get(st, "si", false), vd = get(st, "vd", false), asp = get(st, "asp", false);
      if (v < 0) return [null, "Mark what happened to the Venturer", "Then the sub-plots below."];
      if (v === 0 && !si) return asp ? ["a", "Runners’ heroic victory", "The Venturer is through, its secrets safe."] : ["a", "Runners’ marginal victory", "The Venturer is through."];
      if (v === 1 && !si) return ["b", "Blockade’s marginal victory", "The Venturer is lost, though its secrets were not taken."];
      if (v === 1 && si && vd) return ["b", "Blockade’s heroic victory", "Boarded, plundered and destroyed."];
      return ["draw", "Tie", "Neither side met its conditions."];
    },
    info: { bg: "As the Imperial counter-offensive in the Cerberus Shroud collapsed, the remnants of Battlegroup Olympus met the long-lost exploration cruiser Venturer on the edge of the Shroud Nebula. It ignored every hail, broadcast an alien code — and the Nebula’s warp barrier began to fail. Admiral Daniels resolved to protect it, though it was heading straight for Warlord Dethbringa’s blockade.", cr: [CERB, "Scenario 1 is in " + BM(13) + ", p. 26–30 (PDF p. 28–32)."] }
  },
  /* ------------------------------------------------------------ CERBERUS 2 WARP SPACE */
  {
    id: "cl-cerberus-2", grp: "cl-mag", name: "Warp Space", series: "Cerberus War · Scenario 2", trust: "classic",
    why: "A battle inside the warp itself: long-range fire is a gamble, point-blank fire is deadly, and a collapsing shield can let the daemons in.", src: "BFG Magazine 14 p. 20–22", book: "O", suggest: ["Imperial Navy", "Chaos"],
    others: "Any fleets that travel through the warp. Eldar, Dark Eldar and Necrons do not, so they suit it poorly: long-range fire hardly touches them, but they lose their attack craft.",
    sides: { a: { n: "Fleet A", f: "Imperial Navy" }, b: { n: "Fleet B", f: "Chaos" } },
    pitch: "Warp tides throw two armadas together on their way into the Nebula. Fight in the Immaterium — or die in it.",
    glance: [["Points", "1000 each"], ["Table", "Not given — use your table"], ["Battlezone", "Warp space: a deep space roll per 60 cm square"], ["First turn", "Winner of Scenario 1 chooses"], ["Game ends", "After 8 turns each"]],
    bring: ["5 contact markers each", "Phenomena for the warp-space squares"],
    forces: {
      a: ["Up to 1000 pts, within your fleet list’s normal limits.", "Split into five divisions on contact markers."],
      b: ["Up to 1000 pts, the same way."]
    },
    fixed: {
      a: ["Admiral Achebe (Ld 8, 1 re-roll) aboard the Armageddon battlecruiser Triumph.", "Tyrant Vanguard (45 cm batteries); Gothic Furious; Dominator Conqueror.", "Hellburners, three Firestorms."],
      b: ["Warmaster Potonos Kataban (Ld 8, Mark of Nurgle) aboard the Repulsive Pestilence.", "Carnage Festerous; Murders Putrid and Contagious; Slaughter Malignant."]
    },
    draw: (v, W, H, st) => {
      const g = gridOf(W, H, 60), t0 = get(st, "terr", null), terr = t0 && t0.length === g.c * g.r ? t0 : null, o = [];
      for (let i = 1; i < g.c; i++) o.push({ z: "line", x1: i * g.sw, y1: 0, x2: i * g.sw, y2: H });
      for (let j = 1; j < g.r; j++) o.push({ z: "line", x1: 0, y1: j * g.sh, x2: W, y2: j * g.sh });
      o.push(R(15, 0, Math.max(5, W - 30), 15, "a", "Fleet A"), R(15, H - 15, Math.max(5, W - 30), 15, "b", "Fleet B"));
      for (let j = 0; j < g.r; j++) for (let i = 0; i < g.c; i++) {
        const k = j * g.c + i, t = terr ? terr[k] : "", cx = i * g.sw + g.sw / 2, cy = j * g.sh + g.sh / 2;
        if (/Asteroid/.test(t)) o.push({ z: "hatch", x: cx - 10, y: cy - 7, w: 20, h: 14, l: "" });
        if (/Cloud/.test(t)) o.push({ z: "ring", cx, cy, r: 5, sw: 10, gas: 1 });
        if (t === "Warp rift") o.push({ z: "ring", cx, cy, r: 6, s: "c" });
        if (t === "Hulk") o.push({ z: "planet", cx, cy, r: 6, l: "" });
        if (t) o.push({ z: "text", x: cx, y: cy + 13, l: (k + 1) + ": " + t, s: "n" });
      }
      o.push({ z: "dim", x1: 0, y1: 22, x2: 15, y2: 22, l: "15" });
      return o;
    },
    fit: () => [90, 60],
    mapNote: "Fleet zones 15 cm deep along both long edges, 15 cm in from the short edges. Terrain is rolled per 60 cm square (tool below) and drawn here once rolled.",
    steps: [
      cerbLd(2),
      { t: "Each player picks up to 1000 pts and splits the fleet into five divisions, each with a contact marker." },
      { t: "Divide the table into 60 cm squares and roll once on the deep space table for each (tool below). Clouds and asteroids are warp currents; the small planet is an inert space hulk; a warp rift is a gateway to realspace." },
      { t: "One player rolls a D6: 1–3 they take Fleet A’s zone, 4–6 Fleet B’s." },
      { t: "Take turns placing face-down contact markers in your zone. The winner of Into the Nebula chooses who starts; otherwise roll off." },
      { t: "Reveal the markers and place each division’s ships within 10 cm of its marker, facing any way." },
      { t: "The winner of Into the Nebula chooses who goes first; otherwise roll off." }
    ],
    stools: [{ k: "terrain", id: "terr", l: "Warp space, square by square", sub: "D6 on the deep space table for every 60 × 60 cm square (only one hulk)", size: 60, once: 6, rows: [[1, 1, "D3 asteroid fields (dense warp currents)", "D3 Asteroids"], [2, 2, "Asteroid field (a dense warp current)", "Asteroids"], [3, 3, "D3 gas/dust clouds (warp currents)", "D3 Clouds"], [4, 4, "Gas/dust cloud (a warp current)", "Cloud"], [5, 5, "Warp rift (a gateway to realspace)", "Warp rift"], [6, 6, "Small planet: an inert space hulk (only one)", "Hulk"]] }],
    notes: [OLD + "Method 2 for placing phenomena: RB p. 105. The scenario borrows its warp combat from Gordon Rennie’s novel Execution Hour.",
      "Racial abilities, refits and crew skills that affect celestial phenomena do not work in warp space.",
      "Optional Warp Storm: use the solar flare and radiation burst rules for table-wide turbulence and give both fleets Signalling Problems; Eldar get no protection, and Necrons only their save against solar flares."],
    refs: [["Deep space generator, Method 2", "RB p. 105–108"], ["Critical hits, catastrophic damage", "RB p. 66–71"], ["Victory points", "RB p. 122"]],
    play: [
      { w: "Long range", t: "Firing at a target more than 30 cm away, roll a D6 for each weapon system before rolling to hit: unless it is a 4+, warp currents swallow that shot — no damage, no blast markers. An area weapon rolls once for the whole shot." },
      { w: "Nova cannon, Armageddon gun", t: "Need a 4+ to fire at all, and past 30 cm the long-range roll as well." },
      { w: "Close range", t: "At 15 cm or less, shift two columns left on the gunnery table instead of one." },
      { w: "Ordnance", t: "No fighters, bombers, assault boats or boarding torpedoes. Only ordinary torpedoes (and Demiurg ordnance) — and all ordnance is removed at the end of the ordnance phase it was launched in." },
      { w: "Shields collapsing!", t: "A ship that suffers Shields Collapse rolls a D6 at once: on a 1 its Geller field fails and it is destroyed — roll on the catastrophic damage table. (Eldar: a 10, Necrons: a 9 on their critical tables has the same effect.)" },
      { w: "Boarding", t: "Teleport attacks are not allowed; boarding actions are." },
      { w: "Turn 8", t: "Last turn: the warp forces both fleets apart." }
    ],
    turnMax: () => 8,
    tools: [
      { k: "shiproll", id: "lr", l: "Long-range shots (over 30 cm)", cl: "Weapon systems firing", n0: 3, il: i => "Weapon " + (i + 1), out: d => d >= 4 ? "fires normally" : "swallowed by the warp", btn: n => "Roll " + n + " × D6", sub: "One D6 per weapon system; 4+ fires." },
      { k: "roll", id: "gell", l: "Shields Collapse critical", rows: () => [[1, 1, "The Geller field fails: the ship is destroyed — roll catastrophic damage"], [2, 6, "The ship holds together"]] }
    ],
    rtools: [{ k: "num", id: "av", l: "Fleet A: victory points", s: "a", after: v => v + " VP" }, { k: "num", id: "bv", l: "Fleet B: victory points", s: "b", after: v => v + " VP" }, { k: "html", html: "<h3>Campaign</h3><p>The winner may choose to defend last in " + link("cl-cerberus-3", "Hold the Line") + ".</p>" }],
    end: ["After each player has taken eight turns."],
    win: ["Standard victory points, but nothing for holding the field — nobody has time to recover hulks. The higher total wins."],
    result(st) { return vp2(st, "av", "bv", "Fleet A", "Fleet B"); },
    info: { bg: "When the Shroud Nebula’s barrier fell, the leading armadas — the Inquisition’s combined fleet and Ahriman’s own — raced into the warp storms still raging inside it. The tempests scattered them and flung them into one another; here Admiral Achebe’s Battlegroup Falchion meets the Plaguelord Potonos Kataban.", cr: [CERB, "Scenario 2 is in " + BM(14) + ", p. 20–22 (PDF p. 22–24)."] }
  },
  /* ------------------------------------------------------------ CERBERUS 3 HOLD THE LINE */
  {
    id: "cl-cerberus-3", grp: "cl-mag", name: "Hold the Line", series: "Cerberus War · Scenario 3", trust: "classic",
    why: "A rearguard against an endless, randomly rolled fleet that wraps around the table. Everyone defends once; the best defence wins.", src: "BFG Magazine 14 p. 23–26", book: "O", suggest: ["Necrons", "Chaos", "Imperial Navy"],
    others: "The attackers are ideally Necrons or Chaos, using the tables here; any other attacker can use the Chaos table, adjusted for its own ships. Any defender works; Imperial defenders may add Inquisition ships.",
    sides: { a: { n: "Rearguard", f: "Imperial Navy" }, b: { n: "Attackers", f: "Necrons or Chaos" } },
    variants: [["nec", "Necron attackers"], ["chaos", "Chaos attackers"]],
    pitch: "An ancient armada wakes behind the fleets racing for the heart of the Nebula. Someone has to turn and buy time — and very few of them will come back.",
    glance: [["Points", "Rearguard 1500 · attackers rolled every turn"], ["Table", "Not given — use your table"], ["Battlezone", "Deep space + D3 asteroid fields"], ["First turn", "Attackers"], ["Game ends", "The rearguard is destroyed or has disengaged"]],
    bring: ["Lots of attacker models — destroyed ones may be recycled if you agree", "D3 extra asteroid fields"],
    forces: v => ({
      a: ["Up to 1500 pts from your fleet list. A Chaos rearguard may not take the Planet Killer, an activated Blackstone or Ahriman.", "Imperial rearguards may add Inquisition ships (Play tab).", "The rearguard has the Blood Bond sub-plot."],
      b: ["No ships at the start. At the start of each of your turns roll a D6, add the turn number and bring on what the " + (v === "chaos" ? "Timelost (Chaos)" : "Sleepers (Necron)") + " table gives.", "Every ship uses its standard profile with no upgrades; no fleet commander or re-rolls" + (v === "chaos" ? " — except Warmaster Umbros." : ".")]
    }),
    draw: (v, W, H) => [
      R(W - 30, 0, 30, H, "a", "Rearguard: 30 cm, 20 cm apart", { rot: 90 }),
      { z: "edge", e: "l", s: "b", l: "Attackers move on" },
      { z: "line", x1: W / 2, y1: 0, x2: W / 2, y2: 6 }, { z: "line", x1: W / 2, y1: H - 6, x2: W / 2, y2: H },
      { z: "tick", e: "t", s: "b", list: [[10, "T2"], [20, "T3"], [30, "T4"]].filter(t => t[0] < W / 2) }, { z: "tick", e: "b", s: "b", list: [[10, "T2"], [20, "T3"], [30, "T4"]].filter(t => t[0] < W / 2) },
      { z: "text", x: W * .3, y: H / 2, l: "the attackers’ edge grows 10 cm\nalong both long edges each turn,\nup to halfway", s: "b" }
    ],
    fit: () => [90, 60],
    mapNote: "The rearguard deploys within 30 cm of its short edge, facing the other one. The attackers come on along the other short edge — and each turn after the first, 10 cm further along both long edges, up to halfway.",
    steps: [
      cerbLd(3),
      { t: "This scenario is played once per player: everyone takes a turn as the rearguard. The winner of Warp Space may choose to defend last." },
      { t: "Generate deep space phenomena; a planet is a huge asteroid (planet rules). The rearguard then places D3 more asteroid fields anywhere." },
      { s: "a", t: "Pick a short edge and deploy within 30 cm of it, every ship facing the other short edge, each ship or squadron at least 20 cm from the others. Give the rearguard Blood Bond (Sub-plots tab)." },
      { s: "b", t: "No deployment: the attackers roll for ships at the start of each turn. They take the first turn." }
    ],
    notes: [OLD + "Built on Defence of Pelucidar (RB p. 180–181). Inquisition and Deathwatch ships: the magazine’s Black Ship is now in the Fleets book (FL p. 128–), as are the Deathwatch (FL p. 98–).",
      "If you lack a model for a rolled result, take the next lowest result instead (no cruiser left: three escort squadrons). Agree beforehand whether destroyed ships go back into the pool.",
      "Necron Tombship with Sepulchre and Warmaster Umbros can each appear only once."],
    refs: [["Defence of Pelucidar (the base scenario)", "RB p. 180–181"], ["Blood Bond", "RB p. 125"], ["Necron ships", "FL p. 405–"], ["Inquisition", "FL p. 128–"]],
    play: [
      { w: "Start of each attacker turn", s: "b", t: "Roll a D6 + the turn number on the table (tool below). The ships move on at once from your edge — they cannot be held back — and may take special orders that turn. Roll Leadership as they arrive; two capital ships arriving together may form a squadron." },
      { w: "Escort squadrons", s: "b", t: "D6 escorts of any type. A Chaos attack craft wing is four markers of any allowed type, outside the ordnance limits." },
      { w: "Warmaster Umbros", s: "b", t: "Ld 9 Warmaster with the Mark of Tzeentch; with his Chosen and Terminators he also counts as having the Mark of Khorne for boarding and teleport attacks. Worth 150 pts for victory points.", only: ["chaos"] },
      { w: "Inquisition ships", s: "a", t: "An Imperial rearguard may add: 0–1 Inquisition Black Ship (270 pts, escorts allowed, no 2500-pt minimum here); Deathwatch strike cruisers (175 pts, any two different refits from the rulebook tables); Inquisitor Marek (Ld 10, 50 pts) as a Master of the Fleet whose re-rolls work only on Inquisition ships. They may not squadron with other ships." },
      { w: "Victory", s: "a", t: "You need 2000 VP — after subtracting the value of your own ships destroyed or disengaged. In practice: 2000 plus your whole fleet’s value, since you will have to leave." }
    ],
    fx: T => [["b", "Roll D6 + " + T + " for arrivals; " + (T === 1 ? "move on from your short edge" : "your edge now reaches " + 10 * (T - 1) + " cm along both long edges (never past halfway)")]],
    tools: [
      { k: "roll", id: "gen", l: "Arrivals: D6 + turn number", turn: true, rows: v => v === "chaos" ? TIMELOST : SLEEPERS },
      { k: "roll", id: "umb", l: "Battleship rolled: is Umbros aboard?", rows: () => [[1, 5, "No"], [6, 6, "Yes — Warmaster Umbros (once only)"]], only: ["chaos"] }
    ],
    rtools: [
      { k: "num", id: "vp", l: "Rearguard: victory points scored", s: "a", after: v => v + " VP" },
      { k: "num", id: "lost", l: "Rearguard: value of own ships destroyed or disengaged", s: "a", after: v => "−" + v + " VP" },
      { k: "html", html: "<h3>Campaign</h3><p>Each player defends once; the best rearguard score wins and chooses first in " + link("cl-cerberus-4", "Apotheosis") + ". Note whether Warmaster Umbros survived — he can join Ahriman there.</p>" }
    ],
    end: ["When the rearguard has been destroyed or has disengaged."],
    win: ["Only the rearguard scores: standard victory points for crippling and destroying, nothing for holding the field, minus the value of its own ships destroyed or disengaged.", "2000 or more: the rearguard wins. Less: the attackers win.", "In the campaign, the player with the best score as rearguard wins the scenario."],
    result(st) { const n = num(st, "vp") - num(st, "lost"); if (!num(st, "vp") && !num(st, "lost")) return [null, "Count the rearguard’s score", "Victory points scored minus own losses."]; return n >= 2000 ? ["a", "The rearguard holds", "Net " + n + " VP."] : ["b", "The attackers win", "Net " + n + " VP — 2000 needed."]; },
    info: { bg: "At the heart of the Nebula lay a single red giant, one scorched world and the lost craftworld Alurmen. As the invaders closed in, a Chaos armada freed from millennia of stasis fell on the Imperial fleets and Necron legions woke to strike at Ahriman. The rearguards turned to fight so that the rest could reach the prize.", cr: [CERB, "Scenario 3 is in " + BM(14) + ", p. 23–26 (PDF p. 25–28)."] }
  },
  /* ------------------------------------------------------------ CERBERUS 4 APOTHEOSIS */
  {
    id: "cl-cerberus-4", grp: "cl-mag", name: "Apotheosis", series: "Cerberus War · Scenario 4", trust: "classic",
    why: "The finale: two attacking fleets race to land the most troops on the craftworld Alurmen, through its last defence stations.", src: "BFG Magazine 14 p. 27–31", book: "O", suggest: ["Chaos", "Imperial Navy"],
    others: "One side is Ahriman’s Chaos fleet; the other can be anyone — historically every race fought over Alurmen. Allied fleets on each side make it bigger still. Ahriman is an unofficial character: without him, any Chaos warmaster can lead with Abaddon’s re-roll rules (FL p. 230–231), as Ahriman’s Arrival suggests.",
    sides: { a: { n: "Ahriman’s rivals", f: "Imperial Navy" }, b: { n: "Ahriman", f: "Chaos (Thousand Sons)" } },
    pitch: "Ahriman has found Alurmen and the webway nexus that could make him a god. Another armada has arrived at the same moment. Whoever lands enough troops first takes the craftworld.",
    glance: [["Points", "Equal, 3000 or more"], ["Table", "Large, laid out precisely"], ["Battlezone", "Mercurial zone + low orbit table"], ["First turn", "Roll-off"], ["Game ends", "One side leads by 8 assault points"]],
    bring: ["A medium planet and a small one (Alurmen)", "Low orbit table (RB p. 116)", "Eldar defence stations: one per 500 pts", "The Venturer, if it survived Scenario 1"],
    forces: {
      a: ["Equal points, at least 3000. No transports: every capital ship carries troops (Space Marines differ, see Play).", "If the Venturer survived Into the Nebula you must take it with Captain Lysander (255 pts)."],
      b: ["Equal points. Ahriman must lead (200 pts). If Warmaster Umbros survived Hold the Line he may join (150 pts).", "No Planet Killer or activated Blackstone. No transports."]
    },
    fixed: {
      a: ["Admiral Forrester (Ld 9, 2 re-rolls) aboard the Emperor Lord Vorkosigan; the Venturer with Lysander; Overlord Perfidii Purgendi (lances); Tyrant Vanguard (45 cm); Gothic Furious; Lunar Artemis; Dictator Perdition; Falcons, four Cobras.", "Master of the Fleet Artagal (Ld 10, 2 re-rolls) aboard the battle barge Starlifter; strike cruisers Morning Star, Medusa’s Fury and Sleipnir; Sons of Guilliman, four Gladius troop transports."],
      b: ["Ahriman aboard the Despoiler Severed Dreams; Warmaster Umbros aboard the Desolator Legacy of Prospero.", "Repulsive Treacherous (lances); Hades Vengeance of Magnus; Carnage Eliminator; Devastations Scourge and Corruptor; Murders Putrid and Eviscerator; Slaughters Warp Scream, Malignant and Wrath of Khorne; Black Asps, four Iconoclasts."]
    },
    draw: (v, W, H) => [
      { z: "corner", c: "tl", r: 30, s: "a", l: "A" }, { z: "corner", c: "tr", r: 30, s: "b", l: "B" },
      { z: "planet", cx: W / 2, cy: 20, r: 9, l: "" }, { z: "text", x: W / 2, y: 36, l: "medium planet, 20 cm in", s: "n" },
      { z: "ring", cx: W / 2, cy: Math.max(55, H - 30), r: 10, s: "c" }, { z: "planet", cx: W / 2, cy: Math.max(55, H - 30), r: 4, l: "Alurmen" },
      { z: "line", x1: 22, y1: 22, x2: W / 2 - 6, y2: Math.max(55, H - 30) - 6 }, { z: "line", x1: W - 22, y1: 22, x2: W / 2 + 6, y2: Math.max(55, H - 30) - 6 }
    ],
    fit: () => [150, 90],
    mapNote: "As the magazine’s map: set-up triangles in the two corners of one long edge; the medium planet halfway along that edge, 20 cm in; Alurmen on the centre line far from both, with a 10 cm gravity well. Keep the layout symmetric (see note).",
    steps: [
      cerbLd(4),
      { t: "Place the medium planet halfway along one long edge, 20 cm in, and Alurmen (a small planet, treated as a moon) on the centre line far from it, equally distant from both corners of that edge." },
      { t: "Roll four D6: for each 4+, roll once on the mercurial zone generator, re-rolling planets. Take turns placing them, nothing within 45 cm of either Alurmen or the planet." },
      { t: "Set up the low orbit table, with Eldar defence stations evenly along its planet edge: one per 500 pts of each fleet’s allowance, half weapons batteries and half pulsar lances." },
      { t: "The winner of Hold the Line picks a corner zone. Roll off; the winner chooses who places first; then take turns placing one ship or squadron. Over 3000 pts: split each fleet into two equal waves, the second moving on at each player’s second turn from their zone’s edges." },
      { t: "Roll off. The winner chooses who goes first." }
    ],
    notes: [OLD + "Planetary Assault: RB p. 136–137. Low orbit: RB p. 116 (the magazine points to old p. 48).",
      "The magazine’s map puts both fleet corners 100 cm from Alurmen and the planet, and Alurmen’s centre 90 cm from the far table edge — a deeper table than 120 cm. Keep Alurmen equally far from both set-up zones and as far from the planet as your table allows.",
      "Alurmen is not a ship or defence: it can only be attacked by landing assault points from low orbit."],
    refs: [["Planetary Assault", "RB p. 136–137"], ["Low orbit table", "RB p. 116"], ["Mercurial zone generator", "RB p. 107"], ["Space Marine Gladius, Sword", "FL p. 102–"]],
    play: [
      { w: "Landing troops", t: "On the low orbit table, each turn a capital ship spends within 30 cm of Alurmen’s edge and more than 45 cm from any intact defence station scores 2 assault points (1 if crippled). Not if it shot, launched ordnance or was on special orders that turn." },
      { w: "Space Marines", t: "Their capital ships get no extra troops. One squadron of Gladius or Sword escorts may carry troops instead: each one that lands on the planet edge scores 1 assault point and is removed." },
      { w: "Eldar defence stations", t: "Defence/1, armour 5+, a 4+ save against any damage and against hit-and-run effects; either a weapons battery (45 cm, firepower 6) or pulsar lances (45 cm, strength 2), front arc. At the end of every ordnance phase each fires at the nearest target in range (D6 if tied), ignoring lone fighters. It cannot be attacked until it has fired once." },
      { w: "The Venturer", s: "a", t: "Its holder may use Lysander’s re-rolls for the whole fleet. On the low orbit table, the Venturer or one friendly ship or squadron within 15 cm may ignore the 4+ save of one defence station within 45 cm when shooting at it." },
      ...AHRIMAN,
      { w: "End of each end phase", t: "Compare assault points: a lead of 8 or more wins." }
    ],
    fx: () => [[null, "End phase: compare assault points — a lead of 8 wins"]],
    tools: [
      { k: "counter", id: "apa", l: "Rivals: assault points", s: "a", res: 1 },
      { k: "counter", id: "apb", l: "Ahriman: assault points", s: "b", res: 1 },
      { k: "info", html: st => { const d = get(st, "apa", 0) - get(st, "apb", 0); return "<h3>Lead</h3><p class='calc'>" + (d === 0 ? "Level." : (d > 0 ? "The rivals" : "Ahriman") + " lead by <b>" + Math.abs(d) + "</b>" + (Math.abs(d) >= 8 ? " — that wins!" : " (8 wins).")) + "</p>"; } }
    ],
    rtools: [{ k: "ending", id: "how", l: "How did it end?", rows: [["The rivals led by 8 assault points", "a"], ["Ahriman led by 8 assault points", "b"], ["Ahriman’s fleet disengaged or was destroyed", "a"], ["The rivals’ fleet disengaged or was destroyed", "b"]] }],
    end: ["When one side’s assault points are 8 or more ahead at the end of an end phase.", "Or when one fleet disengages or is destroyed."],
    win: ["The side 8 assault points ahead takes Alurmen and wins the campaign.", "If a fleet disengages or is destroyed, the other side wins."],
    result(st, v, S) { const d = get(st, "apa", 0) - get(st, "apb", 0); if (d >= 8) return ["a", "Ahriman’s rivals take Alurmen", "Lead of " + d + " assault points."]; if (d <= -8) return ["b", "Ahriman takes Alurmen", "Lead of " + -d + " assault points."]; const i = get(st, "how", -1); return i >= 0 ? endingResult(st, S, "how") : [null, "Battle in progress", "Assault points " + get(st, "apa", 0) + " – " + get(st, "apb", 0) + "."]; },
    info: { bg: "Battered by the warp and by the Necrons, Ahriman’s fleet reached Alurmen and its webway nexus, through which he hoped to reach the Black Library of the Eldar and become a god. But another armada arrived at the same time, its ships packed with troops. The magazine left the outcome open: the readers’ results were to decide it.", cr: [CERB, "Scenario 4 is in " + BM(14) + ", p. 27–31 (PDF p. 29–33), with Ahriman’s rules and the Eldar defences on p. 31."] }
  }
  ]);
})();
