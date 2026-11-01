/* The order of the cards and the name on a ship's card, in the built page, in
   Chrome: real mouse drags on the tag.

     node apps/play/check_order.js [dir for screenshots] */
"use strict";
const fs = require("fs"), path = require("path");
const { launch } = require("../../tools/lib/chrome.js");
const REPO = path.join(__dirname, "..", "..");
const PAGE = path.join(REPO, "dist", "registry", "play", "Gothic Fleet Play.html");
const shots = process.argv[2];
let fail = 0, pass = 0;
const check = (n, ok, d) => { if(ok) pass++; else { fail++; console.log("  FAIL " + n + (d !== undefined ? "  -- " + JSON.stringify(d) : "")); } };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const SETUP = `(() => {
  const G = GFP, L = G.LISTS.find(l => l.nm === "Imperial Navy \\u2014 Gothic Sector");
  const find = re => { const s = L.secs.findIndex(x => x.ents.some(e => re.test(e.l || ""))); const e = L.secs[s].ents.findIndex(x => re.test(x.l || "")); const en = L.secs[s].ents[e]; return { s, e, ref: en.r, n: 1, opts: [], os: {}, name: "", sn: L.secs[s].t, el: en.l }; };
  const res = G.resolveFleet({ ln: L.nm, limit: 1500, units: [find(/^Lunar/), find(/^Dictator/), find(/^Lunar/), find(/^Gothic/)] });
  if(res.error) throw new Error(res.error);
  G.newGame(res);
  G.appState.G.st.forEach((st, i) => { if(st.ld == null) G.setLd(i, 8); });
  G.appState.G.grp[2] = "A"; G.appState.G.grp[3] = "A";
  G.appState.V.screen = "roster"; G.appState.V.compact = true; G.render();
  return 1; })()`;
(async () => {
  if(!fs.existsSync(PAGE)) throw new Error("npm run build first");
  const cd = await launch({ prefix: "play-order-", args: ["--hide-scrollbars", "--allow-file-access-from-files"] });
  try{
    await cd.send("Page.enable");
    await cd.send("Emulation.setDeviceMetricsOverride", { width: 375, height: 812, deviceScaleFactor: 2, mobile: false });
    const shot = async n => { if(!shots) return; const r = await cd.send("Page.captureScreenshot", { format: "png" }); fs.writeFileSync(path.join(shots, n + ".png"), Buffer.from(r.data, "base64")); };
    const loaded = cd.once("Page.loadEventFired");
    await cd.send("Page.navigate", { url: "file:///" + PAGE.replace(/\\/g, "/").replace(/ /g, "%20") });
    await loaded;
    await cd.evaluate(SETUP);
    await sleep(800);
    const names = async () => (await cd.evaluate(`[...document.querySelectorAll('section.row[data-u] .name b')].map(b => b.innerText).join("|")`)).split("|");
    const rect = sel => cd.evaluate(`(() => { const r = document.querySelector(${JSON.stringify(sel)}).getBoundingClientRect(); return JSON.stringify({ x: r.left + r.width / 2, y: r.top + r.height / 2, top: r.top, bottom: r.bottom }); })()`).then(JSON.parse);
    const mouse = (type, x, y, extra) => cd.send("Input.dispatchMouseEvent", Object.assign({ type, x, y, button: "left", buttons: 1 }, extra || {}));
    const drag = async (from, toY) => {
      await mouse("mousePressed", from.x, from.y, { clickCount: 1 });
      for(let k = 1; k <= 6; k++) await mouse("mouseMoved", from.x, from.y + (toY - from.y) * k / 6);
      await sleep(60);
      if(shots) await shot("2-dragging");
      await mouse("mouseReleased", from.x, toY, { clickCount: 1, buttons: 0 });
      await sleep(200);
    };
    const first = await names();
    check("the fleet's order to begin with", /^Lunar 1$/i.test(first[0]) && /^Dictator$/i.test(first[1]), first);
    await shot("1-start");

    /* the first card below the second */
    let from = await rect('section.row[data-u="0"] .r1 > .tag');
    let over = await rect('section.row[data-u="1"]');
    await drag(from, over.bottom - 4);
    let now = await names();
    check("dragged below the next card", /^Dictator$/i.test(now[0]) && /^Lunar 1$/i.test(now[1]), now);
    check("the order is in the game record", await cd.evaluate(`GFP.appState.G.order[0] === 1 && JSON.parse(localStorage.getItem("gothic-fleet-play-v1") || "{}") !== null`));
    await shot("3-moved");
    await cd.evaluate(`document.querySelector('[data-act="undo"]').click(); 1`); await sleep(500);
    now = await names();
    check("UNDO takes the move back", /^Lunar 1$/i.test(now[0]), now);

    /* a squadron moves whole: a card of it dragged to the top brings the others */
    from = await rect('section.row[data-g="A"] .r1 > .tag');
    over = await rect('section.row[data-u="0"]');
    await drag(from, over.top + 4);
    const order = JSON.parse(await cd.evaluate(`JSON.stringify(GFP.rosterOrder())`));
    check("the squadron moved as a whole", order.join() === "2,3,0,1", order);

    /* a tag dragged nowhere changes nothing */
    const before = await cd.evaluate(`JSON.stringify(GFP.rosterOrder())`);
    from = await rect('section.row[data-u="0"] .r1 > .tag');
    await mouse("mousePressed", from.x, from.y, { clickCount: 1 });
    await mouse("mouseReleased", from.x, from.y, { clickCount: 1, buttons: 0 });
    await sleep(100);
    check("a tap on the tag moves nothing", (await cd.evaluate(`JSON.stringify(GFP.rosterOrder())`)) === before);

    /* the name on the ship's card */
    await cd.evaluate(`document.querySelector('[data-act="sheet"][data-i="0"]').click(); 1`); await sleep(500);
    check("the card has the name field", await cd.evaluate(`document.querySelector(".sheet .shnm").value`) === "Lunar 1", await cd.evaluate(`document.querySelector(".sheet .shnm").value`));
    await shot("4-card");
    await cd.evaluate(`(() => { const f = document.querySelector(".sheet .shnm"); f.value = "Agrippa"; f.dispatchEvent(new Event("input", { bubbles: true })); return 1; })()`);
    await cd.evaluate(`document.querySelector('[data-act="closesheet"]').click(); 1`); await sleep(400);
    check("the new name is on the roster", (await names()).some(n => /^Agrippa$/i.test(n)), await names());
    await cd.evaluate(`document.querySelector('[data-act="sheet"][data-i="0"]').click(); 1`); await sleep(500);
    await cd.evaluate(`(() => { const f = document.querySelector(".sheet .shnm"); f.value = ""; f.dispatchEvent(new Event("input", { bubbles: true })); return 1; })()`);
    await cd.evaluate(`document.querySelector('[data-act="closesheet"]').click(); 1`); await sleep(400);
    check("an empty field gives the name back", (await names()).some(n => /^Lunar 1$/i.test(n)), await names());
  }finally{ await cd.close(); }
  console.log((fail ? "FAIL " : "ok ") + pass + " passed, " + fail + " failed");
  process.exit(fail ? 1 : 0);
})().catch(e => { console.log("FAIL " + e.message); process.exit(1); });
