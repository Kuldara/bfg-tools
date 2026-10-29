/* Terrain per scenario (0.9, 21.10.2026). The Battlezone Generator's core (battlezone-core.js) rolls the
   scenario's map; this table tells, for every scenario, what is rolled and on what grounds. The owner's line
   21.10.: the button is in every scenario. Alternating set-up is not implemented. When rolled terrain does not
   fit the scenario's idea, a one-line note says so (warn). Fields (apps/terrain/README.md describes generate()):
   z      battlezone: 1 Flare, 2 Mercurial, 3 Inner, 4 Primary, 5 Outer, 6 Deep; "any" = the source leaves it open
          (default D6, RB p. 105, or choose); [4, 3] = the source's alternatives, the first as default;
          { die, rows: [[lo, hi, n]], text } = the source's own roll; "none" = the source lists the pieces, no
          generator; a function (st, v) = the scenario's own rolling tool decides
   by     the grounds: "src" the source says, "obv" obvious from the source, "book" the source leaves it open (the
          book's default), "ours" our own reading (why says why)
   warn   a note when rolled terrain departs from the scenario's idea; note = extra information
   hosts  the scenario's planets, whose moons and rings are rolled "as normal" (position from the map)
   pieces the pieces the scenario lists: kind, count (a number or a die), area, set (printed size), apart, pick
   areas: false = no 60 cm area rolls; rolls / everyArea / table / cap / ignore / reroll / events
   sun    a fixed sunward edge (l/r/t/b), "none" or a roll; otherwise the map's sun item or the book's D6 (RB p. 109)
   keep   areas kept clear as well; noBlock / drop = map items that do not block or that are replaced
   fixedSize the map planets' real size as an obstacle (default from the label, otherwise medium)
   v      changes per version
   Function fields get (v, W, H, st, items); the z function gets (st, v). */
const TERRAIN = {};
(function () {
/* helpers inside the IIFE: the library's globals (e.g. ANY) do not clash */
function TM(id, s) { TERRAIN[id] = s; }

const TURNS = "The source has the players take turns placing these phenomena. This rolls the same pieces, sizes and spots instead — use it if you both agree.";
const TURNS_FREE = "The source has the players take turns placing phenomena of their choice. This rolls them by the rulebook instead (RB p. 105) — use it if you both agree.";
const ONLY = "The source puts nothing else on the table: this adds rolled phenomena around its own. Not the scenario’s idea — use it only if you both want more terrain.";
const NONE = "The source plays this one without celestial phenomena. Rolled terrain changes the scenario — use it only if you both agree.";
const BASE = "Each battle is played as its own scenario: generate the terrain on that scenario’s page. This rolls a table for the battle by the rulebook.";
const OWN = n => "The scenario rolls this itself with “" + n + "” (Set-up tools). This button rolls the same thing with sizes and spots — use one or the other, not both.";
const PLACER = who => "The source has " + who + " place the phenomena (Method 1, RB p. 105). This rolls them instead — use it if you both agree.";

const OUTER_DEEP = { die: 6, rows: [[1, 3, 5], [4, 6, 6]], text: "the scenario: 1–3 outer reaches, 4–6 deep space" };
const PSIZE = { rows: [[1, 1, "small"], [2, 5, "medium"], [6, 6, "large"]], text: "the scenario’s D6: 1 small, 2–5 medium, 6 large" };
const LONG_EDGE = { rows: [[1, 3, "top"], [4, 6, "bottom"]], text: "a long edge the players name; rolled here: 1–3 top, 4–6 bottom" };
const NOPLANET = { ignore: ["planet"] };
/* skin (21.10.): a scenario's own phenomenon with a core piece type. AS = the book's rule under the scenario's name
   and explanation, OWNRULE = the scenario's own rule text. tool = a Set-up tool the generator replaces (its buttons there). */
const AS = (kind, lede) => Object.assign({}, BZ.RULES[kind], { page: "RB " + BZ.RULES[kind].page, lede });
const OWNRULE = (src, text) => ({ page: src, groups: [{ head: "In play", cite: src, items: [text] }] });

/* the scenario's planet from the map (the first planet item), moons and rings "as normal" */
const MAPPLANET = (size, o) => (v, W, H, st, items) => {
  const p = items.find(bzIsPlanet);
  const x = Object.assign({}, o || {}, { size: typeof size === "function" ? size(st) : size });
  if (typeof x.sizeText === "function") x.sizeText = x.sizeText(st);
  return p ? [Object.assign(x, { x: p.cx, y: p.cy })] : [];
};
/* the Planet size tool (PA, Exterminatus): its result if rolled; otherwise the core rolls the same table */
const PSZ = st => { const r = +(st && st.w && st.w.psize) || 0; return r ? (r === 1 ? "small" : r === 6 ? "large" : "medium") : PSIZE; };
const PSZT = st => +(st && st.w && st.w.psize) ? "from the Planet size roll in Set-up tools" : undefined;
/* the scenario's own battlezone tool: its result if rolled; otherwise the core rolls the same table */
const ZTOOL = (id, rows, text) => st => { const f = +(st && st.w && st.w[id]) || 0, hit = f && rows.find(r => f >= r[0] && f <= r[1]); return hit ? hit[2] : { die: 6, rows, text }; };
const QUARTERS = (W, H) => [[0, 0, "top left"], [W / 2, 0, "top right"], [0, H / 2, "bottom left"], [W / 2, H / 2, "bottom right"]].map(([x, y, n]) => ({ x0: x, y0: y, w: W / 2, h: H / 2, name: "the " + n + " quarter" }));
const SQUARES = (W, H, size) => { const g = gridOf(W, H, size), o = []; for (let r = 0; r < g.r; r++) for (let c = 0; c < g.c; c++) o.push({ x0: c * g.sw, y0: r * g.sh, w: g.sw, h: g.sh, name: "square " + (o.length + 1) }); return o; };
const PER = (areas, kind, count) => areas.map(a => ({ kind, count, area: a }));
/* an empty zone around the map's planets: pad cm from the planet's edge (real = the real radius, otherwise as drawn) */
const AROUND = (pad, real) => (v, W, H, st, items) => items.filter(i => i.z === "planet").map(p => ({ shape: "circle", x: p.cx, y: p.cy, r: (bzIsPlanet(p) ? real || p.r : Math.max(p.r, 2.5)) + pad }));

/* ---------------------------------------------------------------- rulebook (RB p. 128–143) */
TM("cruiser-clash", { z: OUTER_DEEP, by: "src", why: "The rulebook: once you know the basics, roll a D6 — 1–3 outer reaches, 4–6 deep space (RB p. 129).",
  v: { std: { warn: "The rulebook suggests no celestial phenomena for your first game (RB p. 128). Generate terrain once you know the basics." } } });
TM("the-bait", { z: OUTER_DEEP, by: "src" });
TM("the-raiders", { z: "any", by: "book", why: "The source: any mutually agreed way (RB p. 131). Roll the battlezone, or pick one." });
TM("surprise-attack", { z: [4, 3], by: "src", hosts: MAPPLANET(st => st.bz && st.bz.p || "medium", { name: "The planet in the middle", sizeText: "by the points, picked above" }),
  pick: { label: "Planet", opts: [["small", "Small planet (up to 500 pts)"], ["medium", "Medium planet (500–1500 pts)"], ["large", "Large planet (over 1500 pts)"]], def: "medium" },
  note: "The planet in the middle gets its moons and rings as normal (RB p. 132); pick its size by the points." });
TM("blockade-run", { z: [5, 6], by: "src" });
TM("convoy", { z: "any", by: "src", why: "The source: agree the phenomena, or roll the region of space and use its generator (RB p. 134)." });
TM("planetary-assault", { z: [4, 3], by: "src", hosts: MAPPLANET(PSZ, { name: "The planet", sizeText: PSZT }),
  note: "The planet gets its moons and rings as normal (RB p. 136). Its size comes from the Planet size roll if you made it, otherwise it is rolled here." });
TM("escalating-engagement", { z: "any", by: "book", why: "The source: any method you both agree (RB p. 138). Roll the battlezone, or pick one." });
TM("exterminatus", { z: [4, 3], by: "src", hosts: MAPPLANET(PSZ, { name: "The planet", sizeText: PSZT }),
  note: "The planet gets its moons and rings as normal (RB p. 140). Its size comes from the Planet size roll if you made it, otherwise it is rolled here." });
TM("fleet-engagement", { z: "any", by: "src", why: "The source: normally the primary or inner biosphere, but anywhere, in any agreed way (RB p. 142). Roll it, or pick one." });

/* ---------------------------------------------------------------- campaigns (RB p. 178–199) */
TM("gauntlet", { z: 4, by: "src", ignore: ["planet"], ignoreText: "The Gauntlet ignores any roll that gives a planet (RB p. 178)" });
TM("parols-bait", { z: { die: 6, rows: [[1, 4, 5], [5, 6, 4]], text: "the scenario: 1–4 outer reaches, 5–6 primary biosphere" }, by: "src" });
TM("pelucidar", { z: 5, by: "src", note: "Pelucidar goes down after the roll; with it on the table a rolled planet is rolled again (one planet at most, RB p. 108)." });
TM("bc-chance-encounter", { z: "any", by: "src", why: "The source: whatever celestial terrain you wish (RB p. 191). Roll the battlezone, or pick one." });
TM("bc-rearguard-attack", { z: "any", by: "src", why: "The source: whatever celestial terrain you wish (RB p. 192). Roll the battlezone, or pick one." });
TM("bc-alien-intervention", { z: "any", by: "src", why: "The source: whatever terrain you wish, plus a planet and a drifting hulk near the centre (RB p. 193)." });
TM("bc-above-belis-corona", { z: "none", by: "src", zoneText: "the scenario places Belis Corona and one asteroid field for each player", areas: false, fixedSize: "large",
  why: "The source names no battlezone: Belis Corona in the centre and one asteroid field for each player, at least 30 cm from it (RB p. 194).",
  pieces: [{ kind: "asteroid", count: 2, text: "one for each player, at least 30 cm from the planet" }], keep: AROUND(30),
  warn: "The source has each player place their asteroid field; here both are rolled, at least 30 cm from the planet as drawn." });
TM("bc-daemon-blockade", { z: [5, 6], by: "src" });
TM("bc-navigate-the-storm", { z: "none", by: "src", zoneText: "the scenario’s sixteen warp rifts", areas: false,
  why: "The source names no battlezone: sixteen warp rifts, each at least 10 cm from the others (RB p. 197).",
  pieces: [{ kind: "rift", count: 16, apart: 10, text: "eight each, at least 10 cm apart" }],
  warn: "The source has the players take turns placing their eight rifts each; here all sixteen are rolled, 10 cm apart." });
TM("bc-macharias-end", { z: "any", by: "book", fixedSize: "large", note: "The source places only Macharia and says nothing about other phenomena (RB p. 198)." });

/* ---------------------------------------------------------------- Fleets (FL p. 210–221, 336–339) */
TM("fl-merchantmens-folly", { z: "any", by: "src", why: "The source: any agreed way, near a planet or out in deep space (FL p. 210)." });
TM("fl-hunter-and-prey", { z: "none", by: "src", zoneText: "the scenario places two small planets and asteroid fields", areas: false, fixedSize: "small",
  why: "The source names no battlezone: two small planets and D3 asteroid fields in each quarter, none within 15 cm of a planet (FL p. 212).",
  pieces: (v, W, H) => PER(QUARTERS(W, H), "asteroid", "d3"), keep: AROUND(15, 7.5),
  note: "The map keeps the sunward edge on the left; if your roll says right, mirror the table. Other phenomena only if you agree." });
TM("fl-rt-gauntlet", { z: 6, by: "src", ignore: ["planet"], ignoreText: "the scenario ignores any planet (FL p. 214)" });
TM("fl-explorers-prize", { z: "any", by: "book", ignore: ["planet"], ignoreText: "never a planet (FL p. 216)",
  warn: "The source adds phenomena beyond the asteroid belt only if you both agree — and never a planet." });
TM("fl-space-hulk", { z: "any", by: "src", why: "The source: any agreed way (FL p. 218)." });
TM("fl-void-malevolent", { z: "any", by: "src", why: "The source: any agreed way — a sun, low orbit or asteroids may hide the foe (FL p. 220)." });
TM("fl-craftworld-assault", { z: ZTOOL("bz", [[1, 2, 4], [3, 4, 5], [5, 6, 6]], "the scenario’s D3: primary biosphere, outer reaches or deep space"), by: "src",
  ignore: ["planet"], ignoreText: "the scenario ignores any planet (FL p. 336)", zoneText: "from the Battlezone roll in Set-up tools" });

/* ---------------------------------------------------------------- Classic GW */
TM("cl-callavell", { z: "any", by: "book", warn: ONLY });
TM("cl-torpedo-run", { z: [6, 5], by: "src", note: "The source wants an uncluttered table: a few phenomena only." });
TM("cl-space-hulk-convoy", { z: "any", by: "book", warn: "The source has the ambushers place as many asteroid fields and ship graveyards as they like in their zones. This rolls phenomena by the rulebook instead." });
TM("cl-phillipa", { z: "any", by: "book", warn: BASE });
TM("cl-corribra-1", { z: 6, by: "src" });
TM("cl-corribra-2", { z: 6, by: "src" });
TM("cl-corribra-3", { z: 6, by: "src" });
TM("cl-corribra-4", { z: 6, by: "src" });
TM("cl-pirates-campaign", { z: "any", by: "book", warn: BASE });
TM("cl-treasure-fleet", { z: [4, 3], by: "src", hosts: MAPPLANET("medium", { name: "The medium planet" }), note: "The medium planet gets its moons and rings as normal (BFG Magazine 4)." });
TM("cl-evacuation", { z: 3, by: "src", ignore: ["planet"], ignoreText: "a planet result counts as nothing (BFG Magazine 4)" });
TM("cl-cadian-line", { z: "none", by: "src", zoneText: "the scenario lists its own phenomena", areas: false,
  pieces: [{ kind: "asteroid", count: "d3", text: "at least one, no planets" }], note: "The source adds “perhaps a warp rift”: put one down if you both want it." });
TM("cl-ahriman", { z: "any", by: "src", why: "The source: celestial phenomena as normal (BFG Magazine 6). Roll the battlezone, or pick one." });
TM("cl-raths-last-stand", { z: "any", by: "book", fixedSize: "large", warn: ONLY });
TM("cl-antioc-1", { z: 2, by: "src", note: "The source asks for at least one planet; the rulebook allows one at most (RB p. 108), so a rolled planet is rolled again." });
TM("cl-antioc-3", { z: 6, by: "src" });
TM("cl-antioc-4", { z: "any", by: "src", why: "The source: the generator for the region you agree (BFG Magazine 8)." });
TM("cl-execution-hour", { z: "any", by: "book", warn: ONLY });
TM("cl-siege", { z: ZTOOL("bz", [[1, 1, 2], [2, 3, 3], [4, 5, 4], [6, 6, 5]], "the scenario’s D6: 1 mercurial, 2–3 inner, 4–5 primary, 6 outer"), by: "src", zoneText: "from the Battlezone roll in Set-up tools" });
TM("cl-defence-of-macragge", { z: 5, by: "src", reroll: ["rift"], rerollText: "a warp rift arrives later in the game" });
TM("cl-numitor", { z: 5, by: "src", fixedSize: "small", warn: ONLY });
TM("cl-cold-passage", { z: 6, by: "src" });
TM("cl-come-only-to-murder", { z: [4, 3], by: "src" });
TM("cl-cerberus-1", { z: 6, by: "src", drop: ["ring"],
  pieces: (v, W, H) => [{ kind: "gas", count: "2d3", area: { x0: 0, y0: 0, w: W, h: Math.min(35, H), name: "a 35 cm band along the blockade’s edge" }, text: "the Shroud Nebula" }] });
TM("cl-cerberus-2", { z: 6, by: "src", table: BZ.ZONES[5], everyArea: true, everyText: "warp space: one roll on the deep space table for every 60 cm square",
  tool: "terr", note: "Clouds and asteroids are warp currents, the small planet an inert space hulk, a warp rift a gateway to realspace.",
  skin: { asteroid: { name: "Dense warp current", plural: "Dense warp currents", tag: "D", rule: AS("asteroid", "In warp space an asteroid field is a dense warp current. It works as an asteroid field.") },
    gas: { name: "Warp current", plural: "Warp currents", tag: "W", rule: AS("gas", "In warp space a gas or dust cloud is a warp current. It works as a gas and dust cloud.") },
    rift: { name: "Gateway to realspace", plural: "Gateways to realspace", tag: "G", rule: AS("rift", "In warp space a warp rift is a gateway to realspace. It works as a warp rift.") },
    planet: { name: "Space hulk", plural: "Space hulks", tag: "H", noWell: 1, dims: t => t.dia + " cm across", rule: OWNRULE("BFG Magazine 11", "The small planet is an inert space hulk: a terrain piece ships cannot pass through. Only one on the table."), drop: [/Gravity well/] } } });
TM("cl-cerberus-3", { z: 6, by: "src", pieces: [{ kind: "asteroid", count: "d3", text: "the rearguard’s extra fields" }],
  note: "A rolled planet is a huge asteroid (planet rules). The rearguard places its D3 extra asteroid fields; here they are rolled." });
TM("cl-cerberus-4", { z: 2, by: "src", rolls: 4, rollsText: "four D6, each 4+ one roll on the mercurial zone generator", reroll: ["planet"], rerollText: "the scenario re-rolls planets",
  keep: AROUND(45, 12.5), warn: "The source has the players take turns placing the phenomena; here their spots are rolled, none within 45 cm of either planet." });
TM("cl-belis-1", { z: 5, by: "src", ignore: ["asteroid"], ignoreText: "the scenario ignores extra asteroid fields",
  keep: (v, W, H, st, items) => items.filter(i => i.z === "hatch").map(h => ({ shape: "box", x0: h.x - 45, y0: h.y - 45, x1: h.x + h.w + 45, y1: h.y + h.h + 45 })),
  note: "Nothing within 45 cm of the Crown Belt. A planet result may become one battered moon of Malusoir." });
TM("cl-belis-2", { z: 5, by: "src", ignore: ["planet"], ignoreText: "the scenario ignores another planet", note: "Roll a moon for the medium planet if you like." });
TM("cl-belis-3", { z: 4, by: "src", ignore: ["planet"], ignoreText: "the scenario ignores another planet" });
TM("cl-belis-4", { z: 4, by: "src", ignore: ["planet"], ignoreText: "the scenario ignores another planet" });
TM("cl-damocles-1", { z: 5, by: "src", cap: "d3", capText: "at most D3 outer reaches phenomena", ignore: ["planet"], ignoreText: "the scenario ignores planets" });
TM("cl-damocles-2", { z: 4, by: "src", ignore: ["planet"], ignoreText: "the scenario ignores another planet", note: "Roll a moon for the medium planet if you like." });
TM("cl-damocles-3", { z: { die: 6, rows: [[1, 3, 1], [4, 6, 2]], text: "flare or mercurial region; the source gives no split, so 1–3 flare, 4–6 mercurial" }, by: "ours",
  why: "The source rolls for flare or mercurial region without saying how; this splits the D6 evenly (Fanatic Magazine 1)." });
TM("cl-damocles-4", { z: 5, by: "src", ignore: ["planet"], ignoreText: "the scenario ignores another planet", note: "Roll a moon for the medium planet if you like." });
TM("cl-wolf-packs", { z: "any", by: "src", why: "The source: phenomena as you both like, near a planet or in deep space (Fanatic Magazine 7)." });
TM("cl-tau-trade", { z: [4, 3], by: "src" });
TM("cl-daemon-run", { z: 6, by: "src", pieces: (v, W, H) => [{ kind: "asteroid", count: 1, area: { x0: W / 2, y0: 0, w: W / 2, h: H, name: "the Grey Knights’ half" }, text: "the Grey Knights’ field" }],
  note: "The Grey Knights place their asteroid field after Chaos has set up; here it is rolled in their half." });
TM("cl-lachlon", { z: 4, by: "src", keep: (v, W, H) => [{ shape: "box", x0: W / 2, y0: 0, x1: W, y1: H }],
  warn: "The source adds phenomena only if you both want them, and only in the two southern quadrants (the left half here)." });
TM("cl-port-maw", { z: 4, by: "src", hosts: MAPPLANET("medium", { name: "Port Maw", moons: 2 }),
  note: "Port Maw gets its two moons as normal; the source leaves out a moon that lands off the table, this tool draws its direction again first." });
TM("cl-abhorrence", { z: "any", by: "book", warn: "The battle is fought on a low orbit table, where the rulebook’s phenomena do not apply (RB p. 116)." });
TM("cl-planet-fall", { z: "none", by: "src", zoneText: "the scenario lists its own phenomena", areas: false,
  pieces: [{ kind: "gas", count: "d3", set: { l: 10, w: 10, text: "about 10 cm across, the source" }, text: "dust clouds at least 30 cm from the planet" }], keep: AROUND(30) });
TM("cl-kotol", { z: 6, by: "src", v: { b1: { warn: NONE }, b2: { warn: NONE }, b3: { by: "ours", why: "Deep space, as the first battle over Kotol says (Fanatic Online).", warn: ONLY },
  b4: { by: "ours", why: "Deep space, as the first battle over Kotol says (Fanatic Online).", warn: ONLY }, b5: { by: "ours", why: "Deep space, as the first battle over Kotol says (Fanatic Online).", warn: ONLY } } });
TM("cl-inv-chart", { z: "any", by: "book", warn: "The booklet names no phenomena beyond the asteroid field. Not the scenario’s idea — use it only if you both want more terrain." });
TM("cl-inv-conquest", { z: "any", by: "book", note: "The booklet names only the planet in the centre." });
TM("cl-inv-breakthrough", { z: "any", by: "book", warn: PLACER("the attacker") });
TM("cl-inv-snake", { z: "any", by: "book", warn: TURNS_FREE });
TM("cl-inv-retrieval", { z: "any", by: "book", warn: TURNS_FREE });
TM("cl-inv-ring", { z: "any", by: "book", warn: PLACER("the defender") });
TM("cl-inv-port-maw", { z: "any", by: "book", planets: 1, keep: (v, W, H) => [{ shape: "circle", x: W / 2, y: H / 2, r: 12.5 }],
  note: "Port Maw sits in the centre (not drawn): the rolled phenomena keep clear of it, and a rolled planet is rolled again." });
TM("cl-inv-boarding", { z: "any", by: "book", warn: TURNS_FREE });
TM("cl-inv-deadline", { z: "any", by: "book", warn: TURNS_FREE });

/* ---------------------------------------------------------------- Warp Rift */
TM("siege-of-fularis", { z: [4, 3], by: "src" });
TM("assassination", { z: "any", by: "src", why: "The source: any celestial phenomena you like (Warp Rift 10). Roll the battlezone, or pick one." });
TM("eliarenaths-gift", { z: 5, by: "src", areas: false, drop: ["hatch"],
  pieces: (v, W, H) => [{ kind: "asteroid", count: "d3+3", area: { x0: W / 3, y0: 0, w: W / 3, h: H, name: "the middle strip" } },
    { kind: "asteroid", count: "d6+4", area: { x0: 2 * W / 3, y0: 0, w: W / 3, h: H, name: "the strip furthest from the sun" } }] });
TM("diasporex-gambit", { z: "any", by: "src", why: "The source: roll the battlezone and its phenomena by the rulebook (Warp Rift 34)." });
TM("event-horizon", { z: 6, by: "src", areas: false, pieces: [{ kind: "asteroid", count: 4, text: "two for each player" }],
  warn: "The source has each player place two asteroid fields; here all four are rolled." });
TM("fall-of-arcianr", { z: 4, by: "src" });
TM("unknown-weapons", { z: 5, by: "src", why: "The source suggests Outer Reaches phenomena if you want terrain (Warp Rift 20)." });
TM("wr-depth-of-space", { z: "any", by: "src", why: "The source: generate the battlezone with the rulebook, or set it for the story (Warp Rift 16)." });
TM("wr-diasporex-diversions", { z: "any", by: "src", why: "The source: roll the battlezone and its phenomena by the rulebook (Warp Rift 34)." });
TM("wr-solblade-1", { z: [3, 4], by: "src", areas: false, sun: LONG_EDGE,
  pieces: (v, W, H) => SQUARES(W, H, 60).flatMap(a => [{ kind: "asteroid", count: "d3-1", area: a }, { kind: "gas", count: "d3-1", area: a }]),
  note: "D3−1 asteroid fields and D3−1 gas clouds in each 60 cm quadrant, at random (Warp Rift 40)." });
TM("wr-solblade-2", { z: "any", by: "src", why: "The source: roll the battlezone and phenomena by the rulebook, or agree them (Warp Rift 40)." });
TM("wr-solblade-3", { z: "any", by: "src", why: "The source: any battlezone, by the rulebook or by agreement (Warp Rift 41)." });
TM("wr-solblade-4", { z: 4, by: "src" });
TM("wr-solblade-5", { z: 4, by: "src" });
TM("wr-solblade-6", { z: 4, by: "src" });
TM("wr-who-goes-there", { z: "any", by: "book", warn: ONLY });
TM("wr-fannons-patrol", { z: "any", by: "book", warn: ONLY });
TM("wr-planet-killer-defence", { z: [4, 3], by: "src", hosts: MAPPLANET(PSZ, { name: "The planet", sizeText: PSZT }),
  note: "The Exterminatus set-up: the planet’s size rolled here, moons and rings as normal (RB p. 140).",
  v: { report: { z: "any", by: "src", hosts: undefined, why: "The report: a medium planet with some gas clouds and asteroid fields around it (Warp Rift 22).", note: undefined } } });
TM("wr-minor-engagement", { z: "none", by: "src", zoneText: "the scenario rolls its own table", everyArea: true, everyText: "a D6 on the scenario’s own table for every 60 × 60 cm square",
  table: { name: "the scenario’s table", rows: [{ text: "Nothing", out: { kind: "none" } }, { text: "Gas or dust cloud", out: { kind: "gas", count: 1 } }, { text: "Gas or dust cloud", out: { kind: "gas", count: 1 } },
    { text: "Asteroid field", out: { kind: "asteroid", count: 1 } }, { text: "Asteroid field", out: { kind: "asteroid", count: 1 } }, { text: "Planet (only one allowed)", out: { kind: "planet", sub: "small5" } }] },
  tool: "terr", note: "The source does not size the planet: the rulebook’s inner zones roll 1–5 small, 6 medium, and so does this (RB p. 107)." });
TM("wr-commerce-raiders", { z: OUTER_DEEP, by: "src" });
TM("wr-nest-raid", { z: "any", by: "src", why: "The source: roll the battlezone and phenomena as standard (Warp Rift 49)." });
TM("wr-planetary-disease", { z: "any", by: "src", fixedSize: "large", why: "The source: by the rulebook or by agreement, plus a large planet (Warp Rift 49)." });
TM("wr-the-corpse", { z: "any", by: "src", why: "The source: by the rulebook or by agreement, plus the corpse in the centre (Warp Rift 49)." });
TM("wr-sw-convoy-raid", { z: 4, by: "obv", why: "As The Gauntlet: the primary biosphere, ignoring planets (Warp Rift 28; RB p. 178).", ignore: ["planet"], ignoreText: "as The Gauntlet, any planet is ignored" });
TM("wr-sw-orbital-raid", { z: "any", by: "book", fixedSize: "large", note: "The source names only the planet and the orbital terminal (Warp Rift 28)." });
TM("wr-sw-counter-strike", { z: "any", by: "src", fixedSize: "large", why: "The source: other phenomena rolled per table section with the random method (Warp Rift 28)." });
TM("wr-sw-death-and-glory", { z: 5, by: "src" });
TM("wr-sw-rear-guard", { z: 5, by: "ours", why: "The scenario gives no set-up: Outer Reaches, as in Death and Glory, the scenario it continues (Warp Rift 28, p. 26)." });
TM("wr-sw-down-the-slot", { z: 4, by: "obv", why: "As The Gauntlet: the primary biosphere, ignoring planets, placed at random (Warp Rift 29; RB p. 178).", ignore: ["planet"], ignoreText: "as The Gauntlet, any planet is ignored" });
TM("wr-sw-wrecking-yard", { z: 4, by: "obv", why: "As Down the ’Slot: The Gauntlet’s table with random phenomena (Warp Rift 29; RB p. 178).", ignore: ["planet"], ignoreText: "as The Gauntlet, any planet is ignored" });
TM("wr-sw-rebel-world", { z: "any", by: "book", note: "The source names only the planet (Warp Rift 29)." });
TM("wr-sw-take-the-stations", { z: "any", by: "book", warn: ONLY });
TM("wr-sw-rebellion-1", { z: "any", by: "book", warn: "The source sets up a planet only. Not the scenario’s idea — use it only if you both want more terrain." });
TM("wr-sw-rebellion-2", { z: "any", by: "book", warn: "The source sets up a planet only. Not the scenario’s idea — use it only if you both want more terrain." });
TM("wr-mobeel-narrows", { z: "any", by: "book", warn: "The source builds only the asteroid barrier and the forts. Not the scenario’s idea — use it only if you both want more terrain." });
TM("wr-choir-thousand-voices", { z: [5, 6], by: "src" });
TM("wr-wolf-hunt", { z: 6, by: "src" });
TM("wr-hunter-hunted", { z: 5, by: "src" });
TM("wr-cat-and-mouse", { z: [4, 1, 3, 5, 6], by: "src", why: "The source: any battlezone except the Mercurial Zone, with plenty of phenomena for a chase (Warp Rift 15). Pick one." });
TM("wr-solar-collectors", { z: 1, by: "src" });
TM("wr-eldar-hunt-1", { z: 5, by: "src", areas: false, drop: ["hatch"], sun: LONG_EDGE,
  pieces: (v, W, H) => [0, 1, 2].flatMap(c => [0, 1].map(r => ({ kind: "asteroid", count: 1, area: { x0: c * W / 3, y0: r * H / 2, w: W / 3, h: H / 2, name: "sixth " + (r * 3 + c + 1) } }))),
  note: "Six asteroid fields, about one in each sixth of the table (Warp Rift 16); sizes by the rulebook." });
TM("wr-eldar-hunt-2", { z: "any", by: "book", warn: ONLY });
TM("wr-convoy-battle", { z: "any", by: "src", why: "The source: any agreed method — often deep space (Warp Rift 19)." });
TM("wr-limante-contact", { z: "any", by: "book", warn: ONLY, note: "A solar flare is under way in the source." });
TM("wr-falling-down", { z: "any", by: "book", fixedSize: "large", warn: ONLY });
TM("wr-darkening-raid", { z: "any", by: "book", warn: "The source says nothing else goes on the table. Not the scenario’s idea — use it only if you both want more terrain." });
TM("wr-stygies-tree", { z: "any", by: "book", warn: BASE });
TM("wr-looting-the-hulk", { z: "any", by: "src", why: "The source: any phenomena you agree (Warp Rift 28)." });
TM("wr-pirate-bases", { z: "any", by: "book", warn: "The source needs no celestial phenomena for this one. Rolled terrain changes the scenario — use it only if you both agree." });
/* Battles in the Warp: only the scenario's warp phenomena, not the book's battlezone (owner 21.10.). How many: for every
   60 cm area a D6, 4+ rolls on the warp table = "as the base scenario's battlezone would give" (a point to agree). Pieces as
   core types: a current = rift (D3×10 cm long), a swarm = asteroid (D3×5 × D3×5 cm), a ghost planet = a small planet, a tsunami = an event. */
TM("wr-battles-in-the-warp", { z: "none", by: "src", zoneText: "the warp: the scenario’s own phenomena table, no rulebook battlezone", sun: "none", sunText: "the warp has no sunward edge",
  tool: "ph", why: "The warp has no battlezone: the scenario rolls its own phenomena (Warp Rift 30, p. 16). One D6 for every 60 cm area; on a 4+ roll the warp table — as many phenomena as the base scenario’s battlezone would give.",
  table: { name: "the warp phenomena table", rows: [{ text: "Warp tsunami", out: { kind: "flare" } }, { text: "Warp current", out: { kind: "rift", count: 1 } },
    { text: "D3 warp currents", out: { kind: "rift", count: "d3" } }, { text: "A shoal of warp predators", out: { kind: "asteroid", count: 1 } },
    { text: "D3 shoals of warp predators", out: { kind: "asteroid", count: "d3" } }, { text: "A ghost planet (small)", out: { kind: "planet", fixed: "small" } }] },
  skin: {
    rift: { name: "Warp current", plural: "Warp currents", tag: "W", arrow: 1, dims: t => Math.round(t.rx * 2) + " cm long, direction by scatter die",
      rule: OWNRULE("Warp Rift 30, p. 16", "An arrow D3×10 cm long, pointing the way the scatter die gave. A ship crossing the arrow is pushed 2D6 cm along it at once, keeping its facing. Crossing two currents applies both.") },
    asteroid: { name: "Predator shoal", plural: "Predator shoals", tag: "S", col: "var(--warn)",
      rule: OWNRULE("Warp Rift 30, p. 16", "A shoal of warp predators, D3×5 by D3×5 cm. A ship touching a shoal during movement suffers D6 hit-and-run attacks at the end of the movement phase. Each end phase every shoal moves D6 cm towards the nearest ship.") },
    planet: { name: "Ghost planet", plural: "Ghost planets", tag: "G", col: "var(--ink-3)", noWell: 1, dims: t => "small, " + t.dia + " cm across; gravity well D3 × 5 cm, rolled each turn",
      rule: OWNRULE("Warp Rift 30, p. 16", "A small ghost planet. At the start of each player turn roll a D3 × 5 cm for the size of its gravity well."), drop: [/Gravity well/] },
    flare: { name: "Warp tsunami", plural: "Warp tsunamis", turn: "at the start of each player turn roll one D6, however many tsunamis: on a 6 one arrives. Every ship or squadron tests Leadership; each failure takes a 2D6-strength lance attack. Shields and Brace work.",
      fix: [["a battlefield-wide event, not a template (p. 114)", "a table-wide event, not a template (Warp Rift 30)"]] }
  } });
TM("wr-fe-variant", { z: "any", by: "src", why: "The source: phenomena by agreement (Warp Rift 32)." });
TM("wr-solitaire-campaign", { z: 5, by: "src" });
TM("wr-the-trap", { z: { die: 6, rows: [[1, 2, 4], [3, 6, 5]], text: "the scenario: 1–2 primary biosphere, 3–6 outer reaches" }, by: "src" });
TM("wr-hive-ship-base", { z: "any", by: "book", warn: "Each version is set up as its base scenario: generate the terrain there. This rolls a table by the rulebook." });
TM("wr-norduun", { z: 6, by: "src" });
TM("wr-fall-of-hyra", { z: "any", by: "book", warn: ONLY });
TM("wr-shattered-gate", { z: "any", by: "src", rolls: "d6+2", everyArea: true, everyText: "D6+2 phenomena", rollsText: "D6+2 phenomena, one roll each",
  keep: (v, W, H) => [{ shape: "circle", x: W / 2, y: H / 2, r: 15 }],
  why: "The source: D6+2 phenomena around the gate, none within 15 cm of it (Warp Rift 47). Roll the battlezone for them, or pick one." });
TM("wr-srinagar", { z: [4, 3], by: "src", note: "Two adjacent sunward edges: the bands follow the left one here." });

/* ---------------------------------------------------------------- fan supplements: Tournament Mission Pack, Advanced Scenarios */
TM("fan-t-manna", { z: "any", by: "book", warn: TURNS_FREE });
TM("fan-t-road-to-hell", { z: "none", by: "src", zoneText: "the scenario lists its own phenomena", areas: false,
  pieces: [{ kind: "asteroid", count: 4 }, { kind: "gas", count: 4 }], warn: TURNS,
  v: { ac: { z: "any", by: "book", areas: undefined, pieces: undefined, warn: TURNS_FREE } } });
TM("fan-t-space-power", { z: "any", by: "book", warn: TURNS_FREE });
TM("fan-t-edge-of-warp", { z: "any", by: "book", warn: TURNS_FREE });
TM("fan-t-scavenger", { z: "any", by: "book", warn: TURNS_FREE });
TM("fan-t-black-hole", { z: "none", by: "src", zoneText: "the scenario lists its own phenomena", areas: false,
  pieces: [{ kind: "moon", count: 2 }, { kind: "asteroid", count: 4 }, { kind: "gas", count: 4 }], warn: TURNS,
  v: { ac: { z: "any", by: "book", areas: undefined, pieces: undefined, warn: TURNS_FREE } } });
TM("fan-t-bismark", { z: "any", by: "book", warn: TURNS_FREE });
TM("fan-t-unexpected", { z: "none", by: "src", zoneText: "the scenario lists its own phenomena", areas: false,
  pieces: [{ kind: "asteroid", count: 4 }, { kind: "gas", count: 4 }, { kind: "planet", size: "small", moons: 1 }, { kind: "rift", count: 1 }], warn: TURNS,
  v: { ac: { z: "any", by: "book", areas: undefined, pieces: undefined, warn: TURNS_FREE } } });
TM("fan-t-derelict-base", { z: "any", by: "book", warn: TURNS_FREE });
TM("fan-t-station", { z: "none", by: "src", zoneText: "the scenario lists its own phenomena", areas: false, warn: TURNS,
  keep: (v, W, H) => [{ shape: "circle", x: W / 2, y: H / 2, r: 15 }],
  pieces: [{ kind: "asteroid", count: 4 }, { kind: "gas", count: 4 }, { kind: "rift", count: 1 }, { kind: "planet", size: "medium", moons: 1 }],
  v: { ac: { pieces: [{ kind: "asteroid", count: 3 }, { kind: "gas", count: 3 }, { kind: "rift", count: 1 }, { kind: "planet", size: "medium", moons: false }],
    note: "“A moon or a medium planet”: a medium planet here." } } });
TM("fan-t-retrieve-salvage", { z: "none", by: "src", zoneText: "the scenario lists its own phenomena", areas: false, warn: TURNS,
  pieces: [{ kind: "asteroid", count: 3 }, { kind: "gas", count: 3 }, { kind: "rift", count: 1 }] });
TM("fan-t-protect-salvage", { z: "none", by: "src", zoneText: "the scenario lists its own phenomena", areas: false, warn: TURNS,
  pieces: [{ kind: "asteroid", count: 3 }, { kind: "gas", count: 3 }, { kind: "rift", count: 1 }] });
TM("fan-t-brace", { z: "none", by: "src", zoneText: "the scenario lists its own phenomena", areas: false, warn: TURNS,
  pieces: [{ kind: "asteroid", count: 6 }, { kind: "gas", count: 3 }],
  v: { ac: { pieces: [{ kind: "asteroid", count: 5 }, { kind: "gas", count: 4 }, { kind: "planet", size: "small", what: "small planetoid" },
    { kind: "planet", size: "large", what: "large gas planet", moons: false, rings: false }] } } });
TM("fan-t-wrecks", { z: "none", by: "src", zoneText: "the scenario lists its own phenomena", areas: false, warn: TURNS,
  pieces: [{ kind: "asteroid", count: 3 }, { kind: "gas", count: 3 }, { kind: "rift", count: 1 }, { kind: "planet", size: "small" }],
  v: { ac: { fixedSize: "large", pieces: [{ kind: "asteroid", count: 5 }, { kind: "gas", count: 4 }, { kind: "planet", size: "small", what: "small planetoid" }] } } });
TM("fan-t-neutron", { z: "none", by: "src", zoneText: "the scenario lists its own phenomena", areas: false, warn: TURNS,
  pieces: [{ kind: "planet", size: "large", what: "large ringed gas giant", moons: false, rings: "always" }, { kind: "asteroid", count: 5 }, { kind: "gas", count: 4 }, { kind: "planet", size: "small", what: "small planetoid" }] });
TM("fan-t-shepard", { z: "none", by: "src", zoneText: "the scenario lists its own phenomena", areas: false, warn: TURNS,
  keep: (v, W, H) => [{ shape: "box", x0: 0, y0: H / 2 - 5, x1: W, y1: H / 2 + 5 }, { shape: "box", x0: W / 2 - 5, y0: 0, x1: W / 2 + 5, y1: H }],
  pieces: [{ kind: "asteroid", count: 5 }, { kind: "gas", count: 4 }, { kind: "planet", size: "small", what: "small planetoid" }],
  note: "The two crossing rings run along the centre lines (as agreed above); nothing is rolled onto them." });
TM("fan-t-hide", { z: "none", by: "src", zoneText: "the scenario lists its own phenomena", areas: false, warn: TURNS,
  pieces: [{ kind: "asteroid", count: 5 }, { kind: "gas", count: 4 }, { kind: "planet", size: "small", what: "small planetoid" }] });

/* ---------------------------------------------------------------- fan supplements: Book of Nemesis */
TM("fan-n-governor", { z: "any", by: "src", fixedSize: "small", why: "The source: the other phenomena with the standard generator (Book of Nemesis p. 42; RB p. 107–108). Roll the battlezone, or pick one." });
TM("fan-n-naravona", { z: "any", by: "src", noBlock: ["hatch"], drop: ["hatch"], keep: (v, W, H) => [{ shape: "box", x0: W / 2 - 30, y0: 0, x1: W / 2 + 30, y1: H }],
  why: "The source: phenomena as normal on either side of a 60 cm clear passage up the middle (Book of Nemesis p. 43)." });
TM("fan-n-comet", { z: "any", by: "book", fixedSize: "large", warn: ONLY });
TM("fan-n-line", { z: "any", by: "src", why: "The source: the other phenomena with the standard generator (Book of Nemesis p. 45). Roll the battlezone, or pick one." });
TM("fan-n-kravertus", { z: 5, by: "src", note: "Kravertus II’s asteroid belt is not drawn: lay it round the planet as you agree. A rolled planet is rolled again." });
TM("fan-n-armada", { z: 5, by: "src", fixedSize: "small" });
TM("fan-n-longest", { z: 6, by: "src" });
TM("fan-n-recon", { z: "any", by: "src", why: "The source: any agreed way (Book of Nemesis p. 54)." });
TM("fan-n-flanks", { z: "any", by: "src", why: "The source: any agreed way (Book of Nemesis p. 55)." });
TM("fan-n-titan", { z: "any", by: "src", why: "The source: any agreed way (Book of Nemesis p. 56)." });
TM("fan-n-hulk", { z: "any", by: "src", why: "The source: any agreed way, the hulk in the middle (Book of Nemesis p. 57)." });
TM("fan-n-ambush", { z: "any", by: "src", why: "The source: the standard generator (Book of Nemesis p. 58).",
  warn: "The source rolls two dice for every result and the attackers choose which to use. This rolls one die each time — re-roll by hand from the log, or agree to use it as it is." });
TM("fan-n-gunnery", { z: "any", by: "book", warn: NONE });

/* ---------------------------------------------------------------- fan supplements: Project Distant Darkness */
TM("fan-p-hunter-prey", { z: "none", by: "src", zoneText: "a dense nebula", areas: false, sun: "none", sunText: "the nebula has no sunward edge",
  pieces: (v, W, H) => PER(SQUARES(W, H, 40), "gas", "d3+1"), tool: "neb" });
TM("fan-p-light-dark", { z: 5, by: "src" });
TM("fan-p-stolen-goods", { z: 3, by: "src" });
TM("fan-p-barrage", { z: 1, by: "src", fixedSize: "small" });
TM("fan-p-crossfire", { z: 5, by: "src" });
TM("fan-p-silent-strike", { z: 5, by: "src" });
TM("fan-p-hunter-cadre", { z: [4, 5], by: "ours", why: "“Outer biosphere” is not a rulebook battlezone: the primary biosphere generator as agreed above, or the outer reaches (Project Distant Darkness p. 26)." });
TM("fan-p-another-day", { z: 6, by: "src" });
TM("fan-p-into-darkness", { z: 3, by: "src" });
TM("fan-p-comes-back", { z: 3, by: "src" });
TM("fan-p-labyrinth", { z: "any", by: "book", warn: ONLY });
TM("fan-p-scheming", { z: 5, by: "src", warn: ONLY });
TM("fan-p-find-light", { z: 5, by: "src" });
TM("fan-p-no-way-out", { z: 6, by: "src", keep: (v, W, H) => [{ shape: "box", x0: W / 2 - 4, y0: H / 2, x1: W / 2 + 4, y1: H / 2 + 22 }],
  note: "The comet’s tail (3D6 cm, away from the sunward edge) is kept clear." });
TM("fan-p-distant-darkness", { z: 6, by: "src", fixedSize: "small" });
TM("fan-p-lytan-flight", { z: 5, by: "src", warn: "The source places only the asteroid field along one edge. Not the scenario’s idea — use it only if you both want more terrain." });
TM("fan-p-lost-tale", { z: 3, by: "src" });
TM("fan-p-art-command-1", { z: "any", by: "src", sun: LONG_EDGE, why: "The source: phenomena as you like, one long edge sunward (The Art of Command p. 32). Roll the battlezone, or pick one." });
TM("fan-p-art-command-2", { z: 5, by: "src", ignore: ["planet"], ignoreText: "no planets (The Art of Command p. 37)" });
TM("fan-p-garit", { z: 5, by: "src", warn: "The source places only the asteroid field along one edge. Not the scenario’s idea — use it only if you both want more terrain." });
TM("fan-p-greater-good", { z: 6, by: "src" });
TM("fan-p-claw", { z: 6, by: "src", areas: false, pieces: [{ kind: "rift", count: 1 }, { kind: "asteroid", count: 2, what: "small asteroid fields" }],
  note: "“Two small asteroid fields” are sized by the rulebook’s D3×5 cm (Distant Sun p. 9)." });
TM("fan-p-supply", { z: 5, by: "src", areas: false, pieces: [{ kind: "gas", count: 2 }] });
TM("fan-p-nightmares", { z: 2, by: "src", ignore: ["planet"], ignoreText: "the scenario ignores planets (Distant Sun p. 21)" });
TM("fan-p-spirit", { z: 3, by: "src", areas: false, pieces: (v, W, H) => PER(QUARTERS(W, H), "asteroid", "d3+2"), tool: "q" });
TM("fan-p-rising-shadow", { z: 6, by: "src", areas: false,
  pieces: (v, W, H) => [{ kind: "rift", count: 1, set: { l: 35, w: 20, text: "about 20 × 35 cm, the source" },
    pick: { rows: [[1, 3, 0], [4, 6, 1]], text: "1–3 left, 4–6 right", areas: [{ x0: 0, y0: 0, w: Math.min(45, W), h: H, name: "the box up to 45 cm from the left edge" }, { x0: Math.max(0, W - 45), y0: 0, w: Math.min(45, W), h: H, name: "the box up to 45 cm from the right edge" }] } }]
    .concat(QUARTERS(W, H).map(a => ({ kind: "gas", count: 1, area: a }))),
  note: "The rift is placed by scatter dice in the source; here its spot in the box is rolled. The four clouds are spread one to a quarter." });
TM("fan-p-abandon", { z: 4, by: "src", sun: LONG_EDGE });
TM("fan-p-ever-dream", { z: 4, by: "obv", why: "As Abandon All Hope: primary biosphere, random phenomena, a long edge sunward (Distant Sun p. 41).", sun: LONG_EDGE });

/* ---------------------------------------------------------------- fan supplements: Starblade */
TM("fan-s-crescent", { z: "none", by: "src", zoneText: "the scenario rolls asteroid fields per square", areas: false,
  pieces: (v, W, H) => PER(SQUARES(W, H, 60), "asteroid", "d3"), tool: "ast" });
TM("fan-s-veil", { z: "any", by: "src", why: "The source: phenomena in an agreed way, one short edge sunward (Starblade p. 23)." });
TM("fan-s-path", { z: "none", by: "src", zoneText: "the scenario lists its own phenomena", areas: false, fixedSize: "small",
  pieces: [{ kind: "asteroid", count: "d3" }, { kind: "gas", count: "d3" }] });
TM("fan-s-grace", { z: "any", by: "book", warn: "The source fills a 30 cm band along the sunward edge with asteroids and adds nothing else. Not the scenario’s idea — use it only if you both want more terrain." });
TM("fan-s-tragedy", { z: 6, by: "src" });
TM("fan-s-visions", { z: "any", by: "src", why: "The source: phenomena as usual, with an asteroid field shielding the Eldar (Starblade p. 27). Roll the battlezone, or pick one." });
TM("fan-s-prophecy", { z: "none", by: "src", zoneText: "the scenario rolls asteroid fields per square", areas: false,
  pieces: (v, W, H) => PER(SQUARES(W, H, 60), "asteroid", "d3"), tool: "ast" });
TM("fan-s-tears", { z: "none", by: "src", zoneText: "the scenario lists its own phenomena", areas: false, events: { radiation: 2 },
  pieces: (v, W, H) => [{ kind: "planet", size: "small", what: "small rogue planet", area: { x0: 30, y0: 30, w: Math.max(10, W - 60), h: Math.max(10, H - 60), name: "at least 30 cm from every edge" } },
    { kind: "gas", count: "d3" }, { kind: "asteroid", count: "d3" }, { kind: "rift", count: "d3" }] });
TM("fan-s-starblade", { z: "none", by: "src", zoneText: "the scenario lists its own phenomena", areas: false, sun: "none", sunText: "the scenario has no sunward edge",
  pieces: [{ kind: "rift", count: "d6" }, { kind: "gas", count: "d3" }, { kind: "asteroid", count: "d3" }] });
/* Book of the Void I–II (25.10.2026) */
TM("fan-v-first-contact", { z: 4, by: "src" });
TM("fan-v-smash", { z: 5, by: "src" });
TM("fan-v-eres", { z: "any", by: "src", why: "The source: any battlezone, generated as per the rulebook (Book of the Void I p. 53). Roll the battlezone, or pick one." });
TM("fan-v-ancients", { z: 5, by: "src" });
TM("fan-v-solar", { z: 1, by: "src" });
TM("fan-v-krump", { z: "any", by: "src", why: "The source: any region, phenomena agreed or generated (Book of the Void I p. 58). Roll the battlezone, or pick one." });
TM("fan-v-relic", { z: 6, by: "src" });
TM("fan-v-avaheim", { z: "none", by: "src", zoneText: "low orbit over Avaheim: the mountain regions are the only terrain", areas: false, sun: "none", sunText: "the table is the surface of the planet" });
TM("fan-v-gambit", { z: "any", by: "src", why: "The source: any battlezone, generated as per the rulebook (Book of the Void II p. 54). Roll the battlezone, or pick one." });
TM("fan-v-eulogy", { z: 4, by: "src", note: "Vallar has no rings; its small moon is on the map." });
TM("fan-v-sirvos", { z: [4, 3], by: "src", warn: "The source allows at most one asteroid field and one dust cloud besides the planet’s rings: leave out any extra." });
TM("fan-v-last-wave", { z: 6, by: "src", sun: { rows: [[1, 3, "left"], [4, 6, "right"]], text: "a short edge; rolled here: 1–3 left, 4–6 right" } });
})();
