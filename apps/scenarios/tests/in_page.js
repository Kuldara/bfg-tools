/* The Scenario Library's in-page tests, run from Node in a headless Chrome.

     node apps/scenarios/tests/in_page.js        (part of npm test; needs dist/)

   browser.js, content.js and maps.js are written to run inside the page: they
   use the page's names (window.SL) and the real layout engine (maps.js measures
   text with getBoundingClientRect). Until 26.10.2026 they were pasted into the
   DevTools console by hand. Here the built page is served, opened, and each
   file evaluated once the page has finished loading its last script (evaluated
   earlier, browser.js reported thousands of false errors). Each file returns a
   JSON string; the run fails on any error, warnings are printed. */
"use strict";
const fs = require("fs"), path = require("path"), http = require("http");
const { launch } = require("../../../tools/lib/chrome.js");

const DIST = path.resolve(__dirname, "..", "..", "..", "dist", "scenarios");
if (!fs.existsSync(path.join(DIST, "index.html"))) { console.error("dist/scenarios is missing: run npm run build"); process.exit(1); }
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".png": "image/png" };
function serve() {
  const srv = http.createServer((req, res) => {
    const p = decodeURIComponent(req.url.split("?")[0]);
    const file = path.join(DIST, p === "/" ? "index.html" : p);
    if (!file.startsWith(DIST) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { "content-type": TYPES[path.extname(file)] || "application/octet-stream" });
    res.end(fs.readFileSync(file));
  });
  return new Promise(ok => srv.listen(0, "127.0.0.1", () => ok(srv)));
}

/* each file in its own block: their top-level consts would otherwise clash */
const block = src => "{\n" + src + "\n}";

(async () => {
  const srv = await serve();
  const cd = await launch({ prefix: "scl-inpage-", args: ["--window-size=1280,900"] });
  let failed = false;
  try {
    await cd.send("Page.enable");
    await cd.send("Page.navigate", { url: "http://127.0.0.1:" + srv.address().port + "/index.html" });
    await cd.once("Page.loadEventFired");
    for (let k = 0; k < 50; k++) {
      if (await cd.evaluate("document.readyState === 'complete' && !!window.SL && SL.SC.length > 0")) break;
      await new Promise(r => setTimeout(r, 100));
    }
    for (const name of ["browser", "content", "maps"]) {
      const src = fs.readFileSync(path.join(__dirname, name + ".js"), "utf8");
      const t0 = Date.now();
      const r = JSON.parse(await cd.evaluate(block(src)));
      const secs = ((Date.now() - t0) / 1000).toFixed(1) + "s";
      if (name === "browser") {
        const ok = r.nerr === 0 && r.distinctTitles === r.n;
        failed = failed || !ok;
        console.log(`browser   ${ok ? "ok  " : "FAIL"} ${r.n} scenarios, ${r.views} views, ${r.distinctTitles} distinct titles, ${r.nerr} errors  ${secs}`);
        (r.errs || []).slice(0, 10).forEach(e => console.log("   " + e));
      } else {
        const ok = r.err === 0;
        failed = failed || !ok;
        console.log(`${name.padEnd(9)} ${ok ? "ok  " : "FAIL"} ${JSON.stringify(r.counts)} ${r.err} errors, ${r.warn} warnings  ${secs}`);
        (r.items || []).filter(x => x.startsWith("err")).slice(0, 10).forEach(e => console.log("   " + e));
      }
    }
  } finally { cd.close(); srv.close(); }
  console.log(failed ? "RESULT: errors" : "RESULT: 0 errors");
  process.exit(failed ? 1 : 0);
})().catch(e => { console.error(e.message); process.exit(1); });
