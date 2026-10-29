# -*- coding: utf-8 -*-
"""Stage 1 of the data pipeline (extractor/build_data.py): inputs.

The stages run in file order when the entry imports the last one; each
imports what it uses from the stages before it. One pipeline script
until 26.10.2026, split by stage for reading, not for reuse.
"""
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
_HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))   # extractor/
_OUT = os.path.join(_HERE, "..", "data", "bfg_data.json")

P = json.load(io.open(os.path.join(_HERE, "profiles_raw.json"), encoding="utf-8"))
L = json.load(io.open(os.path.join(_HERE, "lists_raw.json"), encoding="utf-8"))

# Ship ids are frozen (ship_ids.json): the v0.36 page of the profile. The raw
# files give the pages of the current book, so a list row's (pg. NN) is turned
# into the id of the profile on that page here, before anything links rows to
# ships. A reference to a page without a profile stays a page.
SHIP_ID = {int(k): v for k, v in json.load(io.open(os.path.join(_HERE, "ship_ids.json"),
                                                   encoding="utf-8"))["ids"].items()}
assert sorted(SHIP_ID) == sorted(p["page"] for p in P), "ship_ids.json does not cover the profiles"
for _l in L:
    for _s in _l["sections"]:
        for _e in _s.get("entries", []):
            if _e.get("ref") in SHIP_ID:
                _e["ref"] = int(SHIP_ID[_e["ref"]]) if SHIP_ID[_e["ref"]].isdigit() else SHIP_ID[_e["ref"]]

# Kor'O'Mesme: v0.36 printed his row in the Commerce Protection Commander
# section ("Kor’O’Mesme* (Ld 9)....110 pts", the star pointing to his
# dossier); v0.40 dropped the row and keeps only the dossier, p.453 "KOR'O
# VASH'YA Y'ELDI MESME: 110 PTS ... Kor'O'Mesme can be taken instead of a
# normal commander and has to be placed on a Custodian Class Battleship.
# Leadership: 9". The row goes back where it was, after the Kor'O, under its
# old name: saved fleets name their rows.
_cp = [_s for _l in L if _l["name"] == "Tau — Commerce Protection" for _s in _l["sections"] if _s["title"] == "Commander"]
assert len(_cp) == 1 and [_e["label"] for _e in _cp[0]["entries"]][:2] == ["Tau Kor'el (Ld 8)", "Tau Kor’O (Ld 9)"] \
    and not any("Mesme" in _e["label"] for _e in _cp[0]["entries"]), "Commerce Protection: the commander rows changed"
_cp[0]["entries"].insert(2, dict(label="Kor’O’Mesme* (Ld 9)", ref=None, pts=110, add=False, upgrade=True,
                                 raw="KOR'O VASH'YA Y'ELDI MESME: 110 PTS (p.453)", src_page=453))

# Typos of the book in a ship's faction field. The field prints as is in the
# card's subtitle, so the spelling is corrected.
SHIP_FL_FIX = {"INQUISTION": "INQUISITION"}
_FL_FIXED = [0]

FIXES = {
    # v0.36 had three misprinted rows here (Zukov's Klaw "2310 pts", the Grey
    # Knights Sword and Cobra page references, "Havoc Class Frigatevvvv");
    # v0.40 prints all of them correctly, so their fixes are gone.
    ("Eldar — Iyanden Craftworld", "Aspect Warrior Host"):
        dict(ref=None, upgrade=True,
             note="Fleet upgrade from pg. 307, not a ship profile."),
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
    # p.376: "May upgrade its turrets from two to three for +10 pts."
    (374, "upgrade its turrets from two to three"):
        dict(mod=dict(tu=1)),
    # --- Spot check 6 (a wide review) -------------------------------------
    # p.257 Chaos battle barge: "Can embark Chaos Space Marines for +35
    # points" and "may embark Chosen Terminators for +10 points" are the same
    # purchases as the god lists' rows "<Legion> Chaos Space Marine crew" and
    # "Chosen Terminators (battleship / grand cruiser)" (p.244-253). cov =
    # the pattern of the row name the option covers (domain.js optionCoversRow);
    # a crew bought with the option also opens the Mark (p.250 "A ship with a
    # World Eaters Chaos Space Marine crew may have a Mark of Khorne").
    (255, "Can embark Chaos Space Marines"):
        dict(cov=r"chaos space marine crew$"),
    (255, "may embark Chosen Terminators"):
        dict(cov=r"^chosen terminators"),
    # An option the book gives no price for is free, not "see text":
    # p.105 Strike cruiser "May replace its launch bays for Strength 6,
    # speed: 30 cm torpedo tubes", p.161 Grey Knights strike cruiser "May
    # replace launch bays for a Firepower 5 ... bombardment cannon battery"
    # (the Codex equivalent p.105 says "for no change in cost"); p.84 the Cobra's
    # radar refit's price is in its own entry below.
    (105, "Strength 6, speed: 30 cm torpedo tubes"):
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
    (151, "Firepower 5, range 30 cm (front arc only) bombardment cannon battery"):
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
    # p.271: "May have a third shield for +15 pts, when modelled on a
    # large 60 mm base."
    (269, "third shield"):
        dict(mod=dict(sh=1)),
    # --- Boarding torpedoes are NOT a weapon row (J190, user 12.10.2026) ----
    # The user: a boarding torpedo purchase goes only on the option row, not to the
    # weapons, because it buys only a new kind of ammunition for the existing
    # torpedoes. Rulebook p.78: "Boarding torpedoes are launched like
    # ordinary torpedoes". So the option (p.376, 379, 382, 384, 385, 391) adds no
    # row to the profile: the ammunition's speed and strength are in the option's own
    # text, and the Boarding Torpedoes rule row comes from the option's text.
    # Before, these had add=["Boarding torpedoes", "20 cm", ...] (P1-3);
    # the acknowledgements are in reference/options.json (effect null).
    # The hulk's option is the same purchase as the Clanz list's "Boarding torpedoes (Space
    # Hulk)" +15 (p.374) - cov covers the row (spot check 7 row 22).
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
    # p.271: "increases the range of its dorsal lances to 45 cm at an
    # additional cost of +10 pts"
    (269, "ancient targeting systems"):
        dict(swp=dict(f=r"dorsal lance", rg="45 cm")),
    # --- item 7, batch 3: prow armour 6+ (reference/options.json) -----------
    # p.72 (the same text p.73-76, 191): "May increase the prow armour to 6+
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
    # p.361: "Torpedo-bommas only move 20 cm ... an additional ordnance choice
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
    # p.281 Murder: "replace its Firepower 10 weapons batteries with Firepower
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
    # p.202 Armed Cargo Vessel: "converted to a fast clipper by entirely
    # removing its primary battery armament for the Advanced Drive Technology
    # refit" - p.185: "+5 cm to its speed as well as +1D6 when undergoing All
    # Ahead Full". 25 cm -> 30 cm, the battery off, "for no extra cost" -> 0.
    (192, "Fast Clipper"):
        dict(**{"del": r"weapons battery"}, set=dict(sp="30 cm"), c=0),
    # p.192 Heavy Transport: "Super-Heavy Transport (+50 pts): ... add +4HP to
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
