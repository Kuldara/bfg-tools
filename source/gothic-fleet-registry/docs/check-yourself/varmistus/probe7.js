"use strict";
const H = require("./harness.js");
const { fleet, ups, opts, bad, warns, chk, card, tryit, api } = H;
const L = nm => api.LISTS[H.li(nm)];
const rowsOf = (nm, re) => L(nm).secs.flatMap(s => s.ents.map(e => s.t + " :: " + e.l + " p" + e.p + (e.mx ? " (mx " + e.mx + ")" : "") + (e.grp ? " [" + e.grp + "]" : "") + (e.cond ? " " + JSON.stringify(e.cond) : ""))).filter(x => new RegExp(re, "i").test(x));
const T = f => { try { return f(); } catch (e) { return "VIRHE " + e.message; } };
const issues = u => (api.resolveUnit(u).issues || []).map(i => i.code + ": " + i.message);

tryit("S0485 Incursion Lord: kaksi Markia -> issues", () => T(() => { const b = fleet("Chaos — Incursion", 1500).add("^Chaos Lord", { ups: ["Mark of Slaanesh", "Mark of Khorne"] }); return issues(b.last).concat([String(api.unitPts(b.last))]); }));
tryit("S0492 BC Warmaster: kaksi Markia -> issues", () => T(() => { const b = fleet("Chaos — Black Crusade", 1500).add("Chaos Warmaster", { ups: ["Mark of Slaanesh", "Mark of Khorne"] }); return issues(b.last).concat([String(api.unitPts(b.last))]); }));
tryit("S0479 Incursion Warmaster: sama Mark kahdesti mahdoton, nelja eri ok", () => T(() => { const b = fleet("Chaos — Incursion", 1500).add("Warmaster", { ups: ["Mark of Slaanesh", "Mark of Khorne", "Mark of Tzeentch", "Mark of Nurgle"] }); return issues(b.last).concat([String(api.unitPts(b.last))]); }));
tryit("S0540 Nurgle daemonship-rivit", () => rowsOf("Chaos — Nurgle", "daemon|^DAEMONSHIPS"));
tryit("S0914 Necron sepulchre", () => rowsOf("Necrons", "sepulchre"));
tryit("S0068 Admiralille tarjotut re-rollit", () => T(() => { const b = fleet("Armageddon Sector", 1500).add("^Admiral|Fleet-admiral|Fleet Admiral"); return [b.last && api.shipOf(b.last) && "", ...ups(b.last)]; }));
tryit("S0068 MoF:lle tarjotut re-rollit", () => T(() => { const b = fleet("Armageddon Sector", 1500).add("Master of the Fleet"); return ups(b.last); }));
