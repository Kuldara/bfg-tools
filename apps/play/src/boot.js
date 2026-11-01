import { appState } from "./state.js";
import { builderRaw } from "./storage.js";
import { fnv } from "./helpers.js";
import { fleetsIn, parseDoc } from "./fleet-document.js";
import { loadPlay, resumeGame } from "./game-state.js";
import { render } from "./render.js";
import { takeFleetText } from "./share.js";
import { peerBoot, takePeerFromAddress } from "./peer.js";
import { unpackFleet } from "../../../packages/ui/share-link.js";

/* Opened from a link with a fleet in it (the "to phone" QR code of an older
   build; links now open the builder, J236): the fleet goes on the page's own
   list and the list is shown, the new one on top; the address loses the
   fleet so a reload does not add it again. Read when the page opens and
   whenever the address gets a new link (J240: a second link opened in the
   same tab or app window does not reload the page). Returns whether there
   was one. */
export function takeLinkFromAddress(){
  const loc = typeof location !== "undefined" ? location : null;
  const frag = loc && /^#fleetj?=/.test(loc.hash || "") ? loc.hash.slice(1) : "";
  if(!frag) return false;
  try{ history.replaceState(null, "", loc.pathname + loc.search); }catch(e){}
  appState.V.screen = "load";
  unpackFleet(frag).then(text => { takeFleetText(text, "link"); },
                         e => { appState.V.loadErr = "The fleet in the link could not be read: " + (e && e.message || e) + "."; render(); });
  return true;
}

/* ================================================================ BOOT ===== */
(function boot(){
  const g = loadPlay();
  if(g && resumeGame(g)){
    /* the game continues where it was unless the builder's fleet changed */
    const raw = builderRaw();
    const p = raw ? parseDoc(raw) : null;
    const same = (g.src && g.src !== "builder") || !p || !p.o || fleetsIn(p.o).some(f => fnv(JSON.stringify([f.ln, f.units])) === g.fp);
    appState.V.screen = same ? "roster" : "load";
    /* a record that opens on the roster is a game under way (its set-up,
       from the menu, says Back to the game) */
    if(same) appState.G.started = true;
  }
  takeLinkFromAddress();
  peerBoot();
  if(typeof window !== "undefined" && window.addEventListener)
    window.addEventListener("hashchange", () => { if(takeLinkFromAddress() || takePeerFromAddress()) render(); });
  render();
})();
