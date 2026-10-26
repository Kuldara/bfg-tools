/* The data contract's validator catches what it is there to catch.
   node --test tools/lib/ */
"use strict";
const test = require("node:test");
const assert = require("node:assert");
const fs = require("fs"), path = require("path");
const { validate } = require("./schema.js");

const REPO = path.resolve(__dirname, "..", "..");
const schema = JSON.parse(fs.readFileSync(path.join(REPO, "data", "schema.json"), "utf8"));
const data = () => JSON.parse(fs.readFileSync(path.join(REPO, "data", "bfg_data.json"), "utf8"));

test("the committed data matches the schema", () => {
  assert.deepStrictEqual(validate(schema, data()), []);
});

test("a missing stable ship field is reported", () => {
  const d = data(); delete d.ships["52"].hp;
  assert.match(validate(schema, d).join("\n"), /ships\.52: missing hp/);
});

test("an unknown hull type is reported", () => {
  const d = data(); d.ships["52"].ty = "Frigate";
  assert.match(validate(schema, d).join("\n"), /ships\.52\.ty/);
});

test("an armament row must have four fields", () => {
  const d = data(); d.ships["52"].aw[0].pop();
  assert.match(validate(schema, d).join("\n"), /aw\[0\]: 3 items/);
});

test("a ship id must be a page number", () => {
  const d = data(); d.ships["apocalypse"] = d.ships["52"];
  assert.match(validate(schema, d).join("\n"), /ships\.apocalypse: not allowed/);
});

test("a major version change is caught", () => {
  const d = data(); d.schemaVersion = "2.0";
  assert.match(validate(schema, d).join("\n"), /schemaVersion/);
});
