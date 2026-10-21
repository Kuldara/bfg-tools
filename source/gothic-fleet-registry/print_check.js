/* Tulostustarkistus: renderoi JOKAISEN laivastolistan taydet kortit
   sovelluksen omalla cardHTML():lla ja vertaa jokaista korttia profiiliin.

   Tarkistaa kortti kortilta:
     1  kaikki osiot ovat kortilla
     2  statsit vastaavat profiilia (nopeus, kaannos, kilvet, panssari, turretit)
     3  aseistusrivien maara ja nimet vastaavat profiilia
     4  jokaisella aseella on varikoodi ja kaari
     5  SPECIAL-lohkon saannot ovat kortilla, jos profiilissa on sellainen
     6  tahtiviittaus: jos saanto nimeaa aseen, seka saanto etta ase saavat tahden
     7  optiot ovat kortilla ja niiden hinnat nakyvat
     8  HIT-ruutuja on hits-arvon verran, escortilla squadron-ruudut
     9  kortilla ei ole undefined/NaN-arvoja

   Aja:  node print_check.js            yhteenveto
         node print_check.js -v         jokainen loydos
         node print_check.js Orks       vain listat joiden nimessa on 'Orks'
*/
const fs = require("fs");
const path = require("path");

const el = () => ({
  textContent: "", innerHTML: "", value: "", className: "", dataset: {},
  querySelectorAll: () => [], appendChild(){}, setAttribute(){}, getAttribute: () => "",
  style: {}, id: "", onclick: null, onchange: null, oninput: null
});
global.document = {
  getElementById: id => id === "bfgdata"
    ? { textContent: fs.readFileSync(path.join(__dirname, "bfg_data.json"), "utf8") }
    : el(),
  querySelector: () => el(), createElement: () => el(),
  head: { appendChild(){} }, body: { appendChild(){}, removeChild(){}, dataset: {} },
};
global.window = {}; global.navigator = {};
global.localStorage = { getItem: () => null, setItem(){} };
global.alert = () => {}; global.confirm = () => false;

const html = fs.readFileSync(path.join(__dirname, "Gothic Fleet Registry.html"), "utf8");
let js = html.split("<script>")[1].split("</script>")[0].replace(/^"use strict";/, "");
const api = new Function(js +
  "\n;return {DOMAIN,S,LISTS,SHIPS,cardHTML,unitCards,isEscort,hulls,optState,specialLines,wepKey,starredKeys,unitPts,shortStrength,shortWeaponName,shortShield,SPECIAL_WEAPON_RULES,SPECIAL_HULL_RULES,defMatches,defOptionMatches,fleetMatches,criticalModel,repairLine,applyRequired,effTurrets,armModel,upState,resolveUnit};")();
const { LISTS, SHIPS } = api;

const args = process.argv.slice(2);
const VERBOSE = args.includes("-v");
const filter = args.filter(a => a !== "-v")[0];

const strip = h => h.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ")
  .replace(/&amp;/g, "&").replace(/&ndash;/g, "-").replace(/\s+/g, " ").trim();
const norm = t => String(t == null ? "" : t)
  .replace(/ | /g, " ").replace(/\s+/g, " ").trim().toLowerCase();

const SECTIONS_CAP = ["DAMAGE", "LOADOUT / OPTIONS", "ARMAMENT",
                      "SPECIAL RULES / UPGRADES", "CRITICAL DAMAGE (2D6)", "NOTES / STATUS"];
const SECTIONS_ESC = ["SQUADRON STATE", "LOADOUT / OPTIONS", "ARMAMENT",
                      "SPECIAL RULES / UPGRADES", "SQUADRON HIT POINTS / MEMBERS",
                      "NOTES / STATUS"];
/* Kortti, joka vain PITAA useamman yksikon (maakohteet, Fleets s.517): kirja
   ei anna niille squadron-saantoa (Rulebook s.100 puhuu orbital defenceista
   ja aluksista, s.498 sanoo low orbit -puolustusten olevan "all ground-
   based"), joten kortilla ei ole squadron-sanaa. */
const SECTIONS_HELD = ["ON THIS CARD", "LOADOUT / OPTIONS", "ARMAMENT",
                       "SPECIAL RULES / UPGRADES", "HIT POINTS / MEMBERS",
                       "NOTES / STATUS"];
/* Tahtilinnake (Ramilies s.500, Fortress-Monastery s.110) tulostuu kahtena
   korttina. Fleets s.501: "The Ramilies star fort is so large that its
   weapons, hits and defences are divided up into four 'quadrants'" - siksi
   pohjakortilla on NELJA osumarataa ja neljanneksen aseet neljaan kertaan,
   Basilican aseet kerran keskella (s.500 BASILICA WEAPONS). Saantokortti on
   tavallinen kortti ilman vauriorataa: radat ovat parissa tasan kerran. */
const SECTIONS_FORT_RULES = ["LOADOUT / OPTIONS", "ARMAMENT", "SPECIAL RULES / UPGRADES",
                             "CRITICAL DAMAGE (2D6)", "NOTES / STATUS"];
const SECTIONS_FORT_PLAN = ["NORTH-WEST", "NORTH-EAST", "SOUTH-WEST", "SOUTH-EAST", "PIER N",
                            "BASILICA", "LEADERSHIP & ORDERS", "RE-ROLLS", "NOTES / STATUS"];
/* Sama jako kuin kortilla (app_template.html FORT_PLAN_SLOTS): naiden
   slotien saannot ovat pohjakortilla, kaikki muut saantokortilla. */
const FORT_PLAN_SLOTS = ["orders", "rerolls", "sectors", "boarding", "basilica"];

let cards = 0, bad = 0;
const found = [];
function fail(list, ship, msg) {
  bad++;
  found.push([list, ship, msg]);
}

LISTS.forEach((L, li) => {
  if (filter && !L.nm.toLowerCase().includes(filter.toLowerCase())) return;
  // koko lista kerralla: jokainen alusrivi yhtena yksikkona
  api.S.li = li; api.S.limit = 100000; api.S.units = [];
  L.secs.forEach((sec, si) => sec.ents.forEach((en, ei) => {
    if (!en.r || !SHIPS[String(en.r)]) return;
    const u = { s: si, e: ei, ref: en.r, n: 1, opts: [], os: {}, name: "" };
    api.applyRequired(u);      // pakolliset listamuutokset kuten oikeassa kaytossa
    api.S.units.push(u);
  }));
  /* Oletuskokoonpano on kelvollinen intent: ei yhtaan issue-rivia (P1-8e). */
  api.S.units.forEach(u => {
    const R = api.resolveUnit(u);
    ((R && R.issues) || []).forEach(x => fail(L.nm, String(u.ref || "cmd"), "oletuskokoonpanolla issue: " + x.code + " " + x.message.slice(0, 60)));
  });

  api.S.units.forEach(u => {
    const sh = SHIPS[String(u.ref)];
    /* Kortin laji tulee RATKAISTUSTA yksikosta (R.card), ei kirjan
       tyyppisanasta: yhden osuman puolustus on tyyppia Defence tai Ground ja
       silti laivuekortti (Rulebook s.100: "1HP defences grouped in up to six
       units"), tahtilinnake on kahden kortin pari (Fleets s.501) ja tulialus
       (s.516) on tyyppia Escort mutta saantokortti. Aiempi isEscort(u) luki
       tyyppisanan ja vaati platformilta capital-kortin osiot. */
    const kind = (api.resolveUnit(u) || {}).card;
    /* saantokortit (s.512, 513, 516) tarkistetaan omassa silmukassaan alla */
    if (kind === "rule") return;
    const esc = kind === "squadron";
    const fort = kind === "fort";
    if (esc) u.n = 3;
    const cs = api.unitCards(u).map(c => c.html("top"));
    /* cardHTML = yksikon ainoa kortti, linnakkeella saantokortti (se, jolla
       on statsit, loadout, aseistustaulukko ja saannot); pohjakortti on
       parin ensimmainen. */
    const h = api.cardHTML(u, "top");
    const plan = fort ? cs[0] : "";
    if (fort && (cs.length !== 2 || cs[1] !== h))
      fail(L.nm, "s." + sh.pg + " " + sh.nm, "linnakkeen kortteja " + cs.length + ", odotettu pari pohja + saanto");
    if (!fort && (cs.length !== 1 || cs[0] !== h))
      fail(L.nm, "s." + sh.pg + " " + sh.nm, "yksikon kortteja " + cs.length + ", odotettu 1");
    cards += cs.length;
    const txt = strip(h);
    /* Linnakkeen saannot jakautuvat kahdelle kortille: "saanto on kortilla"
       luetaan parista. */
    const txtAll = fort ? strip(cs.join("\n")) : txt;
    const ref = "s." + sh.pg + " " + sh.nm;
    /* J144: listan oman reserviosion Chaos-runko (Bastion s.39, Ordo Malleus
       s.142) ei ole listan oma alus - sama poikkeus kuin domainin
       foreignReserveRow: ei Mechanicus-lohkoja eika native-saantoja. */
    const foreignReserve = (L.secs[u.s] || {}).ct === "reserve" && /^CHAOS/i.test(String(sh.fl || "")) &&
      !/^Chaos/.test(L.nm);

    // 1 osiot. Critical-taulukon otsikko tulee ratkaisimen mallista, ei
    // vakiosta: faktioiden taulukot sattuivat sisaltamaan "CRITICAL DAMAGE
    // (2D6)" osajonona, orkkihulkin D6-taulukko ei (Fleets s.391).
    const Rk = api.resolveUnit(u) || {};
    const held = esc && !!(Rk.squadron && Rk.squadron.cardOnly);
    (fort ? SECTIONS_FORT_RULES : esc ? (held ? SECTIONS_HELD : SECTIONS_ESC) : SECTIONS_CAP).forEach(s => {
      const want = s === "CRITICAL DAMAGE (2D6)" ? api.criticalModel(sh).title : s;
      if (!txt.includes(want)) fail(L.nm, ref, "osio puuttuu: " + want);
    });
    if (fort) {
      const ptxt = strip(plan);
      SECTIONS_FORT_PLAN.forEach(s => {
        if (!ptxt.includes(s)) fail(L.nm, ref, "pohjakortilta puuttuu: " + s);
      });
      [plan, h].forEach((c, i) => {
        if (!/^<div class="k /.test(c)) fail(L.nm, ref, "linnakkeen kortti " + (i + 1) + " ei ala k-kehyksella");
        if (!/<div class="k-hd">[\s\S]*?<h3>[^<]+<\/h3>/.test(c)) fail(L.nm, ref, "linnakkeen kortilta " + (i + 1) + " puuttuu otsikko");
      });
    }
    /* Kiintea Leadership (profiilin dld): puolustuksen nimellinen 7 (Fleets
       s.499: "do not roll for leadership or have a leadership value ... on a
       nominal leadership of 7"), Fortress-Monasteryn 10 (s.111: "a base
       leadership of 10"). Kortti painaa arvon; kirjoitusruutu on vain
       heitettavalle Leadershipille (Ramilies s.503: "rolled as for a capital
       ship", muut alukset). */
    const ldFixed = '<span>LEADERSHIP</span><div class="v"><b>' + sh.dld + "</b>";
    /* the write-in box first; a ship's own re-roll boxes may follow it in
       the same cell (J168 c: Scion of Prospero) */
    const ldBlank = '<span>LEADERSHIP</span><div class="v"><i></i>';
    if (sh.dld != null && !h.includes(ldFixed))
      fail(L.nm, ref, "kiintea Leadership " + sh.dld + " ei ole LEADERSHIP-ruudussa");
    if (sh.dld == null && !h.includes(ldBlank))
      fail(L.nm, ref, "heitettavan Leadershipin kirjoitusruutu puuttuu");

    // 2 statsit
    // Lista voi muuttaa profiilia pakollisesti (AdMechin +1 turret), joten
    // kortilta odotetaan muutettua arvoa.
    [["speed", sh.sp], ["turns", sh.tn], ["shields", api.shortShield(sh.sh)],
     ["turrets", api.effTurrets(u, sh)]]
      .forEach(([k, v]) => {
        if (v && !norm(txt).includes(norm(v)))
          fail(L.nm, ref, "statsi " + k + "=" + JSON.stringify(v) + " ei nay kortilla");
      });
    // panssari lyhennetaan tarkoituksella
    const armNums = String(sh.ar).match(/\d\+/g);
    if (armNums && !norm(txt).includes(norm(armNums.join("/"))) &&
        !norm(txt).includes(norm(sh.ar)))
      fail(L.nm, ref, "panssari " + JSON.stringify(sh.ar) + " ei nay kortilla");

    // 10 kortin sisaiset ristiriidat (pistokoe 19, M13). Crippled-rivi ei saa
    // hidastaa alusta, jonka oma saanto sanoo ettei crippled hidasta (Fleets
    // s.197/393/492/495); saattajalla ei kriittisen osuman laukaisua
    // (Rulebook s.66); voimassa oleva Nova Cannon nakyy crippled-rivilla
    // (Rulebook s.65); Chaos-listan kortilla +1 boarding (Fleets s.222, ei
    // Activated Blackstone Fortressille, s.284 "It has no crew").
    const R0 = api.resolveUnit(u) || {};
    /* J168 c: aluksen omat re-rollit ruutuina kortilla, kuten komentajalla
       (Scion of Prosperon kaksi, s.258); linnakkeen ruudut ovat pohjakortilla */
    if (!fort) {
      const rrs = (R0.rerolls && R0.rerolls.boxes) || [];
      ["included", "bought", "optional"].forEach(k => {
        const n = h.split('<i class="rrb ' + k + '">').length - 1;
        if (n !== rrs.filter(x => x === k).length)
          fail(L.nm, ref, "aluskortin re-roll-ruutuja (" + k + ") " + n + " != " + rrs.filter(x => x === k).length);
      });
    }
    const crip = (R0.damage && R0.damage.note) || "";
    // Vain aluksen omat saannot: kortin Mechanicus Gifts -taulukossa on
    // valinnainen "Energy Reserves CRIPPLED ... not 50 %" -rivi.
    const rulesTxt = (R0.rules || []).map(x => String((x && x.t) || "")).join(" ");
    if (/Speed -5 cm/.test(crip) &&
        /crippl[^.]{0,80}\b(do not|does not|never|not)\b[^.]{0,40}(speed|slow)|not slowed[^.]{0,60}crippl/i.test(rulesTxt))
      fail(L.nm, ref, "crippled-rivi hidastaa, vaikka aluksen saanto sanoo ettei crippled hidasta");
    if (esc && /Every Hit causes critical damage/i.test(txt))
      fail(L.nm, ref, "saattajakortilla kriittisen osuman laukaisu");
    if (!esc && /^CRIPPLED:/.test(crip) && !/No Nova Cannon/.test(crip) &&
        (R0.weapons || []).some(w => w.state === "active" && /nova cannon/i.test(String((w.a || [])[0] || ""))))
      fail(L.nm, ref, "voimassa oleva Nova Cannon puuttuu crippled-rivilta");
    /* Planeettapuolustus (profiilin df) ostetaan Fleets s.499:n hintalistalta,
       ei Chaos-listan riveilta: asema, platformi tai monitori ei ole Chaos-alus,
       joten s.222:n "+1 in boarding actions" ei kuulu sen kortille ja domain
       jattaa sen oikein pois. Poikkeus koskee vain df-profiileja; jokainen
       Chaos-listan oma alus vaatii rivin yha. */
    /* Renegade-rungolla rivi on "+1 in boarding actions as a Chaos vessel"
       (s.222 kieltaa Chaos Space Marine -miehiston, joten chaos_core-rivin
       miehistolause ei kuulu sen kortille; pistokoe 2026-10-18/1). */
    if (/^Chaos\b/.test(L.nm) && !/BLACKSTONE/i.test(sh.nm) && !sh.df && !/\+1 in boarding actions/.test(txt))
      fail(L.nm, ref, "Chaosin +1 boarding puuttuu");
    if (/^Chaos\b/.test(L.nm) && sh.df && txtAll.includes("Chaos: +1 in boarding actions"))
      fail(L.nm, ref, "puolustuksen kortilla Chaos-listan +1 boarding (s.499: ei listan alus)");

    /* J145: tilastoruudun kirjoituslaatikko mahtuu vain lyhyen arvon viereen.
       Pitka arvo (Eldarin kolmiosainen nopeus s.302-305, "Special", save
       kilpien tilalla, neljannespanssari) valui laatikon alle, joten se
       tulostuu ilman laatikkoa - eika niihin kirjoiteta yhta lukua. */
    const stats = [...h.matchAll(/<div( class="nobox")?><span>([^<]*)<\/span><div class="v"><b>([^<]*)<\/b>/g)];
    stats.forEach(m => {
      const parts = (m[3].match(/\//g) || []).length >= 2, box = !m[1];
      if (parts === box)
        fail(L.nm, ref, "tilastoruutu " + m[2] + " = " + JSON.stringify(m[3]) +
             (parts ? ": kolmiosainen arvo, laatikko silti mukana" : ": yksi arvo, laatikko puuttuu"));
    });
    if (!stats.length) fail(L.nm, ref, "tilastorivia ei loytynyt kortilta");

    // 3+4 aseistus
    // Auki jatetty vaihto-optio nayttaa seka alkuperaisen etta korvaavan
    // rivin; sen kummankin pitaa olla taulukossa ja rastitettavissa.
    const swapRows = (sh.ol || []).reduce((a, o, i) =>
      a + (o.sw && api.optState(u, i) !== "off" ? o.sw.t.length : 0), 0);
    const gone = (sh.ol || []).reduce((a, o, i) =>
      a + (o.sw && api.optState(u, i) === "take" ? o.sw.f.length : 0), 0);
    // Lista voi tuoda pakollisen lisaaseen (AdMechin dorsal lance).
    const addRows = L.secs.reduce((a, sec, si) => a + sec.ents.reduce(
      (b, en, ei) => b + (en.k === "up" && en.add &&
        api.upState(u, si, ei) === "take" ? 1 : 0), 0), 0)
      // Aluksen oma optio voi tuoda rivin (rynnakkotorpedot, P1-3). Se on
      // kortilla "opt"-tilassa tyhjana ruutuna ja "take"-tilassa tikattuna;
      // vain "off" poistaa sen - sama saanto kuin armModel():ssa.
      // add voi olla yksi rivi tai lista riveja (Murder s.279: port- ja
      // starboard-lanssi), sama sopimus kuin armModel():ssa.
      + (sh.ol || []).reduce((a, o, i) =>
          a + (o.add && api.optState(u, i) !== "off"
               ? (Array.isArray(o.add[0]) ? o.add.length : 1) : 0), 0);
    // del poistaa nimeltaan tasmaavat rivit vain "take"-tilassa (Cobra s.84).
    const delRows = (sh.ol || []).reduce((a, o, i) =>
      a + (o.del && api.optState(u, i) === "take"
           ? sh.aw.filter(r => new RegExp(o.del, "i").test(String(r[0]))).length : 0), 0);
    // 30.9.2026: listan paivitysrivit avautuvat Optionina, joten listan oma
    // vaihto (orbital mines, looted lances, plasma-boosted...) tuo korvaavan
    // rivin OR-vaihtoehdoksi jokaiselle rivilleen, jota aluksen oma otettu
    // vaihto ei jo korvannut. Otettu listavaihto korvaa rivin: maara ennallaan.
    const shipGone = new Set();
    (sh.ol || []).forEach((o, i) => { if (o.sw && api.optState(u, i) === "take") o.sw.f.forEach(f => shipGone.add(f)); });
    const listAlt = L.secs.reduce((a, sec, si) => a + sec.ents.reduce((b, en, ei) => {
      // vain tarkoituksella Optioniksi asetettu: vastaamaton lista-vaihto on
      // pelkka LOADOUT-ruutu (domain weaponRows)
      if (en.k !== "up" || !en.swp || api.upState(u, si, ei) !== "opt" || !(u.ups && Object.prototype.hasOwnProperty.call(u.ups, si + ":" + ei))) return b;
      const rx = new RegExp(en.swp.f, "i");
      return b + sh.aw.filter((r, fi) => !shipGone.has(fi) && rx.test(String(r[0])) &&
        (!en.swp.onlyrg || String(r[1]).indexOf(en.swp.onlyrg) >= 0)).length;
    }, 0), 0);
    const wantRows = sh.aw.length - gone + swapRows + addRows - delRows + listAlt;
    const rows = (h.match(/<tr class="w(?: alt| ammo)?"/g) || []).length;
    if (rows !== wantRows)
      fail(L.nm, ref, "aserivien maara " + rows + " != odotettu " + wantRows);
    // Paikka, jonka vaihtoehdot on kaikki kaytetty (vaihto otettu), ei ole
    // enaa valinta: sen ainoa rivi tulostuu tavallisena (ei OR, ei ympyraa).
    const model = api.armModel(u, sh);
    const slotN = {};
    model.forEach(r => { if (r.grp) slotN[r.i] = (slotN[r.i] || 0) + 1; });
    const wantAlt = model.filter(r => r.alt && slotN[r.i] > 1).length;
    const altRows = (h.match(/<tr class="w alt"/g) || []).length;
    if (altRows !== wantAlt)
      fail(L.nm, ref, "vaihtoehtoisia aserivaja " + altRows + " != " + wantAlt);
    if (wantAlt) {
      // Ryhmassa on aina tasan yksi taytetty ympyra: joko perusrivi (kun
      // mitaan ei ole vaihdettu) tai se korvaaja joka on otettu.
      const groups = new Set(model.filter(r => r.grp && slotN[r.i] > 1).map(r => r.i));
      const marks = (h.match(/class="rb on"/g) || []).length;
      if (!/class="rb/.test(h))
        fail(L.nm, ref, "vaihtoehtoiselta aseistukselta puuttuu valintaympyra");
      else if (marks !== groups.size)
        fail(L.nm, ref, "taytettyja valintaympyroita " + marks +
             " != vaihtoehtoryhmia " + groups.size);
      if ((h.match(/<tbody class="g">/g) || []).length !== groups.size)
        fail(L.nm, ref, "vaihtoehtoryhmia ei ole kaaritty omaan tbodyyn");
    }
    sh.aw.forEach(a => {
      // Kortti lyhentaa nimen samalla tavalla kuin kantaman ja voiman,
      // joten odotusarvo on lyhennetty nimi - ei alkuperainen.
      const printedName = api.shortWeaponName(a[0]);
      if (printedName && !norm(txt).includes(norm(printedName)))
        fail(L.nm, ref, "ase puuttuu kortilta: " + a[0]);
      if (/\bsquadrons?\b/i.test(api.shortStrength(a[2])))
        fail(L.nm, ref, "STR/FP-sarakkeeseen jai pitka squadron-sana: " + a[2]);
    });
    const badges = (h.match(/class="bg" style="--bd:#[0-9A-F]{6}"/gi) || []).length;
    if (badges !== wantRows)
      fail(L.nm, ref, "varikoodeja " + badges + " != aserivien " + wantRows);
    // Kaari on kuva, joten sen todiste on data-arc-attribuutti. Jokaisella
    // rivilla on oltava se, ja jokaisen kaaren on tuotettava joko ruusuke
    // tai viiva - tyhja solu tarkoittaisi kadonnutta tietoa.
    const arcCells = (h.match(/<td class="ar" data-arc="[^"]*"/g) || []).length;
    if (arcCells !== wantRows)
      fail(L.nm, ref, "kaarisoluja " + arcCells + " != aserivien " + wantRows);
    const arcMarks = (h.match(/class="arcg"|class="noarc"/g) || []).length;
    if (arcMarks !== wantRows)
      fail(L.nm, ref, "kaarimerkkeja " + arcMarks + " != aserivien " + wantRows);

    /* J147: "Capacity: 1 Orca/Warden" kapeassa Str/FP-sarakkeessa katkesi
       kesken sanan. Sarakkeessa on nyt luku ja mita se kantaa, ilman
       "Cap."-etuliitetta. */
    if (/\bCap\./.test(txt))
      fail(L.nm, ref, "aseen vahvuudessa lukee yha Cap.");

    // 5 special. Linnakkeella saannot ovat parin kahdella kortilla (txtAll).
    if ((sh.sr || "").trim().length > 20) {
      const first = norm(sh.sr).replace(/^[•\s]+/, "").slice(0, 40);
      if (first && !norm(txtAll).includes(first))
        fail(L.nm, ref, "SPECIAL-saanto ei nay kortilla: " + first.slice(0, 50));
    }
    /* Portti saa rivin (secs[u.s].ents[u.e]) kuten kortin oma polku: osiokohtainen saanto
       (sec / notSec) ratkeaa vain rivista. */
    api.SPECIAL_HULL_RULES.filter(d => api.DOMAIN.fleetMatches(d, sh, L, L.secs[u.s].ents[u.e]) && !(d.native && foreignReserve)).forEach(d => {
      const first = norm(d.text).slice(0, 42);
      if (!norm(txtAll).includes(first))
        fail(L.nm, ref, "laivaston yleissaanto puuttuu SPECIAL-osiosta: " + d.id);
    });
    /* Jokainen ratkaistun yksikon saanto ja vauriohuomautus on kortilla - ja
       linnakkeella tasan yhdella parin korteista: pohjakortin slotit
       pohjakortilla, kaikki muu saantokortilla (Fleets s.501-505, s.111). */
    (R0.rules || []).forEach(x => {
      const first = norm(String(x.t || "").replace(/^\*\s*/, "")).slice(0, 42);
      if (!first) return;
      /* Lyhyt saantolista (R.brief, space hulkit; kayttaja 9.10.2026: "ei
         sinne tarvi kuin HULK kohtaiset erikois ohjeet. ei perus aseiden
         ohjeita"): perusaseen saanto (rules[].weapon) EI saa olla kortilla. */
      if (R0.brief && x.weapon) {
        if (norm(txt).includes(first)) fail(L.nm, ref, "perusaseen saanto lyhyen saantolistan kortilla: " + first);
        return;
      }
      if (!fort) {
        if (!norm(txt).includes(first)) fail(L.nm, ref, "ratkaistun yksikon saanto puuttuu kortilta: " + first);
        return;
      }
      const onPlan = norm(strip(plan)).includes(first), onRules = norm(txt).includes(first);
      const wantPlan = FORT_PLAN_SLOTS.indexOf(x.slot) >= 0;
      if (onPlan !== wantPlan || onRules === wantPlan)
        fail(L.nm, ref, "linnakkeen saanto vaaralla kortilla (slot " + (x.slot || "-") + "): pohja=" + onPlan + " saanto=" + onRules + " " + first);
    });
    if (R0.damage && R0.damage.note && !norm(txtAll).includes(norm(R0.damage.note).slice(0, 42)))
      fail(L.nm, ref, "vauriohuomautus puuttuu kortilta");

    // 6 tahtiviittaus: laske tahdet erikseen taulukosta ja loadoutista,
    //   muuten sama regex osuu molempiin ja vertailu on merkityksetön
    const rules = api.specialLines(sh);
    const starred = api.starredKeys(rules, sh);
    const armTbl = (h.match(/<table class="k-arm"[\s\S]*?<\/table>/) || [""])[0];
    const loadout = (h.split("LOADOUT / OPTIONS")[1] || "").split("ARMAMENT")[0];
    const special = (h.split("SPECIAL RULES / UPGRADES")[1] || "").split("CRITICAL DAMAGE")[0]
      .split("SQUADRON HIT POINTS")[0];
    const ids = part => [...part.matchAll(/<b class="ast"[^>]*data-rule="([^"]+)"[^>]*>\*<\/b>/g)]
      .map(m => m[1]);
    const armIds = ids(armTbl), ruleIds = ids(special), optIds = ids(loadout);
    const wantedIds = Object.values(starred).flat().map(r => r.id);
    /* Lyhyella saantolistalla aseen tahti nakyy vain, jos sen saanto on
       kortilla (ostettu optio tai paivitys): tahtea ei vaadita, mutta
       jokaisella nakyvalla tahdella on yha oltava saantonsa (alla). */
    (R0.brief ? [] : wantedIds).forEach(id => {
      if (!armIds.includes(id))
        fail(L.nm, ref, "aseen varillinen tahti puuttuu: " + id);
      if (!ruleIds.includes(id))
        fail(L.nm, ref, "aseen tahdelta puuttuu SPECIAL-vastinpari: " + id);
    });
    armIds.forEach(id => {
      if (!ruleIds.includes(id))
        fail(L.nm, ref, "ase merkitty tahdella ilman samanvarista SPECIAL-saantoa: " + id);
    });
    /* Linnakkeen pohjakortti toistaa aserivit (neljannes x 4, Basilica x 1):
       sama tahti kuin saantokortin taulukossa, ja jokaisella pohjakortin
       tahdella on saantonsa parin saantokortilla. */
    if (fort) {
      const planIds = ids(plan);
      armIds.forEach(id => {
        if (!planIds.includes(id)) fail(L.nm, ref, "pohjakortin aserivilta puuttuu tahti: " + id);
      });
      planIds.forEach(id => {
        if (!ruleIds.includes(id)) fail(L.nm, ref, "pohjakortin tahdella ei ole saantoa saantokortilla: " + id);
      });
    }

    // Jokainen kasikirjaan kirjattu erikoisasetyyppi saa seka aseen etta
    // SPECIAL-rivin tahden. Tavallinen akku/lanssi ei tarvitse tahtea.
    sh.aw.forEach((a, i) => {
      const defs = R0.brief ? [] : api.SPECIAL_WEAPON_RULES.filter(d => api.defMatches(d, sh, a));
      defs.forEach(d => {
        if (!armIds.includes(d.id)) fail(L.nm, ref, "erikoisase ilman tahtiviitetta: " + a[0] + " -> " + d.id);
        if (!ruleIds.includes(d.id)) fail(L.nm, ref, "erikoisase ilman saantorivia: " + a[0] + " -> " + d.id);
      });
    });
    // Listarivi voi kieltaa aluksen omat optiot kokonaan (RT Exploration
    // s.180, en.noopt): silloin kortilla ei ole optioita eika niiden tahtia.
    const enRow = L.secs[u.s] && L.secs[u.s].ents[u.e];
    const noopt = !!(enRow && enRow.noopt);
    // Listarivi voi kieltaa yksittaisen option (en.optno: Mechanicus ei kayta
    // assault boateja, s.125): se ei ole kortilla.
    const optno = enRow && enRow.optno ? new RegExp(enRow.optno, "i") : null;
    const shownOl = noopt ? [] : (sh.ol || []).filter(o => !(optno && optno.test(o.t)));
    if (optno && (sh.ol || []).some(o => optno.test(o.t) && norm(txt).includes(norm(o.t).slice(0, 30))))
      fail(L.nm, ref, "listan kieltama optio nakyy kortilla");
    shownOl.forEach(o => {
      const defs = api.SPECIAL_WEAPON_RULES.filter(d => api.defOptionMatches(d, sh, o));
      defs.forEach(d => {
        if (R0.brief) return;   /* avoimen option saanto ei ole lyhyella listalla */
        if (!optIds.includes(d.id)) fail(L.nm, ref, "erikoisaseoption tahtiviite puuttuu: " + o.t + " -> " + d.id);
        if (!ruleIds.includes(d.id)) fail(L.nm, ref, "erikoisaseoptiolta puuttuu saantorivi: " + o.t + " -> " + d.id);
      });
      if (/torpedo[- ]?bomma/i.test(o.t)) {
        if (!defs.some(d => d.id === "ork_torpedo_bomma"))
          fail(L.nm, ref, "Torpedo-Bomma-optio ei saanut omaa erikoissaantoaan");
        if (defs.some(d => d.id === "ork_torpedo"))
          fail(L.nm, ref, "Torpedo-Bomma sekoittui Ork Torpedo Launcha -saantoon");
      }
    });

    // 7 optiot
    shownOl.forEach(o => {
      const head = norm(o.t).slice(0, 30);
      if (head && !norm(txt).includes(head))
        fail(L.nm, ref, "optio puuttuu kortilta: " + o.t.slice(0, 45));
    });
    if (noopt && /Can replace|may be upgraded|may take/i.test(txt) &&
        (sh.ol || []).some(o => norm(txt).includes(norm(o.t).slice(0, 30))))
      fail(L.nm, ref, "noopt-rivilla optio nakyy silti kortilla");
    // sama luku kuin kortilla: aluksen optiot, listan paivitykset ja muistiinpano
    const ups0 = R0.upgrades || [];
    const optCount = (R0.options || []).filter(o => o.state !== "off").length +
      ups0.filter(x => x.state === "take" || (x.state === "opt" && x.required)).length +
      Math.ceil(ups0.filter(x => x.state === "opt" && !x.required).length / 5) + ((R0.note || "").trim() ? 1 : 0);
    const wantMode = optCount >= 9 ? "opt-overflow" :
                     optCount >= 7 ? "opt-dense" :
                     optCount >= 5 ? "opt-compact" : "";
    if (wantMode && !h.includes(wantMode))
      fail(L.nm, ref, "pitka optiolista ei saanut tiivistysluokkaa " + wantMode);
    if (!h.includes('class="k-bd k-optbox"><div class="k-opt-list fit-content">'))
      fail(L.nm, ref, "optioiden erillinen ylivuotosovitus puuttuu");

    // 8 ruudut
    if (!esc) {
      /* Fleets s.501: linnakkeen osumat ovat neljanneskohtaiset - neljannes
         kantaa profiilin hits-arvon (12) ja neljanneksia on nelja, joten
         ratoja on nelja ja ne ovat pohjakortilla. Saantokortilla ei ole
         rataa: parissa ne ovat tasan kerran. Muilla aluksilla yksi rata. */
      const hitSrc = fort ? plan : h, tracks = fort ? 4 : 1;
      if (fort && /class="k-hits/.test(h))
        fail(L.nm, ref, "linnakkeen saantokortilla on vauriorata, vaikka radat ovat pohjakortilla");
      // Vain vahinkokaistoista: `<i>numero</i>` osuu muuten myos Gifts of
      // the Omnissiah -lohkon numeroympyroihin.
      const bands = hitSrc.match(/<div class="k-hits(?: cr)?">[\s\S]*?<\/div>/g) || [];
      const boxes = bands.reduce(
        (a, b) => a + (b.match(/<i>\d+<\/i>/g) || []).length, 0);
      if (sh.hp && boxes !== sh.hp * tracks)
        fail(L.nm, ref, "HIT-ruutuja " + boxes + " != hits " + sh.hp + (fort ? " x 4 neljannesta" : ""));
      if (fort) {
        /* Neljanneksen aseet neljaan kertaan, Basilican aseet kerran
           (s.500 QUADRANT WEAPONS / BASILICA WEAPONS; s.110). Ryhma on
           ratkaisimen kentta (zone), jonka golden weapon_zones lukitsee. */
        const act = (R0.weapons || []).filter(w => w.state !== "hidden");
        const nq = act.filter(w => w.zone === "quadrant").length;
        const nb = act.filter(w => w.zone === "basilica").length;
        if (nq + nb !== act.length || !nq || !nb)
          fail(L.nm, ref, "linnakkeen aseriveilla ei ole ryhmaa: quadrant " + nq + ", basilica " + nb + ", riveja " + act.length);
        const prow = (plan.match(/<tr style="--rw:#[0-9A-F]{6}">/gi) || []).length;
        if (prow !== nq * 4 + nb)
          fail(L.nm, ref, "pohjakortin aseriveja " + prow + " != " + nq + " x 4 + " + nb);
        const pbadge = (plan.match(/class="bg" style="--bd:#[0-9A-F]{6}"/gi) || []).length;
        if (pbadge !== prow) fail(L.nm, ref, "pohjakortin varikoodeja " + pbadge + " != riveja " + prow);
        const ptxt = norm(strip(plan));
        const wantByName = {};
        act.forEach(w => {
          const key = api.shortWeaponName(w.a[0]);
          wantByName[key] = (wantByName[key] || 0) + (w.zone === "basilica" ? 1 : 4);
          /* kantama kokonaan: prototyyppi pudotti launch bayn toisen arvon
             ("Fighters: 30 cm / Bombers: 20 cm" -> "30 cm") */
          String(w.a[1] || "").split(" / ").forEach(part => {
            if (part && /\d/.test(part) && !ptxt.includes(norm(part)))
              fail(L.nm, ref, "pohjakortin aserivilta puuttuu kantaman osa: " + part);
          });
        });
        Object.keys(wantByName).forEach(key => {
          const got = plan.split(">" + key + "</td>").length - 1;
          if (got !== wantByName[key])
            fail(L.nm, ref, "ase pohjakortilla " + got + " kertaa, odotettu " + wantByName[key] + ": " + key);
        });
        const quads = (plan.match(/data-quadrant="(?:NW|NE|SW|SE)"/g) || []).length;
        if (quads !== 4) fail(L.nm, ref, "pohjakortilla neljanneksia " + quads + " != 4");
        /* re-roll-ruudut: ratkaistun yksikon ruudut sellaisenaan (Ramilies
           s.503 yksi hintaan sisaltyva; Fortress-Monastery s.111 ostettavat) */
        const rrb = (R0.rerolls && R0.rerolls.boxes) || [];
        ["included", "bought", "optional"].forEach(k => {
          const n = plan.split('<i class="rrb ' + k + '">').length - 1;
          if (n !== rrb.filter(x => x === k).length)
            fail(L.nm, ref, "pohjakortin re-roll-ruutuja (" + k + ") " + n + " != " + rrb.filter(x => x === k).length);
        });
        /* kriittiset: jokaisen tuloksen numero ja nimi ovat parissa (s.505);
           rastiruutu neljanneksessa tai Basilicassa, tai tulos on kerralla
           tehtava vaurio (8 Hull breach +D3, 12 Reactor struck +D6) */
        const cmF = api.criticalModel(sh);
        cmF.rows.forEach(c => {
          if (!norm(txt).includes(norm(c[0] + " " + c[1])))
            fail(L.nm, ref, "kriittinen tulos puuttuu saantokortin taulukosta: " + c[0] + " " + c[1]);
        });
        const ticks = (plan.match(/<span><i><\/i><u><b>/g) || []).length;
        const perQuad = cmF.rows.filter(c => ["8", "9"].indexOf(String(c[0])) < 0).length;
        if (ticks !== perQuad * 4 + 2)
          fail(L.nm, ref, "pohjakortin kriittisruutuja " + ticks + " != " + perQuad + " x 4 + 2 (9 ja 11 Basilicassa)");
        if (/class="tk"/.test(h))
          fail(L.nm, ref, "saantokortin critical-taulukossa rastiruutuja, vaikka ne ovat pohjakortilla");
      }
      // Ruudut ovat kahtena kaistana: ehjat ja crippled. Rulebook v1.10
      // s.65: "A ship which loses half its damage points is crippled", ja
      // kirjan esimerkki sanoo 8 osuman Lunarin crippleytyvan NELJANNESTA
      // pisteesta. Raja on siis ceil(hp/2). Tama testi odotti aiemmin
      // floor(hp/2)+1, joka on oikein vain parittomilla runkoluvuilla.
      const crBox = Math.ceil((sh.hp || 0) / 2);
      // Fleets s.391: space hulkit eivat crippleydy, joten kaistaa ei ole.
      // Fleets s.501: tahtilinnakkeen statsirivi on neljanneskohtainen.
      if (sh.qd && !h.includes("PER QUADRANT"))
        fail(L.nm, ref, "quadrant-alukselta puuttuu neljannesmerkinta kortilta");
      // Fleets s.391 (Ork) ja s.288 (Chaos): kummallakin hulkilla on oma
      // D6-taulukko, korjauskielto ja saantosivut, joita profiilisivu ei
      // sisalla. Ensimmainen versio vartioi vain orkkia, koska Chaos-hulkin
      // s.288 jai lukematta - tulostettu kortti paljasti sen.
      if (/\bHULK\b/i.test(String(sh.nm || ""))) {
        const chaos = /\bCHAOS\b/i.test(String(sh.nm || ""));
        const want = chaos ? "CHAOS SPACE HULK CRITICAL" : "ORK HULK CRITICAL";
        if (!h.includes(want))
          fail(L.nm, ref, "hulkilta puuttuu oma critical-taulukko: " + want);
        if (h.includes("CRITICAL DAMAGE (2D6)"))
          fail(L.nm, ref, "hulkilla on yleinen 2D6-taulukko");
        if (!/cannot repair/i.test(h))
          fail(L.nm, ref, "hulkilta puuttuu korjauskielto");
        if (!/exactly 10 cm/.test(h))
          fail(L.nm, ref, "hulkilta puuttuu liikesaanto (Fleets pp. 287/390)");
        if (chaos && !/twice as many attack craft/.test(h))
          fail(L.nm, ref, "Chaos-hulkilta puuttuu 2x attack craft (s.287)");
        if (!chaos && !/always Leadership 6/.test(h))
          fail(L.nm, ref, "orkkihulkilta puuttuu Ld 6 (s.390)");
      }
      const hulk = /\bhulk\b/i.test(String(sh.nm || ""));
      if (hulk) {
        if (h.includes('class="k-hits cr"'))
          fail(L.nm, ref, "hulkilla on crippled-kaista, vaikka se ei crippleydy");
        if (!h.includes("NOT CRIPPLED"))
          fail(L.nm, ref, "hulkin kortilta puuttuu maininta ettei se crippleydy");
      } else if (sh.hp && crBox >= 2 && crBox <= sh.hp) {
        /* Linnakkeella kaista on jokaisella neljalla radalla: Fleets s.501
           "Quadrants are crippled individually once they are reduced to 6
           Damage Points" - 12 osumasta, eli ruudusta 6 (ceil(12/2)). */
        const crBands = hitSrc.match(/<div class="k-hits cr">([\s\S]*?)<\/div>/g) || [];
        if (crBands.length !== tracks)
          fail(L.nm, ref, "crippled-kaistoja " + crBands.length + " != " + tracks);
        const band = (hitSrc.match(/<div class="k-hits cr">([\s\S]*?)<\/div>/) || [, ""])[1];
        const crBoxes = (band.match(/<i>\d+<\/i>/g) || []).length;
        if (crBoxes !== sh.hp - crBox + 1)
          fail(L.nm, ref, "crippled-kaistalla " + crBoxes + " ruutua, odotettu " +
               (sh.hp - crBox + 1));
        crBands.forEach(b => {
          if ((b.match(/<i>\d+<\/i>/g) || []).length !== sh.hp - crBox + 1 || !b.includes("<i>" + crBox + "</i>"))
            fail(L.nm, ref, "crippled-kaista ei ala ruudusta " + crBox + " tai on vaaran mittainen");
        });
        if (hitSrc.split("CRIPPLED <em>from box " + crBox + "</em>").length - 1 !== tracks)
          fail(L.nm, ref, "crippled-kaistan otsikko ei kerro aloitusruutua");
        // Kirjan oma esimerkki lukittuna: 8 osumaa -> ruutu 4.
        if (sh.hp === 8 && crBox !== 4)
          fail(L.nm, ref, "8 osuman aluksen crippled-raja ei ole ruutu 4");
      }
      const ctx = String(sh.fl || "") + " " + String(sh.nm || "");
      const cm = api.criticalModel(sh);
      if (/TYRANID/i.test(ctx) && (!txt.includes(cm.title) || !txt.includes("SPORES OFF")))
        fail(L.nm, ref, "Tyranid-alukselta puuttuu Tyranid critical table");
      if (/NECRON/i.test(ctx) && (!txt.includes(cm.title) || !txt.includes("COMMAND CORE") ||
          !/4\+ = 1 crit/.test(txt)))
        fail(L.nm, ref, "Necron-alukselta puuttuu Necron critical/repair table");
      /* Gifts of the Omnissiah: kaikki kuusi jokaisella Mechanicus-capitalilla,
         ei koskaan listan Imperial Navy -escorteilla. */
      /* J217: Demiurg-palkkasoturi (s.483) on Demiurg-alus myos Mechanicus-
         laivastossa - sama poikkeus kuin domainin isMechanicusVessel. */
      const isDemiurg = /^DEMIURG$/i.test(String(sh.fl || ""));
      if (/Mechanicus/i.test(L.nm) && isDemiurg && (txtAll.includes("GIFTS OF THE OMNISSIAH") || txtAll.includes("ALL ADMECH")))
        fail(L.nm, ref, "Demiurg-palkkasoturin kortilla Mechanicus-lohko (s.483: Demiurg-alus)");
      const isAdMechList = /Mechanicus/i.test(L.nm) && !foreignReserve && !isDemiurg;
      const isEscortShip = /escort/i.test(sh.ty || "");
      /* s.126: the Omnissiah's Victory "cannot take any refits (from the
         Mechanicus Gifts table or from elsewhere)" - no Gifts block, but it
         is still a Mechanicus vessel for the repair bonus. */
      const noGifts = /omnissiah.s victory/i.test(sh.nm || "");
      /* Planeettapuolustus (profiilin df) Explorator-listan lopussa ei ole
         Mechanicus-alus: se ostetaan Fleets s.499:n hintalistalta, ja
         s.118-120 antavat Gifts-taulukon, +1 tornin ja korjausbonuksen listan
         omille capital shipeille ("Mechanicus capital ships must also roll
         ..."). Domain jattaa ne puolustukselta oikein pois; kortilla ei saa
         olla Gifts-lohkoa eika REPAIR +1D6 -rivia. Poikkeus koskee vain
         df-profiileja. */
      const isDefence = !!sh.df;
      if (isAdMechList && isDefence && (txtAll.includes("GIFTS OF THE OMNISSIAH") || txtAll.includes("ALL ADMECH")))
        fail(L.nm, ref, "puolustuksen kortilla Mechanicus-lohko (s.499: ei listan alus)");
      if (isAdMechList && !isEscortShip && !noGifts && !isDefence) {
        if (!txt.includes("GIFTS OF THE OMNISSIAH"))
          fail(L.nm, ref, "AdMech-capitalilta puuttuu Gifts-lohko");
        ["Energy Reserves", "Advanced Engines", "Repulsor Shielding",
         "Fleet Defence Turrets", "Targeting Matrix", "Weapon Relays"].forEach(g => {
          if (!txt.includes(g)) fail(L.nm, ref, "Gifts-lohkosta puuttuu: " + g);
        });
      }
      if (isAdMechList && !isEscortShip && !isDefence && !txt.includes("ALL ADMECH: REPAIR +1D6"))
        fail(L.nm, ref, "AdMechilta puuttuu REPAIR +1D6 -poikkeama");
      if (isAdMechList && (isEscortShip || noGifts) && txt.includes("GIFTS OF THE OMNISSIAH"))
        fail(L.nm, ref, noGifts ? "Omnissiah's Victorylla ei saa olla Gifts-lohkoa (s.126)"
                                : "escortilla ei saa olla Gifts-lohkoa");

      /* Vakiolaukaisin siirtyi otsikkoriville; se ei saa enaa olla saantorivina. */
      if (txt.includes("A hit that gets through the shields"))
        fail(L.nm, ref, "vanha vakiolause yha erikoissaantona");
      if (!/(through shields|every Hit): 6|4\+/.test(txt))
        fail(L.nm, ref, "kriittisen laukaisuvihje puuttuu otsikkorivilta");

      /* Haven Space Station (Fleets s.334) on Eldarin runko, mutta ei Eldar-
         alus naissa kahdessa asiassa: s.336 "armour 5+ and take critical
         damage on a 5+" (Eldar-aluksilla 4+, s.305) ja s.337 sen oma
         CRITICAL HITS TABLE (Infinity Circuit, Pulsar Lances, Polarization
         Field ...). Tarkistin vaati silta Eldar-alusten 4+:n; odotus on nyt
         Havenin oma kynnys ja oma taulukko. Holofields-rivi on kummassakin
         taulukossa. */
      const haven = /^HAVEN\b/i.test(String(sh.nm || ""));
      if (haven && (!txt.includes(cm.title) || !/HAVEN/.test(cm.title) || !txt.includes("HOLOFIELDS") ||
                    !txt.includes("INFINITY CIRCUIT") || !txt.includes("critical damage on 5+") ||
                    !/every Hit: 5\+/.test(txt) || txt.includes("critical damage on 4+")))
        fail(L.nm, ref, "Havenilta puuttuu oma critical-taulukko tai 5+ -kynnys (s.336-337)");
      if (/^ELDAR\b/i.test(String(sh.fl || "")) && !haven &&
          (!txt.includes(cm.title) || !txt.includes("HOLOFIELDS") || !txt.includes("critical damage on 4+")))
        fail(L.nm, ref, "Eldar-alukselta puuttuu Eldar critical table");
      if (/DARK ELDAR/i.test(ctx) &&
          (!txt.includes(cm.title) || !txt.includes("SHADOWFIELDS") || !txt.includes("Dark Eldar table")))
        fail(L.nm, ref, "Dark Eldar -alukselta puuttuu Dark Eldar critical table");
    } else {
      /* Jasenruutuja on vahintaan kuusi, tai kortin oma katto jos se on
         pienempi: Fleets s.499 "0-4 Air bases" - kortti pitaa enintaan
         nelja. Laivueen koko tai kortin katto sanotaan otsikossa: kirjan
         nimeama laivue "squadron min-max" (escortit listan saannosta,
         yhden osuman puolustukset Rulebook s.100 "up to six units"), pelkka
         kortin katto "up to N per card" ilman squadron-sanaa. */
      const sq = Rk.squadron || {};
      const wantSlots = Math.max(Math.min(6, sq.max || 6), 3);
      const slots = (h.match(/<div class="(gh)?"><em>/g) || []).length;
      if (slots !== wantSlots) fail(L.nm, ref, "squadron-ruutuja " + slots + " != " + wantSlots);
      const live = (h.match(/<div class=""><em>/g) || []).length;
      if (live !== 3) fail(L.nm, ref, "ostettujen jasenten ruutuja " + live + " != 3");
      if (held) {
        if (!txt.includes("up to " + sq.max + " per card"))
          fail(L.nm, ref, "kortin katto 'up to " + sq.max + " per card' puuttuu");
        if (/SQUADRON|squadron \d/.test(txt))
          fail(L.nm, ref, "kortilla squadron-saanto yksikolle, jolle kirja ei sita anna (s.517)");
      } else {
        const m = txt.match(/squadron (\d+)\D(\d+)/);
        if (!m || +m[1] !== sq.min || +m[2] !== sq.max)
          fail(L.nm, ref, "laivueen koko ei ole kortilla: odotettu " + sq.min + "-" + sq.max);
      }
      if (/class="k-hits|class="k-crit"/.test(h))
        fail(L.nm, ref, "laivuekortilla vauriorata tai critical-taulukko");
      /* Planeettapuolustus ei ole Chaos- eika Mechanicus-alus (s.499), ja
         tyyppia Defence/Ground oleva yksikko ei ole escort: ei ESCORT-lausetta. */
      if (sh.df && !/escort/i.test(sh.ty || "") && /ESCORT:/.test(txt))
        fail(L.nm, ref, "Defence/Ground-tyypin kortilla escortin lause");
    }

    // 9 roskaa - jokaiselta yksikon kortilta
    ["undefined", "NaN", "[object", "null"].forEach(w => {
      if (cs.some(c => c.includes(w))) fail(L.nm, ref, "kortilla esiintyy " + w);
    });
  });
});

/* ------------------------------------------------- saantokortit ----
   Orbital mine (Fleets s.512), Minefield (s.513) ja Fire ship (s.516) ovat
   saantoja, eivat profiileja: kortti on ratkaistun yksikon ruleCard - johdanto,
   numeroidut vaiheet ja kirjausruudut. Kaksi ensimmaista ovat rivejä ilman
   runkoa, joita ylla oleva silmukka ei kay lapi lainkaan; tulialus on alus,
   joka saa saman kortin statsirivilla. Jokaiselle: kortti ei ole tyhja, ei
   roskaa, jokainen vaiheen otsikko ja teksti on kortilla, ja kirjausruutuja
   on ostettujen maara. */
let ruleCards = 0;
LISTS.forEach((L, li) => {
  if (filter && !L.nm.toLowerCase().includes(filter.toLowerCase())) return;
  api.S.li = li; api.S.limit = 100000;
  L.secs.forEach((sec, si) => sec.ents.forEach((en, ei) => {
    if (en.k === "up" || en.k === "cmd") return;
    if (en.r && !SHIPS[String(en.r)]) return;
    const N = 3;
    const u = { s: si, e: ei, ref: en.r || null, n: N, opts: [], os: {}, name: "" };
    api.S.units = [u];
    api.applyRequired(u);
    const R = api.resolveUnit(u) || {};
    const ref = "s." + (en.src_page || "?") + " " + en.l;
    /* rivi ilman runkoa, joka ei ole komentaja: sen on oltava saantokortti,
       muuten pelaaja maksaa rivista, josta ei tulostu mitaan */
    if (!en.r && R.card !== "rule") { fail(L.nm, ref, "rungoton rivi ilman saantokorttia (card=" + R.card + ")"); return; }
    if (R.card !== "rule") return;
    const rc = R.ruleCard;
    if (!rc) { fail(L.nm, ref, "saantokortin sisalto (ruleCard) puuttuu ratkaistusta yksikosta"); return; }
    let cs = [];
    try { cs = api.unitCards(u).map(c => c.html("top")); }
    catch (e) { fail(L.nm, ref, "saantokortti heitti: " + e.message); return; }
    if (cs.length !== 1 || cs[0] !== api.cardHTML(u, "top")) { fail(L.nm, ref, "saantokortteja " + cs.length + ", odotettu 1"); return; }
    const h = cs[0], txt = norm(strip(h).replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">"));
    ruleCards++;
    if (h.length < 400 || !/^<div class="k /.test(h)) fail(L.nm, ref, "saantokortti jai tyhjaksi tai ilman k-kehysta");
    ["undefined", "NaN", "[object", "null"].forEach(w => {
      if (h.includes(w)) fail(L.nm, ref, "saantokortilla esiintyy " + w);
    });
    if (!/<div class="k-hd">[\s\S]*?<h3>[^<]+<\/h3>/.test(h)) fail(L.nm, ref, "saantokortilta puuttuu otsikko");
    if (!txt.includes(norm(rc.title))) fail(L.nm, ref, "saantokortilta puuttuu nimi: " + rc.title);
    if (!txt.includes("pg. " + rc.page)) fail(L.nm, ref, "saantokortilta puuttuu sivuviite pg. " + rc.page);
    if (rc.lead && !txt.includes(norm(rc.lead))) fail(L.nm, ref, "saantokortilta puuttuu johdanto");
    (rc.steps || []).forEach((s, i) => {
      if (!txt.includes(norm(s.h))) fail(L.nm, ref, "vaiheen " + (i + 1) + " otsikko puuttuu: " + s.h);
      if (!txt.includes(norm(s.t))) fail(L.nm, ref, "vaiheen " + (i + 1) + " teksti puuttuu: " + s.t.slice(0, 40));
    });
    const stepNos = (h.match(/<div class="rstep"><b>\d+<\/b>/g) || []).length;
    if (stepNos !== (rc.steps || []).length) fail(L.nm, ref, "numeroituja vaiheita " + stepNos + " != " + (rc.steps || []).length);
    /* hinta sanoin: kappalehinta ja ostettujen maara (s.499:n hintarivi) */
    if (en.p != null && !txt.includes(N + " bought") ) fail(L.nm, ref, "ostettujen maara puuttuu kortilta");
    if (en.p != null && !txt.includes(en.p + " pts each")) fail(L.nm, ref, "kappalehinta puuttuu kortilta");
    if (en.p != null && !new RegExp('<span>PTS</span><i>' + (en.p * N) + "</i>").test(h))
      fail(L.nm, ref, "PTS-ruudussa ei ole " + (en.p * N));
    /* rivin oma raja (s.499: "0-2 Minefields", "0-6 Fire ships") */
    if (en.mx != null && !new RegExp("0\\D" + en.mx + " per fleet").test(txt))
      fail(L.nm, ref, "rivin raja 0-" + en.mx + " puuttuu kortilta");
    /* kirjausruudut = ostettujen maara */
    const kind = rc.track && rc.track.kind;
    const ticks = h.split('<i class="rtk"></i>').length - 1;
    const sizes = h.split('<i class="rwr"></i>').length - 1;
    const members = (h.match(/<div class=""><em>/g) || []).length;
    if (R.squadron) {
      if (members !== N) fail(L.nm, ref, "jasenruutuja " + members + " != ostettuja " + N);
    } else if (kind === "size") {
      /* s.513: "D3 x 5 cm by D3 x 5 cm" - kaksi kirjoitusruutua per kentta */
      if (sizes !== 2 * N || ticks) fail(L.nm, ref, "kokoruutuja " + sizes + " != 2 x " + N);
    } else if (ticks !== N) fail(L.nm, ref, "rastiruutuja " + ticks + " != ostettuja " + N);
    /* alus (tulialus): statsirivi profiilista, kiintea Ld, omat saannot, ei aseistustaulukkoa */
    const sh = en.r ? SHIPS[String(en.r)] : null;
    if (sh) {
      [["speed", sh.sp], ["turns", sh.tn], ["shields", api.shortShield(sh.sh)], ["turrets", sh.tu]].forEach(([k, v]) => {
        if (v && !new RegExp("<div class=\"v\"><b>" + String(v).replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "</b>").test(h))
          fail(L.nm, ref, "statsi " + k + "=" + JSON.stringify(v) + " ei nay saantokortin statsirivilla");
      });
      if (sh.dld != null && !h.includes('<span>LEADERSHIP</span><div class="v"><b>' + sh.dld + "</b>"))
        fail(L.nm, ref, "kiintea Leadership " + sh.dld + " puuttuu saantokortilta");
      (R.rules || []).forEach(x => {
        if (!txt.includes(norm(String(x.t).replace(/^\*\s*/, "")).slice(0, 42)))
          fail(L.nm, ref, "aluksen saanto puuttuu saantokortilta: " + String(x.t).slice(0, 40));
      });
      if (R.damage && R.damage.note && !txt.includes(norm(R.damage.note).slice(0, 42)))
        fail(L.nm, ref, "vauriohuomautus puuttuu saantokortilta");
      if ((sh.aw || []).length === 0 && /class="k-arm"/.test(h))
        fail(L.nm, ref, "aseettomalla aluksella aseistustaulukko (s.516: ei ARMAMENT-taulukkoa)");
    } else if (/class="k-st"/.test(h)) fail(L.nm, ref, "rungottomalla rivilla statsirivi");
  }));
});
api.S.units = [];
console.log("Saantokortteja %d.", ruleCards);

/* --------------------------------------- yhden listan yksi vari ---- */
LISTS.forEach((L, li) => {
  if (filter && !L.nm.toLowerCase().includes(filter.toLowerCase())) return;
  api.S.li = li;
  const cols = {};
  L.secs.forEach((sec, si) => sec.ents.forEach((en, ei) => {
    if (!en.r || !SHIPS[String(en.r)]) return;
    api.S.units = [{ s: si, e: ei, ref: en.r, n: 1, opts: [], os: {}, name: "" }];
    const h = api.cardHTML(api.S.units[0], "top");
    const m = h.match(/--kd:(#[0-9A-Fa-f]{6})/);
    if (m) (cols[m[1]] = cols[m[1]] || []).push(SHIPS[String(en.r)].nm);
  }));
  const keys = Object.keys(cols);
  if (keys.length > 1)
    fail(L.nm, "-", "kortit " + keys.length + " eri varissa: " +
         keys.map(k => k + " (" + cols[k][0] + ")").join(", "));
});
api.S.units = [];

/* ---------------------------------------------- komentajakortit ---- */
const FWD = /\b(shown below|noted below|listed below|the following|as follows)\b/i;
let cmdCards = 0;
LISTS.forEach((L, li) => {
  if (filter && !L.nm.toLowerCase().includes(filter.toLowerCase())) return;
  api.S.li = li;
  L.secs.forEach((sec, si) => sec.ents.forEach((en, ei) => {
    if (en.k !== "cmd") return;
    api.S.units = [{ s: si, e: ei, ref: null, n: 1, opts: [], os: {}, name: "" }];
    let h = "";
    try { h = api.cardHTML(api.S.units[0], "top"); }
    catch (e) { fail(L.nm, en.l, "komentajakortti heitti: " + e.message); return; }
    if (!h || h.length < 400) { fail(L.nm, en.l, "komentajakortti jai tyhjaksi"); return; }
    cmdCards++;
    (sec.own || []).forEach((owner, i) => {
      if (!owner) return;
      const oe = sec.ents.find(x => x.l === owner);
      const txt = sec.text[i];
      const key = txt.slice(0, 40);
      if ((sec.ownx || []).indexOf(i) >= 0) {
        // oman hintarivinsa aloittama lohko: vain sille riville
        if (h.includes(key) !== (owner === en.l))
          fail(L.nm, en.l, (owner === en.l ? "kortilta puuttuu oma saanto: "
                                           : "kortilla toisen komentajan saanto: ") + key);
      } else if ((en.skiptx || []).indexOf(txt) >= 0) {
        // Osion yleislause, joka ei pade talle riville: Kor'O'Mesmella on
        // kaksi re-rollia (s.453 "Re-rolls: 2"), ei listan yleislauseen yhta
        // (s.456 "The commander has one re-roll included in his points
        // cost."). Kortti ei saa sanoa kahta eri lukua (katselmointi
        // 5.10.2026), joten lause EI saa olla hanen kortillaan.
        if (h.includes(key))
          fail(L.nm, en.l, "kortilla yleislause, joka ei pade talle komentajalle: " + key);
      } else if (!oe || oe.k !== "up") {
        // osion yhteinen kappale: kaikille komentajille
        if (!h.includes(key))
          fail(L.nm, en.l, "kortilta puuttuu peruskomentajan saanto: " + key);
      } else if (!FWD.test(txt)) {
        // ostamattoman paivityksen vaikutus - vain saantolohkossa: optioiden
        // listassa paivitys on nyt tyhjana ruutuna (30.9.2026)
        if ((h.split("COMMANDER RULES")[1] || "").includes(key))
          fail(L.nm, en.l, "kortilla ostamattoman paivityksen vaikutus: " + key);
      }
    });
  }));
});
api.S.units = [];
console.log("Komentajakortteja %d.", cmdCards);

console.log("Renderoity %d korttia %d listalta.", cards,
  LISTS.filter(L => !filter || L.nm.toLowerCase().includes(filter.toLowerCase())).length);
console.log("Loydoksia: %d\n", bad);

const byMsg = {};
found.forEach(([l, s, m]) => {
  const key = m.replace(/[:=].*$/, "").trim();
  (byMsg[key] = byMsg[key] || []).push([l, s, m]);
});
Object.keys(byMsg).sort().forEach(k => {
  const rows = byMsg[k];
  console.log("== %s: %d ==", k, rows.length);
  const lim = VERBOSE ? rows.length : 8;
  rows.slice(0, lim).forEach(([l, s, m]) =>
    console.log("   %s | %s | %s", l.slice(0, 24).padEnd(24), s.slice(0, 34).padEnd(34), m.slice(0, 90)));
  if (rows.length > lim) console.log("   ... ja %d muuta", rows.length - lim);
  console.log();
});
process.exit(bad ? 1 : 0);
