/* The Registry's modules loaded into a Node process, for tests and page tools.

   The caller sets up its document / window / localStorage stubs first (each
   test has its own), then:

     const api = require("./test-support.js").loadApp();

   api has every export of src/index.js (read live, so a value a module
   reassigns is current), DOMAIN, and accessors for the shared state that the
   tests set from outside: S / getS / setS (the open fleet), getNote / setNote
   (the restore note). */
"use strict";
const path = require("path");
const fs = require("fs");

function loadApp() {
  const App = require("./src/index.js");
  const DOMAIN = require("../../packages/rules/domain.js");
  const api = {};
  for (const k of Object.keys(App)) Object.defineProperty(api, k, { get: () => App[k], enumerable: true });
  Object.defineProperty(api, "S", { get: () => App.appState.S, set: v => { App.appState.S = v; }, enumerable: true });
  Object.assign(api, {
    DOMAIN,
    getS: () => App.appState.S, setS: v => { App.appState.S = v; },
    getNote: () => App.appState.LOAD_NOTE, setNote: v => { App.appState.LOAD_NOTE = v; },
  });
  return api;
}

/* The built site page (npm run build), for checks that need the page itself:
   its CSS, or a real browser. */
const PAGE = path.join(__dirname, "..", "..", "dist", "registry", "index.html");
function builtPage() {
  if (!fs.existsSync(PAGE)) throw new Error("dist/registry/index.html is missing: run npm run build");
  return fs.readFileSync(PAGE, "utf8");
}

/* For scripts injected into the built page (card printing, the Clanz UI
   check): the page is one bundle whose exports are on window.GFR. This makes
   every export a global again, and the shared state (S, ...) assignable, so a
   script can say S.units or render() as it did when the page was one plain
   script. */
const PAGE_GLOBALS_JS = "(function(){" +
  "for(const k of Object.keys(GFR)) if(k !== 'appState' && !(k in window))" +
  " Object.defineProperty(window, k, { get: () => GFR[k], configurable: true });" +
  "for(const k of Object.keys(GFR.appState))" +
  " Object.defineProperty(window, k, { get: () => GFR.appState[k], set: v => { GFR.appState[k] = v; }, configurable: true });" +
  "})();";

module.exports = { loadApp, builtPage, PAGE, PAGE_GLOBALS_JS };
