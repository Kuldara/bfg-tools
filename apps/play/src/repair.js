import { appState } from "./state.js";
import { MID, TIMES } from "./helpers.js";
import { OPT } from "./storage.js";
import { critLabel } from "./actions.js";
import { repairable } from "./share.js";
import { esc } from "../../../packages/ui/format.js";
import PLAY from "../rules.js";

/* ==================================================== REPAIR WITH ONE TAP == */
/* Damage control (p. 88), in the critical table: the page rolls the ship's dice
   and each success is a wrench, spent by tapping what to repair; the book leaves
   the choice to the ship. When the wrenches are spent the fires left burn (p. 67).
   With Auto repair on (the menu) the button is on the card as well, and the page
   repairs at once whenever there is nothing to choose. What happened stays on
   one line until the next tap elsewhere. UNDO takes it back. RULINGS.md T45. */

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
  while(OPT.autorepair && left > 0 && repairOpen(R, st).length){
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
  return OPT.autorepair && appState.U.some((x, i) => canRepair(i) && !appState.G.st[i].repPick && !rolledAlready(appState.G.st[i]));
}
function setNote(i, text){ appState.V.repNote = appState.V.repNote || {}; appState.V.repNote[i] = text; }
export function clearRepairNotes(){ appState.V.repNote = null; }

/* a wrench for the roll, a burst for a Blast Marker in contact */
const WRENCH = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 7a5.5 5.5 0 0 1-7.4 5.2L6.8 19a2.3 2.3 0 0 1-3.3-3.3l6.8-6.8A5.5 5.5 0 0 1 17 1.5l-3.3 3.3 1 3.5 3.5 1L21.5 6z"/></svg>';
export const BURST = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 1l2.3 6.2L19.8 4l-2.6 5.8L23 12l-5.8 2.2 2.6 5.8-5.5-3.2L12 23l-2.3-6.2L4.2 20l2.6-5.8L1 12l5.8-2.2L4.2 4l5.5 3.2z"/></svg>';
/* the button: beside the chips, so the row of big buttons never moves */
export function repairBtn(i, inTable){
  if(!canRepair(i) || (!inTable && !OPT.autorepair)) return "";
  const R = appState.U[i].R, st = appState.G.st[i];
  if(st.repPick) return "";
  const p = PLAY.repairPlan(R, st), done = rolledAlready(st);
  /* without the orders track the second roll is seen, not blocked */
  const again = !OPT.orders && st.repPhase === phaseKey() ? "again " : "";
  /* the page does not count Blast Markers: the player says when one touches */
  const h = PLAY.repairPlan(R, st, true);
  const halfBtn = done || OPT.blast || h.dice === p.dice ? "" : `<button class="repb bm" data-act="repairroll" data-i="${i}" data-arg="half" aria-label="Repair with Blast Markers in contact: ${h.dice}D6" title="With Blast Markers in contact: half the dice, rounding up (p. 88)">${BURST}<b>${h.dice}D6</b></button>`;
  return `<button class="repb" data-act="repairroll" data-i="${i}"${done ? " disabled" : ""} title="End Phase damage control: roll, repair, and a fire left costs its hit (p. 88, 67). UNDO takes it back.">${WRENCH}${done ? "Repair rolled" : `Repair ${again}<b>${p.dice}D6</b>${p.target !== 6 ? " " + p.target + "+" : ""}`}</button>${halfBtn}`;
}
/* The critical table's own: the two rolls and why there are two, or the wrenches
   to spend. With Blast Markers tracked the ship's own state is marked as the
   likely one; the other stays, for a marker the switch has not caught up with. */
function repairChoice(i){
  const R = appState.U[i].R, st = appState.G.st[i];
  if(!canRepair(i) || st.repPick) return "";
  if(rolledAlready(st)) return repairBtn(i, true);
  const full = PLAY.repairPlan(R, st, false), part = PLAY.repairPlan(R, st, true), to = full.target !== 6 ? full.target + "+" : "6";
  const opt = (arg, icon, name, p, when, rec) => `<button class="repopt${rec ? " rec" : ""}" data-act="repairroll" data-i="${i}" data-arg="${arg}">${icon}<span><b>${name} ${p.dice}D6</b><small>${when}</small></span></button>`;
  /* one hit left, or Repulsor Shielding: the two are the same roll */
  if(full.dice === part.dice) return `<div class="repopts">${opt("full", WRENCH, "Repair", full, "each " + to + " repairs one", true)}</div>`;
  return `<p class="repwhy">One die per hit left, each ${to} repairs one. A Blast Marker touching the ship halves the dice (p. 88).</p>
    <div class="repopts">${opt("full", WRENCH, "Full repair", full, "no Blast Marker touching", !st.blast)}${opt("half", BURST, "Half repair", part, "a Blast Marker touching", OPT.blast && !!st.blast)}</div>`;
}
export function repairPanel(i){
  if(!canRepair(i) && !(appState.V.repNote || {})[i]) return "";
  return `<div class="reppanel">${repairChoice(i)}${repairLines(i, true)}</div>`;
}
/* the line under the chips: what the roll did, and the choice if there is one */
export function repairLines(i, inTable){
  if(!inTable && !OPT.autorepair) return "";
  const note = (appState.V.repNote || {})[i], st = appState.G.st[i], R = appState.U[i].R;
  const pick = st.repPick && R.kind === "ship" && repairOpen(R, st).length ? `<div class="reppick"><span class="wrenches" aria-label="${st.repPick} to spend">${`<i>${WRENCH}</i>`.repeat(st.repPick)}</span><span>Repair:</span>${repairOpen(R, st).map(c =>
    `<button data-act="repairpick" data-i="${i}" data-arg="${esc(c.key)}">${esc(critWord(R, c.key))}${c.count > 1 ? " " + TIMES + c.count : ""}</button>`).join("")}</div>` : "";
  return (note ? `<p class="repnote">Repair ${esc(note)}</p>` : "") + pick;
}
