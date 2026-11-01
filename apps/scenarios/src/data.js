import { esc } from "./helpers.js";
import { fleetArr } from "./scenario-page.js";
import { d6, endingResult, entryInfo, get, num, save, wins } from "./state.js";

"use strict";
/* ---------------------------------------------------------------- data */
export const WR = "https://specialist-arms.com/bfg/warprift/";
export const TRUST = {
  rulebook:  { l: "Rulebook",      d: "Printed in the BFG Remastered Rulebook v1.11." },
  fleets:    { l: "Fleets book",   d: "Printed in the BFG Remastered Fleets book v0.40." },
  classic:   { l: "Classic GW",    d: "Published by Games Workshop or its Fanatic imprint, 1999–2008, for the original rules." },
  wr:        { l: "Warp Rift",     d: "From the Warp Rift fan magazine. Everything in it is fan work, whoever wrote it." },
  fan:       { l: "Fan supplement", d: "From a fan-made supplement or tournament pack outside Warp Rift. Fan work, like Warp Rift." }
};
/* Warp Rift is one category (owner 21.10.: no quality classes on the page); Warp Rift's old split is in the tags.
   Tags show on the card and are found by search; alias = search words that are not shown. */
export const WR_TAG = { committee: ["Rules writer"], lore: ["Lore competition"], community: ["Community", "Played"], untested: ["Community"] };
/* Rules writer is about the author's role, not the source: also fan supplements whose (co-)author writes rules
   too (owner 21.10.): PDD and Starblade, Roy "horizon" Amkreutz. */
export const FAN_TAG = { "fan-pdd": ["Rules writer"], "fan-sb": ["Rules writer"], "fan-botv": ["Rules writer"] };
export const TAG_ALIAS = {
  "Rules writer": "rules writers by rules writers rules committee high admiralty remastered author",
  "Played": "play-tested playtested play report",
  "Lore competition": "shadowsun competition official background",
  "Play both sides": "lopsided unbalanced swap sides",
  "Fan rules optional": "fan rules fan-made fleet",
  "Linked games optional": "kill team one page rules linked games warhammer 40,000 40k",
  "Community": "community scenario reader-written",
  "Agree first": "agree victory open unclear",
  "Tournament": "tournament adepticon competitive event battle points",
  "Fixed forces": "historical fixed fleets named ships narrative story"
};
export const BOOK = { K: "Book rules only", O: "Book + scenario rules", E: "Needs fan rules", W: "Needs Warhammer 40,000" };
/* the Planetary Assault family: the verdict is provisional until the VPs are entered or 10 assault points are full (see verdict) */
export const PA_PROV = st => !num(st, "avp") && !num(st, "dvp") && get(st, "ap", 0) < 10;
export const GROUPS = [
  ["core",      "Core scenarios", "Rulebook pp. 128–143 · any fleets"],
  ["campaign",  "Rulebook campaigns", "Third Armageddon War, 13th Black Crusade · suggested fleets, any can play"],
  ["fleets",    "Fleets book scenarios", "Rogue Trader scenarios and Craftworld Assault, FL p. 208–339 · any fleets can play"],
  ["cl-ws",     "Classic · White Dwarf and Warp Storm", "Games Workshop, 1999–2000 · written for the original rules"],
  ["cl-mag",    "Classic · Planet Killer and BFG Magazine", "Fanatic Press, 2000–2004 · written for the original rules"],
  ["cl-inv",    "Classic · Invasion and the 2002 Annual", "Games Workshop, 2002 · written for the original rules"],
  ["cl-fan",    "Classic · Fanatic Magazine and Fanatic Online", "Games Workshop’s Fanatic, 2004–2008 · written for Armada-era rules"],
  ["wr",        "Warp Rift", "The fan magazine, 2004–2026, in issue order · tags show who wrote a scenario, whether it was played, and what to agree"],
  ["fan-tour",  "Fan · Tournament missions", "AdeptiCon 2007–2016, collected and revised by Paolo Barbero · any fleets, equal points"],
  ["fan-nem",   "Fan · Book of Nemesis", "Cypra Probatii, Poland, 2007 · campaign, historical, tournament and special scenarios"],
  ["fan-pdd",   "Fan · Project Distant Darkness", "Tau narrative scenarios with fixed forces · any fleets can play"],
  ["fan-sb",    "Fan · Starblade", "Craftworld Eldar narrative series with fixed forces · any fleets can play"],
  ["fan-botv",  "Fan · Book of the Void", "The Discordia sector books of the Battlefleet Gothic Discord, I and II · historical fleets, bonus missions"],
  ["fan-bbgm",  "Fan · BBGM", "Scenarios from a fan house-rules compilation by Bear, BinExis, DarthGoogle and Mazilka, May 2026 · any fleets"]
];
/* scenario files in scenarios/ add themselves here */
export function addScenarios(list) {
  list.forEach(x => { ["tools", "play", "steps", "bring"].forEach(k => { if (!x[k]) x[k] = []; }); SC.push(x); });
}
/* a field may be a plain value or a function of the variant */
export function val(x, v) { return typeof x === "function" ? x(v) : x; }
export function v0(sc) { return sc.variants ? sc.variants[0][0] : "std"; }
/* a second version of a scenario from another source, added by that source's file: the card's first version stays as it is.
   o.source = what the card's header shows for this version (trust, book, src, why, info). Lists are hidden for this version
   unless o.keep names them ("all", or a list of tool ids); o's own items are added at the end, so saved step ticks still match. */
export const BBGM_V = "bbgm";
export function addVariant(id, first, o) {
  const sc = SC.find(s => s.id === id), V = BBGM_V;
  sc.variants = [["std", first], [V, "BBGM (fan)"]];
  sc.vsrc = { [V]: o.source };
  if (o.noLowTable) sc.noLowTable = [V];
  ["pitch", "glance", "bring", "forces", "others", "mapNote", "notes", "refs"].forEach(k => { if (k in o) { const old = sc[k]; sc[k] = v => v === V ? o[k] : val(old, v); } });
  ["steps", "play", "tools", "stools", "rtools"].forEach(k => {
    const keep = (o.keep || {})[k];
    (sc[k] || []).forEach(x => { if (!(keep === "all" || (keep && keep.includes(x.id)))) x.not = (x.not || []).concat(V); });
    if (o[k]) sc[k] = (sc[k] || []).concat(o[k].map(x => Object.assign({ only: [V] }, x)));
  });
  ["end", "win"].forEach(k => { if (o[k]) sc[k] = { std: sc[k], [V]: o[k] }; });
  if ("turnMax" in o) { const old = sc.turnMax; sc.turnMax = v => v === V ? o.turnMax : old ? old(v) : 0; }
  if (o.result) { const old = sc.result; sc.result = function (st, v, S) { return v === V ? o.result(st, v, S) : old.call(this, st, v, S); }; }
  if (o.draw) { const old = sc.draw || MAPS[id]; sc.draw = (v, W, H, st) => v === V ? o.draw(W, H, st) : old(v, W, H, st); }
  if (o.fx) sc.vfx = { [V]: o.fx };
}
export function addNote(id, t) { const sc = SC.find(s => s.id === id), old = sc.notes; sc.notes = typeof old === "function" ? v => old(v).concat([t]) : (old || []).concat([t]); }
export const ANY = "Any fleets";
export const CORE_OTHERS = "Written for any fleet list. Choose who attacks with the attack ratings (Before the battle) or agree it.";

/* edge numbers on the Escalating Engagement map (RB p. 138) */
export const EDGE_ROWS = () => [[1, 1, "Left short edge"], [2, 3, "Top long edge"], [4, 5, "Bottom long edge"], [6, 6, "Right short edge"]];
export const SPEED_ROWS = [["Up to 20 cm", "5+"], ["25 cm", "4+"], ["30 cm or more", "3+"]];
/* an arrival roll by speed (RB pp. 139, 141; owner 21.10.: "can't really roll it, I guess"): a D6 per ship, squadron or
   marker, and the result says straight away which speeds it is enough for. An optional second die = the arrival edge (edges). */
export const ARRIVE_TXT = n => n >= 5 ? "arrives at any speed" : n === 4 ? "arrives if 25 cm or faster" : n === 3 ? "arrives if 30 cm or faster" : "does not arrive";
export const ARRIVE_SUB = "Speed up to 20 cm needs 5+, 25 cm 4+, 30 cm or more 3+ (a squadron uses its slowest ship).";
export const edgeOf = (rows, d) => { const r = rows.find(x => d >= x[0] && d <= x[1]); return r ? r[2].toLowerCase() : ""; };
export const ARRIVAL = (id, l, o) => {
  const x = Object.assign({ k: "shiproll", id, l, sub: ARRIVE_SUB, cl: "Off the table", n0: 2, il: i => "Ship or squadron " + (i + 1) }, o || {});
  if (x.edges) Object.assign(x, { roll: () => [d6(), d6()], show: d => d[0] + (d[0] >= 3 ? " · edge " + d[1] : ""),
    out: d => { const e = edgeOf(x.edges, d[1]); return ARRIVE_TXT(d[0]) + (d[0] >= 3 ? ", on " + (/^the /.test(e) ? e : "the " + e) : ""); } });
  else Object.assign(x, { roll: () => d6(), out: x.out || (d => ARRIVE_TXT(d)) });
  return x;
};

/* Convoy threat tables (FL p. 198–199): alternatives to the rulebook's attacker table.
   Revised from "Convoy Run Variants" (Andy Chambers, Pavel Stafa, Michael Powers; Warp Storm, 2000). */
export const THREATS = {
  std: { n: "Rulebook table", rows: [[1, 1, "One deadfall torpedo or attack craft cluster"], [2, 2, "Two deadfall torpedo or attack craft clusters"], [3, 3, "Three deadfall torpedo or attack craft clusters"], [4, 4, "A squadron of escorts worth up to 100 pts"], [5, 5, "A squadron of escorts worth up to 150 pts"], [6, 6, "One capital ship worth up to 200 pts"]] },
  trap: { n: "The Cruiser Trap", rows: [[1, 1, "Two deadfall torpedo or attack craft clusters"], [2, 2, "Three deadfall torpedo or attack craft clusters"], [3, 3, "A squadron of escorts worth up to 150 pts"], [4, 4, "One capital ship worth up to 185 pts"], [5, 5, "One capital ship worth up to 210 pts"], [6, 6, "One capital ship worth up to 250 pts"]] },
  stalk: { n: "Stalkers of the Abyss", rows: [[1, 1, "One daemon mine counter"], [2, 2, "Two daemon mine counters"], [3, 3, "Warp beast: a squadron of 2D6 Tyranid escort drones with feeder tentacles"], [4, 4, "Warp beast: a Tyranid cruiser with only prow massive claws and thorax feeder tentacles"], [5, 5, "Warp beast: a denizen of the warp (profile under Play)"], [6, 6, "One Chaos daemonship worth up to 250 pts, Chaos Marks included"]] },
  mine: { n: "The Old Minefield", rows: [[1, 1, "One orbital mine counter"], [2, 2, "Two orbital mine counters"], [3, 3, "One orbital mine counter and one deadfall torpedo or attack craft cluster"], [4, 4, "A squadron of escorts worth up to 150 pts"], [5, 5, "A squadron of escorts worth up to 180 pts"], [6, 6, "One capital ship worth up to 210 pts"]] },
  wolf: { n: "The Wolf Packs", rows: [[1, 1, "One deadfall torpedo or attack craft cluster"], [2, 2, "Two deadfall torpedo or attack craft clusters"], [3, 3, "A squadron of escorts and/or xenos vessels worth up to 100 pts"], [4, 4, "A squadron of escorts and/or xenos vessels worth up to 150 pts"], [5, 5, "A squadron of escorts and/or xenos vessels worth up to 200 pts"], [6, 6, "One capital ship worth up to 250 pts"]] }
};
export const THREAT_VARIANTS = [["std", "Rulebook table"], ["trap", "Cruiser Trap"], ["stalk", "Stalkers"], ["mine", "Old Minefield"], ["wolf", "Wolf Packs"]];
/* threat table rules that matter in play, per table */
export const THREAT_PLAY = {
  stalk: [
    { w: "Warp beasts", s: "b", t: "Results 3–5 are warp beasts. They always attack the closest convoy ship in range, cannot take special orders (not even Brace for Impact) and pass every celestial phenomena test automatically. Each warp beast is worth a flat 100 VP." },
    { w: "Denizen of the warp", s: "b", t: "Defence/4, Armour 6+, 2 turrets, 2 shields, no weapons. It moves exactly 10 cm in any direction each turn. When it touches any ship, both vanish: the ship counts as destroyed. It reappears D3 turns later like a Chaos daemonship, centred where it vanished." },
    { w: "Daemon mines", s: "b", t: "An activated daemon mine counter becomes D3+2 daemon mines: orbital mines that move an extra D6 cm every time they move and have a 4+ save against fighters. Each is worth 10 VP when destroyed for any reason." }
  ],
  mine: [{ w: "Orbital mines", s: "b", t: "An activated orbital mine counter becomes D3+2 orbital mines." }],
  wolf: [{ w: "Xenos vessels", s: "b", t: "Escort squadrons may include xenos vessels (FL p. 194), as in the Pirates and Wolf Packs list." }]
};

/* Fleet Engagement formation table (RB p. 142): row = Player 1, column = Player 2 */
export const FORM = ["Sphere", "Wedge", "Cross"];
export const FORM_T = [
  [["B"], ["A", "C", "d"], ["A", "D", "d"]],
  [["A", "C", "w"], ["D", "D", "x"], ["B"]],
  [["A", "D", "w"], ["B"], ["B"]]
];

export const SC = [
/* ===================================================== CORE: CRUISER CLASH */
{
  id: "cruiser-clash", grp: "core", name: "Cruiser Clash", series: "Scenario One · introductory", trust: "rulebook",
  why: "The rulebook’s introductory scenario. Play it a few times while learning, then add the alternatives.",
  src: "RB p. 128–129", book: "K", suggest: null, others: "Any two fleets with cruisers. Cruisers over 185 pts, or fleets built differently, can use the alternatives: an agreed points total of cruisers, e.g. 750 pts, or 1000 pts with fleet commanders.",
  sides: { a: { n: "Fleet A" }, b: { n: "Fleet B" } },
  pitch: "Two cruiser groups meet near a jump point and open fire at once. Score by damage dealt.",
  glance: [["Points", "1–4 cruisers each, up to 185 pts each"], ["Table", "Not given — use your table"], ["Battlezone", "None in the first game"], ["First turn", "Roll-off, winner chooses"], ["Game ends", "After 8 turns, or a fleet is destroyed"]],
  bring: ["1–4 cruisers per side, same number", "Leadership table (RB p. 45)"],
  forces: {
    a: ["1–4 cruisers; both sides take the same number.", "Each cruiser costs no more than 185 pts, from your fleet list."],
    b: ["1–4 cruisers; both sides take the same number.", "Each cruiser costs no more than 185 pts, from your fleet list."]
  },
  variants: [["std", "Introductory"], ["alt", "With alternatives"]],
  mapNote: "Zones as on the rulebook map: 90 cm wide, 60 cm apart, against the long edges. Ships face the opposite long edge.",
  steps: [
    { t: "Agree the alternatives you use: no 185 pts cap, one carrier each, or an agreed points total (750, or 1000 with fleet commanders).", only: ["alt"] },
    { t: "Battlezone: start with a few gas and dust clouds, later add planets and asteroids. For the full rules roll a D6: 1–3 Outer Reaches, 4–6 Deep Space (RB p. 104–).", only: ["alt"] },
    { t: "No celestial phenomena in your first game.", not: ["alt"] },
    { t: "Roll Leadership for every cruiser (RB p. 45)." },
    { t: "One player rolls a D6: 1–3 they take the Fleet A zone, 4–6 the Fleet B zone." },
    { t: "Both roll a D6. The lower roll places one cruiser first, then take turns placing one cruiser at a time." },
    { t: "Every cruiser goes in its own zone, facing the opposite long edge.", not: ["alt"] },
    { t: "Every cruiser goes in its own zone, facing the opposite long edge — or use the Fleet Engagement set-up (RB p. 142).", only: ["alt"] },
    { t: "Roll off. The winner chooses to go first or second." }
  ],
  refs: [["Leadership table", "RB p. 45"], ["Celestial phenomena", "RB p. 104–"], ["Fleet Engagement set-up (alternative)", "RB p. 142"], ["Victory points (alternative)", "RB p. 122"]],
  play: [
    { w: "Every turn", t: "Keep count of the damage you inflict — it is the score (tools below).", not: ["alt"] },
    { w: "Turn 8", t: "Last turn: the game ends after eight complete turns each." }
  ],
  turnMax: () => 8,
  tools: [
    { k: "counter", id: "da", l: "Fleet A: damage points inflicted", s: "a", res: 1, not: ["alt"] },
    { k: "counter", id: "ca", l: "Fleet A: enemy ships crippled (still alive)", s: "a", res: 1, not: ["alt"] },
    { k: "counter", id: "xa", l: "Fleet A: enemy ships destroyed", s: "a", res: 1, not: ["alt"] },
    { k: "counter", id: "db", l: "Fleet B: damage points inflicted", s: "b", res: 1, not: ["alt"] },
    { k: "counter", id: "cb", l: "Fleet B: enemy ships crippled (still alive)", s: "b", res: 1, not: ["alt"] },
    { k: "counter", id: "xb", l: "Fleet B: enemy ships destroyed", s: "b", res: 1, not: ["alt"] }
  ],
  end: ["After eight complete turns each.", "Or when one fleet has lost all its ships."],
  win: { std: ["No normal victory points. 1 point for each damage point inflicted on enemy ships.", "+1 for each enemy ship crippled, or +3 for each enemy ship destroyed. A destroyed ship does not also give the crippled point.", "Most points wins."], alt: ["Standard victory points (RB p. 122). Most points wins."] },
  result(st, v) {
    if (v === "alt") return [null, "Count victory points", "Standard victory points (RB p. 122)."];
    const A = get(st, "da", 0) + get(st, "ca", 0) + 3 * get(st, "xa", 0), B = get(st, "db", 0) + get(st, "cb", 0) + 3 * get(st, "xb", 0);
    if (A === B) return [A ? "draw" : null, A ? "Level" : "Battle in progress", "Fleet A " + A + " – Fleet B " + B + "."];
    return [A > B ? "a" : "b", (A > B ? "Fleet A" : "Fleet B") + " leads", "Fleet A " + A + " – Fleet B " + B + "."];
  }
},
/* ===================================================== CORE: THE BAIT */
{
  id: "the-bait", grp: "core", name: "The Bait", series: "Scenario Two · raid", trust: "rulebook",
  why: "Rulebook scenario. A raid that plays well with up to 750 points.",
  src: "RB p. 130", book: "K", suggest: null, others: CORE_OTHERS,
  sides: { a: { n: "Pursued" }, b: { n: "Pursuers" } },
  pitch: "A lone ship lures the defenders into a long chase — straight into its friends waiting ahead.",
  glance: [["Points", "Pursuers 500 · Pursued 250 + 500"], ["Table", "Not given — use your table"], ["Battlezone", "D6: 1–3 Outer Reaches, 4–6 Deep Space"], ["First turn", "The fleeing ship"], ["Game ends", "A fleet disengages or is destroyed"]],
  bring: ["Reinforcements waiting off the table"],
  forces: { a: ["One ship or squadron worth up to 250 pts starts on the table.", "Up to 500 pts of reinforcements wait off the table."], b: ["Up to 500 pts."] },
  mapNote: "After turn 1 reinforcements may also enter along the long edges, 30 cm further for each turn after the first.",
  steps: [
    { t: "Battlezone: Outer Reaches or Deep Space. With a generator roll a D6: 1–3 Outer Reaches, 4–6 Deep Space." },
    { s: "a", t: "Place the fleeing ship or squadron in the centre of the table first, facing one short edge." },
    { s: "b", t: "Deploy more than 60 cm behind it." },
    { s: "a", t: "Keep the reinforcements off the table. They enter from the edge in front of the fleeing ship." },
    { t: "The fleeing ship takes the first turn." }
  ],
  refs: [["Victory points", "RB p. 122"], ["Battlezone generators", "RB p. 107–108"]],
  play: [
    { w: "Any turn", s: "a", t: "Reinforcements may enter in any turn, turn 1 included. From turn 2 they may also come on along the long edges (tool below). Example from the book: a cruiser arriving on turn 4 may enter up to 90 cm along a long edge." }
  ],
  tools: [{ k: "info", html: st => entryInfo(st.turn) }],
  end: ["One fleet disengages or is destroyed."],
  win: ["Standard victory points for ships crippled or destroyed (RB p. 122). Most points wins."],
  result() { return [null, "Count victory points", "Standard victory points, RB p. 122."]; }
},
/* ===================================================== CORE: THE RAIDERS */
{
  id: "the-raiders", grp: "core", name: "The Raiders", series: "Scenario Three · raid", trust: "rulebook",
  why: "Rulebook scenario.",
  src: "RB p. 131", book: "K", suggest: null, others: CORE_OTHERS,
  sides: { a: { n: "Raiders" }, b: { n: "Defender" } },
  pitch: "A small strike force tries to cripple as much of an enemy fleet as it can before it is destroyed itself.",
  glance: [["Points", "Defender: agreed limit · Raiders: half"], ["Table", "Not given — use your table"], ["Battlezone", "Any, agreed"], ["First turn", "Raiders"], ["Game ends", "After 8 turns, or a fleet disengages"]],
  bring: ["A D6 for the alert penalty"],
  forces: { a: ["Up to half the agreed points limit."], b: ["Up to the agreed points limit."] },
  steps: [
    { t: "Agree a points limit and set up celestial phenomena in any agreed way." },
    { s: "b", t: "Deploy the whole fleet at least 30 cm from every table edge, all ships facing the same edge, each ship or squadron at least 20 cm from the others." },
    { s: "a", t: "No deployment. You move on from one table edge in your first turn." },
    { s: "b", t: "Roll a D6 for the alert penalty: your ships suffer −1 Leadership for that many turns (tool in Play)." },
    { s: "a", t: "The raiders take the first turn." }
  ],
  notes: ["The book says “for the first D6 turns” without saying when to roll; rolling before the first turn is the natural reading."],
  refs: [["Victory points", "RB p. 122"]],
  play: [
    { w: "Turn 1", s: "a", t: "Move on from one table edge." },
    { w: "First D6 turns", s: "b", t: "All defending ships suffer −1 Leadership (reduced alert)." },
    { w: "Turn 8", t: "Last turn." }
  ],
  turnMax: () => 8,
  tools: [
    { k: "roll", id: "alert", l: "Defender alert penalty", sub: "D6 = number of turns at −1 Ld", rows: () => [[1, 1, "Turn 1"], [2, 2, "Turns 1–2"], [3, 3, "Turns 1–3"], [4, 4, "Turns 1–4"], [5, 5, "Turns 1–5"], [6, 6, "Turns 1–6"]] },
    { k: "info", html: st => { const n = get(st, "alert", 0);
      return "<h3>Defender Leadership now</h3><p class='calc'>" + (!n ? "Roll the alert penalty above." : st.turn <= n ? "Turn " + st.turn + ": defending ships are at <b>−1 Leadership</b> (until the end of turn " + n + ")." : "Turn " + st.turn + ": the alert penalty is over.") + "</p>"; } }
  ],
  end: ["After eight turns.", "Or when one fleet disengages."],
  win: ["Both fleets score standard victory points (RB p. 122). The higher total wins."],
  result() { return [null, "Count victory points", "Standard victory points, RB p. 122."]; }
},
/* ===================================================== CORE: SURPRISE ATTACK */
{
  id: "surprise-attack", grp: "core", name: "Surprise Attack", series: "Scenario Four · battle", trust: "rulebook",
  why: "Rulebook scenario.",
  src: "RB p. 132", book: "K", suggest: null, others: CORE_OTHERS,
  sides: { a: { n: "Attacker" }, b: { n: "Defender" } },
  pitch: "A pre-emptive strike catches the defenders in dock, still taking on stores. They must wake up before they are destroyed piecemeal.",
  glance: [["Points", "Equal + defences"], ["Table", "Not given — use your table"], ["Battlezone", "Primary or inner biosphere, planet in the middle"], ["First turn", "Attacker"], ["Game ends", "A fleet disengages or is destroyed"]],
  bring: ["A planet: small up to 500 pts, medium 500–1500, large over 1500", "Planetary defences"],
  forces: { a: ["Equal points to the defender."], b: ["Equal points.", "Plus D6×10 pts of planetary defences for every 500 pts (or part) of the fleet."] },
  steps: [
    { t: "Place a planet in the middle of the table: small up to 500 pts, medium 500–1500 pts, large over 1500 pts. Generate rings and moons as normal, then pick the sunward edge and place other phenomena as normal." },
    { s: "b", t: "Choose D3 ships or squadrons to be on full alert (tool below). Set them up anywhere at least 30 cm from every table edge." },
    { s: "b", t: "Everything else is on standby: each squadron with at least one ship within 15 cm of the planet, and every ship abeam of the planet’s surface." },
    { s: "a", t: "No deployment. You move on from the table edge of your choice in your first turn." },
    { s: "a", t: "The attacker takes the first turn." }
  ],
  stools: [{ k: "roll", id: "alertn", l: "Ships on full alert", sub: "D3 — roll a D6", rows: () => [[1, 2, "1 ship or squadron"], [3, 4, "2 ships or squadrons"], [5, 6, "3 ships or squadrons"]] }],
  refs: [["Planetary defences", "FL p. 496–"], ["Victory points", "RB p. 122"]],
  play: [
    { w: "Standby", s: "b", t: "Ships on standby may not move, fire or launch ordnance. They may Brace for Impact and repair critical damage; turrets and shields work normally." },
    { w: "Going on alert", s: "b", t: "A standby ship or squadron goes on alert by passing a Leadership test. It is not a command check: a failure does not stop you testing the others. No special orders in the turn it goes on alert." }
  ],
  tools: [{ k: "counter", id: "stb", l: "Ships or squadrons still on standby", s: "b" }],
  end: ["One fleet disengages or is destroyed."],
  win: ["Both fleets score standard victory points (RB p. 122). The higher total wins."],
  result() { return [null, "Count victory points", "Standard victory points, RB p. 122."]; }
},
/* ===================================================== CORE: BLOCKADE RUN */
{
  id: "blockade-run", grp: "core", name: "Blockade Run", series: "Scenario Five · raid", trust: "rulebook",
  why: "Rulebook scenario.",
  src: "RB p. 133", book: "K", suggest: null, others: CORE_OTHERS,
  sides: { a: { n: "Runners" }, b: { n: "Blockade" } },
  pitch: "A small force tries to break through the blockade at its weakest point and fetch help for the trapped fleet.",
  glance: [["Points", "Blockade: agreed · Runners: half"], ["Table", "Not given — use your table"], ["Battlezone", "Outer Reaches or Deep Space"], ["First turn", "Roll-off, winner chooses"], ["Game ends", "After 6 turns"]],
  bring: ["A D6 per blockading ship or squadron"],
  forces: { a: ["Up to half the agreed points total."], b: ["Up to the agreed points total."] },
  mapNote: "The table is cut lengthways into thirds. Blockaders roll a D6 each for their third and may not be within 60 cm of the runners’ edge.",
  steps: [
    { t: "Agree the points. Battlezone: Outer Reaches or Deep Space." },
    { t: "Divide the table lengthways into three equal parts (map)." },
    { s: "b", t: "Roll a D6 for each ship or squadron to see which third it goes in (tool below). Any facing, but not within 60 cm of the runners’ table edge." },
    { s: "a", t: "Deploy within 15 cm of your table edge." },
    { t: "Roll off. The winner chooses to go first or second." }
  ],
  stools: [{ k: "roll", id: "third", l: "Blockader placement", sub: "D6 per ship or squadron", rows: () => [[1, 2, "Left third"], [3, 4, "Middle third"], [5, 6, "Right third"]] }],
  notes: ["Left, middle and right follow the rulebook map, seen from the runners’ edge."],
  refs: [["Victory points", "RB p. 122"]],
  play: [
    { w: "All game", s: "a", t: "Ships that leave the table over the blockade’s edge score their points value as victory points; crippled ships score a quarter." },
    { w: "Turn 6", t: "Last turn." }
  ],
  turnMax: () => 6,
  tools: [],
  end: ["After six turns."],
  win: ["Standard victory points for crippling and destroying enemy ships (RB p. 122).", "The runners also score the points value of every ship moved off over the blockade’s edge; crippled ships score a quarter.", "Most victory points wins."],
  result() { return [null, "Count victory points", "Remember the runners’ points for ships that got through."]; }
},
/* ===================================================== CORE: CONVOY */
{
  id: "convoy", grp: "core", name: "Convoy", series: "Scenario Six · raid", trust: "rulebook",
  why: "Rulebook scenario. The attacker’s forces are rolled at random and hidden under contact markers.",
  src: "RB p. 134–135", book: "K", suggest: null, others: CORE_OTHERS,
  sides: { a: { n: "Convoy" }, b: { n: "Attackers" } },
  pitch: "Transports must cross space seeded with lurking ships and deadfall torpedoes. Count how many make it out the far side.",
  variants: THREAT_VARIANTS,
  glance: v => [["Points", v === "std" ? "100 pts per 2 transports · attackers random" : "150 pts per 2 transports · attackers random"], ["Table", "Not given — use your table"], ["Battlezone", "Any, agreed (or a generator)"], ["First turn", "Convoy"], ["Game ends", "The last transport leaves or dies"]],
  bring: v => ["Transports (at least 2)", "Contact markers, one per attacking unit", "Torpedo and attack craft markers"].concat(v === "stalk" ? ["Daemon mine markers", "Tyranid escort drones or cruiser, a daemonship"] : v === "mine" ? ["Orbital mine markers"] : []),
  forces: v => ({
    a: ["At least 2 transports. They may form a single squadron.", v === "std" ? "For every 2 transports: up to 100 pts of escorting ships, at most one squadron per pair of transports." : "For every 2 transports: up to 150 pts of escorting ships (100 + 50 for facing a Fleets book threat table), at most one squadron per pair of transports."],
    b: ["Rolled at random: D3 rolls on " + (v === "std" ? "the rulebook table" : "the " + THREATS[v].n + " table (FL p. 208–209)") + ", plus one more for each pair of transports (tool below).", "Escort squadrons and capital ships come from your fleet list."]
  }),
  mapNote: "The convoy enters from a short edge (rolled), not within 45 cm of either long edge, and must leave by the opposite short edge.",
  steps: [
    { t: "Set up celestial phenomena in any agreed way, or roll the region of space and use its battlezone generator." },
    { s: "b", t: "Roll your forces: D3 rolls plus one per pair of transports (tool below)." },
    { s: "b", t: "Place a face-down contact marker for each capital ship, squadron, deadfall cluster and attack craft cluster: at least 30 cm apart and not within 30 cm of a table edge. If they do not fit, stack extra markers on top of placed ones." },
    { s: "a", t: "Roll a D6 to decide which short edge the convoy enters from. Place one convoy ship at that edge to mark the entry point, not within 45 cm of either long edge." },
    { s: "a", t: "The convoy takes the first turn and moves on from the marked point. Ships not on the table by the end of the convoy’s second turn are lost in the warp." }
  ],
  stools: [{ k: "roll", id: "atk", l: "Attacking forces", sub: "D6 per roll · D3 rolls + 1 per pair of transports", rows: v => (THREATS[v] || THREATS.std).rows }],
  notes: v => ["The book does not say which D6 results mean which short edge — agree it, e.g. 1–3 one end, 4–6 the other."].concat(v === "std" ? [] : [
    "The Fleets book prints four threat tables as alternatives to the rulebook’s attacker table; its cross-reference to the Convoy scenario reads “[???]” in v0.36. With one of them the convoy may add up to +50 pts of escorting ships per two transports (FL p. 208).",
    "Victory in Convoy is decided by transports alone; the victory points the tables give warp beasts and daemon mines matter only if you also count victory points, for example in a campaign."]),
  refs: v => [["Contact markers, Victory", "RB p. 134–135"], ["Battlezone generators", "RB p. 107–108"]].concat(v === "std" ? [] : [["Threat tables", "FL p. 208–209"]],
    v === "stalk" ? [["Orbital mines (daemon mines build on them)", "FL p. 23, 512"], ["Daemonships", "FL p. 236–237"], ["Tyranid escort drones and cruisers", "FL p. 432–"]] : v === "mine" ? [["Orbital mines", "FL p. 23, 512"]] : v === "wolf" ? [["Xenos vessels", "FL p. 194"]] : []),
  play: [
    { w: "Convoy movement", s: "a", t: "A convoy ship moving within 30 cm of a marker activates it: flip it face up at once, then finish the move. After the convoy’s movement phase the attacker deploys every activated marker." },
    { w: "Start of attacker movement", s: "b", t: "You may activate one marker yourself — two if any convoy ship is on special orders." },
    { w: "Deadfall torpedoes", s: "b", t: "Replace the marker with a D6+2 strength torpedo salvo facing any way. Speed 30 cm, it starts moving in the next ordnance phase." },
    { w: "Attack craft", s: "b", t: "Replace the marker with D3+1 squadrons of attack craft, any mix of fighters, bombers and assault boats; they may form a wave. They start moving in the next ordnance phase." },
    { w: "Escort squadron", s: "b", t: "Place one ship on the marker and the rest in formation no closer to the enemy than the first, all facing the same way." },
    { w: "Capital ship", s: "b", t: "Place it on the marker, facing any way." },
    ...[].concat(...Object.entries(THREAT_PLAY).map(([k, list]) => list.map(x => Object.assign({ only: [k] }, x))))
  ],
  tools: [{ k: "counter", id: "out", l: "Transports off the far edge", s: "a", res: 1 }],
  end: ["When the last transport has left the table or been destroyed."],
  win: ["Only transports that cross the table and leave by the opposite short edge count.", "0 transports: attackers win. 1: attackers’ marginal win. 2: convoy’s marginal win. 3 or more: convoy wins."],
  result(st) { const n = get(st, "out", 0);
    return n >= 3 ? ["a", "Convoy wins", n + " transports got through."] : n === 2 ? ["a", "Convoy marginal win", "2 transports got through."] : n === 1 ? ["b", "Attackers’ marginal win", "Only 1 transport got through."] : ["b", "Attackers win (so far)", "No transport has got through."]; }
},
/* ===================================================== CORE: PLANETARY ASSAULT */
{
  id: "planetary-assault", grp: "core", name: "Planetary Assault", series: "Scenario Seven · battle", trust: "rulebook",
  why: "Rulebook scenario. Needs a low orbit table.",
  src: "RB p. 136–137", book: "K", suggest: null, others: CORE_OTHERS,
  sides: { a: { n: "Attacker" }, b: { n: "Defender" } },
  pitch: "One fleet must land troops on a contested world while holding off the defenders. Assault points decide it.",
  glance: [["Points", "Equal + defences + free transports"], ["Table", "Not given — use your table"], ["Battlezone", "Primary or inner biosphere"], ["First turn", "Roll-off, winner chooses"], ["Game ends", "A fleet is gone, or 10 assault points"]],
  bring: ["A planet (D6: 1 small, 2–5 medium, 6 large)", "Low orbit table (RB p. 116)", "Transports for the attacker", "Planetary defences"],
  forces: { a: ["Equal points.", "Plus 2 free transports for every 500 pts (or part) of the fleet."], b: ["Equal points.", "Plus D6×10 pts of planetary defences for every 500 pts (or part) of the fleet."] },
  mapNote: "The planet is no more than 150 cm from one short edge; the attacker deploys at the other. Standby ships sit in high orbit in the planet’s gravity well.",
  steps: [
    { t: "Roll the planet’s size (D6: 1 small, 2–5 medium, 6 large). Place it no more than 150 cm from one short edge; generate rings and moons; declare the sunward edge and set up other phenomena as normal." },
    { t: "Set up the low orbit table (RB p. 116)." },
    { s: "b", t: "Put each ship or squadron either on patrol or on standby in high orbit within the planet’s gravity well." },
    { s: "b", t: "For each patrol ship or squadron roll a D6: 1–3 the attacker places it, 4–6 you do. Patrols go anywhere at least 30 cm from a table edge and outside celestial phenomena. You always choose their facing." },
    { s: "a", t: "Deploy within 15 cm of the short edge furthest from the planet." },
    { t: "Roll off. The winner chooses to go first or second." }
  ],
  stools: [{ k: "roll", id: "psize", l: "Planet size", sub: "D6", rows: () => [[1, 1, "Small"], [2, 5, "Medium"], [6, 6, "Large"]] }],
  notes: ["The book does not say whether ships on standby here follow the standby restrictions of Surprise Attack. Agree before play."],
  refs: [["Low orbit table", "RB p. 116"], ["Planetary defences", "FL p. 496–"], ["Victory points", "RB p. 122"]],
  play: [
    { w: "Landing troops", s: "a", t: "On the low orbit table, each turn a capital ship spends within 30 cm of the planet edge scores 1 assault point; each transport scores 2. A ship landing troops or bombarding does nothing else that turn." }
  ],
  tools: [{ k: "counter", id: "ap", l: "Assault points", s: "a", goal: 10, res: 1 }],
  rtools: [
    { k: "num", id: "avp", l: "Attacker’s victory points", s: "a", after: v => "+" + Math.floor(v / 500) + " assault points" },
    { k: "num", id: "dvp", l: "Defender’s victory points", s: "b", after: v => "−" + Math.ceil(v / 500) + " assault points" }
  ],
  end: ["One fleet is destroyed or disengages.", "Or the attacker has 10 or more assault points."],
  win: ["Take the assault points, +1 for every full 500 VP the attacker scored for ships and defences, −1 for every 500 VP (rounding up) the defender scored.", "0–1: defender’s victory. 2–5: defender’s marginal win. 6–9: attacker’s marginal win. 10+: attacker’s victory."],
  provisional: PA_PROV,
  result(st) {
    const t = get(st, "ap", 0) + Math.floor(num(st, "avp") / 500) - Math.ceil(num(st, "dvp") / 500);
    const r = t >= 10 ? ["a", "Attacker’s victory"] : t >= 6 ? ["a", "Attacker’s marginal win"] : t >= 2 ? ["b", "Defender’s marginal win"] : ["b", "Defender’s victory"];
    return [r[0], r[1], "Adjusted total: " + t + " assault points."];
  }
},
/* ===================================================== CORE: ESCALATING ENGAGEMENT */
{
  id: "escalating-engagement", grp: "core", name: "Escalating Engagement", series: "Scenario Eight · battle", trust: "rulebook",
  why: "Rulebook scenario. Both fleets arrive in five divisions under contact markers.",
  src: "RB p. 138–139", book: "K", suggest: null, others: "Written for any fleet list. Fast fleets get their divisions on sooner.",
  sides: { a: { n: "Player 1" }, b: { n: "Player 2" } },
  pitch: "Two search groups stumble into each other and call in the rest of their fleets. Whose ships arrive first?",
  glance: [["Points", "Agreed; each fleet in 5 divisions"], ["Table", "Not given — use your table"], ["Battlezone", "Any, agreed"], ["First turn", "Roll-off after deployment"], ["Game ends", "A fleet disengages or is destroyed"]],
  bring: ["5 contact markers per player", "A note of which ships are in each division"],
  forces: {
    a: ["Split the fleet into five divisions, one per contact marker, and note which ships are in each.", "Every marker needs at least some ships. Markers are drawn at random, so an even split is best.", "A division arrives at the speed of its slowest ship."],
    b: ["Split the fleet into five divisions, one per contact marker, and note which ships are in each.", "Every marker needs at least some ships. Markers are drawn at random, so an even split is best.", "A division arrives at the speed of its slowest ship."]
  },
  mapNote: "Edge numbers for the random table edge, as on the rulebook map.",
  steps: [
    { t: "Set up celestial phenomena in any agreed way." },
    { t: "Both players split their fleets into five divisions and note which ships belong to which contact marker." },
    { t: "Each player draws one of their markers at random: that is the starting division." },
    { t: "Roll off to see who places their marker first." },
    { t: "Place the markers anywhere not within 30 cm of a table edge and not within 60 cm of the enemy marker." },
    { t: "Deploy the ships of each starting division within 10 cm of its marker." },
    { t: "Both roll a D6. The higher roll chooses to go first or second." }
  ],
  refs: [["Victory points", "RB p. 122"]],
  play: [
    { w: "End phase of your turn", t: "Draw another of your markers at random and place it along a random table edge (tool below): not within 60 cm of enemy ships, and if you have ships within 30 cm of that edge, within 30 cm of them." },
    { w: "Start of your turn", t: "Roll a D6 for each of your markers already on an edge. The score needed depends on the division’s slowest ship (tool below), +2 to the roll if friendly ships are within 30 cm of the marker." },
    { w: "Arrival", t: "Success: the division moves on from anywhere along that edge within 10 cm of the marker. Failure: you may slide the marker along the edge up to the slowest ship’s speed." }
  ],
  tools: [
    { k: "roll", id: "edge", l: "Random table edge", sub: "D6, for the marker drawn in your end phase", rows: EDGE_ROWS },
    ARRIVAL("arr2", "Arrival rolls — markers on an edge", { cl: "Markers on an edge", il: i => "Marker " + (i + 1),
      sub: "D6 per marker; the slowest ship in its division decides: up to 20 cm needs 5+, 25 cm 4+, 30 cm or more 3+. +2 if friendly ships are within 30 cm of the marker. Tyranids add +1 (FL p. 428).",
      out: (d, st) => ARRIVE_TXT(d) + (d < 5 ? "; with +2 (friendly ships within 30 cm): " + ARRIVE_TXT(d + 2) : "") +
        fleetArr("escalating-engagement", st).map(([f, b]) => "; " + f + " (+" + b + "): " + ARRIVE_TXT(d + b) + (d + b < 5 ? ", with +2 as well: " + ARRIVE_TXT(d + b + 2) : "")).join("") }),
    { k: "counter", id: "offa", l: "Player 1: divisions still to arrive", s: "a", start: 4, max: 4 },
    { k: "counter", id: "offb", l: "Player 2: divisions still to arrive", s: "b", start: 4, max: 4 }
  ],
  end: ["One fleet disengages or is destroyed."],
  win: ["Both fleets score standard victory points (RB p. 122). The higher total wins."],
  result() { return [null, "Count victory points", "Standard victory points, RB p. 122."]; }
},
/* ===================================================== CORE: EXTERMINATUS */
{
  id: "exterminatus", grp: "core", name: "Exterminatus", series: "Scenario Nine · battle", trust: "rulebook",
  why: "Rulebook scenario. Needs a low orbit table.",
  src: "RB p. 140–141", book: "K", suggest: null, others: CORE_OTHERS + " A Chaos attacker may use an Activated Blackstone Fortress as its Exterminator.",
  sides: { a: { n: "Attacker" }, b: { n: "Defender" } },
  pitch: "The attackers escort Exterminator ships to a world; every defender in reach rushes to stop them.",
  glance: [["Points", "Agreed + Exterminators + defences"], ["Table", "Not given — use your table"], ["Battlezone", "Primary or inner biosphere"], ["First turn", "Roll-off, winner chooses"], ["Game ends", "Planet dies, Exterminators gone, or a fleet disengages"]],
  bring: ["A planet (D6: 1 small, 2–5 medium, 6 large)", "Low orbit table (RB p. 116)", "Planetary defences"],
  forces: {
    a: ["Up to the agreed points.", "One Exterminator for every 1000 pts (or part): nominate a capital ship; its prow armament becomes an Armageddon weapon usable only against the planet.", "Chaos may use an Activated Blackstone Fortress instead; it keeps all its weapons."],
    b: ["Up to the agreed points.", "Plus D6×10 pts of planetary defences for every 500 pts (or part).", "One capital ship or escort squadron per 500 pts is on patrol, off the table at the start."]
  },
  steps: [
    { t: "Roll the planet’s size (D6: 1 small, 2–5 medium, 6 large). Place it no more than 150 cm from one short edge; generate rings and moons; declare the sunward edge and place other phenomena." },
    { t: "Set up the low orbit table (RB p. 116)." },
    { s: "a", t: "Nominate your Exterminators: one per 1000 pts (or part)." },
    { s: "b", t: "Put one capital ship or escort squadron per 500 pts aside on patrol. Deploy the rest anywhere at least 30 cm from every table edge." },
    { s: "a", t: "Deploy the whole fleet within 15 cm of the short edge furthest from the planet." },
    { t: "Roll off. The higher roll chooses to go first or second." }
  ],
  stools: [{ k: "roll", id: "psize", l: "Planet size", sub: "D6", rows: () => [[1, 1, "Small"], [2, 5, "Medium"], [6, 6, "Large"]] }],
  notes: ["The book does not say how to roll the random edge for arriving patrols — agree it (for example the edge numbers of Escalating Engagement)."],
  refs: [["Low orbit table", "RB p. 116"], ["Activated Blackstone Fortress", "FL p. 286"], ["Planetary defences", "FL p. 496–"]],
  play: [
    { w: "Attacker", s: "a", t: "Exterminators must reach low orbit and get within 45 cm of the planet edge of the low orbit table." },
    { w: "Start of each turn", s: "a", t: "Roll a D6 for each Exterminator within 45 cm of the planet edge: on 4+ it fires the Armageddon weapon and the planet dies." },
    { w: "Shooting", s: "b", t: "Defenders may always target an Exterminator; no Leadership test is needed even if it is not the closest target." },
    { w: "Start of your turn", s: "b", t: "Roll a D6 for each capital ship and escort squadron on patrol (tool below). Arrivals come on from a random table edge." }
  ],
  tools: [ARRIVAL("pat", "Patrol arrival rolls", { cl: "Patrols not in play", il: i => "Patrol " + (i + 1), edges: EDGE_ROWS(),
    sub: "At the start of your turn: one D6 per capital ship or escort squadron not in play (one on patrol per 500 pts). " + ARRIVE_SUB + " The second die is the arrival edge: 1 left, 2–3 top, 4–5 bottom, 6 right (unless you agreed another way)." })],
  end: ["One fleet disengages.", "All the attacker’s Exterminators are destroyed.", "An Exterminator destroys the planet."],
  win: ["A fleet that disengages loses.", "All Exterminators destroyed: the defender wins.", "The planet destroyed: the attacker wins.", "In a campaign a destroyed world rolls on the table on RB p. 141."],
  rtools: [{ k: "ending", id: "how", l: "How did it end?", rows: [["The planet was destroyed", "a"], ["All Exterminators were destroyed", "b"], ["The attacker disengaged", "b"], ["The defender disengaged", "a"]] }],
  result(st, v, S) { return endingResult(st, S, "how"); }
},
/* ===================================================== CORE: FLEET ENGAGEMENT */
{
  id: "fleet-engagement", grp: "core", name: "Fleet Engagement", series: "Scenario Ten · battle", trust: "rulebook",
  why: "Rulebook scenario. Both fleets pick a formation in secret; the pair decides the set-up map.",
  src: "RB p. 142–143", book: "K", suggest: null, others: "Written for any fleet list.",
  sides: { a: { n: "Dark zone" }, b: { n: "Light zone" } },
  pitch: "Two full fleets meet in battle order. Sphere, wedge or cross — your formation against theirs decides how the battle opens.",
  glance: [["Points", "Equal"], ["Table", "Not given — use your table"], ["Battlezone", "Any, agreed (usually primary or inner biosphere)"], ["First turn", "Roll-off after deployment"], ["Game ends", "A fleet disengages or is destroyed"]],
  bring: ["Equal fleets"],
  forces: { a: ["Equal points.", "Deploys in the dark zone of the set-up map."], b: ["Equal points.", "Deploys in the light zone of the set-up map."] },
  variants: [["A", "Set-up A"], ["B", "Set-up B"], ["C", "Set-up C"], ["D", "Set-up D"]],
  mapNote: "The rulebook’s set-up maps are schematic; the zones here are drawn to their printed measurements. Arrows show the approach angle. A zone split into divisions needs at least one ship or squadron in each.",
  steps: [
    { t: "Pick equal fleets and set up celestial phenomena in any agreed way." },
    { t: "Each player secretly chooses a formation — Sphere, Wedge or Cross — and both reveal. Enter them in the formation tool below to get the set-up." },
    { t: "Split result: both roll a D6. +1 if your fastest ship is faster than any enemy ship, +1 for the fleet with the best admiral (highest Leadership), +1 for the fleet with the most escorts. The winner picks the set-up." },
    { t: "Both roll a D6. The lower roll deploys a squadron or lone ship first; then take turns until everything is deployed." },
    { t: "Put at least one ship or squadron in every division of your zone. Every ship faces the way of its division’s arrow." },
    { t: "Both roll a D6. The higher roll chooses to go first or second." }
  ],
  stools: [{ k: "formation", id: "form" }], stoolsFirst: 1,
  notes: ["In set-up B the middle division is labelled 45 cm wide; the book does not say which player takes which zone there, so roll off or agree.", "The formations: Sphere spreads wide to envelop the enemy but a wedge breaks through it; Wedge keeps the fleet packed for mutual support but can be surrounded; Cross runs parallel to the enemy for a long broadside fight."],
  refs: [["Victory points", "RB p. 122"]],
  play: [{ w: "All game", t: "No special rules: fight it out. Standard victory points decide." }],
  tools: [],
  end: ["One fleet disengages or is destroyed."],
  win: ["Both fleets score standard victory points (RB p. 122). The higher total wins."],
  result() { return [null, "Count victory points", "Standard victory points, RB p. 122."]; }
},

/* ===================================================== CAMPAIGN: THE GAUNTLET */
{
  id: "gauntlet", grp: "campaign", name: "The Gauntlet", series: "Third Armageddon War · Scenario One", trust: "rulebook",
  why: "Official scenario, reprinted unchanged by the rules committee in Armada Indomitus: Codex Orks (Warp Rift 48, p. 64 of the PDF).",
  src: "RB p. 178", book: "K", suggest: ["Imperial Navy", "Orks"],
  others: "Any fleet with transports can run the gauntlet. The raiders are escorts only, so fast escort-heavy fleets suit them best.",
  sides: { a: { n: "Convoy", f: "Imperial Navy" }, b: { n: "Raiders", f: "Orks" } },
  pitch: "A convoy runs the blockade around Armageddon. Three transports have to make it off the far edge.",
  glance: [["Points", "100 pts per 2 transports, each side"], ["Table", "Not given — use your table"], ["Battlezone", "Primary Biosphere, no planets"], ["First turn", "Raiders"], ["Game ends", "A fleet is gone, or the convoy has left"]],
  bring: ["Transport models (at least 2)", "Primary Biosphere phenomena (no planets)"],
  forces: {
    a: ["At least 2 transports. Heavy Transports may be used freely (FL p. 192).", "For every 2 transports: 100 pts of warships.", "At most one cruiser. Everything else must be light cruisers or escorts."],
    b: ["For every 2 transports in the convoy: 100 pts of ships.", "Escorts only."]
  },
  variants: [["std", "Standard"], ["run", "Running battle"]],
  steps: [
    { t: "Roll celestial phenomena on the Primary Biosphere table (RB p. 107). Ignore any result that gives a planet." },
    { s: "a", t: "Place the convoy and its escorts within 45 cm of one short edge, all facing the opposite short edge.", not: ["run"] },
    { s: "a", t: "Place the convoy and its escorts within 30 cm of the centre of the table, all facing one short edge.", only: ["run"] },
    { s: "b", t: "No deployment. You move on from any point of either long edge in your first turn." },
    { s: "b", t: "The raiders take the first turn." }
  ],
  refs: [["Heavy Transport", "FL p. 192"], ["Battlezone generators", "RB p. 107–108"]],
  play: [
    { w: "Turn 1", s: "b", t: "Move on from any point along either long edge." },
    { w: "All game", s: "a", t: "Get transports off the short edge opposite the one you started on. Each one that leaves counts towards the 3 needed.", not: ["run"] },
    { w: "End of your turn", s: "a", t: "Move every ship and every celestial phenomenon 20 cm back, away from the short edge the convoy faced at the start. Anything pushed off the table has disengaged.", only: ["run"] },
    { w: "End of your turn", s: "a", t: "Roll a D6. On a 6 place a randomly rolled celestial phenomenon along the short edge the convoy faced (ignore planets).", only: ["run"] },
    { w: "Turn 10", t: "Last turn of the running battle.", only: ["run"] }
  ],
  turnMax: v => v === "run" ? 10 : 0,
  tools: [
    { k: "counter", id: "out", l: "Transports off the far edge", s: "a", goal: 3, res: 1, not: ["run"] },
    { k: "counter", id: "left", l: "Transports still on the table", s: "a", start: 3, goal: 3, res: 1, not: ["std"] }
  ],
  end: { std: ["One fleet is destroyed or disengages.", "Or the convoy fleet has left off the far short edge."], run: ["After turn 10.", "Or one fleet is destroyed or disengages."] },
  win: { std: ["Convoy victory: at least 3 transports left off the far short edge.", "Anything less is a victory for the raiders."], run: ["Convoy victory: at least 3 transports are still on the table at the end of turn 10.", "Anything less is a victory for the raiders."] },
  result(st, v) {
    if (v === "run") {
      const n = get(st, "left", 3);
      if (st.turn >= 10) return n >= 3 ? ["a", "Convoy victory", n + " transports on the table after turn 10."] : ["b", "Raiders’ victory", "Only " + n + " transports left."];
      return [null, "Battle in progress", "Turn " + st.turn + " of 10 · " + n + " transports on the table, 3 needed at the end."];
    }
    const o = get(st, "out", 0);
    return o >= 3 ? ["a", "Convoy victory", o + " transports got through."] : [null, "Raiders win unless 3 transports exit", o + " of 3 off the table so far."];
  }
},
/* ===================================================== CAMPAIGN: PAROL'S BAIT */
{
  id: "parols-bait", grp: "campaign", name: "Parol’s Bait", series: "Third Armageddon War · Scenario Two", trust: "rulebook",
  why: "Official scenario, reprinted by the rules committee in Armada Indomitus: Codex Orks (Warp Rift 48, p. 65 of the PDF). A variant of The Bait (RB p. 130).",
  src: "RB p. 179", book: "K", suggest: ["Imperial Navy", "Orks"],
  others: "It is The Bait with light ships and mines, so any fleets work.",
  sides: { a: { n: "Pursued", f: "Imperial Navy" }, b: { n: "Pursuers", f: "Orks" } },
  pitch: "A few light ships drag an enemy pack into a trap — but every reinforcement committed hands the pursuers bonus points.",
  glance: [["Points", "Pursuers 500 · Pursued 250 + up to 500"], ["Table", "Not given — use your table"], ["Battlezone", "D6: 1–4 Outer Reaches, 5–6 Primary Biosphere"], ["First turn", "Pursued"], ["Game ends", "A fleet is destroyed or disengages"]],
  bring: ["Up to 6 orbital mines", "Reinforcements waiting off the table"],
  forces: {
    a: ["Up to 250 pts at the start.", "Reinforcements: up to 500 pts, waiting off the table.", "Light cruisers and escorts only. Unlike The Bait, more than one light cruiser or squadron may start as the pursued ships.", "Up to 6 orbital mines (FL p. 23). They start on the table but are paid from the reinforcement points."],
    b: ["Up to 500 pts."]
  },
  mapNote: "From turn 2 reinforcements may also enter along the long edges: 30 cm further for each turn after the first.",
  steps: [
    { t: "Roll a D6 for the battlezone: 1–4 Outer Reaches, 5–6 Primary Biosphere. Generate the celestial phenomena." },
    { s: "a", t: "Place the pursued ships in the centre of the table, facing one short edge." },
    { s: "a", t: "Place any orbital mines anywhere in front of the pursued ships." },
    { s: "b", t: "Deploy behind the pursued ships, at least 60 cm away." },
    { s: "a", t: "Keep the reinforcements off the table. They enter from the short edge the pursued ships face." },
    { s: "a", t: "The pursued take the first turn." }
  ],
  notes: ["The rulebook gives the mines’ victory points to “the attacker” without saying who that is. The pursuers are the natural reading — agree before play.", "Armada Indomitus refers to The Bait on “page 70” (the old rulebook). In Rulebook v1.10 it is on p. 130."],
  refs: [["The Bait (parent scenario)", "RB p. 130"], ["Orbital mines", "FL p. 23"], ["Victory points", "RB p. 122"]],
  play: [
    { w: "Any turn", s: "a", t: "Reinforcements may enter in any turn, turn 1 included. The tool below shows where they may come on this turn." },
    { w: "Keep count", s: "a", t: "Every reinforcement point brought on gives the pursuers half of it as bonus victory points." }
  ],
  tools: [
    { k: "info", html: st => entryInfo(st.turn) },
    { k: "num", id: "reinf", l: "Reinforcement points brought on", s: "a", after: v => "Pursuers’ bonus: <b>" + Math.floor(v / 2) + " VP</b>" }
  ],
  end: ["One fleet is destroyed or disengages."],
  win: ["Standard victory points for ships crippled, destroyed or disengaged (RB p. 122).", "The pursuers add half the points value of all reinforcements brought on.", "If mines were bought, their victory points go to “the attacker” — agreed: {a:minevp}."],
  result(st) { const r = num(st, "reinf"); return [null, "Count victory points", "Pursuers’ bonus from reinforcements: " + Math.floor(r / 2) + " VP."]; }
},
/* ===================================================== CAMPAIGN: PELUCIDAR */
{
  id: "pelucidar", grp: "campaign", name: "Defence of Pelucidar", series: "Third Armageddon War · Scenario Three", trust: "rulebook",
  why: "Official scenario. The rules committee reprinted it in Armada Indomitus: Codex Orks (Warp Rift 48, p. 66 of the PDF) with a changed arrival chart — switch below.",
  src: "RB p. 180–181", book: "K", suggest: ["Imperial Navy", "Orks"],
  others: "Suggestion: the arrival chart lists Ork ships. With another horde, use the nearest equivalent: escorts for escort squadrons, a cruiser for a Kroozer or Terror Ship, a battleship for a Rok or Battleship, and your biggest centrepiece for the Space Hulk.",
  sides: { a: { n: "Defender", f: "Imperial Navy" }, b: { n: "Horde", f: "Orks" } },
  pitch: "Admiral Parol must hurt a growing armada as much as he can and get out before it overwhelms him. 2000 victory points or bust.",
  glance: [["Points", "Defender 1500 · horde arrives at random"], ["Table", "Not given — use your table"], ["Battlezone", "Outer Reaches"], ["First turn", "Horde"], ["Game ends", "Defender destroyed or disengaged"]],
  bring: ["The planet Pelucidar", "Up to 4 minefields", "A pool of horde models: escorts, cruisers, big ships"],
  forces: {
    a: ["Up to 1500 pts of cruisers, battlecruisers and battleships only (normal list restrictions apply).", "Up to four minefields.", "Historically the battle was fought with Armageddon class battlecruisers."],
    b: ["No ships at the start. Roll for arrivals at the start of every turn (Play tab)."]
  },
  variants: [["rb", "Rulebook v1.11"], ["ai", "Armada Indomitus 2026"]],
  mapNote: "The rulebook mentions a deployment map that is not printed.",
  steps: [
    { t: "Roll the celestial phenomena for the Outer Reaches (RB p. 108)." },
    { s: "a", t: "Place the planet Pelucidar anywhere on the table." },
    { s: "a", t: "Deploy the whole fleet at least 30 cm from every table edge, all ships facing the same edge, each ship or squadron at least 20 cm from the others." },
    { s: "b", t: "No deployment. Roll for arrivals at the start of each turn and move them on." },
    { s: "b", t: "The horde takes the first turn." }
  ],
  notes: ["Where the horde comes on: the Battlezone paragraph says “along his table edge”, the Set-up paragraph says “from any edge”. Agree before play.", "Rulebook: escort squadrons are D6 ships of the Ork player’s choice; if you lack the models for a result, take the next lowest result. Armada Indomitus: D6+1 escorts of any type in the Ork list and the changed chart below; it does not repeat the next-lowest rule."],
  refs: [["Minefield", "FL p. 513"], ["Battlekroozer", "FL p. 367–374"], ["Victory points", "RB p. 122"]],
  play: [
    { w: "Start of your turn", s: "b", t: "Roll D6 + the turn number on the arrival chart (tool below). The new ships move on this turn." },
    { w: "Squadrons and wings", s: "b", t: "An escort squadron is D6 escorts (Armada Indomitus: D6+1). A fighta-bomma / attack craft wing is 4 markers." },
    { w: "All game", s: "a", t: "No victory points for holding the field. Every one of your ships destroyed or disengaged costs its victory points — and you have to disengage to end the game." }
  ],
  tools: [
    { k: "roll", id: "arr", l: "Horde arrivals", sub: "D6 + turn number", turn: true,
      rows: v => v === "ai" ? [[2, 4, "1 Fighta-Bomma / attack craft wing"], [5, 6, "1 escort squadron (D6+1)"], [7, 9, "2 escort squadrons"], [10, 10, "3 escort squadrons"], [11, 11, "1 Kroozer or Terror Ship"], [12, 12, "2 Kroozers or Terror Ships, or 1 Battlekroozer"], [13, 14, "1 Battleship, or D3+1 Roks"], [15, 99, "1 Space Hulk (once per battle, then re-roll)"]]
                         : [[2, 4, "1 Fighta-Bomma / attack craft wing"], [5, 6, "1 escort squadron (D6)"], [7, 9, "2 escort squadrons"], [10, 10, "3 escort squadrons"], [11, 11, "1 Kroozer or Terror Ship"], [12, 12, "2 Kroozers or Terror Ships"], [13, 14, "1 Rok"], [15, 99, "1 Space Hulk"]] }
  ],
  end: ["The defending fleet is destroyed or has disengaged."],
  win: ["The defender scores victory points for crippling and destroying enemy ships as normal, but none for holding the field.", "Subtract the victory points of every defending ship destroyed or disengaged.", "The horde scores nothing. The defender needs at least 2000 VP to win; anything less is a victory for the horde."],
  rtools: [{ k: "num", id: "vp", l: "Defender’s VP after deductions", s: "a", after: v => v >= 2000 ? "<b>Target reached</b>" : "Still <b>" + (2000 - v) + "</b> short of 2000" }],
  result(st) { const v = num(st, "vp"); return v >= 2000 ? ["a", "Defender’s victory", v + " VP — at least 2000."] : [null, "Horde wins unless the defender reaches 2000 VP", v + " VP so far."]; }
},

/* ===================================================== WR: SIEGE OF FULARIS */
{
  id: "siege-of-fularis", grp: "committee", name: "Siege of Fularis", series: "Gothic War", trust: "committee",
  why: "By Ray Bell, one of the 2010 Compendium authors (RB p. 3). Fularis II is official background (RB p. 25).",
  src: "Warp Rift 5, printed pp. 32–34 (PDF 33–35) · also Warp Rift Lite 05", book: "O", suggest: ["Chaos", "Imperial Navy"],
  others: "The attacker has to be Chaos: the scenario is built on Activated Blackstone Fortresses. The author lets any race defend.",
  sides: { a: { n: "Attacker", f: "Chaos (required)" }, b: { n: "Defender", f: "Imperial Navy" } },
  pitch: "Re-fight the first combined Blackstone shot: Chaos must bring two Activated Blackstone Fortresses close enough to scour Fularis II before the defenders cripple one.",
  glance: [["Points", "1500 each + 2 free Blackstones"], ["Table", "Not given — use your table"], ["Battlezone", "Primary or Inner Biosphere"], ["First turn", "Roll-off, winner chooses"], ["Game ends", "Planet dies, a Blackstone is crippled, or a fleet is gone"]],
  bring: ["Medium planet", "2 Activated Blackstone Fortresses", "Planetary defences (at least 1 orbital defence platform)", "Other phenomena as rolled"],
  forces: {
    a: ["1500 pts.", "Plus 2 Activated Blackstone Fortresses for free (FL p. 286) — 3000 pts in all."],
    b: ["1500 pts.", "Plus 3D6×10 pts of high-orbit defences; at least one orbital defence platform (laser, torpedo or weapons; FL p. 496–).", "Up to 1000 pts defend the planet; the rest is on patrol off the table."]
  },
  steps: [
    { t: "Place a medium planet no more than 100 cm from one short edge. Roll the other phenomena for the battlezone as usual. No low orbit table is needed." },
    { s: "b", t: "Deploy up to 1000 pts of ships anywhere within 60 cm of the planet. The rest of the fleet is on patrol, off the table." },
    { s: "b", t: "Place the planetary defences in the planet’s gravity well, each able to see at least part of the attacker’s deployment zone." },
    { s: "a", t: "Deploy the whole fleet, Blackstones included, within 15 cm of the short edge furthest from the planet." },
    { t: "Roll off. The higher roll chooses to go first or second." }
  ],
  notes: ["The source says the patrol is “up to ½ of the fleet (750 pts)”, which does not add up with 1000 pts at the planet. This page follows the deployment rule: whatever is not at the planet is on patrol.", "The author advises against using it mid-campaign (it is hard on the defender). As a campaign finale he suggests +5 renown for the winner and −2 for the loser, with no other renown."],
  refs: [["Activated Blackstone Fortress, Super-Mega-Death Shot", "FL p. 286"], ["Exterminatus (the scenario this one replaces)", "RB p. 140"], ["Planetary defences", "FL p. 496–"], ["Battlezone generators", "RB p. 107"]],
  play: [
    { w: "Charging the shot", s: "a", t: "Super-Mega-Death Shot (FL p. 286): a Blackstone must not move or fire for two turns, then stays still and fires in the shooting phase of the third. Blackstones no further apart than a Nova Cannon template’s diameter can combine." },
    { w: "Firing at the planet", s: "a", t: "In this scenario the shot is aimed at the planet from up to 75 cm. Use the range tool below — closer is better, base contact destroys the planet outright." },
    { w: "Disrupting the charge", s: "b", t: "A capital ship touching the area between charging Blackstones disrupts the charge: it takes 8 lance shots per charging Blackstone (no shields, no brace), each Blackstone takes D6 hits and must start charging again. Escorts and ordnance there are destroyed (FL p. 286)." },
    { w: "Start of your turn", s: "b", t: "You may roll for patrol ships not yet on the table: one D6 per escort squadron and per capital ship or squadron. Use the arrival rolls below (Tools)." },
    { w: "Any time", t: "A crippled Blackstone cannot fire the shot — and the game ends at once in the defender’s favour." }
  ],
  tools: [
    { k: "pick", id: "shot", l: "Shot at the planet — range from the planet", rows: [["60–75 cm", "6+"], ["45–60 cm", "5+"], ["30–45 cm", "4+"], ["15–30 cm", "3+"], ["Under 15 cm", "2+"], ["Base contact", "Destroyed"]], foot: "D6 score needed to exterminate the planet." },
    ARRIVAL("pat", "Patrol arrival rolls", { cl: "Patrols not yet on the table", il: i => "Patrol " + (i + 1), edges: [[1, 2, "Top long edge"], [3, 4, "Bottom long edge"], [5, 6, "The attacker’s short edge"]],
      sub: "One D6 per escort squadron and per capital ship or squadron. " + ARRIVE_SUB + " The second die is the arrival edge: 1–2 top, 3–4 bottom, 5–6 the attacker’s short edge." })
  ],
  end: ["One fleet disengages or is destroyed.", "A Blackstone is crippled.", "The planet is exterminated."],
  win: ["The planet is destroyed: the attacker wins.", "A Blackstone is crippled: the defender wins.", "A fleet that disengages or is destroyed loses."],
  rtools: [{ k: "ending", id: "how", l: "How did it end?", rows: [["The planet was destroyed", "a"], ["A Blackstone was crippled", "b"], ["The attacking fleet disengaged or was destroyed", "b"], ["The defending fleet disengaged or was destroyed", "a"]] }],
  result(st, v, S) { return endingResult(st, S, "how"); }
},
/* ===================================================== WR: ASSASSINATION */
{
  id: "assassination", grp: "committee", name: "Assassination", series: "Gothic War · after the novel Shadow Point", trust: "committee",
  why: "By Ray Bell, one of the 2010 Compendium authors (RB p. 3). The base version uses only book rules.",
  src: "Warp Rift 10, printed pp. 35–36 (PDF 36–37) · also Warp Rift Lite 10", book: "K", suggest: ["Imperial Navy", "Orks"],
  others: "The base version has no faction rules: any fleet can hunt and any fleet can defend.",
  sides: { a: { n: "Assassins", f: "Imperial Navy" }, b: { n: "Targets", f: "Orks" } },
  pitch: "A strike force must kill or drive off every enemy ship marked as a target. One survivor and the attack has failed.",
  glance: [["Points", "Agreed limit, each side"], ["Table", "180 × 120 cm"], ["Battlezone", "Any phenomena you like"], ["First turn", "Assassins"], ["Game ends", "All targets gone, or the assassins are"]],
  bring: ["A way to mark the targets", "Defences for the defender if wanted (no planet needed)"],
  forces: {
    a: ["Up to the agreed points limit."],
    b: ["Up to the agreed points limit.", "Choose targets: capital ships or squadrons of any type, even single defences. Targets may total at most 1/3 of the fleet’s points.", "Defences may be bought freely from the points; no planet is needed to deploy them."]
  },
  steps: [
    { t: "Set up a 180 × 120 cm table with any celestial phenomena you like." },
    { t: "Randomly decide which long edge each player deploys on." },
    { s: "b", t: "Deploy the whole fleet except the targets within 15 cm of your edge." },
    { s: "a", t: "Deploy the whole fleet within 15 cm of your edge." },
    { s: "b", t: "Deploy the targets within 15 cm of your edge." },
    { s: "a", t: "Take a Leadership test for each squadron. Passed: it may be re-deployed. Failed: it starts the game on Reload Ordnance (see Play)." },
    { s: "a", t: "The assassins take the first turn." }
  ],
  notes: ["The source’s set-up step 5 and its Special Rules describe the same Leadership test from two sides: passing allows re-deployment, failing means Reload Ordnance. It does not say where re-deployed ships may go — agree before play.", "The article also has a re-enactment of the battle from Shadow Point (WR10, printed pp. 37–39): fixed fleets led by Lord Solar Macharius, fan-made War-Rok and Terrok profiles, Seismic Torpedoes and two subplots. It needs the article’s profiles, so it is not laid out here."],
  refs: [["Reload Ordnance", "RB p. 46"], ["Leadership modifiers (enemy on special orders +1)", "RB p. 48"]],
  play: [
    { w: "Turn 1", s: "a", t: "Squadrons that failed the start-of-game test are on Reload Ordnance: they count as being on special orders (the enemy gets the usual +1 Leadership modifier) and may take no other special order in turn 1 except Brace for Impact." },
    { w: "All game", s: "a", t: "Every target must be destroyed or forced to disengage. A single target left at the end means defeat." }
  ],
  tools: [{ k: "counter", id: "tgt", l: "Targets still in play", s: "b", start: 2, res: 1 }],
  end: ["Every target is destroyed or has disengaged.", "Or the assassins’ fleet is destroyed or disengages."],
  win: ["The assassins win only by destroying or driving off every target. Otherwise they lose."],
  rtools: [{ k: "ending", id: "how", l: "How did it end?", rows: [["Every target destroyed or disengaged", "a"], ["Assassins’ fleet destroyed or disengaged", "b"]] }],
  result(st, v, S) { return endingResult(st, S, "how"); }
},
/* ===================================================== WR: ELIARENATH'S GIFT */
{
  id: "eliarenaths-gift", grp: "committee", name: "Eliarenath’s Gift", series: "Gothic War aftermath", trust: "committee",
  why: "By Roy “horizon” Amkreutz, Warp Rift’s editor. Eliarenath’s Gift is a named ship of the Gothic War (FL p. 319).",
  src: "Warp Rift 11, pp. 30–32", book: "O", suggest: ["Imperial Navy", "Orks", "Eldar Corsairs"],
  others: "Suggestion: any patrol and any ambushers work. The Gift’s restriction (no second move until the trap springs) is written for an Eldar cruiser; another lone fast cruiser can stand in if it simply may not attack or be attacked until the trap is sprung.",
  sides: { a: { n: "Patrol", f: "Imperial Navy" }, b: { n: "Ambush", f: "Orks" }, c: { n: "The Gift", f: "Eldar Corsairs" } },
  pitch: "A pirate cruiser leads a patrol into an asteroid field where four groups of raiders lie in wait.",
  glance: [["Points", "Patrol 1000 + Lunar · Ambush 1250 · 1 Eclipse"], ["Table", "180 × 120 cm"], ["Battlezone", "Outer Reaches"], ["First turn", "The Gift"], ["Victory", "Standard VP + two subplots"]],
  bring: ["Up to 16 asteroid fields (D3+3 and D6+4)", "4 contact markers", "A sun marker for the sunward edge"],
  forces: {
    a: ["Up to 1000 pts; at least half of it escorts.", "Plus Captain Durhan’s Lunar class cruiser Daecis III (Ld 8, 1 re-roll)."],
    b: ["Up to 1250 pts; at least half of it escorts.", "Split into four groups, one for each contact marker."],
    c: ["Corsair Eldar Eclipse class cruiser (FL p. 319), Ld 10, 1 re-roll for this ship only.", "Played by the ambush player or a third player."]
  },
  mapNote: "Left = sunward edge. The table is split lengthways into three equal strips; the Gift stays 60 cm from the sunward edge.",
  steps: [
    { t: "Pick one short edge as sunward. Divide the table lengthways into three equal strips ({w3} cm each on your table; 60 cm in the source)." },
    { t: "Place D3+3 asteroid fields in the middle strip and D6+4 in the strip furthest from the sun." },
    { s: "c", t: "Place the Gift 60 cm from the sunward edge, halfway between the long edges." },
    { s: "a", t: "Deploy within 30 cm of the sunward edge and at least 30 cm from both long edges." },
    { s: "b", t: "Split the fleet into four groups and note which group belongs to which contact marker." },
    { s: "b", t: "Place the 4 contact markers in the two strips away from the sun: at least 40 cm from the Gift and at least 50 cm from each other." },
    { s: "c", t: "The Gift takes the first turn; then the ambush may move its markers." }
  ],
  notes: ["The source gives no turn order after turn 1 when a third player commands the Gift, and does not say exactly where an activated group is placed — the marker’s position is the natural reading. Agree before play."],
  refs: [["Eclipse class cruiser", "FL p. 319"], ["Lunar class cruiser", "FL p. 71"], ["Victory points", "RB p. 122"]],
  play: [
    { w: "Every turn", s: "b", t: "Move each contact marker up to 15 cm. The 50 cm spacing no longer applies." },
    { w: "Movement phase", s: "a", t: "A patrol ship coming within 30 cm of a marker activates it. At the end of the patrol’s movement, the group of that marker is deployed." },
    { w: "From turn 2", s: "b", t: "You may also activate a marker of your own choice." },
    { w: "Until the trap is sprung", s: "c", t: "The Gift does not use its second move, and the patrol may not attack it. Once the trap is sprung it moves and fights normally and may be attacked." },
    { w: "Exit edge (opposite the sun)", t: "Ambush +100 VP if the Gift leaves through it. Patrol +200 VP for the first ship or escort squadron to leave through it." }
  ],
  tools: [
    { k: "toggle", id: "trap", l: "The trap is sprung (first marker activated)", s: "b" },
    { k: "counter", id: "mk", l: "Contact markers still hidden", s: "b", start: 4, max: 4 }
  ],
  end: ["Standard end: a fleet is destroyed or disengages (RB p. 122)."],
  win: ["Standard victory points (RB p. 122), plus the subplots below."],
  rtools: [
    { k: "toggle", id: "giftout", l: "The Gift escaped off the exit edge (ambush +100 VP)", s: "b" },
    { k: "toggle", id: "inout", l: "A patrol ship or escort squadron left by the exit edge first (patrol +200 VP)", s: "a" }
  ],
  result(st) { const o = get(st, "giftout", false) ? 100 : 0, i = get(st, "inout", false) ? 200 : 0;
    return [null, "Count standard victory points, then add the subplots", "Ambush +" + o + " VP · Patrol +" + i + " VP."]; }
},
/* ===================================================== WR: DIASPOREX GAMBIT */
{
  id: "diasporex-gambit", grp: "committee", name: "The Hammer Needs an Anvil", series: "The Diasporex Gambit · Scenario One", trust: "committee",
  why: "By Roy “horizon” Amkreutz, Warp Rift’s editor. Every ship is in Fleets v0.40.",
  src: "Warp Rift 34, pp. 44–45", book: "O", suggest: ["Inquisition", "Rogue Traders"],
  others: "Suggestion: any boarding-strong cruiser can hunt any small convoy of one cruiser, two armed escorts and four transports. The Ordo Hereticus bonuses belong to the Inquisition only.",
  sides: { a: { n: "Hunter", f: "Inquisition" }, b: { n: "Hunted", f: "Rogue Traders" } },
  pitch: "Inquisitor Lord Jeremiah Crowe intercepts a Rogue Trader convoy to capture Premar Lart — but which ship is he on?",
  glance: [["Points", "Fixed forces"], ["Table", "180 × 120 cm"], ["Battlezone", "Any, rolled as per the rulebook"], ["First turn", "Hunter"], ["Game ends", "Lart captured or escaped, or the hunter’s cruiser destroyed"]],
  bring: ["A secret note for Lart’s ship (or the tool in Play)", "1 ordnance marker as the escape pod"],
  forces: {
    a: ["Jeremiah Crowe, Inquisitor Lord of the Ordo Hereticus: Ld 10, one extra re-roll; Ordo Hereticus boarding and hit-and-run rules apply (FL p. 141).", "Damnation’s Fear: Inquisitorial Cruiser with the dorsal lance upgrade (FL p. 160)."],
    b: ["Premar Lart, Ld 9.", "Sunstar: Rogue Trader cruiser with Advanced Shielding (FL p. 185).", "2 Armed Freighters (FL p. 523).", "4 Cargo Transports."]
  },
  mapNote: "Deployment depth from the short edges is not given — agree it before play.",
  steps: [
    { t: "Roll the battlezone and its phenomena as per the rulebook (RB p. 107–108)." },
    { t: "Use a 180 × 120 cm table. The hunter deploys within {a:dep} cm of one short edge, the hunted within {a:dep} cm of the opposite one (agreed above), heading towards each other." },
    { s: "b", t: "Secretly record which ship Lart is aboard (use the Hidden ship tool in Play)." },
    { s: "a", t: "The hunter takes the first turn." }
  ],
  notes: ["The source says “both fleets are deployed on one of the short table edges”. Opposite edges are the reading used here, since Crowe intercepts head-on and Lart escapes off the opposing edge.", "The escape pod rule covers Lart’s ship exploding after a hit-and-run attack. The source says nothing about his ship being destroyed some other way — agree before play."],
  refs: [["Ordo Hereticus", "FL p. 141"], ["Inquisitorial Cruiser", "FL p. 160"], ["Advanced Shielding", "FL p. 185"], ["Armed Freighter", "FL p. 523"], ["Boarding actions", "RB p. 89"]],
  play: [
    { w: "Hit and run", s: "a", t: "A successful hit-and-run attack on a ship reveals whether Lart is aboard. It cannot capture him." },
    { w: "Boarding", s: "a", t: "Capturing Lart takes a successful boarding action against the ship he is on." },
    { w: "If Lart’s ship explodes", s: "b", t: "If it explodes as a result of a hit-and-run attack, place an ordnance marker: Lart’s escape pod. Speed 15 cm; it may dock with a friendly ship." },
    { w: "Catching the pod", s: "a", t: "Damnation’s Fear captures the pod by moving over it. Its attack craft can lock the pod in place." }
  ],
  tools: [
    { k: "secret", id: "lart", l: "Hidden ship — hunted player only", opts: ["Sunstar", "Armed Freighter 1", "Armed Freighter 2", "Cargo Transport 1", "Cargo Transport 2", "Cargo Transport 3", "Cargo Transport 4"] },
    { k: "toggle", id: "pod", l: "Escape pod in play", s: "b" }
  ],
  end: ["Lart is captured.", "Lart escapes.", "Damnation’s Fear is destroyed."],
  win: ["The hunter wins by capturing Lart.", "The hunted win if Lart escapes off the opposing table edge or Damnation’s Fear is destroyed."],
  rtools: [{ k: "ending", id: "how", l: "How did it end?", rows: [["Lart was captured", "a"], ["Lart escaped off the hunter’s edge", "b"], ["Damnation’s Fear was destroyed", "b"]] }],
  result(st, v, S) { return endingResult(st, S, "how"); }
},
/* ===================================================== WR: EVENT HORIZON */
{
  id: "event-horizon", grp: "committee", name: "Event Horizon", series: "Warp Rift 43 · 20th anniversary issue", trust: "committee",
  why: "By Roy “horizon” Amkreutz, Warp Rift’s editor. Uses Fleets v0.40 lists plus the scenario’s own ship profile.",
  src: "Warp Rift 43, pp. 56–58", book: "O", suggest: ["Adeptus Mechanicus", "Inquisition", "Rogue Traders"],
  others: "Any two fleets of 750 pts. The source’s list limits (no Grey Knights, Black Ships or Mechanicus reserves) only matter for an Inquisition fleet.",
  sides: { a: { n: "Fleet 1", f: "Adeptus Mechanicus" }, b: { n: "Fleet 2", f: "Inquisition or Rogue Traders" } },
  pitch: "A legendary lost ship drops out of the warp beside a ringed gas giant. Two fleets race to board it before it slips back.",
  glance: [["Points", "750 each"], ["Table", "Not given — use your table"], ["Battlezone", "Deep Space"], ["First turn", "The attacker"], ["Game ends", "When the Event Horizon is gone"]],
  bring: ["Large planet + two gas/dust rings", "4 asteroid fields (2 per player)", "A cruiser model or marker for the Event Horizon"],
  forces: {
    a: ["Up to 750 pts; at most two normal cruisers."],
    b: ["Up to 750 pts, led by an Inquisitor Lord of the Ordo Xenos or Ordo Malleus.", "No Grey Knights, Black Ships or Adeptus Mechanicus reserves.", "Alternative: one or two Rogue Trader fleets of 750 pts."]
  },
  mapNote: "Table size and corner size are not given; the map follows the source’s picture. Roll-off winner picks one of the two corners away from the planet.",
  steps: [
    { t: "Battlezone Deep Space. Place a large planet on the centre line, towards one long edge (as on the map)." },
    { t: "Add two gas/dust rings: the first starts 15 cm from the planet’s edge and is 5 cm wide, the second starts 25 cm out and is 7 cm wide." },
    { t: "Each player places two asteroid fields, each D3×5 cm wide and D3×5 cm long." },
    { t: "Place the Event Horizon between the planet and the inner ring, on the table’s centre line." },
    { t: "Roll off. The higher roll picks the corner its fleet deploys in: within {a:corner} cm of that corner (agreed above)." },
    { t: "The attacker takes the first turn." }
  ],
  notes: ["The source does not define the attacker, the table size or the size of the deployment corners. Agree before play.", "The article also prices the Event Horizon for normal Chaos fleets (300 pts, heavy cruiser slot)."],
  refs: [["Inquisition fleet list", "FL p. 128–"], ["Boarding actions", "RB p. 89"], ["Gas and dust clouds, asteroid fields", "RB p. 104–116"]],
  play: [
    { w: "Base contact", t: "A ship touching the Event Horizon takes a Leadership test on 3D6, dropping the lowest die. Each extra ship of the same fleet in that boarding lowers the highest die by 1; each enemy ship joining it raises the highest die by 1. A pass scores 1 Event Horizon point. Use the calculator below." },
    { w: "Shooting", t: "Either side may shoot the Event Horizon to deny the other. Mirrors: roll a D6 per hit — on 3+ the hit is reflected back at the firing ship. Against ordnance roll once per wave: 3+ cancels the attack." },
    { w: "Every end phase", t: "Roll on Horrors of the Warp (below). The effect hits every ship within 15 cm of the Event Horizon." },
    { w: "End phase, at 2 hits or fewer", t: "Warp bound: roll a D6. On 4+ the Event Horizon is pulled back into the warp and removed." },
    { w: "One fleet gone", t: "When a fleet is destroyed or fully disengaged, the other gets D3 more turns to score; then the Event Horizon falls back into the warp." }
  ],
  tools: [
    { k: "html", html: "<h3>Event Horizon profile</h3><table class='prof'><tr><th>Type/Hits</th><th>Speed</th><th>Turns</th><th>Shields</th><th>Armour</th><th>Turrets</th></tr><tr><td>Cruiser/10</td><td>20 cm</td><td>45°</td><td>Special</td><td>6+</td><td>0</td></tr></table><p class='sub' style='margin:6px 0 0'>It never moves in this scenario.</p>" },
    { k: "counter", id: "eha", l: "Event Horizon points — Fleet 1", s: "a", res: 1 },
    { k: "counter", id: "ehb", l: "Event Horizon points — Fleet 2", s: "b", res: 1 },
    { k: "counter", id: "hp", l: "Event Horizon hits left", s: "c", start: 10, max: 10, warn: v => v <= 2 ? "Warp bound: roll a D6 every end phase, 4+ it is gone." : "" },
    { k: "board", id: "bd", l: "Boarding test calculator" },
    { k: "roll", id: "hor", l: "Horrors of the Warp", sub: "D6, every end phase", rows: () => [[1, 2, "Warp full of Horrors: every ship within 15 cm takes D3+1 hits. Shields do not help."], [3, 4, "Dreams of Doom: ships within 15 cm cannot take special orders or make any Leadership test, Brace for Impact included, during the next turn (theirs and the opponent’s)."], [5, 6, "Herald of Dread: roll a D6 per ship within 15 cm. On 4+ a daemon commands it next turn: it turns towards the nearest celestial phenomenon and moves at full speed, nothing else."]] }
  ],
  end: ["When one fleet is destroyed or fully disengaged, the other has D3 more turns; then the Event Horizon returns to the warp.", "The game lasts until the Event Horizon is removed."],
  win: ["Most Event Horizon points wins.", "A tie on points is decided by standard victory points (RB p. 122)."],
  result(st) { const a = get(st, "eha", 0), b = get(st, "ehb", 0);
    if (a + b === 0) return [null, "Battle in progress", "No Event Horizon points scored yet."];
    if (a > b) return ["a", "Fleet 1 leads", a + " to " + b + " Event Horizon points."];
    if (b > a) return ["b", "Fleet 2 leads", b + " to " + a + " Event Horizon points."];
    return ["draw", "Level on Event Horizon points", a + " each — standard victory points decide."]; }
},
/* ===================================================== LORE: FALL OF AR'CIANR */
{
  id: "fall-of-arcianr", grp: "lore", name: "Fall of Ar’Cianr", series: "Shadowsun scenario competition", trust: "lore",
  why: "By Ehlijen, a competition entry built on the Tau codex story of Shadowsun’s campaign against the Tyranids. Played with the book’s lists.",
  src: "Warp Rift 20, pp. 25–26", book: "O", suggest: ["Tau", "Tyranids"],
  others: "Suggestion: the synapse and instinctive-behaviour rules exist only for Tyranids — with another invader, drop them. The flagship rule (no disengaging until it is crippled) works for any relief fleet.",
  sides: { a: { n: "Relief fleet", f: "Tau" }, b: { n: "Invaders", f: "Tyranids" } },
  pitch: "A relief fleet arrives at a colony already in the grip of the invaders — with a third enemy force waiting to join in.",
  glance: [["Points", "Relief 1750 · Invaders 750 + 500 + 400"], ["Table", "At least 180 cm long"], ["Battlezone", "Primary Biosphere"], ["First turn", "Relief fleet if its commander passes Ld"], ["Victory", "Relief fleet needs 2 of 3 objectives"]],
  bring: ["Medium planet", "Low orbit table (RB p. 116)", "2 contact markers (Force 3)", "Up to 3 ground defences", "5 transports"],
  forces: {
    a: ["Up to 1750 pts (Tau: mix East Cluster Fleet and Commerce Protection Fleet ships).", "Up to 3 planetary ground defences — the colony’s last defenders.", "A convoy of 5 transports."],
    b: ["Force 1: capital ships and escorts, up to 750 pts (Tyranids: hive ships).", "Force 2: cruisers and escorts, up to 500 pts.", "Force 3: anything, up to 400 pts — arrives later.", "Forces 1 and 2 count as one fleet for list restrictions; Force 3 must be legal on its own."]
  },
  fixed: {
    a: ["Custodian Aspiration: Commander Shadowsun (Ld 10) with Aun’va (two extra re-rolls)", "3 Wardens", "Protector Starsong (Ld 8)", "Protector Destiny (Ld 7)", "Hero Long Reach (Ld 8)", "Explorer Progress (Ld 8)", "3 Orcas", "3 Defenders (Ld 8)", "4 Castellans (Ld 7)", "Ground: 3 planetary airfields (Mantas and Barracudas)", "Convoy: 5 transports"],
    b: ["Force 1: hive ship (Ld 8, no upgrades, up to 100 pts of weapons); hive ship (Ld 8, no upgrades, up to 120 pts of weapons); 2 + 2 escort drones", "Force 2: cruiser (no upgrades, up to 50 pts of weapons); cruiser (no upgrades, up to 40 pts of weapons); 3 + 3 vanguard drones; 2 kraken", "Force 3: hive ship (Ld 9, one evolutionary upgrade, 1 re-roll, up to 120 pts of weapons); 3 escort drones; 3 kraken"]
  },
  mapNote: "The planet sits on the centre line, 150 cm from the far short edge. Force 2 and the ground defences start on the low orbit table, off the main table.",
  steps: [
    { t: "Place a medium planet on the centre line, 150 cm from one short edge (the far edge). Roll the other phenomena as for a Primary Biosphere." },
    { t: "Set up the low orbit table for the planet (RB p. 116)." },
    { s: "b", t: "Deploy Force 1 within 20 cm of the planet, every ship facing at least 135° away from the far short edge." },
    { s: "b", t: "Deploy Force 2 on the low orbit table, each ship facing no more than 45° away from the planet." },
    { s: "a", t: "Deploy the fleet and the convoy within 30 cm of the far short edge and at least 120 cm from the planet." },
    { s: "a", t: "Place the ground defences on the low orbit table." },
    { s: "a", t: "Your fleet commander takes a Leadership test: pass and you go first, fail and the invaders go first." }
  ],
  refs: [["Low orbit table", "RB p. 116"], ["Planetary defences", "FL p. 496–"], ["Battlezone generators", "RB p. 107"]],
  play: [
    { w: "Start of your turn", s: "b", t: "Roll a D6 for each ground defence: on 4+ it is overrun and removed. For each assault point the relief fleet has scored, one of these rolls is passed automatically each turn." },
    { w: "Always (Tyranids)", s: "b", t: "While a hive ship stays stationary in high orbit, every Tyranid ship on the low orbit table is within its synapse range." },
    { w: "Low orbit, instinctive behaviour (Tyranids)", s: "b", t: "A Tyranid ship on the low orbit table that must approach the planet may hold station instead. It counts enemies on the low orbit table as closer than any others, and enemies off it as being in its side arc." },
    { w: "Start of your turn: Force 3", s: "b", t: "With at least one of your ships crippled, you may call Force 3: place a contact marker on each long edge. From the next turn, roll a D6 at the start of each of your turns; on 4+ pick a marker at random and bring Force 3 on within 15 cm of it." },
    { w: "All game", s: "b", t: "You may not gain assault points, and may disengage only off the far short edge (the relief fleet’s edge)." },
    { w: "All game", s: "a", t: "No ship may disengage until your flagship (the Aspiration) is crippled." }
  ],
  tools: [
    { k: "counter", id: "ap", l: "Assault points delivered", s: "a", goal: 10, res: 1 },
    { k: "counter", id: "gd", l: "Ground defences left", s: "a", start: 3, max: 3 },
    { k: "toggle", id: "f3", l: "Force 3 has been called", s: "b" }
  ],
  end: ["The relief fleet has achieved two objectives, or can no longer achieve any more."],
  win: ["Relief fleet victory: two objectives. One objective is a draw; none is a defeat."],
  rtools: [
    { k: "obj", id: "o1", l: "No relief capital ship lost until every invader ship is destroyed or disengaged (if Forces 1 and 2 die before Force 3 arrives, this counts as done until it arrives)" },
    { k: "obj", id: "o2", l: "At least 10 assault points delivered (each ground defence still standing at the end adds 1)", hint: st => { const ap = get(st, "ap", 0), gd = get(st, "gd", 3); return "Now: " + ap + " assault points + " + gd + " defences = " + (ap + gd); } },
    { k: "obj", id: "o3", l: "No invader capital ship from Forces 1 and 2 escaped" }
  ],
  result(st) {
    const v = ["o1", "o2", "o3"].map(k => get(st, k, ""));
    const y = v.filter(x => x === "y").length, n = v.filter(x => x === "n").length;
    if (y >= 2) return ["a", "Relief fleet victory", "Two objectives achieved."];
    if (n >= 2 && y === 0) return ["b", "Relief fleet defeat", "No objective is still possible."];
    if (n >= 2 && y === 1) return ["draw", "Draw", "One objective achieved."];
    return [null, "Battle in progress", y + " achieved, " + n + " failed, " + (3 - y - n) + " open."];
  }
},
/* ===================================================== LORE: UNKNOWN WEAPONS */
{
  id: "unknown-weapons", grp: "lore", name: "Unknown Weapons", series: "Shadowsun scenario competition", trust: "lore",
  why: "By Volandum, a competition entry on the same Shadowsun background as Fall of Ar’Cianr. Played with the book’s lists.",
  src: "Warp Rift 20, p. 27", book: "O", suggest: ["Tau", "Tyranids"],
  others: "Suggestion: any fleets — a slow fleet in the middle and a faster one around the edges. The banned Tyranid options simply do not apply to other fleets.",
  sides: { a: { n: "Ambushers", f: "Tau" }, b: { n: "Hive group", f: "Tyranids" } },
  pitch: "A faster fleet surrounds a slow group in open space and tries to wipe it out before it learns anything about their weapons.",
  glance: [["Points", "Ambushers ≈ 1.5 × hive group"], ["Table", "200 × 200 cm ideal"], ["Battlezone", "Outer Reaches suggested"], ["First turn", "Ambushers"], ["Game ends", "Ambushers’ deadline: turn 10"]],
  bring: ["A big table — 200 × 200 cm is ideal", "Outer Reaches phenomena, if you want terrain"],
  forces: {
    a: ["Any standard fleet, about 1.5 times the hive group’s points.", "Tau: each ship may double its gravity hooks."],
    b: ["A Tyranid hive fleet without vanguard drones or kraken and without evolutionary upgrades."]
  },
  mapNote: "The source describes a 200 × 200 cm table with a central 100 × 100 cm zone. The map keeps that proportion: half the table each way.",
  steps: [
    { t: "Use a 200 × 200 cm table if you can. Add Outer Reaches phenomena if you want terrain." },
    { s: "b", t: "Deploy in the centre — the central 100 × 100 cm on a 200 cm table." },
    { s: "a", t: "Deploy anywhere along the table edges, each ship touching an edge and pointing inward." },
    { s: "a", t: "The ambushers take the first turn." }
  ],
  refs: [["Disengaging", "RB p. 56"]],
  play: [
    { w: "All game", s: "b", t: "Only a ship or squadron that just dealt the final blow to an enemy carrier may disengage. Any other ship of yours leaving the table counts as destroyed." },
    { w: "Objective", s: "a", t: "Destroy the whole hive group within ten turns." }
  ],
  turnMax: () => 10,
  tools: [],
  end: ["The ambushers’ objective runs out after turn 10."],
  win: ["Hive group victory: an enemy carrier is destroyed and the ship or squadron that finished it disengages.", "Otherwise, ambushers’ victory if the hive group is destroyed within ten turns.", "Otherwise a draw."],
  rtools: [
    { k: "toggle", id: "car", l: "An ambusher carrier was destroyed", s: "b" },
    { k: "toggle", id: "esc", l: "…and its killer disengaged", s: "b" },
    { k: "toggle", id: "wipe", l: "Hive group destroyed within ten turns", s: "a" }
  ],
  result(st) {
    if (get(st, "car", false) && get(st, "esc", false)) return ["b", "Hive group victory", "It got away with what it came for."];
    if (get(st, "wipe", false)) return ["a", "Ambushers’ victory", "The hive group was destroyed in time."];
    if (st.turn > 10) return ["draw", "Draw", "Neither objective was met."];
    return [null, "Battle in progress", "Turn " + st.turn + " of 10."];
  }
}
];

export const RATINGS = [["Imperial", 2], ["Chaos", 2], ["Tau", 2], ["Orks", 3], ["Craftworld Eldar", 3], ["Space Marines", 3], ["Tyranids", 3], ["Corsair Eldar", 4], ["Dark Eldar", 4], ["Necrons", 4]];
export const RAIDS = [[1, 1, "cruiser-clash"], [2, 2, "the-bait"], [3, 3, "the-raiders"], [4, 4, "blockade-run"], [5, 6, "convoy"]];
export const BATTLES = [[1, 1, "exterminatus"], [2, 2, "surprise-attack"], [3, 3, "planetary-assault"], [4, 4, "escalating-engagement"], [5, 6, "fleet-engagement"]];
