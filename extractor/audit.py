# -*- coding: utf-8 -*-
"""Row-by-row audit: compares bfg_data.json back with the source PDFs.

  A  the stats line's values are found on the source page
  B  every cell of every weapon row is found on the source page
     (multi-value cells are split at " / ")
  C  the OPTIONS/SPECIAL block is not cut off mid-way
  D  ORPHAN SECTIONS: is there rule text between the weapon table and the lore
     paragraph that the extractor did NOT capture. This is the place where
     the weapons' special rules would disappear from the card.
  E  the list row's price is found on the list page
  F  the list row's page reference points at the right ship

Run:  python audit.py            the whole material
      python audit.py -v         also show every finding in full
"""
import fitz, json, io, re, sys, os, collections
import os as _os, sys as _sys
_sys.path.insert(0, _os.path.dirname(_os.path.abspath(__file__)))
import books

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = books.FLEETS
D = json.load(io.open(os.path.join(HERE, "..", "data", "bfg_data.json"), encoding="utf-8"))
doc = fitz.open(SRC)
VERBOSE = "-v" in sys.argv

SECTIONS = ("OPTIONS", "NOTES", "NOTE", "SPECIAL", "UPGRADES", "REFITS")
issues = collections.defaultdict(list)


def norm(t):
    t = (t.replace("\u2009", " ").replace("\u00a0", " ").replace("\u2013", "-")
          .replace("\u2019", "'").replace("\u2018", "'"))
    return re.sub(r"\s+", " ", t).strip().lower()


_pt = {}


def page_text(n):
    if n not in _pt:
        _pt[n] = norm(doc[n - 1].get_text())
    return _pt[n]


def add(kind, ref, msg):
    issues[kind].append((ref, msg))


def rows_of(page, tol=3.5):
    out = []
    for w in sorted((w[:5] for w in page.get_text("words")),
                    key=lambda w: (round((w[1] + w[3]) / 2, 1), w[0])):
        yc = (w[1] + w[3]) / 2
        if out and abs(out[-1][0] - yc) <= tol:
            out[-1][1].append(w)
        else:
            out.append([yc, [w]])
    for r in out:
        r[1].sort(key=lambda w: w[0])
    return out


# ------------------------------------------------------------------ SHIPS
ships = D["ships"]
def profile_sort(item):
    m = re.match(r"^(\d+)(.*)$", item[0])
    return (int(m.group(1)), m.group(2)) if m else (10**9, item[0])


for pg, sh in sorted(ships.items(), key=profile_sort):
    t = page_text(sh["pg"])
    ref = "p.%s %s" % (pg, sh["nm"][:34])

    # A ---------------------------------------------------------------
    for label, v in (("speed", sh["sp"]), ("shields", sh["sh"]),
                     ("turrets", sh["tu"]), ("turns", sh["tn"])):
        if v and norm(v) not in t:
            add("A stats", ref, "%s=%r not found on the page" % (label, v))
    if sh["hp"] is not None and ("/%d" % sh["hp"]) not in t:
        add("A stats", ref, "hits=%s not found" % sh["hp"])

    # B --- multi-value cells are split, because the extractor joins rows
    for a in sh["aw"]:
        if norm(a[0]) and norm(a[0]) not in t:
            add("B weapons", ref, "weapon %r not found on the page" % a[0])
        for cell in a[1:]:
            for part in str(cell).split(" / "):
                p = norm(part).strip("()")
                if p and p not in ("-", "") and p not in t:
                    add("B weapons", ref, "%r: %r not found" % (a[0], part))
    if not sh["aw"]:
        add("B weapons", ref, "no weapon rows")

    # C ---------------------------------------------------------------
    for key, val in (("OPTIONS", sh["op"]), ("SPECIAL", sh["sr"])):
        v = (val or "").strip()
        if v and not re.search(r"([.!?)\]]|\d|pts|points|cm)$", v, re.I):
            add("C block", ref, "%s ends mid-way: ...%r" % (key, v[-50:]))
        if "[???]" in v:
            add("C block", ref, "%s: a broken cross-reference in the source [???]" % key)

    # D --- did a rule block disappear? --------------------------------
    # Two things can go wrong: (1) the page has a section heading the
    # extractor did not take at all, (2) a block was cut mid-way, so that
    # a weapon's special rule is left off the card. Lore paragraphs are NOT
    # findings: they start from the page's left margin, the sections'
    # body text is indented.
    page = doc[sh["pg"] - 1]
    rws = rows_of(page)
    ai = None
    for i, (yc, ws) in enumerate(rws):
        toks = [w[4] for w in ws]
        if "ARMAMENT" in toks and "FIRE" in toks:
            ai = i
            break
    if ai is None:
        continue
    captured = norm((sh["op"] or "") + " " + (sh["sr"] or ""))
    body = [(yc, ws) for yc, ws in rws[ai + 1:] if yc < 610]
    lore_x = None
    longs = [ws[0][0] for yc, ws in body if len(ws) >= 13]
    if longs:
        lore_x = min(longs)

    # D1: a heading on the page but not in the extracted blocks
    on_page = {ws[0][4].upper().strip(":") for yc, ws in body
               if ws[0][4].upper().strip(":") in SECTIONS}
    got = set()
    if (sh["op"] or "").strip():
        got.add("OPTIONS")
    if (sh["sr"] or "").strip():
        got |= {"SPECIAL", "NOTES", "NOTE"}
    for h in sorted(on_page - got):
        add("D1 section lost", ref, "the page has a %s block that was not extracted" % h)

    # D2: a block cut mid-way - the next line is still indented body text
    started = False
    for yc, ws in body:
        first = ws[0][4].upper().strip(":")
        if first in SECTIONS:
            started = True
            continue
        if not started:
            continue
        if lore_x is not None and ws[0][0] <= lore_x + 6:
            break                        # a lore paragraph began, not a finding
        line = " ".join(w[4] for w in ws)
        if re.match(r"^[A-Z &]+MODULE\b", line):
            continue                    # the name of the Tau Orbital's next module
        n = norm(re.sub(r"^(OPTIONS|SPECIAL|NOTES?|UPGRADES|REFITS)\s*:?\s*", "", line))
        n = n.lstrip("• \t")
        if sh["pg"] in (184, 192):
            n = n.replace("[???]", "p. 175")  # the book's known Xenotech reference error
        if len(n) > 12 and n[:45] not in captured:
            add("D2 block cut", ref, "not extracted: %r" % line[:95])
            break

# ----------------------------------------------------------------- LISTS
for L in D["lists"]:
    for sec in L["secs"]:
        for e in sec["ents"]:
            ref = "%s / %s" % (L["nm"][:26], e["l"][:30])
            if e["r"]:
                if str(e["r"]) not in ships:
                    add("F page ref", ref, "pg. %s is not a profile page" % e["r"])
                elif e.get("badref"):
                    add("F page ref", ref, "BOOK ERROR, marked: -> %r"
                        % ships[str(e["r"])]["nm"])
                else:
                    # the same word comparison as in build_data.py's cross-check
                    def tok(t):
                        t = re.sub(r"pg\.\s*\d+", " ", norm(t))
                        t = re.sub(r"[^a-z0-9' ]", " ", t)
                        return {w for w in t.split() if len(w) > 2 and w not in {
                            "class", "the", "and", "ship", "vessel", "heavy",
                            "light", "grand", "battleship", "cruiser", "escort",
                            "destroyer", "frigate", "raider", "starship",
                            "attack", "assault", "gunship", "ramship", "kroozer",
                            "battlekroozer", "battlecruiser", "transport"}}
                    if tok(e["l"]) and tok(ships[str(e["r"])]["nm"]) and \
                       not (tok(e["l"]) & tok(ships[str(e["r"])]["nm"])):
                        add("F page ref", ref, "-> %r" % ships[str(e["r"])]["nm"])
            if e["p"] is not None and e.get("src_page"):
                pt = page_text(e["src_page"])
                # The book writes zero as a word: "Ork Warlord....Free".
                ok_price = (re.search(r"\b%d\s*pts" % e["p"], pt) or
                            (e["p"] == 0 and re.search(r"\bFree\b", pt, re.I)))
                # A broken list row: when the list page and the profile page
                # disagree on the price, the profile page is the authority. Page
                # 372's row "(pg. 377)). 2310 pts" is the book's own mess, and
                # the correct 210 reads on profile page 381. The finding stays
                # in force if the price is on neither page.
                if not ok_price and e.get("r"):
                    ok_price = bool(re.search(r"\b%d\s*pts\b" % e["p"],
                                              # the profile's PAGE, not the key: a variant key
                                              # ("334b", "517b") is not a page number
                                              page_text(ships[str(e["r"])]["pg"]), re.I))
                if not ok_price:
                    add("E list", ref, "price %d pts not found on page %s"
                        % (e["p"], e.get("src_page")))

# ----------------------------------------------------------------- REPORT
tot = sum(len(v) for v in issues.values())
print("Audited: %d ships, %d lists, %d list rows" % (
    len(ships), len(D["lists"]),
    sum(len(sec["ents"]) for L in D["lists"] for sec in L["secs"])))
print("Findings in total: %d\n" % tot)
for kind in sorted(issues):
    rows = issues[kind]
    print("== %s: %d ==" % (kind, len(rows)))
    lim = len(rows) if VERBOSE else 25
    for ref, msg in rows[:lim]:
        print("   %-40s %s" % (ref[:40], msg[:130]))
    if len(rows) > lim:
        print("   ... and %d more (-v shows all)" % (len(rows) - lim))
    print()
