/* Squadron merge (user 31.10.2026): any two units of the fleet can be put
   into one squadron, from a menu in the open unit or by dropping one unit on
   the middle of another. "In such cases, a squadron merge (those Cobras and
   Hunters) ... a general merge function."

   A squadron is what it was before: cards with one letter (u.sq). Merging
   gives the target's letter, or a new one to both; the saved fleet, the
   rules, the printed sheet and Play see only the letters. What is new is
   that a borrowed ship (a reserve or an ally) can take a letter too, and
   that the menu names the units, not letters.

   Nothing is refused that the book only forbids: an ally in a core squadron
   (Fleets p. 16) or a Mechanicus vessel with Imperial Navy ones (Fleets
   p. 122) is merged and the squadron's row turns red with the sentence
   (DOMAIN checkSquadronMix). The menu says so beforehand on the choice.
   Escorts and capital ships are never offered to each other: the book
   counts them as different squadrons altogether (Rulebook p. 95, Fleets
   p. 13), and a drop of one on the other reorders.

   Da Ork Clanz keeps its own menus (Warlords, tiddlas, commandeered
   escorts), so it is left out here. */
import { L } from "./model.js";
import { save } from "./save.js";
import { appState } from "./state.js";
import { fleetResolved } from "./validation.js";
import { freeSqTag } from "./warlords.js";
import { esc, title } from "../../../packages/ui/format.js";

/* "escort", "capital" or "" (not a ship that can squadron: a commander, a
   fleet option, a stationary or escort-sized planetary defence, a Clanz
   list) */
export function mergeKind(i, RF){
  if(L().clanz) return "";
  const u = appState.S.units[i], R = (RF || fleetResolved()).units[i];
  if(!u || !R || R.kind !== "ship") return "";
  if(R.defence && (R.defence.stationary || R.squadron)) return "";
  return R.squadron ? "escort" : "capital";
}
/* the units of one letter, in fleet order */
const unitsOf = tag => appState.S.units.filter(x => x.sq === tag);
/* Short names for the menu: "Cobra ×6", "Hunter ×2 (reserve)" */
function shortName(u, R){
  const nm = title(R.className || "").replace(/\s+class\s+.*$/i, "");
  const n = R.hulls > 1 ? " \u00d7" + R.hulls : "";
  return nm + n + (u.lst ? " (" + (u.role === "ally" ? "ally" : "reserve") + ")" : "");
}
/* Would putting u with these units make a mix the book forbids? The same
   two tests as the domain's (checkSquadronMix), said in a word for the menu
   choice; the legality panel gives the sentence and page after the merge. */
const isMechU = u => /mechanicus/i.test(String(u.lst || L().nm));
export function mergeWarning(u, others){
  const all = [u].concat(others);
  const ally = all.filter(x => x.lst && x.role === "ally").length;
  if(ally && ally < all.length && !L().aux) return "ally into core: not legal";
  const mech = all.filter(isMechU).length;
  if(mech && mech < all.length) return "Mechanicus with others: not legal";
  return "";
}
/* What u can merge into: each squadron (a letter) and each unit alone of
   its kind, other than u's own squadron. [{ v, label, warn }] */
export function mergeTargets(i, RF){
  RF = RF || fleetResolved();
  const kind = mergeKind(i, RF), u = appState.S.units[i];
  if(!kind) return [];
  const out = [], seen = {};
  appState.S.units.forEach((x, j) => {
    if(j === i || mergeKind(j, RF) !== kind) return;
    if(x.sq){
      if(x.sq === u.sq || seen[x.sq]) return;
      seen[x.sq] = 1;
      const ms = unitsOf(x.sq).filter(y => mergeKind(appState.S.units.indexOf(y), RF) === kind);
      if(ms.length < 2){
        out.push({ v: "u:" + j, label: shortName(x, RF.units[j]), warn: mergeWarning(u, [x]) });
        return;
      }
      out.push({ v: "t:" + x.sq, label: "Squadron " + x.sq + ": " +
        ms.map(y => shortName(y, RF.units[appState.S.units.indexOf(y)])).join(" + "), warn: mergeWarning(u, ms) });
      return;
    }
    out.push({ v: "u:" + j, label: shortName(x, RF.units[j]), warn: mergeWarning(u, [x]) });
  });
  return out;
}
/* The open unit's menu. Shown once there is something to merge with, or
   while the unit is in a squadron (so it can leave it). */
export function mergeMenuHTML(i, RF){
  const u = appState.S.units[i], ts = mergeTargets(i, RF);
  const inSq = !!u.sq && unitsOf(u.sq).length >= 2;
  if(!ts.length && !inSq) return "";
  const opt = (v, lab) => `<option value="${esc(v)}">${esc(lab)}</option>`;
  return `<div class="uctl aboard merge"><span class="abl">Squadron</span><select class="mergein" data-u="${i}"
    title="Put this unit into one squadron with another (Fleets p. 13); a mix the book forbids is merged and shown red in Legality">${
    `<option value="" selected>${inSq ? "In squadron " + esc(u.sq) : "Alone"}</option>` +
    (ts.length ? `<optgroup label="Merge with">${ts.map(t => opt(t.v, t.label + (t.warn ? "  \u26a0 " + t.warn : ""))).join("")}</optgroup>` : "") +
    (inSq ? opt("leave", "Leave squadron " + u.sq) : "")}</select></div>`;
}
/* A letter left on one card only is dropped: a squadron of one is no
   squadron the player made. */
function tidy(tag){
  if(!tag) return;
  const ms = unitsOf(tag);
  if(ms.length === 1) delete ms[0].sq;
}
/* Merge unit u into target: another unit, or a letter. u then stands right
   after the squadron's last card, so the group is one block in the list.
   Returns the letter, or "" when nothing changed. */
export function mergeInto(u, target){
  const S = appState.S;
  if(!u || S.units.indexOf(u) < 0) return "";
  let tag;
  if(typeof target === "string") tag = target;
  else {
    if(!target || target === u) return "";
    tag = target.sq && unitsOf(target.sq).length ? target.sq : "";
    if(!tag){ tag = u.sq && unitsOf(u.sq).length === 1 ? u.sq : freeSqTag(); target.sq = tag; }
  }
  if(u.sq === tag && unitsOf(tag).length >= 2) return "";
  const old = u.sq;
  u.sq = tag;
  if(old && old !== tag) tidy(old);
  /* place u after the squadron's last card */
  S.units.splice(S.units.indexOf(u), 1);
  const last = S.units.reduce((a, x, j) => x.sq === tag ? j : a, -1);
  S.units.splice(last + 1, 0, u);
  appState.JUST = { unit: u, merged: tag };
  appState.MIXOPEN = appState.MIXOPEN || new Set();
  save();
  return tag;
}
export function leaveSquadron(u){
  if(!u || !u.sq) return;
  const old = u.sq;
  delete u.sq;
  tidy(old);
  appState.JUST = { unit: u, split: old };
  save();
}
/* the menu's choice: "u:<index>", "t:<letter>" or "leave" */
export function mergeChoice(u, v){
  if(!v) return "";
  if(v === "leave"){ leaveSquadron(u); return "leave"; }
  if(/^t:/.test(v)) return mergeInto(u, v.slice(2));
  if(/^u:/.test(v)) return mergeInto(u, appState.S.units[+v.slice(2)]);
  return "";
}
/* Can the unit at index `from` be dropped onto this fleet row to merge?
   row: a unit row (data-ui) or a squadron's group row (data-mixtag). */
export function dropMergeTarget(from, row, RF){
  RF = RF || fleetResolved();
  const kind = mergeKind(from, RF), u = appState.S.units[from];
  if(!kind || !u) return null;
  if(row.dataset.mixtag != null){
    const tag = row.dataset.mixtag, ms = unitsOf(tag);
    if(!ms.length || u.sq === tag) return null;
    if(mergeKind(appState.S.units.indexOf(ms[0]), RF) !== kind) return null;
    return { tag, warn: mergeWarning(u, ms) };
  }
  const j = +row.dataset.ui, t = appState.S.units[j];
  if(!(j >= 0) || !t || j === from || mergeKind(j, RF) !== kind) return null;
  if(u.sq && t.sq === u.sq) return null;
  return { unit: t, warn: mergeWarning(u, t.sq ? unitsOf(t.sq) : [t]) };
}
