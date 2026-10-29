/* Blood Axe commandeered escorts (user 29.10.2026: "tee ja julkaise kaikki",
   the plan of the same day). "A Blood Axe tiddla skwadron of at least six
   escorts may include up to three Imperial Navy and/or Chaos escorts from any
   fleet list at their listed cost" (Fleets p. 371; ruling T59: the six count
   the commandeered ones too). The list prints them in a section of their own,
   BLOOD AXE COMMANDEERED ESCORTS, far below the tiddlas, and a card from it
   was a squadron card of two that the player had to give the tiddla's letter
   by hand (and the tiddla a letter too). Now:
     - the section's top row names the tiddla its + goes into (the target):
       a tiddla of the Warlord being bought for, when his clan is Blood
       Axes; with more than one the player picks it there
     - its + puts ONE ship into the target - one more on that class's card
       in it, or a card of one with its letter (a tiddla card without a
       letter gets one) - and its - takes one out; the rows say so
     - without a target the top row says what is missing and the rows work
       as before: the legality panel names the rule
     - while a mixed tiddla is filling, the section's + puts its ships into
       that one (view.js)
     - the tiddla section has a line about it, with a link down here
   The tiddla's line in Your fleet, its printed card and Play read the
   letter, as they did. */
import { L } from "./model.js";
import { appState } from "./state.js";
import { mixRule } from "./mixed.js";
import { fleetResolved } from "./validation.js";
import { activeWarlordIdx, freeSqTag, isCommandeered, warlordIdx, warlordSkwadrons } from "./warlords.js";
import { esc } from "../../../packages/ui/format.js";

const BA = () => L().bloodaxe || null;
/* the section the commandeered rows are in, -1 without one */
export function baSec(){
  const B = BA();
  return B ? L().secs.findIndex(s => new RegExp(B.sec, "i").test(String(s.t).trim())) : -1;
}
export const isBaSec = si => si >= 0 && si === baSec();
const axeClan = c => /blood axes/i.test(String(c || ""));

/* Where the section's + goes: { tiddlas: [...], target, why }. A tiddla is
   { key, tag, units, ork, com, room }; why says what is missing when there
   is no target. */
export function baState(){
  const B = BA();
  if(!B) return { tiddlas: [], target: null, why: "" };
  const RF = fleetResolved(), ws = warlordIdx(RF), wa = activeWarlordIdx(RF);
  /* A mixed tiddla being filled takes them whatever its Warlord's clan (user
     29.10.2026: "it should be in the add mixed squadron feature; the
     squadron is just red if it is not by the rules and under the right
     boss") - the legality panel and its row say what is wrong. */
  const M = appState.MIX, mr = M && M.list === L().nm ? mixRule(M.si) : null;
  if(mr && mr.tiddla){
    let ork = 0, com = 0;
    const units = appState.S.units.map((u, i) => !u.lst && u.sq === M.tag ? i : -1).filter(i => i >= 0);
    units.forEach(i => { const h = appState.S.units[i].n || 1; if(isCommandeered(appState.S.units[i])) com += h; else ork += h; });
    return { tiddlas: [], why: "", warlord: ws.indexOf(wa) + 1,
             target: { key: M.tag, tag: M.tag, units, ork, com, room: Math.max(0, B.max - com), filling: true } };
  }
  if(!ws.length) return { tiddlas: [], target: null, why: "Add a Warlord whose clan is Blood Axes first." };
  const W = (RF.warlords || []).filter(x => x.unit === wa)[0];
  const n = ws.indexOf(wa) + 1;
  if(!W || !(W.clans || []).some(axeClan))
    return { tiddlas: [], target: null, why: "Buying for Warlord " + n + ", whose clan is not Blood Axes: pick Blood Axes for him, or buy for a Blood Axe Warlord." };
  const tiddlas = warlordSkwadrons(RF, wa).filter(g => g.kind === "tiddla").map(g => {
    let ork = 0, com = 0;
    g.units.forEach(i => { const h = RF.units[i] ? Math.max(1, RF.units[i].hulls | 0) : 1;
      if(isCommandeered(appState.S.units[i])) com += h; else ork += h; });
    const u0 = appState.S.units[g.units[0]];
    return { key: g.tag || "u:" + u0.uid, tag: g.tag, units: g.units, ork, com, room: Math.max(0, B.max - com) };
  }).filter(t => t.ork > 0);
  if(!tiddlas.length) return { tiddlas, target: null, why: "Warlord " + n + " has no tiddla (escort) skwadron yet: these escorts join one." };
  /* the one picked, else the first with room */
  const pick = tiddlas.filter(t => t.key === appState.BA_TO)[0] || tiddlas.filter(t => t.room > 0)[0] || tiddlas[0];
  return { tiddlas, target: pick, why: "", warlord: n };
}
const nameOf = t => t.filling ? "mixed squadron " + t.tag : t.tag ? "tiddla " + t.tag : "his tiddla";

/* + on a commandeered row: one ship into the target. False without one. */
export function baAddOne(si, ei, addUnitFrom){
  const st = baState(), t = st.target;
  if(!t) return false;
  let tag = t.tag;
  if(!tag){
    tag = freeSqTag();
    t.units.forEach(i => { appState.S.units[i].sq = tag; });
    appState.BA_TO = tag;
  }
  let u = appState.S.units.filter(x => !x.lst && x.s === si && x.e === ei && x.sq === tag)[0];
  if(u) u.n = (u.n || 1) + 1;
  else {
    const before = appState.S.units.slice();
    addUnitFrom(appState.S.li, si, ei, null);
    u = appState.S.units.filter(x => before.indexOf(x) < 0)[0];
    if(!u) return true;
    u.n = 1; u.sq = tag;
  }
  appState.JUST = Object.assign(appState.JUST || {}, { unit: u });
  return true;
}
/* - on a commandeered row: one ship of that class out of the target. */
export function baSubOne(si, ei){
  const t = baState().target;
  if(!t || !t.tag) return false;
  const u = appState.S.units.filter(x => !x.lst && x.s === si && x.e === ei && x.sq === t.tag)[0];
  if(!u) return false;
  if((u.n || 1) > 1) u.n--; else appState.S.units.splice(appState.S.units.indexOf(u), 1);
  return true;
}
/* the class's ships in the target, for the row's count and its - */
export function baInTarget(si, ei){
  const t = baState().target;
  if(!t || !t.tag) return 0;
  return appState.S.units.filter(x => !x.lst && x.s === si && x.e === ei && x.sq === t.tag).reduce((a, x) => a + (x.n || 1), 0);
}

/* the section's top row: where the + goes, and the choice of tiddla */
export function baTopHTML(){
  const st = baState(), B = BA();
  if(!B) return "";
  const rule = `up to ${B.max} Imperial Navy or Chaos escorts in a Blood Axe tiddla of ${B.min} or more (Fleets p. ${B.cite.pg})`;
  if(!st.target) return `<div class="pick batop no"><div class="nm">Into a Blood Axe tiddla<small>${esc(st.why)} The rule: ${esc(rule)}.</small></div></div>`;
  const t = st.target;
  if(t.filling) return `<div class="pick batop"><div class="nm">Into mixed squadron ${esc(t.tag)}, being filled<span class="tag sq">${t.ork} Ork + ${t.com} commandeered</span>
      <small>Each + puts one ship into it, each &minus; takes one out. The rule: ${esc(rule)}; the legality panel and the squadron's row say when it is not kept.</small></div></div>`;
  const line = `${t.ork} Ork + ${t.com} commandeered &middot; ${t.room ? "room for " + t.room : "full"}${t.ork + t.com < B.min ? " &middot; needs " + (B.min - t.ork - t.com) + " more to reach " + B.min : ""}`;
  const seg = st.tiddlas.length > 1 ? `<span class="seg">${st.tiddlas.map(x => `<button type="button" class="segb${x === t ? " on" : ""}" data-bato="${esc(x.key)}"
      aria-pressed="${x === t}" title="${esc(x.ork + " Ork + " + x.com + " commandeered")}">${esc(x.tag || "untagged")}</button>`).join("")}</span>` : "";
  return `<div class="pick batop"><div class="nm">Into ${esc(nameOf(t))} of Warlord ${st.warlord}<span class="tag sq">${line}</span>
      <small>Each + puts one ship into it, each &minus; takes one out: ${esc(rule)}.</small></div>${seg ? `<span class="acts">${seg}</span>` : ""}</div>`;
}
/* the row's tag in the section, in place of "squadron card" */
export function baRowTag(){
  const st = baState();
  return st.target ? `<span class="tag sq" title="One ship a +, into ${esc(nameOf(st.target))} (Fleets p. 371)">into ${esc(nameOf(st.target))}</span>`
    : `<span class="tag no" title="${esc(st.why)}">needs a Blood Axe tiddla</span>`;
}
/* the tiddla section's line about them, whatever the Warlord's clan (user
   29.10.2026: "I did not figure out how to add the IN and Chaos ships"):
   for a Blood Axe Warlord where they are, for another what it takes */
export function baHintHTML(){
  const B = BA();
  if(!B || baSec() < 0) return "";
  const RF = fleetResolved(), wa = activeWarlordIdx(RF), W = (RF.warlords || []).filter(x => x.unit === wa)[0];
  const axe = !!(W && (W.clans || []).some(axeClan));
  /* the way in is Mixed squadron (user 29.10.2026: "use the mixed squadron feature") */
  return `<div class="pick bahint"><div class="nm"><small>Blood Axes: a tiddla of ${B.min} or more may take up to ${B.max} Imperial Navy or Chaos escorts (Fleets p. ${B.cite.pg}).
    Start a <b>Mixed squadron</b> above, then + them under <button type="button" class="lnk" data-bajump>Blood Axe commandeered escorts &darr;</button>${
      axe ? "" : " - for a Blood Axe Warlord: pick Blood Axes as his clan, or the squadron is red"}.</small></div></div>`;
}
