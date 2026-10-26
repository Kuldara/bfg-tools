# -*- coding: utf-8 -*-
"""Stage 15 of the data pipeline (extractor/build_data.py): chapters marks.

The stages run in file order when the entry imports the last one; each
imports what it uses from the stages before it. One pipeline script
until 26.10.2026, split by stage for reading, not for reuse.
"""
import json, io, re, collections, os, sys
import upgrades
import swaps, copy
from .inputs import _HERE, io, json, os, re, upgrades
from .profile_types import _m, x
from .races import _g, _pg
from .row_texts import _re
from .section_guard import lists_out, raw_pages, raw_rules
from .section_kinds import _L, _cls, _e, _r, _s, _sec, _sh, _t, data
from .ships import ships
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
