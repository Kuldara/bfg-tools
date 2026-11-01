/* The Repair button in the built page, in Chrome: a tap rolls, repairs and burns
   the fire left; the choice comes up only when there is one; UNDO takes it back.
   The dice are fixed through Math.random, the page's own generator.

     node apps/play/check_repair.js [dir for screenshots] */
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
  return G.appState.U.length;
})()`;
/* the next dice: 0.99 is a 6, 0 is a 1 */
const dice = a => `(() => { const q = ${JSON.stringify(a)}; Math.random = () => q.length ? q.shift() : 0; return 1; })()`;
const crits = (i, c) => `(() => { const st = GFP.appState.G.st[${i}]; st.crits = ${JSON.stringify(c)}; st.hits = 2; delete st.repPick; delete st.repPhase; GFP.render(); return 1; })()`;
const stOf = i => `JSON.stringify((({ crits, hits, repPick }) => ({ crits, hits, repPick }))(GFP.appState.G.st[${i}]))`;
const six = n => Array.from({ length: 6 }, (x, k) => k < n ? 0.99 : 0);

(async () => {
  if(!fs.existsSync(PAGE)) throw new Error("npm run build first");
  const cd = await launch({ prefix: "play-repair-", args: ["--window-size=430,900", "--hide-scrollbars", "--allow-file-access-from-files"] });
  try{
    await cd.send("Page.enable");
    await cd.send("Emulation.setDeviceMetricsOverride", { width: 430, height: 900, deviceScaleFactor: 2, mobile: false });
    const shot = async n => { if(!shots) return; const r = await cd.send("Page.captureScreenshot", { format: "png" }); fs.writeFileSync(path.join(shots, n + ".png"), Buffer.from(r.data, "base64")); };
    const loaded = cd.once("Page.loadEventFired");
    await cd.send("Page.navigate", { url: "file:///" + PAGE.replace(/\\/g, "/").replace(/ /g, "%20") });
    await loaded;
    await cd.evaluate(SETUP);
    await sleep(800);
    const tap = async sel => { await cd.evaluate(`document.querySelector(${JSON.stringify(sel)}).click()`); await sleep(120); };
    const has = sel => cd.evaluate(`!!document.querySelector(${JSON.stringify(sel)})`);
    const txt = sel => cd.evaluate(`(document.querySelector(${JSON.stringify(sel)}) || {}).innerText || ""`);
    const REP = '[data-act="repairroll"][data-i="0"]';

    check("no critical, no Repair", !(await has(REP)));
    /* 6 hits left: 6D6 (p. 88) */
    await cd.evaluate(crits(0, { "7": 1, "6": 1 }));
    check("the button says the dice (6 hits left: 6D6, p. 88)", /6D6/.test(await txt(REP)), await txt(REP));
    await shot("1-button");
    check("Blast Markers in contact: half the dice, 3D6 (p. 88)", /3D6/.test(await txt('[data-act="repairroll"][data-arg="half"]')));

    /* one six, two kinds: the book leaves the choice to the player */
    await cd.evaluate(dice(six(1)));
    await tap(REP);
    let st = JSON.parse(await cd.evaluate(stOf(0)));
    check("one six, two kinds: nothing repaired yet, the choice is up", st.repPick === 1 && st.crits["7"] === 1 && st.crits["6"] === 1 && st.hits === 2, st);
    check("the choice is on the card", await has('[data-act="repairpick"][data-arg="7"]'));
    await shot("2-pick");
    await tap('[data-act="repairpick"][data-arg="6"]');
    st = JSON.parse(await cd.evaluate(stOf(0)));
    check("the fire left costs its hit (p. 67) once the choice is made", !st.crits["6"] && st.crits["7"] === 1 && st.hits === 3 && !st.repPick, st);
    check("the line says what happened", /repaired/.test(await txt(".repnote")) && /Fire: \+1 hit/.test(await txt(".repnote")), await txt(".repnote"));
    await shot("3-note");
    check("without the orders track a second roll is seen, not blocked", /again/.test(await txt(REP)), await txt(REP));
    await cd.evaluate(`GFP.OPT.orders = true; GFP.render(); 1`); await sleep(120);
    check("with it, one roll per End Phase", await cd.evaluate(`document.querySelector(${JSON.stringify(REP)}).disabled`));
    await cd.evaluate(`GFP.OPT.orders = false; GFP.render(); 1`); await sleep(120);

    /* the line goes with the next thing done */
    await tap('[data-act="hit"][data-i="1"]');
    check("the line goes with the next tap elsewhere", !(await has(".repnote")));
    await cd.evaluate(`document.querySelector('[data-act="undo"]').click()`); await sleep(120);

    /* two sixes: nothing to choose, all at once */
    await cd.evaluate(crits(0, { "7": 1, "6": 1 }));
    await cd.evaluate(dice(six(2)));
    await tap(REP);
    st = JSON.parse(await cd.evaluate(stOf(0)));
    check("enough sixes: everything repaired, no choice, no fire", !st.crits["7"] && !st.crits["6"] && st.hits === 2 && !st.repPick, st);
    check("nothing left, no button", !(await has(REP)));

    /* no six: the fire burns; UNDO takes the whole roll back */
    await cd.evaluate(crits(0, { "7": 1 }));
    await cd.evaluate(dice(six(0)));
    await tap(REP);
    st = JSON.parse(await cd.evaluate(stOf(0)));
    check("no six: the fire stays and costs a hit (p. 67)", st.crits["7"] === 1 && st.hits === 3, st);
    await cd.evaluate(`document.querySelector('[data-act="undo"]').click()`); await sleep(120);
    st = JSON.parse(await cd.evaluate(stOf(0)));
    check("UNDO takes it back", st.hits === 2 && st.crits["7"] === 1 && (await has(REP)) && !(await cd.evaluate(`document.querySelector(${JSON.stringify(REP)}).disabled`)), st);

    /* a result that may not be repaired (p. 67) gets no button */
    await cd.evaluate(crits(0, { "10": 1 }));
    check("10 cannot be repaired: no button (p. 67)", !(await has(REP)));

    /* the End Phase panel: every ship in one tap */
    await cd.evaluate(crits(0, { "7": 1 }));
    await cd.evaluate(crits(1, { "6": 1 }));
    await cd.evaluate(`GFP.appState.V.endph = true; GFP.render(); 1`); await sleep(120);
    await shot("4-endphase");
    await cd.evaluate(dice(Array(12).fill(0.99)));
    await tap('[data-act="repairall"]');
    const a = JSON.parse(await cd.evaluate(stOf(0))), b = JSON.parse(await cd.evaluate(stOf(1)));
    check("Repair all rolls for every ship", !a.crits["7"] && !b.crits["6"], [a, b]);
    await shot("5-endphase-done");
  }finally{ await cd.close(); }
  console.log((fail ? "FAIL " : "ok ") + pass + " passed, " + fail + " failed");
  process.exit(fail ? 1 : 0);
})().catch(e => { console.log("FAIL " + e.message); process.exit(1); });
