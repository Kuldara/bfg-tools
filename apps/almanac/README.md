# Meta Almanac

What gets played in Battlefleet Gothic and what wins: fleets, ships and results
from tournament reports and community posts, every record with its source.
Live at [bfgtools.meta.kuldare.com](https://bfgtools.meta.kuldare.com/).

Only the published site is here (`site/`): `index.html`, the link-preview image
and the data downloads (SQLite, XLSX, CSV). The almanac is built in a separate
private project, because its raw sources contain player names; that project
checks the published site for private names before every release.

To update: build the almanac there, copy its site folder over `apps/almanac/site/`,
commit and push, then publish with `npm run publish -- almanac` and refresh the
mirror with the Release workflow (`gh workflow run release.yml --ref main`); see
[ADR 0006](../../docs/adr/0006-a-release-is-a-tag.md).
