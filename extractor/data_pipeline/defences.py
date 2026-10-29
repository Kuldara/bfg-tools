# -*- coding: utf-8 -*-
"""Stage 13 of the data pipeline (extractor/build_data.py): defences.

The stages run in file order when the entry imports the last one; each
imports what it uses from the stages before it. One pipeline script
until 26.10.2026, split by stage for reading, not for reuse.
"""
import json, io, re, collections, os, sys
import upgrades
import swaps, copy
from .inquisition_allies import _ents, _rules
from .page_refs import pg, v
from .profile_types import _o, _s, _sq, _t, e, r
from .races import _c, _i, _md, _race
from .row_classes import _bs, _mx, k
from .row_texts import _k, _opt_id
from .section_guard import a, lists_out, p
from .ships import o, ships
from .special_rows import _L
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
#   - Haven: p.332 is a station of the ELDAR chapter; the Corsair and Craftworld lists.
#     Dark Eldar get it only with the weapons swapped (p.335, p.349).
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
# p.362 ORK PLANETARY DEFENCES (J172): "Ork Roks can be taken as planetary
# defences and purchased using planetary defence point allowances ... Ork Roks
# cannot move and count as stationary in all effects when purchased as
# defences". The same hull as the list's own Rok (p.394), but as a defence:
# a key of its own, so that the df flag does not take the list Rok's upgrades nor
# its movement rules. Speed 0 cm tells on the card and in the domain that it does not move.
# The Rok's own rules (p.395: a critical +1 damage, breaks into 4 Blast markers)
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
assert [o["t"] for o in _o480] == ["Launch Bay +10 pts", "Gravitic hook +5 pts: Orca/Warden needs to be purchased separately. Can't be equipped with Dhows.",
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
_PD_ROK_NT = ("A Rok bought as a planetary defence cannot move (Fleets p. 362). Roks squadron only "
              "with other Roks, up to four (p. 369).")
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
        # p.362: "Instead of using the Imperial Blackstone Fortress, Orks use
        # a non-moving Space Hulk" - the same profile and price, a different model.
        if _race == "orks":
            _bs = [e for e in _ents if e["l"] == "Blackstone fortress"]
            assert len(_bs) == 1
            _bs[0]["nt"] = ("Orks field a non-moving Space Hulk in its place, on the same "
                            "profile and points cost (Fleets p. 362).")
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
#         rules (p.334): no field.
#   dor = the allowed special orders. RO+BFI: "cannot take on any special
#         orders except Reload Ordnance, though they may also attempt to
#         Brace For Impact" (p.499). RO+LO+BFI: Ramilies p.503,
#         Fortress-Monastery p.110-111, Haven p.334.
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
    # p.362: a Rok as a defence "Reload Ordnance and Brace For Impact, for
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
