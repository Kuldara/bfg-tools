# -*- coding: utf-8 -*-
"""Esite: mika Gothic Fleet Registry on ja mita silla tekee.

Kuvat ovat oikeasta sovelluksesta - kayttoliittyma ja kortti on kuvattu
headless-selaimella samasta tiedostosta joka jaetaan. Mallinnoksia ei
kayteta, koska esitteen pitaa nayttaa se mita kayttaja oikeasti saa.

Sama taitto tuottaa suomen- ja englanninkielisen esitteen: kortti itse on
englanniksi, joten tuote kelpaa kansainvaliseen kanavaan sellaisenaan ja
vain esitteen teksti tarvitsee kaannoksen.

Tulokset jaavat TAHAN kansioon. "share version" on jakokansio, sinne ei
kirjoiteta tyotiedostoja.

Aja tassa kansiossa:  python make_brochure.py
  (vaatii _ui.png ja _card.png; ne tehdaan make_ui_page.js /
   make_card_page.js + headless-selaimen kuvakaappaus)
"""
import os
import sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from luvut import LUVUT   # julkaisutekstien luvut datasta, ei kasin
import os

import fitz
from reportlab.lib.utils import ImageReader
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas

HERE = os.path.dirname(os.path.abspath(__file__))
IMG_UI = os.path.join(HERE, "_ui.png")
IMG_CARD = os.path.join(HERE, "_card.png")

W, H = 800.0, 450.0
SCALE = 2.4

for name, path in [("Seg", r"C:\Windows\Fonts\segoeui.ttf"),
                   ("SegB", r"C:\Windows\Fonts\segoeuib.ttf"),
                   ("SegSB", r"C:\Windows\Fonts\seguisb.ttf")]:
    if os.path.exists(path):
        pdfmetrics.registerFont(TTFont(name, path))
REG, BLD, SEMI = "Seg", "SegB", "SegSB"

INK = (0x21 / 255, 0x1F / 255, 0x20 / 255)
PAPER = (0xF6 / 255, 0xF2 / 255, 0xE9 / 255)
ORANGE = (0xD1 / 255, 0x79 / 255, 0x2A / 255)
MUTED = (0xB9 / 255, 0xB3 / 255, 0xAC / 255)
DIM = (0x8C / 255, 0x87 / 255, 0x81 / 255)
GREEN = (0x6C / 255, 0xA5 / 255, 0x72 / 255)
BLUE = (0x4E / 255, 0x7C / 255, 0xB8 / 255)
PANEL = (0x2E / 255, 0x2A / 255, 0x29 / 255)

# Perheittain, kertoimena listojen maara: 14 faktiota, 30 listaa.
FLEETS = [
    ("Imperial Navy", 4), ("Space Marines", 3), ("Adeptus Mechanicus", 1),
    ("Inquisition", 1), ("Rogue Traders", 3), ("Chaos", 6),
    ("Eldar", 1), ("Eldar Corsairs", 1), ("Dark Eldar", 1),
    ("Orks", 3), ("Necrons", 1), ("Tyranids", 2), ("Tau", 2), ("Demiurg", 1),
]

TEXTS = {
    "fi": dict(
        file="Gothic Fleet Registry - esite",
        tagline="Laivastonrakentaja ja korttitulostin  \u00b7  "
                "Battlefleet Gothic: Remastered",
        badge="yksi HTML-tiedosto",
        badge_sub="ei asennusta  \u00b7  toimii ilman verkkoa",
        cap_ui="Rakentaja valvoo listan rajoituksia",
        cap_card="Jokaisesta aluksesta pelattava kortti",
        stats=[("30", "laivastolistaa"), ("171", "alusprofiilia"),
               ("460", "tulostettavaa korttia")],
        stat_note=["Kaikki kirjasta,", "ei k\u00e4sin sy\u00f6tetty"],
        cols=[
            ("1  RAKENNA LISTA", ORANGE, [
                "Valitse laivasto, klikkaa aluksia listaan. Rakentaja",
                "laskee pisteet ja valvoo osioiden m\u00e4\u00e4ri\u00e4, suhdelukuja",
                "ja laivueiden kokoja. Jokainen tarkistus n\u00e4ytt\u00e4\u00e4 sen",
                "lauseen kirjasta, josta se on per\u00e4isin.",
            ]),
            ("2  TULOSTA KORTIT", BLUE, [
                "Jokaisesta aluksesta A4-kortti, kaksi sivulle. Vahinko-",
                "ruudut, kriittiset vauriot, aseistus kaarikuvineen ja",
                "optiot rastiruutuina. Pelaat kortilla, et kirjaa selaamalla.",
                "Kortit saa my\u00f6s ladattua muokattavana tiedostona.",
            ]),
            ("3  TIEDOT TARKISTETTU", GREEN, [
                "Luvut on poimittu suoraan l\u00e4hdekirjoista: Fleets WiP",
                "v0.36 ja Rulebook v1.10. Jokainen kortti on verrattu",
                "rivi rivilt\u00e4 l\u00e4hde-PDF:\u00e4\u00e4n, ja sivunumero on kortilla \u2014",
                "voit aina tarkistaa kohdan itse.",
            ]),
        ],
        strip="KAIKKI LAIVASTOT  \u2014  30 listaa, 14 faktiota",
        foot="Avaa selaimessa  \u00b7  tulosta A4  \u00b7  tallenna laivasto "
             "koneelle  \u00b7  ilmainen",
    ),
    "en": dict(
        file="Gothic Fleet Registry - brochure",
        tagline="Fleet builder and card printer  \u00b7  "
                "Battlefleet Gothic: Remastered",
        badge="one HTML file",
        badge_sub="no install  \u00b7  works offline",
        cap_ui="The builder checks the list restrictions",
        cap_card="A playable card for every ship",
        stats=[("30", "fleet lists"), ("171", "ship profiles"),
               ("460", "printable cards")],
        stat_note=["Straight from the books,", "not retyped by hand"],
        cols=[
            ("1  BUILD A LIST", ORANGE, [
                "Pick a fleet, click ships in. Points are totalled and the",
                "list restrictions \u2014 section counts, ratios, squadron",
                "sizes \u2014 are checked as you go. Every check shows the",
                "sentence from the book it came from.",
            ]),
            ("2  PRINT THE CARDS", BLUE, [
                "One A4 card per ship, two to a page. Damage boxes,",
                "critical hit table, armament with fire arcs and options",
                "as tick boxes. Play off the card, not the book. Cards",
                "also download as an editable file.",
            ]),
            ("3  CHECKED AGAINST SOURCE", GREEN, [
                "Every value is pulled from Fleets WiP v0.36 and",
                "Rulebook v1.10, then compared line by line against the",
                "source PDF. The page number is on every card, so you",
                "can always look it up yourself.",
            ]),
        ],
        strip="ALL FLEETS  \u2014  30 lists, 14 factions",
        foot="Open in a browser  \u00b7  print A4  \u00b7  your fleet saves "
             "locally  \u00b7  free",
    ),
}


def build(lang):
    t = TEXTS[lang]
    pdf = os.path.join(HERE, t["file"] + ".pdf")
    png = os.path.join(HERE, t["file"] + ".png")
    c = canvas.Canvas(pdf, pagesize=(W, H))
    c.setFillColorRGB(*INK)
    c.rect(0, 0, W, H, stroke=0, fill=1)
    c.setFillColorRGB(*ORANGE)
    c.rect(0, 0, 7, H, stroke=0, fill=1)

    def text(x, y, s, font=REG, size=10, color=PAPER, align="l"):
        c.setFont(font, size)
        c.setFillColorRGB(*color)
        if align == "r":
            c.drawRightString(x, y, s)
        else:
            c.drawString(x, y, s)

    text(30, H - 42, "GOTHIC FLEET REGISTRY", BLD, 26)
    text(30, H - 61, t["tagline"], REG, 11.5, MUTED)
    text(W - 30, H - 42, t["badge"], SEMI, 11, ORANGE, "r")
    text(W - 30, H - 60, t["badge_sub"], REG, 9.5, MUTED, "r")
    c.setStrokeColorRGB(*ORANGE)
    c.setLineWidth(1.2)
    c.line(30, H - 72, W - 30, H - 72)

    # Pystypaikat on kiinnitetty, ei laskettu ketjuna: muuten yhden lohkon
    # kasvattaminen tyontaa seuraavan edellisen paalle.
    IMG_Y, IMG_H = 180.0, 186.0
    COL_TOP = 152.0
    STRIP_Y, STRIP_H = 40.0, 46.0

    def place(path, x, height):
        iw, ih = ImageReader(path).getSize()
        w = height * iw / float(ih)
        c.setFillColorRGB(*PANEL)
        c.roundRect(x - 3, IMG_Y - 3, w + 6, height + 6, 3, stroke=0, fill=1)
        c.drawImage(path, x, IMG_Y, width=w, height=height, mask=None)
        return w

    ui_w = place(IMG_UI, 30, IMG_H)
    card_x = 30 + ui_w + 14
    card_w = place(IMG_CARD, card_x, IMG_H)
    text(30, IMG_Y - 12, t["cap_ui"], SEMI, 8.8, DIM)
    text(card_x, IMG_Y - 12, t["cap_card"], SEMI, 8.8, DIM)

    bx = card_x + card_w + 14
    bw = W - 30 - bx
    c.setFillColorRGB(*PANEL)
    c.roundRect(bx, IMG_Y, bw, IMG_H, 4, stroke=0, fill=1)
    c.setFillColorRGB(*ORANGE)
    c.rect(bx, IMG_Y + IMG_H - 3, bw, 3, stroke=0, fill=1)
    yy = IMG_Y + IMG_H - 26
    for big, lab in t["stats"]:
        text(bx + 12, yy, big, BLD, 19)
        text(bx + 12, yy - 13, lab, REG, 8.8, MUTED)
        yy -= 40
    text(bx + 12, IMG_Y + 14, t["stat_note"][0], SEMI, 8.8, GREEN)
    text(bx + 12, IMG_Y + 4, t["stat_note"][1], SEMI, 8.8, GREEN)

    CW = (W - 60 - 2 * 18) / 3.0
    for i, (title, col, lines) in enumerate(t["cols"]):
        x = 30 + i * (CW + 18)
        text(x, COL_TOP, title, BLD, 11.5, col)
        c.setStrokeColorRGB(*col)
        c.setLineWidth(0.8)
        c.line(x, COL_TOP - 6, x + CW, COL_TOP - 6)
        y = COL_TOP - 20
        for line in lines:
            text(x, y, line, REG, 9.3, MUTED)
            y -= 11

    c.setFillColorRGB(*PANEL)
    c.roundRect(30, STRIP_Y, W - 60, STRIP_H, 4, stroke=0, fill=1)
    text(42, STRIP_Y + STRIP_H - 13, t["strip"], BLD, 8.6, ORANGE)
    FS = 9.0
    x, y = 42.0, STRIP_Y + 12.0
    for j, (nm, n) in enumerate(FLEETS):
        label = nm if n == 1 else "%s \u00d7%d" % (nm, n)
        w = pdfmetrics.stringWidth(label, REG, FS)
        if x + w > W - 46:
            x, y = 42.0, y - 12.0
        text(x, y, label, REG, FS, PAPER)
        x += w
        if j < len(FLEETS) - 1:
            text(x + 5, y, "\u00b7", REG, FS, DIM)
            x += 12

    c.setFillColorRGB(*PANEL)
    c.rect(0, 0, W, 30, stroke=0, fill=1)
    c.setFillColorRGB(*ORANGE)
    c.rect(0, 30, W, 1.2, stroke=0, fill=1)
    text(30, 11, t["foot"], SEMI, 9.5)
    text(W - 30, 11, "Gothic Fleet Registry.html", REG, 9.5, MUTED, "r")

    c.showPage()
    c.save()

    doc = fitz.open(pdf)
    pix = doc[0].get_pixmap(matrix=fitz.Matrix(SCALE, SCALE))
    pix.save(png)
    doc.close()
    print("%s  %dx%d" % (png, pix.width, pix.height))


for lang in ("fi", "en"):
    build(lang)
