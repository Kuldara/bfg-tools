# Changelog: Gothic Fleet Registry

Releases are tags `registry-v<version>`. Earlier changes are numbered J1-J239 in
the Finnish backlog, `docs/history/registry/BACKLOG.md`.

## Unreleased

### Removed (for developers)
- The release images and their scripts (`marketing/`) and the archived 1.0 and
  1.1 pages under `docs/history/registry/versiot/` left the repository on
  26.10.2026, also from its history: 25 MB of pictures and generated pages that
  nothing builds from. The owner keeps them outside the repository.

### Changed (for developers)
- The rules engine is ES modules in `packages/rules/src/` (ids and the saved
  unit, lending, upgrades, pricing, weapons, the card's arms, criticals, special
  rules, commanders, validation, resolveFleet, resolveUnit); `domain.js` is
  built from them and checked in `npm test`. `resolveFleet` itself (1 420
  lines) is a short list of named checks in four modules (section rules,
  purchases, reserves and allies, single lists' rules), each with the old text.
  Every Registry result is the same:
  4,162 cases (every row, every option and upgrade, 300 random fleets) match
  the one-file engine, as do the golden cases, Play and the simulator.

### Fixed
- **Friends' fleet links opened one after another (J240).** A link worked once,
  and later links showed the same fleet again. Three causes, all fixed: a second
  link in an open tab changed only the address after # and was never read (now
  read on every change of the address); the first link's fleet stayed unsaved on
  its list, so every later link of that list went quietly into Saved fleets
  (now a link always opens its fleet and keeps it in Saved fleets under its name;
  what the list had is kept there too, as *Name (changed)*); and an older tab of
  the page wrote its state over a newer tab's at its next change (tabs now read
  each other's saves). `check_links.js` opens links in a row in Chrome, in one
  tab and in two; `test_save.js` checks the same order in Node.
- The page's description said 738 printable cards and its link preview's alt text
  1102; the preview image itself said 30 lists, 171 profiles and 460 cards. All
  three now come from one count (`counts.js`): 32 lists, 176 profiles, 738 cards.
- Da Ork Clanz Roks: Evil Sunz and Soopa Boostas no longer raise a Rok's speed
  to 15 cm. **Ruling T57** (user 26.10.2026, read as written for now): Fleets
  p. 393 says Roks "travel 10 cm forward in a straight line, no more, no less",
  so a +5 cm upgrade leaves the Rok at 10 cm. The Rok can still take and pay for
  the row; its card says why the speed stays, and Soopa Boostas still gives 4D6
  on All Ahead Full. Revisit if the High Admiralty rules otherwise.
- Clan upgrades on Roks: **Ruling T58** (user 26.10.2026) - every Rok pays the
  clan price, as every capital ship does; only a tiddla skwadron pays once
  (Fleets p. 369, which counts Rok skwadrons among the capital ship skwadrons).
  The app already charged per Rok and asked for the clan on every ship of a Rok
  skwadron; the price text and the row note now say so, and golden cases lock it
  (`clanz-bad-moonz-paid-per-rok`: three Bad Moonz Roks cost +90, not +30).

### Added
- The ship data is published on its own at `/bfg_data.json` (CORS open), with a
  version (`schemaVersion` 1.0) and a documented contract (`data/README.md`).

### Changed (for developers; nothing changes for players)
- The source is ES modules (`src/`) and CSS files (`styles/`) instead of one
  7 400-line template; esbuild bundles them into the same one-file page.
- Code shared with Play moved to `packages/ui`; the rules engine is
  `packages/rules`.
- Built with `npm run build`, tested with `npm test`, released by tag.

## 1.2 — 2026-10-12 and the live updates after it (J181-J239)

Card readability (larger text, coloured range bands, critical icons, port and
starboard pairs), print setup for A4 and Letter at any card size, named saved
fleets with files, links and QR codes, Play (the phone companion), the FAQ 2026 as
a rules source, Da Ork Clanz Warlords and skwadrons, "Check yourself" grouped by
kind, commanders aboard ships, squadrons, attack ratings and VP facts.

## 1.1 — 2026-09-14

Borrowed ships from other fleet lists (Fleets p. 14), each list keeps its own
fleet, planetary defences on every list.

## 1.0 — 2026-09-10

The first public release: 32 fleet lists, live legality checks with their source
sentences, printable cards and roster.
