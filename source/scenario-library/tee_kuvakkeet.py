# -*- coding: utf-8 -*-
"""Scenario Libraryn kuvakkeet PNG:inä (iOS ei käytä data-URI-kuvaketta).

Piirtää saman kuvion kuin index.html:n SVG-favicon: tumma pohja, pöydän
kehys, kaksi asettelukaistaa (sininen ja punainen) ja planeetta keskellä.
Piirretään 8-kertaisena ja pienennetään, jolloin reunat pehmenevät.

  python tee_kuvakkeet.py   ->  apple-touch-icon.png (180 px), favicon.png (32 px)
"""
import os
from PIL import Image, ImageDraw

HERE = os.path.dirname(os.path.abspath(__file__))
BG, FRAME, A, B, SUN = "#070a11", "#94a9c4", "#6fa3e0", "#e07a5f", "#e8a33d"


def draw(size, rounded):
    k = 8
    S = size * k
    u = S / 32.0  # SVG:n viewBox on 32 x 32
    im = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    if rounded:
        d.rounded_rectangle([0, 0, S - 1, S - 1], radius=6 * u, fill=BG)
    else:
        d.rectangle([0, 0, S, S], fill=BG)  # iOS pyöristää kulmat itse
    d.rectangle([5 * u, 7 * u, 10 * u, 25 * u], fill=A)
    d.rectangle([22 * u, 7 * u, 27 * u, 25 * u], fill=B)
    d.rounded_rectangle([5 * u, 7 * u, 27 * u, 25 * u], radius=1.5 * u, outline=FRAME, width=round(1.6 * u))
    d.ellipse([12.8 * u, 12.8 * u, 19.2 * u, 19.2 * u], fill=SUN)
    return im.resize((size, size), Image.LANCZOS)


if __name__ == "__main__":
    draw(180, False).convert("RGB").save(os.path.join(HERE, "apple-touch-icon.png"), optimize=True)
    draw(32, True).save(os.path.join(HERE, "favicon.png"), optimize=True)
    print("apple-touch-icon.png, favicon.png")
