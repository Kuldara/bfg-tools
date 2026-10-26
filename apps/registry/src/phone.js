import { $ } from "./boot.js";
import { libDocument } from "./saved-fleets.js";
import { appState } from "./state.js";
import { renderTop } from "./view.js";
import { esc } from "../../../packages/ui/format.js";
import { qrSvg } from "../../../packages/ui/qr.js";
import { PHONE_LINK, packFleet } from "../../../packages/ui/share-link.js";

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
/* The phone panel of the saved fleets: under the fleet whose To phone was
   tapped (or under All to phone), a QR code of the link, the link itself,
   Copy link and Share. A second tap on the same button closes it. */
appState.PHONE = { key: null };
export async function openPhone(key){
  if(appState.PHONE.key === key){ appState.PHONE = { key: null }; renderTop(); return; }
  appState.PHONE = { key: key, url: "", svg: "", err: "", remote: false, n: 0 };
  renderTop();
  const mine = appState.PHONE;
  try{
    const doc = libDocument(key);
    if(!doc) throw new Error("There is no fleet to send.");
    const base = phoneBase();
    mine.url = base.url + "#" + await packFleet(doc);
    mine.remote = base.remote;
    mine.n = 1 + ((doc.fleets || []).length);
    try{ mine.svg = qrSvg(mine.url); }
    catch(e){ mine.err = mine.n + " fleets are too long a link for one QR code (" + mine.url.length + " characters). Copy or share the link instead - a phone opens it all the same - or send the fleets one by one."; }
  }catch(e){ mine.err = String(e && e.message || e); }
  if(appState.PHONE === mine) renderTop();
}
export function phonePanelHTML(){
  const p = appState.PHONE, all = p.key === "all";
  const share = typeof navigator !== "undefined" && !!navigator.share;
  return `<div class="phonebox">${p.err ? `<p class="perr">${esc(p.err)}</p>` : ""}${
    p.svg ? `<div class="qr${all && p.n > 1 ? " big" : ""}" data-qrfull title="Full screen">${p.svg}</div>` : p.err ? "" : `<p>Making the code&hellip;</p>`}
    <p>Scan it with the phone's camera - this screen can be a phone's too: the fleet builder opens ${all && p.n > 1 ? "with all " + p.n + " fleets in its Saved fleets" : "with the fleet on screen"}${
      p.remote ? " - on the published page, bfgtools.kuldare.com" : ""}. Save keeps it there, Play plays it. The fleet is inside the link; nothing is uploaded anywhere.</p>
    <input class="plink" readonly value="${esc(p.url || "")}" aria-label="The link" onfocus="this.select()">
    <div class="pbtns"><button class="go" data-qrfull${p.svg ? "" : " disabled"}>Full screen</button><button class="go" data-copylink${p.url ? "" : " disabled"}>Copy link</button>${
      share ? `<button class="go" data-sharelink${p.url ? "" : " disabled"}>Share</button>` : ""}</div></div>`;
}
/* Copy answers on the button itself, as Copy list does (no toast). When
   the browser will not write to the clipboard (no permission, an old
   browser), the text opens selected under the button's row instead, for
   Ctrl+C or a long press - a copy that only says it failed leaves the
   player with nothing. */
appState.COPYBOX = null;
export async function copyInPlace(btn, text, key){
  const back = btn.textContent;
  let ok = false;
  try{ await navigator.clipboard.writeText(text); ok = true; }
  catch(e){
    const ta = document.createElement("textarea"); ta.value = text; ta.setAttribute("readonly", "");
    ta.style.position = "fixed"; ta.style.opacity = "0"; document.body.appendChild(ta); ta.select();
    try{ ok = document.execCommand("copy"); }catch(x){}
    document.body.removeChild(ta);
  }
  if(ok){
    btn.textContent = "Copied";
    setTimeout(() => { btn.textContent = back; }, 1600);
    return;
  }
  if(key == null) return;
  appState.COPYBOX = { key: key, text: text };
  renderTop();
  const box = $("#copybox"); if(box && box.select){ box.focus(); box.select(); }
}
export function copyBoxHTML(){
  return `<div class="phonebox"><p>The browser would not copy by itself: the text is selected below - press Ctrl+C, or long-press it and Copy.</p>
    <textarea id="copybox" class="plink" rows="5" readonly onfocus="this.select()">${esc(appState.COPYBOX.text)}</textarea>
    <div class="pbtns"><button class="go" data-copyclose>Done</button></div></div>`;
}

