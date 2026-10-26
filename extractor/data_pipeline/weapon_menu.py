# -*- coding: utf-8 -*-
"""Stage 3 of the data pipeline (extractor/build_data.py): weapon menu.

The stages run in file order when the entry imports the last one; each
imports what it uses from the stages before it. One pipeline script
until 26.10.2026, split by stage for reading, not for reuse.
"""
import json, io, re, collections, os, sys
import upgrades
import swaps, copy
from .ships import _pg, ships
# ---------------------------------------------- menu weapon links
#
# {page: {option index: [armament row indexes]}}
#
# An option not in the list is an ordinary extra purchase and links to no
# row; so it cannot hide armament. Side pairs (Port + Starboard)
# are one choice and two rows, and the hive ship's three side sets
# point to the same rows, because the book prints the side weapons once.
WEAPON_MENU = {
    "330": {0: [0], 1: [1], 2: [2], 3: [3]},          # Dragonship
    "331": {0: [0], 1: [1], 2: [2], 3: [3]},          # Wraithship
    "332": {0: [0], 1: [1]},                          # Shadowhunter
    # Torture: aw0 is the base armament; the rest are extra weapons.
    "352": {0: [1], 1: [2], 2: [3], 3: [4], 4: [4]},
    # Corsair: aw0 is the base armament (Str 2), aw1 is the added Str 3.
    "353": {0: [1], 1: [2], 2: [3], 3: [4]},
    "432": {                                          # Hive ship
        0: [0], 1: [1], 2: [2], 3: [3],               # prow
        4: [4], 5: [5], 6: [6],                       # thorax
        7: [7, 8], 8: [9, 10], 9: [11],               # side set 1
        10: [7, 8], 11: [9, 10], 12: [11],            # side set 2
        13: [7, 8], 14: [9, 10], 15: [11],            # side set 3
    },
    "434": {                                          # Tyranid cruiser
        0: [0], 1: [1], 2: [2], 3: [3],               # prow
        4: [4], 5: [5], 6: [6],                       # thorax
        7: [7, 8], 8: [9, 10],                        # side set 1
        9: [7, 8], 10: [9, 10],                       # side set 2
    },
    "435": {0: [0], 1: [1], 2: [2], 3: [3], 4: [4]},  # Kraken
    "436": {0: [0], 1: [1]},                          # Vanguard drone
    "437": {0: [0], 1: [1], 2: [2]},                  # Escort drone
    "480": {0: [0], 1: [1], 2: [2], 3: [3]},          # Orbitals
    "481": {0: [0], 1: [1], 2: [2], 3: [3]},          # Waystation
}

for _pg, _map in WEAPON_MENU.items():
    if _pg not in ships:
        raise SystemExit("WEAPON_MENU: no ship %s" % _pg)
    _sh = ships[_pg]
    for _oi, _rows in _map.items():
        if _oi >= len(_sh["ol"]):
            raise SystemExit("WEAPON_MENU %s: no option %d" % (_pg, _oi))
        for _r in _rows:
            if _r >= len(_sh["aw"]):
                raise SystemExit("WEAPON_MENU %s: no weapon row %d" % (_pg, _r))
        _sh["ol"][_oi]["aws"] = list(_rows)
