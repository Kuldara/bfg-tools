# What the books say: `reference/`

This folder is the project's memory of **what the books say**, kept apart from
what the apps do. Every row was read from the PDF and written here on purpose;
nothing here is generated. Without it every round re-interprets the same rules,
and each time differently.

Why it matters: the data comes from an extractor, and an extractor can change
silently. Without a fixed point of comparison a regression shows only when a
player hits it. And the audit work would evaporate as soon as it was done; here
it stays.

**Do not start a second source of rule truth next to this one.** Two parallel
truths drift apart by the third round and nobody knows which wins. Extend this.

(Translated from `docs/history/registry/RULES_TRUTH.md` and the folder's old
`LUEMINUT.md`.)

## Files

| File | What | Checked by |
|---|---|---|
| `NN_<list>.json` | one fleet list's rules and rows | `extractor/check_reference.py` |
| `98_planetary_defences.json`, `99_general_reserves.json` | the book's general chapters (`"scope": "general"`): planetary defences, reserves | the same |
| `golden_cases.json` | expected results per unit, run against every surface | `apps/registry/test_golden.js` |
| `golden_fleet_cases.json` | expected results per fleet | the same |
| `options.json` (+ `options.schema.json`) | ship options' effects, acknowledged by page | `extractor/audit_effects.py` |
| `upgrades.json` | list upgrades' effects or rule texts | `extractor/audit_upgrades.py` |
| `commanders.json`, `commander_rerolls.json` | commanders: leadership and re-rolls | `packages/rules/test_domain.js` |
| `check_yourself.json` | every section sentence classified into the "Check yourself" groups | `build_data.py`, `check_reference.py` |

The file name pattern matters: `check_reference.py` reads only `NN_*.json`, so
other truths can live here with their own schemas.

## 1. List rules: `NN_*.json`

32 / 32 fleet lists are done: about 490 rules and 690 rows, zero findings.

```json
{
  "list":       "exactly the name in data/bfg_data.json",
  "book_page":  97,
  "read_pages": [97, 98],
  "read_on":    "2026-09-07",
  "rules":      [ { "key": "0-3 Battle Barges", "text": "0-3 Battle Barges", "page": 97,
                    "status": "enforced", "kind": "section_count", "min": 0, "max": 3 } ],
  "entries":    [ { "name": "...", "points": 0, "page": 0, "sec": "...", "mx": "0-1", "grp": true } ],
  "notes":      [ "observations that cannot be coded as rules" ]
}
```

A rule's **status** says what is expected of the app:

| Status | Meaning |
|---|---|
| `enforced` | the engine checks it; a breach shows red |
| `manual` | it is enough that the player sees the rule |
| `gap` | **should be enforced and is not**: the work queue |
| `not_shown` | in the book, not shown by the app: a decision not yet made |
| `out_of_scope` | left out on purpose with a reason (narrative, depends on another list or profile, a structure the app does not model) |

`gap` is deliberately not `manual`: it is a to-do list, not an accepted state,
and it cannot be forgotten because the checker lists it.

A rule may carry its `kind` and parameters (`min`/`max`, `allow`/`per`,
`points`/`over`, `each`/`per`); for `enforced` rules they are checked against the
engine's rule. `enforced` usually means the rule is in the engine's rule set (the
checker finds it by key). It can also be enforced **by structure**: the Venerable
battle barge's hull choice is enforced by the row offering only valid hulls. Then
the rule has `"enforced_by": "hull_choice"` (or `entry_max` = the row's `mx`,
`rule_field` = a field of another rule, `structure`), and the checker verifies the
mechanism in the built data: "enforced" must not be just a word.

Row fields: `sec` limits the match to one section (the same name and price can
appear in several), `mx` a per-row limit (`0-1` in front of the row in the book),
`grp` membership of an exclusive group, `page` the profile page (compared with
the app's corrected reference).

`check_reference.py` reports: an `enforced` rule no longer enforced or with
changed parameters (**regression**), a `gap` rule that is now enforced (update
the reference), a `manual` rule whose text is no longer shown (content lost), a
row whose name or price no longer matches (the extractor changed). It exits
non-zero on any finding.

## 2. Golden cases: `golden_cases.json`

The expectation is **read from the book**, not from the app. Every case has a
page and a `why` that says where the number comes from.

```json
{ "id": "mars-third-turret",
  "page": 61,
  "ship": "61",
  "list": "Imperial Navy — Gothic Sector",
  "select": [{ "option": "third turret" }],
  "expect": { "points": 280, "turrets": "3" },
  "why": "Base 270 + 10. 'May purchase a third turret for an additional +10 points.' Base 2 turrets." }
```

- `ship`: the profile id. The driver finds the ship on the list's rows itself; a
  ship on no row (the Waystation, p. 481) gets the profile checks only, and the
  report says so.
- `list`: the fleet list; the unit is created with `addUnit()` as in the app, with
  its required upgrades.
- `select`: choices by the option's **text**, not its index (an index moves when
  the book changes; the text also documents the intent). `qty` for repeatable ones.
- `expect`: `points`, `hits`, `shields`, `turrets`, `weapon_rows`,
  `weapon: {match, range, fp, arc}`, `card_contains`, `card_lacks`,
  `exclusive_group_blocks`, ...
- `status: "gap"` with a `task`: a known gap, written **before** its fix; it is
  red until the work is done. **A gap case that passes is reported too**, so its
  status gets updated; otherwise gaps become a quiet quarantine for
  uncomfortable tests.

The driver checks every case against five surfaces (price, resolver, card, fleet
view, save round trip) and reports their disagreement as a class of its own. It
is the only way to prevent the card saying 16 hits and the fleet view 10.

Coverage means every **mechanism**, not every ship: each effect type (`mod`,
`swp`, `sw`, `aws`, `qty`, `add`), removing an effect when the choice is undone,
unusual damage models (space hulk, quadrants), repeatable choices, dependencies
and exclusive groups, list-specific required changes, the base hull choice, save
migrations.

## 3. Option effects: `options.json`

`audit_effects.py` lists options whose text promises a profile change but have
no structured effect. The tool **does not decide the rule**: a person or an agent
reads the page and records the decision:

```json
{ "options": [
  { "ship": "MARS CLASS BATTLECRUISER",
    "text": "May purchase a third turret for an additional +10 points.",
    "page": 61,
    "effect": { "mod": { "tu": 1 } },
    "why": "The book: a third turret, base 2. Implemented in OPT_EFFECTS.",
    "verified": true }
] }
```

An acknowledged row leaves the queue; an acknowledgement without a page is not
accepted. The effect itself is implemented in `OPT_EFFECTS` in
`extractor/build_data.py`, the only place an effect may come from. Never infer an
effect from the text at run time.

## 4. Levels of rule knowledge

```
unreviewed        nobody has read the page
extracted         extracted automatically, not checked
source-verified   a person has read the page and recorded it
implemented       the engine applies it
golden-tested     an independent case proves it
```

The `status` in `NN_*.json` covers levels 3-4 for list rules, `golden_cases.json`
level 5, `options.json` levels 3-5 for ship options. Readiness is measured by
these, not by the number of green tests: a green test that reads the
implementation it tests is not evidence.
