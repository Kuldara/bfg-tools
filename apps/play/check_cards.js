/* Every class's card in the built page, in Chrome at phone width (user
   6.11.2026, with the arc map): each ship class of every list, fresh and
   crippled (an escort squadron with half its ships gone), drawn as the row
   in the normal and the compact view and as the ship's own card (sheet),
   360 px wide. No card may be wider than that - the page then scrolls
   sideways - and no weapon cell may cut its text; the heights are reported
   and kept under the prototypes' marks. Then a Tau fleet, the worst case
   of the table before, on the roster in both views: no sideways scroll.

     node apps/play/check_cards.js [--json out.json] [--shots dir] */
"use strict";
const fs = require("fs"), path = require("path");
const { launch } = require("../../tools/lib/chrome.js");
const REPO = path.join(__dirname, "..", "..");
/* PLAY_PAGE: another build's page to measure, for a before / after */
const PAGE = process.env.PLAY_PAGE || path.join(REPO, "dist", "registry", "play", "Gothic Fleet Play.html");
const arg = k => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const jsonOut = arg("--json"), shots = arg("--shots");
let fail = 0, pass = 0;
const check = (n, ok, d) => { if(ok) pass++; else { fail++; console.log("  FAIL " + n + (d !== undefined ? "  -- " + JSON.stringify(d).slice(0, 900) : "")); } };
const sleep = ms => new Promise(r => setTimeout(r, ms));

/* In the page: every list resolved whole, or entry by entry when the whole
   does not resolve (one admiral only, a ship that needs another); each
   class once. The row goes in a 360 px box off the screen; the sheet is
   fixed to the viewport, which the device metrics make 360 px, so its body
   is measured. */
const MEASURE = `(() => {
  const G = GFP, A = G.appState, PLAY = G.PLAY;
  const box = document.createElement("div");
  box.style.cssText = "position:absolute;left:-10000px;top:0;width:360px";
  document.body.appendChild(box);
  const seen = {}, out = { ships: 0, renders: 0, over: [], cut: [], tall: {}, h: { normal: [], compact: [], sheet: [] } };
  const unitsOf = L => { const u = []; L.secs.forEach((s, si) => s.ents.forEach((e, ei) => u.push({ s: si, e: ei, sn: s.t, el: e.l, ref: e.r, n: /ESCORT|Tiddla|Raider/i.test(s.t) ? 3 : 1, name: "" }))); return u; };
  const fleetsOf = L => { const all = unitsOf(L); const res = G.resolveFleet({ ln: L.nm, limit: 100000, units: all }); if(!res.error) return [res];
    return all.map(u => G.resolveFleet({ ln: L.nm, limit: 100000, units: [u] })).filter(r => !r.error); };
  const measure = (who, kind, html) => {
    box.innerHTML = '<div class="main' + (kind === "compact" ? " compact" : "") + '">' + html + '</div>';
    const card = kind === "sheet" ? box.querySelector(".sh-body") : box.firstElementChild.firstElementChild;
    if(!card){ out.over.push(kind + ": " + who + " drew nothing"); return; }
    out.renders++;
    const h = kind === "sheet" ? card.scrollHeight : card.offsetHeight;
    out.h[kind].push(h);
    if(!out.tall[kind] || h > out.tall[kind].h) out.tall[kind] = { h: h, who: who };
    if(card.scrollWidth > card.clientWidth + 1) out.over.push(kind + ": " + who + " +" + (card.scrollWidth - card.clientWidth) + "px");
    card.querySelectorAll(".wx b, .wx em, .spec b, .wt td").forEach(b => { if(b.scrollWidth > b.clientWidth + 1) out.cut.push(kind + ": " + who + ": " + b.textContent.trim().slice(0, 40)); });
  };
  G.DATA.lists.forEach(L => fleetsOf(L).forEach(res => {
    G.newGame(res);
    A.G.started = true; A.V.screen = "roster"; A.V.pop = null; A.V.sheet = null; A.V.info = false;
    A.U.forEach((x, i) => {
      const R = x.R; if(R.kind !== "ship") return;
      const id = (R.className || "") + "|" + (R.source && R.source.page);
      if(seen[id]) return; seen[id] = 1; out.ships++;
      if(A.G.st[i].ld == null) try{ G.setLd(i, 8); }catch(e){}
      const st0 = JSON.stringify(A.G.st[i]);
      [false, true].forEach(cr => {
        A.G.st[i] = JSON.parse(st0);
        const v0 = PLAY.view(R, A.G.st[i], A.G.fleet);
        if(cr && v0.escort) (A.G.st[i].members || []).forEach((m, k) => { if(k < Math.floor(A.G.st[i].members.length / 2)) m.dead = true; });
        else if(cr && v0.crippledAt) A.G.st[i].hits = v0.crippledAt;
        const who = (R.className || "?") + (cr ? " (crippled)" : "");
        A.V.compact = false; measure(who, "normal", G.renderRow(i, false));
        A.V.compact = true; measure(who, "compact", G.renderRow(i, false));
        A.V.compact = false; measure(who, "sheet", G.renderSheet(i));
      });
      A.G.st[i] = JSON.parse(st0);
    });
  }));
  box.remove();
  const q = (a, p) => { const s = a.slice().sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(p * s.length))] | 0; };
  out.stats = {};
  Object.keys(out.h).forEach(k => { out.stats[k] = { n: out.h[k].length, median: q(out.h[k], .5), p90: q(out.h[k], .9), max: Math.max.apply(null, out.h[k].concat([0])) }; });
  delete out.h;
  return JSON.stringify(out);
})()`;

/* The Tau Commerce Protection fleet (the hooks and the long bay ranges
   that overflowed the table before) on the roster, as many of its entries
   as resolve together. */
const ROSTER = `(() => {
  const G = GFP, A = G.appState;
  const L = G.DATA.lists.find(l => /^Tau . Commerce Protection$/.test(l.nm));
  if(!L) throw new Error("no Tau Commerce Protection list");
  const all = []; L.secs.forEach((s, si) => s.ents.forEach((e, ei) => all.push({ s: si, e: ei, sn: s.t, el: e.l, ref: e.r, n: 1, name: "" })));
  let units = [], res = null;
  all.forEach(u => { const r = G.resolveFleet({ ln: L.nm, limit: 100000, units: units.concat([u]) }); if(!r.error){ units.push(u); res = r; } });
  if(!res) throw new Error("nothing of the list resolves");
  G.newGame(res);
  A.G.st.forEach((st, i) => { if(A.U[i].R.kind === "ship" && st.ld == null) try{ G.setLd(i, 8); }catch(e){} });
  A.U.forEach((x, i) => { const v = G.PLAY.view(x.R, A.G.st[i], A.G.fleet); if(x.R.kind === "ship" && v.crippledAt && !v.escort && i % 2) A.G.st[i].hits = v.crippledAt; });
  A.G.started = true; A.V.screen = "roster"; A.V.compact = false; G.render();
  return A.U.filter(x => x.R.kind === "ship").length;
})()`;

(async () => {
  if(!fs.existsSync(PAGE)) throw new Error("npm run build first");
  const cd = await launch({ prefix: "play-cards-", args: ["--window-size=360,800", "--hide-scrollbars", "--allow-file-access-from-files"] });
  try{
    await cd.send("Page.enable");
    await cd.send("Emulation.setDeviceMetricsOverride", { width: 360, height: 800, deviceScaleFactor: 2, mobile: true });
    const loaded = cd.once("Page.loadEventFired");
    await cd.send("Page.navigate", { url: "file:///" + PAGE.replace(/\\/g, "/").replace(/ /g, "%20") });
    await loaded;
    await sleep(500);
    const t0 = Date.now();
    const r = JSON.parse(await cd.evaluate(MEASURE));
    console.log("  " + r.ships + " classes, " + r.renders + " renders in " + ((Date.now() - t0) / 1000).toFixed(1) + " s");
    Object.keys(r.stats).forEach(k => { const s = r.stats[k]; console.log("  " + k.padEnd(8) + " median " + s.median + " px, p90 " + s.p90 + ", max " + s.max + " (" + (r.tall[k] ? r.tall[k].who : "") + ")"); });
    check("every class of every list is drawn (180 or so)", r.ships >= 150 && r.renders === r.ships * 6, [r.ships, r.renders]);
    check("no card wider than the phone: the row in both views, the ship's card", r.over.length === 0, r.over);
    check("no weapon cell or spec value cut", r.cut.length === 0, r.cut);
    /* the marks of 6.11.2026, measured here on the build before the arc map
       and on the first with it: the normal row's median 370 then 359 px,
       the compact 209 then 211 - a change that makes them much taller is a
       change to look at */
    check("the normal row stays short: median under 380 px", r.stats.normal.median < 380, r.stats.normal);
    check("the compact row stays short: median under 240 px", r.stats.compact.median < 240, r.stats.compact);
    if(jsonOut) fs.writeFileSync(jsonOut, JSON.stringify(r, null, 1));
    /* the roster at phone width */
    const n = await cd.evaluate(ROSTER);
    await sleep(300);
    const noScroll = () => cd.evaluate(`document.scrollingElement.scrollWidth <= window.innerWidth`);
    const shot = async name => { if(!shots) return; const s = await cd.send("Page.captureScreenshot", { format: "png", captureBeyondViewport: true, clip: { x: 0, y: 0, width: 360, height: Math.min(2400, await cd.evaluate("document.documentElement.scrollHeight")), scale: 1 } }); fs.mkdirSync(shots, { recursive: true }); fs.writeFileSync(path.join(shots, name + ".png"), Buffer.from(s.data, "base64")); };
    check("a Tau fleet on the roster, " + n + " ships: no sideways scroll at 360 px", await noScroll() && n >= 3, n);
    await shot("roster_normal");
    await cd.evaluate(`(() => { GFP.appState.V.compact = true; GFP.render(); return 1; })()`);
    await sleep(300);
    check("... nor in the compact view", await noScroll());
    await shot("roster_compact");
  } finally { cd.close(); }
  console.log((fail ? "FAIL " : "ok ") + pass + " passed, " + fail + " failed");
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
