/* The Board button in the built page, in Chrome: six Goff Grunts open Boarding
   Actions with their clan on them, and the result comes back onto the ship.

     node apps/play/check_board.js [dir for screenshots] */
"use strict";
const fs = require("fs"), path = require("path");
const { launch } = require("../../tools/lib/chrome.js");
const REPO = path.join(__dirname, "..", "..");
const PAGE = path.join(REPO, "dist", "registry", "play", "Gothic Fleet Play.html");
const shots = process.argv[2];
let fail = 0, pass = 0;
const check = (n, ok, d) => { if(ok) pass++; else { fail++; console.log("  FAIL " + n + (d !== undefined ? "  -- " + JSON.stringify(d) : "")); } };
const sleep = ms => new Promise(r => setTimeout(r, ms));

/* a Da Ork Clanz fleet: a Kill Kroozer and a skwadron of six Goff Grunts */
const SETUP = `(() => {
  const G = GFP, L = G.LISTS.find(l => /Clanz/.test(l.nm));
  const row = (sec, re) => { const s = L.secs.findIndex(x => sec.test(x.t)); const e = L.secs[s].ents.findIndex(x => re.test(x.l || "")); return [s, e, L.secs[s].ents[e]]; };
  const [gs, ge, gn] = row(/Tiddla/, /Grunt assault/);
  const [cs, ce] = row(/CLAN UPGRADES/, /^Clan: Goffs \\(Black\\)/);
  const [ks, ke, kn] = row(/Big ship/, /Terror ship/);
  const doc = { ln: L.nm, limit: 1500, units: [
    { s: ks, e: ke, ref: kn.r, n: 1, opts: [], os: {}, name: "Da Big One", sn: L.secs[ks].t, el: kn.l },
    { s: gs, e: ge, ref: gn.r, n: 6, opts: [], os: {}, name: "", sn: L.secs[gs].t, el: gn.l, ups: { [cs + ":" + ce]: 1 }, sq: "A" } ] };
  const res = G.resolveFleet(doc);
  if(res.error) throw new Error(res.error);
  G.newGame(res);
  G.appState.G.st.forEach((st, i) => { if(st.ld == null) G.setLd(i, 7); });
  G.appState.V.screen = "roster"; G.render();
  return JSON.stringify(res.units.map(x => [x.R.entry.label, x.R.upgrades.filter(u => u.state !== "opt").map(u => u.label)]));
})()`;
const IN = expr => `(() => { const f = document.querySelector(".boardframe"); const w = f && f.contentWindow; const d = f && f.contentDocument; return (${expr}); })()`;

(async () => {
  if(!fs.existsSync(PAGE)) throw new Error("npm run build first");
  const cd = await launch({ prefix: "play-board-", args: ["--window-size=430,900", "--hide-scrollbars", "--allow-file-access-from-files"] });
  try{
    await cd.send("Page.enable");
    await cd.send("Emulation.setDeviceMetricsOverride", { width: 430, height: 900, deviceScaleFactor: 2, mobile: false });
    const shot = async n => { if(!shots) return; const r = await cd.send("Page.captureScreenshot", { format: "png" }); fs.writeFileSync(path.join(shots, n + ".png"), Buffer.from(r.data, "base64")); };
    const loaded = cd.once("Page.loadEventFired");
    await cd.send("Page.navigate", { url: "file:///" + PAGE.replace(/\\/g, "/").replace(/ /g, "%20") });
    await loaded;
    await cd.evaluate(`localStorage.setItem("gothic-fleet-play-board-where", "here")`);
    const units = JSON.parse(await cd.evaluate(SETUP));
    check("the Grunts have their clan", /Goff/.test(JSON.stringify(units[1])), units);
    await sleep(800);
    await shot("1-roster");
    check("every living ship has a Board button", await cd.evaluate(`document.querySelectorAll('[data-act="board"]').length`) >= 2);
    await cd.evaluate(`document.querySelector('[data-act="board"][data-i="1"]').click()`);
    await sleep(500);
    await shot("2-sheet");
    check("with another ship in the fleet the sheet asks", await cd.evaluate(`!!document.querySelector('[data-act="boardgo"]')`));
    await cd.evaluate(`document.querySelector('[data-act="boardgo"]').click()`);
    await sleep(1500);
    check("Boarding opens over the page", await cd.evaluate(`!!document.querySelector(".boardframe")`));
    const b = JSON.parse(await cd.evaluate(IN(`JSON.stringify({ n: w.S.att.ships.length, f: w.S.att.f, opts: w.S.att.ships[0].opts, dp: w.S.att.ships[0].dp, full: w.S.att.ships[0].n, back: !!d.getElementById("backToPlay"), badge: !!d.querySelector(".bfgt") })`)));
    check("six Grunts on the boarding side", b.n === 6 && /GRUNT/.test(b.full), b);
    check("the clan came along", b.opts.indexOf("goff") >= 0, b);
    check("a way back, no links to the sister tools", b.back && !b.badge, b);
    /* the enemy: an unhurt Dictator, chosen as in the sheet */
    await cd.evaluate(IN(`(() => { w.S.dice = "digital"; w.S.def.f = 0; w.S.def.ships = [{ n: "DICTATOR CLASS CRUISER", fid: "IMPERIAL NAVY", dp: 8, opts: [] }]; w.render(); return 1; })()`));
    await sleep(400);
    await shot("3-boarding");
    const txt = await cd.evaluate(IN(`d.getElementById("board").innerText`));
    check("six Goff Grunts against a Dictator: value 12 vs 11, +3 (Fleets pp. 371, 390; Rulebook p. 90)", /12\s*BOARDING/.test(txt) && /\+3\s*ROLL/.test(txt) && /11\s*BOARDING/.test(txt), txt.slice(0, 300));
    /* roll, then apply */
    await cd.evaluate(IN(`d.querySelector('[data-a="roll"]').click()`));
    await sleep(500);
    await shot("4-result");
    for(let n = 0; n < 12; n++){
      const done = await cd.evaluate(IN(`(() => { if(!f) return "gone"; const s = d.getElementById("resultSheet"); const a = ['[data-r="apply"]:not([disabled])', '[data-r="next"]', '[data-r="noreroll"]', '[data-r="alloc+"]'].map(q => s.querySelector(q)).find(Boolean); if(!a) return "wait"; a.click(); return a.dataset.r; })()`));
      if(done === "gone" || done === "next") break;
      await sleep(250);
    }
    await sleep(500);
    await shot("5-back");
    const closed = await cd.evaluate(`!document.querySelector(".boardframe")`);
    const grapple = await cd.evaluate(`!!(GFP.appState.G.board)`);
    check("the result closes it, or a grapple keeps it open for the next End Phase", closed || grapple);
    if(closed){
      const r = JSON.parse(await cd.evaluate(`JSON.stringify({ note: GFP.appState.V.boardNote, alive: GFP.PLAY.alive(GFP.appState.G.st[1]) })`));
      check("what happened is on the page", !!r.note && (r.note.ours.length + r.note.theirs.length) > 0, r);
      check("the squadron's losses are marked", /destroyed/.test(JSON.stringify(r.note.ours)) ? r.alive < 6 : r.alive === 6, r);
    }
    /* with the opponent's fleet linked, their ships are offered and come with
       their hits; a hit on my ship shows in my own */
    await cd.evaluate(`(() => { const G = GFP.appState.G; G.st[0].hits = 2; GFP.takeSnapshot({ t: "g", n: "Mikko", G: JSON.parse(JSON.stringify(G)), opt: {}, scr: "roster" }); G.st[0].hits = 1; GFP.appState.V.boardNote = null; GFP.render(); return 1; })()`);
    await sleep(300);
    if(await cd.evaluate(`!document.querySelector(".boardframe")`)){
      await cd.evaluate(`document.querySelector('[data-act="board"][data-i="0"]').click()`);
      await sleep(400);
      const foe = await cd.evaluate(`document.querySelector('[data-act="boardgo"][data-arg="0"]') ? document.querySelector('[data-act="boardgo"][data-arg="0"]').innerText : ""`);
      check("their ship is on the sheet with its hits left", /8 hits left/.test(foe), foe);
      await cd.evaluate(`document.querySelector('[data-act="boardgo"][data-arg="0"]').click()`);
      await sleep(1500);
      const s = JSON.parse(await cd.evaluate(IN(`JSON.stringify({ a: w.S.att.ships[0].dp, d: w.S.def.ships[0].dp, df: w.S.def.f, pj: w.S.def.ships[0].pj === undefined })`)));
      check("my hits and their hits", s.a === 9 && s.d === 8 && s.df >= 0 && s.pj, s);
    }
    /* a new tab: a real tap may open one, and its result comes back the same way */
    await cd.evaluate(`(() => { GFP.boardOpen() && GFP.boardOpen().close(); localStorage.setItem("gothic-fleet-play-board-where", "tab"); GFP.appState.V.board = null; GFP.render(); return 1; })()`);
    await sleep(300);
    await cd.evaluate(`document.querySelector('[data-act="board"][data-i="0"]').click()`);
    await sleep(300);
    check("the sheet says where it opens", /A new tab/.test(await cd.evaluate(`document.querySelector(".menu .box").innerText`)));
    await cd.send("Runtime.evaluate", { expression: `document.querySelector('[data-act="boardgo"][data-arg="-1"]').click()`, userGesture: true });
    await sleep(1500);
    const tab = JSON.parse(await cd.evaluate(`(() => { const o = GFP.boardOpen(), w = o && o.win; return JSON.stringify({ frame: !!document.querySelector(".boardframe"), n: w && w.S ? w.S.att.ships.length : -1, f: w && w.S ? w.S.att.f : -1 }); })()`));
    check("it opens in a tab with the ship on it, not over the page", !tab.frame && tab.n === 1 && tab.f >= 0, tab);
    const hits0 = await cd.evaluate(`GFP.PLAY.remaining(GFP.appState.U[0].R, GFP.appState.G.st[0])`);
    const msg = JSON.stringify({ bfgBoarding: 1, t: "result", spent: false, ships: [{ pj: 0, m: 0, name: "Da Big One", before: hits0, fin: hits0 - 2, state: "ok", crits: [], cata: null }] });
    /* sent from inside the tab: the page takes a result only from the window it opened */
    await cd.evaluate(`(() => { GFP.boardOpen().win.eval(${JSON.stringify("window.opener.postMessage(" + "__MSG__" + ', "*")')}.replace("__MSG__", ${JSON.stringify(msg)})); return 1; })()`);
    await sleep(500);
    check("the tab's result goes on the ship", (await cd.evaluate(`GFP.PLAY.remaining(GFP.appState.U[0].R, GFP.appState.G.st[0])`)) === hits0 - 2);
    check("and the tab is gone", await cd.evaluate(`!GFP.boardOpen()`));
  } finally { await cd.close(); }
  console.log("RESULT: " + fail + " errors, " + pass + " checks");
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e.message); process.exit(1); });
