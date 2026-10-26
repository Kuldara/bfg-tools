/* tests/_load.js: the Scenario Library in Node without a browser.

   The modules in src/ are bundled with esbuild the way build.js does it
   (window.SL), then run in one vm context with the DOM replaced by empty
   objects, followed by battlezone-core, the scenario files in the page's order,
   wrInit() and opts.extra (the lab, for instance). Returns L: every export of
   the bundle as a live property, DB readable and replaceable (L.DB = {...}),
   the data files' globals that the tests use (BZ, TERRAIN), and any names
   opts.names lists that are not exports ("LAB, LAB_TABS" from opts.extra, or
   "setNarrow: n => {...}" as a value made here). */
"use strict";
const fs = require("fs"), path = require("path"), vm = require("vm");

function stub() {
  const f = function () { return P; };
  const P = new Proxy(f, {
    get(t, k) {
      if (k === Symbol.toPrimitive) return () => "";
      if (k === "length") return 0;
      if (k === "matches") return false;
      if (k === "offsetHeight" || k === "clientWidth" || k === "scrollY") return 0;
      if (k === "querySelectorAll") return () => [];
      if (k === "querySelector") return () => null;
      if (k === "then") return undefined;
      return P;
    },
    set() { return true; },
    apply() { return P; },
    construct() { return P; }
  });
  return P;
}

function bundle(dir) {
  const esbuild = require("esbuild");
  const r = esbuild.buildSync({
    entryPoints: [path.join(dir, "src", "index.js")], bundle: true, write: false, format: "iife", globalName: "SL",
    charset: "ascii", legalComments: "none", platform: "browser", logLevel: "silent",
  });
  return r.outputFiles[0].text;
}

function loadLibrary(dir, opts) {
  opts = opts || {};
  const html = fs.readFileSync(path.join(dir, "index.html"), "utf8");
  const files = [...html.matchAll(/<script src="(scenarios\/[^"?]+)(?:\?[^"]*)?"><\/script>/g)].map(x => x[1]);
  const store = {};
  const ctx = {
    console, Math, JSON, Date, Number, String, Array, Object, RegExp, Set, Map, Symbol, Error, isFinite, parseInt, parseFloat, Uint32Array, Infinity, NaN, Promise,
    setInterval: () => 0, setTimeout: () => 0, clearTimeout: () => 0,
    TextEncoder,
    crypto: { getRandomValues: a => { for (let i = 0; i < a.length; i++) a[i] = Math.floor(Math.random() * 4294967296); return a; } },
    localStorage: { getItem: k => store[k] === undefined ? null : store[k], setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; } },
    location: { hash: "", href: "" }, history: { replaceState() {} },
    document: stub(), navigator: stub(),
  };
  ctx.window = ctx;
  ctx.globalThis = ctx;
  ctx.window.innerWidth = opts.width || 1440;
  ctx.window.innerHeight = 900;
  ctx.window.matchMedia = () => ({ matches: false, addEventListener() {} });
  ctx.window.addEventListener = () => {};
  ctx.window.scrollTo = () => {};
  ctx.self = ctx;
  vm.createContext(ctx);
  const run = (src, name) => vm.runInContext(src, ctx, { filename: name });
  /* battlezone-core.js is made by the build from packages/battlezone */
  if (/battlezone-core/.test(html))
    run(require(path.join(dir, "..", "..", "packages", "battlezone", "index.js")).asNamespace(), "battlezone-core.js");
  run(bundle(dir), "app.js");
  for (const f of files) run(fs.readFileSync(path.join(dir, f), "utf8"), f);
  const SL = ctx.SL;
  SL.wrInit();
  if (opts.extra) run(opts.extra, "extra.js");

  const L = {};
  for (const k of Object.keys(SL)) Object.defineProperty(L, k, { get: () => SL[k], enumerable: true, configurable: true });
  Object.defineProperty(L, "DB", { get: () => SL.getDB(), set: x => SL.setDB(x), enumerable: true });
  /* globals of the scenario files and the core, as the one-script loader exposed them */
  for (const g of ["BZ", "TERRAIN"]) {
    const v = run("typeof " + g + " === 'undefined' ? undefined : " + g, "global.js");
    if (v !== undefined) L[g] = v;
  }
  for (const item of String(opts.names || "").split(",").map(s => s.trim()).filter(Boolean)) {
    const m = /^([A-Za-z_$][\w$]*)\s*:\s*([\s\S]+)$/.exec(item);
    if (m) L[m[1]] = run("(" + m[2] + ")", "names.js");
    else if (!(item in L)) L[item] = run(item, "names.js");
  }
  return L;
}
module.exports = { loadLibrary };
