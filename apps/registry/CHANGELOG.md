# Changelog: Gothic Fleet Registry

Releases are tags `registry-v<version>`. Earlier changes are numbered J1-J239 in
the Finnish backlog, `docs/history/registry/BACKLOG.md`.

## Unreleased

### Fixed
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
