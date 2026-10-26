/* The Meta Almanac's published site, as it is.

   The almanac is built in a separate, private project: its sources are
   tournament reports and community posts with player names in them. Only the
   finished page is kept here (apps/almanac/site: index.html, og.png,
   _headers), copied in after each of its releases, so that the mirror and a
   fork have it too.

   The data downloads the page links to (data/: sqlite, xlsx, csv) are not in
   the repository: 5.8 MB of generated files that changed with every release
   and weighed the history down (removed 26.10.2026). The build takes them
   from the first of these that has them:
     1. BFG_ALMANAC_DATA, a folder path (the almanac project's site/data)
     2. the almanac project's folder on the owner's machine (OWNER_DATA)
     3. the live site (<app.json url>/data/...), for CI and a fork, so the
        mirror's downloads work too
   With none of them the page is built without the downloads, with a notice.

   dist/almanac/   index.html, og.png, data/ (sqlite, xlsx, csv downloads), _headers */
"use strict";
const fs = require("fs"), path = require("path");
const kit = require("../../tools/lib/kit.js");
const APP = require("./app.json");

const HERE = "apps/almanac/site";
const BADGE_HOSTS = ["bfgtools.kuldare.com", "bfgtools.boarding.kuldare.com", "terrain-generator.kuldare.com",
  "bfgtools.meta.kuldare.com", "scenario-library.kuldare.com", "github.com"];
const DATA_FILES = ["bfg_meta_almanac.sqlite", "bfg_meta_almanac.xlsx", "bfg_meta_almanac_csv.zip"];
const OWNER_DATA = "F:/3D print LLM/Battlefleet Gothic/meta-tietokanta/julkaisu/site/data";

async function dataFiles() {
  const local = [process.env.BFG_ALMANAC_DATA, OWNER_DATA].filter(Boolean)
    .find(d => DATA_FILES.every(f => fs.existsSync(path.join(d, f))));
  const out = [];
  if (local) {
    for (const f of DATA_FILES) out.push(kit.write("dist/almanac/data/" + f, fs.readFileSync(path.join(local, f))));
    return { out, from: local };
  }
  try {
    const got = [];
    for (const f of DATA_FILES) {
      const r = await fetch(APP.url + "/data/" + f);
      if (!r.ok) throw new Error(r.status + " for " + f);
      got.push([f, Buffer.from(await r.arrayBuffer())]);
    }
    for (const [f, b] of got) out.push(kit.write("dist/almanac/data/" + f, b));
    return { out, from: APP.url };
  } catch (e) {
    console.log("almanac: no data downloads (" + e.message + "); the page is built without them");
    fs.rmSync(kit.abs("dist/almanac/data"), { recursive: true, force: true });
    return { out: [], from: null };
  }
}

async function build() {
  const out = [];
  for (const n of fs.readdirSync(kit.abs(HERE))) {
    if (fs.statSync(kit.abs(path.join(HERE, n))).isDirectory()) continue;   /* data/ is not tracked; see above */
    out.push(kit.copy(path.join(HERE, n), path.join("dist/almanac", n)));
  }
  const data = await dataFiles();
  out.push(...data.out);
  const page = kit.read("dist/almanac/index.html");
  kit.guards.badge(page, "almanac", BADGE_HOSTS);
  return { out, dataFrom: data.from };
}

module.exports = { build };

if (require.main === module) build().then(r => console.log(r.out.length + " files in dist/almanac, data from " + (r.dataFrom || "nowhere")))
  .catch(e => { console.error(e.message); process.exit(1); });
