/* The page in a browser: seeded random walks through dist/boarding/index.html.

   test_engine.js and test_fuzz.js test the rules; this tests the interface
   around them. Each walk starts from an empty battle and clicks the page's own
   buttons, only on the topmost open layer (a sheet over the board), weighted
   towards building a battle and resolving it. Math.random is seeded, so a walk
   is the same every run; timers are recorded, not run. Every third walk then
   corrupts the saved battle and reloads the page, which runs load() and
   migrate() on it.

   Fails on: a script error, a walk with nothing left to click, or a walk set
   that no longer reaches the functions that resolve a boarding action (Chrome's
   coverage), so a change that cuts the page off from them does not pass quietly.

   node apps/boarding/test_page.js [walks] [steps]      (npm run build first) */
"use strict";
const fs = require("fs"), http = require("http"), path = require("path");
const { launch } = require("../../tools/lib/chrome.js");
const PAGE = path.join(__dirname, "..", "..", "dist", "boarding", "index.html");
const WALKS = +(process.argv[2] || 40), STEPS = +(process.argv[3] || 200);
/* reached by the default walks; each is a part of resolving an action */
const MUST_REACH = ["load", "migrate", "render", "pickFleet", "pickShip", "shipOpts", "showValue", "showMods",
  "doRoll", "showResult", "drawResult", "critBlock", "damageBlock", "applyResult", "showRef", "askReset"];

const INIT = `(function(){
  var q = new URLSearchParams(location.search), s = (+q.get("seed") || 1) >>> 0;
  Math.random = function(){ s = (s + 0x6D2B79F5) | 0; var t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  window.__timers = []; window.__errors = [];
  window.setTimeout = function(f, ms){ window.__timers.push(ms); return 0; };
  window.addEventListener("error", function(e){ window.__errors.push(String(e.message)); });
  if (!q.get("keep")) { try { localStorage.clear(); } catch(e){} }
})();`;

const WALK = (seed, steps) => `(() => {
  let w = (${seed} * 7919) >>> 0;
  const rnd = () => { w = (w + 0x6D2B79F5) | 0; let t = Math.imul(w ^ (w >>> 15), 1 | w);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const SEL = '[data-a],[data-die],[data-tab],[data-pick],[data-r],[data-dice],#refBtn,#resetAllBtn,#modeBtn,#swapBtn,#sheetClose,#sheetGear';
  const open = id => { const e = document.getElementById(id); return e && !e.hidden; };
  const wt = e => { const d = e.dataset;
    if (e.id === "sheetClose") return 0.25;
    if (["resetAllBtn", "swapBtn", "modeBtn", "refBtn", "sheetGear"].includes(e.id)) return 0.15;
    if (d.a === "roll") return 12;
    if (d.a === "resetSide" || d.a === "rm" || d.a === "clone") return 0.2;
    if (d.pick === "confirm") return 0.3;
    if (d.r === "close" || d.r === "undo") return 0.2;
    if (d.r) return 3;
    if (d.die !== undefined && d.die !== "") return 2;
    if (d.a === "fleet" || d.a === "ship" || d.a === "addship") return 1.5;
    return 1; };
  let clicks = 0, stuck = false;
  for (let i = 0; i < ${steps}; i++) {
    const layer = open("resultSheet") ? document.getElementById("resultSheet") : open("sheet") ? document.getElementById("sheet")
      : open("diceSheet") ? document.getElementById("diceSheet") : document.body;
    const c = [...layer.querySelectorAll(SEL)].filter(e => !e.disabled && e.getClientRects().length && !e.closest("[hidden]"));
    if (!c.length) { stuck = true; break; }
    const ws = c.map(wt); let x = rnd() * ws.reduce((s, v) => s + v, 0), j = 0;
    while (j < c.length - 1 && (x -= ws[j]) >= 0) j++;
    try { c[j].click(); } catch (e) { window.__errors.push("click: " + e.message); }
    clicks++;
  }
  return JSON.stringify({ clicks, stuck, errors: window.__errors });
})()`;

const CORRUPT = `(() => { try { const o = JSON.parse(localStorage.getItem("bfg-boarding-v1"));
  o.dice = "zzz"; o.round = 0; o.att.f = 999; o.def.other = "3"; o.att.dice6 = "bad";
  [...o.att.ships, ...o.def.ships].forEach((u, i) => { if (i % 2) u.tu = 50; else u.q = "7"; u.holo = "x"; u.dp = "2"; });
  o.def.ships.push(null, { n: 5 });
  localStorage.setItem("bfg-boarding-v1", JSON.stringify(o)); return "ok"; } catch (e) { return "none"; } })()`;

(async () => {
  if (!fs.existsSync(PAGE)) throw new Error(PAGE + " is missing: npm run build first");
  const html = fs.readFileSync(PAGE);
  const srv = http.createServer((req, res) => {
    if (req.url.split("?")[0] !== "/index.html") { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { "content-type": "text/html; charset=utf-8" }); res.end(html);
  });
  await new Promise(ok => srv.listen(0, "127.0.0.1", ok));
  const base = "http://127.0.0.1:" + srv.address().port + "/index.html";
  const cd = await launch({ prefix: "boarding-walk-", args: ["--window-size=412,915", "--force-device-scale-factor=1"] });
  const covered = new Set(), problems = [];
  let clicks = 0;
  try {
    await cd.send("Page.enable");
    await cd.send("Page.addScriptToEvaluateOnNewDocument", { source: INIT });
    await cd.send("Profiler.enable");
    await cd.send("Profiler.startPreciseCoverage", { callCount: true, detailed: false });
    /* the page has booted when it has published its state (window.S) */
    const go = async url => {
      const loaded = cd.once("Page.loadEventFired"); await cd.send("Page.navigate", { url }); await loaded;
      for (let i = 0; i < 100 && !(await cd.evaluate("!!window.S")); i++) await new Promise(r => setTimeout(r, 50));
      if (!(await cd.evaluate("!!window.S"))) problems.push(url.replace(/^.*\?/, "") + ": the page did not boot");
    };
    const walk = async (seed, steps) => {
      const r = JSON.parse(await cd.evaluate(WALK(seed, steps)));
      clicks += r.clicks;
      if (r.stuck) problems.push("walk " + seed + ": nothing to click after " + r.clicks + " clicks");
      for (const e of r.errors) problems.push("walk " + seed + ": " + e);
    };
    for (let seed = 1; seed <= WALKS; seed++) {
      await go(base + "?seed=" + seed);
      await walk(seed, STEPS);
      if (seed % 3 === 0 && await cd.evaluate(CORRUPT) === "ok") {
        await go(base + "?seed=" + (seed + 100000) + "&keep=1");
        await walk(seed + 100000, 40);
      }
      const c = await cd.send("Profiler.takePreciseCoverage");
      for (const sc of c.result) if (sc.url.startsWith(base))
        for (const f of sc.functions) if (f.functionName && f.ranges[0].count > 0) covered.add(f.functionName);
    }
  } finally { cd.close(); srv.close(); }
  const missed = MUST_REACH.filter(n => !covered.has(n));
  if (missed.length) problems.push("the walks no longer reach: " + missed.join(", "));
  console.log("walks " + WALKS + ", clicks " + clicks + ", functions reached " + covered.size + ", problems " + problems.length);
  for (const p of problems.slice(0, 20)) console.log("  " + p);
  console.log(problems.length ? "RESULT: FAILED" : "RESULT: 0 errors");
  process.exit(problems.length ? 1 : 0);
})().catch(e => { console.error(e.stack || e.message); process.exit(1); });
