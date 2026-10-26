/* Spot check: one card through the app's own path, next to the book's pages
 * (method: docs/history/registry/PISTOKOE.md, in Finnish).
 *
 *   node spot_check.js --seed 20260910           a random list row (deterministic)
 *   node spot_check.js --list "Rogue" --ship "Tyrant"   by name
 *   node spot_check.js ... --all                  all own options and the row's upgrades taken
 *   node spot_check.js ... --opt 2 --opt 5        options by index (take)
 *   node spot_check.js ... --up "Power Ram"       a list upgrade by name (take)
 *   node spot_check.js ... --hull "Mars"          a Venerable base hull by name
 *   node spot_check.js ... --n 4                  squadron size
 *   node spot_check.js ... --pages 96,97          extra book pages
 *   node spot_check.js ... --no-book              without the book's pages
 *   node spot_check.js --seed N --defences        also draw from planetary defences rows
 *                                                 (not by default: J175 f, see below)
 *   node spot_check.js ... --from "Gothic Sector" --role reserve
 *                                                 BORROWED SHIP (1.1): the row comes from the
 *                                                 --list/--seed list, the fleet is the --from list.
 *                                                 The output adds the fleet's check rows and marks
 *                                                 the upgrades that come from the host list.
 *
 * Output: (1) the resolved unit (points, stats, weapons with their state, options,
 * upgrades, rules, damage, critical, issues), (2) the card text as it
 * prints, (3) the book's pages: the profile page and the list page, plus --pages.
 * The comparison is done by hand: is something missing, extra, or contradictory?
 * A finding is recorded as a golden case (card_contains / card_lacks) BEFORE the fix.
 */
"use strict";
const fs = require("fs"), path = require("path");
const { execFileSync } = require("child_process");
const HERE = __dirname;
const argv = process.argv.slice(2);
const opt = (k, d) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : d; };
const opts = k => argv.map((a, i) => a === k ? argv[i + 1] : null).filter(x => x != null);
const has = k => argv.includes(k);

/* ---- the app in Node (the same stub as layout_check.js) ------------- */
const els = {};
const mk = () => ({ textContent: "", innerHTML: "", value: "", className: "", dataset: {}, style: {}, id: "", hidden: false,
  querySelectorAll: () => [], querySelector: () => null, appendChild(){}, removeChild(){}, addEventListener(){}, setAttribute(){}, getAttribute: () => "", closest: () => mk(), classList: { add(){}, remove(){}, toggle(){}, contains: () => false } });
const el = k => (els[k] || (els[k] = mk()));
global.document = { getElementById: id => id === "bfgdata" ? { textContent: fs.readFileSync(path.join(HERE, "..", "data", "bfg_data.json"), "utf8") } : el("#" + id),
  querySelector: s => el(s), querySelectorAll: () => [], createElement: () => mk(), head: { appendChild(){} }, body: { appendChild(){}, removeChild(){}, dataset: {}, classList: { add(){}, remove(){} } }, addEventListener(){} };
global.window = { addEventListener(){}, print(){}, matchMedia: () => ({ matches: false, addEventListener(){} }) };
if (!global.navigator) Object.defineProperty(global, "navigator", { value: {}, configurable: true });
global.alert = () => {}; global.confirm = () => true; global.localStorage = { getItem: () => null, setItem(){}, removeItem(){} };
/* The app's modules, loaded under the stubs above (test-support.js). */
const api = require(require("path").join(__dirname, "../apps/registry/test-support.js")).loadApp();

/* ---- choosing the row ------------------------------------------------ */
const rows = [];
/* J175 (f): on 8.10.2026 every list got a PLANETARY DEFENCES section, and its
   roughly 430 rows entered the draw population - old seeds pointed at
   different rows and the sample leaned towards defences. The default population is again
   the fleet list's rows (section kind "defence" left out); --defences takes
   the defences along. A search by name (--list/--ship) always finds them. */
const WITH_DEF = has("--defences") || !has("--seed");
api.LISTS.forEach((L, li) => L.secs.forEach((sec, si) => sec.ents.forEach((en, ei) => {
  if (!WITH_DEF && sec.ct === "defence") return;
  if (en.r || en.k === "cmd") rows.push({ li, si, ei, L, sec, en });
})));
let pick = null;
if (has("--seed")) {
  /* mulberry32: same seed, same row, on every machine */
  let a = (parseInt(opt("--seed"), 10) >>> 0) || 1;
  const rnd = () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  pick = rows[Math.floor(rnd() * rows.length)];
} else {
  const lf = opt("--list", ""), sf = opt("--ship", "");
  const cands = rows.filter(r => r.L.nm.toLowerCase().includes(lf.toLowerCase()) && r.en.l.toLowerCase().includes(sf.toLowerCase()));
  if (!cands.length) { console.error("no rows: --list %j --ship %j", lf, sf); process.exit(2); }
  if (cands.length > 1 && !(lf && sf)) {
    console.error("several rows, narrow down --list and --ship:");
    cands.slice(0, 30).forEach(r => console.error("  %s | %s | %s", r.L.nm, r.sec.t, r.en.l));
    process.exit(2);
  }
  pick = cands[0];
}

/* ---- the unit -------------------------------------------------------- */
const S = api.getS();
S.limit = 100000; S.units = [];
/* Borrowed ship: the fleet is the --from list, the row from the source list. S.li stays
   on the host all the time - the same contract as in the app. */
let host = null;
if (has("--from")) {
  const hf = opt("--from", "").toLowerCase();
  const hi = api.LISTS.findIndex(L => L.nm.toLowerCase().includes(hf));
  if (hi < 0) { console.error("host list not found: --from %j", hf); process.exit(2); }
  if (hi === pick.li) { console.error("--from is the row's own list; a borrowed ship needs another"); process.exit(2); }
  host = api.LISTS[hi];
  S.li = hi;
  api.addUnitFrom(pick.li, pick.si, pick.ei, opt("--role", "reserve"));
} else {
  S.li = pick.li;
  api.addUnit(pick.si, pick.ei);
}
const u = S.units[0];
if (!u) { console.error("addUnit produced no unit"); process.exit(2); }
if (has("--n")) u.n = parseInt(opt("--n"), 10) || u.n;
if (has("--hull")) {
  const hf = opt("--hull").toLowerCase();
  const sh0 = api.SHIPS[String(pick.en.r)];
  const ref = Object.keys(api.SHIPS).find(k => (api.SHIPS[k].nm || "").toLowerCase().includes(hf) && k !== String(pick.en.r));
  if (!ref) { console.error("hull not found: " + hf); process.exit(2); }
  try { api.setHull(u, +ref); } catch (e) { console.error("setHull: " + e.message); }
  void sh0;
}
const sh = api.SHIPS[String(u.ref != null ? u.ref : pick.en.r)];
if (has("--all") && sh) (sh.ol || []).forEach((o, i) => { try { api.setOptState(u, i, "take"); } catch (e) {} });
opts("--opt").forEach(i => { try { api.setOptState(u, parseInt(i, 10), "take"); } catch (e) { console.error("option " + i + ": " + e.message); } });
const ups = api.upgradesFor(u);
if (has("--all")) ups.own.forEach(x => { try { api.setUpState(u, x[0], x[1], "take"); } catch (e) {} });
opts("--up").forEach(name => {
  const all = ups.own.concat(ups.other);
  /* The row carries its name itself (x[2]); a list lookup by index crashed on the host's
     key (si >= 1000) - spot check 20, seed 2026091412. */
  const hit = all.find(x => String(x[2].l).toLowerCase().includes(name.toLowerCase()));
  if (!hit) { console.error("upgrade not found: " + name); return; }
  try { api.setUpState(u, hit[0], hit[1], "take"); } catch (e) { console.error("setUpState: " + e.message); }
});
const R = api.resolveUnit(u);

/* ---- output ---------------------------------------------------------- */
const line = (s) => console.log(s);
const sec = t => line("\n" + "#".repeat(8) + " " + t);
line("SPOT CHECK  " + pick.L.nm + " | " + pick.sec.t + " | " + pick.en.l + (sh ? "  (profile p." + sh.pg + ")" : "") + "  list p." + pick.L.pg);
sec("RESOLVED UNIT");
line("kind " + R.kind + "  class " + R.className + "  points " + R.points + "  maxPoints " + R.maxPoints +
     (R.entry ? "  entry " + JSON.stringify({ price: R.entry.price, openPrice: R.entry.openPrice, note: R.entry.note, badRef: R.entry.badRef, noopt: R.entry.noopt }) : ""));
if (R.stats) line("stats " + JSON.stringify(R.stats));
if (R.hull && R.hull.chosen) line("hull " + JSON.stringify({ chosen: R.hull.chosen, choices: (R.hull.choices || []).length }));
line("leadership " + JSON.stringify(R.leadership) + "  rerolls " + JSON.stringify(R.rerolls));
line("\nWEAPONS (state: on = in use, off = not chosen):");
(R.weapons || []).forEach(w => line("  [" + (w.state || "-") + "] " + (Array.isArray(w.a) ? w.a.join(" | ") : String(w.a)) +
  (w.alt ? "  ALT" : "") + (w.grp ? "  grp:" + w.grp : "") + (w.opt != null ? "  opt:" + w.opt : "") + (w.count ? "  x" + w.count : "") + (w.stars ? "  " + w.stars : "")));
line("\nOPTIONS:");
(R.options || []).forEach(o => line("  [" + o.state + "] " + o.index + ". " + o.text + "  (" + (o.cost == null ? "?" : o.cost) + ")" +
  (o.qty > 1 ? " x" + o.qty : "") + (o.group ? "  grp:" + o.group : "") + (o.dependsOn ? "  dep:" + o.dependsOn : "") + (o.blockedBy ? "  blocked:" + o.blockedBy : "")));
line("\nUPGRADES (offered):");
(R.upgrades || []).forEach(x => line("  [" + x.state + "] " + x.label + "  " + (x.cost == null ? "" : x.cost) + (x.per ? " /" + x.per : "") + "  " + (x.owner || "") + (x.required ? "  REQUIRED" : "") +
  (host && +String(x.key || "").split(":")[0] >= 1000 ? "  FROM HOST (" + host.nm + ")" : "") + (x.description ? "  - " + x.description : "")));
line("\nRULES ON CARD:");
(R.rules || []).forEach(r => line("  - " + (typeof r === "string" ? r : r.t)));
if (R.damage) line("\nDAMAGE: " + JSON.stringify({ crippledAt: R.damage.crippledAt, note: R.damage.note, trigger: R.damage.trigger, repair: R.damage.repair }));
if (R.damage && R.damage.critical) {
  line("CRITICAL " + R.damage.critical.title + ":");
  (R.damage.critical.rows || []).forEach(r => line("  " + JSON.stringify(r)));
  if (R.damage.critical.foot) line("  foot: " + R.damage.critical.foot);
}
if (R.members) line("\nMEMBERS: " + JSON.stringify(R.members));
if (R.issues && R.issues.length) { line("\nISSUES:"); R.issues.forEach(i => line("  " + i.severity + " " + i.code + ": " + i.message)); }
if (host) {
  line("\nBORROWED SHIP: role " + (u.role || "core") + ", source list " + (u.lst || "-") + ", fleet " + host.nm);
  line("FLEET CHECKS (resolveFleet, only this one ship in the fleet):");
  api.checks().forEach(c => line("  " + (c.ok ? "ok " : "RED") + "  " + c.t + " = " + c.v + (c.s ? "   <- " + String(c.s).slice(0, 90) : "")));
}

sec("CARD TEXT (cardHTML)");
const card = api.cardHTML(u, "a");
const text = card
  .replace(/<\/(h3|h4|p|li|tr|div)>/g, "\n").replace(/<br\s*\/?>/g, "\n")
  .replace(/<td[^>]*>/g, " | ").replace(/<span class="c">/g, "  ")
  .replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&middot;/g, "·").replace(/&ndash;/g, "–")
  .replace(/&mdash;/g, "—").replace(/&rarr;/g, "→").replace(/&nbsp;/g, " ").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
  .replace(/&#(\d+);/g, (m, n) => String.fromCharCode(+n))
  .split("\n").map(s => s.replace(/\s+/g, " ").trim()).filter(Boolean).join("\n");
line(text);

if (!has("--no-book")) {
  sec("BOOK");
  const pages = [];
  if (sh && sh.pg) pages.push(String(sh.pg));
  if (pick.L.pg) pages.push(String(pick.L.pg));
  if (host && host.pg) pages.push(String(host.pg));
  opts("--pages").forEach(p => p.split(",").forEach(x => pages.push(x.trim())));
  const uniq = [...new Set(pages)];
  try {
    const out = execFileSync("python", [path.join(HERE, "pdf_text.py")].concat(uniq), { encoding: "utf8", maxBuffer: 1 << 24 });
    line(out);
  } catch (e) { line("(pdf_text.py failed: " + (e.message || e) + ")"); }
}
