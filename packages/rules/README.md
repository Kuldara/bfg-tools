# packages/rules

`domain.js`: the rules engine of the Registry and Play. Pure functions that
resolve what a player chose against the ship data: a unit's profile, weapons,
options, upgrades, damage model and price (`resolveUnit`), a fleet's legality
checks, totals and facts (`resolveFleet`), and the changes the UI makes
(`transition`, `validateIntent`). No DOM, no storage, no randomness.

The contract is [CONTRACT.md](CONTRACT.md).

It is a UMD module (`module.exports` and a browser global) rather than an ES
module, because three kinds of readers load it: the apps through esbuild, the
Node tests with `require`, and a private battle simulator that reads the file
directly. `extractor/audit_upgrades.py` also reads its text.

## Tests

```bash
node packages/rules/test_domain.js -v      # 5 700 assertions: ids, the adapter, migration, purity, every rule family
node packages/rules/check_symmetry.js      # mirrored lists and options give mirrored results
```

Expectations come from the books (`reference/`), never from this code.
