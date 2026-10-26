# packages/ui

Code and assets more than one app uses. Import it; never copy it.

| File | What | Used by |
|---|---|---|
| `catalog.js` | `DATA`, `SHIPS`, `LISTS` from the page's `<script id="bfgdata">` | Registry, Play |
| `format.js` | faction colours, the card's short forms (armour, range, shields), the arc glyph, HTML escaping, point labels, the list line | Registry, Play |
| `saved-fleet.js` | `resolveSaved`: a saved fleet document back to units (names first, indexes as fallback) | Registry, Play |
| `share-link.js` | a fleet as a link (`#fleet=`, deflated base64url) and back | Registry, Play |
| `qr.js` | a QR code encoder (no dependency) and the full-screen QR layer | Registry, Play |
| `theme.css` | colour tokens for light, system dark and forced dark | Registry, Play |
| `fonts.css` | Archivo Narrow and IBM Plex as data URIs, so pages fetch nothing (`make_fonts.py` makes it) | Registry, Play |
| `tools-badge.html` | the BFG Tools menu that links the tools to each other; the build fills in `__HERE__` | every app |
