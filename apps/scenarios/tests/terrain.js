/* Terrain test (0.9, 21.10.2026): the Battlezone Generator core in the Scenario Library.
   Run:  node apps/scenarios/tests/terrain.js   (Node, no browser; about a minute)

   1. CORE       the generator page and the library are built from one file (packages/battlezone).
   2. GENERATOR  the generator's own maps did not change: 7 560 seeds × settings, by group
                 as SHA-1 in terrain_fingerprints.json (taken before the core was extended on 21.10.).
   3. TABLE      every scenario has a TERRAIN row, and the table has no unknown ids.
   4. MAPS       every scenario × version × 5 tables × 12 seeds:
                 deterministic (same seed → same result), every piece on the table, no overlapping pieces,
                 none on fixed features or keep areas (except the scenario's own planets, hosts),
                 the battlezone matches the table, no ignore results, at most one rolled planet and
                 none if the map already has a planet, and no undefined/NaN in the text (panel, Play, log). */
"use strict";
const fs = require("fs"), path = require("path"), vm = require("vm"), crypto = require("crypto");
const { loadLibrary } = require("./_load.js");
const DIR = path.join(__dirname, "..");
let fails = 0;
const fail = (k, m) => { fails++; if (fails <= 40) console.log("ERROR " + k + ": " + m); };

/* 1. core: the generator's page and the library are built from one file,
   packages/battlezone/core.js; check that the generator page still includes it */
const gen = fs.readFileSync(path.join(DIR, "..", "terrain", "index.html"), "utf8");
const gm = [null, require(path.join(DIR, "..", "..", "packages", "battlezone", "index.js")).core()];
if (!/^@@include \.\.\/\.\.\/packages\/battlezone\/core\.js$/m.test(gen)) fail("CORE", "the generator page does not include packages/battlezone/core.js");
else console.log("CORE ok: generator and library share packages/battlezone/core.js (" + gm[1].length + " chars)");

/* 2. the generator's own maps */
{
  const ctx = { Math, JSON, Object, Array, Number, String, console };
  vm.createContext(ctx);
  vm.runInContext(gm[1] + "\n;globalThis.__g = generate;", ctx);
  const g = {}, want = JSON.parse(fs.readFileSync(path.join(__dirname, "terrain_fingerprints.json"), "utf8"));
  let n = 0;
  for (const z of ["roll", "1", "2", "3", "4", "5", "6"])
    for (const [w, h] of [[180, 120], [240, 180], [120, 90], [90, 60], [183, 122], [61, 300]])
      for (const [sector, thr] of [[60, 4], [40, 3], [120, 6]])
        for (let seed = 1; seed <= 60; seed++) {
          const s = seed * 7919 + 13, r = ctx.__g(s, { zone: z, width: w, height: h, sector, threshold: thr });
          const key = [z, w, h, sector, thr, s].join("|");
          const hsh = crypto.createHash("sha1").update(JSON.stringify({ t: r.terrain, l: r.log, m: Object.assign({}, r.meta, { zone: r.meta.zone.n }) })).digest("hex").slice(0, 16);
          (g[z] = g[z] || []).push(key + "=" + hsh); n++;
        }
  let bad = [];
  for (const z in g) { const k = crypto.createHash("sha1").update(g[z].sort().join("\n")).digest("hex"); if (k !== want[z]) bad.push(z); }
  if (n !== want.cases) bad.push("count " + n);
  if (bad.length) fail("GENERATOR", "the generator's maps changed in groups " + bad.join(", "));
  else console.log("GENERATOR ok: " + n + " maps the same as before the core was extended");
}

/* 3–4. library */
const L = loadLibrary(DIR);
const ids = new Set(L.SC.map(s => s.id));
for (const id of ids) if (!L.TERRAIN[id]) fail("TABLE", "no row: " + id);
for (const id of Object.keys(L.TERRAIN)) if (!ids.has(id)) fail("TAULUKKO", "tuntematon tunniste: " + id);
console.log("TABLE: " + Object.keys(L.TERRAIN).length + " rows, " + ids.size + " scenarios");

const KEEP_CLEAR = L.BZ.KEEP_CLEAR, ext = L.BZ.extents, EPS = 1e-6;
const offTable = (t, W, H) => { const e = ext(t); return t.x - e.hw < -EPS || t.x + e.hw > W + EPS || t.y - e.hh < -EPS || t.y + e.hh > H + EPS; };
const touches = (a, b) => { const p = ext(a), q = ext(b); return Math.abs(a.x - b.x) < p.hw + q.hw + KEEP_CLEAR - EPS && Math.abs(a.y - b.y) < p.hh + q.hh + KEEP_CLEAR - EPS; };
const onShape = (t, f) => {
  const e = ext(t), rr = Math.max(e.hw, e.hh);
  if (f.shape === "box") return t.x + e.hw + KEEP_CLEAR > f.x0 + EPS && t.x - e.hw - KEEP_CLEAR < f.x1 - EPS && t.y + e.hh + KEEP_CLEAR > f.y0 + EPS && t.y - e.hh - KEEP_CLEAR < f.y1 - EPS;
  const d = Math.hypot(t.x - f.x, t.y - f.y);
  if (f.shape === "annulus") return d + rr + KEEP_CLEAR > f.r0 + EPS && d - rr - KEEP_CLEAR < f.r1 - EPS;
  return d < f.r + rr + KEEP_CLEAR - EPS;
};
const BAD = /undefined|NaN|\[object|function \(/;
const TABLES = [[180, 120], [183, 122], [122, 122], [91, 91], [244, 122]];
let maps = 0, pieces = 0, zones = {};
for (const sc of L.SC) {
  const vs = sc.variants ? sc.variants.map(x => x[0]) : ["std"];
  for (const v of vs) for (const [W, H] of TABLES) for (let k = 1; k <= 12; k++) {
    const seed = 100003 * k + W, key = sc.id + "/" + v + " " + W + "×" + H + " #" + seed;
    L.DB.table = { w: W, h: H };
    const st = { w: {}, turn: 1, v, done: {}, bz: { seed } };
    L.DB.s = L.DB.s || {}; L.DB.s[sc.id] = st;
    let m, m2;
    try { m = L.mapOf(sc, v); m2 = L.mapOf(sc, v); } catch (e) { fail(key, "poikkeus: " + e.message); continue; }
    if (!m.bz) { fail(key, "no result"); continue; }
    maps++;
    if (JSON.stringify(m.bz.terrain) !== JSON.stringify(m2.bz.terrain) || JSON.stringify(m.bz.log) !== JSON.stringify(m2.bz.log)) fail(key, "not deterministic");
    const sp = L.bzSpec(sc, v), items = L.bzItems(sc, v, st), z = L.bzZone(sp, st), me = m.bz.meta;
    /* battlezone */
    const zn = me.zone ? me.zone.n : null;
    zones[zn] = (zones[zn] || 0) + 1;
    if (z === "none" ? zn !== null : typeof z === "number" ? zn !== z : z === "roll" ? !(zn >= 1 && zn <= 6) : !z.rows.some(r => r[2] === zn)) fail(key, "battlezone " + zn + " ≠ " + JSON.stringify(z));
    /* fixed features and keep: the same shapes the engine gives the core */
    const fixed = L.bzFixed(items, sp, W).concat((typeof sp.keep === "function" ? sp.keep(v, W, H, st, items) : sp.keep) || []);
    const ps = m.bz.terrain.filter(t => t.kind !== "ring");
    pieces += ps.length;
    for (const t of ps) {
      if (offTable(t, W, H)) fail(key, t.id + " reaches past the table");
      /* a skin arrow (e.g. a warp current, 21.10.): the turned arrow wholly on the table */
      if (t.sk && t.sk.arrow) { const hx = Math.abs(Math.cos(t.dir)) * t.rx, hy = Math.abs(Math.sin(t.dir)) * t.rx;
        if (t.x - hx < -0.01 || t.x + hx > W + 0.01 || t.y - hy < -0.01 || t.y + hy > H + 0.01) fail(key, t.id + " (arrow) reaches past the table"); }
      if (!t.host) for (const f of fixed) if (onShape(t, f)) { fail(key, t.id + " on a fixed feature " + JSON.stringify(f)); break; }
    }
    for (let i = 0; i < ps.length; i++) for (let j = i + 1; j < ps.length; j++) if (touches(ps[i], ps[j])) fail(key, ps[i].id + " and " + ps[j].id + " overlap");
    /* ignore and the planet limit */
    const listed = k => [].concat((typeof sp.pieces === "function" ? sp.pieces(v, W, H, st, items) : sp.pieces) || []).some(p => p.kind === k);
    for (const k2 of sp.ignore || []) if (!listed(k2) && ps.some(t => t.kind === k2 && !t.host)) fail(key, "ignore result " + k2 + " on the map");
    if (!listed("planet")) {
      const rolled = ps.filter(t => t.kind === "planet" && !t.host).length, already = items.filter(L.bzIsPlanet).length + ps.filter(t => t.host).length;
      if (rolled > (already ? 0 : 1)) fail(key, rolled + " rolled planets (the map already has " + already + ")");
    }
    /* text */
    const txt = L.bzCtl(sc, st, v, m) + L.bzBox(sc, st, v, m) + L.mapSVG(m) + JSON.stringify(L.bzPlay(sc, st)) + L.bzEvTool(sc, st) + m.bz.log.map(l => l.text).join(" ");
    if (BAD.test(txt)) fail(key, "in the text " + txt.match(BAD)[0]);
    for (const sel of ["zone", "sun"].concat([...new Set(ps.map(t => "k:" + t.kind))])) { st.bz.sel = sel; const h = L.bzBox(sc, st, v, m); if (BAD.test(h) || !/bzrules/.test(h)) fail(key, "rules: " + sel); }
    /* a piece's rules are in the map legend (0.13, terrPop); so are the scenario's own terrain (TERR_INFO) and the book's terrain on the map */
    const own = m.items.map(it => L.terrHit(it)).filter(Boolean).map(h => h.id); /* m.items: replaced items (drop) are already gone */
    for (const sel of ps.map(t => t.id).concat([...new Set(own)])) { const h = L.terrPop(Object.assign({}, m, { sel })); if (BAD.test(h) || !/tpop/.test(h) || !/<li>/.test(h)) fail(key, "legend: " + sel); }
    st.bz.sel = "";
  }
}
console.log("MAPS: " + maps + " maps, " + pieces + " pieces; battlezones " + JSON.stringify(zones));
console.log(fails ? "RESULT: " + fails + " errors" : "RESULT: 0 errors");
process.exit(fails ? 1 : 0);
