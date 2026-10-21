# -*- coding: utf-8 -*-
"""Pakkaa jaettavan version share version/Gothic Fleet Registry.zip:iin.

build.py ajaa taman jokaisen buildin lopuksi (kayttaja 12.10.2026: "pida
sita single html karvalakkimallia nyt aina tuolla automaattisesti share
kansiossa ajantasalla"), joten paketti on aina samasta buildista kuin
juuren HTML. Kasin ajettuna se tekee saman.

acceptance.py LUKEE taman paketin mutta ei kirjoita sita: mittari
`share_zip_current` vertaa paketin HTML:aa juuren buildiin ja sanoo
"pakkaa uudelleen", jos ne eroavat. Ennen 12.10.2026 pakkaaminen oli
kasityota, ja kasin tehty paketti on juuri se, joka jaa vanhaksi
huomaamatta.

Paketissa on TASAN YKSI tiedosto. Se on tuotelupaus: pelaaja purkaa
paketin ja saa yhden HTML-tiedoston, joka toimii ilman asennusta ja ilman
verkkoa. Lueminut-tiedosto tai kansiorakenne veisi juuri sen lupauksen.

Play-nappi jaa paketista pois (kayttaja 12.10.2026). Pelisivu on oma
tiedostonsa (play/Gothic Fleet Play.html), eika sita ole yhden tiedoston
paketissa: nappi veisi puuttuvaan tiedostoon. Linkki on HTML:n rungossa
ennen ensimmaista <script>-osaa eika mikaan skripti viittaa siihen, joten
sovellus on paketissa tavulleen sama kuin buildissa ja acceptance.py:n
vertailu pysyy voimassa.

Aikaleima on kiinnitetty, jotta sama build tuottaa tavulleen saman
paketin. Ilman sita paketti muuttuu joka ajolla eika kukaan voi todeta
kahta pakettia samoiksi.

Aja projektin juuressa:  python julkaisu/make_share_zip.py
"""
import io
import os
import re
import sys
import zipfile

HERE = os.path.dirname(os.path.abspath(__file__))
BUILDER = os.path.dirname(HERE)
SRC = os.path.join(BUILDER, "Gothic Fleet Registry.html")
OUTDIR = os.path.join(BUILDER, "share version")
OUT = os.path.join(OUTDIR, "Gothic Fleet Registry.zip")

#: Nimi paketin sisalla. Sama kuin 1.0:ssa, ja acceptance.py etsii
#  paketista ensimmaisen .html-tiedoston, joten nimen on pysyttava .html:na.
ENTRY = "Gothic Fleet Registry.html"

#: Kiinnitetty aikaleima. 1980-01-01 on ZIP-muodon varhaisin sallittu.
STAMP = (1980, 1, 1, 0, 0, 0)


def tail(h):
    """Sama vertailu kuin acceptance.py:ssa: vain <script>-osasta eteenpain.

    Sivustoversio lisaa omat metatietonsa headiin (canonical, og:url), joten
    koko tiedoston vertailu kertoisi eron, jota ei ole sovelluksessa."""
    return h[h.find("<script"):] if h and "<script" in h else h


#: Pelisivun linkki ylapalkissa. Osuttava TASAN KERRAN: jos nappi siirtyy tai
#  muuttuu, paketti ei saa lahtea hiljaa rikkinaisen linkin kanssa.
PLAY_LINK = re.compile(r'[ \t]*<a class="btn" id="play"[^>]*>Play</a>\r?\n')


def without_play(html):
    out, n = PLAY_LINK.subn("", html)
    if n != 1:
        raise SystemExit("Play-linkki osui %d kertaa, pitaisi osua kerran" % n)
    # Saved fleets -paneelin "To phone" osoittaa yhden tiedoston versiossa
    # julkaistuun pelisivuun (absoluuttinen linkki, jonka kayttaja avaa
    # puhelimella; 19.10.2026). Se on sallittu; suhteellinen viittaus
    # play/-kansioon, jota paketissa ei ole, ei ole.
    PUBLIC = "https://bfgtools.kuldare.com/play/Gothic%20Fleet%20Play.html"
    if "Gothic%20Fleet%20Play" in out.replace(PUBLIC, "") or 'id="play"' in out:
        raise SystemExit("pakettiin jai viittaus pelisivuun")
    return out


def main(quiet=False):
    """quiet: yksi rivi buildin tulosteeseen, ei omaa raporttia."""
    if not os.path.exists(SRC):
        print("ei ole rakennettu: %s" % SRC)
        print("aja ensin: python build.py")
        return 1

    build = io.open(SRC, encoding="utf-8").read()
    html = without_play(build)
    if not os.path.isdir(OUTDIR):
        os.makedirs(OUTDIR)

    info = zipfile.ZipInfo(ENTRY, date_time=STAMP)
    info.compress_type = zipfile.ZIP_DEFLATED
    info.external_attr = 0o644 << 16
    with zipfile.ZipFile(OUT, "w") as z:
        z.writestr(info, html.encode("utf-8"))

    # Luetaan takaisin: paketti, jota ei ole avattu, on vain vaite.
    with zipfile.ZipFile(OUT) as z:
        names = [n for n in z.namelist() if n.lower().endswith(".html")]
        if len(names) != 1:
            print("paketissa pitaisi olla tasan yksi html, on %d" % len(names))
            return 1
        back = z.read(names[0]).decode("utf-8")
    if back != html or tail(back) != tail(build):
        print("paketin sisalto ei vastaa buildia")
        return 1

    if quiet:
        print("%-32s %6.0f kB" % ("share version/" + os.path.basename(OUT),
                                  os.path.getsize(OUT) / 1024.0))
        return 0
    print("%s" % OUT)
    print("  %-38s %8.0f kB" % (ENTRY, len(html.encode("utf-8")) / 1024.0))
    print("  pakattuna %36s %8.0f kB" % ("", os.path.getsize(OUT) / 1024.0))
    print("  share_zip_current on nyt kylla")
    return 0


if __name__ == "__main__":
    sys.exit(main())
