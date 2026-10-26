# -*- coding: utf-8 -*-
"""The Registry's advertised numbers for Python generators (make_og.py):
fleet lists, ship profiles and printable cards.

The rule lives in one place, apps/registry/counts.js, which the build uses
too; this module asks it. Two copies of the rule disagreed until October 2026
(738 vs 1102 cards on the same page).

    from published_counts import COUNTS, check
    check(lists="30")        # AssertionError: the data has 32
"""
import json
import os
import subprocess

HERE = os.path.dirname(os.path.abspath(__file__))
COUNTS_JS = os.path.join(HERE, "..", "counts.js")

COUNTS = json.loads(subprocess.check_output(["node", COUNTS_JS], text=True))


def check(**kw):
    """Checks numbers written into a generator against the data."""
    for k, v in kw.items():
        want = COUNTS[k]
        got = int(str(v).replace(" ", ""))
        assert got == want, "text says %s = %s, data says %d (counts.js)" % (k, v, want)
    return True


if __name__ == "__main__":
    for k in ("lists", "profiles", "cards"):
        print("  %-9s %d" % (k, COUNTS[k]))
