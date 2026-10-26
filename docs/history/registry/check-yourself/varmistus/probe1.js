"use strict";
const H = require("./harness.js");
const { fleet, ups, opts, bad, chk, card, tryit } = H;

// --- komentajamaarat: kaksi komentajaa -> punainen?
const two = (list, re, limit) => () => { fleet(list, limit || 1500).add(re).add(re); return bad(); };
tryit("S0020 Gothic 2x Admiral", two("Imperial Navy — Gothic Sector", "^Admiral|Fleet Admiral|Solar Admiral"));
tryit("S0066 Armageddon 2x commander", two("Armageddon Sector", "admiral"));
tryit("S0140 Codex 2x MoF", two("Codex Astartes", "Master of the Fleet"));
tryit("S0267 AdMech 2x Archmagos", two("Explorator", "Archmagos"));
tryit("S0615 Corsairs 2x Pirate Prince", two("Eldar Corsairs — Gothic Sector", "Pirate Prince"));
tryit("S0638 Iyanden 2x Autarch", two("Iyanden", "Autarch"));
tryit("S0713 DE 2x Archon", two("Dark Eldar", "Archon"));
tryit("S0796 Waaagh 3x Warlord @1000", () => { fleet("Orks — Waaagh!", 1000).add("Warlord").add("Warlord").add("Warlord"); return bad(); });
tryit("S0835 Clanz 0 Warlord @1500 (minimi?)", () => { fleet("Da Ork Clanz", 1500).add("Kill Kroozer|Kroozer"); return chk("warlord"); });
tryit("S0835 Clanz 1 Warlord @1500", () => { fleet("Da Ork Clanz", 1500).add("Warlord").add("Kill Kroozer|Kroozer"); return chk("warlord"); });

// --- korttivaitteet
tryit("S0002 IN carrier card launch speed", () => { const b = fleet("Imperial Navy — Gothic Sector").add("Dictator"); const c = card(b.last); return [/30 ?cm/.test(c), /Fury|Starhawk|20 ?cm/.test(c), c.slice(0, 0)]; });
tryit("S0021 Admiral card re-roll included", () => { const b = fleet("Imperial Navy — Gothic Sector").add("^Admiral"); const c = card(b.last); return c.match(/re-?roll[^.]{0,80}/i) || "ei re-roll-tekstia"; });
tryit("S0029/30 Ordo Malleus commander card", () => { const b = fleet("Imperial Navy — Gothic Sector").add("Ordo Malleus"); const c = card(b.last); return [/\+1 to its leadership|Leadership/i.test(c), /Hit and Run|hit-and-run|H&R/i.test(c), /hexagrammic/i.test(c)]; });
tryit("S0115/S0117 SM strike cruiser card", () => { const b = fleet("Codex Astartes").add("Strike Cruiser"); const c = card(b.last); return [/\+2/.test(c) && /boarding/i.test(c), /boarding torpedo/i.test(c)]; });
tryit("S0239 AdMech SM-saattaja kortti", () => { const L = H.api.LISTS[H.li("Explorator")]; const esc = L.secs.flatMap(s => s.ents).filter(e => /gladius|nova|hunter|firestorm/i.test(e.l)).map(e => e.l); if (!esc.length) return "ei SM-saattajia listalla: " + L.secs.map(s=>s.t).join(","); const b = fleet("Explorator").add(esc[0]); const c = card(b.last); return [esc[0], "astartes boarding +2: " + (/Space Marine[^.]*\+2|\+2 to their D6 roll/i.test(c))]; });
tryit("S0063 Bastion Chaos-reservi kortti", () => { const b = fleet("Bastion Fleets").add("Murder|Carnage|Hades"); const c = card(b.last); return /strange happenings|unreliable/i.test(c) ? "strange happenings kortilla" : "EI kortilla"; });
tryit("S0319 Ordo Xenos + xenos-liittolainen kortti", () => { const b = fleet("Imperial Navy — Gothic Sector").add("Ordo Xenos"); const c = card(b.last); return /Deathwatch/i.test(c) ? (c.match(/[^.]*Deathwatch[^.]*/i) || [""])[0].slice(0, 160) : "ei Deathwatch-mainintaa"; });
