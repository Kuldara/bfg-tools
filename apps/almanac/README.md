# Meta Almanac

What gets played in Battlefleet Gothic and what wins: fleets, ships and results
from tournament reports and community posts, every record with its source.
Live at [bfgtools.meta.kuldare.com](https://bfgtools.meta.kuldare.com/).

Only the published page is here (`site/`): `index.html`, the link-preview image
and `_headers`. The almanac is built in a separate private project, because its
raw sources contain player names; that project checks the published site for
private names before every release.

The data downloads the page offers (SQLite, XLSX, CSV; 5.8 MB) are not in the
repository: the build (`build.js`) copies them from the almanac project's folder
(`BFG_ALMANAC_DATA`, or the owner's default path) and, where neither exists, as
in CI or a fork, downloads them from the live site so the mirror has them too.

To update: build the almanac there, copy its `index.html`, `og.png` and `_headers`
over `apps/almanac/site/` (not `data/`), commit and push, then publish with
`npm run publish -- almanac` and refresh the mirror with the Release workflow
(`gh workflow run release.yml --ref main`); see
[ADR 0006](../../docs/adr/0006-a-release-is-a-tag.md).
