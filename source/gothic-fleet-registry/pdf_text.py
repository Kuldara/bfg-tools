# -*- coding: utf-8 -*-
"""Kirjan sivut tekstina, pistokoetta varten (docs/PISTOKOE.md).

    python pdf_text.py 432 433            Fleets Book WIP, painetut sivut
    python pdf_text.py --rulebook 65 66   Rulebook v1.10
    python pdf_text.py --grep "Sepulchre"  hae Fleets-kirjasta (sivunumerot)

Painettu sivunumero = PDF-katselimen (1-alkuinen) sivunumero molemmissa
kirjoissa; fitz on 0-alkuinen, joten tassa luetaan doc[sivu - 1]. Tuloste on
UTF-8; taulukot tulevat rivi rivilta siina jarjestyksessa kuin PDF ne
antaa, joten aserivit voivat sekoittua vieressa olevaan laatikkoon - juuri
se on yksi loydoslaji (Waystation s.481)."""
import sys, io
import fitz

FLEETS = r"F:\3D print LLM\Battlefleet Gothic\tulosteet\ref\BFG-Remastered-Official-Fleets_WIP.pdf"
RULEBOOK = r"F:\3D print LLM\Battlefleet Gothic\chatgpt-projekti\20_SAANNOT_Rulebook_v1-10.pdf"

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
args = sys.argv[1:]
src = FLEETS
if args and args[0] == "--rulebook":
    src = RULEBOOK; args = args[1:]
doc = fitz.open(src)
if args and args[0] == "--grep":
    needle = " ".join(args[1:]).lower()
    for i in range(doc.page_count):
        t = doc[i].get_text("text")
        if needle in t.lower():
            hits = [ln.strip() for ln in t.split("\n") if needle in ln.lower()]
            print("s.%d: %s" % (i + 1, " | ".join(hits)[:200]))
    sys.exit(0)
if not args:
    print(__doc__); sys.exit(2)
for a in args:
    for p in ([int(a)] if "-" not in a else range(int(a.split("-")[0]), int(a.split("-")[1]) + 1)):
        if p < 1 or p > doc.page_count:
            print("=== s.%d: ei ole (%d sivua)" % (p, doc.page_count)); continue
        print("=" * 30 + " s.%d " % p + "=" * 30)
        print(doc[p - 1].get_text("text"))
