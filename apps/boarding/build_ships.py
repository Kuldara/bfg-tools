# -*- coding: utf-8 -*-
"""Extracts the boarding resolver's ship base from the fleet builder's data.

    python build_ships.py

Reads (READ ONLY, the shared data):
    ../../data/bfg_data.json
Writes:
    src/ships.json

Of the ship base only what affects a boarding action is needed:
name, fleet, hull type, damage points, turrets (or spore cysts) and
the ship- or class-specific special rules that change boarding.

Special rule flags are not made by a regex at run time: they are
picked by hand in this file in the SHIP_FLAGS table, and every row's
source sentence is checked against the ship's own sr text. If the book changes
so that the sentence is no longer found, the run shouts - that is the whole idea of the check.
"""
import io
import json
import os
import re
import sys

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, "..", "..", "data", "bfg_data.json")
OUT = os.path.join(HERE, "src", "ships.json")

# --------------------------------------------------------------------------
# Fleets: the display name + the race modifier tag.
# The race modifier is a fleet-level matter; ship-level exceptions are
# in SHIP_FLAGS.
# --------------------------------------------------------------------------
FLEETS = [
    # key in data,          display,                   race tag
    ("IMPERIAL NAVY",        "Imperial Navy",           "imperial"),
    ("SPACE MARINES",        "Space Marines",           "spacemarines"),
    ("ADEPTUS MECHANICUS",   "Adeptus Mechanicus",      "admech"),
    ("INQUISITION",          "Inquisition",             "inquisition"),
    ("ROGUE TRADERS",        "Rogue Traders",           "roguetrader"),
    ("CHAOS",                "Chaos",                   "chaos"),
    ("ORKS",                 "Orks",                    "ork"),
    ("ELDAR",                "Eldar",                   "eldar"),
    ("DARK ELDAR",           "Dark Eldar",              "darkeldar"),
    ("NECRON",               "Necrons",                 "necron"),
    ("TYRANID",              "Tyranids",                "tyranid"),
    ("TAU KOR\u2019VATTRA",  "Tau Kor\u2019vattra",     "tau"),
    ("TAU KOR\u2019OR\u2019VESH", "Tau Kor\u2019or\u2019vesh", "tau_kororvesh"),
    ("TAU",                  "Tau defences",            "tau"),
    ("KROOT",                "Kroot",                   "kroot"),
    ("DEMIURG",              "Demiurg",                 "demiurg"),
    ("NICASSAR",             "Nicassar",                "nicassar"),
    ("HIGH ORBIT DEFENCES",  "Orbital defences",        "imperial"),
    ("LOW ORBIT DEFENCES",   "Planetary defences",      "imperial"),
    ("ADDITIONAL VESSELS",   "Civilian vessels",        "none"),
]


# --------------------------------------------------------------------------
# Fleet lists: who crews a hull.
#
# A book list may take a hull from another book's section. In boarding what decides is
# the CREW, not which book section the profile is printed in: the Explorator list
# takes Imperial Navy hulls but they are Mechanicus ships (FL p.121,
# p.125), and Chaos renegade hulls are Chaos ships (FL p.232).
#
# The LIST_CREW table's key is (list name, section heading) and its value:
#   "own"          = the list's own fleet crews it
#   "book"         = every ship stays in its own book's fleet (allies)
#   "<FLEET>"      = the named fleet crews it
# "ex" gives exceptions by initial letters (the list's own label), "fl" flags
# to add and "pg" the source page.
#
# If a list gets a section with another book's hull and no row in this
# table, the run stops - on the same principle as SHIP_FLAGS.
# --------------------------------------------------------------------------
LIST_FLEET = {
    "Imperial Navy \u2014 Gothic Sector": "IMPERIAL NAVY",
    "Imperial Navy \u2014 Bastion Fleets": "IMPERIAL NAVY",
    "Imperial Navy \u2014 Armageddon Sector": "IMPERIAL NAVY",
    "Imperial Navy \u2014 Bakka Sector": "IMPERIAL NAVY",
    "Space Marines \u2014 Codex Astartes": "SPACE MARINES",
    "Space Marines \u2014 Crusade": "SPACE MARINES",
    "Space Marines \u2014 Dominion": "SPACE MARINES",
    "Adeptus Mechanicus \u2014 Explorator": "ADEPTUS MECHANICUS",
    "The Emperor's Inquisition": "INQUISITION",
    "Grey Knights": "INQUISITION",
    "Rogue Traders": "ROGUE TRADERS",
    "Rogue Traders \u2014 Exploration": "ROGUE TRADERS",
    "Rogue Traders \u2014 Pirates and Wolf Packs": "ROGUE TRADERS",
    "Chaos \u2014 Incursion": "CHAOS",
    "Chaos \u2014 Black Crusade": "CHAOS",
    "Chaos \u2014 Tzeentch": "CHAOS",
    "Chaos \u2014 Nurgle": "CHAOS",
    "Chaos \u2014 Khorne": "CHAOS",
    "Chaos \u2014 Slaanesh": "CHAOS",
    "Eldar Corsairs \u2014 Gothic Sector": "ELDAR",
    "Eldar Corsairs \u2014 Later Gothic War": "ELDAR",
    "Eldar \u2014 Iyanden Craftworld": "ELDAR",
    "Dark Eldar \u2014 Pirates": "DARK ELDAR",
    "Orks \u2014 Cyclops Cluster": "ORKS",
    "Orks \u2014 Waaagh!": "ORKS",
    "Orks \u2014 Da Ork Clanz": "ORKS",
    "Necrons \u2014 Harvest Fleet": "NECRON",
    "Tyranids \u2014 Vanguard Fleet": "TYRANID",
    "Tyranids \u2014 Hive Fleet": "TYRANID",
    "Tau \u2014 Merchant Fleet": "TAU KOR\u2019VATTRA",
    "Tau \u2014 Commerce Protection": "TAU KOR\u2019OR\u2019VESH",
    "Demiurg \u2014 War Host": "DEMIURG",
}

# Ally sections that recur in almost every list.
_ALLY = {"crew": "book", "pg": 15, "generic": True,
         "why": "an allied contingent keeps its own crew (FL p.15)"}
# The stored hulls of Ordo Malleus and Segmentum Obscurus: Chaos profiles
# with Imperial crews (FL p.39: "crewed with sailors from destroyed or
# crippled vessels"; FL p.15: reserves are always of the same race; FL p.152).
_IMP_RESERVE = {"crew": "IMPERIAL NAVY", "pg": 39,
                "why": "a stored hull with an Imperial crew (FL p.39, p.152)"}

LIST_CREW = {}
# Every list now ends with the book's PLANETARY DEFENCES (FL p.499): the
# profiles stay in the defence fleets of their own chapter, as before the
# lists carried them. Demiurg Bastion vessels hired as mercenaries keep their
# Demiurg crew (FL p.483: "Demiurg ships can never carry fleet commanders ...").
_DEFENCES = {"crew": "book", "pg": 499, "generic": True,
             "why": "a planetary defence stays in its own defences fleet (FL p.499)"}
_DEMIURG_MERC = {"crew": "book", "pg": 483, "generic": True,
                 "why": "a hired Demiurg vessel keeps its Demiurg crew (FL p.483)"}
for _l in LIST_FLEET:
    LIST_CREW[(_l, "THE INQUISITION")] = _ALLY
    LIST_CREW[(_l, "ROGUE TRADERS")] = _ALLY
    LIST_CREW[(_l, "PLANETARY DEFENCES")] = _DEFENCES
    LIST_CREW[(_l, "DEMIURG MERCENARIES")] = _DEMIURG_MERC
# Da Ork Clanz: "A Blood Axe tiddla skwadron of at least six escorts may include
# up to three Imperial Navy and/or Chaos escorts" - crewed by the Blood Axes (FL p.371).
LIST_CREW[("Orks — Da Ork Clanz", "BLOOD AXE COMMANDEERED ESCORTS")] = {
    "crew": "own", "pg": 371,
    "why": "commandeered escorts crewed by Blood Axes (FL p.371)"}
for _l in ("Imperial Navy \u2014 Gothic Sector", "Imperial Navy \u2014 Armageddon Sector",
           "Imperial Navy \u2014 Bakka Sector", "Adeptus Mechanicus \u2014 Explorator"):
    LIST_CREW[(_l, "ORDO MALLEUS RESERVES")] = _IMP_RESERVE
LIST_CREW[("Imperial Navy \u2014 Bastion Fleets",
           "THE RESERVE FLEETS OF SEGMENTUM OBSCURUS")] = _IMP_RESERVE

# Armageddon: a star in the label = a Space Marine ship (FL p.41), and rapid strike
# vessels are Imperial hulls crewed by the chapter (FL p.106).
_ARM_EX = [("Rapid Strike Vessel", "SPACE MARINES"), ("Space Marine", "book"),
           ("Nova", "book"), ("Gladius", "book"), ("Hunter", "book")]
for _sec in ("Battleships", "Cruisers", "ESCORTS"):
    LIST_CREW[("Imperial Navy \u2014 Armageddon Sector", _sec)] = {
        "crew": "own", "ex": _ARM_EX, "pg": 41,
        "why": "the starred ones are Space Marine ships (FL p.41, p.106)"}

# The Space Marine lists' rapid strike vessels: Imperial hulls with a chapter
# crew and every Space Marine rule (FL p.106).
for _l in ("Space Marines \u2014 Codex Astartes", "Space Marines \u2014 Dominion"):
    LIST_CREW[(_l, "ESCORTS")] = {"crew": "own", "pg": 106,
                                  "why": "rapid strike vessel = a chapter crew (FL p.106)"}
# Grey Knights: the whole list is a Space Marine crew (FL p.154).
LIST_CREW[("Grey Knights", "ESCORTS")] = {
    "crew": "SPACE MARINES", "pg": 154,
    "why": "Grey Knights count as Space Marines in all respects (FL p.154)"}

# Explorator: Imperial and chapter hulls are Mechanicus ships, and do not get
# the Space Marine bonus (FL p.121, p.125).
for _sec in ("Battleships", "Cruisers", "ESCORTS"):
    LIST_CREW[("Adeptus Mechanicus \u2014 Explorator", _sec)] = {
        "crew": "own", "pg": 121,
        "why": "count as Mechanicus vessels ... nor do they get any boarding "
               "action bonuses Space Marine escorts may have (FL p.121)",
        # FL p.119: "All Mechanicus capital ships add +1 to a given vessel's
        # original turret value" and "These improvements are already included in
        # the point cost". FL p.121: escorts do not get it automatically
        # (they can buy it, and that is handled by the card's turret adjuster).
        # FL p.126: the Omnissiah's Victory gets no refits at all - it is
        # its own row in the ship base and does not go through here.
        "tu_cap": 1, "tu_pg": 119, "tu_check": True}

# The Rogue Trader lists crew their hulls themselves (FL p.184, p.188).
for _l, _secs in (("Rogue Traders", ("CAPITAL SHIPS", "NOTES FROM NATE MONTES")),
                  ("Rogue Traders \u2014 Exploration",
                   ("CAPITAL SHIPS", "NOTES FROM NATE MONTES", "TRANSPORTS")),
                  ("Rogue Traders \u2014 Pirates and Wolf Packs",
                   ("ESCORTS", "NOTES FROM NATE MONTES"))):
    for _sec in _secs:
        LIST_CREW[(_l, _sec)] = {"crew": "own", "pg": 184,
                                 "why": "the rogue trader's own hull (FL p.184, p.188)"}
LIST_CREW[("Rogue Traders \u2014 Pirates and Wolf Packs", "CAPITAL SHIPS")] = {
    "crew": "own", "ex": [("Space Marine Strike Cruiser", "book")], "pg": 188,
    "why": "the pirate's own hull; a Space Marine cruiser stays a chapter ship"}
for _l in ("Rogue Traders", "Rogue Traders \u2014 Exploration"):
    for _sec in ("XENOS ALLIES", "The Demiurg", "The Kroot"):
        LIST_CREW[(_l, _sec)] = _ALLY

# Chaos: renegade hulls are Chaos ships in all respects (+1), but they
# cannot take a Chaos Space Marine crew, a Chaos Lord or a mark
# (FL p.232, p.235).
for _l in ("Chaos \u2014 Incursion", "Chaos \u2014 Black Crusade", "Chaos \u2014 Tzeentch",
           "Chaos \u2014 Nurgle", "Chaos \u2014 Khorne", "Chaos \u2014 Slaanesh"):
    LIST_CREW[(_l, "RENEGADE IMPERIAL VESSELS")] = {
        "crew": "own", "fl": ["renegade"], "pg": 232,
        "why": "they count as Chaos vessels in all respects (FL p.232)"}

# Tau and Demiurg: the halving rule follows the hull's own branch, not the list
# (FL p.450), and the War Host's other hulls are allies (FL p.486).
for _l, _secs in (("Tau \u2014 Merchant Fleet",
                   ("ESCORTS", "Kroot Vessels", "Demiurg Vessels", "Nicassar Vessels")),
                  ("Tau \u2014 Commerce Protection",
                   ("Battleships", "Cruisers", "ESCORTS", "Kroot Vessels",
                    "Demiurg Vessels", "Nicassar Vessels")),
                  ("Demiurg \u2014 War Host",
                   ("Kroot Vessels", "Tau Escorts", "Nicassar Escorts"))):
    for _sec in _secs:
        LIST_CREW[(_l, _sec)] = {"crew": "book", "pg": 450,
                                 "why": "the hull keeps its own branch's rules (FL p.450, p.486)"}
_RT_CONTINGENT = {"crew": "ROGUE TRADERS", "pg": 184,
                  "why": "a rogue trader contingent (FL p.184)"}
LIST_CREW[("Tau \u2014 Commerce Protection", "Rogue Traders")] = _RT_CONTINGENT
LIST_CREW[("Demiurg \u2014 War Host", "Rogue Trader Escorts")] = _RT_CONTINGENT
LIST_CREW[("Demiurg \u2014 War Host", "Cruisers")] = {
    "crew": "book", "ex": [("Dauntless", "ROGUE TRADERS")], "pg": 486,
    "why": "allied hulls keep their own rules (FL p.486)"}

# Flags that travel with the crew stay in the source fleet: a borrowed hull gets
# a new crew, not the old crew's bonuses.
CREW_FLAGS = ("marines", "greyknights", "csm", "khorne", "nurgle", "berzerkers",
              "terminators", "goff", "abaddon", "aspect", "megaarmour",
              "clanzwarlord", "blackship")


# --------------------------------------------------------------------------
# Ship- and class-specific boarding rules.
# key: "<FLEET>|<SHIP NAME>"  ->  (flags, source sentence id)
# The source sentence is checked from the sr/op/ol text; None = not checked
# (the rule comes from the fleet list, not the ship profile).
# --------------------------------------------------------------------------
SHIP_FLAGS = {
    # Ship-specific boarding, critical and catastrophe exceptions. The boarding
    # resolver must also know profile-specific critical rules,
    # because a boarding action can cause a critical and its extra damage can
    # lead straight to a catastrophe roll.
    "IMPERIAL NAVY|MERCURY CLASS BATTLECRUISER":
        (["cata3"], "rolls 3D6 for catastrophic damage"),

    # These hulls skip the Prow Armament Damaged result entirely and do not
    # move it to the next critical result (FL p.58-60, 63, 270-273).
    "IMPERIAL NAVY|VENGEANCE CLASS GRAND CRUISER":
        (["ignoreprow"], "completely ignores prow critical damage"),
    "IMPERIAL NAVY|EXORCIST CLASS GRAND CRUISER":
        (["ignoreprow"], "completely ignores prow critical damage"),
    "IMPERIAL NAVY|AVENGER CLASS GRAND CRUISER":
        (["ignoreprow"], "completely ignore prow critical damage"),
    "IMPERIAL NAVY|JOVIAN CLASS BATTLECRUISER":
        (["orders2", "ignoreprow"], [
            "gains a +2 bonus when the enemy is on special orders instead of +1",
            "may ignore the result entirely instead of moving up the table",
        ]),
    "CHAOS|RETALIATOR CLASS GRAND CRUISER":
        (["ignoreprow"], "completely ignores prow critical damage"),
    "CHAOS|VENGEANCE CLASS GRAND CRUISER":
        (["ignoreprow"], "completely ignores prow critical damage"),
    "CHAOS|EXECUTOR CLASS GRAND CRUISER":
        (["ignoreprow"], "completely ignores prow critical damage"),

    # The Demiurg's Bridge Smashed does not lower Leadership but causes +1
    # extra damage (FL p.488-490).
    "DEMIURG|‘STRONGHOLD’ COMMERCE VESSEL":
        (["bridgeplus1"], "instead cause an extra point of damage"),
    "DEMIURG|‘BASTION’ COMMERCE VESSEL":
        (["bridgeplus1"], "instead cause an extra point of damage"),
    "DEMIURG|‘CITADEL’ COMMERCE VESSEL":
        (["bridgeplus1"], "instead cause an extra point of damage"),

    # A narrow central corridor: +1 when defending
    "IMPERIAL NAVY|ENDEAVOUR CLASS LIGHT CRUISER":
        (["corridor"], "+1 to their dice roll when defending against a boarding action"),
    "IMPERIAL NAVY|ENDEAVOUR CLASS LIGHT CRUISER (BAKKA)":
        (["corridor"], "+1 to their dice roll when defending against a boarding action"),
    "IMPERIAL NAVY|ENDURANCE CLASS LIGHT CRUISER":
        (["corridor"], "+1 to their dice roll when defending against a boarding action"),
    "IMPERIAL NAVY|ENDURANCE CLASS LIGHT CRUISER (BAKKA)":
        (["corridor"], "+1 to their dice roll when defending against a boarding action"),
    "IMPERIAL NAVY|DEFIANT CLASS LIGHT CRUISER":
        (["corridor"], "+1 to their dice roll when defending against a boarding action"),
    "ROGUE TRADERS|ENDEAVOUR CLASS LIGHT CRUISER":
        (["corridor"], "+1 to their dice roll when defending against a boarding action"),

    # Inquisition
    "INQUISITION|BLACKSHIP":
        (["blackship", "gellar"], "never attempt to board an enemy vessel"),
    "INQUISITION|GREY KNIGHTS BATTLE BARGE":
        (["greyknights", "marines"], "re-roll any boarding action result"),
    "INQUISITION|GREY KNIGHTS STRIKE CRUISER":
        (["greyknights", "marines"], "re-roll any boarding action result"),

    # Chaos
    "CHAOS|SLAVERER, WORLD EATERS BATTLE BARGE":
        (["khorne", "csm", "berzerkers", "terminators"],
         "boarding modifier of +2 in addition to its improved boarding value"),
    "CHAOS|TERMINUS EST, DEATH GUARD BATTLE BARGE":
        (["nurgle"], "bears the Mark of Nurgle as part of its point cost"),
    "ELDAR|FLAME OF ASURYAN, YRIEL'S FLAGSHIP":
        (["aspect"], "count as an Aspect Warrior fighting crew"),
    "CHAOS|ACTIVATED BLACKSTONE FORTRESS":
        (["nocrew"], "does not add a D6 to its boarding score"),

    # Eldar
    "ELDAR|HEMLOCK CLASS DESTROYER":
        (["noboard", "easyprey"], "cannot initiate boarding actions"),
    "ELDAR|SHADOWHUNTER":
        (["noboard", "easyprey", "hr_target_plus1"], "cannot initiate boarding actions"),

    # Hull-specific critical tables and hulks
    "KROOT|WARSPHERE":
        (["critplus1", "nocata4"], None),
    "NICASSAR|CARAVAN":
        (["critplus1", "nocata4"], None),
    # Only a space hulk may board a star fort (FL p.502, p.111)
    "HIGH ORBIT DEFENCES|RAMILIES CLASS STAR FORT":
        (["fortress", "ramilies"], None),
    "ELDAR|HAVEN SPACE STATION":
        (["haven"], None),
    "SPACE MARINES|FORTRESS-MONASTERY":
        (["fortress", "ramilies"], None),

    # The Rogue Trader list's xenos hulls are alien ships against the Ordo Xenos
    # (FL p. 151). The fleet tag is not enough, because the same list has
    # Imperial hulls.
    "ROGUE TRADERS|XENOS VESSEL":
        (["alien"], None),
    "ROGUE TRADERS|PTHUXUTL WAR CRUISER":
        (["alien"], None),
    "ROGUE TRADERS|FRA’AL RAIDER":
        (["alien"], None),
    "ROGUE TRADERS|NEKULLI WHIP":
        (["alien"], None),
    "ROGUE TRADERS|FRA’AL BATTLESHIP":
        (["alien"], None),
    "ROGUE TRADERS|STRYXIS CARAVAN VESSEL":
        (["alien"], None),

    "ORKS|ROK":
        (["critplus1", "nocata4"], None),
    "ORKS|ORK HULK":
        (["orkhulk", "spacehulk"], None),
    "CHAOS|CHAOS SPACE HULK":
        (["chaoshulk", "spacehulk"], None),
    "CHAOS|WAGE OF SIN, EMPEROR'S CHILDREN BATTLE BARGE":
        (["csm"], "Emperor’s Children Chaos Space Marines"),

    # Orks
    "ORKS|ZUKOV'S KLAW ASSAULT KROOZER":
        (["goff"], "additional +1 modifier during boarding actions"),
    "ORKS|GRUNT ASSAULT SHIP":
        (["hp2"], "Count as 2HP when determining their boarding value"),
}

# Display name exceptions: (short name, subtitle)
NAME_OVERRIDE = {
    "OMNISSIAH'S VICTORY, ARK MECHANICUS": ("Omnissiah\u2019s Victory", "Ark Mechanicus"),
    "SEDITIO OPPRIMERE, VENERABLE BATTLE BARGE": ("Seditio Opprimere", "Venerable battle barge"),
    "SCION OF PROSPERO, THOUSAND SONS BATTLE BARGE": ("Scion of Prospero", "Thousand Sons battle barge"),
    "SLAVERER, WORLD EATERS BATTLE BARGE": ("Slaverer", "World Eaters battle barge"),
    "TERMINUS EST, DEATH GUARD BATTLE BARGE": ("Terminus Est", "Death Guard battle barge"),
    "WAGE OF SIN, EMPEROR'S CHILDREN BATTLE BARGE": ("Wage of Sin", "Emperor\u2019s Children battle barge"),
    "FLAME OF ASURYAN, YRIEL'S FLAGSHIP": ("Flame of Asuryan", "Yriel\u2019s flagship"),
    "GORBAG\u2019S REVENGE BATTLESHIP": ("Gorbag\u2019s Revenge", "Battleship"),
    "ZUKOV'S KLAW ASSAULT KROOZER": ("Zukov\u2019s Klaw", "Assault kroozer"),
    "THE PLANET KILLER": ("Planet Killer", "Battleship"),
    "\u2018STRONGHOLD\u2019 COMMERCE VESSEL": ("Stronghold", "Commerce vessel"),
    "\u2018BASTION\u2019 COMMERCE VESSEL": ("Bastion", "Commerce vessel"),
    "\u2018CITADEL\u2019 COMMERCE VESSEL": ("Citadel", "Commerce vessel"),
    "Q-SHIP": ("Q-Ship", "Escort"),
    "HIVE SHIP": ("Hive ship", "Tyranid battleship"),
    "CRUISER": ("Tyranid cruiser", "Cruiser"),
    "KRAKEN": ("Kraken", "No spore cysts"),
    "VANGUARD DRONE SHIP": ("Vanguard drone", "Escort"),
    "ESCORT DRONE": ("Escort drone", "Escort"),
    "RAMILIES CLASS STAR FORT": ("Ramilies", "Star fort"),
    "ACTIVATED BLACKSTONE FORTRESS": ("Blackstone Fortress", "Activated"),
    "BLACKSTONE FORTRESS": ("Blackstone Fortress", "Dormant"),
}

# Tau-konfiguraatiot: "GAL'LEATH (EXPLORER) CLASS STARSHIP - VASH'YA MK XXIII CONFIGURATION"
TAU_RE = re.compile(
    r"^(?P<base>.+?)\s+CLASS\s+(?P<hull>[A-Z\u2019' ]+?)\s*[\u2014\u2013-]\s*(?P<cfg>.+?)\s*(?:CONFIGURATION)?$")

KEEP_UPPER = {"MK", "II", "III", "IV", "VI", "VII", "VIII", "IX", "XI", "XII",
              "XXIII", "XXIV", "XXV", "AI", "PDF"}


def _word(w):
    if not w:
        return w
    lead = ""
    while w and w[0] in "(\u2018\u2019'\"":
        lead += w[0]
        w = w[1:]
    trail = ""
    while w and w[-1] in ")\u2018\u2019'\".,":
        trail = w[-1] + trail
        w = w[:-1]
    if not w:
        return lead + trail
    if w.upper() in KEEP_UPPER:
        w = w.upper()
    else:
        # keep the small letter after an apostrophe: KOR'VATTRA -> Kor'vattra
        w = w[0].upper() + w[1:].lower()
    return lead + w + trail


def titlecase(s):
    return " ".join(_word(w) for w in s.split(" ") if w)


def split_name(nm, ty):
    """-> (short display name, subtitle)

    " CLASS " is the book's own separator between the class name and the hull, so
    a split on it is safe. Without it the name is NOT split - "Kill Kroozer"
    is not a kroozer of the "Kill" class - but the subtitle becomes the profile's hull type.
    """
    if nm in NAME_OVERRIDE:
        return NAME_OVERRIDE[nm]

    m = TAU_RE.match(nm)
    if m and ("\u2014" in nm or "\u2013" in nm):
        base = titlecase(m.group("base"))
        cfg = titlecase(m.group("cfg").replace(" CONFIGURATION", ""))
        return base, cfg

    head, tail = nm, ""
    if ", " in head:
        head, tail = head.split(", ", 1)

    paren = ""
    pm = re.search(r"\s*(\([^)]*\))\s*$", head)
    if pm:
        paren = pm.group(1)
        head = head[: pm.start()]

    if " CLASS " in head:
        base, hull = head.split(" CLASS ", 1)
    else:
        base, hull = head, ty

    base = titlecase(base)
    if paren:
        base = base + " " + titlecase(paren)
    sub = titlecase(hull) if hull else ""
    if tail:
        sub = (titlecase(tail) + (" " + sub.lower() if sub else "")).strip()
    return base, sub or titlecase(ty)



def list_has_turret_refit(lst):
    """The Explorator list's required +1 turret for large ships (FL p.119).
    If the data changes so that the row is gone, the run shouts."""
    for sec in lst.get("secs", []):
        for ent in sec.get("ents", []):
            if (ent.get("k") == "up" and ent.get("req")
                    and (ent.get("mod") or {}).get("tu") == 1):
                return True
    return False


def crew_for(entry_label, sec_rule, own_fleet, book_fleet):
    """Who crews this label: the fleet key."""
    crew = sec_rule["crew"]
    for prefix, other in sec_rule.get("ex", ()):
        if entry_label.lower().startswith(prefix.lower()):
            crew = other
            break
    if crew == "own":
        return own_fleet
    if crew == "book":
        return book_fleet
    return crew


def borrowed_rows(data, ships_in, base_rows, fleet_keys):
    """Hulls that a fleet crews itself although the profile is in another book's
    section (the FL fleet lists). Returns the new rows and the problems."""
    problems = []
    rows = []
    have = set()                      # (fleet index, display name)
    by_id = {}
    for r in base_rows:
        have.add((r["f"], r["full"]))
        by_id.setdefault((fleet_keys[r["f"]], r["full"]), r)

    seen_rules = set()
    added = {}
    for lst in data.get("lists", []):
        lname = lst.get("nm", "")
        own = LIST_FLEET.get(lname)
        if own is None:
            problems.append("UNCLASSIFIED LIST: %s" % lname)
            continue
        for sec in lst.get("secs", []):
            ents = [e for e in sec.get("ents", [])
                    if e.get("k") == "unit" and e.get("r") is not None]
            if not ents:
                continue
            stitle = sec.get("t", "")
            rule = LIST_CREW.get((lname, stitle))
            foreign = any(ships_in.get(str(e["r"]), {}).get("fl") != own for e in ents)
            renamed = any("rapid strike" in (e.get("l") or "").lower() for e in ents)
            if rule is None:
                if foreign or renamed:
                    problems.append("UNCLASSIFIED SECTION: %s / %s "
                                    "(a foreign hull or a renamed label)"
                                    % (lname, stitle))
                continue
            seen_rules.add((lname, stitle))
            if rule.get("tu_check") and not list_has_turret_refit(lst):
                problems.append("TURRET REFIT GONE FROM THE LIST: %s (FL p.%s)"
                                % (lname, rule.get("tu_pg")))
            for e in ents:
                prof = ships_in.get(str(e["r"]))
                if prof is None:
                    problems.append("UNKNOWN SHIP REFERENCE: %s / %s / %s"
                                    % (lname, stitle, e.get("l")))
                    continue
                book = prof["fl"]
                crew = crew_for(e.get("l") or "", rule, own, book)
                if crew == book:
                    continue
                if crew not in fleet_keys:
                    problems.append("UNKNOWN CREW FLEET %s: %s / %s"
                                    % (crew, lname, stitle))
                    continue
                src = by_id.get((book, prof["nm"]))
                if src is None:
                    problems.append("THE BORROWED HULL IS NOT IN THE SHIP BASE: %s (%s)"
                                    % (prof["nm"], book))
                    continue
                fi = fleet_keys.index(crew)
                if (fi, prof["nm"]) in have:
                    continue          # the fleet already has a hull of the same name
                have.add((fi, prof["nm"]))
                row = dict(src)
                row["f"] = fi
                if rule.get("tu_cap") and row["t"] != "Escort":
                    row["tu"] = row["tu"] + rule["tu_cap"]
                flags = [f for f in row.get("fl", []) if f not in CREW_FLAGS]
                flags.extend([f for f in rule.get("fl", []) if f not in flags])
                if flags:
                    row["fl"] = flags
                elif "fl" in row:
                    del row["fl"]
                row["from"] = book          # which book the profile is from
                rows.append(row)
                added.setdefault(crew, []).append(prof["nm"])

    for key, rule in LIST_CREW.items():
        if key not in seen_rules and not rule.get("generic"):
            problems.append("a LIST_CREW row matched no section: %s / %s" % key)

    for fleet in sorted(added):
        print("  %-20s + %d hulls from lists: %s"
              % (fleet, len(added[fleet]), ", ".join(sorted(added[fleet]))[:150]))
    return rows, problems


def main():
    if not os.path.exists(SRC):
        print("NOT FOUND:", SRC)
        return 2
    data = json.load(open(SRC, encoding="utf-8"))
    ships_in = data["ships"]

    fleet_keys = [f[0] for f in FLEETS]
    out_fleets = [{"id": f[0], "name": f[1], "race": f[2]} for f in FLEETS]

    seen_flag_keys = set()
    problems = []
    out_ships = []

    for sid, s in sorted(ships_in.items(), key=lambda kv: (int(re.match(r"\d+", kv[0]).group(0)), kv[0])):
        fl = s["fl"]
        if fl not in fleet_keys:
            problems.append("unknown fleet: %s (%s)" % (fl, s["nm"]))
            continue
        fi = fleet_keys.index(fl)

        tu_raw = str(s.get("tu", "0")).strip()
        if tu_raw in ("\u2013", "\u2014", "-", "", "0"):
            tu = 0
        else:
            m = re.match(r"\d+", tu_raw)
            tu = int(m.group(0)) if m else 0

        key = fl + "|" + s["nm"]
        flags = []
        if key in SHIP_FLAGS:
            flags, needle = SHIP_FLAGS[key]
            flags = list(flags)
            seen_flag_keys.add(key)
            if needle:
                hay = (s.get("sr") or "") + " " + (s.get("op") or "") + " " + \
                      json.dumps(s.get("ol") or [], ensure_ascii=False)
                needles = needle if isinstance(needle, list) else [needle]
                for expected in needles:
                    if expected.lower() not in hay.lower():
                        problems.append("SOURCE SENTENCE GONE: %s -- expected %r" % (key, expected))

        short, sub = split_name(s["nm"], s["ty"])
        row = {
            "f": fi,
            "n": short,
            "s": sub,
            "full": s["nm"],
            "t": s["ty"],
            "hp": int(s["hp"]),
            "tu": tu,
            "pg": int(s["pg"]),
        }
        if str(s.get("tl", "")).upper().startswith("SPORE"):
            row["spores"] = 1
        if flags:
            row["fl"] = flags
        race = FLEETS[fi][2]
        if race in ("eldar", "darkeldar"):
            # Every Eldar ship has a holofield/shadowfield, and it is
            # rolled against the whole boarding attempt (FL p.305, p.344).
            row["on"] = ["holofields"]
        # A variant profile of the same ship (the data's "334b" pirate-base Haven,
        # "392d" Rok as a defence) is the same ship in a boarding action: the
        # picker would show it twice with nothing to tell them apart.
        if any(r == row for r in out_ships):
            continue
        out_ships.append(row)

    for key in SHIP_FLAGS:
        if key not in seen_flag_keys:
            problems.append("a SHIP_FLAGS row matched no ship: %s" % key)

    borrowed, borrow_problems = borrowed_rows(data, ships_in, out_ships, fleet_keys)
    out_ships.extend(borrowed)
    problems.extend(borrow_problems)

    out = {
        "src": "bfg_data.json / " + str(data.get("src", ""))[:120],
        "fleets": out_fleets,
        "ships": out_ships,
    }
    # An incomplete or uncertain ship base does not reach the disk: the old file stays
    # in force, so that the next build does not bake an error into the finished app.
    if problems:
        print("\nPROBLEMS (%d) - %s NOT written:" % (len(problems), OUT))
        for p in problems:
            print("  -", p)
        return 1

    tmp = OUT + ".tmp"
    with open(tmp, "w", encoding="utf-8", newline="\n") as fh:
        json.dump(out, fh, ensure_ascii=False, separators=(",", ":"))
        fh.write("\n")
    os.replace(tmp, OUT)

    print("written %s  (%d ships, %d fleets, %d bytes)"
          % (OUT, len(out_ships), len(out_fleets), os.path.getsize(OUT)))
    print("no problems")
    return 0


if __name__ == "__main__":
    sys.exit(main())
