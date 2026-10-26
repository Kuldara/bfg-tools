# -*- coding: utf-8 -*-
"""Stage 6 of the data pipeline (extractor/build_data.py): page refs.

The stages run in file order when the entry imports the last one; each
imports what it uses from the stages before it. One pipeline script
until 26.10.2026, split by stage for reading, not for reuse.
"""
import json, io, re, collections, os, sys
import upgrades
import swaps, copy
from .inputs import copy, re, swaps
from .section_guard import Lx, _sh, e, k, lists_out, p, sec
from .ships import TAU_CONFIGS, XENOS_SOURCE, XENOS_VARIANTS, key, ships
from .weapon_menu import _pg
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
