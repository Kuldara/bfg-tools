/* The ship info popup (src/info.js), in a real browser.

     node apps/registry/check_info.js        (part of npm test; needs dist/)

   The user 28.10.2026 wanted an "i" beside a ship's class that opens
   everything about the ship, its card above all; prototype C was chosen:
   the printed card on a wide screen, the details laid out for a phone with
   one button for the card. This drives the built page:
     - every ship row of every list opens, as its card (made and fitted as
       for printing, nothing overflowing) and as its details (every weapon
       row there);
     - a ship in the fleet shows its own choices and name, a mixed squadron
       its one card;
     - in Compact the i opens the popup and leaves the unit as it was;
     - x, a tap outside and Escape close it;
     - on a phone's width the details open first and "Printed card" shows
       the card;
     - a borrowed list's row is a ship of that list. */
"use strict";
const fs = require("fs"), path = require("path");
const { launch } = require("../../tools/lib/chrome.js");

const PAGE = path.resolve(__dirname, "..", "..", "dist", "registry", "index.html");
if (!fs.existsSync(PAGE)) { console.error("dist/registry/index.html is missing: run npm run build"); process.exit(1); }
const fileUrl = p => "file:///" + encodeURI(p.replace(/\\/g, "/"));

let pass = 0, fail = 0;
const check = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  console.log("  " + (ok ? "PASS" : "FAIL") + "  " + name + "  ->  " + JSON.stringify(got).slice(0, 300) + (ok ? "" : "   expected " + JSON.stringify(want)));
  ok ? pass++ : fail++;
};

/* every ship row of every list, both views; the rows that went wrong */
const ALL_ROWS = `(() => {
  const G = GFR, bad = [];
  let rows = 0, cards = 0;
  G.LISTS.forEach((L, li) => {
    G.switchList(li); G.appState.S.units = []; G.render();
    L.secs.forEach((sec, si) => sec.ents.forEach((en, ei) => {
      if (!G.rowHasInfo(en) || G.isUpgradeEnt(en)) return;
      const key = "c:" + li + "." + si + "." + ei, where = L.nm + " / " + en.l;
      rows++;
      if (!G.showInfo(key, "card")) { bad.push(where + ": no popup"); return; }
      const d = document.getElementById("infodlg"), ks = d.querySelectorAll(".if-card .k");
      cards += ks.length;
      if (d.hidden || !ks.length) bad.push(where + ": no card");
      if (d.querySelector('.k[data-content-overflow="true"]')) bad.push(where + ": the card overflows");
      const R = G.resolveUnit(G.newUnit(li, si, ei, null));
      G.showInfo(key, "details");
      const arm = d.querySelectorAll(".if-arm tbody tr").length;
      if (!d.querySelector(".if-stats")) bad.push(where + ": no profile");
      if (arm !== (R.weapons || []).length) bad.push(where + ": weapons " + arm + " of " + (R.weapons || []).length);
      G.closeInfo();
    }));
  });
  return { rows, cards, bad: bad.slice(0, 12), nbad: bad.length,
           buttons: (G.switchList(0), G.render(), document.querySelectorAll('#cat .ibtn, .ibtn[data-info^="c:"]').length) };
})()`;

/* a Gothic Sector fleet: a named Lunar with its nova cannon, and squadron B */
const FLEET = `(() => {
  const G = GFR, li = G.LISTS.findIndex(L => /Gothic Sector/.test(L.nm) && /Imperial/.test(L.nm));
  G.switchList(li); G.appState.S.units = [];
  const L = G.LISTS[li], at = re => { let r = null; L.secs.forEach((s, si) => s.ents.forEach((e, ei) => { if (!r && e.r && re.test(e.l)) r = [si, ei]; })); return r; };
  const add = (re, n, sq, name) => { const [si, ei] = at(re); G.addUnit(si, ei); const u = G.appState.S.units[G.appState.S.units.length - 1];
    u.n = n; if (sq) u.sq = sq; if (name) u.name = name; return u; };
  const lunar = add(/^Lunar class cruiser$/, 1, null, "Emperor's Wrath");
  const nova = G.resolveUnit(lunar).options.filter(o => /nova cannon/i.test(o.text))[0];
  G.setOptState(lunar, nova.index, "take");
  add(/^Cobra/, 3, "B"); add(/^Sword/, 2, "B"); add(/^Firestorm/, 1, "B");
  G.render();
  return li;
})()`;
const DLG = `(() => { const d = document.getElementById("infodlg");
  return { shown: !d.hidden, title: (d.querySelector(".if-hd b") || {}).textContent || "",
    cards: [...d.querySelectorAll(".if-card .k")].map(k => k.dataset.card || "ship"),
    h3: [...d.querySelectorAll(".if-card .k-hd h3")].map(h => h.textContent.trim()),
    pts: [...d.querySelectorAll(".if-card .k-hd .pts i")].map(i => i.textContent.trim()),
    details: !!d.querySelector(".if-stats"), cardBtn: !!d.querySelector("[data-iview]") }; })()`;
const click = sel => `(() => { const e = document.querySelector(${JSON.stringify(sel)}); if (!e) return false; e.click(); return true; })()`;

(async () => {
  const cd = await launch({ prefix: "gfr-info-", args: ["--window-size=1300,950", "--hide-scrollbars"] });
  try {
    await cd.send("Page.enable");
    await cd.send("Emulation.setDeviceMetricsOverride", { width: 1300, height: 950, deviceScaleFactor: 1, mobile: false });
    const loaded = cd.once("Page.loadEventFired");
    await cd.send("Page.navigate", { url: fileUrl(PAGE) });
    await loaded;
    await cd.evaluate("window.__errs = []; addEventListener('error', e => __errs.push(String(e.message))); document.fonts.ready.then(() => true)");

    const all = JSON.parse(await cd.evaluate("JSON.stringify(" + ALL_ROWS + ")"));
    console.log("  ship rows " + all.rows + ", cards " + all.cards + ", catalogue buttons on the first list " + all.buttons);
    check("every ship row opens as its card and its details", all.bad, []);
    check("the catalogue has its i buttons", all.buttons > 10, true);

    await cd.evaluate(FLEET);
    check("a ship in the fleet has its i", await cd.evaluate(click('.unit[data-ui="0"] .ibtn')), true);
    const d1 = JSON.parse(await cd.evaluate("JSON.stringify(" + DLG + ")"));
    check("the fleet's Lunar: its card, its name, its price with the nova cannon",
      [d1.shown, d1.cards, d1.h3, d1.pts], [true, ["ship"], ["Emperor's Wrath"], ["200"]]);
    check("x closes it", [await cd.evaluate(click("#infodlg [data-iclose]")), await cd.evaluate("document.getElementById('infodlg').hidden")], [true, true]);

    check("the mixed squadron's row has its i", await cd.evaluate(click('.unit.mixg .ibtn')), true);
    const d2 = JSON.parse(await cd.evaluate("JSON.stringify(" + DLG + ")"));
    check("squadron B: its one card", [d2.title, d2.cards], ["Escort squadron B", ["mixed"]]);
    await cd.evaluate("document.getElementById('infodlg').click()");
    check("a tap outside closes it", await cd.evaluate("document.getElementById('infodlg').hidden"), true);

    /* Compact: the class name opens and closes the unit, the i only opens the popup */
    await cd.evaluate("(GFR.appState.FLEET_FOLD = true, GFR.render(), true)");
    const before = await cd.evaluate("document.querySelector('.unit[data-ui=\"0\"]').className");
    await cd.evaluate(click('.unit[data-ui="0"] .ibtn'));
    check("in Compact the i opens the popup and leaves the unit as it was",
      [await cd.evaluate("!document.getElementById('infodlg').hidden"), await cd.evaluate("document.querySelector('.unit[data-ui=\"0\"]').className")],
      [true, before]);
    await cd.evaluate("document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))");
    check("Escape closes it", await cd.evaluate("document.getElementById('infodlg').hidden"), true);
    await cd.evaluate("(GFR.appState.FLEET_FOLD = false, GFR.render(), true)");

    /* a phone: the details first, the card one tap away */
    await cd.send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
    await cd.evaluate(click('.unit[data-ui="0"] .ibtn'));
    const d3 = JSON.parse(await cd.evaluate("JSON.stringify(" + DLG + ")"));
    check("on a phone the details open first, with the card's button", [d3.shown, d3.details, d3.cardBtn, d3.cards.length], [true, true, true, 0]);
    await cd.evaluate(click("#infodlg [data-iview]"));
    const d4 = JSON.parse(await cd.evaluate("JSON.stringify(" + DLG + ")"));
    check("Printed card shows the card", [d4.cards, d4.h3], [["ship"], ["Emperor's Wrath"]]);
    const fits = await cd.evaluate("(() => { const b = document.querySelector('#infodlg .if-box').getBoundingClientRect(); return b.left >= 0 && b.right <= innerWidth; })()");
    check("the popup fits the phone's width", fits, true);
    await cd.evaluate("GFR.closeInfo()");
    await cd.send("Emulation.setDeviceMetricsOverride", { width: 1300, height: 950, deviceScaleFactor: 1, mobile: false });

    /* a borrowed list's row: the ship of that list, as + would add it */
    const borrowed = await cd.evaluate(`(() => {
      const G = GFR, li = G.LISTS.findIndex(L => /Bakka/.test(L.nm)), L = G.LISTS[li];
      let key = null; L.secs.forEach((s, si) => s.ents.forEach((e, ei) => { if (!key && G.rowHasInfo(e) && !G.isUpgradeEnt(e)) key = "c:" + li + "." + si + "." + ei; }));
      G.showInfo(key, "details");
      const t = document.querySelector("#infodlg .if-hd i").textContent;
      G.closeInfo();
      return /Bakka/.test(t);
    })()`);
    check("a borrowed list's row names its own list", borrowed, true);

    check("no errors on the page", await cd.evaluate("window.__errs.slice()"), []);
  } catch (e) {
    console.log("  FAIL  " + (e && e.stack || e)); fail++;
  } finally {
    cd.close();
  }
  console.log("\n" + pass + " passed, " + fail + " failed");
  process.exit(fail ? 1 : 0);
})();
