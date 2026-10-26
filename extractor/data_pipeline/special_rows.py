# -*- coding: utf-8 -*-
"""Stage 12 of the data pipeline (extractor/build_data.py): special rows.

The stages run in file order when the entry imports the last one; each
imports what it uses from the stages before it. One pipeline script
until 26.10.2026, split by stage for reading, not for reuse.
"""
import json, io, re, collections, os, sys
import upgrades
import swaps, copy
from .inputs import re
from .profile_types import e, r, s
from .races import _L
from .row_classes import L, _pe, i
from .row_texts import _pir
from .section_guard import lists_out
from .ships import o, ships
# ------------------------------- a share of one hull's option (p.437, J175 c)
# "Instead of taking one of the above, up to 10% of the Tyranid escort drones
# in the fleet can elect to become fireships." The option is on the profile (the same
# drone_weapon group as the weapons), but the limit is the fleet's: resolveFleet
# counts hulls, rounding down.
_FS_SRC = ("Instead of taking one of the above, up to 10% of the Tyranid escort drones in the fleet "
           "can elect to become fireships.")
_fs_ol = [o for o in ships["437"]["ol"] if "become fireships" in str(o.get("t"))]
assert ships["437"]["nm"] == "ESCORT DRONE" and len(_fs_ol) == 1 and _fs_ol[0]["t"].startswith(_FS_SRC), _fs_ol
assert "frac" not in ships["437"]
ships["437"]["frac"] = dict(opt="become fireships", pct=10, what="437", pg=437, src=_FS_SRC,
                            label="Fire ship escort drones (up to 10% of the escort drones)")

# ------------------------------------- Webway Portal (p.337, J175 d)
# The Haven's own rule: "The owning player may use the Webway to summon
# additional warships to its aid. Any number of ships may be purchased
# against the fleet's total at 50% cost, but they count as reserves and start
# off the table." Half price is a way of buying the ship, so it is a row
# (pct -50) for every ship of the list, and it opens as Hide (off0) - no
# open box on every card. "count as reserves" = arriving from off the table
# (the same sentence goes on "start off the table"), not p.14's reserve between
# lists: "Any number". The Haven is only in the Eldar lists' defences
# (p.334); the Dark Eldar base (p.347) swaps only the weapons, and the page does not
# mention the portal - an interpretation, BACKLOG J175.
_WW_SRC = ("The owning player may use the Webway to summon additional warships to its aid. Any number of "
           "ships may be purchased against the fleet's total at 50% cost, but they count as reserves and "
           "start off the table.")
_WW_ARR = ("Beginning turn 2, after the Eldar fleet moves roll a D6. On a 5+, one capital ship or escort "
           "squadron appears along the table edge closest to the Eldar Haven. Eldar ships cannot move in "
           "the same turn they appear.")
_WW_LABEL = "Summoned through the Webway Portal (50% cost)"
_ww_n = 0
for _L in lists_out:
    if _L.get("race") not in ("eldar", "craftworld eldar"):
        continue
    assert not any(x["t"] == "WEBWAY PORTAL" for x in _L["secs"]), _L["nm"]
    _L["secs"].append(dict(
        t="WEBWAY PORTAL", text=[_WW_SRC, _WW_ARR], rules=[],
        notes=["Only with an Eldar Haven in the fleet (bought under Planetary defences, Fleets p. 334). "
               "Tick the row on each ship that arrives through the portal: it costs half, rounded up."],
        ents=[dict(l=_WW_LABEL, r=None, p=None, pct=-50, a=1, u=1, mx=None, nt=None, prose=1, k="up",
                   off0=1, cond=dict(ty=r"^(?!defence)"), src_page=337,
                   desc="Bought at 50% cost and starts off the table. " + _WW_ARR + " (Fleets p. 337)")]))
    _L["webway"] = dict(up="^" + _WW_LABEL.replace("(", "\\(").replace(")", "\\)") + "$",
                        haven="^Haven space station$", pg=337, src=_WW_SRC)
    _ww_n += 1
assert _ww_n == 3, _ww_n
print("Webway Portal: %d Eldar lists (p.337); fire ship drones at most 10 %% (p.437)" % _ww_n)


# ------------------------------- Pirates: transports (p.13, p.179; J46 b)
# p.13: "This rule exempts escorts that are allowed to operate alone, such as
# transports or Tau Messenger ships." The book itself says which of the Pirates list's
# escorts are transports: the Cargo Transport is a "Transport" (p.85), the Armed
# Freighter "counts as only half a freighter" (p.523) and the Armed Cargo Vessel
# "count as a half-transport" (p.192); the Escort Carrier and the Q-Ship "do not count
# as freighters" (p.521, p.522). A transport may be alone, so the 3-6 rule does not
# concern it, and a lone transport is not p.179's "squadron of 3-6 escort
# vessels" per cruiser.
_PIR_TRANSPORTS = ("Cargo Transport", "Armed Freighter", "Armed Cargo Vessel")
_PIR_NOT_T = "^(?!(?:%s)$)" % "|".join(re.escape(x) for x in _PIR_TRANSPORTS)
_pir = [L for L in lists_out if L["nm"] == "Rogue Traders \u2014 Pirates and Wolf Packs"]
assert len(_pir) == 1
_pe = [i for i, s in enumerate(_pir[0]["secs"]) if s["t"].strip().upper() == "ESCORTS"]
assert len(_pe) == 1
_pe = _pe[0]
_labs = [e["l"] for e in _pir[0]["secs"][_pe]["ents"] if e.get("k") != "up"]
assert all(x in _labs for x in _PIR_TRANSPORTS), _labs
_pr = {r["kind"]: r for r in _pir[0]["secs"][_pe]["rules"]}
assert set(_pr) >= {"squadron", "min_ratio"} and "pick" not in _pr["squadron"], _pr.keys()
_pr["squadron"]["pick"] = [dict(sec=_pe, re=_PIR_NOT_T)]
_pr["squadron"]["src"] = (_pr["squadron"]["src"] + " This rule exempts escorts that are allowed to operate "
                          "alone, such as transports or Tau Messenger ships. (Fleets p. 13)")
_ap = _pr["min_ratio"]["allow_pick"]
assert _ap == [dict(sec=_pe)], _ap
_pr["min_ratio"]["allow_pick"] = [dict(sec=_pe, re=_PIR_NOT_T)]
print("Pirates: transports (%s) exempt from the squadron rule (p.13)" % ", ".join(_PIR_TRANSPORTS))
