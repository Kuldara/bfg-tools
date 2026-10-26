export var FORWARD_REF = /\b(shown below|noted below|listed below|the following|as follows)\b/i;

/* The list's own commander paragraph for the card: assignment, Leadership
   bonus, what the commander may additionally be given. A sentence goes in
   unless it is the description of an upgrade this commander has not
   bought. Anything owned by a non-upgrade row belongs to the commander
   itself (or to the alternative commander in the same section) and is
   always shown - dropping those took the Veteran Captain's re-roll and the
   Warlord's doubled boarding value off the card. A block that starts with
   its own price line belongs to that row alone: the Ordo Malleus
   Inquisitor Lord's boarding bonuses are not the plain Inquisitor Lord's. */
/* Named characters whose rules sit on a dossier page, not in the list text
   the section carries. Printed on the commander card after the list's own
   sentences. */
export const COMMANDER_RULES = [
  /* Fleets p. 141: the Ordo Xenos ship rolls on (or picks from, +5 pts) the
     xenotech table; the table itself is not in the section text. */
  {id:"ordo_xenos_table", entry:/^ordo xenos inquisitor lord/i,
   text:"Xenotech refit (D6, or choose for +5 pts): 1 Long Range Sensors: +1 to base Leadership (max 10). 2 Targeting Matrix: all targets count as closing within 30 cm, no right-shift modifiers beyond 30 cm. 3 Advanced Shielding: +1 shield. 4 Ship Defence Grid: +1 turret. 5 Advanced Drive Technology: +5 cm Speed and +1D6 on All Ahead Full. 6 Gravitic Thrusters: double the maximum turn. (Fleets p. 141)"},
  /* Fleets p. 231: the special rules that apply to Abaddon. */
  {id:"abaddon", entry:/^abaddon\b/i,
   text:"Abaddon the Despoiler: his ship doubles its value in boarding actions and adds +1 to the Boarding modifier. Hit & Run raids against his ship suffer -1; his own teleport attacks add +1 (boarding torpedoes and assault boats do not). \"You have failed me for the last time\": if his re-roll is used for another ship's or squadron's Command check or Leadership test and it fails again, in the next Chaos Shooting phase his ship directs at least half its firepower and lance strength at them, resolved as if it were an enemy. (Fleets p. 231)"},
  {id:"mesme", entry:/kor.o.mesme/i,
   text:"Kor'O Vash'ya Y'eldi Mesme: embarked aboard the Custodian class battleship Bor'kan Or'es El'Leath Se'arle O'Mesme; Leadership 9 and two re-rolls included. Aun'Shear of the Ethereal caste always accompanies him, so extra re-rolls may be bought. Excellent Pilots: the attack craft squadrons of his flagship have the Excellent Pilots crew skill. Improved Logic Engines (+10 pts): his vessel ignores Leadership effects from contact with Blast Markers. (Fleets p. 453)"}
];
export function namedCommanderRules(en){
  return COMMANDER_RULES.filter(function(d){ return d.entry.test(String(en && en.l || "")); })
    .map(function(d){ return d.text; });
}

export function commanderRules(list, si, en){
  var sec = list && list.secs[si];
  if(!sec || !sec.text) return [];
  return sec.text.filter(function(t, i){
    /* skiptx: the section's general sentence does not hold for this row -
       Kor'O'Mesme has two re-rolls (p. 453), not the list's one (p. 456) */
    if((en.skiptx || []).indexOf(t) >= 0) return false;
    var owner = sec.own && sec.own[i];
    if(!owner) return true;
    if((sec.ownx || []).indexOf(i) >= 0) return owner === en.l;
    var ei = sec.ents.findIndex(function(e){ return e.l === owner; });
    var row = ei >= 0 ? sec.ents[ei] : null;
    if(!row || row.k !== "up") return true;
    if(FORWARD_REF.test(t)) return true;
    return false;                       /* taken ones print beside the row */
  });
}
