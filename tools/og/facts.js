/* What each app's link preview says: the title, the text and the numbers.

   A link pasted into Discord (or anywhere that reads Open Graph) shows the
   page's og:title, og:description and og:image. The text and the numbers on
   the image both come from here, counted from the repository's data, so the
   preview cannot say one thing while the page says another (until October
   2026 the Registry's image said 176 profiles when the data had 186).

   facts(id) -> { url, title, description, alt, head: [line, line], tagline,
                  stats: [{ n, label }], bullets: [...], books, accent }
   key(f)    -> the part of the facts the image shows; tools/og.js stores it
                next to og.png and `npm test` fails when it no longer matches. */
"use strict";
const fs = require("fs"), path = require("path");
const REPO = path.resolve(__dirname, "..", "..");
const read = p => fs.readFileSync(path.join(REPO, p), "utf8");
const appJson = id => JSON.parse(read("apps/" + id + "/app.json"));

/* "Fleets Book WiP v0.40 (...) and Rulebook v1.11 (...)" -> "Fleets v0.40 · Rulebook v1.11" */
function books() {
  const src = JSON.parse(read("data/bfg_data.json")).src;
  const fl = /Fleets[^v]*(v\d+\.\d+)/.exec(src), rb = /Rulebook\s+(v\d+\.\d+)/.exec(src);
  if (!fl || !rb) throw new Error("data/bfg_data.json src does not name the book versions: " + src);
  return "Fleets " + fl[1] + " · Rulebook " + rb[1];
}

function registry() {
  const n = require("../../apps/registry/counts.js").counts(JSON.parse(read("data/bfg_data.json")));
  return {
    head: ["GOTHIC FLEET", "REGISTRY"],
    tagline: "Fleet builder and printable ship cards",
    description: "Free fleet builder and printable ship cards for Battlefleet Gothic: Remastered. " +
      `${n.lists} fleet lists, ${n.profiles} ship profiles, ${n.cards} cards - one HTML file, no install, works offline.`,
    alt: `A printable Battlefleet Gothic ship card next to the numbers ${n.lists} fleet lists, ${n.profiles} profiles, ${n.cards} cards.`,
    stats: [{ n: n.lists, label: "fleet lists" }, { n: n.profiles, label: "profiles" }, { n: n.cards, label: "cards" }],
    bullets: ["free", "one HTML file", "no install", "works offline"],
    accent: "#D1792A",
  };
}

function play() {
  const n = require("../../apps/registry/counts.js").counts(JSON.parse(read("data/bfg_data.json")));
  return {
    head: ["GOTHIC FLEET", "PLAY"],
    tagline: "Your Registry fleet at the table, on your phone",
    description: "Play Battlefleet Gothic with the fleet you built in Gothic Fleet Registry: hits, criticals, " +
      "orders and braces recorded on your phone, rules derived from the book. Free, works offline.",
    alt: "A Battlefleet Gothic fleet in play on a phone: each ship's hits, criticals and orders.",
    stats: [{ n: n.lists, label: "fleet lists" }, { n: n.profiles, label: "ship profiles" }],
    bullets: ["hits and criticals", "orders and braces", "fleet by link or QR", "works offline"],
    accent: "#4C9BD6",
  };
}

/* the library's five tabs (src/prep.js POOL_SRC) from the scenario groups */
const TAB = g => g === "core" ? "core" : g === "campaign" || g === "fleets" ? "books" : g.startsWith("cl-") ? "classic"
  : g.startsWith("fan-") ? "fan" : "wr";
function scenarios() {
  const { loadLibrary } = require("../../apps/scenarios/tests/_load.js");
  const SC = loadLibrary(path.join(REPO, "apps", "scenarios")).SC;
  const t = { core: 0, books: 0, classic: 0, wr: 0, fan: 0 };
  for (const s of SC) t[TAB(s.grp)]++;
  return {
    head: ["SCENARIO", "LIBRARY"],
    tagline: "Every Battlefleet Gothic scenario, laid out for the table",
    description: `${SC.length} Battlefleet Gothic scenarios from the rulebook, the classic publications, Warp Rift and ` +
      "seven fan supplements, laid out for the table: set-up checklist, map, turn reminders, dice tables and a victory check.",
    alt: `Scenario cards with their table maps next to the numbers ${SC.length} scenarios, ${t.classic} classic, ${t.wr} from Warp Rift.`,
    stats: [{ n: SC.length, label: "scenarios" }, { n: t.classic, label: "classic GW" }, { n: t.wr, label: "Warp Rift" }],
    bullets: ["a map for your table", "set-up checklist", "turn reminders", "victory check"],
    accent: "#5FA36B",
  };
}

function boarding() {
  const s = JSON.parse(read("apps/boarding/src/ships.json"));
  const fleets = new Set(s.ships.map(x => x.f)).size;
  return {
    head: ["BOARDING", "ACTIONS"],
    tagline: "The whole End Phase boarding action, resolved by the book",
    description: "Battlefleet Gothic boarding actions resolved by the book: pick the two ships, roll or tap your own dice, " +
      `and get the result, criticals and all. ${s.ships.length} ships from ${fleets} fleets - one page, works offline.`,
    alt: `A Battlefleet Gothic boarding action resolved step by step, ${s.ships.length} ships from ${fleets} fleets.`,
    stats: [{ n: s.ships.length, label: "ships" }, { n: fleets, label: "fleets" }, { n: "1", label: "tap to resolve" }],
    bullets: ["the app rolls or you do", "every modifier shown", "criticals and all", "works offline"],
    accent: "#E0A93F",
  };
}

function terrain() {
  const BZ = new Function(require("../../packages/battlezone/index.js").asNamespace() + ";return BZ")();
  const zones = Object.keys(BZ.ZONES).length, kinds = Object.keys(BZ.KIND).length;
  return {
    head: ["BATTLEZONE", "GENERATOR"],
    tagline: "Celestial phenomena rolled by the book",
    description: "Rolls Battlefleet Gothic celestial phenomena by the rulebook Method 2, plots the table and gives the " +
      `in-play rules for what it rolled: ${zones} battlezones, ${kinds} kinds of phenomena, every die shown.`,
    alt: `A rolled Battlefleet Gothic table with its phenomena, ${zones} battlezones, ${kinds} kinds of phenomena.`,
    stats: [{ n: zones, label: "battlezones" }, { n: kinds, label: "kinds of phenomena" }],
    bullets: ["Rulebook Method 2", "any table size", "the rules for what it rolled", "a seed to share"],
    accent: "#E8A33D",
  };
}

const MAKERS = { registry, play, scenarios, boarding, terrain };
const APPS = Object.keys(MAKERS);

function facts(id) {
  const A = appJson(id);
  const f = MAKERS[id]();
  /* a site's address, or a page's (Play is a page inside the Registry's site:
     /play/ itself is a 404); the image is next to the page */
  f.id = id; f.title = A.name; f.books = books();
  f.url = /\.html$/.test(A.url) ? A.url : A.url.replace(/\/$/, "") + "/";
  f.image = f.url.replace(/[^/]*$/, "") + "og.png";
  return f;
}

/* what the image shows; the style is added by tools/og.js */
const key = f => ({ head: f.head, tagline: f.tagline, stats: f.stats, bullets: f.bullets, books: f.books });

module.exports = { APPS, facts, key };

if (require.main === module) for (const id of APPS) console.log(JSON.stringify(facts(id), null, 1));
