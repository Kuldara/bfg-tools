/* tests/_load.js (0.9): loads the Scenario Library into Node without a browser: index.html's main script + scenarios/*.js
   in one vm context, with the DOM replaced by empty objects. Returns the context (SC, MAPS, ...). */
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

function loadLibrary(dir, opts) {
  opts = opts || {};
  const html = fs.readFileSync(path.join(dir, "index.html"), "utf8");
  const m = html.match(/<main id="app"><\/main>[\s\S]*?<script>([\s\S]*?)<\/script>/);
  if (!m) throw new Error("the main script was not found");
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
  ctx.window.innerWidth = opts.width || 1440;
  ctx.window.innerHeight = 900;
  ctx.window.matchMedia = () => ({ matches: false, addEventListener() {} });
  ctx.window.addEventListener = () => {};
  ctx.window.scrollTo = () => {};
  ctx.self = ctx;
  vm.createContext(ctx);
  /* const/let are visible only inside a script: everything is assembled into one script and the names exported */
  /* battlezone-core.js is made by the build from packages/battlezone */
  const core = require(path.join(dir, "..", "..", "packages", "battlezone", "index.js")).asNamespace();
  let src = (/battlezone-core/.test(html) ? core + "\n;" : "") + m[1].replace(/\brender\(false\);?\s*$/, "");
  for (const f of files) src += "\n;" + fs.readFileSync(path.join(dir, f), "utf8");
  src += "\n;wrInit();\n" + (opts.extra || "") +
    "\n;globalThis.__L = { SC, MAPS, FITS, mapOf, mapFn, fitOf, tableWH, get DB() { return DB; }, set DB(x) { DB = x; }, val, vis, pickV, agV, tpl, stOf, TABLES, mapSVG, gridOf" +
    (/battlezone-core/.test(html) ? ", BZ, TERRAIN, bzRun, bzSpec, bzBox, bzCtl, bzPlay, bzEvTool, bzFixed, bzChoices, bzZone, bzIsPlanet, bzItems, terrHit, terrPop" : "") + (opts.names ? ", " + opts.names : "") + " };";
  vm.runInContext(src, ctx, { filename: "library.js" });
  return ctx.__L;
}
module.exports = { loadLibrary };
