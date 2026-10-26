/* The Meta Almanac's published site, as it is.

   The almanac is built in a separate, private project: its sources are
   tournament reports and community posts with player names in them. Only the
   finished site is kept here (apps/almanac/site), copied in after each of its
   releases, so that the mirror and a fork have it too.

   dist/almanac/   index.html, og.png, data/ (sqlite, xlsx, csv downloads), _headers */
"use strict";
const fs = require("fs"), path = require("path");
const kit = require("../../tools/lib/kit.js");

const HERE = "apps/almanac/site";
const BADGE_HOSTS = ["bfgtools.kuldare.com", "bfgtools.boarding.kuldare.com", "terrain-generator.kuldare.com",
  "bfgtools.meta.kuldare.com", "scenario-library.kuldare.com", "github.com"];

async function build() {
  const out = [];
  const walk = rel => {
    for (const n of fs.readdirSync(kit.abs(path.join(HERE, rel)))) {
      const r = path.join(rel, n);
      if (fs.statSync(kit.abs(path.join(HERE, r))).isDirectory()) walk(r);
      else out.push(kit.copy(path.join(HERE, r), path.join("dist/almanac", r)));
    }
  };
  walk("");
  const page = kit.read("dist/almanac/index.html");
  kit.guards.badge(page, "almanac", BADGE_HOSTS);
  return { out };
}

module.exports = { build };

if (require.main === module) build().then(r => console.log(r.out.length + " files in dist/almanac"))
  .catch(e => { console.error(e.message); process.exit(1); });
