/* The picture of the app on each link preview, taken from the built page
   (dist/) in headless Chrome: a real ship card, a real scenario list, a real
   rolled table. Each entry opens its page, sets it up and returns the part to
   take as { x, y, w, h } (CSS pixels); null takes the whole viewport. */
"use strict";
const path = require("path");
const { DIST } = require("../lib/kit.js");

const wait = ms => `await new Promise(r => setTimeout(r, ${ms}));`;
const rect = sel => `(() => { const r = document.querySelector(${JSON.stringify(sel)}).getBoundingClientRect();
  return { x: r.x, y: r.y, w: r.width, h: r.height }; })()`;

/* a fleet for Play, from the rosters its smoke test plays (rosters.json) */
function playHash() {
  const rosters = require("../../apps/play/rosters.json");
  const r = rosters.find(x => /chaos/i.test(x.doc.ln)) || rosters[0];
  return "#fleetj=" + Buffer.from(JSON.stringify(r.doc)).toString("base64url");
}

const SHOTS = {
  /* one ship card, as printed: the Chaos battle barge */
  registry: {
    page: "registry/index.html", width: 1300, height: 1000,
    setup: `(async () => {
      const G = GFR, li = G.LISTS.findIndex(L => /^Chaos/i.test(L.nm));
      G.switchList(li); G.appState.S.units = [];
      const L = G.LISTS[li]; let at = null;
      L.secs.forEach((s, si) => s.ents.forEach((e, ei) => { if (!at && e.r && /battle barge/i.test(e.l)) at = [si, ei]; }));
      if (!at) throw new Error("no Chaos battle barge in " + L.nm);
      G.addUnit(at[0], at[1]); G.render();
      ${wait(200)}
      document.querySelector('.unit[data-ui="0"] .ibtn').click();
      ${wait(400)}
      return ${rect("#infodlg .if-card .k")};
    })()`,
  },
  /* the fleet in play on a phone-sized screen */
  play: {
    page: "registry/play/Gothic Fleet Play.html", hash: playHash, width: 430, height: 900, scale: 2,
    setup: `(async () => { ${wait(600)}
      const go = [...document.querySelectorAll("button")].find(b => / units .* pts/.test(b.textContent));
      if (!go) throw new Error("play: the fleet from the link is not on the list");
      go.click(); ${wait(600)}
      /* a Leadership for every ship, the game started, three hits on the flagship */
      for (let i = 0; i < 30; i++) {
        const b = document.querySelector('[data-act="ld"][data-i="' + i + '"][data-arg="8"]');
        if (b) { b.click(); ${wait(80)} }
      }
      document.querySelector('[data-act="start"]').click(); ${wait(500)}
      for (let i = 0; i < 3; i++) { document.querySelector('[data-act="hit"][data-i="0"]').click(); ${wait(80)} }
      ${wait(300)}
      return null; })()`,
  },
  /* the scenario cards with their maps */
  scenarios: {
    page: "scenarios/index.html", width: 1300, height: 900,
    setup: `(async () => { ${wait(600)} const g = document.querySelector("main") || document.body;
      const r = g.getBoundingClientRect(); return { x: r.x, y: 230, w: r.width, h: 900 - 230 }; })()`,
  },
  /* a boarding action resolved */
  boarding: {
    page: "boarding/index.html", width: 430, height: 900, scale: 2,
    prime: () => `localStorage.setItem("bfg-boarding-v1", JSON.stringify({ v: 1, dice: "digital", round: 1,
      att: { f: 5, ships: [{ n: "DESPOILER CLASS BATTLESHIP", fid: "CHAOS", opts: [], dp: 12 }], blast: 0, orders: 0, other: 0 },
      def: { f: 0, ships: [{ n: "LUNAR CLASS CRUISER", fid: "IMPERIAL NAVY", opts: [], dp: 6 }], blast: 0, orders: 0, other: 0 } }))`,
    setup: `(async () => { ${wait(400)}
      const b = document.querySelector('[data-a="roll"]');
      if (!b) throw new Error("boarding: no roll button");
      b.click(); ${wait(600)}
      return { x: 0, y: 0, w: 430, h: 395 }; })()`,
  },
  /* a rolled table */
  terrain: {
    page: "terrain/index.html", width: 1300, height: 1100,
    setup: `(async () => { ${wait(800)} const m = document.getElementById("chart");
      const r = m.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; })()`,
  },
};

/* The same dice every time: a new image only when the app or its data changed. */
const SEEDED = `(() => { let s = 20261029;
  Math.random = () => { s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; })();`;

/* -> { png: Buffer, w, h } for each app, in one browser */
async function takeAll(cd, ids) {
  const out = {};
  await cd.send("Page.enable");
  await cd.send("Page.addScriptToEvaluateOnNewDocument", { source: SEEDED });
  for (const id of ids) {
    const s = SHOTS[id];
    await cd.send("Emulation.setDeviceMetricsOverride", { width: s.width, height: s.height, deviceScaleFactor: s.scale || 2, mobile: false });
    const url = "file:///" + path.join(DIST, s.page).replace(/\\/g, "/").replace(/ /g, "%20") + (s.hash ? s.hash() : "");
    /* through a blank page: a new #hash on the same page would not load it again */
    let loaded = cd.once("Page.loadEventFired");
    await cd.send("Page.navigate", { url: "about:blank" });
    await loaded;
    for (let pass = s.prime ? 2 : 1; pass > 0; pass--) {
      loaded = cd.once("Page.loadEventFired");
      await cd.send("Page.navigate", { url });
      await loaded;
      /* state the page reads when it starts (a saved battle): set, then open again */
      if (pass === 2) await cd.evaluate(s.prime());
    }
    const clip = await cd.evaluate(s.setup);
    const r = await cd.send("Page.captureScreenshot", clip
      ? { format: "png", clip: { x: clip.x, y: clip.y, width: clip.w, height: clip.h, scale: 1 } }
      : { format: "png" });
    out[id] = { png: Buffer.from(r.data, "base64"), w: clip ? clip.w : s.width, h: clip ? clip.h : s.height };
  }
  return out;
}

module.exports = { SHOTS, takeAll };
