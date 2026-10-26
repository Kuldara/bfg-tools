# Battlezone Generator

Rolls the celestial phenomena of Battlefleet Gothic: Remastered (Rulebook v1.10,
pp. 104-116) from a seed and draws them on the table, with the rules of every
piece. Live at [terrain-generator.kuldare.com](https://terrain-generator.kuldare.com/).

## Code

```
index.html        the whole app: styles, page and script, plain JavaScript
favicon.png, apple-touch-icon.png
build.js          npm run build -> dist/terrain/
```

The rolling core (dice, battlezone tables, geometry, `generate()` and the rules
texts) is **not** in this folder: it is `packages/battlezone/core.js`, and the
page includes it with an `@@include` line inside its script. The Scenario Library
uses the same core for its scenarios' maps, so the rules cannot drift into two
versions. The core never touches the page.

## `generate(seed, opts)`

The generator's own page passes only `zone`, `width`, `height`, `sector` and
`threshold`, and its rolls never change. The other options are used by the
Scenario Library; without them not one extra die is rolled.

| Option | Does |
|---|---|
| `zone: 'none'` / `{ die, rows: [[lo, hi, n]], text }` | no battlezone (the scenario lists the pieces) / the scenario's own battlezone roll |
| `zoneText`, `sunText` | the log's explanation of a chosen or fixed value |
| `sun: 'left'`… / `'none'` / `{ rows, text }` | a fixed sunward edge / none (the band direction is rolled) / an own roll |
| `fixed: [{ shape: 'circle' \| 'box' \| 'annulus', … }]` | the scenario's own features; nothing is placed on them (`KEEP_CLEAR` 2 cm) |
| `planets` | planets already on the table: a rolled planet is re-rolled (one planet, p. 108) |
| `hosts: [{ x, y, size, moons, rings, name, dia }]` | a scenario planet "with rings and moons as normal": diameter from its band, moons and rings as for a rolled one |
| `pieces: [{ kind, count, area, set, apart, pick, moons, rings }]` | pieces the scenario lists: a count or a die (`'d3+2'`, `'2d3'`), an area, a printed size, a minimum gap |
| `areas: false`, `rolls`, `everyArea`, `table`, `cap` | no 60 cm areas / N rolls for the whole table / no 4+ gate / the scenario's own table / at most N phenomena |
| `ignore`, `reroll` (+ `…Text`) | a result is ignored (the area stays empty) / re-rolled like a second planet |
| `events: { flare, radiation }` | the scenario's set solar flares and radiation bursts |

Every branch writes to the log what happened and why: a rolled die shows, and a
rejected roll is reported.

## Rulings

- **Rings:** p. 108 and p. 113 disagree on when a planet has rings; the generator
  uses `RING_ON = 5` (recorded in the core).
- Four faults of the simulator's older `terrain.js` were fixed when this was
  written (September 2026).

## Tests

`apps/scenarios/tests/terrain.js` checks the generator's own maps against
fingerprints taken before the core was extended (7 560 seeds × settings, SHA-1
per group), and every scenario's map.

## Deliberately left out

Editing pieces by hand, a print sheet, PNG export and permalinks (the owner's
decision, September 2026).

## Open finding

The page loads its fonts from Google Fonts, unlike the other tools, which embed
theirs. Embedding them needs Saira Condensed added to `packages/ui/fonts.css`
(`packages/ui/make_fonts.py`).
