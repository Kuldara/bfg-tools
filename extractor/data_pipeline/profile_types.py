# -*- coding: utf-8 -*-
"""Stage 9 of the data pipeline (extractor/build_data.py): profile types.

The stages run in file order when the entry imports the last one; each
imports what it uses from the stages before it. One pipeline script
until 26.10.2026, split by stage for reading, not for reuse.
"""
import json, io, re, collections, os, sys
import upgrades
import swaps, copy
from .inputs import copy, re
from .page_refs import v
from .row_classes import _L, _c, _e, _m, _nm, _own, _p18_list, _p18_sec, _r, _s, _tt, _txt, i, j, k, r, t, x
from .row_texts import Lx, _hit, _i, _n, _o, _ox, _sec, _sh, _si, _t, _x, e, s
from .section_guard import _titles, lists_out
from .ships import o, ships
# p.23 Acquisition: "Any ship with launch bays can be refitted to carry orbital
# mines instead of attack craft at a points cost of +5 points per launch bay
# strength. ... Only cruisers may be refitted to carry orbital mines;
# battleships are considered too rare and valuable to use in this way."
# Profile type Cruiser (also heavy, battle and light cruisers) and grand
# cruiser (Fleets p.14 counts them in the "cruisers" group; p.23 excludes only
# battleships - J21, raised on Discord), not a battleship. Tyranids (their own Mega-Spore Mines) and Necrons
# left out (spot check 12). Orks included: p.360 "Orks may buy orbital mines
# like other fleets at +5 pts per (maximal) launch bay strength ... Ork Space
# Hulks cannot take orbital mines" (spot check 13; the limit in spot check 12 was wrong).
_OM_DESC = ("Orbital mines replace all the attack craft in the ship's launch bays: one mine per launch bay "
            "Strength is launched like attack craft, mines cannot form waves and are not subject to ordnance "
            "limits. A critical hit affecting the launch bays causes an extra D3 damage. Cruisers and grand cruisers only, "
            "not battleships; not with torpedo bombers or other attack craft upgrades; "
            "intended as a surprise tactic - at most one or two mine-armed ships. (Fleets p. 23)")
_om_log = []
for Lx in lists_out:
    if re.match(r"^(Tyranids|Necrons)", Lx["nm"]):
        continue
    if any(e.get("k") == "up" and re.match(r"orbital mines", str(e["l"]), re.I) for s in Lx["secs"] for e in s["ents"]):
        continue
    _hit = False
    for s in Lx["secs"]:
        for e in s["ents"]:
            _sh = ships.get(str(e.get("r"))) if e.get("r") else None
            if _sh and re.match(r"^(grand )?cruiser$", str(_sh["ty"]), re.I) and any("launch bay" in str(a[0]).lower() for a in _sh["aw"]):
                _hit = True
    if not _hit:
        continue
    _sec = [s for s in Lx["secs"] if s["t"].strip().upper() == "ORDNANCE"]
    if _sec:
        _sec = _sec[0]
    else:
        _sec = dict(t="ORDNANCE", rules=[], text=[], ents=[])
        Lx["secs"].append(_sec)
    # noup/offopt: mines replace ALL attack craft (p.23), so no
    # torpedo bombers (p.22 "an additional type of attack craft") nor the ship's
    # own attack craft choices (Shark assault boats p.59, Vampire raiders p.330,
    # the orks' torpedo-bommas as the ship's own option p.359).
    _omcond = dict(ty=r"^(grand )?cruiser$", has="launch bay", noup=r"^torpedo[\s-]*bom",
                   offopt=r"shark assault boats|vampire raiders|torpedo[\s-]*bom")
    if Lx["nm"].startswith("Orks"):
        # p.360 not the Ork Space Hulk; Zukov's Klaw's bays are an Assault Karrier (p.381)
        _omcond["nmno"] = r"hulk|zukov"
    _sec["ents"].append(dict(l="Orbital mines", r=None, p=5, a=1, u=1, mx=None, k="up", per="bay",
                             nt="Per launch bay strength.", prose=1, src_page=23,
                             cond=_omcond, desc=_OM_DESC,
                             # p.23: launch bay rows turn into mine rows, 10 cm (p.512),
                             # one mine per bay strength (domain.js permine).
                             swp=dict(f=r"launch bays?", nm="orbital mines", nmf=r"launch bays?",
                                      rg="10 cm", permine=1)))
    _om_log.append(Lx["nm"])
print("orbital mines row on %d lists: %s" % (len(_om_log), ", ".join(_om_log)))
assert len(_om_log) >= 20, "at least 20 orbital mines rows expected, %d added" % len(_om_log)

# p.22 "When taken, they become an additional type of attack craft available to
# the carrier"; p.23 "Orbital mines completely replace all the attack craft in a
# ships launch bays" -> torpedo bombers and mines are not on the same ship
# (J21, Bug Hunt finding 1). The mine row's own noup closes the other direction.
_tbx = 0
for Lx in lists_out:
    for s in Lx["secs"]:
        for e in s["ents"]:
            if e.get("k") == "up" and re.match(r"torpedo[\s-]*bom", str(e["l"]), re.I):
                _c = dict(e.get("cond") or {})
                _c["noup"] = (_c["noup"] + "|^orbital mines$") if _c.get("noup") else "^orbital mines$"
                e["cond"] = _c
                _tbx += 1
print("torpedo bombers rows with the mine exclusion: %d" % _tbx)
assert _tbx >= 20, "at least 20 torpedo bombers rows expected, found %d" % _tbx

# p.234 Black Crusade: "Chaos Warmasters get one re-roll. In addition they may
# be given a single Mark of Chaos." The Marks' prices are under Chaos Lords,
# and the rows' target (at) was only the Lord (spot check 15 row 36). The Warmaster
# is added as a target; grp=mark keeps the Mark single.
_wm = 0
for Lx in lists_out:
    if Lx["nm"] != "Chaos — Black Crusade":
        continue
    _wsi = [i for i, s in enumerate(Lx["secs"]) if s["t"] == "Chaos Warmaster"]
    assert len(_wsi) == 1, "Black Crusade: the Chaos Warmaster section is not found"
    _wei = [i for i, e in enumerate(Lx["secs"][_wsi[0]]["ents"]) if e.get("k") == "cmd"]
    assert len(_wei) == 1, "Black Crusade: the Warmaster row is not found"
    for s in Lx["secs"]:
        if s["t"] != "Chaos Lords":
            continue
        for e in s["ents"]:
            if e.get("k") == "up" and str(e["l"]).startswith("The Mark of ") and e.get("at"):
                e["at"] = list(e["at"]) + [[_wsi[0], _wei[0]]]
                _wm += 1
assert _wm == 4, "Black Crusade: 4 Warmaster Mark rows expected, found %d" % _wm

# --- J161: Prince Yriel on both Corsair lists (p.319, 9.10.2026) ------------
# "Yriel may be taken instead of the Hero Fleet Commander as listed in the
# Corsair and Craftworld Eldar fleet lists." The box is printed on the second page of
# the Iyanden list (p.319), so the extractor gave the row only to Iyanden
# - a player report 9.10.2026 and the book check 5.10. (J161). The rows and
# Yriel's own sentences are COPIED from the Iyanden section, not written again:
# one source, and the copy inherits everything earlier runs gave the row (rr,
# ld, prose). The place is the Corsair list's own RESERVES AND ALLIES section, the same
# as in Iyanden; the section exists, so no section index moves.
_YR_SRC = ("Yriel may be taken instead of the Hero Fleet Commander as listed in the "
           "Corsair and Craftworld Eldar fleet lists.")
_yiy = _p18_list("Eldar \u2014 Iyanden Craftworld")
_yis = _p18_sec(_yiy, "RESERVES AND ALLIES")
_ysec = _yiy["secs"][_yis]
assert [e["l"] for e in _ysec["ents"]] == ["Prince Yriel", "One extra re-roll", "Two extra re-rolls",
                                            "Embarked aboard the Flame of Asuryan"], [e["l"] for e in _ysec["ents"]]
assert _ysec["ents"][0]["k"] == "cmd" and _ysec["ents"][0]["p"] == 150 and _ysec["ents"][0].get("rr") == 1
assert all(e.get("at") == [[_yis, 0]] for e in _ysec["ents"][1:]), [e.get("at") for e in _ysec["ents"]]
_ytext = [t for t, o in zip(_ysec["text"], _ysec["own"]) if o == "Prince Yriel"]
assert len(_ytext) == 9 and _YR_SRC in _ytext, _ytext
# The book's sentence has a misprint ("rules *eg you do not ... fleet list(."):
# a star in place of the opening bracket and an opening one in place of the closing one.
# On the card and the legality row it is corrected to be readable; the words are the book's.
_YBAD = "*eg you do not have to field three capital ships in a Corsair Eldar fleet list(."
_YGOOD = "(e.g. you do not have to field three capital ships in a Corsair Eldar fleet list)."
_yfix = [i for i, t in enumerate(_ysec["text"]) if _YBAD in t]
assert len(_yfix) == 1, "Yriel: the misprinted sentence is not found exactly once (%d)" % len(_yfix)
_ysec["text"][_yfix[0]] = _ysec["text"][_yfix[0]].replace(_YBAD, _YGOOD)
_ytext = [t for t, o in zip(_ysec["text"], _ysec["own"]) if o == "Prince Yriel"]
_yex = [t for t in _ytext if "exempt from the reserve rules" in t]
_yab = [t for t in _ytext if "in which case his cost is 125 points" in t]
assert len(_yex) == 1 and len(_yab) == 1
# p.319: "He must be embarked aboard the Flame of Asuryan if it is present, in
# which case his cost is 125 points." The row -25 is a tick the player may
# forget or take without the ship: resolveFleet compares (aboard).
_YR_ABOARD = dict(cmd_re="^prince yriel", ship_re="^flame of asuryan",
                  up_re="^embarked aboard the flame of asuryan", pg=319, src=_yab[0])
_yiy["aboard"] = dict(_YR_ABOARD)
_yn = [0, 0, 0]
for _nm in ("Eldar Corsairs \u2014 Gothic Sector", "Eldar Corsairs \u2014 Later Gothic War"):
    _L = _p18_list(_nm)
    _si = _p18_sec(_L, "RESERVES AND ALLIES")
    _s = _L["secs"][_si]
    assert not _s["ents"], "%s: the RESERVES AND ALLIES section already has rows" % _nm
    _s["ents"] = [copy.deepcopy(e) for e in _ysec["ents"]]
    for _e in _s["ents"][1:]:
        _e["at"] = [[_si, 0]]
    _own = list(_s.get("own") or [None] * len(_s["text"]))
    assert len(_own) == len(_s["text"])
    _s["own"] = _own + ["Prince Yriel"] * len(_ytext)
    _s["text"] = list(_s["text"]) + list(_ytext)
    # Yriel stands in for the Hero: the same one commander slot, and he fills
    # the required commander (p.316/317 "a Pirate Prince must be included",
    # which the Hero replaces).
    for _x in _L["secs"]:
        for _r in _x.get("rules") or []:
            if _r.get("label") == "Fleet commander (Pirate Prince or Eldar Hero)":
                _r["label"] = "Fleet commander (Pirate Prince, Eldar Hero or Prince Yriel)"
                _r["pick"] = list(_r["pick"]) + [dict(sec=_si, re="^prince yriel")]
                _r["src"] = _r["src"] + " " + _YR_SRC
                _yn[0] += 1
            elif _r.get("kind") == "mandatory_at" and "Pirate Prince must be included" in str(_r.get("src", "")):
                _r["pick"] = list(_r["pick"]) + [dict(sec=_si, re="^prince yriel")]
                _yn[1] += 1
    # p.319: "Furthermore, if the Flame of Asuryan with Yriel is added to the
    # parent fleet it is exempt from the reserve rules *eg you do not have to
    # field three capital ships in a Corsair Eldar fleet list(." (the book's own
    # misprint in brackets). The exemption concerns ONLY the Flame with Yriel: not
    # a Dragonship, not a fleet led by the Hero. Engine: resolveFleet.
    # p.329: "It is a unique vessel, only one may ever be included in the
    # fleet." The borrowed row's own 0-1 does not reach the host, so the limit is here.
    _L["res_exempt"] = dict(re="^flame of asuryan$", needs_re="^prince yriel", pg=319, src=_yex[0],
                            unique_src="It is a unique vessel, only one may ever be included in the fleet.", unique_pg=329)
    _L["aboard"] = dict(_YR_ABOARD)
    _yn[2] += 1
assert _yn == [2, 2, 2], _yn
print("Prince Yriel added to %d Corsair lists (p.319)" % _yn[2])

# p.319: the RESERVES AND ALLIES paragraph (Corsair reserves) and Prince Yriel's
# box are in the same section. Ownerless sentences showed on Yriel's
# card, although they are the paragraph's ("An Eldar Hero must lead the fleet in
# order to use Corsair Eldar vessels as reserves") or the box's narrative
# ("Unlike an Exarch ..."); spot check 15 row 59. ownx: on nobody's card.
_yr = 0
for Lx in lists_out:
    for s in Lx["secs"]:
        if s["t"] != "RESERVES AND ALLIES" or not s.get("own"):
            continue
        if "Prince Yriel" not in s["own"]:
            continue
        for _i, _o in enumerate(s["own"]):
            if _o:
                continue
            s["own"][_i] = "RESERVES AND ALLIES"
            _ox = s.setdefault("ownx", [])
            if _i not in _ox:
                _ox.append(_i)
            _yr += 1
assert _yr >= 6, "Yriel: at least 6 reserve paragraph sentences expected, found %d" % _yr

# --- Spot check 19, J42: the make-up of squadrons (Fleets p.13) --------------
# "A single escort may be taken in a fleet as long as there are no other
# escorts in the fleet and no other restrictions due to the fleet list, such
# as a minimum of six escorts in a squadron, these restrictions cannot be
# ignored." The exception (lone) concerns the lists whose sentence refers to p.13
# ("in squadrons of 2-6 unless specified (see pg 13)"); the lists that set their
# own size (Rogue Traders, Pirates, Necrons, Tyranids, Tau Defenders) do not get it.
_lone = 0
for Lx in lists_out:
    for s in Lx["secs"]:
        for r in s.get("rules") or []:
            if r.get("kind") == "squadron" and re.search(r"see pg\.?\s*13", str(r.get("src", "")), re.I):
                r["lone"] = 1
                _lone += 1
assert _lone == 21, "21 squadron rules referring to p.13 expected, found %d" % _lone
# Armageddon p.43: "* Space Marine vessels may not be squadroned with
# non-Space Marine vessels." (split_fl). Tau p.455: "Defenders are fielded in
# squadrons of 2-6 ships. They may be combined in squadrons with Messengers if
# you wish. They may not be combined with Orcas." (with_pick).
_sq = 0
for Lx in lists_out:
    _titles = [x["t"].strip().lower() for x in Lx["secs"]]
    _txt = " ".join(t for x in Lx["secs"] for t in (x.get("text") or []))
    for s in Lx["secs"]:
        for r in s.get("rules") or []:
            if r.get("kind") != "squadron":
                continue
            if Lx["nm"] == "Imperial Navy — Armageddon Sector":
                assert "Space Marine vessels may not be squadroned with non-Space Marine vessels" in _txt
                r["split_fl"] = 1
                _sq += 1
            if Lx["nm"] in ("Tau — Merchant Fleet", "Tau — Commerce Protection") and \
                    str(r.get("src", "")).startswith("Defenders are fielded"):
                assert "They may be combined in squadrons with Messengers if you wish." in _txt
                assert _titles.count("escorts") == 1, Lx["nm"]
                r["with_pick"] = [dict(sec=_titles.index("escorts"), re="^messenger", _t="escorts")]
                _sq += 1
assert _sq == 3, "3 squadron flags (Armageddon + two Tau lists) expected, found %d" % _sq

# --- Spot check 19, J45: the Nate Montes condition (p.179) -------------------
# "Siluria Class Light Cruisers and Havoc Class Frigates are older, outdated
# ships, and much more commonly seen outside of the Imperial Navy. If both
# players agree before the game, these ships can be included in a Rogue Trader
# fleet, as a cruiser and an escort respectively." The extraction left the section's
# text empty on all three RT lists, so the condition did not show.
_NM_TXT = ("Siluria Class Light Cruisers and Havoc Class Frigates are older, outdated ships, and much more "
           "commonly seen outside of the Imperial Navy. If both players agree before the game, these ships "
           "can be included in a Rogue Trader fleet, as a cruiser and an escort respectively.")
_NM_NOTE = "Only if both players agree before the game (Fleets p. 179)."
_nm = 0
for Lx in lists_out:
    for s in Lx["secs"]:
        if s["t"].strip().upper() != "NOTES FROM NATE MONTES":
            continue
        assert not s.get("text") and not s.get("own"), Lx["nm"]
        s["text"] = [_NM_TXT]
        for e in s["ents"]:
            if e.get("k") == "up":
                continue
            e["nt"] = (e["nt"] + " " + _NM_NOTE) if e.get("nt") else _NM_NOTE
            _nm += 1
assert _nm == 6, "6 Nate Montes rows expected, found %d" % _nm

# --- Spot check 19 round 2: list rules (M10r2) ------------------------------
def _p19_text(L, i):
    x = L["secs"][i]
    return " ".join(list(x.get("text") or []) + [r.get("src", "") for r in x.get("rules") or []])


# J55 p.456: "It may also include up to one Hero class starship for every other
# type of capital ship in the fleet." T18 (the user's decision 11.9.): one Hero
# for every other kind of ship; configurations of the same class are one kind
# (distinct). The base is the list's own Battleships and Cruisers sections.
# J56 p.457: "Up to one Rogue Trader cruiser and its attendant escorts may
# accompany the fleet for every 750 points of Tau ships in the fleet.
# Additionally, a single squadron of up to six Xenos escorts can be taken as per
# the Rogue Trader rules and fleet list." Squadrons 2-6 (RT p.174) and squadrons
# at most cruisers + 1.
_CP = _p18_list("Tau — Commerce Protection")
_cpb, _cpc, _cpr = _p18_sec(_CP, "Battleships"), _p18_sec(_CP, "Cruisers"), _p18_sec(_CP, "Rogue Traders")
_HERO_SRC = "It may also include up to one Hero class starship for every other type of capital ship in the fleet."
assert "up to one Hero class starship for every other type of capital ship" in _p19_text(_CP, _cpc), "CP: the Hero sentence is missing"
_CP["secs"][_cpc].setdefault("rules", []).append(dict(
    kind="ratio", allow=1, per=1, ok=True, distinct=1,
    label="Hero class starships (one per other type of capital ship)",
    allow_type="Hero class starships", per_type="other types of capital ship",
    allow_pick=[dict(sec=_cpc, re="^hero", _t="cruisers")],
    per_pick=[dict(sec=_cpb, _t="battleships"), dict(sec=_cpc, re="^(?!hero)", _t="cruisers")], src=_HERO_SRC))
_XE_SRC = ("Additionally, a single squadron of up to six Xenos escorts can be taken as per the Rogue Trader "
           "rules and fleet list.")
assert "a single squadron of up to six Xenos escorts" in _p19_text(_CP, _cpr), "CP: the Xenos sentence is missing"
_CP_ESC = [dict(sec=_cpr, re="xenos|recommissioned|iconoclast|cargo", _t="rogue traders")]
_CP["secs"][_cpr].setdefault("rules", []).extend([
    dict(kind="squadron", min=2, max=6, ok=True, sec=[_cpr], pick=_CP_ESC,
         src="Up to one Rogue Trader cruiser and its attendant escorts may accompany the fleet for every 750 "
             "points of Tau ships in the fleet. " + _XE_SRC),
    dict(kind="compare", op="<=", ok=True, a_units=1, b_add=1,
         label="Rogue Trader escort squadrons (one per Rogue Trader cruiser, plus one Xenos squadron)",
         a_pick=_CP_ESC, b_pick=[dict(sec=_cpr, re="rogue trader cruiser|dauntless|endeavour", _t="rogue traders")],
         src=_XE_SRC)])

# J57 p.487: "For every three Demiurg capital ships in the fleet, it may include
# one squadron of up to six Tau or Rogue Trader escorts." and "Tau, Nicassar and
# Rogue Trader escorts may not be mixed in the same squadrons." The list sets no
# minimum size, so p.13's single escort exception applies (lone).
_WH = _p18_list("Demiurg — War Host")
_DW_SRC = ("For every three Demiurg capital ships in the fleet, it may include one squadron of up to six Tau "
           "or Rogue Trader escorts.")
assert any(_DW_SRC in _p19_text(_WH, i) for i in range(len(_WH["secs"]))), "War Host: the escort sentence is missing"
for _t in ("Tau Escorts", "Rogue Trader Escorts"):
    _i = _p18_sec(_WH, _t)
    _WH["secs"][_i].setdefault("rules", []).append(dict(
        kind="squadron", min=2, max=6, lone=1, ok=True, sec=[_i],
        src=_DW_SRC + " Tau, Nicassar and Rogue Trader escorts may not be mixed in the same squadrons."))

# J61 p.177: a required cargo squadron "in a squadron of 2 to 6 ships" and "Any
# number of cargo ships beyond this number may be taken and organized in
# squadrons that only contain cargo ships."
_EX = _p18_list("Rogue Traders — Exploration")
_ext, _exe = _p18_sec(_EX, "TRANSPORTS"), _p18_sec(_EX, "ESCORTS")
_cs = [r["src"] for r in _EX["secs"][_ext].get("rules") or [] if r.get("label") == "Cargo ship squadron"]
assert len(_cs) == 1, "Exploration: the cargo rule is not found exactly once"
_EX["secs"][_ext]["rules"].append(dict(
    kind="squadron", min=2, max=6, ok=True, sec=[_ext],
    pick=[dict(sec=_ext, re="cargo|freighter|q-ship|escort carrier", _t="transports"),
          dict(sec=_exe, re="cargo vessel", _t="escorts")],
    src=_cs[0] + " Any number of cargo ships beyond this number may be taken and organized in squadrons "
                 "that only contain cargo ships."))

# J62 p.372: "Tiddla skwadron 3-10 Escorts, chosen from the following list in any mix desired"
_CZ = _p18_list("Orks — Da Ork Clanz")
_tz = _p18_sec(_CZ, "Tiddla skwadron")
assert not _CZ["secs"][_tz].get("rules"), "Clanz: the tiddla section already has a rule"
_CZ["secs"][_tz]["rules"] = [dict(kind="squadron", min=3, max=10, ok=True, sec=[_tz],
                                  src="Tiddla skwadron 3-10 Escorts, chosen from the following list in any mix desired")]

# J63 p.318: "an Autarch must be included to lead it. Eldar Autarch (Ld 9) ...
# Iyanden Bearer of the Flame (Ld 10)" - the Dragonship exception ("If your fleet is
# led by an Autarch") concerns the whole Autarch section, not only the name that has the word.
_IY = _p18_list("Eldar — Iyanden Craftworld")
_ia = _p18_sec(_IY, "Autarch")
assert any("Bearer of the Flame" in e["l"] for e in _IY["secs"][_ia]["ents"]), "Iyanden: the Bearer is missing"
_iy = 0
for x in _IY["secs"]:
    for r in x.get("rules") or []:
        ex = r.get("exempt") or {}
        if any(p.get("re") == "autarch" for p in ex.get("cond_pick") or []):
            ex["cond_pick"] = [dict(sec=_ia, _t="autarch")]
            _iy += 1
assert _iy == 1, "Iyanden: 1 Autarch exception expected, found %d" % _iy

# J64 and J65 p.431: "Up to 10 % of the fleet's points allowance may be spent on
# Ordnance markers as long as at least one hive ship is chosen." The markers are
# upgrades bought for ships (up_sec). "You may include between 6 and 12
# escort class ships for each hive ship. If no hive ships are chosen, only
# Kraken and Vanguard drone ships may be included in the fleet." The upper limit concerns
# only a fleet with a hive ship (when_pick).
_HF = _p18_list("Tyranids — Hive Fleet")
_hs, _ho = _p18_sec(_HF, "HIVE SHIPS"), _p18_sec(_HF, "ORDNANCE")
_hf = 0
for x in _HF["secs"]:
    for r in x.get("rules") or []:
        if r.get("kind") == "points_share" and str(r.get("label", "")).startswith("Ordnance markers"):
            r["up_sec"] = _ho
            _hf += 1
        if r.get("label") == "Escorts per hive ship (max)":
            r["when_pick"] = [dict(sec=_hs, _t="hive ships")]
            _hf += 1
assert _hf == 2, "Hive Fleet: 2 ordnance and escort rules expected, found %d" % _hf

# --- Spot check 19 round 3 (M10r3) --------------------------------------------
# J70 p.177: "At least one Demiurg vessel of any class may be taken for every
# three Rogue Trader cruisers in the fleet. This is separate from and in addition
# to any reserve or allied cruisers taken, but each Demiurg vessel taken still
# counts against the twelve-cruiser limit, and no more than one Stronghold may be
# taken." "At least one" is read leniently (T20): one at once from the first
# cruiser, then one per three (min_one); the base is the list's own
# capital ships and the Siluria.
_exd, _exc, _exn = _p18_sec(_EX, "The Demiurg"), _p18_sec(_EX, "CAPITAL SHIPS"), _p18_sec(_EX, "NOTES FROM NATE MONTES")
assert not _EX["secs"][_exd].get("rules"), "Exploration: the Demiurg section already has a rule"
assert "At least one Demiurg vessel of any class may be taken" in _p19_text(_EX, _exd)
_EX["secs"][_exd]["rules"] = [dict(
    kind="ratio", allow=1, per=3, min_one=1, ok=True, label="Demiurg vessels (one per three Rogue Trader cruisers)",
    # T20 is an open interpretation (user 11.9.2026): the lenient reading is allowed, but
    # the check warns when the strict reading ("one for every three") is not met.
    interp=dict(id="T20", strict="min_one",
                note="Open interpretation: \"At least one Demiurg vessel of any class may be taken for every three "
                     "Rogue Trader cruisers in the fleet\" (Fleets p. 177) can also be read as one per full three "
                     "cruisers, which allows none with one or two. The app allows one; agree with your opponent."),
    allow_type="Demiurg vessels", per_type="Rogue Trader cruisers",
    allow_pick=[dict(sec=_exd, _t="the demiurg")],
    per_pick=[dict(sec=_exc, _t="capital ships"), dict(sec=_exn, re="^siluria", _t="notes from nate montes")],
    src="At least one Demiurg vessel of any class may be taken for every three Rogue Trader cruisers in the fleet.")]

# J71 p.370: "A vessel or escort skwadron led by a Warlord may be given up to one
# of the following upgrades per Command re-roll the Warlord has. Each upgrade can
# only be applied once." A Warlord has one re-roll and can buy one or
# two more (p.372). Attachment is not modelled (J8), so at fleet level:
# at most as many Gubbins as the sum of the Warlords' re-rolls (up_budget).
_czg, _czw = _p18_sec(_CZ, "GUBBINS"), _p18_sec(_CZ, "WARLORD")
# Which row of the Gubbins section uses up the re-roll allowance: not More Gubbins (p.371 "any number of capital ships",
# T31) nor Deathskullz's free looted copy (p.369, J7: a clan benefit, not a Gubbin - J232). The same expression
# in the Warlord's own check (clanz.gub_re below), so that they do not drift apart.
_CZ_GUB_RE = r"^(?!Klaws|Shokk-Attack Lance|Assault Karrier|.*\(Deathskullz: free\))"
_CZ["secs"][_czg].setdefault("rules", []).append(dict(
    kind="up_budget", ok=True, up_sec=_czg, label="Gubbins (one per Warlord re-roll)",
    # p.371 MORE GUBBINS: "The following gubbins can be taken by any number of
    # capital ships in the fleet" - they do not use the re-roll budget (T31).
    up_re=_CZ_GUB_RE,
    budget=[dict(pick=[dict(sec=_czw, _t="warlord")], units=1),
            dict(up_sec=_czw, up_re="^One extra re-roll", weight=1),
            dict(up_sec=_czw, up_re="^Two extra re-rolls", weight=2)],
    src="A vessel or escort skwadron led by a Warlord may be given up to one of the following upgrades per "
        "Command re-roll the Warlord has. Each upgrade can only be applied once."))

# J72 p.100: "Any Imperial Navy battleship, grand cruiser or battlecruiser may
# have a Space Marine Captain assigned to it." The list has no Imperial Navy
# hulls (the reserves are text only, J73), so there is no ship for the Captain.
_DM = _p18_list("Space Marines — Dominion")
_dmc = _p18_sec(_DM, "Space Marine Captains")
_DM["secs"][_dmc].setdefault("rules", []).append(dict(
    kind="ratio", allow=1, per=1, ok=True,
    label="Space Marine Captains (one per Imperial Navy battleship, grand cruiser or battlecruiser)",
    allow_type="Space Marine Captains", per_type="Imperial Navy battleships, grand cruisers or battlecruisers",
    allow_pick=[dict(sec=_dmc, re="^space marine captain", _t="space marine captains")], per_pick=[],
    src="Any Imperial Navy battleship, grand cruiser or battlecruiser may have a Space Marine Captain assigned to it."))

# J78 p.40: "As long as at least one Space Marine Battle barge is included you may
# choose a Master of the Fleet, who will always be assigned to a Battle barge and
# cannot be assigned to a non-Space Marine ship. As long as the fleet includes at
# least one Imperial capital ship it may include a fleet-admiral, admiral or solar
# admiral, who will always be assigned to an Imperial Navy vessel and cannot be a
# assigned to a Space Marine vessel." Attachment is not modelled (J8), the condition is.
_AR = _p18_list("Imperial Navy — Armageddon Sector")
_arf, _arb, _arbc, _arc = [_p18_sec(_AR, _t) for _t in ("Fleet Commander", "Battleships", "Battlecruisers", "Cruisers")]
assert "As long as at least one Space Marine" in " ".join(_p19_text(_AR, _i) for _i in range(len(_AR["secs"]))), \
    "Armageddon: the commander sentence is missing"
_AR["secs"][_arf].setdefault("rules", []).extend([
    dict(kind="requires", ok=True, label="Master of the Fleet needs a Space Marine battle barge",
         if_pick=[dict(sec=_arf, re="^master of the fleet", _t="fleet commander")],
         then_pick=[dict(sec=_arb, re="space marine battle barge", _t="battleships")], min=1,
         src="As long as at least one Space Marine Battle barge is included you may choose a Master of the Fleet, "
             "who will always be assigned to a Battle barge and cannot be assigned to a non-Space Marine ship."),
    dict(kind="requires", ok=True, label="Admiral needs an Imperial capital ship",
         if_pick=[dict(sec=_arf, re="admiral", _t="fleet commander")],
         then_pick=[dict(sec=_arb, re="^(?!space marine)", _t="battleships"), dict(sec=_arbc, _t="battlecruisers"),
                    dict(sec=_arc, re="^(?!space marine)", _t="cruisers")], min=1,
         src="As long as the fleet includes at least one Imperial capital ship it may include a fleet-admiral, "
             "admiral or solar admiral, who will always be assigned to an Imperial Navy vessel and cannot be a "
             "assigned to a Space Marine vessel.")])

# J81 p.234/236/240/244/248: "You can only include a Chaos Warmaster in your fleet
# if it includes any capital ships." Capital ships are the Planet Killer, the Chaos
# Space Hulk (p.288 "counts as a battleship"), battleships, grand and heavy
# cruisers, cruisers and the Activated Blackstone Fortress (a lenient reading).
_WM_SRC = "You can only include a Chaos Warmaster in your fleet if it includes any capital ships."
_WM_CAP = ("planet killer", "chaos space hulk", "battleships", "grand cruisers", "heavy cruisers", "cruisers",
           "activated blackstone fortress")
_wm = 0
for _L in lists_out:
    if not _L["nm"].startswith("Chaos — "):
        continue
    _hit = [i for i in range(len(_L["secs"])) if _WM_SRC in _p19_text(_L, i)]
    if not _hit:
        continue
    _i = _hit[0]
    _tt = [x["t"].strip().lower() for x in _L["secs"]]
    _caps = [j for j, t in enumerate(_tt) if t in _WM_CAP]
    assert len(_caps) == len(_WM_CAP), (_L["nm"], _caps)
    _L["secs"][_i].setdefault("rules", []).append(dict(
        kind="requires", ok=True, label="Chaos Warmaster needs a capital ship",
        if_pick=[dict(sec=_i, re="^chaos warmaster", _t=_tt[_i])],
        then_pick=[dict(sec=j, _t=_tt[j]) for j in _caps], min=1, src=_WM_SRC))
    _wm += 1
assert _wm == 5, "5 Chaos Warmaster sentences expected, found %d" % _wm

# J82 p.140: "If desired, vessels with an embarking Inquisitor may gain special
# characteristics, depending upon the Ordo the Inquisitor leading the fleet is
# affiliated with." and "The listed cost is added to that of the Inquisitor Lord".
# The Ordo is an addition to the leading Inquisitor Lord: it needs the Lord, and there is one Ordo.
_IQ = _p18_list("The Emperor's Inquisition")
_iql, _iqc = _p18_sec(_IQ, "Inquisitor Lord"), _p18_sec(_IQ, "CAPITAL SHIPS")
_iqo = [_p18_sec(_IQ, _t) for _t in ("ORDO HERETICUS INQUISITORS", "ORDO XENOS INQUISITORS", "ORDO MALLEUS INQUISITORS")]
_ORDO_SRC = "The listed cost is added to that of the Inquisitor Lord, and its benefits apply to the ship they are embarked upon."
_ORDO_AFF = ("If desired, vessels with an embarking Inquisitor may gain special characteristics, depending upon "
             "the Ordo the Inquisitor leading the fleet is affiliated with.")
_iqs = _p18_sec(_IQ, "INQUISITORS OF THE ORDOS")
assert _ORDO_AFF in _p19_text(_IQ, _iqs), "Inquisition: the Ordo sentence is missing"
# The extraction dropped the p.140 price sentence from the section text; it belongs in view for the reader.
assert _ORDO_SRC not in _p19_text(_IQ, _iqs)
_IQ["secs"][_iqs]["text"].append(_ORDO_SRC)
_ordo_pick = [dict(sec=i, re="inquisitor lord", _t=_IQ["secs"][i]["t"].strip().lower()) for i in _iqo]
_IQ["secs"][_iqo[0]].setdefault("rules", []).extend([
    dict(kind="requires", ok=True, label="Ordo Inquisitor needs an Inquisitor Lord",
         if_pick=_ordo_pick, then_pick=[dict(sec=_iql, re="^inquisitor lord", _t="inquisitor lord")], min=1,
         src=_ORDO_SRC),
    dict(kind="cap", ok=True, max=1, what="Ordo affiliations", label="Ordo affiliation (one Ordo)", pick=_ordo_pick,
         src=_ORDO_AFF)])

# J83 p.138: "A Space Marine fleet led by an Ordo Malleus Inquisitor including at
# least 1000 points of Inquisition vessels and Grey Knights strike cruisers may
# include a single Grey Knights battle barge." The barge itself does not count towards the 1 000 points
# (T22). The "Space Marine fleet" condition cannot be checked: the list is attached to the host.
_GKB_SRC = ("A Space Marine fleet led by an Ordo Malleus Inquisitor including at least 1000 points of Inquisition "
            "vessels and Grey Knights strike cruisers may include a single Grey Knights battle barge.")
assert "may include a single Grey Knights" in _p19_text(_IQ, _iqc), "Inquisition: the Battle barge sentence is missing"
_gkb = [dict(sec=_iqc, re="^grey knights battle barge", _t="capital ships")]
_IQ["secs"][_iqc].setdefault("rules", []).extend([
    dict(kind="requires", ok=True, label="Grey Knights Battle barge needs an Ordo Malleus Inquisitor",
         if_pick=_gkb, then_pick=[dict(sec=_iqo[2], re="inquisitor lord", _t="ordo malleus inquisitors")], min=1,
         src=_GKB_SRC),
    dict(kind="per_points", ok=True, each=1, per=1000, full=True, what="Grey Knights Battle barge",
         label="Grey Knights Battle barge (1000 points of Inquisition vessels and Grey Knights strike cruisers)",
         pick=_gkb, of_pick=[dict(sec=_iqc, re="^(?!grey knights battle barge)", _t="capital ships")], src=_GKB_SRC)])

# J84 p.174: "Any fleet except Necrons or Tyranids may include a single Rogue Trader
# capital ship. Tau, Demiurg and Imperial fleets may include one Rogue Trader cruiser
# for every 750 points or part thereof in their fleet." The host fleet is not known,
# so a lenient limit: one cruiser per 750 points or part (T23). Heavy
# transports are transports (they may be taken in squadrons), not cruisers.
_RTL = _p18_list("Rogue Traders")
_rtc, _rtn = _p18_sec(_RTL, "CAPITAL SHIPS"), _p18_sec(_RTL, "NOTES FROM NATE MONTES")
_RTC_SRC = ("Any fleet except Necrons or Tyranids may include a single Rogue Trader capital ship. Tau, Demiurg and "
            "Imperial fleets may include one Rogue Trader cruiser for every 750 points or part thereof in their fleet.")
assert "may include a single Rogue Trader capital ship" in _p19_text(_RTL, _rtc), "Rogue Traders: the sentence is missing"
_RTL["secs"][_rtc].setdefault("rules", []).append(dict(
    kind="per_points", ok=True, each=1, per=750, what="Rogue Trader cruiser",
    label="Rogue Trader cruisers (one per 750 points or part)",
    # T23 is an open interpretation (user 11.9.2026).
    interp=dict(id="T23", strict_max=1,
                note="Open interpretation: any fleet may include \"a single Rogue Trader capital ship\"; only Tau, "
                     "Demiurg and Imperial fleets may include one Rogue Trader cruiser for every 750 points (Fleets "
                     "p. 174). The app does not know the fleet you join and allows the larger number."),
    pick=[dict(sec=_rtc, re="rogue trader cruiser|dauntless|endeavour", _t="capital ships"),
          dict(sec=_rtn, re="^siluria", _t="notes from nate montes")], src=_RTC_SRC))

# J44 p.175: "To represent this each Rogue Trader cruiser and escort squadron may
# roll one random crew skill on [???] in the Remastered Rulebook for +10% point
# value." The table is Rulebook p.159 (CREW SKILLS). Price = 10 % of the unit's points
# before the crew skill, rounded up (T27). p=None: the app shows "see text", and
# the domain counts the price from the field pct (no app change, user 11.9.).
_rtb = _p18_sec(_RTL, "THE BEST MONEY CAN BUY")
_CS_SRC = ("To represent this each Rogue Trader cruiser and escort squadron may roll one random crew skill on [???] "
           "in the Remastered Rulebook for +10% point value.")
assert _CS_SRC in _p19_text(_RTL, _rtb), "Rogue Traders: the crew skill sentence is missing"
_rtbe = _RTL["secs"][_rtb]["ents"]
_xc = [e for e in _rtbe if e["l"] == "Xenotech System, rolled randomly (cruiser)"]
_xe = [e for e in _rtbe if e["l"] == "Xenotech System, rolled randomly (escort, per ship)"]
assert len(_xc) == 1 and len(_xe) == 1 and not any(e["l"].startswith("Crew skill") for e in _rtbe)
_CS_DESC = ("Roll D6 on the Crew Skills table (Rulebook p. 159) before the game and note the result. Cost: +10% of the "
            "unit's points (hull, options and refits), rounded up. (Fleets p. 175)")
_rtbe.extend([
    dict(l="Crew skill, rolled randomly (cruiser, +10% of its points)", r=None, p=None, pct=10, a=1, u=1, mx=None,
         nt=None, prose=1, k="up", cond=dict(_xc[0]["cond"]), desc=_CS_DESC, src_page=175),
    # A crew skill is not a refit, so the Fast Clipper's "Instead of taking a refit" does not apply to it.
    dict(l="Crew skill, rolled randomly (escort squadron, +10% of its points)", r=None, p=None, pct=10, a=1, u=1,
         mx=None, nt=None, prose=1, k="up",
         cond={k: v for k, v in _xe[0]["cond"].items() if k != "offopt"}, desc=_CS_DESC, src_page=175)])

# J86 p.233, 235, 237 ORDNANCE: "Ships with torpedo tubes are armed with normal and
# boarding torpedoes." The extraction dropped the sentence from three lists. On the Nurgle,
# Khorne and Slaanesh pages (241, 245, 249) the paragraph breaks off in the book itself before
# the sentence (T25, asked of the user).
_CT_SRC = "Ships with torpedo tubes are armed with normal and boarding torpedoes."
for _nm in ("Chaos — Incursion", "Chaos — Black Crusade", "Chaos — Tzeentch"):
    _L = _p18_list(_nm)
    _tx = _L["secs"][_p18_sec(_L, "ORDNANCE")].setdefault("text", [])
    assert _tx and _tx[0].startswith("Ships with launch bays") and not any("torpedo tubes" in t for t in _tx), _nm
    _tx.insert(1, _CT_SRC)
# T25 (the user's decision 11.9.2026): the Nurgle, Khorne and Slaanesh paragraph breaks off
# in the book (p.241 "Ships with torpedo", p.245 and 249 "can have a mixture"; page images).
# It is completed with the parallel lists' sentences (p.235), and the reader is told so.
_CL_SRC = ("Ships with launch bays can have a mixture of Swiftdeath fighters, Doomfire bombers and Dreadclaw "
           "assault craft.")
for _nm in ("Chaos — Nurgle", "Chaos — Khorne", "Chaos — Slaanesh"):
    _L = _p18_list(_nm)
    _tx = _L["secs"][_p18_sec(_L, "ORDNANCE")].setdefault("text", [])
    assert _tx and _tx[0].startswith("Ships with launch bays can have a mixture"), _nm
    assert not any("torpedo tubes" in t for t in _tx), _nm
    _tx[0] = _CL_SRC
    _tx.insert(1, _CT_SRC)
    _L["secs"][_p18_sec(_L, "ORDNANCE")].setdefault("notes", []).append(
        "The paragraph breaks off in the book; completed from the other Chaos fleet lists, Fleets p. 235.")

# v1.1 gaps in view (user 11.9.2026): rules the app does not yet
# enforce are shown in the fleet's checks as a warning (kind "notice").
_HOOK_LBL = "Gravitic hook capacity (Orcas, Wardens, Dhows): check by hand"
# The War Host's sentence breaks off mid-way in the book ("...for every starship in the fleet
# equipped with gravitic hooks" without a number), so there the capacity cannot be
# enforced without inventing a number. On the Tau lists the sentence is whole -> J95.
# J213 (the user 20.10.2026 asked to implement everything): the number is still missing, so the rule
# is read the Tau lists' way (p.454-457: as much as the hook capacity) and
# exceeding it shows yellow, not red - open interpretation T50.
_WH_HOOK = "Nicassar Dhows, Tau Wardens or Orcas can be taken for every starship in the fleet equipped with gravitic hooks."
_L = _p18_list("Demiurg — War Host")
_whe = _p18_sec(_L, "ESCORTS")
assert _WH_HOOK in _L["secs"][_whe].get("text", []), "War Host: the hook sentence is missing from the ESCORTS section"
_L["secs"][_whe].setdefault("rules", []).append(dict(
    kind="hook_capacity", ok=True, soft=True, label="Gravitic hook capacity (Orcas, Wardens and Dhows)",
    carry=[dict(sec=_p18_sec(_L, "Tau Escorts"), re="^(orca|warden)"),
           dict(sec=_p18_sec(_L, "Nicassar Escorts"), re="dhow")],
    caps=[0, 1, 2], src=_WH_HOOK,
    interp=dict(id="T50", note="Open interpretation: the War Host sentence (Fleets p. 487) gives no number. The app "
                "reads it as the Tau lists do (pp. 454-457): no more Orcas, Wardens and Dhows than the fleet's "
                "gravitic hook capacity, and shows going over it as a warning, not an error.")))

# J95 p.454/456: "You may not have more Orcas and Wardens than the gravitic hook
# capacity of the fleet." p.455/457: "You may not have more Dhows (or Orcas) than
# the gravitic hook capacity of the fleet." and p.457 also: "Gravitic hooks on a
# Custodian battleship or Emissary starship cannot count toward this total."
# The capacity is read from the profile: a hook row says itself what it carries.
_HOOK_CAP_RX = re.compile(r"capacity:\s*(\d+)", re.I)
_hk = 0
for _sh in ships.values():
    _any = _wrd = _dhw = 0
    for _a in (_sh.get("aw") or []):
        if "ravitic hook" not in str(_a[0]).lower():
            continue
        _txt = " ".join(str(_x) for _x in _a).lower()
        _m = _HOOK_CAP_RX.search(_txt)
        _n = int(_m.group(1)) if _m else 1
        if "orca" in _txt and "warden" in _txt:
            _any += _n
        elif "warden" in _txt:
            _wrd += _n
        elif "dhow" in _txt:
            _dhw += _n
        else:
            _any += _n
    if _any or _wrd or _dhw:
        _sh["hk"] = [_any, _wrd, _dhw]
        _hk += 1
assert _hk == 11, "11 gravitic hook hulls expected, found %d" % _hk

_HOOK_A = "You may not have more Orcas and Wardens than the gravitic hook capacity of the fleet."
_HOOK_B = {
    "Tau — Merchant Fleet":
        "You may not have more Dhows (or Orcas) than the gravitic hook capacity of the fleet. A ship may have "
        "either Orcas or Dhows, but not both so the gravitic hook capacity of the fleet is divided between Orcas "
        "and Dhows.",
    "Tau — Commerce Protection":
        "You may not have more Dhows (or Orcas) than the gravitic hook capacity of the fleet. Gravitic hooks on a "
        "Custodian battleship or Emissary starship cannot count toward this total.",
}
for _nm, _srcB in _HOOK_B.items():
    _L = _p18_list(_nm)
    _e, _nv = _p18_sec(_L, "ESCORTS"), _p18_sec(_L, "Nicassar Vessels")
    _L["secs"][_e].setdefault("rules", []).extend([
        dict(kind="hook_capacity", ok=True, label="Gravitic hook capacity (Orcas and Wardens)",
             carry=[dict(sec=_e, re="^(orca|warden)", _t="escorts")], caps=[0, 1], src=_HOOK_A),
        dict(kind="hook_capacity", ok=True, label="Gravitic hook capacity (Dhows and Orcas)",
             carry=[dict(sec=_e, re="^orca", _t="escorts"),
                    dict(sec=_nv, re="dhow", _t="nicassar vessels")], caps=[0, 2], src=_srcB)])
# J92's note about the Dominion reserves was removed on 14.9.2026 (J106): the reserves
# are now in the engine (a named permission res_ok + a cap of twelve cruisers),
# so "not yet in the app" would be wrong information. The book's sentence stays visible
# as section text.

# J88 p.236: "Any ship led by a Lord of Tzeentch (and not the Warmaster!) may be
# granted a Strand of Fortune." Attachment is not modelled (J8): at most as many Strands as
# Chaos Lords.
_TZ = _p18_list("Chaos — Tzeentch")
_tzf, _tzl = _p18_sec(_TZ, "FORCES OF CHAOS"), _p18_sec(_TZ, "Chaos Lords")
_ST_SRC = "Any ship led by a Lord of Tzeentch (and not the Warmaster!) may be granted a Strand of Fortune."
_TZ["secs"][_tzf].setdefault("rules", []).append(dict(
    kind="up_budget", ok=True, up_sec=_tzf, up_re="^Strand of Fortune", label="Strand of Fortune (one per Chaos Lord)",
    budget=[dict(pick=[dict(sec=_tzl, re="^chaos lord", _t="chaos lords")], units=1)], src=_ST_SRC))

# J89 p.318: "In order to take the Flame of Asuryan, an Eldar Hero must lead the
# fleet and be embarked aboard it." p.319 Yriel, Bearer of the Flame: "you may
# instead pick the Flame of Asuryan as his command ship to be embarked on."
_IY = _p18_list("Eldar — Iyanden Craftworld")
_iyd, _iyh, _iya = _p18_sec(_IY, "Dragonships"), _p18_sec(_IY, "Eldar Hero"), _p18_sec(_IY, "Autarch")
_FA_SRC = "In order to take the Flame of Asuryan, an Eldar Hero must lead the fleet and be embarked aboard it."
assert "an Eldar Hero must lead the" in _p19_text(_IY, _iyd), "Iyanden: the Flame sentence is missing"
_IY["secs"][_iyd].setdefault("rules", []).append(dict(
    kind="requires", ok=True, label="Flame of Asuryan needs an Eldar Hero (or Yriel)",
    if_pick=[dict(sec=_iyd, re="^flame of asuryan", _t="dragonships")],
    # Yriel is a row of the RESERVES AND ALLIES section (p.319): without this pick
    # the rule named him in its heading but rejected a Yriel + Flame fleet.
    then_pick=[dict(sec=_iyh, re="^eldar hero", _t="eldar hero"),
               dict(sec=_iya, re="bearer of the flame", _t="autarch"),
               dict(sec=_p18_sec(_IY, "RESERVES AND ALLIES"), re="^prince yriel", _t="reserves and allies")], min=1,
    src=_FA_SRC + " Yriel (Fleets p. 319): \"you may instead pick the Flame of Asuryan as his command ship\"."))

# J66 p.144: "If the fleet is above 750 points an Inquisitor Lord must lead the
# fleet. If an Inquisitorial Cruiser is present the Inquisitor Lord must be
# placed aboard it." One Inquisitor Lord leads the fleet (T19).
_GK = _p18_list("Grey Knights")
_gc = _p18_sec(_GK, "FLEET COMMANDER")
_GK["secs"][_gc].setdefault("rules", []).append(dict(
    kind="section_count", min=0, max=1, ok=True, sec=[_gc], label="Fleet commander (one Inquisitor Lord)",
    src="If the fleet is above 750 points an Inquisitor Lord must lead the fleet. If an Inquisitorial Cruiser "
        "is present the Inquisitor Lord must be placed aboard it."))
