/* Wide screen meter (20.10.2026): a PC, a landscape tablet and a turned phone.

     node apps/scenarios/tests/wide_screens.js <out folder> [--full]

   Of every view the FIRST SCREENFUL is taken as a picture (what shows without
   scrolling) and measured:
     screens   page height / window height (how many screenfuls to scroll)
     width     the width the content uses / window width
     fold      which key parts show on the first screen (map, steps,
               turn track, tools, verdict) — the share of the element's height
   --full also takes a picture of the whole page. Serves the built site (npm run build first).
   Report: <out>/wide_screens.json and a table on the console. Model: screenshots.js. */
"use strict";
const fs = require("fs"), path = require("path"), http = require("http"), os = require("os");
const { spawn } = require("child_process");
const ROOT = path.resolve(__dirname, "..", "..", "..", "dist", "scenarios");
const CHROME = require("../../../tools/lib/chrome.js").findChrome();
const OUT = process.argv[2];
const FULL = process.argv.includes("--full");
if (!OUT) { console.error("give an out folder"); process.exit(2); }
if (!fs.existsSync(path.join(ROOT, "index.html"))) { console.error("not built: run npm run build first"); process.exit(2); }
fs.mkdirSync(OUT, { recursive: true });

const VIEWS = [
  ["lap1280", 1280, 720, false], ["lap1366", 1366, 768, false], ["pc", 1440, 900, false], ["lap1536", 1536, 864, false], ["pcwide", 1920, 1080, false],
  ["tablet", 1180, 820, true], ["phoneland", 844, 390, true], ["phone", 390, 844, true]
];
const PAGES = [
  ["home", { view: "list" }, { cat: "core" }],
  ["home-all", { view: "list" }, { cat: "all" }],
  ["prep", { view: "prep" }, {}],
  ["sources", { view: "sources" }, {}],
  ["cc-setup", { view: "sc", id: "cruiser-clash", tab: "setup" }, {}],
  ["ee-play", { view: "sc", id: "escalating-engagement", tab: "play" }, { turn: 3 }],
  ["pm-setup", { view: "sc", id: "cl-port-maw", tab: "setup" }, {}],
  ["pm-play", { view: "sc", id: "cl-port-maw", tab: "play" }, { turn: 3 }],
  ["pm-result", { view: "sc", id: "cl-port-maw", tab: "result" }, { w: { mines: 16, mlx: 1, over: true } }],
  ["kotol-setup", { view: "sc", id: "cl-kotol", tab: "setup" }, { v: "b5" }],
  ["cw-play", { view: "sc", id: "fl-craftworld-assault", tab: "play" }, { turn: 2 }],
  ["mobeel-setup", { view: "sc", id: "wr-mobeel-narrows", tab: "setup" }, {}],
  ["mobeel-play", { view: "sc", id: "wr-mobeel-narrows", tab: "play" }, { turn: 2 }],
  ["sp-subplots", { view: "sc", id: "fleet-engagement", tab: "subplots" }, {}]
];
/* the parts checked on the first screen (a CSS selector or a heading text) */
const FOLD = `(() => {
  const vh = innerHeight, out = {};
  const vis = el => { if (!el) return null; const r = el.getBoundingClientRect(); if (!r.height) return null; const a = Math.max(0, Math.min(r.bottom, vh) - Math.max(r.top, 0)); return Math.round(100 * a / Math.min(r.height, vh)); };
  const h2 = t => [...document.querySelectorAll("h2")].find(h => h.textContent.trim().toLowerCase().startsWith(t));
  out.map = vis(document.querySelector("#mapzone svg, .mapwrap svg"));
  out.steps = vis(h2("set-up, step by step"));
  out.track = vis(document.querySelector(".track"));
  out.thisturn = vis(document.querySelector(".turnnow, .now, .track + div"));
  out.rules = vis(h2("scenario rules in play"));
  out.tools = vis(h2("tools"));
  out.verdict = vis(document.querySelector(".verdict"));
  out.cards = document.querySelectorAll(".scard, .card").length ? vis(document.querySelector(".scard, .card")) : null;
  for (const k in out) if (out[k] === null) delete out[k];
  return out; })()`;

function serve(){
  const types = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".png": "image/png" };
  const srv = http.createServer((req, res) => {
    const rel = decodeURIComponent(req.url.split("?")[0].split("#")[0]).replace(/^\/+/, "");
    const file = path.resolve(ROOT, rel);
    if(!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()){ res.writeHead(404); res.end(); return; }
    res.writeHead(200, { "content-type": types[path.extname(file)] || "application/octet-stream" });
    res.end(fs.readFileSync(file));
  });
  return new Promise(ok => srv.listen(0, "127.0.0.1", () => ok(srv)));
}
async function chrome(){
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "scl-wide-"));
  const proc = spawn(CHROME, ["--headless=new", "--no-sandbox", "--remote-debugging-port=0", "--user-data-dir=" + dir, "--no-first-run",
    "--no-default-browser-check", "--disable-extensions", "--hide-scrollbars", "about:blank"], { stdio: "ignore" });
  const pf = path.join(dir, "DevToolsActivePort");
  let port = null;
  for(let k = 0; k < 100 && !port; k++){ await new Promise(r => setTimeout(r, 100)); if(fs.existsSync(pf)) port = fs.readFileSync(pf, "utf8").split("\n")[0].trim() || null; }
  const list = await (await fetch("http://127.0.0.1:" + port + "/json/list")).json();
  const ws = new WebSocket(list.find(t => t.type === "page").webSocketDebuggerUrl);
  await new Promise((ok, no) => { ws.onopen = ok; ws.onerror = no; });
  let id = 0; const wait = new Map(), on = new Map();
  ws.onmessage = m => { const d = JSON.parse(m.data);
    if(d.id && wait.has(d.id)){ const w = wait.get(d.id); wait.delete(d.id); d.error ? w.no(new Error(JSON.stringify(d.error))) : w.ok(d.result); }
    else if(d.method && on.has(d.method)){ const f = on.get(d.method); on.delete(d.method); f(d.params); } };
  const send = (method, params) => new Promise((ok, no) => { const k = ++id; wait.set(k, { ok, no }); ws.send(JSON.stringify({ id: k, method, params: params || {} })); });
  const once = method => new Promise(ok => on.set(method, ok));
  const evaluate = async expr => { const r = await send("Runtime.evaluate", { expression: expr, awaitPromise: true, returnByValue: true });
    if(r.exceptionDetails) throw new Error(r.exceptionDetails.exception ? r.exceptionDetails.exception.description : r.exceptionDetails.text); return r.result.value; };
  const close = () => { try{ ws.close(); }catch(e){} try{ proc.kill(); }catch(e){} setTimeout(() => { try{ fs.rmSync(dir, { recursive: true, force: true }); }catch(e){} }, 800); };
  return { send, once, evaluate, close };
}
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const srv = await serve(), base = "http://127.0.0.1:" + srv.address().port + "/index.html";
  const cd = await chrome();
  const report = [];
  try {
    await cd.send("Page.enable");
    await cd.send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-color-scheme", value: "dark" }] });
    for (const [vn, w, h, mobile] of VIEWS) {
      await cd.send("Emulation.setDeviceMetricsOverride", { width: w, height: h, deviceScaleFactor: 1, mobile });
      await cd.send("Emulation.setTouchEmulationEnabled", mobile ? { enabled: true, maxTouchPoints: 5 } : { enabled: false });
      const loaded = cd.once("Page.loadEventFired");
      await cd.send("Page.navigate", { url: base + "?k=" + Date.now() });
      await loaded; await sleep(400);
      await cd.evaluate(`(() => { window.__R = null; const o = parseHash; parseHash = () => window.__R || o(); localStorage.clear(); return true; })()`);
      for (const [pn, route, extra] of PAGES) {
        const m = await cd.evaluate(`(() => {
          const ex = ${JSON.stringify(extra)}, r = ${JSON.stringify(route)};
          DB.s = {}; DB.table = { p: "180x120", w: 180, h: 120 };
          if (ex.cat) { DB.cat = ex.cat; DB.lq = ""; }
          if (r.view === "sc") { const sc = SC.find(s => s.id === r.id), st = stOf(sc); if (ex.v) st.v = ex.v; if (ex.turn) st.turn = ex.turn; if (ex.w) Object.assign(st.w, ex.w); }
          window.__R = r; render(false); window.scrollTo(0, 0);
          const main = document.querySelector("main") || document.body, mr = main.getBoundingClientRect();
          let maxR = 0, minL = innerWidth; for (const el of main.querySelectorAll("*")) { const b = el.getBoundingClientRect(); if (b.width && b.height) { maxR = Math.max(maxR, b.right); minL = Math.min(minL, b.left); } }
          return { screens: +(document.documentElement.scrollHeight / innerHeight).toFixed(2), width: Math.round(100 * (maxR - minL) / innerWidth), fold: ${FOLD} };
        })()`);
        await sleep(150);
        const shot = await cd.send("Page.captureScreenshot", { format: "png" });
        fs.writeFileSync(path.join(OUT, vn + "__" + pn + ".png"), Buffer.from(shot.data, "base64"));
        if (FULL) {
          const fh = await cd.evaluate(`Math.ceil(document.documentElement.scrollHeight)`);
          await cd.send("Emulation.setDeviceMetricsOverride", { width: w, height: Math.min(fh, 12000), deviceScaleFactor: 1, mobile });
          await sleep(120);
          const s2 = await cd.send("Page.captureScreenshot", { format: "png" });
          fs.writeFileSync(path.join(OUT, vn + "__" + pn + "__full.png"), Buffer.from(s2.data, "base64"));
          await cd.send("Emulation.setDeviceMetricsOverride", { width: w, height: h, deviceScaleFactor: 1, mobile });
        }
        report.push(Object.assign({ view: vn, page: pn }, m));
      }
    }
  } finally { cd.close(); srv.close(); }
  fs.writeFileSync(path.join(OUT, "wide_screens.json"), JSON.stringify(report, null, 1));
  const pages = [...new Set(report.map(r => r.page))], views = [...new Set(report.map(r => r.view))];
  console.log("screenfuls (screens) / width % per page and view");
  console.log(["page".padEnd(14)].concat(views.map(v => v.padStart(13))).join(""));
  for (const p of pages) console.log([p.padEnd(14)].concat(views.map(v => { const r = report.find(x => x.view === v && x.page === p); return (r.screens + " / " + r.width + "%").padStart(13); })).join(""));
})().catch(e => { console.error(e && e.stack || e); process.exit(1); });
