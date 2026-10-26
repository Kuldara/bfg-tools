# -*- coding: utf-8 -*-
"""Every book sentence marked as recorded really is in the book.

The project's whole chain of truth rests on quotations: a golden case's `why`
justifies the expectation with a sentence of the book, and a reference file's `text` is
a sentence of the book with its page number. If a quotation is a paraphrase, the reasoning looks
stronger than it is - and no other check notices it, because
everything else compares the data with itself.

Found this way on 14.9.2026: the golden `tau-hooks-exactly-full` quoted "the gravitic
hooks in the fleet", when p.454 says "the gravitic hook capacity of the
fleet".

The question is "is this a sentence of the book", not "is it on exactly this page":
a case's `why` often explains by referring to another place in the book (p.35's
squadron sentence itself refers to p.13, and the golden quotes both). A quotation
is therefore checked against the whole book; a wrong page number is reported
separately as a remark, not as an error.

The comparison is lenient: lower case, ligatures are expanded, everything
except letters and numbers removed. This way the PDF's hyphenation, line breaks and
curly quotation marks do not produce false findings.

    python check_quotes.py          findings
    python check_quotes.py -v       also the accepted ones
"""
import io
import os as _os, sys as _sys
_sys.path.insert(0, _os.path.dirname(_os.path.abspath(__file__)))
import books
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
REFDIR = os.path.join(HERE, "..", "reference")
FLEETS = books.FLEETS
RULEBOOK = books.RULEBOOK

#: A third source. The allies matrix is the heading of Fleets p.17, but the
#  table itself is missing from this edition; the Remastered web version restores
#  it from the 2010 FAQ. The exact text is stored in the repository, so that a quotation
#  that rests on it can be checked like a sentence of the book.
FAQ = books.FAQ2010_ALLIES
#: A fourth source (the user's decision 20.10.2026): the High Admiralty's Collected FAQ
#  2026 is the third authority alongside the books and wins over them in a conflict.
#  The locked export is copied into the repository byte for byte
#  (tulosteet/ref/warp_rift/faq2026_live_20261020.txt), so that a quotation
#  that rests on it can be checked. The living document changes: a new export is not
#  swapped in here without a check.
FAQ2026 = books.FAQ2026

MIN_WORDS = 5          # a shorter fragment tells nothing apart
VERBOSE = "-v" in sys.argv

#: The book's PDF is typeset with ligatures: "fleet" is "ﬂeet" in the file. Without
#  expanding them the normalisation drops the ligature entirely ("eet"), and not a single
#  quotation containing the word fleet is found.
LIGATURES = {u"\ufb00": "ff", u"\ufb01": "fi", u"\ufb02": "fl",
             u"\ufb03": "ffi", u"\ufb04": "ffl", u"\ufb05": "st",
             u"\ufb06": "st", u"\u0153": "oe", u"\u00e6": "ae",
             # The book typesets multiplication with a real multiplication sign ("D6×50"),
             # the recorder with the keyboard's x. Without this p.141 is not found.
             u"\u00d7": "x"}

#: Not everything in quotation marks is a sentence of the book. In these four
#  it is on purpose, and the reason is recorded here - otherwise the check could not tell
#  an oversight from a considered exception.
NOT_BOOK_OK = {
    # The reasoning quotes exactly the PDF extraction's error: p.481's
    # SPECIAL box and the Ion cannon row overlap, and the extraction
    # merges the weapon row into the sentence. The case guards exactly that the
    # hand-made completion does not disappear.
    "even if Ion cannon 30 cm 1 All round planetary":
        "p.481 extraction error, quoted on purpose",
    # These three are the name of a fleet list's own row, not a sentence of the book:
    # the reasoning says "the list's 'X'" and compares it with the book's OPTIONS sentence,
    # which is checked normally.
    "Torpedo-bommas +10 / launch bay": "the name of a list row, not a sentence of the book",
    "Boarding torpedoes (Space Hulk) 15": "the name of a list row, not a sentence of the book",
    "Nova Cannon instead of prow torpedoes 20": "the name of a list row, not a sentence of the book",
}


def norm(s):
    s = (s or "").lower()
    for a, b in LIGATURES.items():
        s = s.replace(a, b)
    return re.sub(r"[^a-z0-9]+", "", s)


class Book(object):
    """The book into memory once: the whole text for searching and page by page, so that
    a wrong page number can be named."""

    def __init__(self, path):
        import fitz
        self.doc = fitz.open(path)
        self.pages = []
        for i in range(self.doc.page_count):
            t = self.doc[i].get_text("text")
            # A page starts with its page number; if it stays in the text, a sentence
            # continuing over the page breaks there.
            t = re.sub(r"^\s*%d\s*\n" % (i + 1), "", t)
            self.pages.append(norm(t))
        # Without a separator: a sentence of the book often continues on the next page
        # (p.370 "...to ram and causes" -> p.371 "1Hp before rolling to
        # inflict damage."), and a separator cut the search exactly there.
        self.all = "".join(self.pages)

    def has(self, want):
        return want in self.all

    def page_of(self, want):
        for i, p in enumerate(self.pages):
            if want in p:
                return i + 1
        # a sentence continuing over the page
        for i in range(len(self.pages) - 1):
            if want in (self.pages[i] + self.pages[i + 1]):
                return i + 1
        return None


def quotes(text):
    """The fragments in quotation marks. Three ways of quoting are in use:
    'straight', curly and "double".

    The recorder often leaves out a middle part ("... "), and a table row can be
    in the book in a different order than in the quotation. The parts are therefore checked
    separately: each must be found in the book, but not as one stretch.

    A straight apostrophe inside a word ("the book's", "p.35's", "Kor'O") is an
    apostrophe, not a quotation mark: a quote opens only at the start, after
    white space or an opening bracket, and closes only before a non-word
    character. So a closing quote ("('ESCORT:')") never opens a new one, and a
    plural possessive ("the ships' table") can only close."""
    out = []
    straight = (r"(?<![^\s(\[/])'((?:[^']|(?<=[A-Za-z0-9])'(?=[A-Za-z]))"
                r"{12,400}?)'(?![A-Za-z0-9])")
    for pat in (straight, u"\u2018([^\u2019]{12,400})\u2019",
                u"\u201c([^\u201d]{12,400})\u201d", r'"([^"]{12,400})"'):
        out.extend(re.findall(pat, text or ""))
    return [p for q in out for p in split_elision(q)]


def split_elision(t):
    """The parts around an elision ("..." or the ellipsis character) and around an
    editorial insertion in square brackets ("listed on [p.175] can only"), which
    stands for words the book prints differently."""
    return [x.strip() for x in re.split(u"\\s*(?:\\.\\.\\.|\u2026|\\[[^\\]]*\\])\\s*", t or "")
            if x and x.strip()]


#: A reference rule may name the upgrade it quotes: "Extra Power Fields: The
#  ship's shield value ...". The book prints the name on a price row of its own,
#  so the label is tried off when the whole text is not found.
LABEL = re.compile(r"^\s*[A-Z][A-Za-z'\- ]{2,40}:\s+(?=[A-Z+])")


def check(book, where, page, text, bad, note, page_is_claim=False):
    """One quotation. Returns 1 if it was checked.

    page_is_claim: a reference file's `page` says where the rule is, so
    a wrong page is a finding. A golden's `why` often quotes another place in the book
    to justify itself, so its page difference is only a remark."""
    if not text:
        return 0
    if text.strip() in NOT_BOOK_OK:
        if VERBOSE:
            print("  skip %s  (%s)" % (where, NOT_BOOK_OK[text.strip()]))
        return 0
    if len(re.findall(r"[A-Za-z0-9']+", text)) < MIN_WORDS:
        return 0
    want = norm(text)

    def anywhere(w):
        return bool((getattr(book, "other", None) is not None and book.other.has(w))
                    or (getattr(book, "faq", "") and w in book.faq)
                    or (getattr(book, "faq2026", "") and w in book.faq2026)
                    or book.has(w))
    if not anywhere(want):
        bare = LABEL.sub("", text, count=1)
        if bare != text and anywhere(norm(bare)):
            text, want = bare, norm(bare)
    if getattr(book, "other", None) is not None and book.other.has(want):
        if VERBOSE:
            print("  ok   %s (Rulebook)  %s" % (where, text[:60]))
        return 1
    if getattr(book, "faq", "") and want in book.faq:
        if VERBOSE:
            print("  ok   %s (2010 FAQ)  %s" % (where, text[:60]))
        return 1
    if getattr(book, "faq2026", "") and want in book.faq2026:
        if VERBOSE:
            print("  ok   %s (FAQ 2026)  %s" % (where, text[:60]))
        return 1
    if not book.has(want):
        bad.append("%s: not a sentence of the book (p.%s): %s" % (where, page, text[:95]))
        return 1
    if page:
        pg = int(page)
        near = [p for p in (pg - 1, pg, pg + 1) if 1 <= p <= len(book.pages)]
        if not any(want in book.pages[p - 1] for p in near) and \
                not any(want in (book.pages[p - 1] + book.pages[p % len(book.pages)])
                        for p in near):
            found = book.page_of(want)
            if found is not None and abs(found - pg) > 1:
                line = ("%s: the sentence is on p.%d, recorded p.%s: %s"
                        % (where, found, page, text[:70]))
                (bad if page_is_claim else note).append(line)
    if VERBOSE:
        print("  ok   %s p.%s  %s" % (where, page, text[:60]))
    return 1


def main():
    book = Book(FLEETS)
    # The project has two books. The card's rule text and many goldens
    # quote the Rulebook (critical hits, crippling, boarding), and
    # its page numbers are a series of their own - so only "is the sentence in the book"
    # is checked against it, not the page number.
    rules_book = Book(RULEBOOK) if os.path.exists(RULEBOOK) else None
    book.other = rules_book
    book.faq = norm(io.open(FAQ, encoding="utf-8").read()) if os.path.exists(FAQ) else ""
    book.faq2026 = norm(io.open(FAQ2026, encoding="utf-8-sig").read()) if os.path.exists(FAQ2026) else ""
    bad, note, n = [], [], 0

    for fn, key in (("golden_fleet_cases.json", "golden_fleet"),
                    ("golden_cases.json", "golden")):
        p = os.path.join(REFDIR, fn)
        if not os.path.exists(p):
            continue
        for c in json.load(io.open(p, encoding="utf-8")).get("cases", []):
            for q in quotes(c.get("why", "")):
                n += check(book, key + "/" + c["id"], c.get("page"), q, bad, note)

    for fn in sorted(os.listdir(REFDIR)):
        if not re.match(r"\d\d_.*\.json$", fn):
            continue
        d = json.load(io.open(os.path.join(REFDIR, fn), encoding="utf-8"))
        for r in d.get("rules", []):
            t, pg = r.get("text"), r.get("page")
            if not t:
                continue
            # The recorder may have left out a middle part ("... "); the parts separately.
            for part in split_elision(t):
                n += check(book, "%s/%s" % (fn[:2], r["key"][:30]), pg, part,
                           bad, note, page_is_claim=True)

    for line in bad:
        print("  " + line)
    if note:
        print("\n  -- page number differs from where the sentence is found (remark) --")
        for line in note:
            print("  " + line)
    print("\nquotations checked %d, not sentences of the book %d, page remarks %d"
          % (n, len(bad), len(note)))
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main())
