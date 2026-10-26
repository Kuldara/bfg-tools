/* Content test: run it on the page like the browser test
     await eval(await fetch("tests/content.js?v="+Date.now()).then(r=>r.text()))
   Checks by machine for content errors the browser and map tests do not see:
   1. COLOUR: a map text names a side (sides.x.n) but is drawn in the other side's colour.
      Edges are skipped: they are coloured by who uses the edge (e.g. an escape edge).
   2. SIDE: a set-up step, Play rule or turn reminder is marked for side s, but the sentence starts
      with the other side's name ("The attacker takes…" at the defender's step). Kotol's "The defender picks
      three of your cruisers" is intentional (it addresses the other side) and allowed.
   3. RESULT: every scenario's result() with random inputs (60 × version): no exceptions,
      no undefined/NaN in the heading, and the verb agrees (plural "win", singular "wins").
   4. EMPTY: in an untouched game (no inputs, turn 1) the verdict shown must not name a
      winner — found in 0.7: the Planetary Assault family said "Defender's victory" before the game.
   Returns a JSON string { counts, err, items }. */
(() => {
  const items = [], esc2 = s => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const ALLOW_SIDE = new Set(["cl-kotol"]);
  let maps = 0, lines = 0, results = 0;
  const rnd = n => Math.floor(Math.random() * n);
  for (const sc of SC) {
    const names = Object.entries(sc.sides).map(([k, x]) => [k, x.n]).filter(x => x[1]);
    const vs = sc.variants ? sc.variants.map(x => x[0]) : ["std"];
    /* 1. COLOUR */
    const fn = sc.draw || MAPS[sc.id];
    for (const v of vs) {
      if (!fn) break;
      let its; try { its = fn(v, 180, 120, { w: {}, turn: 1 }).filter(Boolean); } catch (e) { items.push("err MAP " + sc.id + " " + v + " :: " + e.message); continue; }
      maps++;
      for (const it of its) {
        const l = String(it.l || ""); if (!l || !it.s || it.s === "n" || it.z === "edge") continue; /* edges are coloured by who uses them */
        const hits = names.filter(([k, n]) => new RegExp("(^|[^A-Za-z])" + esc2(n) + "([^A-Za-z]|$)", "i").test(l));
        if (hits.length === 1 && hits[0][0] !== it.s) items.push("warn COLOUR " + sc.id + " " + v + " :: " + JSON.stringify(l) + " names side " + hits[0][0] + ", colour " + it.s);
      }
    }
    /* 2. SIDE */
    if (!ALLOW_SIDE.has(sc.id)) {
      const seen = new Set();
      for (const v of vs) {
        const list = (sc.steps || []).concat(sc.play || []).filter(x => vis(x, v)).map(x => [x.s, x.t]);
        const fx = sc.fx || TURNFX[sc.id];
        if (fx) for (let T = 1; T <= 12; T++) { try { fx(T, stOf(sc), v).forEach(e => list.push([e[0], e[1]])); } catch (e) { items.push("err FX " + sc.id + " " + v + " T" + T + " :: " + e.message); } }
        for (const [s, t] of list) {
          if (!s || !t || seen.has(s + t)) continue; seen.add(s + t); lines++;
          for (const [k, n] of names) if (k !== s && new RegExp("^(The )?" + esc2(n) + "(s)?( |’s |'s )", "i").test(t.trim()))
            items.push("err SIDE " + sc.id + " :: marked " + s + ", starts " + JSON.stringify(t.slice(0, 70)));
        }
      }
    }
    /* 4. EMPTY */
    for (const v of vs) {
      try { const r = verdict(sc, { w: {}, turn: 1, v }, v); if (r && r[0]) items.push("err EMPTY " + sc.id + " " + v + " :: " + r[1]); }
      catch (e) { items.push("err EMPTY " + sc.id + " " + v + " :: " + e.message); }
    }
    /* 3. RESULT */
    const tools = (sc.tools || []).concat(sc.rtools || [], sc.stools || []);
    for (const v of vs) for (let k = 0; k < 60; k++) {
      const w = {};
      for (const t of tools) {
        if (!t.id) continue;
        if (t.k === "num") w[t.id] = rnd(4) ? rnd(40) * 25 : 0;
        else if (t.k === "counter") w[t.id] = (t.min || 0) + rnd(8);
        else if (t.k === "toggle") w[t.id] = !!rnd(2);
        else if (t.k === "ending" || t.k === "pick") w[t.id] = rnd((t.rows || []).length + 1) - 1;
        else if (t.k === "roll") w[t.id] = rnd(7);
      }
      if (rnd(2)) w.over = true;
      let r;
      try { r = sc.result({ w, turn: 1 + rnd(12), v }, v, sc); results++; } catch (e) { items.push("err RESULT " + sc.id + " " + v + " :: " + e.message); break; }
      const h = r && r[1] ? String(r[1]) : "";
      if (/undefined|NaN|\[object/.test(h + " " + (r && r[2] || ""))) { items.push("err RESULT " + sc.id + " :: " + h + " / " + r[2]); break; }
      if (/\b(\w+s|Eldar) wins\b/.test(h) && !/\b(\w*ss|Chaos) wins\b/.test(h)) { items.push("err VERB " + sc.id + " :: " + h); break; }
    }
  }
  /* 5. OPEN (21.10.): points left open (scenarios/wr-rating.js WR_RATE and open-points.js OPEN). Every
     WR scenario has a row and a note; every point has an id, a heading, a default and a source or o: 1;
     book "E" only without a book alternative (the tag Fan rules optional must not have E); {a:id} points
     to a point shown in that version; there are no unknown ids. */
  const ids0 = new Set(SC.map(sc => sc.id)), wrIds = new Set(SC.filter(sc => sc.trust === "wr").map(sc => sc.id));
  for (const id of Object.keys(WR_RATE)) if (!wrIds.has(id)) items.push("err OPEN " + id + " :: unknown id in wr-rating.js");
  for (const id of Object.keys(OPEN)) if (!ids0.has(id) || wrIds.has(id)) items.push("err OPEN " + id + " :: an unknown or WR id in open-points.js");
  let nAg = 0;
  for (const sc of SC) {
    const r = sc.trust === "wr" ? WR_RATE[sc.id] : OPEN[sc.id];
    if (sc.trust === "wr" && (!r || !r.r)) items.push("err OPEN " + sc.id + " :: the WR scenario has no row or note");
    if ((sc.tags || []).includes("Fan rules optional") && sc.book === "E") items.push("err OPEN " + sc.id + " :: Fan rules optional but book E");
    const vs = sc.variants ? sc.variants.map(x => x[0]) : ["std"];
    for (const v of vs) {
      const ids = new Set();
      for (const x of (sc.agree || []).filter(x => vis(x, v))) {
        nAg++;
        if (!x.id || !x.l || x.d === undefined || x.d === "") items.push("err OPEN " + sc.id + " :: a point lacks id, l or d");
        if (!x.o && !x.s) items.push("err OPEN " + sc.id + " :: " + x.id + ": the default has no source and no o:1");
        if (ids.has(x.id)) items.push("err OPEN " + sc.id + " " + v + " :: " + x.id + " twice in the same version"); ids.add(x.id);
      }
      const texts = sc.steps.filter(x => vis(x, v)).map(x => x.t).concat((sc.play || []).filter(x => vis(x, v)).map(x => x.t), pickV(sc.win, v) || [], pickV(sc.end, v) || [], [val(sc.mapNote, v) || "", val(sc.noMap, v) || ""]);
      for (const t of texts) for (const m of String(t).matchAll(/\{a:(\w+)\}/g)) if (!ids.has(m[1])) items.push("err OPEN " + sc.id + " " + v + " :: {a:" + m[1] + "} without a point");
    }
  }
  const err = items.filter(x => x.startsWith("err")).length;
  return JSON.stringify({ counts: { scenarios: SC.length, maps, lines, results, openPoints: nAg }, err, warn: items.length - err, items });
})()
