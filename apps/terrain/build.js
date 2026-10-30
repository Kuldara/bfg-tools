/* Builds the Battlezone Generator.

   dist/terrain/index.html     the page: styles included, the script bundled
                               from src/ (and packages/battlezone/core.js) into it
   dist/terrain/favicon.png, apple-touch-icon.png */
"use strict";
const path = require("path");
const kit = require("../../tools/lib/kit.js");
const preview = require("../../tools/og/meta.js");

const HERE = "apps/terrain";
const OUT = "dist/terrain/";
const BADGE_HOSTS = ["bfgtools.kuldare.com", "bfgtools.boarding.kuldare.com", "terrain-generator.kuldare.com",
  "bfgtools.meta.kuldare.com", "scenario-library.kuldare.com", "github.com"];
/* The fonts still come from Google Fonts here, unlike the other tools, which
   embed theirs (docs: open findings). */
const ALLOWED = ["http://www.w3.org", "https://fonts.googleapis.com", "https://fonts.gstatic.com"];
const CSP = `default-src 'none'; script-src 'unsafe-inline' ${kit.BEACON.script}; style-src 'unsafe-inline' https://fonts.googleapis.com; ` +
  `img-src 'self' data:; font-src https://fonts.gstatic.com data:; connect-src ${kit.BEACON.connect}; base-uri 'none'; ` +
  `form-action 'none'; frame-ancestors 'self'`;

async function build() {
  const script = await kit.bundle({ entry: HERE + "/src/index.js", globalName: "BZG" });
  let page = kit.expandIncludes(kit.read(HERE + "/index.html"), HERE);
  page = kit.fill(page, "script", script);
  page = page.replace("<!--BFGTOOLS--><!--/BFGTOOLS-->", "<!--BFGTOOLS-->" + kit.badge("terrain") + "<!--/BFGTOOLS-->");
  kit.guards.controlChars(page, "terrain");
  kit.guards.cssVars(page, "terrain");
  const b = kit.guards.badge(page, "terrain", BADGE_HOSTS);
  kit.guards.externalUrls(page, "terrain", ALLOWED, b);
  /* link preview tags (tools/og): after the guards, the page's own address is in them */
  const out = [kit.write(OUT + "index.html", preview.addTo(page, "terrain")), preview.copyImage("terrain", OUT),
    kit.write(OUT + "_headers", kit.siteHeaders(CSP))];
  for (const f of ["favicon.png", "apple-touch-icon.png"]) out.push(kit.copy(HERE + "/" + f, OUT + f));
  return { out };
}

module.exports = { build };

if (require.main === module) build().then(r => r.out.forEach(f => console.log(path.relative(kit.REPO, f))))
  .catch(e => { console.error(e.message); process.exit(1); });
