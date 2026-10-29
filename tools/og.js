/* Link previews: the image and text Discord (or any site that reads Open
   Graph) shows for a link to one of the apps.

   node tools/og.js              make apps/<app>/assets/og.png and og.json for
                                 every app from the built pages (npm run build
                                 first; needs Chrome)
   node tools/og.js registry     only these apps
   node tools/og.js --check      fail when an image no longer shows what the
                                 data says (npm test runs this; no Chrome)
   node tools/og.js --try=classic,poster --out=<dir>
                                 the given layouts for every app into <dir>,
                                 for choosing a style; nothing in the repository
                                 changes

   og.json records what the image shows (facts.js key), the layout and the
   image's hash. The numbers on the image are counted from the data, so a
   data change that changes them fails --check until the images are made
   again: run node tools/og.js and commit the images. The page's own tags
   (og:title, og:description) come from the same facts at build time
   (kit.linkPreview), so they are never out of date. */
"use strict";
const fs = require("fs"), path = require("path");
const kit = require("./lib/kit.js");
const { APPS, facts, key } = require("./og/facts.js");
const { STYLES } = require("./og/styles.js");

/* the layout the published images use */
const STYLE = "bleed";

const argv = process.argv.slice(2);
const opt = name => { const a = argv.find(x => x.startsWith("--" + name + "=")); return a ? a.slice(name.length + 3) : null; };
const ids = argv.filter(a => !a.startsWith("--"));
for (const id of ids) if (!APPS.includes(id)) throw new Error("no app " + id + " (" + APPS.join(", ") + ")");
const wanted = ids.length ? ids : APPS;
const asset = (id, f) => path.join(kit.REPO, "apps", id, "assets", f);

function check() {
  const bad = [];
  for (const id of APPS) {
    const stampPath = asset(id, "og.json"), png = asset(id, "og.png");
    if (!fs.existsSync(stampPath) || !fs.existsSync(png)) { bad.push(id + ": no og.png / og.json"); continue; }
    const stamp = JSON.parse(fs.readFileSync(stampPath, "utf8"));
    const now = key(facts(id));
    if (JSON.stringify(stamp.shows) !== JSON.stringify(now)) {
      const diff = Object.keys(now).filter(k => JSON.stringify(now[k]) !== JSON.stringify(stamp.shows[k]));
      bad.push(id + ": the image shows old " + diff.join(", ") + " (" + diff.map(k => JSON.stringify(stamp.shows[k])).join("; ").slice(0, 120) + ")");
    }
    if (stamp.style !== STYLE) bad.push(id + ": made with the layout " + stamp.style + ", the published one is " + STYLE);
    if (stamp.sha !== kit.sha(fs.readFileSync(png))) bad.push(id + ": og.png is not the image og.json describes");
  }
  if (bad.length) {
    console.log("link previews out of date - run node tools/og.js (after npm run build) and commit the images:\n  " + bad.join("\n  "));
    process.exit(1);
  }
  console.log("link previews current: " + APPS.join(", "));
}

async function render(cd, html) {
  await cd.send("Emulation.setDeviceMetricsOverride", { width: 1200, height: 630, deviceScaleFactor: 1, mobile: false });
  const loaded = cd.once("Page.loadEventFired");
  const { frameTree } = await cd.send("Page.getFrameTree");
  await cd.send("Page.navigate", { url: "about:blank" });
  await loaded;
  await cd.send("Page.setDocumentContent", { frameId: frameTree.frame.id, html });
  await cd.evaluate("Promise.all([document.fonts.ready, ...[...document.images].map(i => i.decode().catch(() => 0))]).then(() => true)");
  const r = await cd.send("Page.captureScreenshot", { format: "png", clip: { x: 0, y: 0, width: 1200, height: 630, scale: 1 } });
  return Buffer.from(r.data, "base64");
}

async function make() {
  const { launch } = require("./lib/chrome.js");
  const { takeAll } = require("./og/shots.js");
  const tryStyles = opt("try") ? opt("try").split(",") : null, out = opt("out");
  if (tryStyles && !out) throw new Error("--try needs --out=<dir>");
  for (const s of tryStyles || []) if (!STYLES[s]) throw new Error("no layout " + s + " (" + Object.keys(STYLES).join(", ") + ")");
  const cd = await launch({ prefix: "og-", args: ["--hide-scrollbars"] });
  try {
    const shots = await takeAll(cd, wanted);
    for (const id of wanted) {
      const f = facts(id), sh = shots[id];
      const shot = { src: "data:image/png;base64," + sh.png.toString("base64"), w: sh.w, h: sh.h };
      if (tryStyles) {
        for (const s of tryStyles) {
          const p = path.join(out, s + "-" + id + ".png");
          fs.writeFileSync(p, await render(cd, STYLES[s](f, shot)));
          console.log(p);
        }
        continue;
      }
      const png = await render(cd, STYLES[STYLE](f, shot));
      fs.writeFileSync(asset(id, "og.png"), png);
      fs.writeFileSync(asset(id, "og.json"), JSON.stringify({ style: STYLE, sha: kit.sha(png), shows: key(f) }, null, 1) + "\n");
      console.log(path.relative(kit.REPO, asset(id, "og.png")).padEnd(34), kit.kB(png.length));
    }
  } finally { await cd.close(); }
}

if (argv.includes("--check")) check();
else make().catch(e => { console.error(e.message); process.exit(1); });
