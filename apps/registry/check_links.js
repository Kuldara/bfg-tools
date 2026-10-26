/* Friends' fleet links opened one after another, in a real browser (J240).

     node apps/registry/check_links.js        (part of npm test; needs dist/)

   The user 26.10.2026: a friend's fleet link opened once, and the next links
   opened the same fleet again. Three causes, each a step here:
     1. a second link in the same tab changes only the part after # and does
        not reload the page - the page has to hear it (hashchange);
     2. the first link's fleet stayed unsaved on its list and blocked every
        later link of that list - each link must open its own fleet and keep
        it in Saved fleets;
     3. an older tab of the page wrote its state over a newer tab's at its
        next change - the tabs must follow each other's saves.
   test_save.js checks the same order of links in Node; this one checks what
   only a browser does: the address, two tabs sharing storage, the events. */
"use strict";
const fs = require("fs"), path = require("path");
const { launch } = require("../../tools/lib/chrome.js");
const { serve } = require("../../tools/serve.js");

const PAGE = path.resolve(__dirname, "..", "..", "dist", "registry", "index.html");
if (!fs.existsSync(PAGE)) { console.error("dist/registry/index.html is missing: run npm run build"); process.exit(1); }

/* three links made by the page itself: A and B on one list, C on another */
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
  const out = {
    A: await mk("Friend A", /Gothic Sector/, [[/^Cruisers$/, /^Lunar/], [/^Cruisers$/, /^Lunar/]]),
    B: await mk("Friend B", /Gothic Sector/, [[/^Cruisers$/, /^Dauntless/], [/^Cruisers$/, /^Dauntless/], [/^Cruisers$/, /^Dauntless/]]),
    C: await mk("Friend C", /Waaagh/, [[/^KROOZERS$/, /^Terror ship/]])
  };
  localStorage.clear();
  return out;
})()`;
/* what the player sees in a tab */
const STATE = `(() => {
  const S = GFR.appState.S, L = GFR.LISTS[S.li];
  return { list: L.nm.replace(/^.* \\u2014 /, ""), units: S.units.map(u => GFR.entOf(u).l.replace(/ class.*$/, "")),
           saved: GFR.libRead().saves.map(s => s.name).sort(), hash: location.hash, errors: (window.__errs || []).slice() };
})()`;
const ERRS = "window.__errs = []; addEventListener('error', e => __errs.push(String(e.message)));";

let pass = 0, fail = 0;
const check = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  console.log("  " + (ok ? "PASS" : "FAIL") + "  " + name + "  ->  " + JSON.stringify(got) + (ok ? "" : "   expected " + JSON.stringify(want)));
  ok ? pass++ : fail++;
};
const sleep = ms => new Promise(r => setTimeout(r, ms));
/* the page answers on its own time (a link is unpacked asynchronously, another
   tab's save arrives as an event): wait until the expression is true */
async function until(tab, expr, ms) {
  const end = Date.now() + (ms || 8000);
  for (;;) {
    if (await tab.evaluate("(() => { try { return !!(" + expr + "); } catch (e) { return false; } })()")) return true;
    if (Date.now() > end) return false;
    await sleep(100);
  }
}
async function open(tab, url) {
  const loaded = tab.once("Page.loadEventFired");
  await tab.send("Page.navigate", { url });
  await loaded;
  await until(tab, "window.GFR && GFR.appState && GFR.appState.S");
}
const shows = (list, n) => `GFR.appState.S.units.length === ${n} && GFR.LISTS[GFR.appState.S.li].nm.indexOf(${JSON.stringify(list)}) >= 0 && !location.hash`;

(async () => {
  const server = await serve(0, true);
  const URL0 = "http://127.0.0.1:" + server.address().port + "/registry/";
  const cd = await launch({ prefix: "gfr-links-", args: ["--window-size=1200,900"] });
  let tab2 = null;
  try {
    const tab1 = cd;
    await tab1.send("Page.enable");
    await tab1.send("Page.addScriptToEvaluateOnNewDocument", { source: ERRS });
    await open(tab1, URL0);
    const L = await tab1.evaluate(MAKE);

    console.log("\nOne tab, links one after another");
    await open(tab1, "about:blank");
    await open(tab1, URL0 + "#" + L.A);
    await until(tab1, shows("Gothic Sector", 2));
    check("A opens (a fresh page)", await tab1.evaluate(STATE),
          { list: "Gothic Sector", units: ["Lunar", "Lunar"], saved: ["Friend A"], hash: "", errors: [] });
    await tab1.evaluate("location.hash = " + JSON.stringify(L.B));
    await until(tab1, shows("Gothic Sector", 3));
    check("B in the same tab opens (only the # changed; it used to do nothing)", await tab1.evaluate(STATE),
          { list: "Gothic Sector", units: ["Dauntless", "Dauntless", "Dauntless"], saved: ["Friend A", "Friend B"], hash: "", errors: [] });
    await open(tab1, "about:blank");
    await open(tab1, URL0 + "#" + L.C);
    await until(tab1, shows("Waaagh", 1));
    check("C of another list opens", await tab1.evaluate(STATE),
          { list: "Waaagh!", units: ["Terror ship"], saved: ["Friend A", "Friend B", "Friend C"], hash: "", errors: [] });
    await open(tab1, "about:blank");
    await open(tab1, URL0 + "#" + L.B);
    await until(tab1, shows("Gothic Sector", 3));
    check("B again on a fresh page opens B, not the fleet before it", (await tab1.evaluate(STATE)).units, ["Dauntless", "Dauntless", "Dauntless"]);

    console.log("\nTwo tabs");
    tab2 = await cd.newPage("about:blank");
    await tab2.send("Page.enable");
    await tab2.send("Page.addScriptToEvaluateOnNewDocument", { source: ERRS });
    await open(tab2, URL0);
    check("a second tab opens on what the first saved", (await tab2.evaluate(STATE)).units, ["Dauntless", "Dauntless", "Dauntless"]);
    await tab1.evaluate("location.hash = " + JSON.stringify(L.A));
    await until(tab1, shows("Gothic Sector", 2));
    const followed = await until(tab2, "GFR.appState.S.units.length === 2");
    check("the second tab follows the first's link", [followed, (await tab2.evaluate(STATE)).units], [true, ["Lunar", "Lunar"]]);
    /* the player adds a ship in the second tab; the first must not write its older state back */
    await tab2.evaluate(`(() => { const L = GFR.LISTS[GFR.appState.S.li]; const si = L.secs.findIndex(s => /^Cruisers$/.test(s.t));
      GFR.addUnit(si, L.secs[si].ents.findIndex(e => /^Lunar/.test(e.l))); })()`);
    const back = await until(tab1, "GFR.appState.S.units.length === 3");
    check("the first tab follows the second's change", [back, (await tab1.evaluate(STATE)).units], [true, ["Lunar", "Lunar", "Lunar"]]);
    await tab1.evaluate("GFR.render()");
    await open(tab1, URL0);
    const end = await tab1.evaluate(STATE);
    check("after a reload: the last change stands, every friend's fleet is saved",
          [end.units, end.saved], [["Lunar", "Lunar", "Lunar"], ["Friend A", "Friend B", "Friend C"]]);
    check("no errors on the pages", [end.errors, (await tab2.evaluate(STATE)).errors], [[], []]);
  } catch (e) {
    console.log("  FAIL  " + (e && e.stack || e)); fail++;
  } finally {
    if (tab2) tab2.close();
    cd.close();
    server.close();
  }
  console.log("\n" + pass + " passed, " + fail + " failed");
  process.exit(fail ? 1 : 0);
})();
