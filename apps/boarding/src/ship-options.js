/* One ship's options sheet: what the player buys or brings for it. */

import { AUTO, FLEETS, OPTS } from "./catalogue.js";
import { S, eShip, profile } from "./state.js";
import { esc, render } from "./render.js";
import { resetRound } from "./action.js";
import { closeSheet, openSheet } from "./sheets.js";
import { stepTurrets } from "./events.js";

/* -------------------------------------------------------------- ship options */
export function shipOpts(k,i){
  var u = S[k].ships[i], p = profile(u), race = FLEETS[S[k].f].race;
  var auto = (p && p.fl) || [];
  openSheet({
    title:(p?p.n:"Ship"), sub:"Upgrades and crew", mode:"list",
    items:function(){
      var h = [];
      auto.forEach(function(f){
        var a = AUTO[f]; if(!a) return;
        h.push('<div class="opt on locked"><span class="box">●</span><span class="txt"><b>'+esc(a.t)+
          '</b><span>'+esc(a.d)+' — part of this hull’s profile.</span></span></div>');
      });
      var hulk = auto.indexOf("spacehulk")>=0 || (u.opts||[]).indexOf("spacehulk")>=0;
      var BV_UP = ["khorne","abaddon","warlord"];   /* FL p.288, p.390 */
      OPTS.filter(function(o){
        if(o.r.indexOf(race)<0 || auto.indexOf(o.id)>=0) return false;
        if(o.only && (!p || o.only.indexOf(p.full)<0)) return false;
        if(auto.indexOf("blackship")>=0 && (o.id==="marines" || o.id==="greyknights")) return false;
        if(o.noflag && auto.indexOf(o.noflag)>=0) return false;
        if(hulk && BV_UP.indexOf(o.id)>=0) return false;
        return true;
      }).forEach(function(o){
        var on = (u.opts||[]).indexOf(o.id)>=0;
        h.push('<button class="opt'+(on?" on":"")+'" data-pick="'+o.id+'"><span class="box">✓</span>'+
          '<span class="txt"><b>'+esc(o.t)+'</b><span>'+esc(o.d)+'</span></span></button>');
      });
      var pr2 = profile(u), es2 = eShip(u);
      if(pr2 && pr2.fl && pr2.fl.indexOf("fortress")>=0){
        h.push('<div class="mline tot"><span class="v"></span><span class="t"><b>Other quadrants</b>'+
          ' <span style="color:var(--dim);font-weight:600">— all four quadrants’ remaining hit points count (p.502)</span></span></div>');
        h.push('<div class="dieRow"><div class="lab" style="width:104px;text-align:left;color:var(--dim)">'+
          'Their HP</div>'+
          '<button class="die" style="flex:0 0 46px;height:40px" data-pick="q:-1">−</button>'+
          '<div class="die" style="flex:0 0 52px;height:40px;background:transparent;border-color:transparent">'+
          (+u.q || 0)+'</div>'+
          '<button class="die" style="flex:0 0 46px;height:40px" data-pick="q:1">+</button>'+
          '<div style="flex:1"></div></div>');
        h.push('<div class="mline sub"><span class="v"></span><span class="t">The damage points left on '+
          'the three quadrants that are not being boarded. Only the boarded quadrant’s turrets count, '+
          'and damage still lands on that quadrant alone.</span></div>');
      }
      var tuName = (pr2 && pr2.spores) ? "Spore cysts" : "Turrets";
      h.push('<div class="mline tot"><span class="v"></span><span class="t"><b>'+tuName+' remaining</b>'+
        ' <span style="color:var(--dim);font-weight:600">— the ship being boarded adds these (p.89)</span></span></div>');
      h.push('<div class="dieRow"><div class="lab" style="width:104px;text-align:left;color:var(--dim)">'+
        tuName+'</div>'+
        '<button class="die" style="flex:0 0 46px;height:40px" data-pick="tu:-1">−</button>'+
        '<div class="die" style="flex:0 0 52px;height:40px;background:transparent;border-color:transparent">'+
        es2.turrets+'</div>'+
        '<button class="die" style="flex:0 0 46px;height:40px" data-pick="tu:1">+</button>'+
        '<div style="flex:1"></div></div>');
      h.push('<div class="mline sub"><span class="v"></span><span class="t">'+
        (pr2 && es2.turrets !== pr2.tu
          ? '<b style="color:var(--warn)">Set by hand</b> — the profile prints '+pr2.tu+'.'
          : 'The profile value. Change it if the ship bought more or has had them shot away.')+
        '</span></div>');
      if(!h.length) h.push('<div class="mline"><span class="t">This fleet has no boarding upgrades to choose.</span></div>');
      if(S[k].ships.length > 1){
        h.push('<button class="opt" data-pick="__remove" style="margin-top:6px;border-color:#5c3a36">'+
          '<span class="box" style="border-color:#5c3a36;color:#e0584a">✕</span><span class="txt">'+
          '<b>Remove this ship</b><span>Take it out of this boarding action.</span></span></button>');
      }
      return h;
    },
    onPick:function(id, el){
      if(id === "q:-1" || id === "q:1"){
        u.q = Math.max(0, Math.min(99, (+u.q || 0) + (id==="q:1"?1:-1)));
        if(!u.q) delete u.q;
        render(); shipOpts(k,i); return;
      }
      if(id === "tu:-1"){ stepTurrets(k,i,-1); shipOpts(k,i); return; }
      if(id === "tu:1"){ stepTurrets(k,i,1); shipOpts(k,i); return; }
      if(id === "__remove"){ S[k].ships.splice(i,1); resetRound(); closeSheet(); render(); return; }
      u.opts = u.opts || [];
      var j = u.opts.indexOf(id);
      if(j>=0) u.opts.splice(j,1); else u.opts.push(id);
      el.classList.toggle("on");
      render();
    }
  });
}
