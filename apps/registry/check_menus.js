/* The top bar's menus in a real browser.

     node apps/registry/check_menus.js        (part of npm test; needs dist/)

   The user 2.11.2026: panels on top of each other, in changing places, now and
   then off the screen. At a wide, a middle and a phone width: each menu opens
   at the same top and right edge, opening one closes the other, and the panel
   stays inside the window, also with the page scrolled to its end. */
"use strict";
const fs = require("fs"), path = require("path");
const { launch } = require("../../tools/lib/chrome.js");

const PAGE = path.resolve(__dirname, "..", "..", "dist", "registry", "index.html");
if (!fs.existsSync(PAGE)) { console.error("dist/registry/index.html is missing: run npm run build"); process.exit(1); }
const fileUrl = p => "file:///" + encodeURI(p.replace(/\\/g, "/"));

let pass = 0, fail = 0;
const check = (name, ok, got) => {
  console.log("  " + (ok ? "PASS" : "FAIL") + "  " + name + (ok ? "" : "  ->  " + JSON.stringify(got)));
  ok ? pass++ : fail++;
};

const MENUS = [["#savenow", "#savebody"], ["#saves", "#savesbody"], ["#printset", "#printbody"]];
/* Open each menu with its own summary; where it landed and what else is open. */
const SWEEP = `(async () => {
  const out = [];
  for (const [d, p] of ${JSON.stringify(MENUS)}) {
    document.querySelector(d + " > summary").click();
    await new Promise(r => setTimeout(r, 60));
    const b = document.querySelector(p).getBoundingClientRect();
    out.push({ d, top: Math.round(b.top), right: Math.round(b.right), left: Math.round(b.left), bottom: Math.round(b.bottom),
      open: [...document.querySelectorAll("details[name=topmenu][open]")].map(x => "#" + x.id) });
  }
  document.querySelector("#printset").open = false;
  return JSON.stringify({ out, w: document.documentElement.clientWidth, h: document.documentElement.clientHeight });
})()`;

(async () => {
  const cd = await launch({ prefix: "gfr-menus-", args: ["--window-size=1300,950", "--hide-scrollbars"] });
  try {
    await cd.send("Page.enable");
    const loaded = cd.once("Page.loadEventFired");
    await cd.send("Page.navigate", { url: fileUrl(PAGE) });
    await loaded;
    await cd.evaluate(`(() => { const G = GFR, S = G.appState.S; S.units = []; for(let i = 0; i < 12; i++) G.addUnit(1, 0); G.render(); return 1; })()`);
    for (const [width, height] of [[1600, 900], [1000, 700], [390, 800]]) {
      await cd.send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: false });
      await new Promise(r => setTimeout(r, 120));
      for (const at of ["the top", "the end"]) {
        await cd.evaluate(at === "the top" ? "scrollTo(0, 0); 1" : "scrollTo(0, document.documentElement.scrollHeight); 1");
        await new Promise(r => setTimeout(r, 60));
        const { out, w, h } = JSON.parse(await cd.evaluate(SWEEP));
        const where = width + " px, " + at + ": ";
        check(where + "one menu open at a time", out.every(o => o.open.length === 1 && o.open[0] === o.d), out);
        check(where + "the same top and right edge", new Set(out.map(o => o.top + "," + o.right)).size === 1, out);
        check(where + "inside the window", out.every(o => o.left >= 0 && o.right <= w && o.top >= 0 && o.bottom <= h), { out, w, h });
        check(where + "a menu's width, not the window's", out.every(o => o.right - o.left <= 680), out);
      }
    }
    /* Reopen (user 2.11.2026): the open fleet's row is first and marked, and its
       button brings back the saved version over the changes on the screen */
    await cd.send("Emulation.setDeviceMetricsOverride", { width: 1300, height: 800, deviceScaleFactor: 1, mobile: false });
    const r = JSON.parse(await cd.evaluate(`(async () => {
      const G = GFR, S = () => G.appState.S, w = () => new Promise(r => setTimeout(r, 60));
      S().units = []; G.addUnit(1, 0); G.addUnit(1, 0); G.render();
      const mine = G.saveOpenAs("Mine", true); G.render();
      const other = G.saveOpenAs("Other", true); G.saveOpenAs("Mine", false);
      G.libOpen(mine.id); G.addUnit(1, 0); G.render(); await w();
      document.querySelector("#saves > summary").click(); await w();
      const first = document.querySelector("#savesbody .sf-row"), btn = first.querySelector("button[data-libopen]");
      const asked = []; window.confirm = t => { asked.push(t); return true; };
      const before = S().units.length;
      const out = { first: first.querySelector(".sf-nm b").textContent, marked: first.classList.contains("open"), tag: first.querySelector(".sf-tag.on").textContent,
        label: btn.textContent, before };
      btn.click(); await w();
      out.after = S().units.length; out.asked = asked.length; out.closed = !document.querySelector("#saves").open;
      out.unsaved = G.openUnsaved();
      return JSON.stringify(out);
    })()`));
    check("the open fleet's row is first and marked", r.first === "Mine" && r.marked && r.tag === "open, changed", r);
    check("its button is Reopen", r.label === "Reopen", r);
    check("Reopen brings back the saved fleet, after the one question", r.before === r.after + 1 && r.asked === 1 && r.closed && r.unsaved === false, r);
  } catch (e) {
    console.log("  FAIL  " + (e && e.stack || e)); fail++;
  } finally {
    cd.close();
  }
  console.log("\n" + pass + " passed, " + fail + " failed");
  process.exit(fail ? 1 : 0);
})();
