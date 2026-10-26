/* Drawing the result sheet: the score, rerolls, holofields, criticals,
   damage and catastrophic damage. */

import { B } from "./catalogue.js";
import { S, eSide } from "./state.js";
import { esc, prep } from "./render.js";
import { diceInfo, fieldWord, fmt } from "./action.js";
import { R, allocDone, cataDiceFor, cataNeeded, cataTableIdFor, critTableIdFor, livingIdx, outcome, roll, setTableFor, shipHp, shipName, sideName } from "./rolling.js";

/* ---------------------------------------------------------------- drawing -- */
/* Escorts and Kroot Warspheres roll on no table; settle those before drawing so
   the very first render is already complete. */
function resolveFreeTables(){
  (R.crits||[]).forEach(function(c){
    if(c.hit && !c.table){
      var tid = critTableIdFor(c.to, c.i);
      if(!B.CRIT_TABLES[tid]) setTableFor(c, 0, tid);
    }
  });
}
/* The action row is never part of the scrolling area: whatever happens above
   it, APPLY DAMAGE stays on screen. */
function paint(box, html){
  var i = html.lastIndexOf('<div class="actRow"');
  if(i < 0){ box.innerHTML = '<div class="rollArea">'+html+'</div>'; return; }
  box.innerHTML = '<div class="rollArea">'+html.slice(0,i)+'</div>'+html.slice(i);
}
export function drawResult(){
  var box = document.getElementById("resultBox");
  if(R.holo) return drawHolo(box);
  if(R.crits) resolveFreeTables();
  if(R.stage==="reroll") return drawReroll(box);
  if(R.stage==="cata") return drawCata(box);

  var sc = R.score, h = [scoreRow()];

  if(!sc.winner){
    h.push('<div class="verdict grapple"><div class="head">Grapple</div><div class="sub">'+
      'The ships grapple together and fight again in every following End Phase. Neither may move, '+
      'shoot or launch ordnance until one side is reduced to zero damage points. '+
      'No damage and no critical hits this round.</div></div>');
    h.push('<div class="spacer"></div>');
    h.push('<div class="actRow"><button data-r="undo">Undo this roll</button>'+
      '<button class="primary" data-r="next">Next End Phase</button></div>');
    paint(box, h.join("")); return;
  }

  h.push('<div class="verdict"><div class="head">'+esc(sc.result.name)+'</div><div class="sub"><b>'+
    esc(sideName(sc.winner))+'</b> wins by '+sc.diff+'</div></div>');

  h.push(critBlock());
  h.push(damageBlock());

  h.push(arkBlock());
  h.push(tideBlock());
  h.push('<div class="spacer"></div>');
  var rollsLeft = R.crits.some(function(c){
    return c.hit===null || (c.hit && !c.table) || (c.hit && c.table && c.extra===null) ||
      (c.hit && c.followup && c.followup.roll===null);
  });
  var splitLeft = !allocDone();
  var waiting = rollsLeft || splitLeft;
  var cn = cataNeeded();
  h.push('<div class="actRow"><button data-r="close">Close</button>'+
    '<button class="primary" data-r="apply"'+(waiting?" disabled":"")+'>'+
    (rollsLeft ? "Enter the rolls" : splitLeft ? "Split the damage"
      : (cn.length ? "Apply &amp; catastrophic damage" : "Apply damage"))+
    '</button></div>');
  paint(box, h.join(""));
}

/* Every die that was thrown, with the one that counted marked and the one that
   did not struck through. */
function diceShown(p, s){
  if(!p || p.dice===0) return "no dice";
  var dice = (s && s.dice) || [];
  if(p.dice===1) return dice.length ? String(dice[0]) : String(s.used);
  var kept = (s && s.kept >= 0) ? s.kept : dice.indexOf(s.used);
  return dice.map(function(v,i){
    return '<span class="dieShown '+(i===kept?"kept":"drop")+'">'+v+'</span>';
  }).join(" ") + '<span style="font-size:9px;letter-spacing:.06em"> '+
    (p.pick==="low" ? "LOWEST" : "HIGHEST")+'</span>';
}
function scoreRow(){
  var sc = R.score, pr = prep, h = ['<div class="scoreRow">'];
  ["att","def"].forEach(function(k,ix){
    if(ix===1) h.push('<div class="vs">vs</div>');
    var s = sc[k], w = sc.winner===k;
    var calc = diceShown(pr[k], s) + (pr[k].modSum ? " "+fmt(pr[k].modSum) : "");
    h.push('<div class="scoreBox '+k+(w?" win":"")+'"><span class="who">'+(k==="att"?"Boarder":"Defender")+
      '</span><span class="tot num">'+s.total+'</span><span class="calc num">'+calc+'</span></div>');
  });
  h.push('</div>');
  return h.join("");
}
function drawReroll(box){
  var sc = R.score, h = [scoreRow()];
  h.push('<div class="verdict"><div class="head">'+(sc.winner?esc(sc.result.name):"Grapple")+'</div>'+
    '<div class="sub">'+(sc.winner ? '<b>'+esc(sideName(sc.winner))+'</b> would win by '+sc.diff
      : 'A draw as it stands')+'</div></div>');
  ["att","def"].forEach(function(k){
    if(!prep[k].reroll) return;
    var done = R.rerolled[k];
    h.push('<div class="step'+(done?" done":"")+'"><div class="q"><b>'+esc(sideName(k))+
      '</b> may re-roll the boarding dice. The second roll stands, even if it is worse.</div>');
    if(!done){
      if(S.dice==="digital"){
        h.push('<div class="actRow" style="margin:0"><button data-r="reroll" data-c="'+k+'">Re-roll</button></div>');
      }else{
        var need = prep[k].dice, got = (R.rrDice[k] || []);
        for(var r=0;r<need;r++){
          h.push('<div class="dieRow '+k+'"><div class="lab '+k+'-lab">'+
            (need>1 ? "new "+(r+1) : "new")+'</div>');
          for(var i=1;i<=6;i++) h.push('<button class="die'+(got[r]===i?" sel":"")+
            '" data-r="rerolldie" data-c="'+k+'" data-idx="'+r+'" data-v="'+i+'">'+i+'</button>');
          h.push('</div>');
        }
        if(need>1){
          var dd = diceInfo(prep[k]);
          h.push('<div class="diceStrip '+dd.kind+'"><span class="arrow">'+dd.arrow+
            '</span>keeps the '+(dd.kind==="low"?"lowest":"highest")+'</div>');
        }
      }
    } else {
      h.push('<div class="q" style="color:var(--dim)">Re-rolled.</div>');
    }
    h.push('</div>');
  });
  h.push('<div class="spacer"></div>');
  h.push('<div class="actRow"><button data-r="close">Close</button>'+
    '<button class="primary" data-r="noreroll">Stand on this roll</button></div>');
  paint(box, h.join(""));
}
export function reroll(k){
  if(R.rerolled[k]) return;
  var dice = [];
  for(var i=0;i<prep[k].dice;i++) dice.push(roll());
  R.rerolled[k] = true;
  R.rolls[k] = dice;
  R.score = B.score(prep, R.rolls);
  drawResult();
}
/* By hand the whole set has to arrive before the re-roll can replace the old
   one, or a 2D6 side would be scored on one die. */
export function rerollDie(k, v, idx){
  if(R.rerolled[k]) return;
  R.rrDice = R.rrDice || {};
  R.rrDice[k] = R.rrDice[k] || [];
  R.rrDice[k][idx || 0] = v;
  var need = prep[k].dice, got = R.rrDice[k], full = true;
  for(var i=0;i<need;i++) if(!got[i]) full = false;
  if(full){
    R.rerolled[k] = true;
    R.rolls[k] = got.slice(0, need);
    R.score = B.score(prep, R.rolls);
  }
  drawResult();
}
function drawHolo(box){
  paint(box,
    '<div class="spacer"></div>'+
    '<div class="verdict"><div class="head" style="color:var(--def)">'+(fieldWord()==="shadowfields"?"Shadowfields":"Holofields")+' hold</div>'+
    '<div class="sub">Rolled <b>'+R.holo.roll+'</b>, needed '+R.holo.target+'+.<br>'+
    'The entire boarding attempt is ignored. Nothing else happens.</div></div>'+
    '<div class="spacer"></div>'+
    '<div class="actRow"><button class="primary" data-r="close">Done</button></div>');
}

/* One line per ship that could take a critical hit. */
function critBlock(){
  var h = [], anyPending = false;
  var groups = {att:[], def:[]};
  R.crits.forEach(function(c){ groups[c.from].push(c); });
  ["att","def"].forEach(function(from){
    var list = groups[from]; if(!list.length) return;
    var need = list[0].need, bonus = list[0].bonus;
    if(need > 6){
      h.push('<div class="step done"><div class="q">'+esc(sideName(from))+
        ' causes no critical hit <span class="no">—</span></div></div>');
      return;
    }
    var head = esc(sideName(from)) + (need===0
      ? ' causes an <b>automatic</b> critical hit'
      : ' causes a critical hit on a <b>'+need+'+</b>') +
      (bonus ? ' <span style="color:var(--warn)">(+'+bonus+' Mark of Khorne)</span>' : '');
    var rows = [], pend = [];
    var compact = list.filter(function(c){ return c.hit && c.table; }).length > 2;
    list.forEach(function(c){
      var target = esc(shipName(c.to, c.i));
      var arrow = c.repeated ? "Additional Ramilies critical → " : "→ ";
      if(c.hit === null){
        anyPending = true;
        pend.push(c);
        rows.push('<div class="q">'+arrow+target+'</div>');
      } else if(!c.hit){
        rows.push('<div class="q">'+arrow+target+' — rolled <b>'+c.roll+(bonus?"+"+bonus:"")+
          '</b> <span class="no">no critical</span></div>');
      } else {
        rows.push('<div class="q">'+arrow+target+(c.roll!==null?' — rolled <b>'+c.roll+(bonus?"+"+bonus:"")+'</b>':'')+
          ' <span class="ok">CRITICAL HIT</span>'+
          (shipHp(c.to,c.i)<=1 ? ' <span style="color:var(--bad)">— destroyed</span>' : '')+'</div>');
        if(c.table && c.table.table==="escort"){
          /* nothing more to roll: the damage block already says DESTROYED */
        } else if(c.table && compact){
          rows.push('<div class="q" style="padding-left:14px">'+
            '<b>'+(c.table.roll===null?"":c.table.roll+" — ")+esc(c.table.name)+'</b>'+
            (c.extra ? ' <span style="color:var(--warn)">+'+c.extra+'</span>' : '')+
            (c.table.tableLabel && c.table.table!=="standard"
              ? ' <span style="color:var(--dim);font-size:10px">'+esc(c.table.tableLabel)+'</span>' : '')+
            '<span style="display:block;color:var(--dim);font-size:11.5px;line-height:1.25">'+
            esc(c.table.text)+'</span></div>');
          if(c.extra === null){ anyPending = true; rows.push(extraInput(c)); }
        } else if(c.table){
          rows.push('<div class="crit"><b>'+(c.table.roll===null?"":c.table.roll+" — ")+esc(c.table.name)+
            (c.table.tableLabel && c.table.table!=="standard" ? ' <span style="color:var(--dim);font-weight:600;font-size:11px">'+esc(c.table.tableLabel)+'</span>' : '')+
            '</b><span>'+
            esc(c.table.text)+'</span>'+
            (c.table.note ? '<span style="color:var(--dim)">'+esc(c.table.note)+'</span>' : '')+
            (c.extra ? '<span style="color:var(--warn)">Extra damage: '+c.extra+'</span>' : '')+
            (shipHp(c.to,c.i)<=1 ? '<span style="color:var(--bad)">An escort is destroyed by any critical hit.</span>' : '')+
            '</span></div>');
          if(c.extra === null){
            anyPending = true;
            rows.push(extraInput(c));
          }
        } else {
          anyPending = true;
          rows.push(tableInput(c));
        }
        if(c.followup){
          if(c.followup.roll===null){
            anyPending = true;
            rows.push(followupInput(c));
          }else{
            rows.push('<div class="q" style="color:var(--dim);padding-left:14px">'+
              esc(c.followup.result.label)+' D6: <b>'+c.followup.roll+'</b> — '+
              esc(c.followup.result.text)+'</div>');
          }
        }
        if(c.table && c.table.allQuadrants){
          rows.push('<div class="q" style="color:var(--warn);padding-left:14px">Apply the rolled extra damage to all four quadrants. This tracker updates the boarded quadrant; record the same damage on the other three.</div>');
        }
      }
    });
    var done = !pend.length && list.every(function(c){
      return c.hit!==null && (!c.hit || (c.table && c.extra!==null && (!c.followup || c.followup.roll!==null)));
    });
    h.push('<div class="step'+(done?" done":"")+'"><div class="q">'+head+'</div>'+rows.join(""));
    if(pend.length) h.push(critInput(pend));
    h.push('</div>');
  });
  return h.join("");
}
function critInput(pend){
  if(S.dice==="digital"){
    return '<div class="actRow" style="margin:0"><button class="primary" data-r="critroll">Roll D6</button></div>';
  }
  var c = pend[0], key = c.cid;
  var h = ['<div class="dieRow '+c.from+'"><div class="lab '+c.from+'-lab">'+
    (pend.length>1 ? esc(shipName(c.to,c.i))+"<br>1 of "+pend.length : "D6")+'</div>'];
  for(var i=1;i<=6;i++) h.push('<button class="die" data-r="critdie" data-c="'+key+'" data-v="'+i+'">'+i+'</button>');
  h.push('</div>');
  return h.join("");
}
function extraInput(c){
  var key = c.cid, mx = c.table.extra==="D3" ? 3 : 6;
  var h = ['<div class="dieRow"><div class="lab" style="color:var(--warn)">'+esc(c.table.extra)+'<br>damage</div>'];
  for(var i=1;i<=mx;i++) h.push('<button class="die" data-r="critex" data-c="'+key+'" data-v="'+i+'">'+i+'</button>');
  if(mx===3) h.push('<div style="flex:3 1 0"></div>');
  h.push('</div>');
  return h.join("");
}
function followupInput(c){
  var key = c.cid, h = ['<div class="dieRow"><div class="lab" style="color:var(--warn)">'+
    esc(c.followup.rule.label)+'<br>D6</div>'];
  for(var i=1;i<=6;i++) h.push('<button class="die" data-r="critfollow" data-c="'+key+'" data-v="'+i+'">'+i+'</button>');
  h.push('</div>');
  return h.join("");
}
function tableInput(c){
  var key = c.cid, tid = critTableIdFor(c.to, c.i);
  var T = B.CRIT_TABLES[tid];
  if(!T){                      /* escorts are destroyed; Kroot take +1 damage */
    setTableFor(c, 0, tid);
    return "";
  }
  var one = T.dice===1;
  var lo = one?1:2, hi = one?6:12;
  if(S.dice==="digital"){
    return '<div class="actRow" style="margin:0"><button class="primary" data-r="crittable" data-c="'+key+
      '">Roll '+(one?"D6":"2D6")+' on the '+esc(T.label)+' table</button></div>';
  }
  var h = ['<div class="q" style="color:var(--dim);margin-top:2px">'+(one?"D6":"2D6")+' on the '+
           esc(T.label)+' table ('+esc(T.page)+'):</div>',
           '<div style="display:grid;grid-template-columns:repeat(6,1fr);gap:5px">'];
  for(var n=lo;n<=hi;n++) h.push('<button class="die" style="height:38px;font-size:15px" data-r="crittbl" data-c="'+
    key+'" data-v="'+n+'">'+n+'</button>');
  h.push('</div>');
  return h.join("");
}

/* What each hull ends the End Phase on. */
function damageBlock(){
  var sc = R.score, h = [];
  var rows = [];
  ["att","def"].forEach(function(k){
    livingIdx(k).forEach(function(i){
      var o = outcome(k,i);
      /* a ship destroyed by a critical alone takes no damage points, and must
         still appear here */
      if(!o.alloc && !o.extra && o.state==="ok") return;
      var why = [];
      if(o.alloc) why.push(o.alloc+" boarding");
      if(o.extra){
        var names = R.crits.filter(function(x){ return x.to===k && x.i===i && x.hit && x.extra; })
          .map(function(x){ return x.table ? x.table.name.replace(/!$/,"") : "critical"; });
        why.push(names.length > 2
          ? o.extra + " from " + names.length + " critical hits"
          : o.extra + " " + (names.length ? names.join(" + ") : "critical"));
      }
      var tag = o.state==="hulk" ? '<span style="color:var(--bad);font-weight:700">DRIFTING HULK</span>'
              : o.state==="destroyed" ? '<span style="color:var(--bad);font-weight:700">DESTROYED</span>'
              : o.state==="quadrant" ? '<span style="color:var(--bad);font-weight:700">QUADRANT DESTROYED</span>'
              : o.state==="cata" ? '<span style="color:var(--bad);font-weight:700">CATASTROPHIC DAMAGE</span>'
              : '<b class="num">'+o.fin+'</b> DP left';
      if(!why.length) why.push("critical hit");
      rows.push('<div class="mline"><span class="v num" style="color:var(--bad)">'+
        ((o.alloc+o.extra) ? "−"+(o.alloc+o.extra) : "✕")+
        '</span><span class="t">'+esc(shipName(k,i))+' <span style="color:var(--dim)">('+why.join(" + ")+
        ')</span></span><span class="p">'+tag+'</span></div>');
    });
  });
  if(!rows.length) rows.push('<div class="mline"><span class="v">0</span><span class="t">No damage.</span></div>');
  h.push('<div class="step" style="gap:4px">'+rows.join(""));

  /* the owning player distributes the boarding damage himself (p.91) */
  var ids = livingIdx(sc.loser);
  var pool = ids.reduce(function(n,i){ return n + S[sc.loser].ships[i].dp; },0);
  var assignable = Math.min(sc.damage, pool);
  var wasted = sc.damage - assignable;
  if(wasted > 0){
    h.push('<div class="q" style="color:var(--dim);margin-top:2px">'+wasted+
      ' damage point'+(wasted===1?"":"s")+' beyond what is left on the hull'+(ids.length>1?"s":"")+
      ' — wasted.</div>');
  }
  if(ids.length>1 && assignable>0 && assignable<pool){
    var used = ids.reduce(function(n,i){ return n + (R.alloc[sc.loser][i]||0); },0);
    h.push('<div class="q" style="color:var(--dim);margin-top:4px">'+esc(sideName(sc.loser))+
      ' — the owner splits the damage: <b>'+used+'/'+assignable+'</b> assigned</div>');
    ids.forEach(function(i){
      h.push('<div class="dieRow"><div class="lab" style="width:92px;text-align:left;color:var(--ink)">'+
        esc(shipName(sc.loser,i))+'</div>'+
        '<button class="die" style="flex:0 0 44px;height:38px" data-r="alloc-" data-c="'+sc.loser+':'+i+'">−</button>'+
        '<div class="die" style="flex:0 0 44px;height:38px;background:transparent;border-color:transparent">'+
        (R.alloc[sc.loser][i]||0)+'</div>'+
        '<button class="die" style="flex:0 0 44px;height:38px" data-r="alloc+" data-c="'+sc.loser+':'+i+'">+</button>'+
        '<div style="flex:1"></div></div>');
    });
  }
  h.push('</div>');
  return h.join("");
}

/* FL p.240: "Ships boarded by them are also infected by plague in addition to
   all damage inflicted normally, affecting it the same way as if it suffered a
   single Fire critical." It is not a critical roll and does not depend on who
   won, so it is stated, not rolled. */
function arkBlock(){
  if(!B.sideHas(eSide("att"), "ark")) return "";
  var targets = livingIdx("def").map(function(i){ return shipName("def", i); });
  if(!targets.length) return "";
  return '<div class="step"><div class="q"><b>Ark of Pestilence</b> — '+esc(targets.join(", "))+
    (targets.length===1?" is":" are")+' infected by plague as well: treat it as a single '+
    '<b>Fire critical</b> in addition to all damage. Roll to put it out in the End Phase like any '+
    'other fire. A ship hulked this way does not stay on fire and rolls normally on the '+
    'catastrophic damage table.</div></div>';
}

/* A Berzerker Tide fleet may roll D3 extra critical rolls, and then may take no
   special orders in the following turn (FL p.244). Neither book says whether the
   extra rolls use the same threshold, so the app rolls them the same way and
   says so. */
function tideSide(){
  var sc = R.score; if(!sc || !sc.winner) return null;
  var out = [];
  ["att","def"].forEach(function(k){
    if(B.extraCritRolls(eSide(k)) && B.sideHas(eSide(k), "khorne")) out.push(k);
  });
  return out.length ? out : null;
}
function tideBlock(){
  var sides = tideSide(); if(!sides) return "";
  var h = [];
  sides.forEach(function(k){
    var used = R.tide && R.tide[k];
    h.push('<div class="step'+(used?" done":"")+'"><div class="q"><b>Berzerker Tide</b> — '+
      esc(sideName(k))+' may roll D3 extra critical rolls, but may then take no special '+
      'orders next turn.</div>');
    if(used){
      h.push('<div class="q" style="color:var(--dim)">D3 rolled: <b>'+used.n+'</b> extra roll'+
        (used.n===1?"":"s")+' at the same threshold. The books do not say whether the extra '+
        'rolls use the same threshold, so they are rolled the same way.</div>');
    } else {
      h.push('<div class="actRow" style="margin:0"><button data-r="tide" data-c="'+k+
        '">Use the Berzerker Tide</button></div>');
    }
    h.push('</div>');
  });
  return h.join("");
}

/* -------------------------------------------------------- catastrophic ---- */
function drawCata(box){
  var list = cataNeeded(), h = [];
  h.push('<div class="verdict"><div class="head" style="color:var(--bad)">Catastrophic damage</div>'+
    '<div class="sub">A ship reduced to zero by a boarding action is simply a drifting hulk — but these '+
    'were finished off by the <b>extra damage from a critical hit</b>, so they roll on the '+
    'Catastrophic Damage table as normal (p.90).</div></div>');
  list.forEach(function(o){
    var key = o.k+":"+o.i, res = R.cata[key], tid = cataTableIdFor(o.k, o.i);
    if(!res && tid==="nocata4"){ R.cata[key] = B.cataLookup(0, tid); res = R.cata[key]; }
    h.push('<div class="step"><div class="q"><b>'+esc(shipName(o.k,o.i))+'</b></div>');
    if(!res){
      var CT = B.CATA_TABLES[tid], dice = cataDiceFor(o.k,o.i), one = dice===1;
      if(S.dice==="digital"){
        h.push('<div class="actRow" style="margin:0"><button class="primary" data-r="cataroll" data-c="'+key+
          '">Roll '+(dice===1?"D6":dice+"D6")+' on the '+esc(CT.label)+' table</button></div>');
      }else{
        h.push('<div class="q" style="color:var(--dim)">'+(dice===1?"D6":dice+"D6")+' on the '+esc(CT.label)+
          ' table ('+esc(CT.page)+'):</div>');
        h.push('<div style="display:grid;grid-template-columns:repeat(6,1fr);gap:5px">');
        for(var n=(one?1:dice);n<=(one?6:12);n++) h.push('<button class="die" style="height:38px;font-size:15px" data-r="catatbl" data-c="'+key+'" data-v="'+n+'">'+(dice===3&&n===12?"12+":n)+'</button>');
        h.push('</div>');
      }
    }else{
      h.push('<div class="crit"><b>'+(res.roll===null?"":res.roll+" — ")+esc(res.name)+
        (res.tableLabel && res.table!=="standard" ? ' <span style="color:var(--dim);font-weight:600;font-size:11px">'+esc(res.tableLabel)+'</span>' : '')+
        '</b><span>'+esc(res.text)+'</span>'+
        '<span style="color:var(--dim)">Blast Markers: '+esc(res.bm)+'</span></div>');
    }
    h.push('</div>');
  });
  h.push('<div class="spacer"></div>');
  var left = list.some(function(o){ return !R.cata[o.k+":"+o.i]; });
  h.push('<div class="actRow"><button class="primary" data-r="done"'+(left?" disabled":"")+'>Done</button></div>');
  paint(box, h.join(""));
}
