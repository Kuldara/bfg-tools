# Definition of Done

> **The Registry is done when a player can build, save, open and print any
> supported fleet, and the points, profiles, weapons and fleet-building rules
> match the books on every screen and every print.**

"Done" does not mean an audit script found every known case. It means that
inside the agreed scope there are no unknown or unclassified rules left. Only
then can the program be trusted.

**After every step the app is still usable and releasable.** A step that would
break a surface is not a step but a wrong split.

(Translated from `docs/history/registry/DEFINITION_OF_DONE.md`, which also
records how each measure first reached zero in September 2026.)

## The measures `npm test` reports

The verdict PASS needs every measure at zero and every measure measured.

| Measure | From | Must be |
|---|---|---|
| `golden_failures` | `test_golden.js`: a case that should pass does not | 0 |
| `golden_gaps` | `test_golden.js`: known gaps, written before their fix | 0 |
| `fleet_golden_failures`, `fleet_golden_gaps` | the same for whole fleets | 0 |
| `surface_disagreements` | `test_golden.js`: two surfaces disagree about one ship | 0 |
| `effect_queue_open` | `extractor/audit_effects.py`: an option promises a change the model does not make | 0 |
| `invalid_acks` | `audit_effects.py`: an acknowledgement without a page or verification | 0 |
| `upgrade_effect_open` | `extractor/audit_upgrades.py`: a list upgrade offered to a ship with no effect or rule text (`reference/upgrades.json`) | 0 |
| `unclassified_rules` | `reference/NN_*.json`: rules still `gap` or `not_shown` | 0 |
| `general_rules_open` | the same for the book's general chapters (reserves, planetary defences) | 0 |
| `print_overflows` | `layout_check.js`: a card whose content does not fit after fitting | 0 |
| `unreadable_print_cases` | `layout_check.js`: a card where a primary text block falls under 4.2 pt | 0 |

A measure that cannot be taken is reported as **not measured**, never as zero. A
zero that was not measured is a lie.

The data is also rebuilt and must come out byte for byte the same
(reproducible build), and the one-file package and the site come from the same
page string by construction (`apps/registry/build.js`).

## 1. Rule coverage

- Every ship, option and commander in the app is handled.
- Every relevant rule is **exactly one** of:
  - `enforced`: the engine checks it, a breach shows
  - `manual`: shown to the player clearly ("Check yourself")
  - `out_of_scope`: left out on purpose, with the reason recorded
- `gap` and `not_shown` are not end states; they are the work queue.
- Every modelled rule and effect has a source page and a verification state
  (`reference/README.md`).
- The Venerable battle barge, the Ork Hulk and the Hive Ship are solved as their
  own concepts, not covered by the general model.

## 2. One computed truth

```
intent + fleet context + rules  →  resolveUnit()  →  ResolvedUnit
     →  fleet view · card · roster · Copy list · save · print · Play
```

The same ship shows the same points, hits, shields, speed, turns, armour,
turrets, weapons with range, firepower and arc, options with their counts, and
special rules everywhere. **The raw base profile is never shown as a computed
result.** Presentation may differ (the card abbreviates); the value may not.
Contract: `packages/rules/CONTRACT.md`.

## 3. Fleet building works

- Required choices are added and checked (`applyRequired`).
- Minimum, maximum, ratio and points restrictions work.
- Variants, replacement weapons and repeated weapon systems work.
- An invalid fleet never shows green.
- The player is told, in words, which rule breaks.

## 4. Saves survive development

- Ships, options and lists have stable identifiers.
- A save has a `schemaVersion`.
- An old supported save is migrated, or refused with a clear message.
- Save then open gives back the same fleet and the same resolved result.
- A change in the order of rows or options does not turn a choice into another.

Format: `save-format.md`.

## 5. Printing is usable

- Cards do not overflow their boxes or get cut.
- Text has a real readability floor.
- Content that is too long is not solved by shrinking it to microscopic size.
- Long option lists (the Hive Ship) are folded or condensed in a controlled way.
- Cards, the fleet roster and commanders are all in the print tests.

**The floor is 4.2 pt** on A4 at 100 %, for primary text. The smallest designed
size on the card is 4.6 pt (the damage box note), so the floor means no primary
text drops below about 90 % of its design size. Primary text: rules
(`.k-sr li`), the option's choice line (`.k-opt .tx > b`), armament rows
(`.k-arm td`), critical headings (`.k-crit b`), the damage note (`.k-note`), the
squadron and member lines. Designed smaller and outside the measure: an option's
description tail (4.45 / 4.1 pt; not printed on a card with 7+ options), the
critical's second line (3.8 pt) and the "or" mark on an armament row (4 pt).

**How it is measured:** `layout_check.js` builds two cards from every list row
(the default, and with every choice plus a name, note, points adjustment and
members) with the app's own `cardHTML()`, fits them in headless Chrome with the
app's own `fitCards()` after the fonts have loaded, and computes per block
design size × fit scale × card scale.

**How the floor was reached:** row heights follow their content (`fitCards`
balances the loadout, armament / special and critical rows so the smallest text
is the same size on each), the option checkbox and the arc rosette no longer set
the row height, a list of 9+ options goes into two columns, a 40-hit hull's
damage box is 58 mm, the rules column takes width from the armament table when
that is measurably shorter, and the longest rule summaries were shortened.
Fitting waits for `document.fonts.ready`: fitting before it measured the
fallback font and cut a line.

## 6. Release artefacts match

- The site, the one-file package and the data file come from one build.
- The generated data matches its sources (reproducible).
- A release is one documented command (a tag; `npm run publish`).
- A clean copy works offline without a development environment.

## 7. Quality gate before a release

- every check green (`npm test`), and `npm run check:books` for a data change
- no open P0 or P1 issues; P2 issues fixed or accepted in writing as known limits
- at least one manual round in a browser: build, save, open, print
- a **manual card spot check** on every round: the source first, the card only
  then; a finding becomes a golden case (`card_contains` / `card_lacks`) before
  its fix
- the documents match the implementation

## 8. The scope is frozen per version

A version does not need every Battlefleet Gothic rule digitised, but what it
supports must be unambiguous. Campaigns, an in-battle rules engine and other
additions belong to later versions and are not started before the conditions
above hold.
