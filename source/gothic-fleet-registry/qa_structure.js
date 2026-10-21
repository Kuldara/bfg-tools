/* Rakennetarkistus: viittausten eheys ja reunatapaukset.

   audit.py vertaa dataa lahde-PDF:iin ja print_check.js kortteja profiiliin.
   Kumpikaan ei tarkista datan SISAISIA viittauksia - osoittaako optio
   olemassa olevaan aseistusriviin, onko jokainen alus jonkin listan
   tavoitettavissa, kestaako laivueen kokolaskenta rajojen ulkopuoliset
   arvot. Tama tekee sen.

   Aja:  node qa_structure.js
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
global.localStorage = { getItem: k => (k in store ? store[k] : null),
                        setItem: (k, v) => { store[k] = v; } };
global.alert = () => {}; global.confirm = () => false;

const html = fs.readFileSync(path.join(__dirname, "Gothic Fleet Registry.html"), "utf8");
const js = html.split("<script>")[1].split("</script>")[0].replace(/^"use strict";/, "");
const api = new Function(js +
  "\n;return {LISTS,SHIPS,cardHTML,isEscort,hulls,criticalModel,specialLines," +
  "applyRequired,unitPts,armModel,optState,setOptState,getS:()=>S};")();

const { LISTS, SHIPS } = api;
const found = [];
let checks = 0;
const fail = (kind, msg) => found.push({ kind, msg });
const check = (cond, kind, msg) => { checks++; if(!cond) fail(kind, msg); return cond; };

/* ------------------------------------------ 1. viittausten eheys listoilta */
const referenced = new Set();
LISTS.forEach(L => L.secs.forEach((sec, si) => sec.ents.forEach((en, ei) => {
  const at = L.nm + " / " + sec.t + " / " + (en.l || "?");
  if(en.r == null) return;
  const sh = SHIPS[String(en.r)];
  if(!check(!!sh, "viite", at + ": viite " + en.r + " ei osoita alukseen")) return;
  referenced.add(String(en.r));
  /* Hinta: joko luku tai tarkoituksellinen null (kayttajan syottama). */
  check(en.p == null || Number.isFinite(en.p),
        "hinta", at + ": hinta ei ole luku (" + en.p + ")");
  check(en.p == null || en.p >= 0, "hinta", at + ": negatiivinen hinta " + en.p);
})));

/* Orpo alus: datassa mutta ei minkaan listan kautta saatavissa.
   Puolustusasemat, orbitaalit, maakohteet ja kuljetukset eivat ole
   laivastolistan rivejä vaan skenaarion asettamia, joten niiden
   puuttuminen on oikein. Ne luetellaan tiedoksi, ei loydoksena. */
const SCENARIO_TYPES = /^(Defence|Ground)$/i;
const SCENARIO_NAMES = /TRANSPORT|ORBITAL|SPACE STATION|STAR FORT|FORTRESS|MONITOR|SYSTEM SHIP|AIR BASE|CARAVAN/i;
const orphanInfo = [];
Object.keys(SHIPS).forEach(k => {
  if(referenced.has(k)) return;
  const sh = SHIPS[k];
  const scenario = SCENARIO_TYPES.test(sh.ty || "") || SCENARIO_NAMES.test(sh.nm || "");
  if(scenario){ orphanInfo.push(k + " " + (sh.nm || "").slice(0, 44)); return; }
  check(false, "orpo",
        "alus " + k + " (" + (sh.nm || "?") + ", " + (sh.ty || "?") +
        ") ei ole millaan listalla eika ole skenaariokohde");
});

/* --------------------------------------------- 2. aluksen oma eheys */
/* Profiili ilman aseistusriveja on loydos - yhdella poikkeuksella, joka on
   nimetty tasan: Fire Ship, Fleets s.516. Kirja painaa sille tyyppirivin
   (Escort/1, 15 cm, 45 astetta, 1, 5+, 1) ja SPECIAL-lohkon, mutta EI
   ARMAMENT-taulukkoa: "The controlling player can detonate a fire ship at
   any point in its movement phase" - alus itse on ase. Poikkeus on sidottu
   profiilin sivuun ja nimeen, ja se vanhenee nakyvasti: jos profiilille
   ilmestyy aserivi tai se lakkaa olemasta saantokortti (rc), tama kaatuu. */
const NO_ARMAMENT = { "516": "FIRE SHIP" };
Object.entries(SHIPS).forEach(([k, sh]) => {
  const at = (sh.nm || k);
  check(!!sh.nm, "alus", k + ": nimi puuttuu");
  if(NO_ARMAMENT[k]){
    check(sh.nm === NO_ARMAMENT[k] && sh.pg === 516 && Array.isArray(sh.aw) && sh.aw.length === 0 && !!sh.rc,
          "alus", at + ": aseettoman profiilin poikkeus (Fleets s.516) ei enaa pade: nimi, sivu, aserivit tai rc muuttui");
  }else{
    check(Array.isArray(sh.aw) && sh.aw.length > 0, "alus", at + ": ei aseistusrivea");
  }
  check(sh.pg != null, "alus", at + ": sivuviite puuttuu");
  (sh.aw || []).forEach((a, i) => {
    check(Array.isArray(a) && a.length >= 4, "alus",
          at + ": aserivi " + i + " on vaillinainen");
    check(!!a[0], "alus", at + ": aserivilta " + i + " puuttuu nimi");
  });

  /* Optioiden viittaukset aseistusriveihin. Rajojen yli menevä indeksi
     pudottaisi aseen hiljaa tai lisaisi undefined-rivin. */
  (sh.ol || []).forEach((o, i) => {
    const oat = at + " optio " + i;
    check(typeof o.t === "string" && o.t.length > 0, "optio", oat + ": teksti puuttuu");
    check(o.c == null || Number.isFinite(o.c), "optio", oat + ": hinta ei ole luku");
    (o.aws || []).forEach(r => check(r >= 0 && r < sh.aw.length, "optio",
      oat + ": aws viittaa riviin " + r + ", rivejä on " + sh.aw.length));
    if(o.sw){
      (o.sw.f || []).forEach(r => check(r >= 0 && r < sh.aw.length, "optio",
        oat + ": sw.f viittaa riviin " + r + ", rivejä on " + sh.aw.length));
      check(Array.isArray(o.sw.t) && o.sw.t.length > 0, "optio",
        oat + ": sw.t on tyhja");
      (o.sw.t || []).forEach((row, j) => check(Array.isArray(row) && row.length >= 4,
        "optio", oat + ": sw.t[" + j + "] on vaillinainen"));
    }
    if(o.dep != null)
      check(o.dep >= 0 && o.dep < (sh.ol || []).length, "optio",
        oat + ": dep viittaa optioon " + o.dep + ", optioita on " + (sh.ol || []).length);
    if(o.gmax != null)
      check(o.gmax >= 1 && !!o.grp, "optio",
        oat + ": gmax ilman ryhmaa tai gmax < 1");
  });

  /* Kriittinen taulukko syntyy jokaiselle alukselle. */
  let cm = null;
  try{ cm = api.criticalModel(sh); }catch(e){ fail("krit", at + ": criticalModel heitti: " + e.message); }
  if(cm){
    check(Array.isArray(cm.rows) && cm.rows.length > 0, "krit", at + ": ei kriittisia riveja");
    check(!!cm.title, "krit", at + ": kriittiselta taulukolta puuttuu otsikko");
  }
});

/* -------------------------------- 3. laivueen kokolaskenta reunatapauksissa */
/* Kaikki yksikot, joita ostetaan N kappaletta yhdelle kortille: escortit,
   yhden osuman puolustukset (isEscort lukee nyt profiilin sq-lipun: platformit,
   silot, air base - Rulebook s.100 "1HP defences grouped in up to six units")
   ja rungottomat kappalerivit (Orbital mine s.512, Minefield s.513; rivin
   cnt-lippu), joilla ei ole ylarajaa kayttoliittymassa. */
let sqUnits = 0, sqDefence = 0, sqCounted = 0;
LISTS.forEach((L, li) => L.secs.forEach((sec, si) => sec.ents.forEach((en, ei) => {
  const counted = en.r == null && en.k === "unit" && !!en.cnt;
  if(!counted && (en.r == null || !SHIPS[String(en.r)])) return;
  const S = api.getS();
  S.li = li; S.limit = 3000; S.units = [];
  const u = { s: si, e: ei, ref: en.r || null, n: 1, opts: [], os: {}, name: "" };
  api.applyRequired(u);
  S.units.push(u);
  if(!counted && !api.isEscort(u)) return;
  sqUnits++;
  if(counted) sqCounted++;
  else if(SHIPS[String(en.r)].df) sqDefence++;
  const at = L.nm + " / " + (en.l || "?");
  /* Rajojen ulkopuoliset arvot eivat saa tuottaa NaN:ia eivatka kaataa. */
  [-5, 0, 1, 6, 12, 99].forEach(n => {
    u.n = n;
    let hh, pts, h;
    try{ hh = api.hulls(u); pts = api.unitPts(u); h = api.cardHTML(u, "top"); }
    catch(e){ fail("laivue", at + " n=" + n + ": heitti " + e.message); return; }
    check(Number.isFinite(hh), "laivue", at + " n=" + n + ": hulls ei ole luku");
    check(Number.isFinite(pts), "laivue", at + " n=" + n + ": pisteet ei ole luku");
    check(!/undefined|NaN/.test(h), "laivue", at + " n=" + n + ": kortilla NaN/undefined");
    check(typeof h === "string" && h.length > 400, "laivue", at + " n=" + n + ": kortti jai tyhjaksi");
  });
})));
/* Silmukka ei saa hiljaa ohittaa puolustuksia: jos lippu tai rivit katoavat
   datasta, laskuri putoaa nollaan ja tama kaatuu. */
check(sqDefence > 0, "laivue", "yhtaan puolustuslaivuetta ei kayty lapi (sq-lippu tai df-rivit puuttuvat)");
check(sqCounted > 0, "laivue", "yhtaan rungotonta kappaleriviä ei kayty lapi (cnt-lippu puuttuu)");

/* ------------------------------------- 4. erikoissaannot: teksti ei katkea */
Object.values(SHIPS).forEach(sh => {
  let lines = [];
  try{ lines = api.specialLines(sh); }catch(e){ fail("saanto", sh.nm + ": specialLines heitti"); }
  lines.forEach((r, i) => {
    check(typeof r.t === "string" && r.t.trim().length > 0, "saanto",
      sh.nm + ": saantorivi " + i + " on tyhja");
    /* Katkennut lause: paattyy sanaan ilman valimerkkia ja on pitka.
       Sivuviite ("...on p. 175") ja numero ovat kelvollisia lopetuksia -
       kirja paattaa lauseen niihin ilman pistetta. */
    const tail = r.t.trim();
    const endsOk = /[.!?)\]:;]\s*$/.test(tail) ||
                   /\bp{1,2}\.?\s*\d+(?:\s*[-\u2013]\s*\d+)?\s*$/i.test(tail) ||
                   /\d\s*$/.test(tail);
    if(r.t.length > 60 && !endsOk)
      fail("saanto", sh.nm + ": saantorivi voi olla katkennut: ..." + tail.slice(-50));
  });
});

/* ------------------------------- 5. sama lause kahdesti saman osion tekstissa
   Osion teksti tulee kahdesta lahteesta: kirjan poiminnasta ja kasin
   kuratoiduista lauseista. Jos kuratoitu lause lisataan osioon, jossa
   poiminta on jo sen tuonut, pelaaja nakee saman lauseen kahdesti
   "Check yourself" -listassa ja manuaalilaskuri on liian suuri. Nain kavi
   Bastion Fleetsin reserviosiolle (s.39), ja se loytyi vasta tarkastuksessa.
   build_data.py:n add_text() estaa sen nyt; tama varmistaa etta estaa. */
const textKey = t => String(t || "").toLowerCase()
  .replace(/[\u2018\u2019]/g, "'").replace(/[\u201c\u201d]/g, '"')
  .replace(/[\u2013\u2014\u2022]/g, " ")
  .replace(/i\.e\./g, "ie").replace(/e\.g\./g, "eg").replace(/pg\./g, "pg")
  .replace(/[^a-z0-9]+/g, " ").trim();
/* Kirja itse toistaa saman lauseen tyranidien vauriotaulukossa (s.423:
   "The wreck moves 4D6 cm forward..." on kahdella eri tuloksella). Se ei
   ole poiminnan vika, joten se on sallittu nimeltä. */
const DUP_OK = [textKey("The wreck moves 4D6 cm forward in each of its subsequent Movement phases.")];
LISTS.forEach(L => {
  (L.secs || []).forEach(sec => {
    const txt = sec.text || [];
    const seen = new Map();
    txt.forEach((t, i) => {
      const k = textKey(t);
      if(k.length < 40 || DUP_OK.indexOf(k) >= 0) return;
      checks++;
      if(seen.has(k))
        fail("toistuva teksti", L.nm + " / " + sec.t + ": text[" + seen.get(k) +
             "] ja text[" + i + "] ovat sama lause: " + String(t).slice(0, 60));
      else seen.set(k, i);
    });
    /* Kuratoitu lause voi olla poimitun rivin SISALLA: kirjan bullet-lista
       ja sita seuraava virke tulevat poiminnasta usein yhtena rivina. */
    txt.forEach((t, i) => {
      const ki = textKey(t);
      if(ki.length < 60) return;
      txt.forEach((u, j) => {
        if(i === j) return;
        const kj = textKey(u);
        if(kj.length < 60 || kj === ki || DUP_OK.indexOf(kj) >= 0) return;
        checks++;
        if(ki.indexOf(kj) >= 0)
          fail("toistuva teksti", L.nm + " / " + sec.t + ": text[" + j +
               "] sisaltyy riviin text[" + i + "]: " + String(u).slice(0, 60));
      });
    });
  });
});

/* ------------------------------------------------------------------ raportti */
const byKind = {};
found.forEach(f => (byKind[f.kind] = byKind[f.kind] || []).push(f.msg));
Object.entries(byKind).sort((a, b) => b[1].length - a[1].length).forEach(([k, v]) => {
  console.log("\n== " + k + " (" + v.length + ") ==");
  v.slice(0, 12).forEach(m => console.log("   " + m));
  if(v.length > 12) console.log("   ... ja " + (v.length - 12) + " muuta");
});
if(orphanInfo.length){
  console.log("\n-- listoilta puuttuvat skenaariokohteet (odotettua, " +
              orphanInfo.length + " kpl) --");
  orphanInfo.forEach(x => console.log("   " + x));
}
console.log("\nAluksia " + Object.keys(SHIPS).length + ", listoja " + LISTS.length +
            ", tarkistuksia " + checks + ", loydoksia " + found.length);
process.exitCode = found.length ? 1 : 0;
