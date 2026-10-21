# -*- coding: utf-8 -*-
"""Reddit-dia. Kayttaa valmiita esimerkkikortteja, ei tee niita uudestaan.

Redditissa mitat ovat eri kuin Discordissa: sy\u00f6te on pystysuuntainen ja
suurin osa lukijoista on puhelimella, joten 4:5 vie enemman tilaa kuin
16:9 ja teksti on isompaa. Kuvan on kerrottava asia kahdessa sekunnissa,
koska loput luetaan postauksen tekstista - tai ei lueta lainkaan.

Kortti on kuva tuotteesta, joten se on iso ja ylhaalla: pikkukuvasta
tunnistaa aluskortin ennen kuin ehtii lukea otsikkoa.

Aja tassa kansiossa:  python make_reddit_slide.py
"""
import os
import sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from luvut import LUVUT   # julkaisutekstien luvut datasta, ei kasin
import os

from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
CARD = os.path.join(HERE, "esimerkkikortit",
                    "03 - CHAOS BATTLE BARGE (pg 255).png")
OUT = os.path.join(HERE, "Gothic Fleet Registry - reddit.png")

W, H = 1200, 1560
M = 40

INK = (0x21, 0x1F, 0x20)
PAPER = (0xF6, 0xF2, 0xE9)
ORANGE = (0xD1, 0x79, 0x2A)
MUTED = (0xB9, 0xB3, 0xAC)
DIM = (0x8C, 0x87, 0x81)
GREEN = (0x6C, 0xA5, 0x72)
BLUE = (0x4E, 0x7C, 0xB8)
PANEL = (0x2E, 0x2A, 0x29)


def font(size, bold=False, semi=False):
    p = (r"C:\Windows\Fonts\segoeuib.ttf" if bold else
         r"C:\Windows\Fonts\seguisb.ttf" if semi else
         r"C:\Windows\Fonts\segoeui.ttf")
    if not os.path.exists(p):
        p = r"C:\Windows\Fonts\arial.ttf"
    return ImageFont.truetype(p, size)


im = Image.new("RGB", (W, H), INK)
d = ImageDraw.Draw(im)
d.rectangle([0, 0, 9, H], fill=ORANGE)

# --- otsikko ---------------------------------------------------------------
d.text((M, 34), "GOTHIC FLEET REGISTRY", font=font(52, bold=True), fill=PAPER)
d.text((M, 98), "Fleet builder and printable ship cards for",
       font=font(28), fill=MUTED)
d.text((M, 132), "Battlefleet Gothic: Remastered", font=font(28, semi=True),
       fill=ORANGE)
d.text((W - M, 40), "free", font=font(30, semi=True), fill=GREEN, anchor="ra")
d.text((W - M, 80), "one HTML file", font=font(24), fill=MUTED, anchor="ra")
d.text((W - M, 110), "no install, works offline", font=font(24), fill=MUTED,
       anchor="ra")
d.line([(M, 178), (W - M, 178)], fill=ORANGE, width=3)

# --- kortti ----------------------------------------------------------------
card = Image.open(CARD).convert("RGB")
cw = W - 2 * M
ch = int(card.height * cw / card.width)
card = card.resize((cw, ch), Image.LANCZOS)
CARD_Y = 196
im.paste(card, (M, CARD_Y))
d.text((M, CARD_Y + ch + 12), "One A4 card per ship, two to a page.",
       font=font(24, semi=True), fill=DIM)

# --- luvut -----------------------------------------------------------------
y = CARD_Y + ch + 56
bw = (W - 2 * M - 2 * 14) // 3
for i, (big, lab, col) in enumerate([("30", "fleet lists", ORANGE),
                                     ("171", "ship profiles", BLUE),
                                     ("460", "printable cards", GREEN)]):
    x = M + i * (bw + 14)
    d.rounded_rectangle([x, y, x + bw, y + 108], 6, fill=PANEL)
    d.rectangle([x, y, x + bw, y + 4], fill=col)
    d.text((x + 18, y + 22), big, font=font(46, bold=True), fill=PAPER)
    d.text((x + 18, y + 76), lab, font=font(23), fill=MUTED)

# --- luottamuslause -------------------------------------------------------
# Yksi lause riittaa kuvaan: loput luetaan postauksen tekstista. Tama on se
# vaite jolla on merkitysta epailijalle, joten se on kuvassa.
y += 132
d.text((M, y), "Every value is pulled from the books and checked line by "
       "line against the", font=font(24), fill=MUTED)
d.text((M, y + 30), "source PDF. The page number is printed on every card, "
       "so you can look it up.", font=font(24), fill=MUTED)

# --- alapalkki -------------------------------------------------------------
d.rectangle([0, H - 56, W, H], fill=PANEL)
d.rectangle([0, H - 58, W, H - 55], fill=ORANGE)
d.text((M, H - 40), "Imperial Navy · Space Marines · Chaos · Eldar · Orks · "
       "Tau · Necrons · Tyranids · AdMech · more",
       font=font(22, semi=True), fill=PAPER)

im.save(OUT, optimize=True)
print("%s  %dx%d  %d kB" % (OUT, im.width, im.height,
                            os.path.getsize(OUT) / 1024))
