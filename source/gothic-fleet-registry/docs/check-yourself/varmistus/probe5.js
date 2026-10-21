"use strict";
const H = require("./harness.js");
const { fleet, ups, opts, bad, warns, chk, card, tryit, api } = H;
const L = nm => api.LISTS[H.li(nm)];
const rowsOf = (nm, re) => L(nm).secs.flatMap(s => s.ents.map(e => s.t + " :: " + e.l + (e.mx ? " (mx " + e.mx + ")" : "") + (e.grp ? " [" + e.grp + "]" : ""))).filter(x => new RegExp(re, "i").test(x));
const T = f => { try { return f(); } catch (e) { return "VIRHE " + e.message; } };

tryit("ups Murder (Incursion)", () => T(() => ups(fleet("Chaos — Incursion", 2000).add("Murder").last)));
tryit("S0345 RT veteran checks", () => T(() => { fleet("Rogue Traders", 2000).add("Rogue Trader Cruiser").add("Veteran Rogue Trader").add("Veteran Rogue Trader"); return chk("veteran"); }));
tryit("S0407 Pirates xenos-laivue 1 alus", () => T(() => { fleet("Pirates", 2000).add("Lunar").add("Xenos Vessel$", { n: 1 }); return chk("squadron|xenos|alien"); }));
tryit("Daemonship-rivit Chaos-listoilla", () => ["Incursion", "Tzeentch", "Nurgle", "Khorne", "Slaanesh", "Black Crusade"].map(g => g + ": " + rowsOf("Chaos — " + g, "daemon|mark of").slice(0, 12).join(" ; ")));
