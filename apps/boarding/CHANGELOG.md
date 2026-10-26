# Changelog: Boarding Actions

Releases are tags `boarding-v<yyyy.mm.dd>`.

## Unreleased

### Changed (for developers)
- The interface is one ES module (`src/app.js`) that imports the engine and its
  JSON data; `build.js` replaces `build.py` and keeps its icon checks.
- `build_ships.py` reads the ship data from `data/bfg_data.json` in the repository
  instead of an absolute path on one machine.
- The share package's readme is in English (`README.md`, rulings in `RULINGS.md`).

## 2026-10-21

FAQ 2026 applied (criticals from boarding: ruling 15); 22 rulings documented;
235 hulls, crewed by the fleet that fields them.
