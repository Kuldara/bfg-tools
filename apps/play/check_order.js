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
  const res = G.resolveFleet({ ln: L.nm, limit: 1500, units: [find(/^Lunar/), find(/^Dictator/), Object.assign(find(/^Lunar/), { opts: [0] }), find(/^Gothic/)] });
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

    /* the set-up tells the two Lunars apart by what was paid and bought */
    await cd.evaluate(`GFP.appState.V.screen = "setup"; GFP.render(); 1`);
    const rowOf = i => cd.evaluate(`document.querySelector('.setrow[data-u="${i}"] .who').innerText`);
    const plain = await rowOf(0), bought = await rowOf(2);
    const ptsOf = s => +(/(\d+) pts/.exec(s) || [])[1];
    check("the set-up shows the price", ptsOf(plain) === await cd.evaluate(`GFP.appState.U[0].R.points`), plain);
    check("an upgrade raises the price shown", ptsOf(bought) > ptsOf(plain), [plain, bought]);
    check("what was bought is said on the row", await cd.evaluate(`!!document.querySelector('.setrow[data-u="2"] .upl') && !document.querySelector('.setrow[data-u="0"] .upl')`));
    await shot("0-setup");
    await cd.evaluate(`GFP.appState.V.screen = "roster"; GFP.render(); 1`);
    await sleep(500); /* the new screen's tap guard */

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
  /* the set-up's upgrade dice change the card's numbers (user 2.11.2026:
     "shouldn't it give more hit points?"): a Blood Axe Warlord's ship with
     a Reinforced Hull (Rulebook p. 158) */
  {
    const r = JSON.parse(await cd.evaluate(`(() => {
      const G = GFP, L = G.LISTS.find(l => /Clanz/.test(l.nm));
      const row = (sec, re) => { const s = L.secs.findIndex(x => sec.test(x.t)); const e = L.secs[s].ents.findIndex(x => re.test(x.l || "")); return [s, e, L.secs[s].ents[e]]; };
      const [ws, we, wn] = row(/^WARLORD$/, /^Ork Warlord$/), [ks, ke, kn] = row(/Big ship/, /^Kill kroozer$/);
      /* the clan and the refit as the builder saves them (docs/save-format.md: upn) */
      const [bs, be, bn] = row(/CLAN UPGRADES/, /^Clan: Blood Axes/), [rs, re, rn] = row(/CLAN UPGRADES/, /^Imperial Navy refit, rolled randomly/);
      const upn = {}; upn[L.secs[bs].t + "\u0001" + bn.l] = "take"; upn[L.secs[rs].t + "\u0001" + rn.l] = "take";
      const res = G.resolveFleet({ ln: L.nm, limit: 1500, units: [
        { s: ws, e: we, ref: wn.r, n: 1, opts: [], os: {}, name: "", sn: L.secs[ws].t, el: wn.l },
        { s: ks, e: ke, ref: kn.r, n: 1, opts: [], os: {}, name: "", sn: L.secs[ks].t, el: kn.l, upn } ] });
      if(res.error) throw new Error(res.error);
      const up = (res.units[1].R.upgrades || []).filter(u => u.state === "take").map(u => u.label);
      if(!up.some(l => /^Imperial Navy refit, rolled randomly/.test(l))) throw new Error("the refit was not taken: " + up.join(" | "));
      G.newGame(res);
      G.appState.G.st.forEach((st, i) => { if(st.ld == null) G.setLd(i, 8); });
      G.appState.V.screen = "setup"; G.render();
      const before = G.PLAY.view(G.appState.U[1].R, G.appState.G.st[1], G.appState.G.fleet);
      const sel = document.querySelector('select[data-sel="pre"][data-key="inrefit"]');
      if(!sel) throw new Error("no refit select: " + up.join(" | "));
      sel.value = "1-4"; sel.dispatchEvent(new Event("change", { bubbles: true }));
      const after = G.PLAY.view(G.appState.U[1].R, G.appState.G.st[1], G.appState.G.fleet);
      const desc = (document.querySelector('select[data-sel="pre"][data-key="inrefit"] ~ .predesc') || {}).textContent || "";
      G.appState.V.screen = "roster"; G.appState.V.compact = false; G.render();
      const card = (document.querySelector('section.row[data-u="1"]') || {}).innerHTML || "";
      return JSON.stringify({ before: [before.max, before.crippledAt, before.speed.base], after: [after.max, after.crippledAt, after.speed.base], fx: G.appState.G.st[1].fx, desc, boxes: (card.match(/aria-label="hits \\d+"/g) || []).length, spd: (/<small>SPD<\\/small><b>(\\d+ cm)/.exec(card) || [])[1] });
    })()`));
    check("a Kill Kroozer starts at 10 hits, crippled at 5, 20 cm", r.before.join() === "10,5,20", r.before);
    check("Reinforced Hull picked: 13 hits (+25 % rounded up), crippled at 7, 15 cm (p. 158, 65)", r.after.join() === "13,7,15", r.after);
    check("st.fx holds the numbers", r.fx && r.fx.hits === 3 && r.fx.speed === -5, r.fx);
    check("the select says what is on the card now", /on the card: 13 hits, 15 cm/.test(r.desc), r.desc);
    check("the card has 13 boxes and SPD 15 cm", r.boxes === 13 && r.spd === "15 cm", [r.boxes, r.spd]);
  }
  }finally{ await cd.close(); }
  console.log((fail ? "FAIL " : "ok ") + pass + " passed, " + fail + " failed");
  process.exit(fail ? 1 : 0);
})().catch(e => { console.log("FAIL " + e.message); process.exit(1); });
