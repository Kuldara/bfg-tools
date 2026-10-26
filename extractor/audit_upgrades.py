# -*- coding: utf-8 -*-
"""Does a list upgrade promise something the card does not do?

audit_effects.py checks a ship's own options. The lists' shared
upgrade rows (Gubbins, clans, the Bakka turret, the Tyranid bio-enhancements,
Daemonships...) were left outside it: the Codex review of 10.9.2026
found Extra Power Fields, which cost 25 points but did not raise the
shields. This tool closes that gap in the same way.

Every list upgrade row offered on a ship's card is classified from the book
by hand in reference/upgrades.json:
    stat    the row has mod or set (the stats line changes)
    weapon  the row has swp, add, del or sw (a weapon row changes)
    text    the card's upgrade box states the rule: the book section's own sentence,
            the row's desc or a rule bound with domain.js's up key
    fleet   a fleet-level purchase without a per-ship effect
Rows whose target is a commander (at -> a commander row), and rows that
the ship's own option covers on every target ship, are left out: they
print on the commander card or are not offered.

Run:  python audit_upgrades.py          summary + open rows
      python audit_upgrades.py -v       every row
      python audit_upgrades.py --json   machine-readable (tools/test.js)
Returns 1 if there are open rows.
"""
import io, json, os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
D = json.load(io.open(os.path.join(HERE, "..", "data", "bfg_data.json"), encoding="utf-8"))
REF = json.load(io.open(os.path.join(HERE, "..", "reference", "upgrades.json"), encoding="utf-8"))
DOMAIN = io.open(os.path.join(HERE, "..", "packages", "rules", "domain.js"), encoding="utf-8").read()
VERBOSE = "-v" in sys.argv
AS_JSON = "--json" in sys.argv

EFF_STAT = ("mod", "set")
EFF_WEAPON = ("swp", "add", "del", "sw")

# domain.js rules that print when the upgrade is taken (up key).
UP_RULES = [re.compile(m.group(1), re.I if "i" in m.group(2) else 0)
            for m in re.finditer(r"\bup:/((?:[^/\\]|\\.)+)/([a-z]*)", DOMAIN)]


def tokens(t):
    return [w for w in re.sub(r"[^a-z0-9 ]", " ", str(t or "").lower()).split() if len(w) > 2]


def covers(o, en):
    """The same rule as domain.js optionCoversRow."""
    if o.get("cov") and re.search(o["cov"], str(en.get("l") or ""), re.I):
        return o.get("c") == en.get("p")
    want = tokens(en.get("l"))
    if not want:
        return False
    have = tokens(o.get("t"))
    if not all(w in have for w in want):
        return False
    return True if en.get("per") else o.get("c") == en.get("p")


def owned_text(sec, label):
    own = sec.get("own") or []
    return [t for i, t in enumerate(sec.get("text") or []) if i < len(own) and own[i] == label]


def classify(list_name, label):
    for c in REF["classes"]:
        if c.get("list") and not re.search(c["list"], list_name):
            continue
        if re.search(c["match"], label, re.I):
            return c
    return None


rows, skipped_cmd, skipped_cov = [], 0, 0
for L in D["lists"]:
    ship_ents = [e for s in L["secs"] for e in s.get("ents", []) if e.get("r")]
    for si, sec in enumerate(L["secs"]):
        for e in sec.get("ents", []):
            if e.get("k") != "up":
                continue
            targets = None
            if e.get("at"):
                targets = [L["secs"][a]["ents"][b] for a, b in e["at"]]
                if all(not t.get("r") for t in targets):
                    skipped_cmd += 1               # a commander's upgrade
                    continue
                targets = [t for t in targets if t.get("r")]
            else:
                targets = ship_ents
            ships = [D["ships"].get(str(t["r"])) for t in targets]
            ships = [s for s in ships if s]
            if ships and all(any(covers(o, e) for o in (s.get("ol") or [])) for s in ships):
                skipped_cov += 1                   # an own option covers it everywhere
                continue
            lab = str(e["l"])
            has_stat = any(e.get(k) for k in EFF_STAT)
            has_weapon = any(e.get(k) for k in EFF_WEAPON)
            has_text = bool(owned_text(sec, lab) or e.get("desc")
                            or any(rx.search(lab) for rx in UP_RULES))
            c = classify(L["nm"], lab)
            if not c:
                status = "unclassified"
            elif c["class"] == "stat" and not has_stat:
                status = "stat effect missing"
            elif c["class"] == "weapon" and not has_weapon:
                status = "weapon effect missing"
            elif c["class"] == "text" and not has_text:
                status = "rule text missing from the card"
            else:
                status = "ok"
            rows.append(dict(list=L["nm"], sec=sec["t"], label=lab, cls=c["class"] if c else None,
                             page=c.get("page") if c else None, status=status))

open_rows = [r for r in rows if r["status"] != "ok"]
if AS_JSON:
    print(json.dumps(dict(rows=len(rows), open=len(open_rows),
                          unclassified=sum(1 for r in open_rows if r["status"] == "unclassified"),
                          commander=skipped_cmd, covered=skipped_cov), ensure_ascii=False))
    sys.exit(1 if open_rows else 0)

print("List upgrade rows on a ship card: %d (via a commander %d, covered by an own option %d)"
      % (len(rows), skipped_cmd, skipped_cov))
kinds = {}
for r in rows:
    kinds[r["cls"]] = kinds.get(r["cls"], 0) + 1
for k in sorted(kinds, key=str):
    print("  %-8s %d" % (k, kinds[k]))
print("open: %d" % len(open_rows))
seen = set()
for r in (rows if VERBOSE else open_rows):
    key = (r["label"], r["status"])
    if not VERBOSE and key in seen:
        continue
    seen.add(key)
    print("  %-30s | %-26s | %-8s | p.%-4s | %s" % (r["status"], r["label"][:26], r["cls"] or "-",
                                                     r["page"] or "-", r["list"][:30]))
sys.exit(1 if open_rows else 0)
