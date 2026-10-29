/* The rules reference sheet, and resetting a side or the whole battle. */

import { B } from "./catalogue.js";
import { S, blankSide, blankState, clearProfiles, setState } from "./state.js";
import { esc, render } from "./render.js";
import { clearPending, resetRound } from "./action.js";
import { closeSheet, openSheet } from "./sheets.js";
import { critTableIdFor } from "./rolling.js";

/* --------------------------------------------------------------- reference */
function refResults(){
  var h = ['<div class="mline tot"><span class="v"></span><span class="t"><b>Difference in scores</b></span><span class="p">p.90</span></div>'];
  B.RESULTS.forEach(function(r){
    if(r.diff===0){
      h.push('<div class="mline"><span class="v num">0</span><span class="t">Draw — the ships grapple and fight again every End Phase</span></div>');
      return;
    }
    var w = r.win===0?"auto":r.win+"+", l = r.lose>6?"none":r.lose+"+";
    h.push('<div class="mline"><span class="v num">'+(r.diff===5?"5+":r.diff)+'</span><span class="t"><b>'+
      r.name+'</b> — critical hits '+w+' / '+l+'</span></div>');
  });
  h.push('<div class="mline sub"><span class="v"></span><span class="t">The loser takes one damage point per point it lost by. A ship reduced to 0 damage points by a boarding action is automatically a drifting hulk — no Catastrophic Damage roll. Brace For Impact does not protect against boarding damage or boarding criticals (p.66).</span></div>');
  return h;
}
function refCrits(){
  /* the table shown is the one the ships actually on the board will roll on */
  var tid = "standard";
  ["def","att"].some(function(k){
    if(!S[k].ships.length) return false;
    var t = critTableIdFor(k, 0);
    if(t !== "escort" && t !== "plus1" && B.CRIT_TABLES[t] && t !== "standard"){ tid = t; return true; }
    return false;
  });
  var T = B.CRIT_TABLES[tid];
  var h = ['<div class="mline tot"><span class="v"></span><span class="t"><b>'+
    (T.dice===1?"D6":"2D6")+' '+esc(T.label)+'</b></span><span class="p">'+esc(T.page)+'</span></div>'];
  T.rows.forEach(function(r){
    h.push('<div class="mline"><span class="v num">'+(r.lo===r.hi?r.lo:r.lo+"-"+r.hi)+
      '</span><span class="t">'+esc(r.name)+
      (r.extra? ' <span style="color:var(--warn)">+'+r.extra+' damage</span>':'')+'</span></div>');
  });
  h.push('<div class="mline sub"><span class="v"></span><span class="t">Escorts are destroyed by any critical hit. A critical that cannot be applied becomes the next highest instead. Only these two rolls happen — damage points inflicted by a boarding action never cause further criticals.</span></div>');
  return h;
}
function refSeq(){
  return [
  '<div class="mline tot"><span class="v"></span><span class="t"><b>End Phase, step 1</b></span><span class="p">p.88</span></div>',
  '<div class="mline"><span class="v">1</span><span class="t">Declared in the <b>Movement Phase</b> when base contact was made. Those ships may not fire or launch ordnance this turn.</span></div>',
  '<div class="mline"><span class="v">2</span><span class="t">Boarding value = damage points remaining, modified. The ship <b>being boarded</b> adds its remaining turrets.</span></div>',
  '<div class="mline"><span class="v">3</span><span class="t">Both roll a D6 and add modifiers. Only the highest boarding-value modifier applies; the rest are cumulative.</span></div>',
  '<div class="mline"><span class="v">4</span><span class="t">Highest total wins. Totals are not capped at 6.</span></div>',
  '<div class="mline"><span class="v">5</span><span class="t">Never initiate in the enemy’s turn; you always defend normally.</span></div>',
  '<div class="mline sub"><span class="v"></span><span class="t">Multi-ship: several ships may board one enemy, or one ship may board several. Resolve them together (each side\'s values added and race modifiers counted once) or separately. The losing side\'s owner distributes the damage, and a critical is rolled against every ship involved.</span></div>'];
}
function refMulti(){
  return [
  '<div class="mline tot"><span class="v">1</span><span class="t"><b>Combine each side</b> — add the boarding values of every participating ship. The defender also adds all remaining turrets or spore cysts. Side-wide race and situation modifiers are counted once unless a rule names each ship separately.</span></div>',
  '<div class="mline"><span class="v">2</span><span class="t"><b>One opposed roll per side.</b> Each side rolls only once and adds its combined modifiers. Tyranids still roll 2D6 and keep the highest.</span></div>',
  '<div class="mline"><span class="v">3</span><span class="t"><b>Boarding damage goes to the losing side.</b> The score difference is the damage pool. The losing side\'s owner distributes it among their participating ships, up to each ship\'s remaining DP; excess is wasted.</span></div>',
  '<div class="mline"><span class="v">4</span><span class="t"><b>Both sides can still cause criticals.</b> Use the winner or loser critical threshold printed for the result. Each side makes one critical check against <b>every enemy ship</b> involved. A Grapple causes no criticals.</span></div>',
  '<div class="mline"><span class="v">5</span><span class="t"><b>A critical belongs to its target ship.</b> Roll that ship\'s own critical table. Its extra damage is not part of the shared damage pool and cannot be moved to another ship. Any critical destroys an escort.</span></div>',
  '<div class="mline tot"><span class="v">EX</span><span class="t"><b>Strike Cruiser vs four Vanguard drones:</b> after the one opposed roll, the Strike Cruiser\'s side checks for a critical separately against all four drones. The Tyranid group checks once against the Strike Cruiser. If the drones lose, their owner divides the boarding damage between them; if the cruiser loses, it takes the whole pool.</span></div>',
  '<div class="mline sub"><span class="v"></span><span class="t">Digital mode rolls all checks automatically. Hand-dice mode asks for them one target ship at a time. One-against-many follows the creator clarification recorded in LUEMINUT decision 16.</span></div>'];
}
/* Set by the build: the build date and the number of ships. */
var BUILD = typeof __BUILD__ !== "undefined" ? __BUILD__ : "dev";
function refBattle(){
  return ['<div class="mline tot"><span class="v"></span><span class="t"><b>This battle</b></span></div>',
    '<div class="mline sub"><span class="v"></span><span class="t">Both fleets, both ships, their '+
    'upgrades and their damage points are remembered in this browser until you change them, so the '+
    'next End Phase is one tap away.</span></div>',
    '<div class="mline sub"><span class="v"></span><span class="t">Applying damage writes the new '+
    'damage points straight onto the two ships on the board.</span></div>',
    '<div class="mline sub"><span class="v"></span><span class="t">Build <b>'+esc(BUILD)+
    '</b>. If you report something, this is the number that says which version you have.</span></div>',
    '<button class="opt" data-pick="reset" style="margin-top:6px"><span class="box">↺</span>'+
    '<span class="txt"><b>Start over</b><span>Forget both fleets and begin a new battle.</span></span></button>'];
}
export function showRef(tab){
  var tabs = ["Order","Multi","Results","Crits","Battle"];
  openSheet({title:"Reference", sub:"Rulebook v1.11", mode:"list", tabs:tabs, tab:tab===undefined?2:tab,
    items:function(ti){ return ti===0?refSeq() : ti===1?refMulti() : ti===3?refCrits() : ti===4?refBattle() : refResults(); },
    onPick:function(v){
      if(v!=="reset") return;
      askReset(null);
    }});
}

function clearBattle(){
  var dice = S.dice;
  setState(blankState()); S.dice = dice;
  clearProfiles(); clearPending();
  closeSheet(); render();
}
function clearSide(k){
  S[k] = blankSide();
  resetRound(); closeSheet(); render();
}
export function askReset(k){
  var whole = !k, label = whole ? "whole battle" : (k==="att" ? "Boarder side" : "Defender side");
  openSheet({title:"Reset "+label, sub:"This cannot be undone", mode:"list",
    items:function(){ return [
      '<div class="mline tot"><span class="v">&#8634;</span><span class="t"><b>'+
      (whole?'Clear both sides?':'Clear '+label+'?')+'</b><br>'+
      (whole?'Fleets, ships, damage points and battle conditions will be removed. Your dice preference stays the same.':'Its fleet, ships, damage points and conditions will be removed. The other side stays untouched.')+'</span></div>',
      '<button class="opt" data-pick="confirm" style="border-color:#5c3a36"><span class="box" style="border-color:#5c3a36;color:#e0584a">&#10005;</span><span class="txt"><b>Yes, reset '+label+'</b><span>Remove the saved setup now.</span></span></button>'
    ]; },
    onPick:function(v){ if(v==="confirm") { if(whole) clearBattle(); else clearSide(k); } }
  });
}
