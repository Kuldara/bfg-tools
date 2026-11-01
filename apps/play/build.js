/* Builds Gothic Fleet Play, the phone companion, into the Registry's site:

   dist/registry/play/Gothic Fleet Play.html   the page (styles, script, fonts, data inside)
   dist/registry/play/manifest.webmanifest, sw.js, icon-*.png
                                               installable and offline at the table

   The Registry's Play button and "To phone" link open it from the same site,
   and it reads the fleets the builder saved in the same browser. */
"use strict";
const path = require("path");
const kit = require("../../tools/lib/kit.js");
const preview = require("../../tools/og/meta.js");
const boarding = require("../boarding/build.js");
const APP = require("./app.json");

const HERE = "apps/play";
const PAGE = "Gothic Fleet Play.html";
const OUT = "dist/registry/play/";
/* Outside the SVG namespace, only the published builder, which "To phone"
   names when the page runs from a disk (a link, never a fetch). */
const ALLOWED = ["http://www.w3.org", "https://bfgtools.kuldare.com"];

/* Added to the site's copy: installable (full screen, no address bar) and a
   service worker that fetches the page from the network first, so a fix shows
   at once, and uses the saved copy only without a network. */
const HEAD_PWA = '<link rel="manifest" href="manifest.webmanifest">\n' +
  '<link rel="apple-touch-icon" href="icon-192.png">\n' +
  '<meta name="mobile-web-app-capable" content="yes">\n' +
  '<meta name="apple-mobile-web-app-capable" content="yes">\n' +
  '<meta name="apple-mobile-web-app-title" content="Fleet Play">\n';
const SW_REG = '<script>if("serviceWorker" in navigator && location.protocol === "https:")' +
  'navigator.serviceWorker.register("sw.js").catch(function(){});</script>\n';

const MANIFEST = {
  name: "Gothic Fleet Play", short_name: "Fleet Play",
  description: "Battlefleet Gothic fleet record for the table: hits, criticals and the rules the book derives.",
  start_url: "./" + PAGE.replace(/ /g, "%20"), scope: "./", display: "standalone",
  background_color: "#0F151B", theme_color: "#0F151B",
  icons: [{ src: "icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" }],
};

const serviceWorker = cache => `/* Gothic Fleet Play: offline at the table (apps/play/build.js). The page
   is fetched from the network first - a fix shows at once - and the saved
   copy is used only when there is no network. */
const CACHE = "${cache}";
const FILES = ["./${PAGE.replace(/ /g, "%20")}", "./boarding.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png"];
self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if(req.method !== "GET" || new URL(req.url).origin !== location.origin) return;
  e.respondWith(fetch(req).then(r => {
    if(r.ok){ const copy = r.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
    return r;
  }).catch(() => caches.match(req, { ignoreSearch: true })));
});
`;

async function build() {
  const data = kit.read("data/bfg_data.json");
  const script = await kit.bundle({
    entry: HERE + "/src/index.js", globalName: "GFP",
    define: { __APP_VERSION__: JSON.stringify(APP.version) },
  });
  let page = kit.expandIncludes(kit.read(HERE + "/index.html"), HERE);
  page = kit.fill(page, "version", APP.version);
  page = kit.fill(page, "fonts", "<style>\n" + kit.read("packages/ui/fonts.css") + "</style>");
  page = kit.fill(page, "data", data);
  page = kit.fill(page, "script", "\n" + script);

  if (!page.startsWith("<!DOCTYPE html>")) throw new Error(PAGE + ": must start with a doctype");
  if (!page.includes("viewport-fit=cover")) throw new Error(PAGE + ": viewport without viewport-fit=cover: the safe areas stay zero");
  kit.guards.ascii(page, PAGE);
  kit.guards.controlChars(page, PAGE);
  kit.guards.cssVars(page, PAGE);
  kit.guards.externalUrls(page, PAGE, ALLOWED);

  if (page.split("</head>").length !== 2 || page.split("</body>").length !== 2) throw new Error(PAGE + ": one head and one body expected");
  const site = preview.addTo(page, "play").replace("</head>", HEAD_PWA + "</head>").replace("</body>", SW_REG + "</body>");
  const cache = "gfp-" + kit.sha(site).slice(0, 12);

  const out = [];
  out.push(kit.write(OUT + PAGE, site));
  out.push(kit.write(OUT + "boarding.html", await boarding.embedPage()));
  out.push(kit.write(OUT + "manifest.webmanifest", JSON.stringify(MANIFEST, null, 1)));
  out.push(kit.write(OUT + "sw.js", serviceWorker(cache)));
  out.push(kit.copy(HERE + "/assets/icon-192.png", OUT + "icon-192.png"));
  out.push(kit.copy(HERE + "/assets/icon-512.png", OUT + "icon-512.png"));
  out.push(preview.copyImage("play", OUT));
  return { out };
}

module.exports = { build, PAGE_PATH: path.join(kit.DIST, "registry", "play", PAGE) };

if (require.main === module) build().then(r => {
  for (const f of r.out) console.log(path.relative(kit.REPO, f).padEnd(50), kit.kB(require("fs").statSync(f).size));
}).catch(e => { console.error(e.message); process.exit(1); });
