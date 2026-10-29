/* The action bar under the sides: the boarding values and both sides' dice. */

import { FLEETS } from "./catalogue.js";
import { S, profile, ready, unknownShips } from "./state.js";
import { esc, prep } from "./render.js";
import { livingIdx } from "./rolling.js";

/* ------------------------------------------------------------------- action */
export var pending = {att:[], def:[]};
export function resetRound(){ S.round = 1; pending = {att:[], def:[]}; }
export function renderAct(){
  var act = document.getElementById("act");
  var h = [];
  if(!ready()){
    h.push('<button class="bigBtn" disabled>Choose both ships</button>');
    act.innerHTML = h.join(""); return;
  }
  var bad = unknownShips();
  if(bad.length){
    h.push('<div class="warn"><b>✖</b><div>This saved game names a ship the app does not know: <b>'+
      esc(bad.join(", "))+'</b>. Tap it and pick it again.</div></div>');
    h.push('<button class="bigBtn" disabled>Unknown ship</button>');
    act.innerHTML = h.join(""); return;
  }
  var holo = prep.problems.filter(function(p){return p.level==="roll";});
  /* If every defending hull that could still fight saved, there is no boarding
     action left to resolve. The engine no longer reports those ships at all, so
     this has to be read off the hulls themselves. */
  var anySaved = S.def.ships.some(function(u){ return u.holo==="saved"; });
  var anyLeft = S.def.ships.some(function(u){ return u.dp>0; });
  if(anySaved && anyLeft && !livingIdx("def").length){
    var savedNames = S.def.ships.filter(function(u){ return u.holo==="saved"; })
      .map(function(u){ var p=profile(u); return p?p.n:u.n; });
    h.push('<div class="warn note"><b>✔</b><div><b>'+(fieldWord()==="shadowfields"?"Shadowfields":"Holofields")+' hold.</b> '+
      esc(savedNames.join(", "))+' ignored the boarding attempt. Place a Blast Marker in contact '+
      'with each of them. Nothing else happens this End Phase.</div></div>');
    h.push('<button class="bigBtn" data-a="holodone">Done</button>');
    act.innerHTML = h.join(""); return;
  }
  var stops = prep.problems.filter(function(p){return p.level==="stop";});
  if(stops.length){
    h.push('<div class="warn"><b>✖</b><div>'+stops.map(function(p){return esc(p.text);}).join("<br>")+'</div></div>');
    h.push('<button class="bigBtn" disabled>No boarding action</button>');
    act.innerHTML = h.join(""); return;
  }
  var notes = prep.problems.filter(function(p){return p.level==="note";});
  if(notes.length){
    h.push('<div class="warn note"><b>✔</b><div>'+notes.map(function(p){return esc(p.text);}).join("<br>")+'</div></div>');
  }
  var rules = prep.problems.filter(function(p){return p.level==="rule";});
  if(rules.length){
    h.push('<div class="warn rule" data-a="rulehelp"><b>!</b><div>'+
      rules.map(function(p){return esc(p.text);}).join("<br>")+'</div></div>');
  }
  /* Every defending hull with holofields owes its own save (FL p.305-306: the
     save is rolled once against each attack, by the ship being attacked). */
  var owed = holo.filter(function(p){ return !S.def.ships[p.idx] || !S.def.ships[p.idx].holo; });
  if(owed.length){
    var first = owed[0];
    h.push('<div class="warn note"><b>⚑</b><div>'+esc(first.text)+
      (owed.length>1 ? '<br><b>'+owed.length+' hulls still owe a save.</b>' : '')+'</div></div>');
    if(S.dice==="digital"){
      h.push('<button class="bigBtn" data-a="holo" data-i="'+first.idx+'">Roll '+esc(first.field||"holofields")+
        (owed.length>1 ? '<small>'+esc(first.ship)+'</small>' : '')+'</button>');
    }else{
      h.push(holoRow(first));
    }
    act.innerHTML = h.join(""); bindDice(); return;
  }
  var saved = S.def.ships.filter(function(u){ return u.holo==="saved"; });
  if(saved.length){
    h.push('<div class="warn note"><b>✔</b><div>'+
      esc(saved.map(function(u){ var p=profile(u); return p?p.n:u.n; }).join(", "))+
      ' saved and '+(saved.length===1?"is":"are")+' out of this action — place a Blast Marker in contact. '+
      'The boarding action continues against the rest.</div></div>');
  }
  if(S.att.ships.length>1 || S.def.ships.length>1){
    h.push('<button class="multiBtn" data-a="multihelp"><b>Multi-boarding '+S.att.ships.length+' &#8596; '+
      S.def.ships.length+'</b><span>one roll per side · critical check against every enemy ship · loser splits damage</span></button>');
  }
  if(S.dice==="digital"){
    h.push('<button class="bigBtn" data-a="roll">Resolve<small>'+
      esc(diceInfo(prep.att).short)+(prep.att.modSum?" "+fmt(prep.att.modSum):"")+
      '  vs  '+esc(diceInfo(prep.def).short)+
      (prep.def.modSum?" "+fmt(prep.def.modSum):"")+'</small></button>');
  }else if(prep.att.dice===0 && prep.def.dice===0){
    h.push('<button class="bigBtn" data-a="roll">Resolve<small>neither side rolls a die</small></button>');
  }else{
    h.push(dieRow("att","Boarder",prep.att));
    h.push(dieRow("def","Defender",prep.def));
  }
  act.innerHTML = h.join("");
  bindDice();
}
export function fmt(n){ return (n>=0?"+":"")+n; }
/* One vocabulary for "what does this side roll", used on the card, on the
   Resolve button, in the modifier list and on the result. */
export function diceInfo(p){
  if(!p) return null;
  if(p.dice===0) return {kind:"none", short:"no dice", long:"No crew — adds no dice at all"};
  if(p.dice===1) return {kind:"one", short:"D6", long:"D6"};
  if(p.pick==="low") return {kind:"low", short:"2D6 lowest", long:"2D6 — keep the LOWEST",
    arrow:"\u25BC", n:"2D6"};
  return {kind:"high", short:"2D6 highest", long:"2D6 — keep the highest",
    arrow:"\u25B2", n:"2D6"};
}
export function diceStrip(p){
  var d = diceInfo(p);
  var byHand = p && p.diceByHand ? ' · by hand' : '';
  if(!d) return "";
  if(d.kind==="one") return p && p.diceByHand
    ? '<div class="diceStrip none">D6 · set by hand</div>' : "";
  if(d.kind==="none") return '<div class="diceStrip none">no crew · no dice</div>';
  return '<div class="diceStrip '+d.kind+'"><span class="arrow">'+d.arrow+'</span><b>'+d.n+
    '</b>keep the '+(d.kind==="low"?"lowest":"highest")+esc(byHand)+'</div>';
}
/* Two dice means two rows: the app compares them, so the player never has to
   work out which one counts. */
/* The defender's save is "shadowfields" on a Dark Eldar ship (FL p.344),
   "holofields" on an Eldar one (FL p.305): the same save under two names. */
export function fieldWord(){ return S.def.f>=0 && FLEETS[S.def.f].race==="darkeldar" ? "shadowfields" : "holofields"; }
function holoRow(pr){
  var h = ['<div class="dieRow def"><div class="lab def-lab">'+esc(pr.ship.slice(0,9))+
    '<br><span style="color:var(--dim)">'+pr.target+'+</span></div>'];
  for(var i=1;i<=6;i++) h.push('<button class="die" data-die="holo" data-idx="'+pr.idx+
    '" data-v="'+i+'">'+i+'</button>');
  h.push('</div>');
  return h.join("");
}
function dieRow(which,label,p){
  var cls = which==="def"?"def":"att";
  var d = diceInfo(p);
  if(p && p.dice===0){
    return '<div class="dieRow '+cls+'"><div class="lab '+cls+'-lab">'+label+'</div>'+
      '<div class="die" style="flex:1;color:var(--dimmer);font-size:13px">no crew — no dice</div></div>';
  }
  var n = p ? p.dice : 1, h = [];
  for(var r=0;r<n;r++){
    var lab = n===1 ? label
      : (r===0 ? label+'<br><span style="color:var(--dim)">die 1 of '+n+'</span>'
               : '<span style="color:var(--dim)">die '+(r+1)+'</span><br>'+
                 '<span class="'+d.kind+'-mark">'+d.arrow+' '+(d.kind==="low"?"low":"high")+'</span>');
    h.push('<div class="dieRow '+cls+'" data-row="'+which+'">');
    h.push('<div class="lab '+cls+'-lab">'+lab+'</div>');
    for(var i=1;i<=6;i++){
      h.push('<button class="die'+((pending[which]||[])[r]===i?" sel":"")+'" data-die="'+which+
        '" data-idx="'+r+'" data-v="'+i+'">'+i+'</button>');
    }
    h.push('</div>');
  }
  return h.join("");
}
function bindDice(){
  if(S.dice==="physical" && prep){
    ["att","def"].forEach(function(k){
      if(!Array.isArray(pending[k])) pending[k] = [];
      if(prep[k].dice === 0) pending[k] = [];
      if(pending[k].length > prep[k].dice) pending[k].length = prep[k].dice;
    });
  }
}
export function diceReady(k){
  if(!prep) return false;
  if(prep[k].dice === 0) return true;
  var got = pending[k] || [];
  for(var i=0;i<prep[k].dice;i++) if(!got[i]) return false;
  return true;
}

/* set from the other modules (a module cannot assign another module's variable) */
export function clearPending(){ pending = {att:[], def:[]}; }
