# -*- coding: utf-8 -*-
"""Golden-tapauksen perustelun laskutoimitus tasmaa sen odotukseen.

Laivastotapauksen `why` paattyy usein laskuun: "3 x Devastation 190 +
Retaliator 260 + Chaos Space Marine crew 35 = 865", ja `expect.total` on
865. Kaksi lukua, yksi kasin kirjoitettu - jos ne eroavat, joko perustelu
tai odotus on vaarin, ja vihrea testi todistaa silloin vaaraa asiaa.
Testi itse ei voi huomata sita, koska se vertaa vain sovellusta odotukseen.

Tama lukee laskun perustelusta ja vertaa summaa odotukseen. Termi on joko
"k x nimi hinta" (tulo) tai "nimi hinta" (viimeinen luku). Sivuviite termin
sisalla ("Tyrant 185 (s.35)") ei ole hinta, ja suhdeluku ("1:3 = 1") ei ole
lasku - siksi "= N" vaatii vahintaan kaksi numeroa, ja jos perustelussa on
monta laskua, verrataan sita, joka vaittaa antavansa odotuksen.
Perustelu, jossa ei ole laskua, ohitetaan - lasku ei ole pakollinen.

    python check_golden_math.py
"""
import io
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
REF = os.path.join(HERE, "referenssi")

EQ = re.compile(r"=\s*(\d[\d ]{1,6})\b")
PAGE = re.compile(u"\\((?:s|pg|p)\\.?\\s*[\\d ,–-]+\\)")
PROD = re.compile(u"^\\s*(\\d+)\\s*[x×]\\s*(.*?)(\\d+)\\s*$")
NUM = re.compile(r"(\d+)")


def expr_before(why, eq_pos):
    """Lauseke on '='-merkkia edeltava jakso edelliseen pisteeseen tai
    kaksoispisteeseen asti."""
    head = why[:eq_pos]
    cut = max(head.rfind(". "), head.rfind(": "), head.rfind("\n"))
    return head[cut + 1:] if cut >= 0 else head


SUB = re.compile(r"=\s*(\d+)\s*$")
PROD2 = re.compile(r"(\d+)\s*[x×]\s*(\d+)\s*$")


def evaluate(expr):
    """Termit erotetaan plussalla tai pilkulla. Termi voi olla
    "k x nimi hinta", "nimi hinta x k", "nimi hinta", tai valisumma
    "13 x Lunar 180 = 2340", jolloin valisumma on termin arvo."""
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
            # Ilman osumaa odotukseen: alle sadan pisteen '= N' on proosaa
            # ("+10 %", "1:3 = 1"), ei laivaston summa.
            if not hit and int(re.sub(r"[^0-9]", "", m.group(1))) < 100:
                continue
            stated = int(re.sub(r"\s", "", m.group(1)))
            expr = expr_before(why, m.start())
            got = evaluate(expr)
            n += 1
            if stated != want:
                bad.append("%s/%s: perustelu sanoo = %d, odotus on %d"
                           % (fn[:6], c["id"], stated, want))
            elif got is not None and got != stated:
                bad.append("%s/%s: lasku antaa %d, perustelu sanoo = %d  [%s]"
                           % (fn[:6], c["id"], got, stated, expr.strip()[:90]))
    for x in bad:
        print("  " + x)
    print("\nlaskuja tarkistettu %d, ristiriitoja %d" % (n, len(bad)))
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main())
