# Changelog: Battlezone Generator

Releases are tags `terrain-v<yyyy.mm.dd>`.

## Unreleased

### Changed (for developers)
- The rolling core is `packages/battlezone/core.js`, included into the page at
  build time and shared with the Scenario Library (it used to be copied between
  marker comments). The generator's own maps are unchanged (7 560 fingerprints).

## 2026-10-21

The core was extended with the options the Scenario Library's maps need; without
them not one extra die is rolled.

## 2026-09-25

First release: Rulebook v1.10 pp. 104-116, seeded rolls, the table drawn, the
rules of every piece.
