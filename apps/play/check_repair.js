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
    await cd.evaluate(`GFP.OPT.autorepair = true; GFP.render(); 1`);
    const tap = async sel => { await cd.evaluate(`document.querySelector(${JSON.stringify(sel)}).click()`); await sleep(450); };
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
    check("the fire left stays, and no hit from Repair (user 1.11.2026)", !st.crits["6"] && st.crits["7"] === 1 && st.hits === 2 && !st.repPick, st);
    check("the line says what happened", /repaired/.test(await txt(".repnote")) && /Fire still burning/.test(await txt(".repnote")), await txt(".repnote"));
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
    /* the button stays under the finger, dimmed; the big Hit button must not rise there */
    check("nothing left: the button stays, dimmed", await cd.evaluate(`document.querySelector(${JSON.stringify(REP)}).disabled`));
    const heldAt = JSON.parse(await cd.evaluate(`(() => { const r = document.querySelector(${JSON.stringify(REP)}).getBoundingClientRect(); return JSON.stringify({ x: r.left + r.width / 2, y: r.top + r.height / 2 }); })()`));
    const hitsBefore = JSON.parse(await cd.evaluate(stOf(0))).hits;
    await cd.send("Input.dispatchMouseEvent", { type: "mousePressed", x: heldAt.x, y: heldAt.y, button: "left", clickCount: 1 });
    await cd.send("Input.dispatchMouseEvent", { type: "mouseReleased", x: heldAt.x, y: heldAt.y, button: "left", clickCount: 1 });
    await sleep(450);
    check("a second tap there adds no hit", JSON.parse(await cd.evaluate(stOf(0))).hits === hitsBefore);

    /* no six: the fire burns; UNDO takes the whole roll back */
    await cd.evaluate(crits(0, { "7": 1 }));
    await cd.evaluate(dice(six(0)));
    await tap(REP);
    st = JSON.parse(await cd.evaluate(stOf(0)));
    check("no six: the fire stays, its hit is the player's tap", st.crits["7"] === 1 && st.hits === 2, st);
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

    /* the default: in the critical table, wrenches spent by choice */
    await cd.evaluate(`GFP.OPT.autorepair = false; GFP.appState.V.endph = false; GFP.render(); 1`); await sleep(120);
    await cd.evaluate(crits(0, { "7": 1, "6": 1 }));
    check("without Auto repair no button on the card", !(await has(REP)));
    await tap('[data-act="pop"][data-i="0"][data-arg="crit"]');
    await shot("6-table");
    check("the two rolls with their reason: 6D6 and 3D6 (p. 88)", /6D6/.test(await txt('.repopt[data-arg="full"]')) && /3D6/.test(await txt('.repopt[data-arg="half"]')) && /halves the dice/.test(await txt(".repwhy")));
    await cd.evaluate(dice(six(1)));
    await tap(REP);
    st = JSON.parse(await cd.evaluate(stOf(0)));
    check("one six: one wrench to spend, nothing repaired yet", st.repPick === 1 && st.crits["6"] === 1 && st.crits["7"] === 1, st);
    check("the counter says it", /1 repair left/i.test(await txt(".repcount")) && /of 1/.test(await txt(".repcount")), await txt(".repcount"));
    await cd.evaluate(`document.querySelector(".reppick").scrollIntoView({ block: "center" }); 1`); await sleep(100);
    await shot("7-wrench");
    await tap('[data-act="repairpick"][data-arg="7"]');
    st = JSON.parse(await cd.evaluate(stOf(0)));
    check("spent on the fire: it is out, no hit", !st.crits["7"] && st.crits["6"] === 1 && st.hits === 2 && !st.repPick, st);
    /* two of two, one spent: the counter follows; Done leaves the rest */
    await cd.evaluate(crits(0, { "7": 1, "6": 1, "5": 1 }));
    await cd.evaluate(dice(six(2)));
    await tap(REP);
    check("two sixes: 2 left of 2", /2 repairs left/i.test(await txt(".repcount")) && /of 2/.test(await txt(".repcount")), await txt(".repcount"));
    await tap('[data-act="repairpick"][data-arg="5"]');
    check("one spent: 1 left of 2", /1 repair left/i.test(await txt(".repcount")) && /of 2/.test(await txt(".repcount")), await txt(".repcount"));
    await tap('[data-act="repairdone"]');
    st = JSON.parse(await cd.evaluate(stOf(0)));
    check("Done keeps what is left unrepaired", !st.repPick && st.crits["7"] === 1 && st.crits["6"] === 1 && !st.crits["5"], st);

    /* one kind is still the player's tap */
    await cd.evaluate(crits(0, { "6": 1 }));
    await cd.evaluate(dice(six(1)));
    await tap(REP);
    st = JSON.parse(await cd.evaluate(stOf(0)));
    check("one kind: still a wrench to spend", st.repPick === 1 && st.crits["6"] === 1, st);
    await tap('[data-act="repairpick"][data-arg="6"]');
    await tap('[data-act="closepop"]');

    /* Tapping Repair again where the finger already is must never land on the
       table: real clicks at one spot, as the user did (1.11.2026: Engine damage) */
    /* phone width: the old layout put a table row under this spot there */
    await cd.send("Emulation.setDeviceMetricsOverride", { width: 375, height: 812, deviceScaleFactor: 2, mobile: false });
    await cd.evaluate(crits(0, { "7": 1 }));
    await tap('[data-act="pop"][data-i="0"][data-arg="crit"]');
    const spot = JSON.parse(await cd.evaluate(`(() => { const b = document.querySelector('.repopt[data-arg="full"]'); b.scrollIntoView({ block: "center" }); const r = b.getBoundingClientRect(); return JSON.stringify({ x: r.left + r.width / 2, y: r.top + r.height / 2 }); })()`));
    await cd.evaluate(dice(six(1).concat(six(1), six(1), six(1))));
    for(let n = 0; n < 5; n++){
      await cd.send("Input.dispatchMouseEvent", { type: "mousePressed", x: spot.x, y: spot.y, button: "left", clickCount: 1 });
      await cd.send("Input.dispatchMouseEvent", { type: "mouseReleased", x: spot.x, y: spot.y, button: "left", clickCount: 1 });
      await sleep(650);
    }
    st = JSON.parse(await cd.evaluate(stOf(0)));
    check("tapping on at one spot adds no critical and no hit", !st.crits["6"] && !st.crits["8"] && !st.crits["5"] && !st.crits["9"] && st.hits === 2, st);
    await cd.evaluate(`GFP.appState.V.pop = null; GFP.render(); 1`);

    /* the change of turn reminds of a fire, and adds nothing (user 1.11.2026) */
    await cd.evaluate(crits(0, { "7": 1 }));
    await tap('[data-act="newturn"]');
    st = JSON.parse(await cd.evaluate(stOf(0)));
    check("a new turn adds no hit from a fire", st.hits === 2 && st.crits["7"] === 1, st);
    check("the bottom bar says which ship burns", /Lunar 1/.test(await txt(".firewarn")), await txt(".firewarn"));
    await shot("9-reminder");
    await tap('[data-act="fire"][data-i="0"]');
    check("its hit tapped on: off the reminder", !(await has(".firewarn")) && JSON.parse(await cd.evaluate(stOf(0))).hits === 3);
    await cd.evaluate(crits(0, { "7": 1 }));
    await tap('[data-act="newturn"]');
    await tap('[data-act="firewarn"]');
    check("and it can be dismissed", !(await has(".firewarn")));

    /* Track Blast Markers: on or off per card (p. 48, 88) */
    check("the setting off: no button", !(await has('[data-act="blastflag"]')));
    await cd.evaluate(`GFP.OPT.blast = true; GFP.render(); 1`); await sleep(120);
    await tap('[data-act="blastflag"][data-i="0"]');
    st = JSON.parse(await cd.evaluate(`JSON.stringify({ b: GFP.appState.G.st[0].blast, ld: GFP.PLAY.leadership(GFP.appState.U[0].R, GFP.appState.G.st[0], GFP.appState.G.fleet).now })`));
    check("on: Ld 8 is 7 under fire (p. 48)", st.b === 1 && st.ld === 7, st);
    await cd.evaluate(crits(0, { "6": 1 }));
    await cd.evaluate(`GFP.appState.G.st[0].blast = 1; GFP.render(); 1`);
    await tap('[data-act="pop"][data-i="0"][data-arg="crit"]');
    check("the marked ship's roll is marked: half, 3D6 (p. 88)", /3D6/.test(await txt('.repopt.rec[data-arg="half"]')), await txt('.repopt.rec'));
    check("and full stays on offer: 6D6", /6D6/.test(await txt('.repopt[data-arg="full"]')));
    check("the table says why there are two", /halves the dice/.test(await txt(".repwhy")));
    await shot("8-blast");
  }finally{ await cd.close(); }
  console.log((fail ? "FAIL " : "ok ") + pass + " passed, " + fail + " failed");
  process.exit(fail ? 1 : 0);
})().catch(e => { console.log("FAIL " + e.message); process.exit(1); });
