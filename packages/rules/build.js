/* Makes packages/rules/domain.js from src/.

     node packages/rules/build.js            writes domain.js
     node packages/rules/build.js --check    fails when domain.js is not what src/ makes

   domain.js is committed although it is generated, because three readers
   load it as one file: the apps' bundles (an import of a CommonJS module),
   the Node tests (require) and the battle simulator in its private
   repository (require, and the text embedded in a browser package). The
   check runs in npm test, so the file cannot fall behind src/. */
"use strict";
const fs = require("fs"), path = require("path");
const kit = require("../../tools/lib/kit.js");

const OUT = path.join(__dirname, "domain.js");
const HEADER = `/* domain.js - the Gothic Fleet Registry's rules engine, one file.

   GENERATED from packages/rules/src/ by packages/rules/build.js: edit the
   modules there and run the build (npm run build does). The apps bundle this
   file, the Node tests and the battle simulator require() it, so it stays a
   UMD module: DOMAIN in a browser, module.exports in Node.

   Rules (packages/rules/CONTRACT.md):
     - nothing in here reads or writes anything outside its arguments
     - nothing in here returns a reference into its arguments
     - ASCII only */
`;
const FOOTER = `var DOMAIN = __rules.default;
if (typeof module !== "undefined" && module.exports) module.exports = DOMAIN;
`;

async function make() {
  const js = await kit.bundle({ entry: "packages/rules/src/index.js", globalName: "__rules" });
  const text = HEADER + js + FOOTER;
  kit.guards.ascii(text, "domain.js");
  kit.guards.controlChars(text, "domain.js");
  return text;
}

module.exports = { make, OUT };

if (require.main === module) make().then(text => {
  if (process.argv.includes("--check")) {
    const cur = fs.existsSync(OUT) ? fs.readFileSync(OUT, "utf8") : "";
    if (cur !== text) { console.error("packages/rules/domain.js is not what src/ makes: run node packages/rules/build.js"); process.exit(1); }
    console.log("domain.js is current (" + kit.kB(text.length).trim() + ")");
  } else {
    fs.writeFileSync(OUT, text);
    console.log("packages/rules/domain.js " + kit.kB(text.length).trim());
  }
}).catch(e => { console.error(e.message); process.exit(1); });
