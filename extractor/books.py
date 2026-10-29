# -*- coding: utf-8 -*-
"""Where the rulebook PDFs are.

The PDFs are not in the repository (they belong to their authors). Put your
own copies in the folder named by the BFG_BOOKS environment variable, or in
books/ at the repository root (gitignored), under these names:

    fleets-v0.40.pdf     BFG: Remastered Fleets Book WiP v0.40
    rulebook-v1.11.pdf   BFG: Remastered Official Rulebook v1.11
    faq2026.txt          Collected FAQ 2026, text export (check_quotes.py)
    faq2010-allies.txt   2010 FAQ allies matrix, text export (check_quotes.py)
    bsdata_cache/        BattleScribe data (crosscheck_bsdata.py only)

Only the extractor and the checks that compare against the books need them;
building and testing the apps does not.
"""
import os

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BOOKS = os.environ.get("BFG_BOOKS") or os.path.join(REPO, "books")

FLEETS = os.path.join(BOOKS, "fleets-v0.40.pdf")
RULEBOOK = os.path.join(BOOKS, "rulebook-v1.11.pdf")
FAQ2026 = os.path.join(BOOKS, "faq2026.txt")
FAQ2010_ALLIES = os.path.join(BOOKS, "faq2010-allies.txt")
BSDATA = os.path.join(BOOKS, "bsdata_cache")


def need(path):
    """Fail with a readable message when a book is missing."""
    if not os.path.exists(path):
        raise SystemExit("missing %s - see the docstring of books.py (BFG_BOOKS=%s)" % (
            os.path.basename(path), BOOKS))
    return path
