# -*- coding: utf-8 -*-
"""Kokoaa yhden tiedoston sovelluksen.

    python build.py

    src/app.html  + src/engine.js + src/ships.json + src/icons.json  ->  Boarding.html
                                                    ->   web/index.html
                                                    ->   Boarding.zip

Yksi tiedosto siksi, etta se toimii ilman palvelinta: sen voi avata
puhelimella, tabletilla tai koneelta suoraan, ja sen voi lahettaa
vastustajalle sellaisenaan.
"""
import io
import json
import os
import sys
import zipfile
import datetime
import re

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, "src")
OUT = os.path.join(HERE, "Boarding.html")
WEB_DIR = os.path.join(HERE, "web")
WEB_OUT = os.path.join(WEB_DIR, "index.html")
ZIP_OUT = os.path.join(HERE, "Boarding.zip")


def read(p):
    with open(p, encoding="utf-8") as fh:
        return fh.read()


def write_atomic(path, contents):
    """Write a complete build without exposing a half-written HTML file."""
    os.makedirs(os.path.dirname(path), exist_ok=True)
    tmp = path + ".tmp"
    with open(tmp, "w", encoding="utf-8", newline="\n") as fh:
        fh.write(contents)
    os.replace(tmp, path)


SAFE_GLYPH = re.compile(r'^(<(path|circle) [^<>]*/>)+$')
HEX = re.compile(r'^#[0-9a-fA-F]{6}$')


def icon_problems(data, icons):
    """Jokaisella laivastolla ja runkotyypilla pitaa olla ikoni, ja ikonit ovat pelkkaa geometriaa."""
    bad = []
    for fl in data["fleets"]:
        st = icons["fleets"].get(fl["id"])
        if not st:
            bad.append("laivastolta %s puuttuu ikoni" % fl["id"])
        elif not HEX.match(st.get("color", "")):
            bad.append("laivaston %s vari ei ole #rrggbb" % fl["id"])
        elif st.get("glyph") not in icons["glyphs"]:
            bad.append("laivaston %s ikonia %s ei ole" % (fl["id"], st.get("glyph")))
    for ty in sorted(set(sh["t"] for sh in data["ships"])):
        if ty not in icons["hulls"]:
            bad.append("runkotyypilta %s puuttuu ikoni" % ty)
    for name, markup in list(icons["glyphs"].items()) + list(icons["hulls"].items()):
        if not SAFE_GLYPH.match(markup) or re.search(r'(?i)script|href|url\(|\bon\w+=', markup):
            bad.append("ikoni %s ei ole pelkkaa path/circle-geometriaa" % name)
    return bad


def main():
    tpl = read(os.path.join(SRC, "app.html"))
    engine = read(os.path.join(SRC, "engine.js"))
    ships = read(os.path.join(SRC, "ships.json")).strip()
    icons_txt = read(os.path.join(SRC, "icons.json")).strip()

    # Tarkistus: tyhja tai rikki data ei saa paatya valmiiseen tiedostoon.
    data = json.loads(ships)
    if len(data.get("ships", [])) < 100:
        print("VIRHE: ships.json sisaltaa vain %d alusta" % len(data.get("ships", [])))
        return 2

    bad = icon_problems(data, json.loads(icons_txt))
    if bad:
        print("VIRHE: ikonit. Lisaa puuttuva rivi make_icons.py:n FLEETS- (laivasto), H- (runkotyyppi)"
              " tai G-tauluun (tunnus), aja python make_icons.py ja sitten build.py uudelleen:\n  "
              + "\n  ".join(bad))
        return 2

    missing = [m for m in ("/*__ENGINE__*/", "/*__SHIPS__*/", "/*__ICONS__*/", "/*__BUILD__*/")
               if m not in tpl]
    if missing:
        print("VIRHE: app.html:sta puuttuu %s" % ", ".join(missing))
        return 2

    stamp = datetime.date.today().isoformat() + " · " + str(len(data["ships"])) + " ships"
    out = (tpl.replace("/*__ENGINE__*/", engine)
              .replace("/*__SHIPS__*/", ships)
              .replace("/*__ICONS__*/", icons_txt)
              .replace("/*__BUILD__*/", stamp))

    write_atomic(OUT, out)
    write_atomic(WEB_OUT, out)
    # Zip is built from the same string, so a stale copy cannot be shipped.
    tmp_zip = ZIP_OUT + ".tmp"
    with zipfile.ZipFile(tmp_zip, "w", zipfile.ZIP_DEFLATED) as z:
        z.writestr("Boarding.html", out)
        z.writestr("LUEMINUT.txt", read(os.path.join(HERE, "LUEMINUT.md")))
    os.replace(tmp_zip, ZIP_OUT)
    print("kirjoitettu %s  (%.0f kt, %d alusta)" % (OUT, os.path.getsize(OUT) / 1024.0,
                                                    len(data["ships"])))
    print("web-hostauspaketti: %s" % WEB_OUT)
    print("jakelupaketti:      %s  (%.0f kt)" % (ZIP_OUT, os.path.getsize(ZIP_OUT) / 1024.0))
    return 0


if __name__ == "__main__":
    sys.exit(main())
