# -*- coding: utf-8 -*-
"""Stage 10 of the data pipeline (extractor/build_data.py): inquisition allies.

The stages run in file order when the entry imports the last one; each
imports what it uses from the stages before it. One pipeline script
until 26.10.2026, split by stage for reading, not for reuse.
"""
import json, io, re, collections, os, sys
import upgrades
import swaps, copy
from .inputs import re
from .profile_types import _L, _e, _hit, _i, _nm, _r, _x, e, r, x
from .row_classes import _p18_list, _p18_sec, _p18_unit, _q, _text_key, add_text, i, t
from .row_texts import _cmds, _p, _row
from .ships import o, ships
# --- 1.1 phase 4: the Inquisition in the host fleet (Fleets p.148) -----------
# "The Inquisition has no fleet list on its own. Instead, there are various
# ways to add an Inquisitor or Inquisitorial ships to the Imperial factions."
#
# In the app the Inquisition is a list of its own (saves and cards work,
# decision T29), but the book's way is to attach it to the host fleet.
# This adds an attachment section to the eight lists the book names: "any
# Imperial Navy, Space Marine or Adeptus Mechanicus fleet".
#
# The Grey Knights Battle barge is NOT included: it needs an Ordo Malleus
# inquisitor (p.148, p.155), which these lists' commander sections do not
# have. It stays on the Grey Knights list, where the condition is modelled (J83).
_INQ_LORD = ("Any Imperial or Space Marine fleet 750 points or greater may be "
             "led by an Inquisitor Lord.")
_INQ_CRUISER = ("Any Imperial or Space Marine fleet may include a single "
                "Inquisitorial Cruiser in the fleet, which takes the place of a "
                "battlecruiser or strike cruiser in the fleet.")
_INQ_BLACK = ("A fleet may include a single Blackship, which as a special "
              "vessel does not count toward or against other ship limits in the "
              "fleet.")
_INQ_GK = ("If an Inquisitor Lord is leading the fleet, up to one Grey Knights "
           "Strike Cruiser may be taken for every 500 points in the fleet.")
_INQ_INTRO = ("A single Inquisitorial cruiser led by an Inquisitor can be taken "
              "as reserves by any Imperial Navy, Space Marine or Adeptus "
              "Mechanicus fleet; or an Inquisitor and his retinue may be "
              "embarked on a single Rogue Trader cruiser.")
_INQ_RR = ("An Inquisitor Lord gets one re-roll, which may be used for any ship in "
           "the fleet.")
_INQ_RR2 = "A second re-roll can be purchased for +25 points."
# J148 (a user report 25.9.): the Inquisitorial Cruiser "takes the place of a
# battlecruiser or strike cruiser in the fleet" (p.148), and the Blackship is the only
# Inquisition ship that "does not count toward or against other ship limits"
# - the exception would be empty unless the others counted. The Grey Knights Strike Cruiser
# is a cruiser, and p.14: "the restrictions on maximum and minimum numbers of
# ships are determined for the fleet as a whole, regardless of whether they
# were purchased from the list or as reserves". The attachment section's rows would
# otherwise not count towards the host's limits at all (matches() counts its own row only
# in its own section), so picks are added as for the renegades (J141) and
# the Ordo Malleus reserves (J144).
_INQ_CRU_RE = "^inquisitorial cruiser"
_INQ_GKSC_RE = "^grey knights strike cruiser"
def _inq_limits(L, inq):
    t = [x["t"].strip().lower() for x in L["secs"]]
    cru = t.index("cruisers") if "cruisers" in t else None
    hits = []
    for _x in L["secs"]:
        for _r in _x.get("rules") or []:
            _cap = _r.get("max") if _r["kind"] == "section_count" else (
                _r.get("max_unmet") if _r["kind"] == "conditional_cap" else None)
            if cru is not None and _r.get("sec") == [cru] and _cap in (10, 12):
                # Imperial Navy 0-12: the GK strike cruiser is a cruiser, the Inquisitorial
                # Cruiser a battlecruiser and does not count here. Space Marine
                # 0-10 Cruisers: both take a strike cruiser's place.
                add = [dict(sec=inq, re=_INQ_GKSC_RE)]
                if _cap == 10:
                    add.append(dict(sec=inq, re=_INQ_CRU_RE))
                _r["pick"] = list(_r.get("pick") or [dict(sec=cru)]) + add
                hits.append("cru%d" % _cap)
            if _r["kind"] != "ratio":
                continue
            per = list(_r.get("per_pick") or [dict(sec=j) for j in (_r.get("per_sec") or [])])
            allow = list(_r.get("allow_pick") or [dict(sec=j) for j in (_r.get("allow_sec") or [])])
            if cru is None or not any(q["sec"] == cru and not q.get("re") for q in per):
                continue
            if any(t[q["sec"]] == "battlecruisers" or "battlecruiser|grand" in (q.get("re") or "") for q in allow):
                # "one battlecruiser for every two cruisers": the Inquisitorial Cruiser
                # takes a battlecruiser's place, the GK strike cruiser is a base cruiser.
                _r["allow_pick"] = allow + [dict(sec=inq, re=_INQ_CRU_RE)]
                _r["per_pick"] = per + [dict(sec=inq, re=_INQ_GKSC_RE)]
                hits.append("bc")
            else:
                # "one battleship for every three cruisers or battlecruisers":
                # both count towards the base.
                _r["per_pick"] = per + [dict(sec=inq, re=_INQ_GKSC_RE), dict(sec=inq, re=_INQ_CRU_RE)]
                hits.append("bs")
    return sorted(hits)
_INQ_HOSTS = ("Imperial Navy \u2014 Gothic Sector", "Imperial Navy \u2014 Bastion Fleets",
              "Imperial Navy \u2014 Armageddon Sector", "Imperial Navy \u2014 Bakka Sector",
              "Space Marines \u2014 Codex Astartes", "Space Marines \u2014 Crusade",
              "Space Marines \u2014 Dominion", "Adeptus Mechanicus \u2014 Explorator")
_inq_n = 0
_inq_at = {}
for _nm in _INQ_HOSTS:
    _L = _p18_list(_nm)
    assert not any(e.get("r") == 150 for x in _L["secs"] for e in x["ents"]), \
        "%s: the Inquisitorial Cruiser already exists" % _nm
    # The host's own COMMANDER section is the one the commander requirement concerns - not any
    # section with a k="cmd" row (on Bastion Fleets the Veteran
    # Captains is one too, but it is a per-ship upgrade).
    _cmds = set()
    for _x in _L["secs"]:
        for _r in (_x.get("rules") or []):
            if _r.get("kind") != "mandatory_at":
                continue
            for _q in (_r.get("pick") or []):
                _cmds.add(_q["sec"])
            for _j in (_r.get("sec") or []):
                _cmds.add(_j)
    _cmds = [i for i in sorted(_cmds)
             if any(e.get("k") == "cmd" for e in _L["secs"][i]["ents"])]
    assert len(_cmds) == 1, "%s: commander sections %s" % (_nm, _cmds)
    _cmd = _cmds[0]
    _i = len(_L["secs"])
    _ents = [
        dict(l="Inquisitor Lord (Ld 9)", r=None, p=75, src_page=148, a=1, mx=1,
             nt=None, k="cmd", ld=dict(kind="fixed", value=9), rr=1),
        _p18_unit("Inquisitorial Cruiser", 150, 270, 148, mx=1),
        _p18_unit("Inquisition Blackship", 148, 300, 148, mx=1),
        _p18_unit("Grey Knights Strike Cruiser", 151, 165, 148),
        # p.148: "A second re-roll can be purchased for +25 points." The same row
        # as on the Inquisition list; the target is the Lord's row (index 0). At the end,
        # so that old saves' rows keep their indexes.
        dict(l="One extra re-roll", r=None, p=25, src_page=148, a=1, u=1, mx=None,
             nt=None, prose=1, k="up", grp="rr", at=[[_i, 0]], rr=1),
    ]
    _rules = [
        dict(kind="allowed_at", points=750, ok=True, sec=[_i],
             label="Inquisitor Lord (from 750 pts)",
             pick=[dict(sec=_i, re="^inquisitor lord")], src=_INQ_LORD),
        dict(kind="per_points", each=1, per=500, ok=True, sec=[_i],
             label="Grey Knights Strike Cruisers (one per 500 pts, with an Inquisitor Lord)",
             pick=[dict(sec=_i, re="^grey knights strike cruiser")],
             cond_pick=[dict(sec=_i, re="^inquisitor lord")], src=_INQ_GK),
        # The Inquisitor Lord LEADS the fleet, so he is not taken besides the fleet's own
        # commander but instead of him - the same structure as the Eldar Hero
        # (p.314, a cap rule across two sections).
        dict(kind="cap", max=1, ok=True, sec=[_i],
             label="Fleet commander (the list's own or an Inquisitor Lord)",
             pick=[dict(sec=_cmd), dict(sec=_i, re="^inquisitor lord")],
             src=_INQ_LORD),
    ]
    _L["secs"].append(dict(t="THE INQUISITION", text=[_INQ_INTRO, _INQ_CRUISER,
                                                      _INQ_BLACK, _INQ_RR, _INQ_RR2],
                           ents=_ents, rules=_rules))
    _inq_at[_nm] = _i
    # The host's commander requirement is also met by the Inquisitor Lord.
    _md = [r for x in _L["secs"] for r in (x.get("rules") or [])
           if r.get("kind") == "mandatory_at"]
    for _r in _md:
        _pick = _r.get("pick") or [dict(sec=j) for j in (_r.get("sec") or [])]
        _r["pick"] = list(_pick) + [dict(sec=_i, re="^inquisitor lord")]
    _inq_n += 1
assert _inq_n == 8, _inq_n
print("Inquisition attached to %d host lists (p.148)" % _inq_n)


# --- 1.1 phase 4: Bastion Fleets' Chaos reserves (Fleets p.39) ---------------
# "However, since a reserve fleet also draws on very old or scarce vessels,
# you may also use your reserve choices to select any of the following Chaos
# vessels if you so wish." Five hulls by name, and the ratio is the book's general one:
# "These 'reserve' vessels are picked in the normal manner, so for every three
# vessels of a given type which you choose from the main fleet list, you may
# pick one vessel of that type from another Imperial list, or from the above
# selection of Chaos vessels (but not both)."
#
# The prices are not on p.39 at all; they are read from the Chaos lists, where they
# are the same on every list (Repulsive 230, Executor 210, Hades 200, Carnage
# 180, Murder 170). The variant ban p.39: "you cannot pick any of the ship
# class variants described since these are described for vessels who have
# already turned traitor" -> noopt.
_BAST_SRC = ("However, since a reserve fleet also draws on very old or scarce "
             "vessels, you may also use your reserve choices to select any of "
             "the following Chaos vessels if you so wish.")
_BAST_RATIO = ("These 'reserve' vessels are picked in the normal manner, so for "
               "every three vessels of a given type which you choose from the "
               "main fleet list, you may pick one vessel of that type from "
               "another Imperial list, or from the above selection of Chaos "
               "vessels (but not both).")
_BAST_NOVAR = ("Reserve vessels use all their normal rules and keep their "
               "particular ordnance types (i.e. Chaos ordnance is used on Chaos "
               "ships picked in a reserve fleet) but you cannot pick any of the "
               "ship class variants described since these are described for "
               "vessels who have already turned traitor and hence obviously no "
               "longer in Imperial service!")
_BAST = _p18_list("Imperial Navy \u2014 Bastion Fleets")
_bsec = _p18_sec(_BAST, "THE RESERVE FLEETS OF SEGMENTUM OBSCURUS")
assert not _BAST["secs"][_bsec]["ents"], "Bastion's reserve section already has rows"
_BAST["secs"][_bsec].setdefault("notes", []).append(
    "Page 39 names these five Chaos hulls but prints no prices; the builder "
    "uses each hull's price from the Chaos fleet lists.")
_BAST["secs"][_bsec]["ents"] = [
    # `nt` prints on the card's base row in the middle of English text,
    # so the builder's own note belongs in the section's Builder's notes channel.
    # A Finnish sentence was here, and it showed on the player's card.
    _p18_unit("Repulsive class grand cruiser", 269, 230, 39),
    _p18_unit("Executor class grand cruiser", 271, 210, 39),
    _p18_unit("Hades class heavy cruiser", 274, 200, 39),
    _p18_unit("Carnage class cruiser", 277, 180, 39),
    _p18_unit("Murder class cruiser", 279, 170, 39),
]
# The ban concerns only class variants, not every option (review
# 16.9.): p.12 defines a variant as ships that "mount different
# weaponry to its counterparts". The Repulsive's ancient targeting systems are
# the Bringer of Despair's armament and the Murder's FP4 + lances the Plagueclaw's;
# the Repulsive's third shield does not change the armament, so it stays choosable.
_BAST_VARIANT = {269: r"ancient targeting systems", 279: r"replace its Firepower 10 weapons batteries"}
for _e in _BAST["secs"][_bsec]["ents"]:
    if _e["r"] in _BAST_VARIANT:
        _hit = [o for o in (ships[str(_e["r"])].get("ol") or []) if re.search(_BAST_VARIANT[_e["r"]], o.get("t") or "", re.I)]
        assert len(_hit) == 1, "%s: variant options %d" % (_e["l"], len(_hit))
        _e["optno"] = _BAST_VARIANT[_e["r"]]
assert sum(1 for _e in _BAST["secs"][_bsec]["ents"] if _e.get("optno")) == 2
# The section already has the book's own extraction of the same sentences, so the curated ones
# are added only if they are missing (a finding of the review 14.9.2026).
add_text(_BAST["secs"][_bsec], [_BAST_SRC, _BAST_RATIO, _BAST_NOVAR])
print("Bastion's Chaos reserves added: %d hulls (p.39)"
      % len(_BAST["secs"][_bsec]["ents"]))


# --- J144: the Ordo Malleus inquisitor and Bastion's Chaos hulls (Fleets p.152)
# The user's decision 16.9.: done together with Strange happenings (J143).
#
# p.150: "The listed cost is added to that of the Inquisitor Lord, and its
# benefits apply to the ship they are embarked upon." The host lists had only
# the Inquisitor Lord (J104), so a "fleet led by an Ordo Malleus Inquisitor" was not
# possible. The Ordo Malleus row is added to five Imperial Navy and
# Adeptus Mechanicus hosts - the p.152 route concerns only them. It is not added to the Space
# Marine hosts: there Ordo Malleus would open the Grey Knights
# Battle barge (p.148), which by J83 is a matter of the Grey Knights list.
#
# p.152 Reserve/allies: "For no change in their cost, a fleet led by an Ordo
# Malleus Inquisitor may take as reserves any Chaos ship listed in the Bastion
# Fleet List" - five hulls from p.39 at the same prices. They go into the host's own
# reserve section (ct "reserve"), so they use the same 1:3 budget as
# other reserves and cannot be lent on (p.15). No section is added to Bastion:
# its own p.39 section already offers the same hulls without an inquisitor.
_OM_T = "ORDO MALLEUS INQUISITORS"
_OM_RES_T = "ORDO MALLEUS RESERVES"
_OM_ROUTE = ("An Imperial Navy or Adeptus Mechanicus fleet led by an Inquisitor "
             "that does not include Space Marine vessels has the following "
             "addition to its reserves and/or allies rules. For no change in their "
             "cost, a fleet led by an Ordo Malleus Inquisitor may take as reserves "
             "any Chaos ship listed in the Bastion Fleet List on pg. 39.")
# v0.40 adds what the fleet gives up: the Grey Knights contingent's bonuses
# and the Chaos opponent's free extras (text on the card, not modelled).
_OM_FREE = ("These vessels are free of the “Strange Happenings” special rule "
            "as long as the Inquisitor’s ship remains in play, but the fleet may "
            "not take any Grey Knights vessels, and the Inquisitor’s ship loses its "
            "Grey Knights contingent along with their leadership, boarding value and "
            "other bonuses. Likewise, Chaos opponents gain no benefits, as the Grey "
            "Knights are absent.")
_OM_HNR = ("Hit and Run attacks from this ship add +1 to their roll, and such "
           "attacks against this ship subtract -1 from their roll.")
# The Wards' limit (p.152). The extraction's sentence filter dropped this, so the card
# ended in "etc." without the limit, and a CSM-crewed ship's +boarding could have
# read as cancelled (review 16.9.).
_OM_CSM = ("Rules for Chaos Space Marines still apply normally, and any other special "
           "rules and effects such as the Forces of Chaos listed on pg. 239 "
           "remain unaffected.")
# p.150: the Ordo's price and benefits belong to the Inquisitor Lord's own ship.
# On a host list's card the Ordo row is its own commander card, so the sentence
# prints on it; on the Inquisition list it is already in section 13.
_OM_EMBARK = ("The listed cost is added to that of the Inquisitor Lord, and its "
              "benefits apply to the ship they are embarked upon.")
_IQL = _p18_list("The Emperor's Inquisition")
_iq_om = _IQL["secs"][_p18_sec(_IQL, _OM_T)]
assert [e["l"] for e in _iq_om["ents"]] == ["Ordo Malleus Inquisitor Lord (Ld 10)"], _iq_om["ents"]
assert len(_iq_om.get("own") or []) == len(_iq_om["text"]), "Ordo Malleus: own and text differ in length"
# The extraction lacked the p.152 Hit and Run sentence that Ordo Hereticus has
# (p.150). The book's sentence, added with its owner to both copies.
if not any(_text_key(_OM_HNR) in _text_key(t) for t in _iq_om["text"]):
    _iq_om["text"].insert(1, _OM_HNR)
    _iq_om["own"].insert(1, "Ordo Malleus Inquisitor Lord (Ld 10)")
if not any(_text_key(_OM_CSM) in _text_key(t) for t in _iq_om["text"]):
    _slaa = [i for i, t in enumerate(_iq_om["text"]) if t.startswith("Marks of Slaanesh")]
    assert len(_slaa) == 1, _slaa
    _iq_om["text"].insert(_slaa[0] + 1, _OM_CSM)
    _iq_om["own"].insert(_slaa[0] + 1, "Ordo Malleus Inquisitor Lord (Ld 10)")
_OM_HOSTS = ("Imperial Navy — Gothic Sector", "Imperial Navy — Bastion Fleets",
             "Imperial Navy — Armageddon Sector", "Imperial Navy — Bakka Sector",
             "Adeptus Mechanicus — Explorator")
_bast_rows = _BAST["secs"][_bsec]["ents"]
assert len(_bast_rows) == 5 and sum(1 for e in _bast_rows if e.get("optno")) == 2, "Bastion's p.39 rows changed"
_om_n = 0
_om_res_n = 0
_om_res_at = {}
for _nm in _OM_HOSTS:
    _L = _p18_list(_nm)
    _inq = _p18_sec(_L, "THE INQUISITION")
    _om = len(_L["secs"])
    _row = dict(_iq_om["ents"][0])
    _row["ld"] = dict(_row["ld"])
    _row["mx"] = 1
    _L["secs"].append(dict(
        t=_OM_T, text=[_OM_EMBARK] + list(_iq_om["text"]),
        own=["Ordo Malleus Inquisitor Lord (Ld 10)"] + list(_iq_om["own"]), notes=[],
        ents=[_row],
        rules=[dict(kind="requires", ok=True,
                    label="Ordo Malleus Inquisitor needs an Inquisitor Lord",
                    if_pick=[dict(sec=_om, re="^ordo malleus")],
                    then_pick=[dict(sec=_inq, re="^inquisitor lord")], min=1,
                    src=_OM_EMBARK)]))
    _om_n += 1
    if _nm == "Imperial Navy \u2014 Bastion Fleets":
        continue
    _res = len(_L["secs"])
    _om_res_at[_nm] = _res
    # Space Marine ships: those borrowed from another race's list (race pick) and
    # the list's own Space Marine rows (Armageddon's starred ones, p.41).
    _sm = [dict(race="space marines")]
    for _j, _x in enumerate(_L["secs"]):
        if any(e.get("k") == "unit" and re.search(r"[^*]\*$", e["l"]) for e in _x["ents"]):
            _sm.append(dict(sec=_j, re=r"[^*]\*$"))
    assert (len(_sm) > 1) == (_nm == "Imperial Navy \u2014 Armageddon Sector"), \
        "%s: %d starred Space Marine rows in the section" % (_nm, len(_sm) - 1)
    _L["secs"].append(dict(
        # Both sentences are the src of rules in the "Checked by the builder"
        # group; as section text they would repeat in the "Check yourself" group.
        t=_OM_RES_T, text=[],
        notes=["Page 152 names no hulls: it points to the Chaos ships of the Bastion "
               "Fleet List, which are the five of page 39, at the same prices."],
        ents=[dict(_p18_unit(e["l"], e["r"], e["p"], 152), **({"optno": e["optno"]} if e.get("optno") else {}))
              for e in _bast_rows],
        rules=[
            dict(kind="requires", ok=True, what="an Ordo Malleus Inquisitor",
                 label="Chaos reserves need an Ordo Malleus Inquisitor",
                 if_pick=[dict(sec=_res)],
                 then_pick=[dict(sec=_om, re="^ordo malleus")], min=1, src=_OM_ROUTE),
            dict(kind="conditional_cap", ok=True,
                 label="No Space Marine vessels with Ordo Malleus Chaos reserves",
                 pick=_sm, cond_pick=[dict(sec=_res)], max_met=0, max_unmet=None,
                 src=_OM_ROUTE),
            dict(kind="conditional_cap", ok=True,
                 label="No Grey Knights vessels with Ordo Malleus Chaos reserves",
                 pick=[dict(hull="^GREY KNIGHTS")], cond_pick=[dict(sec=_res)],
                 max_met=0, max_unmet=None, src=_OM_FREE),
        ]))
    _om_res_n += 1
assert _om_n == 5 and _om_res_n == 4, (_om_n, _om_res_n)
print("Ordo Malleus: %d hosts, Chaos reserves for %d hosts (p.152)" % (_om_n, _om_res_n))


# Bakka's own reserve rule (p.50) now overlaps the general rule:
# the engine enforces the same 1:3 ratio over the whole fleet, and the per-list
# rule counted only the RESERVES section's rows. Two red rows from the same
# error are worse than one, so the per-list one is removed and its
# sentence stays visible as text.
_BAKKA = _p18_list("Imperial Navy — Bakka Sector")
_bkr = _p18_sec(_BAKKA, "RESERVES")
_dup = [r for r in _BAKKA["secs"][_bkr]["rules"]
        if r.get("label") == "Reserve cruisers, battlecruisers and grand cruisers"]
assert len(_dup) == 1, "Bakka reserve rules %d" % len(_dup)
_BAKKA["secs"][_bkr]["rules"] = [r for r in _BAKKA["secs"][_bkr]["rules"]
                                 if r is not _dup[0]]
add_text(_BAKKA["secs"][_bkr], [_dup[0]["src"]])
print("Bakka's overlapping reserve rule removed (the general rule p.14 enforces it)")

# The reserve sections' hulls into the fleet's limits (J144, review 16.9.). After
# this, because Bakka's removed reserve rule was also cruiser-based. p.14: "the
# restrictions on maximum and minimum numbers of ships are determined for the
# fleet as a whole, regardless of whether they were purchased from the list or
# as reserves." The engine counts a list's own row only in its own section,
# so 12 Lunars and a Carnage showed "Cruisers 12 / 12" - the same defect was already
# in Bastion's p.39 section. As for the renegades (J141): a pick is added
# to the rules. The split comes from Bastion's own page, whose hulls these are
# (p.37): cruisers (Hades, Carnage, Murder) into the 0-12 limit and the base of the battleship
# and battlecruiser ratios; "Grand Cruisers do not count as
# cruisers for purposes of fielding battleships", and they share the "one
# battlecruiser or grand cruiser ... for every two cruisers" slot.
_RES_CRU = "^(hades|carnage|murder) class"
_RES_GC = "grand cruiser"
def _reserve_limits(L, rsec):
    t = [x["t"].strip().lower() for x in L["secs"]]
    cru = t.index("cruisers")
    hits = []
    for _x in L["secs"]:
        for _r in _x.get("rules") or []:
            if _r["kind"] == "section_count" and _r.get("max") == 12 and _r.get("sec") == [cru]:
                _r["pick"] = list(_r.get("pick") or [dict(sec=cru)]) + [dict(sec=rsec, re=_RES_CRU)]
                hits.append("0-12")
            if _r["kind"] != "ratio":
                continue
            per = list(_r.get("per_pick") or [dict(sec=j) for j in (_r.get("per_sec") or [])])
            allow = list(_r.get("allow_pick") or [dict(sec=j) for j in (_r.get("allow_sec") or [])])
            if not any(q["sec"] == cru and not q.get("re") for q in per):
                continue
            _r["per_pick"] = per + [dict(sec=rsec, re=_RES_CRU)]
            if any(t[q["sec"]] == "battlecruisers" or "battlecruiser|grand" in (q.get("re") or "") for q in allow):
                _r["allow_pick"] = allow + [dict(sec=rsec, re=_RES_GC)]
                hits.append("bc")
            else:
                hits.append("bs")
    return sorted(hits)
_lim = {}
for _nm, _rs in _om_res_at.items():
    _lim[_nm] = _reserve_limits(_p18_list(_nm), _rs)
_lim["Imperial Navy — Bastion Fleets"] = _reserve_limits(_BAST, _bsec)
assert _lim == {
    "Imperial Navy — Gothic Sector": ["0-12", "bc", "bs"],
    "Imperial Navy — Armageddon Sector": ["0-12", "bc", "bs"],
    "Imperial Navy — Bakka Sector": ["0-12", "bc", "bs"],
    "Adeptus Mechanicus — Explorator": ["bs"],
    "Imperial Navy — Bastion Fleets": ["0-12", "bc", "bs"],
}, _lim
print("reserve section hulls into the limits: %d rules" % sum(len(v) for v in _lim.values()))



# --- 1.1 phase 4: the Rogue Traders' xenos allies (Fleets p.185) ------------
# "For every 750 points in the fleet, Rogue Traders may be accompanied by a
# single Demiurg or Kroot vessel unless the fleet is using auxiliary ships
# that cannot be allies with the Demiurg or Kroot (such as Space Marines)."
#
# The XENOS ALLIES section exists on the list and the sentence as its text, but the rows
# were missing. The prices are read from the Demiurg and Tau lists (p.487, p.494).
# The sentence does not say "or part thereof", so 750 is read as FULL - unlike
# e.g. p.184's "for every 750 points or part thereof".
#
# The exception clause's condition ("such as Space Marines") is not needed on this list:
# a Space Marine row is only on the Pirates and Wolf Packs list (p.189), which
# has its own xenos rules. The Exploration list says on p.186 explicitly that its
# own rules replace this, and they are already in the data (p.187).
_RTX_SRC = ("For every 750 points in the fleet, Rogue Traders may be "
            "accompanied by a single Demiurg or Kroot vessel unless the fleet "
            "is using auxiliary ships that cannot be allies with the Demiurg "
            "or Kroot (such as Space Marines).")
_RTX = _p18_list("Rogue Traders")
_rtx = _p18_sec(_RTX, "XENOS ALLIES")
assert not _RTX["secs"][_rtx]["ents"], "RT: the XENOS ALLIES section already has rows"
_RTX["secs"][_rtx].setdefault("notes", []).append(
    "Page 185 allows a Demiurg or Kroot vessel but names no classes and prints "
    "no prices; the builder offers the Demiurg fleet list's vessels at their "
    "prices there (page 487).")
_RTX["secs"][_rtx]["ents"] = [
    _p18_unit("Stronghold Commerce Vessel", 488, 350, 185),
    _p18_unit("Bastion Commerce Vessel", 489, 255, 185),
    _p18_unit("Citadel Commerce Vessel", 490, 185, 185),
    _p18_unit("Kroot Warsphere", 494, 145, 185),
]
_RTX["secs"][_rtx]["rules"] = list(_RTX["secs"][_rtx].get("rules") or []) + [dict(
    kind="per_points", each=1, per=750, full=True, ok=True, sec=[_rtx],
    label="Demiurg and Kroot vessels (one per full 750 pts)",
    pick=[dict(sec=_rtx)], src=_RTX_SRC)]
print("the Rogue Traders' xenos allies added: %d hulls (p.185)"
      % len(_RTX["secs"][_rtx]["ents"]))

# --- 1.1 phase 4: Bakka's Rogue Trader cruiser (Fleets p.50) ----------------
# "One Rogue Trader cruiser and its attendant escorts may be taken for every
# 750 points in the fleet." The same reading as p.185: no "or part
# thereof", so full 750s. The escorts ("attendant escorts") stay
# text: they are the Rogue Trader list's own squadron rule (p.184).
_BKRT_SRC = ("One Rogue Trader cruiser and its attendant escorts may be taken "
             "for every 750 points in the fleet.")
_BK = _p18_list("Imperial Navy \u2014 Bakka Sector")
assert not any(e.get("r") == 180 for x in _BK["secs"] for e in x["ents"]), \
    "Bakka: the Rogue Trader Cruiser already exists"
_bkrt = len(_BK["secs"])
_BK["secs"].append(dict(t="ROGUE TRADERS", text=[_BKRT_SRC],
                        ents=[_p18_unit("Rogue Trader Cruiser", 180, 185, 50)],
                        rules=[dict(kind="per_points", each=1, per=750, full=True,
                                    ok=True, sec=[_bkrt],
                                    label="Rogue Trader cruisers (one per full 750 pts)",
                                    pick=[dict(sec=_bkrt)], src=_BKRT_SRC)]))
print("Bakka's Rogue Trader cruiser added (p.50)")


# --- 1.1 phase 4: the Chaos renegades (Fleets p.232) -----------------------
# "RENEGADE IMPERIAL VESSELS ... For every 1,500 points in a Chaos fleet, one
# cruiser from any Imperial Navy fleet list up to 185 points and/or up to six
# Imperial Navy escorts may be taken. Special weapon rules, Nova Cannon,
# Chaos Lords, Chaos Space Marines, Chaos ordnance or Daemonship upgrades may
# not be taken for Imperial Navy vessels used in this manner, and cruisers
# suffer -1Ld for going renegade. Imperial Navy escorts need not be in a
# single squadron and may be interspersed within other Chaos escort squadrons
# if desired. These vessels may not take any upgrade listed in their profile
# and do not count as reserves; they count as Chaos vessels in all respects."
#
# Page 232 is Chaos's SPECIAL RULES page, which fell outside the lists' rules window
# (lists.py rules_pages, six pages). It is not widened:
# growing the window would bring dozens of pages of narrative to twelve
# lists. The section and its sentence are recorded here directly, so the player sees
# exactly the same text.
#
# "they count as Chaos vessels in all respects" -> the rows are the Chaos list's
# own, so they are not reserves and the race gate does not concern them, and they
# count towards the list's own cruiser and escort limits (section_count.pick).
# "Weapon refits, Nova Cannon ... may not be taken" -> the profile options
# that change a weapon are banned on the rows (optno, _REN_OPTNO). v0.36 said
# "These vessels may not take any upgrade listed in their profile" (noopt);
# v0.40 dropped that, so an option that changes no weapon (the light
# cruisers' 6+ prow armour) is allowed. The power ram is not for a Chaos fleet
# (its own condition) and the Cobra's detection gear is for Imperial escort
# squadrons only (p.84).
_REN_SRC = ("For every 1,500 points in a Chaos fleet, one cruiser from any "
            "Imperial Navy fleet list up to 185 points and/or up to six "
            "Imperial Navy escorts may be taken.")
_REN_SRC2 = ("Weapon refits, Nova Cannon, Chaos Lords, Chaos Space "
             "Marines, Chaos ordnance or Daemonship upgrades may not be taken "
             "for Imperial Navy vessels used in this manner, and cruisers "
             "suffer -1 Ld for going renegade. Imperial Navy escorts need not "
             "be in a single squadron and may be interspersed within other "
             "Chaos escort squadrons if desired. These vessels do not count as "
             "reserves; they count as Chaos vessels in all respects.")
_REN_OPTNO = r"nova cannon|weapons batter|torpedo|lance|launch bay|power ram|long range detection"
# The Imperium's hulls: cruisers at most 185 points and escorts. The prices
# are the Imperial Navy lists' own; Space Marine hulls are not included,
# because the book says "Imperial Navy fleet list" and "Imperial Navy escorts".
_REN_CRUISERS = [("Tyrant class cruiser", 69, 185), ("Gothic class cruiser", 70, 180),
                 ("Lunar class cruiser", 71, 180), ("Defiant class light cruiser", 76, 120),
                 ("Endeavour class light cruiser (Bakka)", 73, 115),
                 ("Endurance class light cruiser (Bakka)", 75, 115),
                 ("Dauntless class light cruiser", 77, 110),
                 ("Endeavour class light cruiser", 72, 110),
                 ("Endurance class light cruiser", 74, 110),
                 ("Siluria class light cruiser", 78, 100)]
_REN_ESCORTS = [("Firestorm class frigate", 79, 40), ("Sword class frigate", 82, 35),
                ("Falchion class frigate", 80, 35), ("Havoc class frigate", 81, 35),
                ("Viper class destroyer", 83, 35), ("Cobra class destroyer", 84, 30)]
_REN_CRU_RE = "^(tyrant|gothic|lunar|defiant|endeavour|endurance|dauntless|siluria)"
_REN_ESC_RE = "^(firestorm|sword|falchion|havoc|viper|cobra)"
_ren_n = 0
for _nm in ("Chaos \u2014 Incursion", "Chaos \u2014 Black Crusade", "Chaos \u2014 Tzeentch",
            "Chaos \u2014 Nurgle", "Chaos \u2014 Khorne", "Chaos \u2014 Slaanesh"):
    _L = _p18_list(_nm)
    assert not any(e.get("r") == 69 for x in _L["secs"] for e in x["ents"]), \
        "%s: the renegades already exist" % _nm
    _i = len(_L["secs"])
    _ents = ([dict(_p18_unit(_l, _r, _p, 232), optno=_REN_OPTNO) for _l, _r, _p in _REN_CRUISERS]
             + [dict(_p18_unit(_l, _r, _p, 232), optno=_REN_OPTNO) for _l, _r, _p in _REN_ESCORTS])
    _L["secs"].append(dict(t="RENEGADE IMPERIAL VESSELS", text=[_REN_SRC, _REN_SRC2],
        ents=_ents, rules=[
            dict(kind="per_points", each=1, per=1500, full=True, ok=True, sec=[_i],
                 label="Renegade Imperial cruisers (one per full 1,500 pts)",
                 pick=[dict(sec=_i, re=_REN_CRU_RE)], src=_REN_SRC),
            dict(kind="per_points", each=6, per=1500, full=True, ok=True, sec=[_i],
                 label="Renegade Imperial escorts (up to six per full 1,500 pts)",
                 pick=[dict(sec=_i, re=_REN_ESC_RE)], src=_REN_SRC)]))
    # "they count as Chaos vessels in all respects": the list's own cruiser and
    # escort limits count these in.
    _cru = [i for i, x in enumerate(_L["secs"]) if x["t"].strip().lower() == "cruisers"]
    assert len(_cru) == 1, "%s: Cruisers sections %d" % (_nm, len(_cru))
    _esc = [i for i, x in enumerate(_L["secs"]) if x["t"].strip().lower() == "escorts"]
    assert len(_esc) == 1, "%s: ESCORTS sections %d" % (_nm, len(_esc))
    _hit = 0
    for _r in _L["secs"][_cru[0]].get("rules") or []:
        if _r.get("kind") == "section_count":
            _r["pick"] = [dict(sec=_cru[0]), dict(sec=_i, re=_REN_CRU_RE)]
            # The whole p.232 paragraph stuck to the end of the "0-12 Cruisers" row
            # without a separator, and the legality panel showed its limit
            # as its own sentence ("0-12 Cruisers Special weapon rules, Nova
            # Cannon, ..."). The rule's src is the channel of the book's sentence, so it
            # stays the book's row, and the builder's explanation of why the
            # renegades count belongs in the Builder's notes channel
            # (J121) - check_pages.py rejected the first attempt, which
            # wrote the explanation into src.
            _L["secs"][_cru[0]].setdefault("notes", []).append(
                "Renegade Imperial cruisers taken under Renegade Imperial "
                "Vessels count toward this limit too: the book says they count "
                "as Chaos vessels in all respects (Fleets p. 232).")
            _hit += 1
    assert _hit == 1, "%s: cruiser limits %d" % (_nm, _hit)
    # The same reasoning as for the cruiser limit: "they count as Chaos vessels in
    # all respects" (p.232). The review 16.9. found that a renegade counted
    # towards the 0-12 limit but not towards the ratios "one battleship for every three
    # cruisers or heavy cruisers" - three Murders and a renegade Lunar gave
    # zero battleships instead of one.
    _ratio = 0
    for _sx in _L["secs"]:
        for _r in _sx.get("rules") or []:
            if _r.get("kind") != "ratio" or _r.get("per_pick"):
                continue
            if _cru[0] not in (_r.get("per_sec") or []):
                continue
            _r["per_pick"] = ([dict(sec=_x) for _x in _r["per_sec"]]
                              + [dict(sec=_i, re=_REN_CRU_RE)])
            _ratio += 1
    assert _ratio == 3, "%s: ratios counting cruisers %d" % (_nm, _ratio)
    for _r in _L["secs"][_esc[0]].get("rules") or []:
        if _r.get("kind") == "squadron" and not _r.get("pick"):
            _r["pick"] = [dict(sec=_esc[0]), dict(sec=_i, re=_REN_ESC_RE)]
    _ren_n += 1
assert _ren_n == 6, _ren_n
print("the Chaos renegades added to %d lists (p.232)" % _ren_n)
