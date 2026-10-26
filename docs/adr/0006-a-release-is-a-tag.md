# ADR 0006: A release is a tag

Status: accepted, 2026-10-26

## Context

Each tool is a static site on its own Cloudflare Worker (assets only, no code)
and is mirrored on GitHub Pages. Releases were made from a local script, version
numbers were edited by hand in several places, and caches were broken by bumping
`?v=N` query strings by hand.

## Decision

- Each app has a version in its `package.json`-like manifest (`apps/<app>/app.json`)
  and a `CHANGELOG.md`.
- Tagging `<app>-v<version>` (for example `registry-v1.3.0`) releases that app:
  CI builds it, runs the tests, deploys `dist/<app>` to its Worker with Wrangler,
  and refreshes the GitHub Pages mirror.
- `npm run publish -- <app>` does the same from a developer machine, as a fallback.
- Asset URLs carry a content hash computed at build time, so caches never serve
  stale code and nobody bumps query strings.

## Consequences

- What is live is always a tagged commit.
- Deploying from CI needs a Cloudflare API token stored as a repository secret.
