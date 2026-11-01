import { appState } from "./state.js";
import { KEY_INFO, KEY_PLAY, OPT, TRACK, lsDel, lsGet, lsSet, normaliseUntracked, saveOpts } from "./storage.js";
import { $ } from "./helpers.js";
import { resolveFleet } from "./fleet-document.js";
import { KEY_VIEW, KEY_WAKE, applyCommanderLd, cmdsAboard, coCmd, forgetLdDie, rollAllLd, rollAllPre, rollLd, save, setLd, setPre } from "./game-state.js";
import { crippledNow, unitName } from "./derived.js";
import { jumpTo, pageLabel, render, rrOpen, rrPool, showPop, topRow, wake } from "./render.js";
import { repairable } from "./share.js";
import { clearRepairNotes, pickRepair, rollAllRepairs, rollRepair } from "./repair.js";
import PLAY from "../rules.js";
import { esc } from "../../../packages/ui/format.js";

/* ============================================================ ACTIONS ===== */
export function snapshot(){ appState.UNDO.push(JSON.stringify(appState.G)); if(appState.UNDO.length > 30) appState.UNDO.shift(); }
/* The Catastrophic Damage table is for a ship at 0 hits: after UNDO, or a
   tap that took the ship back up, the open one is dropped. */
export function dropStalePop(){
  if(appState.V.pop && appState.V.pop.kind === "hulk" && appState.U[appState.V.pop.i] && appState.G.st[appState.V.pop.i] && !PLAY.destroyed(appState.U[appState.V.pop.i].R, appState.G.st[appState.V.pop.i])) appState.V.pop = null;
}
/* The CATASTROPHIC button's second line: the result taken, else the roll
   this ship makes - or that it makes none. */
export function cataLabel(R, st){
  if(st.hulkName) return esc(st.hulkName);
  const c = PLAY.catastrophic(R);
  return c.dice ? "roll " + c.dice : "no roll";
}
/* A critical result's name as the ship's own table prints it. */
export function critLabel(R, key){
  const cm = R && R.damage && R.damage.critical;
  const row = cm && cm.rows.find(r => String(r[0]) === String(key));
  if(row) return String(key) + " " + row[1];
  const d = PLAY.CRITS[String(key)];
  return String(key) + (d ? " " + d.name : "");
}
export function critCountText(tk, key){
  const n = tk && tk.crits ? (tk.crits[String(key)] | 0) : 0;
  return n > 1 ? " (now \u00d7" + n + ")" : "";
}
/* A star fort's selected quadrant, for the line that says where a hit or
   a critical went ("NE quadrant"); nothing for any other unit. */
export function quadWord(R, st){ return PLAY.isFort(R) && st.quads ? PLAY.QUADS[st.qsel | 0] + " quadrant" : ""; }
export function toast(msg, cls){
  const t = document.createElement("div");
  if(cls) t.className = cls;
  t.textContent = msg;
  $("#toast").appendChild(t);
  setTimeout(() => t.remove(), 4200);
}
export function buzz(ms){ try{ if(navigator.vibrate) navigator.vibrate(ms || 60); }catch(e){} }

/* Members of a unit's squadron (itself when it is not in one). */
export function members(i){
  const g = appState.G.grp[i];
  if(!g) return [i];
  return appState.G.grp.map((x, j) => x === g ? j : -1).filter(j => j >= 0);
}
export function groupUnits(letter){ return appState.G.grp.map((x, j) => x === letter ? j : -1).filter(j => j >= 0); }

export function act(name, i, arg){
  if(name === "undo"){
    if(!appState.UNDO.length) return;
    appState.G = JSON.parse(appState.UNDO.pop());
    clearRepairNotes();
    /* a helper's shown result went with what it marked */
    if(appState.V.actions) appState.V.actions.res = null;
    const res = resolveFleet(appState.G.doc); appState.U = res.units; appState.L0 = res.L0;
    dropStalePop();
    save(); render(); return;
  }
  if(name === "info"){ appState.V.info = !appState.V.info; lsSet(KEY_INFO, appState.V.info ? "1" : "0"); render(); return; }
  /* full rows or compact rows: a choice of view, not an event - the row at
     the top of the screen stays where it was, so the eye keeps its place */
  if(name === "view"){
    const keep = topRow();
    appState.V.compact = !appState.V.compact; lsSet(KEY_VIEW, appState.V.compact ? "compact" : "full");
    if(appState.V.pop && appState.V.pop.kind !== "hulk") appState.V.pop = null;
    render();
    if(keep){ const el = document.querySelector('section.row[data-u="' + keep.u + '"]'); if(el) window.scrollBy(0, el.getBoundingClientRect().top - keep.top); }
    return;
  }
  /* the strip of ships at the bottom: the user's own gesture moves the
     screen to that ship (30.9.2026 allows that - only render never scrolls) */
  if(name === "jump"){ jumpTo(i); return; }
  if(name === "endph"){ appState.V.endph = !appState.V.endph; render(); return; }
  /* the fleet list from the menu (user 19.10.2026: the "to phone" QR codes
     are there): the game record stays, the list offers Resume */
  /* a name under a grey Start: its row into view (the player's own tap) */
  if(name === "seek"){ const r = document.querySelector('.setrow[data-u="' + i + '"]'); if(r && r.scrollIntoView) r.scrollIntoView({ block: "center", behavior: "smooth" }); return; }
  /* back to the set-up during a game (user 31.10.2026): Leadership, the
     squadrons and the opponent's room; the game record stays */
  if(name === "setupback"){ if(!appState.G) return; appState.V.menu = false; appState.V.sheet = null; appState.V.pop = null; appState.V.endph = false; appState.V.screen = "setup"; render(); window.scrollTo(0, 0); return; }
  if(name === "fleets"){ appState.V.menu = false; appState.V.sheet = null; appState.V.pop = null; appState.V.endph = false; appState.V.phone = null; appState.V.screen = "load"; render(); return; }
  if(name === "wake"){ lsSet(KEY_WAKE, lsGet(KEY_WAKE) === "0" ? "1" : "0"); wake(); render(); return; }
  if(name === "pop"){
    appState.V.pop = (appState.V.pop && appState.V.pop.i === i && appState.V.pop.kind === arg) ? null : { i: i, kind: arg };
    render();
    if(appState.V.pop) showPop();
    return;
  }
  if(name === "closepop"){ appState.V.pop = null; render(); return; }
  if(name === "critpick"){ appState.V.pop = { i: i, kind: "crit", x: arg ? String(arg) : null }; render(); return; }
  if(name === "page"){
    /* a page is a scroll position: jump there, nothing re-renders */
    if(!appState.V.pageTops) return;
    const to = Math.max(0, Math.min(appState.V.pages - 1, (appState.V.page | 0) + arg));
    window.scrollTo(0, appState.V.pageTops[to]);
    pageLabel();
    return;
  }
  /* the card opens over the screen, under the finger: a double tap must
     not land on it */
  if(name === "sheet"){ appState.V.sheetY = window.scrollY || 0; appState.V.sheet = i; appState.V.pop = null; render(); appState.V.guardUntil = Date.now() + 350; return; }
  /* back to the fleet where it was left (the card used to send the roster
     to its top, and the ship had to be found again) */
  if(name === "closesheet"){ appState.V.sheet = null; appState.V.pop = null; render(); if(appState.V.sheetY != null) window.scrollTo(0, appState.V.sheetY); return; }
  if(name === "menu"){ appState.V.menu = !appState.V.menu; render(); return; }
  if(name === "newgame"){
    if(!confirm("Forget this game's record and go back to the fleet list?")) return;
    lsDel(KEY_PLAY); appState.G = null; appState.U = []; appState.UNDO = []; appState.V = Object.assign(appState.V, { screen: "load", sheet: null, pop: null, menu: false });
    render(); return;
  }
  if(name === "track"){
    if(arg === "all"){ const on = !TRACK.every(t => OPT[t[0]]); TRACK.forEach(t => { OPT[t[0]] = on; }); }
    else OPT[arg] = !OPT[arg];
    saveOpts();
    if(appState.G){ normaliseUntracked(appState.G); save(); }
    render(); return;
  }
  if(!appState.G) return;
  /* the line a repair roll left goes with the next thing done */
  if(!/^repair/.test(name) && appState.V.repNote) clearRepairNotes();
  if(name === "repairall"){
    snapshot();
    if(!rollAllRepairs()) appState.UNDO.pop();
    save(); render(); return;
  }
  snapshot();
  const st = appState.G.st[i], R = appState.U[i] && appState.U[i].R, fleet = appState.G.fleet;
  const before = R && R.kind === "ship" ? PLAY.view(R, st, fleet) : null;
  /* where this unit's hits and criticals are counted: on itself, or on a
     star fort's selected quadrant (Fleets p. 501) */
  const tk = R && st ? PLAY.track(R, st) : st;
  switch(name){
    /* a tapped value is the player's: a rolled die that gave another one
       is forgotten (T44) */
    case "ld": if(arg !== st.ldRoll) forgetLdDie(i); setLd(i, arg); break;
    case "ldclear": st.ld = null; st.ldRoll = null; st.ldFrom = null; forgetLdDie(i); break;
    /* the set-up screen's dice (user 31.10.2026, RULINGS.md T44): only
       what is still without a value - there is no re-roll; a change after
       the roll is a manual input (user 31.10.2026) */
    case "rollld": rollAllLd(false); break;
    case "rollpre": rollAllPre(false); break;
    case "rollone": if(st.ld == null) rollLd(i); break;
    case "pre": setPre(i, arg.key, arg.v); break;
    case "flag": appState.G.flag = arg; applyCommanderLd(); break;
    case "on": appState.G.on = appState.G.on || {}; appState.G.on[i] = arg; break;
    case "wl2": st.wl2 = !st.wl2; break;
    case "grp": { const seq = [null, "A", "B", "C"]; appState.G.grp[i] = seq[(seq.indexOf(appState.G.grp[i]) + 1) % seq.length]; break; }
    case "start": appState.G.started = true; appState.V.screen = "roster"; break;
    /* which quadrant of a star fort the card shows and the next tap goes
       to: a choice of view, not an event - nothing for UNDO to take back,
       and an open table stays open and follows the quadrant */
    case "quad": PLAY.selectQuad(st, arg); appState.UNDO.pop(); save(); render(); return;
    /* once a Catastrophic Damage result is on the card, its damage is
       not edited by a tap - a wreck's hits are the wreck's; UNDO is the
       way back */
    case "hit": if(st.hulkName) break; PLAY.addHits(R, st, 1); break;
    case "dmg": if(st.hulkName || st.destroyed) break; PLAY.tapHit(R, st, arg); break;
    /* the fires burn in every End Phase - both players repair in it (p. 88),
       so twice a round - and the button counts how many times this turn
       they went on (J192's counter): a second tap is seen, not blocked */
    case "fire": {
      const n = Math.max(1, PLAY.fireDamage(R, st)); PLAY.addHits(R, st, n);
      st.fireN = st.fireTurn === fleet.turn ? (st.fireN | 0) + 1 : 1; st.fireTurn = fleet.turn;
      appState.V.flash = { i: i, key: null, t: Date.now(), msg: "+" + n + " hit" + (n > 1 ? "s" : "") + " from " + (n > 1 ? n + " fires" : "the fire") + " (p. 67)" }; break; }
    /* damage control in the End Phase (p. 88): one system repaired or one
       fire out per 6; a result that may not be repaired (p. 67) stays */
    case "repairroll": if(!rollRepair(i)){ appState.UNDO.pop(); return; } break;
    case "repairpick": if(!pickRepair(i, String(arg))){ appState.UNDO.pop(); return; } break;
    case "repair": {
      const key = String(arg);
      if(!tk.crits || !(tk.crits[key] > 0) || !repairable(R, key)){ appState.UNDO.pop(); return; }
      PLAY.repairCrit(st, key, R); break;
    }
    case "crit": {
      /* a quadrant at 0 takes no further damage (Fleets p. 501): nothing
         is recorded and no UNDO step is spent */
      if(PLAY.quadGone(R, st)){ appState.UNDO.pop(); render(); return; }
      /* p. 67: a location the ship does not have, or a repeated permanent
         result, is applied as the next result; if that is 11 or 12 the
         card asks for the D3/D6 first (RULINGS.md T4, T6) */
      const tgt = PLAY.critTarget(st, String(arg), R);
      const tdef = PLAY.standardCrits(R) ? PLAY.CRITS[tgt] : null;
      if(tdef && typeof tdef.extra === "string"){
        /* the table stays open and asks for the D3/D6 in place */
        appState.V.pop = { i: i, kind: "crit", x: tgt };
        appState.V.flash = { i: i, key: tgt, t: Date.now(), msg: String(arg) + " cannot be applied here, it counts as " + tgt + ": pick the " + tdef.extra + " roll below (p. 67)" };
        appState.UNDO.pop(); render(); return;
      }
      const k = PLAY.addCrit(st, arg, R);
      const notes = [];
      if(k !== String(arg)) notes.push(String(arg) + " cannot be applied here, it counts as " + k + " (p. 67)");
      if(tdef && tdef.extra === 1){ PLAY.addHits(R, st, 1); notes.push("+1 hit (p. 67)"); }
      if(k === "9" && PLAY.standardCrits(R) && i === appState.G.flag && !fleet.rerollsLost){
        PLAY.flagshipBridgeSmashed(fleet);
        notes.push("flagship: Fleet Commander re-rolls lost for the battle (p. 67)");
      }
      /* T43: an equal commander's own re-rolls on his own ship */
      if(k === "9" && PLAY.standardCrits(R)) cmdsAboard(i).filter(coCmd).forEach(j => {
        if(appState.G.st[j].rerollsLost) return;
        PLAY.flagshipBridgeSmashed(appState.G.st[j]);
        notes.push(unitName(j) + "'s re-rolls lost for the battle (p. 67)");
      });
      /* the table stays open (user 30.9.2026): the tile flashes and the
         line at the top says what went on the ship */
      appState.V.pop = { i: i, kind: "crit" };
      appState.V.flash = { i: i, key: k, t: Date.now(), msg: "Added " + critLabel(R, k) + critCountText(tk, k) + (notes.length ? " \u00b7 " + notes.join(" \u00b7 ") : "") };
      break;
    }
    case "critx": {
      if(PLAY.quadGone(R, st)){ appState.UNDO.pop(); render(); return; }
      const key = arg.split(":")[0], n = parseInt(arg.split(":")[1], 10) || 0;
      PLAY.addCrit(st, key, R); PLAY.addHits(R, st, n);
      appState.V.pop = { i: i, kind: "crit" };
      appState.V.flash = { i: i, key: key, t: Date.now(), msg: "Added " + critLabel(R, key) + " \u00b7 +" + n + " hit" + (n > 1 ? "s" : "") + critCountText(tk, key) };
      break;
    }
    case "critminus": {
      /* The minus is the repair (damage control, p. 88) and the correction
         of a mis-tap both: the count comes off, the damage stays - a repair
         does not heal hits. A mis-tapped +1 hit (6 Engine, 8 Thrusters)
         comes off with UNDO or on the hit track. */
      const key = String(arg);
      if(!tk.crits || !(tk.crits[key] > 0)){ appState.UNDO.pop(); return; }
      PLAY.removeCrit(st, key, R);
      /* the flagship's last Bridge Smashed taken off again: the re-roll
         boxes are back as they were (the 9 was a slip - it cannot be
         repaired, p. 67) */
      const rrBack = key === "9" && PLAY.standardCrits(R) && i === appState.G.flag && fleet.rerollsLost && !((tk.crits || {})[key] > 0);
      if(rrBack) PLAY.flagshipBridgeRestored(fleet);
      const coBack = key === "9" && PLAY.standardCrits(R) && !((tk.crits || {})[key] > 0)
        ? cmdsAboard(i).filter(j => coCmd(j) && appState.G.st[j].rerollsLost) : [];
      coBack.forEach(j => PLAY.flagshipBridgeRestored(appState.G.st[j]));
      appState.V.pop = { i: i, kind: "crit", x: appState.V.pop && appState.V.pop.i === i ? appState.V.pop.x : null };
      appState.V.flash = { i: i, key: null, t: Date.now(), msg: "Removed " + critLabel(R, key) + ((tk.crits[key] | 0) ? " (now \u00d7" + tk.crits[key] + ")" : "") + " \u00b7 hits stay" + (rrBack || coBack.length ? " \u00b7 re-rolls back" : "") };
      break;
    }
    /* a unit that cannot move goes straight to SHOT (Rulebook p. 100) */
    case "played": members(i).forEach(j => PLAY.cyclePlayed(appState.G.st[j], appState.U[j].R)); break;
    case "kill": if(st.members[arg].dead) PLAY.reviveMember(st, arg); else PLAY.killMember(st, arg); break;
    case "hulk": {
      /* arg = index into PLAY.catastrophic(R).rows, or "boarded" (p. 90);
         only a ship at 0 hits takes a result */
      if(!PLAY.destroyed(R, st)) break;
      const c = PLAY.catastrophic(R);
      if(arg === "boarded" && !c.boarded) break;
      const row = arg === "boarded" ? { kind: "drifting", name: c.rows[0].name, text: c.rows[0].text + " (boarded to 0: no roll, p. 90)" } : c.rows[arg];
      if(!row) break;
      if(row.kind === "gone"){ st.destroyed = true; st.hulk = null; } else { st.hulk = row.kind; }
      st.hulkName = row.name; st.hulkText = row.text;
      appState.V.pop = null; break;
    }
    /* a boarding action's result (board.js): the hits are the action's total,
       a critical's extra damage already in it; a ship boarded to 0 is a drifting
       hulk without a roll (p. 90) */
    case "boardres": arg.forEach(x => {
      if(PLAY.isEscort(R)){ if(x.fin <= 0) PLAY.killMember(st, x.m); return; }
      PLAY.addHits(R, st, x.before - x.fin);
      x.crits.forEach(c => {
        const keys = R.damage && R.damage.critical && R.damage.critical.rows ? R.damage.critical.rows.map(r => String(r[0])) : [];
        if(!PLAY.standardCrits(R) && keys.indexOf(String(c.n)) < 0) return;
        const k = PLAY.addCrit(st, String(c.n), R);
        if(k === "9" && PLAY.standardCrits(R)){
          if(i === appState.G.flag && !fleet.rerollsLost) PLAY.flagshipBridgeSmashed(fleet);
          cmdsAboard(i).filter(coCmd).forEach(j => { if(!appState.G.st[j].rerollsLost) PLAY.flagshipBridgeSmashed(appState.G.st[j]); });
        }
      });
      const c = PLAY.catastrophic(R);
      const row = x.state === "hulk" && c.boarded ? { kind: "drifting", name: c.rows[0].name, text: c.rows[0].text + " (boarded to 0: no roll, p. 90)" }
        : x.cata ? (c.rows || []).find(r => r.name === x.cata.name) : null;
      if(row && PLAY.destroyed(R, st)){
        if(row.kind === "gone"){ st.destroyed = true; st.hulk = null; } else st.hulk = row.kind;
        st.hulkName = row.name; st.hulkText = row.text;
      }
    }); break;
    case "diseng": st.disengaged = !st.disengaged; break;
    /* --- opt-in tracking (menu > Tracking); no button emits these when off --- */
    case "brace": members(i).forEach(j => PLAY.setOrder(appState.G.st[j], fleet, "BFI", true)); appState.V.pop = null; break;
    case "bracefail": members(i).forEach(j => PLAY.setOrder(appState.G.st[j], fleet, "BFI", false)); appState.V.pop = null;
      toast("Brace failed: locked against this attacker (p. 47); no further orders this turn, brace excepted (p. 48)"); break;
    case "bracelock": members(i).forEach(j => { appState.G.st[j].braceLock = false; }); break;
    case "order": members(i).forEach(j => PLAY.setOrder(appState.G.st[j], fleet, arg, true)); appState.V.pop = null; break;
    case "orderfail": PLAY.setOrder(st, fleet, "LO", false); appState.V.pop = null;
      toast("Command check failed: no more special orders this turn except Brace (p. 48)"); break;
    case "clearorder": members(i).forEach(j => { appState.G.st[j].order = null; appState.G.st[j].braceTurn = 0; appState.G.st[j].braceCarry = null; }); appState.V.pop = null; break;
    case "boarding": st.boarding = !st.boarding; break;
    case "nofire": st.noOrdersTurn = !st.noOrdersTurn; break;
    /* the helpers of a ship's Actions (ship-actions.js, p. 55-57, 92) */
    case "disengage":
      arg.ms.forEach(j => { const s = appState.G.st[j]; if(arg.ok) s.disengaged = true; else s.noOrdersTurn = true; });
      /* "falls out of the squadron and may not attempt to re-join it" (p. 57) */
      if(!arg.ok && appState.G.grp[i] && !isEscGrp(appState.G.grp[i])) appState.G.grp[i] = null;
      break;
    case "ramhits":
      if(PLAY.isEscort(R)){ for(let n = 0; n < arg; n++){ const k = st.members.findIndex(m => !m.dead); if(k >= 0) PLAY.killMember(st, k); } }
      else PLAY.addHits(R, st, arg);
      break;
    case "teleported": st.teleported = true; break;
    case "torps": st.torps = !st.torps; break;
    case "craft": st.craft = !st.craft; break;
    case "blast": if(arg === 0) PLAY.clearBlast(st); else st.blast = Math.max(0, (st.blast | 0) + arg); break;
    case "rr": PLAY.adjustRerolls(fleet, arg); break;
    /* one box: that re-roll is used, or back if the tap was a slip */
    case "rrbox": PLAY.toggleReroll(rrPool(i), arg); break;
    /* an open option of the list, bought after all: a box of its own */
    case "rropt": if(!rrOpen(i)){ appState.UNDO.pop(); return; } PLAY.addReroll(rrPool(i), "optional"); break;
    case "enemy": fleet.enemyOrders = !fleet.enemyOrders; break;
    case "rad": fleet.radiation = Math.max(0, (fleet.radiation | 0) + arg); break;
    case "ac": appState.G.ac = Math.max(0, (appState.G.ac | 0) + arg); break;
    case "endturn": PLAY.endTurn(appState.G.st, fleet); appState.V.pop = null; appState.V.endph = false; break;
    /* the turn button: played marks off, turn counter up (orders, braces
       and blast markers live on the table as tokens - not here) */
    case "newturn": PLAY.newTurn(appState.G.st, fleet); appState.V.pop = null; appState.V.endph = false; break;
    default: appState.UNDO.pop(); return;
  }
  dropStalePop();
  if(before){
    const after = PLAY.view(R, st, fleet);
    const qw = quadWord(R, st);
    if(!before.crippled && after.crippled){
      buzz(120);
      toast(unitName(i) + (qw ? " " + qw : "") + " CRIPPLED: " + crippledNow(R, st) + " (" + (after.fort ? "Fleets p. 501" : "p. 65") + ")", "crip");
    }
    /* a star fort's quadrant at 0 (Fleets p. 501); the fort itself stands
       until all four are (p. 502) */
    if(after.fort && !before.quadGone && after.quadGone && !after.destroyed){
      buzz(160);
      toast(unitName(i) + " " + qw + " is at 0: it takes no further damage, and that quarter of the base is an asteroid field from now on (Fleets p. 501)", "crip");
    }
    if(!before.destroyed && after.destroyed){
      buzz(200);
      const c = PLAY.catastrophic(R);
      /* one-hit units make no Catastrophic Damage roll: an escort leaves a
         Blast Marker (p. 71), a one-hit defence nothing the book names
         (p. 101) - no table opens */
      if(after.escort) toast(unitName(i) + ": " + (R.hulls > 1 ? "all " + R.hulls + " destroyed" : "destroyed") + ". " + c.rows[0].text, "crip");
      else if(st.hulkName) toast(unitName(i) + ": " + st.hulkName, "crip");
      else {
        toast(unitName(i) + " is out of action: " + (c.dice ? "roll " + c.dice + " on the " + c.title + " table (" + (c.fleets ? "Fleets " : "") + "p. " + c.page + ")" : c.rows[0].text), "crip");
        /* the table opens on the card by itself, with this ship's numbers */
        appState.V.pop = { i: i, kind: "hulk" }; save(); render(); showPop(); return;
      }
    }
  }
  save();
  render();
}

