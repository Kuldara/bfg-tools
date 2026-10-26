# Working in this repository

Read this before the first change. It is short and saves rediscovering the
architecture. The map of the code is [ARCHITECTURE.md](ARCHITECTURE.md); this
file is the rules of work. It is written for people and for coding agents alike.

The tools' user interfaces and printed cards are in English, and so is
everything in this repository: code, comments, documents, commit messages.
Older working notes in Finnish are kept under `docs/history/` and are not
translated.

## 1. Authority

The rules come from three sources, in this order of precedence:

1. **Collected FAQ 2026** of the BFG: Remastered authors (the High Admiralty):
   where it contradicts the books, the FAQ wins. Cite it by the heading of the
   entry ("FAQ 2026, *Power ram*") and the book page it changes.
2. **Fleets Book WiP v0.36** (28 Aug 2025) and **Rulebook v1.10** (7 May 2024).
   The printed page number is the PDF page.
3. A newer book version wins over the FAQ. The apps follow v1.10; do not switch
   to v1.11 without a decision.

The books are not in the repository (see `extractor/books.py` for where your
copies go).

- **Every rule has a page.** No page, no change.
- **Do not infer a rule from the app's own data.** That data is what is being
  checked.
- **When the book contradicts itself, record the contradiction**; do not pick
  one reading silently. (Example: the gunnery example on p. 62 said 7D6 while
  the table seemed to say 9D6. It was recorded, and later it turned out the
  table had been read one column too far left. Recording it made the mistake
  findable.)

## 2. What is source and what is generated

| Source (edit these) | Generated (never edit by hand) |
|---|---|
| `extractor/*.py`, `reference/*.json` | `extractor/profiles_raw.json`, `extractor/lists_raw.json` (from the PDFs) |
| | `data/bfg_data.json` (from `extractor/build_data.py`; committed so its diff is readable) |
| `apps/*/src`, `apps/*/styles`, `apps/*/index.html`, `packages/*` | everything in `dist/` (`npm run build`) |
| `apps/boarding/build_ships.py` | `apps/boarding/src/ships.json` |
| `apps/almanac/site/` is copied in from a private project | |

`extractor/RULES_AUDIT.md` is also generated (`rules_audit.py`) and committed for
its diff.

## 3. How to make a change

```
1. Find the page in the book.
2. Add or update an independent test case that reads its expectation from that
   page (reference/golden_cases.json for the Registry), and see it FAIL.
3. Make the smallest fix in the right layer (section 4).
4. npm test
5. Rebuild generated files only through their generator.
```

Step 2 is not optional: a test that was never red proves nothing.

For anything that changes a printed card, also do a spot check: pick two or
three cards, read from the book everything the card should show, build the card
the app's own way and compare by hand. A green test suite does not prove the
card's rule semantics (in September 2026 a fully green suite still let two spot
checks find 13 problems). Method: `docs/history/registry/PISTOKOE.md`.

## 4. Which layer a fix belongs to

| Symptom | Fix it in |
|---|---|
| a value read wrong from the PDF | `extractor/extract.py`, `extractor/lists.py` |
| a single exception in the book | the curated tables in `extractor/build_data.py` |
| an option does not change the profile | `build_data.py` → `OPT_EFFECTS` |
| a list rule is not enforced | `build_data.py` → `RULE_PICKS` and `reference/NN_*.json` |
| an upgrade row is offered to a ship the book's sentence does not allow | `extractor/upgrades.py` (row conditions; see `condOK` in `packages/rules/domain.js`) |
| how a fleet or a unit is resolved, priced or checked | `packages/rules/src/` (pure functions; `domain.js` is built from it), tested by `packages/rules/test_domain.js` |
| what a card or a page shows | `apps/<app>/src` |
| code two apps share | `packages/ui` (never copy it) |

**Fix the cause, not the case.** Three ships once read `range="– Capacity:"`. The
one-off fix would have cleaned three rows; the real fix (the extractor tells the
column from the middle of the cell, not the left edge of the word) fixed six and
the whole class.

## 5. Don'ts

- **Do not derive a test's expectation from the implementation.** A test that
  reads the data it tests confirms that the code does what it does.
- **Do not silence a red test.** If the check is wrong, fix the check and give
  the book page; do not delete the assertion.
- **Do not mark a failure as a known gap.** `npm test` says WORK LEFT for planned
  gaps and FAIL for breakage; turning one into the other hides a regression.
- **Do not break the one-file distribution.** Each app is one HTML file that
  works offline, from a disk, with nothing to install. Modules in the source are
  fine as long as the build still makes one file.
- **Do not copy code between apps.** Move it to `packages/` and import it.
- **Do not edit `dist/`** or any generated file (section 2).
- **Do not rename the public data fields** (`data/README.md`) without a major
  `schemaVersion` and a changelog entry: other sites read them daily.

## 6. Traps that have already caught someone

**Shell heredocs eat backslashes.** A fix script with regular expressions,
written through a bash heredoc, turned `\b` into a backspace character: the regex
compiled and matched nothing. Write such scripts to a file first.

**UTF-8 on Windows.** In Python always `io.open(path, encoding="utf-8")`, and run
with `PYTHONIOENCODING=utf-8`, or cp1252 breaks on the first dash.

**`open(path, "w")` empties the file at once.** If writing then fails, the
content is gone. Build the text first, write a temporary file, then rename.

**The curated tables match exactly once.** `build_data.py` has some 290 rows of
corrections read from the book (`FIXES`, `RULE_PICKS`, `OPT_EFFECTS`, ...), and
each asserts it matches exactly once, so silent drift stops the build. If it
stops there, do not loosen the assertion: find out why the match disappeared.

**A shifted section index is the most dangerous bug.** Rules refer to a list's
sections by number. Add a section and the numbers move, and a wrong but existing
index shows nowhere: the engine counts an empty section as zero and shows green.
`build_data.py` has a guard that remembers each section's name (`--prove-guard`).

**A ship's rules continue after its profile page.** The extractor reads the page
with the TYPE/HITS heading; the Chaos Space Hulk's rules are on pp. 287-288 and
the Ork Hulk's on 390-391. Always read the pages after a profile up to the next
one. Until the extractor can, such pages go into `SPECIAL_HULL_RULES` by hand.

**Neighbouring lists.** When two fleet lists are next to each other in the
book, check what the pages between them hold. Grey Knights, Eldar Corsairs and
Ork Clanz were all this one bug.

**esbuild prints escaped control characters raw.** The separator in saved-fleet
keys is `"\u0001"`; the build turns raw control characters back into escapes and
the page guards reject them (`tools/lib/kit.js`).

**ES module state.** A module cannot assign another module's variable. State
that more than one module assigns lives on `appState` (each app's
`src/state.js`); do not reintroduce module-level `let`s that other modules set.

**Headless Chrome can hang.** Every Chrome call in the tools has a time limit
(`layout_check.js` retries once).

## 7. Commands

```bash
npm install                 # once: esbuild
npm run build               # dist/ for every app (about a second)
npm run serve -- --watch    # http://localhost:8800, rebuilds on change
npm test                    # everything that needs only the repository
npm run test:quick          # the same without the slow runs
npm run check:books         # the checks against the PDFs (needs books/)
node tools/test.js --list   # every step and its command
```

Single checks, for the Registry:

```bash
node apps/registry/test_golden.js -v      # the cases read from the book, every surface
node packages/rules/test_domain.js -v     # the rules engine without a page
python extractor/audit_effects.py -v      # option effects not modelled yet
python extractor/check_reference.py       # list rules against reference/
node apps/registry/layout_check.js        # printed cards: overflow and text under 4.2 pt
node extractor/spot_check.js --seed N     # a random card next to its book pages (needs books/)
```

## 8. One change at a time

Several people or agents can work in parallel on separate apps or packages. Two
should not change the same module at the same time; integrate one change before
the next. Reading the book, writing reference rows and golden cases, and
reviewing are safe to do in parallel.
