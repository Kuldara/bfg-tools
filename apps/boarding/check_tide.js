/* The Berzerker Tide in a real browser: two Mark of Khorne Hades board one Lunar.

     node apps/boarding/check_tide.js        (part of npm test; needs dist/)

   User 4.11.2026: "let me roll the Berzerker Tide myself" and "per ship".
   FL p.250: "Any ships with the Mark of Khorne conducting a boarding action may
   roll D3 extra critical damage rolls" (RULINGS.md 7). In both dice modes each
   Hades has its own row with 1, 2, 3; the app's Roll is there only when the app
   rolls; a 2 for Hades 1 is two extra rolls and its own lost orders. */
"use strict";
const path = require("path");
const { launch } = require("../../tools/lib/chrome.js");
const PAGE = "file:///" + path.resolve(__dirname, "..", "..", "dist", "boarding", "index.html").replace(/\\/g, "/");
const sleep = ms => new Promise(r => setTimeout(r, ms));
const hades = { n: "HADES CLASS HEAVY CRUISER", fid: "CHAOS", dp: 8, opts: ["khorne", "berzerkerfleet"] };
const STATE = dice => JSON.stringify({ v: 1, dice, round: 1,
  att: { f: 5, ships: [hades, Object.assign({}, hades)], blast: 0, orders: 0, other: 0, otherValue: 0 },
  def: { f: 0, ships: [{ n: "LUNAR CLASS CRUISER", fid: "IMPERIAL NAVY", dp: 8, opts: [] }], blast: 0, orders: 0, other: 0, otherValue: 0 } });
let pass = 0, fail = 0;
const check = (n, ok, got) => { console.log((ok ? "PASS " : "FAIL ") + n + (ok ? "" : "  -> " + JSON.stringify(got))); ok ? pass++ : fail++; };
(async () => {
  const cd = await launch({ prefix: "ba-tide-", args: ["--window-size=1100,1400", "--hide-scrollbars"] });
  await cd.send("Page.enable");
  const go = async () => { const l = cd.once("Page.loadEventFired"); await cd.send("Page.navigate", { url: PAGE }); await l; await sleep(500); };
  await go();
  for (const dice of ["digital", "physical"]) {
    await cd.evaluate(`localStorage.setItem("bfg-boarding-v1", ${JSON.stringify(STATE(dice))}); window.__errs = []; 1`);
    await go();
    await cd.evaluate(`window.__errs = []; addEventListener("error", e => __errs.push(String(e.message))); 1`);
    /* the attackers win: high dice for them, low for the defender */
    if (dice === "digital") {
      await cd.evaluate(`(() => { const q = [0.99, 0.01]; let k = 0; Math.random = () => q[(k++) % 2]; document.querySelector('[data-a="roll"]').click(); return 1; })()`);
    } else {
      /* hand dice: a 6 for the boarder, a 1 for the defender */
      await cd.evaluate(`(() => { for(let n = 0; n < 20; n++){ const b = [...document.querySelectorAll('[data-die="att"]:not(.sel),[data-die="def"]:not(.sel)')].filter(x => x.dataset.v === (x.dataset.die === "att" ? "6" : "1"));
        const row = x => document.querySelector('[data-die="' + x.dataset.die + '"][data-idx="' + x.dataset.idx + '"].sel');
        const next = b.find(x => !row(x)); if(!next) break; next.click(); } return 1; })()`);
    }
    await sleep(300);
    const v = JSON.parse(await cd.evaluate(`JSON.stringify({
      blocks: [...document.querySelectorAll('[data-r="tide"]')].map(b => b.dataset.c + "=" + b.dataset.v),
      text: [...document.querySelectorAll(".step")].map(s => s.innerText).filter(t => /Berzerker Tide/.test(t)) })`));
    check(dice + ": a Tide row for each Hades, with its own 1 2 3", ["att:0", "att:1"].every(k => [1, 2, 3].every(n => v.blocks.includes(k + "=" + n))) && v.text.length === 2, v);
    check(dice + ": the app's Roll only when the app rolls", v.blocks.includes("att:0=0") === (dice === "digital"), v.blocks);
    /* the player's own D3 for the first ship: 2 */
    const before = await cd.evaluate(`document.querySelectorAll('[data-r="tide"]').length`);
    await cd.evaluate(`document.querySelector('[data-r="tide"][data-c="att:0"][data-v="2"]').click(); 1`);
    await sleep(200);
    const after = JSON.parse(await cd.evaluate(`JSON.stringify({ left: [...document.querySelectorAll('[data-r="tide"]')].map(b => b.dataset.c).filter((x, i, a) => a.indexOf(x) === i),
      used: [...document.querySelectorAll(".step.done")].map(s => s.innerText).filter(t => /Berzerker Tide/.test(t)), errs: window.__errs })`));
    check(dice + ": a 2 for the first Hades: its row says 2 extra rolls and no special orders, the other still to choose", after.left.join() === "att:1" && after.used.length === 1 && /Hades 1/.test(after.used[0]) && /D3: 2 extra rolls/.test(after.used[0]) && /takes no special orders next turn/.test(after.used[0]), after);
    if (dice === "digital") {
      await cd.evaluate(`document.querySelector('[data-r="tide"][data-c="att:1"][data-v="0"]').click(); 1`);
      await sleep(200);
      const r2 = JSON.parse(await cd.evaluate(`JSON.stringify({ left: document.querySelectorAll('[data-r="tide"]').length, done: [...document.querySelectorAll(".step.done")].map(s => s.innerText).filter(t => /Berzerker Tide/.test(t)), errs: window.__errs })`));
      check("digital: Roll for the second Hades: the app rolls its D3", r2.left === 0 && r2.done.length === 2 && r2.done.every(t => /D3: [123] extra roll/.test(t)) && !r2.errs.length, r2.done.map(t => t.slice(110, 160)));
    }
    check(dice + ": no page error", !(JSON.parse(await cd.evaluate(`JSON.stringify(window.__errs)`))).length);
  }
  console.log(pass + " passed, " + fail + " failed");
  cd.close(); process.exit(fail ? 1 : 0);
})();
