# Changelog: Gothic Fleet Registry

Releases are tags `registry-v<version>`. Earlier changes are numbered J1-J239 in
the Finnish backlog, `docs/history/registry/BACKLOG.md`.

## Unreleased

### Added
- Link preview (29.10.2026): a link to the app in Discord and elsewhere shows its own image (the app itself, the numbers from the data) and text. `npm test` fails when the image is out of date (`npm run og`).

### Changed: Fleets WiP v0.40 and Rulebook v1.11 (29.10.2026)
- The data is read from **Fleets WiP v0.40**; the Rulebook is **v1.11** (the
  same pages as v1.10). Every page on the cards, the checks and the hovers is
  a v0.40 page.
- **Ship ids stay the same** (the v0.36 profile pages, `extractor/ship_ids.json`):
  links, saved fleets and readers of the data keep working. A ship's `pg` is now
  its v0.40 page. The ten new Mechanicus profiles are `am128`-`am137`.
- **Power ram:** an option of each ship that may take it (+5 pts, "if it is part
  of an Imperial Navy, Adeptus Mechanicus, Inquisition, or Rogue Trader fleet
  list"), with the ship's own condition: one or the other with the nova cannon
  ("if the prow torpedoes are not replaced"), or after the nova cannon swap or
  the 6+ prow armour. The list row "Imperial Power Ram" is gone; on other lists
  (Chaos renegades, Space Marines, Tau, Demiurg) the option is not offered. A
  saved fleet's ram becomes the ship's option.
- **Adeptus Mechanicus:** the Explorator list uses the Mechanicus profiles
  (p.126-137) with the +1 turret and the dorsal lance printed in them and their
  own options (plasma-boosters, nova cannon, dorsal lance swap, prow armour).
  The list's required rows and its nova, plasma and dorsal lance rows are gone.
  A saved Mechanicus ship opens on its new profile.
- **Grey Knights** (p.154): a 0-1 Inquisitor Lord section with the Ordo Malleus
  Inquisitor Lord (Ld 10, 100 pts) as a row of its own; the Battle barge only
  with him and 1,000 points besides; strike cruisers one per 500 points or part
  thereof; a Firestorm row; the Chaos opponent's free Marks only with the Ordo
  Malleus Lord (one, plus one per strike cruiser); attack rating 3 (2 with a
  Blackship) whoever leads.
- **Abaddon, Prince Yriel and Kor'O'Mesme** come from their own pages (p.241,
  p.313, p.453). Yriel now has Leadership 10. The Chaos Warmaster is "0-1" on
  Black Crusade and the god lists: no required commander.
- **Tyranids:** at least six escort drones and up to 12 more escorts per hive
  ship (18; was 12); a fire ship drone costs +5 pts; the hive ship's weapons are
  "Bio-plasma discharge".
- **Rogue Traders:** "any cruiser hull counts as a Rogue Trader cruiser" is gone,
  so the Wolf Pack hulls left the Rogue Traders list and an Exploration variant
  is the second Rogue Trader cruiser onwards (an error alone, was a warning);
  the Pirates list no longer offers the Siluria. "Cargo Vessel" is "Armed Cargo
  Vessel".
- **Chaos renegades** may take profile options that change no weapon (the light
  cruisers' 6+ prow armour); weapon refits, nova cannons and the rest stay out.
  **Tzeentch** Warp Beasts no longer need the Mark of Tzeentch.
- **Mines and minefields** follow v0.40 (p.512-513): mines ignore shields as
  ordnance; an enemy crossing a minefield tests Leadership against 3D6 and takes
  D6 damage that shields block.
- **Inquisition:** with no Inquisitorial Cruiser or Blackship the Inquisitor
  Lord goes on the most expensive ship (p.148; v0.36's "any Imperial cruiser" is
  gone). An Ordo Malleus fleet taking Bastion's Chaos reserves loses the Grey
  Knights contingent's bonuses (text).
- Smaller: Tau Custodian limit leaves out only allied vessels; the Dark Eldar
  and Eldar movement and celestial cards cite the book (v0.40 includes FAQ
  2026); misprints of v0.36 that v0.40 fixed (Zukov's Klaw, Havoc) no longer
  need corrections. Renamed rows: "Strike cruiser" (Space Marines), "Grey
  Knights Battle barge", "Zukov's Klaw (Goff)", "Ordo Malleus Inquisitor Lord
  (Ld 10)"; saves find them by their position.
- Interpretations kept: the Grey Knights Honour Guard and Terminators for
  capital ships (the book now says "vessel"); the power ram counts the host
  list; the hulk's Evil Sunz and Soopa Boostas bans stand on p.374 (the
  authors, 29.10.2026; the hulk rules are under their review).

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

### Changed
- Da Ork Clanz: on a Rok, Evil Sunz and Soopa Boostas say "Rok: 10 cm as
  written (RAW)" instead of "Rok: stays 10 cm (p. 393)" (user 29.10.2026: the
  rule is not quite clear). The hover quotes p. 393, says the app counts it so
  (ruling T57), that the intent (RAI) is not clear because the clan and the
  Gubbin give +5 cm, and that the players may agree before the game whether
  the Rok moves 15 cm.
- **Save under a new name is a new save** (user 28.10.2026: "changing the name
  should always make a save, not over the old one"). In the Save drop-down,
  Save updates the saved fleet the open one came from only while the name is
  the same; with another name it saves a new one, and the old one stays as it
  was, under its name. The panel says so. Save as new works as before.
- **Effect tags explain themselves on hover** (user 28.10.2026). Da Ork Clanz's
  Shokk-Attack Lance said "shields down: 4+ at 30cm", which read as if the
  lance took the target's shields down; the book has it the other way round:
  it "is only effective against ships with shields down in the same manner as
  teleporters" (Fleets p. 371). Its tags are now "replaces prow heavy gunz",
  "only at a target with shields down" and "not while crippled or braced" as
  limits, "4+ to hit, 30cm" and "hit: D3+1 snotling hordes, +D6 to its Ld",
  and each says on hover how it works, with its pages (misses, escorts, how
  the hordes go away). A tag with its own explanation is underlined with
  dots; every other effect tag shows the book's sentence on hover.
- **The catalogue's + on an escort row adds a new squadron card** (user
  28.10.2026: + added one ship to the row's bottom card, "it should always add
  a new squadron card; now it is confusing"). Each + is a new card at the
  squadron's minimum (two Cobras, a defence platform alone), and the row then
  shows that newest card's own − n + under the name ("Newest card − 2 +",
  with its squadron letter or name), so it grows right there; the card's
  stepper in Your fleet does the same. The catalogue's − beside the + takes
  the row's last card away. The newest card is the row's last plain one: not a
  mixed squadron's, in Da Ork Clanz the active Warlord's; while a mixed
  squadron is filling the row has no stepper. The buttons' tooltips say so.
  This replaces 18.10.2026's one ship a press for squadron cards. A row sold
  on one card - orbital mines, minefields, silos - still adds one to that card
  a press. Building the Clanz meter's fleet on a 375 px phone takes 37 inputs
  (was 36); growing the cards in Your fleet instead would have taken 52.

### Fixed
- **Da Ork Clanz: a mixed tiddla's clan and Gubbins are the whole skwadron's,
  paid once.** Fleets p. 369: "The point cost for clan upgrades for tiddla
  skwadrons count for the whole skwadron (regardless of how large it is!), not
  individual escorts"; p. 370 says the same of Gubbins. The builder priced and
  applied them per card: Evil Sunz bought on the Savage card of tiddla T left
  its Onslaught card at 20 cm, and Evil Sunz on both cards cost 40 instead of
  20 (three Savages, three Onslaughts and three Brutes: 310 instead of 290).
  A Gubbin on both cards was also two of the Warlord's Gubbins.
  **Ruling T60** (28.10.2026): a mixed tiddla is the cards of one Squadron
  letter (RAW-01), so a clan row or a Gubbin taken on any of them is the
  skwadron's. Every card of the tiddla that is offered it has it - its effect
  is on each card, in the fleet view, the printed card and Play - and it is
  paid once, on the card that bought it (when several did, the first of them
  in the fleet); the other cards say "paid on Savage gunship" ("skwadron" on
  the printed card). Taking, opening or hiding the row on one card does the
  same on the others. It counts once among the Warlord's Gubbins, and every
  card of the tiddla he is aboard is "his own ship or escort skwadron"
  (p. 372). Klaws for Grunts stay each card's own: "+5 points per escort"
  (p. 371). A Blood Axe tiddla's commandeered escorts are of its skwadron
  (p. 369), so its Gubbins reach them where their card is offered the row.
  Golden cases `clanz-mixed-tiddla-clan-and-gubbins-for-the-whole-skwadron`,
  `clanz-mixed-tiddla-clan-on-every-card-paid-once`,
  `clanz-mixed-tiddla-gubbin-on-every-card-is-one-gubbin`; the engine's
  `shareSkwadronUpgrades` (packages/rules/CONTRACT.md).
- Da Ork Clanz: a Warlord's own ship cannot take another Gubbin once he has
  one for every re-roll ("one upgrade from the Gubbins list for every re-roll he
  has", Fleets p. 372; user 27.10.2026). The other Gubbins stay in the list,
  greyed with Take off and the reason in the tooltip (user 28.10.2026: hiding
  them was confusing). The Warlord block says "all used: another needs another
  re-roll"; a taken Gubbin stays, so a fleet with too many can still drop one.
  More Gubbins (Klaws, Shokk-Attack Lance, Assault Karrier) and Deathskullz's
  free looted rows are not counted and stay offered.
- **Escort squadrons in the five lists whose rules count them** (user 27.10.2026,
  after the Clanz audit): Rogue Traders (p. 174), Exploration (p. 177), Pirates
  and Wolf Packs (p. 179), Tau Commerce Protection (p. 457) and Demiurg War Host
  (p. 487). There a short escort card joined a mixed squadron by itself for the
  size check while the counting rule saw every card as a squadron, so the two
  disagreed: in Pirates and Wolf Packs two cruisers with two Swords and two
  Cobras were green, though four escorts cannot be "at least one squadron of
  3-6 escort vessels ... for each cruiser". Now the squadrons are the player's,
  as the Clanz tiddlas are: escort cards with the same Squadron letter are one
  squadron in any mix ("Escort squadron A: 4 ships: 2 Sword Frigate + 2 Cobra
  Destroyer"), a card without one is a squadron by itself, and size and count
  read the same squadrons. Rogue Traders' rule counts squadrons, one per
  capital ship (it counted six escorts per ship, so two squadrons of three
  behind one cruiser were green). Demiurg: "Tau, Nicassar and Rogue Trader
  escorts may not be mixed in the same squadrons" is checked on the letters.
  Escort cards in these lists have the Squadron menu, with escort letters only.
  In other lists nothing counts escort squadrons, so a short card without a
  letter still joins a mixed squadron by itself (p. 13); cards with a letter are
  that squadron (see Added, Mixed squadron).
- **Da Ork Clanz, from an outside audit of the live site (ChatGPT, 27.10.2026).**
  Each finding was checked against Fleets pp. 369-373 and 381 before it was
  changed; golden cases lock each one and were red before the fix.
  - Tiddla skwadrons are the player's own: cards with the same Squadron letter
    are one tiddla "in any mix desired" (p. 372), a card without a letter is one
    by itself, and every check reads the same skwadrons. Two Brutes and two
    Onslaughts on two cards were green before - the size check pooled them into
    one mixed tiddla while the Warlord's count saw two (RAW-01). A tiddla's line
    lists its members: "Tiddla skwadron A: 6 escorts: 3 Brute ramship + 3 Cobra
    class destroyer". Every tiddla card has the Squadron menu now, not only in a
    Blood Axe fleet.
  - **Ruling T59** (open interpretation, 27.10.2026): "A Blood Axe tiddla skwadron
    of at least six escorts may include up to three Imperial Navy and/or Chaos
    escorts" (p. 369) counts the skwadron as fielded, so three Brutes and three
    Cobras are a Blood Axe tiddla. J220 counted the Ork escorts only (RAW-02).
  - The commandeered escorts count toward the tiddla's ten (p. 370): ten Brutes
    and three Cobras are red (RAW-03). They are in their tiddla's Warlord's
    command, so his summary lists them and he can be aboard one when it is his
    dearest ship (p. 372).
  - A Warlord's own clan (the clan picked for him) is his skwadrons' clan whether
    or not they pay for its benefit (p. 369). A Snakebite Warlord with a kroozer
    is red - "Snakebite capital ship skwadrons can only use space hulks or roks"
    - and a kroozer that bought another clan than its Warlord's is a second clan
    (RAW-04). The Warlord's clan is now part of the rules engine's unit
    (`intent.clan`); saves already kept it.
  - An Assault Karrier "takes boarding torpedoes for free, but it may only use
    assault boats" (p. 371): bought after the Terror ship's own +5 boarding
    torpedoes it takes them over with the notice "included for free", the paid
    rows are not offered beside it, and torpedo-bommas and orbital mines exclude
    it the way they exclude each other (RAW-06; a Terror with a Karrier cost 190).
  - The fleet's "hulls" count ships only; a Warlord was counted as a hull
    (UX-06).
  - Not changed, as the audit itself advised: Zukov's 210 points (p. 381, the
    list's "2310" is a misprint), clan benefits stay optional, Mega-Armoured
    Boarding Parties stays allowed on a hulk, Young Gunz is not given
    automatically. The Rulebook stays v1.10.
- Da Ork Clanz: Zukov's Klaw in a skwadron with another kroozer showed a false red
  "the clan on every ship: none / Goffs" when that kroozer had bought Goffs. Zukov
  is a Goff by itself (Fleets p. 381, no clan row to buy), and the skwadron check
  now counts that, as the Warlord's one-clan check already did. A partner kroozer
  without Goffs is still red: p. 369 has every capital ship of the skwadron take
  and pay for the clan (J242).
- **Friends' fleet links opened one after another (J240, J241).** A link worked
  once, and later links showed the same fleet again: a second link in an open tab
  changed only the address after # and was never read, and the first link's fleet,
  left unsaved on its list, sent every later link of that list quietly into Saved
  fleets. Now every link shows a dialog with the fleet's name, list, points and
  ships, and *Open it*, *Save to Saved fleets* and *Close*; nothing is saved by
  itself; when your fleet on that list is not saved, the choice is *Save mine,
  then open* or *Open over mine*. Each tab keeps its own fleet, so four links in four tabs stay
  four fleets, also after a reload, and Play opened from a tab plays that tab's
  fleet. (J240, live for a few hours on 26.10.2026, saved every linked fleet and
  made the tabs follow each other; the user asked for the dialog and separate tabs
  instead.) `check_links.js` drives this in Chrome with five tabs; `test_save.js`
  checks the same decisions in Node.
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
- **Da Ork Clanz: Blood Axe commandeered escorts go straight into a tiddla**
  (user 29.10.2026). Fleets p. 369: "A Blood Axe tiddla skwadron of at least
  six escorts may include up to three Imperial Navy and/or Chaos escorts from
  any fleet list at their listed cost." The list prints them in a section of
  their own, BLOOD AXE COMMANDEERED ESCORTS, far below the tiddlas, and a card
  from it was a squadron card of two that had to be given the tiddla's letter
  by hand, and the tiddla a letter too. Now:
  - the section is drawn right after the Tiddla skwadron section, with a gloss
    "Imperial Navy and Chaos escorts for a Blood Axe tiddla, up to 3" (user:
    "I did not figure out how to add the IN and Chaos ships");
  - the way in is **Mixed squadron** (user: "it should be in the add mixed
    squadron feature"): while a mixed tiddla is filling, the section's + puts
    its ships into it whatever the Warlord's clan, and the squadron is red in
    the legality panel and on its row when it is not kept ("no Blood Axe
    clan", fewer than six, more than three commandeered);
  - the Tiddla section says so for every Warlord, with a link down; a Warlord
    whose clan is Blood Axes has a help line in his block (where the escorts
    are, and that his ship's Imperial Navy refit is a row of its own);
  - outside filling, the section's top row names the tiddla its + goes into, one of the Warlord
    being bought for when his clan is Blood Axes: "Into tiddla A of Warlord 1 ·
    6 Ork + 1 commandeered · room for 2"; with two or more the player picks
    one there. Without one it says what is missing (no Blood Axe Warlord, no
    tiddla yet), the rows say "needs a Blood Axe tiddla", and + adds a card as
    before;
  - its + puts one ship into that tiddla (a card of one with the tiddla's
    letter, or one more on that class's card; a tiddla card without a letter
    gets one) and its − takes one out;
  - picking another tiddla there ends the filling of a mixed one;
  - in Your fleet the tiddla's row lists them, "9 escorts (6 Ork + 3
    commandeered)".
  The rules, the printed card and Play read the letter as before.
- **Da Ork Clanz: a Warlord's ships show only his clan's row** (user
  29.10.2026: "take the others away from the ships under that clan's boss, they
  only take space"). "A Warlord and his skwadrons may only be from one clan"
  (Fleets p. 369): once his clan is picked (or his skwadrons bought one), the
  other clans' rows are gone from his ships' fleet-list upgrades. A row taken
  all the same stays, so the red check can be put right where it is.
  `check_bloodaxe.js` drives it in Chrome (`npm test`).
- **Da Ork Clanz: the Blood Axe Warlord's Imperial Navy refit is a row of its
  own** (user 29.10.2026, prototype A). Fleets p. 369: "The Warlord's ship may
  take one refit from the Imperial Navy refit table (rolled randomly) for +20
  points." It was only words in the clan's tag, so it could not be bought or
  printed. Now the ship a Blood Axe Warlord is aboard has the row *Imperial
  Navy refit, rolled randomly* (+20) at the top of its fleet-list upgrades;
  under it a box, shut until opened, shows how it is rolled and the 18 results
  with their effects (the full name and page on hover). The roll itself is not
  recorded (user: "no roll function"); the printed card says how to roll it
  and leaves "Rolled: ________" to write in. The legality panel checks it:
  "Warlord 1: Imperial Navy refit: on Terror ship", red under another clan's
  Warlord or on a ship he is not aboard. The refit is not a second clan.
  **Ruling T61** (open interpretation, 29.10.2026): the book prints no table of
  that name; it is read as the Rulebook's refits, "the standard Imperial Navy
  refit table" the Mechanicus also earn refits from (Fleets p. 122): a D6 for
  the kind (1-2 ship, 3-4 engine, 5-6 weapons refit, Rulebook p. 156), then a
  D6 on that table (pp. 158-159). Golden cases
  `clanz-blood-axe-warlord-ship-takes-the-in-refit`,
  `clanz-in-refit-needs-a-blood-axe-warlord`,
  `clanz-in-refit-on-the-warlords-own-ship-only`.
- **Ship info** (user 28.10.2026, prototype C of three): an *i* beside the
  class name on every ship row of the catalogue, on every ship in Your fleet
  and on a mixed squadron's row opens everything about it. On a wide screen
  it is the printed card itself, made and fitted as the print makes it: a ship
  in the fleet with its options, names and squadron, a catalogue row as +
  would add it (its own list when borrowed, an escort at its squadron's
  minimum, the options still open), a mixed squadron its one card, a star
  fort both cards. Below 700 px the card's text would be too small, so the
  popup lays the same details out for the screen (profile, armament with its
  range colours, special rules with their pages, options and upgrades with
  what is taken, damage) and one button, *Printed card*, shows the card. It
  closes with x, Escape or a tap outside; it only shows, so nothing is lost.
  In Compact the *i* leaves the unit open or closed as it was. Checked in a
  browser for all 1,102 ship rows of every list (`check_info.js`, in
  `npm test`).
- **Mixed squadron** (prototype, user 28.10.2026), an addition beside the
  per-class cards, which work as before. In every escort section with two or
  more escort classes (escorts only, user 28.10.2026) and in Da Ork Clanz's
  tiddla section, the section's top row *Mixed squadron +* starts one with the
  next free letter; while it fills, the
  section's + puts one ship of that row into it (a card of that class with the
  letter) and - takes one out. Filling ends with *Done*, when the squadron is
  full, or with a + in another section. In Your fleet two or more cards with one
  letter are one row, "Escort squadron A: 4 escorts, mixed", with its members
  and points; the arrow shows the cards, *Add more* fills it again, *Remove*
  takes the whole squadron. Saves, the rules and Play read only the letters, as
  before. Outside the five lists the rules check a lettered squadron as one:
  "Escort squadron B: 6 ships: 3 Cobra class destroyer + 2 Sword class frigate
  + 1 Firestorm class frigate", red over the list's maximum, and in Armageddon
  red with Space Marine and other vessels together (Fleets p. 41). A lettered
  card does not join other cards by itself; cards without a letter join as
  before, so no saved fleet changes. **A squadron the player made is always
  red when its size is wrong** (user 28.10.2026), in every list and in a Clanz
  tiddla, and the row says why: "Escort squadron A: 2 ships: 1 Escort Carrier
  + 1 Q-Ship - too few, at least 3" (Pirates and Wolf Packs, squadrons of 3-6,
  p. 179). The error is in Legality and on the squadron's own row in Your
  fleet, whose edge turns red, and on a card alone with its letter. A single
  escort with a letter is red too: p. 13's lone escort is a card without one.
  *Copy list* and the roster say "squadron A". **Printed cards** (prototype
  E1): a mixed escort squadron is one card, not one per class. Each class has its own stats row, base row and
  options, weapons and hit-point boxes, each led by the class's two-letter mark
  (Cobra CO, Sword SW) in the card's fleet colours, with its own outline (solid,
  dashed, double, dotted) so the classes stay apart in black and white. A rule
  every class has is printed once without a mark. PTS is the squadron's total
  when every class's price is fixed, otherwise blank for the player to fill
  in. In **Play** escort cards with one letter are one squadron: one Leadership
  rolled for all its cards, one head with each card's ships alive ("Escort squadron A x3 of 4") and the
  surviving Leadership, and victory points for the whole squadron (Rulebook
  p. 123: an escort's points only when the entire squadron is destroyed; a
  disengaged squadron 10 % or 25 % of its total).
- Da Ork Clanz, Mob Rule and Young Gunz as information (Fleets p. 370, user
  28.10.2026; the Leadership stays the player's, RULINGS T40): a tiddla card and
  a mixed tiddla say "Mob rule: +1 Ld while more than five ships" and that on Ld
  5-6 Young Gunz gives one free escort before the game. In Play an escort
  squadron with more than five ships left shows "mob rule: +1 Ld (6 ships)",
  gone when it drops to five, and set-up says "Young Gunz: one free escort"
  beside an escort squadron whose Ld is 5 or 6.
- Your fleet in *Compact* (user 27.10.2026): an arrow beside each unit's name
  (right: closed, down: open) opens or closes it, as the name still does; *Open
  all* / *Close all* beside the Compact button does every unit at once. A
  squadron's points show the count and the price of one in small type, "120 pts
  3 x 40" (and "+ 20" for what the squadron bought on top).
- An upgrade row names its kind where the book names one: *Gubbin*, *More
  Gubbins* and *clan* (Orks), *bio-enhancement* (Tyranids), *Chaos Space Marine
  crew* and *Daemonship* (Chaos), *The Best Money Can Buy* (Rogue Traders);
  ordnance and fleet upgrades say nothing. A required row reads "automatic,
  required by the fleet list" (the Mechanicus refits).
- Maniac Turrets in plain words: the tag "turrets: roll D3 (1-3)" and the text
  "Turrets: roll a D3 (1-3) instead of the ship's printed turret value. Not with
  Extra Turrets." (the book: "The ship's turret value is replaced by D3 turrets",
  Fleets p. 370). The card's stat line already showed Turrets D3.
- Zukov's Klaw shows its clan in the upgrade list: a locked, free row *Clan:
  Goffs (included)*, as a battle barge shows its built-in Mark. The Goffs are
  part of its 210 points ("It is of the Goff Clan", Fleets p. 381), so no clan
  is offered to buy; the clan choice and the clan prices leave the row alone
  (user 27.10.2026).
- Da Ork Clanz (from the same audit): the Warlord block's skwadron menu works on
  tiddlas too - *new tiddla of …* adds a second card of the same escorts at
  three, under that Warlord and with his clan, and *join* / *split into its
  cards* make or undo a mixed tiddla (UX-01). *Copy list* writes the commands:
  each Warlord with his clan, re-rolls, ship and points, then his skwadrons and
  their ships (UX-03). Moving a skwadron to another Warlord keeps a clan benefit
  it had turned off; the Warlord's clan button says it buys the clan for all
  (UX-02).
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
