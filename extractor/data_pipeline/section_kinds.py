# -*- coding: utf-8 -*-
"""Stage 14 of the data pipeline (extractor/build_data.py): section kinds.

The stages run in file order when the entry imports the last one; each
imports what it uses from the stages before it. One pipeline script
until 26.10.2026, split by stage for reading, not for reuse.
"""
import json, io, re, collections, os, sys
import upgrades
import swaps, copy
from .defences import _L, _c, _k, _o, _t
from .inputs import _HERE, io, json, os, re
from .inquisition_allies import _BK
from .page_refs import _key, v
from .profile_types import Lx, _CZ_GUB_RE, _EX, _IY, _WH, _cs, _n, _s, _si, e, s, x
from .races import ALLY_XENOS, _AR, _ar, _b, _e, _nm, _r, _sec, _sh, _src, _x
from .row_classes import _p18_list, _p18_sec, _text_key, i, k, t
from .row_texts import _lab, _seen
from .section_guard import _SEC_COUNT, _SEC_LIST_KEYS, check_section_names, count_section_refs, lists_out, p
from .ships import ships
from .special_rows import _labs
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
    ("chaos space hulk", "own", "one named ship with its own conditions (p.290)"),
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
    ("rogue traders", "access", "named access (p.184)"),
    ("rogue trader escorts", "access", "named access (p.184)"),
    ("transports", "own", "the Rogue Trader list's own transport section"),
    ("reserves", "reserve", "the list's own reserve section: the ships belong to another list"),
    ("ordo malleus reserves", "reserve",
     "J144 p.152: the Bastion list's Chaos hulls of a fleet led by an Ordo Malleus "
     "inquisitor; the same 1:3 budget as other reserves"),
    ("the reserve fleets of segmentum obscurus", "reserve",
     "Bastion's own reserve section (p.39): five Chaos hulls that use "
     "the same 1:3 budget as ships borrowed from elsewhere"),
    ("notes from nate montes", "own", "a rule box, not a ship kind"),
    # p.232: "do not count as reserves" and p.15: named access to another race's
    # ships "may not also be taken as reserves". It was own, so the reserve of a
    # reserve check did not hit (spot check 20, seeds 2026091421/23/42).
    ("renegade imperial vessels", "access",
     "the Chaos list's own renegade rows (p.232): 'they count as Chaos vessels "
     "in all respects', so they are not reserves and cannot be borrowed"),
    ("xenos allies", "access",
     "the Rogue Traders' named access to Demiurg and Kroot ships (p.185)"),
    ("the inquisition", "access",
     "the list's named access to Inquisition ships (p.148); not a ship kind and "
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
# In v0.36 the extractor read short lines of the book as headings ("Marine
# crew may be" on the god lists, "Space Marine Chapters are fiercely" on the
# Inquisition, "The Rogue Trader cruiser profile" on Rogue Traders), and the
# sentences were reassembled here. v0.40's layout reads them as text, so the
# fix is gone; this guard keeps a heading made of a sentence start out.
_FRAG_T = ("Marine crew may be", "Furthermore the launch", "This is because the launch",
           "Space Marine Chapters are fiercely", "The Rogue Trader cruiser profile")
_frag = ["%s / %s" % (_L["nm"], _s["t"]) for _L in lists_out for _s in _L["secs"] if _s["t"] in _FRAG_T]
assert not _frag, "J213: a sentence start is a section heading again: %s" % _frag

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
# (b) p.187 (S0380, S0384, S0386): the Exploration list's allies from one
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
# (c) Agreement rules (S0352 p.184, S1004 p.426): the row is legal only with
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
# (d) Adeptus Mechanicus reserves (p.121-123, S0246 S0249 S0250 S0255 S0256).
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
            + _j213_text(_AMX, _amf, "Escorts taken in this manner must be taken from the same fleet list") + " (Fleets p. 123)",
    interp=dict(id="T51", note="Open interpretation: \"Escorts taken in this manner must be taken from the same fleet "
                "list reserve capital ships are being drawn from\" (Fleets p. 123). The app reads it as: reserve escorts "
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
_AR_IL_IN = _cite("An Imperial Navy or Adeptus Mechanicus fleet led by an Inquisitor Lord has an attack rating of 2.", 149)
_AR_IL_SM = _cite("A Space Marine fleet led by an Inquisitor Lord has an attack rating of 3 unless a Blackship is "
                  "accompanying the fleet, in which case its attack rating is 2.", 149)
# v0.40 p.155: the Grey Knights rating no longer depends on who leads the fleet.
_AR_IL_GK = _cite("A Grey Knights fleet has an attack rating of 3 unless a Blackship is accompanying the fleet, "
                  "in which case its attack rating is 2.", 155)
_AR_GK = _cite("Grey Knights are Space Marines in all respects and use all their special rules described on "
               "pg. 94 onwards, including the Bombardment Cannon.", 155)
_AR_CW = _cite("An Eldar fleet containing any Craftworld Eldar vessels has an attack (or initiative) rating of 3.", 304)
_AR_CORS = _cite("An Eldar Corsair fleet containing no Craftworld Eldar vessels has an attack (or initiative) rating of 4.", 304)
_AR_YRIEL = _cite("A fleet led by Yriel has an attack rating of 4, even if it includes Craftworld vessels.", 313)
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
    "Grey Knights": [_ar(3, _AR_IL_GK, _AR_GK, none=[_BSHIP]), _ar(2, _AR_IL_GK, all=[_BSHIP])],
    "Rogue Traders — Exploration": [_ar(3, _cite("When used with this fleet list, Rogue Traders have an attack "
                                                 "(initiative) rating of 3.", 186))],
    "Rogue Traders — Pirates and Wolf Packs": [_ar(3, _cite("Pirate fleets have an attack or initiative rating of 3.", 188))],
    "Chaos": [_ar(2, _cite("Chaos fleets have a starting attack or initiative rating of 2.", 232))],
    "Eldar Corsairs": [_ar(4, _AR_CORS), _ar(3, _AR_CW, frm=_CWF, none=[_YR]), _ar(4, _AR_YRIEL, all=[_YR])],
    "Eldar — Iyanden Craftworld": [_ar(3, _AR_CW), _ar(4, _AR_YRIEL, all=[_YR])],
    "Dark Eldar": [_ar(4, _AR_RB("Dark Eldar", 4))],
    "Orks": [_ar(3, _AR_RB("Orks", 3))],
    "Necrons": [_ar(4, _cite("Necrons have a starting attack or initiative rating of 4.", 402))],
    "Tyranids": [_ar(3, _cite("Tyranids have a starting attack or initiative rating of 3.", 418))],
    "Tau": [_ar(2, _cite("Tau have a starting attack or initiative rating of 2.", 450))],
    "Demiurg — War Host": [_ar(2, _cite("The Demiurg fleet has an Attack or Initiative rating of 2.", 486))],
}
# Lists without a number: "not given" is shown with where the number could come from
# (T53). The Inquisition is not an independent fleet (p.142), the Rogue Traders
# list (p.178-185) has no number of its own.
_AR_NONE = {
    "The Emperor's Inquisition": [_AR_IL_IN, _AR_IL_SM],
    "Rogue Traders": [_cite("When used with this fleet list, Rogue Traders have an attack (initiative) rating of 3.", 186),
                      _cite("The chart that follows shows the attack ratings of all fleets. Imperial: 2", 120, rb=True)],
}
# Sentences that are not in the sections' text (the race's general rules were left out of
# the extraction): the golden cases' why + check_quotes.py prove them.
_AR_OFFTEXT = {"Chaos fleets have a starting", "An Eldar fleet containing any", "An Eldar Corsair fleet containing no",
               "Tyranids have a starting", "Grey Knights are Space Marines in all respects"}
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
_OPP_MAL = dict(pick=["^ordo malleus inquisitor lord"], what="Mark of Chaos or Daemonship",
                many="Marks of Chaos or Daemonships",
                cite=[_cite("The enemy Chaos fleet may add one Mark of Chaos or upgrade a cruiser to a Daemonship at "
                            "no cost.", 152)])
_OPP_XEN = dict(pick=["^ordo xenos inquisitor lord$"], fixed="D6×50 pts of escorts",
                cite=[_cite("The enemy Xenos fleet adds D6×50 points of escort vessels to its fleet for free.", 151)])
# v0.40 p.154: only an Ordo Malleus Lord calls the Chaos extras, one for him and
# one more per strike cruiser (needs: nothing without him).
_OPP_GK = dict(pick=["^ordo malleus inquisitor lord", "^grey knights strike cruiser"], needs="^ordo malleus inquisitor lord",
               what="Mark of Chaos or Daemonship", many="Marks of Chaos or Daemonships",
               cite=[_cite("The enemy Chaos fleet may add one Mark of Chaos or upgrade a cruiser to a Daemonship at "
                           "no cost, and may also do so again as many times as there are Grey Knights strike "
                           "cruisers in the fleet.", 154)])
_nopp = 0
for _L in lists_out:
    _labs = set(e["l"].lower() for _s in _L["secs"] for e in (_s.get("ents") or []))
    _o = []
    if _L["nm"] == "Grey Knights":
        _o.append(_OPP_GK)
    elif any(l.startswith("ordo malleus inquisitor lord") for l in _labs):
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
#            there are commanders of the same rule (Pirate Captains p. 188)
#   only     {any:[{re, arm}], capital, mech, cite}: only ships like these
#   no_up    [{re, cite}]: not a ship with this upgrade (Daemonship)
#   not_with [{cmd, cite}]: not the same ship as this commander
#   alone    {cite}: commanders of the same rule on different ships
#   skip     no person aboard a ship (the Ordo binding is an addition to the Inquisitor Lord)
# A commander without a rule (Admiral etc.) is chosen freely, the dearest by default.
_pl = lambda s, pg: _cite(s, pg)
_PL_INQ = dict(cmd="^inquisitor lord", prefer=[
    dict(re="^inquisitorial cruiser", cite=_pl("They must be aboard an Inquisitorial Cruiser if one is included, "
                                             "otherwise they must be on an Inquisition Blackship if one is included.", 148)),
    dict(re="^inquisition blackship", cite=_pl("They must be aboard an Inquisitorial Cruiser if one is included, "
                                             "otherwise they must be on an Inquisition Blackship if one is included.", 148))],
    dearest=dict(cite=_pl("If none of these ships is present, they have to be placed on the most expensive ship in "
                          "the fleet.", 148)))
_PL_ORDO = dict(cmd=r"^ordo \w+ inquisitor lord( \(ld 10\))?$", skip=True)
_PL_MOF = lambda re, s, pg: dict(cmd="^master of the fleet", prefer=[dict(re=re, cite=_pl(s, pg))])
_CH_WM = _cite("Under no circumstance can a Chaos Lord be placed on the same ship as a Warmaster.", 232)
_CH_AB = _cite("You may not place a Chaos Lord on the same ship as Abaddon.", 241)
def _chaos(wm_s, wm_pg, lord_s, lord_pg, dae_s, dae_pg):
    dae = [dict(re="^daemonship", cite=_cite(dae_s, dae_pg))]
    return [dict(cmd="^chaos warmaster", dearest=dict(cite=_cite(wm_s, wm_pg)), no_up=dae),
            dict(cmd="^abaddon", prefer=[dict(re="^planet killer",
                 cite=_cite("If the Planet Killer is present, Abaddon must be aboard it.", 241))]),
            dict(cmd="^chaos lord", only=dict(capital=True, cite=_cite(lord_s, lord_pg)), no_up=dae,
                 not_with=[dict(cmd="^chaos warmaster", cite=_CH_WM), dict(cmd="^abaddon", cite=_CH_AB)],
                 alone=dict(cite=_cite(lord_s, lord_pg)))]
_LORD_BC = "Any capital ship, apart from that of the Warmaster, may be captained by a Chaos Lord."
_LORD_G = "Any capital ship apart from that of the Warmaster may be captained by a Chaos Lord."
_WM_G = "He must be assigned to the most expensive ship and improves its rolled Leadership by +2, to a maximum of 10."
_DAE_G = "A Daemonship may not be commanded by a Warmaster or a Chaos Lord, even if it is the largest ship in the fleet."
_YRIEL = dict(cmd="^prince yriel",
              prefer=[dict(re="^flame of asuryan", cite=_cite("He must be embarked aboard the Flame of Asuryan if it "
                                                              "is present, in which case Yriel's cost is reduced to 125 points.", 313))],
              only=dict(any=[dict(re="^flame of asuryan"), dict(re="^dragonship", arm="launch bay")],
                        cite=_cite("Prince Yriel must be embarked on a Dragonship equipped with launch bays, or the "
                                   "Flame of Asuryan, even if he is leading a Corsair fleet.", 313)))
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
        dict(re="^inquisitorial cruiser", cite=_cite("They must be aboard an Inquisitorial Cruiser if one is included, "
                                                     "otherwise they must be on an Inquisition Blackship if one is "
                                                     "included.", 154)),
        dict(re="^inquisition blackship", cite=_cite("They must be aboard an Inquisitorial Cruiser if one is included, "
                                                     "otherwise they must be on an Inquisition Blackship if one is "
                                                     "included.", 154))],
        dearest=dict(cite=_cite("If none of these ships is present, they have to be placed on the most expensive "
                                "ship in the fleet.", 154)))],
    "Rogue Traders": [
        dict(cmd="^veteran rogue trader", only=dict(any=[dict(re="^rogue trader cruiser")],
             cite=_cite("A Veteran Rogue Trader may lead each Rogue Trader cruiser in a fleet.", 184)),
             alone=dict(cite=_cite("A Veteran Rogue Trader may lead each Rogue Trader cruiser in a fleet.", 184)))],
    "Rogue Traders — Pirates and Wolf Packs": [
        dict(cmd="^pirate captain", dearest=dict(n=True, cite=_cite(
            "He (or she!) must be placed aboard the most expensive vessel in the fleet (or vessels if more than one "
            "Captain is present).", 188)),
             alone=dict(cite=_cite("He (or she!) must be placed aboard the most expensive vessel in the fleet (or "
                                   "vessels if more than one Captain is present).", 188)))],
    "Chaos — Incursion": [
        dict(cmd="^chaos warmaster", dearest=dict(cite=_cite(
            "He must be assigned to the biggest (ie, most expensive) ship and improves its Leadership to the value "
            "shown below.", 242))),
        dict(cmd="^chaos lord", not_with=[dict(cmd="^chaos warmaster", cite=_CH_WM)])],
    "Chaos — Black Crusade": _chaos("He must be assigned to the most expensive ship and improves its rolled "
                                    "Leadership by +2, to a maximum of 9.", 234, _LORD_BC, 234,
                                    "A Daemon ship may not be commanded by a Warmaster or a Chaos Lord even if it is "
                                    "the largest ship in the fleet.", 245),
    "Chaos — Tzeentch": _chaos(_WM_G, 236, _LORD_G, 236, _DAE_G, 237),
    "Chaos — Nurgle": _chaos(_WM_G, 240, _LORD_G, 240, _DAE_G, 241),
    "Chaos — Khorne": _chaos(_WM_G, 244, _LORD_G, 244, _DAE_G, 245),
    "Chaos — Slaanesh": _chaos(_WM_G, 248, _LORD_G, 248, _DAE_G, 249),
    "Eldar Corsairs": [
        dict(cmd="^eldar hero", prefer=[dict(re="^flame of asuryan", cite=_cite(
            "If the Flame of Asuryan is taken, the Eldar Hero must be embarked aboard it.", 314))]), _YRIEL],
    "Eldar — Iyanden Craftworld": [_YRIEL],
    "Tau — Commerce Protection": [
        dict(cmd="^kor.o.mesme", prefer=[dict(re="^custodian", cite=_cite(
            "Kor'O'Mesme is embarked aboard the Kor'or'vesh vessel Bor'kan Or'es El'Leath Se'arle O'Mesme.", 453))])],
}
# p.232 and p.241 (the short form) are not in the sections' text; the golden why + check_quotes prove them.
# The placement sentences the section text does not keep (check_quotes.py holds
# them against the book): Abaddon's (p.241), the Inquisitor Lord's last
# clause (p.148, p.154), which the commander parser takes as the row's rule.
_PL_OFFTEXT = {"Under no circumstance can a Chaos Lord", "You may not place a Chaos Lord on the same ship as Abaddon.",
               "If none of these ships is present, they have to be placed on the most expensive ship",
               # v0.40: Mesme's dossier (p.453), no longer beside his list row
               "Kor'O'Mesme is embarked aboard"}
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
    # gub_re: the Gubbins allowance (p.374) does not include More Gubbins (p.373 "any number of capital ships") nor
    # Deathskullz's free looted copy (J7, p.371: a clan benefit for every Deathskullz skwadron, J232)
    clan_sec="^clan upgrades$", gub_sec="^gubbins$",
    gub_re=_CZ_GUB_RE,
    sk=_cite("For every re-roll a Warlord has (including the first one for free), the Warlord must be in command of "
             "one tiddla skwadron of at least three escorts and one other skwadrons.", 374),
    sk_interp="Open interpretation T52: read as exactly one tiddla and one other skwadron per re-roll, as the "
              "book's smallest and largest fleets show (Fleets p. 375).",
    uge1=_cite("There is no restriction for what kinds or how many of what type of skwadrons are in the fleet as long "
               "as no Warlord may have more than one ’Uge Ship, which counts as a skwadron by itself.", 375),
    uge2=_cite("A Warlord must have two kroozers in order to take a “Uge ship, meaning the Warlord must have at least "
               "one extra re-roll to do so.", 375),
    hulk1=_cite("A Warlord leading a Space Hulk may only lead it and no other ships, but he is not required to take any "
                "extra re-rolls to do so if it is not desired.", 375),
    hulk2=_cite("One of your Warlords must be embarked on it, which by itself counts as all the skwadrons that Warlord "
                "can have (including a tiddla skwadron), regardless of how many re-rolls the Warlord has.", 374),
    clan=_cite("A Warlord and his skwadrons may only be from one clan, but as many different clans as desired can be "
               "in a single fleet.", 371),
    clan_sq=_cite("If taken, every capital ship in the skwadron must separately take and pay for the clan upgrade, not "
                  "just individual ships.", 371),
    # ChatGPT audit RAW-04 (27.10.2026): a Snakebite Warlord's capital ship skwadrons are hulks or Roks, whether
    # or not they buy the clan (being of a clan does not oblige buying it, p.371, but the clan is the Warlord's)
    snake_clan="^snakebites",
    snake=_cite("Snakebite capital ship skwadrons can only use space hulks or roks – no other kind of capital "
                "ship skwadrons are permitted to bear the clan colours.", 371),
    gub=_cite("A Warlord may choose for his own ship or escort skwadron one upgrade from the Gubbins list for every "
              "re-roll he has at its listed cost.", 374),
    # the Blood Axe Warlord's ship's Imperial Navy refit (user 29.10.2026, a row of its own: upgrades.py EXTRA)
    refit_re="^imperial navy refit, rolled randomly", axe_clan="^blood axes",
    refit=_cite("The Warlord\u2019s ship may take one refit from the Imperial Navy refit table (rolled randomly) "
                "for +20 points.", 371),
    # J232: a skwadron belongs to one Warlord and is not split (p.375)
    split=_cite("Each skwadron must be fielded with the number of ships chosen for it in this list; you can\u2019t "
                "split up skwadrons or add more ships to them.", 375))
_CZL["sqx"] = [dict(sec="^big ship skwadron$", min=1, max=2, only=True, name="kroozers",
                    cite=_cite("1-2 Kroozers, chosen from the following list:", 374)),
                # J232 (the user 24.10.2026 asked whether a Rok skwadron works like a capital ship, and to fix it):
                # a Rok skwadron is 1-4 Roks as a Big ship skwadron is 1-2 kroozers. The book prints
                # the size as the section heading (p.374 "Rok skwadron / 1-4 Roks"), so the sentence is the heading.
                dict(sec="^roks$", min=1, max=4, only=True, name="Roks", cite=_cite("1\u20134 Roks", 374))]
# The Warlord on the dearest ship under his OWN command (p.374), not of the whole fleet.
_CZL["place"] = [dict(cmd="^ork warlord", dearest=dict(own=True, cite=_cite(
    "He must be embarked on the most expensive ship under his own command (as opposed to the whole fleet), even if it "
    "is an escort - annotate which one it is.", 374)))]
# esq (user 27.10.2026, after the Clanz audit): lists whose rules count ESCORT SQUADRONS - p.184 "A single
# squadron of 2-6 ... may accompany each Rogue Trader capital ship", p.187 "at least one squadron of escort-sized
# cargo ships", p.189 "At least one squadron of 3-6 escort vessels ... for each cruiser", p.457 "a single squadron
# of up to six Xenos escorts", p.487 "one squadron of up to six Tau or Rogue Trader escorts". There the squadrons
# are the player's: the same letter (sq) is one squadron in any mix, a card without one is a squadron by itself,
# and the size and the counting rules read the same squadrons (domain.js escortSquadronKeys). Elsewhere a short
# card still joins a mixed squadron by itself (p.13), since nothing counts the squadrons there.
# sep: sections whose escorts may not share a squadron (p.487).
_ESQ = ("Rogue Traders", "Rogue Traders — Exploration", "Rogue Traders — Pirates and Wolf Packs",
        "Tau — Commerce Protection", "Demiurg — War Host")
for _nm in _ESQ:
    _p18_list(_nm)["esq"] = dict()
_p18_list("Demiurg — War Host")["esq"] = dict(
    sep=["^tau escorts$", "^nicassar escorts$", "^rogue trader escorts$"],
    sep_cite=_cite("Tau, Nicassar and Rogue Trader escorts may not be mixed in the same squadrons.", 487))
for _re in _p18_list("Demiurg — War Host")["esq"]["sep"]:
    assert sum(1 for _s in _p18_list("Demiurg — War Host")["secs"] if re.search(_re, _s["t"].strip(), re.I)) == 1, _re
_WAL = _p18_list("Orks — Waaagh!")
_WAL["sqx"] = [dict(sec="^ork roks$", min=2, max=4, only=True, name="Roks", cite=_cite(
    "Ork Roks may be squadroned with up to three other Roks (total squadron size of four), but not with any other "
    "vessels.", 369))]
_nsq = 0
for _L in lists_out:
    if _L["nm"] in ("Chaos — Black Crusade", "Chaos — Tzeentch", "Chaos — Nurgle", "Chaos — Khorne", "Chaos — Slaanesh"):
        _L["sq_noup"] = [dict(re="^daemonship", cite=_cite("Daemonships cannot be used in squadrons.", 237))]
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
# J232: the section heading ("1-4 Roks", p.374) is the book's text, although the extraction does not take it into the section's text
_RAW_HEADS = set(_text_key(_s.get("head") or "") for _Lx in json.load(io.open(os.path.join(_HERE, "lists_raw.json"), encoding="utf-8"))
                 for _s in _Lx.get("sections") or [])
for _L in lists_out:
    for _x in (_L.get("sqx") or []) + (_L.get("sq_noup") or []) + (_L.get("sq_need") or []):
        assert _text_key(_x["cite"]["s"]) in _all_text or _text_key(_x["cite"]["s"]) in _RAW_HEADS, \
            "J216: the sentence is not in the book's text: %s" % _x["cite"]["s"]
for _k, _c in _CZL["clanz"].items():
    if isinstance(_c, dict):
        assert _text_key(_c["s"]) in _all_text, "J216: the sentence is not in the book's text: %s" % _c["s"]
_sc = _p18_list("Demiurg — War Host")["esq"]["sep_cite"]["s"]
assert _text_key(_sc) in _all_text, "esq: the sentence is not in the book's text: %s" % _sc
print("J216: squadron exceptions on 2 lists (in Clanz kroozers and Roks, J232), the Daemonship ban on %d lists, the Clanz command" % _nsq)

# Zukov's Klaw is a Goff as part of its 210 points (p.383 "It is of the Goff Clan, ..."), so no clan row is
# buyable for it (row_texts.py, the Zukov limits) - and the user asked (27.10.2026) to see it in the upgrade list
# anyway: a locked free info row, as a battle barge's built-in Mark (chapters_marks.py, req + incl). Added here,
# after the Zukov limits, so it keeps its own nm condition; "(included)" keeps it apart from the buyable
# "Clan: Goffs (Black)" row, and the app's clan choice and clan prices skip incl rows.
from .ships import ships as _SHIPS
_ZK = [s for s in _SHIPS.values() if re.match(r"^zukov", s.get("nm", ""), re.I)]
assert len(_ZK) == 1, "Zukov's Klaw profiles: %d" % len(_ZK)
_ZK_S = ("It is of the Goff Clan, giving it both a +1 leadership modifier when attempting to ram and an additional "
         "+1 modifier during boarding actions.")
assert _text_key(_ZK_S) in _text_key(_ZK[0].get("sr") or ""), "Zukov's Goff sentence is not in its profile"
_czc = [s for s in _CZL["secs"] if re.search(_CZL["clanz"]["clan_sec"], s["t"].strip(), re.I)]
assert len(_czc) == 1
_czc[0]["ents"].append({"l": "Clan: Goffs (included)", "r": None, "p": 0, "a": 1, "u": 1, "mx": None, "nt": None,
                        "prose": 1, "cond": {"nm": "^zukov"}, "k": "up", "req": 1, "incl": 1,
                        "desc": _ZK_S, "src_page": 383})
print("Zukov's Klaw: the included Goffs as a locked info row")

# J224: the Waaagh! list's hulk Warlord pays +50 for Extra Power Fields
# (p.392). The row "Extra Power Fields (Space Hulk)" comes from upgrades.py;
# resolveFleet compares the row the Warlord took with the ship he is aboard (J215):
# on a hulk the +25 row is red, elsewhere the +50 row. The placement does not change the price
# (J8), it is a check.
_WAL["hulk_pf"] = dict(
    cmd="^ork warlord$", sec="^warlord$", row="^Extra Power Fields$",
    hulk_row=r"^Extra Power Fields \(Space Hulk\)$", ship="^ork hulk$",
    cite=_cite("Extra Powerfields costs +50 pts instead of +25.", 392))
assert sum(1 for _s in _WAL["secs"] if re.search(_WAL["hulk_pf"]["sec"], _s["t"].strip(), re.I)) == 1
for _k in ("row", "hulk_row"):
    assert sum(1 for _s in _WAL["secs"] if re.search(_WAL["hulk_pf"]["sec"], _s["t"].strip(), re.I)
               for _e in _s["ents"] if re.search(_WAL["hulk_pf"][_k], str(_e["l"]))) == 1, _k
# The sentence is from the Ork hulk profile's continuation page (p.392, the WARLORDS part), not
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
# (p.99, p.155) - open interpretation T54.
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
# p.317: the Void Stalker in an Iyanden fleet with conditions.
_IY = _p18_list("Eldar — Iyanden Craftworld")
_VS_S = ("Up to one Void Stalker may be taken in the fleet as long as the fleet is at least 1000 points and at "
         "least three Corsair Eldar cruisers and / or light cruisers are already present in the fleet.")
assert _text_key(_VS_S) in _all_text
_IY["borrow_cond"] = [dict(re="^void stalker", max=1, min_worth=1000, label="Void Stalker in an Iyanden fleet",
                           need=dict(n=3, list_re="^Eldar Corsairs", type_re="cruiser", what="Corsair cruisers"),
                           cite=_cite(_VS_S, 317))]
print("J217: Bakka's AdMech cruisers 7, mercenary sections %d, the Void Stalker condition" % _nmerc)

# J218 (check yourself phase 6B): hull choices and RT escorts.
# p.184 CAPITAL SHIPS: "If a second Rogue Trader cruiser is taken, it may be
# any Rogue Trader cruiser variant listed on the Exploration Fleet List." The
# variants go into the RT list's CAPITAL SHIPS section as rows "Rogue Trader
# cruiser - X class hull" at Exploration's prices (p.186). v0.36 also printed a
# box ROGUE TRADER "CRUISERS" ("Any cruiser hull allowed in the Rogue Trader,
# Exploration or Wolf Pack fleet list may be used and counts fully as a Rogue
# Trader cruiser"), which added the Wolf Pack's cruisers and made the second
# cruiser rule an open interpretation (T55); v0.40 removed the box, so the
# Wolf Pack hulls are gone and a variant is the second cruiser onwards.
# Light cruisers are not a cruiser variant: Exploration counts them
# separately ("Rogue Trader cruisers & Endeavours").
_RT0 = _p18_list("Rogue Traders")
_rtcap = _RT0["secs"][_p18_sec(_RT0, "CAPITAL SHIPS")]
_EXL = _p18_list("Rogue Traders — Exploration")
_seen = set(["180"])
_rth = []
for _e in _EXL["secs"][_p18_sec(_EXL, "CAPITAL SHIPS")]["ents"]:
    _sh = ships.get(str(_e.get("r")))
    if _e.get("k") != "unit" or not _sh or str(_e["r"]) in _seen:
        continue
    if not re.match(r"^cruiser", str(_sh.get("ty", "")), re.I) or re.search(r"light cruiser", _e["l"], re.I):
        continue
    _seen.add(str(_e["r"]))
    _n = _copy.deepcopy(_e)
    _cls = re.sub(r"\s+cruiser$", "", _e["l"], flags=re.I) if re.search(r"class cruiser$", _e["l"], re.I) else _e["l"]
    _n["l"] = "Rogue Trader cruiser — " + _cls + " hull"
    _n["src_page"] = 184
    _n["nt"] = "A Rogue Trader cruiser variant (Fleets p. 184); Exploration list price."
    _rtcap["ents"].append(_n)
    _rth.append(_n["l"])
assert len(_rth) == 4, "J218: RT hulls (Lunar, Carnage, Tyrant, Murder) %s" % _rth
_RT_S1 = "If a second Rogue Trader cruiser is taken, it may be any Rogue Trader cruiser variant listed on the Exploration Fleet List."
assert _text_key(_RT_S1) in _all_text
_RT0["rt_hulls"] = dict(hull="^rogue trader cruiser — ", all="^rogue trader cruiser", cite=_cite(_RT_S1, 184),
                        strict=1)
# T56 (v0.36 p.138: "it can be any Imperial cruiser-class vessel") is gone:
# v0.40 removed the sentence, and p.148 places the Inquisitor Lord on the most
# expensive ship when there is no Inquisitorial Cruiser or Blackship (_PL_INQ).
_ninq = 0
# p.149 RESERVES AND ALLIES (an IN/AdMech fleet led by an Inquisitor): "If taken, a
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
        _n["src_page"] = 50 if "Bakka" in _nm else 149
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
                        cite=_cite(_BK_S, 50) if _bk else _cite(_INQ_S, 149))
    _nrte += 1
print("J218: RT hulls %d, RT escorts on %d lists" % (len(_rth), _nrte))

# J219 (check yourself phase 6C): Exploration p.187. The auxiliary ships are
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
_EX["aux"] = dict(never=["orks", "dark eldar", "necrons", "tyranids"], cite_one=_cite(_AUX1, 187),
                  cite_never=_cite(_AUX2, 187))
_EX["ally_bb"] = dict(cite=_cite(_ABB, 187))
# p.187's own sentence beside the allies matrix: the same ban, on the book's page.
assert _EX.get("ally_xenos") and _EX["ally_xenos"]["when"] == "space marines"
_EX["ally_xenos"]["src"] = _AUX3 + " (Fleets p. 187) " + _EX["ally_xenos"]["src"]
print("J219: Exploration's auxiliary ships and the allied battleship")

# J220 (check yourself phase 6D). p.371 CLAN UPGRADES: "A Blood Axe tiddla
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
            _n["src_page"] = 371
            _ba_ents.append(_n)
assert len(_ba_ents) == 9, [e["l"] for e in _ba_ents]
_pd = [i for i, s in enumerate(_CZL["secs"]) if s.get("ct") == "defence"]
assert _pd == [len(_CZL["secs"]) - 1], _pd
_shift_section_refs(_CZL, _pd[0])
_CZL["secs"].insert(_pd[0], dict(t="BLOOD AXE COMMANDEERED ESCORTS", text=[_BA_S], ents=_ba_ents, rules=[],
                                 ct="access", noroute=1))
_CZL["bloodaxe"] = dict(sec="^BLOOD AXE COMMANDEERED ESCORTS$", clan="^clan: blood axes", min=6, max=3,
                        cite=_cite(_BA_S, 371))
# p.454/456: "Any ship equipped with Wardens can only be equipped with Wardens
# and may not have other hook-transported escorts." At fleet level: the Wardens
# and Orcas must be divisible over different ships by their hooks (sh.hk).
_WD_S = ("Any ship equipped with Wardens can only be equipped with Wardens and may not have other hook-transported "
         "escorts.")
assert _text_key(_WD_S) in _all_text
for _nm in ("Tau — Merchant Fleet", "Tau — Commerce Protection"):
    _p18_list(_nm)["warden_only"] = dict(cite=_cite(_WD_S, 454))
print("J220: Blood Axe commandeered escorts %d, Warden split on 2 lists" % len(_ba_ents))

# J221 p.187: "Reserves and Allied vessels do not have access to the Veteran
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
_EX["ally_cmd"] = dict(re=_SC_RE, max=1, cite=_cite(_SC_S, 187))
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
            src="Battlefleet Gothic: Remastered — Fleets Book WiP v0.40 (29 Oct 2026) "
                "and Rulebook v1.11 (13 Aug 2026)",
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
