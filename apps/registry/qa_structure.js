/* Structure check: integrity of references and edge cases.

   extractor/audit.py compares the data with the source PDFs and print_check.js
   the cards with the profiles. Neither checks the data's INTERNAL references - does an
   option point to an existing armament row, is every ship reachable
   from some list, does the squadron size calculation survive values outside
   its limits. This does.

   Run:  node qa_structure.js
*/
const fs = require("fs");
const path = require("path");

const el = () => ({
  textContent: "", innerHTML: "", value: "", className: "", dataset: {},
  querySelectorAll: () => [], appendChild(){}, onclick: null, onchange: null,
  oninput: null, style: {}, id: "", classList: { add(){}, remove(){} },
  setAttribute(){}, getAttribute: () => "", closest: () => el(),
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
                        setItem: (k, v) => { store[k] = v; } };
global.alert = () => {}; global.confirm = () => false;

/* The app's modules, loaded under the stubs above (test-support.js). */
const api = require(require("path").join(__dirname, "./test-support.js")).loadApp();

const { LISTS, SHIPS } = api;
const found = [];
let checks = 0;
const fail = (kind, msg) => found.push({ kind, msg });
const check = (cond, kind, msg) => { checks++; if(!cond) fail(kind, msg); return cond; };

/* ------------------------------------------ 1. integrity of references from lists */
const referenced = new Set();
LISTS.forEach(L => L.secs.forEach((sec, si) => sec.ents.forEach((en, ei) => {
  const at = L.nm + " / " + sec.t + " / " + (en.l || "?");
  if(en.r == null) return;
  const sh = SHIPS[String(en.r)];
  if(!check(!!sh, "reference", at + ": reference " + en.r + " does not point to a ship")) return;
  referenced.add(String(en.r));
  /* Price: either a number or an intentional null (entered by the user). */
  check(en.p == null || Number.isFinite(en.p),
        "price", at + ": price is not a number (" + en.p + ")");
  check(en.p == null || en.p >= 0, "price", at + ": negative price " + en.p);
})));

/* An orphan ship: in the data but not reachable through any list.
   Defence stations, orbitals, ground targets and transports are not
   fleet list rows but set by a scenario, so their
   absence is right. They are listed for information, not as findings. */
const SCENARIO_TYPES = /^(Defence|Ground)$/i;
const SCENARIO_NAMES = /TRANSPORT|ORBITAL|SPACE STATION|STAR FORT|FORTRESS|MONITOR|SYSTEM SHIP|AIR BASE|CARAVAN/i;
const orphanInfo = [];
Object.keys(SHIPS).forEach(k => {
  if(referenced.has(k)) return;
  const sh = SHIPS[k];
  const scenario = SCENARIO_TYPES.test(sh.ty || "") || SCENARIO_NAMES.test(sh.nm || "");
  if(scenario){ orphanInfo.push(k + " " + (sh.nm || "").slice(0, 44)); return; }
  check(false, "orpo",
        "ship " + k + " (" + (sh.nm || "?") + ", " + (sh.ty || "?") +
        ") is on no list and is not a scenario target");
});

/* --------------------------------------------- 2. the ship's own integrity */
/* A profile without armament rows is a finding - with one exception, which is
   named exactly: the Fire Ship, Fleets p.516. The book prints a type row for it
   (Escort/1, 15 cm, 45 degrees, 1, 5+, 1) and a SPECIAL block, but NO
   ARMAMENT table: "The controlling player can detonate a fire ship at
   any point in its movement phase" - the ship itself is the weapon. The exception is tied
   to the profile's page and name, and it expires visibly: if the profile
   gets a weapon row or stops being a rule card (rc), this fails. */
const NO_ARMAMENT = { "516": "FIRE SHIP" };
Object.entries(SHIPS).forEach(([k, sh]) => {
  const at = (sh.nm || k);
  check(!!sh.nm, "ship", k + ": name missing");
  if(NO_ARMAMENT[k]){
    check(sh.nm === NO_ARMAMENT[k] && sh.pg === 516 && Array.isArray(sh.aw) && sh.aw.length === 0 && !!sh.rc,
          "ship", at + ": the unarmed profile exception (Fleets p.516) no longer holds: the name, page, weapon rows or rc changed");
  }else{
    check(Array.isArray(sh.aw) && sh.aw.length > 0, "ship", at + ": no armament rows");
  }
  check(sh.pg != null, "ship", at + ": page reference missing");
  (sh.aw || []).forEach((a, i) => {
    check(Array.isArray(a) && a.length >= 4, "ship",
          at + ": weapon row " + i + " is incomplete");
    check(!!a[0], "ship", at + ": weapon row " + i + " has no name");
  });

  /* The options' references to armament rows. An index past the limits
     would drop a weapon silently or add an undefined row. */
  (sh.ol || []).forEach((o, i) => {
    const oat = at + " option " + i;
    check(typeof o.t === "string" && o.t.length > 0, "option", oat + ": text missing");
    check(o.c == null || Number.isFinite(o.c), "option", oat + ": price is not a number");
    (o.aws || []).forEach(r => check(r >= 0 && r < sh.aw.length, "option",
      oat + ": aws points to row " + r + ", there are rows: " + sh.aw.length));
    if(o.sw){
      (o.sw.f || []).forEach(r => check(r >= 0 && r < sh.aw.length, "option",
        oat + ": sw.f points to row " + r + ", there are rows: " + sh.aw.length));
      check(Array.isArray(o.sw.t) && o.sw.t.length > 0, "option",
        oat + ": sw.t is empty");
      (o.sw.t || []).forEach((row, j) => check(Array.isArray(row) && row.length >= 4,
        "option", oat + ": sw.t[" + j + "] is incomplete"));
    }
    if(o.dep != null)
      check(o.dep >= 0 && o.dep < (sh.ol || []).length, "option",
        oat + ": dep points to option " + o.dep + ", there are options: " + (sh.ol || []).length);
    if(o.gmax != null)
      check(o.gmax >= 1 && !!o.grp, "option",
        oat + ": gmax without a group or gmax < 1");
  });

  /* A critical table is built for every ship. */
  let cm = null;
  try{ cm = api.criticalModel(sh); }catch(e){ fail("critical", at + ": criticalModel threw: " + e.message); }
  if(cm){
    check(Array.isArray(cm.rows) && cm.rows.length > 0, "critical", at + ": no critical rows");
    check(!!cm.title, "critical", at + ": the critical table has no heading");
  }
});

/* -------------------------------- 3. squadron size calculation in edge cases */
/* Every unit bought N at a time on one card: escorts,
   one-hit defences (isEscort now reads the profile's sq flag: platforms,
   silos, air base - Rulebook p.100 "1HP defences grouped in up to six units")
   and hull-less count rows (Orbital mine p.512, Minefield p.513; the row's
   cnt flag), which have no upper limit in the user interface. */
let sqUnits = 0, sqDefence = 0, sqCounted = 0;
LISTS.forEach((L, li) => L.secs.forEach((sec, si) => sec.ents.forEach((en, ei) => {
  const counted = en.r == null && en.k === "unit" && !!en.cnt;
  if(!counted && (en.r == null || !SHIPS[String(en.r)])) return;
  const S = api.getS();
  S.li = li; S.limit = 3000; S.units = [];
  const u = { s: si, e: ei, ref: en.r || null, n: 1, opts: [], os: {}, name: "" };
  api.applyRequired(u);
  S.units.push(u);
  if(!counted && !api.isEscort(u)) return;
  sqUnits++;
  if(counted) sqCounted++;
  else if(SHIPS[String(en.r)].df) sqDefence++;
  const at = L.nm + " / " + (en.l || "?");
  /* Values outside the limits must not produce NaN or crash. */
  [-5, 0, 1, 6, 12, 99].forEach(n => {
    u.n = n;
    let hh, pts, h;
    try{ hh = api.hulls(u); pts = api.unitPts(u); h = api.cardHTML(u, "top"); }
    catch(e){ fail("squadron", at + " n=" + n + ": threw " + e.message); return; }
    check(Number.isFinite(hh), "squadron", at + " n=" + n + ": hulls is not a number");
    check(Number.isFinite(pts), "squadron", at + " n=" + n + ": points is not a number");
    check(!/undefined|NaN/.test(h), "squadron", at + " n=" + n + ": NaN/undefined on the card");
    check(typeof h === "string" && h.length > 400, "squadron", at + " n=" + n + ": the card stayed empty");
  });
})));
/* The loop must not skip the defences silently: if the flag or the rows disappear
   from the data, the counter drops to zero and this fails. */
check(sqDefence > 0, "squadron", "no defence squadron was visited (the sq flag or the df rows are missing)");
check(sqCounted > 0, "squadron", "no hull-less count row was visited (the cnt flag is missing)");

/* ------------------------------------- 4. special rules: the text is not cut */
Object.values(SHIPS).forEach(sh => {
  let lines = [];
  try{ lines = api.specialLines(sh); }catch(e){ fail("rule", sh.nm + ": specialLines threw"); }
  lines.forEach((r, i) => {
    check(typeof r.t === "string" && r.t.trim().length > 0, "rule",
      sh.nm + ": rule row " + i + " is empty");
    /* A cut sentence: ends in a word without punctuation and is long.
       A page reference ("...on p. 175") and a number are valid endings -
       the book ends a sentence on them without a full stop. */
    const tail = r.t.trim();
    const endsOk = /[.!?)\]:;]\s*$/.test(tail) ||
                   /\bp{1,2}\.?\s*\d+(?:\s*[-\u2013]\s*\d+)?\s*$/i.test(tail) ||
                   /\d\s*$/.test(tail);
    if(r.t.length > 60 && !endsOk)
      fail("rule", sh.nm + ": the rule row may be cut: ..." + tail.slice(-50));
  });
});

/* ------------------------------- 5. the same sentence twice in a section's text
   A section's text comes from two sources: the book extraction and hand-
   curated sentences. If a curated sentence is added to a section where
   the extraction already brought it, the player sees the same sentence twice
   in the "Check yourself" list and the manual counter is too large. This happened to
   the Bastion Fleets reserve section (p.39), and it was found only in a review.
   build_data.py's add_text() now prevents it; this makes sure it does. */
const textKey = t => String(t || "").toLowerCase()
  .replace(/[\u2018\u2019]/g, "'").replace(/[\u201c\u201d]/g, '"')
  .replace(/[\u2013\u2014\u2022]/g, " ")
  .replace(/i\.e\./g, "ie").replace(/e\.g\./g, "eg").replace(/pg\./g, "pg")
  .replace(/[^a-z0-9]+/g, " ").trim();
/* The book itself repeats the same sentence in the tyranid damage table (p.423:
   "The wreck moves 4D6 cm forward..." is on two different results). That is
   not an extraction fault, so it is allowed by name. */
const DUP_OK = [textKey("The wreck moves 4D6 cm forward in each of its subsequent Movement phases.")];
LISTS.forEach(L => {
  (L.secs || []).forEach(sec => {
    const txt = sec.text || [];
    const seen = new Map();
    txt.forEach((t, i) => {
      const k = textKey(t);
      if(k.length < 40 || DUP_OK.indexOf(k) >= 0) return;
      checks++;
      if(seen.has(k))
        fail("repeated text", L.nm + " / " + sec.t + ": text[" + seen.get(k) +
             "] and text[" + i + "] are the same sentence: " + String(t).slice(0, 60));
      else seen.set(k, i);
    });
    /* A curated sentence may be INSIDE an extracted row: the book's bullet list
       and the sentence after it often come from the extraction as one row. */
    txt.forEach((t, i) => {
      const ki = textKey(t);
      if(ki.length < 60) return;
      txt.forEach((u, j) => {
        if(i === j) return;
        const kj = textKey(u);
        if(kj.length < 60 || kj === ki || DUP_OK.indexOf(kj) >= 0) return;
        checks++;
        if(ki.indexOf(kj) >= 0)
          fail("repeated text", L.nm + " / " + sec.t + ": text[" + j +
               "] is contained in row text[" + i + "]: " + String(u).slice(0, 60));
      });
    });
  });
});

/* ------------------------------------------------------------------ report */
const byKind = {};
found.forEach(f => (byKind[f.kind] = byKind[f.kind] || []).push(f.msg));
Object.entries(byKind).sort((a, b) => b[1].length - a[1].length).forEach(([k, v]) => {
  console.log("\n== " + k + " (" + v.length + ") ==");
  v.slice(0, 12).forEach(m => console.log("   " + m));
  if(v.length > 12) console.log("   ... and " + (v.length - 12) + " more");
});
if(orphanInfo.length){
  console.log("\n-- scenario targets missing from the lists (expected, " +
              orphanInfo.length + " of them) --");
  orphanInfo.forEach(x => console.log("   " + x));
}
console.log("\nShips " + Object.keys(SHIPS).length + ", lists " + LISTS.length +
            ", checks " + checks + ", findings " + found.length);
process.exitCode = found.length ? 1 : 0;
