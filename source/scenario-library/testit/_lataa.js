/* testit/_lataa.js (0.9): lataa Scenario Libraryn Nodeen ilman selainta: index.html:n pääskripti + scenarios/*.js
   samaan vm-kontekstiin, DOM korvattu tyhjillä olioilla. Palauttaa kontekstin (SC, MAPS, ...). */
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

function lataa(dir, opts) {
  opts = opts || {};
  const html = fs.readFileSync(path.join(dir, "index.html"), "utf8");
  const m = html.match(/<main id="app"><\/main>[\s\S]*?<script>([\s\S]*?)<\/script>/);
  if (!m) throw new Error("pääskriptiä ei löytynyt");
  const files = [...html.matchAll(/<script src="(scenarios\/[^"?]+)(?:\?[^"]*)?"><\/script>/g)].map(x => x[1]);
  const store = {};
  const ctx = {
    console, Math, JSON, Date, Number, String, Array, Object, RegExp, Set, Map, Symbol, Error, isFinite, parseInt, parseFloat, Uint32Array, Infinity, NaN, Promise,
    setInterval: () => 0, setTimeout: () => 0, clearTimeout: () => 0,
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
  /* const/let näkyvät vain skriptin sisällä: kootaan kaikki yhdeksi skriptiksi ja viedään nimet ulos */
  const core = path.join(dir, "battlezone-core.js");
  let src = (fs.existsSync(core) ? fs.readFileSync(core, "utf8") + "\n;" : "") + m[1].replace(/\brender\(false\);?\s*$/, "");
  for (const f of files) src += "\n;" + fs.readFileSync(path.join(dir, f), "utf8");
  src += "\n;wrInit();\n" + (opts.extra || "") +
    "\n;globalThis.__L = { SC, MAPS, FITS, mapOf, mapFn, fitOf, tableWH, get DB() { return DB; }, set DB(x) { DB = x; }, val, vis, pickV, agV, tpl, stOf, TABLES, mapSVG, gridOf" +
    (/battlezone-core/.test(html) ? ", BZ, TERRAIN, bzRun, bzSpec, bzBox, bzCtl, bzPlay, bzEvTool, bzFixed, bzChoices, bzZone, bzIsPlanet, bzItems" : "") + (opts.names ? ", " + opts.names : "") + " };";
  vm.runInContext(src, ctx, { filename: "library.js" });
  return ctx.__L;
}
module.exports = { lataa };
