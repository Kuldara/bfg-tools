/* The in-game map on the Play tab (0.10, 21.10.2026).

   Owner: "e.g. in the Escalating Engagement scenario it would help if the map were still visible on the
   Play tab, at least smaller (and it is drawn a bit differently from turn 0), and think of the other
   scenarios where this improvement is relevant".

   - By default the Play tab shows the Set-up map (the same rolled terrain) in every scenario; without a
     fixed map, the rolled terrain if there is one.
   - PLAYMAP[id].draw(v, W, H, st, sc, base) draws the in-game picture for turn st.turn when it differs
     from the set-up: the deployment zones go, and what happens this turn comes instead (an arrival band,
     the comet's position, a shock wave). base = the Set-up map's items. note(v, st) = a sentence under the map.
   - The rolled terrain stays as in Set-up (mapOf computes it from the Set-up items). */

/* 21.10. evening: the earlier limit (30 set-up maps with no Play map) was undone at the owner's request:
   "actually, always put the map on the play tab, in all of them". The map now shows in all (index.html: playMapOn). */

(function () {
  const BAND = 4; /* saapumiskaistan paksuus kartalla (symboli, ei mittaa) */
  /* an arrival like The Bait's: short edge e ("l" / "r") along its whole length and the long edges within reach cm of it */
  const band = (W, H, e, reach, s) => {
    const r = Math.max(0, Math.min(W, reach));
    if (!r) return [];
    const x = e === "l" ? 0 : W - r;
    return [R(x, 0, r, BAND, s, "", { free: "y" }), R(x, H - BAND, r, BAND, s, "", { free: "y" })];
  };
  /* on three lines, so it fits a narrow table too (the map test) */
  const reachText = (T, reach, W) => "Turn " + T + ": " + (T < 2 || reach <= 0 ? "\nonly from the short edge" :
    reach >= W ? "the short edge,\nor anywhere along\neither long edge" : "the short edge,\nor up to " + reach + " cm along\neither long edge");
  /* edge text + band + an explaining text (centred by default; tx, ty = position) */
  const bait = (W, H, T, e, reach, s, who, ty, tx) => band(W, H, e, reach, s).concat([
    { z: "edge", e, s, l: who },
    { z: "text", x: tx === undefined ? W / 2 : tx, y: ty === undefined ? H / 2 : ty, l: reachText(T, reach, W), s }
  ]);
  const keep = (base, f) => base.filter(f);
  /* a random edge's numbers more visibly: "D6: 2–3" */
  const d6edges = base => base.filter(i => i.z === "edge").map(i => Object.assign({}, i, { l: "D6: " + i.l }));

  window.PLAYMAP = {
    /* the starting markers' area is set-up; in play the edges' numbers (a random edge) and the arrival rule are needed */
    "escalating-engagement": {
      draw: (v, W, H, st, sc, base) => d6edges(base).concat([
        { z: "text", x: W / 2, y: 12, l: "Reserve markers: on a random edge (D6),\nnot within 60 cm of enemy ships" }
      ]),
      note: () => "Ships arrive within 10 cm of their marker. If you have ships within 30 cm of the rolled edge, the marker goes within 30 cm of them (RB p. 138–139)."
    },
    "cl-ahriman": {
      draw: (v, W, H, st, sc, base) => d6edges(base).concat([
        { z: "text", x: W / 2, y: 12, l: "Imperial reserve markers: on a random edge (D6),\nnot within 60 cm of enemy ships. Ahriman: any edge" }
      ]),
      note: () => "Edge numbers for the Imperial reinforcements’ random edge, as in Escalating Engagement."
    },
    /* RB p. 130: from turn 2 also from the long edges, 30 cm more each turn (the book's example: turn 4 = 90 cm) */
    "the-bait": {
      draw: (v, W, H, st) => bait(W, H, st.turn, "r", 30 * (st.turn - 1), "a", "Reinforcements"),
      note: st => "Where reinforcements may come on this turn. The ticks on the Set-up map show the same for every turn."
    },
    "parols-bait": {
      draw: (v, W, H, st) => bait(W, H, st.turn, "r", 30 * (st.turn - 1), "a", "Reinforcements"),
      note: () => "Where reinforcements may come on this turn (the tool below gives the same)."
    },
    "bc-rearguard-attack": {
      draw: (v, W, H, st, sc, base) => keep(base, i => i.z === "sun").concat(bait(W, H, st.turn, "l", 30 * (st.turn - 1), "a", "")),
      note: () => "Order’s reinforcements: the sunward edge from turn 1, then 30 cm further along the long edges each turn."
    },
    "fan-p-rising-shadow": {
      draw: (v, W, H, st, sc, base) => keep(base, i => i.dash === 1 || i.l === "warp rift box").concat(bait(W, H, st.turn, "r", 30 * (st.turn - 1), "a", "Ry’zon and Tas’ka")),
      note: () => "Where Ry’zon and Tas’ka may come on this turn."
    },
    "fan-p-another-day": {
      draw: (v, W, H, st, sc, base) => keep(base, i => i.z === "edge" && i.e === "l").concat(bait(W, H, st.turn, "r", 30 * (st.turn - 1), "a", "Sheva’s rescue fleet")),
      note: () => "Where the rescue fleet may come on this turn."
    },
    /* The Trap: on a shorter table the defender arrives later (trapDelay, the same as Set-up's ticks) */
    "wr-the-trap": {
      draw: (v, W, H, st, sc, base) => {
        const d = Math.max(0, Math.floor((180 - W) / 30)), t = st.turn - d, out = keep(base, i => i.z === "mark" || i.z === "dim");
        if (t < 1) return out.concat([{ z: "edge", e: "r", s: "b", l: "Reinforcements: not yet" }, { z: "text", x: W / 2, y: H * .22, l: "Turn " + st.turn + ":\nreinforcements may\nnot arrive yet", s: "b" }]);
        /* the text to the right of the station (90 cm): on a wide table the centre would hit the station */
        return out.concat(bait(W, H, st.turn, "r", 30 * (t - 1), "b", "Reinforcements", H * .24, W > 200 ? (Math.min(W - 30, 90) + W) / 2 : W / 2));
      },
      note: () => "Where the defender’s reinforcements may come on this turn."
    },
    /* Commerce Raiders v0.5: turn 1 the corridor edge or 30 cm of the long edges, 30 cm more each turn */
    "wr-commerce-raiders": {
      draw: (v, W, H, st, sc, base) => keep(base, i => (i.z === "rect" && i.free === "x") || (i.z === "edge" && i.e === "r")).concat(band(W, H, "r", 30 * st.turn, "a"), [
        { z: "text", x: W / 2, y: H / 2, l: "Turn " + st.turn + ": raiders " + (30 * st.turn >= W ? "anywhere along the long edges" : "up to " + 30 * st.turn + " cm along the long edges") + "\n(not the corridor edge after turn 1)", s: "a" }
      ]),
      note: () => "Where raiders still off the table may come on this turn; the escape corridor stays on the right."
    },
    /* Shadow of the Comet: the comet moves 10 cm along its path at the start of every turn; its starting end is rolled (Set-up) */
    "fan-n-comet": {
      draw: (v, W, H, st, sc, base) => {
        const line = base.find(i => i.z === "line"), x = line ? line.x1 : W / 2, end = get(st, "end", 0), top = end >= 4, moved = 10 * st.turn;
        const y = top ? moved : H - moved, gone = y < 0 || y > H;
        if (!end) return keep(base, i => i.z === "planet" || i.z === "line").concat([{ z: "text", x: W / 2 + 20, y: H / 2, l: "Roll the comet’s starting end\non the Set-up tab", s: "n" }]);
        return keep(base, i => i.z === "planet" || i.z === "line").concat(gone ? [{ z: "text", x: W / 2, y: H / 2, l: "Turn " + st.turn + ": the comet has left the table", s: "n" }] : [
          { z: "dim", x1: x + 8, y1: top ? 0 : H, x2: x + 8, y2: y, l: moved + " cm", keep: 1 },
          { z: "mark", x, y, s: "n", l: "comet", free: 1 },
          { z: "text", x: Math.min(W - 30, x + 46), y: Math.max(12, Math.min(H - 12, top ? y + 16 : y - 16)), l: "Attackers hidden\nwithin 10 cm", s: "a" }
        ]);
      },
      note: st => get(st, "end", 0) ? "The comet after its move at the start of turn " + st.turn + ": 10 cm a turn along its path, from the " + (get(st, "end", 0) >= 4 ? "top" : "bottom") + " end." : "The comet moves 10 cm a turn along its path."
    },
    /* Solblade 2: the wave comes from behind the Tyranids from turn 2, 15 cm in every movement phase (both players') */
    "wr-solblade-2": {
      draw: (v, W, H, st, sc, base) => {
        const T = st.turn, out = keep(base, i => i.z === "sun" || i.z === "edge");
        if (T < 2) return out.concat([{ z: "text", x: W / 2, y: H / 2, l: "Turn 1: no shockwave yet —\nit enters in the Tyranids’ turn 2", s: "n" }]);
        const a = Math.min(W, 15 + 30 * (T - 2)), b = Math.min(W, 30 + 30 * (T - 2));
        return out.concat([R(0, 0, a, H, "n", ""), R(a, 0, b - a, H, "n", "", { dash: 1 }),
          { z: "text", x: b + (W - b) / 2, y: H / 2, l: "Shockwave, turn " + T + ":\n" + a + " cm after the Tyranid move,\n" + b + " cm after the Solblade move", s: "n" }]);
      },
      note: () => "Anything whose stem the shockwave reaches is destroyed."
    }
  };
})();
