# -*- coding: utf-8 -*-
"""Stage 7 of the data pipeline (extractor/build_data.py): row classes.

The stages run in file order when the entry imports the last one; each
imports what it uses from the stages before it. One pipeline script
until 26.10.2026, split by stage for reading, not for reuse.
"""
import json, io, re, collections, os, sys
import upgrades
import swaps, copy
from .inputs import L, OPT_EFFECTS, SHIP_FL_FIX, _FL_FIXED, _HERE, _OPT_EFFECT_HITS, _nkey, collections, copy, io, json, os, re, upgrades
from .page_refs import Lx, _pg, _sh, _sr, e, k, sec, t, w
from .rule_detectors import DROP_SECS, ENTRY_ADDS, ENTRY_LIMITS, HEAD_IS_SQUADRON, LORE_SECTIONS, PRICE_HEAD, RULE_PICKS, _HEAD_SQ_USED, pick_secs
from .section_guard import _INHERITED, _OWN_HITS, _OWN_REOWNED, _PICKS_OK, a, check_section_names, fx, i, keep, lists_out, m, own, r, raw_pages, raw_rules, s, secs, x
from .ships import _TURNS_FIXED, o, ships
from .weapon_menu import _r, _rows
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
    # p.309: "Ghostships may not be armed with launch bays", "may not contain
    # Aspect Warrior fighting crews"; p.316 "Any capital ship ... may be
    # upgraded to a Ghostship". Bays offered = bays in the armament.
    ("Eldar — Iyanden Craftworld", "Ghostship",
     dict(cap=1, no=r"launch bay", noup=r"aspect warrior host")),
    # p.316 "Any capital ship in the fleet may be equipped with Aspect
    # Warriors"; p.309 not for a Ghostship.
    ("Eldar — Iyanden Craftworld", "Aspect Warrior Host",
     # p.327: the Flame of Asuryan's crew "count as an Aspect Warrior
     # fighting crew" already in the price (spot check 12 row 34).
     dict(cap=1, noup=r"^ghostship", nmno=r"^flame of asuryan")),
]
for _ln, _lab, _cond in UP_CONDS:
    _hits = [e for L in lists_out if L["nm"] == _ln
             for s in L["secs"] for e in s["ents"] if e.get("k") == "up" and e["l"] == _lab]
    assert len(_hits) == 1, "UP_CONDS: %s / %s hit %d times" % (_ln, _lab, len(_hits))
    _hits[0]["cond"] = dict(_hits[0].get("cond") or {}, **_cond)

# "Auxiliary vessels (pg. 201) ... varies" is a list rule (half of the escorts
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

# p.237: "Any Daemon ship may have a single Mark of Chaos with the same
# effects and cost in points as described on pg. 242." The Black Crusade list's
# DAEMON SHIPS section does not repeat the sentence, so the rows are added by hand at the p.242
# prices; condition: a Daemon ship taken. Nurgle's Mark +1 Damage Point (p.242).
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
                                       src_page=237, cond=dict(cap=1, up=r"^daemonship:"),
                                       nt="Fleets pg. 237: any Daemon ship may have a single Mark of Chaos "
                                          "at the cost on pg. 242."), **_extra))

# p.244: "Remember, a ship with a Chaos Space Marine crew may have a Mark of
# Chaos, even if a Warmaster or Lord does not captain it, but is subject to the
# restriction on pg. 235." The list's crew has no named legion, so
# the p.235 Black Legion row ("May have any one Mark"); prices from the p.244 Marks.
# Spot check 11, rows 15 and 88.
_BC_CREW_MARKS = [("The Mark of Slaanesh", 25, {}), ("The Mark of Khorne", 20, {}),
                  ("The Mark of Tzeentch", 25, {}), ("The Mark of Nurgle", 35, dict(mod=dict(hp=1)))]
_bccrew = [s for s in _bc[0]["secs"] if s["t"].strip().upper() == "CHAOS SPACE MARINE CREWS"]
assert len(_bccrew) == 1, "Black Crusade: the CHAOS SPACE MARINE CREWS section is not found exactly once"
for _lab, _p, _extra in _BC_CREW_MARKS:
    assert not any(e["l"] == _lab for e in _bccrew[0]["ents"]), "Black Crusade CSM CREWS: %s already exists" % _lab
    _bccrew[0]["ents"].append(dict(dict(l=_lab, r=None, p=_p, a=1, u=1, mx=None, k="up", grp="crewmark",
                                        src_page=244, cond=dict(cap=1, up=r"^chaos space marine crew$"),
                                        nt="Fleets pg. 244: a ship with a Chaos Space Marine crew may have "
                                           "one Mark of Chaos, subject to its Legion (pg. 235)."), **_extra))

# Narrative and scenario sentences off the commander card's section text, which
# RULEY lets through ("must", "only"). The sentence is removed from the text and
# the owner table at the same place. Exactly one hit per sentence.
DROP_LIST_TEXT = [
    # p.150: the Istvaanists and the Xeno Hybrists are narrative.
    ("The Emperor's Inquisition", "ORDO XENOS INQUISITORS", "While Inquisitors of this Ordo know they must be fully cognizant"),
    # p.151: when an inquisitor is called is narrative; the following
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
    r"^Source page reference is wrong:",
    r"^The book's pg\. \d+ has no stat profile for this entry;",
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
# which is already included in the cost" (p.249, 251, 253). Tzeentch and
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
assert _TURNS_FIXED[0] == 1, "TURNS without a degree sign: %d (expected 1, p.191)" % _TURNS_FIXED[0]

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

# --- item 7, batch 7: Lite Kroozer p.385 - one option, two alternatives -----
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

# --- item 7, batch 7: RT Exploration p.190 - "no special variants" ---------
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


# J30 p.188: "A human pirate fleet may have up to one cruiser for every 500
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
# p.189: "At least one squadron of 3-6 escort vessels must be included for
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

# J31 p.207: "Additionally, up to four ships in a Rogue Trader or pirate fleet
# may be Stryxis Caravan Vessels, rolling for leadership normally. They do not
# count as cruisers against their respective fleet lists, but they may not use
# any fleet re-rolls." p.206: 80 pts. A section of its own: not counted with the cruisers.
_STRYX_SRC = ("Additionally, up to four ships in a Rogue Trader or pirate fleet may be Stryxis Caravan Vessels, "
              "rolling for leadership normally. They do not count as cruisers against their respective fleet lists, "
              "but they may not use any fleet re-rolls.")
for _nm in ("Rogue Traders", "Rogue Traders \u2014 Exploration", "Rogue Traders \u2014 Pirates and Wolf Packs"):
    _L = _p18_list(_nm)
    assert not any(e.get("r") == 196 for x in _L["secs"] for e in x["ents"]), "%s: Stryxis already exists" % _nm
    _L["secs"].append(dict(t="STRYXIS CARAVAN VESSELS", rules=[], text=[_STRYX_SRC],
                           ents=[_p18_unit("Stryxis Caravan Vessel", 196, 80, 196, mx=4)]))

# J29 p.286: "Only one Activated Blackstone Fortress may be fielded for every
# FULL 750 points of other ships in a Chaos fleet. No more than three may be
# taken." The Chaos lists' menus do not name it, but the profile allows it in
# a Chaos fleet and p.290 assumes it can be chosen. The Space Hulk exclusion
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
# p.286: "It has no crew and so does not add a D6 to its boarding score during
# a boarding action." A Chaos Space Marine crew ("Any capital ship can be
# designated as having a Chaos Space Marine crew", p.244) does not apply to it.
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
    assert _need in _bs["sr"], "p.286: the expected passage is missing: %r" % _need
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
# J33 p.392: "Hulks cannot take any upgrade that improves Boarding Value,
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
                    # p.246 "The vessel ... gains +1 re-roll", p.242 "The Chaos
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
                # Xenos p.151: "The ship adds +1 to its leadership (max. 10)")
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
            # turn" p.241). Only rows acknowledged in the reference with their pages.
            _q = dict((k, _r["rerolls_" + k]) for k in ("scope", "unit")
                      if _r is not None and _r.get("rerolls_" + k))
            if _q:
                # The scope may also concern only a bought re-roll: Chaos Lord
                # "which he can use for his own ship or squadron only" (p.244).
                _q["pg"] = _r["page"]
                _e["rrq"] = _q
                _rrq.append("%s / %s" % (_L["nm"], _e["l"]))
            _cmd_ld[_ld["kind"] if _ld else "none"] += 1
assert not _cmd_missing, "a commander has no leadership (record it in reference/commanders.json): %s" % _cmd_missing
print("commanders %d: Ld %s; re-roll rows %d" % (_cmd_n, _cmd_ld, _rr_rows))
# Veteran Captain p.38, Veteran Rogue Trader p.184 and p.186, Farseers p.316,
# Clanz Warlord p.374; review 5.10.2026: Pirate Captain p.188 and the Chaos
# Lords p.244, 246, 248, 250, 252 (the scope of a bought re-roll). Abaddon's
# "per turn" (p.241) is set where his section is built (races.py, J162).
assert len(_rrq) == 11, "11 re-roll scopes expected, found %d: %s" % (len(_rrq), _rrq)

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

# p.260 Scion of Prospero: "This ship bears the Mark of Tzeentch as part of
# its point cost" (Mark: "gains +1 re-roll", p.246) and "The ship is gifted
# with an additional re-roll added to that from the Mark of Tzeentch" -
# the ship has two re-rolls of its own and they are included in the 450 points.
# In the profile they are only sentences; rr turns them into boxes (domain.js
# shipRerolls). Review 5.10.2026.
_scion = ships["258"]
assert "SCION OF PROSPERO" in _scion["nm"].upper() and "additional re-" in json.dumps(_scion), "p.260 is not the Scion of Prospero or the Vagaries of Fate sentence is missing"
assert "rr" not in _scion
_scion["rr"] = 2

# The fleet's own re-roll without a commander (user 5.10.2026: a re-roll included in
# the price is always stated visibly). "The fleet gets one re-roll and
# can purchase extra re-rolls at the cost shown" - Necrons p.406, Demiurg
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
assert len(_frr) == 2 and any("Necrons" in x and "406" in x and "only" not in x for x in _frr) \
    and any("Demiurg" in x and "486" in x and "Demiurg vessels only" in x for x in _frr), \
    "the fleet's own re-roll: Necrons p.406 and Demiurg p.486 expected, found %s" % _frr
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

# p.194 Xenos Vessel: "each Xenos vessel also has one selected xenotech
# system as described in the Rogue Trader special rules. This system does
# not cost extra points and may be selected by the owning player for free"
# - the p.185 table as six free choices, one per ship. The named
# variants (p.195-198) have their own in the profile already. Spot check 5, row 10.
if "184" in ships:
    _xv = ships["184"]
    assert not _xv.get("ol"), "Xenos Vessel p.194: an empty option list expected"
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

# p.378 Dethdeala: "The rules for the bombardment cannon can be found on
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

# p.191 Endeavour: "Instead of the Endeavour, Rogue Traders may use a
# lance-armed Dauntless light cruiser for +15 points ... This is already
# reflected in the point cost in the fleet list." A list note, not the ship's
# equipment: the Dauntless is its own row (p.184, 125 pts). The option is removed, so that
# the card does not offer a +15 pts tick without an effect. Spot check 4, row 81.
DROP_OPTS = [("181", "Instead of the Endeavour, Rogue Traders may use a lance-armed Dauntless"),
             # p.190: the same kind - a note of the Exploration list (Lunar/Tyrant/
             # Carnage/Murder as their own rows), not equipment of the Rogue Trader Cruiser.
             # The sentence mentions the Nova Cannon and brought its rule to the card.
             # Spot check 5 (10.9.2026), row 51.
             ("180", "Rogue Trader cruisers in an Exploration fleet may also be of the following")]
for _pg, _frag in DROP_OPTS:
    _ol = ships[_pg]["ol"]
    _keep = [o for o in _ol if _frag not in o["t"]]
    assert len(_keep) == len(_ol) - 1, "DROP_OPTS: p.%s %r hit %d times" % (_pg, _frag, len(_ol) - len(_keep))
    ships[_pg]["ol"] = _keep
