# ADR 0002: ES modules in source, one HTML file per app as output

Status: accepted, 2026-10-26

## Context

Each tool is used offline at the gaming table and shared as a single HTML file.
The Registry's source was itself one 7 400-line HTML template whose script was
concatenated with other files by string replacement. That forced the source to be
pure ASCII, made a stray control character reach production once, and made the
phone companion (Play) copy functions out of the template with regular
expressions at build time.

## Decision

- Source is plain JavaScript ES modules and CSS files. No framework, no
  TypeScript, no transpilation beyond bundling.
- `esbuild` (the only npm dependency) bundles each app's entry module. A small
  build script inlines the bundle, CSS, fonts and data into one
  self-contained `index.html` per app.
- Shared code is imported, never copied (see ADR 0004).
- Unit tests import the modules directly with `node --test` (see ADR 0005).

## Consequences

- The published files keep their shape: one HTML file that works offline and
  from `file://`, with the data embedded in `<script id="bfgdata">`.
- Byte-for-byte comparison stops being the proof of a refactor once bundling
  starts; tests and rendered-card comparisons take over.
- Contributors need Node (already required for tests) and `npm install`.
