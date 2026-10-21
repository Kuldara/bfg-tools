# BFG Tools

Free fan-made browser tools for **Battlefleet Gothic**, built on the BFG: Remastered
rules (Rulebook v1.10, Fleets Book WiP v0.36 and the Collected FAQ 2026). Every tool
is a static page: no accounts, no server code, nothing fetched from anywhere else.

| Tool | What it does | Live | Mirror | Source |
|---|---|---|---|---|
| Gothic Fleet Registry | Fleet builder with legality checks and printable ship cards | [bfgtools.kuldare.com](https://bfgtools.kuldare.com/) | [mirror](https://kuldara.github.io/bfg-tools/registry/) | [source/gothic-fleet-registry](source/gothic-fleet-registry) |
| Boarding Actions | Resolves a boarding action by the book, one tap at a time | [bfgtools.boarding.kuldare.com](https://bfgtools.boarding.kuldare.com/) | [mirror](https://kuldara.github.io/bfg-tools/boarding/) | [source/boarding](source/boarding) |
| Battlezone Generator | Rolls the celestial phenomena and plots the table | [terrain-generator.kuldare.com](https://terrain-generator.kuldare.com/) | [mirror](https://kuldara.github.io/bfg-tools/terrain/) | [source/battlezone-generator](source/battlezone-generator) |
| Scenario Library | Rulebook and Warp Rift scenarios, set up and tracked at the table | [scenario-library.kuldare.com](https://scenario-library.kuldare.com/) | [mirror](https://kuldara.github.io/bfg-tools/scenarios/) | [source/scenario-library](source/scenario-library) |
| Meta Almanac | What gets played and what wins, every record with its source | [bfgtools.meta.kuldare.com](https://bfgtools.meta.kuldare.com/) | [mirror](https://kuldara.github.io/bfg-tools/almanac/) | published site only, see below |

## Why this repository exists

This is a personal project, published for openness. The top-level folders
(`registry/`, `boarding/`, `terrain/`, `scenarios/`, `almanac/`) are copies of what is
live at kuldare.com, updated with every release, and GitHub Pages serves them as a
mirror. If kuldare.com ever goes away, the tools keep working at the mirror
addresses, and anyone may fork this repository and host them under the licence below.

It is not a community project, so pull requests are not merged and issues are off.

## Licence

- **Code and my own text:** MIT, see [LICENSE](LICENSE).
- **Battlefleet Gothic content** (rules text, ship profiles, points, fleet lists and
  scenarios) belongs to its owners: Games Workshop, the BFG: Remastered authors (the
  High Admiralty), and the authors of Warp Rift and the other publications each tool
  cites. It is included for non-commercial fan use and is **not** covered by the MIT
  licence.

This project is unofficial and not endorsed by Games Workshop. Battlefleet Gothic is a
trademark of Games Workshop Ltd.

## Building from source

The notes inside `source/` are in Finnish (`LUEMINUT.md` = README). In short:

- **Gothic Fleet Registry:** `python build.py`, then `node test_golden.js` and
  `python -u acceptance.py`; the site is made by `python julkaisu/make_site.py`. The data
  is extracted from the BFG: Remastered PDFs, which are not included here.
- **Boarding Actions:** `node test_engine.js`, then `python build.py` (writes `web/index.html`).
- **Battlezone Generator** and **Scenario Library:** no build step; `index.html` is the page.
- **Meta Almanac:** the source data comes from tournament reports and community posts
  and contains player names, so only the published site is here.

Each source folder is the state of that tool at its latest release. Copies of
third-party documents (FAQ exports, BattleScribe data) are left out.
