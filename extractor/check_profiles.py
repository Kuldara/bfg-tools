# -*- coding: utf-8 -*-
"""Is a stat or weapon value in the RIGHT COLUMN - not just on the page?

audit.py's checks A and B ask whether the value is found in the source page's text.
That proves the extractor invented nothing, and it is a strong result: of 3 627
values none is missing. It does not look at the column, though. When a value occurs
on the page more than once - and 2 028 values, i.e. 56 %, do - the check
passes also when the value is in the wrong column. Exactly that kind of
error prints a plausible-looking card with wrong values.

This checker derives the tables again from the PDF and compares with bfg_data.json.
For it to prove anything, it must infer the columns by a DIFFERENT RULE than
extract.py:

  extract.py   places every WORD separately by its LEFT EDGE (w[0]).
               The file warns itself: "A row's x0 cannot be trusted: the cells
               are centred and widen to the left."

  this         first assembles a row's words into CELLS by horizontal gap and
               places a whole CELL by its MIDPOINT into the nearest
               column.

The 14 pt cell boundary is not guessed but measured: 20 692 word gaps fall into
two piles, 1-6 pt inside a cell and >=20 pt between cells; between them is
an empty band, and the boundary is taken from its middle.

SCOPE. The column inference is independent - it is the axis this
claims to check. Row recognition and skipping subheadings are on purpose
the same as in extract.py, because a difference there would tell
nothing about the correctness of the values. One difference is deliberate, though:

  extract.py CUTS the table if a row has >=14 words (a wide
  interstitial sentence). This checker SKIPS such a row and continues. This way
  pages are found where the book has more table than the extractor took.
  They are not automatically errors: e.g. Torture p.352 is fixed
  by hand in build_data.py. They are reported in a class of their own
  to check, not as a finding.

Run:  python check_profiles.py         summary
      python check_profiles.py -v      every finding in full
Returns 1 if there are actual findings.
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

STATS = ["TYPE/HITS", "SPEED", "TURNS", "SHIELDS", "ARMOUR", "TURRETS"]
TYR = ["TYPE/HITS", "SPEED", "TURNS", "SHIELDS", "ARMOUR", "SPORES"]
ARMS = ["ARMAMENT", "RANGE/SPEED", "FIREPOWER/STR", "FIRE"]
ARM_KEYS = ["armament", "range", "fp", "arc"]
SECTIONS = ("OPTIONS", "NOTES", "NOTE", "SPECIAL", "UPGRADES", "REFITS")
SKIP_ROW = re.compile(r"^(?:(?:in addition,\s*)?choose\b|or\s*$|below\b)", re.I)

CELL_GAP = 14.0   # measured; see the module's explanation
CLOSE = 6.0       # this close to a column boundary the placement is not unambiguous

issues = collections.defaultdict(list)
seen = collections.Counter()


def add(kind, ref, msg):
    issues[kind].append((ref, msg))


def norm(t):
    t = (str(t).replace("\u2009", " ").replace("\u00a0", " ")
         .replace("\u2013", "-").replace("\u2212", "-").replace("\u2014", "-"))
    return re.sub(r"\s+", " ", t).strip()


def cmpable(t):
    """The comparison form. "(quadrant)" is dropped, because extract.py drops it
    on purpose in its stats pattern - it is not a column error but a deliberate
    simplification, and it is reported separately as a remark of its own."""
    t = re.sub(r"\s*\(quadrant\)", "", norm(t), flags=re.I)
    # p.181 Endeavour prints the TURNS value "90" without a degree sign; build_data
    # adds the sign (turns_text), and that is a deliberate normalisation, not a
    # column error.
    return re.sub("(\\d)\u00b0$", "\\1", t)


def rows(page, tol=3.5):
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


def header(rws, labels):
    for i, (yc, ws) in enumerate(rws):
        toks = [w[4] for w in ws]
        if all(l in toks for l in labels):
            cen = []
            for l in labels:
                j = toks.index(l)
                xa, xb = ws[j][0], ws[j][2]
                if l == "FIRE" and j + 1 < len(ws) and ws[j + 1][4] == "ARC":
                    xb = ws[j + 1][2]
                cen.append((xa + xb) / 2)
            return i, cen, yc
    return None, None, None


def cells(ws):
    """A row's words into cells by horizontal gap.

    This is the core of the checker: extract.py never forms a cell but
    places the words one by one, so a word belonging to a wide cell can
    cross the column boundary alone. When the cell is formed first, its midpoint
    tells the column.
    """
    out = []
    for w in ws:
        if out and w[0] - out[-1][-1][2] < CELL_GAP:
            out[-1].append(w)
        else:
            out.append([w])
    return [(c[0][0], c[-1][2], " ".join(x[4] for x in c)) for c in out]


def place(cell, cen):
    """A cell into the nearest column by its MIDPOINT.

    Returns (column, margin, number of crossings). A small margin
    means the placement is not unambiguous. Crossing a boundary alone is not
    enough for a remark: long weapon names naturally spread to the next
    column's side, and their midpoint is still clearly in their own.
    """
    x0, x1, _ = cell
    c = (x0 + x1) / 2
    i = min(range(len(cen)), key=lambda k: abs(cen[k] - c))
    bs = [(cen[k] + cen[k + 1]) / 2 for k in range(len(cen) - 1)]
    margin = min((abs(c - b) for b in bs), default=999.0)
    crosses = sum(1 for b in bs if x0 < b < x1)
    return i, margin, crosses


def statline_of(sh):
    ty, hp = sh.get("ty"), sh.get("hp")
    head = "%s/%s" % (ty, hp) if ty and hp is not None else (ty or "")
    return [head, sh.get("sp"), sh.get("tn"), sh.get("sh"),
            sh.get("ar"), sh.get("tu")]


by_page = collections.defaultdict(list)
for key, sh in D["ships"].items():
    m = re.match(r"(\d+)", str(sh.get("pg") or key))
    if m:
        by_page[int(m.group(1))].append((key, sh))

pages_checked = variants_skipped = 0

for pg in sorted(by_page):
    page = doc[pg - 1]
    txt = page.get_text()
    if "TYPE/HITS" not in txt or "ARMAMENT" not in txt:
        continue
    rws = rows(page)
    labels = TYR if "SPORES" in txt else STATS
    si, scen, _ = header(rws, labels)
    ai, acen, ay = header(rws, ARMS)
    if si is None or ai is None:
        continue
    pages_checked += 1

    exact = [(k, s) for k, s in by_page[pg] if str(k) == str(pg)]
    if not exact:
        variants_skipped += len(by_page[pg])
        continue
    if len(by_page[pg]) > 1:
        variants_skipped += len(by_page[pg]) - 1
    key, sh = exact[0]
    ref = "p.%d %s" % (pg, sh.get("nm", "")[:32])

    # ---- stats line ------------------------------------------------------
    want = statline_of(sh)
    got = [""] * len(labels)
    for cell in (cells(rws[si + 1][1]) if si + 1 < len(rws) else []):
        i, margin, _ = place(cell, scen)
        got[i] = (got[i] + " " + cell[2]).strip()
        if margin < CLOSE:
            add("S uncertain", ref, "%r is %.1f pt from the column boundary (%s)"
                % (cell[2], margin, labels[i]))
    for i, lab in enumerate(labels):
        seen["stat"] += 1
        w, g = cmpable(want[i]), cmpable(got[i])
        if w == "" and g == "":
            continue
        if w != g:
            add("S stat", ref, "%s: data=%r  from the page's column=%r"
                % (lab, norm(want[i]), norm(got[i])))
        # The book's "(quadrant)" is significant: 12 hits PER QUADRANT
        # is not the same thing as 12 hits. The marking is dropped from the values
        # on purpose - it does not fit in the box and does not belong in an integer - and
        # the information is carried in the qd flag, which the card states once. Here
        # it is required that the flag really is there: without it the card lies.
        if "(quadrant)" in norm(got[i]).lower() and not sh.get("qd"):
            add("S quadrant", ref, "%s: the book has %r, but the ship lacks qd"
                % (lab, norm(got[i])))

    # ---- weapon table ----------------------------------------------------
    derived, cur, prev_y, skipped_wide = [], None, ay, 0
    for j in range(ai + 1, len(rws)):
        yc, ws = rws[j]
        first = ws[0][4].upper().strip(":")
        if (first in SECTIONS and ws[0][0] < 90) or yc - prev_y >= 16:
            break
        prev_y = yc
        full = norm(" ".join(w[4] for w in ws))
        cs = cells(ws)
        wide_prose = len(ws) >= 14
        if wide_prose:
            skipped_wide += 1
        # a subheading: one cell that crosses a column boundary, or the book's own
        # "Choose ..." / "OR" separator
        if wide_prose or SKIP_ROW.match(full) or \
                (len(cs) == 1 and place(cs[0], acen)[2] >= 1):
            cur = None
            continue
        row = {}
        for cell in cs:
            i, margin, crosses = place(cell, acen)
            row[ARM_KEYS[i]] = (row.get(ARM_KEYS[i], "") + " " + cell[2]).strip()
            if margin < CLOSE:
                add("B uncertain", ref, "%r is %.1f pt from the column boundary (%s)"
                    % (cell[2], margin, ARM_KEYS[i]))
        if row.get("armament"):
            cur = {k: row.get(k, "") for k in ARM_KEYS}
            derived.append(cur)
        elif cur is not None:
            for k in ARM_KEYS:
                if row.get(k):
                    cur[k] = (cur[k] + " / " + row[k]).strip(" /")

    stored = [[norm(c) for c in a] for a in (sh.get("aw") or [])]
    mine = [[norm(r[k]) for k in ARM_KEYS] for r in derived]
    if len(stored) != len(mine):
        # More in the data than on the page = the extractor's cut has been fixed
        # by hand (Torture p.352, Waystation p.481). More on the page than
        # in the data = weapons are missing, and that is a finding.
        kind = "B completed by hand" if len(stored) > len(mine) else "B row count"
        add(kind, ref, "data %d weapon rows, from the page %d%s"
            % (len(stored), len(mine),
               " (the page has %d wide interstitial sentences)" % skipped_wide if skipped_wide else ""))
    for n, (s, m) in enumerate(zip(stored, mine)):
        for ci, (a, b) in enumerate(zip(s, m)):
            seen["weapon"] += 1
            if a != b:
                add("B weapons", ref, "row %d %s: data=%r  from the page=%r"
                    % (n + 1, ARM_KEYS[ci], a, b))

# --- report ---------------------------------------------------------------
SOFT = ("S uncertain", "B uncertain", "B completed by hand")
print("Position check: %d profile pages" % pages_checked)
print("  stat values %d, weapon cells %d" % (seen["stat"], seen["weapon"]))
if variants_skipped:
    print("  skipped %d variants, which are born only in build_data.py"
          % variants_skipped)
print()
hard = 0
for kind in sorted(issues):
    n = len(issues[kind])
    if kind not in SOFT:
        hard += n
    print("%-14s %4d%s" % (kind, n, "" if kind not in SOFT else "   (to check, not a finding)"))
    show = issues[kind] if VERBOSE else issues[kind][:8]
    for r, msg in show:
        print("   %-36s %s" % (r[:36], msg[:112]))
    if not VERBOSE and n > len(show):
        print("   ... and %d more (-v shows all)" % (n - len(show)))
print()
print("actual findings: %d" % hard)
sys.exit(1 if hard else 0)
