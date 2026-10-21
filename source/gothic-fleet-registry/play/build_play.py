# -*- coding: utf-8 -*-
"""Kokoaa Gothic Fleet Playn - pelin aikaisen kannykkakortin - yhdeksi
itsenaiseksi HTML-tiedostoksi.

  play/Gothic Fleet Play.html   avaa kannykalla, lue laivasto builderista

Prototyyppi omalla haaralla (proto/digital-cards). Sama malli kuin
build.py:ssa: malli + domain.js + data + kirjasimet yhteen tiedostoon, ja
samat seitseman vartijaa. Lisaksi tama build POIMII muutaman sovelluksen
funktion suoraan app_template.html:sta buildin aikana (resolveSaved,
factionCols, arcGlyph, ...), jotta kannykkakortti lukee tallenteen ja
varittaa laivastot tasmalleen kuten tulostettava kortti - kopioitua
koodia ei ole, joten se ei voi ajautua erilleen.

Datan koonti kuten paasovelluksessa:  python build_data.py
"""
import io, os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)


def read(p):
    return io.open(p, encoding="utf-8").read()


tpl = read(os.path.join(HERE, "play_template.html"))
dom = read(os.path.join(ROOT, "domain.js"))
rules = read(os.path.join(HERE, "play_rules.js"))   # pelin saannot, node-testattu (test_play.js)
# rosters.json ei enaa kuulu sivulle (19.10.2026: kayttaja poisti G-kirjaimen
# piilovalikon); se on syotemittarin (play/mittari/) testiaineisto.
data = read(os.path.join(ROOT, "bfg_data.json"))
app = read(os.path.join(ROOT, "app_template.html"))
fonts_path = os.path.join(ROOT, "fonts_inline.css")
assert os.path.exists(fonts_path), (
    "fonts_inline.css puuttuu - aja ensin: python make_fonts.py")
fonts = read(fonts_path)


# ---------------------------------------------------------------- poiminta --
# Sovelluksen funktiot poimitaan nimella. Jokainen alku osuu tasan kerran, ja
# lohko paattyy ensimmaiseen sarakkeen 0 sulkuun ("}" tai "];"). Jos
# app_template.html:n funktio nimetaan uudelleen, build kaatuu tahan eika
# tuota vanhentunutta kopiota.
def block(start, closer="}"):
    assert app.count(start) == 1, "app_template.html: '%s' osuu %d kertaa, pitaa olla 1" % (start, app.count(start))
    i = app.index(start)
    j = app.index("\n" + closer + "\n", i)
    return app[i:j + len(closer) + 2]


SHARED = "\n".join([
    "/* --- poimittu app_template.html:sta buildin aikana (build_play.py) --- */",
    block("const FACTION_COLS = [", "];"),
    block("function factionCols("),
    block("function shortArmour("),
    block("function shortRange("),
    block("function arcParts("),
    block("const ARC_WEDGE = [", "];"),
    block("function arcGlyph("),
    block("function shortShield("),
    block("function optCostLabel("),
    block("function esc("),
    block("function title("),
    block("function starHTML("),
    block("function upCostText("),
    block("function fixedCardPoints("),
    block("function resolveSaved("),
    block("function listLineOf("),
    # "to phone": sama linkki ja QR kuin builderin Saved fleets -paneelissa
    block("const PHONE_LINK = {", "};"),
    block("function b64url("),
    block("async function packFleet("),
    block("function unb64url("),
    block("async function unpackFleet("),
    block("const QR = (function(){", "})();"),
    block("function qrSvg("),
    # Full screen -koodi (19.10.2026): avain + qrFull yhtena lohkona
    block("const QR_FULL_KEY = "),
])
for must in ("resolveSaved", "factionCols", "arcGlyph", "starHTML"):
    assert ("function " + must + "(") in SHARED, must
assert "<script" not in SHARED and "</script" not in SHARED

# Teeman varit (vaalea, jarjestelman tumma, pakotettu tumma) poimitaan
# sellaisinaan, jotta pelikortti ja builder ovat samaa perhetta ja
# builderin varimuutos nakyy taalla seuraavassa buildissa.
_t0 = ":root{\n  --ground:"
_t1 = "\n\n*{box-sizing:border-box}"
assert app.count(_t0) == 1 and app.count(_t1) == 1, "teeman tokenlohkoa ei loydy app_template.html:sta"
TOKENS = app[app.index(_t0):app.index(_t1)]
assert TOKENS.count(":root") == 3, TOKENS.count(":root")

# Vapaat muuttujat, jotka poimitut funktiot odottavat: LISTS, SHIPS, DATA,
# DOMAIN, uniqRefs. Malli sitoo ne ennen __SHARED__-kohtaa; varmistetaan.
for name in ("const SHIPS", "LISTS", "const uniqRefs"):
    assert name in tpl, "play_template.html ei sido %s ennen __SHARED__" % name

# --------------------------------------------------------------- kokoaminen --
assert "<script" not in dom and "</script" not in dom, "domain.js sisaltaa script-tagin"
assert "<script" not in rules and "</script" not in rules, "play_rules.js sisaltaa script-tagin"
assert "__DATA__" not in dom and "__DATA__" not in rules
assert "</script" not in data, "data sisaltaa script-lopetuksen"

PLAY_VERSION = "0.1"
# Versio saa esiintya useasti (meta-kuvaus ja koodi); muut tasan kerran.
assert tpl.count("__VERSION__") >= 1, "mallipohjasta puuttuu __VERSION__"
tpl = tpl.replace("__VERSION__", PLAY_VERSION)
for marker, value in (("__FONTS__", fonts), ("__TOKENS__", TOKENS),
                      ("__DOMAIN__", dom), ("__PLAYRULES__", rules),
                      ("__SHARED__", SHARED), ("__DATA__", data)):
    assert tpl.count(marker) == 1, "mallipohjasta puuttuu %s tai se on kahdesti" % marker
    tpl = tpl.replace(marker, value, 1)
page = tpl

# ------------------------------------------------------------------ vartijat --
bad = sorted({hex(ord(c)) for c in page if ord(c) > 127})
assert not bad, "ei-ASCII merkkeja: %s" % bad

_OK_CTRL = (chr(10), chr(9), chr(13))
_ctrl = sorted({hex(ord(c)) for c in page if ord(c) < 32 and c not in _OK_CTRL} |
               {hex(ord(c)) for c in page if ord(c) == 127})
assert not _ctrl, "ohjausmerkkeja tiedostossa: %s" % _ctrl

_css_used = set(re.findall(r"var\(\s*(--[A-Za-z0-9_-]+)", page))
_css_def = set(re.findall(r"(--[A-Za-z0-9_-]+)\s*:", page))
_css_bad = sorted(_css_used - _css_def)
assert not _css_bad, "CSS-muuttujaa ei ole maaritelty: %s" % ", ".join(_css_bad)

assert page.count("<script>") == 1, (
    "kirjaimellisia <script>-avaustageja %d, pitaa olla 1" % page.count("<script>"))

# Julkaistu pelisivu on "to phone" -linkin kohde, kun sivu ajetaan levylta
# tai localhostista (puhelin ei nae kumpaakaan) - linkki, ei haku.
ALLOWED = {"http://www.w3.org", "https://bfgtools.kuldare.com"}
ext = sorted(set(re.findall(r"https?://[a-zA-Z0-9.\-]+", page)) - ALLOWED)
assert not ext, "ulkoisia osoitteita jai tiedostoon: %s" % ext

assert page.startswith("<!DOCTYPE html>"), "mallipohjan on alettava doctypella"
assert 'viewport-fit=cover' in page, "viewport meta ilman viewport-fit=cover: safe-area jaa nollaksi"

out = os.path.join(HERE, "Gothic Fleet Play.html")
io.open(out, "w", encoding="utf-8", newline="\n").write(page)
print("%s  %d kB" % (os.path.basename(out), len(page.encode("utf-8")) // 1024))
