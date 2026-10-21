/* Tekee sovelluksesta kopion, joka avautuu valmiiksi rakennettuun
   laivastoon. Nain headless-selain saa kuvattua kayttoliittyman ilman
   klikkailua, ja kuva on oikeasta sovelluksesta - ei mallinnos.

   Aja:  node make_ui_page.js <ulostulo.html>
*/
const fs = require("fs");
const path = require("path");
const DIR = "F:/3D print LLM/Battlefleet Gothic/fleet builder";
const OUT = process.argv[2] || path.join(DIR, "_ui.html");

const html = fs.readFileSync(path.join(DIR, "Gothic Fleet Registry.html"), "utf8");

/* Bootstrap ajetaan sovelluksen oman skriptin jalkeen: se rakentaa
   nayttolaivaston samoilla funktioilla joita kayttajakin kayttaa.
   Rivihaku rajataan valittuun listaan - muuten indeksit osoittaisivat
   toisen listan osioihin. */
const boot = `
<script>
(function(){
  function pickList(rx){
    for(var i=0;i<LISTS.length;i++) if(rx.test(LISTS[i].nm)) return i;
    return 0;
  }
  function rowIn(li, rx){
    for(var si=0; si<LISTS[li].secs.length; si++)
      for(var ei=0; ei<LISTS[li].secs[si].ents.length; ei++){
        var en = LISTS[li].secs[si].ents[ei];
        if(en.r && rx.test(en.l||"")) return {si:si, ei:ei};
      }
    return null;
  }
  try{
    var li = pickList(/Space Marines .* Codex/i);
    S.li = li; S.limit = 1500; S.units = [];
    [/^Battle barge$/i, /strike cruiser/i, /strike cruiser/i,
     /Nova class/i, /Hunter class/i].forEach(function(rx){
      var r = rowIn(li, rx);
      if(r) addUnit(r.si, r.ei);
    });
    if(S.units[1]) setOptState(S.units[1], 1, "take");
    if(S.units[2]) S.units[2].name = "Sword of Baal";
    render();
    /* Vasen sarake alusriveihin asti: saantoteksti on hyodyllista mutta
       esitteessa halutaan nayttaa ostettavat alukset. */
    var cat = document.querySelector(".work > div, .cat, #catalogue");
    setTimeout(function(){
      var secs = document.querySelectorAll(".work h3, .work h2, .sec");
      var target = null;
      document.querySelectorAll("*").forEach(function(e){
        if(!target && /BATTLE BARGES/.test(e.textContent||"") && e.children.length===0)
          target = e;
      });
      if(target && target.scrollIntoView) target.scrollIntoView({block:"start"});
      document.title = "ready";
    }, 60);
  }catch(e){ document.title = "boot error: " + e.message; }
})();
<\/script>
`;

const i = html.lastIndexOf("</body>");
fs.writeFileSync(OUT, html.slice(0, i) + boot + html.slice(i), "utf8");
console.log("kirjoitettu", OUT);
