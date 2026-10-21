# -*- coding: utf-8 -*-
"""Julkaisudia: mika muuttui 4.9.2026 13:35 jalkeen.

Discordissa kuva nakyy pienena ennen klikkausta, joten isot luvut ovat
omana nauhanaan ylhaalla: ne luetaan myos esikatselukoossa. Yksityiskohdat
ovat alla kahtena sarakkeena.

Sama taitto tuottaa suomen- ja englanninkielisen version, jotta paivityksen
voi postata myos kansainvaliseen kanavaan.

Tulokset jaavat TAHAN kansioon. "share version" on jakokansio, sinne ei
kirjoiteta tyotiedostoja.

Huom: tama on Python-lahdekoodia, ei app_template.html, joten aakkosia SAA
kayttaa - ja pitaakin, koska dia on julkinen teksti.

Aja tassa kansiossa:  python make_update_slide.py
"""
import os

import fitz
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas

HERE = os.path.dirname(os.path.abspath(__file__))

W, H = 800.0, 450.0          # 16:9
SCALE = 2.4                  # -> 1920 x 1080

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
BLUE = (0x4E / 255, 0x7C / 255, 0xB8 / 255)
GREEN = (0x6C / 255, 0xA5 / 255, 0x72 / 255)
PURPLE = (0x9A / 255, 0x6F / 255, 0xA8 / 255)
PANEL = (0x2E / 255, 0x2A / 255, 0x29 / 255)

TEXTS = {
    "fi": dict(
        file="Gothic Fleet Registry - paivitys 2026-09-06",
        sub="P\u00e4ivitys 6.9.2026  \u00b7  edellinen jako 4.9.2026",
        role="laivastonrakentaja + korttitulostin",
        stats=[
            ("442 \u2192 460", "korttia",
             "nelj\u00e4 alusta joita ei ennen saanut", ORANGE),
            ("438 \u2192 0", "katkennutta solua",
             "L/F/R katkesi ennen 326 kertaa", BLUE),
            ("6", "korjattua vikaa",
             "kaikki l\u00f6ytyiv\u00e4t rasitustestist\u00e4", GREEN),
        ],
        left_title="KORTTI LUKEE PAREMMIN",
        left=[
            ("Fire arc on nyt kuva, ei kirjainlyhenne",
             ["Nelj\u00e4 lohkoa, etu yl\u00f6sp\u00e4in. Tumma = kiinte\u00e4 kaari,",
              "harmaa = valittavissa. Tummenna k\u00e4ytt\u00e4m\u00e4si lohko."]),
            ("Vaihtoehtoiset aseet omana ryhm\u00e4n\u00e4\u00e4n",
             ["Ympyr\u00e4 = valitse yksi, neli\u00f6 = itsen\u00e4inen valinta.",
              "K\u00e4yt\u00f6ss\u00e4 oleva ase on merkitty valmiiksi."]),
            ("Enemm\u00e4n tilaa siell\u00e4 miss\u00e4 sit\u00e4 tarvitaan",
             ["Aseistuslohko 4,5 mm leve\u00e4mpi ja 4,5 mm korkeampi.",
              "DAMAGE kahtena kaistana, crippled omalla otsikollaan."]),
        ],
        right_title="UUTTA JA KORJATTUA",
        right=[
            ("Uusia aluksia listoille",
             ["Seditio Opprimere \u2014 venerable battle barge,",
              "Space Marine -listojen 0\u20131 paikka",
              "Pthuxutl, Fra\u2019al Raider ja Nekulli Whip",
              "Rogue Trader -listoille"]),
            ("Korjattuja virheit\u00e4",
             ["Strike Cruiser laskutti kaksi launch bay -vaihtoa",
              "Chaos Vengeance n\u00e4ytti \u201dImperial Navy | pg. 58\u201d",
              "Nelj\u00e4n aluksen nimess\u00e4 luki hinta"]),
        ],
        qa_title="MITEN T\u00c4M\u00c4 VARMISTETTIIN",
        qa=[("Seitsem\u00e4n tarkistinta, kaikki nollassa",
             ["Kortit verrattu rivi rivilt\u00e4 l\u00e4hde-PDF:\u00e4\u00e4n.",
              "Rasitustesti ajaa jokaisen aluksen satunnaisilla",
              "valinnoilla: 75 000 tarkistusta, ei l\u00f6yd\u00f6ksi\u00e4."])],
        foot="460 korttia  \u00b7  30 laivastoa  \u00b7  818 listarivi\u00e4  \u00b7  "
             "171 alusprofiilia",
        foot_r="Gothic Fleet Registry.html  \u00b7  avaa selaimessa, tulosta A4",
    ),
    "en": dict(
        file="Gothic Fleet Registry - update 2026-09-06",
        sub="Update 6 Sep 2026  \u00b7  previous release 4 Sep 2026",
        role="fleet builder + card printer",
        stats=[
            ("442 \u2192 460", "cards", "four ships you could not field before",
             ORANGE),
            ("438 \u2192 0", "clipped cells", "L/F/R used to truncate 326 times",
             BLUE),
            ("6", "bugs fixed", "all found by the new stress test", GREEN),
        ],
        left_title="THE CARD READS BETTER",
        left=[
            ("Fire arc is a picture now, not a letter code",
             ["Four wedges, front up. Dark = fixed arc, grey = a",
              "choice. Darken the wedge you actually used."]),
            ("Alternative weapons form one group",
             ["Circle = pick one, square = independent option.",
              "The weapon in use is already marked."]),
            ("More room where it was needed",
             ["Armament block 4.5 mm wider and 4.5 mm taller.",
              "DAMAGE in two bands, crippled half labelled."]),
        ],
        right_title="NEW AND FIXED",
        right=[
            ("Ships added to the lists",
             ["Seditio Opprimere \u2014 venerable battle barge,",
              "the 0\u20131 slot on Space Marine lists",
              "Pthuxutl, Fra\u2019al Raider and Nekulli Whip",
              "on Rogue Trader lists"]),
            ("Bugs fixed",
             ["Strike Cruiser charged for two launch bay swaps",
              "Chaos Vengeance read \u201cImperial Navy | pg. 58\u201d",
              "Four ships carried their price in the name"]),
        ],
        qa_title="HOW THIS WAS CHECKED",
        qa=[("Seven checkers, all at zero",
             ["Cards compared line by line to the source PDF.",
              "A stress test runs every ship with random",
              "choices: 75,000 assertions, no findings."])],
        foot="460 cards  \u00b7  30 fleets  \u00b7  818 list entries  \u00b7  "
             "171 ship profiles",
        foot_r="Gothic Fleet Registry.html  \u00b7  open in a browser, print A4",
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

    text(30, H - 46, "GOTHIC FLEET REGISTRY", BLD, 27)
    text(30, H - 66, t["sub"], REG, 12, MUTED)
    text(W - 30, H - 46, t["role"], REG, 11, MUTED, "r")
    text(W - 30, H - 64, "Fleets WiP v0.36  \u00b7  Rulebook v1.10",
         REG, 10, MUTED, "r")
    c.setStrokeColorRGB(*ORANGE)
    c.setLineWidth(1.2)
    c.line(30, H - 78, W - 30, H - 78)

    bx, by = 30.0, H - 176.0
    bw, bh = (W - 60 - 2 * 12) / 3.0, 84.0
    for i, (big, lab, sub, col) in enumerate(t["stats"]):
        x = bx + i * (bw + 12)
        c.setFillColorRGB(*PANEL)
        c.roundRect(x, by, bw, bh, 4, stroke=0, fill=1)
        c.setFillColorRGB(*col)
        c.rect(x, by, bw, 3, stroke=0, fill=1)
        text(x + 14, by + bh - 32, big, BLD, 26)
        text(x + 14, by + bh - 50, lab, SEMI, 12, col)
        text(x + 14, by + 12, sub, REG, 9.5, MUTED)

    COL_W = (W - 60 - 16) / 2.0
    LX, RX = 30.0, 30.0 + COL_W + 16.0
    top = by - 26.0

    def block(x, y, title, color, rows, width):
        text(x, y, title, BLD, 13, color)
        c.setStrokeColorRGB(*color)
        c.setLineWidth(0.8)
        c.line(x, y - 6, x + width, y - 6)
        yy = y - 22
        for head, body in rows:
            text(x, yy, head, SEMI, 10.5)
            yy -= 12.5
            for line in body:
                text(x + 9, yy, line, REG, 9.5, MUTED)
                yy -= 11
            yy -= 6
        return yy

    block(LX, top, t["left_title"], ORANGE, t["left"], COL_W)
    ry = block(RX, top, t["right_title"], PURPLE, t["right"], COL_W)
    block(RX, ry - 4, t["qa_title"], GREEN, t["qa"], COL_W)

    c.setFillColorRGB(*PANEL)
    c.rect(0, 0, W, 34, stroke=0, fill=1)
    c.setFillColorRGB(*ORANGE)
    c.rect(0, 34, W, 1.2, stroke=0, fill=1)
    text(30, 13, t["foot"], SEMI, 10)
    text(W - 30, 13, t["foot_r"], REG, 9.5, MUTED, "r")

    c.showPage()
    c.save()

    doc = fitz.open(pdf)
    pix = doc[0].get_pixmap(matrix=fitz.Matrix(SCALE, SCALE))
    pix.save(png)
    doc.close()
    print("%s  %dx%d" % (png, pix.width, pix.height))


for lang in ("fi", "en"):
    build(lang)
