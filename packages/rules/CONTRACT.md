# The rules engine's contract: what a resolved unit is

`domain.js` resolves what the player chose (an *intent*) against the ship data
(the *catalog*) into everything the apps show. This page is the contract. It was
written before the implementation, so that every refactoring would go the same
way instead of each contributor inventing their own.

(Translated from the Finnish original of September 2026,
`docs/history/registry/DOMAIN_CONTRACT.md`; the history sections are condensed.)

## The problem it solves

The same ship used to be resolved in several places, and they disagreed. The
golden-case driver measured it:

```
warsphere-add-2hp-x3   price OK   profile OK   surfaces NO
     SURFACES   hits: resolver=16 fleet view=10
```

The card printed 16 hits and the fleet view showed 10: the fleet view drew the
base `hp`, the card the effective value. With five ideas of a profile, every new
effect was five implementations.

## The contract

```js
DOMAIN.resolveUnit(intent, unitContext, catalog) -> ResolvedUnit
DOMAIN.resolveFleet(fleetIntent, catalog) -> ResolvedFleet
```

**Every surface reads the result. No surface recomputes.** The card, the fleet
view, the roster, Copy list, the editable export, saving and Play all read
`resolveUnit`. If a surface needs something the contract lacks, the contract
grows; the surface does not compute it.

### Input: the canonical intent (not the saved document)

```js
CanonicalUnitIntent = {
  schemaVersion: 2,
  entry: { list, section, label } | null,   // NAMES, not indexes; null = a defence bought outside the list
  ref:   "279",                              // profile id (the Fleets page)
  hull:  "61" | null,                        // the chosen base hull (Venerable battle barge, Fleets p. 102)
  hulls: 1,                                  // hulls in the squadron
  name: "", note: "", adjust: 0, custom: null,
  members: [],                               // names of a squadron's ships
  options:  { [optionId]: { state: "take" | "opt" | "off", qty: 1 } },
  upgrades: { [upgradeId]: "take" | "off" },
  /* optional, for fleets (docs: save schema): uid, aboard, sq, cmd,
     clan (a Da Ork Clanz Warlord's own clan, "Goffs") */
  /* derived, never saved: shared: { [upgradeId]: "Savage gunship" } -
     the row of its skwadron that pays for this taken row (below) */
}
```

A Da Ork Clanz tiddla skwadron's clan and Gubbins are the skwadron's: "The point
cost for clan upgrades for tiddla skwadrons count for the whole skwadron"
(Fleets p. 369, the same for Gubbins p. 370; ruling T60). A mixed tiddla is
several rows with one `sq`, so a unit alone cannot know it.
`shareSkwadronUpgrades(intents, { list, host }, catalog)` takes the fleet's
intents and returns them with every row of such a skwadron taking the
skwadron's rows, and `shared` on every row but the one that pays (the row
that bought it, else the first). `resolveFleet` calls it first; an app that
resolves a fleet's rows one by one (the Registry's cards, Play) calls it on
the fleet before `resolveUnit`. A shared row resolves `state: "take"`,
`cost: 0` and `shared` = the paying row's label. `skwadronMates` gives the
other rows of a row's skwadron (the Registry gives them the player's answer
too), `isSkwadronUpgrade` the rows that are shared.

`optionId` is the page plus a hash of the normalised option text, given in the
data (`ships[id].ol[i].id`, made by `extractor/build_data.py`). `upgradeId` is
list name + section name + row label. Indexes live only in the adapter
(`fromLegacyUnit` / `toLegacyUnit`) and in the migration of old saves.

```js
unitContext = { list, entry, sectionIndex, entryIndex, fleetChoices }
catalog     = { ships, lists }       // data/bfg_data.json
```

`resolveUnit` does not get the whole fleet: a unit does not need the fleet, the
fleet needs its units. A rule that needs both belongs to `resolveFleet`, which
runs after the units.

### Output: the resolved unit

```js
ResolvedUnit = {
  kind:      "ship" | "commander" | "entry",   // "entry": a list option shown as a row
  ref, name, hulls, members,
  entry:     { list, section, label, basePoints } | null,
  source:    { page, faction },
  points:    205,                    // final price with every choice
  maxPoints: 245,                    // if every offered choice were taken
  stats: {
    type: "Defence", hits: 16,       // effective values, not the base profile
    speed: "15 cm", turns: "45°",
    shields: "3",                    // text: also "Holofields", "Shadowfield"
    armour: "5+", turrets: "4",
    turretLabel: "TURRETS",          // "SPORES" for Tyranids; a surface does not guess it
    quadrant: false,                 // values are per quadrant (Fleets p. 501)
  },
  weapons: [ { a: [name, range, strength, arc], i, box, alt, grp, extra, count,
               state: "active" | "offered" | "hidden" } ],
             // count > 1: the same weapon bought several times (Hive Ship side sets);
             // strength is then the sum, or "Special ×2" when the text cannot be summed
  damage: {
    crippledAt: 8,                   // ceil(hits / 2), Rulebook p. 65
    crippled: true,                  // whether there is a crippled band at all
    note: "CRIPPLED: ...",           // hulks and quadrants differ
    critTable: { title, rows, wide, trigger, repair },
  },
  hull:     null | { chosen: "61", choices: ["52", ..., "103"] },
  options:  [ { id, text, cost, state, qty, group, blockedBy, dependsOn } ],
  upgrades: [ { id, label, cost, state, owner, source, shared } ],   // shared: see the intent
  rules:    [ { t, refs, ast, canonical, hull } ],
  stars:    { weapons, options, rules },
  issues:   [ { code, severity: "error" | "warning", path, message, sourcePage } ],
  leadership: { kind: "fixed" | "modifier", value, max } | null,     // commanders
  rerolls:  { included, purchased: [{ id, label, cost, count }], total },  // commanders
  victory:  { points, name, page, text } | null,   // VP value when it is not the price (Fleets p. 486)
}
```

A unit outside any list row (a defence bought from outside the list, like the
Waystation on p. 481) is a valid state: stats and weapons are there, `points`
and `maxPoints` are `null`.

### The fleet

```js
resolveFleet({ list: <list name>, limit, units: [CanonicalUnitIntent] }, catalog) -> {
  list, limit,
  units:   [ResolvedUnit],
  totals:  { points, maxPoints, hulls },
  checks:  [{ ok, t, v, s, warn? }],                 // the legality panel
  facts:   [{ k: "attack" | "opponent" | "vp", t, v, s, warn? }],
  aboard:  [{ unit, ship, choices, chosen, ok, ruled, cite }],   // where commanders ride
  command: [unitIndex -> its Warlord's unitIndex | -1] | null,   // Da Ork Clanz
}
```

Every number in the checks comes from the resolved units, every rule from the
catalog's list. The rule types and their parameters are documented at
`resolveFleet` in `domain.js`. A list rule the extractor does not recognise is
added to `RULE_PICKS` in `extractor/build_data.py` with the book's sentence and
page, and its status in `reference/NN_*.json` is `enforced`. A unit's error
issue is also a fleet check ("Unit issues").

`facts` are computed information, not checks: the attack rating (`L.ar`; when two
conditional rules give different numbers, both are shown), the opponent's free
additions (`L.opp`) and the Demiurg VP values (`L.vp`).

## Rules

1. **One source.** Every surface reads `resolveUnit` / `resolveFleet`.
2. **Presentation may differ, the value may not.** The card may shorten
   `Shadowfield` to `SHADOW` because the cell is narrow; it may not show another
   number.
3. **The engine is pure.** No DOM, no `localStorage`, no side effects. Tests run
   it without a browser.
4. **The engine does not know page numbers as rules.** It applies effects that
   the data records (`mod`, `swp`, `sw`, `aws`, `qty`). The book is interpreted
   once, into `reference/` and the extractor's tables, not into the engine.
5. **No aliasing.** The result shares no mutable array or object with the
   intent, the context or the catalog. A test freezes the inputs (`deepFreeze`),
   mutates the result and proves the catalog did not change.
6. **No silent correction.** `resolveUnit` and `validateIntent` do not change the
   intent. A deliberate change in the UI (an exclusive group) goes through
   `transition(intent, action)`, which returns the new intent and `notices`. An
   invalid intent resolves deterministically and gets an `issues` row.
7. **Projections are pure.** The card, fleet row, roster row and list line
   (`shipCardHTML`, `commanderCardHTML`, `unitHTML`, `rosterRowOf`, `listLineOf`)
   read only the resolved unit, never the open list, the catalog or the page
   state. `test_domain.js` checks their source for it.
8. **Parity with an older version is a regression check, not the truth.** New
   fields get their expectations from the book or from the UI contract.

## Issues, transitions and notices

```js
validateIntent(intent, ctx, catalog) -> Issue[]                    // does not change its input
transition(intent, action, ctx, catalog) -> { intent, notices }    // a deliberate change in the UI
Issue  = { code, severity: "error" | "warning", path, message, sourcePage }
Notice = { code, path, message }
action = { type: "option", id, state } | { type: "quantity", id, qty }
       | { type: "upgrade", id, state } | { type: "hull", ref }
```

Codes: `option.exclusive`, `option.dependency`, `option.swap_conflict`,
`option.unknown_id`, `upgrade.exclusive`, `upgrade.ineligible` (a warning; not
charged), `upgrade.covered` (a warning), `upgrade.unknown_id`, `hull.unknown`,
`ship.unknown`, `entry.unknown`.

`error` means the choices contradict the book; both are charged until the player
fixes it, and the legality panel shows "Unit issues" in red. A loaded or
test-built invalid intent **stays as it is**: only `transition` changes choices,
and every choice it drops is reported as a notice that the fleet view shows
("Adjusted: …").

## Why it was built around the old code, not instead of it

The data is worth keeping: 32 fleet lists, 176 profiles, 738 cards, a dozen
checkers and some 290 corrections read from the book by hand. A rewrite does not
recreate those, it loses them. The resolver was first a facade over the existing
calculators; once every surface read it, the inside could be cleaned without any
surface noticing. Every calculator now lives in `domain.js` as a pure function.
