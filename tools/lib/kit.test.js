/* kit.bundle's checkImports finds a name a module uses without importing it.
   The bug it is for (4.11.2026): Play's actions.js used isEscGrp without its
   import, esbuild renamed the export to isEscGrp2, and the browser threw.
   These cases keep the check from going blind (an esbuild upgrade could).
     node --test tools/lib/ */
"use strict";
const test = require("node:test");
const assert = require("node:assert");
const fs = require("fs"), os = require("os"), path = require("path");
const kit = require("./kit.js");

/* b.js exports two names; a.js is the module under test; index.js re-exports
   both, as the apps' entries do */
async function withModules(aSource, fn) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "kit-test-"));
  try {
    fs.writeFileSync(path.join(dir, "b.js"), 'export const isEscGrp = g => /^e:/.test(String(g || ""));\nexport const grpLabel = g => String(g || "").replace(/^e:/, "");\n');
    fs.writeFileSync(path.join(dir, "a.js"), aSource);
    fs.writeFileSync(path.join(dir, "index.js"), 'export * from "./a.js";\nexport * from "./b.js";\n');
    return await fn(path.join(dir, "index.js"));
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
}
const MISSING = 'import { grpLabel } from "./b.js";\nexport function act(g){ return grpLabel(g) + (isEscGrp(g) ? " escorts" : ""); }\n';

test("a name used without its import stops the build, naming the module and the exporter", () =>
  withModules(MISSING, entry => assert.rejects(kit.bundle({ entry, globalName: "T", checkImports: true }),
    e => /a\.js uses isEscGrp without importing it \([^)]*b\.js exports it\)/.test(e.message))));

test("without checkImports the same bundle builds, with the export renamed and the bare name left", () =>
  withModules(MISSING, async entry => {
    const js = await kit.bundle({ entry, globalName: "T" });
    assert.match(js, /\bisEscGrp2 = /);
    assert.match(js, /[^\w.]isEscGrp\(g\)/);
  }));

test("imported, the name passes", () =>
  withModules(MISSING.replace("{ grpLabel }", "{ grpLabel, isEscGrp }"), async entry => {
    const js = await kit.bundle({ entry, globalName: "T", checkImports: true });
    assert.doesNotMatch(js, /isEscGrp2/);
  }));

test("a browser global, or a local of the same name, is not a finding", () =>
  withModules('export function act(g){ const grpLabel = String(g); return document.title + grpLabel + Math.max(1, 2); }\n',
    entry => kit.bundle({ entry, globalName: "T", checkImports: true })));
