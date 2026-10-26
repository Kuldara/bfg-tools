# packages/rules

The rules engine of the Registry and Play. Pure functions that
resolve what a player chose against the ship data: a unit's profile, weapons,
options, upgrades, damage model and price (`resolveUnit`), a fleet's legality
checks, totals and facts (`resolveFleet`), and the changes the UI makes
(`transition`, `validateIntent`). No DOM, no storage, no randomness.

The contract is [CONTRACT.md](CONTRACT.md).

## Layout

```
src/legacy.js         ids, the catalog lookups, the adapter to and from the saved unit
src/lending.js        who may borrow which ship from which list (Fleets p. 14-17)
src/upgrades.js       the selection: options and list upgrades, their states and conditions
src/pricing.js        points, the cheapest and the most expensive legal build
src/weapons.js        weapon rows and stat effects of the options taken
src/arms.js           the card's armament summary, range bands, port/starboard pairs
src/crits.js          critical hit tables, crippled, repair and trigger lines
src/special-rules.js  the special weapon and hull rules and which apply to a unit
src/commanders.js     commander rules
src/validation.js     validateIntent, transition
src/resolve-fleet.js  resolveFleet: the members, then every check in the order its rows appear
src/fleet-sections.js  the list's own section rules (the rule kinds) and row limits
src/fleet-purchases.js the Warmaster's Mark, a commander's price, defences, required weapons
src/fleet-reserves.js  reserves and allies: types, races, bans, sources (Fleets pp. 14-16)
src/fleet-specials.js  squadrons and single lists' rules: Demiurg, Rogue Traders, Clanz ...
src/fleet.js          the helpers they share: facts, squadron classes, who is aboard
src/unit.js           resolveUnit: everything a card or a play page shows
src/index.js          the public object DOMAIN, the same keys as the one-file engine
build.js              makes domain.js from src/ (npm run build; --check in npm test)
domain.js             GENERATED, committed: the engine as one UMD file
```

`domain.js` is generated but committed, because three kinds of readers load it
as one file: the apps through esbuild (an import of a CommonJS module), the
Node tests with `require`, and a private battle simulator that reads the file
directly. `extractor/audit_upgrades.py` reads the text of `src/`. Edit `src/`, never
`domain.js`; `npm test` fails when the file is not what `src/` makes.

## Tests

```bash
node packages/rules/test_domain.js -v      # 5 700 assertions: ids, the adapter, migration, purity, every rule family
node packages/rules/check_symmetry.js      # mirrored lists and options give mirrored results
```

Expectations come from the books (`reference/`), never from this code.
