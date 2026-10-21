# -*- coding: utf-8 -*-
"""Vaihtaa lauseiden ryhman referenssi/check_yourself.json:ssa.

Kun tarkistus toteutetaan, sen lause siirtyy ryhmasta "open" ryhmaan
"checked" (tai "row", kun lause kuvaa uutta rivia). Referenssi on
J212:n jalkeen yllapidettava totuus; tee_referenssi.py teki sen kerran.

    python docs/check-yourself/aseta_ryhma.py checked S0106 S0249 ...
    python docs/check-yourself/aseta_ryhma.py drop S1094 --list "Tau — Merchant Fleet"
"""
import io, json, os, sys

HERE = os.path.dirname(os.path.abspath(__file__))
P = os.path.join(os.path.dirname(os.path.dirname(HERE)), "referenssi", "check_yourself.json")


def main(argv):
    g, ids = argv[0], [a for a in argv[1:] if a.startswith("S")]
    lst = argv[argv.index("--list") + 1] if "--list" in argv else None
    doc = json.load(io.open(P, encoding="utf-8"))
    by = {}
    for e in doc["sentences"]:
        by[e["id"]] = e
        for a in e.get("also", []):
            by[a] = e
    miss = [i for i in ids if i not in by]
    assert not miss, "tuntemattomat tunnisteet: %s" % miss
    for i in ids:
        e = by[i]
        if lst:
            e.setdefault("g_by_list", {})[lst] = g
        else:
            e["g"] = g
    tmp = P + ".tmp"
    io.open(tmp, "w", encoding="utf-8").write(json.dumps(doc, ensure_ascii=False, indent=1) + "\n")
    os.replace(tmp, P)
    print("%s -> %s%s" % (" ".join(ids), g, (" (" + lst + ")") if lst else ""))


if __name__ == "__main__":
    main(sys.argv[1:])
