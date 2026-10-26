# -*- coding: utf-8 -*-
"""The link preview image, 1200x630.

This is the image Discord, Reddit and Bluesky show when someone
pastes the address. In practice it is the only thing visible before
anyone clicks anything, so it holds two things: what this is, and
what the result looks like.

The card is real output of the app, not a drawing. The image is taken from
a finished example card - those are not made again.

1200x630 is the Open Graph recommendation. Discord shows it as a wide
card-sized image when the page has twitter:card=summary_large_image.

Run in this folder:  python make_og.py
"""
import os
import sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from published_counts import COUNTS   # the advertised numbers come from the data, not by hand
import os

from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
CARD = os.path.join(HERE, "..", "..", "..", "marketing", "registry", "esimerkkikortit",
                    "03 - CHAOS BATTLE BARGE (pg 255).png")
OUT = os.path.join(HERE, "og.png")

W, H = 1200, 630

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
d.rectangle([0, 0, 8, H], fill=ORANGE)

# --- the card on the right ------------------------------------------------
# The card goes first, so the text can be positioned by it when needed.
# It reaches over the top and bottom edges, so the image looks bigger
# than it is and the card still reads.
card = Image.open(CARD).convert("RGB")
ch = 560
cw = int(card.width * ch / card.height)
card = card.resize((cw, ch), Image.LANCZOS)
CARD_X = W - cw - 34
im.paste(card, (CARD_X, (H - ch) // 2))

M = 54
TEXT_W = CARD_X - M - 34

# --- heading --------------------------------------------------------------
d.text((M, 60), "GOTHIC FLEET", font=font(58, bold=True), fill=PAPER)
d.text((M, 122), "REGISTRY", font=font(58, bold=True), fill=PAPER)
d.line([(M, 200), (M + TEXT_W, 200)], fill=ORANGE, width=3)

d.text((M, 222), "Fleet builder and printable", font=font(26), fill=MUTED)
d.text((M, 254), "ship cards for", font=font(26), fill=MUTED)
d.text((M, 286), "Battlefleet Gothic: Remastered",
       font=font(26, semi=True), fill=ORANGE)

# --- numbers --------------------------------------------------------------
# Three numbers are enough for scale. They are the same as on the other slides,
# so the post and the preview tell the same thing.
y = 344
bw = (TEXT_W - 2 * 10) // 3
# From the data (published_counts.py -> counts.js): hard-coded numbers stayed at 30 / 171 /
# 460 while the data grew to 32 / 176 / 738.
for i, (big, lab, col) in enumerate([(str(COUNTS["lists"]), "fleet lists", ORANGE),
                                     (str(COUNTS["profiles"]), "profiles", BLUE),
                                     (str(COUNTS["cards"]), "cards", GREEN)]):
    x = M + i * (bw + 10)
    d.rounded_rectangle([x, y, x + bw, y + 96], 5, fill=PANEL)
    d.rectangle([x, y, x + bw, y + 3], fill=col)
    d.text((x + 14, y + 18), big, font=font(40, bold=True), fill=PAPER)
    d.text((x + 14, y + 66), lab, font=font(19), fill=MUTED)

# --- bottom lines ---------------------------------------------------------
y = 470
for i, t in enumerate(["free", "one HTML file", "no install",
                       "works offline"]):
    d.text((M, y + i * 30), "-  " + t, font=font(22), fill=DIM)

im.save(OUT, optimize=True)
print("%s  %dx%d  %.0f kB" % (OUT, im.width, im.height,
                              os.path.getsize(OUT) / 1024))
