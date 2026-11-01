# Changelog: Gothic Fleet Play

Play is released with the Registry (it lives on the same site, at `/play/`);
a tag `play-v<version>` deploys the Registry's site.

## Unreleased

### Added
- A ship's Actions (1.11.2026, RULINGS.md T46): a button in the card's top corner opens Board, Ram, Disengage and Teleport attack. Ram and Disengage say the rule, work out the dice with the target and the modifiers, roll if asked (Passed and Failed for own dice, Re-roll on a failure) and mark the result on the ship; what the enemy must mark is said to you. Board moved here from the row of big buttons.

### Changed
- To phone: a link too long for a QR code a camera can read (over 1 000 characters, usually several fleets) shows no code; the panel offers Save file, Copy link and Share instead.

### Added
- Back to the set-up during a game (31.10.2026): the menu's **Set-up** opens the Leadership, the squadrons and the opponent's room again, with the game record kept. There the start button and a top-bar **Game** button read *Back to the game*, and the *Exit* that forgets the record is not offered.
- The opponent's fleet (31.10.2026): two players link their pages, before the game or during it, and each sees the other's ships, hits, criticals and orders live; the roster gets two sides, *My fleet* and theirs (swipe sideways or tap a tab; an edge tab and a short slide of the cards show the swipe). Linking: one player taps *Create a room* on the set-up screen (or in the menu) and gets a four-letter code, the other types it and taps *Join* or scans its QR code. The pages talk through bfgtools' own relay (`services/relay`, ADR 0007), which works on every network and stores nothing; a reload or a phone that slept goes back into the room by itself. (The first version's two QR codes and direct WebRTC link never connected on real phones.)
- Board on a ship's card: Boarding Actions opens in a new tab or over the page (the choice stays on the device) with the ship on it. Its clan, crew, marks, commanders, remaining hits, turrets, orders and Blast Markers come along from the fleet; with the opponent's fleet linked, their ships are the first choice. The result goes on the ship (hits, criticals, a squadron's losses, a drifting hulk), and what the other player must mark stays on a line on top until tapped away.
- Roll Ld (prototype, 31.10.2026, RULINGS.md T44): the set-up screen rolls the Leadership of every ship on its fleet's own table with what the book adds (Orks -1, Eldar +1, Space Marines 8-10, Mechanicus 7-9 ...), and the pre-game upgrade dice (Mechanicus Gifts, special torpedoes, Xenotech, the Blood Axe refit, crew skills). Every value stays editable: an Ld tile or the upgrade's select. A collapsible guide shows the fleet's Leadership rules and the tables in full; the card shows what was rolled.
- Link preview (29.10.2026): a link to the app in Discord and elsewhere shows its own image (the app itself, the numbers from the data) and text. `npm test` fails when the image is out of date (`npm run og`).

### Changed
- Fleets WiP v0.40 and Rulebook v1.11 (29.10.2026): the cards and rules cite v0.40 pages; the fleet data is the Registry's v0.40 data (the power ram as a ship option, the Mechanicus profiles, mines that ignore shields).

### Fixed
- The close button of the menu and of a card (30.10.2026): its cross is drawn, in the
  middle of the square; the "×" letter sat at the left edge.
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
