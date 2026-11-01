/* Battlefleet Gothic - boarding action rules engine.
 *
 * Pure functions, no DOM, no randomness except through an injected rng.
 * Loaded both by the browser app and by test_engine.js under node.
 *
 * Sources (printed page == PDF page in both books):
 *   RB  = BFG Remastered Rulebook v1.11 .......... boarding p.89-91, crippled p.65,
 *                                                  criticals p.66-67, catastrophic p.71,
 *                                                  defence criticals p.101, End Phase p.88,
 *                                                  hit-and-run / teleport p.92
 *   REF = "Battlefleet Gothic - Boarding Actions", the 2-page complete-rules sheet
 *   FL  = BFG Remastered Official Fleets (WIP v0.40)
 */
(function (root) {
  "use strict";

  // ---------------------------------------------------------------- dice ----
  function makeRng(seed) {
    var s = seed >>> 0 || 1;
    return function () {
      s ^= s << 13; s >>>= 0;
      s ^= s >> 17;
      s ^= s << 5; s >>>= 0;
      return s / 4294967296;
    };
  }
  function d6(rng) { return 1 + Math.floor(rng() * 6); }

  // ------------------------------------------------------------- helpers ----
  function halfUp(n) { return Math.ceil(n / 2); }

  function has(ship, opt) {
    return !!(ship.opts && ship.opts.indexOf(opt) >= 0);
  }
  // A ship is crippled once it has LOST half its damage points (RB p.65).
  // Space hulks are the exception: "Space hulks are not crippled by damage like
  // ordinary ships" (FL p.290, p.393), so they never grant the +2 and never
  // halve their turrets.
  function isCrippled(ship) {
    if (has(ship, "spacehulk")) return false;
    return ship.dp > 0 && ship.dp * 2 <= ship.hp;
  }
  // Crippling halves turrets (RB p.65); the defender adds its REMAINING
  // turret / spore value (REF step 1). Turrets are never doubled or halved by
  // the ship's own boarding-value modifier - they are added after it (REF p.2).
  function effTurrets(ship) {
    if (!ship.turrets) return 0;
    // "Spore cysts: Full strength" is printed in the Tyranid crippled summary
    // (FL p.424), so a crippled bio-ship keeps all of them.
    if (ship.spores) return ship.turrets;
    return isCrippled(ship) ? halfUp(ship.turrets) : ship.turrets;
  }
  function alive(side) {
    // `out` marks a hull that is not part of this attempt any more - a holofield
    // save takes the ship out of the boarding action it saved against
    // (FL p.305: the attempt against it is ignored).
    return (side.ships || []).filter(function (s) { return s.dp > 0 && !s.out; });
  }
  function sideHas(side, opt) {
    return alive(side).some(function (s) { return has(s, opt); });
  }
  // Hexagrammic wards: an Ordo Malleus Inquisitor Lord, and Grey Knights capital
  // ships, ignore Chaos marks affecting boarding actions (FL p.152, p.155).
  function hasWards(side) {
    return sideHas(side, "inq_malleus") || sideHas(side, "greyknights");
  }

  // ------------------------------------------------- 1. boarding value ------
  // REF step 1: order of operations is Multiply, Divide, Add, Subtract.
  function shipValue(ship, side, role, enemy) {
    var steps = [];
    var base = has(ship, "hp2") ? 2 : ship.dp;   // FL p.390, Grunt assault ship
    if (has(ship, "hp2")) steps.push({ t: "counts as 2 HP (before other modifiers)", v: 2 });
    var v = base;

    var wards = enemy ? hasWards(enemy) : false;
    var mult = 1, why = [];
    // FL p.290: a Chaos space hulk "may not take any Chaos Marks", and both hulk
    // entries ban every upgrade that improves Boarding Value (FL p.290, p.392).
    if (has(ship, "khorne") && !wards && !has(ship, "spacehulk")) {
      mult *= 2; why.push("Mark of Khorne");
    }
    if (has(ship, "abaddon")) { mult *= 2; why.push("Abaddon"); }
    if (has(ship, "warlord") && !has(ship, "spacehulk")) { mult *= 2; why.push("Ork Warlord"); }
    if (side.race === "tyranid") { mult *= 2; why.push("Tyranids"); }
    if (side.race === "kroot") { mult *= 2; why.push("Kroot Warsphere"); }
    if (mult !== 1) { v = v * mult; steps.push({ t: "x" + mult + " " + why.join(" + "), v: v }); }
    if (has(ship, "khorne") && wards) {
      steps.push({ t: "Mark of Khorne is ignored (hexagrammic wards)", v: v });
    }

    // FL p.502: "the remaining hit points of all four quadrants apply to the
    // Ramilies' boarding value, but only the turret value of the quadrant
    // actually being boarded is added". The profile holds one quadrant, so the
    // rest are entered by hand and added here - never to the crippled test,
    // never to the turret term and never to the damage.
    if (ship.extraHp) {
      v = v + ship.extraHp;
      steps.push({ t: "+" + ship.extraHp + " remaining hit points on the other quadrants", v: v });
    }
    if (side.race === "tau") {                    // Kor'or'vesh ships are exempt
      v = halfUp(v);
      steps.push({ t: "halved, rounding up (Tau Kor’vattra)", v: v });
    }
    return { value: v, steps: steps, base: base };
  }

  function boardingValue(side, role, enemy) {
    var ships = alive(side);
    var parts = [], total = 0, turrets = 0;
    ships.forEach(function (sh) {
      var r = shipValue(sh, side, role, enemy);
      total += r.value;
      parts.push({ ship: sh, value: r.value, steps: r.steps, base: r.base });
    });
    if (role === "defender") {
      ships.forEach(function (sh) { turrets += effTurrets(sh); });
      total += turrets;
    }
    // Anything the book has and this app does not, entered by hand.
    var byHand = (ships.length && side.otherValue) || 0;
    total = Math.max(0, total + byHand);
    return { value: total, parts: parts, turrets: turrets, ships: ships, byHand: byHand };
  }

  // ------------------------------------------------ 2. attack modifiers -----
  // The ratio modifiers are an "only apply the highest" group (RB p.90 asterisk).
  // Brackets read "at least N times" (REF example 3).
  function ratioMod(own, enemy) {
    if (own <= enemy) return null;
    if (enemy <= 0) return { id: "ratio4", label: "boarding value 4x or more the enemy’s", v: 4 };
    var r = own / enemy;
    if (r >= 4) return { id: "ratio4", label: "boarding value 4x or more the enemy’s", v: 4 };
    if (r >= 3) return { id: "ratio3", label: "boarding value 3x the enemy’s", v: 3 };
    if (r >= 2) return { id: "ratio2", label: "boarding value 2x the enemy’s", v: 2 };
    return { id: "ratio1", label: "higher boarding value", v: 1 };
  }

  var RACE_MOD = {
    chaos: { id: "chaos", label: "Chaos", v: 1 },
    ork: { id: "ork", label: "Orks", v: 1 },
    spacemarines: { id: "marines", label: "Space Marines", v: 2 },
  };

  function sideIsAlien(side) {
    return isAlien(side.race) || sideHas(side, "alien");
  }
  function isAlien(race) {
    return ["ork", "eldar", "darkeldar", "necron", "tyranid", "tau", "tau_kororvesh",
      "kroot", "demiurg", "nicassar"].indexOf(race) >= 0;
  }

  // ctx: { round } - round 1 is the first End Phase of this boarding action
  function modifiers(side, enemy, role, ctx) {
    var mods = [];
    var eShips = alive(enemy);
    var mine = function (o) { return sideHas(side, o); };
    var theirs = function (o) { return sideHas(enemy, o); };

    // --- situational, about the ENEMY ---------------------------------------
    // Tyranids gain the Blast Marker modifier but never grant it, and boarding
    // itself places a Blast Marker on the target, so as boarder they always
    // have it (FL p.420).
    if (side.race === "tyranid" && role === "attacker") {
      mods.push({ id: "blast", label: "boarding places a Blast Marker on the target", v: 1 });
    } else if (enemy.blast && enemy.race !== "tyranid") {
      mods.push({ id: "blast", label: "enemy in contact with Blast Markers", v: 1 });
    }
    if (enemy.orders) {
      // The Jovian's improved sensors raise this modifier from +1 to +2
      // (FL p.63). This is a replacement, not an additional modifier.
      var orderBonus = mine("orders2") ? 2 : 1;
      mods.push({ id: orderBonus === 2 ? "orders2" : "orders", label: orderBonus === 2
        ? "enemy on special orders (Jovian sensor array)"
        : "enemy on special orders", v: orderBonus });
    }
    // +2 per crippled enemy ship (REF example 3: two crippled Kill Kroozers gave +4)
    var crip = eShips.filter(isCrippled).length;
    if (crip > 0) {
      mods.push({
        id: "crippled",
        label: crip > 1 ? crip + " crippled enemy ships" : "enemy ship is crippled",
        v: 2 * crip,
      });
    }
    // Hemlock, Shadowhunter, Ghostship: "a ship that BOARDS one gains a +1
    // modifier" (FL p.325, p.330, p.309) - the boarder only.
    if (role === "attacker" && eShips.some(function (s) { return has(s, "easyprey"); })) {
      mods.push({ id: "easyprey", label: "boarding a fragile Eldar hull", v: 1 });
    }
    // Talons refit: "Enemy ships attempting to board the vessel ... suffer a -2
    // modifier" (FL p.311, p.352) - again the boarder only.
    if (role === "attacker" && theirs("talons")) {
      mods.push({ id: "talons", label: "the target carries the Talons refit", v: -2 });
    }

    // A vessel with no crew has no boarding parties, so none of the modifiers
    // that describe the quality of a crew can apply to it (FL p.286).
    var ownShips = alive(side);
    var crewless = ownShips.length > 0 && ownShips.every(function (x) { return has(x, "nocrew"); });
    if (crewless) {
      if (side.other) mods.push({ id: "other", label: "other modifier entered by hand", v: side.other });
      return mods;
    }

    // --- race, counted ONCE per side (RB p.90, REF step 2) -------------------
    // A Blackship is explicitly not crewed by Space Marines even in a fleet
    // that contains them (FL p.158). Ignore an invalid saved/manual Marines
    // flag on that hull instead of silently granting another +2.
    var marineCrew = ownShips.some(function (s) { return has(s, "marines") && !has(s, "blackship"); });
    var marines = (side.race === "spacemarines") || marineCrew;
    if (side.race === "chaos" && mine("csm")) {
      mods.push({ id: "csm", label: "Chaos Space Marine crew", v: 2 });   // supersedes +1 Chaos
    } else if (RACE_MOD[side.race]) {
      mods.push(RACE_MOD[side.race]);
    }
    if (side.race !== "spacemarines" && marineCrew) {
      mods.push({ id: "marines", label: "Space Marine crew", v: 2 });
    }

    // --- per-side upgrades, counted once ------------------------------------
    // REF p.1 lists Abaddon, mega-armour and Goff crew; the named ship/fleet
    // rules add Berzerkers (FL p.266), Clanz Warlord (FL p.374) and Aspect
    // Warrior Hosts (FL p.307).
    if (mine("abaddon")) mods.push({ id: "abaddon", label: "Abaddon the Despoiler", v: 1 });
    if (mine("berzerkers")) mods.push({ id: "berzerkers", label: "Khorne Berzerker retinue", v: 2 });
    if (mine("megaarmour")) mods.push({ id: "megaarmour", label: "mega-armoured boarding parties", v: 1 });
    if (mine("goff")) mods.push({ id: "goff", label: "Goff clan", v: 1 });
    if (mine("clanzwarlord")) mods.push({ id: "clanzwarlord", label: "Ork Clanz Warlord (once per game)", v: 2 });
    if (mine("aspect")) mods.push({ id: "aspect", label: "Aspect Warrior Host", v: 2 });

    // An Inquisitor Lord's +2 is not added on top of an identical Space Marine
    // or Grey Knights bonus (FL p.154).
    var inq = mine("inq_malleus") ? { id: "inq_malleus", label: "Ordo Malleus Inquisitor Lord", v: 2 }
      : mine("inq_hereticus") ? { id: "inq_hereticus", label: "Ordo Hereticus Inquisitor Lord", v: 2 }
        : null;
    if (inq && !marines) mods.push(inq);
    if (mine("inq_xenos") && sideIsAlien(enemy) && !marines) {
      mods.push({ id: "inq_xenos", label: "Ordo Xenos Inquisitor Lord vs aliens", v: 2 });
    }
    if (sideIsAlien(side) && theirs("inq_xenos")) {
      mods.push({ id: "vs_xenos", label: "alien vessel vs an Ordo Xenos Inquisitor Lord", v: -1 });
    }

    // --- defending only ------------------------------------------------------
    // These hull/commander bonuses are FL p.72, p.158 and p.48 respectively.
    if (role === "defender") {
      if (mine("corridor")) mods.push({ id: "corridor", label: "Endeavour/Endurance/Defiant hull", v: 1 });
      if (mine("blackship")) mods.push({ id: "blackship", label: "Inquisition Blackship garrison", v: 2 });
      if (mine("rath")) mods.push({ id: "rath", label: "Lord Admiral Rath’s flagship crew", v: 1 });
    }

    // --- Dark Eldar raiding tempo (REF p.1) ---------------------------------
    if (side.race === "darkeldar") {
      if ((ctx && ctx.round || 1) === 1) mods.push({ id: "de1", label: "Dark Eldar, first round", v: 1 });
      else mods.push({ id: "de2", label: "Dark Eldar, later rounds", v: -1 });
    }

    // --- anything the book has and this app does not ------------------------
    if (side.other) {
      mods.push({ id: "other", label: "other modifier entered by hand", v: side.other });
    }
    return mods;
  }

  // --------------------------------------------------------- 3. results -----
  // RB p.90 results table. The first threshold is the WINNER causing a critical
  // on the loser, the second the loser causing one back. crit 0 = automatic,
  // 7 = cannot happen.
  var RESULTS = [
    { diff: 0, name: "Grapple", win: 7, lose: 7 },
    { diff: 1, name: "Stalemate", win: 5, lose: 5 },
    { diff: 2, name: "Heavy Fighting", win: 4, lose: 5 },
    { diff: 3, name: "Driven Back", win: 3, lose: 6 },
    { diff: 4, name: "Stormed", win: 2, lose: 6 },
    { diff: 5, name: "Overwhelmed", win: 0, lose: 7 },
  ];
  function resultFor(diff) { return RESULTS[Math.min(diff, 5)]; }

  // ------------------------------------------------------ critical hits -----
  function row(lo, hi, extra, name, text, followup) {
    var r = { lo: lo, hi: hi, extra: extra, name: name, text: text };
    if (followup) r.followup = followup;
    return r;
  }
  var CRIT_TABLES = {
    standard: {
      id: "standard", label: "Critical Hits", page: "RB p.67", dice: 2, rows: [
        row(2, 2, 0, "Dorsal Armament Damaged", "The dorsal armament may not fire until repaired."),
        row(3, 3, 0, "Starboard Armament Damaged", "The starboard armament may not fire until repaired."),
        row(4, 4, 0, "Port Armament Damaged", "The port armament may not fire until repaired."),
        row(5, 5, 0, "Prow Armament Damaged", "The prow armament may not fire until repaired."),
        row(6, 6, 1, "Engine Room Damaged", "The ship may not make any turns until repaired."),
        row(7, 7, 0, "Fire!", "Roll to extinguish in the End Phase; if it is not put out it causes 1 extra damage and keeps burning."),
        row(8, 8, 1, "Thrusters Damaged", "Speed reduced by 10 cm until repaired."),
        row(9, 9, 0, "Bridge Smashed", "Leadership -3, may not be repaired. On a flagship, any remaining Fleet Commander re-rolls are lost."),
        row(10, 10, 0, "Shields Collapse", "Shield Strength reduced to zero. May not be repaired."),
        row(11, 11, "D3", "Hull Breach", "A huge gash is torn in the hull."),
        row(12, 12, "D6", "Bulkhead Collapse", "Whole compartments crumple."),
      ],
    },
    eldar: {
      id: "eldar", label: "Eldar Critical Hits", page: "FL p.307", dice: 2, rows: [
        row(2, 2, 0, "Infinity circuit damaged", "Leadership -1 until repaired."),
        row(3, 3, 0, "Keel armament damaged", "The keel armament may not fire until repaired."),
        row(4, 4, 0, "Prow armament damaged", "The prow armament may not fire until repaired."),
        row(5, 5, 0, "Mast lines severed", "Until repaired the ship may only turn up to 90° before it moves."),
        row(6, 6, 0, "Mainsail scarred", "Each of the ship’s speeds is reduced by 5 cm until repaired."),
        row(7, 7, 1, "Superstructure damaged", "Until repaired, roll a die every time the ship turns over 45°; on a 1 it suffers 1 extra damage."),
        row(8, 8, 0, "Mainsail shredded", "The ship cannot move in the Ordnance Phase until repaired."),
        row(9, 9, 1, "Infinity circuit smashed", "Leadership -3. May not be repaired."),
        row(10, 10, 0, "Holofield generators destroyed", "The ship no longer benefits from its holofields. May not be repaired."),
        row(11, 11, "D3", "Hull Breach", "A huge gash is torn in the hull."),
        row(12, 12, "D6", "Bulkhead Collapse", "Whole compartments crumple."),
      ],
    },
    tyranid: {
      id: "tyranid", label: "Tyranid Critical Hits", page: "FL p.425", dice: 2, rows: [
        row(2, 2, 0, "Spore cysts injured", "The spore cysts may not be used until repaired."),
        row(3, 3, 0, "Starboard armament wounded", "The starboard armament may not be used until repaired."),
        row(4, 4, 0, "Port armament wounded", "The port armament may not be used until repaired."),
        row(5, 5, 0, "Prow armament wounded", "The prow armament may not be used until repaired."),
        row(6, 6, 1, "Thorax armament wounded", "The thorax weapons may not be used until repaired."),
        row(7, 7, 0, "Heavy wound!", "Roll to repair in the End Phase; if it is not repaired it causes 1 extra damage and keeps bleeding."),
        row(8, 8, 1, "Discharge vents wounded", "The bio-ship may not turn until repaired."),
        row(9, 9, 0, "Synapse severed", "Instinctive orders may not be overridden by the Hive Mind until repaired."),
        row(10, 10, 0, "Spore cysts ruptured", "The bio-ship may no longer use its spore cysts. Cannot be repaired."),
        row(11, 11, "D3", "Severe wound", "A huge gash is torn in the hull."),
        row(12, 12, "D6", "Massive haemorrhage", "The armoured hide suffers immense damage. Make a Strength 1 bio-plasma attack against every other target within 2D6 cm; holofields do not protect against it."),
      ],
    },
    darkeldar: {
      id: "darkeldar", label: "Dark Eldar Critical Hits", page: "FL p.346", dice: 2, rows: [
        row(2, 2, 0, "Weapons Systems Damaged", "No weapon may fire until repaired."),
        row(3, 3, 0, "Prow Armament Damaged", "The prow armament (not the weapons batteries) may not fire until repaired."),
        row(4, 4, 0, "Manoeuvring Systems Damaged", "The ship must pass a Command check to come to new heading until repaired."),
        row(5, 5, 0, "Weapons Batteries Damaged", "The integral weapons batteries may not fire until repaired."),
        row(6, 6, 0, "Turning Fins Dented", "The ship may only make turns of up to 45° until repaired."),
        row(7, 7, 0, "Engines Damaged", "Speed reduced by 10 cm until repaired."),
        row(8, 8, 1, "Superstructure Damaged", "Roll a die whenever the ship goes on special orders; on a 1 it suffers 1 extra damage."),
        row(9, 9, 0, "Commanders Slain", "Leadership -1. May not be repaired."),
        row(10, 10, 0, "Shadowfield Generator Destroyed", "The shadowfields cease to work. May not be repaired."),
        row(11, 11, "D3", "Hull Breach", "A huge gash is torn in the hull."),
        row(12, 12, "D6", "Bulkhead Collapse", "Substantial portions of the ship buckle."),
      ],
    },
    necron: {
      id: "necron", label: "Necron Critical Hits", page: "FL p.403", dice: 2, rows: [
        row(2, 2, 0, "Power Flow Disrupted", "May not fire lightning arc or particle whip in its port arc until repaired."),
        row(3, 3, 0, "Power Flow Disrupted", "May not fire lightning arc or particle whip in its starboard arc until repaired."),
        row(4, 4, 0, "Power Flow Disrupted", "May not fire lightning arc in any arc until repaired."),
        row(5, 5, 0, "Power Flow Disrupted", "May not fire lightning arc or particle whip in any arc until repaired."),
        row(6, 6, 0, "Drive Damaged", "May not change facing until repaired. Leadership permanently -1."),
        row(7, 7, 0, "Drive Damaged", "Movement -5 cm until repaired. Leadership permanently -1."),
        row(8, 8, 0, "Inertialess Drive Damaged", "May not use All Ahead Full until repaired. Leadership permanently -1."),
        row(9, 9, 0, "Sepulchre Damaged", "The Sepulchre may not be used until repaired. Leadership permanently -2. If the ship has none, roll again."),
        row(10, 10, 0, "Command Core Damaged", "Leadership permanently -3."),
        row(11, 11, "D3", "Power Surge", "Leadership permanently -2."),
        row(12, 12, "D6", "Ruptured Power Core", "Leadership permanently -2."),
      ],
    },
    haven: {
      id: "haven", label: "Eldar Haven Critical Hits", page: "FL p.335", dice: 2, rows: [
        row(2, 2, 0, "Infinity circuit damaged", "Leadership -1 until repaired."),
        row(3, 3, 0, "Weapon Batteries Off-line", "Weapon batteries may not fire in any arc until repaired."),
        row(4, 4, 0, "Pulsar Lances Off-line", "Pulsar Lances may not fire in any arc until repaired."),
        row(5, 5, 0, "Launch Bays Damaged", "Ordnance may not be launched until repaired."),
        row(6, 6, 0, "Mainsail scarred", "All weapon systems at 50% effectiveness until repaired."),
        row(7, 7, 1, "Superstructure damaged", "Until repaired, roll a D6 at the start of each turn; on a 1 the station takes an extra hit."),
        row(8, 8, 0, "Polarization Field Off-Line", "The station drifts 5 cm towards the nearest celestial phenomena and loses its immunity to Blast Markers and solar phenomena."),
        row(9, 9, 1, "Infinity circuit smashed", "Leadership -3. May not be repaired."),
        row(10, 10, 0, "Holofield generators destroyed", "The station loses its holofields and its Netherfield. May not be repaired."),
        row(11, 11, "D3", "Hull Breach", "A huge gash is torn in the station’s hull."),
        row(12, 12, "D6", "Bulkhead Collapse", "Whole compartments crumple."),
      ],
    },
    ramilies: {
      id: "ramilies", label: "Ramilies Star Fort Critical Hits", page: "FL p.505", dice: 2, rows: [
        row(2, 3, 0, "Lances damaged", "The quadrant’s lance armament may not fire until repaired."),
        row(4, 4, 0, "Main armament damaged", "The quadrant’s weapons batteries fire at half strength until repaired."),
        row(5, 5, 0, "Ordnance Bays hit", "No ordnance may be fired by the quadrant until repaired."),
        row(6, 6, 1, "Reactors damaged", "The quadrant’s shields and turrets are at half strength until repaired."),
        row(7, 7, 0, "Fire!", "Roll to extinguish in the End Phase; if it is not put out it causes 1 extra damage and keeps burning."),
        row(8, 8, "D3", "Hull breach", "A huge gash is torn in the quadrant’s hull."),
        row(9, 9, 0, "Command Tower Struck", "Leadership -2. May not be repaired."),
        row(10, 10, 0, "Shields Collapse", "The quadrant’s shield strength is reduced to 0. May not be repaired."),
        row(11, 11, "D3", "Basilica penetrated!", "All quadrants suffer D3 damage and the Basilica weapons are lost."),
        row(12, 12, "D6", "Reactor Struck!", "All four quadrants suffer an extra D6 hits. Roll another critical result immediately and apply it to the quadrant struck."),
      ],
    },
    defence: {
      id: "defence", label: "Defences Critical Hits", page: "RB p.101", dice: 2, rows: [
        row(2, 3, 0, "Lances Damaged", "The lance array may not fire until repaired."),
        row(4, 4, 0, "Main Armament Damaged", "The weapons batteries may not fire until repaired."),
        row(5, 5, 0, "Ordnance Bays Hit", "No ordnance may be fired until the bays are repaired."),
        row(6, 6, 1, "Reactors Damaged", "Shields and turrets at half Strength until power is restored."),
        row(7, 7, 0, "Fire!", "Roll to extinguish in the End Phase; if it is not put out it causes 1 extra damage and keeps burning."),
        row(8, 9, 1, "Orbit Lost", "The defence falls D6 cm towards the planet each Movement Phase until repaired or destroyed."),
        row(10, 10, 0, "Shields Collapse", "Shield Strength reduced to zero. Cannot be repaired."),
        row(11, 11, "D3", "Hull Breach", "A huge gash is torn in the hull."),
        row(12, 12, "D6", "Bulkhead Collapse", "Pressure doors collapse throughout the station."),
      ],
    },
    chaoshulk: {
      id: "chaoshulk", label: "Chaos Space Hulk Critical Hits", page: "FL p.290", dice: 1,
      note: "Damage rolled that does not apply for any reason immediately assumes the next higher level damage on the table. Space hulks cannot repair any critical damage during the battle.",
      rows: [
        row(1, 2, 0, "Target high energy systems!", "Roll a D6 to determine the affected system.", {
          id: "hulk-system", label: "High energy systems", outcomes: [
            { lo: 1, hi: 2, text: "Lose 1 prow and 1 dorsal lance strength." },
            { lo: 3, hi: 4, text: "Lose 1 shield." },
            { lo: 5, hi: 6, text: "Lose 1 turret strength." },
          ],
        }),
        row(3, 4, 0, "Target weapons clusters!", "Roll a D6 for the arc from which the critical hit originated.", {
          id: "hulk-system", label: "Weapons cluster", outcomes: [
            { lo: 1, hi: 2, text: "Lose 1 launch bay (not prow or aft)." },
            { lo: 3, hi: 4, text: "Lose 1 torpedo strength (not aft)." },
            { lo: 5, hi: 6, text: "Lose 2 weapons battery firepower." },
          ],
        }),
        row(5, 6, 0, "Target thruster assemblies!", "To turn, the hulk must roll a D6 higher than the number of thruster criticals it has taken."),
      ],
    },
    orkhulk: {
      id: "orkhulk", label: "Ork Hulk Critical Hits", page: "FL p.393", dice: 1,
      note: "Damage rolled that does not apply for any reason immediately assumes the next higher level damage on the table. Space hulks cannot repair any critical damage during the battle.",
      rows: [
        row(1, 2, 0, "Target high energy systems!", "Roll a D6 to determine the affected system.", {
          id: "hulk-system", label: "High energy systems", outcomes: [
            { lo: 1, hi: 2, text: "Lose 1 dorsal lance strength." },
            { lo: 3, hi: 4, text: "Lose 1 shield." },
            { lo: 5, hi: 6, text: "Lose 1 turret strength." },
          ],
        }),
        row(3, 4, 0, "Target weapons clusters!", "Roll a D6 for the arc from which the critical hit originated.", {
          id: "hulk-system", label: "Weapons cluster", outcomes: [
            { lo: 1, hi: 2, text: "Lose 1 launch bay (not prow or aft)." },
            { lo: 3, hi: 4, text: "Lose 1 torpedo strength (not aft)." },
            { lo: 5, hi: 6, text: "Lose 2 weapons battery firepower." },
          ],
        }),
        row(5, 6, 0, "Target thruster assemblies!", "The hulk must roll higher than the number of thruster criticals it has taken to turn."),
      ],
    },
  };
  // Kroot Warspheres and the Nicassar Caravan roll nothing: each critical hit
  // simply inflicts 1 extra damage (FL p.495, p.492).
  function critTableId(ship, side) {
    // An escort, or any one-hit defence, is destroyed by a critical hit and
    // rolls on no table at all (RB p.66, p.92).
    if (ship.hp <= 1) return "escort";
    if (has(ship, "critplus1")) return "plus1";
    if (has(ship, "orkhulk")) return "orkhulk";
    if (has(ship, "chaoshulk")) return "chaoshulk";
    if (has(ship, "ramilies")) return "ramilies";
    if (has(ship, "haven")) return "haven";
    if (side && side.race === "tyranid") return "tyranid";
    if (side && side.race === "eldar") return "eldar";
    if (side && side.race === "darkeldar") return "darkeldar";
    if (side && side.race === "necron") return "necron";
    if (ship.type === "Defence" || ship.type === "Ground") return "defence";
    return "standard";
  }
  function critLookup(n, tableId) {
    if (tableId === "escort") {
      return { roll: null, table: "escort", extra: 0, name: "Destroyed", dice: 0,
        text: "Escorts which suffer a critical hit for any reason are automatically destroyed. No table is rolled." };
    }
    if (tableId === "plus1") {
      return { roll: null, table: "plus1", extra: 1, name: "Critical hit", dice: 0,
        text: "This vessel does not roll on a critical hits table: each critical simply inflicts 1 extra damage." };
    }
    var t = CRIT_TABLES[tableId] || CRIT_TABLES.standard;
    var lo = t.dice === 1 ? 1 : 2, hi = t.dice === 1 ? 6 : 12;
    var k = Math.max(lo, Math.min(hi, n));
    for (var i = 0; i < t.rows.length; i++) {
      if (k >= t.rows[i].lo && k <= t.rows[i].hi) {
        var result = { roll: k, table: t.id, tableLabel: t.label, page: t.page, dice: t.dice,
          note: t.note || "", extra: t.rows[i].extra, name: t.rows[i].name, text: t.rows[i].text };
        if (t.rows[i].followup) result.followup = t.rows[i].followup;
        return result;
      }
    }
    return null;
  }

  // Ship-profile critical exceptions still apply when the critical originates
  // from boarding (RB p.66, FL ship profiles). Keep these adjustments in the
  // engine so the UI cannot accidentally display or apply the generic result.
  function criticalResult(ship, side, n) {
    var result = critLookup(n, critTableId(ship, side));
    if (!result) return result;
    if (result.table === "ramilies" && (result.roll === 11 || result.roll === 12)) {
      result = Object.assign({}, result, { allQuadrants: true });
      if (result.roll === 12) result.repeatCritical = true;
    }
    if (has(ship, "ignoreprow") && result.table === "standard" && result.roll === 5) {
      result = Object.assign({}, result, {
        extra: 0,
        name: "Prow critical ignored",
        text: "This hull ignores Prow Armament Damaged completely; do not move the result to the next higher critical (FL ship profile).",
      });
    }
    if (has(ship, "bridgeplus1") && result.table === "standard" && result.roll === 9) {
      result = Object.assign({}, result, {
        extra: 1,
        name: "Bridge Smashed converted to damage",
        text: "A Demiurg commerce vessel suffers 1 extra damage instead of the Leadership loss (FL p.488-490).",
      });
    }
    if (has(ship, "gellar") && result.table === "standard" && result.roll === 10) {
      result = Object.assign({}, result, {
        followup: {
          id: "gellar", label: "Gellar Field", target: 4,
          success: "The Gellar Field is also damaged and must be repaired before the Blackship leaves the table or disengages, or the ship counts as destroyed. It is repaired like any other repairable critical, but repairing it does NOT repair the Shields Collapsed critical.",
          failure: "The Gellar Field is not damaged.",
        },
      });
    }
    return result;
  }

  function followupLookup(followup, n) {
    if (!followup) return null;
    var k = Math.max(1, Math.min(6, n));
    if (followup.outcomes) {
      for (var i = 0; i < followup.outcomes.length; i++) {
        var o = followup.outcomes[i];
        if (k >= o.lo && k <= o.hi) return { roll: k, label: followup.label, text: o.text };
      }
    }
    if (followup.target) {
      var success = k >= followup.target;
      return { roll: k, label: followup.label, success: success,
        text: success ? followup.success : followup.failure };
    }
    return null;
  }

  // RB p.71. Reachable from a boarding action only when the EXTRA damage from a
  // critical hit is what took the ship to zero (RB p.90).
  var CATA = [
    { lo: 2, hi: 6, name: "Drifting Hulk", bm: "1", text: "A shattered hulk. It moves 4D6 cm forward each Movement Phase; place a Blast Marker in contact after each move." },
    { lo: 7, hi: 8, name: "Blazing Hulk", bm: "1", text: "A burning wreck. It moves 4D6 cm forward each Movement Phase; place a Blast Marker and roll on this table again after the move." },
    { lo: 9, hi: 11, name: "Plasma Drive Overload", bm: "half its starting hits", text: "Remove the ship. Every ship within 3D6 cm is hit by lance shots with Strength equal to half its starting damage capacity." },
    { lo: 12, hi: 12, name: "Warp Drive Implosion", bm: "its starting hits", text: "Remove the ship. Every ship within 3D6 cm is hit by lance shots with Strength equal to its starting damage capacity." },
  ];
  var CATA_TABLES = {
    standard: { id: "standard", label: "Catastrophic Damage", page: "RB p.71", dice: 2, rows: CATA },
    // Tyranid bio-ships use their own tables entirely (FL p.425, p.424).
    tyranid: {
      id: "tyranid", label: "Tyranid Catastrophic Damage", page: "FL p.425", dice: 2, rows: [
        { lo: 2, hi: 7, name: "Drifting carcass", bm: "1", text: "The wreck moves 4D6 cm forward each Movement Phase; place a Blast Marker in contact after each move." },
        { lo: 8, hi: 9, name: "Death throes", bm: "1", text: "The wreck moves 4D6 cm forward each Movement Phase; place a Blast Marker and roll on this table again after the move." },
        { lo: 10, hi: 11, name: "Biological eruption", bm: "half its starting hits", text: "Remove the ship. Make a pyro-acid attack against every target within 3D6 cm with Firepower equal to its starting damage." },
        { lo: 12, hi: 12, name: "Bio-plasma detonation", bm: "its starting hits", text: "Remove the ship. Make a bio-plasma attack against every target within 3D6 cm with Strength equal to half its starting damage. Shields and holofields do not help." },
      ],
    },
    ramilies: {
      id: "ramilies", label: "Ramilies Catastrophic Damage", page: "FL p.505", dice: 1, rows: [
        { lo: 1, hi: 2, name: "Wrecked", bm: "0", text: "The main structure survives. Treat movement through the wreck as moving through an asteroid field." },
        { lo: 3, hi: 3, name: "Structural Collapse", bm: "0", text: "Place a 15 cm diameter asteroid field where the fort was." },
        { lo: 4, hi: 5, name: "Hyper-plasma Meltdown", bm: "2D6", text: "Eight lance shots at every ship within 4D6 cm; all ordnance within that distance is removed; everything else on the table suffers a solar flare centred on the fort." },
        { lo: 6, hi: 6, name: "Warpbubble Implosion", bm: "0", text: "Four lance shots at every ship and ordnance marker within 4D6 cm, then replace the fort with a Warp rift. Everything on the table is drawn 15 cm towards it." },
      ],
    },
    // A space hulk keeps the drifting and blazing results; the two explosive
    // ones are replaced (FL p.290, p.393).
    spacehulk: {
      id: "spacehulk", label: "Space Hulk Catastrophic Damage", page: "FL p.290", dice: 2, rows: [
        { lo: 2, hi: 6, name: "Drifting Hulk", bm: "1", text: "Unchanged: the wreck moves 4D6 cm forward each Movement Phase; place a Blast Marker after each move." },
        { lo: 7, hi: 8, name: "Blazing Hulk", bm: "1", text: "Unchanged: the wreck moves 4D6 cm forward each Movement Phase; place a Blast Marker and roll again after the move." },
        { lo: 9, hi: 11, name: "Torn apart", bm: "none", text: "Internal explosions tear the hulk apart. No damage is scored on nearby ships; it breaks up into an asteroid field D3 x 5 cm wide and long." },
        { lo: 12, hi: 12, name: "Hurled into the Warp", bm: "none", text: "Replace the hulk with a Warp rift. Any ships caught in the rift are affected immediately." },
      ],
    },
  };
  // Roks, Kroot Warspheres and Nicassar Caravans never roll: they simply break
  // up into four Blast Markers (FL p.395, p.495, p.492).
  function cataTableId(ship, side) {
    if (has(ship, "nocata4")) return "nocata4";
    if (has(ship, "ramilies")) return "ramilies";
    if (has(ship, "spacehulk")) return "spacehulk";
    if (side && side.race === "tyranid") return "tyranid";
    return "standard";
  }
  // Mercury battlecruisers, and Heavy Transports bought as Fuel Tankers, roll
  // 3D6 for catastrophic damage and cap a sum over 12 at 12 (FL p.64, p.192).
  function cataDice(ship, side) {
    if (has(ship, "cata3") || has(ship, "fuel_tanker")) return 3;
    var t = CATA_TABLES[cataTableId(ship, side)] || CATA_TABLES.standard;
    return t.dice || 2;
  }
  function cataLookup(n, tableId) {
    if (tableId === "nocata4") {
      return { roll: null, table: "nocata4", name: "Breaks up", bm: "4",
        text: "This vessel does not roll for catastrophic damage: it breaks up and is replaced by four Blast Markers." };
    }
    var t = CATA_TABLES[tableId] || CATA_TABLES.standard;
    var one = t.dice === 1;
    var k = Math.max(one ? 1 : 2, Math.min(one ? 6 : 12, n));
    for (var i = 0; i < t.rows.length; i++) {
      if (k >= t.rows[i].lo && k <= t.rows[i].hi) {
        return { roll: k, table: t.id, tableLabel: t.label, page: t.page, dice: t.dice || 2,
          name: t.rows[i].name, bm: t.rows[i].bm, text: t.rows[i].text };
      }
    }
    return null;
  }

  // --------------------------------------------------------- eligibility ----
  function eligibility(att, def, ctx) {
    var problems = [];
    var a = alive(att), d = alive(def);
    if (!a.length) problems.push({ level: "stop", text: "The boarding side has nothing left that can fight — tap its ship to pick another." });
    if (!d.length) problems.push({ level: "stop", text: "The defending side has nothing left that can fight — tap its ship to pick another." });
    // A creator clarification relayed on 2026-09-13 confirms that one ship may
    // board several enemies. Resolve it as an ordinary multi-ship boarding:
    // add each side's values, roll once per side, distribute damage over the
    // losing side and check every involved ship for a critical. This is tracked
    // as ruling 16 in RULINGS.md because the printed examples
    // only show several boarders against one target.
    a.forEach(function (s) {
      if (has(s, "noboard")) problems.push({ level: "stop", text: s.name + " cannot initiate boarding actions." });
      if (has(s, "blackship")) problems.push({ level: "stop", text: s.name + " will never attempt to board an enemy vessel." });
    });
    d.forEach(function (s, di) {
      if (has(s, "fortress") && !a.some(function (x) { return has(x, "spacehulk"); })) {
        problems.push({
          level: "stop",
          text: s.name + " is a star fort: the only vessel that may attempt to board it is a space hulk.",
        });
      }
      if (has(s, "nurgle")) {
        if (hasWards(att)) {
          problems.push({ level: "note", text: "The Mark of Nurgle is defeated by hexagrammic wards, so this ship can be boarded." });
        } else {
          problems.push({ level: "stop", text: s.name + " bears the Mark of Nurgle and may not be boarded. An Ordo Malleus Inquisitor Lord or hexagrammic wards are the exception." });
        }
      }
      // A drawn combat is already grappled. The holofield saved (or failed to
      // save) the original boarding attempt and is not rolled again merely
      // because that same combat continues next End Phase (RB p.90, FL p.303).
      if (has(s, "holofields") && (!ctx || (ctx.round || 1) === 1)) {
        var xenos = a.some(function (x) { return has(x, "inq_xenos"); });
        // The same save is "shadowfields" on a Dark Eldar ship (FL p.344).
        var field = def.race === "darkeldar" ? "shadowfields" : "holofields";
        problems.push({
          level: "roll", id: "holofield", field: field, target: xenos ? 3 : 2, ship: s.name, idx: s.idx,
          text: s.name + " has " + field + ": on a D6 roll of " + (xenos ? "3+" : "2+") +
            " the boarding attempt against it is ignored and a Blast Marker is placed in contact with it.",
        });
      }
    });
    // Tyranid special rule "All Is Lost" (FL p.420). Leadership is not part of
    // a hull profile, so the resolver surfaces the complete optional procedure
    // instead of silently omitting it or inventing a Leadership value.
    if (att.race === "tyranid" && d.some(function (s) {
      return ["Battleship", "Grand Cruiser", "Cruiser"].indexOf(s.type) >= 0;
    })) {
      problems.push({
        level: "rule", id: "allislost",
        text: "All Is Lost (optional): a capital ship boarded by Tyranids may first pass a Leadership test to self-destruct. If it passes, D6 1-3 is Plasma Drive Overload and 4-6 is Warp Drive Implosion (FL p.420).",
      });
    }
    return problems;
  }

  // ------------------------------------------------------------ resolve -----
  // Stage A: everything that is known before the dice hit the table.
  function prepare(state) {
    var att = state.att, def = state.def, ctx = { round: state.round || 1 };
    var av = boardingValue(att, "attacker", def);
    var dv = boardingValue(def, "defender", att);

    function build(side, enemy, role, ownV, enemyV) {
      var mods = modifiers(side, enemy, role, ctx);
      var r = ratioMod(ownV, enemyV);
      if (r) mods.unshift(r);
      var sum = mods.reduce(function (n, m) { return n + m.v; }, 0);
      var ships = alive(side);
      var noCrew = ships.length > 0 && ships.every(function (s) { return has(s, "nocrew"); });
      // How many dice this side throws, and which one of them counts. Tyranids
      // roll 2D6 and keep the highest (FL p.420); "dicelow" is the mirror image
      // - two dice of which the LOWEST counts - which the books use for
      // hit-and-run attacks against Tyranids (FL p.418, RB p.92) and which a
      // house rule may put on a boarding roll.
      var many = noCrew ? 0 : (side.race === "tyranid" || sideHas(side, "dicehigh")) ? 2
        : sideHas(side, "dicelow") ? 2 : 1;
      var pick = many < 2 ? null
        : (side.race === "tyranid" || sideHas(side, "dicehigh")) ? "high" : "low";
      // A campaign or house rule can override what this side throws. The rules
      // decide by default; this only replaces that decision when a player has
      // deliberately set it, and the app always says so on screen.
      if (side.diceOverride === "one") { many = noCrew ? 0 : 1; pick = null; }
      else if (side.diceOverride === "high") { many = noCrew ? 0 : 2; pick = "high"; }
      else if (side.diceOverride === "low") { many = noCrew ? 0 : 2; pick = "low"; }
      if (many < 2) pick = null;
      return {
        value: ownV, mods: mods, modSum: sum,
        dice: many, pick: pick,
        diceByHand: !!side.diceOverride,
        pickHighest: pick === "high",
        pickLowest: pick === "low",
        // Grey Knights and Battle Stance are the ship's own; the Adeptus
        // Mechanicus re-roll belongs to whoever is BOARDING one (FL p.118).
        reroll: sideHas(side, "greyknights") || sideHas(side, "battlestance") ||
          (role === "attacker" && (enemy.race === "admech" || sideHas(enemy, "admech"))),
      };
    }
    return {
      round: ctx.round,
      problems: eligibility(att, def, ctx),
      att: Object.assign(build(att, def, "attacker", av.value, dv.value), { detail: av }),
      def: Object.assign(build(def, att, "defender", dv.value, av.value), { detail: dv }),
    };
  }

  // Stage B: apply the dice that were rolled (or entered).
  function score(prepared, rolls) {
    function one(sidePrep, dice) {
      var used, kept = -1;
      if (sidePrep.dice === 0) used = 0;
      else if (sidePrep.pick === "high") used = Math.max.apply(null, dice);
      else if (sidePrep.pick === "low") used = Math.min.apply(null, dice);
      else used = dice[0];
      if (sidePrep.dice > 0) kept = dice.indexOf(used);
      return { dice: dice.slice(), used: used, kept: kept, total: used + sidePrep.modSum };
    }
    var a = one(prepared.att, rolls.att || []);
    var d = one(prepared.def, rolls.def || []);
    var diff = Math.abs(a.total - d.total);
    var res = resultFor(diff);
    var winner = a.total === d.total ? null : (a.total > d.total ? "att" : "def");
    return {
      att: a, def: d, diff: diff, winner: winner, result: res,
      damage: winner ? diff : 0,
      loser: winner === "att" ? "def" : (winner === "def" ? "att" : null),
      critNeeds: winner ? { win: res.win, lose: res.lose } : { win: 7, lose: 7 },
    };
  }

  // Mark of Khorne adds +1 to the roll to see if a critical hit is caused (REF step 3).
  // FL p.152 / p.155: a ship with hexagrammic wards "ignores any Chaos marks
  // affecting leadership or boarding actions", which is the Mark of Khorne's
  // +1 on the roll to cause a critical as much as its doubled boarding value.
  // The Berzerker Tide is a Forces of Chaos entry, not a Mark, and the ward
  // paragraph exempts those by name - so extraCritRolls() is NOT gated.
  function critBonus(side, enemy) {
    if (!sideHas(side, "khorne")) return 0;
    return (enemy && hasWards(enemy)) ? 0 : 1;
  }
  // A Berzerker fleet may make D3 additional critical rolls but may not use
  // special orders in the following turn (FL p.250, REF step 3).
  function extraCritRolls(side) {
    return sideHas(side, "berzerkerfleet") && sideHas(side, "khorne");
  }
  // Escorts and one-hit defences are destroyed by any critical (RB p.66).
  function escortKilledByCrit(ship) { return ship.hp <= 1; }

  var api = {
    makeRng: makeRng, d6: d6, halfUp: halfUp,
    isCrippled: isCrippled, effTurrets: effTurrets, has: has, alive: alive, sideHas: sideHas,
    hasWards: hasWards, shipValue: shipValue, boardingValue: boardingValue,
    ratioMod: ratioMod, modifiers: modifiers, isAlien: isAlien, sideIsAlien: sideIsAlien,
    RESULTS: RESULTS, resultFor: resultFor,
    CRIT_TABLES: CRIT_TABLES, critTableId: critTableId, critLookup: critLookup,
    criticalResult: criticalResult, followupLookup: followupLookup,
    CATA: CATA, CATA_TABLES: CATA_TABLES, cataTableId: cataTableId, cataDice: cataDice, cataLookup: cataLookup,
    eligibility: eligibility, prepare: prepare, score: score,
    critBonus: critBonus, extraCritRolls: extraCritRolls,
    escortKilledByCrit: escortKilledByCrit,
  };

  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.BOARDING = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
