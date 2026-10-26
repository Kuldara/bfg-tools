/* The downloadable editable card sheet, run as a user would: in a headless
   Chrome the built page builds a fleet, "Download for editing" is pressed and
   the file it makes is opened in a second page, where the fitting runs, an
   edit refits and a tick box toggles.

     node apps/registry/check_editable.js        (part of npm test; needs dist/)

   Why a browser: download-editable.js copies fitCards into the file as source
   (fitCards.toString()). After the bundling that body comes from esbuild, and
   if it ever called another module's helper or a renamed $, the file would
   break silently while every Node test stayed green (finding L27, 26.10.2026). */
"use strict";
const fs = require("fs"), path = require("path"), os = require("os");
const { launch } = require("../../tools/lib/chrome.js");

const PAGE = path.resolve(__dirname, "..", "..", "dist", "registry", "index.html");
if (!fs.existsSync(PAGE)) { console.error("dist/registry/index.html is missing: run npm run build"); process.exit(1); }
const fileUrl = p => "file:///" + encodeURI(p.replace(/\\/g, "/"));

/* a fleet with squadrons, options, a commander and defences, then the download */
const MAKE = `(async () => {
  const L = GFR.LISTS.findIndex(x => /Gothic Sector/.test(x.nm));
  const S = GFR.appState.S; S.li = L; S.units = []; S.limit = 2000;
  const add = (sec, ent) => GFR.addUnit(sec, ent);
  const list = GFR.LISTS[L];
  const find = (secRe, entRe) => { const si = list.secs.findIndex(s => secRe.test(s.t)); const ei = list.secs[si].ents.findIndex(e => entRe.test(e.l)); return [si, ei]; };
  add(...find(/^Admiral/, /^Admiral/)); add(...find(/^Battleships/, /Emperor/)); add(...find(/^Cruisers/, /Lunar/)); add(...find(/^Cruisers/, /Lunar/));
  add(...find(/^ESCORTS/, /Sword/)); S.units[S.units.length - 1].n = 3;
  add(...find(/PLANETARY DEFENCES/, /Orbital defence laser/));
  S.units[2].sq = "A"; S.units[3].sq = "A";
  GFR.render();
  const cap = []; const orig = HTMLAnchorElement.prototype.click;
  HTMLAnchorElement.prototype.click = function () { cap.push(this.href); };
  try { GFR.downloadEditable(); } finally { HTMLAnchorElement.prototype.click = orig; }
  if (cap.length !== 1) throw new Error("expected one download, got " + cap.length);
  return await (await fetch(cap[0])).text();
})()`;
/* in the downloaded file: the fitting, an edit, a tick */
const CHECK = `(async () => {
  await document.fonts.ready;
  const wait = ms => new Promise(r => setTimeout(r, ms));
  await wait(300);
  const fit = () => [...document.querySelectorAll(".fit-content")].map(c => (c.dataset.fitScale || "-") + (c.dataset.fitOverflow === "true" ? "!" : ""));
  const before = fit();
  const h3 = document.querySelector(".page[contenteditable] .k-hd h3");
  if (!h3) throw new Error("no editable card heading");
  h3.textContent = h3.textContent + " WITH A MUCH LONGER NAME THAN BEFORE";
  h3.dispatchEvent(new Event("input", { bubbles: true }));
  await wait(600);
  const after = fit();
  const cb = document.querySelector(".k-opt .cb"); const was = cb && cb.classList.contains("on"); if (cb) cb.click();
  return { errors: window.__errs, boxes: before.length, overflowBefore: before.filter(x => x.endsWith("!")).length,
    overflowAfter: after.filter(x => x.endsWith("!")).length, unfitted: before.filter(x => x === "-").length,
    refitRan: after.length === before.length, tickToggles: cb ? cb.classList.contains("on") !== was : null,
    editable: document.querySelectorAll("[contenteditable]").length, bar: !!document.querySelector(".edbar") };
})()`;

(async () => {
  const cd = await launch({ prefix: "gfr-editable-", args: ["--window-size=1200,900"] });
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "gfr-editable-"));
  let ok = true;
  try {
    await cd.send("Page.enable");
    await cd.send("Page.navigate", { url: fileUrl(PAGE) });
    await cd.once("Page.loadEventFired");
    await new Promise(r => setTimeout(r, 500));
    const html = await cd.evaluate(MAKE);
    const file = path.join(tmp, "editable.html");
    fs.writeFileSync(file, html.replace("<head>", "<head><scr" + "ipt>window.__errs=[];addEventListener('error',e=>__errs.push(String(e.message)))</scr" + "ipt>"), "utf8");
    await cd.send("Page.navigate", { url: fileUrl(file) });
    await cd.once("Page.loadEventFired");
    const r = await cd.evaluate(CHECK);
    const problems = [];
    if (r.errors.length) problems.push("errors on the page: " + r.errors.join(" | "));
    if (!r.boxes) problems.push("no fitted boxes");
    if (r.unfitted) problems.push(r.unfitted + " boxes never fitted");
    if (r.overflowBefore || r.overflowAfter) problems.push("overflow: " + r.overflowBefore + " before the edit, " + r.overflowAfter + " after");
    if (!r.refitRan) problems.push("the refit after an edit did not run");
    if (r.tickToggles === false) problems.push("a tick box does not toggle");
    if (!r.editable || !r.bar) problems.push("the page is not editable or has no toolbar");
    ok = !problems.length;
    console.log(`editable sheet: ${(html.length / 1024).toFixed(0)} kB, ${r.boxes} fitted boxes, ${r.editable} editable pages, tick ${r.tickToggles ? "toggles" : "n/a"}`);
    problems.forEach(p => console.log("  ERROR " + p));
  } finally { cd.close(); fs.rmSync(tmp, { recursive: true, force: true }); }
  console.log(ok ? "RESULT: 0 errors" : "RESULT: errors");
  process.exit(ok ? 0 : 1);
})().catch(e => { console.error(e.message); process.exit(1); });
