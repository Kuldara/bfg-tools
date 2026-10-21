/* Warp Rift community scenarios without play reports (class L4), part B:
   The Hunt for the Eldar 1–2 (WR16), Convoy Battle (WR19), Contact! (WR23/WR32),
   Falling Down (WR24) and the Darkening Technology Raid (WR25).
   Summarised in our own words; each scenario hand-made (see LUEMINUT.md). */
(function () {
  const NO_REPORT = "Community scenario; the source gives no play report.";
  const FAFRIN = "Alun “Fafrin” Lucas";
  const HUNT_BG = "The Corsairs’ Haven is their hidden home: a spire always tucked in the middle of an asteroid field and moved through the webway once found. A hunting fleet sweeps the fields to find it before the Eldar can slip away.";
  const havenStats = d => { const k = Math.min(5, Math.floor(d / 4)); return k >= 5 ? "The Haven is destroyed." : "Now: shields " + (5 - k) + " + holofield · turrets " + (5 - k) + " · pulsar lances " + (5 - k) + " · batteries " + (20 - 4 * k) + " · launch bays " + (5 - k) + " · torpedoes " + (5 - k) + "."; };

  addScenarios([
  /* ------------------------------------------------------------ HUNT 1 */
  {
    id: "wr-eldar-hunt-1", grp: "untested", name: "The Hunt for the Eldar 1: The Asteroids", series: "Eldar Haven · linked pair 1/2", trust: "untested",
    why: NO_REPORT + " The author’s group used it to introduce their Haven rules.", src: "Warp Rift 16, p. 48", book: "K", suggest: ["Any hunter", "Eldar Corsairs"],
    others: "The hunted side can be any raider fleet with a hidden base; the Eldar are only the natural fit.",
    sides: { a: { n: "Searchers", f: "Any fleet" }, b: { n: "Eldar", f: "Eldar Corsairs" } },
    pitch: "Six asteroid fields; one of them hides the Eldar Haven. Sweep them all to find it, while the Eldar fight to keep you out as long as they dare.",
    glance: [["Points", "Searchers 1500 · Eldar 1000"], ["Table", "Any"], ["Battlezone", "Outer Reaches: six asteroid fields"], ["First turn", "Not given"], ["Victory", "Search all six fields"]],
    bring: ["Six asteroid fields of random shape", "Plenty of ordnance markers"],
    forces: { a: ["1500 pts. Bring plenty of ordnance: attack craft count for searching."], b: ["1000 pts. Only your uncrippled ships go on to part 2."] },
    draw: (v, W, H) => { const out = [{ z: "edge", e: "t", s: "n", dash: 1, l: "sunward long edge" }, { z: "edge", e: "l", s: "a", l: "Searchers" }, { z: "edge", e: "r", s: "b", l: "Eldar" }];
      for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) { const cx = W * (i + .5) / 3, cy = H * (j + .5) / 2; out.push({ z: "hatch", x: cx - 11 + (i % 2 ? 4 : -3), y: cy - 9 + (j ? -3 : 3), w: 22, h: 18, l: "" }, { z: "text", x: cx, y: cy + 15, l: String(i * 2 + j + 1) }); }
      return out; },
    fit: () => [90, 60],
    mapNote: "One field in each sixth of the table; the article leaves their shapes and sizes random.",
    steps: [
      { t: "Outer Reaches. Place six asteroid fields of random shape and size, about one in each sixth of the table." },
      { t: "Declare one long edge sunward." },
      { s: "a", t: "Deploy on one short edge." },
      { s: "b", t: "Deploy on the opposite short edge." }
    ],
    notes: ["No first turn, deployment depth or turn limit is given — roll off and agree.", "“Unopposed” is read as: your ships or ordnance in the field with no enemy ship or ordnance in it."],
    refs: [["Asteroid fields", "RB p. 104–116"], ["Disengaging", "RB p. 56"]],
    play: [{ w: "Searching", s: "a", t: "A field is searched when you have ships or ordnance in it, unopposed. Searching all six reveals the Haven." }, { w: "Withdrawing", s: "b", t: "Hold out as long as you can — withdrawing ends the game and gives the searchers a minor victory. Fighting late keeps them from finding the Haven." }],
    tools: [{ k: "counter", id: "f", l: "Fields searched", s: "a", max: 6, goal: 6 }, { k: "toggle", id: "wd", l: "The Eldar have withdrawn", s: "b" }],
    end: ["When the Eldar withdraw (or all six fields are searched)."],
    win: ["Searching all six fields reveals the Haven: go on to part 2.", "The Eldar withdrawing gives the searchers a minor victory; the Eldar win big if the Haven is never found.", "Only uncrippled ships go on to part 2."],
    result(st, v, S) { const f = get(st, "f", 0); return f >= 6 ? ["a", "The Haven is found", "Play part 2 with each side’s uncrippled ships."] : get(st, "wd", false) ? ["a", "Searchers’ minor victory", "The Eldar withdrew; " + f + " of 6 fields searched. Uncrippled ships go on to part 2."] : [null, "Battle in progress", f + " of 6 fields searched."]; },
    info: { bg: HUNT_BG, cr: [wrCredit(16, FAFRIN), "Written for the author’s group’s Haven rules, which used the Eldar MMS 1.6 fan rules of the time."] }
  },
  /* ------------------------------------------------------------ HUNT 2 */
  {
    id: "wr-eldar-hunt-2", grp: "untested", name: "The Hunt for the Eldar 2: The Haven", series: "Eldar Haven · linked pair 2/2", trust: "untested",
    why: NO_REPORT, src: "Warp Rift 16, pp. 47, 49", book: "E", suggest: ["Any hunter", "Eldar Corsairs"],
    others: "The Haven Spire is a fan profile (below). The official Eldar Haven space station (FL p. 334) can stand in if you prefer book rules.",
    sides: { a: { n: "Searchers", f: "Any fleet" }, b: { n: "Eldar", f: "Eldar Corsairs + Haven Spire" } },
    pitch: "The Haven is found. Cross the asteroid ring and destroy it before it slips away through the webway.",
    glance: [["Points", "Survivors of part 1 + the Haven (500)"], ["Table", "Any"], ["Battlezone", "A 15 cm asteroid ring around the Haven"], ["First turn", "Not given"], ["Victory", "Destroy the Haven or drive it off"]],
    bring: ["A Haven model", "Asteroids for a ring around it"],
    forces: { a: ["Your uncrippled ships from part 1."], b: ["Your uncrippled ships from part 1.", "The Haven Spire (500 pts, profile in Play)."] },
    draw: (v, W, H) => { const r = Math.min(37.5, Math.min(W, H) / 2 - 4); return [{ z: "ring", cx: W / 2, cy: H / 2, r, ast: 1, sw: 15 }, { z: "mark", x: W / 2, y: H / 2, s: "b", l: "Haven" },
      { z: "dim", x1: W / 2, y1: H / 2 + 20, x2: W / 2 + r - 7.5, y2: H / 2 + 20, l: "30 cm" }, { z: "text", x: W / 2, y: H / 2 + 30, l: "Eldar: anywhere inside", s: "b" },
      { z: "text", x: 42, y: 7, l: "searchers: anywhere outside", s: "a" }]; },
    fit: () => [100, 100],
    mapNote: "The ring’s inner edge is 30 cm from the Haven and it is 15 cm thick, so it needs a table at least about 100 cm deep.",
    steps: [
      { t: "Place the Haven in the centre. Build an asteroid ring around it: inner edge 30 cm from the Haven, 15 cm thick." },
      { s: "b", t: "Set up your surviving ships anywhere inside the ring; they and the Haven may have attack craft out on patrol." },
      { s: "a", t: "Set up your surviving ships anywhere outside the ring, facing any way. Your first move takes you into the field — Leadership tests for collision damage." }
    ],
    notes: ["No first turn or turn limit is given — roll off and agree.", "The Haven rules were written for the Eldar MMS 1.6 fan rules; with the Remastered Eldar rules use them as written and agree any clashes."],
    refs: [["Asteroid fields", "RB p. 104–116"], ["Eldar Haven (official alternative)", "FL p. 334"]],
    play: [
      { w: "Haven Spire", s: "b", t: "Defence, 20 hits, speed 5 cm and may move in any direction, shields 5 plus holofield, armour 5+, turrets 5, Leadership 10. Pulsar lances 30 cm strength 5, batteries 45 cm strength 20, launch bays 5 (fighters 30 cm, bombers 20 cm), torpedoes 30 cm strength 5, all round. Its speed never drops from blast markers or damage." },
      { w: "Haven damage", t: "Every 4 damage removes a fifth of everything (tracker below). A critical hit adds 1 damage and does nothing else." }
    ],
    tools: [{ k: "counter", id: "dmg", l: "Damage on the Haven", s: "a", max: 20, warn: havenStats }, { k: "toggle", id: "gone", l: "The Haven has disengaged", s: "b" }],
    end: ["The Haven is destroyed or disengages, or the searchers are beaten off."],
    win: ["Searchers win if they destroy the Haven or force it to disengage.", "The Eldar have a minor victory if they prevent it."],
    result(st) { return get(st, "dmg", 0) >= 20 ? ["a", "Searchers win", "The Haven is destroyed."] : get(st, "gone", false) ? ["a", "Searchers win", "The Haven was driven off."] : [null, "Battle in progress", "If the Haven survives, the Eldar have a minor victory."]; },
    info: { bg: HUNT_BG + " Found, the Haven gets one chance to fight before it redeploys — the author’s damage track lets the Eldar cut and run as it falls apart.", cr: [wrCredit(16, FAFRIN), "Haven Spire profile and damage track from the same article (p. 47)."] }
  },
  /* ------------------------------------------------------------ CONVOY BATTLE */
  {
    id: "wr-convoy-battle", grp: "untested", name: "Convoy Battle", series: "Anargo Sector Project", trust: "untested",
    why: NO_REPORT, src: "Warp Rift 19, pp. 29–30", book: "K", suggest: ["Imperial Navy", "Any attacker"],
    others: "Written for Imperial convoys (Navy, Space Marine, Rogue Trader or Mechanicus escorts), but any fleet with transports can play the convoy.",
    sides: { a: { n: "Convoy", f: "Imperial Navy and allies" }, b: { n: "Attacker", f: "Any fleet" } },
    pitch: "The convoy is chased into the jaws of a second attack group. Survival is measured in cargo: what share of it gets through?",
    glance: [["Points", "Equal; convoy adds transports"], ["Table", "Any"], ["Battlezone", "Agreed; often deep space"], ["First turn", "Roll off; winner chooses"], ["Victory", "Share of cargo surviving"]],
    bring: ["Transports (see the calculator)"],
    forces: {
      a: ["Equal points of warships, plus transports: 1.5 cargo points per 100 pts of warships (2000 pts → 30).", "Upgrades on transports come out of your points."],
      b: ["Equal points, split by cost into group A (25–50%) and group B (the rest)."]
    },
    draw: (v, W, H) => [R(0, 0, 30, H, "b", "Group B: 30 cm", { rot: -90 }), R(W - 30, 0, 30, H, "b", "Group A: 30 cm", { rot: 90 }),
      R(60, 0, Math.max(0, W - 120), H, "a", "convoy: 30 cm+ from the enemy", { dash: 1 }),
      { z: "arrow", x1: 34, y1: H * .82, x2: 54, y2: H * .82, s: "b", l: "" }, { z: "arrow", x1: W - 34, y1: H * .82, x2: W - 54, y2: H * .82, s: "b", l: "" }],
    fit: () => [150, 50],
    mapNote: "The deployment map the text mentions was not printed. Group B chases the convoy towards group A; the arrows show the facing used here — every ship in a zone faces the same way.",
    steps: [
      { t: "Place phenomena by any agreed method." },
      { s: "b", t: "Split your fleet by points: 25–50% in group A, the rest in group B. Deploy group B within 30 cm of one short edge, all facing the same way." },
      { s: "a", t: "Deploy anywhere not within 30 cm of an enemy ship." },
      { s: "b", t: "Deploy group A within 30 cm of the other short edge, all facing the same way." },
      { t: "Roll off: the winner chooses who goes first." }
    ],
    stools: [{ k: "num", id: "pts", l: "Convoy warship points", after: n => n ? "Needs <b>" + Math.ceil(n * 1.5 / 100) + "</b> cargo points — e.g. " + Math.ceil(n * 1.5 / 200) + " standard transports at 2 points each." : "Type your warship points." }],
    notes: ["Cargo points are the Anargo Sector Project’s: its example counts 30 points as fifteen freighters or three heavy barges. Counting a standard transport as 2 is our reading; a heavy transport counts as two transports in the current rules (FL p. 182).", "The survival levels are read as bands: 0–29% attacker’s major win, 30–59% attacker’s win, 60–89% convoy’s win, 90%+ convoy’s major win."],
    refs: [["Transports", "FL p. 85"], ["Heavy transport", "FL p. 182"], ["Disengaging", "RB p. 56"]],
    play: [{ w: "Transports", s: "a", t: "Transports may only disengage once crippled. A crippled transport that gets away counts as surviving (with half its cargo). Everything else disengages normally." }],
    tools: [],
    rtools: [{ k: "num", id: "c0", l: "Cargo points at the start", after: n => n ? "" : "" }, { k: "num", id: "c1", l: "Cargo points surviving (crippled = half, round down)", after: n => n ? "" : "" }],
    end: ["When either fleet is destroyed or disengages."],
    win: ["Percentage of cargo points surviving: 0% total disaster, 30% attacker’s win, 60% the convoy gets through, 90% a crushing defeat for the attacker."],
    result(st, v, S) { const a = num(st, "c0"), b = num(st, "c1"); if (!a) return [null, "Score the cargo", "Enter cargo points at the start and surviving below."];
      const p = Math.round(100 * Math.min(b, a) / a); return p >= 90 ? ["a", "Convoy’s major win", p + "% of the cargo survived."] : p >= 60 ? ["a", "Convoy’s win", p + "% of the cargo survived."] : p >= 30 ? ["b", "Attacker’s win", p + "% of the cargo survived."] : ["b", "Attacker’s major win", p + "% of the cargo survived."]; },
    info: { bg: "An Imperial merchant convoy tries to avoid a large enemy fleet but is trapped; reserves hang back to hunt any transport that breaks away, so the merchant captains hold formation.", cr: [wrCredit(19, "CELS"), "From the Anargo Sector Project, a fan campaign setting."] }
  },
  /* ------------------------------------------------------------ CONTACT! */
  {
    id: "wr-limante-contact", grp: "untested", name: "Contact!", series: "Battlefleet Limante", trust: "untested",
    why: NO_REPORT + " A historical refight from the author’s sector setting.", src: "Warp Rift 32, p. 20 (first version Warp Rift 23, p. 13)", book: "O", suggest: ["Imperial Navy", "Orks"],
    others: "The forces are a historical refight; any raider against a sleeping garrison can use the set-up.",
    sides: { a: { n: "Garrison", f: "Imperial Navy" }, b: { n: "Ork raid", f: "Orks" } },
    pitch: "The first Ork attack on the sector catches the fleet asleep at its dock: wake up, get the transports out, and find out why your guns barely scratch them.",
    glance: [["Points", "Historical forces"], ["Table", "180 × 120 cm in six parts"], ["Battlezone", "Fixed; a solar flare"], ["First turn", "As Planetary Assault (roll off)"], ["Victory", "As Planetary Assault"]],
    bring: ["A planet and a moon with a dock", "An asteroid field 15 × 7.5 cm", "A gas cloud 12.5 × 10 cm", "Low orbit table"],
    forces: {
      a: ["Lunar “Divine Judgement” (nova cannon, Ld 10) — with a reactor leak.", "Dauntless “Aarwa’s Bane” (torpedoes, Ld 8).", "4 heavy transports “Red 5” (Ld 6).", "2 Cobras “Tac Patrol” (Ld 8); 3 Cobras “Scrubbers” (Ld 9).", "3 escort carriers “Detio” (Ld 8). No fleet commander."],
      b: ["Kill Kroozer “Waaagh of Doom”: Warboss with mega-armoured boarding Nobz, Ld 7.", "Terror Ship “’Ere We Go!”: Warboss with looted torpedoes and maniac gunners, Ld 8.", "Brutes: 3 “Smash!” (Ld 7), 3 “Kill!” (Ld 6), 2 “What?” (Ld 8), 2 “Where?” (Ld 7).", "5 Ravagers “Squeee!” (Ld 7)."]
    },
    draw: (v, W, H) => [{ z: "line", x1: W / 2, y1: 0, x2: W / 2, y2: H }, { z: "line", x1: 0, y1: H / 3, x2: W, y2: H / 3 }, { z: "line", x1: 0, y1: 2 * H / 3, x2: W, y2: 2 * H / 3 },
      { z: "hatch", x: W / 4 - 7.5, y: H / 6 - 3.75, w: 15, h: 7.5, l: "" }, { z: "planet", cx: W / 4, cy: H / 2, r: 9, l: "Imego V" },
      { z: "planet", cx: 3 * W / 4, cy: H / 2, r: 3.5, l: "" }, { z: "mark", x: 3 * W / 4 + 6, y: H / 2, s: "a", l: "dock: transports" },
      { z: "ring", cx: W / 4, cy: 5 * H / 6, r: 3, gas: 1, sw: 6 }, { z: "ring", cx: W / 4, cy: 5 * H / 6, r: 3.2, gas: 1, sw: 6 }, { z: "text", x: W / 4, y: 5 * H / 6 + 12, l: "gas cloud" },
      { z: "edge", e: "l", s: "b", l: "Orks: from the planet’s edge" }, { z: "corner", c: "tr", r: 18, s: "b", l: "Orks" }, { z: "corner", c: "br", r: 18, s: "a", l: "escape" }],
    fit: () => [120, 80], srcTable: [180, 120],
    mapNote: "The table is cut into six parts (two columns, three rows). Imego V is in the middle left, its moon and the dock in the middle right. The corner marks follow the history: Orks from behind the asteroids and the top right, the escape point bottom right.",
    steps: [
      { t: "Divide a 180 × 120 cm table into six parts. Top left: a 15 × 7.5 cm asteroid field. Middle left: the abandoned planet Imego V. Middle right: its moon, with the dock. Bottom left: a 12.5 × 10 cm gas cloud. The right-hand parts are otherwise empty. A solar flare is under way." },
      { s: "a", t: "The transports start docked at the moon; everything else is on stand down nearby." },
      { s: "b", t: "Enter from the planet’s edge and the top right, behind the asteroids." },
      { t: "Otherwise play as Planetary Assault (RB p. 136), with the Orks as the attacker." }
    ],
    notes: ["The first version (Warp Rift 23) calls the flare “possible”; the second says one is under way. The second is used here.", "Neither version gives Imperial deployment positions beyond the dock, or a victory condition other than “use Planetary Assault”. The history — transports running for the jump point — suggests agreeing a bonus for transports escaping past the bottom right corner.", "The Widowmaker sensor array on the Scrubbers is the author’s own upgrade with no rules given."],
    refs: [["Planetary Assault", "RB p. 136–137"], ["Solar flares", "RB p. 114"], ["Escort carrier", "FL p. 521"], ["Ork ships and refits", "FL p. 361–393"]],
    play: [
      { w: "Stand down", s: "a", t: "All your ships start on stand down except the transports. A stood-down ship needs a passed Leadership test to come to battle stations and load weapons; until then it may only Brace and make one 45° turn, and counts as a defence that cannot move." },
      { w: "Leaving the dock", s: "a", t: "Each transport must pass a Leadership 6 test to leave the dock (skeleton crews). They may try from the first turn." },
      { w: "Reactor leak", s: "a", t: "Whenever the Divine Judgement moves more than 10 cm, place a blast marker every 5 cm of the move and one on its base at the end. A successful repair ends this." },
      { w: "Resilient", s: "b", t: "Every Ork ship has a 5+ save against all damage except boarding — including attack craft and torpedoes." },
      { w: "Scarce ordnance", t: "Both sides reload ordnance at −1 Leadership, after all other modifiers." }
    ],
    tools: [{ k: "counter", id: "ap", l: "Ork assault points", s: "b", goal: 10, res: 1 }, { k: "toggle", id: "leak", l: "The reactor leak is repaired", s: "a" }, { k: "counter", id: "esc", l: "Transports escaped", s: "a", max: 4 }],
    rtools: [
      { k: "num", id: "avp", l: "Ork victory points", s: "b", after: v => "+" + Math.floor(v / 500) + " assault points" },
      { k: "num", id: "dvp", l: "Imperial victory points", s: "a", after: v => "−" + Math.ceil(v / 500) + " assault points" }
    ],
    end: ["As Planetary Assault: one fleet destroyed or disengaged, or 10 assault points."],
    win: ["As Planetary Assault (RB p. 137): assault points, +1 per 500 Ork VP, −1 per 500 Imperial VP; 0–1 defender’s victory, 2–5 defender’s marginal, 6–9 attacker’s marginal, 10+ attacker’s victory."],
    provisional: PA_PROV,
    result(st) {
      const t = get(st, "ap", 0) + Math.floor(num(st, "avp") / 500) - Math.ceil(num(st, "dvp") / 500);
      const r = t >= 10 ? ["b", "Orks’ victory"] : t >= 6 ? ["b", "Orks’ marginal win"] : t >= 2 ? ["a", "Garrison’s marginal win"] : ["a", "Garrison’s victory"];
      return [r[0], r[1], "Adjusted total: " + t + " assault points (RB p. 137)." + (get(st, "esc", 0) ? " Transports escaped: " + get(st, "esc", 0) + "." : "")];
    },
    info: { bg: "The first recorded clash with Orks in the Limante sector. Hiding their approach in a solar flare, the Orks disabled the orbital platforms and fell on a fleet still at its dock. Both cruisers and nearly all the escorts were lost covering the transports’ escape, and not one Ork ship was destroyed.", cr: [wrCredit(23, "Bryan McMahon"), "Revised as “Contact!” with the Battlefleet Limante fleet entries in Warp Rift 32 (whose page header says Issue 30 by mistake)."] }
  },
  /* ------------------------------------------------------------ FALLING DOWN */
  {
    id: "wr-falling-down", grp: "untested", name: "Falling Down", series: "Distant Darkness · prequel", trust: "untested",
    why: NO_REPORT + " A prequel to the author’s Distant Darkness fiction.", src: "Warp Rift 24, pp. 32–33", book: "O", suggest: ["Tau", "Dark Eldar"],
    others: "The trick works with any raider walking into a fake convoy; the hidden side must be able to look like transports and escorts.",
    sides: { a: { n: "Tau raid", f: "Tau" }, b: { n: "The “convoy”", f: "Dark Eldar posing as Imperial ships" } },
    pitch: "A Tau light cruiser springs a careful ambush on an Imperial convoy — which turns out to be a Dark Eldar trap. Do not show the Play tab to the Tau player.",
    glance: [["Points", "Fixed forces"], ["Table", "Any"], ["Battlezone", "A gas giant and an asteroid field"], ["First turn", "Not given"], ["Victory", "Victory points (skirmish)"]],
    bring: ["A large gas giant", "A 30 cm asteroid field", "Imperial convoy models — and the Dark Eldar ships that replace them"],
    forces: {
      a: ["Emissary light cruiser commanded by Nua’ta (Ld 8).", "3 Castellan escorts.", "The author uses Taros-pattern versions; the standard ones work."],
      b: ["Shown as: a heavy transport, 3 transports and 2 Swords.", "In truth (revealed in play): 3 Corsair escorts and a Dark Eldar light cruiser — two transports are real."]
    },
    draw: (v, W, H) => [{ z: "planet", cx: W / 2, cy: H - 16, r: 14, l: "" }, { z: "hatch", x: W / 2 - 15, y: H - 16 - 14 - 30, w: 30, h: 9, l: "" }, { z: "text", x: W / 2, y: H - 64, l: "asteroids, 30 cm (Castellans hide here)", s: "a" },
      { z: "arrow", x1: 12, y1: H - 40, x2: W - 30, y2: H - 40, s: "b", l: "" }, { z: "text", x: 40, y: H - 46, l: "convoy route", s: "b" },
      { z: "edge", e: "l", s: "b", l: "Convoy enters" }, { z: "edge", e: "r", s: "a", l: "Nua’ta" }],
    fit: () => [100, 80],
    mapNote: "The map printed with the scenario belongs to a Tyranid scenario, so this one is drawn from the text: the convoy passes between the asteroid field and the gas giant, Nua’ta comes from the far side.",
    steps: [
      { t: "Set up a large gas giant with a 30 cm long asteroid field in its gravity well. The convoy’s route runs between the field and the planet." },
      { s: "a", t: "Hide the three Castellans in the asteroid field: they attack after the convoy has passed." },
      { s: "a", t: "Nua’ta deploys on the side of the table opposite the convoy and must be in position as the convoy arrives at the field." },
      { s: "b", t: "Bring the “convoy” on as Imperial ships. Its escorts may not leave formation or attack until the convoy reaches the field." }
    ],
    notes: ["No first turn, deployment depths or game length are given.", "The Dark Eldar light cruiser is the author’s profile (in Play)."],
    refs: [["Tau ships", "FL p. 458–"], ["Dark Eldar ships", "FL p. 352–"], ["Boarding actions", "RB p. 89"]],
    play: [
      { w: "The reveal", s: "b", t: "When the convoy reaches the asteroid field: the two Swords and one transport become three Corsair escorts; the heavy transport becomes a Dark Eldar light cruiser. The other two transports stay transports." },
      { w: "Leaving", t: "No ship may disengage except by moving off a table edge." }
    ],
    tools: [
      { k: "toggle", id: "rev", l: "The trap is sprung", s: "b" },
      { k: "html", html: "<h3>Dark Eldar light cruiser</h3><table class='ltab'><tr><td>Profile</td><td>4 hits · 40 cm · 90° · shadowfield · armour 5+ · no turrets</td></tr><tr><td>Weapons</td><td>Prow batteries 30 cm, strength 6, front · prow phantom lance 30 cm, strength 2, front</td></tr></table>" }
    ],
    end: ["Not given — play it as a skirmish until one side is gone."],
    win: ["Normal victory points, except Nua’ta’s Emissary is worth double if hulked in a boarding action."],
    result() { return [null, "Count victory points", "Double for the Emissary if it was hulked by boarding."]; },
    info: { bg: "Before the Distant Darkness story, Nua’ta commanded a Tau light cruiser raiding lightly defended Imperial targets. A convoy captain secretly loyal to the Tau passed on its route — or so the Tau believed.", cr: [wrCredit(24, "Zhai Morenn"), "Part of the Distant Darkness fan project; the issue also carries the story that leads into the battle."] }
  },
  /* ------------------------------------------------------------ DARKENING TECHNOLOGY RAID */
  {
    id: "wr-darkening-raid", grp: "untested", name: "Darkening Technology Raid", series: "Stealth raid · solo or two players", trust: "untested", players: [1, 2],
    variants: [["solo", "Solo"], ["duo", "Two players"]],
    why: NO_REPORT + " Built on the author’s own stealth house rules, summarised here.", src: "Warp Rift 25, pp. 10–12", book: "E", suggest: null,
    others: "Written for any fleets; the author covers Eldar (escort frigates carry the field) and Orks (easier to detect) too.",
    sides: { a: { n: "Raiders", f: "Any fleet" }, b: { n: "Rear-area garrison", f: "Any fleet" } },
    pitch: v => v === "solo" ? "Play the raider against a scripted garrison: creep in under a stealth field, hit the cargo ships, and get out the far side." : "A small raiding force creeps towards a sleepy rear-area world as a single hidden marker. Find it before it finds the cargo ships.",
    glance: v => [["Points", "Fixed forces"], ["Table", "180 × 120 cm"], ["Battlezone", "A planet and a moon only"], ["Players", v === "solo" ? "Solo (you are the raider)" : "Two"], ["Victory", "Points balance of a raid"]],
    bring: ["A medium planet and a small moon", "8 cargo ships", "Stealth markers (one real, one false)"],
    forces: {
      a: ["A battlecruiser (or equivalent) with fighter and bomber bays, no assault boats.", "A light cruiser, or 4 frigates.", "Roll random Leadership."],
      b: ["A light cruiser (or 3 destroyers) on patrol.", "4 frigates, parked.", "8 cargo ships (Ld 6): 4 in orbit, 4 holding station in a box.", "2 airfields on the planet. Roll random Leadership for the warships."]
    },
    draw: (v, W, H) => { const cx = W / 2, cy = H / 2, ax = Math.max(8, cx - 10 - 60);
      return [{ z: "planet", cx, cy, r: 10, l: "" }, { z: "ring", cx, cy, r: 20, s: "b" }, { z: "text", x: cx, y: cy + 25, l: "4 cargo ships, 10 cm out", s: "b" },
        { z: "planet", cx, cy: Math.max(4, cy - 10 - 40), r: 4, l: "" }, { z: "text", x: cx - 16, y: Math.max(4, cy - 10 - 40), l: "moon" }, R(cx - 5, cy - 10 - 20 - 5, 10, 10, "b", ""), { z: "text", x: cx + 40, y: cy - 30, l: "cargo box, 20 cm out", s: "b" },
        { z: "mark", x: Math.min(W - 6, cx + 10 + 30), y: cy, s: "b", l: "patrol" },
        ...(v === "solo" ? [{ z: "mark", x: ax, y: cy, s: "a", l: "" }, { z: "text", x: ax, y: cy - 9, l: "raiders, 60 cm out", s: "a" }] : [{ z: "edge", e: "l", s: "a", l: "Raider marker enters" }]),
        { z: "edge", e: "r", s: "a", l: "Raiders exit here" }]; },
    fit: () => [150, 110], srcTable: [180, 120],
    mapNote: "The frigates are parked 20 cm from the planet and 15 cm from the parked cargo ships — place them by eye between the two groups.",
    steps: [
      { t: "Place a medium planet in the centre of a 180 × 120 cm table and a small moon 40 cm from it, towards the middle of one long edge. Nothing else." },
      { s: "b", t: "Place 4 cargo ships orbiting 10 cm from the planet, evenly spaced, and 4 more 20 cm out, midway towards the moon, in a box 5 cm apart. Park the 4 frigates 20 cm from the planet and 15 cm from the cargo ships." },
      { s: "a", only: ["solo"], t: "Place your force 60 cm from the planet edge, between the planet and the short edge of your choice, with the light cruiser within 7 cm of the battlecruiser. Running silent: no turns, no shields, no energy weapons." },
      { s: "a", only: ["duo"], t: "Your force is a stealth marker starting on a short edge (plus false markers if you like, at most one per two real ones, all 10 cm apart). Sketch where the ships really are: within 7 cm of the battlecruiser. Markers move 15 cm a turn." },
      { s: "b", t: "Place the patrolling light cruiser 30 cm out, on the far side of the planet from the raiders, bow towards a long edge. It moves 15 cm a turn and ends each move 30 cm from the planet until combat starts." }
    ],
    notes: ["The solo version leaves the garrison’s play after activation to you; the author only scripts the patrol and the detection.", "In the two-player version the attacker reveals ships at the distances of the stealth rules once detected."],
    refs: [["Leadership tests", "RB p. 45"], ["Attack craft", "RB p. 79–86"]],
    play: [
      { w: "Every turn", s: "b", only: ["solo"], t: "The planet tries to detect the raiders: Leadership 8, −2 for the stealth field — a 6 or less on 2D6." },
      { w: "Every turn", s: "b", only: ["duo"], t: "A capital ship within 60 cm of a marker may try to detect it with its Leadership −2, instead of shooting (one try a turn; the planet tries with Leadership 8). On a success roll which marker is found; a false one is removed. Active ships within 30 cm see a marker automatically; fighters and bombers within 10 cm." },
      { w: "Detected", s: "b", t: "The patrol breaks orbit and heads straight for the raiders. Every other warship rolls its Leadership to activate, and moves and fights from the turn after." },
      { w: "Powering up", s: "a", t: "Turning, raising shields or firing energy weapons drops the stealth. In the first combat phase after that, only batteries and ordnance may fire — no lances or nova cannon. From then on, everything." },
      { w: "Airfields", s: "b", t: "Up to 4 markers a turn, fighters or bombers, no assault boats; at most 3 launches (12 markers). A launch sits on the planet’s centre the first ordnance phase, at its edge the next, then moves normally. No reloads needed." },
      { w: "Leaving", s: "a", t: "Leave over the short edge opposite the one you came from." }
    ],
    fx: () => [],
    tools: [{ k: "toggle", id: "det", l: "The raiders have been detected", s: "b" }, { k: "counter", id: "air", l: "Airfield launches used", s: "b", max: 3 },
      { k: "counter", id: "cargo", l: "Cargo ships destroyed (50 each)", s: "a", max: 8 }],
    end: ["When the raiders have left the far short edge or been destroyed."],
    win: ["50 per cargo ship destroyed plus normal points for warships, minus the cost of every raider lost.", "Any enemy losses make it a successful raid — the balance shows how successful."],
    result(st) { return [null, "Count the raid’s balance", get(st, "cargo", 0) * 50 + " from cargo ships, plus warships destroyed, minus your own losses."]; },
    info: { bg: "Rear-area systems away from the front are lax about security. A small raiding force runs silent under a field that cancels its emissions — the author’s answer to how fleets in Battlefleet Gothic so often get so close before anyone opens fire. The idea comes from submarines slipping into harbours.", cr: [wrCredit(25, "Reg Steiner"), "The stealth rules come from the author’s article “Darkening Technology” in the same issue, written for their own fiction."] }
  }
  ]);
})();
