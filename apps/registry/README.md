# Gothic Fleet Registry

A fleet builder and ship-card printer for Battlefleet Gothic: Remastered. One
HTML file: no install, no network, works from a disk.
Live at [bfgtools.kuldare.com](https://bfgtools.kuldare.com/).

## What it does

1. **Pick a fleet list** (32: Imperial Navy, Chaos, Orks, Eldar, Necrons, Tau,
   Space Marines, Rogue Traders, Adeptus Mechanicus, ...) and a points limit.
2. **Only that list's ships appear, at that list's price**: the same hull costs
   differently on different lists (a Dictator is 220 pts in the Gothic Sector and
   255 in an Explorator fleet).
3. **Only the ship's own options are offered**, with their dependencies (a Terror
   Ship's boarding torpedoes are greyed out until its torpedo launcher is taken).
4. **Legality is checked live** after every change, and every check shows the
   sentence of the book it comes from. Ships borrowed from another list (Fleets
   p. 14), commanders and where they ride, squadrons and Ork Warlords are covered.
5. **Print cards**: 144 × 135 mm, two to an A4 page (or Letter, at any card size),
   with damage tracks, criticals, options and special rules. **Print the roster**:
   the whole list with points and checks.
6. **Save** fleets by name in the browser, export them as files, or send them to a
   phone as a link or a QR code, where **Play** (`apps/play`) keeps track of the
   game.

### What it enforces and what it does not

This is the tool's most important property, and it is made visible. Rules are
prose; some can be checked by a machine, some cannot.

- **Enforced** (about 520 rules on 32 lists): points limits, section caps
  (`0-12 Cruisers`), ratios (*1 battleship for every three cruisers*), totals,
  points-bound counts (*one Warlord per 500 points*), mandatory picks, squadron
  sizes, per-row limits. Each shows its source sentence.
- **Not enforced** (about 1 200 sentences): shown as written under their
  sections as **Check yourself**, grouped by kind. The tool never claims to check
  them.

Every list rule's status is recorded in `reference/` (see its README).

## Where the data comes from

Everything is extracted from the books by `extractor/` and checked against them:
ship profiles from the Fleets Book's profile tables (176), fleet lists from its
list pages (32 lists, about 1 700 rows), linked to profiles through their
`(pg. NN)` references, the critical hits table from the Rulebook p. 67. Known
misprints are corrected explicitly in the data, each with its page. See
`data/README.md` for the format.

## Code

```
index.html          the page: markup, @@include lines for styles/, build markers
styles/             13 CSS files in cascade order (tokens, chrome, layout, card, print, ...)
src/                ES modules (ARCHITECTURE.md lists them); index.js is the entry
assets/og.png       link preview image; make_og.py draws it from counts.js
counts.js           the numbers the page advertises, one rule for all
build.js            npm run build -> dist/registry/ and dist/share/
test-support.js     loads src/ into Node for the tests
docs/               save-format.md, definition-of-done.md
```

The rules engine is `packages/rules/domain.js` (contract:
`packages/rules/CONTRACT.md`). Code shared with Play is in `packages/ui`.

## Tests and page tools

All run by `npm test`; each also runs alone:

| File | Checks |
|---|---|
| `test_golden.js` | cases read from the book against every surface (price, profile, card, fleet view, save round trip) |
| `test_validator.js` | the legality checks |
| `test_upgrades.js` | list upgrades, the editable sheet |
| `test_save.js`, `fuzz_save.js` | saving, loading, the library, links; thousands of broken saves |
| `qa_structure.js` | the structure of every card |
| `print_check.js` | every printed card against its profile |
| `stress.js` | random fleets with every combination of choices |
| `layout_check.js` | print layout in headless Chrome: overflow and text under 4.2 pt |
| `check_editable.js` | the downloaded editable card sheet in Chrome: fitting, edits, tick boxes |
| `check_links.js` | friends' fleet links in Chrome: the dialog, four links in four tabs, Save, Play from a tab |
| `metrics/clanz.js` | builds an Ork Clanz fleet through the real UI in Chrome, at phone size |

Tools that are not tests:

```bash
node apps/registry/make_fleet_cards.js --list         # fleet card sheets as PDF (headless Chrome)
node apps/registry/make_fleet_cards.js <sheet>         # BFG_CARDS_DIR = where the PDFs go
python apps/registry/sheet_check.py -v                 # a card sheet as a real PDF: paper, size, paging
```

## Printing notes

- Browsers do not print background colours unless asked; the card uses
  `print-color-adjust: exact`. If a card still prints grey, tick "Background
  graphics" in the print dialog.
- Armour and launch-bay ranges are shortened to the book's short form on the card
  (`6+ front / 5+ sides / 4+ rear` → `6+/5+/4+`); the card gives the page.
- Ordnance extras priced per launch bay are recognised but the count is not
  computed: use the ± pts field.

## History

Version 1.0 was released on 10 September 2026; the working notes of its
development (backlog J1-J239, spot checks, tasks, reviews) are in Finnish under
`docs/history/registry/`. Changes from here on are in `CHANGELOG.md`.
