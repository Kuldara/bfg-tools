/* Golden-tapaukset: sama tapaus ajetaan KAIKKIA PINTOJA vasten.
 *
 * Muut testit lukevat samaa dataa ja samaa toteutusta, jota ne testaavat.
 * Ne loytavat rikkoutumisen mutta eivat vaarinymmarrysta. Nama tapaukset on
 * luettu kirjasta (referenssi/golden_cases.json, jokaisella sivunumero), ja
 * jokainen ajetaan pintoja vasten:
 *
 *   hinta          unitPts
 *   ratkaisin      effHits / effShieldsText / effTurrets / armModel / ...
 *   kortti         cardHTML  (tulostettava kortti)
 *   laivastonakyma renderFleet  (mita kayttaja nakee rakentaessaan)
 *   tallennus      save -> load -> sama hinta ja profiili
 *
 * Verrattavat kentat: hinta, osumat, kilvet, tornit, nopeus, kaannos,
 * panssari, voimassa olevat aseet, vauriomalli (crippled-rivi) ja aluksen
 * erikoissaannot. Pintojen erimielisyys on oma loydosluokkansa ("PINNAT"),
 * riippumatta siita onko kirjan odotus taytetty.
 *
 * Yksikko luodaan addUnit():lla, ei kasin. Nain pakolliset paivitykset
 * (applyRequired: AdMechin +1 torni, Chaos-merkit) ja avoimen hinnan
 * oletus (custom = profiilin perushinta) osuvat kuten sovelluksessa. Kasin
 * rakennettu yksikko olisi ohittanut ne ja testannut tilaa, jota sovellus
 * ei koskaan tuota.
 *
 * Tapaus, jonka status on "gap", tiedetaan puuttuvaksi: se on kirjoitettu
 * ENNEN korjausta ja se saa punaisen kunnes tehtava on tehty. Gap ei kaada
 * hyvaksyntaa, mutta se raportoidaan - ja jos gap menee lapi, sekin
 * raportoidaan, jotta status tulee paivitettya.
 *
 * Aja:  node test_golden.js         yhteenveto
 *       node test_golden.js -v      jokainen tapaus riveittain
 *       node test_golden.js --json  koneluettava (acceptance.py kayttaa)
 */
"use strict";
const fs = require("fs"), path = require("path");

/* --- DOM-tynka. Elementit ovat pysyvia valitsimen mukaan, jotta
   renderFleet():n kirjoittama innerHTML voidaan lukea takaisin. -------- */
const mkEl = () => ({
  appendChild(){}, removeChild(){}, addEventListener(){}, setAttribute(){},
  getAttribute: () => null, removeAttribute(){}, focus(){}, remove(){},
  classList: { add(){}, remove(){}, toggle(){}, contains: () => false },
  querySelectorAll: () => [], querySelector: () => null,
  insertAdjacentHTML(){}, innerHTML: "", textContent: "", value: "",
  style: {}, id: "", dataset: {}, checked: false, disabled: false,
  onclick: null, onchange: null, oninput: null, children: [],
});
const els = {};
const el = key => (els[key] || (els[key] = mkEl()));
const DATA = fs.readFileSync(path.join(__dirname, "bfg_data.json"), "utf8");

global.document = {
  getElementById: id => (id === "bfgdata" ? { textContent: DATA } : el("#" + id)),
  querySelector: s => el(s),
  querySelectorAll: () => [],
  createElement: () => mkEl(),
  addEventListener(){},
  head: { appendChild(){} },
  body: { appendChild(){}, removeChild(){}, dataset: {}, classList: { add(){}, remove(){} } },
};
global.window = { addEventListener(){}, print(){},
                  matchMedia: () => ({ matches: false, addEventListener(){} }) };
/* navigator on Nodessa vain luettava; muut testit selviavat siita vain
   koska ne eivat ole strict-tilassa ja sijoitus epaonnistuu aanettomasti. */
if (!global.navigator)
  Object.defineProperty(global, "navigator", { value: {}, configurable: true });
global.alert = () => {}; global.confirm = () => true;
let STORE = {};
global.localStorage = {
  getItem: k => (k in STORE ? STORE[k] : null),
  setItem: (k, v) => { STORE[k] = String(v); },
  removeItem: k => { delete STORE[k]; },
};

const html = fs.readFileSync(path.join(__dirname, "Gothic Fleet Registry.html"), "utf8");
const js = html.split("<script>")[1].split("</script>")[0].replace(/^"use strict";/, "");
const api = new Function(js + "\n;return {LISTS,SHIPS,addUnit,setOptState,optState," +
  "optCount,unitPts,cardHTML,renderFleet,effHits,effShieldsText,effTurrets," +
  "armModel,save,load,KEY,isEscort,shortShield,shortArmour,shortWeaponName," +
  "crippledLine,specialLines,resolveUnit,printRoster,title,upgradesFor,setHull,DOMAIN,selOf,setUpState,upState,listText,shipOf,checks,total,addUnitFrom,setRole,listOf,getS:()=>S," +
  /* unitCards: yksikon kortit tulostusjarjestyksessa (linnakkeella kaksi).
     typeof-vartija, jotta ajuri kay myos buildia vasten, jossa funktiota ei
     viela ole - uusi tapaus nakyy silloin punaisena eika kaada koko ajoa. */
  "unitCards:(typeof unitCards===\"function\"?unitCards:null)," +
  /* fleetFacts: laivaston tiedot (attack rating, vastustajan edut, VP), J214 */
  "fleetFacts:(typeof fleetFacts===\"function\"?fleetFacts:null)," +
  /* fleetAboard: komentajien sijoitus aluksille, J215 */
  "fleetAboard:(typeof fleetAboard===\"function\"?fleetAboard:null)};")();

const CASES = JSON.parse(
  fs.readFileSync(path.join(__dirname, "referenssi", "golden_cases.json"), "utf8"));
const FCASES = JSON.parse(
  fs.readFileSync(path.join(__dirname, "referenssi", "golden_fleet_cases.json"), "utf8"));

const args = process.argv.slice(2);
const VERBOSE = args.includes("-v");
const AS_JSON = args.includes("--json");

/* ------------------------------------------------------------------ apu */
const norm = t => String(t == null ? "" : t)
  .replace(/[  ]/g, " ").replace(/[–—−]/g, "-")
  .replace(/\s+/g, " ").trim();
const unesc = h => String(h).replace(/&nbsp;/g, " ").replace(/&amp;/g, "&")
  .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"')
  .replace(/&#39;/g, "'").replace(/&ndash;/g, "-");

/* The fields resolveUnit v0 and v1 share, normalised: booleans as booleans,
   absent as null, rule refs by id. New v1 fields (kind, options, upgrades,
   issues, damage.critical) are tested on their own against the book. */
function commonProjection(R) {
  if (!R) return null;
  return {
    ref: R.ref, name: R.name, hulls: R.hulls, points: R.points, maxPoints: R.maxPoints,
    stats: R.stats,
    weapons: R.weapons.map(w => ({ a: w.a, i: w.i, box: w.box == null ? null : w.box, alt: !!w.alt,
      grp: !!w.grp, extra: !!w.extra, count: w.count == null ? 1 : w.count,
      opt: w.opt == null ? null : w.opt, writeIn: !!w.writeIn })),
    damage: { crippledAt: R.damage.crippledAt, crippled: R.damage.crippled,
              note: R.damage.note, critTable: R.damage.critTable },
    rules: R.rules.map(x => ({ t: x.t, refs: (x.refs || []).map(y => y.id), ast: !!x.ast,
                               canonical: !!x.canonical, hull: x.hull || null })),
    hull: R.hull,
  };
}

function listIndex(name) {
  return api.LISTS.findIndex(L => L.nm === name);
}

/* Listapaikka: nimetty lista, ja siita rivi joka osoittaa profiilisivuun. */
function placeByLabel(li, label) {
  const L = api.LISTS[li];
  if (!L) return null;
  const re = new RegExp(label, "i");
  for (let si = 0; si < L.secs.length; si++)
    for (let ei = 0; ei < L.secs[si].ents.length; ei++) {
      const en = L.secs[si].ents[ei];
      if (en.k !== "up" && re.test(String(en.l))) return { si, ei };
    }
  return null;
}

function placeOn(li, page) {
  const L = api.LISTS[li];
  if (!L) return null;
  let fallback = null;
  for (let si = 0; si < L.secs.length; si++)
    for (let ei = 0; ei < L.secs[si].ents.length; ei++) {
      const en = L.secs[si].ents[ei];
      if (String(en.r) !== String(page)) continue;
      if (en.k === "unit") return { si, ei };
      if (!fallback) fallback = { si, ei };
    }
  return fallback;
}

/* Yksikko syntyy kuten sovelluksessa: addUnit() ajaa applyRequired():n ja
   asettaa avoimen hinnan oletuksen. Lainalaiva (Fleets s.14): "from" on
   lahdelista ja "role" reserve/ally - yksikko ostetaan lahdelistalta
   laivaston (list) palvelukseen kuten laivastotapauksissa (J206). */
function freshUnit(c) {
  const S = api.getS();
  const li = listIndex(c.list);
  if (li < 0) return { err: "listaa ei loydy: " + c.list };
  const li2 = c.from ? listIndex(c.from) : li;
  if (li2 < 0) return { err: "lahdelistaa ei loydy: " + c.from };
  const at = c.entry ? placeByLabel(li2, c.entry) : placeOn(li2, c.ship);
  if (!at) return { err: (c.entry ? "rivia " + c.entry : "alus s." + c.ship) + " ei ole listalla " + (c.from || c.list) };
  S.li = li; S.limit = 999999; S.units = [];
  if (c.from) api.addUnitFrom(li2, at.si, at.ei, c.role || "reserve");
  else api.addUnit(at.si, at.ei);
  const u = S.units[0];
  return u ? { u } : { err: "addUnit ei tuottanut yksikkoa" };
}

function optIndex(sh, pattern) {
  const re = new RegExp(pattern, "i");
  return (sh.ol || []).findIndex(o => re.test(o.t));
}

/* Voimassa oleva aseistus: rivi ilman valintaruutua on aina mukana; rivi
   jolla on ruutu (optioon sidottu) on mukana vain "on"-tilassa. */
function activeRows(u, sh) {
  return api.armModel(u, sh).filter(r => r.box == null || r.box === "on");
}

/* --- pinnat ------------------------------------------------------------ */
/* Ratkaisin on se rajapinta, jota pinnat lukevat (docs/DOMAIN_CONTRACT.md).
   Ajuri lukee samaa, jotta se testaa sopimusta eika yksittaisia apureita. */
function fromResolver(u, sh) {
  const R = api.resolveUnit(u);
  if (!R || !R.stats) return { hits: null, shields: null, turrets: null, speed: null,
                   turns: null, armour: null, weapons: [], damage: "", rules: [],
                   points: R ? R.points : null, leadership: R ? JSON.stringify(R.leadership) : null,
                   rerolls: R && R.rerolls ? R.rerolls.total : null };
  return {
    hits: R.stats.hits,
    shields: norm(R.stats.shields),
    turrets: norm(R.stats.turrets),
    speed: norm(R.stats.speed), turns: norm(R.stats.turns), armour: norm(R.stats.armour),
    weapons: R.weapons.filter(r => r.box == null || r.box === "on").map(r => norm(r.a[0])),
    damage: norm(R.damage.note),
    /* brief (space hulks, user 9.10.2026): the card prints the hull's own
       rules and leaves out those of its standard weapons (rules[].weapon) */
    rules: R.rules.filter(r => !(R.brief && r.weapon)).map(r => norm(r.t.replace(/^\*\s*/, ""))),
  };
}

/* Yksikon kortit yhtena HTML:na. Tahtilinnake (Ramilies s.500, Fortress-
   Monastery s.110) tulostuu KAHTENA korttina samalle sivulle: pohjakortti,
   jolla on neljanneskohtaiset osumaradat (Fleets s.501: "its weapons, hits
   and defences are divided up into four quadrants"), ja saantokortti, jolla
   on statsit, aseistustaulukko ja loput saannot. Vaitteet "jokainen saanto,
   vauriomalli ja ase on kortilla" ja osumien luku (suurin ruudun numero, 12
   neljalla radalla) koskevat siksi PARIA - yksittainen kortti ei kanna
   kaikkea, eika sen pidakaan. Muilla yksikoilla pari on yksi kortti. */
function cardsHTML(u) {
  if (api.unitCards) return api.unitCards(u).map(c => c.html(0)).join("\n");
  return api.cardHTML(u, 0);
}
/* card_count: kirjaimellisen merkkijonon esiintymat kortin (parin) HTML:ssa. */
function countChecks(e, html, r) {
  (e.card_count || []).forEach(x => {
    const n = html.split(x.match).length - 1;
    if (n !== x.n) r.profile.push("kortilla '" + x.match + "' x" + n + " != " + x.n);
  });
}
/* view_* ja roster_*: laivastonakyma ja rosteri sanovat (tai eivat sano)
   jotain. Kaytetaan tyyppisanoihin ja laivuesanastoon: pelaajalle ei nayteta
   sisaisia sanoja ("fleet option"), eika squadron-saantoa yksikolle, jolle
   kirja ei sita anna. Sisaltaa-tarkistus lukee tekstin, puuttuu-tarkistus
   myos raa'an HTML:n (placeholderit ja title-attribuutit). */
function surfaceWordChecks(e, viewHtml, rostHtml, r) {
  const text = h => norm(unesc(String(h || "").replace(/<[^>]+>/g, " ")));
  const vt = text(viewHtml), rt = text(rostHtml);
  (e.view_contains || []).forEach(s => { if (!vt.includes(norm(s)) && !String(viewHtml).includes(s)) r.profile.push("laivastonakymasta puuttuu: " + s); });
  (e.view_lacks || []).forEach(s => { if (vt.includes(norm(s)) || String(viewHtml).includes(s)) r.profile.push("laivastonakymassa on liikaa: " + s); });
  (e.roster_contains || []).forEach(s => { if (!rt.includes(norm(s)) && !String(rostHtml).includes(s)) r.profile.push("rosterista puuttuu: " + s); });
  (e.roster_lacks || []).forEach(s => { if (rt.includes(norm(s)) || String(rostHtml).includes(s)) r.profile.push("rosterissa on liikaa: " + s); });
}

function cardOf(u, sh) {
  const h = cardsHTML(u);
  /* Osumat luetaan VAIN vahinkokaistasta, ei kaikista <i>-numeroista. */
  const bands = h.match(/<div class="k-hits[^"]*">[\s\S]*?<\/div>/g) || [];
  const boxes = bands.flatMap(b => [...b.matchAll(/<i>(\d+)<\/i>/g)].map(m => +m[1]));
  const stat = lab => {
    const re = new RegExp("<span>" + lab + "</span><div class=\"v\"><b>([^<]*)</b>", "i");
    const m = h.match(re);
    return m ? norm(unesc(m[1])) : null;
  };
  const text = norm(unesc(h.replace(/<[^>]+>/g, " ")));
  return {
    html: h, text,
    hits: boxes.length ? Math.max(...boxes) : null,
    shields: stat("SHIELDS"), turrets: stat(norm(sh.tl || "TURRETS")),
    speed: stat("SPEED"), turns: stat("TURNS"), armour: stat("ARMOUR"),
  };
}

function fleetViewOf(sh) {
  api.renderFleet();
  const h = el("#fleet").innerHTML || "";
  const pick = lab => {
    const m = h.match(new RegExp("<b>" + lab + "</b>\\s*([^<]*)"));
    return m ? norm(unesc(m[1])) : null;
  };
  /* tornisarakkeen nimi tulee ratkaisimesta: Turrets tai Spores */
  const tl = api.title(sh.tl || "TURRETS");
  return { html: h, hits: pick("Hits"), shields: pick("Shields"),
           turrets: pick(tl), speed: pick("Speed"),
           turns: pick("Turns"), armour: pick("Armour") };
}

/* Roster: printRoster() kirjoittaa #sheet:iin; Hits-sarake on nelja
   solua rivilla (nimi, luokka, tyyppi, osumat, pisteet). */
function rosterOf() {
  el("#sheet").innerHTML = "";
  api.printRoster();
  const h = el("#sheet").innerHTML || "";
  const m = h.match(/<td class="n">([^<]*)<\/td>\s*<td class="n">([^<]*)<\/td>/);
  return { html: h, hits: m ? norm(unesc(m[1])) : null,
           points: m ? norm(unesc(m[2])) : null };
}

function saveRoundTrip(u, sh) {
  STORE = {};
  api.save();
  const before = { pts: api.unitPts(u), ...fromResolver(u, sh) };
  api.load();
  const S = api.getS();
  const v = S.units && S.units[0];
  if (!v) return { ok: false, why: "lataus ei palauttanut yksikkoa" };
  const after = { pts: api.unitPts(v), ...fromResolver(v, sh) };
  const same = JSON.stringify(before) === JSON.stringify(after);
  return { ok: same, why: same ? "" : JSON.stringify(before).slice(0, 80)
                                       + " != " + JSON.stringify(after).slice(0, 80) };
}

/* --- komentaja tai listaoptio: rivi ilman runkoa (P1-8e) ------------------ */
function runEntryCase(c, r) {
  const got = freshUnit(c);
  if (got.err) { r.profile.push(got.err); return r; }
  const u = got.u;
  for (const sel of (c.select || [])) {
    if (!sel.upgrade) { r.profile.push("komentajalla vain upgrade-valintoja: " + JSON.stringify(sel)); return r; }
    const ups = api.upgradesFor(u);
    const row = ups.own.concat(ups.other).find(x => new RegExp(sel.upgrade, "i").test(String(x[2].l)));
    if (!row) { r.profile.push("paivitysta ei tarjota: " + sel.upgrade); return r; }
    api.setUpState(u, row[0], row[1], sel.state || "take");
  }
  if (c.name != null) u.name = c.name;
  if (c.note != null) u.note = c.note;
  if (c.adjust != null) u.adj = c.adjust;
  /* Ostettujen kappaleiden maara: rungoton puolustusrivi (Orbital mine
     s.512, Minefield s.513) ostetaan N kappaletta yhdelle riville. run()
     kunnioitti c.n:aa jo; taalla se ohitettiin, joten "4 miinaa = 20 pts"
     ei ollut testattavissa. */
  if (c.n != null) u.n = c.n;
  const e = c.expect || {};
  const R = api.resolveUnit(u);
  if (!R) { r.profile.push("resolveUnit palautti null"); return r; }
  if (R.kind !== "commander" && R.kind !== "entry") r.profile.push("kind: " + R.kind);
  { const errs = (R.issues || []).filter(x => x.severity === "error").map(x => x.code);
    if (errs.length) r.profile.push("odottamaton virhe: " + errs.join(",")); }
  const pts = api.unitPts(u);
  if (e.points != null) r.points = pts === e.points ? null : (pts + " != " + e.points);
  if (e.leadership !== undefined) {
    const got = R.leadership ? R.leadership.kind + " " + R.leadership.value + (R.leadership.max != null ? " max " + R.leadership.max : "") : "null";
    const want = e.leadership ? e.leadership.kind + " " + e.leadership.value + (e.leadership.max != null ? " max " + e.leadership.max : "") : "null";
    if (got !== want) r.profile.push("leadership: " + got + " != " + want);
  }
  if (e.rerolls_total != null && (!R.rerolls || R.rerolls.total !== e.rerolls_total))
    r.profile.push("re-rollit: " + (R.rerolls ? R.rerolls.total : "-") + " != " + e.rerolls_total);
  (e.upgrades || []).forEach(x => {
    const up = (R.upgrades || []).find(o => new RegExp(x.match, "i").test(o.label));
    if (!up) { r.profile.push("upgrades[]: ei paivitysta " + x.match); return; }
    if (x.state && up.state !== x.state) r.profile.push("upgrades[] " + x.match + ": tila " + up.state);
    if (x.cost != null && up.cost !== x.cost) r.profile.push("upgrades[] " + x.match + ": cost " + up.cost + " != " + x.cost);
  });
  /* surfaces: card, fleet view, roster, Copy list all say the same points */
  const card = api.cardHTML(u, 0), cardText = norm(unesc(card.replace(/<[^>]+>/g, " ")));
  api.renderFleet(); const view = norm(unesc((el("#fleet").innerHTML || "").replace(/<[^>]+>/g, " ")));
  const rost = rosterOf(); const copy = norm(api.listText());
  if (R.kind === "commander" && !card) r.surfaces.push("komentajakortti puuttuu");
  if (!view.includes(pts + " pts")) r.surfaces.push("laivastonakyma ei nayta " + pts + " pts");
  if (rost.points !== String(pts)) r.surfaces.push("rosteri: " + rost.points + " != " + pts);
  if (!copy.includes(" " + pts + " pts")) r.surfaces.push("Copy list ei nayta " + pts + " pts");
  (R.upgrades || []).filter(o => o.state === "take").forEach(o => {
    if (card && !cardText.toLowerCase().includes(norm(o.label).toLowerCase())) r.surfaces.push("kortilta puuttuu paivitys: " + o.label);
    if (!copy.toLowerCase().includes(norm(o.label).toLowerCase())) r.surfaces.push("Copy listista puuttuu paivitys: " + o.label);
  });
  (e.card_contains || []).forEach(s => { if (!card.includes(s) && !cardText.includes(norm(s))) r.profile.push("kortilta puuttuu: " + s); });
  (e.card_lacks || []).forEach(s => { if (card.includes(s) || cardText.includes(norm(s))) r.profile.push("kortilla on liikaa: " + s); });
  (e.list_contains || []).forEach(s => { if (!copy.includes(norm(s))) r.profile.push("Copy list -tekstista puuttuu: " + s); });
  countChecks(e, card, r);
  surfaceWordChecks(e, el("#fleet").innerHTML || "", rost.html, r);
  /* Saantokortti (R.card "rule") on kortti siina missa aluksenkin: tyhja
     kortti rivilta, jolla sellainen pitaa olla, on loydos. */
  if (R.card === "rule" && !card) r.surfaces.push("saantokortti puuttuu");
  const rt = saveRoundTrip(u, null);
  if (!rt.ok) r.surfaces.push("tallennuskierros: " + rt.why);
  return r;
}

/* --- yhden tapauksen ajo ---------------------------------------------- */
function run(c) {
  const r = { id: c.id, page: c.page, status: c.status || "expect_pass",
              task: c.task || null, points: null, profile: [], surfaces: [],
              notes: [] };
  let sh = c.entry ? null : api.SHIPS[String(c.ship)];
  if (!c.entry && !sh) { r.profile.push("profiilia " + c.ship + " ei ole"); return r; }
  if (!c.list) { r.profile.push("tapaukselta puuttuu 'list'"); return r; }
  if (c.entry) return runEntryCase(c, r);

  let u = null;
  if (c.list === "-") {
    /* Alus, jota ei osteta miltaan listalta (Waystation s.481 on
       Tau-puolustus). Vain profiilitarkistukset; pinnat ohitetaan. */
    const S = api.getS(); S.li = 0; S.limit = 999999; S.units = [];
    u = { s: -1, e: -1, ref: isNaN(+c.ship) ? c.ship : +c.ship, n: 1,
          opts: [], os: {}, oq: {}, ups: {}, name: "", _noList: true };
    r.notes.push("ei listarivia: vain profiili tarkistettu");
  } else {
    const got = freshUnit(c);
    if (got.err) { r.profile.push(got.err); return r; }
    u = got.u;
  }

  /* Valinnat jarjestyksessa. state: take (oletus) | opt | off - jalkimmaiset
     ovat olemassa, jotta tapaus voi todistaa etta lisatty rivi myos
     KATOAA, kun valinta puretaan. Lisaavat vaikutukset vuotavat juuri
     siina kohdassa. */
  for (const sel of (c.select || [])) {
    /* hull: pohjarungon valinta (Venerable battle barge, Fleets s.102).
       Sama funktio kuin kayttoliittymassa, jotta optiot nollautuvat samoin. */
    if (sel.hull) {
      if (!api.SHIPS[String(sel.hull)]) { r.profile.push("runkoa ei ole: " + sel.hull); return r; }
      api.setHull(u, sel.hull);
      sh = api.shipOf(u);   /* seuraavat optiot ovat uuden rungon - Venerable-nakyman (s.102) */
      continue;
    }
    /* upgrade: listapaivitys nimen regexilla, tarjotuista riveista (P1-8d) */
    if (sel.upgrade) {
      const ups = api.upgradesFor(u);
      const row = ups.own.concat(ups.other).find(x => new RegExp(sel.upgrade, "i").test(String(x[2].l)));
      if (!row) { r.profile.push("paivitysta ei tarjota: " + sel.upgrade); return r; }
      api.setUpState(u, row[0], row[1], sel.state || "take");
      continue;
    }
    const i = optIndex(sh, sel.option);
    if (i < 0) { r.profile.push("optiota ei loydy: " + sel.option); return r; }
    /* raw: kirjoitetaan tila suoraan ilman transitionia - nain rakennetaan
       kelvoton tila, jonka ratkaisimen pitaa raportoida (P1-8e). */
    if (sel.raw) { u.os = u.os || {}; u.os[i] = sel.state || "take"; continue; }
    api.setOptState(u, i, sel.state || "take");
    if (sel.qty) { u.oq = u.oq || {}; u.oq[i] = sel.qty; }
  }
  /* Rich fixture (P1-8d): the player's own fields, as typed in the builder. */
  if (c.name != null) u.name = c.name;
  if (c.note != null) u.note = c.note;
  if (c.adjust != null) u.adj = c.adjust;
  if (c.members != null) u.members = c.members;
  if (c.n != null) u.n = c.n;                 /* saattueen koko (kohta 10b) */

  /* runkovalinnan jalkeen yksikon alus on valittu runko, ei rivin oletus */
  sh = api.shipOf(u) || sh;   /* Venerable-rivilla rungon SM-nakyma (s.102) */

  /* P1-8c: the app's adapter (resolveUnit(u) -> intent -> domain.js) against
     a direct call of the pure resolver, on the fields v0 also had. The dual
     run against the old v0 body passed on every case before v0 was removed;
     this stays as the regression of the adapter path. Semantic projection,
     deepStrictEqual - not a byte comparison. */
  { const v0 = api.resolveUnit(u);
    /* Lainalaivalla (u.lst) sovellus antaa oman listan ja laivaston listan
       erikseen (selOf: ctx.list = yksikon lista, ctx.host = laivasto); sama
       konteksti tassa, muuten vertailu ajaa eri kysymyksen (J206). */
    const hostL = api.LISTS[api.getS().li];
    const ownL = u.lst ? api.LISTS.find(x => x.nm === u.lst) : null;
    const ctx = ownL ? { list: ownL, host: hostL } : { list: hostL };
    const v1 = api.DOMAIN.resolveUnit(api.DOMAIN.fromLegacyUnit(u, ctx, {ships: api.SHIPS, lists: api.LISTS}), ctx, {ships: api.SHIPS, lists: api.LISTS});
    try { require("assert").deepStrictEqual(commonProjection(v1), commonProjection(v0)); }
    catch (err) { r.surfaces.push("v1-pariteetti: " + String(err.message).replace(/\s+/g, " ").slice(0, 160)); }
  }
  /* P1-8b: the pure Selection (domain.js) must agree with the legacy state
     accessor the setters still write to. */
  { const sel = api.selOf(u);
    (sh.ol || []).forEach((o, i) => {
      if (api.optState(u, i) !== sel.ost[i])
        r.surfaces.push("optState-pariteetti [" + i + "]: " + api.optState(u, i) + " != " + sel.ost[i]);
    }); }

  const e = c.expect || {};
  /* hull_choices_include / _exclude: mita runkoja rivi tarjoaa (nimen regex) */
  if (e.hull_choices_include || e.hull_choices_exclude) {
    const R0 = api.resolveUnit(u);
    const names = ((R0 && R0.hull && R0.hull.choices) || []).map(p => String(api.SHIPS[p] ? api.SHIPS[p].nm : p));
    const has = pat => names.some(n => new RegExp(pat, "i").test(n));
    (e.hull_choices_include || []).forEach(p => { if (!has(p)) r.profile.push("runko puuttuu vaihtoehdoista: " + p); });
    (e.hull_choices_exclude || []).forEach(p => { if (has(p)) r.profile.push("runko on vaihtoehdoissa vaikka ei saisi: " + p); });
  }
  const res = fromResolver(u, sh);
  /* Issues (P1-8e): a case either names the issues it expects, or it must
     resolve without a single error - the golden set doubles as the proof
     that every book-read configuration is a valid intent. */
  { const Rz = api.resolveUnit(u);
    const codes = ((Rz && Rz.issues) || []).map(x => x.code);
    if (e.issues) e.issues.forEach(x => { if (!codes.includes(x.code)) r.profile.push("issue puuttuu: " + x.code); });
    else {
      const errs = ((Rz && Rz.issues) || []).filter(x => x.severity === "error").map(x => x.code);
      if (errs.length) r.profile.push("odottamaton virhe: " + errs.join(","));
    } }
  const card = u._noList ? null : cardOf(u, sh);
  const view = u._noList ? null : fleetViewOf(sh);
  const rost = u._noList ? null : rosterOf();
  const copy = u._noList ? null : norm(api.listText());
  const pts = u._noList ? null : api.unitPts(u);

  /* 1. hinta */
  if (e.points != null && pts != null)
    r.points = pts === e.points ? null : (pts + " != " + e.points);
  /* max_points: suurin LAILLINEN hinta - valintaryhmasta vain yksi (kohta 10b) */
  if (e.max_points != null) {
    const mp = api.resolveUnit(u).maxPoints;
    if (mp !== e.max_points) r.profile.push("maxPoints: " + mp + " != " + e.max_points);
  }

  /* 2. kirjan profiili */
  ["hits", "shields", "turrets", "speed", "turns", "armour"].forEach(k => {
    if (e[k] == null) return;
    if (norm(res[k]) !== norm(e[k]))
      r.profile.push(k + ": " + norm(res[k]) + " != " + norm(e[k]));
  });
  const allRows = api.armModel(u, sh);
  if (e.weapon_rows != null && allRows.length !== e.weapon_rows)
    r.profile.push("aserivia taulukossa " + allRows.length + " != " + e.weapon_rows);
  if (e.active_weapons != null && res.weapons.length !== e.active_weapons)
    r.profile.push("voimassa olevia aseita " + res.weapons.length + " != " + e.active_weapons);
  /* special_contains / special_lacks: the profile's SPECIAL text as the
     card resolves it (specialLines) - a profile-level check that runs also
     for a ship no list sells (Waystation s.481). */
  if (e.special_contains || e.special_lacks) {
    const lines = api.specialLines(sh).map(x => String(x.t || ""));
    (e.special_contains || []).forEach(s => { if (!lines.some(l => l.includes(s))) r.profile.push("SPECIAL-teksteista puuttuu: " + s); });
    (e.special_lacks || []).forEach(s => { if (lines.some(l => l.includes(s))) r.profile.push("SPECIAL-teksteissa on liikaa: " + s); });
  }
  if (e.weapon) {
    const re = new RegExp(e.weapon.match, "i");
    const row = allRows.find(x => re.test(String(x.a[0])));
    if (!row) r.profile.push("aserivia ei loydy: " + e.weapon.match);
    else {
      const cols = { name: 0, range: 1, fp: 2, arc: 3 };
      Object.keys(e.weapon).forEach(k => {
        if (k === "match") return;
        /* count = instanssien maara (Hive Shipin sivusetit, P1-6) */
        if (k === "count") {
          const got = row.count == null ? 1 : row.count;
          if (got !== e.weapon.count)
            r.profile.push("ase count: " + got + " != " + e.weapon.count);
          return;
        }
        const got = norm(row.a[cols[k]]);
        if (got !== norm(e.weapon[k]))
          r.profile.push("ase " + k + ": " + got + " != " + norm(e.weapon[k]));
      });
    }
  }
  if (e.weapon_none) {
    /* Ei yhtaan VOIMASSA olevaa rivia, joka tasmaa nimeen JA kantamaan -
       Mercuryn 45 cm:n patterit eivat saa jaada, kun ne on nostettu 60 cm:iin. */
    const re = new RegExp(e.weapon_none.match, "i");
    const left = activeRows(u, sh).filter(x => re.test(String(x.a[0])) &&
      (!e.weapon_none.range || norm(x.a[1]) === norm(e.weapon_none.range)));
    if (left.length)
      r.profile.push("rivi on yha voimassa: " + e.weapon_none.match + " @ " + (e.weapon_none.range || "") + " x" + left.length);
  }
  if (e.weapon_count) {
    /* montako VOIMASSA olevaa rivia vastaa kuviota - toistuvat instanssit */
    const re = new RegExp(e.weapon_count.match, "i");
    const n = res.weapons.filter(w => re.test(w)).length;
    if (n !== e.weapon_count.n)
      r.profile.push("voimassa olevia '" + e.weapon_count.match + "' " + n + " != " + e.weapon_count.n);
  }
  if (copy) {
    (e.list_contains || []).forEach(s => {
      if (!copy.includes(norm(s))) r.profile.push("Copy list -tekstista puuttuu: " + s);
    });
  }
  /* roster_contains luetaan surfaceWordChecks():ssa alempana (sama saanto
     myos rungottomille riveille). */
  if (card) {
    (e.card_contains || []).forEach(s => {
      if (!card.html.includes(s) && !card.text.includes(norm(s)))
        r.profile.push("kortilta puuttuu: " + s);
    });
    (e.card_lacks || []).forEach(s => {
      if (card.html.includes(s) || card.text.includes(norm(s)))
        r.profile.push("kortilla on liikaa: " + s);
    });
    countChecks(e, card.html, r);
  }
  if (view && rost) surfaceWordChecks(e, view.html, rost.html, r);
  /* weapon_zones: ratkaistujen aserivien ryhmat. Kirjan taulukossa on kaksi
     ryhmaotsikkoa, QUADRANT WEAPONS ja BASILICA WEAPONS (Fleets s.110, s.500);
     pohjakortti piirtaa neljanneksen aseet neljaan kertaan ja Basilican aseet
     kerran keskelle, joten ryhman on oltava ratkaisimen kentta eika kortin
     arvaus. */
  if (e.weapon_zones) {
    const Rw = api.resolveUnit(u);
    Object.keys(e.weapon_zones).forEach(z => {
      const n = ((Rw && Rw.weapons) || []).filter(w => w.zone === z).length;
      if (n !== e.weapon_zones[z]) r.profile.push("aseita ryhmassa " + z + ": " + n + " != " + e.weapon_zones[z]);
    });
  }
  /* Listapaivitys tarjolla / ei tarjolla talle alukselle (upgradesFor).
     Chosen Terminators on "battleships and grand cruisers" -paivitys, jota
     tarjottiin Chaos Space Hulkille (Defence) ilman ehtoa. */
  if (e.upgrade_offered || e.upgrade_not_offered) {
    const ups = api.upgradesFor(u);
    const labels = ups.own.concat(ups.other).map(x => String(x[2].l));
    const has = pat => labels.some(l => new RegExp(pat, "i").test(l));
    if (e.upgrade_offered && !has(e.upgrade_offered))
      r.profile.push("paivitysta ei tarjota: " + e.upgrade_offered);
    if (e.upgrade_not_offered && has(e.upgrade_not_offered))
      r.profile.push("paivitys tarjotaan vaikka ei saisi: " + e.upgrade_not_offered);
  }
  /* P1-8c: options[] and upgrades[] of the resolver, expectations from the
     book (referenssi/golden_cases.json). */
  if (e.options || e.upgrades) {
    const R1 = api.resolveUnit(u);
    (e.options || []).forEach(x => {
      const o = (R1.options || []).find(o => new RegExp(x.match, "i").test(o.text));
      if (!o) { r.profile.push("options[]: ei optiota " + x.match); return; }
      if (x.state && o.state !== x.state) r.profile.push("options[] " + x.match + ": tila " + o.state + " != " + x.state);
      if (x.qty != null && o.qty !== x.qty) r.profile.push("options[] " + x.match + ": qty " + o.qty + " != " + x.qty);
      if (x.blocked_by) {
        const b = (R1.options || []).find(o2 => new RegExp(x.blocked_by, "i").test(o2.text));
        if (!b || !o.blockedBy.includes(b.id)) r.profile.push("options[] " + x.match + ": ei estetty (" + x.blocked_by + ")");
      }
      if (x.depends_on) {
        const dnode = (R1.options || []).find(o2 => new RegExp(x.depends_on, "i").test(o2.text));
        if (!dnode || o.dependsOn !== dnode.id) r.profile.push("options[] " + x.match + ": riippuvuus ei ole " + x.depends_on);
      }
    });
    (e.upgrades || []).forEach(x => {
      const up = (R1.upgrades || []).find(o => new RegExp(x.match, "i").test(o.label));
      if (!up) { r.profile.push("upgrades[]: ei paivitysta " + x.match); return; }
      if (x.state && up.state !== x.state) r.profile.push("upgrades[] " + x.match + ": tila " + up.state + " != " + x.state);
      if (x.required != null && up.required !== x.required) r.profile.push("upgrades[] " + x.match + ": required " + up.required);
      if (x.cost != null && up.cost !== x.cost) r.profile.push("upgrades[] " + x.match + ": cost " + up.cost + " != " + x.cost);
      if (x.owner && up.owner !== x.owner) r.profile.push("upgrades[] " + x.match + ": owner " + up.owner);
    });
  }
  if (e.exclusive_group_blocks) {
    const i = optIndex(sh, e.exclusive_group_blocks);
    api.setOptState(u, i, "take");
    const both = (c.select || []).every(sel =>
      api.optState(u, optIndex(sh, sel.option)) === "take");
    if (both && api.optState(u, i) === "take")
      r.profile.push("kaksi saman ryhman optiota yhta aikaa valittuna");
  }

  /* 3. pintojen yksimielisyys */
  if (card && view) {
    const cmp = (a, b, k, an, bn) => {
      if (a[k] == null || b[k] == null) return;
      if (norm(a[k]) !== norm(b[k]))
        r.surfaces.push(k + ": " + an + "=" + norm(a[k]) + " " + bn + "=" + norm(b[k]));
    };
    /* Kortti lyhentaa tahallaan (Shadowfield -> SHADOW, panssari); se on
       esitystapa, ei erimielisyys. Vertailu tehdaan lyhennyksen lapi. */
    const asCard = { ...res, shields: norm(api.shortShield(res.shields)),
                     armour: norm(api.shortArmour(res.armour)) };
    ["hits", "shields", "turrets", "speed", "turns", "armour"].forEach(k => {
      cmp(asCard, card, k, "ratkaisin", "kortti");
      cmp(res, view, k, "ratkaisin", "laivastonakyma");
    });
    if (rost) {
      cmp(res, rost, "hits", "ratkaisin", "rosteri");
      if (rost.points != null && String(pts) !== rost.points)
        r.surfaces.push("points: ratkaisin=" + pts + " rosteri=" + rost.points);
    }
    /* Copy list: the unit's own line carries the same points and every taken
       option and upgrade by name (P1-8d). Read now, not earlier: an
       expectation above (exclusive_group_blocks) may have changed a choice. */
    if (copy) {
      const R1 = api.resolveUnit(u), copyNow = norm(api.listText()), ptsNow = api.unitPts(u);
      if (!copyNow.includes(" " + ptsNow + " pts"))
        r.surfaces.push("points: ratkaisin=" + ptsNow + " Copy list ei sisalla sita");
      (R1.options || []).filter(o => o.state === "take").forEach(o => {
        if (!copyNow.includes(norm(o.text).slice(0, 40))) r.surfaces.push("Copy list: optio puuttuu: " + o.text.slice(0, 30));
      });
      (R1.upgrades || []).filter(o => o.state === "take").forEach(o => {
        if (!copyNow.toLowerCase().includes(norm(o.label).toLowerCase())) r.surfaces.push("Copy list: paivitys puuttuu: " + o.label);
      });
    }
    /* Voimassa olevat aseet ja vauriomalli ovat kortilla nimeltaan. */
    res.weapons.forEach(w => {
      const short = norm(api.shortWeaponName(w));
      if (!card.text.includes(short) && !card.text.includes(w))
        r.surfaces.push("ase puuttuu kortilta: " + w);
    });
    if (res.damage && !card.text.includes(res.damage.slice(0, 40)))
      r.surfaces.push("vauriomalli puuttuu kortilta: " + res.damage.slice(0, 40));
    res.rules.forEach(t => {
      if (!card.text.includes(t.slice(0, 40)))
        r.surfaces.push("erikoissaanto puuttuu kortilta: " + t.slice(0, 40));
    });
    const rt = saveRoundTrip(u, sh);
    if (!rt.ok) r.surfaces.push("tallennuskierros: " + rt.why);
  }
  return r;
}


/* ================= laivastotason tapaukset (1.1 vaihe 1) =================
   Yksikkotapaus kysyy "mita alus maksaa ja mita se kantaa". Laivastotapaus
   kysyy toista: "mita laivaston laillisuustarkistukset sanovat". Se on eri
   koodia (resolveFleet, domain.js kohta 8) ja eri kysymys, joten tapaukset
   ovat omassa tiedostossaan referenssi/golden_fleet_cases.json.

   Laivasto rakennetaan addUnit():lla kuten sovelluksessa, jotta pakolliset
   paivitykset ja avoimet hinnat osuvat samoin. Odotus on luettu kirjasta:
   lause, sivunumero ja kasin laskettu summa - ei ajamalla sovellusta. */

function buildFleet(f, r) {
  const S = api.getS();
  const li = listIndex(f.list);
  if (li < 0) { r.errors.push("listaa ei loydy: " + f.list); return null; }
  S.li = li; S.limit = f.limit | 0; S.units = [];
  /* spec.aboard (J215): komentajan valitsema alus, rivin regex. Kohde voi
     olla listassa vasta myohemmin, joten valinnat tehdaan lopuksi. */
  const aboardSpecs = [];
  for (const spec of (f.units || [])) {
    /* Lainalaiva (Fleets s.14): yksikko ostetaan LAHDELISTALTA, jotta sen
       rivi, hinta ja pakolliset paivitykset tulevat sielta. Lista vaihdetaan
       vain rakentamisen ajaksi; yksikko kantaa sen jalkeen itse listansa
       (u.lst) ja roolinsa (u.role). */
    const foreign = !!(spec.list && spec.list !== f.list);
    const li2 = foreign ? listIndex(spec.list) : li;
    if (li2 < 0) { r.errors.push("lahdelistaa ei loydy: " + spec.list); return null; }
    const at = spec.entry ? placeByLabel(li2, spec.entry) : placeOn(li2, spec.ship);
    if (!at) { r.errors.push("rivia ei ole listalla " + api.LISTS[li2].nm + ": "
      + (spec.entry || ("s." + spec.ship))); return null; }
    for (let k = 0; k < (spec.repeat == null ? 1 : spec.repeat); k++) {
      /* addUnitFrom ottaa lahdelistan argumenttina, joten S.li pysyy
         laivaston omassa listassa koko ajan. Aiemmin ajuri siirsi sita ja
         joutui siivoamaan jaljet jalkikateen (J103). */
      /* J226: Da Ork Clanzissa uusi yksikko menee Warlordinsa ryhmaan eika
         listan loppuun, joten lisatty yksikko haetaan vertaamalla. */
      const before = S.units.slice();
      api.addUnitFrom(li2, at.si, at.ei, spec.role);
      const u = S.units.filter(x => before.indexOf(x) < 0)[0];
      if (u && spec.aboard) aboardSpecs.push({ u: u, re: spec.aboard });
      /* J216: laivue (sama tunniste = sama laivue) ja Clanzin Warlord
         (cmd = monesko komentajayksikko laivaston jarjestyksessa, 0 = ensimmainen) */
      if (u && spec.sq) u.sq = String(spec.sq);
      /* J218: runkovalinta (hc-rivi), profiilisivu kuten yksikkotapauksissa */
      if (u && spec.hull != null) api.setHull(u, spec.hull);
      if (u && spec.cmd != null) aboardSpecs.push({ u: u, cmd: spec.cmd | 0 });
      if (!foreign && spec.role) u.role = spec.role;
      if (!u) { r.errors.push("addUnit ei tuottanut yksikkoa: " + (spec.entry || spec.ship)); return null; }
      if (spec.n != null) u.n = spec.n;
      if (spec.adjust != null) u.adj = spec.adjust;
      if (spec.name != null) u.name = spec.name;
      const sh = api.shipOf(u);
      for (const sel of (spec.opts || [])) {
        const i = optIndex(sh, sel.option);
        if (i < 0) { r.errors.push("optiota ei loydy: " + sel.option); return null; }
        api.setOptState(u, i, sel.state || "take");
        if (sel.qty) { u.oq = u.oq || {}; u.oq[i] = sel.qty; }
      }
      /* Kielletty paivitys: tapaus vaittaa, ettei rivia TARJOTA lainkaan.
         Naita ei voi mitata pistemaarasta, koska ostamatta jattaminen
         nayttaa samalta kuin kielto - siksi oma odotus. */
      for (const re2 of (spec.no_ups || [])) {
        const ups0 = api.upgradesFor(u);
        const hit = ups0.own.concat(ups0.other)
          .find(x => new RegExp(re2, "i").test(String(x[2].l)));
        if (hit) { r.errors.push("paivitys tarjottiin vaikka ei saisi: " +
          String(hit[2].l) + " (" + re2 + ")"); return null; }
      }
      for (const sel of (spec.ups || [])) {
        const ups = api.upgradesFor(u);
        const row = ups.own.concat(ups.other).find(x => new RegExp(sel.upgrade, "i").test(String(x[2].l)));
        if (!row) { r.errors.push("paivitysta ei tarjota: " + sel.upgrade); return null; }
        api.setUpState(u, row[0], row[1], sel.state || "take");
      }
      /* no_ups_after: rivia ei saa tarjota enaa OSTOJEN jalkeen. Sama ostos
         kahdella nimella (miehistot, pistokoe 20 siemen 2026091443). */
      for (const re2 of (spec.no_ups_after || [])) {
        const ups1 = api.upgradesFor(u);
        const hit = ups1.own.concat(ups1.other).find(x => new RegExp(re2, "i").test(String(x[2].l)));
        if (hit) { r.errors.push("paivitys tarjottiin ostojen jalkeen vaikka ei saisi: " + String(hit[2].l) + " (" + re2 + ")"); return null; }
      }
      /* ups_described: tarjotulla rivilla on kirjan lause kuvauksena.
         Isannan rivit menettivat sen (pistokoe 20 siemen 2026091443). */
      for (const re2 of (spec.ups_described || [])) {
        const R0 = api.resolveUnit(u);
        const row = (R0 && R0.upgrades || []).find(x => new RegExp(re2, "i").test(String(x.label)));
        if (!row) { r.errors.push("kuvattavaa rivia ei tarjota: " + re2); return null; }
        if (!String(row.description || "").trim()) { r.errors.push("rivilta puuttuu kuvaus: " + row.label); return null; }
      }
    }
  }
  for (const a of aboardSpecs) {
    if (a.cmd != null) {
      const w = S.units.filter(x => (api.resolveUnit(x) || {}).kind === "commander")[a.cmd];
      if (!w || !w.uid) { r.errors.push("cmd: komentajaa " + a.cmd + " ei ole (tai uid puuttuu)"); return null; }
      a.u.cmd = w.uid;
      continue;
    }
    const re = new RegExp(a.re, "i");
    const t = S.units.find(x => x !== a.u && re.test(String((api.resolveUnit(x).entry || {}).label || "")));
    if (!t) { r.errors.push("aboard-kohdetta ei ole laivastossa: " + a.re); return null; }
    if (!t.uid) { r.errors.push("yksikolla ei ole uid-tunnistetta (J215)"); return null; }
    a.u.aboard = t.uid;
  }
  return S;
}

/* Tarkistusrivin tunnistus: kirjan lause (src, alimerkkijono saannon
   src-kentasta) tai otsikon regex (label). Kumpikin saa osua tasan yhteen
   riviin - kaksi osumaa on yhta paha kuin nolla, koska silloin tapaus ei
   kerro kummasta saannosta se puhuu. */
function matchCheckRow(row, x) {
  if (x.src && norm(row.s || "").toLowerCase().indexOf(norm(x.src).toLowerCase()) < 0) return false;
  if (x.label && !new RegExp(x.label, "i").test(String(row.t || ""))) return false;
  return !!(x.src || x.label);
}
const keyOfCheck = x => (x.src ? '"' + String(x.src).slice(0, 44) + '"' : "/" + x.label + "/");

const FLEET_EXPECT_KEYS = ["aboard", "checks", "facts", "failing", "no_issues",
                          "others_ok", "total"];

function runFleetCase(c) {
  const r = { id: c.id, page: c.page, status: c.status || "expect_pass",
              task: c.task || null, errors: [], total: null, checks: [], notes: [] };
  if (!c.fleet || !c.fleet.list) { r.errors.push("tapaukselta puuttuu fleet.list"); return r; }
  if (!buildFleet(c.fleet, r)) return r;
  const e = c.expect || {};
  /* Tuntematon odotusavain on vaarallisempi kuin puuttuva odotus: se
     nayttaa tapaukselta joka valvoo jotain, mutta ajuri ei lue sita
     lainkaan. Nain kavi Xenos-verrokille - se kirjoitettiin muodossa
     expect.absent, kun tuettu muoto on checks[].absent, ja tapaus meni
     lapi myos taysin rikotulla saannolla. */
  Object.keys(e).forEach(function(k){
    if (FLEET_EXPECT_KEYS.indexOf(k) < 0)
      r.errors.push("tuntematon expect-avain: " + k); });
  const cs = api.checks();
  if (e.total != null) {
    const t = api.total();
    if (t !== e.total) r.total = t + " != " + e.total;
  }
  const claimed = [];
  (e.checks || []).forEach(x => {
    const hits = cs.filter(row => matchCheckRow(row, x));
    /* absent: rivia EI saa olla. Verrokkitapaus kiellolle, joka koskee vain
       osaa lahdelistan riveista (Armageddonin Space Marine -alukset, s.41). */
    if (x.absent) {
      if (hits.length) r.checks.push("tarkistusrivi " + keyOfCheck(x) + ": ei saisi olla, osumia " + hits.length);
      return;
    }
    if (x.nth != null ? !hits[x.nth] : hits.length !== 1) {
      r.checks.push("tarkistusrivi " + keyOfCheck(x) + ": osumia " + hits.length); return; }
    const row = hits[x.nth != null ? x.nth : 0];
    claimed.push(row);
    if (x.ok != null && !!row.ok !== !!x.ok)
      r.checks.push(keyOfCheck(x) + ": ok=" + !!row.ok + " != " + !!x.ok + " (" + row.v + ")");
    if (x.v != null && norm(row.v) !== norm(x.v))
      r.checks.push(keyOfCheck(x) + ": arvo '" + row.v + "' != '" + x.v + "'");
    if (x.warn != null && !!row.warn !== !!x.warn)
      r.checks.push(keyOfCheck(x) + ": warn=" + !!row.warn + " != " + !!x.warn);
  });
  /* Laivaston tiedot (J214): attack rating, vastustajan ilmaiset lisat ja
     VP-arvot. Ne eivat ole tarkistuksia vaan laskettua tietoa, joten oma
     lista; tunnistus kuten tarkistusrivilla (label tai src, tasan yksi). */
  if (e.facts) {
    const fs0 = api.fleetFacts ? api.fleetFacts() : null;
    if (!fs0) r.checks.push("sovelluksessa ei ole fleetFacts()-funktiota");
    else e.facts.forEach(x => {
      const hits = fs0.filter(row => matchCheckRow(row, x));
      if (x.absent) {
        if (hits.length) r.checks.push("tietorivi " + keyOfCheck(x) + ": ei saisi olla, osumia " + hits.length);
        return;
      }
      if (hits.length !== 1) { r.checks.push("tietorivi " + keyOfCheck(x) + ": osumia " + hits.length); return; }
      if (x.v != null && norm(hits[0].v) !== norm(x.v))
        r.checks.push(keyOfCheck(x) + ": arvo '" + hits[0].v + "' != '" + x.v + "'");
      if (x.warn != null && !!hits[0].warn !== !!x.warn)
        r.checks.push(keyOfCheck(x) + ": warn=" + !!hits[0].warn + " != " + !!x.warn);
    });
  }
  /* Komentajan sijoitus (J215): kenen aluksella hän on (ship = rivin
     regex, null = ei mitaan), ja montako alusta saanto sallii (choices). */
  if (e.aboard) {
    const ab = api.fleetAboard ? api.fleetAboard() : null;
    if (!ab) r.checks.push("sovelluksessa ei ole fleetAboard()-funktiota");
    else e.aboard.forEach(x => {
      const re = new RegExp(x.cmd, "i");
      const hits = ab.filter(a => re.test(String(a.cmd)));
      const a = hits[x.nth != null ? x.nth : 0];
      if (!a || (x.nth == null && hits.length !== 1)) {
        r.checks.push("sijoitus /" + x.cmd + "/: osumia " + hits.length); return; }
      if (x.ship !== undefined && (x.ship === null ? a.ship !== null : !new RegExp(x.ship, "i").test(String(a.ship))))
        r.checks.push("sijoitus /" + x.cmd + "/: alus '" + a.ship + "' != /" + x.ship + "/");
      if (x.choices != null && a.choices.length !== x.choices)
        r.checks.push("sijoitus /" + x.cmd + "/: vaihtoehtoja " + a.choices.length + " != " + x.choices +
                      " (" + a.choices.join(", ") + ")");
    });
  }
  if (e.others_ok)
    cs.filter(row => !row.ok && claimed.indexOf(row) < 0).forEach(row =>
      r.checks.push("odottamaton punainen: " + row.t + " (" + row.v + ")"));
  if (e.failing != null) {
    const n = cs.filter(row => !row.ok).length;
    if (n !== e.failing) r.checks.push("punaisia rivaja " + n + " != " + e.failing);
  }
  /* Yksikkotason virheet: laillinen osto ei saa nakya punaisena. Pistokoe
     20 (siemen 2026091412): isantalistan paivitys hinnoittui oikein mutta
     validateIntent ei tuntenut isantalistaa ja antoi upgrade.unknown_id. */
  if (e.no_issues) {
    api.getS().units.forEach((u, i) => {
      const R = api.resolveUnit(u);
      (R && R.issues || []).forEach(x => r.checks.push("yksikko " + i + " issue " + x.code + ": " + x.message));
    });
  }
  /* Tallennuskierros koko laivastolle: sama laivasto, samat tarkistukset.
     Tallennusmuodon muutos (skeema 3) nakyy tassa heti. */
  if (e.save_roundtrip !== false) {
    const before = { t: api.total(), c: JSON.stringify(cs) };
    STORE = {};
    api.save(); api.load();
    const after = { t: api.total(), c: JSON.stringify(api.checks()) };
    if (before.t !== after.t) r.checks.push("tallennuskierros: pisteet " + before.t + " != " + after.t);
    else if (before.c !== after.c) r.checks.push("tallennuskierros: tarkistukset muuttuivat");
  }
  return r;
}

const fleetResults = FCASES.cases.map(runFleetCase);
const fleetBad = r => (r.total ? 1 : 0) + r.errors.length + r.checks.length;
let fleetFail = 0, fleetGapOpen = 0, fleetGapClosed = 0;
fleetResults.forEach(r => {
  const n = fleetBad(r);
  if (r.status === "gap") { if (n) fleetGapOpen++; else fleetGapClosed++; }
  else if (n) fleetFail++;
});

/* --- ajo -------------------------------------------------------------- */
const results = CASES.cases.map(run);
const bad = r => (r.points ? 1 : 0) + r.profile.length + r.surfaces.length;

let failPass = 0, gapOpen = 0, gapClosed = 0, surfaceOnly = 0, surfaceCases = 0;
results.forEach(r => {
  const n = bad(r);
  if (r.surfaces.length) surfaceCases++;
  if (r.status === "gap") { if (n) gapOpen++; else gapClosed++; }
  else if (n) { failPass++; if (!r.points && !r.profile.length) surfaceOnly++; }
});

if (AS_JSON) {
  console.log(JSON.stringify({
    total: results.length, fail: failPass, gap_open: gapOpen,
    gap_closed: gapClosed, surface_only: surfaceOnly,
    surface_disagreements: surfaceCases, cases: results,
    fleet_total: fleetResults.length, fleet_fail: fleetFail,
    fleet_gap_open: fleetGapOpen, fleet_gap_closed: fleetGapClosed,
    fleet_cases: fleetResults,
  }, null, 1));
  process.exit(failPass || fleetFail ? 1 : 0);
}

const pad = (s, n) => String(s).slice(0, n).padEnd(n);
const mark = (s, ok) => (ok ? "OK" : s);
console.log("GOLDEN-TAPAUKSET  " + results.length + " kpl, luettu kirjasta");
console.log("(lahde: " + CASES._lahde + ")\n");
console.log("  " + pad("tapaus", 32) + pad("sivu", 6) + pad("hinta", 7)
            + pad("profiili", 9) + "pinnat");
console.log("  " + "-".repeat(70));
results.forEach(r => {
  const st = r.status === "gap" ? (bad(r) ? "GAP" : "AUKI") : "EI";
  console.log("  " + pad(r.id, 32) + pad("s." + r.page, 6)
    + pad(mark(st, !r.points), 7)
    + pad(mark(st, !r.profile.length), 9)
    + pad(mark(st, !r.surfaces.length), 8)
    + (r.status === "gap" ? (r.task || "") : (r.notes[0] || "")));
  if (VERBOSE || (r.status !== "gap" && bad(r))) {
    if (r.points) console.log("       hinta    " + r.points);
    r.profile.forEach(m => console.log("       profiili " + m));
    r.surfaces.forEach(m => console.log("       PINNAT   " + m));
  }
});
console.log("");
console.log("  odotettu lapi, epaonnistui : " + failPass
  + (surfaceOnly ? "  (joista " + surfaceOnly + " vain pintojen erimielisyys)" : ""));
console.log("  tiedettyja aukkoja auki    : " + gapOpen);
if (gapClosed)
  console.log("  AUKI-merkitty meni lapi    : " + gapClosed
    + "  -> paivita status golden_cases.jsoniin");

console.log("");
console.log("LAIVASTOTASON TAPAUKSET  " + fleetResults.length + " kpl, luettu kirjasta");
console.log("(lahde: " + FCASES._lahde + ")\n");
console.log("  " + pad("tapaus", 40) + pad("sivu", 6) + pad("summa", 7) + "tarkistukset");
console.log("  " + "-".repeat(72));
fleetResults.forEach(r => {
  const st = r.status === "gap" ? (fleetBad(r) ? "GAP" : "AUKI") : "EI";
  console.log("  " + pad(r.id, 40) + pad("s." + r.page, 6)
    + pad(mark(st, !r.total), 7)
    + pad(mark(st, !r.checks.length && !r.errors.length), 8)
    + (r.status === "gap" ? (r.task || "") : (r.notes[0] || "")));
  if (VERBOSE || (r.status !== "gap" && fleetBad(r))) {
    if (r.total) console.log("       summa     " + r.total);
    r.errors.forEach(m => console.log("       rakenne   " + m));
    r.checks.forEach(m => console.log("       tarkistus " + m));
  }
});
console.log("");
console.log("  odotettu lapi, epaonnistui : " + fleetFail);
console.log("  tiedettyja aukkoja auki    : " + fleetGapOpen);
if (fleetGapClosed)
  console.log("  AUKI-merkitty meni lapi    : " + fleetGapClosed
    + "  -> paivita status golden_fleet_cases.jsoniin");
process.exit(failPass || fleetFail ? 1 : 0);
