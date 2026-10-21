/* Regressiotesti: ajaa sovelluksen oman validointilogiikan node-ymparistossa
   ja vertaa tuloksia kasin tarkistettuihin listoihin.

   Aja:  node test_validator.js
*/
const fs = require("fs");
const path = require("path");

/* ---- minimaalinen DOM-tynka, jotta sovelluksen skripti suostuu ajautumaan */
const el = () => ({
  textContent: "", innerHTML: "", value: "", className: "", dataset: {},
  querySelectorAll: () => [], appendChild(){}, onclick: null, onchange: null,
  oninput: null, style: {}, id: ""
});
global.document = {
  getElementById: id => id === "bfgdata"
    ? { textContent: fs.readFileSync(path.join(__dirname, "bfg_data.json"), "utf8") }
    : el(),
  querySelector: () => el(),
  createElement: () => el(),
  head: { appendChild(){} },
  body: { appendChild(){}, removeChild(){}, dataset: {} },
};
global.window = {}; global.navigator = {};
global.localStorage = { getItem: () => null, setItem(){} };
global.alert = () => {}; global.confirm = () => false;

const html = fs.readFileSync(path.join(__dirname, "Gothic Fleet Registry.html"), "utf8");
let js = html.split("<script>")[1].split("</script>")[0];
js = js.replace(/^"use strict";/, "");
const api = new Function(js + "\n;return {S,LISTS,SHIPS,checks,total,addUnit,hulls,setOptState,optState,unitPts};")();

const { LISTS, SHIPS } = api;
let fails = 0;
const eq = (got, want, what) => {
  const ok = got === want;
  if (!ok) fails++;
  console.log((ok ? "  PASS  " : "  FAIL  ") + what + "  ->  " + got +
              (ok ? "" : "  (odotettu " + want + ")"));
};

function listIndex(frag) {
  const i = LISTS.findIndex(l => l.nm.includes(frag));
  if (i < 0) throw new Error("listaa ei loydy: " + frag);
  return i;
}
function findEntry(li, frag) {
  const L = LISTS[li];
  /* Tasmallinen nimi ensin: Slaanesh-listalla "Wage of Sin" osuu
     alimerkkijonona ensin miehistorivin "Wage of Sin: Chosen Terminators". */
  for (let s = 0; s < L.secs.length; s++)
    for (let e = 0; e < L.secs[s].ents.length; e++)
      if (L.secs[s].ents[e].l.toLowerCase() === frag.toLowerCase())
        return { s, e, en: L.secs[s].ents[e] };
  for (let s = 0; s < L.secs.length; s++)
    for (let e = 0; e < L.secs[s].ents.length; e++)
      if (L.secs[s].ents[e].l.toLowerCase().includes(frag.toLowerCase()))
        return { s, e, en: L.secs[s].ents[e] };
  throw new Error("rivia ei loydy: " + frag + " listalta " + L.nm);
}
function build(li, limit, picks) {
  api.S.li = li; api.S.limit = limit; api.S.units = [];
  picks.forEach(([frag, n, opts, adj]) => {
    const { s, e, en } = findEntry(li, frag);
    api.S.units.push({ s, e, ref: en.r || null, n: n || 1, opts: opts || [],
                       name: "", adj: adj || 0 });
  });
}
const failed = () => api.checks().filter(c => !c.ok);
const summary = () => failed().map(c => c.t + " (" + c.v + ")").join("; ") || "-";

console.log("=== Adeptus Mechanicus — Explorator ===============================");
const am = listIndex("Explorator");

/* Projektin lista A: Oberon + Dictator + Gothic + Lunar + Archmagos + 3 x Cobra.
   Dictatorin plasma-boosted batteries (+10) ja Gothicin nova cannon (+20) ovat
   Explorator-listan omalla saantosivulla (Fleets s. 121), eivat alusprofiilin
   OPTIONS-lohkossa -- ne annetaan yksikon ±pts-kentassa. Summa 1225. */
build(am, 1250, [["Archmagos Explorator", 1], ["Oberon class battleship", 1],
                 ["Dictator class cruiser", 1, [], 10],
                 ["Gothic class cruiser", 1, [], 20],
                 ["Lunar class cruiser", 1], ["Cobra Class Destroyer", 3]]);
eq(api.total(), 1225, "lista A yhteispisteet");
eq(summary(), "-", "lista A on laillinen");

/* Sama ilman kolmatta risteilijaa: taistelulaiva muuttuu laittomaksi */
build(am, 1250, [["Archmagos Explorator", 1], ["Oberon class battleship", 1],
                 ["Dictator class cruiser", 1], ["Gothic class cruiser", 1],
                 ["Cobra Class Destroyer", 3]]);
eq(failed().some(c => /battleship/i.test(c.s)), true,
   "kaksi risteilijaa -> taistelulaivasuhde kaatuu");

/* 1000 pisteessa Oberon ei mahdu lainkaan: 370+215+215+235+50 = 1085 */
build(am, 1000, [["Archmagos Explorator", 1], ["Oberon class battleship", 1],
                 ["Gothic class cruiser", 1], ["Lunar class cruiser", 1],
                 ["Tyrant class cruiser", 1]]);
eq(api.total() > 1000, true, "Oberon-lista ylittaa 1000 p (" + api.total() + ")");

/* Archmagos on pakollinen 1000 pisteesta alkaen */
/* T24 (kayttaja 11.9.2026): laivaston omat pisteet, ei pisteraja: 215+215+220+370 = 1020 */
build(am, 1100, [["Gothic class cruiser", 1], ["Lunar class cruiser", 1],
                 ["Tyrant class cruiser", 1], ["Oberon class battleship", 1]]);
eq(api.total() >= 1000, true, "Archmagos-testin laivasto on vahintaan 1000 p (" + api.total() + ")");
eq(failed().some(c => /Archmagos/i.test(c.t)), true, "1000 p ilman Archmagosta kaatuu");
build(am, 900, [["Gothic class cruiser", 1], ["Lunar class cruiser", 1]]);
eq(failed().some(c => /Archmagos/i.test(c.t)), false, "900 p ei vaadi Archmagosta");

/* Escort-squadronin koko 2-6. Lista: "in squadrons of 2-6 unless specified
   (see pg 13)"; s.13: "A single escort may be taken in a fleet as long as
   there are no other escorts in the fleet" (J42: aiempi odotus ohitti sen). */
build(am, 1000, [["Cobra Class Destroyer", 1]]);
eq(failed().some(c => /squadron/i.test(c.s)), false, "ainoa saattaja yksin kelpaa");
build(am, 1000, [["Cobra Class Destroyer", 1], ["Cobra Class Destroyer", 6]]);
eq(failed().some(c => /squadron/i.test(c.s)), true, "yhden aluksen squadron kaatuu kun muut laivueet ovat taysia");
build(am, 1000, [["Cobra Class Destroyer", 7]]);
eq(failed().some(c => /squadron/i.test(c.s)), true, "seitseman aluksen squadron kaatuu");
build(am, 1000, [["Cobra Class Destroyer", 6]]);
eq(failed().some(c => /squadron/i.test(c.s)), false, "kuuden aluksen squadron kelpaa");

console.log("\n=== Orks — Waaagh! ===============================================");
const ok_ = listIndex("Waaagh");

/* Projektin lista A: Deathdeala + Bommaboss + Butcher + Gutstabba
   + 4 Brute + 3 Onslaught + 3 Ravager + Warlord + Mega-armoured */
build(ok_, 1250, [["Ork Warlord", 1], ["Mega-armoured", 1], ["Dethdeala", 1],
                  ["Terror ship", 1], ["Kill kroozer", 1],
                  ["Brute ramship", 4], ["Onslaught attack ship", 3],
                  ["Ravager attack ship", 3]]);
console.log("  ork-lista A pisteet:", api.total(), " ongelmat:", summary());
eq(failed().length, 0, "ork-lista A on laillinen");

/* Kaksi raskasta vaatii nelja kroozeria */
build(ok_, 1500, [["Ork Warlord", 1], ["Dethdeala", 1],
                  ["Hammer class battlekroozer", 1], ["Terror ship", 1],
                  ["Kill kroozer", 1], ["Brute ramship", 3]]);
eq(failed().some(c => /for every two kroozers/i.test(c.s)), true,
   "kaksi raskasta + kaksi kroozeria kaatuu");
build(ok_, 1500, [["Ork Warlord", 1], ["Dethdeala", 1],
                  ["Hammer class battlekroozer", 1], ["Terror ship", 1],
                  ["Kill kroozer", 1], ["Kill kroozer", 1], ["Terror ship", 1],
                  ["Brute ramship", 3]]);
eq(failed().some(c => /for every two kroozers/i.test(c.s)), false,
   "kaksi raskasta + nelja kroozeria kelpaa");

/* Kroozereita enintaan kuusi */
build(ok_, 3000, [["Ork Warlord", 1], ["Terror ship", 1], ["Terror ship", 1],
                  ["Kill kroozer", 1], ["Kill kroozer", 1], ["Kill kroozer", 1],
                  ["Kill kroozer", 1], ["Kill kroozer", 1]]);
eq(failed().some(c => /up to six kroozers/i.test(c.s)), true, "seitseman kroozeria kaatuu");

/* Warlord: pakollinen 500 p:sta, enintaan yksi per 500 p */
/* T24: laivaston omat pisteet 185+3*155 = 650 */
build(ok_, 700, [["Terror ship", 1], ["Kill kroozer", 1], ["Kill kroozer", 1], ["Kill kroozer", 1]]);
eq(api.total() >= 500, true, "Warlord-testin laivasto on vahintaan 500 p (" + api.total() + ")");
eq(failed().some(c => /WARLORD/i.test(c.t)), true, "500 p ilman warlordia kaatuu");
build(ok_, 1000, [["Ork Warlord", 1], ["Ork Warlord", 1], ["Ork Warlord", 1],
                  ["Terror ship", 1], ["Kill kroozer", 1]]);
eq(failed().some(c => /per 500 points/i.test(c.s)), true,
   "kolme warlordia 460 p laivastossa kaatuu");
/* T26 (14.9.2026): kiintio lasketaan laivaston omista pisteista, joten kolme
   Warlordia vaatii yli 1000 p aluksia (120+370+620 = 1110). */
build(ok_, 2000, [["Ork Warlord", 1], ["Ork Warlord", 1], ["Ork Warlord", 1],
                  ["Terror ship", 1], ["Terror ship", 1], ["Kill kroozer", 1],
                  ["Kill kroozer", 1], ["Kill kroozer", 1], ["Kill kroozer", 1]]);
eq(api.total() > 1000, true, "T26: Waaagh-laivasto on yli 1000 p (" + api.total() + ")");
eq(failed().some(c => /per 500 points/i.test(c.s)), false,
   "kolme warlordia yli 1000 p laivastossa kelpaa");

/* Escortin profiilioptio hinnoitellaan per alus, ei kerran per squadron.
   Grunt: 2 x 30 + 2 x Klaws 5 = 70. */
const clans = listIndex("Da Ork Clanz");
build(clans, 1000, [["Grunt assault ship", 2, [0]]]);
eq(api.total(), 70, "escort-option hinta kerrotaan squadronin koolla");

console.log("\n=== Imperial Navy — Gothic Sector ================================");
const gs = listIndex("Gothic Sector");
/* 0-12 Cruisers -otsikkoraja */
build(gs, 4000, [["Lunar class cruiser", 1]]);
const many = [];
for (let i = 0; i < 13; i++) many.push(["Lunar class cruiser", 1]);
build(gs, 6000, many);
eq(failed().some(c => /Cruisers/i.test(c.t)), true, "13 risteilijaa ylittaa 0-12 rajan");

/* Battlecruiser-suhde: 1 per 2 risteilijaa */
build(gs, 4000, [["Mars class battlecruiser", 1], ["Lunar class cruiser", 1]]);
eq(failed().some(c => /battlecruiser/i.test(c.s)), true,
   "battlecruiser + 1 risteilija kaatuu");
build(gs, 4000, [["Mars class battlecruiser", 1], ["Lunar class cruiser", 1],
                 ["Gothic class cruiser", 1]]);
eq(failed().some(c => /battlecruiser/i.test(c.s)), false,
   "battlecruiser + 2 risteilijaa kelpaa");

console.log("\n=== Datan eheys =================================================");
let noPts = 0, noStats = 0, refMiss = 0, ents = 0;
LISTS.forEach(L => L.secs.forEach(s => s.ents.forEach(e => {
  ents++;
  if (e.p == null) noPts++;
  if (e.r && !SHIPS[String(e.r)]) refMiss++;
})));
/* Aseistuksen puuttuminen on vika yhdella nimetylla poikkeuksella: Fire Ship,
   Fleets s.516. Kirja painaa sille tyyppirivin (Escort/1, 15 cm, 45 astetta,
   1, 5+, 1) ja SPECIAL-lohkon mutta EI ARMAMENT-taulukkoa - "The controlling
   player can detonate a fire ship at any point in its movement phase": alus
   itse on ase. Poikkeus on sidottu sivuun ja saantokorttiin (rc); statsit
   vaaditaan siltakin. */
const noArmamentByBook = s => s.pg === 516 && !!s.rc && /^FIRE SHIP$/.test(String(s.nm || ""));
Object.values(SHIPS).forEach(s => { if (!s.sp || !s.ar || (!s.aw.length && !noArmamentByBook(s))) noStats++; });
console.log("  listarivit:", ents, " ilman hintaa:", noPts, " rikkinainen sivuviite:", refMiss);
console.log("  alukset:", Object.keys(SHIPS).length, " puutteelliset statsit:", noStats);
eq(refMiss, 0, "yhtaan rikkinainen sivuviitetta ei jaa");
eq(noStats, 0, "kaikilla aluksilla on statsit ja aseistus");

/* Sivuviitteiden ristiintarkistus: kirjassa on vaaria viitteita, ja ne on
   joko korjattu nimen perusteella tai merkitty nakyviin. Merkkina on lippu
   e.rf eika huomautusteksti: kirjan vioista ei kerrota pelaajalle, joten
   tekstiin ei voi luottaa mittarina. */
let fixed = 0, flagged = 0;
LISTS.forEach(L => L.secs.forEach(s => s.ents.forEach(e => {
  if (e.rf || e.badref) (e.badref ? flagged++ : fixed++);
})));
console.log("  sivuviite korjattu:", fixed, " merkitty epailyttavaksi:", flagged);
eq(fixed >= 30, true, "vaarat sivuviitteet korjattu nimen perusteella (" + fixed + " rivia)");
eq(flagged, 0, "kirjan tunnetut sivuviitevirheet on korjattu eksplisiittisesti");

/* Nama rivit ovat kirjan sivulla 145 eli Grey Knights -listassa. Ne
   olivat aiemmin Inkvisition alla, koska Grey Knights oli sulautettu
   siihen; listat erotettiin 7.9.2026 kirjan oman otsikon perusteella. */
const gk = listIndex("Grey Knights");
eq(findEntry(gk, "Rapid strike vessel (Sword)").en.r, 82,
   "Grey Knights Sword korjattu sivulle 82");
eq(findEntry(gk, "Rapid strike vessel (Cobra)").en.r, 84,
   "Grey Knights Cobra korjattu sivulle 84");
const iyanden = listIndex("Iyanden Craftworld");
const aspect = findEntry(iyanden, "Aspect Warrior Host").en;
eq(!aspect.r && aspect.u === 1, true,
   "Aspect Warrior Host kasitellaan upgrade-rivina, ei alusprofiilina");
eq((SHIPS["184"].sr + SHIPS["192"].op).includes("[???]"), false,
   "Rogue Trader Xenotech -ristiviitteet korjattu sivulle 175");
eq(SHIPS["352"].aw.length, 5,
   "Torture-profiilissa ovat perusase ja kaikki nelja valinnaista asetta");
eq(SHIPS["481"].aw.some(a => /ion cannon/i.test(a[0])), true,
   "Waystationin viimeinen Ion Cannon -rivi ei katoa");
eq(SHIPS["330"].ol.length, 5,
   "Dragonshipin prow/keel-valinnat ovat rastitettavia optioita");
eq(Object.keys(SHIPS).filter(k => /^458|^460|^462|^470|^472/.test(k)).length, 11,
   "kaikki Tau-konfiguraatiot ovat erillisia profiileja");

const hive = listIndex("Tyranids — Hive Fleet");
const he = findEntry(hive, "Hive Ship");
api.S.li = hive;
const hu = {s:he.s,e:he.e,ref:he.en.r,n:1,opts:[],os:{},name:""};
api.S.units = [hu];
eq(SHIPS[String(hu.ref)].ol.length, 16,
   "Hive Shipin puolipistevalinnat on jaettu 16 oikeahintaiseksi valinnaksi");
api.setOptState(hu, 0, "take");
api.setOptState(hu, 1, "take");
eq(api.optState(hu, 0) === "opt" && api.optState(hu, 1) === "take", true,
   "Choose one -ryhma sallii vain yhden valinnan");
eq(api.unitPts(hu), he.en.p + 15,
   "Hive Shipin valitun Feeder/claws-option hinta lasketaan oikein");

/* Chaos-listojen tunnettu virhe: 'Chaos battle barge (pg. 266)' osoitti
   Despoileriin ja 'Styx (pg. 268)' Retaliatoriin. */
const chaos = listIndex("Chaos - Incursion".replace(" - ", " — "));
const bb = findEntry(chaos, "Chaos battle barge");
eq(SHIPS[String(bb.en.r)].nm, "CHAOS BATTLE BARGE", "Chaos battle barge osoittaa oikeaan alukseen");
const styx = findEntry(chaos, "Styx class heavy cruiser");
eq(SHIPS[String(styx.en.r)].nm, "STYX CLASS HEAVY CRUISER", "Styx osoittaa oikeaan alukseen");

/* ================================ QA-ajossa loytyneet katoamiset ======= */
/* Tassa tiedostossa on vain eq(); totuusarvotarkistuksille oma apuri. */
const ok = (cond, what) => eq(!!cond, true, what);

/* Sanamuotoinen hinta pudotti listarivin: kirja kirjoittaa
   "(0-1) Venerable battle barge (pg. 102)............varies" ilman
   "pts"-paatetta, ja poimijan hintakuvio vaati sen.

   Taman testin edellinen versio vaitti, etta rivi OSOITTAA Seditio
   Opprimereen - se lukitsi toteutuksen oletuksen, ei kirjan saantoa
   (AGENTS.md §5). Fleets s.102: venerable battle barge on POHJARUNGON
   VALINTA "from any available Imperial or Chaos battleship, grand cruiser,
   battlecruiser or heavy cruiser at the listed cost, plus an additional
   +35 points". Seditio on kirjan oma esimerkki ja oletusrunko, ei ainoa. */
["Codex Astartes", "Crusade", "Dominion"].forEach(nm => {
  const li = listIndex("Space Marines — " + nm);
  const v = findEntry(li, "Venerable battle barge");
  eq(v.en.hc, 1, nm + ": venerable battle barge on runkovalinta (hc)");
  eq(v.en.hcp, 35, nm + ": Space Marine -miehisto +35 (s.102)");
  eq(v.en.p, null, nm + ": listahinta on avoin kuten kirjassa (varies)");
  eq(String(v.en.r), "103", nm + ": oletusrunko on Seditio Opprimere (s.103)");
  const hulls = (v.en.hulls || []).map(String);
  eq(hulls.includes("103"), true, nm + ": Seditio on vaihtoehto");
  eq(hulls.includes("61"), true, nm + ": Imperial battlecruiser (Mars) kelpaa");
  eq(hulls.includes("267"), true, nm + ": Chaos battleship (Desolator) kelpaa");
  eq(hulls.includes("104"), false, nm + ": Space Marine Battle Barge ei ole Imperial/Chaos-runko");
  eq(hulls.includes("258"), false, nm + ": nimetty ainutlaatuinen alus ei ole runko");
  eq(hulls.includes("68"), false, nm + ": tavallinen risteilija (Dominator) ei kelpaa");
});

/* Hinta oli jaanyt aluksen nimeen: PDF painaa sen samalle riville
   sarkaimella erotettuna, ja kortin otsikossa luki "... 450 Pts". */
["103", "258", "260", "476"].forEach(pg => {
  const sh = SHIPS[pg];
  ok(sh, "profiili " + pg + " on olemassa");
  ok(sh && !/\t/.test(sh.nm), "profiilin " + pg + " nimessa ei ole sarkainta");
  ok(sh && !/\bPTS\b/i.test(sh.nm), "profiilin " + pg + " nimessa ei ole hintaa");
});
eq(SHIPS["103"].bp, 450, "Seditio Opprimeren perushinta luettiin otsikkorivilta");

/* Kolme Xenos-varianttia ei ollut mistaan saatavissa. */
const rt = listIndex("Rogue Traders");
[["Pthuxutl", "PTHUXUTL WAR CRUISER"],
 ["Nekulli", "NEKULLI WHIP"],
 ["Fra", "FRA\u2019AL RAIDER"]].forEach(([frag, want]) => {
  const e = findEntry(rt, "Xenos Vessel - " + frag);
  eq(SHIPS[String(e.en.r)].nm, want, frag + ": variantti on valittavissa");
  eq(e.en.p, 50, frag + ": maksaa saman 50 pistetta kuin geneerinen");
});

/* Chaos-listat osoittivat Vengeance-risteilijassa Imperial Navyn
   painokseen, jolloin kortilla luki vaara faktio ja vaara sivu. */
["Black Crusade", "Tzeentch", "Nurgle", "Khorne", "Slaanesh"].forEach(nm => {
  const li = listIndex("Chaos — " + nm);
  const v = findEntry(li, "Vengeance class grand cruiser");
  eq(SHIPS[String(v.en.r)].fl, "CHAOS", nm + ": Vengeance on Chaos-painos");
});
eq(SHIPS[String(findEntry(listIndex("Imperial Navy — Bastion"),
   "Vengeance class grand cruiser").en.r)].fl, "IMPERIAL NAVY",
   "Imperial Navyn lista pitaa oman painoksensa");

/* Jokainen listan alusrivi osoittaa olemassa olevaan profiiliin: rivi
   jonka viite ei aukene nayttaisi sovelluksessa ostettavalta mutta ei
   tuottaisi korttia lainkaan. */
let danglingRefs = 0;
LISTS.forEach(L => L.secs.forEach(sec => sec.ents.forEach(e => {
  if (e.r != null && !SHIPS[String(e.r)]) danglingRefs++;
})));
eq(danglingRefs, 0, "yksikaan listarivi ei osoita puuttuvaan profiiliin");

/* Laivastotason pistokoe 10.9.2026 (raportti 17). Black Crusade s.234:
   "You may include Abaddon the Despoiler as the Warmaster in any Chaos
   Fleet worth more than 1,000 points." Abaddon on Warmaster: han tayttaa
   pakollisen Warmasterin, mutta ei 1 000 pisteessa eika Warmasterin rinnalla. */
console.log("\n=== Chaos: Abaddon ja nimetyt taistelulaivat ======================");
const bcr = listIndex("Chaos — Black Crusade");
/* T24: "worth more than 1,000 points" = laivaston omat pisteet
   (195+170+180+165+170+180 = 1060). */
build(bcr, 1100, [["Abaddon (Ld 10)", 1], ["Murder class cruiser", 1], ["Carnage class cruiser", 1],
                  ["Slaughter class cruiser", 1], ["Murder class cruiser", 1], ["Carnage class cruiser", 1]]);
eq(api.total() > 1000, true, "Abaddon-laivasto on yli 1000 p (" + api.total() + ")");
eq(summary(), "-", "Abaddon Warmasterina yli 1 000 p laivastossa on laillinen");
build(bcr, 1000, [["Abaddon (Ld 10)", 1], ["Murder class cruiser", 1],
                  ["Carnage class cruiser", 1], ["Slaughter class cruiser", 1]]);
eq(failed().some(c => /Abaddon/i.test(c.t)), true, "Abaddon 1 000 pisteessa kaatuu ('more than 1,000')");
build(bcr, 1500, [["Abaddon (Ld 10)", 1], ["Chaos Warmaster (Ld +2)", 1],
                  ["Murder class cruiser", 1], ["Carnage class cruiser", 1]]);
eq(failed().some(c => /Abaddon/i.test(c.t + " " + c.s)), true, "Abaddon ja Warmaster yhdessa kaatuu");
/* "A fleet 1,000 points or more may include the X as one of its
   battleships, subject to normal restrictions." (s.237, 241, 245, 249) */
[["Nurgle", "Terminus Est"], ["Slaanesh", "Wage of Sin"], ["Tzeentch", "Scion of Prospero"],
 ["Khorne", "Slaverer"]].forEach(([nm, ship]) => {
  const li = listIndex("Chaos — " + nm);
  /* T24: laivaston omat pisteet ratkaisevat - ilman Slaughteria alle 1000 p,
     sen kanssa vahintaan 1000 p. */
  const small = [["Chaos Warmaster (Ld +2)", 1], [ship, 1], ["Murder class cruiser", 1], ["Carnage class cruiser", 1]];
  const fleet = small.concat([["Slaughter class cruiser", 1]]);
  build(li, 999, small);
  eq(api.total() < 1000, true, nm + ": pieni laivasto on alle 1000 p (" + api.total() + ")");
  eq(failed().some(c => new RegExp(ship, "i").test(c.t) && /not allowed/.test(c.v)), true,
     nm + ": " + ship + " alle 1 000 p laivastossa kaatuu");
  build(li, 1200, fleet);
  eq(api.total() >= 1000, true, nm + ": laivasto on vahintaan 1000 p (" + api.total() + ")");
  eq(failed().some(c => new RegExp(ship, "i").test(c.t)), false, nm + ": " + ship + " 1 100 pisteessa kelpaa");
});

console.log("\n=== Tau Defender -laivueet ja Rogue Trader -saattajat ============");
/* s.455: "Defenders are fielded in squadrons of 2–6 ships. They may be
   combined in squadrons with Messengers if you wish. They may not be combined
   with Orcas. Messengers operate as single ships, or in squadrons." */
["Tau — Merchant Fleet", "Tau — Commerce Protection"].forEach(nm => {
  const li = listIndex(nm);
  const sq = re => failed().some(c => re.test(c.t) && / ships$/.test(c.v));
  build(li, 1500, [["Defender class starship", 1]]);
  eq(sq(/defender/i), true, nm + ": yksi Defender kaatuu");
  build(li, 1500, [["Defender class starship", 7]]);
  eq(sq(/defender/i), true, nm + ": seitseman Defenderia kaatuu");
  build(li, 1500, [["Defender class starship", 4]]);
  eq(sq(/defender/i), false, nm + ": nelja Defenderia kelpaa");
  build(li, 1500, [["Messenger class starship", 1]]);
  eq(sq(/messenger/i), false, nm + ": Messenger yksin kelpaa");
});
/* s.174: "A single squadron of 2-6 Rogue Trader escorts and auxiliary vessels
   may accompany each Rogue Trader capital ship in a fleet, in any mix desired.
   Separately, it may also be accompanied by any number of cargo ships of any
   type (...), organized in squadrons of 2-6 ships, but these squadrons can
   only contain cargo ships (...)." Sekalaivuetta ei voi merkita yksikkomallissa,
   joten tarkistettava raja on enintaan kuusi saattajaa RT-alusta kohden. */
const rtl = LISTS.findIndex(l => l.nm === "Rogue Traders");
const rtCap = () => failed().some(c => /escorts/i.test(c.t) && !/ ships$/.test(c.v));
build(rtl, 1000, [["Rogue Trader Cruiser", 1], ["Iconoclast", 3], ["Recommissioned", 3]]);
eq(rtCap(), false, "RT: yksi alus + kuusi saattajaa sekalaivueena kelpaa");
build(rtl, 1000, [["Rogue Trader Cruiser", 1], ["Iconoclast", 4], ["Recommissioned", 3]]);
eq(rtCap(), true, "RT: yksi alus + seitseman saattajaa kaatuu");
build(rtl, 1000, [["Rogue Trader Cruiser", 1], ["Iconoclast", 6], ["Armed Cargo Vessel", 4]]);
eq(rtCap(), false, "RT: rahtialukset eivat kuulu saattajalaivueeseen");
/* s.174: "If a fleet has more than one Rogue Trader cruiser or also includes
   more than one squadron of transports, a Veteran Rogue Trader must be
   assigned to a Rogue Trader cruiser." (pistokoe 18, J23). Kaatumisen on
   tultava taman lauseen tarkistuksesta, ei muusta rivista. */
const vetReq = () => failed().some(c => /Veteran Rogue Trader required/i.test(c.t));
build(rtl, 1000, [["Rogue Trader Cruiser", 1], ["Rogue Trader Cruiser", 1]]);
eq(vetReq(), true, "RT: kaksi RT-risteilijaa ilman Veterania kaatuu");
build(rtl, 1000, [["Rogue Trader Cruiser", 1], ["Heavy Transport", 2], ["Heavy Transport", 2]]);
eq(vetReq(), true, "RT: kaksi kuljetuslaivuetta ilman Veterania kaatuu");
build(rtl, 1000, [["Veteran Rogue Trader", 1], ["Rogue Trader Cruiser", 1], ["Rogue Trader Cruiser", 1]]);
eq(vetReq(), false, "RT: Veteranin kanssa kaksi RT-risteilijaa kelpaa");
build(rtl, 1000, [["Rogue Trader Cruiser", 1], ["Heavy Transport", 2]]);
eq(vetReq(), false, "RT: yksi risteilija ja yksi kuljetuslaivue ei vaadi Veterania");

console.log("\n=== Eldar Hero ja Prince Yriel komentajina ==========================");
/* s.316/317/318: "Your fleet may be led by an Eldar Hero, in place of its
   normal fleet commander." s.319: "Yriel may be taken instead of the Hero
   Fleet Commander as listed in the Corsair and Craftworld Eldar fleet lists." */
/* Kaatumisen on tultava komentajarajasta, ei muusta virheesta: ennen
   korjausta "kaksi Heroa" kaatui vain vaaraan "Pirate Prince missing". */
const cmdCap = () => failed().some(c => /Fleet commander/i.test(c.t));
["Eldar Corsairs — Gothic Sector", "Eldar Corsairs — Later Gothic War"].forEach(nm => {
  const li = listIndex(nm);
  build(li, 1100, [["Eldar Hero (Ld 10)", 1], ["Eclipse", 2], ["Shadow", 2]]);
  eq(summary(), "-", nm + ": Eldar Hero johtaa Pirate Princen sijaan");
  build(li, 1200, [["Eldar Hero (Ld 10)", 1], ["Pirate Prince (+2 Ld)", 1], ["Eclipse", 2], ["Shadow", 2]]);
  eq(cmdCap(), true, nm + ": Hero ja Pirate Prince yhdessa kaatuu");
  build(li, 1200, [["Eldar Hero (Ld 10)", 2], ["Eclipse", 2], ["Shadow", 2]]);
  eq(cmdCap(), true, nm + ": kaksi Heroa kaatuu");
});
const iyl = listIndex("Iyanden");
build(iyl, 1000, [["Eldar Hero (Ld 10)", 1], ["Wraithship", 3]]);
eq(summary(), "-", "Iyanden: Eldar Hero johtaa Autarchin sijaan");
/* J215: Yriel tarvitsee aluksen - "he must be placed on a Craftworld Eldar
   Dragonship with launch bays, but you may instead pick the Flame of
   Asuryan" (s.319). Pelkkien Wraithshipien kanssa hanella ei ole laillista
   paikkaa, joten testilaivastossa on Flame. */
build(iyl, 1500, [["Prince Yriel", 1], ["Flame of Asuryan", 1], ["Wraithship", 3]]);
eq(summary(), "-", "Iyanden: Prince Yriel johtaa");
build(iyl, 1000, [["Eldar Autarch (Ld 9)", 1], ["Eldar Hero (Ld 10)", 1], ["Wraithship", 3]]);
eq(cmdCap(), true, "Iyanden: Autarch ja Hero yhdessa kaatuu");
build(iyl, 1000, [["Eldar Hero (Ld 10)", 1], ["Prince Yriel", 1], ["Wraithship", 3]]);
eq(cmdCap(), true, "Iyanden: Hero ja Yriel yhdessa kaatuu");
build(iyl, 1000, [["Prince Yriel", 2], ["Wraithship", 3]]);
eq(cmdCap(), true, "Iyanden: kaksi Yrielia kaatuu");

console.log("\n=== Pistokoe 18: Chaos-osuudet, Planet Killer, Space Hulk, Bakka-reservit ===");
/* Kuten build, mutta viides kentta on listapaivitykset nimilla. */
function buildU(li, limit, picks) {
  api.S.li = li; api.S.limit = limit; api.S.units = [];
  picks.forEach(([frag, n, opts, adj, ups]) => {
    const { s, e, en } = findEntry(li, frag);
    const u = { s, e, ref: en.r || null, n: n || 1, opts: opts || [], name: "", adj: adj || 0, ups: {} };
    (ups || []).forEach(f => { const x = findEntry(li, f); u.ups[x.s + ":" + x.e] = "take"; });
    api.S.units.push(u);
  });
}
/* J24 s.241: "Up to a third of the capital ships (not the Terminus Est or
   flagship) in a Plaguefleet may be upgraded to Daemonships"; s.245 "Up to a
   quarter of the capital ships (not battleships or the flagship) in a
   Berzerker Fleet"; s.249 "Up to half of the capital ships (not the Wage of
   Sin or the flagship) in a Pleasurefleet". */
const daemonCap = () => failed().some(c => /^Daemonships \(/.test(c.t));
const CR = ["Murder class cruiser", "Carnage class cruiser", "Slaughter class cruiser", "Inferno class cruiser"];
[["Chaos — Nurgle", 3, 1], ["Chaos — Khorne", 4, 1], ["Chaos — Slaanesh", 4, 2]].forEach(([nm, caps, allow]) => {
  const li = listIndex(nm);
  const fleet = k => [["Warmaster", 1]].concat(CR.slice(0, caps).map((c, i) =>
    i < k ? [c, 1, [], 0, ["Daemonship: Cruiser"]] : [c, 1]));
  buildU(li, 1500, fleet(allow + 1));
  eq(daemonCap(), true, nm + ": " + (allow + 1) + " Daemonshipia " + caps + " isosta aluksesta kaatuu");
  buildU(li, 1500, fleet(allow));
  eq(daemonCap(), false, nm + ": " + allow + " Daemonshipia " + caps + " isosta aluksesta kelpaa");
});
/* J25 s.235: "The Planet Killer also counts as a battleship when working out
   how many heavy cruisers and cruisers the fleet requires." */
const bcl = listIndex("Black Crusade");
const bsFail = () => failed().some(c => c.t === "Battleships");
const C6 = ["Murder class cruiser", "Carnage class cruiser", "Slaughter class cruiser",
            "Inferno class cruiser", "Devastation class cruiser", "Murder class cruiser"];
const ships = list => list.map(c => [c, 1]);
build(bcl, 2500, [["Warmaster", 1], ["Planet Killer", 1], ["Despoiler class battleship", 1]].concat(ships(C6.slice(0, 3))));
eq(bsFail(), true, "Black Crusade: Planet Killer + Despoiler kolmella risteilijalla kaatuu");
build(bcl, 3000, [["Warmaster", 1], ["Planet Killer", 1], ["Despoiler class battleship", 1]].concat(ships(C6)));
eq(bsFail(), false, "Black Crusade: Planet Killer + Despoiler kuudella risteilijalla kelpaa");
/* J26 s.288: "It may not be taken in a fleet that has the Planet Killer, an
   Activated Blackstone Fortress or ships that must be used as flagships such
   as the Terminus Est." "A Chaos fleet including a Space Hulk may have no
   more than two other battleships. (...) It counts as a battleship for
   purposes of taking another so in order to take a second battleship, the
   fleet must already have six cruisers and/or heavy cruisers." */
const hulkWith = () => failed().some(c => /not with the Planet Killer/.test(c.t));
const hulkBs = () => failed().some(c => /Battleships with a Chaos Space Hulk/.test(c.t));
build(bcl, 2500, [["Warmaster", 1], ["Chaos Space Hulk", 1], ["Planet Killer", 1]].concat(ships(C6.slice(0, 3))));
eq(hulkWith(), true, "Black Crusade: Space Hulk ja Planet Killer yhdessa kaatuu");
build(bcl, 1000, [["Warmaster", 1], ["Chaos Space Hulk", 1]]);
eq(bsFail() || hulkWith() || hulkBs(), false, "Black Crusade: Space Hulk yksin kelpaa");
build(bcl, 2500, [["Warmaster", 1], ["Chaos Space Hulk", 1], ["Despoiler class battleship", 1]].concat(ships(C6.slice(0, 3))));
eq(bsFail(), true, "Black Crusade: Space Hulk + Despoiler kolmella risteilijalla kaatuu");
build(bcl, 3000, [["Warmaster", 1], ["Chaos Space Hulk", 1], ["Despoiler class battleship", 1]].concat(ships(C6)));
eq(bsFail(), false, "Black Crusade: Space Hulk + Despoiler kuudella risteilijalla kelpaa");
build(bcl, 5000, [["Warmaster", 1], ["Chaos Space Hulk", 1], ["Despoiler class battleship", 1],
                  ["Desolator class battleship", 1], ["Chaos battle barge", 1]].concat(ships(C6.concat(C6))));
eq(hulkBs(), true, "Black Crusade: Space Hulk + kolme muuta taistelulaivaa kaatuu");
const nul = listIndex("Nurgle");
build(nul, 2500, [["Warmaster", 1], ["Chaos Space Hulk", 1], ["Terminus Est", 1]].concat(ships(C6)));
eq(hulkWith(), true, "Nurgle: Space Hulk ja Terminus Est yhdessa kaatuu");
/* J27 s.49: "An Emperor class battleship can only be taken as reserves unless
   Admiral Rath leads the fleet." s.50: "Ships from any Imperial fleet list may
   be used as reserves, with one reserve cruiser, battlecruiser or grand
   cruiser for every three Bakka cruisers in the fleet, one reserve battleship
   for every three Bakka battleships in the fleet, etc." s.14: "Reserves are
   still subject to the restrictions on minimum and maximum numbers of certain
   types of vessels." */
const bkl = listIndex("Bakka");
const empRes = () => failed().some(c => /Emperor class battleship as reserve/.test(c.t));
/* Bakan oma reservisaanto (s.50) poistettiin 1.1:ssa paallekkaisena: sama
   1:3-suhde tulee nyt kirjan yleissaannosta (s.14), ja rivin otsikko on
   "Reserves (cruisers)". Kaytos on sama, nimi eri. */
const resCap = () => failed().some(c => /^Reserves \(cruisers\)$/.test(c.t));
const BKC = ["Lunar class cruiser", "Gothic class cruiser", "Dominator class cruiser"];
build(bkl, 1500, [["Admiral (Ld 9)", 1], ["Emperor class battleship", 1]].concat(ships(BKC)));
eq(empRes(), true, "Bakka: Emperor ilman Rathia ja kolmea Bakka-taistelulaivaa kaatuu");
build(bkl, 2000, [["Lord Admiral Rath", 1], ["Emperor class battleship", 1]].concat(ships(BKC)));
eq(empRes(), false, "Bakka: Rathin johtamana Emperor kelpaa");
build(bkl, 5000, [["Admiral (Ld 9)", 1], ["Emperor class battleship", 1], ["Retribution class battleship", 1],
                  ["Victory class battleship", 1], ["Vanquisher class battleship", 1]]
                 .concat(ships(BKC.concat(BKC, BKC, BKC))));
eq(empRes(), false, "Bakka: kolmen Bakka-taistelulaivan reservina Emperor kelpaa");
build(bkl, 1000, [["Admiral (Ld 9)", 1], ["Jovian class battlecruiser", 1], ["Lunar class cruiser", 1]]);
eq(resCap(), true, "Bakka: Jovian yhdella Bakka-risteilijalla kaatuu");
build(bkl, 1500, [["Admiral (Ld 9)", 1], ["Jovian class battlecruiser", 1]].concat(ships(BKC)));
eq(resCap(), false, "Bakka: Jovian kolmella Bakka-risteilijalla kelpaa");
build(bkl, 2000, [["Admiral (Ld 9)", 1], ["Jovian class battlecruiser", 1], ["Dominion class battlecruiser", 1]].concat(ships(BKC)));
eq(failed().some(c => c.t === "Battlecruisers"), true, "Bakka: Jovian lasketaan battlecruiser-suhteeseen");
/* J28 s.151: "Up to half of the Grey Knights strike cruisers in a fleet may
   replace their launch bays with one of the refits listed below, in any mix
   desired." Kolmas kentta = aluksen omat optiot (os). */
function buildO(li, limit, picks) {
  api.S.li = li; api.S.limit = limit; api.S.units = [];
  picks.forEach(([frag, n, opts]) => {
    const { s, e, en } = findEntry(li, frag);
    const u = { s, e, ref: en.r || null, n: n || 1, opts: [], os: {}, name: "", adj: 0 };
    (opts || []).forEach(i => { u.os[i] = "take"; });
    api.S.units.push(u);
  });
}
const gkHalf = () => failed().some(c => /launch bays replaced/.test(c.t));
[["Grey Knights", "Inquisitor Lord"], ["Emperor's Inquisition", "Inquisitor Lord"]].forEach(([nm, cmd]) => {
  const li = listIndex(nm);
  buildO(li, 1500, [[cmd, 1], ["Grey Knights Strike Cruiser", 1, [0]], ["Grey Knights Strike Cruiser", 1, [1]]]);
  eq(gkHalf(), true, nm + ": kaksi bay-vaihtoa kahdesta GK strike cruiserista kaatuu");
  buildO(li, 1500, [[cmd, 1], ["Grey Knights Strike Cruiser", 1, [0]], ["Grey Knights Strike Cruiser", 1]]);
  eq(gkHalf(), false, nm + ": yksi bay-vaihto kahdesta kelpaa");
});
/* J30 s.178: "A human pirate fleet may have up to one cruiser for every 500
   points of ships in the fleet or portion thereof. (...) It may also include
   a single Space Marine strike cruiser!" s.179: "At least one squadron of 3-6
   escort vessels must be included for each cruiser in the fleet" ja "The
   number of escort vessels that utilize ordnance or lance weaponry may not
   outnumber those that rely solely on weapon batteries." Rivin puuttuminen
   kirjataan epaonnistumiseksi eika kaada ajoa. */
const pil = LISTS.findIndex(l => l.nm === "Rogue Traders — Pirates and Wolf Packs");
function pir(limit, picks, re, want, what) {
  try { build(pil, limit, picks); }
  catch (e) { eq("rivi puuttuu: " + e.message.slice(0, 50), want, what); return; }
  eq(failed().some(c => re.test(c.t + " | " + c.v)), want, what);
}
const CAPT = ["Pirate Captain", 1];
pir(1000, [CAPT, ["Lunar class cruiser", 1], ["Murder class cruiser", 1], ["Tyrant class cruiser", 1],
           ["Sword Frigate", 3], ["Sword Frigate", 3], ["Sword Frigate", 3]],
    /^Pirate cruisers/, true, "Merirosvot: kolme risteilijaa 1 000 pisteessa kaatuu");
pir(1000, [CAPT, ["Lunar class cruiser", 1], ["Murder class cruiser", 1], ["Sword Frigate", 3], ["Iconoclast Destroyer", 3]],
    /^(Pirate cruisers|Escort squadrons per cruiser)/, false, "Merirosvot: kaksi risteilijaa ja kaksi saattajalaivuetta kelpaa");
pir(1000, [CAPT, ["Lunar class cruiser", 1], ["Murder class cruiser", 1], ["Sword Frigate", 3]],
    /^Escort squadrons per cruiser/, true, "Merirosvot: kaksi risteilijaa ja yksi saattajalaivue kaatuu");
pir(1000, [CAPT, ["Lunar class cruiser", 1], ["Cobra Destroyer", 4], ["Sword Frigate", 3]],
    /^Escorts with ordnance or lances/, true, "Merirosvot: nelja torpedosaattajaa kolmea patterisaattajaa vastaan kaatuu");
pir(1000, [CAPT, ["Lunar class cruiser", 1], ["Cobra Destroyer", 3], ["Sword Frigate", 3]],
    /^Escorts with ordnance or lances/, false, "Merirosvot: kolme ja kolme kelpaa");
pir(1500, [CAPT, ["Space Marine Strike Cruiser", 1], ["Space Marine Strike Cruiser", 1],
           ["Sword Frigate", 3], ["Iconoclast Destroyer", 3]],
    /strike cruiser.*2 \/ 1/i, true, "Merirosvot: kaksi Space Marine strike cruiseria kaatuu");
/* J32 s.373: "However, no more than one of each of the named Ork battleships
   may be in the fleet, no more than one 'Uge ship may be taken in the fleet
   for every two kroozers, and a Space Hulk may only be taken by a fleet of no
   less than 1500 points." */
const cll = listIndex("Da Ork Clanz");
const ugeCap = () => failed().some(c => /^'Uge ships/.test(c.t));
const clHulk = () => failed().some(c => /^Space Hulk \(1,500/.test(c.t));
const TID = [["Ravager attack ship", 3], ["Grunt assault ship", 3]];
build(cll, 1000, [["Ork Warlord", 1], ["Hammer class battlekroozer", 1], ["Kill kroozer", 1]].concat(TID));
eq(ugeCap(), true, "Clanz: 'Uge ship yhdella kroozerilla kaatuu");
build(cll, 1000, [["Ork Warlord", 1], ["Hammer class battlekroozer", 1], ["Kill kroozer", 1], ["Terror ship", 1]].concat(TID));
eq(ugeCap(), false, "Clanz: 'Uge ship kahdella kroozerilla kelpaa");
build(cll, 1200, [["Ork Warlord", 1], ["Ork Warlord", 1], ["Ork Warlord", 1], ["Ork hulk", 1]]);
eq(clHulk(), true, "Clanz: Space Hulk 1 200 pisteen laivastossa kaatuu");
/* T24: laivaston omat pisteet 600+185+5*155 = 1560 */
build(cll, 2000, [["Ork Warlord", 1], ["Ork Warlord", 1], ["Ork Warlord", 1], ["Ork hulk", 1], ["Terror ship", 1],
                  ["Kill kroozer", 1], ["Kill kroozer", 1], ["Kill kroozer", 1], ["Kill kroozer", 1], ["Kill kroozer", 1]]);
eq(api.total() >= 1500, true, "Clanz: hulk-laivasto on vahintaan 1500 p (" + api.total() + ")");
eq(clHulk(), false, "Clanz: Space Hulk 1 500 pisteen laivastossa kelpaa");
/* T31 s.371 MORE GUBBINS: "The following gubbins can be taken by any number of
   capital ships in the fleet." Ne eivat siis kuluta Warlordin re-roll-budjettia
   (s.370), toisin kuin GUBBINS-listan rivit. */
const gubBudget = () => failed().some(c => /^Gubbins \(one per Warlord/.test(c.t));
buildU(cll, 1500, [["Ork Warlord", 1], ["Kill kroozer", 1, [], 0, ["Klaws", "Maniac Gunners"]]]);
eq(gubBudget(), false, "Clanz: MORE GUBBINS ei kuluta Warlordin budjettia");
buildU(cll, 1500, [["Ork Warlord", 1], ["Kill kroozer", 1, [], 0, ["Maniac Gunners", "Extra Turrets"]]]);
eq(gubBudget(), true, "Clanz: kaksi GUBBINS-riviä yhdellä re-rollilla kaatuu");
/* T26 (paatos 14.9.2026): pisteisiin sidotut kiintiot lasketaan laivaston
   omista pisteista, ei pelin pisterajasta. s.372: "one Warlord for every 500
   points, or part, that the fleet is worth - no more, no less." */
build(cll, 1500, [["Ork Warlord", 1], ["Terror ship", 1], ["Kill kroozer", 1]]);
eq(api.total() < 500, true, "T26: Clanz-laivasto on alle 500 p (" + api.total() + ")");
eq(failed().some(c => /^WARLORD/.test(c.t)), false, "T26: yksi Warlord alle 500 p laivastossa kelpaa");
build(cll, 1500, [["Ork Warlord", 1], ["Ork Warlord", 1], ["Terror ship", 1], ["Kill kroozer", 1]]);
eq(failed().some(c => /^WARLORD/.test(c.t)), true, "T26: kaksi Warlordia alle 500 p laivastossa kaatuu");
/* Sama koskee tiers-lajia: s.457 "up to one Warsphere if the fleet is worth
   1500 points, or up to two Warspheres in games larger than that". */
const cp26 = listIndex("Commerce Protection");
build(cp26, 2000, [["Kroot Warsphere", 1], ["Protector class", 1]]);
eq(api.total() < 1500, true, "T26: Tau-laivasto on alle 1500 p (" + api.total() + ")");
eq(failed().some(c => /^Kroot Warspheres/.test(c.t)), true, "T26: Warsphere alle 1500 p laivastossa kaatuu");
/* Vastapari: points_share lukee "the fleet's points allowance" (s.431), eli
   pelin pisterajan - se ei muutu. */
const hf26 = listIndex("Tyranids — Hive Fleet");
buildU(hf26, 1500, [["Hive ship (Ld 8)", 1, [], 0,
                     ["Strength 4 boarding torpedo marker", "Assault boat marker", "Fighter marker"]]]);
eq(failed().some(c => /^Ordnance markers/.test(c.t)), false, "T26: Tyranidien ordnance lasketaan yhä pisterajasta");
/* Gravitic hook -kapasiteetti (J95). s.454: "You may not have more Orcas and
   Wardens than the gravitic hook capacity of the fleet." Profiili kertoo, mita
   koukku kantaa: Explorer 3 x "Capacity: 1 Orca/Warden" (s.458). */
const hookA = () => failed().some(c => /^Gravitic hook capacity \(Orcas and Wardens\)/.test(c.t));
const hookB = () => failed().some(c => /^Gravitic hook capacity \(Dhows and Orcas\)/.test(c.t));
const tmH = listIndex("Merchant Fleet");
build(tmH, 1000, [["Explorer class starship", 1], ["Orca class gunship", 4]]);
eq(hookA(), true, "Tau: nelja Orcaa kolmen koukun laivastossa kaatuu");
build(tmH, 1000, [["Explorer class starship", 1], ["Orca class gunship", 3]]);
eq(hookA(), false, "Tau: kolme Orcaa kolmen koukun laivastossa kelpaa");
/* s.457: "Gravitic hooks on a Custodian battleship or Emissary starship cannot
   count toward this total." Profiilissa ne ovat Warden-kohtaisia (s.468, 472). */
build(cp26, 2000, [["Custodian class starship", 1], ["Orca class gunship", 1]]);
eq(hookB(), true, "Tau: Orca Custodianin Warden-koukuilla kaatuu");
build(cp26, 2000, [["Custodian class starship", 1], ["Warden class gunship", 3]]);
eq(hookA(), false, "Tau: kolme Wardenia Custodianin koukuilla kelpaa");
eq(hookB(), false, "Tau: Wardenit eivät kuluta Dhow-kapasiteettia");
/* J38 s.372: "Ork fleets always include one Warlord for every 500 points, or
   part, that the fleet is worth - no more, no less." s.370: "While there must
   be at least one Warlord for every 500 points in the fleet or portion
   thereof, not all Warlords are created equal!" */
const clWl = () => failed().some(c => c.t === "WARLORD");
/* T26: "that the fleet is worth" - laivaston omat pisteet. Runko-osa on
   245+370+310+210 = 1135 p, joka vaatii tasan kolme Warlordia. */
const CLBIG = [["Hammer class battlekroozer", 1], ["Terror ship", 1], ["Terror ship", 1],
               ["Kill kroozer", 1], ["Kill kroozer", 1]].concat(TID);
build(cll, 1500, [["Ork Warlord", 1]].concat(CLBIG));
eq(api.total() > 1000, true, "T26: Clanz-laivasto on yli 1000 p (" + api.total() + ")");
eq(clWl(), true, "Clanz: yksi Warlord yli 1000 p laivastossa kaatuu (no less)");
build(cll, 1500, [["Ork Warlord", 1], ["Ork Warlord", 1], ["Ork Warlord", 1]].concat(CLBIG));
eq(clWl(), false, "Clanz: kolme Warlordia yli 1000 p laivastossa kelpaa");
build(cll, 1500, [["Ork Warlord", 1], ["Ork Warlord", 1], ["Ork Warlord", 1], ["Ork Warlord", 1], ["Kill kroozer", 1]].concat(TID));
eq(clWl(), true, "Clanz: nelja Warlordia 1 500 pisteen laivastossa kaatuu (no more)");
/* J41 s.404: "A Necron fleet may purchase re-rolls, but they are purchased by
   the fleet as a whole, rather than being considered Fleet Commander
   re-rolls." "The fleet gets one re-roll and can purchase extra re-rolls at
   the cost shown." Hinnasto on One extra re-roll tai Two extra re-rolls:
   kaksi eri yksikolle ostettua rivia antaisi kolme, jota ei myyda. Demiurgin
   s.486 sama lause. */
const rrOnce = () => failed().some(c => /bought once for the fleet/.test(c.t));
[["Necrons — Harvest Fleet", "Cairn class tombship", "Jackal class raiders", 4],
 ["Demiurg — War Host", "Stronghold Commerce Vessel", "Bastion Commerce Vessel", 1]].forEach(([nm, a, b, nb]) => {
  const li = listIndex(nm);
  buildU(li, 3000, [[a, 1, [], 0, ["One extra re-roll"]], [b, nb, [], 0, ["Two extra re-rolls"]]]);
  eq(rrOnce(), true, nm + ": One ja Two eri yksikoille kaatuu");
  buildU(li, 3000, [[a, 1, [], 0, ["Two extra re-rolls"]], [b, nb]]);
  eq(rrOnce(), false, nm + ": pelkka Two extra re-rolls kelpaa");
});
/* J42 Fleets p.13: "The escorts in a squadron do not have to all be of the
   same class." "A single escort may be taken in a fleet as long as there are
   no other escorts in the fleet and no other restrictions due to the fleet
   list, such as a minimum of six escorts in a squadron, these restrictions
   cannot be ignored. If any more than one escort is taken in a fleet list,
   then all escorts must be formed in squadrons of at least two or whatever
   minimum is required by that particular fleet list." Armageddon s.43:
   "Space Marine vessels may not be squadroned with non-Space Marine vessels." */
const sqFail = () => failed().some(c => /^Squadrons of/.test(c.s || ""));
const bfl = listIndex("Bastion Fleets");
build(bfl, 1500, [["Admiral (Ld 9)", 1], ["Lunar class cruiser", 1], ["Cobra class destroyer", 1]]);
eq(sqFail(), false, "Bastion: ainoa saattaja yksin kelpaa");
build(bfl, 1500, [["Admiral (Ld 9)", 1], ["Lunar class cruiser", 1], ["Firestorm class frigate", 1], ["Sword class frigate", 1]]);
eq(sqFail(), false, "Bastion: Firestorm + Sword samana laivueena kelpaa");
build(bfl, 1500, [["Admiral (Ld 9)", 1], ["Lunar class cruiser", 1], ["Cobra class destroyer", 1], ["Sword class frigate", 3]]);
eq(sqFail(), false, "Bastion: yksi Cobra liittyy kolmen Swordin laivueeseen");
build(bfl, 1500, [["Admiral (Ld 9)", 1], ["Lunar class cruiser", 1], ["Cobra class destroyer", 1], ["Sword class frigate", 6]]);
eq(sqFail(), true, "Bastion: yksi Cobra ja taysi kuuden Swordin laivue kaatuu");
build(pil, 1000, [CAPT, ["Lunar class cruiser", 1], ["Sword Frigate", 1]]);
eq(sqFail(), true, "Merirosvot: yksittainen saattaja kaatuu listan 3-6-minimiin");
const arl = listIndex("Armageddon Sector");
build(arl, 1500, [["Lunar class cruiser", 1], ["Firestorm Class Frigate", 1], ["Nova Class Frigate", 1]]);
eq(sqFail(), true, "Armageddon: Space Marine- ja laivaston saattaja eivat muodosta laivuetta");
/* Tau s.455: "Defenders are fielded in squadrons of 2-6 ships. They may be
   combined in squadrons with Messengers if you wish." */
["Tau — Merchant Fleet", "Tau — Commerce Protection"].forEach(nm => {
  build(listIndex(nm), 1500, [["Defender class starship", 1], ["Messenger class starship", 1]]);
  eq(failed().some(c => /defender/i.test(c.t) && / ships/.test(c.v)), false, nm + ": Defender ja Messenger samana laivueena kelpaa");
});
/* Vanguard: "Vanguard drone ships and Kraken may be deployed in squadrons of
   6 to 12 models. You may combine the two types in a single squadron if you
   wish." */
const vgl = listIndex("Vanguard Fleet");
build(vgl, 1500, [["Kraken", 3], ["Vanguard drone", 3]]);
eq(sqFail(), false, "Vanguard: kolme Krakenia ja kolme drone shipia samana laivueena kelpaa");
build(vgl, 1500, [["Kraken", 3]]);
eq(sqFail(), true, "Vanguard: kolmen Krakenin laivue yksin kaatuu");
/* J47 s.367: "An Ork fleet can include a maximum of one space hulk per 1,500
   points. So if the fleet is worth up to 1,500 points, it may include one
   Space hulk. If it is worth 1,500-3,000 points, two space hulks may be
   included, etc. Each Ork hulk must be assigned an Ork Warlord to command it." */
const wal = listIndex("Waaagh!");
const hulkWl = () => failed().some(c => /^Warlords for Ork hulks/.test(c.t));
build(wal, 3000, [["Ork Warlord", 1], ["Ork hulk", 1], ["Ork hulk", 1]]);
eq(hulkWl(), true, "Waaagh!: kaksi hulkia yhdella Warlordilla kaatuu");
build(wal, 3000, [["Ork Warlord", 1], ["Ork Warlord", 1], ["Ork hulk", 1], ["Ork hulk", 1]]);
eq(hulkWl(), false, "Waaagh!: kaksi hulkia kahdella Warlordilla kelpaa");
/* Pistokoe 19 kierros 2 (M10r2, M8r2). Jokainen lause kokonaan testin kohdalla. */
/* J52 s.245: "You may include up to one Space Hulk in the fleet, which must be
   the flagship if chosen. Bezerker Fleets led by a Space Hulk may have more
   than two battleships, but other restrictions remain unchanged." */
const khl = listIndex("Chaos — Khorne");
build(khl, 5000, [["Warmaster", 1], ["Chaos Space Hulk", 1], ["Despoiler class battleship", 1],
                  ["Despoiler class battleship", 1], ["Despoiler class battleship", 1]]);
eq(hulkBs(), false, "Khorne: Space Hulk ja kolme muuta taistelulaivaa kelpaa (s.245)");
/* J55 s.456: "Your fleet may include any number of Merchant, Emissary or
   Protector class starships. It may also include up to one Hero class
   starship for every other type of capital ship in the fleet." Aluskohtainen
   raja on molempien lukutapojen yhteinen (T18). */
const cpl = listIndex("Commerce Protection");
const heroFail = () => failed().some(c => /^Hero class starships/.test(c.t));
build(cpl, 1500, [["Tau Kor'el", 1], ["Hero class starship", 1], ["Hero class starship", 1]]);
eq(heroFail(), true, "Commerce Protection: kaksi Herota ilman muita kapitaalialuksia kaatuu");
build(cpl, 1500, [["Tau Kor'el", 1], ["Hero class starship", 1], ["Protector class starship", 1]]);
eq(heroFail(), false, "Commerce Protection: Hero ja Protector kelpaa");
/* T18 (kayttajan paatos 11.9.): "type" on aluslaji - konfiguraatiot samaa lajia. */
build(cpl, 2000, [["Tau Kor'el", 1], ["Hero class starship", 1], ["Hero class starship", 1],
                  ["Protector class starship", 1], ["Protector class starship", 1]]);
eq(heroFail(), true, "Commerce Protection: kaksi Herota ja kaksi Protectoria (yksi laji) kaatuu");
build(cpl, 2000, [["Tau Kor'el", 1], ["Hero class starship", 1], ["Hero class starship", 1],
                  ["Protector class starship", 1], ["Merchant class starship", 1]]);
eq(heroFail(), false, "Commerce Protection: kaksi Herota, Protector ja Merchant (kaksi lajia) kelpaa");
/* J56 s.457: "Up to one Rogue Trader cruiser and its attendant escorts may
   accompany the fleet for every 750 points of Tau ships in the fleet.
   Additionally, a single squadron of up to six Xenos escorts can be taken as
   per the Rogue Trader rules and fleet list." */
const rtEsc = () => failed().some(c => /^Rogue Trader escort squadrons/.test(c.t));
build(cpl, 2000, [["Tau Kor'el", 1], ["Protector class starship", 1], ["Xenos Vessel", 7]]);
eq(failed().some(c => /Squadrons of 2.6/.test(c.s || "") && /XENOS/i.test(c.t)), true, "Commerce Protection: seitseman Xenos Vesselin laivue kaatuu");
build(cpl, 2000, [["Tau Kor'el", 1], ["Protector class starship", 1], ["Xenos Vessel", 3], ["Iconoclast Destroyer", 3]]);
eq(rtEsc(), true, "Commerce Protection: kaksi Rogue Trader -saattajalaivuetta ilman risteilijaa kaatuu");
build(cpl, 2000, [["Tau Kor'el", 1], ["Protector class starship", 1], ["Rogue Trader Cruiser", 1], ["Xenos Vessel", 3], ["Iconoclast Destroyer", 3]]);
eq(rtEsc(), false, "Commerce Protection: risteilija ja kaksi saattajalaivuetta kelpaa");
/* J57 s.487: "For every three Demiurg capital ships in the fleet, it may
   include one squadron of up to six Tau or Rogue Trader escorts." "Tau,
   Nicassar and Rogue Trader escorts may not be mixed in the same squadrons." */
const whl = listIndex("War Host");
const BCV = [["Bastion Commerce Vessel", 1], ["Bastion Commerce Vessel", 1], ["Bastion Commerce Vessel", 1]];
build(whl, 2500, BCV.concat([["Defender class starship", 7]]));
eq(failed().some(c => /Squadrons of 2.6/.test(c.s || "") && /DEFENDER/i.test(c.t)), true, "War Host: seitseman Defenderin laivue kaatuu");
build(whl, 2500, BCV.concat([["Defender class starship", 6]]));
eq(failed().some(c => /Squadrons of 2.6/.test(c.s || "") && /DEFENDER/i.test(c.t)), false, "War Host: kuuden Defenderin laivue kelpaa");
/* J61 s.177: "The fleet must include at least one squadron of escort-sized
   cargo ships of any type (whether or not the scenario requires transports),
   in a squadron of 2 to 6 ships. Any number of cargo ships beyond this number
   may be taken and organized in squadrons that only contain cargo ships." */
const exl = listIndex("Rogue Traders — Exploration");
const cargoSq = () => failed().some(c => /Squadrons of 2.6\. The fleet must include/.test(c.s || ""));
build(exl, 1500, [["Rogue Trader cruiser", 1], ["Cargo Transport", 1]]);
eq(cargoSq(), true, "Exploration: yhden aluksen cargo-laivue kaatuu");
build(exl, 1500, [["Rogue Trader cruiser", 1], ["Cargo Transport", 2]]);
eq(cargoSq(), false, "Exploration: kahden aluksen cargo-laivue kelpaa");
/* J62 s.372: "Tiddla skwadron 3-10 Escorts, chosen from the following list in
   any mix desired" */
const tidSq = () => failed().some(c => /Squadrons of 3.10/.test(c.s || ""));
build(cll, 1000, [["Ork Warlord", 1], ["Ork Warlord", 1], ["Ravager attack ship", 2]]);
eq(tidSq(), true, "Clanz: kahden aluksen tiddla-skwadron kaatuu");
build(cll, 1000, [["Ork Warlord", 1], ["Ork Warlord", 1], ["Ravager attack ship", 2], ["Grunt assault ship", 1]]);
eq(tidSq(), false, "Clanz: kaksi Ravageria ja Grunt samana skwadronina kelpaa");
build(cll, 1000, [["Ork Warlord", 1], ["Ork Warlord", 1], ["Ravager attack ship", 11]]);
eq(tidSq(), true, "Clanz: yhdentoista aluksen tiddla-skwadron kaatuu");
/* J63 s.318: "If the fleet is worth over 750 points, an Autarch must be
   included to lead it. Eldar Autarch (Ld 9) ... Iyanden Bearer of the Flame
   (Ld 10)" ja "If your fleet is led by an Autarch, you may include a single
   Dragonship as his flagship which does not count against this limitation." */
const iyd = listIndex("Iyanden");
const dragFail = () => failed().some(c => /dragonship/i.test(c.t));
build(iyd, 1000, [["Iyanden Bearer of the Flame", 1], ["Dragonship", 1]]);
eq(dragFail(), false, "Iyanden: Bearer of the Flame ja yksi Dragonship lippulaivana kelpaa");
build(iyd, 1000, [["Eldar Autarch", 1], ["Dragonship", 1], ["Dragonship", 1]]);
eq(dragFail(), true, "Iyanden: kaksi Dragonshipia ilman Wraithshipeja kaatuu");
/* J64 s.431: "Up to 10 % of the fleet's points allowance may be spent on
   Ordnance markers as long as at least one hive ship is chosen." Merkit
   ostetaan aluksille, joten osuus lasketaan paivityksista. */
const hfl = listIndex("Tyranids — Hive Fleet");
const ordFail = () => failed().some(c => /^Ordnance markers/.test(c.t));
buildU(hfl, 250, [["Hive ship", 1, [], 0, ["Strength 4 boarding torpedo marker", "Assault boat marker", "Fighter marker"]]]);
eq(ordFail(), true, "Hive Fleet: 27 pistetta merkkeja 250 pisteen laivastossa kaatuu");
buildU(hfl, 250, [["Hive ship", 1, [], 0, ["Assault boat marker", "Fighter marker"]]]);
eq(ordFail(), false, "Hive Fleet: 15 pistetta merkkeja 250 pisteen laivastossa kelpaa");
/* J65 s.431: "You may include between 6 and 12 escort class ships for each
   hive ship. If no hive ships are chosen, only Kraken and Vanguard drone
   ships may be included in the fleet." */
const hiveMax = () => failed().some(c => /^Escorts per hive ship \(max\)/.test(c.t));
build(hfl, 500, [["Kraken", 2]]);
eq(hiveMax(), false, "Hive Fleet: kaksi Krakenia ilman hive shipia kelpaa");
build(hfl, 1500, [["Hive ship", 1], ["Kraken", 13]]);
eq(hiveMax(), true, "Hive Fleet: kolmetoista saattajaa yhdella hive shipilla kaatuu");
/* J66 s.144: "If the fleet is above 750 points an Inquisitor Lord must lead
   the fleet. If an Inquisitorial Cruiser is present the Inquisitor Lord must
   be placed aboard it." Laivastoa johtaa yksi Inquisitor Lord (T19). */
const gkl = listIndex("Grey Knights");
const gkCmd = () => failed().some(c => /^Fleet commander \(one Inquisitor Lord\)/.test(c.t));
build(gkl, 1500, [["Inquisitor Lord (Ld 9)", 1], ["Ordo Malleus Inquisitor Lord", 1]]);
eq(gkCmd(), true, "Grey Knights: kaksi Inquisitor Lordia kaatuu");
build(gkl, 1500, [["Ordo Malleus Inquisitor Lord", 1]]);
eq(gkCmd(), false, "Grey Knights: yksi Inquisitor Lord kelpaa");
/* Pistokoe 19 kierros 3 (M10r3). */
/* J70 s.177: "At least one Demiurg vessel of any class may be taken for every
   three Rogue Trader cruisers in the fleet." Valja raja (T20): yksi heti, sitten
   yksi kolmea kohden. */
const demFail = () => failed().some(c => /^Demiurg vessels/.test(c.t));
build(exl, 2000, [["Rogue Trader cruiser", 1], ["Bastion Commerce Vessel", 1], ["Bastion Commerce Vessel", 1]]);
eq(demFail(), true, "Exploration: kaksi Demiurg-alusta yhdella RT-risteilijalla kaatuu");
build(exl, 2000, [["Rogue Trader cruiser", 1], ["Bastion Commerce Vessel", 1]]);
eq(demFail(), false, "Exploration: yksi Demiurg-alus yhdella RT-risteilijalla kelpaa");
/* J71 s.370: "A vessel or escort skwadron led by a Warlord may be given up to
   one of the following upgrades per Command re-roll the Warlord has. Each
   upgrade can only be applied once." s.372: Warlordilla on yksi re-roll ja se
   voi ostaa lisaa. Sidontaa ei mallinneta (J8); laivastotason summa valvotaan. */
const gubFail = () => failed().some(c => /^Gubbins \(one per Warlord re-roll\)/.test(c.t));
buildU(cll, 1000, [["Ork Warlord", 1], ["Ork Warlord", 1], ["Kill kroozer", 1, [], 0, ["Soopa Boostas"]],
                   ["Kill kroozer", 1, [], 0, ["Mad Meks"]], ["Kill kroozer", 1, [], 0, ["Extra Power Fields"]]]);
eq(gubFail(), true, "Clanz: kolme Gubbinia kahden Warlordin kahdella re-rollilla kaatuu");
buildU(cll, 1000, [["Ork Warlord", 1, [], 0, ["One extra re-roll"]], ["Ork Warlord", 1], ["Kill kroozer", 1, [], 0, ["Soopa Boostas"]],
                   ["Kill kroozer", 1, [], 0, ["Mad Meks"]], ["Kill kroozer", 1, [], 0, ["Extra Power Fields"]]]);
eq(gubFail(), false, "Clanz: kolme Gubbinia kolmella re-rollilla kelpaa");
/* J72 s.100: "Any Imperial Navy battleship, grand cruiser or battlecruiser may
   have a Space Marine Captain assigned to it." Dominion-listalla ei ole Imperial
   Navy -runkoja (reservit J73). */
const dml = listIndex("Space Marines — Dominion");
build(dml, 1500, [["Master of the Fleet", 1], ["Strike cruiser", 1], ["Space Marine Captain", 1]]);
eq(failed().some(c => /^Space Marine Captains/.test(c.t)), true, "Dominion: Space Marine Captain ilman Imperial Navy -runkoa kaatuu");
/* J77 s.145: "The vessel embarking the Inquisitor Lord or one Grey Knights
   vessel may take Grey Knight Terminators." Yksi alus laivastossa. */
buildU(gkl, 1500, [["Ordo Malleus Inquisitor Lord", 1],
                   ["Grey Knights Strike Cruiser", 1, [], 0, ["Grey Knights Terminators"]],
                   ["Grey Knights Strike Cruiser", 1, [], 0, ["Grey Knights Terminators"]]]);
eq(failed().some(c => c.t === "Grey Knights Terminators"), true, "Grey Knights: Terminatorit kahdella aluksella kaatuu");
/* J78 s.40: "As long as at least one Space Marine Battle barge is included you
   may choose a Master of the Fleet, who will always be assigned to a Battle
   barge and cannot be assigned to a non-Space Marine ship. As long as the fleet
   includes at least one Imperial capital ship it may include a fleet-admiral,
   admiral or solar admiral, who will always be assigned to an Imperial Navy
   vessel and cannot be a assigned to a Space Marine vessel." */
build(arl, 1500, [["Master of the Fleet", 1], ["Lunar class cruiser", 1]]);
eq(failed().some(c => /^Master of the Fleet needs/.test(c.t)), true, "Armageddon: Master of the Fleet ilman battle bargea kaatuu");
build(arl, 1500, [["Admiral (Ld 9)", 1], ["Space Marine Strike Cruiser", 1]]);
eq(failed().some(c => /^Admiral needs/.test(c.t)), true, "Armageddon: amiraali ilman Imperial Navy -kapitaalialusta kaatuu");
build(arl, 1500, [["Admiral (Ld 9)", 1], ["Lunar class cruiser", 1]]);
eq(failed().some(c => /^Admiral needs/.test(c.t)), false, "Armageddon: amiraali ja Lunar kelpaa");
/* J81 s.244 (Khorne), s.240 (Nurgle): "You can only include a Chaos Warmaster
   in your fleet if it includes any capital ships." */
build(khl, 400, [["Chaos Warmaster", 1], ["Idolator", 2]]);
eq(failed().some(c => /^Chaos Warmaster needs a capital ship/.test(c.t)), true, "Khorne: Warmaster ilman kapitaalialusta kaatuu");
build(khl, 1000, [["Chaos Warmaster", 1], ["Slaughter", 1]]);
eq(failed().some(c => /^Chaos Warmaster needs a capital ship/.test(c.t)), false, "Khorne: Warmaster ja risteilija kelpaa");
build(nul, 400, [["Chaos Warmaster", 1], ["Idolator", 2]]);
eq(failed().some(c => /^Chaos Warmaster needs a capital ship/.test(c.t)), true, "Nurgle: Warmaster ilman kapitaalialusta kaatuu");
/* J82 s.140: "The listed cost is added to that of the Inquisitor Lord, and its
   benefits apply to the ship they are embarked upon." Ordo on johtavan Lordin
   lisa: se vaatii Lordin, ja Ordoja on yksi. */
const inq82 = listIndex("The Emperor's Inquisition");
build(inq82, 1000, [["Inquisitorial Cruiser", 1], ["Ordo Hereticus", 1]]);
eq(failed().some(c => /^Ordo Inquisitor needs an Inquisitor Lord/.test(c.t)), true, "Inquisition: Ordo ilman Inquisitor Lordia kaatuu");
build(inq82, 1000, [["Inquisitor Lord (Ld 9)", 1], ["Inquisitorial Cruiser", 1], ["Ordo Hereticus", 1], ["Ordo Xenos", 1]]);
eq(failed().some(c => /^Ordo affiliation/.test(c.t)), true, "Inquisition: kaksi Ordoa kaatuu");
build(inq82, 1000, [["Inquisitor Lord (Ld 9)", 1], ["Inquisitorial Cruiser", 1], ["Ordo Hereticus", 1]]);
eq(failed().some(c => /^Ordo/.test(c.t)), false, "Inquisition: Lord ja yksi Ordo kelpaa");
/* J83 s.138: "A Space Marine fleet led by an Ordo Malleus Inquisitor including
   at least 1000 points of Inquisition vessels and Grey Knights strike cruisers
   may include a single Grey Knights battle barge." */
build(inq82, 500, [["Grey Knights Battle barge", 1]]);
eq(failed().some(c => /^Grey Knights Battle barge needs an Ordo Malleus/.test(c.t)), true, "Inquisition: GK Battle barge ilman Ordo Malleusta kaatuu");
eq(failed().some(c => /^Grey Knights Battle barge \(1000 points/.test(c.t)), true, "Inquisition: GK Battle barge ilman 1000 pisteen aluksia kaatuu");
build(inq82, 2000, [["Inquisitor Lord (Ld 9)", 1], ["Ordo Malleus", 1], ["Inquisitorial Cruiser", 1], ["Inquisition Blackship", 1],
                    ["Grey Knights Strike Cruiser", 1], ["Grey Knights Strike Cruiser", 1], ["Grey Knights Strike Cruiser", 1],
                    ["Grey Knights Battle barge", 1]]);
eq(failed().some(c => /^Grey Knights Battle barge/.test(c.t)), false, "Inquisition: Ordo Malleus, 1065 p aluksia ja GK Battle barge kelpaa");
/* J84 s.174: "Any fleet except Necrons or Tyranids may include a single Rogue
   Trader capital ship. Tau, Demiurg and Imperial fleets may include one Rogue
   Trader cruiser for every 750 points or part thereof in their fleet." */
build(rt, 1000, [["Veteran Rogue Trader", 1], ["Rogue Trader Cruiser", 1], ["Rogue Trader Cruiser", 1], ["Rogue Trader Cruiser", 1]]);
eq(failed().some(c => /^Rogue Trader cruisers \(one per 750/.test(c.t)), true, "Rogue Traders: kolme risteilijaa 1000 pisteessa kaatuu");
/* T26: kahden risteilijan kiintio vaatii yli 750 p laivaston (50+370+400 = 820). */
build(rt, 1000, [["Veteran Rogue Trader", 1], ["Rogue Trader Cruiser", 1], ["Rogue Trader Cruiser", 1],
                 ["Xenos Vessel", 6], ["Xenos Vessel", 2]]);
eq(api.total() > 750, true, "T26: RT-laivasto on yli 750 p (" + api.total() + ")");
eq(failed().some(c => /^Rogue Trader cruisers \(one per 750/.test(c.t)), false, "Rogue Traders: kaksi risteilijaa yli 750 p laivastossa kelpaa");
/* J88 s.236: "Any ship led by a Lord of Tzeentch (and not the Warmaster!) may
   be granted a Strand of Fortune." Sidontaa ei mallinneta (J8). */
const tzl88 = listIndex("Chaos — Tzeentch");
buildU(tzl88, 1000, [["Chaos Warmaster", 1], ["Slaughter", 1, [], 0, ["Strand of Fortune"]]]);
eq(failed().some(c => /^Strand of Fortune/.test(c.t)), true, "Tzeentch: Strand of Fortune ilman Chaos Lordia kaatuu");
buildU(tzl88, 1000, [["Chaos Warmaster", 1], ["Chaos Lord", 1], ["Slaughter", 1, [], 0, ["Strand of Fortune"]]]);
eq(failed().some(c => /^Strand of Fortune/.test(c.t)), false, "Tzeentch: Strand of Fortune ja Chaos Lord kelpaa");
/* J89 s.318: "In order to take the Flame of Asuryan, an Eldar Hero must lead the
   fleet and be embarked aboard it." s.319 Yriel (Bearer of the Flame): "you may
   instead pick the Flame of Asuryan as his command ship to be embarked on." */
build(iyd, 1500, [["Eldar Autarch", 1], ["Flame of Asuryan", 1]]);
eq(failed().some(c => /^Flame of Asuryan needs/.test(c.t)), true, "Iyanden: Flame of Asuryan Autarchin johtamana kaatuu");
build(iyd, 1500, [["Eldar Hero (Ld 10)", 1], ["Flame of Asuryan", 1]]);
eq(failed().some(c => /^Flame of Asuryan needs/.test(c.t)), false, "Iyanden: Flame of Asuryan ja Eldar Hero kelpaa");
build(iyd, 1500, [["Iyanden Bearer of the Flame", 1], ["Flame of Asuryan", 1]]);
eq(failed().some(c => /^Flame of Asuryan needs/.test(c.t)), false, "Iyanden: Flame of Asuryan ja Yriel kelpaa");
/* T24 (kayttajan paatos 11.9.2026): s.35 "If the fleet is worth over 750 points
   an Admiral must be included to lead it." Laivaston arvo = sen alusten pisteet,
   ei pelin pisteraja: keskenerainen 105 p lista 1000 p pelissa ei viela vaadi
   amiraalia. */
const gs24 = listIndex("Gothic Sector");
build(gs24, 1000, [["Sword", 3]]);
eq(failed().some(c => /^Admiral \(over 750/.test(c.t)), false, "T24: 105 p laivasto 1000 p pelissa ei vaadi amiraalia");
build(gs24, 1000, [["Lunar", 1], ["Lunar", 1], ["Lunar", 1], ["Lunar", 1], ["Sword", 3]]);
eq(failed().some(c => /^Admiral \(over 750/.test(c.t)), true, "T24: 825 p laivasto ilman amiraalia kaatuu");
/* Sama sanamuoto sallivissa rajoissa: s.234 "A fleet of 1,000 points or more
   may include the Planet Killer." */
build(bcl, 1500, [["Chaos Warmaster", 1], ["Planet Killer", 1]]);
eq(failed().some(c => c.t === "Planet Killer"), true, "T24: Planet Killer 605 p laivastossa kaatuu");
build(bcl, 1500, [["Chaos Warmaster", 1], ["Planet Killer", 1], ["Slaughter", 1], ["Slaughter", 1], ["Slaughter", 1]]);
eq(failed().some(c => c.t === "Planet Killer"), false, "T24: Planet Killer 1100 p laivastossa kelpaa");
/* T20 ja T23 ovat avoimia tulkintoja (kayttaja 11.9.): sovellus sallii valjan
   luennan mutta nayttaa varoituksen, kun tiukka luenta ei tayty. */
const openWarn = id => api.checks().some(c => c.ok && c.warn && c.t.indexOf("Open interpretation (" + id + ")") === 0);
const ex20 = listIndex("Exploration");
build(ex20, 1000, [["Rogue Trader Cruiser", 1], ["Bastion Commerce Vessel", 1]]);
eq(openWarn("T20"), true, "T20: yksi RT-risteilija ja Demiurg -> avoimen tulkinnan varoitus");
build(rt, 1000, [["Veteran Rogue Trader", 1], ["Rogue Trader Cruiser", 1], ["Rogue Trader Cruiser", 1],
                 ["Xenos Vessel", 6], ["Xenos Vessel", 2]]);
eq(openWarn("T23"), true, "T23: kaksi RT-risteilijaa -> avoimen tulkinnan varoitus");
build(rt, 1000, [["Rogue Trader Cruiser", 1]]);
eq(openWarn("T23"), false, "T23: yksi RT-risteilija -> ei varoitusta");
/* v1.1-puutteet nakyvat laivaston tarkistuksissa (kayttaja 11.9.): gravitic
   hook -kapasiteetti ja Dominionin Imperial Navy -reservit. */
/* J95 (14.9.): Tau-listoilla kapasiteetti on valvottu, joten varoitus on enaa
   War Hostilla, jonka lause katkeaa kirjassa kesken (s.487). */
const tm11 = listIndex("Merchant Fleet");
build(tm11, 1000, [["Merchant class", 1]]);
eq(api.checks().some(c => c.warn && /^Gravitic hook capacity .*check by hand/.test(c.t)), false, "J95: Tau Merchantilla ei ole enaa hook-varoitusta");
eq(api.checks().some(c => /^Gravitic hook capacity \(Orcas and Wardens\)/.test(c.t)), true, "J95: Tau Merchantilla on valvottu hook-kapasiteetti");
const wh11 = listIndex("Demiurg — War Host");
build(wh11, 1000, [["Bastion Commerce Vessel", 1]]);
/* J213 (kayttaja 20.10.2026 "toteuta kaikki"): luku puuttuu yha, joten War
   Host saa Tau-listojen lukutavan avoimena tulkintana T50 - ylitys on
   keltainen, ei punainen (golden war-host-hook-capacity-open-reading). */
eq(api.checks().some(c => c.ok && /^Gravitic hook capacity .*open interpretation T50/.test(c.t)), true, "J213: War Hostin hook-kapasiteetti on tarkistus, avoin tulkinta T50");
eq(api.checks().some(c => /check by hand/.test(c.t)), false, "J213: War Hostilla ei ole enaa 'check by hand' -varoitusta");
/* J106: Dominionin reservit ovat nyt moottorissa (s.101), joten J92:n
   "ei viela sovelluksessa" -huomautus poistettiin. Tilalla on kirjan oma
   raja: kymmenen risteilijaa ilman reserveja, kaksitoista niiden kanssa. */
const dm11 = listIndex("Dominion");
build(dm11, 1000, [["Master of the Fleet", 1]]);
eq(api.checks().some(c => /^Imperial Navy reserves/.test(c.t)), false, "J106: Dominionin reservihuomautus on poistettu");
eq(api.checks().some(c => /^Cruisers$/.test(c.t) && c.v === "0 / 10"), true, "J106: Dominionin risteilijaraja on 10 ilman reserveja");

console.log("\n" + (fails ? fails + " TESTIA EPAONNISTUI" : "kaikki testit lapi"));
process.exit(fails ? 1 : 0);
