/* Builds every app into dist/.  npm run build [-- <app> ...]

   dist/<app>/   one folder per published site, as deployed
   dist/share/   the one-file packages to hand around
   dist/index.html   the GitHub Pages mirror's front page */
"use strict";
const path = require("path"), fs = require("fs");
const kit = require("./lib/kit.js");

const APPS = ["registry", "play", "boarding", "terrain", "scenarios", "almanac", "home"];

(async () => {
  const want = process.argv.slice(2).filter(a => !a.startsWith("-"));
  const apps = want.length ? want : APPS;
  for (const a of apps) if (!APPS.includes(a)) { console.error("unknown app: " + a + " (" + APPS.join(", ") + ")"); process.exit(2); }
  let failed = 0;
  /* the rules engine first: the apps bundle packages/rules/domain.js */
  try {
    const rules = require(path.join(kit.REPO, "packages", "rules", "build.js"));
    fs.writeFileSync(rules.OUT, await rules.make());
    console.log("rules      ok  packages/rules/domain.js");
  } catch (e) { failed++; console.error("rules      FAILED: " + e.message); }
  for (const a of apps) {
    const t0 = Date.now();
    try {
      const r = await require(path.join(kit.REPO, "apps", a, "build.js")).build();
      console.log(`${a.padEnd(10)} ok  ${((Date.now() - t0) / 1000).toFixed(1)}s`);
      for (const f of r.out) console.log("  " + path.relative(kit.REPO, f).replace(/\\/g, "/").padEnd(46) + kit.kB(fs.statSync(f).size));
    } catch (e) {
      failed++;
      console.error(`${a.padEnd(10)} FAILED: ${e.message}`);
    }
  }
  process.exit(failed ? 1 : 0);
})();
