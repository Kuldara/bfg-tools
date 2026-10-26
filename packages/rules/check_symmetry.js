/* Symmetry: the reserve budget depends only on the host's own ships, not on
 * WHICH list of the same race the borrowed ship came from.
 *
 * Fleets p.14: "for every three vessels of a given type which you choose
 * from the main fleet list, you may pick one vessel of that type from
 * another Imperial list". The budget's denominator is the host's own ships
 * by type, the numerator the number borrowed by type. Neither may
 * depend on the source list. If the same host, the same three own ships and one
 * borrowed cruiser give a DIFFERENT budget row depending on which
 * list of the same race the cruiser comes from, something reads the source list's
 * structure into the budget - and the player would see it as random.
 *
 * A second invariant: the same pair the other way round. If A may borrow from B and
 * B from A (same race, no ban), both directions' budget rows must
 * have the same shape - "1 / 1" with three own ships and one borrowed.
 *
 * Deterministic, no LLM. Runs the engine directly like test_domain.js.
 *
 *   node check_symmetry.js
 */
"use strict";
const fs = require("fs"), path = require("path");
const src = fs.readFileSync(path.join(__dirname, "domain.js"), "utf8");
const DOMAIN = new Function(src + "\n;return DOMAIN;")();
const catalog = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "..", "data", "bfg_data.json"), "utf8"));

const rows = L => {
  const out = [];
  L.secs.forEach((sec, si) => {
    if (sec.ct !== "type") return;
    sec.ents.forEach((en, ei) => {
      if (en.k !== "unit" || !en.r || en.p == null) return;
      const sh = catalog.ships[String(en.r)];
      out.push({ si, ei, en, sec, rt: sh ? sh.rt : null });
    });
  });
  return out;
};
const mk = (L, at, role) => ({
  schemaVersion: 3, role: role || "core",
  entry: { list: L.nm, section: L.secs[at.si].t, label: at.en.l },
  ref: at.en.r == null ? null : String(at.en.r),
  hull: at.en.hc ? String(at.en.r) : null,
  hulls: 1, name: "", note: "", adjust: 0,
  custom: at.en.p == null && !at.en.hc ? 0 : null,
  members: [], options: {}, upgrades: {} });
const run = (L, units) => DOMAIN.resolveFleet({ list: L.nm, limit: 100000, units }, catalog);
const budgetRows = F => F.checks.filter(c => /^Reserves \(/.test(c.t)).map(c => c.t + " = " + c.v + " ok=" + c.ok);

let checks = 0, fails = 0;
const fail = (what, detail) => { fails++; console.log("  FINDING " + what + "\n         " + detail); };

/* 1. The same host, two different sources of the same race, the same ship type. */
catalog.lists.forEach(host => {
  if (!host.race || host.res_ban) return;
  const donors = catalog.lists.filter(d => d.nm !== host.nm && d.race === host.race && !d.res_ban);
  if (donors.length < 2) return;
  const own = rows(host).find(r => r.rt);
  if (!own) return;
  const base = [mk(host, own), mk(host, own), mk(host, own)];
  /* the sources' rows of the same type as the host's own row */
  const cands = donors.map(d => ({ d, r: rows(d).find(x => x.rt === own.rt) })).filter(x => x.r);
  if (cands.length < 2) return;
  const results = cands.map(({ d, r }) => ({ d, rows: budgetRows(run(host, base.concat([mk(d, r, "reserve")]))) }));
  checks++;
  const first = JSON.stringify(results[0].rows);
  results.slice(1).forEach(x => {
    if (JSON.stringify(x.rows) !== first)
      fail("the budget row depends on the source list: " + host.nm,
           results[0].d.nm + " -> " + first + "  vs  " + x.d.nm + " -> " + JSON.stringify(x.rows));
  });
});

/* 2. The same pair in both directions. */
const seen = {};
catalog.lists.forEach(A => catalog.lists.forEach(B => {
  if (A.nm >= B.nm || !A.race || A.race !== B.race || A.res_ban || B.res_ban) return;
  const ra = rows(A), rb = rows(B);
  const rt = (ra.find(x => x.rt) || {}).rt;
  const a3 = ra.find(x => x.rt === rt), b1 = rb.find(x => x.rt === rt);
  const b3 = rb.find(x => x.rt === rt), a1 = ra.find(x => x.rt === rt);
  if (!a3 || !b1 || !b3 || !a1) return;
  const ab = budgetRows(run(A, [mk(A, a3), mk(A, a3), mk(A, a3), mk(B, b1, "reserve")]));
  const ba = budgetRows(run(B, [mk(B, b3), mk(B, b3), mk(B, b3), mk(A, a1, "reserve")]));
  checks++;
  const shape = r => r.map(s => s.replace(/^Reserves \([^)]*\)/, "Reserves (T)"));
  if (JSON.stringify(shape(ab)) !== JSON.stringify(shape(ba)))
    fail("the pair is not symmetric: " + A.nm + " <-> " + B.nm,
         "A+B: " + JSON.stringify(ab) + "   B+A: " + JSON.stringify(ba));
  seen[A.nm + "|" + B.nm] = 1;
}));

console.log("check_symmetry: %d comparisons, %d findings", checks, fails);
process.exit(fails ? 1 : 0);
