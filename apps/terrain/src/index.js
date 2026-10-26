/* The Battlezone Generator's modules, in the order the page ran them when they
   were one script after the core. The bundle (build.js) starts here; its
   exports are window.BZG for the page tools and tests. */
export * from "../../../packages/battlezone/core.js";
export * from "./chart.js";
export * from "./rules.js";
export * from "./events.js";
export * from "./controls.js";
import { renderLegend } from "./rules.js";
import { run, wireControls } from "./controls.js";

/* the legend, the controls, the first table (the seed in the box) */
export function boot() {
  renderLegend();
  wireControls();
  run();
}
