# ADR 0007: Play's rooms go through a relay of our own

Status: accepted, 2026-10-31

## Context

Gothic Fleet Play can show the opponent's fleet live (apps/play/README.md).
The first version (31.10.2026) had no server: the two phones made a direct
WebRTC link, its handshake carried by two QR codes. In the owner's tests on
two phones and a PC it did not connect once. Phones on one Wi-Fi often
cannot reach each other directly (routers without hairpinning, mDNS host
names that do not resolve), phones on mobile networks need a TURN server,
and an iPhone freezes the tab that waits for the reply code. The two codes
crossing each other were confusing as well.

## Decision

- A small Cloudflare Worker, `services/relay`, with one Durable Object per
  room: the pages of a room connect to it with a WebSocket and it passes
  each message to the other pages. It stores nothing; a room exists while
  someone is in it.
- A room has a four-letter code (no I or O). One player creates it, the
  other types it or scans its QR code (`#room=CODE`).
- It answers pages from the site's own origins (and localhost), at most four
  in a room, 64 kB a message.
- It lives at `play-relay.kuldare.com` (a custom domain in its wrangler.json),
  and Play's Content-Security-Policy allows `connect-src wss://play-relay.kuldare.com`.
- The owner deploys it from their machine: `npm run publish:relay`. It
  changes rarely; the pages are published as before (ADR 0006).

## Consequences

- Play's opponent view needs the network and the relay; the rest of Play
  stays one offline file.
- The game records of the two players pass through Cloudflare (TLS); nothing
  is written down there.
- The free plan's Durable Object and request limits are far above what a
  table of players uses.
