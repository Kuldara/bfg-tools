import { appState } from "./state.js";
import { $ } from "./helpers.js";
import { resolveFleet } from "./fleet-document.js";
import { loadPlay, newGame, resumeGame, save } from "./game-state.js";
import { act } from "./actions.js";
import { render, tapSel } from "./render.js";
import { builderFleets, copyText, openSend, savedFleets, takeFleetText } from "./share.js";
import { peerAct } from "./peer.js";
import { vpAct } from "./vp.js";
import { boardAct } from "./board.js";
import { orderAct, shipAct } from "./ship-actions.js";

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
  /* Apply Young Gunz & Mob Rule sits under Roll Ld: a second tap of the roll
     does not land on it (T63) */
  if(name === "ygapply" && Date.now() < (appState.V.ygGuard || 0)){ ev.preventDefault(); return; }
  /* a repair changes what is under the finger: the next tap waits a moment */
  if(/^repair/.test(name)) appState.V.guardUntil = Date.now() + 400;
  /* The tapped control stays where the finger is (user 30.9.2026: the screen
     must not move). render() finds the same control again and shifts the
     scroll by however far it moved - a chip line or a band appearing above
     it no longer pushes it away. */
  const tr = el.getBoundingClientRect();
  appState.TAP = { sel: tapSel(el), top: tr.top + tr.height / 2 };
  /* a tap inside the menu box is not a tap on the backdrop */
  if((name === "menu" || name === "endph" || name === "peerpanel" || name === "boardclose" || name === "acclose" || name === "vp") && el.classList.contains("menu") && ev.target.closest(".box")) return;
  /* the opponent's fleet is to look at: its cards take no taps */
  if(el.closest(".peerview")) return;
  if(vpAct(name, el)) return;
  if(peerAct(name, el)) return;
  if(boardAct(name, el)) return;
  if(shipAct(name, el)) return;
  if(orderAct(name, el)) return;
  const i = el.hasAttribute("data-i") ? parseInt(el.getAttribute("data-i"), 10) : null;
  let arg = el.hasAttribute("data-arg") ? el.getAttribute("data-arg") : undefined;
  if(arg != null && /^-?\d+$/.test(arg)) arg = parseInt(arg, 10);
  if(name === "resume"){ const g = loadPlay(); if(g && resumeGame(g)){ if(appState.G.started !== false) appState.G.started = true; appState.V.screen = appState.G.started ? "roster" : "setup"; } else { appState.V.loadErr = "The saved game could not be resumed against this roster."; } render(); return; }
  if(name === "newfrom"){
    const f = builderFleets()[arg]; if(!f) return;
    const res = resolveFleet(f); if(res.error) return;
    if(loadPlay() && !confirm("A game is in progress. Start a new one and forget its record?")) return;
    newGame(res); appState.V.screen = "setup"; save(); render(); return;
  }
  /* a saved fleet (the builder's Saved fleets, share.js savedFleets) */
  if(name === "linked"){
    const f = savedFleets()[arg]; if(!f) return;
    const res = resolveFleet(f); if(res.error){ appState.V.loadErr = res.error; render(); return; }
    if(loadPlay() && !confirm("A game is in progress. Start a new one and forget its record?")) return;
    res.src = "saved"; newGame(res); appState.V.screen = "setup"; save(); render(); return;
  }
  if(name === "send"){ openSend(arg); return; }
  if(name === "receive"){ location.href = "../send/index.html"; return; }
  if(name === "pickfile"){ const f = $("#fleetfile"); if(f){ f.value = ""; f.click(); } return; }
  act(name, i, arg);
});
/* A fleet file (Save file in the builder, or any fleet document): it goes
   into Saved fleets, the same as a link. */
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
  /* a ram's target picked from the books (T46) */
  if(el.getAttribute("data-sel") === "ramfoe") shipAct("acfoecat", el);
  /* Swap Ld on a battleship's or a Warlord's row, and the free escort's
     class (T63) */
  if(el.getAttribute("data-sel") === "swap") act("swap", parseInt(el.getAttribute("data-i"), 10), el.value === "" ? null : parseInt(el.value, 10));
  if(el.getAttribute("data-sel") === "yg") act("yg", parseInt(el.getAttribute("data-i"), 10), el.value);
});

/* the set-up screen's Leadership guide stays as the player left it: the
   screen is drawn anew on every tap (T44) */
document.addEventListener("toggle", ev => {
  const el = ev.target;
  if(el && el.classList && el.classList.contains("ldguide")) appState.V.ldGuide = el.open;
}, true);
