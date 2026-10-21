/* Esimerkkikortit: seitseman alusta, seitseman faktiota, seitseman
 * eriluonteista runkoa.
 *
 * Optiot on valittu niin kuin pelaaja ne oikeasti valitsisi, ei "kaikki
 * paalle". Hive shipilla se on koko pointti: 16 optiosta yksitoista
 * piilotetaan, jolloin kortille jaa viisi asetta eika kuudentoista rivin
 * lista. Siksi jokaisesta aluksesta tehdaan myos kuva konfiguraattorista -
 * kortti yksin ei kerro etta valinnat tehtiin ennen tulostusta.
 *
 * Tuottaa:
 *   esimerkkikortit/NN - NIMI (pg N).html   yksi kortti / sivu
 *   _examples_print.html                    A4-arkit, 2 korttia sivulle
 *   _manifest.json                          make_optshot.js lukee taman
 *
 * Aja tassa kansiossa:  node make_examples.js
 */
const fs = require("fs");
const path = require("path");
const DIR = path.resolve(__dirname, "..");

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
  "\n;return {LISTS,SHIPS,cardHTML,applyRequired,isEscort,setOptState," +
  "fitCards,getS:()=>S};")();
const { LISTS, SHIPS } = api;

/* take = mukana ja maksaa, opt = jaa kortille tyhjaksi ruuduksi,
 * off = ei tulostu lainkaan. Mainitsemattomat jaavat oletukselle "opt". */
const PICKS = [
  { list: /Imperial Navy . Gothic/, row: /^Cobra class destroyer$/i, n: 4,
    opt: {},
    why: "Escort squadron. Its one option is left open, so the card " +
         "prints an empty box for the squadron to tick at the table." },

  { list: /Space Marines . Codex/, row: /strike cruiser/i,
    opt: { 1: "take", 2: "off", 3: "take" },
    why: "Launch bays swapped for a bombardment cannon battery and an " +
         "extra shield bought. The torpedo alternative stays on the card " +
         "as the other half of the same choice." },

  { list: /Chaos . Incursion/, row: /^Chaos battle barge$/i,
    opt: { 0: "off", 2: "take", 4: "take", 5: "off", 6: "off", 7: "take" },
    why: "Marines embarked, broadsides exchanged for 45 cm, dorsal lance " +
         "upgraded. The Chaos Lord and the Terminators are left open." },

  { list: /Orks . Waaagh/, row: /^Ork hulk$/i,
    opt: { 0: "take" },
    why: "Forty hits: the damage track prints as two bands and the " +
         "crippled half is labelled." },

  { list: /Eldar Corsairs . Later Gothic War/, row: /^Void stalker/i,
    opt: {},
    why: "No options at all. Eldar stat line, holofields and their own " +
         "critical damage table." },

  { list: /Tyranids . Hive Fleet/, row: /^Hive ship/i,
    opt: { 0: "off", 1: "off", 2: "off", 3: "take",
           4: "off", 5: "off", 6: "take",
           7: "off", 8: "off", 9: "take",
           10: "off", 11: "off", 12: "take",
           13: "off", 14: "off", 15: "take" },
    why: "Sixteen options, eleven hidden. Built as a full carrier — " +
         "boarding torpedoes on the prow, launch bays everywhere else. " +
         "Nobody prints all sixteen." },

  { list: /Necrons/, row: /^Cairn class tombship$/i,
    opt: { 0: "take" },
    why: "Sepulchre taken. Necrons have their own critical damage and " +
         "repair table, and every arc is all-round." },
];

function rowIn(li, rx) {
  for (let si = 0; si < LISTS[li].secs.length; si++)
    for (let ei = 0; ei < LISTS[li].secs[si].ents.length; ei++) {
      const en = LISTS[li].secs[si].ents[ei];
      if (en.r && rx.test(en.l || "")) return { si, ei };
    }
  return null;
}

const S = api.getS();
const cards = [];
PICKS.forEach(p => {
  const li = LISTS.findIndex(L => p.list.test(L.nm));
  if (li < 0) { console.error("listaa ei loydy:", p.list); return; }
  const r = rowIn(li, p.row);
  if (!r) { console.error("rivia ei loydy:", p.row, "listalta", LISTS[li].nm); return; }
  S.li = li; S.limit = 100000; S.units = [];
  const en = LISTS[li].secs[r.si].ents[r.ei];
  const u = { s: r.si, e: r.ei, ref: en.r, n: p.n || 1, opts: [], os: {}, name: "" };
  api.applyRequired(u);
  S.units.push(u);
  Object.keys(p.opt).forEach(k => api.setOptState(u, +k, p.opt[k]));
  cards.push({ html: api.cardHTML(u, "top"), htmlBot: api.cardHTML(u, "bot"),
               nm: SHIPS[String(en.r)].nm, pg: SHIPS[String(en.r)].pg,
               list: LISTS[li].nm, why: p.why,
               li, si: r.si, ei: r.ei, n: p.n || 1, opt: p.opt });
});

const css = (html.match(/<style>([\s\S]*?)<\/style>/) || [, ""])[1];
const fit = api.fitCards.toString();
const NOANIM =
  "/* Selain voi kuvata sivun kesken siirtyman, jolloin osa tekstista jaa\n" +
  "   haalistuneeksi. Animaatiot pois, jotta kuva on aina valmis. */\n" +
  "*,*::before,*::after{animation:none!important;transition:none!important}";
/* .page asettaa kortin varin ja kirjasimen; ilman niita teksti perii
   sovelluksen teemavarin ja katoaa tummassa teemassa. */
const PAGEVARS =
  "  --card-w:144mm;--card-h:135mm;--card-x:0mm;\n" +
  "  --card-top:0mm;--card-bottom:0mm;\n" +
  "  color:#211F20;\n" +
  '  font-family:"IBM Plex Sans",Arial,Helvetica,sans-serif;';

let pages = "";
for (let i = 0; i < cards.length; i += 2)
  pages += '<div class="page">' + cards[i].html +
           (cards[i + 1] ? cards[i + 1].htmlBot : "") + "</div>";

fs.writeFileSync(path.join(__dirname, "_examples_print.html"),
`<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><title>example cards</title>
<style>${css}
@page{size:A4 portrait;margin:0}
${NOANIM}
html,body{margin:0;padding:0;background:#fff}
#sheet{display:block}
#sheet .page{margin:0;box-shadow:none}
</style></head><body>
<div class="sheet" id="sheet">${pages}</div>
<script>var $=function(q){return document.querySelector(q)};
${fit}
fitCards(); document.title="ready";<\/script>
</body></html>
`, "utf8");

const ONE = path.join(__dirname, "esimerkkikortit");
fs.mkdirSync(ONE, { recursive: true });
for (const f of fs.readdirSync(ONE)) fs.unlinkSync(path.join(ONE, f));

const safe = t => String(t).replace(/[\\/:*?"<>|]/g, "").replace(/\s+/g, " ").trim();
const manifest = [];
cards.forEach((c, i) => {
  const base = String(i + 1).padStart(2, "0") + " - " +
    safe(c.nm.split(",")[0]) + " (pg " + c.pg + ")";
  manifest.push({ base, nm: c.nm, pg: c.pg, list: c.list, why: c.why,
                  li: c.li, si: c.si, ei: c.ei, n: c.n, opt: c.opt });
  fs.writeFileSync(path.join(ONE, base + ".html"),
`<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><title>${safe(c.nm)}</title>
<style>${css}
${NOANIM}
html,body{margin:0;padding:0;background:#F6F2E9}
#sheet{position:relative;width:144mm;height:135mm;overflow:hidden;
${PAGEVARS}}
#sheet .k{position:absolute!important;left:0!important;top:0!important}
</style></head><body>
<div id="sheet">${c.html}</div>
<script>var $=function(q){return document.querySelector(q)};
${fit}
function go(){ try{ fitCards(); fitCards(); document.title="ready"; }
  catch(e){ document.title="fit error: "+e.message; } }
if(document.readyState==="complete") go(); else addEventListener("load", go);
<\/script>
</body></html>
`, "utf8");
});

fs.writeFileSync(path.join(__dirname, "_manifest.json"),
                 JSON.stringify(manifest, null, 1), "utf8");

console.log("kortteja:", cards.length);
cards.forEach(c => console.log("  " + c.nm.slice(0, 32).padEnd(34) +
  "pg." + String(c.pg).padEnd(6) + c.list));
