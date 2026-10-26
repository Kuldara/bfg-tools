# -*- coding: utf-8 -*-
"""A wide spot check of one list row (docs/history/registry/PISTOKOE.md,
"Laaja tarkastus", in Finnish). The tool only prints; the comparison with the
book is done by hand.
Runs spot_check with the default configuration, with every option on its own,
with every offered list upgrade on its own and with all options taken,
and prints:
  1. default: points, stats, weapon rows, offered upgrades (others too),
     rules, damage
  2. every option alone: what changes compared with the default (points, stats,
     weapon rows +/-, rules +/-)
  3. every offered upgrade alone (item 6): the same difference to the default and
     the upgrade's own row with its description - does the profile, armament or
     rule change as the upgrade's sentence in the book says
  4. all taken: the printed card text as it is
Usage: python wide_check.py <seed> [--no-card] [--no-ups]
       (seed as in spot_check.js --seed)
"""
import json, os, re, subprocess, sys
os.chdir(os.path.dirname(os.path.abspath(__file__)))


def run(args):
    return subprocess.run(["node", "spot_check.js", "--no-book"] + args, capture_output=True,
                          text=True, encoding="utf-8", errors="replace").stdout


def parse(out):
    d = dict(hdr="", pts=None, mx=None, stats={}, weapons=[], options=[], ups=[], rules=[], dmg="", crit="", card="", lead="", rr="")
    sec = None
    for ln in out.splitlines():
        if ln.startswith("SPOT CHECK"): d["hdr"] = ln[len("SPOT CHECK"):].strip(); continue
        m = re.match(r"kind (\w+).*?points (\d+)\s+maxPoints (\d+)", ln)
        if m: d["kind"], d["pts"], d["mx"] = m.group(1), int(m.group(2)), int(m.group(3)); continue
        if ln.startswith("stats "):
            try: d["stats"] = json.loads(ln[6:])
            except Exception: pass
            continue
        if ln.startswith("leadership "):
            d["lead"] = ln; continue
        if ln.startswith("WEAPONS"): sec = "w"; continue
        if ln.startswith("OPTIONS"): sec = "o"; continue
        if ln.startswith("UPGRADES"): sec = "u"; continue
        if ln.startswith("RULES ON CARD"): sec = "r"; continue
        if ln.startswith("DAMAGE"): d["dmg"] = ln; sec = None; continue
        if ln.startswith("CRITICAL"): d["crit"] = ln; continue
        if ln.startswith("MEMBERS") or ln.startswith("ISSUES"): sec = None
        if ln.startswith("######## CARD TEXT"): sec = "c"; continue
        if ln.startswith("######## BOOK"): sec = None; continue
        if sec == "w" and ln.startswith("  ["): d["weapons"].append(re.sub(r"\s*\[object Object\](,\[object Object\])*", "", ln.strip()))
        elif sec == "o" and ln.startswith("  ["): d["options"].append(ln.strip())
        elif sec == "u" and ln.startswith("  ["): d["ups"].append(ln.strip())
        elif sec == "r" and ln.startswith("  - "): d["rules"].append(ln.strip()[2:])
        elif sec == "c": d["card"] += ln + "\n"
    return d


def diff(a, b):
    out = []
    if a["pts"] != b["pts"] or a["mx"] != b["mx"]: out.append("  points %s/%s -> %s/%s" % (a["pts"], a["mx"], b["pts"], b["mx"]))
    for k in sorted(set(a["stats"]) | set(b["stats"])):
        if a["stats"].get(k) != b["stats"].get(k): out.append("  stats.%s %s -> %s" % (k, a["stats"].get(k), b["stats"].get(k)))
    wa, wb = set(a["weapons"]), set(b["weapons"])
    for w in [x for x in a["weapons"] if x not in wb]: out.append("  weapon -  " + w)
    for w in [x for x in b["weapons"] if x not in wa]: out.append("  weapon +  " + w)
    ra, rb = set(a["rules"]), set(b["rules"])
    for r in [x for x in a["rules"] if x not in rb]: out.append("  rule -  " + r[:160])
    for r in [x for x in b["rules"] if x not in ra]: out.append("  rule +  " + r[:160])
    if a["dmg"] != b["dmg"]: out.append("  damage: " + b["dmg"][:200])
    if a["lead"] != b["lead"]: out.append("  " + b["lead"][:200])
    # item 7 (spot check 11): the upgrade chain - what becomes offered or goes away
    # when this choice is made (Daemonship -> Mark, crew -> Mark, Strand).
    ua, ub = up_labels(a), up_labels(b)
    for u in [x for x in ub if x not in ua]: out.append("  offered +  " + u)
    for u in [x for x in ua if x not in ub]: out.append("  offered -  " + u)
    return out or ["  (no change)"]


def up_labels(d):
    out = []
    for u in d["ups"]:
        m = UP_LINE.match(u)
        if m and m.group(2).strip() not in out:
            out.append(m.group(2).strip())
    return out


UP_LINE = re.compile(r"\[(\w+)\] (.*?)\s{2,}(-?\d+)")


def main():
    seed = sys.argv[1]
    base = parse(run(["--seed", seed]))
    print("################ DEFAULT  " + base["hdr"])
    print("points %s / max %s  stats %s" % (base["pts"], base["mx"], json.dumps(base["stats"], ensure_ascii=False)))
    if base["lead"]: print(base["lead"][:220])
    for w in base["weapons"]: print("  " + w)
    if base["options"]:
        print("OPTIONS:"); [print("  " + o[:230]) for o in base["options"]]
    if base["ups"]:
        print("UPGRADES (own/other, offered):"); [print("  " + u[:200]) for u in base["ups"]]
    print("RULES:"); [print("  - " + r[:230]) for r in base["rules"]]
    print(base["dmg"][:230]); print(base["crit"][:160])
    idx = [int(m.group(1)) for o in base["options"] for m in [re.match(r"\[\w+\] (\d+)\.", o)] if m]
    for i in idx:
        one = parse(run(["--seed", seed, "--opt", str(i)]))
        print("################ OPTION %d ALONE" % i)
        for ln in diff(base, one): print(ln)
    if "--no-ups" not in sys.argv:
        for u in base["ups"]:
            m = UP_LINE.match(u)
            if not m or m.group(1) == "take":
                continue                         # required: already in the default
            lab = m.group(2).strip()
            # spot_check --up compares as a substring (case does not matter)
            one_out = run(["--seed", seed, "--up", lab])
            one = parse(one_out)
            mine = [x for x in one["ups"] if x.startswith("[take] " + lab)]
            print("################ UPGRADE ALONE: %s" % lab)
            if mine: print("  row: " + mine[0][:230])
            else: print("  row: (not taken - check)")
            for ln in diff(base, one): print(ln)
    allp = parse(run(["--seed", seed, "--all"]))
    print("################ ALL TAKEN: change from the default")
    for ln in diff(base, allp): print(ln)
    if "--no-card" not in sys.argv:
        print("################ CARD TEXT (all taken)")
        print(allp["card"].rstrip())


if __name__ == "__main__":
    main()
