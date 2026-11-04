import { $ } from "./boot.js";
import { libFile } from "./saved-fleets.js";
import { openSendSheet } from "../../../packages/ui/send.js";
import { PHONE_LINK } from "../../../packages/ui/share-link.js";

/* Where the phone opens the link: this builder (J236, user 25.10.2026: "to
   phone should always open in the fleet builder; you can save from there if
   you want, and go to Play if you want") - this page when
   it is on the web, the published builder when it runs from a disk or from
   localhost (a phone reaches neither), the shared single file too. */
export function phoneBase(){
  const loc = typeof location !== "undefined" ? location : null;
  const web = !!loc && loc.protocol === "https:" && !/^(localhost|127\.0\.0\.1|\[::1\])$/.test(loc.hostname);
  return web ? { url: loc.origin + loc.pathname, remote: false } : { url: PHONE_LINK.builder, remote: true };
}
/* Send: one saved fleet or all of them (packages/ui/send.js). The one-file
   builder has no send page beside it (and no Play button either). */
export const hasSendPage = () => !!$("#play");
export function openSend(key){
  const f = libFile(key);
  if(!f) return;
  openSendSheet({ doc: f.doc, file: f.file, fileName: f.name, linkBase: phoneBase().url, page: hasSendPage() ? "send/index.html" : null });
}
/* Copy answers on the button itself (no toast). */
export async function copyInPlace(btn, text){
  const back = btn.textContent;
  let ok = false;
  try{ await navigator.clipboard.writeText(text); ok = true; }
  catch(e){
    const ta = document.createElement("textarea"); ta.value = text; ta.setAttribute("readonly", "");
    ta.style.position = "fixed"; ta.style.opacity = "0"; document.body.appendChild(ta); ta.select();
    try{ ok = document.execCommand("copy"); }catch(x){}
    document.body.removeChild(ta);
  }
  btn.textContent = ok ? "Copied" : "Copy failed";
  setTimeout(() => { btn.textContent = back; }, 1600);
}
