# Changelog: Scenario Library

Releases are tags `scenarios-v<version>`; the version is in `app.json`.

## Unreleased

### Changed
- Fleets WiP v0.40 and Rulebook v1.11 (29.10.2026): "FL p." citations are v0.40 pages. The link to the Fleets PDF on specialist-arms.com still opens v0.36, the version hosted there, at the page with the same text.

### Removed (for developers)
- The discovery lab (`lab/`, prototypes B-G, built only with `BFG_LAB=1`) and its
  test left the repository on 26.10.2026; the owner keeps a copy outside it.

### Added
- Every card on the front page carries a thumbnail of its deployment map,
  drawn on your table without labels, so the shape of the fight shows before
  the name does.
- A Names view beside Cards in the count row: a dense list of names with the
  whole picture of one beside it (the map, the pitch, the at-a-glance table, the
  mark and star, and the way in), or under the name on a narrow screen. The view
  and the chosen name are remembered.

### Fixed
- Book of the Void, *Solar Collectors*: the references now point to the
  right Rulebook pages, Flare region p. 107 (was 106) and Miserable defeat
  p. 124 (was 122).

### Changed (for developers)
- The page's one script is ES modules in `src/` (one concern each: views,
  maps, battlezone, bookkeeping ...), bundled into `app.js` with the exports on
  `window.SL`; the styles are `styles/scenarios.css`. The QR code comes from
  `packages/ui/qr.js` instead of a copy. The scenario files are unchanged: the
  page names they call bare are listed once in `src/index.js`. Every scenario's
  four tabs render byte for byte as before.
- The in-page tests (`tests/browser.js`, `content.js`, `maps.js`) run in a
  headless Chrome from `npm test` (`tests/in_page.js`), not by hand.
- `tests/page_audit.py` exits 1 when a reference is unchecked or has no page;
  before, it always passed, and three unchecked references went unnoticed.
- The version lives in `app.json`; the build gives every script a content hash
  instead of the hand-bumped `?v=0.17.1`.
- `battlezone-core.js` is made by the build from `packages/battlezone/core.js`.
- Tests renamed to English under `tests/`.
- The search draws the list once per frame however fast you type, now that
  the cards carry maps.
- `tests/front.js` checks the map thumbnails, the names view and every
  scenario's preview.

## 0.17.1 — 2026-10-25

216 scenarios with Book of the Void; your own marks (unplayed / in progress /
played) and bookmarks, moved between devices by QR code.

## Earlier

0.1 (20 Oct 2026) to 0.17: the Rulebook's ten, campaigns, every Warp Rift
scenario, the classic GW and Fanatic publications, fan supplements, rolled
terrain on every map, measured maps, size classes, fleet-specific scenario rules.
Details per release, in Finnish: `docs/history/scenarios/LUEMINUT.md`.
