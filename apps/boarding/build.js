/* Builds Boarding Actions.

   dist/boarding/index.html     the site: one file, works without a server, so
                                it opens on a phone or a tablet as it is
   dist/share/Boarding.zip      the same page with its README, to send to an opponent

   src/ships.json comes from data/bfg_data.json through build_ships.py (run it
   after a data change); this build checks it and the icons, then bundles. */
"use strict";
const path = require("path");
const kit = require("../../tools/lib/kit.js");
const preview = require("../../tools/og/meta.js");

const HERE = "apps/boarding";
const BADGE_HOSTS = ["bfgtools.kuldare.com", "bfgtools.boarding.kuldare.com", "terrain-generator.kuldare.com",
  "bfgtools.meta.kuldare.com", "scenario-library.kuldare.com", "github.com"];
const ALLOWED = ["http://www.w3.org"];
/* everything is inside the page; it fetches nothing */
const CSP = `default-src 'none'; script-src 'unsafe-inline' ${kit.BEACON.script}; style-src 'unsafe-inline'; img-src 'self' data:; ` +
  `font-src 'self' data:; connect-src ${kit.BEACON.connect}; base-uri 'none'; form-action 'none'; frame-ancestors 'self'`;

/* Every fleet and hull type has an icon, and an icon is geometry only (it goes
   into the page as markup). Add a missing one to make_icons.py and run it. */
function iconProblems(data, icons) {
  const bad = [];
  const SAFE_GLYPH = /^(<(path|circle) [^<>]*\/>)+$/, HEX = /^#[0-9a-fA-F]{6}$/;
  for (const fl of data.fleets) {
    const st = icons.fleets[fl.id];
    if (!st) bad.push("fleet " + fl.id + " has no icon");
    else if (!HEX.test(st.color || "")) bad.push("fleet " + fl.id + ": colour is not #rrggbb");
    else if (!(st.glyph in icons.glyphs)) bad.push("fleet " + fl.id + ": no glyph " + st.glyph);
  }
  for (const ty of [...new Set(data.ships.map(sh => sh.t))].sort())
    if (!(ty in icons.hulls)) bad.push("hull type " + ty + " has no icon");
  for (const [name, markup] of Object.entries(icons.glyphs).concat(Object.entries(icons.hulls)))
    if (!SAFE_GLYPH.test(markup) || /script|href|url\(|\bon\w+=/i.test(markup)) bad.push("icon " + name + " is not path/circle geometry only");
  return bad;
}

/* The same app for Gothic Fleet Play (apps/play/build.js): opened over its page
   with the ship on it, no links to the sister tools. */
async function embedPage() {
  const ships = JSON.parse(kit.read(HERE + "/src/ships.json"));
  const stamp = new Date().toISOString().slice(0, 10) + " · " + ships.ships.length + " ships";
  const script = await kit.bundle({ entry: HERE + "/src/index.js", globalName: "BoardingApp", define: { __BUILD__: JSON.stringify(stamp) } });
  let page = kit.expandIncludes(kit.read(HERE + "/index.html"), HERE);
  page = kit.fill(page, "script", "\n" + script);
  kit.guards.controlChars(page, "boarding in Play");
  kit.guards.cssVars(page, "boarding in Play");
  kit.guards.externalUrls(page, "boarding in Play", ALLOWED);
  return page;
}

async function build() {
  const ships = JSON.parse(kit.read(HERE + "/src/ships.json"));
  if ((ships.ships || []).length < 100) throw new Error("src/ships.json has only " + (ships.ships || []).length + " ships");
  const bad = iconProblems(ships, JSON.parse(kit.read(HERE + "/src/icons.json")));
  if (bad.length) throw new Error("icons (make_icons.py):\n  " + bad.join("\n  "));

  const stamp = new Date().toISOString().slice(0, 10) + " · " + ships.ships.length + " ships";
  const script = await kit.bundle({ entry: HERE + "/src/index.js", globalName: "BoardingApp", define: { __BUILD__: JSON.stringify(stamp) } });
  let page = kit.expandIncludes(kit.read(HERE + "/index.html"), HERE);
  page = page.replace("<!--BFGTOOLS--><!--/BFGTOOLS-->", "<!--BFGTOOLS-->" + kit.badge("boarding") + "<!--/BFGTOOLS-->");
  page = kit.fill(page, "script", "\n" + script);

  /* Not checked for ASCII: the page declares utf-8 and its text uses typographic characters. */
  kit.guards.controlChars(page, "boarding");
  kit.guards.cssVars(page, "boarding");
  const b = kit.guards.badge(page, "boarding", BADGE_HOSTS);
  kit.guards.externalUrls(page, "boarding", ALLOWED, b);

  const out = [];
  /* link preview tags (tools/og): the site only, after the guards (the page's own address is in them) */
  out.push(kit.write("dist/boarding/index.html", preview.addTo(page, "boarding")), preview.copyImage("boarding", "dist/boarding"));
  out.push(kit.write("dist/boarding/_headers", kit.siteHeaders(CSP)));
  out.push(kit.write("dist/share/Boarding.zip", kit.zip([["Boarding.html", page], ["README.txt", kit.read(HERE + "/README.md")]])));
  return { out };
}

module.exports = { build, embedPage };

if (require.main === module) build().then(r => {
  for (const f of r.out) console.log(path.relative(kit.REPO, f).padEnd(44), kit.kB(require("fs").statSync(f).size));
}).catch(e => { console.error(e.message); process.exit(1); });
