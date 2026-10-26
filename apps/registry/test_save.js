/* Save recovery: does it survive lists and sections moving?

   A saved fleet refers to its list and section by number. When a list is
   added to the book or a section to the start of a list, the numbers move. Before 7.9.2026
   loading did not recognise a shifted save, emptied the fleet, and
   the next render saved the empty one over it - the user's work was lost.

   The test builds saves whose NAMES are right but INDEXES
   wrong, and requires that the fleet comes back. It also checks that a
   failed recovery does not overwrite the save.

   Run:  node test_save.js
*/
const fs = require("fs");
const path = require("path");

const el = () => ({
  textContent: "", innerHTML: "", value: "", className: "", dataset: {},
  querySelectorAll: () => [], appendChild(){}, onclick: null, onchange: null,
  oninput: null, style: {}, id: "", classList: { add(){}, remove(){} },
  setAttribute(){}, getAttribute: () => "", closest: () => el(), hidden: false,
});
global.document = {
  getElementById: id => id === "bfgdata"
    ? { textContent: fs.readFileSync(path.join(__dirname, "..", "..", "data", "bfg_data.json"), "utf8") }
    : el(),
  querySelector: () => el(), querySelectorAll: () => [], createElement: () => el(),
  head: { appendChild(){} },
  body: { appendChild(){}, removeChild(){}, dataset: {},
          classList: { add(){}, remove(){} } },
};
global.window = {}; global.navigator = {};
const store = {};
global.localStorage = { getItem: k => (k in store ? store[k] : null),
                        setItem: (k, v) => { store[k] = v; },
                        removeItem: k => { delete store[k]; } };
global.alert = () => {}; global.confirm = () => false;

/* The app's modules, loaded under the stubs above (test-support.js). */
const api = require(require("path").join(__dirname, "./test-support.js")).loadApp();
const { LISTS, load, save, setS, getS, KEY, switchList, getNote, setNote, entOf,
        unitPts, SHIPS, optState, optCount, DOMAIN } = api;

let pass = 0, fail = 0;
const check = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  console.log("  " + (ok ? "PASS" : "FAIL") + "  " + name +
              "  ->  " + JSON.stringify(got) +
              (ok ? "" : "   expected " + JSON.stringify(want)));
  ok ? pass++ : fail++;
};

/* Builds a save from the list name and the row names, and
   scrambles the indexes on purpose. */
function makeSave(listName, rows, { liShift = 0, secShift = 0 } = {}) {
  const li = LISTS.findIndex(L => L.nm === listName);
  const L0 = LISTS[li];
  const units = rows.map(([secName, entRe]) => {
    const si = L0.secs.findIndex(s => s.t === secName);
    const ei = L0.secs[si].ents.findIndex(e => entRe.test(e.l));
    if (ei < 0) throw new Error("no row " + entRe + " in section " + secName);
    return { s: si + secShift, e: ei, ref: L0.secs[si].ents[ei].r || null,
             n: 1, opts: [], name: "", el: L0.secs[si].ents[ei].l, sn: secName };
  });
  return JSON.stringify({ li: li + liShift, ln: listName, limit: 1500, units: units });
}

function restore(raw) {
  store[KEY] = raw;
  delete store[KEY + "-backup"];
  setS({ li: 0, limit: 1500, units: [] });
  setNote("");
  load();
  return getS();
}

console.log("Save recovery\n");

/* 1. section index shifted by one (exactly what inheriting the FLEET RULES
      block did to 19 lists) */
let raw = makeSave("Orks — Waaagh!",
  [["KROOZERS", /^Terror ship/], ["ESCORTS", /^Ravager/]], { secShift: -1 });
let S1 = restore(raw);
check("section shift: ships came back", S1.units.length, 2);
check("section shift: the right row", entOf(S1.units[0]).l, "Terror ship");
check("section shift: the right list", LISTS[S1.li].nm, "Orks — Waaagh!");

/* 2. list index shifted (a new list added earlier in the catalogue) */
raw = makeSave("Tau — Commerce Protection",
  [["ESCORTS", /^Defender/]], { liShift: -3 });
let S2 = restore(raw);
check("list shift: the right list", LISTS[S2.li].nm, "Tau — Commerce Protection");
check("list shift: ships came back", S2.units.length, 1);

/* 3. both shifted at once */
raw = makeSave("Tyranids — Hive Fleet",
  [["HIVE SHIPS", /^Hive ship/], ["ESCORTS", /^Kraken/]],
  { liShift: 2, secShift: 3 });
let S3 = restore(raw);
check("both shifts: ships came back", S3.units.length, 2);
check("both shifts: the right row", entOf(S3.units[1]).l, "Kraken");

/* 4. row moved to another section: search the whole list */
{
  const li = LISTS.findIndex(L => L.nm === "Necrons — Harvest Fleet");
  const L0 = LISTS[li];
  const si = L0.secs.findIndex(s => s.t === "Cruisers");
  const ei = L0.secs[si].ents.findIndex(e => /^Scythe/.test(e.l));
  const u = { s: 0, e: 0, ref: L0.secs[si].ents[ei].r, n: 1, opts: [], name: "",
              el: L0.secs[si].ents[ei].l, sn: "A section that does not exist" };
  raw = JSON.stringify({ li: li, ln: L0.nm, limit: 1500, units: [u] });
  const S4 = restore(raw);
  check("lost section: the row was found by name", S4.units.length, 1);
  check("lost section: the right section", LISTS[S4.li].secs[S4.units[0].s].t, "Cruisers");
}

/* 5. unknown row: the fleet does not empty completely and the save is not overwritten */
{
  const li = LISTS.findIndex(L => L.nm === "Orks — Cyclops Cluster");
  const L0 = LISTS[li];
  const si = L0.secs.findIndex(s => s.t === "KROOZERS");
  const good = { s: si, e: 0, ref: L0.secs[si].ents[0].r, n: 1, opts: [],
                 name: "", el: L0.secs[si].ents[0].l, sn: "KROOZERS" };
  const gone = { s: si, e: 99, ref: null, n: 1, opts: [], name: "",
                 el: "A ship that does not exist", sn: "KROOZERS" };
  raw = JSON.stringify({ li: li, ln: L0.nm, limit: 1500, units: [good, gone] });
  const S5 = restore(raw);
  check("unknown row: the known one stayed", S5.units.length, 1);
  check("unknown row: a backup was taken",
        store[KEY + "-backup"] === raw, true);
  check("unknown row: the user is told", getNote().length > 20, true);
}

/* 6. a completely unknown list: the save is not touched */
{
  raw = JSON.stringify({ li: 0, ln: "A list that does not exist", limit: 1500,
                         units: [{ s: 0, e: 0, ref: null, n: 1, opts: [],
                                   name: "", el: "x", sn: "y" }] });
  const S6 = restore(raw);
  check("unknown list: the fleet is empty", S6.units.length, 0);
  check("unknown list: a backup was taken",
        store[KEY + "-backup"] === raw, true);
}

/* 7. a save and load round trip keeps the upgrade choices */
{
  const li = LISTS.findIndex(L => L.nm === "Chaos — Black Crusade");
  const L0 = LISTS[li];
  const si = L0.secs.findIndex(s => s.t === "Cruisers");
  const u = { s: si, e: 0, ref: L0.secs[si].ents[0].r, n: 1, opts: [], name: "" };
  setS({ li: li, limit: 1500, units: [u] });
  /* An upgrade offered to THIS ship: a row without an
     attachment, or one whose attachment names this row. Recovery no longer
     offers upgrades that belong to others, and should not. */
  let upSi = -1, upEi = -1;
  L0.secs.forEach((sec, i) => sec.ents.forEach((en, j) => {
    if (upSi >= 0 || en.k !== "up") return;
    if (en.at && !en.at.some(p => p[0] === si && p[1] === 0)) return;
    upSi = i; upEi = j;
  }));
  if (upSi >= 0) {
    u.ups = {}; u.ups[upSi + ":" + upEi] = "take";
    save();
    const S7 = restore(store[KEY]);
    check("round trip: the upgrade stayed",
          S7.units[0].ups[upSi + ":" + upEi], "take");
  } else {
    console.log("  SKIPPED  round trip: no suitable upgrade row was found");
  }
}

/* 8. broken saves: each one protects the original and says so.
      Before 8.9.2026 these three ended in a silent return branch, and
      startup saved the empty default state over them. */
[["truncated JSON", '{"li":0,"ln":"x","units":[{"s":0,'],
 ["units missing", '{"li":0,"ln":"Chaos \u2014 Incursion","limit":1500}'],
 ["units:[null]", '{"li":0,"ln":"Chaos \u2014 Incursion","limit":1500,"units":[null]}']
].forEach(([nimi, bad]) => {
  const S8 = restore(bad);
  check(nimi + ": a backup was taken",
        store[KEY + "-backup"] === bad || store[KEY + "-backup-last"] === bad, true);
  check(nimi + ": the user is told", getNote().length > 20, true);
  check(nimi + ": the fleet is empty", S8.units.length, 0);
});

/* 9. the first backup is not overwritten by a later error */
{
  store[KEY + "-backup"] = "";
  delete store[KEY + "-backup"];
  const first = '{"li":0,"ln":"First","limit":1500,"units":[]}';
  store[KEY] = first; setS({ li:0, limit:1500, units:[] }); setNote(""); load();
  const second = '{"li":0,"ln":"Second","limit":1500,"units":[]}';
  store[KEY] = second; setS({ li:0, limit:1500, units:[] }); setNote(""); load();
  check("backup: the first one stayed", store[KEY + "-backup"], first);
  check("backup: the latest stored separately",
        store[KEY + "-backup-last"], second);
}

/* 10. a section is renamed: the purchase is still found by the row's name.
       Before the fix the Power Ram disappeared silently and the price dropped. */
{
  const li = LISTS.findIndex(L => L.nm === "Imperial Navy \u2014 Gothic Sector");
  const L0 = LISTS[li];
  let si = -1, ei = -1;
  L0.secs.forEach((sec, i) => sec.ents.forEach((en, j) => {
    if (si < 0 && en.r) { si = i; ei = j; }
  }));
  let usi = -1, uei = -1;
  L0.secs.forEach((sec, i) => sec.ents.forEach((en, j) => {
    if (usi >= 0 || en.k !== "up") return;
    if (en.at && !en.at.some(p => p[0] === si && p[1] === ei)) return;
    usi = i; uei = j;
  }));
  const upLabel = L0.secs[usi].ents[uei].l;
  const u = { s: si, e: ei, ref: L0.secs[si].ents[ei].r, n: 1, opts: [], name: "",
              el: L0.secs[si].ents[ei].l, sn: L0.secs[si].t,
              upn: {} };
  /* in the save the section's name differs from the current one */
  u.upn["A section that used to have another name\u0001" + upLabel] = "take";
  raw = JSON.stringify({ li: li, ln: L0.nm, limit: 1500, units: [u] });
  const S10 = restore(raw);
  check("section rename: the purchase stayed",
        S10.units[0].ups[usi + ":" + uei], "take");
}

/* 11. same version, same save: a purchase must not multiply.
       Review 8.9.2026: Chaos Lord + Mark of Khorne was 45 points,
       and reopening made it 65 - a same-named row in the Warmaster section
       grabbed the same saved choice through the fallback search. */
{
  const li = LISTS.findIndex(L => L.nm === "Chaos \u2014 Khorne");
  const L0 = LISTS[li];
  const lsi = L0.secs.findIndex(s => s.t === "Chaos Lords");
  const lei = L0.secs[lsi].ents.findIndex(e => /^Chaos Lord/.test(e.l));
  const mei = L0.secs[lsi].ents.findIndex(e => /Mark of Khorne/.test(e.l));
  const u = { s: lsi, e: lei, ref: null, n: 1, opts: [], name: "" };
  setS({ li: li, limit: 1500, units: [u] });
  u.ups = {}; u.ups[lsi + ":" + mei] = "take";
  const before = unitPts(u);
  save();
  const S11 = restore(store[KEY]);
  const after = unitPts(S11.units[0]);
  const marks = Object.keys(S11.units[0].ups || {})
    .filter(k => S11.units[0].ups[k] === "take").length;
  check("same version: the price stays", after, before);
  check("same version: the purchase does not multiply", marks, 1);
  check("same version: no false notice", getNote(), "");
}

/* 12. a failed recovery does not overwrite the original */
{
  const orig = '{"li":0,"ln":"A list that does not exist","limit":1500,"units":[]}';
  restore(orig);
  save();                                   /* like the render() at startup */
  check("failed recovery: the original stays", store[KEY], orig);
  /* when the player adds something, saving continues normally */
  const li = LISTS.findIndex(L => L.nm === "Chaos \u2014 Khorne");
  setS({ li: li, limit: 1500,
         units: [{ s: 1, e: 0, ref: null, n: 1, opts: [], name: "" }] });
  save();
  check("saving continues after an addition", store[KEY] !== orig, true);
}

/* 13. blocked storage reading does not crash startup */
{
  const real = global.localStorage;
  global.localStorage = { getItem(){ throw new Error("SecurityError"); },
                          setItem(){ throw new Error("SecurityError"); } };
  setS({ li: 0, limit: 1500, units: [] });
  setNote("");
  let threw = false;
  try { load(); } catch(e) { threw = true; }
  check("blocked storage: load does not throw", threw, false);
  check("blocked storage: the user is told", getNote().length > 20, true);
  global.localStorage = real;
}

/* 14. schema 2: ship options by ID (P1-8a, docs/save-format.md).
   The index is wrong on purpose and the ID right - a new version of the book moved
   options. Before: the wrong option at the right price, silently. */
{
  let f = null;
  for (const L of LISTS) {
    for (let si = 0; si < L.secs.length && !f; si++)
      for (let ei = 0; ei < L.secs[si].ents.length && !f; ei++) {
        const en = L.secs[si].ents[ei];
        if (en.k !== "unit" || !en.r || en.noopt) continue;
        const sh = SHIPS[String(en.r)];
        if (!sh || !sh.ol || sh.ol.length < 2) continue;
        const o = sh.ol[1];
        if (typeof o.c !== "number" || !o.c || o.dep != null || o.grp || o.qty) continue;
        if (sh.ol[0].c === o.c) continue;          /* the price must tell the rows apart */
        f = { L, si, ei, en, sh };
      }
    if (f) break;
  }
  check("schema 2: test ship found", !!f, true);
  const li = LISTS.indexOf(f.L), id1 = f.sh.ol[1].id;
  const mk = extra => JSON.stringify({ schemaVersion: 2, li, ln: f.L.nm, limit: 1500,
    units: [Object.assign({ s: f.si, e: f.ei, ref: f.en.r, n: 1, opts: [0], name: "",
                            sn: f.L.secs[f.si].t, el: f.en.l, os: { "0": "take" } }, extra)] });

  /* a) the ID matches, the index does not: the ID wins */
  const Sa = restore(mk({ oi: { [id1]: "take" }, on: { [id1]: DOMAIN.textKey(f.sh.ol[1].t) } }));
  check("schema 2: the ID beats the index", [optState(Sa.units[0], 0), optState(Sa.units[0], 1)], ["opt", "take"]);
  check("schema 2: the price follows option 1",
        unitPts(Sa.units[0]),
        unitPts({ s: f.si, e: f.ei, ref: f.en.r, n: 1, opts: [1], os: { "1": "take" }, name: "" }));
  check("schema 2: no notice when everything matched", getNote(), "");

  /* b) the ID does not match (the text was corrected), the 40-character text matches */
  const Sb = restore(mk({ oi: { "0:00000000": "take" }, on: { "0:00000000": DOMAIN.textKey(f.sh.ol[1].t) } }));
  check("schema 2: text as the fallback", optState(Sb.units[0], 1), "take");
  check("schema 2: text as the fallback - no notice", getNote(), "");

  /* c) neither matches: reported, backup, the ship stays */
  const Sc = restore(mk({ oi: { "0:00000000": "take" }, on: { "0:00000000": "Some option that is not there" } }));
  check("schema 2: unknown option - the ship stays", Sc.units.length, 1);
  check("schema 2: unknown option - no choice from the index", optState(Sc.units[0], 0), "opt");
  check("schema 2: unknown option - the user is told", getNote().includes("Some option that is not there"), true);
  check("schema 2: unknown option - backup", !!store[KEY + "-backup"], true);

  /* d) an old save (no schemaVersion): the index is accepted, and the next
        save writes version 2 with its IDs */
  const raw1 = JSON.stringify({ li, ln: f.L.nm, limit: 1500,
    units: [{ s: f.si, e: f.ei, ref: f.en.r, n: 1, opts: [1], name: "", sn: f.L.secs[f.si].t, el: f.en.l, os: { "1": "take" } }] });
  const Sd = restore(raw1);
  check("schema 1: the index is accepted", optState(Sd.units[0], 1), "take");
  save();
  const saved = JSON.parse(store[KEY]);
  check("schema 1 -> 4: version written", saved.schemaVersion, 4);
  check("schema 1 -> 2: oi written", saved.units[0].oi, { [id1]: "take" });
  check("schema 1 -> 2: on written", saved.units[0].on[id1], DOMAIN.textKey(f.sh.ol[1].t));
  check("schema 2: os/oq/ups/opts are not in the save (item 9)",
        ["os", "oq", "ups", "opts"].filter(k => k in saved.units[0]), []);
  const ALLOWED = ["s", "e", "ref", "n", "name", "sn", "el", "hn", "custom", "adj", "note", "members", "upsOpen", "oi", "oqi", "on", "upn", "lst", "role"];
  check("schema 2: the unit fields follow the schema",
        Object.keys(saved.units[0]).filter(k => !ALLOWED.includes(k)), []);
  check("schema 2: the document's top-level fields",
        Object.keys(saved).sort(), ["li", "limit", "ln", "schemaVersion", "units"]);
  check("schema 1: an old save is reported once", /older version/.test(getNote()), true);
  /* a newer schema: not halfway, but a backup and a notice */
  const raw3 = JSON.stringify({ schemaVersion: 99, li, ln: f.L.nm, limit: 1500, units: [{ s: f.si, e: f.ei, ref: f.en.r, n: 1, name: "", sn: f.L.secs[f.si].t, el: f.en.l }] });
  const S3 = restore(raw3);
  check("schema 99: not restored", S3.units.length, 0);
  check("schema 99: backup and notice", !!store[KEY + "-backup"] && /newer version/.test(getNote()), true);
}

/* 15. schema 2: the count of a repeatable option by ID */
{
  let f = null;
  for (const L of LISTS) {
    for (let si = 0; si < L.secs.length && !f; si++)
      for (let ei = 0; ei < L.secs[si].ents.length && !f; ei++) {
        const en = L.secs[si].ents[ei];
        if (en.k !== "unit" || !en.r || en.noopt) continue;
        const sh = SHIPS[String(en.r)];
        const qi = sh && sh.ol ? sh.ol.findIndex(o => o.qty && o.qty.max >= 2) : -1;
        if (qi < 0) continue;
        f = { L, si, ei, en, sh, qi };
      }
    if (f) break;
  }
  check("schema 2 count: test ship found", !!f, true);
  const li = LISTS.indexOf(f.L), id = f.sh.ol[f.qi].id;
  const raw = JSON.stringify({ schemaVersion: 2, li, ln: f.L.nm, limit: 1500,
    units: [{ s: f.si, e: f.ei, ref: f.en.r, n: 1, opts: [], name: "", sn: f.L.secs[f.si].t, el: f.en.l,
              os: {}, oq: { "0": 2 }, oi: { [id]: "take" }, oqi: { [id]: 2 }, on: { [id]: DOMAIN.textKey(f.sh.ol[f.qi].t) } }] });
  const Sq = restore(raw);
  check("schema 2 count: state by ID", optState(Sq.units[0], f.qi), "take");
  check("schema 2 count: count by ID", optCount(Sq.units[0], f.qi), 2);
  if (f.qi !== 0) check("schema 2 count: the wrong index does not leak", (Sq.units[0].oq || {})[0], undefined);
}

/* 16. schema 3: a borrowed ship survives in the save (1.1, Fleets p.14)
   A unit bought from another list carries its own list (lst) and its role
   (role). Without them the save would restore the host list's row from the same
   index: a different ship at a different price, silently. So besides measuring
   that the unit comes back, this also measures that IT DOES NOT COME BACK WRONG when the source list has
   disappeared. */
{
  const pick = L => {
    for (let si = 0; si < L.secs.length; si++)
      for (let ei = 0; ei < L.secs[si].ents.length; ei++) {
        const en = L.secs[si].ents[ei];
        if (en.k === "unit" && en.r && en.p != null) return { si, ei, en };
      }
    return null;
  };
  let host = null, donor = null;
  for (const L of LISTS) {
    const at = pick(L);
    if (!at) continue;
    if (!host) host = { L, at };
    else if (L.nm !== host.L.nm) { donor = { L, at }; break; }
  }
  check("schema 3: two lists found", !!(host && donor), true);

  const mkUnit = (at, extra) => Object.assign(
    { s: at.si, e: at.ei, ref: at.en.r, n: 1, opts: [], name: "" }, extra || {});

  /* a) A fleet of the own list still writes a unit shaped like schema 2. */
  setS({ li: LISTS.indexOf(host.L), limit: 1500, units: [mkUnit(host.at)] });
  setNote(""); save();
  const own = JSON.parse(store[KEY]);
  check("schema 3: a unit of the own list has no lst/role",
        ["lst", "role"].filter(k => k in own.units[0]), []);
  check("schema 4: version 4 in a one-list fleet too", own.schemaVersion, 4);

  /* b) A borrowed ship: the same row, price and role after the round trip. */
  const borrowed = mkUnit(donor.at, { lst: donor.L.nm, role: "ally" });
  setS({ li: LISTS.indexOf(host.L), limit: 1500,
         units: [mkUnit(host.at), borrowed] });
  const ptsBefore = unitPts(borrowed), labBefore = entOf(borrowed).l;
  setNote(""); save();
  const doc = JSON.parse(store[KEY]);
  check("schema 3: the borrowed ship's lst written", doc.units[1].lst, donor.L.nm);
  check("schema 3: the borrowed ship's role written", doc.units[1].role, "ally");
  check("schema 3: the borrowed ship's section is FROM THE SOURCE LIST",
        doc.units[1].sn, donor.L.secs[donor.at.si].t);
  const Sb = restore(store[KEY]);
  check("schema 3: both units came back", Sb.units.length, 2);
  check("schema 3: the borrowed ship remembers its list", Sb.units[1].lst, donor.L.nm);
  check("schema 3: the borrowed ship remembers its role", Sb.units[1].role, "ally");
  check("schema 3: the same row after the round trip", entOf(Sb.units[1]).l, labBefore);
  check("schema 3: the same price after the round trip", unitPts(Sb.units[1]), ptsBefore);
  check("schema 3: the own unit did not get a source list", Sb.units[0].lst, undefined);
  check("schema 3: a clean round trip reports nothing", getNote(), "");

  /* c) The source list is gone: the unit must NOT be restored as a host list row.
        This is the whole reason the field exists. */
  const gone = JSON.stringify({ schemaVersion: 3, li: LISTS.indexOf(host.L),
    ln: host.L.nm, limit: 1500,
    units: [mkUnit(host.at, { sn: host.L.secs[host.at.si].t, el: host.at.en.l }),
            mkUnit(donor.at, { sn: donor.L.secs[donor.at.si].t, el: donor.at.en.l,
                               lst: "No Such Fleet List", role: "reserve" })] });
  const Sc = restore(gone);
  check("schema 3: a lost source list does not restore the ship", Sc.units.length, 1);
  check("schema 3: the lost one is reported", getNote().length > 0, true);
  check("schema 3: the lost one took a backup", !!store[KEY + "-backup"], true);

  /* d) Schema 2 -> 3: an old one-list save is restored without roles. */
  const old2 = JSON.stringify({ schemaVersion: 2, li: LISTS.indexOf(host.L),
    ln: host.L.nm, limit: 1500,
    units: [mkUnit(host.at, { sn: host.L.secs[host.at.si].t, el: host.at.en.l })] });
  const Sd2 = restore(old2);
  check("schema 2 -> 3: the unit came back", Sd2.units.length, 1);
  check("schema 2 -> 3: the unit is a ship of the own list", Sd2.units[0].lst, undefined);
  check("schema 2 -> 3: no notice", getNote(), "");
}

/* 12. per-list memory (J146): switching lists does not lose the fleet, it
   is stashed under its own list's name and returns when the list is chosen again. The open
   fleet stays in `units`, the others are in `fleets` - so an old build still
   reads the fleet the player has open. */
{
  const pick = (L) => {
    for (let si = 0; si < L.secs.length; si++)
      for (let ei = 0; ei < L.secs[si].ents.length; ei++) {
        const en = L.secs[si].ents[ei];
        if (en.k === "unit" && en.r) return { si, ei, en };
      }
    return null;
  };
  const A = LISTS.find(L => L.nm === "Imperial Navy \u2014 Gothic Sector");
  const B = LISTS.find(L => L.nm === "Chaos \u2014 Nurgle");
  const a = pick(A), b = pick(B);
  const mk = at => ({ s: at.si, e: at.ei, ref: at.en.r, n: 1, opts: [], name: "" });

  setS({ li: LISTS.indexOf(A), limit: 1500, units: [mk(a)],
         stash: { [B.nm]: { units: [mk(b)], limit: 750 } } });
  setNote(""); save();
  const doc = JSON.parse(store[KEY]);
  check("stash: the open fleet is still in the units field", doc.units.length, 1);
  check("stash: the other list's fleet is in the fleets field",
        (doc.fleets || []).map(f => [f.ln, f.units.length]), [[B.nm, 1]]);
  /* The points limit belongs to the fleet: it feeds the legality panel, so
     the previous list's number would make the checks wrong. */
  check("stash: the fleet's own points limit is written", doc.fleets[0].limit, 750);
  /* A stashed fleet is saved with the rows of ITS OWN list even though another
     list is open: the same section index is a different ship on the other list, and without
     this it came back as the wrong ship from a row that looked right. */
  check("stash: the row is written with its own list's names",
        [doc.fleets[0].units[0].sn, doc.fleets[0].units[0].el],
        [B.secs[b.si].t, b.en.l]);
  const S1 = restore(store[KEY]);
  check("stash: the open fleet came back", S1.units.length, 1);
  check("stash: the other list's fleet came back to the right list",
        Object.keys(S1.stash || {}), [B.nm]);
  check("stash: the restored row is the same ship",
        B.secs[S1.stash[B.nm].units[0].s].ents[S1.stash[B.nm].units[0].e].l, b.en.l);
  check("stash: the points limit came back with the fleet", S1.stash[B.nm].limit, 750);
  check("stash: no notice", getNote(), "");

  /* An empty fleet is not stashed: otherwise the menu would say "0 pts" for a list
     the player only glanced at. */
  setS({ li: LISTS.indexOf(A), limit: 1500, units: [mk(a)], stash: { [B.nm]: { units: [], limit: 900 } } });
  setNote(""); save();
  check("stash: an empty fleet is not written", "fleets" in JSON.parse(store[KEY]), false);
  check("stash: the top-level fields of a one-list save unchanged",
        Object.keys(JSON.parse(store[KEY])).sort(), ["li", "limit", "ln", "schemaVersion", "units"]);

  /* A list that is no longer in the data: reported, not dropped silently. */
  const gone = JSON.stringify({ schemaVersion: 4, li: LISTS.indexOf(A), ln: A.nm, limit: 1500,
    units: [Object.assign(mk(a), { sn: A.secs[a.si].t, el: a.en.l })],
    fleets: [{ ln: "Imperial Navy \u2014 No Longer Exists",
               units: [Object.assign(mk(b), { sn: B.secs[b.si].t, el: b.en.l })] }] });
  const S2 = restore(gone);
  check("lost list: the open fleet came back anyway", S2.units.length, 1);
  check("lost list: nothing stashed", Object.keys(S2.stash || {}).length, 0);
  check("lost list: the user is told", /No Longer Exists|could not be restored/.test(getNote()), true);
  check("lost list: a backup was taken", store[KEY + "-backup"] === gone, true);

  /* Switching lists stashes the fleet and brings it back - the points limit too.
     The order matters: the fleet is stashed while S.li is still its own
     list, and S.li is set before the render, whose applyRequired resolves
     the upgrade rows through L() (J103). */
  setS({ li: LISTS.indexOf(A), limit: 1500, units: [mk(a)], stash: {} });
  switchList(LISTS.indexOf(B));
  const atB = { li: getS().li, units: getS().units.length, limit: getS().limit,
                kept: Object.keys(getS().stash) };
  getS().units.push(mk(b)); getS().limit = 750;
  switchList(LISTS.indexOf(A));
  const atA = { li: getS().li, units: getS().units.length, limit: getS().limit,
                keptPts: Object.keys(getS().stash) };
  switchList(LISTS.indexOf(B));
  const u0 = getS().units[0];
  const backB = { units: getS().units.length, limit: getS().limit,
                  row: u0 && B.secs[u0.s] ? (B.secs[u0.s].ents[u0.e] || {}).l : null };
  check("switch: A's fleet was stashed, B opens empty",
        [atB.li, atB.units, atB.kept], [LISTS.indexOf(B), 0, [A.nm]]);
  check("switch: returning to A brings back the fleet and the limit",
        [atA.units, atA.limit, atA.keptPts], [1, 1500, [B.nm]]);
  check("switch: B's fleet and its own limit come back",
        [backB.units, backB.limit, backB.row], [1, 750, b.en.l]);

  /* An old save without the fleets field opens as before. */
  const old = JSON.stringify({ schemaVersion: 3, li: LISTS.indexOf(A), ln: A.nm, limit: 1500,
    units: [Object.assign(mk(a), { sn: A.secs[a.si].t, el: a.en.l })] });
  const S3 = restore(old);
  check("schema 3 opens: the fleet came back", S3.units.length, 1);
  check("schema 3 opens: nothing stashed", Object.keys(S3.stash || {}).length, 0);
  check("schema 3 opens: no notice", getNote(), "");
}

/* --- export and import as a file (28.9.2026) ---------------------------
   The file is the same one-list save the browser keeps; an import goes
   through the same resolver (name first, index as the fallback, every missing one
   reported) and lands on the fleet's own list. */
{
  console.log("\nExport as a file");
  const { fleetDocument } = api;
  restore(makeSave("Orks \u2014 Waaagh!", [["KROOZERS", /^Terror ship/], ["ESCORTS", /^Ravager/]]));
  const doc = fleetDocument("Orks \u2014 Waaagh!");
  check("export: the file is a one-list save", [doc.app, doc.ln, doc.units.length, doc.schemaVersion],
        ["Gothic Fleet Registry fleet", "Orks \u2014 Waaagh!", 2, DOMAIN.SCHEMA_VERSION]);
  check("export: rows by name", doc.units.map(u => u.el), ["Terror ship", "Ravager attack ship"]);
  check("export: a list with no fleet is not exported", fleetDocument("Tau \u2014 Commerce Protection"), null);
}

/* --- named library: Save, Saved fleets, Import, link (J208) -----------
   The user 19.10.2026: fleets are saved separately by name, a QR code and
   a file add fleets to the library, and every list remembers its
   unsaved edits as before. A file or a link never
   replaces the fleet on the screen. */
const ASYNC = [];
{
  console.log("\nNamed library");
  const { libRead, saveOpenAs, libAdd, libAddText, libOpen, libDelete, libDocument, openUnsaved, KEY_LIB, packFleet, unpackFleet, QR, PHONE_LINK, phoneBase, openReceived, fleetDocument } = api;
  const empty = () => JSON.stringify({ li: 0, ln: LISTS[0].nm, limit: 1500, units: [] });
  const ORK = "Orks \u2014 Waaagh!", TAU = "Tau \u2014 Commerce Protection";
  delete store[KEY_LIB];
  restore(makeSave(ORK, [["KROOZERS", /^Terror ship/], ["ESCORTS", /^Ravager/]]));
  check("at first: nothing saved, the open fleet is unsaved", [libRead().saves.length, openUnsaved()], [0, true]);
  const a = saveOpenAs("Orks tournament");
  check("Save: into the library by name, with list and points", [libRead().saves.length, a.name, a.ln, a.units.length, a.pts > 0], [1, "Orks tournament", ORK, 2, true]);
  check("Save: the open fleet is now saved", openUnsaved(), false);
  /* an edit: one ship removed -> unsaved; Save updates the same one */
  getS().units.pop(); save();
  check("a change after saving shows", openUnsaved(), true);
  const a2 = saveOpenAs("Orks tournament");
  check("Save updates the same save", [libRead().saves.length, a2.id === a.id, a2.units.length], [1, true, 1]);
  const b = saveOpenAs("Orks tournament", true);
  check("Save as new: a second save, the name does not clash", [libRead().saves.length, b.name, b.id !== a.id], [2, "Orks tournament (2)", true]);
  /* another list: Tau into the library as a file, the Orks stay open for editing */
  const tau = JSON.parse(makeSave(TAU, [["ESCORTS", /^Defender/]]));
  let r = libAddText(JSON.stringify(Object.assign({ app: "Gothic Fleet Registry fleet", name: "Tau patrol" }, tau)), "file");
  check("Import: the file's fleet into the library with its name, the open fleet unchanged",
        [r.ids.length, libRead().saves[0].name, libRead().saves[0].from, LISTS[getS().li].nm, getS().units.length], [1, "Tau patrol", "file", ORK, 1]);
  r = libAddText(JSON.stringify(tau), "file");
  check("Import: the same fleet a second time does not come twice", [r.ids.length, /already/.test(r.notes.join(" "))], [0, true]);
  /* opening: nothing on the Tau list -> opens without asking */
  check("Open: opens on its own list", [libOpen(libRead().saves[0].id), LISTS[getS().li].nm, getS().units.length], [true, TAU, 1]);
  check("Open: the Orks' unsaved edit was stashed on its own list", (getS().stash[ORK] || { units: [] }).units.length, 1);
  /* opening when the list has an unsaved change: confirm() is false here -> not replaced */
  switchList(LISTS.findIndex(L => L.nm === ORK));
  getS().units.push(JSON.parse(JSON.stringify(getS().units[0]))); save();
  check("Open over an unsaved fleet without permission: not replaced", [libOpen(b.id), getS().units.length], [false, 2]);
  /* by names, not indexes: shifted indexes are restored */
  const skew = libRead().saves.filter(x => x.id === b.id)[0];
  const st = JSON.parse(store[KEY_LIB]); st.saves.forEach(x => { if(x.id === b.id) x.units.forEach(u => { u.s += 1; u.e += 2; }); }); store[KEY_LIB] = JSON.stringify(st);
  getS().units = []; save();
  check("Open with shifted indexes: rows by name", [libOpen(b.id), getS().units.map(u => entOf(u).l)], [true, ["Terror ship"]]);
  void skew;
  /* the link document: everything from the library, names included */
  const all = libDocument("all");
  check("All: every saved fleet in one document with names", [all.name, 1 + all.fleets.length, all.fleets.map(f => f.name)],
        ["Tau patrol", 3, ["Orks tournament (2)", "Orks tournament"]]);
  /* another device: an empty library takes the whole document */
  const before = store[KEY_LIB];
  delete store[KEY_LIB];
  r = libAdd(all, "link");
  check("link into an empty library: all three with names and in order", [r.ids.length, libRead().saves.map(x => x.name), libRead().saves[0].from],
        [3, ["Tau patrol", "Orks tournament (2)", "Orks tournament"], "link"]);
  store[KEY_LIB] = before;
  /* junk, a newer schema, an unknown list, a missing row */
  check("junk: reported, nothing added", [libAddText("{nope", "file").ids.length, /JSON/.test(libAddText("{nope", "file").notes[0])], [0, true]);
  check("no units: reported", /no fleet/.test(libAdd({ ln: ORK }, "file").notes[0]), true);
  check("newer schema: reported", /newer version/.test(libAdd({ schemaVersion: DOMAIN.SCHEMA_VERSION + 1, ln: ORK, units: [] }, "file").notes[0]), true);
  check("unknown list: reported", /not in this version/.test(libAdd({ ln: "A list that does not exist", units: [{ el: "x" }] }, "file").notes[0]), true);
  const part = JSON.parse(JSON.stringify(fleetDocument(ORK) || all.fleets[1]));
  part.units.push({ s: 0, e: 99, ref: null, n: 1, opts: [], name: "", el: "A ship that does not exist", sn: "KROOZERS" });
  part.name = "Missing row";
  r = libAdd(part, "file");
  check("missing row: the fleet comes and it is reported", [r.ids.length, /could not be matched/.test(r.notes.join(" "))], [1, true]);
  /* deleting touches only the library */
  const n0 = libRead().saves.length, units0 = getS().units.length;
  libDelete(r.ids[0]);
  check("Delete: out of the library, the edited fleet unchanged", [libRead().saves.length, getS().units.length], [n0 - 1, units0]);
  /* J236 (the user 25.10.2026: "To phone" should always open in the fleet
     builder; from there one can save if wanted and go on to the Play
     feature if wanted) */
  check("J236: from disk or localhost the link points to the published builder", phoneBase(), { url: PHONE_LINK.builder, remote: true });
  {
    const nLib = libRead().saves.length;
    const all = JSON.stringify(libDocument("all"));
    check("J236: a multi-fleet link does not open on screen (it goes to Saved fleets)", openReceived(all), false);
    /* one fleet for a list whose own fleet is saved or empty */
    const one = libRead().saves.filter(x => x.ln === TAU)[0];
    const doc = JSON.stringify({ name: "Tau from a link", ln: one.ln, limit: 1000, units: one.units });
    switchList(LISTS.findIndex(x => x.nm === TAU)); getS().units = []; save();
    check("J236: a single fleet opens on screen without saving", [openReceived(doc), LISTS[getS().li].nm, getS().units.length, getS().limit, libRead().saves.length],
          [true, TAU, one.units.length, 1000, nLib]);
    /* the list has its own unsaved fleet: not replaced, the link goes to the library */
    getS().units = getS().units.concat(getS().units); save();
    check("J236: an unsaved fleet is not replaced by a link", openReceived(JSON.stringify({ ln: one.ln, limit: 1500, units: one.units })), false);
  }
  /* a bigger QR (user 19.10.2026): from the Full screen button and a tap on the code */
  api.setPhone({ key: "x", url: "https://bfgtools.kuldare.com/play/x#fleet=abc", svg: "<svg></svg>", err: "", remote: false, n: 1 });
  const pph = api.phonePanelHTML();
  check("To phone panel has Full screen on the button and the code", [(pph.match(/data-qrfull/g) || []).length, /Full screen<\/button>/.test(pph), typeof api.qrFull], [2, true, "function"]);
  api.setPhone({ key: null });
  ASYNC.push(async () => {
    const doc = libDocument("all");
    const frag = await packFleet(doc);
    check("link: #fleet= and base64url", /^fleet=[A-Za-z0-9_-]+$/.test(frag), true);
    check("link: the same document when unpacked", JSON.parse(await unpackFleet(frag)), doc);
    const q = QR.encode(PHONE_LINK.play + "#" + frag);
    check("link: fits in a QR code", [q.size === q.version * 4 + 17, q.version <= 40], [true, true]);
  });
}

/* --- ranges in the catalogue and on the fleet row (29.9.2026) ------------------
   In the catalogue weapon line the range follows its group, with cm; a shared range
   once ("all 30 cm"). On the fleet row weapon by weapon: class, strength,
   range, arc. */
{
  console.log("\nRanges");
  const { rangeLabel, armLineHTML, weaponChipsHTML } = api;
  check("range: 30 cm", rangeLabel(["30 cm"]), "30 cm");
  check("range: nova 30-150 cm", rangeLabel(["30 \u2013 150 cm"]), "30\u2013150 cm");
  check("range: launch bays 25/30 cm", rangeLabel(["Fighta-Bommas: 25 cm / Assault Boats: 30 cm"]), "25/30 cm");
  check("range: repeats once", rangeLabel(["30 cm", "30 cm", "60 cm"]), "30/60 cm");
  const GO = LISTS.filter(L => L.nm === "Imperial Navy \u2014 Gothic Sector")[0];
  const ent = (secRe, entRe) => { const sec = GO.secs.filter(s => secRe.test(s.t))[0]; return sec.ents.filter(e => entRe.test(e.l))[0]; };
  const lun = ent(/^Cruisers$/i, /^Lunar/), ret = ent(/^Battleships$/i, /^Retribution/);
  const lh = armLineHTML(SHIPS[String(lun.r)], lun, GO), rh = armLineHTML(SHIPS[String(ret.r)], ret, GO);
  const pills = h => (h.match(/class="rng[^"]*">[^<]*</g) || []).map(x => x.replace(/^.*">/, "").replace(/<$/, ""));
  check("Lunar: one shared range", pills(lh), ["all 30 cm"]);
  check("Retribution: the range follows its group", pills(rh), ["60 cm", "60 cm", "30 cm"]);
  const tyr = ent(/^Cruisers$/i, /^Tyrant/);
  check("Tyrant: different ranges per strength", pills(armLineHTML(SHIPS[String(tyr.r)], tyr, GO)), ["45 cm", "30 cm", "30 cm"]);
  const cat = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "..", "data", "bfg_data.json"), "utf8"));
  const secR = GO.secs.filter(s => /^Battleships$/i.test(s.t))[0];
  const R = DOMAIN.resolveUnit({ schemaVersion: DOMAIN.SCHEMA_VERSION, role: "core",
    entry: { list: GO.nm, section: secR.t, label: ret.l }, ref: String(ret.r), hull: null, hulls: 1,
    name: "", note: "", adjust: 0, custom: null, members: [], options: {}, upgrades: {} }, { list: GO }, cat);
  const ch = weaponChipsHTML(R);
  const chips = (ch.match(/class="wchip"/g) || []).length;
  check("fleet row: the Retribution's WB 12 left+right in one chip, three chips", chips, 3);
  check("fleet row: ranges with cm and arcs as images (two for the WB)", [/>60 cm</.test(ch), />30 cm</.test(ch), (ch.match(/class="arcg"/g) || []).length], [true, true, 4]);
  const dic = ent(/^Cruisers$/i, /^Dictator/);
  const secC = GO.secs.filter(s => /^Cruisers$/i.test(s.t))[0];
  const RD = DOMAIN.resolveUnit({ schemaVersion: DOMAIN.SCHEMA_VERSION, role: "core",
    entry: { list: GO.nm, section: secC.t, label: dic.l }, ref: String(dic.r), hull: null, hulls: 1,
    name: "", note: "", adjust: 0, custom: null, members: [], options: {}, upgrades: {} }, { list: GO }, cat);
  const dh = weaponChipsHTML(RD);
  check("fleet row: the Dictator's bays as a sum of 4, three chips", [(dh.match(/class="wchip"/g) || []).length, /BAYS<\/b>4</.test(dh)], [3, true]);
}

/* --- order: moving a ship in the list (28.9.2026) ------------------------
   The order is the order of the roster, the cards and the play page; a move is saved. */
{
  console.log("\nMoving a ship");
  const { moveUnit } = api;
  restore(makeSave("Orks — Waaagh!", [["KROOZERS", /^Terror ship/], ["KROOZERS", /^Kill kroozer/], ["ESCORTS", /^Ravager/]]));
  const names = () => getS().units.map(u => entOf(u).l);
  check("start", names(), ["Terror ship", "Kill kroozer", "Ravager attack ship"]);
  check("move down: 0 -> 2", [moveUnit(0, 2), names()], [true, ["Kill kroozer", "Ravager attack ship", "Terror ship"]]);
  check("move up: 2 -> 0", [moveUnit(2, 0), names()], [true, ["Terror ship", "Kill kroozer", "Ravager attack ship"]]);
  check("the move is saved", JSON.parse(store[KEY]).units.map(u => u.el), ["Terror ship", "Kill kroozer", "Ravager attack ship"]);
  check("in place or outside the list: nothing", [moveUnit(1, 1), moveUnit(0, 3), moveUnit(-1, 0), names()], [false, false, false, ["Terror ship", "Kill kroozer", "Ravager attack ship"]]);
}


(async () => {
  for(const f of ASYNC){ try{ await f(); }catch(e){ console.log("  FAIL  " + String(e && e.stack || e).split("\n")[0]); fail++; } }
  console.log("\n" + (fail ? fail + " tests failed" : "all tests passed"));
  process.exit(fail ? 1 : 0);
})();
