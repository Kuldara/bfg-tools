# -*- coding: utf-8 -*-
"""Produces RULES_AUDIT.md: the book's composition rules vs. the app's checks.

The document is reproducible: run it again when the book or the parser changes,
so the numbers and lists update and do not go stale silently.

Run in this folder:  python rules_audit.py
"""
import io
import json
import os
import re
from datetime import date

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "RULES_AUDIT.md")

d = json.load(io.open(os.path.join(HERE, "..", "data", "bfg_data.json"), encoding="utf-8"))

# A sentence that looks like a composition rule. The same pattern as in the sweep.
PAT = re.compile(r"(?i)(may include|no more than|for every|up to (one|two|three)|"
                 r"may not exceed|must outnumber|per [\d,]+ points|"
                 r"may only (include|take)|^\s*\d\s*[-–]\s*\d|must include|"
                 r"cannot include|maximum of)")
# Campaign and in-game sentences are not fleet building.
SKIP = re.compile(r"(?i)(next game|campaign|roll|scenario|victory point|"
                  r"re-roll for|in your next|table\b)")

# Why a sentence was left unenforced. The order decides: the first hit wins.
REASONS = [
    (re.compile(r"(?i)must outnumber|may not exceed"),
     "a comparison between two hulls; the engine has no such rule type"),
    (re.compile(r"(?i)per [\d,]+ points|for every [\d,]+ points|"
                r"points or (part|portion) thereof"),
     "tied to a points limit, but the target is a ship class and not a section"),
    (re.compile(r"(?i)for every (\w+ )?(hive ship|cruiser-class|"
                r"capital ship|escort|Scythe|Merchant|Explorer)"),
     "a ratio to a ship class, not to a section"),
    (re.compile(r"(?i)^you may include \d+ (admiral|pirate prince|"
                r"master of the fleet|mechanicus archmagos|dread archon|"
                r"or more warlord)"),
     "the number of commanders; already enforced as a section limit (0-1)"),
    (re.compile(r"(?i)any number of"),
     "limits nothing"),
    (re.compile(r"(?i)mark of|terminators|imperative|siren|ark of|"
                r"veil of|daemonic entities"),
     "an equipment or Mark choice, not fleet composition"),
    (re.compile(r"(?i)^(so if|for example|fleets of at least)"),
     "an example of the previous sentence"),
]


def reason(t):
    for rx, why in REASONS:
        if rx.search(t):
            return why
    return "the sentence does not parse with the current patterns"


rows, tot_r, tot_t = [], 0, 0
by_reason = {}
for L in d["lists"]:
    rules = [r for s in L["secs"] for r in s["rules"]]
    left = []
    for s in L["secs"]:
        for t in s["text"]:
            if PAT.search(t) and not SKIP.search(t) and len(t) < 230:
                left.append((s["t"], t, reason(t)))
                by_reason[left[-1][2]] = by_reason.get(left[-1][2], 0) + 1
    tot_r += len(rules)
    tot_t += len(left)
    kinds = {}
    for r in rules:
        kinds[r["kind"]] = kinds.get(r["kind"], 0) + 1
    rows.append((L, rules, kinds, left))

o = []
o.append("# Rules audit")
o.append("")
o.append("The book's composition rules compared with what the app enforces.")
o.append("Produced by `rules_audit.py` on %s. Source: %s" % (date.today(), d["src"]))
o.append("")
o.append("## Summary")
o.append("")
o.append("| | |")
o.append("|---|---|")
o.append("| fleet lists | %d |" % len(d["lists"]))
o.append("| rules enforced by machine | **%d** |" % tot_r)
o.append("| composition sentences left for the player to check | %d |" % tot_t)
o.append("| ship profiles | %d |" % len(d["ships"]))
o.append("| selectable list rows | %d |"
         % sum(len(s["ents"]) for L in d["lists"] for s in L["secs"]))
o.append("")
o.append("Why sentences are left unenforced:")
o.append("")
o.append("| reason | sentences |")
o.append("|---|---|")
for why, n in sorted(by_reason.items(), key=lambda x: -x[1]):
    o.append("| %s | %d |" % (why, n))
o.append("")
o.append("## By list")
o.append("")
for L, rules, kinds, left in rows:
    o.append("### %s (book page %s)" % (L["nm"], L["pg"]))
    o.append("")
    o.append("Enforced **%d** (%s). Left to check %d."
             % (len(rules),
                ", ".join("%s %d" % (k, v) for k, v in sorted(kinds.items()))
                or "none",
                len(left)))
    o.append("")
    if rules:
        o.append("| type | enforced rule |")
        o.append("|---|---|")
        for r in rules:
            o.append("| `%s` | %s |" % (r["kind"], r.get("src", "").replace("|", "\\|")[:150]))
        o.append("")
    if left:
        o.append("| section | sentence not enforced | reason |")
        o.append("|---|---|---|")
        for sec, t, why in left:
            o.append("| %s | %s | %s |"
                     % (sec[:24], t.replace("|", "\\|")[:150], why))
        o.append("")

io.open(OUT, "w", encoding="utf-8", newline="\n").write("\n".join(o) + "\n")
print("%s  %.0f kB" % (OUT, os.path.getsize(OUT) / 1024))
print("enforced %d, left to check %d" % (tot_r, tot_t))
