# ADR 0001: One repository is the source

Status: accepted, 2026-10-26

## Context

Until October 2026 the tools lived in five folders on a Google Drive-synced disk.
Only the Registry had version control. A public GitHub repository held snapshots
of each release, assembled by a script, and cloud sessions started editing that
snapshot repository directly. Two places could change the same code, and three
scripts existed only to detect and reconcile the difference.

## Decision

This repository is the only source for the five public tools. Everything that is
needed to build, test and publish them is here, except third-party documents
(the rulebook PDFs and FAQ exports), which each developer supplies in `books/`.

- Work happens on a clone outside any synced folder. Every change is a commit.
- Releases are built from a commit and tagged (see ADR 0006).
- A backup is a `git bundle` of the whole history plus the built `dist/`,
  copied wherever the owner keeps backups (`npm run backup`). The backup is a
  copy, never a second place to edit.

## Consequences

- No snapshot mirror, no reconciliation scripts, no "which copy is newer".
- `git blame` and `git log` work for every line.
- Private material (the Meta Almanac's raw data, which contains player names)
  stays in a separate private project; only its published site is here.
