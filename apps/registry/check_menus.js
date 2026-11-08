/* The top bar's menus in a real browser.

     node apps/registry/check_menus.js        (part of npm test; needs dist/)

   The user 2.11.2026: panels on top of each other, in changing places, now and
   then off the screen. At a wide, a middle and a phone width: each menu opens
   at the same top and right edge, opening one closes the other, and the panel
   stays inside the window, also with the page scrolled to its end. Also the
   fleet pane's + (a copy of a unit, user 8.11.2026). */
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
    /* Text and file in Saved fleets (user 3.11.2026): beside Import file; the open
       fleet's text, pasted back, is a new saved fleet; the screen keeps its fleet */
    const x = JSON.parse(await cd.evaluate(`(async () => {
      const G = GFR, S = () => G.appState.S, w = () => new Promise(r => setTimeout(r, 60));
      localStorage.removeItem(G.KEY_LIB); S().units = []; G.addUnit(1, 0); G.addUnit(1, 0); G.render();
      const d = document.querySelector("#saves"); if(!d.open) d.querySelector("summary").click(); await w();
      const b = document.querySelector("#savesbody button[data-xfer]"), beside = !!b && !!b.parentElement.querySelector("[data-import]");
      b.click(); await w();
      const text = G.fleetText(), n0 = G.libRead().saves.length, on = S().units.length;
      const ta = document.querySelector("#xftext"); ta.value = text; ta.dispatchEvent(new Event("input", { bubbles: true }));
      G.render(); await w();
      const kept = document.querySelector("#xftext").value === text;
      document.querySelector("#savesbody button[data-xf=add]").click(); await w();
      return JSON.stringify({ beside, kept, parsed: JSON.parse(text).units.length, n0, n1: G.libRead().saves.length,
        from: (G.libRead().saves[0] || {}).from, screen: S().units.length === on, cleared: G.appState.XFER.text === "" });
    })()`));
    check("Text and file: beside Import file; the pasted text survives a redraw", x.beside && x.kept, x);
    check("the fleet's text, pasted back, is a new saved fleet; the screen keeps its fleet", x.parsed === 2 && x.n1 === x.n0 + 1 && x.from === "paste" && x.screen && x.cleared, x);
    /* + on a unit (user 8.11.2026): a copy right after it with the same ship
       count, options and upgrades, without the names or the squadron letter;
       none on a commander. At a phone width the + stays inside its row. */
    await cd.send("Emulation.setDeviceMetricsOverride", { width: 375, height: 800, deviceScaleFactor: 1, mobile: false });
    const dp = JSON.parse(await cd.evaluate(`(async () => {
      const G = GFR, S = G.appState.S, w = () => new Promise(r => setTimeout(r, 80));
      const L = G.LISTS.findIndex(x => /Gothic Sector/.test(x.nm)); S.li = L; S.units = []; S.limit = 2000;
      const list = G.LISTS[L], si = list.secs.findIndex(s => /^ESCORTS/.test(s.t)), ai = list.secs.findIndex(s => /^Admiral/.test(s.t));
      G.addUnit(ai, 0);
      /* the first escort row with an option, so that the copy has one to carry */
      let ei = -1;
      for (let e = 0; e < list.secs[si].ents.length && ei < 0; e++) { G.addUnit(si, e); const R = G.resolveUnit(S.units[1]); if (R && R.options.length) ei = e; else S.units.splice(1, 1); }
      G.addUnit(si, ei);
      const u = S.units[1]; u.n = 3; u.name = "Hunters"; u.members = "A, B, C"; u.sq = "A"; u.note = "gift"; G.setOptState(u, 0, "take");
      G.render(); await w();
      const strip = x => { const y = JSON.parse(JSON.stringify(x)); ["uid", "name", "members", "sq", "aboard"].forEach(k => delete y[k]); return JSON.stringify(y); };
      const pts0 = G.total(), upts = G.unitPts(u), n0 = S.units.length;
      const cmdBtn = !!document.querySelector('#fleet .unit[data-ui="0"] [data-dup]');
      const b = document.querySelector('#fleet .unit[data-ui="1"] [data-dup]'), row = b.closest(".uhead").getBoundingClientRect(), bb = b.getBoundingClientRect();
      const inside = bb.left >= row.left && bb.right <= row.right && bb.right <= document.documentElement.clientWidth;
      b.click(); await w();
      const c = S.units[2];
      return JSON.stringify({ cmdBtn, inside, n: S.units.length - n0, same: c && strip(c) === strip(u), orig: S.units[1] === u, cn: c && c.n,
        name: c && c.name, members: c && c.members, sq: c && c.sq, uid: c && c.uid !== u.uid, took: c && G.resolveUnit(c).options[0].state,
        pts: G.total() - pts0, upts, last: S.units[3] === undefined ? "end" : "?", fresh: !!document.querySelector('#fleet .unit[data-ui="2"].new') });
    })()`));
    check("+ copies a unit right after it: count, options and upgrades the same", dp.n === 1 && dp.orig && dp.same && dp.cn === 3 && dp.took === "take", dp);
    check("the copy has no names, no squadron letter and its own uid", dp.name === "" && !dp.members && dp.sq === undefined && dp.uid, dp);
    check("the points go up by the copied unit's points; the copy is marked new", dp.pts === dp.upts && dp.upts > 0 && dp.fresh, dp);
    check("no + on a commander; the + stays inside its row at 375 px", !dp.cmdBtn && dp.inside, dp);
    /* Compact (user 8.11.2026): a folded ship shows its numbers and weapons
       as the catalogue row does, after its options - a Lunar that takes the
       nova cannon in place of its prow torpedoes (Fleets p. 71) */
    const cp = JSON.parse(await cd.evaluate(`(async () => {
      const G = GFR, S = G.appState.S, w = () => new Promise(r => setTimeout(r, 80));
      const L = G.LISTS.findIndex(x => /Gothic Sector/.test(x.nm)); S.li = L; S.units = [];
      const list = G.LISTS[L], si = list.secs.findIndex(s => /^Cruisers/.test(s.t)), ei = list.secs[si].ents.findIndex(e => /Lunar/.test(e.l));
      G.addUnit(si, ei); G.appState.FLEET_FOLD = true; G.render(); await w();
      const line = () => { const e = document.querySelector('#fleet .unit.folded[data-ui="0"] .ustat'); return e ? e.textContent.replace(/\\s+/g, " ") : null; };
      const before = line();
      const R = G.resolveUnit(S.units[0]), oi = R.options.findIndex(o => /nova cannon/i.test(o.text));
      G.setOptState(S.units[0], R.options[oi].index, "take"); G.render(); await w();
      const after = line(); G.appState.FLEET_FOLD = false; G.render();
      return JSON.stringify({ before, after, oi });
    })()`));
    check("Compact: a folded ship shows hits, speed, shields, armour, turrets and its weapons", !!cp.before && /8 hits/.test(cp.before) && /2 sh/.test(cp.before) && /TORP/.test(cp.before) && /WB/.test(cp.before), cp);
    check("Compact: the line follows the options taken (nova cannon in place of the torpedoes)", cp.oi >= 0 && /NOVA/.test(cp.after) && !/TORP/.test(cp.after), cp);
  } catch (e) {
    console.log("  FAIL  " + (e && e.stack || e)); fail++;
  } finally {
    cd.close();
  }
  console.log("\n" + pass + " passed, " + fail + " failed");
  process.exit(fail ? 1 : 0);
})();
