# -*- coding: utf-8 -*-
"""A card sheet as a real PDF: paper, card size and pagination (J194).

The print setting (paper A4/Letter, card size in per cent) decides how many
cards fit on a sheet and which way round the sheet is. No other checker sees
what reaches the paper: layout_check.js measures the card's content, not the
sheet. This prints the same ten-card fleet with several settings in
headless Chrome (sheet_print.js) and reads the PDF:

  - there are as many pages as sheets were built, and none is empty
    (a player report 13.10.2026: on Letter paper "lots of mostly empty
    sheets" - the sheet was a 297 mm high A4 page on 279 mm paper)
  - the page size and orientation follow the setting
  - every card is whole: the number of card parts is the same as on the A4 100 %
    sheet (a reduced card broke at the page boundary before contain:size)
  - nothing is closer to the paper edge than 6 mm (the printer's margin);
    A4 100 % is the old fixed sheet whose bottom edge is 5.3 mm - it is not measured
  - the fit (fitCards) is the same as at A4 100 %: scaling is only a stretch of
    the finished card
  - the roster's 14 mm side margin holds

Run:  python sheet_check.py            every case
      python sheet_check.py -v         a table
      python sheet_check.py --keep     keep the PDFs for inspection (_sheet_check/)
Needs: Chrome or Edge, Node 22+, PyMuPDF. Not a step of npm test.
"""
import io
import json
import os
import shutil
import subprocess
import sys
import tempfile

import fitz

HERE = os.path.dirname(os.path.abspath(__file__))
VERBOSE = "-v" in sys.argv
KEEP = "--keep" in sys.argv
# The built page (npm run build).
SRC = os.path.join(HERE, "..", "..", "dist", "registry", "index.html")
PAPER_MM = {"A4": (210, 297), "Letter": (216, 279)}
EDGE_MM = 6.0
STOCK = "A4,100"
CASES = [STOCK, "A4,104", "A4,146", "A4,70", "A4,50", "Letter,97", "Letter,100", "Letter,151", "Letter,60",
         "roster,A4", "roster,Letter"]

# The driver appended to the page: the same fleet in every case - five
# capital ships, an escort squadron, a commander, an orbital mine (rule card) and
# the Ramilies (two cards) = ten cards.
INJECT = r"""
<script>
(async function(){
  var h = decodeURIComponent(location.hash.slice(1)).split(",");
  S.li = LISTS.findIndex(function(l){ return /^Imperial Navy/.test(l.nm) && /Gothic Sector/.test(l.nm); });
  S.units = [];
  function at(re){ var r = null; L().secs.forEach(function(sec, si){ sec.ents.forEach(function(en, ei){
    if(!r && re.test(en.l) && !isUpgradeEnt(en)) r = [si, ei]; }); }); return r; }
  var missing = [];
  [/^lunar class cruiser$/i, /^dictator class cruiser$/i, /^mars class battlecruiser$/i,
   /^retribution class battleship$/i, /^emperor class battleship$/i, /^sword class frigate$/i,
   /^fleet-admiral/i, /^orbital mine$/i, /ramilies/i].forEach(function(re){
    var p = at(re); if(p) addUnit(p[0], p[1]); else missing.push(String(re)); });
  if(h[0] === "roster"){
    setPrint(h[1], null);
    window.print = function(){};
    window.onafterprint = null;
    printRoster();
    document.title = JSON.stringify({ roster: 1, paper: PRINT.paper, missing: missing });
    return;
  }
  setPrint(h[0], +h[1]);
  var n = buildCardSheet();
  await document.fonts.ready; fitSheet();
  var lay = printLayout(PRINT.paper, printPct());
  var fits = [].map.call(document.querySelectorAll("#sheet .k"), function(k){
    return (k.dataset.cardScale || "1") + "/" + [].map.call(k.querySelectorAll(".fit-content"),
      function(c){ return c.dataset.fitScale; }).join(","); });
  document.title = JSON.stringify({ paper: PRINT.paper, pct: printPct(), cards: n, missing: missing,
    pages: document.querySelectorAll("#sheet .page").length, n: lay.n, land: lay.land, head: lay.head, fits: fits });
})();
</script>
"""

if not os.path.exists(SRC):
    print("not built: run npm run build first")
    sys.exit(2)
work = os.path.join(HERE, "_sheet_check") if KEEP else tempfile.mkdtemp(prefix="gfr_sheet_check_")
if KEEP and not os.path.isdir(work):
    os.makedirs(work)
html = io.open(SRC, encoding="utf-8").read()
cut = html.rfind("</body>")              # the app's own source contains the tag inside a string
assert cut > 0, "the page has no </body>"
# The bundle keeps the app's names in the GFR namespace; the shim from
# test-support.js puts them on window for the driver, as make_fleet_cards.js does.
shim = subprocess.run(["node", "-e", "process.stdout.write(require(process.argv[1]).PAGE_GLOBALS_JS)",
                       os.path.join(HERE, "test-support.js")], stdout=subprocess.PIPE, check=True).stdout.decode("utf-8")
page = os.path.join(work, "sheet_check.html")
with io.open(page, "w", encoding="utf-8", newline="\n") as f:
    f.write(html[:cut] + "<script>\n" + shim + "\n</script>\n" + INJECT + html[cut:])

r = subprocess.run(["node", os.path.join(HERE, "sheet_print.js"), page, work] + CASES,
                   stdout=subprocess.PIPE, stderr=subprocess.STDOUT, timeout=900)
if r.returncode != 0:
    print("printing failed: " + r.stdout.decode("utf-8", "replace").strip())
    sys.exit(2)

PT = 72 / 25.4
PARTS = ("pg. ", "CRITICAL DAMAGE", "NOTES / STATUS")     # the card's top, middle and bottom
fails, rows, seen = [], [], {}


def bad(case, what):
    fails.append("%s: %s" % (case, what))


for case in CASES:
    out = os.path.join(work, case.replace(",", "_") + ".pdf")
    meta = json.load(io.open(out + ".json", encoding="utf-8"))
    doc = fitz.open(out)
    size = sorted({(round(p.rect.width / PT), round(p.rect.height / PT)) for p in doc})
    empty, least, parts = 0, 999.0, [0, 0, 0]
    for p in doc:
        text, words = p.get_text(), p.get_text("words")
        if not words:
            empty += 1
        for i, s in enumerate(PARTS):
            parts[i] += text.count(s)
        ink = fitz.Rect()
        for w in words:
            ink |= fitz.Rect(w[:4])
        for d in p.get_drawings():
            q = d["rect"]
            if q.width < p.rect.width * 0.98 or q.height < p.rect.height * 0.98:    # not a full-page background
                ink |= q
        if not ink.is_empty:
            least = min(least, min(ink.x0, ink.y0, p.rect.width - ink.x1, p.rect.height - ink.y1) / PT)
    npages = len(doc)
    doc.close()
    if meta.get("missing"):
        bad(case, "the fleet is missing a row %s" % meta["missing"])
    if empty:
        bad(case, "%d empty pages" % empty)
    paper = meta.get("paper")
    w, h = PAPER_MM[paper]
    if meta.get("roster"):
        if size != [(w, h)]:
            bad(case, "page size %s, expected %s" % (size, [(w, h)]))
        if least < 13.0:
            bad(case, "roster margin %.1f mm, expected 14 mm" % least)
        rows.append((case, "", "", "", "", npages, size, empty, least))
        continue
    want = [(h, w)] if meta["land"] else [(w, h)]
    if size != want:
        bad(case, "page size %s, expected %s" % (size, want))
    if npages != meta["pages"]:
        bad(case, "%d pages in the PDF, %d sheets were built" % (npages, meta["pages"]))
    if case != STOCK and least < EDGE_MM - 0.3:
        bad(case, "content %.1f mm from the paper edge, limit %.0f mm" % (least, EDGE_MM))
    seen[case] = (parts, meta.get("fits"))
    rows.append((case, meta["pct"], meta["cards"], meta["n"], "landscape" if meta["land"] else "portrait",
                 npages, size, empty, least))

base = seen.get(STOCK)
for case, (parts, fits) in seen.items():
    if case == STOCK:
        continue
    if parts != base[0]:
        bad(case, "card parts %s, at A4 100 %%: %s - a card is cut or missing" % (parts, base[0]))
    if fits != base[1]:
        bad(case, "the fit differs from the A4 100 % fit")

if VERBOSE or fails:
    print("case            %  cards   /sheet orient. pages  size(mm)        empty  margin(mm)")
    for x in rows:
        print("%-13s %4s %6s %6s  %-6s %5s  %-15s %5s %9.1f" % x)
if not KEEP:
    shutil.rmtree(work, ignore_errors=True)
print("sheet_check: %d cases, findings %d" % (len(CASES), len(fails)))
for f_ in fails:
    print("  - " + f_)
sys.exit(1 if fails else 0)
