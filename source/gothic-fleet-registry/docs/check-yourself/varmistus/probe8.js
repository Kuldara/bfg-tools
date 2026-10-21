"use strict";
const H = require("./harness.js");
const { fleet, ups, opts, bad, chk, tryit, api } = H;
const T = f => { try { return f(); } catch (e) { return "VIRHE " + e.message; } };
tryit("S0490 Chaos renegade Lunar: optiot/paivitykset", () => T(() => { const b = fleet("Chaos — Incursion", 2000).add("Lunar|Dauntless|Endeavour"); const R = api.resolveUnit(b.last); return [ "options forbidden: " + (R.options||[]).map(o=>o.forbidden).join(","), "ups: " + ups(b.last).join(" | ") ]; }));
tryit("S0381 Exploration: liittolais-battleship ilman kolmea liittolaista", () => T(() => { const b = fleet("Rogue Traders — Exploration", 3000); for (let i=0;i<3;i++) b.add("Rogue Trader Cruiser"); b.add("Retribution|Emperor|Oberon", { from: "Imperial Navy — Gothic Sector", role: "ally" }); return bad().concat(chk("allied")); }));
tryit("S0382 Exploration: liittolaisen erikoishahmo", () => T(() => { const b = fleet("Rogue Traders — Exploration", 3000); for (let i=0;i<3;i++) b.add("Rogue Trader Cruiser"); b.add("Admiral", { from: "Imperial Navy — Gothic Sector", role: "ally" }); return bad(); }));
tryit("S0256 AdMech: reservisaattaja eri listalta kuin reservicruiser", () => T(() => { const b = fleet("Explorator", 3000).add("Gothic").add("Gothic").add("Gothic").add("Lunar", { from: "Imperial Navy — Gothic Sector" }).add("Sword|Cobra", { from: "Bastion Fleets" }); return bad(); }));
