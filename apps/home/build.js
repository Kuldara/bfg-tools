/* The front page of the GitHub Pages mirror (dist/index.html): links to the
   five tools under /registry/, /boarding/, /terrain/, /scenarios/, /almanac/. */
"use strict";
const kit = require("../../tools/lib/kit.js");

async function build() {
  const page = kit.read("apps/home/index.html");
  kit.guards.controlChars(page, "home");
  return { out: [kit.write("dist/index.html", page)] };
}

module.exports = { build };
