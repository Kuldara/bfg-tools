# -*- coding: utf-8 -*-
"""Extracts the ship profiles + OPTIONS/SPECIAL blocks from the Fleets WiP PDF.

The stats line is parsed by pattern (the columns spill into each other when ARMOUR is long),
the armament table by geometry, from the midpoints of the headings.
"""
import fitz, json, re, sys, io
import os as _os, sys as _sys
_sys.path.insert(0, _os.path.dirname(_os.path.abspath(__file__)))
import books

SRC = books.FLEETS
d = fitz.open(SRC)

STATS = ["TYPE/HITS", "SPEED", "TURNS", "SHIELDS", "ARMOUR", "TURRETS"]
TYRANID_STATS = ["TYPE/HITS", "SPEED", "TURNS", "SHIELDS", "ARMOUR", "SPORES"]
ARMS = ["ARMAMENT", "RANGE/SPEED", "FIREPOWER/STR", "FIRE"]
ARM_KEYS = ["armament", "range", "fp", "arc"]
SECTIONS = ("OPTIONS", "NOTES", "NOTE", "SPECIAL", "UPGRADES", "REFITS")

Q = r"(?: \(quadrant\))?"
STAT_RE = re.compile(
    r"^(?P<type>\S+(?: \S+)?/\S+)" + Q + r"\s+"
    r"(?P<speed>[\d/]+\s*cm|[Ss]pecial|[–-])\s+"
    r"(?P<turns>\d+\s*°|[Ss]pecial|[–-])\s+"
    r"(?P<shields>\d+" + Q + r"|Holofields|[–-])\s+"
    r"(?P<armour>.+?)\s+"
    r"(?P<turrets>\d+" + Q + r"|[–-])$")


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


def text_of(ws):
    return " ".join(w[4] for w in ws).replace("\u2009", " ").replace("\u00a0", " ")


def section_name(ws):
    """Return a real profile block heading, not the first word of body text.

    For example the Escort Drone's sentence "special rules detailed..." starts
    with the word special, but it is indented and is not a SPECIAL heading.
    The heading is printed in capitals: v0.40 p.131 has a line of the
    Dictator's narrative starting "upgrades to the Dictator's communications".
    """
    first = ws[0][4].strip(":")
    return first if first in SECTIONS and ws[0][0] < 90 else None


def label_row(rws, labels):
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


def col_of(x, cen):
    bnds = [(cen[i] + cen[i + 1]) / 2 for i in range(len(cen) - 1)]
    i = 0
    while i < len(bnds) and x >= bnds[i]:
        i += 1
    return i


CELL_GAP = 14.0


def cells_of(ws):
    """A row's words into cells by horizontal gap.

    Inside a cell the word gap is 1-6 pt, between cells >= 20 pt; 14 pt falls
    in the empty band between them (measured from 20 692 gaps).
    """
    out = []
    for w in ws:
        if out and w[0] - out[-1][-1][2] < CELL_GAP:
            out[-1].append(w)
        else:
            out.append([w])
    return out


def cols_of(ws, cen):
    """Column -> text, one cell at a time and by the cell's MIDPOINT.

    A per-word x0 does not do: the cells are centred and widen
    to the left, so the first word of a wide cell can cross the
    column boundary alone. This happened to the gravitic hook's word "Capacity:", which
    ended up in the range column on three Tau ships.
    """
    buf = {}
    for c in cells_of(ws):
        mid = (c[0][0] + c[-1][2]) / 2
        k = min(range(len(cen)), key=lambda i: abs(cen[i] - mid))
        txt = " ".join(w[4] for w in c)
        buf[k] = (buf[k] + " " + txt).strip() if k in buf else txt
    return buf


def parse(page):
    txt = page.get_text()
    if "TYPE/HITS" not in txt or "ARMAMENT" not in txt:
        return None
    lines = [l.strip() for l in txt.split("\n") if l.strip()]
    fleet, head, pts_raw = lines[1], lines[2].rstrip("\t").strip(), lines[3]
    # Four ships carry the price on the same line as the heading, separated
    # by a tab. Then lines[3] is already TYPE/HITS, not the price - and without
    # the split the price stays in the ship's name and prints in the card's heading.
    if "\t" in head:
        _name, _tail = head.split("\t", 1)
        _name, _tail = _name.strip(), _tail.strip()
        if _name and re.search(r"\bPTS\b", _tail, re.I):
            head, pts_raw = _name, _tail

    rws = rows(page)
    stat_labels = TYRANID_STATS if "SPORES" in txt else STATS
    si, sc, sy = label_row(rws, stat_labels)
    ai, ac, ay = label_row(rws, ARMS)
    if si is None or ai is None:
        return None

    # --- stats: pattern first, geometry as a fallback ---------------------
    srow = text_of(rws[si + 1][1]) if si + 1 < len(rws) else ""
    srow = re.sub(r"\s+", " ", srow).strip()
    m = STAT_RE.match(srow)
    if m:
        g = m.groupdict()
        stats = {"TYPE/HITS": g["type"], "SPEED": g["speed"], "TURNS": g["turns"],
                 "SHIELDS": g["shields"], "ARMOUR": g["armour"], "TURRETS": g["turrets"]}
        stat_ok = True
    else:
        buf = cols_of(rws[si + 1][1], sc)
        # the same normalisation as on the pattern path, otherwise a narrow space stays
        # The internal key stays named TURRETS, so the old data model and
        # the arithmetic work. defense_label tells the user interface that
        # for Tyranids the same value is SPORES.
        stats = {STATS[k]: v.replace(" ", " ").replace(" ", " ")
                 for k, v in buf.items()}
        stat_ok = False

    # --- armament ---------------------------------------------------------
    # The table ends at a section heading, a large vertical gap or a lore paragraph.
    # A row's x0 cannot be trusted: the cells are centred and widen to the left.
    arms, cur, stop = [], None, len(rws)
    prev_y = ay
    for j in range(ai + 1, len(rws)):
        yc, ws = rws[j]
        first = section_name(ws)
        if first or yc - prev_y >= 16 or len(ws) >= 14:
            stop = j
            break
        prev_y = yc
        full_row = text_of(ws).strip()
        # The full-width subheadings of multiple-choice tables are not
        # weapons. Without this the Dragonship got a weapon "Choose", the Hammer the weapon
        # "OR", and the end of the heading was glued to the previous weapon's cells.
        if re.match(r"^(?:(?:in addition,\s*)?choose\b|or\s*$|below\b)", full_row, re.I):
            cur = None
            continue
        # A group heading ("QUADRANT WEAPONS", "BASILICA WEAPONS") is one cell
        # whose letters are all capitals. Without this it was glued to
        # the previous row's range cell, because it has no weapon column.
        _cells = cells_of(ws)
        _letters = [c for c in full_row if c.isalpha()]
        if len(_cells) == 1 and _letters and all(c.isupper() for c in _letters):
            cur = None
            continue
        buf = cols_of(ws, ac)
        row = {ARM_KEYS[k]: v.replace("\u2009", " ") for k, v in buf.items()}
        if row.get("armament"):
            cur = {k: row.get(k, "") for k in ARM_KEYS}
            arms.append(cur)
        elif cur is not None:
            for k in ARM_KEYS:
                if row.get(k):
                    cur[k] = (cur[k] + " / " + row[k]).strip(" /")

    # --- OPTIONS / SPECIAL / NOTES ----------------------------------------
    extras, k = {}, stop
    while k < len(rws):
        yc, ws = rws[k]
        first = section_name(ws)
        if first:
            body, prev, kk = [], yc, k
            while kk < len(rws):
                y2, w2 = rws[kk]
                if kk > k and (y2 - prev >= 18 or section_name(w2)):
                    break
                t = text_of(w2)
                if kk == k:
                    t = t[len(ws[0][4]):].strip()
                body.append(t)
                prev, kk = y2, kk + 1
            # A page can have several blocks with the same heading (e.g. Tau
            # Orbitals: SPECIAL per module). Before, the later one overwrote
            # the earlier ones and special rules disappeared from the card.
            txtb = re.sub(r"\s+", " ", " ".join(body)).strip()
            extras[first] = (extras[first] + " " + txtb).strip() if first in extras else txtb
            k = kk
        else:
            k += 1

    # The book marks the star forts' values "(quadrant)": they are
    # per quadrant. The marking was inconsistent - it disappeared
    # from the hit count but stayed in the shields and turrets - so it is dropped
    # from all values and raised to a flag of the ship's own. This way the card
    # can say it once in full instead of repeating it
    # in two cramped boxes and forgetting the third.
    quadrant = "(quadrant)" in srow.lower()
    if quadrant:
        stats = {k: re.sub(r"\s*\(quadrant\)", "", v, flags=re.I)
                 for k, v in stats.items()}

    fl = ""
    mm = re.search(r"FLEET LISTS\s*\n(.+?)(?:\n\s*\d+\s*\n|\Z)", txt, re.S)
    if mm:
        fl = re.sub(r"\s+", " ", mm.group(1)).strip()
        fl = re.split(r"Famous Ships", fl)[0].strip()

    pm = re.match(r"^(\d+)\s*PTS", pts_raw)
    if head.upper() == "TYPE/HITS":
        # A continuation page with only an extra configuration of the same ship (Tau
        # Il'Porrui p.473) is not a ship profile of its own.
        return None

    return dict(page=page.number + 1, fleet=fleet, title=head,
                pts=int(pm.group(1)) if pm else None, pts_raw=pts_raw,
                stats=stats, stat_ok=stat_ok, statline=srow, quadrant=quadrant,
                defense_label="SPORES" if stat_labels is TYRANID_STATS else "TURRETS",
                arms=arms, extras=extras, fleet_lists=fl)


out = []
for i in range(len(d)):
    try:
        r = parse(d[i])
    except Exception as e:
        print("ERROR p.%d: %s" % (i + 1, e), file=sys.stderr)
        r = None
    if r:
        out.append(r)

io.open(_os.path.join(_os.path.dirname(_os.path.abspath(__file__)), "profiles_raw.json"), "w", encoding="utf-8", newline="\n").write(
    json.dumps(out, ensure_ascii=False, indent=1))

bad = [p for p in out if not p["stat_ok"]]
print("extracted %d profiles" % len(out))
print("stats line did not match the pattern: %d" % len(bad))
for p in bad[:12]:
    print("   p.%-4d %-34s %r" % (p["page"], p["title"], p["statline"][:60]))
print("weapon row distribution:", {n: sum(1 for p in out if len(p["arms"]) == n)
                                 for n in sorted({len(p["arms"]) for p in out})})
print("OPTIONS:", sum(1 for p in out if "OPTIONS" in p["extras"]),
      " SPECIAL:", sum(1 for p in out if "SPECIAL" in p["extras"]),
      " NOTES:", sum(1 for p in out if "NOTES" in p["extras"]))
