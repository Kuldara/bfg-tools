# -*- coding: utf-8 -*-
"""Draws a statistical spot check sample: N different list rows with consecutive
seeds (spot_check.js --seed is deterministic; the same seed always gives
the same row). Prints a table and writes a JSON from which the rows are gone
through BY HAND following docs/history/registry/PISTOKOE.md (in Finnish) - this
tool only draws.

  python sample_rows.py 2026091301            # 90 rows starting from the seed
  python sample_rows.py 2026091301 --n 30 --out sample.json

The population was 524 list rows on 10.9. (462 units + 62 commanders), 736 on 14.10.;
planetary defences rows are not in it (spot_check.js, J175 f). A sample of 90 rows
gives a share a 95 % interval of about +-9 percentage points (Wilson, FPC 0.91).
Seed = date + running number (2026091301 = 10.9.2026, series 3, no. 01).
"""
import io, json, os, re, subprocess, sys

HERE = os.path.dirname(os.path.abspath(__file__))
HDR = re.compile(r"^SPOT CHECK\s+(.*?)\s+\|\s+(.*?)\s+\|\s+(.*?)\s{2,}(?:\(profile p\.(\S+)\)\s+)?list p\.(\d+)", re.M)


def draw(start, n=90, limit=1000):
    rows, seen, seed, tried = [], set(), int(start), 0
    while len(rows) < n and tried < limit:
        out = subprocess.run(["node", os.path.join(HERE, "spot_check.js"), "--seed", str(seed), "--no-book"],
                             capture_output=True, text=True, encoding="utf-8", errors="replace",
                             cwd=HERE).stdout
        tried += 1
        m = HDR.search(out)
        if m:
            L, sec, lab, prof, lp = m.groups()
            key = (L, sec, lab)
            if key not in seen:
                seen.add(key)
                km = re.search(r"^kind (\w+).*?points (\d+)", out, re.M)
                rows.append(dict(seed=seed, L=L, sec=sec, en=lab, r=prof, lp=int(lp),
                                 kind=km.group(1) if km else "?",
                                 pts0=int(km.group(2)) if km else None))
        seed += 1
    return rows, tried


def main(argv):
    if not argv or not argv[0].isdigit():
        print(__doc__)
        return 2
    start = int(argv[0])
    n = int(argv[argv.index("--n") + 1]) if "--n" in argv else 90
    out = argv[argv.index("--out") + 1] if "--out" in argv else "sample_%d.json" % start
    rows, tried = draw(start, n)
    io.open(out, "w", encoding="utf-8", newline="\n").write(json.dumps(rows, ensure_ascii=False, indent=1))
    print("seeds tried %d, rows %d -> %s" % (tried, len(rows), out))
    for i, r in enumerate(rows, 1):
        line = "%2d %d | %s | %s | %s | p.%s | list p.%d | %s %s" % (
            i, r["seed"], r["L"], r["sec"], r["en"], r["r"], r["lp"], r["kind"], r["pts0"])
        print(line.encode(sys.stdout.encoding or "utf-8", "replace").decode(sys.stdout.encoding or "utf-8"))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
