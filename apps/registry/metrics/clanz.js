/* The builder's input meter: how many taps, menu choices and scrolls
   building a Da Ork Clanz fleet takes.

     node metrics/clanz.js [--page=<html>] [--ui=old|new] [--mode=planned|browse]
                           [--size=375x812] [--json=<result.json>] [--shots=<folder>]

   The user's principle "all user input is error": every input counts,
   scrolling too. The measurement runs in a REAL Chrome (headless), because
   the cost of scrolling depends on how tall the rows are drawn. Every
   step is done with the page's own buttons (el.click() -> the page's own handler):

     tap        one touch on a button
     choice     a drop-down = two inputs (open + choose)
     scroll     one swipe moves at most 80 % of the visible area
     jump       on a phone a swipe right/left to Your fleet and
                back (the page's own gesture, 18.10.2026), when it is cheaper

   The task is the same in both UI versions: the end state must be the same
   fleet, and the meter checks it (Warlords, skwadrons, re-rolls,
   clan, Gubbins, nothing red in the legality panel).

   Modes:
     planned  the player knows the order: a Warlord and right after him his ships
     browse   the player browses the catalogue from top to bottom: Warlords first, then
              the ships in catalogue order, and shares them out to the Warlords

   What the meter does NOT measure: time spent reading, counting and searching,
   nor wrong taps. That is still most of the pain, so the
   result is recorded beside it in words. */
"use strict";
const fs = require("fs"), path = require("path"), http = require("http");

const HERE = __dirname, ROOT = path.join(HERE, "..");
const arg = (k, d) => { const a = process.argv.find(x => x.startsWith("--" + k + "=")); return a ? a.slice(k.length + 3) : d; };
const { PAGE: BUILT, PAGE_GLOBALS_JS } = require(path.join(ROOT, "test-support.js"));
const PAGE = path.resolve(arg("page", BUILT));
const UI = arg("ui", "new"), MODE = arg("mode", "planned");
const [W, H] = arg("size", "375x812").split("x").map(Number);
const JSON_OUT = arg("json", "");
const { launch } = require("../../../tools/lib/chrome.js");

/* -------------------------------------------------------------- task -- */
/* Three Warlords at 1 500 points (one per 500 pts or part, Fleets p. 372).
   W1: two re-rolls, Goffs, 'Uge ship (Hammer), a big ship skwadron
   (Terror + Kill), two tiddlas (Ravager x4, Brute x3), Gubbins on
   his ship. W2: Kill kroozer + Savage x5. W3: Rok + Onslaught x3. */
const EXPECT = {
  W1: { rr: 2, clan: "Goffs", ships: ["Hammer Class Battlekroozer", "Terror Ship", "Kill Kroozer", "Ravager Attack Ship x4", "Brute Ram Ship x3"] },
  W2: { rr: 1, clan: "", ships: ["Kill Kroozer", "Savage Gunship x5"] },
  W3: { rr: 1, clan: "", ships: ["Rok", "Onslaught Attack Ship x3"] }
};

/* Steps: [op, ...]. Units get names when they are created (as:). */
const OLD = {
  planned: [
    ["add", /^Ork Warlord$/, "W1"], ["up", "W1", /^One extra re-roll/i],
    ["add", /^Hammer class battlekroozer/i, "HAM"], ["add", /^Terror ship/i, "TER"], ["add", /^Kill kroozer/i, "KIL1"],
    ["add", /^Ravager/i, "RAV"], ["more", /^Ravager/i],
    ["add", /^Brute/i, "BRU"],
    ["sq", "TER", "A"], ["sq", "KIL1", "A"],
    ["up", "HAM", /^Clan: Goffs/], ["up", "TER", /^Clan: Goffs/], ["up", "KIL1", /^Clan: Goffs/],
    ["up", "RAV", /^Clan: Goffs/], ["up", "BRU", /^Clan: Goffs/],
    ["up", "HAM", /^Extra Turrets$/],
    ["add", /^Ork Warlord$/, "W2"], ["add", /^Kill kroozer/i, "KIL2"],
    ["add", /^Savage/i, "SAV"], ["more", /^Savage/i], ["more", /^Savage/i],
    ["add", /^Ork Warlord$/, "W3"], ["add", /^Rok$/, "ROK"], ["add", /^Onslaught/i, "ONS"]
  ],
  browse: [
    ["add", /^Ork Warlord$/, "W1"], ["more", /^Ork Warlord$/, "W2"], ["more", /^Ork Warlord$/, "W3"],
    ["up", "W1", /^One extra re-roll/i],
    ["add", /^Hammer class battlekroozer/i, "HAM"], ["add", /^Terror ship/i, "TER"], ["add", /^Kill kroozer/i, "KIL1"],
    ["add", /^Kill kroozer/i, "KIL2"],
    ["add", /^Ravager/i, "RAV"], ["more", /^Ravager/i], ["add", /^Onslaught/i, "ONS"],
    ["add", /^Savage/i, "SAV"], ["more", /^Savage/i], ["more", /^Savage/i],
    ["add", /^Brute/i, "BRU"], ["add", /^Rok$/, "ROK"],
    ["wl", "HAM", "W1"], ["wl", "TER", "W1"], ["wl", "KIL1", "W1"], ["wl", "RAV", "W1"], ["wl", "BRU", "W1"],
    ["wl", "KIL2", "W2"], ["wl", "SAV", "W2"],
    ["sq", "TER", "A"], ["sq", "KIL1", "A"],
    ["up", "HAM", /^Clan: Goffs/], ["up", "TER", /^Clan: Goffs/], ["up", "KIL1", /^Clan: Goffs/],
    ["up", "RAV", /^Clan: Goffs/], ["up", "BRU", /^Clan: Goffs/],
    ["up", "HAM", /^Extra Turrets$/]
  ]
};
/* The new Warlord block (J226): re-rolls and clan in the block heading, the catalogue's +
   adds to the active Warlord, a kroozer is paired by itself when a separate
   skwadron would not fit, Gubbins only on the Warlord's ship. */
const NEW = {
  planned: [
    ["add", /^Ork Warlord$/, "W1"], ["rr", "W1", 2], ["clan", "W1", "Goffs"],
    ["add", /^Hammer class battlekroozer/i, "HAM"], ["add", /^Terror ship/i, "TER"], ["add", /^Kill kroozer/i, "KIL1"],
    ["add", /^Ravager/i, "RAV"], ["more", /^Ravager/i],
    ["add", /^Brute/i, "BRU"],
    ["up", "HAM", /^Extra Turrets$/],
    ["wlnew", /^Ork Warlord$/, "W2"], ["add", /^Kill kroozer/i, "KIL2"],
    ["add", /^Savage/i, "SAV"], ["more", /^Savage/i], ["more", /^Savage/i],
    ["wlnew", /^Ork Warlord$/, "W3"], ["add", /^Rok$/, "ROK"], ["add", /^Onslaught/i, "ONS"]
  ],
  browse: [
    ["add", /^Ork Warlord$/, "W1"], ["wlnew", /^Ork Warlord$/, "W2"], ["wlnew", /^Ork Warlord$/, "W3"],
    ["rr", "W1", 2], ["clan", "W1", "Goffs"],
    ["active", "W1"],
    ["add", /^Hammer class battlekroozer/i, "HAM"], ["add", /^Terror ship/i, "TER"], ["add", /^Kill kroozer/i, "KIL1"],
    ["add", /^Ravager/i, "RAV"], ["more", /^Ravager/i], ["add", /^Brute/i, "BRU"],
    ["active", "W2"],
    ["add", /^Kill kroozer/i, "KIL2"], ["add", /^Savage/i, "SAV"], ["more", /^Savage/i], ["more", /^Savage/i],
    ["active", "W3"],
    ["add", /^Onslaught/i, "ONS"], ["add", /^Rok$/, "ROK"],
    ["up", "HAM", /^Extra Turrets$/]
  ]
};
const STEPS = (UI === "old" ? OLD : NEW)[MODE];
if(!STEPS) throw new Error("unknown mode " + MODE);

/* -------------------------------------------------------------- server -- */
function serve(file){
  const body = fs.readFileSync(file);
  const srv = http.createServer((req, res) => {
    if(req.url.split("?")[0] === "/reg.html"){ res.writeHead(200, { "content-type": "text/html; charset=utf-8" }); res.end(body); }
    else { res.writeHead(404); res.end(); }
  });
  return new Promise(ok => srv.listen(0, "127.0.0.1", () => ok(srv)));
}

/* ---------------------------------------------------------- Chrome/CDP -- */
/* headless Chrome with a DevTools session: tools/lib/chrome.js */
const chrome = () => launch({ prefix: "gfr-metrics-", args: ["--window-size=" + W + "," + H] });

/* ------------------------------------------- the part run on the page -- */
function inPage(){
  const Q = s => document.querySelector(s);
  const C = { taps: 0, choices: 0, scrolls: 0, jumps: 0, byOp: {}, notes: [] };
  let op = "";
  const add = (k, n) => { C[k] += n; C.byOp[op] = C.byOp[op] || { taps: 0, choices: 0, scrolls: 0 }; if(k in C.byOp[op]) C.byOp[op][k] += n; };
  const one = window.matchMedia("(max-width:1020px)").matches;
  const NAMES = {};
  let backY = null;
  /* the sticky strip on a phone covers the top of the screen */
  const band = () => {
    const st = Q(".tb-strip"), top = st && getComputedStyle(st).position === "sticky" ? st.getBoundingClientRect().bottom : 0;
    return { top: Math.max(0, top), bottom: innerHeight };
  };
  const inView = el => { const b = band(), r = el.getBoundingClientRect(); return r.top >= b.top + 2 && r.bottom <= b.bottom - 2 && r.height > 0; };
  const swipesTo = (el) => {
    const b = band(), r = el.getBoundingClientRect(), vis = b.bottom - b.top;
    let d = 0;
    if(r.top < b.top + 2) d = r.top - b.top - 12;
    else if(r.bottom > b.bottom - 2) d = Math.min(r.bottom - b.bottom + 12, r.top - b.top - 12);
    return { d: d, n: d ? Math.ceil(Math.abs(d) / (0.8 * vis) - 1e-6) : 0 };
  };
  const fleetTop = () => { const f = Q("#fleet"); const s = f.closest("section") || f; return s.getBoundingClientRect().top + scrollY - band().top - 8; };
  function reach(el){
    if(!el) throw new Error("no element (" + op + ")");
    if(inView(el)) return;
    const y0 = scrollY;
    const plain = swipesTo(el);
    let best = { n: plain.n, y: y0 + plain.d, jump: null };
    if(one){
      const inFleet = !!el.closest("#fleet, #checks, #facts") ;
      const maxY = Math.max(0, document.documentElement.scrollHeight - innerHeight);
      if(inFleet && y0 < Math.min(fleetTop(), maxY) - 1){
        window.scrollTo(0, fleetTop());
        const s = swipesTo(el);
        if(1 + s.n < best.n) best = { n: s.n, y: scrollY + s.d, jump: "fleet", from: y0 };
        window.scrollTo(0, y0);
      } else if(!inFleet && backY != null){
        window.scrollTo(0, backY);
        const s = swipesTo(el);
        if(1 + s.n < best.n) best = { n: s.n, y: scrollY + s.d, jump: "back" };
        window.scrollTo(0, y0);
      }
    }
    if(best.jump){ add("scrolls", 1); C.jumps++; if(best.jump === "fleet") backY = best.from; else backY = null; }
    window.scrollTo(0, best.y);
    add("scrolls", best.n);
  }
  const tap = el => { reach(el); add("taps", 1); el.click(); };
  const choose = (el, value) => {
    reach(el); add("choices", 2);
    el.value = value;
    if(el.value !== value) throw new Error("the menu has no value " + value + " (" + op + ")");
    el.dispatchEvent(new Event("change", { bubbles: true }));
  };
  const entry = re => {
    const Lx = L();
    for(let si = 0; si < Lx.secs.length; si++){
      const es = Lx.secs[si].ents || [];
      for(let ei = 0; ei < es.length; ei++) if(re.test(es[ei].l) && es[ei].k !== "up") return [si, ei];
    }
    throw new Error("row not found " + re);
  };
  const addBtn = re => { const [si, ei] = entry(re); return Q('#catalogue button.add[data-s="' + si + '"][data-e="' + ei + '"]'); };
  const idx = nm => { const u = NAMES[nm]; const i = S.units.indexOf(u); if(i < 0) throw new Error("no unit " + nm); return i; };
  const upButton = (nm, re) => {
    const i = idx(nm), R = resolveUnit(S.units[i]);
    const up = R.upgrades.filter(x => re.test(String(x.label)))[0];
    if(!up) throw new Error("upgrade not offered " + nm + " " + re);
    const [si, ei] = up.key.split(":");
    return Q('#fleet [data-u="' + i + '"][data-us="' + si + '"][data-ue="' + ei + '"][data-v="take"]');
  };
  const OPS = {
    add(re, as){ const before = S.units.slice(); tap(addBtn(re)); const nu = S.units.filter(u => before.indexOf(u) < 0);
      if(as){ if(nu.length !== 1) throw new Error("the add did not make exactly one unit " + re); NAMES[as] = nu[0]; } },
    more(re, as){ OPS.add(re, as); },
    up(nm, re){
      let b = upButton(nm, re);
      const det = b && b.closest("details");
      if(det && !det.open){ tap(det.querySelector("summary")); return "wait"; }
      tap(b);
    },
    sq(nm, tag){ choose(Q('#fleet .sqin[data-u="' + idx(nm) + '"]'), tag); },
    wl(nm, w){ choose(Q('#fleet .wlin[data-u="' + idx(nm) + '"]'), NAMES[w].uid); },
    rr(nm, n){ tap(Q('#fleet [data-wlrr="' + idx(nm) + '"][data-n="' + n + '"]')); },
    clan(nm, c){ tap(Q('#fleet [data-wlclan="' + idx(nm) + '"][data-c="' + c + '"]')); },
    active(nm){ const b = Q('#wlbar [data-wlpick="' + idx(nm) + '"]'); tap(b || Q('#fleet [data-wlactive="' + idx(nm) + '"]')); },
    /* a new Warlord from the strip's + Warlord button, when there is a strip */
    wlnew(re, as){ const b = Q('#wlbar [data-wladd]'); if(!b) return OPS.add(re, as);
      const before = S.units.slice(); tap(b); const nu = S.units.filter(u => before.indexOf(u) < 0); if(as) NAMES[as] = nu[0]; }
  };
  window.__M = {
    start(){ switchList(LISTS.findIndex(l => /Da Ork Clanz/.test(l.nm))); S.units = []; S.limit = 1500; save(); render(); window.scrollTo(0, 0); return true; },
    step(s){ op = s[0]; const args = s.slice(1).map(a => typeof a === "string" && /^\/.*\/[a-z]*$/.test(a) ? new RegExp(a.slice(1, a.lastIndexOf("/")), a.slice(a.lastIndexOf("/") + 1)) : a);
      return OPS[op].apply(null, args) || "ok"; },
    result(){
      const RF = fleetResolved();
      const ws = S.units.filter(u => /^Ork Warlord$/.test((resolveUnit(u).entry || {}).label || ""));
      const name = u => { const R = resolveUnit(u); return title(R.className) + (R.hulls > 1 ? " x" + R.hulls : ""); };
      const out = {};
      ws.forEach((w, k) => {
        const wi = S.units.indexOf(w), R = resolveUnit(w);
        const mine = S.units.filter((u, i) => RF.command && RF.command[i] === wi);
        const clans = []; mine.forEach(u => resolveUnit(u).upgrades.forEach(x => {
          const m = /^Clan: (\w[\w ]*?) \(/.exec(String(x.label)); if(m && x.state === "take" && clans.indexOf(m[1]) < 0) clans.push(m[1]); }));
        out["W" + (k + 1)] = { rr: R.rerolls ? R.rerolls.total : 1, clan: clans.join(","), ships: mine.map(name).sort(),
          clanAll: mine.every(u => resolveUnit(u).upgrades.some(x => /^Clan: /.test(x.label) && x.state === "take") || !resolveUnit(u).upgrades.some(x => /^Clan: /.test(x.label))) };
      });
      const bad = RF.checks.filter(c => !c.ok).map(c => c.t + " = " + c.v);
      return { counts: C, warlords: out, bad: bad, total: total(), names: Object.keys(NAMES) };
    }
  };
}

(async function main(){
  const srv = await serve(PAGE);
  const port = srv.address().port;
  const B = await chrome();
  try{
    await B.send("Page.enable");
    await B.send("Emulation.setDeviceMetricsOverride", { width: W, height: H, deviceScaleFactor: 1, mobile: W < 1021 });
    const loaded = B.once("Page.loadEventFired");
    await B.send("Page.navigate", { url: "http://127.0.0.1:" + port + "/reg.html" });
    await loaded;
    await B.evaluate(PAGE_GLOBALS_JS + "(" + inPage.toString() + ")(); __M.start()");
    for(const s of STEPS){
      const enc = JSON.stringify(s.map(a => a instanceof RegExp ? String(a) : a));
      let r = await B.evaluate("__M.step(" + enc + ")");
      /* a <details> opened by its summary toggles on the next task */
      while(r === "wait"){ await new Promise(ok => setTimeout(ok, 30)); r = await B.evaluate("__M.step(" + enc + ")"); }
      await new Promise(ok => setTimeout(ok, 5));
    }
    const res = await B.evaluate("__M.result()");
    /* --shots=<folder>: pictures of the catalogue (strip and chips) and Your fleet */
    const SHOTS = arg("shots", "");
    if(SHOTS){
      fs.mkdirSync(SHOTS, { recursive: true });
      const shot = async (nm, js) => {
        await B.evaluate(js); await new Promise(ok => setTimeout(ok, 120));
        const r = await B.send("Page.captureScreenshot", { format: "png" });
        fs.writeFileSync(path.join(SHOTS, nm + "_" + W + "x" + H + ".png"), Buffer.from(r.data, "base64"));
      };
      await shot("catalogue", "(() => { const s = [...document.querySelectorAll('#catalogue details.sec > summary')].filter(x => /Big Ship/i.test(x.textContent))[0]; window.scrollTo(0, s.getBoundingClientRect().top + scrollY - 200); })()");
      await shot("fleet", "(() => { const f = document.querySelector('#fleet'); window.scrollTo(0, f.getBoundingClientRect().top + scrollY - 70); })()");
      await shot("fleet2", "window.scrollBy(0, innerHeight - 140)");
      await shot("warlord2", "(() => { const p = document.querySelectorAll('#fleet .wlpanel')[1]; if(p) window.scrollTo(0, p.getBoundingClientRect().top + scrollY - 70); })()");
    }
    /* end state: the same fleet as in the task */
    const diff = [];
    Object.keys(EXPECT).forEach(k => {
      const e = EXPECT[k], g = res.warlords[k];
      if(!g){ diff.push(k + " missing"); return; }
      if(g.rr !== e.rr) diff.push(k + " re-rollit " + g.rr + " != " + e.rr);
      if(g.clan !== e.clan) diff.push(k + " clan '" + g.clan + "' != '" + e.clan + "'");
      if(e.clan && !g.clanAll) diff.push(k + " clan not on every skwadron");
      if(JSON.stringify(g.ships) !== JSON.stringify(e.ships.slice().sort())) diff.push(k + " ships " + JSON.stringify(g.ships));
    });
    const c = res.counts, all = c.taps + c.choices + c.scrolls;
    console.log(PAGE.split(/[\\/]/).slice(-2).join("/") + "  ui=" + UI + "  mode=" + MODE + "  " + W + "x" + H);
    console.log("  inputs " + all + "  (taps " + c.taps + ", menu choices " + c.choices + ", scrolls " + c.scrolls +
                (c.jumps ? ", of which jumps " + c.jumps : "") + ")");
    Object.keys(c.byOp).forEach(k => { const o = c.byOp[k]; console.log("    " + k.padEnd(7) + " " + (o.taps + o.choices + o.scrolls) +
      "  (" + o.taps + " / " + o.choices + " / " + o.scrolls + ")"); });
    console.log("  points " + res.total + ", red " + res.bad.length + (res.bad.length ? ": " + res.bad.join(" | ") : ""));
    console.log("  end state " + (diff.length ? "DIFFERS: " + diff.join("; ") : "same as in the task"));
    if(JSON_OUT) fs.writeFileSync(JSON_OUT, JSON.stringify({ ui: UI, mode: MODE, size: [W, H], counts: c, result: res, diff: diff }, null, 1));
    process.exitCode = diff.length || res.bad.length ? 1 : 0;
  } finally { B.close(); srv.close(); }
})().catch(e => { console.error(e.stack || e); process.exitCode = 2; });
