/* The rolling core: dice, battlezone tables, geometry, generate() and the
   rules text. The Battlezone Generator includes this file in its page (apps/terrain), and
   the Scenario Library loads it as battlezone-core.js, namespaced as BZ
   (packages/battlezone/index.js). It must not touch the page. */

/* ═══════════════════════════════════════════════════════════════════ DICE
   mulberry32 — the same generator the companion battle simulator uses, so a
   seed produces the same map in both. Every roll in this file goes through
   these four methods and nowhere else; that is what makes the log an audit
   trail rather than a decoration. */

function makeRng(seed) {
  let a = (seed >>> 0) || 1;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function Dice(seed) {
  const r = makeRng(seed);
  this.d6 = function () { return 1 + Math.floor(r() * 6); };
  this.d3 = function () { return 1 + Math.floor(r() * 3); };
  this.d66 = function () { return this.d6() + this.d6(); };      // 2D6, i.e. 2–12
  this.range = function (a, b) { return a + r() * (b - a); };
}

/* ═════════════════════════════════════════════════════ BATTLEZONE TABLES
   The six generators, pp. 107–108, transcribed row for row. `out` is what
   the row produces: a count of templates of one kind, a whole-table event,
   or a planet with the sub-roll that sizes it. */

const PLANET_SUB = {
  //  "roll again: 1-5 = small, 6 = medium"      (generators 1–4, p. 107)
  small5:     { text: '1–5 small, 6 medium', of: function (r) { return r <= 5 ? 'small' : 'medium'; } },
  //  "roll again: 1-3 = small, 4-6 = large"     (Outer Reaches, p. 108)
  outer:      { text: '1–3 small, 4–6 large',  of: function (r) { return r <= 3 ? 'small' : 'large'; } }
};

const ZONES = [
  { n: 1, key: 'flare', name: 'Flare Region', page: 107,
    blurb: 'Hard against the star. Half of everything here is a flare or a burst.',
    rows: [
      { text: 'Solar flare',              out: { kind: 'flare' } },
      { text: 'Solar flare',              out: { kind: 'flare' } },
      { text: 'Radiation burst',          out: { kind: 'radiation' } },
      { text: 'Asteroid field',           out: { kind: 'asteroid', count: 1 } },
      { text: 'D3 gas/dust clouds',       out: { kind: 'gas', count: 'd3' } },
      { text: 'Planet',                   out: { kind: 'planet', sub: 'small5' } }
    ] },

  { n: 2, key: 'mercurial', name: 'Mercurial Zone', page: 107,
    blurb: 'Inside the first orbit. Filaments and flare remnants, fewer flares.',
    rows: [
      { text: 'Solar flare',              out: { kind: 'flare' } },
      { text: 'Radiation burst',          out: { kind: 'radiation' } },
      { text: 'Asteroid field',           out: { kind: 'asteroid', count: 1 } },
      { text: 'D3 gas/dust clouds',       out: { kind: 'gas', count: 'd3' } },
      { text: 'D3 gas/dust clouds',       out: { kind: 'gas', count: 'd3' } },
      { text: 'Planet',                   out: { kind: 'planet', sub: 'small5' } }
    ] },

  { n: 3, key: 'inner', name: 'Inner Biosphere', page: 107,
    blurb: 'The warm orbits. Rock and dust, with the odd burst of hard light.',
    rows: [
      { text: 'Roll again: 1–3 radiation burst, 4–6 solar flare', out: { kind: 'event6' } },
      { text: 'Asteroid field',           out: { kind: 'asteroid', count: 1 } },
      { text: 'D3 asteroid fields',       out: { kind: 'asteroid', count: 'd3' } },
      { text: 'D3 gas/dust clouds',       out: { kind: 'gas', count: 'd3' } },
      { text: 'D3 gas/dust clouds',       out: { kind: 'gas', count: 'd3' } },
      { text: 'Planet',                   out: { kind: 'planet', sub: 'small5' } }
    ] },

  { n: 4, key: 'primary', name: 'Primary Biosphere', page: 107,
    blurb: 'The habitable band. No flares, no radiation — the steady battlefield.',
    rows: [
      { text: 'Asteroid field',           out: { kind: 'asteroid', count: 1 } },
      { text: 'D3 asteroid fields',       out: { kind: 'asteroid', count: 'd3' } },
      { text: 'Gas/dust clouds',          out: { kind: 'gas', count: 1 },
        note: 'The table prints this row in the plural with no die, where the facing page ' +
              'prints “Gas/dust cloud” singular for the same result. This tool reads it as one.' },
      { text: 'D3 gas/dust clouds',       out: { kind: 'gas', count: 'd3' } },
      { text: 'Planet',                   out: { kind: 'planet', sub: 'small5' } },
      { text: 'Planet',                   out: { kind: 'planet', sub: 'small5' } }
    ] },

  { n: 5, key: 'outer', name: 'Outer Reaches', page: 108,
    blurb: 'Gas giants and thick belts. The only zone that can produce a large planet.',
    rows: [
      { text: 'D3+1 asteroid fields',     out: { kind: 'asteroid', count: 'd3+1' } },
      { text: 'D3 asteroid fields',       out: { kind: 'asteroid', count: 'd3' } },
      { text: 'D3 gas/dust clouds',       out: { kind: 'gas', count: 'd3' } },
      { text: 'Gas/dust cloud',           out: { kind: 'gas', count: 1 } },
      { text: 'Planet',                   out: { kind: 'planet', sub: 'outer' } },
      { text: 'Planet',                   out: { kind: 'planet', sub: 'outer' } }
    ] },

  { n: 6, key: 'deep', name: 'Deep Space', page: 108,
    blurb: 'Between the stars. Rogue planets in eccentric orbits, and tears in realspace.',
    rows: [
      { text: 'D3 asteroid fields',       out: { kind: 'asteroid', count: 'd3' } },
      { text: 'Asteroid fields',          out: { kind: 'asteroid', count: 1 },
        note: 'The table prints this row in the plural with no die, against “D3 asteroid ' +
              'fields” on the row above. This tool reads it as one.' },
      { text: 'D3 gas/dust clouds',       out: { kind: 'gas', count: 'd3' } },
      { text: 'Gas/dust cloud',           out: { kind: 'gas', count: 1 } },
      { text: 'Warp rift',                out: { kind: 'rift', count: 1 },
        note: 'The book runs gas clouds (p. 110) and asteroid fields (p. 111) parallel to the ' +
              'sunward edge and says nothing about a rift’s orientation. This tool lines it up ' +
              'with the others.' },
      { text: 'Small planet',             out: { kind: 'planet', fixed: 'small' } }
    ] }
];

/* Sunward edge, p. 109. The mapping is printed as a diagram, not as text, and
   it is deliberately lopsided: each long edge takes two faces, each short edge
   one. Do not "fix" this into a uniform quarter each. */
const SUN_EDGE = { 1: 'left', 2: 'top', 3: 'top', 4: 'bottom', 5: 'bottom', 6: 'right' };

/* Planet bands, p. 113. The book prints diameter ranges and gravity wells but
   no die for the diameter, so a D6 walks each band end to end — including both
   endpoints, which is the part an invented roll usually gets wrong. */
const PLANET_BAND = {
  //  The book prints only "up to 15cm" for a small planet, with no floor, so the
  //  10 cm bottom end is this tool's and the log says so. Medium and large are
  //  closed ranges in the book and the D6 reaches both of their endpoints.
  small:  { lo: 10, hi: 15, gravity: 10,
            band: 'the book’s “up to 15 cm”, walked 10–15 by this tool' },
  medium: { lo: 16, hi: 25, gravity: 15, band: 'the book’s 16–25 cm band' },
  large:  { lo: 26, hi: 50, gravity: 30, band: 'the book’s 26–50 cm band' }
};

const KIND = {
  asteroid: { name: 'Asteroid field',   tag: 'A', colour: 'ast'  },
  gas:      { name: 'Gas & dust cloud', tag: 'C', colour: 'gas'  },
  planet:   { name: 'Planet',           tag: 'P', colour: 'pln'  },
  moon:     { name: 'Moon',             tag: 'M', colour: 'moon' },
  rift:     { name: 'Warp rift',        tag: 'R', colour: 'rift' }
};

const KEEP_CLEAR = 2;        // cm between templates — see the footer note
const RING_ON = 5;           // p. 113 wins over the p. 108 footnote

/* ═════════════════════════════════════════════════════════════ GEOMETRY
   Every template is an ellipse with semi-axes rx (along the sunward edge) and
   ry (across it), rotated by `angle`. Because bands are turned 90° whenever the
   sun rolls onto a short edge, every bounds and separation test has to work on
   the ROTATED extents — testing rx against x and ry against y silently swaps
   the axes on two of the six sun rolls and lets bands sit on top of each other. */

function extents(t) {
  const c = Math.abs(Math.cos(t.angle || 0)), s = Math.abs(Math.sin(t.angle || 0));
  return { hw: t.rx * c + t.ry * s, hh: t.rx * s + t.ry * c };
}

function overlaps(list, cand) {
  const a = extents(cand);
  for (let i = 0; i < list.length; i++) {
    const t = list[i];
    if (t.noclip) continue;                       // rings may merge (p. 113)
    const b = extents(t);
    if (Math.abs(t.x - cand.x) < a.hw + b.hw + KEEP_CLEAR &&
        Math.abs(t.y - cand.y) < a.hh + b.hh + KEEP_CLEAR) return true;
  }
  return false;
}

function onTable(cand, W, H) {
  const e = extents(cand);
  return cand.x - e.hw >= 0 && cand.x + e.hw <= W &&
         cand.y - e.hh >= 0 && cand.y + e.hh <= H;
}

/* ═══════════════════════════════════════════════════════════ GENERATOR */

function generate(seed, opts) {
  const d = new Dice(seed);
  const W = opts.width, H = opts.height;
  const log = [];
  const terrain = [];
  const events = { flare: 0, radiation: 0 };
  const counters = { asteroid: 0, gas: 0, planet: 0, moon: 0, rift: 0 };
  //  opts.planets: planets the scenario already puts on the table. "In all cases a
  //  maximum of one planet will be present on the tabletop" (p. 108), so a rolled
  //  planet is re-rolled exactly as a second rolled one would be.
  let planetPlaced = (opts.planets || 0) > 0;
  const ignore = opts.ignore || [], reroll = opts.reroll || [];

  const say = function (cls, text) { log.push({ cls: cls, text: text }); };

  /* ── 1. the battlezone, once for the whole battlefield (p. 105) ───────── */
  let zone, zoneDie = null;
  if (opts.zone === 'roll') {
    zoneDie = d.d6();
    zone = ZONES[zoneDie - 1];
    say('l-head', 'Battlezone — D6 = <b>' + zoneDie + '</b> → ' + zone.name + ' (p. ' + zone.page + ')');
  } else if (opts.zone === 'none') {
    //  a scenario that lists its own phenomena names no battlezone, and no generator is rolled
    zone = null;
    say('l-head', 'Battlezone — none: ' + (opts.zoneText || 'the scenario lists its phenomena') + '.');
  } else if (typeof opts.zone === 'object') {
    //  a scenario's own battlezone roll, e.g. "D6: 1-3 outer reaches, 4-6 deep space"
    zoneDie = opts.zone.die === 3 ? d.d3() : d.d6();
    const hit = opts.zone.rows.find(function (r) { return zoneDie >= r[0] && zoneDie <= r[1]; });
    zone = ZONES[hit[2] - 1];
    say('l-head', 'Battlezone — D' + (opts.zone.die === 3 ? 3 : 6) + ' = <b>' + zoneDie + '</b> → ' + zone.name +
      ' (' + opts.zone.text + '; generator p. ' + zone.page + ')');
  } else {
    zone = ZONES[Number(opts.zone) - 1];
    say('l-head', 'Battlezone — chosen: ' + zone.name +
      ' (p. ' + zone.page + '). ' + (opts.zoneText || 'The book allows agreeing on one instead of rolling.'));
  }

  /* ── 2. the sunward edge (p. 109) ─────────────────────────────────────────
     A scenario may fix the edge (opts.sun), roll it its own way (opts.sun as
     rows), or have none at all ('none': every band gets its own direction). */
  let sunDie = null, sunEdge;
  if (opts.sun === 'none') {
    sunEdge = 'none';
    say('l-head', 'Sunward edge — none (' + (opts.sunText || 'the scenario') + '). Each band’s direction is drawn at random.');
  } else if (opts.sun && typeof opts.sun === 'object') {
    sunDie = d.d6();
    sunEdge = opts.sun.rows.find(function (r) { return sunDie >= r[0] && sunDie <= r[1]; })[2];
    say('l-head', 'Sunward edge — D6 = <b>' + sunDie + '</b> → ' + sunEdge + ' (' + opts.sun.text + ').');
  } else if (opts.sun) {
    sunEdge = opts.sun;
    say('l-head', 'Sunward edge — ' + sunEdge + ', set by ' + (opts.sunText || 'the scenario') + '.');
  } else {
    sunDie = d.d6();
    sunEdge = SUN_EDGE[sunDie];
  }
  const vertical = (sunEdge === 'left' || sunEdge === 'right');
  const bandAngle = vertical ? Math.PI / 2 : 0;
  if (!opts.sun) {
    say('l-head', 'Sunward edge — D6 = <b>' + sunDie + '</b> → ' + sunEdge +
      '. Bands run ' + (vertical ? 'vertically' : 'horizontally') + ', parallel to it.');
  } else if (sunEdge !== 'none') {
    say('l-note', 'Bands run ' + (vertical ? 'vertically' : 'horizontally') + ', parallel to the sunward edge.');
  }
  function angleFor(kind) {
    if (kind !== 'gas' && kind !== 'asteroid' && kind !== 'rift') return 0;
    return sunEdge === 'none' ? d.range(0, Math.PI) : bandAngle;
  }

  /* ── scenario features already on the table ───────────────────────────────
     opts.fixed lists what the scenario itself puts down (planets, fields, rings,
     markers) as circles, boxes or annuli. Nothing rolled may touch them, with the
     same KEEP_CLEAR as between templates. They consume no dice. */
  const fixed = opts.fixed || [];
  function onFixed(cand) {
    if (!fixed.length) return false;
    const e = extents(cand), rr = Math.max(e.hw, e.hh);
    for (let i = 0; i < fixed.length; i++) {
      const f = fixed[i];
      if (f.shape === 'box') {
        if (cand.x + e.hw + KEEP_CLEAR > f.x0 && cand.x - e.hw - KEEP_CLEAR < f.x1 &&
            cand.y + e.hh + KEEP_CLEAR > f.y0 && cand.y - e.hh - KEEP_CLEAR < f.y1) return true;
      } else {
        const dist = Math.hypot(cand.x - f.x, cand.y - f.y);
        //  the template's own bounding circle, so a band turned any way is still clear
        if (f.shape === 'annulus') {
          if (dist + rr + KEEP_CLEAR > f.r0 && dist - rr - KEEP_CLEAR < f.r1) return true;
        } else if (dist < f.r + rr + KEEP_CLEAR) return true;
      }
    }
    return false;
  }

  /* ── 3. the grid of areas (p. 105) ────────────────────────────────────────
     A scenario may skip the grid (opts.areas === false: it lists its own
     phenomena) or replace it with a number of rolls for the whole table
     (opts.rolls, e.g. "roll four D6: for each 4+, roll once on the generator"). */
  const size = opts.sector;
  const cols = Math.ceil(W / size), rows = Math.ceil(H / size);
  const areas = [];
  if ((!zone && !opts.table) || opts.areas === false) {
    // no generator rolls at all
  } else if (opts.rolls) {
    const nr = countOf(opts.rolls);
    for (let i = 0; i < nr.n; i++) {
      areas.push({ n: i + 1, x0: 0, y0: 0, w: W, h: H, partial: false, label: 'Roll ' + (i + 1) });
    }
    say('l-note', (nr.text || nr.n) + ' rolls for the whole table instead of 60 cm areas (' + (opts.rollsText || 'the scenario') + ').');
  } else {
    for (let cy = 0; cy < rows; cy++) {
      for (let cx = 0; cx < cols; cx++) {
        const x0 = cx * size, y0 = cy * size;
        const w = Math.min(size, W - x0), h = Math.min(size, H - y0);
        areas.push({ n: areas.length + 1, x0: x0, y0: y0, w: w, h: h, partial: w < size || h < size });
      }
    }
    const short = areas.filter(function (a) { return a.partial; }).length;
    say('l-note', W + ' × ' + H + ' cm divided into ' + size + ' cm areas: ' +
      cols + ' × ' + rows + ' = ' + areas.length + ' areas' +
      (short ? ', of which ' + short + ' are short of a full ' + size + ' cm and still get a full roll' : '') + '.');
  }
  if (areas.length && opts.everyArea) {
    say('l-note', 'Every area rolls on the table, with no 4+ roll first (' + (opts.everyText || 'the scenario') + ').');
  } else if (areas.length && opts.threshold !== 4) {
    say('l-note', 'Area threshold set to ' + opts.threshold +
      '+. ' + (opts.thresholdText || 'The book prints “4 or more” (p. 105).'));
  }
  if (areas.length && !opts.rolls && size !== 60) {
    say('l-note', 'Areas set to ' + size + ' cm. The book prints 60 cm squares (p. 105).');
  }
  say('l-note', 'Not from the book, and marked wherever it happens below: position inside an area ' +
    'is rolled on two D6 of sixths, templates are kept ' + KEEP_CLEAR +
    ' cm apart and fully on the table, and planet and moon diameters get a die.');

  /* ── size rolls, pp. 110–113 ──────────────────────────────────────────── */

  function rollSize(kind, size) {
    if (kind === 'asteroid') {
      //  "asteroid fields are D3x5cm wide and D3x5cm long"      p. 111
      const a = d.d3(), b = d.d3();
      return { rx: b * 5 / 2, ry: a * 5 / 2, roll: 'D3 = ' + b + ' long, ' + a + ' wide',
               dims: (b * 5) + ' × ' + (a * 5) + ' cm' };
    }
    if (kind === 'gas') {
      //  "Each band is D6x2cm wide and D6x5cm long"             p. 110
      const w = d.d6(), l = d.d6();
      return { rx: l * 5 / 2, ry: w * 2 / 2, roll: 'D6 = ' + l + ' long, ' + w + ' wide',
               dims: (l * 5) + ' × ' + (w * 2) + ' cm' };
    }
    if (kind === 'rift') {
      //  "The rift is D3x5cm wide and D3x10cm long"             p. 112
      const w = d.d3(), l = d.d3();
      return { rx: l * 10 / 2, ry: w * 5 / 2, roll: 'D3 = ' + l + ' long, ' + w + ' wide',
               dims: (l * 10) + ' × ' + (w * 5) + ' cm' };
    }
    //  planet: a D6 across the printed band                     p. 113
    const band = PLANET_BAND[size];
    const r = d.d6();
    const dia = Math.round(band.lo + (r - 1) * (band.hi - band.lo) / 5);
    return { rx: dia / 2, ry: dia / 2, dia: dia, gravity: band.gravity,
             roll: 'D6 = ' + r + ' across ' + band.band + ' — this tool’s die',
             dims: dia + ' cm across' };
  }

  /* ── placement inside one area (p. 105) ───────────────────────────────────
     "Position the phenomena anywhere within the area, but don't place them on
     top of each other." Anywhere is the last thing in the whole setup either
     player could still argue about, so it is rolled too: a D6 for the column
     of sixths and a D6 for the row. The pair that is reported is the pair that
     was actually used, not the first one tried. */

  //  pad: extra clearance a scenario asks for ("at least 10 cm from the others")
  function fits(cand, pad) {
    if (!onTable(cand, W, H)) return false;
    const t = pad ? { x: cand.x, y: cand.y, rx: cand.rx + pad, ry: cand.ry + pad, angle: cand.angle } : cand;
    return !overlaps(terrain, t) && !onFixed(t);
  }

  function place(area, cand, pad) {
    for (let attempt = 0; attempt < 14; attempt++) {
      const bx = d.d6(), by = d.d6();
      cand.x = area.x0 + (bx - 0.5) * (area.w / 6);
      cand.y = area.y0 + (by - 0.5) * (area.h / 6);
      if (fits(cand, pad)) {
        return 'placed on D6 ' + bx + ' / ' + by + ' of ' + (area.where || 'the area') +
          (attempt ? ' (' + attempt + ' earlier ' + (attempt === 1 ? 'pair' : 'pairs') +
            ' fell off the table or onto something)' : '');
      }
    }
    for (let attempt = 0; attempt < 30; attempt++) {     // fall back to free placement
      cand.x = area.x0 + d.range(0, area.w);
      cand.y = area.y0 + d.range(0, area.h);
      if (fits(cand, pad)) {
        return 'all 14 D6 pairs were blocked, so placed free within ' + (area.where || 'the area') + ' at ' +
          Math.round(cand.x) + ', ' + Math.round(cand.y) + ' cm';
      }
    }
    return null;
  }

  function addBody(area, kind, size, set, pad) {
    //  set: a size the scenario prints itself ({ l, w } in cm) instead of the book's dice
    const s = set ? { rx: set.l / 2, ry: set.w / 2, roll: set.text || 'size set by the scenario',
                      dims: set.l + ' × ' + set.w + ' cm' } : rollSize(kind, size);
    const cand = {
      kind: kind,
      size: size || null,
      rx: s.rx, ry: s.ry,
      angle: angleFor(kind),
      gravity: s.gravity || 0,
      dims: s.dims,
      dia: s.dia
    };
    const how = place(area, cand, pad);
    if (!how) {
      say('l-skip', KIND[kind].name + ' ' + s.dims + ' (' + s.roll +
        ') — no room left in ' + (area.label ? area.label.toLowerCase() : 'area ' + area.n) + '; not placed.');
      return null;
    }
    counters[kind]++;
    cand.id = KIND[kind].tag + counters[kind];
    cand.name = KIND[kind].name;
    terrain.push(cand);
    say('l-piece', '<b>' + cand.id + '</b> ' + KIND[kind].name + ' — ' + s.dims +
      ' (' + s.roll + '), ' + how + '.');
    return cand;
  }

  /* ── moons, p. 113 ────────────────────────────────────────────────────────
     "placed 2D6x10cm from the planet: roll randomly to see which direction".
     20–120 cm overshoots a small table, so the distance is kept and only the
     direction is re-rolled. A moon that cannot be put anywhere at its rolled
     distance is reported as off the table rather than quietly dragged to the
     edge with the original distance still printed beside it. */

  function addMoon(planet) {
    const away = d.d66() * 10;
    const across = d.d3() + 2;                            // 3–5 cm; the book gives only the 5 cm ceiling
    const rr = across / 2;
    let blocked = 0;
    for (let attempt = 0; attempt < 24; attempt++) {
      const dir = d.range(0, Math.PI * 2);
      blocked = attempt;
      const cand = { kind: 'moon', rx: rr, ry: rr, angle: 0, gravity: 10,
                     x: planet.x + Math.cos(dir) * away,
                     y: planet.y + Math.sin(dir) * away,
                     dims: across + ' cm across', dia: across };
      if (onTable(cand, W, H) && !overlaps(terrain, cand) && !onFixed(cand)) {
        counters.moon++;
        cand.id = 'M' + counters.moon;
        cand.name = 'Moon';
        cand.of = planet.id;
        terrain.push(cand);
        say('l-sub', '<b>' + cand.id + '</b> moon — ' + across +
          ' cm across (D3+2, this tool’s roll), 2D6×10 = ' + away +
          ' cm from the centre of ' + planet.id + ', direction drawn at random' +
          (blocked ? ' (' + blocked + ' earlier ' + (blocked === 1 ? 'direction' : 'directions') +
            ' ran off the table or into something, and were redrawn)' : '') + '.');
        return cand;
      }
    }
    say('l-skip', 'Moon — ' + across + ' cm across (D3+2), 2D6×10 = ' + away + ' cm from ' +
      planet.id + ': none of 24 drawn directions keeps it on a ' + W + ' × ' + H +
      ' cm table. Off the board.');
    return null;
  }

  /* ── rings, p. 113 ────────────────────────────────────────────────────────
     "Place D3 rings around the planet ... 1-4 = gas/dust, 5-6 = asteroid. Each
     ring is D6cm wide and begins D6x5cm away from the planet's edge." They are
     annuli standing clear of the planet, not discs laid over it, and the book
     says outright that rings may merge — so they never block other placements. */

  function addRings(planet, always) {
    if (always) {
      say('l-sub', 'Rings — the scenario gives this planet rings, so no D6 for them.');
    } else {
      const gate = d.d6();
      say('l-sub', 'Rings — D6 = ' + gate + (gate >= RING_ON ? ' → ringed' : ' → no rings') +
        ' (p. 113 rings on ' + RING_ON + '+; the p. 108 footnote says 4+).');
      if (gate < RING_ON) return;
    }
    const n = d.d3();
    say('l-sub', 'Ring count — D3 = ' + n + '. Rings are ignored when spacing every other ' +
      'template, and are not kept on the table — the book says rings may merge (p. 113).');
    planet.rings = [];
    for (let i = 0; i < n; i++) {
      const typeRoll = d.d6();
      const kind = typeRoll <= 4 ? 'gas' : 'asteroid';
      const gap = d.d6() * 5, wide = d.d6();
      const inner = planet.rx + gap, outer = inner + wide;
      planet.rings.push({ kind: kind, inner: inner, outer: outer, wide: wide, gap: gap });
      terrain.push({ kind: 'ring', of: planet.id, ringKind: kind, noclip: true,
                     x: planet.x, y: planet.y, rx: outer, ry: outer, angle: 0,
                     inner: inner, outer: outer });
      const over = planet.x - outer < 0 || planet.x + outer > W ||
                   planet.y - outer < 0 || planet.y + outer > H;
      say('l-sub', 'Ring ' + (i + 1) + ' of ' + n + ' — D6 = ' + typeRoll + ' → ' +
        (kind === 'gas' ? 'gas and dust' : 'asteroids') + ', D6 = ' + wide +
        ' cm wide, starting D6×5 = ' + gap + ' cm out from the planet’s edge' +
        (over ? '. It runs past the table edge; the map clips it' : '') + '.');
    }
  }

  /* ── how many: a number, or dice such as 'd3', 'd3+1', '2d3', 'd6+4' ───── */

  function countOf(c) {
    if (typeof c === 'number') return { n: c, text: '' };
    const m = /^(\d*)d([36])([+-]\d+)?$/.exec(String(c).replace(/\s/g, '').toLowerCase());
    if (!m) return { n: 1, text: '' };
    const k = Number(m[1] || 1), die = Number(m[2]), add = m[3] ? Number(m[3]) : 0;
    const rolls = [];
    for (let i = 0; i < k; i++) rolls.push(die === 3 ? d.d3() : d.d6());
    const sum = rolls.reduce(function (a, b) { return a + b; }, 0), n = Math.max(0, sum + add);
    const plus = add ? (add > 0 ? '+' : '−') + Math.abs(add) : '';
    const label = (k > 1 ? k : '') + 'D' + die + plus;
    if (k === 1 && !add) return { n: n, text: label + ' = ' + n };
    return { n: n, text: label + ' = ' + rolls.join('+') + plus + ' = ' +
      (sum + add < 0 ? '−' + Math.abs(sum + add) + ', so 0' : n) };
  }

  /* ── a planet's gravity well, moons and rings (p. 113) ─────────────────── */

  function planetExtras(planet, size, moons, rings) {
    say('l-sub', 'Gravity well — up to ' + planet.gravity +
      ' cm out from the template edge (p. 113); drawn at the full ' + planet.gravity + ' cm.');
    if (typeof moons === 'number') {
      say('l-sub', 'Moons — ' + moons + ', set by the scenario; each placed 2D6×10 cm out as normal.');
      for (let m = 0; m < moons; m++) addMoon(planet);
    } else if (moons !== false && (size === 'medium' || size === 'large')) {
      const r = size === 'large' ? d.d6() : d.d3();
      const raw = size === 'large' ? r - 2 : r - 1;
      const n = Math.max(0, raw);
      say('l-sub', 'Moons — ' + (size === 'large' ? 'D6−2, D6 = ' : 'D3−1, D3 = ') + r +
        ' → ' + (raw < 0 ? '−' + Math.abs(raw) + ', so no moons' :
          raw + ' ' + (n === 1 ? 'moon' : 'moons')) + '.');
      for (let m = 0; m < n; m++) addMoon(planet);
    }
    if (rings !== false && (size === 'large' || rings === 'always')) addRings(planet, rings === 'always');
  }

  /* ── the scenario's own planets (opts.hosts) ──────────────────────────────
     "Place a planet in the middle ... generate rings, moons etc. as normal".
     The position is the scenario's; the diameter walks the size band unless the
     scenario gives one, and moons and rings are rolled as for a rolled planet. */

  (opts.hosts || []).forEach(function (h) {
    if (typeof h.size === 'object') {
      //  the scenario's own size roll, e.g. "D6: 1 small, 2-5 medium, 6 large"
      const r = d.d6(), hit = h.size.rows.find(function (x) { return r >= x[0] && r <= x[1]; });
      say('l-sub', 'Planet size — D6 = ' + r + ' (' + h.size.text + ') → ' + hit[2] + '.');
      h = Object.assign({}, h, { size: hit[2] });
    }
    const s = h.dia ? { rx: h.dia / 2, ry: h.dia / 2, dia: h.dia, gravity: PLANET_BAND[h.size].gravity,
                        roll: 'set by the scenario', dims: h.dia + ' cm across' } : rollSize('planet', h.size);
    counters.planet++;
    //  a template bigger than the scenario's spot allows on a small table is moved in until it fits
    const fit = function (c, r, max) { return 2 * r >= max ? max / 2 : Math.min(Math.max(c, r), max - r); };
    const x = fit(h.x, s.rx, W), y = fit(h.y, s.ry, H);
    const moved = Math.round(Math.hypot(x - h.x, y - h.y));
    const planet = { kind: 'planet', size: h.size, rx: s.rx, ry: s.ry, angle: 0, gravity: s.gravity,
                     dims: s.dims, dia: s.dia, x: x, y: y, host: true,
                     id: 'P' + counters.planet, name: h.name || 'Planet' };
    terrain.push(planet);
    planetPlaced = true;
    say('l-piece', '<b>' + planet.id + '</b> ' + (h.name || 'The scenario’s planet') + ' — ' + h.size + ', ' +
      s.dims + ' (' + s.roll + '), at ' + Math.round(x) + ', ' + Math.round(y) + ' cm where the scenario puts it' +
      (moved ? ', moved ' + moved + ' cm in to stay on the table' : '') +
      (h.sizeText ? '; size ' + h.sizeText : '') + '.');
    planetExtras(planet, h.size, h.moons, h.rings);
  });

  /* ── 4. one D6 per area, then the generator (p. 105) ──────────────────── */

  if (opts.events) {
    ['flare', 'radiation'].forEach(function (k) {
      if (!opts.events[k]) return;
      events[k] += opts.events[k];
      say('l-event', opts.events[k] + ' × ' + (k === 'flare' ? 'solar flare' : 'radiation burst') +
        ', set by the scenario — a battlefield-wide event, not a template (p. 115).');
    });
  }

  let fromAreas = 0, cap = 0;
  if (opts.cap && areas.length) {
    const c = countOf(opts.cap);
    cap = c.n;
    say('l-note', 'At most ' + (c.text ? c.text : cap) + ' phenomena from the rolls below (' + (opts.capText || 'the scenario') + ').');
  }
  //  opts.table: the scenario's own generator ({ name, rows } in the ZONES row format),
  //  rolled instead of the battlezone's; the battlezone still decides fighting sunward
  const gen = opts.table || zone;
  for (let i = 0; i < areas.length; i++) {
    const area = areas[i], aname = area.label || 'Area ' + area.n;
    if (opts.cap && fromAreas >= cap) {
      say('l-skip', aname + ' — not rolled: the limit of ' + cap + ' is reached.');
      continue;
    }
    const gate = opts.everyArea ? null : d.d6();
    if (gate !== null && gate < opts.threshold) {
      say('l-empty', aname + ' — D6 = ' + gate + ', empty.');
      continue;
    }

    /* "In all cases a maximum of one planet will be present on the tabletop:
       if a second planet is generated roll again." (p. 108) — a re-roll on the
       generator, not a discarded area. Primary Biosphere and Outer Reaches both
       have two planet faces, so the loop needs a guard. A scenario may re-roll
       other results the same way (opts.reroll) or ignore them (opts.ignore). */
    const again = function (k) {
      return (k === 'planet' && planetPlaced && ignore.indexOf('planet') < 0) || reroll.indexOf(k) >= 0;
    };
    let face = d.d6(), row = gen.rows[face - 1];
    let rerolls = 0;
    let line = aname + ' — ' + (gate === null ? '' : 'D6 = ' + gate + ' ✔ · ') + gen.name +
      ' D6 = <b>' + face + '</b> → ' + row.text;
    while (again(row.out.kind) && rerolls < 20) {
      const why = row.out.kind === 'planet' && planetPlaced ? 'a planet is already on the table'
        : 'the scenario re-rolls this result (' + (opts.rerollText || 'reroll') + ')';
      rerolls++;
      face = d.d6();
      row = gen.rows[face - 1];
      line += '<br>&nbsp;&nbsp;' + why + ', so roll again — D6 = <b>' +
        face + '</b> → ' + row.text;
    }
    say('l-area', line);
    if (row.note) say('l-sub', row.note);

    if (again(row.out.kind)) {
      say('l-skip', 'Twenty re-rolls all came up ' + (row.out.kind === 'planet' ? 'planet' : 'the same result') +
        '; ' + aname.toLowerCase() + ' stays empty.');
      continue;
    }
    if (ignore.indexOf(row.out.kind) >= 0) {
      say('l-skip', 'Ignored: ' + (opts.ignoreText || 'the scenario ignores this result') + '. ' + aname + ' stays empty.');
      continue;
    }
    if (row.out.kind === 'none') { say('l-empty', 'Nothing here.'); continue; }
    fromAreas++;

    const out = row.out;

    /* whole-table events: counted, never placed (pp. 114–115) */
    if (out.kind === 'flare' || out.kind === 'radiation') {
      events[out.kind]++;
      say('l-event', out.kind === 'flare'
        ? 'Solar flare — a battlefield-wide event, not a template (p. 114).'
        : 'Radiation burst — a battlefield-wide event, not a template (p. 115).');
      continue;
    }
    if (out.kind === 'event6') {
      const r = d.d6();
      const which = r <= 3 ? 'radiation' : 'flare';
      events[which]++;
      say('l-event', 'Roll again — D6 = ' + r + ' → ' +
        (which === 'flare' ? 'solar flare' : 'radiation burst') +
        ' — a battlefield-wide event, not a template.');
      continue;
    }

    if (out.kind === 'planet') {
      let size = out.fixed;
      if (!size) {
        const sub = PLANET_SUB[out.sub];
        const r = d.d6();
        size = sub.of(r);
        say('l-sub', 'Planet size — D6 = ' + r + ' (' + sub.text + ') → ' + size + '.');
      } else {
        say('l-sub', 'Planet size — fixed ' + size + ' by the table, no roll.');
      }
      const planet = addBody(area, 'planet', size);
      if (!planet) continue;
      planetPlaced = true;
      planetExtras(planet, size);
      continue;
    }

    /* templates: a fixed count, D3, or D3+1 */
    const c = countOf(out.count);
    if (c.text) say('l-sub', c.text + ' ' + (c.n === 1 ? KIND[out.kind].name.toLowerCase()
                                                       : KIND[out.kind].name.toLowerCase() + 's') + '.');
    for (let k = 0; k < c.n; k++) addBody(area, out.kind);
  }

  /* ── 5. phenomena the scenario lists itself (opts.pieces) ─────────────────
     "Place D3 asteroid fields in each quarter", "a warp rift and two small
     asteroid fields at random". Each entry is a kind, a count (a number or a
     die such as 'd3+2'), an optional area and an optional printed size; sizes
     otherwise come from the book's dice (pp. 110–113), positions as above. */

  (opts.pieces || []).forEach(function (p) {
    if (p.pick) {
      //  the scenario rolls where the piece goes, e.g. "D6: 1-3 left, 4-6 right"
      const r = d.d6(), hit = p.pick.rows.find(function (x) { return r >= x[0] && r <= x[1]; });
      p = Object.assign({}, p, { area: p.pick.areas[hit[2]] });
      say('l-sub', 'Where — D6 = ' + r + ' (' + p.pick.text + ') → ' + p.area.name + '.');
    }
    const where = p.area ? p.area.name || 'its area' : 'the table';
    const area = p.area ? { n: 0, x0: p.area.x0, y0: p.area.y0, w: p.area.w, h: p.area.h, label: where, where: where }
                        : { n: 0, x0: 0, y0: 0, w: W, h: H, label: where, where: where };
    const c = countOf(p.count === undefined ? 1 : p.count);
    const one = p.kind === 'planet' ? (p.size || 'small') + ' planet' : KIND[p.kind].name.toLowerCase();
    const what = p.what || (c.n === 1 ? one : one + 's');
    say('l-area', 'The scenario: ' + (c.text ? c.text + ' → ' : '') + c.n + ' × ' + what +
      (p.area ? ' in ' + where : '') + (p.text ? ' (' + p.text + ')' : '') + '.');
    for (let k = 0; k < c.n; k++) {
      if (p.kind === 'moon') {
        //  a free-standing moon: a small round body, 3–5 cm across as for a planet's moon
        const across = d.d3() + 2;
        const cand = { kind: 'moon', rx: across / 2, ry: across / 2, angle: 0, gravity: 10,
                       dims: across + ' cm across', dia: across };
        const how = place(area, cand);
        if (!how) { say('l-skip', 'Moon — no room left in ' + area.label + '; not placed.'); continue; }
        counters.moon++;
        cand.id = 'M' + counters.moon; cand.name = 'Moon';
        terrain.push(cand);
        say('l-piece', '<b>' + cand.id + '</b> moon — ' + across + ' cm across (D3+2, this tool’s roll), ' + how + '.');
        continue;
      }
      const body = addBody(area, p.kind, p.kind === 'planet' ? (p.size || 'small') : null, p.set,
                           p.apart ? Math.max(0, p.apart - KEEP_CLEAR) : 0);
      if (body && p.kind === 'planet') {
        planetPlaced = true;
        planetExtras(body, body.size, p.moons === undefined ? false : p.moons, p.rings === undefined ? false : p.rings);
      }
    }
  });

  /* ── tally ────────────────────────────────────────────────────────────── */
  const placed = terrain.filter(function (t) { return t.kind !== 'ring'; }).length;
  say('l-total', placed + ' template' + (placed === 1 ? '' : 's') + ' on the table' +
    (events.flare || events.radiation
      ? ', plus ' + [events.flare ? events.flare + ' solar flare' + (events.flare === 1 ? '' : 's') : '',
                     events.radiation ? events.radiation + ' radiation burst' + (events.radiation === 1 ? '' : 's') : '']
                     .filter(Boolean).join(' and ') + ' in play'
      : '') + '.');

  return {
    terrain: terrain,
    log: log,
    meta: {
      seed: seed, W: W, H: H, sector: size, threshold: opts.threshold,
      zone: zone, zoneDie: zoneDie, sunDie: sunDie, sunEdge: sunEdge,
      areas: areas, cols: cols, rows: rows,
      events: events, counters: counters, placed: placed
    }
  };
}

/* ═══════════════════════════════════════════════════════════ WHAT IT DOES
   In-play rules for each phenomenon, pp. 109–116, summarised close to the
   book's wording with the page on every group. A gas cloud is defined by
   reference to the Blast Marker rules, so those are pulled in from pp. 48
   and 68–69 rather than assumed known. */

const RULES = {

  asteroid: {
    title: 'Asteroid field', page: 'pp. 110–111',
    lede: 'A wall of rock that hides a fleet and punishes anyone who flies into it. ' +
          'Escorts navigate it far better than capital ships do.',
    groups: [
      { head: 'Flying into it', cite: 'p. 110', items: [
        'A ship moving through the field, or coming into base contact with its edge, must pass a <b>Leadership test on 2D6</b>.',
        'On <b>All Ahead Full</b> the test is made on <b>3D6</b> instead.',
        'An <b>escort</b> may re-roll a failed test, but the second roll stands whether it succeeds or not.',
        'A ship that fails suffers <b>D6 damage</b>. Shields block it as normal — <b>holofields do not</b>.',
        'A <b>squadron</b> tests once for the whole squadron. If a capital ship squadron fails, every ship in base contact with the field takes D6 damage. An escort squadron re-rolls free, and if it still fails the D6 damage is distributed among the escorts that actually contacted the field, in the order they were moved.',
        'Shields taken down by asteroids place <b>no Blast Markers</b>, but the ship is still slowed <b>5 cm</b> that turn as though it had moved through them.'
      ] },
      { head: 'Shooting', cite: 'pp. 110–111', items: [
        'The field <b>blocks line of fire</b>. Ships cannot shoot into or out of it.',
        'Two ships <b>both inside</b> a field may shoot at each other. Then lances and weapons batteries reach no more than <b>10 cm</b>, nova cannon do not work, and torpedoes of any type cannot be used.',
        'Inside a field, a target within 10 cm gives <b>no left column shift</b>.',
        'A <b>braced or crippled</b> ship may not shoot inside a field.',
        'To shoot <b>at</b> the field you must first pass a Leadership test, even if it is the only possible target — treat it as an ordnance marker. Every roll of a <b>6</b> places a Blast Marker touching the field, facing where the shooting came from.',
        'In each End Phase every asteroid field loses <b>D6 Blast Markers</b>, and these do not count against the Blast Markers otherwise removable that turn.'
      ] },
      { head: 'Ordnance and wrecks', cite: 'p. 110', items: [
        'Torpedoes that strike the field are <b>detonated</b>.',
        'Attack craft moving through are destroyed on a D6 roll of <b>6</b>. Attack craft that stay inside roll again every Ordnance Phase, and every wave or marker is removed on a <b>6</b>.',
        'Hulks that drift into an asteroid field are <b>destroyed</b>.'
      ] }
    ]
  },

  gas: {
    title: 'Gas & dust cloud', page: 'p. 110',
    lede: 'The book treats gas and dust clouds as one feature and gives it one rule: it is a ' +
          'Blast Marker that never moves. Cheap to fly through, ruinous to shoot across.',
    groups: [
      { head: 'The whole rule', cite: 'p. 110', items: [
        'A gas or dust cloud has <b>the same effect as a single Blast Marker in all respects</b> — firing, movement, shields, Leadership and ordnance.'
      ] },
      { head: 'Which means, in play', cite: 'pp. 48, 68–69', items: [
        'Moving through it <b>costs 5 cm of speed</b> that phase, whatever else you touch.',
        'A ship in contact has its <b>shield Strength reduced by 1</b> when it is fired upon.',
        'A line of fire that crosses it, or either ship being in contact with it, costs <b>one column shift right</b> on the Gunnery table.',
        'A ship in contact is <b>under fire: −1 Leadership</b> on Command checks.',
        'An ordnance marker that moves over it is removed on a D6 roll of <b>6</b>.',
        'A ship with <b>0 shield Strength</b> that moves through takes a point of damage on a roll of <b>6</b>.'
      ] },
      { head: 'Exceptions', cite: 'p. 110', items: [
        '<b>Eldar and their kin</b> may make a Leadership check to ignore every effect of a cloud, their escorts re-rolling free. A ship that passes takes no damage and suffers nothing from the contact.',
        'If a ship with <b>0 shields</b> explodes from cloud contact, the explosion happens at the point where it entered the cloud.'
      ] }
    ]
  },

  rift: {
    title: 'Warp rift', page: 'pp. 111–112',
    lede: 'A tear in realspace. Cross it and you are either somewhere far more useful, ' +
          'or out of the battle entirely.',
    groups: [
      { head: 'Flying into it', cite: 'p. 111', items: [
        'A ship moving into a rift must pass a <b>Leadership test on 3D6</b>.',
        '<b>Pass:</b> the ship may be repositioned up to <b>2D6 × 10 cm</b> away from the rift, pointing in any direction.',
        '<b>Fail:</b> the ship disappears from the battle altogether — lost in the warp.',
        'After the game, roll a D6 for each ship lost in the warp: on a <b>1</b> it is lost forever, on a <b>2–6</b> it eventually finds its way back to the fleet.'
      ] },
      { head: 'Everything else', cite: 'p. 111', items: [
        'A rift <b>blocks line of fire</b>.',
        'Torpedoes that strike it are <b>detonated</b>, and attack craft that move into it are <b>destroyed</b>.',
        'Hulks that drift into a rift <b>disappear</b> and may not be salvaged after the battle.'
      ] },
      { head: 'Exceptions', cite: 'FAQ 2026', items: [
        '<b>Eldar</b> make the test on <b>2D6</b> instead of 3D6. The rift still blocks their line of fire.'
      ] }
    ]
  },

  planet: {
    title: 'Planet', page: 'pp. 112–113',
    lede: 'The template is mostly an obstacle for ordnance. The gravity well around it is the ' +
          'real feature — a free turn at both ends of every move.',
    groups: [
      { head: 'The gravity well', cite: 'p. 113', items: [
        'Measured <b>from the template edge</b>: small up to <b>10 cm</b>, medium up to <b>15 cm</b>, large up to <b>30 cm</b>.',
        'A ship inside it may make a free turn of <b>up to 45°</b> at the <b>beginning and again at the end</b> of its move, always <b>toward the planet</b>.',
        'The ship does <b>not</b> have to move its minimum distance before taking the free turn.',
        'It works even when the ship could not normally turn — under <b>All Ahead Full</b> or <b>Lock On</b> — and combines with <b>Come To New Heading</b>.',
        'The turn is toward the centre of the gravity well (or a space hulk’s stem), or 45°, <b>whichever is less</b>.'
      ] },
      { head: 'The template', cite: 'p. 112', items: [
        'Ships may move <b>through</b> a planet, passing over or under it.',
        'A ship whose <b>stem is on the template</b> is not blocked by it, and neither is anyone’s line of sight to that ship. Several ships on one template can all see each other.',
        'A ship counts as on the template only if its <b>stem</b> touches it — base contact or an overlapping base is not enough.',
        'Torpedoes are <b>destroyed</b> on contact with the template edge, including ones launched from a ship sitting on the template.',
        'Hulks that drift into a planet are <b>destroyed</b>.'
      ] },
      { head: 'Orbit', cite: 'pp. 113, 116', items: [
        '<b>High orbit:</b> a ship in a gravity well may elect to enter it. It does not have to move, but a stationary ship is shot at using the <b>Defences column</b>.',
        '<b>Low orbit</b> removes the ship to a separate table and is a scenario system of its own (p. 116): firepower there takes a right column shift, lances and nova cannon need a <b>4+</b> to fire, and torpedoes may not be fired at all.'
      ] }
    ]
  },

  moon: {
    title: 'Moon', page: 'p. 113',
    lede: 'Not scenery. A moon is a small planet with everything that implies.',
    groups: [
      { head: 'The whole rule', cite: 'p. 113', items: [
        'Moons <b>count as small planets in all respects</b>, including how their gravity wells affect turning ships.',
        'So: a gravity well up to <b>10 cm</b> from the template edge, the free 45° turn toward it at the start and end of a move, torpedoes destroyed on the template edge, and drifting hulks destroyed.'
      ] }
    ]
  },

  ring: {
    title: 'Planetary ring', page: 'p. 113',
    lede: 'A ring is not a terrain type of its own. It is a band of gas and dust, or of asteroids, ' +
          'laid around the planet, and it uses that type’s rules unchanged.',
    groups: [
      { head: 'What it is made of', cite: 'p. 113', items: [
        'D3 rings, each rolled on a D6: <b>1–4</b> gas and dust, <b>5–6</b> asteroids. Read that type’s rules for what the band does.',
        'Each ring is <b>D6 cm wide</b> and begins <b>D6 × 5 cm</b> out from the planet’s edge.',
        'The book notes that rings may end up merging into one another, and says that is fine.'
      ] }
    ]
  },

  sunward: {
    title: 'The sunward edge', page: 'pp. 109 & 114',
    lede: 'Which table edge the nearest star lies beyond. It sets how band-shaped terrain is laid ' +
          'out, and in the three inner battlezones it changes your gunnery.',
    groups: [
      { head: 'Laying out terrain', cite: 'p. 109', items: [
        'Gas and dust clouds and asteroid fields are placed so that they <b>run parallel to the sunward edge</b>.',
        'The edge is rolled on a D6: <b>1</b> left, <b>2–3</b> top, <b>4–5</b> bottom, <b>6</b> right — so a long edge is twice as likely as a short one.'
      ] },
      { head: 'Fighting sunward', cite: 'p. 114', items: [
        'Applies <b>only in the Flare Region, Mercurial Zone and Inner Biosphere</b>. In the Primary Biosphere, Outer Reaches and Deep Space the distant star has no effect on combat.',
        'Any firing toward the sunward edge <b>doubles the range column shifts</b>.',
        'At <b>15 cm or under</b> the target is silhouetted against the star: <b>two</b> shifts left instead of one.',
        'At <b>over 30 cm</b> the photosphere blinds long range sensors: <b>two</b> shifts right instead of one.',
        'To judge it, place the bearing compass over the firing ship with the arrows parallel to the sunward edge; if the target is in the arc facing that edge, you are shooting sunward.',
        'The book states all of this as Gunnery table column shifts and <b>never mentions lances</b>. Whether a lance is affected follows from the Gunnery table, not from a sentence on p. 114.'
      ] }
    ]
  }
};

const EVENT_RULES = {
  flare: {
    name: 'Solar flare', page: 'p. 115', trigger: 6, triggerText: 'a 6', once: true,
    how: 'Roll a D6 for each flare generated, at the start of every turn. On any 6 a flare occurs — ' +
         'and a flare manifests only once per game, so after it fires you stop rolling.',
    effects: [
      'One <b>Blast Marker</b> is placed sunward of every ship on the table.',
      'Any ship <b>without shields</b> suffers <b>one hit</b>, and takes <b>critical damage on a 4 or more</b>.',
      'Roll a D6 for <b>each ordnance marker</b> — on a <b>4 or more</b> it is removed from play.',
      '<b>Eldar and their kin</b> may pass a Leadership check to ignore all of it, escorts re-rolling free. A ship that passes takes no damage and instead turns directly away from the flare and moves <b>2D6 cm</b>.'
    ]
  },
  radiation: {
    name: 'Radiation burst', page: 'p. 115', trigger: 5, triggerText: 'a 5 or 6', once: false,
    how: 'Roll a D6 for each burst generated, at the start of every turn. Each 5 or 6 triggers one, ' +
         'but only one burst happens per turn however many succeed. Unlike a flare, it can return every turn.',
    effects: [
      'Every ship on the table <b>reduces its Leadership by the interference level for the rest of the turn</b>.',
      'While the burst lasts, a <b>Fleet Commander</b> may only use re-rolls on Command checks for his own ship or squadron.'
    ]
  }
};

