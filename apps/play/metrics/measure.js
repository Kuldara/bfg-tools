/* The play page's input meter: how many taps and scrolls the play page needs
   to record a simulated game on a phone.

     node apps/play/metrics/measure.js [--page=<html>] [--name=<label>]
                                       [--size=375x812] [--modes=full,swap,compact]
                                       [--json=<result.json>] [--games=N]

   The default page is dist/registry/play/Gothic Fleet Play.html (npm run build).
   Tape: metrics/tape.json (make_tape.js), fleets:
   apps/play/rosters.json (the same 1200-point user lists as in the simulator).

   The measurement runs in a REAL Chrome (headless, phone size and
   touch), because the cost of scrolling depends on how tall the rows
   really are. Every event is done with the page's own buttons
   (el.click() -> the page's own handler), and before every tap it is
   measured whether the target is visible between the top bar and the bottom bar:

     tap       one touch on a page button
     scroll    one swipe; a swipe moves at most 80 % of the visible
               area, i.e. distance / (0.8 * visible height) rounded up
     jump      a tap on the jump strip (if the page has one and it is
               cheaper than scrolling) - counted as a tap

   Modes (depending on the page; an old page knows only full):
     full     every event on the rows of the full view
     swap     own turn in the full view, the opponent's turn in the compact one
              (switching views 1 tap per half turn), End Phase summary
     compact  always compact: weapons are looked up on the card (open + close)

   What the meter does NOT measure: time spent reading and searching, rolling
   dice, nor the fact that a person sometimes taps wrong. A comparison is
   fair only within the same tape and the same screen size. */
"use strict";
const fs = require("fs"), path = require("path"), http = require("http"), os = require("os");
const { spawn } = require("child_process");

const HERE = __dirname, PLAYDIR = path.join(HERE, "..");
const arg = (k, d) => { const a = process.argv.find(x => x.startsWith("--" + k + "=")); return a ? a.slice(k.length + 3) : d; };
const PAGE = path.resolve(arg("page", path.join(PLAYDIR, "..", "..", "dist", "registry", "play", "Gothic Fleet Play.html")));
const NAME = arg("name", path.basename(PAGE, ".html"));
const [W, H] = arg("size", "375x812").split("x").map(Number);
const WANT = arg("modes", "full,swap,compact").split(",");
const JSON_OUT = arg("json", "");
const CHROME = require("../../../tools/lib/chrome.js").findChrome();
const TAPE = JSON.parse(fs.readFileSync(path.join(HERE, "tape.json"), "utf8"));
const MAXG = parseInt(arg("games", "0"), 10) || TAPE.games.length;
const ROSTERS = JSON.parse(fs.readFileSync(path.join(PLAYDIR, "rosters.json"), "utf8"));

/* -------------------------------------------------------------- server -- */
function serve(file){
  const body = fs.readFileSync(file);
  const srv = http.createServer((req, res) => {
    if(req.url.split("?")[0] === "/play.html"){ res.writeHead(200, { "content-type": "text/html; charset=utf-8" }); res.end(body); }
    else { res.writeHead(404); res.end(); }
  });
  return new Promise(ok => srv.listen(0, "127.0.0.1", () => ok(srv)));
}

/* ---------------------------------------------------------- Chrome/CDP -- */
async function chrome(){
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "gfp-metrics-"));
  const proc = spawn(CHROME, ["--headless=new", "--no-sandbox", "--remote-debugging-port=0", "--user-data-dir=" + dir, "--no-first-run",
    "--no-default-browser-check", "--disable-extensions", "--window-size=" + W + "," + H, "about:blank"], { stdio: "ignore" });
  const portFile = path.join(dir, "DevToolsActivePort");
  let port = null;
  for(let k = 0; k < 100 && !port; k++){
    await new Promise(r => setTimeout(r, 100));
    if(fs.existsSync(portFile)){ const t = fs.readFileSync(portFile, "utf8").split("\n")[0].trim(); if(t) port = t; }
  }
  if(!port) throw new Error("Chrome did not start: " + CHROME);
  const list = await (await fetch("http://127.0.0.1:" + port + "/json/list")).json();
  const page = list.find(t => t.type === "page");
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((ok, no) => { ws.onopen = ok; ws.onerror = no; });
  let id = 0; const wait = new Map(), on = new Map();
  ws.onmessage = m => {
    const d = JSON.parse(m.data);
    if(d.id && wait.has(d.id)){ const w = wait.get(d.id); wait.delete(d.id); d.error ? w.no(new Error(JSON.stringify(d.error))) : w.ok(d.result); }
    else if(d.method && on.has(d.method)){ const f = on.get(d.method); on.delete(d.method); f(d.params); }
  };
  const send = (method, params) => new Promise((ok, no) => { const k = ++id; wait.set(k, { ok, no }); ws.send(JSON.stringify({ id: k, method, params: params || {} })); });
  const once = method => new Promise(ok => on.set(method, ok));
  const evaluate = async expr => {
    const r = await send("Runtime.evaluate", { expression: expr, awaitPromise: true, returnByValue: true });
    if(r.exceptionDetails) throw new Error("on the page: " + (r.exceptionDetails.exception && r.exceptionDetails.exception.description || r.exceptionDetails.text));
    return r.result.value;
  };
  const close = () => { try{ ws.close(); }catch(e){} try{ proc.kill(); }catch(e){} setTimeout(() => { try{ fs.rmSync(dir, { recursive: true, force: true }); }catch(e){} }, 800); };
  return { send, once, evaluate, close };
}

/* ------------------------------------------- the part run on the page -- */
/* This function runs in the page's own scope (G, U, V, PLAY, act ...). */
function inPage(){
  const Q = s => document.querySelector(s);
  const band = () => {
    /* the strip of ships, when there is one, is part of the bottom bar */
    const top = Q(".top"), bot = Q(".bottom");
    return { top: top ? top.getBoundingClientRect().bottom : 0, bottom: bot ? bot.getBoundingClientRect().top : innerHeight };
  };
  const fresh = () => ({ taps: 0, scrolls: 0, px: 0, jumps: 0, kinds: {}, misses: 0, notes: [] });
  let C = fresh();
  let kind = "";
  const count = (what, n) => { C.kinds[kind] = C.kinds[kind] || { taps: 0, scrolls: 0 }; C.kinds[kind][what] += n; C[what] += n; };
  const hasJump = () => !!Q(".jump [data-act=jump]");
  /* the unit a control belongs to: its row (section) */
  const rowOf = el => el && el.closest("section.row");
  function scrollTo(el){
    const b = band(), r = el.getBoundingClientRect(), vis = b.bottom - b.top;
    let d = 0;
    if(r.top < b.top + 4) d = r.top - b.top - 8;
    else if(r.bottom > b.bottom - 4) d = Math.min(r.bottom - b.bottom + 8, r.top - b.top - 8);
    if(!d) return 0;
    window.scrollBy(0, d);
    return Math.abs(d) / (0.8 * vis);
  }
  /* reach: bring el into view the cheaper way - swipes, or a jump chip and
     then whatever swiping is left inside the row */
  function reach(el, unit){
    if(!el) return false;
    /* the bars, the menu and the card's header stay on the screen */
    if(el.closest(".top, .bottom, .jump, .menu, .sh-hd, .endp")) return true;
    const b = band(), r = el.getBoundingClientRect();
    if(r.top >= b.top + 4 && r.bottom <= b.bottom - 4) return true;
    const y0 = window.scrollY;
    const swipes = Math.ceil(scrollTo(el) - 1e-6);
    const px = Math.abs(window.scrollY - y0);
    let best = { swipes: swipes, jump: false, y: window.scrollY, px: px };
    const chip = unit != null && hasJump() ? Q('.jump [data-act="jump"][data-i="' + unit + '"]') : null;
    if(chip){
      window.scrollTo(0, y0);
      chip.click();
      const y1 = window.scrollY;
      const rest = Math.ceil(scrollTo(el) - 1e-6);
      if(1 + rest < best.swipes) best = { swipes: rest, jump: true, y: window.scrollY, px: Math.abs(window.scrollY - y1) };
    }
    window.scrollTo(0, best.y);
    if(best.jump){ count("taps", 1); C.jumps++; }
    count("scrolls", best.swipes); C.px += best.px;
    return true;
  }
  function tap(sel, unit){
    const el = Q(sel);
    if(!el || el.disabled){ C.misses++; if(C.notes.length < 12) C.notes.push(kind + ": " + sel); return false; }
    reach(el, unit);
    count("taps", 1);
    /* a person's next tap comes later than the page's screen-change guard */
    if("guardUntil" in V) V.guardUntil = 0;
    el.click();
    return true;
  }
  /* reading a ship's weapons: its table must be in view */
  function look(i, mode){
    /* a compact row with its weapons line: that line is the look */
    const sec0 = [...document.querySelectorAll("section.row")].find(s => s.querySelector('[data-i="' + i + '"]'));
    const wl = sec0 && sec0.querySelector(".wline");
    if(mode === "compact" && wl){ reach(wl, i); return; }
    if(mode === "compact"){
      tap('[data-act="sheet"][data-i="' + i + '"]', i);
      tap('[data-act="closesheet"]', null);
      return;
    }
    const sec = [...document.querySelectorAll("section.row")].find(s => s.querySelector('[data-i="' + i + '"]'));
    const t = sec && (sec.querySelector("table.wt") || sec.querySelector(".stl"));
    if(t) reach(t, i); else { C.misses++; }
  }
  function critKey(R, roll){
    const cm = R.damage && R.damage.critical; if(!cm) return null;
    const keys = cm.rows.map(r => String(r[0])).concat((cm.wide || []).map(w => String(w).split(" ")[0]));
    const fit = keys.find(k => { const m = /^(\d+)(?:-(\d+))?$/.exec(k); return m && roll >= +m[1] && roll <= +(m[2] || m[1]); });
    return fit || keys[0];
  }
  function mapShips(game){
    const units = U.map((x, i) => ({ i, nm: String(x.R.className || x.R.name || "").toLowerCase(), own: String(x.R.name || "").toLowerCase(), esc: x.R.kind === "ship" && PLAY.isEscort(x.R), cap: x.R.hulls | 0, used: 0, ship: x.R.kind === "ship" }));
    const find = (pred) => units.find(u => u.ship && pred(u) && u.used < (u.esc ? u.cap : 1));
    return game.ships.map(s => {
      const full = s.name.toLowerCase(), w = full.split(/\s+/)[0];
      const u = find(u => u.own && full.indexOf(u.own) === 0) || find(u => u.nm === full) || find(u => u.nm.indexOf(full) === 0) || find(u => u.nm.split(/\s+/)[0] === w) || find(u => u.nm.indexOf(w) >= 0);
      if(!u) return null;
      return { i: u.i, m: u.used++, esc: u.esc };
    });
  }
  return async function run(game, doc, mode){
    C = fresh();
    try{ localStorage.removeItem("gothic-fleet-play-v1"); }catch(e){}
    const res = resolveFleet(doc); res.src = "roster"; newGame(res);
    U.forEach((x, i) => { if(x.R.kind === "ship" && G.st[i].ld == null) setLd(i, 8); });
    V.screen = "roster"; V.pop = null; V.sheet = null; if("endph" in V) V.endph = false; save(); render(); window.scrollTo(0, 0);
    const canView = !!Q('[data-act="view"]');
    const setView = want => { if(!canView) return; const now = !!V.compact; if(now !== want){ kind = "view"; tap('[data-act="view"]', null); } };
    setView(mode === "compact" || mode === "swap" ? true : false);
    const map = mapShips(game);
    C.unmapped = map.filter(x => !x).length;
    C.unmappedNames = game.ships.filter((s, k) => !map[k]).map(s => s.name);
    let openCrit = null, endp = false, firstOwn = true, side = null, endpUsed = false;
    const useEndp = !!Q('.bottom [data-act="endph"]');
    const closeCrit = () => { if(openCrit != null){ const k0 = kind; kind = "crit"; tap('[data-act="pop"][data-i="' + openCrit + '"][data-arg="crit"]', openCrit); kind = k0; openCrit = null; } };
    const closeEndp = () => { if(endp){ const k0 = kind; kind = "endphase"; tap('.endp button[data-act="endph"]', null); kind = k0; endp = false; } };
    for(const e of game.ev){
      const m = e.s != null ? map[e.s] : null;
      if(e.k !== "crit" && e.k !== "xtra") closeCrit();
      if(e.k !== "fire" && e.k !== "repair") closeEndp();
      if(e.k === "turn"){
        side = e.f;
        if(e.f === "A"){
          if(!firstOwn){ kind = "turn"; tap(".bottom [data-act=newturn], .bottom [data-act=endturn]", null); }
          firstOwn = false;
          if(mode === "swap") setView(false);
        }else if(mode === "swap") setView(true);
        continue;
      }
      if(!m) continue;
      const i = m.i, R = U[i].R, st = G.st[i];
      const v = PLAY.view(R, st, G.fleet);
      if(e.k === "act"){
        if(v.destroyed) continue;
        kind = "look"; look(i, mode === "compact" || (mode === "swap" && V.compact) ? "compact" : "full");
        kind = "played";
        if((!v.escort || m.m === 0) && Q('[data-act="played"][data-i="' + i + '"]')){ tap('[data-act="played"][data-i="' + i + '"]', i); tap('[data-act="played"][data-i="' + i + '"]', i); }
        continue;
      }
      if(e.k === "hit"){
        if(m.esc || v.destroyed) continue;
        const to = Math.min(v.max, (v.hits | 0) + e.n);
        if(to <= (v.hits | 0)) continue;
        kind = "hit"; tap('[data-act="dmg"][data-i="' + i + '"][data-arg="' + to + '"]', i);
        continue;
      }
      if(e.k === "kill"){
        const k = st.members ? st.members.findIndex(x => !x.dead) : -1;
        if(k < 0) continue;
        kind = "kill"; tap('[data-act="kill"][data-i="' + i + '"][data-arg="' + k + '"]', i);
        continue;
      }
      if(e.k === "crit"){
        if(m.esc || v.destroyed) continue;
        kind = "crit";
        if(openCrit !== i){ closeCrit(); kind = "crit"; tap('[data-act="pop"][data-i="' + i + '"][data-arg="crit"]', i); openCrit = i; }
        const key = critKey(R, e.roll);
        if(!key) continue;
        if(Q('.pop [data-act="crit"][data-i="' + i + '"][data-arg="' + key + '"]')) tap('.pop [data-act="crit"][data-i="' + i + '"][data-arg="' + key + '"]', i);
        else if(Q('.pop [data-act="critpick"][data-i="' + i + '"][data-arg="' + key + '"]')){
          tap('.pop [data-act="critpick"][data-i="' + i + '"][data-arg="' + key + '"]', i);
          tap('.pop [data-act="critx"][data-i="' + i + '"][data-arg="' + key + ":" + Math.max(1, e.extra || 1) + '"]', i);
        }else { C.misses++; }
        /* the ship went to 0 with this critical: the Catastrophic table opened by itself */
        if(V.pop && V.pop.kind === "hulk") openCrit = null;
        continue;
      }
      if(e.k === "fire"){
        if(v.destroyed) continue;
        kind = "fire";
        if(useEndp){ if(!endp){ kind = "endphase"; tap('.bottom [data-act="endph"]', null); endp = true; endpUsed = true; kind = "fire"; } tap('.endp [data-act="fire"][data-i="' + i + '"]', i); }
        else tap('[data-act="fire"][data-i="' + i + '"]', i);
        continue;
      }
      if(e.k === "repair"){
        if(v.destroyed || m.esc) continue;
        const key = critKey(R, e.roll || 7);
        kind = "repair";
        if(useEndp){
          if(!endp){ kind = "endphase"; tap('.bottom [data-act="endph"]', null); endp = true; endpUsed = true; kind = "repair"; }
          tap('.endp [data-act="repair"][data-i="' + i + '"][data-arg="' + key + '"]', i);
        }else{
          tap('[data-act="pop"][data-i="' + i + '"][data-arg="crit"]', i);
          tap('.pop [data-act="critminus"][data-i="' + i + '"][data-arg="' + key + '"]', i);
          tap('[data-act="pop"][data-i="' + i + '"][data-arg="crit"]', i);
        }
        continue;
      }
      if(e.k === "cata"){
        if(m.esc) continue;
        kind = "cata";
        if(!(V.pop && V.pop.kind === "hulk" && V.pop.i === i)){
          /* the hits that put it at 0 came from somewhere the page did not see
             (a hulk explosion etc.): take it to 0 on its track first */
          const vv = PLAY.view(R, G.st[i], G.fleet);
          if(!vv.destroyed){ kind = "hit"; tap('[data-act="dmg"][data-i="' + i + '"][data-arg="' + vv.max + '"]', i); kind = "cata"; }
          if(!(V.pop && V.pop.kind === "hulk")) tap('[data-act="pop"][data-i="' + i + '"][data-arg="hulk"]', i);
        }
        const rows = PLAY.catastrophic(R).rows;
        let k = rows.findIndex(r => r.kind === e.kind);
        if(k < 0) k = 0;
        tap('.pop [data-act="hulk"][data-i="' + i + '"][data-arg="' + k + '"]', i);
        continue;
      }
    }
    closeCrit(); closeEndp();
    C.endpUsed = endpUsed;
    return C;
  };
}

/* ---------------------------------------------------------------- run -- */
(async () => {
  if(!fs.existsSync(PAGE)) throw new Error("no page: " + PAGE);
  const srv = await serve(PAGE);
  const cd = await chrome();
  try{
    await cd.send("Page.enable");
    await cd.send("Emulation.setDeviceMetricsOverride", { width: W, height: H, deviceScaleFactor: 2, mobile: true });
    await cd.send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 5 });
    const loaded = cd.once("Page.loadEventFired");
    await cd.send("Page.navigate", { url: "http://127.0.0.1:" + srv.address().port + "/play.html?m=1" });
    await loaded;
    /* The page is one bundle (global GFP), and the part run on the page names its
       functions and state directly (G, U, V, act, resolveFleet ...), as the
       smoke test does: the bundle's exports become window getters, and the
       shared state assignable. A page from before the bundle has no GFP. */
    await cd.evaluate("(function(){ if(typeof GFP === 'undefined') return;" +
      " for(const k of Object.keys(GFP)) if(k !== 'appState' && !(k in window))" +
      "  Object.defineProperty(window, k, { get: () => GFP[k], configurable: true });" +
      " for(const k of Object.keys(GFP.appState || {}))" +
      "  Object.defineProperty(window, k, { get: () => GFP.appState[k], set: v => { GFP.appState[k] = v; }, configurable: true });" +
      "})(); true");
    await cd.evaluate("window.confirm = () => true; window.__run = (" + inPage.toString() + ")(); true");
    const modes = WANT.filter(m => m === "full" || m === "swap" || m === "compact");
    const hasView = await cd.evaluate("!!(typeof V !== 'undefined' && 'compact' in V)");
    const out = { page: path.basename(PAGE), name: NAME, size: W + "x" + H, modes: {} };
    for(const mode of modes){
      if(mode !== "full" && !hasView){ continue; }
      const per = [];
      for(const g of TAPE.games.slice(0, MAXG)){
        const r = ROSTERS.find(x => x.name === g.roster);
        if(!r) throw new Error("missing from rosters.json: " + g.roster);
        const c = await cd.evaluate("window.__run(" + JSON.stringify(g) + "," + JSON.stringify(r.doc) + "," + JSON.stringify(mode) + ")");
        c.roster = g.roster; c.rounds = Math.ceil(g.turns); c.events = g.ev.filter(e => e.k !== "turn" && e.k !== "act" && e.k !== "xtra").length;
        per.push(c);
      }
      out.modes[mode] = per;
    }
    /* summary */
    const lines = [];
    lines.push("Page: " + out.page + " (" + NAME + "), screen " + out.size + ", " + Math.min(MAXG, TAPE.games.length) + " games");
    for(const mode of Object.keys(out.modes)){
      const per = out.modes[mode];
      const sum = k => per.reduce((a, c) => a + (c[k] || 0), 0);
      const rounds = sum("rounds"), ev = sum("events");
      const kinds = {};
      per.forEach(c => Object.keys(c.kinds).forEach(k => { kinds[k] = kinds[k] || { taps: 0, scrolls: 0 }; kinds[k].taps += c.kinds[k].taps; kinds[k].scrolls += c.kinds[k].scrolls; }));
      const tot = sum("taps") + sum("scrolls");
      const noPlayed = tot - ((kinds.played || {}).taps || 0) - ((kinds.played || {}).scrolls || 0);
      lines.push("");
      lines.push("  " + mode + ":  inputs " + tot + " (taps " + sum("taps") + ", swipes " + sum("scrolls") + ", jumps " + sum("jumps") + ")"
        + "  = " + (tot / rounds).toFixed(1) + " / round, without played marks " + (noPlayed / rounds).toFixed(1) + " / round"
        + (sum("misses") ? "  [missed " + sum("misses") + "]" : ""));
      lines.push("    " + Object.keys(kinds).sort().map(k => k + " " + kinds[k].taps + "+" + kinds[k].scrolls).join(" | ") + "   (tap+swipe)");
      lines.push("    damage events " + ev + ", scrolled " + Math.round(sum("px") / 1000) + " k px");
      const notes = per.flatMap(c => c.notes || []).slice(0, 6);
      if(notes.length) lines.push("    missed: " + notes.join(" ; "));
      const um = sum("unmapped");
      if(um) lines.push("    unmatched " + um + " simulator ships: " + [...new Set(per.flatMap(c => c.unmappedNames || []))].join(", "));
    }
    console.log(lines.join("\n"));
    if(JSON_OUT) fs.writeFileSync(JSON_OUT, JSON.stringify(out, null, 1));
  } finally {
    cd.close(); srv.close();
  }
})().catch(e => { console.error(e && e.stack || e); process.exit(1); });
