/* Fleet card sheets to PDF, made directly with the app.
 *
 * The cards are NOT drawn again: the script takes a copy of the built page
 * (dist/registry/index.html), appends a small startup script that builds
 * the roster and calls the app's own buildCardSheet(), and prints the page
 * to PDF with headless Chrome. The result is exactly the same as if the user
 * opened the app, built the fleet and pressed "Print cards" -> Save as PDF.
 * The only addition is the sheet title and the inventory line at the top of
 * the page (fleet_card_sheets.js: title, sub).
 *
 * Why this way and not with a Node generator: the card blocks are fitted by
 * MEASURING (fitCards), and measuring needs a real browser. A Node DOM would give
 * wrong scales.
 *
 * Sheet definitions: fleet_card_sheets.js.
 *
 * Every sheet runs twice. First --dump-dom, which yields the
 * check report: the cards, prices, ticked and open choices,
 * the app's own problem notices and the card fit (overflow, smallest
 * scale). If any card overflows or the app reports an error, the
 * sheet is not written. Then --print-to-pdf into a temporary file, which
 * is moved to its final name only after a successful print.
 *
 * Run:  node make_fleet_cards.js                  every sheet
 *       node make_fleet_cards.js admech orks      only these
 *       node make_fleet_cards.js --list           the sheet keys
 *       node make_fleet_cards.js --check-only     the report without a PDF
 *       node make_fleet_cards.js --check-only --json=report.json
 *                                                 + stats and weapons as JSON
 *       node make_fleet_cards.js crusade --keep-html
 */
const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync } = require("child_process");

const HERE = __dirname;
/* The built page (npm run build); the sheet script is appended to it. */
const { PAGE: APP, PAGE_GLOBALS_JS } = require("./test-support.js");
const SHEETS = require("./fleet_card_sheets.js");

/* The smallest accepted block scale. layout_check.js's readability floor is
   4.2 pt; the card's smallest text is about 5.6 pt, so 0.75 is the same limit. */
const MIN_ZONE = 0.75;

/* Check reports per sheet; --json=FILE writes them to disk. */
const REPORTS = {};

const chrome = () => require("../../tools/lib/chrome.js").findChrome();

/* A RegExp does not travel in JSON as such. */
const rxj = r => ({ s: r.source, f: r.flags });
const rules = list => (list || []).map(([r, st]) => [rxj(r), st]);

/* The startup script runs AFTER the app's own code, so S,
 * LISTS, applyRequired, setOptState, setUpState, resolveUnit and
 * buildCardSheet are visible (PAGE_GLOBALS_JS exposes them on window). */
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
  if(li < 0) fail("list not found: " + SPEC.list.s);
  S.li = li; S.limit = SPEC.limit; S.units = [];
  report.list = LISTS[li].nm;

  /* List upgrades are taken from the app's own offer, not from the list's
     rows: the same name may be on several rows (Mark of Khorne three times),
     and a dependent row is offered only once its condition is taken. */
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
      /* A ship row or a commander row: a commander gets its own card. A hull-less
         rule card row (orbital mine, minefield: en.rc, J170) is accepted too. */
      if(!hit && (en.r || en.k === "cmd" || en.rc) && r.test(en.l || "")) hit = { si: si, ei: ei, en: en };
    }); });
    if(!hit) fail("row not found: " + spec.row.s);
    var label = spec.name || hit.en.l;
    var u = { s: hit.si, e: hit.ei, ref: hit.en.r || null, n: spec.n, opts: [], os: {},
              name: spec.name, note: "" };
    if(spec.members.length) u.members = spec.members.join(", ");
    /* A hull choice row (Venerable battle barge): the hull by name from the
       row's own hulls list, before the options - setHull resets them. */
    if(spec.hull){
      var hr = rx(spec.hull);
      var href = (hit.en.hulls || []).find(function(r){ return SHIPS[r] && hr.test(SHIPS[r].nm); });
      if(!href) fail(label + ": hull not offered: " + spec.hull.s);
      setHull(u, href);
      label += " / " + SHIPS[href].nm;
    }
    applyRequired(u);

    /* The ship's own options by text; indexes do not survive changes in
       the data. */
    var sh = shipOf(u), ol = (sh && sh.ol) || [];
    spec.opt.forEach(function(rule){
      var rr = rx(rule[0]), got = 0;
      ol.forEach(function(o, i){ if(rr.test(String(o.t || ""))){ setOptState(u, i, rule[1]); got++; } });
      if(!got) fail(label + ": option not found: " + rule[0].s);
    });
    if(spec.rest) ol.forEach(function(o, i){
      var named = spec.opt.some(function(rule){ return rx(rule[0]).test(String(o.t || "")); });
      if(!named) setOptState(u, i, spec.rest);
    });

    /* The card's own upgrades first (identity), then the sheet defaults
       for those the card does not name itself. A required tick stays. */
    spec.ups.forEach(function(rule){
      var hits = offered(u, rx(rule[0]));
      if(!hits.length) fail(label + ": upgrade not offered: " + rule[0].s);
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
    if(!R) fail(label + ": resolveUnit does not resolve");
    var errs = (R.issues || []).filter(function(x){ return x.severity === "error"; });
    if(errs.length) fail(label + ": " + errs.map(function(x){ return x.message; }).join("; "));
    var mark = function(st){ return st === "take" ? "X" : "_"; };
    report.cards.push({
      name: label, row: hit.en.l, kind: R.kind, n: u.n,
      /* A fort prints as two cards (plan + rules), a rule card
         as one: the app's own unitCards() gives the count. */
      card: R.card || "", sheetCards: unitCards(u).length,
      points: R.points, max: R.maxPoints,
      opts: (R.options || []).filter(function(o){ return o.state !== "off"; })
        .map(function(o){ return mark(o.state) + " " + String(o.text || "").slice(0, 70) + " (" + o.cost + ")"; }),
      ups: (R.upgrades || []).filter(function(x){ return x.state !== "off"; })
        .map(function(x){ return mark(x.state) + " " + x.label + " (" + x.cost + (x.per ? "/" + x.per : "") + ")"; }),
      issues: (R.issues || []).map(function(x){ return x.message; }),
      /* For comparison (--json): the stats row and weapon rows as they are. */
      stats: R.stats || null,
      lead: R.leadership ? R.leadership.value : null,
      weapons: (R.weapons || []).map(function(w){ return [w.state].concat(w.a || []); }),
    });
    S.units.push(u);
  });

  /* The sheet title and the inventory line. The cards start at 16.3 mm, so
     two 5.6 pt lines fit at 10.2 mm. */
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
      report.problems.push("the inventory line does not fit on its two lines");
  }
  /* The sheet's card order by unit: the same pagination as the app's
     cardSheetPages() - a single card fills an open page, a unit with several
     cards (a fort) gets its own pages. So the DOM order is not the
     unit order when a fort is at an odd position. */
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
      window.print = function(){};      /* the browser does the printing itself */
      printRoster();
      publish();
      document.title = "ready roster " + S.units.length;
      return;
    }
    var n = buildCardSheet();
    if(!n) fail("buildCardSheet produced no cards");
    header();
    /* Like printCards(): the fonts load only with the card text, so
       the sheet is refitted once they have arrived. */
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

/* The check report from the page DOM. Returns the problems; prints the card rows. */
function check(key, spec, url) {
  const dom = runChrome(["--dump-dom", url], true);
  const title = (dom.match(/<title>([^<]*)<\/title>/) || [])[1] || "";
  const m = dom.match(/data-report="([^"]*)"/);
  if (!m) throw new Error(key + ": no report was produced (title: " + title + ")");
  const rep = JSON.parse(unescapeAttr(m[1]));
  if (rep.error) throw new Error(key + ": " + rep.error);
  REPORTS[key] = rep;

  const problems = rep.problems.slice();
  /* A unit's cards in DOM order: rep.order[j] = the unit of the j-th card.
     A fort has two cards, so its fit is read from the worse of
     them. */
  const order = rep.order || rep.cards.map((c, i) => i);
  const want = rep.cards.reduce((a, c) => a + (c.sheetCards || 1), 0);
  console.log("\n== " + key + "  [" + rep.list + "]  " + rep.cards.length + " units, " +
              want + " cards");
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
      problems.push(c.name + ": cards on the sheet " + lays.length + ", expected " + (c.sheetCards || 1));
    if (lay.overflow) problems.push(c.name + ": the content overflows");
    if (lay.minZone < MIN_ZONE)
      problems.push(c.name + ": block scale " + lay.minZone.toFixed(2) + " < " + MIN_ZONE);
  });
  if (spec.kind !== "roster" && rep.layout.length !== want)
    problems.push("cards " + rep.layout.length + ", defined " + want);
  return problems;
}

function build(key, opts) {
  const spec = SHEETS[key];
  if (!spec) throw new Error("unknown sheet: " + key + " (--list)");
  const app = fs.readFileSync(APP, "utf8");
  const at = app.lastIndexOf("</body>");
  if (at < 0) throw new Error("</body> not found in the app");
  /* The tag is assembled from pieces: a literal opening tag in this file would not
     hurt, but the same habit as in the app is kept. */
  const page = app.slice(0, at) + "<scr" + "ipt>\n" + PAGE_GLOBALS_JS + "\n" + bootstrap(spec) +
               "\n</scr" + "ipt>\n" + app.slice(at);
  const tmpHtml = path.join(HERE, "_fleet_cards_" + key + ".html");
  fs.writeFileSync(tmpHtml, page, "utf8");
  const url = "file:///" + encodeURI(tmpHtml.replace(/\\/g, "/"));

  try {
    const problems = check(key, spec, url);
    if (problems.length) {
      problems.forEach(p => console.log("  !! " + p));
      throw new Error(key + ": " + problems.length + " problems, the sheet was not written");
    }
    if (opts.checkOnly) return;

    fs.mkdirSync(path.dirname(spec.out), { recursive: true });
    const tmpPdf = spec.out.replace(/\.pdf$/i, ".tmp.pdf");
    runChrome(["--print-to-pdf=" + tmpPdf, url], false);
    if (!fs.existsSync(tmpPdf) || fs.statSync(tmpPdf).size < 10000)
      throw new Error(key + ": no PDF was produced");
    /* A Drive-synced folder or an open PDF viewer may refuse the
       rename (EPERM); a copy replaces the file's content even then. If
       that fails too, the temporary PDF is kept and the error says so. */
    try { fs.renameSync(tmpPdf, spec.out); }
    catch (e) {
      try { fs.copyFileSync(tmpPdf, spec.out); fs.unlinkSync(tmpPdf); }
      catch (e2) {
        throw new Error(key + ": " + path.basename(spec.out) + " is locked (open " +
                        "in a viewer?) - the new sheet was left in " + path.basename(tmpPdf));
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
  catch (e) { failed++; console.log("ERROR " + e.message); }
});
if (jsonOut) fs.writeFileSync(jsonOut, JSON.stringify(REPORTS, null, 1), "utf8");
if (failed) { console.log("\n" + failed + " sheets failed"); process.exit(1); }
