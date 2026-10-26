# -*- coding: utf-8 -*-
"""The book's pages as text, for spot checks (docs/history/registry/PISTOKOE.md).

    python pdf_text.py 432 433            Fleets Book WIP, printed pages
    python pdf_text.py --rulebook 65 66   Rulebook v1.10
    python pdf_text.py --grep "Sepulchre"  search the Fleets book (page numbers)

Printed page number = the PDF viewer's (1-based) page number in both
books; fitz is 0-based, so this reads doc[page - 1]. The output is
UTF-8; tables come row by row in the order the PDF gives them,
so weapon rows can mix with the box next to them - exactly
that is one kind of finding (Waystation p.481)."""
import sys, io
import os as _os, sys as _sys
_sys.path.insert(0, _os.path.dirname(_os.path.abspath(__file__)))
import books
import fitz

FLEETS = books.FLEETS
RULEBOOK = books.RULEBOOK

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
            print("p.%d: %s" % (i + 1, " | ".join(hits)[:200]))
    sys.exit(0)
if not args:
    print(__doc__); sys.exit(2)
for a in args:
    for p in ([int(a)] if "-" not in a else range(int(a.split("-")[0]), int(a.split("-")[1]) + 1)):
        if p < 1 or p > doc.page_count:
            print("=== p.%d: does not exist (%d pages)" % (p, doc.page_count)); continue
        print("=" * 30 + " p.%d " % p + "=" * 30)
        print(doc[p - 1].get_text("text"))
