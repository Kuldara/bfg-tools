/* Formatting shared by the Registry and Play: faction colours, the short forms
   a card uses, HTML escaping, point labels and the list line of a unit. */
import DOMAIN from "../rules/domain.js";

/* Faction colours. Orks, Adeptus Mechanicus, Tyranids, Necrons and Chaos are
   the exact pair used by the project's printed ship cards; the rest follow the
   same recipe (near-black hull colour + a readable mid tone) so every list in
   the book gets its own identity. First match wins, so put narrow patterns
   before wide ones. */
export const FACTION_COLS = [
  [/dark eldar/i,                     "#1A1424", "#4A3A6B"],
  [/ork/i,                            "#183625", "#47764C"],
  [/mechanicus/i,                     "#4B1018", "#8B2635"],
  [/tyranid/i,                        "#351747", "#824594"],
  [/necron/i,                         "#123735", "#277369"],
  [/chaos/i,                          "#24152E", "#63376F"],
  [/eldar/i,                          "#12303F", "#2C6A8C"],
  [/tau|demiurg|kroot/i,              "#33240C", "#8C6520"],
  [/grey knights/i,                   "#1E252E", "#5C6675"],
  [/space marine/i,                   "#22303A", "#46626F"],
  [/inquisition/i,                    "#1C1618", "#5A403F"],
  [/rogue trader|merchant|commerce/i, "#2E2A1A", "#6E6338"],
  [/imperial|navy/i,                  "#14243F", "#2E4C7E"],
];
/* The colour marks the fleet, so it comes from the fleet list. Matching
   "list name + ship faction" as one string let the first regex in the
   table win regardless of which half it matched, and a Grey Knights fleet
   printed in four different colours. A ship's own faction is only a
   fallback for a list nothing matches. */
export function factionCols(name, fallback){
  for(const [re, d, m] of FACTION_COLS) if(re.test(name)) return [d, m];
  if(fallback)
    for(const [re, d, m] of FACTION_COLS) if(re.test(fallback)) return [d, m];
  return ["#1F2A22", "#4A5B4E"];
}
/* The target card writes armour in the short form "6+/5+/4+"; the book's
   profile has "6+ front / 5+ sides / 4+ rear", which does not fit the cell
   width. Take the values alone, in their original order. */
/* On a launch bay row the book's range reads "Fighta-Bommas: 25 cm / Assault
   Boats: 30 cm". On the target card it is "25/30cm". */
export function shortRange(r){
  const t = String(r || "").replace(/(\d)\s*[\u2013-]\s*(\d+)\s*cm/, "$1\u2013$2cm");
  const m = t.match(/\d+(?=\s*cm)/g);
  /* A multi-value range collapses to the numbers alone. The unit is dropped:
     the header already says Range, and "cm" did not fit the column four times
     over. The craft names live in the launch bay rule in the SPECIAL block. */
  return (m && m.length > 1) ? m.join("/") : t;
}
export function shortArmour(a){
  const m = String(a || "").match(/\d\+/g);
  return m && m.length > 1 ? m.join("/") : String(a || "");
}
/* Arc as a picture. The letter code did not fit the column, and a wedge
   diagram is also faster to read. "Quadrant" and "All round" both mean the
   firer picks the arc, so they draw the same. */
export function arcParts(a){
  const t = String(a || "").trim().toLowerCase();
  if(!t || t === "\u2013" || t === "-") return null;
  if(/all\s*a?round|quadrant/.test(t)) return {f:1, r:1, a:1, l:1, pick:1};
  const p = {f: /front/.test(t) ? 1 : 0, r: /right/.test(t) ? 1 : 0,
             a: /rear|aft/.test(t) ? 1 : 0, l: /left/.test(t) ? 1 : 0};
  if(!(p.f || p.r || p.a || p.l)) return null;
  p.pick = (p.f + p.r + p.a + p.l) > 1 ? 1 : 0;
  return p;
}
export const ARC_WEDGE = [
  ["f", "M6,6L2.46,2.46A5,5 0 0 1 9.54,2.46Z"],
  ["r", "M6,6L9.54,2.46A5,5 0 0 1 9.54,9.54Z"],
  ["a", "M6,6L9.54,9.54A5,5 0 0 1 2.46,9.54Z"],
  ["l", "M6,6L2.46,9.54A5,5 0 0 1 2.46,2.46Z"]
];
export function arcGlyph(a){
  const p = arcParts(a);
  if(!p) return '<span class="noarc">\u2013</span>';
  return '<svg class="arcg" viewBox="0 0 12 12" aria-hidden="true">' +
    ARC_WEDGE.map(w => '<path d="' + w[1] + '" class="' +
      (p[w[0]] ? (p.pick ? "pick" : "on") : "") + '"/>').join("") +
    '<circle cx="6" cy="6" r="5"/></svg>';
}
export function shortShield(v){
  const t = String(v || "");
  if(/^holofields?$/i.test(t)) return "HOLO";
  if(/^shadowfields?$/i.test(t)) return "SHADOW";
  return t;
}

/* A ship option's text as a short line beside the others (user 8.11.2026:
   "shorten these million-word texts like the rest; the hover shows the raw
   text"). The price is in its own column and the list conditions are the
   builder's to apply, so both go; what is left is the change itself. Pure:
   the book's text stays in R.options[].text for the card and the hover. */
export const OPT_SHORT = [
  /* first match wins: put narrow patterns before wide ones */
  [/power ram/i, "Power ram"],
  [/may carry squadrons of Shark assault boats/i, "Shark assault boats"],
  [/^May be equipped with Shark assault boats/i, "Shark assault boats"],
  [/^May replace its Nova Cannon with Strength 9 torpedo/i, "Torpedoes (Str 9) instead of nova cannon"],
  [/^Can replace its Nova Cannon with strength 6 torpedoes/i, "Torpedoes (Str 6) instead of nova cannon"],
  [/shorter range but more powerful weapons batteries/i, "Batteries 30 cm, firepower 10"],
  [/retrofitted with a targeting matrix/i, "Targeting matrix: batteries shift left"],
  [/third turret|turret array upgraded from 2 to 3|upgrade its turrets from two to three/i, "Third turret"],
  [/improved weapons batteries.*60 cm/i, "Batteries 45 \u2192 60 cm"],
  [/prow torpedoes (?:with|for) a nova cannon/i, "Nova cannon instead of prow torpedoes"],
  [/^The Overlord battlecruiser is based on the Acheron/i, "Acheron targeting: batteries shift left"],
  [/^Originally fitted with 45cm range weapons batteries/i, "Earlier version: batteries 45 cm, firepower 6"],
  [/replace its 30 cm range weapons batteries with 45 cm/i, "Batteries 30 \u2192 45 cm"],
  [/^May increase the prow armour to 6\+/i, "Prow armour 6+ (turns 45\u00b0)"],
  [/replace their prow lances with prow torpedoes/i, "Prow torpedoes (Str 6) instead of lances"],
  [/experimental long range detection gear/i, "Long range detection gear (no batteries)"],
  [/launch bays (?:for|with) (?:a )?Strength 6,? speed:? ?30 cm torpedo/i, "Torpedoes (Str 6) instead of launch bays"],
  [/launch bays for a Firepower 5, range 30 cm \(front arc only\) bombardment/i, "Bombardment cannon instead of launch bays"],
  [/prow bombardment cannon for a Strength 1, range: 30 cm lance/i, "Prow lance instead of bombardment cannon"],
  [/^May take an additional shield/i, "Additional shield"],
  [/^The Omnissiah\u2019s Victory represents/i, "Unique Ark Mechanicus"],
  [/plasma-boosters/i, "Plasma-boosters: batteries 45 cm"],
  [/prow torpedoes with a single 30 cm range dorsal lance/i, "Dorsal lance instead of prow torpedoes"],
  [/dorsal bombardment cannon for Strength 2, range: 45 cm lances/i, "Lances instead of dorsal bombardment cannon"],
  [/one refit from the Xenotech systems table/i, "Xenotech refit"],
  [/^Fuel Tanker:/i, "Fuel tanker"],
  [/^Repair Tender/i, "Repair tender"],
  [/^Super-Heavy Transport/i, "Super-heavy transport (+4 HP)"],
  [/^Xenotech system \(free, choose one\) \u2014 Long Range Sensors/i, "Xenotech: Long Range Sensors"],
  [/^Xenotech system \(free, choose one\) \u2014 Targeting Matrix/i, "Xenotech: Targeting Matrix"],
  [/^Xenotech system \(free, choose one\) \u2014 Advanced Shielding/i, "Xenotech: Advanced Shielding"],
  [/^Xenotech system \(free, choose one\) \u2014 Ship Defense Grid/i, "Xenotech: Ship Defense Grid"],
  [/^Xenotech system \(free, choose one\) \u2014 Advanced Drive Technology/i, "Xenotech: Advanced Drive Technology"],
  [/^Xenotech system \(free, choose one\) \u2014 Gravitic Thrusters/i, "Xenotech: Gravitic Thrusters"],
  [/^Fast Clipper:/i, "Fast clipper (no primary battery)"],
  [/led by a Chaos Lord having \+1 leadership/i, "Chaos Lord (+1 Ld)"],
  [/^Can embark Chaos Space Marines/i, "Chaos Space Marines"],
  [/embark Chosen Terminators/i, "Chosen Terminators"],
  [/port and starboard weapons battery for range 45 cm, Firepower 8/i, "Broadside batteries 45 cm, firepower 8"],
  [/port and starboard weapons battery for range 30 cm, Firepower 10/i, "Broadside batteries 30 cm, firepower 10"],
  [/prow lance battery for Strength 8 torpedo|prow lances with Strength 8 torpedoes/i, "Torpedoes (Str 8) instead of prow lances"],
  [/dorsal lance battery for range 45 cm, strength 4/i, "Dorsal lances 45 cm, strength 4"],
  [/improved thrusters and may move 5D6/i, "Improved thrusters: 5D6 on All Ahead Full"],
  [/ancient targeting systems.*dorsal lances to 45 cm/i, "Dorsal lances 45 cm"],
  [/third shield.*60 mm base/i, "Third shield (60 mm base)"],
  [/Firepower 10 weapons batteries with Firepower 4 weapons batteries and Strength 2 lance/i, "Batteries 4 + lances 2 instead of firepower 10"],
  [/may take Vampire raiders/i, "Vampire raiders"],
  [/boarding torpedoes for \+\d+ pts \(speed 20 cm/i, "Boarding torpedoes"],
  [/torpedo bommas/i, "Torpedo bommas"],
  [/prow heavy gun battery with a torpedo launcha/i, "Torpedo launcha instead of prow heavy gunz"],
  [/^If fitted with a torpedo launcha, it may carry boarding torpedoes/i, "Boarding torpedoes (with the launcha)"],
  [/^Prow \u2014 torpedo launcha instead of heavy gunz/i, "Prow torpedo launcha instead of heavy gunz"],
  [/^Prow \u2014 additional D6 gunz/i, "Prow +D6 gunz"],
  [/equipped with Klaws/i, "Klaws"],
  [/upgraded to carry a Sepulchre/i, "Sepulchre (one tombship)"],
  [/^Port\/starboard set (\d) \u2014 Bio-plasma discharge/i, "Broadside set $1: bio-plasma discharge"],
  [/elect to become fire ships/i, "Fire ship (up to 10 % of drones)"],
  [/Il\u2019fannors .*increase their hits from 4 to 6/i, "Hits 4 \u2192 6"],
  [/deflector that raises its prow armour to 6\+/i, "Deflector: prow armour 6+"],
  [/^Gravitic hook/i, "Gravitic hook"],
  [/^Manufacturing & Research module/i, "Manufacturing & Research module"],
  [/Warsphere may add 2HP and 2 firepower/i, "+2 HP and +2 firepower"],
  [/Warsphere may subtract 2HP and 2 firepower/i, "\u22122 HP and \u22122 firepower"],
  [/Warspheres 10HP or greater may also add \+1 shield/i, "+1 shield (10 HP or more)"],
  [/Warspheres 10HP or greater may \+1 turret/i, "+1 turret (10 HP or more)"],
  [/extend the range of its weapons battery by \+15 cm/i, "Battery range +15 cm (10 HP or more)"]
];
export function shortOptText(text){
  const raw = String(text || "").trim();
  const hit = OPT_SHORT.find(x => x[0].test(raw));
  if(hit) return hit[1].indexOf("$") >= 0 ? raw.match(hit[0])[0].replace(hit[0], hit[1]) : hit[1];
  if(raw.length <= 40) return raw.replace(/\.$/, "");
  /* a text the table does not know yet (a new book version): its first
     sentence, cut at a word - test_upgrades.js asks for a table row */
  const t = raw.split(/(?<=[.;])\s+/)[0].replace(/[.;]$/, "");
  return t.length <= 48 ? t : t.slice(0, 47).replace(/\s+\S*$/, "") + "\u2026";
}

/* A cost of zero is free; a missing cost is unknown; a negative cost makes
   the ship cheaper. Four options in the book are negative, and printing
   "+-20" for them would be nonsense. */
export function optCostLabel(c){
  if(c == null) return "see text";
  if(!c) return "free";
  return (c < 0 ? "\u2212" : "+") + Math.abs(c);
}

/* -------------------------------------------------------------- view ---- */
export function esc(s){ return String(s == null ? "" : s)
  .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"); }
/* A word also starts after an opening quote: 'Bastion' Commerce Vessel (Fleets p. 489). */
export function title(s){ return String(s||"").toLowerCase().replace(/(^|[\s(\-\u2013/\u2018])([a-z])/g,
  (m,a,b) => a + b.toUpperCase())
  /* a mark number stays Roman: "Mk XXIV" (Explorer p.458), not "Mk Xxiv" */
  .replace(/\b(Mk|Mark)\s+([ivxlc]+)\b/gi, (m,a,b) => a + " " + b.toUpperCase()); }

export function starHTML(refs){
  return DOMAIN.uniqRefs(refs || []).map(r =>
    `<b class="ast" style="--ast:${r.color}" data-rule="${esc(r.id)}" title="${esc(r.id.replace(/_/g," "))}">*</b>`
  ).join("");
}

/* Price text for a list upgrade from the resolved row: multiplier and
   result both, because "+10 / bay" alone does not help you add up points. */
export function upCostText(up){
  /* a Da Ork Clanz tiddla skwadron's clan or Gubbin, bought once for the
     skwadron and paid on another of its rows (ruling T60) */
  if(up.shared) return "paid on " + up.shared;
  if(up.price == null) return "see text";
  if(!up.price) return "free";
  const sign = up.price > 0 ? "+" : "";
  if(up.per === "hull")
    return sign + up.price + " / ship = " + sign + up.cost;
  if(up.per === "bay")
    return sign + up.price + " x " + up.bays.n + " bays" + (up.ships > 1 ? " x " + up.ships + " ships" : "") +
      " = " + sign + up.cost + (up.bays.exact ? "" : " (check)");
  return sign + up.price;
}
/* The ship card from the resolved unit alone (docs/DOMAIN_CONTRACT.md,
   P1-8d): no catalogue, no fleet state, no calculators - only presentation
   helpers (esc, title, wepClass, shortX, arcGlyph, starHTML, factionCols). */
/* The card's PTS box is written in by hand while a choice is still open on
   the card: an offered option or upgrade prints an empty box the player may
   tick, so the total is not known yet. With nothing left open - no options,
   or every option and upgrade taken or hidden - the total is known and the
   card prints it (user request 10.9.2026). A variable-cost option or an open
   list price keeps the box empty. */
export function fixedCardPoints(R){
  if(R.points == null || (R.entry && R.entry.openPrice)) return "";
  /* An option that cannot be taken as things stand is no open choice: its
     choose-one group is full (the nova cannon or the power ram, Fleets v0.40
     p.69), it needs an option not taken, a taken row rules it out, or the
     list bans it. */
  const opts = R.options || [];
  const closed = o => o.forbidden || (o.blockedBy && o.blockedBy.length) || o.dependencyMet === false ||
    (o.group && opts.filter(p => p.group === o.group && p.state === "take").length >= (o.groupMax || 1));
  const open = opts.some(o => (o.state === "opt" && !closed(o)) || (o.state === "take" && o.variable)) ||
               (R.upgrades || []).some(u => u.state === "opt");
  return open ? "" : String(R.points);
}

/* One Copy-list entry from the resolved unit (P1-8d). */
export function listLineOf(R){
  let s = "\u2022 " + (R.name ? R.name + " \u2014 " : "") + title(R.className);
  if(R.hulls > 1) s += " \u00d7 " + R.hulls;
  s += "  " + R.points + " pts";
  if(R.kind === "commander" && R.rerolls && R.rerolls.text) s += " \u00b7 " + R.rerolls.text;
  if(R.kind === "ship" && R.rerolls && R.rerolls.total) s += " \u00b7 " + R.rerolls.text;
  R.options.forEach(o => { if(o.state === "take") s += "\n    \u2013 " + o.text; });
  /* Everything that was paid for, so the total can be checked by the
     reader. The roster print already listed these; the copy did not, and
     the two exports told different stories about one fleet. */
  R.upgrades.forEach(up => {
    if(up.state !== "take") return;
    s += "\n    \u2013 " + title(up.label) + " (" + upCostText(up) + ")";
  });
  if((R.note || "").trim())
    s += "\n    \u2013 " + R.note.trim() +
         (R.adjust ? " (" + (R.adjust > 0 ? "+" : "") + R.adjust + ")" : "");
  return s;
}
