# Architecture

Five static web tools for Battlefleet Gothic: Remastered, plus Play, the phone
companion of the Registry. Each is one HTML file that works offline; there is no
server code anywhere. This page is the map: what is where and how it fits
together. The rules of work are in [AGENTS.md](AGENTS.md), and the decisions
behind this layout are in [docs/adr/](docs/adr/).

## The picture

```
 rulebook PDFs (books/, not in the repo)
        │  extractor/extract.py, lists.py           Python, needs the books
        ▼
 extractor/profiles_raw.json, lists_raw.json
        │  extractor/build_data.py + reference/*.json (read from the book by hand)
        ▼
 data/bfg_data.json  ── the public data interface (data/README.md, schema.json)
        │
        ├──────────────┬─────────────────────────┬──────────────────────┐
        ▼              ▼                         ▼                      ▼
 packages/rules   packages/ui              apps/boarding/          other readers
 (domain.js:      (catalog, format,        build_ships.py →        (Ship Profiles,
  fleets, units,   saved fleets, share      src/ships.json          a private simulator)
  legality,        link, QR, theme,
  points)          fonts, badge)
        │              │
        ▼              ▼
 apps/registry ── apps/play          apps/terrain ◄── packages/battlezone ──► apps/scenarios
        │              │                   │                                       │
        └──────┬───────┘                   │          apps/almanac (site only)     │
               ▼                           ▼                    │                   ▼
          tools/build.js  ─────────────────────────────────────────────────────────┘
               ▼
 dist/registry/ (+ play/)  dist/boarding/  dist/terrain/  dist/scenarios/  dist/almanac/  dist/index.html
 dist/share/*.zip                                       │
               ▼                                        ▼
   Cloudflare Workers (*.kuldare.com)        GitHub Pages mirror (kuldara.github.io/bfg-tools)
```

## Folders

| Folder | What | Language |
|---|---|---|
| `apps/registry` | Gothic Fleet Registry: fleet builder, legality checks, printable ship cards | ES modules, CSS |
| `apps/play` | Gothic Fleet Play: the fleet on a phone during a game (hits, criticals, orders) | ES modules, CSS |
| `apps/boarding` | Boarding Actions: resolves a boarding action step by step | ES module + UMD engine |
| `apps/terrain` | Battlezone Generator: rolls the celestial phenomena and draws the table | ES modules, CSS |
| `apps/scenarios` | Scenario Library: every scenario, set up and tracked at the table | ES modules + plain data scripts, one per publication |
| `apps/almanac` | Meta Almanac: the published site only (its sources are private) | built elsewhere |
| `apps/home` | the mirror's front page | HTML |
| `packages/rules` | the rules engine: pure functions that resolve a fleet and its units, price them and check legality | ES modules in `src/`, built into `domain.js` (UMD) for the apps, Node and the simulator |
| `packages/ui` | code and assets the apps share | ES modules, CSS |
| `packages/battlezone` | the terrain core shared by the generator and the library | ES module (the library gets it as a namespace) |
| `data` | the ship data and its contract | JSON |
| `reference` | what was read from the books by hand: list rules, golden test cases, commanders, option effects | JSON |
| `extractor` | Python that turns the books into data, and the checks that compare data with books | Python |
| `tools` | build, serve, test, publish, backup | Node |
| `docs` | `adr/` decisions, `history/` older working notes (Finnish) | Markdown |
| `marketing` | release images and the scripts that made them | |

## Building

`npm run build` runs `tools/build.js`, which calls each app's `build.js`:

1. Expand `@@include` lines in the app's `index.html` (CSS files, the terrain core).
2. Bundle `src/index.js` with esbuild (`format: iife`, ASCII output). The bundle's
   exports are on one global (`GFR` for the Registry, `GFP` for Play) so page
   tools and tests can reach them.
3. Fill the page's markers: `<!--@data-->` (the JSON), `<!--@script-->`,
   `<!--@fonts-->`, `<!--@description-->`, the BFG Tools badge.
4. Run the guards (`tools/lib/kit.js`): no control characters, every CSS
   variable defined, no external address except the allowed ones, the badge's
   links; the Registry and Play are also pure ASCII.
5. Write `dist/<app>/` and, for the Registry and Boarding, a one-file package in
   `dist/share/`.

The Scenario Library's app is bundled from `apps/scenarios/src/` into `app.js`
(`window.SL`); its scenario files stay plain scripts that the build copies.
Every script gets a content hash (`?v=…`) so a browser never runs an old copy.

## The Registry, inside

`apps/registry/src/` (the order in `index.js` is the order the page ran them
when it was one script):

| Module | Does |
|---|---|
| `boot.js` | version, `$` |
| `state.js` | `appState`: the open fleet (`S`) and the page state several modules set |
| `format.js` | crit icons, weapon classes, damage-model lines for the card |
| `save.js` | the saved document (docs: `SAVE_SCHEMA`), load, the per-list stash |
| `model.js` | the open list and its rows, options, upgrades, points, switching lists |
| `validation.js` | fleet resolution for the legality panel |
| `warlords.js` | Da Ork Clanz: Warlords, skwadrons, clans |
| `view.js` | everything drawn on screen: top bar, catalogue, fleet, checks |
| `card-model.js`, `cards.js` | the resolved unit (`resolveUnit`) and the printed ship card |
| `star-fort-cards.js`, `rule-card.js` | star forts (two cards) and rule-only units (mines) |
| `print.js`, `download-editable.js` | print setup, the sheet, the roster, the editable HTML |
| `fleet-files.js`, `saved-fleets.js` | fleet files and the named library |
| `phone.js`, `panels.js` | the "to phone" panel, placing drop-down panels |
| `main.js` | wiring the page's controls, then the first render |

The rules themselves are not here: `packages/rules` (`src/`, built into `domain.js`) resolves an
*intent* (which ship, which options) against the catalog into a resolved unit and
a resolved fleet, with every issue listed. The page renders what it returns.

## Testing

`npm test` (`tools/test.js`) runs every step that needs only the repository and
gives one verdict:

| Group | Steps |
|---|---|
| data | rebuilds `data/bfg_data.json` and requires it unchanged; schema; reference checks; option effects |
| rules | `domain.js` is what `src/` makes, `test_domain.js` (5 700 assertions), symmetry |
| registry | golden cases read from the book (414 units, 238 fleets) on every surface: price, profile, card, fleet view, save round trip; validator, upgrades, saving, save fuzzing, card structure, printed cards, random fleets, print layout in Chrome, the editable sheet in Chrome, a UI walk-through in Chrome |
| play | rules and a smoke test of the built page |
| boarding | engine, fuzzing |
| scenarios | bookkeeping, sizes, terrain (with the generator's fingerprints), map measurements, the front page, the lab, and the in-page tests (every view, every map's labels, content) in Chrome |

`npm run check:books` runs the steps that read the PDFs. CI runs `npm test` on
every push.

Verdicts: **PASS**, **WORK LEFT** (a planned gap is open: nothing is broken),
**FAIL**.

## Releasing

The owner publishes from their machine: `npm run publish -- <app>` deploys
`dist/<app>` to its Cloudflare Worker (static assets only) and checks the live
page against the build. The Release workflow, started by hand from main
(`gh workflow run release.yml --ref main`), tests and refreshes the GitHub Pages
mirror. A tag `<app>-v<version>` would do both in CI once the repository has the
Cloudflare secrets and the github-pages environment allows tags
([ADR 0006](docs/adr/0006-a-release-is-a-tag.md)). Versions and Worker names
are in each `apps/<app>/app.json`.
