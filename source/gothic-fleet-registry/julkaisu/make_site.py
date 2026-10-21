# -*- coding: utf-8 -*-
"""Kokoaa Cloudflare Pagesille raahattavan kansion.

Verkkoversio on sama tiedosto kuin jaettava, kolmella lisayksella joita
yksittainen tiedosto ei voi itse tehda:

  og:url ja og:image   vaativat absoluuttisen osoitteen, eli sivun on
                       tiedettava mihin se on julkaistu
  canonical            kertoo hakukoneelle etta osoite on tama, jos
                       joku peilaa tiedoston muualle
  _headers             Cloudflaren tapa asettaa HTTP-otsakkeet

Sovelluksen koodiin ei kosketa. Jos tama tiedosto ja jaettava tiedosto
eroavat muuten kuin naiden metatietojen osalta, se on virhe - siksi ero
tarkistetaan lopuksi.

Kansion nimi Cloudflaren projektissa maaraa osoitteen. Jos projektin
nimeksi tulee muu kuin PROJECT alla, korjaa se tanne ja aja uudestaan.

Aja tassa kansiossa:  python make_site.py
"""
import os
import sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from luvut import LUVUT   # julkaisutekstien luvut datasta, ei kasin
import io
import re
import shutil

HERE = os.path.dirname(os.path.abspath(__file__))
BUILDER = os.path.dirname(HERE)
SRC = os.path.join(BUILDER, "Gothic Fleet Registry.html")
# Pelin aikainen kannykkakortti (play/LUEMINUT.md): oma yhden tiedoston
# sivu, jonka builderin Play-nappi avaa samasta osoitteesta - sama polku
# kehityksessa ja sivustolla, jotta linkki on yksi.
PLAY = os.path.join(BUILDER, "play", "Gothic Fleet Play.html")
OG = os.path.join(HERE, "og.png")
SITE = os.path.join(HERE, "site")

# Cloudflare Pages antaa osoitteen <projekti>.pages.dev, ja sen rinnalle
# liitetaan oma verkkotunnus. Molemmat osoitteet palvelevat samaa
# sivustoa, mutta canonical ja og:image saavat osoittaa vain yhteen -
# muuten Discordin esikatselu ja hakukone naytaisivat eri osoitetta kuin
# se jota jaetaan. Siksi BASE on oma verkkotunnus, ei pages.dev.
#
# Jokainen projekti saa oman alidomaininsa, koska Pagesissa yksi projekti
# on yksi sivusto: polkupohjainen jako vaatisi erillisen Workerin eteen.
PROJECT = "gothic-fleet-registry"
BASE = "https://bfgtools.kuldare.com"

assert os.path.exists(SRC), "aja ensin: python build.py"
assert os.path.exists(OG), "aja ensin: python make_og.py"
assert os.path.exists(PLAY), "aja ensin: python play/build_play.py"

html = io.open(SRC, encoding="utf-8").read()

# --- linkin esikatselu ----------------------------------------------------
# Nama menevat heti twitter:card-rivin jalkeen, samaan lohkoon muiden
# og-kenttien kanssa.
ANCHOR = '<meta name="twitter:card" content="summary_large_image">\n'
assert html.count(ANCHOR) == 1, "twitter:card-rivia ei loydy"

EXTRA = (
    '<meta property="og:url" content="%(base)s/">\n'
    '<meta property="og:image" content="%(base)s/og.png">\n'
    '<meta property="og:image:type" content="image/png">\n'
    '<meta property="og:image:width" content="1200">\n'
    '<meta property="og:image:height" content="630">\n'
    '<meta property="og:image:alt" content="A printable Battlefleet '
    'Gothic ship card next to the numbers %(lists)d fleet lists, '
    '%(profiles)d profiles, %(cards)d cards.">\n'
    '<meta name="twitter:image" content="%(base)s/og.png">\n'
    '<link rel="canonical" href="%(base)s/">\n'
) % dict(LUVUT, base=BASE)

site_html = html.replace(ANCHOR, ANCHOR + EXTRA, 1)

# --- kansio ---------------------------------------------------------------
# Vanha sisalto pois, jottei sinne jaa edellisen ajon tiedostoja joita
# ei enaa ole. Poisto rajataan tahan kansioon.
if os.path.isdir(SITE):
    for n in os.listdir(SITE):
        p = os.path.join(SITE, n)
        if os.path.isfile(p):
            os.remove(p)
        elif n == "play":
            # Tiedostot pois, kansio jaa: Drive-synkattu kansio ei aina
            # anna poistaa hakemistoa (WinError 5), tiedostot kylla.
            for m in os.listdir(p):
                q = os.path.join(p, m)
                if os.path.isfile(q):
                    os.remove(q)
else:
    os.makedirs(SITE)
os.makedirs(os.path.join(SITE, "play"), exist_ok=True)

io.open(os.path.join(SITE, "index.html"), "w", encoding="utf-8").write(
    site_html)
shutil.copyfile(OG, os.path.join(SITE, "og.png"))
# Pelisivun paluulinkki osoittaa kehityksessa builderin tiedostonimeen; sivustolla
# builder on juuren index.html, joten linkki on "../".
play_html = io.open(PLAY, encoding="utf-8").read()
BACK = 'const BUILDER_URL = "../Gothic%20Fleet%20Registry.html";'
assert play_html.count(BACK) >= 1, "pelisivun paluulinkkia ei loydy"
play_site = play_html.replace(BACK, 'const BUILDER_URL = "../";')

# --- pelisivu asennettavaksi (PWA, 19.10.2026) -----------------------------
# Puhelimen kotinayttoon lisatty sivu aukeaa koko ruudulle ilman selaimen
# osoitepalkkia (lisaa pystytilaa riveille) ja toimii ilman verkkoa
# pelipaikalla: service worker hakee sivun aina ensin verkosta (korjaus nakyy
# heti) ja kayttaa tallennettua vain kun verkkoa ei ole. Nama ovat VAIN
# sivustolla: kehitysversio ja jaettava tiedosto pysyvat yhtena tiedostona.
# Manifest, sw.js ja kuvakkeet kirjoitetaan play/-kansioon pelisivun viereen.
import hashlib
PLAY_NAME = os.path.basename(PLAY)
PLAY_URL = PLAY_NAME.replace(" ", "%20")
HEAD_PWA = ('<link rel="manifest" href="manifest.webmanifest">\n'
            '<link rel="apple-touch-icon" href="icon-192.png">\n'
            '<meta name="mobile-web-app-capable" content="yes">\n'
            '<meta name="apple-mobile-web-app-capable" content="yes">\n'
            '<meta name="apple-mobile-web-app-title" content="Fleet Play">\n')
SW_REG = ('<script>if("serviceWorker" in navigator && location.protocol === "https:")'
          'navigator.serviceWorker.register("sw.js").catch(function(){});</script>\n')
assert play_site.count("</head>") == 1 and play_site.count("</body>") == 1
play_site = play_site.replace("</head>", HEAD_PWA + "</head>", 1).replace("</body>", SW_REG + "</body>", 1)
io.open(os.path.join(SITE, "play", PLAY_NAME), "w", encoding="utf-8", newline="\n").write(play_site)

# kuvake: sama kuin sivun favicon (tumma ruutu, oranssi kolmio), kolmio
# maskable-turva-alueen (80 %) sisalla
from PIL import Image, ImageDraw
for px in (192, 512):
    img = Image.new("RGB", (px, px), (0x14, 0x24, 0x3F))
    d = ImageDraw.Draw(img)
    m = px * 0.14   # turvamarginaali
    k = (px - 2 * m) / 10.0
    d.polygon([(m + 0 * k, m + 10 * k), (m + 5 * k, m + 0 * k), (m + 10 * k, m + 10 * k)], fill=(0xD1, 0x79, 0x2A))
    img.save(os.path.join(SITE, "play", "icon-%d.png" % px))

import json as _json
manifest = {
    "name": "Gothic Fleet Play", "short_name": "Fleet Play",
    "description": "Battlefleet Gothic fleet record for the table: hits, criticals and the rules the book derives.",
    "start_url": "./" + PLAY_URL, "scope": "./", "display": "standalone",
    "background_color": "#0F151B", "theme_color": "#0F151B",
    "icons": [{"src": "icon-192.png", "sizes": "192x192", "type": "image/png"},
              {"src": "icon-512.png", "sizes": "512x512", "type": "image/png"},
              {"src": "icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable"}]}
io.open(os.path.join(SITE, "play", "manifest.webmanifest"), "w", encoding="utf-8", newline="\n").write(
    _json.dumps(manifest, indent=1))

# Valimuistin nimi seuraa sivun sisaltoa: uusi build = uusi valimuisti, vanha
# poistetaan aktivoinnissa.
CACHE = "gfp-" + hashlib.sha1(play_site.encode("utf-8")).hexdigest()[:12]
SW = """/* Gothic Fleet Play: offline at the table (julkaisu/make_site.py). The page
   is fetched from the network first - a fix shows at once - and the saved
   copy is used only when there is no network. */
const CACHE = "%(cache)s";
const FILES = ["./%(page)s", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png"];
self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if(req.method !== "GET" || new URL(req.url).origin !== location.origin) return;
  e.respondWith(fetch(req).then(r => {
    if(r.ok){ const copy = r.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
    return r;
  }).catch(() => caches.match(req, { ignoreSearch: true })));
});
""" % {"cache": CACHE, "page": PLAY_URL}
io.open(os.path.join(SITE, "play", "sw.js"), "w", encoding="utf-8", newline="\n").write(SW)

# --- otsakkeet ------------------------------------------------------------
# CSP on tiukka koska sovellus ei tarvitse mitaan: ei verkkoyhteyksia, ei
# ulkoisia kirjasimia, ei kuvia. Testattu selaimessa - lataus, tallennus
# ja kirjasimet toimivat taman kanssa. connect-src 'none' tarkoittaa etta
# sivu ei voi lahettaa kayttajan listoja minnekaan edes vahingossa.
#
# index.html ilman valimuistia, jotta korjaus nakyy heti. og.png ja
# kuvake voivat jaada valimuistiin, ne eivat muutu.
#
# Pelisivulla (play/) on oma CSP: service worker (worker-src 'self', sw.js
# 'self'-skriptina), manifest (manifest-src 'self') ja sw:n oma haku samasta
# osoitteesta (connect-src 'self': staattinen Pages-sivusto, jolle ei voi
# lahettaa mitaan talteen). Muu sivusto pitaa connect-src 'none'. CSP on
# siksi kirjoitettu polkukohtaisesti eika /*-saantoon: Cloudflare yhdistaa
# usean saannon samannimiset otsakkeet, ja kaksi CSP:ta tarkoittaisi, etta
# tiukempi voittaa.
CSP_APP = ("default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src 'self' data:; "
           "font-src data:; connect-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'self'")
CSP_PLAY = ("default-src 'none'; script-src 'self' 'unsafe-inline'; style-src 'unsafe-inline'; img-src 'self' data:; "
            "font-src data:; connect-src 'self'; worker-src 'self'; manifest-src 'self'; base-uri 'none'; "
            "form-action 'none'; frame-ancestors 'self'")
HEADERS = """/*
  X-Content-Type-Options: nosniff
  Referrer-Policy: no-referrer
  X-Frame-Options: SAMEORIGIN
  Permissions-Policy: geolocation=(), camera=(), microphone=(), payment=()

/
  Content-Security-Policy: %(app)s
  Cache-Control: public, max-age=0, must-revalidate

/index.html
  Content-Security-Policy: %(app)s
  Cache-Control: public, max-age=0, must-revalidate

/og.png
  Cache-Control: public, max-age=604800

/play/*
  Content-Security-Policy: %(play)s
  Cache-Control: public, max-age=0, must-revalidate
""" % {"app": CSP_APP, "play": CSP_PLAY}
io.open(os.path.join(SITE, "_headers"), "w", encoding="utf-8",
        newline="\n").write(HEADERS)

# --- tarkistukset ---------------------------------------------------------
# 1  Verkkoversio saa erota jaettavasta vain lisatyilla metatiedoilla.
assert site_html.replace(EXTRA, "", 1) == html, (
    "verkkoversio eroaa jaettavasta muutenkin kuin metatiedoilla")

# 2  Sovellus ei saa hakea mitaan verkosta. Sallittuja ovat oma osoite
#    (metatiedoissa, ei haettava), SVG:n nimiavaruus ja og-kuva.
#    BFG Tools -lappu on tarkistettu build.py:ssa (vain kuldare.com-
#    linkit, uuteen valilehteen); taalla se jaa tarkistuksen ulkopuolelle.
_badge = re.findall(r"<!--BFGTOOLS-->.*?<!--/BFGTOOLS-->", site_html, re.S)
assert len(_badge) == 1, "BFG Tools -lappu puuttuu sivustoversiosta"
ext = sorted(set(re.findall(r"https?://[a-zA-Z0-9.\-]+",
                            site_html.replace(_badge[0], ""))))
allowed = {BASE.split("/")[2], "www.w3.org"}
found = {u.split("//")[1] for u in ext}
assert found <= allowed, "odottamattomia osoitteita: %s" % sorted(
    found - allowed)

# 3  ASCII, kuten muissakin vaiheissa.
assert all(ord(c) < 128 for c in site_html), "ei-ASCII merkkeja"

print("kansio:", SITE)
for n in sorted(os.listdir(SITE)):
    p = os.path.join(SITE, n)
    if os.path.isdir(p):
        for m in sorted(os.listdir(p)):
            print("  %-14s %7.0f kB" % (n + "/" + m, os.path.getsize(os.path.join(p, m)) / 1024))
    else:
        print("  %-14s %7.0f kB" % (n, os.path.getsize(p) / 1024))
print()
print("osoite julkaisun jalkeen:", BASE)
