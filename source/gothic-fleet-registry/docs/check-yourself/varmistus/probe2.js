"use strict";
const H = require("./harness.js");
const { fleet, ups, opts, bad, chk, card, tryit, api } = H;
const L = nm => api.LISTS[H.li(nm)];
const rowsOf = (nm, re) => L(nm).secs.flatMap(s => s.ents.map(e => s.t + " :: " + e.l)).filter(x => new RegExp(re, "i").test(x));

tryit("S0002 Dictator card launch", () => { const b = fleet("Imperial Navy — Gothic Sector").add("Dictator"); const c = card(b.last); return (c.match(/.{0,60}launch.{0,80}/ig) || []).slice(0, 3); });
tryit("S0319 Ordo Xenos card (Inquisition)", () => { const b = fleet("Emperor's Inquisition").add("Ordo Xenos"); const c = card(b.last); return /Deathwatch/i.test(c) ? (c.match(/[^.]*Deathwatch[^.]*/ig) || []).slice(0, 2).map(s => s.slice(0, 200)) : "ei Deathwatch-mainintaa"; });

// rivit, joita ei saa tarjota
tryit("S0122 SM escort Thunderhawk-rivi?", () => { const b = fleet("Codex Astartes").add("Gladius|Nova|Hunter"); return ups(b.last).concat(opts(b.last)).filter(x => /thunderhawk/i.test(x)).concat(["(tarjottuja thunderhawk-riveja yllä)"]); });
tryit("S0189 AdMech capital: assault boat / boarding torpedo -rivit", () => { const out = []; ["Emperor", "Oberon", "Gothic", "Lunar", "Retribution"].forEach(s => { try { const b = fleet("Explorator").add(s); out.push(s + ": " + ups(b.last).concat(opts(b.last)).filter(x => /assault boat|shark|boarding torpedo/i.test(x)).join(" | ")); } catch (e) { out.push(s + ": " + e.message); } }); return out; });
tryit("S0991/S1009 Tyranid: torpedo bombers / torpedo refits", () => { const b = fleet("Tyranids — Hive Fleet").add("Hive Ship"); return ups(b.last).concat(opts(b.last)).filter(x => /torpedo/i.test(x)); });
tryit("S0517/533/543/552 Lord mark rows", () => ["Tzeentch", "Nurgle", "Khorne", "Slaanesh"].map(g => g + ": " + rowsOf("Chaos — " + g, "^Chaos Lords :: ").join(" | ")));
tryit("S0278 AdMech special torpedoes rows", () => { const b = fleet("Explorator").add("Gothic"); return ups(b.last).concat(opts(b.last)).filter(x => /torpedo/i.test(x)); });
tryit("S0235 AdMech Endeavour prow armour option", () => { const b = fleet("Explorator").add("Endeavour"); return opts(b.last).filter(x => /prow armour|6\+/i.test(x)); });
tryit("S0716 DE Corsair escort Mimic Engines", () => { const b = fleet("Dark Eldar").add("Corsair"); return opts(b.last).concat(ups(b.last)).filter(x => /mimic/i.test(x)); });
tryit("S0143 MoF Terminator row", () => rowsOf("Codex Astartes", "terminator"));
tryit("S0152 Crusade Honour Guard on barge/strike/escort", () => ["Battle Barge", "Strike Cruiser", "Gladius|Nova|Hunter"].map(s => { const b = fleet("Space Marines — Crusade").add(s); return s + ": " + ups(b.last).filter(x => /honour/i.test(x)).join(" | "); }));
tryit("S0162 Dominion SM captain + Honour Guard on IN ship", () => { const b = fleet("Dominion"); const rows = rowsOf("Dominion", "captain|honour"); return rows; });
tryit("S0512 CSM crew Thunderhawk row", () => rowsOf("Chaos — Black Crusade", "thunderhawk").concat(rowsOf("Chaos — Nurgle", "thunderhawk")));
tryit("S0334 GK Terminators: kahdelle GK-alukselle?", () => { const b = fleet("Grey Knights").add("Strike Cruiser", { ups: ["Grey Knights Terminators"] }).add("Strike Cruiser", { ups: ["Grey Knights Terminators"] }); return bad(); });
tryit("S0335 GK Honour Guard Blackshipille?", () => { const b = fleet("Grey Knights").add("Blackship"); return ups(b.last).filter(x => /honour/i.test(x)); });
tryit("S0102 Bakka: AdMech-reservi + Fleet Defence Turret", () => { const b = fleet("Bakka", 2000).add("Lunar").add("Lunar").add("Lunar").add("Gothic|Lunar", { from: "Explorator" }); return ups(b.last).filter(x => /defence turret|turret/i.test(x)); });
tryit("S0003 Power Ram Lunarilla vs Nova-aluksella", () => { const out = []; ["Lunar", "Tyrant", "Gothic"].forEach(s => { const b = fleet("Imperial Navy — Gothic Sector").add(s); out.push(s + ": " + ups(b.last).filter(x => /ram/i.test(x)).join("|")); }); return out; });
tryit("S1102 Tau Aun'el ilman komentajaa", () => { const b = fleet("Tau — Merchant Fleet").add("Merchant"); return rowsOf("Tau — Merchant Fleet", "aun"); });
