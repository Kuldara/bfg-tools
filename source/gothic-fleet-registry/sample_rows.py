# -*- coding: utf-8 -*-
"""Arpoo tilastollisen pistokoeotoksen: N eri listarivia perakkaisilla
siemenilla (spot_check.js --seed on deterministinen; sama siemen antaa aina
saman rivin). Tulostaa taulukon ja kirjoittaa JSON:n, josta rivit kaydaan
KASIN lapi docs/PISTOKOE.md:n mukaan - tama tyokalu vain arpoo.

  python sample_rows.py 2026091301            # 90 rivia siemenesta alkaen
  python sample_rows.py 2026091301 --n 30 --out otos.json

Populaatio oli 10.9. 524 listarivia (462 yksikkoa + 62 komentajaa), 14.10. 736;
planetary defences -rivit eivat ole siina (spot_check.js, J175 f). 90 rivin otos
antaa osuudelle noin +-9 prosenttiyksikon 95 %:n valin (Wilson, FPC 0,91).
Siemen = paivamaara + juokseva numero (2026091301 = 10.9.2026, sarja 3, nro 01).
"""
import io, json, os, re, subprocess, sys

HERE = os.path.dirname(os.path.abspath(__file__))
HDR = re.compile(r"^PISTOKOE\s+(.*?)\s+\|\s+(.*?)\s+\|\s+(.*?)\s{2,}(?:\(profiili s\.(\S+)\)\s+)?lista s\.(\d+)", re.M)


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
    out = argv[argv.index("--out") + 1] if "--out" in argv else "otos_%d.json" % start
    rows, tried = draw(start, n)
    io.open(out, "w", encoding="utf-8", newline="\n").write(json.dumps(rows, ensure_ascii=False, indent=1))
    print("siemenia kokeiltu %d, rivia %d -> %s" % (tried, len(rows), out))
    for i, r in enumerate(rows, 1):
        line = "%2d %d | %s | %s | %s | s.%s | lista s.%d | %s %s" % (
            i, r["seed"], r["L"], r["sec"], r["en"], r["r"], r["lp"], r["kind"], r["pts0"])
        print(line.encode(sys.stdout.encoding or "utf-8", "replace").decode(sys.stdout.encoding or "utf-8"))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
