# Gothic Fleet Play

The fleet built in the Registry, on a phone, during the game: hits taken,
criticals, special orders and braces, ordnance, blast markers and the fleet's
re-rolls, with everything the rulebook derives from them (crippled, halved
shields, the Leadership actually rolled against) computed, never typed in.
Live at [bfgtools.kuldare.com/play/](https://bfgtools.kuldare.com/play/Gothic%20Fleet%20Play.html), a
prototype (version in `app.json`).

**Record, do not adjudicate:** nothing here decides whether a shot hits;
the only dice it rolls are asked for on the set-up screen (the Leadership and the
upgrades rolled before the game, RULINGS.md T44), and every result stays the
player's to change. Every rule it applies carries its page in Rulebook v1.11 (the same pages as v1.10). Where the books
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

## The opponent's fleet (optional)

Two players link their pages, before the game or during it, and each sees
the other's ships and what has happened to them, live. The step is on the
set-up screen (and in Menu > **Opponent's fleet** during the game): one
player taps **Create a room** and gets a four-letter code, the other types
it and taps **Join**, or scans the room's QR code. The roster then has two
sides, *My fleet* and the opponent's: swipe sideways, tap a tab, or tap the
tab at the screen's edge. Their side is read-only.

The pages talk through the relay in `services/relay` (docs/adr/0007): a
Cloudflare Worker at `play-relay.kuldare.com` that passes the messages of
a room between its pages and stores nothing. The page remembers its room
(`gothic-fleet-play-room`), so a reload or a phone that slept goes back in
by itself. The first version (31.10.2026) linked the phones directly over
WebRTC with two QR codes; it did not connect once on real phones (routers
without hairpinning, mobile NATs without TURN, an iPhone freezing the tab
that waited for the reply).

What travels is the game record (`G`, which carries the fleet document) and
the tracking switches, whenever they change. The last copy is kept in
`gothic-fleet-play-peer` and shown, marked not live, when the other player
is not in the room. Code: `src/peer.js`. For local testing `npm run
relay:dev` runs the relay on port 8787, and a page on localhost uses it.

On the site it is installable (a manifest and a service worker that fetches the
page from the network first and falls back to the saved copy offline).

## Code

```
index.html        the page; @@include lines for the theme and styles/play.css
styles/play.css
src/              ES modules: storage, helpers, fleet-document, game-state, actions,
                  derived (what the book derives), render, share, peer (the
                  opponent's fleet), events, boot
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
