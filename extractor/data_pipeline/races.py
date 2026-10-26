# -*- coding: utf-8 -*-
"""Stage 11 of the data pipeline (extractor/build_data.py): races.

The stages run in file order when the entry imports the last one; each
imports what it uses from the stages before it. One pipeline script
until 26.10.2026, split by stage for reading, not for reuse.
"""
import json, io, re, collections, os, sys
import upgrades
import swaps, copy
from .inputs import copy, re
from .inquisition_allies import _INQ_HOSTS, _L, _cmd, _cmds, _e, _hit, _i, _inq_at, _inq_limits, _md, _nm, _r, _x
from .profile_types import _AR, _a, _c, _sec, _sh, e, r, x
from .row_classes import _p18_list, _p18_sec, _p18_unit, _ty, add_text, j, k
from .row_texts import _pg
from .section_guard import lists_out
from .ships import _g, _src, ships
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
