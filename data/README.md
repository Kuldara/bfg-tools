# Ship data: `bfg_data.json`

Every ship profile and fleet list of *Battlefleet Gothic: Remastered*, read from
the Fleets Book WiP v0.36 and the Rulebook v1.10. The Registry, Play and Boarding
are built from this file, and other projects read it too. This page is the
contract for those readers.

## Where to get it

| | |
|---|---|
| Published | `https://bfgtools.kuldare.com/bfg_data.json` (also in the GitHub Pages mirror at `/registry/bfg_data.json`) |
| Embedded | the Registry's page carries the same JSON in `<script id="bfgdata" type="application/json">` |
| Source | `data/bfg_data.json` in this repository, made by `extractor/build_data.py` |
| Schema | [`schema.json`](schema.json) (JSON Schema 2020-12) |

The published file answers with `Access-Control-Allow-Origin: *`, so a web page
may fetch it. The embedded copy stays for readers that already scrape the page.

## Versioning

`schemaVersion` is `MAJOR.MINOR` (now `1.0`).

- **MINOR** goes up when a field is added. Readers that ignore unknown fields
  need not change.
- **MAJOR** goes up when a *stable* field (below) is removed, renamed or changes
  type or meaning. That is announced in the Registry's changelog before it ships.
- Fields not listed as stable are internal to the apps and may change in any
  release. They are in the file because the apps need them.

A data correction (a points value fixed against the book, a missing option
added) is not a schema change; it shows in `git log data/bfg_data.json`.

## Stable fields

### Top level

| Field | Type | Meaning |
|---|---|---|
| `schemaVersion` | string | this interface's version |
| `src` | string | the books the data was read from |
| `ships` | object | ship profiles by id |
| `lists` | array | fleet lists in book order |

### `ships[id]` — a ship profile

The **id** is the Fleets Book page of the profile, with a letter when one page
holds several (`"52"`, `"472c"`). Ids do not change between releases.

| Field | Type | Meaning |
|---|---|---|
| `pg` | integer | Fleets Book page of the profile; its picture is on this page |
| `fl` | string | the book's fleet heading, upper case: `"IMPERIAL NAVY"` |
| `nm` | string | class name as printed, upper case: `"APOCALYPSE CLASS BATTLESHIP"` |
| `ty` | string | `Battleship`, `Grand Cruiser`, `Cruiser`, `Escort`, `Defence` or `Ground` |
| `bp` | integer or null | base points; null when the profile has no price of its own |
| `hp` | integer | hits (damage points) |
| `sp` `tn` `sh` `ar` `tu` | string | speed, turns, shields, armour, turrets, as printed |
| `tl` | string | the turret column's label in the book (`"TURRETS"`) |
| `aw` | array | armament rows `[name, range or speed, firepower or strength, arc]`, as printed |
| `sr` | string | special rules text, as printed |
| `op` | string | options text, as printed (may be empty) |

### `lists[]` — a fleet list

| Field | Type | Meaning |
|---|---|---|
| `nm` | string | list name: `"Imperial Navy — Gothic Sector"` |
| `pg` | integer | Fleets Book page where the list starts |
| `secs` | array | sections in book order |
| `secs[].t` | string | section heading as printed |
| `secs[].ents` | array | rows of the section |
| `secs[].ents[].l` | string | row label as printed |
| `secs[].ents[].k` | string | `unit` (a ship or defence to buy), `up` (an upgrade), `cmd` (a commander) |
| `secs[].ents[].p` | integer or null | points; null when the row has no fixed price |
| `secs[].ents[].r` | integer, string or null | the ship profile (`ships` key) the row buys |
| `secs[].ents[].src_page` | integer | Fleets Book page of the row |

Everything else (`ol`, `rules`, `race`, the many list-level rule objects) is
internal: it is how the Registry checks legality, and it changes when that
logic changes.

## Text

All strings are the book's text as printed, including typographic characters
(`—`, `°`, `•`). The file itself is ASCII: those characters are written as
`\uXXXX` escapes.

## Licence

The data is Battlefleet Gothic content: its owners are Games Workshop and the
authors of BFG: Remastered. It is here for non-commercial fan use and is not
covered by the repository's MIT licence (see the top-level README).
