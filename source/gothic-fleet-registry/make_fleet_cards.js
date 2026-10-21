/* Laivastojen korttiarkit PDF:ksi suoraan sovelluksella.
 *
 * Kortteja EI piirreta uudestaan: skripti ottaa kopion tiedostosta
 * "Gothic Fleet Registry.html", ruiskuttaa loppuun pienen kaynnistysskriptin
 * joka rakentaa rosterin ja kutsuu sovelluksen omaa buildCardSheet():a, ja
 * tulostaa sivun headless-Chromella PDF:ksi. Tulos on tasmalleen sama kuin
 * jos kayttaja avaisi sovelluksen, rakentaisi laivaston ja painaisi
 * "Print cards" -> Tallenna PDF:na. Ainoa lisays on arkin otsikko ja
 * inventaariorivi sivun ylareunassa (fleet_card_sheets.js: title, sub).
 *
 * Miksi nain eika node-generaattorilla: kortin lohkot sovitetaan MITTAAMALLA
 * (fitCards), ja mittaaminen vaatii oikean selaimen. Node-DOM antaisi vaarat
 * skaalat.
 *
 * Arkkien maaritykset: fleet_card_sheets.js.
 *
 * Jokainen arkki ajetaan kahdesti. Ensin --dump-dom, josta luetaan
 * tarkistusraportti: kortit, hinnat, rastitetut ja auki jaavat valinnat,
 * sovelluksen omat ongelmailmoitukset ja kortin sovitus (ylivuoto, pienin
 * skaala). Jos jokin kortti vuotaa yli tai sovellus ilmoittaa virheen,
 * arkkia ei kirjoiteta. Sitten --print-to-pdf valiaikaistiedostoon, joka
 * siirretaan lopulliseen nimeen vasta onnistuneen tulostuksen jalkeen.
 *
 * Aja:  node make_fleet_cards.js                  kaikki arkit
 *       node make_fleet_cards.js admech orks      vain nama
 *       node make_fleet_cards.js --list           arkkien avaimet
 *       node make_fleet_cards.js --check-only     raportti ilman PDF:aa
 *       node make_fleet_cards.js --check-only --json=raportti.json
 *                                                 + tilastot ja aseet JSONiin
 *       node make_fleet_cards.js crusade --keep-html
 */
const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync } = require("child_process");

const HERE = __dirname;
const APP = path.join(HERE, "Gothic Fleet Registry.html");
const SHEETS = require("./fleet_card_sheets.js");

/* Pienin hyvaksytty lohkon skaala. layout_check.js:n luettavuusraja on
   4,2 pt; kortin pienin teksti on noin 5,6 pt, joten 0,75 on sama raja. */
const MIN_ZONE = 0.75;

/* Tarkistusraportit arkeittain; --json=TIEDOSTO kirjoittaa ne levylle. */
const REPORTS = {};

const CHROMES = [
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
];

function chrome() {
  const hit = CHROMES.find(p => fs.existsSync(p));
  if (!hit) throw new Error("headless-selainta ei loydy: " + CHROMES.join(", "));
  return hit;
}

/* RegExp ei kulje JSON:ssa sellaisenaan. */
const rxj = r => ({ s: r.source, f: r.flags });
const rules = list => (list || []).map(([r, st]) => [rxj(r), st]);

/* Kaynnistysskripti ajetaan sovelluksen oman koodin JALKEEN, joten S,
 * LISTS, applyRequired, setOptState, setUpState, resolveUnit ja
 * buildCardSheet ovat nakyvissa. */
function bootstrap(spec) {
  const s = JSON.stringify({
    list: rxj(spec.list), limit: spec.limit, kind: spec.kind || "cards",
    title: spec.title || "", sub: spec.sub || "", ups: rules(spec.ups),
    units: spec.units.map(u => ({
      row: rxj(u.row), name: u.name || "", n: u.n || 1,
      hull: u.hull ? rxj(u.hull) : null,
      members: u.members || [], opt: rules(u.opt), rest: u.rest || "",
      ups: rules(u.ups),
    })),
  });
  return `(function(){
  var SPEC = ${s};
  var report = { cards: [], layout: [], problems: [] };
  function rx(r){ return new RegExp(r.s, r.f); }
  function publish(){ document.body.dataset.report = JSON.stringify(report); }
  function fail(m){ report.error = m; publish(); document.title = "ERROR: " + m; throw new Error(m); }
  var li = LISTS.findIndex(function(L){ return rx(SPEC.list).test(L.nm); });
  if(li < 0) fail("listaa ei loydy: " + SPEC.list.s);
  S.li = li; S.limit = SPEC.limit; S.units = [];
  report.list = LISTS[li].nm;

  /* Listan paivitykset haetaan sovelluksen omasta tarjonnasta, ei listan
     riveista: sama nimi voi olla usealla rivilla (Mark of Khorne kolmesti),
     ja riippuvainen rivi tulee tarjolle vasta kun sen ehto on otettu. */
  function offered(u, r){
    return (resolveUnit(u).upgrades || []).filter(function(x){ return r.test(x.label || ""); });
  }
  function setUp(u, x, st){
    var k = String(x.key).split(":");
    setUpState(u, +k[0], +k[1], st);
  }

  SPEC.units.forEach(function(spec){
    var r = rx(spec.row), hit = null;
    LISTS[li].secs.forEach(function(sec, si){ sec.ents.forEach(function(en, ei){
      /* Alusrivi tai komentajarivi: komentaja saa oman korttinsa. Rungoton
         saantokorttirivi (orbital mine, minefield: en.rc, J170) kelpaa myos. */
      if(!hit && (en.r || en.k === "cmd" || en.rc) && r.test(en.l || "")) hit = { si: si, ei: ei, en: en };
    }); });
    if(!hit) fail("rivia ei loydy: " + spec.row.s);
    var label = spec.name || hit.en.l;
    var u = { s: hit.si, e: hit.ei, ref: hit.en.r || null, n: spec.n, opts: [], os: {},
              name: spec.name, note: "" };
    if(spec.members.length) u.members = spec.members.join(", ");
    /* Rungon valintarivi (Venerable battle barge): runko nimen perusteella
       rivin omasta hulls-listasta, ennen optioita - setHull nollaa ne. */
    if(spec.hull){
      var hr = rx(spec.hull);
      var href = (hit.en.hulls || []).find(function(r){ return SHIPS[r] && hr.test(SHIPS[r].nm); });
      if(!href) fail(label + ": runkoa ei tarjota: " + spec.hull.s);
      setHull(u, href);
      label += " / " + SHIPS[href].nm;
    }
    applyRequired(u);

    /* Aluksen omat optiot tekstin perusteella; indeksit eivat kesta datan
       muutoksia. */
    var sh = shipOf(u), ol = (sh && sh.ol) || [];
    spec.opt.forEach(function(rule){
      var rr = rx(rule[0]), got = 0;
      ol.forEach(function(o, i){ if(rr.test(String(o.t || ""))){ setOptState(u, i, rule[1]); got++; } });
      if(!got) fail(label + ": optiota ei loydy: " + rule[0].s);
    });
    if(spec.rest) ol.forEach(function(o, i){
      var named = spec.opt.some(function(rule){ return rx(rule[0]).test(String(o.t || "")); });
      if(!named) setOptState(u, i, spec.rest);
    });

    /* Kortin omat paivitykset ensin (identiteetti), sitten arkin oletukset
       niille joita kortti ei itse nimea. Pakollinen rasti pysyy. */
    spec.ups.forEach(function(rule){
      var hits = offered(u, rx(rule[0]));
      if(!hits.length) fail(label + ": paivitysta ei tarjota: " + rule[0].s);
      hits.forEach(function(x){ setUp(u, x, rule[1]); });
    });
    SPEC.ups.forEach(function(rule){
      offered(u, rx(rule[0])).forEach(function(x){
        if(x.required) return;
        if(spec.ups.some(function(y){ return rx(y[0]).test(x.label); })) return;
        setUp(u, x, rule[1]);
      });
    });

    var R = resolveUnit(u);
    if(!R) fail(label + ": resolveUnit ei ratkaise");
    var errs = (R.issues || []).filter(function(x){ return x.severity === "error"; });
    if(errs.length) fail(label + ": " + errs.map(function(x){ return x.message; }).join("; "));
    var mark = function(st){ return st === "take" ? "X" : "_"; };
    report.cards.push({
      name: label, row: hit.en.l, kind: R.kind, n: u.n,
      /* Linnake tulostuu kahtena korttina (pohja + saannot), saantokortti
         yhtena: sovelluksen oma unitCards() kertoo maaran. */
      card: R.card || "", sheetCards: unitCards(u).length,
      points: R.points, max: R.maxPoints,
      opts: (R.options || []).filter(function(o){ return o.state !== "off"; })
        .map(function(o){ return mark(o.state) + " " + String(o.text || "").slice(0, 70) + " (" + o.cost + ")"; }),
      ups: (R.upgrades || []).filter(function(x){ return x.state !== "off"; })
        .map(function(x){ return mark(x.state) + " " + x.label + " (" + x.cost + (x.per ? "/" + x.per : "") + ")"; }),
      issues: (R.issues || []).map(function(x){ return x.message; }),
      /* Vertailua varten (--json): tilastorivi ja aserivit sellaisinaan. */
      stats: R.stats || null,
      lead: R.leadership ? R.leadership.value : null,
      weapons: (R.weapons || []).map(function(w){ return [w.state].concat(w.a || []); }),
    });
    S.units.push(u);
  });

  /* Arkin otsikko ja inventaariorivi. Kortit alkavat 16,3 mm:sta, joten
     kaksi 5,6 pt:n rivia mahtuu 10,2 mm:n kohdalle. */
  function header(){
    if(!SPEC.title && !SPEC.sub) return;
    var st = document.createElement("style");
    st.textContent = ".pgsub{position:absolute;left:12mm;right:12mm;top:10.2mm;" +
      "font:400 5.6pt/1.3 var(--sans);color:#6B6769;max-height:5.3mm;overflow:hidden}";
    document.head.appendChild(st);
    [].forEach.call(document.querySelectorAll("#sheet .page"), function(pg){
      var b = pg.querySelector(".pghead b");
      if(SPEC.title && b) b.textContent = SPEC.title;
      if(SPEC.sub){
        var d = document.createElement("div");
        d.className = "pgsub"; d.textContent = SPEC.sub; pg.appendChild(d);
      }
    });
  }
  function layout(){
    [].forEach.call(document.querySelectorAll("#sheet .k"), function(card){
      var zones = [].slice.call(card.querySelectorAll(".fit-content"));
      var h = card.querySelector(".k-hd h3") || card.querySelector("h3");
      report.layout.push({
        name: h ? h.textContent : "?",
        options: +(card.dataset.optionCount || 0),
        cardScale: +(card.dataset.cardScale || 1),
        overflow: card.dataset.contentOverflow === "true" ||
                  zones.some(function(z){ return z.dataset.fitOverflow === "true"; }),
        minZone: Math.min.apply(null, [1].concat(zones.map(function(z){ return +(z.dataset.fitScale || 1); })))
      });
    });
    var sub = document.querySelector("#sheet .pgsub");
    if(sub && sub.scrollHeight > sub.clientHeight + 1)
      report.problems.push("inventaariorivi ei mahdu kahdelle rivilleen");
  }
  /* Arkin korttijarjestys yksikoittain: sama sivutus kuin sovelluksen
     cardSheetPages() - yksittainen kortti tayttaa avoimen sivun, monen
     kortin yksikko (linnake) saa omat sivunsa. DOM-jarjestys ei siis ole
     yksikkojarjestys, kun linnake on parittomassa kohdassa. */
  function order(){
    var pages = [], open = -1;
    S.units.forEach(function(u, ui){
      var k = unitCards(u).length;
      if(k === 1){
        if(open >= 0){ pages[open].push(ui); open = -1; }
        else{ pages.push([ui]); open = pages.length - 1; }
      }else for(var i = 0; i < k; i += 2) pages.push(k - i >= 2 ? [ui, ui] : [ui]);
    });
    report.order = [].concat.apply([], pages);
  }
  function go(){
    order();
    if(SPEC.kind === "roster"){
      window.print = function(){};      /* tulostuksen hoitaa selain itse */
      printRoster();
      publish();
      document.title = "ready roster " + S.units.length;
      return;
    }
    var n = buildCardSheet();
    if(!n) fail("buildCardSheet ei tuottanut kortteja");
    header();
    /* Kuten printCards(): fontit latautuvat vasta kortin tekstin myota, joten
       arkki sovitetaan uudelleen kun ne ovat perilla. */
    var done = function(){
      fitCards(); layout(); publish();
      document.body.dataset.cardCount = n;
      document.title = "ready " + n;
    };
    if(document.fonts && document.fonts.ready) document.fonts.ready.then(done, done);
    else done();
  }
  if(document.fonts && document.fonts.ready)
    document.fonts.ready.then(go, go);
  else go();
})();`;
}

function runChrome(args, capture) {
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), "bfgcards-"));
  try {
    return execFileSync(chrome(), [
      "--headless=new", "--disable-gpu", "--no-pdf-header-footer",
      "--user-data-dir=" + profile, "--virtual-time-budget=20000", ...args,
    ], capture ? { encoding: "utf8", maxBuffer: 512 * 1024 * 1024,
                   stdio: ["ignore", "pipe", "ignore"] }
               : { stdio: "ignore" });
  } finally {
    fs.rmSync(profile, { recursive: true, force: true });
  }
}

function unescapeAttr(s) {
  return s.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, "<")
          .replace(/&gt;/g, ">").replace(/&nbsp;/g, "\u00a0").replace(/&amp;/g, "&");
}

/* Tarkistusraportti sivun DOMista. Palauttaa ongelmat; tulostaa korttirivit. */
function check(key, spec, url) {
  const dom = runChrome(["--dump-dom", url], true);
  const title = (dom.match(/<title>([^<]*)<\/title>/) || [])[1] || "";
  const m = dom.match(/data-report="([^"]*)"/);
  if (!m) throw new Error(key + ": raporttia ei syntynyt (title: " + title + ")");
  const rep = JSON.parse(unescapeAttr(m[1]));
  if (rep.error) throw new Error(key + ": " + rep.error);
  REPORTS[key] = rep;

  const problems = rep.problems.slice();
  /* Yksikon kortit DOM-jarjestyksesta: rep.order[j] = j:nnen kortin yksikko.
     Linnakkeella on kaksi korttia, joten sovitus luetaan niista huonoimman
     mukaan. */
  const order = rep.order || rep.cards.map((c, i) => i);
  const want = rep.cards.reduce((a, c) => a + (c.sheetCards || 1), 0);
  console.log("\n== " + key + "  [" + rep.list + "]  " + rep.cards.length + " yksikkoa, " +
              want + " korttia");
  rep.cards.forEach((c, i) => {
    const lays = rep.layout.filter((l, j) => order[j] === i);
    const lay = lays.length ? {
      overflow: lays.some(l => l.overflow),
      minZone: Math.min(...lays.map(l => l.minZone)),
    } : {};
    const pts = c.max > c.points ? c.points + "-" + c.max : String(c.points);
    const fit = lay.minZone != null ? " fit " + lay.minZone.toFixed(2) : "";
    const kind = c.card && c.card !== "capital" ? " [" + c.card +
                 (c.sheetCards > 1 ? " x" + c.sheetCards : "") + "]" : "";
    console.log("  " + (c.name + (c.n > 1 ? " x" + c.n : "")).padEnd(34) +
                c.row.slice(0, 30).padEnd(31) + pts.padStart(8) + " pts" + fit + kind);
    c.opts.concat(c.ups).forEach(t => console.log("      " + t));
    c.issues.forEach(t => console.log("      ! " + t));
    if (spec.kind !== "roster" && lays.length !== (c.sheetCards || 1))
      problems.push(c.name + ": kortteja arkilla " + lays.length + ", odotettu " + (c.sheetCards || 1));
    if (lay.overflow) problems.push(c.name + ": sisalto vuotaa yli");
    if (lay.minZone < MIN_ZONE)
      problems.push(c.name + ": lohkon skaala " + lay.minZone.toFixed(2) + " < " + MIN_ZONE);
  });
  if (spec.kind !== "roster" && rep.layout.length !== want)
    problems.push("kortteja " + rep.layout.length + ", maaritelty " + want);
  return problems;
}

function build(key, opts) {
  const spec = SHEETS[key];
  if (!spec) throw new Error("tuntematon arkki: " + key + " (--list)");
  const app = fs.readFileSync(APP, "utf8");
  const at = app.lastIndexOf("</body>");
  if (at < 0) throw new Error("sovelluksesta ei loydy </body>");
  /* Tagi kootaan paloista: kirjaimellinen avaustagi tassa tiedostossa ei
     haittaa, mutta pidetaan sama tapa kuin sovelluksessa. */
  const page = app.slice(0, at) + "<scr" + "ipt>\n" + bootstrap(spec) +
               "\n</scr" + "ipt>\n" + app.slice(at);
  const tmpHtml = path.join(HERE, "_fleet_cards_" + key + ".html");
  fs.writeFileSync(tmpHtml, page, "utf8");
  const url = "file:///" + encodeURI(tmpHtml.replace(/\\/g, "/"));

  try {
    const problems = check(key, spec, url);
    if (problems.length) {
      problems.forEach(p => console.log("  !! " + p));
      throw new Error(key + ": " + problems.length + " ongelmaa, arkkia ei kirjoitettu");
    }
    if (opts.checkOnly) return;

    fs.mkdirSync(path.dirname(spec.out), { recursive: true });
    const tmpPdf = spec.out.replace(/\.pdf$/i, ".tmp.pdf");
    runChrome(["--print-to-pdf=" + tmpPdf, url], false);
    if (!fs.existsSync(tmpPdf) || fs.statSync(tmpPdf).size < 10000)
      throw new Error(key + ": PDF jai syntymatta");
    /* Drive-synkattu kansio tai auki oleva PDF-katselin voi kieltaa
       renamen (EPERM); kopio korvaa tiedoston sisallon silloinkin. Jos
       sekin kaatuu, valiaikainen PDF jaa talteen ja virhe kertoo sen. */
    try { fs.renameSync(tmpPdf, spec.out); }
    catch (e) {
      try { fs.copyFileSync(tmpPdf, spec.out); fs.unlinkSync(tmpPdf); }
      catch (e2) {
        throw new Error(key + ": " + path.basename(spec.out) + " on lukittu (auki " +
                        "katselimessa?) - uusi arkki jai tiedostoon " + path.basename(tmpPdf));
      }
    }
    const kb = fs.statSync(spec.out).size / 1024;
    console.log("  -> " + kb.toFixed(0) + " kB  " + path.relative(HERE, spec.out));
  } finally {
    if (!opts.keepHtml) fs.unlinkSync(tmpHtml);
  }
}

const args = process.argv.slice(2);
if (args.includes("--list")) {
  Object.keys(SHEETS).forEach(k => console.log(k.padEnd(18) + path.basename(SHEETS[k].out)));
  process.exit(0);
}
const opts = { keepHtml: args.includes("--keep-html"), checkOnly: args.includes("--check-only") };
const jsonOut = (args.find(a => a.startsWith("--json=")) || "").slice(7);
const keys = args.filter(a => !a.startsWith("--"));
let failed = 0;
(keys.length ? keys : Object.keys(SHEETS)).forEach(k => {
  try { build(k, opts); }
  catch (e) { failed++; console.log("VIRHE " + e.message); }
});
if (jsonOut) fs.writeFileSync(jsonOut, JSON.stringify(REPORTS, null, 1), "utf8");
if (failed) { console.log("\n" + failed + " arkkia epaonnistui"); process.exit(1); }
