# -*- coding: utf-8 -*-
"""Ohjausmerkit lahdetiedostoissa.

build.py vartioi valmista sivua, mutta ei lahteita. Ero on merkittava, koska
ohjausmerkki EI naytettaessa nay: se vain katoaa, ja koodi nayttaa oikealta.
Kolmesti 15.9.2026 oma editointi kirjoitti Python-merkkijonon paosarjan
tavuna eika kahtena merkkina:

  "\u0000" -> NUL domain.js:aan; git luki lahteen binaariksi, build meni lapi
  "\b"     -> askelpalautin test_domain.js:n saannolliseen lausekkeeseen,
             joka nain EI VOINUT OSUA KOSKAAN - testi nayttaa tarkistukselta
             eika ole. Se on sama vikaluokka kuin eloton verrokkigolden (J133).

Sallittu on rivinvaihto, tabulaattori ja rivinpalautus. Mitaan poikkeusta ei
ole: jos merkki halutaan dokumentoida, se kirjoitetaan paosarjana nakyviin.

Aja: python check_control.py [-v]
"""
import io, os, sys

HERE = os.path.dirname(os.path.abspath(__file__))
VERBOSE = "-v" in sys.argv
SKIP_DIR = (".git", "node_modules", "__pycache__", "tmp", "versiot",
            "share version", ".tmp.drivedownload", ".tmp.driveupload")
EXT = (".py", ".js", ".md", ".json", ".html", ".txt", ".css")
OK = (9, 10, 13)

bad, scanned = [], 0
for root, dirs, files in os.walk(HERE):
    dirs[:] = [d for d in dirs if d not in SKIP_DIR and not d.startswith(".")]
    for name in files:
        if not name.endswith(EXT):
            continue
        path = os.path.join(root, name)
        rel = os.path.relpath(path, HERE)
        try:
            data = io.open(path, "rb").read()
        except Exception:
            continue
        scanned += 1
        for i, ch in enumerate(data):
            if ch < 32 and ch not in OK or ch == 127:
                line = data.count(b"\n", 0, i) + 1
                bad.append((rel, line, hex(ch)))
                break
        if VERBOSE:
            print("  luettu %s" % rel)

for rel, line, ch in bad:
    print("  %s:%d  ohjausmerkki %s" % (rel, line, ch))
print("tiedostoja tarkistettu %d, ohjausmerkkeja %d" % (scanned, len(bad)))
sys.exit(1 if bad else 0)
