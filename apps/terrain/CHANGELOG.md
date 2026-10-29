# Changelog: Battlezone Generator

Releases are tags `terrain-v<yyyy.mm.dd>`.

## Unreleased

### Added
- Link preview (29.10.2026): a link to the app in Discord and elsewhere shows its own image (the app itself, the numbers from the data) and text. `npm test` fails when the image is out of date (`npm run og`).

### Changed
- Rulebook v1.11 (29.10.2026): the same pages as v1.10; the Fleets citations are v0.40 pages.

### Changed (for developers)
- The page's script is ES modules in `src/` (chart, rules, events, controls),
  bundled with the core into the page by the build (`window.BZG`); the styles
  are `styles/terrain.css`. Every table, chart and panel renders as before
  (340 digests through the controls, before and after).
- The rolling core is `packages/battlezone/core.js`, included into the page at
  build time and shared with the Scenario Library (it used to be copied between
  marker comments). The generator's own maps are unchanged (7 560 fingerprints).

## 2026-10-21

The core was extended with the options the Scenario Library's maps need; without
them not one extra die is rolled.

## 2026-09-25

First release: Rulebook v1.10 pp. 104-116, seeded rolls, the table drawn, the
rules of every piece.
