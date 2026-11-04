/* Gothic Fleet Play - smoke test: the BUILT page in a Node vm.

   test_play.js tests only the rules layer (rules.js). The page's own
   code - the set-up screen, rows, the card, pop-ups, actions, VP sums -
   lives in src/, and nothing else runs it. This does: it loads
   the built page dist/registry/play/Gothic Fleet Play.html (npm run build)
   into a stub DOM, starts a game with a fleet that has one unit of every
   kind (capital ship, escort squadron, every PLANETARY DEFENCES row,
   commander), draws the set-up screen, the roster, every card, the pop-ups
   and the menu, and fails on an exception or on "undefined"/"NaN" text in
   the HTML. On top of that a few claims read from the book (the page is
   in the claim) or from this project's user interface principles.

   The snippets name the page's functions and state bare, as globals of the
   vm (boot). Before any of them runs, the page's own code is checked to take
   none of those names from the global scope, so a forgotten import fails
   here as it does in a browser (run()).

   npm test builds before it tests, so the page is always made from the
   current sources. SMOKE_PAGE=<file> runs the same checks on another
   build (for example a comparison page made from an older version).

     node apps/play/smoke_play.js       (its own summary)
     apps/play/test_play.js runs this at the end with the same counters. */
"use strict";
const fs = require("fs"), path = require("path"), vm = require("vm");
const freeNames = require("../../tools/lib/free-names.js");
const HERE = __dirname;
/* The built page (npm run build). npm test builds before it tests, so the page
   is always made from the current sources. */
const BUILT = path.join(HERE, "..", "..", "dist", "registry", "play", "Gothic Fleet Play.html");

/* To text: tags and icons removed, so a claim reads what the player reads. */
const strip = h => String(h).replace(/<svg[\s\S]*?<\/svg>/g, " ").replace(/<[^>]+>/g, " ").replace(/&[a-z#0-9]+;/gi, " ").replace(/\s+/g, " ").trim();

/* The page's data block and its app script: the one right after the data
   block (the site's copy has a second, small one that registers the service
   worker). */
function pageParts(html){
  const d0 = html.indexOf('<script id="bfgdata" type="application/json">') + '<script id="bfgdata" type="application/json">'.length;
  const i0 = html.indexOf("<script>", d0) + "<script>".length, i1 = html.indexOf("</script>", i0);
  return { dataText: html.slice(d0, html.indexOf("</script>", d0)), code: html.slice(i0, i1) };
}

/* The built page in one vm context. Returns P(src): runs code in the
   page's own scope and returns the value. */
function boot(html, seed){
  const { dataText, code } = pageParts(html);
  const store = Object.assign({}, seed || {}), toasts = [];
  const elem = () => ({ innerHTML: "", textContent: "", className: "", value: "", style: {}, disabled: false,
    classList: { add(){}, remove(){}, toggle(){}, contains(){ return false; } }, children: [],
    getBoundingClientRect(){ return { top: 0, height: 0, left: 0, width: 0 }; }, appendChild(){}, remove(){}, querySelector(){ return null; },
    scrollIntoView(){}, hasAttribute(){ return false; }, getAttribute(){ return null; }, closest(){ return null; }, previousElementSibling: null });
  const APP = elem(), TOAST = elem();
  TOAST.appendChild = t => { toasts.push(String(t.textContent)); };
  /* keep the page's own listeners: __fire("input", ev) runs them as a browser would */
  const listeners = {};
  const document = {
    getElementById(id){ return id === "bfgdata" ? { textContent: dataText } : elem(); },
    querySelector(s){ return s === "#app" ? APP : s === "#toast" ? TOAST : null; }, querySelectorAll(){ return []; },
    addEventListener(t, f){ (listeners[t] = listeners[t] || []).push(f); }, createElement(){ return elem(); }, scrollingElement: { scrollTop: 0 }, documentElement: { scrollHeight: 0 }
  };
  const ctx = { document, console, setTimeout(){ return 0; }, clearTimeout(){},
    localStorage: { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; } },
    navigator: {}, confirm: () => true, TextEncoder, TextDecoder, btoa, atob };
  ctx.window = { addEventListener(){}, matchMedia(){ return { matches: false }; }, scrollTo(){}, scrollBy(){}, innerHeight: 800, scrollY: 0 };
  ctx.globalThis = ctx;
  vm.createContext(ctx);
  vm.runInContext(code, ctx, { filename: "Gothic Fleet Play.html" });
  /* The page is one bundle (global GFP). The snippets below name its
     functions and state as they did when the page was one plain script, so
     every export is a live global here, and the shared state (G, U, ...) can
     also be assigned. The page's own code would find them here too; run()
     checks first that it never looks for one (defined: every name put here). */
  const defined = [];
  for(const k of Object.keys(ctx.GFP)) if(k !== "appState"){
    Object.defineProperty(ctx, k, { get: () => ctx.GFP[k], configurable: true }); defined.push(k);
  }
  for(const k of Object.keys(ctx.GFP.appState)){
    Object.defineProperty(ctx, k, { get: () => ctx.GFP.appState[k], set: v => { ctx.GFP.appState[k] = v; }, configurable: true }); defined.push(k);
  }
  ctx.__toasts = toasts; ctx.__strip = strip;
  ctx.__fire = (t, ev) => (listeners[t] || []).forEach(f => f(ev));
  defined.push("__toasts", "__strip", "__fire");
  const P = src => vm.runInContext(src, ctx, { filename: "smoke.js" });
  return { P, ctx, toasts, store, APP, DATA: JSON.parse(dataText), defined };
}

/* A saved unit in the builder's format (schema 4): section and row by name. */
function saved(L, secRe, labelRe, n, name){
  for(let si = 0; si < L.secs.length; si++){
    if(!secRe.test(L.secs[si].t)) continue;
    const ei = L.secs[si].ents.findIndex(e => labelRe.test(e.l));
    if(ei >= 0){ const e = L.secs[si].ents[ei]; return { s: si, e: ei, sn: L.secs[si].t, el: e.l, ref: e.r, n: n || 1, name: name || "" }; }
  }
  throw new Error("smoke test: list " + L.nm + " has no row " + secRe + " / " + labelRe);
}
/* The list's whole PLANETARY DEFENCES section, every row once: a new row
   enters the smoke test by itself. Three items for those bought
   several at a time (squadrons, mines, minefields). */
function defenceRows(pg, L){
  const sec = L.secs.find(s => s.t === "PLANETARY DEFENCES");
  if(!sec) return [];
  const one = sec.ents.filter(e => e.k === "unit").map(e => saved(L, /^PLANETARY DEFENCES$/, new RegExp("^" + e.l.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "$")));
  pg.ctx.__probe = { ln: L.nm, limit: 9000, units: one };
  const many = JSON.parse(pg.P(`JSON.stringify(resolveFleet(__probe).units.map(x => !!(x.R.squadron || x.R.countable)))`));
  one.forEach((u, k) => { if(many[k]) u.n = 3; });
  return one;
}

function run(check){
  /* SMOKE_PAGE: another build (e.g. a comparison page made from an older version)
     - then the page is not required to be fresh */
  const PAGE = process.env.SMOKE_PAGE || BUILT;
  if(!fs.existsSync(PAGE)){ check("smoke: the built page exists (npm run build)", false, PAGE); return; }
  const html = fs.readFileSync(PAGE, "utf8");

  /* The harness hides nothing. boot() puts the page's exports and state on
     the vm's global for the snippets; a module that uses another module's
     export without importing it would find it there, and pass here while it
     throws in a browser (actions.js called isEscGrp so, November 2026: a
     capital ship in a squadron that failed to disengage). The page's free
     names - each name its code takes from the global scope, by esbuild's own
     scope analysis (tools/lib/free-names.js) - must include none of them;
     then every check below sees the page as a browser does. The build stops
     on any free name a browser lacks; this needs no list of the browser's. */
  {
    const named = new Set(boot(html).defined);
    const leak = freeNames.ofScript(pageParts(html).code).filter(f => named.has(f.name));
    check("smoke: the page's own code takes none of the " + named.size + " names the harness defines from the global scope",
          leak.length === 0, leak.map(f => f.name + " (" + f.module + ": " + f.text.slice(0, 90) + ")").join("; "));
  }

  /* every piece of HTML the page makes goes through here */
  const bad = h => { const t = strip(h); const m = t.match(/.{0,60}\b(undefined|NaN)\b.{0,40}/) || String(h).match(/.{0,60}(="undefined"|="NaN"|\[object Object\]).{0,40}/); return m ? m[0] : ""; };
  const clean = (what, h) => check("smoke: " + what + " renders clean", typeof h === "string" && h.length > 0 && !bad(h), typeof h !== "string" ? String(h) : h.length ? bad(h) : "empty");
  const where = e => String(e && e.stack || e).split("\n").slice(0, 3).join(" | ");
  const guard = (what, fn) => { try{ return fn(); }catch(e){ check("smoke: " + what + " does not throw", false, where(e)); return null; } };
  /* a page with its P(): an exception inside the page's own code is a
     failed check of its own and the run goes on (the value is then "") */
  const open = seed => {
    const pg = boot(html, seed), raw = pg.P;
    pg.P = src => { try{ return raw(src); }catch(e){ check("smoke: the page does not throw at: " + String(src).replace(/\s+/g, " ").slice(0, 70), false, where(e)); return ""; } };
    /* js run as a browser runs the page: there the exports are no globals,
       so a module that uses another's export without importing it throws
       (the harness's globals hid one in actions.js). js names the bundle
       through GFP. */
    pg.bare = js => pg.P(`(() => { const ks = Object.keys(GFP).concat(Object.keys(GFP.appState)), keep = {};
      ks.forEach(k => { keep[k] = Object.getOwnPropertyDescriptor(globalThis, k); delete globalThis[k]; });
      try{ return (${js}); }finally{ ks.forEach(k => { if(keep[k]) Object.defineProperty(globalThis, k, keep[k]); }); } })()`);
    return pg;
  };

  /* ------------------------------------------- Imperial Navy: one of each --- */
  guard("the Imperial Navy fleet", () => {
    const pg = open(), P = pg.P;
    check("smoke: the built page boots to the load screen", P(`V.screen`) === "load" && /Gothic Fleet Play|othic Fleet Play/.test(strip(pg.APP.innerHTML)), strip(pg.APP.innerHTML).slice(0, 80));
    const L = pg.DATA.lists.find(x => /^Imperial Navy . Gothic Sector$/.test(x.nm));
    const units = [saved(L, /^Admiral$/, /^Fleet-Admiral \(Ld 8\)$/), saved(L, /^Cruisers$/, /^Lunar class cruiser$/),
                   saved(L, /^ESCORTS$/, /^Sword class frigate$/, 3)].concat(defenceRows(pg, L));
    pg.ctx.__doc = { ln: L.nm, limit: 9000, units: units };
    const res = JSON.parse(P(`(() => { const r = resolveFleet(__doc); return JSON.stringify({ error: r.error || null, n: r.units.length, lost: r.lost }); })()`));
    check("smoke: every row of the fleet resolves (" + units.length + " units)", !res.error && res.n === units.length && res.lost.length === 0, JSON.stringify(res));
    P(`newGame(resolveFleet(__doc)); V.screen = "setup"; save(); render();
       var IX = re => U.findIndex(x => new RegExp(re, "i").test(x.R.className || ""));
       var KIND = i => U[i].R.kind;`);
    const ix = re => P(`IX(${JSON.stringify(re)})`);
    const I = { adm: ix("^Fleet-Admiral"), lunar: ix("^LUNAR"), sword: ix("^SWORD"), plat: ix("^ORBITAL WEAPONS PLATFORM"), station: ix("^SPACE STATION"),
                fort: ix("^RAMILIES"), mines: ix("^Orbital mine$"), field: ix("^Minefield$"), fire: ix("^FIRE SHIP"), monitor: ix("^DEFENCE MONITOR"),
                black: ix("^BLACKSTONE FORTRESS"), air: ix("^AIR BASE") };
    check("smoke: the fleet has a unit of every kind", Object.keys(I).every(k => I[k] >= 0), JSON.stringify(I));

    /* --- set-up: who rolls, who does not, who may carry the commander --- */
    const setup = P(`renderSetup()`);
    clean("the set-up screen", setup);
    /* T44 (user 31.10.2026): Roll Ld fills every rolling ship on its table
       and leaves the value to change; the guide is on the screen */
    check("smoke: the set-up screen has the fleet's Leadership guide and a Roll Ld button (T44)", /class="ldguide"/.test(setup) && /data-act="rollld"/.test(setup));
    const rolled = JSON.parse(P(`(() => { const keep = JSON.stringify(G.st); act("rollld"); const out = U.map((x, i) => ({ k: x.R.kind, ld: G.st[i].ld, die: G.st[i].ldDie, fx: !!PLAY.fixedLd(x.R) || G.st[i].ldFrom === "commander" })); const html = renderSetup(); const sw = IX("^SWORD"); act("ld", sw, 10); const after = { ld: G.st[sw].ld, die: G.st[sw].ldDie }; G.st = JSON.parse(keep); return JSON.stringify({ out, html, after }); })()`));
    clean("the set-up screen after Roll Ld", rolled.html);
    check("smoke: no re-roll once every ship has its Ld (user 31.10.2026, T44)", !/data-act="rollld"/.test(rolled.html), (rolled.html.match(/.{0,40}rollld.{0,40}/) || [""])[0]);
    check("smoke: Roll Ld gives every rolling ship a value 6-9 with its die (Rulebook p. 45); a fixed commander's flagship keeps his value", rolled.out.filter(u => u.k === "ship" && !u.fx).every(u => u.ld >= 6 && u.ld <= 9 && u.die >= 1 && u.die <= 6), JSON.stringify(rolled.out));
    check("smoke: a tapped value after the roll is the player's and forgets the die", rolled.after.ld === 10 && rolled.after.die == null, JSON.stringify(rolled.after));
    /* J214: the fleet's attack rating before the game, from the book's own
       sentence: "The Imperial Navy have a starting attack or initiative
       rating of 2." (Fleets p. 32) */
    check("smoke: the set-up screen gives the fleet's attack rating with its page",
          /Fleet facts/.test(strip(setup)) && /Attack rating The Imperial Navy have a starting attack or initiative rating of 2\. \(Fleets p\. 32\) 2 /.test(strip(setup)), strip(setup).slice(0, 300));
    const tiles = i => (setup.match(new RegExp('data-act="ld" data-i="' + i + '"', "g")) || []).length;
    /* Rulebook p. 100: planetary defences "do not roll for leadership";
       Fleets p. 503: a Ramilies' "Leadership is rolled as for a capital
       ship". The cruiser is the flagship here: the Fleet-Admiral's fixed
       Ld 8 stands in for its roll (Fleets p. 35, RULINGS.md T8). Six tiles:
       Ld 5 (Orks, Fleets p. 360) to Ld 10 (Space Marines, Fleets p. 94) -
       a fleet may hold ships of another table (Grey Knights, p. 148, 154). */
    check("smoke: set-up offers Ld tiles to the escort squadron and the Ramilies (Fleets p. 503), not to the Admiral's flagship", tiles(I.lunar) === 0 && tiles(I.sword) === 6 && tiles(I.fort) === 6, [tiles(I.lunar), tiles(I.sword), tiles(I.fort)].join("/"));
    const tileVals = i => (setup.match(new RegExp('data-act="ld" data-i="' + i + '" data-arg="(\\d+)"', "g")) || []).map(s => s.replace(/^.*data-arg="(\d+)"$/, "$1")).join(",");
    check("smoke: ... the tiles are Ld 5 to Ld 10 (Rulebook p. 45; Fleets p. 94, 302, 358)", tileVals(I.sword) === "5,6,7,8,9,10", tileVals(I.sword));
    check("smoke: ... and none to a station, platforms, monitors, fire ships, air bases or a Blackstone: Ld 7, no roll (Rulebook p. 100)",
          [I.station, I.plat, I.monitor, I.fire, I.air, I.black].every(i => tiles(i) === 0) && P(`[${[I.station, I.plat, I.monitor, I.fire, I.air, I.black].join(",")}].every(i => G.st[i].ld === 7)`),
          [I.station, I.plat, I.monitor, I.fire, I.air, I.black].map(tiles).join("/"));
    check("smoke: ... the fixed Leadership is shown with its page", /Ld 7/.test(strip(setup)) && /Fleets p\. 499/.test(strip(setup)), strip(setup).slice(0, 200));
    check("smoke: 'Start the game' waits for those two rolls and for nothing else", /data-act="start" disabled/.test(setup) &&
          /data-act="start" disabled/.test(P(`setLd(${I.sword}, 7); renderSetup()`)) &&
          (P(`setLd(${I.fort}, 6); renderSetup()`).match(/data-act="start"\s*>/) || []).length === 1);
    P(`setLd(${I.lunar}, 9)`);
    /* Fleets p. 503: a commander may be placed aboard a Ramilies; nothing
       puts one on a platform or a station (Rulebook p. 100) */
    const opts = (P(`renderSetup()`).match(/<option value="(\d+)"/g) || []).map(s => parseInt(s.replace(/\D/g, ""), 10));
    check("smoke: the commander may go aboard the cruiser or the Ramilies, nothing else", opts.slice().sort((a, b) => a - b).join(",") === [I.lunar, I.fort].sort((a, b) => a - b).join(","), JSON.stringify(opts));
    check("smoke: the default flagship is the cruiser, with the Admiral's Ld 8 (RULINGS.md T8)", P(`G.flag`) === I.lunar && P(`G.st[${I.lunar}].ld`) === 8, P(`JSON.stringify([G.flag, G.st[${I.lunar}].ld])`));
    /* names on the start screen (user 19.10.2026): written over the old one,
       only for this game; an empty or the old name = the old name */
    const nmField = i => { const m = new RegExp('data-nm="' + i + '" value="([^"]*)"').exec(P(`renderSetup()`)); return m ? m[1] : null; };
    check("smoke: the set-up has a name field for each ship with its name in it, none for the commander", nmField(I.lunar) === P(`esc(baseName(${I.lunar}))`) && nmField(I.sword) !== null && nmField(I.adm) === null, JSON.stringify([nmField(I.lunar), nmField(I.adm)]));
    const typeName = (i, v) => P(`__fire("input", { target: { value: ${JSON.stringify(v)}, getAttribute: k => k === "data-nm" ? "${i}" : null } })`);
    typeName(I.lunar, "  Dauntless   Wrath ");
    check("smoke: ... a typed name is the ship's for this game, kept in the game record and on the flagship choice", P(`unitName(${I.lunar})`) === "Dauntless Wrath" && P(`loadPlay().nm[${I.lunar}]`) === "Dauntless Wrath" && /aboard Dauntless Wrath/.test(P(`renderSetup()`)) && nmField(I.lunar) === "Dauntless Wrath", P(`unitName(${I.lunar})`));
    typeName(I.lunar, "");
    check("smoke: ... an empty field gives the old name back", P(`unitName(${I.lunar})`) === P(`baseName(${I.lunar})`) && !(String(I.lunar) in JSON.parse(P(`JSON.stringify(loadPlay().nm || {})`))), P(`unitName(${I.lunar})`));
    P(`act("flag", null, ${I.fort})`);
    check("smoke: aboard the Ramilies the fort uses his Leadership (Fleets p. 503); the cruiser has its own roll back", P(`G.st[${I.fort}].ld`) === 8 && P(`G.st[${I.lunar}].ld`) === 9 && P(`G.st[${I.lunar}].ldFrom`) == null, P(`JSON.stringify([G.st[${I.fort}].ld, G.st[${I.lunar}].ld, G.st[${I.lunar}].ldFrom])`));
    P(`act("flag", null, ${I.lunar})`);
    check("smoke: ... and ashore again the fort has its own roll back", P(`G.st[${I.fort}].ld`) === 6 && P(`G.st[${I.lunar}].ld`) === 8, P(`JSON.stringify([G.st[${I.fort}].ld, G.st[${I.lunar}].ld])`));
    P(`act("start", null)`);

    /* --- the roster: every row, every sheet, the menu --- */
    const n = P(`U.length`);
    clean("the roster", P(`renderRoster()`));
    for(let i = 0; i < n; i++){
      const nm = P(`unitName(${i})`);
      clean("the row of " + nm, P(`G.cmd === ${i} && G.flag != null ? "aboard" : renderRow(${i}, false)`));
      if(P(`KIND(${i})`) === "commander") continue;
      clean("the card of " + nm, P(`V.sheet = ${i}; var __h = renderSheet(${i}); V.sheet = null; __h`));
      clean("the card of " + nm + " with rules shown", P(`V.sheet = ${i}; V.info = true; __h = renderSheet(${i}); V.info = false; V.sheet = null; __h`));
    }
    clean("the menu", P(`renderMenu()`));
    /* back to the set-up during a game (user 31.10.2026: "joku keino päästä
       takaisin siihen setup ruutuun missä leadership ja room liittyminen") */
    check("smoke: the menu has a way back to the set-up (Leadership, squadrons, the opponent's room)", /data-act="setupback"/.test(P(`renderMenu()`)));
    P(`act("hit", ${I.lunar}); V.menu = true; act("setupback", null)`);
    const back = P(`renderSetup()`);
    check("smoke: ... it opens the set-up with the game kept: its hits, Back to the game, no Exit that forgets it",
      P(`V.screen`) === "setup" && !P(`V.menu`) && P(`G.st[${I.lunar}].hits`) >= 1 && /Back to the game/.test(back) && !/data-act="newgame"/.test(back) && !/Start the game/.test(back),
      JSON.stringify([P(`V.screen`), P(`G.st[${I.lunar}].hits`), /Back to the game/.test(back), /data-act="newgame"/.test(back)]));
    P(`act("start", null)`);
    check("smoke: ... and Back to the game returns to the roster", P(`V.screen`) === "roster" && P(`G.st[${I.lunar}].hits`) >= 1);
    P(`act("undo", null); act("undo", null)`);
    const row = i => P(`renderRow(${i}, false)`), rowT = i => strip(row(i)), sheetT = i => strip(P(`V.sheet = ${i}; __h = renderSheet(${i}); V.sheet = null; __h`));
    const count = (h, re) => (h.match(re) || []).length;
    /* the card strikes a printed value through only when it has changed */
    const statsOf = i => (P(`V.sheet = ${i}; __h = renderSheet(${i}); V.sheet = null; __h`).match(/<div class="stats">[\s\S]*?<\/div>\s*<\/div>/) || [""])[0];
    check("smoke: an undamaged ship's or station's card strikes no value through", !/<s>/.test(statsOf(I.lunar)) && !/<s>/.test(statsOf(I.station)) && /20 cm/.test(statsOf(I.lunar)), (statsOf(I.lunar).match(/.{0,40}<s>.{0,20}/) || [""])[0]);

    /* Rulebook p. 100-101: a stationary defence never moves or drifts; the
       -5 cm of a crippled ship (p. 65) is not its own */
    const still = [I.station, I.black, I.plat, I.air, I.fort];
    const MOVES = /drifts|[^0-9]-5(?![0-9])/;   /* "500-505" is a page range, " -5" a modifier */
    check("smoke: no stationary defence's row or card says 'drifts' or shows a speed modifier", still.every(i => !MOVES.test(rowT(i)) && !MOVES.test(sheetT(i))), still.map(i => (rowT(i) + " " + sheetT(i)).match(/.{0,30}(drifts|[^0-9]-5(?![0-9])).{0,20}/)).filter(Boolean).join(" || "));

    /* --- one-hit defences: member boxes, VP one by one (p. 123) --- */
    check("smoke: three platforms are three boxes", count(row(I.plat), /data-act="kill"/g) === 3 && !/data-act="hit"/.test(row(I.plat)) && !/data-act="pop"[^>]*data-arg="crit"/.test(row(I.plat)), count(row(I.plat), /data-act="kill"/g));
    pg.toasts.length = 0;
    P(`act("kill", ${I.plat}, 0)`);
    check("smoke: one platform lost: 30 victory points at once, the unit lives (Rulebook p. 123)", P(`PLAY.conceded(U[${I.plat}].R, G.st[${I.plat}], 0)`) === 30 && /VP 30/.test(strip(P(`renderRoster()`))), strip(P(`renderRoster()`)).slice(-40));
    P(`act("kill", ${I.plat}, 1); act("kill", ${I.plat}, 2)`);
    check("smoke: the last platform lost: no Catastrophic Damage toast or table (Rulebook p. 101)", pg.toasts.length === 1 && !/2D6/.test(pg.toasts[0]) && /p\. 101/.test(pg.toasts[0]) && P(`V.pop`) == null, JSON.stringify(pg.toasts) + " pop " + P(`JSON.stringify(V.pop)`));
    clean("the row of the destroyed platforms", row(I.plat));
    /* p. 71: "When an escort is destroyed, replace it with a Blast Marker" */
    pg.toasts.length = 0;
    P(`act("kill", ${I.sword}, 0); act("kill", ${I.sword}, 1); act("kill", ${I.sword}, 2)`);
    check("smoke: an escort squadron's last loss: a Blast Marker each, no 2D6 (Rulebook p. 71)", pg.toasts.length === 1 && /Blast Marker/.test(pg.toasts[0]) && /p\. 71/.test(pg.toasts[0]) && !/2D6/.test(pg.toasts[0]) && P(`V.pop`) == null, JSON.stringify(pg.toasts));
    clean("the row of the destroyed escorts", row(I.sword));
    clean("the card of the destroyed escorts", P(`V.sheet = ${I.sword}; __h = renderSheet(${I.sword}); V.sheet = null; __h`));

    /* --- the Space Station: a hit track, the Defences table, its orders --- */
    P(`act("pop", ${I.station}, "crit")`);
    const critPop = P(`renderPop(${I.station})`);
    clean("the station's critical table", critPop);
    check("smoke: the station's table is the Defences Critical Hits Table (Rulebook p. 101)", /DEFENCES CRITICAL HITS/.test(strip(critPop)) && /data-arg="2-3"/.test(critPop) && /data-arg="8-9"/.test(critPop) && !/ENGINE|BRIDGE|PROW/.test(strip(critPop)), strip(critPop).slice(0, 160));
    P(`act("crit", ${I.station}, "2-3")`);
    check("smoke: tapping 2-3 records Lances and adds no hit (Rulebook p. 101)", P(`G.st[${I.station}].crits["2-3"]`) === 1 && P(`G.st[${I.station}].hits`) === 0, P(`JSON.stringify(G.st[${I.station}])`).slice(0, 120));
    clean("the station's row with a critical on it", P(`V.pop = null; renderRow(${I.station}, false)`));
    P(`act("pop", ${I.station}, "ld")`);
    const ldPop = P(`renderPop(${I.station})`);
    clean("the station's Leadership panel", ldPop);
    check("smoke: the station's Leadership panel has no dice tiles and says why (Rulebook p. 100)", !/data-act="ld"/.test(ldPop) && /Ld 7/.test(strip(ldPop)), strip(ldPop).slice(0, 200));
    P(`V.pop = null; OPT.orders = true; OPT.blast = true; OPT.autorepair = true; OPT.ordnance = true; OPT.fleet = true; act("pop", ${I.station}, "order")`);
    const ordPop = strip(P(`renderPop(${I.station})`));
    check("smoke: with orders tracked a station is offered Reload Ordnance only, and Brace (Rulebook p. 100)", /Reload Ordnance/.test(ordPop) && !/Lock On|All Ahead Full|Burn Retros|Come to New Heading|left the table/.test(ordPop), ordPop.slice(0, 260));
    P(`act("pop", ${I.fort}, "order")`);
    const ordFort = strip(P(`renderPop(${I.fort})`));
    check("smoke: ... a Ramilies Lock On and Reload Ordnance (Fleets p. 503)", /Reload Ordnance/.test(ordFort) && /Lock On/.test(ordFort) && !/All Ahead Full|Burn Retros|Come to New Heading/.test(ordFort), ordFort.slice(0, 260));
    /* every row and card again with all tracking on */
    clean("the roster with all tracking on", P(`V.pop = null; renderRoster()`));
    for(let i = 0; i < n; i++){
      if(P(`KIND(${i})`) === "commander") continue;
      clean("the card of " + P(`unitName(${i})`) + " with all tracking on", P(`V.sheet = ${i}; V.info = true; __h = renderSheet(${i}); V.info = false; V.sheet = null; __h`));
    }
    check("smoke: the INFO order table of a station lists its own two orders only (Rulebook p. 100)", (() => { const t = strip(P(`V.sheet = ${I.station}; V.info = true; __h = renderSheet(${I.station}); V.info = false; V.sheet = null; __h`)); return /Reload Ordnance/.test(t) && /Brace For Impact/.test(t) && !/All Ahead Full|Burn Retros/.test(t); })());
    /* Fleets p. 502: a Ramilies may have twice its launch bays in play */
    check("smoke: the attack craft counter counts the Ramilies' 32, two air bases... and the station's 4", /AC 0 \/ ?\d+/.test(strip(P(`renderRoster()`))) && P(`PLAY.launchBays(U[${I.fort}].R, G.st[${I.fort}]).n`) === 32, strip(P(`renderRoster()`)).slice(0, 120));
    P(`OPT.orders = false; OPT.blast = false; OPT.autorepair = false; OPT.ordnance = false; OPT.fleet = false; normaliseUntracked(G)`);
    /* a stationary unit's played mark has no "moved" */
    P(`act("played", ${I.station})`);
    check("smoke: one tap on a station's played mark = shot (Rulebook p. 100: it cannot move)", P(`G.st[${I.station}].played`) === 2 && /SHOT/.test(rowT(I.station)));

    /* --- the Ramilies: four quadrant tracks (Fleets p. 501-502) --- */
    const fortRow = row(I.fort);
    check("smoke: the Ramilies' row has a four-quadrant selector NW NE SW SE and one hit track of 12", count(fortRow, /data-act="quad"/g) === 4 && ["NW", "NE", "SW", "SE"].every(q => new RegExp(">" + q + "<").test(fortRow)) && count(fortRow, /data-act="dmg"/g) === 12, count(fortRow, /data-act="quad"/g) + " / " + count(fortRow, /data-act="dmg"/g));
    check("smoke: ... the Basilica weapons have their own heading on the row and the card", /Basilica/i.test(rowT(I.fort)) && /Basilica/i.test(sheetT(I.fort)));
    const vp0 = P(`U.reduce((a, x, i) => a + PLAY.conceded(x.R, G.st[i], cmdPts(i)), 0)`);
    pg.toasts.length = 0;
    P(`act("quad", ${I.fort}, 1); for(let k = 0; k < 6; k++) act("hit", ${I.fort});`);
    check("smoke: six hits with NE selected go to NE alone", P(`JSON.stringify(G.st[${I.fort}].quads.map(q => q.hits))`) === "[0,6,0,0]", P(`JSON.stringify(G.st[${I.fort}].quads)`));
    check("smoke: ... the toast names the crippled quadrant and its page (Fleets p. 501)", pg.toasts.length === 1 && /NE quadrant/.test(pg.toasts[0]) && /CRIPPLED/.test(pg.toasts[0]) && /p\. 501/.test(pg.toasts[0]), JSON.stringify(pg.toasts));
    check("smoke: ... and nothing is conceded for it (Rulebook p. 123)", P(`U.reduce((a, x, i) => a + PLAY.conceded(x.R, G.st[i], cmdPts(i)), 0)`) === vp0);
    clean("the Ramilies' row with a crippled quadrant", row(I.fort));
    pg.toasts.length = 0;
    P(`for(let k = 0; k < 8; k++) act("hit", ${I.fort});`);
    check("smoke: NE at 0: an asteroid field from now on, no Catastrophic table yet (Fleets p. 501-502)", P(`G.st[${I.fort}].quads[1].hits`) === 12 && pg.toasts.length === 1 && /asteroid field/.test(pg.toasts[0]) && /p\. 501/.test(pg.toasts[0]) && P(`V.pop`) == null && !P(`PLAY.destroyed(U[${I.fort}].R, G.st[${I.fort}])`), JSON.stringify(pg.toasts) + " " + P(`JSON.stringify(V.pop)`));
    clean("the Ramilies' row with a quadrant gone", row(I.fort));
    clean("the Ramilies' card with a quadrant gone", P(`V.sheet = ${I.fort}; __h = renderSheet(${I.fort}); V.sheet = null; __h`));
    P(`act("quad", ${I.fort}, 0); act("pop", ${I.fort}, "crit")`);
    const fortCrit = P(`renderPop(${I.fort})`);
    clean("the Ramilies' critical table", fortCrit);
    check("smoke: the Ramilies' critical table names the quadrant it is for (Fleets p. 501)", /STAR FORT/.test(strip(fortCrit)) && /NW/.test(strip(fortCrit)), strip(fortCrit).slice(0, 120));
    P(`act("crit", ${I.fort}, "11")`);
    check("smoke: critical 11 on NW: the Basilica rows are struck on every quadrant's view (Fleets p. 505)", P(`act("quad", ${I.fort}, 2); V.pop = null; PLAY.armament(U[${I.fort}].R, G.st[${I.fort}]).filter(a => a.zone === "basilica").every(a => !!a.silent)`) === true && /Basilica penetrated/.test(rowT(I.fort)));
    pg.toasts.length = 0;
    P(`[0, 2, 3].forEach(q => { act("quad", ${I.fort}, q); for(let k = 0; k < 12; k++) act("hit", ${I.fort}); });`);
    check("smoke: all four at 0: the fort is destroyed and its own D6 table opens (Fleets p. 502, 505)", P(`PLAY.destroyed(U[${I.fort}].R, G.st[${I.fort}])`) && P(`JSON.stringify(V.pop)`) === JSON.stringify({ i: I.fort, kind: "hulk" }) && pg.toasts.some(t => /D6/.test(t) && /505/.test(t)), JSON.stringify(pg.toasts.slice(-1)) + " " + P(`JSON.stringify(V.pop)`));
    const hulkPop = P(`renderPop(${I.fort})`);
    clean("the star fort's catastrophic table", hulkPop);
    check("smoke: ... without the ships' 'Boarded to 0' button: only a space hulk may board it (Fleets p. 502)", !/Boarded to 0/.test(strip(hulkPop)) && /Wrecked/.test(strip(hulkPop)), strip(hulkPop).slice(0, 160));
    check("smoke: ... and now its 875 points are conceded (Rulebook p. 123)", P(`PLAY.conceded(U[${I.fort}].R, G.st[${I.fort}], 0)`) === 875);
    clean("the destroyed fort's row", P(`V.pop = null; renderRow(${I.fort}, false)`));
    clean("the destroyed fort's card", P(`V.sheet = ${I.fort}; __h = renderSheet(${I.fort}); V.sheet = null; __h`));

    /* --- rule cards: mines, minefields, fire ships (Fleets p. 512-516) --- */
    const mineRow = row(I.mines);
    check("smoke: three orbital mines: a real row with three tick boxes, its points and no 'fleet entry' stub (Fleets p. 512)", count(mineRow, /data-act="kill"/g) === 3 && /15 pts/.test(strip(mineRow)) && !/fleet entry/.test(strip(mineRow)), strip(mineRow).slice(0, 200));
    check("smoke: ... its card carries the rule steps", /Ordnance phase/.test(sheetT(I.mines)) && /8 dice/.test(sheetT(I.mines)), sheetT(I.mines).slice(0, 200));
    const vp1 = P(`U.reduce((a, x, i) => a + PLAY.conceded(x.R, G.st[i], cmdPts(i)), 0)`);
    P(`act("kill", ${I.mines}, 0); act("kill", ${I.mines}, 2)`);
    const bottom = strip(P(`renderRoster()`));
    check("smoke: two mines ticked off: 2 x 5 points in the roster's VP and the menu (Fleets p. 512)", new RegExp("VP " + (vp1 + 10) + "\\b").test(bottom) && new RegExp("\\b" + (vp1 + 10) + "\\b").test(strip(P(`renderMenu()`))) && /Orbital mine/i.test(strip(P(`renderMenu()`))), bottom.slice(-60));
    clean("the mines' row with two gone", row(I.mines));
    const fieldRow = strip(row(I.field));
    check("smoke: three minefields: a real row with the count, the points and the set-up roll, no tick boxes (Fleets p. 513)", /3/.test(fieldRow) && /120 pts/.test(fieldRow) && /D3/.test(fieldRow) && !/fleet entry/.test(fieldRow) && count(row(I.field), /data-act="kill"/g) === 0, fieldRow.slice(0, 220));
    check("smoke: ... its card carries all its steps", /Suppression/.test(sheetT(I.field)) && /Set up/.test(sheetT(I.field)));
    const fireRow = strip(row(I.fire));
    check("smoke: fire ships: three member boxes, 'no armament' and the Detonate step on the row itself (Fleets p. 516)", count(row(I.fire), /data-act="kill"/g) === 3 && /no armament/i.test(fireRow) && /Detonate/.test(fireRow) && /3D6/.test(fireRow) && !/<table class="wt/.test(row(I.fire)), fireRow.slice(0, 260));
    check("smoke: ... and on its card", /no armament/i.test(sheetT(I.fire)) && /Detonate/.test(sheetT(I.fire)));

    /* --- undo and a reload keep the new state --- */
    P(`act("quad", ${I.fort}, 3)`);
    const before = P(`JSON.stringify(G.st)`);
    P(`act("hit", ${I.lunar}); act("undo")`);
    check("smoke: UNDO restores the quadrants, the ticks and the selection", P(`JSON.stringify(G.st)`) === before);
    check("smoke: the saved game resumes with its quadrants and ticks", P(`(() => { const g = loadPlay(); const ok = resumeGame(g); return ok && JSON.stringify(G.st); })()`) === before);
    clean("the roster after resuming", P(`renderRoster()`));
  });

  /* ------------- Imperial Navy: the Emperor's Leadership is what was chosen --- */
  /* User decision 13.10.2026 (RULINGS.md T40): no Leadership automation on the
     play page. The Emperor's own +1 (Fleets p. 53) is the player's to add;
     the page shows and uses the value that was chosen. */
  guard("the Emperor's Leadership is the chosen value", () => {
    const pg = open(), P = pg.P;
    const L = pg.DATA.lists.find(x => /^Imperial Navy . Gothic Sector$/.test(x.nm));
    pg.ctx.__doc = { ln: L.nm, limit: 9000, units: [saved(L, /^Battleships$/, /^Emperor class battleship/),
                                                  saved(L, /^Cruisers$/, /^Lunar class cruiser$/)] };
    P(`newGame(resolveFleet(__doc)); V.screen = "setup"; save(); render();
       var EMP = U.findIndex(x => /^EMPEROR/i.test(x.R.className || ""));
       var LDNOW = i => PLAY.leadership(U[i].R, G.st[i], G.fleet).now;`);
    const rowOf = (h, name) => { const m = String(h).split(/<div class="setrow[^"]*"[^>]*>/).find(s => new RegExp('(<b>|data-nm="[0-9]+" value=")' + name, "i").test(s)); return m ? strip(m) : ""; };
    check("smoke: an Emperor without a commander has six Ld tiles and no value yet",
          (P(`renderSetup()`).match(new RegExp('data-act="ld" data-i="' + P(`EMP`) + '"', "g")) || []).length === 6 && P(`G.st[EMP].ld`) == null);
    P(`act("ld", EMP, 7)`);
    check("smoke: an Emperor set to Ld 7 checks on Ld 7: the page adds nothing", P(`LDNOW(EMP)`) === 7 && P(`G.st[EMP].ld`) === 7, P(`JSON.stringify([LDNOW(EMP), G.st[EMP].ld])`));
    const s1 = P(`renderSetup()`);
    clean("the set-up screen with an Emperor", s1);
    check("smoke: ... and its set-up row names no bonus", !!rowOf(s1, "Emperor") && !/of its own/.test(rowOf(s1, "Emperor")), rowOf(s1, "Emperor"));
    P(`act("ld", EMP, 10)`);
    check("smoke: Ld 10 can be chosen", P(`LDNOW(EMP)`) === 10);
    P(`act("ld", EMP, 7); act("start", null)`);
    clean("the roster with an Emperor", P(`renderRoster()`));
    P(`act("pop", EMP, "ld")`);
    const pop = P(`renderPop(EMP)`);
    clean("the Emperor's Leadership panel", pop);
    check("smoke: the panel offers Ld 5 to Ld 10 and names no bonus of the ship's own", (pop.match(/data-act="ld"/g) || []).length === 6 && !/of its own/.test(strip(pop)), strip(pop).slice(0, 260));
    P(`act("closepop", null)`);
  });

  /* ------------------------------ the phone features (19.10.2026) --- */
  /* The phone round of 19.10.2026 (docs/history/registry/play/LUEMINUT.md): compact view, P+S rows,
     End Phase, the strip of ships, the report, links and files. */
  guard("the phone features", () => {
    const pg = open(), P = pg.P;
    const L = pg.DATA.lists.find(x => /^Imperial Navy . Gothic Sector$/.test(x.nm));
    pg.ctx.__doc = { ln: L.nm, limit: 1500, units: [saved(L, /^Admiral$/, /^Fleet-Admiral \(Ld 8\)$/), saved(L, /^Cruisers$/, /^Lunar class cruiser$/),
                                                  saved(L, /^Cruisers$/, /^Gothic class cruiser$/), saved(L, /^ESCORTS$/, /^Sword class frigate$/, 3)] };
    check("smoke: the G of the title no longer opens a hidden roster list (user 19.10.2026)", !/data-act="egg"/.test(P(`renderLoad()`)) && !/Ready-made fleets/.test(strip(P(`renderLoad()`))) && P(`typeof ROSTERS`) === "undefined");
    P(`newGame(resolveFleet(__doc)); V.screen = "setup"; save(); render();
       var LU = U.findIndex(x => /^LUNAR/i.test(x.R.className || "")), GO = U.findIndex(x => /^GOTHIC/i.test(x.R.className || "")), SW = U.findIndex(x => /^SWORD/i.test(x.R.className || ""));
       U.forEach((x, i) => { if(x.R.kind === "ship" && G.st[i].ld == null) setLd(i, 8); }); act("start", null);`);
    check("smoke: a new screen takes no taps for a moment (a double tap must not pick on the next screen)", P(`V.guardUntil > Date.now() && V.lastScreen === "roster"`) === true);
    /* the Lunar (Fleets p. 37): the numbers first (user 2.11.2026), and a
       port / starboard pair one row, "port and starboard, each", while both
       sides are the same in play (livePairs) */
    const lunarRow = P(`renderRow(LU, false)`);
    clean("the Lunar's row with its port/starboard pairs", lunarRow);
    const trs = (lunarRow.match(/<tr[ >]/g) || []).length - 1;   /* minus the heading row */
    check("smoke: the Lunar's pairs are one row each: 3 rows, the strength first and the name last",
          trs === 3 && (lunarRow.match(/port and starboard, each/g) || []).length === 2 && /<td class="bd">[^]*?<td class="st">[^]*?<td class="nm">/.test(lunarRow) && !/Port weapons battery/.test(strip(lunarRow)),
          trs + " rows: " + strip(lunarRow).slice(0, 220));
    check("smoke: the stats are one line with the number big", /class="stl"/.test(lunarRow) && /<small>SPD<\/small><b>20 cm<\/b>/.test(lunarRow), (lunarRow.match(/class="stl".{0,120}/) || [""])[0]);
    /* v1.2 J183: one range in a frame of its band's colour (30 cm: #E69F00) */
    check("smoke: the ranges are framed in their band's colour as on the card (30 cm band) and the unit is in the heading", /class="rp"[^>]*--rb:#E69F00/.test(lunarRow) && /<th class="rg">cm<\/th>/.test(lunarRow), (lunarRow.match(/.{0,60}class="rp.{0,60}/) || [""])[0]);
    P(`act("pop", LU, "crit"); act("crit", LU, "4"); act("pop", LU, "crit")`);
    const struck = P(`renderRow(LU, false)`);
    check("smoke: Port Armament Damaged (p. 67) parts the pairs: 5 rows, the port rows struck through with the reason, starboard whole", (struck.match(/<tr[ >]/g) || []).length - 1 === 5 && (struck.match(/<tr class="silent/g) || []).length === 2 && /Port weapons battery/.test(strip(struck)) && /Starboard weapons battery/.test(strip(struck)), strip(struck).slice(0, 260));
    /* the compact view */
    P(`V.compact = true`);
    const croster = P(`renderRoster()`);
    clean("the compact roster", croster);
    check("smoke: compact rows carry the weapons line and CRIT in the name line, no weapons table, no strip", /class="wline"/.test(croster) && !/<table class="wt/.test(croster) && /class="crit cmini"/.test(croster) && !/class="jump"/.test(croster));
    P(`V.compact = false`);
    const froster = P(`renderRoster()`);
    check("smoke: the full roster has the strip with a chip per unit and its End Phase button", (froster.match(/data-act="jump"/g) || []).length === 3 && /data-act="endph"/.test(froster), (froster.match(/data-act="jump"/g) || []).length);
    /* J235 (the user 25.10.2026 asked for an easier way to always get back to the
       builder): the builder is in the top bar, the menu is one screen */
    const topbar = froster.split('<div class="main')[0];
    check("smoke: the top bar is one line of four tools: the builder, the view, UNDO, the menu (J235)", /class="tool" href="\.\.\/"/.test(topbar) && /data-act="view"/.test(topbar) && /data-act="undo"/.test(topbar) && /data-act="menu"/.test(topbar) && !/data-act="info"/.test(topbar));
    check("smoke: ... and the set-up has the way to the builder too", /class="tool" href="\.\.\/"/.test(P(`renderSetup()`)));
    /* the End Phase: repair what may be repaired (p. 88), not 9 or 10 (p. 67); a fire still burning costs a hit (p. 67) */
    P(`act("pop", GO, "crit"); act("crit", GO, "7"); act("crit", GO, "9"); act("pop", GO, "crit")`);
    const pend = JSON.parse(P(`JSON.stringify(endPending())`));
    check("smoke: the End Phase counts 2 to repair (the Lunar's 4, the Gothic's fire) and 1 fire - not the bridge (p. 67)", pend.crits === 2 && pend.fires === 1, JSON.stringify(pend));
    P(`act("endph")`);
    const ep = P(`renderEndPhase()`);
    clean("the End Phase panel", ep);
    check("smoke: ... it offers the repairs and the fire, and says the bridge cannot be repaired (p. 67)", new RegExp('data-act="repair" data-i="' + P(`GO`) + '" data-arg="7"').test(ep) && !/data-arg="9"/.test(ep) && /no repair \(p\. 67\)/.test(strip(ep)) && /data-act="fire"/.test(ep), strip(ep).slice(0, 300));
    const h0 = P(`G.st[GO].hits`);
    P(`act("fire", GO); act("fire", GO)`);
    check("smoke: the fire button adds its hit each time and counts it: both players' End Phases (p. 88)", P(`G.st[GO].hits`) === h0 + 2 && /added 2/.test(strip(P(`renderEndPhase()`))), P(`G.st[GO].hits`) + " " + strip(P(`renderEndPhase()`)).slice(0, 200));
    P(`act("repair", GO, "7"); act("repair", GO, "9")`);
    check("smoke: a repair takes the fire off; the bridge stays (p. 67)", P(`JSON.stringify(G.st[GO].crits)`) === JSON.stringify({ "9": 1 }), P(`JSON.stringify(G.st[GO].crits)`));
    P(`act("endph")`);
    /* J235 (the user 25.10.2026: remove the game report from Play
       entirely, no reporting at all) */
    const menu = P(`renderMenu()`);
    clean("the menu", menu);
    check("smoke: the menu has no game report (J235)", !/report/i.test(strip(menu)) && P(`typeof reportText`) === "undefined" && !/<textarea/.test(menu), strip(menu).slice(0, 300));
    check("smoke: ... its tracking parts and the ships' victory points are behind a fold each", (menu.match(/<details data-keep=/g) || []).length === 2 && /Victory points conceded<b>/.test(menu));
    /* the fleet list (and its "to phone" QR codes) from the menu without
       losing the game (user 19.10.2026): only "New game" forgets it */
    const before = P(`JSON.stringify(G.st)`);
    check("smoke: the menu has a way to the fleet list that keeps the game", /data-act="fleets"/.test(P(`renderMenu()`)));
    P(`V.menu = true; act("fleets")`);
    check("smoke: ... it opens the fleet list with the game record kept and Resume offered", P(`V.screen`) === "load" && P(`V.menu`) === false && !!P(`loadPlay() && "kept"`) && /Resume game/.test(strip(P(`renderLoad()`))), P(`V.screen`) + " " + strip(P(`renderLoad()`)).slice(0, 120));
    /* Resume as the click handler does it (it is not an act()) */
    P(`if(resumeGame(loadPlay())) V.screen = "roster"; render();`);
    const after = P(`JSON.stringify(G.st)`);
    check("smoke: ... and Resume takes the game back where it was", P(`V.screen`) === "roster" && after === before,
          P(`V.screen`) + " " + JSON.parse(before).map((s, k) => Object.keys(s).filter(f => JSON.stringify(s[f]) !== JSON.stringify((JSON.parse(after)[k] || {})[f])).map(f => k + "." + f + ": " + JSON.stringify(s[f]) + " -> " + JSON.stringify((JSON.parse(after)[k] || {})[f]))).flat().join("; "));
    /* links and files: the page's own list, never the builder's key */
    check("smoke: the link's base64url round-trips bytes", P(`(() => { const b = new Uint8Array([0, 1, 250, 255, 62, 63, 128]); return Array.from(unb64url(b64url(b))).join(","); })()`) === "0,1,250,255,62,63,128");
    const q = JSON.parse(P(`JSON.stringify((() => { const r = QR.encode("https://bfgtools.kuldare.com/play/x#fleet=abc"); return { v: r.version, n: r.size, rows: r.rows.length }; })())`));
    check("smoke: the QR code is a square of 4 x version + 17 modules (ISO 18004)", q.n === q.v * 4 + 17 && q.rows === q.n, JSON.stringify(q));
    /* one list of saved fleets (user 4.11.2026): a file or a link goes into
       the builder's Saved fleets, and the builder's working key is not written */
    const LIBK = "gothic-fleet-registry-saves-v1";
    const lib = () => JSON.parse(pg.store[LIBK] || '{"saves":[]}').saves;
    const builderKey = P(`lsGet(KEY_BUILDER)`);
    P(`takeFleetText(JSON.stringify(__doc), "file")`);
    check("smoke: a fleet file goes into the builder's Saved fleets, not its working key", lib().length === 1 && lib()[0].from === "file" && lib()[0].ln === pg.ctx.__doc.ln && lib()[0].id && lib()[0].pts > 0 && P(`lsGet(KEY_BUILDER)`) === builderKey, JSON.stringify(lib().map(s => [s.from, s.ln, s.pts])));
    const load = P(`renderLoad()`);
    clean("the load screen with a fleet from a file", load);
    check("smoke: ... the load screen lists it under Saved fleets, marked new, and says it is the builder's list", /Saved fleets/.test(strip(load)) && /same list as Saved fleets in the builder/.test(strip(load)) && /data-act="linked" data-arg="0"/.test(load) && /new/.test(strip(load)) && !/data-act="unlink"/.test(load));
    P(`takeFleetText(JSON.stringify(__doc), "link")`);
    check("smoke: ... the same fleet again is not saved twice", lib().length === 1);
    /* J208: a link or a file carries the builder's names; every fleet in it
       is kept, named, and marked new */
    P(`takeFleetText(JSON.stringify({ name: "Lunar pair", ln: __doc.ln, limit: 1400, units: __doc.units, fleets: [{ name: "Swords", ln: __doc.ln, limit: 1000, units: __doc.units.slice(3) }] }), "link")`);
    const named = strip(P(`renderLoad()`));
    check("smoke: a link's fleets keep their names and are all marked new (J208)", lib().map(f => f.name).slice(0, 2).join("|") === "Lunar pair|Swords" && /Lunar pair/.test(named) && /Swords/.test(named) && P(`V.linkNew.length`) === 2, JSON.stringify(lib().map(f => f.name)));
    /* phone to phone (user 19.10.2026): the saved fleets go on by QR code or a
       shared link, one by one or all in one */
    const lp = P(`renderLoad()`);
    check("smoke: every saved fleet has its own Send, and two or more have Send all", /data-act="send" data-arg="s:0"/.test(lp) && /data-act="send" data-arg="s:1"/.test(lp) && /data-act="send" data-arg="all"/.test(lp));
    const all2 = JSON.parse(P(`JSON.stringify(phoneDoc("all"))`));
    check("smoke: ... Send all carries every saved fleet with its name", all2.name === "Lunar pair" && (all2.fleets || []).length === 2 && all2.fleets[0].name === "Swords" && P(`phoneDoc("s:1").name`) === "Swords", JSON.stringify([all2.name, (all2.fleets || []).map(f => f.name)]));
    /* a fleet saved in the builder is on the same list, by name */
    pg.store[LIBK] = JSON.stringify({ v: 1, saves: [{ id: "x1", name: "Club night", ln: L.nm, limit: 1500, units: pg.ctx.__doc.units, pts: 0, saved: "2026-10-19" }], open: {} });
    const lb = P(`renderLoad()`);
    check("smoke: the builder's saved fleets are the load screen's Saved fleets, ready to play or send", /Club night/.test(strip(lb)) && /data-act="linked" data-arg="0"/.test(lb) && /data-act="send" data-arg="s:0"/.test(lb) && !/Fleets from the builder/.test(strip(lb)));
    /* Play's own list from before goes into the library once */
    pg.store[LIBK] = JSON.stringify({ v: 1, saves: [], open: {} });
    delete pg.store["gothic-fleet-play-linked-moved"];
    pg.store["gothic-fleet-play-linked"] = JSON.stringify([{ fp: "a", how: "file", date: "2026-11-01", doc: { name: "Old phone fleet", ln: L.nm, limit: 1500, units: pg.ctx.__doc.units } }]);
    P(`savedFleets()`); P(`savedFleets()`);
    check("smoke: Play's old list is moved into Saved fleets once", lib().length === 1 && lib()[0].name === "Old phone fleet" && lib()[0].from === "file" && pg.store["gothic-fleet-play-linked-moved"] === "1", JSON.stringify(lib()));
    delete pg.store[LIBK];
  });

  /* --------------------------- Space Marines: the Fortress-Monastery --- */
  guard("the Space Marine fleet", () => {
    const pg = open(), P = pg.P;
    const L = pg.DATA.lists.find(x => /^Space Marines . Crusade$/.test(x.nm));
    pg.ctx.__doc = { ln: L.nm, limit: 9000, units: [saved(L, /^Master of the Fleet$/, /^Master of the Fleet/), saved(L, /^Fortress-Monastery$/, /^Fortress-Monastery$/),
                                                  saved(L, /^Battle Barges$/, /./), saved(L, /^ESCORTS$/, /./, 3)] };
    P(`newGame(resolveFleet(__doc)); V.screen = "setup"; save(); render(); var FM = U.findIndex(x => /FORTRESS/.test(x.R.className || "")), BB = U.findIndex((x, i) => x.R.kind === "ship" && i !== FM && !PLAY.isEscort(x.R));`);
    const setup = P(`renderSetup()`);
    clean("the Space Marine set-up screen", setup);
    /* Fleets p. 111: "Fortress-Monasteries have a base leadership of 10" */
    check("smoke: the Fortress-Monastery starts with Ld 10 and no dice tiles (Fleets p. 111)", P(`G.st[FM].ld`) === 10 && !new RegExp('data-act="ld" data-i="' + P(`FM`) + '"').test(setup) && /Fleets p\. 111/.test(strip(setup)), P(`JSON.stringify(G.st[FM].ld)`));
    check("smoke: the default flagship is the battle barge, the fortress is offered too (Fleets p. 111)", P(`G.flag === BB`) && new RegExp('<option value="' + P(`FM`) + '"').test(setup));
    /* p. 111: aboard the fortress the commander's "own leadership value is
       used (even if less!)" - and off it again the fortress has its 10 */
    P(`act("flag", null, FM)`);
    check("smoke: the commander aboard: his Leadership is the fortress's (Fleets p. 111)", P(`G.st[FM].ld`) === P(`U[G.cmd].R.leadership.value`) && P(`G.st[FM].ldFrom`) === "commander");
    P(`act("flag", null, BB)`);
    check("smoke: ... ashore again the fortress has its own 10 back, not a missing roll", P(`G.st[FM].ld`) === 10 && P(`G.st[FM].ldFrom`) === "fixed", P(`JSON.stringify([G.st[FM].ld, G.st[FM].ldFrom])`));
    P(`U.forEach((x, i) => { if(x.R.kind === "ship" && G.st[i].ld == null) setLd(i, 8); }); act("start", null)`);
    clean("the Space Marine roster", P(`renderRoster()`));
    clean("the Fortress-Monastery's card", P(`V.sheet = FM; V.info = true; var __h = renderSheet(FM); V.info = false; V.sheet = null; __h`));
    check("smoke: the Fortress-Monastery's card does not give ships a boarding value against it (Fleets p. 111)", /space hulk/i.test(strip(P(`V.sheet = FM; __h = renderSheet(FM); V.sheet = null; __h`))));
    /* a game saved before the quadrants existed: one track, a rolled Ld */
    P(`(() => { const s = G.st[FM]; delete s.quads; delete s.qsel; s.hits = 7; s.crits = { "7": 1 }; s.ld = 9; s.ldRoll = 9; s.ldFrom = null; save(); })()`);
    check("smoke: an older Fortress-Monastery save resumes: 7 hits and the fire are quadrant NW's, Ld is the book's 10 (Fleets p. 110-111)",
          P(`(() => { const ok = resumeGame(loadPlay()); const s = G.st[FM]; return ok && Array.isArray(s.quads) && s.quads[0].hits === 7 && s.quads[0].crits["7"] === 1 && s.quads[1].hits === 0 && s.ld === 10; })()`) === true, P(`JSON.stringify(G.st[FM])`).slice(0, 300));
    clean("the resumed Fortress-Monastery's row", P(`renderRow(FM, false)`));
  });

  /* ------------------- J215: the builder's placement sets the flagship --- */
  guard("the Chaos fleet's flagship", () => {
    const pg = open(), P = pg.P;
    const L = pg.DATA.lists.find(x => /^Chaos . Black Crusade$/.test(x.nm));
    const dsp = saved(L, /^Battleships$/, /^Despoiler/);
    dsp.upn = { "DAEMON SHIPS\u0001Daemonship: Battleship": "take" };
    pg.ctx.__doc = { ln: L.nm, limit: 9000, units: [saved(L, /^Chaos Warmaster$/, /^Chaos Warmaster/), dsp, saved(L, /^Cruisers$/, /^Murder/)] };
    P(`newGame(resolveFleet(__doc)); V.screen = "setup"; save(); render();
       var MU = U.findIndex(x => /MURDER/.test(x.R.className || "")), DS = U.findIndex(x => /DESPOILER/.test(x.R.className || ""));`);
    /* Fleets p. 245: "A Daemon ship may not be commanded by a Warmaster or a
       Chaos Lord even if it is the largest ship in the fleet." */
    check("smoke: the Warmaster's flagship is the Murder, not the bigger Daemonship (Fleets p. 245, J215)",
          P(`U[DS].R.upgrades.some(x => /^Daemonship/.test(x.label) && x.state === "take") && G.flag === MU`) === true,
          P(`JSON.stringify([G.flag, MU, DS])`));
  });

  /* --------------- J216/J222: the builder's squadrons start squadroned --- */
  guard("the builder's squadrons", () => {
    const pg = open(), P = pg.P;
    const L = pg.DATA.lists.find(x => /^Imperial Navy . Gothic Sector$/.test(x.nm));
    /* the builder's squadron tags (docs/save-format.md, unit references): two
       cruisers tagged C, one without, one alone tagged E and
       an escort squadron tagged C - an escort has no SQN button */
    const lun = (name, sq) => { const u = saved(L, /^Cruisers$/, /^Lunar class cruiser$/, 1, name); if(sq) u.sq = sq; return u; };
    const swords = saved(L, /^ESCORTS$/, /^Sword class frigate$/, 3, "Blades"); swords.sq = "C";
    pg.ctx.__doc = { ln: L.nm, limit: 9000, units: [saved(L, /^Admiral$/, /^Fleet-Admiral \(Ld 8\)$/), lun("Alpha", "C"), lun("Beta", "C"), lun("Gamma"), lun("Delta", "E"), swords] };
    P(`newGame(resolveFleet(__doc)); V.screen = "setup"; save(); render();
       var NX = n => U.findIndex(x => x.u.name === n);`);
    const g = JSON.parse(P(`JSON.stringify(["Alpha", "Beta", "Gamma", "Delta", "Blades"].map(n => G.grp[NX(n)]))`) || "[]");
    /* Fleets p. 13: cruisers "may be formed into squadrons of two to four
       ships"; SQN gives them one Ld, one order and combined fire (p. 95, 99).
       The group keeps the builder's letter, so the phone says what the
       builder and the printed roster say (user 4.11.2026, T42). */
    check("smoke: two cruisers with the builder's squadron tag start the game in one SQN group under its letter (J222, T42)",
          g[0] === "C" && g[1] === "C", JSON.stringify(g));
    check("smoke: ... an untagged cruiser, a tag on one ship alone and the escort squadron start ungrouped",
          g[2] == null && g[3] == null && g[4] == null, JSON.stringify(g));
    const setup = P(`renderSetup()`);
    const btn = n => { const m = new RegExp('data-act="grp" data-i="' + P(`NX(${JSON.stringify(n)})`) + '"[^>]*>([^<]*)<').exec(setup); return m ? m[1] : null; };
    check("smoke: ... the set-up shows the group on both cruisers' SQN buttons",
          btn("Alpha") === "SQN " + g[0] && btn("Beta") === "SQN " + g[0] && btn("Gamma") === "+ SQN", JSON.stringify([btn("Alpha"), btn("Beta"), btn("Gamma")]));
    P(`act("grp", NX("Beta"))`);
    check("smoke: ... and the SQN button still takes a ship out of it", P(`G.grp[NX("Beta")] !== G.grp[NX("Alpha")]`) === true, P(`JSON.stringify(G.grp)`));
  });

  /* ---------- T42 (user 4.11.2026): every builder squadron, its own letter --- */
  guard("five builder skwadrons", () => {
    const pg = open(), P = pg.P;
    const L = pg.DATA.lists.find(x => /^Orks . Da Ork Clanz$/.test(x.nm));
    /* J232: Clanz kroozers (1-2) and Roks (1-4) are skwadrons by their tag
       (Fleets p. 374). Two Warlords, five capital skwadrons B-F and a mixed
       tiddla A of two cards (docs/save-format.md: uid, cmd, sq). */
    const wl = uid => Object.assign(saved(L, /^WARLORD$/, /^Ork Warlord$/), { uid: uid });
    const sk = (sec, re, n, name, cmd, sq) => Object.assign(saved(L, sec, re, n, name), { cmd: cmd }, sq ? { sq: sq } : {});
    const T = /^Tiddla skwadron$/, BIG = /^Big ship skwadron$/, ROK = /^Roks$/;
    pg.ctx.__doc = { ln: L.nm, limit: 3000, units: [
      wl("w1"), sk(T, /^Savage/, 3, "Savages", "w1", "A"), sk(T, /^Onslaught/, 3, "Onslaughts", "w1", "A"), sk(T, /^Ravager/, 3, "Ravagers", "w1"),
      sk(BIG, /^Terror ship$/, 1, "Terror 1", "w1", "B"), sk(BIG, /^Terror ship$/, 1, "Terror 2", "w1", "B"),
      sk(ROK, /^Rok$/, 1, "Rok 1", "w1", "C"), sk(ROK, /^Rok$/, 1, "Rok 2", "w1", "C"),
      wl("w2"), sk(T, /^Brute/, 3, "Brutes", "w2"), sk(T, /^Grunt/, 3, "Grunts", "w2"), sk(T, /^Ravager/, 3, "Raiders", "w2"),
      sk(BIG, /^Kill kroozer$/, 1, "Kill 1", "w2", "D"), sk(BIG, /^Kill kroozer$/, 1, "Kill 2", "w2", "D"),
      sk(ROK, /^Rok$/, 1, "Rok 3", "w2", "E"), sk(ROK, /^Rok$/, 1, "Rok 4", "w2", "E"), sk(ROK, /^Rok$/, 1, "Rok 5", "w2", "E"),
      sk(BIG, /^Lite kroozer$/, 1, "Lite 1", "w2", "F"), sk(BIG, /^Lite kroozer$/, 1, "Lite 2", "w2", "F")] };
    P(`newGame(resolveFleet(__doc)); V.screen = "setup"; save(); render();
       var NX = n => U.findIndex(x => x.u.name === n);`);
    const caps = ["Terror 1", "Terror 2", "Rok 1", "Rok 2", "Kill 1", "Kill 2", "Rok 3", "Rok 4", "Rok 5", "Lite 1", "Lite 2"];
    const want = ["B", "B", "C", "C", "D", "D", "E", "E", "E", "F", "F"];
    const grpOf = ns => JSON.parse(P(`JSON.stringify(${JSON.stringify(ns)}.map(n => G.grp[NX(n)]))`) || "[]");
    const g = grpOf(caps);
    check("smoke: five builder skwadrons start the game as five SQN groups, each under the builder's letter (T42, J232)",
          JSON.stringify(g) === JSON.stringify(want), JSON.stringify(g));
    check("smoke: ... the mixed tiddla stays one escort squadron under its letter A, which no capital squadron shows",
          JSON.stringify(grpOf(["Savages", "Onslaughts", "Ravagers"])) === '["e:A","e:A",null]' && g.indexOf("A") < 0, JSON.stringify(grpOf(["Savages", "Onslaughts", "Ravagers"])));
    const setup = P(`renderSetup()`);
    clean("the five-skwadron set-up screen", setup);
    const btn = n => { const m = new RegExp('data-act="grp" data-i="' + P(`NX(${JSON.stringify(n)})`) + '"[^>]*>([^<]*)<').exec(setup); return m ? m[1] : null; };
    check("smoke: ... the set-up shows each ship's letter on its SQN button",
          caps.every((n, k) => btn(n) === "SQN " + want[k]), JSON.stringify(caps.map(btn)));
    /* the button: the letters in use, a new one (none of the fleet's, the
       tiddla's A included), none, and round again */
    const seq = [];
    for(let k = 0; k < 7; k++){ P(`act("grp", NX("Kill 2"))`); seq.push(P(`G.grp[NX("Kill 2")]`)); }
    check("smoke: ... the SQN button goes through every squadron's letter, then a new one no squadron of the fleet has, then none (T42)",
          JSON.stringify(seq) === JSON.stringify(["E", "F", "G", null, "B", "C", "D"]), JSON.stringify(seq));
    P(`U.forEach((x, i) => { if(x.R.kind === "ship" && G.st[i].ld == null) setLd(i, 6); }); act("start", null);`);
    const roster = P(`renderRoster()`);
    clean("the five-skwadron roster", roster);
    check("smoke: ... the roster has a head for each of the five and for the tiddla",
          ["Squadron B", "Squadron C", "Squadron D", "Squadron E", "Squadron F", "Escort squadron A"].every(s => strip(roster).indexOf(s) >= 0) &&
          (roster.match(/class="row grp-hd/g) || []).length === 6, strip(roster).slice(0, 300));
  });

  /* -------- a squadron tag from a link or a file is data, not markup --- */
  guard("squadron tags that are not the builder's", () => {
    const pg = open(), P = pg.P;
    const L = pg.DATA.lists.find(x => /^Imperial Navy . Gothic Sector$/.test(x.nm));
    /* the builder writes one letter A-Z (freeSqTag); a hand-made file or a
       crafted link can carry anything */
    const MK = "<img src=x onerror=alert(1)>";
    const tag = (u, sq) => Object.assign(u, { sq: sq });
    pg.ctx.__doc = { ln: L.nm, limit: 9000, units: [
      tag(saved(L, /^Cruisers$/, /^Lunar class cruiser$/, 1, "Alpha"), "x1"), tag(saved(L, /^Cruisers$/, /^Lunar class cruiser$/, 1, "Beta"), "x1"),
      tag(saved(L, /^ESCORTS$/, /^Sword class frigate$/, 3, "Blades"), MK), tag(saved(L, /^ESCORTS$/, /^Cobra class destroyer$/, 3, "Snakes"), MK)] };
    P(`newGame(resolveFleet(__doc)); V.screen = "setup"; save(); render();
       var NX = n => U.findIndex(x => x.u.name === n);`);
    check("smoke: two cruisers with a tag that is no letter start in one SQN group under a letter of their own (T42)",
          P(`G.grp[NX("Alpha")] === "A" && G.grp[NX("Beta")] === "A"`) === true, P(`JSON.stringify(G.grp)`));
    P(`U.forEach((x, i) => { if(x.R.kind === "ship" && G.st[i].ld == null) setLd(i, 8); });`);
    const pages = [P(`renderSetup()`)];
    P(`act("start", null)`);
    pages.push(P(`renderRoster()`), P(`V.sheet = NX("Blades"); var __h = renderSheet(NX("Blades")); V.sheet = null; __h`), P(`V.menu = true; var __m = renderMenu(); V.menu = false; __m`));
    check("smoke: ... markup in an escort squadron's tag is printed as text on every screen, never as markup",
          pages.every(h => h.indexOf("<img") < 0) && pages[1].indexOf("&lt;img") >= 0,
          pages.map(h => (h.match(/.{0,40}<img.{0,40}/) || [""])[0]).join(" | "));
  });

  /* ---------- Rulebook p. 57: a failed disengage leaves the squadron --- */
  guard("a failed disengage in a squadron", () => {
    const pg = open(), P = pg.P;
    const L = pg.DATA.lists.find(x => /^Imperial Navy . Gothic Sector$/.test(x.nm));
    const lun = name => Object.assign(saved(L, /^Cruisers$/, /^Lunar class cruiser$/, 1, name), { sq: "C" });
    pg.ctx.__doc = { ln: L.nm, limit: 9000, units: [lun("Alpha"), lun("Beta")] };
    P(`newGame(resolveFleet(__doc)); U.forEach((x, i) => setLd(i, 8)); act("start", null);
       var NX = n => U.findIndex(x => x.u.name === n);`);
    const beta = P(`NX("Beta")`);
    /* the Actions helper's call (ship-actions.js), as a browser runs it */
    pg.bare(`GFP.act("disengage", ${beta}, { ok: false, ms: [${beta}] })`);
    /* p. 57: a capital ship in a squadron that fails "falls out of the
       squadron and may not attempt to re-join it" */
    check("smoke: a capital ship that fails to disengage falls out of its squadron, the page run as in a browser (Rulebook p. 57)",
          P(`G.grp[NX("Beta")] === null && G.grp[NX("Alpha")] === "C"`) === true, P(`JSON.stringify(G.grp)`));
  });

  /* ------------- T46: a failed Disengage takes a capital ship out --- */
  /* The ruling, RULINGS.md T46 from Rulebook p. 57: Disengage "failed sets
     no-fire and takes a capital ship out of its squadron"; an escort
     squadron is not taken apart. Through the ship's Actions, as the taps go.
     In Chrome the cruiser's case threw "isEscGrp is not defined" (actions.js
     had no import), and no check ran that line. */
  guard("a failed Disengage", () => {
    const pg = open(), P = pg.P;
    const L = pg.DATA.lists.find(x => /^Imperial Navy . Gothic Sector$/.test(x.nm));
    const lun = name => Object.assign(saved(L, /^Cruisers$/, /^Lunar class cruiser$/, 1, name), { sq: "C" });
    const swd = name => Object.assign(saved(L, /^ESCORTS$/, /^Sword class frigate$/, 3, name), { sq: "E" });
    pg.ctx.__doc = { ln: L.nm, limit: 9000, units: [lun("Alpha"), lun("Beta"), swd("Blades"), swd("Edges")] };
    P(`newGame(resolveFleet(__doc)); V.screen = "setup"; save(); render();
       var NX = n => U.findIndex(x => x.u.name === n);
       var EL = (i, a) => ({ getAttribute: k => k === "data-i" ? String(i) : k === "data-arg" ? a : null, value: "" });
       var FAIL = i => { shipAct("actions", EL(i, null)); shipAct("actab", EL(null, "dis")); shipAct("acdis", EL(null, "fail")); shipAct("acclose", EL(null, null)); };
       U.forEach((x, i) => { if(x.R.kind === "ship" && G.st[i].ld == null) setLd(i, 8); }); act("start", null);`);
    const g0 = JSON.parse(P(`JSON.stringify(["Alpha", "Beta", "Blades", "Edges"].map(n => G.grp[NX(n)]))`) || "[]");
    check("smoke: the two tagged cruisers start as one squadron, the two tagged Sword cards as one escort squadron (J222)",
          g0[0] != null && g0[0] === g0[1] && /^e:/.test(String(g0[2])) && g0[2] === g0[3], JSON.stringify(g0));
    P(`FAIL(NX("Alpha"))`);
    const a = JSON.parse(P(`JSON.stringify({ grp: [G.grp[NX("Alpha")], G.grp[NX("Beta")]], st: [G.st[NX("Alpha")]].map(s => ({ nofire: !!s.noOrdersTurn, gone: !!s.disengaged })) })`) || "{}");
    check("smoke: a cruiser that fails to disengage falls out of its squadron, no fire this turn, still on the table; the other stays in (Rulebook p. 57, T46)",
          !!a.grp && a.grp[0] == null && a.grp[1] === g0[1] && a.st[0].nofire && !a.st[0].gone, JSON.stringify(a));
    P(`FAIL(NX("Blades"))`);
    const e = JSON.parse(P(`JSON.stringify([G.grp[NX("Blades")], G.grp[NX("Edges")]])`) || "[]");
    check("smoke: ... an escort squadron that fails stays one squadron (p. 57, T46)", e[0] === g0[2] && e[1] === g0[2], JSON.stringify(e));
  });

  /* ------------ J233: every Ork Warlord aboard a ship of his own (T43) --- */
  guard("the Clanz Warlords", () => {
    const pg = open(), P = pg.P;
    const L = pg.DATA.lists.find(x => /^Orks . Da Ork Clanz$/.test(x.nm));
    /* three Warlords (uid) and their skwadrons (cmd, docs/save-format.md); the 3rd
       Warlord has only escorts, so his ship is a squadron */
    const wl = uid => Object.assign(saved(L, /^WARLORD$/, /^Ork Warlord$/), { uid: uid });
    const sk = (sec, re, n, name, cmd) => Object.assign(saved(L, sec, re, n, name), { cmd: cmd });
    pg.ctx.__doc = { ln: L.nm, limit: 1500, units: [
      wl("w1"), sk(/Uge ship skwadron$/, /^Hammer class/, 1, "Smasha", "w1"), sk(/^Tiddla skwadron$/, /^Brute/, 3, "Brutes", "w1"),
      wl("w2"), sk(/^Big ship skwadron$/, /^Terror ship$/, 1, "Terra", "w2"), sk(/^Tiddla skwadron$/, /^Savage/, 3, "Savages", "w2"),
      wl("w3"), sk(/^Tiddla skwadron$/, /^Ravager/, 3, "Ravagers", "w3"), sk(/^Tiddla skwadron$/, /^Onslaught/, 3, "Onslaughts", "w3")] };
    P(`newGame(resolveFleet(__doc)); V.screen = "setup"; save(); render();
       var NX = n => U.findIndex(x => x.u.name === n), WL = U.map((x, i) => x.R.kind === "commander" ? i : -1).filter(i => i >= 0);`);
    /* Fleets p. 374: "He must be embarked on the most expensive ship under
       his own command (as opposed to the whole fleet), even if it is an
       escort"; Rulebook p. 123: "Assign the Fleet Commander(s) to their
       ship(s)" */
    const at = P(`JSON.stringify(WL.map(j => j === G.cmd ? G.flag : (G.on || {})[j]))`);
    const want = P(`JSON.stringify([NX("Smasha"), NX("Terra"), NX("Ravagers")])`);
    check("smoke: every Clanz Warlord starts aboard the dearest ship of his own command, an escort squadron too (Fleets p. 374, T43)", at === want, at + " vs " + want);
    const setup = P(`renderSetup()`);
    clean("the Clanz set-up screen", setup);
    check("smoke: ... the set-up shows each Warlord's ship", ["Smasha", "Terra", "Ravagers"].every(n => strip(setup).indexOf("aboard " + n) >= 0), strip(setup).slice(0, 400));
    /* J235: a grey Start says why - each ship without its Ld, a tap away -
       and the squadron switch is a pill of its own, not an Ld tile */
    check("smoke: a grey Start names every ship still without its Ld (J235)",
          /class="why"/.test(setup) && (setup.match(/data-act="seek"/g) || []).length === 6 && (setup.match(/class="setrow need"/g) || []).length === 6,
          (setup.match(/data-act="seek"/g) || []).length + " seek");
    check("smoke: ... the SQN switch is a pill under the name, not among the Ld tiles (J235)",
          /class="sqb"[^>]*>\+ SQN</.test(setup) && !/class="sq /.test(setup));
    P(`U.forEach((x, i) => { if(x.R.kind === "ship" && G.st[i].ld == null) setLd(i, 7); }); act("start", null);`);
    clean("the Clanz roster", P(`renderRoster()`));
    check("smoke: ... no Warlord is left floating: none has a row of his own in the game", P(`WL.every(j => renderRow(j, false) === "")`) === true);
    check("smoke: ... each Warlord rides on his ship's card with his own re-roll boxes",
          P(`[NX("Smasha"), NX("Terra"), NX("Ravagers")].every((s, k) => renderRow(s, false).indexOf('data-act="rrbox" data-i="' + (k ? WL[k] : -1) + '"') >= 0 || renderRow(s, false).indexOf('data-act="rrbox" data-i="' + WL[k] + '"') >= 0)`) === true,
          strip(P(`renderRow(NX("Terra"), false)`)).slice(0, 300));
    check("smoke: ... a W tag on a ship tells whose re-rolls it may use (Fleets p. 374)",
          /\bW2\b/.test(strip(P(`renderRow(NX("Savages"), false)`))) && /\bW3\b/.test(strip(P(`renderRow(NX("Onslaughts"), false)`))));
    P(`act("crit", NX("Terra"), "9")`);
    check("smoke: ... Bridge Smashed on Warlord 2's ship loses his re-rolls only (p. 67, T43)",
          P(`G.st[WL[1]].rerollsLost === true && !G.fleet.rerollsLost && !G.st[WL[2]].rerollsLost`) === true,
          P(`JSON.stringify([G.st[WL[1]].rerollsLost, G.fleet.rerollsLost, G.st[WL[2]].rerollsLost])`));
    P(`act("critminus", NX("Terra"), "9")`);
    check("smoke: ... and a mis-tapped 9 taken off gives them back", P(`!G.st[WL[1]].rerollsLost`) === true);
    /* a game saved before J233 had no G.on */
    P(`delete G.on; save(); resumeGame(loadPlay());`);
    check("smoke: ... a game saved before J233 gets its Warlords aboard when it is resumed", P(`!!G.on && G.on[WL[1]] === NX("Terra") && G.on[WL[2]] === NX("Ravagers")`) === true, P(`JSON.stringify(G.on)`));
  });

  /* ------------------------------------------------ Eldar: the Haven --- */
  guard("the Eldar fleet", () => {
    const pg = open(), P = pg.P;
    const L = pg.DATA.lists.find(x => /^Eldar Corsairs . Gothic Sector$/.test(x.nm));
    pg.ctx.__doc = { ln: L.nm, limit: 9000, units: [saved(L, /^Pirate Prince$/, /./), saved(L, /^Cruisers$/, /./), saved(L, /^PLANETARY DEFENCES$/, /^Haven space station$/)] };
    P(`newGame(resolveFleet(__doc)); V.screen = "setup"; save(); render(); var HV = U.findIndex(x => /HAVEN/.test(x.R.className || ""));`);
    const setup = P(`renderSetup()`);
    clean("the Eldar set-up screen", setup);
    /* Fleets p. 334: "An Eldar Haven rolls for leadership following Eldar
       rules. An Eldar or Dark Eldar fleet commander can lead the battle
       aboard it instead of a ship." */
    check("smoke: the Haven rolls its Leadership and may carry the commander (Fleets p. 334)", new RegExp('data-act="ld" data-i="' + P(`HV`) + '"').test(setup) && new RegExp('<option value="' + P(`HV`) + '"').test(setup) && P(`G.flag !== HV`));
    P(`U.forEach((x, i) => { if(x.R.kind === "ship" && G.st[i].ld == null) setLd(i, 8); }); act("start", null); for(let k = 0; k < 4; k++) act("hit", HV);`);
    clean("the crippled Haven's row", P(`renderRow(HV, false)`));
    clean("the crippled Haven's card", P(`V.sheet = HV; V.info = true; var __h = renderSheet(HV); V.info = false; V.sheet = null; __h`));
    check("smoke: a crippled Haven shows no speed modifier and no 'disengaged' switch: it does not move (Fleets p. 334)", !/[^0-9]-5(?![0-9])/.test(strip(P(`renderRow(HV, false)`))) && !/disengaged/.test(strip(P(`V.sheet = HV; __h = renderSheet(HV); V.sheet = null; __h`))), strip(P(`renderRow(HV, false)`)).slice(0, 200));
  });

  /* --------------------------------------------- Tau: the orbitals --- */
  guard("the Tau fleet", () => {
    const pg = open(), P = pg.P;
    const L = pg.DATA.lists.find(x => /^Tau . Merchant Fleet$/.test(x.nm));
    const units = [saved(L, /^Cruisers$/, /./)].concat(defenceRows(pg, L));
    pg.ctx.__doc = { ln: L.nm, limit: 9000, units: units };
    P(`newGame(resolveFleet(__doc)); V.screen = "setup"; save(); render();`);
    clean("the Tau set-up screen", P(`renderSetup()`));
    check("smoke: the Tau orbitals need no roll: the game starts on the cruiser's alone (Fleets p. 499)", P(`(() => { setLd(0, 8); return U.every((x, i) => x.R.kind !== "ship" || G.st[i].ld != null); })()`) === true);
    P(`act("start", null)`);
    clean("the Tau roster", P(`renderRoster()`));
    for(let i = 0; i < units.length; i++) clean("the card of " + P(`unitName(${i})`), P(`V.sheet = ${i}; V.info = true; var __h = renderSheet(${i}); V.info = false; V.sheet = null; __h`));
  });

  /* ------------ T60: a mixed tiddla's clan is the whole skwadron's --- */
  guard("the Clanz mixed tiddla", () => {
    const pg = open(), P = pg.P;
    const L = pg.DATA.lists.find(x => /^Orks . Da Ork Clanz$/.test(x.nm));
    /* Evil Sunz bought on the Savage card only, as a fleet saved before
       28.10.2026 has it (docs/save-format.md: upn) */
    const sav = Object.assign(saved(L, /^Tiddla skwadron$/, /^Savage gunship$/, 3), { sq: "T", upn: { "CLAN UPGRADES\u0001Clan: Evil Sunz (Red)": "take" } });
    pg.ctx.__doc = { ln: L.nm, limit: 1000, units: [saved(L, /^WARLORD$/, /^Ork Warlord$/), sav,
      Object.assign(saved(L, /^Tiddla skwadron$/, /^Onslaught attack ship$/, 3), { sq: "T" })] };
    const got = JSON.parse(P(`(() => { const r = resolveFleet(__doc); return JSON.stringify({ sp: r.units.map(x => x.R.stats ? x.R.stats.speed : null), pts: fleetPoints(r.units) }); })()`) || "{}");
    /* Fleets p. 371: "The point cost for clan upgrades for tiddla skwadrons
       count for the whole skwadron"; "All Evil Sunz ships gain +5 cm speed";
       Savage 25 cm (p. 387), Onslaught 20 cm (p. 386); 3 x 30 + 3 x 35 + 20
       (p. 374) */
    check("smoke: a clan bought on one card of a mixed tiddla gives every card its speed, paid once (Fleets p. 371, T60)",
          !!got.sp && got.sp[1] === "30 cm" && got.sp[2] === "25 cm" && got.pts === 215, JSON.stringify(got));
  });

  /* ------- T63: Young Gunz, Mob Rule and the Ld swaps at the set-up --- */
  /* The owner's design of 4.11.2026: under Roll Ld an "Apply Young Gunz & Mob
     Rule" button, grey until every Ld is set; what changes gets a mark, and a
     changed Ld leaves its old value striped. Fleets v0.40 p. 372 (Mob Rule,
     Young Gunz), p. 374 (the tiddla list, the Warlord's swap). */
  guard("the Clanz Young Gunz and Mob Rule", () => {
    const pg = open(), P = pg.P;
    const L = pg.DATA.lists.find(x => /^Orks . Da Ork Clanz$/.test(x.nm));
    const wl = uid => Object.assign(saved(L, /^WARLORD$/, /^Ork Warlord$/), { uid: uid });
    const sk = (sec, re, n, cmd, sq) => Object.assign(saved(L, sec, re, n), { cmd: cmd }, sq ? { sq: sq } : {});
    /* W1: five Brutes (a lone tiddla) and a Kill Kroozer; W2: three Savages and
       three Onslaughts (squadron B, "in any mix desired", p. 374) and a Terror Ship */
    pg.ctx.__doc = { ln: L.nm, limit: 1000, units: [
      wl("w1"), sk(/^Tiddla skwadron$/, /^Brute/, 5, "w1", "A"), sk(/^Big ship skwadron$/, /^Kill kroozer$/, 1, "w1"),
      wl("w2"), sk(/^Tiddla skwadron$/, /^Savage/, 3, "w2", "B"), sk(/^Tiddla skwadron$/, /^Onslaught/, 3, "w2", "B"), sk(/^Big ship skwadron$/, /^Terror ship$/, 1, "w2")] };
    P(`newGame(resolveFleet(__doc)); V.screen = "setup"; save(); render();
       var BR = 1, KK = 2, W2 = 3, SV = 4, ON = 5, TS = 6;
       var DICE = a => { const q = a.map(f => (f - 0.5) / 6); Math.random = () => q.length ? q.shift() : 0; };`);
    const btn = h => (h.match(/<button[^>]*data-act="ygapply"[^>]*>[\s\S]*?<\/button>/) || [""])[0];
    const rowOf = (h, i) => { const m = h.split(/(?=<div class="setrow)/).find(s => new RegExp('^<div class="setrow[^"]*" data-u="' + i + '"').test(s)); return m || ""; };
    const pts0 = P(`fleetPoints(U)`);
    let s = P(`renderSetup()`);
    clean("the Clanz set-up before the roll", s);
    check("smoke: under Roll Ld the Apply Young Gunz & Mob Rule button, grey while an Ld is missing (owner 4.11.2026, T63)",
      /data-act="rollld"/.test(s) && /Apply Young Gunz/.test(strip(btn(s))) && /disabled/.test(btn(s)) && /when every ship has its Ld/.test(strip(btn(s))) && /4 missing/.test(strip(btn(s))) && s.indexOf('data-act="rollld"') < s.indexOf('data-act="ygapply"'),
      strip(btn(s)) || "no button");
    /* Rulebook p. 45 (D6 1 = 6) and Orks -1 (Fleets p. 360): Brutes 1 -> 5, the
       Kill Kroozer 4 -> 7, squadron B 6 -> 8, the Terror Ship 3 -> 6 */
    P(`DICE([1, 4, 6, 3]); act("rollld")`);
    check("smoke: Roll Ld guards Apply for 450 ms, so a second tap on the same place is not Apply (T63, guardUntil)", P(`(V.ygGuard || 0) - Date.now()`) > 300, P(`(V.ygGuard || 0) - Date.now()`));
    s = P(`renderSetup()`);
    clean("the Clanz set-up after the roll", s);
    /* Apply, a swap and a class change are each one UNDO step: the set-up
       offers Undo before Start, as the owner's prototype does (T63) */
    check("smoke: the set-up has Undo before Start, live once there is a step to take back (T63)",
      /<button[^>]*data-act="undo"[^>]*>/.test(s.slice(0, s.indexOf('<div class="main"'))) && !/<button[^>]*data-act="undo"[^>]*disabled/.test(s.slice(0, s.indexOf('<div class="main"'))),
      s.slice(0, s.indexOf('<div class="main"')).slice(-400));
    check("smoke: ... Roll Ld stays in place, grey, and says every ship has its Ld (T63)",
      /<button[^>]*data-act="rollld"[^>]*disabled[^>]*>[\s\S]*?every ship has its Ld/.test(s), (s.match(/<button[^>]*data-act="rollld"[\s\S]{0,200}/) || [""])[0]);
    check("smoke: ... and Apply is ready once every Ld is in: two skwadrons (Fleets p. 372)", !/disabled/.test(btn(s)) && /2 skwadrons/.test(strip(btn(s))), strip(btn(s)));
    check("smoke: the roll gave Brutes 5, the Kill Kroozer 7, squadron B 8 and the Terror Ship 6 (Rulebook p. 45, Fleets p. 360)",
      P(`[BR, KK, SV, ON, TS].map(i => G.st[i].ld).join()`) === "5,7,8,8,6", P(`[BR, KK, SV, ON, TS].map(i => G.st[i].ld).join()`));
    check("smoke: the old Young Gunz note and the tap-the-swap instruction are gone where the page applies them", !/Young Gunz: one free escort/.test(strip(s)) && !/tap the swapped values/.test(strip(s)));
    check("smoke: the Ld guide has paragraphs for Young Gunz, Mob Rule and the Warlord's swap, with their pages (T63)",
      (g => /Young Gunz \(Fleets p\. 372\)/.test(g) && /Mob Rule \(Fleets p\. 372\)/.test(g) && /Fleets p\. 374/.test(g))(strip((s.match(/<details class="ldguide"[\s\S]*?<\/details>/) || [""])[0])),
      strip((s.match(/<details class="ldguide"[\s\S]*?<\/details>/) || [""])[0]).slice(0, 300));
    /* the Warlord's swap (p. 374) on his row: W2's Terror Ship and squadron B */
    const sel = (h, i) => (h.match(new RegExp('<select[^>]*data-sel="swap"[^>]*data-i="' + i + '"[\\s\\S]*?</select>')) || [""])[0];
    check("smoke: each Warlord's row has a Swap Ld select whose options name the effect (Fleets p. 374)",
      /Brute Ram Ship .5: Ld 5 . 7, loses Young Gunz/.test(strip(sel(s, 0))) && /Squadron B .6: Ld 8 . 6, Young Gunz/.test(strip(sel(s, 3))), strip(sel(s, 0)) + " | " + strip(sel(s, 3)));
    P(`act("swap", W2, SV)`);
    s = P(`renderSetup()`);
    clean("the Clanz set-up after a Warlord's swap", s);
    check("smoke: the swap exchanges the two values at once: squadron B 6, the Terror Ship 8 (Fleets p. 374)", P(`[SV, ON, TS].map(i => G.st[i].ld).join()`) === "6,6,8", P(`[SV, ON, TS].map(i => G.st[i].ld).join()`));
    check("smoke: ... the old value is striped, the new one lit with a ring, and a line says why",
      /<button class="was"[^>]*data-arg="8"/.test(rowOf(s, P(`SV`))) && /class="on chg"[^>]*data-arg="6"/.test(rowOf(s, P(`SV`))) && /Ld 8 . 6: swapped with Terror Ship \(Fleets p\. 374\)/.test(strip(rowOf(s, P(`SV`)))) &&
      /Ld 6 . 8: swapped with Squadron B/.test(strip(rowOf(s, P(`TS`)))), strip(rowOf(s, P(`SV`))).slice(0, 300));
    /* Apply: Young Gunz first on the value after the swap, then Mob Rule (p. 372) */
    const undo0 = P(`UNDO.length`);
    pg.toasts.length = 0;
    P(`act("ygapply")`);
    s = P(`renderSetup()`);
    clean("the Clanz set-up after Apply", s);
    check("smoke: Apply is one UNDO step and says what it did (Fleets p. 372)", P(`UNDO.length`) === undo0 + 1 && pg.toasts.some(t => /Applied/.test(t) && /Brute/.test(t) && /p\. 372/.test(t)), JSON.stringify(pg.toasts));
    check("smoke: five Brutes on Ld 5 get a sixth, free; squadron B on Ld 6 (after the swap) a seventh, the cheapest paid for: a Savage (p. 372)",
      P(`G.st[BR].members.length`) === 6 && P(`G.st[BR].members.filter(m => m.free).length`) === 1 && P(`G.st[SV].members.length`) === 4 && P(`U.length`) === 7,
      P(`JSON.stringify([G.st[BR].members, G.st[SV].members, U.length])`));
    check("smoke: ... marks on the cards they join: +1 Brute Ram Ship, +1 Savage Gunship, +1 Ld Mob Rule",
      /\+1 Brute Ram Ship/.test(strip(rowOf(s, P(`BR`)))) && /\+1 Savage Gunship/.test(strip(rowOf(s, P(`SV`)))) && /\+1 Ld . Mob Rule/.test(strip(rowOf(s, P(`BR`)))) && /\+1 Ld . Mob Rule/.test(strip(rowOf(s, P(`SV`)))),
      strip(rowOf(s, P(`BR`))).slice(0, 300));
    check("smoke: ... the Brutes play Ld 6: 5 striped, 6 lit, \"Ld 5 -> 6: Mob Rule +1, 6 ships with the free Brute\"",
      /<button class="was"[^>]*data-arg="5"/.test(rowOf(s, P(`BR`))) && /class="on chg"[^>]*data-arg="6"/.test(rowOf(s, P(`BR`))) && /Ld 5 . 6: Mob Rule \+1, 6 ships with the free Brute \(Fleets p\. 372\)/.test(strip(rowOf(s, P(`BR`)))),
      strip(rowOf(s, P(`BR`))).slice(0, 400));
    check("smoke: ... squadron B: 8 striped, 7 lit, the swap and Mob Rule in one line",
      /class="on chg"[^>]*data-arg="7"/.test(rowOf(s, P(`SV`))) && /Ld 8 . 6: swapped with Terror Ship \(Fleets p\. 374\) . 6 . 7: Mob Rule \+1, 7 ships with the free Savage \(Fleets p\. 372\)/.test(strip(rowOf(s, P(`SV`)))),
      strip(rowOf(s, P(`SV`))).slice(0, 400));
    check("smoke: ... the button: Applied, grey, with what it did", /disabled/.test(btn(s)) && /Applied/.test(strip(btn(s))) && /\+1 Brute/.test(strip(btn(s))) && /Mob Rule on 2/.test(strip(btn(s))), strip(btn(s)));
    check("smoke: ... the fleet still costs what was paid: the free ones are 0 pts (T63)", P(`fleetPoints(U)`) === pts0, P(`fleetPoints(U)`));
    /* the mark's select: another class is a card of its own at the end, n 1, 0 pts */
    P(`act("yg", SV, "Grunt assault ship")`);
    check("smoke: a Grunt instead: a new card appended at the end, in squadron B, 0 pts; the Savages back to three",
      P(`U.length`) === 8 && P(`U[7].R.entry.label`) === "Grunt assault ship" && P(`U[7].R.points`) === 0 && P(`G.grp[7]`) === P(`G.grp[SV]`) && P(`G.st[SV].members.length`) === 3 && P(`fleetPoints(U)`) === pts0,
      P(`JSON.stringify([U.length, U[7] && U[7].R.entry.label, U[7] && U[7].R.points, G.grp, G.st[SV].members.length])`));
    s = P(`renderSetup()`);
    clean("the Clanz set-up with a free card", s);
    check("smoke: ... its own row under the skwadron's cards with the mark +1 Grunt Assault Ship",
      /\+1 Grunt Assault Ship/.test(strip(rowOf(s, 7))) && s.indexOf('data-u="7"') > s.indexOf('data-u="' + P(`ON`) + '"') && s.indexOf('data-u="7"') < s.indexOf('data-u="' + P(`TS`) + '"'), strip(rowOf(s, 7)).slice(0, 200));
    P(`act("yg", SV, "none")`);
    check("smoke: No free escort takes it away", P(`U.length`) === 7 && P(`G.st[SV].members.length`) === 3 && /Young Gunz: none taken/.test(strip(P(`renderSetup()`))), P(`U.length`));
    P(`act("yg", SV, "Savage gunship")`);
    check("smoke: ... and the Savage back", P(`G.st[SV].members.length`) === 4 && P(`U.length`) === 7);
    /* a tap is the player's value (T44): the skwadron is no longer applied */
    P(`act("ld", BR, 6)`);
    s = P(`renderSetup()`);
    check("smoke: a tap on the Brutes un-applies them: the free one off, Apply again (T63)",
      P(`G.st[BR].members.length`) === 5 && !P(`G.st[BR].mob`) && /Apply again/.test(strip(btn(s))) && /1 changed since/.test(strip(btn(s))) && !/disabled/.test(btn(s)), strip(btn(s)));
    check("smoke: ... and the line under Start names it, without blocking Start", /Young Gunz &amp; Mob Rule not applied|Young Gunz & Mob Rule not applied/.test(s) && /data-act="seek" data-i="1"/.test(s) && (s.match(/<button class="btn" data-act="start"\s*>/) || []).length === 1,
      strip(s).slice(-300));
    P(`act("ygapply")`);
    check("smoke: Apply again: Ld 6, the remembered Brute, Ld 7 to play (p. 372)", P(`G.st[BR].members.length`) === 6 && P(`PLAY.leadership(U[BR].R, G.st[BR], G.fleet).now`) === 7, P(`PLAY.leadership(U[BR].R, G.st[BR], G.fleet).now`));
    /* the game */
    P(`act("start")`);
    const rr = P(`renderRoster()`);
    clean("the Clanz roster with Young Gunz and Mob Rule", rr);
    const tile = i => strip((P(`ldTile(${i})`)));
    check("smoke: in the game the Ld tile carries it: 7, +1 mob (Fleets p. 372)", /^7 \+1 mob$/.test(tile(P(`BR`))), tile(P(`BR`)));
    check("smoke: ... squadron B too, through the squadron's Ld: 7, +1 mob", /^7 \+1 mob$/.test(strip(P(`ldTile(SV)`))), strip(P(`ldTile(SV)`)));
    check("smoke: the free one's box is dashed, \"Young Gun: free, 0 pts\", and a quiet line says it",
      /<b class="[^"]*free[^"]*"[^>]*title="Young Gun: free, 0 pts \(Fleets p\. 372\)"/.test(P(`renderRow(BR, false)`)) && /\+1 free escort: Young Gunz \(Fleets p\. 372\)/.test(strip(P(`renderRow(BR, false)`))) && /6 of 6/.test(strip(P(`renderRow(BR, false)`))),
      strip(P(`renderRow(BR, false)`)).slice(0, 300));
    check("smoke: ... the row's chip counts the ships the +1 rests on (the owner's prototype)", /mob rule \+1 . 6 ships/.test(strip(P(`renderRow(BR, false)`))) && !/add it to the Ld/.test(P(`renderRow(BR, false)`)), strip(P(`renderRow(BR, false)`)).slice(-200));
    check("smoke: the orders pop checks against it (T49): Ld 7", P(`orderLd(BR)`) === 7, P(`orderLd(BR)`));
    P(`V.actions = { i: BR, tab: "ram", size: 0, armour: 5, hits: 8, headOn: false, blast: 0, enemies: 0, celestial: false, boats: false, cat: "", res: null }`);
    check("smoke: ... and the ram's test in Actions (T46): Ld 7", /Ld 7 . 2D6, 7 or under/.test(strip(P(`renderActions()`))), strip(P(`renderActions()`)).slice(0, 300));
    P(`V.actions = null`);
    check("smoke: the sheet's LEADERSHIP has it", /LEADERSHIP 7/.test(strip(P(`V.sheet = BR; var __h = renderSheet(BR); V.sheet = null; __h`))), strip(P(`V.sheet = BR; __h = renderSheet(BR); V.sheet = null; __h`)).slice(0, 300));
    pg.toasts.length = 0;
    P(`act("kill", BR, 0)`);
    check("smoke: a kill that leaves five: the +1 is gone, Ld 6, and a toast says so (Fleets p. 372)",
      /^6 Ld 6$/.test(tile(P(`BR`))) && pg.toasts.some(t => /five left - Mob Rule's \+1 is gone, Ld 6 \(Fleets p\. 372\)/.test(t)), tile(P(`BR`)) + " " + JSON.stringify(pg.toasts));
    P(`act("undo")`);
    check("smoke: UNDO brings it back", /^7 \+1 mob$/.test(tile(P(`BR`))) && P(`PLAY.alive(G.st[BR])`) === 6, tile(P(`BR`)));
    P(`act("kill", BR, 0); act("kill", BR, 0)`);
    check("smoke: ... a revive tap is a correction: +1 again", /^7 \+1 mob$/.test(tile(P(`BR`))), tile(P(`BR`)));
    /* all six lost: the 125 paid (Rulebook p. 123) */
    P(`for(let k = 0; k < 6; k++) act("kill", BR, k)`);
    check("smoke: all six Brutes lost concede the 125 paid, not 150 (Rulebook p. 123, T63)", P(`vpOf(BR)`) === 125, P(`vpOf(BR)`));
    for(let k = 0; k < 6; k++) P(`act("undo")`);
    /* reload: the game resumes with its free escorts and Mob Rule */
    const st0 = P(`JSON.stringify(G.st)`);
    check("smoke: a reload resumes the game as it was", P(`(() => { save(); const ok = resumeGame(loadPlay()); return ok && JSON.stringify(G.st); })()`) === st0 && /^7 \+1 mob$/.test(tile(P(`BR`))), tile(P(`BR`)));
    /* Menu > Set-up: Young Gunz and the swaps are read-only, Mob Rule stays */
    P(`act("setupback")`);
    s = P(`renderSetup()`);
    clean("the Clanz set-up during the game", s);
    check("smoke: after Start: Applied, before the game; Young Gunz read-only (T63)", /Applied/.test(strip(btn(s))) && /before the game/.test(strip(btn(s))) && /taken at set-up: a Brute, free/.test(strip(rowOf(s, P(`BR`)))) && !/data-sel="yg"/.test(s), strip(btn(s)) + " | " + strip(rowOf(s, P(`BR`))).slice(0, 200));
    check("smoke: ... the swaps too", /<select[^>]*data-sel="swap"[^>]*disabled/.test(s));
    /* T63 decision 9: a Warlord who changes ship after Start would end his
       swap and put the values back: a move of a Warlord with a swap is not
       taken (his Aboard select is read-only, checked below) */
    const ld0 = P(`JSON.stringify([G.st.map(x => x.ld), G.st[3].swap, (G.on || {})[3]])`);
    P(`act("on", W2, ON)`);
    check("smoke: ... a move of that Warlord after Start is not taken: the swap and every Ld stay (Rulebook p. 123, T63 decision 9)", P(`JSON.stringify([G.st.map(x => x.ld), G.st[3].swap, (G.on || {})[3]])`) === ld0, [ld0, P(`JSON.stringify([G.st.map(x => x.ld), G.st[3].swap, (G.on || {})[3]])`)]);
    /* the lit tile is the value the skwadron plays at (7: 6 and Mob Rule's
       +1); a tap on it is that value - Mob Rule off until Apply Mob Rule, the
       free Brute staying (Young Gunz was before the game) */
    const lit = +((rowOf(s, P(`BR`)).match(/class="on[^"]*"[^>]*data-arg="(\d+)"/) || [])[1]);
    P(`act("ld", BR, ${lit})`);
    s = P(`renderSetup()`);
    check("smoke: after Start a tap on the lit tile plays the value tapped, not one more (T63)", lit === 7 && P(`skwLd(BR).now`) === lit && P(`G.st[BR].members.length`) === 6 && /Apply Mob Rule/.test(strip(btn(s))),
      [lit, P(`skwLd(BR).now`), P(`G.st[BR].members.length`), strip(btn(s))]);
    P(`act("ygapply")`);
    check("smoke: ... Apply Mob Rule: 7 and the +1, the free Brute still there", P(`skwLd(BR).now`) === 8 && P(`G.st[BR].members.length`) === 6, P(`skwLd(BR).now`));
    P(`act("start")`);
  });

  /* ------- T63: a lone tiddla's free escort of another class ---------- */
  guard("the Clanz lone tiddla's free card", () => {
    const pg = open(), P = pg.P;
    const L = pg.DATA.lists.find(x => /^Orks . Da Ork Clanz$/.test(x.nm));
    /* five Savages with no letter: Grunt, Savage or Brute (p. 372); a Grunt is a
       card of its own, and the two share a letter so the skwadron's clan covers
       it ("for the whole skwadron (regardless of how large it is!)", p. 371) */
    const sav = Object.assign(saved(L, /^Tiddla skwadron$/, /^Savage/, 5), { upn: { "CLAN UPGRADES\u0001Clan: Evil Sunz (Red)": "take" } });
    pg.ctx.__doc = { ln: L.nm, limit: 1000, units: [saved(L, /^WARLORD$/, /^Ork Warlord$/), sav, saved(L, /^Big ship skwadron$/, /^Kill kroozer$/)] };
    P(`newGame(resolveFleet(__doc)); V.screen = "setup"; save(); render(); setLd(1, 6); setLd(2, 7); act("ygapply"); act("yg", 1, "Grunt assault ship");`);
    check("smoke: a Grunt for a lone Savage tiddla: an appended card, n 1, 0 pts, one letter for both (T60, T63)",
      P(`U.length`) === 4 && P(`U[3].R.points`) === 0 && /^e:/.test(String(P(`G.grp[1]`))) && P(`G.grp[3]`) === P(`G.grp[1]`) && P(`U[1].R.points`) === 170,
      P(`JSON.stringify([U.length, U[3] && U[3].R.points, G.grp, U[1].R.points])`));
    /* "All Evil Sunz ships gain +5 cm speed" (p. 371); a Grunt is 25 cm (p. 390) */
    check("smoke: ... the clan covers it: Evil Sunz +5 cm on the free Grunt, 30 cm (Fleets pp. 371, 390)", P(`U[3].R.stats.speed`) === "30 cm", P(`U[3].R.stats.speed`));
    check("smoke: ... six ships with the free one: Mob Rule on, Ld 6 plays 7 (p. 372)", P(`PLAY.squadronLd([1, 3].map(j => ({ R: U[j].R, st: G.st[j] })), G.fleet).now`) === 7);
    clean("the set-up with a lone tiddla's free card", P(`renderSetup()`));
    P(`act("start")`);
    clean("the roster with a lone tiddla's free card", P(`renderRoster()`));
    check("smoke: the roster draws them as one escort squadron of six", /Escort squadron . .6 of 6/.test(strip(P(`renderRoster()`))), strip(P(`renderRoster()`)).slice(0, 300));
    check("smoke: resume works with the appended card: the roster and the state are the same", P(`(() => { const before = JSON.stringify(G.st); save(); return resumeGame(loadPlay()) && U.length === 4 && JSON.stringify(G.st) === before; })()`) === true);
    P(`act("setupback")`);
    check("smoke: after Start the free card stays: Young Gunz is read-only", P(`(() => { act("ld", 1, 7); return U.length; })()`) === 4);
    /* UNDO of the step that appended the free card: U, G.st and G.doc back together, the fleet resolution re-made (T63) */
    { const pg4 = open(), P4 = pg4.P; pg4.ctx.__doc = { ln: L.nm, limit: 1000, units: [saved(L, /^WARLORD$/, /^Ork Warlord$/), saved(L, /^Tiddla skwadron$/, /^Savage/, 5), saved(L, /^Big ship skwadron$/, /^Kill kroozer$/)] };
      P4(`newGame(resolveFleet(__doc)); V.screen = "setup"; save(); render(); setLd(1, 6); setLd(2, 7); act("ygapply"); act("yg", 1, "Grunt assault ship");`);
      const mid = P4(`U.length`); P4(`act("undo")`);
      check("smoke: UNDO of the free Grunt: U, G.st and G.doc back to 3 (T63)", mid === 4 && P4(`U.length`) === 3 && P4(`G.st.length`) === 3 && P4(`G.doc.units.length`) === 3, P4(`JSON.stringify([U.length, G.st.length, G.doc.units.length])`));
      clean("the set-up after UNDO of a free card", P4(`renderSetup()`)); }
    /* a reload before Start is still the set-up: Young Gunz and the swaps are
       locked only once Start is tapped (T63 decision 9); a record saved before
       T63 (no started field) resumes as a game under way, as before */
    { const pg5 = open(), P5 = pg5.P; pg5.ctx.__doc = { ln: L.nm, limit: 1000, units: [saved(L, /^WARLORD$/, /^Ork Warlord$/), saved(L, /^Tiddla skwadron$/, /^Savage/, 5), saved(L, /^Big ship skwadron$/, /^Kill kroozer$/)] };
      P5(`newGame(resolveFleet(__doc)); V.screen = "setup"; render(); setLd(1, 6); setLd(2, 7); save();`);
      const pg6 = open(pg5.store), P6 = pg6.P;
      check("smoke: a reload before Start opens the set-up again, the game not started (T63 decision 9)", P6(`[V.screen, !!G.started].join()`) === "setup,false", P6(`[V.screen, G.started].join()`));
      P6(`act("ygapply")`);
      check("smoke: ... and Apply still takes Young Gunz there: six Savages (Fleets p. 372)", P6(`G.st[1].members.length`) === 6, P6(`G.st[1].members.length`));
      const pg7 = open(pg5.store), P7 = pg7.P;
      P7(`V.screen = "load"; (() => { const el = { disabled: false, getAttribute: k => k === "data-act" ? "resume" : null, hasAttribute: () => false, getBoundingClientRect: () => ({ top: 0, height: 0 }), classList: { contains: () => false } }; el.closest = q => q === "[data-act]" ? el : null; __fire("click", { target: el, preventDefault(){} }); })()`);
      check("smoke: ... Resume game does the same: the set-up, not started", P7(`[V.screen, !!G.started].join()`) === "setup,false", P7(`[V.screen, G.started].join()`));
      const old = Object.assign({}, pg5.store), k = Object.keys(old).find(n => { try{ return Array.isArray(JSON.parse(old[n]).st); }catch(e){ return false; } });
      const g0 = JSON.parse(old[k]); delete g0.started; old[k] = JSON.stringify(g0);
      const pg8 = open(old), P8 = pg8.P;
      check("smoke: ... a record with no started field resumes on the roster, started, as before", P8(`[V.screen, !!G.started].join()`) === "roster,true", P8(`[V.screen, G.started].join()`)); }
    /* the opponent's phone draws the free card (peer.js re-resolves on the document) */
    const snap = P(`JSON.stringify({ t: "g", n: "Rival", G: G, opt: {}, scr: "roster" })`);
    const pg2 = open(), P2 = pg2.P;
    pg2.ctx.__mine = { ln: L.nm, limit: 1000, units: [saved(L, /^Big ship skwadron$/, /^Kill kroozer$/)] };
    pg2.ctx.__snap = JSON.parse(snap);
    pg2.ctx.__snap0 = JSON.parse(snap);
    pg2.ctx.__snap0.G.doc.units = pg2.ctx.__snap0.G.doc.units.slice(0, 3); pg2.ctx.__snap0.G.st = pg2.ctx.__snap0.G.st.slice(0, 3); pg2.ctx.__snap0.G.grp = pg2.ctx.__snap0.G.grp.slice(0, 3);
    P2(`newGame(resolveFleet(__mine)); setLd(0, 8); act("start", null); takeSnapshot(__snap0); takeSnapshot(__snap); V.side = "peer";`);
    const their = P2(`renderPeerSide()`);
    check("smoke: the opponent's phone draws the free card the second snapshot added (G.doc fingerprint)", !/could not be drawn/.test(their) && P2(`P.U.length`) === 4 && /Free Grunt/i.test(strip(their)), strip(their).slice(0, 300));
  });

  /* ---- T63: Mob Rule only for an Ork tiddla, swaps of the battleships --- */
  guard("Mob Rule's gate and the battleships' swap", () => {
    const pg = open(), P = pg.P;
    const L = pg.DATA.lists.find(x => /^Orks . Da Ork Clanz$/.test(x.nm));
    /* six one-hit platforms are no Ork escort skwadron (today's chip showed on them) */
    pg.ctx.__doc = { ln: L.nm, limit: 2000, units: [saved(L, /^WARLORD$/, /^Ork Warlord$/), saved(L, /^PLANETARY DEFENCES$/, /^Orbital defence laser platform$/, 6), saved(L, /^Big ship skwadron$/, /^Kill kroozer$/)] };
    P(`newGame(resolveFleet(__doc)); setLd(2, 7); act("start");`);
    check("smoke: six Orbital defence laser platforms get no mob rule chip and stay Ld 7 (Rulebook p. 100)", !/mob rule/i.test(strip(P(`renderRow(1, false)`))) && /^7 /.test(strip(P(`ldTile(1)`))), strip(P(`renderRow(1, false)`)).slice(0, 200));
    /* Waaagh!: a Hammer's swap select, no Apply (Clanz only, Fleets p. 370) */
    const W = pg.DATA.lists.find(x => /^Orks . Waaagh!$/.test(x.nm));
    pg.ctx.__w = { ln: W.nm, limit: 2000, units: [saved(W, /^WARLORD$/, /^Ork Warlord$/), saved(W, /^BATTLESHIPS/, /^Hammer/), saved(W, /^KROOZERS$/, /^Kill kroozer$/), saved(W, /^KROOZERS$/, /^Terror ship$/), saved(W, /^ESCORTS$/, /^Brute/, 6)] };
    P(`newGame(resolveFleet(__w)); V.screen = "setup"; [1, 2, 3, 4].forEach((i, k) => setLd(i, [6, 8, 7, 5][k])); render();`);
    let s = P(`renderSetup()`);
    clean("the Waaagh! set-up with a battleship", s);
    check("smoke: Waaagh!: no Apply button, Roll Ld goes away as before (T44), the battleship has a Swap Ld select (pp. 376-381)",
      !/data-act="ygapply"/.test(s) && !/data-act="rollld"/.test(s) && /<select[^>]*data-sel="swap"[^>]*data-i="1"/.test(s), strip(s).slice(0, 300));
    check("smoke: ... its options are the Kill Kroozer and the Terror Ship, not the Brutes (p. 376)",
      /Kill Kroozer: Ld 8 . 6/.test(strip(s)) && /Terror Ship: Ld 7 . 6/.test(strip(s)) && !/<option value="4"/.test((s.match(/<select[^>]*data-sel="swap"[\s\S]*?<\/select>/) || [""])[0]), strip((s.match(/<select[^>]*data-sel="swap"[\s\S]*?<\/select>/) || [""])[0]));
    P(`act("swap", 1, 2)`);
    check("smoke: ... chosen: the Hammer 8, the Kill Kroozer 6; no swap puts them back", P(`[G.st[1].ld, G.st[2].ld].join()`) === "8,6" && P(`(() => { act("swap", 1, null); return [G.st[1].ld, G.st[2].ld].join(); })()`) === "6,8");
    P(`act("swap", 1, 2); act("ld", 2, 9)`);
    check("smoke: ... a tap on either value ends the swap: the Kill Kroozer 9, the Hammer keeps 8 (T63)", P(`[G.st[1].ld, G.st[2].ld, G.st[1].swap == null].join()`) === "8,9,true", P(`JSON.stringify([G.st[1], G.st[2].ld])`).slice(0, 200));
    P(`act("start")`);
    check("smoke: Waaagh! Brutes: no +1, Mob Rule is a Clanz rule (Fleets p. 370)", /^5 /.test(strip(P(`ldTile(4)`))) && !/mob/i.test(strip(P(`renderRow(4, false)`))), strip(P(`ldTile(4)`)));
    /* a Blood Axe tiddla with commandeered escorts rolls its one Ld (Rulebook
       p. 45) on the Ork table, "all Ork ships reduce their Leadership by -1"
       (Fleets p. 360), even with a Cobra as its first card (T63); its free
       escort is an Ork class within the cheapest paid for (p. 372) */
    pg.ctx.__ba = { ln: L.nm, limit: 1000, units: [saved(L, /^WARLORD$/, /^Ork Warlord$/),
      Object.assign(saved(L, /^BLOOD AXE COMMANDEERED ESCORTS$/, /^Cobra/, 3), { sq: "X" }), Object.assign(saved(L, /^Tiddla skwadron$/, /^Brute/, 3), { sq: "X" })] };
    P(`newGame(resolveFleet(__ba)); V.screen = "setup"; Math.random = () => 0; act("rollld");`);
    check("smoke: a Blood Axe tiddla, its Cobras first, rolls a D6 of 1 as Ld 5 on the Ork table (Rulebook p. 45, Fleets p. 360)", P(`[G.st[1].ld, G.st[2].ld].join()`) === "5,5", P(`[G.st[1].ld, G.st[2].ld, G.st[1].ldWhy].join(" | ")`));
    P(`act("ygapply")`);
    check("smoke: ... six models with its Cobras: Young Gunz gives a free Brute (25, the cheapest paid for), seven ships, Ld 6 (p. 372)",
      P(`G.st[2].members.length`) === 4 && P(`G.st[1].members.length`) === 3 && P(`skwLd(1).now`) === 6, P(`JSON.stringify([G.st[1].members.length, G.st[2].members.length, skwLd(1).now])`));
    /* "the skwadron cannot exceed ten escorts" (p. 372): ten Brutes on Ld 5 get
       no free one, but Mob Rule's +1 */
    pg.ctx.__ten = { ln: L.nm, limit: 1000, units: [saved(L, /^WARLORD$/, /^Ork Warlord$/), saved(L, /^Tiddla skwadron$/, /^Brute/, 10)] };
    P(`newGame(resolveFleet(__ten)); V.screen = "setup"; setLd(1, 5); act("ygapply");`);
    check("smoke: ten Brutes on Ld 5: no free escort, Mob Rule Ld 6 (p. 372)", P(`G.st[1].members.length`) === 10 && P(`U.length`) === 2 && P(`skwLd(1).now`) === 6, P(`JSON.stringify([G.st[1].members.length, skwLd(1).now])`));
    /* the order of the swaps is the page's: a battleship's first (pp. 376-381,
       "When Leadership values are generated"), then the Warlord's (p. 374) */
    { const pg2 = open(), P2 = pg2.P; const wl = Object.assign(saved(L, /^WARLORD$/, /^Ork Warlord$/), { uid: "w1" }); const c = (sec, re, n) => Object.assign(saved(L, sec, re, n), { cmd: "w1" });
      pg2.ctx.__doc = { ln: L.nm, limit: 2000, units: [wl, c(/Uge ship skwadron$/, /^Hammer/), c(/^Big ship skwadron$/, /^Kill kroozer$/), c(/^Tiddla skwadron$/, /^Brute/, 5)] };
      P2(`newGame(resolveFleet(__doc)); V.screen = "setup"; G.flag = 2; setLd(1, 6); setLd(2, 8); setLd(3, 5); render(); act("swap", 0, 3); act("swap", 1, 2);`);
      check("smoke: the Hammer's swap (p. 376) comes before the Warlord's (p. 374), whatever order they were chosen in: the Brutes on the Hammer's 6 (Rulebook p. 123, T63 decision 5)", P2(`G.st[3].ld`) === 6, P2(`JSON.stringify(G.st.map(s => s.ld))`)); }
    /* a swap after Apply un-applies what it touches */
    { const pg3 = open(), P3 = pg3.P; const btnOf = h => (h.match(/<button[^>]*data-act="ygapply"[^>]*>[\s\S]*?<\/button>/) || [""])[0];
      pg3.ctx.__s = { ln: L.nm, limit: 2000, units: [Object.assign(saved(L, /^WARLORD$/, /^Ork Warlord$/), { uid: "w1" }), Object.assign(saved(L, /^Big ship skwadron$/, /^Kill kroozer$/), { cmd: "w1" }), Object.assign(saved(L, /^Tiddla skwadron$/, /^Brute/, 5), { cmd: "w1" })] };
      P3(`newGame(resolveFleet(__s)); V.screen = "setup"; G.flag = 1; setLd(1, 7); setLd(2, 5); render(); act("ygapply");`);
      const pre = P3(`G.st[2].members.length`); P3(`act("swap", 0, 2)`);
      check("smoke: a swap after Apply lifts the Brutes to 7: Young Gunz off (\"Ld of 5 or 6\", p. 372), the skwadron un-applied, Apply again (T63)", pre === 6 && P3(`G.st[2].ld`) === 7 && P3(`G.st[2].members.length`) === 5 && !P3(`G.st[2].mob`) && /Apply again/.test(strip(btnOf(P3(`renderSetup()`))))); }
    /* a kroozer a battleship swapped with is still a Warlord's to take, when
       it is under his command ("any one ship or escort squadron under his
       command", p. 374): the swaps chain (T63 decision 5) */
    { const pg9 = open(), P9 = pg9.P; const u = (sec, re, n, more) => Object.assign(saved(L, sec, re, n), more);
      pg9.ctx.__d = { ln: L.nm, limit: 2000, units: [u(/^WARLORD$/, /^Ork Warlord$/, 1, { uid: "w1" }), u(/Uge ship skwadron$/, /^Hammer/, 1, { cmd: "w1" }),
        u(/^WARLORD$/, /^Ork Warlord$/, 1, { uid: "w2" }), u(/^Big ship skwadron$/, /^Kill kroozer$/, 1, { cmd: "w2" }), u(/^Big ship skwadron$/, /^Terror ship$/, 1, { cmd: "w2" }), u(/^Tiddla skwadron$/, /^Savage/, 3, { cmd: "w2" })] };
      P9(`newGame(resolveFleet(__d)); V.screen = "setup"; G.on = G.on || {}; G.on[2] = 4; setLd(1, 8); setLd(3, 6); setLd(4, 7); setLd(5, 7); render(); act("swap", 1, 3);`);
      const w2 = (P9(`renderSetup()`).match(/<select[^>]*data-sel="swap"[^>]*data-i="2"[\s\S]*?<\/select>/) || [""])[0];
      check("smoke: after the Hammer's swap with the Kill Kroozer, a Warlord who commands that Kill Kroozer is still offered it (Fleets p. 374, T63 decision 5)", /<option value="3"/.test(w2) && P9(`G.st[3].ld`) === 8, strip(w2)); }
    /* the Warlord aboard a tiddla: the option and the line under the select
       name what the swap does to his own skwadron too ("even if it is an
       escort", p. 374) */
    { const pg10 = open(), P10 = pg10.P; const u = (sec, re, n, more) => Object.assign(saved(L, sec, re, n), more);
      pg10.ctx.__d = { ln: L.nm, limit: 2000, units: [u(/^WARLORD$/, /^Ork Warlord$/, 1, { uid: "w1" }), u(/^Tiddla skwadron$/, /^Ravager/, 3, { cmd: "w1" }), u(/^Tiddla skwadron$/, /^Brute/, 5, { cmd: "w1" })] };
      P10(`newGame(resolveFleet(__d)); V.screen = "setup"; G.flag = 1; setLd(1, 5); setLd(2, 8); render();`);
      const sel0 = strip((P10(`renderSetup()`).match(/<select[^>]*data-sel="swap"[^>]*data-i="0"[\s\S]*?<\/select>/) || [""])[0]);
      check("smoke: the Warlord aboard Ravagers on Ld 5: the option says the Brutes gain Young Gunz and the Ravagers lose it (Fleets pp. 372, 374)", /Brute Ram Ship .5: Ld 8 . 5, Young Gunz, Ravager[^,]* loses Young Gunz/.test(sel0), sel0);
      P10(`act("swap", 0, 2)`);
      const desc = strip((P10(`renderSetup()`).match(/<div class="full pres swap">[\s\S]*?<\/div>/) || [""])[0]);
      check("smoke: ... chosen: the line under the select says it too, where a narrow select cuts the option", /Brute Ram Ship: Young Gunz/.test(desc) && /Ravager[^:]*: loses Young Gunz/.test(desc), desc); }
    /* the fleet commander's Aboard select after Start (T63 decision 9) */
    { const pg11 = open(), P11 = pg11.P;
      pg11.ctx.__d = { ln: L.nm, limit: 2000, units: [saved(L, /^WARLORD$/, /^Ork Warlord$/), saved(L, /^Tiddla skwadron$/, /^Brute/, 5), saved(L, /^Big ship skwadron$/, /^Kill kroozer$/), saved(L, /^Big ship skwadron$/, /^Kill kroozer$/)] };
      P11(`newGame(resolveFleet(__d)); V.screen = "setup"; G.flag = 2; setLd(1, 8); setLd(2, 5); setLd(3, 7); render(); act("swap", 0, 1); act("ygapply"); act("start"); act("setupback");`);
      const before = P11(`JSON.stringify([G.st.map(x => x.ld), G.flag, G.st[0].swap, skwLd(1).now])`);
      check("smoke: after Start the Warlord's Aboard select is read-only while he has a swap (T63 decision 9)", /<select[^>]*data-sel="flag"[^>]*disabled/.test(P11(`renderSetup()`)), (P11(`renderSetup()`).match(/<select[^>]*data-sel="flag"[^>]*>/) || [""])[0]);
      P11(`act("flag", null, 3)`);
      check("smoke: ... and a move is not taken: the Brutes keep Ld 5 and play 6 with their free Brute (Rulebook p. 123, T63 decision 9)", P11(`JSON.stringify([G.st.map(x => x.ld), G.flag, G.st[0].swap, skwLd(1).now])`) === before, [before, P11(`JSON.stringify([G.st.map(x => x.ld), G.flag, G.st[0].swap, skwLd(1).now])`)]); }
    /* a game saved before T63: nothing applied, the reminder as before */
    pg.ctx.__c = { ln: L.nm, limit: 1000, units: [saved(L, /^WARLORD$/, /^Ork Warlord$/), saved(L, /^Tiddla skwadron$/, /^Brute/, 6)] };
    P(`newGame(resolveFleet(__c)); setLd(1, 5); act("start"); save(); resumeGame(loadPlay());`);
    check("smoke: a game saved before: no +1 in the numbers, the reminder chip (Fleets p. 372)", /^5 /.test(strip(P(`ldTile(1)`))) && /mob rule: \+1 Ld \(6 ships\)/.test(strip(P(`renderRow(1, false)`))), strip(P(`renderRow(1, false)`)).slice(0, 300));
    P(`act("setupback")`);
    const b2 = (P(`renderSetup()`).match(/<button[^>]*data-act="ygapply"[^>]*>[\s\S]*?<\/button>/) || [""])[0];
    check("smoke: ... its set-up after Start offers Apply Mob Rule only: Young Gunz was before the game", /Apply Mob Rule/.test(strip(b2)) && /Young Gunz was before the game/.test(strip(b2)) && !/disabled/.test(b2), strip(b2));
    P(`act("ygapply")`);
    check("smoke: ... applied: +1 in the numbers, no free escort", /^6 \+1 mob$/.test(strip(P(`ldTile(1)`))) && P(`G.st[1].members.length`) === 6 && P(`U.length`) === 2, strip(P(`ldTile(1)`)));
  });

  /* -- T42 (user 4.11.2026): a mixed tiddla is one squadron in the game -- */
  guard("the Clanz mixed tiddla in the game", () => {
    const pg = open(), P = pg.P;
    const L = pg.DATA.lists.find(x => /^Orks . Da Ork Clanz$/.test(x.nm));
    const sq = (u, tag) => Object.assign(u, { sq: tag });
    /* Fleets p. 374: "Tiddla skwadron 3-10 Escorts, chosen from the
       following list in any mix desired"; p. 371: "A Blood Axe tiddla
       skwadron of at least six escorts may include up to three Imperial Navy
       and/or Chaos escorts" - T is three Ravagers and three Brutes, A three
       Savages and three commandeered Cobras, the Onslaughts a card alone */
    pg.ctx.__doc = { ln: L.nm, limit: 1500, units: [saved(L, /^WARLORD$/, /^Ork Warlord$/),
      sq(saved(L, /^Tiddla skwadron$/, /^Ravager attack ship$/, 3, "Rav"), "T"),
      sq(saved(L, /^Tiddla skwadron$/, /^Brute ramship$/, 3, "Bru"), "T"),
      Object.assign(saved(L, /^Tiddla skwadron$/, /^Savage gunship$/, 3, "Sav"), { sq: "A", upn: { "CLAN UPGRADES\u0001Clan: Blood Axes (Green)": "take" } }),
      sq(saved(L, /^BLOOD AXE COMMANDEERED ESCORTS$/, /^Cobra class destroyer$/, 3, "Cob"), "A"),
      saved(L, /^Tiddla skwadron$/, /^Onslaught attack ship$/, 3, "Ons")] };
    P(`newGame(resolveFleet(__doc)); V.screen = "setup"; save(); render(); var NX = n => U.findIndex(x => x.u.name === n);`);
    const NAMES = ["Rav", "Bru", "Sav", "Cob", "Ons"];
    const grp = JSON.parse(P(`JSON.stringify(${JSON.stringify(NAMES)}.map(n => G.grp[NX(n)]))`) || "[]");
    check("smoke: the cards of one tiddla letter are one squadron, a Blood Axe tiddla's commandeered escorts in it, a card without a letter alone (Fleets pp. 371, 374, T42)",
          grp[0] != null && grp[0] === grp[1] && grp[2] != null && grp[2] === grp[3] && grp[0] !== grp[2] && grp[4] == null, JSON.stringify(grp));
    /* Rulebook p. 45: Leadership is rolled "per escort squadron" */
    const ld = P(`(() => { const r = ldRollers().map(i => U[i].u.name); setLd(NX("Rav"), 6);
      return JSON.stringify([r, ${JSON.stringify(NAMES)}.map(n => G.st[NX(n)].ld)]); })()`);
    check("smoke: ... each squadron rolls one Leadership: one roll for it, and the value set on one card is on all of its cards (p. 45)",
          ld === JSON.stringify([["Rav", "Sav", "Ons"], [6, 6, null, null, null]]), ld);
    /* Fleets p. 372, Young Gunz: "Any Ork escort skwadron with a Leadership of 5 or 6" */
    /* T63: the Apply button under Roll Ld applies Young Gunz for the squadron; no note on its cards */
    const yg = (strip(P(`renderSetup()`)).match(/Young Gunz: one free escort/g) || []).length;
    check("smoke: ... Young Gunz is no note on any of its cards: Apply under Roll Ld applies it for the squadron (Fleets p. 372, T63)", yg === 0 && /data-act="ygapply"/.test(P(`renderSetup()`)), yg + " times");
    P(`U.forEach((x, i) => { if(x.R.kind === "ship" && G.st[i].ld == null) setLd(i, 7); }); act("start", null);`);
    /* Fleets p. 372, Mob Rule: "Ork escort skwadrons gain a +1 bonus to
       their Leadership while they contain more than five models" */
    const head = () => strip(P(`renderGroupHead(G.grp[NX("Rav")], groupUnits(G.grp[NX("Rav")]))`));
    const cards = () => strip(P(`renderRow(NX("Rav"), true) + renderRow(NX("Bru"), true)`));
    check("smoke: ... Mob Rule counts the skwadron: three Ravagers and three Brutes are six ships, said on the squadron's head and on neither card (Fleets p. 372)",
          /mob rule: \+1 Ld \(6 ships\)/.test(head()) && !/mob rule/i.test(cards()), head().slice(0, 200) + " | " + cards().slice(0, 120));
    P(`PLAY.killMember(G.st[NX("Rav")], 0)`);
    check("smoke: ... with one ship lost, five are not more than five: the head says 5 of 6 and no Mob Rule (Fleets p. 372)",
          /×5 of 6/.test(head()) && !/mob rule/i.test(head()), head().slice(0, 200));
  });

  /* ------------- the opponent's fleet (peer.js, user 31.10.2026) --- */
  guard("the opponent's fleet", () => {
    const pg = open(), P = pg.P;
    const ORK = pg.DATA.lists.find(x => /^Orks . Waaagh!$/.test(x.nm));
    const TAU = pg.DATA.lists.find(x => /^Tau . Merchant Fleet$/.test(x.nm));
    /* their game: an Ork cruiser with two hits, a name with markup in it */
    pg.ctx.__their = { ln: ORK.nm, limit: 1000, units: [saved(ORK, /^KROOZERS$/, /./)] };
    P(`newGame(resolveFleet(__their)); G.st[0].ld = 6; act("start", null); act("hit", 0); act("hit", 0); G.nm = ["Da <b>Kroozer</b>"];
       var __snap = JSON.parse(JSON.stringify({ t: "g", n: "Mikko", G: G, opt: { orders: true, ordnance: false, fleet: false }, scr: "roster" }));`);
    /* mine: a Tau cruiser, nothing tracked */
    pg.ctx.__mine = { ln: TAU.nm, limit: 1000, units: [saved(TAU, /^Cruisers$/, /./)] };
    P(`newGame(resolveFleet(__mine)); setLd(0, 8); act("start", null); takeSnapshot(__snap); V.side = "peer";`);
    const html = P(`renderPeerSide()`);
    clean("the opponent's side", html);
    check("smoke: their side shows their ship with their hits, read-only", /peerview/.test(html) && /Kroozer/.test(strip(html)) && (html.match(/<b class="on[^"]*" data-act="dmg"/g) || []).length === 2, strip(html).slice(0, 200));
    check("smoke: markup in a name from the other phone is dropped", !/<b>Kroozer/.test(html));
    check("smoke: their tracking switches draw their cards (orders), mine stay mine", /data-act="brace"/.test(html) && P(`OPT.orders`) === false);
    check("smoke: after drawing their side my own game is back", P(`G.ln`) === TAU.nm && P(`U.length`) === 1 && /Tau/.test(P(`renderRoster()`)) && P(`V.side`) === "peer");
    P(`V.side = "me"`);
    check("smoke: the tabs and the edge tab appear once there is an opponent", /class="sides/.test(P(`renderRoster()`)) && /class="edge r/.test(P(`renderRoster()`)));
    /* victory points (src/vp.js, user 4.11.2026): the bar's VP is a button,
       with an opponent both scores; the sheet's what-ifs and the card's
       ladder count without touching the game; a disengaged card is card B */
    const pts = P(`U[0].R.points | 0`);
    check("smoke: VP: with an opponent the bar's VP is a button with both scores", /data-act="vp"[^>]*>[\s\S]*class="me">0<[\s\S]*class="them">0</.test(P(`renderRoster()`)) && /vpbtn duo/.test(P(`renderRoster()`)));
    P(`V.vp = true`);
    const sheet = P(`renderVpSheet()`);
    clean("the VP sheet", sheet);
    check("smoke: VP: the sheet has both scores and a what-if for my ship", /You score/.test(strip(sheet)) && /data-act="vpq" data-arg="m:cr:0"/.test(sheet), strip(sheet).slice(0, 300));
    const order = (sheet.match(/data-act="vpq" data-arg="([^"]+)"/g) || []).map(s => s.replace(/.*data-arg="|"$/g, ""));
    check("smoke: VP: the first two what-ifs are always I disengage, then the enemy disengages (user 4.11.2026)", order[0] === "m:all" && order[1] === "t:all", JSON.stringify(order));
    P(`V.vpQ = { "m:cr:0": 1 }`);
    check("smoke: VP: a ticked what-if shows now -> then (crippled: 25 %, p. 123) and changes nothing in the game",
          new RegExp("0→</span>" + Math.ceil(pts * 0.25)).test(P(`renderVpSheet()`)) && P(`G.st[0].hits | 0`) === 0 && P(`vpTotal()`) === 0);
    P(`V.vp = false; V.vpQ = {}`);
    const lad = P(`renderRow(0)`);
    check("smoke: VP: the ship's card has the ladder, destroyed = its points", /data-act="vpk"/.test(lad) && new RegExp('data-arg="dd"[^>]*>destroyed<b>' + pts + "<").test(lad), strip(lad).slice(-200));
    P(`G.st[0].disengaged = true`);
    const dis = P(`renderRow(0)`);
    check("smoke: VP: a disengaged card is grey with its band and no ladder (10 %, p. 123)", /class="row [^"]*\bdis\b/.test(dis) && new RegExp("DISENGAGED[^<]*gets " + Math.ceil(pts * 0.1) + " VP").test(dis) && !/data-act="vpk"/.test(dis));
    P(`G.st[0].disengaged = false`);
    clean("the link panel", P(`renderPeerPanel()`));
    check("smoke: a room code is read typed, with spaces, lower case or from a link; I and O are not room letters", P(`JSON.stringify([parseRoom("krak"), parseRoom(" K R A K "), parseRoom("https://x/p.html#room=WAAG"), parseRoom("KIOK"), parseRoom("KRAKEN"), parseRoom("")])`) === '["KRAK","KRAK","WAAG",null,null,null]');
    check("smoke: a new room code is four room letters", /^[A-HJ-NP-Z]{4}$/.test(P(`newRoomCode()`)));
    clean("the set-up step without a room", P(`peerSetupCard()`));
    check("smoke: the set-up step offers both ways in: create a room, join with a code", /data-act="peercreate"/.test(P(`peerSetupCard()`)) && /id="peerjoin"/.test(P(`peerSetupCard()`)));
    P(`P.room = "KRAK"; P.st = "wait"; P.host = true;`);
    clean("the set-up step while waiting (host)", P(`peerSetupCard()`));
    clean("the room panel while waiting (host)", P(`renderPeerPanel()`));
    check("smoke: the host's step says the code and what to tell the other player; the panel adds the QR code", /<b>KRAK<\/b>/.test(P(`peerSetupCard()`)) && /tap Join, type KRAK/.test(strip(P(`peerSetupCard()`))) && !/qrsvg/.test(P(`peerSetupCard()`)) && /class="qrsvg"/.test(P(`renderPeerPanel()`)) && /data-act="peerleave"/.test(P(`renderPeerPanel()`)));
    check("smoke: a host who finds the other player also tapped Create can type their letters instead", /id="peerjoin"/.test(P(`peerSetupCard()`)));
    P(`P.host = false;`);
    clean("the set-up step while waiting (joiner)", P(`peerSetupCard()`));
    check("smoke: a joiner alone in the room is told so, not left waiting", /other player is not here/.test(strip(P(`peerSetupCard()`))));
    P(`var __g = P.G; P.G = null; P.st = "live"; P.who = "Mikko";`);
    check("smoke: the tabs appear as soon as the link is live, before their fleet comes", /class="sides/.test(P(`sidesStrip()`)) && /no fleet open yet/.test(strip(P(`sidesStrip()`))));
    P(`P.G = __g; P.room = ""; P.st = "off"; P.host = false; P.who = "";`);
    P(`V.side = "me";`);
  });
}

module.exports = run;
/* the harness itself, for a probe of one's own: boot(html) and the row finders */
run.boot = boot; run.saved = saved; run.defenceRows = defenceRows; run.strip = strip; run.BUILT = BUILT;
if(require.main === module){
  let pass = 0, fail = 0;
  const verbose = process.argv.includes("-v");
  run((name, ok, detail) => { if(ok){ pass++; if(verbose) console.log("  ok   " + name); } else { fail++; console.log("  FAIL " + name + (detail ? "  -- " + detail : "")); } });
  console.log((fail ? "FAIL " : "ok ") + pass + " passed, " + fail + " failed");
  process.exit(fail ? 1 : 0);
}
