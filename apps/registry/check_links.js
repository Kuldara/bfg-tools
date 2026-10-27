/* Friends' fleet links, in a real browser (J240, J241).

     node apps/registry/check_links.js        (part of npm test; needs dist/)

   The user 26.10.2026: a friend's fleet link opened once, and the next links
   opened the same fleet again. Then: "clicking a share link should always open
   that link's fleet; no need to save it automatically", "even if you click
   four different links, each tab has its own fleet open", and a simple
   dialog: open the link's fleet or save it, with a warning before Open
   replaces your own. This drives the built page as a player would, over http
   so that the address, the tabs and their storage behave as on the web:
     - four links in four tabs: each tab opens its own fleet and keeps it,
       also after a reload, and the player's own tab is left alone;
     - the dialog warns when Open would replace a fleet that is not saved,
       and not when the list is empty;
     - a second link in the same tab (only the # changes) shows the dialog;
       Save puts the fleet in Saved fleets and leaves the screen as it was;
     - the other tabs' Saved fleets lists see the new save;
     - Play opened from a tab plays that tab's fleet.
   test_save.js checks the same decisions in Node. */
"use strict";
const fs = require("fs"), path = require("path");
const { launch } = require("../../tools/lib/chrome.js");
const { serve } = require("../../tools/serve.js");

const PAGE = path.resolve(__dirname, "..", "..", "dist", "registry", "index.html");
if (!fs.existsSync(PAGE)) { console.error("dist/registry/index.html is missing: run npm run build"); process.exit(1); }

/* the links, made by the page itself; then the player's own fleet in tab 1 */
const MAKE = `(async () => {
  const mk = async (name, listRe, rows) => {
    const li = GFR.LISTS.findIndex(x => listRe.test(x.nm));
    GFR.switchList(li); GFR.appState.S.units = [];
    const L = GFR.LISTS[li];
    rows.forEach(([secRe, entRe]) => {
      const si = L.secs.findIndex(s => secRe.test(s.t)), ei = si < 0 ? -1 : L.secs[si].ents.findIndex(e => entRe.test(e.l));
      if (ei < 0) throw new Error("no row " + entRe + " on " + L.nm);
      GFR.addUnit(si, ei);
    });
    const d = GFR.openDoc();
    return await GFR.packFleet({ name: name, ln: d.ln, limit: d.limit, units: d.units });
  };
  const G = /Gothic Sector/, C = /^Cruisers$/;
  const out = {
    A: await mk("Friend A", G, [[C, /^Lunar/], [C, /^Lunar/]]),
    B: await mk("Friend B", G, [[C, /^Dauntless/], [C, /^Dauntless/], [C, /^Dauntless/]]),
    C: await mk("Friend C", /Waaagh/, [[/^KROOZERS$/, /^Terror ship/]]),
    D: await mk("Friend D", G, [[C, /^Gothic/], [C, /^Gothic/], [C, /^Gothic/], [C, /^Gothic/]])
  };
  localStorage.clear(); sessionStorage.clear();
  GFR.switchList(GFR.LISTS.findIndex(x => G.test(x.nm))); GFR.appState.S.units = [];
  const L = GFR.LISTS[GFR.appState.S.li], si = L.secs.findIndex(s => C.test(s.t));
  GFR.addUnit(si, L.secs[si].ents.findIndex(e => /^Tyrant/.test(e.l)));
  return out;
})()`;
const STATE = `(() => {
  const S = GFR.appState.S, L = GFR.LISTS[S.li];
  return { list: L.nm.replace(/^.* \\u2014 /, ""), units: S.units.map(u => GFR.entOf(u).l.replace(/ class.*$/, "")) };
})()`;
const DIALOG = `(() => {
  const d = document.getElementById("linkdlg");
  return { shown: !!d && !d.hidden, name: (d.querySelector(".ld-what b") || {}).textContent || "",
           warn: !!d.querySelector(".ld-warn"), msg: (d.querySelector(".ld-msg") || {}).textContent || "",
           saveDisabled: !!(d.querySelector('[data-link="save"]') || {}).disabled,
           buttons: [...d.querySelectorAll("button[data-link]")].map(b => b.dataset.link) };
})()`;
const press = what => `document.querySelector('#linkdlg [data-link="${what}"]').click()`;
const ERRS = "window.__errs = []; addEventListener('error', e => __errs.push(String(e.message)));";

let pass = 0, fail = 0;
const check = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  console.log("  " + (ok ? "PASS" : "FAIL") + "  " + name + "  ->  " + JSON.stringify(got) + (ok ? "" : "   expected " + JSON.stringify(want)));
  ok ? pass++ : fail++;
};
const sleep = ms => new Promise(r => setTimeout(r, ms));
/* the page answers on its own time (a link is unpacked asynchronously,
   another tab's save arrives as an event): wait until the expression holds */
async function until(tab, expr, ms) {
  const end = Date.now() + (ms || 8000);
  for (;;) {
    if (await tab.evaluate("(() => { try { return !!(" + expr + "); } catch (e) { return false; } })()")) return true;
    if (Date.now() > end) return false;
    await sleep(100);
  }
}
async function open(tab, url, ready) {
  const loaded = tab.once("Page.loadEventFired");
  await tab.send("Page.navigate", { url });
  await loaded;
  await until(tab, ready || "window.GFR && GFR.appState && GFR.appState.S");
}
const dialogUp = `!document.getElementById("linkdlg").hidden`;

(async () => {
  const server = await serve(0, true);
  const URL0 = "http://127.0.0.1:" + server.address().port + "/registry/";
  const cd = await launch({ prefix: "gfr-links-", args: ["--window-size=1200,900"] });
  const tabs = [];
  const newTab = async () => {
    const t = await cd.newPage("about:blank");
    await t.send("Page.enable");
    await t.send("Page.addScriptToEvaluateOnNewDocument", { source: ERRS });
    tabs.push(t);
    return t;
  };
  try {
    const t1 = cd;
    await t1.send("Page.enable");
    await t1.send("Page.addScriptToEvaluateOnNewDocument", { source: ERRS });
    await open(t1, URL0);
    const L = await t1.evaluate(MAKE);
    await until(t1, "localStorage.getItem('gothic-fleet-registry-v1')");

    console.log("\nFour links, four tabs");
    const opened = {};
    /* A: "Save mine, then open"; the others "Open over mine" or plain Open */
    for (const [k, n, act] of [["A", 2, "keepopen"], ["B", 3, "open"], ["C", 1, "open"], ["D", 4, "open"]]) {
      const t = await newTab();
      await open(t, URL0 + "#" + L[k], "window.GFR && " + dialogUp);
      const d = await t.evaluate(DIALOG);
      await t.evaluate(press(act));
      await until(t, "GFR.appState.S.units.length === " + n + " && document.getElementById('linkdlg').hidden");
      opened[k] = { t, d, s: await t.evaluate(STATE) };
    }
    check("the dialog names the link's fleet", ["A", "B", "C", "D"].map(k => opened[k].d.name), ["Friend A", "Friend B", "Friend C", "Friend D"]);
    check("it warns when Open replaces an unsaved fleet of the list, not when the list is empty",
          ["A", "B", "C", "D"].map(k => opened[k].d.warn), [true, true, false, true]);
    check("with an unsaved fleet the choice is Save mine, then open / Open over mine; else Open it",
          [opened.A.d.buttons, opened.C.d.buttons], [["keepopen", "open", "save", "close"], ["open", "save", "close"]]);
    const kept = await opened.A.t.evaluate("GFR.libRead().saves.map(s => s.name + ':' + s.units.length)");
    check("Save mine, then open kept the player's own fleet in Saved fleets", kept, ["Imperial Navy — Gothic Sector 185:1"]);
    check("each tab opened its own link's fleet", ["A", "B", "C", "D"].map(k => opened[k].s.units[0] + " x" + opened[k].s.units.length),
          ["Lunar x2", "Dauntless x3", "Terror ship x1", "Gothic x4"]);
    const now = [];
    for (const k of ["A", "B", "C", "D"]) now.push((await opened[k].t.evaluate(STATE)).units.length);
    check("... and still has it after the other three opened theirs", now, [2, 3, 1, 4]);
    check("the player's own tab is left alone", (await t1.evaluate(STATE)).units, ["Tyrant"]);
    await open(opened.A.t, URL0);
    check("a reload brings back the tab's own fleet", (await opened.A.t.evaluate(STATE)).units, ["Lunar", "Lunar"]);

    console.log("\nA second link in the same tab, and Save");
    const tB = opened.B.t;
    await tB.evaluate("location.hash = " + JSON.stringify(L.A));
    const shownAgain = await until(tB, dialogUp);
    await tB.evaluate(press("save"));
    await until(tB, `document.querySelector('#linkdlg .ld-msg')`);
    const ds = await tB.evaluate(DIALOG);
    check("the dialog comes up for a link in an open tab; Save answers in it", [shownAgain, ds.shown, /^Saved Friend A/.test(ds.msg), ds.saveDisabled], [true, true, true, true]);
    await tB.evaluate(press("close"));
    check("Close closes it, and the screen kept its fleet", [await tB.evaluate("document.getElementById('linkdlg').hidden"), (await tB.evaluate(STATE)).units.length], [true, 3]);
    check("Saved fleets in that tab", await tB.evaluate("GFR.libRead().saves.map(s => s.name)"), ["Friend A", "Imperial Navy — Gothic Sector 185"]);
    const seen = await until(t1, "document.getElementById('savescount').textContent === '2'");
    check("the other tabs' Saved fleets list sees it", [seen, (await t1.evaluate(STATE)).units], [true, ["Tyrant"]]);

    console.log("\nPlay from a tab");
    const tD = opened.D.t;
    await open(tD, URL0 + "play/Gothic%20Fleet%20Play.html", "window.GFP && GFP.builderFleets");
    /* Play lists Saved fleets too (Friend A, saved above); the builder's own
       fleet is the one not saved */
    const pf = await tD.evaluate("GFP.builderFleets().filter(f => !f.saved && /Gothic Sector/.test(f.ln)).map(f => f.units.length)");
    check("Play plays the tab's fleet (Friend D's four Gothics), not the last saved", pf, [4]);

    const errs = [];
    for (const t of [t1].concat(tabs)) errs.push(...(await t.evaluate("(window.__errs || []).slice()")));
    check("no errors on the pages", errs, []);
  } catch (e) {
    console.log("  FAIL  " + (e && e.stack || e)); fail++;
  } finally {
    tabs.forEach(t => t.close());
    cd.close();
    server.close();
  }
  console.log("\n" + pass + " passed, " + fail + " failed");
  process.exit(fail ? 1 : 0);
})();
