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

## Amendment, 2026-10-26: publishing from a developer machine

The owner publishes as before, from their own machine, and has not given CI a
Cloudflare token. Until they do:

- The Workers are published with `npm run publish -- <app>` (or `--all`) from
  a machine where Wrangler is logged in. It refuses uncommitted work and a
  checkout behind origin/main, and compares each live page with the build.
- The release workflow skips the Cloudflare step with a notice when the secret
  is missing, and can be started by hand from main to refresh only the GitHub
  Pages mirror. A tag deploys the mirror only once the github-pages environment
  allows the tags.
- So what is live is the commit that was on main when it was published, rather
  than always a tagged commit.
