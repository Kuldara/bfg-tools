# Save format

How the Registry keeps fleets in the browser and in files. Play reads the same
format. The code is `apps/registry/src/save.js` (writing, loading, the stash),
`packages/ui/saved-fleet.js` (`resolveSaved`, shared with Play) and
`apps/registry/src/saved-fleets.js` (the named library).

(Translated from `docs/history/registry/SAVE_SCHEMA.md`, which also has the
history of schemas 1 and 2.)

## The working save

Key `localStorage["gothic-fleet-registry-v1"]`, one JSON object: the fleet open
on screen and, per list, the fleet last built on it.

```json
{ "schemaVersion": 4, "li": 4, "ln": "Space Marines — Crusade", "limit": 1500,
  "units": [{
    "s": 3, "e": 1, "sn": "BATTLESHIPS", "el": "Battle barge",
    "ref": 104, "hn": "…", "n": 1, "name": "", "note": "", "adj": 0,
    "custom": 450, "members": "", "upsOpen": 1,
    "oi":  { "104:3f2a9c1e": "take" },
    "oqi": { "104:9b7d0e44": 3 },
    "on":  { "104:3f2a9c1e": "May replace its launch bays with" },
    "upn": { "BATTLESHIPS\u0001Battle barge": "take" },
    "lst": "…", "role": "reserve",
    "uid": "u12", "aboard": "u3", "sq": "A", "cmd": "u7"
  }],
  "fleets": [ { "ln": "Chaos — Khorne", "limit": 1200, "units": [ … ] } ]
}
```

| Field | Meaning |
|---|---|
| `ln` / `li` | the fleet list by **name**; the index is only a fallback |
| `sn` / `s`, `el` / `e` | section and row by name, index as fallback |
| `ref` | ship profile id |
| `oi`, `oqi` | ship options by **id** (state, repeat count) |
| `on` | the first 40 characters of each option's text: the fallback when an id no longer matches |
| `upn` | list upgrades: section name + `\u0001` + row label |
| `lst`, `role` | only for a ship borrowed from another list (Fleets p. 14): that list's name, and `reserve` or `ally` |
| `uid`, `aboard`, `sq`, `cmd` | only when used: a unit's handle, the ship a commander rides, a squadron tag, the Warlord of an Ork skwadron |
| `fleets` | the fleets kept for other lists; absent when there are none |

Rules that the format keeps:

- **Names first, indexes as fallback.** A new book version that adds a section or
  an option in the middle would otherwise point a saved index at another row —
  at the right price, silently. That is the same class of bug as a shifted
  section index (AGENTS.md).
- **Option ids come from the data**, not from hand: `<profile id>:` + the first 8
  hex digits of SHA-1 of the option text in lower case, letters and digits only,
  the whole text. `build_data.py` asserts they are unique per ship. If an option's
  text is corrected, its id changes; loading then falls back to `on`, then to the
  index, and says so.
- **Every unit is read on its own list.** A borrowed ship's `s`, `e`, `oi`, `upn`
  are coordinates on the list `lst` names. A list that no longer exists does not
  fall back to the host list: the unit is reported lost.
- **The limit belongs to the fleet.** Each kept fleet carries its own points limit.
- **An empty kept fleet is not written**, so a one-list save has no `fleets`
  field and the same top-level fields as schema 3.
- **The optional unit fields do not raise the schema number**: an older page
  ignores them, and a newer page reads an old save as having none.

### Loading never destroys a save

If anything cannot be restored:

- the original is **not overwritten**; it is copied to `…-backup` (the first
  failure is always kept) and `…-backup-last`,
- the top bar says what could not be restored,
- `save()` refuses to write while that note stands and the fleet is empty,
- a newer `schemaVersion` does not half-open: it is backed up and named.

Loading does not tidy either: contradictory choices are restored as they were,
and the rules engine reports them as issues (`packages/rules/CONTRACT.md`).

`apps/registry/test_save.js` and `fuzz_save.js` (thousands of broken saves) prove
these.

## The named library

Key `localStorage["gothic-fleet-registry-saves-v1"]`; the working save above is
untouched by it.

```json
{ "v": 1,
  "saves": [ { "id": "mgx1k2-0", "name": "Khorne 1190 club", "ln": "Chaos — Khorne",
               "limit": 1200, "units": [ … ], "pts": 1190,
               "saved": "2026-10-19", "from": "link" } ],
  "open": { "Chaos — Khorne": "mgx1k2-0" } }
```

- **Save** writes the open fleet to the save it came from (`open[list]`), or a new
  one; names never collide (*Name (2)*).
- **Unsaved** means the fleet has ships and no save, or differs from its save; the
  dot on the Save button shows it.
- **Open** opens a save on its own list. The fleet being edited there gives way
  without a question only when nothing is lost.
- **Import file, link and QR code** add to the library and never touch the fleet on
  screen. The same fleet is not added twice.

## Files and links

Export, Copy, To phone and a file all carry one document:

```json
{ "app": "Gothic Fleet Registry fleet", "page": "1.2", "schemaVersion": 4,
  "name": "…", "ln": "…", "limit": 1500, "units": [ … ],
  "fleets": [ { "name": "…", "ln": "…", "limit": 1200, "units": [ … ] } ] }
```

The link form packs the same document into the URL fragment (`#fleet=`, deflated
and base64url; `#fleetj=` uncompressed), so it never reaches a server.
`packages/ui/share-link.js` does both directions; Play reads the same documents.
