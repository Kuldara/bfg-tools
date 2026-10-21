# -*- coding: utf-8 -*-
"""Kokoaa Gothic Fleet Registryn yhdeksi itsenaiseksi HTML-tiedostoksi.

  Gothic Fleet Registry.html   doctype + head mukana; avaa, jaa ja tulosta tama

Molemmat ovat puhdasta ASCII:ta, jotta merkisto ei riko mitaan siina
tapauksessa etta tiedosto tarjoillaan ilman charset-otsaketta.

Datan koonti:  python extract.py && python lists.py && python build_data.py
"""
import io, os, json

HERE = os.path.dirname(os.path.abspath(__file__))
tpl = io.open(os.path.join(HERE, "app_template.html"), encoding="utf-8").read()
data = io.open(os.path.join(HERE, "bfg_data.json"), encoding="utf-8").read()

# Kirjasimet tiedostoon. Ilman tata sivu hakee ne Google Fontsista, jolloin
# se tarvitsee verkon, kertoo kayttajan IP:n kolmannelle osapuolelle ja
# renderoityy eri tavalla niilla joilla haku epaonnistuu - mika muuttaa
# millimetreissa mitoitetun kortin ulkoasua koneelta toiselle.
FONT_LINKS = """<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo+Narrow:wght@500;600;700&family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600&display=swap">"""

fonts_path = os.path.join(HERE, "fonts_inline.css")
assert os.path.exists(fonts_path), (
    "fonts_inline.css puuttuu - aja ensin: python make_fonts.py")
fonts = io.open(fonts_path, encoding="utf-8").read()
assert tpl.count(FONT_LINKS) == 1, (
    "Google Fontsin link-tageja ei loytynyt sellaisenaan; tarkista "
    "app_template.html:n alku ennen kuin upotus tehdaan")
tpl = tpl.replace(FONT_LINKS, "<style>\n" + fonts + "</style>", 1)

# Domain-moduuli on oma lahdetiedosto (docs/DOMAIN_CONTRACT.md, P1-8a):
# Node-testit lukevat sen suoraan, julkaisu upottaa sen samaan skriptiin.
dom = io.open(os.path.join(HERE, "domain.js"), encoding="utf-8").read()
assert "<script" not in dom and "</script" not in dom, "domain.js sisaltaa script-tagin"
assert "__DATA__" not in dom
# Julkaisuversio nakyy sivun lahderivilla ja ladatun korttitiedoston
# alaotsikossa: "mika versio sinulla on" on ensimmainen tukikysymys.
# 1.2 (12.10.2026): korttien lukuavut - docs/BACKLOG.md J181-J185.
APP_VERSION = "1.2"
assert tpl.count("__VERSION__") == 1, "mallipohjasta puuttuu __VERSION__-merkki"
tpl = tpl.replace("__VERSION__", APP_VERSION, 1)
assert tpl.count("__DOMAIN__") == 1, "mallipohjasta puuttuu __DOMAIN__-merkki"
tpl = tpl.replace("__DOMAIN__", dom, 1)

assert "</script" not in data, "data sisaltaa script-lopetuksen"
page = tpl.replace("__DATA__", data)

bad = sorted({hex(ord(c)) for c in page if ord(c) > 127})
assert not bad, "ei-ASCII merkkeja: %s" % bad

# ASCII-tarkistus paastaa ohjausmerkit lapi, koska ne ovat alle 128. Se on
# aukko: NUL-tavu paatyi 1.1:ssa domain.js:aan editointivirheena ja meni
# buildin lapi julkaistavaan tiedostoon asti (git luki lahteen binaariksi,
# mutta build ei valittanut). Selain ei kaada sivua siita, joten vika olisi
# nakynyt vasta jossain tyokalussa. Sallitut ovat rivinvaihto, tabulaattori
# ja rivinpalautus.
_OK_CTRL = (chr(10), chr(9), chr(13))
_ctrl = sorted({hex(ord(c)) for c in page
                if ord(c) < 32 and c not in _OK_CTRL} |
               {hex(ord(c)) for c in page if ord(c) == 127})
assert not _ctrl, "ohjausmerkkeja tiedostossa: %s" % _ctrl

# CSS-muuttuja, jota ei ole maaritelty, ei ole selaimelle virhe: arvo jaa
# tyhjaksi ja ominaisuus putoaa pois. Kirjoitusvirhe nakyy siksi vasta
# silmalla, ja ehka vain toisessa teemassa. Nain kavi 1.1:ssa: lahdelistan
# valitsin sai background:var(--paper), jota paletissa ei ole, joten tausta
# jai selaimen valkoiseksi ja teksti peri lahes valkoisen --ink:n - tummassa
# teemassa valkoista valkoisella (kayttajan havainto 15.9.2026).
import re as _re0
_css_used = set(_re0.findall(r"var\(\s*(--[A-Za-z0-9_-]+)", page))
_css_def = set(_re0.findall(r"(--[A-Za-z0-9_-]+)\s*:", page))
_css_bad = sorted(_css_used - _css_def)
assert not _css_bad, "CSS-muuttujaa ei ole maaritelty: %s" % ", ".join(_css_bad)

# Julkaistava tiedosto ei saa ottaa yhteytta minnekaan. Data-URI:t ovat
# sallittuja, http(s)-osoitteet eivat.
import re as _re

# Testit ja layout-audit poimivat sovelluksen koodin jakamalla tiedoston
# script-tagilla ja ottamalla [1]. Toinen kirjaimellinen avaustagi
# katkaisisi poiminnan kesken koodia, ja vika nakyisi vasta ajossa.
assert page.count("<script>") == 1, (
    "kirjaimellisia <script>-avaustageja %d, pitaa olla 1 - "
    "kokoa tagi paloista jos tarvitset sen merkkijonona"
    % page.count("<script>"))
# Sulkevia tageja on kaksi (JSON-lohko ja sovelluskoodi), mika on oikein:
# JSON-lohko sulkeutuu ennen sovelluksen avaustagia eika siksi haittaa
# poimintaa. Avaustageja saa olla vain yksi. Ettei koodi silti katkea
# muusta syysta, test_upgrades.js kaantaa poimitun skriptin.

# Itsenainen versio: ilman doctypea selain menee quirks-tilaan, jolloin
# taulukot eivat peri varia eika tulostus toimi oikein.
title = "Gothic Fleet Registry"

# Otsikko kuuluu headiin. Mallipohjassa se on ensimmaisena rivina, koska
# pohja on runko ilman headia; siirretaan se tassa oikealle paikalleen.
TITLE_TAG = "<title>Gothic Fleet Registry</title>\n"
assert page.startswith(TITLE_TAG), "mallipohjan ensimmainen rivi ei ole otsikko"
page = page[len(TITLE_TAG):]

# Yhden lauseen kuvaus. Sama teksti menee hakutuloksiin ja linkin
# esikatseluun, joten siina ovat numerot ja se etta tama on ilmainen.
# Luvut datasta. Kasin kirjoitettuina ne vanhenivat heti kun kirjaan
# lisattiin lista: kuvaus mainosti 30 listaa ja 460 korttia kun niita oli
# jo 32 ja 462.
_D = json.load(io.open("bfg_data.json", encoding="utf-8"))
N_LISTS = len(_D["lists"])
N_SHIPS = len(_D["ships"])
# Kortti = listarivi, jolla on profiili. Planeettapuolustukset ovat poikkeus:
# ne ovat YKSI hintalista (Fleets s.499), joka on lisatty omaksi osiokseen
# jokaisen laivastolistan loppuun (ct "defence"), joten samat viisitoista
# rivia toistuvat 30 listalla. Riveittain laskettuna kuvauksen luku hyppaisi
# noin 380:lla ilman yhtaan uutta korttia - Space station on sama kortti
# listasta riippumatta. Siksi jokainen eri puolustuskortti lasketaan kerran:
# profiili sivunsa mukaan, ja rungoton saantokorttirivi (Orbital mine s.512,
# Minefield s.513; rivin rc) korttinsa mukaan. Muiden osioiden rivit
# lasketaan kuten ennenkin: sama runko eri listalla on eri hinta, eri
# paivitykset ja siksi eri kortti.
_is_def = lambda sec: sec.get("ct") == "defence"
N_CARDS = sum(1 for L in _D["lists"] for sec in L["secs"] if not _is_def(sec)
              for e in sec["ents"]
              if e.get("r") and str(e["r"]) in _D["ships"])
_DEF_CARDS = set()
for _L in _D["lists"]:
    for _sec in _L["secs"]:
        if not _is_def(_sec):
            continue
        for _e in _sec["ents"]:
            if _e.get("r") and str(_e["r"]) in _D["ships"]:
                _DEF_CARDS.add("profile:%s" % _e["r"])
            elif _e.get("k") == "unit" and _e.get("rc"):
                _DEF_CARDS.add("rule:%s" % _e["rc"])
N_CARDS += len(_DEF_CARDS)
DESC = ("Free fleet builder and printable ship cards for Battlefleet "
        "Gothic: Remastered. %d fleet lists, %d ship profiles, %d cards "
        "- one HTML file, no install, works offline."
        % (N_LISTS, N_SHIPS, N_CARDS))

# Kuvake SVG:na tiedoston sisalla, jottei valilehti hae mitaan verkosta.
# Aihe on kortti, koska se on se mita sovellus tekee: tumma laatta,
# vaalea kortti, oranssi otsikkopalkki. Enempaa yksityiskohtaa ei kannata
# piirtaa, koska kuva nakyy 16 pikselin kokoisena - tuossa koossa
# kokeiltiin myos runkosiluettia, ja se luettiin lipuksi.
ICON = ("data:image/svg+xml,"
        "%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20viewBox='0%200%2064%2064'%3E"
        "%3Crect%20width='64'%20height='64'%20rx='9'%20fill='%23211F20'/%3E"
        "%3Crect%20x='9'%20y='11'%20width='46'%20height='42'%20rx='3'%20"
        "fill='%23F6F2E9'/%3E"
        "%3Crect%20x='9'%20y='11'%20width='46'%20height='10'%20fill='%23D1792A'/%3E"
        "%3Crect%20x='15'%20y='28'%20width='34'%20height='5'%20fill='%23211F20'/%3E"
        "%3Crect%20x='15'%20y='39'%20width='22'%20height='5'%20fill='%23211F20'/%3E"
        "%3C/svg%3E")

head = ('<!DOCTYPE html>\n<html lang="en">\n<head>\n'
        '<meta charset="utf-8">\n'
        '<meta name="viewport" content="width=device-width,initial-scale=1">\n'
        '<title>' + title + '</title>\n'
        '<meta name="description" content="' + DESC + '">\n'
        '<meta name="color-scheme" content="light dark">\n'
        '<meta name="theme-color" content="#211F20">\n'
        '<link rel="icon" href="' + ICON + '">\n'
        '<meta property="og:type" content="website">\n'
        '<meta property="og:site_name" content="' + title + '">\n'
        '<meta property="og:title" content="' + title + '">\n'
        '<meta property="og:description" content="' + DESC + '">\n'
        '<meta name="twitter:card" content="summary_large_image">\n'
        '</head>\n<body>\n')
doc = head + page + "\n</body>\n</html>\n"

# Julkaistava tiedosto ei saa hakea mitaan verkosta. Data-URI:t ovat
# sallittuja. Ainoa sallittu http-osoite on SVG:n nimiavaruus, jota
# selain ei koskaan hae.
# BFG Tools -lappu (../julkaisu/tools_badge.html, markkerit <!--BFGTOOLS-->,
# synkataan ../julkaisu/kokoa.py:lla) linkittaa sisarsovelluksiin
# kuldare.com-osoitteilla. Linkki ei hae mitaan ennen kuin kayttaja
# napauttaa sita, joten lupaus pitaa; lappu tarkistetaan silti erikseen,
# jotta tarkistus muualla pysyy yhta tiukkana kuin ennen: vain nama viisi
# isantaa (Scenario Library lisatty 20.10.2026), vain a-elementteina, jokainen uuteen valilehteen (builderissa
# on tallentamaton laivasto, josta ei saa navigoida pois).
BADGE_HOSTS = {"bfgtools.kuldare.com", "bfgtools.boarding.kuldare.com",
               "terrain-generator.kuldare.com", "bfgtools.meta.kuldare.com",
               "scenario-library.kuldare.com",
               # lahdekoodi ja peili (kayttaja 20.10.2026: avoimuuden vuoksi)
               "github.com"}
_badge = _re.findall(r"<!--BFGTOOLS-->.*?<!--/BFGTOOLS-->", doc, _re.S)
assert len(_badge) == 1, "BFG Tools -lappu ei ole tiedostossa tasan kerran"
_links = _re.findall(r"<a [^>]*>", _badge[0])
_hosts = set(_re.findall(r"https?://([a-zA-Z0-9.\-]+)", _badge[0]))
assert _hosts == BADGE_HOSTS, "lapun osoitteet: %s" % sorted(_hosts ^ BADGE_HOSTS)
assert len(_links) == len(BADGE_HOSTS) and all(
    'target="_blank"' in a and 'rel="noopener"' in a for a in _links), (
    "lapun jokaisen linkin pitaa avautua uuteen valilehteen")
assert len(_re.findall(r"https?://", _badge[0])) == len(_links), (
    "lapussa on osoite muualla kuin linkissa")
# Julkaistu pelisivu on Saved fleets -paneelin "To phone" -linkin kohde, kun
# builder ajetaan levylta tai localhostista (puhelin ei nae kumpaakaan):
# linkki, jonka kayttaja avaa itse puhelimella, ei haku (19.10.2026).
ALLOWED = {"http://www.w3.org", "https://bfgtools.kuldare.com"}
ext = sorted(set(_re.findall(r"https?://[a-zA-Z0-9.\-]+",
                             doc.replace(_badge[0], ""))) - ALLOWED)
assert not ext, "ulkoisia osoitteita jai tiedostoon: %s" % ext

io.open(os.path.join(HERE, title + ".html"), "w", encoding="utf-8").write(doc)

f = title + ".html"
print("%-32s %6.0f kB" % (f, os.path.getsize(os.path.join(HERE, f)) / 1024))

# Jakopaketti samasta buildista, joka kerta (kayttaja 12.10.2026: "pida sita
# single html karvalakkimallia nyt aina tuolla automaattisesti share
# kansiossa ajantasalla"). Paketissa on tasan yksi tiedosto, tama HTML ilman
# Play-nappia - pelisivu on oma tiedostonsa eika kuulu yhden tiedoston
# pakettiin. Kasin pakattu paketti jai vanhaksi joka muutoksella; nyt se ei
# voi jaada. Pakkaaja kaataa buildin, jos Play-linkki ei osu tasan kerran:
# rikkinaisen linkin kanssa lahteva paketti on pahempi kuin kaatuva build.
import importlib.util as _ilu
_spec = _ilu.spec_from_file_location(
    "make_share_zip", os.path.join(HERE, "julkaisu", "make_share_zip.py"))
_share = _ilu.module_from_spec(_spec)
_spec.loader.exec_module(_share)
if _share.main(quiet=True) != 0:
    raise SystemExit("jakopaketin pakkaus epaonnistui")
