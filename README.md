# BFG Tools

[![CI](https://github.com/Kuldara/bfg-tools/actions/workflows/ci.yml/badge.svg)](https://github.com/Kuldara/bfg-tools/actions/workflows/ci.yml)

Free fan-made browser tools for **Battlefleet Gothic**, built on the BFG: Remastered
rules (Rulebook v1.10, Fleets Book WiP v0.36 and the Collected FAQ 2026). Every tool
is a static page: no accounts, no server code, nothing fetched from anywhere else.

| Tool | What it does | Live | Mirror | Source |
|---|---|---|---|---|
| Gothic Fleet Registry | Fleet builder with legality checks and printable ship cards; Play keeps the fleet on a phone during the game | [bfgtools.kuldare.com](https://bfgtools.kuldare.com/) | [mirror](https://kuldara.github.io/bfg-tools/registry/) | [apps/registry](apps/registry), [apps/play](apps/play) |
| Boarding Actions | Resolves a boarding action by the book, one tap at a time | [bfgtools.boarding.kuldare.com](https://bfgtools.boarding.kuldare.com/) | [mirror](https://kuldara.github.io/bfg-tools/boarding/) | [apps/boarding](apps/boarding) |
| Battlezone Generator | Rolls the celestial phenomena and plots the table | [terrain-generator.kuldare.com](https://terrain-generator.kuldare.com/) | [mirror](https://kuldara.github.io/bfg-tools/terrain/) | [apps/terrain](apps/terrain) |
| Scenario Library | Scenarios from the rulebook, the classic GW and Fanatic publications, Warp Rift and fan supplements, set up and tracked at the table | [scenario-library.kuldare.com](https://scenario-library.kuldare.com/) | [mirror](https://kuldara.github.io/bfg-tools/scenarios/) | [apps/scenarios](apps/scenarios) |
| Meta Almanac | What gets played and what wins, every record with its source | [bfgtools.meta.kuldare.com](https://bfgtools.meta.kuldare.com/) | [mirror](https://kuldara.github.io/bfg-tools/almanac/) | published site only |

The ship data the Registry is built on is published as JSON for other projects:
[`data/README.md`](data/README.md).

## Quick start

You need Node 22.12 or newer (24 recommended) and Python 3.12.

```bash
git clone https://github.com/Kuldara/bfg-tools.git
cd bfg-tools
npm install            # esbuild, the only dependency
npm run build          # every tool into dist/, about a second
npm run serve          # http://localhost:8800/registry/ and the rest
npm test               # the whole test suite, about ten minutes
```

`npm run serve -- --watch` rebuilds when you change a file. `npm run test:quick`
skips the slow runs.

The rulebook PDFs are not in the repository. You need them only to re-extract
the data or to run the checks that compare it with the books
(`npm run check:books`); see `extractor/books.py`.

## Where to start reading

- [ARCHITECTURE.md](ARCHITECTURE.md): what is where and how the pieces fit
- [AGENTS.md](AGENTS.md): how changes are made here (authority, tests first, traps)
- [docs/adr/](docs/adr/): the decisions behind the layout
- each app's README

## About this repository

This is a personal project, published for openness. If kuldare.com ever goes away,
the tools keep working at the mirror addresses, and anyone may fork this
repository and host them under the licence below.

It is not a community project: issues are off and pull requests are not merged.
Fork it instead.

The sites are published from the owner's machine with `npm run publish`, and the
mirror is refreshed by the Release workflow ([ADR 0006](docs/adr/0006-a-release-is-a-tag.md)).
Each app has a CHANGELOG.

## Licence

- **Code and my own text:** MIT, see [LICENSE](LICENSE).
- **Battlefleet Gothic content** (rules text, ship profiles, points, fleet lists and
  scenarios) belongs to its owners: Games Workshop, the BFG: Remastered authors (the
  High Admiralty), and the authors of Warp Rift and the other publications each tool
  cites. It is included for non-commercial fan use and is **not** covered by the MIT
  licence.

This project is unofficial and not endorsed by Games Workshop. Battlefleet Gothic is a
trademark of Games Workshop Ltd.
