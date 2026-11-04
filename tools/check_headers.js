/* Every published site works under its own HTTP headers.

   Serves each built site (dist/<app>) the way Cloudflare does: the files,
   with the headers its _headers file gives them. Opens the page in headless
   Chrome, walks a few views, and fails on any Content-Security-Policy
   violation: a policy that blocks something the page needs breaks the site
   only once it is live, where no test runs.

   A font or a link that needs the network (the Battlezone Generator's Google
   Fonts) is not a violation when the network is missing; only a blocked one is.

   node tools/check_headers.js        (npm run build first) */
"use strict";
const fs = require("fs"), path = require("path"), http = require("http");
const { DIST } = require("./lib/kit.js");
const { launch } = require("./lib/chrome.js");

const TYPES = { ".html": "text/html", ".js": "text/javascript", ".json": "application/json", ".png": "image/png",
  ".css": "text/css", ".svg": "image/svg+xml", ".webmanifest": "application/manifest+json", ".xlsx": "application/octet-stream",
  ".zip": "application/zip", ".sqlite": "application/octet-stream", ".csv": "text/csv" };

/* the sites, and what to do on each page once it has loaded */
const SITES = {
  registry: { pages: ["/", "/play/Gothic%20Fleet%20Play.html", "/send/index.html"] },
  scenarios: { pages: ["/"], walk: `(async () => { location.hash = "#/s/" + SL.SC[0].id; await new Promise(r => setTimeout(r, 400));
    for (const t of ["setup", "play", "result"]) { const a = document.querySelector('[href$="/' + t + '"]'); if (a) { a.click(); await new Promise(r => setTimeout(r, 200)); } } return true; })()` },
  boarding: { pages: ["/"], walk: `(async () => { const b = document.querySelector("[data-dice]") || document.querySelector("button"); if (b) b.click(); await new Promise(r => setTimeout(r, 300)); return true; })()` },
  terrain: { pages: ["/"], walk: `(async () => { const b = [...document.querySelectorAll("button")].find(x => /roll/i.test(x.textContent)); if (b) b.click(); await new Promise(r => setTimeout(r, 400)); return true; })()` },
  almanac: { pages: ["/"] },
};

/* _headers: "path pattern" lines, then indented "Name: value" lines */
function parseHeaders(text) {
  const rules = [];
  let cur = null;
  for (const line of text.split(/\r?\n/)) {
    if (!line.trim()) continue;
    if (!/^\s/.test(line)) { cur = { pattern: line.trim(), headers: [] }; rules.push(cur); continue; }
    const m = /^\s+([^:]+):\s*(.*)$/.exec(line);
    if (m && cur) cur.headers.push([m[1].trim(), m[2].trim()]);
  }
  return rules;
}
const matches = (pattern, p) => pattern.endsWith("*") ? p.startsWith(pattern.slice(0, -1)) : p === pattern;

function serve(dir) {
  const hp = path.join(dir, "_headers");
  const rules = fs.existsSync(hp) ? parseHeaders(fs.readFileSync(hp, "utf8")) : [];
  const srv = http.createServer((req, res) => {
    let p = decodeURIComponent(req.url.split(/[?#]/)[0]);
    let file = path.join(dir, p);
    if (p.endsWith("/")) file = path.join(file, "index.html");
    if (!file.startsWith(dir) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); res.end(); return; }
    const head = { "content-type": TYPES[path.extname(file)] || "application/octet-stream" };
    for (const r of rules) if (matches(r.pattern, p)) for (const [k, v] of r.headers) head[k.toLowerCase()] = v;
    res.writeHead(200, head);
    res.end(fs.readFileSync(file));
  });
  return new Promise(ok => srv.listen(0, "127.0.0.1", () => ok(srv)));
}

(async () => {
  const problems = [];
  let checked = 0;
  const cd = await launch({ prefix: "headers-", args: ["--window-size=1300,900"] });
  try {
    await cd.send("Page.enable");
    await cd.send("Log.enable");
    await cd.send("Runtime.enable");
    /* a violation reaches the page as an event; keep them where we can read them */
    await cd.send("Page.addScriptToEvaluateOnNewDocument", { source:
      "window.__csp = []; document.addEventListener('securitypolicyviolation', e => __csp.push(e.violatedDirective + ' ' + (e.blockedURI || '')));" });
    for (const [id, site] of Object.entries(SITES)) {
      const dir = path.join(DIST, id);
      if (!fs.existsSync(path.join(dir, "_headers"))) { problems.push(id + ": no _headers in dist/" + id); continue; }
      const srv = await serve(dir);
      const base = "http://127.0.0.1:" + srv.address().port;
      try {
        for (const pg of site.pages) {
          const loaded = cd.once("Page.loadEventFired");
          await cd.send("Page.navigate", { url: base + pg });
          await loaded;
          await new Promise(r => setTimeout(r, 500));
          /* a page whose script was blocked fails its walk too: say so, and still report the violations */
          if (site.walk && pg === "/") {
            try { await cd.evaluate(site.walk); } catch (e) { problems.push(`${id}${pg}: the page did not work (${String(e.message).split("\n")[0].slice(0, 80)})`); }
          }
          const v = await cd.evaluate("JSON.stringify(window.__csp || [])");
          for (const x of JSON.parse(v)) problems.push(`${id}${pg}: CSP blocked ${x}`);
          checked++;
        }
      } finally { srv.close(); }
    }
  } finally { await cd.close(); }
  if (problems.length) { console.log("RESULT: " + problems.length + " problems\n  " + [...new Set(problems)].join("\n  ")); process.exit(1); }
  console.log("RESULT: 0 errors (" + checked + " pages under their own headers)");
})().catch(e => { console.error(e.message); process.exit(1); });
