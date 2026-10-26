/* The battlezone core (core.js) for its two users.

   The Battlezone Generator includes core.js in its page as it is
   (apps/terrain/index.html, "@@include"). The Scenario Library is plain
   scripts and wants the core as one global, BZ: asNamespace() wraps it so,
   exporting the names below. Both apps build from this one file, so the
   copies cannot drift apart. */
"use strict";
const fs = require("fs"), path = require("path");

const NAMES = ["makeRng", "Dice", "PLANET_SUB", "ZONES", "SUN_EDGE", "PLANET_BAND", "KIND", "KEEP_CLEAR",
  "RING_ON", "extents", "overlaps", "onTable", "generate", "RULES", "EVENT_RULES"];

const core = () => fs.readFileSync(path.join(__dirname, "core.js"), "utf8");

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
