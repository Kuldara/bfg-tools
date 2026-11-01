import { appState } from "./state.js";
import { MID, TIMES } from "./helpers.js";
import { OPT } from "./storage.js";
import { critLabel } from "./actions.js";
import { repairable } from "./share.js";
import { esc } from "../../../packages/ui/format.js";
import PLAY from "../rules.js";

/* ==================================================== REPAIR WITH ONE TAP == */
/* Damage control (p. 88) as one tap beside the criticals: the page rolls the
   ship's dice, repairs what they allow and burns the fires left (p. 67). The
   player picks only when the sixes cannot repair everything and there is more
   than one kind to choose from: the book leaves the choice to the ship. What
   happened stays on one line under the chips until the next tap elsewhere; no
   toast and no window to close. UNDO takes the whole roll back. RULINGS.md T45. */

/* which End Phase this is: both players repair in every End Phase (p. 88). The
   orders track knows whose turn it is; without it the page cannot tell, so a
   second roll is left open, as the fire button's is. */
const phaseKey = () => appState.G.fleet.turn + (appState.G.fleet.mine ? "m" : "e");
export const repairOpen = (R, st) => PLAY.activeCrits(st, R).filter(c => repairable(R, c.key));
export function canRepair(i){
  const R = appState.U[i].R, st = appState.G.st[i];
  return R.kind === "ship" && !PLAY.isEscort(R) && !PLAY.isFort(R) && !PLAY.destroyed(R, st) && !st.hulkName && repairOpen(R, st).length > 0;
}
const rolledAlready = st => OPT.orders && st.repPhase === phaseKey();

/* what is left after the repairs: a fire not put out costs its hit (p. 67) */
function burn(i, note){
  const R = appState.U[i].R, st = appState.G.st[i], fleet = appState.G.fleet;
  if(!PLAY.standardCrits(R) || !PLAY.activeCrits(st, R).some(c => c.key === "7")) return;
  const n = Math.max(1, PLAY.fireDamage(R, st));
  PLAY.addHits(R, st, n);
  st.fireN = st.fireTurn === fleet.turn ? (st.fireN | 0) + 1 : 1; st.fireTurn = fleet.turn;
  note.push("Fire: +" + n + " hit" + (n > 1 ? "s" : "") + " (p. 67)");
}
/* a result's name without its number and "+1", as on the chips */
const critWord = (R, key) => critLabel(R, key).replace(/^\S+\s+/, "").replace(/\s*\*\s*$/, "").split(/\s+\+/)[0];
const fixedWord = (R, key) => critWord(R, key) + " repaired";
export function rollRepair(i, rng, half){
  const R = appState.U[i].R, st = appState.G.st[i];
  if(!canRepair(i) || st.repPick || rolledAlready(st)) return false;
  const plan = PLAY.repairPlan(R, st, half), r = PLAY.repairRoll(plan, rng);
  st.repPhase = phaseKey();
  const head = plan.dice + "D6: " + r.faces.join(" ") + " " + MID + " ";
  const note = [];
  let left = r.hits;
  /* nothing to choose: every result goes, or there is only one kind */
  while(left > 0 && repairOpen(R, st).length){
    const open = repairOpen(R, st);
    if(open.length > 1 && left < open.reduce((a, c) => a + c.count, 0)) break;
    const key = open[0].key;
    PLAY.repairCrit(st, key, R); note.push(fixedWord(R, key)); left--;
  }
  const word = plan.target === 6 ? "six" : "success";
  const count = (r.hits || "no") + " " + word + (r.hits === 1 ? "" : "es");
  if(left > 0 && repairOpen(R, st).length){
    st.repPick = left;
  }else burn(i, note);
  setNote(i, head + count + (note.length ? ": " + note.join(", ") : r.hits ? "" : ", nothing repaired"));
  return true;
}
export function pickRepair(i, key){
  const R = appState.U[i].R, st = appState.G.st[i];
  if(!st.repPick) return false;
  PLAY.repairCrit(st, key, R);
  const note = [fixedWord(R, key)];
  st.repPick--;
  if(!repairOpen(R, st).length) st.repPick = 0;
  if(!st.repPick){ delete st.repPick; burn(i, note); }
  const had = (appState.V.repNote || {})[i] || "";
  setNote(i, had + (had ? ", " : "") + note.join(", "));
  return true;
}
/* every ship with something to repair, from the End Phase panel */
export function rollAllRepairs(rng){
  let any = false;
  appState.U.forEach((x, i) => { if(canRepair(i) && rollRepair(i, rng)) any = true; });
  return any;
}
export function anyRepairRoll(){
  return appState.U.some((x, i) => canRepair(i) && !appState.G.st[i].repPick && !rolledAlready(appState.G.st[i]));
}
function setNote(i, text){ appState.V.repNote = appState.V.repNote || {}; appState.V.repNote[i] = text; }
export function clearRepairNotes(){ appState.V.repNote = null; }

/* the button: beside the chips, so the row of big buttons never moves */
export function repairBtn(i){
  if(!canRepair(i)) return "";
  const R = appState.U[i].R, st = appState.G.st[i];
  if(st.repPick) return "";
  const p = PLAY.repairPlan(R, st), done = rolledAlready(st);
  /* without the orders track the second roll is seen, not blocked */
  const again = !OPT.orders && st.repPhase === phaseKey() ? "again " : "";
  /* the page does not count Blast Markers: the player says when one touches */
  const h = PLAY.repairPlan(R, st, true);
  const halfBtn = done || h.dice === p.dice ? "" : `<button class="repb" data-act="repairroll" data-i="${i}" data-arg="half" title="With Blast Markers in contact: half the dice, rounding up (p. 88)">Blast Marker <b>${h.dice}D6</b></button>`;
  return `<button class="repb" data-act="repairroll" data-i="${i}"${done ? " disabled" : ""} title="End Phase damage control: roll, repair, and a fire left costs its hit (p. 88, 67). UNDO takes it back.">${done ? "Repair rolled" : `Repair ${again}<b>${p.dice}D6</b>${p.target !== 6 ? " " + p.target + "+" : ""}`}</button>${halfBtn}`;
}
/* the line under the chips: what the roll did, and the choice if there is one */
export function repairLines(i){
  const note = (appState.V.repNote || {})[i], st = appState.G.st[i], R = appState.U[i].R;
  const pick = st.repPick && R.kind === "ship" && repairOpen(R, st).length ? `<div class="reppick"><span>${st.repPick} to repair:</span>${repairOpen(R, st).map(c =>
    `<button data-act="repairpick" data-i="${i}" data-arg="${esc(c.key)}">${esc(critWord(R, c.key))}${c.count > 1 ? " " + TIMES + c.count : ""}</button>`).join("")}</div>` : "";
  return (note ? `<p class="repnote">Repair ${esc(note)}</p>` : "") + pick;
}
