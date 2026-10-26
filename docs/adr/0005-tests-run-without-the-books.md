# ADR 0005: Tests run without the books

Status: accepted, 2026-10-26

## Context

The Registry's acceptance script ran about 25 checks in one go. Some of them
re-read the rulebook PDFs, some need Chrome, and the rest need only the committed
data. Nobody outside could tell which was which, and the suite had never been run
from a fresh clone.

## Decision

Two tiers:

1. **`npm test`** runs everything that needs only the repository: unit tests
   (`node --test`), golden cases, save-format fuzzing, data schema validation,
   and the builds themselves. This is what CI runs on every push.
2. **`npm run check:books`** runs the extractor and the checks that compare the
   data and the quoted text against the books. It needs `books/` (see
   `extractor/books.py`) and is run locally before committing a data change.

Browser checks (layout, card printing) run headless Chrome and are part of tier 1
where Chrome is available, which includes the GitHub Actions Ubuntu runner.

## Consequences

- A fresh clone can prove the code works.
- A data change still has to be proven against the books by someone who has them.
