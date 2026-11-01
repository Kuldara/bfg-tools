import { BZ_COL, BZ_PLURAL, bzChoices, bzCol, bzName, bzOf, bzPieces, bzRuleHtml, bzRules, bzSpec, bzToolId, bzWhy, bzZone, bzZoneLabel } from "./battlezone.js";
import { SIDECLS, esc, fmt, vis } from "./helpers.js";
import { mapSVG } from "./map-svg.js";
import { R } from "./maps.js";
import { stOf } from "./state.js";
import { tpl } from "./table.js";
import { TERR_NAME, TERR_SHORT } from "../../../packages/ui/celestial.js";

/* ---------------------------------------------------------------- terrain legend on the map (0.13)
   Owner 21.10.: "a click on terrain could bring up a clarification of what the terrain is, and its rules in short. a kind
   of popup. in all of them. closes with another click or a close X" and "the same terrain explanation for the
   scenarios' custom terrain too, in the same style". Clickable: rolled pieces (bzSVG), the scenario's own planets, moons,
   asteroid fields and rings (terrHit), and the scenario's own terrain (TERR_INFO, scenarios/terrain-info.js), whose rules
   are read from the scenario's own Play rows by title, not copied. The choice is st.bz.sel as before. The legend does
   not close by itself: X or another click on the same. The summary is here, the full text from the core's RULES table. */
export { TERR_NAME, TERR_SHORT };
export function terrHit(it) {
  if (it.ti) return { id: "m:" + it.ti.n.toLowerCase().replace(/[^a-z0-9]+/g, "-"), ti: it.ti };
  const k = it.tk || (it.z === "planet" ? (/moon/i.test(it.l || "") ? "moon" : "planet") : it.z === "hatch" ? "asteroid"
    : it.z === "ring" && it.gas ? "gas" : it.z === "ring" && it.ast ? "asteroid" : null);
  if (!k) return null;
  const [x, y] = terrXY(it, 0, 0);
  return { id: "m:" + k + ":" + Math.round(x) + ":" + Math.round(y), k };
}
export function terrXY(it, W, H) {
  if (it.cx !== undefined) return [it.cx, it.cy];
  if (it.z === "hatch" || it.z === "rect") return [it.x + it.w / 2, it.y + it.h / 2];
  if (it.z === "poly") return [it.pts.reduce((a, q) => a + q[0], 0) / it.pts.length, it.pts.reduce((a, q) => a + q[1], 0) / it.pts.length];
  if (it.z === "line" || it.z === "arrow") return [(it.x1 + it.x2) / 2, (it.y1 + it.y2) / 2];
  if (it.z === "edge") return [it.e === "l" ? 0 : it.e === "r" ? W : W / 2, it.e === "t" ? 0 : it.e === "b" ? H : H / 2];
  return [it.x || 0, it.y || 0];
}
/* the scenario's own Play rows by title (this version's rows only) */
export function terrLines(sc, st, v, ws) {
  if (!sc || !ws) return [];
  return sc.play.filter(x => vis(x, v) && ws.includes(x.w)).map(x => "<li>" + (x.s ? "<span class='" + SIDECLS[x.s] + "'>" + esc(sc.sides[x.s].n) + "</span> · " : "") +
    "<b>" + esc(x.w) + ":</b> " + fmt(tpl(x.t, sc, st)) + "</li>");
}
export function terrPop(m) {
  const sel = m.sel;
  if (!sel || sel === "zone" || sel === "sun" || /^k:/.test(sel)) return "";
  const sc = m.sc, st = sc ? stOf(sc) : {}, v = m.v, sub = [];
  let x, y, title, cite = "", own = [], k = null, lede = "", more = "", col = null;
  if (/^m:/.test(sel)) {
    const it = m.items.find(i => { const h = terrHit(i); return h && h.id === sel; });
    if (!it) return "";
    [x, y] = terrXY(it, m.w, m.h);
    if (it.ti) {
      title = it.ti.n; k = (typeof it.ti.k === "function" ? it.ti.k(v) : it.ti.k) || null;
      own = terrLines(sc, st, v, it.ti.w).concat((it.ti.t || []).map(l => "<li>" + fmt(tpl(l, sc, st)) + "</li>"));
    } else {
      k = terrHit(it).k;
      const l = String(it.l || "").replace(/\s+/g, " ").trim(), nm = TERR_NAME[k];
      title = it.z === "ring" ? (k === "gas" ? "Gas & dust" : "Asteroid") + " ring" : !l ? nm : new RegExp(k === "gas" ? "gas|dust" : k, "i").test(l) ? l.charAt(0).toUpperCase() + l.slice(1) : l + " · " + nm;
      if (it.z === "ring") sub.push("A ring around the planet works as its material does (RB p. 113).");
      const sz = k === "planet" && /\b(small|medium|large)\b/i.exec(l);
      if (sz) { const z = sz[1].toLowerCase(); sub.push(z.charAt(0).toUpperCase() + z.slice(1) + " planet: gravity well " + { small: 10, medium: 15, large: 30 }[z] + " cm from its edge."); }
    }
  } else {
    const t = m.bz && bzPieces(m.bz).find(p => p.id === sel);
    if (!t) return "";
    x = t.x; y = t.y; title = t.id + " · " + bzName(t); col = bzCol(t);
    sub.push(esc(t.dims) + (t.gravity ? ", gravity well " + t.gravity + " cm" : "") + ". Centre " + Math.round(t.x) + " cm from the left edge, " + Math.round(t.y) + " cm from the top" + (t.host ? " — the scenario’s planet" : "") + ".");
    if (t.rings) { sub.push("Rings: " + t.rings.map((r, i) => (i + 1) + ") " + (r.kind === "gas" ? "gas and dust" : "asteroids") + ", " + r.wide + " cm wide, " + r.gap + " cm out").join("; ") + "."); more = bzRuleHtml(BZ.RULES.ring); }
    if (t.sk) {
      const r = t.sk.rule, base = BZ.RULES[t.kind];
      if (base && r.groups === base.groups) { k = t.kind; lede = r.lede || ""; }
      else { own = [].concat(...r.groups.map(g => g.items)).map(i => "<li>" + i + "</li>"); cite = r.page; }
    } else k = t.kind;
    const gi = sc && typeof TERR_INFO !== "undefined" && TERR_INFO[sc.id] && TERR_INFO[sc.id].find(e => e.g === t.kind);
    if (gi) { title = t.id + " · " + gi.n; own = own.concat(terrLines(sc, st, v, gi.w)); }
  }
  /* in low orbit scenarios the planet's legend says where the low orbit table is */
  if (m.lo && k === "planet") own.push("<li>A ship in its gravity well may enter low orbit: the low orbit table is drawn under the map (RB p. 116).</li>");
  const R = k && BZ.RULES[k];
  col = col || (k && BZ_COL[k]) || "var(--sun)";
  let h = "<div class='tpop " + (x / m.w < .5 ? "r" : "l") + "' style='border-color:" + col + "' role='dialog' aria-label='" + esc(title) + "'><button class='tpx' data-a='bzsel' data-id='" + esc(sel) + "' aria-label='Close'>×</button>" +
    "<h4>" + esc(title) + (cite ? " <span class='bzcite'>" + esc(cite) + "</span>" : R && !own.length ? " <span class='bzcite'>RB " + esc(R.page) + "</span>" : "") + "</h4>" + sub.map(p => "<p class='tpsub'>" + p + "</p>").join("");
  if (own.length) h += (R ? "<p class='tpgrp'>In this scenario</p>" : "") + "<ul>" + own.join("") + "</ul>";
  if (R) {
    if (own.length) h += "<p class='tpgrp'>" + esc(R.title) + " rules <span class='bzcite'>RB " + esc(R.page) + "</span></p>";
    h += (lede ? "<p class='bzlede'>" + esc(lede) + "</p>" : "") + "<ul>" + TERR_SHORT[k].map(i => "<li>" + i + "</li>").join("") + "</ul>" +
      "<details data-k='bzfull'" + (st.bz && st.bz.full ? " open" : "") + "><summary>Full rules</summary>" + bzRuleHtml(R) + more + "</details>";
  }
  return h + "</div>";
}
export function mapFig(m) { return "<div class='mapfig'>" + mapSVG(m) + terrPop(m) + "</div>"; }
/* UX review 22.10.: nothing said the terrain was clickable. A fixed line in the legend, not a pop-up hint. */
export function terrHint(m) {
  const any = m.items.some(i => terrHit(i)) || (m.bz && bzPieces(m.bz).length > 0);
  return any ? "<span class='thint'>" + (window.matchMedia && matchMedia("(hover: hover)").matches ? "Click" : "Tap") + " a feature for its rules</span>" : "";
}
/* the control row above the map (like the table size): battlezone, Generate / Reroll / Clear */
export function bzCtl(sc, st, v, m) {
  const sp = bzSpec(sc, v), res = m.bz, b = st.bz || {}, ch = bzChoices(sp, st), z = bzZone(sp, st), pk = sp.pick;
  const zc = (ch.length > 1 ? "<select data-a='bzz' aria-label='Battlezone'>" + ch.map(c => "<option value='" + c + "'" + (String(c) === String(z) ? " selected" : "") + ">" + esc(bzZoneLabel(c)) + "</option>").join("") + "</select>"
    : "<b>" + esc(bzZoneLabel(z)) + "</b>") +
    (pk ? "<select data-a='bzp' aria-label='" + esc(pk.label) + "'>" + pk.opts.map(([k, l]) => "<option value='" + k + "'" + ((b.p || pk.def) === k ? " selected" : "") + ">" + esc(l) + "</option>").join("") + "</select>" : "");
  if (bzToolId(sc)) return ""; /* the scenario's own rolling tool is the generator: its buttons are there (21.10.) */
  /* before rolling only the button (owner 21.10.: "only if that button is pressed. many don't even want to roll it") */
  if (!res) return "<div class='bzhead bzoff'><button class='btn' data-a='bzgo'>Generate terrain</button><span class='bzhint'>Optional: rolls the celestial phenomena onto this map.</span></div>";
  return "<div class='bzhead'><span class='bzt'>Celestial phenomena</span><span class='bzbtn'>" +
    (res ? "<button class='btn primary' data-a='bzgo'>Reroll</button><button class='btn' data-a='bzclr'>Clear</button>" : "<button class='btn primary' data-a='bzgo'>Generate terrain</button>") + "</span>" +
    "<span class='bzzc'>" + zc + "</span><span class='bzmini'>" + bzPieces(res).length + " piece" + (bzPieces(res).length === 1 ? "" : "s") +
    (res.meta.sunEdge && res.meta.sunEdge !== "none" ? " · sunward: " + res.meta.sunEdge : "") + "</span></div>";
}
/* the details under the map: grounds, note, summary, pieces, rules and the roll log */
export function bzBox(sc, st, v, m) {
  const sp = bzSpec(sc, v), res = m.bz, b = st.bz || {}, z = bzZone(sp, st);
  let h = "<div class='bzbox'><p class='bzwhy'><b>Battlezone.</b> " + bzWhy(sc, sp, z) + "</p>" + (sp.warn ? "<p class='bzwarn'>" + fmt(sp.warn) + "</p>" : "");
  if (!res) return "";
  const me = res.meta, ps = bzPieces(res), ev = me.events, n = ps.length;
  const zs = me.zone ? me.zone.name + (me.zoneDie ? " (D" + (z && z.die === 3 ? 3 : 6) + " = " + me.zoneDie + ")" : "") : "No battlezone";
  const ss = me.sunEdge === "none" ? "no sunward edge" : "sunward: " + me.sunEdge + (me.sunDie ? " (D6 = " + me.sunDie + ")" : "");
  h += "<p class='bzsum'><b>" + esc(zs) + "</b> · " + esc(ss) + " · " + n + " piece" + (n === 1 ? "" : "s") +
    (ev.flare ? " · " + ev.flare + " solar flare" + (ev.flare > 1 ? "s" : "") : "") + (ev.radiation ? " · " + ev.radiation + " radiation burst" + (ev.radiation > 1 ? "s" : "") : "") +
    Object.values(me.custom || {}).map(c => " · " + c.n + " " + (c.n > 1 ? c.sk.plural : c.sk.name).toLowerCase()).join("") + " <span class='bzseed'>seed " + me.seed + "</span></p>";
  if (sp.note) h += "<p class='bzwhy'>" + esc(sp.note) + "</p>";
  const chip = (id, label, k, sub) => "<button class='bzpc' data-a='bzsel' data-id='" + id + "' aria-pressed='" + (b.sel === id) + "'>" + (k ? "<i style='background:" + (BZ_COL[k] || k) + "'></i>" : "") + "<span>" + esc(label) + "</span>" + (sub ? "<small>" + esc(sub) + "</small>" : "") + "</button>";
  h += "<div class='bzchips'>" + chip("zone", me.zone ? me.zone.name : "Battlezone", null, "rules") + chip("sun", "Sunward edge", null, me.sunEdge === "none" ? "none" : me.sunEdge) +
    (n > 10 ? ps.filter(t => t.kind === "planet" || t.kind === "moon").map(t => chip(t.id, t.id + " " + bzName(t), bzCol(t), t.dia + " cm")).concat(
      ["asteroid", "gas", "rift"].map(k => { const c = ps.filter(t => t.kind === k).length, ks = sp.skin && sp.skin[k]; return c ? chip("k:" + k, ks ? ks.plural : BZ_PLURAL[k], ks && ks.col || k, "× " + c) : ""; }))
      : ps.map(t => chip(t.id, t.id + " " + bzName(t), bzCol(t), (t.kind === "planet" || t.kind === "moon") && !t.sk ? t.dia + " cm" : t.dims.replace(" cm", "")))).join("") + "</div>";
  for (const c of Object.values(me.custom || {})) if (c.sk.turn) h += "<p class='bzwhy'><b>" + esc(c.n > 1 ? c.n + " " + c.sk.plural.toLowerCase() : c.sk.name) + ":</b> " + esc(c.sk.turn) + "</p>";
  if (!n && !ev.flare && !ev.radiation && !Object.keys(me.custom || {}).length) h += "<p class='bzwhy'>Nothing rolled onto the table: every roll came up empty. Legal, and rarer than it feels.</p>";
  if (ev.flare || ev.radiation) h += "<p class='bzwhy'><b>Start of every turn:</b> " + [ev.flare ? "roll " + ev.flare + "D6 for the solar flare (a 6 sets it off, once per game)" : "", ev.radiation ? "roll " + ev.radiation + "D6 for radiation bursts (a 5 or 6, at most one a turn)" : ""].filter(Boolean).join("; ") + " — RB p. 115. The dice are on the Play tab.</p>";
  if (b.sel && (b.sel === "zone" || b.sel === "sun" || /^k:/.test(b.sel))) { const r = bzRules(res, b.sel); if (r) h += "<div class='bzrules'>" + r + "</div>"; }
  h += "<details class='bzlog' data-k='bzlog'" + (b.log ? " open" : "") + "><summary>Every die rolled</summary><div class='bzlines'>" + res.log.map(l => "<div class='" + l.cls + "'>" + l.text + "</div>").join("") + "</div></details>";
  return h + "</div>";
}

/* Play: reminders (fighting sunward, start-of-turn rolls) and dice for solar flares and radiation bursts */
export function bzPlay(sc, st) {
  const res = bzOf(sc, st, st.v);
  if (!res) return [];
  const m = res.meta, out = [];
  if (m.zone && m.zone.n <= 3 && m.sunEdge !== "none") out.push({ w: "All game · fighting sunward (" + m.zone.name + ")", t: "Firing toward the " + m.sunEdge + " edge doubles the range column shifts: at 15 cm or under two shifts left, over 30 cm two shifts right (RB p. 114)." });
  if (m.events.flare) out.push({ w: "Start of every turn · solar flare", t: "Roll " + m.events.flare + "D6: on any 6 the flare goes off, once per game (RB p. 115). The dice are under Tools." });
  if (m.events.radiation) out.push({ w: "Start of every turn · radiation burst", t: "Roll " + m.events.radiation + "D6: each 5 or 6 sets one off, at most one a turn (RB p. 115). The dice are under Tools." });
  return out;
}
export function bzEvTool(sc, st) {
  const res = bzOf(sc, st, st.v);
  if (!res || !(res.meta.events.flare || res.meta.events.radiation)) return "";
  const ev = (st.bz && st.bz.ev) || {}, T = st.turn, now = ev[T] || {};
  const spentAt = Object.keys(ev).map(Number).filter(t => ev[t].flare && ev[t].flare.hit).sort((a, b) => a - b)[0];
  let h = "<div class='wg'><h3>Celestial phenomena, turn " + T + "</h3><div class='sub'>From the rolled terrain (Set-up). Roll at the start of the turn.</div>";
  for (const k of ["flare", "radiation"]) {
    const n = res.meta.events[k];
    if (!n) continue;
    const R = BZ.EVENT_RULES[k], r = now[k], spent = k === "flare" && spentAt !== undefined && spentAt < T;
    h += "<div class='bzev'><div class='rollrow'><b>" + R.name + " × " + n + "</b> <span class='bzcite'>RB " + R.page + "</span>" +
      "<button class='btn" + (r || spent ? "" : " primary") + "' data-a='bzev' data-k='" + k + "'" + (spent || r ? " disabled" : "") + ">" + (r ? "Rolled for turn " + T : spent ? "Already happened" : "Roll " + n + "D6") + "</button></div>";
    if (spent) h += "<p class='calc'>The flare went off on turn " + spentAt + ". It happens only once a game: stop rolling.</p>";
    else if (r) {
      h += "<p class='calc'>Rolled " + r.dice.join(", ") + " → " + (r.hit ? "<b>" + R.name + "!</b>" + (k === "radiation" ? " Interference level D6 = <b>" + r.lvl + "</b>: every ship is at −" + r.lvl + " Leadership for the rest of this turn." : "") : "nothing this turn.") + "</p>";
      if (r.hit) h += "<ul class='plain small'>" + R.effects.map(x => "<li>" + x + "</li>").join("") + "</ul>";
    } else h += "<p class='calc'>" + R.how + "</p>";
    h += "</div>";
  }
  return h + "</div>";
}
