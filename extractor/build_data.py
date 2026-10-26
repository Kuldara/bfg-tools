# -*- coding: utf-8 -*-
"""Assembles bfg_data.json: ship profiles + fleet lists + list rules that can be
checked by machine.

Rules are tied to the list's OWN sections ('Battleships', 'Cruisers', 'KROOZERS'),
not to the ships' TYPE field: in the book e.g. a 'heavy cruiser' has the stats of a
'Cruiser', so counting by the type field would give wrong results.

Run order:  extract.py -> lists.py -> build_data.py
"""
import json, io, re, collections, os, sys
import upgrades
import swaps, copy
_HERE = os.path.dirname(os.path.abspath(__file__))
_OUT = os.path.join(_HERE, "..", "data", "bfg_data.json")

P = json.load(io.open(os.path.join(_HERE, "profiles_raw.json"), encoding="utf-8"))
L = json.load(io.open(os.path.join(_HERE, "lists_raw.json"), encoding="utf-8"))

# Typos of the book in a ship's faction field. The field prints as is in the
# card's subtitle, so the spelling is corrected.
SHIP_FL_FIX = {"INQUISTION": "INQUISITION"}
_FL_FIXED = [0]

FIXES = {
    # The list row on page 372 is corrupted: "(pg. 377)). 2310 pts".
    # Both the price and the page reference in it are wrong. The right numbers are
    # from the profile page 381 ("ZUKOV'S KLAW ASSAULT KROOZER  210 PTS") and
    # the points index on page 534 ("Zukov's Klaw Assault Kroozer 210").
    # ref must be given here. Otherwise the page reference cross-check
    # fixes the reference itself and writes its own note over this
    # one, and the price fix would go unreported.
    ("Orks — Da Ork Clanz", "Zukov's Klaw (Goff only)"):
        dict(pts=210, ref=381,
             note="Source misprint: the list row on pg. 372 reads "
                  "'(pg. 377)). 2310 pts'. Both numbers are wrong: the "
                  "profile on pg. 381 and the points index on pg. 534 "
                  "give 210 pts."),
    # These rows are on page 145 of the book, which is the Grey Knights list.
    # The key used to be "The Emperor's Inquisition", because Grey Knights
    # had been merged into it; after the lists were separated on 7.9.2026 the key
    # is Grey Knights. Without the change the fix stopped matching and
    # the page references went back to the book's wrong ones.
    ("Grey Knights", "Rapid strike vessel (Sword)"):
        dict(ref=82, note="Source misprint: pg. 80 is the Falchion; Sword is pg. 82."),
    ("Grey Knights", "Rapid strike vessel (Cobra)"):
        dict(ref=84, note="Source misprint: pg. 82 is the Sword; Cobra is pg. 84."),
    # On page 176 of the book the row is "Havoc Class Frigatevvvv....35 pts":
    # the page reference is corrupted after the name. The same ship is on pages
    # 174 and 179 as "Havoc Class Frigate (pg. 81)".
    ("Rogue Traders — Exploration", "Havoc Class Frigatevvvv"):
        dict(ref=81, label="Havoc Class Frigate",
             note="Source misprint: the page reference on pg. 176 is garbled "
                  "into the name ('Frigatevvvv'). The ship is on pg. 81."),
    ("Eldar — Iyanden Craftworld", "Aspect Warrior Host"):
        dict(ref=None, upgrade=True,
             note="Fleet upgrade from pg. 305, not a ship profile."),
}

# The book's number words. Above ten is needed for the Demiurg cap "no more
# than twelve cruisers" (p.487); it is the book's only number word above ten
# in a rule sentence.
# Comparison form: letters and digits only. Used both to identify a sentence's
# owner and to weed out a repeated note.
def _nkey(s):
    return re.sub(r"[^a-z0-9]+", "", (s or "").lower())


# The effects of a ship's own options. The key is (profile page, a tag from
# the option text); the value is merged into the option dict.
#
#   mod  stat change: hp, tu (turrets), sh (shields)
#   swp  weapon row change: f = name pattern, rg = range, st = strength
#        ("+2" and "-2" are changes, anything else is an absolute value)
#   qty  a repeatable choice: at most max times
#
# These are read from the book one by one. Without them a paid option changed
# only the price and never the card.
OPT_EFFECTS = {
    # p.68: "Originally fitted with 45cm range weapons batteries
    # (Firepower 6), these were later upgraded to shorter ranged but more
    # powerful weapons as shown."  So the older version is 45 cm / FP 6.
    (68, "Originally fitted with 45cm range"):
        dict(swp=dict(f=r"weapons battery", rg="45 cm", st="6")),
    # p.374: "May upgrade its turrets from two to three for +10 pts."
    (374, "upgrade its turrets from two to three"):
        dict(mod=dict(tu=1)),
    # --- Spot check 6 (a wide review) -------------------------------------
    # p.255 Chaos battle barge: "Can embark Chaos Space Marines for +35
    # points" and "may embark Chosen Terminators for +10 points" are the same
    # purchases as the god lists' rows "<Legion> Chaos Space Marine crew" and
    # "Chosen Terminators (battleship / grand cruiser)" (p.234-249). cov =
    # the pattern of the row name the option covers (domain.js optionCoversRow);
    # a crew bought with the option also opens the Mark (p.244 "A ship with a
    # World Eaters Chaos Space Marine crew may have a Mark of Khorne").
    (255, "Can embark Chaos Space Marines"):
        dict(cov=r"chaos space marine crew$"),
    (255, "may embark Chosen Terminators"):
        dict(cov=r"^chosen terminators"),
    # An option the book gives no price for is free, not "see text":
    # p.105 Strike cruiser "May replace its launch bays for strength-6,
    # speed: 30 cm torpedo tubes", p.151 Grey Knights strike cruiser "May
    # replace launch bays for a firepower-5 ... bombardment cannon battery"
    # (the Codex equivalent p.105 says "for no change in cost"); p.84 the Cobra's
    # radar refit's price is in its own entry below.
    (105, "strength-6, speed: 30 cm torpedo tubes"):
        dict(c=0),
    # p.69 Tyrant "Can replace its prow torpedoes with a nova cannon at a cost
    # of +20 pts" is the same purchase as the Mechanicus list's p.121 row "Nova Cannon
    # instead of prow torpedoes" (+20) - cov covers the row (spot check 7 row 85).
    (69, "replace its prow torpedoes with a nova cannon"):
        dict(cov=r"^nova cannon instead of prow torpedoes$"),
    # p.53 Emperor "For an extra +5 points an Emperor class ship may carry
    # squadrons of Shark assault boats" is the same purchase as the Bakka list's p.49
    # "An Emperor class battleship may carry Shark assault boats at an
    # additional cost of +5 points" - cov covers the row (spot check 15 row 13).
    (53, "carry squadrons of Shark assault boats"):
        dict(cov=r"^shark assault boats"),
    (151, "firepower-5, range 30 cm (front arc only) bombardment cannon battery"):
        dict(c=0),
    # --- P1-2: additive stat effects (reference/options.json) ---------------
    # p.61: "May purchase a third turret for an additional +10 points."
    (61, "third turret"):
        dict(mod=dict(tu=1)),
    # p.66: "Can have its turret array upgraded from 2 to 3 at an
    # additional cost of +10 pts"
    (66, "turret array upgraded from 2 to 3"):
        dict(mod=dict(tu=1)),
    # p.105: "May take an additional shield for +15 points."
    (105, "additional shield"):
        dict(mod=dict(sh=1)),
    # p.269: "May have a third shield for +15 pts, when modelled on a
    # large 60 mm base."
    (269, "third shield"):
        dict(mod=dict(sh=1)),
    # --- Boarding torpedoes are NOT a weapon row (J190, user 12.10.2026) ----
    # The user: a boarding torpedo purchase goes only on the option row, not to the
    # weapons, because it buys only a new kind of ammunition for the existing
    # torpedoes. Rulebook p.78: "Boarding torpedoes are launched like
    # ordinary torpedoes". So the option (p.374, 377, 380, 382, 383, 389) adds no
    # row to the profile: the ammunition's speed and strength are in the option's own
    # text, and the Boarding Torpedoes rule row comes from the option's text.
    # Before, these had add=["Boarding torpedoes", "20 cm", ...] (P1-3);
    # the acknowledgements are in reference/options.json (effect null).
    # The hulk's option is the same purchase as the Clanz list's "Boarding torpedoes (Space
    # Hulk)" +15 (p.372) - cov covers the row (spot check 7 row 22).
    (389, "equipped with boarding torpedoes"):
        dict(cov=r"^boarding torpedoes"),
    # --- item 7, batch 2: battery refits (reference/options.json) -----------
    # p.59: "Reduce the range of the weapons batteries to 30 cm and increase
    # their firepower to 10, at no extra points"
    (59, "shorter range but more powerful weapons batteries"):
        dict(swp=dict(f=r"weapons battery", rg="30 cm", st="10")),
    # p.64: "Its 45 cm weapons batteries increase their range to 60 cm for
    # +10 points" - only the 45 cm batteries, the 60 cm batteries stay
    (64, "improved weapons batteries"):
        dict(swp=dict(f=r"weapons battery", onlyrg="45 cm", rg="60 cm")),
    # p.269: "increases the range of its dorsal lances to 45 cm at an
    # additional cost of +10 pts"
    (269, "ancient targeting systems"):
        dict(swp=dict(f=r"dorsal lance", rg="45 cm")),
    # --- item 7, batch 3: prow armour 6+ (reference/options.json) -----------
    # p.72 (the same text p.73-76, 181): "May increase the prow armour to 6+
    # for no additional cost. However, if this option is taken, the turning
    # radius of these vessels is reduced to 45 degrees." Base 5+ / 90°.
    # set sets a text stat; mod adds to a number. The same ship is printed
    # on several pages for different lists, and every page is a key of its own.
    (72, "prow armour to 6+"):  dict(set=dict(ar="6+ front / 5+", tn="45°")),
    (73, "prow armour to 6+"):  dict(set=dict(ar="6+ front / 5+", tn="45°")),
    (74, "prow armour to 6+"):  dict(set=dict(ar="6+ front / 5+", tn="45°")),
    (75, "prow armour to 6+"):  dict(set=dict(ar="6+ front / 5+", tn="45°")),
    (76, "prow armour to 6+"):  dict(set=dict(ar="6+ front / 5+", tn="45°")),
    (181, "prow armour to 6+"): dict(set=dict(ar="6+ front / 5+", tn="45°")),
    # --- item 7, batch 4 (reference/options.json) ---------------------------
    # p.472/473 Emissary: "a deflector that raises its prow armour to 6+ for
    # +10 points" - three page keys for the same ship (configurations)
    ("472",  "deflector that raises its prow armour"): dict(set=dict(ar="6+ front / 5+")),
    ("472b", "deflector that raises its prow armour"): dict(set=dict(ar="6+ front / 5+")),
    ("472c", "deflector that raises its prow armour"): dict(set=dict(ar="6+ front / 5+")),
    # p.359: "Torpedo-bommas only move 20 cm ... an additional ordnance choice
    # available to the carrier and do not replace fighta-bommas." Every
    # launch bay of the ship gets the new ordnance type in its range cell.
    (374, "equipped with torpedo bommas"):
        dict(swp=dict(f=r"launch bay", rgadd="Torpedo-Bommas: 20 cm")),
    (376, "equipped with torpedo bommas"):
        dict(swp=dict(f=r"launch bay", rgadd="Torpedo-Bommas: 20 cm")),
    (377, "equipped with torpedo bommas"):
        dict(swp=dict(f=r"launch bay", rgadd="Torpedo-Bommas: 20 cm")),
    (378, "equipped with torpedo bommas"):
        dict(swp=dict(f=r"launch bay", rgadd="Torpedo-Bommas: 20 cm")),
    (379, "equipped with torpedo bommas"):
        dict(swp=dict(f=r"launch bay", rgadd="Torpedo-Bommas: 20 cm")),
    # --- item 7, batch 6 (reference/options.json) ---------------------------
    # p.480/481 "Ion Cannon Turret": NO add row - the option already owns
    # the base row through aws (the 480_defence group, gmax 1: one defence
    # system per security module). add would have doubled the turret.
    # p.126: "an Ark Mechanicus may exchange its broadside lance batteries
    # for strength-2 launch bays for +10 points." Rows 2-3 (port/starboard
    # lance battery) are replaced; attack craft Fury/Starhawk (p.125).
    # sw has the same structure swaps.py produces: f = row indexes,
    # t = the replacing rows in the same order.
    (126, "represents only one of several unique Arks"):
        dict(sw=dict(f=[2, 3], t=[["Port launch bays", "Furies: 30 cm / Starhawks: 20 cm", "2", "–"],
                                 ["Starboard launch bays", "Furies: 30 cm / Starhawks: 20 cm", "2", "–"]])),
    # --- item 7, batch 7 (reference/options.json) ---------------------------
    # p.279 Murder: "replace its Firepower 10 weapons batteries with Firepower
    # 4 weapons batteries and Strength 2 lance batteries (all 45 cm range,
    # with port and starboard arcs each) for no extra points". The batteries
    # shrink (swp) and two lance rows are added (the add list).
    (279, "Firepower 10 weapons batteries with Firepower 4"):
        dict(swp=dict(f=r"weapons battery", st="4"),
             add=[["Port lance battery", "45 cm", "2", "Left"],
                  ["Starboard lance battery", "45 cm", "2", "Right"]]),
    # p.84 Cobra: the radar refit "removes the squadron's weapons batteries".
    # The book gives no price: free, not "see text" (spot check 6 rows
    # 64, 73).
    (84, "experimental long range detection gear"):
        dict(c=0, **{"del": r"weapons battery"}),
    # p.192 Armed Cargo Vessel: "converted to a fast clipper by entirely
    # removing its primary battery armament for the Advanced Drive Technology
    # refit" - p.175: "+5 cm to its speed as well as +1D6 when undergoing All
    # Ahead Full". 25 cm -> 30 cm, the battery off, "for no extra cost" -> 0.
    (192, "Fast Clipper"):
        dict(**{"del": r"weapons battery"}, set=dict(sp="30 cm"), c=0),
    # p.182 Heavy Transport: "Super-Heavy Transport (+50 pts): ... add +4HP to
    # their profile". Spot check 5 (10.9.2026), row 52.
    (182, "Super-Heavy Transport"):
        dict(mod=dict(hp=4)),
    # p.462 Merchant (both configurations): "increase their hits from 4 to 6
    # at a cost of +15 points". Spot check 5, row 84.
    ("462",  "increase their hits from 4 to 6"): dict(mod=dict(hp=2)),
    ("462b", "increase their hits from 4 to 6"): dict(mod=dict(hp=2)),
    # p.494: the Warsphere's hull and battery grow or shrink in pairs.
    (494, "may add 2HP and 2 firepower"):
        dict(mod=dict(hp=2), swp=dict(f=r"weapons battery", st="+2"),
             qty=dict(max=3)),
    (494, "may subtract 2HP and 2 firepower"):
        dict(mod=dict(hp=-2), swp=dict(f=r"weapons battery", st="-2"),
             qty=dict(max=2)),
    (494, "add +1 shield"):
        dict(mod=dict(sh=1)),
    (494, "+1 turret strength"):
        dict(mod=dict(tu=1)),
    (494, "extend the range of its weapons battery by +15 cm"):
        dict(swp=dict(f=r"weapons battery", rg="45 cm")),
}
_OPT_EFFECT_HITS = {}

NUM = {"one": 1, "two": 2, "three": 3, "four": 4, "five": 5, "six": 6,
       "seven": 7, "eight": 8, "nine": 9, "ten": 10, "eleven": 11,
       "twelve": 12, "a": 1, "an": 1}


def n(w):
    w = (w or "").strip().lower().replace(",", "")
    if w in NUM:
        return NUM[w]
    return int(w) if w.isdigit() else None


ABBR = [(r"\bmax\.", "max"), (r"\bpg\.", "pg"), (r"\bapprox\.", "approx"),
        (r"\bi\.e\.", "ie"), (r"\be\.g\.", "eg"), (r"\bNo\.", "No"),
        (r"\bMk\.", "Mk"), (r"\bSt\.", "St")]


def sentences(t):
    """Sentence splitting. Abbreviations are cleaned first: 'a max. of one Warlord per 500
    points' was otherwise cut in two, and the rule went unrecognised."""
    for pat, rep in ABBR:
        t = re.sub(pat, rep, t)
    return [x.strip() for x in re.split(r"(?<=[.!?])\s+", t) if x.strip()]


def sing(w):
    w = w.strip().lower()
    w = re.sub(r"[^a-z’' ]", "", w).strip()
    for suf in ("zes", "ies", "s"):
        if w.endswith(suf) and len(w) > 4:
            return w[:-len(suf)] + ("y" if suf == "ies" else ("z" if suf == "zes" else ""))
    return w


# ------------------------------------------------------------------ SHIPS
def ship_type(p):
    return (p["stats"].get("TYPE/HITS", "") or "").split("/")[0].strip() or "Ship"


def hits(p):
    m = re.search(r"/(\d+)", p["stats"].get("TYPE/HITS", ""))
    return int(m.group(1)) if m else None


PTS_COST = [
    (re.compile(r"at\s+no\s+(?:extra|additional)\s+points?\s+cost", re.I), 0),
    (re.compile(r"free\s+of\s+(?:points\s+)?cost", re.I), 0),
]
# The sign is read too: four of the book's options are negative, i.e. the ship
# is cheaper after the swap (Mercury -20, Victory -10, Dominator -5,
# Warsphere -20). Without the sign they went entirely unpriced.
PTS_NUM = re.compile(r"(?:\+|for\s+|cost\s+of\s+|at\s+|:\s*)(?P<sg>[-\u2013\u2212+]?)\s*(\d+)\s*(?:pts|points)", re.I)
PER_BAY = re.compile(r"per\s+launch\s+bay|per\s+turret|each|per\s+\w+\s+of", re.I)


def parse_options(text):
    """OPTIONS block -> [{t: text, c: price or None, var: 1 if the price varies}]."""
    if not text:
        return []
    parts = [x.strip(" •	") for x in re.split(r"\s*•\s*", text) if x.strip(" •	")]
    out = []
    for i, t in enumerate(parts):
        cost, var = None, 0
        for pat, v in PTS_COST:
            if pat.search(t):
                cost = v
                break
        if cost is None:
            m = PTS_NUM.search(t)
            if m:
                cost = int(m.group(2))
                if m.group("sg") in ("-", "\u2013", "\u2212"):
                    cost = -cost
                if PER_BAY.search(t):
                    var = 1
        o = dict(t=t, c=cost, var=var)
        # "If fitted with a torpedo launcha, it may carry boarding torpedoes"
        if re.match(r"^If\b", t, re.I):
            for j in range(i):
                key = re.search(r"^If\s+(?:it\s+is\s+)?(?:fitted\s+with\s+)?(?:a\s+|an\s+|the\s+)?([\w\- ]{4,26})", t, re.I)
                if key and key.group(1).strip().lower()[:14] in parts[j].lower():
                    o["dep"] = j
                    break
        out.append(o)
    return out


_TURNS_FIXED = [0]


def turns_text(t):
    """p.181 Endeavour prints the TURNS value '90' without a degree sign; the card
    printed it as is (spot check 6). A bare number is degrees.
    The defence structures' '0' (p.506-517) stays: it is not an angle but
    'does not turn', and the book prints it without a sign."""
    t = str(t or "").strip()
    if re.fullmatch(r"[1-9]\d*", t):
        _TURNS_FIXED[0] += 1
        return t + "°"
    return t


ships = {}
for p in P:
    ships[str(p["page"])] = dict(
        pg=p["page"], fl=p["fleet"], nm=p["title"], bp=p["pts"],
        ty=ship_type(p), hp=hits(p),
        sp=p["stats"].get("SPEED", ""), tn=turns_text(p["stats"].get("TURNS", "")),
        sh=p["stats"].get("SHIELDS", ""), ar=p["stats"].get("ARMOUR", ""),
        tu=p["stats"].get("TURRETS", ""), tl=p.get("defense_label", "TURRETS"),
        qd=1 if p.get("quadrant") else 0,
        aw=[[a.get("armament", ""), a.get("range", ""), a.get("fp", ""), a.get("arc", "")]
            for a in p["arms"]],
        op=p["extras"].get("OPTIONS", ""),
        ol=parse_options(p["extras"].get("OPTIONS", "")),
        # In the book the heading is SPECIAL, NOTES or NOTE (singular). Before,
        # only the first two were read, and the NOTE block was left off the card.
        sr=" ".join(x for x in (p["extras"].get(k, "").strip()
                                for k in ("SPECIAL", "NOTES", "NOTE", "UPGRADES", "REFITS"))
                    if x),
    )

# The book's two [???] cross references point to the Rogue Trader Xenotech Systems
# table on page 175. The card prints the corrected reference.
if "184" in ships:
    ships["184"]["sr"] = ships["184"]["sr"].replace("[???]", "p. 175")
if "192" in ships:
    ships["192"]["op"] = ships["192"]["op"].replace("[???]", "p. 175")
    ships["192"]["ol"] = parse_options(ships["192"]["op"])

# On page 481 (Tau Waystation) the SPECIAL box and the table's Ion cannon row
# overlap, and the text extraction merged the weapon row into the first
# sentence: "even if Ion cannon 30 cm 1 All round planetary defences
# are not normally permitted". The book's sentence is "even if planetary defences
# are not normally permitted"; the weapon row is already in the table (aw) on its own.
if "481" in ships:
    _bad = "even if Ion cannon 30 cm 1 All round planetary defences"
    assert _bad in ships["481"]["sr"], "p.481: the expected extraction error is missing - check extract.py"
    ships["481"]["sr"] = ships["481"]["sr"].replace(_bad, "even if planetary defences")

# --- Planetary defences: three profiles the extractor does not get (8.10.2026) ---
# extract.py reads one profile per page and needs both a TYPE/HITS and an
# ARMAMENT heading. Two pages therefore come out short:
#   p.516 FIRE SHIP: a full stats row (Escort/1, 15 cm, 45 degrees, 1, 5+, 1)
#     but NO armament table - the ship itself is the weapon. The book's only one like it.
#   p.517: THREE profiles in a row (Air Base, Defence Laser Silo, Missile
#     Silo); the extractor got only the first. The p.499 price list names all
#     three with their limits (0-8, 0-8, 0-4).
# Read from the pages by hand (python pdf_text.py 516 / 517). The keys 517b/517c
# follow the Tau configurations' convention (458b...): pg is the real page.
for _k in ("516", "517b", "517c"):
    assert _k not in ships, "profile %s already exists: check extract.py" % _k
assert ships["517"]["nm"] == "AIR BASE", ships["517"]["nm"]
ships["516"] = dict(
    pg=516, fl="HIGH ORBIT DEFENCES", nm="FIRE SHIP", bp=10, ty="Escort", hp=1,
    sp="15 cm", tn="45\u00b0", sh="1", ar="5+", tu="1", tl="TURRETS", qd=0,
    aw=[], op="", ol=[],
    sr=("\u2022 The controlling player can detonate a fire ship at any point in its "
        "movement phase, inflicting D3 Fire critical hits on every ship within 3D6 cm. "
        "As with any escort suffering a critical hit, escorts within the fire ship's "
        "blast will be automatically destroyed, as are any Ordnance markers. Remove "
        "the detonated fire ship and put a Blast marker in its place."))
ships["517b"] = dict(
    pg=517, fl="LOW ORBIT DEFENCES", nm="DEFENCE LASER SILO", bp=15, ty="Ground", hp=1,
    sp="0", tn="0", sh="0", ar="6+", tu="0", tl="TURRETS", qd=0,
    aw=[["Lance battery", "60 cm", "3", "Front"]], op="", ol=[], sr="")
ships["517c"] = dict(
    pg=517, fl="LOW ORBIT DEFENCES", nm="MISSILE SILO", bp=5, ty="Ground", hp=1,
    sp="0", tn="0", sh="0", ar="6+", tu="0", tl="TURRETS", qd=0,
    aw=[["Torpedoes", "30 cm", "6", "Front"]], op="", ol=[], sr="")
# p.337 and p.347: "An Eldar Haven space station ... may be used as a Dark Eldar
# pirate base by trading its bombers for Slavebringer assault boats and its
# Pulsar Lances for Phantom Lances for no change in cost. It is otherwise
# unchanged." The book prints no profile of its own for the base: the Haven's (p.334)
# rows swapped. The fighters stay (Darkstar 30 cm) - the swap names only
# the bombers and the lances; the Slavebringer's speed 30 cm is from the p.345 table.
# Range 45 cm and strength 3 are the Haven's own ("otherwise unchanged");
# the Dark Eldar ships' phantom lances are 30 cm (p.352), which is not carried over.
assert "334b" not in ships and ships["334"]["nm"] == "HAVEN SPACE STATION"
assert [a[0] for a in ships["334"]["aw"]] == ["Weapons battery", "Launch bays", "Pulsar lances"], ships["334"]["aw"]
ships["334b"] = dict(ships["334"])
ships["334b"]["aw"] = [list(ships["334"]["aw"][0]),
                       ["Launch bays", "Darkstar: 30 cm / Slavebringer: 30 cm", "5 squadrons", "\u2013"],
                       ["Phantom lances", "45 cm", "3", "All around"]]
ships["334b"]["ol"] = []

# Page 480 is one Orbital profile to assemble, with the SPECIAL boxes of the Core,
# Security, Manufacturing and Habitat modules on different parts of the
# page. An ordinary one-table extractor gets the texts but loses the headings and
# the Core box before the armament. The whole game effect is kept here,
# condensing the handbook's wording.
if "480" in ships:
    ships["480"]["sr"] = (
        "• A core module supplies the command, communication, energy and sensor facilities "
        "for an array along with habitats for all key staff. A core module and all its "
        "ancillary modules are treated as one model for game purposes. "
        "• Normally individual orbital modules are assembled into arrays of up to five. "
        "The first module must be the core module and no more than four other modules can "
        "be added. An Orbital costs its core plus the sum of all added modules. "
        "• Each security module adds +1 turret to the Core module. "
        "• Each security module includes one of the defence systems below, at the points cost shown. "
        "• Orcas and Wardens assigned to guard an Orbital have a base leadership of 7 and "
        "cannot squadron with other escorts. "
        "• Up to four modules in all: security, manufacturing & research and habitat "
        "modules, each bought below (J171)."
    )

# Several Tau profile pages have two or three alternative armament
# configurations of the same hull. The PDF extractor reads only the page's first
# table on purpose, so the other configurations are added as explicit profiles. They
# get a synthetic key (e.g. 458b), but the card's source page is still 458.
# The named variants of the Xenos Vessel. The book has one list row at 50 points,
# but pages 186-188 give three named ships at the same price, each
# with its own weapon and special rule. Without the expansion they are in the data
# but available to no one.
XENOS_VARIANTS = {
    "184": [
        ("184", None),                       # generic, name unchanged
        ("186", "Pthuxutl war cruiser"),
        ("187", "Fra'al raider"),
        ("188", "Nekulli whip"),
    ],
}
# The source sentence that must be found in the SPECIAL block of page 184. If the book
# changes, the expansion must not stay in force on an old assumption.
XENOS_SOURCE = "all of them cost 50 points"

TAU_CONFIGS = {
    "458": [
        ("458", "Vash’ya Mk XXIII"),
        ("458b", "Bor’kan Mk XXIV", [
            ["Prow Railgun battery", "45 cm", "6", "Left/front/right"],
            ["Prow gravitic launcher", "20–40 cm", "8", "Front"],
            ["Port launch bays", "Barracudas: 25 cm / Mantas: 20 cm", "2 squadrons", "–"],
            ["Starboard launch bays", "Barracudas: 25 cm / Mantas: 20 cm", "2 squadrons", "–"],
            ["Port gravitic hook", "–", "Capacity: 1 Orca/Warden", "–"],
            ["Starboard gravitic hook", "–", "Capacity: 1 Orca/Warden", "–"],
            ["Dorsal gravitic hook", "–", "Capacity: 1 Orca/Warden", "–"],
        ]),
    ],
    "460": [
        ("460", "Vash’ya"),
        ("460b", "T’olku", [
            ["Prow Railgun battery", "45 cm", "4", "Left/front/right"],
            ["Prow gravitic launcher", "20–40 cm", "6", "Front"],
            ["Port launch bays", "Barracudas: 25 cm / Mantas: 20 cm", "1 squadron", "–"],
            ["Starboard launch bays", "Barracudas: 25 cm / Mantas: 20 cm", "1 squadron", "–"],
            ["Port Railgun battery", "45 cm", "4", "Left/front"],
            ["Starboard Railgun battery", "45 cm", "4", "Front/right"],
        ]),
    ],
    "462": [
        ("462", "Ke’lshan"),
        ("462b", "Dal’yth", [
            ["Prow Railgun battery", "45 cm", "2", "Left/front/right"],
            ["Port ion cannon", "30 cm", "1", "Left/front"],
            ["Starboard ion cannon", "30 cm", "1", "Front/right"],
            ["Port Railgun battery", "45 cm", "2", "Left/front"],
            ["Starboard Railgun battery", "45 cm", "2", "Front/right"],
        ]),
    ],
    "470": [
        ("470", "T’olku"),
        ("470b", "Vior’la", [
            ["Port Railgun battery", "45 cm", "2", "Left/front"],
            ["Starboard Railgun battery", "45 cm", "2", "Front/right"],
            ["Prow Railgun battery", "45 cm", "4", "Front"],
            ["Port ion cannon", "45 cm", "1", "Front"],
            ["Starboard ion cannon", "45 cm", "1", "Front"],
            ["Prow launch bays", "Barracudas: 25 cm / Mantas: 20 cm", "1 squadron", "–"],
            ["Prow gravitic launcher", "20–40 cm", "5", "Front"],
        ]),
    ],
    "472": [
        ("472", "Dal’yth"),
        ("472b", "Bork’an", [
            ["Port Railgun battery", "45 cm", "4", "Left/front"],
            ["Starboard Railgun battery", "45 cm", "4", "Front/right"],
            ["Port gravitic hook", "–", "Capacity: 1 Warden", "–"],
            ["Starboard gravitic hook", "–", "Capacity: 1 Warden", "–"],
            ["Prow gravitic launcher", "20–40 cm", "3", "Front"],
        ]),
        ("472c", "Sa’cea", [
            ["Port Railgun battery", "45 cm", "3", "Left/front"],
            ["Starboard Railgun battery", "45 cm", "3", "Front/right"],
            ["Port ion cannon", "30 cm", "1", "Left/front"],
            ["Starboard ion cannon", "30 cm", "1", "Front/right"],
            ["Prow gravitic launcher", "20–40 cm", "3", "Front"],
        ]),
    ],
}

# The Il'Porrui profile's SPECIAL and OPTIONS are on the book's continuation page 473, so
# a general one-page extraction cannot see them.
if "472" in ships:
    ships["472"]["sr"] = (
        "• A large number of Il’Porrui vessels were equipped with specialized gravitic hooks "
        "for supporting Kir’la “Warden” gunships so that it may have a form of escort on "
        "long-range emissary missions. These gravitic hooks are specially designed for "
        "Wardens and cannot be used to tow or count for any other kind of escort."
    )
    ships["472"]["op"] = (
        "• Emissary class cruisers can be equipped with a deflector that raises its "
        "prow armour to 6+ for +10 points. This is disabled whenever the vessel "
        "suffers a prow critical hit (repairable normally)."
    )
    ships["472"]["ol"] = parse_options(ships["472"]["op"])

# The OPTIONS box of page 255 (Chaos battle barge) has two narrative
# paragraphs: "Pre-Heresy battle barges were widely emulated..." (it was its own
# "see text" option) and the tail of the Chosen Terminators row "A number of
# Primarchs...". Neither is a choice. The same treatment as p.472:
# the curated OPTIONS text is parsed again, so the dependencies
# (Chosen Terminators needs Chaos Space Marines) are counted right.
if "255" in ships:
    _op = ships["255"]["op"]
    assert _op.startswith("Pre-Heresy battle barges were widely emulated"), _op[:60]
    _tail = " A number of Primarchs, and even renowned Battle-Captains ordered subtle modifications"
    assert _tail in _op, "p.255: the Primarchs sentence is missing"
    _op = _op[_op.index("\u2022 Chaos battle barges can be led"):]
    _op = _op[:_op.index(_tail)] + _op[_op.index(" \u2022 For no change in cost"):]
    ships["255"]["op"] = _op
    ships["255"]["ol"] = parse_options(_op)
    assert len(ships["255"]["ol"]) == 7, len(ships["255"]["ol"])
    _ct = next(o for o in ships["255"]["ol"] if o["t"].startswith("If Chaos Space Marines are taken"))
    assert _ct.get("dep") == 1 and _ct["t"].endswith("+10 points."), _ct

# The two paragraphs of the OPTIONS box of page 194 (Fra'al Battleship) are
# rules, not purchases: "... they may be used as a substitution for an enemy
# in any scenario ..." and "Up to two ships in a pirate fleet may be Fra'al
# battleships, rolling for leadership normally and counting as cruisers against
# the fleet list." The card printed them as "see text" options (spot check 15 row 29).
# They are moved to the SPECIAL rules as they are.
if "194" in ships:
    _fr = ships["194"]
    assert len(_fr["ol"]) == 2 and all(o.get("c") is None for o in _fr["ol"]), _fr["ol"]
    assert _fr["ol"][1]["t"].startswith("Up to two ships in a pirate fleet"), _fr["ol"][1]["t"][:40]
    _fr["sr"] = (_fr["sr"] + " " + " ".join("• " + o["t"] for o in _fr["ol"])).strip()
    _fr["ol"] = []
    _fr["op"] = ""


def choice(text, cost, group, dep=None, group_max=1):
    """A printable/tickable weapon choice.

    grp + gmax drive the mutual exclusion in the browser. dep implements for example
    the second Impaler module, which can be taken only after the first.
    """
    out = dict(t=text, c=cost, var=0, grp=group, gmax=group_max)
    if dep is not None:
        out["dep"] = dep
    return out


def weapon_set_options(prefix, group_prefix, count, choices):
    out = []
    for slot in range(1, count + 1):
        grp = "%s_%d" % (group_prefix, slot)
        for label, cost in choices:
            out.append(choice("%s %d — %s" % (prefix, slot, label), cost, grp))
    return out


# The book's armament tables already contain every alternative below, but
# the card needs a tickable choice and the builder the right price.
if "330" in ships:
    vampire = ships["330"]["ol"][0]
    ships["330"]["ol"] = [
        choice("Prow — weapons battery", 0, "dragon_prow"),
        choice("Prow — pulsar lance", 0, "dragon_prow"),
        choice("Keel — launch bays", 0, "dragon_keel"),
        choice("Keel — torpedoes", 0, "dragon_keel"),
        dict(vampire, dep=2),
    ]
if "331" in ships:
    ships["331"]["ol"] = [
        choice("Prow — weapons battery", 0, "wraith_prow"),
        choice("Prow — pulsar lance", 0, "wraith_prow"),
        choice("Keel — launch bays", 0, "wraith_keel"),
        choice("Keel — torpedoes", 0, "wraith_keel"),
    ]
if "332" in ships:
    ships["332"]["ol"] = [
        choice("Prow — weapons battery", 0, "shadowhunter_prow"),
        choice("Prow — shadow lance", 0, "shadowhunter_prow"),
    ]

if "352" in ships:
    ships["352"]["aw"] = [
        ["Prow weapons battery", "30 cm", "12", "Front"],
        ["Launch bays", "Fighters: 30 cm / Bombers: 20 cm / Assault Boats: 30 cm", "4 squadrons", "–"],
        ["Prow phantom lance", "30 cm", "2", "Front"],
        ["Prow torpedoes", "30 cm", "4", "Front"],
        ["Impaler assault module", "Attack Craft: 30 cm", "Special", "Front"],
    ]
    mimic = ships["352"]["ol"][-1]
    ships["352"]["ol"] = [
        choice("Additional armament — launch bays", 40, "torture_arm"),
        choice("Additional armament — prow phantom lance", 20, "torture_arm"),
        choice("Additional armament — prow torpedoes", 20, "torture_arm"),
        choice("Additional armament — Impaler module I", 20, "torture_arm"),
        choice("Additional armament — Impaler module II", 20, "torture_impaler_2", dep=3),
        mimic,
    ]
if "353" in ships:
    mimic = ships["353"]["ol"][0]
    ships["353"]["ol"] = [
        choice("Additional armament — weapons battery", 0, "corsair_arm"),
        choice("Additional armament — phantom lance", 0, "corsair_arm"),
        choice("Additional armament — torpedoes", 0, "corsair_arm"),
        choice("Additional armament — Impaler module", 0, "corsair_arm"),
        mimic,
    ]

# Hammer (p.374): "Prow bombardment cannon OR Prow torpedoes" is not a
# build choice - "In each turn, these launchas can either fire torpedoes or
# be used as a bombardment cannon." Both rows are always on the ship, and
# the firing choice is in the SPECIAL text (the user's finding 10.9.2026).
if "374" in ships:
    assert not any("prow secondary" in o["t"].lower() for o in ships["374"]["ol"])
    assert not any(o.get("dep") is not None for o in ships["374"]["ol"])

if "432" in ships:
    ships["432"]["ol"] = (
        [choice("Prow — Pyro-acid battery", 30, "hive_prow"),
         choice("Prow — Feeder tentacles & massive claws", 15, "hive_prow"),
         choice("Prow — Bio-plasma spines", 20, "hive_prow"),
         choice("Prow — Boarding torpedoes", 25, "hive_prow"),
         choice("Thorax — Pyro-acid battery", 30, "hive_thorax"),
         choice("Thorax — Bio-plasma discharge", 20, "hive_thorax"),
         choice("Thorax — Launch bays", 20, "hive_thorax")] +
        weapon_set_options("Port/starboard set", "hive_side", 3,
                           [("Pyro-acid battery", 15),
                            ("Bio-plasma discharge", 20), ("Launch bays", 20)]))
if "434" in ships:
    ships["434"]["ol"] = (
        [choice("Prow — Pyro-acid battery", 20, "tycr_prow"),
         choice("Prow — Feeder tentacles", 10, "tycr_prow"),
         choice("Prow — Massive claws", 5, "tycr_prow"),
         choice("Prow — Boarding torpedoes", 10, "tycr_prow"),
         choice("Thorax — Feeder tentacles", 10, "tycr_thorax"),
         choice("Thorax — Massive claws", 5, "tycr_thorax"),
         choice("Thorax — Boarding torpedoes", 10, "tycr_thorax")] +
        weapon_set_options("Port/starboard set", "tycr_side", 2,
                           [("Pyro-acid battery", 15), ("Bio-plasma discharge", 20)]))
if "435" in ships:
    ships["435"]["ol"] = [
        choice("Weapon — Pyro-acid battery", 15, "kraken_weapon"),
        choice("Weapon — Feeder tentacles", 5, "kraken_weapon"),
        choice("Weapon — Massive claws", 10, "kraken_weapon"),
        choice("Weapon — Bio-plasma discharge", 10, "kraken_weapon"),
        choice("Weapon — Boarding torpedoes", 15, "kraken_weapon"),
    ]
if "436" in ships:
    ships["436"]["ol"] = [
        choice("Weapon — Pyro-acid battery", 5, "vanguard_weapon"),
        choice("Weapon — Feeder tentacles", 5, "vanguard_weapon"),
    ]
if "437" in ships:
    fireship = ships["437"]["ol"][-1]
    ships["437"]["ol"] = [
        choice("Weapon — Pyro-acid battery", 10, "drone_weapon"),
        choice("Weapon — Feeder tentacles", 5, "drone_weapon"),
        choice("Weapon — Bio-plasma discharge", 5, "drone_weapon"),
        dict(fireship, grp="drone_weapon", gmax=1),
    ]
# J213 (docs/check-yourself S1041, S1043, S1058, S1059, S1062): a group limits
# a weapon to at most one, but the book requires one: "must be armed with one
# weapon chosen from the following list" (p.429, 431) and the hive ship's and
# cruiser's lists "One prow weapon", "One thorax weapon" (p.430).
# resolveFleet reports a group with nothing chosen.
_NEED = {
    "432": [("hive_prow", "one prow weapon", "A hive ship must be armed with weapons chosen from the "
             "following list: One prow weapon", 430),
            ("hive_thorax", "one thorax weapon", "A hive ship must be armed with weapons chosen from the "
             "following list: One thorax weapon", 430)],
    "434": [("tycr_prow", "one prow weapon", "A Tyranid cruiser must be armed with weapons chosen from the "
             "following list: One prow weapon", 430),
            ("tycr_thorax", "one thorax weapon", "A Tyranid cruiser must be armed with weapons chosen from the "
             "following list: One thorax weapon", 430)],
    "435": [("kraken_weapon", "one weapon", "A Kraken must be armed with one weapon chosen from the "
             "following list", 429)],
    "436": [("vanguard_weapon", "one weapon", "A Vanguard drone ship must be armed with one weapon chosen "
             "from the following list", 429)],
    "437": [("drone_weapon", "one weapon", "A Tyranid escort drone must be armed with one weapon chosen "
             "from the following list", 431)],
}
for _k, _needs in _NEED.items():
    assert _k in ships, "J213: profile %s is missing" % _k
    for _g, _what, _src, _pg in _needs:
        assert any(o.get("grp") == _g for o in ships[_k]["ol"]), "J213: no group %s" % _g
    ships[_k]["need"] = [dict(grp=_g, what=_w, src=_s, pg=_p) for _g, _w, _s, _p in _needs]

# The Orbital and the Waystation choose one defence system. The Waystation's
# last Ion Cannon row disappeared because of the PDF's unusually large line gap.
for key in ("480", "481"):
    if key in ships:
        for o in ships[key]["ol"]:
            o.update(grp=key + "_defence", gmax=1)
if "481" in ships and not any("ion cannon" in a[0].lower() for a in ships["481"]["aw"]):
    ships["481"]["aw"].append(["Ion cannon", "30 cm", "1", "All round"])

# ---------------------------------------------- menu weapon links
#
# {page: {option index: [armament row indexes]}}
#
# An option not in the list is an ordinary extra purchase and links to no
# row; so it cannot hide armament. Side pairs (Port + Starboard)
# are one choice and two rows, and the hive ship's three side sets
# point to the same rows, because the book prints the side weapons once.
WEAPON_MENU = {
    "330": {0: [0], 1: [1], 2: [2], 3: [3]},          # Dragonship
    "331": {0: [0], 1: [1], 2: [2], 3: [3]},          # Wraithship
    "332": {0: [0], 1: [1]},                          # Shadowhunter
    # Torture: aw0 is the base armament; the rest are extra weapons.
    "352": {0: [1], 1: [2], 2: [3], 3: [4], 4: [4]},
    # Corsair: aw0 is the base armament (Str 2), aw1 is the added Str 3.
    "353": {0: [1], 1: [2], 2: [3], 3: [4]},
    "432": {                                          # Hive ship
        0: [0], 1: [1], 2: [2], 3: [3],               # prow
        4: [4], 5: [5], 6: [6],                       # thorax
        7: [7, 8], 8: [9, 10], 9: [11],               # side set 1
        10: [7, 8], 11: [9, 10], 12: [11],            # side set 2
        13: [7, 8], 14: [9, 10], 15: [11],            # side set 3
    },
    "434": {                                          # Tyranid cruiser
        0: [0], 1: [1], 2: [2], 3: [3],               # prow
        4: [4], 5: [5], 6: [6],                       # thorax
        7: [7, 8], 8: [9, 10],                        # side set 1
        9: [7, 8], 10: [9, 10],                       # side set 2
    },
    "435": {0: [0], 1: [1], 2: [2], 3: [3], 4: [4]},  # Kraken
    "436": {0: [0], 1: [1]},                          # Vanguard drone
    "437": {0: [0], 1: [1], 2: [2]},                  # Escort drone
    "480": {0: [0], 1: [1], 2: [2], 3: [3]},          # Orbitals
    "481": {0: [0], 1: [1], 2: [2], 3: [3]},          # Waystation
}

for _pg, _map in WEAPON_MENU.items():
    if _pg not in ships:
        raise SystemExit("WEAPON_MENU: no ship %s" % _pg)
    _sh = ships[_pg]
    for _oi, _rows in _map.items():
        if _oi >= len(_sh["ol"]):
            raise SystemExit("WEAPON_MENU %s: no option %d" % (_pg, _oi))
        for _r in _rows:
            if _r >= len(_sh["aw"]):
                raise SystemExit("WEAPON_MENU %s: no weapon row %d" % (_pg, _r))
        _sh["ol"][_oi]["aws"] = list(_rows)

# ------------------------------------------------------- RULE DETECTORS
# The denominator may name two types: "for every three cruisers or
# battlecruisers". A lazy group stopped at the first word and "or
# battlecruisers" disappeared silently, so the check counted too
# small a denominator and marked a legal fleet illegal.
# The longer alternative is tried first, because a lazy group would
# otherwise settle for the shorter hit.
_TYPE = r"[\w\- ’']+?"
_TYPES = r"(?:" + _TYPE + r"\s+or\s+" + _TYPE + r"|" + _TYPE + r")"
# The number word is optional: "for every cruiser" means one. Before,
# this was (\w+)?, which grabbed the start of the type in place of the number word -
# "for every cruiser" parsed as ("cruise", "r"), n("cruise") was
# empty and the whole rule disappeared. Only real number words are allowed, and
# the list comes from the same NUM table n() uses.
_COUNT = (r"(?:(\d[\d,]*|" +
          "|".join(sorted(NUM, key=len, reverse=True)) + r")\s+)?")
# The end is anchored to the end of the sentence, not to any space.
# Without the anchor a lazy group settled for the first word gap and
# "cruisers or heavy cruisers" was cut to "cruisers or heavy",
# which no section matches - and the whole rule fell back to text.
RATIO_A = re.compile(
    r"(?:may\s+)?include\s+(?:up\s+to\s+)?(\w+)\s+([\w\- ’']+?)\s+(?:in\s+(?:your|the)\s+fleet\s+)?"
    # "for each" is the same as "for every": the tyranids'
    # "up to 2 capital ships for each hive ship in the fleet".
    r"for\s+(?:every|each)\s+" + _COUNT + r"(" + _TYPES + r")"
    r"(?:\s+(?:included\s+)?in\s+(?:the|your|their)\s+fleet)?"
    r"(?=\s*[,.]|\s*$)", re.I)
RATIO_B = re.compile(
    r"for\s+every\s+(\w+)\s+([\w\- ’']+?)\s+(?:included\s+)?in\s+your\s+fleet,?\s+"
    r"you\s+may\s+(?:include|pick|take)\s+(\w+)", re.I)
PER_PTS_MAX = re.compile(
    r"max(?:imum)?\s+of\s+(\w+)\s+([\w\- ’']+?)\s+per\s+([\d,]+)\s*points", re.I)
PER_PTS = re.compile(
    # "include up to one X": without the optional "up to" part
    # the leftmost hit would be "include" and the number word would become
    # "up". "for every FULL 1,000 points" needs its own word.
    r"(?:max\.?(?:imum)?\s+of\s+|(?:include\s+)?up\s+to\s+|include\s+)"
    r"(\w+)\s+([\w\- ’']+?)\s+"
    r"(?:in\s+(?:your|the)\s+fleet\s+)?(?:per|for\s+every)\s+"
    # "full" is not just a filler word: it tells the rounding direction.
    # "for every FULL 1,000 points" means 0-999 = none,
    # whereas "per 500 points, or part" means 1-500 = one.
    r"(?P<full>full\s+)?([\d,]+)\s*points", re.I)
CAP = re.compile(r"include\s+up\s+to\s+(\w+)\s+([\w\- ’']+?)\s+in\s+(?:your|the)\s+fleet", re.I)
# The book also writes a cap without "up to": "Your fleet may include
# no more than twelve cruisers." (Demiurg, p.487). The end
# is anchored to a comma, a full stop or the word fleet, so that a lazy
# group does not swallow the end of the sentence into the type.
CAP2 = re.compile(r"(?:include|have|take)\s+no\s+more\s+than\s+(\w+)\s+([\w\- ’']+?)"
                  r"(?=\s*[,.]|\s+in\s+(?:your|the)\s+fleet|\s*$)", re.I)
# A required commander. The book writes this in two ways, and
# before, only the latter was recognised: 13 lists of 16 were left without
# the check. The difference is real and not just wording - "over 750" means
# more than 750, "750 or more" means from 750 up - so
# the comparison is recorded too.
# "above" is the same as "over": the Grey Knights list writes
# "If the fleet is above 750 points an Inquisitor Lord must lead the fleet".
# Three wordings for the same thing: "worth over 750", "is above 750",
# "has more than 750 points of ships". All mean strictly over.
MAND_GT = re.compile(r"(?:worth\s+(?:over|above|more\s+than|greater\s+than)|"
                     r"is\s+(?:above|greater\s+than|more\s+than)|"
                     r"has\s+more\s+than)\s+"
                     r"([\d,]+)\s*(?:pts|points)", re.I)
MAND_GE = re.compile(r"(?:worth|of)\s+([\d,]+)\s*(?:pts|points)\s+or\s+more", re.I)
# Without this condition the rule would also hit the sentence "If your fleets is worth
# more than 750 pts it must include at least one Explorer" - there the requirement
# concerns one ship class, not the whole section, and a section-level check does not match
# it. So a wording that refers to leading is required.
MAND_LEADS = re.compile(r"(?:to\s+lead\s+it|lead\s+the\s+fleet|"
                        r"must\s+lead\s+(?:it|the\s+fleet)|"
                        r"include\s+an?\s+(?:commander|admiral|archmagos)|"
                        r"(?:commander|admiral)\s+must\s+be\s+included)", re.I)
SQD = re.compile(r"squadrons?\s+of\s+(\d+)\s*[–-]\s*(\d+)", re.I)
SECN = re.compile(r"^(\d+)\s*[–-]\s*(\d+)\s+([\w’' ]+?),?\s+chosen", re.I)
HAS_QUALIFIER = re.compile(r"for\s+every|\bper\s+[\d,]+\s*points|\bper\s+\w+\s+points", re.I)


def detect(sent):
    """Returns a rule dict or None. Strict: uncertain ones stay text."""
    m = PER_PTS_MAX.search(sent)
    if m and n(m.group(1)):
        return dict(kind="per_points", each=n(m.group(1)),
                    what=m.group(2).strip().lower(),
                    per=int(m.group(3).replace(",", "")))
    m = PER_PTS.search(sent)
    if m and n(m.group(1)):
        # Group 3 is now a named full group, so the number is in group 4.
        r = dict(kind="per_points", each=n(m.group(1)),
                 what=m.group(2).strip().lower(),
                 per=int(m.group(4).replace(",", "")))
        if m.group("full"):
            r["full"] = 1
        # p.372 Clanz: "one Warlord for every 500 points, or part, that the
        # fleet is worth - no more, no less" is an exact count, not just an upper limit (J38).
        if re.search(r"no\s+more,?\s+no\s+less", sent, re.I):
            r["exact"] = 1
        return r
    m = RATIO_A.search(sent)
    if m and n(m.group(1)) and (n(m.group(3)) or m.group(3) is None):
        per = n(m.group(3)) if m.group(3) else 1
        if per:
            return dict(kind="ratio", allow=n(m.group(1)),
                        allow_type=m.group(2).strip().lower(),
                        per=per, per_type=m.group(4).strip().lower())
    m = RATIO_B.search(sent)
    if m and n(m.group(1)) and n(m.group(3)):
        return dict(kind="ratio", allow=n(m.group(3)), allow_type="@section",
                    per=n(m.group(1)), per_type=m.group(2).strip().lower())
    if "must" in sent.lower():
        m = MAND_GE.search(sent)
        over = False
        if not m:
            m = MAND_GT.search(sent)
            over = True
        if m:
            # The guard is resolved only when tied to a section, because only
            # then is it known which section it is about. If the sentence speaks of
            # leading, no guard is needed at all.
            return dict(kind="mandatory_at",
                        points=int(m.group(1).replace(",", "")), over=over,
                        needs_guard=not bool(MAND_LEADS.search(sent)))
    m = SQD.search(sent)
    if m:
        return dict(kind="squadron", min=int(m.group(1)), max=int(m.group(2)))
    # CAP only last, and only if the sentence has NO ratio or points limit
    m = CAP.search(sent) or CAP2.search(sent)
    if m and n(m.group(1)) and not HAS_QUALIFIER.search(sent):
        return dict(kind="cap", max=n(m.group(1)), what=m.group(2).strip().lower())
    return None


def resolve_sections(phrase, sec_titles, own):
    """'cruisers or heavy cruisers' -> [section index, ...]. Empty = not resolved."""
    if phrase in ("@section", "vessel from this section", "vessel from the list below"):
        return [own]
    parts = re.split(r"\s+or\s+|\s+and\s+|,\s*", phrase)
    norm = [sing(t) for t in sec_titles]
    idx = []
    for p in parts:
        p = sing(p)
        if not p:
            continue
        # an exact hit first: 'cruiser' must NOT hit a 'battlecruiser' section
        hit = norm.index(p) if p in norm else None
        if hit is None and len(p) > 5:
            cand = [i for i, t in enumerate(norm) if t.endswith(" " + p) or t == p]
            hit = cand[0] if len(cand) == 1 else None
        if hit is None:
            return []
        if hit not in idx:
            idx.append(hit)
    return idx


# Detecting a sentence to let through. The second line was added on 7.9.2026:
# the original word list knew permissions and bans but not mechanical
# effects, so 72 valid sentences went unshown - the Mechanicus
# Gifts effects, the inquisitors' bonuses, the Ork Gubbins, the tyranids'
# refits and counting rules ("Warspheres do not count against cruiser
# limits"). The word "can" was added on 7.9.2026, but only together with a
# fleet-building verb - on its own it is as common in narrative as
# in rules ("battlefleets can vary massively").
# Sentences the sentence filter would drop but that must show: a row's
# own description ("+1 modifier on boarding") or a rule without a rule word.
# Each must hit at least once, or the run fails (item 8).
KEEP_TEXT = [
    # p.318: "gives the vessel a re-roll which may be used on itself, another
    # capital ship in the same squadron or an escort squadron within 15 cm" -
    # the sentence is also a 0-3 count rule, and without this it disappeared
    # from the commander card (spot check 7 row 76).
    dict(list_has="Eldar \u2014 Iyanden Craftworld", has="gives the vessel a re-roll"),
    # p.319 Prince Yriel: "He has the following additions as part of his point
    # cost: ... 2. His vessel is equipped with Vampire raiders." and "The fleet
    # list chosen becomes the parent fleet when it comes to using reserve ships
    # from the other fleet." Neither hits the RULEY vocabulary, and they disappeared
    # from the commander card (spot check 15 row 59).
    dict(list_has="Eldar \u2014 Iyanden Craftworld", sec="RESERVES AND ALLIES",
         has="His vessel is equipped with Vampire raiders"),
    dict(list_has="Eldar \u2014 Iyanden Craftworld", sec="RESERVES AND ALLIES",
         has="The fleet list chosen becomes the parent fleet"),
    dict(list_has="Orks \u2014 Cyclops Cluster", has="+1 modifier on boarding"),
    dict(list_has="Orks \u2014 Waaagh!", has="+1 modifier on boarding"),
]
def keep_text(name, title, sent):
    for fx in KEEP_TEXT:
        if fx["list_has"] in name and fx["has"] in sent and (
                not fx.get("sec") or fx["sec"].strip().lower() == title.strip().lower()):
            fx["_used"] = fx.get("_used", 0) + 1
            return True
    return False

RULEY = re.compile(r"\b(may|must|cannot|can not|no more|only|per|each|at least|up to|"
                   r"instead|counts? as|not be|never)\b"
                   r"|\bdo(?:es)?\s+not\s+count\b|\bcounts?\s+(?:toward|against)\b"
                   r"|\bno\s+restrictions?\b|\b(?:is|are)\s+reduced\b"
                   r"|\breduced\s+(?:to|by)\b|\badds?\s+\+?\d|\+\d+\s+to\s+\w"
                   # "increased by +1" is a rule just as "reduced by" is.
                   r"|\bincreased?\s+(?:by|to)\b"
                   # Three sentences in the whole book, all rules.
                   # The most important is the reading of tyranid pricing:
                   # "the points cost indicated provides you with one
                   # port weapon and one starboard weapon".
                   r"|\bpermitted\b|\bprovides?\s+you\s+with\b"
                   # The commanders' sentences (P1-8e): "Admirals get one Fleet
                   # Commander re-roll included in their points cost",
                   # "improves its Leadership to the value shown" - the number of
                   # re-rolls and the Ld are the commander card's content, not narrative.
                   r"|\bre-?rolls?\b|\bleadership\b"
                   # The book uses the word "can" in the same sense as
                   # "may". A bare \bcan\b would bring 45 sentences of which 17 are
                   # narrative ("battlefleets can vary massively"), so
                   # a fleet-building verb is also required: this way there
                   # are 28 sentences and three narrative ones. Among them e.g.
                   # "Any race can be used to provide auxiliary vessels
                   # except Orks, Dark Eldar, Necrons and Tyranids" and
                   # the ORDNANCE sentence of every Chaos list.
                   r"|\bcan\s+(?:also\s+|only\s+|still\s+|now\s+|not\s+)?"
                   r"(?:be\s+)?(?:include|take|taken|takes|use|used|uses|"
                   r"have|has|purchase|purchased|choose|chosen|select|"
                   r"selected|replace|replaced|replaces|carry|carried|add|"
                   r"added|upgrade|upgraded|equip|equipped|field|fielded|"
                   r"act|acts|double|assign|assigned|combine|combined|"
                   r"buy|bought)\b"
                   # "gains a +1 bonus" is the same rule as "gains +1".
                   r"|\bgains?\s+(?:an?\s+)?\+?\d"
                   r"|\breceives?\s+(?:one|two|an?|\+?\d)|\bignores?\b"
                   # A sentence that names a points price is always a rule: it says
                   # what something costs. Without this 32 sentences went unshown,
                   # e.g. "+35 points for its Space Marine crew",
                   # "A second re-roll can be purchased for +25 points" and
                   # the tyranid bio-refit descriptions with their prices.
                   r"|[+-]?\d[\d,]*\s*(?:pts|points)\b"
                   # A ban and an exception are rule language just as a permission is.
                   # These bring 74 sentences, of which about ten are
                   # narrative - an accepted trade-off, because among them are
                   # e.g. every faction's attack rating, the Necrons'
                   # reactive hull exceptions and the tyranids' deviating
                   # critical hits, which were missing entirely.
                   r"|\bdo(?:es)?\s+not\b|\bdon'?t\b"
                   r"|\bwill\s+(?:not|never|always)\b"
                   # The book writes attack rating in three ways:
                   # "attack rating", "attack (initiative) rating" and
                   # "attack or initiative rating". A minus
                   # modifier is as mechanical as a plus.
                   r"|\battack\s+(?:\S+\s+){0,2}rating\b"
                   r"|[+-]\d+\s+(?:leadership|ld)\b|leadership\s+modifier"
                   # A distance and a die are as mechanical as a price: a sentence
                   # that says "15 cm" or "roll a D6" is a rule. These
                   # brought 74 sentences, practically all valid -
                   # the attack craft speed tables, Slaanesh's -2
                   # leadership within 15 cm, the craftworlds'
                   # gravity wells, the Daemonship's placement.
                   r"|\d+\s*cm\b|\b\d?D[36]\b", re.I)


# --- a pick finer than a section ---------------------------------------------
# resolve_sections works only at section precision, and that is almost always enough.
# Bastion Fleets, however, prints battleships, battlecruisers and grand
# cruisers under the same heading, so "one battleship for every three
# cruisers" counted the whole section: two grand cruisers were read
# as two battleships and a legal fleet was marked illegal.
#
# The pick narrows the section by the ship's name. These are hand-written
# exceptions and not conclusions of the parser: the parser
# should stay strict, so that an uncertain sentence stays text and does not turn
# into a wrong check. Each entry must hit exactly once, which is
# checked at the end of the run.
# Spot check 18 (a book inventory): the large ships of the Chaos lists and the p.288 sentences.
_CHAOS_CAP = [dict(sec="Planet Killer"), dict(sec="Chaos Space Hulk"), dict(sec="Battleships"),
              dict(sec="Grand Cruisers"), dict(sec="Heavy Cruisers"), dict(sec="Cruisers")]
_CHAOS_HULK_LISTS = (("Chaos \u2014 Incursion", False), ("Chaos \u2014 Black Crusade", True),
                     ("Chaos \u2014 Tzeentch", True), ("Chaos \u2014 Nurgle", True),
                     ("Chaos \u2014 Khorne", True), ("Chaos \u2014 Slaanesh", True))
_HULK_WITH = ("It may not be taken in a fleet that has the Planet Killer, an Activated Blackstone "
              "Fortress or ships that must be used as flagships such as the Terminus Est.")
_HULK_BS = "A Chaos fleet including a Space Hulk may have no more than two other battleships."

RULE_PICKS = [
    # Only battleships in the numerator. Cruisers AND
    # battlecruisers in the denominator, as the sentence says; grand cruisers are left out,
    # which the book states separately in the next sentence.
    # The sentence does not parse by machine, because Bastion Fleets has no
    # Battlecruisers section of its own: all three types are under the heading
    # "Battleships". resolve_sections therefore does not find the denominator's
    # other half, and the sentence stays text. The rule is built here.
    dict(list_has="Bastion Fleets", sec="Battleships",
         from_text="one battleship in your fleet for every three cruisers",
         src="You may include up to one battleship in your fleet for every "
             "three cruisers or battlecruisers.",
         rule=dict(kind="ratio", allow=1, allow_type="battleship",
                   per=3, per_type="cruisers or battlecruisers",
                   allow_pick=[dict(sec="Battleships", re="battleship")],
                   per_pick=[dict(sec="Cruisers"),
                             dict(sec="Battleships", re="battlecruiser")])),
    # The other half of the same section. This stayed text, because in the book
    # the subheading is stuck to the start of the sentence and so the sentence did not parse.
    dict(list_has="Bastion Fleets", sec="Battleships",
         from_text="one battlecruiser or grand cruiser in your fleet "
                   "for every two cruisers",
         src="You may include up to one battlecruiser or grand cruiser "
             "in your fleet for every two cruisers.",
         rule=dict(kind="ratio", allow=1,
                   allow_type="battlecruiser or grand cruiser",
                   # The section heading is "Battleships", which is the wrong heading
                   # for this rule. The book's own subheading is right.
                   label="Battlecruisers & Grand Cruisers",
                   per=2, per_type="cruisers",
                   allow_pick=[dict(sec="Battleships",
                                    re="battlecruiser|grand cruiser")],
                   per_pick=[dict(sec="Cruisers")])),

    # Chaos Incursion is the only list where the commander is required without
    # a points limit. The book's sentence rules out the limit explicitly ("even if it
    # is worth 750 points or less"), so the general patterns cannot
    # recognise it. A points limit of 0 means "always".
    # --- Demiurg ---------------------------------------------------------
    dict(list_has="Demiurg", sec="Battleships",
         from_text="one battleship for every two cruiser-class vessels",
         src="Your fleet may include one battleship for every two "
             "cruiser-class vessels in the fleet.",
         rule=dict(kind="ratio", allow=1, allow_type="battleship",
                   per=2, per_type="cruiser-class vessels",
                   allow_pick=[dict(sec="Battleships")],
                   per_pick=[dict(sec="Cruisers")])),
    dict(list_has="Demiurg", sec="Kroot Vessels",
         from_text="one Kroot Warsphere in the fleet for every 750 points",
         src="The fleet may have one Kroot Warsphere in the fleet for every "
             "750 points in the fleet or portion thereof.",
         rule=dict(kind="per_points", each=1, per=750,
                   what="Kroot Warsphere",
                   pick=[dict(sec="Kroot Vessels")])),

    # --- Chaos: Abaddon and the named battleships (fleet spot check 10.9.) --
    # p.234: "You may include Abaddon the Despoiler as the Warmaster in any
    # Chaos Fleet worth more than 1,000 points." Abaddon IS the Warmaster: he
    # fills the required Warmaster (match_src below) and is not beside a
    # Warmaster. The sentence stays text, because it is a rule of Abaddon's card.
    dict(list_has="Black Crusade", sec="Abaddon",
         from_text="Abaddon the Despoiler as the Warmaster in any Chaos Fleet",
         keep_text=True,
         src="You may include Abaddon the Despoiler as the Warmaster in any "
             "Chaos Fleet worth more than 1,000 points.",
         rules=[dict(kind="allowed_at", points=1000, over=True, label="Abaddon",
                     pick=[dict(sec="Abaddon")]),
                dict(kind="cap", max=1, label="Warmaster or Abaddon",
                     pick=[dict(sec="Chaos Warmaster"), dict(sec="Abaddon")])]),
    dict(list_has="Black Crusade", sec="Chaos Warmaster",
         match_src="A Chaos Warmaster (and their required capital ship) must be taken",
         set=dict(pick=[dict(sec="Chaos Warmaster"), dict(sec="Abaddon")])),
    # p.237, 241, 245, 249: "A fleet 1,000 points or more may include the X
    # as one of its battleships, subject to normal restrictions." The sentence stayed
    # text on all four lists (the Planet Killer's equivalent was already
    # a rule).
    dict(list_has="Chaos — Tzeentch", sec="Battleships",
         from_text="A fleet 1,000 points or more may include the Scion of Prospero",
         src="A fleet 1,000 points or more may include the Scion of Prospero as one "
             "of its battleships, subject to normal restrictions.",
         rule=dict(kind="allowed_at", points=1000, label="Scion of Prospero",
                   pick=[dict(sec="Battleships", re="^scion of prospero")])),
    dict(list_has="Chaos — Nurgle", sec="Battleships",
         from_text="A fleet 1,000 points or more may include the Terminus Est",
         src="A fleet 1,000 points or more may include the Terminus Est as one "
             "of its battleships, subject to normal restrictions.",
         rule=dict(kind="allowed_at", points=1000, label="Terminus Est",
                   pick=[dict(sec="Battleships", re="^terminus est")])),
    dict(list_has="Chaos — Khorne", sec="Battleships",
         from_text="A fleet 1,000 points or more may include the Slaverer",
         src="A fleet 1,000 points or more may include the Slaverer as one of its "
             "battleships, subject to normal restrictions.",
         rule=dict(kind="allowed_at", points=1000, label="Slaverer",
                   pick=[dict(sec="Battleships", re="^slaverer")])),
    dict(list_has="Chaos — Slaanesh", sec="Battleships",
         from_text="A fleet 1,000 points or more may include the Wage of Sin",
         src="A fleet 1,000 points or more may include the Wage of Sin as one of "
             "its battleships, subject to normal restrictions.",
         rule=dict(kind="allowed_at", points=1000, label="Wage of Sin",
                   pick=[dict(sec="Battleships", re="^wage of sin")])),

    # --- Squadrons (fleet spot check S2 10.9.) ------------------------------
    # p.455 "Defenders are fielded in squadrons of 2–6 ships." The rule is in
    # the SQUADRONS section, which has no ship at all, so it measured
    # nothing. pick names the class: Messengers may act alone.
    dict(list_has="Tau — Merchant Fleet", sec="SQUADRONS",
         match_src="Defenders are fielded in squadrons of 2",
         set=dict(pick=[dict(sec="ESCORTS", re="^defender")])),
    dict(list_has="Tau — Commerce Protection", sec="SQUADRONS",
         match_src="Defenders are fielded in squadrons of 2",
         set=dict(pick=[dict(sec="ESCORTS", re="^defender")])),
    # p.174 "A single squadron of 2-6 Rogue Trader escorts and auxiliary
    # vessels may accompany each Rogue Trader capital ship in a fleet, in any
    # mix desired. Separately, ... cargo ships ... these squadrons can only
    # contain cargo ships". The size is the parser's squadron rule; the number per
    # ship is added as a ratio. Nate Montes: the Siluria "as a cruiser",
    # the Havoc "an escort".
    dict(list_has="Rogue Traders", list_is="Rogue Traders", sec="ESCORTS",
         match_src="A single squadron of 2-6 Rogue Trader escorts and auxiliary vessels may accompany each Rogue Trader capital ship",
         add=[dict(kind="ratio", allow=6, per=1, label="Rogue Trader escorts per capital ship",
                   allow_type="Rogue Trader escorts and auxiliary vessels",
                   per_type="Rogue Trader capital ships",
                   allow_pick=[dict(sec="ESCORTS", re="^(?!armed cargo)"),
                               dict(sec="NOTES FROM NATE MONTES", re="^havoc")],
                   per_pick=[dict(sec="CAPITAL SHIPS"),
                             dict(sec="NOTES FROM NATE MONTES", re="^siluria")])]),

    # --- Eldar Hero and Prince Yriel (fleet spot check S5 10.9.) -----------
    # p.316/317: "Your fleet may be led by an Eldar Hero, in place of its
    # normal fleet commander." The Hero fills the required Pirate Prince and is not
    # beside him (the same model as Abaddon p.234).
    # Each Corsair list as its own row: every fix hits exactly once.
    *[dict(list_has=nm, sec="Eldar Hero",
           from_text="Your fleet may be led by an Eldar Hero, in place of its normal fleet commander",
           keep_text=True,
           src="Your fleet may be led by an Eldar Hero, in place of its normal fleet commander.",
           rule=dict(kind="cap", max=1, label="Fleet commander (Pirate Prince or Eldar Hero)",
                     pick=[dict(sec="Pirate Prince"), dict(sec="Eldar Hero")]))
      for nm in ("Eldar Corsairs — Gothic Sector", "Eldar Corsairs — Later Gothic War")],
    *[dict(list_has=nm, sec="Pirate Prince",
           match_src="If the fleet is worth over 750 points a Pirate Prince must be included",
           set=dict(pick=[dict(sec="Pirate Prince"), dict(sec="Eldar Hero")]))
      for nm in ("Eldar Corsairs — Gothic Sector", "Eldar Corsairs — Later Gothic War")],
    # p.318 the same Hero sentence in Iyanden; p.319 "Yriel may be taken instead
    # of the Hero Fleet Commander as listed in the Corsair and Craftworld
    # Eldar fleet lists." Yriel replaces the Hero, the Hero the Autarch: one of the three.
    dict(list_has="Iyanden", sec="RESERVES AND ALLIES",
         from_text="Yriel may be taken instead of the Hero Fleet Commander",
         keep_text=True,
         src="Yriel may be taken instead of the Hero Fleet Commander as listed in the "
             "Corsair and Craftworld Eldar fleet lists.",
         rule=dict(kind="cap", max=1, label="Fleet commander (Autarch, Eldar Hero or Prince Yriel)",
                   pick=[dict(sec="Autarch"), dict(sec="Eldar Hero"),
                         dict(sec="RESERVES AND ALLIES", re="^prince yriel")])),
    dict(list_has="Iyanden", sec="Autarch",
         match_src="If the fleet is worth over 750 points, an Autarch must be included",
         set=dict(pick=[dict(sec="Autarch"), dict(sec="Eldar Hero"),
                        dict(sec="RESERVES AND ALLIES", re="^prince yriel")])),

    # --- Tau -------------------------------------------------------------
    # Four rules that name a SHIP CLASS where the engine
    # expects a section heading. All four therefore stayed plain
    # text, although they are among the lists' most central limits.
    dict(list_has="Tau \u2014 Merchant Fleet", sec="Cruisers",
         from_text="one Hero class starship for every Merchant or Explorer",
         src="It may also include up to one Hero class starship for every "
             "Merchant or Explorer in the fleet.",
         rule=dict(kind="ratio", allow=1, allow_type="Hero class starship",
                   per=1, per_type="Merchants or Explorers",
                   label="Hero class starships",
                   allow_pick=[dict(sec="Cruisers", re="^hero")],
                   per_pick=[dict(sec="Cruisers", re="^merchant"),
                             dict(sec="Battleships", re="explorer")])),
    dict(list_has="Tau \u2014 Merchant Fleet", sec="Battleships",
         from_text="it must include at least one Explorer",
         # The book reads 'your fleets', and it is left so:
         # the sentence shown is the book's own.
         src="If your fleets is worth more than 750 pts it must include at "
             "least one Explorer.",
         rule=dict(kind="mandatory_at", points=750, over=True,
                   label="Explorer class starships",
                   pick=[dict(sec="Battleships", re="explorer")])),
    dict(list_has="Tau \u2014 Merchant Fleet", sec="ESCORTS",
         from_text="one Messenger class starship per 500 points",
         src="Your fleet may include up to one Messenger class starship per "
             "500 points.",
         rule=dict(kind="per_points", each=1, per=500,
                   what="Messenger class starship",
                   label="Messenger class starships",
                   pick=[dict(sec="ESCORTS", re="messenger")])),
    dict(list_has="Tau \u2014 Commerce Protection", sec="ESCORTS",
         from_text="one Messenger class starship per 500 points",
         src="Your fleet may include up to one Messenger class starship per "
             "500 points.",
         rule=dict(kind="per_points", each=1, per=500,
                   what="Messenger class starship",
                   label="Messenger class starships",
                   pick=[dict(sec="ESCORTS", re="messenger")])),
    # p.367 (spot check 19, J47): "Each Ork hulk must be assigned an Ork Warlord
    # to command it." Each hulk needs its own Warlord: at least as many Warlords
    # as hulks. Tying a ship to a commander is not modelled
    # (J8), but the count does not need it.
    dict(list_has="Orks \u2014 Waaagh!", sec="SPACE HULKS",
         from_text="Each Ork hulk must be assigned an Ork Warlord",
         src="Each Ork hulk must be assigned an Ork Warlord to command it.",
         keep_text=True,
         rule=dict(kind="compare", op=">=", label="Warlords for Ork hulks (one each)",
                   a_pick=[dict(sec="WARLORD")], b_pick=[dict(sec="SPACE HULKS")])),
    dict(list_has="Tau \u2014 Merchant Fleet", sec="Demiurg Vessels",
         from_text="one Demiurg vessel for every three Tau capital ships",
         src="A Tau fleet can include up to one Demiurg vessel for every "
             "three Tau capital ships in the fleet.",
         rule=dict(kind="ratio", allow=1, allow_type="Demiurg vessel",
                   per=3, per_type="Tau capital ships",
                   allow_pick=[dict(sec="Demiurg Vessels")],
                   per_pick=[dict(sec="Battleships"), dict(sec="Cruisers")])),
    dict(list_has="Tau \u2014 Commerce Protection", sec="Demiurg Vessels",
         from_text="one Demiurg vessel for every three Tau capital ships",
         src="A Tau fleet can include up to one Demiurg vessel for every "
             "three Tau capital ships in the fleet.",
         rule=dict(kind="ratio", allow=1, allow_type="Demiurg vessel",
                   per=3, per_type="Tau capital ships",
                   allow_pick=[dict(sec="Demiurg Vessels")],
                   per_pick=[dict(sec="Battleships"), dict(sec="Cruisers")])),

    # The tyranid skwadron sizes. The book writes them in their own
    # SQUADRONS section, which has no ship at all, so tied to its own
    # section the rule would measure nothing. Also the book
    # writes the range as words ("6 to 12"), not with a dash, which the pattern
    # alone expects.
    dict(list_has="Tyranids \u2014 Vanguard Fleet", sec="SQUADRONS",
         from_text="squadrons of 6 to 12 models",
         src="Vanguard drone ships and Kraken may be deployed in squadrons "
             "of 6 to 12 models. You may combine the two types in a single "
             "squadron if you wish.",
         rule=dict(kind="squadron", min=6, max=12,
                   secs=["VANGUARD DRONE SHIPS", "KRAKEN"])),
    dict(list_has="Tyranids \u2014 Hive Fleet", sec="SQUADRONS",
         from_text="squadrons of 1 to 12 vessels",
         src="Tyranid Escorts come as squadrons of 1 to 12 vessels, while "
             "all other types are individuals and may not deploy in "
             "squadrons.",
         rule=dict(kind="squadron", min=1, max=12, secs=["ESCORTS"])),
    # The Necron tombship ratio. The machine cannot parse this, because
    # the denominator is a SHIP's name and not a section heading: the section is "Cruisers"
    # and it has both the Scythe and the Shroud class, so "for every
    # Scythe class harvest ship" matches no section. Also the sentence
    # ends with the words "it contains", which a lazy type group would swallow
    # into the name. The rule is built here, as for Bastion Fleets.
    dict(list_has="Necrons", sec="Tombships",
         from_text="one tombship for every Scythe class harvest ship",
         src="Your fleet may include up to one tombship for every Scythe "
             "class harvest ship it contains.",
         rule=dict(kind="ratio", allow=1, allow_type="tombship",
                   per=1, per_type="Scythe class harvest ships",
                   allow_pick=[dict(sec="Tombships")],
                   per_pick=[dict(sec="Cruisers", re="scythe")])),
    dict(list_has="Chaos \u2014 Incursion", sec="FLEET COMMANDER",
         from_text="You must include a Chaos Warmaster in your fleet",
         src="You must include a Chaos Warmaster in your fleet, even if it "
             "is worth 750 points or less.",
         rule=dict(kind="mandatory_at", points=0, over=False)),
    # ================= item 8 (9.9.2026): rules read from the book that ==========
    # the parser does not recognise but the engine can now enforce. Every
    # sentence is in reference/NN_*.json with the status enforced and a page.
    # --- a permission tied to a points limit (allowed_at) ---
    dict(list_has="Black Crusade", sec="Planet Killer",
         from_text="A fleet of 1,000 points or more may include the Planet Killer",
         src="A fleet of 1,000 points or more may include the Planet Killer.",
         rule=dict(kind="allowed_at", points=1000, label="Planet Killer", pick=[dict(sec="Planet Killer")])),
    dict(list_has="Tzeentch", sec="Planet Killer",
         from_text="A fleet of 1,000 points or more may include the Planet Killer",
         src="A fleet of 1,000 points or more may include the Planet Killer.",
         rule=dict(kind="allowed_at", points=1000, label="Planet Killer", pick=[dict(sec="Planet Killer")])),
    dict(list_has="Nurgle", sec="Planet Killer",
         from_text="A fleet of 1,000 points or more may include the Planet Killer",
         src="A fleet of 1,000 points or more may include the Planet Killer.",
         rule=dict(kind="allowed_at", points=1000, label="Planet Killer", pick=[dict(sec="Planet Killer")])),
    dict(list_has="Khorne", sec="Planet Killer",
         from_text="A fleet of 1,000 points or more may include the Planet Killer",
         src="A fleet of 1,000 points or more may include the Planet Killer.",
         rule=dict(kind="allowed_at", points=1000, label="Planet Killer", pick=[dict(sec="Planet Killer")])),
    dict(list_has="Slaanesh", sec="Planet Killer",
         from_text="A fleet of 1,000 points or more may include the Planet Killer",
         src="A fleet of 1,000 points or more may include the Planet Killer.",
         rule=dict(kind="allowed_at", points=1000, label="Planet Killer", pick=[dict(sec="Planet Killer")])),
    dict(list_has="Space Marines \u2014 Crusade", sec="Fortress-Monastery",
         from_text="worth at least 2,000 points, it may include one Fortress-Monastery",
         src="If your fleet is worth at least 2,000 points, it may include one Fortress-Monastery.",
         rule=dict(kind="allowed_at", points=2000, label="Fortress-Monastery", pick=[dict(sec="Fortress-Monastery")])),
    dict(list_has="Space Marines \u2014 Crusade", sec="Battle Barges",
         from_text="must be worth at least 1,000 points to include a single Venerable battle barge",
         src="The fleet must be worth at least 1,000 points to include a single Venerable battle barge (counting as one of the three allowed), chosen from any available Imperial or Chaos battleship, grand cruiser, battlecruiser or heavy cruiser at the listed cost, plus an additional +35 points for its Space Marine crew.",
         keep_text=True,
         rule=dict(kind="allowed_at", points=1000, label="Venerable battle barge", pick=[dict(sec="Battle Barges", re="venerable")])),
    dict(list_has="Space Marines \u2014 Dominion", sec="Battle Barges",
         from_text="must be worth at least 1,000 points to include a single Venerable battle barge",
         src="The fleet must be worth at least 1,000 points to include a single Venerable battle barge (counting as one of the three allowed), chosen from any available Imperial or Chaos battleship, grand cruiser, battlecruiser or heavy cruiser at the listed cost, plus an additional +35 points for its Space Marine crew.",
         keep_text=True,
         rule=dict(kind="allowed_at", points=1000, label="Venerable battle barge", pick=[dict(sec="Battle Barges", re="venerable")])),
    dict(list_has="Emperor's Inquisition", sec="Inquisitor Lord",
         from_text="Any Imperial or Space Marine fleet 750 points or greater may be led by an Inquisitor Lord",
         src="Any Imperial or Space Marine fleet 750 points or greater may be led by an Inquisitor Lord.",
         rule=dict(kind="allowed_at", points=750, label="Inquisitor Lord", pick=[dict(sec="Inquisitor Lord")])),
    dict(list_has="Bakka Sector", sec="Admiral",
         from_text="Battlefleet with 1,500 points or greater may be led by Lord Admiral Rath",
         src="An Imperial Bakka Battlefleet with 1,500 points or greater may be led by Lord Admiral Rath, who must always be placed on a battleship, though it not necessarily be the most expensive one present.",
         keep_text=True,
         rule=dict(kind="allowed_at", points=1500, label="Lord Admiral Rath", pick=[dict(sec="Admiral", re="rath")])),
    dict(list_has="Grey Knights", sec="CAPITAL SHIPS",
         from_text="single Grey Knights Battle barge if the remainder of the fleet is at least worth 1000 points",
         src="You may include a single Grey Knights Battle barge if the remainder of the fleet is at least worth 1000 points. Furthermore an Ordo Malleus Inquisitor Lord must lead in the fleet.",
         keep_text=True,
         rule=dict(kind="allowed_at", points=1000, basis="remainder", label="Grey Knights Battlebarge",
                   pick=[dict(sec="CAPITAL SHIPS", re="battlebarge|battle barge")],
                   cond_pick=[dict(sec="FLEET COMMANDER", re="ordo malleus")], cond_min=1)),
    # --- a count tied to a points limit for one row (per_points + pick) ---
    dict(list_has="Space Marines \u2014 Codex", sec="Battle Barges",
         from_text="one Space Marine battle barge for every 1,000 points or part thereof",
         src="You may include one Space Marine battle barge for every 1,000 points or part thereof in your fleet.",
         rule=dict(kind="per_points", each=1, per=1000, what="Space Marine battle barge", label="Battle barges", pick=[dict(sec="Battle Barges")])),
    dict(list_has="Space Marines \u2014 Crusade", sec="Battle Barges",
         from_text="one Space Marine battle barge for every 1,000 points or part thereof",
         src="You may include one Space Marine battle barge for every 1,000 points or part thereof in your fleet.",
         rule=dict(kind="per_points", each=1, per=1000, what="Space Marine battle barge", label="Battle barges", pick=[dict(sec="Battle Barges")])),
    dict(list_has="Space Marines \u2014 Dominion", sec="Battle Barges",
         from_text="one Space Marine battle barge for every 1,000 points or part thereof",
         src="You may include one Space Marine battle barge for every 1,000 points or part thereof in your fleet.",
         rule=dict(kind="per_points", each=1, per=1000, what="Space Marine battle barge", label="Battle barges", pick=[dict(sec="Battle Barges")])),
    dict(list_has="Armageddon Sector", sec="RESERVES",
         from_text="No more than two of these vessels (Endurance and Defiant class light cruisers) may be taken for every 500 points",
         src="No more than two of these vessels (Endurance and Defiant class light cruisers) may be taken for every 500 points (or portion thereof) in the fleet.",
         rule=dict(kind="per_points", each=2, per=500, what="Endurance and Defiant class light cruisers", label="Endurance & Defiant light cruisers", pick=[dict(sec="Cruisers", re="endurance|defiant")])),
    dict(list_has="Emperor's Inquisition", sec="CAPITAL SHIPS",
         from_text="up to one Grey Knights Strike Cruiser may be taken for every 500 points",
         src="If an Inquisitor Lord is leading the fleet, up to one Grey Knights Strike Cruiser may be taken for every 500 points in the fleet.",
         rule=dict(kind="per_points", each=1, per=500, what="Grey Knights Strike Cruiser", label="Grey Knights Strike Cruisers",
                   pick=[dict(sec="CAPITAL SHIPS", re="grey knights strike cruiser")],
                   cond_pick=[dict(sec="Inquisitor Lord")], cond_min=1)),
    dict(list_has="Grey Knights", sec="CAPITAL SHIPS",
         from_text="One Grey Knights Strike Cruiser may be taken per 500 points",
         src="One Grey Knights Strike Cruiser may be taken per 500 points (e.g. one from 0-500 points, two from 501-1000 points, etc.).",
         rule=dict(kind="per_points", each=1, per=500, what="Grey Knights Strike Cruiser", label="Grey Knights Strike Cruisers",
                   pick=[dict(sec="CAPITAL SHIPS", re="grey knights strike cruiser")])),
    dict(list_has="Pirates and Wolf Packs", sec="Pirate Captains",
         from_text="A Pirate Captain may be embarked on a cruiser for every 500 points",
         src="A Pirate Captain may be embarked on a cruiser for every 500 points or portion thereof in a fleet.",
         rule=dict(kind="per_points", each=1, per=500, what="Pirate Captain", label="Pirate Captains", pick=[dict(sec="Pirate Captains")])),
    dict(list_has="Tau \u2014 Commerce Protection", sec="Battleships",
         from_text="up to one Custodian per FULL 750 points of Tau vessels",
         src="Your fleet may include up to one Custodian per FULL 750 points of Tau vessels. Allied, Subject, Mercenary and Reserve vessels don't count toward this total.",
         keep_text=True,
         rule=dict(kind="per_points", each=1, per=750, full=True, what="Custodian", label="Custodian class starships",
                   pick=[dict(sec="Battleships", re="custodian")],
                   of_pick=[dict(sec="Commander"), dict(sec="Battleships"), dict(sec="Cruisers"), dict(sec="ESCORTS")])),
    dict(list_has="Tau \u2014 Commerce Protection", sec="Rogue Traders",
         from_text="Up to one Rogue Trader cruiser and its attendant escorts may accompany the fleet for every 750 points of Tau ships",
         src="Up to one Rogue Trader cruiser and its attendant escorts may accompany the fleet for every 750 points of Tau ships in the fleet.",
         rule=dict(kind="per_points", each=1, per=750, full=True, what="Rogue Trader cruiser", label="Rogue Trader cruisers",
                   pick=[dict(sec="Rogue Traders", re="rogue trader cruiser|dauntless|endeavour")],
                   of_pick=[dict(sec="Commander"), dict(sec="Battleships"), dict(sec="Cruisers"), dict(sec="ESCORTS")])),
    # --- comparing two groups (compare) ---
    dict(list_has="Bastion Fleets", sec="ORDNANCE",
         from_text="combined numbers of Endurance and Defiant class vessels may not exceed",
         src="The Endurance and Defiant class light cruisers are rare variants of the Endeavour, hence the combined numbers of Endurance and Defiant class vessels may not exceed the number of Endeavour class light cruisers in the fleet.",
         keep_text=True,
         rule=dict(kind="compare", op="<=", label="Endurance & Defiant vs Endeavour",
                   a_pick=[dict(sec="Cruisers", re="endurance|defiant")], b_pick=[dict(sec="Cruisers", re="endeavour")])),
    dict(list_has="Tau \u2014 Commerce Protection", sec="Demiurg Vessels",
         from_text="There cannot be more Stronghold than Bastion vessels",
         src="There cannot be more Stronghold than Bastion vessels in the fleet.",
         rule=dict(kind="compare", op="<=", label="Stronghold vs Bastion",
                   a_pick=[dict(sec="Demiurg Vessels", re="stronghold")], b_pick=[dict(sec="Demiurg Vessels", re="bastion")])),
    dict(list_has="Demiurg", sec="Cruisers",
         from_text="Demiurg Commerce Vessels must outnumber all non-Demiurg cruisers combined",
         src="Demiurg Commerce Vessels must outnumber all non-Demiurg cruisers combined.",
         rule=dict(kind="compare", op=">", label="Demiurg Commerce Vessels vs other cruisers",
                   a_pick=[dict(sec="Cruisers", re="bastion|citadel")], b_pick=[dict(sec="Cruisers", re="^(?!bastion|citadel)")])),
    dict(list_has="Rogue Traders \u2014 Exploration", sec="CAPITAL SHIPS",
         from_text="at least half of which must be Rogue Trader Cruisers",
         src="Your fleet may include no more than twelve capital s hips, at least half of which must be Rogue Trader Cruisers and/or Endeavour light cruisers, following the basic profile for this ship.",
         keep_text=True,
         rules=[dict(kind="cap", max=12, what="capital ships", label="Capital ships (incl. Demiurg)",
                     pick=[dict(sec="CAPITAL SHIPS"), dict(sec="NOTES FROM NATE MONTES", re="siluria"), dict(sec="The Demiurg")]),
                dict(kind="compare", op=">=", a_mult=2, label="Rogue Trader cruisers & Endeavours: at least half",
                     a_pick=[dict(sec="CAPITAL SHIPS", re="rogue trader cruiser|endeavour")],
                     b_pick=[dict(sec="CAPITAL SHIPS"), dict(sec="NOTES FROM NATE MONTES", re="siluria"), dict(sec="The Demiurg")])]),
    # --- a minimum ratio (min_ratio) ---
    dict(list_has="Dark Eldar", sec="ESCORTS",
         from_text="must contain at least three escorts for every capital ship",
         src="However, Dark Eldar fleets must contain at least three escorts for every capital ship taken.",
         rule=dict(kind="min_ratio", min=3, label="Escorts per capital ship",
                   allow_pick=[dict(sec="ESCORTS")], per_pick=[dict(sec="Cruisers")])),
    dict(list_has="Tyranids \u2014 Hive Fleet", sec="ESCORTS",
         from_text="between 6 and 12 escort class ships for each hive ship",
         src="You may include between 6 and 12 escort class ships for each hive ship.",
         rules=[dict(kind="min_ratio", min=6, label="Escorts per hive ship (min)",
                     allow_pick=[dict(sec="ESCORTS")], per_pick=[dict(sec="HIVE SHIPS")]),
                dict(kind="ratio", allow=12, allow_type="escort class ships", per=1, per_type="hive ship", label="Escorts per hive ship (max)",
                     allow_pick=[dict(sec="ESCORTS")], per_pick=[dict(sec="HIVE SHIPS")])]),
    dict(list_has="Tyranids \u2014 Hive Fleet", sec="ESCORTS",
         from_text="at least six escort drones for every hive ship",
         src="The fleet must have at least six escort drones for every hive ship in the fleet.",
         keep_text=True,
         rule=dict(kind="min_ratio", min=6, label="Escort drones per hive ship",
                   allow_pick=[dict(sec="ESCORTS", re="escort drone")], per_pick=[dict(sec="HIVE SHIPS")])),
    # --- conditional limits ---
    dict(list_has="Tyranids \u2014 Hive Fleet", sec="ESCORTS",
         from_text="If no hive ships are chosen, only Kraken and Vanguard drone ships",
         src="If no hive ships are chosen, only Kraken and Vanguard drone ships may be included in the fleet.",
         rule=dict(kind="conditional_cap", label="Without a hive ship: only Kraken & Vanguard",
                   pick=[dict(sec="ESCORTS", re="^(?!kraken|vanguard)"), dict(sec="CAPITAL SHIPS")],
                   cond_pick=[dict(sec="HIVE SHIPS")], cond_min=1, max_unmet=0, max_met=None)),
    dict(list_has="Rogue Traders \u2014 Exploration", sec="The Kroot",
         from_text="A single Kroot Warsphere may be taken if there are at least three Rogue Trader cruisers",
         src="A single Kroot Warsphere may be taken if there are at least three Rogue Trader cruisers in the fleet.",
         rule=dict(kind="conditional_cap", label="Kroot Warsphere",
                   pick=[dict(sec="The Kroot")], cond_pick=[dict(sec="CAPITAL SHIPS", re="rogue trader cruiser")], cond_min=3,
                   max_unmet=0, max_met=1)),
    dict(list_has="Da Ork Clanz", sec="Space Hulks",
         from_text="An Ork fleet with at least three Warlords may include one Space Hulk",
         src="An Ork fleet with at least three Warlords may include one Space Hulk.",
         rule=dict(kind="conditional_cap", label="Space Hulk",
                   pick=[dict(sec="Space Hulks")], cond_pick=[dict(sec="WARLORD")], cond_min=3, max_unmet=0, max_met=1)),
    # --- Spot check 18 (a book inventory) blocks CH and IN -------------------
    # J24 p.241/245/249: the Daemonship share on the god lists. The base is all large
    # ships; those listed in brackets (the named barge, for Khorne the battleships)
    # cannot take the upgrade, and that is already in the rows' conditions. Tying to
    # the flagship is not modelled (J8).
    *[dict(list_has=nm, sec="DAEMONSHIPS", from_text=ft, keep_text=True, src=src,
           rule=dict(kind="upgrade_ratio", per=per, allow=1, label=lab, up_sec="DAEMONSHIPS",
                     up_re="^daemonship", per_pick=_CHAOS_CAP))
      for nm, ft, src, per, lab in (
          ("Chaos \u2014 Nurgle", "Up to a third of the capital ships",
           "Up to a third of the capital ships (not the Terminus Est or flagship) in a Plaguefleet may be "
           "upgraded to Daemonships at the additional points cost shown, based upon the type of vessel chosen.",
           3, "Daemonships (up to a third of the capital ships)"),
          ("Chaos \u2014 Khorne", "Up to a quarter of the capital ships",
           "Up to a quarter of the capital ships (not battleships or the flagship) in a Berzerker Fleet may be "
           "upgraded to Daemonships at the additional points cost shown, based upon the type of vessel chosen.",
           4, "Daemonships (up to a quarter of the capital ships)"),
          ("Chaos \u2014 Slaanesh", "Up to half of the capital ships",
           "Up to half of the capital ships (not the Wage of Sin or the flagship) in a Pleasurefleet may be "
           "upgraded to Daemonships at the additional points cost shown, based upon the type of vessel chosen.",
           2, "Daemonships (up to half of the capital ships)"))],
    # J25 p.235: "The Planet Killer also counts as a battleship when working
    # out how many heavy cruisers and cruisers the fleet requires." J26 p.288:
    # Space Hulk "counts as a battleship for purposes of taking another so in
    # order to take a second battleship, the fleet must already have six
    # cruisers" - but "there is no minimum point requirement or ship
    # prerequisite for fielding a Chaos Space Hulk" (at_least).
    *[dict(list_has=nm, sec="Battleships",
           match_src="You may include up to one battleship in your fleet for every three cruisers or heavy cruisers",
           set=dict(allow_pick=[dict(sec="Battleships")] + ([dict(sec="Planet Killer")] if pk else [])
                    + [dict(sec="Chaos Space Hulk")],
                    at_least=dict(cond_pick=[dict(sec="Chaos Space Hulk")], count=1)))
      for nm, pk in _CHAOS_HULK_LISTS],
    # J26 p.288: exclusions and at most two other battleships. The list
    # says only "See it's profile for restrictions"; the rule is in the profile.
    *[dict(list_has=nm, sec="Chaos Space Hulk", match_src="You may include up to one Space Hulk in the fleet",
           add=[dict(kind="conditional_cap", label="Chaos Space Hulk: not with the Planet Killer or a mandatory flagship",
                     pick=[dict(sec="Chaos Space Hulk")],
                     cond_pick=([dict(sec="Planet Killer")] if pk else [])
                     + [dict(sec="Battleships", re="^(terminus est|wage of sin|scion of prospero)")],
                     cond_min=1, max_unmet=None, max_met=0, src=_HULK_WITH)]
               # J52 p.245: "Bezerker Fleets led by a Space Hulk may have more than two
               # battleships, but other restrictions remain unchanged."
               + ([] if "Khorne" in nm else [
                   dict(kind="conditional_cap", label="Battleships with a Chaos Space Hulk",
                        pick=[dict(sec="Battleships")] + ([dict(sec="Planet Killer")] if pk else []),
                        cond_pick=[dict(sec="Chaos Space Hulk")], cond_min=1, max_unmet=None, max_met=2,
                        src=_HULK_BS)]))
      for nm, pk in _CHAOS_HULK_LISTS],
    # J27 p.49: "An Emperor class battleship can only be taken as reserves
    # unless Admiral Rath leads the fleet." p.50: "one reserve battleship for
    # every three Bakka battleships in the fleet"; "one reserve cruiser,
    # battlecruiser or grand cruiser for every three Bakka cruisers". p.14:
    # "Reserves are still subject to the restrictions on minimum and maximum
    # numbers of certain types of vessels" -> the Jovian into the battlecruiser ratio.
    dict(list_has="Bakka", sec="Battleships",
         from_text="An Emperor class battleship can only be taken as reserves unless Admiral Rath leads",
         src="An Emperor class battleship can only be taken as reserves unless Admiral Rath leads the fleet.",
         rule=dict(kind="requires", label="Emperor class battleship as reserve (three Bakka battleships or Rath)",
                   if_pick=[dict(sec="Battleships", re="^emperor")],
                   then_pick=[dict(sec="Battleships", re="^(?!emperor)")], min=3,
                   unless_pick=[dict(sec="Admiral", re="rath")])),
    dict(list_has="Bakka", sec="RESERVES",
         from_text="Ships from any Imperial fleet list may be used as reserves, with one reserve cruiser",
         keep_text=True,
         src="Ships from any Imperial fleet list may be used as reserves, with one reserve cruiser, battlecruiser "
             "or grand cruiser for every three Bakka cruisers in the fleet, one reserve battleship for every three "
             "Bakka battleships in the fleet, etc.",
         rule=dict(kind="ratio", allow=1, per=3, label="Reserve cruisers, battlecruisers and grand cruisers",
                   allow_pick=[dict(sec="RESERVES")], per_pick=[dict(sec="Cruisers")])),
    dict(list_has="Bakka", sec="Battlecruisers",
         match_src="You may include up to one battlecruiser in your fleet for every two cruisers",
         set=dict(allow_pick=[dict(sec="Battlecruisers"), dict(sec="RESERVES", re="jovian")])),
    # J28 p.151: "Up to half of the Grey Knights strike cruisers in a fleet
    # may replace their launch bays with one of the refits listed below, in
    # any mix desired." The sentence is in the profile; the rule goes beside the list's GK row.
    *[dict(list_has=nm, sec="CAPITAL SHIPS", match_src=ms,
           add=[dict(kind="option_ratio", per=2, allow=1,
                     label="Grey Knights strike cruisers with launch bays replaced (up to half)",
                     pick=[dict(sec="CAPITAL SHIPS", re="grey knights strike cruiser")],
                     opt_re="replace (its )?launch bays",
                     src="Up to half of the Grey Knights strike cruisers in a fleet may replace their launch "
                         "bays with one of the refits listed below, in any mix desired.")])
      for nm, ms in (("Grey Knights", "One Grey Knights Strike Cruiser may be taken per 500 points"),
                     ("The Emperor's Inquisition", "up to one Grey Knights Strike Cruiser may be taken"))],
    # J32 p.373: "However, no more than one of each of the named Ork
    # battleships may be in the fleet, no more than one 'Uge ship may be taken
    # in the fleet for every two kroozers, and a Space Hulk may only be taken
    # by a fleet of no less than 1500 points." The limit of the named ones (0-1) is already in
    # the rows' mx; the sentence stays visible (keep_text).
    dict(list_has="Da Ork Clanz", sec="USING SKWADRONS",
         from_text="no more than one \u2018Uge ship may be taken in the fleet for every two kroozers",
         keep_text=True,
         src="However, no more than one of each of the named Ork battleships may be in the fleet, no more than "
             "one \u2018Uge ship may be taken in the fleet for every two kroozers, and a Space Hulk may only be "
             "taken by a fleet of no less than 1500 points.",
         rules=[dict(kind="ratio", allow=1, per=2, label="'Uge ships (one per two kroozers)",
                     allow_pick=[dict(sec="\u2018Uge ship skwadron")], per_pick=[dict(sec="Big ship skwadron")]),
                dict(kind="allowed_at", points=1500, over=False, label="Space Hulk (1,500 pts or more)",
                     pick=[dict(sec="Space Hulks")])]),
    # p.174: "If a fleet has more than one Rogue Trader cruiser or also
    # includes more than one squadron of transports, a Veteran Rogue Trader
    # must be assigned to a Rogue Trader cruiser." The Siluria counts "as a
    # cruiser" (Nate Montes, p.174); the transport squadrons are Heavy Transports and
    # cargo ships ("any number of cargo ships of any type (whether or not the
    # scenario requires transports)"). Spot check 18 (J23).
    dict(list_has="Rogue Traders", list_is="Rogue Traders", sec="Veteran Rogue Traders",
         from_text="If a fleet has more than one Rogue Trader cruiser",
         src="If a fleet has more than one Rogue Trader cruiser or also includes more than one squadron of transports, a Veteran Rogue Trader must be assigned to a Rogue Trader cruiser.",
         rules=[dict(kind="requires", label="Veteran Rogue Trader required (two or more Rogue Trader cruisers)",
                     if_pick=[dict(sec="CAPITAL SHIPS", re="cruiser"), dict(sec="NOTES FROM NATE MONTES", re="^siluria")],
                     if_min=2, then_pick=[dict(sec="Veteran Rogue Traders")], min=1),
                dict(kind="requires", label="Veteran Rogue Trader required (two or more transport squadrons)",
                     if_pick=[dict(sec="CAPITAL SHIPS", re="transport"), dict(sec="ESCORTS", re="cargo")],
                     if_units=True, if_min=2, then_pick=[dict(sec="Veteran Rogue Traders")], min=1)]),
    # J213 p.174: "A Veteran Rogue Trader may lead each Rogue Trader cruiser in
    # a fleet." The section heading cap (2) let two Veterans through for one
    # cruiser (docs/check-yourself S0345). Cruisers as above:
    # the cruisers of the CAPITAL SHIPS section and the Siluria "as a cruiser".
    dict(list_has="Rogue Traders", list_is="Rogue Traders", sec="Veteran Rogue Traders",
         from_text="A Veteran Rogue Trader may lead each Rogue Trader cruiser",
         src="A Veteran Rogue Trader may lead each Rogue Trader cruiser in a fleet.",
         keep_text=True,
         rule=dict(kind="ratio", allow=1, allow_type="Veteran Rogue Trader", per=1,
                   per_type="Rogue Trader cruisers", label="Veteran Rogue Traders (one per Rogue Trader cruiser)",
                   allow_pick=[dict(sec="Veteran Rogue Traders")],
                   per_pick=[dict(sec="CAPITAL SHIPS", re="cruiser"),
                             dict(sec="NOTES FROM NATE MONTES", re="^siluria")])),
    dict(list_has="Tau \u2014 Commerce Protection", sec="Commander",
         from_text="If the fleet includes a Custodian, a Kor",
         src="If the fleet includes a Custodian, a Kor\u2019O must lead it.",
         rule=dict(kind="requires", label="Custodian needs a Kor\u2019O",
                   if_pick=[dict(sec="Battleships", re="custodian")], then_pick=[dict(sec="Commander", re="kor.o\\b|kor.o.mesme")], min=1)),
    dict(list_has="Rogue Traders \u2014 Exploration", sec="TRANSPORTS",
         from_text="The fleet must include at least one squadron of escort-sized cargo ships",
         src="The fleet must include at least one squadron of escort-sized cargo ships of any type (whether or not the scenario requires transports), in a squadron of 2 to 6 ships.",
         keep_text=True,
         rule=dict(kind="mandatory_at", points=0, over=False, label="Cargo ship squadron",
                   pick=[dict(sec="TRANSPORTS", re="cargo|freighter|q-ship|escort carrier"), dict(sec="ESCORTS", re="cargo vessel")])),
    # --- pisteosuudet ---
    dict(list_has="Pirates and Wolf Packs", sec="BRIGANDS",
         from_text="Up to 10% of a pirate fleet may be made up of alien escorts",
         src="Up to 10% of a pirate fleet may be made up of alien escorts from any race except Tyranids, Necrons or vessels that require support from a capital ship of their race.",
         keep_text=True,
         rule=dict(kind="points_share", pct=10, of="total", label="Alien escorts (10 % of the fleet)",
                   pick=[dict(sec="ESCORTS", re="xenos")])),
    dict(list_has="Tyranids \u2014 Hive Fleet", sec="ORDNANCE",
         from_text="Up to 10 % of the fleet",
         src="Up to 10 % of the fleet\u2019s points allowance may be spent on Ordnance markers as long as at least one hive ship is chosen.",
         keep_text=True,
         rule=dict(kind="points_share", pct=10, of="limit", label="Ordnance markers (10 % of the allowance)",
                   pick=[dict(sec="ORDNANCE")], cond_pick=[dict(sec="HIVE SHIPS")], cond_min=1)),
    dict(list_has="Rogue Traders \u2014 Exploration", sec="TRANSPORTS",
         from_text="No more than 1/3 of the fleet",
         src="No more than 1/3 of the fleet\u2019s total transport value can be made up of heavy transports.",
         keep_text=True,
         rule=dict(kind="points_share", frac=0.3334, of="pick", label="Heavy transports (1/3 of transport value)",
                   pick=[dict(sec="TRANSPORTS", re="heavy transport")], of_pick=[dict(sec="TRANSPORTS")])),
    # --- a tiered limit ---
    dict(list_has="Tau \u2014 Merchant Fleet", sec="Kroot Vessels",
         from_text="up to one Warsphere if the fleet is worth 1500 points",
         src="A Tau fleet can include up to one Warsphere if the fleet is worth 1500 points, or up to two Warspheres in games larger than that.",
         rule=dict(kind="tiers", label="Kroot Warspheres", pick=[dict(sec="Kroot Vessels")], tiers=[[1500, 1], [1501, 2]])),
    dict(list_has="Tau \u2014 Commerce Protection", sec="Kroot Vessels",
         from_text="up to one Warsphere if the fleet is worth 1500 points",
         src="A Tau fleet can include up to one Warsphere if the fleet is worth 1500 points, or up to two Warspheres in games larger than that.",
         rule=dict(kind="tiers", label="Kroot Warspheres", pick=[dict(sec="Kroot Vessels")], tiers=[[1500, 1], [1501, 2]])),
    # --- upgrades in proportion to ships ---
    dict(list_has="Tyranids \u2014 Hive Fleet", sec="FLEET COMMANDER",
         from_text="A maximum of one Hive Mind Influence re-roll can be purchased per hive ship",
         src="A maximum of one Hive Mind Influence re-roll can be purchased per hive ship in the fleet.",
         rule=dict(kind="upgrade_ratio", per=1, allow=1, label="Hive Mind Influence re-rolls",
                   up_sec="FLEET COMMANDER", up_re="hive mind influence", per_pick=[dict(sec="HIVE SHIPS")])),
    dict(list_has="Tyranids \u2014 Hive Fleet", sec="FLEET COMMANDER",
         from_text="A maximum of one Hive Mind Imperative can be purchased per two hive ships",
         src="A maximum of one Hive Mind Imperative can be purchased per two hive ships in the fleet, though a single Hive Mind Imperative may be purchased as long as the fleet contains at least one hive ship.",
         rule=dict(kind="upgrade_ratio", per=2, allow=1, min_one=True, label="Hive Mind Imperatives",
                   up_sec="FLEET COMMANDER", up_re="hive mind imperative", per_pick=[dict(sec="HIVE SHIPS")])),
    dict(list_has="Tyranids \u2014 Hive Fleet", sec="FLEET RULES (pg. 423\u2013428)", late=True, keep_text=True,
         from_text="No hive ship may ever have more than three different special refits",
         src="No hive ship may ever have more than three different special refits, no cruiser more than two and no escort more than one.",
         rules=[dict(kind="unit_upgrade_max", max=3, label="Refits per hive ship", up_sec="BIO-ENHANCEMENTS", unit_pick=[dict(sec="HIVE SHIPS")]),
                dict(kind="unit_upgrade_max", max=2, label="Refits per cruiser", up_sec="BIO-ENHANCEMENTS", unit_pick=[dict(sec="CAPITAL SHIPS")]),
                dict(kind="unit_upgrade_max", max=1, label="Refits per escort", up_sec="BIO-ENHANCEMENTS", unit_pick=[dict(sec="ESCORTS")])]),
    dict(list_has="Tyranids \u2014 Vanguard Fleet", sec="FLEET RULES (pg. 423\u2013428)", keep_text=True,
         from_text="No hive ship may ever have more than three different special refits",
         src="No hive ship may ever have more than three different special refits, no cruiser more than two and no escort more than one.",
         rule=dict(kind="unit_upgrade_max", max=1, label="Refits per escort", up_sec="BIO-ENHANCEMENTS",
                   unit_pick=[dict(sec="VANGUARD DRONE SHIPS"), dict(sec="KRAKEN")])),
    # --- ratios the parser does not recognise ---
    dict(list_has="Rogue Traders \u2014 Exploration", sec="Veteran Rogue Traders",
         from_text="A Veteran Rogue Trader may be present for every two Rogue Trader cruisers",
         src="A Veteran Rogue Trader may be present for every two Rogue Trader cruisers in a fleet. At least one Veteran Rogue Trader must be assigned to a Rogue Trader cruiser in the fleet.",
         keep_text=True,
         rules=[dict(kind="ratio", allow=1, allow_type="Veteran Rogue Trader", per=2, per_type="Rogue Trader cruisers", min_one=True, label="Veteran Rogue Traders",
                     allow_pick=[dict(sec="Veteran Rogue Traders")], per_pick=[dict(sec="CAPITAL SHIPS", re="rogue trader cruiser")]),
                dict(kind="mandatory_at", points=0, over=False, label="Veteran Rogue Trader", pick=[dict(sec="Veteran Rogue Traders")])]),
    dict(list_has="Demiurg", sec="ESCORTS",
         from_text="For every three Demiurg capital ships in the fleet, it may include one squadron",
         src="For every three Demiurg capital ships in the fleet, it may include one squadron of up to six Tau or Rogue Trader escorts.",
         rule=dict(kind="ratio", allow=1, allow_type="squadron of Tau or Rogue Trader escorts", per=3, per_type="Demiurg capital ships", units=True, label="Tau & Rogue Trader escort squadrons",
                   allow_pick=[dict(sec="Tau Escorts"), dict(sec="Rogue Trader Escorts")],
                   per_pick=[dict(sec="Battleships"), dict(sec="Cruisers", re="bastion|citadel")])),
    # Iyanden: the Autarch's Dragonship flagship does not count towards the ratio.
    dict(list_has="Iyanden", sec="Dragonships",
         match_src='Your fleet may include up to one Dragonship for every two Wr', set=dict(exempt=dict(cond_pick=[dict(sec="Autarch", re="autarch")], cond_min=1, count=1))),
]


def pick_secs(picks, sec_titles, where):
    """[{sec:'Cruisers', re:'...'}] -> [{sec:3, re:'...'}]."""
    out = []
    for p in picks:
        want = p["sec"].strip().lower()
        hit = [i for i, t in enumerate(sec_titles) if t.strip().lower() == want]
        assert len(hit) == 1, ("%s: section %r not found exactly once, "
                               "sections: %s" % (where, p["sec"], sec_titles))
        # The requested section name is kept for the guard: the section index may
        # move later, and a wrong but existing index does not
        # show anywhere.
        q = dict(sec=hit[0], _t=p["sec"].strip().lower())
        if p.get("re"):
            q["re"] = p["re"]
        out.append(q)
    return out


# --- cleaning the text to show ------------------------------------------
# Three separate defects, all from the same cause: the FLEET RULES
# block picks a whole page range from the book, and among the rules there
# is also narrative and price tables.
#
# A sentence-level filter is NOT made. I tried it: the words "only" and "never"
# tell narrative from rules badly, and most of the 326 candidates
# were genuine rules - Warp Translation, the necrons' critical hits,
# the tyranids' refits. A wrong drop is worse than a visible needless sentence,
# so only what can be established for certain is weeded out.

# 1) Wholly narrative sections. These are read sentence by sentence.
#    Each must hit exactly once, or the run fails.
LORE_SECTIONS = [
    # Bakka's "FLEET RULES (pg. 42-47)" no longer exists: those pages
    # belong to Armageddon's page range, and rules_pages no longer picks
    # the previous list's pages. The same narrative is now removed from Armageddon's
    # own sections below.
    dict(list_has="Emperor's Inquisition", sec="FLEET RULES (pg. 132–137)"),
    dict(list_has="Rogue Traders", sec="FLEET RULES (pg. 168–173)"),
    dict(list_has="Armageddon Sector", sec="THE FIRST TYRANNIC WAR"),
    dict(list_has="Armageddon Sector", sec="LORD ADMIRAL ZACCARIUS RATH"),
    dict(list_has="Armageddon Sector", sec="THE FORGE WORLD OF BAKKA"),
    dict(list_has="Armageddon Sector", sec="SEGMENTUM TEMPESTUS"),
    dict(list_has="Dominion", sec="SPACE MARINE DOMINION FLEETS"),
]

# 1b) Sections that do not belong to this list at all.
#
#     The book's pages 368-371 are the ORK CLANZ rules. They fall in
#     the Waaagh! list's page range (366-371) only because the Clanz list
#     starts on page 372. Page 368 says so directly:
#     "The Ork Clanz rules can be used in addition to the normal Ork
#     rules, but only with its dedicated Clanz fleet list."
#     Without this removal the Waaagh! list offered 14 Gubbins upgrades and
#     six clan benefits the book does not allow on that list.
#
#     The removal runs only AFTER upgrades.annotate, because
#     the Gubbins price list and the clans' prices are copied to the Clanz list
#     from these same sections.
# 1c) Lists where a section heading's count limit is the size of a SKWADRON, not
#     the fleet's total. Da Ork Clanz describes every section as
#     a skwadron's pattern ("1-2 Kroozers", "3-10 Escorts", "1-4 Roks"),
#     and page 373 says: "There is no restriction for what kinds or how
#     many of what type of skwadrons are in the fleet." So a fleet may
#     have several Rok skwadrons, but a section counter made from the heading number
#     gave an error from the fifth Rok on.
#
#     The app does not model skwadrons of capital ships - a count exists
#     only for escorts - so the skwadron size cannot be enforced. It is
#     stated as text.
HEAD_IS_SQUADRON = ["Orks \u2014 Da Ork Clanz"]
_HEAD_SQ_USED = [0]

DROP_SECS = [
    dict(list_has="Waaagh!", sec="ORK CLANZ"),
    dict(list_has="Waaagh!", sec="USING ORK CLANZ"),
    dict(list_has="Waaagh!", sec="MUSTERIN' DA CLANZ"),
    dict(list_has="Waaagh!", sec="CLAN UPGRADES"),
    dict(list_has="Waaagh!", sec="MOB RULE"),
    dict(list_has="Waaagh!", sec="YOUNG GUNZ"),
    dict(list_has="Waaagh!", sec="GUBBINS"),
    dict(list_has="Waaagh!", sec="MORE GUBBINS"),
]

# 2) Price table rows. On the book's list page a row has the form
#    "Despoiler class battleship (pg 266).............400 pts", and
#    in extraction these stick to the front of the next rule sentence. The rows
#    are already their own choosable rows, so here they are just
#    noise. The same content in two forms is exactly the confusion
#    the feedback pointed out.
# The row's name part may be at most six words. Without this limit the pattern
# would eat a genuine sentence: "Torture class cruisers may choose one of the
# following for the points shown: 1-2 Impaler Assault Modules.....+20 pts"
# would lose its start, which is itself the rule.
_LEAD = r"(?:\(?\d+\s*[-–]\s*\d+\)?\s+|\d+[:.]\s+)?"     # "0-1 ", "6: "
_NAME = r"(?:[^.\s]+[ \t]+){0,5}[^.\s]*?"                # <= 6 words
_COST = r"(?:\+?\d[\d,]*\s*(?:pts|points)(?:\s*each)?|Free)"

# "Veteran Captain (Ld +1).........+50 pts", "Shokk-Attack Lance.....Free"
PRICE_ROW = re.compile(r"^\s*" + _LEAD + r"(?:" + _NAME + r"\.{2,}\s*)?"
                       + _COST + r"\b[\s.]*", re.I)
# "Grey Knights Strike Cruiser (pg 151)......vvv" - the price may be missing or
# corrupted, but the page reference still identifies the row.
PRICE_HEAD = re.compile(r"^\s*" + _LEAD + _NAME +
                        r"\(pg\.?\s*\d+\)\.{2,}\s*(?:v+|" + _COST +
                        r")?[\s.]*", re.I)


def strip_price_rows(t):
    """Removes price table rows from the start of a sentence. Returns None if
    nothing but prices is left of the sentence.

    Only a sentence that held a price row may drop entirely. Without this
    condition a short but valid sentence disappeared: "Re-rolls: 1 per turn." is
    Abaddon's number of re-rolls, not noise."""
    orig = t
    prev = None
    while prev != t:
        prev = t
        t = PRICE_HEAD.sub("", t)
        t = PRICE_ROW.sub("", t)
    t = t.strip()
    if t == orig.strip():
        return orig
    # A bare subheading or nothing left -> not shown.
    if len(t) < 25 or not re.search(r"[a-z]{3}\s+[a-z]{3}", t):
        return None
    return t


def apply_rule_picks(name, title, sec_titles, rules, text):
    """Returns (rules, text) after the fixes."""
    for fx in RULE_PICKS:
        if fx["list_has"] not in name or fx.get("late"):
            continue
        # list_is: "Rogue Traders" is also the start of two other lists' names.
        if fx.get("list_is") and fx["list_is"] != name:
            continue
        if title.strip().lower() != fx["sec"].strip().lower():
            continue
        where = "%s / %s" % (name, title)
        if "match_src" in fx:
            hit = [r for r in rules if fx["match_src"] in r.get("src", "")]
            assert len(hit) == 1, ("%s: the source sentence %r hit %d rules"
                                   % (where, fx["match_src"], len(hit)))
            patch = dict(fx.get("set") or {})
            for k in list(patch):
                if k == "pick" or k.endswith("_pick"):
                    patch[k] = pick_secs(patch[k], sec_titles, where)
            if "exempt" in patch and "cond_pick" in patch["exempt"]:
                patch["exempt"] = dict(patch["exempt"], cond_pick=pick_secs(patch["exempt"]["cond_pick"], sec_titles, where))
            if "at_least" in patch:
                patch["at_least"] = dict(patch["at_least"], cond_pick=pick_secs(patch["at_least"]["cond_pick"], sec_titles, where))
            hit[0].update(patch)
            # add: a second rule from the same sentence. p.174 RT escorts: the size
            # 2-6 is the parser's squadron rule, the count per ship a ratio.
            for rule in fx.get("add", []):
                # Its own src, when the rule is on the profile page and not in the list's sentence (p.288).
                r = dict(rule, src=rule.get("src") or hit[0]["src"], ok=True)
                for k in list(r):
                    if k == "pick" or k.endswith("_pick"):
                        r[k] = pick_secs(r[k], sec_titles, where)
                if "allow_pick" not in r:
                    r["sec"] = list(hit[0].get("sec") or [])
                rules = rules + [r]
        else:
            hit = [t for t in text if fx["from_text"] in t]
            assert len(hit) == 1, ("%s: the text sentence %r hit %d times"
                                   % (where, fx["from_text"], len(hit)))
            if not fx.get("keep_text"):
                text = [t for t in text if t not in hit]
            new_rules = []
            for rule in (fx.get("rules") or [fx["rule"]]):
              r = dict(rule, src=fx["src"], ok=True)
              # "pick" is the same structure as allow_pick/per_pick, but
              # for points limits and requirements: a section plus a name filter.
              # Item 8: every *_pick key (a_pick, b_pick, cond_pick,
              # of_pick, if_pick, then_pick, unit_pick) is resolved the same way.
              for k in list(r):
                  if k == "pick" or k.endswith("_pick"):
                      r[k] = pick_secs(r[k], sec_titles, where)
              if "exempt" in r and "cond_pick" in r["exempt"]:
                  r["exempt"] = dict(r["exempt"], cond_pick=pick_secs(r["exempt"]["cond_pick"], sec_titles, where))
              if "at_least" in r:
                  r["at_least"] = dict(r["at_least"], cond_pick=pick_secs(r["at_least"]["cond_pick"], sec_titles, where))
              # up_sec (the upgrade section) is resolved only after upgrades.annotate
              # has created the sections (BIO-ENHANCEMENTS is born there): see the end.
              new_rules.append(r)
            for r in new_rules:
              if "secs" in r:
                # A rule may concern sections other than the one the sentence
                # is in. The tyranids' SQUADRONS section has no ship at all,
                # so a skwadron rule tied to its own section would measure
                # nothing.
                want = [x.strip().lower() for x in r.pop("secs")]
                r["sec"] = [i for i, t in enumerate(sec_titles)
                            if t.strip().lower() in want]
                assert len(r["sec"]) == len(want), (
                    "%s: sections %r not found (sections: %s)"
                    % (where, want, sec_titles))
              elif "allow_pick" not in r:
                # Rules other than ratios are tied to their own section.
                idx = [i for i, t in enumerate(sec_titles)
                       if t.strip().lower() == title.strip().lower()]
                assert len(idx) == 1, ("%s: section not found exactly once"
                                       % where)
                r["sec"] = idx
              rules = rules + [r]
        fx["_used"] = fx.get("_used", 0) + 1
    return rules, text

# --- list rows added by hand ---------------------------------------------
# A row the book mentions but whose price is unreadable as a misprint,
# so the parser cannot pick it. Each addition must
# hit exactly once and its source sentence must be found in the section's
# rule text - otherwise no price is invented but the run fails.
ENTRY_ADDS = [
    dict(list_has="Grey Knights", sec="CAPITAL SHIPS",
         src=r"One Grey Knights Strike Cruiser may be taken per 500 points",
         entry=dict(l="Grey Knights Strike Cruiser", r=151, p=165, a=0,
                    mx=None, k="unit",
                    nt="The book's price on pg. 145 is unreadable ('vvv'); "
                       "165 pts is what the same ship costs on pg. 138.")),
]


# A per-row count limit the book writes as a sentence and not in front of the
# row. The book usually marks the limit in the form "0-1 Name.....500 pts",
# and it is picked by machine. The Necron Sepulchre is an exception: the row
# is just "Sepulchre.....+50 pts" and the limit is in the previous sentence.
# The source sentence must be found in the section's text, or the run fails.
ENTRY_LIMITS = [
    dict(list_has="Necrons", sec="Tombships", entry="Sepulchre", mx=1,
         src=r"A single tombship may be upgraded to carry a Sepulchre"),
    # Three Chaos upgrades for which the book gives an exact count.
    # "Including the flagship" means the flagship is counted
    # in, not that it would be required - so the limit is fleet-level.
    dict(list_has="Chaos \u2014 Tzeentch", sec="FORCES OF CHAOS",
         entry="Warp Beasts", mx=2,
         src=r"Up to two capital ships \(including the flagship\)"),
    dict(list_has="Chaos \u2014 Nurgle", sec="FORCES OF CHAOS",
         entry="Ark of Pestilence", mx=3,
         src=r"Up to three capital ships with the Mark of Nurgle"),
    dict(list_has="Chaos \u2014 Slaanesh", sec="FORCES OF CHAOS",
         entry="Siren\u2019s Summon", mx=2,
         src=r"Up to two capital ships with the Mark of Slaanesh"),
    # p.486: the Demiurg re-rolls are bought for the fleet once ("purchased by
    # the fleet as a whole") - each row at most once in the fleet.
    # fxg: the rows are alternatives of the same purchase - "The fleet gets one re-roll
    # and can purchase extra re-rolls at the cost shown": One or Two, not
    # both for different ships (three are not sold). Spot check 19, J41.
    dict(list_has="Demiurg \u2014 War Host", sec="Re-rolls",
         entry="One extra re-roll", mx=1, fxg="rerolls",
         src=r"purchased by the fleet as a whole"),
    dict(list_has="Demiurg \u2014 War Host", sec="Re-rolls",
         entry="Two extra re-rolls", mx=1, fxg="rerolls",
         src=r"purchased by the fleet as a whole"),
    # The Necrons likewise: "purchased by the fleet as a whole" (p.404).
    dict(list_has="Necrons \u2014 Harvest Fleet", sec="Re-rolls",
         entry="One extra re-roll", mx=1, fxg="rerolls",
         src=r"purchased by the fleet as a whole"),
    dict(list_has="Necrons \u2014 Harvest Fleet", sec="Re-rolls",
         entry="Two extra re-rolls", mx=1, fxg="rerolls",
         src=r"purchased by the fleet as a whole"),
    # J77 p.145: "The vessel embarking the Inquisitor Lord or one Grey Knights
    # vessel may take Grey Knight Terminators." - one ship in the fleet.
    dict(list_has="Grey Knights", sec="ORDNANCE AND UPGRADES",
         entry="Grey Knights Terminators", mx=1,
         src=r"The vessel embarking the Inquisitor Lord or one Grey Knights vessel may take Grey Knight Terminators"),
    # Rogue Traders Exploration p.177: "no more than one Stronghold may be taken"
    dict(list_has="Rogue Traders \u2014 Exploration", sec="The Demiurg",
         entry="Stronghold Commerce Vessel", mx=1,
         src=r"no more than one Stronghold may be taken"),
]


def apply_entry_limits(name, title, raw, ents):
    for fx in ENTRY_LIMITS:
        if fx["list_has"] not in name:
            continue
        if title.strip().lower() != fx["sec"].strip().lower():
            continue
        assert re.search(fx["src"], raw, re.I), (
            "%s / %s: the source sentence %r is not in the section's text"
            % (name, title, fx["src"]))
        hit = [e for e in ents if str(e.get("l", "")).lower()
               == fx["entry"].strip().lower()]
        assert len(hit) == 1, ("%s / %s: row %r found %d times"
                               % (name, title, fx["entry"], len(hit)))
        hit[0]["mx"] = fx["mx"]
        if fx.get("fxg"):
            hit[0]["fxg"] = fx["fxg"]
        fx["_used"] = fx.get("_used", 0) + 1


def apply_entry_adds(name, title, raw, ents):
    for fx in ENTRY_ADDS:
        if fx["list_has"] not in name:
            continue
        if title.strip().lower() != fx["sec"].strip().lower():
            continue
        assert re.search(fx["src"], raw, re.I), (
            "%s / %s: the source sentence %r is not in the section's text"
            % (name, title, fx["src"]))
        lab = fx["entry"]["l"].lower()
        if any(str(e.get("l", "")).lower() == lab for e in ents):
            continue
        ents.append(dict(fx["entry"]))
        fx["_used"] = fx.get("_used", 0) + 1



# --------------------------------------------------- the section index guard
# A section index is a silent reference: if the section moves or goes, the index
# still points somewhere - at the wrong section. Bastion Fleets' battleship ratio
# broke exactly here. So every reference carries the section's NAME, and the name
# is checked again after every move. The name also stays in the data,
# so that domain.js can compare it before counting.
#
# The forms of a reference:
#   top-level list        sec / allow_sec / per_sec  = [3, 4]   -> "<key>_sn"
#   pick dictionary       {"sec": 3, "re": ...}                 -> "sn"
#   upgrade section       {"up_sec": 7, ...}                    -> "up_sn"
_SEC_LIST_KEYS = ("sec", "allow_sec", "per_sec")
_SEC_COUNT = [0, 0]        # [references, checked again]


def _sec_names_walk(node, titles, where, stamp_new):
    if isinstance(node, list):
        for x in node:
            _sec_names_walk(x, titles, where, stamp_new)
        return
    if not isinstance(node, dict):
        return
    for k in list(node):
        v = node[k]
        if k in _SEC_LIST_KEYS and isinstance(v, list) and v and all(
                isinstance(i, int) for i in v):
            _sec_names_one(node, k + "_sn", [_sec_title(titles, i, where, k) for i in v],
                           where, k, stamp_new)
        elif k in ("sec", "up_sec") and isinstance(v, int):
            _sec_names_one(node, "sn" if k == "sec" else "up_sn",
                           _sec_title(titles, v, where, k), where, k, stamp_new)
        elif isinstance(v, (list, dict)) and not k.endswith("_sn") and k != "sn":
            _sec_names_walk(v, titles, where, stamp_new)


def _sec_title(titles, i, where, k):
    assert 0 <= i < len(titles), ("%s: %s points to section %d, there are %d sections"
                                  % (where, k, i, len(titles)))
    return titles[i]


def _sec_names_one(node, namekey, now, where, k, stamp_new):
    # One reference = one index, in list form too (sec=[3, 4] is two).
    n = len(now) if isinstance(now, list) else 1
    was = node.get(namekey)
    if was is None:
        if stamp_new:
            node[namekey] = now
            _SEC_COUNT[0] += n
        return
    assert was == now, (
        "%s: %s points to section %r, it should be %r - the section moved or "
        "went away without the index being fixed" % (where, k, now, was))
    _SEC_COUNT[1] += n


def stamp_section_names(secs, where, stamp_new=True):
    """Stamps and checks the section references of one list's rules."""
    titles = [x["t"].strip().lower() for x in secs]
    for sec in secs:
        for r in sec.get("rules") or []:
            _sec_names_walk(r, titles, "%s / %s" % (where, sec["t"]), stamp_new)


def check_section_names(lists, where, stamp_new=True):
    for Lz in lists:
        stamp_section_names(Lz["secs"], "%s: %s" % (where, Lz["nm"]), stamp_new)


def count_section_refs(node, acc):
    """References in total and the named ones among them - the same count as
    tools/test.js reports, so the numbers cannot drift apart."""
    if isinstance(node, list):
        for x in node:
            count_section_refs(x, acc)
        return acc
    if not isinstance(node, dict):
        return acc
    for k, v in node.items():
        if k in _SEC_LIST_KEYS and isinstance(v, list) and v and all(
                isinstance(i, int) for i in v):
            acc[0] += len(v)
            if isinstance(node.get(k + "_sn"), list) and len(node[k + "_sn"]) == len(v):
                acc[1] += len(v)
        elif k in ("sec", "up_sec") and isinstance(v, int):
            acc[0] += 1
            if node.get("sn" if k == "sec" else "up_sn") is not None:
                acc[1] += 1
        elif isinstance(v, (list, dict)) and k != "sn" and not k.endswith("_sn"):
            count_section_refs(v, acc)
    return acc


lists_out = []
raw_rules = []
raw_pages = []          # J165: the page bounds of the section text, the same indexes as raw_rules
_SHARED = [None]        # the FLEET RULES block seen last
_PICKS_OK = [0]         # pick references checked
_OWN_HITS = [0]         # sentences that have an owner row
_OWN_REOWNED = [0]      # moved by the priced row
_INHERITED = []         # the lists that inherit it
stat = collections.Counter()
for Lx in L:
    titles = [s["title"] for s in Lx["sections"]]
    secs = []
    raw_here = []
    pg_here = []
    for si, s in enumerate(Lx["sections"]):
        raw_here.append(" ".join(s["rules"]))
        pg_here.append(s.get("pg") or [])
        rules, text, notes = [], [], []
        for para in s["rules"]:
            m = SECN.match(para)
            if m:
                # concerns one skwadron, not the whole fleet -> shown only
                _head = para.split(".")[0].rstrip()
                # The heading row ends with a colon ("1-2 Kroozers,
                # chosen from the following list:"), and a full stop after it
                # gave ":." twice on the Da Ork Clanz list.
                text.append(_head if _head.endswith(":") else _head + ".")
            for sent in sentences(para):
                r = detect(sent)
                if not r:
                    if (RULEY.search(sent) and len(sent) < 500) or keep_text(Lx["name"], s["title"], sent):
                        text.append(sent)
                    continue
                # A sentence may be both an enforced rule and card text:
                # Farseers p.318 is a 0-3 count AND a re-roll usage rule,
                # which without this disappeared from the commander card (spot check 7 row 76).
                if keep_text(Lx["name"], s["title"], sent):
                    text.append(sent)
                r["src"] = sent
                r["ok"] = not s["title"].startswith("FLEET RULES")
                if r["kind"] == "ratio":
                    a = resolve_sections(r["allow_type"], titles, si)
                    b = resolve_sections(r["per_type"], titles, si)
                    if not a or not b or set(a) & set(b):
                        r["ok"] = False
                    else:
                        r["allow_sec"], r["per_sec"] = a, b
                elif r["kind"] == "cap":
                    a = resolve_sections(r["what"], titles, si)
                    if not a:
                        r["ok"] = False
                    else:
                        r["sec"] = a
                elif r["kind"] == "per_points":
                    a = resolve_sections(r["what"], titles, si)
                    if a:
                        r["sec"] = a
                    else:
                        r["ok"] = False
                elif r["kind"] in ("mandatory_at", "squadron", "section_count"):
                    r["sec"] = [si]
                    if r.get("needs_guard"):
                        # The sentence must speak of this section, otherwise
                        # section-level counting would measure the wrong thing.
                        tt = {w for w in re.findall(r"[a-z]+", s["title"].lower())
                              if len(w) > 3 and w not in ("your", "fleet", "with")}
                        sw = set(re.findall(r"[a-z]+", sent.lower()))
                        if not (tt & sw):
                            r["ok"] = False
                    r.pop("needs_guard", None)
                if r["ok"]:
                    rules.append(r)
                else:
                    text.append(sent)
        # the same rule may repeat in a paragraph -> clean the duplicates
        seen, uniq = set(), []
        for r in rules:
            k = json.dumps({x: v for x, v in r.items() if x != "src"}, sort_keys=True)
            if k in seen:
                continue
            seen.add(k)
            uniq.append(r)
        rules = uniq


        text = list(dict.fromkeys(text))
        rules, text = apply_rule_picks(Lx["name"], s["title"], titles,
                                       rules, text)

        # Wholly narrative sections out.
        for fx in LORE_SECTIONS:
            if fx["list_has"] in Lx["name"] and s["title"] == fx["sec"]:
                fx["_used"] = fx.get("_used", 0) + 1
                text = []

        # Price table rows off the start of sentences.
        text = [x for x in (strip_price_rows(t) for t in text) if x]

        ents = []
        for e in s["entries"]:
            fx = FIXES.get((Lx["name"], e["label"]))
            if fx:
                e = dict(e)
                e.update(fx)
            ents.append(dict(l=e["label"], r=e.get("ref"), p=e.get("pts"),
                         src_page=e.get("src_page"),
                             a=1 if e.get("add") else 0,
                             u=1 if e.get("upgrade") else 0,
                             mx=e.get("max"), nt=e.get("note")))
        # the heading's own count limit, e.g. "0-12 Cruisers"
        if s.get("hi") is not None:
            if any(k in Lx["name"] for k in HEAD_IS_SQUADRON):
                _HEAD_SQ_USED[0] += 1
                text.append(
                    "There is no restriction for what kinds or how many of what "
                    "type of skwadrons are in the fleet as long as no Warlord may "
                    "have more than one \u2019Uge Ship, which counts as a skwadron "
                    "by itself.")
                notes.append(
                    "Skwadron size, not a fleet total: the book prints "
                    "\u201c%s\u201d as the size of one skwadron (pg. 372)."
                    % (s.get("head", "") or s["title"]))
            else:
                rules.append(dict(kind="section_count", min=s["lo"], max=s["hi"],
                                  src=s.get("head", ""), sec=[si], ok=True, hdr=1))
        # The same upper limit from both the heading and the body text gives two
        # identical check rows. They are merged: what remains is
        # the section counter, but the source sentence is the book's full
        # sentence, because it says more than the bare heading.
        caps = [r for r in rules if r["kind"] == "cap"]
        heads = [r for r in rules if r["kind"] == "section_count"]
        if (len(caps) == 1 and len(heads) == 1
                and caps[0].get("max") == heads[0].get("max")):
            heads[0]["src"] = caps[0].get("src") or heads[0].get("src")
            rules = [r for r in rules if r is not caps[0]]

        for r in rules:
            stat[r["kind"]] += 1
        stat["text"] += len(text)
        apply_entry_adds(Lx["name"], s["title"],
                         " ".join(s["rules"]), ents)
        apply_entry_limits(Lx["name"], s["title"],
                           " ".join(s["rules"]), ents)
        # Whose row's description each sentence is. A name and not an index: indexes
        # move when duplicates are weeded out and rows are added.
        own = None
        desc = s.get("desc") or {}
        if desc:
            dkeys = [(lab, _nkey(dt)) for lab, dt in desc.items()]
            own = []
            for t in text:
                k = _nkey(t)
                own.append(next((lab for lab, dt in dkeys
                                 if k and dt and k in dt), None))
            if not any(own):
                own = None
            else:
                _OWN_HITS[0] += sum(1 for x in own if x)
        sec_out = dict(t=s["title"], rules=rules, text=text, notes=notes, ents=ents)
        if own:
            sec_out["own"] = own
        secs.append(sec_out)
    # The same sentence twice in the same list. The FLEET RULES block picks the whole
    # page range, so it repeats what is already under its own heading -
    # for example the Tau list's SQUADRONS sentences were in both. The more precise
    # place wins, i.e. the duplicate is removed from the FLEET RULES block.
    # own runs parallel to text, so both must be weeded
    # at the same time - otherwise the owners shift to the wrong sentences.
    def _trim(x, wanted):
        own = x.get("own")
        if own is None:
            x["text"] = wanted
            return
        pairs = [(t, o) for t, o in zip(x["text"], own) if t in wanted]
        x["text"] = [t for t, _ in pairs]
        x["own"] = [o for _, o in pairs]
        if not any(x["own"]):
            x.pop("own", None)

    fr = [i for i, x in enumerate(secs) if x["t"].startswith("FLEET RULES")]
    if fr:
        i = fr[0]
        elsewhere = {t for j, x in enumerate(secs) if j != i for t in x["text"]}
        _trim(secs[i], [t for t in secs[i]["text"] if t not in elsewhere])
    # The rest of the repeats: the same sentence in two other sections, the first stays.
    seen = set()
    for x in secs:
        keep = []
        for t in x["text"]:
            if t in seen:
                continue
            seen.add(t)
            keep.append(t)
        _trim(x, keep)

    # A faction's shared rules are in the book once, before the faction's
    # first list. The following lists of the same faction would be left without them,
    # although the rules concern them: 20 lists of 32 were without. The block is
    # inherited from the previous list - the lists are in page order and
    # each faction's first gets its own block, so the previous one is
    # always of the same faction.
    if secs and secs[0]["t"].startswith("FLEET RULES"):
        _SHARED[0] = secs[0]
    elif _SHARED[0] is not None:
        _sh = copy.deepcopy(_SHARED[0])
        # Item 8: inheritance brings visible text, not rules. A rule's
        # section indexes (pick, unit_pick, up_sec) are the SOURCE LIST's, and
        # an enforced rule is recorded per list (RULE_PICKS late).
        _sh["rules"] = []
        secs.insert(0, _sh)
        # raws is indexed by section: it is kept the same length. An empty
        # item, so that inheritance fires no prose rule again
        # but only adds visible text.
        raw_here.insert(0, "")
        pg_here.insert(0, [])
        _INHERITED.append(Lx["name"])
        # The section indexes move by one. Attachment targets (at) are not
        # counted yet, so only the rules' fields need the move.
        # NOTE: a section index is also inside the pick lists' dicts, and
        # forgetting them broke Bastion Fleets' battleship ratio
        # silently - the index still pointed at an existing but wrong
        # section, so not a single checker complained.
        for sec in secs[1:]:
            for r in sec["rules"]:
                for k in ("sec", "allow_sec", "per_sec"):
                    if k in r:
                        r[k] = [i + 1 for i in r[k]]
                for k in list(r):
                    if k == "pick" or k.endswith("_pick"):
                        for p in r.get(k) or []:
                            p["sec"] += 1
                if r.get("exempt"):
                    for p in r["exempt"].get("cond_pick") or []:
                        p["sec"] += 1
                # at_least (spot check 18, J26): the same nested pick as exempt.
                if r.get("at_least"):
                    for p in r["at_least"].get("cond_pick") or []:
                        p["sec"] += 1

    # Guard: every pick must point to the section that was requested in the
    # RULE_PICKS table. Runs only when the section list is
    # final, i.e. after all the moves.
    _titles = [x["t"].strip().lower() for x in secs]
    for sec in secs:
        for r in sec["rules"]:
            groups = [(k, r.get(k) or []) for k in list(r) if k == "pick" or k.endswith("_pick")]
            if r.get("exempt"):
                groups.append(("exempt.cond_pick", r["exempt"].get("cond_pick") or []))
            if r.get("at_least"):
                groups.append(("at_least.cond_pick", r["at_least"].get("cond_pick") or []))
            for k, picks in groups:
                for p in picks:
                    want = p.pop("_t", None)
                    if want is None:
                        continue
                    assert _titles[p["sec"]] == want, (
                        "%s / %s: %s points to section %r, it should be %r"
                        % (Lx["name"], sec["t"], k, _titles[p["sec"]], want))
                    _PICKS_OK[0] += 1

    # The names of the section indexes are kept now that this list's sections are
    # in their final order. Later phases (removing foreign sections,
    # late rule fixes) are checked against these.
    stamp_section_names(secs, Lx["name"])

    lists_out.append(dict(nm=Lx["name"], pg=Lx["start"], secs=secs))
    raw_rules.append(raw_here)
    raw_pages.append(pg_here)

# ------------------------------------------- page reference cross-check
STOP = {"class", "the", "of", "and", "a", "an", "ship", "vessel", "craft",
        "battleship", "cruiser", "escort", "destroyer", "frigate", "raider",
        "heavy", "light", "grand", "attack", "assault", "gunship", "ramship",
        "carrier", "transport", "star", "starship", "hulk", "rok", "kroozer",
        "battlekroozer", "battlecruiser", "monastery", "defence", "platform"}


def tokens(t):
    # A name in brackets is NOT to be removed: it is exactly the distinguishing part
    # ("Rapid strike vessel (Sword)", "LAR SHI (HERO) CLASS STARSHIP").
    t = re.sub(r"pg\.\s*\d+", " ", str(t or "")).lower()
    t = re.sub(r"[^a-z0-9' ]", " ", t)
    return {w for w in t.split() if len(w) > 2 and w not in STOP}


by_name = {}
for k, v in ships.items():
    for w in tokens(v["nm"]):
        by_name.setdefault(w, set()).add(k)

def norm_title(name):
    """A name in comparison form: letters and spaces only, the PTS tail off."""
    t = re.sub(r"[^A-Z ]", " ", str(name or "").upper())
    t = t.split(" PTS")[0]
    return " ".join(t.split())

ref_fixed = ref_flagged = 0
for Lx in lists_out:
    for sec in Lx["secs"]:
        for e in sec["ents"]:
            if not e["r"]:
                continue
            key = str(e["r"])
            lab = tokens(e["l"])
            cur = tokens(ships[key]["nm"]) if key in ships else None
            if not lab:
                continue
            # Two different situations. If the page has NO profile, cur is
            # None and repointing is in place. If the page HAS a
            # profile but its name consists only of general words,
            # tokens returns an empty set and nothing can be concluded from the names
            # - then the book's reference must not be changed. This happened to
            # the row "Cargo Transport (pg. 85)": the profile on page 85 is
            # "TRANSPORT", and because the word is on the stop list, the row was
            # pointed to page 192 (Armed Cargo Vessel) and the book was
            # blamed for an error.
            if cur is not None and (not cur or (lab & cur)):
                continue                      # the name and the reference agree
            # Only those words of the row are used that occur at all
            # in some ship's name; unknown qualifiers (e.g. "Goff only")
            # must not prevent recognition.
            known = [w for w in lab if w in by_name]
            cand = set.intersection(*[by_name[w] for w in known]) if known else set()
            if len(cand) == 1:
                new_pg = cand.pop()
                # Two different situations, and they must be told apart. If the referenced
                # page HAS a profile but of the wrong ship, the book's reference is
                # really wrong. If the page has no profile at all,
                # the book may be quite right: for example the Venerable
                # battle barge (p. 102) is a rule page "PTS: VARY", whose
                # stats depend on the chosen hull. Then the card
                # uses the book's own example ship, and the book must not be
                # blamed for an error.
                if key in ships:
                    # A flag for the regression test. The note text is cleaned
                    # off later, because telling of the book's defects does not
                    # belong on the player's card - the fix itself stays in force.
                    e["rf"] = 1
                    e["nt"] = ("Source page reference is wrong: the book prints "
                               "pg. %s, but %s is on pg. %s. Corrected by name."
                               % (e["r"], ships[new_pg]["nm"].title(), new_pg))
                else:
                    e["nt"] = ("The book's pg. %s has no stat profile for this "
                               "entry; this card uses %s on pg. %s."
                               % (e["r"], ships[new_pg]["nm"].title(), new_pg))
                e["r"] = int(new_pg)
                ref_fixed += 1
            elif key in ships:
                e["nt"] = ("Source page reference pg. %s points at %s, which does not "
                           "match this entry. Check the book before using this card."
                           % (e["r"], ships[key]["nm"].title()))
                e["badref"] = 1
                ref_flagged += 1

print("page references fixed by name: %d, flagged as suspicious: %d"
      % (ref_fixed, ref_flagged))

# A shared profile, the wrong faction on the card.
#
# The book prints on the Chaos lists "Vengeance class grand cruiser (pg. 58)",
# although the Chaos section has the same profile on page 270. The reference is the book's own
# cross reference to a shared profile, not a misprint - but on the card it produces
# the subtitle "Imperial Navy" in a Chaos fleet and steers the player to the wrong
# section. It is pointed to the faction's own printing if and only if the profiles
# are identical.
FACTION_WORDS = [
    ("CHAOS", "chaos"), ("IMPERIAL NAVY", "imperial navy"),
    ("SPACE MARINE", "space marine"), ("ELDAR", "eldar"), ("DARK ELDAR", "dark eldar"),
    ("ORK", "ork"), ("TAU", "tau"), ("NECRON", "necron"), ("TYRANID", "tyranid"),
    ("ADEPTUS MECHANICUS", "adeptus mechanicus"), ("ROGUE TRADER", "rogue trader"),
    ("INQUISITION", "inquisition"),
]


def _fleet_match(profile_fleet, list_name):
    """Does the profile's faction match the list's name."""
    fl = str(profile_fleet or "").upper()
    ln = str(list_name or "").lower()
    return any(pat in fl and word in ln for pat, word in FACTION_WORDS)


def _profile_key(sh):
    """A key by which two profiles are the same ship: stats and armament."""
    return (sh.get("sp"), sh.get("tn"), sh.get("sh"), sh.get("ar"),
            sh.get("tu"), sh.get("hp"),
            tuple(tuple(a) for a in (sh.get("aw") or [])))


_by_title = {}
for _pg, _sh in ships.items():
    _by_title.setdefault(norm_title(_sh.get("nm")), []).append(_pg)

faction_repointed = 0
for Lx in lists_out:
    for sec in Lx["secs"]:
        for e in sec["ents"]:
            if not e.get("r"):
                continue
            cur = ships.get(str(e["r"]))
            if not cur or _fleet_match(cur.get("fl"), Lx["nm"]):
                continue
            twins = [p for p in _by_title.get(norm_title(cur.get("nm")), [])
                     if p != str(e["r"])
                     and _fleet_match(ships[p].get("fl"), Lx["nm"])
                     and _profile_key(ships[p]) == _profile_key(cur)]
            if len(twins) != 1:
                continue
            new_pg = twins[0]
            e["nt"] = ("The book cross-references the %s printing on pg. %s; this is "
                       "the identical %s printing on pg. %s."
                       % (str(cur.get("fl") or "").title(), e["r"],
                          str(ships[new_pg].get("fl") or "").title(), new_pg))
            e["r"] = int(new_pg)
            faction_repointed += 1

print("pointed to the faction's own printing: %d" % faction_repointed)

# The Tau configurations are added only after the page references' name check:
# otherwise the several names of the same hull would make the automatic correction of the book's
# wrong references ambiguous on purpose.
for base, variants in TAU_CONFIGS.items():
    if base not in ships:
        continue
    original = ships[base]
    root_name = original["nm"]
    for spec in variants:
        key, label = spec[0], spec[1]
        if key == base:
            target = original
        else:
            target = copy.deepcopy(original)
            ships[key] = target
        target["nm"] = "%s — %s CONFIGURATION" % (root_name, label.upper())
        if len(spec) > 2:
            target["aw"] = spec[2]
        if key == "472c":
            target["pg"] = 473

# One generic list row becomes choosable configurations. The price and
# every section/count rule of the list stay the same for every alternative.
for Lx in lists_out:
    for sec in Lx["secs"]:
        expanded = []
        for e in sec["ents"]:
            variants = TAU_CONFIGS.get(str(e.get("r")))
            if not variants:
                expanded.append(e)
                continue
            for spec in variants:
                ne = copy.deepcopy(e)
                ne["r"] = int(spec[0]) if spec[0].isdigit() else spec[0]
                ne["l"] = "%s — %s configuration" % (e["l"], spec[1])
                expanded.append(ne)
        sec["ents"] = expanded

# The Xenos Vessel variants for the same row. Done after the Tau and with the same
# pattern: the price and the section's count rules stay with every alternative.
_xenos_base = XENOS_VARIANTS.get("184", [])
if _xenos_base:
    _sr = (ships.get("184") or {}).get("sr") or ""
    assert XENOS_SOURCE in _sr, (
        "the Xenos variants' source sentence is not in the SPECIAL block of page 184 - "
        "the expansion is not made by guessing")
    for _key, _label in _xenos_base:
        assert _key in ships, "Xenos variant %s is missing from the profiles" % _key
        assert ships[_key].get("bp") == ships["184"].get("bp"), (
            "Xenos variant %s does not cost the same as the generic one" % _key)

xenos_rows = 0
for Lx in lists_out:
    for sec in Lx["secs"]:
        expanded = []
        for e in sec["ents"]:
            variants = XENOS_VARIANTS.get(str(e.get("r")))
            if not variants:
                expanded.append(e)
                continue
            for key, label in variants:
                ne = copy.deepcopy(e)
                ne["r"] = int(key)
                if label:
                    ne["l"] = "%s - %s" % (e["l"], label)
                    ne["nt"] = ("Named Xenos Vessel variant from pg. %s: same 50 "
                                "points, with one xenotech system already chosen."
                                % key)
                    xenos_rows += 1
                expanded.append(ne)
        sec["ents"] = expanded

print("Xenos variant rows added: %d" % xenos_rows)

# Weapon swap options into armament table rows.
sw_ok, sw_skip = swaps.annotate(ships)
print("weapon swaps parsed: %d, left as text: %d"
      % (len(sw_ok), len(sw_skip)))
for pg, nm, t, why in sw_skip:
    print("   stays text: pg. %s %s (%s)" % (pg, nm.title(), why))

# A page reference without a ship profile is not a ship row.
#
# "Auxiliary vessels (pg. 191)" and "Ghostship (pg. 306)" point to
# rule pages, not profiles: the former says escorts may be picked from the allied
# fleet, the latter is about the Eldar ghost ships.
# The reference is cleared before classification, so that they become fleet upgrades
# and not buyable ships - otherwise the app would offer a row that makes
# no card at all.
noprofile = 0
for Lx in lists_out:
    for sec in Lx["secs"]:
        for e in sec["ents"]:
            if not e.get("r") or str(e["r"]) in ships:
                continue
            e["nt"] = ((e.get("nt") + " ") if e.get("nt") else "") + (
                "The book points at pg. %s, which is a rules page rather than "
                "a ship profile." % e["r"])
            e["r"] = None
            noprofile += 1

print("references without a profile cleared: %d" % noprofile)

# Classifying rows into units and upgrades, and adding the priced upgrades left
# in the book's body text as choosable rows.
up_added, up_skipped, up_warn = upgrades.annotate(lists_out, raw_rules, raw_pages)

print("upgrade rows added from prose: %d, source sentence did not match: %d"
      % (up_added, up_skipped))
for w in up_warn:
    print("   VAROITUS:", w)

# Curated conditions for list rows the book limits but that have no
# source sentence in upgrades.py's EXTRA table. Exactly one hit per row.
UP_CONDS = [
    # p.307: "Ghostships may not be armed with launch bays", "may not contain
    # Aspect Warrior fighting crews"; p.318 "Any capital ship ... may be
    # upgraded to a Ghostship". Bays offered = bays in the armament.
    ("Eldar — Iyanden Craftworld", "Ghostship",
     dict(cap=1, no=r"launch bay", noup=r"aspect warrior host")),
    # p.318 "Any capital ship in the fleet may be equipped with Aspect
    # Warriors"; p.307 not for a Ghostship.
    ("Eldar — Iyanden Craftworld", "Aspect Warrior Host",
     # p.329: the Flame of Asuryan's crew "count as an Aspect Warrior
     # fighting crew" already in the price (spot check 12 row 34).
     dict(cap=1, noup=r"^ghostship", nmno=r"^flame of asuryan")),
]
for _ln, _lab, _cond in UP_CONDS:
    _hits = [e for L in lists_out if L["nm"] == _ln
             for s in L["secs"] for e in s["ents"] if e.get("k") == "up" and e["l"] == _lab]
    assert len(_hits) == 1, "UP_CONDS: %s / %s hit %d times" % (_ln, _lab, len(_hits))
    _hits[0]["cond"] = dict(_hits[0].get("cond") or {}, **_cond)

# "Auxiliary vessels (pg. 191) ... varies" is a list rule (half of the escorts
# from the list of the fleet they escort), not a 0 pts upgrade bought for an escort.
# The row is the last of its section, so the at references of other rows do not move.
# Spot check 4 (10.9.2026), rows 13/27.
_aux = 0
for L in lists_out:
    for s in L["secs"]:
        for _i, e in enumerate(s["ents"]):
            if e.get("k") == "up" and e["l"] == "Auxiliary vessels":
                assert _i == len(s["ents"]) - 1, "Auxiliary vessels is not the section's last row: %s" % L["nm"]
                s["ents"].pop()
                _aux += 1
                break
assert _aux == 2, "2 Auxiliary vessels rows expected, %d removed" % _aux

# p.227: "Any Daemon ship may have a single Mark of Chaos with the same
# effects and cost in points as described on pg. 232." The Black Crusade list's
# DAEMON SHIPS section does not repeat the sentence, so the rows are added by hand at the p.232
# prices; condition: a Daemon ship taken. Nurgle's Mark +1 Damage Point (p.232).
# Spot check 5, row 43.
_BC_MARKS = [("The Mark of Slaanesh", 25, {}), ("The Mark of Khorne", 20, {}),
             ("The Mark of Tzeentch", 30, {}), ("The Mark of Nurgle", 35, dict(mod=dict(hp=1)))]
_bc = [L for L in lists_out if L["nm"] == "Chaos — Black Crusade"]
assert len(_bc) == 1, "the Black Crusade list is not found"
_bcsec = [s for s in _bc[0]["secs"] if s["t"].strip().upper() == "DAEMON SHIPS"]
assert len(_bcsec) == 1, "Black Crusade: the DAEMON SHIPS section is not found exactly once"
for _lab, _p, _extra in _BC_MARKS:
    assert not any(e["l"] == _lab for e in _bcsec[0]["ents"]), "Black Crusade DAEMON SHIPS: %s already exists" % _lab
    _bcsec[0]["ents"].append(dict(dict(l=_lab, r=None, p=_p, a=1, u=1, mx=None, k="up", grp="mark",
                                       src_page=227, cond=dict(cap=1, up=r"^daemonship:"),
                                       nt="Fleets pg. 227: any Daemon ship may have a single Mark of Chaos "
                                          "at the cost on pg. 232."), **_extra))

# p.234: "Remember, a ship with a Chaos Space Marine crew may have a Mark of
# Chaos, even if a Warmaster or Lord does not captain it, but is subject to the
# restriction on pg. 225." The list's crew has no named legion, so
# the p.225 Black Legion row ("May have any one Mark"); prices from the p.234 Marks.
# Spot check 11, rows 15 and 88.
_BC_CREW_MARKS = [("The Mark of Slaanesh", 25, {}), ("The Mark of Khorne", 20, {}),
                  ("The Mark of Tzeentch", 25, {}), ("The Mark of Nurgle", 35, dict(mod=dict(hp=1)))]
_bccrew = [s for s in _bc[0]["secs"] if s["t"].strip().upper() == "CHAOS SPACE MARINE CREWS"]
assert len(_bccrew) == 1, "Black Crusade: the CHAOS SPACE MARINE CREWS section is not found exactly once"
for _lab, _p, _extra in _BC_CREW_MARKS:
    assert not any(e["l"] == _lab for e in _bccrew[0]["ents"]), "Black Crusade CSM CREWS: %s already exists" % _lab
    _bccrew[0]["ents"].append(dict(dict(l=_lab, r=None, p=_p, a=1, u=1, mx=None, k="up", grp="crewmark",
                                        src_page=234, cond=dict(cap=1, up=r"^chaos space marine crew$"),
                                        nt="Fleets pg. 234: a ship with a Chaos Space Marine crew may have "
                                           "one Mark of Chaos, subject to its Legion (pg. 225)."), **_extra))

# Narrative and scenario sentences off the commander card's section text, which
# RULEY lets through ("must", "only"). The sentence is removed from the text and
# the owner table at the same place. Exactly one hit per sentence.
DROP_LIST_TEXT = [
    # p.140: the Istvaanists and the Xeno Hybrists are narrative.
    ("The Emperor's Inquisition", "ORDO XENOS INQUISITORS", "While Inquisitors of this Ordo know they must be fully cognizant"),
    # p.141: when an inquisitor is called is narrative; the following
    # "The enemy Xenos fleet adds D6x50 points" is a rule and stays.
    ("The Emperor's Inquisition", "ORDO XENOS INQUISITORS", "An Ordo Xenos Inquisitor will only be called when"),
]
for _ln, _st, _frag in DROP_LIST_TEXT:
    _secs = [s for L in lists_out if L["nm"] == _ln for s in L["secs"] if s["t"].strip() == _st]
    assert len(_secs) == 1, "DROP_LIST_TEXT: section %s / %s hit %d times" % (_ln, _st, len(_secs))
    _s = _secs[0]
    _idx = [i for i, t in enumerate(_s.get("text") or []) if t.startswith(_frag)]
    assert len(_idx) == 1, "DROP_LIST_TEXT: sentence %r hit %d times" % (_frag, len(_idx))
    _i = _idx[0]
    del _s["text"][_i]
    if _s.get("own") and len(_s["own"]) > _i:
        del _s["own"][_i]
    if _s.get("ownx"):
        _s["ownx"] = [j - 1 if j > _i else j for j in _s["ownx"] if j != _i]

# A list row's note states the rule, not the book's defects. Two
# transformations, both must hit at least once.
NOTE_DROP = [
    r"^Source misprint:",
    r"^Source page reference is wrong:",
    r"^The book's pg\. \d+ has no stat profile for this entry;",
    r"^The book's price on pg\. \d+ is unreadable",
    r"^The book points at pg\. \d+, which is a rules page",
    r"^The book cross-references the Imperial Navy printing on pg\.",
]
# "... : “lose sentence”" -> the bare sentence
NOTE_UNWRAP = [
    r"The book prints this only in the section text:\s*",
    r"The book states this in the shared fleet rules:\s*",
]
_NOTE_HITS = collections.Counter()
_NOTE_DEDUPED = [0]


def clean_note(nt, shown):
    """shown = comparison forms of the sentences already visible on the list."""
    if not nt:
        return nt
    t = nt.strip()
    for rx in NOTE_DROP:
        if re.search(rx, t):
            _NOTE_HITS[rx] += 1
            return None
    for rx in NOTE_UNWRAP:
        m = re.search(rx, t)
        if not m:
            continue
        _NOTE_HITS[rx] += 1
        head = t[:m.start()].strip()
        rest = t[m.end():].strip()
        # The book's sentence is in quotation marks; they are peeled off.
        if rest.startswith("\u201c") and rest.endswith("\u201d"):
            rest = rest[1:-1].strip()
        rest = re.sub(r"\s*\.{3,}\s*", " ", rest).strip()
        # A quoted sentence is dropped if it already shows in the list's text:
        # otherwise the same content would appear twice in a row.
        if rest and _nkey(rest) in shown:
            _NOTE_DEDUPED[0] += 1
            rest = ""
        t = (head + " " + rest).strip() if head else rest
        break
    t = re.sub(r"\s*\.{3,}\s*", " ", t).strip()
    if t and _nkey(t) in shown:
        _NOTE_DEDUPED[0] += 1
        return None
    return t or None


for Lx in lists_out:
    shown = set()
    for sec in Lx["secs"]:
        for x in sec["text"]:
            k = _nkey(x)
            if k:
                shown.add(k)
    for sec in Lx["secs"]:
        for e in sec["ents"]:
            if e.get("nt"):
                e["nt"] = clean_note(e["nt"], shown)

_missing = [rx for rx in NOTE_DROP + NOTE_UNWRAP if not _NOTE_HITS[rx]]
assert not _missing, "a note pattern never hit: %s" % _missing
print("notes cleaned: %d removed, %d peeled, %d repeats off"
      % (sum(_NOTE_HITS[rx] for rx in NOTE_DROP),
         sum(_NOTE_HITS[rx] for rx in NOTE_UNWRAP), _NOTE_DEDUPED[0]))

# A sentence that STARTS with a priced row belongs to THAT row, not to
# the previous one. On the book's page the row is the heading of the description
# after it; if the row stayed in the body text, ownership went to the previous one.
# This happened in the Grey Knights FLEET COMMANDER section: the dearer
# commander's boarding and hit-and-run bonuses ended up on the cheaper
# commander's card. Runs only now, because some rows are born in
# the prose extraction.
PRICE_HEAD = re.compile(r"^\s*(.{3,60}?)\s*\.{2,}\s*\+?[\d,]+\s*"
                        r"(?:pts|points)\b")
for Lx in lists_out:
    for sec in Lx["secs"]:
        own = sec.get("own")
        if not own:
            continue
        labels = [str(e.get("l") or "") for e in sec["ents"]]
        for i, t in enumerate(sec["text"]):
            m = PRICE_HEAD.match(t)
            if not m:
                continue
            hit = next((lab for lab in labels
                        if lab and _nkey(lab) == _nkey(m.group(1))), None)
            if not hit or own[i] == hit:
                continue
            was = own[i]
            ownx = sec.setdefault("ownx", [])
            for j in range(i, len(own)):
                if own[j] != was:
                    break
                own[j] = hit
                ownx.append(j)
                _OWN_REOWNED[0] += 1

print("ownership moved by the priced row: %d sentences"
      % _OWN_REOWNED[0])

# Foreign sections out. This is the last phase, because the Clanz list's
# Gubbins and clan rows are read from exactly these Waaagh! list sections.
for Lx in lists_out:
    keep = []
    for sec in Lx["secs"]:
        drop = next((fx for fx in DROP_SECS
                     if fx["list_has"] in Lx["nm"] and sec["t"] == fx["sec"]), None)
        if drop:
            drop["_used"] = drop.get("_used", 0) + 1
            continue
        keep.append(sec)
    Lx["secs"] = keep

_unused = [(fx["list_has"], fx["sec"], fx.get("_used", 0))
           for fx in DROP_SECS if fx.get("_used") != 1]
assert not _unused, "a foreign section removal did not hit exactly once: %s" % _unused
print("foreign sections removed: %d" % len(DROP_SECS))

# The removal moves every section index after it. Checked at once.
check_section_names(lists_out, "after section removal", stamp_new=False)

assert _INHERITED, "no list inherited the faction's shared rules"
print("faction shared rules inherited by %d lists" % len(_INHERITED))

    # Item 8: late rule fixes. A sentence may have come into a section only
    # by inheriting the faction's shared rules (Tyranids Hive Fleet), so it
    # is looked for in the final section text.
for Lx in lists_out:
    secs = Lx["secs"]
    _ftitles = [x["t"] for x in secs]
    for fx in RULE_PICKS:
        if fx["list_has"] not in Lx["nm"] or not fx.get("late"):
            continue
        _sec = [x for x in secs if x["t"].strip().lower() == fx["sec"].strip().lower()]
        assert len(_sec) == 1, "%s: late section %r is not found exactly once" % (Lx["nm"], fx["sec"])
        _sec = _sec[0]
        _hit = [t for t in _sec["text"] if fx["from_text"] in t]
        assert len(_hit) == 1, ("%s / %s: late text sentence %r hit %d times"
                                % (Lx["nm"], fx["sec"], fx["from_text"], len(_hit)))
        if not fx.get("keep_text"):
            _sec["text"] = [t for t in _sec["text"] if t not in _hit]
            if _sec.get("own"):
                _sec["own"] = [o for t, o in zip(_sec["text"] + _hit, _sec["own"]) if t not in _hit] if len(_sec["own"]) == len(_sec["text"]) + len(_hit) else _sec["own"]
        _where = "%s / %s (late)" % (Lx["nm"], fx["sec"])
        for rule in (fx.get("rules") or [fx["rule"]]):
            r = dict(rule, src=fx["src"], ok=True)
            for k in list(r):
                if k == "pick" or k.endswith("_pick"):
                    r[k] = [dict((kk, vv) for kk, vv in q.items() if kk != "_t")
                            for q in pick_secs(r[k], _ftitles, _where)]
            if "exempt" in r and "cond_pick" in r["exempt"]:
                r["exempt"] = dict(r["exempt"], cond_pick=[dict((kk, vv) for kk, vv in q.items() if kk != "_t")
                                                            for q in pick_secs(r["exempt"]["cond_pick"], _ftitles, _where)])
            if "allow_pick" not in r and "sec" not in r:
                r["sec"] = [secs.index(_sec)]
            _sec["rules"].append(r)
        fx["_used"] = fx.get("_used", 0) + 1

# Item 8: upgrade section name -> index only now, when annotate has created
# the sections (the Tyranids' BIO-ENHANCEMENTS). The heading must be found exactly once.
_UP_SEC_OK = 0
for _L in lists_out:
    _tt = [x["t"].strip().lower() for x in _L["secs"]]
    for _sec in _L["secs"]:
        for _r in _sec.get("rules") or []:
            if isinstance(_r.get("up_sec"), str):
                _idx = [i for i, t in enumerate(_tt) if t == _r["up_sec"].strip().lower()]
                assert len(_idx) == 1, "%s: upgrade section %r is not found exactly once (sections: %s)" % (_L["nm"], _r["up_sec"], _tt)
                _r["up_sec"] = _idx[0]
                _UP_SEC_OK += 1
print("rules tied to upgrade sections: %d" % _UP_SEC_OK)


assert _HEAD_SQ_USED[0] >= 1, \
    "a skwadron-size heading never hit: %s" % HEAD_IS_SQUADRON
print("heading numbers read as skwadron sizes: %d" % _HEAD_SQ_USED[0])

assert upgrades._SEC_GROUP_HITS[0] >= 1,     "a per-section exclusive group never hit"
print("per-section exclusive rows: %d" % upgrades._SEC_GROUP_HITS[0])

assert upgrades._ONE_WEAPON_HITS[0] >= 1, \
    "a one-weapon group never hit"
print("one-weapon choices grouped: %d" % upgrades._ONE_WEAPON_HITS[0])

assert upgrades._HULL_PRICE_HITS[0] >= 1, \
    "the ship class price list never hit"
print("ship class price list rows attached: %d" % upgrades._HULL_PRICE_HITS[0])
# Nurgle (4 classes), Khorne (3) and Slaanesh (4): "must take the Mark of X,
# which is already included in the cost" (p.241, 245, 249). Tzeentch and
# Black Crusade do not include the Mark.
print("list upgrade effects: %d, escort versions: %d" % (len(upgrades._ROW_EFFECT_LOG), upgrades._ESC_SPLIT_HITS[0]))
assert upgrades._ESC_SPLIT_HITS[0] == 3, "3 escort versions expected"
assert upgrades._DEATHSKULLZ_HITS[0] == 5, "5 Deathskullz copies expected, found %d" % upgrades._DEATHSKULLZ_HITS[0]
assert upgrades._BIO_EACH_HITS[0] == 8, "8 bio multiples expected, found %d" % upgrades._BIO_EACH_HITS[0]
assert upgrades._ROW_COND_HITS[0] == 20, "20 ROW_CONDS hits expected, found %d: %r" % (upgrades._ROW_COND_HITS[0], upgrades._ROW_COND_LOG)
assert upgrades._HULK_GUBBIN_HITS[0] == 13, "13 hulk Gubbins copies expected, found %d" % upgrades._HULK_GUBBIN_HITS[0]
assert upgrades._HULK_PF_HITS[0] == 1, "1 Waaagh! hulk Extra Power Fields row expected, found %d" % upgrades._HULK_PF_HITS[0]
assert upgrades._MULTI_MARK_HITS[0] == 4, "4 Incursion Warmaster Mark rows expected, found %d" % upgrades._MULTI_MARK_HITS[0]
assert upgrades._MARK_INC_HITS[0] == 11, \
    "11 Daemonship rows with an included Mark expected, found %d" % upgrades._MARK_INC_HITS[0]

# Every hand-written rule fix must hit exactly once.
# If the source text changes, the fix stops hitting silently - and then
# a wrong check would come back unnoticed.
_unused = [(fx["list_has"], fx["sec"], fx.get("_used", 0))
           for fx in RULE_PICKS if fx.get("_used") != 1]
assert not _unused, "a rule fix did not hit exactly once: %s" % _unused
print("rule fixes applied: %d" % len(RULE_PICKS))
print("pick references checked: %d" % _PICKS_OK[0])
assert _OWN_HITS[0] >= 1, "no sentence was tied to a row"
print("sentences tied to a list row: %d" % _OWN_HITS[0])

_unused = [(fx["list_has"], fx["sec"], fx.get("_used", 0))
           for fx in ENTRY_ADDS if fx.get("_used") != 1]
assert not _unused, "a list row addition did not hit exactly once: %s" % _unused
print("list rows added by hand: %d" % len(ENTRY_ADDS))

_unused = [(fx["list_has"], fx["sec"], fx.get("_used", 0))
           for fx in ENTRY_LIMITS if fx.get("_used") != 1]
assert not _unused, "a row count limit did not hit exactly once: %s" % _unused
print("row limits set by hand: %d" % len(ENTRY_LIMITS))

_unused = [(fx["list_has"], fx["sec"], fx.get("_used", 0))
           for fx in LORE_SECTIONS if fx.get("_used") != 1]
assert not _unused, "a lore section did not hit exactly once: %s" % _unused
print("narrative sections removed: %d" % len(LORE_SECTIONS))

# Option effects into the data.
for _pg, _sh in ships.items():
    for _o in _sh.get("ol") or []:
        for (_p, _frag), _eff in OPT_EFFECTS.items():
            if str(_p) != str(_pg) or _frag not in _o.get("t", ""):
                continue
            _o.update(copy.deepcopy(_eff))
            _OPT_EFFECT_HITS[(_p, _frag)] = _OPT_EFFECT_HITS.get((_p, _frag), 0) + 1
_miss = [k for k in OPT_EFFECTS if _OPT_EFFECT_HITS.get(k) != 1]
assert not _miss, "an option effect did not hit exactly once: %s" % _miss
print("option effects attached: %d" % len(OPT_EFFECTS))
assert _TURNS_FIXED[0] == 1, "TURNS without a degree sign: %d (expected 1, p.181)" % _TURNS_FIXED[0]

# --- P1-4: Venerable battle barge = choice of base hull (Fleets p.102) -----
# "chosen from any available Imperial or Chaos battleship, grand cruiser,
# battlecruiser or heavy cruiser at the listed cost, plus an additional
# +35 points for its Space Marine crew." The row gets a flag and a hull list;
# the default hull stays p.103 (Seditio Opprimere), so that an old save opens.
_HULL_SECS = re.compile(r"battleship|grand cruiser|battlecruiser|heavy cruiser", re.I)
_hull_pages = set()
for _L in lists_out:
    if not re.match(r"Imperial Navy|Chaos", _L["nm"]):
        continue
    for _sec in _L["secs"]:
        if not _HULL_SECS.search(_sec["t"]):
            continue
        for _e in _sec.get("ents") or []:
            _sh = ships.get(str(_e.get("r"))) if _e.get("k") == "unit" else None
            if not _sh or _sh.get("fl") not in ("IMPERIAL NAVY", "CHAOS"):
                continue
            if "," in _sh.get("nm", ""):          # a named individual, not a class
                continue
            _hull_pages.add(str(_e["r"]))
_hull_pages.add("103")                             # Seditio Opprimere itse
HULL_CHOICES = sorted(_hull_pages, key=lambda k: int(re.match(r"\d+", k).group()))
_hc_hits = 0
for _L in lists_out:
    if "Space Marines" not in _L["nm"]:
        continue
    for _sec in _L["secs"]:
        for _e in _sec.get("ents") or []:
            if str(_e.get("l", "")).strip().lower() == "venerable battle barge":
                _e["hc"] = 1
                _e["hcp"] = 35
                _e["hulls"] = HULL_CHOICES
                _hc_hits += 1
assert _hc_hits == 3, "3 Venerable battle barge rows expected, found %d" % _hc_hits
assert 20 <= len(HULL_CHOICES) <= 32, "%d hull alternatives - check the selection" % len(HULL_CHOICES)
print("venerable hull alternatives: %d" % len(HULL_CHOICES))

# --- item 7, batch 7: Lite Kroozer p.383 - one option, two alternatives -----
# "For no change in cost, they may exchange their prow heavy gunz for a
# torpedo launcha (Speed 30 cm, Strength D6) or additional D6 gunz (for
# D6+2 in total)." Two mutually exclusive swaps in one sentence;
# swaps.py does not parse the "or" structure. They are split into two options in the same
# group (gmax 1). Assault torpedoes (dep=0) still refer to the launcha,
# which stays at index 0.
if "383" in ships:
    _lk = ships["383"]
    _prow = [i for i, a in enumerate(_lk["aw"]) if a[0].lower() == "prow heavy gunz"]
    assert len(_prow) == 1, "Lite Kroozer: the prow heavy gunz row is not found unambiguously"
    assert _lk["ol"] and _lk["ol"][0]["t"].startswith("Ork Lite Kroozers are essentially"), \
        "Lite Kroozer: option 0 is not the expected prow swap"
    _rest = _lk["ol"][1:]
    _lk["ol"] = [
        dict(t="Prow — torpedo launcha instead of heavy gunz (Speed 30 cm, Strength D6)",
             c=0, var=0, grp="lite_prow", gmax=1,
             sw=dict(f=_prow, t=[["Prow torpedo launcha", "30 cm", "D6", "Front"]])),
        # "additional D6 gunz (for D6+2 in total)": the heavy gunz is swapped
        # out and the prow gunz (30 cm, 2) gets D6 more = D6+2. Before,
        # the heavy gunz row was changed to D6+2 and the prow gunz stayed at 2
        # (spot check 5, 10.9.2026, row 4).
        # Model: the heavy gunz slot gets "Prow gunz D6+2" (sw, so that
        # the group has exactly one active row) and the original
        # "Prow gunz 2" row goes (del does not touch the option's own swap row).
        dict(**{"t": "Prow — additional D6 gunz (D6+2 in total)",
                "c": 0, "var": 0, "grp": "lite_prow", "gmax": 1,
                "sw": dict(f=_prow, t=[["Prow gunz", "30 cm", "D6+2", "Front"]]),
                "del": r"^prow gunz$"}),
    ] + _rest
    for _o in _rest:
        if _o.get("dep") == 0:
            pass                                   # the launcha stays at index 0
    print("Lite Kroozer: the prow swap split into two options")

# --- item 7, batch 7: RT Exploration p.180 - "no special variants" ---------
# "Chaos vessels used as loyalist ships must be painted as such, and no
# special variants in the notes of these ships' profiles can be used. For
# example, the Tyrant can't take boosted batteries or a Nova Cannon, etc."
# The list already has its own rows Lunar/Tyrant/Carnage/Murder with prices ("as
# reflected in the fleet list"); the row gets the flag noopt, and the app keeps
# the ship's own options off.
_noopt_hits = 0
for _L in lists_out:
    if _L["nm"] != "Rogue Traders — Exploration":
        continue
    for _sec in _L["secs"]:
        for _e in _sec.get("ents") or []:
            if _e.get("k") == "unit" and str(_e.get("r")) in ("71", "69", "277", "279"):
                _e["noopt"] = 1
                _noopt_hits += 1
assert _noopt_hits == 4, "RT Exploration: 4 noopt rows expected, found %d" % _noopt_hits

# --- Spot check 18 (a book inventory): the book's buyables that were missing ---
def _text_key(t):
    """Comparison form for a section's text rows. The same sentence may come from two
    sources in different dress: the PDF extraction gives curly quotes and
    "ie", the hand-written curation straight quotes and "i.e.". Without
    normalising they look like different sentences and both stay in the section."""
    t = (t or "").lower()
    for a, b in ((u"\u2018", "'"), (u"\u2019", "'"), (u"\u201c", '"'),
                 (u"\u201d", '"'), (u"\u2013", "-"), (u"\u2014", "-"),
                 (u"\u2022", " ")):
        t = t.replace(a, b)
    t = t.replace("i.e.", "ie").replace("e.g.", "eg").replace("pg.", "pg")
    return re.sub(r"[^a-z0-9]+", " ", t).strip()


def add_text(sec, sentences):
    """Adds to a section only the sentences that are not there yet - not even
    inside another sentence (the book's bullet list and the sentence after it
    often come from the extraction as one row)."""
    have = [_text_key(x) for x in (sec.get("text") or [])]
    out = list(sec.get("text") or [])
    for t in sentences:
        k = _text_key(t)
        if not k or any(k == h or (len(k) >= 40 and k in h) for h in have):
            continue
        out.append(t)
        have.append(k)
    sec["text"] = out
    return sec


def _p18_list(nm):
    _h = [x for x in lists_out if x["nm"] == nm]
    assert len(_h) == 1, "list %r is not found exactly once" % nm
    return _h[0]


def _p18_sec(L, title):
    _h = [i for i, x in enumerate(L["secs"]) if x["t"].strip().lower() == title.strip().lower()]
    assert len(_h) == 1, "%s: section %r is not found exactly once" % (L["nm"], title)
    return _h[0]


def _p18_unit(label, ref, pts, page, mx=None, noopt=False, nt=None):
    assert str(ref) in ships, "ship %r is missing" % ref
    e = dict(l=label, r=int(ref), p=pts, src_page=page, a=0, mx=mx, nt=nt, k="unit")
    if noopt:
        e["noopt"] = 1
    return e


# J30 p.178: "A human pirate fleet may have up to one cruiser for every 500
# points of ships in the fleet or portion thereof. A Pirate Cruiser may consist
# of a Rogue Trader cruiser or any cruiser from the Imperial or Chaos fleet
# lists worth 185 points or less. It may also include a single Space Marine
# strike cruiser! Special variants, refits and Nova Cannons cannot be used."
# Prices from the profile pages; the Bakka variants are "special variants" and do not
# belong. noopt = the ship's own options (Nova Cannon, variant swaps) off.
_PIR_SRC = ("A Pirate Cruiser may consist of a Rogue Trader cruiser or any cruiser from the Imperial or Chaos "
            "fleet lists worth 185 points or less. It may also include a single Space Marine strike cruiser! "
            "Special variants, refits and Nova Cannons cannot be used.")
_PIR_CRUISERS = [("Rogue Trader cruiser", 180, 185), ("Tyrant class cruiser", 69, 185),
                 ("Gothic class cruiser", 70, 180), ("Lunar class cruiser", 71, 180),
                 ("Endeavour class light cruiser", 72, 110), ("Endurance class light cruiser", 74, 110),
                 ("Defiant class light cruiser", 76, 120), ("Dauntless class light cruiser", 77, 110),
                 ("Carnage class cruiser", 277, 180), ("Inferno class cruiser", 278, 180),
                 ("Murder class cruiser", 279, 170), ("Slaughter class cruiser", 280, 165)]
_PL = _p18_list("Rogue Traders \u2014 Pirates and Wolf Packs")
_pc = _p18_sec(_PL, "CAPITAL SHIPS")
_pe = _p18_sec(_PL, "ESCORTS")
_pn = _p18_sec(_PL, "NOTES FROM NATE MONTES")
assert not any(e.get("r") in (71, 180) for e in _PL["secs"][_pc]["ents"]), "the pirate cruisers are already on the list"
for _lab, _ref, _pts in _PIR_CRUISERS:
    _PL["secs"][_pc]["ents"].append(_p18_unit(_lab, _ref, _pts, 178, noopt=True))
_PL["secs"][_pc]["ents"].append(_p18_unit("Space Marine Strike Cruiser", 105, 145, 178, mx=1, noopt=True))
_PL["secs"][_pc]["rules"] += [
    dict(kind="per_points", each=1, per=500, what="cruisers", label="Pirate cruisers (one per 500 pts)",
         pick=[dict(sec=_pc), dict(sec=_pn, re="^siluria")], ok=True, sec=[_pc],
         src="A human pirate fleet may have up to one cruiser for every 500 points of ships in the fleet or "
             "portion thereof."),
]
# p.179: "At least one squadron of 3-6 escort vessels must be included for
# each cruiser in the fleet" and "The number of escort vessels that utilize
# ordnance or lance weaponry may not outnumber those that rely solely on weapon
# batteries. Xenos vessels of all types don't count toward this total."
_ord, _bat = [], []
for _e in _PL["secs"][_pe]["ents"]:
    _sh = ships.get(str(_e.get("r"))) if _e.get("r") else None
    if not _sh or re.search(r"xenos", str(_e["l"]), re.I):
        continue
    _heavy = any(re.search(r"torpedo|lance|launch|bomb|nova", str(a[0]), re.I) for a in _sh["aw"])
    (_ord if _heavy else _bat).append(_e["l"])
assert _ord and _bat, ("merirosvosaattajat", _ord, _bat)
_rx = lambda labs: "^(" + "|".join(re.escape(x) for x in labs) + ")$"
_PL["secs"][_pe]["rules"] += [
    dict(kind="min_ratio", min=1, units=True, label="Escort squadrons per cruiser (at least one)",
         allow_pick=[dict(sec=_pe)], per_pick=[dict(sec=_pc), dict(sec=_pn, re="^siluria")], ok=True, sec=[_pe],
         src="At least one squadron of 3\u20136 escort vessels must be included for each cruiser in the fleet, "
             "organized in any mix desired."),
    dict(kind="compare", op="<=", a_mult=1, label="Escorts with ordnance or lances (not more than battery escorts)",
         a_pick=[dict(sec=_pe, re=_rx(_ord))], b_pick=[dict(sec=_pe, re=_rx(_bat))], ok=True, sec=[_pe],
         src="The number of escort vessels that utilize ordnance or lance weaponry may not outnumber those that "
             "rely solely on weapon batteries. Xenos vessels of all types don't count toward this total."),
]
print("  pirates: cruisers %d, ordnance/lance escorts %d, battery escorts %d"
      % (len(_PIR_CRUISERS) + 1, len(_ord), len(_bat)))

# J31 p.197: "Additionally, up to four ships in a Rogue Trader or pirate fleet
# may be Stryxis Caravan Vessels, rolling for leadership normally. They do not
# count as cruisers against their respective fleet lists, but they may not use
# any fleet re-rolls." p.196: 80 pts. A section of its own: not counted with the cruisers.
_STRYX_SRC = ("Additionally, up to four ships in a Rogue Trader or pirate fleet may be Stryxis Caravan Vessels, "
              "rolling for leadership normally. They do not count as cruisers against their respective fleet lists, "
              "but they may not use any fleet re-rolls.")
for _nm in ("Rogue Traders", "Rogue Traders \u2014 Exploration", "Rogue Traders \u2014 Pirates and Wolf Packs"):
    _L = _p18_list(_nm)
    assert not any(e.get("r") == 196 for x in _L["secs"] for e in x["ents"]), "%s: Stryxis already exists" % _nm
    _L["secs"].append(dict(t="STRYXIS CARAVAN VESSELS", rules=[], text=[_STRYX_SRC],
                           ents=[_p18_unit("Stryxis Caravan Vessel", 196, 80, 196, mx=4)]))

# J29 p.284: "Only one Activated Blackstone Fortress may be fielded for every
# FULL 750 points of other ships in a Chaos fleet. No more than three may be
# taken." The Chaos lists' menus do not name it, but the profile allows it in
# a Chaos fleet and p.288 assumes it can be chosen. The Space Hulk exclusion
# (J26) gets the section.
_BSF_SRC = ("Only one Activated Blackstone Fortress may be fielded for every FULL 750 points of other ships in a "
            "Chaos fleet. No more than three may be taken.")
_bsf = 0
for _nm in ("Chaos \u2014 Incursion", "Chaos \u2014 Black Crusade", "Chaos \u2014 Tzeentch",
            "Chaos \u2014 Nurgle", "Chaos \u2014 Khorne", "Chaos \u2014 Slaanesh"):
    _L = _p18_list(_nm)
    _others = [i for i, x in enumerate(_L["secs"]) if any(e.get("k") == "unit" and e.get("r") for e in x["ents"])]
    _i = len(_L["secs"])
    _L["secs"].append(dict(t="ACTIVATED BLACKSTONE FORTRESS", text=[_BSF_SRC],
                           ents=[_p18_unit("Activated Blackstone Fortress", 284, 750, 284, mx=3)],
                           rules=[dict(kind="per_points", each=1, per=750, full=True, what="fortresses",
                                       label="Activated Blackstone Fortress (one per FULL 750 pts of other ships)",
                                       pick=[dict(sec=_i)], of_pick=[dict(sec=j) for j in _others],
                                       ok=True, sec=[_i], src=_BSF_SRC)]))
    for x in _L["secs"]:
        for r in x.get("rules") or []:
            if str(r.get("label", "")).startswith("Chaos Space Hulk: not with the Planet Killer"):
                r["cond_pick"] = list(r["cond_pick"]) + [dict(sec=_i)]
                _bsf += 1
assert _bsf == 6, "6 Space Hulk exclusions expected, found %d" % _bsf
# p.284: "It has no crew and so does not add a D6 to its boarding score during
# a boarding action." A Chaos Space Marine crew ("Any capital ship can be
# designated as having a Chaos Space Marine crew", p.234) does not apply to it.
_csm = 0
for _L in lists_out:
    for _x in _L["secs"]:
        for _e in _x["ents"]:
            if _e.get("k") == "up" and re.search(r"chaos space marine crew$", str(_e.get("l", "")), re.I):
                _c = dict(_e.get("cond") or {})
                _c["nmno"] = (_c["nmno"] + "|" if _c.get("nmno") else "") + "^activated blackstone"
                _e["cond"] = _c
                _csm += 1
assert _csm == 5, "5 Chaos Space Marine crew rows expected, found %d" % _csm
# The card's rule box: the list sentence is now a check (J29), the warp cannons part is
# covered by the domain.js rule, and the Super-Mega-Death Shot is condensed following the book's
# wording (the same procedure as p.480/472). Otherwise the damage box
# drops below the 4.2 pt print floor.
_bs = ships["284"]
for _need in ("Only one Activated Blackstone Fortress may be fielded", "Super-Mega-Death Shot",
              "It has no crew", "warp cannons roll 1 dice per point of Strength"):
    assert _need in _bs["sr"], "p.284: the expected passage is missing: %r" % _need
_bs["sr"] = (
    "\u2022 A Blackstone Fortress cannot go onto special orders but is assumed to automatically pass all other "
    "Leadership tests it is required to make. "
    "\u2022 The Blackstone Fortress can move up to 10 cm in any direction in the movement phase: it does not turn "
    "like a normal ship. "
    "\u2022 It has no crew and so does not add a D6 to its boarding score during a boarding action. "
    "\u2022 Super-Mega-Death Shot (not while crippled): after two turns without moving or firing it stays still "
    "and fires in the next shooting phase - trace a straight line 90 cm from its stem with the Nova Cannon "
    "template. Any ship, friend or foe, whose stem touches the template takes 8 lance shots ignoring shields and "
    "similar mechanisms; a ship whose stem touches the centre is destroyed. In Exterminatus, from the low orbit "
    "table, the planet is destroyed on a 2+. Up to three Fortresses never further apart than the template's "
    "diameter may combine the shot: each extra Fortress adds 90 cm of range and 8 lance shots. While charging, "
    "ordnance and escorts touching the area between them are destroyed; a capital ship touching it takes 8 lance "
    "shots per charging Fortress (no shields, no Brace), and each Fortress then takes D6 hits, cannot move or "
    "shoot next turn and must recharge.")
# J33 p.390: "Hulks cannot take any upgrade that improves Boarding Value,
# Turning or Speed." Of the Da Ork Clanz clans, Evil Sunz ("+5 cm speed") does not suit
# a hulk. Goffs ("+1 bonus to the dice roll during boarding actions") does:
# a die modifier is not boarding value, and the same page allows the matching Warlord
# upgrade ("Mega-armoured Boarding Parties is unchanged"). Spot check 19
# round 3 (T15) corrected the earlier Goffs ban.
_clh = 0
for _L in lists_out:
    if _L["nm"] != "Orks \u2014 Da Ork Clanz":
        continue
    for _x in _L["secs"]:
        for _e in _x["ents"]:
            if _e.get("k") == "up" and re.match(r"^Clan: Evil Sunz\b", str(_e.get("l", ""))):
                _c = dict(_e.get("cond") or {})
                _c["nmno"] = (_c["nmno"] + "|" if _c.get("nmno") else "") + "hulk"
                _e["cond"] = _c
                _clh += 1
assert _clh == 1, "Clanz: 1 Evil Sunz row expected, found %d" % _clh

for _sh in ships.values():
    _f = SHIP_FL_FIX.get(_sh.get("fl"))
    if _f:
        _sh["fl"] = _f
        _FL_FIXED[0] += 1
assert _FL_FIXED[0] >= 1, "the faction spelling fix never hit"
print("faction spellings fixed: %d" % _FL_FIXED[0])

# ---- Commanders in structure (P1-8e, packages/rules/CONTRACT.md) ------------
# Leadership is read from the row heading "(Ld 8)" / "(Ld +1)" / "(+2 Ld)" or from the row's
# OWN text "adds +1 to its leadership (max 10)"; a fixed value and a
# modifier are different concepts. Rows the book gives no value for are acknowledged
# in reference/commanders.json with their pages - no text is parsed at run time.
# Re-rolls: the included number from the text ("Admirals get one ... re-roll
# included"), bought re-roll rows get the count from their heading.
import re as _re3
_LD_LABEL = _re3.compile(r"\((?:Ld\s*([+-]?\d+)|([+-]\d+)\s*Ld)\)", _re3.I)
_LD_OWN = _re3.compile(r"adds?\s*\+\s*(\d)\s*to\s*(?:its|the ship'?s)?\s*leadership(?:\s*\(max\.?\s*(\d+)\))?", _re3.I)
_LD_MAX = _re3.compile(r"(?:maximum of|max\.?)\s*(\d+)", _re3.I)
# p.40 (Armageddon): "Your fleet commander gets a single re-roll included in
# his points cost" - "a single" is the same as "one" (spot check 8: the Master of
# the Fleet's and the admirals' re-roll total was one too small).
_RR_INC = _re3.compile(r"\b(?:gets?|has|have|receives?)\s+(?:one|1|a single)\s+(?:fleet commander\s+)?re-?roll", _re3.I)
_RR_N = {"one": 1, "two": 2, "three": 3, "four": 4}
_cref_path = os.path.join(_HERE, "..", "reference", "commanders.json")
_cref = json.load(io.open(_cref_path, encoding="utf-8")) if os.path.exists(_cref_path) else {"commanders": []}
_cref_by = {(r["list"], r["label"]): r for r in _cref.get("commanders", [])
            if r.get("verified") is True and isinstance(r.get("page"), int)}
_cmd_missing, _cmd_n, _cmd_ld, _rr_rows = [], 0, {"fixed": 0, "modifier": 0, "none": 0}, 0
_rrq = []
for _L in lists_out:
    for _si, _sec in enumerate(_L["secs"]):
        _own, _txt = _sec.get("own") or [], _sec.get("text") or []
        _sectext = " ".join(_txt)
        for _e in _sec.get("ents") or []:
            if _e.get("k") == "up":
                if _re3.search(r"re-?rolls?", _e["l"], _re3.I):
                    # The count may also be after the name in brackets:
                    # "Aun'O (two extra re-rolls)" (p.454) is two re-rolls.
                    _m = _re3.search(r"\b(one|two|three|four)\b(?:\s+\w+){0,2}\s+re-?rolls?", _e["l"], _re3.I)
                    _e["rr"] = _RR_N[_m.group(1).lower()] if _m else 1
                    _rr_rows += 1
                elif _re3.match(r"\s*the mark of tzeentch\b", _e["l"], _re3.I):
                    # p.236 "The vessel ... gains +1 re-roll", p.232 "The Chaos
                    # Lord gains a re-roll": Mark of Tzeentch on re-roll.
                    _e["rr"] = 1
                    _rr_rows += 1
                continue
            if _e.get("k") != "cmd":
                continue
            _cmd_n += 1
            _owntext = " ".join(t for o, t in zip(_own, _txt) if o == _e["l"])
            _ld = None
            _m = _LD_LABEL.search(_e["l"])
            if _m:
                _v = _m.group(1) or _m.group(2)
                _ld = dict(kind="modifier" if _v[0] in "+-" else "fixed", value=int(_v))
            else:
                # the row's own text; if the section has only this one commander,
                # the section's lead sentence belongs to it unambiguously (Ordo
                # Xenos p.141: "The ship adds +1 to its leadership (max. 10)")
                _alone = sum(1 for x in (_sec.get("ents") or []) if x.get("k") == "cmd") == 1
                _m2 = _LD_OWN.search(_owntext) or (_alone and _LD_OWN.search(_sectext))
                if _m2:
                    _ld = dict(kind="modifier", value=int(_m2.group(1)))
            if _ld and _ld["kind"] == "modifier":
                _mx = _LD_MAX.search(_owntext) or _LD_MAX.search(_sectext)
                if _mx:
                    _ld["max"] = int(_mx.group(1))
            _r = _cref_by.get((_L["nm"], _e["l"]))
            if _r is not None and "leadership" in _r:
                _ld = _r["leadership"]
            if _ld is None and _r is None:
                _cmd_missing.append("%s / %s" % (_L["nm"], _e["l"]))
            _e["ld"] = _ld
            _inc = 1 if _RR_INC.search(_owntext + " " + _sectext) else 0
            if _r is not None and "rerolls_included" in _r:
                _inc = _r["rerolls_included"]
            _e["rr"] = _inc
            # The book's own scope for an included re-roll (user 5.10.2026):
            # whose rolls (scope) or how often (unit, Abaddon "per
            # turn" p.231). Only rows acknowledged in the reference with their pages.
            _q = dict((k, _r["rerolls_" + k]) for k in ("scope", "unit")
                      if _r is not None and _r.get("rerolls_" + k))
            if _q:
                # The scope may also concern only a bought re-roll: Chaos Lord
                # "which he can use for his own ship or squadron only" (p.234).
                _q["pg"] = _r["page"]
                _e["rrq"] = _q
                _rrq.append("%s / %s" % (_L["nm"], _e["l"]))
            _cmd_ld[_ld["kind"] if _ld else "none"] += 1
assert not _cmd_missing, "a commander has no leadership (record it in reference/commanders.json): %s" % _cmd_missing
print("commanders %d: Ld %s; re-roll rows %d" % (_cmd_n, _cmd_ld, _rr_rows))
# Veteran Captain p.38, Veteran Rogue Trader p.174 and p.176, Abaddon p.234,
# Farseers p.318, Clanz Warlord p.372; review 5.10.2026: Pirate Captain
# p.178 and the Chaos Lords p.234, 236, 240, 244, 248 (the scope of a bought re-roll).
assert len(_rrq) == 12, "12 re-roll scopes expected, found %d: %s" % (len(_rrq), _rrq)

# p.453 Kor'O'Mesme: "Re-rolls: 2". The section's general sentence "The commander has one
# re-roll included in his points cost." (p.456) does not hold for him, but
# the commander card printed both: two different numbers on the same card
# (review 5.10.2026). The sentence stays on Kor'el's and Kor'O's cards; Mesme's
# row records that it is not printed (domain.js commanderRules).
_mesme = 0
for _L in lists_out:
    if _L["nm"] != "Tau \u2014 Commerce Protection":
        continue
    for _sec in _L["secs"]:
        for _e in _sec.get("ents") or []:
            if _e.get("k") == "cmd" and "Mesme" in _e["l"]:
                _one = [_t for _t in _sec.get("text") or [] if _t == "The commander has one re-roll included in his points cost."]
                assert len(_one) == 1 and _e.get("rr") == 2, "Mesme's section general sentence or re-roll count changed"
                _e["skiptx"] = _one
                _mesme += 1
assert _mesme == 1, "1 Kor'O'Mesme row expected, found %d" % _mesme

# p.258 Scion of Prospero: "This ship bears the Mark of Tzeentch as part of
# its point cost" (Mark: "gains +1 re-roll", p.236) and "The ship is gifted
# with an additional re-roll added to that from the Mark of Tzeentch" -
# the ship has two re-rolls of its own and they are included in the 450 points.
# In the profile they are only sentences; rr turns them into boxes (domain.js
# shipRerolls). Review 5.10.2026.
_scion = ships["258"]
assert "SCION OF PROSPERO" in _scion["nm"].upper() and "additional re-" in json.dumps(_scion), "p.258 is not the Scion of Prospero or the Vagaries of Fate sentence is missing"
assert "rr" not in _scion
_scion["rr"] = 2

# The fleet's own re-roll without a commander (user 5.10.2026: a re-roll included in
# the price is always stated visibly). "The fleet gets one re-roll and
# can purchase extra re-rolls at the cost shown" - Necrons p.404, Demiurg
# p.486. The list gets frr = count, page and the book's sentence; domain.js fleetRerolls
# reads it, and no surface parses text at run time.
_FRR = _re3.compile(r"^The fleet gets (one|two|three) re-\s*rolls?\b", _re3.I)
_frr = []
for _L in lists_out:
    for _sec in _L["secs"]:
        for _t in _sec.get("text") or []:
            _m = _FRR.match(_t)
            if not _m:
                continue
            assert "frr" not in _L, "two fleet re-roll sentences: %s" % _L["nm"]
            _how = [_x for _x in _sec.get("text") or [] if "purchased by the fleet as a whole" in _x]
            assert len(_how) == 1, "the fleet re-roll's character sentence is missing: %s" % _L["nm"]
            _L["frr"] = dict(n=_RR_N[_m.group(1).lower()], pg=_L["pg"], sec=_sec["t"],
                             src=_re3.sub(r"re-\s+roll", "re-roll", _t), how=_how[0])
            # p.486: "These re-rolls can only be used for Demiurg vessels and
            # not with other starships they may take as allies in their war host."
            _only = [_re3.match(r"These re-rolls can only be used for (\w+) vessels\b", _x) for _x in _sec.get("text") or []]
            _only = [_o for _o in _only if _o]
            if _only:
                _L["frr"]["scope"] = "%s vessels only" % _only[0].group(1)
            _frr.append("%s p.%s%s" % (_L["nm"], _L["pg"], " (%s)" % _L["frr"]["scope"] if _only else ""))
assert len(_frr) == 2 and any("Necrons" in x and "404" in x and "only" not in x for x in _frr) \
    and any("Demiurg" in x and "486" in x and "Demiurg vessels only" in x for x in _frr), \
    "the fleet's own re-roll: Necrons p.404 and Demiurg p.486 expected, found %s" % _frr
print("the fleet's own re-roll: %s" % "; ".join(_frr))

# p.430 Tyranid Hive Fleet: "The Tyranid player may opt to include the direct
# influence of the Hive Mind in lieu of having a fleet commander. ... Hive
# Mind Influence re-rolls work in the same way as normal fleet commander
# re-rolls." "A maximum of one Hive Mind Influence re-roll can be purchased
# per hive ship in the fleet." Fleet re-rolls without a commander, but
# none is included in the price and every hive ship may buy one (each + per:
# a section whose ships set the cap). The row is marked as a fleet re-roll
# (frw), so that it is not the ship's own. Review 5.10.2026.
_ty = 0
for _L in lists_out:
    if _L["nm"] != "Tyranids \u2014 Hive Fleet":
        continue
    for _sec in _L["secs"]:
        _same = [_t for _t in _sec.get("text") or [] if _t.startswith("Hive Mind Influence re-rolls work in the same way as normal fleet commander re-rolls")]
        _rows = [_e for _e in _sec.get("ents") or [] if _e.get("k") == "up" and _e["l"] == "Hive Mind Influence re-roll"]
        if not (_same and _rows):
            continue
        assert "frr" not in _L and len(_rows) == 1 and _rows[0].get("rr") == 1
        assert any(_s2["t"] == "HIVE SHIPS" for _s2 in _L["secs"]), "Tyranid Hive Fleet: the HIVE SHIPS section is missing"
        _rows[0]["frw"] = 1
        _L["frr"] = dict(n=0, pg=_L["pg"], sec=_sec["t"], each=1, per="HIVE SHIPS", src=_same[0], how=_same[0])
        _ty += 1
assert _ty == 1, "1 Tyranid Hive Fleet Hive Mind section expected, found %d" % _ty

# p.184 Xenos Vessel: "each Xenos vessel also has one selected xenotech
# system as described in the Rogue Trader special rules. This system does
# not cost extra points and may be selected by the owning player for free"
# - the p.175 table as six free choices, one per ship. The named
# variants (p.185-188) have their own in the profile already. Spot check 5, row 10.
if "184" in ships:
    _xv = ships["184"]
    assert not _xv.get("ol"), "Xenos Vessel p.184: an empty option list expected"
    _XT = [
        ("Long Range Sensors: The vessel adds +1 to its base leadership (max. of Ld 10).", {}),
        ("Targeting Matrix: The vessel counts all targets as closing when using the gunnery "
         "table within 30 cm and ignores right-shift modifiers for shooting greater than 30 cm.", {}),
        ("Advanced Shielding: The vessel increases the strength of its shields by +1.", dict(mod=dict(sh=1))),
        ("Ship Defense Grid: The vessel increases the strength of its turrets by +1.", dict(mod=dict(tu=1))),
        ("Advanced Drive Technology: The vessel adds +5 cm to its speed as well as +1D6 when "
         "undergoing All Ahead Full special orders.", dict(set=dict(sp="30 cm"))),
        ("Gravitic Thrusters: The vessel can double the maximum rate of its normal turn.", dict(set=dict(tn="180°"))),
    ]
    _xv["ol"] = [dict(t="Xenotech system (free, choose one) — " + _t, c=0, var=0,
                      grp="xenotech", gmax=1, **_eff) for _t, _eff in _XT]

# p.376 Dethdeala: "The rules for the bombardment cannon can be found on
# pg. 94." is a reference, not a rule - it blocked the card's own Bombardment Cannon
# rule (domain.js selfText). Spot check 4, row 54.
_ptr = "The rules for the bombardment cannon can be found on pg. 94."
_ptr_hits = 0
for _sh in ships.values():
    _sr = _sh.get("sr") or ""
    if _ptr in _sr:
        _sh["sr"] = re.sub(r"\s*•?\s*" + re.escape(_ptr), "", _sr).strip()
        _ptr_hits += 1
assert _ptr_hits == 1, "bombardment reference sentence: 1 hit expected, %d" % _ptr_hits

# p.181 Endeavour: "Instead of the Endeavour, Rogue Traders may use a
# lance-armed Dauntless light cruiser for +15 points ... This is already
# reflected in the point cost in the fleet list." A list note, not the ship's
# equipment: the Dauntless is its own row (p.174, 125 pts). The option is removed, so that
# the card does not offer a +15 pts tick without an effect. Spot check 4, row 81.
DROP_OPTS = [("181", "Instead of the Endeavour, Rogue Traders may use a lance-armed Dauntless"),
             # p.180: the same kind - a note of the Exploration list (Lunar/Tyrant/
             # Carnage/Murder as their own rows), not equipment of the Rogue Trader Cruiser.
             # The sentence mentions the Nova Cannon and brought its rule to the card.
             # Spot check 5 (10.9.2026), row 51.
             ("180", "Rogue Trader cruisers in an Exploration fleet may also be of the following")]
for _pg, _frag in DROP_OPTS:
    _ol = ships[_pg]["ol"]
    _keep = [o for o in _ol if _frag not in o["t"]]
    assert len(_keep) == len(_ol) - 1, "DROP_OPTS: p.%s %r hit %d times" % (_pg, _frag, len(_ol) - len(_keep))
    ships[_pg]["ol"] = _keep

# For-information sentences the book prints under the OPTIONS heading but that are not
# choices (spot check 8 rows 36 and 48): "... already included in its
# profile" (p.186, 188), "... see the special ability above" (p.187) and "If
# the torpedo refit is taken, the ship does not have to be modified ..."
# (p.150). On the card they were tickable options and blocked a finished PTS;
# they move to the ship's SPECIAL texts as they are.
OPT_TO_SR = [("150", "If the torpedo refit is taken"),
             ("186", "already included in its profile"),
             ("187", "see the special ability above"),
             ("188", "already included in its profile")]
for _pg, _frag in OPT_TO_SR:
    _ol = ships[_pg]["ol"]
    _mv = [o for o in _ol if _frag in o["t"]]
    assert len(_mv) == 1, "OPT_TO_SR: p.%s %r hit %d times" % (_pg, _frag, len(_mv))
    ships[_pg]["ol"] = [o for o in _ol if o is not _mv[0]]
    ships[_pg]["sr"] = ((ships[_pg].get("sr") or "") + " \u2022 " + _mv[0]["t"].strip()).strip()

# An option the book calls free ("for no additional cost", "no change
# in cost", "already included in its profile", "Instead of taking one of the
# above") is 0 pts and not "see text": the card prints "free". Spot check 6's
# wide review (10.9.2026) found 19 such option boxes.
_FREE_OPT = re.compile(r"no (?:additional|extra) (?:points? )?cost|no change in cost|for free\b"
                       r"|already included|no extra points|costs no extra|at no cost"
                       r"|see the special ability above|Instead of taking one of the above", re.I)
_free_hits = 0
for _sh in ships.values():
    for _o in _sh.get("ol") or []:
        if _o.get("c") is None and _FREE_OPT.search(_o.get("t") or ""):
            _o["c"] = 0
            _free_hits += 1
assert _free_hits == 16, "16 free options expected, found %d" % _free_hits

# A permanent option ID (P1-8a, apps/registry/docs/save-format.md): page + sha1(normalised
# text)[:8]. Made from the data, not by hand; a save refers to an option by it and not
# by index, so a new version of the book can move options without breaking
# saves. domain.js's normOptText does the same normalisation.
import hashlib as _hashlib, re as _re
def _opt_id(pgkey, text):
    n = _re.sub(r"[^a-z0-9]", "", str(text or "").lower())   # the whole text: the two options of p.255 differ only from the 90th character
    return "%s:%s" % (pgkey, _hashlib.sha1(n.encode("ascii")).hexdigest()[:8])
_n_ids = 0
for _k, _sh in ships.items():
    _seen = set()
    for _o in _sh.get("ol") or []:
        _o["id"] = _opt_id(_k, _o.get("t"))
        assert _o["id"] not in _seen, "the option ID is not unique: p.%s %r" % (_k, _o.get("t"))
        _seen.add(_o["id"])
        _n_ids += 1
print("option IDs given: %d" % _n_ids)

for _fx in KEEP_TEXT:
    assert _fx.get("_used"), "KEEP_TEXT did not hit: %r" % _fx
# A torpedo swap without a speed in the sentence: swaps.py gives 30 cm (Rulebook
# p.76; every Imperial/Chaos torpedo row is 30 cm). Guard: no
# swap row may be left with a "see text" range.
_seetext = [(k, r) for k, sh in ships.items() for o in sh.get("ol") or [] if o.get("sw")
            for r in o["sw"]["t"] if r[1] == "see text"]
assert not _seetext, "a swap row without a range: %s" % _seetext[:4]

# The narrative sentences of a profile's SPECIAL text stay in the book: the card repeats
# rules, not story. Hammer (Fleets p. 374): three sentences about Uzog
# Armripper and Garzog were 40 % of the card's rule box (item 10).
# Each must hit, or the run fails - like KEEP_TEXT.
DROP_SR = [
    "The prow launchers commonly seen on the Hammer",
    "ingenious solution was to rig up parts of the nova cannon",
    "Garzog thus got it half right",
]
for _frag in DROP_SR:
    _hit = 0
    for _sh in ships.values():
        _sr = _sh.get("sr") or ""
        if _frag not in _sr:
            continue
        _new = re.sub(r"\s*[^.!?•]*" + re.escape(_frag) + r"[^.!?]*[.!?]", "", _sr)
        assert _new != _sr and _frag not in _new, "DROP_SR: the sentence did not come off: %r" % _frag
        _sh["sr"] = _new
        _hit += 1
    assert _hit, "DROP_SR did not hit: %r" % _frag
# Descriptions of upgrade rows for which the book's section gives no sentence of the row's own or
# gives the wrong one (spot check 8, 10.9.2026): the orks' Warlord re-roll row got
# as its description the next paragraph's lead (p.365, 366, 372), and 17 Chaos
# Mark rows printed the general text "Fleet-list upgrade", although the list's own
# page states the Mark's effect. Sentences from the book; set only on a row
# that has no description of its own (desc).
DESC_FIX = [
    (r"^Orks", r"^WARLORD$", r"^One extra re-roll$",
     "One more re-roll for the Warlord, two in total (Warlords get one re-roll)."),
    (r"^Orks", r"^WARLORD$", r"^Two extra re-rolls$",
     "Two more re-rolls for the Warlord, three in total (Warlords get one re-roll)."),
    # p.40: the row's description was the section's closing note "Note: Command duties were shared ..."
    (r"Armageddon", r"^Master of the Fleet Re-rolls$", r"^Three extra re-rolls$",
     "Three more re-rolls for the Master of the Fleet, four in total (the fleet commander gets a single re-roll included in his points cost)."),
    (r"Incursion$", r"^Chaos Lords$", r"^The Mark of Slaanesh$", 'Enemy ships within 15 cm of any ship with a Mark of Slaanesh suffer -2 to their Leadership value. This is an area effect that is not affected by line of sight obstructions.'),
    (r"Incursion$", r"^Chaos Lords$", r"^The Mark of Khorne$",
     "The Chaos Lord's ship doubles its value in boarding actions."),
    (r"Black Crusade$", r"^(Chaos Lords|DAEMON SHIPS|CHAOS SPACE MARINE CREWS)$", r"^The Mark of Khorne$", 'Crewed by the homicidal followers of Khorne, the ship is extremely dangerous in boarding actions. It doubles its value in boarding actions.'),
    (r"Black Crusade$", r"^(DAEMON SHIPS|CHAOS SPACE MARINE CREWS)$", r"^The Mark of Slaanesh$", 'Enemy ships within 15 cm of any ship with a Mark of Slaanesh suffer -2 to their Leadership value. This is an area effect that is not affected by line of sight obstructions.'),
    (r"Black Crusade$", r"^(DAEMON SHIPS|CHAOS SPACE MARINE CREWS)$", r"^The Mark of Tzeentch$", 'The Captain can call upon the power of precognition as well as formidable magics to control his vessel. This ship has an extra re-roll.'),
    (r"Black Crusade$", r"^(DAEMON SHIPS|CHAOS SPACE MARINE CREWS)$", r"^The Mark of Nurgle$", 'The vessel is rank with putrescence and the many plagues of the Lord of Decay. It gains 1 Damage Point and may not be boarded.'),
    (r"Tzeentch$", r"^(Chaos Warmaster of Tzeentch|CHAOS SPACE MARINE CREWS|DAEMONSHIPS)$",
     r"^The Mark of Tzeentch$", 'The vessel is given command of the Fates by its patron god and gains +1 re-roll.'),
    (r"Nurgle$", r"^(Chaos Warmaster of Nurgle|CHAOS SPACE MARINE CREWS)$", r"^The Mark of Nurgle$", 'The vessel is rank with putrescence and the many plagues of the Lord of Decay. It gains 1 Damage Point and may not be boarded.'),
    (r"Khorne$", r"^(Chaos Warmaster of Khorne|Chaos Lords|CHAOS SPACE MARINE CREWS)$",
     r"^The Mark of Khorne$", 'Crewed by homicidal, blood-crazed followers of Khorne, it doubles its value in boarding actions.'),
    (r"Slaanesh$", r"^(Chaos Warmaster of Slaanesh|CHAOS SPACE MARINE CREWS)$",
     r"^The Mark of Slaanesh$", 'Enemy ships within 15 cm of any ship with a Mark of Slaanesh suffer -2 to their leadership value.'),
]
_desc_hits = []
for _lrx, _srx, _nrx, _d in DESC_FIX:
    _n = 0
    for Lx in lists_out:
        if not re.search(_lrx, Lx["nm"]):
            continue
        for s in Lx["secs"]:
            if not re.search(_srx, s["t"].strip()):
                continue
            for e in s["ents"]:
                if e.get("k") == "up" and re.search(_nrx, str(e["l"]).strip()) and not e.get("desc"):
                    e["desc"] = _d
                    _n += 1
    assert _n, "DESC_FIX did not hit: %r / %r / %r" % (_lrx, _srx, _nrx)
    _desc_hits.append(_n)
print("description fixes: %d" % sum(_desc_hits))
# 24 + the Black Crusade crew's four Marks (spot check 11)
assert sum(_desc_hits) == 28, "DESC_FIX: 28 rows expected, hit %d" % sum(_desc_hits)

# The tyranid bio-refits (p.426): "These refits can be incorporated by capital
# ships or individual escorts except where specifically noted otherwise for
# the cost indicated" - in a squadron every ship pays (spot check 9 rows 14,
# 62 and 73: six Krakens' Solar Vanes cost 15 and not 90).
_bio_per = 0
for Lx in lists_out:
    if not Lx["nm"].startswith("Tyranids"):
        continue
    for s in Lx["secs"]:
        if s["t"].strip().upper() != "BIO-ENHANCEMENTS":
            continue
        for e in s["ents"]:
            if e.get("k") == "up" and not e.get("per"):
                e["per"] = "hull"
                _bio_per += 1
print("tyranid bio-refits made per ship: %d" % _bio_per)
assert _bio_per == 28, "28 tyranid bio-refits expected, found %d" % _bio_per

# Zukov's Klaw (p.381): "It is of the Goff Clan", "It is upgraded to be an
# Assault Karrier with boarding torpedoes ... but it may not use any other
# types of attack craft", "It is also equipped with Klaws as part of its point
# cost" - clans, Assault Karrier, boarding torpedoes, Klaws and torpedo-bommas
# are not buyable for it (spot check 9 row 76).
_zk = 0
for Lx in lists_out:
    if not Lx["nm"].startswith("Orks"):
        continue
    for s in Lx["secs"]:
        for e in s["ents"]:
            if e.get("k") != "up":
                continue
            if re.search(r"^(?:Clan: |Boarding torpedoes|Torpedo-bommas|Klaws|Assault Karrier)", str(e["l"])):
                c = dict(e.get("cond") or {})
                c["nmno"] = (c["nmno"] + "|" if c.get("nmno") else "") + "zukov"
                e["cond"] = c
                _zk += 1
print("Zukov limits: %d" % _zk)
assert _zk == 20, "20 Zukov limits expected, found %d" % _zk

# Adeptus Mechanicus (p.125 ORDNANCE): "They may not use assault boats, even
# if their Imperial Navy counterparts may have access to this type of
# ordnance (such as Emperor battleships)" - the Emperor's and Oberon's own Shark
# assault boats option cannot be chosen on the Mechanicus list (J11).
_optno = 0
for Lx in lists_out:
    if not Lx["nm"].startswith("Adeptus Mechanicus"):
        continue
    for s in Lx["secs"]:
        for e in s["ents"]:
            _sh = ships.get(str(e.get("r"))) if e.get("r") else None
            if _sh and any(re.search(r"shark assault boat", o.get("t") or "", re.I) for o in _sh.get("ol") or []):
                e["optno"] = r"shark assault boat"
                _optno += 1
assert _optno == 2, "2 Mechanicus list Shark options expected, found %d" % _optno

# Grey Knights p.144: "An Inquisitor Lord gets one re-roll, and may purchase
# up to two more re-rolls for +25 points each" also concerns the Ordo Malleus
# Inquisitor Lord; the extra re-rolls attached only to the row before
# (spot check 10 row 46).
_gk_rr = 0
for Lx in lists_out:
    if Lx["nm"] != "Grey Knights":
        continue
    for _si, s in enumerate(Lx["secs"]):
        if s["t"].strip() != "FLEET COMMANDER":
            continue
        _cmds = [[_si, _ei] for _ei, e in enumerate(s["ents"]) if e.get("k") == "cmd"]
        assert len(_cmds) == 2, "Grey Knights FLEET COMMANDER: commanders %d" % len(_cmds)
        for e in s["ents"]:
            if e.get("k") == "up" and re.search(r"extra re-roll", str(e["l"]), re.I):
                e["at"] = _cmds
                _gk_rr += 1
assert _gk_rr == 2, "Grey Knights: 2 extra re-roll rows expected, found %d" % _gk_rr

# p.84 Cobra: long range detection gear - "Only Imperial escort squadrons may
# take this refit, not pirates, Chaos renegades, etc." (spot check 10 row 67).
_pir = 0
for Lx in lists_out:
    if not Lx["nm"].startswith("Rogue Traders — Pirates"):
        continue
    for s in Lx["secs"]:
        for e in s["ents"]:
            _sh = ships.get(str(e.get("r"))) if e.get("r") else None
            if _sh and any(re.search(r"long range detection", o.get("t") or "", re.I) for o in _sh.get("ol") or []):
                assert not e.get("optno")
                e["optno"] = r"long range detection"
                _pir += 1
assert _pir >= 1, "the Pirates list's Cobra row was not found"
print("Pirates list detection gear bans: %d" % _pir)

# p.48: the sentences of Lord Admiral Rath's side box belong only to Rath's row.
# The owner was the box heading "Lord Admiral Rath", which does not match the row's
# name "Lord Admiral Rath (Ld10)", so commanderRules showed the sentences
# to every admiral (spot check 11 row 21). The owner becomes the row's name and
# ownx: the sentence only on its owner's card.
_box = 0
for Lx in lists_out:
    for s in Lx["secs"]:
        if not s.get("own"):
            continue
        _labels = [e["l"] for e in s["ents"]]
        for _i, _o in enumerate(s["own"]):
            if not _o or _o in _labels:
                continue
            _hit = [e["l"] for e in s["ents"] if e.get("k") == "cmd" and str(e["l"]).startswith(_o + " (")]
            if len(_hit) != 1:
                continue
            s["own"][_i] = _hit[0]
            _ox = s.setdefault("ownx", [])
            if _i not in _ox:
                _ox.append(_i)
            _box += 1
assert _box == 5, "5 commander side box sentences expected (Rath), found %d" % _box

# p.372 Da Ork Clanz, the WARLORD box: AFTER the price rows ("One extra re-roll +20",
# "Two extra re-rolls +40") come three of the Warlord's own sentences -
# Gubbins per re-roll, "He must be embarked on the most expensive ship under
# his own command" and "A Warlord's re-rolls only count for the skwadrons under
# his command and not for the whole fleet". The extractor gave them to the last
# price row, so the commander card showed them only when two extra re-rolls
# were taken (user 5.10.2026: re-rolls and their scope always visible).
_cz_own = 0
for Lx in lists_out:
    if Lx["nm"] != "Orks \u2014 Da Ork Clanz":
        continue
    for s in Lx["secs"]:
        if s["t"] != "WARLORD" or not s.get("own"):
            continue
        for _i, (_o, _t) in enumerate(zip(s["own"], s["text"])):
            if _o == "Two extra re-rolls" and re.match(r"(A Warlord may choose for his own ship|He must be embarked on the most expensive ship|A Warlord.s re-rolls only count)", _t):
                s["own"][_i] = "Ork Warlord"
                _cz_own += 1
assert _cz_own == 3, "3 of the Clanz Warlord's own sentences expected, found %d" % _cz_own

# p.494: "Warspheres 10HP or greater may ..." - three options need 10 HP,
# domain.js optionsOf blocks them when the HP is below (spot check 12 row 66).
_hpm = 0
for _o in ships["494"]["ol"]:
    if "10hp or greater" in _o["t"].lower():
        _o["hpmin"] = 10
        _hpm += 1
assert _hpm == 3, "Warsphere: 3 10HP options expected, found %d" % _hpm

# p.22 Acquisition: "Any ship with launch bays can be upgraded to carry torpedo
# bombers at an additional cost of +10 pts per Strength point of the launch bays
# on the vessel" (examples Chaos Styx 60, Imperial Dictator 40); "Eldar or Tau
# vessels must pay +15 points per launch bay instead of +10"; "Fleets that do not
# normally have access to bombers also do not have access to torpedo bombers."
# The row is added to the lists that do not have it. The orks' prices are in the ships'
# own descriptions (p.22), and the bays of Space Marine and Inquisition ships
# carry only Thunderhawks (spot check 12).
_TB_BOMB = re.compile(r"bomber|starhawk|doomfire|eagle|phoenix|razorwing|manta", re.I)
_TB_XENO = r"^(ELDAR|DARK ELDAR|TAU)"
_TB_NOT10 = r"^(ELDAR|DARK ELDAR|TAU|SPACE MARINES|INQUISITION)"
_tb_tpl = [e for Lx in lists_out if Lx["nm"] == "Imperial Navy — Bakka Sector"
           for s in Lx["secs"] for e in s["ents"] if e.get("k") == "up" and e["l"] == "Torpedo bombers"]
assert len(_tb_tpl) == 1, "the Bakka Torpedo bombers template row is not found"
_tb_log = []
for Lx in lists_out:
    if Lx["nm"].startswith("Orks"):
        continue
    _tbrows = [e for s in Lx["secs"] for e in s["ents"]
               if e.get("k") == "up" and re.match(r"torpedo bombers", str(e["l"]), re.I)]
    _fl = set()
    for s in Lx["secs"]:
        for e in s["ents"]:
            _sh = ships.get(str(e.get("r"))) if e.get("r") else None
            if _sh and any("launch bay" in str(a[0]).lower() and _TB_BOMB.search(str(a[1])) for a in _sh["aw"]):
                _fl.add(_sh["fl"])
    if not _fl:
        continue
    _xeno = any(re.match(_TB_XENO, f) for f in _fl)
    _other = any(not re.match(_TB_NOT10, f) for f in _fl)
    # Tau: only bays with Mantas - "Mantas are bombers" (p.450);
    # the Barracuda is a fighter, so the Emissary's (Dal'yth) bay has no
    # bombers to convert.
    _xtau = all(f.startswith("TAU") for f in _fl if re.match(_TB_XENO, f))
    _xhas = "launch bay@Manta" if _xtau else "launch bay"
    _xlab = "Torpedo bombers (Tau vessel)" if _xtau else "Torpedo bombers (Eldar or Tau vessel)"
    _add = []
    if not _tbrows:
        if _other:
            _add.append(("Torpedo bombers", 10, dict(has="launch bay", flno=_TB_NOT10)))
        if _xeno:
            _add.append((_xlab if _other else "Torpedo bombers", 15, dict(has=_xhas, fl=_TB_XENO)))
    elif Lx["nm"] == "Demiurg — War Host" and _xeno:
        # the list's own row concerns Demiurg ships (p.487); Tau ships by p.22
        _add.append(("Torpedo bombers (Tau vessel)", 15, dict(has=_xhas, fl=_TB_XENO)))
    if not _add:
        continue
    _sec = [s for s in Lx["secs"] if s["t"].strip().upper() == "ORDNANCE"]
    if _sec:
        _sec = _sec[0]
    else:
        _sec = dict(t="ORDNANCE", rules=[], text=[], ents=[])
        Lx["secs"].append(_sec)
    for _lab, _p, _cond in _add:
        assert not any(e["l"] == _lab for e in _sec["ents"]), "%s: %s already exists" % (Lx["nm"], _lab)
        _row = dict(_tb_tpl[0])
        _row.pop("at", None)
        _row.update(l=_lab, p=_p, cond=_cond, src_page=22)
        _sec["ents"].append(_row)
        _tb_log.append("%s: %s %d" % (Lx["nm"], _lab, _p))
for _x in _tb_log:
    print("  torpedo bombers +", _x)
assert len(_tb_log) == 19, "19 torpedo bombers rows expected, %d added" % len(_tb_log)

# p.19 SPECIAL TORPEDOES: "If you're playing in a one-off game, rolls on the
# Special Torpedoes table can be purchased for the number of points shown
# below." Up to Strength 6 20 points, 7 or more 30 points. "No ship may be
# equipped with more than one special torpedo type. Escort squadrons and
# defences may not be equipped with special torpedoes at all. Ork ships may
# only use special torpedoes if they have been upgraded to have Looted
# Torpedoes, but count as having a Torpedo Strength of up to 6. Eldar and Dark
# Eldar ships pay double points (...). The Tau (...) may not use the special
# torpedo rules at all. Likewise, Tyranids (...) cannot have special
# torpedoes." Spot check 18 (a book inventory) found the passage missing entirely.
_ST_HAS = r"torpedo|launcha"
_ST_ROW = re.compile(r"torpedo|launcha", re.I)
_ST_NOTROW = re.compile(r"bomb|boarding", re.I)
# qd=1: the quadrant forts are the only exception to the ban on defences. p.503
# SPECIAL TORPEDO REFITS: "A Ramilies can purchase special torpedoes", and the
# Fortress-Monastery "follows all rules for the Ramilies" (p.110). The price is
# from the p.19 table: Torpedo silos strength 9 -> "7 or more", 30 points.
# The user's decision 13.10.2026 (BACKLOG J174); before, the rows were not offered.
_ST_BASE = dict(cap=1, ty=r"^(?!defence)", qd=1, has=_ST_HAS, noup=r"^Special torpedoes")
_ST_DESC = ("Before the game roll a D6 on the Special Torpedoes table: 1 Short Burn, 2 Guided, 3 Seeking, "
            "4 Barrage Bombs, 5 Melta, 6 Vortex. One special torpedo type per ship; not for escorts or "
            "defences, except a Ramilies or Fortress-Monastery (Fleets p. 503). Eldar and Dark Eldar pay "
            "double; Tau and Tyranids cannot have them; Orks only with "
            "Looted Torpedoes, counting as Strength up to 6. (Fleets p. 19)")
_st_log = []
for Lx in lists_out:
    _grp = set()
    for s_ in Lx["secs"]:
        for e in s_["ents"]:
            _sh = ships.get(str(e.get("r"))) if e.get("r") else None
            if not _sh or re.search(r"escort|defence", str(_sh.get("ty", "")), re.I):
                continue
            if not any(_ST_ROW.search(str(a[0])) and not _ST_NOTROW.search(str(a[0])) for a in _sh["aw"]):
                continue
            _f = str(_sh.get("fl", ""))
            if re.match(r"^(TAU|TYRANID|NECRON)", _f, re.I):
                continue
            _grp.add("ELDAR" if re.match(r"^(ELDAR|DARK ELDAR)", _f, re.I)
                     else "ORK" if re.match(r"^ORK", _f, re.I) else "STD")
    _add = []
    if "STD" in _grp:
        _no = dict(flno=r"^(ELDAR|DARK ELDAR|TAU|TYRANID|NECRON|ORK)")
        _add.append(("Special torpedoes (Strength up to 6)", 20, dict(_ST_BASE, tsmax=6, **_no)))
        _add.append(("Special torpedoes (Strength 7 or more)", 30, dict(_ST_BASE, tsmin=7, **_no)))
    if "ELDAR" in _grp:
        _fl = dict(fl=r"^(ELDAR|DARK ELDAR)")
        _add.append(("Special torpedoes (Eldar, Strength up to 6)", 40, dict(_ST_BASE, tsmax=6, **_fl)))
        _add.append(("Special torpedoes (Eldar, Strength 7 or more)", 60, dict(_ST_BASE, tsmin=7, **_fl)))
    if "ORK" in _grp:
        _add.append(("Special torpedoes (Looted Torpedoes)", 20,
                     dict(_ST_BASE, fl=r"^ORK", up=r"^Looted Torpedoes")))
    if not _add:
        continue
    _sec = [x for x in Lx["secs"] if x["t"].strip().upper() == "ORDNANCE"]
    if _sec:
        _sec = _sec[0]
    else:
        _sec = dict(t="ORDNANCE", rules=[], text=[], ents=[])
        Lx["secs"].append(_sec)
    for _lab, _p, _cond in _add:
        assert not any(e["l"] == _lab for e in _sec["ents"]), "%s: %s already exists" % (Lx["nm"], _lab)
        _row = dict(_tb_tpl[0])
        for _k in ("at", "per"):
            _row.pop(_k, None)
        _row.update(l=_lab, p=_p, cond=_cond, src_page=19, desc=_ST_DESC,
                    nt="One roll on the Special Torpedoes table.")
        _sec["ents"].append(_row)
        _st_log.append("%s: %s %d" % (Lx["nm"], _lab, _p))
for _x in _st_log:
    print("  special torpedoes +", _x)
print("special torpedoes rows %d" % len(_st_log))
assert len(_st_log) >= 40, "at least 40 special torpedoes rows expected, %d added" % len(_st_log)

# p.23 Acquisition: "Any ship with launch bays can be refitted to carry orbital
# mines instead of attack craft at a points cost of +5 points per launch bay
# strength. ... Only cruisers may be refitted to carry orbital mines;
# battleships are considered too rare and valuable to use in this way."
# Profile type Cruiser (also heavy, battle and light cruisers) and grand
# cruiser (Fleets p.14 counts them in the "cruisers" group; p.23 excludes only
# battleships - J21, raised on Discord), not a battleship. Tyranids (their own Mega-Spore Mines) and Necrons
# left out (spot check 12). Orks included: p.360 "Orks may buy orbital mines
# like other fleets at +5 pts per (maximal) launch bay strength ... Ork Space
# Hulks cannot take orbital mines" (spot check 13; the limit in spot check 12 was wrong).
_OM_DESC = ("Orbital mines replace all the attack craft in the ship's launch bays: one mine per launch bay "
            "Strength is launched like attack craft, mines cannot form waves and are not subject to ordnance "
            "limits. A critical hit affecting the launch bays causes an extra D3 damage. Cruisers and grand cruisers only, "
            "not battleships; not with torpedo bombers or other attack craft upgrades; "
            "intended as a surprise tactic - at most one or two mine-armed ships. (Fleets p. 23)")
_om_log = []
for Lx in lists_out:
    if re.match(r"^(Tyranids|Necrons)", Lx["nm"]):
        continue
    if any(e.get("k") == "up" and re.match(r"orbital mines", str(e["l"]), re.I) for s in Lx["secs"] for e in s["ents"]):
        continue
    _hit = False
    for s in Lx["secs"]:
        for e in s["ents"]:
            _sh = ships.get(str(e.get("r"))) if e.get("r") else None
            if _sh and re.match(r"^(grand )?cruiser$", str(_sh["ty"]), re.I) and any("launch bay" in str(a[0]).lower() for a in _sh["aw"]):
                _hit = True
    if not _hit:
        continue
    _sec = [s for s in Lx["secs"] if s["t"].strip().upper() == "ORDNANCE"]
    if _sec:
        _sec = _sec[0]
    else:
        _sec = dict(t="ORDNANCE", rules=[], text=[], ents=[])
        Lx["secs"].append(_sec)
    # noup/offopt: mines replace ALL attack craft (p.23), so no
    # torpedo bombers (p.22 "an additional type of attack craft") nor the ship's
    # own attack craft choices (Shark assault boats p.59, Vampire raiders p.330,
    # the orks' torpedo-bommas as the ship's own option p.359).
    _omcond = dict(ty=r"^(grand )?cruiser$", has="launch bay", noup=r"^torpedo[\s-]*bom",
                   offopt=r"shark assault boats|vampire raiders|torpedo[\s-]*bom")
    if Lx["nm"].startswith("Orks"):
        # p.360 not the Ork Space Hulk; Zukov's Klaw's bays are an Assault Karrier (p.381)
        _omcond["nmno"] = r"hulk|zukov"
    _sec["ents"].append(dict(l="Orbital mines", r=None, p=5, a=1, u=1, mx=None, k="up", per="bay",
                             nt="Per launch bay strength.", prose=1, src_page=23,
                             cond=_omcond, desc=_OM_DESC,
                             # p.23: launch bay rows turn into mine rows, 10 cm (p.512),
                             # one mine per bay strength (domain.js permine).
                             swp=dict(f=r"launch bays?", nm="orbital mines", nmf=r"launch bays?",
                                      rg="10 cm", permine=1)))
    _om_log.append(Lx["nm"])
print("orbital mines row on %d lists: %s" % (len(_om_log), ", ".join(_om_log)))
assert len(_om_log) >= 20, "at least 20 orbital mines rows expected, %d added" % len(_om_log)

# p.22 "When taken, they become an additional type of attack craft available to
# the carrier"; p.23 "Orbital mines completely replace all the attack craft in a
# ships launch bays" -> torpedo bombers and mines are not on the same ship
# (J21, Bug Hunt finding 1). The mine row's own noup closes the other direction.
_tbx = 0
for Lx in lists_out:
    for s in Lx["secs"]:
        for e in s["ents"]:
            if e.get("k") == "up" and re.match(r"torpedo[\s-]*bom", str(e["l"]), re.I):
                _c = dict(e.get("cond") or {})
                _c["noup"] = (_c["noup"] + "|^orbital mines$") if _c.get("noup") else "^orbital mines$"
                e["cond"] = _c
                _tbx += 1
print("torpedo bombers rows with the mine exclusion: %d" % _tbx)
assert _tbx >= 20, "at least 20 torpedo bombers rows expected, found %d" % _tbx

# p.234 Black Crusade: "Chaos Warmasters get one re-roll. In addition they may
# be given a single Mark of Chaos." The Marks' prices are under Chaos Lords,
# and the rows' target (at) was only the Lord (spot check 15 row 36). The Warmaster
# is added as a target; grp=mark keeps the Mark single.
_wm = 0
for Lx in lists_out:
    if Lx["nm"] != "Chaos — Black Crusade":
        continue
    _wsi = [i for i, s in enumerate(Lx["secs"]) if s["t"] == "Chaos Warmaster"]
    assert len(_wsi) == 1, "Black Crusade: the Chaos Warmaster section is not found"
    _wei = [i for i, e in enumerate(Lx["secs"][_wsi[0]]["ents"]) if e.get("k") == "cmd"]
    assert len(_wei) == 1, "Black Crusade: the Warmaster row is not found"
    for s in Lx["secs"]:
        if s["t"] != "Chaos Lords":
            continue
        for e in s["ents"]:
            if e.get("k") == "up" and str(e["l"]).startswith("The Mark of ") and e.get("at"):
                e["at"] = list(e["at"]) + [[_wsi[0], _wei[0]]]
                _wm += 1
assert _wm == 4, "Black Crusade: 4 Warmaster Mark rows expected, found %d" % _wm

# --- J161: Prince Yriel on both Corsair lists (p.319, 9.10.2026) ------------
# "Yriel may be taken instead of the Hero Fleet Commander as listed in the
# Corsair and Craftworld Eldar fleet lists." The box is printed on the second page of
# the Iyanden list (p.319), so the extractor gave the row only to Iyanden
# - a player report 9.10.2026 and the book check 5.10. (J161). The rows and
# Yriel's own sentences are COPIED from the Iyanden section, not written again:
# one source, and the copy inherits everything earlier runs gave the row (rr,
# ld, prose). The place is the Corsair list's own RESERVES AND ALLIES section, the same
# as in Iyanden; the section exists, so no section index moves.
_YR_SRC = ("Yriel may be taken instead of the Hero Fleet Commander as listed in the "
           "Corsair and Craftworld Eldar fleet lists.")
_yiy = _p18_list("Eldar \u2014 Iyanden Craftworld")
_yis = _p18_sec(_yiy, "RESERVES AND ALLIES")
_ysec = _yiy["secs"][_yis]
assert [e["l"] for e in _ysec["ents"]] == ["Prince Yriel", "One extra re-roll", "Two extra re-rolls",
                                            "Embarked aboard the Flame of Asuryan"], [e["l"] for e in _ysec["ents"]]
assert _ysec["ents"][0]["k"] == "cmd" and _ysec["ents"][0]["p"] == 150 and _ysec["ents"][0].get("rr") == 1
assert all(e.get("at") == [[_yis, 0]] for e in _ysec["ents"][1:]), [e.get("at") for e in _ysec["ents"]]
_ytext = [t for t, o in zip(_ysec["text"], _ysec["own"]) if o == "Prince Yriel"]
assert len(_ytext) == 9 and _YR_SRC in _ytext, _ytext
# The book's sentence has a misprint ("rules *eg you do not ... fleet list(."):
# a star in place of the opening bracket and an opening one in place of the closing one.
# On the card and the legality row it is corrected to be readable; the words are the book's.
_YBAD = "*eg you do not have to field three capital ships in a Corsair Eldar fleet list(."
_YGOOD = "(e.g. you do not have to field three capital ships in a Corsair Eldar fleet list)."
_yfix = [i for i, t in enumerate(_ysec["text"]) if _YBAD in t]
assert len(_yfix) == 1, "Yriel: the misprinted sentence is not found exactly once (%d)" % len(_yfix)
_ysec["text"][_yfix[0]] = _ysec["text"][_yfix[0]].replace(_YBAD, _YGOOD)
_ytext = [t for t, o in zip(_ysec["text"], _ysec["own"]) if o == "Prince Yriel"]
_yex = [t for t in _ytext if "exempt from the reserve rules" in t]
_yab = [t for t in _ytext if "in which case his cost is 125 points" in t]
assert len(_yex) == 1 and len(_yab) == 1
# p.319: "He must be embarked aboard the Flame of Asuryan if it is present, in
# which case his cost is 125 points." The row -25 is a tick the player may
# forget or take without the ship: resolveFleet compares (aboard).
_YR_ABOARD = dict(cmd_re="^prince yriel", ship_re="^flame of asuryan",
                  up_re="^embarked aboard the flame of asuryan", pg=319, src=_yab[0])
_yiy["aboard"] = dict(_YR_ABOARD)
_yn = [0, 0, 0]
for _nm in ("Eldar Corsairs \u2014 Gothic Sector", "Eldar Corsairs \u2014 Later Gothic War"):
    _L = _p18_list(_nm)
    _si = _p18_sec(_L, "RESERVES AND ALLIES")
    _s = _L["secs"][_si]
    assert not _s["ents"], "%s: the RESERVES AND ALLIES section already has rows" % _nm
    _s["ents"] = [copy.deepcopy(e) for e in _ysec["ents"]]
    for _e in _s["ents"][1:]:
        _e["at"] = [[_si, 0]]
    _own = list(_s.get("own") or [None] * len(_s["text"]))
    assert len(_own) == len(_s["text"])
    _s["own"] = _own + ["Prince Yriel"] * len(_ytext)
    _s["text"] = list(_s["text"]) + list(_ytext)
    # Yriel stands in for the Hero: the same one commander slot, and he fills
    # the required commander (p.316/317 "a Pirate Prince must be included",
    # which the Hero replaces).
    for _x in _L["secs"]:
        for _r in _x.get("rules") or []:
            if _r.get("label") == "Fleet commander (Pirate Prince or Eldar Hero)":
                _r["label"] = "Fleet commander (Pirate Prince, Eldar Hero or Prince Yriel)"
                _r["pick"] = list(_r["pick"]) + [dict(sec=_si, re="^prince yriel")]
                _r["src"] = _r["src"] + " " + _YR_SRC
                _yn[0] += 1
            elif _r.get("kind") == "mandatory_at" and "Pirate Prince must be included" in str(_r.get("src", "")):
                _r["pick"] = list(_r["pick"]) + [dict(sec=_si, re="^prince yriel")]
                _yn[1] += 1
    # p.319: "Furthermore, if the Flame of Asuryan with Yriel is added to the
    # parent fleet it is exempt from the reserve rules *eg you do not have to
    # field three capital ships in a Corsair Eldar fleet list(." (the book's own
    # misprint in brackets). The exemption concerns ONLY the Flame with Yriel: not
    # a Dragonship, not a fleet led by the Hero. Engine: resolveFleet.
    # p.329: "It is a unique vessel, only one may ever be included in the
    # fleet." The borrowed row's own 0-1 does not reach the host, so the limit is here.
    _L["res_exempt"] = dict(re="^flame of asuryan$", needs_re="^prince yriel", pg=319, src=_yex[0],
                            unique_src="It is a unique vessel, only one may ever be included in the fleet.", unique_pg=329)
    _L["aboard"] = dict(_YR_ABOARD)
    _yn[2] += 1
assert _yn == [2, 2, 2], _yn
print("Prince Yriel added to %d Corsair lists (p.319)" % _yn[2])

# p.319: the RESERVES AND ALLIES paragraph (Corsair reserves) and Prince Yriel's
# box are in the same section. Ownerless sentences showed on Yriel's
# card, although they are the paragraph's ("An Eldar Hero must lead the fleet in
# order to use Corsair Eldar vessels as reserves") or the box's narrative
# ("Unlike an Exarch ..."); spot check 15 row 59. ownx: on nobody's card.
_yr = 0
for Lx in lists_out:
    for s in Lx["secs"]:
        if s["t"] != "RESERVES AND ALLIES" or not s.get("own"):
            continue
        if "Prince Yriel" not in s["own"]:
            continue
        for _i, _o in enumerate(s["own"]):
            if _o:
                continue
            s["own"][_i] = "RESERVES AND ALLIES"
            _ox = s.setdefault("ownx", [])
            if _i not in _ox:
                _ox.append(_i)
            _yr += 1
assert _yr >= 6, "Yriel: at least 6 reserve paragraph sentences expected, found %d" % _yr

# --- Spot check 19, J42: the make-up of squadrons (Fleets p.13) --------------
# "A single escort may be taken in a fleet as long as there are no other
# escorts in the fleet and no other restrictions due to the fleet list, such
# as a minimum of six escorts in a squadron, these restrictions cannot be
# ignored." The exception (lone) concerns the lists whose sentence refers to p.13
# ("in squadrons of 2-6 unless specified (see pg 13)"); the lists that set their
# own size (Rogue Traders, Pirates, Necrons, Tyranids, Tau Defenders) do not get it.
_lone = 0
for Lx in lists_out:
    for s in Lx["secs"]:
        for r in s.get("rules") or []:
            if r.get("kind") == "squadron" and re.search(r"see pg\.?\s*13", str(r.get("src", "")), re.I):
                r["lone"] = 1
                _lone += 1
assert _lone == 21, "21 squadron rules referring to p.13 expected, found %d" % _lone
# Armageddon p.43: "* Space Marine vessels may not be squadroned with
# non-Space Marine vessels." (split_fl). Tau p.455: "Defenders are fielded in
# squadrons of 2-6 ships. They may be combined in squadrons with Messengers if
# you wish. They may not be combined with Orcas." (with_pick).
_sq = 0
for Lx in lists_out:
    _titles = [x["t"].strip().lower() for x in Lx["secs"]]
    _txt = " ".join(t for x in Lx["secs"] for t in (x.get("text") or []))
    for s in Lx["secs"]:
        for r in s.get("rules") or []:
            if r.get("kind") != "squadron":
                continue
            if Lx["nm"] == "Imperial Navy — Armageddon Sector":
                assert "Space Marine vessels may not be squadroned with non-Space Marine vessels" in _txt
                r["split_fl"] = 1
                _sq += 1
            if Lx["nm"] in ("Tau — Merchant Fleet", "Tau — Commerce Protection") and \
                    str(r.get("src", "")).startswith("Defenders are fielded"):
                assert "They may be combined in squadrons with Messengers if you wish." in _txt
                assert _titles.count("escorts") == 1, Lx["nm"]
                r["with_pick"] = [dict(sec=_titles.index("escorts"), re="^messenger", _t="escorts")]
                _sq += 1
assert _sq == 3, "3 squadron flags (Armageddon + two Tau lists) expected, found %d" % _sq

# --- Spot check 19, J45: the Nate Montes condition (p.179) -------------------
# "Siluria Class Light Cruisers and Havoc Class Frigates are older, outdated
# ships, and much more commonly seen outside of the Imperial Navy. If both
# players agree before the game, these ships can be included in a Rogue Trader
# fleet, as a cruiser and an escort respectively." The extraction left the section's
# text empty on all three RT lists, so the condition did not show.
_NM_TXT = ("Siluria Class Light Cruisers and Havoc Class Frigates are older, outdated ships, and much more "
           "commonly seen outside of the Imperial Navy. If both players agree before the game, these ships "
           "can be included in a Rogue Trader fleet, as a cruiser and an escort respectively.")
_NM_NOTE = "Only if both players agree before the game (Fleets p. 179)."
_nm = 0
for Lx in lists_out:
    for s in Lx["secs"]:
        if s["t"].strip().upper() != "NOTES FROM NATE MONTES":
            continue
        assert not s.get("text") and not s.get("own"), Lx["nm"]
        s["text"] = [_NM_TXT]
        for e in s["ents"]:
            if e.get("k") == "up":
                continue
            e["nt"] = (e["nt"] + " " + _NM_NOTE) if e.get("nt") else _NM_NOTE
            _nm += 1
assert _nm == 6, "6 Nate Montes rows expected, found %d" % _nm

# --- Spot check 19 round 2: list rules (M10r2) ------------------------------
def _p19_text(L, i):
    x = L["secs"][i]
    return " ".join(list(x.get("text") or []) + [r.get("src", "") for r in x.get("rules") or []])


# J55 p.456: "It may also include up to one Hero class starship for every other
# type of capital ship in the fleet." T18 (the user's decision 11.9.): one Hero
# for every other kind of ship; configurations of the same class are one kind
# (distinct). The base is the list's own Battleships and Cruisers sections.
# J56 p.457: "Up to one Rogue Trader cruiser and its attendant escorts may
# accompany the fleet for every 750 points of Tau ships in the fleet.
# Additionally, a single squadron of up to six Xenos escorts can be taken as per
# the Rogue Trader rules and fleet list." Squadrons 2-6 (RT p.174) and squadrons
# at most cruisers + 1.
_CP = _p18_list("Tau — Commerce Protection")
_cpb, _cpc, _cpr = _p18_sec(_CP, "Battleships"), _p18_sec(_CP, "Cruisers"), _p18_sec(_CP, "Rogue Traders")
_HERO_SRC = "It may also include up to one Hero class starship for every other type of capital ship in the fleet."
assert "up to one Hero class starship for every other type of capital ship" in _p19_text(_CP, _cpc), "CP: the Hero sentence is missing"
_CP["secs"][_cpc].setdefault("rules", []).append(dict(
    kind="ratio", allow=1, per=1, ok=True, distinct=1,
    label="Hero class starships (one per other type of capital ship)",
    allow_type="Hero class starships", per_type="other types of capital ship",
    allow_pick=[dict(sec=_cpc, re="^hero", _t="cruisers")],
    per_pick=[dict(sec=_cpb, _t="battleships"), dict(sec=_cpc, re="^(?!hero)", _t="cruisers")], src=_HERO_SRC))
_XE_SRC = ("Additionally, a single squadron of up to six Xenos escorts can be taken as per the Rogue Trader "
           "rules and fleet list.")
assert "a single squadron of up to six Xenos escorts" in _p19_text(_CP, _cpr), "CP: the Xenos sentence is missing"
_CP_ESC = [dict(sec=_cpr, re="xenos|recommissioned|iconoclast|cargo", _t="rogue traders")]
_CP["secs"][_cpr].setdefault("rules", []).extend([
    dict(kind="squadron", min=2, max=6, ok=True, sec=[_cpr], pick=_CP_ESC,
         src="Up to one Rogue Trader cruiser and its attendant escorts may accompany the fleet for every 750 "
             "points of Tau ships in the fleet. " + _XE_SRC),
    dict(kind="compare", op="<=", ok=True, a_units=1, b_add=1,
         label="Rogue Trader escort squadrons (one per Rogue Trader cruiser, plus one Xenos squadron)",
         a_pick=_CP_ESC, b_pick=[dict(sec=_cpr, re="rogue trader cruiser|dauntless|endeavour", _t="rogue traders")],
         src=_XE_SRC)])

# J57 p.487: "For every three Demiurg capital ships in the fleet, it may include
# one squadron of up to six Tau or Rogue Trader escorts." and "Tau, Nicassar and
# Rogue Trader escorts may not be mixed in the same squadrons." The list sets no
# minimum size, so p.13's single escort exception applies (lone).
_WH = _p18_list("Demiurg — War Host")
_DW_SRC = ("For every three Demiurg capital ships in the fleet, it may include one squadron of up to six Tau "
           "or Rogue Trader escorts.")
assert any(_DW_SRC in _p19_text(_WH, i) for i in range(len(_WH["secs"]))), "War Host: the escort sentence is missing"
for _t in ("Tau Escorts", "Rogue Trader Escorts"):
    _i = _p18_sec(_WH, _t)
    _WH["secs"][_i].setdefault("rules", []).append(dict(
        kind="squadron", min=2, max=6, lone=1, ok=True, sec=[_i],
        src=_DW_SRC + " Tau, Nicassar and Rogue Trader escorts may not be mixed in the same squadrons."))

# J61 p.177: a required cargo squadron "in a squadron of 2 to 6 ships" and "Any
# number of cargo ships beyond this number may be taken and organized in
# squadrons that only contain cargo ships."
_EX = _p18_list("Rogue Traders — Exploration")
_ext, _exe = _p18_sec(_EX, "TRANSPORTS"), _p18_sec(_EX, "ESCORTS")
_cs = [r["src"] for r in _EX["secs"][_ext].get("rules") or [] if r.get("label") == "Cargo ship squadron"]
assert len(_cs) == 1, "Exploration: the cargo rule is not found exactly once"
_EX["secs"][_ext]["rules"].append(dict(
    kind="squadron", min=2, max=6, ok=True, sec=[_ext],
    pick=[dict(sec=_ext, re="cargo|freighter|q-ship|escort carrier", _t="transports"),
          dict(sec=_exe, re="cargo vessel", _t="escorts")],
    src=_cs[0] + " Any number of cargo ships beyond this number may be taken and organized in squadrons "
                 "that only contain cargo ships."))

# J62 p.372: "Tiddla skwadron 3-10 Escorts, chosen from the following list in any mix desired"
_CZ = _p18_list("Orks — Da Ork Clanz")
_tz = _p18_sec(_CZ, "Tiddla skwadron")
assert not _CZ["secs"][_tz].get("rules"), "Clanz: the tiddla section already has a rule"
_CZ["secs"][_tz]["rules"] = [dict(kind="squadron", min=3, max=10, ok=True, sec=[_tz],
                                  src="Tiddla skwadron 3-10 Escorts, chosen from the following list in any mix desired")]

# J63 p.318: "an Autarch must be included to lead it. Eldar Autarch (Ld 9) ...
# Iyanden Bearer of the Flame (Ld 10)" - the Dragonship exception ("If your fleet is
# led by an Autarch") concerns the whole Autarch section, not only the name that has the word.
_IY = _p18_list("Eldar — Iyanden Craftworld")
_ia = _p18_sec(_IY, "Autarch")
assert any("Bearer of the Flame" in e["l"] for e in _IY["secs"][_ia]["ents"]), "Iyanden: the Bearer is missing"
_iy = 0
for x in _IY["secs"]:
    for r in x.get("rules") or []:
        ex = r.get("exempt") or {}
        if any(p.get("re") == "autarch" for p in ex.get("cond_pick") or []):
            ex["cond_pick"] = [dict(sec=_ia, _t="autarch")]
            _iy += 1
assert _iy == 1, "Iyanden: 1 Autarch exception expected, found %d" % _iy

# J64 and J65 p.431: "Up to 10 % of the fleet's points allowance may be spent on
# Ordnance markers as long as at least one hive ship is chosen." The markers are
# upgrades bought for ships (up_sec). "You may include between 6 and 12
# escort class ships for each hive ship. If no hive ships are chosen, only
# Kraken and Vanguard drone ships may be included in the fleet." The upper limit concerns
# only a fleet with a hive ship (when_pick).
_HF = _p18_list("Tyranids — Hive Fleet")
_hs, _ho = _p18_sec(_HF, "HIVE SHIPS"), _p18_sec(_HF, "ORDNANCE")
_hf = 0
for x in _HF["secs"]:
    for r in x.get("rules") or []:
        if r.get("kind") == "points_share" and str(r.get("label", "")).startswith("Ordnance markers"):
            r["up_sec"] = _ho
            _hf += 1
        if r.get("label") == "Escorts per hive ship (max)":
            r["when_pick"] = [dict(sec=_hs, _t="hive ships")]
            _hf += 1
assert _hf == 2, "Hive Fleet: 2 ordnance and escort rules expected, found %d" % _hf

# --- Spot check 19 round 3 (M10r3) --------------------------------------------
# J70 p.177: "At least one Demiurg vessel of any class may be taken for every
# three Rogue Trader cruisers in the fleet. This is separate from and in addition
# to any reserve or allied cruisers taken, but each Demiurg vessel taken still
# counts against the twelve-cruiser limit, and no more than one Stronghold may be
# taken." "At least one" is read leniently (T20): one at once from the first
# cruiser, then one per three (min_one); the base is the list's own
# capital ships and the Siluria.
_exd, _exc, _exn = _p18_sec(_EX, "The Demiurg"), _p18_sec(_EX, "CAPITAL SHIPS"), _p18_sec(_EX, "NOTES FROM NATE MONTES")
assert not _EX["secs"][_exd].get("rules"), "Exploration: the Demiurg section already has a rule"
assert "At least one Demiurg vessel of any class may be taken" in _p19_text(_EX, _exd)
_EX["secs"][_exd]["rules"] = [dict(
    kind="ratio", allow=1, per=3, min_one=1, ok=True, label="Demiurg vessels (one per three Rogue Trader cruisers)",
    # T20 is an open interpretation (user 11.9.2026): the lenient reading is allowed, but
    # the check warns when the strict reading ("one for every three") is not met.
    interp=dict(id="T20", strict="min_one",
                note="Open interpretation: \"At least one Demiurg vessel of any class may be taken for every three "
                     "Rogue Trader cruisers in the fleet\" (Fleets p. 177) can also be read as one per full three "
                     "cruisers, which allows none with one or two. The app allows one; agree with your opponent."),
    allow_type="Demiurg vessels", per_type="Rogue Trader cruisers",
    allow_pick=[dict(sec=_exd, _t="the demiurg")],
    per_pick=[dict(sec=_exc, _t="capital ships"), dict(sec=_exn, re="^siluria", _t="notes from nate montes")],
    src="At least one Demiurg vessel of any class may be taken for every three Rogue Trader cruisers in the fleet.")]

# J71 p.370: "A vessel or escort skwadron led by a Warlord may be given up to one
# of the following upgrades per Command re-roll the Warlord has. Each upgrade can
# only be applied once." A Warlord has one re-roll and can buy one or
# two more (p.372). Attachment is not modelled (J8), so at fleet level:
# at most as many Gubbins as the sum of the Warlords' re-rolls (up_budget).
_czg, _czw = _p18_sec(_CZ, "GUBBINS"), _p18_sec(_CZ, "WARLORD")
# Which row of the Gubbins section uses up the re-roll allowance: not More Gubbins (p.371 "any number of capital ships",
# T31) nor Deathskullz's free looted copy (p.369, J7: a clan benefit, not a Gubbin - J232). The same expression
# in the Warlord's own check (clanz.gub_re below), so that they do not drift apart.
_CZ_GUB_RE = r"^(?!Klaws|Shokk-Attack Lance|Assault Karrier|.*\(Deathskullz: free\))"
_CZ["secs"][_czg].setdefault("rules", []).append(dict(
    kind="up_budget", ok=True, up_sec=_czg, label="Gubbins (one per Warlord re-roll)",
    # p.371 MORE GUBBINS: "The following gubbins can be taken by any number of
    # capital ships in the fleet" - they do not use the re-roll budget (T31).
    up_re=_CZ_GUB_RE,
    budget=[dict(pick=[dict(sec=_czw, _t="warlord")], units=1),
            dict(up_sec=_czw, up_re="^One extra re-roll", weight=1),
            dict(up_sec=_czw, up_re="^Two extra re-rolls", weight=2)],
    src="A vessel or escort skwadron led by a Warlord may be given up to one of the following upgrades per "
        "Command re-roll the Warlord has. Each upgrade can only be applied once."))

# J72 p.100: "Any Imperial Navy battleship, grand cruiser or battlecruiser may
# have a Space Marine Captain assigned to it." The list has no Imperial Navy
# hulls (the reserves are text only, J73), so there is no ship for the Captain.
_DM = _p18_list("Space Marines — Dominion")
_dmc = _p18_sec(_DM, "Space Marine Captains")
_DM["secs"][_dmc].setdefault("rules", []).append(dict(
    kind="ratio", allow=1, per=1, ok=True,
    label="Space Marine Captains (one per Imperial Navy battleship, grand cruiser or battlecruiser)",
    allow_type="Space Marine Captains", per_type="Imperial Navy battleships, grand cruisers or battlecruisers",
    allow_pick=[dict(sec=_dmc, re="^space marine captain", _t="space marine captains")], per_pick=[],
    src="Any Imperial Navy battleship, grand cruiser or battlecruiser may have a Space Marine Captain assigned to it."))

# J78 p.40: "As long as at least one Space Marine Battle barge is included you may
# choose a Master of the Fleet, who will always be assigned to a Battle barge and
# cannot be assigned to a non-Space Marine ship. As long as the fleet includes at
# least one Imperial capital ship it may include a fleet-admiral, admiral or solar
# admiral, who will always be assigned to an Imperial Navy vessel and cannot be a
# assigned to a Space Marine vessel." Attachment is not modelled (J8), the condition is.
_AR = _p18_list("Imperial Navy — Armageddon Sector")
_arf, _arb, _arbc, _arc = [_p18_sec(_AR, _t) for _t in ("Fleet Commander", "Battleships", "Battlecruisers", "Cruisers")]
assert "As long as at least one Space Marine" in " ".join(_p19_text(_AR, _i) for _i in range(len(_AR["secs"]))), \
    "Armageddon: the commander sentence is missing"
_AR["secs"][_arf].setdefault("rules", []).extend([
    dict(kind="requires", ok=True, label="Master of the Fleet needs a Space Marine battle barge",
         if_pick=[dict(sec=_arf, re="^master of the fleet", _t="fleet commander")],
         then_pick=[dict(sec=_arb, re="space marine battle barge", _t="battleships")], min=1,
         src="As long as at least one Space Marine Battle barge is included you may choose a Master of the Fleet, "
             "who will always be assigned to a Battle barge and cannot be assigned to a non-Space Marine ship."),
    dict(kind="requires", ok=True, label="Admiral needs an Imperial capital ship",
         if_pick=[dict(sec=_arf, re="admiral", _t="fleet commander")],
         then_pick=[dict(sec=_arb, re="^(?!space marine)", _t="battleships"), dict(sec=_arbc, _t="battlecruisers"),
                    dict(sec=_arc, re="^(?!space marine)", _t="cruisers")], min=1,
         src="As long as the fleet includes at least one Imperial capital ship it may include a fleet-admiral, "
             "admiral or solar admiral, who will always be assigned to an Imperial Navy vessel and cannot be a "
             "assigned to a Space Marine vessel.")])

# J81 p.234/236/240/244/248: "You can only include a Chaos Warmaster in your fleet
# if it includes any capital ships." Capital ships are the Planet Killer, the Chaos
# Space Hulk (p.288 "counts as a battleship"), battleships, grand and heavy
# cruisers, cruisers and the Activated Blackstone Fortress (a lenient reading).
_WM_SRC = "You can only include a Chaos Warmaster in your fleet if it includes any capital ships."
_WM_CAP = ("planet killer", "chaos space hulk", "battleships", "grand cruisers", "heavy cruisers", "cruisers",
           "activated blackstone fortress")
_wm = 0
for _L in lists_out:
    if not _L["nm"].startswith("Chaos — "):
        continue
    _hit = [i for i in range(len(_L["secs"])) if _WM_SRC in _p19_text(_L, i)]
    if not _hit:
        continue
    _i = _hit[0]
    _tt = [x["t"].strip().lower() for x in _L["secs"]]
    _caps = [j for j, t in enumerate(_tt) if t in _WM_CAP]
    assert len(_caps) == len(_WM_CAP), (_L["nm"], _caps)
    _L["secs"][_i].setdefault("rules", []).append(dict(
        kind="requires", ok=True, label="Chaos Warmaster needs a capital ship",
        if_pick=[dict(sec=_i, re="^chaos warmaster", _t=_tt[_i])],
        then_pick=[dict(sec=j, _t=_tt[j]) for j in _caps], min=1, src=_WM_SRC))
    _wm += 1
assert _wm == 5, "5 Chaos Warmaster sentences expected, found %d" % _wm

# J82 p.140: "If desired, vessels with an embarking Inquisitor may gain special
# characteristics, depending upon the Ordo the Inquisitor leading the fleet is
# affiliated with." and "The listed cost is added to that of the Inquisitor Lord".
# The Ordo is an addition to the leading Inquisitor Lord: it needs the Lord, and there is one Ordo.
_IQ = _p18_list("The Emperor's Inquisition")
_iql, _iqc = _p18_sec(_IQ, "Inquisitor Lord"), _p18_sec(_IQ, "CAPITAL SHIPS")
_iqo = [_p18_sec(_IQ, _t) for _t in ("ORDO HERETICUS INQUISITORS", "ORDO XENOS INQUISITORS", "ORDO MALLEUS INQUISITORS")]
_ORDO_SRC = "The listed cost is added to that of the Inquisitor Lord, and its benefits apply to the ship they are embarked upon."
_ORDO_AFF = ("If desired, vessels with an embarking Inquisitor may gain special characteristics, depending upon "
             "the Ordo the Inquisitor leading the fleet is affiliated with.")
_iqs = _p18_sec(_IQ, "INQUISITORS OF THE ORDOS")
assert _ORDO_AFF in _p19_text(_IQ, _iqs), "Inquisition: the Ordo sentence is missing"
# The extraction dropped the p.140 price sentence from the section text; it belongs in view for the reader.
assert _ORDO_SRC not in _p19_text(_IQ, _iqs)
_IQ["secs"][_iqs]["text"].append(_ORDO_SRC)
_ordo_pick = [dict(sec=i, re="inquisitor lord", _t=_IQ["secs"][i]["t"].strip().lower()) for i in _iqo]
_IQ["secs"][_iqo[0]].setdefault("rules", []).extend([
    dict(kind="requires", ok=True, label="Ordo Inquisitor needs an Inquisitor Lord",
         if_pick=_ordo_pick, then_pick=[dict(sec=_iql, re="^inquisitor lord", _t="inquisitor lord")], min=1,
         src=_ORDO_SRC),
    dict(kind="cap", ok=True, max=1, what="Ordo affiliations", label="Ordo affiliation (one Ordo)", pick=_ordo_pick,
         src=_ORDO_AFF)])

# J83 p.138: "A Space Marine fleet led by an Ordo Malleus Inquisitor including at
# least 1000 points of Inquisition vessels and Grey Knights strike cruisers may
# include a single Grey Knights battle barge." The barge itself does not count towards the 1 000 points
# (T22). The "Space Marine fleet" condition cannot be checked: the list is attached to the host.
_GKB_SRC = ("A Space Marine fleet led by an Ordo Malleus Inquisitor including at least 1000 points of Inquisition "
            "vessels and Grey Knights strike cruisers may include a single Grey Knights battle barge.")
assert "may include a single Grey Knights" in _p19_text(_IQ, _iqc), "Inquisition: the Battle barge sentence is missing"
_gkb = [dict(sec=_iqc, re="^grey knights battle barge", _t="capital ships")]
_IQ["secs"][_iqc].setdefault("rules", []).extend([
    dict(kind="requires", ok=True, label="Grey Knights Battle barge needs an Ordo Malleus Inquisitor",
         if_pick=_gkb, then_pick=[dict(sec=_iqo[2], re="inquisitor lord", _t="ordo malleus inquisitors")], min=1,
         src=_GKB_SRC),
    dict(kind="per_points", ok=True, each=1, per=1000, full=True, what="Grey Knights Battle barge",
         label="Grey Knights Battle barge (1000 points of Inquisition vessels and Grey Knights strike cruisers)",
         pick=_gkb, of_pick=[dict(sec=_iqc, re="^(?!grey knights battle barge)", _t="capital ships")], src=_GKB_SRC)])

# J84 p.174: "Any fleet except Necrons or Tyranids may include a single Rogue Trader
# capital ship. Tau, Demiurg and Imperial fleets may include one Rogue Trader cruiser
# for every 750 points or part thereof in their fleet." The host fleet is not known,
# so a lenient limit: one cruiser per 750 points or part (T23). Heavy
# transports are transports (they may be taken in squadrons), not cruisers.
_RTL = _p18_list("Rogue Traders")
_rtc, _rtn = _p18_sec(_RTL, "CAPITAL SHIPS"), _p18_sec(_RTL, "NOTES FROM NATE MONTES")
_RTC_SRC = ("Any fleet except Necrons or Tyranids may include a single Rogue Trader capital ship. Tau, Demiurg and "
            "Imperial fleets may include one Rogue Trader cruiser for every 750 points or part thereof in their fleet.")
assert "may include a single Rogue Trader capital ship" in _p19_text(_RTL, _rtc), "Rogue Traders: the sentence is missing"
_RTL["secs"][_rtc].setdefault("rules", []).append(dict(
    kind="per_points", ok=True, each=1, per=750, what="Rogue Trader cruiser",
    label="Rogue Trader cruisers (one per 750 points or part)",
    # T23 is an open interpretation (user 11.9.2026).
    interp=dict(id="T23", strict_max=1,
                note="Open interpretation: any fleet may include \"a single Rogue Trader capital ship\"; only Tau, "
                     "Demiurg and Imperial fleets may include one Rogue Trader cruiser for every 750 points (Fleets "
                     "p. 174). The app does not know the fleet you join and allows the larger number."),
    pick=[dict(sec=_rtc, re="rogue trader cruiser|dauntless|endeavour", _t="capital ships"),
          dict(sec=_rtn, re="^siluria", _t="notes from nate montes")], src=_RTC_SRC))

# J44 p.175: "To represent this each Rogue Trader cruiser and escort squadron may
# roll one random crew skill on [???] in the Remastered Rulebook for +10% point
# value." The table is Rulebook p.159 (CREW SKILLS). Price = 10 % of the unit's points
# before the crew skill, rounded up (T27). p=None: the app shows "see text", and
# the domain counts the price from the field pct (no app change, user 11.9.).
_rtb = _p18_sec(_RTL, "THE BEST MONEY CAN BUY")
_CS_SRC = ("To represent this each Rogue Trader cruiser and escort squadron may roll one random crew skill on [???] "
           "in the Remastered Rulebook for +10% point value.")
assert _CS_SRC in _p19_text(_RTL, _rtb), "Rogue Traders: the crew skill sentence is missing"
_rtbe = _RTL["secs"][_rtb]["ents"]
_xc = [e for e in _rtbe if e["l"] == "Xenotech System, rolled randomly (cruiser)"]
_xe = [e for e in _rtbe if e["l"] == "Xenotech System, rolled randomly (escort, per ship)"]
assert len(_xc) == 1 and len(_xe) == 1 and not any(e["l"].startswith("Crew skill") for e in _rtbe)
_CS_DESC = ("Roll D6 on the Crew Skills table (Rulebook p. 159) before the game and note the result. Cost: +10% of the "
            "unit's points (hull, options and refits), rounded up. (Fleets p. 175)")
_rtbe.extend([
    dict(l="Crew skill, rolled randomly (cruiser, +10% of its points)", r=None, p=None, pct=10, a=1, u=1, mx=None,
         nt=None, prose=1, k="up", cond=dict(_xc[0]["cond"]), desc=_CS_DESC, src_page=175),
    # A crew skill is not a refit, so the Fast Clipper's "Instead of taking a refit" does not apply to it.
    dict(l="Crew skill, rolled randomly (escort squadron, +10% of its points)", r=None, p=None, pct=10, a=1, u=1,
         mx=None, nt=None, prose=1, k="up",
         cond={k: v for k, v in _xe[0]["cond"].items() if k != "offopt"}, desc=_CS_DESC, src_page=175)])

# J86 p.233, 235, 237 ORDNANCE: "Ships with torpedo tubes are armed with normal and
# boarding torpedoes." The extraction dropped the sentence from three lists. On the Nurgle,
# Khorne and Slaanesh pages (241, 245, 249) the paragraph breaks off in the book itself before
# the sentence (T25, asked of the user).
_CT_SRC = "Ships with torpedo tubes are armed with normal and boarding torpedoes."
for _nm in ("Chaos — Incursion", "Chaos — Black Crusade", "Chaos — Tzeentch"):
    _L = _p18_list(_nm)
    _tx = _L["secs"][_p18_sec(_L, "ORDNANCE")].setdefault("text", [])
    assert _tx and _tx[0].startswith("Ships with launch bays") and not any("torpedo tubes" in t for t in _tx), _nm
    _tx.insert(1, _CT_SRC)
# T25 (the user's decision 11.9.2026): the Nurgle, Khorne and Slaanesh paragraph breaks off
# in the book (p.241 "Ships with torpedo", p.245 and 249 "can have a mixture"; page images).
# It is completed with the parallel lists' sentences (p.235), and the reader is told so.
_CL_SRC = ("Ships with launch bays can have a mixture of Swiftdeath fighters, Doomfire bombers and Dreadclaw "
           "assault craft.")
for _nm in ("Chaos — Nurgle", "Chaos — Khorne", "Chaos — Slaanesh"):
    _L = _p18_list(_nm)
    _tx = _L["secs"][_p18_sec(_L, "ORDNANCE")].setdefault("text", [])
    assert _tx and _tx[0].startswith("Ships with launch bays can have a mixture"), _nm
    assert not any("torpedo tubes" in t for t in _tx), _nm
    _tx[0] = _CL_SRC
    _tx.insert(1, _CT_SRC)
    _L["secs"][_p18_sec(_L, "ORDNANCE")].setdefault("notes", []).append(
        "The paragraph breaks off in the book; completed from the other Chaos fleet lists, Fleets p. 235.")

# v1.1 gaps in view (user 11.9.2026): rules the app does not yet
# enforce are shown in the fleet's checks as a warning (kind "notice").
_HOOK_LBL = "Gravitic hook capacity (Orcas, Wardens, Dhows): check by hand"
# The War Host's sentence breaks off mid-way in the book ("...for every starship in the fleet
# equipped with gravitic hooks" without a number), so there the capacity cannot be
# enforced without inventing a number. On the Tau lists the sentence is whole -> J95.
# J213 (the user 20.10.2026 asked to implement everything): the number is still missing, so the rule
# is read the Tau lists' way (p.454-457: as much as the hook capacity) and
# exceeding it shows yellow, not red - open interpretation T50.
_WH_HOOK = "Nicassar Dhows, Tau Wardens or Orcas can be taken for every starship in the fleet equipped with gravitic hooks."
_L = _p18_list("Demiurg — War Host")
_whe = _p18_sec(_L, "ESCORTS")
assert _WH_HOOK in _L["secs"][_whe].get("text", []), "War Host: the hook sentence is missing from the ESCORTS section"
_L["secs"][_whe].setdefault("rules", []).append(dict(
    kind="hook_capacity", ok=True, soft=True, label="Gravitic hook capacity (Orcas, Wardens and Dhows)",
    carry=[dict(sec=_p18_sec(_L, "Tau Escorts"), re="^(orca|warden)"),
           dict(sec=_p18_sec(_L, "Nicassar Escorts"), re="dhow")],
    caps=[0, 1, 2], src=_WH_HOOK,
    interp=dict(id="T50", note="Open interpretation: the War Host sentence (Fleets p. 487) gives no number. The app "
                "reads it as the Tau lists do (pp. 454-457): no more Orcas, Wardens and Dhows than the fleet's "
                "gravitic hook capacity, and shows going over it as a warning, not an error.")))

# J95 p.454/456: "You may not have more Orcas and Wardens than the gravitic hook
# capacity of the fleet." p.455/457: "You may not have more Dhows (or Orcas) than
# the gravitic hook capacity of the fleet." and p.457 also: "Gravitic hooks on a
# Custodian battleship or Emissary starship cannot count toward this total."
# The capacity is read from the profile: a hook row says itself what it carries.
_HOOK_CAP_RX = re.compile(r"capacity:\s*(\d+)", re.I)
_hk = 0
for _sh in ships.values():
    _any = _wrd = _dhw = 0
    for _a in (_sh.get("aw") or []):
        if "ravitic hook" not in str(_a[0]).lower():
            continue
        _txt = " ".join(str(_x) for _x in _a).lower()
        _m = _HOOK_CAP_RX.search(_txt)
        _n = int(_m.group(1)) if _m else 1
        if "orca" in _txt and "warden" in _txt:
            _any += _n
        elif "warden" in _txt:
            _wrd += _n
        elif "dhow" in _txt:
            _dhw += _n
        else:
            _any += _n
    if _any or _wrd or _dhw:
        _sh["hk"] = [_any, _wrd, _dhw]
        _hk += 1
assert _hk == 11, "11 gravitic hook hulls expected, found %d" % _hk

_HOOK_A = "You may not have more Orcas and Wardens than the gravitic hook capacity of the fleet."
_HOOK_B = {
    "Tau — Merchant Fleet":
        "You may not have more Dhows (or Orcas) than the gravitic hook capacity of the fleet. A ship may have "
        "either Orcas or Dhows, but not both so the gravitic hook capacity of the fleet is divided between Orcas "
        "and Dhows.",
    "Tau — Commerce Protection":
        "You may not have more Dhows (or Orcas) than the gravitic hook capacity of the fleet. Gravitic hooks on a "
        "Custodian battleship or Emissary starship cannot count toward this total.",
}
for _nm, _srcB in _HOOK_B.items():
    _L = _p18_list(_nm)
    _e, _nv = _p18_sec(_L, "ESCORTS"), _p18_sec(_L, "Nicassar Vessels")
    _L["secs"][_e].setdefault("rules", []).extend([
        dict(kind="hook_capacity", ok=True, label="Gravitic hook capacity (Orcas and Wardens)",
             carry=[dict(sec=_e, re="^(orca|warden)", _t="escorts")], caps=[0, 1], src=_HOOK_A),
        dict(kind="hook_capacity", ok=True, label="Gravitic hook capacity (Dhows and Orcas)",
             carry=[dict(sec=_e, re="^orca", _t="escorts"),
                    dict(sec=_nv, re="dhow", _t="nicassar vessels")], caps=[0, 2], src=_srcB)])
# J92's note about the Dominion reserves was removed on 14.9.2026 (J106): the reserves
# are now in the engine (a named permission res_ok + a cap of twelve cruisers),
# so "not yet in the app" would be wrong information. The book's sentence stays visible
# as section text.

# J88 p.236: "Any ship led by a Lord of Tzeentch (and not the Warmaster!) may be
# granted a Strand of Fortune." Attachment is not modelled (J8): at most as many Strands as
# Chaos Lords.
_TZ = _p18_list("Chaos — Tzeentch")
_tzf, _tzl = _p18_sec(_TZ, "FORCES OF CHAOS"), _p18_sec(_TZ, "Chaos Lords")
_ST_SRC = "Any ship led by a Lord of Tzeentch (and not the Warmaster!) may be granted a Strand of Fortune."
_TZ["secs"][_tzf].setdefault("rules", []).append(dict(
    kind="up_budget", ok=True, up_sec=_tzf, up_re="^Strand of Fortune", label="Strand of Fortune (one per Chaos Lord)",
    budget=[dict(pick=[dict(sec=_tzl, re="^chaos lord", _t="chaos lords")], units=1)], src=_ST_SRC))

# J89 p.318: "In order to take the Flame of Asuryan, an Eldar Hero must lead the
# fleet and be embarked aboard it." p.319 Yriel, Bearer of the Flame: "you may
# instead pick the Flame of Asuryan as his command ship to be embarked on."
_IY = _p18_list("Eldar — Iyanden Craftworld")
_iyd, _iyh, _iya = _p18_sec(_IY, "Dragonships"), _p18_sec(_IY, "Eldar Hero"), _p18_sec(_IY, "Autarch")
_FA_SRC = "In order to take the Flame of Asuryan, an Eldar Hero must lead the fleet and be embarked aboard it."
assert "an Eldar Hero must lead the" in _p19_text(_IY, _iyd), "Iyanden: the Flame sentence is missing"
_IY["secs"][_iyd].setdefault("rules", []).append(dict(
    kind="requires", ok=True, label="Flame of Asuryan needs an Eldar Hero (or Yriel)",
    if_pick=[dict(sec=_iyd, re="^flame of asuryan", _t="dragonships")],
    # Yriel is a row of the RESERVES AND ALLIES section (p.319): without this pick
    # the rule named him in its heading but rejected a Yriel + Flame fleet.
    then_pick=[dict(sec=_iyh, re="^eldar hero", _t="eldar hero"),
               dict(sec=_iya, re="bearer of the flame", _t="autarch"),
               dict(sec=_p18_sec(_IY, "RESERVES AND ALLIES"), re="^prince yriel", _t="reserves and allies")], min=1,
    src=_FA_SRC + " Yriel (Fleets p. 319): \"you may instead pick the Flame of Asuryan as his command ship\"."))

# J66 p.144: "If the fleet is above 750 points an Inquisitor Lord must lead the
# fleet. If an Inquisitorial Cruiser is present the Inquisitor Lord must be
# placed aboard it." One Inquisitor Lord leads the fleet (T19).
_GK = _p18_list("Grey Knights")
_gc = _p18_sec(_GK, "FLEET COMMANDER")
_GK["secs"][_gc].setdefault("rules", []).append(dict(
    kind="section_count", min=0, max=1, ok=True, sec=[_gc], label="Fleet commander (one Inquisitor Lord)",
    src="If the fleet is above 750 points an Inquisitor Lord must lead the fleet. If an Inquisitorial Cruiser "
        "is present the Inquisitor Lord must be placed aboard it."))





# --- 1.1 phase 4: the Inquisition in the host fleet (Fleets p.138) -----------
# "The Inquisition has no fleet list on its own. Instead, there are various
# ways to add an Inquisitor or Inquisitorial ships to the Imperial factions."
#
# In the app the Inquisition is a list of its own (saves and cards work,
# decision T29), but the book's way is to attach it to the host fleet.
# This adds an attachment section to the eight lists the book names: "any
# Imperial Navy, Space Marine or Adeptus Mechanicus fleet".
#
# The Grey Knights Battle barge is NOT included: it needs an Ordo Malleus
# inquisitor (p.138, p.145), which these lists' commander sections do not
# have. It stays on the Grey Knights list, where the condition is modelled (J83).
_INQ_LORD = ("Any Imperial or Space Marine fleet 750 points or greater may be "
             "led by an Inquisitor Lord.")
_INQ_CRUISER = ("Any Imperial or Space Marine fleet may include a single "
                "Inquisitorial Cruiser in the fleet, which takes the place of a "
                "battlecruiser or strike cruiser in the fleet.")
_INQ_BLACK = ("A fleet may include a single Blackship, which as a special "
              "vessel does not count toward or against other ship limits in the "
              "fleet.")
_INQ_GK = ("If an Inquisitor Lord is leading the fleet, up to one Grey Knights "
           "Strike Cruiser may be taken for every 500 points in the fleet.")
_INQ_INTRO = ("A single Inquisitorial cruiser led by an Inquisitor can be taken "
              "as reserves by any Imperial Navy, Space Marine or Adeptus "
              "Mechanicus fleet; or an Inquisitor and his retinue may be "
              "embarked on a single Rogue Trader cruiser.")
_INQ_RR = ("An Inquisitor Lord gets one re-roll, which may be used for any ship in "
           "the fleet.")
_INQ_RR2 = "A second re-roll can be purchased for +25 points."
# J148 (a user report 25.9.): the Inquisitorial Cruiser "takes the place of a
# battlecruiser or strike cruiser in the fleet" (p.138), and the Blackship is the only
# Inquisition ship that "does not count toward or against other ship limits"
# - the exception would be empty unless the others counted. The Grey Knights Strike Cruiser
# is a cruiser, and p.14: "the restrictions on maximum and minimum numbers of
# ships are determined for the fleet as a whole, regardless of whether they
# were purchased from the list or as reserves". The attachment section's rows would
# otherwise not count towards the host's limits at all (matches() counts its own row only
# in its own section), so picks are added as for the renegades (J141) and
# the Ordo Malleus reserves (J144).
_INQ_CRU_RE = "^inquisitorial cruiser"
_INQ_GKSC_RE = "^grey knights strike cruiser"
def _inq_limits(L, inq):
    t = [x["t"].strip().lower() for x in L["secs"]]
    cru = t.index("cruisers") if "cruisers" in t else None
    hits = []
    for _x in L["secs"]:
        for _r in _x.get("rules") or []:
            _cap = _r.get("max") if _r["kind"] == "section_count" else (
                _r.get("max_unmet") if _r["kind"] == "conditional_cap" else None)
            if cru is not None and _r.get("sec") == [cru] and _cap in (10, 12):
                # Imperial Navy 0-12: the GK strike cruiser is a cruiser, the Inquisitorial
                # Cruiser a battlecruiser and does not count here. Space Marine
                # 0-10 Cruisers: both take a strike cruiser's place.
                add = [dict(sec=inq, re=_INQ_GKSC_RE)]
                if _cap == 10:
                    add.append(dict(sec=inq, re=_INQ_CRU_RE))
                _r["pick"] = list(_r.get("pick") or [dict(sec=cru)]) + add
                hits.append("cru%d" % _cap)
            if _r["kind"] != "ratio":
                continue
            per = list(_r.get("per_pick") or [dict(sec=j) for j in (_r.get("per_sec") or [])])
            allow = list(_r.get("allow_pick") or [dict(sec=j) for j in (_r.get("allow_sec") or [])])
            if cru is None or not any(q["sec"] == cru and not q.get("re") for q in per):
                continue
            if any(t[q["sec"]] == "battlecruisers" or "battlecruiser|grand" in (q.get("re") or "") for q in allow):
                # "one battlecruiser for every two cruisers": the Inquisitorial Cruiser
                # takes a battlecruiser's place, the GK strike cruiser is a base cruiser.
                _r["allow_pick"] = allow + [dict(sec=inq, re=_INQ_CRU_RE)]
                _r["per_pick"] = per + [dict(sec=inq, re=_INQ_GKSC_RE)]
                hits.append("bc")
            else:
                # "one battleship for every three cruisers or battlecruisers":
                # both count towards the base.
                _r["per_pick"] = per + [dict(sec=inq, re=_INQ_GKSC_RE), dict(sec=inq, re=_INQ_CRU_RE)]
                hits.append("bs")
    return sorted(hits)
_INQ_HOSTS = ("Imperial Navy \u2014 Gothic Sector", "Imperial Navy \u2014 Bastion Fleets",
              "Imperial Navy \u2014 Armageddon Sector", "Imperial Navy \u2014 Bakka Sector",
              "Space Marines \u2014 Codex Astartes", "Space Marines \u2014 Crusade",
              "Space Marines \u2014 Dominion", "Adeptus Mechanicus \u2014 Explorator")
_inq_n = 0
_inq_at = {}
for _nm in _INQ_HOSTS:
    _L = _p18_list(_nm)
    assert not any(e.get("r") == 150 for x in _L["secs"] for e in x["ents"]), \
        "%s: the Inquisitorial Cruiser already exists" % _nm
    # The host's own COMMANDER section is the one the commander requirement concerns - not any
    # section with a k="cmd" row (on Bastion Fleets the Veteran
    # Captains is one too, but it is a per-ship upgrade).
    _cmds = set()
    for _x in _L["secs"]:
        for _r in (_x.get("rules") or []):
            if _r.get("kind") != "mandatory_at":
                continue
            for _q in (_r.get("pick") or []):
                _cmds.add(_q["sec"])
            for _j in (_r.get("sec") or []):
                _cmds.add(_j)
    _cmds = [i for i in sorted(_cmds)
             if any(e.get("k") == "cmd" for e in _L["secs"][i]["ents"])]
    assert len(_cmds) == 1, "%s: commander sections %s" % (_nm, _cmds)
    _cmd = _cmds[0]
    _i = len(_L["secs"])
    _ents = [
        dict(l="Inquisitor Lord (Ld 9)", r=None, p=75, src_page=138, a=1, mx=1,
             nt=None, k="cmd", ld=dict(kind="fixed", value=9), rr=1),
        _p18_unit("Inquisitorial Cruiser", 150, 270, 138, mx=1),
        _p18_unit("Inquisition Blackship", 148, 300, 138, mx=1),
        _p18_unit("Grey Knights Strike Cruiser", 151, 165, 138),
        # p.138: "A second re-roll can be purchased for +25 points." The same row
        # as on the Inquisition list; the target is the Lord's row (index 0). At the end,
        # so that old saves' rows keep their indexes.
        dict(l="One extra re-roll", r=None, p=25, src_page=138, a=1, u=1, mx=None,
             nt=None, prose=1, k="up", grp="rr", at=[[_i, 0]], rr=1),
    ]
    _rules = [
        dict(kind="allowed_at", points=750, ok=True, sec=[_i],
             label="Inquisitor Lord (from 750 pts)",
             pick=[dict(sec=_i, re="^inquisitor lord")], src=_INQ_LORD),
        dict(kind="per_points", each=1, per=500, ok=True, sec=[_i],
             label="Grey Knights Strike Cruisers (one per 500 pts, with an Inquisitor Lord)",
             pick=[dict(sec=_i, re="^grey knights strike cruiser")],
             cond_pick=[dict(sec=_i, re="^inquisitor lord")], src=_INQ_GK),
        # The Inquisitor Lord LEADS the fleet, so he is not taken besides the fleet's own
        # commander but instead of him - the same structure as the Eldar Hero
        # (p.316, a cap rule across two sections).
        dict(kind="cap", max=1, ok=True, sec=[_i],
             label="Fleet commander (the list's own or an Inquisitor Lord)",
             pick=[dict(sec=_cmd), dict(sec=_i, re="^inquisitor lord")],
             src=_INQ_LORD),
    ]
    _L["secs"].append(dict(t="THE INQUISITION", text=[_INQ_INTRO, _INQ_CRUISER,
                                                      _INQ_BLACK, _INQ_RR, _INQ_RR2],
                           ents=_ents, rules=_rules))
    _inq_at[_nm] = _i
    # The host's commander requirement is also met by the Inquisitor Lord.
    _md = [r for x in _L["secs"] for r in (x.get("rules") or [])
           if r.get("kind") == "mandatory_at"]
    for _r in _md:
        _pick = _r.get("pick") or [dict(sec=j) for j in (_r.get("sec") or [])]
        _r["pick"] = list(_pick) + [dict(sec=_i, re="^inquisitor lord")]
    _inq_n += 1
assert _inq_n == 8, _inq_n
print("Inquisition attached to %d host lists (p.138)" % _inq_n)


# --- 1.1 phase 4: Bastion Fleets' Chaos reserves (Fleets p.39) ---------------
# "However, since a reserve fleet also draws on very old or scarce vessels,
# you may also use your reserve choices to select any of the following Chaos
# vessels if you so wish." Five hulls by name, and the ratio is the book's general one:
# "These 'reserve' vessels are picked in the normal manner, so for every three
# vessels of a given type which you choose from the main fleet list, you may
# pick one vessel of that type from another Imperial list, or from the above
# selection of Chaos vessels (but not both)."
#
# The prices are not on p.39 at all; they are read from the Chaos lists, where they
# are the same on every list (Repulsive 230, Executor 210, Hades 200, Carnage
# 180, Murder 170). The variant ban p.39: "you cannot pick any of the ship
# class variants described since these are described for vessels who have
# already turned traitor" -> noopt.
_BAST_SRC = ("However, since a reserve fleet also draws on very old or scarce "
             "vessels, you may also use your reserve choices to select any of "
             "the following Chaos vessels if you so wish.")
_BAST_RATIO = ("These 'reserve' vessels are picked in the normal manner, so for "
               "every three vessels of a given type which you choose from the "
               "main fleet list, you may pick one vessel of that type from "
               "another Imperial list, or from the above selection of Chaos "
               "vessels (but not both).")
_BAST_NOVAR = ("Reserve vessels use all their normal rules and keep their "
               "particular ordnance types (i.e. Chaos ordnance is used on Chaos "
               "ships picked in a reserve fleet) but you cannot pick any of the "
               "ship class variants described since these are described for "
               "vessels who have already turned traitor and hence obviously no "
               "longer in Imperial service!")
_BAST = _p18_list("Imperial Navy \u2014 Bastion Fleets")
_bsec = _p18_sec(_BAST, "THE RESERVE FLEETS OF SEGMENTUM OBSCURUS")
assert not _BAST["secs"][_bsec]["ents"], "Bastion's reserve section already has rows"
_BAST["secs"][_bsec].setdefault("notes", []).append(
    "Page 39 names these five Chaos hulls but prints no prices; the builder "
    "uses each hull's price from the Chaos fleet lists.")
_BAST["secs"][_bsec]["ents"] = [
    # `nt` prints on the card's base row in the middle of English text,
    # so the builder's own note belongs in the section's Builder's notes channel.
    # A Finnish sentence was here, and it showed on the player's card.
    _p18_unit("Repulsive class grand cruiser", 269, 230, 39),
    _p18_unit("Executor class grand cruiser", 271, 210, 39),
    _p18_unit("Hades class heavy cruiser", 274, 200, 39),
    _p18_unit("Carnage class cruiser", 277, 180, 39),
    _p18_unit("Murder class cruiser", 279, 170, 39),
]
# The ban concerns only class variants, not every option (review
# 16.9.): p.12 defines a variant as ships that "mount different
# weaponry to its counterparts". The Repulsive's ancient targeting systems are
# the Bringer of Despair's armament and the Murder's FP4 + lances the Plagueclaw's;
# the Repulsive's third shield does not change the armament, so it stays choosable.
_BAST_VARIANT = {269: r"ancient targeting systems", 279: r"replace its Firepower 10 weapons batteries"}
for _e in _BAST["secs"][_bsec]["ents"]:
    if _e["r"] in _BAST_VARIANT:
        _hit = [o for o in (ships[str(_e["r"])].get("ol") or []) if re.search(_BAST_VARIANT[_e["r"]], o.get("t") or "", re.I)]
        assert len(_hit) == 1, "%s: variant options %d" % (_e["l"], len(_hit))
        _e["optno"] = _BAST_VARIANT[_e["r"]]
assert sum(1 for _e in _BAST["secs"][_bsec]["ents"] if _e.get("optno")) == 2
# The section already has the book's own extraction of the same sentences, so the curated ones
# are added only if they are missing (a finding of the review 14.9.2026).
add_text(_BAST["secs"][_bsec], [_BAST_SRC, _BAST_RATIO, _BAST_NOVAR])
print("Bastion's Chaos reserves added: %d hulls (p.39)"
      % len(_BAST["secs"][_bsec]["ents"]))


# --- J144: the Ordo Malleus inquisitor and Bastion's Chaos hulls (Fleets p.142)
# The user's decision 16.9.: done together with Strange happenings (J143).
#
# p.140: "The listed cost is added to that of the Inquisitor Lord, and its
# benefits apply to the ship they are embarked upon." The host lists had only
# the Inquisitor Lord (J104), so a "fleet led by an Ordo Malleus Inquisitor" was not
# possible. The Ordo Malleus row is added to five Imperial Navy and
# Adeptus Mechanicus hosts - the p.142 route concerns only them. It is not added to the Space
# Marine hosts: there Ordo Malleus would open the Grey Knights
# Battle barge (p.138), which by J83 is a matter of the Grey Knights list.
#
# p.142 Reserve/allies: "For no change in their cost, a fleet led by an Ordo
# Malleus Inquisitor may take as reserves any Chaos ship listed in the Bastion
# Fleet List" - five hulls from p.39 at the same prices. They go into the host's own
# reserve section (ct "reserve"), so they use the same 1:3 budget as
# other reserves and cannot be lent on (p.15). No section is added to Bastion:
# its own p.39 section already offers the same hulls without an inquisitor.
_OM_T = "ORDO MALLEUS INQUISITORS"
_OM_RES_T = "ORDO MALLEUS RESERVES"
_OM_ROUTE = ("An Imperial Navy or Adeptus Mechanicus fleet led by an Inquisitor "
             "that does not include Space Marine vessels may has the following "
             "addition to its reserves and/or allies rules: For no change in their "
             "cost, a fleet led by an Ordo Malleus Inquisitor may take as reserves "
             "any Chaos ship listed in the Bastion Fleet List on p.37 of the "
             "Remastered Fleetbook.")
_OM_FREE = ("These vessels are free of the “Strange Happenings” special rule "
            "as long as the Inquisitor’s ship remains in play, but the fleet may "
            "not take any Grey Knights vessels!")
_OM_HNR = ("Hit and Run attacks from this ship add +1 to their roll, and such "
           "attacks against this ship subtract -1 from their roll.")
# The Wards' limit (p.142). The extraction's sentence filter dropped this, so the card
# ended in "etc." without the limit, and a CSM-crewed ship's +boarding could have
# read as cancelled (review 16.9.).
_OM_CSM = ("Rules for Chaos Space Marines still apply normally, and any other special "
           "rules and effects such as the Forces of Chaos listed on pg.158 of the "
           "Rulebook remain unaffected.")
# p.140: the Ordo's price and benefits belong to the Inquisitor Lord's own ship.
# On a host list's card the Ordo row is its own commander card, so the sentence
# prints on it; on the Inquisition list it is already in section 13.
_OM_EMBARK = ("The listed cost is added to that of the Inquisitor Lord, and its "
              "benefits apply to the ship they are embarked upon.")
_IQL = _p18_list("The Emperor's Inquisition")
_iq_om = _IQL["secs"][_p18_sec(_IQL, _OM_T)]
assert [e["l"] for e in _iq_om["ents"]] == ["Ordo Malleus Inquisitor Lord"], _iq_om["ents"]
assert len(_iq_om.get("own") or []) == len(_iq_om["text"]), "Ordo Malleus: own and text differ in length"
# The extraction lacked the p.142 Hit and Run sentence that Ordo Hereticus has
# (p.140). The book's sentence, added with its owner to both copies.
if not any(_text_key(_OM_HNR) in _text_key(t) for t in _iq_om["text"]):
    _iq_om["text"].insert(1, _OM_HNR)
    _iq_om["own"].insert(1, "Ordo Malleus Inquisitor Lord")
if not any(_text_key(_OM_CSM) in _text_key(t) for t in _iq_om["text"]):
    _slaa = [i for i, t in enumerate(_iq_om["text"]) if t.startswith("Marks of Slaanesh")]
    assert len(_slaa) == 1, _slaa
    _iq_om["text"].insert(_slaa[0] + 1, _OM_CSM)
    _iq_om["own"].insert(_slaa[0] + 1, "Ordo Malleus Inquisitor Lord")
_OM_HOSTS = ("Imperial Navy — Gothic Sector", "Imperial Navy — Bastion Fleets",
             "Imperial Navy — Armageddon Sector", "Imperial Navy — Bakka Sector",
             "Adeptus Mechanicus — Explorator")
_bast_rows = _BAST["secs"][_bsec]["ents"]
assert len(_bast_rows) == 5 and sum(1 for e in _bast_rows if e.get("optno")) == 2, "Bastion's p.39 rows changed"
_om_n = 0
_om_res_n = 0
_om_res_at = {}
for _nm in _OM_HOSTS:
    _L = _p18_list(_nm)
    _inq = _p18_sec(_L, "THE INQUISITION")
    _om = len(_L["secs"])
    _row = dict(_iq_om["ents"][0])
    _row["ld"] = dict(_row["ld"])
    _row["mx"] = 1
    _L["secs"].append(dict(
        t=_OM_T, text=[_OM_EMBARK] + list(_iq_om["text"]),
        own=["Ordo Malleus Inquisitor Lord"] + list(_iq_om["own"]), notes=[],
        ents=[_row],
        rules=[dict(kind="requires", ok=True,
                    label="Ordo Malleus Inquisitor needs an Inquisitor Lord",
                    if_pick=[dict(sec=_om, re="^ordo malleus")],
                    then_pick=[dict(sec=_inq, re="^inquisitor lord")], min=1,
                    src=_OM_EMBARK)]))
    _om_n += 1
    if _nm == "Imperial Navy \u2014 Bastion Fleets":
        continue
    _res = len(_L["secs"])
    _om_res_at[_nm] = _res
    # Space Marine ships: those borrowed from another race's list (race pick) and
    # the list's own Space Marine rows (Armageddon's starred ones, p.41).
    _sm = [dict(race="space marines")]
    for _j, _x in enumerate(_L["secs"]):
        if any(e.get("k") == "unit" and re.search(r"[^*]\*$", e["l"]) for e in _x["ents"]):
            _sm.append(dict(sec=_j, re=r"[^*]\*$"))
    assert (len(_sm) > 1) == (_nm == "Imperial Navy \u2014 Armageddon Sector"), \
        "%s: %d starred Space Marine rows in the section" % (_nm, len(_sm) - 1)
    _L["secs"].append(dict(
        # Both sentences are the src of rules in the "Checked by the builder"
        # group; as section text they would repeat in the "Check yourself" group.
        t=_OM_RES_T, text=[],
        notes=["Page 142 names no hulls: it points to the Chaos ships of the Bastion "
               "Fleet List, which are the five of page 39, at the same prices."],
        ents=[dict(_p18_unit(e["l"], e["r"], e["p"], 142), **({"optno": e["optno"]} if e.get("optno") else {}))
              for e in _bast_rows],
        rules=[
            dict(kind="requires", ok=True, what="an Ordo Malleus Inquisitor",
                 label="Chaos reserves need an Ordo Malleus Inquisitor",
                 if_pick=[dict(sec=_res)],
                 then_pick=[dict(sec=_om, re="^ordo malleus")], min=1, src=_OM_ROUTE),
            dict(kind="conditional_cap", ok=True,
                 label="No Space Marine vessels with Ordo Malleus Chaos reserves",
                 pick=_sm, cond_pick=[dict(sec=_res)], max_met=0, max_unmet=None,
                 src=_OM_ROUTE),
            dict(kind="conditional_cap", ok=True,
                 label="No Grey Knights vessels with Ordo Malleus Chaos reserves",
                 pick=[dict(hull="^GREY KNIGHTS")], cond_pick=[dict(sec=_res)],
                 max_met=0, max_unmet=None, src=_OM_FREE),
        ]))
    _om_res_n += 1
assert _om_n == 5 and _om_res_n == 4, (_om_n, _om_res_n)
print("Ordo Malleus: %d hosts, Chaos reserves for %d hosts (p.142)" % (_om_n, _om_res_n))


# Bakka's own reserve rule (p.50) now overlaps the general rule:
# the engine enforces the same 1:3 ratio over the whole fleet, and the per-list
# rule counted only the RESERVES section's rows. Two red rows from the same
# error are worse than one, so the per-list one is removed and its
# sentence stays visible as text.
_BAKKA = _p18_list("Imperial Navy — Bakka Sector")
_bkr = _p18_sec(_BAKKA, "RESERVES")
_dup = [r for r in _BAKKA["secs"][_bkr]["rules"]
        if r.get("label") == "Reserve cruisers, battlecruisers and grand cruisers"]
assert len(_dup) == 1, "Bakka reserve rules %d" % len(_dup)
_BAKKA["secs"][_bkr]["rules"] = [r for r in _BAKKA["secs"][_bkr]["rules"]
                                 if r is not _dup[0]]
add_text(_BAKKA["secs"][_bkr], [_dup[0]["src"]])
print("Bakka's overlapping reserve rule removed (the general rule p.14 enforces it)")

# The reserve sections' hulls into the fleet's limits (J144, review 16.9.). After
# this, because Bakka's removed reserve rule was also cruiser-based. p.14: "the
# restrictions on maximum and minimum numbers of ships are determined for the
# fleet as a whole, regardless of whether they were purchased from the list or
# as reserves." The engine counts a list's own row only in its own section,
# so 12 Lunars and a Carnage showed "Cruisers 12 / 12" - the same defect was already
# in Bastion's p.39 section. As for the renegades (J141): a pick is added
# to the rules. The split comes from Bastion's own page, whose hulls these are
# (p.37): cruisers (Hades, Carnage, Murder) into the 0-12 limit and the base of the battleship
# and battlecruiser ratios; "Grand Cruisers do not count as
# cruisers for purposes of fielding battleships", and they share the "one
# battlecruiser or grand cruiser ... for every two cruisers" slot.
_RES_CRU = "^(hades|carnage|murder) class"
_RES_GC = "grand cruiser"
def _reserve_limits(L, rsec):
    t = [x["t"].strip().lower() for x in L["secs"]]
    cru = t.index("cruisers")
    hits = []
    for _x in L["secs"]:
        for _r in _x.get("rules") or []:
            if _r["kind"] == "section_count" and _r.get("max") == 12 and _r.get("sec") == [cru]:
                _r["pick"] = list(_r.get("pick") or [dict(sec=cru)]) + [dict(sec=rsec, re=_RES_CRU)]
                hits.append("0-12")
            if _r["kind"] != "ratio":
                continue
            per = list(_r.get("per_pick") or [dict(sec=j) for j in (_r.get("per_sec") or [])])
            allow = list(_r.get("allow_pick") or [dict(sec=j) for j in (_r.get("allow_sec") or [])])
            if not any(q["sec"] == cru and not q.get("re") for q in per):
                continue
            _r["per_pick"] = per + [dict(sec=rsec, re=_RES_CRU)]
            if any(t[q["sec"]] == "battlecruisers" or "battlecruiser|grand" in (q.get("re") or "") for q in allow):
                _r["allow_pick"] = allow + [dict(sec=rsec, re=_RES_GC)]
                hits.append("bc")
            else:
                hits.append("bs")
    return sorted(hits)
_lim = {}
for _nm, _rs in _om_res_at.items():
    _lim[_nm] = _reserve_limits(_p18_list(_nm), _rs)
_lim["Imperial Navy — Bastion Fleets"] = _reserve_limits(_BAST, _bsec)
assert _lim == {
    "Imperial Navy — Gothic Sector": ["0-12", "bc", "bs"],
    "Imperial Navy — Armageddon Sector": ["0-12", "bc", "bs"],
    "Imperial Navy — Bakka Sector": ["0-12", "bc", "bs"],
    "Adeptus Mechanicus — Explorator": ["bs"],
    "Imperial Navy — Bastion Fleets": ["0-12", "bc", "bs"],
}, _lim
print("reserve section hulls into the limits: %d rules" % sum(len(v) for v in _lim.values()))



# --- 1.1 phase 4: the Rogue Traders' xenos allies (Fleets p.175) ------------
# "For every 750 points in the fleet, Rogue Traders may be accompanied by a
# single Demiurg or Kroot vessel unless the fleet is using auxiliary ships
# that cannot be allies with the Demiurg or Kroot (such as Space Marines)."
#
# The XENOS ALLIES section exists on the list and the sentence as its text, but the rows
# were missing. The prices are read from the Demiurg and Tau lists (p.487, p.494).
# The sentence does not say "or part thereof", so 750 is read as FULL - unlike
# e.g. p.174's "for every 750 points or part thereof".
#
# The exception clause's condition ("such as Space Marines") is not needed on this list:
# a Space Marine row is only on the Pirates and Wolf Packs list (p.179), which
# has its own xenos rules. The Exploration list says on p.176 explicitly that its
# own rules replace this, and they are already in the data (p.177).
_RTX_SRC = ("For every 750 points in the fleet, Rogue Traders may be "
            "accompanied by a single Demiurg or Kroot vessel unless the fleet "
            "is using auxiliary ships that cannot be allies with the Demiurg "
            "or Kroot (such as Space Marines).")
_RTX = _p18_list("Rogue Traders")
_rtx = _p18_sec(_RTX, "XENOS ALLIES")
assert not _RTX["secs"][_rtx]["ents"], "RT: the XENOS ALLIES section already has rows"
_RTX["secs"][_rtx].setdefault("notes", []).append(
    "Page 175 allows a Demiurg or Kroot vessel but names no classes and prints "
    "no prices; the builder offers the Demiurg fleet list's vessels at their "
    "prices there (page 487).")
_RTX["secs"][_rtx]["ents"] = [
    _p18_unit("Stronghold Commerce Vessel", 488, 350, 175),
    _p18_unit("Bastion Commerce Vessel", 489, 255, 175),
    _p18_unit("Citadel Commerce Vessel", 490, 185, 175),
    _p18_unit("Kroot Warsphere", 494, 145, 175),
]
_RTX["secs"][_rtx]["rules"] = list(_RTX["secs"][_rtx].get("rules") or []) + [dict(
    kind="per_points", each=1, per=750, full=True, ok=True, sec=[_rtx],
    label="Demiurg and Kroot vessels (one per full 750 pts)",
    pick=[dict(sec=_rtx)], src=_RTX_SRC)]
print("the Rogue Traders' xenos allies added: %d hulls (p.175)"
      % len(_RTX["secs"][_rtx]["ents"]))

# --- 1.1 phase 4: Bakka's Rogue Trader cruiser (Fleets p.50) ----------------
# "One Rogue Trader cruiser and its attendant escorts may be taken for every
# 750 points in the fleet." The same reading as p.175: no "or part
# thereof", so full 750s. The escorts ("attendant escorts") stay
# text: they are the Rogue Trader list's own squadron rule (p.174).
_BKRT_SRC = ("One Rogue Trader cruiser and its attendant escorts may be taken "
             "for every 750 points in the fleet.")
_BK = _p18_list("Imperial Navy \u2014 Bakka Sector")
assert not any(e.get("r") == 180 for x in _BK["secs"] for e in x["ents"]), \
    "Bakka: the Rogue Trader Cruiser already exists"
_bkrt = len(_BK["secs"])
_BK["secs"].append(dict(t="ROGUE TRADERS", text=[_BKRT_SRC],
                        ents=[_p18_unit("Rogue Trader Cruiser", 180, 185, 50)],
                        rules=[dict(kind="per_points", each=1, per=750, full=True,
                                    ok=True, sec=[_bkrt],
                                    label="Rogue Trader cruisers (one per full 750 pts)",
                                    pick=[dict(sec=_bkrt)], src=_BKRT_SRC)]))
print("Bakka's Rogue Trader cruiser added (p.50)")


# --- 1.1 phase 4: the Chaos renegades (Fleets p.222) -----------------------
# "RENEGADE IMPERIAL VESSELS ... For every 1,500 points in a Chaos fleet, one
# cruiser from any Imperial Navy fleet list up to 185 points and/or up to six
# Imperial Navy escorts may be taken. Special weapon rules, Nova Cannon,
# Chaos Lords, Chaos Space Marines, Chaos ordnance or Daemonship upgrades may
# not be taken for Imperial Navy vessels used in this manner, and cruisers
# suffer -1Ld for going renegade. Imperial Navy escorts need not be in a
# single squadron and may be interspersed within other Chaos escort squadrons
# if desired. These vessels may not take any upgrade listed in their profile
# and do not count as reserves; they count as Chaos vessels in all respects."
#
# Page 222 is Chaos's SPECIAL RULES page, which fell outside the lists' rules window
# (lists.py rules_pages, six pages). It is not widened:
# growing the window would bring dozens of pages of narrative to twelve
# lists. The section and its sentence are recorded here directly, so the player sees
# exactly the same text.
#
# "they count as Chaos vessels in all respects" -> the rows are the Chaos list's
# own, so they are not reserves and the race gate does not concern them, and they
# count towards the list's own cruiser and escort limits (section_count.pick).
# "may not take any upgrade listed in their profile" -> noopt.
_REN_SRC = ("For every 1,500 points in a Chaos fleet, one cruiser from any "
            "Imperial Navy fleet list up to 185 points and/or up to six "
            "Imperial Navy escorts may be taken.")
_REN_SRC2 = ("Special weapon rules, Nova Cannon, Chaos Lords, Chaos Space "
             "Marines, Chaos ordnance or Daemonship upgrades may not be taken "
             "for Imperial Navy vessels used in this manner, and cruisers "
             "suffer -1Ld for going renegade. Imperial Navy escorts need not "
             "be in a single squadron and may be interspersed within other "
             "Chaos escort squadrons if desired. These vessels may not take "
             "any upgrade listed in their profile and do not count as "
             "reserves; they count as Chaos vessels in all respects.")
# The Imperium's hulls: cruisers at most 185 points and escorts. The prices
# are the Imperial Navy lists' own; Space Marine hulls are not included,
# because the book says "Imperial Navy fleet list" and "Imperial Navy escorts".
_REN_CRUISERS = [("Tyrant class cruiser", 69, 185), ("Gothic class cruiser", 70, 180),
                 ("Lunar class cruiser", 71, 180), ("Defiant class light cruiser", 76, 120),
                 ("Endeavour class light cruiser (Bakka)", 73, 115),
                 ("Endurance class light cruiser (Bakka)", 75, 115),
                 ("Dauntless class light cruiser", 77, 110),
                 ("Endeavour class light cruiser", 72, 110),
                 ("Endurance class light cruiser", 74, 110),
                 ("Siluria class light cruiser", 78, 100)]
_REN_ESCORTS = [("Firestorm class frigate", 79, 40), ("Sword class frigate", 82, 35),
                ("Falchion class frigate", 80, 35), ("Havoc class frigate", 81, 35),
                ("Viper class destroyer", 83, 35), ("Cobra class destroyer", 84, 30)]
_REN_CRU_RE = "^(tyrant|gothic|lunar|defiant|endeavour|endurance|dauntless|siluria)"
_REN_ESC_RE = "^(firestorm|sword|falchion|havoc|viper|cobra)"
_ren_n = 0
for _nm in ("Chaos \u2014 Incursion", "Chaos \u2014 Black Crusade", "Chaos \u2014 Tzeentch",
            "Chaos \u2014 Nurgle", "Chaos \u2014 Khorne", "Chaos \u2014 Slaanesh"):
    _L = _p18_list(_nm)
    assert not any(e.get("r") == 69 for x in _L["secs"] for e in x["ents"]), \
        "%s: the renegades already exist" % _nm
    _i = len(_L["secs"])
    _ents = ([_p18_unit(_l, _r, _p, 222, noopt=True) for _l, _r, _p in _REN_CRUISERS]
             + [_p18_unit(_l, _r, _p, 222, noopt=True) for _l, _r, _p in _REN_ESCORTS])
    _L["secs"].append(dict(t="RENEGADE IMPERIAL VESSELS", text=[_REN_SRC, _REN_SRC2],
        ents=_ents, rules=[
            dict(kind="per_points", each=1, per=1500, full=True, ok=True, sec=[_i],
                 label="Renegade Imperial cruisers (one per full 1,500 pts)",
                 pick=[dict(sec=_i, re=_REN_CRU_RE)], src=_REN_SRC),
            dict(kind="per_points", each=6, per=1500, full=True, ok=True, sec=[_i],
                 label="Renegade Imperial escorts (up to six per full 1,500 pts)",
                 pick=[dict(sec=_i, re=_REN_ESC_RE)], src=_REN_SRC)]))
    # "they count as Chaos vessels in all respects": the list's own cruiser and
    # escort limits count these in.
    _cru = [i for i, x in enumerate(_L["secs"]) if x["t"].strip().lower() == "cruisers"]
    assert len(_cru) == 1, "%s: Cruisers sections %d" % (_nm, len(_cru))
    _esc = [i for i, x in enumerate(_L["secs"]) if x["t"].strip().lower() == "escorts"]
    assert len(_esc) == 1, "%s: ESCORTS sections %d" % (_nm, len(_esc))
    _hit = 0
    for _r in _L["secs"][_cru[0]].get("rules") or []:
        if _r.get("kind") == "section_count":
            _r["pick"] = [dict(sec=_cru[0]), dict(sec=_i, re=_REN_CRU_RE)]
            # The whole p.222 paragraph stuck to the end of the "0-12 Cruisers" row
            # without a separator, and the legality panel showed its limit
            # as its own sentence ("0-12 Cruisers Special weapon rules, Nova
            # Cannon, ..."). The rule's src is the channel of the book's sentence, so it
            # stays the book's row, and the builder's explanation of why the
            # renegades count belongs in the Builder's notes channel
            # (J121) - check_pages.py rejected the first attempt, which
            # wrote the explanation into src.
            _L["secs"][_cru[0]].setdefault("notes", []).append(
                "Renegade Imperial cruisers taken under Renegade Imperial "
                "Vessels count toward this limit too: the book says they count "
                "as Chaos vessels in all respects (Fleets p. 222).")
            _hit += 1
    assert _hit == 1, "%s: cruiser limits %d" % (_nm, _hit)
    # The same reasoning as for the cruiser limit: "they count as Chaos vessels in
    # all respects" (p.222). The review 16.9. found that a renegade counted
    # towards the 0-12 limit but not towards the ratios "one battleship for every three
    # cruisers or heavy cruisers" - three Murders and a renegade Lunar gave
    # zero battleships instead of one.
    _ratio = 0
    for _sx in _L["secs"]:
        for _r in _sx.get("rules") or []:
            if _r.get("kind") != "ratio" or _r.get("per_pick"):
                continue
            if _cru[0] not in (_r.get("per_sec") or []):
                continue
            _r["per_pick"] = ([dict(sec=_x) for _x in _r["per_sec"]]
                              + [dict(sec=_i, re=_REN_CRU_RE)])
            _ratio += 1
    assert _ratio == 3, "%s: ratios counting cruisers %d" % (_nm, _ratio)
    for _r in _L["secs"][_esc[0]].get("rules") or []:
        if _r.get("kind") == "squadron" and not _r.get("pick"):
            _r["pick"] = [dict(sec=_esc[0]), dict(sec=_i, re=_REN_ESC_RE)]
    _ren_n += 1
assert _ren_n == 6, _ren_n
print("the Chaos renegades added to %d lists (p.222)" % _ren_n)

# ---------------------------------------------- race and ship type (p.14-15)
# Fleets p.14: "Reserve vessels ... must come from the same 'race'. For the
# purpose of the game, the races are: Imperial Navy (including Adeptus
# Mechanicus), Space Marines, Chaos (including Chaos Space Marines), Eldar,
# Craftworld Eldar, Dark Eldar, Orks, Necrons, Tyranids and Tau (including
# Tau allies)."
#
# The list is CLOSED ("the races are"). A list not in it gets no
# race at all: it reaches another fleet only through its own list rule,
# and p.15 says it may then not also be taken as a reserve
# ("These may only be taken exactly as described on their fleet list rules
# and may not also be taken as reserves"). Rogue Traders (p.174), Demiurg
# and Kroot (p.15), the Inquisition (p.138) and Grey Knights (p.138, p.145)
# all belong to this group.
#
# Eldar and Craftworld Eldar are DIFFERENT races in the book's list, so
# the Corsairs and Iyanden are not each other's reserves - their relation is p.16's
# named exception (an Eldar Hero aboard the Flame of Asuryan).
_LDASH = "—"          # the em dash in the list names
RACE_NAMES = ["imperial navy", "space marines", "chaos", "eldar",
              "craftworld eldar", "dark eldar", "orks", "necrons",
              "tyranids", "tau"]
LIST_RACE = [
    ("Imperial Navy %s Gothic Sector", "imperial navy", "p.14 race list"),
    ("Imperial Navy %s Bastion Fleets", "imperial navy", "p.14 race list"),
    ("Imperial Navy %s Armageddon Sector", "imperial navy", "p.14 race list"),
    ("Imperial Navy %s Bakka Sector", "imperial navy", "p.14 race list"),
    ("Adeptus Mechanicus %s Explorator", "imperial navy",
     "p.14 names it explicitly: 'Imperial Navy (including Adeptus Mechanicus)'"),
    ("Space Marines %s Codex Astartes", "space marines", "p.14 race list"),
    ("Space Marines %s Crusade", "space marines", "p.14 race list"),
    ("Space Marines %s Dominion", "space marines", "p.14 race list"),
    ("The Emperor's Inquisition", None,
     "not in the race list. p.138: 'The Inquisition has no fleet list on its "
     "own. Instead, there are various ways to add an Inquisitor or "
     "Inquisitorial ships to the Imperial factions.' Named access, not a "
     "reserve (p.15)"),
    ("Grey Knights", "space marines",
     "p.144 says word for word: 'Grey Knights count as Space Marines in all "
     "respects and as such follow all rules for Space Marines as written on "
     "pages 92-94.' A race is a game-mechanical group, and the book names it itself. "
     "The conditional access to the Imperial fleets does not get round this, because "
     "p.146 bans both directions separately: 'A Grey Knights fleet will "
     "not take ships from or provide ships to any other fleet list as "
     "reserves or allies' - the ban (res_ban) is decided before the race. "
     "The user's decision T37, 14.9.2026"),
    ("Rogue Traders", None,
     "not in the race list. p.174: 'Any fleet except Necrons or Tyranids may "
     "include a single Rogue Trader capital ship' - a named rule of its own"),
    ("Rogue Traders %s Exploration", None, "as Rogue Traders (p.174)"),
    ("Rogue Traders %s Pirates and Wolf Packs", None, "as Rogue Traders (p.174)"),
    ("Chaos %s Incursion", "chaos", "p.14 'Chaos (including Chaos Space Marines)'"),
    ("Chaos %s Black Crusade", "chaos", "p.14 race list"),
    ("Chaos %s Tzeentch", "chaos", "p.14 race list"),
    ("Chaos %s Nurgle", "chaos", "p.14 race list"),
    ("Chaos %s Khorne", "chaos", "p.14 race list"),
    ("Chaos %s Slaanesh", "chaos", "p.14 race list"),
    ("Eldar Corsairs %s Gothic Sector", "eldar", "p.14 race list: Eldar"),
    ("Eldar Corsairs %s Later Gothic War", "eldar", "p.14 race list: Eldar"),
    ("Eldar %s Iyanden Craftworld", "craftworld eldar",
     "p.14 lists Craftworld Eldar as a race of its own"),
    ("Dark Eldar %s Pirates", "dark eldar", "p.14 race list"),
    ("Orks %s Cyclops Cluster", "orks", "p.14 race list"),
    ("Orks %s Waaagh!", "orks", "p.14 race list"),
    ("Orks %s Da Ork Clanz", "orks", "p.14 race list"),
    ("Necrons %s Harvest Fleet", "necrons", "p.14 race list"),
    ("Tyranids %s Vanguard Fleet", "tyranids", "p.14 race list"),
    ("Tyranids %s Hive Fleet", "tyranids", "p.14 race list"),
    ("Tau %s Merchant Fleet", "tau", "p.14 'Tau (including Tau allies)'"),
    ("Tau %s Commerce Protection", "tau", "p.14 'Tau (including Tau allies)'"),
    ("Demiurg %s War Host", "tau",
     "p.15's race list says 'Tau (including Tau allies)', and p.482 "
     "names the Demiurg as one of them: 'there are three races commonly "
     "observed as part of Tau fleets - the Kroot, the Nicassar and the "
     "Demiurg'. A race is a game-mechanical group, not a biological species, so "
     "the Demiurg belong to the Tau group although they are a people of their own. The Tau lists' "
     "own Demiurg section is still named access (ct access), which p.15 forbids "
     "also taking as a reserve - that rule does not change because of this. "
     "The user's decision T37, 14.9.2026"),
]

# Fleets p.14: "Only ships of the same 'type' (battleship, cruiser or escort)
# count for reserves purposes" and "battlecruisers, grand cruisers, heavy
# cruisers, cruisers, and light cruisers all count as 'cruisers'".
#
# The profile's ty field is enough for these four; all others (Defence, Ground)
# must be read by hand, because the book gives them no type automatically.
SHIP_RT_BY_TY = {"Battleship": "battleship", "Cruiser": "cruiser",
                 "Grand Cruiser": "cruiser", "Escort": "escort"}
SHIP_RT_EXCEPTIONS = [
    ("286", "battleship",
     "p.288: 'It counts as a battleship for purposes of taking another so in "
     "order to take a second battleship, the fleet must already have six "
     "cruisers and/or heavy cruisers.' The book gives the hulk a battleship's "
     "status explicitly; the sentence limits it to counting battleships, "
     "which is exactly the counting of the reserve rule"),
    ("389", "none",
     "Ork hulk: the book gives it none of the three types. Its own rule decides "
     "(p.367 'maximum of one space hulk per 1,500 points', p.372 "
     "'An Ork fleet with at least three Warlords may include one Space Hulk')"),
    ("392", "none", "a Rok is a defence structure, not a battleship/cruiser/escort"),
    ("494", "none",
     "the Kroot Warsphere enters a fleet only through named access (p.456-457, "
     "p.487), and p.15 forbids also taking the same ship as a reserve"),
    ("492", "none", "Nicassar Caravan: named access on the Tau lists (p.457)"),
    ("493", "none", "Nicassar Rig: named access on the Tau lists (p.457)"),
    ("196", "none", "Stryxis Caravan Vessel: a named row of the Rogue Trader lists"),
    ("110", "none", "the Fortress-Monastery is a station (p.98), not a ship type"),
    ("284", "none", "the Activated Blackstone Fortress is a station"),
    ("506", "none", "the Blackstone Fortress is a station"),
    ("500", "none", "the Ramilies class star fort is a station"),
    ("334", "none", "the Haven space station is a station"),
    ("334b", "none", "the Haven as a Dark Eldar base (p.347) is the same station"),
    ("507", "none", "the Space station is a station"),
    ("508", "none", "the Orbital dock is a station"),
    ("509", "none", "the Orbital defence laser platform is a station"),
    ("510", "none", "the Orbital torpedo launcher is a station"),
    ("511", "none", "the Orbital weapons platform is a station"),
    ("478", "none", "the Kor caste orbital city is a station"),
    ("479", "none", "the Security orbital is a station"),
    ("480", "none", "the Orbitals are a station"),
    ("481", "none", "the Waystation is a station"),
    ("517", "none", "the Air base low orbit defences are a ground target"),
    ("517b", "none", "the Defence laser silo is a ground target (p.517)"),
    ("517c", "none", "the Missile silo is a ground target (p.517)"),
    # The book prints the type Escort/1 for these, but they are bought from the planetary
    # defences list (p.499), not from a fleet list: p.498 "these ships
    # have no warp engines and are therefore confined to the system", and
    # the reserve rule counts only "battleships, cruisers or escorts chosen from
    # the fleet list" (p.14). Without these rows three system ships (60 pts)
    # opened a reserve escort slot.
    ("514", "none", "the Defence monitor is a planetary defence (p.498-499), not a fleet list escort"),
    ("515", "none", "the System ship is a planetary defence (p.498-499), not a fleet list escort"),
    ("516", "none", "the Fire ship is a planetary defence (p.499), not a fleet list escort"),
]

_race_hits = {}
for _nm, _race, _why in LIST_RACE:
    _nm = _nm % ((_LDASH,) * _nm.count("%s")) if "%s" in _nm else _nm
    assert _race is None or _race in RACE_NAMES, "unknown race: %r" % _race
    _hit = [Lz for Lz in lists_out if Lz["nm"] == _nm]
    assert len(_hit) == 1, ("LIST_RACE: list %r is not found exactly once (%d)"
                            % (_nm, len(_hit)))
    assert _nm not in _race_hits, "LIST_RACE: %r twice" % _nm
    _race_hits[_nm] = True
    _hit[0]["race"] = _race
def check_races(lists):
    """Every list must have a race or an explicit None. A new list
    must not be left silently without a race: then it would fall out of the reserve rule
    unnoticed."""
    no = [Lz["nm"] for Lz in lists if "race" not in Lz]
    assert not no, "LIST_RACE: left without a race %s" % no


def check_ship_types(ships_):
    """Every profile must have the book's type. An unclassified ship
    must not be left on a default: the book gives the Defence hulls no type."""
    bad = [k for k, v in ships_.items()
           if v.get("rt") not in ("battleship", "cruiser", "escort", "none")]
    assert not bad, "ship type (rt) missing: %s" % bad[:5]


check_races(lists_out)
print("races recorded: %d lists, of which in the race list %d"
      % (len(lists_out), sum(1 for Lz in lists_out if Lz["race"])))

_rt_used = {}
for _pg, _rt, _why in SHIP_RT_EXCEPTIONS:
    assert _pg in ships, "SHIP_RT_EXCEPTIONS: no profile %s" % _pg
    assert _pg not in _rt_used, "SHIP_RT_EXCEPTIONS: %s twice" % _pg
    _rt_used[_pg] = _rt
for _pg, _sh in ships.items():
    if _pg in _rt_used:
        _sh["rt"] = _rt_used[_pg]
        continue
    _ty = _sh.get("ty")
    assert _ty in SHIP_RT_BY_TY, (
        "ship %s (%s) is of type %r, which the book does not classify - add a row "
        "to SHIP_RT_EXCEPTIONS with its reasoning" % (_pg, _sh.get("nm"), _ty))
    _sh["rt"] = SHIP_RT_BY_TY[_ty]
check_ship_types(ships)
print("ship types (p.14): %s"
      % {k: sum(1 for _s in ships.values() if _s["rt"] == k)
         for k in ("battleship", "cruiser", "escort", "none")})

# --- 1.1 phase 4: Dominion's named reserve permission (Fleets p.101) ---------
# "A Space Marine Dominion Fleet has close ties with nearby Imperial Navy
# forces. Contrary to the normal rules, a dominion fleet can take Imperial
# Navy vessels as normal reserves and reinforcements, including Adeptus
# Mechanicus and non-xenos Rogue Trader vessels."
#
# The race gate (p.15) would block this: Dominion's race is space marines.
# The book says directly "contrary to the normal rules", so the permission is recorded
# on the list by name. The list field res_ok says which sources it may use
# besides its own race; not_re limits the rows (p.101: "non-xenos").
#
# "For purposes of choosing reserves, battle barges count as battleships, and
# strike cruisers count as cruisers" - this already holds, because the profile's
# rt field is read from the book the same way.
RESERVE_GRANTS = [
    dict(list="Space Marines \u2014 Dominion",
         src="Contrary to the normal rules, a dominion fleet can take Imperial "
             "Navy vessels as normal reserves and reinforcements, including "
             "Adeptus Mechanicus and non-xenos Rogue Trader vessels.",
         grants=[dict(race="imperial navy"),
                 dict(list="Rogue Traders", not_re="xenos"),
                 dict(list="Rogue Traders \u2014 Exploration", not_re="xenos"),
                 dict(list="Rogue Traders \u2014 Pirates and Wolf Packs", not_re="xenos")]),
]
# --- 1.1 phase 4: Eldar Corsairs <-> Iyanden (Fleets p.316 and p.319) -------
# p.316: "An Eldar Hero must lead the fleet in order to use Craftworld Eldar
# vessels as reserves. Following this, one Craftworld Eldar Flame of Asuryan,
# Dragonship or Wraithship may be taken for every three cruisers in the fleet."
# p.319: "An Eldar Hero must lead the fleet in order to use Corsair Eldar
# vessels as reserves. Following this, one Corsair Eldar cruiser or light
# cruiser may be taken for every three Dragonships and / or Wraithships in the
# fleet."
#
# Eldar and Craftworld Eldar are DIFFERENT races in p.14's race list, so
# the general race gate would block this. The permission is per list AND conditional:
# the fleet must be led by an Eldar Hero (or on Iyanden Prince Yriel, p.319:
# "Yriel may be taken instead of the Hero Fleet Commander"). The ratios are
# the book's general 1:3 by type, so they come from the engine.
_ELDAR_HERO = "^(eldar hero|prince yriel)"
_CORS_SRC = ("An Eldar Hero must lead the fleet in order to use Craftworld "
             "Eldar vessels as reserves. Following this, one Craftworld Eldar "
             "Flame of Asuryan, Dragonship or Wraithship may be taken for every "
             "three cruisers in the fleet.")
_IYA_SRC = ("An Eldar Hero must lead the fleet in order to use Corsair Eldar "
            "vessels as reserves. Following this, one Corsair Eldar cruiser or "
            "light cruiser may be taken for every three Dragonships and / or "
            "Wraithships in the fleet.")
for _cnm in ("Eldar Corsairs \u2014 Gothic Sector",
             "Eldar Corsairs \u2014 Later Gothic War"):
    RESERVE_GRANTS.append(dict(
        list=_cnm, src=_CORS_SRC,
        grants=[dict(list="Eldar \u2014 Iyanden Craftworld", needs_re=_ELDAR_HERO,
                     needs_what="an Eldar Hero")]))
RESERVE_GRANTS.append(dict(
    list="Eldar \u2014 Iyanden Craftworld", src=_IYA_SRC,
    grants=[dict(list="Eldar Corsairs \u2014 Gothic Sector", needs_re=_ELDAR_HERO,
                 needs_what="an Eldar Hero"),
            dict(list="Eldar Corsairs \u2014 Later Gothic War", needs_re=_ELDAR_HERO,
                 needs_what="an Eldar Hero")]))

for _g in RESERVE_GRANTS:
    _L = _p18_list(_g["list"])
    for _x in _g["grants"]:
        if _x.get("list"):
            _p18_list(_x["list"])          # the source list must exist
        if _x.get("race"):
            assert _x["race"] in RACE_NAMES, _x["race"]
    _L["res_ok"] = _g["grants"]
    _L["res_src"] = _g["src"]
print("named reserve permissions: %d lists" % len(RESERVE_GRANTS))

# p.101: "When reserves are taken in this manner, the fleet can have up to
# twelve cruisers." The list's own heading limit is 0-10, so section_count
# is replaced by a conditional cap. The condition is a ROLE (a reserve in the fleet), not
# a row, so conditional_cap got the field cond_role.
_DOM = _p18_list("Space Marines \u2014 Dominion")
_dc = _p18_sec(_DOM, "Cruisers")
_old = [r for r in _DOM["secs"][_dc]["rules"]
        if r.get("kind") == "section_count" and r.get("max") == 10]
assert len(_old) == 1, "the Dominion cruiser limit is not found exactly once"
_DOM["secs"][_dc]["rules"] = [r for r in _DOM["secs"][_dc]["rules"] if r is not _old[0]]
_DOM["secs"][_dc]["rules"].append(dict(
    kind="conditional_cap", ok=True, sec=[_dc], label=_old[0].get("label") or "Cruisers",
    pick=[dict(sec=_dc)], cond_role="reserve", max_unmet=10, max_met=12,
    src=_old[0]["src"] + " When reserves are taken in this manner, the fleet "
                         "can have up to twelve cruisers."))
print("the Dominion cruiser limit: 10 without reserves, 12 with them (p.101)")

# J148: the Inquisition ships into the host's limits. Runs only here, because
# Bakka's overlapping reserve rule is removed and the Dominion cruiser limit
# turned into a conditional cap only after J104.
_inq_hits = {}
for _nm, _ii in _inq_at.items():
    _inq_hits[_nm] = _inq_limits(_p18_list(_nm), _ii)
# Which limits the Inquisition ships count towards on a host: bc = the battlecruiser
# ratio, bs = the battleship ratio, cru12/cru10 = the cruiser limit (on Dominion
# the conditional cap 10/12, p.101). The Space Marine lists have no ratios to
# cruisers, the Explorator no battlecruisers and no cruiser limit.
assert _inq_hits == {
    "Imperial Navy \u2014 Gothic Sector": ["bc", "bs", "cru12"],
    "Imperial Navy \u2014 Bastion Fleets": ["bc", "bs", "cru12"],
    "Imperial Navy \u2014 Armageddon Sector": ["bc", "bs", "cru12"],
    "Imperial Navy \u2014 Bakka Sector": ["bc", "bs", "cru12"],
    "Space Marines \u2014 Codex Astartes": ["cru10"],
    "Space Marines \u2014 Crusade": ["cru10"],
    "Space Marines \u2014 Dominion": ["cru10"],
    "Adeptus Mechanicus \u2014 Explorator": ["bs"],
}, _inq_hits
print("Inquisition ships into the host's limits: %d picks (p.138, p.14)"
      % sum(len(v) for v in _inq_hits.values()))


# --- 1.1 phase 4: lists that exchange no ships at all (p.99, p.145) ----------
# "A Space Marine Crusade fleet will not take ships from or provide ships to
# any other fleet list as reserves or allies, including Imperial Navy, Rogue
# Trader or Adeptus Mechanicus fleet lists." Grey Knights have the same sentence.
#
# Without this ban the general race rule would let Crusade and Codex Astartes
# exchange ships: both are space marines by race. The ban works
# both ways ("take ships from or provide ships to") and also beats
# p.139's inquisitor permission, because it is the list's own and more precise.
RESERVE_BANS = [
    dict(list="Space Marines \u2014 Crusade",
         src="A Space Marine Crusade fleet will not take ships from or provide "
             "ships to any other fleet list as reserves or allies, including "
             "Imperial Navy, Rogue Trader or Adeptus Mechanicus fleet lists."),
    dict(list="Grey Knights",
         src="A Grey Knights fleet will not take ships from or provide ships to "
             "any other fleet list as reserves or allies, including Imperial "
             "Navy, Rogue Trader or Adeptus Mechanicus fleet lists."),
]
for _b in RESERVE_BANS:
    _L = _p18_list(_b["list"])
    _L["res_ban"] = _b["src"]
print("reserve bans: %d lists" % len(RESERVE_BANS))

# A partial lending ban: a list gives reserves, but NOT some of
# its rows. Armageddon p.41: "Likewise, Imperial Navy fleets choosing
# reserves from this fleet list cannot choose Space Marine vessels from
# it." Space Marine ships are starred on the list ("* Space Marine
# vessels may not be squadroned with non-Space Marine vessels"), and two
# stars are something else (Endurance/Defiant, rare variants) - hence
# exactly one star at the end of the name. Spot check 20, seed 2026091413 (P1).
LEND_BANS = [
    dict(list="Imperial Navy \u2014 Armageddon Sector",
         re="[^*]\\*$",
         src="Likewise, Imperial Navy fleets choosing reserves from this "
             "fleet list cannot choose Space Marine vessels from it."),
]
for _b in LEND_BANS:
    _L = _p18_list(_b["list"])
    _L["lend_ban"] = dict(re=_b["re"], src=_b["src"])
print("partial lending bans: %d lists" % len(LEND_BANS))

# A rule's source sentence must not run on into a price row. Grey Knights' p.146
# escort sentence ends "(see pg 13)" without a full stop, and the extraction glued
# the next row "Rapid strike vessel (Firestorm) (pg 106) (pg
# 79)..45 pts" to it - the player read it in the legality panel as the rule's sentence.
# Found with check_pages.py on 14.9.2026. Cut at the first price row
# and end the sentence with a full stop.
_PRICE_ROW = re.compile(r"\s+[A-Z][^.]{3,90}?\(pg\.?\s*\d+\)(?:\s*\(pg\.?\s*\d+\))?\s*\.{2,}\s*\+?\d+\s*pts.*$")
_GLUED = 0
for _L in lists_out:
    for _sec in _L["secs"]:
        for _r in _sec.get("rules") or []:
            _src = _r.get("src")
            if not _src or not _PRICE_ROW.search(_src):
                continue
            _cut = _PRICE_ROW.sub("", _src).rstrip()
            if _cut and not _cut.endswith((".", "!", "?", ")")):
                _cut += "."
            elif _cut.endswith(")"):
                _cut += "."
            _r["src"] = _cut
            _GLUED += 1
print("source sentences glued to a price row cut: %d" % _GLUED)

# Chaos Space Marine crews (p.234/236/240/244/248). Two things
# spot check 20 found: (1) p.222 forbids the crew on a renegade ship -
# "Chaos Space Marines ... may not be taken for Imperial Navy vessels used in
# this manner" - so an Imperial Navy hull does not get the row (flno); (2) a ship
# has one crew, and the legion-named rows of two lists are the same purchase
# (grp), so that a borrowed ship is not sold two (seed 2026091443).
_CREW = 0
for _L in lists_out:
    for _sec in _L["secs"]:
        for _en in _sec.get("ents") or []:
            if _en.get("k") == "up" and str(_en.get("l", "")).endswith("Chaos Space Marine crew"):
                _c = _en.setdefault("cond", {})
                _c["flno"] = "^imperial navy"
                _en["grp"] = "crew"
                _CREW += 1
print("Chaos Space Marine crew rows made conditional: %d" % _CREW)

# Veil of Lust (p.248): the row's own sentence is two sentences, and the second is
# mechanics. The section sentence carried only the first, so the card sold the ability
# without its effect (spot check 20, seed 2026091441).
_VEIL = 0
for _L in lists_out:
    for _sec in _L["secs"]:
        for _en in _sec.get("ents") or []:
            if _en.get("k") == "up" and _en.get("l") == "Veil of Lust":
                _en["desc"] = ("Any ships with the Mark of Slaanesh may take and be obscured by a "
                               "Veil of Lust. Ship firing on this vessel using the gunnery table "
                               "suffers a right column shift before any other modifiers are applied.")
                _VEIL += 1
assert _VEIL == 1, _VEIL
print("the Veil of Lust description completed")

# --- 1.1 phase 4: a fleet led by an inquisitor (Fleets p.139) ----------------
# "Any one of the Imperial Navy, Adeptus Mechanicus and Space Marine fleets
# led by an Inquisitor may always take ships from the other two as reserves in
# the normal manner."
#
# The condition is the same Inquisitor Lord row that was added to these eight
# lists (J104). Crusade and Grey Knights get the permission here like the others,
# but their own ban beats it.
_INQ_RES_SRC = ("Any one of the Imperial Navy, Adeptus Mechanicus and Space "
                "Marine fleets led by an Inquisitor may always take ships from "
                "the other two as reserves in the normal manner.")
for _nm in _INQ_HOSTS:
    _L = _p18_list(_nm)
    _g = list(_L.get("res_ok") or [])
    _g += [dict(race="imperial navy", needs_re="^inquisitor lord",
                needs_what="an Inquisitor Lord"),
           dict(race="space marines", needs_re="^inquisitor lord",
                needs_what="an Inquisitor Lord")]
    _L["res_ok"] = _g
    if not _L.get("res_src"):
        _L["res_src"] = _INQ_RES_SRC
print("the inquisitor's reserve permission: %d lists" % len(_INQ_HOSTS))


# --- p.121: Mechanicus ships in a Space Marine fleet WITHOUT conditions ------
# "Adeptus Mechanicus vessels can be used as reserves in any Imperial Navy or
# Space Marine fleet list." The permission is unconditional, but the Mechanicus is by race
# imperial navy and the Space Marines a race of their own, so the general race gate blocks
# it. The only permission recorded on the Space Marine lists was p.139's
# inquisitor-conditional one, so the app required an inquisitor against the book
# (the Codex review 15.9.2026). The Imperial Navy lists are already the same race,
# so they do not need this; res_ban (Crusade) is the list's own and more precise.
_AM_LIST = "Adeptus Mechanicus \u2014 Explorator"
_AM_SRC = ("Adeptus Mechanicus vessels can be used as reserves in any Imperial "
           "Navy or Space Marine fleet list.")
_AM_N = 0
for _L in lists_out:
    if _L.get("race") != "space marines" or _L.get("res_ban"):
        continue
    _g = list(_L.get("res_ok") or [])
    if not any(x.get("list") == _AM_LIST and not x.get("needs_re") for x in _g):
        _g.append(dict(list=_AM_LIST))
        _L["res_ok"] = _g
        _AM_N += 1
_p18_list(_AM_LIST)                      # the source list must exist
assert _AM_N >= 1, _AM_N
print("p.121 Mechanicus permission: %d Space Marine lists" % _AM_N)


# --- the allies matrix (Fleets p.17 + 2010 FAQ) ----------------------------
# p.17: "no vessel can be allied to a fleet for which it is a natural enemy,
# nor can it ally itself to a fleet that already contains allies for which it
# is a natural enemy." The table saying who is whose enemy is
# a heading on p.17, but THE TABLE ITSELF IS MISSING from this edition (the page is
# empty after the heading, verified by rendering). The Remastered's own
# web version restores it and names its source: "Editor's note: The
# following was taken from the 2010 FAQ."
#
# Verbatim text and reasoning: books/faq2010-allies.txt
#
# The matrix's classes are not the app's races: it separates Rogue Traders and
# Demiurg/Kroot into classes of their own. Hence a separate field ally_race, which does NOT replace
# the race field (that answers to p.14's race list and decides reserves).
ALLY_RACE = {
    "imperial navy": "imperials",
    "space marines": "space marines",
    "chaos": "chaos",
    "eldar": "corsair eldar",
    "craftworld eldar": "craftworld eldar",
    "dark eldar": "dark eldar",
    "orks": "orks",
    "necrons": "necrons",
    "tyranids": "tyranids",
    "tau": "tau",
}
# Per-list exceptions: the matrix's own class beats the race.
ALLY_RACE_BY_LIST = {
    "Rogue Traders": "rogue traders",
    "Rogue Traders \u2014 Exploration": "rogue traders",
    "Rogue Traders \u2014 Pirates and Wolf Packs": "rogue traders",
    "Demiurg \u2014 War Host": "demiurg",
    "The Emperor's Inquisition": "imperials",
}
# never = never with these; only = only with these.
ALLY_MATRIX = {
    "imperials":        dict(never=["chaos", "dark eldar", "craftworld eldar", "orks"]),
    "chaos":            dict(never=["imperials", "craftworld eldar", "corsair eldar",
                                    "space marines", "tau"]),
    "tau":              dict(never=["orks", "chaos", "dark eldar", "space marines"]),
    "dark eldar":       dict(never=["imperials", "tau", "space marines"]),
    "craftworld eldar": dict(never=["imperials", "chaos", "space marines", "orks"]),
    "corsair eldar":    dict(never=["chaos", "space marines", "orks"]),
    "space marines":    dict(only=["imperials", "rogue traders"]),
    "rogue traders":    dict(never=["tyranids", "necrons"]),
    "orks":             dict(only=["chaos", "dark eldar", "rogue traders"]),
    "demiurg":          dict(never=["orks", "space marines"]),
    "necrons":          dict(only=[]),
    "tyranids":         dict(only=[]),
}
ALLY_SRC = "Allies Matrix (2010 FAQ, Fleets pg. 17 names it but does not print it)"
# The Imperium's second sentence: a Space Marine ally excludes the others.
ALLY_EXCLUSIVE = dict(
    who="imperials", trigger="space marines", allow=["rogue traders"],
    src="Allies Matrix (2010 FAQ): If it allies with or has as allies the "
        "Space Marines, it cannot ally with or take as allies ships from any "
        "other fleet list except Rogue Trader vessels (excluding Xenos ships).")

# "excluding Xenos ships" is said three times in the source: on the Imperium's row,
# on the Space Marines row and on the Rogue Traders row. The third is the widest and does not
# concern only the ally rows - "may not take Xenos vessels when allied with
# Space Marines" bans Xenos ships from the fleet, the Rogue Trader's own too.
# So this is a fleet-level condition and not a pair condition, and `when` is the class whose
# PRESENCE triggers it. Xenos rows are only on the Rogue Traders lists, so
# the rule cannot bite elsewhere.
ALLY_XENOS = dict(
    when="space marines", re="^Xenos Vessel",
    src="Rogue Traders: may ally with any fleet except Tyranids and Necrons "
        "but may not take Xenos vessels when allied with Space Marines. "
        "(Allies Matrix, 2010 FAQ)")

_AR = 0
for _L in lists_out:
    _ar = ALLY_RACE_BY_LIST.get(_L["nm"]) or ALLY_RACE.get(_L.get("race"))
    assert _ar, "ally class missing: %s (race %r)" % (_L["nm"], _L.get("race"))
    assert _ar in ALLY_MATRIX, _ar
    _L["ally_race"] = _ar
    _L["ally_rule"] = dict(ALLY_MATRIX[_ar], src=ALLY_SRC)
    if _ar == ALLY_EXCLUSIVE["who"]:
        _L["ally_excl"] = dict(ALLY_EXCLUSIVE)
    _L["ally_xenos"] = dict(ALLY_XENOS)
    _AR += 1
# An alliance is legal only if BOTH sides allow it. The source writes
# the rules in one direction per class, so a one-sided ban is enough -
# for example "Necrons do not ally with any fleet" is not repeated on the Imperium's
# row. So symmetry is not required here, but the outcome is checked
# with named pairs: a typo in the table shows at once.
def _ok(a, b):
    r = ALLY_MATRIX[a]
    return (b in r["only"]) if "only" in r else (b not in r["never"])
def _pair(a, b):
    return _ok(a, b) and _ok(b, a)
_EXPECT = [
    ("imperials", "corsair eldar", True),   ("imperials", "craftworld eldar", False),
    ("imperials", "dark eldar", False),     ("imperials", "tau", True),
    ("imperials", "space marines", True),   ("imperials", "orks", False),
    ("imperials", "chaos", False),          ("orks", "chaos", True),
    ("orks", "dark eldar", True),           ("orks", "rogue traders", True),
    ("chaos", "dark eldar", True),          ("chaos", "corsair eldar", False),
    ("rogue traders", "tyranids", False),   ("rogue traders", "necrons", False),
    ("imperials", "necrons", False),        ("imperials", "tyranids", False),
    ("tau", "demiurg", True),               ("space marines", "demiurg", False),
    ("space marines", "corsair eldar", False), ("space marines", "rogue traders", True),
]
for _a, _b, _want in _EXPECT:
    assert _pair(_a, _b) == _want, (
        "allies matrix: %s + %s should be %s" % (_a, _b, _want))
print("allies matrix: %d lists, %d classes" % (_AR, len(ALLY_MATRIX)))


# --- 1.1 phase 4: a Rogue Trader cruiser in other fleets (p.174) ------------
# "Any fleet except Necrons or Tyranids may include a single Rogue Trader
# capital ship. Tau, Demiurg and Imperial fleets may include one Rogue Trader
# cruiser for every 750 points or part thereof in their fleet. ... Rogue
# Trader cruisers always count against cruiser restrictions in any fleet list
# that has such restrictions."
#
# The row is the Rogue Trader Cruiser (p.180, 185 pts). The Exploration list's variants
# (Dauntless, Endeavour) are left out: they are the Rogue Trader list's own
# rows, and the book's second sentence concerns specifically a second cruiser
# from the Exploration list - a case of its own.
#
# Left out:
#   Necrons and Tyranids - the book says "except".
#   The Rogue Trader lists themselves - they already have the row.
#   Bakka (p.50), Tau Commerce Protection (p.457) and Demiurg (p.487) -
#     they have their own, more precise rule on the same matter.
#   Space Marines Crusade and Grey Knights - their own ban (p.99, p.145)
#     says they take ships from NOWHERE else.
_RT174_A = ("Any fleet except Necrons or Tyranids may include a single Rogue "
            "Trader capital ship.")
_RT174_B = ("Tau, Demiurg and Imperial fleets may include one Rogue Trader "
            "cruiser for every 750 points or part thereof in their fleet.")
_RT174_C = ("Rogue Trader cruisers always count against cruiser restrictions "
            "in any fleet list that has such restrictions.")
_RT_PER750 = ("Imperial Navy \u2014 Gothic Sector", "Imperial Navy \u2014 Bastion Fleets",
              "Imperial Navy \u2014 Armageddon Sector", "Adeptus Mechanicus \u2014 Explorator",
              "Space Marines \u2014 Codex Astartes", "Space Marines \u2014 Dominion",
              "The Emperor's Inquisition", "Tau \u2014 Merchant Fleet")
_RT_SINGLE = ("Chaos \u2014 Incursion", "Chaos \u2014 Black Crusade", "Chaos \u2014 Tzeentch",
              "Chaos \u2014 Nurgle", "Chaos \u2014 Khorne", "Chaos \u2014 Slaanesh",
              "Eldar Corsairs \u2014 Gothic Sector", "Eldar Corsairs \u2014 Later Gothic War",
              "Eldar \u2014 Iyanden Craftworld", "Dark Eldar \u2014 Pirates",
              "Orks \u2014 Cyclops Cluster", "Orks \u2014 Waaagh!", "Orks \u2014 Da Ork Clanz")
_rt174 = 0
for _nm in _RT_PER750 + _RT_SINGLE:
    _L = _p18_list(_nm)
    assert not any(e.get("r") == 180 for x in _L["secs"] for e in x["ents"]), \
        "%s: the Rogue Trader Cruiser already exists" % _nm
    _i = len(_L["secs"])
    _per = _nm in _RT_PER750
    _rule = (dict(kind="per_points", each=1, per=750, ok=True, sec=[_i],
                  label="Rogue Trader cruisers (one per 750 pts or part)",
                  pick=[dict(sec=_i)], src=_RT174_B)
             if _per else
             dict(kind="cap", max=1, ok=True, sec=[_i],
                  label="Rogue Trader capital ships (0-1)",
                  pick=[dict(sec=_i)], src=_RT174_A))
    _L["secs"].append(dict(t="ROGUE TRADERS",
                           text=[_RT174_A, _RT174_B, _RT174_C],
                           ents=[_p18_unit("Rogue Trader Cruiser", 180, 185, 174)],
                           rules=[_rule]))
    # "always count against cruiser restrictions in any fleet list that has
    # such restrictions": the list's own cruiser limit counts this in.
    _cr = [j for j, x in enumerate(_L["secs"]) if x["t"].strip().lower() == "cruisers"]
    if _cr:
        for _r in _L["secs"][_cr[0]].get("rules") or []:
            if _r.get("kind") == "section_count":
                _r["pick"] = (_r.get("pick") or [dict(sec=_cr[0])]) + [dict(sec=_i)]
                _r["src"] = _r["src"] + " " + _RT174_C
    _rt174 += 1
assert _rt174 == 21, _rt174
print("Rogue Trader cruiser added to %d lists (p.174)" % _rt174)


# --- J162: Abaddon on the four god lists (Fleets p.231) ---------------------
# The user's decision 13.10.2026. p.231 ABADDON AS FLEET COMMANDER: "Abaddon can
# be chosen to act as fleet commander in any game in which the Chaos fleet is
# worth 1,000 points or more." The sentence does not limit the list, and the Tzeentch,
# Nurgle, Khorne and Slaanesh lists' own Planet Killer row allows for him
# (p.237, 241, 245, 249: "If Abaddon is present, he must be aboard the Planet
# Killer"), as do the god barges' profiles (p.258: "unless the fleet is
# being led by Abaddon the Despoiler"). Their Fleet Commander sections do not
# list him, so the row was only in Black Crusade. The Incursion list
# (p.232) does not mention him anywhere and is not part of the decision.
#
# The row is COPIED from the Black Crusade section (one source: the price 195 is printed
# only on p.234, Ld 10, one re-roll per turn). The section is added at the end of the list
# before the defence section, so no section index moves.
#
# The other half of the same decision: p.234 says of Black Crusade "worth more than
# 1,000 points", p.231 "1,000 points or more". Abaddon's own general rule
# (p.231) decides: exactly 1 000 points is enough in Black Crusade too.
_AB_SRC = ("Abaddon can be chosen to act as fleet commander in any game in which the "
           "Chaos fleet is worth 1,000 points or more.")
_AB_RR = "Abaddon’s fleet is allowed to re-roll a single Command check or Leadership test each turn."
_AB_LORD = "You may not place a Chaos Lord on the same ship as Abaddon."
_ab_bc = _p18_list("Chaos — Black Crusade")
_ab_sec = _ab_bc["secs"][_p18_sec(_ab_bc, "Abaddon")]
assert [(e["l"], e["p"], e["k"], e.get("rr")) for e in _ab_sec["ents"]] == [("Abaddon (Ld 10)", 195, "cmd", 1)], _ab_sec["ents"]
_ab_at = [r for r in _ab_sec["rules"] if r["kind"] == "allowed_at"]
assert len(_ab_at) == 1 and _ab_at[0].get("over") is True and _ab_at[0]["points"] == 1000, _ab_at
del _ab_at[0]["over"]
_ab_at[0]["src"] = _AB_SRC
add_text(_ab_sec, [_AB_SRC])
if _ab_sec.get("own") is not None:                # the sentence belongs to the section, not to the row
    _ab_sec["own"] = list(_ab_sec["own"]) + [None] * (len(_ab_sec["text"]) - len(_ab_sec["own"]))
    assert len(_ab_sec["own"]) == len(_ab_sec["text"])
_ab_n = 0
for _nm in ("Chaos — Tzeentch", "Chaos — Nurgle", "Chaos — Khorne", "Chaos — Slaanesh"):
    _L = _p18_list(_nm)
    assert not any("abaddon" in str(e["l"]).lower() for x in _L["secs"] for e in x["ents"]), "%s: Abaddon already exists" % _nm
    # The list's own commander section = the one the Warmaster requirement concerns.
    _md = [r for x in _L["secs"] for r in (x.get("rules") or []) if r.get("kind") == "mandatory_at"]
    assert len(_md) == 1 and "Chaos Warmaster" in _md[0]["src"], "%s: mandatory_at %s" % (_nm, _md)
    _cmds = sorted({q["sec"] for q in (_md[0].get("pick") or [])} | set(_md[0].get("sec") or []))
    assert len(_cmds) == 1 and _L["secs"][_cmds[0]]["t"].startswith("Chaos Warmaster"), "%s: komentajaosiot %s" % (_nm, _cmds)
    _cmd = _cmds[0]
    _i = len(_L["secs"])
    _e = copy.deepcopy(_ab_sec["ents"][0])
    _e["src_page"] = 231
    _L["secs"].append(dict(
        t="Abaddon", text=[_AB_SRC, _AB_LORD, _AB_RR], own=[None, None, "Abaddon (Ld 10)"],
        notes=["Page 231 lets Abaddon lead any Chaos fleet of 1,000 points or more. This list does not "
               "print a row for him; his price is the one printed in the Black Crusade list (p. 234)."],
        ents=[_e],
        rules=[dict(kind="allowed_at", points=1000, ok=True, sec=[_i], label="Abaddon",
                    pick=[dict(sec=_i)], src=_AB_SRC),
               # "act as fleet commander": in place of the Warmaster, not beside him
               # (p.234 says the same of Black Crusade: "as the Warmaster").
               dict(kind="cap", max=1, ok=True, sec=[_i], label="Warmaster or Abaddon",
                    pick=[dict(sec=_cmd), dict(sec=_i)], src=_AB_SRC)]))
    # ...and the required Warmaster is filled by him.
    _md[0]["pick"] = list(_md[0].get("pick") or [dict(sec=j) for j in (_md[0].get("sec") or [])]) + [dict(sec=_i)]
    _ab_n += 1
assert _ab_n == 4, _ab_n
print("Abaddon added to %d god lists (p.231); the Black Crusade limit 1 000 points or more" % _ab_n)


# ------------------------------- a share of one hull's option (p.437, J175 c)
# "Instead of taking one of the above, up to 10% of the Tyranid escort drones
# in the fleet can elect to become fireships." The option is on the profile (the same
# drone_weapon group as the weapons), but the limit is the fleet's: resolveFleet
# counts hulls, rounding down.
_FS_SRC = ("Instead of taking one of the above, up to 10% of the Tyranid escort drones in the fleet "
           "can elect to become fireships.")
_fs_ol = [o for o in ships["437"]["ol"] if "become fireships" in str(o.get("t"))]
assert ships["437"]["nm"] == "ESCORT DRONE" and len(_fs_ol) == 1 and _fs_ol[0]["t"].startswith(_FS_SRC), _fs_ol
assert "frac" not in ships["437"]
ships["437"]["frac"] = dict(opt="become fireships", pct=10, what="437", pg=437, src=_FS_SRC,
                            label="Fire ship escort drones (up to 10% of the escort drones)")

# ------------------------------------- Webway Portal (p.337, J175 d)
# The Haven's own rule: "The owning player may use the Webway to summon
# additional warships to its aid. Any number of ships may be purchased
# against the fleet's total at 50% cost, but they count as reserves and start
# off the table." Half price is a way of buying the ship, so it is a row
# (pct -50) for every ship of the list, and it opens as Hide (off0) - no
# open box on every card. "count as reserves" = arriving from off the table
# (the same sentence goes on "start off the table"), not p.14's reserve between
# lists: "Any number". The Haven is only in the Eldar lists' defences
# (p.334); the Dark Eldar base (p.347) swaps only the weapons, and the page does not
# mention the portal - an interpretation, BACKLOG J175.
_WW_SRC = ("The owning player may use the Webway to summon additional warships to its aid. Any number of "
           "ships may be purchased against the fleet's total at 50% cost, but they count as reserves and "
           "start off the table.")
_WW_ARR = ("Beginning turn 2, after the Eldar fleet moves roll a D6. On a 5+, one capital ship or escort "
           "squadron appears along the table edge closest to the Eldar Haven. Eldar ships cannot move in "
           "the same turn they appear.")
_WW_LABEL = "Summoned through the Webway Portal (50% cost)"
_ww_n = 0
for _L in lists_out:
    if _L.get("race") not in ("eldar", "craftworld eldar"):
        continue
    assert not any(x["t"] == "WEBWAY PORTAL" for x in _L["secs"]), _L["nm"]
    _L["secs"].append(dict(
        t="WEBWAY PORTAL", text=[_WW_SRC, _WW_ARR], rules=[],
        notes=["Only with an Eldar Haven in the fleet (bought under Planetary defences, Fleets p. 334). "
               "Tick the row on each ship that arrives through the portal: it costs half, rounded up."],
        ents=[dict(l=_WW_LABEL, r=None, p=None, pct=-50, a=1, u=1, mx=None, nt=None, prose=1, k="up",
                   off0=1, cond=dict(ty=r"^(?!defence)"), src_page=337,
                   desc="Bought at 50% cost and starts off the table. " + _WW_ARR + " (Fleets p. 337)")]))
    _L["webway"] = dict(up="^" + _WW_LABEL.replace("(", "\\(").replace(")", "\\)") + "$",
                        haven="^Haven space station$", pg=337, src=_WW_SRC)
    _ww_n += 1
assert _ww_n == 3, _ww_n
print("Webway Portal: %d Eldar lists (p.337); fire ship drones at most 10 %% (p.437)" % _ww_n)


# ------------------------------- Pirates: transports (p.13, p.179; J46 b)
# p.13: "This rule exempts escorts that are allowed to operate alone, such as
# transports or Tau Messenger ships." The book itself says which of the Pirates list's
# escorts are transports: the Cargo Transport is a "Transport" (p.85), the Armed
# Freighter "counts as only half a freighter" (p.523) and the Armed Cargo Vessel
# "count as a half-transport" (p.192); the Escort Carrier and the Q-Ship "do not count
# as freighters" (p.521, p.522). A transport may be alone, so the 3-6 rule does not
# concern it, and a lone transport is not p.179's "squadron of 3-6 escort
# vessels" per cruiser.
_PIR_TRANSPORTS = ("Cargo Transport", "Armed Freighter", "Armed Cargo Vessel")
_PIR_NOT_T = "^(?!(?:%s)$)" % "|".join(re.escape(x) for x in _PIR_TRANSPORTS)
_pir = [L for L in lists_out if L["nm"] == "Rogue Traders \u2014 Pirates and Wolf Packs"]
assert len(_pir) == 1
_pe = [i for i, s in enumerate(_pir[0]["secs"]) if s["t"].strip().upper() == "ESCORTS"]
assert len(_pe) == 1
_pe = _pe[0]
_labs = [e["l"] for e in _pir[0]["secs"][_pe]["ents"] if e.get("k") != "up"]
assert all(x in _labs for x in _PIR_TRANSPORTS), _labs
_pr = {r["kind"]: r for r in _pir[0]["secs"][_pe]["rules"]}
assert set(_pr) >= {"squadron", "min_ratio"} and "pick" not in _pr["squadron"], _pr.keys()
_pr["squadron"]["pick"] = [dict(sec=_pe, re=_PIR_NOT_T)]
_pr["squadron"]["src"] = (_pr["squadron"]["src"] + " This rule exempts escorts that are allowed to operate "
                          "alone, such as transports or Tau Messenger ships. (Fleets p. 13)")
_ap = _pr["min_ratio"]["allow_pick"]
assert _ap == [dict(sec=_pe)], _ap
_pr["min_ratio"]["allow_pick"] = [dict(sec=_pe, re=_PIR_NOT_T)]
print("Pirates: transports (%s) exempt from the squadron rule (p.13)" % ", ".join(_PIR_TRANSPORTS))


# ============================================ PLANETARY DEFENCES (p.496-517)
# The user's decision 8.10.2026: the defences as their own section at the end of EVERY
# list (their own column, last). The section is added last, because
# the rules refer to sections by number (AGENTS.md): a section added at the end
# moves no index.
#
# Who gets what - by the book, not one list for all:
#   - the p.499 price list (HIGH ORBIT / LOW ORBIT DEFENCES) names no race, and
#     Rulebook p.100 says "All races have equivalents to these planetary
#     defences": the general set for every list - EXCEPT
#   - Tau: "The Tau may spend their points allocation for planetary defences
#     on orbitals" (p.451) and "The Tau may not use any other form of
#     planetary defence" (p.452). The two Tau lists get ONLY their orbitals
#     (p.478-481). The Demiurg War Host is a different chapter (p.482-487), whose rules
#     do not repeat the ban: it gets the general set (an interpretation, BACKLOG J170).
#   - Ramilies: "The Ramilies is available to Imperial and Chaos Fleets"
#     (p.500). Imperial = the lists of the Imperial Navy race (p.14 "Imperial Navy
#     (including Adeptus Mechanicus)"); the Space Marines have their own
#     Fortress-Monastery (p.98, p.110), of the others the book says nothing.
#   - Haven: p.334 is a station of the ELDAR chapter; the Corsair and Craftworld lists.
#     Dark Eldar get it only with the weapons swapped (p.337, p.347).
#
# Row type:
#   r = profile    -> an ordinary unit row
#   r = None, rc   -> no profile: the Orbital mine (p.512) and the Minefield (p.513)
#                     are bare rules. k="unit" (not an upgrade), cnt=1 =
#                     bought by the piece, rc = the rule card's key
#                     (domain.js RULE_CARDS).
_PD_TITLE = "PLANETARY DEFENCES"
_PD_SQ = ("Orbital defences or ships that count as defences may be placed in squadrons, "
          "with 1HP defences grouped in up to six units and larger defences grouped in up to four.")
_PD_TEXT = [
    "When desired, the defender in a scenario may spend up to one-third of his allocated "
    "point value on planetary defences, in addition to any planetary defences provided by "
    "the specific scenario.",
    "However, these additional defences come directly from the points allowed against his "
    "or her fleet list.",
    "Alternatively, you can decide beforehand that you'll be fighting near to a planet, in "
    "which case the defending player may buy planetary defences out of their normal points "
    "value - a small planet can have no more than 4 planetary defences, a medium planet can "
    "have a maximum of 5 planetary defences and a large planet a maximum of 6.",
    "It is also a good idea to put an upper limit on the amount of points that can be spent "
    "(for example, in a standard battle perhaps no more than 10% of the fleet's points may "
    "be spent on planetary defences).",
    "Stationary planetary defences may be placed in base contact if desired, but they can "
    "never be stacked or have their bases overlap other stationary planetary defences.",
    "Low orbit defences may only be deployed on the low orbit table.",
]
_PD_NOTES = [
    "Defences are bought from the fleet's points and count against the points limit. A "
    "scenario's own allowance (D6x10 pts per 500 pts of fleet, Rulebook pp. 132, 136, 140) "
    "is extra: raise the points limit by the amount you rolled.",
    "Defence points are left out when a list rule asks what the fleet is worth (commander "
    "needed over 750 pts, one per 500 pts and so on), and defences are not escorts or "
    "reserves of the fleet list.",
    "One-hit defences are bought as squadrons of 1-6 on one card (Rulebook p. 100); a card "
    "holds one type.",
]
_PD_HIGH = [
    # (row name, profile, pts, mx)  - order and limits p.499
    ("Orbital defence laser platform", "509", 30, None),
    ("Orbital torpedo launcher", "510", 30, None),
    ("Orbital weapons platform", "511", 30, None),
    ("Orbital mine", None, 5, None),
    ("Minefield", None, 40, 2),
    ("Fire ship", "516", 10, 6),
    ("System ship", "515", 20, None),
    ("Defence monitor", "514", 60, None),
    ("Orbital dock", "508", 90, None),
    ("Space station", "507", 150, None),
    ("Blackstone fortress", "506", 400, None),
]
_PD_LOW = [
    ("Defence laser silo", "517b", 15, 8),
    ("Missile silo", "517c", 5, 8),
    ("Air base", "517", 20, 4),
]
_PD_RC = {"Orbital mine": ("orbital_mine", 512), "Minefield": ("minefield", 513)}
#: a 1 HP defence that the squadron sentence of Rulebook p.100 concerns ("Orbital
#  defences or ships that count as defences"). Ground targets (p.517) are
#  neither, so the squadron rule does not name them.
_PD_SQ_RE = "^(orbital defence laser platform|orbital torpedo launcher|orbital weapons platform|fire ship|system ship|defence monitor)$"


def _pd_row(label, ref, pts, page, mx=None, nt=None):
    e = dict(l=label, r=None, p=pts, src_page=page, a=0, mx=mx, nt=nt, k="unit")
    if ref is None:
        _rc, _pg = _PD_RC[label]
        e["rc"] = _rc
        e["cnt"] = 1
        e["src_page"] = _pg
        return e
    assert str(ref) in ships, "ship %r is missing" % ref
    e["r"] = int(ref) if str(ref).isdigit() else str(ref)
    return e


def _pd_generic():
    return ([_pd_row(l, r, p, 499, mx=mx) for l, r, p, mx in _PD_HIGH]
            + [_pd_row(l, r, p, 499, mx=mx) for l, r, p, mx in _PD_LOW])


_PD_RAMILIES_NT = ("Bought from the fleet's points, rather than defences; in competitive "
                   "play only by prior agreement (Fleets p. 500).")
_PD_TAU = [
    ("Kor caste orbital city", "478", 150, 478, None),
    ("Security orbital", "479", 50, 479, None),
    ("Orbitals (core module)", "480", 20, 480,
     "Core module 20 pts plus up to four modules, chosen below: a security module costs "
     "its defence system and adds +1 turret, manufacturing & research +10 (+1 shield, to "
     "3; tracking system), habitat +5 (+1 damage point) (Fleets p. 480)."),
    ("Waystation", "481", 0, 481,
     "The Waystation costs what its one defence system costs: choose it below (Fleets p. 481)."),
]
_PD_TAU_TEXT = [
    "Orbitals can be used when planetary defences are allowed.",
    "The Tau may spend their points allocation for planetary defences on orbitals.",
    "Tau Orbitals follow all High Orbit and Satellite defence rules.",
    "The Tau may not use any other form of planetary defence.",
] + _PD_TEXT[:2]
# p.360 ORK PLANETARY DEFENCES (J172): "Ork Roks can be taken as planetary
# defences and purchased using planetary defence point allowances ... Ork Roks
# cannot move and count as stationary in all effects when purchased as
# defences". The same hull as the list's own Rok (p.392), but as a defence:
# a key of its own, so that the df flag does not take the list Rok's upgrades nor
# its movement rules. Speed 0 cm tells on the card and in the domain that it does not move.
# The Rok's own rules (p.393: a critical +1 damage, breaks into 4 Blast markers)
# stay: "Roks are sufficiently different to both Orbital Defences and true
# spaceships to require a number of special rules" (an interpretation, BACKLOG J172).
assert "392d" not in ships and ships["392"]["nm"] == "ROK" and ships["392"]["sp"] == "10 cm", ships["392"]
ships["392d"] = dict(ships["392"])
ships["392d"]["aw"] = [list(a) for a in ships["392"]["aw"]]
ships["392d"]["ol"] = []
ships["392d"]["sp"] = "0 cm"
ships["392d"]["tn"] = "–"
# p.480 TAU ORBITALS (J171): "no more than four other modules can be added to a
# single core. An Orbital costs points equal to its core module plus the sum of
# any other modules added." The four security systems became count options
# (the same text, the same option ID - saves survive), and each adds +1
# turret ("Each security module adds +1 turret to the Core module"). Manufacturing
# +10: "raises the array's shield value by 1 (to a maximum of 3)" - base 1,
# so at most two; "acts as a tracking system". Habitat +5: "adds 1 to
# the damage points". modmax = the whole group's limit; the domain adds the counts.
_o480 = ships["480"]["ol"]
assert [o["t"] for o in _o480] == ["Launch Bay +10 pts", "Gravitic hook +5 pts (Orca/Warden needs to be purchased separately)",
                                   "Railgun battery +15 pts", "Ion Cannon Turret +15 pts"], [o["t"] for o in _o480]
assert ships["480"]["sh"] == "1" and ships["480"]["hp"] == 4, ships["480"]
for _o in _o480:
    assert _o.get("grp") == "480_defence" and _o.get("gmax") == 1, _o
    del _o["grp"], _o["gmax"]
    _o["qty"] = dict(max=4)
    _o["mod"] = dict(tu=1)
    _o["mods"] = 1
for _t, _c, _mx, _md in (("Manufacturing & Research module +10 pts: +1 shield (to a maximum of 3); "
                          "the module's drone intelligences act as a tracking system", 10, 2, dict(sh=1)),
                         ("Habitat module +5 pts: +1 damage point", 5, 4, dict(hp=1))):
    _o480.append(dict(t=_t, c=_c, var=0, qty=dict(max=_mx), mod=_md, mods=1, id=_opt_id("480", _t)))
ships["480"]["modmax"] = dict(n=4, pg=480, src="Normally individual orbital modules are assembled into arrays of up "
                              "to five. In any event the first module of any orbital array must be the core module "
                              "and no more than four other modules can be added to a single core.")
_PD_ROK_NT = ("A Rok bought as a planetary defence cannot move (Fleets p. 360). Roks squadron only "
              "with other Roks, up to four (p. 367).")
_pd_n = dict(generic=0, ramilies=0, haven=0, tau=0)
for _L in lists_out:
    assert not any(x["t"].strip().upper() == _PD_TITLE for x in _L["secs"]), \
        "%s: %s already exists" % (_L["nm"], _PD_TITLE)
    _i = len(_L["secs"])
    _race = _L.get("race")
    _is_tau = _L["nm"].startswith("Tau ")
    if _is_tau:
        _ents = [_pd_row(l, r, p, pg, nt=nt) for l, r, p, pg, nt in _PD_TAU]
        _text, _rules = list(_PD_TAU_TEXT), []
        _pd_n["tau"] += 1
    else:
        _ents = _pd_generic()
        _text = list(_PD_TEXT)
        _rules = [dict(kind="squadron", min=1, max=6, ok=True, sec=[_i],
                       label="Defence squadrons (1-6 one-hit defences)",
                       pick=[dict(sec=_i, re=_PD_SQ_RE)], src=_PD_SQ)]
        _pd_n["generic"] += 1
        if _race in ("imperial navy", "chaos"):
            _ents.append(_pd_row("Ramilies class star fort", "500", 875, 500, nt=_PD_RAMILIES_NT))
            _text.append("The Ramilies is available to Imperial and Chaos Fleets, subject to the rules below.")
            _pd_n["ramilies"] += 1
        if _race in ("eldar", "craftworld eldar"):
            _ents.append(_pd_row("Haven space station", "334", 200, 334))
            _pd_n["haven"] += 1
        if _race == "dark eldar":
            _ents.append(_pd_row("Haven space station (pirate base)", "334b", 200, 347))
            _pd_n["haven"] += 1
        # p.360: "Instead of using the Imperial Blackstone Fortress, Orks use
        # a non-moving Space Hulk" - the same profile and price, a different model.
        if _race == "orks":
            _bs = [e for e in _ents if e["l"] == "Blackstone fortress"]
            assert len(_bs) == 1
            _bs[0]["nt"] = ("Orks field a non-moving Space Hulk in its place, on the same "
                            "profile and points cost (Fleets p. 360).")
            _ents.append(_pd_row("Rok", "392d", 80, 360, nt=_PD_ROK_NT))
            _pd_n["orks"] = _pd_n.get("orks", 0) + 1
    _L["secs"].append(dict(t=_PD_TITLE, text=_text, notes=list(_PD_NOTES), rules=_rules, ents=_ents))
assert _pd_n == dict(generic=30, ramilies=11, haven=4, tau=2, orks=3), _pd_n

# Profile flags. Each hits exactly once, and every profile sold in the section
# gets df - otherwise the list's upgrades would leak to it.
#   df  = a planetary defence profile: no list upgrades, no hull rules tied
#         by the list's name, not a fleet escort
#   sq  = a 1 HP defence whose type is not Escort: bought 1-6 at a time
#         on one squadron card (Rulebook p.100). The Defence monitor, system
#         ship and fire ship are already of type Escort.
#   dld = a fixed Leadership. 7: "do not roll for leadership or have a
#         leadership value ... reload ordnance (where applicable) on a
#         nominal leadership of 7" (p.499, Rulebook p.100); the Tau orbitals
#         "follow all High Orbit and Satellite defence rules" (p.451).
#         10: the Fortress-Monastery's "base leadership of 10" (p.111).
#         The Ramilies rolls like a capital ship (p.503) and the Haven by the Eldar
#         rules (p.336): no field.
#   dor = the allowed special orders. RO+BFI: "cannot take on any special
#         orders except Reload Ordnance, though they may also attempt to
#         Brace For Impact" (p.499). RO+LO+BFI: Ramilies p.503,
#         Fortress-Monastery p.110-111, Haven p.336.
_PD_FLAGS = [
    # key, df, sq, dld, dor
    ("500", 1, 0, None, "RO LO BFI"),
    ("110", 0, 0, 10, "RO LO BFI"),
    ("334", 1, 0, None, "LO RO BFI"), ("334b", 1, 0, None, "LO RO BFI"),
    ("506", 1, 0, 7, "RO BFI"), ("507", 1, 0, 7, "RO BFI"), ("508", 1, 0, 7, "RO BFI"),
    ("509", 1, 1, 7, "RO BFI"), ("510", 1, 1, 7, "RO BFI"), ("511", 1, 1, 7, "RO BFI"),
    ("514", 1, 0, 7, "RO BFI"), ("515", 1, 0, 7, "RO BFI"), ("516", 1, 0, 7, "RO BFI"),
    ("517", 1, 1, 7, "RO BFI"), ("517b", 1, 1, 7, "RO BFI"), ("517c", 1, 1, 7, "RO BFI"),
    ("478", 1, 0, 7, "RO BFI"), ("479", 1, 0, 7, "RO BFI"),
    ("480", 1, 0, 7, "RO BFI"), ("481", 1, 0, 7, "RO BFI"),
    # p.360: a Rok as a defence "Reload Ordnance and Brace For Impact, for
    # which they are Leadership 7"; other tests pass automatically.
    ("392d", 1, 0, 7, "RO BFI"),
]
_pd_seen = set()
for _k, _df, _sq, _dld, _dor in _PD_FLAGS:
    assert _k in ships and _k not in _pd_seen, "PD_FLAGS: %s" % _k
    _pd_seen.add(_k)
    if _df:
        ships[_k]["df"] = 1
    if _sq:
        assert ships[_k]["hp"] == 1 and ships[_k]["ty"] != "Escort", _k
        ships[_k]["sq"] = 1
    if _dld:
        ships[_k]["dld"] = _dld
    ships[_k]["dor"] = _dor.split()
ships["516"]["rc"] = "fire_ship"
# p.481: "Choose one of the defence systems below. This defines the point cost
# for the waystation." The group had only an upper limit (gmax 1): without a choice
# the Waystation cost 0 points and passed (review 9.10.2026).
# need1 = a group from which exactly one must be taken; resolveFleet checks it.
assert {o.get("grp") for o in ships["481"]["ol"]} == {"481_defence"}, ships["481"]["ol"]
ships["481"]["need1"] = dict(grp="481_defence", what="defence system", pg=481,
                             src="Choose one of the defence systems below. This defines the point cost for the waystation.")
# p.503: "A Ramilies also has a single command check re-roll" - in the price.
# Fortress-Monastery: p.111 speaks only of bought re-rolls, and the book does not
# say whether it inherits this (p.110 "follows all rules for the Ramilies"): open,
# BACKLOG J164.
assert not ships["500"].get("rr")
ships["500"]["rr"] = 1
# J168 b: a commander aboard -> the fort's re-rolls are his and the whole
# fleet's: Ramilies p.503 ("joins his re-rolls"), Fortress-Monastery p.111
# "re-rolls purchased by the fortress-monastery are added to the commander's
# own re-rolls and can be used by the entire fleet".
ships["500"]["rrj"] = 503
ships["110"]["rrj"] = 111
_pd_sold = {str(e["r"]) for _L in lists_out for _s in _L["secs"] if _s["t"] == _PD_TITLE
            for e in _s["ents"] if e.get("r")}
_pd_nodf = sorted(k for k in _pd_sold if not ships[k].get("df"))
assert not _pd_nodf, "a planetary defences section profile without the df flag: %s" % _pd_nodf
_pd_df = {k for k, v in ships.items() if v.get("df")}
assert _pd_df == _pd_sold, "the df flag on a profile the section does not sell: %s" % sorted(_pd_df ^ _pd_sold)
# Outside the section a df profile must not be sold: the row would then lose the list's
# upgrades unnoticed.
_pd_out = sorted("%s / %s / %s" % (_L["nm"], _s["t"], e["l"]) for _L in lists_out for _s in _L["secs"]
                 if _s["t"] != _PD_TITLE for e in _s["ents"] if e.get("r") and str(e["r"]) in _pd_df)
assert not _pd_out, "a df profile outside the section: %s" % _pd_out
print("planetary defences: the section on %d lists (general %d, Ramilies %d, Haven %d, Tau %d), df profiles %d"
      % (sum(_pd_n[k] for k in ("generic", "tau")), _pd_n["generic"], _pd_n["ramilies"],
         _pd_n["haven"], _pd_n["tau"], len(_pd_df)))

# ------------------------------------------- section kind (Fleets p.14 and p.15)
# Fleets p.14: "the restrictions on maximum and minimum numbers of ships are
# determined for the fleet as a whole, regardless of whether they were
# purchased from the list or as reserves." So a borrowed ship must land in
# the host list's quotas - but WHICH of them?
#
# The app counts by section, the book by type. The bridge between them is the section's
# HEADING: it is the book's own way of classifying a ship in the list where the ship is
# printed. A section is therefore either
#
#   "type"  = the heading names a ship kind (Cruisers, Battleships, ESCORTS...).
#             A ship of another list that is under the same heading on its own list
#             is counted here.
#   "own"   = the heading names certain OWN ships of the list (Planet Killer,
#             Chaos Space Hulk, Fortress-Monastery). Ships of another
#             list are not counted here, but they are the list's own ships.
#   "reserve" = the list's own reserve section: the ships belong to some OTHER list.
#             p.15: "a given fleet list cannot take as reserves ships listed
#             as reserves or allies to another fleet list ... you cannot use a
#             reserve of a reserve."
#   "access" = the list's named access to ships of another RACE (Kroot Vessels,
#             Demiurg Vessels, Nicassar, Rogue Traders, Tau Escorts, Stryxis).
#             p.15: "These may only be taken exactly as described on their
#             fleet list rules and may not also be taken as reserves."
#
# reserve and access behave in counting like own - borrowed ships are not counted
# in them - and in addition their rows cannot be borrowed at all.
#
# Decision T34 (14.9.2026): a borrowed ship is classified by the heading it is under
# on ITS OWN list. The book's own example p.14 counts a grand cruiser taken
# as a reserve in the host's grand cruiser quota, i.e. by kind;
# when the lists' headings differ (Bastion prints the grand cruisers under the heading
# "Battleships"), the source list's own heading decides, because it is the book's
# own classification for exactly that ship. If the host has no matching heading,
# the ship lands in no quota - under-counting is safer
# than the wrong quota, and it shows in the fleet view as a row.
SECTION_KINDS = ("type", "own", "reserve", "access", "defence")
SECTION_KIND = [
    # --- ship kinds ------------------------------------------------------
    ("battleships", "type", "the book's ship kind"),
    ("battlecruisers", "type", "the book's ship kind"),
    ("cruisers", "type", "the book's ship kind"),
    ("heavy cruisers", "type", "the book's ship kind"),
    ("grand cruisers", "type", "the book's ship kind"),
    ("escorts", "type", "the book's ship kind"),
    ("capital ships", "type", "the book's ship kind (tyranids)"),
    ("battle barges", "type", "the Space Marine lists' ship kind"),
    ("battleships & battlekroozers", "type", "the orks' ship kind"),
    ("kroozers", "type", "the orks' ship kind"),
    ("hive ships", "type", "the tyranids' ship kind"),
    ("kraken", "type", "the tyranids' ship kind"),
    ("vanguard drone ships", "type", "the tyranids' ship kind"),
    ("tombships", "type", "the necrons' ship kind"),
    ("wraithships", "type", "the eldar's ship kind"),
    ("dragonships", "type", "Iyanden's ship kind"),
    ("raiders", "type", "a ship kind"),
    ("big ship skwadron", "type", "the Clanz list's skwadron pattern is a ship kind"),
    ("‘uge ship skwadron", "type", "the Clanz list's skwadron pattern is a ship kind"),
    ("tiddla skwadron", "type", "the Clanz list's skwadron pattern is a ship kind"),
    # --- named ships and named access ------------------------------------
    ("planet killer", "own", "one named ship"),
    ("chaos space hulk", "own", "one named ship with its own conditions (p.288)"),
    ("space hulks", "own", "a named ship with its own conditions"),
    ("ork roks", "own", "a named ship"),
    ("roks", "own", "a named ship"),
    ("activated blackstone fortress", "own", "one named ship"),
    ("fortress-monastery", "own", "one named station (p.98)"),
    ("stryxis caravan vessels", "access", "the list's own named row"),
    ("kroot vessels", "access", "named access to another race's ships (p.15)"),
    ("the kroot", "access", "named access to another race's ships (p.15)"),
    ("demiurg vessels", "access", "named access to another race's ships (p.15)"),
    ("the demiurg", "access", "named access to another race's ships (p.15)"),
    ("nicassar vessels", "access", "named access to another race's ships (p.15)"),
    ("nicassar escorts", "access", "named access to another race's ships (p.15)"),
    ("tau escorts", "access", "named access to another race's ships (p.15)"),
    ("rogue traders", "access", "named access (p.174)"),
    ("rogue trader escorts", "access", "named access (p.174)"),
    ("transports", "own", "the Rogue Trader list's own transport section"),
    ("reserves", "reserve", "the list's own reserve section: the ships belong to another list"),
    ("ordo malleus reserves", "reserve",
     "J144 p.142: the Bastion list's Chaos hulls of a fleet led by an Ordo Malleus "
     "inquisitor; the same 1:3 budget as other reserves"),
    ("the reserve fleets of segmentum obscurus", "reserve",
     "Bastion's own reserve section (p.39): five Chaos hulls that use "
     "the same 1:3 budget as ships borrowed from elsewhere"),
    ("notes from nate montes", "own", "a rule box, not a ship kind"),
    # p.222: "do not count as reserves" and p.15: named access to another race's
    # ships "may not also be taken as reserves". It was own, so the reserve of a
    # reserve check did not hit (spot check 20, seeds 2026091421/23/42).
    ("renegade imperial vessels", "access",
     "the Chaos list's own renegade rows (p.222): 'they count as Chaos vessels "
     "in all respects', so they are not reserves and cannot be borrowed"),
    ("xenos allies", "access",
     "the Rogue Traders' named access to Demiurg and Kroot ships (p.175)"),
    ("the inquisition", "access",
     "the list's named access to Inquisition ships (p.138); not a ship kind and "
     "cannot be borrowed into another fleet"),
    # The fifth kind (8.10.2026). Planetary defences are not part of a fleet list
    # but the book's own chapter (p.496-517), whose rows are bought from the p.499
    # price list. A kind of its own, because the engine needs one switch: no
    # list upgrades, no reserves in either direction, no escort or
    # points threshold counting (domain.js resolveFleet, m.defence).
    ("planetary defences", "defence",
     "the book's own chapter p.496-517; rows from the p.499 price list, not from a fleet list"),
]

_KIND = {}
for _t, _k, _why in SECTION_KIND:
    assert _t not in _KIND, "SECTION_KIND: %r twice" % _t
    assert _k in SECTION_KINDS, _k
    _KIND[_t] = [_k, 0]
for _L in lists_out:
    for _sec in _L["secs"]:
        _has = any(e.get("r") and e.get("k") != "up" for e in (_sec.get("ents") or []))
        if not _has:
            continue
        _key = _sec["t"].strip().lower()
        assert _key in _KIND, (
            "section %r (%s) is not classified: add a row to the SECTION_KIND table. "
            "type = the book's ship kind, own = named ships or named access"
            % (_sec["t"], _L["nm"]))
        _sec["ct"] = _KIND[_key][0]
        _KIND[_key][1] += 1
_unused_kind = [t for t, v in _KIND.items() if not v[1]]
assert not _unused_kind, "SECTION_KIND: unused rows %s" % _unused_kind


def check_section_kinds(lists):
    """A section with ships must have a kind. An unclassified section must not
    be left on a default: then a borrowed ship would either land in the wrong quota
    or stay silently uncounted."""
    bad = []
    for Lz in lists:
        for sec in Lz["secs"]:
            if any(e.get("r") and e.get("k") != "up" for e in (sec.get("ents") or []))                and sec.get("ct") not in SECTION_KINDS:
                bad.append("%s / %s" % (Lz["nm"], sec["t"]))
    assert not bad, "section kind (ct) missing: %s" % bad[:5]


check_section_kinds(lists_out)
print("sections classified: %s"
      % {k: sum(1 for _L in lists_out for _s in _L["secs"] if _s.get("ct") == k)
         for k in SECTION_KINDS})

# --- J213: sentence starts picked as a section heading (docs/check-yourself) ---
# The extractor read a short line of the book as a heading: "Marine crew may be" (p.242,
# 246, 250), "Space Marine Chapters are fiercely" (p.139) and "The Rogue Trader
# cruiser profile" (p.174). The catalogue got a section named from the middle of
# a sentence. The sentence is assembled in the book's words; the first two move to
# the previous section (an empty section shows nowhere), the third gets the book's own
# subheading. The sections' indexes do not change, so the references hold.
def _frag_fix(nm, frag_t, first, into_t=None, new_t=None):
    _L = _p18_list(nm)
    _fi = _p18_sec(_L, frag_t)
    _F = _L["secs"][_fi]
    assert not _F.get("rules"), "%s / %s: the section has rules" % (nm, frag_t)
    _tx = list(_F.get("text") or [])
    assert _tx and first.endswith(_tx[0][-40:]), "%s / %s: the sentence is not the expected one: %r" % (nm, frag_t, _tx[:1])
    _tx[0] = first
    if new_t:
        _F["t"], _F["text"] = new_t, _tx
        return
    _T = _L["secs"][_p18_sec(_L, into_t)]
    _n0 = len(_T.get("text") or [])
    _own = (_T.get("own") or [None] * _n0) + (_F.get("own") or [None] * len(_tx))
    _T["text"] = (_T.get("text") or []) + _tx
    if any(_own):
        _T["own"] = _own
    _T["ents"] = (_T.get("ents") or []) + (_F.get("ents") or [])
    _F["text"], _F["ents"] = [], []
    _F.pop("own", None)
_CSM_TH = ("A ship with a Chaos Space Marine crew may be equipped with Thunderhawk Gunships but if so it may only "
           "carry Thunderhawks and may not launch Swiftdeaths, Doomfires and Dreadclaws.")
for _nm in ("Chaos — Nurgle", "Chaos — Khorne", "Chaos — Slaanesh"):
    _frag_fix(_nm, "Marine crew may be", _CSM_TH, into_t="ORDNANCE")
_frag_fix("The Emperor's Inquisition", "Space Marine Chapters are fiercely",
          "Space Marine Chapters are fiercely independent and will only grudgingly submit to having their "
          "leadership usurped by an Inquisitor Lord, regardless of his renown.", into_t="RESERVES AND ALLIES")
_frag_fix("Rogue Traders", "The Rogue Trader cruiser profile",
          "The Rogue Trader cruiser profile represents a Kar Durniash pattern Imperial Navy cruiser, a basic "
          "profile on which a Rogue Trader may customize as desired using the Xenotech rules.",
          new_t="ROGUE TRADER “CRUISERS”")
print("J213: sentences picked as a section heading fixed 5")

# --- J213: checks from the Check yourself classification (docs/check-yourself) --
# Every rule is the book's sentence as it is (src), so that the sentence moves in
# its section to the "Checked by the builder" group. The sentence is taken from the data and
# not written by hand: the curly apostrophes stay the same byte for byte.
def _j213_text(L, si, has):
    _h = [t for t in L["secs"][si].get("text") or [] if has in t]
    assert len(_h) == 1, "J213 %s / %s: %r hit %d sentences" % (L["nm"], L["secs"][si]["t"], has, len(_h))
    return _h[0]
_j213 = 0
# (a) p.453 (S1094): Kor'O'Mesme is always aboard his own Custodian.
_MS = _p18_list("Tau — Commerce Protection")
_ms_fr = [i for i, s in enumerate(_MS["secs"]) if s["t"].startswith("FLEET RULES")][0]
_MS["secs"][_ms_fr].setdefault("rules", []).append(dict(
    kind="requires", ok=True, label="Kor'O'Mesme needs his own battleship",
    if_pick=[dict(sec=_p18_sec(_MS, "Commander"), re="mesme")],
    then_pick=[dict(sec=_p18_sec(_MS, "Battleships"), re="^custodian")], min=1,
    src=_j213_text(_MS, _ms_fr, "is embarked aboard the Kor")))
_j213 += 1
# (b) p.177 (S0380, S0384, S0386): the Exploration list's allies from one
# list; no Demiurg or Kroot if Space Marine ships are included.
_EXR = _p18_sec(_EX, "RESERVES AND ALLIES")
_EX["secs"][_EXR].setdefault("rules", []).append(dict(
    kind="one_donor", ok=True, roles=["ally"], label="Allies from one fleet list",
    src=_j213_text(_EX, _EXR, "they can only be from one fleet")))
for _t, _has, _lab in (("The Demiurg", "Demiurg vessels may not be employed if Space Marines",
                        "No Demiurg with Space Marines"),
                       ("The Kroot", "A Kroot Warsphere may not be employed if Space Marines",
                        "No Kroot with Space Marines")):
    _si = _p18_sec(_EX, _t)
    _EX["secs"][_si].setdefault("rules", []).append(dict(
        kind="conditional_cap", ok=True, label=_lab, pick=[dict(sec=_si)],
        cond_pick=[dict(race="space marines")], cond_min=1, max_unmet=None, max_met=0,
        src=_j213_text(_EX, _si, _has)))
    _j213 += 1
# (c) Agreement rules (S0352 p.174, S1004 p.426): the row is legal only with
# the opponent's consent - the check shows it yellow when the row is
# taken.
for _nm in ("Rogue Traders", "Rogue Traders — Exploration",
            "Rogue Traders — Pirates and Wolf Packs"):
    _L = _p18_list(_nm)
    _si = _p18_sec(_L, "NOTES FROM NATE MONTES")
    _L["secs"][_si].setdefault("rules", []).append(dict(
        kind="agreement", ok=True, label="Siluria and Havoc (outdated ships)", pick=[dict(sec=_si)],
        src=_j213_text(_L, _si, "If both players agree before the game")))
    _j213 += 1
for _nm in ("Tyranids — Hive Fleet", "Tyranids — Vanguard Fleet"):
    _L = _p18_list(_nm)
    _si = _p18_sec(_L, "BIO-ENHANCEMENTS")
    _L["secs"][_si].setdefault("rules", []).append(dict(
        kind="agreement", ok=True, label="Bio-enhancements in a one-off game", up_sec=_si,
        src=_j213_text(_L, _si, "These refits can only be used in one-off games")))
    _j213 += 1
# (d) Adeptus Mechanicus reserves (p.121-122, S0246 S0249 S0250 S0255 S0256).
# Space Marine reserves without an inquisitor, when the fleet has no
# ordinary Imperial Navy capital ships nor alien ships; they get their own
# ratio (strike cruiser / 3 Mechanicus capital ships, battle barge / 3 strike
# cruisers) instead of the general per-type 1:3. Reserve capital ships
# at most one per three own capital ships. Reserve escorts without
# the 1:3 limit when they are from the same list as a reserve capital ship (T51).
_AMX = _p18_list("Adeptus Mechanicus — Explorator")
_amf = [i for i, s in enumerate(_AMX["secs"]) if s["t"].startswith("FLEET RULES")][0]
_AM_SM_SRC = _j213_text(_AMX, _amf, "Space Marines can also be used as reserves in a Mechanicus fleet")
_AMX.setdefault("res_ok", []).append(dict(
    race="space marines", unless_fl="IMPERIAL NAVY", unless_xenos=True,
    needs_what="no regular Imperial Navy capital ships and no alien vessels in the fleet (or an Inquisitor Lord)",
    src=_AM_SM_SRC + " (Fleets p. 121)"))
_AMX["res_mech"] = dict(
    cap_src=_j213_text(_AMX, _amf, "No more than one reserve vessel can be taken for every three capital ships") + " (Fleets p. 121)",
    sm_src=_j213_text(_AMX, _amf, "They can be taken in the ratio of one strike cruiser") + " (Fleets p. 121)",
    esc_src=_j213_text(_AMX, _amf, "There are no restrictions on how many reserve Imperial Navy") + " "
            + _j213_text(_AMX, _amf, "Escorts taken in this manner must be taken from the same fleet list") + " (Fleets p. 122)",
    interp=dict(id="T51", note="Open interpretation: \"Escorts taken in this manner must be taken from the same fleet "
                "list reserve capital ships are being drawn from\" (Fleets p. 122). The app reads it as: reserve escorts "
                "are free of the 1:3 limit when a reserve capital ship comes from the same list; other reserve escorts "
                "count against the normal 1:3."))
_j213 += 1
assert _j213 == 9, "J213: additions %d" % _j213
print("J213: checks added %d" % _j213)

# J214 (check yourself phase 3): fleet facts the builder counts from
# the fleet: attack rating, the opponent's free extras and the Demiurg's
# VP values. They are not checks but information counted for the player
# (domain.js fleetFacts). The data refers to no section indexes.
#
# ar = rules in order: {v, cite:[{s, pg, rb}], when}. The when conditions
# are read from the fleet's units: all = there is a row for every regex, none =
# for none, from = some ship comes from this origin (a borrowed list's
# race or name, or the heading of the own list's access section). An unconditional rule is
# the base number; conditional ones override it. Two conditional rules giving
# different numbers = a contradiction in the book, which is shown and not chosen (T53).
def _cite(s, pg, rb=False):
    return dict(s=s, pg=pg, rb=1) if rb else dict(s=s, pg=pg)
def _ar(v, *cites, **when):
    r = dict(v=v, cite=list(cites))
    if when: r["when"] = when
    return r
_AR_IN = _cite("The Imperial Navy have a starting attack or initiative rating of 2.", 32)
_AR_MECH = _cite("The Adeptus Mechanicus have a starting attack or initiative rating of 2.", 118)
_AR_SM = _cite("Space Marines have a starting attack or initiative rating of 3.", 94)
_AR_IL_IN = _cite("An Imperial Navy or Adeptus Mechanicus fleet led by an Inquisitor Lord has an attack rating of 2.", 139)
_AR_IL_SM = _cite("A Space Marine fleet led by an Inquisitor Lord has an attack rating of 3 unless a Blackship is "
                  "accompanying the fleet, in which case its attack rating is 2.", 139)
_AR_IL_GK = _cite("A Grey Knights fleet led by an Inquisitor Lord has an attack rating of 3 unless a Blackship is "
                  "accompanying the fleet, in which case its attack rating is 2.", 145)
_AR_GK = _cite("Grey Knights count as Space Marines in all respects and as such follow all rules for Space Marines "
               "as written on pages 92-94.", 144)
_AR_CW = _cite("An Eldar fleet containing any Craftworld Eldar vessels has an attack (or initiative) rating of 3.", 302)
_AR_CORS = _cite("An Eldar Corsair fleet containing no Craftworld Eldar vessels has an attack (or initiative) rating of 4.", 302)
_AR_YRIEL = _cite("A fleet led by him has an attack rating of 4, even if it includes Craftworld vessels.", 319)
# Rulebook p.120: the table "ATTACK RATINGS". Used only when the Fleets book's
# list has no number of its own (Orks, Dark Eldar).
_AR_RB = lambda nm, v: _cite("The chart that follows shows the attack ratings of all fleets. %s: %d" % (nm, v), 120, rb=True)
_LORD, _BSHIP, _YR = "inquisitor lord", "^inquisition blackship", "^prince yriel"
_CWF = ["^craftworld eldar$"]
def _lord_sm(c):
    return [_ar(3, c, all=[_LORD], none=[_BSHIP]), _ar(2, c, all=[_LORD, _BSHIP])]
_AR = {
    "Imperial Navy": [_ar(2, _AR_IN), _ar(2, _AR_IL_IN, all=[_LORD])],
    "Adeptus Mechanicus — Explorator": [_ar(2, _AR_MECH), _ar(2, _AR_IL_IN, all=[_LORD])],
    "Space Marines — Codex Astartes": [_ar(3, _AR_SM)] + _lord_sm(_AR_IL_SM),
    "Space Marines — Crusade": [
        _ar(3, _cite("A Space Marine Crusade Fleet has an attack rating of 3.", 99)),
        _ar(1, _cite("If the fleet includes a fortress- monastery, it has an attack rating of 1; even Space Marines "
                     "find it difficult to launch a surprise blitz with a billion tons of fortress monastery in tow!", 99),
            all=["^fortress-monastery"])] + _lord_sm(_AR_IL_SM),
    "Space Marines — Dominion": [
        _ar(3, _cite("A Space Marine Dominion Fleet has an attack rating of 3.", 101)),
        _ar(2, _cite("This is reduced to 2 if the fleet has any Imperial Navy, Mechanicus or Rogue Trader vessels "
                     "at all.", 101), frm=["^imperial navy$", "^rogue traders", "^adeptus mechanicus"])] + _lord_sm(_AR_IL_SM),
    "Grey Knights": [_ar(3, _AR_GK, _AR_SM)] + _lord_sm(_AR_IL_GK),
    "Rogue Traders — Exploration": [_ar(3, _cite("When used with this fleet list, Rogue Traders have an attack "
                                                 "(initiative) rating of 3.", 176))],
    "Rogue Traders — Pirates and Wolf Packs": [_ar(3, _cite("Pirate fleets have an attack or initiative rating of 3.", 178))],
    "Chaos": [_ar(2, _cite("Chaos fleets have a starting attack or initiative rating of 2.", 222))],
    "Eldar Corsairs": [_ar(4, _AR_CORS), _ar(3, _AR_CW, frm=_CWF, none=[_YR]), _ar(4, _AR_YRIEL, all=[_YR])],
    "Eldar — Iyanden Craftworld": [_ar(3, _AR_CW), _ar(4, _AR_YRIEL, all=[_YR])],
    "Dark Eldar": [_ar(4, _AR_RB("Dark Eldar", 4))],
    "Orks": [_ar(3, _AR_RB("Orks", 3))],
    "Necrons": [_ar(4, _cite("Necrons have a starting attack or initiative rating of 4.", 400))],
    "Tyranids": [_ar(3, _cite("Tyranids have a starting attack or initiative rating of 3.", 416))],
    "Tau": [_ar(2, _cite("Tau have a starting attack or initiative rating of 2.", 450))],
    "Demiurg — War Host": [_ar(2, _cite("The Demiurg fleet has an Attack or Initiative rating of 2.", 486))],
}
# Lists without a number: "not given" is shown with where the number could come from
# (T53). The Inquisition is not an independent fleet (p.132), the Rogue Traders
# list (p.168-175) has no number of its own.
_AR_NONE = {
    "The Emperor's Inquisition": [_AR_IL_IN, _AR_IL_SM],
    "Rogue Traders": [_cite("When used with this fleet list, Rogue Traders have an attack (initiative) rating of 3.", 176),
                      _cite("The chart that follows shows the attack ratings of all fleets. Imperial: 2", 120, rb=True)],
}
# Sentences that are not in the sections' text (the race's general rules were left out of
# the extraction): the golden cases' why + check_quotes.py prove them.
_AR_OFFTEXT = {"Chaos fleets have a starting", "An Eldar fleet containing any", "An Eldar Corsair fleet containing no",
               "Tyranids have a starting"}
_all_text = " ".join(_text_key(t) for _L in lists_out for _s in _L["secs"] for t in (_s.get("text") or []))
_j214 = 0
for _L in lists_out:
    _keys = ([k for k in list(_AR) + list(_AR_NONE) if _L["nm"] == k]
             or [k for k in list(_AR) + list(_AR_NONE) if _L["nm"].startswith(k + " —")])
    assert len(_keys) == 1, "J214: attack rating for list %s: %s" % (_L["nm"], _keys)
    if _keys[0] in _AR_NONE:
        _L["ar"] = dict(rules=[], none=_AR_NONE[_keys[0]])
    else:
        _L["ar"] = dict(rules=_AR[_keys[0]])
    for _r in _L["ar"]["rules"]:
        for _c in _r["cite"] + _L["ar"].get("none", []):
            if _c.get("rb") or any(_c["s"].startswith(x) for x in _AR_OFFTEXT):
                continue
            assert _text_key(_c["s"]) in _all_text, "J214: the sentence is not in the book's text: %s" % _c["s"]
    _j214 += 1
assert _j214 == len(lists_out) == 32, _j214

# The opponent's free extras. opp = [{pick:[regex], what, many, cite}]:
# count = the sum of the hulls of the chosen rows (a commander = 1).
_OPP_MAL = dict(pick=["^ordo malleus inquisitor lord$"], what="Mark of Chaos or Daemonship",
                many="Marks of Chaos or Daemonships",
                cite=[_cite("The enemy Chaos fleet may add one Mark of Chaos or upgrade a cruiser to a Daemonship at "
                            "no cost.", 142)])
_OPP_XEN = dict(pick=["^ordo xenos inquisitor lord$"], fixed="D6×50 pts of escorts",
                cite=[_cite("The enemy Xenos fleet adds D6×50 points of escort vessels to its fleet for free.", 141)])
_OPP_GK = dict(pick=["^ordo malleus inquisitor lord", "^grey knights strike cruiser"],
               what="Mark of Chaos or Daemonship", many="Marks of Chaos or Daemonships",
               cite=[_cite("An enemy Chaos fleet may add one Mark of Chaos; or upgrade a cruiser to a Daemonship; for "
                           "no aditional cost, for each of the following included in the Grey Knights Fleet: "
                           "Ordo Malleus Inquisitor Lord, Grey Knights Strike Cruiser", 145)])
_nopp = 0
for _L in lists_out:
    _labs = set(e["l"].lower() for _s in _L["secs"] for e in (_s.get("ents") or []))
    _o = []
    if _L["nm"] == "Grey Knights":
        _o.append(_OPP_GK)
    elif "ordo malleus inquisitor lord" in _labs:
        _o.append(_OPP_MAL)
    if "ordo xenos inquisitor lord" in _labs:
        _o.append(_OPP_XEN)
    if _o:
        _L["opp"] = _o
        _nopp += 1
# Ordo Malleus: 4 IN lists, AdMech and Inquisition; Grey Knights; Ordo Xenos only in the Inquisition
assert _nopp == 7, "J214: opponent's extras on %d lists" % _nopp

# The Demiurg's VP value (p.486, Determination): "Demiurg vessels used with this
# fleet list" - only on the War Host list and only for Demiurg ships.
_VPL = _p18_list("Demiurg — War Host")
_VPL["vp"] = dict(fl="^DEMIURG$", rows=[dict(re="^stronghold", nm="Stronghold", v=400),
                                        dict(re="^bastion", nm="Bastion", v=300),
                                        dict(re="^citadel", nm="Citadel", v=200)],
                  cite=[_cite("Though their point cost remains unchanged, Strongholds are worth 400 points, Bastions "
                              "are worth 300 points and Citadels are worth 200 points when determining Victory Points.", 486)])
assert _text_key(_VPL["vp"]["cite"][0]["s"]) in _all_text
print("J214: attack rating on %d lists, opponent's extras on %d lists, VP values on 1 list" % (_j214, _nopp))

# J215 (check yourself phase 4): whose ship a commander is aboard. L.place =
# rules for commander rows (cmd = the row's regex), domain.js placeCommanders.
#   prefer   [{re, cite}] in order: the first one present in the fleet
#            narrows the choice to them (MoF -> battle barge, Inquisitor ->
#            Inquisitorial Cruiser -> Blackship)
#   dearest  {cite, n}: otherwise the dearest ship; n = as many of the dearest as
#            there are commanders of the same rule (Pirate Captains p. 178)
#   only     {any:[{re, arm}], capital, mech, cite}: only ships like these
#   no_up    [{re, cite}]: not a ship with this upgrade (Daemonship)
#   not_with [{cmd, cite}]: not the same ship as this commander
#   alone    {cite}: commanders of the same rule on different ships
#   skip     no person aboard a ship (the Ordo binding is an addition to the Inquisitor Lord)
# A commander without a rule (Admiral etc.) is chosen freely, the dearest by default.
_pl = lambda s, pg: _cite(s, pg)
_PL_INQ = dict(cmd="^inquisitor lord", prefer=[
    dict(re="^inquisitorial cruiser", cite=_pl("They must be aboard an Inquisitorial Cruiser if one is included, "
                                             "otherwise they must be on an Inquisition Blackship if one is included.", 138)),
    dict(re="^inquisition blackship", cite=_pl("They must be aboard an Inquisitorial Cruiser if one is included, "
                                             "otherwise they must be on an Inquisition Blackship if one is included.", 138))])
_PL_ORDO = dict(cmd=r"^ordo \w+ inquisitor lord$", skip=True)
_PL_MOF = lambda re, s, pg: dict(cmd="^master of the fleet", prefer=[dict(re=re, cite=_pl(s, pg))])
_CH_WM = _cite("Under no circumstance can a Chaos Lord be placed on the same ship as a Warmaster.", 222)
_CH_AB = _cite("You may not place a Chaos Lord on the same ship as Abaddon.", 231)
def _chaos(wm_s, wm_pg, lord_s, lord_pg, dae_s, dae_pg):
    dae = [dict(re="^daemonship", cite=_cite(dae_s, dae_pg))]
    return [dict(cmd="^chaos warmaster", dearest=dict(cite=_cite(wm_s, wm_pg)), no_up=dae),
            dict(cmd="^abaddon", prefer=[dict(re="^planet killer",
                 cite=_cite("If Abaddon is present, he must be aboard the Planet Killer.", 235))]),
            dict(cmd="^chaos lord", only=dict(capital=True, cite=_cite(lord_s, lord_pg)), no_up=dae,
                 not_with=[dict(cmd="^chaos warmaster", cite=_CH_WM), dict(cmd="^abaddon", cite=_CH_AB)],
                 alone=dict(cite=_cite(lord_s, lord_pg)))]
_LORD_BC = "Any capital ship, apart from that of the Warmaster, may be captained by a Chaos Lord."
_LORD_G = "Any capital ship apart from that of the Warmaster may be captained by a Chaos Lord."
_WM_G = "He must be assigned to the most expensive ship and improves its rolled Leadership by +2, to a maximum of 10."
_DAE_G = "A Daemonship may not be commanded by a Warmaster or a Chaos Lord, even if it is the largest ship in the fleet."
_YRIEL = dict(cmd="^prince yriel",
              prefer=[dict(re="^flame of asuryan", cite=_cite("He must be embarked aboard the Flame of Asuryan if it "
                                                              "is present, in which case his cost is 125 points.", 319))],
              only=dict(any=[dict(re="^flame of asuryan"), dict(re="^dragonship", arm="launch bay")],
                        cite=_cite("When Yriel is taken he must be placed on a Craftworld Eldar Dragonship with launch "
                                   "bays, but you may instead pick the Flame of Asuryan as his command ship to be "
                                   "embarked on.", 319)))
_PLACE = {
    "Imperial Navy": [_PL_INQ, _PL_ORDO],
    "Space Marines — Codex Astartes": [
        _PL_MOF("battle barge", "If your fleet includes any battle barges, he must be assigned to a battle barge in "
                "preference to a strike cruiser.", 97), _PL_INQ],
    "Space Marines — Crusade": [
        _PL_MOF("battle barge", "If your fleet includes any battle barges, he must be assigned to a battle barge.", 98),
        _PL_INQ],
    "Space Marines — Dominion": [
        _PL_MOF("^venerable battle barge", "If a Venerable battle barge is included in the fleet, the Master of the "
                "Fleet must be assigned to it.", 100), _PL_INQ],
    "Adeptus Mechanicus — Explorator": [
        dict(cmd="^archmagos veneratus",
             prefer=[dict(re="ark mechanicus", cite=_cite("An Archmagos Veneratus must be embarked on an Ark "
                                                          "Mechanicus if one is included in the fleet.", 124))],
             only=dict(mech=True, cite=_cite("An Adeptus Mechanicus fleet commander can only be embarked on a "
                                             "Mechanicus ship.", 121))),
        dict(cmd="^archmagos", only=dict(mech=True, cite=_cite("An Adeptus Mechanicus fleet commander can only be "
                                                               "embarked on a Mechanicus ship.", 121))),
        _PL_INQ, _PL_ORDO],
    "The Emperor's Inquisition": [_PL_INQ, _PL_ORDO],
    "Grey Knights": [dict(cmd="inquisitor lord", prefer=[
        dict(re="^inquisitorial cruiser", cite=_cite("If an Inquisitorial Cruiser is present the Inquisitor Lord "
                                                     "must be placed aboard it.", 144)),
        dict(re="^inquisition blackship", cite=_cite("If the Inquisitorial Cruiser is not present but a Blackship "
                                                     "is then the Inquisitor Lord must be placed aboard the "
                                                     "Blackship.", 144))],
        dearest=dict(cite=_cite("Otherwise the Inquisitor must be placed on the most expensive ship.", 144)))],
    "Rogue Traders": [
        dict(cmd="^veteran rogue trader", only=dict(any=[dict(re="^rogue trader cruiser")],
             cite=_cite("A Veteran Rogue Trader may lead each Rogue Trader cruiser in a fleet.", 174)),
             alone=dict(cite=_cite("A Veteran Rogue Trader may lead each Rogue Trader cruiser in a fleet.", 174)))],
    "Rogue Traders — Pirates and Wolf Packs": [
        dict(cmd="^pirate captain", dearest=dict(n=True, cite=_cite(
            "He (or she!) must be placed aboard the most expensive vessel in the fleet (or vessels if more than one "
            "Captain is present).", 178)),
             alone=dict(cite=_cite("He (or she!) must be placed aboard the most expensive vessel in the fleet (or "
                                   "vessels if more than one Captain is present).", 178)))],
    "Chaos — Incursion": [
        dict(cmd="^chaos warmaster", dearest=dict(cite=_cite(
            "He must be assigned to the biggest (ie, most expensive) ship and improves its Leadership to the value "
            "shown below.", 232))),
        dict(cmd="^chaos lord", not_with=[dict(cmd="^chaos warmaster", cite=_CH_WM)])],
    "Chaos — Black Crusade": _chaos("He must be assigned to the most expensive ship and improves its rolled "
                                    "Leadership by +2, to a maximum of 9.", 234, _LORD_BC, 234,
                                    "A Daemon ship may not be commanded by a Warmaster or a Chaos Lord even if it is "
                                    "the largest ship in the fleet.", 235),
    "Chaos — Tzeentch": _chaos(_WM_G, 236, _LORD_G, 236, _DAE_G, 237),
    "Chaos — Nurgle": _chaos(_WM_G, 240, _LORD_G, 240, _DAE_G, 241),
    "Chaos — Khorne": _chaos(_WM_G, 244, _LORD_G, 244, _DAE_G, 245),
    "Chaos — Slaanesh": _chaos(_WM_G, 248, _LORD_G, 248, _DAE_G, 249),
    "Eldar Corsairs": [
        dict(cmd="^eldar hero", prefer=[dict(re="^flame of asuryan", cite=_cite(
            "If the Flame of Asuryan is taken, the Eldar Hero must be embarked aboard it.", 316))]), _YRIEL],
    "Eldar — Iyanden Craftworld": [_YRIEL],
    "Tau — Commerce Protection": [
        dict(cmd="^kor.o.mesme", prefer=[dict(re="^custodian", cite=_cite(
            "Kor’O’Mesme is embarked aboard the Kor’or’vesh vessel Bor’kan Or’es El’Leath Se’arle O’Mesme "
            "(Custodian Class Battleship).", 453))])],
}
# p.222 and p.231 (the short form) are not in the sections' text; the golden why + check_quotes prove them.
_PL_OFFTEXT = {"Under no circumstance can a Chaos Lord", "You may not place a Chaos Lord on the same ship as Abaddon."}
_j215 = 0
for _L in lists_out:
    _keys = ([k for k in _PLACE if _L["nm"] == k] or [k for k in _PLACE if _L["nm"].startswith(k + " —")])
    if not _keys:
        continue
    assert len(_keys) == 1, (_L["nm"], _keys)
    _L["place"] = _PLACE[_keys[0]]
    _labs = [e["l"] for _s in _L["secs"] for e in (_s.get("ents") or []) if e.get("k") == "cmd"]
    for _r in _L["place"]:
        # every rule hits at least one commander row of the list
        assert any(re.search(_r["cmd"], l, re.I) for l in _labs), "J215: %s: %s does not hit" % (_L["nm"], _r["cmd"])
        _cs = [p["cite"] for p in _r.get("prefer", [])] + [x["cite"] for x in _r.get("no_up", []) + _r.get("not_with", [])]
        _cs += [_r[k]["cite"] for k in ("dearest", "only", "alone") if k in _r]
        for _c in _cs:
            if any(_c["s"].startswith(x) for x in _PL_OFFTEXT):
                continue
            assert _text_key(_c["s"]) in _all_text, "J215: the sentence is not in the book's text: %s" % _c["s"]
    _j215 += 1
assert _j215 == 23, "J215: placement rules on %d lists" % _j215
print("J215: commander placement rules on %d lists" % _j215)

# J216 (check yourself phase 5): squadrons and the Clanz Warlords.
# A unit's sq = a squadron tag (the same tag = the same squadron, p.13), in Clanz
# cmd = the Warlord's uid. The general p.13 rule is in domain.js (SQ_*); here
# the lists' exceptions by section NAME (not by index):
#   sqx      [{sec, min, max, only, cite}]: a squadron assembled from this section
#   sq_noup  [{re, cite}]: a ship with this upgrade is not in a squadron
#   sq_need  [{cmd, cite}]: this commander's ship is in a squadron
_CZL = _p18_list("Orks — Da Ork Clanz")
_CZ_CITE = lambda s, pg: _cite(s, pg)
_CZL["clanz"] = dict(
    warlord="^ork warlord",
    tiddla="^tiddla skwadron$", big="^big ship skwadron$", uge="uge ship skwadron$", hulk="^space hulks$", rok="^roks$",
    # gub_re: the Gubbins allowance (p.372) does not include More Gubbins (p.371 "any number of capital ships") nor
    # Deathskullz's free looted copy (J7, p.369: a clan benefit for every Deathskullz skwadron, J232)
    clan_sec="^clan upgrades$", gub_sec="^gubbins$",
    gub_re=_CZ_GUB_RE,
    sk=_cite("For every re-roll a Warlord has (including the first one for free), the Warlord must be in command of "
             "one tiddla skwadron of at least three escorts and one other skwadrons.", 372),
    sk_interp="Open interpretation T52: read as exactly one tiddla and one other skwadron per re-roll, as the "
              "book's smallest and largest fleets show (Fleets p. 373).",
    uge1=_cite("There is no restriction for what kinds or how many of what type of skwadrons are in the fleet as long "
               "as no Warlord may have more than one ’Uge Ship, which counts as a skwadron by itself.", 373),
    uge2=_cite("A Warlord must have two kroozers in order to take a “Uge ship, meaning the Warlord must have at least "
               "one extra re-roll to do so.", 373),
    hulk1=_cite("A Warlord leading a Space Hulk may only lead it and no other ships, but he is not required to take any "
                "extra re-rolls to do so if it is not desired.", 373),
    hulk2=_cite("One of your Warlords must be embarked on it, which by itself counts as all the skwadrons that Warlord "
                "can have (including a tiddla skwadron), regardless of how many re-rolls the Warlord has.", 372),
    clan=_cite("A Warlord and his skwadrons may only be from one clan, but as many different clans as desired can be "
               "in a single fleet.", 369),
    clan_sq=_cite("If taken, every capital ship in the skwadron must separately take and pay for the clan upgrade, not "
                  "just individual ships.", 369),
    gub=_cite("A Warlord may choose for his own ship or escort skwadron one upgrade from the Gubbins list for every "
              "re-roll he has at its listed cost.", 372),
    # J232: a skwadron belongs to one Warlord and is not split (p.373)
    split=_cite("Each skwadron must be fielded with the number of ships chosen for it in this list; you can\u2019t "
                "split up skwadrons or add more ships to them.", 373))
_CZL["sqx"] = [dict(sec="^big ship skwadron$", min=1, max=2, only=True, name="kroozers",
                    cite=_cite("1-2 Kroozers, chosen from the following list:", 372)),
                # J232 (the user 24.10.2026 asked whether a Rok skwadron works like a capital ship, and to fix it):
                # a Rok skwadron is 1-4 Roks as a Big ship skwadron is 1-2 kroozers. The book prints
                # the size as the section heading (p.372 "Rok skwadron / 1-4 Roks"), so the sentence is the heading.
                dict(sec="^roks$", min=1, max=4, only=True, name="Roks", cite=_cite("1\u20134 Roks", 372))]
# The Warlord on the dearest ship under his OWN command (p.372), not of the whole fleet.
_CZL["place"] = [dict(cmd="^ork warlord", dearest=dict(own=True, cite=_cite(
    "He must be embarked on the most expensive ship under his own command (as opposed to the whole fleet), even if it "
    "is an escort - annotate which one it is.", 372)))]
_WAL = _p18_list("Orks — Waaagh!")
_WAL["sqx"] = [dict(sec="^ork roks$", min=2, max=4, only=True, name="Roks", cite=_cite(
    "Ork Roks may be squadroned with up to three other Roks (total squadron size of four), but not with any other "
    "vessels.", 367))]
_nsq = 0
for _L in lists_out:
    if _L["nm"] in ("Chaos — Black Crusade", "Chaos — Tzeentch", "Chaos — Nurgle", "Chaos — Khorne", "Chaos — Slaanesh"):
        _L["sq_noup"] = [dict(re="^daemonship", cite=_cite("Daemonships cannot be used in squadrons.", 227))]
        _nsq += 1
assert _nsq == 5, _nsq
_p18_list("Imperial Navy — Bastion Fleets")["sq_need"] = [dict(cmd="^veteran captain", cite=_cite(
    "Ships assigned a Veteran Captain must be squadroned on the tabletop (their skills are too precious to waste on "
    "lone ships).", 38))]
for _L in (_CZL, _WAL):
    for _x in _L["sqx"]:
        assert sum(1 for _s in _L["secs"] if re.search(_x["sec"], _s["t"].strip(), re.I)) == 1, (_L["nm"], _x["sec"])
for _k in ("tiddla", "big", "uge", "hulk", "rok", "clan_sec", "gub_sec"):
    assert sum(1 for _s in _CZL["secs"] if re.search(_CZL["clanz"][_k], _s["t"].strip(), re.I)) == 1, _k
# J232: the section heading ("1-4 Roks", p.372) is the book's text, although the extraction does not take it into the section's text
_RAW_HEADS = set(_text_key(_s.get("head") or "") for _Lx in json.load(io.open(os.path.join(_HERE, "lists_raw.json"), encoding="utf-8"))
                 for _s in _Lx.get("sections") or [])
for _L in lists_out:
    for _x in (_L.get("sqx") or []) + (_L.get("sq_noup") or []) + (_L.get("sq_need") or []):
        assert _text_key(_x["cite"]["s"]) in _all_text or _text_key(_x["cite"]["s"]) in _RAW_HEADS, \
            "J216: the sentence is not in the book's text: %s" % _x["cite"]["s"]
for _k, _c in _CZL["clanz"].items():
    if isinstance(_c, dict):
        assert _text_key(_c["s"]) in _all_text, "J216: the sentence is not in the book's text: %s" % _c["s"]
print("J216: squadron exceptions on 2 lists (in Clanz kroozers and Roks, J232), the Daemonship ban on %d lists, the Clanz command" % _nsq)

# J224: the Waaagh! list's hulk Warlord pays +50 for Extra Power Fields
# (p.390). The row "Extra Power Fields (Space Hulk)" comes from upgrades.py;
# resolveFleet compares the row the Warlord took with the ship he is aboard (J215):
# on a hulk the +25 row is red, elsewhere the +50 row. The placement does not change the price
# (J8), it is a check.
_WAL["hulk_pf"] = dict(
    cmd="^ork warlord$", sec="^warlord$", row="^Extra Power Fields$",
    hulk_row=r"^Extra Power Fields \(Space Hulk\)$", ship="^ork hulk$",
    cite=_cite("Extra Powerfields costs +50 pts instead of +25.", 390))
assert sum(1 for _s in _WAL["secs"] if re.search(_WAL["hulk_pf"]["sec"], _s["t"].strip(), re.I)) == 1
for _k in ("row", "hulk_row"):
    assert sum(1 for _s in _WAL["secs"] if re.search(_WAL["hulk_pf"]["sec"], _s["t"].strip(), re.I)
               for _e in _s["ents"] if re.search(_WAL["hulk_pf"][_k], str(_e["l"]))) == 1, _k
# The sentence is from the Ork hulk profile's continuation page (p.390, the WARLORDS part), not
# from a list page, so _all_text does not contain it; read by hand from the PDF on 20.10.2026
# (the same rule in domain.js's hulk special rules).
print("J224: the Waaagh! hulk Warlord's Extra Power Fields +50")

# J217 (check yourself phase 6A): routes.
# p.49: "In a Bakka fleet list, cruisers from the Adeptus Mechanicus fleet list
# may be taken instead of and in the same manner as Imperial Navy
# battlecruisers, counting as battlecruisers against any fleet limits in all
# respects." The AdMech list's Cruisers rows into Bakka's Battlecruisers section as their own
# rows at AdMech's price; mech=1 makes them Mechanicus ships (gifts,
# repair, p.49 "They utilize all rules for Adeptus Mechanicus vessels").
# There is no Archmagos on the Bakka list, so p.49's ban is met by the structure.
import copy as _copy
def _shift_section_refs(Lz, at):
    """Inserting a section at `at`: every reference >= at grows by one.
    The keys are the same count_section_refs/_sec_names_walk use."""
    def walk(node):
        if isinstance(node, list):
            for x in node:
                walk(x)
            return
        if not isinstance(node, dict):
            return
        for k, v in list(node.items()):
            if k in _SEC_LIST_KEYS and isinstance(v, list) and v and all(isinstance(i, int) for i in v):
                node[k] = [i + 1 if i >= at else i for i in v]
            elif k in ("sec", "up_sec") and isinstance(v, int):
                if v >= at:
                    node[k] = v + 1
            elif isinstance(v, (list, dict)) and k != "sn" and not k.endswith("_sn"):
                walk(v)
    for s in Lz["secs"]:
        walk(s.get("rules") or [])
_BK, _AM = _p18_list("Imperial Navy — Bakka Sector"), _p18_list("Adeptus Mechanicus — Explorator")
_bkbc = _BK["secs"][_p18_sec(_BK, "Battlecruisers")]
_amcr = _AM["secs"][_p18_sec(_AM, "Cruisers")]
assert len(_amcr["ents"]) == 7, [e["l"] for e in _amcr["ents"]]
for _e in _amcr["ents"]:
    _n = _copy.deepcopy(_e)
    _n["l"] = _e["l"] + " (Adeptus Mechanicus)"
    _n["mech"] = 1
    _n["src_page"] = 49
    _n["nt"] = "Adeptus Mechanicus cruiser taken as a battlecruiser (Fleets p. 49)."
    _bkbc["ents"].append(_n)
# p.483: the Demiurg Bastion as a mercenary. The section before PLANETARY DEFENCES
# (PD is always last, test_domain), and this list's section references
# are moved with the same key set the section guard checks
# (_SEC_LIST_KEYS, sec, up_sec). Not for Orks, Tyranids or Necrons; not
# for lists that already have the Bastion (RT, Exploration, Tau, War Host); nor
# for Crusade and Grey Knights, which take no ships from other lists
# (p.99, p.146) - open interpretation T54.
_MERC_S1 = ("Any fleet except Orks, Tyranids and Necrons can use Demiurg Bastion class vessels; they are purchased "
            "as cruisers but do not contribute to the number of ships required to gain access to battleships, "
            "grand cruisers, etc.")
_MERC_S2 = ("Demiurg ships can never carry fleet commanders, use fleet commander re-rolls or be placed in squadrons "
            "with non-Demiurg vessels.")
assert _text_key(_MERC_S1) in _all_text and _text_key(_MERC_S2) in _all_text
_WH = _p18_list("Demiurg — War Host")
_bast = [e for s in _WH["secs"] for e in (s.get("ents") or []) if e["l"] == "Bastion Commerce Vessel"]
assert len(_bast) == 1
_nmerc = 0
for _L in lists_out:
    if re.match(r"^(Orks|Tyranids|Necrons|Demiurg)", _L["nm"]) or _L.get("res_ban"):
        continue
    if any(e["l"] == "Bastion Commerce Vessel" for s in _L["secs"] for e in (s.get("ents") or [])):
        continue
    _b = _copy.deepcopy(_bast[0])
    _b["src_page"] = 483
    _pd = [i for i, s in enumerate(_L["secs"]) if s.get("ct") == "defence"]
    assert _pd == [len(_L["secs"]) - 1], (_L["nm"], _pd)
    _shift_section_refs(_L, _pd[0])
    _L["secs"].insert(_pd[0], dict(t="DEMIURG MERCENARIES", text=[_MERC_S1, _MERC_S2], ents=[_b], rules=[], ct="access",
                                   noroute=1))
    _L["merc"] = dict(sec="^DEMIURG MERCENARIES$", cite=_cite(_MERC_S1, 483))
    _nmerc += 1
assert _nmerc == 19, "J217: mercenary sections %d" % _nmerc
# p.319: the Void Stalker in an Iyanden fleet with conditions.
_IY = _p18_list("Eldar — Iyanden Craftworld")
_VS_S = ("Up to one Void Stalker may be taken in the fleet as long as the fleet is at least 1000 points and at "
         "least three Corsair Eldar cruisers and / or light cruisers are already present in the fleet.")
assert _text_key(_VS_S) in _all_text
_IY["borrow_cond"] = [dict(re="^void stalker", max=1, min_worth=1000, label="Void Stalker in an Iyanden fleet",
                           need=dict(n=3, list_re="^Eldar Corsairs", type_re="cruiser", what="Corsair cruisers"),
                           cite=_cite(_VS_S, 319))]
print("J217: Bakka's AdMech cruisers 7, mercenary sections %d, the Void Stalker condition" % _nmerc)

# J218 (check yourself phase 6B): hull choices and RT escorts.
# p.174 ROGUE TRADER "CRUISERS": "Any cruiser hull allowed in the Rogue Trader,
# Exploration or Wolf Pack fleet list may be used and counts fully as a Rogue
# Trader cruiser." and CAPITAL SHIPS: "If a second Rogue Trader cruiser is taken,
# it may be any Rogue Trader cruiser variant listed on the Exploration Fleet
# List." The hulls into the RT list's CAPITAL SHIPS section as rows "Rogue Trader cruiser -
# X class hull": Exploration's variants at its prices (p.176), the Wolf Pack's other
# cruisers at its prices (p.178). Light cruisers are not a "cruiser
# hull": Exploration counts them separately ("Rogue Trader cruisers & Endeavours").
_RT0 = _p18_list("Rogue Traders")
_rtcap = _RT0["secs"][_p18_sec(_RT0, "CAPITAL SHIPS")]
_EXL, _WPL = _p18_list("Rogue Traders — Exploration"), _p18_list("Rogue Traders — Pirates and Wolf Packs")
_seen = set(["180"])
_rth = 0
for _src in (_EXL, _WPL):
    for _e in _src["secs"][_p18_sec(_src, "CAPITAL SHIPS")]["ents"]:
        _sh = ships.get(str(_e.get("r")))
        if _e.get("k") != "unit" or not _sh or str(_e["r"]) in _seen:
            continue
        if not re.match(r"^cruiser", str(_sh.get("ty", "")), re.I) or re.search(r"light cruiser", _e["l"], re.I):
            continue
        _seen.add(str(_e["r"]))
        _n = _copy.deepcopy(_e)
        _cls = re.sub(r"\s+cruiser$", "", _e["l"], flags=re.I) if re.search(r"class cruiser$", _e["l"], re.I) else _e["l"]
        _n["l"] = "Rogue Trader cruiser \u2014 " + _cls + " hull"
        _n["src_page"] = 174
        _n["nt"] = ("Counts fully as a Rogue Trader cruiser (Fleets p. 174); %s list price."
                    % ("Exploration" if _src is _EXL else "Wolf Pack"))
        _rtcap["ents"].append(_n)
        _rth += 1
assert _rth == 8, "J218: RT hulls %d" % _rth
_RT_S1 = "If a second Rogue Trader cruiser is taken, it may be any Rogue Trader cruiser variant listed on the Exploration Fleet List."
_RT_S2 = ("Any cruiser hull allowed in the Rogue Trader, Exploration or Wolf Pack fleet list may be used and counts "
          "fully as a Rogue Trader cruiser.")
assert _text_key(_RT_S1) in _all_text and _text_key(_RT_S2) in _all_text
_RT0["rt_hulls"] = dict(hull="^rogue trader cruiser \u2014 ", all="^rogue trader cruiser", cite=_cite(_RT_S1, 174),
                        cite2=_cite(_RT_S2, 174),
                        interp="Open interpretation T55: \"any cruiser hull ... counts fully as a Rogue Trader cruiser\" "
                               "allows every cruiser, but \"if a second Rogue Trader cruiser is taken\" reads as the "
                               "first being the Rogue Trader profile; the app warns and does not count it against the fleet.")
# p.138 Accompanying a fleet: "This may include the specific ship so-called in
# the Inquisition rules, but it can be any Imperial cruiser-class vessel."
# T56: read as a placement (J215), not as a hull choice. The inquisitor's
# cruiser is the Imperial cruiser he is aboard: without an Inquisitorial
# Cruiser and a Blackship the Inquisitor Lord's place is free (p.138), so
# the player puts him aboard any cruiser from the Aboard menu.
# A hull choice (hc) was tried and rejected: it swaps the card's options to
# the hull choice card's pattern and drops the Inquisitorial cruiser's own options.
_ninq = 0
# p.139 RESERVES AND ALLIES (an IN/AdMech fleet led by an Inquisitor): "If taken, a
# Rogue Trader escort squadron may accompany it, but Xenos vessels may not be
# used." and p.50 Bakka: "One Rogue Trader cruiser and its attendant escorts may
# be taken for every 750 points in the fleet." The RT list's non-Xenos escorts into the
# ROGUE TRADERS section; Bakka without an inquisitor, the others with one.
_RTE = [e for e in _RT0["secs"][_p18_sec(_RT0, "ESCORTS")]["ents"] if not re.match(r"^xenos vessel", e["l"], re.I)]
assert [e["l"] for e in _RTE] == ["Recommissioned Escort", "Iconoclast Destroyer", "Armed Cargo Vessel"], [e["l"] for e in _RTE]
_INQ_S = "If taken, a Rogue Trader escort squadron may accompany it, but Xenos vessels may not be used."
_BK_S = "One Rogue Trader cruiser and its attendant escorts may be taken for every 750 points in the fleet."
assert _text_key(_INQ_S) in _all_text and _text_key(_BK_S) in _all_text
_nrte = 0
for _nm in ("Imperial Navy — Gothic Sector", "Imperial Navy — Bastion Fleets", "Imperial Navy — Armageddon Sector",
            "Imperial Navy — Bakka Sector", "Adeptus Mechanicus — Explorator", "The Emperor's Inquisition"):
    _L = _p18_list(_nm)
    _sec = _L["secs"][_p18_sec(_L, "ROGUE TRADERS")]
    for _e in _RTE:
        _n = _copy.deepcopy(_e)
        _n["src_page"] = 50 if "Bakka" in _nm else 139
        _sec["ents"].append(_n)
    # The section's own rules counted the whole section: "one Rogue Trader cruiser for
    # every 750 points" concerns the cruiser, not its escorts (regression J218).
    _rp = 0
    for _r in _sec.get("rules") or []:
        for _pk in _r.get("pick") or []:
            if _pk.get("re") is None and _pk.get("sec") == _p18_sec(_L, "ROGUE TRADERS"):
                _pk["re"] = "^rogue trader cruiser"
                _rp += 1
    assert _rp >= 1, ("J218: the RT section's rule was not narrowed", _nm)
    _bk = "Bakka" in _nm
    _L["rt_esc"] = dict(sec="^ROGUE TRADERS$", esc="^(recommissioned escort|iconoclast destroyer|armed cargo vessel)$",
                        cru="^rogue trader cruiser", needs=None if _bk else "^inquisitor lord",
                        cite=_cite(_BK_S, 50) if _bk else _cite(_INQ_S, 139))
    _nrte += 1
print("J218: RT hulls %d, RT escorts on %d lists" % (_rth, _nrte))

# J219 (check yourself phase 6C): Exploration p.177. The auxiliary ships are
# borrowed escorts (ally/reserve), the allied capital ships from the same
# list (one_donor, J213).
_EX = _p18_list("Rogue Traders — Exploration")
_AUX1 = "Besides Xenos vessels, auxiliary vessels from only one race can be taken in a fleet."
_AUX2 = "Any race can be used to provide auxiliary vessels except Orks, Dark Eldar, Necrons and Tyranids."
_AUX3 = "Xenos vessels cannot be employed if Space Marine escorts are used as auxiliary vessels."
_ABB = ("If the fleet is large enough that three reserve or allied capital ships are taken, a single (0-1) allied "
        "battleship may also accompany the fleet for its regular point cost without counting against cruiser limits.")
for _x in (_AUX1, _AUX2, _AUX3, _ABB):
    assert _text_key(_x) in _all_text, _x
_EX["aux"] = dict(never=["orks", "dark eldar", "necrons", "tyranids"], cite_one=_cite(_AUX1, 177),
                  cite_never=_cite(_AUX2, 177))
_EX["ally_bb"] = dict(cite=_cite(_ABB, 177))
# p.177's own sentence beside the allies matrix: the same ban, on the book's page.
assert _EX.get("ally_xenos") and _EX["ally_xenos"]["when"] == "space marines"
_EX["ally_xenos"]["src"] = _AUX3 + " (Fleets p. 177) " + _EX["ally_xenos"]["src"]
print("J219: Exploration's auxiliary ships and the allied battleship")

# J220 (check yourself phase 6D). p.369 CLAN UPGRADES: "A Blood Axe tiddla
# skwadron of at least six escorts may include up to three Imperial Navy and/or
# Chaos escorts from any fleet list at their listed cost." The commandeered
# escorts into their own section (the IN and Chaos lists' ESCORTS, each hull once,
# Armageddon's starred Space Marine rows out, p.41), before PD.
# A squadron (sq) attaches them to a Blood Axe tiddla.
_BA_S = ("A Blood Axe tiddla skwadron of at least six escorts may include up to three Imperial Navy and/or Chaos "
         "escorts from any fleet list at their listed cost.")
assert _text_key(_BA_S) in _all_text
_ba_ents, _ba_seen = [], set()
for _L in lists_out:
    if not re.match(r"^(Imperial Navy|Chaos) —", _L["nm"]):
        continue
    for _s in _L["secs"]:
        if _s["t"].strip().upper() != "ESCORTS" or _s.get("ct") != "type":
            continue
        for _e in _s["ents"]:
            if _e.get("k") != "unit" or "*" in _e["l"] or str(_e.get("r")) in _ba_seen:
                continue
            _ba_seen.add(str(_e.get("r")))
            _n = _copy.deepcopy(_e)
            _n["l"] = _e["l"][:1].upper() + _e["l"][1:].lower().replace("class", "class")
            _n["src_page"] = 369
            _ba_ents.append(_n)
assert len(_ba_ents) == 9, [e["l"] for e in _ba_ents]
_pd = [i for i, s in enumerate(_CZL["secs"]) if s.get("ct") == "defence"]
assert _pd == [len(_CZL["secs"]) - 1], _pd
_shift_section_refs(_CZL, _pd[0])
_CZL["secs"].insert(_pd[0], dict(t="BLOOD AXE COMMANDEERED ESCORTS", text=[_BA_S], ents=_ba_ents, rules=[],
                                 ct="access", noroute=1))
_CZL["bloodaxe"] = dict(sec="^BLOOD AXE COMMANDEERED ESCORTS$", clan="^clan: blood axes", min=6, max=3,
                        cite=_cite(_BA_S, 369))
# p.454/456: "Any ship equipped with Wardens can only be equipped with Wardens
# and may not have other hook-transported escorts." At fleet level: the Wardens
# and Orcas must be divisible over different ships by their hooks (sh.hk).
_WD_S = ("Any ship equipped with Wardens can only be equipped with Wardens and may not have other hook-transported "
         "escorts.")
assert _text_key(_WD_S) in _all_text
for _nm in ("Tau — Merchant Fleet", "Tau — Commerce Protection"):
    _p18_list(_nm)["warden_only"] = dict(cite=_cite(_WD_S, 454))
print("J220: Blood Axe commandeered escorts %d, Warden split on 2 lists" % len(_ba_ents))

# J221 p.177: "Reserves and Allied vessels do not have access to the Veteran
# Rogue Trader re-rolls, but allied vessels may purchase up to one special
# character from its own fleet list (if available)." A special character = the list's
# named commander; an ordinary Admiral, Pirate Prince or Eldar Hero is not.
_SC_S = ("Reserves and Allied vessels do not have access to the Veteran Rogue Trader re-rolls, but allied vessels may "
         "purchase up to one special character from its own fleet list (if available).")
assert _text_key(_SC_S) in _all_text
_SC_RE = r"^(lord admiral rath|abaddon|prince yriel|iyanden bearer of the flame|kor.o.mesme)"
_sc_hits = sorted(set(e["l"] for _L in lists_out for _s in _L["secs"] for e in (_s.get("ents") or [])
                      if e.get("k") == "cmd" and re.search(_SC_RE, e["l"], re.I)))
assert len(_sc_hits) == 5, _sc_hits
_EX["ally_cmd"] = dict(re=_SC_RE, max=1, cite=_cite(_SC_S, 177))
print("J221: Exploration ally special characters: %s" % ", ".join(_sc_hits))

# The final guard: every section reference points to the section whose name it
# carries. Rules created after this (module-level additions) are stamped
# now - their indexes were written only after all the moves.
check_section_names(lists_out, "at the end")
_refs = [0, 0]
for _L in lists_out:
    for _s in _L["secs"]:
        count_section_refs(_s.get("rules") or [], _refs)
assert _refs[0] == _refs[1], ("unnamed section references: %d / %d"
                              % (_refs[0] - _refs[1], _refs[0]))
print("section references %d, all named; checked after the moves %d"
      % (_refs[0], _SEC_COUNT[1]))

refd = {str(e["r"]) for Lx in lists_out for s in Lx["secs"] for e in s["ents"] if e["r"]}
missing = sorted(r for r in refd if r not in ships)

# schemaVersion: the version of the public interface (data/README.md). The
# major number changes when a stable field is removed or renamed; the minor
# number when one is added. data/schema.json describes it.
SCHEMA_VERSION = "1.0"
data = dict(schemaVersion=SCHEMA_VERSION,
            src="Battlefleet Gothic: Remastered — Fleets Book WiP v0.36 (28 Aug 2025) "
                "and Rulebook v1.10 (7 May 2024)",
            ships=ships, lists=lists_out)
# The rule's reach depends on what `re` hits. If a row's name changes
# in the book or in extraction, the ban stops working silently - so the hits
# are counted: they are only on the Rogue Traders lists and there are three per list
# plus a general row.
import re as _rex
_xre = _rex.compile(ALLY_XENOS["re"], _rex.I)
_xhit, _xbad = {}, []
for _L in lists_out:
    for _sec in _L["secs"]:
        for _e in _sec["ents"]:
            if _e.get("k") != "unit": continue
            if not _xre.search(str(_e.get("l", ""))): continue
            _xhit[_L["nm"]] = _xhit.get(_L["nm"], 0) + 1
            # The row is either the Rogue Traders' own or some list's named
            # access to them (Tau Commerce Protection and Demiurg print the same
            # four-row block in their own section). Elsewhere it must not be:
            # then `re` would hit something other than what the sentence
            # means.
            if "Rogue Traders" not in _L["nm"] and _sec.get("ct") != "access":
                _xbad.append("%s / %s / %s" % (_L["nm"], _sec["t"], _e["l"]))
assert _xhit, "ALLY_XENOS.re hits no row"
assert not _xbad, "a Xenos row in the wrong place: %s" % _xbad
assert sorted(_xhit.values()) == [4] * 5, "the number of Xenos rows changed: %r" % _xhit

# ---------------------------------------------- the book's chapters and the "own" hull
# A host list's own page may offer another fleet's ships (the Chaos lists'
# RENEGADE IMPERIAL VESSELS p.222, Bastion's Chaos hulls p.39). The picker
# shows such a source list yellow, and for that it must know
# which of the source list's hulls are ITS OWN. A hull reference alone is not enough: the Space
# Marine lists print Imperial Navy profiles as rapid strike vessels,
# which are Space Marine ships ("you can't just take your Imperial Navy
# escorts and say that they are rapid strike vessels!", p.106), and the Demiurg
# print the Rogue Trader Cruiser among their own cruisers (p.487).
# By reference these looked like routes: 23 wrong out of 68.
#
# Own = the profile is printed in the source list's OWN chapter. The first version
# included the same race's chapters, and then the Imperial Navy chapter's hulls were
# own to the Adeptus Mechanicus (p.14 "Imperial Navy (including Adeptus
# Mechanicus)"). The review 16.9. showed it wrong: p.14's race split
# concerns reserves, and the renegades "do not count as reserves" (p.222), whereas
# p.222 says "from any Imperial Navy fleet list" and the Mechanicus is a list of its own
# (p.124 "ADEPTUS MECHANICUS FLEET LIST", p.125 "replaces the original cost for
# these vessels when used as Adeptus Mechanicus ships"). The player loses
# nothing: every row of the Explorator route is available through the Imperial Navy
# lists.
#
# Chapters: the starts of the lists' own rules windows and also the book's two
# list-less chapters from the table of contents (PDF p.9): PLANETARY DEFENCES 496 and
# ADDITIONAL VESSELS 518. Without them the profiles of pages 500-524 (Ramilies,
# orbitals, Q-ship ...) would be "own" to the Demiurg chapter.
_CHAP_RE = re.compile(r"FLEET RULES \(pg\.?\s*(\d+)")
_chap_of_list = {}
for _L in lists_out:
    _m = _CHAP_RE.search(str(_L["secs"][0].get("t", "")))
    assert _m, "the chapter start is not found: %s (%r)" % (_L["nm"], _L["secs"][0].get("t"))
    _chap_of_list[_L["nm"]] = int(_m.group(1))
_LISTLESS = (496, 518)
_STARTS = sorted(set(_chap_of_list.values()) | set(_LISTLESS))
def _chapter_of(pg):
    if pg is None:
        return None
    _c = [x for x in _STARTS if x <= int(pg)]
    return _c[-1] if _c else None
for _k, _sh in ships.items():
    _sh["chap"] = _chapter_of(_sh.get("pg"))
_NATIVE = 0
for _L in lists_out:
    _L["native_chaps"] = [_chap_of_list[_L["nm"]]]
    _NATIVE += 1
assert _NATIVE == len(lists_out) == 32, _NATIVE
# A profile of a list-less chapter is nobody's own, and a profile printed after page 482
# must not stay in the Demiurg chapter.
assert not [_L["nm"] for _L in lists_out
            if set(_L["native_chaps"]) & set(_LISTLESS)], "a list-less chapter as own"
_late = [_sh["nm"] for _sh in ships.values()
         if _sh.get("pg") and int(_sh["pg"]) >= 496 and _sh.get("chap") not in _LISTLESS]
assert not _late, "a chapter wrong after page 496: %r" % _late[:5]
print("chapter starts: %d (of which list-less %d), lists with a chapter of their own: %d"
      % (len(_STARTS), len(_LISTLESS), _NATIVE))

# ---------------------------------------------- a Mark that comes built in
# When the Mark is fixed on the ship - the god's own battle barge (p.258, 260, 262,
# 264) or a Daemonship on the Nurgle, Khorne and Slaanesh lists ("already
# included in the cost to upgrade them to Daemonships") - the player did not see
# it among the ship's upgrades at all, only in the card's text. Now it
# has a locked 0 point row, by the same mechanism as the Mechanicus's
# required refits: `req` locks and `incl` tells the user interface that
# it is "included" and not "required by the fleet list".
#
# The name starts "Mark of", NOT "The Mark of", on purpose. Three things read
# the "^the mark of" start: the card's Mark rule (which would add to the Terminus Est
# a second row "+1 Damage Point" although the hit is already in the profile), the group of buyable
# Marks, and J139's mark_paid. The info row must change none of them.
# The row also has no `mod` field: a crew's Mark of Nurgle gives
# hp +1, and it would double the barge's hit.
#
# The Tzeentch Daemonship gets no row, because its list does not say the Mark is
# included - there the Mark is bought separately.
def _bears(ship_re, god):
    for _sh in ships.values():
        if re.match(ship_re, _sh.get("nm", ""), re.I):
            for _b in (_sh.get("sr") or "").split("•"):
                _b = _b.strip()
                _m = re.search(r"This ship bears the Mark of %s as part of its point cost;"
                               r" it does not have to be paid for separately by the ship.s"
                               r" commander\." % god, _b)
                if _m:
                    return _m.group(0), _sh["pg"]
    return None, None
# J165: a sentence's page from the list's glued rule text (lists.py page_map).
def _sent_page(L, sent):
    _li = lists_out.index(L)
    _blob, _pm = upgrades._joined(raw_rules[_li], raw_pages[_li])
    _i = _blob.find(sent[:60])
    assert _i >= 0, "%s: the sentence is not found in the rule text: %s" % (L["nm"], sent[:60])
    return upgrades._page_at(_pm, _i)
def _daemon_incl(L, god):
    for _sec in L["secs"]:
        if "DAEMON" not in _sec["t"].upper():
            continue
        for _t in _sec.get("text") or []:
            _m = re.search(r"All Daemonships in a [^.]*? must take the Mark of %s, which is"
                           r" already included in the cost to upgrade them to"
                           r" Daemonships\." % god, _t)
            if _m:
                return _sec, _m.group(0)
    return None, None
def _incl_row(god, cond, desc, page):
    return {"l": "Mark of %s" % god, "r": None, "p": 0, "a": 1, "u": 1, "mx": None,
            "nt": None, "prose": 1, "cond": cond, "k": "up", "req": 1, "incl": 1,
            "desc": desc, "src_page": page}
_BARGE = {"Nurgle": "TERMINUS EST", "Tzeentch": "SCION OF PROSPERO",
          "Khorne": "SLAVERER", "Slaanesh": "WAGE OF SIN"}
_INCL = 0
for _god, _barge in _BARGE.items():
    _L = [x for x in lists_out if x["nm"] == "Chaos — " + _god]
    assert len(_L) == 1, _god
    _L = _L[0]
    _fc = [x for x in _L["secs"] if "FORCES OF CHAOS" in x["t"].upper()]
    assert len(_fc) == 1, "%s: FORCES OF CHAOS sections %d" % (_god, len(_fc))
    _sent, _bpg = _bears("^" + _barge, _god)
    assert _sent, "%s: the barge's Mark sentence is not found in the profile" % _god
    # At the end, not in between: the section's old rows keep their indexes, so
    # the saves' upgrade keys do not move.
    _fc[0]["ents"].append(_incl_row(_god, {"nm": "^" + _barge.lower()}, _sent, _bpg))
    _INCL += 1
    _dsec, _dsent = _daemon_incl(_L, _god)
    if _god == "Tzeentch":
        assert _dsent is None, "Tzeentch: a Daemonship sentence appeared - check the book"
        continue
    assert _dsent, "%s: the Daemonship's Mark sentence is not found" % _god
    _dsec["ents"].append(_incl_row(_god, {"cap": 1, "up": "^daemonship:"}, _dsent, _sent_page(_L, _dsent)))
    _INCL += 1
assert _INCL == 7, "Mark info rows %d, 7 expected" % _INCL
print("info rows of a built-in Mark: %d" % _INCL)

# The god's own battle barge carries the Mark in its price already, so the Warmaster's
# Mark row must not charge for it a second time. The book's sentence is the same
# in four places, and for Nurgle it adds what also shows in
# the profile (hp 13 vs. an ordinary battle barge's 12).
#
# When is the Warmaster aboard the barge? The book says so in the ship's own
# rule, and it need not be inferred:
#   Terminus Est / Scion of Prospero / Wage of Sin: "must be used as the
#   fleet's flagship and have its Warmaster placed aboard it UNLESS the
#   Planet Killer is also present, in which case a Chaos Lord must lead it."
#   The Slaverer is the exception: "it does not have to be used as the fleet's
#   flagship UNLESS IT IS THE MOST EXPENSIVE VESSEL PRESENT", and "if it is
#   not the flagship, a Chaos Lord must lead it."
import re as _re
_PK = "^planet killer"
MARK_PAID = {
    "Chaos — Nurgle": dict(
        god="Nurgle", ship="^terminus est$", unless=_PK, pg=262,
        src_ship="Mark of Nurgle: This ship bears the Mark of Nurgle as part "
            "of its point cost; it does not have to be paid for separately by "
            "the ship's commander. The extra hit is already included in its "
            "profile.",
        src_flag="If chosen, the Terminus Est must be used as the fleet's "
            "flagship and have its Warmaster placed aboard it unless the "
            "Planet Killer is also present, in which case a Chaos Lord must "
            "lead it."),
    "Chaos — Tzeentch": dict(
        god="Tzeentch", ship="^scion of prospero$", unless=_PK, pg=258,
        src_ship="Mark of Tzeentch: This ship bears the Mark of Tzeentch as "
            "part of its point cost; it does not have to be paid for "
            "separately by the ship's commander.",
        src_flag="If chosen, the Scion of Prospero must be used as the "
            "fleet's flagship and have its Warmaster placed aboard it unless "
            "the Planet Killer is also present, in which case a Chaos Lord "
            "must lead it."),
    "Chaos — Slaanesh": dict(
        god="Slaanesh", ship="^wage of sin$", unless=_PK, pg=260,
        src_ship="Mark of Slaanesh: This ship bears the Mark of Slaanesh as "
            "part of its point cost; it does not have to be paid for "
            "separately by the ship's commander.",
        src_flag="If chosen, the Wage Of Sin must be used as the fleet's "
            "flagship and have its Warmaster placed aboard it unless the "
            "Planet Killer is also present, in which case a Chaos Lord must "
            "lead it."),
    "Chaos — Khorne": dict(
        god="Khorne", ship="^slaverer$", dearest=1, pg=264,
        src_ship="Mark of Khorne: This ship bears the Mark of Khorne as part "
            "of its point cost; it does not have to be paid for separately by "
            "the ship's commander. If it is not the flagship, a Chaos Lord "
            "must lead it.",
        src_flag="If chosen, it does not have to be used as the fleet's "
            "flagship unless it is the most expensive vessel present."),
}
_MP = 0
for _L in lists_out:
    _mp = MARK_PAID.get(_L["nm"])
    if not _mp:
        continue
    # The rows must exist, or the rule would guard nothing.
    # Exactly one ship row: the Slaanesh list also has the upgrade row "Wage of
    # Sin: Chosen Terminators (crew included)", so an unanchored expression
    # would hit two rows. The rule protects itself with the unitRow condition, but
    # the expression is still kept precise and the count recorded.
    _ships = [_e["l"] for _sec in _L["secs"] for _e in _sec["ents"]
              if _e.get("k") == "unit"
              and _re.search(_mp["ship"], str(_e.get("l", "")), _re.I)]
    assert len(_ships) == 1, "MARK_PAID: %s hits %d ships: %r" % (
        _mp["ship"], len(_ships), _ships)
    _has_ship = True
    _has_mark = any(_e.get("dflt") and str(_e.get("l", "")).lower()
                    .startswith("the mark of")
                    for _sec in _L["secs"] for _e in _sec["ents"])
    assert _has_ship, "MARK_PAID: no ship on list %s" % _L["nm"]
    assert _has_mark, "MARK_PAID: no default-chosen Mark row %s" % _L["nm"]
    _L["mark_paid"] = dict(_mp)
    _MP += 1
assert _MP == 4, "MARK_PAID: 4 lists expected, got %d" % _MP
# Only the Mechanicus's two 0 point refits remain required upgrades.
_REQ = [(_L["nm"], _e["l"]) for _L in lists_out for _sec in _L["secs"]
        for _e in _sec["ents"] if _e.get("k") == "up" and _e.get("req")
        and not _e.get("incl")]
assert len(_REQ) == 2, "required upgrades %d: %r" % (len(_REQ), _REQ)

# A control character in a data string. check_control.py reads the files' bytes,
# but JSON writes a backspace (U+0008) as two ASCII characters, so
# the byte check does not see it. This happened on 16.9.: a Python string's escape
# turned into a backspace in a condition's regular expression, and the Mark
# info row hit no barge. The fifth time in the same trap.
def _ctrl_walk(v, path, out):
    if isinstance(v, str):
        if any(ord(ch) < 32 and ch not in (chr(10), chr(9), chr(13)) for ch in v):
            out.append(path)
    elif isinstance(v, dict):
        for _k, _x in v.items():
            _ctrl_walk(_x, path + "." + str(_k), out)
    elif isinstance(v, list):
        for _n, _x in enumerate(v):
            _ctrl_walk(_x, path + "[%d]" % _n, out)
_CTRL = []
_ctrl_walk(data, "data", _CTRL)
assert not _CTRL, "a control character in a data string: %s" % _CTRL[:5]

# The PDF's line break splits the word "re-roll" at the hyphen, and the extracted
# text says "re- roll" (p.147, 151, 258, 373, 404, 486). The card and the
# choice list print the data as it is, so the word is fixed here
# in every string at once - the rule's sentence and its sec.text pair
# stay the same byte for byte this way (user 5.10.2026: re-rolls clearly).
_REROLL_HYPH = [0]
def _fix_reroll(v):
    if isinstance(v, str):
        _n = v.count("re- roll") + v.count("Re- roll")
        if _n:
            _REROLL_HYPH[0] += _n
            return v.replace("re- roll", "re-roll").replace("Re- roll", "Re-roll")
        return v
    if isinstance(v, dict):
        for _k in list(v):
            v[_k] = _fix_reroll(v[_k])
        return v
    if isinstance(v, list):
        for _n2 in range(len(v)):
            v[_n2] = _fix_reroll(v[_n2])
        return v
    return v
_fix_reroll(data)
assert _REROLL_HYPH[0] >= 1, "the 're- roll' fix never hit: has the extractor changed?"
print("'re- roll' -> 're-roll': %d places" % _REROLL_HYPH[0])

# --- Groups of a section's sentences (docs/check-yourself, J212, 20.10.2026) -
# Before, every sentence of a section that was not word for word the src of a rule of the same
# section was shown in the "Check yourself" group: 2 497 occurrences, of which
# read by hand only 15 were for the player to check. Now every sentence gets
# a group (sec.cls) from the hand classification of reference/check_yourself.json:
#   checked  the builder enforces it or the structure prevents breaking it
#   open     a book rule the builder does not enforce (Not checked by the builder)
#   info     fleet information (attack rating, the opponent's extras)
#   models   models and painting
#   play     an in-game rule            campaign  campaign and scenario
#   row      a row's description        drop      narrative: not in the catalogue
# The src of the same section's rule is always "checked" (the old condition). A sentence
# the classification does not know is "open" - the player sees it unchecked - and
# check_reference.py reports it. The cards do not read cls: they pick their
# sentences as before (sec.own), so the cards' content does not change.
def _cy_key(t):
    t = (t or "").replace("’", "'").replace("‘", "'")
    return re.sub(r"[^a-z0-9']+", " ", t.lower()).strip()
_CY = json.load(io.open(os.path.join(_HERE, "..", "reference", "check_yourself.json"), encoding="utf-8"))
_cy_map = dict((_cy_key(_e["text"]), _e) for _e in _CY["sentences"])
_cy_hit, _cy_unknown, _cy_n = set(), [], {}
for _L in lists_out:
    for _s in _L["secs"]:
        _srcs = [_r.get("src") for _r in (_s.get("rules") or [])]
        _cls, _pg = [], []
        for _t in (_s.get("text") or []):
            _e = _cy_map.get(_cy_key(_t))
            if _e:
                _cy_hit.add(_e["id"])
            if _t in _srcs:
                _g = "checked"
            elif _e is None:
                _g = "open"
                _cy_unknown.append((_L["nm"], _s["t"], _t[:70]))
            elif _L["nm"] in (_e.get("drop_in") or []):
                _g = "drop"
            else:
                _g = (_e.get("g_by_list") or {}).get(_L["nm"], _e["g"])
            _cls.append(_g)
            _pg.append(_e.get("p") if _e else None)
            _cy_n[_g] = _cy_n.get(_g, 0) + 1
        _s["cls"] = _cls
        _s["cpg"] = _pg
assert len(_cy_hit) >= 1000, "check_yourself.json hits only %d sentences: has the extraction changed?" % len(_cy_hit)
print("groups of section sentences: %s, unclassified %d, classification unused %d"
      % (_cy_n, len(_cy_unknown), len(_CY["sentences"]) - len(_cy_hit)))
for _u in _cy_unknown[:5]:
    print("  luokittelematon: %s / %s: %s" % _u)

io.open(_OUT, "w", encoding="utf-8", newline="\n").write(
    json.dumps(data, ensure_ascii=True, separators=(",", ":")))

print("ships %d, lists %d" % (len(ships), len(lists_out)))
print("rules:", {k: v for k, v in stat.items() if k != "text"},
      " enforceable in total", sum(v for k, v in stat.items() if k != "text"))
print("rule sentences to show:", stat["text"])
print("missing profile pages:", missing)
print("bfg_data.json %.0f kB" % (os.path.getsize(_OUT) / 1024))

# --- proof that the guard turns red ----------------------------------------
# A guard that cannot fail the build is no guard. In this mode
# one section is pushed in front of every list - exactly the silent shift
# the names were written against - and every list is required to
# fail. The data is already written to disk, so the change lives only in memory.
if "--prove-guard" in sys.argv:
    survived = []
    for _L in lists_out:
        _moved = [dict(t="INSERTED SECTION", ents=[], rules=[])] + _L["secs"]
        try:
            stamp_section_names(_moved, "proof: " + _L["nm"], stamp_new=False)
        except AssertionError:
            continue
        # A list none of whose rules has a section reference cannot
        # fail - it is recorded, not accepted silently.
        _refs = sum(1 for _sec in _L["secs"] for _r in (_sec.get("rules") or [])
                    for _k in _r if _k.endswith("_sn") or _k == "sn")
        survived.append((_L["nm"], _refs))
    _silent = [x for x in survived if x[1]]
    assert not _silent, ("a section shift did not fail the guard: %s" % _silent)
    print("GUARD: a section shift fails the build on %d/%d lists"
          % (len(lists_out) - len(survived), len(lists_out)))

    # The race and type tables: the same test. One row is removed at a time and
    # the guard is required to notice the gap.
    _lost = dict(lists_out[0]); _lost.pop("race")
    try:
        check_races([_lost])
        raise SystemExit("GUARD: a missing race did not fail the build")
    except AssertionError:
        pass
    _shl = dict(ships); _shl["_koe"] = dict(ships["53"]); _shl["_koe"].pop("rt")
    try:
        check_ship_types(_shl)
        raise SystemExit("GUARD: a missing ship type did not fail the build")
    except AssertionError:
        pass
    _shipsec = next(sec for sec in lists_out[0]["secs"]
                    if any(e.get("r") and e.get("k") != "up" for e in (sec.get("ents") or [])))
    _sk = {"nm": "koe", "secs": [dict(_shipsec)]}
    _sk["secs"][0].pop("ct", None)
    try:
        check_section_kinds([_sk])
        raise SystemExit("GUARD: a missing section kind did not fail the build")
    except AssertionError:
        pass
    print("GUARD: a missing race, ship type and section kind fail the build")
    if survived:
        print("  (without section references: %s)"
              % ", ".join(n for n, _ in survived))
