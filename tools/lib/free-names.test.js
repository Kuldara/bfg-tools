/* The free-name list sees what JavaScript's scoping says, and nothing else.
   It rests on esbuild replacing a define only where a name is unbound; if an
   esbuild upgrade changed that, these go red before the build's guard goes
   blind or starts to cry wolf.
   node --test tools/lib/*.test.js */
"use strict";
const test = require("node:test");
const assert = require("node:assert");
const fs = require("fs"), os = require("os"), path = require("path");
const freeNames = require("./free-names.js");

/* modules in a fresh folder, bundled as kit.bundle does it; the uses in these
   files (esbuild's own helpers, which export * brings, use Object) */
async function bundleOf(files) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "free-names-"));
  try {
    for (const [f, text] of Object.entries(files)) fs.writeFileSync(path.join(dir, f), text);
    const esbuild = require("esbuild");
    const options = { entryPoints: [path.join(dir, "index.js")], bundle: true, write: false, format: "iife", globalName: "T",
      charset: "ascii", legalComments: "none", platform: "browser", logLevel: "silent" };
    const js = (await esbuild.build(options)).outputFiles[0].text;
    return (await freeNames.ofBundle(options, js))
      .map(h => Object.assign(h, { file: path.basename(h.file), exportedBy: h.exportedBy.map(f => path.basename(f)) }))
      .filter(h => h.file in files);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
}
const names = hits => [...new Set(hits.map(h => h.name))].sort();

test("a module's forgotten import is a free name, at its line, with the module that exports it", async () => {
  const hits = await bundleOf({
    "index.js": 'export * from "./a.js";\nexport * from "./b.js";\n',
    "a.js": 'import { other } from "./b.js";\nexport function grp(g){\n  return other(g) && isEsc(g);\n}\n',
    "b.js": 'export const isEsc = g => /^e:/.test(String(g));\nexport const other = g => !!g;\n',
  });
  assert.deepStrictEqual(names(hits.filter(h => !freeNames.allowed(h.name))), ["isEsc"]);
  const h = hits.find(x => x.name === "isEsc");
  assert.deepStrictEqual([h.file, h.line, h.exportedBy], ["a.js", 3, ["b.js"]]);
});

test("a parameter, a local, an import, a class, a catch, a label, a property, a string, a comment or a template's text is not free", async () => {
  const hits = await bundleOf({
    "index.js": 'export * from "./a.js";\n',
    "a.js": [
      'import { used } from "./b.js";',
      'export const top = 1;',
      'export function f(param, { destr, ren: renamed }, [arr], ...rest){ const local = 2; return param + destr + renamed + arr + rest + local + top + used; }',
      'export class C { method(){ return this.x + C.y; } }',
      'export function g(){ try { return 1; } catch (err) { return err; } }',
      'export function h(){ outer: for(;;) break outer; }',
      'export function k(o){ return o.prop + "inString" /* inComment */ + `tpl text`; }',
      'export function m(){ var hoisted = 1; function inner(){ return hoisted + arguments.length; } return inner(); }',
      'export function n(Shadow){ return Shadow; }',
    ].join("\n") + "\n",
    "b.js": "export const used = 1;\n",
  });
  assert.deepStrictEqual(names(hits), []);
});

test("typeof, an assignment, a shorthand property, a template's hole and a name past its block are free", async () => {
  const hits = await bundleOf({
    "index.js": 'export * from "./a.js";\n',
    "a.js": [
      'export const a = () => typeof maybe;',
      'export const b = () => { assigned = 3; counted++; };',
      'export const c = () => ({ short, [computed]: 1 });',
      'export const d = () => `x ${inHole} y`;',
      'export function e(){ if (Math.random()) { let inBlock = 1; } return inBlock; }',
      'export const f = () => new Shadow();',
      'export function g(Shadow){ return Shadow; }',
    ].join("\n") + "\n",
  });
  assert.deepStrictEqual(names(hits), ["Math", "Shadow", "assigned", "computed", "counted", "inBlock", "inHole", "maybe", "short"]);
});

test("the language's and the browser's names are allowed; a page's own, Node's and window's slips are not", () => {
  for (const n of ["JSON", "Math", "undefined", "globalThis", "parseInt", "console", "document", "localStorage", "setTimeout", "WebSocket"])
    assert.ok(freeNames.allowed(n), n);
  for (const n of ["isEscGrp", "G", "render", "process", "Buffer", "global", "require", "name", "status", "event", "open", "top", "SharedArrayBuffer"])
    assert.ok(!freeNames.allowed(n), n);
});

test("a built script: each free name with the module esbuild's comment names above it", () => {
  const code = [
    "var T = (() => {",
    "  // apps/x/src/b.js",
    "  var isEsc2 = (g) => /^e:/.test(String(g));",
    "  // apps/x/src/a.js",
    "  function grp(g) {",
    "    return isEsc(g) && isEsc2(g);",
    "  }",
    "  return { grp, isEsc: isEsc2 };",
    "})();",
  ].join("\n");
  const hits = freeNames.ofScript(code).filter(h => !freeNames.allowed(h.name));
  assert.deepStrictEqual(hits.map(h => [h.name, h.line, h.module]), [["isEsc", 6, "apps/x/src/a.js"]]);
});
