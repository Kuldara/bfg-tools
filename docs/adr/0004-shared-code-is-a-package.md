# ADR 0004: Shared code is a package, not a copy

Status: accepted, 2026-10-26

## Context

Three kinds of code were shared by copying: the Battlezone Generator's terrain
core was pasted into the Scenario Library between marker comments; the BFG Tools
badge was pasted into every app; and Play extracted functions from the Registry
template with regular expressions.

## Decision

Code used by more than one app lives in `packages/<name>/` and is imported:

| Package | Contents | Used by |
|---|---|---|
| `packages/rules` | fleet and unit resolution, legality, points, re-rolls (was `domain.js`) | Registry, Play |
| `packages/battlezone` | terrain generation core | Battlezone Generator, Scenario Library |
| `packages/ui` | BFG Tools badge, saved-fleet format, fleet colours, shared helpers | all apps |

Packages are folders of ES modules with their own tests. They are not published
to npm and have no build step of their own; esbuild resolves them by relative path.

## Consequences

- No marker-comment syncing and no "copy is out of date" checks.
- A change to a package runs every dependent app's tests in CI.
- The rule engines of Boarding and the private simulator are not merged here;
  that is a separate decision.
