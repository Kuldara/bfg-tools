/* Print readability floor, measured (item 10, docs/definition-of-done.md).
 *
 * For every list row two cards are built with the same cardHTML() as the
 * app: the default, and "all options" (every option and offered list
 * upgrade taken, a name, a note, +pts and the escort members). The cards
 * are fitted in headless Chrome with the app's own fitCards() and
 * measured:
 *
 *   print_overflows          a card whose content does not fit even after 240
 *                            shrink steps (data-content-overflow)
 *   unreadable_print_cases   a card where some text block drops below the
 *                            readability floor: the block's design size (pt)
 *                            x fit-content scale x card scale < FLOOR
 *
 * The FLOOR is 4.2 pt (A4, 100 %): the card's smallest design size is 4.6 pt
 * (the damage box note), so 4.2 means no primary text drops below ~90 % of
 * its design. The measured blocks are in the BLOCKS table; an option's
 * description tail, a critical's second line and the "or" marker are
 * designed smaller (3.8-4.45 pt) and are not part of the measure.
 * The fit runs only after document.fonts.ready - the embedded fonts load
 * on first use, and a fit made before that measures the fallback font.
 * Rationale and method: docs/definition-of-done.md,
 * "5. Printing is usable".
 *
 * Run:  node layout_check.js            summary + the worst cards
 *       node layout_check.js --json     machine-readable (tools/test.js uses it)
 *       node layout_check.js --keep     keep _layout_*.html for inspection
 *       node layout_check.js --list Ork only lists whose name contains Ork
 */
"use strict";
const fs = require("fs"), path = require("path"), os = require("os");
const { execFileSync } = require("child_process");
const HERE = __dirname;
const AS_JSON = process.argv.includes("--json");
const KEEP = process.argv.includes("--keep");
const FLOOR = (() => { const i = process.argv.indexOf("--floor"); return i > 0 ? parseFloat(process.argv[i + 1]) : 4.2; })();
const ONLY = (() => { const i = process.argv.indexOf("--list"); return i > 0 ? process.argv[i + 1] : null; })();

/* ---- the app in Node (the same stub as the other drivers) ------------- */
const els = {};
const mk = () => ({ textContent: "", innerHTML: "", value: "", className: "", dataset: {}, style: {}, id: "", hidden: false,
  querySelectorAll: () => [], querySelector: () => null, appendChild(){}, removeChild(){}, addEventListener(){}, setAttribute(){}, getAttribute: () => "", closest: () => mk(), classList: { add(){}, remove(){}, toggle(){}, contains: () => false } });
const el = k => (els[k] || (els[k] = mk()));
global.document = { getElementById: id => id === "bfgdata" ? { textContent: fs.readFileSync(path.join(HERE, "..", "..", "data", "bfg_data.json"), "utf8") } : el("#" + id),
  querySelector: s => el(s), querySelectorAll: () => [], createElement: () => mk(), head: { appendChild(){} }, body: { appendChild(){}, removeChild(){}, dataset: {}, classList: { add(){}, remove(){} } }, addEventListener(){} };
global.window = { addEventListener(){}, print(){}, matchMedia: () => ({ matches: false, addEventListener(){} }) };
if (!global.navigator) Object.defineProperty(global, "navigator", { value: {}, configurable: true });
global.alert = () => {}; global.confirm = () => true; global.localStorage = { getItem: () => null, setItem(){}, removeItem(){} };
/* The app's modules, loaded under the stubs above (test-support.js). */
const api = require(require("path").join(__dirname, "./test-support.js")).loadApp();
const html = require(require("path").join(__dirname, "./test-support.js")).builtPage();
/* All style blocks: the build embeds the fonts in their own block before the
   app's CSS, and the first block alone would leave the cards unstyled. */
const css = [...html.matchAll(/<style>([\s\S]*?)<\/style>/g)].map(m => m[1]).join(String.fromCharCode(10));

/* ---- cards ---------------------------------------------------------- */
const cards = [];
/* The card kind for the summary: the new kinds (a fort's plan and rule
   card, a rule card, a defence squadron, a multi-hit station) must be
   seen MEASURED, not skipped - a card with no measurable block cannot be
   unreadable, and the measure would be green and blind. */
const kindOf = {};
/* All cards of a unit (unitCards): a fort (Ramilies p.500, Fortress-
   Monastery p.110) prints as two cards, and both are measured. */
function pushCards(u, key, variant, pos, sec) {
  const R = api.resolveUnit(u) || {};
  const cs = api.unitCards(u);
  cs.forEach(c => {
    const part = cs.length > 1 ? (c.id === "plan" ? " [plan card]" : " [rule card]") : "";
    const id = key + part + " | " + variant;
    kindOf[id] = R.card === "fort" ? (c.id === "plan" ? "fort: plan card" : "fort: rule card")
      : R.card === "rule" ? "rule card"
      : sec && sec.ct === "defence" ? (R.card === "squadron" ? "defence squadron" : "defence station (capital)")
      : R.kind === "commander" ? "commander" : R.card === "squadron" ? "squadron" : "ship";
    cards.push({ id, html: c.html(pos) });
  });
  return cs.length;
}
api.LISTS.forEach((L, li) => {
  if (ONLY && !L.nm.includes(ONLY)) return;
  api.getS().li = li; api.getS().limit = 100000;
  L.secs.forEach((sec, si) => sec.ents.forEach((en, ei) => {
    /* A row without a hull: a commander, or a rule card row (Orbital mine
       p.512, Minefield p.513 - a buyable defence with no profile but with a
       card). An upgrade row or a plain list option has no card:
       unitCards() returns an empty list for them. */
    if (en.k === "up") return;
    api.getS().units = []; api.addUnit(si, ei);
    const u = api.getS().units[0]; if (!u) return;
    const key = L.nm + " | " + sec.t + " | " + en.l;
    if (!pushCards(u, key, "default", "a", sec)) return;
    /* "all options" for a hull-less count row: the row's own upper limit
       (p.499: 0-2 Minefields) or twelve mines - there is one record box per
       bought item, and they must fit. */
    if (!en.r && en.cnt) u.n = en.mx || 12;
    const sh = api.SHIPS[String(en.r)];
    if (sh) (sh.ol || []).forEach((o, i) => { try { api.setOptState(u, i, "take"); } catch (e) {} });
    /* Of the list upgrades only the row's OWN (own): taking all fleet-wide
       ones (other) at once is not a legal build (Gubbins and
       bio-enhancements are limited), and the card need not survive it. */
    const ups = api.upgradesFor(u); ups.own.forEach(x => { try { api.setUpState(u, x[0], x[1], "take"); } catch (e) {} });
    u.name = "Righteous Fury of the Emperor"; u.note = "Refit: reinforced prow armour"; u.adj = 5; u.members = "Alpha, Beta, Gamma, Delta, Epsilon, Zeta";
    pushCards(u, key, "all", "b", sec);
  }));

  /* Borrowed ship (1.1): the card gets the role and the donor list in its
     subtitle, i.e. two words and the list's full name more. The margin is
     0.04 pt, so it must be measured - but only once per list, because the
     addition depends on the list's NAME and not the row. The row with the
     longest name is chosen: together with the list name it makes the
     longest subtitle. */
  let worst = null;
  L.secs.forEach((sec, si) => sec.ents.forEach((en, ei) => {
    /* Planetary defences are not borrowed (reserves and allies are the list's
       SHIPS, Fleets p.14 and p.16), so the borrowed-ship measure stays on the
       list's own ships. */
    if (!en.r || sec.ct === "defence") return;
    if (!worst || String(en.l).length > String(worst.en.l).length)
      worst = { si, ei, en, sec };
  }));
  if (worst) {
    const host = (li + 1) % api.LISTS.length;     /* some other list as the host */
    api.getS().li = host; api.getS().units = [];
    api.addUnitFrom(li, worst.si, worst.ei, "reserve");
    const bu = api.getS().units[0];
    if (bu) pushCards(bu, L.nm + " | " + worst.sec.t + " | " + worst.en.l, "borrowed", "c", worst.sec);
    api.getS().li = li;
  }
});
if (!cards.length) { console.error("no cards"); process.exit(2); }

/* ---- measuring page --------------------------------------------------- */
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
  /* A block's type is the first selector found in the block, and its size
     is the block's measure - so the block's SMALLEST primary text comes
     before larger ones in the list. The fort plan card's own classes come
     first: the quarter and Basilica critical box names (.fct u, 4.4 pt) are
     the smallest text in their block, as are the re-roll box word and the
     special order marks in the column boxes. Other cards do not have them,
     so measuring other cards does not change. The rule card's steps
     (.rstep p), lead (.rlead) and minefield size boxes (.rsz) come last. */
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
    /* The stats row (review 5.10.2026): its cells are not fit-content
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
    /* Geometry of the new card kinds (fort plan card, rule card): fitCards
       scales a block by its HEIGHT, so content that grew sideways out of its
       box would be clipped at the overflow:hidden edge without any sign -
       this happened to the plan card's weapon table when the Fortress-
       Monastery's "Thunderhawk: 20 cm" widened past its quarter. On the plan
       card the Basilica hub also sits on top of the quarters: it must not
       cover the heading, the hit track or a weapon row (the critical boxes
       avoid it with their own margin). Either is an overflow. */
    var geo = [];
    if(card.classList.contains("fortp") || card.classList.contains("rulek") || card.classList.contains("fortr")){
      card.querySelectorAll(".k-box > .k-bd").forEach(function(bd){
        /* Drawn edges, not scrollWidth: a scaled block's layout box is wider
           than its box on purpose (width 100/k %), and only the transform
           brings it back. So what is measured is what reaches the paper. */
        var br = bd.getBoundingClientRect(), worst = 0, who = "";
        bd.querySelectorAll("table, tr, td, li, p, h5, h6, span, i, u, b").forEach(function(e){
          var r = e.getBoundingClientRect();
          if(r.width && r.right - br.right > worst){ worst = r.right - br.right; who = e.tagName.toLowerCase() + (e.className ? "." + e.className : ""); }
        });
        if(worst > 1){
          var hd = bd.parentElement.querySelector("h4,h5,h6");
          geo.push("content wider than its box: " + (hd ? hd.textContent.slice(0, 24) : "?") + " " + who + " +" + worst.toFixed(1) + "px");
        }
      });
    }
    var hub = card.querySelector(".fbas");
    if(hub){
      var hr = hub.getBoundingClientRect();
      card.querySelectorAll(".fq h5, .fq .k-hits, .fq .k-cr, .fq .fq-arm tr, .fq .fct span").forEach(function(e){
        var r = e.getBoundingClientRect();
        if(r.right > hr.left + .5 && r.left < hr.right - .5 && r.bottom > hr.top + .5 && r.top < hr.bottom - .5)
          geo.push("Basilica covers: " + e.tagName.toLowerCase() + (e.className ? "." + e.className : ""));
      });
      /* a quarter and the hub must not spill over the card's inner edge */
      var kr = card.getBoundingClientRect();
      card.querySelectorAll(".fq, .fbas, .fcol > .k-box").forEach(function(e){
        var r = e.getBoundingClientRect();
        if(r.right > kr.right + .5 || r.bottom > kr.bottom + .5 || r.left < kr.left - .5 || r.top < kr.top - .5)
          geo.push("outside the card: " + e.className);
      });
    }
    /* v1.2: a block that fitCards grew (scale > 1) must not cut a weapon
       table cell - a name, range or strength behind an ellipsis would be
       worse than smaller text. */
    card.querySelectorAll(".k-box > .k-bd > .fit-content").forEach(function(c){
      if(parseFloat(c.dataset.fitScale || "1") <= 1.001) return;
      /* Measure the drawn content, not scrollWidth: a cell with a write-in box
         under its number (Kroot Warsphere, "12" + box) wraps neatly onto two
         lines and the box is wholly inside the cell, but Chrome still reports
         scrollWidth 40 > clientWidth 29 (measured 12.10.2026). A cut name, by
         contrast, reaches past the cell edge. */
      c.querySelectorAll(".k-arm td.nm, .k-arm td.rg, .k-arm td.st").forEach(function(td){
        var range = document.createRange(); range.selectNodeContents(td);
        var cr = range.getBoundingClientRect(), tr = td.getBoundingClientRect();
        if(cr.width && (cr.right > tr.right + .5 || cr.left < tr.left - .5))
          geo.push("a cell of a grown table is cut: " + td.textContent.replace(/\s+/g, " ").trim().slice(0, 32));
      });
    });
    /* v1.2 (user 12.10.2026): the write-in field of the STR column sat oddly
       and the two could be side by side - the write-in box is on the same
       line as its number, not under it. */
    card.querySelectorAll(".k-arm td.st .wi").forEach(function(wi){
      var td = wi.parentNode, range = document.createRange();
      var tn = null; td.childNodes.forEach(function(n){ if(!tn && n.nodeType === 3 && n.nodeValue.trim()) tn = n; });
      var first = td.firstElementChild && td.firstElementChild !== wi ? td.firstElementChild : null;
      if(tn) range.selectNodeContents(tn); else if(first) range.selectNodeContents(first); else return;
      var a = range.getBoundingClientRect(), b = wi.getBoundingClientRect();
      if(a.height && b.top > a.bottom - 1) geo.push("write-in box is under its number, not beside it: " + td.textContent.replace(/\s+/g, " ").trim().slice(0, 16));
    });
    /* v1.2 (user 12.10.2026, choice C): port and starboard rows as a pair.
       The shared marker is drawn as two halves, one on each row: they must
       meet at the row boundary and sit in the same column, or the marker
       looks broken. Range and strength are one cell two rows high, and
       "each" is UNDER the number, not beside it (beside it would widen the
       column and stop the table from growing). */
    var pairs = 0;
    card.querySelectorAll(".k-arm tr[data-pair='1']").forEach(function(tr){
      pairs++;
      var nx = tr.nextElementSibling, what = tr.textContent.replace(/\s+/g, " ").trim().slice(0, 24);
      if(!nx || nx.dataset.pair !== "2"){ geo.push("the pair's lower row is missing: " + what); return; }
      var a = tr.querySelector(".pj"), b = nx.querySelector(".pj");
      if(!a || !b){ geo.push("the pair's shared marker is missing: " + what); return; }
      var ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect();
      if(!(ra.height > 2 && rb.height > 2 && ra.width > 2)) geo.push("the pair marker has no size: " + what);
      /* the lower half is drawn a hair (0.15 mm) over the upper one on
         purpose, so no light seam is left at the scaled block's edge: a gap
         is not acceptable, a small overlap is */
      else if(ra.bottom - rb.top < -.5 || ra.bottom - rb.top > 2.5 || Math.abs(ra.left - rb.left) > .5 || Math.abs(ra.width - rb.width) > .5)
        geo.push("the pair marker halves do not meet: " + what + " " + (ra.bottom - rb.top).toFixed(1) + "/" + (ra.left - rb.left).toFixed(1) + "px");
      var rg = tr.querySelector("td.rg"), st = tr.querySelector("td.st");
      if(!rg || !st || rg.rowSpan !== 2 || st.rowSpan !== 2 || nx.querySelector("td.rg, td.st")) geo.push("the pair's range or strength is not a shared cell: " + what);
      var ea = st && st.querySelector(".ea");
      if(!ea) geo.push("the pair's strength lacks each: " + what);
      else {
        var range = document.createRange(), tn = null;
        st.childNodes.forEach(function(n){ if(!tn && (n.nodeType === 3 ? n.nodeValue.trim() : n !== ea)) tn = n; });
        if(tn){ range.selectNodeContents(tn); var rn = range.getBoundingClientRect(), re = ea.getBoundingClientRect();
          /* by centres: the text box is taller than the line, so the edges always overlap a little */
          if(rn.height && (re.top + re.bottom) / 2 - (rn.top + rn.bottom) / 2 < rn.height * .4) geo.push("each is beside the number, not under it: " + what); }
        var tdr = st.getBoundingClientRect(), rr = ea.getBoundingClientRect();
        if(rr.bottom > tdr.bottom + .5 || rr.right > tdr.right + .5 || rr.left < tdr.left - .5) geo.push("each does not fit its cell: " + what);
      }
    });
    if(geo.length) overflow = true;
    /* v1.2: the arc icon size without the block scale (mm) and the number of abbreviated weapon names */
    var arcMm = null;
    card.querySelectorAll(".k-arm tr.w:not(.alt):not(.ammo) .arcg").forEach(function(g){
      /* an svg element has no offsetWidth: the computed width is the CSS size without the block scale */
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

let chrome;
try { chrome = require("../../tools/lib/chrome.js").findChrome(); } catch (e) { console.error(e.message); process.exit(2); }

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
    /* Headless Chrome sometimes never returns from --dump-dom (seen 26.10.2026
       under memory pressure: one chunk hung for 25 minutes). A time limit and
       one retry turn a hang into either a result or a clear failure. */
    for (let attempt = 1; ; attempt++) {
      try {
        dom = execFileSync(chrome, ["--headless=new", "--disable-gpu", "--no-sandbox", "--user-data-dir=" + profile,
          "--virtual-time-budget=15000", "--dump-dom", url],
          { maxBuffer: 1 << 28, stdio: ["ignore", "pipe", "ignore"], timeout: 180000, killSignal: "SIGKILL" }).toString("utf8");
        break;
      } catch (e) {
        if (attempt >= 2 || !(e.code === "ETIMEDOUT" || e.signal)) throw e;
        console.error("Chrome did not answer in 180 s (chunk " + i + "), retrying once");
      }
    }
  } finally {
    if (!KEEP) try { fs.unlinkSync(tmp); } catch (e) {}
    try { fs.rmSync(profile, { recursive: true, force: true }); } catch (e) {}
  }
  const m = dom.match(/<pre id="report">([\s\S]*?)<\/pre>/);
  if (!m) { console.error("the measuring report is missing from Chrome's output (chunk " + i + ")"); process.exit(2); }
  const txt = m[1].replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
  JSON.parse(txt).forEach(r => results.push(r));
}

/* ---- summary ---------------------------------------------------------- */
results.forEach(r => {
  const effs = r.blocks.map(b => b.eff).concat(r.armMin != null ? [r.armMin] : []);
  r.minEff = effs.length ? Math.min.apply(null, effs) : null;
  r.worst = r.blocks.reduce((w, b) => (!w || b.eff < w.eff) ? b : w, null);
});
const overflows = results.filter(r => r.overflow);
const unreadable = results.filter(r => r.minEff != null && r.minEff < FLOOR);
const byVariant = v => unreadable.filter(r => r.id.endsWith("| " + v)).length;
/* Summary per kind: how many cards, how many of them were measured, and the
   kind's smallest text size. "measured < cards" means that no measurable
   block was found on a card. */
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
  unreadable_default: byVariant("default"), unreadable_all_options: byVariant("all"),
  min_pt: sorted.length ? sorted[0].minEff : null, median_min_pt: median,
  worst: sorted.slice(0, 12).map(r => ({ id: r.id, minEff: r.minEff, cardScale: r.cardScale,
    block: r.worst ? r.worst.type + " " + r.worst.base + "pt x" + r.worst.fit : null })),
  overflow_ids: overflows.map(r => r.id + (r.stOver && r.stOver.length ? "  [stats row: " + r.stOver.join(", ") + "]" : "") +
    (r.geo && r.geo.length ? "  [geometry: " + r.geo.slice(0, 3).join("; ") + "]" : "")).slice(0, 20),
  kinds,
};
/* ---- v1.2: text growth (user 10.-12.10.2026) -------------------------------
   The user asked to enlarge fonts up to a point when there is room, keep large
   weapon tables as now, and do the same in specials and options, as a marked
   simplification closer to the current live version. fitCards grows a block
   only on a card where nothing had to shrink, and at most to a ceiling:
   weapons 6 -> 9 pt, rules 5.4 -> 7.5 pt, options -> 6.5 pt. The critical
   table and the other blocks do not grow (ceiling 1): the critical boxes wrap
   by width, and a grown table went from rows 5 + 4 to rows 4 + 4 + 1. This
   checks three things: no block exceeds its ceiling, a light card (Lunar)
   really grows, and a full card (Hammer) stays exactly as it was. */
const GROW_CAP = { armament: 1.5, rules: 1.39, options: 1.17 };
const growNotes = [];
results.forEach(r => r.blocks.forEach(b => {
  const cap = GROW_CAP[b.type] || 1;
  if (b.fit > cap + 0.011) growNotes.push("block over its ceiling: " + b.type + " x" + b.fit + " > " + cap + "  <- " + r.id);
}));
/* Lunar: "Starboard weapons battery" was the longest name in the table and
   stopped the weapons' growth at 8.0 pt (x1.33). The user (12.10.2026) asked
   that the longest armament names, which lock the left/right direction space,
   be abbreviated to the length of the other long ones - with the
   abbreviation (Starboard -> Stbd) the Lunar's weapons reach close to the
   ceiling. A full card (Hammer) abbreviates nothing. */
const GROW_EXPECT = [
  { re: /Gothic Sector \| .* \| Lunar class cruiser \| default$/, min: { armament: 1.45, rules: 1.2 }, abbrMin: 1, pairsMin: 2 },
  { re: /Waaagh! \| .* \| Hammer class battlekroozer \| default$/, max: { armament: 1, rules: 1, options: 1, critical: 1 }, abbrMax: 0 },
];
GROW_EXPECT.forEach(x => {
  const r = results.find(q => x.re.test(q.id));
  if (!r) { if (!ONLY) growNotes.push("expected card not found: " + x.re); return; }
  const fit = t => { const b = r.blocks.find(q => q.type === t); return b ? b.fit : null; };
  Object.keys(x.min || {}).forEach(t => { if (!(fit(t) >= x.min[t])) growNotes.push("the light card did not grow: " + t + " x" + fit(t) + " < " + x.min[t] + "  <- " + r.id); });
  Object.keys(x.max || {}).forEach(t => { if (fit(t) != null && fit(t) > x.max[t] + 0.001) growNotes.push("a block of the full card grew: " + t + " x" + fit(t) + "  <- " + r.id); });
  if (x.abbrMin != null && !(r.abbr >= x.abbrMin)) growNotes.push("the longest weapon name was not abbreviated: " + r.abbr + "  <- " + r.id);
  if (x.abbrMax != null && r.abbr > x.abbrMax) growNotes.push("weapon names of the full card were abbreviated: " + r.abbr + "  <- " + r.id);
  /* Fleets p.71: the Lunar has a lance pair and a battery pair */
  if (x.pairsMin != null && !(r.pairs >= x.pairsMin)) growNotes.push("port/starboard pairs " + r.pairs + " < " + x.pairsMin + "  <- " + r.id);
});
/* v1.2 (user 12.10.2026): the arc circle could be a little bigger -
   the arc icon is at least 3.1 mm (was 2.6 mm) on every card. */
const smallArc = results.filter(r => r.arcMm != null && r.arcMm < 3.1);
if (smallArc.length) growNotes.push("arc icon under 3.1 mm on " + smallArc.length + " cards, smallest " + Math.min.apply(null, smallArc.map(r => r.arcMm)) + " mm  <- " + smallArc[0].id);
summary.abbreviated_cards = results.filter(r => r.abbr > 0).length;
summary.paired_cards = results.filter(r => r.pairs > 0).length;
summary.growth_failures = growNotes.length;
summary.growth_notes = growNotes.slice(0, 20);
summary.grown_cards = results.filter(r => r.blocks.some(b => b.fit > 1.001)).length;
if (process.argv.includes("--dump")) fs.writeFileSync(path.join(HERE, "_layout_report.json"), JSON.stringify(results));
if (AS_JSON) { console.log(JSON.stringify(summary, null, 1)); process.exit(overflows.length || unreadable.length || growNotes.length ? 1 : 0); }
console.log("cards " + summary.cards + "  (measured " + summary.measured + ")  floor " + FLOOR + " pt");
console.log("smallest text size " + summary.min_pt + " pt, median " + summary.median_min_pt + " pt");
console.log("print_overflows        " + summary.print_overflows);
console.log("unreadable_print_cases " + summary.unreadable_print_cases + "  (default " + summary.unreadable_default + ", all options " + summary.unreadable_all_options + ")");
console.log("\nby kind (cards / measured / smallest pt / overflows / under the floor):");
Object.keys(kinds).sort().forEach(k => { const o = kinds[k];
  console.log("  " + k.padEnd(26) + String(o.cards).padStart(5) + " / " + String(o.measured).padStart(5) + " / " +
    String(o.min_pt).padStart(5) + " / " + o.overflows + " / " + o.unreadable + (o.measured < o.cards ? "   <- SKIPPED " + (o.cards - o.measured) : "")); });
console.log("\nworst:");
summary.worst.forEach(w => console.log("  %s pt  scale %s  %s  <- %s", String(w.minEff).padStart(5), w.cardScale, w.block, w.id));
if (overflows.length) { console.log("\noverflows:"); summary.overflow_ids.forEach(x => console.log("  " + x)); }
console.log("\ngrowth: " + summary.grown_cards + " cards grew a block, " + summary.abbreviated_cards + " cards had abbreviated weapon names, " + summary.paired_cards + " cards have a port/starboard pair; deviations " + summary.growth_failures);
summary.growth_notes.forEach(x => console.log("  " + x));
process.exit(overflows.length || unreadable.length || growNotes.length ? 1 : 0);
