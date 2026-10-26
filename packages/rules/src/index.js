/* The rules engine's public object, DOMAIN: the same keys in the same order as
   the one-file engine had (packages/rules/CONTRACT.md). build.js bundles this
   into domain.js, which the apps, the tests and the simulator load. */
import { shipFor, venerableView, SCHEMA_VERSION, SEP, TEXT_KEY_LEN, normOptText, textKey, optionIndex, upgradeId, splitUpgradeId, splitMembers, joinMembers, findEntry, findUpgradeEntry, fromLegacyUnit, toLegacyUnit, deepFreeze } from "./legacy.js";
import { lendVerdict, lendGrantFor, lendRowVerdict, lendSummary, lendOwnRoute, lendRouteFor, lendOfferable, sectionNeeds, hostReserveRow } from "./lending.js";
import { defaultUpgradeKeys, isUpgradeEnt, upgradeKey, selectionOf, optState, optCount, upState, bayStrength, prowArmour, upTokens, coveredByShipOption, upgradeTakenAnyWay, condOK, upgradesFor, requiredUpgradeKeys } from "./upgrades.js";
import { upCost, upgradePts, hullPts, pointsOf, maxPointsOf, timesStrength } from "./pricing.js";
import { weaponRows, statMod, statSet, effHits, effShieldsText, effTurrets, effSpeed } from "./weapons.js";
import { WEP, wepClass, rangeCell, RANGE_BANDS, pairRows, armAbbr, armStrength, armSummary, armSummaryRows, weaponBoxes, armSummaryText, ARM_ORDER, condShipOnly, requiredHullChanges } from "./arms.js";
import { isStationaryDefence, defenceOwnPoints, rowPurchase, rowStep, CRIP_LINE, REPAIR_LINE, CRIT_LINE, ESCORT_LINE, isSpaceHulk, isOrkHulk, isChaosHulk, hulkPage, crippledLine, criticalModel, repairLine, criticalTriggerLine, criticalTriggerHint, isMechanicusVessel, foreignReserveRow } from "./crits.js";
import { ownedText, starsForRow, hullOptionsOf, wepKey, SPECIAL_WEAPON_RULES, SPECIAL_HULL_RULES, fleetMatches, defMatches, defOptionMatches, uniqRefs, sourceStarDef, weaponMentioned, localRef, specialModel, specialLines, starredKeys, optStars } from "./special-rules.js";
import { commanderRules } from "./commanders.js";
import { validateIntent, transition } from "./validation.js";
import { resolveFleet } from "./resolve-fleet.js";
import { weaponState, optionsOf, upgradesOf, resolveUnit, RULE_CARDS, ruleCardOf, shipLeadership, rerollText, commanderRerollOffer, fleetRerolls, rerollBoxes, openRerolls, shipRerolls } from "./unit.js";

const DOMAIN = {
  /* P1-8c */
  weaponState: weaponState, optionsOf: optionsOf, upgradesOf: upgradesOf, resolveUnit: resolveUnit,
  RULE_CARDS: RULE_CARDS, ruleCardOf: ruleCardOf, shipLeadership: shipLeadership,
  isStationaryDefence: isStationaryDefence, defenceOwnPoints: defenceOwnPoints, rowPurchase: rowPurchase, rowStep: rowStep,
  ownedText: ownedText, starsForRow: starsForRow, hullOptionsOf: hullOptionsOf,
  shipFor: shipFor, venerableView: venerableView,
  defaultUpgradeKeys: defaultUpgradeKeys,
  commanderRules: commanderRules, validateIntent: validateIntent, transition: transition,
  resolveFleet: resolveFleet,
  lendVerdict: lendVerdict, lendGrantFor: lendGrantFor,
  lendRowVerdict: lendRowVerdict, lendSummary: lendSummary,
  lendOwnRoute: lendOwnRoute, lendRouteFor: lendRouteFor,
  lendOfferable: lendOfferable,
  /* P1-8b step 6 */
  WEP: WEP, wepClass: wepClass, wepKey: wepKey, rangeCell: rangeCell, RANGE_BANDS: RANGE_BANDS, pairRows: pairRows,
  CRIP_LINE: CRIP_LINE, REPAIR_LINE: REPAIR_LINE, CRIT_LINE: CRIT_LINE, ESCORT_LINE: ESCORT_LINE,
  isSpaceHulk: isSpaceHulk, isOrkHulk: isOrkHulk, isChaosHulk: isChaosHulk, hulkPage: hulkPage,
  crippledLine: crippledLine, criticalModel: criticalModel, repairLine: repairLine,
  criticalTriggerLine: criticalTriggerLine, criticalTriggerHint: criticalTriggerHint,
  isMechanicusVessel: isMechanicusVessel,
  armAbbr: armAbbr, armStrength: armStrength, armSummary: armSummary, armSummaryRows: armSummaryRows, weaponBoxes: weaponBoxes,
  rerollText: rerollText, commanderRerollOffer: commanderRerollOffer, fleetRerolls: fleetRerolls,
  rerollBoxes: rerollBoxes, openRerolls: openRerolls, shipRerolls: shipRerolls,
  armSummaryText: armSummaryText, ARM_ORDER: ARM_ORDER,
  condShipOnly: condShipOnly, requiredHullChanges: requiredHullChanges,
  sectionNeeds: sectionNeeds, hostReserveRow: hostReserveRow,
  foreignReserveRow: foreignReserveRow,
  SPECIAL_WEAPON_RULES: SPECIAL_WEAPON_RULES, SPECIAL_HULL_RULES: SPECIAL_HULL_RULES,
  fleetMatches: fleetMatches, defMatches: defMatches, defOptionMatches: defOptionMatches,
  uniqRefs: uniqRefs, sourceStarDef: sourceStarDef, weaponMentioned: weaponMentioned, localRef: localRef,
  specialModel: specialModel, specialLines: specialLines, starredKeys: starredKeys, optStars: optStars,
  SCHEMA_VERSION: SCHEMA_VERSION, SEP: SEP, TEXT_KEY_LEN: TEXT_KEY_LEN,
  normOptText: normOptText, textKey: textKey, optionIndex: optionIndex,
  upgradeId: upgradeId, splitUpgradeId: splitUpgradeId,
  splitMembers: splitMembers, joinMembers: joinMembers,
  findEntry: findEntry, findUpgradeEntry: findUpgradeEntry,
  fromLegacyUnit: fromLegacyUnit, toLegacyUnit: toLegacyUnit,
  deepFreeze: deepFreeze,
  /* P1-8b */
  isUpgradeEnt: isUpgradeEnt, upgradeKey: upgradeKey, selectionOf: selectionOf,
  optState: optState, optCount: optCount, upState: upState,
  bayStrength: bayStrength, prowArmour: prowArmour, upTokens: upTokens,
  coveredByShipOption: coveredByShipOption, upgradeTakenAnyWay: upgradeTakenAnyWay,
  condOK: condOK, upgradesFor: upgradesFor, requiredUpgradeKeys: requiredUpgradeKeys,
  upCost: upCost, upgradePts: upgradePts, hullPts: hullPts,
  pointsOf: pointsOf, maxPointsOf: maxPointsOf, timesStrength: timesStrength,
  weaponRows: weaponRows, statMod: statMod, statSet: statSet,
  effHits: effHits, effShieldsText: effShieldsText, effTurrets: effTurrets, effSpeed: effSpeed
};

export default DOMAIN;
