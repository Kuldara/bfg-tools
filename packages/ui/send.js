/* Sending fleets to another device (user 1.11.2026: "cut the share, export and
   all the rest"; "separate from the Play link"). One Send in the builder and in
   Play opens this sheet: a four-letter code and its QR code, Send link for one
   fleet, Save file. The code is a short-lived room on the relay
   (services/relay, /send/CODE, not the /room/CODE of Play's opponent link): the
   receiving page asks, the fleets pass through, nothing is stored there.

   Who may open a socket: only apps/registry/send/ (its own page and its own
   Content-Security-Policy). The builder's page keeps connect-src 'none', so the
   sheet shows that page in a frame and hands it the fleets by postMessage.
   Without the page (the one-file builder, no network) the sheet draws the same
   panel in place, without a code: the fleet's own link as a QR code when it
   fits, and the file. The relay's address is not in this module.

   Received fleets go to the builder as an ordinary #fleet= link, so its link
   dialog and its checks decide what is saved, as for any other link. */
import { readableQr, qrSvg } from "./qr.js";
import { packFleet } from "./share-link.js";

const LETTERS = "ABCDEFGHJKLMNPQRSTUVWXYZ";
/* the relay drops a message over 64 kB */
export const PART_CHARS = 60000;
const CONNECT_MS = 6000, FRAME_MS = 4000;

export function newCode(){
  const a = new Uint8Array(4);
  crypto.getRandomValues(a);
  return [...a].map(b => LETTERS[b % LETTERS.length]).join("");
}
/* a code as typed, or a link with one (.../send/#KRAK); null when it is not one */
export function parseCode(text){
  const m = /^(?:.*#)?\s*([A-Za-z]{4})\s*$/.exec(String(text || ""));
  if(!m) return null;
  const c = m[1].toUpperCase();
  return [...c].every(ch => LETTERS.includes(ch)) ? c : null;
}
export function splitParts(text){
  const out = [];
  for(let i = 0; i < text.length; i += PART_CHARS) out.push(text.slice(i, i + PART_CHARS));
  return out.length ? out : [""];
}
export const isPacked = t => /^fleetj?=[A-Za-z0-9_-]+$/.test(String(t));

const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
export const SEND_CSS = `
.snd{--bg:#fff;--ink:#1c1c1e;--dim:#5c5c60;--line:#c9c9cd;--btn:#efeff1;font:15px/1.4 system-ui,sans-serif;color:var(--ink);background:var(--bg);padding:14px;box-sizing:border-box;text-align:center;max-width:420px;margin:0 auto}
@media (prefers-color-scheme:dark){.snd{--bg:#1b1d20;--ink:#eee;--dim:#a8a8ad;--line:#47494d;--btn:#2c2e32}}
.snd h2{font-size:17px;margin:0 0 8px;overflow-wrap:anywhere}
.snd p{margin:8px 0;color:var(--dim)}
.snd .snd-code{font:700 44px/1.1 ui-monospace,monospace;letter-spacing:.14em;margin:6px 0 8px 0;color:var(--ink)}
.snd .snd-qr{background:#fff;padding:6px;border-radius:8px;width:min(240px,100%);margin:0 auto;box-sizing:border-box}
.snd .snd-qr.big{width:min(340px,100%)}
.snd .snd-qr svg{display:block;width:100%;height:auto}
.snd .snd-st{font-weight:600;color:var(--ink);min-height:21px}
.snd .snd-btns{display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin-top:12px}
.snd button,.snd a.snd-a{min-height:44px;padding:0 16px;border:1px solid var(--line);border-radius:8px;background:var(--btn);color:var(--ink);font:600 15px/1 system-ui,sans-serif;cursor:pointer;display:inline-flex;align-items:center;text-decoration:none}
.snd input{min-height:44px;width:7em;text-align:center;text-transform:uppercase;font:700 24px/1 ui-monospace,monospace;letter-spacing:.14em;border:1px solid var(--line);border-radius:8px;background:var(--bg);color:var(--ink)}`;

function saveFile(file, name){
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([JSON.stringify(file, null, 1)], { type: "application/json" }));
  a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}
async function sendLink(btn, url){
  if(navigator.share){ navigator.share({ title: "Battlefleet Gothic fleet", url: url }).catch(() => {}); return; }
  let ok = false;
  try{ await navigator.clipboard.writeText(url); ok = true; }
  catch(e){
    const t = document.createElement("textarea"); t.value = url; t.style.position = "fixed"; t.style.opacity = "0";
    document.body.appendChild(t); t.select();
    try{ ok = document.execCommand("copy"); }catch(x){}
    t.remove();
  }
  const back = btn.textContent;
  btn.textContent = ok ? "Link copied" : "Copy failed";
  setTimeout(() => { btn.textContent = back; }, 1600);
}

/* The panel. opts: doc, file, fileName, linkBase (where a link opens); relay and
   codeBase with a socket allowed (the send page), neither without. */
export async function sendPanel(el, opts){
  const n = 1 + (opts.doc.fleets || []).length;
  const packed = await packFleet(opts.doc);
  const url = opts.linkBase + "#" + packed;
  const title = n > 1 ? "Send " + n + " fleets" : "Send " + (opts.doc.name || opts.doc.ln);
  const code = opts.relay ? newCode() : "";
  let ws = null, timer = 0, gone = false, sent = false, online = !!opts.relay;

  const draw = status => {
    const fleetQr = online ? "" : readableQr(url);
    const body = online
      ? `<div class="snd-code">${code}</div><div class="snd-qr">${qrSvg(opts.codeBase + "#" + code)}</div>
         <p>Scan it on the other device, or type the code at Saved fleets &rsaquo; Receive.</p>`
      : fleetQr
        ? `<div class="snd-qr big">${fleetQr}</div><p>Scan it on the other device: the fleet is inside the code.</p>`
        : `<p>Too much for one QR code without a connection. Save a file and open it on the other device with Import file.</p>`;
    el.innerHTML = `<div class="snd"><h2>${esc(title)}</h2>${body}
      <p class="snd-st" role="status">${esc(status)}</p>
      <div class="snd-btns">${sent ? `<button type="button" data-snd="again">Send again</button>` : ""}${
        n === 1 ? `<button type="button" data-snd="link">Send link</button>` : ""}<button type="button" data-snd="file">Save file</button></div></div>`;
  };
  el.onclick = e => {
    const b = e.target.closest && e.target.closest("button[data-snd]");
    if(!b) return;
    if(b.dataset.snd === "file") saveFile(opts.file, opts.fileName);
    else if(b.dataset.snd === "link") sendLink(b, url);
    else { sent = false; connect(); }
  };
  const lost = () => {
    if(gone || sent) return;
    online = false;
    draw("No connection to the relay: trying again.");
    clearTimeout(timer); timer = setTimeout(connect, 5000);
  };
  function connect(){
    if(gone || !opts.relay) return;
    clearTimeout(timer);
    let s;
    try{ s = new WebSocket(opts.relay + "/send/" + code); }catch(e){ lost(); return; }
    ws = s;
    const wait = setTimeout(() => { try{ s.close(); }catch(e){} }, CONNECT_MS);
    let ping = 0;
    s.onopen = () => {
      clearTimeout(wait); online = true;
      draw("Waiting for the other device.");
      ping = setInterval(() => { try{ s.send("ping"); }catch(e){} }, 25000);
    };
    s.onmessage = e => {
      let m = null; try{ m = JSON.parse(e.data); }catch(x){}
      if(!m) return;
      if(m.t === "want"){
        draw("Sending.");
        const parts = splitParts(packed);
        parts.forEach((p, i) => s.send(JSON.stringify({ t: "part", i: i, n: parts.length, s: p })));
      }
      if(m.t === "got"){
        sent = true;
        draw(n > 1 ? "Sent " + n + " fleets." : "Sent.");
        s.close(1000);
      }
    };
    s.onclose = () => { clearTimeout(wait); clearInterval(ping); if(s === ws) lost(); };
  }
  draw(online ? "Reaching the relay." : "");
  connect();
  return () => { gone = true; clearTimeout(timer); if(ws){ const s = ws; ws = null; try{ s.close(1000); }catch(e){} } };
}

/* The receiving side (the send page opened by itself). Received fleets open
   the builder (done) with their link. */
export function receivePanel(el, opts){
  const draw = (status, typed) => {
    el.innerHTML = `<div class="snd"><h2>Receive fleets</h2>
      <p>Type the four letters the other device shows.</p>
      <form data-rcv><input id="sndcode" maxlength="4" autocapitalize="characters" autocomplete="off" spellcheck="false" aria-label="The code" value="${esc(typed || "")}">
      <div class="snd-btns"><button type="submit">Receive</button><a class="snd-a" href="${esc(opts.back)}">Back</a></div></form>
      <p class="snd-st" role="status">${esc(status)}</p></div>`;
    const f = el.querySelector("form");
    f.onsubmit = e => {
      e.preventDefault();
      const c = parseCode(el.querySelector("#sndcode").value);
      if(c) go(c); else draw("That is not a code: four letters, no I or O.", el.querySelector("#sndcode").value);
    };
  };
  function go(code){
    draw("Connecting to " + code + ".", code);
    let parts = [], done = false, s;
    try{ s = new WebSocket(opts.relay + "/send/" + code + "?join=1"); }catch(e){ draw("Could not reach the relay.", code); return; }
    const wait = setTimeout(() => { try{ s.close(); }catch(e){} }, CONNECT_MS);
    s.onopen = () => { clearTimeout(wait); };
    s.onmessage = e => {
      let m = null; try{ m = JSON.parse(e.data); }catch(x){}
      if(!m) return;
      if(m.t === "noroom"){ done = true; draw("No device is sending with " + code + ". Check the letters.", code); return; }
      if(m.t === "peers" && m.n >= 2){ parts = []; s.send(JSON.stringify({ t: "want" })); draw("Receiving.", code); }
      if(m.t === "part" && Number.isInteger(m.i) && Number.isInteger(m.n) && m.n > 0 && m.n < 1000 && typeof m.s === "string"){
        parts[m.i] = m.s;
        if(parts.filter(p => p != null).length === m.n){
          const packed = parts.join("");
          if(!isPacked(packed)){ done = true; s.close(); draw("What came was not a fleet.", code); return; }
          done = true;
          s.send(JSON.stringify({ t: "got" }));
          s.close(1000);
          opts.done(packed);
        }
      }
    };
    s.onclose = () => { clearTimeout(wait); if(!done) draw("The connection dropped. Try again.", code); };
  }
  if(opts.code) go(opts.code); else draw("");
}

/* The sheet over the page. It is outside the app's own rendering, so a redraw
   of the app does not lose the code. Only Close or Esc closes it. opts as for
   sendPanel; page: the send page's address, null where there is none. */
export function openSendSheet(opts){
  const old = document.getElementById("sendsheet"); if(old) old.remove();
  const el = document.createElement("div");
  el.id = "sendsheet";
  el.setAttribute("role", "dialog"); el.setAttribute("aria-modal", "true"); el.setAttribute("aria-label", "Send fleets");
  el.style.cssText = "position:fixed;inset:0;z-index:2147483000;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;padding:8px;box-sizing:border-box";
  el.innerHTML = `<style>${SEND_CSS}
#sendsheet .box{background:#fff;border-radius:12px;width:min(440px,100%);max-height:100%;overflow:auto;display:flex;flex-direction:column}
@media (prefers-color-scheme:dark){#sendsheet .box{background:#1b1d20}}
#sendsheet .cl{align-self:flex-end;margin:6px 6px 0;min-height:44px;padding:0 14px;border:1px solid #888;border-radius:8px;background:transparent;color:inherit;font:600 15px/1 system-ui,sans-serif;cursor:pointer}
@media (prefers-color-scheme:dark){#sendsheet .cl{color:#eee}}
#sendsheet iframe{border:0;width:100%;height:560px;max-height:calc(100vh - 80px);display:block}</style>
    <div class="box"><button type="button" class="cl" data-sc>Close</button><div data-sb></div></div>`;
  document.body.appendChild(el);
  const body = el.querySelector("[data-sb]");
  let stop = null, timer = 0, onMsg = null;
  const local = () => { sendPanel(body, opts).then(f => { stop = f; }); };
  const close = () => {
    clearTimeout(timer);
    if(onMsg) window.removeEventListener("message", onMsg);
    document.removeEventListener("keydown", key, true);
    if(stop) stop();
    el.remove();
  };
  const key = e => { if(e.key === "Escape"){ e.preventDefault(); e.stopPropagation(); close(); } };
  document.addEventListener("keydown", key, true);
  el.querySelector("[data-sc]").onclick = close;
  if(!opts.page){ local(); return el; }
  const frame = document.createElement("iframe");
  frame.title = "Send fleets";
  onMsg = e => {
    if(e.source !== frame.contentWindow || !e.data || e.data.t !== "send-ready") return;
    clearTimeout(timer);
    frame.contentWindow.postMessage({ t: "send", doc: opts.doc, file: opts.file, fileName: opts.fileName, linkBase: opts.linkBase }, location.protocol === "file:" ? "*" : location.origin);
  };
  window.addEventListener("message", onMsg);
  /* no page in time (no network, an old cache): the panel without a code */
  timer = setTimeout(() => { window.removeEventListener("message", onMsg); onMsg = null; frame.remove(); local(); }, FRAME_MS);
  frame.src = opts.page;
  body.appendChild(frame);
  return el;
}
