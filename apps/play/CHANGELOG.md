# Changelog: Gothic Fleet Play

Play is released with the Registry (it lives on the same site, at `/play/`);
a tag `play-v<version>` deploys the Registry's site.

## Unreleased

### Added
- Link preview (29.10.2026): a link to the app in Discord and elsewhere shows its own image (the app itself, the numbers from the data) and text. `npm test` fails when the image is out of date (`npm run og`).

### Changed
- Fleets WiP v0.40 and Rulebook v1.11 (29.10.2026): the cards and rules cite v0.40 pages; the fleet data is the Registry's v0.40 data (the power ram as a ship option, the Mechanicus profiles, mines that ignore shields).

### Fixed
- Da Ork Clanz: a clan or a Gubbin bought on one card of a mixed tiddla (one
  Squadron letter) is on every card of it and paid once, as the builder has it
  (Fleets pp. 369-370, ruling T60 in the Registry's changelog). An Onslaught in
  an Evil Sunz tiddla whose clan was bought on its Savage card moved 20 cm.
- A second fleet link opened in a tab where Play is already open (an older
  "to phone" code; new ones open the builder) is read too: the page listens to
  changes of the address instead of reading it only when it opens (J240).
- Play opened from a builder tab plays that tab's fleet: the builder keeps a copy
  per tab (J241), and Play reads it before the shared one (`builderRaw`).

### Changed (for developers)
- ES modules (`src/`) and `styles/play.css` instead of one template; the 24
  functions the build used to copy out of the Registry's template with regular
  expressions are imported from `packages/ui`.
- The Builder link is `../` in the source too (it was rewritten for the site only).

## 0.1 — October 2026

Prototype: the fleet's cards on a phone, hits, criticals, special orders and
braces, ordnance, blast markers, re-rolls, the End Phase; compact view; fleets
from the builder by link, QR code or file; installable and offline on the site.
