/* A backup copy of the whole project, to keep somewhere else (a synced drive).

   npm run backup                      writes to BFG_BACKUP_DIR
   npm run backup -- <folder>          writes to <folder>

   Two files per run, named by date and commit:
     bfg-tools-<date>-<commit>.bundle   the whole git history; restore with
                                        git clone bfg-tools-....bundle bfg-tools
     bfg-tools-<date>-<commit>-dist.zip the built sites, as published

   A backup is a copy, never a place to edit (docs/adr/0001). The newest ten
   of each are kept; older ones are removed. */
"use strict";
const { execFileSync } = require("child_process");
const fs = require("fs"), path = require("path");
const kit = require("./lib/kit.js");

const KEEP = 10;
const dir = process.argv[2] || process.env.BFG_BACKUP_DIR;
if (!dir) { console.error("where to? set BFG_BACKUP_DIR or give a folder: npm run backup -- <folder>"); process.exit(2); }
fs.mkdirSync(dir, { recursive: true });

const git = (...a) => execFileSync("git", ["-C", kit.REPO, ...a], { encoding: "utf8" }).trim();
const dirty = git("status", "--porcelain");
if (dirty) console.log("note: uncommitted changes are not in the bundle (commit first to include them)");
const commit = git("rev-parse", "--short", "HEAD");
const stem = "bfg-tools-" + new Date().toISOString().slice(0, 10) + "-" + commit;

const bundle = path.join(dir, stem + ".bundle");
git("bundle", "create", bundle, "--all");
git("bundle", "verify", bundle);
console.log(path.basename(bundle).padEnd(46) + kit.kB(fs.statSync(bundle).size));

if (fs.existsSync(kit.DIST)) {
  const entries = [];
  const walk = rel => {
    for (const n of fs.readdirSync(path.join(kit.DIST, rel))) {
      const r = rel ? rel + "/" + n : n;
      if (fs.statSync(path.join(kit.DIST, r)).isDirectory()) walk(r); else entries.push([r, fs.readFileSync(path.join(kit.DIST, r))]);
    }
  };
  walk("");
  const zipPath = path.join(dir, stem + "-dist.zip");
  fs.writeFileSync(zipPath, kit.zip(entries));
  console.log(path.basename(zipPath).padEnd(46) + kit.kB(fs.statSync(zipPath).size));
} else console.log("no dist/ (npm run build) - only the history was backed up");

for (const ext of [".bundle", "-dist.zip"]) {
  const old = fs.readdirSync(dir).filter(n => n.startsWith("bfg-tools-") && n.endsWith(ext)).sort().reverse().slice(KEEP);
  for (const n of old) { fs.unlinkSync(path.join(dir, n)); console.log("removed old " + n); }
}
