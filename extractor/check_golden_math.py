# -*- coding: utf-8 -*-
"""A golden case's reasoning arithmetic matches its expectation.

A fleet case's `why` often ends in a sum: "3 x Devastation 190 +
Retaliator 260 + Chaos Space Marine crew 35 = 865", and `expect.total` is
865. Two numbers, one written by hand - if they differ, either the reasoning
or the expectation is wrong, and a green test then proves the wrong thing.
The test itself cannot notice it, because it only compares the app with the expectation.

This reads the sum from the reasoning and compares the total with the expectation. A term is either
"k x name price" (a product) or "name price" (the last number). A page reference
inside a term ("Tyrant 185 (p.35)") is not a price, and a ratio ("1:3 = 1") is not
a sum - so "= N" needs at least two digits, and if the reasoning has
several sums, the one that claims to give the expectation is compared.
Reasoning without a sum is skipped - a sum is not required.

    python check_golden_math.py
"""
import io
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
REF = os.path.join(HERE, "..", "reference")

EQ = re.compile(r"=\s*(\d[\d ]{1,6})\b")
PAGE = re.compile(u"\\((?:s|pg|p)\\.?\\s*[\\d ,–-]+\\)")
PROD = re.compile(u"^\\s*(\\d+)\\s*[x×]\\s*(.*?)(\\d+)\\s*$")
NUM = re.compile(r"(\d+)")


def expr_before(why, eq_pos):
    """The expression is the stretch before the '=' sign back to the previous full stop or
    colon."""
    head = why[:eq_pos]
    cut = max(head.rfind(". "), head.rfind(": "), head.rfind("\n"))
    return head[cut + 1:] if cut >= 0 else head


SUB = re.compile(r"=\s*(\d+)\s*$")
PROD2 = re.compile(r"(\d+)\s*[x×]\s*(\d+)\s*$")


def evaluate(expr):
    """Terms are separated by a plus or a comma. A term can be
    "k x name price", "name price x k", "name price", or a subtotal
    "13 x Lunar 180 = 2340", in which case the subtotal is the term's value."""
    total = 0
    expr = PAGE.sub(" ", expr)
    for term in re.split(r"\+|,\s", expr):
        term = term.strip()
        if not term:
            return None
        m = SUB.search(term)
        if m:
            total += int(m.group(1))
            continue
        m = PROD.match(term)
        if m:
            total += int(m.group(1)) * int(m.group(3))
            continue
        m = PROD2.search(term)
        if m:
            total += int(m.group(1)) * int(m.group(2))
            continue
        nums = NUM.findall(term)
        if not nums:
            return None
        total += int(nums[-1])
    return total


def main():
    bad, n = [], 0
    for fn in ("golden_fleet_cases.json", "golden_cases.json"):
        p = os.path.join(REF, fn)
        if not os.path.exists(p):
            continue
        for c in json.load(io.open(p, encoding="utf-8")).get("cases", []):
            want = (c.get("expect") or {}).get("total")
            if want is None:
                continue
            why = c.get("why") or ""
            ms = list(EQ.finditer(why))
            if not ms:
                continue
            hit = [m for m in ms if int(re.sub(r"\s", "", m.group(1))) == want]
            m = hit[0] if hit else ms[-1]
            # Without a hit on the expectation: a '= N' under a hundred points is prose
            # ("+10 %", "1:3 = 1"), not a fleet total.
            if not hit and int(re.sub(r"[^0-9]", "", m.group(1))) < 100:
                continue
            stated = int(re.sub(r"\s", "", m.group(1)))
            expr = expr_before(why, m.start())
            got = evaluate(expr)
            n += 1
            if stated != want:
                bad.append("%s/%s: the reasoning says = %d, the expectation is %d"
                           % (fn[:6], c["id"], stated, want))
            elif got is not None and got != stated:
                bad.append("%s/%s: the sum gives %d, the reasoning says = %d  [%s]"
                           % (fn[:6], c["id"], got, stated, expr.strip()[:90]))
    for x in bad:
        print("  " + x)
    print("\nsums checked %d, contradictions %d" % (n, len(bad)))
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main())
