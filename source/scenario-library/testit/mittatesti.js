/* Scenario Libraryn mittatesti (0.9.3, 21.10.2026): jokaisen kartan kiinteät kohteet on mitattu pöydän reunoista.

     node "scenario library/testit/mittatesti.js" [--lista] [--vain=id1,id2]

   Käyttäjä 21.10.: "ainakin kaikessa saisi olla tekniseen piirrustuksen tyyliset mitat että tuon kuvan saa aina
   replikoitua omalla pöydällä". Testi kaatuu, jos jonkin kiinteän kohteen paikkaa ei voi lukea kartalta.

   Jokainen kartta (skenaario × versio × jokainen alasvedon pöytä, jolle skenaario mahtuu × leveä/kapea fontti,
   lisäksi arvottu maasto päällä) piirretään sovelluksen omalla mapSVG(mapOf(...)):lla. Piirtäjä jättää
   piirtämänsä mitat m.dims-listaan. Testi poimii kohteet itse kartan esineistä (ei moottorin dimFeatures-funktiolla)
   ja tarkistaa:
     UNDIM   kohteen x- tai y-koordinaattia ei saa ketjutettua pöydän reunasta piirrettyjen mittojen kautta
             (reunamitat ja käsin tehdyt pelkät luvut ovat ketjuja; "up to"/"at least" -mitat eivät ole)
     RADIUS  ympyrän tai renkaan säde ei ole mitattu eikä kartan teksti kerro sitä ("within 30 cm")
     LABEL   mitan luku ei vastaa piirrettyä pituutta (käsin tehty "60 cm", mutta viiva on 50)
     FREE    (vain --lista) vapaaksi merkityt kohteet: free: 1 / "x" / "y", nr: 1
   Kohteet: rect, hatch, poly (kärjet), planet, mark, cm (keskipisteen risti), circ ja ring (keskipiste + säde; kaasu- ja
   asteroidinauhoilla vain keskipiste), corner (säde reunalla), akselinsuuntainen line, tick. free: 1 ohittaa kohteen,
   free: "x"/"y" vain toisen suunnan, nr: 1 säteen. Planeetan ympärillä säteen voi sanoa myös planeetan reunasta.
   Arvottu maasto (0.9) ei kuulu mitattaviin (käyttäjä: "terrain sijoittelu mittoja ei tarvi"). */
"use strict";
const path = require("path");
const { lataa } = require("./_lataa.js");
const ROOT = path.resolve(__dirname, "..");
const LIST = process.argv.includes("--lista");
const ONLY = (process.argv.find(a => a.startsWith("--vain=")) || "").slice(7).split(",").filter(Boolean);
const E = 0.05;

const L = lataa(ROOT, { extra: "window.__mapNarrow = false;", names: "setNarrow: n => { window.__mapNarrow = n; }" });
const num = l => { const m = String(l).match(/^\s*(\d+(?:\.\d+)?)\s*(?:cm)?\s*$/); return m ? +m[1] : null; };
const fmt = v => { const r = Math.round(Math.abs(v) * 10) / 10; return Math.abs(r - Math.round(r)) < .05 ? String(Math.round(r)) : r.toFixed(1); };

/* kohteet kartan esineistä: [akseli, arvo, kuvaus] */
function features(items, W, H) {
  const out = [], inner = (ax, v) => v > E && v < (ax === "x" ? W : H) - E, radius = [];
  const add = (it, ax, v, what) => { if (inner(ax, v) && it.free !== ax) out.push([ax, v, what]); };
  for (const it of items) {
    if (it.free === 1 || it.free === true) continue;
    const name = it.z + (it.l ? " '" + String(it.l).replace(/\s+/g, " ").slice(0, 28) + "'" : "");
    if ((it.z === "rect" || it.z === "hatch") && it.w > E && it.h > E) { add(it, "x", it.x, name + " left"); add(it, "x", it.x + it.w, name + " right"); add(it, "y", it.y, name + " top"); add(it, "y", it.y + it.h, name + " bottom"); }
    else if (it.z === "poly") it.pts.forEach(([x, y], i) => { add(it, "x", x, name + " pt" + i); add(it, "y", y, name + " pt" + i); });
    else if (it.z === "planet") { add(it, "x", it.cx, name); add(it, "y", it.cy, name); }
    else if (it.z === "mark" || it.z === "cm") { add(it, "x", it.x, name); add(it, "y", it.y, name); }
    else if (it.z === "circ" || it.z === "ring") { add(it, "x", it.cx, name); add(it, "y", it.cy, name); if (!it.nr && !it.gas && !it.ast) radius.push([it, name]); }
    else if (it.z === "corner") add(it, "x", it.c[1] === "l" ? it.r : W - it.r, name);
    else if (it.z === "line") { if (Math.abs(it.x1 - it.x2) < E) add(it, "x", it.x1, name); else if (Math.abs(it.y1 - it.y2) < E) add(it, "y", it.y1, name); }
    else if (it.z === "tick") for (const [x, l] of it.list) add(it, "x", x, "tick " + l);
  }
  return { out, radius };
}

const errs = new Map(), free = new Map();
const err = (kind, id, msg, where) => { const k = kind + "|" + id + "|" + msg; if (!errs.has(k)) errs.set(k, { kind, id, msg, where: [] }); const e = errs.get(k); if (e.where.length < 4) e.where.push(where); };
const counts = { maps: 0, dims: 0, edge: 0, hand: 0, radius: 0, features: 0 };
const oldT = L.DB.table;
for (const sc of L.SC) {
  if (!L.mapFn(sc)) continue;
  if (ONLY.length && !ONLY.some(o => sc.id === o || (o.endsWith("*") && sc.id.startsWith(o.slice(0, -1))))) continue;
  const vs = sc.variants ? sc.variants.map(x => x[0]) : [null];
  for (const v0 of vs) {
    const v = v0 || (sc.variants ? sc.variants[0][0] : null);
    for (const [W, H] of L.TABLES) {
      L.DB.table = { p: "custom", w: W, h: H };
      const fit = L.fitOf(sc, v);
      if (W < fit[0] || H < fit[1]) continue;
      for (const [narrow, terrain] of [[false, false], [true, false], [false, true]]) {
        L.setNarrow(narrow);
        const st = L.stOf(sc), old = st.bz;
        if (terrain) st.bz = { seed: 20261021 }; else delete st.bz;
        let m;
        try { m = L.mapOf(sc, v); L.mapSVG(m); } catch (e) { err("CRASH", sc.id, e.message, W + "×" + H); st.bz = old; continue; }
        st.bz = old;
        const where = (v0 ? v0 + " · " : "") + W + "×" + H + (narrow ? " · phone" : "") + (terrain ? " · terrain" : "");
        counts.maps++;
        const dims = m.dims || [];
        counts.dims += dims.length;
        /* tunnetut arvot: reunat + ketjut */
        const known = { x: [0, W], y: [0, H] }, links = [];
        for (const d of dims) {
          counts[d.kind] = (counts[d.kind] || 0) + 1;
          if (d.kind === "edge") links.push([d.ax, d.a, d.b]);
          if (d.kind === "hand" && !d.free && num(d.l) !== null) links.push([d.ax, d.a, d.b]);
          /* LABEL */
          if (d.kind !== "radius" && num(d.l) !== null && Math.abs(num(d.l) - Math.abs(d.b - d.a)) > 0.06)
            err("LABEL", sc.id, d.kind + " dim '" + d.l + "' is drawn " + fmt(d.b - d.a) + " long", where);
          if (d.kind === "radius" && d.l !== (d.r0 ? fmt(d.r - d.r0) : "R" + fmt(d.r))) err("LABEL", sc.id, "radius '" + d.l + "' for r " + fmt(d.r), where);
        }
        const has = (ax, v) => known[ax].some(k => Math.abs(k - v) < E);
        for (let ch = true; ch;) { ch = false; for (const [ax, a, b] of links) { if (has(ax, a) && !has(ax, b)) { known[ax].push(b); ch = true; } else if (has(ax, b) && !has(ax, a)) { known[ax].push(a); ch = true; } } }
        const F = features(m.items, W, H);
        counts.features += F.out.length;
        for (const [ax, val, what] of F.out) if (!has(ax, val)) err("UNDIM", sc.id, what + " " + ax + " = " + fmt(val), where);
        const texts = m.items.map(it => String(it.l || "")).join("\n");
        for (const [it, what] of F.radius) {
          /* planeetan ympärillä myös etäisyys planeetan reunasta ("within 30 cm" = säde − planeetan säde) */
          const said = r => new RegExp("(^|[^\\d.])" + fmt(r).replace(".", "\\.") + "\\s?cm").test(texts);
          const hub = m.items.find(p => p.z === "planet" && Math.abs(p.cx - it.cx) < E && Math.abs(p.cy - it.cy) < E && p.r < it.r);
          const stated = said(it.r) || (hub && said(it.r - hub.r));
          if (!stated && !dims.some(d => d.kind === "radius" && Math.abs(d.r - it.r) < E && Math.abs(d.cx - it.cx) < E && Math.abs(d.cy - it.cy) < E)) err("RADIUS", sc.id, what + " r " + fmt(it.r), where);
        }
        if (LIST && W === 180 && H === 120 && !narrow && !terrain) for (const it of m.items) if (it.free || it.nr) {
          const k = sc.id + (v0 ? "/" + v0 : ""); if (!free.has(k)) free.set(k, []);
          free.get(k).push(it.z + (it.free ? " free:" + it.free : "") + (it.nr ? " nr" : "") + (it.l ? " '" + String(it.l).replace(/\s+/g, " ").slice(0, 30) + "'" : ""));
        }
      }
    }
  }
}
L.DB.table = oldT;
const list = [...errs.values()];
console.log(JSON.stringify(counts));
for (const k of ["CRASH", "LABEL", "UNDIM", "RADIUS"]) {
  const ks = list.filter(e => e.kind === k);
  if (ks.length) console.log("\n" + k + " (" + ks.length + ")\n" + ks.map(e => "  " + e.id + " :: " + e.msg + " :: " + e.where.join(" | ")).join("\n"));
}
if (LIST) console.log("\nFREE\n" + [...free].map(([k, v]) => "  " + k + ": " + v.join("; ")).join("\n"));
console.log("\n" + (list.length ? list.length + " virhettä" : "0 virhettä"));
process.exit(list.length ? 1 : 0);
