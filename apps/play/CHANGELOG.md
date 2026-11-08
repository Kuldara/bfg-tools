# Changelog: Gothic Fleet Play

Play is released with the Registry (it lives on the same site, at `/play/`);
a tag `play-v<version>` deploys the Registry's site.

## Unreleased

### Changed
- **The launch bays as one line** (8.11.2026, the user's pick of four prototypes, A): the bay's own badge and the bays added up, the dice after the numbers - Gorbag's Revenge reads *O 4 + D3+1* where it had three cells of port, starboard and dorsal - and the craft with their speeds once (*Fighta-Bommas 25 · Assault Boats 30 cm*; in the compact view *25/30*). Where a bay sits matters only to a critical: a silenced bay is struck after the sum with its side (*2 + D3+1 −2 port*, p. 67); crippled, the line is halved in the crippled colour (*2 + ½(D3+1)*, p. 65). Each bay and why it is silent are the tooltip. Gravitic hooks and other rows without an arc keep their line.
- A squadron's number of ships is read right after its kind (6.11.2026): on the row the tag says ESC and a large ×3 follows it; on the set-up a bold ×3 (×3 → 4 with a free escort); in the strip of ships a larger ×3.

### Fixed
- Young Gunz: five Grunts with Klaws got their free Grunt as a card of its own ("Free Grunt", no Klaws). The free ship is like the skwadron's cheapest one (the owner, 6.11.2026), so it is a sixth ship on their card, Klaws and all; a class the skwadron has no card of is still a card of its own (RULINGS.md T63, point 4). A game started before keeps its card; a new set-up puts it on the card.
- A card wider than the phone (found by the prototypes' measurement, 6.11.2026): on 13 classes - the Tau with gravitic hooks, a crippled Kor Caste Orbital City worst at +100 px - the row's armament table ran off a 360 px screen and the page scrolled sideways, a text strength ("Capacity: 1 Orca/Warden (x0.5)") in two columns of a table that could not shrink. The row has no table now (see Changed), and on the ship's own card the table lets such a text wrap. check_cards.js draws every class, fresh and crippled, in both views and on its card at 360 px, and fails on a card wider than that or a cell whose text is cut.
- On a laptop the set-up's cards no longer overlap: a card took the width of its longest line (a long Swap Ld choice) and ran under the next column's card, Leadership under Fleet facts. A card now fills its column (check_mob.js checks it at 1309 px).

### Changed
- **The commander's ship in an escort squadron has a crown** (the owner, 6.11.2026, RULINGS.md T64): a Warlord embarked on an escort (Fleets p. 374, "annotate which one it is") rides the card's last ship, whose box has a crown. Tapped destroyed, he goes with it: his re-rolls are lost (struck, "lost: his ship destroyed"), his +2 boarding too, and a Leadership his line gave the squadron goes back to its roll. Tapped back, all of it comes back.
- **A capital ship in a squadron shows its own Leadership** too, dashed and marked *own*, beside the squadron's value in the header that is tested (p. 95).
- **The card at a glance (6.11.2026; the user asked for a layout optimised for a glance in both views, and left the pick to Claude: B, the arc map, from the prototypes A, B and C).** The armament is the ship seen from above - three columns, PORT | PROW | STBD - and a weapon is a cell over the sectors its arc covers: a port battery in the left column, the prow torpedoes in the middle, a dorsal lance L/F/R the whole width, all round and a star fort's quadrant weapons over all three and saying so. "What fires at a target on my left" is one column, with no arc glyph to read; a weapon is on the card once. The rear arc and the rows without an arc (launch bays, gravitic hooks) are lines under the map. In a cell: the badge, the value in force big - the printed one small and struck beside it when halved, a halved text strength with a ½ - and the range in its band's frame; the name, the arc and the reason a weapon is silent are the tooltip, and the full table is on the ship's card (the name). The arcs come first, right under the name - the sectors are the first thing asked at the table (the user, 6.11.2026) - then the spec line in two groups, the move on the left (20 cm · 45°) and the defence on the right (SH, ARM, T, an escort's HITS each), the numbers big; then the commander and re-roll lines, the hits left big (6/10 left) with the track beside them, the chips, the VP ladder and the buttons. An escort squadron's fire reads 12 3×4: the total big, ships × each small. The compact view is the same card smaller - the arcs first there too, the headings glyphs alone, no numbers in the boxes - in place of the chips, which made the eye scan left to right. Measured over every class, fresh and crippled, at 360 px (check_cards.js, on the build before and on this one): the normal row's median is 359 px from 370 and its tallest cards a tenth shorter (p90 510 from 538, a crippled Custodian 792 from 877), the compact row the same as before (211 from 209), and the weapon rows to read for a sector question drop from 3.2 to 1.7 (the prototypes' count, `Battlefleet Gothic/protot/play-kortti/`).
- One list of saved fleets (4.11.2026): the load screen's Saved fleets is the builder's Saved fleets. A fleet that comes by a link, a code or a file goes in there, and the builder shows it; the page's own list from before is moved in once. The fleets the builder is editing are under Being edited in the builder. Deleting and renaming are done in the builder.

### Added
- Victory points you can work with (4.11.2026, the user's picks from the prototypes 2, 4, 7 and B):
  - **The VP in the bar is a button** (a › and a frame). With a linked opponent it shows the score both ways, *you : them*, over a tug-of-war line; their side's bar has the same button.
  - **The score sheet**: you score vs they score, who leads by how much, and **What if…**: the questions worth asking now, from the game: my crippled ships disengage, one of them is destroyed, my flagship goes with the commander, a ship of mine is crippled, everything of mine disengages; with an opponent, I finish off their crippled ship, it disengages, I wipe out a squadron that has lost ships, their flagship goes. Each says how the score moves; tick several to add them up (now → then, a mark on the line where it was). Nothing in the game changes.
  - **The ladder on each card**: what the ship - or the escort squadron, on its head - gives away in play, crippled, disengaged and destroyed, the one it is in marked. A tap previews the total in the bar; a second tap, or any other tap, puts it back.
  - The figures are the page's own (PLAY.conceded: p. 123, an escort squadron's disengage p. 57, Necrons Fleets p. 404). Planetary defences, mines and star forts are left out of the what-ifs: they pay only when destroyed.
- **A disengaged card looks it** (card B): a grey frame, its content greyed, and a band *↗ DISENGAGED · the enemy gets N VP*. Not struck through - the ship is off the table, not destroyed. An escort squadron's head does the same when all of it has left.
- Young Gunz and Mob Rule at the set-up (4.11.2026, RULINGS.md T63, the owner's design): under Roll Ld, **Apply Young Gunz & Mob Rule**, grey until every Ld is in. A Da Ork Clanz tiddla on Ld 5 or 6 - after the swaps, before Mob Rule - gets its free escort, the cheapest class paid for (Klaws counted per vessel); the mark's list takes another class within it or *No free escort*; it is 0 pts and concedes no VP. Then Mob Rule's +1 while more than five ships are left (Fleets p. 372). What changes gets a mark (*+1 Brute Ram Ship*, *+1 Ld · Mob Rule*), a changed Ld keeps its old value striped beside the ringed new one, and a line says why; a tap after Apply asks to *Apply again*. Under Start, the skwadrons not applied (it never blocks). In the game the +1 is in every Leadership the skwadron uses - the tile's *+1 mob*, the Ld pop, the card, the orders pop's check, Actions' tests - and goes with the sixth-from-last ship, with a toast; the free one's box is dashed. After Start Young Gunz is read-only; Mob Rule can still be applied (Menu > Set-up).
- The Leadership swaps on their rows (T63): **Swap Ld** on a Clanz Warlord's row (his ship with one ship or escort squadron of his command, Fleets p. 374) and on an Ork battleship's, Waaagh! too (a Kill Kroozer, a Terror Ship or Zukov's Klaw, pp. 376-381, 383). The options say what the swap does (*Squadron B ×6: Ld 8 → 6, Young Gunz*); the two values change places at once, *no swap* puts them back, a tap on either ends it. The battleships' swaps come first, then the Warlords', then Young Gunz.
- Da Ork Clanz: a mixed tiddla (escort cards with one Squadron letter, Fleets p. 374 "in any mix desired") is one squadron in the game, as every mixed escort squadron has been since 28.10.2026: one head ("Escort squadron T ×6 of 6") over each class's own card, one Leadership for all its cards, one order and one Brace, its victory points as a whole. A Blood Axe tiddla's commandeered escorts are in it. Mob Rule is on the head, counting the ships still alive on all its cards ("mob rule: +1 Ld (6 ships)", gone at five, p. 372), and Young Gunz is said once. RULINGS.md T42 still said escort squadrons stay units of their own; it now records this, the user's decision of 4.11.2026 (J244).
- A rolled or chosen refit changes the card's numbers (2.11.2026, T44): Reinforced Hull adds its 25 % to the starting hits (crippled at half of the new total) and takes 5 cm off, the shield, turret, speed and repair-die results are on the profile, Long Range Sensors is a +1 Ld modifier; the set-up's select says "on the card: 13 hits, 15 cm".
- The set-up's upgrade dice (Mechanicus Gifts, the Imperial and Blood Axe refits, crew skills): the chosen result's text is under its select, and the whole table is the tooltip of the select and its options (2.11.2026).
- Your own dice come first everywhere (2.11.2026, T49): Passed and Failed, a number or a result's tile lead, and the page's Roll is the dashed option after them. A failure on your own dice can spend a re-roll too. A ram's damage takes the hits you rolled, and a warp rift's distance is rolled only if asked.
- The command check rolled if you ask (2.11.2026, RULINGS.md T49): the orders pop has Roll 2D6 against the ship's Leadership with what the page tracks; Under Fire and Enemy Contacts are chips when it does not. A pass leaves the order to tap, a failure is Check failed, and Re-roll spends one.
- Catastrophic damage rolled if you ask: Roll D6 or 2D6 on the hulk's table marks the row.
- Hit-and-run covers an assault boat's raid as well as a teleport attack, and takes your own die (1 to 6).
- A ram's target picked from the books: without the opponent's fleet linked, a class from any list fills its size, armour and hits.

### Changed
- A Blood Axe tiddla rolls its one Leadership on the Ork table whatever its first card is (T63). The Mob Rule chip is a Clanz tiddla's only, no longer on six defence platforms: applied, it counts the ships the +1 rests on; not applied, it is the old reminder. Actions' ram, disengage and celestial tests count Long Range Sensors' +1, as the card does (T46).
- The Ld guide says how Young Gunz, Mob Rule and the swaps are applied; "tap the swapped values" and the Young Gunz note on the row are gone.
- Every squadron from the builder starts as an SQN group under the builder's own letter (4.11.2026, RULINGS.md T42), so the phone says what the builder and the printed roster say. Play had three letters: the fourth squadron and later ones started without a group, with nothing said - common in Da Ork Clanz, whose kroozers and Roks are skwadrons by their letter. The SQN button goes through the fleet's squadrons, then a new letter, then none; a squadron's colour is its letter's.
- The card at a glance (2.11.2026): the stats line keeps its places with the numbers bigger; the armament table leads with the badge and the strength in force now, big (when halved, the printed value stays first, small and struck, and the half beside it is the big one), then the range, the arc, and the name last and small; a port / starboard pair is one row, "port and starboard, each", until a critical parts it. The compact row's chips are larger, with the strength now and the printed value, and no names. A hulk's line is its name and what the enemy needs, small; the squadron's combined fire leads with the numbers too; the crew and upgrade line and a commander's re-roll words are small, and the compact row leaves the upgrade line out.
- Fewer places for one thing (2.11.2026): Disengage and Boarding are out of the orders pop and the card's Status (Actions has them; Status keeps only the way back for a ship marked disengaged by mistake); the fire reminder's names add the hit themselves and stay ticked.
- The set-up screen starts with Leadership; Fleet facts and the opponent's room come after it.

### Fixed
- A capital squadron no longer shows a mixed escort squadron's letter (4.11.2026): a tiddla marked A and the kroozers marked B were both SQN A.
- A squadron letter from a fleet link or a file is printed as text (4.11.2026): markup in an escort squadron's letter went into the page as markup.
- A capital ship in a squadron that fails to disengage falls out of the squadron (Rulebook p. 57; 4.11.2026): in a browser the page stopped with an error there, at a name one module used without importing it.

### Added
- The set-up rows show each ship's price and what was bought for it (2.11.2026), so two ships of one class can be told apart before they are named.
- A tab icon that is a ship from above, not a warning triangle (1.11.2026); the installed app's icons as well.
- Your own order of the cards (1.11.2026): drag a card by the small tag at its head. A squadron moves as a whole, UNDO takes it back, and the strip of ships follows.
- The ship's name can be changed on its card.
- Repair with one tap (1.11.2026, RULINGS.md T45): beside a ship's criticals, Repair rolls its damage-control dice (p. 88) and repairs; a fire left burning stays for you to tap (p. 67). The player picks only when the dice cannot repair everything and there is more than one kind. What happened stays on a line until the next tap elsewhere; UNDO takes it back. The End Phase panel has Repair all.
- A ship's Actions (1.11.2026, RULINGS.md T46): a button in the card's top corner opens Board, Ram, Disengage and Teleport attack. Ram and Disengage say the rule, work out the dice with the target and the modifiers, roll if asked (Passed and Failed for own dice, Re-roll on a failure) and mark the result on the ship; what the enemy must mark is said to you. Board moved here from the row of big buttons.
- Celestial phenomena in Actions (1.11.2026, RULINGS.md T47): the Rulebook's phenomena in short with pages; asteroids, gas clouds and warp rifts have helpers that roll and mark.

### Changed
- A fire's hit is always your tap (1.11.2026): Repair no longer adds it, and the change of turn lists the ships still burning in the bottom bar.
- Repair is under the critical table, so tapping it again cannot land on a result: repeated taps were adding Engine damage (1.11.2026).
- The Blast Marker and shield tracking is gone (1.11.2026, RULINGS.md T48): the switch, the SH and Under Fire buttons and the markers' panel. Shields show as printed. Repair has a second button, a burst icon, for half the dice with Blast Markers in contact (p. 88).
- Blast Markers are on or off (1.11.2026, T48): the menu's switch gives each card a burst button, -1 Ld and half the repair dice while on.
- Repair moved into the critical table (1.11.2026, T45): each success is a repair to spend on what you choose, with a counter (1 repair left of 2) and Done. The menu's Auto repair puts it back on the card, repairing at once when there is nothing to choose.
- A ship lost in a warp rift counts as destroyed, for its full points (T47). A radiation burst lowers the Leadership of Actions' tests (p. 115).
- Fleets: Send and Send all replace To phone and All to phone, with the same sheet as the builder, and Receive takes fleets by code. The paste box is gone. The opponent's room is unchanged.
- Ships nobody named (1.11.2026): a short name, numbered when a class appears more than once: Lunar 1, Lunar 2, Dictator. The class in full is on the ship's card, and a name from the builder or the set-up stays as it is.
- What a ship bought and rolled before the game is on one quiet line under its name.

### Added
- Back to the set-up during a game (31.10.2026): the menu's **Set-up** opens the Leadership, the squadrons and the opponent's room again, with the game record kept. There the start button and a top-bar **Game** button read *Back to the game*, and the *Exit* that forgets the record is not offered.
- The opponent's fleet (31.10.2026): two players link their pages, before the game or during it, and each sees the other's ships, hits, criticals and orders live; the roster gets two sides, *My fleet* and theirs (swipe sideways or tap a tab; an edge tab and a short slide of the cards show the swipe). Linking: one player taps *Create a room* on the set-up screen (or in the menu) and gets a four-letter code, the other types it and taps *Join* or scans its QR code. The pages talk through bfgtools' own relay (`services/relay`, ADR 0007), which works on every network and stores nothing; a reload or a phone that slept goes back into the room by itself. (The first version's two QR codes and direct WebRTC link never connected on real phones.)
- Board on a ship's card: Boarding Actions opens in a new tab or over the page (the choice stays on the device) with the ship on it. Its clan, crew, marks, commanders, remaining hits, turrets, orders and Blast Markers come along from the fleet; with the opponent's fleet linked, their ships are the first choice. The result goes on the ship (hits, criticals, a squadron's losses, a drifting hulk), and what the other player must mark stays on a line on top until tapped away.
- Roll Ld (prototype, 31.10.2026, RULINGS.md T44): the set-up screen rolls the Leadership of every ship on its fleet's own table with what the book adds (Orks -1, Eldar +1, Space Marines 8-10, Mechanicus 7-9 ...), and the pre-game upgrade dice (Mechanicus Gifts, special torpedoes, Xenotech, the Blood Axe refit, crew skills). Every value stays editable: an Ld tile or the upgrade's select. A collapsible guide shows the fleet's Leadership rules and the tables in full; the card shows what was rolled.
- Link preview (29.10.2026): a link to the app in Discord and elsewhere shows its own image (the app itself, the numbers from the data) and text. `npm test` fails when the image is out of date (`npm run og`).

### Changed
- Fleets WiP v0.40 and Rulebook v1.11 (29.10.2026): the cards and rules cite v0.40 pages; the fleet data is the Registry's v0.40 data (the power ram as a ship option, the Mechanicus profiles, mines that ignore shields).

### Fixed
- A capital ship in a squadron that failed its Disengage test in Actions stayed
  in the squadron, and the tap saved nothing: in a browser it threw "isEscGrp is
  not defined" (an import missing in `actions.js`, which the tests' globals
  hid). It falls out of the squadron now, with no fire this turn (Rulebook
  p. 57, RULINGS.md T46).
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
- The smoke test hides no forgotten import (4.11.2026): before its snippets
  run, it checks that the page's code takes none of the names they share (every
  export of `GFP`, the shared state) from the global scope, by esbuild's own
  scope analysis (`tools/lib/free-names.js`). The build stops on any name a
  bundle takes from the global scope that a browser does not have.
- ES modules (`src/`) and `styles/play.css` instead of one template; the 24
  functions the build used to copy out of the Registry's template with regular
  expressions are imported from `packages/ui`.
- The Builder link is `../` in the source too (it was rewritten for the site only).

## 0.1 — October 2026

Prototype: the fleet's cards on a phone, hits, criticals, special orders and
braces, ordnance, blast markers, re-rolls, the End Phase; compact view; fleets
from the builder by link, QR code or file; installable and offline on the site.
