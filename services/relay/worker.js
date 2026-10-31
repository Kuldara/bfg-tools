/* Gothic Fleet Play's relay: two players' pages in one room (apps/play/src/peer.js).

   GET /room/<CODE> with an Upgrade: websocket header joins the room CODE
   (four letters). Whatever a page sends goes to the other pages in the room,
   as it is; the relay itself only adds who is there ({"t":"peers","n":N}).
   Nothing is stored: a room lives in one Durable Object's memory while
   someone is in it and is gone when the last page leaves. A page that comes
   back (a reload, a phone that slept) asks the other side for its state
   again, so nothing needs keeping here.

   Why a relay (user 31.10.2026, after testing the direct WebRTC link on two
   phones and a PC: "it never worked once"): phones on one Wi-Fi often cannot
   reach each other directly (routers without hairpinning, no mDNS), and
   mobile networks need a TURN server. A WebSocket through Cloudflare works on
   every network.

   Limits: four pages in a room, 64 kB a message, pages only from the
   origins in ORIGINS (wrangler.json vars). Deploy: npm run publish:relay. */

const CODE = /^[A-HJ-NP-Z]{4}$/;
const MAX_PAGES = 4, MAX_BYTES = 64 * 1024;

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (url.pathname === "/" || url.pathname === "/health") return new Response("Gothic Fleet Play relay\n", { headers: { "Content-Type": "text/plain" } });
    const m = /^\/room\/([A-Za-z]{4})$/.exec(url.pathname);
    if (!m) return new Response("not found\n", { status: 404 });
    const code = m[1].toUpperCase();
    if (!CODE.test(code)) return new Response("bad room code\n", { status: 400 });
    if (req.headers.get("Upgrade") !== "websocket") return new Response("websocket expected\n", { status: 426 });
    const origin = req.headers.get("Origin") || "";
    const allowed = String(env.ORIGINS || "").split(/\s+/).filter(Boolean);
    /* a page opened from a disk sends "null" (or nothing): the one-file
       distribution must work there too */
    const local = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
    if (origin && origin !== "null" && !local && !allowed.includes(origin)) return new Response("origin not allowed\n", { status: 403 });
    return env.ROOMS.get(env.ROOMS.idFromName(code)).fetch(req);
  }
};

export class Room {
  constructor(state) { this.state = state; }
  async fetch(req) {
    const pages = this.state.getWebSockets();
    if (pages.length >= MAX_PAGES) return new Response("the room is full\n", { status: 409 });
    const pair = new WebSocketPair();
    this.state.acceptWebSocket(pair[1]);
    this.peers();
    return new Response(null, { status: 101, webSocket: pair[0] });
  }
  peers(gone) {
    const all = this.state.getWebSockets().filter(w => w !== gone);
    for (const ws of all) { try { ws.send(JSON.stringify({ t: "peers", n: all.length })); } catch (e) { /* gone */ } }
  }
  async webSocketMessage(ws, msg) {
    if (typeof msg !== "string" || msg.length > MAX_BYTES) return;
    if (msg === "ping") { try { ws.send("pong"); } catch (e) {} return; }
    for (const other of this.state.getWebSockets()) {
      if (other !== ws) { try { other.send(msg); } catch (e) { /* gone */ } }
    }
  }
  async webSocketClose(ws) { try { ws.close(1000, "bye"); } catch (e) {} this.peers(ws); }
  async webSocketError(ws) { this.peers(ws); }
}
