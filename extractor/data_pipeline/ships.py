# -*- coding: utf-8 -*-
"""Stage 2 of the data pipeline (extractor/build_data.py): ships.

The stages run in file order when the entry imports the last one; each
imports what it uses from the stages before it. One pipeline script
until 26.10.2026, split by stage for reading, not for reuse.
"""
import json, io, re, collections, os, sys
import upgrades
import swaps, copy
from .inputs import P, re
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
