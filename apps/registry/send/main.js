/* The send page (packages/ui/send.js). In a frame, the builder or Play hands it
   the fleets to send. Opened by itself (a scanned code, Receive), it receives
   and passes the fleets on to the builder as a link. */
import { SEND_CSS, parseCode, receivePanel, sendPanel } from "../../../packages/ui/send.js";

const RELAY = "wss://play-relay.kuldare.com";
const PUBLISHED = "https://bfgtools.kuldare.com/send/";
const local = !/^https:$/.test(location.protocol) || /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
/* wrangler dev (npm run relay:dev) when the page is on this machine */
const relay = /^(localhost|127\.0\.0\.1)$/.test(location.hostname) ? "ws://" + location.hostname + ":8787" : RELAY;
const el = document.getElementById("send");
const style = document.createElement("style"); style.textContent = SEND_CSS; document.head.appendChild(style);

if(window.parent !== window){
  window.addEventListener("message", e => {
    if(e.source !== window.parent || !e.data || e.data.t !== "send") return;
    sendPanel(el, { doc: e.data.doc, file: e.data.file, fileName: e.data.fileName, linkBase: e.data.linkBase,
      relay: relay, codeBase: local ? PUBLISHED : location.origin + location.pathname.replace(/index\.html$/, "") });
  });
  window.parent.postMessage({ t: "send-ready" }, "*");
}else{
  const builder = new URL("../", location.href).href;
  receivePanel(el, { relay: relay, back: builder, code: parseCode(location.hash), done: packed => { location.replace(builder + "#" + packed); } });
}
