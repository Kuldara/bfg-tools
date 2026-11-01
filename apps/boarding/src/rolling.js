/* Rolling the boarding action and the result's bookkeeping: criticals,
   damage allocation, catastrophic damage, repeated rolls. */

import { B } from "./catalogue.js";
import { S, eShip, eSide, profile } from "./state.js";
import { prep, render } from "./render.js";
import { clearPending, pending } from "./action.js";
import { drawResult } from "./result-view.js";
import { setFollowupFor } from "./events.js";

/* ------------------------------------------------------------------ rolling */
export var rng = Math.random;
export function roll(){ return 1 + Math.floor(rng()*6); }
var holoResult = null;
/* One save, for one hull, recorded on that hull so it survives everything until
   the attempt is over. */
export function doHolo(v, idx){
  var owed = prep.problems.filter(function(p){
    return p.level==="roll" && (!S.def.ships[p.idx] || !S.def.ships[p.idx].holo);
  });
  var need = null;
  for(var i=0;i<owed.length;i++) if(owed[i].idx === idx) need = owed[i];
  if(!need) need = owed[0];
  if(!need) return;
  var r = v || roll();
  var u = S.def.ships[need.idx];
  if(u) u.holo = (r >= need.target) ? "saved" : "failed";
  render();
}
/* A new attempt starts clean: nobody is still saved out of a fight that is over. */
export function clearHolo(){
  ["att","def"].forEach(function(k){
    S[k].ships.forEach(function(u){ delete u.holo; });
  });
}
export function doRoll(){
  var a = [], d = [];
  if(S.dice === "digital"){
    for(var i=0;i<prep.att.dice;i++) a.push(roll());
    for(var j=0;j<prep.def.dice;j++) d.push(roll());
  }else{
    a = (pending.att || []).slice(0, prep.att.dice);
    d = (pending.def || []).slice(0, prep.def.dice);
  }
  var rolls = {att:a, def:d};
  showResult({score:B.score(prep, rolls), rolls:rolls});
}

/* ------------------------------------------------------------------- result */
/* One boarding action produces, in order: the two scores, the damage the loser
   takes, and one critical-hit chance against EVERY ship involved (p.91).
   The app rolls all of it in one go; in hand-dice mode it asks for each roll. */
export var R = null;

export function livingIdx(k){
  var out = [];
  S[k].ships.forEach(function(u,i){ if(u.dp>0 && u.holo!=="saved") out.push(i); });
  return out;
}
export function shipName(k,i){ var u=S[k].ships[i], p=profile(u); return p?p.n:u.n; }
export function shipHp(k,i){ var p=profile(S[k].ships[i]); return p?p.hp:1; }

function buildCrits(){
  var sc = R.score, out = [];
  ["att","def"].forEach(function(k){
    var from = k==="att" ? "def" : "att";
    var need = (sc.winner===from) ? sc.critNeeds.win : sc.critNeeds.lose;
    var bonus = B.critBonus(eSide(from), eSide(from==="att"?"def":"att"));
    livingIdx(k).forEach(function(i){
      var c = {cid:"c"+(out.length), to:k, i:i, from:from, need:need, bonus:bonus,
               roll:null, hit:null, table:null, extra:null, followup:null};
      if(need > 6) c.hit = false;          /* this result causes none */
      else if(need === 0) c.hit = true;    /* Overwhelmed: automatic */
      out.push(c);
    });
  });
  return out;
}
/* Damage is distributed by the owning player (p.91); this is only the opening
   suggestion — one hull at a time, and any excess is wasted. */
function initAlloc(){
  var sc = R.score, a = {att:[], def:[]};
  ["att","def"].forEach(function(k){ a[k] = S[k].ships.map(function(){ return 0; }); });
  if(!sc.winner) return a;
  var left = sc.damage, ids = livingIdx(sc.loser);
  for(var n=0;n<ids.length && left>0;n++){
    var take = Math.min(S[sc.loser].ships[ids[n]].dp, left);
    a[sc.loser][ids[n]] = take; left -= take;
  }
  return a;
}
export function critTableIdFor(k,i){
  var sd = eSide(k);
  return B.critTableId(sd.ships[i], sd);
}
function criticalResultFor(k,i,n){
  var sd = eSide(k);
  return B.criticalResult(sd.ships[i], sd, n);
}
export function cataTableIdFor(k,i){
  var sd = eSide(k);
  return B.cataTableId(sd.ships[i], sd);
}
export function cataDiceFor(k,i){
  var sd = eSide(k);
  return B.cataDice(sd.ships[i], sd);
}
/* Every point the loser actually can take must be placed on a hull before the
   result may be applied, or damage would quietly vanish. */
export function allocDone(){
  var sc = R.score;
  if(!sc || !sc.winner || !sc.damage) return true;
  var ids = livingIdx(sc.loser);
  var pool = ids.reduce(function(n,i){ return n + S[sc.loser].ships[i].dp; },0);
  var cap = Math.min(sc.damage, pool);
  var used = ids.reduce(function(n,i){ return n + (R.alloc[sc.loser][i]||0); },0);
  return used >= cap;
}
function critFor(k,i){
  for(var n=0;n<R.crits.length;n++) if(R.crits[n].to===k && R.crits[n].i===i) return R.crits[n];
  return null;
}
/* What happens to one hull once everything is counted. */
export function outcome(k,i){
  var u = S[k].ships[i], hp = shipHp(k,i), es = eShip(u);
  var al = R.alloc[k][i]||0;
  var hits = R.crits.filter(function(x){ return x.to===k && x.i===i && x.hit; });
  var c = hits[0] || critFor(k,i);
  var ex = hits.reduce(function(n,x){ return n + (x.extra||0); }, 0);
  var afterBoarding = u.dp - al;
  var fin = Math.max(0, afterBoarding - ex);
  var st = "ok";
  if(hp<=1 && c && c.hit) st = "destroyed";          /* escorts die to any critical (p.66) */
  else if(fin<=0){
    if(hp<=1) st = "destroyed";
    else if(B.has(es,"fortress")) st = "quadrant";   /* the fort survives until all four are gone */
    else if(afterBoarding<=0) st = "hulk";           /* boarding damage: no catastrophic roll */
    else st = "cata";                                /* the critical's extra damage killed it */
  }
  return {dp:u.dp, alloc:al, extra:ex, fin:fin, state:st, crit:c, hp:hp};
}
export function cataNeeded(){
  var out = [];
  ["att","def"].forEach(function(k){
    livingIdx(k).forEach(function(i){ if(outcome(k,i).state==="cata") out.push({k:k,i:i}); });
  });
  return out;
}

function showResult(o){
  R = {score:o.score||null, holo:o.holo||null, rolls:o.rolls||{att:[],def:[]}, rrDice:{},
       stage:"main", crits:[], alloc:{att:[],def:[]}, cata:{}, rerolled:{}, seq:0};
  /* A re-roll is decided on the boarding result alone, so nothing else is
     rolled until the offer has been taken or passed (FL p.118, p.157, p.312). */
  if(R.score && prep && (prep.att.reroll || prep.def.reroll)) R.stage = "reroll";
  else startMain();
  document.getElementById("resultSheet").hidden = false;
  drawResult();
}
export function startMain(){
  R.stage = "main";
  if(R.score && R.score.winner){
    R.crits = buildCrits();
    R.alloc = initAlloc();
    if(S.dice === "digital") autoCrits();
  }
}
function autoCrits(){
  R.crits.forEach(function(c){
    if(c.need > 6){ c.hit = false; return; }
    if(c.need > 0){
      c.roll = roll();
      c.hit = (c.roll + c.bonus) >= c.need;
    } else c.hit = true;
    if(!c.hit) return;
    var tid = critTableIdFor(c.to, c.i);
    var T = B.CRIT_TABLES[tid];
    setTableFor(c, T ? (T.dice===1 ? roll() : roll()+roll()) : 0, tid);
  });
}
/* Escorts are destroyed outright and roll on no table at all (p.66, p.92). */
export function setTableFor(c, n, tid){
  tid = tid || critTableIdFor(c.to, c.i);
  var t = criticalResultFor(c.to, c.i, n);
  c.table = t; c.tableN = n;
  var variable = (t.extra==="D3" || t.extra==="D6");
  if(!variable) c.extra = t.extra || 0;
  else {
    /* the app rolls the extra damage too; by hand it is one more tap */
    c.extra = (S.dice==="digital")
      ? (t.extra==="D3" ? 1+Math.floor(rng()*3) : roll())
      : null;
  }
  c.followup = t.followup ? {rule:t.followup, roll:null, result:null} : null;
  if(c.followup && S.dice==="digital") setFollowupFor(c, roll());
  if(t.repeatCritical && !c.repeatQueued) queueRepeatCritical(c);
}
function queueRepeatCritical(c){
  c.repeatQueued = true;
  var more = {cid:"r"+(++R.seq), to:c.to, i:c.i, from:c.from, need:0, bonus:0,
              roll:null, hit:true, table:null, extra:null, followup:null, repeated:true,
              depth:(c.depth||0)+1};
  R.crits.push(more);
  if(S.dice==="digital"){
    var tid = critTableIdFor(more.to, more.i), T = B.CRIT_TABLES[tid];
    setTableFor(more, T.dice===1 ? roll() : roll()+roll(), tid);
  }
}
export function closeResult(){
  document.getElementById("resultSheet").hidden = true;
  clearPending();
  holoResult = null; R = null;
  render();
}
export function sideName(k){
  var s = S[k]; if(!s.ships.length) return k==="att"?"the boarder":"the defender";
  var names = s.ships.map(function(u){ var p=profile(u); return p?p.n:u.n; });
  return names.length===1 ? names[0] : names.join(" + ");
}
