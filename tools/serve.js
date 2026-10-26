/* Serves dist/ on http://localhost:8800 (or --port N), the same paths as the
   GitHub Pages mirror: /registry/, /boarding/, /terrain/, /scenarios/, /almanac/.

   npm run serve              build once, then serve
   npm run serve -- --watch   rebuild when apps/, packages/ or data/ change
   npm run serve -- --no-build */
"use strict";
const http = require("http"), fs = require("fs"), path = require("path");
const { spawn } = require("child_process");
const REPO = path.resolve(__dirname, "..");
const DIST = path.join(REPO, "dist");
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const PORT = +arg("--port", 8800);
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8", ".png": "image/png", ".svg": "image/svg+xml", ".webmanifest": "application/manifest+json",
  ".zip": "application/zip", ".txt": "text/plain; charset=utf-8", ".ico": "image/x-icon" };

function runBuild() {
  return new Promise(ok => {
    const p = spawn(process.execPath, [path.join(__dirname, "build.js")], { stdio: "inherit" });
    p.on("exit", code => ok(code));
  });
}

function serve() {
  http.createServer((req, res) => {
    let rel = decodeURIComponent(new URL(req.url, "http://x").pathname);
    let file = path.join(DIST, rel);
    if (!file.startsWith(DIST)) { res.writeHead(403); return res.end(); }
    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) {
      if (!rel.endsWith("/")) { res.writeHead(301, { Location: rel + "/" }); return res.end(); }
      file = path.join(file, "index.html");
    }
    if (!fs.existsSync(file)) { res.writeHead(404, { "Content-Type": "text/plain" }); return res.end("not found: " + rel); }
    res.writeHead(200, { "Content-Type": TYPES[path.extname(file)] || "application/octet-stream", "Cache-Control": "no-store" });
    fs.createReadStream(file).pipe(res);
  }).listen(PORT, () => console.log(`serving dist/ at http://localhost:${PORT}/`));
}

(async () => {
  if (!process.argv.includes("--no-build")) await runBuild();
  serve();
  if (process.argv.includes("--watch")) {
    let timer = null, running = false, again = false;
    const kick = () => { clearTimeout(timer); timer = setTimeout(async () => {
      if (running) { again = true; return; }
      running = true; await runBuild(); running = false;
      if (again) { again = false; kick(); }
    }, 200); };
    for (const d of ["apps", "packages", "data"]) fs.watch(path.join(REPO, d), { recursive: true }, kick);
    console.log("watching apps/, packages/ and data/");
  }
})();
