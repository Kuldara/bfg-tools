/* Maastotesti (0.9, 21.10.2026): Battlezone Generatorin ydin Scenario Libraryssä.
   Aja:  node "scenario library/testit/maastotesti.js"   (Node, ei selainta; noin minuutti)

   1. YDIN     battlezone-core.js on tavulleen sama kuin generaattorin BZCORE-lohko (tee_maastoydin.py).
   2. GENERAATTORI  generaattorin omat kartat eivät muuttuneet: 7 560 siementä × asetusta, ryhmittäin
               SHA-1 maasto_sormenjaljet.json:iin (otettu ennen ytimen laajennusta 21.10.).
   3. TAULUKKO jokaisella skenaariolla on TERRAIN-rivi, eikä taulukossa ole tuntemattomia tunnisteita.
   4. KARTAT   jokainen skenaario × versio × 5 pöytää × 12 siementä:
               deterministinen (sama siemen → sama tulos), kaikki palat pöydällä, ei palojen päällekkäisyyttä,
               ei kiinteiden piirteiden tai keep-alueiden päälle (paitsi skenaarion omat planeetat, hosts),
               battlezone vastaa taulukkoa, ignore-tuloksia ei ole, korkeintaan yksi arvottu planeetta ja
               ei yhtään, jos kartalla on jo planeetta, eikä tekstissä undefined/NaN (paneeli, Play, loki). */
"use strict";
const fs = require("fs"), path = require("path"), vm = require("vm"), crypto = require("crypto");
const { lataa } = require("./_lataa.js");
const DIR = path.join(__dirname, "..");
let fails = 0;
const fail = (k, m) => { fails++; if (fails <= 40) console.log("VIRHE " + k + ": " + m); };

/* 1. ydin */
const gen = fs.readFileSync(path.join(DIR, "..", "terrain generator", "index.html"), "utf8");
const gm = gen.match(/\/\*BZCORE\*\/([\s\S]*?)\/\*\/BZCORE\*\//);
const copy = fs.readFileSync(path.join(DIR, "battlezone-core.js"), "utf8");
const cm = copy.match(/\/\*BZCORE\*\/([\s\S]*?)\/\*\/BZCORE\*\//);
if (!gm || !cm) fail("YDIN", "BZCORE-merkit puuttuvat");
else if (gm[1].replace(/\r\n/g, "\n") !== cm[1]) fail("YDIN", "battlezone-core.js on vanha: aja python tee_maastoydin.py");
else console.log("YDIN ok: kopio = generaattorin BZCORE (" + cm[1].length + " merkkiä)");

/* 2. generaattorin omat kartat */
{
  const ctx = { Math, JSON, Object, Array, Number, String, console };
  vm.createContext(ctx);
  vm.runInContext(gm[1] + "\n;globalThis.__g = generate;", ctx);
  const g = {}, want = JSON.parse(fs.readFileSync(path.join(__dirname, "maasto_sormenjaljet.json"), "utf8"));
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
  if (n !== want.cases) bad.push("määrä " + n);
  if (bad.length) fail("GENERAATTORI", "generaattorin kartat muuttuivat ryhmissä " + bad.join(", "));
  else console.log("GENERAATTORI ok: " + n + " karttaa samat kuin ennen ytimen laajennusta");
}

/* 3–4. kirjasto */
const L = lataa(DIR);
const ids = new Set(L.SC.map(s => s.id));
for (const id of ids) if (!L.TERRAIN[id]) fail("TAULUKKO", "ei riviä: " + id);
for (const id of Object.keys(L.TERRAIN)) if (!ids.has(id)) fail("TAULUKKO", "tuntematon tunniste: " + id);
console.log("TAULUKKO: " + Object.keys(L.TERRAIN).length + " riviä, " + ids.size + " skenaariota");

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
    if (!m.bz) { fail(key, "ei tulosta"); continue; }
    maps++;
    if (JSON.stringify(m.bz.terrain) !== JSON.stringify(m2.bz.terrain) || JSON.stringify(m.bz.log) !== JSON.stringify(m2.bz.log)) fail(key, "ei deterministinen");
    const sp = L.bzSpec(sc, v), items = L.bzItems(sc, v, st), z = L.bzZone(sp, st), me = m.bz.meta;
    /* battlezone */
    const zn = me.zone ? me.zone.n : null;
    zones[zn] = (zones[zn] || 0) + 1;
    if (z === "none" ? zn !== null : typeof z === "number" ? zn !== z : z === "roll" ? !(zn >= 1 && zn <= 6) : !z.rows.some(r => r[2] === zn)) fail(key, "battlezone " + zn + " ≠ " + JSON.stringify(z));
    /* kiinteät piirteet ja keep: samat muodot kuin moottori antaa ytimelle */
    const fixed = L.bzFixed(items, sp, W).concat((typeof sp.keep === "function" ? sp.keep(v, W, H, st, items) : sp.keep) || []);
    const ps = m.bz.terrain.filter(t => t.kind !== "ring");
    pieces += ps.length;
    for (const t of ps) {
      if (offTable(t, W, H)) fail(key, t.id + " ulottuu pöydän yli");
      /* skin-nuoli (esim. warp-virta, 21.10.): käännetty nuoli kokonaan pöydällä */
      if (t.sk && t.sk.arrow) { const hx = Math.abs(Math.cos(t.dir)) * t.rx, hy = Math.abs(Math.sin(t.dir)) * t.rx;
        if (t.x - hx < -0.01 || t.x + hx > W + 0.01 || t.y - hy < -0.01 || t.y + hy > H + 0.01) fail(key, t.id + " (nuoli) ulottuu pöydän yli"); }
      if (!t.host) for (const f of fixed) if (onShape(t, f)) { fail(key, t.id + " kiinteän piirteen päällä " + JSON.stringify(f)); break; }
    }
    for (let i = 0; i < ps.length; i++) for (let j = i + 1; j < ps.length; j++) if (touches(ps[i], ps[j])) fail(key, ps[i].id + " ja " + ps[j].id + " päällekkäin");
    /* ignore ja planeettaraja */
    const listed = k => [].concat((typeof sp.pieces === "function" ? sp.pieces(v, W, H, st, items) : sp.pieces) || []).some(p => p.kind === k);
    for (const k2 of sp.ignore || []) if (!listed(k2) && ps.some(t => t.kind === k2 && !t.host)) fail(key, "ignore-tulos " + k2 + " kartalla");
    if (!listed("planet")) {
      const rolled = ps.filter(t => t.kind === "planet" && !t.host).length, already = items.filter(L.bzIsPlanet).length + ps.filter(t => t.host).length;
      if (rolled > (already ? 0 : 1)) fail(key, rolled + " arvottua planeettaa (kartalla jo " + already + ")");
    }
    /* teksti */
    const txt = L.bzCtl(sc, st, v, m) + L.bzBox(sc, st, v, m) + L.mapSVG(m) + JSON.stringify(L.bzPlay(sc, st)) + L.bzEvTool(sc, st) + m.bz.log.map(l => l.text).join(" ");
    if (BAD.test(txt)) fail(key, "tekstissä " + txt.match(BAD)[0]);
    for (const sel of ["zone", "sun"].concat(ps.map(t => t.id), [...new Set(ps.map(t => "k:" + t.kind))])) { st.bz.sel = sel; const h = L.bzBox(sc, st, v, m); if (BAD.test(h) || !/bzrules/.test(h)) fail(key, "säännöt: " + sel); }
    st.bz.sel = "";
  }
}
console.log("KARTAT: " + maps + " karttaa, " + pieces + " palaa; battlezonet " + JSON.stringify(zones));
console.log(fails ? "TULOS: " + fails + " virhettä" : "TULOS: 0 virhettä");
process.exit(fails ? 1 : 0);
