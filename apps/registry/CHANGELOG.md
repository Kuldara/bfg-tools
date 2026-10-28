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
  Other lists are unchanged: nothing there counts escort squadrons, so a short
  card still joins a mixed squadron by itself (p. 13).
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
- **Mixed squadron** (prototype, user 28.10.2026), an addition beside the
  per-class cards, which work as before. In the five lists whose rules count
  escort squadrons and in Da Ork Clanz's tiddla section, the section's top row
  *Mixed squadron +* starts one with the next free letter; while it fills, the
  section's + puts one ship of that row into it (a card of that class with the
  letter) and - takes one out. Filling ends with *Done*, when the squadron is
  full, or with a + in another section. In Your fleet two or more cards with one
  letter are one row, "Escort squadron A: 4 escorts, mixed", with its members
  and points; the arrow shows the cards, *Add more* fills it again, *Remove*
  takes the whole squadron. Saves, the rules and Play read only the letters, as
  before. Elsewhere: a squadron card prints "SQUADRON A with ..." over its
  boxes, *Copy list* and the roster say "squadron A". In **Play** escort cards
  with one letter are one squadron: one Leadership rolled for all its cards, one
  head with each card's ships alive ("Escort squadron A x3 of 4") and the
  surviving Leadership, and victory points for the whole squadron (Rulebook
  p. 123: an escort's points only when the entire squadron is destroyed; a
  disengaged squadron 10 % or 25 % of its total).
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
