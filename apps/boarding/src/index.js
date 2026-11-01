/* Boarding Actions: the page. The rules are in engine.js (pure functions,
   tested in Node by test_engine.js and test_fuzz.js); the modules here draw
   the page and react to it:
     catalogue.js     engine, ships, fleets, per-ship options
     state.js         the saved battle and ship lookups
     render.js        the two sides
     action.js        the action bar and the dice
     sheets.js        the bottom sheet and its pickers
     ship-options.js  one ship's options
     rolling.js       rolling and the result's bookkeeping
     result-view.js   the result sheet
     events.js        clicks on the board and the result sheet
     reference.js     the rules reference, resets
   The bundle (build.js) starts here, as window.BoardingApp; the page calls
   boot(), which adds the listeners, loads the saved battle and draws it. */

import { B } from "./catalogue.js";
import { EMBED, S, load, loadEmbed } from "./state.js";
import { render } from "./render.js";
import { clearPending, resetRound } from "./action.js";
import { wireSheets } from "./sheets.js";
import { tellPlay, wireEvents } from "./events.js";
import { askReset, showRef } from "./reference.js";

/* ------------------------------------------------------------------- wiring */
export function boot(){
  wireEvents();
  wireSheets();
  document.getElementById("diceSheet").addEventListener("click", function(ev){
    var t = ev.target.closest("[data-dice]"); if(!t) return;
    S.dice = t.dataset.dice;
    render();
  });
  document.getElementById("refBtn").addEventListener("click", function(){ showRef(); });
  document.getElementById("resetAllBtn").addEventListener("click", function(){ askReset(null); });
  document.getElementById("modeBtn").addEventListener("click", function(){
    S.dice = S.dice==="digital" ? "physical" : "digital";
    clearPending();
    render();
  });
  document.getElementById("swapBtn").addEventListener("click", function(){
    var a = S.att; S.att = S.def; S.def = a;
    resetRound();                         /* this is a new action with a new boarder */
    render();
  });
  var inPlay = /^#play=(.+)$/.exec(location.hash);
  var given = null;
  if(inPlay){ try{ given = JSON.parse(decodeURIComponent(inPlay[1])); }catch(e){} }
  if(given){
    loadEmbed(given);
    var top = document.getElementById("top");
    var back = document.createElement("button");
    back.className = "ghost"; back.id = "backToPlay"; back.textContent = "\u2039 Play";
    back.setAttribute("aria-label", "Back to Gothic Fleet Play");
    back.addEventListener("click", function(){
      /* a tab whose Play page is gone has nobody to answer: it closes itself */
      tellPlay({t:"close"});
      if(window.opener) window.close();
    });
    top.insertBefore(back, top.firstChild);
    document.getElementById("resetAllBtn").style.display = "none";
  } else load();
  render();
  window.S = S; window.render = render; window.BOARDING = B;
}
