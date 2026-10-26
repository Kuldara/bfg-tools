/* ============================================================ STORAGE ===== */
/* The builder's key is read and never written (apps/play/README.md). */
export const KEY_BUILDER = "gothic-fleet-registry-v1";
export const KEY_PLAY = "gothic-fleet-play-v1";
export const KEY_INFO = "gothic-fleet-play-info";
/* Tracking options: what the page records of the things tokens do on the
   table. Per device, never in the game record. Default: nothing - the
   spec + HP + crits row is the product; these are opt-in. */
export const KEY_TRACK = "gothic-fleet-play-track";
export const TRACK = [
  ["orders",   "Special orders and Brace",   "order per ship, fleet lock after a failed check, brace timing (p. 46-48)"],
  ["shields",  "Shields and blast markers",  "markers touching the base: shields up, -1 Ld, damage-control dice (p. 69-70, 48, 88)"],
  ["ordnance", "Ordnance loaded",            "torpedoes and attack craft ready / launched (p. 73-74)"],
  ["fleet",    "Fleet counters",             "the RR counter in the top bar (the re-roll boxes on the commander's card are always there), attack craft in play vs bays, enemy contacts +1, radiation (p. 48, 73, 115)"],
];
export function loadOpts(){
  const o = {};
  let saved = null; try{ saved = JSON.parse(lsGet(KEY_TRACK) || "null"); }catch(e){}
  TRACK.forEach(t => { o[t[0]] = !!(saved && saved[t[0]]); });
  return o;
}
export let OPT = loadOpts();
export function saveOpts(){ lsSet(KEY_TRACK, JSON.stringify(OPT)); }
/* State the page does not track is cleared, so a switch turned off (or a
   record from a device with other settings) cannot feed the numbers. */
export function normaliseUntracked(g){
  (g.st || []).forEach(st => {
    if(!OPT.orders){ st.order = null; st.braceTurn = 0; st.braceCarry = null; st.braceLock = false; st.boarding = false; st.noOrdersTurn = false; st.teleported = false; }
    if(!OPT.shields) st.blast = 0;
  });
  if(g.fleet){ if(!OPT.orders) g.fleet.orderLock = false; if(!OPT.fleet){ g.fleet.enemyOrders = false; g.fleet.radiation = 0; } }
}
/* Set by the build (tools/build.js); "dev" when the modules run unbundled in tests. */
export const PLAY_VERSION = typeof __APP_VERSION__ !== "undefined" ? __APP_VERSION__ : "dev";
export function lsGet(k){ try{ return localStorage.getItem(k); }catch(e){ return null; } }
/* The builder's fleet as THIS tab has it (J241): the builder keeps a copy per
   tab in sessionStorage, so Play opened from a tab plays that tab's fleet
   (a fleet opened from a link in it, say), not whichever tab saved last. A
   tab that never had the builder open reads the shared copy. */
export function builderRaw(){
  try{ const t = typeof sessionStorage !== "undefined" ? sessionStorage.getItem(KEY_BUILDER) : null; if(t) return t; }catch(e){}
  return lsGet(KEY_BUILDER);
}
export function lsSet(k, v){ try{ localStorage.setItem(k, v); return true; }catch(e){ return false; } }
export function lsDel(k){ try{ localStorage.removeItem(k); }catch(e){} }

