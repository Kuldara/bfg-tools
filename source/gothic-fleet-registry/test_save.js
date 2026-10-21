/* Tallenteen palautus: kestaako se listojen ja osioiden siirtymisen?

   Tallennettu laivasto viittaa listaan ja osioon numerolla. Kun kirjaan
   lisataan lista tai listan alkuun osio, numerot siirtyvat. Ennen 7.9.2026
   lataus ei tunnistanut siirtynytta tallennetta, tyhjensi laivaston ja
   seuraava piirto tallensi tyhjan paalle - kayttajan tyo katosi.

   Testi rakentaa tallenteita joissa NIMET ovat oikein mutta INDEKSIT
   vaarin, ja vaatii etta laivasto palautuu. Lisaksi tarkistetaan ettei
   epaonnistunut palautus ylikirjoita tallennetta.

   Aja:  node test_save.js
*/
const fs = require("fs");
const path = require("path");

const el = () => ({
  textContent: "", innerHTML: "", value: "", className: "", dataset: {},
  querySelectorAll: () => [], appendChild(){}, onclick: null, onchange: null,
  oninput: null, style: {}, id: "", classList: { add(){}, remove(){} },
  setAttribute(){}, getAttribute: () => "", closest: () => el(), hidden: false,
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
global.localStorage = { getItem: k => (k in store ? store[k] : null),
                        setItem: (k, v) => { store[k] = v; },
                        removeItem: k => { delete store[k]; } };
global.alert = () => {}; global.confirm = () => false;

const html = fs.readFileSync(path.join(__dirname, "Gothic Fleet Registry.html"), "utf8");
const js = html.split("<script>")[1].split("</script>")[0].replace(/^"use strict";/, "");
const api = new Function(js +
  "\n;return {LISTS,S,load,save,setS:v=>{S=v;},getS:()=>S,KEY,switchList,fleetDocument,moveUnit,rangeLabel,armLineHTML,weaponChipsHTML," +
  "packFleet,unpackFleet,QR,PHONE_LINK,phoneBase,KEY_LIB,libRead,saveOpenAs,libAdd,libAddText,libOpen,libDelete,libDocument,openUnsaved," +
  "phonePanelHTML,setPhone:v=>{PHONE=v;},qrFull," +
  "getNote:()=>LOAD_NOTE,setNote:v=>{LOAD_NOTE=v;},unitPts,entOf,SHIPS,optState,optCount,DOMAIN};")();
const { LISTS, load, save, setS, getS, KEY, switchList, getNote, setNote, entOf,
        unitPts, SHIPS, optState, optCount, DOMAIN } = api;

let pass = 0, fail = 0;
const check = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  console.log("  " + (ok ? "PASS" : "FAIL") + "  " + name +
              "  ->  " + JSON.stringify(got) +
              (ok ? "" : "   odotettu " + JSON.stringify(want)));
  ok ? pass++ : fail++;
};

/* Rakentaa tallenteen listan nimen ja rivien nimien perusteella, ja
   sotkee indeksit tahallaan. */
function makeSave(listName, rows, { liShift = 0, secShift = 0 } = {}) {
  const li = LISTS.findIndex(L => L.nm === listName);
  const L0 = LISTS[li];
  const units = rows.map(([secName, entRe]) => {
    const si = L0.secs.findIndex(s => s.t === secName);
    const ei = L0.secs[si].ents.findIndex(e => entRe.test(e.l));
    if (ei < 0) throw new Error("ei rivia " + entRe + " osiossa " + secName);
    return { s: si + secShift, e: ei, ref: L0.secs[si].ents[ei].r || null,
             n: 1, opts: [], name: "", el: L0.secs[si].ents[ei].l, sn: secName };
  });
  return JSON.stringify({ li: li + liShift, ln: listName, limit: 1500, units: units });
}

function restore(raw) {
  store[KEY] = raw;
  delete store[KEY + "-backup"];
  setS({ li: 0, limit: 1500, units: [] });
  setNote("");
  load();
  return getS();
}

console.log("Tallenteen palautus\n");

/* 1. osioindeksi siirtynyt yhdella (juuri se mita FLEET RULES -lohkon
      periminen teki 19 listalle) */
let raw = makeSave("Orks — Waaagh!",
  [["KROOZERS", /^Terror ship/], ["ESCORTS", /^Ravager/]], { secShift: -1 });
let S1 = restore(raw);
check("osiosiirto: aluksia palautui", S1.units.length, 2);
check("osiosiirto: oikea rivi", entOf(S1.units[0]).l, "Terror ship");
check("osiosiirto: oikea lista", LISTS[S1.li].nm, "Orks — Waaagh!");

/* 2. listaindeksi siirtynyt (uusi lista lisatty aiemmin luetteloon) */
raw = makeSave("Tau — Commerce Protection",
  [["ESCORTS", /^Defender/]], { liShift: -3 });
let S2 = restore(raw);
check("listasiirto: oikea lista", LISTS[S2.li].nm, "Tau — Commerce Protection");
check("listasiirto: aluksia palautui", S2.units.length, 1);

/* 3. molemmat siirtyneet yhtaikaa */
raw = makeSave("Tyranids — Hive Fleet",
  [["HIVE SHIPS", /^Hive ship/], ["ESCORTS", /^Kraken/]],
  { liShift: 2, secShift: 3 });
let S3 = restore(raw);
check("molemmat siirrot: aluksia palautui", S3.units.length, 2);
check("molemmat siirrot: oikea rivi", entOf(S3.units[1]).l, "Kraken");

/* 4. rivi siirtynyt toiseen osioon: haku koko listasta */
{
  const li = LISTS.findIndex(L => L.nm === "Necrons — Harvest Fleet");
  const L0 = LISTS[li];
  const si = L0.secs.findIndex(s => s.t === "Cruisers");
  const ei = L0.secs[si].ents.findIndex(e => /^Scythe/.test(e.l));
  const u = { s: 0, e: 0, ref: L0.secs[si].ents[ei].r, n: 1, opts: [], name: "",
              el: L0.secs[si].ents[ei].l, sn: "Osio jota ei ole" };
  raw = JSON.stringify({ li: li, ln: L0.nm, limit: 1500, units: [u] });
  const S4 = restore(raw);
  check("kadonnut osio: rivi loytyi nimella", S4.units.length, 1);
  check("kadonnut osio: oikea osio", LISTS[S4.li].secs[S4.units[0].s].t, "Cruisers");
}

/* 5. tuntematon rivi: laivasto ei tyhjene kokonaan eika tallenne ylikirjoitu */
{
  const li = LISTS.findIndex(L => L.nm === "Orks — Cyclops Cluster");
  const L0 = LISTS[li];
  const si = L0.secs.findIndex(s => s.t === "KROOZERS");
  const good = { s: si, e: 0, ref: L0.secs[si].ents[0].r, n: 1, opts: [],
                 name: "", el: L0.secs[si].ents[0].l, sn: "KROOZERS" };
  const gone = { s: si, e: 99, ref: null, n: 1, opts: [], name: "",
                 el: "Alus jota ei ole", sn: "KROOZERS" };
  raw = JSON.stringify({ li: li, ln: L0.nm, limit: 1500, units: [good, gone] });
  const S5 = restore(raw);
  check("tuntematon rivi: tunnettu sailyi", S5.units.length, 1);
  check("tuntematon rivi: varmuuskopio otettiin",
        store[KEY + "-backup"] === raw, true);
  check("tuntematon rivi: kayttajalle kerrotaan", getNote().length > 20, true);
}

/* 6. kokonaan tuntematon lista: tallennetta ei kosketa */
{
  raw = JSON.stringify({ li: 0, ln: "Lista jota ei ole", limit: 1500,
                         units: [{ s: 0, e: 0, ref: null, n: 1, opts: [],
                                   name: "", el: "x", sn: "y" }] });
  const S6 = restore(raw);
  check("tuntematon lista: laivasto tyhja", S6.units.length, 0);
  check("tuntematon lista: varmuuskopio otettiin",
        store[KEY + "-backup"] === raw, true);
}

/* 7. tallennus ja lataus edestakaisin sailyttaa paivitysvalinnat */
{
  const li = LISTS.findIndex(L => L.nm === "Chaos — Black Crusade");
  const L0 = LISTS[li];
  const si = L0.secs.findIndex(s => s.t === "Cruisers");
  const u = { s: si, e: 0, ref: L0.secs[si].ents[0].r, n: 1, opts: [], name: "" };
  setS({ li: li, limit: 1500, units: [u] });
  /* Paivitys jota TALLE alukselle tarjotaan: rivi jolla ei ole
     kiinnitysta, tai jonka kiinnitys nimeaa taman rivin. Palautus ei
     enaa tarjoa muille kuuluvia paivityksia, eika pidakaan. */
  let upSi = -1, upEi = -1;
  L0.secs.forEach((sec, i) => sec.ents.forEach((en, j) => {
    if (upSi >= 0 || en.k !== "up") return;
    if (en.at && !en.at.some(p => p[0] === si && p[1] === 0)) return;
    upSi = i; upEi = j;
  }));
  if (upSi >= 0) {
    u.ups = {}; u.ups[upSi + ":" + upEi] = "take";
    save();
    const S7 = restore(store[KEY]);
    check("edestakaisin: paivitys sailyi",
          S7.units[0].ups[upSi + ":" + upEi], "take");
  } else {
    console.log("  OHITETTU  edestakaisin: sopivaa paivitysrivia ei loytynyt");
  }
}

/* 8. rikkinaiset tallenteet: jokainen suojaa alkuperaisen ja kertoo siita.
      Ennen 8.9.2026 nama kolme paattyivat hiljaiseen return-haaraan, ja
      kaynnistys tallensi tyhjan oletustilan paalle. */
[["katkaistu JSON", '{"li":0,"ln":"x","units":[{"s":0,'],
 ["units puuttuu", '{"li":0,"ln":"Chaos \u2014 Incursion","limit":1500}'],
 ["units:[null]", '{"li":0,"ln":"Chaos \u2014 Incursion","limit":1500,"units":[null]}']
].forEach(([nimi, bad]) => {
  const S8 = restore(bad);
  check(nimi + ": varmuuskopio otettiin",
        store[KEY + "-backup"] === bad || store[KEY + "-backup-last"] === bad, true);
  check(nimi + ": kayttajalle kerrotaan", getNote().length > 20, true);
  check(nimi + ": laivasto tyhja", S8.units.length, 0);
});

/* 9. ensimmaista varmuuskopiota ei ylikirjoiteta myohemmalla virheella */
{
  store[KEY + "-backup"] = "";
  delete store[KEY + "-backup"];
  const first = '{"li":0,"ln":"Ensimmainen","limit":1500,"units":[]}';
  store[KEY] = first; setS({ li:0, limit:1500, units:[] }); setNote(""); load();
  const second = '{"li":0,"ln":"Toinen","limit":1500,"units":[]}';
  store[KEY] = second; setS({ li:0, limit:1500, units:[] }); setNote(""); load();
  check("varmuuskopio: ensimmainen sailyi", store[KEY + "-backup"], first);
  check("varmuuskopio: viimeisin talletettu erikseen",
        store[KEY + "-backup-last"], second);
}

/* 10. osio nimetaan uudelleen: ostos loytyy yha rivin nimella.
       Ennen korjausta Power Ram katosi aanettomasti ja hinta putosi. */
{
  const li = LISTS.findIndex(L => L.nm === "Imperial Navy \u2014 Gothic Sector");
  const L0 = LISTS[li];
  let si = -1, ei = -1;
  L0.secs.forEach((sec, i) => sec.ents.forEach((en, j) => {
    if (si < 0 && en.r) { si = i; ei = j; }
  }));
  let usi = -1, uei = -1;
  L0.secs.forEach((sec, i) => sec.ents.forEach((en, j) => {
    if (usi >= 0 || en.k !== "up") return;
    if (en.at && !en.at.some(p => p[0] === si && p[1] === ei)) return;
    usi = i; uei = j;
  }));
  const upLabel = L0.secs[usi].ents[uei].l;
  const u = { s: si, e: ei, ref: L0.secs[si].ents[ei].r, n: 1, opts: [], name: "",
              el: L0.secs[si].ents[ei].l, sn: L0.secs[si].t,
              upn: {} };
  /* tallenteessa osion nimi on eri kuin nyt */
  u.upn["Osio jolla oli ennen toinen nimi\u0001" + upLabel] = "take";
  raw = JSON.stringify({ li: li, ln: L0.nm, limit: 1500, units: [u] });
  const S10 = restore(raw);
  check("osion uudelleennimeys: ostos sailyi",
        S10.units[0].ups[usi + ":" + uei], "take");
}

/* 11. sama versio, sama tallenne: ostos ei saa monistua.
       Katselmointi 8.9.2026: Chaos Lord + Mark of Khorne oli 45 pistetta,
       ja uudelleenavaus teki siita 65 - Warmaster-osion samanniminen rivi
       nappasi saman tallennetun valinnan varahaulla. */
{
  const li = LISTS.findIndex(L => L.nm === "Chaos \u2014 Khorne");
  const L0 = LISTS[li];
  const lsi = L0.secs.findIndex(s => s.t === "Chaos Lords");
  const lei = L0.secs[lsi].ents.findIndex(e => /^Chaos Lord/.test(e.l));
  const mei = L0.secs[lsi].ents.findIndex(e => /Mark of Khorne/.test(e.l));
  const u = { s: lsi, e: lei, ref: null, n: 1, opts: [], name: "" };
  setS({ li: li, limit: 1500, units: [u] });
  u.ups = {}; u.ups[lsi + ":" + mei] = "take";
  const before = unitPts(u);
  save();
  const S11 = restore(store[KEY]);
  const after = unitPts(S11.units[0]);
  const marks = Object.keys(S11.units[0].ups || {})
    .filter(k => S11.units[0].ups[k] === "take").length;
  check("sama versio: hinta sailyy", after, before);
  check("sama versio: ostos ei monistu", marks, 1);
  check("sama versio: ei valeilmoitusta", getNote(), "");
}

/* 12. epaonnistunut palautus ei ylikirjoita alkuperaista */
{
  const orig = '{"li":0,"ln":"Lista jota ei ole","limit":1500,"units":[]}';
  restore(orig);
  save();                                   /* kuten kaynnistyksen render() */
  check("epaonnistunut palautus: alkuperainen sailyy", store[KEY], orig);
  /* kun pelaaja lisaa jotain, tallennus jatkuu normaalisti */
  const li = LISTS.findIndex(L => L.nm === "Chaos \u2014 Khorne");
  setS({ li: li, limit: 1500,
         units: [{ s: 1, e: 0, ref: null, n: 1, opts: [], name: "" }] });
  save();
  check("lisayksen jalkeen tallennus jatkuu", store[KEY] !== orig, true);
}

/* 13. estetty tallennusluku ei kaada kaynnistysta */
{
  const real = global.localStorage;
  global.localStorage = { getItem(){ throw new Error("SecurityError"); },
                          setItem(){ throw new Error("SecurityError"); } };
  setS({ li: 0, limit: 1500, units: [] });
  setNote("");
  let threw = false;
  try { load(); } catch(e) { threw = true; }
  check("estetty tallennus: load ei heita", threw, false);
  check("estetty tallennus: kayttajalle kerrotaan", getNote().length > 20, true);
  global.localStorage = real;
}

/* 14. schema 2: aluksen optiot ID:lla (P1-8a, docs/SAVE_SCHEMA.md).
   Indeksi on tahallaan vaarin ja ID oikein - kirjan uusi versio siirsi
   optioita. Ennen: vaara optio oikealla hinnalla, hiljaa. */
{
  let f = null;
  for (const L of LISTS) {
    for (let si = 0; si < L.secs.length && !f; si++)
      for (let ei = 0; ei < L.secs[si].ents.length && !f; ei++) {
        const en = L.secs[si].ents[ei];
        if (en.k !== "unit" || !en.r || en.noopt) continue;
        const sh = SHIPS[String(en.r)];
        if (!sh || !sh.ol || sh.ol.length < 2) continue;
        const o = sh.ol[1];
        if (typeof o.c !== "number" || !o.c || o.dep != null || o.grp || o.qty) continue;
        if (sh.ol[0].c === o.c) continue;          /* hinnan on erotettava rivit */
        f = { L, si, ei, en, sh };
      }
    if (f) break;
  }
  check("schema 2: testialus loytyi", !!f, true);
  const li = LISTS.indexOf(f.L), id1 = f.sh.ol[1].id;
  const mk = extra => JSON.stringify({ schemaVersion: 2, li, ln: f.L.nm, limit: 1500,
    units: [Object.assign({ s: f.si, e: f.ei, ref: f.en.r, n: 1, opts: [0], name: "",
                            sn: f.L.secs[f.si].t, el: f.en.l, os: { "0": "take" } }, extra)] });

  /* a) ID osuu, indeksi ei: ID voittaa */
  const Sa = restore(mk({ oi: { [id1]: "take" }, on: { [id1]: DOMAIN.textKey(f.sh.ol[1].t) } }));
  check("schema 2: ID voittaa indeksin", [optState(Sa.units[0], 0), optState(Sa.units[0], 1)], ["opt", "take"]);
  check("schema 2: hinta option 1 mukaan",
        unitPts(Sa.units[0]),
        unitPts({ s: f.si, e: f.ei, ref: f.en.r, n: 1, opts: [1], os: { "1": "take" }, name: "" }));
  check("schema 2: ei ilmoitusta kun kaikki osui", getNote(), "");

  /* b) ID ei osu (teksti korjattiin), 40 merkin teksti osuu */
  const Sb = restore(mk({ oi: { "0:00000000": "take" }, on: { "0:00000000": DOMAIN.textKey(f.sh.ol[1].t) } }));
  check("schema 2: teksti varana", optState(Sb.units[0], 1), "take");
  check("schema 2: teksti varana - ei ilmoitusta", getNote(), "");

  /* c) kumpikaan ei osu: raportoidaan, varmuuskopio, alus sailyy */
  const Sc = restore(mk({ oi: { "0:00000000": "take" }, on: { "0:00000000": "Some option that is not there" } }));
  check("schema 2: tuntematon optio - alus sailyy", Sc.units.length, 1);
  check("schema 2: tuntematon optio - ei valintaa indeksista", optState(Sc.units[0], 0), "opt");
  check("schema 2: tuntematon optio - kayttajalle kerrotaan", getNote().includes("Some option that is not there"), true);
  check("schema 2: tuntematon optio - varmuuskopio", !!store[KEY + "-backup"], true);

  /* d) vanha tallenne (ei schemaVersionia): indeksi kelpaa, ja seuraava
        tallennus kirjoittaa version 2 ID:ineen */
  const raw1 = JSON.stringify({ li, ln: f.L.nm, limit: 1500,
    units: [{ s: f.si, e: f.ei, ref: f.en.r, n: 1, opts: [1], name: "", sn: f.L.secs[f.si].t, el: f.en.l, os: { "1": "take" } }] });
  const Sd = restore(raw1);
  check("schema 1: indeksi kelpaa", optState(Sd.units[0], 1), "take");
  save();
  const saved = JSON.parse(store[KEY]);
  check("schema 1 -> 4: versio kirjoitettu", saved.schemaVersion, 4);
  check("schema 1 -> 2: oi kirjoitettu", saved.units[0].oi, { [id1]: "take" });
  check("schema 1 -> 2: on kirjoitettu", saved.units[0].on[id1], DOMAIN.textKey(f.sh.ol[1].t));
  check("schema 2: os/oq/ups/opts eivat ole tallenteessa (kohta 9)",
        ["os", "oq", "ups", "opts"].filter(k => k in saved.units[0]), []);
  const ALLOWED = ["s", "e", "ref", "n", "name", "sn", "el", "hn", "custom", "adj", "note", "members", "upsOpen", "oi", "oqi", "on", "upn", "lst", "role"];
  check("schema 2: yksikon kentat ovat skeeman mukaiset",
        Object.keys(saved.units[0]).filter(k => !ALLOWED.includes(k)), []);
  check("schema 2: dokumentin ylatason kentat",
        Object.keys(saved).sort(), ["li", "limit", "ln", "schemaVersion", "units"]);
  check("schema 1: vanhasta tallenteesta kerrotaan kerran", /older version/.test(getNote()), true);
  /* uudempi skeema: ei puoliksi, vaan varmuuskopio ja ilmoitus */
  const raw3 = JSON.stringify({ schemaVersion: 99, li, ln: f.L.nm, limit: 1500, units: [{ s: f.si, e: f.ei, ref: f.en.r, n: 1, name: "", sn: f.L.secs[f.si].t, el: f.en.l }] });
  const S3 = restore(raw3);
  check("schema 99: ei palauteta", S3.units.length, 0);
  check("schema 99: varmuuskopio ja ilmoitus", !!store[KEY + "-backup"] && /newer version/.test(getNote()), true);
}

/* 15. schema 2: toistettavan option maara ID:lla */
{
  let f = null;
  for (const L of LISTS) {
    for (let si = 0; si < L.secs.length && !f; si++)
      for (let ei = 0; ei < L.secs[si].ents.length && !f; ei++) {
        const en = L.secs[si].ents[ei];
        if (en.k !== "unit" || !en.r || en.noopt) continue;
        const sh = SHIPS[String(en.r)];
        const qi = sh && sh.ol ? sh.ol.findIndex(o => o.qty && o.qty.max >= 2) : -1;
        if (qi < 0) continue;
        f = { L, si, ei, en, sh, qi };
      }
    if (f) break;
  }
  check("schema 2 maara: testialus loytyi", !!f, true);
  const li = LISTS.indexOf(f.L), id = f.sh.ol[f.qi].id;
  const raw = JSON.stringify({ schemaVersion: 2, li, ln: f.L.nm, limit: 1500,
    units: [{ s: f.si, e: f.ei, ref: f.en.r, n: 1, opts: [], name: "", sn: f.L.secs[f.si].t, el: f.en.l,
              os: {}, oq: { "0": 2 }, oi: { [id]: "take" }, oqi: { [id]: 2 }, on: { [id]: DOMAIN.textKey(f.sh.ol[f.qi].t) } }] });
  const Sq = restore(raw);
  check("schema 2 maara: tila ID:lla", optState(Sq.units[0], f.qi), "take");
  check("schema 2 maara: maara ID:lla", optCount(Sq.units[0], f.qi), 2);
  if (f.qi !== 0) check("schema 2 maara: vaara indeksi ei vuoda", (Sq.units[0].oq || {})[0], undefined);
}

/* 16. skeema 3: lainalaiva sailyy tallenteessa (1.1, Fleets s.14)
   Toiselta listalta ostettu yksikko kantaa oman listansa (lst) ja roolinsa
   (role). Ilman niita tallenne palauttaisi isantalistan rivin samasta
   indeksista: eri alus eri hinnalla, aanettomasti. Siksi tassa mitataan sen
   lisaksi etta yksikko palaa, myos ETTEI SE PALAA VAARIN kun lahdelista on
   kadonnut. */
{
  const pick = L => {
    for (let si = 0; si < L.secs.length; si++)
      for (let ei = 0; ei < L.secs[si].ents.length; ei++) {
        const en = L.secs[si].ents[ei];
        if (en.k === "unit" && en.r && en.p != null) return { si, ei, en };
      }
    return null;
  };
  let host = null, donor = null;
  for (const L of LISTS) {
    const at = pick(L);
    if (!at) continue;
    if (!host) host = { L, at };
    else if (L.nm !== host.L.nm) { donor = { L, at }; break; }
  }
  check("skeema 3: kaksi listaa loytyi", !!(host && donor), true);

  const mkUnit = (at, extra) => Object.assign(
    { s: at.si, e: at.ei, ref: at.en.r, n: 1, opts: [], name: "" }, extra || {});

  /* a) Oman listan laivasto kirjoittaa yha skeema-2:n muotoisen yksikon. */
  setS({ li: LISTS.indexOf(host.L), limit: 1500, units: [mkUnit(host.at)] });
  setNote(""); save();
  const own = JSON.parse(store[KEY]);
  check("skeema 3: oman listan yksikossa ei ole lst/role",
        ["lst", "role"].filter(k => k in own.units[0]), []);
  check("skeema 4: versio 4 myos yhden listan laivastossa", own.schemaVersion, 4);

  /* b) Lainalaiva: sama rivi, sama hinta, sama rooli kierroksen jalkeen. */
  const borrowed = mkUnit(donor.at, { lst: donor.L.nm, role: "ally" });
  setS({ li: LISTS.indexOf(host.L), limit: 1500,
         units: [mkUnit(host.at), borrowed] });
  const ptsBefore = unitPts(borrowed), labBefore = entOf(borrowed).l;
  setNote(""); save();
  const doc = JSON.parse(store[KEY]);
  check("skeema 3: lainalaivan lst kirjoitettu", doc.units[1].lst, donor.L.nm);
  check("skeema 3: lainalaivan role kirjoitettu", doc.units[1].role, "ally");
  check("skeema 3: lainalaivan osio on LAHDELISTALTA",
        doc.units[1].sn, donor.L.secs[donor.at.si].t);
  const Sb = restore(store[KEY]);
  check("skeema 3: molemmat yksikot palasivat", Sb.units.length, 2);
  check("skeema 3: lainalaiva muistaa listansa", Sb.units[1].lst, donor.L.nm);
  check("skeema 3: lainalaiva muistaa roolinsa", Sb.units[1].role, "ally");
  check("skeema 3: sama rivi kierroksen jalkeen", entOf(Sb.units[1]).l, labBefore);
  check("skeema 3: sama hinta kierroksen jalkeen", unitPts(Sb.units[1]), ptsBefore);
  check("skeema 3: oma yksikko ei saanut lahdelistaa", Sb.units[0].lst, undefined);
  check("skeema 3: puhdas kierros ei kerro mitaan", getNote(), "");

  /* c) Lahdelista poissa: yksikkoa EI saa palauttaa isantalistan riviksi.
        Tama on koko kentan olemassaolon syy. */
  const gone = JSON.stringify({ schemaVersion: 3, li: LISTS.indexOf(host.L),
    ln: host.L.nm, limit: 1500,
    units: [mkUnit(host.at, { sn: host.L.secs[host.at.si].t, el: host.at.en.l }),
            mkUnit(donor.at, { sn: donor.L.secs[donor.at.si].t, el: donor.at.en.l,
                               lst: "No Such Fleet List", role: "reserve" })] });
  const Sc = restore(gone);
  check("skeema 3: kadonnut lahdelista ei palauta alusta", Sc.units.length, 1);
  check("skeema 3: kadonneesta kerrotaan", getNote().length > 0, true);
  check("skeema 3: kadonnut otti varmuuskopion", !!store[KEY + "-backup"], true);

  /* d) Skeema 2 -> 3: vanha yhden listan tallenne palautuu ilman rooleja. */
  const old2 = JSON.stringify({ schemaVersion: 2, li: LISTS.indexOf(host.L),
    ln: host.L.nm, limit: 1500,
    units: [mkUnit(host.at, { sn: host.L.secs[host.at.si].t, el: host.at.en.l })] });
  const Sd2 = restore(old2);
  check("skeema 2 -> 3: yksikko palasi", Sd2.units.length, 1);
  check("skeema 2 -> 3: yksikko on oman listan alus", Sd2.units[0].lst, undefined);
  check("skeema 2 -> 3: ei ilmoitusta", getNote(), "");
}

/* 12. listakohtainen muisti (J146): listaa vaihtaessa laivasto ei katoa, vaan
   jaa talteen oman listansa nimen alle ja palaa kun listaan palataan. Avoin
   laivasto pysyy `units`issa, muut ovat `fleets`issa - vanha build lukee siis
   yha sen laivaston, joka pelaajalla on auki. */
{
  const pick = (L) => {
    for (let si = 0; si < L.secs.length; si++)
      for (let ei = 0; ei < L.secs[si].ents.length; ei++) {
        const en = L.secs[si].ents[ei];
        if (en.k === "unit" && en.r) return { si, ei, en };
      }
    return null;
  };
  const A = LISTS.find(L => L.nm === "Imperial Navy \u2014 Gothic Sector");
  const B = LISTS.find(L => L.nm === "Chaos \u2014 Nurgle");
  const a = pick(A), b = pick(B);
  const mk = at => ({ s: at.si, e: at.ei, ref: at.en.r, n: 1, opts: [], name: "" });

  setS({ li: LISTS.indexOf(A), limit: 1500, units: [mk(a)],
         stash: { [B.nm]: { units: [mk(b)], limit: 750 } } });
  setNote(""); save();
  const doc = JSON.parse(store[KEY]);
  check("talteen: avoin laivasto on yha units-kentassa", doc.units.length, 1);
  check("talteen: toisen listan laivasto on fleets-kentassa",
        (doc.fleets || []).map(f => [f.ln, f.units.length]), [[B.nm, 1]]);
  /* Pisteraja kuuluu laivastolle: se syottaa laillisuuspaneelin, joten
     edellisen listan luku tekisi tarkistuksista vaaria. */
  check("talteen: laivaston oma pisteraja kirjoitetaan", doc.fleets[0].limit, 750);
  /* Talteen pantu laivasto tallennetaan OMAN listansa riveilla, vaikka auki
     on toinen lista: sama osioindeksi on toisella listalla eri alus, ja ilman
     tata se palasi vaarana laivana oikealta nakyttavalta riviltä. */
  check("talteen: rivi kirjoitetaan sen oman listan nimilla",
        [doc.fleets[0].units[0].sn, doc.fleets[0].units[0].el],
        [B.secs[b.si].t, b.en.l]);
  const S1 = restore(store[KEY]);
  check("talteen: avoin laivasto palasi", S1.units.length, 1);
  check("talteen: toisen listan laivasto palasi oikealle listalle",
        Object.keys(S1.stash || {}), [B.nm]);
  check("talteen: palautettu rivi on sama alus",
        B.secs[S1.stash[B.nm].units[0].s].ents[S1.stash[B.nm].units[0].e].l, b.en.l);
  check("talteen: pisteraja palasi laivaston mukana", S1.stash[B.nm].limit, 750);
  check("talteen: ei ilmoitusta", getNote(), "");

  /* Tyhja laivasto ei jaa talteen: valikko sanoisi muuten "0 pts" listalle
     jota pelaaja vain vilkaisi. */
  setS({ li: LISTS.indexOf(A), limit: 1500, units: [mk(a)], stash: { [B.nm]: { units: [], limit: 900 } } });
  setNote(""); save();
  check("talteen: tyhjaa laivastoa ei kirjoiteta", "fleets" in JSON.parse(store[KEY]), false);
  check("talteen: yhden listan tallenteen ylatason kentat ennallaan",
        Object.keys(JSON.parse(store[KEY])).sort(), ["li", "limit", "ln", "schemaVersion", "units"]);

  /* Lista joka ei enaa ole datassa: kerrotaan, ei pudoteta hiljaa. */
  const gone = JSON.stringify({ schemaVersion: 4, li: LISTS.indexOf(A), ln: A.nm, limit: 1500,
    units: [Object.assign(mk(a), { sn: A.secs[a.si].t, el: a.en.l })],
    fleets: [{ ln: "Imperial Navy \u2014 Ei Enaa Olemassa",
               units: [Object.assign(mk(b), { sn: B.secs[b.si].t, el: b.en.l })] }] });
  const S2 = restore(gone);
  check("kadonnut lista: avoin laivasto palasi silti", S2.units.length, 1);
  check("kadonnut lista: talteenpantua ei ole", Object.keys(S2.stash || {}).length, 0);
  check("kadonnut lista: kayttajalle kerrotaan", /Ei Enaa Olemassa|could not be restored/.test(getNote()), true);
  check("kadonnut lista: varmuuskopio otettiin", store[KEY + "-backup"] === gone, true);

  /* Listaa vaihtaessa laivasto jaa talteen ja palaa - myos pisteraja.
     Jarjestys on kantava: laivasto pannaan talteen kun S.li on viela sen oma
     lista, ja S.li asetetaan ennen renderia, jonka applyRequired ratkaisee
     paivitysrivit L():n kautta (J103). */
  setS({ li: LISTS.indexOf(A), limit: 1500, units: [mk(a)], stash: {} });
  switchList(LISTS.indexOf(B));
  const atB = { li: getS().li, units: getS().units.length, limit: getS().limit,
                kept: Object.keys(getS().stash) };
  getS().units.push(mk(b)); getS().limit = 750;
  switchList(LISTS.indexOf(A));
  const atA = { li: getS().li, units: getS().units.length, limit: getS().limit,
                keptPts: Object.keys(getS().stash) };
  switchList(LISTS.indexOf(B));
  const u0 = getS().units[0];
  const backB = { units: getS().units.length, limit: getS().limit,
                  row: u0 && B.secs[u0.s] ? (B.secs[u0.s].ents[u0.e] || {}).l : null };
  check("vaihto: A:n laivasto jai talteen, B aukeaa tyhjana",
        [atB.li, atB.units, atB.kept], [LISTS.indexOf(B), 0, [A.nm]]);
  check("vaihto: A:han palatessa laivasto ja raja palaavat",
        [atA.units, atA.limit, atA.keptPts], [1, 1500, [B.nm]]);
  check("vaihto: B:n laivasto ja sen oma raja palaavat",
        [backB.units, backB.limit, backB.row], [1, 750, b.en.l]);

  /* Vanha tallenne ilman fleets-kenttaa avautuu ennallaan. */
  const old = JSON.stringify({ schemaVersion: 3, li: LISTS.indexOf(A), ln: A.nm, limit: 1500,
    units: [Object.assign(mk(a), { sn: A.secs[a.si].t, el: a.en.l })] });
  const S3 = restore(old);
  check("skeema 3 avautuu: laivasto palasi", S3.units.length, 1);
  check("skeema 3 avautuu: talteenpantuja ei ole", Object.keys(S3.stash || {}).length, 0);
  check("skeema 3 avautuu: ei ilmoitusta", getNote(), "");
}

/* --- vienti ja tuonti tiedostona (28.9.2026) ---------------------------
   Tiedosto on sama yhden listan tallenne, jonka selain pitaa; tuonti kulkee
   saman ratkaisijan lapi (nimi ensin, indeksi varalla, jokainen puuttuva
   kerrotaan) ja laskeutuu laivaston omalle listalle. */
{
  console.log("\nVienti tiedostona");
  const { fleetDocument } = api;
  restore(makeSave("Orks \u2014 Waaagh!", [["KROOZERS", /^Terror ship/], ["ESCORTS", /^Ravager/]]));
  const doc = fleetDocument("Orks \u2014 Waaagh!");
  check("vienti: tiedosto on yhden listan tallenne", [doc.app, doc.ln, doc.units.length, doc.schemaVersion],
        ["Gothic Fleet Registry fleet", "Orks \u2014 Waaagh!", 2, DOMAIN.SCHEMA_VERSION]);
  check("vienti: rivit nimella", doc.units.map(u => u.el), ["Terror ship", "Ravager attack ship"]);
  check("vienti: listaa jolla ei ole laivastoa ei vieda", fleetDocument("Tau \u2014 Commerce Protection"), null);
}

/* --- nimetty kirjasto: Save, Saved fleets, Import, linkki (J208) -----------
   Kayttaja 19.10.2026: laivastot tallennetaan nimella erikseen, QR-koodi ja
   tiedosto lisaavat laivastoja kirjastoon, ja jokainen lista muistaa
   tallentamattomat muokkauksensa kuten ennenkin. Tiedosto ja linkki eivat
   koskaan korvaa ruudulla olevaa laivastoa. */
const ASYNC = [];
{
  console.log("\nNimetty kirjasto");
  const { libRead, saveOpenAs, libAdd, libAddText, libOpen, libDelete, libDocument, openUnsaved, KEY_LIB, packFleet, unpackFleet, QR, PHONE_LINK, phoneBase, fleetDocument } = api;
  const empty = () => JSON.stringify({ li: 0, ln: LISTS[0].nm, limit: 1500, units: [] });
  const ORK = "Orks \u2014 Waaagh!", TAU = "Tau \u2014 Commerce Protection";
  delete store[KEY_LIB];
  restore(makeSave(ORK, [["KROOZERS", /^Terror ship/], ["ESCORTS", /^Ravager/]]));
  check("aluksi: ei tallennettuja, avoin laivasto on tallentamaton", [libRead().saves.length, openUnsaved()], [0, true]);
  const a = saveOpenAs("Orks turnaus");
  check("Save: kirjastoon nimella, lista ja pisteet mukana", [libRead().saves.length, a.name, a.ln, a.units.length, a.pts > 0], [1, "Orks turnaus", ORK, 2, true]);
  check("Save: avoin laivasto on nyt tallennettu", openUnsaved(), false);
  /* muokkaus: yksi alus pois -> tallentamaton; Save paivittaa saman */
  getS().units.pop(); save();
  check("muutos tallennuksen jalkeen nakyy", openUnsaved(), true);
  const a2 = saveOpenAs("Orks turnaus");
  check("Save paivittaa saman tallennuksen", [libRead().saves.length, a2.id === a.id, a2.units.length], [1, true, 1]);
  const b = saveOpenAs("Orks turnaus", true);
  check("Save as new: toinen tallennus, nimi ei tormaa", [libRead().saves.length, b.name, b.id !== a.id], [2, "Orks turnaus (2)", true]);
  /* toinen lista: Tau kirjastoon tiedostona, Orkit jaavat muokattaviksi */
  const tau = JSON.parse(makeSave(TAU, [["ESCORTS", /^Defender/]]));
  let r = libAddText(JSON.stringify(Object.assign({ app: "Gothic Fleet Registry fleet", name: "Tau partio" }, tau)), "file");
  check("Import: tiedoston laivasto kirjastoon nimineen, avoin laivasto ennallaan",
        [r.ids.length, libRead().saves[0].name, libRead().saves[0].from, LISTS[getS().li].nm, getS().units.length], [1, "Tau partio", "file", ORK, 1]);
  r = libAddText(JSON.stringify(tau), "file");
  check("Import: sama laivasto toiseen kertaan ei tule kahdesti", [r.ids.length, /already/.test(r.notes.join(" "))], [0, true]);
  /* avaus: Tau-listalla ei mitaan -> avautuu kysymatta */
  check("Open: avautuu omalle listalleen", [libOpen(libRead().saves[0].id), LISTS[getS().li].nm, getS().units.length], [true, TAU, 1]);
  check("Open: Orkkien tallentamaton muokkaus jai talteen omalle listalleen", (getS().stash[ORK] || { units: [] }).units.length, 1);
  /* avaus, kun listalla on tallentamaton muutos: confirm() on tassa false -> ei korvata */
  switchList(LISTS.findIndex(L => L.nm === ORK));
  getS().units.push(JSON.parse(JSON.stringify(getS().units[0]))); save();
  check("Open tallentamattoman paalle ilman lupaa: ei korvata", [libOpen(b.id), getS().units.length], [false, 2]);
  /* nimilla, ei indekseilla: siirtyneet indeksit palautuvat */
  const skew = libRead().saves.filter(x => x.id === b.id)[0];
  const st = JSON.parse(store[KEY_LIB]); st.saves.forEach(x => { if(x.id === b.id) x.units.forEach(u => { u.s += 1; u.e += 2; }); }); store[KEY_LIB] = JSON.stringify(st);
  getS().units = []; save();
  check("Open siirtynein indeksein: rivit nimella", [libOpen(b.id), getS().units.map(u => entOf(u).l)], [true, ["Terror ship"]]);
  void skew;
  /* linkin dokumentti: kaikki kirjastosta, nimet mukana */
  const all = libDocument("all");
  check("All: kaikki tallennetut yhdessa dokumentissa nimineen", [all.name, 1 + all.fleets.length, all.fleets.map(f => f.name)],
        ["Tau partio", 3, ["Orks turnaus (2)", "Orks turnaus"]]);
  /* toinen laite: tyhja kirjasto ottaa koko dokumentin vastaan */
  const before = store[KEY_LIB];
  delete store[KEY_LIB];
  r = libAdd(all, "link");
  check("linkki tyhjaan kirjastoon: kaikki kolme nimineen ja jarjestyksessa", [r.ids.length, libRead().saves.map(x => x.name), libRead().saves[0].from],
        [3, ["Tau partio", "Orks turnaus (2)", "Orks turnaus"], "link"]);
  store[KEY_LIB] = before;
  /* roska, uudempi skeema, tuntematon lista, puuttuva rivi */
  check("roska: kerrotaan, mitaan ei lisata", [libAddText("{nope", "file").ids.length, /JSON/.test(libAddText("{nope", "file").notes[0])], [0, true]);
  check("ei yksikoita: kerrotaan", /no fleet/.test(libAdd({ ln: ORK }, "file").notes[0]), true);
  check("uudempi skeema: kerrotaan", /newer version/.test(libAdd({ schemaVersion: DOMAIN.SCHEMA_VERSION + 1, ln: ORK, units: [] }, "file").notes[0]), true);
  check("tuntematon lista: kerrotaan", /not in this version/.test(libAdd({ ln: "Lista jota ei ole", units: [{ el: "x" }] }, "file").notes[0]), true);
  const part = JSON.parse(JSON.stringify(fleetDocument(ORK) || all.fleets[1]));
  part.units.push({ s: 0, e: 99, ref: null, n: 1, opts: [], name: "", el: "Alus jota ei ole", sn: "KROOZERS" });
  part.name = "Puuttuva rivi";
  r = libAdd(part, "file");
  check("puuttuva rivi: laivasto tulee ja siita kerrotaan", [r.ids.length, /could not be matched/.test(r.notes.join(" "))], [1, true]);
  /* poisto koskee vain kirjastoa */
  const n0 = libRead().saves.length, units0 = getS().units.length;
  libDelete(r.ids[0]);
  check("Delete: kirjastosta pois, muokattava laivasto ennallaan", [libRead().saves.length, getS().units.length], [n0 - 1, units0]);
  check("levylta tai localhostista linkki osoittaa julkaistuun pelisivuun", phoneBase(), { url: PHONE_LINK.play, remote: true });
  /* QR isommaksi (kayttaja 19.10.2026): Full screen napista ja koodin napautuksesta */
  api.setPhone({ key: "x", url: "https://bfgtools.kuldare.com/play/x#fleet=abc", svg: "<svg></svg>", err: "", remote: false, n: 1 });
  const pph = api.phonePanelHTML();
  check("To phone -paneelissa Full screen napissa ja koodissa", [(pph.match(/data-qrfull/g) || []).length, /Full screen<\/button>/.test(pph), typeof api.qrFull], [2, true, "function"]);
  api.setPhone({ key: null });
  ASYNC.push(async () => {
    const doc = libDocument("all");
    const frag = await packFleet(doc);
    check("linkki: #fleet= ja base64url", /^fleet=[A-Za-z0-9_-]+$/.test(frag), true);
    check("linkki: purettuna sama dokumentti", JSON.parse(await unpackFleet(frag)), doc);
    const q = QR.encode(PHONE_LINK.play + "#" + frag);
    check("linkki: mahtuu QR-koodiin", [q.size === q.version * 4 + 17, q.version <= 40], [true, true]);
  });
}

/* --- kantamat katalogissa ja laivastorivilla (29.9.2026) ------------------
   Katalogin aselinjassa kantama ryhman peraan, cm mukana; yhteinen kantama
   kerran ("all 30 cm"). Laivastorivilla ase kerrallaan: luokka, vahvuus,
   kantama, sektori. */
{
  console.log("\nKantamat");
  const { rangeLabel, armLineHTML, weaponChipsHTML } = api;
  check("kantama: 30 cm", rangeLabel(["30 cm"]), "30 cm");
  check("kantama: nova 30-150 cm", rangeLabel(["30 \u2013 150 cm"]), "30\u2013150 cm");
  check("kantama: launch bays 25/30 cm", rangeLabel(["Fighta-Bommas: 25 cm / Assault Boats: 30 cm"]), "25/30 cm");
  check("kantama: toistot kerran", rangeLabel(["30 cm", "30 cm", "60 cm"]), "30/60 cm");
  const GO = LISTS.filter(L => L.nm === "Imperial Navy \u2014 Gothic Sector")[0];
  const ent = (secRe, entRe) => { const sec = GO.secs.filter(s => secRe.test(s.t))[0]; return sec.ents.filter(e => entRe.test(e.l))[0]; };
  const lun = ent(/^Cruisers$/i, /^Lunar/), ret = ent(/^Battleships$/i, /^Retribution/);
  const lh = armLineHTML(SHIPS[String(lun.r)], lun, GO), rh = armLineHTML(SHIPS[String(ret.r)], ret, GO);
  const pills = h => (h.match(/class="rng[^"]*">[^<]*</g) || []).map(x => x.replace(/^.*">/, "").replace(/<$/, ""));
  check("Lunar: yksi yhteinen kantama", pills(lh), ["all 30 cm"]);
  check("Retribution: kantama ryhman peraan", pills(rh), ["60 cm", "60 cm", "30 cm"]);
  const tyr = ent(/^Cruisers$/i, /^Tyrant/);
  check("Tyrant: eri kantamat vahvuus kerrallaan", pills(armLineHTML(SHIPS[String(tyr.r)], tyr, GO)), ["45 cm", "30 cm", "30 cm"]);
  const cat = JSON.parse(fs.readFileSync(path.join(__dirname, "bfg_data.json"), "utf8"));
  const secR = GO.secs.filter(s => /^Battleships$/i.test(s.t))[0];
  const R = DOMAIN.resolveUnit({ schemaVersion: DOMAIN.SCHEMA_VERSION, role: "core",
    entry: { list: GO.nm, section: secR.t, label: ret.l }, ref: String(ret.r), hull: null, hulls: 1,
    name: "", note: "", adjust: 0, custom: null, members: [], options: {}, upgrades: {} }, { list: GO }, cat);
  const ch = weaponChipsHTML(R);
  const chips = (ch.match(/class="wchip"/g) || []).length;
  check("laivastorivi: Retributionin WB 12 vasen+oikea yhdessa sirussa, kolme sirua", chips, 3);
  check("laivastorivi: kantamat cm:ineen ja sektorit kuvina (WB:lla kaksi)", [/>60 cm</.test(ch), />30 cm</.test(ch), (ch.match(/class="arcg"/g) || []).length], [true, true, 4]);
  const dic = ent(/^Cruisers$/i, /^Dictator/);
  const secC = GO.secs.filter(s => /^Cruisers$/i.test(s.t))[0];
  const RD = DOMAIN.resolveUnit({ schemaVersion: DOMAIN.SCHEMA_VERSION, role: "core",
    entry: { list: GO.nm, section: secC.t, label: dic.l }, ref: String(dic.r), hull: null, hulls: 1,
    name: "", note: "", adjust: 0, custom: null, members: [], options: {}, upgrades: {} }, { list: GO }, cat);
  const dh = weaponChipsHTML(RD);
  check("laivastorivi: Dictatorin bayt summana 4, kolme sirua", [(dh.match(/class="wchip"/g) || []).length, /BAYS<\/b>4</.test(dh)], [3, true]);
}

/* --- jarjestys: laivan siirto listassa (28.9.2026) ------------------------
   Jarjestys on rosterin, korttien ja pelisivun jarjestys; siirto tallentuu. */
{
  console.log("\nLaivan siirto");
  const { moveUnit } = api;
  restore(makeSave("Orks — Waaagh!", [["KROOZERS", /^Terror ship/], ["KROOZERS", /^Kill kroozer/], ["ESCORTS", /^Ravager/]]));
  const names = () => getS().units.map(u => entOf(u).l);
  check("lahto", names(), ["Terror ship", "Kill kroozer", "Ravager attack ship"]);
  check("siirto alas: 0 -> 2", [moveUnit(0, 2), names()], [true, ["Kill kroozer", "Ravager attack ship", "Terror ship"]]);
  check("siirto ylos: 2 -> 0", [moveUnit(2, 0), names()], [true, ["Terror ship", "Kill kroozer", "Ravager attack ship"]]);
  check("siirto tallentuu", JSON.parse(store[KEY]).units.map(u => u.el), ["Terror ship", "Kill kroozer", "Ravager attack ship"]);
  check("paikallaan tai listan ulkopuolelle: ei mitaan", [moveUnit(1, 1), moveUnit(0, 3), moveUnit(-1, 0), names()], [false, false, false, ["Terror ship", "Kill kroozer", "Ravager attack ship"]]);
}


(async () => {
  for(const f of ASYNC){ try{ await f(); }catch(e){ console.log("  FAIL  " + String(e && e.stack || e).split("\n")[0]); fail++; } }
  console.log("\n" + (fail ? fail + " testia epaonnistui" : "kaikki testit lapi"));
  process.exit(fail ? 1 : 0);
})();
