/* Gothic Fleet Play - the rules layer of the in-game card.

   Pure functions over a PLAY STATE that the builder's resolved unit (R from
   DOMAIN.resolveUnit) knows nothing about: hits taken, criticals suffered,
   the special order in force, ordnance loaded, blast markers touching the
   base. Everything a player writes on the paper card during a game lives
   here; everything the rulebook derives from it (crippled, halved shields,
   the Leadership actually rolled against) is computed, never stored.

   Record, do not adjudicate: nothing here decides whether a shot hits. The
   one die it rolls is asked for - the Leadership and the upgrades rolled
   before the game (d6, ldPlan; user 31.10.2026, RULINGS.md T44) - and its
   result stays the player's to change. Every rule carries its page in Battlefleet Gothic: Remastered
   Rulebook v1.10 (7 May 2024), the project's only authority (AGENTS.md 1).

   No DOM, no storage, no global state; require()d by test_play.js and
   bundled into the page by build.js. ASCII only. */
var PLAY = (function(){
"use strict";

/* The six special orders (p. 46-47) and the state they leave on the ship.
   nova: may the nova cannon fire (p. 46-47 "No Nova Cannon", p. 64).
   arm: armament multiplier - "half effect" on the manoeuvre orders and on
   Brace (p. 46-47); ordnance is full on every order except Brace, where it
   is halved (p. 47). turns: what the order allows, for the card's own line. */
var ORDERS = [
  { id: "AAF",  name: "All Ahead Full",      nova: false, arm: 0.5, ord: 1,   page: 46,
    line: "Speed +4D6 cm, no turns; weapons half, no nova cannon; needed to ram." },
  { id: "CTNH", name: "Come to New Heading", nova: false, arm: 0.5, ord: 1,   page: 46,
    line: "Extra turn, up to two turns; weapons half, no nova cannon." },
  { id: "BR",   name: "Burn Retros",         nova: false, arm: 0.5, ord: 1,   page: 46,
    line: "Turn without moving first, speed zero to half; weapons half, no nova cannon." },
  { id: "LO",   name: "Lock On",             nova: true,  arm: 1,   ord: 1,   page: 47,
    line: "Re-roll to-hit for lances and batteries; no turns." },
  { id: "RO",   name: "Reload Ordnance",     nova: true,  arm: 1,   ord: 1,   page: 47,
    line: "All ordnance reloaded; up to one turn." },
  { id: "BFI",  name: "Brace For Impact",    nova: false, arm: 0.5, ord: 0.5, page: 47,
    line: "4+ save against damage; weapons and ordnance half, no nova cannon; no orders next turn." }
];
var ORDER_BY = {};
ORDERS.forEach(function(o){ ORDER_BY[o.id] = o; });

/* The standard critical results (p. 67), keyed by the 2D6 roll. loc names
   the armament the result silences; perm marks the two that "may not be
   repaired"; extra is the damage the result adds at once. The card shows
   the ship's OWN table from R.damage.critical (Eldar, Necron, hulks ...);
   these keys only carry the effects the standard table implies. A ship
   whose table has other rows gets no derived effect for them - the row is
   still counted and shown, it just changes nothing else on the card. */
var CRITS = {
  "2":  { name: "Dorsal armament damaged",    loc: "dorsal",    extra: 0 },
  "3":  { name: "Starboard armament damaged", loc: "starboard", extra: 0 },
  "4":  { name: "Port armament damaged",      loc: "port",      extra: 0 },
  "5":  { name: "Prow armament damaged",      loc: "prow",      extra: 0 },
  "6":  { name: "Engine room damaged",        noTurns: true,    extra: 1 },
  "7":  { name: "Fire!",                      fire: true,       extra: 0 },
  "8":  { name: "Thrusters damaged",          thrusters: true,  extra: 1 },
  "9":  { name: "Bridge smashed",             ld: -3, perm: true, extra: 0 },
  "10": { name: "Shields collapse",           shields0: true, perm: true, extra: 0 },
  "11": { name: "Hull breach",                extra: "D3" },
  "12": { name: "Bulkhead collapse",          extra: "D6" }
};

/* The two hulk states (p. 71): both drift 4D6 cm a turn; a blazing hulk
   rolls on the Catastrophic Damage table again after every move. */
var HULKS = { drifting: "Drifting hulk", blazing: "Blazing hulk" };

/* What a hulk still does, and who may shoot it (p. 71), for the card's
   own line and the table's reminder list; the two fleets that may fire on
   their own hulks (Necrons Fleets p. 404, Mechanicus p. 118) and what a
   hulk is worth (p. 123, Necrons Fleets p. 404). */
/* A star fort (Fleets p. 500-505; the Fortress-Monastery by reference,
   p. 110) and any other defence with multiple hits (p. 101) never drift.
   A space hulk is typed a defence but its drifting results stand
   (Fleets p. 290, p. 393).
   A star fort is the unit whose profile is printed per quadrant
   ("Defence/12 (quadrant)", Fleets p. 500, p. 110) - R.stats.quadrant. A
   unit that merely mentions one in its rules (p. 500: defences "may be
   sited within 30 cm of a Ramilies class star fort") is not. */
function isFort(R){
  return !!(R && R.stats && R.stats.quadrant);
}
function staysInPlace(R){
  var nm = String(R && R.className || ""), type = String(R && R.stats && R.stats.type || "");
  if(/SPACE HULK|^ORK HULK/i.test(nm)) return false;
  return isFort(R) || /defence/i.test(type) || !!(R && R.defence && R.defence.stationary);
}

/* The four quadrants of a star fort (Fleets p. 501). The book's diagram
   names them North, East, South and West with the docking piers between
   them; the printed card follows the player's physical model, where the
   piers are on the N/E/S/W axes and the quadrants are the quarters
   between - so NW, NE, SW, SE (RULINGS.md T29). */
var QUADS = ["NW", "NE", "SW", "SE"];
function hulkRules(R){
  var fl = String(R && R.source && R.source.faction || "");
  var arm = String(R && R.stats && R.stats.armour || "").trim();
  var fixed = staysInPlace(R);
  var friendly = /NECRON/i.test(fl) ? "Necron ships MAY fire on or board their own hulk, to deny victory points or to set off the explosion (Fleets p. 404)."
    : /MECHANICUS/i.test(fl) ? "Friendly ships and ordnance may not fire on or board it - except Mechanicus ships, which may pass a Leadership check to fire on their own DRIFTING hulk (Fleets p. 118); stray friendly torpedoes hit it normally (p. 71)."
    : "Friendly ships and ordnance may not fire on or board it to deny points or to set off the explosion; stray friendly torpedoes still hit it normally (p. 71).";
  var vp = /NECRON/i.test(fl) ? "Victory points against Necrons: left as a drifting hulk it counts 300 % of its points, destroyed any other way 200 % (Fleets p. 404)."
    : "Whoever holds the field at the end earns half its points value - own hulks included (p. 123).";
  return {
    armour: arm,
    brief: "no shields or holofields, turrets 0" + (arm ? ", hit on armour " + arm : "") + "; a roll on this table each time an enemy ship, squadron or ordnance wave inflicts hits (p. 71)",
    list: [
      fixed ? "A defence never drifts: it stays in place (p. 101), a hulk in every other respect (p. 71)."
            : "Drifts 4D6 cm straight ahead in each of its Movement phases; place a Blast Marker touching its base after each move (p. 71).",
      "No shields, holofields or the like; turrets 0, and bombers do not subtract them (p. 71). It blocks lines of fire over its base (p. 71).",
      "The enemy rolls to hit on its Armour" + (arm ? " (" + arm + ")" : "") + " and rolls on this table once each time a ship, squadron or ordnance wave inflicts hits on it - however many hits (p. 71).",
      "The enemy needs no Leadership check to ignore it as the closest target, and the usual check to shoot it when it is not (p. 71). Torpedoes do not ignore it in their path; boarding torpedoes may, guided ones can steer clear (p. 77-78).",
      friendly,
      vp
    ]
  };
}

/* What happens at 0 hits. The Rulebook table (p. 71) for most ships,
   the Tyranid table (Fleets p. 425), the space hulks' own explosions
   (Chaos Fleets p. 290, Ork p. 393), the vessels that go straight to four Blast Markers with no roll - the
   rock vessels (Rok Fleets p. 395, Warsphere p. 495, Stryxis caravan
   p. 207) and the Nicassar Caravan (p. 492) - each carrying the book's
   line in its own damage block, and the ships that roll 3D6 on the
   standard table (Mercury Fleets p. 64, fuel tanker p. 192). The numbers
   a result needs are worked out from the STARTING hits (p. 71). */
/* boarded: may the table's unit be taken to 0 in a boarding action and
   become a drifting hulk with no roll (p. 90)? Only one that rolls at
   all - and never a star fort, which no ship may board: "The only vessel
   that may attempt to board a Ramilies is a space hulk" (Fleets p. 502;
   the Fortress-Monastery the same, p. 111). */
function catastrophic(R){
  var c = catastrophicTable(R);
  c.boarded = !!c.dice && !isFort(R);
  return c;
}
function catastrophicTable(R){
  var h = (R && R.stats && R.stats.hits) | 0, half = Math.ceil(h / 2);
  var fl = String(R && R.source && R.source.faction || ""), nm = String(R && R.className || "");
  var texts = [].concat((R && R.rules || []).map(function(r){ return String(r.t || ""); }),
                        (R && R.options || []).filter(function(o){ return o.state === "take"; }).map(function(o){ return String(o.text || ""); }),
                        R && R.damage && R.damage.critical ? [String(R.damage.critical.title || ""), String(R.damage.critical.foot || "")].concat(R.damage.critical.wide || []) : []);
  var all = texts.join(" | ");
  var hulk = hulkRules(R);
  /* A unit of one-hit members never rolls. An escort: "When an escort is
     destroyed, replace it with a Blast Marker placed as centrally as
     possible to where the escort was" (p. 71). A one-hit defence: only "a
     defence with multiple hits" rolls on the table (p. 101); the book says
     nothing else about what a destroyed platform leaves (RULINGS.md T27). */
  if(isEscort(R)){
    var inst = isInstallation(R);
    return { title: "Destroyed", dice: null, page: inst ? 101 : 71, fleets: false,
      rows: [{ roll: "-", name: "Destroyed", kind: "gone",
               text: inst ? "No roll: only a defence with multiple hits rolls on the Catastrophic Damage table (p. 101)."
                          : "No roll: each destroyed escort is replaced by a Blast Marker where it was (p. 71)." }],
      hulk: hulk, explode: null, note: "One-hit units do not roll on the Catastrophic Damage table." };
  }
  var explode = "An exploding ship is an area effect: holofields do not save against it, shields do (p. 71). Place one Blast Marker exactly where the ship was and fan the rest out from it, touching, without overlaps (p. 71).";
  /* p. 101: a defence with multiple hits rolls here at 0 "however,
     defences never drift, they always remain in place" */
  var fixed = staysInPlace(R);
  var drifting = fixed
    ? { roll: "2-6", name: "Drifting hulk", kind: "drifting", extra: "+1 BM", text: "A defence never drifts: it stays in place (p. 101), a hulk in every other respect." }
    : { roll: "2-6", name: "Drifting hulk", kind: "drifting", extra: "+1 BM", text: "Drifts 4D6 cm forward in each of its Movement phases; place a Blast Marker touching its base after each move." };
  var blazing = fixed
    ? { roll: "7-8", name: "Blazing hulk", kind: "blazing", extra: "+1 BM", text: "Stays in place (p. 101), burning: roll on this table again in each of its Movement phases, where a ship would have moved." }
    : { roll: "7-8", name: "Blazing hulk", kind: "blazing", extra: "+1 BM", text: "Drifts 4D6 cm forward in each of its Movement phases; place a Blast Marker after each move, then roll on this table again." };
  var noRoll = texts.filter(function(t){ return /no Catastrophic Damage roll|Do not roll for Catastrophic|replace (it|them)? ?with four Blast Markers|(4|four) Blast Markers/i.test(t); });
  if(noRoll.length){
    /* the page is the one the ship's own line cites, else the ship's page */
    var cite = null;
    noRoll.forEach(function(t){ var m = t.match(/\(Fleets p\. (\d+)\)/); if(m && cite == null) cite = parseInt(m[1], 10); });
    var breaks = noRoll.some(function(t){ return /breaks up/i.test(t); });
    return { title: breaks ? "Breaks up" : "Destroyed", dice: null, page: cite != null ? cite : ((R && R.source && R.source.page) | 0), fleets: true,
      rows: [{ roll: "-", name: breaks ? "Breaks up" : "Destroyed", kind: "gone", text: "No roll: the vessel is replaced by four Blast markers." }],
      hulk: hulk, explode: null, note: "This vessel does not roll on the Catastrophic Damage table." };
  }
  if(/TYRANID/i.test(fl)){
    return { title: "Tyranid catastrophic damage", dice: "2D6", page: 425, fleets: true, rows: [
      { roll: "2-7", name: "Drifting carcass", kind: "drifting", extra: "+1 BM", text: "Drifts 4D6 cm forward in each of its Movement phases; place a Blast marker touching its base after each move." },
      { roll: "8-9", name: "Death throes", kind: "blazing", extra: "+1 BM", text: "Drifts 4D6 cm forward each Movement phase; place a Blast marker after each move and roll on this table again." },
      { roll: "10-11", name: "Biological eruption", kind: "gone", extra: half + " BM", text: "Remove the ship, leaving " + half + " Blast markers. Make a pyro-acid attack against every target within 3D6 cm with firepower " + h + "." },
      { roll: "12", name: "Bio-plasma detonation", kind: "gone", extra: h + " BM", text: "Remove the ship, leaving " + h + " Blast markers. Make a bio-plasma attack against every target within 3D6 cm with Strength " + half + "; shields and holofields do not protect." }
    ], hulk: hulk, explode: "Biological eruption and bio-plasma detonation are area effects; against the detonation neither shields nor holofields protect (Fleets p. 425). Place the Blast Markers as for any explosion: one where the ship was, the rest fanning out from it, touching (p. 71).",
       note: "Death throes rolls again after every move; a drifting carcass is a hulk for firing and boarding." };
  }
  /* The space hulks: the hulk results as the rulebook's, the explosions
     their own - torn apart into an asteroid field, or hurled back into
     the Warp (Chaos Space Hulk Fleets p. 290, Ork hulk p. 393). */
  if(/SPACE HULK|^ORK HULK/i.test(nm)){
    var pg = /ORK/i.test(nm) || /ORK/i.test(fl) ? 391 : 288;
    return { title: "Space hulk catastrophic damage", dice: "2D6", page: pg, fleets: true, rows: [
      drifting, blazing,
      { roll: "9-11", name: "Torn apart", kind: "gone", extra: "asteroids", text: "Internal explosions tear it apart: no damage to ships nearby; replace it with an asteroid field D3 x 5 cm wide and long." },
      { roll: "12", name: "Hurled into the Warp", kind: "gone", extra: "warp rift", text: "Replace it with a Warp rift; any ship caught in the rift is affected at once." }
    ], hulk: hulk, explode: null, note: "A space hulk drifts and blazes like any hulk; its explosions leave terrain, not lance hits." };
  }
  /* A star fort: each quadrant is its own track - at 0 it takes no more
     damage and is an asteroid field from then on (Fleets p. 501); the
     fort itself is destroyed only once all four are at 0, and then rolls
     a D6 on the Ramilies table (p. 502, p. 504-505). The Space Marine
     Fortress-Monastery follows the same rules (p. 110). */
  if(isFort(R)){
    return { title: "Star fort catastrophic damage", dice: "D6", page: 505, fleets: true, rows: [
      { roll: "1-2", name: "Wrecked", kind: "drifting", extra: "", text: "The structure survives in place: venting gases and wreckage block lines of fire across it, and moving through it is moving through an asteroid field." },
      { roll: "3", name: "Structural collapse", kind: "gone", extra: "asteroids", text: "Replace it with a 15 cm asteroid field." },
      { roll: "4-5", name: "Hyper-plasma meltdown", kind: "gone", extra: "2D6 BM", text: "Eight lance shots at every ship within 4D6 cm; all ordnance within that distance is removed; everything else on the table suffers a solar flare centred on the fort; then replace it with 2D6 Blast Markers." },
      { roll: "6", name: "Warpbubble implosion", kind: "gone", extra: "warp rift", text: "Four lance shots at every ship and ordnance marker within 4D6 cm, then replace it with a Warp Rift." }
    ], hulk: hulk, explode: null,
       note: "Each quadrant has its own track: at 0 it takes no further damage and that quadrant of the base is an asteroid field from then on (Fleets p. 501). The fort itself rolls on this table only once all four quadrants are at 0 (Fleets p. 502, 504)." };
  }
  var dice = /3D6 (for|on the) catastrophic/i.test(all) ? "3D6" : "2D6";
  return { title: "Catastrophic damage", dice: dice, page: 71, fleets: false, rows: [
    drifting, blazing,
    { roll: "9-11", name: "Plasma drive overload", kind: "gone", extra: half + " BM", text: "Remove the ship, leaving " + half + " Blast markers. Every ship within 3D6 cm takes lance hits of Strength " + half + "." },
    { roll: "12", name: "Warp drive implosion", kind: "gone", extra: h + " BM", text: "Remove the ship, leaving " + h + " Blast markers. Every ship within 3D6 cm takes lance hits of Strength " + h + "." }
  ], hulk: hulk, explode: explode, note: (dice === "3D6" ? "This ship rolls 3D6 and adds them; more than 12 counts as 12. " : "") +
           "Boarded to 0 hits it is a drifting hulk" + (fixed ? " in place" : "") + " with no roll (p. 90) - unless a critical hit in the boarding took it there, which rolls as normal (p. 90)." };
}

/* p. 67: every unrepaired fire costs a hit in the End Phase, so the damage
   from fires is one per fire. */
function fireDamage(R, st){ return standardCrits(R) ? critCount(st, "7") : 0; }

/* Leadership rolled before the game (p. 45): 1 Untried 6, 2-3 Experienced 7,
   4-5 Veteran 8, 6 Crack 9. */
var LD_TABLE = [null, 6, 7, 7, 8, 8, 9];
/* The values a ship can start a game with - what the set-up screen offers.
   The table above is the rulebook's; other fleets roll on their own or
   modify it: Orks "a Leadership range of 5 to 8" (Fleets p. 360; pirates
   p. 188 and transports p. 85 the same), Adeptus Mechanicus 7-9 (p. 118),
   Eldar and Dark Eldar "between 7 and 10" (p. 304, 344), Space Marines
   "1-2 Ld 8, 3-4 Ld 9, 5-6 Ld 10" (p. 94) - and Grey Knights "count as
   Space Marines in all respects" (p. 154), so a Grey Knights Strike Cruiser
   in an Imperial Navy fleet (p. 148) rolls 8-10 next to ships that roll
   6-9. One fleet holds ships of several tables, so every unit is offered
   the whole range. Nothing goes above 10 (p. 48). */
var LD_VALUES = [5, 6, 7, 8, 9, 10];

/* A bare number, or "2 squadrons" (launch bays, p. 79). Dice ("D6+2",
   Ork gunz, Fleets p. 362) and text are not numbers and come back null. */
function num(v){
  var m = String(v == null ? "" : v).trim().match(/^(-?\d+)\s*(squadrons?)?\s*$/i);
  return m ? parseInt(m[1], 10) : null;
}
function half(n){ return Math.ceil(n / 2); }   /* "rounding up" p. 64, 65, 99 */

/* A fresh play state for one resolved unit. Escort squadrons carry one
   slot per hull: an escort has no damage track, one unsaved hit or any
   critical destroys it (p. 66), so the per-ship state is alive or not.
   So does every other unit of one-hit members (isEscort), and the orbital
   mines bought one by one (tickUnit). A star fort carries four tracks. */
function freshMembers(R){
  var m = [];
  for(var i = 0; i < (R.hulls || 1); i++) m.push({ dead: false });
  return m;
}
function freshQuads(){ return QUADS.map(function(){ return { hits: 0, crits: {} }; }); }
function freshUnit(R){
  var esc = isEscort(R) || tickUnit(R);
  var st = {
    hits: 0,            /* damage points taken, p. 65 */
    crits: {},          /* result key -> count, cumulative, p. 67 */
    order: null,        /* one of ORDERS ids, or null; one at a time p. 46 */
    braceCarry: null,   /* the order Brace replaced - it stays in effect, p. 66 */
    braceLock: false,   /* failed Brace: not again vs this attacker, p. 47 */
    braceTurn: 0,       /* Brace lasts "until the end of its next turn", p. 47 */
    torps: true,        /* torpedoes loaded, p. 74 */
    craft: true,        /* attack craft ready, p. 74; separate from torps p. 73 */
    blast: 0,           /* Blast Markers touching the base, p. 69; one is placed
                           per hit the shields block (p. 70), so this is also
                           the shields-used count - there is no second one */
    played: 0,          /* 0 unplayed, 1 moved, 2 shot - the player's own mark */
    ld: null,           /* Leadership rolled, p. 45 */
    ldPerm: 0,          /* Bridge Smashed -3, permanent, p. 67 */
    boarding: false,    /* declared this turn: no shooting, no ordnance, p. 89 */
    grappled: false,    /* drawn boarding action, p. 90 */
    teleported: false,  /* one teleport attack per turn, p. 92 */
    noOrdersTurn: false,/* failed disengage: no fire, ordnance or orders this turn, p. 57 */
    hulk: null,         /* "drifting" | "blazing", p. 71 */
    destroyed: false,   /* out of action: no hits left, p. 65 */
    disengaged: false,  /* removed from the table, p. 57 */
    notes: ""
  };
  if(esc) st.members = freshMembers(R);
  /* Fleets p. 501: "its weapons, hits and defences are divided up into
     four 'quadrants'" - hits and criticals per quadrant, one of them
     selected: the one the card shows and the next tap goes to */
  if(isFort(R)){ st.quads = freshQuads(); st.qsel = 0; }
  return st;
}
/* A record saved by an older build is brought up to the model, losing
   nothing. A star fort used to have ONE track (RULINGS.md T19 before
   8.10.2026): its hits and criticals become the first quadrant's. If the
   record already carries a Catastrophic Damage result, the player had
   declared the fort gone - a state the book knows only with all four
   quadrants at 0 (Fleets p. 502) - so it stays gone, result and all.
   A unit that is now counted member by member gets its boxes. */
function adoptUnit(R, st){
  if(!R || !st) return st;
  if(isFort(R) && !(Array.isArray(st.quads) && st.quads.length === QUADS.length)){
    var max = R.stats.hits | 0;
    var gone = !!(st.hulkName || st.hulk || st.destroyed);
    var first = { hits: gone ? max : Math.max(0, Math.min(max, st.hits | 0)), crits: st.crits || {} };
    st.quads = QUADS.map(function(_, k){ return k === 0 ? first : { hits: gone ? max : 0, crits: {} }; });
    st.qsel = 0; st.hits = 0; st.crits = {};
  }
  if((isEscort(R) || tickUnit(R)) && !Array.isArray(st.members)) st.members = freshMembers(R);
  return st;
}

function freshFleet(){
  return {
    turn: 1,
    mine: true,           /* my turn (orders, played marks) or the enemy's (brace, hits) */
    orderLock: false,     /* a failed Command check ends orders this turn, p. 48 */
    rerolls: 0,           /* Fleet Commander re-rolls left, p. 48 */
    /* rrKinds / rrUsed: one box per re-roll ("included" | "bought" |
       "optional" | "added") and whether it is used - set by setRerolls, or
       laid over an older record's count by adoptRerolls */
    rerollsPerTurn: 0,    /* a pool that comes back every turn (Abaddon, Fleets p. 241) */
    rerollsLost: false,   /* flagship Bridge Smashed, p. 67 */
    radiation: 0,         /* radiation burst interference this turn, p. 115 */
    enemyOrders: false    /* "Enemy contacts" +1 when enemy ships are on orders, p. 48 */
  };
}

/* The member model: a unit made of one-hit members bought N at a time. The
   builder says so in R.squadron - set for every book-type Escort and for
   the one-hit planetary defences ("1HP defences grouped in up to six
   units", Rulebook p. 100: orbital platforms Defence/1 Fleets p. 509-511,
   silos and air bases Ground/1 p. 517). One unsaved hit or any critical
   destroys ONE member (p. 66), never the unit; there is no hit track, no
   critical table and no Catastrophic Damage roll (p. 71, p. 101). The
   name is historical: everything the card does for an escort squadron it
   does for these. The type is the fallback for a unit resolved without
   the field (hand-built test stubs). */
function isEscort(R){
  if(!R || !R.stats) return false;
  if(R.squadron) return true;
  return /escort/i.test(String(R.stats.type || ""));
}
/* A planetary defence INSTALLATION for p. 123's victory points: the
   stationary ones (R.defence.stationary - platforms, stations, silos, air
   bases, star forts, the Haven). Defence Monitors, System Ships and Fire
   Ships are vessels of type Escort (Fleets p. 514-516) and count as
   escorts there (RULINGS.md T28). */
function isInstallation(R){ return !!(R && R.defence && R.defence.stationary); }
/* A hull-less row whose items are ticked off one by one: orbital mines
   bought on their own (Fleets p. 512; R.ruleCard.track.kind "each"). A
   minefield is not - its size is rolled at set-up (p. 513) - and a Fire
   Ship is a ship: its boxes are an escort squadron's. */
function tickUnit(R){
  return !!(R && R.kind === "entry" && R.ruleCard && R.ruleCard.track && R.ruleCard.track.kind === "each");
}
/* Does the unit stay where it is? The builder's flag for planetary
   defences ("Satellite units may not move", Rulebook p. 100), else the
   profile: speed 0 (the Nicassar Rig, Fleets p. 493) or no speed at all. */
function isStill(R){
  if(!R || !R.stats) return false;
  if(R.defence) return !!R.defence.stationary;
  var txt = String(R.stats.speed == null ? "" : R.stats.speed).trim();
  return /^0+\s*(cm)?$/i.test(txt) || (txt !== "" && !/\d/.test(txt));
}
/* Necron reactive hulls (Fleets p. 404): "immune to Damage, Leadership and
   Movement modifiers from ... Blast Markers". The resolved unit carries the
   rule text; the card does not model the hull itself. */
function reactiveHull(R){
  return !!(R && (R.rules || []).some(function(r){ return /reactive hull/i.test(String(r.t || "")); }));
}
function isCapital(R){ return !!(R && R.stats && !isEscort(R)); }

/* --- derived, per ship ------------------------------------------------- */

function critCount(st, key){ return (st.crits && st.crits[key]) | 0; }
function hasCrit(st, key){ return critCount(st, key) > 0; }

/* The effects in CRITS are the STANDARD table's (p. 67). Eldar, Necron,
   Tyranid and hulk tables put other results under the same numbers
   (R.damage.critical, from domain.js criticalModel), so on those ships a
   result is counted and shown but changes nothing else on the card. */
function standardCrits(R){
  return !!(R && R.damage && R.damage.critical &&
            /^CRITICAL DAMAGE/.test(String(R.damage.critical.title || "")));
}
function stdCrit(R, st, key){ return standardCrits(R) && hasCrit(st, key); }

/* Half the damage points lost cripples the ship (p. 65); the builder already
   gives the first crippled box as R.damage.crippledAt = ceil(hits/2), and a
   Lunar with 8 hits is crippled at 4 (p. 65 example). Escorts and hulks are
   never crippled (R.damage.crippled false). */
/* Where the hits and the criticals live: on the unit - or, for a star
   fort, on the selected quadrant ("All damage and criticals only affect
   the quadrant that they are inflicted against", Fleets p. 501). */
function quadIndex(st){
  var k = st.qsel | 0;
  return k >= 0 && k < QUADS.length ? k : 0;
}
function track(R, st){
  return isFort(R) && st && st.quads ? st.quads[quadIndex(st)] : st;
}
function selectQuad(st, k){
  if(st && st.quads && k >= 0 && k < st.quads.length) st.qsel = k | 0;
  return st;
}
/* A quadrant at 0: "any further hits plow into the drifting wreckage and
   do no further damage, treat that quadrant of the base as an asteroid
   field from now on" (Fleets p. 501). */
function quadGone(R, st){
  return !!(isFort(R) && st.quads && (track(R, st).hits | 0) >= R.stats.hits);
}
/* The same state seen with another quadrant selected - a shallow copy;
   the quadrants themselves are shared and not touched. */
function atQuad(st, k){
  var c = {}, key;
  for(key in st) if(Object.prototype.hasOwnProperty.call(st, key)) c[key] = st[key];
  c.qsel = k;
  return c;
}
/* The four quadrants for the card's selector. */
function quadViews(R, st){
  if(!(isFort(R) && st.quads)) return null;
  return st.quads.map(function(q, k){
    var s = atQuad(st, k);
    return { i: k, name: QUADS[k], hits: q.hits | 0, max: R.stats.hits, remaining: Math.max(0, R.stats.hits - (q.hits | 0)),
             crippled: crippled(R, s), gone: quadGone(R, s),
             crits: Object.keys(q.crits || {}).filter(function(x){ return q.crits[x] > 0; }).length };
  });
}
/* "Quadrants are crippled individually once they are reduced to 6 Damage
   Points" (Fleets p. 501): for a star fort this is the selected quadrant;
   a quadrant at 0 is gone, not crippled. */
function crippled(R, st){
  if(!R.damage || !R.damage.crippled) return false;
  if(isFort(R) && st.quads) return track(R, st).hits >= R.damage.crippledAt && !quadGone(R, st) && !destroyed(R, st);
  return st.hits >= R.damage.crippledAt && !destroyed(R, st);
}
/* "The fort itself is only destroyed once all four quadrants are reduced
   to 0 Damage Points" (Fleets p. 502). */
function destroyed(R, st){
  if(st.destroyed) return true;
  if(isEscort(R) || tickUnit(R)) return (st.members || []).length > 0 && st.members.every(function(m){ return m.dead; });
  if(isFort(R) && st.quads) return st.quads.every(function(q){ return (q.hits | 0) >= R.stats.hits; });
  return R.stats ? st.hits >= R.stats.hits : false;
}
function remaining(R, st){ return R.stats ? Math.max(0, R.stats.hits - (track(R, st).hits | 0)) : 0; }

/* Shields: halved when crippled (p. 65), zero after Shields Collapse (p. 67)
   and on a hulk (p. 71). A Blast Marker is placed for every hit the shields
   block (p. 70) and each marker in contact takes one shield off when the
   ship is fired upon (p. 69) - so "shields up" is shields minus markers,
   and they come back only when the ship moves clear (p. 70). "Holofields"
   and saves are not shields - shown as text, never halved. */
function shields(R, st){
  var txt = String(R.stats && R.stats.shields || "").trim();
  var base = /^\d+$/.test(txt) ? parseInt(txt, 10) : null;   /* "4+ save" is a save, Fleets p. 404 */
  if(base == null) return { base: null, text: txt, now: null, up: null };
  var now = base;
  if(stdCrit(R, st, "10") || st.hulk || quadGone(R, st)) now = 0;
  else if(crippled(R, st)) now = half(now);
  var up = Math.max(0, now - (st.blast | 0));
  return { base: base, text: String(base), now: now, up: up };
}

/* Turrets: halved when crippled (p. 65), zero on a hulk (p. 71). "D3" stays
   text. */
function turrets(R, st){
  var base = num(R.stats && R.stats.turrets);
  if(base == null) return { base: null, text: String(R.stats && R.stats.turrets || ""), now: null };
  var now = st.hulk || quadGone(R, st) ? 0 : (crippled(R, st) ? half(base) : base);
  return { base: base, text: String(base), now: now };
}

/* Speed: -5 cm when crippled (p. 65); -10 cm while ANY Thrusters Damaged
   is unrepaired, applied once however many there are (p. 67). Eldar and
   other text speeds are shown as written with the modifiers named.
   A unit that does not move (isStill: "Satellite units may not move",
   Rulebook p. 100; defences "never drift, they always remain in place",
   p. 101) has nothing to lose: no modifier is ever named for it. The
   defence profiles print the speed as a bare "0" (Fleets p. 506-511,
   517), which is a number. */
function speed(R, st){
  var raw = R.stats ? R.stats.speed : "";
  var txt = String(raw == null ? "" : raw);
  var mcm = txt.trim().match(/^(\d+)\s*(?:cm)?$/i);
  var base = mcm ? parseInt(mcm[1], 10) : null;
  var still = isStill(R);
  var mods = [];
  if(!still){
    /* Not for the hulls whose own note says so: Roks, Kroot Warspheres,
       Stryxis and Nicassar Caravans "which are crippled ... do not reduce
       their speed" (Fleets pp. 207, 395, 492, 495). The page printed
       "-5 cm" beside "Speed unchanged". */
    if(crippled(R, st) && !/Speed unchanged/i.test(String((R.damage && R.damage.note) || "")))
      mods.push({ t: "crippled", v: -5, page: 65 });
    if(stdCrit(R, st, "8")) mods.push({ t: "thrusters", v: -10, page: 67 });
  }
  var now = base == null ? null : Math.max(0, base + mods.reduce(function(a, m){ return a + m.v; }, 0));
  return { base: base, text: txt, now: now, mods: mods, still: still };
}

/* Turns: none while Engine Room Damaged is unrepaired (p. 67). */
function turns(R, st){
  var txt = String(R.stats && R.stats.turns || "");
  var none = stdCrit(R, st, "6");
  return { text: txt, none: none, page: none ? 67 : null };
}

/* Leadership for a Command check: the value the player chose, Bridge
   Smashed -3 (p. 67), Under Fire -1 with Blast Markers in contact (p. 48),
   Enemy Contacts +1 when enemy ships are on special orders (p. 48), a
   radiation burst (p. 115); never above 10 (p. 48).
   Nothing of the ship's own is derived into the value: the Emperor's and
   the Oberon's +1 (Fleets p. 53, 56) and the Nicassar Caravan's (p. 492)
   are the player's to add before choosing it. For one day (13.10.2026) the
   page added them itself; the user took that out the same evening - the
   play page offers a plain choice of the Leadership value and automates
   none of it (RULINGS.md T40). */
function leadership(R, st, fleet){
  if(st.ld == null) return { base: null, now: null, mods: [] };
  var mods = [];
  if(st.ldPerm) mods.push({ t: "bridge smashed", v: st.ldPerm, page: 67 });
  if(st.blast > 0 && !reactiveHull(R)) mods.push({ t: "under fire", v: -1, page: 48 });
  if(fleet && fleet.enemyOrders) mods.push({ t: "enemy contacts", v: 1, page: 48 });
  if(fleet && fleet.radiation) mods.push({ t: "radiation burst", v: -fleet.radiation, page: 115 });
  var now = st.ld + mods.reduce(function(a, m){ return a + m.v; }, 0);
  if(now > 10) now = 10;
  return { base: st.ld, now: now, mods: mods };
}

/* Armament under the current state: halved when crippled (p. 65) and halved
   again when braced (p. 65 "cumulative", p. 66); a location knocked out by a
   critical may not fire (p. 67); the nova cannon is silent when crippled
   (p. 65) or on any order but Lock On / Reload Ordnance (p. 46-47, p. 64).
   Only the ACTIVE rows: what is offered but not bought is builder noise. */
/* A star fort (Fleets p. 500-505): the rows marked zone "quadrant" are the
   selected quadrant's own - halved when THAT quadrant is crippled, silent
   once it is at 0 (p. 501). The Basilica rows belong to the whole fort:
   no quadrant's crippling touches them (p. 501: damage "only affect[s]
   the quadrant that [it is] inflicted against"), Brace halves them "as
   normal" (p. 503), and critical 11 on any quadrant loses them: "All
   quadrants suffer D3 damage and the Basilica weapons are lost" (p. 505).
   RULINGS.md T29. */
function armament(R, st){
  var fort = isFort(R) && !!st.quads;
  var crUnit = crippled(R, st), br = braced(st);
  var qGone = fort && quadGone(R, st);
  var basLost = fort && st.quads.some(function(q){ return ((q.crits || {})["11"] | 0) > 0; });
  var order = st.order ? ORDER_BY[st.order] : null;
  return (R.weapons || []).filter(function(w){ return w.state !== "offered"; }).map(function(w){
    var name = w.a[0], strength = w.a[2];
    var basilica = fort && w.zone === "basilica";
    var cr = crUnit && !basilica;
    var nova = /nova cannon/i.test(name);
    var portal = /\bportal\b/i.test(name), pulse = /star pulse/i.test(name);
    var bays = /launch bay|attack craft|bays/i.test(name);
    var torp = /torpedo|gravitic launcher/i.test(name);
    var loc = (name.match(/^(dorsal|starboard|port|prow)\b/i) || [,""])[1].toLowerCase();
    var out = [];
    var mult = 1;
    if(cr) mult *= 0.5;
    /* Brace replaces the order in effect (p. 47), so its multipliers rule
       while braced; otherwise the order's own: arm for guns, ord for
       torpedoes and launch bays (p. 46-47). */
    var eff = br ? ORDER_BY.BFI : order;
    if(eff) mult *= (torp || bays) ? eff.ord : eff.arm;
    /* "6", "9" or "2 squadrons" (launch bays, p. 79) are numbers; "D6+2" or
       "Special" stay text and only carry the multiplier as a note. */
    var m = String(strength).trim().match(/^(\d+)\s*(squadrons?)?\s*$/i);
    var n = m ? parseInt(m[1], 10) : null, now = m ? String(n) : strength;
    if(portal){
      /* Necron Portals ignore special orders but are "cut in half (rounding
         down) if a ship is crippled or Braced" (Fleets p. 403) */
      mult = (cr ? 0.5 : 1) * (br ? 0.5 : 1);
      if(n != null && mult < 1) now = String(Math.floor(n * mult));
    }else if(n != null && mult < 1){
      var k = mult, h = n;
      while(k < 1){ h = half(h); k *= 2; }   /* each halving rounds up, p. 65 */
      now = String(h);
    }else if(n == null && mult < 1){
      now = strength + " (x" + mult + ")";
    }
    if(cr) out.push("crippled: half");
    if(br) out.push("braced: half");
    if(!br && order && !torp && !bays && order.arm < 1) out.push(order.name + ": half");
    var silent = null;
    if(loc && CRITS[{dorsal:"2", starboard:"3", port:"4", prow:"5"}[loc]] && stdCrit(R, st, {dorsal:"2", starboard:"3", port:"4", prow:"5"}[loc]))
      silent = "damaged (critical " + {dorsal:"2", starboard:"3", port:"4", prow:"5"}[loc] + ")";
    if(nova && cr) silent = "no nova cannon while crippled";
    else if(nova && order && !order.nova) silent = "no nova cannon on " + order.name;
    /* Fleets p. 402: "A star pulse cannot be generated while the vessel is
       using any special order or crippled" */
    if(pulse && cr) silent = "no star pulse while crippled";
    else if(pulse && (order || br)) silent = "no star pulse on " + (br ? "Brace For Impact" : order.name);
    /* Fleets p. 403: "both crippled and Braced may not make Portal attacks" */
    if(portal && cr && br) silent = "no Portal attacks: crippled and braced";
    if(fort && !basilica && qGone) silent = "quadrant destroyed (Fleets p. 501)";
    if(basilica && basLost) silent = "lost: Basilica penetrated, critical 11 (Fleets p. 505)";
    if(st.boarding) silent = silent || "boarding declared: may not fire";
    if(st.noOrdersTurn) silent = silent || "failed to disengage: may not fire";
    return { name: name, range: w.a[1], strength: strength, arc: w.a[3], now: now,
             notes: out, silent: silent, loc: loc, nova: nova, bays: bays, torp: torp, stars: w.stars || [],
             zone: fort ? (basilica ? "basilica" : "quadrant") : null, whole: basilica && crUnit };
  });
}

/* Launch bays for the fleet's attack craft limit (p. 73: no more markers
   in play than launch bays, a crippled carrier's halved). A unit of
   one-hit members counts each survivor's bays (two air bases: 2 x 4,
   Fleets p. 517). A Ramilies "may have in play up to twice the attack
   craft markers as the number of launch bays it has remaining" (Fleets
   p. 502), every quadrant's bays counted, a crippled quadrant's halved, a
   destroyed one's none; a Fortress-Monastery is not doubled - "Use the
   value listed in its profile" (p. 111; the builder's own rule line says
   so). text: a strength that is dice (Ork D3+1) cannot be counted. */
function launchBays(R, st){
  var n = 0, text = false;
  if(!R || !R.stats || destroyed(R, st)) return { n: 0, text: false };
  function add(v){ var k = num(v); if(k == null) text = true; else n += k; }
  if(isEscort(R)){
    escortFire(R, st).filter(function(a){ return a.bays; }).forEach(function(a){ if(a.total == null) text = true; else n += a.total; });
  }else if(isFort(R) && st.quads){
    st.quads.forEach(function(_, k){
      armament(R, atQuad(st, k)).forEach(function(a){ if(a.bays && a.zone === "quadrant" && !quadGone(R, atQuad(st, k))) add(a.now); });
    });
    armament(R, st).forEach(function(a){ if(a.bays && a.zone === "basilica") add(a.now); });
    var single = (R.rules || []).some(function(r){ return /not doubled at the launch limit/i.test(String(r.t || "")); });
    if(!single) n *= 2;
  }else{
    armament(R, st).forEach(function(a){ if(a.bays) add(a.now); });
  }
  return { n: n, text: text };
}

function braced(st){ return st.order === "BFI" || (st.braceTurn > 0); }

/* --- squadrons, p. 95 and p. 99 ---------------------------------------- */

/* A squadron takes one Command check on "the highest surviving Leadership
   value in the squadron" (p. 95); escorts have a single value already. */
function squadronLd(units, fleet){
  var best = null, fire = false;
  units.forEach(function(u, idx){
    /* a destroyed ship is not surviving; a disengaged one has left the
       table (p. 57) */
    if(destroyed(u.R, u.st) || u.st.disengaged || u.st.ld == null) return;
    var own = u.st.ld + (u.st.ldPerm | 0);          /* Bridge Smashed is the ship's own, p. 67 */
    if(best == null || own > best.own) best = { own: own, st: u.st, idx: idx };
    /* "even if only some of the ships in a squadron have Blast Markers" (p. 95) */
    if(u.st.blast > 0 && !reactiveHull(u.R)) fire = true;
  });
  if(!best) return { base: null, now: null, mods: [], idx: null };
  var mods = [];
  if(best.st.ldPerm) mods.push({ t: "bridge smashed", v: best.st.ldPerm, page: 67 });
  if(fire) mods.push({ t: "under fire", v: -1, page: 95 });
  if(fleet && fleet.enemyOrders) mods.push({ t: "enemy contacts", v: 1, page: 48 });
  if(fleet && fleet.radiation) mods.push({ t: "radiation burst", v: -fleet.radiation, page: 115 });
  var now = best.st.ld + mods.reduce(function(a, m){ return a + m.v; }, 0);
  if(now > 10) now = 10;
  return { base: best.st.ld, now: now, mods: mods, idx: best.idx };
}

/* An escort squadron fires as one: its firepower is "added up and halved
   (rounding up) when on special orders that affect weapons strength", and
   it is NOT halved "solely because the squadron is crippled" (p. 99). Dead
   ships add nothing (p. 66: destroyed). */
/* p. 99: "some ships (such as Ork Ravagers) cannot for any reason combine
   salvoes"; the Ork torpedo launcha rule says so on the card (Fleets
   p. 362). */
function noCombine(R){
  return !!(R && (R.rules || []).some(function(r){ return /squadron may not combine salvoes/i.test(String(r.t || "")); }));
}
function escortFire(R, st){
  var n = alive(st);
  var eff = braced(st) ? ORDER_BY.BFI : (st.order ? ORDER_BY[st.order] : null);
  var nc = noCombine(R);
  return (R.weapons || []).filter(function(w){ return w.state !== "offered"; }).map(function(w){
    var each = num(w.a[2]);
    var torp = /torpedo|gravitic launcher/i.test(w.a[0]), bays = /launch bay|attack craft|bays/i.test(w.a[0]);
    var total = each == null ? null : each * n;
    var mult = eff ? ((torp || bays) ? eff.ord : eff.arm) : 1;
    var now = total == null ? null : (mult < 1 ? half(total) : total);
    return { name: w.a[0], range: w.a[1], strength: w.a[2], arc: w.a[3], each: each, ships: n,
             total: total, now: now, halved: mult < 1 && total != null, torp: torp, bays: bays,
             nocombine: torp && nc, stars: w.stars || [] };
  });
}

/* Capital ships in a squadron "add their firepower together before working
   out how many dice they roll" but are "halved individually (rounding up),
   even if in a squadron" (p. 99) - so each ship's CURRENT value (crippled,
   braced, criticals) is summed. Rows combine by weapon kind, range and arc.
   Torpedoes and launch bays combine into one salvo or wave only from
   base-to-base contact (p. 99): their rows carry contact:true, and a ship
   whose salvoes may never combine (Ork launchas, Fleets p. 362) adds
   nothing to them. Nova cannons are not combined. */
/* Who in a capital-ship squadron is still on the table and firing: a
   destroyed ship (p. 66) or a hulk (p. 71) adds nothing to the sum, and
   neither does a ship that has disengaged (p. 57: removed from the table).
   A crippled ship stays in - its own values are already halved (p. 99) -
   and is named so the sum's drop has a reason on the card. */
function squadronStatus(units){
  var firing = [], out = [], cr = [];
  units.forEach(function(u, idx){
    if(u.st.disengaged) out.push({ idx: idx, why: "disengaged", page: 57 });
    else if(u.st.hulk) out.push({ idx: idx, why: "hulk", page: 71 });
    else if(destroyed(u.R, u.st)) out.push({ idx: idx, why: "destroyed", page: 71 });
    else { firing.push(idx); if(crippled(u.R, u.st)) cr.push(idx); }
  });
  return { firing: firing, out: out, crippled: cr };
}
function squadronFire(units){
  var rows = {}, order = [];
  var status = squadronStatus(units);
  units.forEach(function(u, idx){
    if(status.firing.indexOf(idx) < 0) return;
    var nc = noCombine(u.R);
    armament(u.R, u.st).forEach(function(a){
      if(a.nova) return;
      if(a.torp && nc) return;
      /* Ork gunz are weapon batteries (Fleets p. 362); heavy gunz and
         bombardment cannons are batteries with hits of their own kind, so
         they sum in rows of their own */
      var kind = a.torp ? "torpedoes" : a.bays ? "launch bays" :
                 /lance/i.test(a.name) ? "lance" : /heavy gunz/i.test(a.name) ? "heavy gunz" : /bombardment/i.test(a.name) ? "bombardment cannon" :
                 /batter|gunz/i.test(a.name) ? "battery" : a.name.replace(/^(dorsal|starboard|port|prow)\s+/i, "");
      /* one row per kind and arc; ranges become bands inside the row */
      var key = kind + "|" + a.arc;
      var v = num(a.now);
      if(!rows[key]){ rows[key] = { kind: kind, range: a.range, arc: a.arc, total: 0, dice: [], parts: [], bands: [], silent: [], contact: !!(a.torp || a.bays) }; order.push(key); }
      /* a weapon silenced by a critical (p. 67) or by what the ship is
         doing is listed under its row, struck through, so the sum shows
         what it lost and why */
      if(a.silent){ rows[key].silent.push({ ship: idx, name: a.name, now: v == null ? a.now : v, why: a.silent }); return; }
      /* a dice strength (Ork gunz D6+2, Fleets p. 362) cannot be added to a
         number: it is listed beside the sum, rolled at the table */
      if(v == null) rows[key].dice.push(String(a.now)); else rows[key].total += v;
      rows[key].parts.push({ ship: idx, name: a.name, now: v == null ? a.now : v, range: rangeCm(a.range) });
    });
  });
  return order.map(function(k){
    var r = rows[k];
    /* the sum that reaches each distance: everything at the shortest
       range, the long-ranged ships alone beyond it */
    var cms = []; r.parts.forEach(function(p){ if(p.range != null && cms.indexOf(p.range) < 0) cms.push(p.range); });
    cms.sort(function(a, b){ return a - b; });
    r.bands = cms.map(function(cm){
      return { range: cm, total: r.parts.reduce(function(s, p){ return s + ((p.range != null && p.range >= cm && typeof p.now === "number") ? p.now : 0); }, 0) };
    });
    if(cms.length) r.range = cms[cms.length - 1] + " cm";
    return r;
  });
}
/* The longest number of centimetres in a range text ("30 cm", "25/30"). */
function rangeCm(t){
  var m = String(t == null ? "" : t).match(/\d+/g);
  if(!m) return null;
  return Math.max.apply(null, m.map(function(x){ return parseInt(x, 10); }));
}

/* Damage Control (p. 88): one D6 per damage point remaining, half (rounding
   up) with Blast Markers in contact. Necron 4+ and Mechanicus +1D6 are on
   the card as R.damage.repair text; the pool here is the standard one. */
function repairDice(R, st){
  var n = remaining(R, st);
  if(st.blast > 0) n = half(n);
  return n;
}

/* Boarding value (p. 89): damage points remaining; the defender adds its
   turrets. +2 against a crippled ship for the attacker (p. 90). */
/* A star fort (Fleets p. 502): "the remaining hit points of all four
   quadrants apply to the Ramilies' boarding value, but only the turret
   value of the quadrant actually being boarded is added" - and only a
   space hulk may try (p. 502, p. 111). */
function boardingValue(R, st){
  var t = turrets(R, st);
  if(isFort(R) && st.quads){
    var all = st.quads.reduce(function(a, q){ return a + Math.max(0, R.stats.hits - (q.hits | 0)); }, 0);
    return { attack: all, defend: all + (t.now | 0), fort: true };
  }
  return { attack: remaining(R, st), defend: remaining(R, st) + (t.now | 0) };
}

/* p. 57: a disengaged escort squadron "counts as 25 % destroyed if the
   squadron was crippled before disengaging, as in if at least half the
   escorts in the squadron were destroyed (rounding down)". p. 123 rounds
   up instead; RULINGS.md T7 takes p. 57. */
function escortCrippled(st){
  var m = st.members || [], dead = m.filter(function(x){ return x.dead; }).length;
  return m.length > 0 && dead > 0 && dead >= Math.floor(m.length / 2);
}

/* Victory points the ENEMY earns from this unit (p. 123): destroyed - full
   points "including the points value of any Admiral, Warmaster or Chaos
   Lord on board" (plus = the embarked commander's points, RULINGS.md T11);
   capital ship crippled - 25 % rounded up; disengaged - 25 % if crippled,
   else 10 %, rounded up. A part-lost escort squadron pays only when it
   disengages (p. 57) or is wholly destroyed (p. 123). */
/* Planetary defences (p. 123, "Escort Ships, Orbital Defences and Other
   Vessels"): "Each destroyed planetary defence installation earns a
   player a number of victory points equal to the installation's points
   value." So platforms, silos and air bases bought six at a time pay one
   by one - each its own share of the unit's points - and a station, a
   Blackstone or a star fort pays when it is destroyed: the 25 % for
   crippling is "a capital ship['s]" on the same page, and an installation
   cannot disengage. A star fort is destroyed with all four quadrants at 0
   (Fleets p. 502). Defence vessels of type Escort follow the escort
   sentence: "provided the entire escort squadron is destroyed" (RULINGS.md
   T28). Orbital mines bought one by one "count for victory points when
   destroyed, regardless of how they are removed from play" (Fleets
   p. 512); a minefield and the mines it releases do not (p. 513). */
/* Demiurg vessels in the War Host list: "Though their point cost remains
   unchanged, Strongholds are worth 400 points, Bastions are worth 300 points
   and Citadels are worth 200 points when determining Victory Points"
   (Fleets p. 486) - R.victory (DOMAIN.victoryWorth, J214). */
function conceded(R, st, plus){
  if(!R || !st) return 0;
  var worth = R.victory && R.victory.points != null ? R.victory.points : (R.points | 0);
  var pts = worth + (plus | 0);
  if(tickUnit(R) || (isInstallation(R) && isEscort(R))){
    var ms = st.members || [], gone = ms.filter(function(x){ return x.dead; }).length;
    return ms.length ? Math.ceil((R.points | 0) * gone / ms.length) : 0;
  }
  if(R.kind !== "ship") return 0;
  if(isInstallation(R)) return destroyed(R, st) ? pts : 0;
  /* Fleets p. 404: "count up the Necron losses using the following
     modifiers" - disengaged undamaged 10 %, disengaged with any damage or
     any raider that disengages 25 %, crippled 50 %, destroyed 200 %, and
     left as a drifting hulk 300 %. A destroyed raider is a normal loss. */
  if(/NECRON/i.test(String(R.source && R.source.faction || ""))){
    if(destroyed(R, st)) return isEscort(R) ? pts : pts * (st.hulk === "drifting" ? 3 : 2);
    if(isEscort(R)) return st.disengaged ? Math.ceil(pts * 0.25) : 0;
    if(st.disengaged) return Math.ceil(pts * (st.hits > 0 ? 0.25 : 0.10));
    return crippled(R, st) ? Math.ceil(pts * 0.5) : 0;
  }
  if(destroyed(R, st)) return pts;
  if(isEscort(R)){
    if(!st.disengaged) return 0;
    return Math.ceil(pts * (escortCrippled(st) ? 0.25 : 0.10));
  }
  var cr = crippled(R, st);
  if(st.disengaged) return Math.ceil(pts * (cr ? 0.25 : 0.10));
  return cr ? Math.ceil(pts * 0.25) : 0;
}

/* A mixed escort squadron of several cards (the builder's letter, 28.10.2026)
   concedes as ONE squadron (p. 123): "Each destroyed escort earns its value
   in victory points provided the entire escort squadron is destroyed", and
   a disengaged squadron 25 % of its total value if it lost half of its
   ships (escortCrippled's count), else 10 %. units: [{ R, st, plus }]. */
function squadronConceded(units){
  if(!units || !units.length) return 0;
  var pts = units.reduce(function(a, u){
    var w = u.R && u.R.victory && u.R.victory.points != null ? u.R.victory.points : ((u.R && u.R.points) | 0);
    return a + w + (u.plus | 0); }, 0);
  var live = units.filter(function(u){ return !destroyed(u.R, u.st); });
  if(!live.length) return pts;
  if(!live.every(function(u){ return u.st.disengaged; })) return 0;
  var ms = [].concat.apply([], units.map(function(u){ return u.st.members || []; }));
  return Math.ceil(pts * (escortCrippled({ members: ms }) ? 0.25 : 0.10));
}

/* The page the conceded figure comes from, for the card's own line:
   Necron losses are counted on Fleets p. 404, an escort's disengage on
   p. 57, everything else on p. 123. */
function concededPage(R){
  if(tickUnit(R)) return "Fleets p. 512";
  if(isInstallation(R)) return "p. 123";
  if(/NECRON/i.test(String(R && R.source && R.source.faction || ""))) return "Fleets p. 404";
  if(R && R.victory) return "p. 123, Fleets p. " + R.victory.page;
  return isEscort(R) ? "p. 57, 123" : "p. 123";
}

/* Criticals are counters (p. 67 "cumulative ... must repair all
   incidences"). 9 and 10 may not be repaired (p. 67). */
/* p. 67: "multiple criticals are rolled for a location that cannot be
   repaired (such as Shields Collapse), apply the next highest critical hit
   instead" - a second 9 is a 10, a second 10 is an 11. The key actually
   applied is returned so the card can say so. */
/* Does the ship carry an active weapon at this location (dorsal, starboard,
   port, prow)? p. 67's example: "a ship with no dorsal weapons gets a Dorsal
   Armament Damaged critical hit. In this case the ship would suffer damage
   to its starboard armament." */
function hasLocation(R, loc){
  var re = new RegExp("^" + loc + "\\b", "i");
  return (R.weapons || []).some(function(w){ return w.state !== "offered" && re.test(w.a[0]); });
}
/* The result actually applied for a rolled key: a location the ship does
   not have, or a permanent result already taken, rolls on to the next
   (p. 67). Pure - the card asks before adding 11/12's dice. */
function critTarget(st, key, R){
  var k = String(key);
  if(!(!R || standardCrits(R))) return k;
  var guard = 0;
  while(guard++ < 12 && CRITS[k] && CRITS[String(parseInt(k, 10) + 1)] &&
        ((CRITS[k].perm && st.crits && st.crits[k] > 0) || (R && CRITS[k].loc && !hasLocation(R, CRITS[k].loc))))
    k = String(parseInt(k, 10) + 1);
  return k;
}
/* A star fort's criticals are the selected quadrant's (Fleets p. 501):
   track() is where they are counted. */
function addCrit(st, key, R){
  /* A quadrant at 0 takes no further damage (Fleets p. 501), so nothing can
     be inflicted on it: a critical 11 tapped there used to take the
     Basilica's weapons with it (review 9.10.2026). */
  if(R && quadGone(R, st)) return null;
  var t = R ? track(R, st) : st;
  t.crits = t.crits || {};
  var k = critTarget(st, key, R);
  t.crits[k] = (t.crits[k] | 0) + 1;
  if((!R || standardCrits(R)) && k === "9") st.ldPerm = -3;   /* once: "reduced by 3", p. 67 */
  return k;
}
/* p. 67 Bridge Smashed on the flagship: "any remaining Fleet Commander
   re-rolls are lost for the remainder of the battle". */
function flagshipBridgeSmashed(fleet){ fleet.rerolls = 0; fleet.rerollsLost = true; return fleet; }
/* The fleet's re-rolls at the start of the game. A commander's re-rolls are
   used once per game (Fleets p. 11); Abaddon's are "1 per turn" - "Abaddon's
   fleet is allowed to re-roll a single Command check or Leadership test each
   turn" (Fleets p. 241) - so that pool is marked to come back. */
/* A ship's own re-rolls that become the fleet's while the commander is
   aboard (Fortress-Monastery, Fleets p. 111; Ramilies p. 503; J168 b). */
function rerollsJoinFleet(R, commanderAboard){
  return !!(R && R.rerolls && R.rerolls.joins && commanderAboard);
}
function setRerolls(fleet, n, perTurn, kinds){
  var k = (kinds || []).slice(0, n | 0);
  while(k.length < (n | 0)) k.push("included");
  fleet.rrKinds = k;
  fleet.rrUsed = k.map(function(){ return false; });
  fleet.rerolls = k.length;
  fleet.rerollsPerTurn = perTurn ? k.length : 0;
  return fleet;
}
/* ---- re-roll boxes (user 5.10.2026) ---------------------------------------
   A pool is whatever holds re-rolls: the fleet (its commander's, or the
   fleet's own without one) or a further commander's own unit state. It has
   one box per re-roll, of the kind it came as - "included" in the price,
   "bought", an open "optional" one taken into use at the table, or one
   "added" on the counter - and each box is used or not. rerolls, the count
   left, always follows the boxes. */
function rrLeft(p){ return p.rrUsed.filter(function(u){ return !u; }).length; }
/* A record saved before the boxes existed has only its count left: the
   roster's kinds are laid over it, the used ones last, and a count above
   the roster's keeps its extra boxes. o.fresh: the build that saved it kept
   no count for this pool at all (a fleet without a commander before
   5.10.2026 - its rerolls field is the untouched 0), so the boxes start
   free. o.perTurn: the roster says the pool is per turn (Abaddon, Fleets
   p. 241); a record older than that flag gets it here. */
function adoptRerolls(p, kinds, o){
  var k = (kinds || []).slice();
  if(o && o.perTurn != null) p.rerollsPerTurn = o.perTurn ? k.length : 0;
  if(Array.isArray(p.rrKinds) && Array.isArray(p.rrUsed) && p.rrKinds.length === p.rrUsed.length) return p;
  var left = (o && o.fresh) || p.rerolls == null ? k.length : Math.max(0, p.rerolls | 0);
  while(k.length < left) k.push("added");
  p.rrKinds = k;
  p.rrUsed = k.map(function(_, i){ return i >= left; });
  if(p.rerollsLost) left = 0;
  p.rerolls = left;
  return p;
}
function rerollBoxes(p){
  adoptRerolls(p, []);
  return p.rrKinds.map(function(k, i){
    return { kind: k, used: !!p.rrUsed[i] || !!p.rerollsLost, lost: !!p.rerollsLost };
  });
}
/* One box tapped: that re-roll is used, or back if it was - two states and
   no third, so the tap that corrects a slip is a second tap on the same
   spot whatever the box (review 5.10.2026). Nothing comes back once the
   flagship's bridge is smashed (p. 67). */
function toggleReroll(p, i){
  adoptRerolls(p, []);
  if(p.rerollsLost || !(i >= 0 && i < p.rrKinds.length)) return p;
  p.rrUsed[i] = !p.rrUsed[i];
  p.rerolls = rrLeft(p);
  return p;
}
/* A box more: an open option of the list taken into use ("optional"), or
   one the player adds on the counter ("added" - a sub-plot's extra re-roll,
   p. 127, or a correction). */
function addReroll(p, kind){
  adoptRerolls(p, []);
  if(p.rerollsLost) return p;
  p.rrKinds.push(kind || "added");
  p.rrUsed.push(false);
  p.rerolls = rrLeft(p);
  return p;
}
/* The counter's minus and plus. Plus gives the last used box back and,
   with none used, adds a box; minus first takes back a box the counter
   added that is still free - so a slip on plus is undone by minus - and
   otherwise uses the first free box. */
function adjustRerolls(p, d){
  adoptRerolls(p, []);
  if(p.rerollsLost) return p;
  var i, n = p.rrKinds.length;
  if(d < 0){
    if(n && p.rrKinds[n - 1] === "added" && !p.rrUsed[n - 1]){ p.rrKinds.pop(); p.rrUsed.pop(); }
    else { i = p.rrUsed.indexOf(false); if(i >= 0) p.rrUsed[i] = true; }
  }else{
    i = p.rrUsed.lastIndexOf(true);
    if(i >= 0) p.rrUsed[i] = false; else return addReroll(p, "added");
  }
  p.rerolls = rrLeft(p);
  return p;
}
/* A turn is one player's turn (p. 50), and a re-roll is spent in the enemy's
   turn as well (a Brace for Impact check, p. 47): the per-turn pool comes
   back at the start of both (RULINGS.md T25). Only the boxes the roster gave
   it come back - one added at the table is once per battle like any other
   (p. 127). Lost with the bridge, p. 67. */
function refreshRerolls(p){
  if(p && p.rerollsPerTurn && !p.rerollsLost){
    adoptRerolls(p, []);
    for(var i = 0; i < p.rrUsed.length && i < p.rerollsPerTurn; i++) p.rrUsed[i] = false;
    p.rerolls = rrLeft(p);
  }
  return p;
}
/* A Bridge Smashed that is taken off the flagship again (a mis-tapped 9,
   RULINGS.md T24): the boxes are as they were before it. */
function flagshipBridgeRestored(fleet){
  fleet.rerollsLost = false;
  adoptRerolls(fleet, []);
  fleet.rerolls = rrLeft(fleet);
  return fleet;
}
/* Who leads the fleet. The roster's order is the player's - units are added
   and dragged freely in the builder - so it cannot say; the fleet list can:
   every list prints its fleet commander before its captains, lords and
   farseers (Bastion: Admiral p. 36, Veteran Captains p. 38; Chaos:
   Warmaster before Chaos Lords, pp. 242-252; Iyanden: Autarch before
   Farseers, p. 316). rows: [{kind, s, e}] with the list's section and row
   index; returns the roster index, -1 without a commander. */
function fleetCommander(rows){
  var best = -1;
  (rows || []).forEach(function(r, i){
    if(!r || r.kind !== "commander") return;
    var b = best < 0 ? null : rows[best];
    if(!b || r.s < b.s || (r.s === b.s && r.e < b.e)) best = i;
  });
  return best;
}
function repairCrit(st, key, R){
  if((!R || standardCrits(R)) && CRITS[key] && CRITS[key].perm) return st;
  var t = R ? track(R, st) : st;
  if(t.crits && t.crits[key] > 0) t.crits[key]--;
  if(t.crits && t.crits[key] === 0) delete t.crits[key];
  return st;
}
/* A result taken off because it was tapped by mistake - not damage
   control (p. 88), so a permanent one (p. 67) comes off too. */
function removeCrit(st, key, R){
  var t = R ? track(R, st) : st;
  if(t.crits && t.crits[key] > 0) t.crits[key]--;
  if(t.crits && t.crits[key] === 0) delete t.crits[key];
  return st;
}
/* The results on the unit - a star fort's selected quadrant when R is
   given - in the table's order; "2-3" and "8-9" (the Defences table,
   p. 101) sort by their first number. */
function activeCrits(st, R){
  var t = R ? track(R, st) : st;
  return Object.keys(t.crits || {}).filter(function(k){ return t.crits[k] > 0; })
    .sort(function(a, b){ return (parseInt(a, 10) || 0) - (parseInt(b, 10) || 0); })
    .map(function(k){ return { key: k, count: t.crits[k], def: CRITS[k] || null }; });
}

/* Hits (p. 65). An escort takes no hits - a member dies instead. A star
   fort's hits go to the selected quadrant and stop at its 12: "any
   further hits ... do no further damage" (Fleets p. 501). */
function addHits(R, st, n){
  if(isEscort(R) || !R.stats) return st;
  var t = track(R, st);
  t.hits = Math.max(0, Math.min(R.stats.hits, (t.hits | 0) + (n | 0)));
  return st;
}
/* A tap on box n of the hit track: the damage is n, or n - 1 when that
   box was the last one filled (the tap that corrects a slip). */
function tapHit(R, st, n){
  if(isEscort(R) || !R.stats) return st;
  var t = track(R, st);
  t.hits = Math.max(0, Math.min(R.stats.hits, (t.hits | 0) === n ? n - 1 : n));
  return st;
}

/* Special orders. One at a time (p. 46), once per turn per ship or squadron
   (p. 95), and after the first failed Command check no more this turn
   except Brace (p. 48). A passed Reload Ordnance reloads both flags (p. 74). */
/* Which orders a unit may take at all (R.orders, null = any). Planetary
   defences "cannot take on any special orders except Reload Ordnance,
   though they may also attempt to Brace For Impact" (Rulebook p. 100,
   Fleets p. 499); a Ramilies adds Lock On (Fleets p. 503), and so do the
   Fortress-Monastery (p. 111) and the Eldar Haven (p. 334). */
/* The three orders that are about moving. A unit that stays where it is
   (isStill: the Nicassar Rig, "stationary in the same manner as any other
   planetary defence", Fleets p. 493) has no use for them, and the page
   calls it STATIONARY. */
var MOVE_ORDERS = { AAF: 1, CTNH: 1, BR: 1 };
function mayOrder(R, id){
  if(R && MOVE_ORDERS[id] && isStill(R)) return false;
  return !(R && Array.isArray(R.orders)) || R.orders.indexOf(id) >= 0;
}
function ordersFor(R){
  return ORDERS.filter(function(o){ return mayOrder(R, o.id); });
}
/* A ship whose Leadership is not rolled: the planetary defences' nominal 7
   (Rulebook p. 100: they "do not roll for leadership or have a leadership
   value" and make their checks "against Ld 7") and the Fortress-
   Monastery's "base leadership of 10" (Fleets p. 111). A commander's own
   Leadership line is another thing (RULINGS.md T8). */
function fixedLd(R){
  var l = R && R.kind === "ship" ? R.leadership : null;
  if(!l || l.kind !== "fixed" || l.value == null) return null;
  return { value: l.value, note: String(l.note || ""), page: l.page || null };
}
/* ---- Rolling the Leadership (user 31.10.2026, RULINGS.md T44) ----------
   The page rolls the D6 when asked to; the value stays the player's to
   change. ldPlan(R, list) says which table a unit rolls on and what the
   book adds to the roll; ldFromDie(plan, d) is the value.

   Tables (D6 -> Ld):
     Rulebook p. 45:            1 = 6, 2-3 = 7, 4-5 = 8, 6 = 9
     Space Marines, p. 94:      1-2 = 8, 3-4 = 9, 5-6 = 10 ("Grey Knights
                                count as Space Marines in all respects",
                                p. 154)
     Adeptus Mechanicus, p. 118: 1 = 7, 2-3 = 8, 4-6 = 9 ("To determine base
                                leadership for a given vessel")
   Modifiers on the rolled value, from the rule lines the card carries
   (hull ids of packages/rules SPECIAL_HULL_RULES and the profile's text):
     Orks -1 (p. 360), pirates -1 (p. 188), Eldar and Dark Eldar +1
     (pp. 304, 344), Chaos Space Marine crew +1 (p. 234), a transport -1
     (pp. 85, 291, 331, 476), the ship's own +1 (Emperor p. 53, Oberon p. 56
     and their Mechanicus copies pp. 128, 130; Nicassar Caravan p. 492).
     Nothing over 10 (p. 48).
   Not rolled: a Leadership the book fixes (fixedLd), an Ork Hulk's
   "always Leadership 6" (p. 392), a Necron Sepulchre's 10 (p. 406), a
   Demiurg's starting value (pp. 488-490); the Tyranids (pp. 418-420, 429)
   are left to the player. A commander's line is applied after the roll as
   before (applyCommanderLd, T8). */
var LD_TABLES = {
  rulebook:  { name: "Rulebook", page: 45, book: "Rulebook", d: [null, 6, 7, 7, 8, 8, 9], rows: "1 = 6, 2-3 = 7, 4-5 = 8, 6 = 9" },
  marines:   { name: "Space Marines", page: 94, book: "Fleets", d: [null, 8, 8, 9, 9, 10, 10], rows: "1-2 = 8, 3-4 = 9, 5-6 = 10" },
  mechanicus:{ name: "Adeptus Mechanicus", page: 118, book: "Fleets", d: [null, 7, 8, 8, 9, 9, 9], rows: "1 = 7, 2-3 = 8, 4-6 = 9" }
};
function ruleIds(R){
  var out = {};
  (R && R.rules || []).forEach(function(r){
    if(r.hull) out[r.hull] = 1;
    (r.refs || []).forEach(function(x){ if(x && x.id) out[x.id] = 1; });
  });
  return out;
}
function ruleText(R){ return (R && R.rules || []).map(function(r){ return String(r.t || ""); }).join(" | "); }
function ldPlan(R, list){
  if(!R || R.kind !== "ship") return null;
  var fx = fixedLd(R);
  if(fx) return { roll: false, value: fx.value, note: fx.note || "fixed", page: fx.page, book: "Fleets" };
  var ids = ruleIds(R), txt = ruleText(R), fl = String(R.source && R.source.faction || ""), ln = String((R.entry && R.entry.list) || list || "");
  if(ids.ork_hulk_ld) return { roll: false, value: 6, note: "Ork Hulk: always Ld 6", page: 392, book: "Fleets" };
  if(ids.sepulchre) return { roll: false, value: 10, note: "carries the Sepulchre: Ld 10", page: 406, book: "Fleets" };
  var dm = txt.match(/count their Ld value as (\d+) at the start of the battle/i);
  if(dm) return { roll: false, value: parseInt(dm[1], 10), note: "Demiurg: Ld " + dm[1] + " at the start, -1 per damage point, not below 5", page: R.source.page || 488, book: "Fleets" };
  if(/TYRANID/i.test(fl)) return { roll: false, value: null, note: "Tyranids: not rolled here - Hive Mind, synapse and instinct (Fleets pp. 418-420; Vanguard p. 429)", page: 418, book: "Fleets", manual: true };
  var t = /Mechanicus/i.test(ln) ? LD_TABLES.mechanicus
        : (/SPACE MARINES|GREY KNIGHTS/i.test(fl) && !/FORTRESS-MONASTERY/i.test(String(R.className || ""))) ? LD_TABLES.marines
        : LD_TABLES.rulebook;
  var mods = [];
  if(ids.ork_core || ids.rok_orks) mods.push({ t: "Orks", v: -1, page: 360 });
  if(ids.pirate_ld) mods.push({ t: "pirate vessel", v: -1, page: 188 });
  if(ids.eldar_ld) mods.push({ t: "Eldar", v: 1, page: 304 });
  if(ids.dark_ld) mods.push({ t: "Dark Eldar", v: 1, page: 344 });
  if(ids.csm_crew || ids.wage_of_sin_crew || ids.slaverer_crew) mods.push({ t: "Chaos Space Marine crew", v: 1, page: 234 });
  if(/reduce (?:their|its) randomly rolled Leadership by one|-1 modifier (?:against the Eldar leadership table|when determining base leadership)/i.test(txt))
    mods.push({ t: "transport", v: -1, page: R.source.page || 85 });
  if(/(?:giving it|adds) \+1 to (?:its|their) Leadership rating|have \+1 Leadership/i.test(txt))
    mods.push({ t: "the ship's own", v: 1, page: R.source.page || 53 });
  return { roll: true, table: t, mods: mods, max: 10 };
}
/* The value a die gives on the plan: the table, the modifiers, at most 10
   (p. 48). why: the sum in words, for the set-up row. */
function ldFromDie(plan, d){
  if(!plan || !plan.roll || !(d >= 1 && d <= 6)) return null;
  var base = plan.table.d[d], v = base;
  plan.mods.forEach(function(m){ v += m.v; });
  v = Math.min(plan.max || 10, v);
  var why = "D6 " + d + " = Ld " + base + plan.mods.map(function(m){ return (m.v > 0 ? " +" : " ") + m.v + " " + m.t; }).join("") + (plan.mods.length ? " = " + v : "");
  return { value: v, die: d, why: why };
}
/* One D6, 1-6. rng: a function returning [0, 1), Math.random by default
   (the tests pass their own). */
function d6(rng){ return 1 + Math.floor((rng || Math.random)() * 6); }
/* May a fleet commander be aboard? Any capital ship; of the planetary
   defences only those the book gives a commander to: the star forts -
   "Fleet Commanders may be placed aboard a Ramilies" (Fleets p. 503),
   "aboard a fortress" (p. 111) - and the Eldar Haven, whose own rule line
   says a "fleet commander can lead the battle aboard it instead of a
   ship" (p. 334). A platform, a station, an air base or a defence vessel
   has no Leadership value at all (Rulebook p. 100) and no such line. */
function mayCarryCommander(R){
  if(!R || R.kind !== "ship" || !R.stats || isEscort(R)) return false;
  if(!R.defence) return true;
  if(isFort(R)) return true;
  return (R.rules || []).some(function(r){ return /fleet commander (may|can) lead the battle (from|aboard) it|commanders? may be placed aboard/i.test(String(r.t || "")); });
}
/* The flagship the page proposes: the biggest hull among the real capital
   ships; with none, the biggest defence a commander may board; else
   nobody (null). The player changes it at set-up. */
function defaultFlagship(Rs){
  var best = null, key = -1;
  (Rs || []).forEach(function(R, i){
    if(!mayCarryCommander(R)) return;
    var k = (R.defence ? 0 : 100000) + (R.stats.hits | 0);
    if(k > key){ key = k; best = i; }
  });
  return best;
}
function canOrder(st, fleet, id, R){
  if(!mayOrder(R, id)) return false;
  if(id === "BFI") return !st.braceLock && !braced(st);
  if(fleet.orderLock) return false;
  if(st.noOrdersTurn) return false;
  if(st.order) return false;
  if(st.braceTurn > 0) return false;   /* "Can't use any special orders at all in its next turn", p. 47 */
  return true;
}
function setOrder(st, fleet, id, passed){
  if(id === "BFI"){
    /* A failed Brace locks brace against this attacker (p. 47) and, being a
       failed Command check, ends the fleet's other orders this turn (p. 48).
       Brace itself stays allowed after the lock (p. 48). */
    if(!passed){ st.braceLock = true; fleet.orderLock = true; return st; }
    st.braceCarry = st.order && st.order !== "BFI" ? st.order : st.braceCarry;
    st.order = "BFI";
    st.braceTurn = fleet.turn + 1;   /* until the end of its next turn, p. 47 */
    st.braceLock = false;
    return st;
  }
  if(!passed){ fleet.orderLock = true; return st; }
  st.order = id;
  if(id === "RO"){ st.torps = true; st.craft = true; }
  return st;
}

/* Launching spends the whole allowance for that kind (p. 73) but not the
   other kind (p. 73). */
function launch(st, kind){
  if(kind === "torps") st.torps = false; else if(kind === "craft") st.craft = false;
  return st;
}

/* The start of the player's own turn (p. 51): special order dice come off
   except Brace; per-turn flags reset. Shields are NOT reset here - they
   come back only when the ship moves clear of its Blast Markers (p. 70),
   which is the player's own tap. */
function newTurn(units, fleet){
  fleet.turn = (fleet.turn | 0) + 1;
  fleet.mine = true;
  fleet.orderLock = false;
  fleet.radiation = 0;
  refreshRerolls(fleet);
  units.forEach(function(st){ refreshRerolls(st); });   /* a further commander's own pool */
  units.forEach(function(st){
    /* Brace holds through the ship's next turn (p. 47) and only then comes
       off; every other order comes off now (p. 51). The order Brace replaced
       stayed in effect for the rest of THAT turn (p. 66) and is gone with it. */
    if(st.braceTurn && st.braceTurn >= fleet.turn){ st.order = "BFI"; }
    else { st.braceTurn = 0; st.order = null; }
    st.braceCarry = null;
    st.played = 0;
    st.boarding = false;
    st.teleported = false;
    st.noOrdersTurn = false;
    st.braceLock = false;
  });
  return fleet;
}

/* The end of the player's own turn: a brace taken to hold "until the end of
   its next turn" (p. 47) ends here when that turn is this one. Nothing
   else changes - the enemy's turn is where braces are taken and hits come
   in, and the order dice stay on the table until my next turn (p. 51). */
function endTurn(units, fleet){
  fleet.mine = false;
  refreshRerolls(fleet);            /* the enemy's turn is a turn too */
  units.forEach(function(st){ refreshRerolls(st); });
  units.forEach(function(st){
    if(st.braceTurn && st.braceTurn <= fleet.turn){
      st.braceTurn = 0;
      if(st.order === "BFI") st.order = null;
      st.braceCarry = null;
    }
  });
  return fleet;
}

/* The player's own mark: 0 unplayed, 1 moved, 2 shot, and round again. A
   unit that cannot move (Rulebook p. 100) has no "moved": one tap is
   shot, the next unplayed. */
function cyclePlayed(st, R){
  if(R && isStill(R)) st.played = (st.played | 0) ? 0 : 2;
  else st.played = ((st.played | 0) + 1) % 3;
  return st;
}

/* The ship moved clear of its Blast Markers: shields back up (p. 70). */
function clearBlast(st){ st.blast = 0; return st; }

/* Escorts: one hit or any critical destroys a ship (p. 66); a Blast Marker
   replaces it (p. 71). */
function killMember(st, i){ if(st.members && st.members[i]) st.members[i].dead = true; return st; }
function reviveMember(st, i){ if(st.members && st.members[i]) st.members[i].dead = false; return st; }
function alive(st){ return (st.members || []).filter(function(m){ return !m.dead; }).length; }

/* Everything the card shows, in one call. */
/* For a star fort hits, max, crippled, shields, turrets, the quadrant
   rows of the armament, the criticals and the repair dice are the
   SELECTED quadrant's (quad: its index); quads lists all four. */
function view(R, st, fleet){
  var fort = isFort(R) && !!st.quads;
  return {
    escort: isEscort(R), capital: isCapital(R), fort: fort, still: isStill(R),
    quad: fort ? quadIndex(st) : null, quads: quadViews(R, st), quadGone: quadGone(R, st),
    hits: track(R, st).hits | 0, max: R.stats ? R.stats.hits : 0, remaining: remaining(R, st),
    crippledAt: R.damage ? R.damage.crippledAt : null,
    crippled: crippled(R, st), destroyed: destroyed(R, st), hulk: st.hulk,
    braced: braced(st), order: st.order ? ORDER_BY[st.order] : null,
    shields: shields(R, st), turrets: turrets(R, st), speed: speed(R, st), turns: turns(R, st),
    ld: leadership(R, st, fleet), arms: armament(R, st),
    crits: activeCrits(st, R), repairDice: repairDice(R, st), boarding: boardingValue(R, st),
    conceded: conceded(R, st), alive: isEscort(R) ? alive(st) : null
  };
}

return {
  ORDERS: ORDERS, ORDER_BY: ORDER_BY, CRITS: CRITS, HULKS: HULKS, LD_TABLE: LD_TABLE, LD_VALUES: LD_VALUES,
  freshUnit: freshUnit, freshFleet: freshFleet, isEscort: isEscort, isCapital: isCapital,
  crippled: crippled, destroyed: destroyed, remaining: remaining,
  shields: shields, turrets: turrets, speed: speed, turns: turns, leadership: leadership,
  armament: armament, braced: braced, repairDice: repairDice, boardingValue: boardingValue,
  conceded: conceded, squadronConceded: squadronConceded, addCrit: addCrit, repairCrit: repairCrit, removeCrit: removeCrit, activeCrits: activeCrits,
  standardCrits: standardCrits, critTarget: critTarget, hasLocation: hasLocation,
  catastrophic: catastrophic, hulkRules: hulkRules, isFort: isFort, staysInPlace: staysInPlace, concededPage: concededPage, fireDamage: fireDamage,
  reactiveHull: reactiveHull, escortCrippled: escortCrippled, flagshipBridgeSmashed: flagshipBridgeSmashed, setRerolls: setRerolls, rerollsJoinFleet: rerollsJoinFleet, refreshRerolls: refreshRerolls,
  rerollBoxes: rerollBoxes, toggleReroll: toggleReroll, addReroll: addReroll, adjustRerolls: adjustRerolls, adoptRerolls: adoptRerolls,
  flagshipBridgeRestored: flagshipBridgeRestored, fleetCommander: fleetCommander,
  addHits: addHits, canOrder: canOrder, setOrder: setOrder, launch: launch, newTurn: newTurn,
  clearBlast: clearBlast, killMember: killMember, reviveMember: reviveMember, alive: alive,
  endTurn: endTurn, cyclePlayed: cyclePlayed,
  squadronLd: squadronLd, escortFire: escortFire, squadronFire: squadronFire, squadronStatus: squadronStatus, noCombine: noCombine, rangeCm: rangeCm,
  /* planetary defences (8.10.2026) */
  QUADS: QUADS, track: track, selectQuad: selectQuad, quadGone: quadGone, quadViews: quadViews, adoptUnit: adoptUnit, tapHit: tapHit,
  tickUnit: tickUnit, isInstallation: isInstallation, isStill: isStill, launchBays: launchBays,
  fixedLd: fixedLd, LD_TABLES: LD_TABLES, ldPlan: ldPlan, ldFromDie: ldFromDie, d6: d6, mayOrder: mayOrder, ordersFor: ordersFor, mayCarryCommander: mayCarryCommander, defaultFlagship: defaultFlagship,
  view: view, half: half, num: num
};
})();
if(typeof module !== "undefined" && module.exports) module.exports = PLAY;
