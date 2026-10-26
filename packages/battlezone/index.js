/* The battlezone core (core.js) for its two users.

   core.js is an ES module: the Battlezone Generator imports it
   (apps/terrain/src). The Scenario Library's scenario files are plain
   scripts and want the core as one global, BZ: asNamespace() strips the
   export keywords and wraps the text so, exporting the names below. Both
   apps build from this one file, so the copies cannot drift apart. */
"use strict";
const fs = require("fs"), path = require("path");

const NAMES = ["makeRng", "Dice", "PLANET_SUB", "ZONES", "SUN_EDGE", "PLANET_BAND", "KIND", "KEEP_CLEAR",
  "RING_ON", "extents", "overlaps", "onTable", "generate", "RULES", "EVENT_RULES"];

const core = () => fs.readFileSync(path.join(__dirname, "core.js"), "utf8").replace(/^export /gm, "");

function asNamespace() {
  const text = core();
  for (const n of NAMES)
    if (!text.includes("function " + n + "(") && !text.includes("const " + n + " "))
      throw new Error("packages/battlezone/core.js no longer defines " + n);
  return "/* Battlezone core (packages/battlezone/core.js), built for the Scenario Library. */\n" +
    "const BZ = (function () {\n'use strict';\n" + text +
    "return { " + NAMES.join(", ") + " };\n})();\n";
}

module.exports = { core, asNamespace, NAMES };
