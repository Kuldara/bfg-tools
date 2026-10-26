# -*- coding: utf-8 -*-
"""Stage 16 of the data pipeline (extractor/build_data.py): output.

The stages run in file order when the entry imports the last one; each
imports what it uses from the stages before it. One pipeline script
until 26.10.2026, split by stage for reading, not for reuse.
"""
import json, io, re, collections, os, sys
import upgrades
import swaps, copy
from .chapters_marks import _L
from .inputs import _OUT, io, json, os, sys
from .page_refs import v
from .profile_types import x
from .races import check_races, check_ship_types
from .row_classes import k
from .section_guard import lists_out, stamp_section_names, stat
from .section_kinds import _refs, check_section_kinds, data, missing
from .ships import ships
io.open(_OUT, "w", encoding="utf-8", newline="\n").write(
    json.dumps(data, ensure_ascii=True, separators=(",", ":")))

print("ships %d, lists %d" % (len(ships), len(lists_out)))
print("rules:", {k: v for k, v in stat.items() if k != "text"},
      " enforceable in total", sum(v for k, v in stat.items() if k != "text"))
print("rule sentences to show:", stat["text"])
print("missing profile pages:", missing)
print("bfg_data.json %.0f kB" % (os.path.getsize(_OUT) / 1024))

# --- proof that the guard turns red ----------------------------------------
# A guard that cannot fail the build is no guard. In this mode
# one section is pushed in front of every list - exactly the silent shift
# the names were written against - and every list is required to
# fail. The data is already written to disk, so the change lives only in memory.
if "--prove-guard" in sys.argv:
    survived = []
    for _L in lists_out:
        _moved = [dict(t="INSERTED SECTION", ents=[], rules=[])] + _L["secs"]
        try:
            stamp_section_names(_moved, "proof: " + _L["nm"], stamp_new=False)
        except AssertionError:
            continue
        # A list none of whose rules has a section reference cannot
        # fail - it is recorded, not accepted silently.
        _refs = sum(1 for _sec in _L["secs"] for _r in (_sec.get("rules") or [])
                    for _k in _r if _k.endswith("_sn") or _k == "sn")
        survived.append((_L["nm"], _refs))
    _silent = [x for x in survived if x[1]]
    assert not _silent, ("a section shift did not fail the guard: %s" % _silent)
    print("GUARD: a section shift fails the build on %d/%d lists"
          % (len(lists_out) - len(survived), len(lists_out)))

    # The race and type tables: the same test. One row is removed at a time and
    # the guard is required to notice the gap.
    _lost = dict(lists_out[0]); _lost.pop("race")
    try:
        check_races([_lost])
        raise SystemExit("GUARD: a missing race did not fail the build")
    except AssertionError:
        pass
    _shl = dict(ships); _shl["_koe"] = dict(ships["53"]); _shl["_koe"].pop("rt")
    try:
        check_ship_types(_shl)
        raise SystemExit("GUARD: a missing ship type did not fail the build")
    except AssertionError:
        pass
    _shipsec = next(sec for sec in lists_out[0]["secs"]
                    if any(e.get("r") and e.get("k") != "up" for e in (sec.get("ents") or [])))
    _sk = {"nm": "koe", "secs": [dict(_shipsec)]}
    _sk["secs"][0].pop("ct", None)
    try:
        check_section_kinds([_sk])
        raise SystemExit("GUARD: a missing section kind did not fail the build")
    except AssertionError:
        pass
    print("GUARD: a missing race, ship type and section kind fail the build")
    if survived:
        print("  (without section references: %s)"
              % ", ".join(n for n, _ in survived))
