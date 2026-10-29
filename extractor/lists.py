# -*- coding: utf-8 -*-
"""Extracts the fleet lists (sections, rule text, rows) from the Fleets WiP PDF."""
import fitz, json, re, io
import os as _os, sys as _sys
_sys.path.insert(0, _os.path.dirname(_os.path.abspath(__file__)))
import books

SRC = books.FLEETS
d = fitz.open(SRC)
profiles = json.load(io.open(_os.path.join(_os.path.dirname(_os.path.abspath(__file__)), "profiles_raw.json"), encoding="utf-8"))
PROFILE_PAGES = {p["page"] for p in profiles}

# (name, first page) — taken from the profiles' FLEET LISTS references
LISTS = [
    ("Imperial Navy — Gothic Sector", 35),
    ("Imperial Navy — Bastion Fleets", 36),
    ("Imperial Navy — Armageddon Sector", 40),
    ("Imperial Navy — Bakka Sector", 48),
    ("Space Marines — Codex Astartes", 97),
    ("Space Marines — Crusade", 98),
    ("Space Marines — Dominion", 100),
    ("Adeptus Mechanicus — Explorator", 124),
    ("The Emperor's Inquisition", 148),
    # Page 144 has its own heading "GREY KNIGHTS FLEET LIST" and under it
    # its own FLEET COMMANDER, CAPITAL SHIPS, ESCORTS and ATTACK RATING.
    # Without this row it merged into the Inquisition, so the list had
    # two commander and two hull sections at different prices.
    ("Grey Knights", 154),
    ("Rogue Traders", 184),
    ("Rogue Traders — Exploration", 186),
    ("Rogue Traders — Pirates and Wolf Packs", 188),
    ("Chaos — Incursion", 242),
    ("Chaos — Black Crusade", 244),
    ("Chaos — Tzeentch", 246),
    ("Chaos — Nurgle", 248),
    ("Chaos — Khorne", 250),
    ("Chaos — Slaanesh", 252),
    # The book has two Eldar Corsairs lists: page 316's heading is
    # "GOTHIC SECTOR" and page 317's "LATER GOTHIC WAR". Only
    # the latter has the Void Stalker battleship and two
    # light cruisers. Without the separation they showed as one list
    # with two commander sections.
    ("Eldar Corsairs \u2014 Gothic Sector", 314),
    ("Eldar Corsairs \u2014 Later Gothic War", 315),
    ("Eldar — Iyanden Craftworld", 316),
    ("Dark Eldar — Pirates", 353),
    ("Orks — Cyclops Cluster", 367),
    ("Orks — Waaagh!", 368),
    ("Orks — Da Ork Clanz", 374),
    ("Necrons — Harvest Fleet", 406),
    ("Tyranids — Vanguard Fleet", 429),
    ("Tyranids — Hive Fleet", 430),
    ("Tau — Merchant Fleet", 454),
    ("Tau — Commerce Protection", 456),
    ("Demiurg — War Host", 486),
]
STARTS = sorted({pg for _, pg in LISTS})

# "(0–1) Name (pg. 377)........ 310 pts"   /   "Name (pg. 67)......255 pts"
ENTRY = re.compile(
    # The brackets are optional: the book uses both "(0-1) Name" and
    # "0-1 Name". Without brackets a space is required, so that "0-1" cannot
    # be part of the name.
    r"^(?:\((?P<lo>\d+)\s*[–-]\s*(?P<hi>\d+)\)\s*"
    r"|(?P<lo2>\d+)\s*[–-]\s*(?P<hi2>\d+)\s+)?"
    r"(?P<name>.+?)\s*\(pg\.\s*(?P<pg>\d+)\)\s*[\).\s]*?"
    # A numeric price requires "pts": without it any table of contents
    # line ending in a number would look like a list row. A price in words is
    # unambiguous, so the suffix is not required for it - the book
    # writes "......varies" and "......Free" without it.
    r"(?:(?P<pts>\+?[\d,]+)\s*pts?\.?"
    r"|(?P<word>Free|Special|Varies)\s*(?:pts?\.?)?)$", re.I)
# "One extra re-roll........+20 pts"  (no page reference)
UPGRADE = re.compile(
    # The same optional count limit as in the ENTRY pattern: the book writes
    # "0-3 Farseers.........+30 pts" without a page reference.
    r"^(?:(?P<lo>\d+)\s*[\u2013-]\s*(?P<hi>\d+)\s+)?"
    r"(?P<name>[^.]+?)\s*\.{2,}\s*"
    r"(?:(?P<pts>\+?[\d,]+)\s*pts?\.?"
    r"|(?P<word>Free|Special|Varies)\s*(?:pts?\.?)?)$", re.I)
# section heading: CAPITAL LETTERS, or a short line without a closing mark
CAPS = re.compile(r"^[A-Z’'&\- ]{3,40}$")
# The book's headings with a comma. A comma cannot be allowed in the pattern,
# because the book's two-line headings would then break at the wrong
# place ("XENOS FREEBOOTERS, CORSAIRS AND", "PRINCE YRIEL, BEARER
# OF THE"). These are read from the book and checked one by one.
# v0.40 p.149: the Inquisition's ordnance paragraph has the heading
# "WEAPONS, ORDNANCE AND UPGRADES" (v0.36: ORDNANCE AND UPGRADES).
EXTRA_HEADS = {"ALLIES, SUBJECTS & MERCENARIES", "WEAPONS, ORDNANCE AND UPGRADES"}
_EXTRA_HEAD_HITS = []
# A slash belongs to the heading: "Up to Three Port/Starboard Weapons"
# (the tyranids' hive ship, p.430) and "Reserve/allies" (the Inquisition,
# p.140-142). Without it they ran into the previous section, and
# the tyranids lost two weapon rows in the duplicate pruning.
SUBHEAD = re.compile(r"^[‘'A-Z][\w’'\-/ ]{2,34}$")
# "0-12 Cruisers", "0-1 Admiral", "1-2 Kroozers" -- a heading with a count limit
COUNTHEAD = re.compile(r"^(?P<lo>\d+)\s*[–-]\s*(?P<hi>\d+)\s+(?P<t>[‘'A-Z][\w’'\- ]{2,30})$")
# The same count limit can be AFTER the name in brackets: the book's only
# such heading is "Kroot Vessels (0-3)" (Demiurg, p.487).
# Without this the Kroot Warsphere ran into the Cruisers section, where the book
# says explicitly that Warspheres do not count as cruisers.
TAILCOUNT = re.compile(r"^(?P<t>[‘'A-Z][\w’'\-/ ]{2,30}?)\s*\((?P<lo>\d+)\s*[–-]\s*(?P<hi>\d+)\)$")
_TAILCOUNT_HITS = []


def clean(s):
    return re.sub(r"\s+", " ", s).replace("\u2009", " ").strip()


def page_lines(pg):
    return [clean(l) for l in d[pg - 1].get_text().split("\n") if clean(l)]


def pages_of(start):
    """A list's pages: from the start until a profile page or the next list comes."""
    out, p = [], start
    nxt = min([s for s in STARTS if s > start], default=10 ** 6)
    while p < nxt and p - start < 12:
        if p != start and p in PROFILE_PAGES:
            break
        out.append(p)
        p += 1
    return out


_OWNED = None


def owned_pages():
    """All pages that belong to some list, not only the first pages."""
    global _OWNED
    if _OWNED is None:
        _OWNED = set()
        for s in STARTS:
            _OWNED.update(pages_of(s))
    return _OWNED


def rules_pages(start):
    """The continuous rule pages before the list (no profiles, no other list).

    The stop used to be only at a list's FIRST page, so the previous
    list's continuation pages ran into this block: Armageddon's "FLEET RULES
    (pg. 37-39)" were pages of the Bastion list, and its own composition rules
    showed as Armageddon's rules. Now the stop is at any
    page that belongs to some list."""
    out, p = [], start - 1
    owned = owned_pages()
    while p > 0 and len(out) < 6 and p not in PROFILE_PAGES and p not in owned:
        out.append(p)
        p -= 1
    return sorted(out)


def page_map(lines, pages):
    """The page boundaries of the joined rule text: [[char, page], ...] (J165).

    The rule lines are joined into a paragraph with a space, and the page is lost
    in the joining. A row made from prose ("One extra re-roll") needs
    its sentence's page, so every page break is recorded as a char position
    in the joined text. The lines are already clean()ed, so clean()
    after the joining does not shift the positions."""
    out, pos = [], 0
    for ln, pg in zip(lines, pages):
        if not out or out[-1][1] != pg:
            out.append([pos, pg])
        pos += len(ln) + 1
    return out


def parse_list(name, start):
    secs, cur = [], None
    warn = []
    rp = rules_pages(start)
    if rp:
        pre, pre_pg = [], []
        for pg in rp:
            for ln in page_lines(pg):
                if re.fullmatch(r"\d{1,3}", ln):
                    continue
                pre.append(ln)
                pre_pg.append(pg)
        if pre:
            secs.append(dict(title="FLEET RULES (pg. %d–%d)" % (rp[0], rp[-1]),
                             rules=[" ".join(pre)], entries=[],
                             pg=page_map(pre, pre_pg)))
    cur = None
    for pg in pages_of(start):
        for ln in page_lines(pg):
            if re.fullmatch(r"\d{1,3}", ln):        # page number
                continue
            m = ENTRY.match(ln)
            if m and m.group("pg") and 40 <= int(m.group("pg")) <= 540:
                lo = m.group("lo") or m.group("lo2")
                hi = m.group("hi") or m.group("hi2")
                if cur is None:
                    cur = dict(title="Ships", rules=[], entries=[])
                    secs.append(cur)
                pts_s = (m.group("pts") or m.group("word")).replace(",", "")
                add = pts_s.startswith("+")
                try:
                    pts = int(pts_s.lstrip("+"))
                except ValueError:
                    # "Free" is zero; "Varies" and "Special" are left for the player
                    # to enter, because the book gives them no number.
                    pts = 0 if pts_s.lower() == "free" else None
                ref = int(m.group("pg"))
                lbl = re.sub(r"\s*\(pg\.\s*\d+\)", "", m.group("name"))
                e = dict(label=clean(lbl), ref=ref, pts=pts,
                         add=add, raw=ln, src_page=pg)
                if lo:
                    e["min"], e["max"] = int(lo), int(hi)
                if ref not in PROFILE_PAGES:
                    e["warn"] = "pg. %d is not a profile page" % ref
                    warn.append((name, ln))
                if pts is not None and pts > 1200:
                    e["warn"] = (e.get("warn", "") + " implausible price").strip()
                    warn.append((name, ln))
                cur["entries"].append(e)
                continue
            u = UPGRADE.match(ln)
            if u and cur is not None and "pg." not in ln:
                pts_s = (u.group("pts") or u.group("word")).replace(",", "")
                try:
                    pts = int(pts_s.lstrip("+"))
                except ValueError:
                    pts = 0 if pts_s.lower() == "free" else None
                ue = dict(label=clean(u.group("name")), ref=None,
                          pts=pts, add=pts_s.startswith("+"),
                          upgrade=True, raw=ln, src_page=pg)
                if u.group("lo"):
                    ue["min"] = int(u.group("lo"))
                    ue["max"] = int(u.group("hi"))
                cur["entries"].append(ue)
                continue
            ch = COUNTHEAD.match(ln) or TAILCOUNT.match(ln)
            if ch:
                if TAILCOUNT.match(ln):
                    _TAILCOUNT_HITS.append((name, ln))
                cur = dict(title=ch.group("t").strip(), rules=[], entries=[],
                           lo=int(ch.group("lo")), hi=int(ch.group("hi")), head=ln)
                secs.append(cur)
                continue
            if ln in EXTRA_HEADS:
                _EXTRA_HEAD_HITS.append((name, ln))
            if (ln in EXTRA_HEADS or CAPS.match(ln)
                    or (SUBHEAD.match(ln) and len(ln.split()) <= 5
                        and not ln.endswith((".", ",", ":", ";")))):
                cur = dict(title=ln, rules=[], entries=[])
                secs.append(cur)
                continue
            if cur is None:
                cur = dict(title="Intro", rules=[], entries=[])
                secs.append(cur)
            cur["rules"].append(ln)
            cur.setdefault("lpg", []).append(pg)
            # The book's order tells whom a row belongs to: the rows that follow
            # a priced row describe it, until the next one comes.
            # Without this the information is lost when the rows are joined into a paragraph.
            cur.setdefault("own", []).append(
                cur["entries"][-1]["label"] if cur["entries"] else None)
    # join the rule lines into paragraphs
    for s in secs:
        # The description texts line by line before the joining.
        if s.get("own"):
            d = {}
            for ln, ow in zip(s["rules"], s["own"]):
                if ow:
                    d.setdefault(ow, []).append(ln)
            if d:
                s["desc"] = {k: clean(" ".join(v)) for k, v in d.items()}
        s.pop("own", None)
        lpg = s.pop("lpg", None)
        if lpg:
            s["pg"] = page_map(s["rules"], lpg)
        s["rules"] = [clean(" ".join(s["rules"]))] if s["rules"] else []
    secs = [s for s in secs if s["entries"] or s["rules"]]
    return dict(name=name, start=start, pages=pages_of(start), sections=secs), warn


out, warns = [], []
for n, p in LISTS:
    L, w = parse_list(n, p)
    out.append(L)
    warns += w

io.open(_os.path.join(_os.path.dirname(_os.path.abspath(__file__)), "lists_raw.json"), "w", encoding="utf-8", newline="\n").write(
    json.dumps(out, ensure_ascii=False, indent=1))
tot = sum(len(s["entries"]) for L in out for s in L["sections"])
print("lists %d, sections %d, rows %d" %
      (len(out), sum(len(L["sections"]) for L in out), tot))
# the Tau heading on both Tau lists, the Inquisition's once
assert len(_EXTRA_HEAD_HITS) == 3, (
    "the named headings did not hit three times: %s" % _EXTRA_HEAD_HITS)
print("named headings: %d" % len(_EXTRA_HEAD_HITS))
assert len(_TAILCOUNT_HITS) == 1, (
    "a count limit in brackets did not hit once: %s" % _TAILCOUNT_HITS)
print("count limits in brackets: %d" % len(_TAILCOUNT_HITS))
print("warnings %d:" % len(warns))
for n, ln in warns[:15]:
    print("   %-34s %s" % (n[:34], ln[:80]))
