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
  const open = (R.options || []).some(o => o.state === "opt" || (o.state === "take" && o.variable)) ||
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
