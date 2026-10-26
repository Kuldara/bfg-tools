/* Deploys built apps to their Cloudflare Workers.

   npm run publish -- registry scenarios     the named apps
   npm run publish -- --all                  all six sites
   npm run publish -- registry --dry-run     everything except the upload

   The owner publishes from their own machine with this; CI does the same
   when a release tag is pushed and the repository has the Cloudflare secrets
   (.github/workflows/release.yml, docs/adr/0006). It needs Wrangler (npx
   wrangler) and either `wrangler login` or CLOUDFLARE_API_TOKEN and
   CLOUDFLARE_ACCOUNT_ID in the environment.

   Each site is a Worker with static assets only (no code, no bindings). Its
   custom domain (*.kuldare.com) is attached to the Worker in the dashboard;
   wrangler deploy does not touch domains when the configuration has no
   routes. workers.dev and preview URLs stay off: when the keys are missing,
   Wrangler turns workers.dev on.

   After the upload the live index.html is fetched and compared with the local
   one, byte for byte.

   From a developer machine (not in CI) it first refuses two things, because
   either would put on the live site something that is not the newest
   committed work: uncommitted changes, and a checkout that lacks commits
   origin/main has (a cloud session or another machine released newer work;
   pull first). --skip-checks skips both, for an emergency. This replaces the
   old pipeline's mirror guard (peilivahti.py, 25.10.2026). */
"use strict";
const { spawnSync } = require("child_process");
const fs = require("fs"), path = require("path"), os = require("os");
const kit = require("./lib/kit.js");

function git(args) {
  const r = spawnSync("git", args, { cwd: kit.REPO, encoding: "utf8" });
  return { ok: r.status === 0, out: (r.stdout || "").trim(), err: (r.stderr || "").trim() };
}

/* Returns a list of reasons not to publish from this checkout (empty = go). */
function checkoutProblems() {
  const problems = [];
  const dirty = git(["status", "--porcelain", "--untracked-files=no"]);
  if (!dirty.ok) return ["git status failed: " + dirty.err];
  if (dirty.out) problems.push("uncommitted changes; commit them first:\n" + dirty.out.split("\n").slice(0, 10).map(l => "    " + l).join("\n"));
  if (!git(["remote", "get-url", "origin"]).ok) {
    console.log("note: no remote 'origin', so newer released work cannot be checked");
    return problems;
  }
  const f = git(["fetch", "--quiet", "origin", "main"]);
  if (!f.ok) { problems.push("git fetch origin main failed: " + f.err); return problems; }
  if (!git(["merge-base", "--is-ancestor", "origin/main", "HEAD"]).ok) {
    const missing = git(["log", "--oneline", "HEAD..origin/main"]).out;
    problems.push("origin/main has commits this checkout does not have; pull first:\n" +
      missing.split("\n").slice(0, 10).map(l => "    " + l).join("\n"));
  }
  return problems;
}

/* app id -> its dist folder; the Worker name and address are in apps/<id>/app.json */
const SITES = { registry: "registry", boarding: "boarding", terrain: "terrain", scenarios: "scenarios", almanac: "almanac" };
/* Play lives inside the Registry's site (/play/): releasing Play deploys the Registry. */
const ALIASES = { play: "registry" };
const COMPATIBILITY_DATE = "2026-10-18";

function config(app) {
  return {
    name: app.worker, compatibility_date: COMPATIBILITY_DATE,
    assets: { directory: "./public", html_handling: "auto-trailing-slash", not_found_handling: "none" },
    workers_dev: false, preview_urls: false,
  };
}

function copyTree(src, dst) {
  fs.mkdirSync(dst, { recursive: true });
  for (const n of fs.readdirSync(src)) {
    const s = path.join(src, n), d = path.join(dst, n);
    if (fs.statSync(s).isDirectory()) copyTree(s, d); else fs.copyFileSync(s, d);
  }
}

async function verify(app, local) {
  /* Cloudflare Web Analytics, when it is switched on for the zone, adds its
     beacon script to HTML responses; that is not a difference in the app. */
  const beacon = /<script[^>]*cloudflareinsights[^>]*>\s*<\/script>\s*/g;
  for (let i = 0; i < 5; i++) {
    try {
      const r = await fetch(app.url + "/?v=" + Date.now(), { headers: { "Cache-Control": "no-cache" } });
      const got = Buffer.from(await r.arrayBuffer());
      if (got.equals(local) || got.toString("utf8").replace(beacon, "") === local.toString("utf8")) return true;
    } catch (e) { /* network hiccup: try again */ }
    await new Promise(ok => setTimeout(ok, 4000));
  }
  return false;
}

(async () => {
  const argv = process.argv.slice(2);
  const DRY = argv.includes("--dry-run");
  const ids = [...new Set(argv.includes("--all") ? Object.keys(SITES) : argv.filter(a => !a.startsWith("-")).map(a => ALIASES[a] || a))];
  if (!ids.length) { console.error("which apps? " + Object.keys(SITES).join(", ") + " or --all"); process.exit(2); }
  if (!process.env.GITHUB_ACTIONS && !argv.includes("--skip-checks")) {
    const problems = checkoutProblems();
    if (problems.length) {
      console.error("not publishing:\n  " + problems.join("\n  ") + "\n(--skip-checks publishes anyway)");
      process.exit(1);
    }
  }
  const failed = [];
  for (const id of ids) {
    if (!SITES[id]) { console.error("unknown app: " + id); process.exit(2); }
    const app = require(path.join(kit.REPO, "apps", id, "app.json"));
    const dist = path.join(kit.DIST, SITES[id]);
    if (!fs.existsSync(path.join(dist, "index.html"))) { console.error(id + ": dist is empty, run npm run build"); process.exit(1); }
    /* staged outside the repository so Wrangler picks up nothing else */
    const stage = fs.mkdtempSync(path.join(os.tmpdir(), "bfgtools-" + id + "-"));
    copyTree(dist, path.join(stage, "public"));
    fs.writeFileSync(path.join(stage, "wrangler.json"), JSON.stringify(config(app), null, 2));
    console.log(`${id}: ${DRY ? "would deploy" : "deploying"} dist/${SITES[id]} to Worker ${app.worker} (${app.url})`);
    if (DRY) continue;
    /* npx is a .cmd file on Windows and needs a shell, and the shell splits
       arguments at spaces: unquoted, the message "bfg-tools local" became a
       second argument that Wrangler read as the Worker's entry file. */
    const win = process.platform === "win32";
    const arg = a => win && /[\s"]/.test(a) ? '"' + a.replace(/"/g, '\\"') + '"' : a;
    const r = spawnSync("npx", ["--yes", "wrangler@4", "deploy", "--config", path.join(stage, "wrangler.json"),
      "--message", "bfg-tools " + (process.env.GITHUB_REF_NAME || "local")].map(arg), { cwd: stage, stdio: "inherit", shell: win });
    if (r.status !== 0) { failed.push(id); continue; }
    const ok = await verify(app, fs.readFileSync(path.join(dist, "index.html")));
    console.log(`${id}: ${ok ? "live index.html matches the build" : "LIVE PAGE DIFFERS from the build"}`);
    if (!ok) failed.push(id);
  }
  if (failed.length) { console.error("failed: " + failed.join(", ")); process.exit(1); }
})();
