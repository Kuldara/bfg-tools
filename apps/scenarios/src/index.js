/* The Scenario Library's modules, in the order the page ran them when they were
   one script. The bundle (build.js) starts here and exposes every export on
   window.SL for the scenario files, the lab, the in-page tests and the Node
   tests (tests/_load.js). */
export * from "./data.js";
export * from "./table.js";
export * from "./maps.js";
export * from "./low-orbit.js";
export * from "./turn-track.js";
export * from "./subplots.js";
export * from "./credits.js";
export * from "./state.js";
export * from "./helpers.js";
export * from "./layout.js";
export * from "./dimensions.js";
export * from "./map-svg.js";
export * from "./battlezone.js";
export * from "./terrain-legend.js";
export * from "./views.js";
export * from "./front-page.js";
export * from "./originals.js";
export * from "./bookkeeping.js";
export * from "./scenario-page.js";
export * from "./prep.js";
export * from "./widgets.js";
export * from "./events.js";
import { bzIsPlanet } from "./battlezone.js";
import { GW_CREDIT, RB_CREDIT } from "./credits.js";
import { ARRIVAL, ARRIVE_SUB, ARRIVE_TXT, EDGE_ROWS, PA_PROV, SC, THREATS, THREAT_PLAY, addScenarios, v0, val } from "./data.js";
import { wireEvents } from "./events.js";
import { esc, fmt } from "./helpers.js";
import { layout, mapFont, textLen } from "./layout.js";
import { EDGES4, MAPS, R, TICKS } from "./maps.js";
import { d6, dn, endingResult, entryInfo, get, num, save, sideName, treeAt, wins } from "./state.js";
import { tableWH } from "./table.js";
import { entryFx } from "./turn-track.js";
import { agN, agV, app, render, route, wrInit } from "./views.js";
import { gridOf } from "./widgets.js";

/* The scenario files (scenarios/*.js) are plain scripts, loaded after this
   bundle: each adds itself with a bare addScenarios(...), and their map, credit
   and play builders are these page names. The list is the whole contract: a
   name missing here fails tests/_load.js and the page alike. A let (the
   route) is read through a getter, so the files see its current value. */
Object.assign(globalThis, { addScenarios, ARRIVAL, ARRIVE_SUB, ARRIVE_TXT, EDGES4, EDGE_ROWS, GW_CREDIT, MAPS, PA_PROV, R, RB_CREDIT, THREATS, THREAT_PLAY, TICKS, addScenarios, agN, agV, app, bzIsPlanet, d6, dn, endingResult, entryFx, entryInfo, esc, fmt, get, gridOf, layout, mapFont, num, save, sideName, tableWH, textLen, treeAt, v0, val, wins });
Object.defineProperty(globalThis, "route", { get: () => route, configurable: true });

/* After the scenario files: the Warp Rift data onto the scenarios, the count
   in the footer, the listeners, the first render. */
export function boot() {
  wrInit();
  document.getElementById("scn").textContent = SC.length;
  wireEvents();
  render(false);
}
