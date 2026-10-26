import { esc, fmt } from "./helpers.js";
import { mapFn } from "./maps.js";
import { tableWH } from "./table.js";

/* ---------------------------------------------------------------- celestial phenomena (0.9)
   The Battlezone Generator's core (battlezone-core.js, namespace BZ, built from packages/battlezone/core.js)
   rolls terrain onto the scenario's own map with the same rules and dice as the generator. TERRAIN[id]
   (scenarios/terrain-map.js) gives the battlezone and its grounds, the scenario's own planets and pieces, and a
   note if rolled terrain does not fit the scenario's idea. The map's fixed features (planets, fields, rings,
   markers) block rolled terrain. The seed is in the scenario's state (st.bz.seed): the same seed, table, version
   and choices -> the same map. Reroll changes the seed. */
export const BZ_SIDE = { l: "left", r: "right", t: "top", b: "bottom" };
export const BZ_PSIZE = { small: 7.5, medium: 12.5, large: 25 };
export function bzSpec(sc, v) {
  const b = (typeof TERRAIN !== "undefined" && TERRAIN[sc.id]) || { z: "any", by: "book" };
  return Object.assign({}, b, b.v && b.v[v] || {});
}
export function bzChoices(sp, st) {
  const z = typeof sp.z === "function" ? sp.z(st || {}) : sp.z;
  return z === "any" ? ["roll", 1, 2, 3, 4, 5, 6] : Array.isArray(z) ? z : [z === undefined ? "roll" : z];
}
export function bzZone(sp, st) { const ch = bzChoices(sp, st), cur = st && st.bz ? st.bz.z : undefined, hit = ch.find(c => String(c) === String(cur)); return hit !== undefined ? hit : ch[0]; }
export function bzZoneLabel(c) { return c === "roll" ? "Roll it: D6 (RB p. 105)" : c === "none" ? "No battlezone" : typeof c === "object" ? "Roll: " + c.text.replace(/^the scenario(’s D\d)?: /, "") : BZ.ZONES[c - 1].name; }
/* the map items nothing is rolled onto: planets (their real size if known), fields, rings, markers, small circles */
export function bzPlanetR(it, sp, i) {
  const s = Array.isArray(sp.fixedSize) ? sp.fixedSize[i] : sp.fixedSize, l = String(it.l || "");
  const sz = s || (/large|giant|circe/i.test(l) ? "large" : /small/i.test(l) ? "small" : "medium");
  return Math.max(it.r, BZ_PSIZE[sz] || it.r);
}
export function bzIsPlanet(it) { return it.z === "planet" && it.r >= 5 && !/moon|comet/i.test(it.l || ""); }
export function bzFixed(items, sp, W) {
  const S = (W + 30) / 210, nb = (sp.noBlock || []).concat(sp.drop || []), out = [];
  let np = 0;
  for (const it of items) {
    if (nb.includes(it.z)) continue;
    if (it.z === "planet") out.push({ shape: "circle", x: it.cx, y: it.cy, r: bzIsPlanet(it) ? bzPlanetR(it, sp, np++) : it.r });
    else if (it.z === "hatch") out.push({ shape: "box", x0: it.x, y0: it.y, x1: it.x + it.w, y1: it.y + it.h });
    else if (it.z === "mark") out.push({ shape: "circle", x: it.x, y: it.y, r: Math.max(4, 3.2 * S) });
    else if (it.z === "ring" && (it.gas || it.ast)) out.push({ shape: "annulus", x: it.cx, y: it.cy, r0: Math.max(0, it.r - it.sw / 2), r1: it.r + it.sw / 2 });
    else if (it.z === "circ" && it.r <= 10) out.push({ shape: "circle", x: it.cx, y: it.cy, r: it.r });
  }
  return out;
}
export function bzItems(sc, v, st) { const [W, H] = tableWH(), fn = mapFn(sc); return fn ? fn(v, W, H, st, sc).filter(Boolean) : []; }
export function bzRun(sc, v, st, W, H, items) {
  if (!st || !st.bz || !st.bz.seed) return null;
  const sp = bzSpec(sc, v), z = bzZone(sp, st), f = k => typeof sp[k] === "function" ? sp[k](v, W, H, st, items) : sp[k];
  const sunIt = items.find(i => i.z === "sun");
  const opts = {
    width: W, height: H, sector: 60, threshold: 4,
    zone: typeof z === "number" ? String(z) : z,
    zoneText: z === "none" ? sp.zoneText : typeof z !== "number" ? undefined : typeof sp.z === "function" ? "From the scenario’s Battlezone roll (Set-up tools)."
      : sp.z === "any" ? undefined : Array.isArray(sp.z) ? "One of the battlezones the scenario allows." : "Set by the scenario.",
    sun: sp.sun !== undefined ? (BZ_SIDE[sp.sun] || sp.sun) : sunIt ? BZ_SIDE[sunIt.e || "l"] : undefined,
    sunText: sp.sun !== undefined ? sp.sunText || "the scenario" : "the scenario’s map",
    fixed: bzFixed(items, sp, W).concat(f("keep") || []),
    planets: sp.planets !== undefined ? sp.planets : items.filter(bzIsPlanet).length,
    hosts: f("hosts") || [], pieces: f("pieces") || [], table: sp.table, areas: sp.areas, events: sp.events,
    everyArea: sp.everyArea, everyText: sp.everyText,
    ignore: sp.ignore, ignoreText: sp.ignoreText, reroll: sp.reroll, rerollText: sp.rerollText,
    cap: sp.cap, capText: sp.capText, rolls: sp.rolls, rollsText: sp.rollsText
  };
  try { return bzSkin(Object.assign(BZ.generate(st.bz.seed, opts), { spec: sp, z, sunMap: !!sunIt && sp.sun === undefined }), sp, W, H); }
  catch (e) { console.error("terrain", sc.id, e); return null; }
}
/* the scenario's own phenomenon table with the core's piece types (TERRAIN[id].skin, 21.10.): names, symbols, colours,
   rules and drawing in the scenario's terms, e.g. Battles in the Warp's warp currents (rift: D3×10 cm long) as arrows in
   the scatter direction. The core stays the same as in the Battlezone Generator; the log uses the same names as the map. */
export function bzSkin(res, sp, W, H) {
  const sk = sp.skin;
  if (!res || !sk) return res;
  const ren = {}, cnt = {};
  for (const t of res.terrain) {
    const k = t.kind === "ring" ? null : sk[t.kind];
    if (!k) continue;
    cnt[t.kind] = (cnt[t.kind] || 0) + 1;
    const id = k.tag + cnt[t.kind];
    ren[t.id] = id; t.id = id; t.sk = k;
    if (k.arrow) {
      /* the scatter direction; if the arrow would point off the table, the direction is re-rolled (the centre stays where the
         core put it, so it does not hit other pieces); after 24 tries the core's own direction, which always fits */
      const r = BZ.makeRng(((res.meta.seed || 1) * 7919 + cnt[t.kind] * 104729) >>> 0), fits = a => {
        const hx = Math.abs(Math.cos(a)) * t.rx, hy = Math.abs(Math.sin(a)) * t.rx;
        return !W || (t.x - hx >= 0 && t.x + hx <= W && t.y - hy >= 0 && t.y + hy <= H); };
      t.dir = t.angle || 0;
      for (let i = 0; i < 24; i++) { const a = r() * 2 * Math.PI; if (fits(a)) { t.dir = a; break; } }
    }
    if (k.dims) t.dims = k.dims(t);
    if (k.noWell) t.gravity = 0;
  }
  const ev = res.meta.events;
  res.meta.custom = {};
  for (const e of ["flare", "radiation"]) if (sk[e] && ev[e]) { res.meta.custom[e] = { n: ev[e], sk: sk[e] }; ev[e] = 0; }
  const names = Object.keys(sk).map(k => [k === "flare" ? "Solar flare" : k === "radiation" ? "Radiation burst" : BZ.KIND[k] && BZ.KIND[k].name, sk[k].name]).filter(x => x[0]);
  const fix = [].concat(...Object.values(sk).map(k => k.fix || [])), drop = [].concat(...Object.values(sk).map(k => k.drop || []));
  res.log = res.log.filter(l => !drop.some(rx => rx.test(l.text))).map(l => {
    let x = l.text;
    for (const [a, b] of fix) x = x.split(a).join(b);
    for (const [a, b] of Object.entries(ren)) x = x.split("<b>" + a + "</b>").join("<b>" + b + "</b>");
    for (const [a, b] of names) x = x.split(a).join(b).split(a.toLowerCase()).join(b.toLowerCase());
    return Object.assign({}, l, { text: x });
  });
  return res;
}
export const bzCol = t => (t.sk && t.sk.col) || BZ_COL[t.kind];
/* the scenario's own rolling tool that the generator replaces (TERRAIN[id].tool): the controls are in the tool, not above the map */
export function bzToolId(sc) { const s = typeof TERRAIN !== "undefined" && TERRAIN[sc.id]; return s && s.tool; }
export function bzToolWg(sc, st, v, t) {
  const res = bzOf(sc, st, v), rows = typeof t.rows === "function" ? t.rows(v, st) : t.rows || [];
  const ps = bzPieces(res), cu = res && res.meta.custom ? Object.values(res.meta.custom) : [];
  const sum = res ? ps.length + " piece" + (ps.length === 1 ? "" : "s") + cu.map(c => " · " + c.n + " " + (c.n > 1 ? c.sk.plural : c.sk.name).toLowerCase()).join("") : "";
  return "<div class='wg'><h3>" + esc(t.l) + "</h3><div class='sub'>" + esc(t.sub || "") + "</div><div class='rollrow'>" +
    (res ? "<button class='btn primary' data-a='bzgo'>Reroll</button><button class='btn' data-a='bzclr'>Clear</button><span class='calc'>On the map: <b>" + esc(sum) + "</b></span>"
      : "<button class='btn primary' data-a='bzgo'>Generate on the map</button>") + "</div>" +
    (rows.length ? "<table class='ltab' style='margin-top:8px'>" + rows.map(r => "<tr><td>" + (r[0] === r[1] ? r[0] : r[0] + "–" + r[1]) + "</td><td>" + fmt(r[2]) + "</td></tr>").join("") + "</table>" : "") + "</div>";
}
export function bzOf(sc, st, v) { const [W, H] = tableWH(), items = bzItems(sc, v, st); return bzRun(sc, v, st, W, H, items); }
export function bzPieces(res) { return res ? res.terrain.filter(t => t.kind !== "ring") : []; }
export function bzName(t) { return t.sk ? t.sk.name : t.kind === "planet" ? (t.host ? t.name : t.size.charAt(0).toUpperCase() + t.size.slice(1) + " planet") : t.kind === "moon" ? "Moon" + (t.of ? " of " + t.of : "") : BZ.KIND[t.kind].name; }
export const BZ_PLURAL = { asteroid: "Asteroid fields", gas: "Gas & dust clouds", rift: "Warp rifts", planet: "Planets", moon: "Moons" };
export const BZ_COL = { asteroid: "var(--ast)", gas: "var(--gas)", planet: "var(--pln)", moon: "var(--moon)", rift: "var(--rift)" };

/* rolled terrain on top of the map (in cm); dashed lines set it apart from the scenario's own features */
export function bzSVG(res, W, H, sel, fs) {
  const ell = (t, a) => "<ellipse cx='0' cy='0' rx='" + t.rx + "' ry='" + t.ry + "'" + a + "/>";
  let s = "<g class='bzl' clip-path='url(#tbl)'>";
  if (!res.sunMap && res.meta.sunEdge && res.meta.sunEdge !== "none") {
    const e = res.meta.sunEdge[0];
    s += e === "l" || e === "r" ? "<rect x='" + (e === "l" ? 0 : W - 22) + "' y='0' width='22' height='" + H + "' fill='url(#sun" + e + ")'/>"
      : "<rect x='0' y='" + (e === "t" ? 0 : H - 22) + "' width='" + W + "' height='22' fill='url(#sun" + e + ")'/>";
  }
  for (const t of res.terrain) if (t.kind === "ring") {
    const r = (t.inner + t.outer) / 2, w = t.outer - t.inner;
    s += "<circle cx='" + t.x + "' cy='" + t.y + "' r='" + r + "' fill='none' stroke='" + (t.ringKind === "gas" ? "var(--gas)' stroke-opacity='.3" : "url(#hat)") + "' stroke-width='" + w + "'/>" +
      [t.inner, t.outer].map(q => "<circle cx='" + t.x + "' cy='" + t.y + "' r='" + q + "' fill='none' stroke='" + (t.ringKind === "gas" ? "var(--gas)" : "var(--ast)") + "' stroke-width='.4' stroke-dasharray='1.6 1.2'/>").join("");
  }
  for (const t of bzPieces(res)) {
    const c = bzCol(t), on = sel === t.id || sel === "k:" + t.kind, deg = ((t.sk && t.sk.arrow ? t.dir : t.angle) || 0) * 180 / Math.PI;
    s += "<g class='hit' data-a='bzsel' data-id='" + t.id + "'><g transform='translate(" + t.x + " " + t.y + ") rotate(" + deg + ")'>";
    if (t.sk && t.sk.arrow) {
      /* an arrow (e.g. a warp current): length = twice rx, direction from the scatter die (t.dir) */
      const L = t.rx;
      s += "<line x1='" + (-L) + "' y1='0' x2='" + (L - 3) + "' y2='0' stroke='" + c + "' stroke-width='1.3'/><path d='M" + L + " 0 l -5 -3 v 6 z' fill='" + c + "'/>";
    } else if (t.kind === "planet" || t.kind === "moon") {
      s += (t.gravity ? "<circle r='" + (t.rx + t.gravity) + "' fill='none' stroke='" + c + "' stroke-width='.45' stroke-dasharray='2 1.6' opacity='.75'/>" : "") +
        "<circle r='" + t.rx + "' fill='" + c + "' fill-opacity='.3' stroke='" + c + "' stroke-width='.7' stroke-dasharray='1.6 1'/>";
    } else if (t.kind === "asteroid" && !t.sk) s += ell(t, " fill='url(#hat)' stroke='" + c + "' stroke-width='.7' stroke-dasharray='1.6 1'") + ell(t, " fill='" + c + "' fill-opacity='.12'");
    else s += ell(t, " fill='" + c + "' fill-opacity='.22' stroke='" + c + "' stroke-width='.7' stroke-dasharray='2.2 1.2'");
    s += ell({ rx: t.rx + 2, ry: t.ry + 2 }, " fill='transparent' pointer-events='all'") + "</g>";
    if (on) { const e = BZ.extents(t); s += "<ellipse cx='" + t.x + "' cy='" + t.y + "' rx='" + (e.hw + 3) + "' ry='" + (e.hh + 3) + "' fill='none' stroke='var(--sun)' stroke-width='.9' stroke-dasharray='3 2'/>"; }
    s += "<text x='" + t.x + "' y='" + t.y + "' text-anchor='middle' dominant-baseline='middle' font-size='" + (fs * .78) + "' font-weight='750' fill='" + c + "' stroke='var(--chart-bg)' stroke-width='" + (fs * .22) + "' paint-order='stroke'>" + t.id + "</text></g>";
  }
  return s + "</g>";
}

/* the panel under the map: battlezone (a choice if the source leaves it open), Generate / Reroll / Clear, the pieces and rules */
export function bzWhy(sc, sp, z) {
  const src = String(sc.src || "").split(" · ")[0];
  if (sp.why) return esc(sp.why);
  if (sp.by === "src") return "As the source sets it (" + esc(src) + ").";
  if (sp.by === "obv") return "Plain from the source’s set-up (" + esc(src) + ").";
  if (sp.by === "ours") return "Our reading of the source (" + esc(src) + ").";
  return z === "roll" ? "The source leaves it open: the rulebook rolls a D6 for the battlezone, or you agree one (RB p. 105)." : "The source leaves it open: agreed here (RB p. 105).";
}
export function bzRuleHtml(r) {
  return (r.lede ? "<p class='bzlede'>" + r.lede + "</p>" : "") + r.groups.map(g => "<p class='bzgrp'>" + g.head + " <span class='bzcite'>" + esc(g.cite) + "</span></p><ul>" + (g.raw || g.items.map(i => "<li>" + i + "</li>").join("")) + "</ul>").join("");
}
export function bzRules(res, sel) {
  const m = res.meta;
  if (sel === "sun") return "<h4>The sunward edge <span class='bzcite'>RB p. 109, 114</span></h4><p class='bzpos'>" + (m.sunEdge === "none" ? "This battle has no sunward edge." : "Sunward is the " + m.sunEdge + " edge" + (m.sunDie ? " (D6 = " + m.sunDie + ")" : res.sunMap ? " (the scenario’s map)" : " (the scenario)") + ".") + "</p>" + bzRuleHtml(BZ.RULES.sunward);
  if (sel === "zone") {
    if (!m.zone) return "<h4>No battlezone</h4><p class='bzpos'>The scenario lists its own phenomena, so no battlezone generator is rolled. Fighting sunward (RB p. 114) applies only in the Flare Region, Mercurial Zone and Inner Biosphere.</p>";
    const near = m.zone.n <= 3, gen = res.spec.table;
    return "<h4>" + esc(m.zone.name) + " <span class='bzcite'>RB p. " + m.zone.page + "</span></h4><p class='bzlede'>" + esc(m.zone.blurb) + "</p>" +
      "<p class='bzgrp'>" + (gen ? "The scenario’s own table" : "What this zone can produce") + " <span class='bzcite'>" + (gen ? "the scenario" : "RB p. " + m.zone.page) + "</span></p><ul>" + (gen || m.zone).rows.map((r, i) => "<li><b>" + (i + 1) + "</b> — " + esc(r.text) + "</li>").join("") + "</ul>" +
      "<p class='bzgrp'>Fighting sunward " + (near ? "applies here" : "does not apply here") + " <span class='bzcite'>RB p. 114</span></p><ul>" +
      (near ? (m.sunEdge === "none" ? "<li>The scenario has no sunward edge, so there is nothing to fire toward.</li>" : "<li>Any firing toward the <b>" + m.sunEdge + " edge</b> doubles the range column shifts.</li><li>At <b>15 cm or under</b>, two shifts <b>left</b> instead of one — the target is silhouetted.</li><li>At <b>over 30 cm</b>, two shifts <b>right</b> instead of one — the photosphere blinds sensors.</li>")
        : "<li>In the Primary Biosphere, Outer Reaches and Deep Space the distant star has no effect on combat. The sunward edge still decides how the bands lie.</li>") + "</ul>";
  }
  if (/^k:/.test(sel)) {
    const k = sel.slice(2), all = bzPieces(res).filter(x => x.kind === k), ks = res.spec.skin && res.spec.skin[k], rule = ks ? ks.rule : BZ.RULES[k];
    if (!all.length || !rule) return "";
    return "<h4>" + all.length + " × " + esc(ks ? ks.plural : BZ_PLURAL[k]) + " <span class='bzcite'>" + (ks ? "" : "RB ") + esc(rule.page) + "</span></h4><ul class='bzwhere'>" +
      all.map(x => "<li><b>" + x.id + "</b> " + esc(x.dims) + " · centre " + Math.round(x.x) + " cm from the left, " + Math.round(x.y) + " cm from the top</li>").join("") + "</ul>" + bzRuleHtml(rule);
  }
  const t = res.terrain.find(x => x.id === sel && x.kind !== "ring");
  if (!t) return "";
  const rule = t.sk ? t.sk.rule : BZ.RULES[t.kind], rings = t.rings ? " Rings: " + t.rings.map((r, i) => (i + 1) + ") " + (r.kind === "gas" ? "gas and dust" : "asteroids") + ", " + r.wide + " cm wide, " + r.gap + " cm out").join("; ") + "." : "";
  return "<h4>" + t.id + " · " + esc(bzName(t)) + " <span class='bzcite'>" + (t.sk ? "" : "RB ") + esc(rule.page) + "</span></h4><p class='bzpos'>" + esc(t.dims) +
    (t.gravity ? ", gravity well " + t.gravity + " cm" : "") + ". Centre " + Math.round(t.x) + " cm from the left edge, " + Math.round(t.y) + " cm from the top edge" + (t.host ? " — the scenario’s planet" : "") + "." + esc(rings) + "</p>" +
    bzRuleHtml(rule) + (t.rings ? bzRuleHtml(BZ.RULES.ring) : "");
}
