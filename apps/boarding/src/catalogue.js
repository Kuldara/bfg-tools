/* The data the page reads: the rules engine, the ships and fleets, and the
   catalogue of per-ship options. */

import BOARDING from "./engine.js";
import SHIPDATA from "./ships.json";

export var B = BOARDING;
export var SHIPS = SHIPDATA.ships, FLEETS = SHIPDATA.fleets;
export var KEY = "bfg-boarding-v1";

/* ---------------------------------------------------------- option catalogue */
/* Per-ship things a player buys or brings. Shown only to the fleets that can
   actually take them, so nobody ever sees a choice that cannot apply. */
export var OPTS = [
  {id:"khorne",     t:"Mark of Khorne",                 d:"Boarding value x2. +1 to the roll to cause a critical hit.", r:["chaos"], noflag:"renegade"},
  {id:"nurgle",     t:"Mark of Nurgle",                 d:"May not be boarded at all (an Ordo Malleus Inquisitor Lord is the exception).", r:["chaos"], noflag:"renegade"},
  {id:"csm",        t:"Chaos Space Marine crew",        d:"+2, and it supersedes the +1 for being Chaos.", r:["chaos"], noflag:"renegade"},
  {id:"abaddon",    t:"Abaddon the Despoiler aboard",   d:"Boarding value x2 and +1 to the boarding roll.", r:["chaos"], noflag:"renegade"},
  {id:"berzerkers", t:"Khorne Berzerker retinue",       d:"+2 to the boarding roll.", r:["chaos"], noflag:"renegade"},
  {id:"berzerkerfleet", t:"Berzerker Tide",             d:"A Mark of Khorne ship may roll D3 extra critical damage rolls, but then may take no special orders next turn.", r:["chaos"], noflag:"renegade"},
  {id:"warlord",    t:"Ork Warlord aboard",             d:"Boarding value x2. Ork Pirates and Waaagh! lists only, and never aboard a space hulk.", r:["ork"]},
  {id:"clanzwarlord", t:"Ork Clanz Warlord",            d:"+2 to one boarding dice roll per game. Da Ork Clanz list — that Warlord does not double the boarding value.", r:["ork"]},
  {id:"goff",       t:"Goff clan",                      d:"+1 to the boarding roll.", r:["ork"]},
  {id:"megaarmour", t:"Mega-armoured boarding parties", d:"+1 to the boarding roll.", r:["ork"]},
  {id:"holofields", t:"Holofields / shadowfields",      d:"One save against the whole boarding attempt: on a D6 roll of 2+ the attempt is ignored and a Blast Marker is placed in contact (3+ against an Ordo Xenos Inquisitor Lord).", r:["eldar","darkeldar"]},
  {id:"aspect",     t:"Aspect Warrior Host",             d:"+2 to the boarding roll. Prince Yriel’s ship always counts as carrying one.", r:["eldar"]},
  {id:"talons",     t:"Talons refit",                    d:"Enemies boarding this vessel suffer −2.", r:["eldar","darkeldar"]},
  {id:"ghostship",  t:"Iyanden Ghostship",               d:"May not initiate a boarding action, and enemies boarding it gain +1.", r:["eldar"]},
  {id:"battlestance", t:"Trained crew (campaign)",        d:"May re-roll the boarding dice; the second roll stands even if it is worse. Eldar Battle Stance (FL p.312) and the Imperial Navy crew-training appeal (FL p.33) both work this way.", r:["imperial","spacemarines","admech","inquisition","roguetrader","chaos","ork","eldar","darkeldar","necron","tyranid","tau","tau_kororvesh","kroot","demiurg","nicassar","none"]},
  /* not offered to the Mechanicus fleet itself: its own ships already have it */
  {id:"admech",     t:"Adeptus Mechanicus vessel",        d:"Whoever boards it may re-roll the boarding dice; the second roll stands (FL p.118). For a Mechanicus cruiser in another fleet, such as a Bakka battlecruiser slot (FL p.49).", r:["imperial","inquisition","roguetrader"]},
  {id:"ark",        t:"Ark of Pestilence",                d:"Every ship it boards is also infected: treat it as a single Fire critical in addition to all damage (FL p.248).", r:["chaos"], noflag:"renegade"},
  {id:"rath",       t:"Lord Admiral Rath’s flagship",    d:"+1 when defending against a boarding action.", r:["imperial"]},
  {id:"marines",    t:"Space Marine crew",              d:"+2 to the boarding roll.", r:["imperial","inquisition","roguetrader","admech"]},
  {id:"greyknights",t:"Grey Knights",                   d:"May re-roll the boarding result; the second roll stands.", r:["imperial","inquisition","spacemarines"]},
  {id:"inq_malleus",t:"Ordo Malleus Inquisitor Lord",   d:"+2, and may board ships bearing the Mark of Nurgle.", r:["imperial","inquisition","spacemarines","roguetrader","admech"]},
  {id:"inq_hereticus",t:"Ordo Hereticus Inquisitor Lord",d:"+2 to the boarding roll.", r:["imperial","inquisition","spacemarines","roguetrader","admech"]},
  {id:"inq_xenos",  t:"Ordo Xenos Inquisitor Lord",     d:"+2 against alien vessels, and those aliens take -1.", r:["imperial","inquisition","spacemarines","roguetrader","admech"]},
  {id:"terminators",t:"Chosen Terminators (Chaos)",      d:"Chaos: a teleport hit-and-run attack rolls 2D6 and picks the highest (FL p.234). Neither affects the boarding roll itself.", r:["chaos"], noflag:"renegade"},
  {id:"terminators",t:"Terminator boarding party",       d:"Space Marines and Grey Knights: an extra teleport attack each turn, rolling 2D6 (FL p.96, p.155). It does not change the boarding roll.", r:["spacemarines","inquisition"]},
  {id:"fuel_tanker",t:"Fuel Tanker",                    d:"Rolls 3D6 for catastrophic damage; a total over 12 counts as 12.", r:["roguetrader"], only:["HEAVY TRANSPORT"]}
];
/* Flags the ship profile itself carries. Never editable, always shown. */
export var AUTO = {
  corridor:{t:"Narrow mid-ship corridor", d:"+1 when defending against a boarding action."},
  blackship:{t:"Inquisition Blackship", d:"Never boards. +2 when defending. Hit-and-run attacks take -1."},
  greyknights:{t:"Grey Knights", d:"May re-roll the boarding result."},
  marines:{t:"Space Marine crew", d:"+2 to the boarding roll."},
  khorne:{t:"Mark of Khorne", d:"Boarding value x2. +1 to cause a critical hit."},
  csm:{t:"Chaos Space Marine crew", d:"+2, supersedes the +1 for Chaos."},
  renegade:{t:"Renegade Imperial vessel", d:"Counts as a Chaos vessel in every respect, so it adds the +1 for Chaos — but it can never take a Chaos Space Marine crew, a Chaos Lord or a Mark of Chaos (FL p.232)."},
  berzerkers:{t:"Khorne Berzerker retinue", d:"+2 to the boarding roll."},
  terminators:{t:"Chosen Terminators", d:"Teleport hit-and-run rolls 2D6, pick the highest."},
  nocrew:{t:"No crew", d:"Adds no D6 at all to its boarding score."},
  noboard:{t:"Cannot board", d:"Too small a crew to initiate a boarding action."},
  easyprey:{t:"Easily boarded", d:"A ship that boards it gains +1."},
  hp2:{t:"Ork boarding drills", d:"Counts as 2 HP when determining its boarding value."},
  goff:{t:"Goff clan", d:"+1 to the boarding roll."},
  hr_target_plus1:{t:"Fragile", d:"Hit-and-run attacks against it add +1."},
  critplus1:{t:"No critical hits table", d:"Each critical hit simply inflicts 1 extra damage instead of a table result."},
  orkhulk:{t:"Ork space hulk", d:"Uses its own D6 critical table and cannot repair criticals during the battle."},
  spacehulk:{t:"Space hulk", d:"Never crippled, a Warlord aboard does not double the boarding value, and no boarding-value upgrades may be taken."},
  chaoshulk:{t:"Chaos space hulk", d:"Uses its own D6 critical table and cannot repair criticals during the battle."},
  nocata4:{t:"Breaks up", d:"Never rolls for catastrophic damage: it is replaced by four Blast Markers."},
  fortress:{t:"Star fort", d:"The only vessel that may attempt to board it is a space hulk."},
  ramilies:{t:"Star fort tables", d:"Uses the Ramilies critical and catastrophic damage tables."},
  haven:{t:"Haven tables", d:"Uses the Eldar Haven critical hits table."},
  nurgle:{t:"Mark of Nurgle", d:"May not be boarded at all."},
  aspect:{t:"Aspect Warrior Host", d:"+2 to the boarding roll."},
  orders2:{t:"Improved sensor array", d:"Gets +2 instead of +1 when the enemy is on special orders."},
  cata3:{t:"Unstable engineering plant", d:"Rolls 3D6 for catastrophic damage; a total over 12 counts as 12."},
  ignoreprow:{t:"Prow critical immunity", d:"Ignores Prow Armament Damaged completely."},
  bridgeplus1:{t:"Demiurg bridge rule", d:"Bridge Smashed causes +1 damage instead of Leadership loss."},
  gellar:{t:"Gellar Field", d:"If Shields Collapse, roll D6; on 4+ the field is also damaged."}
};
/* Options that stand for two engine flags at once. */
export var OPT_EXPAND = {ghostship:["noboard","easyprey"]};
