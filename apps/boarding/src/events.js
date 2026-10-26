/* The clicks on the board and on the result sheet, and what they change. */

import { B } from "./catalogue.js";
import { S, cloneUnit, eShip, eSide, profile } from "./state.js";
import { esc, prep, render } from "./render.js";
import { diceReady, pending, resetRound } from "./action.js";
import { openSheet, pickDp, pickFleet, pickShip, showMods, showValue } from "./sheets.js";
import { shipOpts } from "./ship-options.js";
import { R, cataDiceFor, cataNeeded, cataTableIdFor, clearHolo, closeResult, critTableIdFor, doHolo, doRoll, livingIdx, outcome, rng, roll, setTableFor, shipName, startMain } from "./rolling.js";
import { drawResult, reroll, rerollDie } from "./result-view.js";
import { askReset, showRef } from "./reference.js";

var armedRemove = null;

/* --------------------------------------------------------------- interaction */
function step(k,i,d){
  var u = S[k].ships[i];
  u.dp = Math.max(0, Math.min(eShip(u).hp, u.dp + d));
  render();
}
/* Turrets are bought (Ork Dakka Dakka FL p.365, AdMech +1 FL p.119, Tyranid
   extra spore cysts FL p.426) and shot away, and the defender adds the number
   REMAINING (RB p.89), so the profile value is only where it starts. */
export function stepTurrets(k,i,d){
  var u = S[k].ships[i], p = profile(u);
  var cur = (u.tu === undefined || u.tu === null) ? (p?p.tu:0) : +u.tu;
  var next = Math.max(0, Math.min(12, cur + d));
  if(p && next === p.tu) delete u.tu; else u.tu = next;
  render();
}
function onDie(which, v, idx){
  if(which==="holo"){ doHolo(v, idx); return; }
  if(which==="rr"){ onRerollDie(v, idx); return; }
  if(!Array.isArray(pending[which])) pending[which] = [];
  pending[which][idx || 0] = v;
  render();
  if(diceReady("att") && diceReady("def")) doRoll();
}


/* ------------------------------------------------------------------ events */
function useTide(k){
  var n = 1 + Math.floor(rng()*3);
  R.tide = R.tide || {};
  R.tide[k] = {n:n};
  var other = k==="att" ? "def" : "att";
  var sc = R.score;
  var need = (sc.winner===k) ? sc.critNeeds.win : sc.critNeeds.lose;
  var bonus = B.critBonus(eSide(k));
  var targets = livingIdx(other);
  for(var i=0;i<n && targets.length;i++){
    var t = targets[i % targets.length];
    var c = {cid:"t"+k+i, to:other, i:t, from:k, need:need, bonus:bonus, roll:null, hit:null,
             table:null, extra:null, followup:null, tide:true};
    if(need > 6) c.hit = false; else if(need === 0) c.hit = true;
    R.crits.push(c);
  }
  if(S.dice==="digital"){
    R.crits.filter(function(c){ return c.tide && !c.table && c.hit!==false; }).forEach(function(c){
      if(c.hit===null){ c.roll = roll(); c.hit = (c.roll + c.bonus) >= c.need; }
      if(!c.hit) return;
      var tid = critTableIdFor(c.to, c.i), T = B.CRIT_TABLES[tid];
      setTableFor(c, T ? (T.dice===1 ? roll() : roll()+roll()) : 0, tid);
    });
  }
  drawResult();
}
function byKey(key){
  for(var n=0;n<R.crits.length;n++) if(R.crits[n].cid===key) return R.crits[n];
  return null;
}
function setTable(c, n){
  if(!c) return;
  setTableFor(c, n);
  drawResult();
}
export function setFollowupFor(c, n){
  if(!c || !c.followup) return;
  c.followup.roll = n;
  c.followup.result = B.followupLookup(c.followup.rule, n);
}
function allocStep(key, d){
  var p = key.split(":"), k = p[0], i = +p[1];
  var cur = R.alloc[k][i]||0, sc = R.score;
  var ids = livingIdx(k);
  var pool = ids.reduce(function(n,j){ return n + S[k].ships[j].dp; },0);
  var cap = Math.min(sc.damage, pool);
  var used = R.alloc[k].reduce(function(n,x){ return n+(x||0); },0);
  if(d>0 && (used >= cap || cur >= S[k].ships[i].dp)) return;
  if(d<0 && cur <= 0) return;
  R.alloc[k][i] = cur + d;
  drawResult();
}

/* Damage lands: the boarding damage as allocated, plus each critical's extra
   damage on the ship that suffered that critical. Extra damage from a critical
   never causes further critical hits (p.66). */
function applyResult(){
  var notes = [];
  ["att","def"].forEach(function(k){
    livingIdx(k).forEach(function(i){
      var o = outcome(k,i);
      /* an escort that suffers a critical hit is destroyed whatever its
         damage points say (p.66) */
      S[k].ships[i].dp = (o.state==="destroyed") ? 0 : o.fin;
      if(o.state==="destroyed") notes.push(shipName(k,i)+" is destroyed");
      else if(o.state==="hulk") notes.push(shipName(k,i)+" is a drifting hulk");
      else if(o.state==="quadrant") notes.push(shipName(k,i)+" — boarded quadrant destroyed; the fort survives until all four quadrants are destroyed");
      else if(o.state==="cata"){
        var r = R.cata[k+":"+i];
        notes.push(shipName(k,i)+" — "+(r?r.name:"catastrophic damage"));
      }
    });
  });
  spendOncePerGame(notes);
  S.round = 1;
  closeResult();
  if(notes.length) flash(notes.join(" · "));
}
/* "+2 to one boarding dice roll per game" (FL p.372): once it has been used in
   a resolved action, the app takes it off the ship so it cannot be used twice. */
function spendOncePerGame(notes){
  ["att","def"].forEach(function(k){
    if(!prep || !prep[k].mods.some(function(m){ return m.id==="clanzwarlord"; })) return;
    S[k].ships.forEach(function(u){
      var j = (u.opts||[]).indexOf("clanzwarlord");
      if(j>=0){ u.opts.splice(j,1); notes.push("Clanz Warlord’s +2 is used up for this game"); }
    });
  });
}
function flash(msg){
  var d = document.createElement("div");
  d.className = "warn";
  d.style.cssText = "position:fixed;left:10px;right:10px;bottom:calc(env(safe-area-inset-bottom) + 14px);"+
    "z-index:80;max-width:880px;margin:0 auto";
  d.innerHTML = "<b>☠</b><div>"+esc(msg)+"</div>";
  document.body.appendChild(d);
  setTimeout(function(){ d.remove(); }, 6000);
}

/* The advisory banner is clamped when the board needs the room; this is how the
   whole of it is still reachable. */
function showRuleNote(){
  var rules = prep ? prep.problems.filter(function(p){return p.level==="rule";}) : [];
  if(!rules.length) return;
  openSheet({title:"Rules reminder", sub:"", mode:"list",
    items:function(){
      return rules.map(function(p){
        return '<div class="mline"><span class="v">!</span><span class="t">'+esc(p.text)+'</span></div>';
      });
    }, onPick:function(){}});
}

/* the listeners; boot() adds them, as the page's one script did at load */
export function wireEvents(){
  document.addEventListener("click", function(ev){
    var t = ev.target.closest("[data-a],[data-die],[data-tab],[data-pick]");
    if(!t) return;
    if(t.dataset.die !== undefined && t.dataset.die !== ""){
      onDie(t.dataset.die, +t.dataset.v, +(t.dataset.idx || 0)); return;
    }
    var a = t.dataset.a, k = t.dataset.k, i = +t.dataset.i;
    switch(a){
      case "fleet": pickFleet(k); break;
      case "ship": pickShip(k, i); break;
      case "addship": pickShip(k, -1); break;
      case "clone": S[k].ships.splice(i+1,0,cloneUnit(S[k].ships[i])); resetRound(); render(); break;
      case "rm": {
        /* two small buttons side by side, one of them destructive: it arms first */
        var key = k+":"+i;
        if(armedRemove === key){ armedRemove = null; S[k].ships.splice(i,1); resetRound(); render(); }
        else { armedRemove = key; render(); setTimeout(function(){
          if(armedRemove === key){ armedRemove = null; render(); } }, 2600); }
        break;
      }
      case "resetSide": askReset(k); break;
      case "dp-": step(k,i,-1); break;
      case "dp+": step(k,i,1); break;
      case "dpset": pickDp(k,i); break;
      case "tu-": stepTurrets(k,i,-1); break;
      case "tu+": stepTurrets(k,i,1); break;
      case "opts": shipOpts(k,i); break;
      case "tg": S[k][t.dataset.t] = S[k][t.dataset.t]?0:1; render(); break;
      case "val": showValue(k); break;
      case "mods": showMods(k); break;
      case "roll": doRoll(); break;
      case "rulehelp": showRuleNote(); break;
      case "holo": doHolo(null, i); break;
      case "holodone": clearHolo(); resetRound(); render(); break;
      case "multihelp": showRef(1); break;
    }
  });
  document.getElementById("resultSheet").addEventListener("click", function(ev){
    var t = ev.target.closest("[data-r]"); if(!t) return;
    var c = t.dataset.c, v = +t.dataset.v;
    switch(t.dataset.r){
      case "close": closeResult(); break;
      case "undo": closeResult(); break;
      case "done": applyResult(); break;
      case "next": {
        var spent = [];
        spendOncePerGame(spent);
        S.round++;
        closeResult();
        if(spent.length) flash(spent.join(" · "));
        break;
      }
      case "critroll":
        R.crits.forEach(function(x){
          if(x.hit!==null) return;
          if(x.need>6){ x.hit=false; return; }
          x.roll = x.need===0 ? null : roll();
          x.hit = x.need===0 || (x.roll + x.bonus) >= x.need;
        });
        drawResult(); break;
      case "critdie": {
        var x = byKey(c); if(!x) break;
        x.roll = v; x.hit = (v + x.bonus) >= x.need;
        drawResult(); break;
      }
      case "crittable": {
        var cc = byKey(c), tid = critTableIdFor(cc.to, cc.i), TT = B.CRIT_TABLES[tid];
        setTable(cc, !TT ? 0 : (TT.dice===1 ? roll() : roll()+roll()));
        break;
      }
      case "crittbl": setTable(byKey(c), v); break;
      case "critex": { var ce = byKey(c); if(ce) ce.extra = v; drawResult(); break; }
      case "critfollow": { var cf = byKey(c); if(cf) setFollowupFor(cf, v); drawResult(); break; }
      case "tide": useTide(c); break;
      case "reroll": reroll(c); break;
      case "rerolldie": rerollDie(c, v, +(t.dataset.idx || 0)); break;
      case "noreroll": startMain(); drawResult(); break;
      case "alloc-": allocStep(c,-1); break;
      case "alloc+": allocStep(c, 1); break;
      case "apply": {
        var need = cataNeeded();
        if(need.length){ R.stage = "cata"; drawResult(); }
        else applyResult();
        break;
      }
      case "cataroll": {
        var ck = c.split(":");
        var ctid = cataTableIdFor(ck[0], +ck[1]);
        var dice = cataDiceFor(ck[0], +ck[1]), sum = 0;
        for(var di=0;di<dice;di++) sum += roll();
        R.cata[c] = B.cataLookup(sum, ctid);
        drawResult(); break;
      }
      case "catatbl": {
        var ck2 = c.split(":");
        R.cata[c] = B.cataLookup(v, cataTableIdFor(ck2[0], +ck2[1]));
        drawResult(); break;
      }
    }
  });
}
