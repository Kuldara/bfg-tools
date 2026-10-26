/* ================== P1-8b step 6: damage and rules model ==================
   Moved from the old single-file page as they were; the only change is that every
   function which read the fleet list through the global L() now takes the
   list as its last argument. Colour codes ride along inside the rule
   definitions - they are identifiers the card maps to CSS, not layout. */
export const WEP = [
  /* The badge groups a row by HOW IT RESOLVES, and the card prints no key
     for the letters, so the colour carries the grouping and the row's star
     points at the rule below that names the exceptions. Two weapons resolve
     as lances without the word in their name, and both used to fall through
     to the weapon-battery default, reading on the card exactly like the
     Pyro-acid battery beside them: "Bio-plasma: hits like a lance on 4+"
     (Fleets p. 419) and "Gauss Particle Whip: fires as a lance" (p. 400).
     Pyro-acid and the Lightning Arc stay batteries, because the book calls
     each one "a weapon battery" (pp. 420, 400) - the default is right for
     them and only for them. */
  /* Warp cannons "roll 1 dice per point of Strength and require a 4+ to hit,
     like a lance" (Fleets p. 284), and the Armageddon gun is fired with the
     Nova template (p. 252): both read as weapon batteries until the user
     asked for the lance and the nova colours (9.10.2026). */
  [/lance|bio-plasma|particle whip|ion cannon|warp cannon/i, "L", "#1F6F8B", "#DCEAF0"],
  [/nova cannon|bombardment|armageddon gun/i, "N", "#A33A2E", "#F6DFDB"],
  /* Ork heavy gunz are weapon batteries (Fleets p. 360) and keep the G, but
     they are short-ranged and every hit is two: the row must not read as the
     gunz battery beside it. Its own colour, halfway between the nova
     cannon's red and the gunz' yellow, still a pastel (user 12.10.2026:
     "not a hazard colour but a colour between the nova cannon and the gunz
     yellow, still a pastel"). The hazard stripes of 9.10. are gone; a fifth field
     here would still name a pattern for wepClass to pass on. */
  [/heavy gunz/i,                   "G", "#A65A20", "#F7CFAD"],
  /* The Tau gravitic launcher is not a gun: "Ships with gravitic launchers are
     armed with Tau missiles" (Fleets p. 450), and those missiles are ordnance -
     they are placed, move 20-40 cm and lose Strength as they go (pp. 450-451).
     It resolved as a weapon battery by default, beside the railgun batteries
     that really are one (user 20.9.). */
  [/torpedo|gravitic launcher/i,    "T", "#5B646D", "#E5E8EA"],
  /* Orbital mines replace the launch bays' attack craft (Fleets p. 23): an
     own badge, so a mine row never reads as fighters or bombers (J21). */
  [/orbital mine/i,                 "M", "#6B6E1C", "#EEF0D8"],
  [/launch bay|attack craft|bays/i, "O", "#70469A", "#E9DEF3"],
  /* A gravitic hook carries an escort, it does not shoot: "gravitic hooks have
     no effect in game terms - ships do not start a game attached to their
     parent ship, and can never be docked during a game" (Fleets p. 450). The
     number still matters when building the fleet - a Tau fleet may not have
     more Orcas and Wardens than its hooks - so the row stays on the card with
     a badge of its own, in the same teal its rule already uses. */
  [/gravitic hook/i,                "H", "#00806F", "#D8EDE8"],
  /* Contact weapons. The Ork spelling "klaw" was here but not the Tyranid
     "claws", so Massive Claws and Feeder Tentacles - both "on contact", both
     Strength "Spec." - carried the weapon-battery badge (Fleets pp. 419-420).
     The Impaler is an assault module with a Hit & Run of its own (p. 346).
     /torpedo/ is tested before this line, so Boarding torpedoes stay T. */
  [/ram|klaw|claw|tentacle|boarding|impaler/i, "R", "#7A5230", "#EFE2D4"],
  /* This line used to read /pulse|railgun|ion / and so painted three weapons
     one colour that the book classes three different ways: "Ion Cannon:
     functions as a lance in all respects" (Fleets p. 450) - now with the
     lances; "Railgun Battery: functions as a standard weapon battery"
     (p. 450) - now the default, like every other battery; and the Star Pulse
     Generator, which is neither: "one attack against every non-Necron target
     within 20 cm" (p. 400). Only the last one is left here, and it keeps a
     badge of its own for the same reason the orbital mine has one. */
  [/star pulse/i,                   "P", "#2E6B4A", "#DFEDE2"],
];
export function wepClass(name){
  for(const [re, l, b, w, p] of WEP) if(re.test(name)) return p ? [l, b, w, p] : [l, b, w];
  return ["G", "#A97913", "#F4E5BC"];
}

/* The range cell of the printed card (v1.2; owner 10-12 Oct 2026: "the 15,
   30, 45, 60 cm ranges and beyond could be coded by colour and shape somehow
   ... and the range value more visible"). A row with one range prints the number alone
   in a frame whose colour says how far it reaches: up to 15, 30, 45 and 60 cm,
   and beyond. The bands are a reading aid, not a rule - the book has no such
   classes - and a value between two of them takes the next one up (a 20 cm
   boarding torpedo reads with the 30s). The colours stay apart for a
   colour-blind reader (the Okabe-Ito set, its orange and green darkened).
   The unit moves to the column heading. A cell with several values (the
   speeds of a launch bay's attack craft), "Contact" and a dash are not one
   range: null, and the card prints the text as before. */
export const RANGE_BANDS = [[15, "#C4550A"], [30, "#E69F00"], [45, "#00855E"], [60, "#0072B2"], [Infinity, "#5D3A9B"]];
export function rangeCell(text){
  var t = String(text == null ? "" : text).trim();
  var one = /^(\d+)\s*cm$/i.exec(t), span = /^(\d+)\s*[\u2013-]\s*(\d+)\s*cm$/i.exec(t);
  if(!one && !span) return null;
  var cm = parseInt(one ? one[1] : span[2], 10), band = 0;
  while(cm > RANGE_BANDS[band][0]) band++;
  return { label: one ? one[1] : span[1] + "\u2013" + span[2], band: band + 1, color: RANGE_BANDS[band][1] };
}

/* v1.2 (owner 12 Oct 2026: "the two-part paired weapons, port and starboard,
   ... some small visual link that they belong together"): a port and a
   starboard row that are the same weapon are marked
   as a pair - pair = 1 on the upper row, 2 on the lower - and the card
   prints their badge, range and strength once. A pair is two rows NEXT TO
   each other whose names differ only in Port / Starboard and whose range
   and strength are the same text; the Tyrant has "Port weapons battery"
   twice (45 cm / 4 and 30 cm / 6, Fleets p. 69), and each pairs with its
   neighbour. A row with a box, an alternative or a count of its own (a
   choice, OR, a write-in strength, a hulk's loss boxes) is not
   part of a pair: its strength is not shared. A choice whose alternatives
   are gone - the Tyrant's 45 cm batteries once they are bought - prints as
   a plain weapon and pairs like one. Presentation only - the rows
   themselves and their order do not change. */
export function pairRows(rows){
  var side = function(r){
    var m = /^(port|starboard)\s+(.+)$/i.exec(String((r.a && r.a[0]) || "").replace(/\*/g, "").replace(/\s+/g, " ").trim());
    return m ? [m[1].toLowerCase(), m[2].toLowerCase()] : null;
  };
  var inSlot = {};
  rows.forEach(function(r){ if(r.grp) inSlot[r.i] = (inSlot[r.i] || 0) + 1; });
  var plain = function(r){
    if(r.loss || r.writeIn || r.state !== "active") return false;
    if(r.grp) return inSlot[r.i] < 2;
    return !r.alt && !r.box;
  };
  var txt = function(v){ return String(v == null ? "" : v).replace(/\s+/g, " ").trim(); };
  for(var k = 0; k + 1 < rows.length; k++){
    var p = rows[k], q = rows[k + 1], a = side(p), b = side(q);
    if(!a || !b || a[0] === b[0] || a[1] !== b[1]) continue;
    if(!plain(p) || !plain(q)) continue;
    if(txt(p.a[1]) !== txt(q.a[1]) || txt(p.a[2]) !== txt(q.a[2])) continue;
    p.pair = 1; q.pair = 2;
    k++;
  }
  return rows;
}

/* A ship's armament in one line for the catalogue, so a fleet can be built
   without opening a card (user 20.9.). The badge letters of WEP group by HOW
   a weapon resolves; here each group also needs a word the eye can read, and
   the two are not the same split: a nova cannon and a bombardment cannon share
   the red badge but are different guns, so they keep their own words. The
   order is fixed - the eye finds "what is this ship" faster when the same
   kind of weapon is always in the same place. */
export const ARM_ABBR = [
  [/nova cannon/i,                            "NOVA"],
  [/bombardment/i,                            "BOMB"],
  [/lance|pulsar|bio-plasma|particle whip|ion cannon|warp cannon/i, "LAN"],
  [/gravitic hook/i,                          "HOOK"],
  [/torpedo|gravitic launcher/i,              "TORP"],
  [/launch bay|attack craft|bays/i,           "BAYS"],
  [/orbital mine/i,                           "MINES"],
  [/star pulse/i,                             "PULSE"],
  [/ram|klaw|claw|tentacle|impaler/i,         "RAM"],
];
export const ARM_ORDER = ["WB", "LAN", "NOVA", "BOMB", "TORP", "BAYS", "HOOK", "MINES", "PULSE", "RAM"];
export function armAbbr(name){
  for(var i = 0; i < ARM_ABBR.length; i++) if(ARM_ABBR[i][0].test(String(name || ""))) return ARM_ABBR[i][1];
  return "WB";
}
/* The strength column is free text in the book: "6", "2 squadrons", "D6+2",
   "Special", "Capacity: 1 Orca/Warden" (Tau hangars, Fleets p. 494). A number
   is the value; a squadron count is its number; anything else has no number to
   show, and printing it in full would bury the line - the group then stands
   alone, as the card's own "Spec." does. */
export function armStrength(s){
  var t = String(s == null ? "" : s).trim();
  var m = t.match(/^(D\d+(?:\s*\+\s*\d+)?|\d+)(\s*squadrons?)?$/i);
  if(m) return m[1].replace(/\s+/g, "");
  /* A gravitic hook's "Capacity: 2 Orcas/Wardens" (Fleets p. 494): the number
     is what the fleet rule counts, and it is the only part that fits. */
  var cap = t.match(/^capacity\s*:\s*(\d+)\b/i);
  if(cap) return cap[1];
  return null;
}
/* The profile conditions a list row can answer on its own. The catalogue has
   a row and a hull, never a configured unit, so a condition about the ship's
   current armament ("has") cannot be answered there and the caller is told so
   with null rather than a guess. */
export function condShipOnly(en, sh){
  var c = en && en.cond;
  if(!c) return true;
  if(!sh) return false;
  if(c.has || c.wep || c.opt || c.up) return null;
  var esc = /escort/i.test(sh.ty || "");
  if(c.cap && esc) return false;
  if(c.esc && !esc) return false;
  if(c.ty && !new RegExp(c.ty, "i").test(sh.ty || "")) return false;
  if(c.nm && !new RegExp(c.nm, "i").test(sh.nm || "")) return false;
  if(c.nmno && new RegExp(c.nmno, "i").test(sh.nm || "")) return false;
  if(c.fl && !new RegExp(c.fl, "i").test(sh.fl || "")) return false;
  if(c.flno && new RegExp(c.flno, "i").test(sh.fl || "")) return false;
  return true;
}
/* What a list forces on this hull before the player chooses anything: the
   Explorator's required Mechanicus dorsal lance and +1 turret ride on every
   cruiser of that list (Fleets p. 120), so a catalogue line drawn from the
   profile alone would be missing a lance and a turret on twelve rows. Only
   targetless required rows count - a row aimed at named entries (at) is not
   this hull's. */
export function requiredHullChanges(list, sh){
  var rows = [], mod = null;
  /* sh.df: a planetary defence takes none of the list's refits (upgradesForRaw). */
  if(!list || !sh || sh.df) return { rows: rows, mod: mod };
  (list.secs || []).forEach(function(sec){
    (sec.ents || []).forEach(function(en){
      if(!en || en.k !== "up" || !en.req || en.at) return;
      if(condShipOnly(en, sh) !== true) return;
      if(en.add) rows = rows.concat(Array.isArray(en.add[0]) ? en.add : [en.add]);
      if(en.mod){
        mod = mod || {};
        Object.keys(en.mod).forEach(function(k){ mod[k] = (mod[k] || 0) + en.mod[k]; });
      }
    });
  });
  return { rows: rows, mod: mod };
}
/* One group per weapon word, each with its distinct strengths and how many
   rows carry them: a Lunar is "WB 6x2, LAN 2x2, TORP 6" - the two broadsides
   are two rows of six, never one of twelve.

   Rows an option owns (o.aws) are left out: on thirteen hulls the profile's
   rows are a menu, not a loadout - a Tyranid Kraken picks one of five weapons
   (Fleets p. 435) and an Eldar Dragonship one prow gun and one keel mount
   (p. 330) - so listing them all would promise a ship nobody can field. They
   are counted instead, and the picker prints "pick 1 of 5" beside the line.

   opts: { max, list } - list folds in what that fleet list forces on the hull. */
export function armSummary(sh, opts){
  var o2 = typeof opts === "number" ? { max: opts } : (opts || {});
  var max = o2.max;
  /* Which profile rows belong to an option, and how big each exclusive group
     is (gmax 1 with several members = pick one). */
  var owner = {}, grpN = {}, picks = [], addons = 0;
  ((sh && sh.ol) || []).forEach(function(o){
    (o.aws || []).forEach(function(i){ owner[i] = o; });
    if(o.grp && (o.aws || []).length) grpN[o.grp] = (grpN[o.grp] || 0) + 1;
  });
  Object.keys(grpN).forEach(function(g){
    if(grpN[g] > 1 && (sh.ol.filter(function(o){ return o.grp === g; })[0].gmax || 1) === 1) picks.push(grpN[g]);
  });
  var rows = ((sh && sh.aw) || []).filter(function(a, i){
    if(!owner[i]) return true;
    var g = owner[i].grp;
    if(!(g && grpN[g] > 1)) addons++;
    return false;
  }).concat((o2.list ? requiredHullChanges(o2.list, sh).rows : []));
  var s = armSummaryRows(rows, max);
  s.picks = picks.sort(function(a, b){ return b - a; });
  s.addons = addons;
  return s;
}
/* The same short line from any weapon rows - the builder's fleet row
   summarises the RESOLVED unit's weapons with it, so an option that adds
   or swaps a row shows on the line (user 28.9.2026). */
export function armSummaryRows(rows, max){
  var order = {}, out = [];
  ARM_ORDER.forEach(function(k, i){ order[k] = i; });
  (rows || []).forEach(function(a){
    var k = armAbbr(a[0]), v = armStrength(a[2]);
    var g = null;
    out.forEach(function(x){ if(x.k === k) g = x; });
    if(!g){ g = { k: k, items: [], rng: [] }; out.push(g); }
    /* how far the group reaches: every row's range text, once each */
    var rr = String(a[1] == null ? "" : a[1]).trim();
    if(rr && rr !== "\u2013" && rr !== "-" && g.rng.indexOf(rr) < 0) g.rng.push(rr);
    var hit = null;
    g.items.forEach(function(x){ if(x.v === v) hit = x; });
    if(hit) hit.n++;
    else { hit = { v: v, n: 1, rng: [] }; g.items.push(hit); }
    if(rr && rr !== "\u2013" && rr !== "-" && hit.rng.indexOf(rr) < 0) hit.rng.push(rr);
  });
  out.sort(function(a, b){ return (order[a.k] == null ? 99 : order[a.k]) - (order[b.k] == null ? 99 : order[b.k]); });
  var cap = max == null ? 4 : max;
  var more = Math.max(0, out.length - cap);
  out = out.slice(0, cap);
  out.forEach(function(g){
    /* Two strengths are a description, four are a table. */
    g.more = Math.max(0, g.items.length - 2);
    g.items = g.items.slice(0, 2);
  });
  return { groups: out, more: more, picks: [], addons: 0 };
}
/* The chosen ship's weapons as the fleet row shows them (user 30.9.2026):
   rows of the same class, strength and range share one box that carries
   every row's fire arc - port and starboard batteries of 8 are one "WB 8"
   with both arcs. Launch bays have no arc to tell apart, so their strengths
   add up (2 + 2 = 4); a strength that is not a number (D3+1) cannot be
   added and is counted instead. */
export function weaponBoxes(rows){
  var out = [];
  (rows || []).forEach(function(a){
    var k = armAbbr(a[0]), v = armStrength(a[2]), rng = String(a[1] == null ? "" : a[1]).trim();
    var num = v != null && /^\d+$/.test(v) ? parseInt(v, 10) : null;
    var adds = k === "BAYS" && num != null;
    var hit = null;
    out.forEach(function(x){
      if(hit || x.k !== k || x.rng !== rng) return;
      if(adds ? x.adds : (!x.adds && x.raw === v)) hit = x;
    });
    if(!hit){ hit = { k: k, v: v, raw: v, n: 0, sum: 0, adds: adds, summed: false, rng: rng, arcs: [], names: [] }; out.push(hit); }
    hit.n++;
    if(adds){ hit.sum += num; hit.v = String(hit.sum); hit.summed = hit.n > 1; }
    hit.arcs.push(String(a[3] == null ? "" : a[3]).trim());
    hit.names.push(String(a[0] == null ? "" : a[0]).trim());
  });
  return out;
}
export function armSummaryText(sh, max){
  var s = armSummary(sh, max);
  var t = s.groups.map(function(g){
    /* No number to show (Special, or a Tau hangar's capacity): the word alone
       with the card's own short form. */
    var v = g.items.map(function(x){ return (x.v == null ? "Spec." : x.v) + (x.n > 1 ? "\u00d7" + x.n : ""); })
      .join(", ");
    return g.k + (v ? " " + v : "") + (g.more ? "\u2026" : "");
  }).join(" \u00b7 ");
  /* Three or more exclusive groups (the Tyranid hive ship has five, Fleets
     p. 432) would fill the line with picks: then the count is the useful
     part. The picker's chips use the same threshold. */
  var tail = (s.picks.length > 2 ? [s.picks.length + " weapon choices"]
              : s.picks.map(function(n){ return "pick 1 of " + n; }))
    .concat(s.addons ? [s.addons + " optional"] : []);
  /* The Fire Ship (Fleets p. 516) is the one profile the book prints with a
     stat line and no ARMAMENT table: the ship itself is the weapon. An empty
     catalogue line would read as missing data, so it says what it is. */
  if(!t && !tail.length && !(sh.aw || []).length) return "no armament";
  return t + (s.more ? " \u00b7 \u2026" : "") + (tail.length ? (t ? " \u00b7 " : "") + tail.join(" \u00b7 ") : "");
}

/* Critical hits table, Rulebook v1.10 pg. 67. Boxes per result reflect the
   entries that stack (fire, engine, thrusters); * = cannot be repaired. */
