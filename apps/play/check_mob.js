/* Young Gunz, Mob Rule and the Clanz Leadership swaps in the built page, in
   Chrome at phone size (RULINGS.md T63, the owner's design of 4.11.2026):
   Apply is grey until every Ld is in - by the roll and by taps - and does not
   move under the finger; Apply marks what changed, stripes the old value and
   says why; a tap asks to apply again; the Warlord's swap; Start; kills down to
   five drop the +1; UNDO; a reload resumes. The dice are fixed (Math.random is
   the page's generator).

     node apps/play/check_mob.js [dir for screenshots] */
"use strict";
const fs = require("fs"), path = require("path");
const { launch } = require("../../tools/lib/chrome.js");
const REPO = path.join(__dirname, "..", "..");
const PAGE = path.join(REPO, "dist", "registry", "play", "Gothic Fleet Play.html");
const shots = process.argv[2];
let fail = 0, pass = 0;
const check = (n, ok, d) => { if(ok) pass++; else { fail++; console.log("  FAIL " + n + (d !== undefined ? "  -- " + JSON.stringify(d) : "")); } };
const sleep = ms => new Promise(r => setTimeout(r, ms));

/* W1: five Brutes and a Kill Kroozer; W2: three Savages and three Onslaughts
   (squadron B) and a Terror Ship - the builder's save format (docs/save-format.md) */
const SETUP = `(() => {
  const G = GFP, L = G.LISTS.find(l => /Da Ork Clanz/.test(l.nm));
  const row = (sec, re, n, more) => { const s = L.secs.findIndex(x => sec.test(x.t)); const e = L.secs[s].ents.findIndex(x => re.test(x.l || "")); const en = L.secs[s].ents[e];
    return Object.assign({ s, e, ref: en.r, n: n || 1, opts: [], os: {}, name: "", sn: L.secs[s].t, el: en.l }, more || {}); };
  const res = G.resolveFleet({ ln: L.nm, limit: 1000, units: [
    row(/^WARLORD$/, /^Ork Warlord$/, 1, { uid: "w1" }), row(/^Tiddla skwadron$/, /^Brute/, 5, { cmd: "w1", sq: "A" }), row(/^Big ship skwadron$/, /^Kill kroozer$/, 1, { cmd: "w1" }),
    row(/^WARLORD$/, /^Ork Warlord$/, 1, { uid: "w2" }), row(/^Tiddla skwadron$/, /^Savage/, 3, { cmd: "w2", sq: "B" }), row(/^Tiddla skwadron$/, /^Onslaught/, 3, { cmd: "w2", sq: "B" }),
    row(/^Big ship skwadron$/, /^Terror ship$/, 1, { cmd: "w2" }) ] });
  if(res.error) throw new Error(res.error);
  G.newGame(res); G.appState.V.screen = "setup"; G.save(); G.render();
  return res.units.length;
})()`;
/* a face to the generator: 6 -> 0.99, 1 -> 0 */
const dice = a => `(() => { const q = ${JSON.stringify(a.map(f => (f - 0.5) / 6))}; Math.random = () => q.length ? q.shift() : 0; return 1; })()`;

(async () => {
  if(!fs.existsSync(PAGE)) throw new Error("npm run build first");
  const cd = await launch({ prefix: "play-mob-", args: ["--window-size=390,844", "--hide-scrollbars", "--allow-file-access-from-files"] });
  try{
    await cd.send("Page.enable");
    await cd.send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: false });
    const shot = async n => { if(!shots) return; const r = await cd.send("Page.captureScreenshot", { format: "png", captureBeyondViewport: true }); fs.writeFileSync(path.join(shots, n + ".png"), Buffer.from(r.data, "base64")); };
    const load = async () => { const loaded = cd.once("Page.loadEventFired"); await cd.send("Page.navigate", { url: "file:///" + PAGE.replace(/\\/g, "/").replace(/ /g, "%20") }); await loaded; await sleep(300); };
    await load();
    await cd.evaluate(SETUP);
    await sleep(500);
    const ev = async js => { const v = await cd.evaluate(js); return typeof v === "string" && /^[[{"]/.test(v) ? JSON.parse(v) : v; };
    const tap = async sel => { await cd.evaluate(`(() => { const e = document.querySelector(${JSON.stringify(sel)}); if(!e) throw new Error("no " + ${JSON.stringify(sel)}); e.click(); return 1; })()`); await sleep(120); };
    const txt = sel => cd.evaluate(`(document.querySelector(${JSON.stringify(sel)}) || {}).innerText || ""`);
    const apply = 'button[data-act="ygapply"]';
    const topOf = sel => cd.evaluate(`(() => { const e = document.querySelector(${JSON.stringify(sel)}); return e ? Math.round(e.getBoundingClientRect().top + window.scrollY) : null; })()`);
    const disabled = sel => cd.evaluate(`(() => { const e = document.querySelector(${JSON.stringify(sel)}); return e ? e.disabled : null; })()`);
    const choose = async (sel, value) => { await cd.evaluate(`(() => { const s = document.querySelector(${JSON.stringify(sel)}); if(!s) throw new Error("no " + ${JSON.stringify(sel)}); s.value = ${JSON.stringify(String(value))}; s.dispatchEvent(new Event("change", { bubbles: true })); return 1; })()`); await sleep(150); };
    const tile = i => cd.evaluate(`(() => { const r = document.querySelector('section.row[data-u="${i}"] .ldt, section.row.grp-hd .ldt'); return r ? r.innerText.replace(/\\s+/g, " ").trim() : ""; })()`);

    check("no sideways scroll at 390 px on the set-up", await cd.evaluate(`document.scrollingElement.scrollWidth <= window.innerWidth`));
    check("Apply is there, grey, before the Ld are in (T63)", await disabled(apply) === true && /every ship has its Ld/.test(await txt(apply)), await txt(apply));
    await shot("1-before-roll");
    const top0 = await topOf(apply);
    await cd.evaluate(dice([1, 4, 6, 3]));
    /* Roll Ld and, in the same moment, a second tap on the same place: it is
       not Apply (the 450 ms guard Roll Ld sets) */
    await cd.evaluate(`(() => { document.querySelector('button[data-act="rollld"]').click(); document.querySelector('${apply}').click(); return 1; })()`);
    await sleep(120);
    check("a tap on Apply right after Roll Ld is not taken (450 ms)", !(await ev(`!!GFP.appState.G.ygApplied`)));
    check("Roll Ld rolled every ship: Brutes 5, Kill Kroozer 7, squadron B 8, Terror Ship 6 (Rulebook p. 45, Fleets p. 360)",
      (await ev(`JSON.stringify([1, 2, 4, 5, 6].map(i => GFP.appState.G.st[i].ld))`)).join() === "5,7,8,8,6", await ev(`JSON.stringify(GFP.appState.G.st.map(s => s.ld))`));
    check("... Roll Ld stays where it was, grey, and Apply did not move under the finger", await disabled('button[data-act="rollld"]') === true && await topOf(apply) === top0, [top0, await topOf(apply)]);
    check("... Apply is ready now", await disabled(apply) === false && /2 skwadrons/.test(await txt(apply)), await txt(apply));
    await shot("2-after-roll");
    /* a reload before Start (a phone that drops the tab, the Builder link and
       back) is still the set-up: Young Gunz is not locked (T63 decision 9) */
    await load();
    await sleep(500);
    check("a reload before Start opens the set-up again, the game not started", JSON.stringify([await ev(`GFP.appState.V.screen`), await ev(`String(!!GFP.appState.G.started)`)]) === JSON.stringify(["setup", "false"]) && /2 skwadrons/.test(await txt(apply)),
      [await ev(`GFP.appState.V.screen`), await txt(apply)]);

    /* W2 swaps his Terror Ship's 6 with squadron B's 8 (Fleets p. 374) */
    await choose('select[data-sel="swap"][data-i="3"]', 4);
    check("the Warlord's swap: squadron B 6, the Terror Ship 8", (await ev(`JSON.stringify([4, 5, 6].map(i => GFP.appState.G.st[i].ld))`)).join() === "6,6,8");
    const striped = await ev(`JSON.stringify([...document.querySelectorAll('.setrow[data-u="4"] .seg.ld button.was')].map(b => [b.textContent, getComputedStyle(b).backgroundImage.slice(0, 40)]))`);
    check("... the old 8 is striped (a diagonal hatching)", striped.length === 1 && striped[0][0] === "8" && /repeating-linear-gradient/.test(striped[0][1]), striped);
    const ring = await ev(`(() => { const b = document.querySelector('.setrow[data-u="4"] .seg.ld button.on.chg'); return b ? JSON.stringify([b.textContent, getComputedStyle(b).boxShadow]) : "[]"; })()`);
    check("... the new 6 is lit with a ring", ring[0] === "6" && /rgb/.test(ring[1]) && ring[1] !== "none", ring);
    check("... and a line says why", /Ld 8 → 6: swapped with Terror Ship \(Fleets p\. 374\)/.test(await txt('.setrow[data-u="4"]')), await txt('.setrow[data-u="4"]'));
    await shot("3-after-swap");

    await sleep(500);
    await tap(apply);
    const marks = await txt('.setrow[data-u="1"]');
    check("Apply: +1 Brute Ram Ship and +1 Ld · Mob Rule on the Brutes, Ld 5 -> 6 (Fleets p. 372)", /\+1 Brute Ram Ship/.test(marks) && /\+1 Ld · Mob Rule/.test(marks) && /Ld 5 → 6: Mob Rule \+1, 6 ships with the free Brute/.test(marks), marks);
    check("... squadron B: +1 Savage Gunship, 8 -> 6 -> 7", /\+1 Savage Gunship/.test(await txt('.setrow[data-u="4"]')) && /6 → 7: Mob Rule \+1, 7 ships with the free Savage/.test(await txt('.setrow[data-u="4"]')), await txt('.setrow[data-u="4"]'));
    /* the button's words are in capitals on the screen (innerText) */
    check("... the button: Applied, grey", await disabled(apply) === true && /applied/i.test(await txt(apply)), await txt(apply));
    check("... a toast says what was applied", /Applied/.test(await txt("#toast")), await txt("#toast"));
    check("no sideways scroll after Apply", await cd.evaluate(`document.scrollingElement.scrollWidth <= window.innerWidth`));
    await shot("4-after-apply");

    /* a tap: the player's value (T44); the skwadron asks to be applied again */
    await tap('.setrow[data-u="1"] .seg.ld button[data-arg="6"]');
    check("a tap on the Brutes: Apply again, the free one off", /apply again/i.test(await txt(apply)) && await disabled(apply) === false && (await ev(`GFP.appState.G.st[1].members.length`)) === 5, await txt(apply));
    await shot("5-apply-again");
    await tap(apply);
    check("... applied again: the remembered Brute, Ld 6 plays 7", (await ev(`GFP.appState.G.st[1].members.length`)) === 6 && (await ev(`GFP.PLAY.leadership(GFP.appState.U[1].R, GFP.appState.G.st[1], GFP.appState.G.fleet).now`)) === 7);

    /* the game */
    await tap('button.btn[data-act="start"]');
    await sleep(500);
    check("the Brutes' tile in the game: 7, +1 mob", /^7 \+1 mob$/.test(await tile(1)), await tile(1));
    check("no sideways scroll on the roster", await cd.evaluate(`document.scrollingElement.scrollWidth <= window.innerWidth`));
    const freeBox = await ev(`(() => { const b = document.querySelector('section.row[data-u="1"] .hits.mem b.free'); return b ? JSON.stringify([b.title, getComputedStyle(b).borderTopStyle]) : "[]"; })()`);
    check("the free one's box is dashed with its title (Fleets p. 372)", freeBox[0] === "Young Gun: free, 0 pts (Fleets p. 372)" && freeBox[1] === "dashed", freeBox);
    await shot("6-roster");
    await tap('section.row[data-u="1"] .hits.mem b[data-arg="0"]');
    check("a kill that leaves five: Ld 6, the +1 gone, a toast", /^6 Ld 6$/.test(await tile(1)) && /five left - Mob Rule's \+1 is gone, Ld 6 \(Fleets p\. 372\)/.test(await txt("#toast")), [await tile(1), await txt("#toast")]);
    await shot("7-roster-five");
    await tap('button[data-act="undo"]');
    check("UNDO: six again, 7 +1 mob", /^7 \+1 mob$/.test(await tile(1)), await tile(1));
    await tap('section.row[data-u="1"] .hits.mem b[data-arg="0"]');

    /* a reload resumes the game: the free escort, Mob Rule and the loss stay */
    await load();
    await sleep(500);
    check("a reload resumes on the roster with the same state", (await ev(`GFP.appState.V.screen`)) === "roster" && /^6 Ld 6$/.test(await tile(1)) && (await ev(`GFP.appState.G.st[1].members.length`)) === 6, [await ev(`GFP.appState.V.screen`), await tile(1)]);
    await tap('section.row[data-u="1"] .hits.mem b[data-arg="0"]');
    check("... and a revive after the reload brings the +1 back", /^7 \+1 mob$/.test(await tile(1)), await tile(1));
    /* the dark theme draws the marks too */
    await cd.evaluate(`(() => { document.documentElement.setAttribute("data-theme", "dark"); GFP.act("setupback"); return 1; })()`);
    await sleep(300);
    check("Menu > Set-up during the game: Applied, before the game; Young Gunz read-only", /before the game/.test(await txt(apply)) && /taken at set-up/.test(await txt('.setrow[data-u="1"]')), [await txt(apply), await txt('.setrow[data-u="1"]')]);
    await shot("8-setup-dark");
  }finally{ await cd.close(); }
  console.log((fail ? "FAIL " : "ok ") + pass + " passed, " + fail + " failed");
  process.exit(fail ? 1 : 0);
})().catch(e => { console.log("FAIL " + e.message); process.exit(1); });
