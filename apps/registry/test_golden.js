/* Golden cases: the same case is run against ALL SURFACES.
 *
 * The other tests read the same data and the same implementation that they
 * test. They find breakage but not misunderstanding. These cases are read
 * from the book (reference/golden_cases.json, each with a page number), and
 * each one is run against the surfaces:
 *
 *   price          unitPts
 *   resolver       effHits / effShieldsText / effTurrets / armModel / ...
 *   card           cardHTML  (the printable card)
 *   fleet view     renderFleet  (what the user sees while building)
 *   save           save -> load -> the same price and profile
 *
 * Compared fields: price, hits, shields, turrets, speed, turns,
 * armour, active weapons, the damage model (crippled row) and the ship's
 * special rules. Disagreement between surfaces is its own finding class
 * ("SURFACES"), whether or not the book's expectation is met.
 *
 * The unit is created with addUnit(), not by hand. This way required upgrades
 * (applyRequired: AdMech's +1 turret, Chaos marks) and the open-price
 * default (custom = the profile's base price) land as in the app. A
 * hand-built unit would have skipped them and tested a state the app
 * never produces.
 *
 * A case with status "gap" is known to be missing: it is written
 * BEFORE the fix and stays red until the work is done. A gap does not fail
 * acceptance, but it is reported - and if a gap passes, that is
 * reported too, so the status gets updated.
 *
 * Run:  node test_golden.js         summary
 *       node test_golden.js -v      every case row by row
 *       node test_golden.js --json  machine-readable (tools/test.js uses it)
 */
"use strict";
const fs = require("fs"), path = require("path");

/* --- DOM stub. Elements persist per selector so that the innerHTML
   written by renderFleet() can be read back. -------- */
const mkEl = () => ({
  appendChild(){}, removeChild(){}, addEventListener(){}, setAttribute(){},
  getAttribute: () => null, removeAttribute(){}, focus(){}, remove(){},
  classList: { add(){}, remove(){}, toggle(){}, contains: () => false },
  querySelectorAll: () => [], querySelector: () => null,
  insertAdjacentHTML(){}, innerHTML: "", textContent: "", value: "",
  style: {}, id: "", dataset: {}, checked: false, disabled: false,
  onclick: null, onchange: null, oninput: null, children: [],
});
const els = {};
const el = key => (els[key] || (els[key] = mkEl()));
const DATA = fs.readFileSync(path.join(__dirname, "..", "..", "data", "bfg_data.json"), "utf8");

global.document = {
  getElementById: id => (id === "bfgdata" ? { textContent: DATA } : el("#" + id)),
  querySelector: s => el(s),
  querySelectorAll: () => [],
  createElement: () => mkEl(),
  addEventListener(){},
  head: { appendChild(){} },
  body: { appendChild(){}, removeChild(){}, dataset: {}, classList: { add(){}, remove(){} } },
};
global.window = { addEventListener(){}, print(){},
                  matchMedia: () => ({ matches: false, addEventListener(){} }) };
/* navigator is read-only in Node; the other tests get away with it only
   because they are not in strict mode and the assignment fails silently. */
if (!global.navigator)
  Object.defineProperty(global, "navigator", { value: {}, configurable: true });
global.alert = () => {}; global.confirm = () => true;
let STORE = {};
global.localStorage = {
  getItem: k => (k in STORE ? STORE[k] : null),
  setItem: (k, v) => { STORE[k] = String(v); },
  removeItem: k => { delete STORE[k]; },
};

/* The app's modules, loaded under the stubs above (test-support.js). */
const api = require(require("path").join(__dirname, "./test-support.js")).loadApp();

const CASES = JSON.parse(
  fs.readFileSync(path.join(__dirname, "..", "..", "reference", "golden_cases.json"), "utf8"));
const FCASES = JSON.parse(
  fs.readFileSync(path.join(__dirname, "..", "..", "reference", "golden_fleet_cases.json"), "utf8"));

const args = process.argv.slice(2);
const VERBOSE = args.includes("-v");
const AS_JSON = args.includes("--json");

/* ------------------------------------------------------------------ apu */
const norm = t => String(t == null ? "" : t)
  .replace(/[  ]/g, " ").replace(/[–—−]/g, "-")
  .replace(/\s+/g, " ").trim();
const unesc = h => String(h).replace(/&nbsp;/g, " ").replace(/&amp;/g, "&")
  .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"')
  .replace(/&#39;/g, "'").replace(/&ndash;/g, "-");

/* The fields resolveUnit v0 and v1 share, normalised: booleans as booleans,
   absent as null, rule refs by id. New v1 fields (kind, options, upgrades,
   issues, damage.critical) are tested on their own against the book. */
function commonProjection(R) {
  if (!R) return null;
  return {
    ref: R.ref, name: R.name, hulls: R.hulls, points: R.points, maxPoints: R.maxPoints,
    stats: R.stats,
    weapons: R.weapons.map(w => ({ a: w.a, i: w.i, box: w.box == null ? null : w.box, alt: !!w.alt,
      grp: !!w.grp, extra: !!w.extra, count: w.count == null ? 1 : w.count,
      opt: w.opt == null ? null : w.opt, writeIn: !!w.writeIn })),
    damage: { crippledAt: R.damage.crippledAt, crippled: R.damage.crippled,
              note: R.damage.note, critTable: R.damage.critTable },
    rules: R.rules.map(x => ({ t: x.t, refs: (x.refs || []).map(y => y.id), ast: !!x.ast,
                               canonical: !!x.canonical, hull: x.hull || null })),
    hull: R.hull,
  };
}

function listIndex(name) {
  return api.LISTS.findIndex(L => L.nm === name);
}

/* List slot: a named list, and the row in it that points to the profile page. */
function placeByLabel(li, label) {
  const L = api.LISTS[li];
  if (!L) return null;
  const re = new RegExp(label, "i");
  for (let si = 0; si < L.secs.length; si++)
    for (let ei = 0; ei < L.secs[si].ents.length; ei++) {
      const en = L.secs[si].ents[ei];
      if (en.k !== "up" && re.test(String(en.l))) return { si, ei };
    }
  return null;
}

function placeOn(li, page) {
  const L = api.LISTS[li];
  if (!L) return null;
  let fallback = null;
  for (let si = 0; si < L.secs.length; si++)
    for (let ei = 0; ei < L.secs[si].ents.length; ei++) {
      const en = L.secs[si].ents[ei];
      if (String(en.r) !== String(page)) continue;
      if (en.k === "unit") return { si, ei };
      if (!fallback) fallback = { si, ei };
    }
  return fallback;
}

/* The unit is created as in the app: addUnit() runs applyRequired() and
   sets the open-price default. A borrowed ship (Fleets p.14): "from" is
   the source list and "role" reserve/ally - the unit is bought from the source
   list into the fleet's (list) service as in the fleet cases (J206). */
function freshUnit(c) {
  const S = api.getS();
  const li = listIndex(c.list);
  if (li < 0) return { err: "list not found: " + c.list };
  const li2 = c.from ? listIndex(c.from) : li;
  if (li2 < 0) return { err: "source list not found: " + c.from };
  const at = c.entry ? placeByLabel(li2, c.entry) : placeOn(li2, c.ship);
  if (!at) return { err: (c.entry ? "row " + c.entry : "ship p." + c.ship) + " is not on list " + (c.from || c.list) };
  S.li = li; S.limit = 999999; S.units = [];
  if (c.from) api.addUnitFrom(li2, at.si, at.ei, c.role || "reserve");
  else api.addUnit(at.si, at.ei);
  const u = S.units[0];
  return u ? { u } : { err: "addUnit produced no unit" };
}

function optIndex(sh, pattern) {
  const re = new RegExp(pattern, "i");
  return (sh.ol || []).findIndex(o => re.test(o.t));
}

/* Active armament: a row without a tick box is always included; a row
   with a box (tied to an option) is included only in the "on" state. */
function activeRows(u, sh) {
  return api.armModel(u, sh).filter(r => r.box == null || r.box === "on");
}

/* --- pinnat ------------------------------------------------------------ */
/* The resolver is the interface the surfaces read (packages/rules/CONTRACT.md).
   The driver reads the same, so it tests the contract and not single helpers. */
function fromResolver(u, sh) {
  const R = api.resolveUnit(u);
  if (!R || !R.stats) return { hits: null, shields: null, turrets: null, speed: null,
                   turns: null, armour: null, weapons: [], damage: "", rules: [],
                   points: R ? R.points : null, leadership: R ? JSON.stringify(R.leadership) : null,
                   rerolls: R && R.rerolls ? R.rerolls.total : null };
  return {
    hits: R.stats.hits,
    shields: norm(R.stats.shields),
    turrets: norm(R.stats.turrets),
    speed: norm(R.stats.speed), turns: norm(R.stats.turns), armour: norm(R.stats.armour),
    weapons: R.weapons.filter(r => r.box == null || r.box === "on").map(r => norm(r.a[0])),
    damage: norm(R.damage.note),
    /* brief (space hulks, user 9.10.2026): the card prints the hull's own
       rules and leaves out those of its standard weapons (rules[].weapon) */
    rules: R.rules.filter(r => !(R.brief && r.weapon)).map(r => norm(r.t.replace(/^\*\s*/, ""))),
  };
}

/* A unit's cards as one HTML. A star fort (Ramilies p.500, Fortress-
   Monastery p.110) prints as TWO cards on the same page: the plan card,
   which has the per-quadrant hit tracks (Fleets p.501: "its weapons, hits
   and defences are divided up into four quadrants"), and the rule card, which
   has the stats, armament table and the rest of the rules. The claims "every rule,
   damage model and weapon is on the card" and the hit count (the largest box number, 12
   on four tracks) therefore concern the PAIR - a single card does not carry
   everything, and need not. For other units the pair is one card. */
function cardsHTML(u) {
  if (api.unitCards) return api.unitCards(u).map(c => c.html(0)).join("\n");
  return api.cardHTML(u, 0);
}
/* card_count: occurrences of a literal string in the card's (pair's) HTML. */
function countChecks(e, html, r) {
  (e.card_count || []).forEach(x => {
    const n = html.split(x.match).length - 1;
    if (n !== x.n) r.profile.push("on the card '" + x.match + "' x" + n + " != " + x.n);
  });
}
/* view_* and roster_*: the fleet view and the roster say (or do not say)
   something. Used for type words and squadron wording: the player is not shown
   internal words ("fleet option"), nor a squadron rule for a unit the
   book gives none. A contains check reads the text, a lacks check
   also the raw HTML (placeholders and title attributes). */
function surfaceWordChecks(e, viewHtml, rostHtml, r) {
  const text = h => norm(unesc(String(h || "").replace(/<[^>]+>/g, " ")));
  const vt = text(viewHtml), rt = text(rostHtml);
  (e.view_contains || []).forEach(s => { if (!vt.includes(norm(s)) && !String(viewHtml).includes(s)) r.profile.push("missing from the fleet view: " + s); });
  (e.view_lacks || []).forEach(s => { if (vt.includes(norm(s)) || String(viewHtml).includes(s)) r.profile.push("too much in the fleet view: " + s); });
  (e.roster_contains || []).forEach(s => { if (!rt.includes(norm(s)) && !String(rostHtml).includes(s)) r.profile.push("missing from the roster: " + s); });
  (e.roster_lacks || []).forEach(s => { if (rt.includes(norm(s)) || String(rostHtml).includes(s)) r.profile.push("too much in the roster: " + s); });
}

function cardOf(u, sh) {
  const h = cardsHTML(u);
  /* Hits are read ONLY from the damage band, not from every <i> number. */
  const bands = h.match(/<div class="k-hits[^"]*">[\s\S]*?<\/div>/g) || [];
  const boxes = bands.flatMap(b => [...b.matchAll(/<i>(\d+)<\/i>/g)].map(m => +m[1]));
  const stat = lab => {
    const re = new RegExp("<span>" + lab + "</span><div class=\"v\"><b>([^<]*)</b>", "i");
    const m = h.match(re);
    return m ? norm(unesc(m[1])) : null;
  };
  const text = norm(unesc(h.replace(/<[^>]+>/g, " ")));
  return {
    html: h, text,
    hits: boxes.length ? Math.max(...boxes) : null,
    shields: stat("SHIELDS"), turrets: stat(norm(sh.tl || "TURRETS")),
    speed: stat("SPEED"), turns: stat("TURNS"), armour: stat("ARMOUR"),
  };
}

function fleetViewOf(sh) {
  api.renderFleet();
  const h = el("#fleet").innerHTML || "";
  const pick = lab => {
    const m = h.match(new RegExp("<b>" + lab + "</b>\\s*([^<]*)"));
    return m ? norm(unesc(m[1])) : null;
  };
  /* the turret column's name comes from the resolver: Turrets or Spores */
  const tl = api.title(sh.tl || "TURRETS");
  return { html: h, hits: pick("Hits"), shields: pick("Shields"),
           turrets: pick(tl), speed: pick("Speed"),
           turns: pick("Turns"), armour: pick("Armour") };
}

/* Roster: printRoster() writes into #sheet; the Hits column is the fourth
   cell of a row (name, class, type, hits, points). */
function rosterOf() {
  el("#sheet").innerHTML = "";
  api.printRoster();
  const h = el("#sheet").innerHTML || "";
  const m = h.match(/<td class="n">([^<]*)<\/td>\s*<td class="n">([^<]*)<\/td>/);
  return { html: h, hits: m ? norm(unesc(m[1])) : null,
           points: m ? norm(unesc(m[2])) : null };
}

function saveRoundTrip(u, sh) {
  STORE = {};
  api.save();
  const before = { pts: api.unitPts(u), ...fromResolver(u, sh) };
  api.load();
  const S = api.getS();
  const v = S.units && S.units[0];
  if (!v) return { ok: false, why: "loading returned no unit" };
  const after = { pts: api.unitPts(v), ...fromResolver(v, sh) };
  const same = JSON.stringify(before) === JSON.stringify(after);
  return { ok: same, why: same ? "" : JSON.stringify(before).slice(0, 80)
                                       + " != " + JSON.stringify(after).slice(0, 80) };
}

/* --- commander or list option: a row without a hull (P1-8e) ------------------ */
function runEntryCase(c, r) {
  const got = freshUnit(c);
  if (got.err) { r.profile.push(got.err); return r; }
  const u = got.u;
  for (const sel of (c.select || [])) {
    if (!sel.upgrade) { r.profile.push("a commander takes only upgrade selections: " + JSON.stringify(sel)); return r; }
    const ups = api.upgradesFor(u);
    const row = ups.own.concat(ups.other).find(x => new RegExp(sel.upgrade, "i").test(String(x[2].l)));
    if (!row) { r.profile.push("upgrade not offered: " + sel.upgrade); return r; }
    api.setUpState(u, row[0], row[1], sel.state || "take");
  }
  if (c.name != null) u.name = c.name;
  if (c.note != null) u.note = c.note;
  if (c.adjust != null) u.adj = c.adjust;
  /* The number of items bought: a hull-less defence row (Orbital mine
     p.512, Minefield p.513) buys N items on one row. run()
     already honoured c.n; here it was skipped, so "4 mines = 20 pts"
     could not be tested. */
  if (c.n != null) u.n = c.n;
  const e = c.expect || {};
  const R = api.resolveUnit(u);
  if (!R) { r.profile.push("resolveUnit returned null"); return r; }
  if (R.kind !== "commander" && R.kind !== "entry") r.profile.push("kind: " + R.kind);
  { const errs = (R.issues || []).filter(x => x.severity === "error").map(x => x.code);
    if (errs.length) r.profile.push("unexpected error: " + errs.join(",")); }
  const pts = api.unitPts(u);
  if (e.points != null) r.points = pts === e.points ? null : (pts + " != " + e.points);
  if (e.leadership !== undefined) {
    const got = R.leadership ? R.leadership.kind + " " + R.leadership.value + (R.leadership.max != null ? " max " + R.leadership.max : "") : "null";
    const want = e.leadership ? e.leadership.kind + " " + e.leadership.value + (e.leadership.max != null ? " max " + e.leadership.max : "") : "null";
    if (got !== want) r.profile.push("leadership: " + got + " != " + want);
  }
  if (e.rerolls_total != null && (!R.rerolls || R.rerolls.total !== e.rerolls_total))
    r.profile.push("re-rollit: " + (R.rerolls ? R.rerolls.total : "-") + " != " + e.rerolls_total);
  (e.upgrades || []).forEach(x => {
    const up = (R.upgrades || []).find(o => new RegExp(x.match, "i").test(o.label));
    if (!up) { r.profile.push("upgrades[]: no upgrade " + x.match); return; }
    if (x.state && up.state !== x.state) r.profile.push("upgrades[] " + x.match + ": state " + up.state);
    if (x.cost != null && up.cost !== x.cost) r.profile.push("upgrades[] " + x.match + ": cost " + up.cost + " != " + x.cost);
  });
  /* surfaces: card, fleet view, roster, Copy list all say the same points */
  const card = api.cardHTML(u, 0), cardText = norm(unesc(card.replace(/<[^>]+>/g, " ")));
  api.renderFleet(); const view = norm(unesc((el("#fleet").innerHTML || "").replace(/<[^>]+>/g, " ")));
  const rost = rosterOf(); const copy = norm(api.listText());
  if (R.kind === "commander" && !card) r.surfaces.push("commander card missing");
  if (!view.includes(pts + " pts")) r.surfaces.push("the fleet view does not show " + pts + " pts");
  if (rost.points !== String(pts)) r.surfaces.push("roster: " + rost.points + " != " + pts);
  if (!copy.includes(" " + pts + " pts")) r.surfaces.push("Copy list does not show " + pts + " pts");
  (R.upgrades || []).filter(o => o.state === "take").forEach(o => {
    if (card && !cardText.toLowerCase().includes(norm(o.label).toLowerCase())) r.surfaces.push("upgrade missing from the card: " + o.label);
    if (!copy.toLowerCase().includes(norm(o.label).toLowerCase())) r.surfaces.push("upgrade missing from Copy list: " + o.label);
  });
  (e.card_contains || []).forEach(s => { if (!card.includes(s) && !cardText.includes(norm(s))) r.profile.push("missing from the card: " + s); });
  (e.card_lacks || []).forEach(s => { if (card.includes(s) || cardText.includes(norm(s))) r.profile.push("too much on the card: " + s); });
  (e.list_contains || []).forEach(s => { if (!copy.includes(norm(s))) r.profile.push("missing from the Copy list text: " + s); });
  countChecks(e, card, r);
  surfaceWordChecks(e, el("#fleet").innerHTML || "", rost.html, r);
  /* A rule card (R.card "rule") is a card just like a ship's: an empty
     card from a row that should have one is a finding. */
  if (R.card === "rule" && !card) r.surfaces.push("rule card missing");
  const rt = saveRoundTrip(u, null);
  if (!rt.ok) r.surfaces.push("tallennuskierros: " + rt.why);
  return r;
}

/* --- running one case ---------------------------------------------- */
function run(c) {
  const r = { id: c.id, page: c.page, status: c.status || "expect_pass",
              task: c.task || null, points: null, profile: [], surfaces: [],
              notes: [] };
  let sh = c.entry ? null : api.SHIPS[String(c.ship)];
  if (!c.entry && !sh) { r.profile.push("profile " + c.ship + " does not exist"); return r; }
  if (!c.list) { r.profile.push("the case has no 'list'"); return r; }
  if (c.entry) return runEntryCase(c, r);

  let u = null;
  if (c.list === "-") {
    /* A ship that is not bought from any list (the Waystation p.481 is a
       Tau defence). Only the profile checks; the surfaces are skipped. */
    const S = api.getS(); S.li = 0; S.limit = 999999; S.units = [];
    u = { s: -1, e: -1, ref: isNaN(+c.ship) ? c.ship : +c.ship, n: 1,
          opts: [], os: {}, oq: {}, ups: {}, name: "", _noList: true };
    r.notes.push("no list row: only the profile checked");
  } else {
    const got = freshUnit(c);
    if (got.err) { r.profile.push(got.err); return r; }
    u = got.u;
  }

  /* Selections in order. state: take (default) | opt | off - the latter
     exist so that a case can prove that an added row also
     DISAPPEARS when the selection is undone. Additive effects leak exactly
     there. */
  for (const sel of (c.select || [])) {
    /* hull: choice of base hull (Venerable battle barge, Fleets p.102).
       The same function as in the user interface, so the options reset the same way. */
    if (sel.hull) {
      if (!api.SHIPS[String(sel.hull)]) { r.profile.push("no such hull: " + sel.hull); return r; }
      api.setHull(u, sel.hull);
      sh = api.shipOf(u);   /* the following options belong to the new hull - the Venerable view (p.102) */
      continue;
    }
    /* upgrade: a list upgrade by name regex, from the offered rows (P1-8d) */
    if (sel.upgrade) {
      const ups = api.upgradesFor(u);
      const row = ups.own.concat(ups.other).find(x => new RegExp(sel.upgrade, "i").test(String(x[2].l)));
      if (!row) { r.profile.push("upgrade not offered: " + sel.upgrade); return r; }
      api.setUpState(u, row[0], row[1], sel.state || "take");
      continue;
    }
    const i = optIndex(sh, sel.option);
    if (i < 0) { r.profile.push("option not found: " + sel.option); return r; }
    /* raw: the state is written directly without a transition - this builds
       an invalid state that the resolver must report (P1-8e). */
    if (sel.raw) { u.os = u.os || {}; u.os[i] = sel.state || "take"; continue; }
    api.setOptState(u, i, sel.state || "take");
    if (sel.qty) { u.oq = u.oq || {}; u.oq[i] = sel.qty; }
  }
  /* Rich fixture (P1-8d): the player's own fields, as typed in the builder. */
  if (c.name != null) u.name = c.name;
  if (c.note != null) u.note = c.note;
  if (c.adjust != null) u.adj = c.adjust;
  if (c.members != null) u.members = c.members;
  if (c.n != null) u.n = c.n;                 /* escort squadron size (item 10b) */

  /* after the hull choice the unit's ship is the chosen hull, not the row's default */
  sh = api.shipOf(u) || sh;   /* on a Venerable row the hull's SM view (p.102) */

  /* P1-8c: the app's adapter (resolveUnit(u) -> intent -> domain.js) against
     a direct call of the pure resolver, on the fields v0 also had. The dual
     run against the old v0 body passed on every case before v0 was removed;
     this stays as the regression of the adapter path. Semantic projection,
     deepStrictEqual - not a byte comparison. */
  { const v0 = api.resolveUnit(u);
    /* For a borrowed ship (u.lst) the app passes its own list and the fleet's list
       separately (selOf: ctx.list = the unit's list, ctx.host = the fleet); the same
       context here, or the comparison asks a different question (J206). */
    const hostL = api.LISTS[api.getS().li];
    const ownL = u.lst ? api.LISTS.find(x => x.nm === u.lst) : null;
    const ctx = ownL ? { list: ownL, host: hostL } : { list: hostL };
    const v1 = api.DOMAIN.resolveUnit(api.DOMAIN.fromLegacyUnit(u, ctx, {ships: api.SHIPS, lists: api.LISTS}), ctx, {ships: api.SHIPS, lists: api.LISTS});
    try { require("assert").deepStrictEqual(commonProjection(v1), commonProjection(v0)); }
    catch (err) { r.surfaces.push("v1 parity: " + String(err.message).replace(/\s+/g, " ").slice(0, 160)); }
  }
  /* P1-8b: the pure Selection (domain.js) must agree with the legacy state
     accessor the setters still write to. */
  { const sel = api.selOf(u);
    (sh.ol || []).forEach((o, i) => {
      if (api.optState(u, i) !== sel.ost[i])
        r.surfaces.push("optState parity [" + i + "]: " + api.optState(u, i) + " != " + sel.ost[i]);
    }); }

  const e = c.expect || {};
  /* hull_choices_include / _exclude: which hulls the row offers (name regex) */
  if (e.hull_choices_include || e.hull_choices_exclude) {
    const R0 = api.resolveUnit(u);
    const names = ((R0 && R0.hull && R0.hull.choices) || []).map(p => String(api.SHIPS[p] ? api.SHIPS[p].nm : p));
    const has = pat => names.some(n => new RegExp(pat, "i").test(n));
    (e.hull_choices_include || []).forEach(p => { if (!has(p)) r.profile.push("hull missing from the choices: " + p); });
    (e.hull_choices_exclude || []).forEach(p => { if (has(p)) r.profile.push("hull is among the choices although it must not be: " + p); });
  }
  const res = fromResolver(u, sh);
  /* Issues (P1-8e): a case either names the issues it expects, or it must
     resolve without a single error - the golden set doubles as the proof
     that every book-read configuration is a valid intent. */
  { const Rz = api.resolveUnit(u);
    const codes = ((Rz && Rz.issues) || []).map(x => x.code);
    if (e.issues) e.issues.forEach(x => { if (!codes.includes(x.code)) r.profile.push("issue missing: " + x.code); });
    else {
      const errs = ((Rz && Rz.issues) || []).filter(x => x.severity === "error").map(x => x.code);
      if (errs.length) r.profile.push("unexpected error: " + errs.join(","));
    } }
  const card = u._noList ? null : cardOf(u, sh);
  const view = u._noList ? null : fleetViewOf(sh);
  const rost = u._noList ? null : rosterOf();
  const copy = u._noList ? null : norm(api.listText());
  const pts = u._noList ? null : api.unitPts(u);

  /* 1. price */
  if (e.points != null && pts != null)
    r.points = pts === e.points ? null : (pts + " != " + e.points);
  /* max_points: the largest LEGAL price - only one per choice group (item 10b) */
  if (e.max_points != null) {
    const mp = api.resolveUnit(u).maxPoints;
    if (mp !== e.max_points) r.profile.push("maxPoints: " + mp + " != " + e.max_points);
  }

  /* 2. the book profile */
  ["hits", "shields", "turrets", "speed", "turns", "armour"].forEach(k => {
    if (e[k] == null) return;
    if (norm(res[k]) !== norm(e[k]))
      r.profile.push(k + ": " + norm(res[k]) + " != " + norm(e[k]));
  });
  const allRows = api.armModel(u, sh);
  if (e.weapon_rows != null && allRows.length !== e.weapon_rows)
    r.profile.push("weapon rows in the table " + allRows.length + " != " + e.weapon_rows);
  if (e.active_weapons != null && res.weapons.length !== e.active_weapons)
    r.profile.push("active weapons " + res.weapons.length + " != " + e.active_weapons);
  /* special_contains / special_lacks: the profile's SPECIAL text as the
     card resolves it (specialLines) - a profile-level check that runs also
     for a ship no list sells (Waystation p.481). */
  if (e.special_contains || e.special_lacks) {
    const lines = api.specialLines(sh).map(x => String(x.t || ""));
    (e.special_contains || []).forEach(s => { if (!lines.some(l => l.includes(s))) r.profile.push("missing from the SPECIAL texts: " + s); });
    (e.special_lacks || []).forEach(s => { if (lines.some(l => l.includes(s))) r.profile.push("too much in the SPECIAL texts: " + s); });
  }
  if (e.weapon) {
    const re = new RegExp(e.weapon.match, "i");
    const row = allRows.find(x => re.test(String(x.a[0])));
    if (!row) r.profile.push("weapon row not found: " + e.weapon.match);
    else {
      const cols = { name: 0, range: 1, fp: 2, arc: 3 };
      Object.keys(e.weapon).forEach(k => {
        if (k === "match") return;
        /* count = the number of instances (the Hive Ship's side sets, P1-6) */
        if (k === "count") {
          const got = row.count == null ? 1 : row.count;
          if (got !== e.weapon.count)
            r.profile.push("weapon count: " + got + " != " + e.weapon.count);
          return;
        }
        const got = norm(row.a[cols[k]]);
        if (got !== norm(e.weapon[k]))
          r.profile.push("ase " + k + ": " + got + " != " + norm(e.weapon[k]));
      });
    }
  }
  if (e.weapon_none) {
    /* Not a single ACTIVE row matching the name AND the range -
       the Mercury's 45 cm batteries must not stay once they are raised to 60 cm. */
    const re = new RegExp(e.weapon_none.match, "i");
    const left = activeRows(u, sh).filter(x => re.test(String(x.a[0])) &&
      (!e.weapon_none.range || norm(x.a[1]) === norm(e.weapon_none.range)));
    if (left.length)
      r.profile.push("the row is still active: " + e.weapon_none.match + " @ " + (e.weapon_none.range || "") + " x" + left.length);
  }
  if (e.weapon_count) {
    /* how many ACTIVE rows match the pattern - repeated instances */
    const re = new RegExp(e.weapon_count.match, "i");
    const n = res.weapons.filter(w => re.test(w)).length;
    if (n !== e.weapon_count.n)
      r.profile.push("active '" + e.weapon_count.match + "' rows " + n + " != " + e.weapon_count.n);
  }
  if (copy) {
    (e.list_contains || []).forEach(s => {
      if (!copy.includes(norm(s))) r.profile.push("missing from the Copy list text: " + s);
    });
  }
  /* roster_contains is read in surfaceWordChecks() below (the same rule
     for hull-less rows too). */
  if (card) {
    (e.card_contains || []).forEach(s => {
      if (!card.html.includes(s) && !card.text.includes(norm(s)))
        r.profile.push("missing from the card: " + s);
    });
    (e.card_lacks || []).forEach(s => {
      if (card.html.includes(s) || card.text.includes(norm(s)))
        r.profile.push("too much on the card: " + s);
    });
    countChecks(e, card.html, r);
  }
  if (view && rost) surfaceWordChecks(e, view.html, rost.html, r);
  /* weapon_zones: the groups of the resolved weapon rows. The book's table has two
     group headings, QUADRANT WEAPONS and BASILICA WEAPONS (Fleets p.110, p.500);
     the plan card draws the quadrant weapons four times and the Basilica weapons
     once in the middle, so the group must be a resolver field and not the card's
     guess. */
  if (e.weapon_zones) {
    const Rw = api.resolveUnit(u);
    Object.keys(e.weapon_zones).forEach(z => {
      const n = ((Rw && Rw.weapons) || []).filter(w => w.zone === z).length;
      if (n !== e.weapon_zones[z]) r.profile.push("weapons in group " + z + ": " + n + " != " + e.weapon_zones[z]);
    });
  }
  /* A list upgrade offered / not offered to this ship (upgradesFor).
     Chosen Terminators is a "battleships and grand cruisers" upgrade that
     was offered to the Chaos Space Hulk (Defence) without a condition. */
  if (e.upgrade_offered || e.upgrade_not_offered) {
    const ups = api.upgradesFor(u);
    const labels = ups.own.concat(ups.other).map(x => String(x[2].l));
    const has = pat => labels.some(l => new RegExp(pat, "i").test(l));
    if (e.upgrade_offered && !has(e.upgrade_offered))
      r.profile.push("upgrade not offered: " + e.upgrade_offered);
    if (e.upgrade_not_offered && has(e.upgrade_not_offered))
      r.profile.push("upgrade offered although it must not be: " + e.upgrade_not_offered);
  }
  /* P1-8c: options[] and upgrades[] of the resolver, expectations from the
     book (reference/golden_cases.json). */
  if (e.options || e.upgrades) {
    const R1 = api.resolveUnit(u);
    (e.options || []).forEach(x => {
      const o = (R1.options || []).find(o => new RegExp(x.match, "i").test(o.text));
      if (!o) { r.profile.push("options[]: no option " + x.match); return; }
      if (x.state && o.state !== x.state) r.profile.push("options[] " + x.match + ": state " + o.state + " != " + x.state);
      if (x.qty != null && o.qty !== x.qty) r.profile.push("options[] " + x.match + ": qty " + o.qty + " != " + x.qty);
      if (x.blocked_by) {
        const b = (R1.options || []).find(o2 => new RegExp(x.blocked_by, "i").test(o2.text));
        if (!b || !o.blockedBy.includes(b.id)) r.profile.push("options[] " + x.match + ": not blocked (" + x.blocked_by + ")");
      }
      if (x.depends_on) {
        const dnode = (R1.options || []).find(o2 => new RegExp(x.depends_on, "i").test(o2.text));
        if (!dnode || o.dependsOn !== dnode.id) r.profile.push("options[] " + x.match + ": dependency is not " + x.depends_on);
      }
    });
    (e.upgrades || []).forEach(x => {
      const up = (R1.upgrades || []).find(o => new RegExp(x.match, "i").test(o.label));
      if (!up) { r.profile.push("upgrades[]: no upgrade " + x.match); return; }
      if (x.state && up.state !== x.state) r.profile.push("upgrades[] " + x.match + ": state " + up.state + " != " + x.state);
      if (x.required != null && up.required !== x.required) r.profile.push("upgrades[] " + x.match + ": required " + up.required);
      if (x.cost != null && up.cost !== x.cost) r.profile.push("upgrades[] " + x.match + ": cost " + up.cost + " != " + x.cost);
      if (x.owner && up.owner !== x.owner) r.profile.push("upgrades[] " + x.match + ": owner " + up.owner);
    });
  }
  if (e.exclusive_group_blocks) {
    const i = optIndex(sh, e.exclusive_group_blocks);
    api.setOptState(u, i, "take");
    const both = (c.select || []).every(sel =>
      api.optState(u, optIndex(sh, sel.option)) === "take");
    if (both && api.optState(u, i) === "take")
      r.profile.push("two options of the same group chosen at once");
  }

  /* 3. agreement between surfaces */
  if (card && view) {
    const cmp = (a, b, k, an, bn) => {
      if (a[k] == null || b[k] == null) return;
      if (norm(a[k]) !== norm(b[k]))
        r.surfaces.push(k + ": " + an + "=" + norm(a[k]) + " " + bn + "=" + norm(b[k]));
    };
    /* The card abbreviates on purpose (Shadowfield -> SHADOW, armour); that is
       presentation, not disagreement. The comparison goes through the abbreviation. */
    const asCard = { ...res, shields: norm(api.shortShield(res.shields)),
                     armour: norm(api.shortArmour(res.armour)) };
    ["hits", "shields", "turrets", "speed", "turns", "armour"].forEach(k => {
      cmp(asCard, card, k, "resolver", "card");
      cmp(res, view, k, "resolver", "fleet view");
    });
    if (rost) {
      cmp(res, rost, "hits", "resolver", "roster");
      if (rost.points != null && String(pts) !== rost.points)
        r.surfaces.push("points: resolver=" + pts + " roster=" + rost.points);
    }
    /* Copy list: the unit's own line carries the same points and every taken
       option and upgrade by name (P1-8d). Read now, not earlier: an
       expectation above (exclusive_group_blocks) may have changed a choice. */
    if (copy) {
      const R1 = api.resolveUnit(u), copyNow = norm(api.listText()), ptsNow = api.unitPts(u);
      if (!copyNow.includes(" " + ptsNow + " pts"))
        r.surfaces.push("points: resolver=" + ptsNow + " Copy list does not contain it");
      (R1.options || []).filter(o => o.state === "take").forEach(o => {
        if (!copyNow.includes(norm(o.text).slice(0, 40))) r.surfaces.push("Copy list: option missing: " + o.text.slice(0, 30));
      });
      (R1.upgrades || []).filter(o => o.state === "take").forEach(o => {
        if (!copyNow.toLowerCase().includes(norm(o.label).toLowerCase())) r.surfaces.push("Copy list: upgrade missing: " + o.label);
      });
    }
    /* The active weapons and the damage model are on the card by name. */
    res.weapons.forEach(w => {
      const short = norm(api.shortWeaponName(w));
      if (!card.text.includes(short) && !card.text.includes(w))
        r.surfaces.push("weapon missing from the card: " + w);
    });
    if (res.damage && !card.text.includes(res.damage.slice(0, 40)))
      r.surfaces.push("damage model missing from the card: " + res.damage.slice(0, 40));
    res.rules.forEach(t => {
      if (!card.text.includes(t.slice(0, 40)))
        r.surfaces.push("special rule missing from the card: " + t.slice(0, 40));
    });
    const rt = saveRoundTrip(u, sh);
    if (!rt.ok) r.surfaces.push("tallennuskierros: " + rt.why);
  }
  return r;
}


/* ================= fleet-level cases (1.1 phase 1) =================
   A unit case asks "what does the ship cost and what does it carry". A fleet case
   asks something else: "what do the fleet's legality checks say". That is different
   code (resolveFleet, domain.js item 8) and a different question, so the cases
   are in their own file reference/golden_fleet_cases.json.

   The fleet is built with addUnit() as in the app, so that required
   upgrades and open prices land the same way. The expectation is read from the book:
   the sentence, the page number and a hand-computed total - not by running the app. */

function buildFleet(f, r) {
  const S = api.getS();
  const li = listIndex(f.list);
  if (li < 0) { r.errors.push("list not found: " + f.list); return null; }
  S.li = li; S.limit = f.limit | 0; S.units = [];
  /* spec.aboard (J215): the ship chosen by a commander, a row regex. The target may
     come later in the list, so the choices are made at the end. */
  const aboardSpecs = [];
  for (const spec of (f.units || [])) {
    /* A borrowed ship (Fleets p.14): the unit is bought from the SOURCE LIST, so that its
       row, price and required upgrades come from there. The list is switched
       only for the build; after that the unit carries its own list
       (u.lst) and role (u.role). */
    const foreign = !!(spec.list && spec.list !== f.list);
    const li2 = foreign ? listIndex(spec.list) : li;
    if (li2 < 0) { r.errors.push("source list not found: " + spec.list); return null; }
    const at = spec.entry ? placeByLabel(li2, spec.entry) : placeOn(li2, spec.ship);
    if (!at) { r.errors.push("row is not on list " + api.LISTS[li2].nm + ": "
      + (spec.entry || ("s." + spec.ship))); return null; }
    for (let k = 0; k < (spec.repeat == null ? 1 : spec.repeat); k++) {
      /* addUnitFrom takes the source list as an argument, so S.li stays on
         the fleet's own list the whole time. Earlier the driver moved it and
         had to clean up after itself (J103). */
      /* J226: in Da Ork Clanz a new unit goes into its Warlord's group and not
         to the end of the list, so the added unit is found by comparison. */
      const before = S.units.slice();
      api.addUnitFrom(li2, at.si, at.ei, spec.role);
      const u = S.units.filter(x => before.indexOf(x) < 0)[0];
      if (u && spec.aboard) aboardSpecs.push({ u: u, re: spec.aboard });
      /* J216: squadron (same tag = same squadron) and a Clanz Warlord
         (cmd = which commander unit in fleet order, 0 = the first) */
      if (u && spec.sq) u.sq = String(spec.sq);
      /* a Clanz Warlord's own clan as the player picked it (RAW-04), without
         buying it for his skwadrons: those are the case's own ups */
      if (u && spec.clan) u.clan = String(spec.clan);
      /* J218: hull choice (hc row), profile page as in the unit cases */
      if (u && spec.hull != null) api.setHull(u, spec.hull);
      if (u && spec.cmd != null) aboardSpecs.push({ u: u, cmd: spec.cmd | 0 });
      if (!foreign && spec.role) u.role = spec.role;
      if (!u) { r.errors.push("addUnit produced no unit: " + (spec.entry || spec.ship)); return null; }
      if (spec.n != null) u.n = spec.n;
      if (spec.adjust != null) u.adj = spec.adjust;
      if (spec.name != null) u.name = spec.name;
      const sh = api.shipOf(u);
      for (const sel of (spec.opts || [])) {
        const i = optIndex(sh, sel.option);
        if (i < 0) { r.errors.push("option not found: " + sel.option); return null; }
        api.setOptState(u, i, sel.state || "take");
        if (sel.qty) { u.oq = u.oq || {}; u.oq[i] = sel.qty; }
      }
      /* A forbidden upgrade: the case claims the row is not OFFERED at all.
         These cannot be measured from the points, because not buying
         looks the same as a ban - hence a separate expectation. */
      for (const re2 of (spec.no_ups || [])) {
        const ups0 = api.upgradesFor(u);
        const hit = ups0.own.concat(ups0.other)
          .find(x => new RegExp(re2, "i").test(String(x[2].l)));
        if (hit) { r.errors.push("upgrade offered although it must not be: " +
          String(hit[2].l) + " (" + re2 + ")"); return null; }
      }
      for (const sel of (spec.ups || [])) {
        const ups = api.upgradesFor(u);
        const row = ups.own.concat(ups.other).find(x => new RegExp(sel.upgrade, "i").test(String(x[2].l)));
        if (!row) { r.errors.push("upgrade not offered: " + sel.upgrade); return null; }
        api.setUpState(u, row[0], row[1], sel.state || "take");
      }
      /* no_ups_after: the row must no longer be offered AFTER the purchases. The same
         purchase under two names (crews, spot check 20 seed 2026091443). */
      for (const re2 of (spec.no_ups_after || [])) {
        const ups1 = api.upgradesFor(u);
        const hit = ups1.own.concat(ups1.other).find(x => new RegExp(re2, "i").test(String(x[2].l)));
        if (hit) { r.errors.push("upgrade offered after the purchases although it must not be: " + String(hit[2].l) + " (" + re2 + ")"); return null; }
      }
      /* ups_described: an offered row has the book's sentence as its description.
         The host's rows lost it (spot check 20 seed 2026091443). */
      for (const re2 of (spec.ups_described || [])) {
        const R0 = api.resolveUnit(u);
        const row = (R0 && R0.upgrades || []).find(x => new RegExp(re2, "i").test(String(x.label)));
        if (!row) { r.errors.push("the row to describe is not offered: " + re2); return null; }
        if (!String(row.description || "").trim()) { r.errors.push("the row has no description: " + row.label); return null; }
      }
    }
  }
  for (const a of aboardSpecs) {
    if (a.cmd != null) {
      const w = S.units.filter(x => (api.resolveUnit(x) || {}).kind === "commander")[a.cmd];
      if (!w || !w.uid) { r.errors.push("cmd: no commander " + a.cmd + " (or its uid is missing)"); return null; }
      a.u.cmd = w.uid;
      continue;
    }
    const re = new RegExp(a.re, "i");
    const t = S.units.find(x => x !== a.u && re.test(String((api.resolveUnit(x).entry || {}).label || "")));
    if (!t) { r.errors.push("the aboard target is not in the fleet: " + a.re); return null; }
    if (!t.uid) { r.errors.push("the unit has no uid (J215)"); return null; }
    a.u.aboard = t.uid;
  }
  return S;
}

/* Identifying a check row: the book's sentence (src, a substring of the rule's
   src field) or the heading regex (label). Either must hit exactly one
   row - two hits are as bad as none, because then the case does not
   tell which rule it speaks of. */
function matchCheckRow(row, x) {
  if (x.src && norm(row.s || "").toLowerCase().indexOf(norm(x.src).toLowerCase()) < 0) return false;
  if (x.label && !new RegExp(x.label, "i").test(String(row.t || ""))) return false;
  return !!(x.src || x.label);
}
const keyOfCheck = x => (x.src ? '"' + String(x.src).slice(0, 44) + '"' : "/" + x.label + "/");

const FLEET_EXPECT_KEYS = ["aboard", "checks", "facts", "failing", "no_issues",
                          "others_ok", "total", "units"];

function runFleetCase(c) {
  const r = { id: c.id, page: c.page, status: c.status || "expect_pass",
              task: c.task || null, errors: [], total: null, checks: [], notes: [] };
  if (!c.fleet || !c.fleet.list) { r.errors.push("the case has no fleet.list"); return r; }
  if (!buildFleet(c.fleet, r)) return r;
  const e = c.expect || {};
  /* An unknown expectation key is more dangerous than a missing expectation: it
     looks like a case that guards something, but the driver does not read it
     at all. This happened to the Xenos control - it was written as
     expect.absent while the supported form is checks[].absent, and the case passed
     even with a completely broken rule. */
  Object.keys(e).forEach(function(k){
    if (FLEET_EXPECT_KEYS.indexOf(k) < 0)
      r.errors.push("unknown expect key: " + k); });
  const cs = api.checks();
  if (e.total != null) {
    const t = api.total();
    if (t !== e.total) r.total = t + " != " + e.total;
  }
  const claimed = [];
  (e.checks || []).forEach(x => {
    const hits = cs.filter(row => matchCheckRow(row, x));
    /* absent: the row must NOT exist. A control case for a ban that covers only
       some of the source list's rows (Armageddon's Space Marine ships, p.41). */
    if (x.absent) {
      if (hits.length) r.checks.push("check row " + keyOfCheck(x) + ": must not exist, hits " + hits.length);
      return;
    }
    if (x.nth != null ? !hits[x.nth] : hits.length !== 1) {
      r.checks.push("check row " + keyOfCheck(x) + ": hits " + hits.length); return; }
    const row = hits[x.nth != null ? x.nth : 0];
    claimed.push(row);
    if (x.ok != null && !!row.ok !== !!x.ok)
      r.checks.push(keyOfCheck(x) + ": ok=" + !!row.ok + " != " + !!x.ok + " (" + row.v + ")");
    if (x.v != null && norm(row.v) !== norm(x.v))
      r.checks.push(keyOfCheck(x) + ": value '" + row.v + "' != '" + x.v + "'");
    if (x.warn != null && !!row.warn !== !!x.warn)
      r.checks.push(keyOfCheck(x) + ": warn=" + !!row.warn + " != " + !!x.warn);
  });
  /* Fleet facts (J214): attack rating, the opponent's free extras and
     VP values. They are not checks but computed information, so a separate
     list; identified as a check row (label or src, exactly one). */
  if (e.facts) {
    const fs0 = api.fleetFacts ? api.fleetFacts() : null;
    if (!fs0) r.checks.push("the app has no fleetFacts() function");
    else e.facts.forEach(x => {
      const hits = fs0.filter(row => matchCheckRow(row, x));
      if (x.absent) {
        if (hits.length) r.checks.push("fact row " + keyOfCheck(x) + ": must not exist, hits " + hits.length);
        return;
      }
      if (hits.length !== 1) { r.checks.push("fact row " + keyOfCheck(x) + ": hits " + hits.length); return; }
      if (x.v != null && norm(hits[0].v) !== norm(x.v))
        r.checks.push(keyOfCheck(x) + ": value '" + hits[0].v + "' != '" + x.v + "'");
      if (x.warn != null && !!hits[0].warn !== !!x.warn)
        r.checks.push(keyOfCheck(x) + ": warn=" + !!hits[0].warn + " != " + !!x.warn);
    });
  }
  /* A commander's placement (J215): whose ship he is aboard (ship = a row
     regex, null = none), and how many ships the rule allows (choices). */
  if (e.aboard) {
    const ab = api.fleetAboard ? api.fleetAboard() : null;
    if (!ab) r.checks.push("the app has no fleetAboard() function");
    else e.aboard.forEach(x => {
      const re = new RegExp(x.cmd, "i");
      const hits = ab.filter(a => re.test(String(a.cmd)));
      const a = hits[x.nth != null ? x.nth : 0];
      if (!a || (x.nth == null && hits.length !== 1)) {
        r.checks.push("placement /" + x.cmd + "/: hits " + hits.length); return; }
      if (x.ship !== undefined && (x.ship === null ? a.ship !== null : !new RegExp(x.ship, "i").test(String(a.ship))))
        r.checks.push("placement /" + x.cmd + "/: ship '" + a.ship + "' != /" + x.ship + "/");
      if (x.choices != null && a.choices.length !== x.choices)
        r.checks.push("placement /" + x.cmd + "/: choices " + a.choices.length + " != " + x.choices +
                      " (" + a.choices.join(", ") + ")");
    });
  }
  /* What one row resolves to inside its fleet (ruling T60: a Clanz tiddla's
     clan and Gubbins reach every row of its tag). entry = a row regex, nth =
     which of its rows; speed / turrets / shields / hits, upgrades [{match,
     state}]. The card's resolved unit and the fleet's must both say it, and
     the fleet view's price is the same as theirs. */
  (e.units || []).forEach(x => {
    const us = api.getS().units, RF = api.fleetResolved();
    const at = us.map((u, i) => i).filter(i => new RegExp(x.entry, "i").test(String(((api.resolveUnit(us[i]) || {}).entry || {}).label || "")));
    const i = at[x.nth || 0];
    if (i == null) { r.checks.push("unit /" + x.entry + "/: not in the fleet"); return; }
    const Rc = api.resolveUnit(us[i]);
    [["card", Rc], ["fleet", RF.units[i]]].forEach(([w, R]) => {
      const k = "unit /" + x.entry + "/ (" + w + ")";
      if (!R) { r.checks.push(k + ": not resolved"); return; }
      ["speed", "turrets", "shields", "hits"].forEach(f => {
        if (x[f] != null && String(R.stats && R.stats[f]) !== String(x[f]))
          r.checks.push(k + ": " + f + " " + (R.stats && R.stats[f]) + " != " + x[f]); });
      (x.upgrades || []).forEach(y => {
        const up = (R.upgrades || []).find(o => new RegExp(y.match, "i").test(o.label));
        if (!up) { r.checks.push(k + ": no upgrade " + y.match); return; }
        if (y.state && up.state !== y.state) r.checks.push(k + ": " + y.match + " state " + up.state + " != " + y.state);
      });
    });
    const pv = api.unitPts(us[i]);
    if (!Rc || !RF.units[i] || pv !== Rc.points || pv !== RF.units[i].points)
      r.checks.push("unit /" + x.entry + "/: points disagree: fleet view " + pv + ", card " + (Rc && Rc.points) +
                    ", fleet " + (RF.units[i] && RF.units[i].points));
  });
  if (e.others_ok)
    cs.filter(row => !row.ok && claimed.indexOf(row) < 0).forEach(row =>
      r.checks.push("unexpected red: " + row.t + " (" + row.v + ")"));
  if (e.failing != null) {
    const n = cs.filter(row => !row.ok).length;
    if (n !== e.failing) r.checks.push("red rows " + n + " != " + e.failing);
  }
  /* Unit-level errors: a legal purchase must not show red. Spot check
     20 (seed 2026091412): a host list upgrade was priced correctly but
     validateIntent did not know the host list and gave upgrade.unknown_id. */
  if (e.no_issues) {
    api.getS().units.forEach((u, i) => {
      const R = api.resolveUnit(u);
      (R && R.issues || []).forEach(x => r.checks.push("unit " + i + " issue " + x.code + ": " + x.message));
    });
  }
  /* Save round trip for the whole fleet: the same fleet, the same checks.
     A change of save format (schema 3) shows here at once. */
  if (e.save_roundtrip !== false) {
    const before = { t: api.total(), c: JSON.stringify(cs) };
    STORE = {};
    api.save(); api.load();
    const after = { t: api.total(), c: JSON.stringify(api.checks()) };
    if (before.t !== after.t) r.checks.push("save round trip: points " + before.t + " != " + after.t);
    else if (before.c !== after.c) r.checks.push("save round trip: the checks changed");
  }
  return r;
}

const fleetResults = FCASES.cases.map(runFleetCase);
const fleetBad = r => (r.total ? 1 : 0) + r.errors.length + r.checks.length;
let fleetFail = 0, fleetGapOpen = 0, fleetGapClosed = 0;
fleetResults.forEach(r => {
  const n = fleetBad(r);
  if (r.status === "gap") { if (n) fleetGapOpen++; else fleetGapClosed++; }
  else if (n) fleetFail++;
});

/* --- run -------------------------------------------------------------- */
const results = CASES.cases.map(run);
const bad = r => (r.points ? 1 : 0) + r.profile.length + r.surfaces.length;

let failPass = 0, gapOpen = 0, gapClosed = 0, surfaceOnly = 0, surfaceCases = 0;
results.forEach(r => {
  const n = bad(r);
  if (r.surfaces.length) surfaceCases++;
  if (r.status === "gap") { if (n) gapOpen++; else gapClosed++; }
  else if (n) { failPass++; if (!r.points && !r.profile.length) surfaceOnly++; }
});

if (AS_JSON) {
  console.log(JSON.stringify({
    total: results.length, fail: failPass, gap_open: gapOpen,
    gap_closed: gapClosed, surface_only: surfaceOnly,
    surface_disagreements: surfaceCases, cases: results,
    fleet_total: fleetResults.length, fleet_fail: fleetFail,
    fleet_gap_open: fleetGapOpen, fleet_gap_closed: fleetGapClosed,
    fleet_cases: fleetResults,
  }, null, 1));
  process.exit(failPass || fleetFail ? 1 : 0);
}

const pad = (s, n) => String(s).slice(0, n).padEnd(n);
const mark = (s, ok) => (ok ? "OK" : s);
console.log("GOLDEN CASES  " + results.length + ", read from the book");
console.log("(source: " + CASES._source + ")\n");
console.log("  " + pad("case", 32) + pad("page", 6) + pad("price", 7)
            + pad("profile", 9) + "surfaces");
console.log("  " + "-".repeat(70));
results.forEach(r => {
  const st = r.status === "gap" ? (bad(r) ? "GAP" : "OPEN") : "FAIL";
  console.log("  " + pad(r.id, 32) + pad("p." + r.page, 6)
    + pad(mark(st, !r.points), 7)
    + pad(mark(st, !r.profile.length), 9)
    + pad(mark(st, !r.surfaces.length), 8)
    + (r.status === "gap" ? (r.task || "") : (r.notes[0] || "")));
  if (VERBOSE || (r.status !== "gap" && bad(r))) {
    if (r.points) console.log("       price    " + r.points);
    r.profile.forEach(m => console.log("       profile  " + m));
    r.surfaces.forEach(m => console.log("       SURFACES " + m));
  }
});
console.log("");
console.log("  expected to pass, failed  : " + failPass
  + (surfaceOnly ? "  (of which " + surfaceOnly + " only surface disagreement)" : ""));
console.log("  known gaps open            : " + gapOpen);
if (gapClosed)
  console.log("  marked gap but passed      : " + gapClosed
    + "  -> update the status in golden_cases.json");

console.log("");
console.log("FLEET-LEVEL CASES  " + fleetResults.length + ", read from the book");
console.log("(source: " + FCASES._source + ")\n");
console.log("  " + pad("case", 40) + pad("page", 6) + pad("total", 7) + "checks");
console.log("  " + "-".repeat(72));
fleetResults.forEach(r => {
  const st = r.status === "gap" ? (fleetBad(r) ? "GAP" : "OPEN") : "FAIL";
  console.log("  " + pad(r.id, 40) + pad("p." + r.page, 6)
    + pad(mark(st, !r.total), 7)
    + pad(mark(st, !r.checks.length && !r.errors.length), 8)
    + (r.status === "gap" ? (r.task || "") : (r.notes[0] || "")));
  if (VERBOSE || (r.status !== "gap" && fleetBad(r))) {
    if (r.total) console.log("       total     " + r.total);
    r.errors.forEach(m => console.log("       structure " + m));
    r.checks.forEach(m => console.log("       check     " + m));
  }
});
console.log("");
console.log("  expected to pass, failed  : " + fleetFail);
console.log("  known gaps open            : " + fleetGapOpen);
if (fleetGapClosed)
  console.log("  marked gap but passed      : " + fleetGapClosed
    + "  -> update the status in golden_fleet_cases.json");
process.exit(failPass || fleetFail ? 1 : 0);
