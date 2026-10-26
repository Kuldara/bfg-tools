# -*- coding: utf-8 -*-
"""Every sentence the PLAYER sees in the app is in the book.

check_quotes.py checks the reference files and the golden cases - that is,
what the developer recorded. This checks the other end: bfg_data.json's
rule sentences (rules[].src), section texts (secs[].text) and the rows'
notes (ents[].nt), which show in the catalogue, the legality panel
and on the cards. If a sentence is not in the book, the extraction or curation
wrote it, and the player reads it as the book's rule.

Three kinds, three fates:
  rule       a check row's source sentence. Assembled: a heading "0-12 Cruisers"
             in front, a page reference "(Fleets p. 487)" after, often TWO book
             sentences from different pages (Commerce Protection p.455 + p.457).
             Every sentence must be in the book, not as one stretch.
  text       a "Check yourself" sentence. The same rule. A flattened table
             ("2D6 roll Result ...") is not found as a sentence, and it is reported
             in its own class, so that it does not hide an editorial sentence.
  note       the row's own addition (nt), shown in its own box.
             The app's own text, not the book's - counted, not failed.

The other question is the page. The app shows the list's page, not the sentence's page,
and the faction's shared rules are inherited by the list from pages BEFORE the list.
A sentence far from the list's page is therefore a remark, not an error.

    python check_pages.py          findings
    python check_pages.py -v       also notes and the far ones
"""
import io
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import check_quotes as C   # Book, norm, split_elision, MIN_WORDS

VERBOSE = "-v" in sys.argv
FAR = 40   # pages from the list's page

#: a "0-12 Cruisers " / "(0-1) Flame of Asuryan " heading in front of the sentence
HEAD = re.compile(r"^\s*\(?\d+\s*[-–]\s*\d+\)?\s+[A-Z][A-Za-z'\- ]*?(?=\s+[A-Z][a-z]|\s+\d|$)")
#: "(Fleets p. 487)" / "(Fleets pp. 226-231)" / "(Rulebook p. 65)"
CITE = re.compile(r"\s*\((?:Fleets|Rulebook)\s+pp?\.?\s*[\d\s,–-]+\)\s*")
#: sentence boundary: a full stop, exclamation or question mark and a capital letter
SENT = re.compile(u"(?<=[.!?])\\s+(?=[A-Z“\"(])")
#: a flattened table or list: "2D6 roll Result", "D6 ROLL", "Renown
#  Title Ld", "chosen from the following list:", price rows "+20 /+40 pts".
#  A form of the extraction, not an error of the sentence - reported separately.
TABLE = re.compile(r"\b(?:2?D6\s+ROLL|2D6\s+roll\s+Result|Renown\s+Title|Roll\s+Result"
                   r"|following\s+list:|for\s+the\s+points\s+shown:)"
                   r"|^\(\+1/-1\)|^\+\d+\s*/\+\d+\s*pts", re.I)


def words(t):
    return len(re.findall(r"[A-Za-z0-9']+", t or ""))


#: A curated addition quotes the book with a label: 'Yriel (Fleets p. 319):
#  "you may instead pick ..."' or 'Pg. 373: "There is no ..."'. The label and
#  the quotation marks go, the quotation itself is checked.
LABEL = re.compile(r"^\s*(?:Pg\.\s*\d+|[A-Z][A-Za-z']{1,20})\s*:\s*")
QUOTES = u"\"'“”‘’"


def pieces(t):
    t = CITE.sub(" ", t or "")
    t = HEAD.sub("", t, count=1)
    out = []
    for part in C.split_elision(t):
        for x in SENT.split(part):
            x = (x or "").strip()
            if not x:
                continue
            x = LABEL.sub("", x, count=1).strip().strip(QUOTES).strip()
            if x.endswith(".") and x[:-1].rstrip().endswith(tuple(QUOTES)):
                x = x[:-1].rstrip().strip(QUOTES).strip()
            if x:
                out.append(x)
    return out


def main():
    book = C.Book(C.FLEETS)
    rules = C.Book(C.RULEBOOK) if os.path.exists(C.RULEBOOK) else None
    d = json.load(io.open(os.path.join(HERE, "..", "data", "bfg_data.json"), encoding="utf-8"))
    bad, table, note, far, n = [], [], [], [], 0
    for L in d["lists"]:
        lpg = int(L.get("pg") or 0)
        for sec in L.get("secs", []):
            items = []
            for r in sec.get("rules") or []:
                if r.get("src"):
                    items.append(("rule", r["src"]))
            for t in sec.get("text") or []:
                items.append(("text", t))
            for en in sec.get("ents") or []:
                if en.get("nt"):
                    items.append(("note", en["nt"]))
            for kind, t in items:
                for part in pieces(t):
                    if words(part) < C.MIN_WORDS:
                        continue
                    n += 1
                    w = C.norm(part)
                    where = "%s / %s / %s" % (L["nm"], sec.get("t", "?")[:28], kind)
                    if book.has(w):
                        pg = book.page_of(w)
                        if pg and lpg and abs(pg - lpg) > FAR:
                            far.append("%s: p.%d, list p.%d: %s" % (where, pg, lpg, part[:70]))
                        continue
                    if rules is not None and rules.has(w):
                        continue
                    line = "%s: not in the book: %s" % (where, part[:95])
                    if kind == "note":
                        note.append(line)
                    elif TABLE.search(part):
                        table.append(line)
                    else:
                        bad.append(line)
    for x in bad:
        print("  " + x)
    if table:
        print("\n  -- flattened table (a form of the extraction, not an error of the sentence) --")
        for x in table[:VERBOSE and 200 or 8]:
            print("  " + x)
        if not VERBOSE and len(table) > 8:
            print("  ... and %d more (-v shows all)" % (len(table) - 8))
    if VERBOSE and note:
        print("\n  -- the row's note, the app's own text --")
        for x in note:
            print("  " + x)
    if VERBOSE and far:
        print("\n  -- far from the list's page (remark) --")
        for x in far:
            print("  " + x)
    print("\nsentences checked %d, not in the book %d, tables %d, own notes %d, "
          "far from the list's page %d" % (n, len(bad), len(table), len(note), len(far)))
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main())
