/* Gothic Fleet Play - the rules layer against the book.

   Every expectation below is read from Battlefleet Gothic: Remastered
   Rulebook v1.10 at the page named, never from rules.js itself
   (AGENTS.md 5: a test derived from the implementation proves nothing).
   Ships come from the real catalogue through DOMAIN.resolveUnit, exactly as
   the play page resolves them, so the numbers under test are the numbers
   the card shows.

     node play/test_play.js        (-v prints every check)
     node play/test_play.js --rules   (this file's checks only; without it the
                                       run ends with play/smoke_play.js, which
                                       needs the built page) */
"use strict";
const fs = require("fs"), path = require("path");
const ROOT = path.join(__dirname, "..", "registry");
const DOMAIN = require(path.join(ROOT, "..", "..", "packages", "rules", "domain.js"));
const PLAY = require(path.join(__dirname, "rules.js"));
const catalog = JSON.parse(fs.readFileSync(path.join(ROOT, "..", "..", "data", "bfg_data.json"), "utf8"));
const verbose = process.argv.includes("-v");

let pass = 0, fail = 0;
function check(name, ok, detail){
  if(ok){ pass++; if(verbose) console.log("  ok   " + name); }
  else { fail++; console.log("  FAIL " + name + (detail ? "  -- " + detail : "")); }
}

/* A unit from the Imperial Navy - Gothic Sector list, resolved as the play
   page resolves it. */
const LIST = catalog.lists.find(x => x.nm === "Imperial Navy — Gothic Sector");
function unit(section, label, hulls){
  const at = DOMAIN.findEntry(LIST, section, label);
  if(!at) throw new Error("no row " + section + " / " + label);
  const en = LIST.secs[at.si].ents[at.ei];
  const intent = { schemaVersion: DOMAIN.SCHEMA_VERSION, role: "core",
    entry: { list: LIST.nm, section: LIST.secs[at.si].t, label: en.l },
    ref: en.r == null ? null : String(en.r), hull: null, hulls: hulls || 1,
    name: "", note: "", adjust: 0, custom: null, members: [], options: {}, upgrades: {} };
  return DOMAIN.resolveUnit(intent, { list: LIST }, catalog);
}
const lunar = unit("Cruisers", "Lunar class cruiser");
const dictator = unit("Cruisers", "Dictator class cruiser");
const swords = unit("ESCORTS", "Sword class frigate", 3);
const admiral = unit("Admiral", "Fleet-Admiral (Ld 8)");

console.log("rules.js vs Rulebook v1.10");

/* --- damage and crippled, p. 65 -------------------------------------- */
{
  /* p. 65: "a standard Lunar class cruiser has 8 hits and is therefore
     crippled when it has suffered 4 points of damage." */
  const st = PLAY.freshUnit(lunar), fl = PLAY.freshFleet();
  check("Lunar has 8 hits in the catalogue (p. 65 example)", lunar.stats.hits === 8, lunar.stats.hits);
  PLAY.addHits(lunar, st, 3);
  check("3 hits: not crippled (p. 65)", !PLAY.crippled(lunar, st));
  PLAY.addHits(lunar, st, 1);
  check("4 hits: crippled (p. 65)", PLAY.crippled(lunar, st));
  /* p. 65: "Being crippled halves shields, turrets, ordnance, all weapons
     ... Crippled ships also reduce their move by 5 cm" */
  check("crippled: shields 2 -> 1 (p. 65)", PLAY.shields(lunar, st).now === 1, JSON.stringify(PLAY.shields(lunar, st)));
  check("crippled: turrets 2 -> 1 (p. 65)", PLAY.turrets(lunar, st).now === 1, JSON.stringify(PLAY.turrets(lunar, st)));
  check("crippled: speed 20 -> 15 cm (p. 65)", PLAY.speed(lunar, st).now === 15, JSON.stringify(PLAY.speed(lunar, st)));
  const wb = PLAY.armament(lunar, st).find(a => /^port weapons batt/i.test(a.name));
  check("crippled: port battery 6 -> 3 (p. 65)", wb && wb.now === "3", wb && wb.now);
  const tp = PLAY.armament(lunar, st).find(a => a.torp);
  check("crippled: torpedoes 6 -> 3, ordnance halved too (p. 65, p. 73)", tp && tp.now === "3", tp && tp.now);
  /* p. 65: "if a ship is both braced and crippled, its weapons and ordnance
     are halved (rounding up) again!" */
  PLAY.setOrder(st, fl, "BFI", true);
  const wb2 = PLAY.armament(lunar, st).find(a => /^port weapons batt/i.test(a.name));
  check("crippled + braced: 6 -> 3 -> 2, rounding up (p. 65)", wb2 && wb2.now === "2", wb2 && wb2.now);
  /* p. 65 "ordnance" and p. 73: launch bays are halved too - "2 squadrons"
     is a number of squadrons (p. 79). */
  const dc = PLAY.freshUnit(dictator);
  const bay0 = PLAY.armament(dictator, dc).find(a => a.bays);
  PLAY.addHits(dictator, dc, 4);
  const bay1 = PLAY.armament(dictator, dc).find(a => a.bays);
  check("launch bays read as a number: 2 squadrons -> 2", bay0 && bay0.now === "2", bay0 && bay0.now);
  check("crippled: launch bays 2 -> 1 (p. 65, p. 73)", bay1 && bay1.now === "1", bay1 && bay1.now);
  PLAY.addHits(lunar, st, 10);
  check("hits are capped at the profile (p. 65: all hits lost = out of action)", st.hits === 8 && PLAY.destroyed(lunar, st), st.hits);
  check("a destroyed ship concedes its full points (p. 123)", PLAY.conceded(lunar, st) === lunar.points, PLAY.conceded(lunar, st));
}

/* --- special orders, p. 46-48 ----------------------------------------- */
{
  const st = PLAY.freshUnit(lunar), fl = PLAY.freshFleet();
  /* p. 46 All Ahead Full: Armament half effect, No Nova Cannon; Ordnance full. */
  PLAY.setOrder(st, fl, "AAF", true);
  const wb = PLAY.armament(lunar, st).find(a => /^port weapons batt/i.test(a.name));
  const tp = PLAY.armament(lunar, st).find(a => a.torp);
  check("All Ahead Full: batteries half (p. 46)", wb && wb.now === "3", wb && wb.now);
  check("All Ahead Full: ordnance full (p. 46)", tp && tp.now === "6", tp && tp.now);
  check("only one order at a time (p. 46)", !PLAY.canOrder(st, fl, "LO"));
  /* p. 47 Lock On: armament full. */
  const st2 = PLAY.freshUnit(lunar);
  PLAY.setOrder(st2, fl, "LO", true);
  const wbL = PLAY.armament(lunar, st2).find(a => /^port weapons batt/i.test(a.name));
  check("Lock On: batteries full (p. 47)", wbL && wbL.now === "6", wbL && wbL.now);
  /* p. 47 Brace: weapons AND ordnance half. Turrets and shields unaffected (p. 66). */
  const st3 = PLAY.freshUnit(lunar);
  PLAY.setOrder(st3, fl, "BFI", true);
  const tpB = PLAY.armament(lunar, st3).find(a => a.torp);
  check("Brace: ordnance half (p. 47)", tpB && tpB.now === "3", tpB && tpB.now);
  check("Brace: shields unaffected (p. 66)", PLAY.shields(lunar, st3).now === 2);
  check("Brace: turrets unaffected (p. 66)", PLAY.turrets(lunar, st3).now === 2);
  /* p. 48: "once you have failed a Command check for one ship in your fleet
     you may not make any further Command checks ... in the same turn" and
     "no more special orders can be declared except Brace For Impact!" */
  const a = PLAY.freshUnit(lunar), b = PLAY.freshUnit(dictator), f2 = PLAY.freshFleet();
  PLAY.setOrder(a, f2, "LO", true);
  PLAY.setOrder(b, f2, "RO", false);
  const c = PLAY.freshUnit(lunar);
  check("a failed check locks orders for the whole fleet this turn (p. 48)", f2.orderLock && !PLAY.canOrder(c, f2, "LO"));
  check("... but Brace is still allowed (p. 48)", PLAY.canOrder(c, f2, "BFI"));
  check("the failed ship has no order (p. 48)", b.order === null);
  /* p. 51: special order dice come off at the start of the player's turn. */
  PLAY.newTurn([a, b, c], f2);
  check("new turn: orders cleared (p. 51)", a.order === null && !f2.orderLock);
  check("new turn: the lock is gone (p. 48 'in the same turn')", PLAY.canOrder(c, f2, "LO"));
}

/* --- brace timing and lockout, p. 47, p. 66 --------------------------- */
{
  const st = PLAY.freshUnit(lunar), fl = PLAY.freshFleet();
  /* p. 47: "If a ship fails to take Brace For Impact! orders, it cannot
     attempt to take them again until the ... attacking has completed" */
  PLAY.setOrder(st, fl, "BFI", false);
  /* p. 47 lockout against this attacker; p. 48 a failed Command check ends
     the fleet's further orders this turn (Brace excepted) - RULINGS.md T2. */
  check("a failed brace locks brace against this attacker (p. 47)", st.braceLock && !PLAY.canOrder(st, fl, "BFI"));
  check("... and, as a failed Command check, the fleet's other orders this turn (p. 48)", fl.orderLock && !PLAY.canOrder(st, fl, "LO"));
  st.braceLock = false; fl.orderLock = false;
  /* p. 47: "placed on Brace For Impact! orders until the end of its next
     turn"; "Can't use any special orders at all in its next turn". */
  PLAY.setOrder(st, fl, "BFI", true);
  check("braced now", PLAY.braced(st));
  PLAY.newTurn([st], fl);
  check("still braced in its next turn (p. 47)", PLAY.braced(st) && st.order === "BFI", st.order);
  check("no other orders in that turn (p. 47)", !PLAY.canOrder(st, fl, "LO") && !PLAY.canOrder(st, fl, "BFI"));
  /* p. 47 "until the END of its next turn": it ends when that turn ends,
     not when the one after begins - the enemy's turn in between is unbraced. */
  PLAY.endTurn([st], fl);
  check("brace ends at the end of that turn (p. 47)", !PLAY.braced(st) && st.order === null, st.order);
  PLAY.newTurn([st], fl);
  check("... and orders are open again", PLAY.canOrder(st, fl, "LO"));
  /* A brace taken in the enemy's turn (after my END) holds through my next turn. */
  const st2 = PLAY.freshUnit(lunar), f2 = PLAY.freshFleet();
  PLAY.endTurn([st2], f2);
  PLAY.setOrder(st2, f2, "BFI", true);
  PLAY.newTurn([st2], f2);
  check("braced in the enemy's turn: still braced through my next turn (p. 47)", PLAY.braced(st2));
  PLAY.endTurn([st2], f2);
  check("... and over at its end (p. 47)", !PLAY.braced(st2));
}

/* --- ordnance flags, p. 73-74 ----------------------------------------- */
{
  const st = PLAY.freshUnit(dictator), fl = PLAY.freshFleet();
  check("ships start with torpedoes in tubes and craft ready (p. 74)", st.torps && st.craft);
  PLAY.launch(st, "craft");
  /* p. 73: "Launching only torpedoes does not affect launching attack
     craft later, and vice versa." */
  check("launching craft leaves torpedoes loaded (p. 73)", !st.craft && st.torps);
  PLAY.launch(st, "torps");
  check("both spent", !st.craft && !st.torps);
  PLAY.setOrder(st, fl, "RO", false);
  check("a failed Reload reloads nothing (p. 74)", !st.craft && !st.torps);
  const st2 = PLAY.freshUnit(dictator), f2 = PLAY.freshFleet();
  PLAY.launch(st2, "craft"); PLAY.launch(st2, "torps");
  PLAY.setOrder(st2, f2, "RO", true);
  check("a passed Reload Ordnance reloads both (p. 74)", st2.craft && st2.torps);
  PLAY.newTurn([st2], f2);
  check("reloaded ordnance stays loaded across turns not launched (p. 74)", st2.craft && st2.torps);
}

/* --- criticals, p. 67 ------------------------------------------------- */
{
  const st = PLAY.freshUnit(lunar), fl = PLAY.freshFleet();
  /* p. 67: cumulative - "must repair all incidences" */
  PLAY.addCrit(st, "7"); PLAY.addCrit(st, "7");
  check("two fires are two, not one (p. 67)", st.crits["7"] === 2);
  PLAY.repairCrit(st, "7");
  check("one repair leaves one fire burning (p. 67)", st.crits["7"] === 1);
  /* p. 67 Thrusters: "speed is only affected once by multiple Thrusters
     Damaged criticals" */
  PLAY.addCrit(st, "8"); PLAY.addCrit(st, "8");
  check("two Thrusters criticals: -10 cm once (p. 67)", PLAY.speed(lunar, st).now === 10, JSON.stringify(PLAY.speed(lunar, st)));
  PLAY.repairCrit(st, "8");
  check("one Thrusters still unrepaired: still -10 (p. 67)", PLAY.speed(lunar, st).now === 10);
  PLAY.repairCrit(st, "8");
  check("both repaired: normal speed (p. 67)", PLAY.speed(lunar, st).now === 20);
  /* p. 67 Engine Room: "may not make any turns until the damage is repaired" */
  PLAY.addCrit(st, "6");
  check("Engine Room Damaged: no turns (p. 67)", PLAY.turns(lunar, st).none);
  /* p. 67 Port Armament Damaged: "may not fire until it has been repaired" */
  PLAY.addCrit(st, "4");
  const port = PLAY.armament(lunar, st).filter(a => /^port /i.test(a.name));
  const stbd = PLAY.armament(lunar, st).filter(a => /^starboard /i.test(a.name));
  check("Port Armament Damaged silences every port row (p. 67)", port.length > 0 && port.every(a => a.silent), JSON.stringify(port.map(a => [a.name, a.silent])));
  check("... and no starboard row (p. 67)", stbd.length > 0 && stbd.every(a => !a.silent));
  /* p. 67 Bridge Smashed: Ld -3, "may not be repaired" */
  st.ld = 8;
  PLAY.addCrit(st, "9");
  check("Bridge Smashed: Ld 8 -> 5 (p. 67)", PLAY.leadership(lunar, st, fl).now === 5, JSON.stringify(PLAY.leadership(lunar, st, fl)));
  PLAY.repairCrit(st, "9");
  check("Bridge Smashed cannot be repaired (p. 67)", st.crits["9"] === 1 && PLAY.leadership(lunar, st, fl).now === 5);
  /* p. 67: "multiple criticals ... for a location that cannot be repaired
     ... apply the next highest critical hit instead" */
  const applied = PLAY.addCrit(st, "9");
  check("a second Bridge Smashed is applied as Shields Collapse (p. 67)", applied === "10" && st.crits["9"] === 1 && st.crits["10"] === 1, applied);
  check("... and Ld is -3 once, not -6 (p. 67)", PLAY.leadership(lunar, st, fl).now === 5);
  check("Shields Collapse: shields 0 (p. 67)", PLAY.shields(lunar, st).now === 0);
  PLAY.repairCrit(st, "10");
  check("Shields Collapse cannot be repaired (p. 67)", st.crits["10"] === 1);
  check("a third permanent result rolls on to 11 (p. 67)", PLAY.addCrit(st, "10") === "11" && st.crits["11"] === 1);
  /* one fire is still burning from the start of this block */
  check("active criticals listed by roll with counts", PLAY.activeCrits(st).map(c => c.key + "x" + c.count).join(",") === "4x1,6x1,7x1,9x1,10x1,11x1", PLAY.activeCrits(st).map(c => c.key + "x" + c.count).join(","));
}

/* --- Leadership modifiers, p. 45, p. 48, p. 115 ----------------------- */
{
  const st = PLAY.freshUnit(lunar), fl = PLAY.freshFleet();
  check("Ld table p. 45: 1 -> 6, 3 -> 7, 4 -> 8, 6 -> 9", PLAY.LD_TABLE[1] === 6 && PLAY.LD_TABLE[3] === 7 && PLAY.LD_TABLE[4] === 8 && PLAY.LD_TABLE[6] === 9);
  st.ld = 7;
  st.blast = 1;
  check("Under Fire: -1 with a Blast Marker in contact (p. 48)", PLAY.leadership(lunar, st, fl).now === 6);
  fl.enemyOrders = true;
  check("Enemy Contacts: +1 when enemy ships are on orders (p. 48)", PLAY.leadership(lunar, st, fl).now === 7);
  st.blast = 0; st.ld = 10;
  check("never above Ld 10 (p. 48)", PLAY.leadership(lunar, st, fl).now === 10);
  fl.enemyOrders = false; fl.radiation = 3; st.ld = 8;
  check("radiation burst: -interference level (p. 115)", PLAY.leadership(lunar, st, fl).now === 5);
}

/* --- shields and blast markers, p. 69-70 ------------------------------ */
{
  const st = PLAY.freshUnit(lunar);
  /* p. 70: a Blast Marker is placed for each hit the shields block, and once
     the markers equal the shields "no further damage may be absorbed". */
  st.blast = 2;
  check("two markers = both shields used: none up (p. 70)", PLAY.shields(lunar, st).up === 0);
  PLAY.clearBlast(st);
  check("moving clear of Blast Markers raises them again (p. 70)", PLAY.shields(lunar, st).up === 2 && st.blast === 0);
  st.blast = 1;
  check("a Blast Marker in contact takes one shield off when fired upon (p. 69)", PLAY.shields(lunar, st).up === 1);
  PLAY.addHits(lunar, st, 4);
  check("crippled and one marker: 2 -> 1 -> 0 (p. 65, p. 69)", PLAY.shields(lunar, st).up === 0);
  /* p. 88: damage control D6 per point remaining, half rounding up with markers */
  check("damage control: 4 remaining, marker in contact -> 2 dice (p. 88)", PLAY.repairDice(lunar, st) === 2);
  st.blast = 0; st.hits = 5;
  check("damage control: 3 remaining, no markers -> 3 dice (p. 88)", PLAY.repairDice(lunar, st) === 3);
  st.hits = 5; st.blast = 1;
  check("... 3 remaining halved rounds up to 2 (p. 88)", PLAY.repairDice(lunar, st) === 2);
}

/* --- hulks, p. 71 ----------------------------------------------------- */
{
  const st = PLAY.freshUnit(lunar);
  st.hits = 8; st.hulk = "drifting";
  check("a hulk has no shields and no turrets (p. 71)", PLAY.shields(lunar, st).now === 0 && PLAY.turrets(lunar, st).now === 0);
  check("hulk names (p. 71)", PLAY.HULKS.drifting === "Drifting hulk" && PLAY.HULKS.blazing === "Blazing hulk");
}

/* --- boarding value, p. 89 -------------------------------------------- */
{
  const st = PLAY.freshUnit(lunar);
  st.hits = 3;
  const bv = PLAY.boardingValue(lunar, st);
  check("boarding value = damage points remaining (p. 89)", bv.attack === 5, bv.attack);
  check("the defender adds its turrets (p. 89)", bv.defend === 7, bv.defend);
}

/* --- victory points conceded, p. 123 ---------------------------------- */
{
  const st = PLAY.freshUnit(lunar);
  check("Lunar costs 180 in the Gothic Sector list", lunar.points === 180, lunar.points);
  check("untouched: nothing conceded", PLAY.conceded(lunar, st) === 0);
  st.hits = 4;
  check("crippled capital ship: 25 % rounded up = 45 (p. 123)", PLAY.conceded(lunar, st) === 45, PLAY.conceded(lunar, st));
  st.disengaged = true;
  check("disengaged while crippled: 25 % (p. 123)", PLAY.conceded(lunar, st) === 45);
  st.hits = 1;
  check("disengaged not crippled: 10 % rounded up = 18 (p. 123)", PLAY.conceded(lunar, st) === 18, PLAY.conceded(lunar, st));
}

/* --- Demiurg victory points, Fleets p. 486 (J214) ---------------------
   "Demiurg vessels used with this fleet list ... Though their point cost
   remains unchanged, Strongholds are worth 400 points, Bastions are worth
   300 points and Citadels are worth 200 points when determining Victory
   Points." The same Stronghold bought by another list is worth its cost. */
{
  const WH = catalog.lists.find(x => x.nm === "Demiurg \u2014 War Host");
  const RT = catalog.lists.find(x => x.nm === "Rogue Traders");
  const demiurg = (L, label) => {
    const at = DOMAIN.findEntry(L, null, label);
    if(!at) throw new Error("no row " + label);
    const en = L.secs[at.si].ents[at.ei];
    return DOMAIN.resolveUnit({ schemaVersion: DOMAIN.SCHEMA_VERSION, role: "core",
      entry: { list: L.nm, section: L.secs[at.si].t, label: en.l },
      ref: en.r == null ? null : String(en.r), hull: null, hulls: 1,
      name: "", note: "", adjust: 0, custom: null, members: [], options: {}, upgrades: {} },
      { list: L, host: L }, catalog);
  };
  const sh = demiurg(WH, "Stronghold Commerce Vessel"), ci = demiurg(WH, "Citadel Commerce Vessel");
  const st = PLAY.freshUnit(sh);
  st.hits = sh.stats.hits;
  check("War Host Stronghold destroyed concedes 400, not its cost (Fleets p. 486)",
    PLAY.conceded(sh, st) === 400 && sh.points !== 400, PLAY.conceded(sh, st) + " / cost " + sh.points);
  const sc = PLAY.freshUnit(ci);
  sc.hits = Math.ceil(ci.stats.hits / 2);
  check("War Host Citadel crippled concedes 25 % of 200 = 50 (Fleets p. 486, p. 123)",
    PLAY.conceded(ci, sc) === 50, PLAY.conceded(ci, sc));
  const rt = demiurg(RT, "Stronghold Commerce Vessel"), rs = PLAY.freshUnit(rt);
  rs.hits = rt.stats.hits;
  check("a Stronghold in a Rogue Trader fleet concedes its cost (p. 486: with this fleet list)",
    PLAY.conceded(rt, rs) === rt.points, PLAY.conceded(rt, rs) + " / cost " + rt.points);
}

/* --- escorts, p. 66, p. 123 ------------------------------------------- */
{
  const st = PLAY.freshUnit(swords);
  check("an escort squadron gets one slot per ship, no hit track (p. 66)", st.members.length === 3 && st.hits === 0);
  check("the squadron is not crippled by hits (R.damage.crippled false)", !PLAY.crippled(swords, st));
  PLAY.killMember(st, 0);
  check("one destroyed: two alive, squadron not destroyed", PLAY.alive(st) === 2 && !PLAY.destroyed(swords, st));
  check("a part-destroyed escort squadron concedes nothing yet (p. 123)", PLAY.conceded(swords, st) === 0);
  PLAY.killMember(st, 1); PLAY.killMember(st, 2);
  check("all destroyed: the squadron is destroyed and concedes its points (p. 123)", PLAY.destroyed(swords, st) && PLAY.conceded(swords, st) === swords.points);
  PLAY.addHits(swords, st, 1);
  check("escorts take no hit count (p. 66: one hit destroys)", st.hits === 0);
}

/* --- squadrons, p. 95 and p. 99 --------------------------------------- */
{
  /* p. 95: "the highest surviving Leadership value in the squadron is used" */
  const a = PLAY.freshUnit(lunar), b = PLAY.freshUnit(lunar), fl = PLAY.freshFleet();
  a.ld = 7; b.ld = 9;
  check("squadron Ld = highest surviving (p. 95)", PLAY.squadronLd([{R: lunar, st: a}, {R: lunar, st: b}], fl).now === 9);
  b.hits = 8;
  check("... a destroyed ship's Ld no longer counts (p. 95)", PLAY.squadronLd([{R: lunar, st: a}, {R: lunar, st: b}], fl).now === 7);
  /* p. 99: "Squadrons firing weapons batteries normally add their firepower
     together"; "Capital ships have their firepower/strength halved
     individually (rounding up), even if in a squadron." */
  const c = PLAY.freshUnit(lunar), d = PLAY.freshUnit(lunar);
  d.hits = 4;   /* crippled: its 6 becomes 3 before the sum */
  const rows = PLAY.squadronFire([{R: lunar, st: c}, {R: lunar, st: d}]);
  const portWB = rows.find(r => r.kind === "battery" && /left/i.test(r.arc));
  const portL = rows.find(r => r.kind === "lance" && /left/i.test(r.arc));
  check("two Lunars, one crippled: port batteries 6 + 3 = 9 (p. 99)", portWB && portWB.total === 9, JSON.stringify(portWB));
  check("... port lances 2 + 1 = 3 (p. 99)", portL && portL.total === 3, JSON.stringify(portL));
  check("torpedoes are summed only as a base-contact salvo, and say so (p. 99)", rows.some(r => r.kind === "torpedoes" && r.contact === true));
  PLAY.addCrit(d, "4");
  const rows2 = PLAY.squadronFire([{R: lunar, st: c}, {R: lunar, st: d}]);
  check("a Port Armament critical drops that ship's port rows from the sum (p. 67, p. 99)",
        rows2.find(r => r.kind === "battery" && /left/i.test(r.arc)).total === 6);
  /* p. 99: escorts "have their total firepower added up and halved (rounding
     up) when on special orders that affect weapons strength/firepower" and
     are not halved "solely because the squadron is crippled". */
  const sw = PLAY.freshUnit(swords), f2 = PLAY.freshFleet();
  const e0 = PLAY.escortFire(swords, sw)[0];
  check("three Swords: battery 4 x 3 = 12 (p. 99)", e0.total === 12 && e0.now === 12, JSON.stringify(e0));
  PLAY.setOrder(sw, f2, "AAF", true);
  const e1 = PLAY.escortFire(swords, sw)[0];
  check("... on All Ahead Full the TOTAL is halved: 12 -> 6 (p. 99)", e1.now === 6, e1.now);
  sw.order = null;
  PLAY.killMember(sw, 0); PLAY.killMember(sw, 1);
  const e2 = PLAY.escortFire(swords, sw)[0];
  check("one Sword left: 4, and not halved for being 'crippled' (p. 99)", e2.total === 4 && e2.now === 4, JSON.stringify(e2));
}

/* --- the played mark and the turn buttons ----------------------------- */
{
  const st = PLAY.freshUnit(lunar), fl = PLAY.freshFleet();
  check("unplayed at start", st.played === 0);
  PLAY.cyclePlayed(st); check("first tap: moved", st.played === 1);
  PLAY.cyclePlayed(st); check("second tap: shot", st.played === 2);
  PLAY.cyclePlayed(st); check("third tap: round to unplayed", st.played === 0);
  PLAY.cyclePlayed(st); PLAY.cyclePlayed(st);
  PLAY.endTurn([st], fl);
  check("end of my turn: marks stay until my next turn begins", st.played === 2 && fl.mine === false);
  PLAY.newTurn([st], fl);
  check("start of my turn: marks reset (user), orders off (p. 51)", st.played === 0 && fl.mine === true && fl.turn === 2);
}

/* --- other critical tables carry no standard effects ------------------ */
{
  /* An Eldar ship rolls on its own table (Fleets book, via criticalModel):
     a "6" there is not Engine Room Damaged, so it must not take the turns
     away, and a "10" is not Shields Collapse. */
  let eld = null;
  catalog.lists.filter(x => /^Eldar Corsairs/.test(x.nm)).some(Lx =>
    Lx.secs.some((sec, si) => sec.ents.some((en, ei) => {
      if(en.k !== "unit" || en.r == null) return false;
      const intent = { schemaVersion: DOMAIN.SCHEMA_VERSION, role: "core",
        entry: { list: Lx.nm, section: sec.t, label: en.l }, ref: String(en.r), hull: null, hulls: 1,
        name: "", note: "", adjust: 0, custom: null, members: [], options: {}, upgrades: {} };
      const R = DOMAIN.resolveUnit(intent, { list: Lx }, catalog);
      if(R && R.kind === "ship" && R.damage && R.damage.critical && /^ELDAR/.test(R.damage.critical.title) && R.stats.hits >= 4){ eld = R; return true; }
      return false;
    })));
  check("an Eldar cruiser with its own critical table was found", !!eld, eld && eld.className);
  if(eld){
    const st = PLAY.freshUnit(eld);
    check("the standard effects are gated off for it", !PLAY.standardCrits(eld) && PLAY.standardCrits(lunar));
    PLAY.addCrit(st, "6", eld);
    check("Eldar '6' does not take the turns away (not p. 67's table)", !PLAY.turns(eld, st).none);
    PLAY.addCrit(st, "8", eld);
    check("Eldar '8' does not cost -10 cm", PLAY.speed(eld, st).mods.length === 0);
    PLAY.addCrit(st, "9", eld);
    check("Eldar '9' does not cost Ld", st.ldPerm === 0);
    check("... but every result is still counted", PLAY.activeCrits(st).length === 3);
    PLAY.repairCrit(st, "9", eld);
    check("... and is repairable, having no 'may not be repaired' text of the standard table", !st.crits["9"]);
  }
}


/* --- review 25.9.: findings shown red before the fix ------------------- */
function unitIn(listRe, labelRe, hulls){
  let out = null;
  catalog.lists.filter(x => listRe.test(x.nm)).some(Lx => Lx.secs.some(sec => sec.ents.some(en => {
    if(en.k !== "unit" || en.r == null || !labelRe.test(en.l)) return false;
    const intent = { schemaVersion: DOMAIN.SCHEMA_VERSION, role: "core",
      entry: { list: Lx.nm, section: sec.t, label: en.l }, ref: String(en.r), hull: null, hulls: hulls || 1,
      name: "", note: "", adjust: 0, custom: null, members: [], options: {}, upgrades: {} };
    out = DOMAIN.resolveUnit(intent, { list: Lx }, catalog);
    return !!out;
  })));
  return out;
}
{
  /* p. 57: a disengaged escort squadron is worth 10 %, or 25 % "if at least
     half the escorts in the squadron were destroyed (rounding down)"; p. 123
     says the same with rounding up - RULINGS.md T7 takes p. 57. */
  const st = PLAY.freshUnit(swords);
  check("three Swords cost 105", swords.points === 105, swords.points);
  st.disengaged = true;
  check("disengaged, none lost: 10 % rounded up = 11 (p. 57, p. 123)", PLAY.conceded(swords, st) === 11, PLAY.conceded(swords, st));
  PLAY.killMember(st, 0);
  check("disengaged after 1 of 3 lost: crippled by p. 57's rounding down, 25 % = 27", PLAY.conceded(swords, st) === 27, PLAY.conceded(swords, st));
  PLAY.killMember(st, 1); PLAY.killMember(st, 2);
  check("all lost: full points whatever the flag (p. 123)", PLAY.conceded(swords, st) === 105);
}
{
  /* A mixed escort squadron of several cards (the builder's letter, user
     28.10.2026) concedes as one squadron, p. 123: "Each destroyed escort
     earns its value in victory points provided the entire escort squadron
     is destroyed". Two Swords and one more Sword card stand in for the mix. */
  const two = Object.assign({}, swords, { hulls: 2, points: 70 }), one = Object.assign({}, swords, { hulls: 1, points: 35 });
  const a = PLAY.freshUnit(two), b = PLAY.freshUnit(one);
  const sq = () => PLAY.squadronConceded([{ R: two, st: a }, { R: one, st: b }]);
  PLAY.killMember(a, 0); PLAY.killMember(a, 1);
  check("mixed squadron: one card destroyed, the other alive, concedes nothing (p. 123)",
        PLAY.destroyed(two, a) && sq() === 0, sq());
  PLAY.killMember(b, 0);
  check("mixed squadron: every card destroyed concedes all its cards' points (p. 123)", sq() === 105, sq());
  const c = PLAY.freshUnit(two), d = PLAY.freshUnit(one);
  c.disengaged = true; d.disengaged = true;
  const sq2 = () => PLAY.squadronConceded([{ R: two, st: c }, { R: one, st: d }]);
  check("mixed squadron disengaged, none lost: 10 % of the whole, 11", sq2() === 11, sq2());
  PLAY.killMember(c, 0);
  check("mixed squadron disengaged after 1 of 3 lost: 25 % of the whole, 27 (p. 57, T7)", sq2() === 27, sq2());
}
{
  /* p. 67: "If a critical hit is rolled which cannot be applied ... apply
     the next highest critical hit instead. For example a ship with no
     dorsal weapons gets a Dorsal Armament Damaged critical hit. In this
     case the ship would suffer damage to its starboard armament." */
  const st = PLAY.freshUnit(lunar);
  check("the Lunar has no dorsal weapon", !lunar.weapons.some(w => /^dorsal/i.test(w.a[0])));
  const k = PLAY.addCrit(st, "2", lunar);
  check("Dorsal Armament on a ship without dorsal weapons is applied as 3 (p. 67)", k === "3" && st.crits["3"] === 1 && !st.crits["2"], k);
  const rows = PLAY.armament(lunar, st);
  check("... and the starboard rows are silent, the port rows not (p. 67)",
        rows.filter(a => /^starboard/i.test(a.name)).every(a => a.silent) && rows.filter(a => /^port/i.test(a.name)).every(a => !a.silent));
  check("critTarget is pure", (() => { const s2 = PLAY.freshUnit(lunar); const t = PLAY.critTarget(s2, "2", lunar); return t === "3" && !s2.crits["3"]; })());
  /* a ship without prow weapons: 5 rolls on to 6 (+1 hit, no turns) */
  let noProw = null;
  catalog.lists.some(Lx => Lx.secs.some(sec => sec.ents.some(en => {
    if(en.k !== "unit" || en.r == null) return false;
    const R = unitIn(new RegExp("^" + Lx.nm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "$"), new RegExp("^" + en.l.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "$"));
    if(R && R.kind === "ship" && !PLAY.isEscort(R) && PLAY.standardCrits(R) && R.stats.hits >= 4 &&
       !R.weapons.some(w => w.state !== "offered" && /^prow/i.test(w.a[0])) && R.weapons.some(w => w.state !== "offered")){ noProw = R; return true; }
    return false;
  })));
  check("a standard-table capital ship without prow weapons exists", !!noProw, noProw && noProw.className);
  if(noProw){
    const s3 = PLAY.freshUnit(noProw);
    check("Prow Armament on it is applied as 6 (p. 67)", PLAY.addCrit(s3, "5", noProw) === "6" && PLAY.turns(noProw, s3).none, JSON.stringify(s3.crits));
  }
  /* a repeated permanent result escalates to 11 without adding its hits:
     the card must ask for the D3 (RULINGS.md T6) - critTarget tells it. */
  const s4 = PLAY.freshUnit(lunar); s4.crits = { "10": 1 };
  check("critTarget: a second 10 is 11, whose extra damage is a D3 (p. 67)", PLAY.critTarget(s4, "10", lunar) === "11" && PLAY.CRITS["11"].extra === "D3");
}
{
  /* Strengths that are dice are not numbers (Fleets p. 362 Ork gunz). */
  check("num: dice expressions are not numbers", PLAY.num("D6+2") === null && PLAY.num("D6") === null && PLAY.num("D3+1 (x0.5)") === null && PLAY.num("10/20/25 cm") === null);
  check("num: bare numbers and squadron counts are", PLAY.num("12") === 12 && PLAY.num("2 squadrons") === 2 && PLAY.num(" 4 ") === 4);
  const kk = unitIn(/^Orks/, /Kill ?Kroozer/i), on = unitIn(/^Orks/, /Onslaught/i, 3);
  check("Ork Kill Kroozer and Onslaught resolve", !!kk && !!on, [kk && kk.className, on && on.className].join(" / "));
  if(kk){
    const a = PLAY.freshUnit(kk), b = PLAY.freshUnit(kk);
    const rows = PLAY.squadronFire([{ R: kk, st: a }, { R: kk, st: b }]);
    const gunz = rows.find(r => /D6/.test((r.dice || []).join("")));
    check("two Kill Kroozers: D6+2 gunz are listed as dice, not summed to 124 (p. 99, Fleets p. 362)",
          !!gunz && gunz.total === 0 && gunz.dice.length === 2, JSON.stringify(rows.map(r => [r.kind, r.total, r.dice])));
  }
  if(on){
    const s = PLAY.freshUnit(on);
    const f = PLAY.escortFire(on, s).find(x => /D6/.test(x.strength));
    check("three Onslaughts: a D6 battery has no numeric total", !!f && f.total === null && f.each === null, JSON.stringify(f));
  }
}
{
  /* Necron reactive hulls (Fleets p. 404): the 4+ save "is treated in the
     same manner as a brace save" - not a shield - and Necron ships are
     "immune to Damage, Leadership and Movement modifiers from ... Blast
     Markers". */
  const cairn = unitIn(/^Necrons/, /Cairn/i);
  check("the Cairn class tombship resolves with a 4+ save", !!cairn && /save/i.test(cairn.stats.shields), cairn && cairn.stats.shields);
  if(cairn){
    const st = PLAY.freshUnit(cairn); st.ld = 7; st.blast = 2;
    const sh = PLAY.shields(cairn, st);
    check("a save is shown as text, never as shields 4 (Fleets p. 402 vs Rulebook p. 65, 69)", sh.now === null && /save/i.test(sh.text), JSON.stringify(sh));
    PLAY.addHits(cairn, st, cairn.damage.crippledAt);
    check("... crippled: still text", PLAY.shields(cairn, st).now === null);
    const l = PLAY.leadership(cairn, st, PLAY.freshFleet());
    check("Necron Ld ignores Under Fire from Blast Markers (Fleets p. 404)", l.now === 7 && !l.mods.some(m => /fire/.test(m.t)), JSON.stringify(l));
    check("reactiveHull recognises it, not the Lunar", PLAY.reactiveHull(cairn) && !PLAY.reactiveHull(lunar));
  }
}
{
  /* p. 95: "Normal Command check modifiers for enemy contacts and for
     being under fire apply to squadrons, even if only some of the ships in
     a squadron have Blast Markers in base contact." */
  const a = PLAY.freshUnit(lunar), b = PLAY.freshUnit(lunar), fl = PLAY.freshFleet();
  a.ld = 8; b.ld = 8; a.blast = 1;
  const l = PLAY.squadronLd([{ R: lunar, st: a }, { R: lunar, st: b }], fl);
  check("one marked ship puts the squadron under fire: 8 -> 7 (p. 95)", l.now === 7 && l.mods.some(m => /fire/.test(m.t)), JSON.stringify(l));
  a.ld = 9; b.ld = 8;
  check("... the -1 applies to the highest value, not to the marked ship: 9 -> 8", PLAY.squadronLd([{ R: lunar, st: a }, { R: lunar, st: b }], fl).now === 8);
}
{
  /* p. 67 Bridge Smashed: "If this is the Fleet Commander's flagship, any
     remaining Fleet Commander re-rolls are lost for the remainder of the
     battle." */
  const fl = PLAY.freshFleet(); fl.rerolls = 2;
  PLAY.flagshipBridgeSmashed(fl);
  check("flagship bridge smashed: re-rolls 2 -> 0 and lost for the battle (p. 67)", fl.rerolls === 0 && fl.rerollsLost === true);
}
{
  /* Fleets p. 241 Abaddon: "Re-rolls: 1 per turn." "Abaddon's fleet is
     allowed to re-roll a single Command check or Leadership test each
     turn." The pool comes back every turn - mine and the enemy's (a Brace
     for Impact check is rolled in the enemy's turn) - RULINGS.md T25. Every
     other commander's re-rolls are once per game (Fleets p. 11) and stay
     spent. */
  const set = PLAY.setRerolls || ((f, n) => { f.rerolls = n; return f; });
  const ab = set(PLAY.freshFleet(), 1, true);
  ab.rerolls = 0;                                   /* spent this turn */
  PLAY.endTurn([], ab);
  check("Abaddon (p. 241): the re-roll is back in the enemy's turn", ab.rerolls === 1, String(ab.rerolls));
  ab.rerolls = 0;
  PLAY.newTurn([], ab);
  check("... and again at the start of my next turn", ab.rerolls === 1, String(ab.rerolls));
  PLAY.flagshipBridgeSmashed(ab);
  PLAY.newTurn([], ab);
  check("... but not once the flagship's bridge is smashed (p. 67)", ab.rerolls === 0 && ab.rerollsLost === true, String(ab.rerolls));
  const adm = set(PLAY.freshFleet(), 3, false);
  adm.rerolls = 1;
  PLAY.endTurn([], adm); PLAY.newTurn([], adm);
  check("an Admiral's re-rolls are once per game: spent ones stay spent (Fleets p. 11)", adm.rerolls === 1, String(adm.rerolls));
}
{
  /* Re-roll boxes (user 5.10.2026): one box per re-roll, of the kind it
     came as - included in the price, bought, or an open option taken into
     use at the table. A tapped box is that re-roll used; the count left is
     what the boxes say. */
  const P = PLAY, has = n => typeof P[n] === "function";
  const kinds = b => b.map(x => x.kind + (x.used ? "*" : "")).join(",");
  const fl = P.setRerolls(P.freshFleet(), 3, false, ["included", "bought", "bought"]);
  const b0 = has("rerollBoxes") ? P.rerollBoxes(fl) : [];
  check("boxes: one per re-roll, by kind, none used", kinds(b0) === "included,bought,bought" && fl.rerolls === 3, kinds(b0));
  if(has("toggleReroll")) P.toggleReroll(fl, 1);
  check("boxes: a tapped box is used - that one, not another", has("rerollBoxes") && kinds(P.rerollBoxes(fl)) === "included,bought*,bought" && fl.rerolls === 2, has("rerollBoxes") ? kinds(P.rerollBoxes(fl)) : "-");
  if(has("toggleReroll")) P.toggleReroll(fl, 1);
  check("boxes: tapped again it is back", has("rerollBoxes") && kinds(P.rerollBoxes(fl)) === "included,bought,bought" && fl.rerolls === 3);
  if(has("adjustRerolls")){ P.adjustRerolls(fl, -1); P.adjustRerolls(fl, -1); }
  check("boxes: the counter's minus uses the first free ones", has("rerollBoxes") && kinds(P.rerollBoxes(fl)) === "included*,bought*,bought" && fl.rerolls === 1, has("rerollBoxes") ? kinds(P.rerollBoxes(fl)) : "-");
  if(has("adjustRerolls")) P.adjustRerolls(fl, 1);
  check("boxes: plus gives the last used one back", has("rerollBoxes") && kinds(P.rerollBoxes(fl)) === "included*,bought,bought" && fl.rerolls === 2);
  if(has("adjustRerolls")){ P.adjustRerolls(fl, 1); P.adjustRerolls(fl, 1); }
  check("boxes: plus with nothing used adds one, marked as added at the table", has("rerollBoxes") && kinds(P.rerollBoxes(fl)) === "included,bought,bought,added" && fl.rerolls === 4, has("rerollBoxes") ? kinds(P.rerollBoxes(fl)) : "-");
  if(has("addReroll")) P.addReroll(fl, "optional");
  check("boxes: an open option taken into use is a box of its own kind", has("rerollBoxes") && kinds(P.rerollBoxes(fl)) === "included,bought,bought,added,optional" && fl.rerolls === 5);
  P.flagshipBridgeSmashed(fl);
  if(has("toggleReroll")) P.toggleReroll(fl, 0);
  const lost = has("rerollBoxes") ? P.rerollBoxes(fl) : [];
  check("boxes: bridge smashed - every box is lost and cannot be tapped back (p. 67)", lost.length === 5 && lost.every(x => x.used && x.lost) && fl.rerolls === 0);
  /* Every box goes free <-> used and nothing else: the tap that corrects a
     slip is a second tap on the same spot. (Review 5.10.2026: with a third,
     "gone" state a stray tap on a crossed option plus the corrective tap
     handed the used re-roll back as free.) A mis-taken option is undone
     with UNDO, or simply crossed off. */
  const tb = P.setRerolls(P.freshFleet(), 1, false, ["included"]);
  P.addReroll(tb, "optional");
  P.toggleReroll(tb, 1);
  check("boxes: an option taken into use is used on the first tap", kinds(P.rerollBoxes(tb)) === "included,optional*" && tb.rerolls === 1, kinds(P.rerollBoxes(tb)));
  P.toggleReroll(tb, 1); P.toggleReroll(tb, 1);
  check("boxes: a stray tap and the corrective tap leave it used - not free, not gone", kinds(P.rerollBoxes(tb)) === "included,optional*" && tb.rerolls === 1, kinds(P.rerollBoxes(tb)));
  /* the counter's minus takes back its own plus before it touches the fleet's boxes */
  const pm = P.setRerolls(P.freshFleet(), 3, false, ["included", "bought", "bought"]);
  P.adjustRerolls(pm, 1); P.adjustRerolls(pm, -1);
  check("boxes: plus then minus leaves the fleet's boxes as they were", kinds(P.rerollBoxes(pm)) === "included,bought,bought" && pm.rerolls === 3, kinds(P.rerollBoxes(pm)));
  /* Fleets p. 241: Abaddon's ONE re-roll is per turn. A box added at the
     table (a sub-plot's extra re-roll, p. 127) is once per battle like any
     other and does not come back with it. */
  const ab2 = P.setRerolls(P.freshFleet(), 1, true, ["included"]);
  P.adjustRerolls(ab2, 1);
  P.toggleReroll(ab2, 0); P.toggleReroll(ab2, 1);
  P.endTurn([], ab2);
  check("boxes: only the per-turn box comes back, an added one stays used", kinds(P.rerollBoxes(ab2)) === "included,added*" && ab2.rerolls === 1, kinds(P.rerollBoxes(ab2)));
  /* ... and it comes back wherever the pool is kept - a commander who is not
     the fleet commander carries his own on his unit state */
  const own = P.setRerolls({}, 1, true, ["included"]);
  P.toggleReroll(own, 0);
  P.newTurn([own], P.freshFleet());
  check("boxes: a per-turn pool on a commander's own row comes back too", kinds(P.rerollBoxes(own)) === "included" && own.rerolls === 1, kinds(P.rerollBoxes(own)));
  const plain = P.setRerolls({}, 1, false, ["included"]);
  P.toggleReroll(plain, 0);
  P.newTurn([plain], P.freshFleet()); P.endTurn([plain], P.freshFleet());
  check("boxes: ... a once-per-game one does not", kinds(P.rerollBoxes(plain)) === "included*" && plain.rerolls === 0);
  /* Bridge Smashed taken off again (a mis-tapped 9, RULINGS.md T24): the
     boxes are as they were before it */
  const br = P.setRerolls(P.freshFleet(), 2, false, ["included", "bought"]);
  P.toggleReroll(br, 0);
  P.flagshipBridgeSmashed(br);
  if(typeof P.flagshipBridgeRestored === "function") P.flagshipBridgeRestored(br);
  check("boxes: a Bridge Smashed taken off again gives the unused boxes back", br.rerollsLost === false && kinds(P.rerollBoxes(br)) === "included*,bought" && br.rerolls === 1, kinds(P.rerollBoxes(br)) + " lost " + br.rerollsLost);
  /* Who leads the fleet (review 5.10.2026): the roster's order is the
     player's - units are added and dragged freely - so the fleet commander
     is the commander that stands first in the FLEET LIST, where every list
     prints its fleet commander before its captains, lords and farseers
     (Bastion: Admiral p. 36, Veteran Captains p. 38). */
  const fc = typeof P.fleetCommander === "function" ? P.fleetCommander : (() => -2);
  check("fleet commander: the Admiral, although the Veteran Captain stands first in the roster",
        fc([{ kind: "commander", s: 8, e: 0 }, { kind: "ship", s: 3, e: 0 }, { kind: "commander", s: 1, e: 1 }]) === 2);
  check("fleet commander: same section, the earlier row", fc([{ kind: "commander", s: 1, e: 2 }, { kind: "commander", s: 1, e: 0 }]) === 1);
  check("fleet commander: none in a fleet without commanders", fc([{ kind: "ship", s: 3, e: 0 }]) === -1);
  check("fleet commander: two of the same row - the first of them", fc([{ kind: "ship", s: 2, e: 0 }, { kind: "commander", s: 1, e: 0 }, { kind: "commander", s: 1, e: 0 }]) === 1);
  /* a game saved before the boxes existed: the count left is all it has */
  const old = P.freshFleet(); old.rerolls = 1;
  if(has("adoptRerolls")) P.adoptRerolls(old, ["included", "bought", "bought"]);
  check("boxes: an older record keeps its count - 1 left of 3 is two used", has("rerollBoxes") && kinds(P.rerollBoxes(old)) === "included,bought*,bought*" && old.rerolls === 1, has("rerollBoxes") ? kinds(P.rerollBoxes(old)) : "-");
  const more = P.freshFleet(); more.rerolls = 4;
  if(has("adoptRerolls")) P.adoptRerolls(more, ["included", "bought", "bought"]);
  check("boxes: ... and a count above the roster's keeps the extra one", has("rerollBoxes") && kinds(P.rerollBoxes(more)) === "included,bought,bought,added" && more.rerolls === 4);
  /* A record from a build that kept no count for this pool (a fleet without
     a commander had none before 5.10.2026; its rerolls field is the
     untouched 0): the boxes start free, not crossed off. */
  const nec = P.freshFleet(); nec.rerolls = 0;
  P.adoptRerolls(nec, ["included", "bought"], { fresh: true });
  check("boxes: an older record that never counted this pool starts with free boxes", kinds(P.rerollBoxes(nec)) === "included,bought" && nec.rerolls === 2, kinds(P.rerollBoxes(nec)));
  /* ... and one that predates the per-turn flag gets it from the roster */
  const abOld = P.freshFleet(); abOld.rerolls = 0;
  P.adoptRerolls(abOld, ["included"], { perTurn: true });
  P.newTurn([], abOld);
  check("boxes: an older Abaddon record gets its per-turn pool back (Fleets p. 241)", abOld.rerollsPerTurn === 1 && kinds(P.rerollBoxes(abOld)) === "included" && abOld.rerolls === 1, kinds(P.rerollBoxes(abOld)) + " perTurn " + abOld.rerollsPerTurn);
  /* Abaddon's box comes back every turn (Fleets p. 241) */
  const ab = P.setRerolls(P.freshFleet(), 1, true, ["included"]);
  if(has("toggleReroll")) P.toggleReroll(ab, 0);
  P.endTurn([], ab);
  check("boxes: a per-turn box is free again in the next turn (Fleets p. 241)", has("rerollBoxes") && kinds(P.rerollBoxes(ab)) === "included" && ab.rerolls === 1, has("rerollBoxes") ? kinds(P.rerollBoxes(ab)) : "-");
}
{
  /* p. 123: a destroyed or disengaged ship's value includes "any Admiral,
     Warmaster or Chaos Lord on board" (RULINGS.md T11). */
  const ret = unitIn(/Gothic Sector$/, /^Retribution/i);
  const st = PLAY.freshUnit(ret);
  check("Retribution costs 345 and the Fleet-Admiral 50", ret.points === 345 && admiral.points === 50, [ret.points, admiral.points].join("/"));
  PLAY.addHits(ret, st, 6);
  check("crippled flagship: 25 % of 395 = 99 (p. 123)", PLAY.conceded(ret, st, admiral.points) === 99, PLAY.conceded(ret, st, admiral.points));
  PLAY.addHits(ret, st, 6);
  check("destroyed flagship: 395 (p. 123)", PLAY.conceded(ret, st, admiral.points) === 395);
  const s2 = PLAY.freshUnit(ret); s2.hits = 1; s2.disengaged = true;
  check("disengaged uncrippled flagship: 10 % of 395 = 40 (p. 123)", PLAY.conceded(ret, s2, admiral.points) === 40, PLAY.conceded(ret, s2, admiral.points));
}


/* --- review 28.9.: shown red before the fix ---------------------------- */
{
  /* p. 65: "Crippled ships ... will not be able to fire their nova cannon." */
  const dom = unitIn(/Gothic Sector$/, /^Dominator/i);
  check("Dominator resolves with a nova cannon", !!dom && dom.weapons.some(w => /nova cannon/i.test(w.a[0])), dom && dom.className);
  if(dom){
    const st = PLAY.freshUnit(dom); PLAY.addHits(dom, st, dom.damage.crippledAt);
    const nova = PLAY.armament(dom, st).find(a => a.nova);
    check("crippled: the nova cannon row is silent (p. 65)", !!nova && !!nova.silent, nova && nova.silent);
  }
  /* Fleets p. 403: Portals "are still cut in half (rounding down) if a ship
     is crippled or Braced. A Necron capital ship both crippled and Braced
     may not make Portal attacks." Fleets p. 402: "A star pulse cannot be
     generated while the vessel is using any special order or crippled". */
  const cairn = unitIn(/^Necrons/, /Cairn/i);
  if(cairn){
    const st = PLAY.freshUnit(cairn), fl = PLAY.freshFleet();
    const p0 = PLAY.armament(cairn, st).find(a => /portal/i.test(a.name));
    check("Cairn Portal 3 when whole", p0 && p0.now === "3", p0 && p0.now);
    PLAY.addHits(cairn, st, cairn.damage.crippledAt);
    const p1 = PLAY.armament(cairn, st).find(a => /portal/i.test(a.name));
    check("crippled: Portal 3 -> 1, rounding down (Fleets p. 403)", p1 && p1.now === "1" && !p1.silent, p1 && p1.now);
    const sp = PLAY.armament(cairn, st).find(a => /star pulse/i.test(a.name));
    check("crippled: no star pulse (Fleets p. 402)", sp && !!sp.silent, sp && sp.silent);
    PLAY.setOrder(st, fl, "BFI", true);
    const p2 = PLAY.armament(cairn, st).find(a => /portal/i.test(a.name));
    check("crippled and braced: no Portal attacks (Fleets p. 403)", p2 && !!p2.silent, p2 && p2.silent);
    const st2 = PLAY.freshUnit(cairn), f2 = PLAY.freshFleet();
    PLAY.setOrder(st2, f2, "LO", true);
    const sp2 = PLAY.armament(cairn, st2).find(a => /star pulse/i.test(a.name));
    check("on Lock On: no star pulse either (Fleets p. 402)", sp2 && !!sp2.silent, sp2 && sp2.silent);
    const p3 = PLAY.armament(cairn, st2).find(a => /portal/i.test(a.name));
    check("on Lock On: Portal unaffected - not restricted by orders (Fleets p. 403)", p3 && p3.now === "3" && !p3.silent, p3 && p3.now);
  }
  /* squadronLd names the ship whose Leadership it took (p. 95) */
  const a = PLAY.freshUnit(lunar), b = PLAY.freshUnit(lunar), fl = PLAY.freshFleet();
  a.ld = 7; b.ld = 9;
  const l = PLAY.squadronLd([{ R: lunar, st: a }, { R: lunar, st: b }], fl);
  check("squadronLd says which member it came from", l.idx === 1, l.idx);
}

/* --- combined ordnance, p. 99 ------------------------------------------ */
{
  /* p. 99: "Ships in a squadron launch ordnance individually unless they
     are in base-to-base contact. Any ships in base-to-base contact ... can
     opt to combine their ordnance together into a bigger attack craft wave
     or torpedo salvo." "Note that some ships (such as Ork Ravagers) cannot
     for any reason combine salvoes in this manner." (Fleets p. 362 for the
     Ork torpedo launchas.) */
  const a = PLAY.freshUnit(lunar), b = PLAY.freshUnit(lunar);
  const rows = PLAY.squadronFire([{ R: lunar, st: a }, { R: lunar, st: b }]);
  const torp = rows.find(r => r.kind === "torpedoes");
  check("two Lunars: torpedoes 6 + 6 = 12 as a combined salvo from base contact (p. 99)", !!torp && torp.total === 12 && torp.contact === true, JSON.stringify(torp));
  const d1 = PLAY.freshUnit(dictator), d2 = PLAY.freshUnit(dictator);
  const bays = PLAY.squadronFire([{ R: dictator, st: d1 }, { R: dictator, st: d2 }]).find(r => r.kind === "launch bays");
  check("two Dictators: launch bays 4 + 4 = 8 as one wave from base contact (p. 99)", !!bays && bays.total === 8 && bays.contact === true, JSON.stringify(bays));
  const rav = unitIn(/^Orks/, /^Ravager/i, 2);
  check("Ork Ravagers resolve", !!rav, rav && rav.className);
  if(rav){
    const st = PLAY.freshUnit(rav);
    const t = PLAY.escortFire(rav, st).find(x => x.torp);
    check("Ork torpedo launchas: a squadron may not combine salvoes (Fleets p. 362, p. 99)", !!t && t.nocombine === true, JSON.stringify(t));
    const t2 = PLAY.escortFire(swords, PLAY.freshUnit(swords)).find(x => x.torp);
    check("... other escorts' torpedoes can (Sword has none, Cobra would)", t2 == null || t2.nocombine !== true);
  }
  /* two Terror ships with the torpedo launcha fitted (ship option) */
  let ts = null;
  catalog.lists.filter(x => /^Orks/.test(x.nm)).some(Lx => Lx.secs.some(sec => sec.ents.some(en => {
    if(en.k !== "unit" || en.r == null || !/^Terror ship/i.test(en.l)) return false;
    const sh = catalog.ships[String(en.r)];
    const opt = (sh.ol || []).find(o => /torpedo launcha/i.test(o.t));
    if(!opt) return false;
    const options = {}; options[opt.id] = { state: "take", qty: 1 };
    const intent = { schemaVersion: DOMAIN.SCHEMA_VERSION, role: "core",
      entry: { list: Lx.nm, section: sec.t, label: en.l }, ref: String(en.r), hull: null, hulls: 1,
      name: "", note: "", adjust: 0, custom: null, members: [], options: options, upgrades: {} };
    ts = DOMAIN.resolveUnit(intent, { list: Lx }, catalog);
    return !!ts;
  })));
  check("a Terror ship with the torpedo launcha resolves", !!ts && ts.weapons.some(w => w.state !== "offered" && /torpedo/i.test(w.a[0])), ts && ts.weapons.map(w => w.a[0] + ":" + w.state).join(", "));
  if(ts){
    const r1 = PLAY.freshUnit(ts), r2 = PLAY.freshUnit(ts);
    const rr = PLAY.squadronFire([{ R: ts, st: r1 }, { R: ts, st: r2 }]);
    check("Terror ships: launch bays combine as one wave (p. 99)", rr.some(r => r.kind === "launch bays" && r.contact));
    check("... torpedo launchas never combine, not even as dice (Fleets p. 362)", !rr.some(r => r.kind === "torpedoes"), JSON.stringify(rr.map(r => [r.kind, r.total, r.dice])));
  }
}

/* --- combined fire across ranges (p. 99) ------------------------------- */
{
  /* p. 99: squadrons "add their firepower together before working out how
     many dice they roll" - one row per weapon kind and arc, and the sum at
     each range band tells what fires at a target that far away. */
  const ret = unitIn(/Gothic Sector$/, /^Retribution/i);
  const a = PLAY.freshUnit(lunar), b = PLAY.freshUnit(ret);
  const rows = PLAY.squadronFire([{ R: lunar, st: a }, { R: ret, st: b }]);
  const left = rows.filter(r => r.kind === "battery" && /^left$/i.test(r.arc));
  check("Lunar + Retribution: ONE port-battery row although the ranges differ (p. 99)", left.length === 1, JSON.stringify(rows.map(r => [r.kind, r.arc, r.range, r.total])));
  const row = left[0];
  check("... total 6 + 12 = 18", row && row.total === 18, row && row.total);
  check("... bands: 18 within 30 cm, 12 out to 60 cm", row && JSON.stringify(row.bands) === JSON.stringify([{ range: 30, total: 18 }, { range: 60, total: 12 }]), row && JSON.stringify(row.bands));
  check("... the row's range is the longest", row && row.range === "60 cm", row && row.range);
}

/* --- catastrophic damage, p. 71 and the races' own tables ------------- */
{
  /* Rulebook p. 71: 2-6 drifting hulk (+1 BM), 7-8 blazing hulk, 9-11
     plasma drive overload (BM and lance Strength = half starting hits),
     12 warp drive implosion (BM and lance Strength = starting hits). */
  const c = PLAY.catastrophic(lunar);
  check("Lunar: the standard table, 2D6, p. 71", c.dice === "2D6" && c.page === 71 && c.rows.length === 4, JSON.stringify([c.dice, c.page, c.rows.length]));
  check("... 9-11 plasma: 4 markers, lance Str 4 (half of 8)", /4 Blast/.test(c.rows[2].text) && /Strength 4/.test(c.rows[2].text), c.rows[2].text);
  check("... 12 warp: 8 markers, lance Str 8", /8 Blast/.test(c.rows[3].text) && /Strength 8/.test(c.rows[3].text), c.rows[3].text);
  check("... the hulk rows say drifting and blazing", c.rows[0].kind === "drifting" && c.rows[1].kind === "blazing" && c.rows[2].kind === "gone");
  /* Fleets p. 425: the Tyranid table - 2-7 drifting carcass, 8-9 death
     throes (roll again after each move), 10-11 biological eruption (half
     starting hits in markers, pyro-acid FP = starting damage), 12 bio-plasma
     detonation (markers = starting hits, bio-plasma Str = half). */
  const hive = unitIn(/^Tyranids/, /^Hive ship/i);
  if(hive){
    const t = PLAY.catastrophic(hive);
    check("Hive ship: the Tyranid table, Fleets p. 425", t.page === 425 && t.rows.length === 4 && /2-7/.test(t.rows[0].roll) && /8-9/.test(t.rows[1].roll), JSON.stringify(t.rows.map(r => r.roll)));
    check("... 10-11: 5 markers, pyro-acid FP 10 (10 hits)", /5 Blast/.test(t.rows[2].text) && /firepower 10/i.test(t.rows[2].text), t.rows[2].text);
    check("... 12: 10 markers, bio-plasma Strength 5", /10 Blast/.test(t.rows[3].text) && /Strength 5/.test(t.rows[3].text), t.rows[3].text);
    check("... death throes is the blazing kind (roll again)", t.rows[1].kind === "blazing");
  }
  /* Fleets p. 395: a Rok "breaks up. Do not roll for Catastrophic Damage,
     instead the Rok is replaced by 4 Blast markers." */
  const rok = unitIn(/^Orks/, /^Rok$/i);
  if(rok){
    const r = PLAY.catastrophic(rok);
    check("Rok: no roll, four blast markers (Fleets p. 395)", r.dice === null && r.rows.length === 1 && r.rows[0].kind === "gone" && /four Blast|4 Blast/i.test(r.rows[0].text), JSON.stringify(r));
  }
  /* The other vessels that break up with no roll - each carries the book's
     own line in its damage block: Warsphere Fleets p. 495, Stryxis caravan
     p. 207 - and the Nicassar Caravan, Fleets p. 492: "At 0 Hp it and its
     Dhows are destroyed; replace it with four Blast Markers." Its page is
     its own, not a rock vessel's. */
  [[/Rogue Traders$/, /^Kroot Warsphere/i, 495], [/Rogue Traders$/, /^Stryxis Caravan/i, 197], [/^Tau/, /^Nicassar Caravan/i, 492]].forEach(function(w){
    const u = unitIn(w[0], w[1]);
    if(!u) return;
    const c = PLAY.catastrophic(u);
    check(u.className + ": no roll, four blast markers, Fleets p. " + w[2], c.dice === null && c.rows.length === 1 && c.rows[0].kind === "gone" && /four Blast|4 Blast/i.test(c.rows[0].text) && c.page === w[2], JSON.stringify([c.dice, c.page, c.rows[0] && c.rows[0].text]));
  });
  /* Fleets p. 64: the Mercury "rolls 3D6 for catastrophic damage and adds
     the result (any roll greater than 12 counts as 12)". */
  const merc = unitIn(/Bakka/, /^Mercury/i);
  if(merc){
    const m = PLAY.catastrophic(merc);
    check("Mercury: 3D6 on the standard table (Fleets p. 64)", m.dice === "3D6" && m.rows.length === 4, m.dice);
  }
  /* p. 67: fires are cumulative - three unrepaired fires cost three hits
     in the End Phase; the card's fire button adds one hit per fire. */
  const st = PLAY.freshUnit(lunar);
  PLAY.addCrit(st, "7", lunar); PLAY.addCrit(st, "7", lunar); PLAY.addCrit(st, "7", lunar);
  check("three fires stack to x3 (p. 67)", st.crits["7"] === 3 && PLAY.activeCrits(st)[0].count === 3);
  check("... and the fire damage is one hit per fire", PLAY.fireDamage(lunar, st) === 3, PLAY.fireDamage(lunar, st));
}

/* --- the squadron's sum follows the ships' state ----------------------- */
{
  /* p. 99 sums each ship's CURRENT value, so a destroyed ship (p. 66), a
     hulk (p. 71) or a ship that has disengaged (p. 57: removed from the
     table) adds nothing - and the squadron says who is still firing. */
  const status = PLAY.squadronStatus || (() => ({ firing: [], out: [], crippled: [] }));
  const a = PLAY.freshUnit(lunar), b = PLAY.freshUnit(lunar), c = PLAY.freshUnit(lunar);
  const u = () => [{ R: lunar, st: a }, { R: lunar, st: b }, { R: lunar, st: c }];
  const port = rows => rows.find(r => r.kind === "battery" && /left/i.test(r.arc));
  check("three Lunars: port batteries 6 + 6 + 6 = 18 (p. 99)", port(PLAY.squadronFire(u())).total === 18, port(PLAY.squadronFire(u())).total);
  let s = status(u());
  check("... all three firing, none out", s.firing.length === 3 && s.out.length === 0 && s.crippled.length === 0, JSON.stringify(s));
  b.hits = 8;
  check("one destroyed: 6 + 6 = 12 (p. 66, p. 99)", port(PLAY.squadronFire(u())).total === 12, port(PLAY.squadronFire(u())).total);
  s = status(u());
  check("... the squadron lists it as destroyed (p. 71), two firing", s.firing.length === 2 && s.out.length === 1 && s.out[0].idx === 1 && s.out[0].why === "destroyed" && s.out[0].page === 71, JSON.stringify(s));
  c.disengaged = true;
  check("one disengaged as well: 6 alone (p. 57)", port(PLAY.squadronFire(u())).total === 6, port(PLAY.squadronFire(u())).total);
  s = status(u());
  check("... listed as disengaged, one firing", s.out.some(o => o.idx === 2 && o.why === "disengaged") && s.firing.length === 1, JSON.stringify(s));
  a.ld = 7; b.ld = 9; c.ld = 8;
  const fl = PLAY.freshFleet();
  check("the squadron's Ld skips the disengaged ship too: 7, not 8 (p. 57, p. 95)", PLAY.squadronLd(u(), fl).now === 7 && PLAY.squadronLd(u(), fl).idx === 0, JSON.stringify(PLAY.squadronLd(u(), fl)));
  c.disengaged = false; b.hits = 0; b.hulk = "drifting";
  s = status(u());
  check("a hulk is out of action (p. 71)", s.out.some(o => o.idx === 1 && o.why === "hulk") && s.firing.length === 2, JSON.stringify(s));
  check("... and adds nothing to the sum: 6 + 6 = 12 (p. 71, p. 99)", port(PLAY.squadronFire(u())).total === 12, port(PLAY.squadronFire(u())).total);
  b.hulk = null; a.hits = 4;   /* crippled: its 6 is 3 */
  s = status(u());
  check("a crippled ship still fires, halved, and is named: 3 + 6 + 6 = 15", s.firing.length === 3 && s.crippled.length === 1 && s.crippled[0] === 0 && port(PLAY.squadronFire(u())).total === 15, JSON.stringify([s, port(PLAY.squadronFire(u())).total]));
  a.hits = 0;
  PLAY.addCrit(c, "4", lunar);   /* Port Armament Damaged, p. 67 */
  const r = port(PLAY.squadronFire(u()));
  check("a Port Armament critical: 6 + 6 = 12, and the silenced 6 is listed under the row with its reason (p. 67)",
        r.total === 12 && r.silent && r.silent.length === 1 && r.silent[0].ship === 2 && r.silent[0].now === 6 && /critical 4/.test(r.silent[0].why), JSON.stringify(r.silent));
}

/* --- Ork gunz are weapon batteries (Fleets p. 362) ----------------------- */
{
  /* Fleets p. 362: "Ork Gunz: weapon batteries" - a dice strength (D6) is
     rolled per ship and listed, "Heavy Gunz: weapon batteries ... every hit
     causes 2 Hits" - their numbers sum as a row of their own, since their
     hits are worth double and cannot share a gunnery roll with the rest. */
  const kk = unitIn(/^Orks/, /^Kill kroozer/i);
  if(kk){
    const a = PLAY.freshUnit(kk), b = PLAY.freshUnit(kk);
    const rows = PLAY.squadronFire([{ R: kk, st: a }, { R: kk, st: b }]);
    const gunz = rows.find(r => r.kind === "battery" && /^left$/i.test(r.arc));
    check("two Kill Kroozers: the port gunz are a battery row with the dice listed (Fleets p. 362)", gunz && gunz.total === 0 && JSON.stringify(gunz.dice) === '["D6","D6"]', JSON.stringify(rows.map(r => [r.kind, r.arc, r.total, r.dice])));
    const heavy = rows.find(r => r.kind === "heavy gunz" && /^left$/i.test(r.arc));
    check("... the port heavy gunz sum as their own row: 4 + 4 = 8 (Fleets p. 362)", heavy && heavy.total === 8, JSON.stringify(heavy));
    check("... no row is left under the bare name 'gunz'", !rows.some(r => r.kind === "gunz"), JSON.stringify(rows.map(r => r.kind)));
  }
}

/* --- the small guards ---------------------------------------------------- */
{
  /* p. 57: an escort squadron counts as crippled once half its ships are
     destroyed, rounding down - a one-ship squadron with nothing lost is
     not crippled, half of one rounding down being zero */
  const one = PLAY.freshUnit(swords); one.members = [one.members[0]];
  check("a one-ship escort squadron with no loss is not 'crippled' (p. 57)", PLAY.escortCrippled(one) === false, PLAY.escortCrippled(one));
  /* fires cost hits only on the standard table (p. 67); a table of its
     own (Eldar, T5) counts nothing here */
  const eld = unitIn(/^Eldar/, /./);
  if(eld && !PLAY.standardCrits(eld)){
    const es = PLAY.freshUnit(eld); PLAY.addCrit(es, "7", eld);
    check("fire damage is 0 on a non-standard critical table (T5)", PLAY.fireDamage(eld, es) === 0, PLAY.fireDamage(eld, es));
  }
}

/* --- what a hulk still does, and whose it is (p. 71) -------------------- */
{
  /* p. 71: no shields, holofields or turrets; enemies hit it on the
     destroyed ship's Armour and roll on the table once per ship, squadron
     or ordnance wave that inflicts hits; friendly vessels and ordnance may
     not fire on or board it, though stray friendly torpedoes hit normally;
     p. 123: whoever holds the field earns half its value, own hulks too. */
  const c = PLAY.catastrophic(lunar), hk = c.hulk || {};
  check("Lunar: the hulk's line names armour, shields 0, turrets 0 and the roll per attacker (p. 71)",
        hk.armour === String(lunar.stats.armour).trim() && /turrets 0/.test(hk.brief) && /armour/i.test(hk.brief) && /each time/.test(hk.brief), JSON.stringify(hk.brief));
  check("... the reminder list: drift, no shields, armour and one roll per attacker, targeting, friendly fire, VP",
        Array.isArray(hk.list) && hk.list.length === 6 && /4D6 cm/.test(hk.list[0]) && /bombers/.test(hk.list[1]) && /once each time/.test(hk.list[2]) && /closest target/.test(hk.list[3]), JSON.stringify(hk.list));
  check("... an Imperial hulk may NOT be fired on by its own side, stray torpedoes excepted (p. 71)", /may not fire on or board/.test(hk.list[4]) && /torpedoes/.test(hk.list[4]), hk.list[4]);
  check("... holding the field: half its points, own hulks included (p. 123)", /half its points/.test(hk.list[5]) && /own hulks/.test(hk.list[5]), hk.list[5]);
  check("... an exploding ship: holofields do not save, shields do; markers fan out from where it was (p. 71)", /holofields do not save/.test(c.explode) && /shields do/.test(c.explode) && /fan/.test(c.explode), c.explode);
  check("... the boarded-to-0 exception: a critical hit in the boarding rolls as normal (p. 90)", /p\. 90/.test(c.note) && /critical/.test(c.note), c.note);
  /* Fleets p. 404: Necron ships may fire on or board their own hulks */
  const cairn = unitIn(/^Necron/, /Cairn/i);
  if(cairn){
    const n = PLAY.catastrophic(cairn).hulk;
    check("Necrons MAY fire on or board their own hulk (Fleets p. 404)", /MAY fire on or board/.test(n.list[4]) && /404/.test(n.list[4]), n.list[4]);
    check("... and a Necron drifting hulk is worth 300 %, other destruction 200 % (Fleets p. 404)", /300 %/.test(n.list[5]) && /200 %/.test(n.list[5]), n.list[5]);
  }
  /* Fleets p. 118: Mechanicus ships may pass a Leadership check to fire
     on their own DRIFTING hulks - not the Navy or allied ships with them */
  const ark = unitIn(/Mechanicus/, /./);
  if(ark){
    const m = PLAY.catastrophic(ark).hulk;
    check("Mechanicus: a Leadership check to fire on their own DRIFTING hulk (Fleets p. 118)", /Leadership check/.test(m.list[4]) && /DRIFTING/.test(m.list[4]) && /118/.test(m.list[4]), m.list[4]);
  }
  /* Fleets p. 290 / p. 393: a space hulk's explosions are its own - torn
     apart into an asteroid field, or hurled back into the Warp */
  const csh = unitIn(/^Chaos/, /Space Hulk/i), osh = unitIn(/^Orks/, /^Ork hulk/i);
  if(csh){
    const s = PLAY.catastrophic(csh);
    check("Chaos Space Hulk: hulk results as the rulebook's, 9-11 torn apart into asteroids, 12 a Warp rift (Fleets p. 288)",
          s.page === 288 && s.rows[0].kind === "drifting" && s.rows[1].kind === "blazing" && /asteroid field/.test(s.rows[2].text) && /no damage/i.test(s.rows[2].text) && /Warp rift/.test(s.rows[3].text), JSON.stringify(s.rows.map(r => r.name)));
  }
  if(osh){
    const s = PLAY.catastrophic(osh);
    check("Ork hulk: the same on Fleets p. 393", s.page === 391 && /asteroid field/.test(s.rows[2].text) && /Warp rift/.test(s.rows[3].text), JSON.stringify([s.page, s.rows.map(r => r.name)]));
  }
}

/* --- forts and defences at 0 hits ---------------------------------------- */
{
  /* Fleets p. 110: the Fortress-Monastery "follows all rules for the
     Ramilies Class Star Fortress detailed on pg. 500". p. 501: a quadrant
     at 0 takes no more damage and is an asteroid field from then on;
     p. 502: the fort is destroyed only once all four quadrants are at 0,
     then it rolls on the Ramilies table - a D6, p. 504-505. */
  const fm = unitIn(/^Space Marines/, /Fortress-Monastery/i);
  if(fm){
    const s = PLAY.catastrophic(fm);
    check("Fortress-Monastery: the Ramilies D6 table, Fleets p. 505", s.dice === "D6" && s.page === 505 && s.rows.length === 4 && s.rows[0].name === "Wrecked" && /15 cm asteroid/.test(s.rows[1].text) && /Eight lance/.test(s.rows[2].text) && /Four lance/.test(s.rows[3].text), JSON.stringify([s.dice, s.page, s.rows.map(r => r.name)]));
    /* 8.10.2026: the card now carries all four quadrant tracks, so the note
       no longer says "this track is ONE quadrant" (Fleets p. 501: each
       quadrant is its own; p. 502: the fort is destroyed once all four are
       at 0). The three facts it must still state are the book's. */
    check("... each quadrant has its own track: an asteroid field at 0, the roll waits for all four (p. 501-502)", /quadrant/.test(s.note) && /asteroid field/.test(s.note) && /all four/.test(s.note) && !/ONE quadrant/.test(s.note) && /501/.test(s.note) && /502/.test(s.note), s.note);
    /* the fort cannot be boarded to 0 by a ship: "The only vessel that may
       attempt to board a Ramilies is a space hulk" (p. 502, p. 111) */
    check("... so the table does not offer the ships' boarded-to-0 shortcut (p. 502), which a Lunar's does (p. 90)", s.boarded === false && PLAY.catastrophic(lunar).boarded === true, JSON.stringify([s.boarded, PLAY.catastrophic(lunar).boarded]));
    check("... and it does not drift (p. 101)", /stays in place/.test(s.hulk.list[0]) && /101/.test(s.hulk.list[0]), s.hulk.list[0]);
  }
  /* Rulebook p. 101: a defence with multiple hits rolls on the table at 0
     "however, defences never drift, they always remain in place" - the
     Blackstone Fortress is the book's own example. */
  const bs = unitIn(/^Chaos/, /Blackstone/i);
  if(bs){
    const s = PLAY.catastrophic(bs);
    check("Blackstone Fortress: the rulebook table, but the hulk rows say it stays in place (p. 101)", s.dice === "2D6" && s.page === 71 && /stays in place/i.test(s.rows[0].text) && /101/.test(s.rows[0].text) && /stays in place/i.test(s.rows[1].text) && !/4D6/.test(s.rows[0].text), JSON.stringify([s.rows[0].text, s.rows[1].text]));
    check("... and so does the hulk line (p. 101)", /never drifts/.test(s.hulk.list[0]) && /101/.test(s.hulk.list[0]), s.hulk.list[0]);
  }
  /* a ship still drifts (p. 71) */
  const l = PLAY.catastrophic(lunar);
  check("Lunar: a ship's hulk drifts 4D6 cm (p. 71)", /4D6/.test(l.rows[0].text) && /4D6/.test(l.hulk.list[0]));
  /* Fleets p. 425 row 12: "Shields and holofields are not effective
     against the detonation" - the Tyranid table must not carry the
     rulebook's "shields do" footer */
  const hive = unitIn(/^Tyranids/, /^Hive ship/i);
  if(hive){
    const t = PLAY.catastrophic(hive);
    check("Hive ship: the explosion footer does not claim shields save (Fleets p. 425)", !!t.explode && !/shields do\b/.test(t.explode) && /425/.test(t.explode), t.explode);
  }
  /* the page the VP figure comes from */
  check("VP page: a ship cites p. 123, an escort p. 57 and 123", PLAY.concededPage(lunar) === "p. 123" && PLAY.concededPage(swords) === "p. 57, 123", JSON.stringify([PLAY.concededPage(lunar), PLAY.concededPage(swords)]));
  const cairn = unitIn(/^Necron/, /Cairn/i);
  if(cairn) check("... a Necron ship cites Fleets p. 404", PLAY.concededPage(cairn) === "Fleets p. 404", PLAY.concededPage(cairn));
}

/* --- Necron losses count more (Fleets p. 404) --------------------------- */
{
  /* "count up the Necron losses using the following modifiers": disengaged
     undamaged 10 %, disengaged damaged or any raider disengaged 25 %,
     crippled 50 %, destroyed 200 %, left as a drifting hulk 300 % */
  const cairn = unitIn(/^Necron/, /Cairn/i);
  if(cairn){
    const P = cairn.points | 0, st = PLAY.freshUnit(cairn);
    check("Cairn on the table, untouched: 0", PLAY.conceded(cairn, st) === 0);
    st.disengaged = true;
    check("... disengaged undamaged: 10 %", PLAY.conceded(cairn, st) === Math.ceil(P * 0.10), PLAY.conceded(cairn, st));
    st.hits = 1;
    check("... disengaged with any damage: 25 %", PLAY.conceded(cairn, st) === Math.ceil(P * 0.25), PLAY.conceded(cairn, st));
    st.disengaged = false; st.hits = cairn.damage.crippledAt;
    check("... crippled: 50 % (not the rulebook's 25 %)", PLAY.conceded(cairn, st) === Math.ceil(P * 0.5), PLAY.conceded(cairn, st));
    st.hits = cairn.stats.hits; st.hulk = "blazing";
    check("... destroyed, a blazing hulk: 200 %", PLAY.conceded(cairn, st) === P * 2, PLAY.conceded(cairn, st));
    st.hulk = "drifting";
    check("... left as a drifting hulk: 300 %", PLAY.conceded(cairn, st) === P * 3, PLAY.conceded(cairn, st));
    st.hulk = null; st.destroyed = true;
    check("... exploded: 200 %", PLAY.conceded(cairn, st) === P * 2, PLAY.conceded(cairn, st));
  }
  const l = PLAY.freshUnit(lunar); l.hits = lunar.stats.hits; l.hulk = "drifting";
  check("a Lunar left as a drifting hulk still concedes its own points once (p. 123)", PLAY.conceded(lunar, l) === (lunar.points | 0), PLAY.conceded(lunar, l));
  /* Necron raiders: a destroyed one is a normal loss, a disengaged one 25 % */
  const raid = unitIn(/^Necron/, /Jackal|Dirge/i, 3);
  if(raid){
    const rs = PLAY.freshUnit(raid), rp = raid.points | 0;
    check("Necron raiders on the table: 0", PLAY.conceded(raid, rs) === 0);
    rs.disengaged = true;
    check("... disengaged: 25 % (Fleets p. 404)", PLAY.conceded(raid, rs) === Math.ceil(rp * 0.25), PLAY.conceded(raid, rs));
    rs.disengaged = false; rs.members.forEach(m => { m.dead = true; });
    check("... all destroyed: the full points", PLAY.conceded(raid, rs) === rp, PLAY.conceded(raid, rs));
  }
}

/* --- a mis-tapped critical comes off with the minus (30.9.2026) --------- */
{
  /* The minus beside a result's plus is a correction, not damage control
     (p. 88): it takes one count off whatever the result is - also one that
     cannot be repaired in play (9, 10, p. 67) - and never below zero. */
  const st = PLAY.freshUnit(lunar);
  PLAY.addCrit(st, "7", lunar); PLAY.addCrit(st, "7", lunar);
  PLAY.removeCrit(st, "7");
  check("minus: two fires, one off -> one left", (st.crits["7"] | 0) === 1, JSON.stringify(st.crits));
  PLAY.addCrit(st, "10", lunar);
  PLAY.repairCrit(st, "10", lunar);
  check("damage control cannot repair shields collapse (p. 67)", (st.crits["10"] | 0) === 1);
  PLAY.removeCrit(st, "10");
  check("... but the minus takes a mis-tapped one off", !st.crits["10"], JSON.stringify(st.crits));
  PLAY.removeCrit(st, "5");
  check("... and never goes below zero", !("5" in st.crits) && (st.crits["7"] | 0) === 1, JSON.stringify(st.crits));
}

/* ====================================================================
   PLANETARY DEFENCES (8.10.2026) - Rulebook p. 100-101, 123; Fleets
   p. 496-517, the Ramilies p. 500-505, the Fortress-Monastery p. 110-111,
   the Haven p. 332-334. Each check was seen red before rules.js was
   changed, or - where the old code already did the right thing - by a
   mutation (RULINGS.md T27-T36).
   ==================================================================== */
/* Any row of a list, hull-less ones too (orbital mines, minefields). */
function rowIn(listRe, secRe, labelRe, hulls){
  let out = null;
  catalog.lists.filter(x => listRe.test(x.nm)).some(Lx => Lx.secs.some(sec => secRe.test(sec.t) && sec.ents.some(en => {
    if(en.k !== "unit" || !labelRe.test(en.l)) return false;
    const intent = { schemaVersion: DOMAIN.SCHEMA_VERSION, role: "core",
      entry: { list: Lx.nm, section: sec.t, label: en.l }, ref: en.r == null ? null : String(en.r), hull: null, hulls: hulls || 1,
      name: "", note: "", adjust: 0, custom: null, members: [], options: {}, upgrades: {} };
    out = DOMAIN.resolveUnit(intent, { list: Lx, host: Lx }, catalog);
    return !!out;
  })));
  return out;
}
const PD = /^PLANETARY DEFENCES$/, GS = /^Imperial Navy . Gothic Sector$/;
const fnP = n => (typeof PLAY[n] === "function" ? PLAY[n] : () => undefined);
const platforms = rowIn(GS, PD, /^Orbital weapons platform$/i, 6);
const lasers = rowIn(GS, PD, /^Orbital defence laser platform$/i, 1);
const airbases = rowIn(GS, PD, /^Air base$/i, 2);
const monitors = rowIn(GS, PD, /^Defence monitor$/i, 3);
const sysships = rowIn(GS, PD, /^System ship$/i, 4);
const fireships = rowIn(GS, PD, /^Fire ship$/i, 3);
const station = rowIn(GS, PD, /^Space station$/i);
const dock = rowIn(GS, PD, /^Orbital dock$/i);
const blackstone = rowIn(GS, PD, /^Blackstone fortress$/i);
const ramilies = rowIn(GS, PD, /^Ramilies class star fort$/i);
const mines = rowIn(GS, PD, /^Orbital mine$/i, 5);
const minefield = rowIn(GS, PD, /^Minefield$/i, 2);
const monastery = rowIn(/^Space Marines . Crusade$/, /^Fortress-Monastery$/, /^Fortress-Monastery$/i);
const haven = rowIn(/^Eldar Corsairs . Gothic Sector$/, PD, /^Haven space station$/i);
const tauCity = rowIn(/^Tau . Merchant Fleet$/, PD, /^Kor caste orbital city$/i);

/* --- the rows resolve as the book prints them -------------------------- */
{
  check("the planetary defence rows resolve", [platforms, lasers, airbases, monitors, sysships, fireships, station, dock, blackstone, ramilies, mines, minefield, monastery, haven, tauCity].every(Boolean),
        [platforms, lasers, airbases, monitors, sysships, fireships, station, dock, blackstone, ramilies, mines, minefield, monastery, haven, tauCity].map(x => !!x).join(","));
  /* Fleets p. 499 price list; profiles p. 506-517, p. 500, p. 110 */
  check("prices: 6 platforms 180, 3 monitors 180, station 150, Ramilies 875, Fortress-Monastery 1000, 5 mines 25, 2 minefields 80, 3 fire ships 30, 2 air bases 40 (Fleets p. 499, 500, 110)",
        platforms.points === 180 && monitors.points === 180 && station.points === 150 && ramilies.points === 875 && monastery.points === 1000 &&
        mines.points === 25 && minefield.points === 80 && fireships.points === 30 && airbases.points === 40,
        [platforms.points, monitors.points, station.points, ramilies.points, monastery.points, mines.points, minefield.points, fireships.points, airbases.points].join("/"));
  check("types: platform Defence/1 (p. 511), air base Ground/1 (p. 517), monitor Escort/1 (p. 514), station Defence/8 (p. 507), Ramilies Defence/12 per quadrant (p. 500)",
        /^defence$/i.test(platforms.stats.type) && platforms.stats.hits === 1 && /^ground$/i.test(airbases.stats.type) && airbases.stats.hits === 1 &&
        /^escort$/i.test(monitors.stats.type) && station.stats.hits === 8 && ramilies.stats.hits === 12 && ramilies.stats.quadrant === true,
        [platforms.stats.type, airbases.stats.type, monitors.stats.type, station.stats.hits, ramilies.stats.hits].join("/"));
}

/* --- one-hit defences are counted one by one --------------------------- */
{
  /* Rulebook p. 100: "Orbital defences or ships that count as defences may
     be placed in squadrons, with 1HP defences grouped in up to six units".
     A platform is Defence/1 (Fleets p. 509-511): one hit destroys ONE
     platform, not the six that were bought together. */
  const st = PLAY.freshUnit(platforms);
  check("six orbital weapons platforms: six boxes, no hit track (Rulebook p. 100, Fleets p. 511)", Array.isArray(st.members) && st.members.length === 6 && st.hits === 0, JSON.stringify(st.members));
  check("... they are a member unit, the Space Station (Defence/8, p. 507) is not", PLAY.isEscort(platforms) && !PLAY.isEscort(station) && !PLAY.isEscort(blackstone) && !PLAY.isEscort(ramilies));
  if(st.members) PLAY.killMember(st, 0);
  check("... one hit destroys one platform, not the unit", PLAY.alive(st) === 5 && !PLAY.destroyed(platforms, st), PLAY.alive(st) + " alive, destroyed " + PLAY.destroyed(platforms, st));
  PLAY.addHits(platforms, st, 1);
  check("... and takes no hit count", st.hits === 0 && !PLAY.destroyed(platforms, st), st.hits);
  const ab = PLAY.freshUnit(airbases);
  check("two air bases (Ground/1, Fleets p. 517): two boxes", Array.isArray(ab.members) && ab.members.length === 2, JSON.stringify(ab.members));
  const one = PLAY.freshUnit(lasers);
  check("a single defence laser platform is still a one-box unit (p. 509)", Array.isArray(one.members) && one.members.length === 1);
  /* test stubs without the domain's squadron field keep working on the type */
  check("an Escort-typed stub without R.squadron is still a member unit", PLAY.isEscort({ stats: { type: "Escort", hits: 1 } }) && !PLAY.isEscort({ stats: { type: "Cruiser", hits: 8 }, squadron: null }));
  check("defence vessels (monitor p. 514, system ship p. 515, fire ship p. 516) are Escort/1 squadrons as before", PLAY.isEscort(monitors) && PLAY.isEscort(sysships) && PLAY.isEscort(fireships) && PLAY.freshUnit(sysships).members.length === 4);
  /* Rulebook p. 101: "If a defence with multiple hits is reduced to 0
     damage, roll on the Catastrophic Damage table" - a one-hit defence does
     not roll. p. 71: "When an escort is destroyed, replace it with a Blast
     Marker placed as centrally as possible to where the escort was" - an
     escort does not roll either. */
  const cp = PLAY.catastrophic(platforms), cs = PLAY.catastrophic(swords);
  check("a destroyed one-hit defence makes no Catastrophic Damage roll (p. 101)", cp.dice === null && cp.page === 101 && cp.rows.length === 1 && /multiple hits/.test(cp.rows[0].text), JSON.stringify([cp.dice, cp.page, cp.rows[0] && cp.rows[0].text]));
  check("a destroyed escort makes none either: a Blast Marker replaces it (p. 71)", cs.dice === null && cs.page === 71 && /Blast Marker/.test(cs.rows[0].text) && !/2D6/.test(cs.rows[0].text), JSON.stringify([cs.dice, cs.page, cs.rows[0] && cs.rows[0].text]));
  check("... a capital ship still rolls 2D6 (p. 71)", PLAY.catastrophic(lunar).dice === "2D6");
}

/* --- victory points for defences, p. 123 ------------------------------- */
{
  /* p. 123: "Each destroyed planetary defence installation earns a player a
     number of victory points equal to the installation's points value. Each
     destroyed escort earns its value in victory points provided the entire
     escort squadron is destroyed." */
  const st = PLAY.freshUnit(platforms);
  check("six platforms untouched: nothing conceded", PLAY.conceded(platforms, st) === 0, PLAY.conceded(platforms, st));
  if(st.members) PLAY.killMember(st, 0);
  check("one platform of six destroyed: its own 30 points (p. 123)", PLAY.conceded(platforms, st) === 30, PLAY.conceded(platforms, st));
  if(st.members){ PLAY.killMember(st, 1); PLAY.killMember(st, 2); }
  check("three destroyed: 90 (p. 123)", PLAY.conceded(platforms, st) === 90, PLAY.conceded(platforms, st));
  if(st.members) st.members.forEach(m => { m.dead = true; });
  check("all six destroyed: 180 (p. 123)", PLAY.conceded(platforms, st) === 180, PLAY.conceded(platforms, st));
  check("... and the figure cites p. 123, not the escorts' disengage rule", PLAY.concededPage(platforms) === "p. 123", PLAY.concededPage(platforms));
  const ab = PLAY.freshUnit(airbases);
  if(ab.members) PLAY.killMember(ab, 1);
  check("one air base of two destroyed: 20 (p. 123, Fleets p. 517)", PLAY.conceded(airbases, ab) === 20, PLAY.conceded(airbases, ab));
  /* a Defence Monitor is of type Escort (Fleets p. 514): the escort
     sentence of p. 123 applies - RULINGS.md T28 */
  const mo = PLAY.freshUnit(monitors);
  PLAY.killMember(mo, 0);
  check("one Defence Monitor of three destroyed: nothing yet - an escort squadron (p. 123, Fleets p. 514)", PLAY.conceded(monitors, mo) === 0, PLAY.conceded(monitors, mo));
  PLAY.killMember(mo, 1); PLAY.killMember(mo, 2);
  check("... all three: 180 (p. 123)", PLAY.conceded(monitors, mo) === 180, PLAY.conceded(monitors, mo));
  /* p. 123 gives 25 % for a crippled CAPITAL SHIP; for an installation it
     names only "destroyed" - RULINGS.md T28 */
  const ss = PLAY.freshUnit(station);
  PLAY.addHits(station, ss, 4);
  check("a Space Station at 4 of 8 hits is crippled (Rulebook p. 101)", PLAY.crippled(station, ss));
  check("... and concedes nothing for that: the 25 % is a capital ship's (p. 123)", PLAY.conceded(station, ss) === 0, PLAY.conceded(station, ss));
  PLAY.addHits(station, ss, 4);
  check("... destroyed: its 150 points (p. 123)", PLAY.destroyed(station, ss) && PLAY.conceded(station, ss) === 150, PLAY.conceded(station, ss));
  /* Fleets p. 512: "Individual mines purchased separately count for
     victory points when destroyed, regardless of how they are removed from
     play." p. 513: "Individual mines deployed from a minefield do not
     normally count for victory points when destroyed." */
  const ms = PLAY.freshUnit(mines);
  check("five orbital mines: one tick each (Fleets p. 512)", Array.isArray(ms.members) && ms.members.length === 5, JSON.stringify(ms.members));
  check("... nothing conceded while all are in play", PLAY.conceded(mines, ms) === 0, PLAY.conceded(mines, ms));
  if(ms.members){ PLAY.killMember(ms, 0); PLAY.killMember(ms, 3); }
  check("... two gone: 2 x 5 = 10 (Fleets p. 512)", PLAY.conceded(mines, ms) === 10, PLAY.conceded(mines, ms));
  check("... and the figure cites Fleets p. 512", PLAY.concededPage(mines) === "Fleets p. 512", PLAY.concededPage(mines));
  const mf = PLAY.freshUnit(minefield);
  check("a minefield has no ticks: its size is rolled at set-up (Fleets p. 513)", !mf.members);
  check("... and concedes nothing: it is suppressed, not destroyed, and its mines do not count (Fleets p. 513)", PLAY.conceded(minefield, mf) === 0, PLAY.conceded(minefield, mf));
  check("a commander's row concedes nothing by itself", PLAY.conceded(admiral, PLAY.freshUnit(admiral)) === 0);
}

/* --- the star fort's four quadrants, Fleets p. 501-505 ------------------ */
{
  /* p. 501: "its weapons, hits and defences are divided up into four
     'quadrants'" ... "Quadrants are crippled individually once they are
     reduced to 6 Damage Points. Once a quadrant's hits are reduced to 0 any
     further hits plow into the drifting wreckage and do no further damage".
     p. 502: "The fort itself is only destroyed once all four quadrants are
     reduced to 0 Damage Points". The names are the printed card's: docking
     piers on the N/E/S/W axes, the quadrants between them. */
  const st = PLAY.freshUnit(ramilies), fl = PLAY.freshFleet();
  const Q = PLAY.QUADS || [];
  check("the Ramilies has four quadrant tracks: NW, NE, SW, SE (Fleets p. 501)", Array.isArray(st.quads) && st.quads.length === 4 && Q.join(",") === "NW,NE,SW,SE" && st.qsel === 0, JSON.stringify([st.quads, Q]));
  const sel = k => fnP("selectQuad")(st, k);
  const arm = re => PLAY.armament(ramilies, st).filter(a => re.test(a.name));
  const q = k => (st.quads ? st.quads[k] : {});
  PLAY.addHits(ramilies, st, 6);
  check("6 hits go to the selected quadrant only (p. 501)", q(0).hits === 6 && q(1).hits === 0 && q(2).hits === 0 && q(3).hits === 0, JSON.stringify(st.quads));
  check("... that quadrant is crippled at 6 (p. 501)", PLAY.crippled(ramilies, st));
  const wbQ = arm(/^weapons battery/i).find(a => a.zone === "quadrant"), wbB = arm(/^weapons battery/i).find(a => a.zone === "basilica");
  const lan = arm(/^lance/i)[0], bay = arm(/^launch/i)[0], tor = arm(/^torpedo/i)[0];
  check("... its own weapons are halved: battery 12 -> 6, lances 5 -> 3, launch bays 4 -> 2 (p. 501, Rulebook p. 65)", wbQ && wbQ.now === "6" && lan && lan.now === "3" && bay && bay.now === "2", JSON.stringify([wbQ && wbQ.now, lan && lan.now, bay && bay.now]));
  check("... the Basilica's are not: battery 4, torpedo silos 9 (p. 500-501)", wbB && wbB.now === "4" && tor && tor.now === "9", JSON.stringify([wbB && wbB.now, tor && tor.now]));
  check("... its shields 4 -> 2 and turrets 4 -> 2 (p. 501)", PLAY.shields(ramilies, st).now === 2 && PLAY.turrets(ramilies, st).now === 2);
  check("... damage control rolls the quadrant's own 6 dice (p. 502, Rulebook p. 88)", PLAY.repairDice(ramilies, st) === 6, PLAY.repairDice(ramilies, st));
  check("... a crippled quadrant concedes nothing (p. 123: 25 % is a capital ship's)", PLAY.conceded(ramilies, st) === 0, PLAY.conceded(ramilies, st));
  sel(1);
  check("the next quadrant is whole: not crippled, battery 12, shields 4 (p. 501)", !PLAY.crippled(ramilies, st) && (arm(/^weapons battery/i).find(a => a.zone === "quadrant") || {}).now === "12" && PLAY.shields(ramilies, st).now === 4);
  /* p. 501: "All damage and criticals only affect the quadrant that they
     are inflicted against" */
  PLAY.addCrit(st, "7", ramilies);
  check("a critical is the selected quadrant's own (p. 501)", !!q(1).crits && q(1).crits["7"] === 1 && !(q(0).crits || {})["7"], JSON.stringify(st.quads));
  check("... and the view lists it only while that quadrant is selected", PLAY.view(ramilies, st, fl).crits.length === 1 && (sel(0), PLAY.view(ramilies, st, fl).crits.length === 0));
  /* p. 501: at 0 the quadrant takes no further damage; p. 502: the fort
     stands until all four are at 0 */
  PLAY.addHits(ramilies, st, 20);
  check("a quadrant stops at 12 hits: further hits do no damage (p. 501)", q(0).hits === 12, q(0).hits);
  check("... the fort is NOT destroyed with one quadrant gone (p. 502)", !PLAY.destroyed(ramilies, st));
  check("... and concedes nothing yet (p. 123, Fleets p. 502)", PLAY.conceded(ramilies, st) === 0, PLAY.conceded(ramilies, st));
  check("... the gone quadrant's weapons are silent, the Basilica's fire on (p. 501)", !!wbQ && arm(/./).filter(a => a.zone === "quadrant").every(a => !!a.silent) && arm(/./).filter(a => a.zone === "basilica").every(a => !a.silent),
        JSON.stringify(arm(/./).map(a => [a.name, a.zone, a.silent])));
  check("... its shields and turrets are 0", PLAY.shields(ramilies, st).now === 0 && PLAY.turrets(ramilies, st).now === 0);
  /* p. 502 Boarding: "the remaining hit points of all four quadrants apply
     to the Ramilies' boarding value, but only the turret value of the
     quadrant actually being boarded is added" */
  sel(1);
  check("boarding value: all four quadrants' hits left + the boarded quadrant's turrets = 36 + 4 (p. 502)", PLAY.boardingValue(ramilies, st).defend === 40, JSON.stringify(PLAY.boardingValue(ramilies, st)));
  /* p. 503: "Brace for Impact orders will halve the firepower and ordnance
     strength of the Basilica weapons as normal." */
  const br = PLAY.freshUnit(ramilies);
  PLAY.setOrder(br, fl, "BFI", true);
  const bb = PLAY.armament(ramilies, br).filter(a => a.zone === "basilica");
  check("Brace halves the Basilica weapons too: battery 4 -> 2, torpedo silos 9 -> 5 (p. 503)", bb.length === 2 && bb[0].now === "2" && bb[1].now === "5", JSON.stringify(bb.map(a => a.now)));
  /* p. 505, 11 Basilica penetrated: "All quadrants suffer D3 damage and
     the Basilica weapons are lost." */
  const bp = PLAY.freshUnit(ramilies);
  fnP("selectQuad")(bp, 2);
  PLAY.addCrit(bp, "11", ramilies);
  fnP("selectQuad")(bp, 0);
  const lost = PLAY.armament(ramilies, bp);
  check("critical 11 on any quadrant: the Basilica weapons are lost, whichever quadrant is looked at (p. 505)",
        lost.filter(a => a.zone === "basilica").length === 2 && lost.filter(a => a.zone === "basilica").every(a => !!a.silent && /505/.test(a.silent)) && lost.filter(a => a.zone === "quadrant").every(a => !a.silent),
        JSON.stringify(lost.map(a => [a.name, a.zone, a.silent])));
  /* all four at 0: destroyed, and the D6 table of p. 505 */
  if(st.quads) st.quads.forEach(x => { x.hits = 12; });
  check("all four quadrants at 0: the fort is destroyed (p. 502) and concedes its 875 points (p. 123)", PLAY.destroyed(ramilies, st) && PLAY.conceded(ramilies, st) === 875, PLAY.conceded(ramilies, st));
  check("... with a commander aboard his points too (p. 123, Fleets p. 503)", PLAY.conceded(ramilies, st, 50) === 925, PLAY.conceded(ramilies, st, 50));
  const c = PLAY.catastrophic(ramilies);
  check("... then it rolls a D6 on its own table (p. 504-505)", c.dice === "D6" && c.page === 505 && c.rows.length === 4, JSON.stringify([c.dice, c.page]));
  /* the view carries the four quadrants for the selector */
  const v = PLAY.view(ramilies, PLAY.freshUnit(ramilies), fl);
  check("the view lists the four quadrants with their own hits left", !!v.fort && Array.isArray(v.quads) && v.quads.map(x => x.name + x.remaining).join(",") === "NW12,NE12,SW12,SE12" && v.max === 12 && v.hits === 0, JSON.stringify(v.quads));
  /* the Fortress-Monastery "follows all rules for the Ramilies" (Fleets p. 110) */
  const fm = PLAY.freshUnit(monastery);
  check("the Fortress-Monastery has the same four tracks (Fleets p. 110-111)", Array.isArray(fm.quads) && fm.quads.length === 4);
  /* A game saved before the quadrants: the one track becomes the first
     quadrant - nothing is lost. A record that already carries a
     Catastrophic Damage result was a fort declared gone: all four at 0. */
  const adopt = fnP("adoptUnit");
  const old = { hits: 7, crits: { "7": 1 }, order: null, hulk: null, destroyed: false, blast: 0, ld: 9, played: 0 };
  adopt(monastery, old);
  check("an older Fortress-Monastery record: its 7 hits and its fire are now the first quadrant's",
        Array.isArray(old.quads) && old.quads[0].hits === 7 && old.quads[0].crits["7"] === 1 && old.quads[1].hits === 0 && old.quads[3].hits === 0 && old.qsel === 0 && !PLAY.destroyed(monastery, old) && PLAY.crippled(monastery, old), JSON.stringify(old));
  adopt(monastery, old);
  check("... adopting twice changes nothing", Array.isArray(old.quads) && old.quads[0].hits === 7 && old.quads[1].hits === 0);
  const wreck = { hits: 12, crits: {}, hulk: "drifting", hulkName: "Wrecked", hulkText: "x", destroyed: false, blast: 0, ld: 9 };
  adopt(monastery, wreck);
  check("... an older record with a Catastrophic result stays destroyed, result and all", PLAY.destroyed(monastery, wreck) && wreck.hulkName === "Wrecked" && Array.isArray(wreck.quads) && wreck.quads.every(x => x.hits === 12), JSON.stringify(wreck));
  /* a unit that only MENTIONS the Ramilies is not one (p. 500: defences
     "may be sited within 30 cm of a Ramilies class star fort") */
  check("a defence whose rule line mentions a Ramilies class star fort is not a star fort", !PLAY.isFort({ stats: { type: "Defence", hits: 8, quadrant: false }, rules: [{ t: "May be sited within 30 cm of a Ramilies class star fort." }] }) && PLAY.isFort(ramilies) && PLAY.isFort(monastery));
  /* p. 502: "A Ramilies Star Fort may have in play up to twice the attack
     craft markers as the number of launch bays it has remaining."
     p. 111: the fortress-monastery "doesn't provide twice the launch bay
     number to the launch limit ... Use the value listed in its profile." */
  const bays = fnP("launchBays");
  check("attack craft limit: a whole Ramilies 4 quadrants x 4 bays x 2 = 32 (Fleets p. 502)", (bays(ramilies, PLAY.freshUnit(ramilies)) || {}).n === 32, JSON.stringify(bays(ramilies, PLAY.freshUnit(ramilies))));
  const half = PLAY.freshUnit(ramilies); if(half.quads){ half.quads[0].hits = 6; half.quads[1].hits = 12; }
  check("... one quadrant crippled (2 bays) and one gone (0): (2 + 0 + 4 + 4) x 2 = 20 (p. 502, Rulebook p. 73)", (bays(ramilies, half) || {}).n === 20, JSON.stringify(bays(ramilies, half)));
  check("... a Fortress-Monastery 4 x 3 = 12, not doubled (Fleets p. 111)", (bays(monastery, PLAY.freshUnit(monastery)) || {}).n === 12, JSON.stringify(bays(monastery, PLAY.freshUnit(monastery))));
  check("... two air bases 2 x 4 = 8 (Fleets p. 517), a Dictator 4 (Rulebook p. 73)", (bays(airbases, PLAY.freshUnit(airbases)) || {}).n === 8 && (bays(dictator, PLAY.freshUnit(dictator)) || {}).n === 4,
        JSON.stringify([bays(airbases, PLAY.freshUnit(airbases)), bays(dictator, PLAY.freshUnit(dictator))]));
}

/* --- Leadership and special orders of defences -------------------------- */
{
  /* Rulebook p. 100 (and the box on Fleets p. 499): "Stationary defences
     and vessels used as planetary defences such as Defence Monitors or
     system ships do not roll for leadership or have a leadership value ...
     they reload ordnance (where applicable) on a nominal leadership of 7
     ... they cannot take on any special orders except Reload Ordnance,
     though they may also attempt to Brace For Impact against this same
     leadership." Fleets p. 503: a Ramilies' "Leadership is rolled as for a
     capital ship" and it "can use ... Reload Ordnance, Lock On, Brace for
     Impact". p. 111: "Fortress-Monasteries have a base leadership of 10".
     p. 334: "An Eldar Haven rolls for leadership following Eldar rules"
     and "may only attempt to Lock On, Reload Ordnance or Brace For
     Impact". */
  const fx = fnP("fixedLd"), val = R => { const x = fx(R); return x ? x.value : null; };
  check("no Leadership roll, Ld 7: station, platform, air base, monitor, system ship, fire ship, Tau orbital (Rulebook p. 100, Fleets p. 499)",
        [station, platforms, airbases, monitors, sysships, fireships, tauCity, blackstone, dock].every(R => val(R) === 7), [station, platforms, airbases, monitors, sysships, fireships, tauCity, blackstone, dock].map(val).join(","));
  check("the Fortress-Monastery has Ld 10 without a roll (Fleets p. 111)", val(monastery) === 10, val(monastery));
  check("the Ramilies (p. 503) and the Haven (p. 334) roll as usual; so does a Lunar", val(ramilies) === null && val(haven) === null && val(lunar) === null, [val(ramilies), val(haven), val(lunar)].join(","));
  check("a commander's own Leadership line is not a ship's fixed Leadership", admiral.leadership && admiral.leadership.kind === "fixed" && val(admiral) === null, JSON.stringify(admiral.leadership));
  const ids = R => (fnP("ordersFor")(R) || []).map(o => o.id).join(",");
  check("orders offered to a station: Reload Ordnance and Brace only (Rulebook p. 100)", ids(station) === "RO,BFI", ids(station));
  /* "they reload ordnance (where applicable)" (Fleets p. 499): a Defence
     Monitor carries a weapons battery and a lance (p. 514) and no ordnance,
     so Reload Ordnance is not an order it can use - only Brace is left. */
  check("... to a Defence Monitor only Brace: it has no ordnance to reload (Fleets p. 499, 514)", ids(monitors) === "BFI", ids(monitors));
  check("... to fire ships only Brace (Fleets p. 499, 516)", ids(fireships) === "BFI", ids(fireships));
  check("... to a Ramilies: Lock On, Reload Ordnance, Brace (Fleets p. 503); to a Haven the same three (p. 334)", ids(ramilies) === "LO,RO,BFI" && ids(haven) === "LO,RO,BFI", ids(ramilies) + " / " + ids(haven));
  check("... to a Lunar all six (Rulebook p. 46-47)", ids(lunar) === "AAF,CTNH,BR,LO,RO,BFI", ids(lunar));
  const st = PLAY.freshUnit(station), fl = PLAY.freshFleet();
  check("a station may not Lock On or go All Ahead Full (Rulebook p. 100)", PLAY.canOrder(st, fl, "LO", station) === false && PLAY.canOrder(st, fl, "AAF", station) === false);
  check("... but may Reload Ordnance and Brace (Rulebook p. 100)", PLAY.canOrder(st, fl, "RO", station) === true && PLAY.canOrder(st, fl, "BFI", station) === true);
  check("a Ramilies may Lock On (Fleets p. 503) but not Come to New Heading", PLAY.canOrder(PLAY.freshUnit(ramilies), fl, "LO", ramilies) === true && PLAY.canOrder(PLAY.freshUnit(ramilies), fl, "CTNH", ramilies) === false);
  check("a Lunar's orders are as before, with or without the unit passed", PLAY.canOrder(PLAY.freshUnit(lunar), fl, "AAF", lunar) === true && PLAY.canOrder(PLAY.freshUnit(lunar), fl, "AAF") === true);
  /* Who a fleet commander may board. Fleets p. 503: "Fleet Commanders may
     be placed aboard a Ramilies"; p. 111: "Fleet Commanders may be placed
     aboard a fortress"; p. 334: "An Eldar or Dark Eldar fleet commander can
     lead the battle aboard it instead of a ship". Nothing gives a platform,
     a station, an air base or a defence vessel a commander: they have no
     Leadership value at all (Rulebook p. 100). */
  const may = fnP("mayCarryCommander");
  check("a commander may board a capital ship, a Ramilies (p. 503), a Fortress-Monastery (p. 111) and a Haven (p. 334)", [lunar, ramilies, monastery, haven].every(R => may(R) === true), [lunar, ramilies, monastery, haven].map(may).join(","));
  check("... never a platform, a station, a Blackstone, an air base, a monitor, a mine or an escort (Rulebook p. 100)", [platforms, station, blackstone, dock, airbases, monitors, fireships, tauCity, mines, swords, admiral].every(R => may(R) === false),
        [platforms, station, blackstone, dock, airbases, monitors, fireships, tauCity, mines, swords, admiral].map(may).join(","));
  const dflt = fnP("defaultFlagship");
  check("the default flagship is a real capital ship, not the bigger Blackstone or Ramilies beside it", dflt([admiral, blackstone, ramilies, lunar, platforms]) === 3, dflt([admiral, blackstone, ramilies, lunar, platforms]));
  check("... the biggest hull among the capital ships, as before", dflt([lunar, unitIn(/Gothic Sector$/, /^Retribution/i), swords]) === 1);
  check("... with no capital ship, the fort a commander may board (p. 503)", dflt([admiral, station, ramilies, platforms]) === 2, dflt([admiral, station, ramilies, platforms]));
  check("... and nobody when only platforms and stations are there", dflt([admiral, station, platforms, monitors]) === null, dflt([admiral, station, platforms, monitors]));
}

/* --- a stationary defence does not move ---------------------------------- */
{
  /* Rulebook p. 100: "Satellite units may not move"; p. 101: multi-hit
     defences "get crippled once they have lost half their damage points"
     and "never drift, they always remain in place". The -5 cm of p. 65 is
     a moving ship's. The profiles print the speed as "0" (Fleets p. 506-
     511, 517), "0 cm" (p. 500) or a dash (the Haven, p. 332). */
  const ss = PLAY.freshUnit(station);
  const s0 = PLAY.speed(station, ss);
  check("a Space Station's speed '0' is the number 0 (Fleets p. 507)", station.stats.speed === "0" && s0.base === 0 && s0.now === 0 && s0.mods.length === 0, JSON.stringify(s0));
  PLAY.addHits(station, ss, 4);
  const s1 = PLAY.speed(station, ss);
  check("crippled: still 0, and no -5 cm on a unit that cannot move (Rulebook p. 100-101)", PLAY.crippled(station, ss) && s1.now === 0 && s1.mods.length === 0 && s1.still === true, JSON.stringify(s1));
  check("... its shields 2 -> 1 and turrets 4 -> 2 are halved like a capital ship's (p. 101, p. 65)", PLAY.shields(station, ss).now === 1 && PLAY.turrets(station, ss).now === 2);
  const hs = PLAY.freshUnit(haven); PLAY.addHits(haven, hs, 4);
  const s2 = PLAY.speed(haven, hs);
  check("a crippled Haven (speed '-', Fleets p. 332): no -5 either", PLAY.crippled(haven, hs) && s2.mods.length === 0 && s2.still === true, JSON.stringify(s2));
  const rs = PLAY.freshUnit(ramilies); PLAY.addHits(ramilies, rs, 6);
  check("a crippled Ramilies quadrant (speed '0 cm', p. 500): no -5", PLAY.speed(ramilies, rs).mods.length === 0 && PLAY.speed(ramilies, rs).now === 0, JSON.stringify(PLAY.speed(ramilies, rs)));
  const ls = PLAY.freshUnit(lunar); PLAY.addHits(lunar, ls, 4);
  check("a crippled Lunar still loses 5 cm (p. 65)", PLAY.speed(lunar, ls).now === 15 && PLAY.speed(lunar, ls).still === false, JSON.stringify(PLAY.speed(lunar, ls)));
  /* the player's own mark: a unit that cannot move goes straight from TO
     PLAY to SHOT */
  const ps = PLAY.freshUnit(station);
  PLAY.cyclePlayed(ps, station);
  check("played mark on a stationary defence: one tap = shot, there is no move (Rulebook p. 100)", ps.played === 2, ps.played);
  PLAY.cyclePlayed(ps, station);
  check("... a second tap = unplayed again", ps.played === 0, ps.played);
  const pm = PLAY.freshUnit(monitors); PLAY.cyclePlayed(pm, monitors);
  check("... a Defence Monitor moves (10 cm, Fleets p. 514): moved first", pm.played === 1, pm.played);
  /* Rulebook p. 101, the book's own example: "the huge Blackstone
     Fortresses" - a defence with multiple hits rolls on the table at 0 but
     "defences never drift, they always remain in place". */
  const cb = PLAY.catastrophic(blackstone);
  check("the stationary Blackstone Fortress (Fleets p. 506): the rulebook table, hulk rows 'stays in place' (Rulebook p. 101)", cb.dice === "2D6" && cb.page === 71 && /stays in place/i.test(cb.rows[0].text) && /stays in place/i.test(cb.rows[1].text) && !/4D6/.test(cb.rows[0].text) && /never drifts/.test(cb.hulk.list[0]),
        JSON.stringify([cb.dice, cb.rows[0].text]));
  check("... 9-11 on its 16 hits: 8 Blast Markers and lance Strength 8 (Rulebook p. 71)", /8 Blast/.test(cb.rows[2].text) && /Strength 8/.test(cb.rows[2].text), cb.rows[2].text);
}

/* --- the Defences Critical Hits Table is not the ships' ------------------ */
{
  /* Rulebook p. 101: 2-3 Lances, 4 Main armament, 5 Ordnance bays, 6
     Reactors +1, 7 Fire, 8-9 Orbit lost +1, 10 Shields collapse, 11 Hull
     breach +D3, 12 Bulkhead collapse +D6. None of p. 67's ship results
     (dorsal/port/prow, engine room, thrusters, bridge) is on it, so none
     of their effects may reach a station (RULINGS.md T5, T33). */
  const cm = station.damage.critical;
  check("the Space Station carries the Defences table: rows 2-3, 4, 5, 6, 7, 8-9, 10 and wide 11, 12 (Rulebook p. 101)",
        /^DEFENCES CRITICAL HITS/.test(cm.title) && cm.rows.map(r => r[0]).join(",") === "2-3,4,5,6,7,8-9,10" && cm.wide.length === 2 && /^11 /.test(cm.wide[0]) && /^12 /.test(cm.wide[1]), JSON.stringify([cm.title, cm.rows.map(r => r[0]), cm.wide]));
  check("... the ship table's derived effects are off for it", !PLAY.standardCrits(station) && !PLAY.standardCrits(blackstone) && !PLAY.standardCrits(tauCity) && PLAY.standardCrits(lunar));
  const st = PLAY.freshUnit(station); st.ld = 7;
  check("a rolled 2-3 stays 2-3: it is not walked on to the ships' 6 Engine room (Rulebook p. 101 vs p. 67)", PLAY.critTarget(st, "2-3", station) === "2-3" && PLAY.addCrit(st, "2-3", station) === "2-3" && st.crits["2-3"] === 1 && st.hits === 0, JSON.stringify(st.crits));
  PLAY.addCrit(st, "6", station); PLAY.addCrit(st, "8-9", station); PLAY.addCrit(st, "10", station);
  check("... 6 Reactors is not Engine room: turns untouched; 8-9 Orbit lost is not Bridge smashed: Ld stays 7", !PLAY.turns(station, st).none && st.ldPerm === 0 && PLAY.leadership(station, st, PLAY.freshFleet()).now === 7, JSON.stringify([PLAY.turns(station, st), st.ldPerm]));
  check("... every result is counted and listed in the table's order", PLAY.activeCrits(st).map(c => c.key).join(",") === "2-3,6,8-9,10", PLAY.activeCrits(st).map(c => c.key).join(","));
  PLAY.removeCrit(st, "8-9");
  check("... and the minus takes a two-number row off again", !st.crits["8-9"] && PLAY.activeCrits(st).length === 3);
  check("the Ramilies has its own table: not the ships', not the defences' (Fleets p. 505)", /^STAR FORT/.test(ramilies.damage.critical.title) && !PLAY.standardCrits(ramilies));
  check("one-hit defences have no critical table to use: any critical destroys them like an escort (p. 66)", PLAY.isEscort(platforms) && PLAY.isEscort(monitors));
}

/* --- rule cards: mines, minefields, fire ships ---------------------------- */
{
  /* Fleets p. 512-513, 516: an orbital mine and a minefield have no
     profile at all; a fire ship has a profile (Escort/1) and no armament. */
  check("orbital mines and minefields are hull-less rows with their rule steps", mines.kind === "entry" && minefield.kind === "entry" && mines.stats === null && mines.hulls === 5 && minefield.hulls === 2 &&
        !!mines.ruleCard && mines.ruleCard.steps.length > 0 && !!minefield.ruleCard && minefield.ruleCard.steps.length > 0, JSON.stringify([mines.kind, mines.hulls, minefield.hulls]));
  const tick = fnP("tickUnit");
  check("mines are ticked off one by one, a minefield and a ship are not", tick(mines) === true && tick(minefield) === false && tick(lunar) === false && tick(fireships) === false && tick(admiral) === false, [mines, minefield, lunar, fireships, admiral].map(tick).join(","));
  const ms = PLAY.freshUnit(mines);
  if(ms.members) ms.members.forEach(m => { m.dead = true; });
  check("all five mines gone: 25 points (Fleets p. 512)", PLAY.conceded(mines, ms) === 25, PLAY.conceded(mines, ms));
  const old = { hits: 0, crits: {} };
  fnP("adoptUnit")(mines, old);
  check("a record without ticks gets them", Array.isArray(old.members) && old.members.length === 5);
  check("a fire ship has no armament: nothing to fire, nothing to sum (Fleets p. 516)", fireships.weapons.length === 0 && PLAY.escortFire(fireships, PLAY.freshUnit(fireships)).length === 0 && PLAY.freshUnit(fireships).members.length === 3);
  const fs = PLAY.freshUnit(fireships);
  fs.members.forEach(m => { m.dead = true; });
  check("three fire ships all gone: an escort squadron's 30 points (p. 123, Fleets p. 516)", PLAY.conceded(fireships, fs) === 30, PLAY.conceded(fireships, fs));
}

/* --- commanders have no card state ----------------------------------- */
{
  check("a commander resolves without stats", admiral.kind === "commander" && admiral.stats === null);
  const st = PLAY.freshUnit(admiral);
  check("freshUnit tolerates a commander", st && !st.members && !PLAY.destroyed(admiral, st));
}

/* --- the view is the sum of the above --------------------------------- */
{
  const st = PLAY.freshUnit(lunar), fl = PLAY.freshFleet();
  st.ld = 8; PLAY.addHits(lunar, st, 4); PLAY.addCrit(st, "7");
  const v = PLAY.view(lunar, st, fl);
  check("view: crippled, 4 remaining, 1 shield, 1 fire, 4 repair dice, 45 VP conceded",
        v.crippled && v.remaining === 4 && v.shields.now === 1 && v.crits.length === 1 && v.repairDice === 4 && v.conceded === 45,
        JSON.stringify({ c: v.crippled, r: v.remaining, s: v.shields.now, k: v.crits.length, d: v.repairDice, vp: v.conceded }));
}

/* --- review 9.10.2026 -------------------------------------------------- */
{
  /* Fleets p. 501: "Once a quadrant's hits are reduced to 0 any further hits
     plow into the drifting wreckage and do no further damage" - so no
     critical can be inflicted on it either. Critical 11 tapped on a dead
     quadrant used to take the Basilica's weapons away. */
  const R = ramilies, st = PLAY.freshUnit(R);
  PLAY.adoptUnit(R, st);
  PLAY.selectQuad(st, 0);
  PLAY.addHits(R, st, R.stats.hits);
  const before = JSON.stringify(st.quads[0].crits || {});
  const k = PLAY.addCrit(st, "11", R);
  check("a critical on a quadrant at 0 is refused (Fleets p. 501)",
        PLAY.quadGone(R, st) && k === null && JSON.stringify(st.quads[0].crits || {}) === before, JSON.stringify([k, st.quads[0].crits]));
  PLAY.selectQuad(st, 1);
  check("... and still lands on a live quadrant", PLAY.addCrit(st, "11", R) === "11" && st.quads[1].crits["11"] === 1, JSON.stringify(st.quads[1].crits));
  /* A unit that does not move has no use for the three movement orders:
     the Nicassar Rig is "stationary in the same manner as any other
     planetary defence" (Fleets p. 493) and the page labels it STATIONARY. */
  const rig = unitIn(/^Tau .* Commerce Protection/, /^Nicassar Rig/i);
  const ids = (PLAY.ordersFor(rig) || []).map(o => o.id).join(",");
  check("a stationary unit is not offered All Ahead Full, Come to New Heading or Burn Retros (Fleets p. 493)",
        PLAY.isStill(rig) && ids === "LO,RO,BFI", ids);
  /* Fleets p. 495 (Warsphere) and p. 492 (Caravan): crippling does not slow
     them - the unit's own crippled note says "Speed unchanged". */
  const ws = unitIn(/^Tau .* Commerce Protection/, /^Kroot Warsphere/i), wst = PLAY.freshUnit(ws);
  PLAY.addHits(ws, wst, ws.damage.crippledAt);
  const sp = PLAY.speed(ws, wst);
  check("a crippled Kroot Warsphere keeps its speed (Fleets p. 495)",
        PLAY.crippled(ws, wst) && /Speed unchanged/.test(ws.damage.note) && sp.now === sp.base && !sp.mods.some(m => m.t === "crippled"),
        JSON.stringify(sp));
}

/* --- player report 12.-13.10.2026: Leadership up to 10, the ship's own +1 --- */
{
  /* The values a ship can start a game with. Rulebook p. 45: "1 Untried
     (Ld 6), 2-3 Experienced (Ld 7), 4-5 Veteran (Ld 8), 6 Crack (Ld 9)".
     Fleets p. 94, Space Marine Leadership: "1-2 Ld 8, 3-4 Ld 9, 5-6 Ld 10",
     and p. 154: "Grey Knights count as Space Marines in all respects and as
     such follow all rules for Space Marines as written on pages 92-94" - a
     Grey Knights Strike Cruiser taken by an Imperial Navy fleet (p. 148)
     rolls an 8, a 9 or a 10. Fleets p. 304: Eldar ships have "a Leadership
     value between 7 and 10". Fleets p. 360: "all Ork ships reduce their
     Leadership by -1 from whatever they rolled, giving them a Leadership
     range of 5 to 8". Rulebook p. 48: "Under no circumstance can a ship's
     Leadership be modified higher than Leadership 10." */
  const vals = Array.isArray(PLAY.LD_VALUES) ? PLAY.LD_VALUES : [];
  check("the Leadership choice offers the rulebook's 6, 7, 8 and 9 (Rulebook p. 45)", [6, 7, 8, 9].every(v => vals.indexOf(v) >= 0), vals.join(","));
  check("... and 10: a Space Marine or Grey Knights ship rolls 8-10 (Fleets p. 94, 154), an Eldar ship 7-10 (p. 304)", vals.indexOf(10) >= 0, vals.join(","));
  check("... and 5: an Ork ship rolls 5-8 (Fleets p. 360)", vals.indexOf(5) >= 0, vals.join(","));
  check("... nothing else: 5 to 10, in order (Rulebook p. 48: never above 10)", vals.join(",") === "5,6,7,8,9,10", vals.join(","));

  /* User decision 13.10.2026 (RULINGS.md T40): the play page automates
     nothing of the Leadership value - the player chooses it and does the
     sums. The Emperor's own +1 (Fleets p. 53: "giving it +1 to its
     Leadership rating") was added by the page for one day and taken out
     again: a ship checks on exactly the value that was chosen, until a
     tracked critical changes it. */
  const emperor = unit("Battleships", "Emperor class battleship");
  const fl = PLAY.freshFleet();
  const ldOf = (R, ld, more) => { const st = PLAY.freshUnit(R); st.ld = ld; if(more) more(st); return PLAY.leadership(R, st, fl); };
  check("the page derives no Leadership bonus of a ship's own: no such function on PLAY (user decision 13.10.2026)",
        PLAY.shipLdBonus === undefined && PLAY.ownLd === undefined);
  const e7 = ldOf(emperor, 7);
  check("an Emperor set to Ld 7 checks on Ld 7: its +1 (Fleets p. 53) is the player's to add",
        !!emperor && e7.now === 7 && e7.base === 7 && e7.mods.length === 0, JSON.stringify(e7));
  /* Rulebook p. 67: Bridge Smashed, "The ship's Leadership is reduced by 3" -
     a tracked critical, not a derived starting value */
  const e8 = ldOf(emperor, 8, st => PLAY.addCrit(st, "9", emperor));
  check("... with its bridge smashed: 8 - 3 = 5 (Rulebook p. 67)", e8.now === 5, JSON.stringify(e8));
  const sq = (eLd, lLd) => { const a = PLAY.freshUnit(emperor), b = PLAY.freshUnit(lunar); a.ld = eLd; b.ld = lLd; return PLAY.squadronLd([{ R: lunar, st: b }, { R: emperor, st: a }], fl); };
  check("squadron of a Lunar (Ld 8) and an Emperor (Ld 8): Ld 8 - the chosen values, nothing added (Rulebook p. 95)",
        sq(8, 8).now === 8, JSON.stringify(sq(8, 8)));
}

/* --- review 5.10.2026 leftovers (BACKLOG J168 b) ---------------------- */
{
  /* Fleets p. 111: "If used in this manner, re-rolls purchased by the
     fortress-monastery are added to the commander's own re-rolls and can be
     used by the entire fleet." Ramilies p. 503 likewise. */
  const fort = { rerolls: { total: 2, joins: { page: 111 } } }, scion = { rerolls: { total: 2, joins: null } };
  check("a fort's re-rolls are the fleet's while the commander is aboard (Fleets p. 111)",
        typeof PLAY.rerollsJoinFleet === "function" && PLAY.rerollsJoinFleet(fort, true) === true);
  check("... and its own without him", typeof PLAY.rerollsJoinFleet === "function" && PLAY.rerollsJoinFleet(fort, false) === false);
  check("a Scion of Prospero's two stay its own with the Warmaster aboard (p. 260)",
        typeof PLAY.rerollsJoinFleet === "function" && PLAY.rerollsJoinFleet(scion, true) === false);
}

/* --- rolling the Leadership (user 31.10.2026, RULINGS.md T44) ---------- */
{
  /* A unit of any list, found by its row's label, resolved as the page does. */
  const unitOf = (listRe, labelRe, ups) => {
    const L = catalog.lists.find(x => listRe.test(x.nm));
    for(const s of L.secs) for(const en of s.ents){
      if(en.k !== "unit" || !labelRe.test(en.l)) continue;
      const upgrades = {};
      (ups || []).forEach(re => L.secs.forEach(s2 => s2.ents.forEach(e2 => { if(e2.k === "up" && re.test(e2.l)) upgrades[DOMAIN.upgradeId ? DOMAIN.upgradeId(L.nm, s2.t, e2.l) : e2.l] = "take"; })));
      return DOMAIN.resolveUnit({ schemaVersion: DOMAIN.SCHEMA_VERSION, role: "core", entry: { list: L.nm, section: s.t, label: en.l },
        ref: en.r == null ? null : String(en.r), hull: null, hulls: 1, name: "", note: "", adjust: 0, custom: null, members: [], options: {}, upgrades: upgrades }, { list: L }, catalog);
    }
    throw new Error("no row " + labelRe + " in " + listRe);
  };
  const plan = R => PLAY.ldPlan(R);
  const emperor = unit("Battleships", "Emperor class battleship");
  const vals = R => [1, 2, 3, 4, 5, 6].map(d => (PLAY.ldFromDie(plan(R), d) || {}).value).join(",");
  /* Rulebook p. 45: "1 Untried 6, 2-3 Experienced 7, 4-5 Veteran 8, 6 Crack 9" */
  check("Ld roll: a Lunar on the Rulebook table 6,7,7,8,8,9 (p. 45)", vals(lunar) === "6,7,7,8,8,9", vals(lunar));
  /* Fleets p. 94: "D6 ROLL LEADERSHIP 1-2 Ld 8 3-4 Ld 9 5-6 Ld 10" */
  const strike = unitOf(/^Space Marines . Codex Astartes$/, /^Strike cruiser/i);
  check("... a Space Marine Strike Cruiser 8,8,9,9,10,10 (Fleets p. 94)", vals(strike) === "8,8,9,9,10,10", vals(strike));
  /* Fleets p. 118: "roll a D6 against the following table: 1 Ld 7, 2-3 Ld 8, 4-6 Ld 9" */
  const mech = unitOf(/Mechanicus . Explorator/, /^Dictator/i);
  check("... an Explorator Dictator 7,8,8,9,9,9 (Fleets p. 118)", vals(mech) === "7,8,8,9,9,9", vals(mech));
  /* Fleets p. 360: Ork Leadership "reduced by 1" - "a Leadership range of 5 to 8" */
  const terror = unitOf(/^Orks . Waaagh!$/, /^Terror ship$/i);
  check("... an Ork Terror Ship 5,6,6,7,7,8 (Fleets p. 360)", vals(terror) === "5,6,6,7,7,8", vals(terror));
  /* Fleets p. 304: Eldar Leadership "between 7 and 10" */
  const eclipse = unitOf(/^Eldar Corsairs . Gothic Sector$/, /^Eclipse/i);
  check("... an Eldar Eclipse 7,8,8,9,9,10 (Fleets p. 304)", vals(eclipse) === "7,8,8,9,9,10", vals(eclipse));
  /* Fleets p. 53: the Emperor "+1 to its Leadership rating"; nothing above 10 (Rulebook p. 48) */
  check("... an Emperor 7,8,8,9,9,10 (Fleets p. 53, Rulebook p. 48)", vals(emperor) === "7,8,8,9,9,10", vals(emperor));
  /* Fleets p. 85: transports "will have a Leadership value of between 5 and 8" */
  const transport = unitOf(/^Rogue Traders . Exploration$/, /^Cargo Transport$/i);
  check("... a Cargo Transport (the Imperial transport profile) 5-8 (Fleets p. 85)", vals(transport) === "5,6,6,7,7,8", vals(transport));
  /* Fleets p. 392: the Ork Hulk "always Leadership 6"; not rolled */
  const hulk = unitOf(/Da Ork Clanz/, /^Ork hulk$/i);
  check("... an Ork Hulk is not rolled: Ld 6 (Fleets p. 392)", plan(hulk) && plan(hulk).roll === false && plan(hulk).value === 6, JSON.stringify(plan(hulk)));
  check("... a Tyranid hive ship is left to the player (Fleets pp. 418-420)", plan(unitOf(/^Tyranids . Hive Fleet$/, /^Hive ship/i)).manual === true);
  check("... the Fortress-Monastery keeps its 10 (Fleets p. 111)", plan(monastery).roll === false && plan(monastery).value === 10);
  check("... a die outside 1-6 gives nothing", PLAY.ldFromDie(plan(lunar), 0) === null && PLAY.ldFromDie(plan(lunar), 7) === null);
  const seq = [0, 0.17, 0.34, 0.5, 0.67, 0.99], rng = () => seq.shift();
  check("d6: every face 1-6 from the generator", [1, 2, 3, 4, 5, 6].map(() => PLAY.d6(rng)).join("") === "123456");
}

/* --- Repair with one tap: the dice the book gives ---------------------- */
{

  const st = PLAY.freshUnit(lunar);
  const plan = (R, s2) => PLAY.repairPlan(R, s2);
  /* "capital ships roll 1D6 per Damage point remaining ... Each roll of a 6" (p. 88) */
  check("repair: a Lunar at 8 hits left rolls 8D6, 6 repairs (p. 88)", plan(lunar, st).dice === 8 && plan(lunar, st).target === 6, JSON.stringify(plan(lunar, st)));
  st.hits = 1;
  check("repair: one hit taken, 7D6 (p. 88: per Damage point remaining)", plan(lunar, st).dice === 7);
  st.blast = 1;
  check("repair: Blast Markers in contact, half rounding up: 4D6 (p. 88)", plan(lunar, st).dice === 4);
  const necron = { damage: { repair: "REPAIR: End Phase, D6 / remaining Hit; 4+ = 1 crit; blast contact 1/2 dice." }, stats: lunar.stats, rules: [] };
  check("repair: Necrons succeed on 4+ (Fleets p. 404)", plan(necron, PLAY.freshUnit(lunar)).target === 4);
  const mech = { damage: { repair: "ALL ADMECH: REPAIR +1D6." }, stats: lunar.stats, rules: [] };
  check("repair: a Mechanicus vessel adds +1D6 (Fleets p. 120)", plan(mech, PLAY.freshUnit(lunar)).dice === 9);
  const faces = PLAY.repairRoll({ dice: 4, target: 6 }, (seq => () => seq.shift())([0.99, 0, 0.5, 0.99]));
  check("repair: the roll is one die per dice, a success per target", faces.faces.join("") === "6146" && faces.hits === 2, JSON.stringify(faces));
}

/* --- the built page itself --------------------------------------------- */
/* Everything above tests rules.js. The page's own code (set-up, rows,
   cards, panels, actions, VP sums) is in src/, and nothing above runs it:
   smoke_play.js boots the BUILT page in a vm and plays one unit of each
   kind through it. --rules skips it (no build needed). */
if(!process.argv.includes("--rules")) require(path.join(__dirname, "smoke_play.js"))(check);

console.log((fail ? "FAIL " : "ok ") + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
