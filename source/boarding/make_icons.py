# -*- coding: utf-8 -*-
"""Kirjoittaa src/icons.json:n: laivastojen varit, laivastojen ikonit, runkotyyppien ikonit.

    python make_icons.py

Ikonit ovat omia yksinkertaistettuja muotoja 24x24-laatikossa (currentColor).
Ne muistuttavat 40k-faktioita mutta eivat kopioi yhtakaan julkaistua logoa.
build.py tarkistaa, etta jokaisella aluskannan laivastolla ja runkotyypilla on ikoni.
"""
import json, math, os

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'src', 'icons.json')


def f(v):
    s = ('%.2f' % v).rstrip('0').rstrip('.')
    return '0' if s in ('-0', '') else s


def pol(cx, cy, r, deg):
    a = math.radians(deg)
    return (cx + r * math.sin(a), cy - r * math.cos(a))


def poly(pts):
    return 'M' + ' L'.join(f(x) + ' ' + f(y) for x, y in pts) + ' Z'


def circle_path(cx, cy, r):
    # two arcs, so it can be combined with evenodd holes in one path
    return ('M%s %s A%s %s 0 1 0 %s %s A%s %s 0 1 0 %s %s Z' %
            (f(cx - r), f(cy), f(r), f(r), f(cx + r), f(cy), f(r), f(r), f(cx - r), f(cy)))


def P(d, extra=''):
    return '<path d="%s"%s/>' % (d, extra)


EO = ' fill-rule="evenodd"'
G = {}

# --- Imperial Navy: two-headed eagle -------------------------------------
G['aquila'] = ''.join([
    P('M10.6 10 L0.8 6.2 L2.2 9.4 L0.6 9.8 L3.2 12.6 L1.8 13.2 L5.2 15.8 L10.6 14.6 Z'),
    P('M13.4 10 L23.2 6.2 L21.8 9.4 L23.4 9.8 L20.8 12.6 L22.2 13.2 L18.8 15.8 L13.4 14.6 Z'),
    P('M12 8.6 L14.1 10.4 L14.1 16 L12 22 L9.9 16 L9.9 10.4 Z'),
    P('M11.7 10 L9.4 6.6 C8.2 7 6.8 6.4 6.4 5 L4.2 4.4 L6.6 3.4 C7.4 2 9.6 1.8 10.6 3.2 C11.4 4.4 11.6 5.6 12.9 9.4 Z'),
    P('M12.3 10 L14.6 6.6 C15.8 7 17.2 6.4 17.6 5 L19.8 4.4 L17.4 3.4 C16.6 2 14.4 1.8 13.4 3.2 C12.6 4.4 12.4 5.6 11.1 9.4 Z'),
])

# --- Space Marines: shield with a chevron ---------------------------------
G['shield'] = P('M12 1.8 L21 4.8 L21 11 C21 16.6 17.2 20.4 12 22.2 C6.8 20.4 3 16.6 3 11 L3 4.8 Z '
                'M6.6 14.6 L12 8.6 L17.4 14.6 L17.4 18 L12 12.4 L6.6 18 Z', EO)

# --- Adeptus Mechanicus: cog ---------------------------------------------
pts = []
teeth = 8
for i in range(teeth):
    base = i * 360.0 / teeth
    for d, r in ((-15.5, 8.2), (-9.5, 11.4), (9.5, 11.4), (15.5, 8.2)):
        pts.append(pol(12, 12, r, base + d))
G['cog'] = P(poly(pts) + ' ' + circle_path(12, 12, 3.7), EO)

# --- Inquisition: the great I --------------------------------------------
G['inq'] = ''.join([
    P('M9.6 2 L14.4 2 L14.4 22 L9.6 22 Z'),
    P('M5.5 2 L18.5 2 L18.5 4.6 L5.5 4.6 Z'),
    P('M5.5 19.4 L18.5 19.4 L18.5 22 L5.5 22 Z'),
    P('M1.5 10.4 L22.5 10.4 L22.5 13.6 L1.5 13.6 Z'),
    P(circle_path(12, 12, 4.3) + ' ' + circle_path(12, 12, 2.1), EO),
])

# --- Rogue Traders: compass star -----------------------------------------
pts = []
for i in range(16):
    deg = i * 22.5
    if i % 4 == 0:
        r = 11.4
    elif i % 2 == 0:
        r = 6.4
    else:
        r = 2.5
    pts.append(pol(12, 12, r, deg))
G['compass'] = P(poly(pts))

# --- Chaos: eight-pointed star -------------------------------------------
parts = [circle_path(12, 12, 3.3)]
for i in range(8):
    deg = i * 45
    hw, sr, hr, tip = 1.05, 7.4, 2.7, 11.4
    a = math.radians(deg)
    ux, uy = math.sin(a), -math.cos(a)        # outward
    px, py = -uy, ux                           # sideways
    c = lambda r, s: (12 + ux * r + px * s, 12 + uy * r + py * s)
    parts.append(poly([c(0, -hw), c(sr, -hw), c(sr, -hr), c(tip, 0), c(sr, hr), c(sr, hw), c(0, hw)]))
G['chaos'] = P(' '.join(parts))

# --- Orks: angry tusked skull --------------------------------------------
G['orkskull'] = P('M3 6.5 L8 2.6 L16 2.6 L21 6.5 L20.2 13.4 L17.4 15.2 L17.4 19.6 L14.2 21.8 '
                  'L9.8 21.8 L6.6 19.6 L6.6 15.2 L3.8 13.4 Z '
                  'M5.8 8.2 L11 9.8 L10.4 12.6 L6.6 11.6 Z '
                  'M18.2 8.2 L13 9.8 L13.6 12.6 L17.4 11.6 Z '
                  'M8.8 16 L10.4 16 L10.8 18.2 L11.4 16 L12.6 16 L13.2 18.2 L13.6 16 L15.2 16 '
                  'L14.6 19.4 L9.4 19.4 Z', EO)

# --- Eldar: spear rune over a crescent -----------------------------------
G['eldar'] = ''.join([
    P('M12 0.8 C15.6 6.4 15.6 12.6 12 20.4 C8.4 12.6 8.4 6.4 12 0.8 Z M12 6.4 C13.1 8.8 13.1 11.4 12 14.2 C10.9 11.4 10.9 8.8 12 6.4 Z', EO),
    P('M1.2 4.6 C2.8 14.6 7.4 19.6 12 19.6 C16.6 19.6 21.2 14.6 22.8 4.6 C19.8 11.6 16.2 16 12 16 '
      'C7.8 16 4.2 11.6 1.2 4.6 Z'),
    P('M9.8 19.2 L14.2 19.2 L12 23.4 Z'),
])

# --- Dark Eldar: barbed blade crown --------------------------------------
G['drukhari'] = P('M12 22.5 L9.2 13.5 L1.5 2.5 L8.4 7.6 L12 1 L15.6 7.6 L22.5 2.5 L14.8 13.5 Z '
                  'M12 9 L13.4 12.6 L12 16.5 L10.6 12.6 Z', EO)

# --- Necrons: ankh glyph -------------------------------------------------
G['ankh'] = ''.join([
    P(circle_path(12, 6.2, 4.9) + ' ' + circle_path(12, 6.2, 2.6), EO),
    P('M10.8 10.6 L13.2 10.6 L13.2 22.5 L10.8 22.5 Z'),
    P('M2.5 12 L21.5 12 L21.5 14.4 L2.5 14.4 Z'),
    P('M2.5 12 L4.9 12 L4.9 18.5 L2.5 18.5 Z'),
    P('M19.1 12 L21.5 12 L21.5 18.5 L19.1 18.5 Z'),
])

# --- Tyranids: three talons ----------------------------------------------
def talon(x0, top):
    return ('M%s 22.5 C%s 16 %s 8 %s %s C%s %s %s 16 %s 22.5 Z' %
            (f(x0), f(x0 - 1.2), f(x0 + 1.2), f(x0 + 5.2), f(top),
             f(x0 + 2.6), f(top + 6), f(x0 + 3.4), f(x0 + 3.8)))
G['talons'] = P(' '.join([talon(2.2, 5), talon(8.6, 1.5), talon(15, 5)]))

# --- Tau: sun over the horizon -------------------------------------------
pts = []
for i in range(0, 181):
    x, y = pol(12, 9.6, 6.2, -90 + i)          # upper half of the sun, left to right
    pts.append((x, y))
G['tau'] = ''.join([
    P(poly([(5.8, 11.6)] + pts[1:-1] + [(18.2, 11.6)])),
    P('M0.8 19.6 C6.2 12 17.8 12 23.2 19.6 L23.2 22.4 C17.8 15.6 6.2 15.6 0.8 22.4 Z'),
])

# --- Kroot: quill --------------------------------------------------------
G['quill'] = P('M21 2.2 C12.5 3.2 6.2 9.6 5.2 18.4 L3 22.4 L5.2 22.4 L6.8 19.2 '
               'C9.6 18.6 11.4 17.4 12.6 15.8 L10 15.6 L14.2 13.6 C15 12.6 15.6 11.4 16.2 10 '
               'L13.6 9.8 L17.4 7.8 C18.8 6.4 20.2 4.6 21 2.2 Z')

# --- Demiurg: anvil ------------------------------------------------------
G['anvil'] = P('M2.5 6.5 L18.5 6.5 C18.5 8.8 20.2 9.9 22.5 9.9 L22.5 11.2 C19.4 11.2 17.2 12.2 16 13.6 '
               'L16 15.4 L18.4 17.6 L18.4 20.5 L5.6 20.5 L5.6 17.6 L8 15.4 L8 13.6 '
               'C6 12.6 3.8 10.6 2.5 8.8 Z')

# --- Nicassar: spiral ----------------------------------------------------
pts = []
steps = 60
for i in range(steps + 1):
    t = i / float(steps)
    ang = 90 + t * 2.3 * 360
    r = 1.2 + t * 9.6
    pts.append(pol(12, 12, r, ang))
G['spiral'] = ('<path d="M' + ' L'.join(f(x) + ' ' + f(y) for x, y in pts) +
               '" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>')

# --- Orbital defences: armed station ring --------------------------------
parts = [circle_path(12, 12, 8.4) + ' ' + circle_path(12, 12, 6.0)]
G['station'] = ''.join([
    P(parts[0], EO),
    P(circle_path(12, 12, 2.8)),
    P('M11 1 L13 1 L13 5 L11 5 Z M11 19 L13 19 L13 23 L11 23 Z M1 11 L5 11 L5 13 L1 13 Z M19 11 L23 11 L23 13 L19 13 Z'),
    P('M11.2 6.5 L12.8 6.5 L12.8 17.5 L11.2 17.5 Z M6.5 11.2 L17.5 11.2 L17.5 12.8 L6.5 12.8 Z'),
])

# --- Planetary defences: gun tower on a world ----------------------------
G['groundgun'] = ''.join([
    P('M0.5 23.5 C4 17.4 20 17.4 23.5 23.5 Z'),
    P('M8.6 19 L8.6 9.8 L10 8.2 L10 6.6 L14 6.6 L14 8.2 L15.4 9.8 L15.4 19 Z'),
    P('M13 7.6 L20.8 1.2 L22.2 2.8 L14.6 9.4 Z'),
])

# --- Civilian vessels: cargo crate ---------------------------------------
G['crate'] = P('M3 6.5 L12 2 L21 6.5 L21 17.5 L12 22 L3 17.5 Z '
               'M5.4 8.3 L10.8 11 L10.8 19 L5.4 16.3 Z '
               'M13.2 11 L18.6 8.3 L18.6 16.3 L13.2 19 Z '
               'M7 6.6 L12 4.3 L17 6.6 L12 9 Z', EO)

# --- hull classes, prow up ----------------------------------------------
H = {}
H['All'] = P('M3 3 L10.6 3 L10.6 10.6 L3 10.6 Z M13.4 3 L21 3 L21 10.6 L13.4 10.6 Z '
             'M3 13.4 L10.6 13.4 L10.6 21 L3 21 Z M13.4 13.4 L21 13.4 L21 21 L13.4 21 Z')
H['Escort'] = P('M12 4 L16.2 11.2 L16.2 19.8 L12 17.4 L7.8 19.8 L7.8 11.2 Z')
H['Cruiser'] = P('M12 3 L14.6 6.6 L14.6 10.6 L18.6 13 L18.6 16.6 L14.6 17.6 L14.6 21 L9.4 21 L9.4 17.6 '
                 'L5.4 16.6 L5.4 13 L9.4 10.6 L9.4 6.6 Z')
H['Grand Cruiser'] = P('M12 1 L14.4 4.4 L14.4 8.6 L18.8 10.8 L18.8 14 L14.4 15 L14.4 16.6 L18.8 18.6 '
                       'L18.8 21.2 L14.4 21.6 L14.4 23 L9.6 23 L9.6 21.6 L5.2 21.2 L5.2 18.6 L9.6 16.6 '
                       'L9.6 15 L5.2 14 L5.2 10.8 L9.6 8.6 L9.6 4.4 Z')
H['Battleship'] = P('M12 0.8 L16.4 5 L16.4 9 L20.8 11 L20.8 15.6 L16.4 16.6 L16.4 19.2 L19.2 20.4 L19.2 23.2 '
                    'L4.8 23.2 L4.8 20.4 L7.6 19.2 L7.6 16.6 L3.2 15.6 L3.2 11 L7.6 9 L7.6 5 Z')
hexo = [pol(12, 12, 10.6, 30 + 60 * i) for i in range(6)]
hexi = [pol(12, 12, 5.4, 30 + 60 * i) for i in range(6)]
H['Defence'] = P(poly(hexo) + ' ' + poly(hexi), EO) + P(circle_path(12, 12, 2.4))
H['Ground'] = G['groundgun']

FLEETS = {
    'IMPERIAL NAVY':       ['#e2b84a', 'aquila'],
    'SPACE MARINES':       ['#5b8cf0', 'shield'],
    'ADEPTUS MECHANICUS':  ['#e0562e', 'cog'],
    'INQUISITION':         ['#dfe3ea', 'inq'],
    'ROGUE TRADERS':       ['#35c2ab', 'compass'],
    'CHAOS':               ['#e2403f', 'chaos'],
    'ORKS':                ['#7cc23a', 'orkskull'],
    'ELDAR':               ['#6fd3f7', 'eldar'],
    'DARK ELDAR':          ['#a874f0', 'drukhari'],
    'NECRON':              ['#3ef0a6', 'ankh'],
    'TYRANID':             ['#df5fb2', 'talons'],
    'TAU KOR’VATTRA':      ['#ef9f4e', 'tau'],
    'TAU KOR’OR’VESH':     ['#e27d34', 'tau'],
    'TAU':                 ['#dcb57e', 'tau'],
    'KROOT':               ['#c29a66', 'quill'],
    'DEMIURG':             ['#c98a45', 'anvil'],
    'NICASSAR':            ['#bfaef5', 'spiral'],
    'HIGH ORBIT DEFENCES': ['#a9b8c9', 'station'],
    'LOW ORBIT DEFENCES':  ['#93b39e', 'groundgun'],
    'ADDITIONAL VESSELS':  ['#a7adb5', 'crate'],
}

out = {
    'note': 'Generated by make_icons.py - edit that, not this.',
    'fleets': {k: {'color': v[0], 'glyph': v[1]} for k, v in FLEETS.items()},
    'glyphs': G,
    'hulls': H,
}
with open(OUT, 'w', encoding='utf-8', newline='\n') as fh:
    json.dump(out, fh, ensure_ascii=False, indent=1, sort_keys=True)
    fh.write('\n')
print('wrote', OUT, len(G), 'glyphs', len(H), 'hulls')
