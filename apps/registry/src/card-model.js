import { L, selOf } from "./model.js";
import DOMAIN from "../../../packages/rules/domain.js";

/* ------------------------------------------------------------- print ----
   The card's sections and dimensions match the project's ship cards:
   144 x 135 mm, 2 per A4 portrait. */

/* Key that identifies a weapon by name: side and facing qualifiers are
   dropped, so "Prow bombardment cannon" and "Port heavy gunz" reduce to
   "bombardment cannon" and "heavy gunz". */
export const wepKey = DOMAIN.wepKey;

export const SPECIAL_WEAPON_RULES = DOMAIN.SPECIAL_WEAPON_RULES;

export const SPECIAL_HULL_RULES = DOMAIN.SPECIAL_HULL_RULES;

/* Special-rule model: domain.js. The shells pass the list in use, because a
   rule can be gated on the fleet list (Thunderhawk Annihilators, Crusade). */
export function fleetMatches(def, sh){ return DOMAIN.fleetMatches(def, sh, L()); }
export function defMatches(def, sh, arm){ return DOMAIN.defMatches(def, sh, arm, L()); }
export function defOptionMatches(def, sh, option){ return DOMAIN.defOptionMatches(def, sh, option, L()); }
export const uniqRefs = DOMAIN.uniqRefs, sourceStarDef = DOMAIN.sourceStarDef,
      weaponMentioned = DOMAIN.weaponMentioned, localRef = DOMAIN.localRef;
export function specialModel(sh){ return DOMAIN.specialModel(sh, L()); }
export function specialLines(sh){ return DOMAIN.specialLines(sh, L()); }
export function starredKeys(rules, sh){ return DOMAIN.starredKeys(rules, sh, L()); }


export function optStars(sh, o, rules){ return DOMAIN.optStars(sh, o, rules, L()); }

/* Armament table rows after the swap options have been applied. One source
   row can gain several alternatives (a Strike Cruiser's launch bays ->
   torpedo tubes OR a bombardment cannon). */
/* A weapon bought n times over. Only plain numbers add up - "4" x3 = "12",
   "1 / 1 squadron" x3 = "3 / 3 squadrons"; a dice expression like D6+2 is
   not a sum, so it keeps its text and gains "x3". Fleets p.432: each side
   set "gives both a port and a starboard weapon", so three sets are three
   of each. */
export function timesStrength(txt, n){ return DOMAIN.timesStrength(txt, n); }

export function armModel(u, sh, skip){ return DOMAIN.weaponRows(selOf(u), skip); }

/* Stat after the list's required changes. */
export function statMod(u, key){ return DOMAIN.statMod(selOf(u), key); }

/* How many times a repeatable option is taken. One unless the book allows
   more and the player asked for more. */
export function optCount(u, i){ return DOMAIN.optCount(selOf(u), i); }

/* A text stat set outright by a taken option: the Endeavour's prow armour
   becomes "6+ front / 5+" and its turns 45 degrees (Fleets p.72). mod adds to a
   number; set replaces a text. The last taken option wins. */
export function statSet(u, key){ return DOMAIN.statSet(selOf(u), key); }

/* Hits and shields after the options in force. */
export function effHits(u, sh){ return DOMAIN.effHits(selOf(u)); }
export function effShieldsText(u, sh){ return DOMAIN.effShieldsText(selOf(u)); }

export function effTurrets(u, sh){ return DOMAIN.effTurrets(selOf(u)); }

