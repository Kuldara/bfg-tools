/* Builds the Scenario Library.

   dist/scenarios/index.html               the page (styles included, the script in app.js)
   dist/scenarios/app.js                   the app: src/*.js bundled, exports on window.SL
   dist/scenarios/scenarios/*.js           one file per publication; each adds its
                                           scenarios to the library when loaded
   dist/scenarios/battlezone-core.js       the terrain core, from packages/battlezone
   dist/scenarios/favicon.png, apple-touch-icon.png


   Every local script gets ?v=<content hash>, so a browser never keeps an old
   copy after a release and nobody bumps version query strings by hand. */
"use strict";
const path = require("path"), fs = require("fs");
const kit = require("../../tools/lib/kit.js");
const preview = require("../../tools/og/meta.js");
const battlezone = require("../../packages/battlezone/index.js");
const APP = require("./app.json");

const HERE = "apps/scenarios";
const OUT = "dist/scenarios/";
const BADGE_HOSTS = ["bfgtools.kuldare.com", "bfgtools.boarding.kuldare.com", "terrain-generator.kuldare.com",
  "bfgtools.meta.kuldare.com", "scenario-library.kuldare.com", "github.com"];
/* Links to where a scenario was published ("Open the original"); nothing is
   fetched from them. */
const ALLOWED = ["http://www.w3.org", "https://drive.google.com", "https://specialist-arms.com", "https://www.specialist-arms.com"];
/* its own script files and nothing else; the links to the originals are
   navigation, which a CSP does not restrict */
const CSP = `default-src 'none'; script-src 'self' 'unsafe-inline' ${kit.BEACON.script}; style-src 'unsafe-inline'; img-src 'self' data:; ` +
  `font-src 'self' data:; connect-src ${kit.BEACON.connect}; base-uri 'none'; form-action 'none'; frame-ancestors 'self'`;

async function build() {
  const files = { "battlezone-core.js": battlezone.asNamespace() };
  for (const f of fs.readdirSync(kit.abs(HERE + "/scenarios")).filter(f => f.endsWith(".js")).sort())
    files["scenarios/" + f] = kit.read(HERE + "/scenarios/" + f);

  files["app.js"] = await kit.bundle({ entry: HERE + "/src/index.js", globalName: "SL" });
  let page = kit.expandIncludes(kit.read(HERE + "/index.html"), HERE);
  page = kit.fill(page, "version", APP.version);
  page = page.replace("<!--BFGTOOLS--><!--/BFGTOOLS-->", "<!--BFGTOOLS-->" + kit.badge("scenarios") + "<!--/BFGTOOLS-->");
  const linked = new Set();
  page = page.replace(/<script src="([^"?:]+\.js)">/g, (m, src) => {
    if (!(src in files)) throw new Error("index.html loads " + src + ", which the build does not make");
    linked.add(src);
    return `<script src="${src}?v=${kit.sha(files[src]).slice(0, 10)}">`;
  });
  const unlinked = Object.keys(files).filter(f => !linked.has(f));
  if (unlinked.length) throw new Error("not loaded by index.html: " + unlinked.join(", "));

  kit.guards.controlChars(page, "scenarios");
  kit.guards.cssVars(page, "scenarios");
  const b = kit.guards.badge(page, "scenarios", BADGE_HOSTS);
  kit.guards.externalUrls(page, "scenarios", ALLOWED, b);
  for (const [f, text] of Object.entries(files)) {
    kit.guards.controlChars(text, f);
    kit.guards.externalUrls(text, f, ALLOWED);
  }

  /* link preview tags (tools/og): after the guards, the page's own address is in them */
  const out = [kit.write(OUT + "index.html", preview.addTo(page, "scenarios")), preview.copyImage("scenarios", OUT),
    kit.write(OUT + "_headers", kit.siteHeaders(CSP))];
  for (const [f, text] of Object.entries(files)) out.push(kit.write(OUT + f, text));
  for (const f of ["favicon.png", "apple-touch-icon.png"]) out.push(kit.copy(HERE + "/" + f, OUT + f));
  return { out };
}

module.exports = { build };

if (require.main === module) build().then(r => console.log(r.out.length + " files in dist/scenarios"))
  .catch(e => { console.error(e.message); process.exit(1); });
