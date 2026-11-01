/* The bottom sheet and the pickers shown in it: fleet, ship, damage points,
   boarding value and modifiers. */

import { B, FLEETS, SHIPS } from "./catalogue.js";
import { S, eShip, eSide, profile, sanitizeUnit, unitFromShip } from "./state.js";
import { HULL_SHORT, esc, fitGlyph, fitSide, fleetColor, fleetIcon, hullIcon, prep, render } from "./render.js";
import { clearPending, diceInfo, fmt, resetRound } from "./action.js";
import { shipOpts } from "./ship-options.js";

/* --------------------------------------------------------------- the sheets */
var sheetPick = null, sheetTabState = null;
export function openSheet(o){
  sheetPick = o;
  document.getElementById("sheetTitle").innerHTML = (o.icon || "") + esc(o.title || "");
  document.getElementById("sheetSub").textContent = o.sub || "";
  var tabs = document.getElementById("sheetTabs");
  if(o.tabs && o.tabs.length>1){
    tabs.hidden = false;
    sheetTabState = (o.tab!==undefined && o.tab!==null) ? o.tab : 0;
    tabs.innerHTML = o.tabs.map(function(t,i){
      return '<button class="tab'+(i===sheetTabState?" on":"")+'" data-tab="'+i+'" aria-label="'+esc(t)+'">'+
        (o.tabIcon ? o.tabIcon(t) : "")+'<span class="tl">'+esc(t)+'</span>'+
        '<span class="ts">'+esc(o.tabShort ? o.tabShort(t) : t)+'</span></button>';
    }).join("");
  } else { tabs.hidden = true; sheetTabState = null; }
  document.getElementById("sheetGear").hidden = !o.gear;
  listPage = 0;
  document.getElementById("sheet").hidden = false;
  drawSheet();
}
export function closeSheet(){ document.getElementById("sheet").hidden = true; sheetPick = null; }
function fitTabs(){
  var el = document.getElementById("sheetTabs");
  if(el.hidden) return;
  el.classList.remove("t1","t2","t3");
  var steps = ["t1","t2","t3"];
  for(var i=0;i<=steps.length;i++){
    var clipped = [].some.call(el.children, function(b){ return b.scrollWidth > b.clientWidth + 1; });
    if(!clipped || i===steps.length) return;
    if(i>0) el.classList.remove(steps[i-1]);
    el.classList.add(steps[i]);
    void el.offsetHeight;
  }
}
function drawSheet(){
  var o = sheetPick; if(!o) return;
  fitGlyph(document.getElementById("sheetTitle"));
  fitTabs();
  var body = document.getElementById("sheetBody");
  body.style.overflowY = "";
  var items = o.items(sheetTabState);
  if(o.mode === "list"){
    paintList(body, items);
    return;
  }
  body.className = "grid";
  body.innerHTML = items.join("");
  fitGrid(body, items.length, o.minRow||44, o.minCol||1);
  /* a glyph never costs a name its last letters: glyphs shrink first, and a chip
     whose name is still cut drops its glyph */
  var chips = [].filter.call(body.querySelectorAll(".chip"), function(c){ return c.querySelector(".ic"); });
  if(chips.some(chipCut)){ body.classList.add("icS"); void body.offsetHeight; }
  chips.forEach(function(c){ if(chipCut(c)) c.classList.add("cut"); });
}
function chipCut(c){
  var nm = c.querySelector(".nm");
  if(!nm) return false;
  return nm.scrollWidth > nm.clientWidth + 1 || nm.scrollHeight > nm.clientHeight + 2 ||
    (c.classList.contains("fx") && c.scrollHeight > c.clientHeight + 1);
}
/* Lists compact before they scroll, the same way the side cards do. */
function fitList(el){
  if(el.clientHeight < 40) return;
  el.classList.remove("t1","t2","t3");
  var steps = ["t1","t2","t3"];
  for(var i=0;i<steps.length;i++){
    if(el.scrollHeight <= el.clientHeight + 1) return;
    el.classList.add(steps[i]);
    void el.offsetHeight;
  }
}
/* A reference list is never allowed to scroll either: once it has compacted as
   far as it goes, it is cut into pages that fit, and a pager appears. */
var listPage = 0;
function paintList(el, items){
  el.className = "list";
  el.style.overflowY = "";
  el.innerHTML = items.join("");
  fitList(el);
  if(el.clientHeight < 40 || el.scrollHeight <= el.clientHeight + 2){ listPage = 0; noSliver(el); return; }

  var kids = [].slice.call(el.children);
  var gap = 5, room = el.clientHeight - 34;          /* leave room for the pager */
  var pages = [[]], used = 0;
  kids.forEach(function(node, i){
    var h = node.offsetHeight + gap;
    if(used + h > room && pages[pages.length-1].length){ pages.push([]); used = 0; }
    pages[pages.length-1].push(i);
    used += h;
  });
  if(pages.length < 2){ listPage = 0; return; }
  if(listPage >= pages.length) listPage = pages.length - 1;
  if(listPage < 0) listPage = 0;

  var shown = pages[listPage].map(function(i){ return items[i]; });
  el.innerHTML = shown.join("") +
    '<div class="pager">' +
    '<button class="pg" data-pick="page:-1"'+(listPage===0?" disabled":"")+'>&#8592;</button>' +
    '<span>' + (listPage+1) + ' / ' + pages.length + '</span>' +
    '<button class="pg" data-pick="page:1"'+(listPage===pages.length-1?" disabled":"")+'>&#8594;</button>' +
    '</div>';
  noSliver(el);
}
/* a pixel of rounding is not worth a scrollbar */
function noSliver(el){
  if(el.clientHeight >= 40 && el.scrollHeight <= el.clientHeight + 2) el.style.overflowY = "hidden";
}
/* Choose the column count so that every chip fits without scrolling. */
/* A chip must stay readable before it stays tall: the column count is capped by
   a minimum chip width, and only then chosen to be as few columns as will fit. */
function fitGrid(el, n, minRow, minCol){
  if(!n || el.clientHeight < 40) return;
  var h = el.clientHeight, w = el.clientWidth, gap = 6;
  var lo = minCol || 1;
  var hi = Math.max(lo, Math.floor((w + gap) / (96 + gap)));
  var best = hi, rh = 0;
  for(var c=lo;c<=hi;c++){
    var rows = Math.ceil(n/c);
    rh = (h - gap*(rows-1)) / rows;
    best = c;
    if(rh >= minRow) break;
  }
  var rows2 = Math.ceil(n/best);
  rh = (h - gap*(rows2-1)) / rows2;
  el.style.gridTemplateColumns = "repeat("+best+",1fr)";
  el.style.gridAutoRows = "1fr";
  el.classList.toggle("tall", rh >= 64);
  el.classList.toggle("dense", rh < 56);
  el.classList.toggle("denser", rh < 40);
  el.classList.toggle("narrow", (w - gap*(best-1)) / best < 150);
}

export function pickFleet(k){
  openSheet({
    title:"Fleet", sub: k==="att"?"Boarder":"Defender", minRow:48, minCol:2,
    items:function(){
      return FLEETS.map(function(f,i){
        return '<button class="chip fx'+(S[k].f===i?" on":"")+'" data-pick="'+i+'">'+fleetIcon(i)+
          '<span class="nm">'+esc(f.name)+'</span></button>';
      });
    },
    onPick:function(v){
      var i = +v, changed = (S[k].f !== i);
      if(changed){
        S[k].f = i; S[k].ships = [];
        S[k].blast = 0; S[k].orders = 0; S[k].other = 0; S[k].otherValue = 0;
        resetRound();
      }
      closeSheet(); render();
      if(changed || !S[k].ships.length) pickShip(k, -1);
    }
  });
}
var TYPE_ORDER = ["Battleship","Grand Cruiser","Cruiser","Escort","Defence","Ground"];
export function pickShip(k, idx){
  if(S[k].f < 0){ pickFleet(k); return; }
  var fid = S[k].f;
  var mine = SHIPS.map(function(s,i){ return {s:s,i:i}; }).filter(function(o){ return o.s.f===fid; });
  var types = TYPE_ORDER.filter(function(t){ return mine.some(function(o){ return o.s.t===t; }); });
  var tabs = types.length>1 ? ["All"].concat(types) : types;
  var cur = idx>=0 ? S[k].ships[idx] : null;
  /* a big fleet opens on its largest class group, so the chips stay readable */
  var startTab = 0;
  if(mine.length > 18 && tabs.length > 1){
    var biggest = types[0], bn = 0;
    types.forEach(function(t){
      var c = mine.filter(function(o){ return o.s.t===t; }).length;
      if(c > bn){ bn = c; biggest = t; }
    });
    if(cur){
      var curType = (SHIPS.find(function(x){ return x.full===cur.n; })||{}).t;
      if(curType && types.indexOf(curType)>=0) biggest = curType;
    }
    startTab = tabs.indexOf(biggest);
  }
  openSheet({
    title: FLEETS[fid].name, icon: fleetIcon(fid,"in"), sub: k==="att"?"Boarder":"Defender",
    tabs:tabs, tab:startTab,
    tabIcon:function(t){ return hullIcon(t, fleetColor(fid)); },
    tabShort:function(t){ return HULL_SHORT[t] || t; },
    minRow:62, minCol:2,
    gear: idx>=0 ? function(){ shipOpts(k, idx); } : null,
    items:function(ti){
      var all = (!tabs.length || ti===null || (tabs[ti]==="All"));
      var list = all ? mine : mine.filter(function(o){ return o.s.t===tabs[ti]; });
      return list.map(function(o){
        var on = cur && cur.n===o.s.full;
        return '<button class="chip'+(on?" on":"")+(all?"":" hx")+'" data-pick="'+o.i+'"><span class="nm">'+
          hullIcon(o.s.t, fleetColor(fid), "in")+esc(o.s.n)+
          '</span><span class="sub">'+esc(o.s.s)+' · '+o.s.hp+'HP'+(o.s.tu?" · "+o.s.tu+(o.s.spores?"sp":"T"):"")+'</span></button>';
      });
    },
    onPick:function(v){
      var sh = SHIPS[+v];
      var u = unitFromShip(sh);
      if(idx>=0) { u.opts = S[k].ships[idx].opts || []; sanitizeUnit(u); S[k].ships[idx] = u; }
      else S[k].ships.push(u);
      resetRound();
      closeSheet(); render();
    }
  });
}
export function pickDp(k,i){
  var u = S[k].ships[i], p = profile(u);
  var max = eShip(u).hp;
  openSheet({
    title:"Damage points remaining", sub:(p?p.n:""), minRow:52, minCol:3,
    items:function(){
      var out = [];
      var probe = eShip(u);
      for(var n=max;n>=0;n--){
        probe.dp = n;
        var crip = B.isCrippled(probe);
        out.push('<button class="chip num'+(u.dp===n?" on":"")+'" data-pick="'+n+'"><b>'+
          (n===0?"☠":n)+'</b>'+(n===0?'<span class="sub">hulk</span>':(crip?'<span class="sub">crippled</span>':""))+'</button>');
      }
      return out;
    },
    onPick:function(v){ u.dp = +v; closeSheet(); render(); }
  });
}
export function showValue(k){
  var side = eSide(k), role = k==="att"?"attacker":"defender";
  var bv = B.boardingValue(side, role, eSide(k==="att"?"def":"att"));
  var h = [];
  bv.parts.forEach(function(p){
    h.push('<div class="mline"><span class="v num">'+p.base+'</span><span class="t">'+esc(p.ship.name)+
      ' — damage points remaining</span></div>');
    p.steps.forEach(function(st){
      h.push('<div class="mline sub"><span class="v num">'+st.v+'</span><span class="t">'+esc(st.t)+'</span></div>');
    });
  });
  if(role==="defender"){
    var anySpore = side.ships.some(function(s){ return s._p && s._p.spores; });
    h.push('<div class="mline"><span class="v num">+'+bv.turrets+'</span><span class="t">remaining '+
      (anySpore?"spore cysts":"turrets")+' (the ship being boarded adds them)</span><span class="p">p.89</span></div>');
  }
  if(bv.byHand) h.push('<div class="mline"><span class="v num">'+fmt(bv.byHand)+'</span><span class="t">entered by hand</span></div>');
  h.push('<div class="mline tot"><span class="v num">'+bv.value+'</span><span class="t"><b>Boarding value</b></span></div>');
  h.push('<div class="dieRow" style="margin-top:4px"><div class="lab" style="width:104px;text-align:left;color:var(--dim)">'+
    'Anything else</div>'+
    '<button class="die" style="flex:0 0 46px;height:40px" data-pick="minus">−</button>'+
    '<div class="die" style="flex:0 0 52px;height:40px;background:transparent;border-color:transparent">'+
    fmt(S[k].otherValue||0)+'</div>'+
    '<button class="die" style="flex:0 0 46px;height:40px" data-pick="plus">+</button><div style="flex:1"></div></div>');
  h.push('<div class="mline sub"><span class="v"></span><span class="t">Added to the boarding value: campaign bonuses, house rules and anything the app does not know.</span></div>');
  openSheet({title:"Boarding value", sub:k==="att"?"Boarder":"Defender", mode:"list",
    items:function(){ return h; }, onPick:function(v){
      if(v!=="plus" && v!=="minus") return;
      var n = (S[k].otherValue||0) + (v==="plus"?1:-1);
      S[k].otherValue = Math.max(-99, Math.min(99, n));
      render(); showValue(k);
    }});
}
var PAGE = {ratio1:"RB p.90",ratio2:"RB p.90",ratio3:"RB p.90",ratio4:"RB p.90",blast:"RB p.90",orders:"RB p.90",orders2:"FL p.63",
  crippled:"RB p.90",chaos:"RB p.90",ork:"RB p.90",marines:"RB p.90",csm:"REF p.1",abaddon:"REF p.1",berzerkers:"FL p.266",
  megaarmour:"REF p.1",goff:"REF p.1",clanzwarlord:"FL p.374",corridor:"FL p.72",blackship:"FL p.158",easyprey:"FL p.325",
  inq_malleus:"REF p.1",inq_hereticus:"REF p.1",inq_xenos:"REF p.1",vs_xenos:"REF p.1",de1:"REF p.1",de2:"REF p.1",
  aspect:"FL p.307",rath:"FL p.48",talons:"FL p.311/352"};
export function showMods(k){
  var p = prep ? prep[k] : null;
  var h = [];
  if(!p || !p.mods.length) h.push('<div class="mline"><span class="v num">0</span><span class="t">No modifiers apply.</span></div>');
  p && p.mods.forEach(function(m){
    h.push('<div class="mline"><span class="v num '+(m.v>0?"plus":"minus")+'">'+fmt(m.v)+'</span><span class="t">'+
      esc(m.label)+'</span><span class="p">'+(PAGE[m.id]||"")+'</span></div>');
  });
  if(p){
    h.push('<div class="mline tot"><span class="v num">'+fmt(p.modSum)+'</span><span class="t"><b>Added to the D6</b></span></div>');
    var di = diceInfo(p);
    if(di && di.kind!=="one"){
      h.push('<div class="mline'+(di.kind==="low"?"":"")+'"><span class="v">'+
        (di.kind==="none"?"—":"2D6")+'</span><span class="t"><b>'+esc(di.long)+'</b>'+
        (di.kind==="high"?" — Tyranids roll two dice and keep the better one."
         :di.kind==="low"?" — two dice, and the worse one counts."
         :"")+'</span></div>');
    }
    if(p.reroll) h.push('<div class="mline sub"><span class="v">↺</span><span class="t">This side may re-roll the boarding result; the second roll stands.</span></div>');
  }
  h.push('<div class="mline sub"><span class="v"></span><span class="t">The ratio modifiers are an either-or group: only the highest one applies.</span></div>');
  h.push('<div class="dieRow" style="margin-top:4px"><div class="lab" style="width:104px;text-align:left;color:var(--dim)">'+
    'Anything else</div>'+
    '<button class="die" style="flex:0 0 46px;height:40px" data-pick="minus">−</button>'+
    '<div class="die" style="flex:0 0 52px;height:40px;background:transparent;border-color:transparent">'+
    fmt(S[k].other||0)+'</div>'+
    '<button class="die" style="flex:0 0 46px;height:40px" data-pick="plus">+</button><div style="flex:1"></div></div>');
  h.push('<div class="mline sub"><span class="v"></span><span class="t">Campaign bonuses, house rules and anything the app does not know go here.</span></div>');
  var cur = S[k].dice6 || "rules";
  var DICE_CHOICES = [["rules","By the rules"],["one","D6"],["high","2D6 \u25B2 highest"],["low","2D6 \u25BC lowest"]];
  h.push('<div class="mline tot"><span class="v"></span><span class="t"><b>Dice this side throws</b></span></div>');
  h.push('<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:5px">');
  DICE_CHOICES.forEach(function(c){
    h.push('<button class="die" style="height:40px;font-size:12.5px;font-weight:700'+
      (cur===c[0]?";background:var(--panel2);border-color:#5a6070;color:var(--ink)":"")+
      '" data-pick="dice:'+c[0]+'">'+c[1]+'</button>');
  });
  h.push('</div>');
  h.push('<div class="mline sub"><span class="v"></span><span class="t">'+
    (cur==="rules"
      ? 'The rules decide: Tyranids throw two and keep the highest, a crewless hull throws none, everyone else throws one.'
      : '<b style="color:var(--warn)">Set by hand</b> — this replaces what the rules say for this side until you set it back.')+
    '</span></div>');
  openSheet({title:"Roll modifiers", sub:k==="att"?"Boarder":"Defender", mode:"list",
    items:function(){ return h; },
    onPick:function(v){
      if(v.indexOf("dice:")===0){
        var d = v.slice(5);
        S[k].dice6 = (d==="rules") ? null : d;
        clearPending();
        render(); showMods(k); return;
      }
      if(v!=="plus" && v!=="minus") return;
      var n = (S[k].other||0) + (v==="plus"?1:-1);
      S[k].other = Math.max(-9, Math.min(9, n));
      render(); showMods(k);
    }});
}

/* the listeners; boot() adds them, as the page's one script did at load */
export function wireSheets(){
  document.getElementById("sheetGear").addEventListener("click", function(){
    if(sheetPick && sheetPick.gear) sheetPick.gear();
  });
  document.getElementById("sheetClose").addEventListener("click", closeSheet);
  document.getElementById("sheet").addEventListener("click", function(ev){
    if(ev.target.id === "sheet") closeSheet();
    var tb = ev.target.closest("[data-tab]");
    if(tb){ sheetTabState = +tb.dataset.tab; listPage = 0;
      document.querySelectorAll("#sheetTabs .tab").forEach(function(e,i){ e.classList.toggle("on", i===sheetTabState); });
      drawSheet(); return; }
    var pk = ev.target.closest("[data-pick]");
    if(pk && String(pk.dataset.pick).indexOf("page:") === 0){
      listPage += +String(pk.dataset.pick).slice(5);
      drawSheet(); return;
    }
    if(pk && sheetPick){ sheetPick.onPick(pk.dataset.pick, pk); }
  });
  window.addEventListener("resize", function(){
    if(sheetPick) drawSheet();
    ["sideAtt","sideDef"].forEach(function(id){ fitSide(document.getElementById(id)); });
  });
  if(window.visualViewport) window.visualViewport.addEventListener("resize", function(){
    ["sideAtt","sideDef"].forEach(function(id){ fitSide(document.getElementById(id)); });
  });
}
