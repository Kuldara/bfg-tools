/* Builds the Battlezone Generator.

   dist/terrain/index.html     the page, with the terrain core from
                               packages/battlezone/core.js included in its script
   dist/terrain/favicon.png, apple-touch-icon.png */
"use strict";
const path = require("path");
const kit = require("../../tools/lib/kit.js");

const HERE = "apps/terrain";
const OUT = "dist/terrain/";
const BADGE_HOSTS = ["bfgtools.kuldare.com", "bfgtools.boarding.kuldare.com", "terrain-generator.kuldare.com",
  "bfgtools.meta.kuldare.com", "scenario-library.kuldare.com", "github.com"];
/* The fonts still come from Google Fonts here, unlike the other tools, which
   embed theirs (docs: open findings). */
const ALLOWED = ["http://www.w3.org", "https://fonts.googleapis.com", "https://fonts.gstatic.com"];

async function build() {
  let page = kit.expandIncludes(kit.read(HERE + "/index.html"), HERE);
  page = page.replace("<!--BFGTOOLS--><!--/BFGTOOLS-->", "<!--BFGTOOLS-->" + kit.badge("terrain") + "<!--/BFGTOOLS-->");
  kit.guards.controlChars(page, "terrain");
  kit.guards.cssVars(page, "terrain");
  const b = kit.guards.badge(page, "terrain", BADGE_HOSTS);
  kit.guards.externalUrls(page, "terrain", ALLOWED, b);
  const out = [kit.write(OUT + "index.html", page)];
  for (const f of ["favicon.png", "apple-touch-icon.png"]) out.push(kit.copy(HERE + "/" + f, OUT + f));
  return { out };
}

module.exports = { build };

if (require.main === module) build().then(r => r.out.forEach(f => console.log(path.relative(kit.REPO, f))))
  .catch(e => { console.error(e.message); process.exit(1); });
