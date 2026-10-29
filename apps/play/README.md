# Gothic Fleet Play

The fleet built in the Registry, on a phone, during the game: hits taken,
criticals, special orders and braces, ordnance, blast markers and the fleet's
re-rolls, with everything the rulebook derives from them (crippled, halved
shields, the Leadership actually rolled against) computed, never typed in.
Live at [bfgtools.kuldare.com/play/](https://bfgtools.kuldare.com/play/Gothic%20Fleet%20Play.html), a
prototype (version in `app.json`).

**Record, do not adjudicate:** nothing here rolls a die or decides whether a shot
hits. Every rule it applies carries its page in Rulebook v1.11 (the same pages as v1.10). Where the books
are unclear or silent the page makes a choice, and the choices are listed in
[RULINGS.md](RULINGS.md) (the code cites them as T1-T43).

## How it gets a fleet

- On the same site as the Registry it reads the builder's saves directly
  (`gothic-fleet-registry-v1`), and never writes them.
- From another device: the Registry's **to phone** (a link or a QR code), a fleet
  file (**Open a fleet file**) or pasted text. Those go into Play's own list,
  `gothic-fleet-play-linked`.
- The game state is kept in `gothic-fleet-play-v1`, bound to a fingerprint of the
  roster, so a changed fleet does not inherit another fleet's damage.

On the site it is installable (a manifest and a service worker that fetches the
page from the network first and falls back to the saved copy offline).

## Code

```
index.html        the page; @@include lines for the theme and styles/play.css
styles/play.css
src/              ES modules: storage, helpers, fleet-document, game-state, actions,
                  derived (what the book derives), render, share, events, boot
rules.js          the rules layer: pure functions over the game state, every rule
                  with its page; UMD, tested by test_play.js
build.js          -> dist/registry/play/ (with the manifest, service worker, icons)
```

It imports the rules engine (`packages/rules`) and the Registry's shared code
(`packages/ui`: the ship data, card formatting, saved fleets, the share link, the
QR code), so a card on the phone shows exactly what the printed card shows.

## Tests

```bash
node apps/play/test_play.js -v       # rules.js against the book, then the smoke test
node apps/play/test_play.js --rules  # the rules layer only
node apps/play/smoke_play.js -v      # the built page in Node's vm: every screen and card renders clean
```

The input meter (`metrics/measure.js`, tape from `metrics/make_tape.js`) replays a recorded game on the real page in Chrome
at phone size and counts taps and swipes per game turn. It was used to cut the
inputs per turn by a quarter to a third in October 2026; its notes and the design
decisions behind the page are in Finnish in `docs/history/registry/play/`.
