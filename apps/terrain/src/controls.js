import { draw, resetStarfield } from "./chart.js";
import { generate } from "../../../packages/battlezone/core.js";
import { ev, resetEvents } from "./events.js";
import { $, render, showFixedRules, showRules } from "./rules.js";

export const PRESETS = {
  '180x120': [180, 120], '240x180': [240, 180],
  '120x90':  [120, 90],  '90x60':   [90, 60]
};
export function clamp(v, lo, hi, fallback) {
  v = Number(v);
  if (!isFinite(v)) return fallback;
  return Math.max(lo, Math.min(hi, Math.round(v)));
}
export function readOpts() {
  return {
    zone: $('zone').value,
    width: clamp($('tw').value, 60, 300, 180),
    height: clamp($('th').value, 60, 300, 120),
    sector: clamp($('sector').value, 20, 120, 60),
    threshold: clamp($('threshold').value, 2, 6, 4)
  };
}
export function run() {
  const o = readOpts();
  $('tw').value = o.width; $('th').value = o.height; $('sector').value = o.sector;
  const seed = clamp($('seed').value, 1, 999999999, 27104);
  $('seed').value = seed;
  render(generate(seed, o));
}

/* The page's controls. Wired by boot(); the page's one script did this at load. */
export function wireControls() {




  $('preset').addEventListener('change', function () {
    const p = PRESETS[$('preset').value];
    if (p) { $('tw').value = p[0]; $('th').value = p[1]; run(); }
  });

  for (const id of ['tw', 'th']) {
    $(id).addEventListener('change', function () {
      const key = $('tw').value + 'x' + $('th').value;
      $('preset').value = PRESETS[key] ? key : 'custom';
      run();
    });
  }

  for (const id of ['zone', 'sector', 'threshold', 'seed']) {
    $(id).addEventListener('change', run);
  }

  $('roll').addEventListener('click', function () {
    $('seed').value = 1 + Math.floor(Math.random() * 999999);
    run();
  });

  $('zoneHelp').addEventListener('click', function () { showRules(null); });
  $('sunHelp').addEventListener('click', function () { showFixedRules('sunward'); });

  $('nextTurn').addEventListener('click', function () { ev.turn++; resetEvents(false); });
  $('newGame').addEventListener('click', function () { resetEvents(true); });

  let resizeTimer = null;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(draw, 120);
  });

  const darkQuery = window.matchMedia('(prefers-color-scheme: dark)');
  if (darkQuery.addEventListener) darkQuery.addEventListener('change', function () { resetStarfield(); draw(); });
}
