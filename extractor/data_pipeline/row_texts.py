# -*- coding: utf-8 -*-
"""Stage 8 of the data pipeline (extractor/build_data.py): row texts.

The stages run in file order when the entry imports the last one; each
imports what it uses from the stages before it. One pipeline script
until 26.10.2026, split by stage for reading, not for reuse.
"""
import json, io, re, collections, os, sys
import upgrades
import swaps, copy
from .inputs import re
from .row_classes import Lx, _cond, _f, _frag, _hit, _i, _lab, _o, _ol, _p, _pg, _sec, _sh, _sr, _t, _x, e, k, r, s, x
from .rule_detectors import KEEP_TEXT
from .section_guard import lists_out
from .ships import _k, o, ships
# For-information sentences the book prints under the OPTIONS heading but that are not
# choices (spot check 8 rows 36 and 48): "... already included in its
# profile" (p.196, 198), "... see the special ability above" (p.197) and "If
# the torpedo refit is taken, the ship does not have to be modified ..."
# (p.160). On the card they were tickable options and blocked a finished PTS;
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
_free_hits = []
for _sh in ships.values():
    for _o in _sh.get("ol") or []:
        if _o.get("c") is None and _FREE_OPT.search(_o.get("t") or ""):
            _o["c"] = 0
            _free_hits.append("p.%s %s" % (_sh["pg"], _o["t"][:40]))
# v0.40: 18 = the 16 of v0.36, the three new Adeptus Mechanicus light cruiser
# profiles (p.135-137) and minus the escort drone fire ship, now +5 pts (p.437).
assert len(_free_hits) == 18, "18 free options expected, found %d: %s" % (len(_free_hits), _free_hits)

# A permanent option ID (P1-8a, apps/registry/docs/save-format.md): page + sha1(normalised
# text)[:8]. Made from the data, not by hand; a save refers to an option by it and not
# by index, so a new version of the book can move options without breaking
# saves. domain.js's normOptText does the same normalisation.
import hashlib as _hashlib, re as _re
def _opt_id(pgkey, text):
    n = _re.sub(r"[^a-z0-9]", "", str(text or "").lower())   # the whole text: the two options of p.257 differ only from the 90th character
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
# The ids of a previous book version whose option text changed (option_aliases.json):
# o["was"] lets a saved fleet find the option (legacy.js optionIndex). Each
# alias must find its option, and an old id must not be a live one.
_ALIAS = json.load(io.open(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                                        "option_aliases.json"), encoding="utf-8"))["was"]
_live = {_o["id"] for _sh in ships.values() for _o in _sh.get("ol") or []}
_al_hit = 0
for _sh in ships.values():
    for _o in _sh.get("ol") or []:
        if _o["id"] in _ALIAS:
            assert not set(_ALIAS[_o["id"]]) & _live, _ALIAS[_o["id"]]
            _o["was"] = list(_ALIAS[_o["id"]])
            _al_hit += 1
assert _al_hit == len(_ALIAS), "option_aliases.json: %d of %d new ids found" % (_al_hit, len(_ALIAS))

for _fx in KEEP_TEXT:
    assert _fx.get("_used"), "KEEP_TEXT did not hit: %r" % _fx
# A torpedo swap without a speed in the sentence: swaps.py gives 30 cm (Rulebook
# p.76; every Imperial/Chaos torpedo row is 30 cm). Guard: no
# swap row may be left with a "see text" range.
_seetext = [(k, r) for k, sh in ships.items() for o in sh.get("ol") or [] if o.get("sw")
            for r in o["sw"]["t"] if r[1] == "see text"]
assert not _seetext, "a swap row without a range: %s" % _seetext[:4]

# The narrative sentences of a profile's SPECIAL text stay in the book: the card repeats
# rules, not story. Hammer (Fleets p. 376): three sentences about Uzog
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
# as its description the next paragraph's lead (p.367, 368, 374), and 17 Chaos
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

# Zukov's Klaw (p.383): "It is of the Goff Clan", "It is upgraded to be an
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
# v0.40: the list's Emperor and Oberon are the Mechanicus profiles (p.128, p.130),
# which have no Shark option; the check stays in case one comes back.
assert _optno == 0, "Mechanicus list Shark options: %d (v0.40 has none)" % _optno

# Grey Knights p.154: "An Inquisitor Lord gets one re-roll, which may be used
# for any ship in the fleet. A second re-roll can be purchased for +25
# points." also concerns the Ordo Malleus Inquisitor Lord, the section's
# other row; the extra re-roll attached only to the row before (spot check
# 10 row 46).
_gk_rr = 0
for Lx in lists_out:
    if Lx["nm"] != "Grey Knights":
        continue
    for _si, s in enumerate(Lx["secs"]):
        if s["t"].strip() != "Inquisitor Lord":
            continue
        _cmds = [[_si, _ei] for _ei, e in enumerate(s["ents"]) if e.get("k") == "cmd"]
        assert len(_cmds) == 2, "Grey Knights Inquisitor Lord: commanders %d" % len(_cmds)
        for e in s["ents"]:
            if e.get("k") == "up" and re.search(r"extra re-roll", str(e["l"]), re.I):
                e["at"] = _cmds
                _gk_rr += 1
assert _gk_rr == 1, "Grey Knights: 1 extra re-roll row expected, found %d" % _gk_rr

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

# p.374 Da Ork Clanz, the WARLORD box: AFTER the price rows ("One extra re-roll +20",
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
