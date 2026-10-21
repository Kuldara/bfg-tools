/* Kuva konfiguraattorista: sama alus samoilla valinnoilla kuin kortilla.
 *
 * Kortti yksin ei kerro etta valinnat tehtiin ennen tulostusta. Hive
 * shipilla se on olennaista: kuudestatoista optiosta yksitoista on Hide,
 * ja vasta se tekee kortista luettavan.
 *
 * Sovelluksesta tehdaan kopio, joka avautuu valmiiksi rakennettuun
 * yksikkoon. Ymparoiva kayttoliittyma piilotetaan CSS:lla - yksikkolohkoa
 * EI siirreta pois paikaltaan, koska sovelluksen tyylit ovat
 * jalkelaisvalitsimia ja siirto pudottaisi ne kaikki.
 *
 * Aja tassa kansiossa (make_examples.js ensin):  node make_optshot.js
 */
const fs = require("fs");
const path = require("path");
const DIR = path.resolve(__dirname, "..");
const ONE = path.join(__dirname, "esimerkkikortit");

const html = fs.readFileSync(path.join(DIR, "Gothic Fleet Registry.html"), "utf8");
const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, "_manifest.json"), "utf8"));

manifest.forEach(m => {
  const boot = `
<script>
(function(){
  try{
    S.li = ${m.li}; S.limit = 100000; S.units = [];
    addUnit(${m.si}, ${m.ei});
    var u = S.units[0];
    u.n = ${m.n};
    var opt = ${JSON.stringify(m.opt)};
    Object.keys(opt).forEach(function(k){ setOptState(u, +k, opt[k]); });
    render();
    var st = document.createElement("style");
    st.textContent =
      /* Vain laivastopaneeli nakyviin; muu kayttoliittyma pois. */
      ".topbar{display:none!important}" +
      ".work{grid-template-columns:1fr!important;max-width:none!important;" +
      "  padding:0!important;gap:0!important}" +
      ".work>.col:first-child{display:none!important}" +
      ".work>.col:last-child>.card:first-child{display:none!important}" +
      ".work>.col:last-child>.card>h2{display:none!important}" +
      "html,body{margin:0;padding:0;background:#0F151B}" +
      ".work>.col:last-child{padding:16px}" +
      "*,*::before,*::after{animation:none!important;transition:none!important}";
    document.head.appendChild(st);
    document.title = "ready";
  }catch(e){ document.title = "boot error: " + e.message; }
})();
<\/script>
`;
  const i = html.lastIndexOf("</body>");
  fs.writeFileSync(path.join(ONE, m.base + " opt.html"),
                   html.slice(0, i) + boot + html.slice(i), "utf8");
});

console.log("konfiguraattorisivuja:", manifest.length);
