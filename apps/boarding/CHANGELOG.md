# Changelog: Boarding Actions

Releases are tags `boarding-v<yyyy.mm.dd>`.

## Unreleased

### Added
- Link preview (29.10.2026): a link to the app in Discord and elsewhere shows its own image (the app itself, the numbers from the data) and text. `npm test` fails when the image is out of date (`npm run og`).

### Changed
- Fleets WiP v0.40 and Rulebook v1.11 (29.10.2026): the ships and citations follow v0.40 (pages; the Grey Knights and Mechanicus lists).

### Changed (for developers)
- The interface is ES modules in `src/` (`index.js` and ten modules by task:
  the sides, the action bar, the sheets, rolling, the result sheet ...) that
  import the engine and its JSON data; the page calls `BoardingApp.boot()`.
  `build.js` replaces `build.py` and keeps its icon checks.
- `test_page.js` walks the built page in headless Chrome (in `npm test`); the
  page had no test of its own before.
- `build_ships.py` reads the ship data from `data/bfg_data.json` in the repository
  instead of an absolute path on one machine.
- The share package's readme is in English (`README.md`, rulings in `RULINGS.md`).

## 2026-10-21

FAQ 2026 applied (criticals from boarding: ruling 15); 22 rulings documented;
235 hulls, crewed by the fleet that fields them.
