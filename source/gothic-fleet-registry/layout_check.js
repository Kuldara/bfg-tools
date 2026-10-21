/* Tulostuksen luettavuusraja mitattuna (kohta 10, docs/DEFINITION_OF_DONE.md).
 *
 * Jokaisesta listarivista rakennetaan kaksi korttia samalla cardHTML():lla
 * kuin sovellus: oletus, ja "kaikki valinnat" (jokainen optio ja tarjottu
 * listapaivitys otettuna, nimi, note, +pts ja saattueen jasenet). Kortit
 * sovitetaan headless-Chromessa sovelluksen omalla fitCards():lla ja
 * mitataan:
 *
 *   print_overflows          kortti, jonka sisalto ei mahdu edes 240 askeleen
 *                            kutistuksen jalkeen (data-content-overflow)
 *   unreadable_print_cases   kortti, jonka jokin tekstilohko painuu alle
 *                            luettavuusrajan: lohkon suunnittelukoko (pt)
 *                            x fit-content-skaala x kortin skaala < FLOOR
 *
 * Raja FLOOR on 4.2 pt (A4, 100 %): kortin pienin suunnittelukoko on 4.6 pt
 * (vauriolaatikon huomautus), joten 4.2 tarkoittaa ettei mikaan ensisijainen
 * teksti painu alle ~90 %:n suunnitellusta. Mitattavat lohkot ovat
 * BLOCKS-taulussa; option kuvaushanta, criticalin alarivi ja "or"-merkinta
 * ovat suunniteltuja pienempia (3.8-4.45 pt) eivatka kuulu mittariin.
 * Sovitus tehdaan vasta document.fonts.ready:n jalkeen - upotetut fontit
 * latautuvat ensimmaisesta kaytosta, ja sita ennen tehty sovitus mittaa
 * varafontin. Perustelu ja mittaustapa: docs/DEFINITION_OF_DONE.md,
 * "5. Tulostus on kayttokelpoinen".
 *
 * Aja:  node layout_check.js            yhteenveto + pahimmat kortit
 *       node layout_check.js --json     koneluettava (acceptance.py kayttaa)
 *       node layout_check.js --keep     jata _layout_*.html tarkasteltavaksi
 *       node layout_check.js --list Ork vain listat joiden nimi sisaltaa
 */
"use strict";
const fs = require("fs"), path = require("path"), os = require("os");
const { execFileSync } = require("child_process");
const HERE = __dirname;
const AS_JSON = process.argv.includes("--json");
const KEEP = process.argv.includes("--keep");
const FLOOR = (() => { const i = process.argv.indexOf("--floor"); return i > 0 ? parseFloat(process.argv[i + 1]) : 4.2; })();
const ONLY = (() => { const i = process.argv.indexOf("--list"); return i > 0 ? process.argv[i + 1] : null; })();

/* ---- sovellus Nodessa (sama tynka kuin muissa ajureissa) ------------- */
const els = {};
const mk = () => ({ textContent: "", innerHTML: "", value: "", className: "", dataset: {}, style: {}, id: "", hidden: false,
  querySelectorAll: () => [], querySelector: () => null, appendChild(){}, removeChild(){}, addEventListener(){}, setAttribute(){}, getAttribute: () => "", closest: () => mk(), classList: { add(){}, remove(){}, toggle(){}, contains: () => false } });
const el = k => (els[k] || (els[k] = mk()));
global.document = { getElementById: id => id === "bfgdata" ? { textContent: fs.readFileSync(path.join(HERE, "bfg_data.json"), "utf8") } : el("#" + id),
  querySelector: s => el(s), querySelectorAll: () => [], createElement: () => mk(), head: { appendChild(){} }, body: { appendChild(){}, removeChild(){}, dataset: {}, classList: { add(){}, remove(){} } }, addEventListener(){} };
global.window = { addEventListener(){}, print(){}, matchMedia: () => ({ matches: false, addEventListener(){} }) };
if (!global.navigator) Object.defineProperty(global, "navigator", { value: {}, configurable: true });
global.alert = () => {}; global.confirm = () => true; global.localStorage = { getItem: () => null, setItem(){}, removeItem(){} };
const html = fs.readFileSync(path.join(HERE, "Gothic Fleet Registry.html"), "utf8");
const js = html.split("<script>")[1].split("</script>")[0].replace(/^"use strict";/, "");
const api = new Function(js + "\n;return {LISTS,SHIPS,addUnit,addUnitFrom,setOptState,setUpState,cardHTML,unitCards,resolveUnit,upgradesFor,fitCards,getS:()=>S};")();
/* Kaikki style-lohkot: build.py upottaa kirjasimet omaan lohkoonsa ennen
   sovelluksen CSS:aa, ja pelkka ensimmainen lohko jattaisi kortit tyylittomiksi. */
const css = [...html.matchAll(/<style>([\s\S]*?)<\/style>/g)].map(m => m[1]).join(String.fromCharCode(10));

/* ---- kortit --------------------------------------------------------- */
const cards = [];
/* Kortin laji yhteenvetoa varten: uudet lajit (linnakkeen pohja- ja
   saantokortti, saantokortti, puolustuslaivue, monen osuman asema) on
   nahtava MITATTUINA, ei ohitettuina - kortti, josta ei loydy yhtaan
   mitattavaa lohkoa, ei voi olla lukukelvoton, ja mittari olisi vihrea ja
   sokea. */
const kindOf = {};
/* Yksikon kaikki kortit (unitCards): linnake (Ramilies s.500, Fortress-
   Monastery s.110) tulostuu kahtena korttina, ja molemmat mitataan. */
function pushCards(u, key, variant, pos, sec) {
  const R = api.resolveUnit(u) || {};
  const cs = api.unitCards(u);
  cs.forEach(c => {
    const part = cs.length > 1 ? (c.id === "plan" ? " [pohjakortti]" : " [saantokortti]") : "";
    const id = key + part + " | " + variant;
    kindOf[id] = R.card === "fort" ? (c.id === "plan" ? "linnake: pohjakortti" : "linnake: saantokortti")
      : R.card === "rule" ? "saantokortti"
      : sec && sec.ct === "defence" ? (R.card === "squadron" ? "puolustuslaivue" : "puolustusasema (capital)")
      : R.kind === "commander" ? "komentaja" : R.card === "squadron" ? "laivue" : "alus";
    cards.push({ id, html: c.html(pos) });
  });
  return cs.length;
}
api.LISTS.forEach((L, li) => {
  if (ONLY && !L.nm.includes(ONLY)) return;
  api.getS().li = li; api.getS().limit = 100000;
  L.secs.forEach((sec, si) => sec.ents.forEach((en, ei) => {
    /* Rivi ilman runkoa: komentaja, tai saantokorttirivi (Orbital mine
       s.512, Minefield s.513 - ostettava puolustus, jolla ei ole profiilia
       mutta on kortti). Paivitysrivilla ja pelkalla listaoptiolla ei ole
       korttia: unitCards() palauttaa niille tyhjan. */
    if (en.k === "up") return;
    api.getS().units = []; api.addUnit(si, ei);
    const u = api.getS().units[0]; if (!u) return;
    const key = L.nm + " | " + sec.t + " | " + en.l;
    if (!pushCards(u, key, "oletus", "a", sec)) return;
    /* "kaikki valinnat" rungottomalle kappalerivilla: rivin oma ylaraja
       (s.499: 0-2 Minefields) tai kaksitoista miinaa - kirjausruutuja on
       yksi per ostettu, ja niiden on mahduttava. */
    if (!en.r && en.cnt) u.n = en.mx || 12;
    const sh = api.SHIPS[String(en.r)];
    if (sh) (sh.ol || []).forEach((o, i) => { try { api.setOptState(u, i, "take"); } catch (e) {} });
    /* Listapaivityksista vain rivin OMAT (own): laivastonlaajuisten (other)
       ottaminen kaikki kerralla ei ole laillinen kokoonpano (Gubbinit,
       bio-enhancementit ovat rajattuja), eika kortin tarvitse kestaa sita. */
    const ups = api.upgradesFor(u); ups.own.forEach(x => { try { api.setUpState(u, x[0], x[1], "take"); } catch (e) {} });
    u.name = "Righteous Fury of the Emperor"; u.note = "Refit: reinforced prow armour"; u.adj = 5; u.members = "Alpha, Beta, Gamma, Delta, Epsilon, Zeta";
    pushCards(u, key, "kaikki", "b", sec);
  }));

  /* Lainalaiva (1.1): kortti saa alaotsikkoonsa roolin ja lahjoittajalistan,
     eli kaksi sanaa ja listan koko nimen lisaa. Marginaali on 0,04 pt, joten
     se on mitattava - mutta vain kerran per lista, koska lisays riippuu
     listan NIMESTA eika rivista. Valitaan rivi, jonka nimi on pisin: se
     yhdessa listan nimen kanssa tekee pisimman alaotsikon. */
  let worst = null;
  L.secs.forEach((sec, si) => sec.ents.forEach((en, ei) => {
    /* Planeettapuolustusta ei lainata (reservi ja liittolainen ovat listan
       ALUKSIA, Fleets s.14 ja s.16), joten lainalaivan mittaus pysyy
       listan omissa aluksissa. */
    if (!en.r || sec.ct === "defence") return;
    if (!worst || String(en.l).length > String(worst.en.l).length)
      worst = { si, ei, en, sec };
  }));
  if (worst) {
    const host = (li + 1) % api.LISTS.length;     /* jokin muu lista isannaksi */
    api.getS().li = host; api.getS().units = [];
    api.addUnitFrom(li, worst.si, worst.ei, "reserve");
    const bu = api.getS().units[0];
    if (bu) pushCards(bu, L.nm + " | " + worst.sec.t + " | " + worst.en.l, "lainalaiva", "c", worst.sec);
    api.getS().li = li;
  }
});
if (!cards.length) { console.error("ei kortteja"); process.exit(2); }

/* ---- mittaussivu ------------------------------------------------------ */
const fit = api.fitCards.toString();
const PAGE_SCRIPT = `
var $ = function(q){ return document.querySelector(q); };
${fit}
/* Fonts first: the embedded fonts load on first use, and a fit made before
   that measures the fallback font. Print and the downloaded file wait the
   same way. */
(document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(function(){
fitCards();
  var pt = function(px){ return px * 72 / 96; };
  /* Lohkon tyyppi on ensimmainen valitsin, joka lohkosta loytyy, ja sen
     koko on lohkon mitta - siksi lohkon PIENIN ensisijainen teksti on
     listassa ennen suurempia. Linnakkeen pohjakortin omat luokat ovat ensin:
     neljanneksen ja Basilican kriittisruutujen nimet (.fct u, 4,4 pt) ovat
     lohkonsa pienin teksti, samoin re-roll-ruutujen sana ja special order
     -merkit sarakkeen laatikoissa. Niita ei ole muilla korteilla, joten
     muiden korttien mittaus ei muutu. Saantokortin vaiheet (.rstep p),
     johdanto (.rlead) ja miinakentan kokoruudut (.rsz) ovat lopussa. */
  var BLOCKS = [
    ["fort criticals", ".fct u"], ["fort re-rolls", ".fcol i.rrb"], ["fort orders", ".ford"],
    ["rules", ".k-sr li"], ["options", ".k-opt .tx > b"], ["armament", ".k-arm td"],
    ["critical", ".k-crit b"], ["hulk criticals", ".k-hcrit b"], ["damage", ".k-note"], ["squadron", ".k-sq span"],
    ["members", ".k-mem u"], ["gifts", ".k-gg u"],
    ["fort weapons", ".fq-arm td"], ["rule lead", ".rlead"], ["rule steps", ".rstep p"], ["rule sizes", ".rsz"]
  ];
  var out = [];
  document.querySelectorAll("#sheet .k").forEach(function(card){
    var cardScale = parseFloat(card.dataset.cardScale || "1");
    var overflow = card.dataset.contentOverflow === "true";
    var blocks = [];
    card.querySelectorAll(".k-box > .k-bd > .fit-content").forEach(function(c){
      var fs = parseFloat(c.dataset.fitScale || "1");
      var type = null, base = null;
      for (var i = 0; i < BLOCKS.length; i++){
        var e = c.querySelector(BLOCKS[i][1]);
        if (e){ type = BLOCKS[i][0]; base = pt(parseFloat(getComputedStyle(e).fontSize)); break; }
      }
      if (!type) return;
      blocks.push({ type: type, fit: +fs.toFixed(3), base: +base.toFixed(2), eff: +(base * fs * cardScale).toFixed(2),
                    overflow: c.dataset.fitOverflow === "true" });
    });
    var arm = 99;
    card.querySelectorAll(".k-arm td").forEach(function(td){
      var v = pt(parseFloat(getComputedStyle(td).fontSize)) * cardScale;
      if (v < arm) arm = v;
    });
    var title = card.querySelector(".k-hd h3");
    /* The stats row (katselmointi 5.10.2026): its cells are not fit-content
       blocks, so a cell whose content ran past its edge was never measured -
       Lord Admiral Rath's five re-roll boxes pushed their caption under the
       ASSIGNED TO box. A cell overflows when its value line is wider than
       the cell lets it be. */
    var stOver = [];
    card.querySelectorAll(".k-st > div").forEach(function(cell){
      cell.querySelectorAll(".v, .rrh").forEach(function(row){
        if(row.scrollWidth > row.clientWidth + 1){
          var lab = cell.querySelector("span");
          stOver.push((lab ? lab.textContent : "?") + " +" + (row.scrollWidth - row.clientWidth) + "px");
        }
      });
    });
    if(stOver.length) overflow = true;
    /* Uusien korttilajien geometria (linnakkeen pohjakortti, saantokortti):
       fitCards skaalaa lohkon KORKEUDEN mukaan, joten vaakasuunnassa
       laatikostaan ulos kasvanut sisalto leikkautuisi overflow:hidden-reunaan
       ilman mitaan merkkia - nain kavi pohjakortin asetaulukolle, kun
       Fortress-Monasteryn "Thunderhawk: 20 cm" leveni neljanneksen yli.
       Pohjakortilla Basilica-keskio on lisaksi neljannesten paalla: se ei
       saa peittaa otsikkoa, osumarataa eika aserivia (kriittisruudut vaistavat
       sen omalla marginaalillaan). Kumpikin on ylivuoto. */
    var geo = [];
    if(card.classList.contains("fortp") || card.classList.contains("rulek") || card.classList.contains("fortr")){
      card.querySelectorAll(".k-box > .k-bd").forEach(function(bd){
        /* Piirretyt reunat, ei scrollWidth: skaalatun lohkon asettelulaatikko
           on tarkoituksella laatikkoaan leveampi (width 100/k %), ja vasta
           transform tuo sen takaisin. Mitataan siis se, mita paperille tulee. */
        var br = bd.getBoundingClientRect(), worst = 0, who = "";
        bd.querySelectorAll("table, tr, td, li, p, h5, h6, span, i, u, b").forEach(function(e){
          var r = e.getBoundingClientRect();
          if(r.width && r.right - br.right > worst){ worst = r.right - br.right; who = e.tagName.toLowerCase() + (e.className ? "." + e.className : ""); }
        });
        if(worst > 1){
          var hd = bd.parentElement.querySelector("h4,h5,h6");
          geo.push("sisalto leveampi kuin laatikko: " + (hd ? hd.textContent.slice(0, 24) : "?") + " " + who + " +" + worst.toFixed(1) + "px");
        }
      });
    }
    var hub = card.querySelector(".fbas");
    if(hub){
      var hr = hub.getBoundingClientRect();
      card.querySelectorAll(".fq h5, .fq .k-hits, .fq .k-cr, .fq .fq-arm tr, .fq .fct span").forEach(function(e){
        var r = e.getBoundingClientRect();
        if(r.right > hr.left + .5 && r.left < hr.right - .5 && r.bottom > hr.top + .5 && r.top < hr.bottom - .5)
          geo.push("Basilica peittaa: " + e.tagName.toLowerCase() + (e.className ? "." + e.className : ""));
      });
      /* neljannes ja keskio eivat saa valua kortin sisareunan yli */
      var kr = card.getBoundingClientRect();
      card.querySelectorAll(".fq, .fbas, .fcol > .k-box").forEach(function(e){
        var r = e.getBoundingClientRect();
        if(r.right > kr.right + .5 || r.bottom > kr.bottom + .5 || r.left < kr.left - .5 || r.top < kr.top - .5)
          geo.push("kortin ulkopuolella: " + e.className);
      });
    }
    /* v1.2: lohko, jonka fitCards kasvatti (skaala > 1), ei saa katkaista
       asetaulukon solua - nimi, kantama tai vahvuus kolmen pisteen taakse
       olisi huonompi kuin pienempi teksti. */
    card.querySelectorAll(".k-box > .k-bd > .fit-content").forEach(function(c){
      if(parseFloat(c.dataset.fitScale || "1") <= 1.001) return;
      /* Mitataan piirretty sisalto, ei scrollWidth: solu, jossa luvun alla
         on kirjoitusruutu (Kroot Warsphere, "12" + ruutu), rivittyy siististi
         kahdelle riville ja ruutu on kokonaan solun sisalla, mutta Chrome
         raportoi silti scrollWidth 40 > clientWidth 29 (mitattu 12.10.2026).
         Katkennut nimi sen sijaan ulottuu solun reunan yli. */
      c.querySelectorAll(".k-arm td.nm, .k-arm td.rg, .k-arm td.st").forEach(function(td){
        var range = document.createRange(); range.selectNodeContents(td);
        var cr = range.getBoundingClientRect(), tr = td.getBoundingClientRect();
        if(cr.width && (cr.right > tr.right + .5 || cr.left < tr.left - .5))
          geo.push("kasvatetun taulukon solu katkeaa: " + td.textContent.replace(/\s+/g, " ").trim().slice(0, 32));
      });
    });
    /* v1.2 (kayttaja 12.10.2026): "tuo STR sarakkeen kirjoituskentta menee
       vahan hassusti, voisivat olla perakkain" - kirjoitusruutu on samalla
       rivilla kuin lukunsa, ei sen alla. */
    card.querySelectorAll(".k-arm td.st .wi").forEach(function(wi){
      var td = wi.parentNode, range = document.createRange();
      var tn = null; td.childNodes.forEach(function(n){ if(!tn && n.nodeType === 3 && n.nodeValue.trim()) tn = n; });
      var first = td.firstElementChild && td.firstElementChild !== wi ? td.firstElementChild : null;
      if(tn) range.selectNodeContents(tn); else if(first) range.selectNodeContents(first); else return;
      var a = range.getBoundingClientRect(), b = wi.getBoundingClientRect();
      if(a.height && b.top > a.bottom - 1) geo.push("kirjoitusruutu on luvun alla, ei vieressa: " + td.textContent.replace(/\s+/g, " ").trim().slice(0, 16));
    });
    /* v1.2 (kayttaja 12.10.2026, valinta C): port- ja starboard-rivi parina.
       Yhteinen merkki piirretaan kahtena puolikkaana, yksi kummallakin
       rivilla: niiden on kohdattava rivien rajalla ja oltava samassa
       sarakkeessa, muuten merkki nakyy katkenneena. Kantama ja vahvuus ovat
       yksi kahden rivin korkuinen solu, ja "each" on luvun ALLA, ei vieressa
       (vieressa se leventaisi saraketta ja pysayttaisi taulukon kasvun). */
    var pairs = 0;
    card.querySelectorAll(".k-arm tr[data-pair='1']").forEach(function(tr){
      pairs++;
      var nx = tr.nextElementSibling, what = tr.textContent.replace(/\s+/g, " ").trim().slice(0, 24);
      if(!nx || nx.dataset.pair !== "2"){ geo.push("parin alempi rivi puuttuu: " + what); return; }
      var a = tr.querySelector(".pj"), b = nx.querySelector(".pj");
      if(!a || !b){ geo.push("parin yhteinen merkki puuttuu: " + what); return; }
      var ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect();
      if(!(ra.height > 2 && rb.height > 2 && ra.width > 2)) geo.push("parin merkilla ei ole kokoa: " + what);
      /* alempi puolikas piirretaan tarkoituksella hiuksen verran (0,15 mm)
         ylemman paalle, ettei skaalatun lohkon rajalle jaa vaaleaa saumaa:
         rako ei kay, pieni paallekkaisyys kay */
      else if(ra.bottom - rb.top < -.5 || ra.bottom - rb.top > 2.5 || Math.abs(ra.left - rb.left) > .5 || Math.abs(ra.width - rb.width) > .5)
        geo.push("parin merkin puolikkaat eivat kohtaa: " + what + " " + (ra.bottom - rb.top).toFixed(1) + "/" + (ra.left - rb.left).toFixed(1) + "px");
      var rg = tr.querySelector("td.rg"), st = tr.querySelector("td.st");
      if(!rg || !st || rg.rowSpan !== 2 || st.rowSpan !== 2 || nx.querySelector("td.rg, td.st")) geo.push("parin kantama tai vahvuus ei ole yhteinen solu: " + what);
      var ea = st && st.querySelector(".ea");
      if(!ea) geo.push("parin vahvuudelta puuttuu each: " + what);
      else {
        var range = document.createRange(), tn = null;
        st.childNodes.forEach(function(n){ if(!tn && (n.nodeType === 3 ? n.nodeValue.trim() : n !== ea)) tn = n; });
        if(tn){ range.selectNodeContents(tn); var rn = range.getBoundingClientRect(), re = ea.getBoundingClientRect();
          /* keskikohdista: tekstin laatikko on rivia korkeampi, joten reunat menevat aina hieman limittain */
          if(rn.height && (re.top + re.bottom) / 2 - (rn.top + rn.bottom) / 2 < rn.height * .4) geo.push("each on luvun vieressa, ei alla: " + what); }
        var tdr = st.getBoundingClientRect(), rr = ea.getBoundingClientRect();
        if(rr.bottom > tdr.bottom + .5 || rr.right > tdr.right + .5 || rr.left < tdr.left - .5) geo.push("each ei mahdu soluunsa: " + what);
      }
    });
    if(geo.length) overflow = true;
    /* v1.2: sektorikuvakkeen koko ilman lohkon skaalaa (mm) ja lyhennettyjen asenimien maara */
    var arcMm = null;
    card.querySelectorAll(".k-arm tr.w:not(.alt):not(.ammo) .arcg").forEach(function(g){
      /* svg-elementilla ei ole offsetWidthia: laskettu leveys on CSS-mitta ilman lohkon skaalaa */
      var mm = parseFloat(getComputedStyle(g).width) * 25.4 / 96; if(isFinite(mm) && (arcMm == null || mm < arcMm)) arcMm = mm; });
    out.push({ id: card.dataset.layoutId, cardScale: +cardScale.toFixed(3), overflow: overflow, blocks: blocks, stOver: stOver, geo: geo,
               arcMm: arcMm == null ? null : +arcMm.toFixed(2), abbr: card.querySelectorAll(".k-arm td.nm[data-abbr]").length, pairs: pairs,
               armMin: arm === 99 ? null : +arm.toFixed(2),
               titlePt: title ? +(pt(parseFloat(getComputedStyle(title).fontSize)) * cardScale).toFixed(2) : null });
  });
  var pre = document.createElement("pre"); pre.id = "report";
  pre.textContent = JSON.stringify(out);
  document.body.appendChild(pre);
});`;

const CHROMES = [
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
];
const chrome = CHROMES.find(p => fs.existsSync(p));
if (!chrome) { console.error("headless-selainta ei loydy: " + CHROMES.join(", ")); process.exit(2); }

function pageOf(chunk) {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>layout</title>
<style>${css}
*,*::before,*::after{animation:none!important;transition:none!important}
html,body{margin:0;padding:0;background:#fff}
#sheet{display:block}
#sheet .page{margin:0 0 4mm;box-shadow:none;position:relative;width:auto;height:auto;background:transparent;overflow:visible}
#sheet .k{position:relative!important;left:0!important;top:0!important}
</style></head><body><div class="sheet" id="sheet">${
  chunk.map(c => `<div class="page">${c.html.replace(/^<div class="k /, `<div data-layout-id="${c.id.replace(/"/g, "&quot;")}" class="k `)}</div>`).join("\n")
}</div><script>${PAGE_SCRIPT}</script></body></html>`;
}

const results = [];
const CHUNK = 120;
for (let i = 0; i < cards.length; i += CHUNK) {
  const chunk = cards.slice(i, i + CHUNK);
  const tmp = path.join(HERE, "_layout_" + (i / CHUNK) + ".html");
  fs.writeFileSync(tmp, pageOf(chunk), "utf8");
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), "bfglayout-"));
  const url = "file:///" + encodeURI(tmp.replace(/\\/g, "/"));
  let dom;
  try {
    dom = execFileSync(chrome, ["--headless=new", "--disable-gpu", "--no-sandbox", "--user-data-dir=" + profile,
      "--virtual-time-budget=15000", "--dump-dom", url], { maxBuffer: 1 << 28, stdio: ["ignore", "pipe", "ignore"] }).toString("utf8");
  } finally {
    if (!KEEP) try { fs.unlinkSync(tmp); } catch (e) {}
    try { fs.rmSync(profile, { recursive: true, force: true }); } catch (e) {}
  }
  const m = dom.match(/<pre id="report">([\s\S]*?)<\/pre>/);
  if (!m) { console.error("mittausraportti puuttuu Chromen tulosteesta (lohko " + i + ")"); process.exit(2); }
  const txt = m[1].replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
  JSON.parse(txt).forEach(r => results.push(r));
}

/* ---- yhteenveto ------------------------------------------------------- */
results.forEach(r => {
  const effs = r.blocks.map(b => b.eff).concat(r.armMin != null ? [r.armMin] : []);
  r.minEff = effs.length ? Math.min.apply(null, effs) : null;
  r.worst = r.blocks.reduce((w, b) => (!w || b.eff < w.eff) ? b : w, null);
});
const overflows = results.filter(r => r.overflow);
const unreadable = results.filter(r => r.minEff != null && r.minEff < FLOOR);
const byVariant = v => unreadable.filter(r => r.id.endsWith("| " + v)).length;
/* Lajikohtainen yhteenveto: montako korttia, montako niista mitattiin ja
   lajin pienin tekstikoko. "mitattuja < kortteja" tarkoittaa, etta kortilta
   ei loytynyt yhtaan mitattavaa lohkoa. */
const kinds = {};
results.forEach(r => {
  const k = kindOf[r.id] || "?";
  const o = kinds[k] || (kinds[k] = { cards: 0, measured: 0, min_pt: null, overflows: 0, unreadable: 0 });
  o.cards++;
  if (r.minEff != null) { o.measured++; if (o.min_pt == null || r.minEff < o.min_pt) o.min_pt = r.minEff; }
  if (r.overflow) o.overflows++;
  if (r.minEff != null && r.minEff < FLOOR) o.unreadable++;
});
const sorted = results.filter(r => r.minEff != null).slice().sort((a, b) => a.minEff - b.minEff);
const median = sorted.length ? sorted[Math.floor(sorted.length / 2)].minEff : null;
const summary = {
  cards: results.length, measured: sorted.length, floor_pt: FLOOR,
  print_overflows: overflows.length, unreadable_print_cases: unreadable.length,
  unreadable_default: byVariant("oletus"), unreadable_all_options: byVariant("kaikki"),
  min_pt: sorted.length ? sorted[0].minEff : null, median_min_pt: median,
  worst: sorted.slice(0, 12).map(r => ({ id: r.id, minEff: r.minEff, cardScale: r.cardScale,
    block: r.worst ? r.worst.type + " " + r.worst.base + "pt x" + r.worst.fit : null })),
  overflow_ids: overflows.map(r => r.id + (r.stOver && r.stOver.length ? "  [stats row: " + r.stOver.join(", ") + "]" : "") +
    (r.geo && r.geo.length ? "  [geometria: " + r.geo.slice(0, 3).join("; ") + "]" : "")).slice(0, 20),
  kinds,
};
/* ---- v1.2: tekstin kasvatus (kayttaja 10.-12.10.2026) -------------------
   "mitas jos suurentaisi fontteja tiettyyn pisteeseen asti jos on tilaa ...
   Isoissa asemaarissa sitten kuten nyt. sama specialissa ja optioneissa" ja
   "huomattava yksinkertaistus ja lahemmas nykyista livea. eli etta saataisiin
   hieman teksteja isommiksi". fitCards kasvattaa lohkoa vain kortilla, jolla
   mitaan ei tarvinnut kutistaa, ja enintaan kattoon: aseet 6 -> 9 pt,
   saannot 5,4 -> 7,5 pt, optiot -> 6,5 pt. Kriittitaulukko ja muut lohkot
   eivat kasva (katto 1): kriittiruudut rivittyvat leveyden mukaan, ja
   kasvatettu taulukko meni riveista 5 + 4 riveihin 4 + 4 + 1. Tama
   tarkistaa kolme asiaa: mikaan lohko ei ylita kattoaan, vaelja kortti
   (Lunar) todella kasvaa, ja taysi kortti (Hammer) pysyy tasmalleen ennallaan. */
const GROW_CAP = { armament: 1.5, rules: 1.39, options: 1.17 };
const growNotes = [];
results.forEach(r => r.blocks.forEach(b => {
  const cap = GROW_CAP[b.type] || 1;
  if (b.fit > cap + 0.011) growNotes.push("lohko yli kattonsa: " + b.type + " x" + b.fit + " > " + cap + "  <- " + r.id);
}));
/* Lunar: "Starboard weapons battery" oli taulukon pisin nimi ja pysaytti
   aseiden kasvun 8,0 pt:hen (x1,33). Kayttaja 12.10.2026: "jos on armament
   nimi super pitka eli ne pisimmat joiden mukaan tuo vasen/oikea suunnan
   tila lukittu niin voi tehda lyhennyksia niista jotka on pisimpia etta
   yhtapitkia kuin muutkin ne pisimmat" - lyhennyksella (Starboard -> Stbd)
   Lunarin aseet yltavat lahelle kattoa. Taysi kortti (Hammer) ei lyhenna
   mitaan. */
const GROW_EXPECT = [
  { re: /Gothic Sector \| .* \| Lunar class cruiser \| oletus$/, min: { armament: 1.45, rules: 1.2 }, abbrMin: 1, pairsMin: 2 },
  { re: /Waaagh! \| .* \| Hammer class battlekroozer \| oletus$/, max: { armament: 1, rules: 1, options: 1, critical: 1 }, abbrMax: 0 },
];
GROW_EXPECT.forEach(x => {
  const r = results.find(q => x.re.test(q.id));
  if (!r) { if (!ONLY) growNotes.push("odotuskorttia ei loydy: " + x.re); return; }
  const fit = t => { const b = r.blocks.find(q => q.type === t); return b ? b.fit : null; };
  Object.keys(x.min || {}).forEach(t => { if (!(fit(t) >= x.min[t])) growNotes.push("vaelja kortti ei kasvanut: " + t + " x" + fit(t) + " < " + x.min[t] + "  <- " + r.id); });
  Object.keys(x.max || {}).forEach(t => { if (fit(t) != null && fit(t) > x.max[t] + 0.001) growNotes.push("tayden kortin lohko kasvoi: " + t + " x" + fit(t) + "  <- " + r.id); });
  if (x.abbrMin != null && !(r.abbr >= x.abbrMin)) growNotes.push("pisinta asenimea ei lyhennetty: " + r.abbr + "  <- " + r.id);
  if (x.abbrMax != null && r.abbr > x.abbrMax) growNotes.push("tayden kortin asenimia lyhennettiin: " + r.abbr + "  <- " + r.id);
  /* Fleets s.71: Lunarilla on lance-pari ja patteripari */
  if (x.pairsMin != null && !(r.pairs >= x.pairsMin)) growNotes.push("port/starboard-pareja " + r.pairs + " < " + x.pairsMin + "  <- " + r.id);
});
/* v1.2 (kayttaja 12.10.2026): "arc ympyra mahtuisi olemaan vahan isompi" -
   sektorikuvake on vahintaan 3,1 mm (oli 2,6 mm) jokaisella kortilla. */
const smallArc = results.filter(r => r.arcMm != null && r.arcMm < 3.1);
if (smallArc.length) growNotes.push("sektorikuvake alle 3,1 mm " + smallArc.length + " kortilla, pienin " + Math.min.apply(null, smallArc.map(r => r.arcMm)) + " mm  <- " + smallArc[0].id);
summary.abbreviated_cards = results.filter(r => r.abbr > 0).length;
summary.paired_cards = results.filter(r => r.pairs > 0).length;
summary.growth_failures = growNotes.length;
summary.growth_notes = growNotes.slice(0, 20);
summary.grown_cards = results.filter(r => r.blocks.some(b => b.fit > 1.001)).length;
if (process.argv.includes("--dump")) fs.writeFileSync(path.join(HERE, "_layout_report.json"), JSON.stringify(results));
if (AS_JSON) { console.log(JSON.stringify(summary, null, 1)); process.exit(overflows.length || unreadable.length || growNotes.length ? 1 : 0); }
console.log("kortteja " + summary.cards + "  (mitattuja " + summary.measured + ")  raja " + FLOOR + " pt");
console.log("pienin tekstikoko " + summary.min_pt + " pt, mediaani " + summary.median_min_pt + " pt");
console.log("print_overflows        " + summary.print_overflows);
console.log("unreadable_print_cases " + summary.unreadable_print_cases + "  (oletus " + summary.unreadable_default + ", kaikki valinnat " + summary.unreadable_all_options + ")");
console.log("\nlajeittain (kortteja / mitattuja / pienin pt / ylivuotoja / alle rajan):");
Object.keys(kinds).sort().forEach(k => { const o = kinds[k];
  console.log("  " + k.padEnd(26) + String(o.cards).padStart(5) + " / " + String(o.measured).padStart(5) + " / " +
    String(o.min_pt).padStart(5) + " / " + o.overflows + " / " + o.unreadable + (o.measured < o.cards ? "   <- OHITETTUJA " + (o.cards - o.measured) : "")); });
console.log("\npahimmat:");
summary.worst.forEach(w => console.log("  %s pt  scale %s  %s  <- %s", String(w.minEff).padStart(5), w.cardScale, w.block, w.id));
if (overflows.length) { console.log("\nylivuodot:"); summary.overflow_ids.forEach(x => console.log("  " + x)); }
console.log("\nkasvatus: " + summary.grown_cards + " kortilla jokin lohko kasvoi, " + summary.abbreviated_cards + " kortilla lyhennettiin asenimia, " + summary.paired_cards + " kortilla port/starboard-pari; poikkeamia " + summary.growth_failures);
summary.growth_notes.forEach(x => console.log("  " + x));
process.exit(overflows.length || unreadable.length || growNotes.length ? 1 : 0);
