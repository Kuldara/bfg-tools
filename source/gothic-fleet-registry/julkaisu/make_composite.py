# -*- coding: utf-8 -*-
"""Yhdistaa kortin ja konfiguraattorikuvan yhdeksi PNG:ksi alusta kohden.

Kortti yksin ei kerro etta valinnat tehtiin ennen tulostusta. Vierekkain
ne kertovat: vasemmalla mita tulostuu, oikealla mita valittiin. Hive
shipilla ero on suurin - kuudestatoista optiosta yksitoista on Hide.

Konfiguraattorikuva rajataan sisaltoon: kuvakaappaus on korkea ja
alaosa on tyhjaa taustaa.

Aja tassa kansiossa (make_examples.js ja make_optshot.js ensin, ja
kuvakaappaukset niiden jalkeen):  python make_composite.py
"""
import json
import os

from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
ONE = os.path.join(HERE, "esimerkkikortit")
OUT = os.path.join(HERE, "esimerkit")

INK = (0x21, 0x1F, 0x20)
PAPER = (0xF6, 0xF2, 0xE9)
ORANGE = (0xD1, 0x79, 0x2A)
MUTED = (0xB9, 0xB3, 0xAC)
DIM = (0x8C, 0x87, 0x81)
PANEL_BG = (0x0F, 0x15, 0x1B)


def font(size, bold=False, semi=False):
    name = (r"C:\Windows\Fonts\segoeuib.ttf" if bold else
            r"C:\Windows\Fonts\seguisb.ttf" if semi else
            r"C:\Windows\Fonts\segoeui.ttf")
    if not os.path.exists(name):
        name = r"C:\Windows\Fonts\arial.ttf"
    return ImageFont.truetype(name, size)


def trim(im, bg, pad=0):
    """Rajaa yhtenaisen taustavarin pois reunoilta."""
    px = im.convert("RGB")
    w, h = px.size
    data = px.load()

    def row_empty(y):
        return all(data[x, y] == bg for x in range(0, w, 3))

    def col_empty(x):
        return all(data[x, y] == bg for y in range(0, h, 3))

    top = 0
    while top < h - 1 and row_empty(top):
        top += 1
    bot = h - 1
    while bot > top and row_empty(bot):
        bot -= 1
    left = 0
    while left < w - 1 and col_empty(left):
        left += 1
    right = w - 1
    while right > left and col_empty(right):
        right -= 1
    box = (max(0, left - pad), max(0, top - pad),
           min(w, right + 1 + pad), min(h, bot + 1 + pad))
    return im.crop(box)


def wrap(draw, text, fnt, width):
    words, lines, cur = text.split(), [], ""
    for wd in words:
        test = (cur + " " + wd).strip()
        if draw.textlength(test, font=fnt) <= width:
            cur = test
        else:
            if cur:
                lines.append(cur)
            cur = wd
    if cur:
        lines.append(cur)
    return lines


def build(entry):
    card_p = os.path.join(ONE, entry["base"] + ".png")
    opt_p = os.path.join(ONE, entry["base"] + " opt.png")
    card = Image.open(card_p).convert("RGB")
    opt = trim(Image.open(opt_p).convert("RGB"), PANEL_BG, pad=10)

    M, GAP = 40, 30
    HEAD, LBL = 118, 34
    body_h = card.height
    scale = min(1.0, body_h / float(opt.height))
    opt_w, opt_h = int(opt.width * scale), int(opt.height * scale)
    if scale < 1.0:
        opt = opt.resize((opt_w, opt_h), Image.LANCZOS)

    W = M + card.width + GAP + opt_w + M
    cap_f = font(23)
    tmp = ImageDraw.Draw(Image.new("RGB", (10, 10)))
    cap_lines = wrap(tmp, entry["why"], cap_f, W - 2 * M)
    CAP = 16 + len(cap_lines) * 30 + 14
    H = HEAD + LBL + body_h + CAP + M

    im = Image.new("RGB", (W, H), INK)
    d = ImageDraw.Draw(im)
    d.rectangle([0, 0, 8, H], fill=ORANGE)

    d.text((M, 30), entry["nm"], font=font(38, bold=True), fill=PAPER)
    d.text((M, 76), "%s  ·  Fleets WiP pg. %s" % (entry["list"], entry["pg"]),
           font=font(23), fill=MUTED)
    d.line([(M, HEAD - 10), (W - M, HEAD - 10)], fill=ORANGE, width=2)

    y = HEAD + 4
    d.text((M, y), "THE CARD YOU PRINT", font=font(20, semi=True), fill=ORANGE)
    d.text((M + card.width + GAP, y), "HOW IT WAS CONFIGURED",
           font=font(20, semi=True), fill=(0x6C, 0xA5, 0x72))

    top = HEAD + LBL
    im.paste(card, (M, top))
    im.paste(opt, (M + card.width + GAP, top))

    yy = top + body_h + 16
    for line in cap_lines:
        d.text((M, yy), line, font=cap_f, fill=MUTED)
        yy += 30

    os.makedirs(OUT, exist_ok=True)
    out = os.path.join(OUT, entry["base"] + ".png")
    im.save(out, optimize=True)
    return out, im.size


manifest = json.load(open(os.path.join(HERE, "_manifest.json"), encoding="utf-8"))
for e in manifest:
    p, size = build(e)
    print("%-52s %dx%d  %d kB" % (os.path.basename(p), size[0], size[1],
                                  os.path.getsize(p) / 1024))
