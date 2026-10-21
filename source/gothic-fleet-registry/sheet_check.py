# -*- coding: utf-8 -*-
"""Korttiarkki oikeana PDF:na: paperi, korttikoko ja sivutus (J194).

Tulostusasetus (paperi A4/Letter, korttikoko prosentteina) paattaa, montako
korttia arkille mahtuu ja kumminpain arkki on. Mikaan muu tarkistin ei nae
sita, mita paperille tulee: layout_check.js mittaa kortin sisallon, ei
arkkia. Tama tulostaa saman kymmenen kortin laivaston usealla asetuksella
headless-Chromella (sheet_print.js) ja lukee PDF:n:

  - sivuja on yhta monta kuin arkkeja rakennettiin, eika yksikaan ole tyhja
    (pelaajaraportti 13.10.2026: Letter-paperilla "lots of mostly empty
    sheets" - arkki oli 297 mm korkea A4-sivu 279 mm paperilla)
  - sivun koko ja suunta ovat asetuksen mukaiset
  - jokainen kortti on kokonainen: kortin osien maara on sama kuin A4 100 %
    -arkilla (pienennetty kortti katkesi sivurajalla ennen contain:size:a)
  - mikaan ei ole lahempana paperin reunaa kuin 6 mm (tulostimen reuna-alue);
    A4 100 % on vanha kiintea arkki, jonka alareuna on 5,3 mm - sita ei mitata
  - sovitus (fitCards) on sama kuin A4 100 %:ssa: skaalaus on pelkka venytys
    valmiille kortille
  - rosterin 14 mm:n sivumarginaali toteutuu

Aja:  python sheet_check.py            kaikki tapaukset
      python sheet_check.py -v         taulukko
      python sheet_check.py --keep     jata PDF:t tarkasteltavaksi (_sheet_check/)
Vaatii: Chrome tai Edge, Node 22+, PyMuPDF. Ei ole acceptance.py:n askel.
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
SRC = os.path.join(HERE, "Gothic Fleet Registry.html")
PAPER_MM = {"A4": (210, 297), "Letter": (216, 279)}
EDGE_MM = 6.0
STOCK = "A4,100"
CASES = [STOCK, "A4,104", "A4,146", "A4,70", "A4,50", "Letter,97", "Letter,100", "Letter,151", "Letter,60",
         "roster,A4", "roster,Letter"]

# Sivun loppuun lisattava ajuri: sama laivasto joka tapauksessa - viisi
# paa-alusta, saattajalaivue, komentaja, orbital mine (saantokortti) ja
# Ramilies (kaksi korttia) = kymmenen korttia.
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
    print("ei ole rakennettu: aja ensin python build.py")
    sys.exit(2)
work = os.path.join(HERE, "_sheet_check") if KEEP else tempfile.mkdtemp(prefix="gfr_sheet_check_")
if KEEP and not os.path.isdir(work):
    os.makedirs(work)
html = io.open(SRC, encoding="utf-8").read()
cut = html.rfind("</body>")              # sovelluksen oma lahde sisaltaa tagin merkkijonossa
assert cut > 0, "sivulta puuttuu </body>"
page = os.path.join(work, "sheet_check.html")
with io.open(page, "w", encoding="utf-8", newline="\n") as f:
    f.write(html[:cut] + INJECT + html[cut:])

r = subprocess.run(["node", os.path.join(HERE, "sheet_print.js"), page, work] + CASES,
                   stdout=subprocess.PIPE, stderr=subprocess.STDOUT, timeout=900)
if r.returncode != 0:
    print("tulostus epaonnistui: " + r.stdout.decode("utf-8", "replace").strip())
    sys.exit(2)

PT = 72 / 25.4
PARTS = ("pg. ", "CRITICAL DAMAGE", "NOTES / STATUS")     # kortin ylaosa, keskiosa ja alareuna
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
            if q.width < p.rect.width * 0.98 or q.height < p.rect.height * 0.98:    # ei koko sivun taustaa
                ink |= q
        if not ink.is_empty:
            least = min(least, min(ink.x0, ink.y0, p.rect.width - ink.x1, p.rect.height - ink.y1) / PT)
    npages = len(doc)
    doc.close()
    if meta.get("missing"):
        bad(case, "laivastosta puuttuu rivi %s" % meta["missing"])
    if empty:
        bad(case, "%d tyhjaa sivua" % empty)
    paper = meta.get("paper")
    w, h = PAPER_MM[paper]
    if meta.get("roster"):
        if size != [(w, h)]:
            bad(case, "sivun koko %s, odotettu %s" % (size, [(w, h)]))
        if least < 13.0:
            bad(case, "rosterin reuna %.1f mm, odotettu 14 mm" % least)
        rows.append((case, "", "", "", "", npages, size, empty, least))
        continue
    want = [(h, w)] if meta["land"] else [(w, h)]
    if size != want:
        bad(case, "sivun koko %s, odotettu %s" % (size, want))
    if npages != meta["pages"]:
        bad(case, "PDF:ssa %d sivua, arkkeja rakennettiin %d" % (npages, meta["pages"]))
    if case != STOCK and least < EDGE_MM - 0.3:
        bad(case, "sisaltoa %.1f mm paperin reunasta, raja %.0f mm" % (least, EDGE_MM))
    seen[case] = (parts, meta.get("fits"))
    rows.append((case, meta["pct"], meta["cards"], meta["n"], "vaaka" if meta["land"] else "pysty",
                 npages, size, empty, least))

base = seen.get(STOCK)
for case, (parts, fits) in seen.items():
    if case == STOCK:
        continue
    if parts != base[0]:
        bad(case, "kortin osia %s, A4 100 %%:ssa %s - kortti on katkennut tai puuttuu" % (parts, base[0]))
    if fits != base[1]:
        bad(case, "sovitus eroaa A4 100 %:n sovituksesta")

if VERBOSE or fails:
    print("tapaus          %  kortit  /arkki suunta  sivut  koko(mm)        tyhjia  reuna(mm)")
    for x in rows:
        print("%-13s %4s %6s %6s  %-6s %5s  %-15s %5s %9.1f" % x)
if not KEEP:
    shutil.rmtree(work, ignore_errors=True)
print("sheet_check: %d tapausta, loydoksia %d" % (len(CASES), len(fails)))
for f_ in fails:
    print("  - " + f_)
sys.exit(1 if fails else 0)
