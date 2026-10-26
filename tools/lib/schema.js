/* A small JSON Schema validator: the subset data/schema.json uses (type,
   enum, pattern, required, properties, patternProperties,
   additionalProperties, items, minItems, maxItems, $ref to #/$defs).
   No dependency, so CI checks the data contract with Node alone.

   validate(schema, value) -> list of problems, empty when the value conforms. */
"use strict";

function typeOf(v) {
  if (v === null) return "null";
  if (Array.isArray(v)) return "array";
  if (typeof v === "number") return Number.isInteger(v) ? "integer" : "number";
  return typeof v;
}

function validate(root, value) {
  const out = [];
  const resolve = s => {
    while (s && s.$ref) {
      const m = /^#\/\$defs\/(.+)$/.exec(s.$ref);
      if (!m || !root.$defs || !root.$defs[m[1]]) throw new Error("unsupported $ref " + s.$ref);
      s = root.$defs[m[1]];
    }
    return s;
  };
  const check = (schema, v, at) => {
    if (out.length > 50) return;
    const s = resolve(schema);
    if (!s) return;
    if (s.type) {
      const want = Array.isArray(s.type) ? s.type : [s.type], got = typeOf(v);
      if (!want.includes(got) && !(got === "integer" && want.includes("number"))) {
        out.push(`${at}: ${got}, expected ${want.join(" or ")}`); return;
      }
    }
    if (s.enum && !s.enum.some(e => e === v)) out.push(`${at}: ${JSON.stringify(v)} is not one of ${s.enum.join(", ")}`);
    if (s.pattern && typeof v === "string" && !new RegExp(s.pattern).test(v)) out.push(`${at}: "${v}" does not match ${s.pattern}`);
    if (typeOf(v) === "object") {
      for (const k of s.required || []) if (!(k in v)) out.push(`${at}: missing ${k}`);
      for (const [k, x] of Object.entries(v)) {
        const p = `${at}.${k}`;
        if (s.properties && k in s.properties) { check(s.properties[k], x, p); continue; }
        const pat = s.patternProperties && Object.keys(s.patternProperties).find(re => new RegExp(re).test(k));
        if (pat) { check(s.patternProperties[pat], x, p); continue; }
        if (s.additionalProperties === false) out.push(`${p}: not allowed`);
        else if (s.additionalProperties && typeof s.additionalProperties === "object") check(s.additionalProperties, x, p);
      }
    }
    if (Array.isArray(v)) {
      if (s.minItems != null && v.length < s.minItems) out.push(`${at}: ${v.length} items, at least ${s.minItems}`);
      if (s.maxItems != null && v.length > s.maxItems) out.push(`${at}: ${v.length} items, at most ${s.maxItems}`);
      if (s.items) v.forEach((x, i) => check(s.items, x, `${at}[${i}]`));
    }
  };
  check(root, value, "$");
  return out;
}

module.exports = { validate };

/* node tools/lib/schema.js <schema.json> <data.json> */
if (require.main === module) {
  const fs = require("fs");
  const [sp, dp] = process.argv.slice(2);
  const problems = validate(JSON.parse(fs.readFileSync(sp, "utf8")), JSON.parse(fs.readFileSync(dp, "utf8")));
  problems.slice(0, 30).forEach(p => console.log("  " + p));
  console.log(problems.length ? problems.length + " problems" : "data matches the schema");
  process.exit(problems.length ? 1 : 0);
}
