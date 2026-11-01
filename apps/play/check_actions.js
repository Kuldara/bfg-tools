/* A ship's Actions in the built page, in Chrome: the sheet, disengaging and
   ramming with fixed dice (Math.random is the page's generator), and UNDO.

     node apps/play/check_actions.js [dir for screenshots] */
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
  const s = L.secs.findIndex(x => x.ents.some(e => /^Lunar/.test(e.l || ""))), e = L.secs[s].ents.findIndex(x => /^Lunar/.test(x.l || "")), en = L.secs[s].ents[e];
  const row = () => ({ s, e, ref: en.r, n: 1, opts: [], os: {}, name: "", sn: L.secs[s].t, el: en.l });
  const res = G.resolveFleet({ ln: L.nm, limit: 1500, units: [row(), row()] });
  if(res.error) throw new Error(res.error);
  G.newGame(res);
  G.appState.G.st.forEach((st, i) => { if(st.ld == null) G.setLd(i, 8); });
  G.appState.V.screen = "roster"; G.render();
  return 1;
})()`;
/* a face to the generator: 6 -> 0.99, 1 -> 0 */
const dice = a => `(() => { const q = ${JSON.stringify(a.map(f => (f - 0.5) / 6))}; Math.random = () => q.length ? q.shift() : 0; return 1; })()`;

(async () => {
  if(!fs.existsSync(PAGE)) throw new Error("npm run build first");
  const cd = await launch({ prefix: "play-actions-", args: ["--window-size=375,812", "--hide-scrollbars", "--allow-file-access-from-files"] });
  try{
    await cd.send("Page.enable");
    await cd.send("Emulation.setDeviceMetricsOverride", { width: 375, height: 812, deviceScaleFactor: 2, mobile: false });
    const shot = async n => { if(!shots) return; const r = await cd.send("Page.captureScreenshot", { format: "png" }); fs.writeFileSync(path.join(shots, n + ".png"), Buffer.from(r.data, "base64")); };
    const loaded = cd.once("Page.loadEventFired");
    await cd.send("Page.navigate", { url: "file:///" + PAGE.replace(/\\/g, "/").replace(/ /g, "%20") });
    await loaded;
    await cd.evaluate(SETUP);
    await sleep(800);
    const tap = async sel => { await cd.evaluate(`document.querySelector(${JSON.stringify(sel)}).click()`); await sleep(100); };
    const txt = sel => cd.evaluate(`(document.querySelector(${JSON.stringify(sel)}) || {}).innerText || ""`);
    const box = async () => (await txt(".acts .box")).toLowerCase();
    const st = i => cd.evaluate(`JSON.parse(JSON.stringify(GFP.appState.G.st[${i}]))`).then(x => typeof x === "string" ? JSON.parse(x) : x);
    const ST = async i => JSON.parse(await cd.evaluate(`JSON.stringify(GFP.appState.G.st[${i}])`));
    const open = i => tap(`[data-act="actions"][data-i="${i}"]`);
    void st;

    check("no sideways scroll at phone width", await cd.evaluate(`document.scrollingElement.scrollWidth <= window.innerWidth`));
    await shot("1-roster");
    await open(0);
    const main = await box();
    check("the sheet lists Board, Ram, Disengage and Teleport", /board/.test(main) && /ram/.test(main) && /disengage/.test(main) && /teleport/.test(main), main);
    await shot("2-sheet");

    /* disengage, p. 56-57 */
    await tap('[data-act="actab"][data-arg="dis"]');
    await tap('[data-act="acset"][data-arg="blast:+1"]');
    await tap('[data-act="acset"][data-arg="enemies:+1"]');
    await tap('[data-act="acset"][data-arg="enemies:+1"]');
    check("Ld 8, +1 marker, -2 enemies: 7 or under (p. 56)", /7 or under/.test(await box()), await box());
    await tap('[data-act="acset"][data-arg="celestial:true"]');
    check("+3 celestial: 10 or under, with 11 and 12 still failing", /10 or under/.test(await box()), await box());
    await shot("3-disengage");
    await cd.evaluate(dice([6, 5]));
    await tap('[data-act="acdis"][data-arg="roll"]');
    let s = await ST(0);
    check("11 fails however high Ld is: no-fire is marked (p. 57)", /failed/.test(await box()) && s.noOrdersTurn && !s.disengaged, s);
    await tap('[data-act="undo"]');
    s = await ST(0);
    check("UNDO takes it back", !s.noOrdersTurn, s);
    await tap('[data-act="acdis"][data-arg="pass"]');
    s = await ST(0);
    check("Passed with own dice: disengaged (p. 57)", s.disengaged, s);
    check("the Actions of a ship that left are gone", !(await cd.evaluate(`!!document.querySelector('[data-act="actions"][data-i="0"]')`)));
    await tap('[data-act="undo"]');
    await tap('[data-act="acclose"]');

    /* ram, p. 55-56: the Agrippa's example, a Lunar on a Murder from the side */
    await open(0);
    await tap('[data-act="actab"][data-arg="ram"]');
    check("cruiser on cruiser: 2D6 (p. 55)", /2d6, 8 or under/.test(await box()), await box());
    await tap('[data-act="acset"][data-arg="size:0"]');
    check("on an escort: 3D6 (p. 55)", /3d6/.test(await box()));
    await tap('[data-act="acset"][data-arg="size:2"]');
    check("on a battleship: 1D6 (p. 55)", /1d6/.test(await box()));
    await tap('[data-act="acset"][data-arg="size:1"]');
    await shot("4-ram");
    await cd.evaluate(dice([3, 2]));
    await tap('[data-act="acramtest"][data-arg="roll"]');
    check("the test passed, the dice come next: 8D6 and 4D6 (p. 56)", /8d6/.test(await box()) && /4d6/.test(await box()), await box());
    await shot("5-ram-contact");
    /* the book's own rolls: 1,2,3,3,4,5,5,6 on Armour 5 = 3; 3,3,5,6 on the prow 6 = 1 */
    await cd.evaluate(dice([1, 2, 3, 3, 4, 5, 5, 6, 3, 3, 5, 6]));
    await tap('[data-act="acramroll"]');
    const res = await box();
    check("3 hits on them, 1 on this ship (p. 56)", /3 hits on them/.test(res) && /1 hit on this ship/.test(res), res);
    s = await ST(0);
    check("the hit is on the track", s.hits === 1, s);
    await shot("6-ram-done");
    await tap('[data-act="acclose"]');

    /* celestial phenomena: asteroids, shields against the D6 (p. 110) */
    await open(1);
    await tap('[data-act="actab"][data-arg="cel"]');
    await shot("7-celestial");
    await tap('[data-act="accel"][data-arg="asteroid"]');
    check("asteroids: 2D6 against Ld (p. 110)", /2d6, 8 or under/.test(await box()), await box());
    await shot("8-asteroid");
    await tap('[data-act="acast"][data-arg="fail"]');
    await tap('[data-act="acastdmg"][data-arg="5"]');
    s = await ST(1);
    check("D6 = 5 against 2 shields: 3 hits (p. 110)", s.hits === 3 && /3 hits/.test(await box()), s);
    await tap('[data-act="undo"]');
    await tap('[data-act="accelback"]');
    /* a cloud is one Blast Marker (p. 110) */
    await tap('[data-act="accel"][data-arg="gas"]');
    await tap('[data-act="acgas"]');
    s = await ST(1);
    check("a cloud marks one Blast Marker (p. 110)", s.blast === 1, s);
    await tap('[data-act="undo"]');
    await tap('[data-act="accelback"]');
    /* a rift: 3D6, a failure is gone from the table (pp. 111-112) */
    await tap('[data-act="accel"][data-arg="rift"]');
    check("warp rift: 3D6 (p. 111)", /3d6, 8 or under/.test(await box()), await box());
    await tap('[data-act="acrift"][data-arg="fail"]');
    s = await ST(1);
    check("lost in the warp: off the table (p. 112)", s.disengaged, s);
    await tap('[data-act="undo"]');
    await tap('[data-act="accelback"]');
    for(const k of ["planet", "sun", "flare", "radiation"]){
      await tap(`[data-act="accel"][data-arg="${k}"]`);
      check(k + " has its text with a page", /p\. 11\d|well/.test(await box()), await box());
      await tap('[data-act="accelback"]');
    }
    await tap('[data-act="acclose"]');

    /* teleport is shut for a crippled ship (p. 92) */
    await cd.evaluate(`(() => { GFP.appState.G.st[1].hits = 5; GFP.render(); return 1; })()`);
    await open(1);
    check("a crippled ship may not teleport (p. 92)", await cd.evaluate(`document.querySelector('[data-act="actab"][data-arg="tele"]').disabled`));
  }finally{ await cd.close(); }
  console.log((fail ? "FAIL " : "ok ") + pass + " passed, " + fail + " failed");
  process.exit(fail ? 1 : 0);
})().catch(e => { console.log("FAIL " + e.message); process.exit(1); });
