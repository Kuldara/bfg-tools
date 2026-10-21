/* Rakentaa yhden kortin itsenaiseksi HTML-sivuksi, jonka headless-selain
   voi kuvata. Kortti piirretaan CSS:lla, joten sita ei saa kuvaksi muuten
   kuin selaimessa - mutta itse markup syntyy sovelluksen omalla
   cardHTML():lla Nodessa, joten sisalto on tasan se mita sovellus tuottaa.

   Aja:  node make_card_page.js <ulostulo.html> <hakuhahmo> [optiot,pilkulla]
*/
const fs = require("fs");
const path = require("path");
const DIR = "F:/3D print LLM/Battlefleet Gothic/fleet builder";

const el = () => ({
  textContent: "", innerHTML: "", value: "", className: "", dataset: {},
  querySelectorAll: () => [], appendChild(){}, onclick: null, onchange: null,
  oninput: null, style: {}, id: "", classList: { add(){}, remove(){} },
  setAttribute(){}, getAttribute: () => "", closest: () => el(),
});
global.document = {
  getElementById: id => id === "bfgdata"
    ? { textContent: fs.readFileSync(path.join(DIR, "bfg_data.json"), "utf8") }
    : el(),
  querySelector: () => el(), querySelectorAll: () => [], createElement: () => el(),
  head: { appendChild(){} },
  body: { appendChild(){}, removeChild(){}, dataset: {},
          classList: { add(){}, remove(){} } },
};
global.window = {}; global.navigator = {};
const store = {};
global.localStorage = { getItem: k => (k in store ? store[k] : null),
                        setItem: (k, v) => { store[k] = v; } };
global.alert = () => {}; global.confirm = () => false;

const html = fs.readFileSync(path.join(DIR, "Gothic Fleet Registry.html"), "utf8");
const js = html.split("<script>")[1].split("</script>")[0].replace(/^"use strict";/, "");
const api = new Function(js +
  "\n;return {LISTS,SHIPS,cardHTML,applyRequired,isEscort,setOptState,setUpState," +
  "upgradesFor,fitCards,getS:()=>S};")();
const { LISTS, SHIPS } = api;

const OUT = process.argv[2] || path.join(DIR, "_card.html");
const WANT = new RegExp(process.argv[3] || "^Strike Cruiser$", "i");
const TAKES = (process.argv[4] || "").split(",").filter(Boolean).map(Number);

let found = null;
LISTS.forEach((L, li) => L.secs.forEach((sec, si) => sec.ents.forEach((en, ei) => {
  if (found || !en.r || !SHIPS[String(en.r)]) return;
  if (WANT.test(en.l || "")) found = { li, si, ei, en };
})));
if (!found) { console.error("riviä ei loydy: " + WANT); process.exit(1); }

const S = api.getS();
S.li = found.li; S.limit = 2500; S.units = [];
const u = { s: found.si, e: found.ei, ref: found.en.r, n: 1, opts: [], os: {}, name: "" };
api.applyRequired(u);
if (api.isEscort(u)) u.n = 3;
S.units.push(u);
TAKES.forEach(i => api.setOptState(u, i, "take"));
const card = api.cardHTML(u, "top");

const css = (html.match(/<style>([\s\S]*?)<\/style>/) || [, ""])[1];
/* fitCards lahdekoodina, jotta sovitus on tasan sama kuin sovelluksessa. */
const fit = api.fitCards.toString();

const page = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><title>card</title>
<style>${css}
/* Selain voi kuvata sivun kesken siirtyman, jolloin osa tekstista
   jaa haalistuneeksi. Animaatiot pois, jotta kuva on aina valmis. */
*,*::before,*::after{animation:none!important;transition:none!important}
html,body{margin:0;padding:0;background:transparent}
#sheet{display:block}
#sheet .page{margin:0;box-shadow:none;position:relative;width:auto;height:auto;
  background:transparent;overflow:visible}
#sheet .k{position:relative!important;left:0!important;top:0!important}
</style></head><body>
<div class="sheet" id="sheet"><div class="page">${card}</div></div>
<script>
var $=function(q){return document.querySelector(q)};
${fit}
fitCards();
document.title = "ready " + document.querySelector(".k").offsetWidth +
  "x" + document.querySelector(".k").offsetHeight;
<\/script>
</body></html>
`;
fs.writeFileSync(OUT, page, "utf8");
console.log("kirjoitettu", OUT);
console.log("alus:", SHIPS[String(found.en.r)].nm, "| lista:", LISTS[found.li].nm);
