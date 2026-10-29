/* The whole test suite, one verdict.

   npm test                 everything that needs only the repository (CI runs this)
   npm run test:quick       the same without the slow runs (random fleets, layout,
                            the browser-driven checks)
   npm run check:books      the checks that compare the data and the quoted text
                            with the rulebooks; needs books/ (extractor/books.py)

   node tools/test.js --only registry,play    only the steps of these groups
   node tools/test.js --list                  list the steps

   Verdict:
     PASS        every step passed and every Definition of Done measure is zero
     WORK LEFT   nothing is broken, but a known gap is open (a golden case marked
                 "gap", an unclassified list rule, a measure not taken)
     FAIL        something is broken
   A known gap is planned work; a failure is not, and is never hidden as a gap. */
"use strict";
const { spawnSync } = require("child_process");
const fs = require("fs"), path = require("path");
const REPO = path.resolve(__dirname, "..");
const argv = process.argv.slice(2);
const QUICK = argv.includes("--quick"), BOOKS = argv.includes("--books");
const ONLY = (() => { const i = argv.indexOf("--only"); return i >= 0 ? argv[i + 1].split(",") : null; })();
const PY = process.platform === "win32" ? "python" : "python3";

/* group, name, command (run in the repository root), flags:
   slow: skipped by --quick;  books: needs the rulebooks (run by --books only);
   json: the step prints a JSON report the verdict reads */
const STEPS = [
  ["build",     "build all apps",          ["node", "tools/build.js"]],
  ["data",      "data is reproducible",    [PY, "extractor/build_data.py"], { reproducible: "data/bfg_data.json" }],
  ["data",      "matches data/schema.json", ["node", "--test", "tools/lib/*.test.js"]],
  ["data",      "section guard",           [PY, "extractor/build_data.py", "--prove-guard"]],
  ["data",      "list rules vs reference", [PY, "extractor/check_reference.py"]],
  ["data",      "golden arithmetic",       [PY, "extractor/check_golden_math.py"]],
  ["data",      "pricing coverage",        [PY, "extractor/coverage.py"]],
  ["data",      "option effects",          [PY, "extractor/audit_effects.py", "--json"], { json: "effects" }],
  ["data",      "list upgrade effects",    [PY, "extractor/audit_upgrades.py", "--json"], { json: "upgrades" }],
  ["build",     "link previews current",   ["node", "tools/og.js", "--check"]],
  ["data",      "no control characters",   [PY, "tools/check_control.py"]],
  ["rules",     "domain.js is current",    ["node", "packages/rules/build.js", "--check"]],
  ["rules",     "domain",                  ["node", "packages/rules/test_domain.js"]],
  ["rules",     "symmetry",                ["node", "packages/rules/check_symmetry.js"]],
  ["registry",  "golden cases",            ["node", "apps/registry/test_golden.js", "--json"], { json: "golden" }],
  ["registry",  "validator",               ["node", "apps/registry/test_validator.js"]],
  ["registry",  "list upgrades",           ["node", "apps/registry/test_upgrades.js"]],
  ["registry",  "save and load",           ["node", "apps/registry/test_save.js"]],
  ["registry",  "save fuzzing",            ["node", "apps/registry/fuzz_save.js", "1000"]],
  ["registry",  "structure",               ["node", "apps/registry/qa_structure.js"]],
  ["registry",  "printed cards",           ["node", "apps/registry/print_check.js"]],
  ["registry",  "random fleets",           ["node", "apps/registry/stress.js"], { slow: true }],
  ["registry",  "print layout (Chrome)",   ["node", "apps/registry/layout_check.js", "--json"], { slow: true, json: "layout" }],
  ["registry",  "editable sheet (Chrome)", ["node", "apps/registry/check_editable.js"], { slow: true }],
  ["registry",  "fleet links (Chrome)",    ["node", "apps/registry/check_links.js"], { slow: true }],
  ["registry",  "ship info (Chrome)",      ["node", "apps/registry/check_info.js"], { slow: true }],
  ["registry",  "Blood Axe escorts (Chrome)", ["node", "apps/registry/check_bloodaxe.js"], { slow: true }],
  ["registry",  "Ork Clanz UI (Chrome)",   ["node", "apps/registry/metrics/clanz.js", "--mode=browse"], { slow: true }],
  ["play",      "rules and smoke",         ["node", "apps/play/test_play.js"]],
  ["boarding",  "engine",                  ["node", "apps/boarding/test_engine.js"]],
  ["boarding",  "fuzz",                    ["node", "apps/boarding/test_fuzz.js"]],
  ["boarding",  "page walks (Chrome)",     ["node", "apps/boarding/test_page.js"], { slow: true }],
  ["scenarios", "bookkeeping",             ["node", "apps/scenarios/tests/bookkeeping.js"]],
  ["scenarios", "sizes",                   ["node", "apps/scenarios/tests/sizes.js"]],
  ["scenarios", "terrain",                 ["node", "apps/scenarios/tests/terrain.js"]],
  ["scenarios", "map measurements",        ["node", "apps/scenarios/tests/measurements.js"]],
  ["scenarios", "front page",              ["node", "apps/scenarios/tests/front.js"]],
  ["scenarios", "in-page tests (Chrome)",  ["node", "apps/scenarios/tests/in_page.js"], { slow: true }],
  ["books",     "profiles vs Fleets PDF",  [PY, "extractor/check_profiles.py"], { books: true }],
  ["books",     "data vs Fleets PDF",      [PY, "extractor/audit.py"], { books: true }],
  ["books",     "quoted sentences",        [PY, "extractor/check_quotes.py"], { books: true }],
  ["books",     "page references",         [PY, "extractor/check_pages.py"], { books: true }],
  ["books",     "scenario page refs",      [PY, "apps/scenarios/tests/page_audit.py"], { books: true }],
];

if (argv.includes("--list")) {
  for (const [g, n, c, f = {}] of STEPS) console.log(`${g.padEnd(10)} ${n.padEnd(26)} ${c.join(" ")}${f.slow ? "  [slow]" : ""}${f.books ? "  [books]" : ""}`);
  process.exit(0);
}

const ENV = Object.assign({}, process.env, { PYTHONIOENCODING: "utf-8" });
const json = {};
const broken = [];
const read = p => (fs.existsSync(p) ? fs.readFileSync(p, "utf8") : null);
console.log("BFG Tools test suite" + (QUICK ? " (quick)" : "") + (BOOKS ? " (books)" : ""));
console.log("=".repeat(70));
for (const [group, name, cmd, flags = {}] of STEPS) {
  if (BOOKS !== !!flags.books && !(BOOKS && group === "build")) continue;
  if (ONLY && !ONLY.includes(group) && group !== "build") continue;
  if (QUICK && flags.slow) { console.log(`  ${group.padEnd(10)} ${name.padEnd(26)} skipped (--quick)`); continue; }
  const before = flags.reproducible ? read(path.join(REPO, flags.reproducible)) : null;
  const t0 = Date.now();
  /* A step that hangs (a browser page that stopped answering under a heavy
     machine load did once) fails after this long instead of stopping the run. */
  const limit = (flags.slow ? 30 : 15) * 60000;
  const r = spawnSync(cmd[0], cmd.slice(1), { cwd: REPO, env: ENV, encoding: "utf8", maxBuffer: 1 << 28, timeout: limit });
  const out = (r.stdout || "") + (r.stderr || "");
  let ok = r.status === 0;
  let note = out.trim().split("\n").filter(l => l.trim()).pop() || "";
  if (r.error) { ok = false; note = r.error.message; }
  /* the step's own headless Chrome goes with it (checked on Windows) */
  if (r.error && r.error.code === "ETIMEDOUT") note = "did not finish in " + limit / 60000 + " min";
  if (flags.json) {
    try { json[flags.json] = JSON.parse(out.slice(out.indexOf("{"))); } catch (e) { json[flags.json] = null; }
    /* these report known gaps as data; their verdict is read from the report */
    if (flags.json === "golden" || flags.json === "effects") ok = r.status === 0 || json[flags.json] != null;
  }
  if (flags.reproducible && before !== null && read(path.join(REPO, flags.reproducible)) !== before) {
    ok = false; note = flags.reproducible + " changed when rebuilt: it was not up to date";
  }
  console.log(`  ${group.padEnd(10)} ${name.padEnd(26)} ${(ok ? "ok" : "FAILED").padEnd(7)} ${((Date.now() - t0) / 1000).toFixed(1).padStart(6)}s  ${note.slice(0, 50)}`);
  if (!ok) broken.push([group + " / " + name, note.slice(0, 100)]);
  /* a failed step shows the end of what it printed: in CI there is no other way to see it */
  if (!ok) out.trim().split("\n").slice(-30).forEach(l => console.log("      | " + l.slice(0, 200)));
  if (!ok && group === "build") break;
}

/* ---- Definition of Done (apps/registry/docs/DEFINITION_OF_DONE.md) ----- */
const m = {};
if (!BOOKS) {
  const g = json.golden || {};
  m.golden_failures = g.fail || 0;
  m.golden_gaps = g.gap_open || 0;
  m.fleet_golden_failures = g.fleet_fail || 0;
  m.fleet_golden_gaps = g.fleet_gap_open || 0;
  m.surface_disagreements = g.surface_disagreements || 0;
  if (g.fail) broken.push(["golden", "cases failing: " + (g.cases || []).filter(c => c.status !== "gap" && (c.points || c.profile || c.surfaces)).map(c => c.id).join(", ").slice(0, 80)]);
  if (g.fleet_fail) broken.push(["golden (fleets)", "fleet cases failing"]);
  const e = json.effects || {}, u = json.upgrades || {};
  m.effect_queue_open = e.queue_open || 0;
  m.invalid_acks = e.invalid_acks || 0;
  m.upgrade_effect_open = u.open || 0;
  if (m.invalid_acks) broken.push(["option effects", m.invalid_acks + " invalid rows in reference/options.json"]);
  /* list rules the reference has not classified */
  let open = 0, generalOpen = 0;
  for (const f of fs.readdirSync(path.join(REPO, "reference")).filter(f => /^\d\d_.*\.json$/.test(f))) {
    const ref = JSON.parse(fs.readFileSync(path.join(REPO, "reference", f), "utf8"));
    for (const r of ref.rules || []) if (r.status === "gap" || r.status === "not_shown") ref.scope === "general" ? generalOpen++ : open++;
  }
  m.unclassified_rules = open;
  m.general_rules_open = generalOpen;
  const lay = json.layout;
  if (!QUICK) {   /* --quick skips the layout run on purpose: not measured is not open work then */
    m.print_overflows = lay ? lay.print_overflows : "not measured";
    m.unreadable_print_cases = lay ? lay.unreadable_print_cases : "not measured";
  }
  console.log("=".repeat(70));
  console.log("Definition of Done");
  for (const [k, v] of Object.entries(m)) console.log(`  ${k.padEnd(26)} ${v}${v === 0 ? "" : "  <-"}`);
  if (lay) console.log(`  print: smallest text ${lay.min_pt} pt, floor ${lay.floor_pt} pt (${lay.cards} cards)`);
}
const workLeft = Object.values(m).some(v => v !== 0);
console.log("=".repeat(70));
if (broken.length) {
  console.log("VERDICT: FAIL");
  for (const [n, why] of broken) console.log(`  ${n}: ${why}`);
  process.exit(1);
}
console.log(workLeft ? "VERDICT: WORK LEFT (see the measures marked <-)" : "VERDICT: PASS");
process.exit(0);
