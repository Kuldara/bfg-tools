/* The battle being set up, saved in localStorage, and the ship lookups on it. */

import { FLEETS, KEY, OPT_EXPAND, SHIPS } from "./catalogue.js";
import { RENEGADE_NEVER } from "./render.js";

/* ------------------------------------------------------------------- state -- */
export var S;
export function blankSide(){ return {f:-1, ships:[], blast:0, orders:0, other:0}; }
export function blankState(){ return {v:1, dice:null, round:1, att:blankSide(), def:blankSide()}; }
export function load(){
  try{
    var raw = localStorage.getItem(KEY);
    if(raw){ var o = JSON.parse(raw); if(o && o.att && o.def){ S = o; migrate(); return; } }
  }catch(e){}
  S = blankState();
}
function migrate(){
  S.round = S.round || 1;
  if(S.dice !== "digital" && S.dice !== "physical") S.dice = null;
  ["att","def"].forEach(function(k){
    var s = S[k]; s.ships = s.ships || []; s.blast = s.blast||0; s.orders = s.orders||0;
    s.other = +s.other || 0;
    if(["one","high","low"].indexOf(s.dice6) < 0) s.dice6 = null;
    /* the fleet is stored as an index; a rebuilt data file must not crash it */
    if(typeof s.f !== "number" || s.f < 0 || s.f >= FLEETS.length){
      var byId = -1;
      if(s.ships.length){
        byId = FLEETS.map(function(f){ return f.id; }).indexOf(s.ships[0].fid);
      }
      s.f = byId;
    }
    s.ships = s.ships.filter(function(u){ return u && typeof u.n === "string"; });
    s.ships.forEach(function(u){
      u.opts = u.opts || [];
      u.dp = +u.dp || 0;
      sanitizeUnit(u);
      if(u.tu !== undefined && u.tu !== null){
        u.tu = Math.max(0, Math.min(12, +u.tu || 0));
      }
      if(u.q !== undefined && u.q !== null){
        u.q = Math.max(0, Math.min(99, +u.q || 0));
        if(!u.q) delete u.q;
      }
      if(u.holo !== "saved" && u.holo !== "failed") delete u.holo;
    });
  });
}
export function save(){ try{ localStorage.setItem(KEY, JSON.stringify(S)); }catch(e){} }

/* --------------------------------------------------------------- ship lookup */
/* Saved units keep the ship's NAME, not its index: a data rebuild must not
   silently point a saved unit at a different hull. */
var PCACHE = {};
export function profile(u){
  var key = u.fid + "|" + u.n;
  if(key in PCACHE) return PCACHE[key];
  var hit = null;
  for(var i=0;i<SHIPS.length && !hit;i++){
    if(SHIPS[i].full === u.n && FLEETS[SHIPS[i].f].id === u.fid) hit = SHIPS[i];
  }
  for(var j=0;j<SHIPS.length && !hit;j++){ if(SHIPS[j].full === u.n) hit = SHIPS[j]; }
  PCACHE[key] = hit;
  return hit;
}
/* Remove choices older versions could save even though the hull can never use
   them. Dedicated hulk profiles carry their immutable flag in p.fl. */
export function sanitizeUnit(u){
  var p = profile(u), auto = (p && p.fl) || [];
  u.opts = (u.opts||[]).filter(function(o){
    if(o === "spacehulk") return false;
    if(auto.indexOf("blackship")>=0 && (o === "marines" || o === "greyknights")) return false;
    /* a renegade Imperial hull may never carry a Chaos crew or a Mark (FL p.222) */
    if(auto.indexOf("renegade")>=0 && RENEGADE_NEVER.indexOf(o)>=0) return false;
    return true;
  });
}
export function unitFromShip(sh){
  return {n:sh.full, fid:FLEETS[sh.f].id, dp:sh.hp, opts:(sh.on||[]).slice()};
}
export function cloneUnit(u){
  var c = {n:u.n, fid:u.fid, dp:u.dp, opts:(u.opts||[]).slice()};
  if(u.tu !== undefined && u.tu !== null) c.tu = u.tu;   /* a bought turret is copied too */
  if(u.q) c.q = u.q;
  return c;
}
/* engine ship record */
/* FL p.240: the Mark of Nurgle "gains 1 Damage Point and may not be boarded".
   Only the bought mark adds it - the Terminus Est already has it in its profile
   (FL p.262), and that one arrives as a profile flag, not a chosen option. */
/* RB p.89 counts "remaining turrets", and three fleet lists buy more of them
   (Ork Dakka Dakka FL p.365, AdMech +1 FL p.119, Tyranid extra spore cysts
   FL p.426) while criticals take them away. The profile is the starting point,
   not the last word. */
function shipTurrets(u, p){
  var base = p ? p.tu : 0;
  var n = (u.tu === undefined || u.tu === null) ? base : +u.tu;
  return Math.max(0, Math.min(12, n));
}
function markedHp(u, p){
  var base = p ? p.hp : 1;
  return base + (((u.opts||[]).indexOf("nurgle") >= 0) ? 1 : 0);
}
export function eShip(u){
  var p = profile(u);
  if(!p) return {name:u.n+" (unknown ship)", hp:1, dp:u.dp, turrets:0, type:"Cruiser",
                 spores:false, opts:["unknown"], _u:u, _p:null};
  var opts = (u.opts||[]).slice();
  if(p && p.fl) p.fl.forEach(function(f){ if(opts.indexOf(f)<0) opts.push(f); });
  opts.slice().forEach(function(o){
    (OPT_EXPAND[o]||[]).forEach(function(x){ if(opts.indexOf(x)<0) opts.push(x); });
  });
  return {name:p?p.n:"Ship", hp:markedHp(u,p), dp:u.dp, turrets:shipTurrets(u,p), type:p?p.t:"Cruiser", page:p?p.pg:null,
          extraHp:(p && p.fl && p.fl.indexOf("fortress")>=0) ? (+u.q || 0) : 0,
          spores:!!(p && p.spores), opts:opts, out:u.holo==="saved", idx:u._i, _u:u, _p:p};
}
export function eSide(k){
  var s = S[k];
  s.ships.forEach(function(u,i){ u._i = i; });
  return {race:s.f>=0?FLEETS[s.f].race:"none", ships:s.ships.map(eShip),
          blast:!!s.blast, orders:!!s.orders, other:s.other||0,
          diceOverride:s.dice6 || null};
}
/* Both sides have to have a ship chosen; whether those ships can still fight
   is the rules engine's business, so that it can say WHY not. */
export function ready(){ return S.att.ships.length>0 && S.def.ships.length>0; }
export function unknownShips(){
  var bad = [];
  ["att","def"].forEach(function(k){
    S[k].ships.forEach(function(u){ if(!profile(u)) bad.push(u.n); });
  });
  return bad;
}

/* set from the other modules (a module cannot assign another module's variable) */
export function setState(v){ S = v; }
export function clearProfiles(){ PCACHE = {}; }
