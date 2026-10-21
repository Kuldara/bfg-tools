/* Scenario Libraryn kuvakierros (20.10.2026): jokainen sivu kuvaksi ja
   asettelun tarkistus, puhelimella ja työpöydällä.

     node "scenario library/testit/kuvakierros.js" <ulos-kansio> [--vain-tarkistus]

   Kuvat (vain puhelin, 390 px, koko sivu) menevät ulos-kansioon käsin
   katsottaviksi; isoja, joten ulos-kansio scratchpadiin eikä F:lle.
   Raportti: <ulos>/asettelu.json.

   Sivut: etusivu (jokainen kategoria), Before the battle, Sub-plots, Sources ja
   jokaisen skenaarion neljä välilehteä; Set-up ja Play jokaisessa versiossa.

   Asettelutarkistukset (sivun sisällä, sovelluksen omalla DOMilla):
     HSCROLL  sivu vierii sivusuunnassa
     OUT      elementti menee näytön reunan yli (ei vierityssäiliön sisällä)
     CLIP     teksti leikkautuu (overflow hidden / ellipsis ja sisältö leveämpi)
     OVERLAP  flex- tai grid-rivin lapsielementit päällekkäin
     SCROLLROW sivuttain vieritettävä rivi, josta osa jää piiloon
     TEXT     undefined / NaN / [object / function näkyvissä

   Selain on erillinen headless-Chrome tyhjällä profiililla. Reitti asetetaan
   parseHash-ohituksella (kuten selaintesti.js), ei history-kutsuilla. */
"use strict";
const fs = require("fs"), path = require("path"), http = require("http"), os = require("os");
const { spawn } = require("child_process");
const ROOT = path.resolve(__dirname, "..");
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const OUT = process.argv[2];
const ONLY_CHECK = process.argv.includes("--vain-tarkistus");
const TERRAIN_ON = process.argv.includes("--maasto");
/* --vain=<alku>: vain skenaariot, joiden id alkaa näin (pilkuin useita), etusivut silti mukana */
const ONLY_IDS = (process.argv.find(a => a.startsWith("--vain=")) || "").slice(7).split(",").filter(Boolean);
if (!OUT) { console.error("anna ulos-kansio"); process.exit(2); }
fs.mkdirSync(OUT, { recursive: true });

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
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "scl-kierros-"));
  const proc = spawn(CHROME, ["--headless=new", "--remote-debugging-port=0", "--user-data-dir=" + dir, "--no-first-run",
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

/* sivun sisällä ajettava tarkistus; palauttaa [[laji, kuvaus], ...] */
const CHECK = `(() => {
  const vw = document.documentElement.clientWidth, out = [];
  const desc = el => (el.tagName.toLowerCase() + (el.className && typeof el.className === "string" ? "." + el.className.trim().split(/\\s+/).join(".") : "") + " \\"" + (el.textContent || "").trim().replace(/\\s+/g, " ").slice(0, 50) + "\\"");
  const vis = el => { const cs = getComputedStyle(el); return cs.display !== "none" && cs.visibility !== "hidden"; };
  const scroller = el => { for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) { const o = getComputedStyle(p).overflowX; if (o === "auto" || o === "scroll" || o === "hidden") return true; } return false; };
  if (document.documentElement.scrollWidth > vw + 1) out.push(["HSCROLL", "page is " + document.documentElement.scrollWidth + " px wide for " + vw]);
  const all = [...document.querySelectorAll("body *")].filter(el => !el.closest("svg") || el.tagName.toLowerCase() === "svg").filter(el => !el.closest("details.bfgt:not([open]) .bfgt-menu"));
  const outSet = new Set();
  for (const el of all) {
    if (!vis(el)) continue;
    const r = el.getBoundingClientRect(); if (r.width < 1 || r.height < 1) continue;
    if ((r.right > vw + 1 || r.left < -1) && !scroller(el)) { outSet.add(el); if (!el.parentElement || !outSet.has(el.parentElement)) out.push(["OUT", desc(el) + " to " + Math.round(r.left) + "…" + Math.round(r.right)]); }
    const cs = getComputedStyle(el);
    if ((cs.overflowX === "hidden" || cs.textOverflow === "ellipsis") && el.scrollWidth > el.clientWidth + 1 && el.textContent.trim()) out.push(["CLIP", desc(el) + " " + el.scrollWidth + ">" + el.clientWidth]);
  }
  for (const p of all) {
    const cs = getComputedStyle(p); if (!/flex|grid/.test(cs.display) || !vis(p)) continue;
    const kids = [...p.children].filter(k => vis(k) && getComputedStyle(k).position !== "absolute" && getComputedStyle(k).position !== "fixed").map(k => [k, k.getBoundingClientRect()]).filter(([, r]) => r.width > 0 && r.height > 0);
    for (let i = 0; i < kids.length; i++) for (let j = i + 1; j < kids.length; j++) {
      const a = kids[i][1], b = kids[j][1];
      const ox = Math.min(a.right, b.right) - Math.max(a.left, b.left), oy = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
      if (ox > 2 && oy > 2) out.push(["OVERLAP", desc(kids[i][0]) + " ⟷ " + desc(kids[j][0])]);
    }
  }
  /* sivuttain vieritettävä rivi, jonka osa jää piiloon (puhelimella ei näy, että lisää on) */
  for (const el of all) {
    if (!vis(el)) continue;
    const o = getComputedStyle(el).overflowX;
    if ((o === "auto" || o === "scroll") && el.scrollWidth > el.clientWidth + 2 && el.children.length > 1) out.push(["SCROLLROW", desc(el) + " " + el.scrollWidth + ">" + el.clientWidth]);
  }
  const txt = document.body.innerText, m = txt.match(/.{0,30}(undefined|NaN|\\[object|function \\(|=>).{0,30}/);
  if (m) out.push(["TEXT", m[0]]);
  return out;
})()`;

(async () => {
  const srv = await serve(), base = "http://127.0.0.1:" + srv.address().port + "/index.html";
  const cd = await chrome();
  const report = [];
  try {
    await cd.send("Page.enable");
    await cd.send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-color-scheme", value: "dark" }] });
    for (const [label, width, mobile, shots] of [["phone", 390, true, !ONLY_CHECK], ["desktop", 1200, false, false]]) {
      await cd.send("Emulation.setDeviceMetricsOverride", { width, height: 900, deviceScaleFactor: 1, mobile });
      const loaded = cd.once("Page.loadEventFired");
      await cd.send("Page.navigate", { url: base + "?k=" + Date.now() });
      await loaded; await sleep(400);
      /* --maasto (0.9): jokaiseen skenaarioon arvottu maasto, battlezonen säännöt ja loki auki */
      if (TERRAIN_ON) await cd.evaluate(`(() => { let k = 0; for (const sc of SC) { const st = stOf(sc); st.bz = { seed: 9000 + (k++) * 31, sel: "zone", log: true }; } save(); return 1; })()`);
      const routes = await cd.evaluate(`(() => {
        window.__R = null; const o = parseHash; parseHash = () => window.__R || o();
        const r = CATS.map(c => ["home-" + c[0], {view: "list"}, {cat: c[0]}]).concat([["home-filters", {view: "list"}, {cat: "all", fopen: true}], ["prep", {view: "prep"}, {lib: false}], ["prep-lib", {view: "prep"}, {lib: true}], ["home-filters-size", {view: "list"}, {cat: "all", fopen: true, size: "L"}], ["prep-lib-size", {view: "prep"}, {lib: true, size: "S"}], ["subplots", {view: "subplots"}], ["sources", {view: "sources"}]]);
        const only = ${JSON.stringify(ONLY_IDS)};
        for (const sc of SC) {
          if (only.length && !only.some(p => sc.id.startsWith(p))) continue;
          const vs = sc.variants ? sc.variants.map(x => x[0]) : [null];
          vs.forEach((v, i) => ["setup", "subplots", "play", "result"].forEach(tab => {
            if (i > 0 && (tab === "subplots" || tab === "result")) return;
            r.push([sc.id + "__" + tab + (v ? "__" + v : ""), {view: "sc", id: sc.id, tab}, {v: v}]);
          }));
        }
        return r; })()`);
      for (const [name, route, extra] of routes) {
        const issues = await cd.evaluate(`(() => {
          const ex = ${JSON.stringify(extra || {})};
          if (ex.cat) { DB.cat = ex.cat; DB.lq = ""; }
          DB.fopen = !!ex.fopen;
          if (ex.lib !== undefined) { if (!DB.prep) DB.prep = {}; DB.prep.bmode = ex.lib ? "lib" : "book"; }
          /* 0.12: kokosuodatin valittuna vain *-size-sivuilla */
          if (!DB.lf) DB.lf = {}; if (!DB.prep) DB.prep = {}; DB.lf.size = ex.size || ""; DB.prep.size = ex.size || "";
          window.__R = ${JSON.stringify(route)};
          if (window.__R.view === "sc") { const sc = SC.find(s => s.id === window.__R.id), st = stOf(sc); if (ex.v) st.v = ex.v; }
          render(false); window.scrollTo(0, 0);
          return ${CHECK}; })()`);
        report.push({ view: label, page: name, issues });
        if (issues.length) console.log(label, name, issues.length);
        if (shots) {
          const h = await cd.evaluate(`Math.ceil(document.documentElement.scrollHeight)`);
          await cd.send("Emulation.setDeviceMetricsOverride", { width, height: Math.min(h, 16000), deviceScaleFactor: 1, mobile });
          await sleep(120);
          const r = await cd.send("Page.captureScreenshot", { format: "png" });
          fs.writeFileSync(path.join(OUT, name + ".png"), Buffer.from(r.data, "base64"));
          await cd.send("Emulation.setDeviceMetricsOverride", { width, height: 900, deviceScaleFactor: 1, mobile });
        }
      }
    }
  } finally { cd.close(); srv.close(); }
  fs.writeFileSync(path.join(OUT, "asettelu.json"), JSON.stringify(report, null, 1));
  const n = report.reduce((a, r) => a + r.issues.length, 0);
  console.log("sivuja " + report.length + ", löydöksiä " + n);
})().catch(e => { console.error(e && e.stack || e); process.exit(1); });
