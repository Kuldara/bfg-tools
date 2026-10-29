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
# "Instead of taking a weapon from above, up to 10 % of the Tyranid escort
# drones in the fleet can elect to become fire ships for +5 points each."
# (v0.40; v0.36 made them free.) The option is on the profile (the same
# drone_weapon group as the weapons), but the limit is the fleet's:
# resolveFleet counts hulls, rounding down.
_FS_SRC = ("Instead of taking a weapon from above, up to 10 % of the Tyranid escort drones in the fleet "
           "can elect to become fire ships for +5 points each.")
_fs_ol = [o for o in ships["437"]["ol"] if "become fire ships" in str(o.get("t"))]
assert ships["437"]["nm"] == "ESCORT DRONE" and len(_fs_ol) == 1 and _fs_ol[0]["t"].startswith(_FS_SRC) \
    and _fs_ol[0].get("c") == 5, _fs_ol
assert "frac" not in ships["437"]
ships["437"]["frac"] = dict(opt="become fire ships", pct=10, what="437", pg=437, src=_FS_SRC,
                            label="Fire ship escort drones (up to 10% of the escort drones)")

# ------------------------------------- Webway Portal (p.335, J175 d)
# The Haven's own rule: "The owning player may use the Webway to summon
# additional warships to its aid. Any number of ships may be purchased
# against the fleet's total at 50% cost, but they count as reserves and start
# off the table." Half price is a way of buying the ship, so it is a row
# (pct -50) for every ship of the list, and it opens as Hide (off0) - no
# open box on every card. "count as reserves" = arriving from off the table
# (the same sentence goes on "start off the table"), not p.14's reserve between
# lists: "Any number". The Haven is only in the Eldar lists' defences
# (p.332); the Dark Eldar base (p.349) swaps only the weapons, and the page does not
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
        notes=["Only with an Eldar Haven in the fleet (bought under Planetary defences, Fleets p. 332). "
               "Tick the row on each ship that arrives through the portal: it costs half, rounded up."],
        ents=[dict(l=_WW_LABEL, r=None, p=None, pct=-50, a=1, u=1, mx=None, nt=None, prose=1, k="up",
                   off0=1, cond=dict(ty=r"^(?!defence)"), src_page=335,
                   desc="Bought at 50% cost and starts off the table. " + _WW_ARR + " (Fleets p. 335)")]))
    _L["webway"] = dict(up="^" + _WW_LABEL.replace("(", "\\(").replace(")", "\\)") + "$",
                        haven="^Haven space station$", pg=335, src=_WW_SRC)
    _ww_n += 1
assert _ww_n == 3, _ww_n
print("Webway Portal: %d Eldar lists (p.335); fire ship drones at most 10 %% (p.437)" % _ww_n)


# ------------------------------- Pirates: transports (p.13, p.189; J46 b)
# p.13: "This rule exempts escorts that are allowed to operate alone, such as
# transports or Tau Messenger ships." The book itself says which of the Pirates list's
# escorts are transports: the Cargo Transport is a "Transport" (p.85), the Armed
# Freighter "counts as only half a freighter" (p.523) and the Armed Cargo Vessel
# "count as a half-transport" (p.202); the Escort Carrier and the Q-Ship "do not count
# as freighters" (p.521, p.522). A transport may be alone, so the 3-6 rule does not
# concern it, and a lone transport is not p.189's "squadron of 3-6 escort
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


# ------------------------------- Power ram, an option of each ship (v0.40)
# v0.40 moved the power ram from the Imperial Navy and Mechanicus fleet rules
# (and FAQ 2026 *Power ram*) into the profiles: "The ship may take a power ram
# for +5 points, if it is part of an Imperial Navy, Adeptus Mechanicus,
# Inquisition, or Rogue Trader fleet list. This does not count as a separate
# refit." Some ships add a condition, which the option parser cannot read the
# right way round:
#   "If the prow torpedoes are not replaced, the ship may take a power ram"
#       -> one or the other: an exclusive group with the prow torpedo swap
#   "If the nova cannon is replaced, the ship may also take a power ram"
#   "If the prow armour is increased, the ship may also take a power ram"
#       -> needs that option taken first (dep)
# The fleet list condition is the host list's: elsewhere (Chaos renegades,
# Space Marine, Tau, Demiurg and the other lists that borrow these hulls) the
# rows ban the option (optno). "Inquisition" covers both lists of the
# Inquisition chapter (The Emperor's Inquisition and Grey Knights, p.148-155);
# "Rogue Trader" the three Rogue Trader lists (p.184-189).
_RAM_RE = r"may (?:also )?take a power ram"
_RAM_LISTS = re.compile(r"^(Imperial Navy|Adeptus Mechanicus|The Emperor's Inquisition|Grey Knights|Rogue Traders)")
_ram = collections.Counter()
_ram_ships = set()
for _k, _sh in ships.items():
    _ol = _sh.get("ol") or []
    for _i, _o in enumerate(_ol):
        if not re.search(_RAM_RE, _o["t"], re.I):
            continue
        assert _o.get("c") == 5 and "if it is part of an Imperial Navy, Adeptus Mechanicus, Inquisition, or " \
            "Rogue Trader fleet list" in _o["t"], (_k, _o["t"])
        _ram_ships.add(_k)
        _o.pop("dep", None)
        if _o["t"].startswith("If the prow torpedoes are not replaced"):
            _sw = [j for j, x in enumerate(_ol) if j != _i and re.search(r"replace its prow torpedoes", x["t"], re.I)
                   and re.search(r"nova cannon", x["t"], re.I)]
            assert len(_sw) == 1 and not _ol[_sw[0]].get("grp"), (_k, [x["t"][:50] for x in _ol])
            for j in (_sw[0], _i):
                _ol[j]["grp"], _ol[j]["gmax"] = "%s_prow" % _k, 1
            _ram["exclusive"] += 1
        elif _o["t"].startswith(("If the nova cannon is replaced", "If the prow armour is increased")):
            _what = r"replace its nova cannon" if "nova" in _o["t"][:30] else r"increase the prow armour"
            _d = [j for j, x in enumerate(_ol) if j != _i and re.search(_what, x["t"], re.I)]
            assert len(_d) == 1, (_k, _what, [x["t"][:50] for x in _ol])
            _o["dep"] = _d[0]
            _ram["dep"] += 1
        else:
            assert _o["t"].startswith("The ship may take a power ram"), (_k, _o["t"])
            _ram["plain"] += 1
for _L in lists_out:
    if _RAM_LISTS.match(_L["nm"]):
        continue
    for _sec in _L["secs"]:
        for _e in _sec.get("ents") or []:
            if _e.get("k") == "up" or str(_e.get("r")) not in _ram_ships:
                continue
            _e["optno"] = (_e["optno"] + "|" if _e.get("optno") else "") + "power ram"
            _ram["banned"] += 1
assert len(_ram_ships) == 27 and _ram["exclusive"] == 8 and _ram["dep"] == 11, (len(_ram_ships), _ram)
print("Power ram: %d profiles (%s)" % (len(_ram_ships), dict(_ram)))
