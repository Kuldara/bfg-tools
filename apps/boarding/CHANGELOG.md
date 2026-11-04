# Changelog: Boarding Actions

Releases are tags `boarding-v<yyyy.mm.dd>`.

## Unreleased

### Changed
- Berzerker Tide (4.11.2026, RULINGS.md 7): each Mark of Khorne ship of the boarding has its own D3 and its own "no special orders next turn", and the D3 is the player's own (1, 2, 3), with the app's Roll beside it when the app rolls. It was one D3 for the whole side, always rolled by the app.

### Added
- Boarding value by hand: the boarding value's sheet has its own "Anything else" beside the roll's, for campaign rewards and house rules.
- Opens inside Gothic Fleet Play (`boarding.html#play=...`), with the battle from the fleet and the result sent back.

### Fixed
- Mega-armoured boarding parties are not offered to escorts (Fleets p. 372).

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
