"""Gothic Fleet Play's icon: a ship seen from above, the small tab icon and the
installed app's PNGs from one outline.

    python apps/play/assets/make_icons.py        (writes icon-192.png, icon-512.png,
                                                  prints the tab icon for index.html)
"""
import io, os, sys
from PIL import Image, ImageDraw

BG, SHIP = (20, 36, 63), (111, 208, 188)
BG_HEX, SHIP_HEX = "%2314243F", "%236FD0BC"
# on a 16-wide grid: prow, gun decks, stern
SHIP_PTS = [(8, 1.2), (10, 5), (10, 7), (13.4, 8.4), (13.4, 10.6), (10.2, 10.6), (10.8, 14.6),
            (5.2, 14.6), (5.8, 10.6), (2.6, 10.6), (2.6, 8.4), (6, 7), (6, 5)]

def png(size, radius=3.0):
    k = 4
    s = size * k / 16
    im = Image.new("RGBA", (size * k, size * k), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.rounded_rectangle((0, 0, size * k - 1, size * k - 1), radius=radius * s, fill=BG + (255,))
    d.polygon([(x * s, y * s) for x, y in SHIP_PTS], fill=SHIP + (255,))
    return im.resize((size, size), Image.LANCZOS)

def data_uri():
    pts = " ".join("%g %g" % p for p in SHIP_PTS)
    return ("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E"
            "%3Crect width='16' height='16' rx='3' fill='" + BG_HEX + "'/%3E"
            "%3Cpath d='M" + pts + "z' fill='" + SHIP_HEX + "'/%3E%3C/svg%3E")

if __name__ == "__main__":
    here = sys.argv[1] if len(sys.argv) > 1 else os.path.dirname(os.path.abspath(__file__))
    for n in (192, 512):
        png(n).save(os.path.join(here, "icon-%d.png" % n))
    print(data_uri())
