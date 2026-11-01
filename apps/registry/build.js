/* Builds the Gothic Fleet Registry.

   dist/registry/index.html        the site (Cloudflare Worker and GitHub Pages)
   dist/registry/bfg_data.json     the ship data on its own (data/README.md)
   dist/registry/og.png, _headers  link preview image, HTTP headers
   dist/share/Gothic Fleet Registry.zip
                                   the one-file version to hand around: the same
                                   page without the site's link-preview tags and
                                   without the Play button (Play is a page of its own)

   Everything the page needs is inside it: styles, script, fonts and data. */
"use strict";
const path = require("path");
const kit = require("../../tools/lib/kit.js");
const { counts } = require("./counts.js");
const preview = require("../../tools/og/meta.js");
const { facts } = require("../../tools/og/facts.js");
const APP = require("./app.json");

const HERE = "apps/registry";
const BASE = APP.url;

/* The tab icon as SVG inside the page, so the tab fetches nothing: a dark tile,
   a light card, an orange header bar (at 16 px a hull silhouette read as a flag). */
const ICON = "data:image/svg+xml," +
  "%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20viewBox='0%200%2064%2064'%3E" +
  "%3Crect%20width='64'%20height='64'%20rx='9'%20fill='%23211F20'/%3E" +
  "%3Crect%20x='9'%20y='11'%20width='46'%20height='42'%20rx='3'%20fill='%23F6F2E9'/%3E" +
  "%3Crect%20x='9'%20y='11'%20width='46'%20height='10'%20fill='%23D1792A'/%3E" +
  "%3Crect%20x='15'%20y='28'%20width='34'%20height='5'%20fill='%23211F20'/%3E" +
  "%3Crect%20x='15'%20y='39'%20width='22'%20height='5'%20fill='%23211F20'/%3E" +
  "%3C/svg%3E";

/* Hosts the badge may link to: the five tools and the source code. */
const BADGE_HOSTS = ["bfgtools.kuldare.com", "bfgtools.boarding.kuldare.com", "terrain-generator.kuldare.com",
  "bfgtools.meta.kuldare.com", "scenario-library.kuldare.com", "github.com"];
/* Outside the badge: the SVG namespace, and the published Play page, which is
   where "To phone" sends a phone when the builder runs from a disk. */
const ALLOWED = ["http://www.w3.org", "https://bfgtools.kuldare.com"];

/* The site's Content-Security-Policy. The app needs nothing from anywhere:
   connect-src 'none' means it cannot send a fleet anywhere even by mistake.
   Play has its own policy (service worker, manifest, its own fetches, and the
   room relay of its Opponent's fleet, services/relay); the
   policies are written per path because Cloudflare merges same-named headers
   of several rules, and two CSPs mean the stricter wins. */
const CSP_APP = "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src 'self' data:; " +
  "font-src data:; connect-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'self'";
const CSP_PLAY = "default-src 'none'; script-src 'self' 'unsafe-inline'; style-src 'unsafe-inline'; img-src 'self' data:; " +
  "font-src data:; connect-src 'self' wss://play-relay.kuldare.com; frame-src 'self'; worker-src 'self'; manifest-src 'self'; base-uri 'none'; " +
  "form-action 'none'; frame-ancestors 'self'";
const HEADERS = `/*
  X-Content-Type-Options: nosniff
  Referrer-Policy: no-referrer
  X-Frame-Options: SAMEORIGIN
  Permissions-Policy: geolocation=(), camera=(), microphone=(), payment=()

/
  Content-Security-Policy: ${CSP_APP}
  Cache-Control: public, max-age=0, must-revalidate

/index.html
  Content-Security-Policy: ${CSP_APP}
  Cache-Control: public, max-age=0, must-revalidate

/bfg_data.json
  Access-Control-Allow-Origin: *
  Cache-Control: public, max-age=0, must-revalidate

/og.png
  Cache-Control: public, max-age=604800

/play/*
  Content-Security-Policy: ${CSP_PLAY}
  Cache-Control: public, max-age=0, must-revalidate
`;

/* The Play button: the site has Play next to the builder; the one-file
   package does not, and the button would lead to a missing file. */
const PLAY_LINK = /[ \t]*<a class="btn" id="play"[^>]*>Play<\/a>\n/;

async function build() {
  const data = kit.read("data/bfg_data.json");
  if (/<\/script/i.test(data)) throw new Error("the data contains </script");
  const n = counts(JSON.parse(data));
  const description = facts("registry").description;

  const script = await kit.bundle({
    entry: HERE + "/src/index.js", globalName: "GFR",
    define: { __APP_VERSION__: JSON.stringify(APP.version) },
  });

  let page = kit.expandIncludes(kit.read(HERE + "/index.html"), HERE);
  page = kit.fill(page, "description", description);
  page = kit.fill(page, "icon", ICON);
  page = kit.fill(page, "fonts", "<style>\n" + kit.read("packages/ui/fonts.css") + "</style>");
  page = page.replace("<!--BFGTOOLS--><!--/BFGTOOLS-->", "<!--BFGTOOLS-->" + kit.badge("registry") + "<!--/BFGTOOLS-->");
  page = kit.fill(page, "data", data);
  page = kit.fill(page, "script", "\n" + script);

  /* link preview tags (tools/og): the site only */
  const siteMeta = preview.tags("registry").trimEnd();
  const site = kit.fill(page, "site-meta", siteMeta);
  const single = kit.fill(page, "site-meta", "").replace("\n\n<!--", "\n<!--");
  const shared = single.replace(PLAY_LINK, m => { return ""; });
  if (shared === single) throw new Error("the Play button was not found for the one-file package");
  if (shared.includes('id="play"')) throw new Error("the one-file package still links to Play");

  for (const [name, html] of [["index.html", site], ["Gothic Fleet Registry.html", shared]]) {
    kit.guards.ascii(html, name);
    kit.guards.controlChars(html, name);
    kit.guards.cssVars(html, name);
    const b = kit.guards.badge(html, name, BADGE_HOSTS);
    kit.guards.externalUrls(html, name, ALLOWED, b);
  }

  const out = [];
  out.push(kit.write("dist/registry/index.html", site));
  out.push(kit.write("dist/registry/bfg_data.json", data));
  out.push(preview.copyImage("registry", "dist/registry"));
  out.push(kit.write("dist/registry/_headers", HEADERS));
  out.push(kit.write("dist/share/Gothic Fleet Registry.zip", kit.zip([["Gothic Fleet Registry.html", shared]])));
  return { out, counts: n };
}

module.exports = { build, CSP_APP, CSP_PLAY };

if (require.main === module) build().then(r => {
  for (const f of r.out) console.log(path.relative(kit.REPO, f).padEnd(44), kit.kB(require("fs").statSync(f).size));
}).catch(e => { console.error(e.message); process.exit(1); });
