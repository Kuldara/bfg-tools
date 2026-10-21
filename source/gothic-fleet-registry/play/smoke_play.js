/* Gothic Fleet Play - savutesti: RAKENNETTU sivu Noden vm:ssa.

   play/test_play.js testaa vain saantokerroksen (play_rules.js). Sivun oma
   koodi - asetusruutu, rivit, kortti, ponnahdukset, toiminnot, VP-summat -
   elaa play_template.html:ssa, eika mikaan aja sita. Tama ajaa: lataa
   valmiin tiedoston play/Gothic Fleet Play.html (python play/build_play.py)
   tynka-DOMiin, aloittaa pelin laivastolla, jossa on yksi yksikko jokaista
   lajia (capital ship, escort-laivue, jokainen PLANETARY DEFENCES -rivi,
   komentaja), piirtaa asetusruudun, rosterin, jokaisen kortin, ponnahdukset
   ja valikon, ja kaatuu poikkeukseen tai "undefined"/"NaN"-tekstiin
   HTML:ssa. Lisaksi muutama vaite, jotka on luettu kirjasta (sivu
   vaitteessa) tai taman projektin kayttoliittymaperiaatteista.

   Rakennetun sivun pitaa olla tehty nykyisista lahteista: vanha sivu
   todistaisi eilisesta koodista. Vertailu on SISALLOSTA, ei
   aikaleimoista (staleSources): sivun pitaa sisaltaa domain.js,
   play_rules.js ja data sellaisinaan, mallin jokainen pala ja ne
   app_template.html:n lohkot, jotka build_play.py poimii. Nain toisen
   tekijan muutos app_template.html:n muihin kohtiin ei tee sivusta vanhaa.
   Jos sivu on vanha, se on yksi punainen tarkistus, joka sanoo mita ajaa.

     node play/smoke_play.js       (oma yhteenveto)
     play/test_play.js ajaa taman lopuksi samoilla laskureilla. */
"use strict";
const fs = require("fs"), path = require("path"), vm = require("vm");
const HERE = __dirname, ROOT = path.join(HERE, "..");
const BUILT = path.join(HERE, "Gothic Fleet Play.html");

/* Mista lahteista rakennettu sivu poikkeaa (tyhja = sivu on ajan tasalla).
   build_play.py upottaa domain.js:n, play_rules.js:n ja datan sellaisinaan,
   mallin merkkien valiset palat sellaisinaan ja app_template.html:sta ne
   lohkot, jotka sen block("...")-kutsut nimeavat - lista luetaan
   build_play.py:sta, jotta se ei ole kahdessa paikassa. */
function staleSources(html){
  const lf = s => s.replace(/\r\n/g, "\n");
  const rd = p => lf(fs.readFileSync(p, "utf8"));
  const page = lf(html), out = [];
  [["domain.js", path.join(ROOT, "domain.js")], ["play_rules.js", path.join(HERE, "play_rules.js")], ["bfg_data.json", path.join(ROOT, "bfg_data.json")]]
    .forEach(x => { if(!page.includes(rd(x[1]))) out.push(x[0]); });
  if(rd(path.join(HERE, "play_template.html")).split(/__[A-Z]+__/).some(piece => piece.trim() && !page.includes(piece))) out.push("play_template.html");
  const app = rd(path.join(ROOT, "app_template.html")), py = rd(path.join(HERE, "build_play.py"));
  const blocks = [...py.matchAll(/^\s*block\("((?:[^"\\]|\\.)*)"(?:,\s*"((?:[^"\\]|\\.)*)")?\),?\s*$/gm)];
  if(!blocks.length) out.push("build_play.py (no block list found)");
  if(blocks.some(m => {
    const i = app.indexOf(m[1]), closer = m[2] || "}";
    const j = i < 0 ? -1 : app.indexOf("\n" + closer + "\n", i);
    return i < 0 || j < 0 || !page.includes(app.slice(i, j + closer.length + 2));
  })) out.push("app_template.html (a block the play page copies)");
  return out;
}

/* Tekstiksi: tagit ja kuvakkeet pois, jotta vaite lukee sen minka pelaaja. */
const strip = h => String(h).replace(/<svg[\s\S]*?<\/svg>/g, " ").replace(/<[^>]+>/g, " ").replace(/&[a-z#0-9]+;/gi, " ").replace(/\s+/g, " ").trim();

/* Rakennettu sivu yhteen vm-kontekstiin. Palauttaa P(src): ajaa koodia
   sivun omassa nakyvyydessa ja palauttaa arvon. */
function boot(html){
  const i0 = html.indexOf("<script>") + "<script>".length, i1 = html.lastIndexOf("</script>");
  const code = html.slice(i0, i1);
  const d0 = html.indexOf('<script id="bfgdata" type="application/json">') + '<script id="bfgdata" type="application/json">'.length;
  const dataText = html.slice(d0, html.indexOf("</script>", d0));
  const store = {}, toasts = [];
  const elem = () => ({ innerHTML: "", textContent: "", className: "", value: "", style: {}, disabled: false,
    classList: { add(){}, remove(){}, toggle(){}, contains(){ return false; } }, children: [],
    getBoundingClientRect(){ return { top: 0, height: 0, left: 0, width: 0 }; }, appendChild(){}, remove(){}, querySelector(){ return null; },
    scrollIntoView(){}, hasAttribute(){ return false; }, getAttribute(){ return null; }, closest(){ return null; }, previousElementSibling: null });
  const APP = elem(), TOAST = elem();
  TOAST.appendChild = t => { toasts.push(String(t.textContent)); };
  /* sivun omat kuuntelijat talteen: __fire("input", ev) ajaa ne kuin selain */
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
  ctx.__toasts = toasts; ctx.__strip = strip;
  ctx.__fire = (t, ev) => (listeners[t] || []).forEach(f => f(ev));
  const P = src => vm.runInContext(src, ctx, { filename: "smoke.js" });
  return { P, ctx, toasts, store, APP, DATA: JSON.parse(dataText) };
}

/* Tallennettu yksikko builderin muodossa (skeema 4): osio ja rivi nimella. */
function saved(L, secRe, labelRe, n, name){
  for(let si = 0; si < L.secs.length; si++){
    if(!secRe.test(L.secs[si].t)) continue;
    const ei = L.secs[si].ents.findIndex(e => labelRe.test(e.l));
    if(ei >= 0){ const e = L.secs[si].ents[ei]; return { s: si, e: ei, sn: L.secs[si].t, el: e.l, ref: e.r, n: n || 1, name: name || "" }; }
  }
  throw new Error("savutesti: listassa " + L.nm + " ei ole rivia " + secRe + " / " + labelRe);
}
/* Listan koko PLANETARY DEFENCES -osio, jokainen rivi kerran: uusi rivi
   tulee savutestiin itsestaan. Kolme kappaletta niille, joita ostetaan
   monta kerrallaan (laivueet, miinat, miinakentat). */
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
  /* SMOKE_PAGE: toinen rakennus (esim. vanhasta mallista tehty vertailusivu)
     - silloin tuoreutta ei tarkisteta */
  const PAGE = process.env.SMOKE_PAGE || BUILT;
  if(!fs.existsSync(PAGE)){ check("smoke: the built page exists (python play/build_play.py)", false, PAGE); return; }
  const html = fs.readFileSync(PAGE, "utf8");
  if(!process.env.SMOKE_PAGE){
    /* vanha sivu on yksi punainen tarkistus; loput ajetaan silti, jotta
       nahdaan mita se sivu, joka levylla ON, tekee (esim. kun toinen
       muokkaa lahdetta kesken hyvaksyntaajon) */
    const stale = staleSources(html);
    check("smoke: the built page was built from the current sources - else run: python play/build_play.py", stale.length === 0, "it differs from " + stale.join(", ") + "; the checks below ran against the OLD build");
  }

  /* every piece of HTML the page makes goes through here */
  const bad = h => { const t = strip(h); const m = t.match(/.{0,60}\b(undefined|NaN)\b.{0,40}/) || String(h).match(/.{0,60}(="undefined"|="NaN"|\[object Object\]).{0,40}/); return m ? m[0] : ""; };
  const clean = (what, h) => check("smoke: " + what + " renders clean", typeof h === "string" && h.length > 0 && !bad(h), typeof h !== "string" ? String(h) : h.length ? bad(h) : "empty");
  const where = e => String(e && e.stack || e).split("\n").slice(0, 3).join(" | ");
  const guard = (what, fn) => { try{ return fn(); }catch(e){ check("smoke: " + what + " does not throw", false, where(e)); return null; } };
  /* a page with its P(): an exception inside the page's own code is a
     failed check of its own and the run goes on (the value is then "") */
  const open = () => {
    const pg = boot(html), raw = pg.P;
    pg.P = src => { try{ return raw(src); }catch(e){ check("smoke: the page does not throw at: " + String(src).replace(/\s+/g, " ").slice(0, 70), false, where(e)); return ""; } };
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
    /* J214: the fleet's attack rating before the game, from the book's own
       sentence: "The Imperial Navy have a starting attack or initiative
       rating of 2." (Fleets p. 32) */
    check("smoke: the set-up screen gives the fleet's attack rating with its page",
          /Fleet facts/.test(strip(setup)) && /Attack rating The Imperial Navy have a starting attack or initiative rating of 2\. \(Fleets p\. 32\) 2 /.test(strip(setup)), strip(setup).slice(0, 300));
    const tiles = i => (setup.match(new RegExp('data-act="ld" data-i="' + i + '"', "g")) || []).length;
    /* Rulebook p. 100: planetary defences "do not roll for leadership";
       Fleets p. 503: a Ramilies' "Leadership is rolled as for a capital
       ship". The cruiser is the flagship here: the Fleet-Admiral's fixed
       Ld 8 stands in for its roll (Fleets p. 35, LUEMINUT T8). Six tiles:
       Ld 5 (Orks, Fleets p. 358) to Ld 10 (Space Marines, Fleets p. 94) -
       a fleet may hold ships of another table (Grey Knights, p. 138, 144). */
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
    check("smoke: the default flagship is the cruiser, with the Admiral's Ld 8 (LUEMINUT T8)", P(`G.flag`) === I.lunar && P(`G.st[${I.lunar}].ld`) === 8, P(`JSON.stringify([G.flag, G.st[${I.lunar}].ld])`));
    /* nimet alkuruudussa (kayttaja 19.10.2026): kirjoitetaan vanhan paalle,
       vain tahan peliin; tyhja tai vanha nimi = vanha nimi */
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
    P(`V.pop = null; OPT.orders = true; OPT.shields = true; OPT.ordnance = true; OPT.fleet = true; act("pop", ${I.station}, "order")`);
    const ordPop = strip(P(`renderPop(${I.station})`));
    check("smoke: with orders tracked a station is offered Reload Ordnance only, and Brace (Rulebook p. 100)", /Reload Ordnance/.test(ordPop) && !/Lock On|All Ahead Full|Burn Retros|Come to New Heading|left the table/.test(ordPop), ordPop.slice(0, 260));
    P(`act("pop", ${I.fort}, "order")`);
    const ordFort = strip(P(`renderPop(${I.fort})`));
    check("smoke: ... a Ramilies Lock On and Reload Ordnance (Fleets p. 503)", /Reload Ordnance/.test(ordFort) && /Lock On/.test(ordFort) && !/All Ahead Full|Burn Retros|Come to New Heading/.test(ordFort), ordFort.slice(0, 260));
    P(`act("pop", ${I.station}, "blast")`);
    clean("the station's blast marker panel", P(`renderPop(${I.station})`));
    /* every row and card again with all tracking on */
    clean("the roster with all tracking on", P(`V.pop = null; renderRoster()`));
    for(let i = 0; i < n; i++){
      if(P(`KIND(${i})`) === "commander") continue;
      clean("the card of " + P(`unitName(${i})`) + " with all tracking on", P(`V.sheet = ${i}; V.info = true; __h = renderSheet(${i}); V.info = false; V.sheet = null; __h`));
    }
    check("smoke: the INFO order table of a station lists its own two orders only (Rulebook p. 100)", (() => { const t = strip(P(`V.sheet = ${I.station}; V.info = true; __h = renderSheet(${I.station}); V.info = false; V.sheet = null; __h`)); return /Reload Ordnance/.test(t) && /Brace For Impact/.test(t) && !/All Ahead Full|Burn Retros/.test(t); })());
    /* Fleets p. 502: a Ramilies may have twice its launch bays in play */
    check("smoke: the attack craft counter counts the Ramilies' 32, two air bases... and the station's 4", /AC 0 \/ ?\d+/.test(strip(P(`renderRoster()`))) && P(`PLAY.launchBays(U[${I.fort}].R, G.st[${I.fort}]).n`) === 32, strip(P(`renderRoster()`)).slice(0, 120));
    P(`OPT.orders = false; OPT.shields = false; OPT.ordnance = false; OPT.fleet = false; normaliseUntracked(G)`);
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
  /* User decision 13.10.2026 (LUEMINUT T40): no Leadership automation on the
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
    const rowOf = (h, name) => { const m = String(h).split('<div class="setrow">').find(s => new RegExp('(<b>|data-nm="[0-9]+" value=")' + name, "i").test(s)); return m ? strip(m) : ""; };
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
  /* play/LUEMINUT.md "Kannykkakierros 19.10.2026": compact view, P+S rows,
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
    /* the Lunar (Fleets p. 37): port and starboard batteries and lances are
       pairs the way the printed card draws them (v1.2 J188, the user's
       choice C: two rows with their own names and arcs, one badge, one
       range and one strength "each"; ONE merged row was rejected as busy) */
    const lunarRow = P(`renderRow(LU, false)`);
    clean("the Lunar's row with its port/starboard pairs", lunarRow);
    const trs = (lunarRow.match(/<tr[ >]/g) || []).length - 1;   /* minus the heading row */
    check("smoke: the Lunar's pairs are drawn as on the card: 5 rows, 2 pairs sharing badge, range and strength 'each'",
          trs === 5 && (lunarRow.match(/data-pair="1"/g) || []).length === 2 && (lunarRow.match(/data-pair="2"/g) || []).length === 2 &&
          (lunarRow.match(/rowspan="2"/g) || []).length >= 6 && /each/.test(strip(lunarRow)) && /Port weapons battery/.test(strip(lunarRow)) &&
          (/Starboard weapons battery/.test(strip(lunarRow)) || (/Stbd weapons battery/.test(strip(lunarRow)) && /title="Starboard weapons battery"/.test(lunarRow))),
          trs + " rows: " + strip(lunarRow).slice(0, 220));
    /* v1.2 J183: one range in a frame of its band's colour (30 cm: #E69F00) */
    check("smoke: the ranges are framed in their band's colour as on the card (30 cm band) and the unit is in the heading", /class="rp"[^>]*--rb:#E69F00/.test(lunarRow) && /Range cm/.test(strip(lunarRow)), (lunarRow.match(/.{0,60}class="rp.{0,60}/) || [""])[0]);
    P(`act("pop", LU, "crit"); act("crit", LU, "4"); act("pop", LU, "crit")`);
    const struck = P(`renderRow(LU, false)`);
    check("smoke: Port Armament Damaged (p. 67) parts the pairs: the port rows struck through on their own, starboard whole", !/data-pair=/.test(struck) && (struck.match(/<tr class="silent/g) || []).length === 2, strip(struck).slice(0, 260));
    /* the compact view */
    P(`V.compact = true`);
    const croster = P(`renderRoster()`);
    clean("the compact roster", croster);
    check("smoke: compact rows carry the weapons line and CRIT in the name line, no weapons table, no strip", /class="wline"/.test(croster) && !/<table class="wt/.test(croster) && /class="crit cmini"/.test(croster) && !/class="jump"/.test(croster));
    P(`V.compact = false`);
    const froster = P(`renderRoster()`);
    check("smoke: the full roster has the strip with a chip per unit and its End Phase button", (froster.match(/data-act="jump"/g) || []).length === 3 && /data-act="endph"/.test(froster), (froster.match(/data-act="jump"/g) || []).length);
    check("smoke: the top bar is one line of three tools: the view, UNDO, the menu (the builder is in the menu)", /data-act="view"/.test(froster) && /data-act="undo"/.test(froster) && /data-act="menu"/.test(froster) && !/data-act="info"/.test(froster.split('<div class="main')[0]) && /BUILDER/.test(P(`renderMenu()`)));
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
    /* the report (meta-tietokanta/lisaa dataa/FLEET_REPORT_TEMPLATE.md) */
    P(`act("rwin", null, "A"); repState().opp = "Chaos"; repState().scen = "Cruiser Clash";`);
    const rep = P(`reportText()`);
    check("smoke: the report has the template's four lines first, the points, the date and the list", /^Fleet A: Imperial Navy/.test(rep) && /\nFleet B: Chaos\nWinner: A\nScenario: Cruiser Clash\n/.test(rep) && /\nPoints: 1500\n/.test(rep) && /\nDate: \d{4}-\d\d-\d\d\n/.test(rep) && /Lunar Class Cruiser/i.test(rep) && /\nList B:/.test(rep), rep.slice(0, 300));
    clean("the menu with the report", P(`renderMenu()`));
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
    const builderKey = P(`lsGet(KEY_BUILDER)`);
    P(`takeFleetText(JSON.stringify(__doc), "file")`);
    const lk = JSON.parse(P(`JSON.stringify(linkedFleets().map(f => [f.how, f.doc.ln]))`));
    check("smoke: a fleet file goes on the page's own list and the builder's key is not written", lk.length === 1 && lk[0][0] === "file" && P(`lsGet(KEY_BUILDER)`) === builderKey, JSON.stringify(lk));
    const load = P(`renderLoad()`);
    clean("the load screen with a fleet from a file", load);
    check("smoke: ... the load screen lists it under Saved fleets, marked new, with its forget button", /Saved fleets/.test(strip(load)) && /data-act="linked" data-arg="0"/.test(load) && /new/.test(strip(load)) && /data-act="unlink"/.test(load));
    P(`forgetLinked(0)`);
    check("smoke: ... and forget takes it off", P(`linkedFleets().length`) === 0);
    /* J208: a link or a file carries the builder's names; every fleet in it
       is kept, named, and marked new */
    P(`takeFleetText(JSON.stringify({ name: "Lunar pair", ln: __doc.ln, limit: 1500, units: __doc.units, fleets: [{ name: "Swords", ln: __doc.ln, limit: 1000, units: __doc.units.slice(3) }] }), "link")`);
    const named = strip(P(`renderLoad()`));
    check("smoke: a link's fleets keep their names and are all marked new (J208)", P(`linkedFleets().map(f => f.doc.name).join("|")`) === "Lunar pair|Swords" && /Lunar pair/.test(named) && /Swords/.test(named) && P(`V.linkNew.length`) === 2, P(`JSON.stringify(linkedFleets().map(f => f.doc.name))`));
    /* phone to phone (user 19.10.2026): this page's own saved fleets go on
       by QR code or a shared link, one by one or all in one */
    const lp = P(`renderLoad()`);
    check("smoke: every saved fleet on this phone has its own 'to phone', and two or more have 'All to phone'", /data-act="phone" data-arg="s:0"/.test(lp) && /data-act="phone" data-arg="s:1"/.test(lp) && /data-act="phone" data-arg="all"/.test(lp));
    const all2 = JSON.parse(P(`JSON.stringify(phoneDoc("all"))`));
    check("smoke: ... All to phone carries every saved fleet with its name", all2.name === "Lunar pair" && (all2.fleets || []).length === 1 && all2.fleets[0].name === "Swords" && P(`phoneDoc("s:1").name`) === "Swords", JSON.stringify([all2.name, (all2.fleets || []).map(f => f.name)]));
    /* QR isommaksi (kayttaja 19.10.2026): Full screen -nappi ja koodin napautus */
    const pp = P(`V.phoneSvg = "<svg></svg>"; V.phoneUrl = "https://bfgtools.kuldare.com/play/x#fleet=abc"; phonePanel()`);
    check("smoke: the phone panel has Full screen, on the button and on the code itself", (pp.match(/data-act="qrfull"/g) || []).length === 2 && /Full screen/.test(strip(pp)) && P(`typeof qrFull`) === "function" && P(`qrFull("<svg></svg>")`) === null, strip(pp).slice(0, 120));
    P(`V.phoneSvg = ""; V.phoneUrl = ""`);
    P(`forgetLinked(1); forgetLinked(0)`);
    /* the builder's named library on the same device (gothic-fleet-registry-saves-v1) */
    pg.store["gothic-fleet-registry-saves-v1"] = JSON.stringify({ v: 1, saves: [{ id: "x1", name: "Club night", ln: L.nm, limit: 1500, units: pg.ctx.__doc.units, pts: 0, saved: "2026-10-19" }], open: {} });
    const lib = P(`renderLoad()`);
    check("smoke: the builder's saved fleets are on the load screen by name, ready to play or send to a phone", /Fleets from the builder/.test(strip(lib)) && /Club night/.test(strip(lib)) && /saved/.test(strip(lib)) && /data-act="newfrom" data-arg="0"/.test(lib) && /data-act="phone" data-arg="b:0"/.test(lib) && P(`builderFleets()[0].name`) === "Club night" && P(`phoneDoc("b:0").name`) === "Club night", strip(lib).slice(0, 300));
    delete pg.store["gothic-fleet-registry-saves-v1"];
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
    /* Fleets p. 235: "A Daemon ship may not be commanded by a Warmaster or a
       Chaos Lord even if it is the largest ship in the fleet." */
    check("smoke: the Warmaster's flagship is the Murder, not the bigger Daemonship (Fleets p. 235, J215)",
          P(`U[DS].R.upgrades.some(x => /^Daemonship/.test(x.label) && x.state === "take") && G.flag === MU`) === true,
          P(`JSON.stringify([G.flag, MU, DS])`));
  });

  /* --------------- J216/J222: the builder's squadrons start squadroned --- */
  guard("the builder's squadrons", () => {
    const pg = open(), P = pg.P;
    const L = pg.DATA.lists.find(x => /^Imperial Navy . Gothic Sector$/.test(x.nm));
    /* builderin laivuetunnisteet (SAVE_SCHEMA "Yksikon viittaukset"): kaksi
       risteilijaa tunnisteella C, yksi ilman, yksi yksin tunnisteella E ja
       escort-laivue tunnisteella C - escortilla ei ole SQN-nappia */
    const lun = (name, sq) => { const u = saved(L, /^Cruisers$/, /^Lunar class cruiser$/, 1, name); if(sq) u.sq = sq; return u; };
    const swords = saved(L, /^ESCORTS$/, /^Sword class frigate$/, 3, "Blades"); swords.sq = "C";
    pg.ctx.__doc = { ln: L.nm, limit: 9000, units: [saved(L, /^Admiral$/, /^Fleet-Admiral \(Ld 8\)$/), lun("Alpha", "C"), lun("Beta", "C"), lun("Gamma"), lun("Delta", "E"), swords] };
    P(`newGame(resolveFleet(__doc)); V.screen = "setup"; save(); render();
       var NX = n => U.findIndex(x => x.u.name === n);`);
    const g = JSON.parse(P(`JSON.stringify(["Alpha", "Beta", "Gamma", "Delta", "Blades"].map(n => G.grp[NX(n)]))`) || "[]");
    /* Fleets p. 13: cruisers "may be formed into squadrons of two to four
       ships"; SQN gives them one Ld, one order and combined fire (p. 95, 99) */
    check("smoke: two cruisers with the builder's squadron tag start the game in one SQN group (J222)",
          g[0] != null && g[0] === g[1] && /^[ABC]$/.test(String(g[0])), JSON.stringify(g));
    check("smoke: ... an untagged cruiser, a tag on one ship alone and the escort squadron start ungrouped",
          g[2] == null && g[3] == null && g[4] == null, JSON.stringify(g));
    const setup = P(`renderSetup()`);
    const btn = n => { const m = new RegExp('data-act="grp" data-i="' + P(`NX(${JSON.stringify(n)})`) + '">([^<]*)<').exec(setup); return m ? m[1] : null; };
    check("smoke: ... the set-up shows the group on both cruisers' SQN buttons",
          btn("Alpha") === "SQN " + g[0] && btn("Beta") === "SQN " + g[0] && btn("Gamma") === "SQN -", JSON.stringify([btn("Alpha"), btn("Beta"), btn("Gamma")]));
    P(`act("grp", NX("Beta"))`);
    check("smoke: ... and the SQN button still takes a ship out of it", P(`G.grp[NX("Beta")] !== G.grp[NX("Alpha")]`) === true, P(`JSON.stringify(G.grp)`));
  });

  /* ------------------------------------------------ Eldar: the Haven --- */
  guard("the Eldar fleet", () => {
    const pg = open(), P = pg.P;
    const L = pg.DATA.lists.find(x => /^Eldar Corsairs . Gothic Sector$/.test(x.nm));
    pg.ctx.__doc = { ln: L.nm, limit: 9000, units: [saved(L, /^Pirate Prince$/, /./), saved(L, /^Cruisers$/, /./), saved(L, /^PLANETARY DEFENCES$/, /^Haven space station$/)] };
    P(`newGame(resolveFleet(__doc)); V.screen = "setup"; save(); render(); var HV = U.findIndex(x => /HAVEN/.test(x.R.className || ""));`);
    const setup = P(`renderSetup()`);
    clean("the Eldar set-up screen", setup);
    /* Fleets p. 336: "An Eldar Haven rolls for leadership following Eldar
       rules. An Eldar or Dark Eldar fleet commander can lead the battle
       aboard it instead of a ship." */
    check("smoke: the Haven rolls its Leadership and may carry the commander (Fleets p. 336)", new RegExp('data-act="ld" data-i="' + P(`HV`) + '"').test(setup) && new RegExp('<option value="' + P(`HV`) + '"').test(setup) && P(`G.flag !== HV`));
    P(`U.forEach((x, i) => { if(x.R.kind === "ship" && G.st[i].ld == null) setLd(i, 8); }); act("start", null); for(let k = 0; k < 4; k++) act("hit", HV);`);
    clean("the crippled Haven's row", P(`renderRow(HV, false)`));
    clean("the crippled Haven's card", P(`V.sheet = HV; V.info = true; var __h = renderSheet(HV); V.info = false; V.sheet = null; __h`));
    check("smoke: a crippled Haven shows no speed modifier and no 'disengaged' switch: it does not move (Fleets p. 336)", !/[^0-9]-5(?![0-9])/.test(strip(P(`renderRow(HV, false)`))) && !/disengaged/.test(strip(P(`V.sheet = HV; __h = renderSheet(HV); V.sheet = null; __h`))), strip(P(`renderRow(HV, false)`)).slice(0, 200));
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
}

module.exports = run;
/* the harness itself, for a probe of one's own: boot(html) and the row finders */
run.boot = boot; run.saved = saved; run.defenceRows = defenceRows; run.strip = strip; run.BUILT = BUILT; run.staleSources = staleSources;
if(require.main === module){
  let pass = 0, fail = 0;
  const verbose = process.argv.includes("-v");
  run((name, ok, detail) => { if(ok){ pass++; if(verbose) console.log("  ok   " + name); } else { fail++; console.log("  FAIL " + name + (detail ? "  -- " + detail : "")); } });
  console.log((fail ? "FAIL " : "ok ") + pass + " passed, " + fail + " failed");
  process.exit(fail ? 1 : 0);
}
