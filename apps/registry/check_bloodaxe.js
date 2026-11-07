/* Blood Axe commandeered escorts in the catalogue (src/commandeered.js), in
   a real browser.

     node apps/registry/check_bloodaxe.js        (part of npm test; needs dist/)

   The user 29.10.2026 ("tee ja julkaise kaikki", the plan of the same day):
   the commandeered section's + puts one ship into a Blood Axe tiddla of the
   Warlord being bought for, its - takes one out, its top row names the
   tiddla and lets the player pick another, a mixed tiddla being filled takes
   them too, and the tiddla section links down to them. This drives the
   built page with the page's own buttons:
     - a Goff Warlord: the top row says what is missing, the rows say "needs a
       Blood Axe tiddla", and + adds a card as before;
     - a Blood Axe Warlord and a tiddla card without a letter: + gives the
       tiddla a letter and puts one ship in, + again grows that card, another
       class is a card of one; Your fleet's group row counts them; the rules
       are green; - takes one out; the tiddla section has the line;
     - a mixed tiddla being filled takes a commandeered escort into it;
     - two tiddlas: the pick in the top row is where the + goes, and the link
       opens the section;
     - the other clans' rows are gone from a clan Warlord's ships (user
       29.10.2026: "take them away, they only take space"), and all there
       while he has none. */
"use strict";
const fs = require("fs"), path = require("path");
const { launch } = require("../../tools/lib/chrome.js");

const PAGE = path.resolve(__dirname, "..", "..", "dist", "registry", "index.html");
if (!fs.existsSync(PAGE)) { console.error("dist/registry/index.html is missing: run npm run build"); process.exit(1); }
const fileUrl = p => "file:///" + encodeURI(p.replace(/\\/g, "/"));

let pass = 0, fail = 0;
const check = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  console.log("  " + (ok ? "PASS" : "FAIL") + "  " + name + "  ->  " + JSON.stringify(got).slice(0, 300) + (ok ? "" : "   expected " + JSON.stringify(want)));
  ok ? pass++ : fail++;
};

/* helpers in the page: the sections and rows by their headings and names, the fleet in short */
const HELP = `const G = GFR, S = () => G.appState.S, w = ms => new Promise(r => setTimeout(r, ms || 40));
  const sec = re => document.querySelector('#catalogue details.sec[data-sec="' + G.LISTS[S().li].secs.findIndex(s => re.test(s.t)) + '"]');
  const row = (secRe, rowRe) => [...sec(secRe).querySelectorAll('.pick')].find(p => p.querySelector('.add') && rowRe.test(p.querySelector('.nm').textContent));
  const press = (secRe, rowRe, b) => row(secRe, rowRe).querySelector(b || '.add').click();
  const fleet = () => S().units.slice(1).map(u => G.resolveUnit(u).className.replace(/ class.*$| attack ship| ram ship/i, '').toLowerCase() + ' ' + (u.n || 1) + (u.sq || '')).join(', ');
  const BA = /^BLOOD AXE/, TID = /^Tiddla skwadron/;`;
const START = `localStorage.clear(); delete G.appState.MIX; delete G.appState.BA_TO;
  G.switchList(G.LISTS.findIndex(L => /Da Ork Clanz/.test(L.nm))); S().units = []; S().limit = 2000;
  const L = G.LISTS[S().li], at = re => { let r = null; L.secs.forEach((s, si) => s.ents.forEach((e, ei) => { if (!r && re.test(e.l) && e.k !== 'up') r = [si, ei]; })); return r; };
  let a = at(/^Ork Warlord$/); G.addUnit(a[0], a[1]);
  a = at(/^Ravager/i); G.addUnit(a[0], a[1]); S().units[S().units.length - 1].n = 6; G.render(); await w();`;
const clan = c => `document.querySelector('[data-wlclan][data-c="${c}"]').click(); await w();`;
const run = async (cd, js) => JSON.parse(await cd.evaluate("(async () => { " + HELP + START + js + " })()"));

(async () => {
  const cd = await launch({ prefix: "gfr-bloodaxe-", args: ["--window-size=1300,950", "--hide-scrollbars"] });
  try {
    await cd.send("Page.enable");
    const loaded = cd.once("Page.loadEventFired");
    await cd.send("Page.navigate", { url: fileUrl(PAGE) });
    await loaded;
    await cd.evaluate("window.__errs = []; addEventListener('error', e => __errs.push(String(e.message))); true");

    const g = await run(cd, clan("Goffs") + `const top = sec(BA).querySelector('.batop');
      press(BA, /^Sword/); await w();
      return JSON.stringify({ no: !!(top && top.classList.contains('no')), says: /not Blood Axes/.test(top ? top.textContent : ''),
        tag: row(BA, /^Sword/).querySelector('.tag').textContent, fleet: fleet() });`);
    check("a Goff Warlord: the top row says what is missing, the rows need a Blood Axe tiddla, + as before",
      [g.no, g.says, g.tag, g.fleet], [true, true, "needs a Blood Axe tiddla", "ravager 6, sword 2"]);

    const b = await run(cd, clan("Blood Axes") + `const top0 = sec(BA).querySelector('.batop').textContent.replace(/\\s+/g, ' ');
      press(BA, /^Sword/); await w(); press(BA, /^Sword/); await w(); press(BA, /^Cobra/); await w();
      const f3 = fleet(), grp = [...document.querySelectorAll('#fleet .unit.mixg .uhead .ty')].map(t => t.textContent.replace(/\\s+/g, ' ').trim());
      const red = G.checks().filter(c => !c.ok && /tiddla|commandeered/i.test(c.t)).map(c => c.t);
      const ok = G.checks().filter(c => c.ok && /^Blood Axe tiddla/.test(c.t)).map(c => c.v);
      press(BA, /^Sword/, '.sub'); await w();
      const hint = sec(TID).querySelector('.bahint');
      return JSON.stringify({ room: /6 Ork \\+ 0 commandeered . room for 3/.test(top0), f3, grp, red, ok, afterSub: fleet(), hint: !!(hint && hint.querySelector('[data-bajump]')) });`);
    check("a Blood Axe tiddla: the top row has room for three", b.room, true);
    check("+ gives the tiddla a letter and puts one ship in; again grows it; another class is a card of one",
      b.f3, "ravager 6A, sword 2A, cobra 1A");
    check("Your fleet's group row counts them", b.grp, ["9 escorts (6 Ork + 3 commandeered) · mixed"]);
    check("the rules: green, 6 Ork + 3 commandeered", [b.red, b.ok], [[], ["6 Ork + 3 commandeered"]]);
    check("- takes one out", b.afterSub, "ravager 6A, sword 1A, cobra 1A");
    check("the tiddla section has the line with its link", b.hint, true);

    const m = await run(cd, clan("Blood Axes") + `sec(TID).querySelector('[data-mixstart]').click(); await w();
      for (let k = 0; k < 3; k++) { press(TID, /^Brute/); await w(); }
      press(BA, /^Sword/); await w();
      return JSON.stringify({ filling: !!G.appState.MIX, fleet: fleet() });`);
    check("a mixed tiddla being filled takes the commandeered escort", [m.filling, m.fleet], [true, "ravager 6, brute 3A, sword 1A"]);

    /* user 29.10.2026: in the Mixed squadron feature whatever the clan; the squadron is red when it is not kept */
    const gm = await run(cd, clan("Goffs") + `sec(TID).querySelector('[data-mixstart]').click(); await w();
      for (let k = 0; k < 6; k++) { press(TID, /^Brute/); await w(); }
      press(BA, /^Sword/); await w();
      sec(TID).querySelector('[data-mixdone]').click(); await w();
      const g = [...document.querySelectorAll('#fleet .unit.mixg')].map(x => ({ bad: x.classList.contains('bad'), err: (x.querySelector('.issues') || {}).textContent || '' }));
      return JSON.stringify({ fleet: fleet(), bad: g.length === 1 && g[0].bad, says: /no Blood Axe clan/.test(g.length ? g[0].err : '') });`);
    check("a Goff Warlord's mixed tiddla takes it too, and its row is red: no Blood Axe clan", [gm.fleet, gm.bad, gm.says], ["ravager 6, brute 6A, sword 1A", true, true]);
    const help = await run(cd, clan("Blood Axes") + `const p = document.querySelector('#fleet .wlpanel');
      return JSON.stringify(/Blood Axes:[\\s\\S]*Mixed squadron/.test(p ? p.textContent : ''));`);
    check("the Warlord block says where the Blood Axes' escorts are", help, true);

    const t = await run(cd, clan("Blood Axes") + `const a2 = at(/^Brute/i); G.addUnit(a2[0], a2[1]);
      const nb = S().units[S().units.length - 1]; nb.n = 6; nb.sq = 'B';
      S().units.find(u => /ravager/i.test(G.resolveUnit(u).className)).sq = 'A'; G.render(); await w();
      const segs = [...sec(BA).querySelectorAll('[data-bato]')].map(x => x.textContent + (x.classList.contains('on') ? '*' : ''));
      sec(BA).querySelector('[data-bato="B"]').click(); await w();
      press(BA, /^Sword/); await w();
      sec(BA).open = false; sec(TID).querySelector('[data-bajump]').click(); await w(80);
      return JSON.stringify({ segs, fleet: fleet(), opened: sec(BA).open, errs: window.__errs });`);
    check("two tiddlas: the top row offers both", t.segs, ["A*", "B"]);
    check("the pick is where the + goes", t.fleet, "ravager 6A, brute 6B, sword 1B");
    check("the link opens the section", t.opened, true);
    const clansOn = `const rav = [...document.querySelectorAll('#fleet .unit')].find(x => /ravager/i.test((x.querySelector('.cls') || {}).textContent || ''));
      return [...rav.querySelectorAll('.opt')].map(o => (o.textContent.match(/Clan: ([A-Za-z ]+?) [(]/i) || [])[1]).filter(Boolean);`;
    const none = JSON.parse(await cd.evaluate("(async () => { " + HELP + START + "return JSON.stringify((() => { " + clansOn + " })()); })()"));
    const goff = JSON.parse(await cd.evaluate("(async () => { " + HELP + START + clan("Goffs") + "return JSON.stringify((() => { " + clansOn + " })()); })()"));
    check("no clan picked: every clan's row on his tiddla", none.length > 2, true);
    check("a Goff Warlord: only the Goffs row on his tiddla", goff, ["Goffs"]);
    /* a clan changed on the fly leaves no price behind (user 2.11.2026): the
       same ship costs the same as with that clan picked from the start */
    const flyCase = (from, row, to, again) => "(async () => { " + HELP + START + `
      const add = re => { const L = G.LISTS[S().li]; for(let si = 0; si < L.secs.length; si++) for(let ei = 0; ei < L.secs[si].ents.length; ei++) if(re.test(L.secs[si].ents[ei].l) && L.secs[si].ents[ei].k !== 'up'){ G.addUnit(si, ei); G.render(); return; } };
      const pts = () => S().units.reduce((a, u) => a + (G.resolveUnit(u).points | 0), 0);
      S().units.length = 1; add(/^Gorbag/); await w();
      ${clan(to)} let fresh = pts();
      if(${again}){ const u0 = S().units[1], up0 = G.resolveUnit(u0).upgrades.find(x => ${row}.test(x.label)), k0 = up0.key.split(":").map(Number);
        G.setUpState(u0, k0[0], k0[1], "take"); G.render(); await w(); fresh = pts(); G.setUpState(u0, k0[0], k0[1], "opt"); G.render(); await w(); }
      ${clan(from)}
      const u = S().units[1], up = G.resolveUnit(u).upgrades.find(x => ${row}.test(x.label)), k = up.key.split(":").map(Number);
      G.setUpState(u, k[0], k[1], "take"); G.render(); await w();
      const paid = pts();
      ${clan(to)}
      return JSON.stringify({ paid, now: pts(), fresh }); })()`;
    /* again: the row bought before the change stays bought (a paid clan is
       Option since 7.11.2026, so Deathskullz no longer makes the lances free
       by itself) - compared with the same row bought on a fresh pick */
    for (const [from, row, to, again] of [["Blood Axes", "/^Imperial Navy refit/", "Goffs", false], ["Blood Axes", "/^Imperial Navy refit/", "", false],
                                   ["Goffs", "/^Looted Lances/", "Deathskullz", true], ["Deathskullz", "/^Looted Lances/", "Goffs", true]]) {
      const f = JSON.parse(await cd.evaluate(flyCase(from, row, to, again)));
      check("no price left behind: " + from + " " + row + " to " + (to || "no clan"), f.now, f.fresh);
    }
    /* the user, 7.11.2026: taking or changing the Warlord's clan leaves its
       row at Option on each skwadron - shown, not bought (Fleets p. 371: a
       skwadron may leave the benefit unpaid) */
    const optCase = JSON.parse(await cd.evaluate("(async () => { " + HELP + START + `
      const rav = () => S().units[1], pts = () => G.resolveUnit(rav()).points;
      const clanRows = () => G.resolveUnit(rav()).upgrades.filter(x => /^Clan: /.test(x.label)).map(x => x.label.replace(/ [(].*/, "") + ":" + x.state);
      const p0 = pts();
      ${clan("Goffs")} const goffs = clanRows(), p1 = pts();
      ${clan("Evil Sunz")} const sunz = clanRows(), p2 = pts();
      ${clan("Blood Axes")} const axes = clanRows();
      return JSON.stringify({ p0, p1, p2, goffs, sunz, axes }); })()`));
    check("... a free clan is taken: Blood Axes (free, its tiddla's commandeered escorts need it)", optCase.axes.filter(s => /take/.test(s)), ["Clan: Blood Axes:take"]);
    check("a clan picked: its row is Option on the skwadron, nothing bought", [optCase.goffs.filter(s => /take/.test(s)).length, optCase.goffs.some(s => /^Clan: Goffs:opt$/.test(s)), optCase.p1 - optCase.p0], [0, true, 0]);
    check("... and changed: the new clan's row is Option too, nothing bought", [optCase.sunz.filter(s => /take/.test(s)).length, optCase.sunz.some(s => /^Clan: Evil Sunz:opt$/.test(s)), optCase.p2 - optCase.p0], [0, true, 0]);
    check("no errors on the page", t.errs, []);
  } catch (e) {
    console.log("  FAIL  " + (e && e.stack || e)); fail++;
  } finally {
    cd.close();
  }
  console.log("\n" + pass + " passed, " + fail + " failed");
  process.exit(fail ? 1 : 0);
})();
