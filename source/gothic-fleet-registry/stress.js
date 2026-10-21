/* Satunnaistettu rasitustesti: kayttaa jokaista alusta jokaisessa listassa
   satunnaisilla optio- ja paivitystiloilla ja tarkistaa etta kortti ja
   pistelasku pysyvat ehjina.

   Miksi tama on olemassa: print_check.js ja layout-audit ajavat kortit
   OLETUSTILASSA. Suurin osa vioista ei kuitenkaan ole oletustilassa vaan
   siina mita kayttaja tekee - vaihto otettu, optio piilotettu, paivitys
   paalla, escort-laivue taynna. Tama harness kayttaa niita yhdistelmia.

   Siemen on kiinteä, joten ajo on toistettava. Vika tulostaa siemenen ja
   tilan, jolla sen saa uudelleen.

   Aja:  node stress.js            oletus 6 kierrosta / alus
         node stress.js 20         20 kierrosta / alus
         node stress.js 6 -v       nayta myos onnistuneet vaiheet
*/
const fs = require("fs");
const path = require("path");

const el = () => ({
  textContent: "", innerHTML: "", value: "", className: "", dataset: {},
  querySelectorAll: () => [], appendChild(){}, onclick: null, onchange: null,
  oninput: null, style: {}, id: "", classList: { add(){}, remove(){} },
  setAttribute(){}, getAttribute: () => "", closest: () => el(),
});
global.document = {
  getElementById: id => id === "bfgdata"
    ? { textContent: fs.readFileSync(path.join(__dirname, "bfg_data.json"), "utf8") }
    : el(),
  querySelector: () => el(), querySelectorAll: () => [], createElement: () => el(),
  head: { appendChild(){} },
  body: { appendChild(){}, removeChild(){}, dataset: {},
          classList: { add(){}, remove(){} } },
};
global.window = {}; global.navigator = {};
const store = {};
global.localStorage = {
  getItem: k => (k in store ? store[k] : null),
  setItem: (k, v) => { store[k] = v; },
};
global.alert = () => {}; global.confirm = () => false;

const html = fs.readFileSync(path.join(__dirname, "Gothic Fleet Registry.html"), "utf8");
const js = html.split("<script>")[1].split("</script>")[0].replace(/^"use strict";/, "");
const api = new Function(js +
  "\n;return {LISTS,SHIPS,cardHTML,isEscort,hulls,setOptState,optState,unitPts," +
  "unitMaxPts,upgradesFor,upState,setUpState,isUpgradeEnt,armModel,checks,total," +
  "totalMax,addUnit,secShips,save,load,KEY,applyRequired,resolveUnit,unitCards,getS:()=>S};")();

const { LISTS, SHIPS } = api;
const ROUNDS = Math.max(1, parseInt(process.argv[2], 10) || 6);
const VERBOSE = process.argv.includes("-v");
const STATES = ["off", "opt", "take"];

/* Toistettava satunnaisuus: sama siemen antaa saman ajon. */
function rng(seed){
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const found = [];
let cases = 0, checksRun = 0;
function fail(where, msg, ctx){
  found.push({ where, msg, ctx });
}
function check(cond, where, msg, ctx){
  checksRun++;
  if(!cond) fail(where, msg, ctx);
  return cond;
}

/* ------------------------------------------------------------ invariantit */

function checkCard(h, where, ctx){
  /* 1  Kortilla ei saa olla ohjelmointivirheen jalkia. */
  ["undefined", "NaN", "[object Object]"].forEach(bad => {
    check(!h.includes(bad), where, "kortilla esiintyy " + JSON.stringify(bad), ctx);
  });

  /* 2  tbody-parit tasapainossa: rikkinainen taulukko rikkoisi tulostuksen. */
  const open = (h.match(/<tbody[ >]/g) || []).length;
  const close = (h.match(/<\/tbody>/g) || []).length;
  check(open === close, where,
        "tbody-tagit epatasapainossa " + open + " vs " + close, ctx);

  /* 3  Jokaisella aserivilla on kaari, ja kaari tuottaa merkin. */
  const rows = (h.match(/<tr class="w(?: alt| ammo)?"/g) || []).length;
  const arcCells = (h.match(/<td class="ar" data-arc="[^"]*"/g) || []).length;
  const arcMarks = (h.match(/class="arcg"|class="noarc"/g) || []).length;
  check(arcCells === rows, where,
        "kaarisoluja " + arcCells + " != aserivien " + rows, ctx);
  check(arcMarks === rows, where,
        "kaarimerkkeja " + arcMarks + " != aserivien " + rows, ctx);

  /* 4  Varikoodi jokaiselle riville. */
  const badges = (h.match(/class="bg" style="--bd:#[0-9A-F]{6}"/gi) || []).length;
  check(badges === rows, where, "varikoodeja " + badges + " != " + rows, ctx);

  /* 5  Valintaympyrat: jokaisessa ryhmassa tasan yksi taytetty. Tama on
        se invariantti jonka takia perusrivi tayttyy automaattisesti. */
  const groups = h.match(/<tbody class="g">[\s\S]*?<\/tbody>/g) || [];
  groups.forEach((g, gi) => {
    const on = (g.match(/class="rb on"/g) || []).length;
    const all = (g.match(/class="rb/g) || []).length;
    check(on === 1, where,
          "ryhmassa " + gi + " taytettyja ympyroita " + on + ", pitaa olla 1", ctx);
    check(all >= 1, where, "ryhmassa " + gi + " ei ole ympyroita", ctx);
  });

  /* 6  Valirivi ei saa olla kahta perakkain eika reunimmaisena. Jono
        luetaan tokeneina: laiska regex peruuttaa eteenpain ja hyppaa
        valissa olevan ryhman yli, jolloin osuma on vaara. */
  const seq = (h.match(/<tbody(?: class="(?:g|gp)")?>/g) || [])
    .map(t => /class="gp"/.test(t) ? "gp" : /class="g"/.test(t) ? "g" : "p");
  seq.forEach((t, i) => {
    if(t === "gp" && seq[i + 1] === "gp")
      check(false, where, "kaksi valirivia perakkain", ctx);
  });
  if(seq.length){
    check(seq[0] !== "gp", where, "taulukko alkaa valirivilla", ctx);
    check(seq[seq.length - 1] !== "gp", where, "taulukko paattyy valiriviin", ctx);
  }

  /* 7  Vahinkokaistat: ruutujen maara vastaa hits-arvoa. */
  const bands = h.match(/<div class="k-hits(?: cr)?">[\s\S]*?<\/div>/g) || [];
  if(bands.length){
    const boxes = bands.reduce((a, b) => a + (b.match(/<i>\d+<\/i>/g) || []).length, 0);
    check(boxes > 0, where, "vahinkokaistat ovat tyhjat", ctx);
  }
}

function checkPoints(u, where, ctx){
  const p = api.unitPts(u), mx = api.unitMaxPts(u);
  check(Number.isFinite(p), where, "unitPts ei ole luku: " + p, ctx);
  check(Number.isFinite(mx), where, "unitMaxPts ei ole luku: " + mx, ctx);
  /* Hinta ennen pelaajan omaa +-saatoa ei saa olla negatiivinen. Saato (adj)
     on pelaajan itse kirjoittama luku, ja fuzz arpoo sen valilta -10..+29.
     Fleets s.499:n hintalistalla on 5 pisteen riveja (Missile silo, Orbital
     mine) ja Waystation maksaa sen, mita sen yksi puolustusjarjestelma maksaa
     (s.481: runko 0): yhdella kappaleella -9:n saato vie summan alle nollan
     ilman, etta hinnoittelussa on vikaa. Aiempi vaite "summa >= 0" piti vain
     niin kauan kuin halvin rivi maksoi vahintaan 10. Vika, jota tama vartioi
     - optio tai paivitys, joka vie RUNGON hinnan negatiiviseksi - nakyy yha. */
  check(p - (u.adj || 0) >= 0, where, "unitPts negatiivinen ennen saatoa: " + (p - (u.adj || 0)), ctx);
  /* Kattohinnan on katettava nykyhinta: se on nykyhinta + auki olevat. */
  check(mx >= p, where, "unitMaxPts " + mx + " < unitPts " + p, ctx);
}

/* Aseistusmalli: rivimaaran on vastattava mallia, ja jokaisen mallirivin
   on loydyttava kortilta. Nain kortti ei voi hiljaa pudottaa asetta. */
function checkArm(u, sh, h, where, ctx){
  const model = api.armModel(u, sh);
  const rows = (h.match(/<tr class="w(?: alt| ammo)?"/g) || []).length;
  check(model.length === rows, where,
        "malli " + model.length + " riviä != kortin " + rows, ctx);
  const grpRows = model.filter(r => r.grp);
  const grpKeys = new Set(grpRows.map(r => r.i));
  const tbodies = (h.match(/<tbody class="g">/g) || []).length;
  /* Ryhma on kortilla valinta vain, kun siina on viela vaihtoehto. Paikka,
     jonka vaihtoehdot ovat poissa (vaihto on otettu), tulostuu tavallisena
     aserivina ilman pyoreaa ruutua ja OR-sanaa - kayttaja 30.9.2026: "(o) OR
     Port weapons battery" tyhjan paalla; app_template.html armRowsHTML "solo",
     BACKLOG J157. Tama tarkistin odotti yha yhta ryhmarunkoa per mallin ryhma,
     ja koska SATUNNAISAJO ohitetaan --quick-ajossa, ero jai huomaamatta
     7.10.2026 asti (281 loydosta). Odotus seuraa nyt kortin saantoa:
     ryhmarunko vain kahden tai useamman rivin paikalle, ja pyorea ruutu vain
     sellaisen paikan riville. Rivimaara (ylla) varmistaa yha, ettei yhtaan
     asetta pudoteta. */
  const slotSize = {};
  grpRows.forEach(r => { slotSize[r.i] = (slotSize[r.i] || 0) + 1; });
  const choiceSlots = Object.keys(slotSize).filter(k => slotSize[k] >= 2).length;
  check(tbodies === choiceSlots, where,
        "ryhma-tbodyja " + tbodies + " != mallin valintapaikkoja " + choiceSlots +
        " (mallin ryhmia " + grpKeys.size + ")", ctx);
  const roundBoxes = (h.match(/<span class="rb(?: on)?"><\/span>/g) || []).length;
  const wantRound = grpRows.filter(r => slotSize[r.i] >= 2 && r.box).length;
  check(roundBoxes === wantRound, where,
        "pyoreita valintaruutuja " + roundBoxes + " != valintapaikkojen riveja " + wantRound, ctx);
  /* Jokaisessa mallin ryhmassa tasan yksi "on". */
  grpKeys.forEach(k => {
    const on = grpRows.filter(r => r.i === k && r.box === "on").length;
    check(on === 1, where, "mallissa ryhmalla " + k + " " + on + " merkittya riviä", ctx);
  });
}

/* Yksikko, jota ostetaan N kappaletta yhdelle kortille: ratkaistun yksikon
   R.squadron - escortit, ja yhden osuman puolustukset, joiden kirjan tyyppi on
   Defence tai Ground (Rulebook s.100). Tyyppisanan lukeminen jatti platformit
   aina yhden kappaleen kokoisiksi. */
function squadOf(u){
  const R = api.resolveUnit(u);
  return R && R.squadron ? R.squadron : null;
}

/* Tahtilinnake (Ramilies s.500, Fortress-Monastery s.110) tulostuu kahtena
   korttina: pohjakortti ja saantokortti. Fleets s.501: "its weapons, hits and
   defences are divided up into four 'quadrants'" - pohjakortilla on siksi
   nelja osumarataa ja neljanneksen aserivit neljaan kertaan, Basilican rivit
   kerran. cardHTML() on parin saantokortti, jolle checkCard ja checkArm
   patevat sellaisinaan (yksi aseistustaulukko, mallin rivimaara); tama
   tarkistaa parin toisen puolen. Muilla yksikoilla kortteja on tasan yksi. */
function checkCards(u, sh, h, where, ctx){
  const R = api.resolveUnit(u) || {};
  let cs;
  try{ cs = api.unitCards(u).map(c => c.html("top")); }
  catch(e){ fail(where, "unitCards heitti: " + e.message, ctx); return; }
  if(R.card !== "fort"){
    check(cs.length === 1 && cs[0] === h, where, "yksikon kortteja " + cs.length + ", odotettu 1", ctx);
    return;
  }
  if(!check(cs.length === 2 && cs[1] === h, where, "linnakkeen kortteja " + cs.length + ", odotettu pari", ctx)) return;
  const plan = cs[0];
  ["undefined", "NaN", "[object Object]"].forEach(bad => {
    check(!plan.includes(bad), where, "pohjakortilla esiintyy " + JSON.stringify(bad), ctx);
  });
  check(plan.length > 500 && /^<div class="k /.test(plan), where, "pohjakortti on tyhja", ctx);
  const act = (R.weapons || []).filter(w => w.state !== "hidden");
  const nq = act.filter(w => w.zone === "quadrant").length, nb = act.filter(w => w.zone === "basilica").length;
  const rows = (plan.match(/<tr style="--rw:#[0-9A-F]{6}">/gi) || []).length;
  check(rows === nq * 4 + nb, where, "pohjakortin aseriveja " + rows + " != " + nq + " x 4 + " + nb, ctx);
  const badges = (plan.match(/class="bg" style="--bd:#[0-9A-F]{6}"/gi) || []).length;
  check(badges === rows, where, "pohjakortin varikoodeja " + badges + " != " + rows, ctx);
  const bands = plan.match(/<div class="k-hits(?: cr)?">[\s\S]*?<\/div>/g) || [];
  const boxes = bands.reduce((a, b) => a + (b.match(/<i>\d+<\/i>/g) || []).length, 0);
  check(boxes === R.stats.hits * 4, where, "pohjakortin osumaruutuja " + boxes + " != " + R.stats.hits + " x 4", ctx);
  check(!/class="k-hits/.test(h), where, "saantokortilla vauriorata, vaikka radat ovat pohjakortilla", ctx);
  /* jokainen saanto on parin jommallakummalla kortilla */
  const text = c => c.replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/\s+/g, " ");
  const both = text(plan) + " " + text(h);
  (R.rules || []).forEach(x => {
    const first = String(x.t || "").replace(/^\*\s*/, "").replace(/\s+/g, " ").slice(0, 40);
    check(both.includes(first), where, "linnakkeen saanto puuttuu parista: " + first, ctx);
  });
}

/* --------------------------------------------------- vaihe A: tilafuzzaus */

function fuzzUnit(li, si, ei, seed){
  const rand = rng(seed);
  const S = api.getS();
  S.li = li; S.limit = 2000; S.units = [];
  const en = LISTS[li].secs[si].ents[ei];
  const sh = SHIPS[String(en.r)];
  const u = { s: si, e: ei, ref: en.r, n: 1, opts: [], os: {}, name: "" };
  api.applyRequired(u);
  S.units.push(u);

  if(squadOf(u)) u.n = 1 + Math.floor(rand() * 6);
  if(rand() < .25) u.name = "Testinimi " + Math.floor(rand() * 1000);
  if(rand() < .15) u.note = "Fleet note " + Math.floor(rand() * 100);
  if(rand() < .10) u.adj = Math.floor(rand() * 40) - 10;
  if(en.p == null) u.custom = Math.floor(rand() * 300);

  (sh.ol || []).forEach((o, i) => {
    if(rand() < .75) api.setOptState(u, i, STATES[Math.floor(rand() * 3)]);
  });
  const ups = api.upgradesFor(u);
  ups.own.concat(ups.other).forEach(x => {
    if(rand() < .6) api.setUpState(u, x[0], x[1], STATES[Math.floor(rand() * 3)]);
  });

  const ctx = { list: LISTS[li].nm, ship: sh.nm, seed,
                os: JSON.stringify(u.os), ups: JSON.stringify(u.ups || {}) };
  const where = "A tilafuzzaus";
  let h;
  try{
    h = api.cardHTML(u, "top");
  }catch(e){
    fail(where, "cardHTML heitti: " + e.message, ctx);
    return;
  }
  check(typeof h === "string" && h.length > 500, where, "kortti on tyhja", ctx);
  if(typeof h !== "string") return;
  checkCard(h, where, ctx);
  checkArm(u, sh, h, where, ctx);
  checkCards(u, sh, h, where, ctx);
  checkPoints(u, where, ctx);
  cases++;
}

/* Rungoton kappalerivi (Orbital mine s.512, Minefield s.513): saantokortti,
   jonka kirjausruutuja on ostettujen maara ja jonka hinta on kappalehinta
   kertaa maara (s.499:n hintarivi). */
function fuzzRule(li, si, ei, seed){
  const rand = rng(seed);
  const S = api.getS();
  S.li = li; S.limit = 2000; S.units = [];
  const en = LISTS[li].secs[si].ents[ei];
  const u = { s: si, e: ei, ref: null, n: 1 + Math.floor(rand() * 12), opts: [], os: {}, name: "" };
  api.applyRequired(u);
  S.units.push(u);
  if(rand() < .15) u.note = "Fleet note " + Math.floor(rand() * 100);
  if(rand() < .10) u.adj = Math.floor(rand() * 40) - 10;
  const ctx = { list: LISTS[li].nm, ship: en.l, seed, os: "n=" + u.n };
  const where = "A saantokortti";
  let h;
  try{ h = api.cardHTML(u, "top"); }
  catch(e){ fail(where, "cardHTML heitti: " + e.message, ctx); return; }
  check(typeof h === "string" && h.length > 500, where, "saantokortti on tyhja", ctx);
  if(typeof h !== "string") return;
  ["undefined", "NaN", "[object Object]"].forEach(bad => {
    check(!h.includes(bad), where, "saantokortilla esiintyy " + JSON.stringify(bad), ctx);
  });
  const R = api.resolveUnit(u) || {};
  const ticks = h.split('<i class="rtk"></i>').length - 1, sizes = h.split('<i class="rwr"></i>').length - 1;
  if(R.ruleCard && R.ruleCard.track && R.ruleCard.track.kind === "size")
    check(sizes === 2 * u.n && ticks === 0, where, "kokoruutuja " + sizes + " != 2 x " + u.n, ctx);
  else
    check(ticks === u.n, where, "rastiruutuja " + ticks + " != ostettuja " + u.n, ctx);
  check(api.unitPts(u) === en.p * u.n + (u.adj || 0), where,
        "hinta " + api.unitPts(u) + " != " + en.p + " x " + u.n + " + saato " + (u.adj || 0), ctx);
  checkCards(u, null, h, where, ctx);
  checkPoints(u, where, ctx);
  cases++;
}

/* ------------------------------------------- vaihe B: aariarvot per alus */

function extremes(li, si, ei){
  const S = api.getS();
  const en = LISTS[li].secs[si].ents[ei];
  const sh = SHIPS[String(en.r)];
  ["off", "opt", "take"].forEach(st => {
    S.li = li; S.limit = 2000; S.units = [];
    const u = { s: si, e: ei, ref: en.r, n: 1, opts: [], os: {}, name: "" };
    api.applyRequired(u);
    S.units.push(u);
    if(squadOf(u)) u.n = st === "take" ? 6 : 1;
    (sh.ol || []).forEach((o, i) => api.setOptState(u, i, st));
    const ups = api.upgradesFor(u);
    ups.own.concat(ups.other).forEach(x => api.setUpState(u, x[0], x[1], st));
    const ctx = { list: LISTS[li].nm, ship: sh.nm, all: st };
    const where = "B aariarvo kaikki=" + st;
    let h;
    try{
      h = api.cardHTML(u, "top");
    }catch(e){
      fail(where, "cardHTML heitti: " + e.message, ctx);
      return;
    }
    checkCard(h, where, ctx);
    checkArm(u, sh, h, where, ctx);
    checkCards(u, sh, h, where, ctx);
    checkPoints(u, where, ctx);
    /* Kaikki otettuna hinnan on oltava vahintaan runkohinta - miinus ne
       optiot jotka kirjan mukaan HALVENTAVAT alusta. Niita on nelja
       (Mercury -20, Victory -10, Dominator -5, Warsphere -20), ja
       kaikki otettuna ne kuuluvatkin hintaan. */
    if(st === "take" && en.p != null){
      const drop = (sh.ol || []).reduce((a, o) =>
        a + (o.c < 0 ? o.c * (squadOf(u) ? api.hulls(u) : 1) : 0), 0);
      /* ...ja prosenttialennukset: Webway Portalin kautta ostettu alus
         maksaa puolet (Fleets s.337, J175), kaikki otettuna myos se. */
      const pct = ups.own.concat(ups.other).reduce((a, x) => a + (x[2].pct < 0 ? x[2].pct : 0), 0);
      const floor = Math.floor((en.p + drop) * (100 + pct) / 100);
      check(api.unitPts(u) >= floor, where,
            "kaikki otettuna hinta " + api.unitPts(u) + " < runko " +
            en.p + (drop ? " " + drop : "") + (pct ? " " + pct + " %" : ""), ctx);
    }
    cases++;
  });
}

/* ------------------------------------------- vaihe C: laivastotaso + save */

function fuzzFleet(li, seed){
  const rand = rng(seed);
  const S = api.getS();
  S.li = li; S.limit = [750, 1000, 1500, 2000][Math.floor(rand() * 4)];
  S.units = [];
  const picks = [];
  LISTS[li].secs.forEach((sec, si) => sec.ents.forEach((en, ei) => {
    if(en.r && SHIPS[String(en.r)]) picks.push([si, ei]);
    else if(!en.r && en.k === "unit" && en.cnt) picks.push([si, ei]);   /* miinat, miinakentat */
  }));
  if(!picks.length) return;
  const n = 1 + Math.floor(rand() * 12);
  for(let i = 0; i < n; i++){
    const [si, ei] = picks[Math.floor(rand() * picks.length)];
    const en = LISTS[li].secs[si].ents[ei];
    const u = { s: si, e: ei, ref: en.r || null, n: 1, opts: [], os: {}, name: "" };
    api.applyRequired(u);
    if(api.isEscort(u) || !en.r) u.n = 1 + Math.floor(rand() * 6);
    if(en.p == null) u.custom = Math.floor(rand() * 200);
    const sh = en.r ? SHIPS[String(en.r)] : {};
    (sh.ol || []).forEach((o, k) => {
      if(rand() < .5) api.setOptState(u, k, STATES[Math.floor(rand() * 3)]);
    });
    S.units.push(u);
  }
  const ctx = { list: LISTS[li].nm, seed, units: S.units.length };
  const where = "C laivasto";
  let tot, mx, ch;
  try{
    tot = api.total(); mx = api.totalMax(); ch = api.checks();
  }catch(e){
    fail(where, "laivastolaskenta heitti: " + e.message, ctx);
    return;
  }
  check(Number.isFinite(tot), where, "total ei ole luku: " + tot, ctx);
  check(Number.isFinite(mx), where, "totalMax ei ole luku: " + mx, ctx);
  check(mx >= tot, where, "totalMax " + mx + " < total " + tot, ctx);
  check(Array.isArray(ch), where, "checks ei palauta listaa", ctx);
  ch.forEach(c => {
    check(typeof c.ok === "boolean", where, "tarkistusrivilta puuttuu ok", ctx);
    check(!String(c.v).includes("NaN"), where, "tarkistusrivilla NaN: " + c.v, ctx);
  });

  /* Tallenna ja lataa: tilan on sailyttava. */
  const before = { tot, mx, units: S.units.length,
                   os: S.units.map(u => JSON.stringify(u.os || {})).join("|") };
  try{
    api.save();
    api.load();
  }catch(e){
    fail(where, "save/load heitti: " + e.message, ctx);
    return;
  }
  const S2 = api.getS();
  check(S2.units.length === before.units, where,
        "latauksen jalkeen " + S2.units.length + " yksikkoa, oli " + before.units, ctx);
  const after = { tot: api.total(), mx: api.totalMax(),
                  os: S2.units.map(u => JSON.stringify(u.os || {})).join("|") };
  check(after.tot === before.tot, where,
        "pisteet muuttuivat tallennuksessa " + before.tot + " -> " + after.tot, ctx);
  check(after.mx === before.mx, where,
        "kattohinta muuttui tallennuksessa " + before.mx + " -> " + after.mx, ctx);
  check(after.os === before.os, where, "optiotilat muuttuivat tallennuksessa", ctx);
  cases++;
}

/* ---------------------------------------------------------------- ajo */

console.log("Rasitustesti: " + ROUNDS + " satunnaiskierrosta / alus\n");

let seed = 1;
LISTS.forEach((L, li) => {
  L.secs.forEach((sec, si) => sec.ents.forEach((en, ei) => {
    if(!en.r && en.k === "unit" && en.cnt){
      /* rungoton saantokorttirivi: oma siemenavaruus, jotta alusten siemenet
         (ja niiden toistettavuus) eivat siirry */
      for(let r = 0; r < ROUNDS; r++) fuzzRule(li, si, ei, 900000 + li * 1000 + si * 50 + ei * 7 + r);
      return;
    }
    if(!en.r || !SHIPS[String(en.r)]) return;
    for(let r = 0; r < ROUNDS; r++) fuzzUnit(li, si, ei, seed++);
    extremes(li, si, ei);
  }));
  for(let r = 0; r < 8; r++) fuzzFleet(li, seed++);
});

const byMsg = {};
found.forEach(f => {
  const key = f.where + " | " + f.msg.replace(/\d+/g, "N");
  (byMsg[key] = byMsg[key] || []).push(f);
});
Object.entries(byMsg).sort((a, b) => b[1].length - a[1].length).forEach(([k, v]) => {
  console.log("\n== " + k + "  (" + v.length + ") ==");
  v.slice(0, VERBOSE ? 20 : 4).forEach(f => {
    console.log("   " + f.ctx.list + " | " + (f.ctx.ship || "-") + " | " +
                f.msg.slice(0, 90));
    if(f.ctx.seed) console.log("      seed " + f.ctx.seed +
      (f.ctx.os ? "  os=" + String(f.ctx.os).slice(0, 90) : ""));
  });
});

console.log("\nTapauksia " + cases + ", tarkistuksia " + checksRun +
            ", loydoksia " + found.length);
process.exitCode = found.length ? 1 : 0;
