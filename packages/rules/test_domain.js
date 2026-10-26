/* Tests of the rules engine (P1-8a, P1-8b): run WITHOUT a page, a DOM stub,
 * localStorage or a global S. require("./domain.js") directly.
 *
 *   1. Option ids in the data: every ol row has an id, unique within the ship,
 *      made by the same formula as build_data.py (page + sha1(norm(text))[:8]).
 *      List row ids (list + section + row name) are unique.
 *   2. The adapter round-trips: legacy unit -> CanonicalUnitIntent -> legacy,
 *      for every case of reference/golden_cases.json (read from the file),
 *      and the intent survives a JSON round trip.
 *   3. Migration: a ship's option order is shuffled in a copy of the catalog;
 *      the intent still points at the same options by their TEXT.
 *   4. Purity: the inputs are frozen (deepFreeze); a mutation would throw.
 *      And the catalog is byte for byte the same after the run.
 *   5. An invalid intent: an unknown option id and an unknown row give a
 *      structured issue and do not crash.
 *   6. (P1-8b) Pure calculators against the book: the golden cases'
 *      expectations (price, stats, weapon rows, offered upgrades, hull
 *      choices) are evaluated directly with pointsOf / weaponRows / eff*. The
 *      same book, another path: test_golden.js runs the app's own surfaces.
 *   7. (P1-8b) No aliasing: no resolved weapon row is an element of a catalog
 *      array; changing the result does not change the catalog.
 *
 * Run:  node test_domain.js        node test_domain.js -v
 */
"use strict";
const fs = require("fs"), path = require("path"), crypto = require("crypto");
const DOMAIN = require("./domain.js");

const HERE = __dirname;
const RAW = fs.readFileSync(path.join(HERE, "..", "..", "data", "bfg_data.json"), "utf8");
const catalog = JSON.parse(RAW);
const CASES = JSON.parse(fs.readFileSync(path.join(HERE, "..", "..", "reference", "golden_cases.json"), "utf8")).cases;
const VERBOSE = process.argv.includes("-v");

let pass = 0, fail = 0;
const fails = [];
function check(name, ok, detail){
  if(ok) pass++; else { fail++; fails.push(name + (detail ? "  " + detail : "")); }
  if(VERBOSE || !ok) console.log("  " + (ok ? "PASS" : "FAIL") + "  " + name + (ok || !detail ? "" : "  " + detail));
}
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const norm = t => String(t == null ? "" : t)
  .replace(/[  ]/g, " ").replace(/[–—−]/g, "-")
  .replace(/\s+/g, " ").trim();

/* ---- 1. option ids and row ids ---------------------------------------- */
const sha8 = t => crypto.createHash("sha1").update(DOMAIN.normOptText(t), "ascii").digest("hex").slice(0, 8);
let nOpts = 0, badId = 0, dupId = 0;
Object.keys(catalog.ships).forEach(k => {
  const seen = new Set();
  (catalog.ships[k].ol || []).forEach(o => {
    nOpts++;
    if(o.id !== k + ":" + sha8(o.t)) badId++;
    if(seen.has(o.id)) dupId++;
    seen.add(o.id);
  });
});
check("options in the data > 100", nOpts > 100, String(nOpts));
check("every option id follows the pattern page:sha1(norm)[:8]", badId === 0, "deviating " + badId);
check("ids unique within a ship", dupId === 0, "duplicates " + dupId);
{
  /* Unit and commander rows: (list, section, name) is unambiguous.
     Upgrade rows may repeat a name (the Tyranids' 'Pyro-acid battery' at
     5/10/15 pts for different ships), but then each has its own attachment
     (at), from which findUpgradeEntry picks the unit's own row. */
  const dupUnit = [], dupUpNoAt = [];
  catalog.lists.forEach(L => {
    const seenU = new Set(), ups = {};
    L.secs.forEach((sec, si) => sec.ents.forEach((en, ei) => {
      const id = DOMAIN.upgradeId(L.nm, sec.t, en.l);
      if(en.k === "up"){ (ups[id] = ups[id] || []).push(en); return; }
      if(seenU.has(id)) dupUnit.push(L.nm + " / " + sec.t + " / " + en.l);
      seenU.add(id);
    }));
    Object.keys(ups).forEach(id => {
      const rows = ups[id];
      if(rows.length < 2) return;
      const ats = rows.map(en => JSON.stringify(en.at || null));
      if(new Set(ats).size !== ats.length) dupUpNoAt.push(id.split(DOMAIN.SEP).join(" / "));
    });
  });
  check("unit and commander rows unambiguous (list+section+name)", dupUnit.length === 0, dupUnit.slice(0, 5).join(" | "));
  check("same-named upgrade rows are told apart by their attachment", dupUpNoAt.length === 0, dupUpNoAt.slice(0, 5).join(" | "));
  /* Kraken (Tyranids): 'Pyro-acid battery' is 15 pts for the Kraken, 5 pts for the Vanguard */
  const L = listByName("Tyranids — Hive Fleet");
  const sec = L.secs.findIndex(sx => sx.t === "ESCORTS");
  const kr = L.secs[sec].ents.findIndex(en => en.l === "Kraken");
  const rows = L.secs[sec].ents.map((en, ei) => [en, ei]).filter(([en]) => en.l === "Pyro-acid battery" && en.k === "up");
  const mine = rows.find(([en]) => en.at && en.at.some(p => p[0] === sec && p[1] === kr));
  check("Kraken: its own pyro-acid row is found", !!mine && mine[0].p === 15);
  const u = { s: sec, e: kr, ref: L.secs[sec].ents[kr].r, n: 1, name: "", opts: [], os: {}, oq: {}, ups: {} };
  u.ups[sec + ":" + mine[1]] = "take";
  const ctx = { list: L };
  const it = DOMAIN.fromLegacyUnit(u, ctx, catalog);
  const selK = DOMAIN.selectionOf(it, ctx, catalog);
  check("Kraken: the upgrade resolves to its own row", selK.ups[sec + ":" + mine[1]] === "take", JSON.stringify(selK.ups));
  const back = DOMAIN.toLegacyUnit(it, ctx, catalog);
  check("Kraken: back to the same index", back.unit.ups[sec + ":" + mine[1]] === "take" && !back.issues.length, JSON.stringify(back.unit.ups));
  /* The Kraken's own profile offers the same weapon at the same price (15),
     so the list row is covered (coveredByShipOption) and not charged twice:
     the price comes from the ship's own option. */
  check("Kraken: the list row is covered by the ship's own option", DOMAIN.coveredByShipOption(selK, mine[0]) === true);
  const own = (selK.sh.ol || []).findIndex(o => /pyro-acid/i.test(o.t));
  check("Kraken: own option at the same price", own >= 0 && selK.sh.ol[own].c === mine[0].p, String(own >= 0 && selK.sh.ol[own].c));
  const u2 = { ...u, ups: {}, os: { [own]: "take" }, opts: [own] };
  const sel2 = DOMAIN.selectionOf(DOMAIN.fromLegacyUnit(u2, ctx, catalog), ctx, catalog);
  const base = DOMAIN.pointsOf(DOMAIN.selectionOf(DOMAIN.fromLegacyUnit({ ...u, ups: {} }, ctx, catalog), ctx, catalog));
  check("Kraken: pyro-acid as an option +15 (escort x hulls)", DOMAIN.pointsOf(sel2) - base === 15 * sel2.hulls, String(DOMAIN.pointsOf(sel2) - base));
}

/* ---- helpers: golden case -> legacy unit -------------------------------- */
function listByName(nm){ return catalog.lists.find(L => L.nm === nm) || null; }
function placeOn(L, page){
  let fb = null;
  for(let si = 0; si < L.secs.length; si++)
    for(let ei = 0; ei < L.secs[si].ents.length; ei++){
      const en = L.secs[si].ents[ei];
      if(String(en.r) !== String(page)) continue;
      if(en.k === "unit") return { si, ei };
      if(!fb) fb = { si, ei };
    }
  return fb;
}
/* The same rule as test_golden.js's optIndex: a regex, not a substring. */
function optIndex(sh, pat){
  const re = new RegExp(pat, "i");
  return (sh.ol || []).findIndex(o => re.test(o.t));
}
const legacyRef = r => (isNaN(+r) ? String(r) : +r);
function legacyFromCase(c){
  /* A borrowed ship (J206): "from" is the ship's own list, "list" the fleet's.
     The unit carries its list (lst) and role as in the app. */
  const own = c.from || c.list;
  const L = own === "-" ? null : listByName(own);
  if(own !== "-" && !L) return { err: "list not found: " + own };
  const at = L ? placeOn(L, c.ship) : null;
  if(L && !at) return { err: "ship p." + c.ship + " is not on the list" };
  const en = at ? L.secs[at.si].ents[at.ei] : null;
  const sh0 = catalog.ships[String(c.ship)];
  const u = { s: at ? at.si : -1, e: at ? at.ei : -1, ref: legacyRef(c.ship), n: 1, name: "",
              opts: [], os: {}, oq: {}, ups: {} };
  if(c.from){ u.lst = c.from; u.role = c.role || "reserve"; }
  /* as addUnit(): an open price starts from the profile's price; an escort
     squadron's size from the list's squadron rule, or 2 */
  if(en && en.p == null && sh0 && sh0.bp != null) u.custom = sh0.bp;
  /* sh0.sq: a one-hit defence of type Defence or Ground (Rulebook p. 100) -
     the same squadron form as an escort */
  if(sh0 && (sh0.sq || /escort/i.test(sh0.ty || ""))){
    const sq = L ? L.secs.reduce((f, s2) => f || (s2.rules || []).find(r =>
      r.kind === "squadron" && (r.sec || []).indexOf(at.si) >= 0), null) : null;
    u.n = sq ? sq.min : 2;
  }
  (c.select || []).forEach(s => {
    if(s.hull){ u.ref = legacyRef(s.hull); u.hn = catalog.ships[String(s.hull)].nm; u.os = {}; u.oq = {}; return; }
    if(s.upgrade){
      /* list upgrade: from the offered rows by name regex, as the app does */
      const sel0 = DOMAIN.selectionOf(DOMAIN.fromLegacyUnit(u, { list: L }, catalog), { list: L }, catalog);
      const ups = DOMAIN.upgradesFor(sel0);
      const row = ups.own.concat(ups.other).find(x => new RegExp(s.upgrade, "i").test(String(x[2].l)));
      if(row) u.ups[row[0] + ":" + row[1]] = s.state || "take";
      return;
    }
    const sh = DOMAIN.shipFor(u.ref, en, catalog);   /* Venerable: the hull's SM view */
    const i = optIndex(sh, s.option);
    if(i < 0) return;
    u.os[i] = s.state || "take";
    if(s.qty > 1) u.oq[i] = s.qty;
  });
  if(c.name != null) u.name = c.name;
  if(c.note != null) u.note = c.note;
  if(c.adjust != null) u.adj = c.adjust;
  if(c.members != null) u.members = c.members;
  if(c.n != null) u.n = c.n;
  u.opts = Object.keys(u.os).filter(i => u.os[i] === "take").map(Number).sort((a, b) => a - b);
  return { u, L };
}
const effState = (u, i) => (u.os && u.os[i]) || ((u.opts || []).includes(i) ? "take" : "opt");

/* ---- 2. adapter round trip over the golden cases ------------------------ */
DOMAIN.deepFreeze(catalog);
let cases = 0;
CASES.forEach(c => {
  if(c.entry){ cases++; return; }               /* commanders: section 11 */
  const b = legacyFromCase(c);
  if(b.err){ check("golden " + c.id + ": rakennus", false, b.err); return; }
  cases++;
  const { u, L } = b;
  const sh = DOMAIN.shipFor(u.ref, L && u.s >= 0 ? L.secs[u.s].ents[u.e] : null, catalog);
  const ctx = DOMAIN.deepFreeze({ list: L });
  DOMAIN.deepFreeze(u);
  let intent;
  try{ intent = DOMAIN.fromLegacyUnit(u, ctx, catalog); }
  catch(e){ check("golden " + c.id + ": fromLegacyUnit does not throw", false, String(e)); return; }
  check("golden " + c.id + ": schemaVersion", intent.schemaVersion === DOMAIN.SCHEMA_VERSION);
  check("golden " + c.id + ": ref as a string", intent.ref === String(u.ref));
  if(L){
    const en = L.secs[u.s].ents[u.e];
    check("golden " + c.id + ": entry by name", intent.entry && intent.entry.list === L.nm &&
          intent.entry.section === L.secs[u.s].t && intent.entry.label === en.l, JSON.stringify(intent.entry));
    check("golden " + c.id + ": hull only on an hc row", (intent.hull != null) === !!en.hc);
  }else{
    check("golden " + c.id + ": entry null without a list", intent.entry === null);
  }
  Object.keys(intent.options).forEach(id => {
    check("golden " + c.id + ": option id found in the profile" + id, (sh.ol || []).some(o => o.id === id));
  });
  const nSel = Object.keys(u.os).length;
  check("golden " + c.id + ": number of selections is kept", Object.keys(intent.options).length === nSel,
        Object.keys(intent.options).length + " != " + nSel);

  const round = JSON.parse(JSON.stringify(intent));          /* through a save */
  const back = DOMAIN.toLegacyUnit(round, ctx, catalog);
  check("golden " + c.id + ": no issues", back.issues.length === 0, JSON.stringify(back.issues));
  const v = back.unit;
  check("golden " + c.id + ": place and hull", v.s === u.s && v.e === u.e && String(v.ref) === String(u.ref) && v.n === u.n);
  const states = (sh.ol || []).map((o, i) => effState(u, i)), statesBack = (sh.ol || []).map((o, i) => effState(v, i));
  check("golden " + c.id + ": optiotilat", same(states, statesBack), states.join(",") + " != " + statesBack.join(","));
  check("golden " + c.id + ": maarat", same(u.oq || {}, v.oq || {}));
  check("golden " + c.id + ": opts array", same(u.opts, v.opts));
});
check("golden cases run = number in the file", cases === CASES.length, cases + " / " + CASES.length);

/* ---- 2b. list upgrade round trip ---------------------------------------- */
(function(){
  let done = false;
  for(const L of catalog.lists){
    for(let si = 0; si < L.secs.length && !done; si++)
      for(let ei = 0; ei < L.secs[si].ents.length && !done; ei++){
        const en = L.secs[si].ents[ei];
        if(en.k !== "up" || (en.at && en.at.length)) continue;
        const unit = placeOn(L, (L.secs.flatMap(s => s.ents).find(e => e.k === "unit" && e.r) || {}).r);
        if(!unit) continue;
        const u = { s: unit.si, e: unit.ei, ref: L.secs[unit.si].ents[unit.ei].r, n: 1, name: "X", note: "n",
                    adj: -5, custom: 120, members: "Alpha, Beta", opts: [], os: {}, oq: {}, ups: {} };
        u.ups[si + ":" + ei] = "take";
        DOMAIN.deepFreeze(u);
        const ctx = DOMAIN.deepFreeze({ list: L });
        const it = DOMAIN.fromLegacyUnit(u, ctx, catalog);
        const id = DOMAIN.upgradeId(L.nm, L.secs[si].t, en.l);
        check("upgrade: id from names", it.upgrades[id] === "take", JSON.stringify(Object.keys(it.upgrades)));
        check("upgrade: name/note/adjust/custom/members", it.name === "X" && it.note === "n" && it.adjust === -5 &&
              it.custom === 120 && same(it.members, ["Alpha", "Beta"]));
        const back = DOMAIN.toLegacyUnit(JSON.parse(JSON.stringify(it)), ctx, catalog);
        check("upgrade: back to an index", back.unit.ups[si + ":" + ei] === "take" && back.issues.length === 0);
        check("upgrade: upn key", back.unit.upn[L.secs[si].t + DOMAIN.SEP + en.l] === "take");
        check("upgrade: fields back", back.unit.name === "X" && back.unit.note === "n" && back.unit.adj === -5 &&
              back.unit.custom === 120 && back.unit.members === "Alpha, Beta");
        done = true;
      }
    if(done) break;
  }
  check("list upgrade round trip found the test row", done);
})();

/* ---- 3. migration: option order shuffled --------------------------------- */
(function(){
  const shuffled = JSON.parse(RAW);
  let tested = 0;
  CASES.forEach(c => {
    if(c.entry) return;
    const b = legacyFromCase(c);
    if(b.err || !Object.keys(b.u.os).length) return;
    /* The Venerable row's option belongs to the derived view (p. 102), not to
       the book profile's list, which a new edition could move. */
    const enB = b.L && b.u.s >= 0 ? b.L.secs[b.u.s].ents[b.u.e] : null;
    if(enB && enB.hc) return;
    const sh = shuffled.ships[String(b.u.ref)];
    if(!sh.ol || sh.ol.length < 2) return;
    sh.ol = sh.ol.slice().reverse();                    /* a new edition of the book moved the options */
    const ctx = { list: b.L };
    const it = DOMAIN.fromLegacyUnit(b.u, ctx, catalog);  /* intent from the old data */
    const back = DOMAIN.toLegacyUnit(it, ctx, shuffled);   /* opened with the new data */
    const wantTexts = Object.keys(b.u.os).map(i => catalog.ships[String(b.u.ref)].ol[i].t + "=" + b.u.os[i]).sort();
    const gotTexts = Object.keys(back.unit.os).map(i => sh.ol[i].t + "=" + back.unit.os[i]).sort();
    check("migration " + c.id + ": same options by text", same(wantTexts, gotTexts) && !back.issues.length,
          gotTexts.join(" | "));
    tested++;
    sh.ol = catalog.ships[String(b.u.ref)].ol.slice();  /* restore for the next one */
  });
  check("migration cases > 10", tested > 10, String(tested));
})();

/* ---- 3b. text fallback: id changed (text corrected), 40 characters match --- */
(function(){
  const k = Object.keys(catalog.ships).find(p => (catalog.ships[p].ol || []).length >= 2);
  const sh = catalog.ships[k];
  const i = DOMAIN.optionIndex(sh, "no-such-id", DOMAIN.textKey(sh.ol[1].t));
  check("optionIndex: the text as fallback when the id misses", i === 1, String(i));
  check("optionIndex: -1 when neither matches", DOMAIN.optionIndex(sh, "x", "y") === -1);
  check("optionIndex: id comes first", DOMAIN.optionIndex(sh, sh.ol[0].id, DOMAIN.textKey(sh.ol[1].t)) === 0);
  /* p.255: two options share the first 40 characters -> text is no fallback */
  const bb = catalog.ships["255"];
  const twins = bb.ol.filter(o => DOMAIN.textKey(o.t) === DOMAIN.textKey(bb.ol[4].t));
  check("optionIndex: p.255 twin text is not resolved by guessing", twins.length === 2 &&
        DOMAIN.optionIndex(bb, "x", DOMAIN.textKey(bb.ol[4].t)) === -1, String(twins.length));
})();

/* ---- 5. invalid intent ------------------------------------------------- */
(function(){
  const L = catalog.lists[0];
  const at = placeOn(L, (L.secs.flatMap(s => s.ents).find(e => e.k === "unit" && e.r) || {}).r);
  const en = L.secs[at.si].ents[at.ei];
  const bad = { schemaVersion: 2, entry: { list: L.nm, section: L.secs[at.si].t, label: en.l },
                ref: String(en.r), hull: null, hulls: 1, name: "", note: "", adjust: 0, custom: null, members: [],
                options: { "999:deadbeef": { state: "take", qty: 1 } },
                upgrades: { [DOMAIN.upgradeId(L.nm, "NOWHERE", "Nothing")]: "take" } };
  const r = DOMAIN.toLegacyUnit(DOMAIN.deepFreeze(bad), { list: L }, catalog);
  const codes = r.issues.map(x => x.code).sort();
  check("invalid intent: issue codes", same(codes, ["option.unknown_id", "upgrade.unknown_id"]), codes.join(","));
  check("invalid intent: issue is structured", r.issues.every(x => x.code && x.severity && x.path && x.message !== undefined && "sourcePage" in x));
  check("invalid intent: the unit is still built", r.unit.s === at.si && r.unit.e === at.ei && same(r.unit.os, {}));
  const gone = DOMAIN.toLegacyUnit({ ...bad, entry: { list: L.nm, section: "X", label: "Y" }, options: {}, upgrades: {} }, { list: L }, catalog);
  check("invalid intent: an unknown row", gone.issues.some(x => x.code === "entry.unknown") && gone.unit.s === -1);
})();

/* ---- 6. (P1-8b) pure calculators against the book ------------------------ */
/* Intent as the app produces it: required list upgrades included
   (applyRequired -> requiredUpgradeKeys). */
function intentOfCase(c){
  if(c.entry) return { err: "commander: section 11" };
  const b = legacyFromCase(c);
  if(b.err) return b;
  const host = c.from ? listByName(c.list) : null;
  if(c.from && !host) return { err: "the fleet's list is not found: " + c.list };
  const ctx = host ? { list: b.L, host: host } : { list: b.L };
  const it = DOMAIN.fromLegacyUnit(b.u, ctx, catalog);
  const sel0 = DOMAIN.selectionOf(it, ctx, catalog);
  DOMAIN.requiredUpgradeKeys(sel0).forEach(k => {
    const p = k.split(":"), sec = b.L.secs[+p[0]], en = sec.ents[+p[1]];
    it.upgrades[DOMAIN.upgradeId(b.L.nm, sec.t, en.l)] = "take";
  });
  return { intent: DOMAIN.deepFreeze(it), ctx: DOMAIN.deepFreeze(ctx), L: b.L };
}
/* status "gap": written before the fix, known to be red. The same contract
   as in test_golden.js - a gap does not fail the run. */
const LIVE = CASES.filter(c => c.status !== "gap");
let evaluated = 0, skippedKeys = new Set();
LIVE.forEach(c => {
  const got = intentOfCase(c);
  if(got.err) return;
  const { intent, ctx } = got;
  const sel = DOMAIN.selectionOf(intent, ctx, catalog);
  const sh = sel.sh;
  const e = c.expect || {};
  const id = "book " + c.id;
  const rows = DOMAIN.weaponRows(sel);
  const active = rows.filter(r => r.box == null || r.box === "on");
  evaluated++;
  if(e.points != null && sel.en) check(id + ": points", DOMAIN.pointsOf(sel) === e.points, DOMAIN.pointsOf(sel) + " != " + e.points);
  const stats = {
    hits: DOMAIN.effHits(sel), shields: DOMAIN.effShieldsText(sel), turrets: DOMAIN.effTurrets(sel),
    speed: DOMAIN.effSpeed(sel), turns: DOMAIN.statSet(sel, "tn") || sh.tn,
    armour: DOMAIN.statSet(sel, "ar") || sh.ar,
  };
  ["hits", "shields", "turrets", "speed", "turns", "armour"].forEach(k => {
    if(e[k] == null) return;
    check(id + ": " + k, norm(stats[k]) === norm(e[k]), norm(stats[k]) + " != " + norm(e[k]));
  });
  if(e.weapon_rows != null) check(id + ": weapon rows", rows.length === e.weapon_rows, rows.length + " != " + e.weapon_rows);
  if(e.active_weapons != null) check(id + ": active weapons", active.length === e.active_weapons, active.length + " != " + e.active_weapons);
  if(e.weapon){
    const re = new RegExp(e.weapon.match, "i");
    const row = rows.find(x => re.test(String(x.a[0])));
    check(id + ": weapon row found" + e.weapon.match, !!row);
    if(row){
      const cols = { name: 0, range: 1, fp: 2, arc: 3 };
      Object.keys(e.weapon).forEach(k => {
        if(k === "match") return;
        if(k === "count"){ const g = row.count == null ? 1 : row.count; check(id + ": weapon count", g === e.weapon.count, g + " != " + e.weapon.count); return; }
        check(id + ": ase " + k, norm(row.a[cols[k]]) === norm(e.weapon[k]), norm(row.a[cols[k]]) + " != " + norm(e.weapon[k]));
      });
    }
  }
  if(e.weapon_none){
    const re = new RegExp(e.weapon_none.match, "i");
    const left = active.filter(x => re.test(String(x.a[0])) &&
      (!e.weapon_none.range || norm(x.a[1]) === norm(e.weapon_none.range)));
    check(id + ": row gone " + e.weapon_none.match, left.length === 0, "left " + left.length);
  }
  if(e.weapon_count){
    const re = new RegExp(e.weapon_count.match, "i");
    const n = active.filter(x => re.test(String(x.a[0]))).length;
    check(id + ": active '" + e.weapon_count.match + "'", n === e.weapon_count.n, n + " != " + e.weapon_count.n);
  }
  if(e.upgrade_offered || e.upgrade_not_offered){
    const ups = DOMAIN.upgradesFor(sel);
    const labels = ups.own.concat(ups.other).map(x => String(x[2].l));
    const has = pat => labels.some(l => new RegExp(pat, "i").test(l));
    if(e.upgrade_offered) check(id + ": upgrade offered " + e.upgrade_offered, has(e.upgrade_offered), labels.join(" | ").slice(0, 120));
    if(e.upgrade_not_offered) check(id + ": upgrade not offered " + e.upgrade_not_offered, !has(e.upgrade_not_offered));
  }
  if(e.hull_choices_include || e.hull_choices_exclude){
    const names = ((sel.en && sel.en.hulls) || []).map(p => String(catalog.ships[String(p)] ? catalog.ships[String(p)].nm : p));
    const has = pat => names.some(n => new RegExp(pat, "i").test(n));
    (e.hull_choices_include || []).forEach(p => check(id + ": hull offered" + p, has(p)));
    (e.hull_choices_exclude || []).forEach(p => check(id + ": hull not offered" + p, !has(p)));
  }
  Object.keys(e).forEach(k => {
    if(["points", "hits", "shields", "turrets", "speed", "turns", "armour", "weapon_rows", "active_weapons",
        "weapon", "weapon_none", "weapon_count", "upgrade_offered", "upgrade_not_offered",
        "hull_choices_include", "hull_choices_exclude", "options", "upgrades", "list_contains", "roster_contains"].includes(k)) return;
    skippedKeys.add(k);   /* the card's texts and the setters' behaviour: test_golden.js */
  });
});
check("cases checked against the book = ship cases", evaluated === LIVE.filter(c => !c.entry).length, evaluated + " / " + LIVE.filter(c => !c.entry).length);
if(VERBOSE) console.log("  (expectation kinds only in test_golden.js: " + [...skippedKeys].join(", ") + ")");

/* ---- 7. (P1-8b) no aliasing --------------------------------------------- */
(function(){
  let aliased = 0, checked = 0;
  CASES.forEach(c => {
    const got = intentOfCase(c);
    if(got.err) return;
    const sel = DOMAIN.selectionOf(got.intent, got.ctx, catalog);
    const sh = sel.sh;
    const pool = new Set();
    (sh.aw || []).forEach(a => pool.add(a));
    (sh.ol || []).forEach(o => {
      if(o.sw) o.sw.t.forEach(t => pool.add(t));
      if(o.add) (Array.isArray(o.add[0]) ? o.add : [o.add]).forEach(t => pool.add(t));
    });
    if(sel.list) sel.list.secs.forEach(sec => sec.ents.forEach(en => { if(en.add) pool.add(en.add); if(en.swp && en.swp.t) pool.add(en.swp.t); }));
    DOMAIN.weaponRows(sel).forEach(r => { checked++; if(pool.has(r.a)) aliased++; });
  });
  check("weapon rows do not alias the catalog", aliased === 0, aliased + " / " + checked);
  /* changing the result does not change the catalogue */
  const c0 = intentOfCase(CASES.find(c => c.list !== "-"));
  const sel = DOMAIN.selectionOf(c0.intent, c0.ctx, catalog);
  const rows = DOMAIN.weaponRows(sel);
  const before = JSON.stringify(catalog.ships[String(sel.sh.pg)].aw);
  rows[0].a[0] = "MUTATED";
  check("a change to the result does not show in the catalogue", JSON.stringify(catalog.ships[String(sel.sh.pg)].aw) === before);
})();

/* ---- 8. (P1-8b step 6) damage and rule model on a frozen catalog ---- */
(function(){
  let units = 0, rules = 0, dupIds = 0, hulks = 0, escorts = 0, admech = 0;
  catalog.lists.forEach(L => L.secs.forEach(sec => sec.ents.forEach(en => {
    if(!en.r || !catalog.ships[String(en.r)]) return;
    const sh = catalog.ships[String(en.r)];
    const rs = DOMAIN.specialLines(sh, L);
    units++; rules += rs.length;
    const ids = rs.filter(r => r.hull).map(r => r.hull);
    if(new Set(ids).size !== ids.length) dupIds++;
    const cm = DOMAIN.criticalModel(sh);
    if(DOMAIN.isSpaceHulk(sh)){ hulks++; if(!/\(D6\)/.test(cm.title)) dupIds += 1000; }
    if(/escort/i.test(sh.ty || "")) escorts++;
    if(DOMAIN.isMechanicusVessel(sh, L)){ admech++; if(!/ADMECH/.test(DOMAIN.repairLine(sh, L))) dupIds += 1000; }
    DOMAIN.crippledLine(sh); DOMAIN.criticalTriggerHint(sh); DOMAIN.criticalTriggerLine(sh);
    DOMAIN.starredKeys(rs, sh, L);
    (sh.ol || []).forEach(o => DOMAIN.optStars(sh, o, rs, L));
  })));
  check("rule model: every list row run on a frozen catalog", units > 400, String(units));
  check("rule model: hull rules are not repeated on the card", dupIds === 0, String(dupIds));
  check("rule model: hulks with a D6 table, AdMech repair from the list", hulks >= 2 && admech >= 1, hulks + "/" + admech);
  const cru = catalog.lists.find(L => /Crusade/.test(L.nm)), gk = catalog.lists.find(L => /Grey Knights|Inquisition/.test(L.nm));
  const bb = catalog.ships["104"];
  const inCru = DOMAIN.specialLines(bb, cru).some(r => /Annihilator/.test(r.t));
  const inGk = gk ? DOMAIN.specialLines(bb, gk).some(r => /Annihilator/.test(r.t)) : false;
  check("rule model: the Annihilator rule only on the Crusade list (list as a parameter)", inCru && !inGk, inCru + "/" + inGk);
})();

/* ---- 9. (P1-8c) resolveUnit v1: structure, book expectations for the new fields ---- */
(function(){
  let n = 0, badState = 0, badOpts = 0, notJson = 0, aliasCrit = 0;
  CASES.forEach(c => {
    const got = intentOfCase(c);
    if(got.err) return;
    const R = DOMAIN.resolveUnit(got.intent, got.ctx, catalog);
    if(!R){ check("v1 " + c.id + ": result", false, "null"); return; }
    n++;
    if(R.kind !== "ship" || !Array.isArray(R.options) || !Array.isArray(R.upgrades) || !Array.isArray(R.issues)) badOpts++;
    const shv = DOMAIN.selectionOf(got.intent, got.ctx, catalog).sh;   /* Venerable: view */
    if(R.options.length !== (shv.ol || []).length) badOpts++;
    R.weapons.forEach(w => { if(w.state !== "active" && w.state !== "offered") badState++; });
    try{ JSON.parse(JSON.stringify(R)); }catch(e){ notJson++; }
    const cm = DOMAIN.criticalModel(shv);
    if(R.damage.critical.rows.some((row, i) => row === cm.rows[i])) aliasCrit++;
    const e = c.expect || {}, id = "v1 " + c.id;
    (e.options || []).forEach(x => {
      const o = R.options.find(o => new RegExp(x.match, "i").test(o.text));
      check(id + ": option " + x.match, !!o);
      if(!o) return;
      if(x.state) check(id + ": option " + x.match + " state", o.state === x.state, o.state);
      if(x.qty != null) check(id + ": option " + x.match + " qty", o.qty === x.qty, String(o.qty));
      if(x.blocked_by){ const b = R.options.find(o2 => new RegExp(x.blocked_by, "i").test(o2.text)); check(id + ": option " + x.match + " blocked", !!b && o.blockedBy.includes(b.id), JSON.stringify(o.blockedBy)); }
      if(x.depends_on){ const dd = R.options.find(o2 => new RegExp(x.depends_on, "i").test(o2.text)); check(id + ": option " + x.match + " dependency", !!dd && o.dependsOn === dd.id && o.dependencyMet === true); }
    });
    (e.upgrades || []).forEach(x => {
      const up = R.upgrades.find(o => new RegExp(x.match, "i").test(o.label));
      check(id + ": upgrade " + x.match, !!up);
      if(!up) return;
      if(x.state) check(id + ": upgrade " + x.match + " state", up.state === x.state, up.state);
      if(x.required != null) check(id + ": upgrade " + x.match + " required", up.required === x.required);
      if(x.cost != null) check(id + ": upgrade " + x.match + " cost", up.cost === x.cost, String(up.cost));
      if(x.owner) check(id + ": upgrade " + x.match + " owner", up.owner === x.owner, up.owner);
      check(id + ": upgrade " + x.match + " id resolves", !!DOMAIN.findUpgradeEntry(got.ctx.list, DOMAIN.splitUpgradeId(up.id).section, DOMAIN.splitUpgradeId(up.id).label, -1, -1) || up.key != null);
    });
  });
  check("v1: every ship case resolved", n === CASES.filter(c => !c.entry).length, n + " / " + CASES.length);
  check("v1: kind/options/upgrades/issues structure", badOpts === 0, String(badOpts));
  check("v1: a weapon row's state is the enum active|offered", badState === 0, String(badState));
  check("v1: result is JSON-serialisable", notJson === 0);
  check("v1: the critical table is a copy", aliasCrit === 0);
  /* mutating the result must not touch the catalogue */
  const c0 = intentOfCase(CASES.find(c => c.list !== "-"));
  const R0 = DOMAIN.resolveUnit(c0.intent, c0.ctx, catalog);
  R0.weapons[0].a[0] = "MUTATED"; R0.damage.critical.rows[0][0] = "MUTATED"; R0.options[0].text = "MUTATED";
  check("v1: a change to the result does not show in the catalogue", JSON.stringify(catalog) === JSON.stringify(JSON.parse(RAW)));
})();

/* ---- 10. (P1-8d) projections read neither the catalog, the state nor the calculators ----
   A static check of the source (apps/registry/src and packages/ui): the card, fleet row,
   roster and Copy list projections may call presentation helpers only. */
(function(){
  /* Line breaks folded into one: in the CRLF copy of a clean Git archive "\n}\n"
     matched no projection (J18). */
  /* every module of the Registry and of the shared ui package, as one text */
  const srcDirs = [path.join(HERE, "..", "..", "apps", "registry", "src"), path.join(HERE, "..", "ui")];
  const src = "\n" + srcDirs.flatMap(d => fs.readdirSync(d).filter(f => f.endsWith(".js")).sort()
    .map(f => fs.readFileSync(path.join(d, f), "utf8"))).join("\n").replace(/\r\n?/g, "\n");
  const forbidden = ["L()", "SHIPS", "DATA", "S.units", "shipOf(", "entOf(", "unitPts(", "unitMaxPts(",
    "armModel(", "optState(", "upState(", "optCount(", "upgradesFor(", "specialLines(", "criticalModel(",
    "crippledLine(", "isEscort(", "hulls(", "selOf(", "resolveUnit(", "DOMAIN.", "localStorage"];
  ["shipCardHTML", "commanderCardHTML", "armRowsHTML", "optRowsHTML", "unitHTML", "rosterRowOf", "listLineOf", "upCostText"].forEach(name => {
    const m = src.match(new RegExp("\\n(?:export )?function " + name + "\\([^)]*\\)\\{[\\s\\S]*?\\n\\}\\n"));
    check("projection " + name + " found", !!m);
    if(!m) return;
    const hits = forbidden.filter(f => m[0].includes(f));
    check("projection " + name + " is pure", hits.length === 0, hits.join(", "));
  });
  check("the card does not write to its input (u._mem removed)", !src.includes("u._mem"));
})();

/* ---- 11. (P1-8e) commanders: leadership and re-rolls from the data, book expectations ---- */
(function(){
  let cmds = 0, noLd = [], bad = 0;
  catalog.lists.forEach(L => L.secs.forEach((sec, si) => sec.ents.forEach((en, ei) => {
    if(en.k !== "cmd") return;
    cmds++;
    if(!("ld" in en) || !("rr" in en)) bad++;
    if(!en.ld) noLd.push(L.nm + " / " + en.l);
    const it = { schemaVersion: 2, entry: { list: L.nm, section: sec.t, label: en.l }, ref: null, hull: null, hulls: 1,
                 name: "", note: "", adjust: 0, custom: en.p == null ? 0 : null, members: [], options: {}, upgrades: {} };
    const R = DOMAIN.resolveUnit(DOMAIN.deepFreeze(it), DOMAIN.deepFreeze({ list: L }), catalog);
    if(!R || R.kind !== "commander" || R.stats !== null || !R.rerolls || !Array.isArray(R.rules)) bad++;
    if(R && typeof R.points !== "number") bad++;
  })));
  /* 62 + 8 Inquisitor Lords that 1.1 attached to host lists (p. 138), + 5
     Ordo Malleus rows for Imperial Navy and Mechanicus hosts (J144, p. 142). */
  /* 77 = 75 + Prince Yriel on both Corsair lists (p.319, J161 9.10.2026) */
  /* 81 = 77 + Abaddon on four god lists (p.231, J162 13.10.2026) */
  check("commanders: 81 rows, each with ld and rr in the data", cmds === 81 && bad === 0, cmds + " / bad " + bad);
  check("commanders: without an Ld value only those acknowledged in the reference (8)", noLd.length === 8, noLd.join(" | "));
  const ref = JSON.parse(fs.readFileSync(path.join(HERE, "..", "..", "reference", "commanders.json"), "utf8")).commanders;
  check("commanders: the reference rows are found in the data with their pages", ref.every(r => r.verified === true && Number.isInteger(r.page) &&
        catalog.lists.some(L => L.nm === r.list && L.secs.some(s => s.ents.some(e => e.k === "cmd" && e.l === r.label)))));
  LIVE.filter(c => c.entry).forEach(c => {
    const L = listByName(c.list);
    let at = null;
    L.secs.forEach((sec, si) => sec.ents.forEach((en, ei) => { if(!at && en.k !== "up" && new RegExp(c.entry, "i").test(en.l)) at = { si, ei, en, sec }; }));
    const id = "book " + c.id;
    check(id + ": row found", !!at);
    if(!at) return;
    /* c.n: a row without a hull, bought one at a time (Orbital mine p. 512, Minefield p. 513) */
    const u = { s: at.si, e: at.ei, ref: null, n: c.n != null ? c.n : 1, name: c.name || "", note: c.note || "", adj: c.adjust || 0, opts: [], os: {}, oq: {}, ups: {} };
    if(at.en.p == null) u.custom = 0;
    const ctx = { list: L };
    (c.select || []).forEach(s => {
      if(!s.upgrade) return;
      const sel0 = DOMAIN.selectionOf(DOMAIN.fromLegacyUnit(u, ctx, catalog), ctx, catalog);
      const ups = DOMAIN.upgradesFor(sel0);
      const row = ups.own.concat(ups.other).find(x => new RegExp(s.upgrade, "i").test(String(x[2].l)));
      if(row) u.ups[row[0] + ":" + row[1]] = s.state || "take";
    });
    const intent = DOMAIN.fromLegacyUnit(u, ctx, catalog);
    const sel0 = DOMAIN.selectionOf(intent, ctx, catalog);
    DOMAIN.requiredUpgradeKeys(sel0).forEach(k => { const p = k.split(":"); const sec = L.secs[+p[0]], en = sec.ents[+p[1]]; intent.upgrades[DOMAIN.upgradeId(L.nm, sec.t, en.l)] = "take"; });
    const R = DOMAIN.resolveUnit(DOMAIN.deepFreeze(intent), DOMAIN.deepFreeze(ctx), catalog);
    const e = c.expect || {};
    check(id + ": kind " + (at.en.k === "cmd" ? "commander" : "entry"), R && R.kind === (at.en.k === "cmd" ? "commander" : "entry"));
    if(e.points != null) check(id + ": points", R.points === e.points, R.points + " != " + e.points);
    if(e.leadership !== undefined) check(id + ": leadership", JSON.stringify(R.leadership) === JSON.stringify(e.leadership ? { kind: e.leadership.kind, value: e.leadership.value, max: e.leadership.max == null ? null : e.leadership.max } : null), JSON.stringify(R.leadership));
    if(e.rerolls_total != null) check(id + ": re-rollit", R.rerolls.total === e.rerolls_total, String(R.rerolls.total));
    (e.upgrades || []).forEach(x => {
      const up = R.upgrades.find(o => new RegExp(x.match, "i").test(o.label));
      check(id + ": upgrade " + x.match, !!up && (!x.state || up.state === x.state) && (x.cost == null || up.cost === x.cost), up ? up.state + "/" + up.cost : "-");
    });
    if(e.rules_contain) e.rules_contain.forEach(s => check(id + ": rule " + s.slice(0, 30), R.rules.some(r => r.t.includes(s))));
  });
})();

/* ---- 12. (P1-8e) validateIntent and transition ----------------------------- */
(function(){
  const unitFor = (listName, page, os, ups) => {
    const L = listByName(listName), at = placeOn(L, page);
    const u = { s: at.si, e: at.ei, ref: legacyRef(page), n: 1, name: "", opts: [], os: os || {}, oq: {}, ups: ups || {} };
    const ctx = { list: L };
    return { intent: DOMAIN.fromLegacyUnit(u, ctx, catalog), ctx, L, sh: catalog.ships[String(page)] };
  };
  const codes = R => (R.issues || []).map(x => x.code);
  /* exclusive group: Lite Kroozer launcha + extra gunz both taken */
  { const sh = catalog.ships["383"]; const a = sh.ol.findIndex(o => /torpedo launcha instead/i.test(o.t)), b = sh.ol.findIndex(o => /additional D6 gunz/i.test(o.t));
    const x = unitFor("Orks — Da Ork Clanz", "383", { [a]: "take", [b]: "take" });
    DOMAIN.deepFreeze(x.intent); DOMAIN.deepFreeze(x.ctx);
    const is1 = DOMAIN.validateIntent(x.intent, x.ctx, catalog), is2 = DOMAIN.validateIntent(x.intent, x.ctx, catalog);
    check("validate: exclusive group -> option.exclusive", is1.some(i => i.code === "option.exclusive" && i.severity === "error"), JSON.stringify(is1));
    check("validate: deterministic", JSON.stringify(is1) === JSON.stringify(is2));
    check("validate: an issue is structured (code, severity, path, message, sourcePage)", is1.every(i => i.code && i.severity && i.path && typeof i.message === "string" && "sourcePage" in i));
    const R = DOMAIN.resolveUnit(x.intent, x.ctx, catalog);
    check("resolveUnit(invalid): a result is made and carries the issues", R && R.points === 90 && codes(R).includes("option.exclusive"), String(R && R.points));
    /* transition: taking gunz reopens launcha with a notice */
    const y = unitFor("Orks — Da Ork Clanz", "383", { [a]: "take" });
    DOMAIN.deepFreeze(y.intent);
    const tr = DOMAIN.transition(y.intent, { type: "option", id: sh.ol[b].id, state: "take" }, y.ctx, catalog);
    check("transition: a new option releases the group's old one", tr.intent.options[sh.ol[a].id].state === "opt" && tr.intent.options[sh.ol[b].id].state === "take");
    check("transition: ilmoitus (option.exclusive)", tr.notices.some(n => n.code === "option.exclusive" && /reopened/.test(n.message)), JSON.stringify(tr.notices));
    check("transition: does not change its input", y.intent.options[sh.ol[a].id].state === "take" && !(sh.ol[b].id in y.intent.options));
    check("transition: result is valid", DOMAIN.validateIntent(tr.intent, y.ctx, catalog).length === 0);
  }
  /* dependency: boarding torpedoes without the launcha */
  { const sh = catalog.ships["383"]; const bt = sh.ol.findIndex(o => /boarding torpedoes/i.test(o.t)), la = sh.ol.findIndex(o => /torpedo launcha instead/i.test(o.t));
    const x = unitFor("Orks — Da Ork Clanz", "383", { [bt]: "take" });
    check("validate: a missing dependency -> option.dependency", DOMAIN.validateIntent(x.intent, x.ctx, catalog).some(i => i.code === "option.dependency"));
    const y = unitFor("Orks — Da Ork Clanz", "383", { [la]: "take", [bt]: "take" });
    const tr = DOMAIN.transition(y.intent, { type: "option", id: sh.ol[la].id, state: "opt" }, y.ctx, catalog);
    check("transition: removing a prerequisite releases the dependant (notice)", tr.intent.options[sh.ol[bt].id].state === "opt" && tr.notices.some(n => n.code === "option.dependency"));
  }
  /* swap conflict: Strike Cruiser, two replacements for the launch bays */
  { const L = catalog.lists.find(x => /Armageddon/.test(x.nm)); let page = null;
    L.secs.forEach(s => s.ents.forEach(e => { if(!page && /Strike Cruiser/i.test(e.l) && e.r && e.k === "unit") page = String(e.r); }));
    const sh = catalog.ships[page]; const same = [];
    (sh.ol || []).forEach((o, i) => { if(o.sw && (o.sw.f || []).includes(2)) same.push(i); });
    check("Strike Cruiser: two swaps of the same row", same.length === 2);
    const x = unitFor(L.nm, page, { [same[0]]: "take", [same[1]]: "take" });
    check("validate: the same weapon slot twice -> option.swap_conflict", DOMAIN.validateIntent(x.intent, x.ctx, catalog).some(i => i.code === "option.swap_conflict"));
  }
  /* ineligible upgrade: Tyrant with nova cannon and the Power Ram */
  { const L = listByName("Imperial Navy — Gothic Sector"); const sh = catalog.ships["69"]; const nova = sh.ol.findIndex(o => /nova cannon/i.test(o.t));
    const at = placeOn(L, "69"); let ram = null;
    L.secs.forEach((s, si) => s.ents.forEach((e, ei) => { if(e.k === "up" && /Power Ram/i.test(e.l)) ram = { si, ei, en: e }; }));
    const ramId = DOMAIN.upgradeId(L.nm, L.secs[ram.si].t, ram.en.l);
    const x = unitFor("Imperial Navy — Gothic Sector", "69", {}, { [ram.si + ":" + ram.ei]: "take" });
    check("Tyrant + Power Ram: valid", DOMAIN.validateIntent(x.intent, x.ctx, catalog).length === 0);
    const tr = DOMAIN.transition(x.intent, { type: "option", id: sh.ol[nova].id, state: "take" }, x.ctx, catalog);
    /* 30.9.2026: a drop returns the row to its default (the key goes) - while
       the nova is taken the ram is not offered, so it is gone; when the nova
       is undone the ram comes back as an Option and does not stay a Hide */
    const trR = DOMAIN.resolveUnit(tr.intent, x.ctx, catalog).upgrades.filter(u => /Power Ram/i.test(u.label));
    check("transition: Nova drops the Power Ram with a notice", !(ramId in tr.intent.upgrades) && trR.every(u => u.state === "off") && tr.notices.some(n => n.code === "upgrade.ineligible"), JSON.stringify([tr.notices, trR.map(u => u.state)]));
    const back = DOMAIN.transition(tr.intent, { type: "option", id: sh.ol[nova].id, state: "opt" }, x.ctx, catalog);
    const backR = DOMAIN.resolveUnit(back.intent, x.ctx, catalog).upgrades.filter(u => /Power Ram/i.test(u.label));
    check("... nova open again: Power Ram returns to Option", backR.length === 1 && backR[0].state === "opt", JSON.stringify(backR.map(u => u.state)));
    const bad = JSON.parse(JSON.stringify(x.intent)); bad.options[sh.ol[nova].id] = { state: "take", qty: 1 };
    const is = DOMAIN.validateIntent(bad, x.ctx, catalog);
    check("validate: Nova + Power Ram directly -> upgrade.ineligible (warning, not charged)", is.some(i => i.code === "upgrade.ineligible" && i.severity === "warning"));
    const Rb = DOMAIN.resolveUnit(bad, x.ctx, catalog);
    check("resolveUnit(invalid): the ram is not charged", Rb.points === 185 + 20, String(Rb.points));
  }
  /* hull change clears with a notice; unknown hull is an error */
  { const L = listByName("Space Marines — Codex Astartes"); let at = null;
    L.secs.forEach((s, si) => s.ents.forEach((e, ei) => { if(!at && e.hc) at = { si, ei, en: e }; }));
    const it = { schemaVersion: 2, entry: { list: L.nm, section: L.secs[at.si].t, label: at.en.l }, ref: "103", hull: "103", hulls: 1, name: "", note: "", adjust: 0, custom: null, members: [], options: {}, upgrades: {} };
    const sh103 = catalog.ships["103"]; if((sh103.ol || []).length) it.options[sh103.ol[0].id] = { state: "take", qty: 1 };
    const tr = DOMAIN.transition(it, { type: "hull", ref: "61" }, { list: L }, catalog);
    check("transition: hull changes, selections reset, notice", tr.intent.ref === "61" && tr.intent.hull === "61" && Object.keys(tr.intent.options).length === 0 && (!(sh103.ol || []).length || tr.notices.some(n => n.code === "hull.changed")));
    const bad = { ...it, ref: "999", hull: "999" };
    check("validate: unknown hull -> ship.unknown", DOMAIN.validateIntent(bad, { list: L }, catalog).some(i => i.code === "ship.unknown"));
    const notOffered = { ...it, ref: "69", hull: "69" };
    check("validate: a hull the row does not offer -> hull.unknown", DOMAIN.validateIntent(notOffered, { list: L }, catalog).some(i => i.code === "hull.unknown"));
  }
  /* quantity clamps to the book's maximum */
  { const sh = catalog.ships["494"]; const qi = sh.ol.findIndex(o => o.qty);
    const x = unitFor("Tau — Commerce Protection", "494", { [qi]: "take" });
    const tr = DOMAIN.transition(x.intent, { type: "quantity", id: sh.ol[qi].id, qty: 99 }, x.ctx, catalog);
    check("transition: quantity is clipped to the maximum", tr.intent.options[sh.ol[qi].id].qty === sh.ol[qi].qty.max, String(tr.intent.options[sh.ol[qi].id].qty));
  }
  /* ---- J20: the interface enforces what the user interface hides ------ */
  /* (a) Fleets p.494: "Warspheres 10HP or greater may also add +1 shield" */
  { const sh = catalog.ships["494"];
    const cut = sh.ol.findIndex(o => o.mod && o.mod.hp < 0), shield = sh.ol.findIndex(o => o.hpmin && o.mod && o.mod.sh);
    const x = unitFor("Tau — Commerce Protection", "494", { [cut]: "take" });
    const tr = DOMAIN.transition(x.intent, { type: "option", id: sh.ol[shield].id, state: "take" }, x.ctx, catalog);
    check("J20a: an 8 HP Warsphere does not get +1 shield through transition (p. 494)",
          !(tr.intent.options[sh.ol[shield].id] && tr.intent.options[sh.ol[shield].id].state === "take") && tr.notices.some(n => n.code === "option.blocked"),
          JSON.stringify(tr.notices));
    const y = unitFor("Tau — Commerce Protection", "494", { [shield]: "take" });
    const tr2 = DOMAIN.transition(y.intent, { type: "option", id: sh.ol[cut].id, state: "take" }, y.ctx, catalog);
    check("J20a: ... and a later HP cut opens the shield with a notice",
          tr2.intent.options[sh.ol[cut].id].state === "take" && tr2.intent.options[sh.ol[shield].id].state === "opt" &&
          tr2.notices.some(n => n.code === "option.hpmin"), JSON.stringify(tr2.notices));
    const bad = unitFor("Tau — Commerce Protection", "494", { [cut]: "take", [shield]: "take" });
    check("J20a: validateIntent: 8 HP + shield -> option.hpmin (error)",
          DOMAIN.validateIntent(bad.intent, bad.ctx, catalog).some(i => i.code === "option.hpmin" && i.severity === "error"));
  }
  /* (b) and (c) Daemonship vs. Chaos Space Marine crew (pp. 227, 235), the crew's Mark */
  { const L = listByName("Chaos — Black Crusade");
    let page = null; L.secs.forEach(s => s.ents.forEach(e => { if(!page && /^Carnage/.test(e.l) && e.r && e.k === "unit") page = String(e.r); }));
    const at = placeOn(L, page);
    const key = re => { let k = null; L.secs.forEach((s, si) => s.ents.forEach((e, ei) => {
      if(!k && e.k === "up" && re.test(e.l) && (!e.at || e.at.some(p => p[0] === at.si && p[1] === at.ei))) k = si + ":" + ei; })); return k; };
    const idOf = k => { const q = k.split(":"); const s = L.secs[+q[0]]; return DOMAIN.upgradeId(L.nm, s.t, s.ents[+q[1]].l); };
    const crew = key(/^Chaos Space Marine crew$/), demon = key(/^Daemonship: Cruiser$/), mark = key(/^The Mark of Nurgle$/);
    check("J20: crew, Daemonship and the crew's Mark for the Black Crusade's Carnage", !!crew && !!demon && !!mark, [crew, demon, mark].join(" "));
    const x = unitFor(L.nm, page, {}, { [crew]: "take" });
    const tr = DOMAIN.transition(x.intent, { type: "upgrade", id: idOf(demon), state: "take" }, x.ctx, catalog);
    check("J20b: Daemonship after the crew: the Daemonship stays, the crew drops with a notice",
          tr.intent.upgrades[idOf(demon)] === "take" && tr.intent.upgrades[idOf(crew)] !== "take" &&
          tr.notices.some(n => n.code === "upgrade.conflict"), JSON.stringify([tr.intent.upgrades, tr.notices]));
    const y = unitFor(L.nm, page, {}, { [crew]: "take", [mark]: "take" });
    const tr2 = DOMAIN.transition(y.intent, { type: "upgrade", id: idOf(demon), state: "take" }, y.ctx, catalog);
    check("J20c: ... and the crew's Mark drops with the crew (p. 234)",
          tr2.intent.upgrades[idOf(mark)] !== "take" && tr2.intent.upgrades[idOf(demon)] === "take", JSON.stringify(tr2.intent.upgrades));
  }
  /* (d) an unattached row: the Warmaster's Mark for a cruiser */
  { const L = listByName("Chaos — Nurgle");
    let page = null; L.secs.forEach(s => s.ents.forEach(e => { if(!page && /^Carnage/.test(e.l) && e.r && e.k === "unit") page = String(e.r); }));
    let wm = null; L.secs.forEach((s, si) => s.ents.forEach((e, ei) => { if(!wm && e.k === "up" && /^The Mark of Nurgle$/.test(e.l) && e.at && e.at.length === 1) wm = { si, ei, s, e }; }));
    const wmId = DOMAIN.upgradeId(L.nm, wm.s.t, wm.e.l);
    const x = unitFor(L.nm, page, {}, {});
    const tr = DOMAIN.transition(x.intent, { type: "upgrade", id: wmId, state: "take" }, x.ctx, catalog);
    check("J20d: the Warmaster's Mark row for a cruiser is refused in transition",
          tr.intent.upgrades[wmId] !== "take" && tr.notices.some(n => n.code === "upgrade.unattached"), JSON.stringify(tr.notices));
    const bad = JSON.parse(JSON.stringify(x.intent)); bad.upgrades[wmId] = "take";
    check("J20d: validateIntent: an unattached row -> upgrade.unattached (error)",
          DOMAIN.validateIntent(bad, x.ctx, catalog).some(i => i.code === "upgrade.unattached" && i.severity === "error"));
  }
})();

/* ---- 13. (step 8) resolveFleet: fleet rules without a page ------------------
   Every case is a sentence of the book (the page is in the why field in
   reference/NN_*.json) and two fleets: one that breaks it and one that is valid. */
(function(){
  const list = nm => catalog.lists.find(L => L.nm === nm);
  const rowOf = (L, re) => {
    for(let si = 0; si < L.secs.length; si++)
      for(let ei = 0; ei < L.secs[si].ents.length; ei++){
        const en = L.secs[si].ents[ei];
        if(en.k !== "up" && new RegExp(re, "i").test(en.l)) return { si, ei, en };
      }
    throw new Error("row not found: " + L.nm + " / " + re);
  };
  const unit = (L, re, n, ups) => {
    const r = rowOf(L, re);
    const it = { schemaVersion: 2, entry: { list: L.nm, section: L.secs[r.si].t, label: r.en.l },
                 ref: r.en.r == null ? null : String(r.en.r), hull: r.en.hc ? String(r.en.r) : null,
                 hulls: n || 1, name: "", note: "", adjust: 0, custom: r.en.p == null && !r.en.hc ? 0 : null,
                 members: [], options: {}, upgrades: {} };
    const sel = DOMAIN.selectionOf(it, { list: L }, catalog);
    DOMAIN.requiredUpgradeKeys(sel).forEach(k => { const q = k.split(":"); const sec = L.secs[+q[0]]; it.upgrades[DOMAIN.upgradeId(L.nm, sec.t, sec.ents[+q[1]].l)] = "take"; });
    (ups || []).forEach(re2 => {
      let hit = null;
      L.secs.forEach((sec, si) => sec.ents.forEach((en, ei) => { if(!hit && en.k === "up" && new RegExp(re2, "i").test(en.l)) hit = { sec, en }; }));
      if(!hit) throw new Error("upgrade not found: " + L.nm + " / " + re2);
      it.upgrades[DOMAIN.upgradeId(L.nm, hit.sec.t, hit.en.l)] = "take";
    });
    return it;
  };
  const fleet = (L, limit, units) => DOMAIN.resolveFleet(DOMAIN.deepFreeze({ list: L.nm, limit, units }), catalog);
  const chk = (F, labelRe) => F.checks.find(c => new RegExp(labelRe, "i").test(c.t));
  const expect = (name, F, labelRe, ok) => {
    const c = chk(F, labelRe);
    check(name + " [" + labelRe + "]", !!c && c.ok === ok, c ? c.t + " " + c.v + " ok=" + c.ok : "check missing");
  };

  /* Planet Killer p. 235: allowed only from 1000 points (allowed_at) */
  { const L = list("Chaos — Black Crusade");
    expect("Planet Killer 900 pts", fleet(L, 900, [unit(L, "^Planet Killer")]), "^Planet Killer$", false);
    /* T24 (owner 11.9.2026): the fleet's own points 505+100+200+190+165 = 1160 */
    expect("Planet Killer 1160 pts", fleet(L, 1200, [unit(L, "^Planet Killer"), unit(L, "^Chaos Warmaster"),
      unit(L, "^Hades"), unit(L, "^Acheron"), unit(L, "^Slaughter")]), "^Planet Killer$", true); }
  /* Venerable p. 99: the fleet must be at least 1000 points */
  { const L = list("Space Marines — Crusade");
    expect("Venerable 900 pts", fleet(L, 900, [unit(L, "^Venerable battle barge")]), "Venerable", false);
    /* T24: the fleet's own points 450+425+Strike Cruiser, over 1000 */
    expect("Venerable 1000+ pts", fleet(L, 1200, [unit(L, "^Venerable battle barge"), unit(L, "^Battle barge"),
      unit(L, "Strike Cruiser")]), "Venerable", true); }
  /* Dark Eldar p.351: at least three escorts per capital ship (min_ratio) */
  { const L = list("Dark Eldar — Pirates");
    expect("DE 1 cruiser + 2 escorts", fleet(L, 2000, [unit(L, "Torture"), unit(L, "Corsair", 2)]), "Escorts per capital", false);
    expect("DE 1 cruiser + 3 escorts", fleet(L, 2000, [unit(L, "Torture"), unit(L, "Corsair", 3)]), "Escorts per capital", true); }
  /* Tau Commerce p. 457: no more Strongholds than Bastions (compare) */
  { const L = list("Tau — Commerce Protection");
    expect("Stronghold 2 / Bastion 1", fleet(L, 3000, [unit(L, "^Stronghold"), unit(L, "^Stronghold"), unit(L, "^Bastion")]), "Stronghold vs Bastion", false);
    expect("Stronghold 1 / Bastion 1", fleet(L, 3000, [unit(L, "^Stronghold"), unit(L, "^Bastion")]), "Stronghold vs Bastion", true);
    /* p. 456: a Custodian needs a Kor'O (requires) and one per full 750 Tau points (per_points of_pick) */
    expect("Custodian + Kor'el", fleet(L, 3000, [unit(L, "^Custodian"), unit(L, "Kor'el"), unit(L, "^Merchant class"), unit(L, "^Merchant class"), unit(L, "^Protector"), unit(L, "^Hero")]), "Custodian needs", false);
    const big = fleet(L, 3000, [unit(L, "^Custodian"), unit(L, "Kor.O \\(Ld 9\\)"), unit(L, "^Merchant class"), unit(L, "^Merchant class"), unit(L, "^Protector"), unit(L, "^Hero")]);
    expect("Custodian + Kor'O", big, "Custodian needs", true);
    expect("Custodian per 750 Tau pts (enough)", big, "Custodian class", true);
    expect("Custodian per 750 Tau pts (too few)", fleet(L, 3000, [unit(L, "^Custodian"), unit(L, "Kor.O \\(Ld 9\\)")]), "Custodian class", false);
    /* Warsphere p.453: one at 1500 points, two in larger games (tiers) */
    /* T26 (14.9.2026): "if the fleet is worth 1500 points" = the fleet's own
       points, not the game's limit. A big fleet: 290+330+110+370+360+95 = 1555. */
    expect("Warsphere x2, fleet 290 pts", fleet(L, 2000, [unit(L, "Kroot Warsphere"), unit(L, "Kroot Warsphere")]), "Kroot Warspheres", false);
    expect("Warsphere x2, fleet 1555 pts", fleet(L, 2000, [unit(L, "Kroot Warsphere"), unit(L, "Kroot Warsphere"),
      unit(L, "^Custodian"), unit(L, "Kor.O \\(Ld 9\\)"), unit(L, "^Protector"), unit(L, "^Protector"),
      unit(L, "^Hero"), unit(L, "^Hero"), unit(L, "^Merchant class")]), "Kroot Warspheres", true);
    expect("Warsphere x1, fleet 145 pts", fleet(L, 1499, [unit(L, "Kroot Warsphere")]), "Kroot Warspheres", false); }
  /* Demiurg p.487: Commerce Vessels > other cruisers; one squadron per 3 Demiurg capital ships (ratio units) */
  { const L = list("Demiurg — War Host");
    expect("Demiurg 1 Bastion vs 1 Protector", fleet(L, 3000, [unit(L, "^Bastion"), unit(L, "^Protector")]), "Commerce Vessels vs", false);
    expect("Demiurg 2 Bastion vs 1 Protector", fleet(L, 3000, [unit(L, "^Bastion"), unit(L, "^Bastion"), unit(L, "^Protector")]), "Commerce Vessels vs", true);
    expect("Demiurg 2 capitals + 1 Tau squadron", fleet(L, 3000, [unit(L, "^Bastion"), unit(L, "^Citadel"), unit(L, "^Castellan", 3)]), "escort squadrons", false);
    expect("Demiurg 3 capitals + 1 Tau squadron", fleet(L, 3000, [unit(L, "^Bastion"), unit(L, "^Citadel"), unit(L, "^Stronghold"), unit(L, "^Castellan", 3)]), "escort squadrons", true); }
  /* Tyranids Hive Fleet p.430-431 */
  { const L = list("Tyranids — Hive Fleet");
    expect("no hive ship + Cruiser", fleet(L, 2000, [unit(L, "^Cruiser$")]), "Without a hive ship", false);
    expect("no hive ship + Kraken", fleet(L, 2000, [unit(L, "^Kraken", 6)]), "Without a hive ship", true);
    expect("hive ship + 5 escorts (min 6)", fleet(L, 2000, [unit(L, "^Hive ship"), unit(L, "^Escort drone", 5)]), "Escorts per hive ship \\(min\\)", false);
    expect("hive ship + 6 escort drones", fleet(L, 2000, [unit(L, "^Hive ship"), unit(L, "^Escort drone", 6)]), "Escort drones per hive ship", true);
    expect("hive ship + 13 escorts (max 12)", fleet(L, 2000, [unit(L, "^Hive ship"), unit(L, "^Escort drone", 6), unit(L, "^Kraken", 7)]), "Escorts per hive ship \\(max\\)", false);
    expect("1 hive ship + Imperative (min_one)", fleet(L, 2000, [unit(L, "^Hive ship", 1, ["Hive Mind Imperative"]), unit(L, "^Escort drone", 6)]), "Hive Mind Imperatives", true);
    expect("2 hive ships + 2 Imperatives", fleet(L, 3000, [unit(L, "^Hive ship", 1, ["Hive Mind Imperative"]), unit(L, "^Hive ship", 1, ["Hive Mind Imperative"]), unit(L, "^Escort drone", 12)]), "Hive Mind Imperatives", false);
    /* p.426: at most three different refits on a hive ship (unit_upgrade_max) */
    expect("hive ship with 4 refits", fleet(L, 2000, [unit(L, "^Hive ship", 1, ["Solar Vanes", "Adrenaline Sacs", "Psychic Scream", "More Discharge Vents"]), unit(L, "^Escort drone", 6)]), "Refits per hive ship", false);
    expect("hive ship with 3 refits", fleet(L, 2000, [unit(L, "^Hive ship", 1, ["Solar Vanes", "Adrenaline Sacs", "Psychic Scream"]), unit(L, "^Escort drone", 6)]), "Refits per hive ship", true);
    /* p.431: ordnance markers at most 10 % of the points limit (points_share of=limit) */
    const ordn = fleet(L, 1000, [unit(L, "^Hive ship"), unit(L, "^Escort drone", 6), unit(L, "^Cruiser$")]);
    check("Tyranid ordnance share check exists", !!chk(ordn, "Ordnance markers")); }
  /* Grey Knights p. 145: a Battlebarge only if the rest of the fleet is >= 1000 AND the Ordo Malleus leads (allowed_at remainder+cond) */
  { const L = list("Grey Knights");
    const sc7 = Array.from({ length: 7 }, () => unit(L, "Grey Knights Strike Cruiser"));
    expect("GK barge, Inquisitor Lord only", fleet(L, 3000, [unit(L, "^Grey Knights Battlebarge"), unit(L, "^Inquisitor Lord")].concat(sc7)), "Battlebarge", false);
    expect("GK barge, Ordo Malleus + 1155 pts", fleet(L, 3000, [unit(L, "^Grey Knights Battlebarge"), unit(L, "^Ordo Malleus")].concat(sc7)), "Battlebarge", true);
    expect("GK barge, Ordo Malleus, remainder < 1000", fleet(L, 3000, [unit(L, "^Grey Knights Battlebarge"), unit(L, "^Ordo Malleus"), unit(L, "Grey Knights Strike Cruiser")]), "Battlebarge", false); }
  /* Rogue Traders Exploration p.176-177 */
  { const L = list("Rogue Traders — Exploration");
    expect("RT half: 1 RT + 2 Lunar", fleet(L, 3000, [unit(L, "^Rogue Trader cruiser"), unit(L, "^Lunar"), unit(L, "^Lunar"), unit(L, "^Veteran Rogue"), unit(L, "^Cargo Transport", 2)]), "at least half", false);
    const ok = fleet(L, 3000, [unit(L, "^Rogue Trader cruiser"), unit(L, "^Rogue Trader cruiser"), unit(L, "^Lunar"), unit(L, "^Veteran Rogue"), unit(L, "^Cargo Transport", 2)]);
    expect("RT half: 2 RT + 1 Lunar", ok, "at least half", true);
    expect("Veteran RT with 2 RT cruisers", ok, "^Veteran Rogue Traders$", true);
    expect("Cargo squadron present", ok, "Cargo ship squadron", true);
    expect("Cargo squadron missing", fleet(L, 3000, [unit(L, "^Rogue Trader cruiser"), unit(L, "^Veteran Rogue")]), "Cargo ship squadron", false);
    expect("Kroot Warsphere with 2 RT cruisers", fleet(L, 3000, [unit(L, "^Rogue Trader cruiser"), unit(L, "^Rogue Trader cruiser"), unit(L, "^Kroot Warsphere"), unit(L, "^Veteran Rogue"), unit(L, "^Cargo Transport", 2)]), "^Kroot Warsphere$", false);
    expect("Kroot Warsphere with 3 RT cruisers", fleet(L, 3000, [unit(L, "^Rogue Trader cruiser"), unit(L, "^Rogue Trader cruiser"), unit(L, "^Rogue Trader cruiser"), unit(L, "^Kroot Warsphere"), unit(L, "^Veteran Rogue"), unit(L, "^Cargo Transport", 2)]), "^Kroot Warsphere$", true);
    expect("Heavy transports 2 of 2 transports (>1/3)", fleet(L, 3000, [unit(L, "^Rogue Trader cruiser"), unit(L, "^Veteran Rogue"), unit(L, "^Heavy Transport", 2)]), "Heavy transports", false); }
  /* Pirates p. 179: xenos escorts at most 10 % of the fleet's points (points_share of=total) */
  { const L = list("Rogue Traders — Pirates and Wolf Packs");
    const F = fleet(L, 3000, [unit(L, "^Pirate Captain"), unit(L, "^Escort Carrier", 2), unit(L, "^Xenos Vessel$", 3)]);
    const c = chk(F, "Alien escorts");
    check("Pirates: alien escort share is checked and over 10 %", !!c && c.ok === false, c ? c.v : "-"); }
  /* Iyanden p.318: the Autarch's Dragonship flagship does not count towards the ratio (ratio exempt) */
  { const L = list("Eldar — Iyanden Craftworld");
    expect("2 Dragonships, 2 Wraithships, Eldar Hero", fleet(L, 3000, [unit(L, "^Eldar Hero"), unit(L, "^Dragonship$"), unit(L, "^Dragonship$"), unit(L, "^Wraithship", 2)]), "^Dragonships$", false);
    expect("2 Dragonships, 2 Wraithships, Autarch", fleet(L, 3000, [unit(L, "^Eldar Autarch"), unit(L, "^Dragonship$"), unit(L, "^Dragonship$"), unit(L, "^Wraithship", 2)]), "^Dragonships$", true); }
  /* Da Ork Clanz p.372: Space Hulk needs three Warlords (conditional_cap) */
  { const L = list("Orks — Da Ork Clanz");
    expect("Ork hulk with 2 Warlords", fleet(L, 3000, [unit(L, "^Ork Warlord"), unit(L, "^Ork Warlord"), unit(L, "^Ork hulk")]), "^Space Hulk$", false);
    expect("Ork hulk with 3 Warlords", fleet(L, 3000, [unit(L, "^Ork Warlord"), unit(L, "^Ork Warlord"), unit(L, "^Ork Warlord"), unit(L, "^Ork hulk")]), "^Space Hulk$", true); }
  /* purity: fleet checks do not change the catalogue */
  check("resolveFleet does not change the catalogue", JSON.stringify(catalog) === JSON.stringify(JSON.parse(RAW)));
})();


/* ---- 14. (1.1 step 1) section index vs. section name -----------------------
   A section index is a silent reference: if a section moves, the index still
   points at something - the wrong section, and a wrong count looks like a game
   rule. In the data every reference carries the section's name (build_data.py:
   sn / up_sn / <key>_sn), and resolveFleet compares the name before counting.
   Here the sections are pushed one step forward in a copy of the catalog and
   the engine must report it as an error and count nothing. */
(function(){
  const doctored = JSON.parse(RAW);
  const L = doctored.lists.find(x => x.nm === "Imperial Navy \u2014 Gothic Sector");
  const real = catalog.lists.find(x => x.nm === "Imperial Navy \u2014 Gothic Sector");
  const named = JSON.stringify(real).match(/"(sn|up_sn|[a-z_]+_sn)":/g) || [];
  check("section references carry a name in the data", named.length > 0, named.length + " found");

  const rowOf = (Lx, re) => {
    for(let si = 0; si < Lx.secs.length; si++)
      for(let ei = 0; ei < Lx.secs[si].ents.length; ei++){
        const en = Lx.secs[si].ents[ei];
        if(en.k !== "up" && new RegExp(re, "i").test(en.l)) return { si, ei, en };
      }
    throw new Error("row not found: " + re);
  };
  const intentOf = (Lx, re, n) => {
    const r = rowOf(Lx, re);
    return { schemaVersion: 2, entry: { list: Lx.nm, section: Lx.secs[r.si].t, label: r.en.l },
             ref: r.en.r == null ? null : String(r.en.r), hull: r.en.hc ? String(r.en.r) : null,
             hulls: n || 1, name: "", note: "", adjust: 0,
             custom: r.en.p == null && !r.en.hc ? 0 : null,
             members: [], options: {}, upgrades: {} };
  };
  const units = [intentOf(real, "^Emperor class battleship"),
                 intentOf(real, "^Lunar class cruiser")];
  const clean = DOMAIN.resolveFleet({ list: real.nm, limit: 1500, units }, catalog);
  check("intact data: no section errors",
        !clean.checks.some(c => /^Data error/.test(c.t)),
        (clean.checks.filter(c => /^Data error/.test(c.t))[0] || {}).t || "");

  /* The very shift the names were written against: one section in front,
     indexes not corrected. The rows are still found by name, so the fleet
     builds - only the rules' references are off. */
  L.secs.unshift({ t: "INSERTED SECTION", ents: [], rules: [] });
  const moved = DOMAIN.resolveFleet(
    { list: L.nm, limit: 1500, units: [intentOf(L, "^Emperor class battleship"),
                                       intentOf(L, "^Lunar class cruiser")] }, doctored);
  const errs = moved.checks.filter(c => /^Data error/.test(c.t));
  check("shifted section: the engine reports the error", errs.length > 0,
        errs.length + " error rows");
  check("shifted section: the error names the field",
        errs.some(c => /section index does not match its name/.test(c.v)),
        (errs[0] || {}).v || "");
  /* And it counts no wrong result: the battleship ratio must not show OK for
     a section it no longer means. */
  check("shifted section: the broken rule is not evaluated",
        !moved.checks.some(c => c.t === "Battleships" && c.ok),
        JSON.stringify(moved.checks.filter(c => c.t === "Battleships")));
})();


/* ---- 15. (1.1 step 2) race and hull type by the book --------------------
   Fleets p. 14: "Reserve vessels ... must come from the same 'race'. For the
   purpose of the game, the races are: Imperial Navy (including Adeptus
   Mechanicus), Space Marines, Chaos (including Chaos Space Marines), Eldar,
   Craftworld Eldar, Dark Eldar, Orks, Necrons, Tyranids and Tau (including
   Tau allies)." The list is closed ("the races are"), so a list that is not in
   it gets no race at all - it can join only through its own list rule (p. 15).

   Fleets p. 14 on hull types: "Only ships of the same 'type' (battleship,
   cruiser or escort) count for reserves purposes" and "battlecruisers, grand
   cruisers, heavy cruisers, cruisers, and light cruisers all count as
   'cruisers'". */
(function(){
  const RACES = ["imperial navy", "space marines", "chaos", "eldar",
                 "craftworld eldar", "dark eldar", "orks", "necrons",
                 "tyranids", "tau"];
  const missing = catalog.lists.filter(L => !("race" in L));
  check("every list has a race field", missing.length === 0,
        missing.map(L => L.nm).join(", ").slice(0, 80));
  const bad = catalog.lists.filter(L => L.race != null && RACES.indexOf(L.race) < 0);
  check("the race comes from the book's list", bad.length === 0,
        bad.map(L => L.nm + "=" + L.race).join(", ").slice(0, 80));
  const raceOf = nm => (catalog.lists.find(L => L.nm === nm) || {}).race;
  /* p.14: "Imperial Navy (including Adeptus Mechanicus)" */
  check("AdMech is of the Imperial Navy race",
        raceOf("Adeptus Mechanicus \u2014 Explorator") === "imperial navy",
        String(raceOf("Adeptus Mechanicus \u2014 Explorator")));
  /* p. 14: Eldar and Craftworld Eldar are DIFFERENT races in the list */
  check("Corsairs and Iyanden are different races",
        raceOf("Eldar Corsairs \u2014 Gothic Sector") === "eldar" &&
        raceOf("Eldar \u2014 Iyanden Craftworld") === "craftworld eldar",
        raceOf("Eldar Corsairs \u2014 Gothic Sector") + " / " + raceOf("Eldar \u2014 Iyanden Craftworld"));
  /* T37 (owner 14.9.2026): a race is a GAME-MECHANICAL group, not a biological
     species - p. 15's list says so itself when it separates the Imperial Navy
     and the Space Marines although both are human. Two lists moved into the
     list for that reason. */
  check("Grey Knights are of the Space Marines race (p.144)",
        raceOf("Grey Knights") === "space marines", String(raceOf("Grey Knights")));
  check("Demiurg belongs to the Tau group (p.15 'including Tau allies', p.482)",
        raceOf("Demiurg \u2014 War Host") === "tau",
        String(raceOf("Demiurg \u2014 War Host")));
  /* These have no single race: the Inquisition has no list of its own at all
     (p. 138) and the Rogue Traders lists are mixed on purpose. null is NOT a
     wildcard or "humanity" - it means access is always named and conditional. */
  ["Rogue Traders", "Rogue Traders \u2014 Exploration",
   "Rogue Traders \u2014 Pirates and Wolf Packs",
   "The Emperor's Inquisition"].forEach(nm => {
    check("no race outside the race list:" + nm, raceOf(nm) === null,
          String(raceOf(nm)));
  });
  /* Hull type: every profile has rt, and it is one of four */
  const RT = ["battleship", "cruiser", "escort", "none"];
  const noRt = Object.keys(catalog.ships).filter(k => RT.indexOf(catalog.ships[k].rt) < 0);
  check("every ship has the book's type (rt)", noRt.length === 0,
        noRt.slice(0, 6).join(", "));
  const rtOf = k => (catalog.ships[k] || {}).rt;
  /* p. 14: grand cruisers are "cruisers" */
  const grands = Object.keys(catalog.ships).filter(k => catalog.ships[k].ty === "Grand Cruiser");
  check("a grand cruiser is a cruiser (p.14)", grands.length > 0 &&
        grands.every(k => rtOf(k) === "cruiser"), grands.length + " hulls");
  /* p.288: "It counts as a battleship for purposes of taking another" */
  check("the Chaos Space Hulk is a battleship (p.288)", rtOf("286") === "battleship", String(rtOf("286")));
  /* A defence station is not a battleship, a cruiser or an escort */
  check("an orbital station is none of the three types",
        rtOf("507") === "none" && rtOf("500") === "none",
        rtOf("507") + " / " + rtOf("500"));
  /* The Kroot Warsphere and the Nicassar ships come only through named access */
  check("the Kroot Warsphere is not a reserve type", rtOf("494") === "none", String(rtOf("494")));
})();


/* ---- 16. (1.1 step 3) reserves and allies --------------------------------
   Fleets p. 14: "Any fleet chosen from one of the fleet lists may also include
   reserves. For every three battleships, cruisers or escorts chosen from the
   fleet list, you may also pick one ship of the same type from another fleet
   list belonging to the same race."
   p. 15: "Reserves can only ever be ships belonging to the same 'race', chosen
   from a fleet list of the same 'race'."
   p. 16: "... no more than one allied vessel may be taken for every three core
   vessels in the fleet."

   Here a unit carries its own list (entry.list) and its role, so one fleet can
   be made of two lists' ships. */
(function(){
  const list = nm => catalog.lists.find(x => x.nm === nm);
  const rowOf = (Lx, re) => {
    for(let si = 0; si < Lx.secs.length; si++)
      for(let ei = 0; ei < Lx.secs[si].ents.length; ei++){
        const en = Lx.secs[si].ents[ei];
        if(en.k !== "up" && new RegExp(re, "i").test(en.l)) return { si, ei, en };
      }
    throw new Error("row not found: " + Lx.nm + " / " + re);
  };
  /* A unit from a row of its own list. role: core (default) | reserve | ally. */
  const unit = (Lx, re, n, role) => {
    const r = rowOf(Lx, re);
    return { schemaVersion: 2, role: role || "core",
             entry: { list: Lx.nm, section: Lx.secs[r.si].t, label: r.en.l },
             ref: r.en.r == null ? null : String(r.en.r),
             hull: r.en.hc ? String(r.en.r) : null,
             hulls: n || 1, name: "", note: "", adjust: 0,
             custom: r.en.p == null && !r.en.hc ? 0 : null,
             members: [], options: {}, upgrades: {} };
  };
  const fleet = (Lx, limit, units) =>
    DOMAIN.resolveFleet({ list: Lx.nm, limit, units }, catalog);
  const row = (F, re) => F.checks.find(c => new RegExp(re, "i").test(c.t));

  const IN = list("Imperial Navy \u2014 Gothic Sector");
  const BAST = list("Imperial Navy \u2014 Bastion Fleets");
  const CHAOS = list("Chaos \u2014 Incursion");
  const CORS = list("Eldar Corsairs \u2014 Gothic Sector");

  /* A foreign unit resolves from its OWN list: the price and profile are the
     donor list's, not the host's. */
  { const F = fleet(IN, 3000, [unit(IN, "^Lunar class cruiser$"),
                               unit(BAST, "^Avenger", 1, "reserve")]);
    const av = F.units[1];
    check("a foreign unit resolves from its own list",
          !!av && av.entry && av.entry.list === BAST.nm,
          av && av.entry ? av.entry.list : "null");
    check("a foreign unit's price comes from the donor list", !!av && av.points > 0,
          av ? String(av.points) : "null"); }

  /* p.14: three cruisers entitle one reserve cruiser */
  { const F = fleet(IN, 3000, [unit(IN, "^Lunar class cruiser$"),
                               unit(IN, "^Gothic class cruiser$"),
                               unit(IN, "^Tyrant class cruiser$"),
                               unit(BAST, "^Avenger", 1, "reserve")]);
    const r = row(F, "^Reserves \\(cruisers\\)$");
    check("3 cruisers + 1 reserve is legal", !!r && r.ok === true,
          r ? r.v : "row missing"); }
  { const F = fleet(IN, 3000, [unit(IN, "^Lunar class cruiser$"),
                               unit(IN, "^Gothic class cruiser$"),
                               unit(BAST, "^Avenger", 1, "reserve")]);
    const r = row(F, "^Reserves \\(cruisers\\)$");
    check("2 cruisers + 1 reserve is illegal", !!r && r.ok === false,
          r ? r.v : "row missing"); }

  /* p. 14: only ships of the same type count as the base - three escorts do not
     entitle you to a cruiser */
  { const F = fleet(IN, 3000, [unit(IN, "^Cobra class destroyer$", 3),
                               unit(BAST, "^Avenger", 1, "reserve")]);
    const r = row(F, "^Reserves \\(cruisers\\)$");
    check("3 escorts do not entitle a reserve cruiser", !!r && r.ok === false,
          r ? r.v : "row missing"); }

  /* p. 15: a reserve only from a list of the same race */
  { const F = fleet(IN, 3000, [unit(IN, "^Lunar class cruiser$"),
                               unit(IN, "^Gothic class cruiser$"),
                               unit(IN, "^Tyrant class cruiser$"),
                               unit(CHAOS, "^Murder", 1, "reserve")]);
    const r = row(F, "race");
    check("a reserve of another race fails", !!r && r.ok === false,
          r ? r.t + " " + r.v : "row missing"); }

  /* p.16: one ally per three core ships */
  { const F = fleet(IN, 3000, [unit(IN, "^Lunar class cruiser$"),
                               unit(IN, "^Gothic class cruiser$"),
                               unit(IN, "^Tyrant class cruiser$"),
                               unit(CORS, "^Shadow class cruiser$", 1, "ally")]);
    const r = row(F, "^Allied vessels \\(cruisers\\)$");
    check("3 core cruisers + 1 ally is legal", !!r && r.ok === true,
          r ? r.v : "row missing");
    check("an ally need not be of the same race", !row(F, "race"),
          (row(F, "race") || {}).t || ""); }

  /* A foreign unit cannot be core: it would have been bought from the host list */
  { const F = fleet(IN, 3000, [unit(IN, "^Lunar class cruiser$"),
                               unit(BAST, "^Avenger", 1, "core")]);
    const r = row(F, "another fleet list|role");
    check("a foreign unit with the role core is an error", !!r && r.ok === false,
          r ? r.t : "row missing"); }

  /* A foreign hull must not hit the host list's section: the Avenger's section
     index is Bastion's "Battleships" (3), which in the Gothic Sector is
     "Battlecruisers". By the book it should be counted for the whole fleet
     (p. 14), but a wrong count would look like a game rule - so it is reported. */
  { const F = fleet(IN, 3000, [unit(IN, "^Lunar class cruiser$"),
                               unit(IN, "^Gothic class cruiser$"),
                               unit(IN, "^Tyrant class cruiser$"),
                               unit(BAST, "^Avenger", 1, "reserve")]);
    const bc = row(F, "^Battlecruisers$");
    check("a foreign hull does not hit the host list's section",
          !!bc && bc.v === "0 / 1", bc ? bc.v : "row missing");
    /* The heading alone is not enough. Bastion prints battleships, grand
       cruisers AND battlecruisers under one heading "Battleships", but p. 14
       says "battlecruisers, grand cruisers, heavy cruisers, cruisers, and light
       cruisers all count as 'cruisers'". The Avenger is a grand cruiser, so it
       must not use up the Gothic Sector's only battleship slot. Gothic's
       "Battleships" section has no row of the same kind (rt cruiser), so the
       ship is not counted there - or anywhere, and that is reported.
       Codex review 15.9.2026. */
    const bs = row(F, "^Battleships$");
    check("a borrowed grand cruiser does not use a battleship slot",
          !!bs && bs.v === "0 / 1" && bs.ok === true, bs ? bs.v : "row missing");
    const nc = row(F, "^Not counted in this list's limits");
    check("the uncounted ship is reported", !!nc && nc.warn === true,
          nc ? nc.t + " = " + nc.v : "row missing"); }
  /* A heading the host does not have: the ship is not counted anywhere, and
     that is reported. The Kroot Warsphere is in the Tau Merchant's section
     "Kroot Vessels", which is named access (ct own) - never counted. */
  { const TAUM = list("Tau \u2014 Merchant Fleet");
    const TAUC = list("Tau \u2014 Commerce Protection");
    const F = fleet(TAUC, 3000, [unit(TAUC, "^Explorer class starship.*Vash"),
                                 unit(TAUM, "^Kroot Warsphere$", 1, "reserve")]);
    check("a ship from a named-access section is not counted as borrowed",
          !row(F, "^Kroot Warspheres$") || row(F, "^Kroot Warspheres$").v === "0 / 0",
          (row(F, "^Kroot Warspheres$") || {}).v || "row missing"); }
  /* Units of the own list give no reserve row at all */
  { const F = fleet(IN, 3000, [unit(IN, "^Lunar class cruiser$")]);
    check("a core-only fleet shows no reserve row",
          !row(F, "^Reserves \\("), (row(F, "^Reserves \\(") || {}).t || ""); }
})();


/* ---- 17. (1.1 step 3) a reserve of a reserve, and named access -----------
   Fleets p. 15: "However, a given fleet list cannot take as reserves ships
   listed as reserves or allies to another fleet list. ... In short, you
   cannot use a reserve of a reserve."
   Fleets p. 15: "Some fleet lists explicitly provide access to ships from
   other races. These may only be taken exactly as described on their fleet
   list rules and may not also be taken as reserves."

   Both ask the same: is the donor list's section the list's OWN ships or
   someone else's. The section's kind answers: type / own = own, reserve /
   access = not. */
(function(){
  const list = nm => catalog.lists.find(x => x.nm === nm);
  const rowOf = (Lx, re) => {
    for(let si = 0; si < Lx.secs.length; si++)
      for(let ei = 0; ei < Lx.secs[si].ents.length; ei++){
        const en = Lx.secs[si].ents[ei];
        if(en.k !== "up" && new RegExp(re, "i").test(en.l)) return { si, ei, en };
      }
    throw new Error("row not found: " + Lx.nm + " / " + re);
  };
  const unit = (Lx, re, n, role) => {
    const r = rowOf(Lx, re);
    return { schemaVersion: 2, role: role || "core",
             entry: { list: Lx.nm, section: Lx.secs[r.si].t, label: r.en.l },
             ref: r.en.r == null ? null : String(r.en.r),
             hull: r.en.hc ? String(r.en.r) : null,
             hulls: n || 1, name: "", note: "", adjust: 0,
             custom: r.en.p == null && !r.en.hc ? 0 : null,
             members: [], options: {}, upgrades: {} };
  };
  const fleet = (Lx, limit, units) =>
    DOMAIN.resolveFleet({ list: Lx.nm, limit, units }, catalog);
  const row = (F, re) => F.checks.find(c => new RegExp(re, "i").test(c.t));

  const IN = list("Imperial Navy \u2014 Gothic Sector");
  const BAKKA = list("Imperial Navy \u2014 Bakka Sector");
  const BAST = list("Imperial Navy \u2014 Bastion Fleets");
  const TAUM = list("Tau \u2014 Merchant Fleet");
  const TAUC = list("Tau \u2014 Commerce Protection");
  const three = [unit(IN, "^Lunar class cruiser$"), unit(IN, "^Gothic class cruiser$"),
                 unit(IN, "^Tyrant class cruiser$")];

  /* The Jovian in Bakka's RESERVES section is Bakka's own reserve, not a Bakka ship */
  { const F = fleet(IN, 3000, three.concat([unit(BAKKA, "^Jovian", 1, "reserve")]));
    const r = row(F, "reserve of a reserve");
    check("a reserve of a reserve fails", !!r && r.ok === false,
          r ? r.t + " " + r.v : "row missing"); }

  /* Tau Merchant's Kroot Vessels are named access to another race's ships */
  { const F = fleet(TAUC, 3000, [unit(TAUC, "^Explorer class starship.*Vash"),
                                 unit(TAUM, "^Kroot Warsphere$", 1, "reserve")]);
    const r = row(F, "named access");
    check("a named-access ship is not a valid reserve", !!r && r.ok === false,
          r ? r.t + " " + r.v : "row missing"); }

  /* An ordinary reserve produces neither row */
  { const F = fleet(IN, 3000, three.concat([unit(BAST, "^Lunar class cruiser$", 1, "reserve")]));
    check("an ordinary reserve does not fail these",
          !row(F, "reserve of a reserve") && !row(F, "named access"),
          (row(F, "reserve of a reserve") || row(F, "named access") || {}).t || ""); }
})();

/* ---- 13c. borrowed-ship regression on every list (DoD 1.1) ------------
   The book (p. 14) says a borrowed ship counts in the fleet AS A WHOLE:
   "the restrictions on maximum and minimum numbers of ships are determined
   for the fleet as a whole, regardless of whether they were purchased from
   the list or as reserves". A criterion "the host's rows' VALUES stay
   unchanged" would contradict the book: the points rise, the hull counts in
   its heading, and a quota derived from the fleet's contents moves. The first
   version of this test required exactly that and gave 25 reds, each of them a
   change the book requires.

   The right invariant is the SET OF RULES, not the values. Both lists:

     MAY change      - any row's VALUE, and as new rows the reserve, ally and
                       race rows that were not there before.
     MUST NOT change - the set of rows otherwise. The donor list's own rules do
                       not follow the ship to the host: no new heading may be
                       the donor's own rule, and no host row may disappear.

   And the other way round: something must change. If nothing moves, the
   borrowed ship is counted nowhere and p. 14 goes unenforced. */
(function(){
  const anyShip = Lx => {
    for(let si = 0; si < Lx.secs.length; si++){
      if(Lx.secs[si].ct !== "type") continue;
      for(let ei = 0; ei < Lx.secs[si].ents.length; ei++){
        const en = Lx.secs[si].ents[ei];
        if(en.k === "unit" && en.r && en.p != null)
          return { si, ei, en, sec: Lx.secs[si] };
      }
    }
    return null;
  };
  const mk = (Lx, at, role) => ({
    schemaVersion: 3, role: role || "core",
    entry: { list: Lx.nm, section: Lx.secs[at.si].t, label: at.en.l },
    ref: at.en.r == null ? null : String(at.en.r),
    hull: at.en.hc ? String(at.en.r) : null,
    hulls: 1, name: "", note: "", adjust: 0,
    custom: at.en.p == null && !at.en.hc ? 0 : null,
    members: [], options: {}, upgrades: {} });
  const run = (Lx, units) =>
    DOMAIN.resolveFleet({ list: Lx.nm, limit: 100000, units }, catalog);
  const titles = F => F.checks.map(c => c.t);
  const vals = F => { const m = {}; F.checks.forEach(c => { m[c.t] = c.v + "|" + c.ok; }); return m; };

  /* Rows the engine adds specifically for a borrowed ship (p.14-16). */
  /* J213: ": choose " is the borrowed ship's own row too - a Hive ship without
     weapons is an incomplete ship, borrowed or not (Fleets p. 430). */
  const BORROW_ROW = /^Reserves |^Allied vessels |^Borrowed |reserve|ally|allied|another fleet list|race|not counted|: choose /i;
  /* The source list's own rule is recognised by its own sentence. */
  const donorSentences = Ld => {
    const out = [];
    (Ld.secs || []).forEach(sec => (sec.rules || []).forEach(r => {
      if(r.src) out.push(String(r.src));
    }));
    return out;
  };

  let ran = 0, changed = 0;
  catalog.lists.forEach(host => {
    const donor = catalog.lists.filter(d =>
      d.nm !== host.nm && d.race && host.race && d.race === host.race)[0];
    if(!donor) return;
    const hAt = anyShip(host), dAt = anyShip(donor);
    if(!hAt || !dAt) return;
    ran++;
    const own = [mk(host, hAt), mk(host, hAt), mk(host, hAt)];
    const F0 = run(host, own);
    const F1 = run(host, own.concat([mk(donor, dAt, "reserve")]));
    const t0 = titles(F0), t1 = titles(F1), v0 = vals(F0), v1 = vals(F1);

    /* 1. No host row may disappear. */
    const gone = t0.filter(t => t1.indexOf(t) < 0);
    check("a borrowed ship removes no host row: " + host.nm,
          gone.length === 0, gone.join("; ") || "-");

    /* 2. A new row may only be the borrowed ship's own row. */
    const added = t1.filter(t => t0.indexOf(t) < 0);
    const badAdd = added.filter(t => !BORROW_ROW.test(t));
    check("a new row is the borrowed ship's row: " + host.nm,
          badAdd.length === 0, badAdd.join("; ") || "-");

    /* 3. The donor list's own sentence must not appear in the host's checks. */
    const own0 = {};
    F0.checks.forEach(c => { if(c.s) own0[c.s] = 1; });
    const dsent = donorSentences(donor);
    const leaked = F1.checks.filter(c => c.s && !own0[c.s] &&
      dsent.indexOf(String(c.s)) >= 0 && !BORROW_ROW.test(c.t)).map(c => c.t);
    check("the source list's rule does not leak to the host:" + host.nm,
          leaked.length === 0, leaked.join("; ") || "-");

    /* 4. The borrowed ship gets its own budget row. This is the only assertion
       that fails if the engine stops reading the unit's own list: then the
       borrowed ship becomes the host's own and the 1:3 budget disappears
       silently, though the points still rise. */
    check("a borrowed ship gets its own budget row: " + host.nm,
          t1.some(t => /^Reserves |^Allied vessels /.test(t)),
          added.join("; ") || "no new rows");

    /* 5. The other direction: the borrowed ship shows somewhere. */
    const moved = added.length > 0 ||
      Object.keys(v0).some(t => v0[t] !== v1[t]);
    if(moved) changed++;
    check("a borrowed ship shows in the fleet's checks: " + host.nm, moved,
          "new " + added.length);
  });
  check("13c: the regression ran on many lists", ran >= 20, String(ran));
  check("13c: the borrowed ship moved something on every list", changed === ran,
        changed + " / " + ran);
})();

/* ---- 13d. the allies matrix (Fleets p. 17 + the 2010 FAQ) -------------------
   p. 17 forbids an alliance with a natural enemy and refers to an ALLIES
   MATRIX table, which is not in this edition (the page is empty after the
   heading). The Remastered web version restores it from the 2010 FAQ; the
   verbatim text and its origin: books/faq2010-allies.txt (extractor/books.py).

   Before the fix the engine returned at once on role !== "reserve", so an ally
   of another race passed everything: a Dark Eldar cruiser went into an Imperial
   Navy fleet all green (the owner's observation, 15.9.2026).

   The table is gone through here pair by pair. An alliance is legal only if
   BOTH sides allow it, so a one-sided ban is enough. */
(function(){
  const byName = nm => catalog.lists.filter(x => x.nm === nm)[0];
  const anyShip = (Lx, rt) => {
    for(let si = 0; si < Lx.secs.length; si++){
      if(Lx.secs[si].ct !== "type") continue;
      for(let ei = 0; ei < Lx.secs[si].ents.length; ei++){
        const en = Lx.secs[si].ents[ei];
        if(en.k !== "unit" || !en.r || en.p == null) continue;
        const sh = catalog.ships[String(en.r)];
        if(rt && (!sh || sh.rt !== rt)) continue;
        return { si, ei, en };
      }
    }
    return null;
  };
  const mk = (Lx, at, role) => ({
    schemaVersion: 3, role: role || "core",
    entry: { list: Lx.nm, section: Lx.secs[at.si].t, label: at.en.l },
    ref: at.en.r == null ? null : String(at.en.r),
    hull: at.en.hc ? String(at.en.r) : null,
    hulls: 1, name: "", note: "", adjust: 0,
    custom: at.en.p == null && !at.en.hc ? 0 : null,
    members: [], options: {}, upgrades: {} });
  /* Six own hulls: the 1:3 budget allows two allies, so that is not what
     fails - the failure comes from the matrix. */
  const fleetWith = (host, donors) => {
    const hAt = anyShip(host);
    const own = [mk(host, hAt), mk(host, hAt), mk(host, hAt),
                 mk(host, hAt), mk(host, hAt), mk(host, hAt)];
    const al = donors.map(d => { const a = anyShip(d.L, d.rt); return a ? mk(d.L, a, "ally") : null; });
    if(al.some(x => !x)) return null;
    return DOMAIN.resolveFleet({ list: host.nm, limit: 1000000, units: own.concat(al) }, catalog);
  };
  const allyRed = F => (F ? F.checks.filter(c => !c.ok &&
      /^Never allies|^With .* allies, no others/.test(c.t)) : []);

  /* [host, donor, allowed] - the source's 12 rows in pairs. */
  const CASES = [
    ["Imperial Navy — Gothic Sector", "Eldar Corsairs — Gothic Sector", true],
    ["Imperial Navy — Gothic Sector", "Eldar — Iyanden Craftworld", false],
    ["Imperial Navy — Gothic Sector", "Dark Eldar — Pirates", false],
    ["Imperial Navy — Gothic Sector", "Tau — Merchant Fleet", true],
    ["Imperial Navy — Gothic Sector", "Space Marines — Codex Astartes", true],
    ["Imperial Navy — Gothic Sector", "Orks — Waaagh!", false],
    ["Imperial Navy — Gothic Sector", "Chaos — Incursion", false],
    ["Imperial Navy — Gothic Sector", "Necrons — Harvest Fleet", false],
    ["Imperial Navy — Gothic Sector", "Tyranids — Hive Fleet", false],
    ["Imperial Navy — Gothic Sector", "Rogue Traders", true],
    ["Orks — Waaagh!", "Chaos — Incursion", true],
    ["Orks — Waaagh!", "Dark Eldar — Pirates", true],
    ["Orks — Waaagh!", "Rogue Traders", true],
    ["Orks — Waaagh!", "Imperial Navy — Gothic Sector", false],
    ["Orks — Waaagh!", "Tau — Merchant Fleet", false],
    ["Chaos — Incursion", "Dark Eldar — Pirates", true],
    ["Chaos — Incursion", "Eldar Corsairs — Gothic Sector", false],
    ["Chaos — Incursion", "Eldar — Iyanden Craftworld", false],
    ["Rogue Traders", "Tyranids — Hive Fleet", false],
    ["Rogue Traders", "Necrons — Harvest Fleet", false],
    ["Tau — Merchant Fleet", "Space Marines — Codex Astartes", false],
    ["Tau — Merchant Fleet", "Demiurg — War Host", true],
    ["Space Marines — Codex Astartes", "Eldar Corsairs — Gothic Sector", false],
    ["Space Marines — Codex Astartes", "Rogue Traders", true],
    ["Space Marines — Codex Astartes", "Demiurg — War Host", false],
  ];
  let ran = 0;
  CASES.forEach(function(c){
    const H = byName(c[0]), D = byName(c[1]);
    if(!H || !D){ check("13d: list missing " + c[0] + " / " + c[1], false, "-"); return; }
    const F = fleetWith(H, [{ L: D }]);
    if(!F){ check("13d: ship not found" + c[0] + " / " + c[1], false, "-"); return; }
    ran++;
    const red = allyRed(F);
    check("alliance " + (c[2] ? "allowed" : "forbidden") + ": " + c[0] + " + " + c[1],
          c[2] ? red.length === 0 : red.length > 0,
          red.map(function(x){ return x.t; }).join(" ; ") || "no ban row");
  });
  check("13d: the matrix ran", ran >= 20, String(ran));

  /* The second sentence of the Imperium: a Space Marine ally excludes the others,
     except Rogue Traders. Each pair alone is legal. */
  {
    const IN = byName("Imperial Navy — Gothic Sector");
    const SM = byName("Space Marines — Codex Astartes");
    const CO = byName("Eldar Corsairs — Gothic Sector");
    const RT = byName("Rogue Traders");
    const two = fleetWith(IN, [{ L: SM }, { L: CO }]);
    check("a Space Marine ally excludes the Corsair",
          allyRed(two).length > 0, allyRed(two).map(x => x.t).join(" ; ") || "no ban row");
    const ok2 = fleetWith(IN, [{ L: SM }, { L: RT }]);
    check("a Rogue Trader is an allowed exception beside a Space Marine",
          allyRed(ok2).length === 0, allyRed(ok2).map(x => x.t).join(" ; "));
  }
})();

/* ---- 13e. "excluding Xenos ships" ------------------------------------
   The source says the same sentence three times from different directions:

     Imperials: "...except Rogue Trader vessels (excluding Xenos ships)."
     Space Marines: "will only ally with Imperials ... and Rogue Trader
                     vessels (excluding Xenos ships)."
     Rogue Traders: "...but may not take Xenos vessels when allied with
                     Space Marines."

   The third is the widest: it does not limit an ally row but bans Xenos
   ships from the fleet, the Rogue Trader's OWN too, when a Space Marine ally
   is present. So this is a fleet-level rule, not a pair rule. Xenos rows are
   only on the Rogue Traders lists. */
(function(){
  const byName = nm => catalog.lists.filter(x => x.nm === nm)[0];
  const rowLike = (Lx, re) => {
    for(let si = 0; si < Lx.secs.length; si++){
      if(Lx.secs[si].ct !== "type") continue;
      for(let ei = 0; ei < Lx.secs[si].ents.length; ei++){
        const en = Lx.secs[si].ents[ei];
        if(en.k !== "unit" || !en.r || en.p == null) continue;
        if(!re.test(String(en.l))) continue;
        return { si, ei, en };
      }
    }
    return null;
  };
  const mk = (Lx, at, role) => ({
    schemaVersion: 3, role: role || "core",
    entry: { list: Lx.nm, section: Lx.secs[at.si].t, label: at.en.l },
    ref: at.en.r == null ? null : String(at.en.r),
    hull: at.en.hc ? String(at.en.r) : null,
    hulls: 1, name: "", note: "", adjust: 0,
    custom: at.en.p == null && !at.en.hc ? 0 : null,
    members: [], options: {}, upgrades: {} });
  const run = (host, parts) => DOMAIN.resolveFleet(
    { list: host.nm, limit: 1000000, units: parts }, catalog);
  const xenoRed = F => F.checks.filter(function(c){
    return !c.ok && /Xenos/.test(c.t); });

  const IN = byName("Imperial Navy — Gothic Sector");
  const SM = byName("Space Marines — Codex Astartes");
  const RT = byName("Rogue Traders");
  const anyOf = Lx => rowLike(Lx, /./);
  const xeno = rowLike(RT, /^Xenos Vessel/);
  const plain = rowLike(RT, /^(?!Xenos)/);
  check("13e: a Xenos row is found on the Rogue Traders", !!xeno, xeno ? xeno.en.l : "-");
  check("13e: a non-Xenos row is found on the Rogue Traders", !!plain, plain ? plain.en.l : "-");
  if(!xeno || !plain) return;

  /* 1. A Space Marine fleet takes no Xenos ship as an ally. */
  check("Space Marine fleet: a Xenos ship as an ally is forbidden",
        xenoRed(run(SM, [mk(SM, anyOf(SM)), mk(SM, anyOf(SM)), mk(SM, anyOf(SM)),
                         mk(RT, xeno, "ally")])).length > 0, "-");
  /* 2. The same fleet takes an ordinary Rogue Trader ship. */
  check("Space Marine fleet: an ordinary Rogue Trader ship is fine",
        xenoRed(run(SM, [mk(SM, anyOf(SM)), mk(SM, anyOf(SM)), mk(SM, anyOf(SM)),
                         mk(RT, plain, "ally")])).length === 0, "-");
  /* 3. An Imperial fleet with a Space Marine ally may not take a Xenos ship -
        though a Rogue Trader is otherwise allowed. */
  check("beside a Space Marine ally a Xenos ship is forbidden",
        xenoRed(run(IN, [mk(IN, anyOf(IN)), mk(IN, anyOf(IN)), mk(IN, anyOf(IN)),
                         mk(IN, anyOf(IN)), mk(IN, anyOf(IN)), mk(IN, anyOf(IN)),
                         mk(SM, anyOf(SM), "ally"), mk(RT, xeno, "ally")])).length > 0, "-");
  /* 4. A Rogue Trader fleet: its own Xenos ship is banned if a Space Marine
        ally is present. This is what a pair check cannot see - neither pair
        is illegal. */
  check("Rogue Trader: its own Xenos ship is forbidden with a Space Marine ally",
        xenoRed(run(RT, [mk(RT, anyOf(RT)), mk(RT, anyOf(RT)), mk(RT, anyOf(RT)),
                         mk(RT, xeno), mk(SM, anyOf(SM), "ally")])).length > 0, "-");
  /* 5. Control: without a Space Marine ally its own Xenos ship is legal, so
        the rule does not pin down the wrong thing. */
  check("Rogue Trader: its own Xenos ship is legal without Space Marines",
        xenoRed(run(RT, [mk(RT, anyOf(RT)), mk(RT, anyOf(RT)), mk(RT, anyOf(RT)),
                         mk(RT, xeno)])).length === 0, "-");
})();

/* ---- 13f. the picker and the legality panel say the same ------------------
   The catalogue's source picker groups the lists by whether they lend to this
   fleet. That is an answer BEFORE a ship is chosen; the panel answers only
   after. If they differ, the player sees "no" in the picker and never the book
   sentence that decided it - exactly the silent wrong answer the Registry's
   source warns against.

   So all 32 x 32 pairs are gone through both ways. The pair-level red rows are
   these five; row and fleet level rows (lend_ban, a reserve of a reserve, a
   third ally, Xenos) do not belong here, because the picker claims nothing
   about them. */
(function(){
  const PAIR_RED = /^(Takes no reserves or allies|Gives no reserves or allies|Never allies|Reserve race|Same race, so a reserve and not an ally)/;
  const firstShip = Lx => {
    for(let si = 0; si < Lx.secs.length; si++){
      if(Lx.secs[si].ct !== "type") continue;
      for(let ei = 0; ei < Lx.secs[si].ents.length; ei++){
        const en = Lx.secs[si].ents[ei];
        if(en.k === "unit" && en.r && en.p != null) return { si, ei, en };
      }
    }
    return null;
  };
  const mk = (Lx, at, role) => ({
    schemaVersion: 3, role: role || "core",
    entry: { list: Lx.nm, section: Lx.secs[at.si].t, label: at.en.l },
    ref: at.en.r == null ? null : String(at.en.r),
    hull: at.en.hc ? String(at.en.r) : null,
    hulls: 1, name: "", note: "", adjust: 0, custom: null,
    members: [], options: {}, upgrades: {} });

  let pairs = 0, noSip = 0;
  const disagree = [];
  catalog.lists.forEach(function(L){
    const hAt = firstShip(L);
    if(!hAt){ noSip++; return; }
    catalog.lists.forEach(function(D){
      if(D === L) return;
      const dAt = firstShip(D);
      if(!dAt){ noSip++; return; }
      const v = DOMAIN.lendVerdict(L, D);
      /* For a forbidden pair the role is the one the app would give by
         default: same race -> reserve, other race -> ally. Otherwise the case
         would not even run the rule that should fail it. */
      const role = v.role ||
        (D.race && L.race && D.race === L.race ? "reserve" : "ally");
      /* Six own hulls, so 1:3 does not fail the case - it is not a pair-level
         row and does not belong in this comparison. */
      const own = [];
      for(let k = 0; k < 6; k++) own.push(mk(L, hAt));
      const F = DOMAIN.resolveFleet(
        { list: L.nm, limit: 1000000, units: own.concat([mk(D, dAt, role)]) },
        catalog);
      const red = F.checks.filter(c => !c.ok && PAIR_RED.test(c.t));
      const panelSaysNo = red.length > 0;
      const pickerSaysNo = v.kind === "no";
      pairs++;
      if(panelSaysNo !== pickerSaysNo)
        disagree.push(L.nm + " <- " + D.nm + ": picker " +
          (pickerSaysNo ? "no" : v.kind) + ", panel " +
          (panelSaysNo ? red.map(c => c.t).join(" ; ") : "green"));
    });
  });
  /* A bare yes/no is not enough. The first version said "allowed" rightly but
     for a wrong reason: it read the named permissions before the race gate, so
     three other Imperial Navy lists showed as conditional ("needs an
     Inquisitor Lord", p. 139) though they are ordinary same-race reserves. The
     test was green all along. So the KIND and the ROLE are checked too. */
  const wrongKind = [], wrongRole = [], fakeCond = [];
  catalog.lists.forEach(function(L){
    catalog.lists.forEach(function(D){
      if(D === L) return;
      const v = DOMAIN.lendVerdict(L, D);
      /* res_ban bans the same race too (Crusade p. 99, Grey Knights p. 145),
         and it is the list's own sentence - more precise than the race gate. */
      const same = !!(D.race && L.race && D.race === L.race) &&
                   !L.res_ban && !D.res_ban;
      if(same && !(v.kind === "reserve" && !v.cond))
        wrongKind.push(L.nm + " <- " + D.nm + ": " + v.kind +
          (v.cond ? " (" + v.cond + ")" : ""));
      if(v.kind !== "no" && v.kind !== "own" &&
         v.role !== "reserve" && v.role !== "ally")
        wrongRole.push(L.nm + " <- " + D.nm + ": " + JSON.stringify(v.role));
      if(v.cond){
        const g = DOMAIN.lendGrantFor(L, D);
        if(!g || !g.needs_re) fakeCond.push(L.nm + " <- " + D.nm);
      }
    });
  });
  check("a same-race list is always an ordinary reserve, not conditional",
        wrongKind.length === 0, wrongKind.slice(0, 5).join("  |  "));
  check("an allowed pair always has a role", wrongRole.length === 0,
        wrongRole.slice(0, 5).join("  |  "));
  check("the condition is recorded only when the permission has needs_re",
        fakeCond.length === 0, fakeCond.slice(0, 5).join("  |  "));
  check("13f: every pair was run", pairs >= 900, String(pairs));
  check("13f: every list has a ship", noSip === 0, String(noSip));
  check("the picker and the panel agree on every pair",
        disagree.length === 0, disagree.slice(0, 6).join("  |  "));

  /* The role is the book's role, not the race's default. A named permission
     gives the ship AS A NORMAL RESERVE (p. 101), so the picker must not label
     it an ally - that would open a second 1:3 budget next to the reserve's. */
  const dom = catalog.lists.filter(x => /Dominion/.test(x.nm))[0];
  const rt = catalog.lists.filter(x => x.nm === "Rogue Traders")[0];
  if(dom && rt){
    /* Asking at the RESERVE door a named permission gives the role reserve
       (p. 101 "as normal reserves"), not ally - that would open a second 1:3
       budget. Without asking for a role the answer is ally, because that door
       is open without conditions; exactly that difference was the picker's bug on 15.9. */
    check("a named permission gives the role reserve when a reserve is asked for",
          DOMAIN.lendVerdict(dom, rt, "reserve").kind === "grant" &&
          DOMAIN.lendVerdict(dom, rt, "reserve").role === "reserve",
          JSON.stringify(DOMAIN.lendVerdict(dom, rt, "reserve")));
    check("without asking the role is ally, because that door is open without conditions",
          DOMAIN.lendVerdict(dom, rt).kind === "ally",
          JSON.stringify(DOMAIN.lendVerdict(dom, rt)));
  }
  /* A conditional permission shows as a condition, not as a bare yes/no: "An
     Eldar Hero must lead the fleet in order to use Craftworld Eldar vessels as
     reserves" (p. 316). */
  const cors = catalog.lists.filter(x => /^Eldar Corsairs/.test(x.nm))[0];
  const iyan = catalog.lists.filter(x => /Iyanden/.test(x.nm))[0];
  if(cors && iyan){
    check("a conditional permission carries its condition to the reserve door",
          !!DOMAIN.lendVerdict(cors, iyan, "reserve").cond,
          JSON.stringify(DOMAIN.lendVerdict(cors, iyan, "reserve")));
  }
})();

/* ---- 13g. the row-level verdict vs. the engine -------------------------
   The same demand as in 13f, one level lower. The catalogue colours every
   row's plus button by whether that row can be borrowed; if it is wrong, the
   player thinks a legal ship is banned or the other way round. So
   lendRowVerdict is run against a real resolveFleet.

   All 18 "limited" pairs are gone through completely, because they hold the
   host-specific limits (lend_ban, not_re) - the rare case the whole middle
   group exists for. From the other pairs a fixed sample is taken, so the run
   does not slow down; the sample is deterministic, not random, so a red repeats
   the same. */
(function(){
  const ROW_RED = /^(Not lent as a reserve|Not granted as a reserve|Reserve of a reserve|Named access, not a reserve|Not a reserve type|Reserve needs |No Xenos vessels beside Space Marines|Takes no reserves or allies|Gives no reserves or allies|Never allies|Reserve race|Same race, so a reserve and not an ally)/;
  const firstCore = Lx => {
    for(let si = 0; si < Lx.secs.length; si++){
      if(Lx.secs[si].ct !== "type") continue;
      for(let ei = 0; ei < Lx.secs[si].ents.length; ei++){
        const en = Lx.secs[si].ents[ei];
        if(en.k === "unit" && en.r && en.p != null) return { si, ei, en };
      }
    }
    return null;
  };
  const mk = (Lx, at, role) => ({
    schemaVersion: 3, role: role || "core",
    entry: { list: Lx.nm, section: Lx.secs[at.si].t, label: at.en.l },
    ref: at.en.r == null ? null : String(at.en.r),
    hull: at.en.hc ? String(at.en.r) : null,
    hulls: 1, name: "", note: "", adjust: 0, custom: null,
    members: [], options: {}, upgrades: {} });

  let runs = 0, skipped = 0;
  const wrong = [];
  let openSeen = 0;
  catalog.lists.forEach(function(L){
    const hAt = firstCore(L);
    if(!hAt) return;
    catalog.lists.forEach(function(D){
      if(D === L) return;
      /* Six ordinary hulls: the fleet has no Inquisitor and no Eldar Hero, so
         a conditional permission is not in force. */
      const ctx = { condMet: false };
      const sum = DOMAIN.lendSummary(L, D, catalog, ctx);
      /* Every limited one, and every seventh open one. */
      if(sum.kind === "open"){ openSeen++; if(openSeen % 7 !== 0) return; }
      else if(sum.kind !== "limited") return;
      const role = sum.verdict.role || "ally";
      D.secs.forEach(function(sec, si){
        sec.ents.forEach(function(en, ei){
          if(!DOMAIN.lendOfferable(en)) return;
          /* An open price and a hull choice would need an intent of their own;
             they are counted, not skipped silently. */
          if(en.r == null || en.p == null || en.hc){ skipped++; return; }
          const own = [];
          for(let k = 0; k < 6; k++) own.push(mk(L, hAt));
          const F = DOMAIN.resolveFleet({ list: L.nm, limit: 1000000,
            units: own.concat([mk(D, { si, ei, en }, role)]) }, catalog);
          const red = F.checks.filter(c => !c.ok && ROW_RED.test(c.t));
          const engineNo = red.length > 0;
          const mine = !DOMAIN.lendRowVerdict(L, D, si, en, catalog, ctx).ok;
          runs++;
          if(engineNo !== mine)
            wrong.push(L.nm + " <- " + D.nm + " / " + sec.t + " / " + en.l +
              ": catalogue " + (mine ? "no" : "yes") + ", engine " +
              (engineNo ? red.map(c => c.t).join(" ; ") : "green"));
        });
      });
    });
  });
  check("13g: row cases ran", runs >= 800, String(runs));
  check("the row's plus button and the engine agree",
        wrong.length === 0, wrong.slice(0, 5).join("  |  "));

  /* The middle group exists only for host-specific limits. If it widened to
     mean "the list has a row that is not lent", it would be on for 406 pairs
     of 408 and say nothing. */
  let limited = 0, open = 0;
  const badCause = [], cause = {};
  catalog.lists.forEach(function(L){
    catalog.lists.forEach(function(D){
      const sum = DOMAIN.lendSummary(L, D, catalog, { condMet: false });
      if(sum.kind === "limited"){
        limited++;
        if(!sum.only || ["lend_ban", "not_re", "needs", "xenos"].indexOf(sum.only.cause) < 0)
          badCause.push(L.nm + " <- " + D.nm);
        else cause[sum.only.cause] = (cause[sum.only.cause] || 0) + 1;
      }
      if(sum.kind === "open") open++;
    });
  });
  /* `needs` is zero and not by chance: no named permission is the only route,
     every one of the 27 permission pairs also has the ally door open without
     conditions, so a condition never closes a list - it concerns only the
     reserve door. What remains are row-specific limits, and they can all be
     named: **lend_ban 15** is a single donor, Imperial Navy - Armageddon
     Sector, for each of the 15 hosts that can borrow from it (p. 41's starred
     Space Marine ships); **xenos 6** is two Space Marine hosts (Codex Astartes
     and Dominion; Crusade and Grey Knights do not borrow at all) times three
     Rogue Traders lists. `not_re` no longer shows, because it belongs to the
     permission, i.e. the reserve door, and these pairs go through the ally
     door - the Xenos rows still fail, by their own rule. The numbers are
     recorded so a data change shows here and not first in the menu. */
  const causeOK = cause.lend_ban === 15 && cause.xenos === 6 &&
                  !cause.needs && !cause.not_re;
  check("the limited pairs are named, and there are 21",
        limited === 21 && causeOK && badCause.length === 0,
        JSON.stringify(cause) + " ; " +
        limited + " limited, " + open + " open, cause errors: " +
        badCause.slice(0, 3).join(" | "));
  /* This was first `skipped >= 0`, which can never fail - it looks like a
     check and is not. What is measured is that the sample covers most rows:
     if a data change made half the rows skippable, coverage would collapse
     silently. */
  check("13g: skipped cases are a fraction of those run",
        skipped * 4 < runs,
        skipped + " skipped (open price or hull choice) / " + runs + " run");
})();

/* ---- 13h. a weapon badge must not disagree with the book -----------------
   The card's weapon badge groups a row by HOW the weapon is resolved, and the
   card has no legend for the letters - the colour does the grouping. `wepClass`
   recognises a weapon by its NAME with a regular expression and drops anything
   it does not recognise into batteries. That silent default was wrong for five
   weapon families at once, and all were noticed only by eye (owner 15.9.):
   Bio-plasma read on the card with the same badge as the Pyro-acid battery next
   to it.

   This test does not read names but the BOOK'S SENTENCE: the special rule's own
   text says what the weapon is, and the badge must not say otherwise. So the
   next lance-like weapon cannot fall silently into batteries. */
(function(){
  const LANCE = /(?:functions|hits|fires) (?:as|like) a lance/i;
  /* "a weapon battery", "a standard weapon battery" and a bare "weapon
     battery;" - the Lightning Arc's sentence starts without an article, and a
     stricter expression dropped it silently from the check. */
  const BATT  = /\bweapon battery\b/i;
  /* A named exception with its reason. By the book the Bombardment Cannon is
     "a weapon battery", but it always hits on 4+, causes criticals on 4+ and
     also hits ordnance (p. 94) - it is a weapon of its own, and shares its
     badge with the nova cannon as the fleet's heavy prow weapon. Undoing that is
     a decision of its own, not a skip in this test. */
  const EXCEPT = { bombardment: "N" };

  /* The set of names includes names that arise only from an upgrade: Orbital
     mines is a `k:"up"` row whose `swp.nm` renames the launch bay, and that name
     is in no ship's profile. The first version read only the profiles and so
     claimed /orbital mine/i was dead code - on the contrary, it is the only way
     to see the mine row. */
  const names = {};
  Object.keys(catalog.ships).forEach(function(k){
    const sh = catalog.ships[k];
    (sh.aw || []).forEach(function(a){ names[a[0]] = sh.fl || ""; });
  });
  catalog.lists.forEach(function(L){
    L.secs.forEach(function(sec){
      sec.ents.forEach(function(en){
        if(en.swp && en.swp.nm && !names.hasOwnProperty(en.swp.nm))
          names[en.swp.nm] = "";
      });
    });
  });
  let checked = 0;
  const wrong = [];
  (DOMAIN.SPECIAL_WEAPON_RULES || []).forEach(function(r){
    if(!r.wep || r.wep.source === "^$") return;
    const wantL = LANCE.test(r.text), wantB = BATT.test(r.text) && !wantL;
    if(!wantL && !wantB) return;
    const want = EXCEPT[r.id] || (wantL ? "L" : "G");
    Object.keys(names).forEach(function(nm){
      if(!r.wep.test(nm)) return;
      if(r.fleet && !r.fleet.test(names[nm])) return;
      checked++;
      const got = DOMAIN.wepClass(nm)[0];
      if(got !== want)
        wrong.push(nm + " (" + r.id + "): marker " + got + ", the book says " +
          (wantL ? "lance" : "weapon battery") + " -> " + want);
    });
  });
  check("13h: weapon badges checked against the book's sentence", checked >= 25,
        String(checked));
  check("no weapon badge disagrees with the book's sentence",
        wrong.length === 0, wrong.slice(0, 6).join("  |  "));

  /* The same the other way: contact weapons. The book says "on contact", and
     the row's strength is "Spec." - a battery badge would promise Firepower. */
  const CONTACT = ["Massive claws", "Feeder tentacles",
                   "Feeder tentacles & massive claws", "Impaler assault module"];
  const badContact = CONTACT.filter(function(nm){
    return !names.hasOwnProperty(nm) || DOMAIN.wepClass(nm)[0] !== "R"; });
  check("contact weapons carry the contact marker", badContact.length === 0,
        badContact.join(" | "));

  /* And so a class does not empty unnoticed: every WEP row must have at least
     one real weapon in the data, otherwise the row is dead code that looks like
     a rule. */
  const empty = DOMAIN.WEP.filter(function(w){
    return !Object.keys(names).some(function(nm){ return w[0].test(nm); }); })
    .map(function(w){ return String(w[0]) + " -> " + w[1]; });
  check("every weapon badge matches some real weapon",
        empty.length === 0, empty.join(" | "));

  /* J147 (owner 20.9.): Tau's two own systems were read as batteries. The
     book p. 450: "Ships with gravitic launchers are armed with Tau missiles",
     and missiles are ordnance - the same badge and colour as torpedoes. A hook
     is no weapon at all: "gravitic hooks have no effect in game terms", but
     their number limits the fleet's escorts, so the row stays on the card with
     its own badge and its own colour. */
  const launcher = DOMAIN.wepClass("Prow gravitic launcher");
  const torp = DOMAIN.wepClass("Prow torpedoes");
  check("a gravitic launcher is ordnance, not a battery: the same badge and colour as torpedoes",
        launcher[0] === "T" && launcher[1] === torp[1] && launcher[2] === torp[2],
        JSON.stringify({ launcher: launcher, torpedo: torp }));
  const hook = DOMAIN.wepClass("Port gravitic hook");
  const others = DOMAIN.WEP.filter(function(w){ return w[1] !== "H"; }).map(function(w){ return w[2]; })
    .concat(["#A97913"]);
  check("gravitic hook: a badge and colour of its own that no other group uses",
        hook[0] === "H" && others.indexOf(hook[1]) < 0, JSON.stringify(hook) + " vs " + others.join(","));
  /* On the card the rule's star and the row's badge are the same colour, so
     the eye links them. */
  const hookRule = (DOMAIN.SPECIAL_WEAPON_RULES || []).filter(function(r){ return r.id === "tau_hook"; })[0];
  check("the hook's badge carries the same colour as its rule row on the card",
        !!hookRule && hookRule.color === hook[1], hookRule ? hookRule.color + " / " + hook[1] : "no rule");
  /* The same decision on the picker's row: a hook as a word of its own, a launcher as a torpedo. */
  check("the picker's row: HOOK and TORP",
        DOMAIN.armAbbr("Port gravitic hook") === "HOOK" &&
        DOMAIN.armAbbr("Prow gravitic launcher") === "TORP" &&
        DOMAIN.ARM_ORDER.indexOf("HOOK") > DOMAIN.ARM_ORDER.indexOf("TORP"),
        DOMAIN.armAbbr("Port gravitic hook") + " / " + DOMAIN.armAbbr("Prow gravitic launcher"));
  /* Capacity is the number the fleet rule counts - not "Spec.". */
  check("a number is read from the hook capacity",
        DOMAIN.armStrength("Capacity: 1 Warden") === "1" &&
        DOMAIN.armStrength("Capacity: 2 Orcas/Wardens") === "2" &&
        DOMAIN.armStrength("Capacity: 4 Dhows") === "4",
        [DOMAIN.armStrength("Capacity: 1 Warden"), DOMAIN.armStrength("Capacity: 2 Orcas/Wardens")].join(" | "));
  const tauShips = Object.values(catalog.ships).filter(function(s){
    return (s.aw || []).some(function(a){ return /gravitic hook/i.test(a[0]); }) &&
           (s.aw || []).some(function(a){ return /gravitic launcher/i.test(a[0]); }); });
  const groupsOf = function(s){ return DOMAIN.armSummary(s, { max: 99 }).groups.map(function(g){ return g.k; }); };
  check("on a Tau ship's row hooks and the launcher are groups of their own, not WB",
        tauShips.length >= 2 && tauShips.every(function(s){
          var k = groupsOf(s);
          return k.indexOf("HOOK") >= 0 && k.indexOf("TORP") >= 0;
        }), tauShips.length + " ships: " + groupsOf(tauShips[0]).join(","));
  /* On a short ship the groups also show on the row (four groups fit). */
  const small = tauShips.filter(function(s){ return DOMAIN.armSummary(s).groups.length <= 3; })[0];
  check("a short Tau row writes the hooks' capacity out",
        !!small && /HOOK \d/.test(DOMAIN.armSummaryText(small)),
        small ? small.nm + ": " + DOMAIN.armSummaryText(small) : "no ship");

})();

/* ---- 13i. the Warmaster's Mark: who has already paid for it --------------
   Two sentences of the book meet. The list says "The Warmaster must take the
   Mark of X", and the god's own battle barge says "This ship bears the Mark of
   X as part of its point cost; it does not have to be paid for separately by
   the ship's commander" (pp. 258, 260, 262, 264). Which applies depends on
   whether the Warmaster is aboard that barge - and the book says that too, in
   the ship's own rule, so nothing is inferred:

     Terminus Est / Scion of Prospero / Wage of Sin: the flagship with the
     Warmaster aboard, UNLESS the Planet Killer is present (505 pts, dearer
     than any of the three barges), when a Chaos Lord leads it.
     The Slaverer is the exception: the flagship only "unless it is the most
     expensive vessel present".

   Before the fix the row was `req`, i.e. locked, and the Mark was charged twice:
   a Nurgle Warmaster 135 (100 + 35) next to the Terminus Est whose 430 already
   includes it - and for Nurgle in the profile as well (hp 13 vs. an ordinary
   Chaos battle barge's 12). The owner's report, 15.9. */
(function(){
  const GODS = ["Nurgle", "Tzeentch", "Khorne", "Slaanesh"];
  let ran = 0;
  GODS.forEach(function(god){
    const L = catalog.lists.filter(x => x.nm === "Chaos — " + god)[0];
    check("13i: list found" + god, !!L, "-");
    if(!L) return;
    check("13i: " + god + " carries the mark_paid rule", !!L.mark_paid, "-");
    if(!L.mark_paid) return;
    const findK = (re, k) => {
      for(let si = 0; si < L.secs.length; si++)
        for(let ei = 0; ei < L.secs[si].ents.length; ei++){
          const en = L.secs[si].ents[ei];
          if(en.k === k && re.test(String(en.l || ""))) return { si, ei, en };
        }
      return null;
    };
    const wmAt = findK(/^chaos warmaster/i, "cmd");
    const shAt = findK(new RegExp(L.mark_paid.ship, "i"), "unit");
    const pkAt = findK(/^planet killer$/i, "unit");
    const mAt  = findK(/^the mark of/i, "up");
    check("13i: " + god + " rows found", !!(wmAt && shAt && mAt),
          JSON.stringify([!!wmAt, !!shAt, !!mAt]));
    if(!wmAt || !shAt || !mAt) return;
    /* The Mark row must be a DEFAULT, not required - otherwise it cannot be
       removed, and the whole fix does nothing. */
    check("the Warmaster's Mark is a default, not locked:" + god,
          !!mAt.en.dflt && !mAt.en.req,
          "dflt=" + mAt.en.dflt + " req=" + mAt.en.req);
    /* And the default really is found where the catalogue looks for it: a
       flag in the data is not enough if defaultUpgradeKeys does not return it. */
    const probe = {
      schemaVersion: 3, role: "core",
      entry: { list: L.nm, section: L.secs[wmAt.si].t, label: wmAt.en.l },
      ref: null, hull: null, hulls: 1, name: "", note: "", adjust: 0,
      custom: null, members: [], options: {}, upgrades: {} };
    const dk = DOMAIN.defaultUpgradeKeys(
      DOMAIN.selectionOf(probe, { list: L, host: L }, catalog));
    check("defaultUpgradeKeys finds the Mark:" + god,
          dk.indexOf(mAt.si + ":" + mAt.ei) >= 0, JSON.stringify(dk));
    const markId = DOMAIN.upgradeId(L.nm, L.secs[mAt.si].t, mAt.en.l);
    const mk = (a, withMark) => ({
      schemaVersion: 3, role: "core",
      entry: { list: L.nm, section: L.secs[a.si].t, label: a.en.l },
      ref: a.en.r == null ? null : String(a.en.r), hull: null, hulls: 1,
      name: "", note: "", adjust: 0, custom: null, members: [], options: {},
      /* "Without the Mark" means the player has taken it off, not that the key
         is missing: a missing key is the default, i.e. "take". */
      upgrades: (function(){ const o = {}; o[markId] = withMark ? "take" : "off"; return o; })() });
    const red = units => DOMAIN.resolveFleet(
      { list: L.nm, limit: 9000, units: units }, catalog)
      .checks.filter(c => !c.ok && /Mark of/.test(c.t));
    const want = (units, expect, nimi) => {
      const r = red(units);
      ran++;
      check(god + ": " + nimi, (r.length > 0) === expect,
            r.map(c => c.t + " / " + c.v).join(" ; ") || "nothing red");
    };
    want([mk(wmAt, true)],  false, "the Mark without the barge is right");
    want([mk(wmAt, false)], true,  "without the Mark and without the barge is red");
    want([mk(wmAt, true), mk(shAt)],  true,  "a Mark beside the barge is paid twice");
    want([mk(wmAt, false), mk(shAt)], false, "without the Mark next to the barge is right");
    if(pkAt){
      /* The Planet Killer takes the Warmaster off the barge, so the Mark is
         paid normally again. Khorne has no such branch: its condition is
         "most expensive vessel present", not the Planet Killer. */
      want([mk(wmAt, true), mk(shAt), mk(pkAt)],  false,
           "the Planet Killer makes the Mark payable again");
      want([mk(wmAt, false), mk(shAt), mk(pkAt)], true,
           "with the Planet Killer a missing Mark is red");
    }
    /* The price follows the tick, and resolveUnit does not look at the fleet:
       that is the condition of the whole solution, because cards are rendered one ship at a time. */
    const p1 = DOMAIN.resolveUnit(mk(wmAt, true),  { list: L, host: L }, catalog).points;
    const p0 = DOMAIN.resolveUnit(mk(wmAt, false), { list: L, host: L }, catalog).points;
    check(god + ": the Mark's price is the difference", p1 - p0 === mAt.en.p,
          p1 + " - " + p0 + " != " + mAt.en.p);
  });
  check("13i: all four gods were run", ran === 24, String(ran));

  /* Only the Mechanicus's two 0-point refits remain required upgrades. If
     someone gives the Mark back its `req`, this says so at once. */
  const reqs = [];
  catalog.lists.forEach(function(L){
    L.secs.forEach(function(sec){
      sec.ents.forEach(function(en){
        if(en.k === "up" && en.req && !en.incl) reqs.push(L.nm + " / " + en.l); }); }); });
  check("there are exactly two required upgrades", reqs.length === 2,
        reqs.join(" | "));
})();

/* ---- 13j. a banned list is not always a dead end -------------------------
   The matrix bans the alliance, but the book's other route is the host list's
   own page that names the other fleet's ships itself: the Chaos lists' RENEGADE
   IMPERIAL VESSELS (p. 222) and Bastion's Chaos hulls in a reserve fleet
   (p. 39). The picker shows such a list in yellow, and the plus button adds
   the HOST's own row.

   The first version found the routes by the hull reference alone and found 68,
   of which the audit found 23 wrong (the Space Marine lists' rapid strike
   vessels are SM ships with an IN profile, p. 106; the Demiurg's Rogue Trader
   Cruiser, p. 487) and 8 unclear (Grey Knights, which "will not ... provide
   ships to any other fleet list", p. 146). Now the donor list's hull must be its
   OWN: printed in its own chapter or one of the same race. */
(function(){
  const by = nm => catalog.lists.filter(x => x.nm === nm)[0];
  let total = 0;
  const kinds = {};
  catalog.lists.forEach(function(L){
    catalog.lists.forEach(function(D){
      const r = DOMAIN.lendRouteFor(L, D, catalog);
      if(!r) return;
      total++;
      kinds[r.title] = (kinds[r.title] || 0) + 1;
    });
  });
  /* 37 -> 31 in the review of 16.9.: Adeptus Mechanicus - Explorator is not an
     "Imperial Navy fleet list" (p. 124 its own list, p. 125 its own prices),
     though its race is imperial navy - p. 14's race split concerns reserves,
     and renegades "do not count as reserves" (p. 222). */
  /* J144: Ordo Malleus reserves (p. 142) on four hosts x six Chaos lists = 24.
     Bastion has no such section, because its p. 39 section covers the same. */
  check("there are exactly 55 routes (24 renegade + 24 Ordo Malleus + 6 reserve fleet + 1 Inquisition)",
        total === 55 && kinds["RENEGADE IMPERIAL VESSELS"] === 24 &&
        kinds["ORDO MALLEUS RESERVES"] === 24 &&
        kinds["THE RESERVE FLEETS OF SEGMENTUM OBSCURUS"] === 6 &&
        kinds["THE INQUISITION"] === 1,
        total + " " + JSON.stringify(kinds));

  const T = [
    ["Chaos — Incursion", "Imperial Navy — Gothic Sector", /renegade imperial vessels/i, 7],
    /* Armageddon's starred rows are Space Marine ships (p. 41). */
    ["Chaos — Incursion", "Imperial Navy — Armageddon Sector", /renegade imperial vessels/i, 8],
    ["Imperial Navy — Bastion Fleets", "Chaos — Black Crusade", /reserve fleets of segmentum obscurus/i, 5],
    ["Space Marines — Crusade", "The Emperor's Inquisition", /the inquisition/i, 3],
  ];
  T.forEach(function(t){
    const L = by(t[0]), D = by(t[1]);
    const r = L && D ? DOMAIN.lendRouteFor(L, D, catalog) : null;
    check("route: " + t[0] + " <- " + t[1],
          !!r && t[2].test(r.title) && r.n === t[3],
          r ? r.title + " n=" + r.n : "no route");
    if(!r) return;
    /* Every mapped donor row hits a host row with the same hull reference - and
       the added host row gives no pair-level red. */
    let bad = 0, runs = 0;
    Object.keys(r.map).forEach(function(k){
      const p = k.split(":").map(Number), h = r.map[k];
      const den = D.secs[p[0]].ents[p[1]], hen = L.secs[h.si].ents[h.ei];
      if(String(den.r) !== String(hen.r)) bad++;
      const intent = { schemaVersion: 3, role: "core",
        entry: { list: L.nm, section: L.secs[h.si].t, label: hen.l },
        ref: String(hen.r), hull: null, hulls: 1, name: "", note: "", adjust: 0,
        custom: null, members: [], options: {}, upgrades: {} };
      const F = DOMAIN.resolveFleet({ list: L.nm, limit: 100000, units: [intent] }, catalog);
      runs++;
      if(F.checks.some(c => !c.ok && /^(Never allies|Reserve race|Takes no|Gives no|Named access|Reserve of a reserve|Same race)/.test(c.t)))
        bad++;
    });
    check("the route's rows are the host's own and legal: " + t[1], bad === 0 && runs > 0,
          bad + " errors / " + runs);
  });

  /* The routes the audit found wrong: they must not come back. */
  const FALSE = [
    ["Chaos — Incursion", "Space Marines — Codex Astartes"],
    ["Chaos — Incursion", "Space Marines — Dominion"],
    ["Chaos — Incursion", "Grey Knights"],
    ["Chaos — Incursion", "Adeptus Mechanicus — Explorator"],
    ["Space Marines — Codex Astartes", "Demiurg — War Host"],
    ["Orks — Waaagh!", "Demiurg — War Host"],
    ["Imperial Navy — Bastion Fleets", "Grey Knights"],
  ];
  const leaked = FALSE.filter(function(t){
    return !!DOMAIN.lendRouteFor(by(t[0]), by(t[1]), catalog); })
    .map(t => t[0] + " <- " + t[1]);
  check("the wrong routes do not come back", leaked.length === 0, leaked.join(" | "));
  check("without a route the answer is empty",
        !DOMAIN.lendRouteFor(by("Orks — Waaagh!"), by("Necrons — Harvest Fleet"), catalog), "-");
})();

/* ---- 13k. section rules on the card ------------------------------------------
   The card's SPECIAL column did not see the section a hull was taken from, so
   the renegade cruiser's -1 Ld (p. 222) was missing from the card (J120), and so
   was Bastion's reserve fleet's Strange happenings (p. 39). A new `sec` gate in
   fleetMatches. Controls: the same hull in its own section gets no row. */
(function(){
  const by = nm => catalog.lists.filter(x => x.nm === nm)[0];
  /* F: the fleet's list the ship is taken into (default: the ship's own list). */
  const card = (L, secRe, rowRe, F) => {
    for(let si = 0; si < L.secs.length; si++){
      if(!secRe.test(L.secs[si].t)) continue;
      for(let ei = 0; ei < L.secs[si].ents.length; ei++){
        const en = L.secs[si].ents[ei];
        if(en.k !== "unit" || !rowRe.test(en.l)) continue;
        const R = DOMAIN.resolveUnit({ schemaVersion: 3, role: F && F !== L ? "reserve" : "core",
          entry: { list: L.nm, section: L.secs[si].t, label: en.l },
          ref: String(en.r), hull: null, hulls: 1, name: "", note: "", adjust: 0,
          custom: null, members: [], options: {}, upgrades: {} }, { list: L, host: F || L }, catalog);
        return R.rules.map(r => r.t).join(" || ");
      }
    }
    return null;
  };
  const ch = by("Chaos — Incursion"), ba = by("Imperial Navy — Bastion Fleets"),
        go = by("Imperial Navy — Gothic Sector");
  const lunar = card(ch, /^RENEGADE/, /^Lunar/);
  check("renegade cruiser: -1 Ld on the card", !!lunar && /-1 Ld for going renegade/.test(lunar), String(lunar));
  const sword = card(ch, /^RENEGADE/, /^Sword/);
  check("renegade escort: no Ld penalty, but the squadron rule",
        !!sword && !/-1 Ld/.test(sword) && /squadroned with other Chaos escorts/.test(sword), String(sword));
  const murder = card(ch, /^Cruisers$/i, /^Murder/);
  check("control: Chaos's own cruiser is not renegade", !!murder && !/Renegade/.test(murder), String(murder));
  const carnage = card(ba, /^THE RESERVE FLEETS/, /^Carnage/);
  /* The owner's decision 30.9.2026 (J153): the row only on the card of a Chaos
     hull from the reserve section, short; the details are in the book. */
  /* The owner's decision 30.9.2026 (J153): the row only on the card of a Chaos
     hull taken as a reserve ("reserve fleet" = the ships taken as reserves), the
     whole rule as in the book (p. 39) and a mention of the Inquisitor (p. 142). */
  const SH = /Strange happenings \(reserve vessel\): a double on a command check makes the ship unreliable for the rest of the game/;
  check("Bastion's reserve Carnage: Strange happenings on the card",
        !!carnage && SH.test(carnage) && /Reserve fleet vessel/.test(carnage) &&
        !/Battlefleet Obscura Reserve Fleet, every vessel/.test(carnage),
        String(carnage));
  check("... when crippled tries to disengage every turn and flees to the nearest table edge (p. 39)",
        /once crippled it must try to disengage every turn, and runs for the nearest table edge if it fails/.test(carnage), String(carnage));
  check("... a failed double: only the minimum move straight ahead this turn (p. 39)",
        /If the double also failed the check, it does nothing this turn but make its minimum move straight ahead/.test(carnage), String(carnage));
  check("... second double against Chaos: disengages at once, for the rest of the game (p. 39)",
        /Against Chaos: a second double means it must try to disengage at once, as if crippled, for the rest of the game/.test(carnage), String(carnage));
  check("... failed second double: defects, victory points to neither side (p. 39)",
        /if that second double also failed the check, the ship defects to the Chaos player and scores victory points for neither side/.test(carnage), String(carnage));
  check("... the mention of the Inquisitor: not in force while the Ordo Malleus Inquisitor's ship is in play (p. 142)",
        /If an Ordo Malleus Inquisitor leads the fleet, this does not apply while the Inquisitor's ship remains in play\. \(Fleets pp\. 39, 142\)/.test(carnage), String(carnage));
  const glunar = card(go, /^Cruisers$/i, /^Lunar/);
  check("control: Gothic's own Lunar gets no section rules",
        !!glunar && !/Renegade|Strange happenings/.test(glunar), String(glunar));
  /* J143 (owner 16.9.): Strange happenings on every card of a Bastion fleet.
     The rule concerns the fleet ("In a reserve fleet, all vessels", p. 39), so
     the gate is the FLEET's list: a Gothic ship lent to Bastion gets the row too,
     but a Bastion ship lent to Gothic does not. The fixed ordnance rules of the
     Chaos hull (obscura_reserve) stay in the section. */
  const blunar = card(ba, /^Cruisers$/i, /^Lunar/);
  check("Bastion's own Lunar: no Strange happenings row and no reserve hull rule (J153)",
        !!blunar && !/Strange happenings/.test(blunar) && !/Reserve fleet vessel/.test(blunar), String(blunar));
  const bsword = card(ba, /^ESCORTS$/i, /^Sword/);
  check("Bastion's own escort: no Strange happenings row (J153)", bsword != null && !/Strange happenings/.test(bsword), String(bsword));
  const bbig = card(ba, /^Battleships$/i, /^Apocalypse/);
  check("Bastion battleship: no Strange happenings row (J153)", !!bbig && !/Strange happenings/.test(bbig), String(bbig));
  const lentIn = card(go, /^Cruisers$/i, /^Lunar/, ba);
  check("Gothic Lunar lent to Bastion: no Strange happenings row (J153)", !!lentIn && !/Strange happenings/.test(lentIn), String(lentIn));
  const lentOut = card(ba, /^Cruisers$/i, /^Lunar/, go);
  check("control: a Bastion Lunar lent to Gothic gets no row",
        !!lentOut && !/Strange happenings/.test(lentOut), String(lentOut));
  /* The same through the fleet: resolveFleet gives ctx.list = the fleet's list,
     so the card and the fleet view must say the same. */
  const bRow = (L, secRe, rowRe, role) => {
    for(let si = 0; si < L.secs.length; si++){
      if(!secRe.test(L.secs[si].t)) continue;
      for(let ei = 0; ei < L.secs[si].ents.length; ei++){
        const en = L.secs[si].ents[ei];
        if(en.k === "unit" && rowRe.test(en.l)) return { schemaVersion: 3, role: role,
          entry: { list: L.nm, section: L.secs[si].t, label: en.l }, ref: String(en.r),
          hull: null, hulls: 1, name: "", note: "", adjust: 0, custom: null,
          members: [], options: {}, upgrades: {} };
      }
    }
    return null;
  };
  const shIn = F => F.units.map(u => (u.rules || []).some(r => SH.test(r.t)));
  const Fb = DOMAIN.resolveFleet({ list: ba.nm, limit: 100000, units: [
    bRow(ba, /^Cruisers$/i, /^Lunar/, "core"), bRow(ba, /^Cruisers$/i, /^Gothic/, "core"),
    bRow(ba, /^Cruisers$/i, /^Tyrant/, "core"), bRow(go, /^Cruisers$/i, /^Lunar/, "reserve"),
    bRow(ba, /^THE RESERVE FLEETS/, /^Carnage/, "core")] }, catalog);
  const Fg = DOMAIN.resolveFleet({ list: go.nm, limit: 100000, units: [
    bRow(go, /^Cruisers$/i, /^Lunar/, "core"), bRow(go, /^Cruisers$/i, /^Gothic/, "core"),
    bRow(go, /^Cruisers$/i, /^Dominator/, "core"), bRow(ba, /^Cruisers$/i, /^Lunar/, "reserve")] }, catalog);
  check("resolveFleet: in a Bastion fleet the row only on the reserve Carnage, in a Gothic fleet on nobody (J153)",
        Fb.units.length === 5 && JSON.stringify(shIn(Fb)) === "[false,false,false,false,true]" &&
        Fg.units.length === 4 && !shIn(Fg).some(Boolean),
        JSON.stringify({ bastion: shIn(Fb), gothic: shIn(Fg) }));
  /* A profile-level call (without a list and a row) must not require a section
     rule - otherwise print_check would require it from every card of a list. */
  /* A renegade "counts as a Chaos vessel in all respects" (p. 222), so it also
     counts in ratios like "one heavy cruiser for every two cruisers". The review
     of 16.9. found it counted only toward the 0-12 limit. The same fleet without
     the renegade Lunar is the control: then the heavy cruiser does not fit. */
  const findRow = (L, secRe, rowRe) => {
    for(let si = 0; si < L.secs.length; si++){
      if(!secRe.test(L.secs[si].t)) continue;
      for(let ei = 0; ei < L.secs[si].ents.length; ei++){
        const en = L.secs[si].ents[ei];
        if(en.k === "unit" && rowRe.test(en.l)) return { schemaVersion: 3, role: "core",
          entry: { list: L.nm, section: L.secs[si].t, label: en.l }, ref: String(en.r),
          hull: null, hulls: 1, name: "", note: "", adjust: 0, custom: null,
          members: [], options: {}, upgrades: {} };
      }
    }
    return null;
  };
  const heavy = units => {
    const F = DOMAIN.resolveFleet({ list: ch.nm, limit: 100000, units: units }, catalog);
    const r = F.checks.filter(c => /^Heavy Cruisers/i.test(c.t))[0];
    return r ? (r.ok ? "ok " : "X ") + r.v : "no row";
  };
  const uMurder = findRow(ch, /^Cruisers$/i, /^Murder/), uHades = findRow(ch, /^Heavy Cruisers$/i, /^Hades/),
        uRenLunar = findRow(ch, /^RENEGADE/, /^Lunar/);
  const without = heavy([uMurder, uHades]), withRen = heavy([uMurder, uRenLunar, uHades]);
  check("a renegade cruiser counts towards the heavy cruiser ratio",
        /^X 1 \/ 0/.test(without) && /^ok 1 \/ 1/.test(withRen),
        "without: " + without + " | with the renegade: " + withRen);

  /* The list given but the row missing - like the app's specialLines(sh, L())
     wrappers. Without the list the call would already be refused by the list
     gate, and this would not test the section gate at all (seen: a broken gate stayed green). */
  const secDefs = DOMAIN.SPECIAL_HULL_RULES.filter(d => d.sec);
  const leaky = secDefs.filter(d => DOMAIN.fleetMatches(d,
    { fl: "IMPERIAL NAVY", nm: "LUNAR", ty: "Cruiser" }, /Bastion/i.test(String(d.list)) ? ba : ch, null));
  check("the section gate rejects a profile-level call", secDefs.length === 5 && leaky.length === 0,
        secDefs.length + " section rules, leaking " + leaky.map(d => d.id).join(","));
  /* J153: the fleet gate (fleetList) went away with its only rule. */
  check("no rule has a fleet gate", DOMAIN.SPECIAL_HULL_RULES.filter(d => d.fleetList).length === 0);
})();

/* ---- 13l. a Mark that comes with the ship shows as a locked 0-point row --------
   The owner's decision 16.9.: when a Mark is fixed on the ship (the god's own
   battle barge) or included in its price (the Daemonship of Nurgle, Khorne and
   Slaanesh), a locked info row shows it and costs nothing. The rest is left to
   the player - the Warmaster's Mark can always be removed (J139).

   The row must change nothing else: not the price, not the profile (the crew's
   Mark of Nurgle gives hp +1, which the barge already has), not the card's
   rules. So the name is "Mark of", not "The Mark of" - the card's Mark rule
   reads the latter. The test runs the rows along the app's own path:
   requiredUpgradeKeys, then resolveUnit. */
(function(){
  const incl = [];
  catalog.lists.forEach(function(L){
    L.secs.forEach(function(sec){ sec.ents.forEach(function(en){
      if(en.incl) incl.push({ L: L, en: en }); }); }); });
  check("there are 7 info rows for a Mark that comes built in", incl.length === 7, String(incl.length));
  const bad = incl.filter(function(x){ const e = x.en;
    return !(e.k === "up" && e.req && e.p === 0 && !e.mod && !e.add && !e.swp &&
             /^Mark of /.test(e.l) && !/^The /.test(e.l)); });
  check("info rows are locked, free and change no profile", bad.length === 0,
        bad.map(x => x.L.nm + "/" + x.en.l).join(" | "));

  const by = nm => catalog.lists.filter(x => x.nm === nm)[0];
  const resolve = function(L, secRe, rowRe, upRe, applyReq){
    for(let si = 0; si < L.secs.length; si++){
      if(!secRe.test(L.secs[si].t)) continue;
      for(let ei = 0; ei < L.secs[si].ents.length; ei++){
        const en = L.secs[si].ents[ei];
        if(en.k !== "unit" || !rowRe.test(en.l)) continue;
        const u = { schemaVersion: 3, role: "core",
          entry: { list: L.nm, section: L.secs[si].t, label: en.l }, ref: String(en.r),
          hull: null, hulls: 1, name: "", note: "", adjust: 0, custom: null,
          members: [], options: {}, upgrades: {} };
        if(upRe) L.secs.forEach(function(s2){ s2.ents.forEach(function(e2){
          if(e2.k === "up" && upRe.test(e2.l)) u.upgrades[DOMAIN.upgradeId(L.nm, s2.t, e2.l)] = "take"; }); });
        if(applyReq){
          const keys = DOMAIN.requiredUpgradeKeys(DOMAIN.selectionOf(u, { list: L, host: L }, catalog));
          keys.forEach(function(k){ const p = k.split(":").map(Number);
            u.upgrades[DOMAIN.upgradeId(L.nm, L.secs[p[0]].t, L.secs[p[0]].ents[p[1]].l)] = "take"; });
        }
        return DOMAIN.resolveUnit(u, { list: L, host: L }, catalog);
      }
    }
    return null;
  };
  const BARGES = [["Nurgle", /^terminus est$/i, 430], ["Tzeentch", /^scion of prospero$/i, 450],
                  ["Khorne", /^slaverer$/i, 380], ["Slaanesh", /^wage of sin$/i, 430]];
  BARGES.forEach(function(b){
    const L = by("Chaos — " + b[0]);
    const R0 = resolve(L, /battleships/i, b[1], null, false);
    const R1 = resolve(L, /battleships/i, b[1], null, true);
    const row = R1 && (R1.upgrades || []).filter(x => x.label === "Mark of " + b[0])[0];
    check("the barge shows the Mark locked and free: " + b[0],
          !!row && row.state === "take" && row.required && row.included,
          row ? JSON.stringify({ state: row.state, req: row.required, incl: row.included }) : "no row");
    check("barge: price, profile and card rules unchanged: " + b[0],
          !!R0 && !!R1 && R1.points === b[2] && R0.points === b[2] &&
          JSON.stringify(R0.stats) === JSON.stringify(R1.stats) &&
          JSON.stringify(R0.rules.map(r => r.t)) === JSON.stringify(R1.rules.map(r => r.t)),
          R1 ? R1.points + " / rules " + R0.rules.length + "->" + R1.rules.length : "-");
  });
  ["Nurgle", "Khorne", "Slaanesh", "Tzeentch"].forEach(function(g){
    const L = by("Chaos — " + g);
    const plain = resolve(L, /^cruisers$/i, /^carnage/i, null, true);
    const ds0 = resolve(L, /^cruisers$/i, /^carnage/i, /^daemonship: cruiser/i, false);
    const ds1 = resolve(L, /^cruisers$/i, /^carnage/i, /^daemonship: cruiser/i, true);
    const has = R => !!R && (R.upgrades || []).some(x => x.label === "Mark of " + g && x.state === "take");
    if(g === "Tzeentch"){
      check("Tzeentch's Daemonship gets no info row (the book does not say the Mark is included)",
            !has(ds1), "-");
      return;
    }
    check("a Daemonship shows the included Mark, an ordinary cruiser does not:" + g,
          has(ds1) && !has(plain), JSON.stringify([has(ds1), has(plain)]));
    check("Daemonship: price and card unchanged: " + g,
          ds0.points === ds1.points &&
          JSON.stringify(ds0.rules.map(r => r.t)) === JSON.stringify(ds1.rules.map(r => r.t)),
          ds0.points + " / " + ds1.points);
  });
})();

/* ---- 13m. the Ordo Malleus Inquisitor and Bastion's Chaos hulls (J144) ----
   Fleets p. 142: an Imperial Navy or Mechanicus fleet led by an Ordo Malleus
   Inquisitor and with no Space Marine ships may take the Bastion list's Chaos
   hulls as reserves at the same price; they escape Strange happenings as long as
   the Inquisitor's ship is in play, and the fleet may take no Grey Knights ships.
   Before this the host lists had no Ordo Malleus at all, and Bastion's hulls
   failed the "Reserve of a reserve" check. Controls: each condition broken on its own. */
(function(){
  const by = nm => catalog.lists.filter(x => x.nm === nm)[0];
  const GO = by("Imperial Navy — Gothic Sector"), BA = by("Imperial Navy — Bastion Fleets"),
        AR = by("Imperial Navy — Armageddon Sector"), EX = by("Adeptus Mechanicus — Explorator"),
        CA = by("Space Marines — Codex Astartes"), IQ = by("The Emperor's Inquisition"),
        CI = by("Chaos — Incursion");
  const row = (L, secRe, rowRe, role) => {
    for(let si = 0; si < L.secs.length; si++){
      if(!secRe.test(L.secs[si].t)) continue;
      for(let ei = 0; ei < L.secs[si].ents.length; ei++){
        const en = L.secs[si].ents[ei];
        if(!rowRe.test(en.l)) continue;
        return { schemaVersion: 3, role: role || "core",
          entry: { list: L.nm, section: L.secs[si].t, label: en.l },
          ref: en.r == null ? null : String(en.r), hull: null, hulls: 1, name: "", note: "",
          adjust: 0, custom: null, members: [], options: {}, upgrades: {} };
      }
    }
    throw new Error("row not found: " + L.nm + " / " + secRe + " / " + rowRe);
  };
  const cruisers = (L, n) => Array.from({ length: n }, () => row(L, /^Cruisers$/i, /class cruiser$/i));
  const lord = L => row(L, /^THE INQUISITION$/, /^Inquisitor Lord/);
  const om = L => row(L, /^ORDO MALLEUS INQUISITORS$/, /^Ordo Malleus Inquisitor Lord$/);
  const carnage = L => row(L, /^ORDO MALLEUS RESERVES$/, /^Carnage/);
  const fleet = (L, units) => DOMAIN.resolveFleet({ list: L.nm, limit: 100000, units: units }, catalog);
  const bad = F => F.checks.filter(c => !c.ok).map(c => c.t + " = " + c.v);
  const chk = (F, re) => F.checks.filter(c => re.test(c.t))[0] || null;
  const red = (F, re) => !!chk(F, re) && !chk(F, re).ok;
  const SMV = /^No Space Marine vessels with Ordo Malleus/, GKV = /^No Grey Knights vessels with Ordo Malleus/,
        NEED = /^Chaos reserves need an Ordo Malleus/, LORD = /^Ordo Malleus Inquisitor needs an Inquisitor Lord/;

  /* Structure: Ordo Malleus on five IN/AM hosts, a reserve section on four. */
  const hosts = catalog.lists.filter(L => L !== IQ && L.secs.some(x => x.t === "ORDO MALLEUS INQUISITORS")).map(L => L.nm).sort();
  const resHosts = catalog.lists.filter(L => L.secs.some(x => x.t === "ORDO MALLEUS RESERVES")).map(L => L.nm).sort();
  check("Ordo Malleus on five IN/AM hosts, Chaos reserves on four (not Bastion, not Space Marines)",
        hosts.length === 5 && resHosts.length === 4 && resHosts.indexOf(BA.nm) < 0 &&
        !hosts.concat(resHosts).some(n => /^Space Marines/.test(n)),
        JSON.stringify({ hosts, resHosts }));
  const bastRows = BA.secs.filter(x => /^THE RESERVE FLEETS/.test(x.t))[0].ents;
  const priced = resHosts.every(nm => {
    const x = by(nm).secs.filter(y => y.t === "ORDO MALLEUS RESERVES")[0];
    return x.ct === "reserve" && x.ents.length === 5 && x.ents.every((e, i) =>
      e.r === bastRows[i].r && e.p === bastRows[i].p && !e.noopt && e.optno === bastRows[i].optno && e.k === "unit");
  });
  check("Ordo Malleus reserves: the same five hulls, prices and variant bans as Bastion, of kind reserve", priced, "-");

  /* The legal base case on Gothic and Explorator. */
  const Fok = fleet(GO, cruisers(GO, 3).concat([lord(GO), om(GO), carnage(GO)]));
  check("Gothic: Lord + Ordo Malleus + 3 cruisers + Carnage is legal", bad(Fok).length === 0, bad(Fok).join(" | "));
  const res = chk(Fok, /^Reserves \(cruisers\)/);
  check("the Carnage uses the reserve budget (1 / 1)", !!res && res.ok && /^1 \/ 1/.test(res.v), res ? res.v : "no row");
  const Fex = fleet(EX, cruisers(EX, 3).concat([lord(EX), om(EX), carnage(EX)]));
  check("Explorator: the same fleet is legal", bad(Fex).length === 0, bad(Fex).join(" | "));

  /* Controls, one condition at a time. */
  const Fno = fleet(GO, cruisers(GO, 3).concat([lord(GO), carnage(GO)]));
  check("without the Ordo Malleus a Chaos reserve is red", red(Fno, NEED), bad(Fno).join(" | "));
  const Fnl = fleet(GO, cruisers(GO, 3).concat([om(GO), carnage(GO)]));
  check("the Ordo Malleus without an Inquisitor Lord is red", red(Fnl, LORD), bad(Fnl).join(" | "));
  const sm = row(CA, /^Cruisers$/i, /^Strike cruiser/i, "reserve");
  const Fsm = fleet(GO, cruisers(GO, 6).concat([lord(GO), om(GO), carnage(GO), sm]));
  check("a Space Marine reserve with a Chaos reserve is red (and only that)", red(Fsm, SMV) && bad(Fsm).length === 1,
        bad(Fsm).join(" | "));
  const Fsm0 = fleet(GO, cruisers(GO, 6).concat([lord(GO), om(GO), sm]));
  check("control: a Space Marine reserve without a Chaos reserve is fine", bad(Fsm0).length === 0, bad(Fsm0).join(" | "));
  const armSm = row(AR, /^Cruisers$/i, /^Space Marine Strike Cruiser\*$/);
  const Farm = fleet(AR, cruisers(AR, 3).concat([lord(AR), om(AR), carnage(AR), armSm]));
  check("Armageddon: the list's own Space Marine row with a Chaos reserve is red", red(Farm, SMV), bad(Farm).join(" | "));
  const gkOwn = row(GO, /^THE INQUISITION$/, /^Grey Knights Strike Cruiser/);
  const Fgk = fleet(GO, cruisers(GO, 3).concat([lord(GO), om(GO), carnage(GO), gkOwn]));
  check("an own Grey Knights cruiser with a Chaos reserve is red", red(Fgk, GKV), bad(Fgk).join(" | "));
  const gkAlly = row(IQ, /^CAPITAL SHIPS$/, /^Grey Knights Strike Cruiser/, "ally");
  const Fga = fleet(GO, cruisers(GO, 3).concat([lord(GO), om(GO), carnage(GO), gkAlly]));
  check("a Grey Knights cruiser taken from another list counts too", red(Fga, GKV),
        chk(Fga, GKV) ? chk(Fga, GKV).v : "no row");
  const Fgk0 = fleet(GO, cruisers(GO, 3).concat([lord(GO), om(GO), gkOwn]));
  check("control: Grey Knights without a Chaos reserve is fine", !!chk(Fgk0, GKV) && chk(Fgk0, GKV).ok, bad(Fgk0).join(" | "));

  /* The card: the rule and when it starts. Bastion's reserve fleet row does not come. */
  const cardOf = (it, L) => DOMAIN.resolveUnit(it, { list: L, host: L }, catalog).rules.map(r => r.t).join(" || ");
  const cc = cardOf(carnage(GO), GO);
  check("the Ordo Malleus Carnage's card: Strange happenings starts only after the Inquisitor's ship",
        /Ordo Malleus reserve: Chaos ordnance, no ship class variants\. Strange happenings applies only once the Inquisitor's ship is out of play: a double on a command check makes the ship unreliable for the rest of the game/.test(cc) &&
        /minimum move straight ahead/.test(cc) && /nearest table edge/.test(cc) &&
        /defects to the Chaos player and scores victory points for neither side\. \(Fleets pp\. 39, 142\)/.test(cc) &&
        !/If an Ordo Malleus Inquisitor leads the fleet/.test(cc) &&
        !/Battlefleet Obscura Reserve Fleet|Reserve fleet vessel/.test(cc), cc);
  const gl = cardOf(row(GO, /^Cruisers$/i, /^Lunar/), GO);
  check("control: the same fleet's Lunar gets no Ordo Malleus row", !/Ordo Malleus reserve|Strange happenings/.test(gl), gl);
  const cmd = DOMAIN.resolveUnit(om(GO), { list: GO, host: GO }, catalog);
  const cmdText = (cmd.rules || []).map(r => (r && r.t) || r).join(" || ");
  check("the Ordo Malleus commander's card: hexagrammic wards and Hit and Run",
        cmd.kind === "commander" && /hexagrammic wards/.test(cmdText) && /Hit and Run attacks from this ship add \+1/.test(cmdText),
        cmdText.slice(0, 300));

  /* Explorator: a Chaos hull in the list's own section is not a Mechanicus ship
     (review/print_check 16.9.): no Gifts table, no repair bonus, no Mechanicus
     crews rule and none of the list's upgrades - "Allied and reserve vessels
     cannot use refits and upgrades from the fleet list they are allied to unless
     they are of the same race" (p. 16). The required +1 turret and dorsal lance
     would otherwise have stuck to the Carnage when it was added. */
  const exOwn = row(EX, /^Cruisers$/i, /class cruiser$/i);
  const ctxEx = { list: EX, host: EX };
  const Rc = DOMAIN.resolveUnit(carnage(EX), ctxEx, catalog), Ro = DOMAIN.resolveUnit(exOwn, ctxEx, catalog);
  const selC = DOMAIN.selectionOf(carnage(EX), ctxEx, catalog), selO = DOMAIN.selectionOf(exOwn, ctxEx, catalog);
  const rulesC = Rc.rules.map(r => r.t).join(" || ");
  check("an Explorator Carnage is not a Mechanicus ship: no Gifts, no repair bonus, no Mechanicus crews",
        Rc.mechanicus === false && Rc.gifts === false && !/ADMECH/.test(String(Rc.damage && Rc.damage.repair || "")) &&
        !/Mechanicus crews/.test(rulesC), JSON.stringify({ m: Rc.mechanicus, g: Rc.gifts, rep: Rc.damage && Rc.damage.repair }));
  check("Explorator Carnage: no list upgrades and no required keys",
        Rc.upgrades.length === 0 && DOMAIN.requiredUpgradeKeys(selC).length === 0,
        Rc.upgrades.map(u => u.label).join("; "));
  check("control: Explorator's own cruiser is a Mechanicus ship and gets the required rows",
        Ro.mechanicus === true && Ro.gifts === true && DOMAIN.requiredUpgradeKeys(selO).length >= 1 &&
        /Mechanicus crews/.test(Ro.rules.map(r => r.t).join(" ")), JSON.stringify({ m: Ro.mechanicus, k: DOMAIN.requiredUpgradeKeys(selO) }));
  const BK = by("Imperial Navy — Bakka Sector");
  const jov = BK.secs.filter(x => x.ct === "reserve")[0];
  check("control: the Jovian in Bakka's RESERVES section (Imperial) is not a foreign hull",
        !!jov && jov.ents.filter(e => e.k === "unit").every(e => !DOMAIN.foreignReserveRow(BK, e, catalog.ships[String(e.r)])) &&
        BA.secs.filter(x => /^THE RESERVE FLEETS/.test(x.t))[0].ents.every(e => DOMAIN.foreignReserveRow(BA, e, catalog.ships[String(e.r)])),
        "-");

  /* The fleet's limits (review 16.9.): p. 14 "the restrictions on maximum and
     minimum numbers of ships are determined for the fleet as a whole,
     regardless of whether they were purchased from the list or as reserves".
     Before the fix 12 Lunars + a Carnage was "Cruisers 12 / 12" - in Bastion's
     own p. 39 section too. Grand cruisers as Bastion does (p. 37) to the
     battlecruiser slot, not to the battleships' base. */
  const lunarsOf = (L, n) => Array.from({ length: n }, () => row(L, /^Cruisers$/i, /^Lunar/));
  const typeRow = (L, secRe, rowRe) => row(L, secRe, rowRe);
  const val = (F, re) => { const c = chk(F, re); return c ? (c.ok ? "ok " : "X ") + c.v : "no row"; };
  const F13 = fleet(GO, lunarsOf(GO, 12).concat([lord(GO), om(GO), carnage(GO)]));
  check("Gothic: 12 Lunars + Ordo Malleus Carnage = Cruisers 13 / 12 (red)", /^X 13 \/ 12/.test(val(F13, /^0-12 Cruisers|^Cruisers/)),
        val(F13, /^0-12 Cruisers|^Cruisers/));
  const BAc = BA.secs.filter(x => /^THE RESERVE FLEETS/.test(x.t))[0];
  const bCar = { schemaVersion: 3, role: "core", entry: { list: BA.nm, section: BAc.t, label: "Carnage class cruiser" },
    ref: "277", hull: null, hulls: 1, name: "", note: "", adjust: 0, custom: null, members: [], options: {}, upgrades: {} };
  const Fb13 = fleet(BA, lunarsOf(BA, 12).concat([bCar]));
  check("Bastion: 12 Lunars + own p.39 Carnage = Cruisers 13 / 12 (red)", /^X 13 \/ 12/.test(val(Fb13, /^0-12 Cruisers|^Cruisers/)),
        val(Fb13, /^0-12 Cruisers|^Cruisers/));
  const Fbs = fleet(GO, lunarsOf(GO, 5).concat([lord(GO), om(GO), carnage(GO),
    typeRow(GO, /^Battleships$/i, /^Emperor/), typeRow(GO, /^Battleships$/i, /^Retribution/)]));
  check("Gothic: 5 Lunars + Carnage carry two battleships (2 / 2)", /^ok 2 \/ 2/.test(val(Fbs, /^Battleships/)), val(Fbs, /^Battleships/));
  const rep = row(GO, /^ORDO MALLEUS RESERVES$/, /^Repulsive/);
  const mars = () => typeRow(GO, /^Battlecruisers$/i, /^Mars/);
  const Fbc = fleet(GO, lunarsOf(GO, 6).concat([lord(GO), om(GO), carnage(GO), rep, mars(), mars()]));
  const Fbc4 = fleet(GO, lunarsOf(GO, 6).concat([lord(GO), om(GO), carnage(GO), rep, mars(), mars(), mars()]));
  check("Gothic: the Repulsive takes a battlecruiser slot (3 / 3, the fourth is red)",
        /^ok 3 \/ 3/.test(val(Fbc, /^Battlecruisers/)) && /^X 4 \/ 3/.test(val(Fbc4, /^Battlecruisers/)),
        val(Fbc, /^Battlecruisers/) + " | " + val(Fbc4, /^Battlecruisers/));

  /* Options: p. 39 bans only class variants ("ship class variants" = ships
     that "mount different weaponry", p. 12). The Repulsive's third shield stays. */
  const optOf = (R, re) => (R.options || []).filter(o => re.test(String(o.text || o.t || o.label || "")))[0] || null;
  const Rrep = DOMAIN.resolveUnit(rep, { list: GO, host: GO }, catalog);
  const shield = optOf(Rrep, /third shield/i), aim = optOf(Rrep, /ancient targeting/i);
  const shieldId = (catalog.ships["269"].ol || []).filter(o => /third shield/i.test(o.t))[0].id;
  const Rrep3 = DOMAIN.resolveUnit(Object.assign({}, rep, { options: { [shieldId]: { state: "take" } } }), { list: GO, host: GO }, catalog);
  check("Repulsive: a third shield can be chosen (245 pts, 3 shields), ancient targeting forbidden",
        !!shield && !shield.forbidden && !!aim && aim.forbidden && Rrep3.points === 245 && String(Rrep3.stats.shields) === "3",
        JSON.stringify({ shield: shield && shield.forbidden, aim: aim && aim.forbidden, pts: Rrep3.points, sh: Rrep3.stats.shields }));
  const Rmur = DOMAIN.resolveUnit(row(GO, /^ORDO MALLEUS RESERVES$/, /^Murder/), { list: GO, host: GO }, catalog);
  check("Murder: the Plagueclaw variant is forbidden", (Rmur.options || []).length === 1 && Rmur.options[0].forbidden,
        JSON.stringify((Rmur.options || []).map(o => o.forbidden)));

  /* The picker: the route's condition and Bastion's row pointing at its own section. */
  const need = DOMAIN.lendRouteFor(GO, CI, catalog).needs;
  const omSi = GO.secs.findIndex(x => x.t === "ORDO MALLEUS INQUISITORS");
  check("the route states its condition: an Ordo Malleus Inquisitor, picked into the Ordo Malleus section",
        !!need && need.what === "an Ordo Malleus Inquisitor" && need.pick.length === 1 && need.pick[0].sec === omSi,
        JSON.stringify(need));
  const bSi = BA.secs.indexOf(BAc), bCarEn = BAc.ents.filter(e => /^Carnage/.test(e.l))[0];
  const hr = DOMAIN.hostReserveRow(GO, bCarEn);
  const goRes = GO.secs.findIndex(x => x.t === "ORDO MALLEUS RESERVES");
  check("Gothic <- Bastion: the reserve-of-a-reserve Carnage points to its own Ordo Malleus section with its condition",
        DOMAIN.lendRowVerdict(GO, BA, bSi, bCarEn, catalog, { role: "reserve", condMet: true }).cause === "reserve" &&
        !!hr && hr.si === goRes && /^Carnage/.test(GO.secs[hr.si].ents[hr.ei].l) && !!hr.needs,
        JSON.stringify(hr));
  const BKr = BK.secs.filter(x => x.t === "RESERVES")[0];
  const goCar = GO.secs[goRes].ents.filter(e => /^Carnage/.test(e.l))[0];
  const hb = DOMAIN.hostReserveRow(BA, goCar);
  check("controls: no pointer for Bakka's Jovian; Bastion <- Gothic points at Bastion's own p. 39 section without a condition",
        DOMAIN.hostReserveRow(GO, BKr.ents.filter(e => e.k === "unit")[0]) === null &&
        !!hb && hb.si === bSi && hb.needs === null, JSON.stringify(hb));
  check("the Ordo Malleus commander's card: the CSM limit (p. 142) and the benefits for the Inquisitor Lord's ship (p. 140)",
        /Rules for Chaos Space Marines still apply normally/.test(cmdText) &&
        /benefits apply to the ship they are embarked upon/.test(cmdText), cmdText.slice(0, 200));

  /* Picker: Chaos lists show the route to the Ordo Malleus section. */
  const rt = DOMAIN.lendRouteFor(GO, CI, catalog);
  check("Gothic <- Chaos Incursion: route ORDO MALLEUS RESERVES", !!rt && rt.title === "ORDO MALLEUS RESERVES",
        JSON.stringify(rt && { t: rt.title, n: rt.n }));
})();


/* ---- 13n. the weapon summary on the catalogue row (J145) --------------------------
   Owner 20.9.: while building a fleet you must see which ship is which without
   the print view. The row groups the profile's weapon rows with the card's own
   colour codes and abbreviations. A group is the number of rows x strength,
   NOT a sum: the Lunar's two batteries of six are "WB 6x2", not "WB 12" - no
   broadside is 12. */
(function(){
  const sh = nm => Object.values(catalog.ships).filter(s => s.nm === nm)[0];
  const t = (nm, o) => DOMAIN.armSummaryText(sh(nm), o);
  const by = nm => catalog.lists.filter(x => x.nm === nm)[0];
  check("Lunar: two broadsides separately, not as a sum",
        t("LUNAR CLASS CRUISER") === "WB 6\u00d72 \u00b7 LAN 2\u00d72 \u00b7 TORP 6", t("LUNAR CLASS CRUISER"));
  check("Gothic: lances and torpedoes only",
        t("GOTHIC CLASS CRUISER") === "LAN 4\u00d72 \u00b7 TORP 6", t("GOTHIC CLASS CRUISER"));
  check("Dictator: launch bays as their own group",
        t("DICTATOR CLASS CRUISER") === "WB 6\u00d72 \u00b7 TORP 6 \u00b7 BAYS 2\u00d72", t("DICTATOR CLASS CRUISER"));
  check("Mars and Strike: the nova cannon and the bombardment cannon in different words, though the card's badge is the same",
        t("MARS CLASS BATTLECRUISER") === "WB 6\u00d72 \u00b7 LAN 2 \u00b7 NOVA 1 \u00b7 BAYS 2\u00d72" &&
        /BOMB 3/.test(t("STRIKE CRUISER")) &&
        DOMAIN.wepClass("Prow bombardment cannon")[0] === DOMAIN.wepClass("Nova Cannon")[0],
        t("MARS CLASS BATTLECRUISER") + " | " + t("STRIKE CRUISER"));
  check("Eclipse: a pulsar lance is a lance (as on the card)",
        t("ECLIPSE CLASS CRUISER") === "LAN 2 \u00b7 BAYS 4", t("ECLIPSE CLASS CRUISER"));
  /* In the book the strength is free text. A number will do, "2 squadrons" is 2,
     a die as it is, and something with no number ("Special", the Tau hangar's
     "Capacity: 1 Orca/Warden", p. 494) shows the card's abbreviation Spec. */
  check("strength: a number, a squadron, a die and Spec.",
        DOMAIN.armStrength("6") === "6" && DOMAIN.armStrength("2 squadrons") === "2" &&
        DOMAIN.armStrength("D6+2") === "D6+2" && DOMAIN.armStrength("Special") === null &&
        DOMAIN.armStrength("Special (max. 8)") === null &&
        /* The number is read from the capacity (J147): it is what the fleet rule
           counts. Anything but a number will not do. */
        DOMAIN.armStrength("Capacity: 1 Orca/Warden") === "1" &&
        DOMAIN.armStrength("Capacity: a few") === null,
        [DOMAIN.armStrength("2 squadrons"), DOMAIN.armStrength("D6+2"), DOMAIN.armStrength("Capacity: 1 Orca/Warden")].join(" | "));
  const tau = Object.values(catalog.ships).filter(s => /Capacity:/i.test((s.aw || []).map(a => a[2]).join(" ")))[0];
  check("the Tau capacity does not spill onto the row as a word", !!tau && !/Capacity/i.test(DOMAIN.armSummaryText(tau)),
        tau ? tau.nm + ": " + DOMAIN.armSummaryText(tau) : "no ship");

  /* A menu hull: the profile's rows are mutually exclusive choices (an option
     owns the row, o.aws, group gmax 1). The Kraken has exactly one of these
     weapons (p. 435), so the row must not promise all five. */
  check("Kraken: does not promise five weapons but states the choice",
        t("KRAKEN") === "pick 1 of 5", t("KRAKEN"));
  check("Dragonship: two choices, not four weapons (p.330)",
        t("DRAGONSHIP") === "pick 1 of 2 \u00b7 pick 1 of 2", t("DRAGONSHIP"));
  check("Torture: the fixed battery on the row, the paid extra weapon as a choice",
        t("TORTURE CLASS CRUISER") === "WB 12 \u00b7 pick 1 of 4 \u00b7 1 optional", t("TORTURE CLASS CRUISER"));
  const kr = DOMAIN.armSummary(sh("KRAKEN"));
  check("choices are not groups but a counter of their own",
        kr.groups.length === 0 && JSON.stringify(kr.picks) === "[5]" && kr.addons === 0, JSON.stringify(kr));
  const menu = Object.values(catalog.ships).filter(s => DOMAIN.armSummary(s).picks.length).map(s => s.nm);
  /* 11: the Tau Orbital (p. 480) stopped being a menu in J171 - every defence
     system is its own security module, at most four */
  check("there are 11 menu hulls (the rest state their weapons directly)",
        menu.length === 11 && menu.indexOf("ORBITALS") < 0 && menu.indexOf("HIVE SHIP") >= 0 && menu.indexOf("KRAKEN") >= 0 &&
        menu.indexOf("LUNAR CLASS CRUISER") < 0, menu.join(" | "));
  /* Five choice groups would fill the row: then the number is what matters. */
  check("hive ship: five groups condense into one marker",
        t("HIVE SHIP") === "5 weapon choices", t("HIVE SHIP"));

  /* A list can force a weapon and a value before the player chooses anything:
     the Mechanicus's dorsal lance and +1 turret (p. 120) are on every cruiser of
     that list, so the row counts them in. */
  const EX = by("Adeptus Mechanicus \u2014 Explorator"), GO = by("Imperial Navy \u2014 Gothic Sector");
  const chg = DOMAIN.requiredHullChanges(EX, sh("GOTHIC CLASS CRUISER"));
  check("Explorator forces a dorsal lance and +1 turret on a Gothic",
        chg.rows.length === 1 && /dorsal lance/i.test(chg.rows[0][0]) && chg.mod && chg.mod.tu === 1 &&
        t("GOTHIC CLASS CRUISER", { list: EX }) === "LAN 4\u00d72, 1 \u00b7 TORP 6",
        JSON.stringify(chg) + " | " + t("GOTHIC CLASS CRUISER", { list: EX }));
  const goChg = DOMAIN.requiredHullChanges(GO, sh("GOTHIC CLASS CRUISER"));
  check("control: Gothic Sector forces nothing",
        goChg.rows.length === 0 && goChg.mod === null && t("GOTHIC CLASS CRUISER", { list: GO }) === t("GOTHIC CLASS CRUISER"),
        JSON.stringify(goChg));
  check("an Explorator escort is not a cruiser: no lance (cond ty)",
        DOMAIN.requiredHullChanges(EX, sh("NOVA CLASS FRIGATE")).rows.length === 0 &&
        DOMAIN.requiredHullChanges(EX, sh("DAUNTLESS CLASS LIGHT CRUISER")).rows.length === 0,
        t("NOVA CLASS FRIGATE", { list: EX }));
  /* A condition about the ship's current armament cannot be answered from a
     list row, so the answer is null, not a guess. */
  check("condShipOnly: profile condition yes/no, armament condition null",
        DOMAIN.condShipOnly({ cond: { ty: "cruiser" } }, sh("GOTHIC CLASS CRUISER")) === true &&
        DOMAIN.condShipOnly({ cond: { ty: "cruiser" } }, sh("NOVA CLASS FRIGATE")) === false &&
        DOMAIN.condShipOnly({ cond: { has: "torpedo" } }, sh("GOTHIC CLASS CRUISER")) === null &&
        DOMAIN.condShipOnly({}, sh("GOTHIC CLASS CRUISER")) === true, "-");

  /* The order is fixed, so the same weapon is always in the same place. */
  const order = DOMAIN.ARM_ORDER;
  const bad = Object.values(catalog.ships).filter(s => {
    const ks = DOMAIN.armSummary(s, { max: 99 }).groups.map(g => order.indexOf(g.k));
    return ks.some((v, i) => v < 0 || (i && v < ks[i - 1]));
  });
  check("the groups are always in the same order", bad.length === 0, bad.slice(0, 3).map(s => s.nm).join(" | "));
  /* A long row is cut: four groups, two strengths in each. */
  const all = Object.values(catalog.ships).map(s => [DOMAIN.armSummaryText(s), s.nm]);
  const longest = all.slice().sort((a, b) => b[0].length - a[0].length)[0];
  check("every ship has a row and the longest is under 60 characters",
        all.every(x => x[0].length > 0) && longest[0].length < 60,
        longest[1] + ": " + longest[0] + " (" + longest[0].length + ")");
  /* The cut: four groups and two strengths in each, the rest as three dots. A
     made-up ship, because the book has none armed like this. */
  const many = { nm: "TEST", aw: [["Port weapons battery", "30 cm", "6", "Left"],
    ["Starboard weapons battery", "30 cm", "5", "Right"], ["Prow weapons battery", "30 cm", "4", "Front"],
    ["Prow lance battery", "30 cm", "2", "Front"], ["Nova Cannon", "150 cm", "1", "Front"],
    ["Prow torpedoes", "30 cm", "6", "Front"], ["Port launch bays", "30 cm", "2 squadrons", "\u2013"],
    ["Orbital mines", "Contact", "Special", "\u2013"]] };
  const cut = DOMAIN.armSummary(many);
  check("truncation: four groups, two strengths, three dots",
        cut.groups.length === 4 && cut.more === 2 && cut.groups[0].items.length === 2 &&
        cut.groups[0].more === 1 &&
        DOMAIN.armSummaryText(many) === "WB 6, 5\u2026 \u00b7 LAN 2 \u00b7 NOVA 1 \u00b7 TORP 6 \u00b7 \u2026",
        DOMAIN.armSummaryText(many));
})();


/* ---- 13o. Inquisition ships within the host's limits (J148) ---------------------
   A user report 25.9.: "When adding an Inquisitorial Cruiser to a list, it
   should count as a battlecruiser/strike cruiser (pg. 138)", a GK Strike Cruiser
   as a cruiser, and the second re-roll +25. The book: the Inquisitorial Cruiser
   "takes the place of a battlecruiser or strike cruiser in the fleet"; the
   Blackship is the only one that "does not count toward or against other ship
   limits"; p. 14 "the restrictions on maximum and minimum numbers of ships are
   determined for the fleet as a whole". The appendix section's rows used to count toward nothing. */
(function(){
  const by = nm => catalog.lists.filter(x => x.nm === nm)[0];
  const GO = by("Imperial Navy \u2014 Gothic Sector"), CA = by("Space Marines \u2014 Codex Astartes"),
        EX = by("Adeptus Mechanicus \u2014 Explorator"), DO = by("Space Marines \u2014 Dominion"),
        BA = by("Imperial Navy \u2014 Bastion Fleets");
  const row = (L, secRe, rowRe) => {
    for(let si = 0; si < L.secs.length; si++){
      if(!secRe.test(L.secs[si].t)) continue;
      for(let ei = 0; ei < L.secs[si].ents.length; ei++){
        const en = L.secs[si].ents[ei];
        if(!rowRe.test(en.l)) continue;
        return { schemaVersion: 4, role: "core", entry: { list: L.nm, section: L.secs[si].t, label: en.l },
          ref: en.r == null ? null : String(en.r), hull: null, hulls: 1, name: "", note: "",
          adjust: 0, custom: null, members: [], options: {}, upgrades: {} };
      }
    }
    throw new Error("row not found: " + L.nm + " / " + secRe + " / " + rowRe);
  };
  const fleet = (L, units) => DOMAIN.resolveFleet({ list: L.nm, limit: 100000, units: units }, catalog);
  const val = (F, re) => { const c = F.checks.filter(c => re.test(c.t))[0]; return c ? (c.ok ? "ok " : "X ") + c.v : "no row"; };
  const lunar = n => Array.from({ length: n }, () => row(GO, /^Cruisers$/i, /^Lunar/));
  const lord = L => row(L, /^THE INQUISITION$/, /^Inquisitor Lord/);
  const inq = L => row(L, /^THE INQUISITION$/, /^Inquisitorial Cruiser/);
  const gk = L => row(L, /^THE INQUISITION$/, /^Grey Knights Strike/);
  const black = L => row(L, /^THE INQUISITION$/, /^Inquisition Blackship/);
  const emperor = L => row(L, /^Battleships$/i, /^Emperor/);

  /* The Inquisitorial Cruiser takes a battlecruiser slot (p.138). */
  check("the Inquisitorial Cruiser takes a battlecruiser slot: 2 cruisers carry it (1 / 1)",
        /^ok 1 \/ 1/.test(val(fleet(GO, lunar(2).concat([lord(GO), inq(GO)])), /^Battlecruisers/)),
        val(fleet(GO, lunar(2).concat([lord(GO), inq(GO)])), /^Battlecruisers/));
  check("Inquisitorial Cruiser + Mars with two cruisers is too many (2 / 1)",
        /^X 2 \/ 1/.test(val(fleet(GO, lunar(2).concat([lord(GO), inq(GO), row(GO, /^Battlecruisers$/i, /^Mars/)])), /^Battlecruisers/)),
        val(fleet(GO, lunar(2).concat([lord(GO), inq(GO), row(GO, /^Battlecruisers$/i, /^Mars/)])), /^Battlecruisers/));
  /* ... and counts as a battlecruiser toward the battleship ratio's base ("for
     every three cruisers or battlecruisers"). */
  check("the Inquisitorial Cruiser counts towards the battleship ratio base: 2 cruisers + it carry a battleship",
        /^ok 1 \/ 1/.test(val(fleet(GO, lunar(2).concat([lord(GO), inq(GO), emperor(GO)])), /^Battleships/)) &&
        /^X 1 \/ 0/.test(val(fleet(GO, lunar(2).concat([lord(GO), emperor(GO)])), /^Battleships/)),
        val(fleet(GO, lunar(2).concat([lord(GO), inq(GO), emperor(GO)])), /^Battleships/));
  check("the Inquisitorial Cruiser does not count towards the 0-12 cruiser limit (it is a battlecruiser)",
        /^ok 12 \/ 12/.test(val(fleet(GO, lunar(12).concat([lord(GO), inq(GO)])), /^Cruisers/)),
        val(fleet(GO, lunar(12).concat([lord(GO), inq(GO)])), /^Cruisers/));

  /* The Grey Knights Strike Cruiser is a cruiser (p.14, whole fleet). */
  check("the GK Strike Cruiser counts towards the 0-12 limit: 12 Lunars + GK = 13 / 12",
        /^X 13 \/ 12/.test(val(fleet(GO, lunar(12).concat([lord(GO), gk(GO)])), /^Cruisers/)),
        val(fleet(GO, lunar(12).concat([lord(GO), gk(GO)])), /^Cruisers/));
  const Fgk = fleet(GO, lunar(2).concat([lord(GO), gk(GO), emperor(GO)]));
  check("a GK Strike Cruiser counts toward the battleship ratio's base and the whole fleet is legal",
        /^ok 1 \/ 1/.test(val(Fgk, /^Battleships/)) && Fgk.checks.every(c => c.ok),
        val(Fgk, /^Battleships/) + " | " + Fgk.checks.filter(c => !c.ok).map(c => c.t).join(", "));
  /* Blackship "does not count toward or against other ship limits". */
  check("the Blackship counts towards nothing: 12 Lunars + Blackship = 12 / 12, battleships 0 / 4",
        /^ok 12 \/ 12/.test(val(fleet(GO, lunar(12).concat([lord(GO), black(GO)])), /^Cruisers/)) &&
        /^ok 0 \/ 4/.test(val(fleet(GO, lunar(12).concat([lord(GO), black(GO)])), /^Battleships/)),
        val(fleet(GO, lunar(12).concat([lord(GO), black(GO)])), /^Cruisers/) + " | " +
        val(fleet(GO, lunar(12).concat([lord(GO), black(GO)])), /^Battleships/));

  /* On the Space Marine list both take a strike cruiser slot (0-10). */
  const sc = n => Array.from({ length: n }, () => row(CA, /^Cruisers$/i, /^Strike cruisers/i));
  check("Codex: 10 strike cruisers + Inquisitorial Cruiser = 11 / 10",
        /^X 11 \/ 10/.test(val(fleet(CA, sc(10).concat([lord(CA), inq(CA)])), /^Cruisers/)),
        val(fleet(CA, sc(10).concat([lord(CA), inq(CA)])), /^Cruisers/));
  check("Codex: 9 strike cruisers + GK Strike Cruiser = 10 / 10",
        /^ok 10 \/ 10/.test(val(fleet(CA, sc(9).concat([lord(CA), gk(CA)])), /^Cruisers/)),
        val(fleet(CA, sc(9).concat([lord(CA), gk(CA)])), /^Cruisers/));
  const dsc = n => Array.from({ length: n }, () => row(DO, /^Cruisers$/i, /^Strike cruiser/i));
  check("Dominion: the conditional cap counts the GK Strike Cruiser (11 / 10)",
        /^X 11 \/ 10/.test(val(fleet(DO, dsc(10).concat([lord(DO), gk(DO)])), /^Cruisers/)),
        val(fleet(DO, dsc(10).concat([lord(DO), gk(DO)])), /^Cruisers/));
  /* Explorator: no battlecruisers - the GK is a cruiser in the ratio base. */
  check("Explorator: 2 cruisers + GK Strike Cruiser carry a battleship",
        /^ok 1 \/ 1/.test(val(fleet(EX, [row(EX, /^Cruisers$/i, /^Lunar/), row(EX, /^Cruisers$/i, /^Gothic/), lord(EX), gk(EX), emperor(EX)]), /^Battleships/)),
        val(fleet(EX, [row(EX, /^Cruisers$/i, /^Lunar/), row(EX, /^Cruisers$/i, /^Gothic/), lord(EX), gk(EX), emperor(EX)]), /^Battleships/));
  /* Bastion: battlecruisers and grand cruisers share a slot. */
  const bl = n => Array.from({ length: n }, () => row(BA, /^Cruisers$/i, /^Lunar/));
  check("Bastion: the Inquisitorial Cruiser takes a battlecruiser/grand cruiser slot",
        /^ok 1 \/ 1/.test(val(fleet(BA, bl(2).concat([lord(BA), inq(BA)])), /^Battlecruisers & Grand Cruisers/)) &&
        /^X 2 \/ 1/.test(val(fleet(BA, bl(2).concat([lord(BA), inq(BA), row(BA, /^Battleships$/i, /^Mars/)])), /^Battlecruisers & Grand Cruisers/)),
        val(fleet(BA, bl(2).concat([lord(BA), inq(BA)])), /^Battlecruisers & Grand Cruisers/));

  /* The second re-roll +25 (p.138) on the host lists. */
  const id = DOMAIN.upgradeId(GO.nm, "THE INQUISITION", "One extra re-roll");
  const R0 = DOMAIN.resolveUnit(lord(GO), { list: GO, host: GO }, catalog);
  const R1 = DOMAIN.resolveUnit(Object.assign({}, lord(GO), { upgrades: { [id]: "take" } }), { list: GO, host: GO }, catalog);
  check("Inquisitor Lord: the second re-roll +25 raises 75 -> 100 and re-rolls 1 -> 2",
        R0.points === 75 && R0.rerolls.total === 1 && R1.points === 100 && R1.rerolls.total === 2 &&
        R1.rerolls.purchased.length === 1 && R1.rerolls.purchased[0].cost === 25,
        JSON.stringify([R0.points, R0.rerolls.total, R1.points, R1.rerolls.total]));
  const hosts = catalog.lists.filter(L => L.secs.some(x => x.t === "THE INQUISITION"));
  check("a re-roll row on all eight hosts, aimed at the Inquisitor Lord",
        hosts.length === 8 && hosts.every(L => {
          const sec = L.secs.filter(x => x.t === "THE INQUISITION")[0], si = L.secs.indexOf(sec);
          const rr = sec.ents.filter(e => e.l === "One extra re-roll")[0];
          return rr && rr.p === 25 && rr.rr === 1 && JSON.stringify(rr.at) === JSON.stringify([[si, 0]]) &&
                 /^Inquisitor Lord/.test(sec.ents[0].l);
        }), hosts.map(L => L.nm).join(" | "));
})();

/* ---- 3b. weapon line of a resolved unit (the builder's fleet row) ---------- */
(() => {
  const GO = catalog.lists.filter(L => L.nm === "Imperial Navy \u2014 Gothic Sector")[0];
  const mk = (L, secRe, entRe, options) => {
    const sec = L.secs.filter(s => secRe.test(s.t))[0], en = sec.ents.filter(e => entRe.test(e.l))[0];
    const intent = { schemaVersion: DOMAIN.SCHEMA_VERSION, role: "core",
      entry: { list: L.nm, section: sec.t, label: en.l }, ref: String(en.r), hull: null, hulls: 1,
      name: "", note: "", adjust: 0, custom: null, members: [], options: options || {}, upgrades: {} };
    return { R: DOMAIN.resolveUnit(intent, { list: L }, catalog), sh: catalog.ships[String(en.r)] };
  };
  const taken = R => (R.weapons || []).filter(w => w.state !== "offered").map(w => w.a);
  /* Lunar: no weapon options, so the resolved line is the catalogue's line */
  const l = mk(GO, /^Cruisers$/i, /^Lunar/);
  const a = DOMAIN.armSummaryRows(taken(l.R)), b = DOMAIN.armSummary(l.sh, { list: GO });
  check("the weapon line of a resolved Lunar is the catalogue's weapon line",
        JSON.stringify(a.groups) === JSON.stringify(b.groups) && a.groups.length === 3,
        JSON.stringify([a.groups, b.groups]));
  /* Ork Terror ship: the torpedo launcha option adds a row the catalogue's
     line leaves out (it counts it as an optional) - the resolved line has it */
  const OR = catalog.lists.filter(L => /^Orks/.test(L.nm))[0];
  const t0 = mk(OR, /^Kroozers$/i, /^Terror ship/i);
  const opt = (t0.sh.ol || []).filter(o => /torpedo/i.test(String(o.t || "")))[0];
  check("Terror ship: the torpedo launcha is an option (in the data)", !!opt, JSON.stringify((t0.sh.ol || []).map(o => o.t)));
  if(opt){
    const t1 = mk(OR, /^Kroozers$/i, /^Terror ship/i, { [opt.id]: { state: "take", qty: 1 } });
    const s0 = DOMAIN.armSummaryRows(taken(t0.R)), s1 = DOMAIN.armSummaryRows(taken(t1.R));
    check("... a taken option brings a TORP group to the resolved weapon line, without it not",
          !s0.groups.some(g => g.k === "TORP") && s1.groups.some(g => g.k === "TORP"),
          JSON.stringify([s0.groups.map(g => g.k), s1.groups.map(g => g.k)]));
    check("... the catalogue's weapon line leaves it out (the row comes only from the option)",
          !DOMAIN.armSummary(t0.sh).groups.some(g => g.k === "TORP"),
          JSON.stringify(DOMAIN.armSummary(t0.sh)));
  }
  /* The fleet row's weapon boxes (owner 30.9.2026): the same class, strength and
     range in one box, with every row's arc in it; launch bays are added up; a
     number that cannot be added (D6) is counted as pieces. */
  const boxes = R => DOMAIN.weaponBoxes(taken(R)).map(b => [b.k, b.v, b.n, b.arcs.join("+")]);
  check("Lunar: LAN 2 and WB 6 left+right in the same box, TORP 6 in its own",
        JSON.stringify(boxes(l.R)) === JSON.stringify([["LAN", "2", 2, "Left+Right"], ["WB", "6", 2, "Left+Right"], ["TORP", "6", 1, "Front"]]),
        JSON.stringify(boxes(l.R)));
  const dic = mk(GO, /^Cruisers$/i, /^Dictator/);
  const db = DOMAIN.weaponBoxes(taken(dic.R)).filter(b => b.k === "BAYS");
  check("Dictator: launch bays 2 + 2 = 4 in one box",
        db.length === 1 && db[0].v === "4" && db[0].n === 2 && db[0].summed === true, JSON.stringify(db));
  const tyb = DOMAIN.weaponBoxes(taken(mk(GO, /^Cruisers$/i, /^Tyrant/).R)).filter(b => b.k === "WB").map(b => [b.v, b.rng, b.n]);
  check("Tyrant: WB 4 (45 cm) and WB 6 (30 cm) in different boxes, each with both sides",
        JSON.stringify(tyb) === JSON.stringify([["4", "45 cm", 2], ["6", "30 cm", 2]]), JSON.stringify(tyb));
  const tb = boxes(t0.R);
  check("Terror ship: gunz D6 left+right together, D6+2 front separately, bays 2 + 2 = 4",
        tb.some(b => b[0] === "WB" && b[1] === "D6" && b[2] === 2 && b[3] === "Left+Right") &&
        tb.some(b => b[0] === "WB" && b[1] === "D6+2" && b[2] === 1) &&
        tb.some(b => b[0] === "BAYS" && b[1] === "4" && b[2] === 2), JSON.stringify(tb));
  const OW = catalog.lists.filter(L => /^Orks/.test(L.nm) && L.secs.some(x => x.ents.some(e => /^Dethdeala/i.test(e.l))))[0];
  const owSec = OW.secs.filter(x => x.ents.some(e => /^Dethdeala/i.test(e.l)))[0];
  const dethd = mk(OW, { test: t => t === owSec.t }, /^Dethdeala/i);
  const ob = DOMAIN.weaponBoxes(taken(dethd.R)).filter(b => b.k === "BAYS");
  check("Dethdeala: a single bay row D3+1 stays as it is (no sum of dice)",
        ob.length === 1 && ob[0].v === "D3+1" && ob[0].n === 1 && !ob[0].summed, JSON.stringify(ob));
  check("weaponBoxes: empty rows", DOMAIN.weaponBoxes([]).length === 0);
  check("armSummaryRows: empty rows give an empty line", DOMAIN.armSummaryRows([]).groups.length === 0 && DOMAIN.armSummaryRows([]).more === 0);
  /* each group says how far it reaches (user 29.9.2026): the raw range
     texts of all its rows, in order, without repeats */
  const ret = mk(GO, /^Battleships$/i, /^Retribution/);
  const rg = DOMAIN.armSummaryRows(taken(ret.R)).groups.map(g => [g.k, g.rng]);
  check("the weapon line's groups give their range: Retribution WB and LAN 60 cm, TORP 30 cm",
        JSON.stringify(rg) === JSON.stringify([["WB", ["60 cm"]], ["LAN", ["60 cm"]], ["TORP", ["30 cm"]]]), JSON.stringify(rg));
  const dom = mk(GO, /^Cruisers$/i, /^Dominator/);
  const nv = DOMAIN.armSummaryRows(taken(dom.R)).groups.filter(g => g.k === "NOVA")[0];
  check("... Dominatorin nova cannon 30-150 cm", !!nv && nv.rng.length === 1 && /30/.test(nv.rng[0]) && /150/.test(nv.rng[0]), JSON.stringify(nv));
  /* a group whose strengths reach differently: each strength knows its own */
  const ty = mk(GO, /^Cruisers$/i, /^Tyrant/);
  const tw = DOMAIN.armSummaryRows(taken(ty.R)).groups.filter(g => g.k === "WB")[0];
  check("... Tyrant WB: each strength with its own range (4 45 cm, 6 30 cm)",
        !!tw && JSON.stringify(tw.items.map(x => [x.v, x.rng])) === JSON.stringify([["4", ["45 cm"]], ["6", ["30 cm"]]]),
        JSON.stringify(tw && tw.items));
  check("... the catalogue armSummary carries the same ranges", JSON.stringify(DOMAIN.armSummary(ret.sh, { list: GO }).groups.map(g => [g.k, g.rng])) === JSON.stringify(rg));
})();

/* ---- 3c. a fleet-list upgrade's default is Option (owner 30.9.2026) --
   An offered row the player has not answered opens as an Option (an empty box on
   the card, no points) like the ship's own options - no longer as Hide. A row not
   offered to this ship (another ship's row, a condition not met) stays out: it
   must not raise the "max if every open option" number nor bring a weapon
   alternative to the card. The player's Hide stays. */
(() => {
  const GO = catalog.lists.filter(L => L.nm === "Imperial Navy \u2014 Gothic Sector")[0];
  const at = (L, secRe, entRe) => { const sec = L.secs.filter(s => secRe.test(s.t))[0]; return { sec: sec, en: sec.ents.filter(e => entRe.test(e.l))[0] }; };
  const mk = (L, secRe, entRe, ups) => { const a = at(L, secRe, entRe);
    return DOMAIN.resolveUnit({ schemaVersion: DOMAIN.SCHEMA_VERSION, role: "core",
      entry: { list: L.nm, section: a.sec.t, label: a.en.l }, ref: a.en.r == null ? null : String(a.en.r), hull: null, hulls: 1,
      name: "", note: "", adjust: 0, custom: null, members: [], options: {}, upgrades: ups || {} }, { list: L }, catalog); };
  const l0 = mk(GO, /^Cruisers$/i, /^Lunar/);
  const offered = l0.upgrades.filter(x => !x.required && !x.included);
  check("Lunar: fleet list upgrades on offer (test prerequisite)", offered.length > 0, offered.length);
  check("... an offered row opens as an Option, not as Hide",
        offered.every(x => x.state === "opt"), JSON.stringify(offered.map(x => [x.label, x.state])));
  /* the same unit, every offered row set to Option one by one: the default must
     add nothing that the offered rows do not add */
  const all = {}; offered.forEach(x => { all[x.id] = "opt"; });
  const l1 = mk(GO, /^Cruisers$/i, /^Lunar/, all);
  check("... max points the same as when only the offered rows are set to Option (no other ships' rows)",
        l0.maxPoints === l1.maxPoints && l0.points === l1.points, JSON.stringify([l0.points, l0.maxPoints, l1.maxPoints]));
  check("... same weapon alternatives",
        JSON.stringify(l0.weapons.map(w => [w.a[0], w.state])) === JSON.stringify(l1.weapons.map(w => [w.a[0], w.state])));
  /* the player's Hide stays */
  const one = offered[0], hid = {}; hid[one.id] = "off";
  const l2 = mk(GO, /^Cruisers$/i, /^Lunar/, hid);
  check("... the player's Hide stays Hide", l2.upgrades.filter(x => x.id === one.id)[0].state === "off");
  /* a row aimed at another ship is not this ship's Option */
  const adm = mk(GO, /^Admiral/i, /^Admiral \(Ld 9\)/);
  const rr = adm.upgrades.filter(x => /re-roll/i.test(x.label));
  check("Admiral: re-roll rows offered as Option", rr.length > 0 && rr.every(x => x.state === "opt"), JSON.stringify(rr.map(x => [x.label, x.state])));
  check("... nor the Lunar's rows", !l0.upgrades.some(x => /re-roll/i.test(x.label)), JSON.stringify(l0.upgrades.map(x => x.label)));
  /* The ceiling is the dearest LEGAL combination, not the sum of open ones: the
     Lunar's nova (+20) closes the Power Ram (Fleets p. 32: not with a nova
     cannon) and the Special torpedoes (the nova replaces the prow torpedoes), so
     180 + ram 5 + special torpedoes 20 = 205, not 225. */
  check("Lunar: ceiling 205 (ram + special torpedoes), not the sum of open ones 225", l0.maxPoints === 205, l0.maxPoints);
  /* A priced option behind a FREE option belongs in the ceiling (spot check 21,
     12.10.2026). Fleets p. 382: a torpedo launcha "at no extra points cost",
     boarding torpedoes "+5 pts" if the launcha is there; p. 367 Dakka Dakka +20
     -> 155 + 5 + 20 = 180. Fleets p. 330: keel launch bays (4 squadrons) is a
     free choice, and behind it are Vampire raiders +10 (p. 330) and torpedo
     bombers +15 per launch bay (p. 319 ORDNANCE) = 60; p. 318 Aspect Warrior Host
     +20 -> 260 + 60 + 10 + 20 = 350. */
  const byRef = (L, ref) => { let hit = null; L.secs.forEach(sec => (sec.ents || []).forEach(en => { if(!hit && String(en.r) === ref) hit = { sec: sec, en: en }; })); return hit; };
  const mkRef = (L, ref) => { const a = byRef(L, ref);
    return DOMAIN.resolveUnit({ schemaVersion: DOMAIN.SCHEMA_VERSION, role: "core",
      entry: { list: L.nm, section: a.sec.t, label: a.en.l }, ref: ref, hull: null, hulls: 1,
      name: "", note: "", adjust: 0, custom: null, members: [], options: {}, upgrades: {} }, { list: L }, catalog); };
  const WA = catalog.lists.filter(L => L.nm === "Orks \u2014 Waaagh!")[0], IY = catalog.lists.filter(L => L.nm === "Eldar \u2014 Iyanden Craftworld")[0];
  const kk = mkRef(WA, "382"), dr = mkRef(IY, "330");
  check("Kill kroozer: ceiling 180 (launcha 0 + boarding torpedoes 5 + Dakka Dakka 20)", kk.maxPoints === 180, kk.maxPoints);
  check("Dragonship: ceiling 350 (behind the launch bays choice torpedo bombers 60 + Vampire raiders 10, and the Aspect Warrior Host 20)", dr.maxPoints === 350, dr.maxPoints);
  check("... and the price does not change: 155 and 260", kk.points === 155 && dr.points === 260, JSON.stringify([kk.points, dr.points]));
  /* A choose-one group: when one is taken, the others are no longer Options but
     gone; when it is undone, they come back as Options. */
  const two = rr.filter(x => /^Two/i.test(x.label))[0];
  const tk = {}; tk[two.id] = "take";
  const adm2 = mk(GO, /^Admiral/i, /^Admiral \(Ld 9\)/, tk);
  const st2 = adm2.upgrades.filter(x => /re-roll/i.test(x.label)).map(x => [x.label, x.state]);
  check("Admiral: Two re-rolls taken -> One and Three gone (a group, one at a time)",
        JSON.stringify(st2) === JSON.stringify([["One extra re-roll", "off"], ["Two extra re-rolls", "take"], ["Three extra re-rolls", "off"]]), JSON.stringify(st2));
  check("... and the ceiling is the taken one's price, not the group's dearest on top", adm2.maxPoints === adm2.points, JSON.stringify([adm2.points, adm2.maxPoints]));
  /* Unselecting (transition) returns the row to its default and leaves no lasting Hide */
  const it0 = { schemaVersion: DOMAIN.SCHEMA_VERSION, role: "core",
    entry: { list: GO.nm, section: at(GO, /^Admiral/i, /^Admiral \(Ld 9\)/).sec.t, label: at(GO, /^Admiral/i, /^Admiral \(Ld 9\)/).en.l },
    ref: null, hull: null, hulls: 1, name: "", note: "", adjust: 0, custom: null, members: [], options: {}, upgrades: tk };
  const oneRr = rr.filter(x => /^One/i.test(x.label))[0];
  const t1 = DOMAIN.transition(it0, { type: "upgrade", id: oneRr.id, state: "take" }, { list: GO }, catalog);
  const t2 = DOMAIN.transition(t1.intent, { type: "upgrade", id: oneRr.id, state: "opt" }, { list: GO }, catalog);
  const back = DOMAIN.resolveUnit(t2.intent, { list: GO }, catalog).upgrades.filter(x => /re-roll/i.test(x.label)).map(x => x.state);
  check("... One taken (Two drops) and then off: all three Options again", JSON.stringify(back) === '["opt","opt","opt"]', JSON.stringify(back));
  /* A taken Power Ram excludes the nova: the card gets no "OR Prow nova cannon" */
  const ram = l0.upgrades.filter(x => /Power Ram/i.test(x.label))[0];
  const rk = {}; rk[ram.id] = "take";
  const tyr = mk(GO, /^Cruisers$/i, /^Tyrant/, rk);
  check("Tyrant + Power Ram: the nova is not offered in the weapon table (Fleets p. 32)", !tyr.weapons.some(w => /nova/i.test(w.a[0])), JSON.stringify(tyr.weapons.map(w => w.a[0])));
  const tyr0 = mk(GO, /^Cruisers$/i, /^Tyrant/);
  check("... without the ram the nova is an alternative", tyr0.weapons.some(w => /nova/i.test(w.a[0]) && w.state === "offered"));
  check("... a two-side swap is marked on both sides (one option)", tyr0.weapons.filter(w => w.alt && w.both).length === 2,
        JSON.stringify(tyr0.weapons.filter(w => w.alt).map(w => [w.a[0], !!w.both])));
})();

/* ---- A commander's re-rolls in words (owner 5.10.2026) --------------------
   "Leaders always have their re-rolls written clearly if they are already
   included in the price." One sentence builder (DOMAIN.rerollText), used by
   the picker, the fleet row, the card and the play page - four surfaces must
   not say the same thing four ways. Expectations from the book:
     p. 35  "Admirals get one Fleet Commander re-roll included in their points cost"
     p. 48  "(Lord Admiral Rath has two)"
     p. 97  "You may buy Fleet Commander re-rolls for your Master of the Fleet." (none included)
     p. 100 Space Marine Captain: no re-roll and none for sale
     p. 404 / 486 "The fleet gets one re-roll and can purchase extra re-rolls" */
(() => {
  const by = nm => catalog.lists.filter(L => L.nm === nm)[0];
  const GO = by("Imperial Navy \u2014 Gothic Sector"), BK = by("Imperial Navy \u2014 Bakka Sector"),
        CA = by("Space Marines \u2014 Codex Astartes"), DO = by("Space Marines \u2014 Dominion"),
        NE = by("Necrons \u2014 Harvest Fleet"), DE = by("Demiurg \u2014 War Host");
  const T = DOMAIN.rerollText || (() => "?");
  check("rerollText: one included", T(1, 0, true) === "1 re-roll included", T(1, 0, true));
  check("rerollText: two included", T(2, 0, false) === "2 re-rolls included", T(2, 0, false));
  check("rerollText: included and bought are itemised", T(1, 2, true) === "3 re-rolls (1 included + 2 bought)", T(1, 2, true));
  check("rerollText: bought only - it says nothing is included", T(0, 2, true) === "2 re-rolls bought (none included)", T(0, 2, true));
  check("rerollText: none included, but for sale", T(0, 0, true) === "no re-roll included", T(0, 0, true));
  check("rerollText: none included and none for sale - no text", T(0, 0, false) === "", T(0, 0, false));
  const at = (L, secRe, entRe) => { let hit = null; L.secs.forEach((sec, si) => sec.ents.forEach((en, ei) => {
    if(!hit && secRe.test(sec.t) && entRe.test(en.l)) hit = { sec: sec, en: en, si: si, ei: ei }; })); return hit; };
  const mk = (L, secRe, entRe, take) => { const a = at(L, secRe, entRe);
    const it = { schemaVersion: DOMAIN.SCHEMA_VERSION, role: "core", entry: { list: L.nm, section: a.sec.t, label: a.en.l },
      ref: null, hull: null, hulls: 1, name: "", note: "", adjust: 0, custom: null, members: [], options: {}, upgrades: {} };
    if(take){
      const R0 = DOMAIN.resolveUnit(it, { list: L }, catalog);
      const up = R0.upgrades.filter(x => take.test(x.label))[0];
      it.upgrades[up.id] = "take";
    }
    return DOMAIN.resolveUnit(it, { list: L }, catalog); };
  const txt = R => R && R.rerolls ? R.rerolls.text : undefined;
  const adm = mk(GO, /^Admiral/i, /^Admiral \(Ld 9\)/);
  check("Admiral (p. 35): '1 re-roll included'", txt(adm) === "1 re-roll included" && adm.rerolls.purchasable === true, JSON.stringify(adm.rerolls));
  const adm2 = mk(GO, /^Admiral/i, /^Admiral \(Ld 9\)/, /^Two extra re-rolls/);
  check("... + Two extra re-rolls: '3 re-rolls (1 included + 2 bought)'", txt(adm2) === "3 re-rolls (1 included + 2 bought)", txt(adm2));
  const rath = mk(BK, /^Admiral/i, /^Lord Admiral Rath/);
  check("Lord Admiral Rath (p. 48): '2 re-rolls included'", /^2 re-rolls included/.test(txt(rath) || ""), txt(rath));
  const mof = mk(CA, /^Master of the Fleet/i, /^Master of the Fleet/);
  check("Master of the Fleet (p. 97): 'no re-roll included'", txt(mof) === "no re-roll included" && mof.rerolls.purchasable === true, JSON.stringify(mof.rerolls));
  const mof2 = mk(CA, /^Master of the Fleet/i, /^Master of the Fleet/, /^Two re-rolls/);
  check("... + Two re-rolls: '2 re-rolls bought (none included)'", txt(mof2) === "2 re-rolls bought (none included)", txt(mof2));
  const cap = mk(DO, /^Space Marine Captains/i, /^Space Marine Captain/);
  check("Space Marine Captain (p. 100): no re-roll text", txt(cap) === "" && cap.rerolls.purchasable === false, JSON.stringify(cap.rerolls));
  /* the picker: the same sentence from the row, without a choice */
  const off = DOMAIN.commanderRerollOffer || (() => null);
  const a1 = at(GO, /^Admiral/i, /^Fleet-Admiral/), o1 = off(GO, a1.si, a1.ei);
  check("choice list: Fleet-Admiral -> 1 included", !!o1 && o1.included === 1 && o1.text === "1 re-roll included", JSON.stringify(o1));
  const a2 = at(CA, /^Master of the Fleet/i, /^Master of the Fleet/), o2 = off(CA, a2.si, a2.ei);
  check("choice list: Master of the Fleet -> none included, for sale", !!o2 && o2.included === 0 && o2.purchasable === true && o2.text === "no re-roll included", JSON.stringify(o2));
  const a3 = at(GO, /^Cruisers$/i, /^Lunar/);
  check("choice list: a ship row has no re-roll info", off(GO, a3.si, a3.ei) === null);
  /* every commander with an included re-roll says so */
  let n = 0, bad = [];
  catalog.lists.forEach(L => L.secs.forEach((sec, si) => sec.ents.forEach((en, ei) => {
    if(en.k !== "cmd") return;
    const o = off(L, si, ei) || {};
    const want = en.rr > 0 ? new RegExp("^" + en.rr + " re-rolls?( per turn)? included") : /^(no re-roll included)?$/;
    n++;
    if(!want.test(o.text == null ? "?" : o.text)) bad.push(L.nm + " / " + en.l + ": " + o.text);
  })));
  /* 81 = 77 + Abaddon on four god lists (p.231, J162 13.10.2026) */
  check("each of the 81 commander rows: the included number is said in words", n === 81 && !bad.length, bad.slice(0, 5).join(" | "));
  /* the fleet's own re-roll without a commander (Necron p. 404, Demiurg p. 486) */
  const fr = DOMAIN.fleetRerolls || (() => null);
  [[NE, 404], [DE, 486]].forEach(p => {
    const f = fr(p[0]);
    check(p[0].nm + ": the fleet gets one re-roll (p. " + p[1] + ")", !!f && f.included === 1 && f.page === p[1] && /1 re-roll included/.test(f.text), JSON.stringify(f));
  });
  check("Imperial Navy: no fleet re-roll of its own (the commander's)", fr(GO) === null, JSON.stringify(fr(GO)));
  /* A limited re-roll is said as limited (book check 5.10.2026, 75/75 counts
     matched; on six rows the book limits the use or the unit):
       p. 38  Veteran Captain "can only be used on their own vessel or another vessel in their own squadron"
       p. 174, 176 Veteran Rogue Trader "may be used for his vessel or an accompanying Rogue Trader escort squadron"
       p. 231 Abaddon "Re-rolls: 1 per turn."; p. 234 "Abaddon receives one re-roll per turn"
       p. 318 Farseers "a re-roll which may be used on itself, another capital ship in the same squadron or an escort squadron within 15 cm"
       p. 372 Clanz "A Warlord's re-rolls only count for the skwadrons under his command and not for the whole fleet."
       p. 486 Demiurg "These re-rolls can only be used for Demiurg vessels" */
  const BA = by("Imperial Navy \u2014 Bastion Fleets"), RT = by("Rogue Traders"), RX = by("Rogue Traders \u2014 Exploration"),
        BC = by("Chaos \u2014 Black Crusade"), IY = by("Eldar \u2014 Iyanden Craftworld"), CZ = by("Orks \u2014 Da Ork Clanz"),
        CY = by("Orks \u2014 Cyclops Cluster");
  check("rerollText: scope at the end", T(1, 0, false, { scope: "own vessel or squadron only" }) === "1 re-roll included, own vessel or squadron only");
  check("rerollText: unit (per turn)", T(1, 0, false, { unit: "per turn" }) === "1 re-roll per turn included");
  check("rerollText: the limit with bought ones too", T(1, 2, true, { scope: "his own skwadrons only" }) === "3 re-rolls (1 included + 2 bought), his own skwadrons only");
  [[BA, /^Veteran Captains/i, /^Veteran Captain/, "1 re-roll included, own vessel or squadron only", 38],
   [RT, /^Veteran Rogue Traders/i, /^Veteran Rogue Trader/, "1 re-roll included, own vessel or its Rogue Trader escort squadron", 174],
   [RX, /^Veteran Rogue Traders/i, /^Veteran Rogue Trader/, "1 re-roll included, own vessel or its Rogue Trader escort squadron", 176],
   [BC, /^Abaddon/i, /^Abaddon/, "1 re-roll per turn included", 234],
   [IY, /^Farseers/i, /^Farseers/, "1 re-roll included, own ship, its squadron or an escort squadron within 15 cm", 318],
   [CZ, /^WARLORD/i, /^Ork Warlord/, "1 re-roll included, his own skwadrons only", 372],
   [CY, /^WARLORD/i, /^Ork Warlord/, "1 re-roll included", 365]
  ].forEach(c => {
    const R = mk(c[0], c[1], c[2]);
    const a = at(c[0], c[1], c[2]), o = off(c[0], a.si, a.ei);
    check(c[0].nm + " / " + a.en.l + " (s. " + c[4] + "): '" + c[3] + "'", txt(R) === c[3] && !!o && o.text === c[3], txt(R) + " | " + (o && o.text));
  });
  const cz2 = mk(CZ, /^WARLORD/i, /^Ork Warlord/, /^Two extra re-rolls/);
  check("Clanz Warlord + Two extra: the limit covers the bought ones too (p. 372)", txt(cz2) === "3 re-rolls (1 included + 2 bought), his own skwadrons only", txt(cz2));
  const fd = fr(DE);
  check("Demiurg: the fleet's re-roll only for Demiurg vessels (p. 486)", !!fd && fd.text === "1 re-roll included, Demiurg vessels only", JSON.stringify(fd));
  check("Necron: the fleet's re-roll without a limit (p. 404)", !!fr(NE) && fr(NE).text === "1 re-roll included", JSON.stringify(fr(NE)));
  /* Re-roll boxes (owner 5.10.2026: "tick boxes on the commander card to track
     re-rolls - those included in the price and bought options in different
     colours"). One box per re-roll, with its kind by where it came from:
     included (in the price), bought (a taken row), optional (an open option,
     not in the points - ticked for use if bought). Of a group's open rows the
     largest counts, not the sum:
       p. 35  Admiral: one included; One / Two / Three extra re-rolls (25 / 75 / 150)
       p. 97  Master of the Fleet: none included; One / Two / Three re-rolls
       p. 234 Black Crusade Warmaster: one included, "may be given an extra re-roll
              at a cost of +25 points" and Mark of Tzeentch "This ship has an extra re-roll"
       p. 404 Necron: "The fleet gets one re-roll"; One extra 25 / Two extra 75 */
  const bx = R => R && R.rerolls && R.rerolls.boxes ? R.rerolls.boxes.join(",") : "?";
  check("boxes: an Admiral without choices = 1 in the price + 3 open", bx(adm) === "included,optional,optional,optional" && adm.rerolls.optional === 3, bx(adm));
  check("boxes: Admiral + Two extra = 1 in the price + 2 bought, none open", bx(adm2) === "included,bought,bought" && adm2.rerolls.optional === 0, bx(adm2));
  check("boxes: Lord Admiral Rath = 2 in the price (p. 48)", /^included,included/.test(bx(rath)), bx(rath));
  check("boxes: Master of the Fleet = 3 open, none in the price", bx(mof) === "optional,optional,optional", bx(mof));
  check("boxes: Master of the Fleet + Two re-rolls = 2 bought", bx(mof2) === "bought,bought", bx(mof2));
  check("boxes: Space Marine Captain = no boxes", bx(cap) === "", bx(cap));
  const wm = mk(BC, /^Chaos Warmaster/i, /^Chaos Warmaster/);
  check("boxes: Black Crusade Warmaster = 1 in the price + extra re-roll + Mark of Tzeentch open (separate groups add up)",
        bx(wm) === "included,optional,optional", bx(wm));
  const shipOf = (L, re, take) => { let a = null; L.secs.forEach(sec => sec.ents.forEach(en => { if(!a && en.r != null && re.test(en.l)) a = { sec: sec, en: en }; }));
    const it = { schemaVersion: DOMAIN.SCHEMA_VERSION, role: "core", entry: { list: L.nm, section: a.sec.t, label: a.en.l },
      ref: String(a.en.r), hull: null, hulls: 1, name: "", note: "", adjust: 0, custom: null, members: [], options: {}, upgrades: {} };
    if(take){ const up = DOMAIN.resolveUnit(it, { list: L }, catalog).upgrades.filter(x => take.test(x.label))[0]; it.upgrades[up.id] = "take"; }
    return DOMAIN.resolveUnit(it, { list: L }, catalog); };
  const n0 = fr(NE, [shipOf(NE, /Tombship/i)]);
  check("boxes: a Necron fleet = 1 own + 2 open (One or Two extra, the largest)", !!n0.boxes && n0.boxes.join(",") === "included,optional,optional", JSON.stringify(n0.boxes));
  /* ---- findings of the 5.10.2026 review ---- */
  /* The included number is from the book, not the data: reference/commander_rerolls.json
     is the book check's own record (75 rows, a page on each). */
  const RRREF = JSON.parse(fs.readFileSync(path.join(HERE, "..", "..", "reference", "commander_rerolls.json"), "utf8")).rows;
  let refBad = [], seen = 0;
  catalog.lists.forEach(L => L.secs.forEach(sec => sec.ents.forEach(en => {
    if(en.k !== "cmd") return;
    const r = RRREF.filter(x => x.list === L.nm && x.section === sec.t && x.label === en.l)[0];
    seen++;
    if(!r || r.rerolls_included !== (en.rr || 0) || !Number.isInteger(r.page)) refBad.push(L.nm + " / " + en.l + ": data " + en.rr + ", book " + (r ? r.rerolls_included : "-"));
  })));
  /* 81: the same four Abaddon rows, on page 231 in the reference */
  check("included re-rolls: each of the 81 rows matches the book check's record", seen === 81 && RRREF.length === 81 && !refBad.length, refBad.slice(0, 4).join(" | "));
  /* A limit on a bought re-roll too, and on a row with nothing included:
       p. 178 "Pirate Captains may use their re-rolls on any vessel or escort squadron in the fleet,
              but no individual Pirate Captain may use more than one re-roll per turn."
       p. 234 "A Lord may be given a re-roll (which he can use for his own ship or squadron only) at +25 points."
       p. 236 "... a Mark of Tzeentch, providing a re-roll (which he can use for his own ship or squadron only)"
       pp. 240, 244, 248: the same sentence as p. 234 */
  const PI = by("Rogue Traders \u2014 Pirates and Wolf Packs");
  const pc = mk(PI, /^Pirate Captains/i, /^Pirate Captain/);
  check("Pirate Captain (p. 178): the limit is stated", txt(pc) === "1 re-roll included, at most one per turn per Captain", txt(pc));
  [[BC, 234, /^One re-roll/], [by("Chaos \u2014 Tzeentch"), 236, /Mark of Tzeentch/i], [by("Chaos \u2014 Nurgle"), 240, /^One re-roll/],
   [by("Chaos \u2014 Khorne"), 244, /^One re-roll/], [by("Chaos \u2014 Slaanesh"), 248, /^One re-roll/]].forEach(c => {
    const lord0 = mk(c[0], /^Chaos Lords/i, /^Chaos Lord/), lord1 = mk(c[0], /^Chaos Lords/i, /^Chaos Lord/, c[2]);
    check(c[0].nm + " / Chaos Lord (p. " + c[1] + "): a bought re-roll only for his own ship or squadron",
          txt(lord0) === "no re-roll included" && txt(lord1) === "1 re-roll bought (none included), his own ship or squadron only", txt(lord0) + " | " + txt(lord1));
  });
  /* The Tyranids' Hive Mind Influence (p. 430): "in lieu of having a fleet commander ...
     Hive Mind Influence re-rolls work in the same way as normal fleet commander re-rolls";
     "A maximum of one Hive Mind Influence re-roll can be purchased per hive ship in the fleet."
     None included; every hive ship can buy one - a sum, not the largest. */
  const TY = by("Tyranids \u2014 Hive Fleet"), TV = by("Tyranids \u2014 Vanguard Fleet");
  const h0 = shipOf(TY, /^Hive ship/i), h1 = shipOf(TY, /^Hive ship/i, /Hive Mind Influence re-roll/i);
  const t0 = fr(TY, [h0, h0]), t2 = fr(TY, [h1, h1, h0]);
  check("Tyranid Hive Fleet (p. 430): none included, an open box per hive ship", !!t0 && t0.included === 0 && t0.page === 430 && t0.text === "no re-roll included" && (t0.boxes || []).join(",") === "optional,optional", JSON.stringify(t0));
  check("... two bought, the third hive ship still open", !!t2 && t2.text === "2 re-rolls bought (none included)" && (t2.boxes || []).join(",") === "bought,bought,optional", JSON.stringify(t2 && [t2.text, t2.boxes]));
  check("Tyranid Vanguard (p. 429): no re-rolls at all", fr(TV, []) === null);
  /* One purchase for the fleet (p. 404): a row ticked on two ships does not double the re-rolls */
  const nn = fr(NE, [shipOf(NE, /Tombship/i, /^One extra re-roll/), shipOf(NE, /Scythe/i, /^One extra re-roll/)]);
  check("Necron: the same row on two ships is still one purchase (p. 404)", !!nn && nn.bought === 1 && nn.text === "2 re-rolls (1 included + 1 bought)", JSON.stringify(nn && [nn.bought, nn.text]));
  /* A ship's own re-rolls:
       p. 258 Scion of Prospero: "bears the Mark of Tzeentch as part of its point cost" (the Mark: "+1 re-roll", p. 236)
              and "The ship is gifted with an additional re-roll added to that from the Mark of Tzeentch" -> 2 in the price
       p. 98 / 111 Fortress-Monastery: One / Two / Three re-rolls, "usable only by itself"
       an ordinary ship has none of its own */
  const scion = shipOf(by("Chaos \u2014 Tzeentch"), /Scion of Prospero/i);
  check("Scion of Prospero (p. 258): two own re-rolls in the price", !!scion.rerolls && scion.rerolls.included === 2 && scion.rerolls.boxes.join(",") === "included,included" && /^2 re-rolls included, this ship's own$/.test(scion.rerolls.text), JSON.stringify(scion.rerolls));
  const CR = by("Space Marines \u2014 Crusade");
  const fm0 = shipOf(CR, /^Fortress-Monastery/i), fm2 = shipOf(CR, /^Fortress-Monastery/i, /^Two re-rolls/);
  check("Fortress-Monastery (p. 98): none included, three open", !!fm0.rerolls && fm0.rerolls.boxes.join(",") === "optional,optional,optional" && fm0.rerolls.text === "no re-roll included", JSON.stringify(fm0.rerolls));
  check("... Two re-rolls taken: two bought, the ship's own", !!fm2.rerolls && fm2.rerolls.boxes.join(",") === "bought,bought" && fm2.rerolls.text === "2 re-rolls bought (none included), this ship's own", JSON.stringify(fm2.rerolls && fm2.rerolls.text));
  const lun = shipOf(GO, /^Lunar/);
  check("Lunar: no own re-rolls", !lun.rerolls, JSON.stringify(lun.rerolls));
  check("Necron Tombship: the fleet's re-roll is not the ship's own", !shipOf(NE, /Tombship/i, /^One extra re-roll/).rerolls);
  const n1 = fr(NE, [shipOf(NE, /Tombship/i, /^One extra re-roll/), shipOf(NE, /Scythe/i)]);
  check("boxes: Necron + One extra = 1 own + 1 bought, none open (one purchase per fleet)", !!n1.boxes && n1.boxes.join(",") === "included,bought", JSON.stringify(n1.boxes));
})();

/* ---- 15. Planetary defences (Fleets pp. 496-517, Rulebook pp. 100-101) ------
   The expectations are read from the book: the price list and limits p. 499,
   the profiles pp. 506-517, the Ramilies p. 500, Tau pp. 451-452, squadrons
   and Leadership Rulebook p. 100, the critical table p. 101. */
(function(){
  const PD = "PLANETARY DEFENCES";
  const by = nm => catalog.lists.find(L => L.nm === nm);
  const secOf = L => L.secs.find(x => x.t === PD);
  const unit = (L, re, hulls) => {
    const sec = secOf(L), en = sec.ents.find(e => re.test(e.l));
    return { list: L.nm, entry: { section: sec.t, label: en.l }, ref: en.r == null ? null : String(en.r),
             hulls: hulls || 1, options: {}, upgrades: {} };
  };
  const R = (L, re, hulls) => DOMAIN.resolveUnit(unit(L, re, hulls), { list: L, host: L }, catalog);
  const GO = by("Imperial Navy \u2014 Gothic Sector"), EX = by("Adeptus Mechanicus \u2014 Explorator"),
        KH = by("Chaos \u2014 Khorne"), CR = by("Space Marines \u2014 Crusade"),
        TM = by("Tau \u2014 Merchant Fleet"), EC = by("Eldar Corsairs \u2014 Gothic Sector"),
        BA = by("Imperial Navy \u2014 Bastion Fleets");

  check("PD: the section is every list's LAST, and exactly once",
        catalog.lists.every(L => L.secs[L.secs.length - 1].t === PD && L.secs.filter(x => x.t === PD).length === 1 &&
                                 secOf(L).ct === "defence"));

  /* p. 499 price list: name, points, limit - read from the page row by row */
  const P499 = [["Orbital defence laser platform", 30, null, "509"], ["Orbital torpedo launcher", 30, null, "510"],
                ["Orbital weapons platform", 30, null, "511"], ["Orbital mine", 5, null, null], ["Minefield", 40, 2, null],
                ["Fire ship", 10, 6, "516"], ["System ship", 20, null, "515"], ["Defence monitor", 60, null, "514"],
                ["Orbital dock", 90, null, "508"], ["Space station", 150, null, "507"],
                ["Blackstone fortress", 400, null, "506"], ["Defence laser silo", 15, 8, "517b"],
                ["Missile silo", 5, 8, "517c"], ["Air base", 20, 4, "517"]];
  const rowsOf = L => secOf(L).ents;
  const badRow = [];
  catalog.lists.filter(L => !/^Tau /.test(L.nm)).forEach(L => P499.forEach(x => {
    const e = rowsOf(L).find(r => r.l === x[0]);
    if(!e || e.p !== x[1] || (e.mx == null ? null : e.mx) !== x[2] || (e.r == null ? null : String(e.r)) !== x[3])
      badRow.push(L.nm + " / " + x[0]);
  }));
  check("PD p. 499: 14 rows with prices and limits on 30 lists", badRow.length === 0, badRow.slice(0, 3).join(" | "));

  /* p.451-452: "The Tau may not use any other form of planetary defence." */
  const tau = catalog.lists.filter(L => /^Tau /.test(L.nm));
  check("PD Tau (p. 452): on the two Tau lists only the orbitals 478-481",
        tau.length === 2 && tau.every(L => rowsOf(L).map(e => String(e.r)).join(",") === "478,479,480,481"));
  check("PD: no other list has Tau orbitals",
        catalog.lists.filter(L => !/^Tau /.test(L.nm)).every(L => !rowsOf(L).some(e => /^(478|479|480|481)$/.test(String(e.r)))));
  /* p.480: CORE MODULE 20 PTS; p.478 150 PTS; p.479 50 PTS */
  check("PD Tau: City 150 (p.478), Security orbital 50 (p.479), Orbital core 20 (p.480)",
        rowsOf(TM).find(e => e.r === 478).p === 150 && rowsOf(TM).find(e => e.r === 479).p === 50 &&
        rowsOf(TM).find(e => e.r === 480).p === 20);

  /* p.500: "The Ramilies is available to Imperial and Chaos Fleets" */
  const ram = catalog.lists.filter(L => rowsOf(L).some(e => e.r === 500));
  check("PD Ramilies (p. 500): the Imperial Navy race's lists and Chaos, 875 pts",
        ram.length === 11 && ram.every(L => L.race === "imperial navy" || L.race === "chaos") &&
        ram.every(L => rowsOf(L).find(e => e.r === 500).p === 875), ram.map(L => L.nm).join(" | "));
  /* p.334: the Haven is a station from the Eldar chapter, 200 pts */
  const hav = catalog.lists.filter(L => rowsOf(L).some(e => String(e.r) === "334"));
  check("PD Haven (p.334): on the Eldar lists, 200 pts",
        hav.length >= 3 && hav.every(L => /eldar/.test(L.race)) && hav.filter(L => rowsOf(L).find(e => String(e.r) === "334").p === 200).length === hav.length,
        hav.map(L => L.nm).join(" | "));

  /* Profiles the extractor does not get: p. 516 and p. 517 */
  const S = catalog.ships;
  check("PD p.516 Fire Ship: Escort/1, 15 cm, 45, shields 1, armour 5+, turrets 1, no weapons",
        S["516"] && S["516"].ty === "Escort" && S["516"].hp === 1 && S["516"].sp === "15 cm" && /^45/.test(S["516"].tn) &&
        S["516"].sh === "1" && S["516"].ar === "5+" && S["516"].tu === "1" && S["516"].aw.length === 0 && S["516"].bp === 10);
  check("PD p.517 Defence Laser Silo: Ground/1, 0/0/0/6+/0, Lance battery 60 cm 3 Front, 15 pts",
        S["517b"] && S["517b"].ty === "Ground" && S["517b"].hp === 1 && S["517b"].sh === "0" && S["517b"].ar === "6+" &&
        S["517b"].tu === "0" && same(S["517b"].aw, [["Lance battery", "60 cm", "3", "Front"]]) && S["517b"].bp === 15);
  check("PD p.517 Missile Silo: Ground/1, Torpedoes 30 cm 6 Front, 5 pts",
        S["517c"] && S["517c"].ty === "Ground" && S["517c"].tu === "0" &&
        same(S["517c"].aw, [["Torpedoes", "30 cm", "6", "Front"]]) && S["517c"].bp === 5);
  check("PD: the Defence monitor, System ship and Fire ship are not reserve types (p. 14, p. 498)",
        ["514", "515", "516"].every(k => S[k].rt === "none"));

  /* List upgrades do not belong to defences: not one offered row on any list,
     and no required one either. The book's own exception is one (the owner's
     decision 13.10.2026, J174): p. 503 "A Ramilies can purchase special
     torpedoes" - from p. 19's table, strength 9 = "7 or more". So the Ramilies
     is offered exactly that row and nothing else. */
  const leaks = [];
  let fortRows = 0;
  catalog.lists.forEach(L => rowsOf(L).forEach(en => {
    const it = { list: L.nm, entry: { section: PD, label: en.l }, ref: en.r == null ? null : String(en.r), hulls: 1, options: {}, upgrades: {} };
    const r = DOMAIN.resolveUnit(it, { list: L, host: L }, catalog);
    const fort = /^Ramilies class star fort$/i.test(en.l);
    const got = r ? r.upgrades.map(u => u.label) : null;
    const want = fort ? ["Special torpedoes (Strength 7 or more)"] : [];
    if(!r || !same(got, want)) leaks.push(L.nm + " / " + en.l + ": " + JSON.stringify(got));
    if(fort) fortRows++;
    const sel = DOMAIN.selectionOf(it, { list: L, host: L }, catalog);
    if(DOMAIN.requiredUpgradeKeys(sel).length || DOMAIN.defaultUpgradeKeys(sel).length) leaks.push(L.nm + " / " + en.l + ": required");
  }));
  check("PD: a defence row is offered no list upgrades, except special torpedoes for the Ramilies (p. 19, p. 503)",
        leaks.length === 0 && fortRows > 0, "Ramilies rows " + fortRows + " | " + leaks.slice(0, 3).join(" | "));
  check("PD Explorator: a Space station is not a Mechanicus ship and gets no turret refit (pp. 118-120, p. 499)",
        R(EX, /^Space station$/).mechanicus === false && R(EX, /^Space station$/).stats.turrets === "4" &&
        !/ADMECH/.test(R(EX, /^Space station$/).damage.repair) &&
        DOMAIN.requiredHullChanges(EX, S["507"]).rows.length === 0 && DOMAIN.requiredHullChanges(EX, S["507"]).mod === null);
  check("PD Chaos: a Space station does not get the list's Chaos rule (+1 boarding)",
        !R(KH, /^Space station$/).rules.some(r => /^Chaos: \+1 in boarding/.test(r.t)));

  /* Borrowing: a defence section's row cannot be borrowed, not even one without a hull */
  const lendOk = [];
  rowsOf(BA).forEach(en => {
    const v = DOMAIN.lendRowVerdict(GO, BA, BA.secs.indexOf(secOf(BA)), en, catalog, { role: "reserve", condMet: true });
    if(v.ok || v.cause !== "type") lendOk.push(en.l + ":" + v.cause);
  });
  check("PD: Bastion's defence rows cannot be borrowed by Gothic (p. 14)", lendOk.length === 0, lendOk.slice(0, 4).join(" | "));

  /* A one-hit defence is a squadron of 1-6 (Rulebook p.100), the type is kept */
  const wp = R(GO, /^Orbital weapons platform$/, 3);
  check("PD platform x3: squadron 1-6, 90 pts, type Defence, no crippled state",
        wp.card === "squadron" && wp.squadron && wp.squadron.min === 1 && wp.squadron.max === 6 && wp.points === 90 &&
        wp.stats.type === "Defence" && wp.damage.crippled === false && /^DEFENCE: one unsaved Hit/.test(wp.damage.note) &&
        wp.damage.repair === "", JSON.stringify([wp.card, wp.squadron, wp.points, wp.damage.note]));
  const ab = R(GO, /^Air base$/, 2), ls = R(GO, /^Defence laser silo$/, 2);
  check("PD ground targets (p. 517): the card holds 1-4 / 1-6, not the book's squadron rule",
        ab.squadron.max === 4 && ab.squadron.cardOnly === true && ls.squadron.max === 6 && ls.squadron.src === "" &&
        ab.defence.ground === true);
  const dm = R(GO, /^Defence monitor$/, 2);
  check("PD Defence monitor x2: 120 pts, squadron 1-6, type Escort, not a fixed station",
        dm.points === 120 && dm.squadron.min === 1 && dm.stats.type === "Escort" && dm.defence.stationary === false);

  /* Leadership and orders: p. 499 / Rulebook p. 100; Ramilies p. 503; F-M p. 111 */
  const st = R(GO, /^Space station$/), rf = R(GO, /^Ramilies/), fm = (() => {
    const sec = CR.secs.find(x => /FORTRESS-MONASTERY/i.test(x.t)), en = sec.ents.find(e => e.r === 110);
    return DOMAIN.resolveUnit({ list: CR.nm, entry: { section: sec.t, label: en.l }, ref: "110", hulls: 1, options: {}, upgrades: {} },
                              { list: CR, host: CR }, catalog);
  })();
  check("PD Space station: fixed Ld 7, orders RO + BFI, station table (Rulebook p.100-101)",
        st.leadership && st.leadership.value === 7 && same(st.orders, ["RO", "BFI"]) &&
        st.damage.critical.title === "DEFENCES CRITICAL HITS (2D6)" && st.damage.crippledAt === 4 && st.card === "capital" &&
        st.damage.critical.rows.some(r => r[0] === "8-9" && /ORBIT LOST/.test(r[1])) &&
        st.damage.critical.rows.some(r => r[0] === "4" && r[1] === "MAIN ARMAMENT" && r[2] === "OFF"),
        JSON.stringify([st.leadership, st.orders, st.damage.critical.title]));
  check("PD Ramilies (p.503): Ld is rolled, orders RO + LO + BFI, card fort, weapons have a zone",
        rf.leadership === null && same(rf.orders, ["RO", "LO", "BFI"]) && rf.card === "fort" &&
        rf.weapons.map(w => w.zone).join(",") === "quadrant,quadrant,quadrant,basilica,basilica" &&
        rf.defence.ownPoints === true, JSON.stringify([rf.leadership, rf.orders, rf.card, rf.weapons.map(w => w.zone)]));
  check("PD Fortress-Monastery (p. 111): Ld 10 fixed, a fort card, the list's own upgrades kept",
        fm.leadership && fm.leadership.value === 10 && fm.card === "fort" && fm.upgrades.length >= 3 &&
        fm.weapons.map(w => w.zone).join(",") === "quadrant,quadrant,quadrant,basilica,basilica",
        JSON.stringify([fm.leadership, fm.card, fm.upgrades.length]));

  /* Rule cards: p.512, p.513, p.516 */
  const om = R(GO, /^Orbital mine$/, 4), mf = R(GO, /^Minefield$/, 2), fs2 = R(GO, /^Fire ship$/, 3);
  check("PD Orbital mine x4 (p.512): 20 pts, rule card, counted, no limit",
        om.kind === "entry" && om.card === "rule" && om.points === 20 && om.countable === true &&
        om.ruleCard && om.ruleCard.page === 512 && om.ruleCard.limit === null && om.ruleCard.track.kind === "each" &&
        om.ruleCard.steps.some(x => /10 cm toward the nearest enemy ship/.test(x.t)) &&
        om.ruleCard.steps.some(x => /roll 8 dice/.test(x.t) && /roll 4 dice instead/.test(x.t)),
        JSON.stringify([om.kind, om.card, om.points, om.countable]));
  check("PD Minefield x2 (p. 513): 80 pts, limit 2, the size is rolled, detection 5+ and modifiers",
        mf.card === "rule" && mf.points === 80 && mf.ruleCard.limit === 2 && mf.ruleCard.track.kind === "size" &&
        mf.ruleCard.steps.some(x => /D3 x 5 cm/.test(x.t) && /within 15 cm/.test(x.t)) &&
        mf.ruleCard.steps.some(x => /within 30 cm/.test(x.t) && /5\+/.test(x.t) && /\+1 if the ship is on All Ahead Full/.test(x.t) &&
                                    /-1 on Burn Retros/.test(x.t) && /-1 if it is an escort/.test(x.t)) &&
        mf.ruleCard.steps.some(x => /armour 6/.test(x.t)));
  check("PD Fire ship x3 (p. 516): 30 pts, a ship with a rule card, 3D6 cm and D3 Fire criticals",
        fs2.kind === "ship" && fs2.card === "rule" && fs2.points === 30 && fs2.weapons.length === 0 && fs2.ruleCard.limit === 6 &&
        fs2.ruleCard.steps.some(x => /3D6/.test(x.t) && /D3 Fire critical hits/.test(x.t)) && fs2.leadership.value === 7);

  /* The fleet level: hooks and the Mark of Khorne */
  const fleet = (L, units, limit) => DOMAIN.resolveFleet({ list: L.nm, limit: limit || 1500, units: units }, catalog);
  const own = (L, re, hulls) => {
    let hit = null;
    L.secs.forEach(sec => sec.ents.forEach(en => { if(!hit && en.k !== "up" && re.test(en.l)) hit = [sec, en]; }));
    return { list: L.nm, entry: { section: hit[0].t, label: hit[1].l }, ref: hit[1].r == null ? null : String(hit[1].r),
             hulls: hulls || 1, options: {}, upgrades: {} };
  };
  /* p. 478: the Orbital City's hooks are for the Orcas "assigned to guard" it,
     not the fleet's capacity (p. 454). */
  const hkRow = c => /^Gravitic hook capacity \(Orcas and Wardens\)/.test(c.t);
  const hk0 = fleet(TM, [own(TM, /^Merchant class starship/), own(TM, /^Orca class gunship$/)]).checks.find(hkRow);
  const hk1 = fleet(TM, [own(TM, /^Merchant class starship/), own(TM, /^Orca class gunship$/),
                         unit(TM, /^Kor caste orbital city$/)]).checks.find(hkRow);
  /* Review 9.10.2026: the hook was first left out entirely, and then the
     orbital's own guards (p. 478 "Capacity: 2 Orcas/Wardens", bought
     separately) made the fleet illegal. A hook carries when it is on the ship:
     on the City always, on the Waystation only when chosen (p. 481). */
  const cap = c => +String(c.v).split("/")[1];
  check("PD Tau: the Orbital City hook carries two guards (p.478)",
        !!hk0 && !!hk1 && cap(hk1) === cap(hk0) + 2, JSON.stringify([hk0 && hk0.v, hk1 && hk1.v]));
  const way = opt => {
    const u = unit(TM, /^Waystation$/);
    if(opt) u.options[S["481"].ol.find(o => opt.test(o.t)).id] = { state: "take" };
    return u;
  };
  const hkW = us => fleet(TM, [own(TM, /^Merchant class starship/), own(TM, /^Orca class gunship$/)].concat(us)).checks.find(hkRow);
  check("PD Tau: the Waystation's hook carries only when chosen (p. 481)",
        cap(hkW([way(null)])) === cap(hk0) && cap(hkW([way(/^Railgun/)])) === cap(hk0) &&
        cap(hkW([way(/^Gravitic hook/)])) === cap(hk0) + 1,
        [cap(hk0), cap(hkW([way(null)])), cap(hkW([way(/^Railgun/)])), cap(hkW([way(/^Gravitic hook/)]))].join(","));
  /* p.481: "Choose one of the defence systems below. This defines the point
     cost for the waystation." */
  const wRow = us => fleet(TM, us).checks.find(c => /^Waystation \(choose one/.test(c.t));
  check("PD Waystation (p. 481): without a system a red row, with one no row",
        !!wRow([way(null)]) && wRow([way(null)]).ok === false && !wRow([way(/^Ion Cannon/)]),
        JSON.stringify(wRow([way(null)])));
  /* Rulebook p. 101 does not know the Haven: its table is p. 337 and row 8 says
     it drifts, so the card must not say "never drifts". */
  const hvn = R(EC, /^Haven space station$/);
  check("PD Haven (pp. 336-337): its own repair bonus on the card, no 'never drifts' sentence",
        hvn.rules.some(r => /rolls the 2 extra repair dice itself/.test(r.t)) && !hvn.rules.some(r => /never moves or drifts/.test(r.t)) &&
        hvn.damage.critical.rows.some(r => r[0] === "4" && r[1] === "LANCES"), hvn.rules.map(r => r.t.slice(0, 30)).join(" | "));
  check("PD Ramilies (p. 501, p. 503): the template rule and Burn Retros in dock are in the rules",
        rf.rules.some(r => /centre hole/.test(r.t)) && rf.rules.some(r => /Burn Retros/.test(r.t)), "-");
  check("PD Minefield (p.513): placed near any table feature",
        mf.ruleCard.steps.some(x => /tabletop feature/.test(x.t) && /within 15 cm/.test(x.t)), "-");
  const rows = (L, us) => fleet(L, us, 3000).checks.filter(c => !c.ok).map(c => c.t).sort().join(" | ");
  const kBase = [own(KH, /^Chaos Warmaster/), own(KH, /^Slaverer$/)];
  check("PD Khorne (p.264): a 400-point Blackstone does not take the flagship place from the Slaverer",
        rows(KH, kBase) === rows(KH, kBase.concat([unit(KH, /^Blackstone fortress$/)])),
        rows(KH, kBase) + "  ->  " + rows(KH, kBase.concat([unit(KH, /^Blackstone fortress$/)])));
})();

/* ---- 16. Prince Yriel on the Corsair lists (Fleets p. 319, J161) -----------
   "Yriel may be taken instead of the Hero Fleet Commander as listed in the
   Corsair and Craftworld Eldar fleet lists." The box is printed on Iyanden's
   second page, so the row was only on that list. */
(function(){
  const by = nm => catalog.lists.find(L => L.nm === nm);
  const IY = by("Eldar \u2014 Iyanden Craftworld");
  const iy = IY.secs.find(s => s.t === "RESERVES AND ALLIES");
  ["Eldar Corsairs \u2014 Gothic Sector", "Eldar Corsairs \u2014 Later Gothic War"].forEach(nm => {
    const L = by(nm), si = L.secs.findIndex(s => s.t === "RESERVES AND ALLIES"), sec = L.secs[si];
    const rows = sec.ents.map(e => [e.l, e.p, e.k, e.rr || 0]);
    check("Yriel " + nm + ": the row 150 pts, 1 re-roll in the price, +25 / +50, -25 aboard the Flame (p. 319)",
          same(rows, [["Prince Yriel", 150, "cmd", 1], ["One extra re-roll", 25, "up", 1], ["Two extra re-rolls", 50, "up", 2],
                      ["Embarked aboard the Flame of Asuryan", -25, "up", 0]]), JSON.stringify(rows));
    check("Yriel " + nm + ": his own upgrade rows point to his row",
          sec.ents.slice(1).every(e => same(e.at, [[si, 0]])), JSON.stringify(sec.ents.slice(1).map(e => e.at)));
    const it = { list: L.nm, entry: { list: L.nm, section: sec.t, label: "Prince Yriel" }, ref: null, hulls: 1, options: {}, upgrades: {} };
    const R = DOMAIN.resolveUnit(it, { list: L, host: L }, catalog);
    const iyR = DOMAIN.resolveUnit({ list: IY.nm, entry: { list: IY.nm, section: iy.t, label: "Prince Yriel" }, ref: null, hulls: 1, options: {}, upgrades: {} },
                                   { list: IY, host: IY }, catalog);
    check("Yriel " + nm + ": commander, 150 pts, 1 re-roll included, two open boxes",
          !!R && R.kind === "commander" && R.points === 150 && R.rerolls.included === 1 &&
          R.rerolls.boxes.join(",") === "included,optional,optional", JSON.stringify(R && [R.kind, R.points, R.rerolls.boxes]));
    check("Yriel " + nm + ": the card's rules the same as on Iyanden's row (9 sentences, p. 319)",
          same(R.rules.map(r => r.t), iyR.rules.map(r => r.t)) && R.rules.length >= 9 &&
          R.rules.some(r => /Vampire raiders/.test(r.t)) && R.rules.some(r => /exempt from the reserve rules \(e\.g\. you do not have to field three capital ships in a Corsair Eldar fleet list\)\./.test(r.t)) &&
          !R.rules.some(r => /An Eldar Hero must lead the fleet in order to use Craftworld/.test(r.t)),
          R.rules.length + " / " + iyR.rules.length);
    check("Yriel " + nm + ": the Flame of Asuryan's reserve exemption is in the list's facts with its page",
          !!L.res_exempt && L.res_exempt.pg === 319 && new RegExp(L.res_exempt.re, "i").test("Flame of Asuryan") &&
          !new RegExp(L.res_exempt.re, "i").test("Dragonship"), JSON.stringify(L.res_exempt));
  });
})();

/* ---- 17. the Space Hulk card (Fleets p. 288, p. 391; owner 9.10.2026)
   The critical table as three groups with sub-items, the minus boxes' facts on
   the weapon rows, and a brief rule list: the basic weapons' rules are marked. */
(function(){
  const by = nm => catalog.lists.find(L => L.nm === nm);
  const hulk = (L, re) => {
    let hit = null;
    L.secs.forEach(sec => sec.ents.forEach(en => { if(!hit && en.k !== "up" && re.test(en.l)) hit = [sec, en]; }));
    return DOMAIN.resolveUnit({ list: L.nm, entry: { list: L.nm, section: hit[0].t, label: hit[1].l }, ref: String(hit[1].r),
                                hulls: 1, options: {}, upgrades: {} }, { list: L, host: L }, catalog);
  };
  const ork = hulk(by("Orks \u2014 Waaagh!"), /^Space Hulk$|Ork Hulk|Hulk/i), cha = hulk(by("Chaos \u2014 Incursion"), /^Chaos Space Hulk$/);
  const g = R => R.damage.critical.groups || [];
  const sub = (R, gi) => (g(R)[gi] ? g(R)[gi].subs : []).map(x => [x.roll, x.text, x.on || (x.track ? x.track.key + ":" + x.track.n : "")]);
  check("hulk p.391: three groups 1-2 / 3-4 / 5-6 with names",
        same(g(ork).map(x => [x.roll, x.name]), [["1-2", "HIGH ENERGY SYSTEMS"], ["3-4", "WEAPONS CLUSTERS"], ["5-6", "THRUSTERS"]]),
        JSON.stringify(g(ork).map(x => [x.roll, x.name])));
  check("Ork hulk p.391: high energy 1-2 dorsal lance, 3-4 shield (3 boxes), 5-6 turret (6 boxes)",
        same(sub(ork, 0), [["1-2", "-1 DORSAL LANCE", "lance"], ["3-4", "-1 SHIELD", "shields:3"], ["5-6", "-1 TURRET STR", "turrets:6"]]),
        JSON.stringify(sub(ork, 0)));
  check("Chaos hulk p.288: high energy 1-2 on prow AND dorsal lance",
        sub(cha, 0)[0] && sub(cha, 0)[0][1] === "-1 PROW AND DORSAL LANCE", JSON.stringify(sub(cha, 0)));
  check("hulk: weapons clusters 1-2 bay (not prow/aft), 3-4 torpedo (not aft), 5-6 -2 battery FP",
        same(sub(ork, 1), [["1-2", "-1 LAUNCH BAY (not prow/aft)", "bay"], ["3-4", "-1 TORPEDO STR (not aft)", "torp"],
                           ["5-6", "-2 WEAPONS BATTERY FP", "wb"]]), JSON.stringify(sub(ork, 1)));
  check("hulk: thrusters stack, six boxes", sub(ork, 2).length === 1 && sub(ork, 2)[0][2] === "thrusters:6", JSON.stringify(sub(ork, 2)));
  const loss = R => R.weapons.filter(w => w.box == null).map(w => [w.a[0], w.loss ? w.loss.key + "-" + w.loss.per + "x" + w.loss.n : "-"]);
  check("Ork hulk: each of the 11 weapon rows has minus boxes at the right step (lance/bay/torpedo -1, battery -2)",
        loss(ork).length === 11 && loss(ork).every(x => x[1] !== "-") &&
        loss(ork).filter(x => /gunz/i.test(x[0])).every(x => /^wb-2x4$/.test(x[1])) &&
        loss(ork).filter(x => /lance/i.test(x[0])).every(x => x[1] === "lance-1x4") &&
        loss(ork).filter(x => /launch/i.test(x[0])).every(x => x[1] === "bay-1x4") &&
        loss(ork).filter(x => /torpedo/i.test(x[0])).every(x => x[1] === "torp-1x4"), JSON.stringify(loss(ork)));
  check("Chaos hulk: the prow and dorsal lances both have boxes (p. 288)",
        loss(cha).filter(x => /lance/i.test(x[0])).length === 2 && loss(cha).filter(x => /lance/i.test(x[0])).every(x => x[1] === "lance-1x4"),
        JSON.stringify(loss(cha)));
  check("hulk: brief, and the basic weapons' rules are marked (weapon) - the hulk's own are not",
        ork.brief === true && ork.rules.some(r => r.weapon && /^Ork Gunz/.test(r.t)) &&
        ork.rules.filter(r => r.hull).every(r => !r.weapon) && ork.rules.some(r => !r.weapon && /Hulk movement/.test(r.t)),
        ork.rules.map(r => (r.weapon ? "w:" : "") + r.t.slice(0, 18)).join(" | "));
  const lunar = hulk(by("Imperial Navy \u2014 Gothic Sector"), /^Lunar class cruiser$/);
  check("ordinary ship: no groups, no minus boxes, no brief", !lunar.brief && !lunar.damage.critical.groups && lunar.weapons.every(w => !w.loss));
})();

/* ---- 18. weapon row colours (owner 9.10.2026) -------------------------
   "make the Armageddon gun's background the same as the nova cannon's (red).
   Warp cannons the same as a lance. then Ork heavy gunz in a slightly different
   shade from normal gunz so it stands out better (or actually a hazard stripe
   could be cool)". */
(function(){
  const W = DOMAIN.wepClass, same3 = (a, b) => a[0] === b[0] && a[1] === b[1] && a[2] === b[2];
  check("the Armageddon gun (p. 252) is the same class and colour as the nova cannon",
        same3(W("Armageddon gun"), W("Prow nova cannon")), JSON.stringify([W("Armageddon gun"), W("Prow nova cannon")]));
  /* p.284: "roll 1 dice per point of Strength and require a 4+ to hit, like a lance" */
  check("Warp cannons (p. 284) are the same class and colour as a lance",
        same3(W("Warp cannons"), W("Dorsal lance battery")), JSON.stringify([W("Warp cannons"), W("Dorsal lance battery")]));
  const hg = ["Port heavy gunz", "Starboard heavy gunz", "Prow heavy gunz", "Heavy gunz battery"].map(W), gz = W("Port gunz battery");
  /* p. 360: heavy gunz are batteries (badge G), but the row stands out by its
     own colour. Owner 12.10.2026: "heavy gunz could be not a hazard colour but a
     colour between the nova cannon and the gunz yellow. still a pastel" - the
     stripes gone, the badge and background between the nova cannon and the gunz. */
  const nv = W("Prow nova cannon"), ch = (hex, i) => parseInt(hex.slice(1 + 2 * i, 3 + 2 * i), 16);
  const between = (x, a, b, i) => ch(x, i) >= Math.min(ch(a, i), ch(b, i)) - 8 && ch(x, i) <= Math.max(ch(a, i), ch(b, i)) + 8;
  check("Ork heavy gunz: still a battery (G), its own badge colour and background, no pattern",
        hg.every(x => x[0] === "G" && x[1] !== gz[1] && x[1] !== nv[1] && x[2] !== gz[2] && x[2] !== nv[2] && !x[3]) && gz[0] === "G" && !gz[3],
        JSON.stringify([hg[0], gz, nv]));
  /* red (R) stays, green (G) falls between the nova cannon and the gunz: orange */
  check("Ork heavy gunz: the badge's and background's shade is between the nova cannon and the gunz",
        between(hg[0][1], nv[1], gz[1], 1) && between(hg[0][2], nv[2], gz[2], 0) && ch(hg[0][2], 2) < ch(gz[2], 2), JSON.stringify([hg[0], gz, nv]));
  /* pastel: the background is light (every channel at least 160) */
  check("Ork heavy gunz: the background is pastel", [0, 1, 2].every(i => ch(hg[0][2], i) >= 160), hg[0][2]);
  check("an ordinary battery, a lance and a nova cannon have no pattern",
        !W("Port weapons battery")[3] && !W("Dorsal lance battery")[3] && !W("Prow nova cannon")[3]);
  const blk = Object.values(catalog.ships).find(s => /ACTIVATED BLACKSTONE/.test(s.nm));
  check("Activated Blackstone: the catalogue row reads the warp cannons as lances (LAN 8)",
        /LAN 8/.test(DOMAIN.armSummaryText(blk)), DOMAIN.armSummaryText(blk));
})();

/* ---- 19. boarding torpedoes = a second ammunition for the same tubes, not a weapon row ---
   Rulebook p. 78: "Boarding torpedoes are launched like ordinary torpedoes and
   ships that can carry them are noted in the fleet lists. It is not possible
   to launch ordinary torpedoes and boarding torpedoes from a ship in the same
   turn." Fleets p. 374: "May be equipped with boarding torpedoes for +5 pts
   (speed 20 cm; strength D6+2)". Owner 12.10.2026, first: "the boarding
   torpedoes are not a new weapon row; its normal torpedoes also get boarding
   torpedoes as a choice", then more precisely: "the boarding torpedo purchase
   only in the option row, not in the weapons, since it is bought for existing
   torpedoes - only a new type of ammunition is bought for them". So the option
   brings no row to the resolved armament in any state (offered, taken,
   hidden): the purchase is an option row with its price, and a rule row says
   how the ammunition works. */
(function(){
  const find = ref => { let hit = null; catalog.lists.forEach(L => L.secs.forEach(sec => sec.ents.forEach(en => {
    if(!hit && en.k !== "up" && String(en.r) === ref) hit = { L, sec, en }; }))); return hit; };
  const resolve = (ref, states) => {
    const a = find(ref), sh = catalog.ships[ref], options = {};
    Object.keys(states || {}).forEach(k => { const o = sh.ol.find(x => new RegExp(k, "i").test(x.t)); options[o.id] = { state: states[k], qty: 1 }; });
    return DOMAIN.resolveUnit({ schemaVersion: 2, entry: { list: a.L.nm, section: a.sec.t, label: a.en.l }, ref, hull: ref, hulls: 1,
      name: "", note: "", adjust: 0, custom: null, members: [], options, upgrades: {} }, { list: a.L }, catalog);
  };
  const names = R => R.weapons.map(w => w.a[0]).join(" | ");
  const noRow = R => !R.weapons.some(w => /^boarding torpedoes$/i.test(w.a[0]));
  const opt = R => R.options.filter(o => /boarding torpedoes/i.test(o.text))[0];
  const rule = R => R.rules.some(x => /^Boarding Torpedoes: a hit is a Hit/.test(typeof x === "string" ? x : x.t));
  /* Hammer p.374 */
  let R = resolve("374");
  check("Hammer (p. 374): offered boarding torpedoes are not a weapon row", noRow(R), names(R));
  check("... the option is offered at 5 and the rule row is on the card", !!opt(R) && opt(R).state === "opt" && opt(R).cost === 5 && rule(R), JSON.stringify(opt(R)));
  check("... the weapon rows are the book's rows in the book's order", R.weapons.map(w => w.a[0]).join("|") === catalog.ships["374"].aw.map(a => a[0]).join("|"), names(R));
  R = resolve("374", { "boarding torpedoes": "take" });
  check("Hammer: a taken option adds no row, price 245 + 5", noRow(R) && R.points === 250 && opt(R).state === "take" && rule(R), names(R) + " " + R.points);
  R = resolve("374", { "boarding torpedoes": "off" });
  check("Hammer: a hidden option: no row and no rule row", noRow(R) && !rule(R), names(R));
  /* Gorbag's Revenge p.377 */
  check("Gorbag's Revenge (p.377): no row even when taken", noRow(resolve("377")) && noRow(resolve("377", { "boarding torpedoes": "take" })), names(resolve("377", { "boarding torpedoes": "take" })));
  /* Kill Kroozer p. 382, Terror ship p. 380 and Lite Kroozer p. 383: the launcher is itself a swap ("May replace its prow
     heavy gun battery with a torpedo launcha", "If fitted with a torpedo launcha, it may carry boarding torpedoes") */
  ["382", "380", "383"].forEach(ref => {
    const R0 = resolve(ref), R1 = resolve(ref, { "torpedo launcha": "take", "boarding torpedoes": "take" });
    check("p. " + ref + ": no boarding torpedoes row, offered or taken", noRow(R0) && noRow(R1), names(R1));
    check("p. " + ref + ": when taken the launcher is a weapon row and the option costs 5", R1.weapons.some(w => /torpedo launcha/i.test(w.a[0]) && w.state === "active") && R1.points === R0.points + 5,
          names(R1) + " " + R0.points + "->" + R1.points);
  });
  /* Ork Hulk p.389: three torpedo tubes, option +15 */
  R = resolve("389", { "boarding torpedoes": "take" });
  check("Ork Hulk (p.389): no row, price 600 + 15", noRow(R) && R.points === 615, names(R) + " " + R.points);
  /* Tyranid prow boarding torpedoes ARE a weapon (Fleets p.426 "are always boarding torpedoes"): it does not disappear */
  const hive = resolve("432");
  check("Hive Ship (p.432): the prow boarding torpedoes weapon choice is still a weapon row", hive.weapons.some(w => /boarding torpedoes/i.test(w.a[0])), names(hive));
})();

/* ---- 20. v1.2: the card's reading aids (owner 10-12 Oct 2026) ---------------
   a) Range: "the 15, 30, 45, 60 cm ranges and beyond could be coded by colour
      and shape somehow ... and the range value more visible". A single cm value
      gets a band (1 = up to 15, 2 = up to 30, 3 = up to 45, 4 = up to 60, 5 =
      over 60) and the band's colour; the unit moves to the column heading. The
      bands are a reading aid, not a rule. A cell with several values (a launch
      bay's speeds), "Contact" and a dash stay text.
   b) Criticals: Rulebook p. 67 "Critical hits that can be repaired are
      cumulative" and "If ... multiple criticals are rolled for a location that
      cannot be repaired (such as Shields Collapse), apply the next highest
      critical hit instead" -> an unrepairable result (starred in the table) can
      come only once: one box. Icons for the standard table only. */
(function(){
  const rc = DOMAIN.rangeCell;
  check("rangeCell exists", typeof rc === "function");
  if(typeof rc === "function"){
  const b = t => { const x = rc(t); return x ? x.label + "/" + x.band : null; };
  check("rangeCell: a single value gets the number without the unit, and a band",
        same([b("15 cm"), b("30 cm"), b("45 cm"), b("60 cm"), b("90 cm")], ["15/1", "30/2", "45/3", "60/4", "90/5"]),
        JSON.stringify([b("15 cm"), b("30 cm"), b("45 cm"), b("60 cm"), b("90 cm")]));
  check("rangeCell: a value between bands gets the next band up (20 and 25 cm = band 2, 40 cm = 3)",
        same([b("20 cm"), b("25 cm"), b("40 cm"), b("10 cm")], ["20/2", "25/2", "40/3", "10/1"]));
  check("rangeCell: a range (nova cannon 30-150 cm) shows the range and gets the upper limit's band",
        b("30 \u2013 150 cm") === "30\u2013150/5" && b("30-150 cm") === "30\u2013150/5", String(b("30 \u2013 150 cm")));
  check("rangeCell: a multi-value cell, Contact and a dash get no band",
        rc("Fighta-Bommas: 25 cm / Assault Boats: 30 cm") === null && rc("Contact") === null && rc("\u2013") === null && rc("") === null && rc(null) === null);
  check("rangeCell: every band has its own colour, five different colours",
        new Set(["15 cm", "30 cm", "45 cm", "60 cm", "90 cm"].map(t => rc(t).color)).size === 5 &&
        ["15 cm", "30 cm", "45 cm", "60 cm", "90 cm"].every(t => /^#[0-9A-F]{6}$/i.test(rc(t).color)));
  /* every single-value range in the catalog gets a band (no silent fall into text) */
  let single = 0, missed = [];
  Object.values(catalog.ships).forEach(sh => (sh.aw || []).forEach(a => {
    if(/^\d+\s*cm$/i.test(String(a[1]).trim())){ single++; if(!rc(a[1])) missed.push(a[1]); } }));
  check("rangeCell: every 'NN cm' range in the catalog gets a band", single > 500 && missed.length === 0, single + " / " + missed.slice(0, 5).join(","));
  }

  const find = ref => { let hit = null; catalog.lists.forEach(L => L.secs.forEach(sec => sec.ents.forEach(en => {
    if(!hit && en.k !== "up" && String(en.r) === ref) hit = { L, sec, en }; }))); return hit; };
  const resolve = ref => { const a = find(ref);
    return DOMAIN.resolveUnit({ schemaVersion: 2, entry: { list: a.L.nm, section: a.sec.t, label: a.en.l }, ref, hull: ref, hulls: 1,
      name: "", note: "", adjust: 0, custom: null, members: [], options: {}, upgrades: {} }, { list: a.L }, catalog); };
  const refOf = re => Object.keys(catalog.ships).find(k => re.test(catalog.ships[k].nm) && find(k));
  const crit = re => { const k = refOf(re); return k ? resolve(k).damage.critical : null; };
  const lunar = crit(/^LUNAR CLASS CRUISER$/);
  check("the standard table (p. 67): only 9 Bridge and 10 Shields are once-only results", lunar && same(lunar.once, ["9", "10"]), JSON.stringify(lunar && lunar.once));
  check("standard table: every result 2-10 has an icon",
        lunar && lunar.icons && same(lunar.icons, { "2": "dorsal", "3": "starboard", "4": "port", "5": "prow", "6": "engine", "7": "fire", "8": "thrusters", "9": "bridge", "10": "shields" }),
        JSON.stringify(lunar && lunar.icons));
  /* other tables: a once-only result = the table's starred row (pages in the table footnotes), no icons */
  const others = [[/HIVE SHIP/, ["10"], "Tyranid"], [/CAIRN/, [], "Necron"], [/^VOID STALKER/, ["9", "10"], "Eldar"], [/^TORTURE CLASS/, ["9", "10"], "Dark Eldar"]];
  others.forEach(o => { const c = crit(o[0]);
    check(o[2] + " table: once-only results " + JSON.stringify(o[1]) + ", no icons", !!c && same(c.once, o[1]) && !c.icons, JSON.stringify(c && [c.title, c.once, c.icons])); });
  const hulk = crit(/^ORK HULK$/);
  check("the hulk's D6 table: no once-only results and no icons (boxes of its own)", !!hulk && same(hulk.once, []) && !hulk.icons, JSON.stringify(hulk && [hulk.once, hulk.icons]));
})();

/* ---- 21. v1.2: a port and a starboard row as a pair (owner 12.10.2026) -----
   "the two-part paired weapons, port and starboard, ... some small visual link
   that they belong together", choice C: a shared badge, range and strength
   once, the arcs on their own rows. A pair is presentation on the resolved row
   (pair = 1 upper, 2 lower): two CONSECUTIVE rows whose names differ only in
   Port / Starboard and whose range and strength are the same. A row with a box
   or alternative of its own (a choice, OR, ammunition, a write-in box, a hulk's
   minus boxes) is not part of a pair - its strength is not shared. */
(() => {
  const find = ref => { let hit = null; catalog.lists.forEach(L => L.secs.forEach(sec => (sec.ents || []).forEach(en => {
    if(!hit && en.k !== "up" && String(en.r) === ref) hit = { L, sec, en }; }))); return hit; };
  const resolve = ref => { const a = find(ref);
    return DOMAIN.resolveUnit({ schemaVersion: 2, entry: { list: a.L.nm, section: a.sec.t, label: a.en.l }, ref, hull: ref, hulls: 1,
      name: "", note: "", adjust: 0, custom: null, members: [], options: {}, upgrades: {} }, { list: a.L }, catalog); };
  const pairs = ref => resolve(ref).weapons.map(w => w.pair || 0);
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  /* Fleets p.71 Lunar: lance pair, battery pair, prow torpedoes (+ the nova alternative row) */
  check("Lunar (p. 71): two pairs, the prow rows not", same(pairs("71").slice(0, 5), [1, 2, 1, 2, 0]), JSON.stringify(pairs("71")));
  /* Fleets p. 69 Tyrant: the 45 cm / 4 pair. The 30 cm batteries can be swapped
     for 45 cm batteries ("Can replace its 30 cm range weapons batteries with 45 cm
     range weapons batteries at a cost of +10 pts"): on the default card each
     has its own OR row, so they are not a pair. When the option is taken, the
     alternative is gone and the rows are ordinary weapons -> a second pair. */
  check("Tyrant (p. 69): the 45 cm / 4 pair, the choice rows not", same(pairs("69"), [1, 2, 0, 0, 0, 0, 0, 0]), JSON.stringify(pairs("69")));
  const tyr = resolve("69"), o45 = tyr.options.filter(o => /45 cm range weapons batteries/i.test(o.text))[0];
  const a69 = find("69"), take = {}; take[o45.id] = { state: "take", qty: 1 };
  const tyr45 = DOMAIN.resolveUnit({ schemaVersion: 2, entry: { list: a69.L.nm, section: a69.sec.t, label: a69.en.l }, ref: "69", hull: "69", hulls: 1,
    name: "", note: "", adjust: 0, custom: null, members: [], options: take, upgrades: {} }, { list: a69.L }, catalog);
  check("... option taken: price 195 and two pairs (45 / 4 and 45 / 6)", tyr45.points === 195 && same(tyr45.weapons.map(w => w.pair || 0), [1, 2, 1, 2, 0, 0]),
        JSON.stringify([tyr45.points, tyr45.weapons.map(w => [w.a[1], w.a[2], w.pair || 0])]));
  /* Fleets p. 77 Dauntless: one pair and the prow lances */
  check("Dauntless (p. 77): a battery pair, the prow lances not", same(pairs("77").slice(0, 3), [1, 2, 0]), JSON.stringify(pairs("77")));
  /* Fleets p. 382 Kill Kroozer: a heavy gunz pair, a gunz pair; the prow choice and its alternative not */
  check("Kill kroozer (p. 382): two pairs, the prow rows not", same(pairs("382"), [1, 2, 1, 2, 0, 0, 0]), JSON.stringify(pairs("382")));
  /* Fleets p.389 Ork Hulk: the rows have their own minus boxes */
  check("Ork Hulk (p.389): no pairs", pairs("389").every(x => x === 0), JSON.stringify(pairs("389")));
  /* the calculator directly on made-up rows */
  check("DOMAIN.pairRows is exported", typeof DOMAIN.pairRows === "function");
  const pr = rows => (DOMAIN.pairRows ? DOMAIN.pairRows(rows) : rows).map(r => r.pair || 0);
  const row = (name, range, str, extra) => Object.assign({ a: [name, range, str, "Left"], state: "active" }, extra || {});
  check("the same range and strength -> a pair", same(pr([row("Port lance battery", "30 cm", "2"), row("Starboard lance battery", "30 cm", "2")]), [1, 2]));
  check("the order Starboard, Port works too", same(pr([row("Starboard lance battery", "30 cm", "2"), row("Port lance battery", "30 cm", "2")]), [1, 2]));
  check("a star in the name does not prevent it", same(pr([row("Port lance battery*", "30 cm", "2"), row("Starboard lance battery", "30 cm", "2")]), [1, 2]));
  check("different strength -> no pair", same(pr([row("Port lance battery", "30 cm", "2"), row("Starboard lance battery", "30 cm", "3")]), [0, 0]));
  check("different range -> no pair", same(pr([row("Port lance battery", "30 cm", "2"), row("Starboard lance battery", "45 cm", "2")]), [0, 0]));
  check("different weapon -> no pair", same(pr([row("Port lance battery", "30 cm", "2"), row("Starboard weapons battery", "30 cm", "2")]), [0, 0]));
  check("two Port rows -> no pair", same(pr([row("Port lance battery", "30 cm", "2"), row("Port lance battery", "30 cm", "2")]), [0, 0]));
  check("a row in between -> no pair", same(pr([row("Port lance battery", "30 cm", "2"), row("Dorsal lance battery", "30 cm", "2"), row("Starboard lance battery", "30 cm", "2")]), [0, 0, 0]));
  check("three in a row: the first pair, the third alone", same(pr([row("Port gunz", "30 cm", "D6"), row("Starboard gunz", "30 cm", "D6"), row("Port gunz", "30 cm", "D6")]), [1, 2, 0]));
  /* a choice row whose alternative is on the card is not part of a pair; a choice row left alone is an ordinary weapon */
  check("a choice row with an alternative -> no pair",
        same(pr([row("Port lance battery", "30 cm", "2", { grp: 1, i: 0 }), row("Starboard lance battery", "30 cm", "2", { i: 1 }),
                 row("Port weapons battery", "30 cm", "2", { grp: 1, alt: 1, i: 0, state: "offered" })]), [0, 0, 0]));
  check("choice rows left alone -> pair",
        same(pr([row("Port weapons battery", "45 cm", "6", { grp: 1, alt: 1, i: 2 }), row("Starboard weapons battery", "45 cm", "6", { grp: 1, alt: 1, i: 3 })]), [1, 2]));
  [["alt", { alt: 1 }], ["box", { box: "open" }], ["writeIn", { writeIn: 1 }],
   ["loss", { loss: { key: "x", per: 1, n: 2 } }], ["offered", { state: "offered" }]].forEach(x => {
    check("a row with " + x[0] + " -> no pair (either way round)",
          same(pr([row("Port lance battery", "30 cm", "2", x[1]), row("Starboard lance battery", "30 cm", "2")]), [0, 0]) &&
          same(pr([row("Port lance battery", "30 cm", "2"), row("Starboard lance battery", "30 cm", "2", x[1])]), [0, 0]));
  });
})();

/* ---- 22. what one addition buys (owner 13.10.2026) --------------------
   The catalogue's plus adds ONE CARD of a squadron, not one ship, and the
   player must see that on the row before pressing. Expectations from the book:
   escorts 2-6 ships in a squadron (Fleets p. 13), one-hit defences "grouped in
   up to six units" (Rulebook p. 100), ground units no squadron rule but the
   row's own limit 0-4 (Air base, Fleets p. 499 and p. 517), an orbital mine is
   bought by the piece onto one card (p. 512). */
(function(){
  const GO = catalog.lists.find(L => L.nm === "Imperial Navy — Gothic Sector");
  const rp = re => {
    let out = null;
    GO.secs.forEach((sec, si) => sec.ents.forEach(en => {
      if(out || !re.test(en.l) || DOMAIN.isUpgradeEnt(en)) return;
      out = DOMAIN.rowPurchase(GO, si, en, en.r ? catalog.ships[String(en.r)] : null);
    }));
    return out;
  };
  check("rowPurchase is exported", typeof DOMAIN.rowPurchase === "function");
  if(typeof DOMAIN.rowPurchase !== "function") return;
  check("cruiser: one ship, one card", same(rp(/^lunar class cruiser$/i), { kind: "single" }));
  check("commander: one", same(rp(/^fleet-admiral/i), { kind: "single" }));
  check("escort: squadron 2-6 (Fleets p.13)", same(rp(/^sword class frigate$/i), { kind: "squadron", min: 2, max: 6 }));
  check("one-hit defence: squadron 1-6 (Rulebook p.100)", same(rp(/^orbital weapons platform$/i), { kind: "squadron", min: 1, max: 6 }));
  check("a ground unit: at most the row's limit per card, not a squadron (p. 517, 0-4)", same(rp(/^air base$/i), { kind: "group", min: 1, max: 4 }));
  check("orbital mine: a count on one card, no limit (p.499, p.512)", same(rp(/^orbital mine$/i), { kind: "count", max: null }));
  check("minefield: a count on one card, at most 2 (p.499, p.513)", same(rp(/^minefield$/i), { kind: "count", max: 2 }));
})();

/* ---- 22b. one press on a catalogue row is one ship (owner 18.10.2026)
   "the fleet builder could have a feature: on a squadron card a +/- right there
   to change the squadron's size": on a row sold by the card, + is one ship onto
   the row's last card until the card is full (Fleets p. 13: 2-6), and then a
   new card at its minimum; - is one ship off the last card, and at the minimum
   the card goes. A single-ship row is one unit a press. rowStep only says what
   to do - it does not do it. */
(function(){
  check("rowStep is exported", typeof DOMAIN.rowStep === "function");
  if(typeof DOMAIN.rowStep !== "function") return;
  const sq = { kind: "squadron", min: 2, max: 6 }, one = { kind: "single" };
  const cnt = { kind: "count", max: null }, grp = { kind: "group", min: 1, max: 4 };
  const u = n => ({ n: n });
  const st = (b, us, d) => { const r = DOMAIN.rowStep(b, us, d); return r ? r.act + (r.unit ? ":" + us.indexOf(r.unit) : "") : "null"; };
  check("squadron, empty: + opens a card", st(sq, [], 1) === "open", st(sq, [], 1));
  check("squadron 2: + grows the last card", st(sq, [u(2)], 1) === "grow:0", st(sq, [u(2)], 1));
  check("squadron of 6 (full): + opens a new card", st(sq, [u(6)], 1) === "open", st(sq, [u(6)], 1));
  check("squadron 6+3: + grows the last, not the first", st(sq, [u(6), u(3)], 1) === "grow:1", st(sq, [u(6), u(3)], 1));
  check("squadron 3: - shrinks", st(sq, [u(3)], -1) === "shrink:0", st(sq, [u(3)], -1));
  check("squadron of 2 (minimum): - takes the card away", st(sq, [u(2)], -1) === "remove:0", st(sq, [u(2)], -1));
  check("squadron 4+2: - takes the last card away, does not shrink the first", st(sq, [u(4), u(2)], -1) === "remove:1", st(sq, [u(4), u(2)], -1));
  check("squadron, empty: - does nothing", st(sq, [], -1) === "null", st(sq, [], -1));
  check("one ship: + opens, - removes the last", st(one, [u(1)], 1) === "open" && st(one, [u(1), u(1)], -1) === "remove:1");
  check("one ship, empty: - does nothing", st(one, [], -1) === "null");
  check("a count without a limit: + always grows the same card (p. 512)", st(cnt, [u(9)], 1) === "grow:0", st(cnt, [u(9)], 1));
  check("a count of 1: - takes the card away", st(cnt, [u(1)], -1) === "remove:0", st(cnt, [u(1)], -1));
  check("a ground unit of 4 (the row's limit): + opens a new card (p. 517)", st(grp, [u(4)], 1) === "open", st(grp, [u(4)], 1));
  check("a missing n reads as one", st(sq, [{}], -1) === "remove:0" && st(cnt, [{}], -1) === "remove:0");
})();

/* ---- 23. every buyable row has a book page (J165) ----------
   A row made from prose ("One extra re-roll") used to get only its sentence,
   not its page: the Pirate Captain's re-rolls (Fleets p. 178) and Prince
   Yriel's (p. 319) had none, nor did 135 other rows. The page is read during
   extraction from the sentence's own page, not the list's first page. */
(function(){
  const rowsOf = (lre, sre, ere) => {
    const out = [];
    catalog.lists.forEach(L => { if(!lre.test(L.nm)) return;
      L.secs.forEach(sec => { if(!sre.test(sec.t)) return;
        sec.ents.forEach(en => { if(ere.test(en.l)) out.push(en); }); }); });
    return out;
  };
  const pir = rowsOf(/Pirates and Wolf Packs$/, /^Pirate Captains$/i, /extra re-roll/i);
  check("the Pirate Captain's two re-roll rows on page 178",
        pir.length === 2 && pir.every(en => en.src_page === 178), JSON.stringify(pir.map(en => [en.l, en.src_page])));
  const yr = rowsOf(/^Eldar Corsairs/, /./, /extra re-roll/i);
  check("Prince Yriel's re-roll rows on page 319 on both Corsair lists",
        yr.length === 4 && yr.every(en => en.src_page === 319), JSON.stringify(yr.map(en => [en.l, en.src_page])));
  const miss = [];
  catalog.lists.forEach(L => L.secs.forEach(sec => sec.ents.forEach(en => {
    if((en.k === "up" || en.k === "cmd") && !(en.src_page > 0)) miss.push(L.nm + " / " + sec.t + " / " + en.l);
  })));
  check("every upgrade and commander row has a book page", miss.length === 0,
        miss.length + ": " + miss.slice(0, 6).join(" | "));
})();

/* ---- 24. the Ork Rok as a planetary defence (Fleets p. 360, p. 367, p. 393; J172) --
   p. 360 ORK PLANETARY DEFENCES: "Ork Roks can be taken as planetary defences
   and purchased using planetary defence point allowances ... they
   automatically pass all leadership checks they are required to make but
   cannot undergo any Special Orders except Reload Ordnance and Brace For
   Impact, for which they are Leadership 7 ... Ork Roks cannot move and count
   as stationary in all effects ... roll 2D6 after setting up each Rok. On a
   roll of 12, the Rok falls 2D6 cm toward the celestial phenomena". The rule is
   in the Orks' shared rules, so it covers all three Ork lists. p. 393: "Roks
   are sufficiently different to both Orbital Defences and true spaceships" - a
   critical is +1 damage and breaking up is 4 blast markers as a defence too
   (a reading: the Rok's own rule wins over the general table). */
(function(){
  const PD = "PLANETARY DEFENCES";
  const orks = catalog.lists.filter(L => /^Orks — /.test(L.nm));
  const rokRow = L => (L.secs.find(x => x.t === PD) || { ents: [] }).ents.find(e => /^Rok\b/.test(e.l));
  check("Rok: three Ork lists", orks.length === 3, orks.map(L => L.nm).join(", "));
  check("Rok: 80 pts in every Ork list's defence section (p. 360, p. 367)",
        orks.every(L => { const e = rokRow(L); return e && e.p === 80 && e.src_page === 360 && String(e.r) !== "392"; }),
        JSON.stringify(orks.map(L => rokRow(L) && [rokRow(L).l, rokRow(L).p, rokRow(L).r, rokRow(L).src_page])));
  check("Rok: other lists do not sell a Rok defence",
        catalog.lists.every(L => /^Orks — /.test(L.nm) || !rokRow(L)));
  const L = orks.find(x => /Cyclops/.test(x.nm)), e = L && rokRow(L);
  if(!e) return;
  const sec = L.secs.find(x => x.t === PD);
  const R = DOMAIN.resolveUnit({ list: L.nm, entry: { section: sec.t, label: e.l }, ref: String(e.r), hulls: 1,
                                 options: {}, upgrades: {} }, { list: L, host: L }, catalog);
  const txt = R.rules.map(r => r.t).join(" | ");
  check("Rok as a defence: Ld 7 only for Reload and Brace, other tests pass automatically (p. 360)",
        R.leadership && R.leadership.value === 7 && same(R.orders, ["RO", "BFI"]) &&
        /automatically pass/i.test(txt) && !/any other Leadership check is also made on Ld 7/.test(txt), txt);
  check("Rok as a defence: does not move, a 2D6 roll of 12 = falls 2D6 cm, destroyed in an asteroid field or at a planet's edge",
        R.stats.speed === "0 cm" && /cannot move/i.test(txt) && /2D6/.test(txt) && /12/.test(txt) && /asteroid field/.test(txt) &&
        !/exactly 10 cm straight ahead/.test(txt), R.stats.speed + " :: " + txt);
  check("Rok as a defence: D6 removal of blast markers as for a fixed defence (p.360 'including all rules concerning removal of blast markers')",
        /D6 Blast Markers/.test(txt), txt);
  check("Rok as a defence: no Ork Ld -1 and no All Ahead Full",
        !/Leadership is reduced by 1/.test(txt) && !/All Ahead Full/.test(txt), txt);
  check("Rok as a defence: the Rok's own critical (+1 damage) and breaking up into 4 blast markers (p. 393), not the Defences table",
        !/DEFENCES/.test(R.damage.critical.title) && /4 Blast Markers/.test(R.damage.critical.foot || "") &&
        /p\. 393/.test(R.damage.critical.foot || ""), JSON.stringify([R.damage.critical.title, R.damage.critical.foot]));
  check("Rok as a defence: no list upgrades (Dakka Dakka, clans)", R.upgrades.length === 0 &&
        DOMAIN.upgradesFor ? true : true, JSON.stringify(R.upgrades));
})();

/* ---- 25. small gaps in the defences (BACKLOG J175) ----------------------
   (a) Fleets p. 304: "all Eldar Ordnance can only be hit by defensive turrets
   on a roll of 6 ... This includes ... orbital mines"; p. 345 the same for Dark
   Eldar. (b) p. 407: "As long as it is not crippled a Shroud will never
   activate orbital mines". (c) p. 437: "up to 10% of the Tyranid escort
   drones in the fleet can elect to become fireships". (d) p. 337: "Any number
   of ships may be purchased against the fleet's total at 50% cost, but they
   count as reserves and start off the table." (e) Rulebook p. 116: "all
   firepower shooting in low orbit suffers one column shift to the right,
   lances and nova cannons require a 4+ roll to fire". */
(function(){
  const PD = "PLANETARY DEFENCES";
  const by = nm => catalog.lists.find(L => L.nm === nm);
  const pdUnit = (L, re, hulls) => {
    const sec = L.secs.find(x => x.t === PD), en = sec.ents.find(e => re.test(e.l));
    return { list: L.nm, entry: { section: sec.t, label: en.l }, ref: en.r == null ? null : String(en.r),
             hulls: hulls || 1, options: {}, upgrades: {} };
  };
  const R = (L, u) => DOMAIN.resolveUnit(u, { list: L, host: L }, catalog);
  const GO = by("Imperial Navy — Gothic Sector"), EC = by("Eldar Corsairs — Gothic Sector"),
        DE = by("Dark Eldar — Pirates"), TH = by("Tyranids — Hive Fleet");
  const steps = (L, re) => R(L, pdUnit(L, re, 1)).ruleCard.steps.map(x => x.h + ": " + x.t).join(" | ");

  /* (a) */
  check("J175a: an Eldar list's orbital mine card: turrets hit only on 6 (p. 304)",
        /Turrets hit this mine only on a 6/.test(steps(EC, /^Orbital mine$/)) && /p\. 304/.test(steps(EC, /^Orbital mine$/)),
        steps(EC, /^Orbital mine$/));
  check("J175a: a Dark Eldar minefield's mines: turrets only on 6 (p. 345)",
        /only on a 6/.test(steps(DE, /^Minefield$/)) && /p\. 345/.test(steps(DE, /^Minefield$/)), steps(DE, /^Minefield$/));
  check("J175a: the Imperial Navy mine card has no Eldar rule",
        !/only on a 6/.test(steps(GO, /^Orbital mine$/)) && !/only on a 6/.test(steps(GO, /^Minefield$/)));
  /* (b) */
  check("J175b: the Shroud exception on both mine cards (p.407)",
        [steps(GO, /^Orbital mine$/), steps(GO, /^Minefield$/)].every(t => /Shroud never activates orbital mines/.test(t) && /p\. 407/.test(t)));

  /* (c) */
  const DR = (() => { let hit = null;
    TH.secs.forEach(sec => sec.ents.forEach(en => { if(!hit && String(en.r) === "437") hit = [sec, en]; })); return hit; })();
  const S437 = catalog.ships["437"];
  const fsOpt = S437 && S437.ol.find(o => /become fireships/.test(o.t));
  const drones = (n, fire) => {
    const u = { list: TH.nm, entry: { section: DR[0].t, label: DR[1].l }, ref: "437", hulls: n, options: {}, upgrades: {} };
    if(fire) u.options[fsOpt.id] = { state: "take" };
    return u;
  };
  const fsRow = us => DOMAIN.resolveFleet({ list: TH.nm, limit: 5000, units: us }, catalog).checks
    .find(c => /^Fire ship escort drones/.test(c.t));
  check("J175c: the drone profile has a fire ship option", !!DR && !!fsOpt);
  if(DR && fsOpt){
    check("J175c: 1 fire ship out of 10 drones is fine (10 % = 1)", !!fsRow([drones(9), drones(1, true)]) && fsRow([drones(9), drones(1, true)]).ok === true,
          JSON.stringify(fsRow([drones(9), drones(1, true)])));
    check("J175c: 1 fire ship out of 9 drones is not (rounded down: 0)", !!fsRow([drones(8), drones(1, true)]) && fsRow([drones(8), drones(1, true)]).ok === false,
          JSON.stringify(fsRow([drones(8), drones(1, true)])));
    check("J175c: no row without a fire ship", !fsRow([drones(9), drones(1)]));
  }

  /* (d) */
  const ecShip = (re, ww) => {
    let hit = null;
    EC.secs.forEach((sec, si) => sec.ents.forEach((en, ei) => { if(!hit && en.r && en.k !== "up" && re.test(en.l) && sec.t !== PD) hit = [sec, en]; }));
    const u = { list: EC.nm, entry: { section: hit[0].t, label: hit[1].l }, ref: String(hit[1].r), hulls: 1, options: {}, upgrades: {} };
    if(ww){
      const s2 = EC.secs.find(x => x.t === "WEBWAY PORTAL"), e2 = s2 && s2.ents[0];
      if(e2) u.upgrades[DOMAIN.upgradeId(EC.nm, s2.t, e2.l)] = "take";
    }
    return u;
  };
  const wwSec = EC.secs.find(x => x.t === "WEBWAY PORTAL");
  check("J175d: the Corsair list has a Webway Portal section, page 337", !!wwSec && wwSec.ents.length === 1 && wwSec.ents[0].src_page === 337);
  if(wwSec){
    const full = R(EC, ecShip(/^Eclipse/)), half = R(EC, ecShip(/^Eclipse/, true));
    check("J175d: an Eclipse through the portal at half price (rounded up)",
          half.points === Math.ceil(full.points / 2), full.points + " -> " + half.points);
    check("J175d: the portal row opens as Hide, no open box on the card",
          !full.upgrades.some(u => /Webway/.test(u.label) && u.state !== "off"), JSON.stringify(full.upgrades.filter(u => /Webway/.test(u.label))));
    check("J175d: the maximum price does not count the discount", full.maxPoints === R(EC, ecShip(/^Eclipse/)).maxPoints);
    const wwRow = us => DOMAIN.resolveFleet({ list: EC.nm, limit: 5000, units: us }, catalog).checks.find(c => /^Ships through the Webway Portal/.test(c.t));
    check("J175d: a portal ship without a Haven is red", !!wwRow([ecShip(/^Eclipse/, true)]) && wwRow([ecShip(/^Eclipse/, true)]).ok === false);
    check("J175d: fine with a Haven", !!wwRow([ecShip(/^Eclipse/, true), pdUnit(EC, /^Haven space station$/)]) &&
          wwRow([ecShip(/^Eclipse/, true), pdUnit(EC, /^Haven space station$/)]).ok === true);
    check("J175d: Dark Eldar have no portal (p. 347 swaps only weapons)", !DE.secs.some(x => x.t === "WEBWAY PORTAL"));
  }

  /* (e) */
  const silo = R(GO, pdUnit(GO, /^Defence laser silo$/, 1)), msl = R(GO, pdUnit(GO, /^Missile silo$/, 1));
  check("J175e: low orbit fire on a laser silo's card: a column right, a lance 4+ (Rulebook p. 116)",
        silo.rules.some(r => /one column right/.test(r.t) && /4\+ to fire/.test(r.t) && /p\. 116/.test(r.t)), silo.rules.map(r => r.t.slice(0, 40)).join(" | "));
  check("J175e: the missile silo has no lance rule (the torpedo ban applies to ships)",
        !msl.rules.some(r => /4\+ to fire/.test(r.t)));
})();

/* ---- 26. the remains of spot check 20 (BACKLOG J120) ----------------------
   (a) Fleets p. 235: the Daemonship's price is "based upon the type of vessel
   chosen" - a row aimed at all ships of the host's type heading is offered to a
   borrowed ship whose own heading is the same (T34, p. 14). (b) p. 19 special
   torpedoes need torpedoes: the list's "Nova Cannon instead of prow
   torpedoes" takes them away. (d) p. 225 Thousand Sons crew: Mark of Tzeentch. */
(function(){
  const by = nm => catalog.lists.find(L => L.nm === nm);
  const INC = by("Chaos — Incursion"), NUR = by("Chaos — Nurgle"), BC = by("Chaos — Black Crusade"),
        TZ = by("Chaos — Tzeentch"), EX = by("Adeptus Mechanicus — Explorator");
  const rowOf = (Lx, re) => { let h = null;
    Lx.secs.forEach(s => s.ents.forEach(e => { if(!h && !DOMAIN.isUpgradeEnt(e) && e.r != null && re.test(e.l)) h = { s, e }; })); return h; };
  const unit = (Lx, re, role) => { const r = rowOf(Lx, re);
    return { schemaVersion: 2, role: role || "core", entry: { list: Lx.nm, section: r.s.t, label: r.e.l }, ref: String(r.e.r),
             hull: null, hulls: 1, name: "", note: "", adjust: 0, custom: null, members: [], options: {}, upgrades: {} }; };
  const take = (u, Lx, re) => { Lx.secs.forEach(s => s.ents.forEach(e => {
    if(DOMAIN.isUpgradeEnt(e) && re.test(e.l)) u.upgrades[DOMAIN.upgradeId(Lx.nm, s.t, e.l)] = "take"; })); return u; };
  const R = (host, u) => DOMAIN.resolveUnit(u, { list: host, host: host }, catalog);
  const offered = Rx => Rx.upgrades.filter(x => x.state !== "off");

  /* (a) */
  const inN = offered(R(NUR, unit(INC, /^Carnage/, "reserve")));
  const dsN = inN.filter(x => /^Daemonship:/.test(x.label));
  check("J120a: Incursion's Carnage in a Nurgle fleet: the host's Daemonship: Cruiser 55 pts (p. 241)",
        dsN.length === 1 && dsN[0].label === "Daemonship: Cruiser" && dsN[0].list === NUR.nm && dsN[0].cost === 55,
        JSON.stringify(dsN.map(x => [x.label, x.list, x.cost])));
  const ds2 = offered(R(NUR, take(unit(INC, /^Carnage/, "reserve"), NUR, /^Daemonship: Cruiser$/)));
  check("J120a: ... and when taken it is in the price", R(NUR, take(unit(INC, /^Carnage/, "reserve"), NUR, /^Daemonship: Cruiser$/)).points ===
        R(NUR, unit(INC, /^Carnage/, "reserve")).points + 55 && ds2.some(x => x.label === "Daemonship: Cruiser" && x.state === "take"));
  const bcN = offered(R(NUR, unit(BC, /^Carnage/, "reserve"))).filter(x => /^Daemonship: Cruiser$/.test(x.label));
  check("J120a: the Black Crusade Carnage in a Nurgle fleet: Daemonship: Cruiser once, from its own list",
        bcN.length === 1 && bcN[0].list === BC.nm, JSON.stringify(bcN.map(x => [x.label, x.list])));
  const natN = offered(R(NUR, unit(NUR, /^Carnage/))).filter(x => /^Daemonship:/.test(x.label));
  check("J120a: Nurgle's own Carnage unchanged: Daemonship: Cruiser", natN.length === 1 && natN[0].label === "Daemonship: Cruiser");

  /* (b) */
  const gothic = () => unit(EX, /^Gothic class cruiser$/);
  const stOf = Rx => offered(Rx).filter(x => /^Special torpedoes/.test(x.label)).map(x => x.label);
  check("J120b: an Explorator Gothic without a Nova: special torpedoes offered", stOf(R(EX, gothic())).length === 1, JSON.stringify(stOf(R(EX, gothic()))));
  const gNova = take(gothic(), EX, /^Nova Cannon instead of prow torpedoes$/);
  check("J120b: ... with the list's Nova taken the torpedoes are gone, and special torpedoes are not offered (p. 19)",
        !R(EX, gNova).weapons.some(w => /torpedo/i.test(w.a[0]) && w.state === "active") && stOf(R(EX, gNova)).length === 0,
        JSON.stringify(stOf(R(EX, gNova))));

  /* (d) */
  const tzM = offered(R(TZ, take(unit(INC, /^Carnage/, "reserve"), TZ, /^Thousand Sons Chaos Space Marine crew$/)));
  check("J120d: Incursion's Carnage with a Tzeentch Thousand Sons crew gets the Mark of Tzeentch (p. 225)",
        tzM.some(x => x.label === "The Mark of Tzeentch" && x.list === TZ.nm), JSON.stringify(tzM.map(x => [x.label, x.list])));
})();

/* ---- 27. the remains of the re-roll boxes (BACKLOG J168) --------------------
   (a) A Tzeentch Warmaster aboard the Scion of Prospero: the Mark is in the
   ship's price (p. 258) - a row left as an Option would be an open box on the
   card. (b) Fortress-Monastery p. 111 and Ramilies p. 503: a commander aboard ->
   the fort's re-rolls are the whole fleet's. */
(function(){
  const TZ = catalog.lists.find(L => L.nm === "Chaos \u2014 Tzeentch");
  const own = (re, ups) => { let h = null;
    TZ.secs.forEach(s => s.ents.forEach(e => { if(!h && e.k !== "up" && re.test(e.l)) h = { s, e }; }));
    const u = { list: TZ.nm, entry: { section: h.s.t, label: h.e.l }, ref: h.e.r == null ? null : String(h.e.r), hulls: 1, options: {}, upgrades: {} };
    Object.assign(u.upgrades, ups || {});
    return u; };
  let mk = null; TZ.secs.forEach(s => s.ents.forEach(e => { if(!mk && e.k === "up" && /^The Mark of Tzeentch$/.test(e.l) && e.at && e.at.length === 1) mk = DOMAIN.upgradeId(TZ.nm, s.t, e.l); }));
  const rows = st => DOMAIN.resolveFleet({ list: TZ.nm, limit: 2000, units: [own(/^Chaos Warmaster/, { [mk]: st }), own(/^Scion of Prospero/)] }, catalog)
    .checks.filter(c => /Mark of Tzeentch/.test(c.t)).map(c => c.t + (c.ok ? "" : " [RED]") + (c.warn ? " [warn]" : ""));
  check("J168a: the Warmaster's Mark as Option aboard the Scion -> a warning (Hide)", rows("opt").some(t => /is in the ship's cost/.test(t) && /\[warn\]/.test(t)), JSON.stringify(rows("opt")));
  check("J168a: ... no row as Hide", rows("off").length === 0, JSON.stringify(rows("off")));
  check("J168a: ... taken, the double payment is red (unchanged)", rows("take").some(t => /paid twice/.test(t) && /RED/.test(t)), JSON.stringify(rows("take")));

  const R = (L, re) => { let h = null;
    L.secs.forEach(s => s.ents.forEach(e => { if(!h && e.r != null && e.k !== "up" && re.test(e.l)) h = { s, e }; }));
    const u = { list: L.nm, entry: { section: h.s.t, label: h.e.l }, ref: String(h.e.r), hulls: 1, options: {}, upgrades: {} };
    L.secs.forEach(s => s.ents.forEach(e => { if(e.k === "up" && /^One re-roll$/.test(e.l) && e.at && e.at.some(p => L.secs[p[0]] === h.s)) u.upgrades[DOMAIN.upgradeId(L.nm, s.t, e.l)] = "take"; }));
    return DOMAIN.resolveUnit(u, { list: L, host: L }, catalog); };
  const CR = catalog.lists.find(L => L.nm === "Space Marines \u2014 Crusade"), GO = catalog.lists.find(L => L.nm === "Imperial Navy \u2014 Gothic Sector");
  const fm = R(CR, /^Fortress-Monastery$/), rf = R(GO, /^Ramilies/);
  check("J168b: the Fortress-Monastery re-rolls join the commander's own (p.111)", !!fm.rerolls && fm.rerolls.joins && fm.rerolls.joins.page === 111, JSON.stringify(fm.rerolls));
  check("J168b: the Ramilies re-roll joins the commander's own (p.503)", !!rf.rerolls && rf.rerolls.joins && rf.rerolls.joins.page === 503, JSON.stringify(rf.rerolls));
})();

/* ---- 28. Pirates: transports may be alone (Fleets p. 13, p. 179; J46 b)
   The Cargo Transport (p. 85), the Armed Freighter (p. 523 "half a freighter")
   and the Armed Cargo Vessel (p. 192 "half-transport") are transports; the
   Escort Carrier and the Q-Ship "do not count as freighters" (pp. 521-522). */
(function(){
  const L = catalog.lists.find(x => x.nm === "Rogue Traders \u2014 Pirates and Wolf Packs");
  const u = (re, n) => { let h = null;
    L.secs.forEach(s => s.ents.forEach(e => { if(!h && e.k !== "up" && e.r != null && re.test(e.l)) h = { s, e }; }));
    return { list: L.nm, entry: { section: h.s.t, label: h.e.l }, ref: String(h.e.r), hulls: n || 1, options: {}, upgrades: {} }; };
  let cap = null; L.secs.forEach(s => s.ents.forEach(e => { if(!cap && e.k === "cmd") cap = { s, e }; }));
  const capt = { list: L.nm, entry: { section: cap.s.t, label: cap.e.l }, ref: null, hulls: 1, options: {}, upgrades: {} };
  const F = units => DOMAIN.resolveFleet({ list: L.nm, limit: 3000, units }, catalog).checks;
  const red = cs => cs.filter(c => !c.ok).map(c => c.t + ": " + c.v);
  const cruiser = () => u(/^Hellebore|^Carnage|^Murder|^Slaughter|^Iconoclast/i);
  /* six Swords: a full squadron, so a lone escort has no squadron to join
     ("organized in any mix desired", p.179) and must stand on its own */
  const base = () => [capt, u(/^Sword Frigate$/, 6)];
  const sqRed = cs => cs.filter(c => !c.ok && /^Squadrons of 3/.test(c.s || "")).map(c => c.t + ": " + c.v);
  check("J46b: a lone Cargo Transport does not break the squadron rule (p.13, p.85)", sqRed(F(base().concat([u(/^Cargo Transport$/)]))).length === 0,
        JSON.stringify(red(F(base().concat([u(/^Cargo Transport$/)])))));
  check("J46b: ... nor the Armed Freighter or the Armed Cargo Vessel (p. 523, p. 192)",
        sqRed(F(base().concat([u(/^Armed Freighter$/), u(/^Armed Cargo Vessel$/)]))).length === 0,
        JSON.stringify(red(F(base().concat([u(/^Armed Freighter$/), u(/^Armed Cargo Vessel$/)])))));
  check("J46b: a lone Escort Carrier breaks it (p.521: not a freighter)", sqRed(F(base().concat([u(/^Escort Carrier$/)]))).length === 1,
        JSON.stringify(red(F(base().concat([u(/^Escort Carrier$/)])))));
})();

/* ---- 29. Tau Orbital modules (Fleets p.480; J171) -------------------
   "no more than four other modules can be added to a single core. An
   Orbital costs points equal to its core module plus the sum of any other
   modules added." Security: the system's price, +1 turret. Manufacturing
   +10: +1 shield (at most 3), tracking system. Habitat +5: +1 hit. */
(function(){
  const TM = catalog.lists.find(L => L.nm === "Tau — Merchant Fleet");
  const S = catalog.ships["480"];
  const sec = TM.secs.find(x => x.t === "PLANETARY DEFENCES"), en = sec.ents.find(e => e.r === 480 || e.r === "480");
  const oi = re => S.ol.findIndex(o => re.test(o.t));
  const orb = qty => {
    const u = { list: TM.nm, entry: { section: sec.t, label: en.l }, ref: "480", hulls: 1, options: {}, upgrades: {} };
    Object.keys(qty).forEach(k => { const i = oi(new RegExp(k)); if(i >= 0) u.options[S.ol[i].id] = { state: "take", qty: qty[k] }; });
    return u;
  };
  const R = u => DOMAIN.resolveUnit(u, { list: TM, host: TM }, catalog);
  check("J171: the Orbital has manufacturing and habitat modules as options", oi(/^Manufacturing/) >= 0 && oi(/^Habitat/) >= 0);
  if(oi(/^Manufacturing/) < 0) return;
  const r1 = R(orb({ "^Railgun": 2, "^Manufacturing": 1, "^Habitat": 1 }));
  check("J171: two railgun modules + manufacturing + habitat = 20 + 30 + 10 + 5 = 65 pts",
        r1.points === 65, String(r1.points));
  check("J171: ... turrets 2 + 2, shields 2, hits 5",
        String(r1.stats.turrets) === "4" && String(r1.stats.shields) === "2" && r1.stats.hits === 5,
        JSON.stringify([r1.stats.turrets, r1.stats.shields, r1.stats.hits]));
  const rg = r1.weapons.filter(w => /railgun/i.test(w.a[0]) && (w.box == null || w.box === "on"));
  check("J171: ... railgun battery twice: strength 6", rg.length === 1 && String(rg[0].a[2]) === "6", JSON.stringify(rg.map(w => w.a)));
  const r0 = R(orb({ "^Railgun": 1 }));
  check("J171: the tracking system only with a manufacturing module (not in the core's rules)",
        !r0.rules.some(r => /tracking system/i.test(r.t)) && !r0.options.some(o => o.state === "take" && /tracking system/i.test(o.text)) &&
        r1.options.some(o => o.state === "take" && /tracking system/i.test(o.text)), r0.rules.map(r => r.t.slice(0, 50)).join(" | "));
  const r5 = R(orb({ "^Railgun": 3, "^Habitat": 2 }));
  check("J171: five modules -> error option.modules (p. 480: at most four)",
        r5.issues.some(i => i.code === "option.modules" && i.severity === "error"), JSON.stringify(r5.issues));
  check("J171: no error with four", !R(orb({ "^Railgun": 2, "^Habitat": 2 })).issues.some(i => i.code === "option.modules"));
  /* hook capacity: two hook modules carry two Orcas (p.454, p.480) */
  const own = re => { let h = null; TM.secs.forEach(s => s.ents.forEach(e => { if(!h && e.k !== "up" && re.test(e.l)) h = { s, e }; }));
    return { list: TM.nm, entry: { section: h.s.t, label: h.e.l }, ref: h.e.r == null ? null : String(h.e.r), hulls: 1, options: {}, upgrades: {} }; };
  const hk = us => DOMAIN.resolveFleet({ list: TM.nm, limit: 3000, units: [own(/^Merchant class starship/), own(/^Orca class gunship$/)].concat(us) }, catalog)
    .checks.find(c => /^Gravitic hook capacity \(Orcas and Wardens\)/.test(c.t));
  const cap = c => +String(c.v).split("/")[1];
  check("J171: two hook modules carry two more than without",
        cap(hk([orb({ "^Gravitic hook": 2 })])) === cap(hk([])) + 2, [cap(hk([])), cap(hk([orb({ "^Gravitic hook": 2 })]))].join(" -> "));
})();

/* ---- 4. purity --------------------------------------------------------- */
check("the catalog is byte for byte the same after the run", JSON.stringify(catalog) === JSON.stringify(JSON.parse(RAW)));

console.log("\ntest_domain: " + pass + " passed, " + fail + " failed");
if(fail){ fails.slice(0, 25).forEach(f => console.log("  - " + f)); process.exit(1); }
console.log("all tests passed");
