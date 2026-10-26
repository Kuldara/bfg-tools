# Scenario Library

Every Battlefleet Gothic scenario we could find, in a form you play rather than
read: set-up steps you tick off, a map drawn to the table you use, forces by
role, a turn track with what happens when, dice tables one tap away, and the
end conditions with a verdict. 216 scenarios: the Rulebook's ten and its
campaigns, the Fleets Book, the classic Games Workshop and Fanatic publications
(BFG Magazine, Warp Storm, Invasion, Fanatic Magazine and Online), every scenario
of the Warp Rift fan magazine, and fan supplements (tournament packs, Book of
Nemesis, Project Distant Darkness, Starblade, Book of the Void).
Live at [scenario-library.kuldare.com](https://scenario-library.kuldare.com/).

## The front page

Categories (Core 10, Books, Classic GW, Warp Rift, Fan supplements, All), a
search, filters and your own record. **Cards** shows each scenario as a card
with a thumbnail of its deployment map; **Names** shows a dense list with the
whole picture of one scenario beside it, or under its name on a narrow screen.

## What a scenario page has

- **Set-up:** summary and what you need; forces by role ("suggested: Imperial
  Navy" or "any fleet"); the map as SVG in centimetres for the chosen table;
  a checklist of steps; set-up tools (the Convoy attacker table, a planet's size,
  rolled terrain); source notes with page numbers.
- **Play:** a turn counter with reminders per phase and side, dice tables, counters.
- **Result:** end and victory conditions, a verdict from what you marked, the
  sub-plot matrix.
- **Before the battle** (Rulebook pp. 120-127): the pre-game order, a random
  scenario, attack ratings, sub-plots.

Every interpretation and contradiction is in the scenario's "Source notes"
(unprinted maps, a wrong map, a broken rule): nothing is chosen silently. Real
people (authors, players) are referred to neutrally. Scenarios are summarised in
our own words and link to the original where it is published.

## Code

The app is ES modules in `src/`, bundled by the build into `app.js`
(`window.SL`); the scenario files stay plain scripts.

```
index.html              the page: markup, the stylesheet include, the script tags
styles/scenarios.css    the styles
src/index.js            the modules in page order; the page names the scenario
                        files may call bare (addScenarios, the map builders ...)
src/data.js             the Rulebook's scenarios and campaigns, the tables they share
src/views.js, front-page.js, scenario-page.js, prep.js, subplots.js   the views
src/maps.js, map-svg.js, dimensions.js, battlezone.js, terrain-legend.js   the maps
src/state.js, bookkeeping.js, widgets.js, events.js ...   the rest, one concern each
scenarios/*.js          one file per publication; each calls addScenarios([...])
scenarios/_wr.js        shared helpers for Warp Rift (dates, credits)
scenarios/terrain-map.js   TERRAIN: every scenario's terrain (battlezone and reason,
                        its own planets and pieces)
scenarios/sizes.js      SIZE: every scenario's size class (S / M / L / any)
scenarios/wr-rating.js, open-points.js   our notes, the open points as fill-in fields, tags
favicon.png, apple-touch-icon.png   (make_icons.py draws them)
build.js                npm run build -> dist/scenarios/
tests/                  see below
```

The terrain core is `packages/battlezone/core.js`; the build writes it next to
the page as `battlezone-core.js` (global `BZ`), and the QR code comes from
`packages/ui/qr.js`. The page loads each script with a content hash (`?v=…`)
the build adds, so browsers never run an old copy.

State is kept in `localStorage["bfg-scenario-library-v1"]`: each scenario's
progress, Before the battle, the category and the filter.

## Tests

| File | Runs in | Checks |
|---|---|---|
| `tests/bookkeeping.js` | Node | played / in progress marks, bookmarks, unique ids, the share link, junk input |
| `tests/sizes.js` | Node | every scenario classified, classes valid, point texts consistent, filter counts |
| `tests/terrain.js` | Node | the generator's fingerprints; every scenario × version × 5 tables × 12 seeds: on the table, no overlaps, battlezone as tabled |
| `tests/measurements.js` | Node | every map's fixed features measured from the table edges, and every measurement label matches the drawn length |
| `tests/front.js` | Node | the front page: a map thumbnail on every card, the names view and its picture, every scenario's preview |
| `tests/page_audit.py` | Python, needs `books/text/` | every `[title, "RB p. N"]` reference against the rulebook text |
| `tests/browser.js`, `maps.js`, `content.js` | the page, through `tests/in_page.js` (Node + headless Chrome, in `npm test`) | every scenario × version × table × turn × tab renders without `undefined` / `NaN`; map labels fit; side colours and verbs |
| `tests/screenshots.js`, `wide_screens.js` | Node + headless Chrome | a screenshot of every page at phone and desktop width, layout checks |

`_load.js` loads the library into Node without a browser: it bundles `src/`
the way the build does and runs the scenario files after it.

## Open findings

None: the three Book of the Void references `page_audit.py` once left
unverified were checked against the books on 26.10.2026 (two corrected).

## History

The development notes (releases 0.1-0.17, design principles, interpretations per
release) are in Finnish in `docs/history/scenarios/`. Changes from here on are in
`CHANGELOG.md`.
