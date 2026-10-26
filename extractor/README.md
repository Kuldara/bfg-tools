# Extractor

Python that turns the rulebooks into `data/bfg_data.json`, and the checks that
compare the data with the books. You need it only for a data change; building and
testing the apps does not.

The PDFs are not in the repository: put your own copies where `books.py` says
(`books/` at the repository root, or `BFG_BOOKS`). Python 3.12 with PyMuPDF
(`pip install pymupdf`).

## The chain

```bash
python extractor/extract.py      # Fleets PDF -> profiles_raw.json  (ship profile tables)
python extractor/lists.py        # Fleets PDF -> lists_raw.json     (fleet list pages)
python extractor/build_data.py   # both + reference/ + the curated tables -> data/bfg_data.json
```

`profiles_raw.json` and `lists_raw.json` are committed, so `build_data.py` runs
without the books; `npm test` runs it and requires the data to come out unchanged.

| File | Does |
|---|---|
| `extract.py` | reads the profile tables: the stat line by pattern, the armament table by column geometry (the wide ARMOUR cell spills into its neighbours) |
| `lists.py` | reads the fleet lists; rows link to profiles through their `(pg. NN)` references |
| `build_data.py` | merges them, applies some 290 corrections read from the book (`FIXES`, `RULE_PICKS`, `OPT_EFFECTS`, `ENTRY_LIMITS`, ...; each asserts it matches exactly once), turns list sentences into machine-checked rules, assigns option ids, classifies section sentences |
| `upgrades.py`, `swaps.py` | list upgrades and weapon swaps |
| `books.py` | where the books are |
| `pdf_text.py` | page text from the PDFs for the checks |

## Checks

Without the books (in `npm test`):

| File | Checks |
|---|---|
| `check_reference.py` | list rules and rows against `reference/NN_*.json` |
| `check_golden_math.py` | the arithmetic of every golden case |
| `coverage.py` | which rows are covered only by their price |
| `audit_effects.py` | options whose text promises a change the data does not model |
| `audit_upgrades.py` | list upgrades offered without an effect or rule text |
| `rules_audit.py` | writes `RULES_AUDIT.md`: the book's composition rules against the app's checks |

With the books (`npm run check:books`):

| File | Checks |
|---|---|
| `check_profiles.py` | stats and weapons in the right columns, against the PDF |
| `audit.py` | the data against the PDF, ship by ship |
| `check_quotes.py` | every sentence the app shows a player is in the books (or the FAQ) |
| `check_pages.py` | every page reference points at a page with that text |
| `crosscheck_bsdata.py` | an independent cross-check against BattleScribe data |
| `spot_check.js`, `sample_rows.py`, `wide_check.py` | a random card next to its book pages, for manual spot checks |

The comments in these files are partly still in Finnish; they are being
translated.
