import { wepClass } from "./arms.js";
import { foreignReserveRow, isCaravan, isHaven, isOrkHulk, isRockVessel, isStationaryDefence } from "./crits.js";
import { hasOrdnance, optionsOf, upgradesOf } from "./unit.js";
import { optState } from "./upgrades.js";
import { statMod, weaponRows } from "./weapons.js";

/* ------------------------------------------------------------- state ---- */

export function wepKey(name){
  return String(name || "").toLowerCase()
    .replace(/^(port|starboard|prow|dorsal|forward|aft)\s+/g, "")
    .replace(/\*/g, "")
    .replace(/\s+(battery|batteries|bays|bay)$/g, "")
    .trim();
}

/* Weapon special rules shared across the rulebooks. A profile page's own
   SPECIAL text is added alongside these. Each id uses the same colour on the
   ARMAMENT row and on the SPECIAL row that explains it. */
export const SPECIAL_WEAPON_RULES = [
  {id:"nova", color:"#C43D4D", wep:/nova cannon/i,
   mentions:[/nova cannon/i],
   text:"Nova Cannon: place the template 30-150 cm away; scatter by range. Centre hole causes D6 hits, other contact 1 hit; touched ordnance is removed. No firing while crippled or on AAF, Burn Retros, CTNH or Brace. (Rulebook pp. 63-66)"},
  {id:"special_torpedoes", color:"#5B646D", wep:/^$/, up:/^special torpedoes/i, mentions:[/special torpedo/i],
   text:"Special Torpedoes: roll a D6 before the game, one type per ship - 1 Short Burn*, 2 Guided*, 3 Seeking, 4 Barrage Bombs*, 5 Melta, 6 Vortex (* for the whole game, the rest for one salvo). Short Burn: speed 40 cm; after moving and attacking roll a D6 per salvo, on a 6 it becomes a Blast Marker. Guided: turns up to 45 degrees at the start of the Ordnance phase if the launching ship passes a Leadership test; if it fails, one enemy ship that passes a test turns them. Seeking: turns up to 45 degrees towards the nearest (largest) enemy ship; detonates in Blast Markers on a 5+; never attacks friendly ships. Barrage Bombs: may launch in low orbit; 1 assault point (2 from Strength 7); against ships they hit like direct fire. Melta: each hit is an automatic Fire critical instead of damage. Vortex: each hit causes a critical. A prow critical while carrying unused Melta or Vortex torpedoes: +D3 Fire criticals (Melta) or +D3 damage and a critical (Vortex). (Fleets pp. 19-21)"},
  {id:"orbital_mine", color:"#6B6E1C", wep:/orbital mine/i,
   mentions:[/orbital mine/i],
   text:"Orbital Mines: launched like attack craft, one per launch bay Strength; no waves, not subject to ordnance limits. Each moves 10 cm towards the nearest enemy ship in every Ordnance phase; on contact with its base it detonates with 8 dice against armour (4 if turrets hit the mine); shields do not protect (FAQ 2026). A critical to the launch bays causes an extra D3 damage. (Fleets pp. 23, 512)"},
  {id:"bombardment", color:"#7B3FB2", wep:/bombardment cannon/i,
   mentions:[/bombardment cannon/i,/bombardment shells/i],
   text:"Bombardment Cannon: a weapon battery that always hits on 4+ (ordnance too) and causes criticals on 4+. (Fleets p. 94)"},
  /* Tyranid torpedoes "are always boarding torpedoes" (Fleets p. 426), so the
     ordinary-torpedo clause does not apply and the hive ship card has no
     room for it. */
  {id:"boarding_torpedo_tyranid", color:"#59636F", wep:/boarding torpedo/i, list:/Tyranid/i,
   mentions:[/boarding torpedo/i],
   text:"Boarding Torpedoes: Hit & Run, not damage; one 45\u00b0 turn each later Ordnance phase. (Rulebook p. 78)"},
  {id:"boarding_torpedo", color:"#59636F", wep:/boarding torpedo/i, notList:/Tyranid/i,
   mentions:[/boarding torpedo/i],
   text:"Boarding Torpedoes: a hit is a Hit & Run attack, not damage; never in the same turn as ordinary torpedoes from the same ship; one 45\u00b0 turn at the start of each later Ordnance phase; may ignore hulks. (Rulebook p. 78)"},
  /* Fleets pp. 243, 245, 247 ORDNANCE: "Ships with torpedo tubes are armed with
     normal and boarding torpedoes." The Nurgle, Khorne and Slaanesh pages (241,
     245, 249) break off before the sentence in the book (T25). Renegade
     Imperial hulls keep their own ordnance (Fleets p. 232). */
  {id:"chaos_torpedoes_233", color:"#59636F", wep:/torpedo/i, notWep:/boarding|bomber/i, list:/Incursion/i, fleet:/CHAOS/i,
   text:"Torpedoes: may be normal or boarding torpedoes (Rulebook p. 78). (Fleets p. 233)"},
  {id:"chaos_torpedoes_235", color:"#59636F", wep:/torpedo/i, notWep:/boarding|bomber/i, list:/Black Crusade/i, fleet:/CHAOS/i,
   text:"Torpedoes: may be normal or boarding torpedoes (Rulebook p. 78). (Fleets p. 235)"},
  {id:"chaos_torpedoes_237", color:"#59636F", wep:/torpedo/i, notWep:/boarding|bomber/i, list:/Tzeentch/i, fleet:/CHAOS/i,
   text:"Torpedoes: may be normal or boarding torpedoes (Rulebook p. 78). (Fleets p. 237)"},
  /* T25 (user decision 11.9.2026): the Nurgle, Khorne and Slaanesh paragraphs
     (pp. 249, 251, 253) break off in the book; the parallel lists complete them. */
  {id:"chaos_torpedoes_241", color:"#59636F", wep:/torpedo/i, notWep:/boarding|bomber/i, list:/Nurgle/i, fleet:/CHAOS/i,
   text:"Torpedoes: may be normal or boarding torpedoes (Rulebook p. 78). (Fleets pp. 235, 241)"},
  {id:"chaos_torpedoes_245", color:"#59636F", wep:/torpedo/i, notWep:/boarding|bomber/i, list:/Khorne/i, fleet:/CHAOS/i,
   text:"Torpedoes: may be normal or boarding torpedoes (Rulebook p. 78). (Fleets pp. 235, 245)"},
  {id:"chaos_torpedoes_249", color:"#59636F", wep:/torpedo/i, notWep:/boarding|bomber/i, list:/Slaanesh/i, fleet:/CHAOS/i,
   text:"Torpedoes: may be normal or boarding torpedoes (Rulebook p. 78). (Fleets pp. 235, 249)"},
  {id:"thunderhawk", color:"#70469A", wep:/launch bay/i, range:/thunderhawk/i,
   opt:/thunderhawk/i, mentions:[/thunderhawk/i],
   text:"Thunderhawk Gunship: a 20 cm fighter/assault boat. It removes one enemy ordnance marker and stops; on 4+ it survives. At a ship it makes a Space Marine Hit & Run attack. (Fleets p. 95)"},
  /* Crusade fleets only: the same bays may fly Annihilators instead. Grey
     Knights and Inquisition hulls say in their own SPECIAL text that they
     have no access to them, so the rule is tied to the list, not the fleet. */
  {id:"thunderhawk_annihilator", color:"#3B5BA5", list:/Crusade/i,
   wep:/launch bay/i, range:/thunderhawk/i, opt:/annihilator/i,
   mentions:[/annihilator/i],
   text:"Thunderhawk Annihilator: the bays may launch Annihilators instead - 20 cm fighter/bombers with the Thunderhawk 4+ resilience but no assault boat attack. They bomb a ship on contact and each surviving marker adds +1 attack after turrets; markers may forgo their attack to suppress turrets instead. (Fleets p. 96)"},
  /* Rapid strike vessels are Navy hulls on a Space Marine list with the
     Space Marine special rules (Fleets p. 106, the +5 pts); Mechanicus
     escorts are Navy or Marine hulls WITHOUT the Space Marine boarding
     bonuses (p. 121). */
  {id:"astartes_boarding", color:"#59636F", fleet:/SPACE MARINES|GREY KNIGHTS/i,
   entry:/rapid strike vessel/i, notList:/Mechanicus/i,
   wep:/torpedo/i, mentions:[/boarding torpedo|torpedo/i],
   text:"Astartes Torpedoes: may fire boarding torpedoes instead of ordinary torpedoes; their Hit & Run attack gains the Space Marine +1 bonus. (Fleets p. 95)"},
  /* Bought abilities. The price is not the option: a ship option (opt) or a
     list upgrade taken (up) brings the rule it buys onto the card. wep never
     matches a weapon row. */
  {id:"sepulchre", color:"#4B7A3F", fleet:/NECRON/i, wep:/^$/, opt:/sepulchre/i, up:/^sepulchre/i,
   mentions:[/sepulchre/i],
   text:"Sepulchre: the ship has Leadership 10. Used when not on Special Orders or Crippled: one enemy ship within 20 cm takes a Leadership test; if it fails, its Leadership is permanently -1 and it may use no Special Orders (Brace included) until the end of its next turn. Ordnance within 20 cm, except non-boarding torpedoes, is destroyed on 4+. (Fleets p. 402)"},
  {id:"csm_crew", color:"#7B3FB2", fleet:/CHAOS/i, wep:/^$/, opt:/embark chaos space marines/i,
   up:/space marine crew/i, notOpt:/chosen terminators/i, mentions:[/chaos space marine crew/i],
   text:"Chaos Space Marine crew: Leadership +1, maximum 10. +2 in boarding actions; enemy Hit & Run rolls -1; own Hit & Run by boarding torpedoes, Dreadclaws, Thunderhawks or teleport +1. 2 Assault Points per turn in a Planetary Assault. (Fleets p. 234)"},
  {id:"chosen_terminators", color:"#7B3FB2", fleet:/CHAOS/i, wep:/^$/, opt:/chosen terminators/i,
   up:/chosen terminators/i, mentions:[/chosen terminators/i],
   text:"Chosen Terminators: in a teleport Hit & Run attack roll two dice and choose which counts, +1 as normal. (Fleets p. 234)"},
  /* Chaos Marks (Fleets p. 242 and the god lists pp. 246-252) and the
     Daemonship (pp. 237-238): bought as list rows, so they print only when
     taken. On the Nurgle, Khorne and Slaanesh lists the Daemonship price
     includes the Mark ("must take the Mark ..., which is already included",
     pp. 249, 251, 253), so the Daemonship row brings the Mark's rule with it;
     Tzeentch pays for it separately (p. 247). ship: not on a commander card,
     whose row already prints the book's own description. */
  {id:"daemonship", color:"#7B3FB2", fleet:/CHAOS/i, wep:/^$/, up:/^daemonship:/i, ship:true,
   mentions:[/daemon ?ship/i],
   text:"Daemonship: may wait in the Warp and arrive in the End phase of any Chaos turn after the first, within 20 cm of a capital ship and scattered 4D6 cm. It is spectral until it translates on a 2+ in a later End phase: enemies within 15 cm are -1 Ld for Special Orders, it cannot act and cannot be attacked. It may disengage at the end of any Movement phase without a roll and return later, repairing D6: 4-5 = +1 Hp, 6 = +2 Hp (+1 if a battleship, +1 per full turn in the Warp), criticals on 4+. No Warmaster, Lord or Chaos Space Marine crew, no squadrons, no Exterminatus or planetary assault points. (Fleets pp. 237-238)"},
  {id:"mark_slaanesh", color:"#B5236B", fleet:/CHAOS/i, wep:/^$/, up:/^the mark of slaanesh/i, ship:true,
   mentions:[/mark of slaanesh/i],
   text:"Mark of Slaanesh: enemy ships within 15 cm suffer -2 Leadership; an area effect, not blocked by line of sight. (Fleets pp. 242, 252)"},
  {id:"mark_slaanesh", color:"#B5236B", list:/Slaanesh/i, wep:/^$/, up:/^daemonship:/i, ship:true,
   mentions:[/mark of slaanesh/i],
   text:"Mark of Slaanesh (included in the Daemonship): enemy ships within 15 cm suffer -2 Leadership; an area effect, not blocked by line of sight. (Fleets pp. 242, 252-253)"},
  {id:"mark_khorne", color:"#B5236B", fleet:/CHAOS/i, wep:/^$/, up:/^the mark of khorne/i, ship:true,
   mentions:[/mark of khorne/i],
   text:"Mark of Khorne: the ship doubles its value in boarding actions. (Fleets pp. 242, 250)"},
  {id:"mark_khorne", color:"#B5236B", list:/Khorne/i, wep:/^$/, up:/^daemonship:/i, ship:true,
   mentions:[/mark of khorne/i],
   text:"Mark of Khorne (included in the Daemonship): the ship doubles its value in boarding actions. (Fleets pp. 242, 250-251)"},
  {id:"mark_tzeentch", color:"#B5236B", fleet:/CHAOS/i, wep:/^$/, up:/^the mark of tzeentch/i, ship:true,
   mentions:[/mark of tzeentch/i],
   text:"Mark of Tzeentch: the ship gains one re-roll of its own. (Fleets pp. 242, 246)"},
  {id:"mark_nurgle", color:"#B5236B", fleet:/CHAOS/i, wep:/^$/, up:/^the mark of nurgle/i, ship:true,
   mentions:[/mark of nurgle/i],
   text:"Mark of Nurgle: +1 Damage Point (counted in HITS) and the ship may not be boarded; Hit & Run attacks still allowed. (Fleets pp. 232, 240; Rulebook p. 91)"},
  {id:"mark_nurgle", color:"#B5236B", list:/Nurgle/i, wep:/^$/, up:/^daemonship:/i, ship:true,
   mentions:[/mark of nurgle/i],
   text:"Mark of Nurgle (included in the Daemonship): +1 Damage Point (counted in HITS) and the ship may not be boarded; Hit & Run attacks still allowed. (Fleets pp. 232, 240-241; Rulebook p. 91)"},
  {id:"terminator_boarding", color:"#59636F", fleet:/SPACE MARINES|GREY KNIGHTS/i, wep:/^$/,
   up:/terminator boarding|grey knights terminators/i, mentions:[/terminator boarding/i],
   text:"Terminator boarding party: once per turn, in a teleport Hit & Run attack roll two dice and apply both results, +1 as Space Marines; in addition to a normal teleport attack. (Fleets p. 96)"},
  {id:"honour_guard", color:"#59636F", fleet:/SPACE MARINES|GREY KNIGHTS/i, wep:/^$/,
   up:/honour guard/i, mentions:[/honour guard/i],
   text:"Honour Guard: once per turn, in a teleport Hit & Run attack roll two dice and choose which counts, +1 as Space Marines; in addition to a normal teleport attack. (Fleets p. 96)"},
  {id:"fast_clipper", color:"#8A7340", wep:/^$/, opt:/fast clipper/i, mentions:[/fast clipper|advanced drive/i],
   text:"Fast Clipper: the weapons battery is removed; Advanced Drive Technology gives +5 cm Speed (shown above) and +1D6 cm on All Ahead Full. (Fleets pp. 185, 202)"},
  {id:"aspect_host", color:"#1474C4", fleet:/^ELDAR$/i, wep:/^$/, up:/aspect warrior host/i, mentions:[/aspect warrior/i],
   text:"Aspect Warrior Host: +2 in boarding actions, +1 to Hit & Run attacks. Not on a Ghostship. (Fleets pp. 307, 316)"},
  {id:"ghostship", color:"#5A6E8C", fleet:/^ELDAR$/i, wep:/^$/, up:/^ghostship/i, mentions:[/ghostship/i],
   text:"Ghostship: normal Eldar Leadership. If it fails a Command check for Special Orders it may do nothing but move this turn, and no other Ghostship may test that turn (a failed Brace may still Brace, then does nothing but move next turn). Deathless: critical hits only on a 6. Uncrewed: no Aspect Warriors, no launch bays, no boarding or Hit & Run attacks; enemies get +1 boarding and +1 Hit & Run against it; damage control rolls half the dice. (Fleets p. 309)"},
  {id:"klaws", color:"#A97913", fleet:/ORKS/i, wep:/^$/, opt:/\bklaws\b/i, up:/^klaws/i, mentions:[/\bklaws\b/i],
   text:"Klaws: once per turn, when the ship moves into base contact with an enemy ship, roll 2D6; each 4+ is one hit ignoring shields (not holofields). Brace works; unaffected by Special Orders; a crippled capital ship cannot use them. If both hit it latches on: neither ship moves if the target is the same class or smaller (a larger one moves at half rate), both shoot at half effect with no nova cannon or similar weapons, and it attacks again each End phase (both hitting again adds a third hit). Either may board; Klaw damage causes criticals as normal. (Fleets p. 373)"},
  {id:"power_ram", color:"#8A7340", wep:/^$/, up:/power ram/i, mentions:[/power ram/i],
   text:"Power Ram: one automatic hit on a successful ram, before rolling for hits. Not with a Nova Cannon. (Fleets p. 118)"},
  {id:"ork_gunz", color:"#A97913", fleet:/ORKS/i, wep:/\bgunz(?: battery)?\b/i,
   notWep:/heavy gunz/i, mentions:[/\bgunz\b/i],
   text:"Ork Gunz: weapon batteries; roll the printed random Firepower each time they fire. (Fleets p. 362)"},
  {id:"heavy_gunz", color:"#D14900", fleet:/ORKS/i, wep:/heavy gunz/i,
   mentions:[/heavy gunz/i],
   text:"Heavy Gunz: weapon batteries without the range column shift; every hit causes 2 Hits. (Fleets p. 362)"},
  {id:"ork_torpedo", color:"#52606D", fleet:/ORKS/i, wep:/torpedo/i,
   notOpt:/boarding torpedo|torpedo[- ]?bomma/i,
   mentions:[/torpedo(?:es| launcha| launchas)?/i],
   text:"Ork Torpedo Launchas: roll the printed salvo Strength each time they fire; a squadron may not combine salvoes. (Fleets p. 362)"},
  {id:"ork_torpedo_bomma", color:"#B14E25", fleet:/ORKS/i,
   wep:/torpedo[- ]?bomma/i, opt:/torpedo[- ]?bomma/i,
   mentions:[/torpedo[- ]?bomma/i],
   text:"Torpedo-Bommas: 20 cm bombers, no fighter ability. From the turn after launch each marker may become a Strength-2 torpedo salvo; an additional carrier option. (Fleets p. 361)"},
  {id:"ork_fighta_bomma", color:"#70469A", fleet:/ORKS/i, wep:/launch bay/i,
   range:/fighta-bomma/i, mentions:[/fighta-bomma|launch capacit|attack craft/i],
   text:"Fighta-Bommas: 25 cm fighter/bombers; attack a ship with D3 instead of D6, survivors add +1 attack each after turrets; some may forgo attacks to suppress. Fleet launch capacity: each Ordnance phase roll every variable launch bay Strength and add the fixed ones; attack craft above the total are removed at the end of the turn. (Fleets p. 361)"},
  {id:"eldar_pulsar", color:"#1474C4", fleet:/^ELDAR$/i, wep:/pulsar lance/i,
   mentions:[/pulsar lance/i],
   text:"Pulsar Lance: hits as a lance on 4+; after a hit, roll again until it misses or that shot has caused 3 hits. (Fleets p. 306)"},
  {id:"eldar_shadow", color:"#28699B", fleet:/^ELDAR$/i, wep:/shadow lance/i,
   mentions:[/shadow lance/i],
   text:"Shadow Lance: counts as a normal lance; it does not gain the Pulsar's repeat-hit rolls. (Fleets p. 306)"},
  {id:"eldar_battery", color:"#C99500", fleet:/^ELDAR$/i, wep:/weapons battery/i,
   mentions:[/weapons batter/i],
   text:"Eldar Weapons Battery: treat every target as Closing on the Gunnery table. (Fleets p. 306)"},
  {id:"eldar_ordnance", color:"#70469A", fleet:/^ELDAR$/i, wep:/launch bay|torpedo/i,
   mentions:[/ordnance|torpedo|attack craft|launch bay/i],
   text:"Eldar Ordnance: turrets hit it only on 6. Torpedoes re-roll their first failed hit; fighters have a 4+ resilience save and bombers re-roll attacks. (Fleets p. 306)"},
  {id:"dark_battery", color:"#A33B54", fleet:/DARK ELDAR/i, wep:/weapons battery/i,
   mentions:[/weapons batter/i],
   text:"Dark Eldar Weapons Battery: treat every target as Closing on the Gunnery table. (Fleets p. 347)"},
  {id:"phantom_lance", color:"#6C2E91", fleet:/DARK ELDAR|^ELDAR$/i, wep:/phantom lance/i,
   mentions:[/phantom lance/i],
   text:"Phantom Lance: each Strength die scores 0 hits on 1-3, 1 hit on 4, and 2 hits on 5-6. (Fleets p. 347)"},
  {id:"dark_ordnance", color:"#70469A", fleet:/DARK ELDAR/i, wep:/launch bay|torpedo|impaler/i,
   mentions:[/ordnance|torpedo|attack craft|impaler/i],
   text:"Dark Eldar Ordnance: turrets hit it only on 6; Raptor fighters have a 4+ resilience save and Razorwing bombers re-roll attacks. (Fleets p. 347)"},
  {id:"dark_torpedo", color:"#52606D", fleet:/DARK ELDAR/i, wep:/torpedo/i,
   mentions:[/leech torpedo|eldar torpedo/i],
   text:"Dark Eldar Torpedoes: ordinary Eldar torpedoes re-roll their first miss. Leech torpedoes instead cause one automatic critical: Speed -10 cm and no All Ahead Full until every leech is repaired. (Fleets p. 349)"},
  {id:"impaler", color:"#7A5230", fleet:/DARK ELDAR/i, wep:/impaler/i,
   mentions:[/impaler/i],
   text:"Impaler: independent assault module; 4+ save against a fighter, then a special Hit & Run. On 2-6 roll 2D6 on the critical table; a natural 1 loses it for the game. (Fleets p. 348)"},
  {id:"mimic_engine", color:"#00806F", fleet:/DARK ELDAR/i,
   wep:/mimic engine/i, opt:/mimic engine/i, mentions:[/mimic engine/i],
   text:"Mimic Engines: make one normal move after deployment. If then over 30 cm away, the vessel cannot be targeted in turn 1 until it attacks; no effect against Tyranids or Necrons. (Fleets p. 345)"},
  {id:"tau_railgun", color:"#2E6B4A", fleet:/TAU/i, wep:/railgun battery/i,
   mentions:[/railgun batter/i],
   text:"Railgun Battery: functions as a standard weapon battery. (Fleets p. 450)"},
  {id:"tau_ion", color:"#1474C4", fleet:/TAU/i, wep:/ion cannon/i,
   mentions:[/ion cannon/i],
   text:"Ion Cannon: functions as a lance in all respects. (Fleets p. 450)"},
  {id:"tau_missile", color:"#59636F", fleet:/TAU/i, wep:/gravitic launcher/i,
   mentions:[/gravitic launcher|tau missile/i],
   text:"Gravitic Launcher: fires guided Tau missiles; move 20-40 cm, turn 45 degrees before moving, and lose 1 Strength for every 6 rolled after launch. (Fleets pp. 450-451)"},
  {id:"tau_hook", color:"#00806F", fleet:/TAU|NICASSAR/i, wep:/gravitic hook/i,
   mentions:[/gravitic hook/i],
   text:"Gravitic Hook: its capacity limits the listed transported escorts; they deploy separately and cannot dock during play. (Fleets p. 450)"},
  {id:"tau_manta", color:"#70469A", fleet:/TAU/i, wep:/launch bay/i, range:/manta/i,
   mentions:[/manta|attack craft|launch bay/i],
   text:"Tau Launch Bay: Barracuda fighters move 25 cm; Manta bombers move 20 cm and have one 4+ resilience save against fighters each Ordnance phase. (Fleets p. 451)"},
  {id:"lightning_arc", color:"#A96B00", fleet:/NECRON/i, wep:/lightning arc/i,
   mentions:[/lightning arc/i],
   text:"Lightning Arc: weapon battery; all targets count as Closing, holofields cause no right shift, and Firepower may be divided among its fire arcs. (Fleets p. 402)"},
  {id:"particle_whip", color:"#1769B0", fleet:/NECRON/i, wep:/particle whip/i,
   mentions:[/particle whip/i],
   text:"Gauss Particle Whip: fires as a lance; a natural 6 to hit ignores shields, holofields and similar saves. (Fleets p. 402)"},
  {id:"star_pulse", color:"#C12F70", fleet:/NECRON/i, wep:/star pulse/i,
   mentions:[/star pulse/i],
   text:"Star Pulse Generator: one attack against every non-Necron target within 20 cm; ordnance is hit on 4+. No use while Crippled or on any Special Order. (Fleets p. 402)"},
  {id:"portal", color:"#6542B5", fleet:/NECRON/i, wep:/\bportal\b/i,
   mentions:[/\bportal/i],
   text:"Portal: grants the printed number of 10 cm Hit & Run attacks. It works on Special Orders; halve it while Crippled or Braced. (Fleets p. 403)"},
  {id:"bio_plasma", color:"#1474C4", fleet:/TYRANID/i, wep:/bio-plasma/i,
   mentions:[/bio-plasma/i],
   text:"Bio-plasma: hits like a lance on 4+, ignores shields, turrets cannot shoot it down; holofields and reactive saves still work. (Fleets p. 421)"},
  {id:"feeder", color:"#8A469F", fleet:/TYRANID/i, wep:/feeder tentacle/i,
   mentions:[/feeder tentacle/i],
   text:"Feeder Tentacles: once per turn on contact roll D6; 1-3 = that many Hit & Run attacks, 4-6 = 1 Hit plus one Hit & Run. No attack while Crippled. (Fleets p. 421)"},
  {id:"claws", color:"#C33C3C", fleet:/TYRANID/i, wep:/massive claws/i,
   mentions:[/massive claws/i],
   text:"Massive Claws: on contact roll 2D6 per pair, each 4+ = 1 Hit ignoring shields (not holofields); one target per turn. Two hits grapple it: neither ship moves (a larger class at half rate), no disengaging, both shoot at half effect, boarding as normal; every End phase attack again, and two hits on a grappled target cause a third additional hit. Not against a ship that made contact in the enemy turn; no attack while Crippled. (Fleets p. 422)"},
  {id:"pyro_acid", color:"#B77800", fleet:/TYRANID/i, wep:/pyro-acid/i,
   mentions:[/pyro-acid/i],
   text:"Pyro-acid Battery: a weapon battery; each critical hit also causes a Fire critical. (Fleets p. 422)"},
  {id:"tyranid_ordnance", color:"#70469A", fleet:/TYRANID/i, wep:/launch bay/i,
   mentions:[/launch bay|attack craft|ordnance/i],
   text:"Tyranid Launch Bay: fighters (20 cm) and assault boats (15 cm) only; the fleet may have twice its launch-bay capacity in attack craft. A Crippled bio-ship cannot launch. (Fleets p. 424)"},
  {id:"fire_ship", color:"#C43D4D", fleet:/TYRANID/i,
   wep:/fire\s*ship/i, opt:/fire\s*ship/i, mentions:[/fire\s*ship/i],
   text:"Fire Ship: detonate at any point in its move; every ship within 3D6 cm suffers D3 Fire criticals, escorts and ordnance in the blast are destroyed, then replace it with a Blast Marker. (Fleets p. 516)"},
  {id:"cutting_beam", color:"#007C91", fleet:/DEMIURG/i, wep:/cutting beam/i,
   mentions:[/cutting beam/i],
   text:"Cutting Beam: lance Strength starts at 1 and gains +1 per Blast Marker collected that turn (max 8); at 30 cm halve Strength, rounding down. (Fleets p. 484)"},
  {id:"demiurg_bay", color:"#70469A", fleet:/DEMIURG/i, wep:/launch bay/i, range:/torpedo/i,
   mentions:[/launch bay|attack craft|torpedo/i],
   selfText:/may launch either attack craft or torpedoes/i,
   text:"Demiurg Launch Bay: if its profile lists torpedoes, launch either attack craft or torpedoes in a turn, never both. (Fleets p. 484)"},
  {id:"disruptor", color:"#28699B", wep:/disruptor cannon/i,
   mentions:[/disruptor cannon/i],
   selfText:/functions as a standard lance in all respects/i,
   text:"Disruptor Cannon: functions as a standard lance in all respects. (Fleets p. 196)"},
  {id:"whisperlance", color:"#28699B", wep:/whisperlance/i,
   mentions:[/whisperlance/i],
   selfText:/behaves as a lance battery in all respects/i,
   text:"Whisperlance Cannon: functions as a standard lance in all respects. (Fleets p. 198)"},
  {id:"ghost_light", color:"#A33B54", wep:/ghost-light/i,
   mentions:[/ghost-light/i],
   text:"Ghost-Light weapons: act as the indicated battery or lance but never roll for or inflict critical damage. (Fleets p. 206)"},
  {id:"hives_nurgle", color:"#5D722D", wep:/hives of nurgle/i,
   mentions:[/hives of nurgle/i],
   text:"Hives of Nurgle: function as weapons batteries; after each move place one Blast Marker anywhere along the ship's course. (Fleets p. 265)"},
  {id:"warp_cannon", color:"#7A3F98", wep:/warp cannon/i,
   mentions:[/warp cannon/i],
   text:"Warp Cannons: hit on 4+ like lances and ignore shields, holofields and similar saves; Brace saves still apply. (Fleets p. 286)"},
  {id:"armageddon", color:"#BD2C2C", wep:/armageddon gun/i,
   mentions:[/armageddon gun/i],
   text:"Armageddon Gun: move the Nova template 90 cm straight ahead; centre causes D6 hits (friend or foe), other contact 1, touched ordnance is destroyed. Line of sight only: an obstacle stops it and takes D6 Blast Markers. Reload Ordnance before firing again - a double 6 is a critical hit and the gun is lost for the battle, any other double lets it fire once more. No use while Crippled, Braced, on AAF or Burn Retros. (Fleets p. 255)"},
  {id:"armageddon_overcharge", color:"#BD2C2C", wep:/armageddon gun/i,
   mentions:[/overcharge/i],
   text:"Armageddon Overcharge: declare a charge over three consecutive turns - no turning, shooting or Special Orders, +2 shields, cannot be stopped. After the third turn's move fire 60 cm ahead: every ship touched is destroyed, no saves; the first planet or moon under the centre is removed on 2+ in D3 turns and becomes a 2D6 x 2D6 asteroid field. Then Reload Ordnance for two turns with no shooting. (Fleets p. 255)"},
];


/* Fleets p. 39, shared by the Bastion reserve fleet and the Ordo Malleus
   reserves of p. 152, which only change when it starts to apply. */
export const STRANGE_HAPPENINGS = "a double on a command check makes the ship unreliable for the rest of the game: once crippled it must try to disengage every turn, and runs for the nearest table edge if it fails. If the double also failed the check, it does nothing this turn but make its minimum move straight ahead. Against Chaos: a second double means it must try to disengage at once, as if crippled, for the rest of the game; if that second double also failed the check, the ship defects to the Chaos player and scores victory points for neither side.";

/* Fleet-wide rules that affect every card of the hull in question but sit
   outside the profile pages in the book. */
export const SPECIAL_HULL_RULES = [
  /* Fleets p.155: every Grey Knights capital ship. Escorts of the list are
     Navy hulls "otherwise unmodified", so the ward is a capital-ship rule. */
  {id:"gk_wards", fleet:/GREY KNIGHTS/i, when:function(sh){ return !/escort/i.test(String(sh.ty || "")); },
   text:"Hexagrammic wards: ignores Chaos Marks and Daemonship effects on Leadership and boarding (a Mark of Slaanesh does not touch its Leadership, a Mark of Khorne does not double boarding against it). Chaos Space Marine rules still apply. (Fleets p. 155)"},
  /* The Fortress-Monastery has "a base leadership of 10" (Fleets p. 111):
     its own rule below replaces the Astartes Leadership table. */
  {id:"astartes_core", fleet:/SPACE MARINES|GREY KNIGHTS/i, entry:/rapid strike vessel/i, notList:/Mechanicus/i,
   when:function(sh){ return !/FORTRESS-MONASTERY/i.test(String(sh.nm || "")); },
   text:"Astartes crew: Leadership 8-10; +2 in boarding and +1 to Hit & Run. Enemy Hit & Run rolls suffer -1. (Fleets p. 94)"},
  {id:"eldar_move", fleet:/^ELDAR$/i, notDefence:true,
   text:"Eldar movement: turn to any facing, then use the sunward value of the three-part Speed; move again in your Ordnance phase. No AAF, Burn Retros, CTNH or ramming. Boarding: in either move, but not after shooting or launching ordnance; boarding in the Movement phase gives up the second move. (Fleets pp. 304-307)"},
  {id:"eldar_holo", fleet:/^ELDAR$/i,
   text:"Holofields: one right column shift against Gunnery; against other attacks save each hit on 2+, placing a Blast Marker for each save. (Fleets pp. 305-306)"},
  {id:"dark_move", fleet:/DARK ELDAR/i,
   text:"Dark Eldar movement: CTNH succeeds automatically; no minimum move, escorts included; cannot use Burn Retros. (Fleets p. 342; FAQ 2026)"},
  {id:"dark_shadow", fleet:/DARK ELDAR/i,
   text:"Shadowfields: one right column shift against Gunnery; against other attacks save each hit on 2+, placing a Blast Marker for each save. (Fleets pp. 344-345)"},
  {id:"dark_boarding", fleet:/DARK ELDAR/i,
   text:"Dark Eldar: boarding +1 in round one and -1 thereafter; Hit & Run +1 except Impalers. A Hit & Run may instead take slaves for Victory Points. (Fleets pp. 344-345)"},
  /* Space hulk rule pages - they follow the profile page, which the
     extractor reads alone. Chaos p.289-290, Ork p.392-393. */
  {id:"hulk_move", fleet:/SPACE HULK|ORK HULK/i,
   text:"Hulk movement: exactly 10 cm straight ahead each turn, never slowed by Blast Markers or damage; a 45\u00b0 turn only in every second Movement phase, at the end of the move; no CTNH or Burn Retros. (Fleets pp. 289/392)"},
  {id:"hulk_gravity", fleet:/SPACE HULK|ORK HULK/i,
   text:"Hulk gravity well: 5 cm from the base edge, like a planet's; ships may orbit and move with it, and a ship breaking orbit decides so before the hulk moves. In a planet's or moon's well the hulk may turn 45\u00b0 towards it at the end of its move, even if it turned last phase. (Fleets pp. 289/392)"},
  {id:"hulk_upgrades", fleet:/SPACE HULK|ORK HULK/i,
   text:"Hulk upgrades: none that improve Boarding Value, Turning or Speed. (Fleets pp. 290/392)"},
  {id:"chaos_hulk_ld", fleet:/CHAOS SPACE HULK/i,
   text:"Chaos Space Hulk: -1 Ld applied after all other modifiers, including the Warmaster and Chaos Space Marines. May launch up to twice as many attack craft as its remaining launch bays. (Fleets p. 289)"},
  /* Fleets p. 251: "Bezerker Fleets led by a Space Hulk may have more than
     two battleships, but other restrictions remain unchanged." */
  {id:"chaos_hulk_using_khorne", fleet:/CHAOS SPACE HULK/i, list:/Khorne/i,
   text:"Using the hulk: 0-1 per fleet and it must be the flagship. Not with the Planet Killer, an Activated Blackstone Fortress or another mandatory flagship. Takes no Chaos Mark; counts as a battleship for taking another. A Bezerker Fleet led by it may have more than two battleships. (Fleets pp. 251, 290)"},
  {id:"chaos_hulk_using", fleet:/CHAOS SPACE HULK/i, notList:/Khorne/i,
   text:"Using the hulk: 0-1 per fleet and it must be the flagship. Not with the Planet Killer, an Activated Blackstone Fortress or another mandatory flagship. Takes no Chaos Mark; counts as a battleship for taking another, at most two other battleships. (Fleets p. 290)"},
  /* The hulk's own rule (p.392) replaces the Ork general text (p.360) where
     they conflict - Leadership and the All Ahead Full move - and keeps what
     still applies: no Command check for AAF, +1 in boarding actions. */
  {id:"ork_hulk_ld", fleet:/ORK HULK/i,
   text:"Ork Hulk: always Leadership 6 (not the Ork -1). All Ahead Full needs no Command check but gives no extra move; as a Defence it rams on 3D6 Ld (2D6 against another defence). +1 in boarding actions. (Fleets pp. 360, 392)"},
  {id:"ork_hulk_warlord", fleet:/ORK HULK/i,
   text:"Warlord aboard: does not double Boarding Value. Looted Torpedoes and Maniac Gunners affect one weapon system per turn; Extra Powerfields cost +50; Mad Meks ignore a critical on a 6; Mega-armoured Boarding Parties unchanged. (Fleets p. 392)"},
  /* Roks, Kroot Warspheres and Stryxis Caravan Vessels (Fleets pp. 395,
     495, 197): the Rok's own All Ahead Full replaces the Ork one ("any rules
     which are not specifically noted as being modified below, apply in full
     to Roks"). */
  {id:"rock_move", when:function(sh){ return isRockVessel(sh) && !sh.df; },
   text:"Movement: exactly 10 cm straight ahead in each Movement phase; no turns, Burn Retros or Come to New Heading. All Ahead Full: an extra 2D6 cm in any direction at the end of the move, and 10 cm or more to a side becomes the new direction of travel. Crippling and Blast Markers do not reduce its speed; in a gravity well it may make a free 45 degree turn and/or take a stationary or low orbit. (Fleets pp. 395, 495, 207)"},
  {id:"rok_orks", when:function(sh){ return /^\s*ROK\s*$/i.test(String(sh.nm || "")) && !sh.df; },
   text:"Orks: Leadership is reduced by 1; All Ahead Full needs no Command check; +1 in boarding actions. (Fleets p. 360)"},
  /* Ruling T57: only on a Rok that has bought a speed upgrade, so the card
     says why its speed did not change (see fixedSpeed). */
  {id:"rok_fixed_speed", when:function(sh){ return /^\s*ROK\s*$/i.test(String(sh.nm || "")) && !sh.df; },
   whenSel:function(sel){ return statMod(sel, "sp") > 0; },
   text:"Speed upgrades: the Rok still moves exactly 10 cm - the +5 cm of Evil Sunz or Soopa Boostas does not change it. (Fleets pp. 371-372, 395; ruling T57, read as written)"},
  /* Fleets p. 362, ORK PLANETARY DEFENCES: bought with the defence points,
     a Rok "cannot move and count[s] as stationary in all effects ...
     including all rules concerning removal of blast markers from planetary
     defences", "automatically pass[es] all leadership checks" and takes only
     Reload Ordnance and Brace For Impact, "for which they are Leadership 7".
     Its own Ld wording replaces the p. 499 "any other check on Ld 7". The
     Ork +1 in boarding (p. 360) is a crew rule p. 362 does not take away. */
  {id:"rok_defence", slot:"orders", when:function(sh){ return /^\s*ROK\s*$/i.test(String(sh.nm || "")) && !!sh.df; },
   text:"Rok as a planetary defence: cannot move and counts as stationary in all effects - End Phase: remove D6 Blast Markers from it. Automatically passes every Leadership check; special orders only Reload Ordnance and Brace for Impact, both on Ld 7. After setting up each Rok roll 2D6: on a 12 it falls 2D6 cm toward the celestial phenomenon it orbits, and is destroyed if that brings it into contact with an asteroid field or the planet edge. +1 in boarding actions. (Fleets pp. 360, 362)"},
  {id:"warsphere_boarding", when:function(sh){ return /WARSPHERE/i.test(String(sh.nm || "")); },
   text:"Warsphere boarding: its boarding strength equals double its remaining hit points. (Fleets p. 495)"},
  {id:"stryxis_caravan", when:function(sh){ return /STRYXIS CARAVAN/i.test(String(sh.nm || "")); },
   text:"Stryxis caravan: the vessels stay grouped in a straight line no more than 10 cm apart and separate only once one of them is destroyed. All Ahead Full is free; no fleet re-rolls. (Fleets p. 207)"},
  {id:"ork_core", fleet:/ORKS/i, when:function(sh){ return !isOrkHulk(sh) && !isRockVessel(sh); },
   text:"Orks: Leadership is reduced by 1; All Ahead Full needs no Command check and adds 2D6 cm; +1 in boarding actions. (Fleets p. 360)"},
  /* Fleets p. 232: "Chaos has a +1 boarding modifier. The Chaos Space Marine
     upgrade replaces this, providing them with a total +2 boarding modifier."
     The list decides, not the profile: a Chaos fleet crews its renegade
     Imperial hulls too. p. 286: the Activated Blackstone Fortress "has no
     crew". */
  /* Rules of the section a hull was bought from (fleetMatches' sec gate).
     The build-time restrictions of p. 232 - no Nova Cannon, special weapon
     rules, Chaos Lords, crews, Chaos ordnance or Daemonship upgrades - are
     already enforced by the catalogue (the rows offer none of them), so the
     card carries what matters at the table. */
  {id:"renegade_cruiser", list:/^Chaos\b/, sec:/^RENEGADE IMPERIAL VESSELS$/i,
   when:function(sh){ return !/escort/i.test(String(sh.ty || "")); },
   text:"Renegade Imperial vessel: -1 Ld for going renegade; +1 in boarding actions as a Chaos vessel. Not a reserve - it counts as a Chaos vessel in all respects. (Fleets p. 232)"},
  {id:"renegade_escort", list:/^Chaos\b/, sec:/^RENEGADE IMPERIAL VESSELS$/i,
   when:function(sh){ return /escort/i.test(String(sh.ty || "")); },
   text:"Renegade Imperial escort: may be squadroned with other Chaos escorts; +1 in boarding actions as a Chaos vessel. Not a reserve - it counts as a Chaos vessel in all respects. (Fleets p. 232)"},
  /* p. 39 offers these Chaos hulls "since a reserve fleet also draws on very
     old or scarce vessels", and Strange happenings opens "In a reserve fleet,
     all vessels are prone to certain unexpected events". The card keeps the
     book's own condition in its first words rather than asserting more. */
  {id:"obscura_reserve", list:/Bastion/i, sec:/^THE RESERVE FLEETS OF SEGMENTUM OBSCURUS$/i,
   text:"Reserve fleet vessel: keeps its Chaos ordnance; no ship class variants. (Fleets p. 39)"},
  {id:"strange_happenings", list:/Bastion/i, sec:/^THE RESERVE FLEETS OF SEGMENTUM OBSCURUS$/i,
   /* Owner's decision 30 Sept 2026 (J153, narrows J143): "reserve fleet" is
      read as the ships taken as reserves - a subset of the fleet - so the row
      goes only on the card of a Chaos hull taken from the reserve section.
      The book's sentence "In a reserve fleet, all vessels are prone..."
      (p. 39) can be read more widely; p. 152 speaks of the rule as a property
      of these hulls ("These vessels are free of..."). The whole rule is on
      the card (space is not tight when the row is only on these cards), and
      p. 152's exemption is mentioned: in a fleet led by an Ordo Malleus
      Inquisitor the rule does not apply while his ship is in play. */
   text:"Strange happenings (reserve vessel): " + STRANGE_HAPPENINGS + " If an Ordo Malleus Inquisitor leads the fleet, this does not apply while the Inquisitor's ship remains in play. (Fleets pp. 39, 152)"},
  /* J144, Fleets p. 152: a fleet led by an Ordo Malleus Inquisitor "may take as
     reserves any Chaos ship listed in the Bastion Fleet List. These vessels are
     free of the Strange Happenings special rule as long as the Inquisitor's
     ship remains in play" - so the card carries the rule and when it starts.
     Chaos ordnance and no variants follow p. 39, whose reserve hulls these are. */
  {id:"malleus_reserve", sec:/^ORDO MALLEUS RESERVES$/i,
   text:"Ordo Malleus reserve: Chaos ordnance, no ship class variants. Strange happenings applies only once the Inquisitor's ship is out of play: " + STRANGE_HAPPENINGS + " (Fleets pp. 39, 152)"},
  /* Fleets p. 188: "All pirate vessels suffer a -1 leadership modifier,
     meaning their unmodified starting leadership will be from 5 to 8."
     Printed on the card like the Ork -1 and the Eldar +1. Not for the
     xenos: p. 189 has them "use the unmodified leadership from the fleet
     lists of their respective races", and p. 207 has Stryxis Caravan
     Vessels "rolling for leadership normally", as does p. 204 for Fra'al
     battleships ("rolling for leadership normally and counting as
     cruisers"). The Rogue Trader Xenos Vessel (p. 194) is read as xenos
     too - the line is left off rather than asserted (spot check
     2026-10-18/1, Fra'al found on its third round). */
  {id:"pirate_ld", list:/Pirates and Wolf Packs/i, notSec:/^STRYXIS/i,
   when:function(sh){ return !/XENOS VESSEL|STRYXIS|FRA.AL/i.test(String(sh.nm || "")); },
   text:"Pirate vessel: -1 Leadership, for an unmodified starting Leadership of 5-8. (Fleets p. 188)"},
  /* p. 232 refuses Chaos Space Marines to a renegade Imperial hull, so the
     crew clause would be a rule that ship cannot use: the renegade lines
     above carry the +1 on their own (spot check 2026-10-18/1). */
  {id:"chaos_core", list:/^Chaos\b/, notSec:/^RENEGADE IMPERIAL VESSELS$/i,
   when:function(sh){ return !/BLACKSTONE/i.test(String(sh.nm || "")); },
   text:"Chaos: +1 in boarding actions; a Chaos Space Marine crew makes it +2 in total. (Fleets p. 232)"},
  /* Fleets p. 486: "Vessels allied with the Demiurg rely on the basic leadership
     applicable to their fleets. They cannot use Demiurg fleet re-rolls, but if
     available they may purchase special characters with any re-rolls they come
     with." The fleet re-roll already says "Demiurg vessels only" (frr scope),
     but only as a tooltip; the ally's card says it where it is played
     (spot check 2026-10-18/1, round 9). Planetary defences are bought beside the
     list and are not its vessels (fleetMatches df gate). */
  {id:"demiurg_ally", list:/^Demiurg\b/, when:function(sh){ return !/DEMIURG/i.test(String(sh.fl || "")); },
   text:"Allied with the Demiurg: uses its own fleet's basic Leadership and cannot use Demiurg fleet re-rolls. (Fleets p. 486)"},
  /* Fleets p. 121, a Mechanicus fleet's reserves and allies: "Mechanicus
     vessels cannot be placed in squadrons with Rogue Trader, regular Imperial
     Navy or Adeptus Astartes vessels. Mechanicus re-rolls cannot be used on
     these vessels, and other fleet commander re-rolls cannot be used on
     Mechanicus vessels." Printed on the borrowed ship's card, where the
     re-roll is spent; the Explorator list's own Imperial hulls are
     Mechanicus vessels and are not borrowed (spot check 2026-10-18/1). */
  {id:"mechanicus_guest", inFleet:/Mechanicus/i,
   when:function(sh){ return /IMPERIAL NAVY|ROGUE TRADER|SPACE MARINE/i.test(String(sh.fl || "")); },
   text:"In a Mechanicus fleet: Mechanicus re-rolls cannot be used on this ship, nor this fleet's other commander re-rolls on Mechanicus vessels; it may not squadron with Mechanicus vessels. (Fleets p. 121)"},
  {id:"necron_hull", fleet:/NECRON/i,
   text:"Reactive Hull: printed save replaces Brace; Brace improves it to 2+ but Armour becomes 4+. No save against boarding damage, critical damage from unsaved hits, or Hit & Run attacks unless braced; Warp cannons ignore it unless braced. Immune to damage, Leadership and movement modifiers from flares, radiation, gas and Blast Markers. (Fleets p. 404)"},
  {id:"necron_drive", fleet:/NECRON/i,
   text:"Inertialess Drive: AAF adds D6 x 10 cm and permits one turn per 20 cm travelled. A Necron may fade out automatically at the end of its Movement phase. (Fleets p. 404)"},
  {id:"tyranid_control", fleet:/TYRANID/i, notList:/Vanguard/i,
   text:"Synaptic control: a Hive Ship may test to override Instinctive Behaviour within 45 cm; otherwise follow the Instinctive Orders flowchart. Navigation uses Ld 10. (Fleets pp. 418-420)"},
  /* Fleets p. 429: the Vanguard list has no hive ships; its escort squadrons
     lead themselves. */
  {id:"vanguard_control", fleet:/TYRANID/i, list:/Vanguard/i,
   text:"Vanguard squadron: Leadership equals the vessels remaining in the squadron, up to 10. At the start of each turn the squadron may test with its own Leadership to override Instinctive Behaviour; if it fails it acts on instinct. Brace for Impact against Ld 7 when no hive ship is within 45 cm. (Fleets pp. 418, 429)"},
  {id:"tyranid_target", fleet:/TYRANID/i,
   text:"Target the nearest enemy; Vanguard Drones highlight all targets within 15 cm. Boarding value doubled, 2D6 take the higher. Hit & Run vs Tyranids: 2D6, take the lowest (escort dies on 4+); own +1. (Fleets p. 420)"},
  {id:"tyranid_spores", fleet:/TYRANID/i, when:hasSpores,
   text:"Spores: each cyst is one replenishing shield and one turret. Blast Markers degrade their ordnance roll to 6+; spores may fire at torpedoes and attack craft in the same phase. (Fleets pp. 423-423)"},
  {id:"tau_core", fleet:/TAU/i,
   text:"Tau ships cannot make teleport attacks. Kor'vattra vessels and Tau defences halve boarding value; Kor'or'vesh capital ships use normal boarding value. (Fleets p. 450)"},
  /* Fleets pp. 450-451: "Deflectors are NOT shields and do not count as such
     for the purpose of boarding, blast markers or other effects which apply
     to shields." The profile's own line gives the 6+ prow. */
  {id:"tau_deflector", when:function(sh){ return /deflector/i.test(String(sh.sr || "")); },
   text:"Deflector: not a shield - it does not count as one for boarding, Blast Markers or other effects which apply to shields. (Fleets pp. 450-451)"},
  /* Fleets p. 327: the Flame "embarks the most fearsome members of Yriel's own
     pirate warband, which count as an Aspect Warrior fighting crew"; p. 307
     gives the bonus. */
  {id:"flame_aspect", when:function(sh){ return /FLAME OF ASURYAN/i.test(String(sh.nm || "")); },
   text:"Aspect Warrior fighting crew (included): +2 in boarding actions, +1 to Hit & Run attacks. (Fleets pp. 307, 327)"},
  /* Fleets p. 118: "the attacker may re-roll the dice if desired during
     boarding actions as well as Hit and Run attacks against Mechanicus
     vessels, but the second roll stands." p. 121: the list's escorts "count
     as Mechanicus vessels". */
  {id:"mechanicus_crew", list:/Mechanicus/i, native:true,
   text:"Mechanicus crews: attackers may re-roll their dice in boarding actions and Hit & Run attacks against this ship, but the second roll stands. (Fleets p. 118)"},
  {id:"demiurg_core", fleet:/DEMIURG/i,
   text:"Demiurg: remove every Blast Marker moved over; it causes no movement or transit penalty. Ignore solar flares, gas/dust clouds and radiation. (Fleets p. 483)"},
  /* Fleets p. 483: hired Demiurg leave when crippled - unless the list is
     their own war host, whose Determination rule (p. 486) replaces it. */
  {id:"demiurg_mercenary", fleet:/DEMIURG/i, notList:/Demiurg/i,
   text:"Mercenary Demiurg: a crippled ship tries to disengage every turn and otherwise runs for the nearest table edge; against Orks only at 1-2 Hp. (Fleets p. 483)"},
  {id:"demiurg_determination", fleet:/DEMIURG/i, list:/Demiurg/i,
   text:"Determination: in a Demiurg war host the ship does not attempt to disengage until it has 2 Hp or fewer. Victory Points: Stronghold 400, Bastion 300, Citadel 200. (Fleets p. 486)"},
  /* Fleets p. 304 / p. 344: the fleet-wide Leadership bonus. */
  {id:"eldar_ld", fleet:/^ELDAR$/i,
   text:"Eldar Leadership: add +1 to the rolled Leadership, for a value of 7-10. A Leadership check ignores gas clouds and solar flares (passing in a flare: no damage, turn away from the sun edge and move 2D6 cm); escorts re-roll it for free. Warp rift test on 2D6; asteroids, planets and radiation bursts as for any fleet. (Fleets pp. 302-303; FAQ 2026)"},
  {id:"dark_ld", fleet:/DARK ELDAR/i,
   text:"Dark Eldar Leadership: add +1 to the rolled Leadership, for 7-10. A Leadership check ignores celestial phenomena (not radiation bursts or explosions); escorts re-roll it for free. (Fleets p. 344)"},
  /* Fleets p. 451: a profile that says it carries a tracking system. */
  {id:"tau_tracking", when:function(sh){ return /tracking system/i.test(String(sh.sr || "")); },
   text:"Tracking System: Tau vessels within 10 cm (this one included) re-roll turret misses and ignore the column shift for firing batteries at more than 30 cm; it works on any Special Order, Brace For Impact included. (Fleets p. 451)"},
  /* Fleets p. 492: the Caravan is one vessel with its own damage model. */
  {id:"caravan", when:isCaravan,
   text:"Nicassar Caravan: Rig and Dhows fight as one vessel that never separates. It can be crippled but takes no critical damage - a critical is 1 extra Hp of damage instead. At 0 Hp it and its Dhows are destroyed; replace it with four Blast Markers. (Fleets p. 492)"},
  /* Fleets p. 99: "A fortress-monastery is equipped with Terminator boarding
     parties and an Honour Guard as part of its point cost"; p. 96 defines both. */
  {id:"fortress_monastery", when:function(sh){ return /FORTRESS-MONASTERY/i.test(String(sh.nm || "")); },
   text:"Fortress-Monastery (Ramilies rules, p. 500, except as below): base Leadership of 10. Special orders only Reload Ordnance, Lock On and Brace for Impact; re-rolls bought for it serve only the fortress. Only a Space Hulk may board it, and it has +2 for being Space Marines; enemy Hit & Run rolls suffer -1. Each uncrippled quadrant makes one teleport Hit & Run attack (+1); Thunderhawks are not doubled at the launch limit. (Fleets p. 111)"},
  {id:"fortress_monastery_crew", when:function(sh){ return /FORTRESS-MONASTERY/i.test(String(sh.nm || "")); },
   text:"Terminator boarding parties and an Honour Guard are included in the points cost. Once per turn each may be used in addition to a normal teleport attack: Terminators roll two dice for the Hit & Run teleport attack and apply both, the Honour Guard rolls two dice and chooses one, both with the Space Marine +1. (Fleets pp. 96, 99)"},
  /* Fleets p. 126: gifts included in the price, defined on p. 119. */
  {id:"omnissiah_gifts", when:function(sh){ return /OMNISSIAH/i.test(String(sh.nm || "")); },
   text:"Repulsor Shielding: ignore Blast Marker and gas cloud effects on Ld, movement and repairs (until Shields Collapsed). Augmented Weapon Relays: batteries one column left; lance hits double on a 6. (Fleets p. 119)"},
  /* Fleets p. 262: the Wage of Sin "always counts as being crewed by Emperor's
     Children Chaos Space Marines (included it its cost)" and bears the Mark of
     Slaanesh "as part of its point cost"; pp. 234 and 252 give the effects. */
  {id:"wage_of_sin_crew", when:function(sh){ return /^WAGE OF SIN/i.test(String(sh.nm || "")); },
   text:"Chaos Space Marine crew (Emperor's Children, included in the cost): Leadership +1, maximum 10. +2 in boarding actions; enemy Hit & Run rolls -1; own Hit & Run by boarding torpedoes, Dreadclaws, Thunderhawks or teleport +1. 2 Assault Points per turn in a Planetary Assault. (Fleets pp. 234, 262)"},
  {id:"wage_of_sin_mark", when:function(sh){ return /^WAGE OF SIN/i.test(String(sh.nm || "")); },
   text:"Mark of Slaanesh (included in the cost): enemy ships within 15 cm suffer -2 Leadership; an area effect, not blocked by line of sight. (Fleets pp. 252, 262)"},
  /* Fleets pp. 260, 264, 266: the Mark (and on the Slaverer a World Eaters
     crew) is part of the point cost; pp. 234 and 246-250 give the effects.
     Fleets p. 383: Zukov's Klaw carries Klaws as part of its cost (p. 373). */
  {id:"slaverer_crew", when:function(sh){ return /^SLAVERER/i.test(String(sh.nm || "")); },
   text:"Chaos Space Marine crew (World Eaters, included in the cost): Leadership +1, maximum 10. +2 in boarding actions; enemy Hit & Run rolls -1; own Hit & Run by boarding torpedoes, Dreadclaws, Thunderhawks or teleport +1. 2 Assault Points per turn in a Planetary Assault. (Fleets pp. 234, 266)"},
  {id:"slaverer_mark", when:function(sh){ return /^SLAVERER/i.test(String(sh.nm || "")); },
   text:"Mark of Khorne (included in the cost): the ship doubles its value in boarding actions. (Fleets pp. 250, 266)"},
  {id:"scion_mark", when:function(sh){ return /^SCION OF PROSPERO/i.test(String(sh.nm || "")); },
   text:"Mark of Tzeentch (included in the cost): the ship gains one re-roll of its own. (Fleets pp. 246, 260)"},
  {id:"terminus_mark", when:function(sh){ return /^TERMINUS EST/i.test(String(sh.nm || "")); },
   text:"Mark of Nurgle (included in the cost; the extra Hit is in the profile): the ship may not be boarded; Hit & Run attacks still allowed. (Fleets pp. 240, 262; Rulebook p. 91)"},
  /* ---- Planetary defences (Fleets pp. 498-499, Rulebook pp. 100-101) ----
     None of the profile pages 506-517 prints a SPECIAL box of its own
     (p. 516 excepted): the rules are in the chapter's opening pages and in
     the Rulebook, so the card would print a station with no rules at all. */
  /* Fleets p. 499 / Rulebook p. 100: "do not roll for leadership or have a
     leadership value ... reload ordnance (where applicable) on a nominal
     leadership of 7 ... cannot take on any special orders except Reload
     Ordnance, though they may also attempt to Brace For Impact against this
     same leadership. They also make all other leadership checks they may
     have to make against Ld 7". Book contradiction, recorded: the left
     column of p. 499 ends a paragraph with "However, they automatically pass
     any other leadership tests they may be required to make" - an orphan of
     the older rule; the box on the same page and the Rulebook both say Ld 7. */
  {id:"pd_orders", slot:"orders", when:function(sh){ return !!sh.df && sh.dld === 7 && hasOrdnance(sh) && !isRockVessel(sh); },
   text:"Planetary defence: no Leadership value and no Leadership roll. Special orders: only Reload Ordnance and Brace for Impact, both on Ld 7; any other Leadership check is also made on Ld 7. (Fleets p. 499; Rulebook p. 100)"},
  /* "they reload ordnance (where applicable)": a defence with no torpedoes
     and no launch bays is left with Brace for Impact alone. */
  {id:"pd_orders_brace", slot:"orders", when:function(sh){ return !!sh.df && sh.dld === 7 && !hasOrdnance(sh) && !isRockVessel(sh); },
   text:"Planetary defence: no Leadership value and no Leadership roll. Special orders: only Brace for Impact, on Ld 7 - it has no ordnance to reload; any other Leadership check is also made on Ld 7. (Fleets p. 499; Rulebook p. 100)"},
  /* Rulebook p. 101: "defences never drift, they always remain in place"
     and "You remove D6 Blast Markers from each defence with a speed of 0 cm
     in each End Phase after all other actions in the End Phase. This only
     applies to stationary defences, not planetary defences that behave as
     ships (such as monitors or system ships)." p. 100: satellites "fire all
     round". The quadrant forts have their own blast rule (Fleets p. 502). */
  {id:"pd_station", slot:"blast", when:function(sh){ return !!sh.df && !sh.qd && isStationaryDefence(sh) && (sh.hp | 0) > 1 && !isHaven(sh) && !isRockVessel(sh); },
   text:"Stationary defence: cannot move and never drifts. It takes damage, critical hits and crippling like a capital ship and rolls on the Catastrophic Damage table at 0 Hits. End Phase: remove D6 Blast Markers from it after everything else. (Rulebook p. 101)"},
  {id:"pd_platform", slot:"blast", when:function(sh){ return !!sh.df && !!sh.sq && !/ground/i.test(String(sh.ty || "")); },
   text:"Stationary defence: cannot move; its weapons fire all round. End Phase: remove D6 Blast Markers from it after everything else. (Rulebook pp. 100-101)"},
  /* Fleets p. 498: "Low orbit defences may only be deployed on the low orbit
     table. They are all ground-based, so must be placed along the table edge
     which has been designated as representing the ground. Laser and missile
     silos have a front fire arc which faces away from the planet's surface
     and into space. Low orbit defences can never attack ships which are not
     on the low orbit table ... ordnance launched from the ground cannot move
     up to high orbit". */
  {id:"pd_ground", slot:"placement", when:function(sh){ return !!sh.df && /ground/i.test(String(sh.ty || "")); },
   text:"Low orbit defence: deployed only on the low orbit table, along the edge that represents the ground; it can never attack ships that are not on that table, and ordnance launched from the ground cannot climb to high orbit. Silos fire in a front arc away from the surface. End Phase: remove D6 Blast Markers from it. (Fleets p. 498; Rulebook p. 101)"},
  /* Rulebook p. 116, FIGHTING IN LOW ORBIT: "all firepower shooting in low
     orbit suffers one column shift to the right, lances and nova cannons
     require a 4+ roll to fire" - every gun on that table, the silos' too.
     The torpedo ban there is for ships ("torpedoes may not be fired by ships
     at all"), so a missile silo is not named. */
  {id:"pd_low_orbit_fire", slot:"placement", when:function(sh){ return !!sh.df && /ground/i.test(String(sh.ty || "")) && (sh.aw || []).some(function(a){ return /battery|lance/i.test(String(a[0] || "")); }); },
   text:"Firing in low orbit: firepower shifts one column right on the gunnery table, and each lance needs a 4+ to fire. (Rulebook p. 116)"},
  /* Fleets p. 498: "High orbit defences may be placed around a planet or its
     moons. They must be deployed within the planet or moon's gravity well". */
  {id:"pd_high_orbit", slot:"placement", when:function(sh){ return !!sh.df && !sh.qd && isStationaryDefence(sh) && !/ground/i.test(String(sh.ty || "")) && !isHaven(sh); },
   text:"High orbit defence: deployed inside the gravity well of the planet or one of its moons; stationary defences may touch bases but never overlap. (Fleets p. 498)"},
  /* Rulebook p. 101: the D6 removal "only applies to stationary defences,
     not planetary defences that behave as ships (such as monitors or system
     ships)". Fleets p. 498: "these ships have no warp engines and are
     therefore confined to the system". */
  {id:"pd_vessel", slot:"blast", when:function(sh){ return !!sh.df && /escort/i.test(String(sh.ty || "")); },
   text:"System defence vessel: moves and fights as an escort but is a planetary defence - squadrons of one to six one-hit defences, and no D6 Blast Marker removal: that is for stationary defences only. (Rulebook pp. 100-101)"},
  /* ---- Quadrant star forts: Ramilies (Fleets pp. 500-505) and, through
     "follows all rules for the Ramilies Class Star Fortress detailed on
     pg. 500 except as specifically outlined here" (p. 110), the
     Fortress-Monastery. The profile page holds two bullets; everything a
     player needs at the table is on the four pages after it (AGENTS.md 6).
     slot: where the fort's plan card puts the rule; the rest print on its
     rules card. The texts are the app's own short wording; the facts were
     read from the pages and checked by a second reader (8.10.2026). */
  {id:"fort_orders", slot:"orders", when:function(sh){ return !!sh.qd; },
   text:"Special orders: only Reload Ordnance, Lock On and Brace for Impact. The quadrants may be grouped and each group given its own order, one Command check per group; a single quadrant may Brace alone. (Fleets p. 503)"},
  {id:"ramilies_ld", slot:"orders", when:function(sh){ return !!sh.qd && !sh.dld; },
   text:"Leadership is rolled as for a capital ship. A fleet commander may be aboard: the fort then uses his Leadership. (Fleets p. 503)"},
  {id:"ramilies_reroll", slot:"rerolls", when:function(sh){ return !!sh.qd && (sh.rr | 0) > 0; },
   text:"The fort has one command re-roll of its own. With a fleet commander aboard it joins his re-rolls and may then be used anywhere in the fleet. (Fleets p. 503)"},
  /* p. 501: "draw a straight line from the stem of the firing ship to the
     centre of the Ramilies" - written for fire AT the fort. That a quadrant
     fires out of its own quarter is the profile's arc word "Quadrant" and
     the p. 501 diagram; the tie rule is the general fire-arc rule of
     Rulebook p. 60, not a Ramilies sentence. The book calls the quadrants
     'North', 'East', 'South' and 'West' with the piers between them; the
     card follows the player's model (piers on the axes), the same plan
     turned 45 degrees. */
  {id:"fort_sectors", slot:"sectors", when:function(sh){ return !!sh.qd; },
   text:"Which quadrant is hit: draw a line from the firing ship's stem to the centre of the fort - the quadrant it comes in through takes the fire; ordnance attacks the quadrant it moves in from (Fleets p. 501). Fire arc 'Quadrant': the book prints only the word and the p. 501 diagram - read here as the quadrant's own quarter, between its two piers. On a boundary the shooting player chooses, as with any fire arc (Rulebook p. 60)."},
  {id:"fort_templates", slot:"templates", when:function(sh){ return !!sh.qd; },
   text:"Templates: a Nova cannon or Armageddon gun scores its full D6 hits only on the quadrant most under the centre hole of the marker. (Fleets p. 501)"},
  {id:"fort_basilica", slot:"basilica", when:function(sh){ return !!sh.qd; },
   text:"Basilica weapons fire all round and count as being on every quadrant's special orders at once; Brace for Impact halves them as normal. Critical 11 destroys them. (Fleets pp. 503, 505)"},
  {id:"fort_boarding", slot:"boarding", when:function(sh){ return !!sh.qd; },
   text:"Boarding: only a Space Hulk may board it - against the Hits left in all four quadrants plus the turrets of the boarded quadrant; results go to that quadrant. Hit & Run raids and ramming affect one quadrant only. In its own End Phase the fort may board an enemy in base contact with as many quadrants as it likes. (Fleets p. 502)"},
  {id:"fort_turrets", slot:"turrets", when:function(sh){ return !!sh.qd; },
   text:"Massed turrets: +1 from each neighbouring quadrant that is not crippled or destroyed (+2 at most), +3 at most together with ships in base contact. (Fleets p. 502)"},
  {id:"fort_blast", slot:"blast", when:function(sh){ return !!sh.qd; },
   text:"Blast Markers: each quadrant has its own shields. One round of shooting puts markers on the quadrant hit and on at most one other; a quadrant with none placed against it counts as clear. End Phase: remove D6 Blast Markers from the whole fort, not per quadrant. (Fleets p. 502)"},
  {id:"fort_damage", slot:"damage", when:function(sh){ return !!sh.qd; },
   text:"A quadrant at 0 Hits takes no more damage and counts as an asteroid field from then on. Damage control is rolled for each quadrant. The fort is destroyed only when all four quadrants are at 0. (Fleets pp. 501-502)"},
  {id:"fort_catastrophic", slot:"catastrophic", when:function(sh){ return !!sh.qd; },
   text:"Catastrophic damage (D6, when all four quadrants are at 0): 1-2 a wreck that blocks line of fire and counts as an asteroid field; 3 an asteroid field 15 cm across; 4-5 eight lance shots at every ship within 4D6 cm, ordnance there removed, a solar flare on everything else, then 2D6 Blast Markers in its place; 6 four lance shots at every ship and ordnance marker within 4D6 cm, then a warp rift in its place that draws everything 15 cm toward it. (Fleets p. 505)"},
  {id:"fort_docking", slot:"docking", when:function(sh){ return !!sh.qd; },
   text:"Docking: a friendly ship touching the fort may halt as in a gravity well and may use Burn Retros to turn without a Command check. A ship touching a docking pier may dock fully: while docked it rolls 4 extra damage control dice, and after two full turns docked without bracing its ordnance is reloaded. No ship may dock with a rotating fort. (Fleets pp. 502-503)"},
  {id:"fort_rotating", slot:"rotating", when:function(sh){ return !!sh.qd; },
   text:"Rotating: decided before the game and not changed. A rotating fort turns 45 degrees once per game turn at the start of its owner's Movement phase, always the same way; Blast Markers stay where they are. (Fleets p. 502)"},
  {id:"ramilies_ordnance", slot:"ordnance", when:function(sh){ return !!sh.qd && !/FORTRESS-MONASTERY/i.test(String(sh.nm || "")); },
   text:"Attack craft: it may have twice as many markers in play as it has launch bays remaining. (Fleets p. 502)"},
  /* ---- Eldar Haven (Fleets pp. 332-335); as a Dark Eldar pirate base
     pp. 335 and 349. The profile bullets (Netherfield, Polarization Field)
     and the Eldar holofield and Leadership rules print by themselves. */
  {id:"haven_orders", slot:"orders", when:isHaven,
   text:"Haven: an Eldar or Dark Eldar fleet commander may lead the battle from it. Special orders: only Lock On, Reload Ordnance and Brace for Impact. (Fleets p. 334)"},
  {id:"haven_blast", slot:"blast", when:isHaven,
   text:"Large defence: at the end of each turn remove D6 Blast Markers in base contact with it, apart from the normal removal. (Fleets p. 334)"},
  {id:"haven_docking", slot:"docking", when:isHaven,
   text:"Docking: Eldar ships dock on a Leadership check. A capital ship docked for a full turn rolls 2 extra repair dice and reloads its ordnance, but may not move, shoot or launch that turn. In a turn with no ship docked the Haven rolls the 2 extra repair dice itself. (Fleets p. 334)"},
  {id:"haven_webway", slot:"webway", when:isHaven,
   text:"Webway Portal: ships bought at half cost wait off the table. From turn 2, after the fleet has moved, roll a D6: on 5+ one capital ship or escort squadron arrives at the table edge nearest the Haven and does not move that turn. (Fleets p. 335)"},
  {id:"haven_points", slot:"placement", when:isHaven,
   text:"Campaign: a Haven counts as a pirate base, and its value counts against the fleet list in the battles it takes part in. (Fleets p. 335)"},
  {id:"haven_dark", slot:"swaps", when:function(sh){ return isHaven(sh) && (sh.aw || []).some(function(a){ return /phantom/i.test(String(a[0] || "")); }); },
   text:"Dark Eldar pirate base: Slavebringer assault boats replace the bombers and Phantom lances the Pulsar lances, at no change in cost; nothing else changes - it keeps its holofields and its 5+ critical threshold. (Fleets pp. 335, 349)"},
  {id:"zukov_klaws", when:function(sh){ return /^ZUKOV/i.test(String(sh.nm || "")); },
   text:"Klaws (included in the cost): once per turn, when the ship moves into base contact with an enemy ship, roll 2D6; each 4+ is one hit ignoring shields (not holofields). Brace works; unaffected by Special Orders; a crippled capital ship cannot use them. If both hit it latches on: neither ship moves if the target is the same class or smaller (a larger one moves at half rate), both shoot at half effect with no nova cannon or similar weapons, and it attacks again each End phase (both hitting again adds a third hit). Either may board; Klaw damage causes criticals as normal. (Fleets pp. 373, 383)"},
];


/* A rule can be tied to the fleet on the profile page, to the fleet list in
   use, or to both. The list gate is needed for rules a book grants to one
   list only: Thunderhawk Annihilators are a crusading-Chapter privilege even
   though every Space Marine hull is printed on the same pages. */
export function fleetMatches(def, sh, list, en, sel){
  /* inFleet: a rule of the FLEET the ship serves in, for a ship borrowed
     into it from another list (Fleets p. 14) - Mechanicus re-rolls and a
     reserve Imperial Navy hull (p. 121). Only a selection knows the fleet;
     a caller without one (print_check, a profile-only view) never gets
     the rule, rather than demanding it on every card of the hull. */
  if(def.inFleet){
    var fl0 = sel && sel.fleet, own0 = sel && sel.list;
    if(!fl0 || !own0 || fl0.nm === own0.nm || !def.inFleet.test(String(fl0.nm || ""))) return false;
  }
  const fl = String(sh.fl || ""), ctx = fl + " " + String(sh.nm || "");
  /* A rule tied to the fleet LIST or to a section of it is a rule of that
     list's ships. A planetary defence bought beside the list (sh.df, Fleets
     p. 499) is not one of them: a Space Station next to a Chaos fleet has no
     "Chaos: +1 in boarding actions", and one next to an Explorator fleet has
     no Mechanicus crew. Rules tied to the profile's own fleet still reach it
     (a Tau orbital is a Tau defence, p. 450). */
  if(sh.df && (def.list || def.sec || def.entry || def.notDefence)) return false;
  if(def.list && !(list && def.list.test(list.nm))) return false;
  /* native: a rule of the list's own vessels, not of another race's hull it
     prints in a reserve section (foreignReserveRow). */
  if(def.native && foreignReserveRow(list, en, sh)) return false;
  /* notList: a list whose own rule replaces this one (Vanguard fleets have
     no hive ships, Fleets p. 429). when: the profile must have the thing the
     rule is about (a Kraken has no spore cysts, p. 435). */
  if(def.notList && list && def.notList.test(list.nm)) return false;
  if(def.when && !def.when(sh)) return false;
  /* whenSel: the rule depends on what the unit has bought. A caller without
     a selection (a profile-only view) never gets it. */
  if(def.whenSel && !(sel && def.whenSel(sel))) return false;
  /* sec: the rule belongs to the SECTION the row was bought from, not to the
     hull or its fleet. A Lunar is a Lunar on every Imperial list, but taken
     from a Chaos list's Renegade Imperial Vessels it suffers "-1Ld for going
     renegade" (Fleets p. 232), and a Carnage from Bastion's reserve fleet
     keeps its Chaos ordnance (p. 39). Nothing else in this pipeline sees
     the section, so the row is looked up by identity: sel.en is the same
     object as the list's own entry. Without a list and a row the gate refuses
     - a profile-only caller (print_check, the golden special_contains) would
     otherwise demand the line on every card of the list. */
  if(def.sec || def.notSec){
    var st = null;
    if(list && en) (list.secs || []).forEach(function(s2){
      if(st === null && (s2.ents || []).indexOf(en) >= 0) st = String(s2.t || ""); });
    if(def.sec && (st === null || !def.sec.test(st))) return false;
    /* notSec: a section whose own line replaces this rule of the list. The
       Chaos boarding line names the Chaos Space Marine crew, which p. 232
       refuses to a renegade Imperial hull; its renegade line carries the
       +1 instead (spot check 2026-10-18/1). Without a row the gate lets the
       rule through, as the list-wide rule it is. */
    if(def.notSec && st !== null && def.notSec.test(st)) return false;
  }
  /* entry: the list row grants the rule to a hull of another fleet - a Space
     Marine rapid strike vessel is a Navy hull "with the additional Space
     Marine special rules" (Fleets p. 106). */
  if(def.entry && en && def.entry.test(String(en.l || ""))) return true;
  return !def.fleet || def.fleet.test(fl) || def.fleet.test(ctx);
}
/* The profile's turret column is SPORES on a Tyranid, and "-" means none. */
export function hasSpores(sh){
  return /SPORES/i.test(String(sh.tl || "")) && !/^\s*[\u2013\u2014-]?\s*$/.test(String(sh.tu || ""));
}

export function defMatches(def, sh, arm, list, en){
  return fleetMatches(def, sh, list, en) && def.wep.test(String(arm[0] || "")) &&
    (!def.notWep || !def.notWep.test(String(arm[0] || ""))) &&
    (!def.range || def.range.test(String(arm[1] || "")));
}

export function defOptionMatches(def, sh, option, list, en){
  const text = String(option && option.t || option || "");
  if(!fleetMatches(def, sh, list, en)) return false;
  if(def.notOpt && def.notOpt.test(text)) return false;
  if(def.opt) return def.opt.test(text);
  /* A swap names the weapon it removes ("replace its dorsal bombardment
     cannon for ... lances", Fleets p. 160): that weapon's rule is not the
     option's rule. Only what the option brings or keeps counts. */
  if(option && option.sw && sh){
    const removed = (option.sw.f || []).map(fi => String(((sh.aw || [])[fi] || [])[0] || ""));
    if(removed.some(nm => def.wep.test(nm))) return false;
  }
  /* An option that OWNS armament rows brings those rows' rules. A Waystation's
     "Launch Bay: 30 pts" is its Launch bays row (aws, Fleets p. 481), and the
     Tau launch bay rule is keyed on that row's range cell ("Mantas: 20 cm"),
     which the option text does not repeat - so the offered row printed with
     no rule and no star, unlike the hook, railgun and ion rows beside it
     (found when the Tau orbitals became list rows, 9.10.2026). */
  if(option && option.aws && sh && option.aws.some(i => {
       const a = (sh.aw || [])[i];
       return !!a && def.wep.test(String(a[0] || "")) && (!def.range || def.range.test(String(a[1] || "")));
     })) return true;
  return def.wep.test(text) && (!def.range || def.range.test(text));
}

export function uniqRefs(refs){
  const out = [], seen = {};
  refs.forEach(r => { if(r && !seen[r.id]){ seen[r.id] = 1; out.push(r); } });
  return out;
}

export function sourceStarDef(sh){
  return (sh.aw || []).some(a => /\*/.test(a[0])) ?
    {id:"source_asterisk", color:"#A33B54", mentions:[/^\s*\*/]} : null;
}

export function weaponMentioned(text, arm){
  const low = String(text || "").toLowerCase();
  const name = wepKey(arm[0]).replace(/\b(battery|batteries|bay|bays)\b/g, "").trim();
  if(name.length >= 4 && low.includes(name)) return true;
  if(/lance/i.test(arm[0]) && /\blances?\b/i.test(text)) return true;
  if(/torpedo/i.test(arm[0]) && /\btorpedo(?:es)?\b|\blauncha/i.test(text)) return true;
  if(/launch bay/i.test(arm[0]) && /launch bays?|attack craft/i.test(text)) return true;
  if(/weapons battery/i.test(arm[0]) && /weapons batter(?:y|ies)/i.test(text)) return true;
  return false;
}

export function localRef(arm){
  const [letter, color] = wepClass(arm[0]);
  const family = /lance/i.test(arm[0]) ? "lance" :
    /torpedo/i.test(arm[0]) ? "torpedo" :
    /launch bay/i.test(arm[0]) ? "launch" :
    /battery|gunz/i.test(arm[0]) ? "battery" : wepKey(arm[0]);
  return {id:"local_" + family, color, letter};
}

/* sel (optional): the unit's selection. An option in state "off" - one the
   list forbids (noopt, Fleets p. 190) or one shut out by an exclusive group -
   cannot be taken, so its weapon rule does not print: the Exploration Tyrant
   has no Nova Cannon and gets no Nova Cannon rule. Without sel every option
   counts, which is what the profile-level callers (stars, print_check) want. */
export function specialModel(sh, list, sel){
  const raw = (sh.sr || "").trim();
  const parts = [];
  if(raw){
    (raw.indexOf("\u2022") >= 0
        ? raw.split("\u2022")
        : raw.split(/(?<=\.)\s+(?=[A-Z])/)
      ).forEach(t => {
        t = t.trim().replace(/^[\u2022\s]+/, "");
        if(t.length > 2) parts.push(t);
      });
  }
  const en = sel ? sel.en : null;
  /* With a selection the weapon rules follow the rows in force - a replaced
     launch bay takes its Thunderhawk rule with it (Inquisitorial cruiser,
     Fleets p. 160). Without one every profile row counts, which is what the
     stars and print_check want. */
  const arms = sel ? weaponRows(sel).filter(r => r.box == null || r.box === "on").map(r => r.a) : (sh.aw || []);
  const byWeapon = arms.map(a => SPECIAL_WEAPON_RULES.filter(d => defMatches(d, sh, a, list, en)));
  const blocked = sel ? optionsOf(sel).map(o => o.blockedBy.length > 0) : [];
  const optionDefs = (sh.ol || []).map((o, i) =>
    sel && (optState(sel, i) === "off" || blocked[i]) ? [] : SPECIAL_WEAPON_RULES.filter(d => defOptionMatches(d, sh, o, list, en)));
  const upDefs = sel ? boughtDefs(sel, sh, list) : [];
  const defs = uniqRefs(byWeapon.flat().concat(optionDefs.flat()).concat(upDefs));
  const sourceDef = sourceStarDef(sh);
  const rules = parts.map(t => {
    let refs = defs.filter(d => (d.mentions || []).some(re => re.test(t)));
    arms.forEach((a, i) => {
      if(!weaponMentioned(t, a)) return;
      refs = refs.concat(byWeapon[i].length ? byWeapon[i] : [localRef(a)]);
    });
    if(sourceDef && /^\s*\*/.test(t)) refs.push(sourceDef);
    return {t, refs:uniqRefs(refs), ast:refs.length > 0};
  });
  /* A profile sentence that merely names a weapon does not explain it. The
     Strike Cruiser's "as many ... as all other variants (with replaced launch
     bays and/or prow bombardment cannon) combined" is a fleet composition
     limit, yet it used to swallow both the Thunderhawk and the bombardment
     cannon rule; 43 cards lost a rule that way. The rule text therefore always
     prints, and the few sentences that really do state the rule themselves are
     declared case by case with selfText. */
  const explained = new Set();
  parts.forEach(t => defs.forEach(d => {
    if(d.selfText && d.selfText.test(t)) explained.add(d.id);
  }));
  /* weapon: the rule of a standard armament row, as opposed to one that a
     TAKEN option or a bought upgrade brings. A card that prints only the
     hull's own rules (brief: the space hulks, user 9.10.2026) leaves the
     first kind out; what the player has bought still prints. */
  const bought = {};
  (sel ? optionDefs.filter((x, i) => optState(sel, i) === "take").flat() : []).concat(upDefs)
    .forEach(d => { bought[d.id] = 1; });
  defs.forEach(def => {
    if(!explained.has(def.id))
      rules.push({t:def.text, refs:[def], ast:true, canonical:true, weapon:!bought[def.id]});
  });
  SPECIAL_HULL_RULES.filter(d => fleetMatches(d, sh, list, en, sel))
    .forEach(d => rules.push({t:d.text, refs:[], ast:false, canonical:true, hull:d.id, slot:d.slot || null}));
  return {rules, byWeapon, optionDefs, sourceDef};
}

/* Rules bought as list upgrades (up): only what is taken - offered rows are
   on the card as boxes, their rule would be noise on every card. sh is null
   for a commander, whose list stands for the fleet. */
export function boughtDefs(sel, sh, list){
  var labels = upgradesOf(sel).filter(function(x){ return x.state === "take"; }).map(function(x){ return x.label; });
  if(!labels.length) return [];
  return SPECIAL_WEAPON_RULES.filter(function(d){
    if(!d.up || !labels.some(function(l){ return d.up.test(l); })) return false;
    if(sh) return fleetMatches(d, sh, list, sel.en);
    if(d.ship) return false;
    return (!d.fleet || (list && d.fleet.test(list.nm))) && (!d.list || (list && d.list.test(list.nm)));
  });
}
export function specialLines(sh, list, sel){
  return specialModel(sh, list, sel).rules;
}

export function starredKeys(rules, sh, list){
  const model = specialModel(sh, list), out = {};
  (sh.aw || []).forEach((a, i) => {
    let refs = model.byWeapon[i].slice();
    rules.forEach(r => {
      if(weaponMentioned(r.t, a) && !refs.length) refs.push(localRef(a));
    });
    if(model.sourceDef && /\*/.test(a[0])) refs.push(model.sourceDef);
    const used = new Set(rules.flatMap(r => (r.refs || []).map(x => x.id)));
    refs = uniqRefs(refs).filter(r => used.has(r.id));
    if(refs.length) out[i] = refs;
  });
  return out;
}


export function optStars(sh, o, rules, list){
  const model = specialModel(sh, list), text = String(o.t || "");
  const oi = (sh.ol || []).indexOf(o);
  let refs = oi >= 0 ? model.optionDefs[oi].slice() : [];
  model.byWeapon.forEach((defs, i) => {
    if(weaponMentioned(text, sh.aw[i])) refs = refs.concat(defs);
  });
  const used = new Set(rules.flatMap(r => (r.refs || []).map(x => x.id)));
  return uniqRefs(refs).filter(r => used.has(r.id));
}



/* ---- P1-8d: what the surfaces need beyond the calculators ----------- */
/* The book's own description of a list row (the section's text owned by
   that label), for the card's option block. */
export function ownedText(list, si, label){
  var sec = list && list.secs[si];
  if(!sec || !sec.own) return "";
  var out = [];
  /* A sentence ending in a colon leads in to the next row; it describes
     nothing of this one. */
  sec.own.forEach(function(o, i){ if(o === label && !/:\s*$/.test(String(sec.text[i] || ""))) out.push(sec.text[i]); });
  return out.join(" ");
}
/* A replacement weapon is not a profile row, so it has no pre-computed star.
   It is looked up the same way as the others: only rules that are genuinely
   on this card qualify. */
export function starsForRow(sh, rules, a, list, en){
  var refs = SPECIAL_WEAPON_RULES.filter(function(dd){ return defMatches(dd, sh, a, list, en); });
  if(!refs.length)
    rules.forEach(function(r){ if(weaponMentioned(r.t, a)) refs = [localRef(a)]; });
  var used = {};
  rules.forEach(function(r){ (r.refs || []).forEach(function(x){ used[x.id] = 1; }); });
  return uniqRefs(refs).filter(function(r){ return used[r.id]; });
}
/* Hull choice (Fleets p. 102): the hulls the row offers, each with the price
   the fleet view shows - listed cost +35 for the Space Marine crew, or a
   Space Marine hull at its own price. */
export function hullOptionsOf(en, catalog){
  return (en.hulls || []).map(function(pg){
    var h = catalog.ships[String(pg)];
    if(!h) return null;
    var crew = /SPACE MARINES/i.test(String(h.fl || "")) ? 0 : (en.hcp || 0);
    return { ref: String(pg), name: h.nm, points: (h.bp || 0) + crew };
  }).filter(Boolean);
}

/* ---- P1-8e: commanders -------------------------------------------------
   Refers to what comes next, not to the row above: the book prints such a
   lead-in after a price list, and page order alone would file it under the
   last priced row. Three sentences in the whole book. */
