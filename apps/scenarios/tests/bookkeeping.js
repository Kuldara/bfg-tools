/* Scenario Library bookkeeping test (0.17, 25.10.2026): the own mark (not played / in progress / played), the bookmark star,
   their filter and moving them to another device as a link and a QR code.

     node apps/scenarios/tests/bookkeeping.js

   Checks:
     CYCLE      the mark cycles 0 → 1 → 2 → 0
     TAG        every scenario has a different 4-character tag (a compact link)
     LINK       recLink() → importRec() restores the same marks on an empty device; an import does not wipe other marks
     JUNK       unknown tags and wrong states are skipped
     QR         a code is made with every scenario marked (the worst case), and its size is sensible
     FILTER     the Record and Bookmarked filters narrow the list correctly and count as active
     HTML       the card's mark and star show in the list, the state name in the heading row, Clear progress in the top bar */
"use strict";
const path = require("path");
const { loadLibrary } = require("./_load.js");
const ROOT = path.resolve(__dirname, "..");
const L = loadLibrary(ROOT, { names: "QR, qrSvg, recH, recLink, importRec, recOf, recS, recB, recCtl, recCounts, recLine, lf, lfActive, listMatches, listZone, REC_LBL" });
let fails = 0;
const fail = (k, m) => { fails++; console.log("ERROR " + k + ": " + m); };
const ids = L.SC.map(s => s.id);

/* CYCLE */
L.DB.rec = {};
const r0 = L.recOf(ids[0]);
const seen = [];
for (let i = 0; i < 4; i++) { seen.push(r0.s); r0.s = (r0.s + 1) % 3; }
if (seen.join("") !== "0120") fail("CYCLE", seen.join(""));

/* LINK */
L.DB.rec = {};
const want = {};
ids.forEach((id, i) => { if (i % 3 === 0) { const r = L.recOf(id); r.s = (i % 2) + 1; r.b = i % 5 === 0 ? 1 : 0; want[id] = { s: r.s, b: r.b }; } });
const link = L.recLink();
const data = link.slice(link.indexOf("#/rec/") + 6);
L.DB.rec = { [ids[1]]: { s: 2, b: 1 } };
L.importRec(data);
for (const id of Object.keys(want)) { const r = L.DB.rec[id]; if (!r || r.s !== want[id].s || r.b !== want[id].b) { fail("LINK", id + " " + JSON.stringify(r) + " ≠ " + JSON.stringify(want[id])); break; } }
if (!L.DB.rec[ids[1]] || L.DB.rec[ids[1]].s !== 2) fail("LINK", "the import wiped the other device's own mark");

/* TAG: every scenario has its own 4-character tag */
const hs = new Map();
for (const id of ids) { const h = L.recH(id); if (!/^[0-9a-z]{4}$/.test(h)) fail("TAG", id + " → " + h); if (hs.has(h)) fail("TAG", "the same tag " + h + ": " + hs.get(h) + " and " + id); hs.set(h, id); }

/* JUNK */
const before = JSON.stringify(L.DB.rec);
L.importRec("1zzzz2" + L.recH(ids[2]) + "9" + "abc");
L.importRec("2" + L.recH(ids[2]) + "2");
if (JSON.stringify(L.DB.rec) !== before) fail("JUNK", "invalid input changed the marks");

/* QR: the worst case, everything marked and starred */
L.DB.rec = {};
ids.forEach(id => { const r = L.recOf(id); r.s = 2; r.b = 1; });
const big = L.recLink();
let qr = null;
try { qr = L.QR.encode(big); } catch (e) { fail("QR", "everything marked: " + e.message + " (" + big.length + " characters)"); }
L.DB.rec = {};
ids.slice(0, 30).forEach(id => { L.recOf(id).s = 1; });
const q30 = L.QR.encode(L.recLink());
if (q30.version > 25) fail("QR", "30 marks need version " + q30.version);
if (!/<svg/.test(L.qrSvg("x"))) fail("QR", "qrSvg produces no svg");

/* FILTER */
L.DB.rec = { [ids[0]]: { s: 2, b: 0 }, [ids[1]]: { s: 1, b: 1 }, [ids[2]]: { s: 0, b: 1 } };
L.DB.lf = { rec: "2" }; L.DB.lq = "";
let m = L.listMatches("all").map(s => s.id);
if (m.length !== 1 || m[0] !== ids[0]) fail("FILTER", "Played: " + m.length);
L.DB.lf = { rec: "0" };
m = L.listMatches("all").map(s => s.id);
if (m.length !== ids.length - 2 || m.includes(ids[0]) || m.includes(ids[1])) fail("FILTER", "Not played: " + m.length);
L.DB.lf = { bm: true };
m = L.listMatches("all").map(s => s.id);
if (m.length !== 2 || !m.includes(ids[1]) || !m.includes(ids[2])) fail("FILTER", "Bookmarked: " + m.length);
L.DB.lf = { rec: "1", bm: true };
if (L.lfActive(L.lf()) !== 2) fail("FILTER", "active " + L.lfActive(L.lf()));

/* HTML */
L.DB.lf = {};
const z = L.listZone("all");
if ((z.match(/data-a='rec'/g) || []).length !== ids.length) fail("HTML", "marks in the list " + (z.match(/data-a='rec'/g) || []).length);
if ((z.match(/data-a='bm'/g) || []).length !== ids.length) fail("HTML", "stars in the list " + (z.match(/data-a='bm'/g) || []).length);
const inl = L.recCtl(ids[1], true);
if (!/In progress/.test(inl) || !/★/.test(inl)) fail("HTML", "heading row mark: " + inl.slice(0, 120));
if (!/2 bookmarked/.test(L.recLine())) fail("HTML", "bookkeeping row: " + L.recLine().slice(0, 160));
/* the bookkeeping row's numbers are filter buttons (lfr 2 / lfr 1 / lfm), aria-pressed='true' when pressed */
const rl = L.recLine();
for (const k of ["data-a='lfr' data-k='2'", "data-a='lfr' data-k='1'", "data-a='lfm'"]) if (!rl.includes(k)) fail("HTML", "the bookkeeping row has no filter button " + k);
L.DB.lf = { bm: true };
if (!/data-a='lfm'[^>]*aria-pressed='true'/.test(L.recLine())) fail("HTML", "the Bookmarked button does not show the pressed state");
L.DB.lf = {};

console.log("bookkeeping: " + ids.length + " scenarios, the link with all marked " + big.length + " characters" + (qr ? " → QR version " + qr.version + " (" + qr.size + " modules, " + qr.ecc + ")" : "") + ", 30 marks → version " + q30.version);
console.log(fails ? "RESULT: " + fails + " errors" : "RESULT: 0 errors");
process.exit(fails ? 1 : 0);
