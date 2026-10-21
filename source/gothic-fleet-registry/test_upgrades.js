/* Regressiotesti listan paivityksille ja asevaihdoille.

   Kattaa ne kuusi vikaa jotka kayttaja raportoi:
     A  re-roll laskettiin amiraaliksi -> osiorajoitus valitti turhaan
     B  re-roll pitaa olla komentajan lisaosto, valittavissa vasta kun
        komentaja on otettu
     C  aseen vaihto-optio nakyy aseistustaulukossa molempina vaihtoehtoina
     D  Dakka Dakka puuttui kokonaan
     E  kattohinta nakyy optioiden tueksi
     F  Khornen Warmasterin pakollinen Mark hinnassa, Lordin re-roll
        valittavissa

   Aja:  node test_upgrades.js
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
  querySelector: () => el(),
  querySelectorAll: () => [],
  createElement: () => el(),
  head: { appendChild(){} },
  body: { appendChild(){}, removeChild(){}, dataset: {}, classList: { add(){}, remove(){} } },
};
global.window = {}; global.navigator = {};
const store = {};
global.localStorage = {
  getItem: k => (k in store ? store[k] : null),
  setItem: (k, v) => { store[k] = v; },
};
global.alert = () => {}; global.confirm = () => false;

const html = fs.readFileSync(path.join(__dirname, "Gothic Fleet Registry.html"), "utf8");
let js = html.split("<script>")[1].split("</script>")[0];
js = js.replace(/^"use strict";/, "");
const api = new Function(js +
  "\n;return {LISTS,SHIPS,checks,total,totalMax,addUnit,hulls,setOptState,resolveUnit," +
  "optState,unitPts,unitMaxPts,upgradesFor,upState,setUpState,isUpgradeEnt," +
  "secShips,cardHTML,isEscort,save,load,KEY,editorScript,EDITOR_CSS,armModel," +
  "effHits,effTurrets,effShieldsText,optCount,resolveUnit,getS:()=>S};")();
/* load() korvaa S:n uudella oliolla, joten viedaan getS eika S itse. */
const KEY = api.KEY;

const { LISTS, SHIPS } = api;
let fails = 0;
const eq = (got, want, what) => {
  const ok = got === want;
  if (!ok) fails++;
  console.log((ok ? "  PASS  " : "  FAIL  ") + what + "  ->  " + JSON.stringify(got) +
              (ok ? "" : "  (odotettu " + JSON.stringify(want) + ")"));
};
const ok = (cond, what) => eq(!!cond, true, what);

function useList(frag, limit) {
  const i = LISTS.findIndex(l => l.nm.includes(frag));
  if (i < 0) throw new Error("listaa ei loydy: " + frag);
  const S = api.getS();
  S.li = i; S.limit = limit || 1500; S.units = [];
  return LISTS[i];
}
/* Rivin haku nimen perusteella: [osioIndeksi, riviIndeksi] */
function findEnt(L, frag, secFrag) {
  for (let si = 0; si < L.secs.length; si++) {
    if (secFrag && !L.secs[si].t.includes(secFrag)) continue;
    for (let ei = 0; ei < L.secs[si].ents.length; ei++)
      if (L.secs[si].ents[ei].l.toLowerCase().includes(frag.toLowerCase()))
        return [si, ei];
  }
  throw new Error("rivia ei loydy: " + frag + (secFrag ? " / " + secFrag : ""));
}
function add(L, frag, secFrag) {
  const [si, ei] = findEnt(L, frag, secFrag);
  api.addUnit(si, ei);
  const U = api.getS().units;
  return U[U.length - 1];
}
function chk(t) { return api.checks().find(c => c.t === t); }

/* ================================================================ A + B */
console.log("\n=== A/B  re-roll on komentajan lisaosto, ei toinen amiraali ===");
{
  const L = useList("Gothic Sector");
  const adm = add(L, "Admiral (Ld 9)", "Admiral");
  const [rsi, rei] = findEnt(L, "One extra re-roll", "Admiral");

  const ups = api.upgradesFor(adm);
  ok(ups.own.some(x => x[0] === rsi && x[1] === rei),
     "re-roll tarjotaan valitulle amiraalille");
  /* 30.9.2026: tarjottu listarivi avautuu Optionina (tyhja ruutu, ei
     pisteita), ei Hidena */
  eq(api.upState(adm, rsi, rei), "opt", "re-roll on aluksi Option (tarjottu, ei laskettu)");

  api.setUpState(adm, rsi, rei, "take");
  eq(api.unitPts(adm), 125, "amiraali 100 + re-roll 25");
  eq(api.secShips(adm.s), 1, "osiolaskuri nakee yhden komentajan, ei kahta");
  const c = chk("Admiral");
  eq(c.v, "1 / 1", "0-1 Admiral -tarkistus nayttaa 1/1");
  ok(c.ok, "0-1 Admiral -tarkistus ei valita");

  /* re-rollit sulkevat toisensa: kolmea rivia ei voi ottaa yhtaikaa */
  const [, r2] = findEnt(L, "Two extra re-rolls", "Admiral");
  api.setUpState(adm, rsi, r2, "take");
  eq(api.upState(adm, rsi, rei), "off", "toinen re-roll-rivi sulkee ensimmaisen");
  eq(api.unitPts(adm), 175, "amiraali 100 + kaksi re-rollia 75");

  /* paivitysta ei saa lisata omana rivinaan */
  ok(api.isUpgradeEnt(L.secs[rsi].ents[rei]),
     "re-roll on merkitty paivitykseksi, ei yksikoksi");
}

/* ==================================================================== F */
console.log("\n=== F  Khorne: pakollinen Mark hinnassa, Lordin re-roll valittavissa ===");
{
  const L = useList("Khorne");
  const wm = add(L, "Chaos Warmaster", "Chaos Warmaster of Khorne");
  const [msi, mei] = findEnt(L, "The Mark of Khorne", "Chaos Warmaster of Khorne");
  eq(api.upState(wm, msi, mei), "take", "Mark on valmiiksi valittuna");
  eq(api.unitPts(wm), 120, "Warmaster 100 + pakollinen Mark 20");
  /* dflt eika req: rivi avautuu valittuna mutta on poistettavissa, koska
     jumalan oma battle barge kantaa Markin jo hinnassaan (s.264). */
  ok(L.secs[msi].ents[mei].dflt && !L.secs[msi].ents[mei].req,
     "Mark on oletusvalinta, ei lukittu");

  const [rsi, rei] = findEnt(L, "One extra re-roll", "Chaos Warmaster of Khorne");
  api.setUpState(wm, rsi, rei, "take");
  eq(api.unitPts(wm), 145, "Warmaster + Mark + re-roll 25");

  const lord = add(L, "Chaos Lord (Ld +1)", "Chaos Lords");
  const [lsi, lei] = findEnt(L, "One re-roll (his own", "Chaos Lords");
  const lups = api.upgradesFor(lord);
  ok(lups.own.some(x => x[0] === lsi && x[1] === lei),
     "Lordin +25 re-roll on valittavissa");
  api.setUpState(lord, lsi, lei, "take");
  eq(api.unitPts(lord), 50, "Chaos Lord 25 + re-roll 25");
  const c = chk("Chaos Lords");
  ok(!c || c.ok, "Chaos Lords -tarkistus ei valita yhdesta lordista");
}

/* ==================================================================== D */
console.log("\n=== D  Dakka Dakka on valittavissa ===");
{
  const L = useList("Waaagh");
  const terror = add(L, "Terror ship", "KROOZERS");
  const [dsi, dei] = findEnt(L, "Dakka Dakka: +2 turrets");
  const ups = api.upgradesFor(terror);
  ok(ups.other.some(x => x[0] === dsi && x[1] === dei),
     "Dakka Dakka tarjotaan alukselle");
  api.setUpState(terror, dsi, dei, "take");
  eq(api.unitPts(terror), 205, "Terror ship 185 + Dakka Dakka 20");

  /* escortin hinta kertautuu rungoittain */
  const sq = add(L, "Ravager attack ship", "ESCORTS");
  sq.n = 4;
  const [esi, eei] = findEnt(L, "Dakka Dakka: +1 turret");
  api.setUpState(sq, esi, eei, "take");
  eq(api.unitPts(sq), 4 * 40 + 4 * 5, "neljan escortin squadron maksaa turretit erikseen");
}

/* ==================================================================== C */
console.log("\n=== C  asevaihto nakyy aseistustaulukossa ===");
{
  const L = useList("Waaagh");
  const terror = add(L, "Terror ship", "KROOZERS");
  const sh = SHIPS["380"];
  const swi = sh.ol.findIndex(o => o.sw);
  ok(swi >= 0, "Terror shipin vaihto-optio on jasennetty");

  /* the prow slot's own group; the list rows (orbital mines, torpedo-
     bommas) now open as Option and make groups of their own elsewhere */
  const prowGroup = html => {
    const gs = html.match(/<tbody class="g">[\s\S]*?<\/tbody>/g) || [];
    return gs.filter(g => /Prow (heavy gunz|torpedo launcha)/.test(g)).join("");
  };
  api.setOptState(terror, swi, "opt");
  let h = api.cardHTML(terror, "top");
  ok(/Prow heavy gunz/.test(h), "auki: alkuperainen heavy gunz nakyy");
  ok(/Prow torpedo launcha/.test(h), "auki: korvaava torpedo launcha nakyy");
  eq((prowGroup(h).match(/class="rb/g) || []).length, 2,
     "auki: kummallakin rivilla on valintaympyra");
  eq((prowGroup(h).match(/class="rb on"/g) || []).length, 1,
     "auki: perusrivi on merkitty kaytossa olevaksi");
  /* every choice group on the card has exactly one marked row */
  ok((h.match(/<tbody class="g">[\s\S]*?<\/tbody>/g) || []).every(g => (g.match(/class="rb on"/g) || []).length === 1),
     "auki: jokaisessa ryhmassa tasan yksi merkitty rivi");
  ok(/<tbody class="g">/.test(h), "auki: vaihtoehdot ovat samassa ryhmassa");

  api.setOptState(terror, swi, "take");
  h = api.cardHTML(terror, "top");
  ok(!/Prow heavy gunz/.test(h), "lukittu: heavy gunz on poistettu");
  /* the slot has nothing left to choose: the launcha is a plain row now,
     no round box and no OR (30.9.2026) */
  ok(/Prow torpedo launcha/.test(h) && !/OR<\/i>[^<]*Prow torpedo launcha/.test(h), "lukittu: torpedo launcha on tavallinen rivi ilman OR:ia");
  ok((h.match(/<tbody class="g">[\s\S]*?<\/tbody>/g) || []).every(g => (g.match(/class="rb on"/g) || []).length === 1),
     "lukittu: jokaisessa ryhmassa yha tasan yksi merkitty rivi");

  api.setOptState(terror, swi, "off");
  h = api.cardHTML(terror, "top");
  ok(/Prow heavy gunz/.test(h), "piilotettu: vain alkuperainen nakyy");
  ok(!/Prow torpedo launcha/.test(h), "piilotettu: korvaajaa ei nay");
}

/* ==================================================================== E */
console.log("\n=== E  kattohinta ===");
{
  const L = useList("Gothic Sector");
  const lunar = add(L, "Lunar class cruiser", "Cruisers");
  eq(api.unitPts(lunar), 180, "Lunar perushinta");
  /* 30.9.2026: the ceiling is the dearest LEGAL combination - the nova
     (+20) closes the Power Ram (Fleets p. 32) and the special torpedoes
     (no torpedoes left), so Ram 5 + Special torpedoes 20 = 205 wins over
     nova 200; never the unreachable sum 225 */
  eq(api.unitMaxPts(lunar), 205, "katto = kallein laillinen: Lunar 180 + Power Ram 5 + Special torpedoes 20 (nova 200 sulkee molemmat)");
  ok(api.totalMax() >= api.total(), "laivaston kattohinta ei alita summaa");
  const h = api.cardHTML(lunar, "top");
  ok(/max 205/.test(h), "kattohinta tulostuu LOADOUT-otsikkoon");
}

/* ============================================ luokitteluvirheiden haku */
console.log("\n=== Koko kirja: yksikoiksi laskettuja paivityksia ei jaa ===");
{
  let suspicious = 0;
  const ruleRows = {};
  LISTS.forEach(L => L.secs.forEach(sec => sec.ents.forEach(en => {
    if (en.k === "up") return;
    if (en.r) return;
    /* Ilman sivuviitetta oleva rivi saa olla yksikko vain jos se on
       komentaja: muuten se on lisaosto joka vaarentaisi osiolaskurin. */
    /* Kolmas laillinen laji 8.10.2026: planeettapuolustus, jolle kirja ei
       paina profiilia lainkaan. Fleets s.512 ORBITAL MINE ja s.513 MINEFIELD
       ovat hintarivi ja SPECIAL-lohko ilman TYPE/HITS-rivia, ja s.499:n
       hintalista myy ne riveina ("Orbital mine (pg. 512) 5 pts", "0-2
       Minefields (pg. 513) 40 pts"). Ne ovat ostettavia yksikoita, joilla on
       oma saantokortti (rivin rc) ja kappalemaara (cnt), eivat paivityksia.
       Poikkeus on rajattu tasan niihin: puolustusosio (ct "defence") JA
       saantokortti - mika tahansa muu rungoton rivi on yha epaily. */
    if (en.k === "unit" && sec.ct === "defence" && en.rc && en.cnt) { ruleRows[en.l] = 1; return; }
    if (en.k !== "cmd") {
      suspicious++;
      console.log("     ?  " + L.nm + " / " + sec.t + " / " + en.l);
    }
  })));
  eq(suspicious, 0, "jokainen sivuviitteeton rivi on joko komentaja tai paivitys");
  eq(Object.keys(ruleRows).sort().join(" | "), "Minefield | Orbital mine",
     "rungottomat puolustusrivit ovat tasan Orbital mine (s.512) ja Minefield (s.513)");

  let orphan = 0;
  LISTS.forEach(L => L.secs.forEach(sec => sec.ents.forEach(en => {
    if (en.k === "up" && en.at && !en.at.length) orphan++;
  })));
  eq(orphan, 0, "yhdellakaan paivityksella ei ole tyhjaa kohdelistaa");
}

/* ================================= G  launch bay -hinnoittelu ja ehdot */
console.log("\n=== G  torpedo bombers maksaa launch bay -voimakkuuden mukaan ===");
{
  const L = useList("Explorator");
  const dic = add(L, "Dictator class cruiser", "Cruisers");
  const [bsi, bei] = findEnt(L, "Torpedo bombers", "ORDNANCE");
  api.setUpState(dic, bsi, bei, "take");
  /* Dictatorilla on 2 + 2 laukaisukantta, joten +10 / bay = +40 */
  eq(api.unitPts(dic), 255 + 40, "Dictator 255 + torpedo bombers 4 x 10");

  const emp = add(L, "Emperor class battleship", "Battleships");
  api.setUpState(emp, bsi, bei, "take");
  eq(api.unitPts(emp), 400 + 80, "Emperor 400 + torpedo bombers 8 x 10");

  /* laukaisukansittomalle alukselle ei tarjota lainkaan */
  const goth = add(L, "Gothic class cruiser", "Cruisers");
  const gups = api.upgradesFor(goth);
  ok(!gups.other.some(x => x[0] === bsi && x[1] === bei),
     "ilman laukaisukansia torpedo bombers ei ole tarjolla");
}

console.log("\n=== G  Power Ram, Nova Cannon ja plasma-boosted batteries ===");
{
  const L = useList("Explorator");
  const lun = add(L, "Lunar class cruiser", "Cruisers");
  const [psi, pei] = findEnt(L, "Imperial Power Ram", "FLEET UPGRADES");
  const [nsi, nei] = findEnt(L, "Nova Cannon instead of prow torpedoes", "FLEET UPGRADES");
  const [bsi, bei] = findEnt(L, "Plasma-boosted batteries", "FLEET UPGRADES");
  let ups = api.upgradesFor(lun);
  const hasUp = (a, b) => ups.other.concat(ups.own).some(x => x[0] === a && x[1] === b);
  ok(hasUp(psi, pei), "Power Ram tarjotaan 6+ keulan risteilijalle");
  ok(!hasUp(nsi, nei), "Lunarille ei listan Nova-rivia: sama osto on sen oma optio (Fleets p. 71)");
  ok(hasUp(bsi, bei), "plasma-boosted batteries tarjotaan 30 cm pattereille");

  api.setUpState(lun, bsi, bei, "take");
  eq(api.unitPts(lun), 215 + 10, "Lunar 215 + plasma-boosted 10");
  let h = api.cardHTML(lun, "top");
  /* v1.2 (J183): kortti painaa kantaman lukuna varikehyksessa ja yksikon
     sarakeotsikkoon, joten "45 cm" ei enaa ole kortilla yhtena merkkijonona.
     Vaite on sama: patterin kantamasolussa lukee 45 - ja ennen paivitysta
     Lunarilla ei ole yhtaan 45:n kantamaa. */
  const rangeCells = html => (html.match(/<span class="rp[^"]*"[^>]*>([^<]*)<\/span>/g) || []).map(x => x.replace(/<[^>]+>/g, ""));
  api.setUpState(lun, bsi, bei, "off");
  ok(!rangeCells(api.cardHTML(lun, "top")).includes("45"), "ilman plasma-boostedia (rivi piilotettu) Lunarilla ei ole 45 cm:n kantamaa");
  api.setUpState(lun, bsi, bei, "take");
  ok(rangeCells(h).includes("45") && /Range cm/.test(h), "plasma-boosted nostaa kantaman 45 cm:iin kortilla");

  /* listan nova Gothicille, jolla ei ole omaa optiota (Fleets p. 121):
     korvaa keulatorpedot ja sulkee Power Ramin */
  const goth = add(L, "Gothic class cruiser", "Cruisers");
  ups = api.upgradesFor(goth);
  ok(hasUp(nsi, nei), "Nova Cannon tarjotaan risteilijalle jolla on keulatorpedot (Gothic)");
  const gbase = api.unitPts(goth);
  api.setUpState(goth, nsi, nei, "take");
  eq(api.unitPts(goth), gbase + 20, "Gothic + nova cannon 20");
  h = api.cardHTML(goth, "top");
  ok(/Prow nova cannon/.test(h), "nova cannon nakyy aseistustaulukossa");
  ok(!/Prow torpedoes/.test(h), "keulatorpedot poistuvat kun nova cannon otetaan");
  ups = api.upgradesFor(goth);
  ok(!hasUp(psi, pei), "Power Ram ei ole enaa tarjolla nova cannonin kanssa");
  /* ja toisin pain: otettu Power Ram sulkee listan novan (Fleets p. 118) */
  const goth2 = add(L, "Gothic class cruiser", "Cruisers");
  api.setUpState(goth2, psi, pei, "take");
  ups = api.upgradesFor(goth2);
  ok(!hasUp(nsi, nei), "otettu Power Ram sulkee listan Nova-rivin");

  /* kevyt risteilija ei saa nova cannonia */
  const end = add(L, "Endeavour class light cruiser", "Cruisers");
  ups = api.upgradesFor(end);
  ok(!hasUp(nsi, nei), "kevyt risteilija ei saa nova cannonia");
  const [dsi, dei] = findEnt(L, "Dorsal lance instead of prow torpedoes", "FLEET UPGRADES");
  ok(hasUp(dsi, dei), "Endeavour saa ilmaisen dorsal lance -vaihdon");

  /* escorttien +1 turret vain escorteille, ja per runko */
  const [tsi, tei] = findEnt(L, "+1 turret (escort squadron)", "FLEET UPGRADES");
  ups = api.upgradesFor(lun);
  ok(!hasUp(tsi, tei), "capital ship ei saa escorttien +1 turrettia");
  const sq = add(L, "Cobra Class Destroyer", "ESCORTS");
  sq.n = 3;
  ups = api.upgradesFor(sq);
  ok(hasUp(tsi, tei), "escortsquadron saa +1 turrettin");
  api.setUpState(sq, tsi, tei, "take");
  eq(api.unitPts(sq), 3 * 30 + 3 * 5, "kolmen escortin squadron maksaa turretit erikseen");
}

console.log("\n=== G  orkkien torpedo-bommat kaikissa kolmessa listassa ===");
{
  ["Cyclops", "Waaagh", "Da Ork Clanz"].forEach(nm => {
    const L = useList(nm);
    const [si, ei] = findEnt(L, "Torpedo-bommas", "FLEET UPGRADES");
    ok(si != null, nm + ": torpedo-bommat loytyvat");
  });
  const L = useList("Waaagh");
  const terror = add(L, "Terror ship", "KROOZERS");
  const [si, ei] = findEnt(L, "Torpedo-bommas", "FLEET UPGRADES");
  api.setUpState(terror, si, ei, "take");
  /* kirjan oma esimerkki: "a Terror Ship must pay +40 points" */
  eq(api.unitPts(terror), 185 + 40, "Terror Ship 185 + torpedo-bommat 40 (kirjan esimerkki)");

  const hulk = add(L, "Ork hulk", "SPACE HULKS");
  api.setUpState(hulk, si, ei, "take");
  /* kirjan oma esimerkki: "a Space Hulk must pay +160 points" */
  eq(api.unitPts(hulk), 600 + 160, "Ork hulk 600 + torpedo-bommat 160 (kirjan esimerkki)");
}

/* =========================================== paallekkaisyys ei tuplaannu */
console.log("\n=== Sama lisaosto ei nay kahdesti ===");
{
  const L = useList("Tyranids \u2014 Hive Fleet");
  const hive = add(L, "Hive ship", "HIVE SHIPS");
  const ups = api.upgradesFor(hive);
  const all = ups.own.concat(ups.other).map(x => x[2].l.toLowerCase());
  const sh = api.SHIPS[String(hive.ref)];
  const clash = all.filter(l =>
    (sh.ol || []).some(o => o.t.toLowerCase().includes(l)));
  eq(clash.length, 0,
     "hive shipin bio-aseita ei tarjota erikseen viela listapaivityksinakin");

  /* Torture-risteilijan lisaaseet ovat aluksen omia optioita */
  const L2 = useList("Dark Eldar");
  const tort = add(L2, "Torture class cruiser", "Cruisers");
  const u2 = api.upgradesFor(tort);
  eq(u2.own.length, 0, "Torture-risteilijalle ei jaa paallekkaisia lisaaseita");
}

/* ====================================== valikkoase: Hide poistaa rivin */
console.log("\n=== Hide poistaa valikkoaseen myos aseistustaulukosta ===");
{
  const L = useList("Tyranids \u2014 Hive Fleet");
  const hive = add(L, "Hive ship", "HIVE SHIPS");
  const sh = SHIPS[String(hive.ref)];

  /* Oletustila on "opt": kaikki vaihtoehdot nakyvat rastitettavina. */
  let h = api.cardHTML(hive, "top");
  eq((h.match(/<tr class="w"/g) || []).length, sh.aw.length,
     "oletuksena koko valikko nakyy");

  /* Kayttajan tapaus: vain launch bayt paalle, kaikki muu piiloon. */
  sh.ol.forEach((o, i) => {
    if(!o.aws) return;
    api.setOptState(hive, i, /launch bay/i.test(o.t) ? "take" : "off");
  });
  /* "everything else hidden" includes the list's mega-spore swap, which
     now opens as Option by itself (30.9.2026) */
  L.secs.forEach((sec, si) => sec.ents.forEach((en, ei) => {
    if(en.k === "up" && /mega-spore/i.test(en.l)) api.setUpState(hive, si, ei, "off");
  }));
  h = api.cardHTML(hive, "top");
  const names = (h.match(/<td class="nm">[\s\S]*?<\/td>/g) || [])
    .map(x => x.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim())
    .filter(x => x && x !== "Armament");
  eq(names.filter(x => /pyro|tentacle|claw|bio-plasma|boarding/i.test(x)).length,
     0, "piilotetut aseet eivat jaa taulukkoon");
  ok(names.length > 0 && names.every(x => /launch bay/i.test(x)),
     "jaljella on vain launch bayt: " + JSON.stringify(names));
  ok(/class="wb on"/.test(h), "valittu ase on rastitettu");

  /* Option-tila: rivi nakyy, mutta ruutu on tyhja. */
  sh.ol.forEach((o, i) => {
    if(o.aws && /pyro-acid/i.test(o.t)) api.setOptState(hive, i, "opt");
  });
  h = api.cardHTML(hive, "top");
  ok(/Pyro-acid battery/i.test(h), "Option palauttaa rivin nakyviin");

  /* Vakioaseistus ei katoa: Krakenilla kaikki rivit ovat valikkoa, mutta
     esim. Hammerin keulagunz ei ole, joten se jaa aina. */
  const L2 = useList("Waaagh");
  const hammer = add(L2, "Hammer class battlekroozer", "BATTLESHIPS");
  const hs = SHIPS[String(hammer.ref)];
  hs.ol.forEach((o, i) => { if(o.aws) api.setOptState(hammer, i, "off"); });
  const hh = api.cardHTML(hammer, "top");
  ok(/Prow gunz battery/i.test(hh),
     "vakioaseistus jaa vaikka kaikki valikkovalinnat piilotetaan");
}

/* ========================================== Download for editing -arkki */
console.log("\n=== Ladattava muokattava arkki ===");
{
  const src = api.editorScript();
  ok(/^\(function\(\)\{/.test(src.trim()),
     "skripti alkaa omalla sulkeumalla");
  ok(/\}\)\(\);\s*$/.test(src),
     "skripti paattyy sulkeuman kutsuun");
  ok(src.includes("function fitCards"),
     "sovitusfunktio menee mukaan lahdekoodina, ei kopiona");
  ok(/addEventListener\("input"/.test(src),
     "muokkaus laukaisee uudelleensovituksen");
  ok(/insertText/.test(src), "liitetty teksti siivotaan");
  ok(/data-act=save/.test(src), "tallennusnappi kytketaan");

  /* Skripti kootaan merkkijonoista: rikkinainen lainausmerkki tai
     kenoviiva nakyisi muuten vasta selaimessa. */
  let compiled = true;
  try { new Function(src); } catch (e) { compiled = false;
    console.log("     kaannosvirhe: " + e.message); }
  ok(compiled, "koottu skripti kaantyy");

  ok(api.EDITOR_CSS.includes("@media print"),
     "tyokalurivi piilotetaan tulostuksessa");
  ok(api.EDITOR_CSS.includes(".sheet{display:block}"),
     "arkki on nakyvissa ladatussa tiedostossa");
}

/* ================================= tallenteen kestavyys datan muuttuessa */
console.log("\n=== Tallenne kestaa rivien siirtymisen ===");
{
  const L = useList("Gothic Sector");
  const adm = add(L, "Admiral (Ld 9)", "Admiral");
  const [rsi, rei] = findEnt(L, "One extra re-roll", "Admiral");
  api.setUpState(adm, rsi, rei, "take");
  api.save();
  const saved = store[KEY];

  /* Uusi rivi osion alkuun siirtaa kaikkia indekseja yhdella. */
  L.secs[rsi].ents.unshift({ l: "Test row that shifts the indexes",
                             r: null, p: 5, a: 1, k: "up" });
  api.getS().units = [];
  store[KEY] = saved;
  api.load();

  const u2 = api.getS().units[0];
  eq(api.LISTS[api.getS().li].secs[u2.s].ents[u2.e].l, "Admiral (Ld 9)",
     "yksikko osoittaa siirron jalkeen samaan riviin");
  eq(api.unitPts(u2), 125, "re-roll sailyy valittuna siirron yli");
  L.secs[rsi].ents.shift();
}

/* ============================ sama ase ei voi vaihtua kahdeksi eri aseeksi */
console.log("\n=== Paallekkaiset vaihto-optiot sulkevat toisensa ===");
{
  const L = useList("Armageddon Sector");
  const sc = add(L, "Strike Cruiser", "");
  const sh = SHIPS[String(sc.ref)];
  /* Kaksi optiota osoittaa samaan aseistusriviin (launch bays). */
  const same = [];
  (sh.ol || []).forEach((o, i) => { if (o.sw && (o.sw.f || []).includes(2)) same.push(i); });
  eq(same.length, 2, "Strike Cruiserilla on kaksi optiota samalle aseriville");

  api.setOptState(sc, same[0], "take");
  api.setOptState(sc, same[1], "take");
  eq(api.optState(sc, same[0]), "opt",
     "jalkimmaisen ottaminen avaa edellisen: samaa asetta ei vaihdeta kahdesti");
  eq(api.optState(sc, same[1]), "take", "jalkimmainen jaa voimaan");

  const h = api.cardHTML(sc, "top");
  const grp = (h.match(/<tbody class="g">[\s\S]*?<\/tbody>/g) || [])[0] || "";
  eq((grp.match(/class="rb on"/g) || []).length, 1,
     "ryhmassa on tasan yksi merkitty rivi");

  /* Vanha tallenne voi sisaltaa ristiriidan. Lataus EI siivoa sita hiljaa
     (P1-8e, katselmoinnin vaatimus): tila sailyy, ratkaisin kertoo sen
     rakenteisena issue-rivina ja laillisuustarkistus nayttaa punaista. */
  sc.os[same[0]] = "take";
  sc.os[same[1]] = "take";
  api.save();
  api.load();
  const u3 = api.getS().units[0];
  const both = [api.optState(u3, same[0]), api.optState(u3, same[1])]
    .filter(x => x === "take").length;
  eq(both, 2, "lataus sailyttaa vanhan tallenteen tilan sellaisenaan");
  const R3 = api.resolveUnit(u3);
  ok(R3.issues.some(x => x.code === "option.swap_conflict" && x.severity === "error"),
     "ristiriita raportoidaan issue-rivina (option.swap_conflict)");
  ok(api.checks().some(c => !c.ok && /^Unit issues/.test(c.t)),
     "laillisuustarkistus nayttaa yksikon ongelman");
  /* ja kayttajan seuraava valinta siivoaa sen nakyvasti */
  api.setOptState(u3, same[1], "take");
  eq(api.optState(u3, same[0]), "opt", "uusi valinta avaa vanhan (transition)");
  eq(api.resolveUnit(u3).issues.filter(x => x.severity === "error").length, 0,
     "transition jattaa tilan kelvolliseksi");
}

/* ---- sama kokoonpano, sama tulos riippumatta valintajarjestyksesta ----
   Aluksen oma optio ja listan paivitys voivat tarkoittaa samaa asiaa.
   Silloin hinnan, aseistuksen ja nakyvyyden on oltava sama riippumatta
   siita kummasta paasta valinta tehtiin. Ennen 8.9.2026 piilotettu Power
   Ram jai laskuun (240) ja kaksi reittia samaan keulapaikkaan veloitti
   kahdesti (255) ja piirsi kaksi Novaa. */
{
  const li = api.LISTS.findIndex(L => /Adeptus Mechanicus/.test(L.nm));
  api.getS().li = li; api.getS().limit = 9999;
  const L = api.LISTS[li];
  let si = -1, ei = -1;
  L.secs.forEach((sec, i) => sec.ents.forEach((e, j) => {
    if (si < 0 && /^Lunar/i.test(e.l) && e.r) { si = i; ei = j; }
  }));
  const sh = api.SHIPS[String(L.secs[si].ents[ei].r)];
  const novaOpt = (sh.ol || []).findIndex(o => /nova cannon/i.test(o.t));
  const base = L.secs[si].ents[ei].p;
  const mk = () => {
    const u = { s: si, e: ei, ref: L.secs[si].ents[ei].r, n: 1,
                opts: [], os: {}, name: "" };
    api.getS().units = [u];
    return u;
  };
  const up = (u, re_) => {
    const g = api.upgradesFor(u);
    return g.own.concat(g.other).find(x => re_.test(x[2].l));
  };
  const takeUp = (u, re_) => {
    const x = up(u, re_);
    if (x) api.setUpState(u, x[0], x[1], "take");
    return !!x;
  };
  const novaRows = u => api.armModel(u, sh)
    .filter(r => (!r.alt || r.box === "on") && /nova/i.test(r.a[0])).length;

  const orders = [
    ["ram, sitten oma Nova", u => { takeUp(u, /Power Ram/i);
                                    api.setOptState(u, novaOpt, "take"); }],
    ["oma Nova, sitten ram", u => { api.setOptState(u, novaOpt, "take");
                                    takeUp(u, /Power Ram/i); }],
    ["oma Nova, sitten listan", u => { api.setOptState(u, novaOpt, "take");
                                       takeUp(u, /Nova Cannon/i); }],
    ["vain oma Nova", u => { api.setOptState(u, novaOpt, "take"); }],
  ];
  /* 30.9.2026: the list's nova row is not offered beside the Lunar's own
     nova option - it is the same purchase (noopt) - so there is one route,
     and nothing to print twice on the card */
  {
    const u = mk();
    ok(!up(u, /Nova Cannon instead/i), "Lunarille ei tarjota listan Nova-rivia oman option rinnalla");
    const alts = api.armModel(u, sh).filter(r => /nova/i.test(r.a[0])).length;
    eq(alts, 1, "oletuskortilla yksi OR Prow nova cannon, ei kahta");
  }
  orders.forEach(([nm, go]) => {
    const u = mk(); go(u);
    eq(api.unitPts(u), base + 20, "Nova " + nm + ": hinta");
    eq(novaRows(u), 1, "Nova " + nm + ": yksi aktiivinen Nova");
  });
  /* pelkka ram ei saa muuttua */
  {
    const u = mk(); takeUp(u, /Power Ram/i);
    eq(api.unitPts(u), base + 5, "pelkka Power Ram: hinta");
    eq(novaRows(u), 0, "pelkka Power Ram: ei Novaa");
  }
}

/* ---- maksettu optio muuttaa profiilia, ei pelkkaa hintaa ----
   Ennen 8.9.2026 aluksen omat optiot muuttivat vain summaa: Dominatorin
   halvempi aseistus jatti patterit ennalleen, Hammerin tornipaivitys
   jatti TURRETS 2 ja Warspheren runkomuutokset jattivat HP:n. Kortti
   kuvasi eri alusta kuin se josta pelaaja maksoi. */
{
  const seen = (u, sh) => ({
    hp: api.effHits(u, sh), tu: api.effTurrets(u, sh),
    sh: api.effShieldsText(u, sh),
    /* set-vaikutus muuttaa tekstistatsia (panssari, kaanto, nopeus) - ne
       luetaan ratkaisimesta, kuten pinnatkin tekevat */
    st: (() => { const R = api.resolveUnit(u); return R ? [R.stats.speed, R.stats.turns, R.stats.armour].join("|") : ""; })(),
    /* Ruudun tila kuuluu nakyvaan profiiliin: lisatty rivi (add) on
       kortilla jo "opt"-tilassa tyhjana ruutuna, ja "take" tikkaa sen.
       Ilman tilaa vaikutus nayttaisi olemattomalta. */
    aw: api.armModel(u, sh).filter(r => !r.alt || r.box === "on")
          .map(r => r.a.join("|") + (r.box ? "#" + r.box : "")).join(" ~ "),
  });
  /* Ensimmainen rivi, joka sallii option: listarivi voi kieltaa sen (optno) -
     Bastionin reservilaivasto kieltaa luokkavariantit (s.39, J144), joten
     Repulsiven ancient targeting mitataan Chaos-listan rivilla. */
  const place = (shipPage, o) => {
    for (let li = 0; li < api.LISTS.length; li++) {
      const L = api.LISTS[li];
      for (let si = 0; si < L.secs.length; si++)
        for (let ei = 0; ei < L.secs[si].ents.length; ei++) {
          const en = L.secs[si].ents[ei];
          if (String(en.r) !== String(shipPage)) continue;
          if (o && en.optno && new RegExp(en.optno, "i").test(String(o.t || ""))) continue;
          return { li: li, si: si, ei: ei };
        }
    }
    return null;
  };
  /* 1. yleinen invariantti kaikille vaikutusoptioille */
  let checked = 0;
  Object.keys(api.SHIPS).forEach(pg => {
    const sh = api.SHIPS[pg];
    (sh.ol || []).forEach((o, i) => {
      if (!o.mod && !o.set && !o.swp && !o.qty && !o.add) return;
      const at = place(pg, o);
      if (!at) return;
      api.getS().li = at.li; api.getS().limit = 99999;
      /* sivuavain voi olla "472b" (saman aluksen konfiguraatio) - numeroksi
         pakotettuna se on NaN ja alus katoaa, jolloin vaikutus nayttaa
         olemattomalta */
      const u = { s: at.si, e: at.ei, ref: isNaN(+pg) ? pg : +pg, n: 1, opts: [], os: {},
                  oq: {}, name: "" };
      api.getS().units = [u];
      /* Riippuvainen optio (rynnakkotorpedot vaativat torpedoputket) ei
         voi olla "take" ilman edellytystaan - setOptState pudottaa sen
         "opt"-tilaan. Edellytys otetaan ENNEN mittausta, jottei sen oma
         vaikutus lasketa taman option vaikutukseksi. */
      if (o.dep != null) api.setOptState(u, o.dep, "take");
      const before = JSON.stringify(seen(u, sh));
      api.setOptState(u, i, "take");
      const after = JSON.stringify(seen(u, sh));
      checked++;
      eq(after !== before, true,
         "vaikutus nakyy profiilissa: " + sh.nm + " / " + o.t.slice(0, 42));
    });
  });
  eq(checked >= 7, true, "vaikutusoptioita testattu (" + checked + ")");

  /* 2. kirjasta luetut odotukset (Fleets s. 68, 374, 494) */
  const one = (pg, re_, want) => {
    const sh = api.SHIPS[String(pg)], at = place(pg);
    const i = (sh.ol || []).findIndex(o => re_.test(o.t));
    api.getS().li = at.li; api.getS().limit = 99999;
    const u = { s: at.si, e: at.ei, ref: pg, n: 1, opts: [], os: {},
                oq: {}, name: "" };
    api.getS().units = [u];
    api.setOptState(u, i, "take");
    if (want.qty) u.oq[i] = want.qty;
    Object.keys(want).forEach(k => {
      if (k === "qty") return;
      const got = k === "pts" ? api.unitPts(u)
        : k === "hp" ? api.effHits(u, sh)
        : k === "tu" ? api.effTurrets(u, sh)
        : k === "sh" ? api.effShieldsText(u, sh)
        : api.armModel(u, sh).filter(r => !r.alt || r.box === "on")
            .map(r => r.a.join("/"))[0];
      eq(got, want[k], sh.nm.slice(0, 18) + " " + k);
    });
  };
  one(68, /Originally fitted/, { pts: 185, aw: "Port weapons battery/45 cm/6/Left" });
  one(374, /upgrade its turrets/, { pts: 255, tu: "3" });
  one(494, /may add 2HP/, { pts: 165, hp: 12, aw: "Weapons battery/30 cm/14/All round" });
  one(494, /may add 2HP/, { qty: 3, pts: 205, hp: 16,
                            aw: "Weapons battery/30 cm/18/All round" });
  one(494, /may subtract 2HP/, { qty: 2, pts: 105, hp: 6,
                                 aw: "Weapons battery/30 cm/8/All round" });
  one(494, /add \+1 shield/, { pts: 155, sh: "3" });
  one(494, /extend the range/, { pts: 170,
                                 aw: "Weapons battery/45 cm/12/All round" });
}

console.log(fails ? "\n" + fails + " testia epaonnistui" : "\nkaikki testit lapi");
process.exit(fails ? 1 : 0);
