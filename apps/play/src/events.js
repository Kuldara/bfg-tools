import { appState } from "./state.js";
import { $ } from "./helpers.js";
import { fleetsIn, parseDoc, resolveFleet } from "./fleet-document.js";
import { loadPlay, newGame, resumeGame, save } from "./game-state.js";
import { act } from "./actions.js";
import { render, tapSel } from "./render.js";
import { builderFleets, copyText, forgetLinked, linkedFleets, phoneLink, saveFleetFile, shareText, takeFleetText } from "./share.js";
import { qrFull } from "../../../packages/ui/qr.js";
import { peerAct } from "./peer.js";

/* ============================================================== EVENTS ===== */
document.addEventListener("touchstart", () => {}, { passive: true });   /* :active on iOS */
document.addEventListener("click", ev => {
  const el = ev.target.closest("[data-act]");
  if(!el || el.disabled) return;
  /* a new screen just came up under the finger (user 19.10.2026: a second
     tap on "nothing happened" landed on the next screen and picked an Ld):
     taps in the first moments after a screen change are not taken */
  if(Date.now() < appState.V.guardUntil){ ev.preventDefault(); return; }
  const name = el.getAttribute("data-act");
  /* The tapped control stays where the finger is (user 30.9.2026: the screen
     must not move). render() finds the same control again and shifts the
     scroll by however far it moved - a chip line or a band appearing above
     it no longer pushes it away. */
  const tr = el.getBoundingClientRect();
  appState.TAP = { sel: tapSel(el), top: tr.top + tr.height / 2 };
  /* a tap inside the menu box is not a tap on the backdrop */
  if((name === "menu" || name === "endph" || name === "peerpanel") && el.classList.contains("menu") && ev.target.closest(".box")) return;
  /* the opponent's fleet is to look at: its cards take no taps */
  if(el.closest(".peerview")) return;
  if(peerAct(name, el)) return;
  const i = el.hasAttribute("data-i") ? parseInt(el.getAttribute("data-i"), 10) : null;
  let arg = el.hasAttribute("data-arg") ? el.getAttribute("data-arg") : undefined;
  if(arg != null && /^-?\d+$/.test(arg)) arg = parseInt(arg, 10);
  if(name === "resume"){ const g = loadPlay(); if(g && resumeGame(g)){ appState.G.started = true; appState.V.screen = "roster"; } else { appState.V.loadErr = "The saved game could not be resumed against this roster."; } render(); return; }
  if(name === "newfrom"){
    const f = builderFleets()[arg]; if(!f) return;
    const res = resolveFleet(f); if(res.error) return;
    if(loadPlay() && !confirm("A game is in progress. Start a new one and forget its record?")) return;
    newGame(res); appState.V.screen = "setup"; save(); render(); return;
  }
  /* a fleet that came by a link or a file (the page's own list) */
  if(name === "linked"){
    const f = linkedFleets()[arg]; if(!f) return;
    const res = resolveFleet(f.doc); if(res.error){ appState.V.loadErr = res.error; render(); return; }
    if(loadPlay() && !confirm("A game is in progress. Start a new one and forget its record?")) return;
    res.src = "link"; newGame(res); appState.V.screen = "setup"; save(); render(); return;
  }
  if(name === "unlink"){ forgetLinked(arg); render(); return; }
  /* the QR code and the link for a builder fleet: open under its button */
  if(name === "phone"){ appState.V.phone = appState.V.phone === arg ? null : arg; appState.V.copied = ""; render(); if(appState.V.phone != null) phoneLink(arg); return; }
  if(name === "savefile"){ saveFleetFile(arg); return; }
  if(name === "qrfull"){ if(appState.V.phoneSvg) qrFull(appState.V.phoneSvg); return; }
  if(name === "copylink"){ copyText(appState.V.phoneUrl || "", "link"); return; }
  if(name === "sharelink"){ shareText("Gothic Fleet Play", appState.V.phoneUrl || ""); return; }
  if(name === "pickfile"){ const f = $("#fleetfile"); if(f){ f.value = ""; f.click(); } return; }
  if(name === "paste"){
    const p = parseDoc(($("#paste") && $("#paste").value) || "");
    if(p.error){ appState.V.loadErr = p.error; render(); return; }
    const fs = fleetsIn(p.o); if(!fs.length){ appState.V.loadErr = "The document has no ships in it."; render(); return; }
    const res = resolveFleet(fs[0]); if(res.error){ appState.V.loadErr = res.error; render(); return; }
    appState.V.loadErr = ""; res.src = "paste"; newGame(res); appState.V.screen = "setup"; save(); render(); return;
  }
  act(name, i, arg);
});
/* A fleet file (the builder's Export file, or any fleet document): it goes
   on the page's own list of fleets, the same as a link. */
document.addEventListener("change", ev => {
  const inp = ev.target;
  if(!inp || inp.id !== "fleetfile" || !inp.files || !inp.files[0]) return;
  const rd = new FileReader();
  rd.onload = () => { takeFleetText(String(rd.result || ""), "file"); };
  rd.onerror = () => { appState.V.loadErr = "The file could not be read."; render(); };
  rd.readAsText(inp.files[0]);
});
document.addEventListener("change", ev => {
  const el = ev.target.closest("[data-sel]");
  if(!el) return;
  if(el.getAttribute("data-sel") === "flag") act("flag", null, parseInt(el.value, 10));
  if(el.getAttribute("data-sel") === "on") act("on", parseInt(el.getAttribute("data-i"), 10), parseInt(el.value, 10));
  /* a pre-game upgrade chosen by hand (T44) */
  if(el.getAttribute("data-sel") === "pre") act("pre", parseInt(el.getAttribute("data-i"), 10), { key: el.getAttribute("data-key"), v: el.value });
});

/* the set-up screen's Leadership guide stays as the player left it: the
   screen is drawn anew on every tap (T44) */
document.addEventListener("toggle", ev => {
  const el = ev.target;
  if(el && el.classList && el.classList.contains("ldguide")) appState.V.ldGuide = el.open;
}, true);
