/* Drawing the two sides: fleets, ships, their icons and values, and fitting
   the text to its box. */

import ICONS from "./icons.json";
import { AUTO, B, FLEETS, OPTS } from "./catalogue.js";
import { S, eShip, eSide, profile, ready, save } from "./state.js";
import { diceInfo, diceStrip, fmt, renderAct } from "./action.js";

/* ------------------------------------------------------------------- render */
export function esc(s){ return String(s).replace(/[&<>"]/g,function(c){
  return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]; }); }

/* Icons come from src/icons.json (make_icons.py). build.py refuses to build if
   a fleet or a hull type in the ship data has no icon, so a missing one here
   only means an old save pointing at a fleet that no longer exists. */
function svgIcon(markup, color, cls){
  if(!markup) return "";
  return '<svg class="ic'+(cls?" "+cls:"")+'" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"'+
    ' focusable="false"'+(color?' style="color:'+color+'"':'')+'>'+markup+'</svg>';
}
export function fleetColor(i){
  var st = FLEETS[i] && ICONS.fleets[FLEETS[i].id];
  return st ? st.color : "";
}
export function fleetIcon(i, cls){
  var st = FLEETS[i] && ICONS.fleets[FLEETS[i].id];
  return st ? svgIcon(ICONS.glyphs[st.glyph], st.color, cls) : "";
}
export function hullIcon(t, color, cls){ return svgIcon(ICONS.hulls[t], color, cls); }
export var HULL_SHORT = {"Battleship":"Battle", "Grand Cruiser":"Grand"};
/* FL p.222: renegade Imperial vessels take no Chaos Lord, no Chaos Space Marine
   crew and no Chaos ordnance, and FL p.225 hangs every Mark on one of those. */
export var RENEGADE_NEVER = ["khorne","nurgle","csm","abaddon","berzerkers","berzerkerfleet","ark","terminators"];
/* the "open the math" mark on the boarding value and roll modifier buttons */
var INFO_ICON = '<svg class="info" viewBox="0 0 24 24" aria-hidden="true" focusable="false">'+
  '<circle cx="12" cy="12" r="9.6" fill="none" stroke="currentColor" stroke-width="2"/>'+
  '<circle cx="12" cy="7.4" r="1.55" fill="currentColor"/>'+
  '<path d="M10.7 10.4h2.6v7.4h-2.6z" fill="currentColor"/></svg>';

export var prep = null;
export function render(){
  window.S = S;                         /* keep the documented debug handle current */
  prep = ready() ? B.prepare({att:eSide("att"), def:eSide("def"), round:S.round}) : null;
  renderSide("att"); renderSide("def");
  document.getElementById("modeBtn").innerHTML = S.dice==="physical" ? "&#9995; I roll" : "&#127922; App rolls";
  document.getElementById("title").textContent = S.round>1 ? "Grapple — round " + S.round : "Boarding action";
  document.getElementById("diceSheet").hidden = !!S.dice;
  renderAct();
  fitAll();
  save();
}

function renderSide(k){
  var el = document.getElementById(k==="att"?"sideAtt":"sideDef");
  var s = S[k], p = prep ? prep[k] : null;
  var h = [];
  var sideBlank = s.f<0 && !s.ships.length && !s.blast && !s.orders && !s.other;
  h.push('<div class="sideHead"><span class="role">'+(k==="att"?"Boarder":"Defender")+'</span>');
  h.push('<button class="sideReset" data-a="resetSide" data-k="'+k+'" title="Reset this side"'+
    (sideBlank?' disabled':'')+'>&#8634; Reset</button>');
  h.push('<button class="fleetBtn'+(s.f>=0?" set":"")+'" data-a="fleet" data-k="'+k+'">'+
    (s.f>=0?fleetIcon(s.f,"in")+esc(FLEETS[s.f].name):"Choose fleet")+' ▾</button></div>');

  h.push('<div class="ships">');
  if(!s.ships.length){
    h.push('<div class="shipRow"><button class="shipName empty" data-a="ship" data-k="'+k+'" data-i="-1">'+
      '<span class="nm">+ Choose a ship</span></button></div>');
  }
  s.ships.forEach(function(u,i){
    var pr = profile(u);
    var es = eShip(u);                    /* one crippled rule, and it lives in the engine */
    var hp = es.hp, tu = es.turrets;      /* the Mark of Nurgle's extra hit and bought turrets */
    var crip = B.isCrippled(es), hulk = u.dp<=0;
    var etu = B.effTurrets(es);
    var sub = [];
    if(pr){
      sub.push(pr.s);
      sub.push(hp+" HP"+(hp!==pr.hp?"*":""));
      if(tu) sub.push(etu + (pr.spores?" spore":" turret") + (etu===1?"":"s") +
        (etu<tu?" (halved)":"") + (tu!==pr.tu?"*":""));
    }
    var chips = (u.opts||[]).length;
    if(chips) sub.push(chips + " upgrade" + (chips===1?"":"s"));
    h.push('<div class="shipRow">');
    h.push('<button class="shipName" data-a="ship" data-k="'+k+'" data-i="'+i+'"><span class="nm">'+
      esc(pr?pr.n:u.n)+'</span><span class="sub">'+esc(sub.join(" · "))+'</span></button>');
    h.push('<div class="dpGroup">');
    h.push('<button class="dpBtn" data-a="dp-" data-k="'+k+'" data-i="'+i+'"'+(u.dp<=0?" disabled":"")+'>−</button>');
    h.push('<button class="dpNum num'+(hulk?" hulk":(crip?" crip":""))+'" data-a="dpset" data-k="'+k+'" data-i="'+i+'">'+
      (hulk?'<b>'+(hp<=1?"DEAD":"HULK")+'</b>':'<b>'+u.dp+'</b><span>'+(crip?"CRIPPLED":"OF "+hp)+'</span>')+'</button>');
    h.push('<button class="dpBtn" data-a="dp+" data-k="'+k+'" data-i="'+i+'"'+(u.dp>=hp?" disabled":"")+'>+</button>');
    h.push('</div>');
    var toolName = esc(pr?pr.n:u.n);
    h.push('<div class="shipOps">');
    h.push('<button class="shipOp copy" data-a="clone" data-k="'+k+'" data-i="'+i+'" title="Add another identical '+
      toolName+'" aria-label="Add another identical '+toolName+'">+1</button>');
    h.push('<button class="shipOp del" data-a="rm" data-k="'+k+'" data-i="'+i+'" title="Delete '+
      toolName+'" aria-label="Delete '+toolName+'">&#10005;</button>');
    h.push('</div>');
    h.push('</div>');
  });
  h.push('</div>');

  h.push(upRow(k));

  h.push('<div class="tgRow">');
  /* Tyranids never grant the Blast Marker modifier (FL p.418), so on their card
     the switch is shown as having no effect rather than lighting up for nothing. */
  var blastInert = (s.f>=0 && FLEETS[s.f].race==="tyranid");
  h.push('<button class="tg'+(s.blast&&!blastInert?" on":"")+(blastInert?" inert":"")+
    '" data-a="tg" data-k="'+k+'" data-t="blast">'+
    '<span class="dot"></span>'+(blastInert?"Blast: no effect":"In Blast Markers")+'</button>');
  h.push('<button class="tg'+(s.orders?" on":"")+'" data-a="tg" data-k="'+k+'" data-t="orders">'+
    '<span class="dot"></span>On special orders</button>');
  /* Multi-boarding works in either direction: several ships may board one, or
     one ship may board several (creator clarification; RULINGS.md 16). */
  if(s.ships.length)
    h.push('<button class="tg add" data-a="addship" data-k="'+k+'">+</button>');
  h.push('</div>');

  h.push('<div class="valRow">');
  h.push('<button class="valBtn" data-a="val" data-k="'+k+'" aria-label="Boarding value '+
    (p?p.value:"not set")+': show how it is counted"><span class="cap"><b class="num">'+(p?p.value:"–")+
    '</b><span>Boarding<br>value</span></span>'+INFO_ICON+'</button>');
  var ms = p?p.modSum:0;
  /* the dice notation rides along in the caption, so even the most compacted
     card still says that this side throws two */
  var di = diceInfo(p);
  var cap = (di && di.kind!=="one")
    ? (di.kind==="none" ? 'No dice<br>+ modifiers'
       : '<span class="'+di.kind+'-mark">2D6'+di.arrow+'</span><br>+ modifiers')
    : 'Roll<br>modifiers';
  var capSay = (di && di.kind==="none") ? "No dice + modifiers"
    : (di && di.kind!=="one") ? "2D6 keep the "+(di.kind==="low"?"lowest":"highest")+" + modifiers"
    : "Roll modifiers";
  h.push('<button class="valBtn mods'+(ms===0?" zero":"")+'" data-a="mods" data-k="'+k+'" aria-label="'+capSay+' '+
    (p?(ms>0?"+":"")+ms:"not set")+': show each modifier and the dice"><span class="cap"><b class="num">'+
    (p?(ms>0?"+":"")+ms:"–")+'</b><span>'+cap+'</span></span>'+INFO_ICON+'</button>');
  h.push('</div>');
  h.push(diceStrip(p));
  el.innerHTML = h.join("");
  el.classList.toggle("dead", !!s.ships.length && !s.ships.some(function(u){return u.dp>0}));
}
/* Nothing in a side card may ever be cut off: drop the upgrade chips first,
   then tighten the rows, until the content fits the space it has. */
/* Measure, do not predict: fit the cards, and if anything is still cut off give
   the footer's advisory text away a step at a time and fit them again. */
function fitAll(){
  var act = document.getElementById("act");
  var a = document.getElementById("sideAtt"), d = document.getElementById("sideDef");
  act.classList.remove("f1","f2","f3","f4");
  void act.offsetHeight;
  var steps = ["f1","f2","f3","f4"];
  for(var step=0; step<=steps.length; step++){
    fitSide(a); fitSide(d);
    if(a.clientHeight < 40) break;                /* not laid out yet */
    if(!clipped(a) && !clipped(d)) break;
    if(step < steps.length){ act.classList.add(steps[step]); void act.offsetHeight; }
  }
  markClamp(act);
}
function markClamp(act){
  var w = act.querySelector(".warn.rule");
  if(!w) return;
  w.classList.toggle("clamped", act.classList.contains("f1") ||
    act.classList.contains("f2") || act.classList.contains("f3"));
}
function clipped(el){
  if(el.scrollHeight > el.clientHeight + 1) return true;
  var inner = el.querySelectorAll(".ships,.upRow,.upSum");
  for(var i=0;i<inner.length;i++){
    if(inner[i].scrollHeight > inner[i].clientHeight + 1) return true;
  }
  return false;
}
/* A glyph in front of a one-line name never costs the name its letters: it
   shrinks first, and if the name is still cut it is dropped. */
export function fitGlyph(el){
  if(!el || !el.querySelector(".ic")) return;
  el.classList.remove("icS","icCut");
  var cut = function(){ return el.scrollWidth > el.clientWidth + 1; };
  if(cut()){ el.classList.add("icS"); void el.offsetWidth; }
  if(cut()){ el.classList.remove("icS"); el.classList.add("icCut"); }
}
function fitVal(el){
  var row = el.querySelector(".valRow");
  if(!row) return;
  row.classList.remove("vt1","vt2");
  var cut = function(){
    return [].some.call(row.querySelectorAll(".cap > span"), function(t){ return t.scrollWidth > t.clientWidth + 1; });
  };
  if(cut()){ row.classList.add("vt1"); void row.offsetWidth; }
  if(cut()) row.classList.add("vt2");
}
export function fitSide(el){
  /* a hidden or not-yet-laid-out page reports zero height; compacting against
     that would leave the card crushed when it becomes visible again */
  if(el.clientHeight < 40) return;
  fitGlyph(el.querySelector(".fleetBtn"));
  el.classList.remove("c1","c2","c3","c4","c5","c6");
  var steps = ["c1","c2","c3","c4","c5","c6"];
  for(var i=0;i<steps.length;i++){
    if(!clipped(el)) break;
    el.classList.add(steps[i]);
    void el.offsetHeight;                 /* force the reflow before re-measuring */
  }
  /* widths only, so it cannot undo a compaction step; measured at the final one */
  fitVal(el);
}

/* The upgrades actually in play, visible without opening anything: the one
   thing a player most wants to double-check before committing to a roll. */
function upLabel(id){
  if(AUTO[id]) return AUTO[id].t;
  for(var i=0;i<OPTS.length;i++) if(OPTS[i].id===id) return OPTS[i].t;
  return id;
}
var UP_HIDE = ["hr_target_plus1"];
function upRow(k){
  var s = S[k];
  if(!s.ships.length) return '<div class="upRow"></div>';
  var h = ['<div class="upRow">'];
  var any = false;
  s.ships.forEach(function(u,i){
    var p = profile(u);
    var auto = (p && p.fl) || [];
    var list = auto.concat((u.opts||[]).filter(function(o){ return auto.indexOf(o)<0; }));
    list = list.filter(function(o){ return UP_HIDE.indexOf(o)<0; });
    var seen = {};
    list.forEach(function(o){
      if(seen[o]) return; seen[o] = 1; any = true;
      var locked = auto.indexOf(o)>=0;
      h.push('<button class="up'+(locked?" lock":"")+'" data-a="opts" data-k="'+k+'" data-i="'+i+'">'+
        (s.ships.length>1 ? esc((p?p.n:u.n).slice(0,6))+": " : "")+esc(upLabel(o))+'</button>');
    });
  });
  var n = h.length - 1;
  if(S[k].other){
    h.push('<button class="up" data-a="mods" data-k="'+k+'">'+fmt(S[k].other)+' by hand</button>');
    any = true; n++;
  }
  if(S[k].dice6){
    h.push('<button class="up" data-a="mods" data-k="'+k+'">dice set by hand</button>');
    any = true; n++;
  }
  if(!any){
    h.push('<button class="up add" data-a="opts" data-k="'+k+'" data-i="0">+ marks, crew, characters</button>');
  } else {
    s.ships.forEach(function(u,i){
      h.push('<button class="up add" data-a="opts" data-k="'+k+'" data-i="'+i+'">+'+
        (s.ships.length>1 ? " "+esc((profile(u)||{n:u.n}).n.slice(0,6)) : "")+'</button>');
    });
  }
  h.push('</div>');
  h.push('<div class="upSum">'+(any
    ? '<button class="up" data-a="opts" data-k="'+k+'" data-i="0">&#9873; '+n+' in play</button>'
    : '<button class="up add" data-a="opts" data-k="'+k+'" data-i="0">+ marks, crew</button>')+'</div>');
  return h.join("");
}
