import { bzRun } from "./battlezone.js";
import { esc } from "./helpers.js";
import { layout, textLen } from "./layout.js";
import { LOW_ORBIT } from "./low-orbit.js";
import { mapSize } from "./map-svg.js";
import { PENDING_VAR, bzLegend, varPending } from "./scenario-page.js";
import { DB, get } from "./state.js";
import { tableWH, tpl } from "./table.js";
import { mapFig, terrHint } from "./terrain-legend.js";
import { agN } from "./views.js";

/* ---------------------------------------------------------------- maps
   Every map is a function of the variant and the table size (cm). Distances the
   rules give stay absolute; centre lines, thirds and far edges follow the table. */
export const R = (x, y, w, h, s, l, o) => Object.assign({ z: "rect", x, y, w: Math.max(0, w), h: Math.max(0, h), s, l }, o || {});
export const EDGES4 = (s, top, bottom) => [{ z: "edge", e: "t", s, dash: 1, l: top || "" }, { z: "edge", e: "b", s, dash: 1, l: bottom || "" }, { z: "edge", e: "l", s, dash: 1, l: "" }, { z: "edge", e: "r", s, dash: 1, l: "" }];
export const TICKS = W => [[W - 30, "T2"], [W - 60, "T3"], [W - 90, "T4"]].filter(t => t[0] > 5);

export const MAPS = {
  "cruiser-clash": (v, W, H) => {
    const zw = Math.min(90, W), x0 = (W - zw) / 2, d = Math.max(5, (H - 60) / 2);
    return [
      R(x0, 0, zw, d, "a", "Fleet A"), R(x0, H - d, zw, d, "b", "Fleet B"),
      { z: "arrow", x1: x0 + zw * .28, y1: d - 8, x2: x0 + zw * .28, y2: d + 8, s: "a" }, { z: "arrow", x1: x0 + zw * .72, y1: d - 8, x2: x0 + zw * .72, y2: d + 8, s: "a" },
      { z: "arrow", x1: x0 + zw * .28, y1: H - d + 8, x2: x0 + zw * .28, y2: H - d - 8, s: "b" }, { z: "arrow", x1: x0 + zw * .72, y1: H - d + 8, x2: x0 + zw * .72, y2: H - d - 8, s: "b" },
      { z: "dim", x1: x0, y1: H / 2 + 2, x2: x0 + zw, y2: H / 2 + 2, l: "90 cm" },
      { z: "dim", x1: Math.min(W - 12, x0 + zw + 15), y1: d, x2: Math.min(W - 12, x0 + zw + 15), y2: H - d, l: "60 cm" }
    ];
  },
  "the-bait": (v, W, H) => {
    const cx = W / 2, cy = H / 2, pz = Math.max(0, cx - 60);
    return [
      /* the box is a symbol, its centre is dimensioned (RB p. 129: "in the centre of the table") */
      R(cx - 10, cy - 12, 20, 24, "a", "", { free: 1 }), { z: "cm", x: cx, y: cy, s: "a", l: "Bait" }, { z: "arrow", x1: cx + 12, y1: cy, x2: cx + 28, y2: cy, s: "a" },
      pz > 0 ? R(0, 0, pz, H, "b", pz >= 25 ? "Pursuers\nmore than\n60 cm\nbehind" : "") : null,
      { z: "dim", x1: cx - 60, y1: H - 16, x2: cx, y2: H - 16, l: "over 60 cm" },
      { z: "edge", e: "r", s: "a", l: "Reinforcements enter" },
      { z: "tick", e: "t", list: TICKS(W) }, { z: "tick", e: "b", list: TICKS(W) }
    ];
  },
  "the-raiders": (v, W, H) => [
    R(30, 30, W - 60, H - 60, "b", "Defender\n30 cm+ from every edge\n20 cm apart, same facing"),
    ...EDGES4("a", "Raiders enter from one edge"),
    { z: "dim", x1: 0, y1: H - 20, x2: 30, y2: H - 20, l: "30 cm" }
  ],
  "surprise-attack": (v, W, H) => [
    R(30, 30, W - 60, H - 60, "b", "", { dash: 1 }),
    { z: "text", x: W / 2, y: 36, l: "D3 on full alert: 30 cm+ from edges", s: "b" },
    { z: "circ", cx: W / 2, cy: H / 2, r: 22, s: "b", l: "" }, { z: "planet", cx: W / 2, cy: H / 2, r: 7, l: "" },
    { z: "text", x: W / 2, y: H / 2 + 17, l: "standby: within 15 cm", s: "b" },
    ...EDGES4("a", "Attacker enters from an edge of choice")
  ],
  "blockade-run": (v, W, H) => {
    const w3 = W / 3, hb = Math.max(5, H - 60);
    return [
      R(0, 0, w3, hb, "b", "1–2"), R(w3, 0, w3, hb, "b", "3–4"), R(2 * w3, 0, w3, hb, "b", "5–6"),
      R(0, H - 15, W, 15, "a", "Runners: 15 cm"),
      { z: "dim", x1: W - 8, y1: hb, x2: W - 8, y2: H, l: "60 cm" },
      { z: "edge", e: "t", s: "a", l: "Blockade’s edge: runners score by leaving here" }
    ];
  },
  "convoy": (v, W, H) => [
    R(30, 30, W - 60, H - 60, "b", "", { dash: 1 }),
    { z: "text", x: W / 2, y: 38, l: "contact markers: 30 cm from edges, 30 cm apart", s: "b" },
    H > 90 ? R(0, 45, 8, H - 90, "a", "", { free: "x" }) : null, { z: "arrow", x1: 10, y1: H / 2, x2: 26, y2: H / 2, s: "a" },
    { z: "text", x: 40, y: H / 2 + 8, l: "convoy enters", s: "a" },
    { z: "dim", x1: 4, y1: 0, x2: 4, y2: 45, l: "45 cm" },
    { z: "edge", e: "r", s: "a", l: "Exit: transports count here" }
  ],
  "planetary-assault": (v, W, H) => [
    R(30, 30, W - 60, H - 60, "b", "", { dash: 1 }),
    { z: "text", x: W / 2 - 14, y: 38, l: "patrols: 30 cm+ from edges", s: "b" },
    { z: "planet", cx: W - 45, cy: H / 2 + 2, r: 8, l: "", free: 1 }, { z: "text", x: W - 45, y: H / 2 + 25, l: "Planet: up to 150 cm\nfrom a short edge" },
    R(0, 0, 15, H, "a", "Attacker: 15 cm", { rot: -90 })
  ],
  "escalating-engagement": (v, W, H) => [
    /* no fixed P1/P2 markers: the starting markers may be placed anywhere inside the dashed line (horizon 21.10.) */
    R(30, 30, W - 60, H - 60, "n", ""),
    /* the text at the zone's top edge: in the middle, rolled terrain (e.g. a planet) covered it */
    { z: "text", x: W / 2, y: 42, l: "Starting markers: anywhere in here,\n60 cm+ from the enemy marker", s: "n" },
    { z: "edge", e: "l", s: "n", l: "1" }, { z: "edge", e: "t", s: "n", l: "2–3" }, { z: "edge", e: "b", s: "n", l: "4–5" }, { z: "edge", e: "r", s: "n", l: "6" }
  ],
  "exterminatus": (v, W, H) => [
    R(30, 30, W - 60, H - 60, "b", "", { dash: 1 }),
    { z: "text", x: W / 2 - 14, y: 38, l: "defender: 30 cm+ from edges", s: "b" },
    { z: "planet", cx: W - 45, cy: H / 2 + 2, r: 8, l: "", free: 1 }, { z: "text", x: W - 45, y: H / 2 + 25, l: "Planet: up to 150 cm\nfrom a short edge" },
    R(0, 0, 15, H, "a", "Attacker: 15 cm", { rot: -90 }),
    { z: "edge", e: "t", s: "b", dash: 1, l: "patrols arrive on a random edge" }, { z: "edge", e: "b", s: "b", dash: 1, l: "" }
  ],
  "fleet-engagement": (v, W, H) => {
    if (v === "B") {
      const sd = Math.max(8, (H - 60) / 2), sw = (W - 45) / 2;
      const row = (y, s) => [R(0, y, sw, sd, s, ""), R(sw, y, 45, sd, s, ""), R(sw + 45, y, sw, sd, s, "")];
      const arr = (y, s, dir) => [sw / 2, sw + 22.5, sw + 45 + sw / 2].map(x => ({ z: "arrow", x1: x - dir * 10, y1: y, x2: x + dir * 10, y2: y, s }));
      return [...row(0, "b"), ...row(H - sd, "a"), ...arr(sd / 2, "b", 1), ...arr(H - sd / 2, "a", -1),
        { z: "dim", x1: W / 2, y1: sd, x2: W / 2, y2: H - sd, l: "60 cm" }, { z: "dim", x1: sw, y1: H - sd - 6, x2: sw + 45, y2: H - sd - 6, l: "45 cm" },
        { z: "text", x: W / 2, y: sd + 16, l: "both: 3 divisions", s: "n" }];
    }
    if (v === "C") {
      const ww = Math.max(10, W - 120);
      return [R(0, 0, 30, H, "a", ""), R(W - 30, 0, 30, H, "a", ""), R(60, 0, ww, 45, "b", ""),
        { z: "arrow", x1: 15, y1: H - 20, x2: 15, y2: H - 40, s: "a" }, { z: "arrow", x1: W - 15, y1: H - 20, x2: W - 15, y2: H - 40, s: "a" },
        { z: "arrow", x1: 60 + ww * .2, y1: 12, x2: 60 + ww * .2, y2: 32, s: "b" }, { z: "arrow", x1: 60 + ww * .45, y1: 12, x2: 60 + ww * .45, y2: 32, s: "b" },
        { z: "dim", x1: 30, y1: 14, x2: 60, y2: 14, l: "30" }, { z: "dim", x1: W - 60, y1: 52, x2: W - 30, y2: 52, l: "30" },
        { z: "dim", x1: 60 + ww * .8, y1: 0, x2: 60 + ww * .8, y2: 45, l: "45 cm" },
        { z: "text", x: W / 2, y: Math.max(60, H * .67), l: "dark: 2 divisions (left, right)", s: "a" }];
    }
    if (v === "D") {
      const bd = Math.max(8, H - 90), sw = (W - 60) / 2, top = H - bd;
      return [R(45, 0, W - 90, 30, "b", ""),
        R(0, top, sw, bd, "a", ""), R(sw, top, 60, bd, "a", ""), R(sw + 60, top, sw, bd, "a", ""),
        { z: "arrow", x1: 45 + (W - 90) * .22, y1: 8, x2: 45 + (W - 90) * .22, y2: 22, s: "b" }, { z: "arrow", x1: 45 + (W - 90) * .78, y1: 8, x2: 45 + (W - 90) * .78, y2: 22, s: "b" },
        ...[sw / 2, sw + 30, sw + 60 + sw / 2].map(x => ({ z: "arrow", x1: x, y1: H - 6, x2: x, y2: H - 6 - Math.min(14, bd - 2), s: "a" })),
        { z: "dim", x1: 0, y1: 14, x2: 45, y2: 14, l: "45 cm" }, { z: "dim", x1: W - 45, y1: 14, x2: W, y2: 14, l: "45 cm" },
        { z: "dim", x1: 55, y1: 30, x2: 55, y2: top, l: "60 cm" }, { z: "dim", x1: sw, y1: top - 6, x2: sw + 60, y2: top - 6, l: "60 cm" },
        { z: "text", x: W / 2 + 30, y: (30 + top) / 2 - 2, l: "dark: 3 divisions", s: "a" }];
    }
    /* A */
    const sw = Math.max(5, (W - 120) / 2), wd = Math.max(8, H - 90);
    return [R(0, 0, sw, H, "a", ""), R(W - sw, 0, sw, H, "a", ""), R(sw, H - 30, W - 2 * sw, 30, "a", ""), R(sw + 30, 0, 60, wd, "b", ""),
      { z: "arrow", x1: sw * .25, y1: H * .58, x2: sw * .75, y2: H * .46, s: "a" }, { z: "arrow", x1: W - sw * .25, y1: H * .58, x2: W - sw * .75, y2: H * .46, s: "a" },
      { z: "arrow", x1: W / 2 - 20, y1: H - 8, x2: W / 2 - 20, y2: H - 22, s: "a" }, { z: "arrow", x1: W / 2 + 20, y1: H - 8, x2: W / 2 + 20, y2: H - 22, s: "a" },
      { z: "arrow", x1: W / 2 - 15, y1: wd * .27, x2: W / 2 - 15, y2: wd * .73, s: "b" }, { z: "arrow", x1: W / 2 + 15, y1: wd * .27, x2: W / 2 + 15, y2: wd * .73, s: "b" },
      { z: "dim", x1: sw + 30, y1: wd + 8, x2: sw + 90, y2: wd + 8, l: "60 cm" }, { z: "dim", x1: sw, y1: 14, x2: sw + 30, y2: 14, l: "30" }, { z: "dim", x1: sw + 90, y1: 14, x2: sw + 120, y2: 14, l: "30" },
      { z: "dim", x1: sw + 15, y1: wd, x2: sw + 15, y2: H - 30, l: "60 cm" },
      { z: "text", x: W / 2 + 30, y: (wd + H - 30) / 2, l: "dark: 3 divisions\n(left, bottom, right)", s: "a" }];
  },
  "gauntlet": (v, W, H) => v === "run" ? [
      { z: "circ", cx: W / 2, cy: H / 2, r: 30, s: "a", l: "Convoy within\n30 cm of centre" },
      { z: "arrow", x1: W / 2 + 10, y1: H - 14, x2: W / 2 - 10, y2: H - 14, s: "n", l: "each convoy turn: all back 20 cm" },
      { z: "edge", e: "t", s: "b", l: "Raiders enter (turn 1)" }, { z: "edge", e: "b", s: "b", l: "Raiders enter (turn 1)" },
      { z: "edge", e: "r", s: "n", l: "faced edge: new phenomena (6)" }, { z: "edge", e: "l", s: "n", l: "pushed off here = disengaged" }
    ] : [
      R(0, 0, 45, H, "a", "Convoy +\nescorts\n45 cm"),
      { z: "arrow", x1: 50, y1: H / 2, x2: 80, y2: H / 2, s: "a", l: "facing" },
      { z: "edge", e: "t", s: "b", l: "Raiders enter anywhere (turn 1)" }, { z: "edge", e: "b", s: "b", l: "Raiders enter anywhere (turn 1)" },
      { z: "edge", e: "r", s: "a", l: "Exit: 3 transports needed" },
      { z: "dim", x1: 0, y1: H - 8, x2: 45, y2: H - 8, l: "45 cm" }
    ],
  "parols-bait": (v, W, H) => {
    const cx = W / 2, cy = H / 2, pz = Math.max(0, cx - 60);
    return [
      R(cx - 12, cy - 15, 24, 30, "a", "", { free: 1 }), { z: "cm", x: cx, y: cy, s: "a", l: "Pursued" }, { z: "arrow", x1: cx + 14, y1: cy, x2: cx + 28, y2: cy, s: "a" },
      R(cx + 30, Math.min(30, H / 4), Math.min(50, W - cx - 40), H - 2 * Math.min(30, H / 4), "a", "Mines:\nanywhere\nin front", { dash: 1, free: 1 }),
      pz > 0 ? R(0, 0, pz, H, "b", pz >= 25 ? "Pursuers\n60 cm+\nbehind" : "") : null,
      { z: "dim", x1: cx - 60, y1: H - 16, x2: cx, y2: H - 16, l: "at least 60 cm" },
      { z: "edge", e: "r", s: "a", l: "Reinforcements enter" },
      { z: "tick", e: "t", list: TICKS(W) }, { z: "tick", e: "b", list: TICKS(W) }
    ];
  },
  "pelucidar": (v, W, H) => [
    R(30, 30, W - 60, H - 60, "a", "Defender\n30 cm+ from every edge\n20 cm apart, same facing"),
    { z: "planet", cx: W / 3, cy: 15, r: 7, l: "", free: 1 }, { z: "text", x: W / 3 + 10 + textLen("Pelucidar: anywhere", W) / 2, y: 15, l: "Pelucidar: anywhere", s: "n" },
    ...EDGES4("b", "Horde enters (see note)", "Horde enters (see note)"),
    { z: "dim", x1: 0, y1: H - 20, x2: 30, y2: H - 20, l: "30 cm" }
  ],
  "siege-of-fularis": (v, W, H) => {
    const px = W - 60, py = H / 2;
    return [
      { z: "circ", cx: px, cy: py, r: 60, s: "b", l: "", free: 1 },
      { z: "text", x: px, y: py - 30, l: "Defender: up to 1000 pts\nwithin 60 cm of the planet", s: "b" },
      { z: "ring", cx: px, cy: py, r: 75, dash: 1, l: "", free: 1 },
      { z: "text", x: Math.max(35, px - 68), y: 16, l: "75 cm: longest shot", s: "n" },
      { z: "planet", cx: px, cy: py, r: 7, l: "Medium planet", free: 1 },
      R(0, 0, 15, H, "a", "Attacker: whole fleet, 15 cm", { rot: -90 }),
      { z: "dim", x1: px, y1: H - 14, x2: W, y2: H - 14, l: "up to 100 cm" },
      { z: "edge", e: "t", s: "b", dash: 1, l: "Patrol arrives: 1–2" }, { z: "edge", e: "b", s: "b", dash: 1, l: "Patrol arrives: 3–4" },
      { z: "edge", e: "l", s: "b", dash: 1, l: "Patrol 5–6" }
    ];
  },
  "assassination": (v, W, H) => [
    R(0, 0, W, 15, "b", "Defender: whole fleet, targets placed last"),
    R(0, H - 15, W, 15, "a", "Assassins: whole fleet"),
    { z: "dim", x1: 8, y1: H - 15, x2: 8, y2: H, l: "15 cm" },
    { z: "text", x: W / 2, y: H / 2, l: "Long edges are assigned at random", s: "n" }
  ],
  "eliarenaths-gift": (v, W, H) => {
    const w3 = W / 3;
    return [
      { z: "sun", e: "l" },
      { z: "hatch", x: w3, y: 0, w: w3, h: H, l: "D3+3\nasteroid fields" }, { z: "hatch", x: 2 * w3, y: 0, w: w3, h: H, l: "D6+4\nasteroid fields" },
      { z: "line", x1: w3, y1: 0, x2: w3, y2: H }, { z: "line", x1: 2 * w3, y1: 0, x2: 2 * w3, y2: H },
      R(0, 30, 30, H - 60, "a", "Patrol\n30 cm"),
      { z: "ring", cx: 60, cy: H / 2, r: 40, dash: 1, s: "c", l: "" }, { z: "mark", x: 60, y: H / 2, s: "c", l: "Gift" },
      { z: "text", x: 2.5 * w3, y: 20, l: "4 contact markers\n40 cm+ from Gift\n50 cm+ apart", s: "b" },
      { z: "edge", e: "r", s: "n", l: "Exit edge: subplots" },
      { z: "dim", x1: 0, y1: H - 8, x2: 60, y2: H - 8, l: "60 cm" }
    ];
  },
  "diasporex-gambit": (v, W, H, st, sc) => [
    R(0, 0, agN(sc, st, "dep"), H, "a", ""), { z: "text", x: agN(sc, st, "dep") + 14, y: H / 2, l: "Hunter", s: "a" },
    R(W - agN(sc, st, "dep"), 0, agN(sc, st, "dep"), H, "b", ""), { z: "text", x: W - agN(sc, st, "dep") - 14, y: H / 2, l: "Hunted", s: "b" },
    { z: "arrow", x1: 40, y1: H / 2, x2: 70, y2: H / 2, s: "a" }, { z: "arrow", x1: W - 40, y1: H / 2, x2: W - 70, y2: H / 2, s: "b" },
    { z: "edge", e: "l", s: "b", l: "Lart escapes here" }
  ],
  "event-horizon": (v, W, H, st, sc) => {
    const cx = W / 2, cy = Math.max(44, H - 44);
    return [
      { z: "ring", cx, cy, r: 25.5, sw: 5, gas: 1 }, { z: "ring", cx, cy, r: 36.5, sw: 7, gas: 1 },
      { z: "planet", cx, cy, r: 8, l: "Large planet" }, { z: "mark", x: cx, y: cy - 16, s: "c", l: "Event Horizon" },
      { z: "corner", c: "tl", r: agN(sc, st, "corner"), s: "n", l: "deploy" }, { z: "corner", c: "tr", r: agN(sc, st, "corner"), s: "n", l: "deploy" }
    ];
  },
  "fall-of-arcianr": (v, W, H) => {
    const px = Math.max(10, W - 150), py = H / 2;
    return [
      { z: "circ", cx: px, cy: py, r: 20, s: "b", l: "" }, { z: "planet", cx: px, cy: py, r: 7, l: "" },
      { z: "text", x: px + 2, y: py - 32, l: "Force 1\nwithin 20 cm", s: "b" },
      R(W - 30, 0, 30, H, "a", "Relief fleet\n+ convoy\n30 cm"),
      { z: "dim", x1: px, y1: H * .77, x2: W - 30, y2: H * .77, l: "at least 120 cm from the planet" },
      { z: "edge", e: "r", s: "b", l: "Invaders’ escape edge" },
      { z: "edge", e: "t", s: "b", dash: 1, l: "Force 3 marker (random long edge)" }, { z: "edge", e: "b", s: "b", dash: 1, l: "Force 3 marker" }
    ];
  },
  "unknown-weapons": (v, W, H) => [
    R(W / 4, H / 4, W / 2, H / 2, "b", "Hive group\ncentral " + Math.round(W / 2) + " × " + Math.round(H / 2) + " cm"),
    { z: "edge", e: "t", s: "a", l: "Ambushers: touching any edge, facing in" }, { z: "edge", e: "b", s: "a", l: "" },
    { z: "edge", e: "l", s: "a", l: "" }, { z: "edge", e: "r", s: "a", l: "" },
    { z: "dim", x1: 0, y1: H * .85, x2: W / 4, y2: H * .85, l: Math.round(W / 4) + " cm" }
  ]
};

/* smallest table the scenario's own distances fit on, and the size the source names */
export const FITS = {
  "cruiser-clash": () => [90, 80], "the-bait": () => [140, 50], "the-raiders": () => [80, 80], "surprise-attack": () => [80, 80],
  "blockade-run": () => [60, 80], "convoy": () => [90, 100], "planetary-assault": () => [100, 80], "escalating-engagement": () => [130, 80],
  "exterminatus": () => [100, 80], "fleet-engagement": v => ({ A: [140, 100], B: [70, 80], C: [140, 60], D: [110, 100] }[v] || [140, 100]),
  "gauntlet": v => v === "run" ? [80, 70] : [90, 50], "parols-bait": () => [140, 60], "pelucidar": () => [80, 80],
  "siege-of-fularis": () => [120, 80], "assassination": () => [60, 50], "eliarenaths-gift": () => [150, 80], "diasporex-gambit": () => [110, 60],
  "event-horizon": () => [100, 90], "fall-of-arcianr": () => [180, 60], "unknown-weapons": () => [60, 60]
};
export const SRC_TABLE = { "assassination": [180, 120], "eliarenaths-gift": [180, 120], "diasporex-gambit": [180, 120], "unknown-weapons": [200, 200] };
export function mapFn(sc) { return sc.draw || MAPS[sc.id] || null; }
export function fitOf(sc, v) { return sc.fit ? sc.fit(v) : FITS[sc.id] ? FITS[sc.id](v) : [0, 0]; }
export function mapOf(sc, v, playT) {
  const [W, H] = tableWH(), fn = mapFn(sc), st = DB.s && DB.s[sc.id] ? DB.s[sc.id] : { w: {}, turn: 1 };
  let items = fn ? fn(v, W, H, st, sc).filter(Boolean) : [];
  /* rolled terrain (0.9): replaced items (drop) are removed only after rolling */
  const bz = bzRun(sc, v, st, W, H, items);
  if (bz && bz.spec.drop) items = items.filter(i => !bz.spec.drop.includes(i.z));
  /* the in-game map (0.10, scenarios/play-maps.js): its own drawing for turn playT; the terrain stays as in Set-up */
  const pm = playT && typeof PLAYMAP !== "undefined" && PLAYMAP[sc.id];
  if (pm && pm.draw) items = pm.draw(v, W, H, Object.assign({}, st, { turn: playT }), sc, items).filter(Boolean);
  /* the scenario's own terrain (0.13, scenarios/terrain-info.js): a legend tied to the map item */
  const ti = typeof TERR_INFO !== "undefined" && TERR_INFO[sc.id];
  if (ti) for (const it of items) { const e = ti.find(x => x.m && x.m(it, v)); if (e) it.ti = e; }
  const ps = get(st, "psize", 0);
  return { w: W, h: H, items, bz, sel: st.bz && st.bz.sel, sc, v, lo: LOW_ORBIT.has(sc.id) && !(sc.noLowTable || []).includes(v) ? { size: ps ? (ps === 1 ? "small" : ps === 6 ? "large" : "medium") : null } : null };
}
/* owner 21.10.: a map always on the Play tab, in every scenario (campaigns too). Without a fixed map the rolled
   terrain is shown if there is one (e.g. Battles in the Warp's warp phenomena); otherwise there is nothing to show. */
/* The Play tab's sections can be hidden (owner 21.10.): the choice is the player's, not the scenario's, so it is
   saved once (DB.ph) and applies to every scenario. Nothing closes by itself: only the Hide/Show button. */
export function phHidden(k) { return !!(DB.ph && DB.ph[k]); }
export function hideBtn(k, show, hide) { const h = phHidden(k); return "<button class='hidebtn' data-a='psec' data-k='" + k + "' aria-expanded='" + !h + "'>" + (h ? show || "Show" : hide || "Hide") + "</button>"; }
export function hsec(k, title, body) { return "<h2 class='hsec" + (phHidden(k) ? " off" : "") + "'><span>" + title + "</span>" + hideBtn(k) + "</h2>" + (phHidden(k) ? "" : body); }
export function playMapOn(sc, st) { return !!mapFn(sc) || !!(st && st.bz && st.bz.seed); }
export function playMapBlock(sc, st, v) {
  if (!playMapOn(sc, st)) return "";
  const [W, H] = tableWH(), pm = typeof PLAYMAP !== "undefined" && PLAYMAP[sc.id], note = pm && pm.note ? pm.note(st, v, sc) : "";
  let m = mapOf(sc, v, st.turn);
  /* the set-up is decided at the table (Fleet Engagement): the same "to be decided" as in Set-up */
  if (varPending(sc, st)) m = Object.assign({}, m, { items: [{ z: "text", x: W / 2, y: H / 2, l: "Set-up to be decided\n" + PENDING_VAR[sc.id] }] });
  return hsec("map", "On the table" + (pm && pm.draw ? " · turn " + st.turn : ""), "<div class='mapwrap playmap" + (m.lo ? " lomap" : "") + "'>" + mapFig(m) + "<div class='legend'>" +
    (sc.legend || Object.keys(sc.sides).map(k => [k, sc.sides[k].n])).map(([k, n]) => "<span><i style='background:var(--" + k + ")'></i>" + esc(n) + "</span>").join("") + bzLegend(m) + terrHint(m) + "<span class='msize'>" + mapSize(W, H) + "</span></div>" +
    (note ? "<div class='mapnote'>" + esc(tpl(note, sc, st)) + "</div>" : "") + "</div>");
}
