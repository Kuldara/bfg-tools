/* The front page's maps on cards and names view (0.18, the discovery lab's ideas A and F) in Node.
   Run:  node apps/scenarios/tests/front.js   (Node, no browser; seconds)

     THUMB     every card on the All tab carries one map thumbnail, without labels or tap targets,
               and a thumbnail follows the table size
     CARDS     a card still leads to its scenario and keeps its mark and star
     NAMES     the names view lists every match once, in the cards' order; beside the list exactly
               one picture, of the remembered choice or else of the first name; under the names a
               picture only for a chosen name, right after it
     FALLBACK  a remembered choice that the category hides falls back to the first name
     VIEW      the count row offers Cards / Names, and the choice is what listZone draws
     PREVIEW   every scenario's picture renders without undefined / NaN and leads to its page */
"use strict";
const path = require("path");
const { loadLibrary } = require("./_load.js");
const DIR = path.join(__dirname, "..");
const L = loadLibrary(DIR, { names: "mapThumb, scPreview, namesZone, listZone, listMatches, listGroups, mapOf" });
let fails = 0;
const fail = (k, m) => { fails++; if (fails <= 40) console.log("ERROR " + k + ": " + m); };
const BAD = /undefined|NaN|\[object/;
const count = (h, re) => (h.match(re) || []).length;

/* THUMB */
L.DB = { cat: "all" };
const all = L.listZone("all"), cards = count(all, /class='card scard'/g), thumbs = all.match(/<div class='mapthumb[^>]*>[\s\S]*?<\/div>/g) || [];
if (cards !== L.SC.length) fail("THUMB", "cards " + cards + " != scenarios " + L.SC.length);
if (thumbs.length !== cards) fail("THUMB", "thumbnails " + thumbs.length + " != cards " + cards);
if (thumbs.some(t => /<text\b/.test(t))) fail("THUMB", "a thumbnail keeps its labels");
if (thumbs.some(t => /data-a=/.test(t))) fail("THUMB", "a thumbnail keeps the terrain's tap targets");
const noMap = thumbs.filter(t => /mapthumb none/.test(t)).length;
const withMap = L.SC.find(s => L.mapOf(s, s.variants ? s.variants[0][0] : "std").items.length);
const t1 = L.mapThumb(withMap);
L.DB = { cat: "all", table: { w: 120, h: 120 } };
if (L.mapThumb(withMap) === t1) fail("THUMB", withMap.id + ": the thumbnail ignores the table size");
L.DB = { cat: "all" };

/* CARDS */
for (const s of L.SC) {
  if (!all.includes("href='#/s/" + s.id + "/setup'")) fail("CARDS", s.id + " has no link to its page");
  if (!all.includes("data-a='rec' data-id='" + s.id + "'")) fail("CARDS", s.id + " has no mark");
}

/* NAMES */
const list = L.listMatches("all"), order = L.listGroups(list).flatMap(g => g[3]).map(s => s.id);
const ids = h => [...h.matchAll(/data-a='nsel' data-id='([^']+)'/g)].map(m => m[1]);
const opened = h => [...h.matchAll(/class='btn primary' href='#\/s\/([^/]+)\/setup'/g)].map(m => m[1]);
let h = L.namesZone(list, true);
if (ids(h).join() !== order.join()) fail("NAMES", "the names are not every match once in the cards' order");
if (opened(h).join() !== order[0]) fail("NAMES", "beside the list without a choice: " + opened(h).join() + ", expected the first name " + order[0]);
L.DB.lsel = order[5];
h = L.namesZone(list, true);
if (opened(h).join() !== order[5]) fail("NAMES", "beside the list: " + opened(h).join() + ", expected the chosen " + order[5]);
if (count(h, /aria-pressed='true'/g) !== 1 || !h.includes("data-id='" + order[5] + "' aria-pressed='true'")) fail("NAMES", "the chosen name is not the one pressed");
h = L.namesZone(list, false);
if (opened(h).join() !== order[5]) fail("NAMES", "under the names: " + opened(h).join() + ", expected the chosen " + order[5]);
const at = h.indexOf("data-id='" + order[5] + "'"), pic = h.indexOf("class='card previn'");
if (!(at >= 0 && pic > at && h.indexOf("data-a='nsel'", at + 1) > pic)) fail("NAMES", "the picture is not right under its name");
L.DB.lsel = "";
if (opened(L.namesZone(list, false)).length) fail("NAMES", "under the names without a choice a picture opened");

/* FALLBACK */
const core = L.listMatches("core"), first = L.listGroups(core).flatMap(g => g[3])[0];
L.DB.lsel = order.find(id => !core.some(s => s.id === id));
if (opened(L.namesZone(core, true)).join() !== first.id) fail("FALLBACK", "a hidden choice did not fall back to " + first.id);
if (opened(L.namesZone(core, false)).length) fail("FALLBACK", "under the names a hidden choice still opened");

/* VIEW */
L.DB = { cat: "core" };
let z = L.listZone("core");
if (!/data-a='lv' data-v='' aria-pressed='true'>Cards/.test(z) || count(z, /class='card scard'/g) !== core.length) fail("VIEW", "the default view is not Cards");
L.DB = { cat: "core", lv: "names" };
z = L.listZone("core");
if (!/data-a='lv' data-v='names' aria-pressed='true'>Names/.test(z) || ids(z).length !== core.length || count(z, /class='card scard'/g)) fail("VIEW", "Names does not draw the names view");

/* PREVIEW */
for (const s of L.SC) {
  let p = "";
  try { p = L.scPreview(s); } catch (e) { fail("PREVIEW", s.id + " threw: " + e.message); continue; }
  const m = p.match(BAD);
  if (m) fail("PREVIEW", s.id + ": " + p.slice(Math.max(0, m.index - 50), m.index + 30));
  if (!p.includes("href='#/s/" + s.id + "/setup'")) fail("PREVIEW", s.id + " does not lead to its page");
  if (!p.includes("data-a='rec' data-id='" + s.id + "'")) fail("PREVIEW", s.id + " has no mark");
}

console.log("front page: " + cards + " cards with map thumbnails (" + noMap + " without a map), names view over " + list.length + " scenarios");
console.log(fails ? "RESULT: " + fails + " errors" : "RESULT: 0 errors");
process.exit(fails ? 1 : 0);
