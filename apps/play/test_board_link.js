/* What a Registry fleet brings to a boarding action (apps/boarding/src/play-link.js),
   every list and every fleet.

   The expectations are read from the books at the pages named: Rulebook pp. 89-91
   and the Fleets pages beside each case. Ships come from the real catalogue through
   DOMAIN.resolveUnit, as Play resolves them, and the numbers from the real engine.

     node apps/play/test_board_link.js */
"use strict";
const fs = require("fs"), path = require("path");
const REPO = path.join(__dirname, "..", "..");
const esbuild = require("esbuild");
const DOMAIN = require(path.join(REPO, "packages", "rules", "domain.js"));
const B = require(path.join(REPO, "apps", "boarding", "src", "engine.js"));
const DATA = JSON.parse(fs.readFileSync(path.join(REPO, "data", "bfg_data.json"), "utf8"));
const BASE = JSON.parse(fs.readFileSync(path.join(REPO, "apps", "boarding", "src", "ships.json"), "utf8"));
const code = esbuild.buildSync({ entryPoints: [path.join(REPO, "apps", "boarding", "src", "play-link.js")], bundle: true, write: false, format: "cjs", platform: "node", logLevel: "silent" }).outputFiles[0].text;
const mod = { exports: {} }; new Function("module", "exports", code)(mod, mod.exports);
const { optsFromUnit, commanderOpts, crewOf, UPGRADE_OPTS, NO_BOARDING_EFFECT } = mod.exports;

let pass = 0, fail = 0;
function check(name, ok, detail){
  if(ok){ pass++; return; }
  fail++; console.log("  FAIL " + name + (detail !== undefined ? "  -- " + JSON.stringify(detail) : ""));
}
const list = re => { const L = DATA.lists.find(x => re.test(x.nm)); if(!L) throw new Error("no list " + re); return L; };
function find(L, sec, label){
  for(let s = 0; s < L.secs.length; s++){
    if(sec && !sec.test(L.secs[s].t)) continue;
    const e = L.secs[s].ents.findIndex(x => label.test(x.l || ""));
    if(e >= 0) return [s, e];
  }
  throw new Error(L.nm + ": no row " + label);
}
/* a unit as the builder's save has it, with these upgrade rows and ship options taken */
function unit(L, sec, label, n, ups, optRe){
  const [s, e] = find(L, sec, label), en = L.secs[s].ents[e];
  const ctx = { list: L, host: L };
  const u = { s: s, e: e, ref: en.r, n: n || 1, opts: [], os: {}, name: "", sn: L.secs[s].t, el: en.l };
  const it = DOMAIN.fromLegacyUnit(u, ctx, DATA);
  /* an upgrade row in the unit's own section first: a Mark is printed once for the
     Warmaster and once for the Lords */
  (ups || []).forEach(re => { const own = L.secs[s].ents.findIndex(x => x.k === "up" && re.test(x.l || ""));
    const [a, b] = own >= 0 ? [s, own] : find(L, null, re); it.upgrades[L.nm + "\u0001" + L.secs[a].t + "\u0001" + L.secs[a].ents[b].l] = 1; });
  let R = DOMAIN.resolveUnit(it, ctx, DATA);
  if(optRe){ const o = R.options.find(x => optRe.test(x.text)); if(!o) throw new Error("no option " + optRe); it.options[o.id] = { state: "take", qty: 1 }; R = DOMAIN.resolveUnit(it, ctx, DATA); }
  const bad = (R.issues || []).filter(x => x.severity === "error" && /upgrade|option/.test(x.code));
  if(bad.length) throw new Error(label + ": " + JSON.stringify(bad[0]));
  return R;
}
/* the engine's side for a unit, one ship per hull */
function side(R, cmds, listName, n){
  const row = crewOf(BASE, { list: R.entry.list, sec: R.entry.section, label: R.entry.label, ref: R.ref });
  const { opts } = optsFromUnit(R, cmds, listName);
  const all = opts.concat(row.fl || [], row.on || []);
  const hp = row.hp, ships = [];
  for(let i = 0; i < (n || 1); i++) ships.push({ name: row.n, hp: hp, dp: hp, turrets: row.tu, type: row.t, opts: all });
  return { race: BASE.fleets[row.f].race, ships: ships, blast: false, orders: false, other: 0 };
}
const modIds = s => s.mods.map(m => m.id).sort();

/* ------------------------------------------------- every row of every list */
let rows = 0;
for(const L of DATA.lists) L.secs.forEach(sec => sec.ents.forEach(en => {
  if(en.k !== "unit" || en.r == null || !DATA.ships[String(en.r)]) return;
  rows++;
  const row = crewOf(BASE, { list: L.nm, sec: sec.t, label: en.l, ref: en.r });
  check("crew found: " + L.nm + " / " + sec.t + " / " + en.l, !!row && row.full === DATA.ships[String(en.r)].nm);
}));
check("the lists have ship rows", rows > 500, rows);

/* -------------------------- nothing that matters to boarding goes unnoticed */
const RELEVANT = /board|goff|mark of|space marine|terminator|berzerk|aspect|talons|ghostship|ark of|honour guard|clan:/i;
const seen = new Set();
for(const L of DATA.lists) L.secs.forEach(sec => sec.ents.forEach(en => {
  if(en.k === "up" && RELEVANT.test(en.l || "")) seen.add(en.l);
  if(en.k === "cmd" && /abaddon|rath|inquisitor|warlord/i.test(en.l || "")){
    const c = commanderOpts([en.l], L.nm);
    check("commander classified: " + en.l, c.opts.length + c.hints.length > 0, en.l);
  }
}));
for(const s of Object.values(DATA.ships)) (s.ol || []).forEach(o => { if(/space marine|terminator|mega-armou?red|boarding part/i.test(o.t || "")) seen.add(o.t); });
seen.forEach(t => {
  const id = UPGRADE_OPTS.find(([re]) => re.test(t));
  check("upgrade classified: " + t, !!id || NO_BOARDING_EFFECT.test(t));
});

/* -------------------------------------------------------- the crews, FL pages */
const crew = (re, sec, label) => { const L = list(re), [s, e] = find(L, sec, label), en = L.secs[s].ents[e];
  return BASE.fleets[crewOf(BASE, { list: L.nm, sec: L.secs[s].t, label: en.l, ref: en.r }).f].race; };
check("an Explorator list's hull is a Mechanicus ship (p. 121)", crew(/Explorator/, null, /Lunar|Dictator|Gothic|Tyrant/) === "admech");
check("a Chaos renegade hull is Chaos (p. 232)", crew(/Incursion/, null, /Lunar|Tyrant|Gothic/) === "chaos");

/* ------------------------------- six Goff Grunts on an unhurt Dictator (the
   user's example, 1.11.2026): p. 390 counts a Grunt as 2 HP, p. 371 Goffs +1,
   Rulebook p. 90: Orks +1, higher value +1; Dictator 8 + 3 turrets */
const CLANZ = list(/Clanz/), GOTHIC = list(/Gothic Sector/);
const grunt = unit(CLANZ, /Tiddla/, /Grunt assault/, 6, [/^Clan: Goffs \(Black\)/]);
check("a clan on a tiddla comes along: Goffs", optsFromUnit(grunt, [], CLANZ.nm).opts.indexOf("goff") >= 0, optsFromUnit(grunt, [], CLANZ.nm));
const dict = unit(GOTHIC, null, /^Dictator/, 1);
const A6 = side(grunt, [], CLANZ.nm, 6), D1 = side(dict, [], GOTHIC.nm);
let p = B.prepare({ att: A6, def: D1, round: 1 });
check("six Grunts have boarding value 12 (p. 390)", p.att.value === 12, p.att.value);
check("a Dictator has 8 + 3 = 11", p.def.value === 11, p.def.value);
check("D6 + 3: higher value, Orks, Goffs", p.att.modSum === 3, p.att.mods);
p = B.prepare({ att: side(grunt, [], CLANZ.nm, 3), def: D1, round: 1 });
check("three in contact: value 6, no ratio, D6 + 2", p.att.value === 6 && p.att.modSum === 2, p.att.mods);
const zero = Object.assign({}, A6, { ships: A6.ships.map(s => Object.assign({}, s, { opts: s.opts.concat("clanzwarlord") })) });
p = B.prepare({ att: zero, def: D1, round: 1 });
check("the Warlord's once-a-game +2 on top (p. 374): D6 + 5", p.att.modSum === 5, p.att.mods);
check("a Clanz Warlord is offered, not spent by itself (p. 374)", commanderOpts(["Ork Warlord"], CLANZ.nm).hints[0] === "clanzwarlord" && !commanderOpts(["Ork Warlord"], CLANZ.nm).opts.length);
check("a Waaagh! Warlord doubles the value (p. 367)", commanderOpts(["Ork Warlord"], "Orks — Waaagh!").opts[0] === "warlord");

/* ------------------------------------------------------------ other fleets */
const KH = list(/Chaos — Incursion/);
const murder = unit(KH, null, /^Murder/, 1);
const lord = unit(KH, /^Chaos Lords$/, /Chaos Lord/, 1, [/^The Mark of Khorne/]);
const aboard = [{ label: lord.entry.label, R: lord }];
check("a Chaos Lord's Mark of Khorne works on his ship (p. 242)", optsFromUnit(murder, aboard, KH.nm).opts.indexOf("khorne") >= 0, lord.upgrades.filter(x => x.state !== "opt"));
p = B.prepare({ att: side(murder, aboard, KH.nm), def: side(dict, [], GOTHIC.nm), round: 1 });
check("Khorne doubles the value and Chaos gives +1 (Rulebook p. 90, p. 244)", p.att.value === 16 && modIds(p.att).indexOf("chaos") >= 0, [p.att.value, p.att.mods]);
const barge = unit(list(/Chaos — Incursion/), null, /Battle Barge/i, 1, null, /embark Chaos Space Marines/i);
check("a battle barge's Chaos Space Marines come along, +2 for +1 (p. 232)", optsFromUnit(barge, [], KH.nm).opts.indexOf("csm") >= 0);
check("Abaddon aboard (p. 241)", commanderOpts(["Abaddon (Ld 10)"], KH.nm).opts[0] === "abaddon");
check("an Ordo Malleus Lord aboard (p. 150)", commanderOpts(["Ordo Malleus Inquisitor Lord (Ld 10)"], "x").opts[0] === "inq_malleus");
check("an Inquisitor Lord of no named Ordo is asked", commanderOpts(["Inquisitor Lord (Ld 9)"], "x").hints[0] === "ordo");
check("Lord Admiral Rath aboard (p. 48)", commanderOpts(["Lord Admiral Rath (Ld10)"], "x").opts[0] === "rath");
const eld = list(/Eldar Corsairs — Gothic/);
const ecl = unit(eld, null, /^Eclipse/, 1);
const eRow = side(ecl, [], eld.nm);
check("an Eldar ship has its holofields (p. 305)", eRow.ships[0].opts.indexOf("holofields") >= 0);
const sm = list(/Codex Astartes/);
const smc = side(unit(sm, null, /Strike Cruiser/i, 1), [], sm.nm);
p = B.prepare({ att: smc, def: D1, round: 1 });
check("Space Marines +2 (Rulebook p. 90)", modIds(p.att).indexOf("marines") >= 0, p.att.mods);
const nid = list(/Hive Fleet/);
const hive = side(unit(nid, null, /Hive ship/i, 1), [], nid.nm);
p = B.prepare({ att: hive, def: D1, round: 1 });
check("Tyranids roll two dice and double (p. 420)", p.att.dice === 2 && p.att.pick === "high" && p.att.value === hive.ships[0].dp * 2, p.att);

console.log("RESULT: " + fail + " errors, " + pass + " checks");
process.exit(fail ? 1 : 0);
