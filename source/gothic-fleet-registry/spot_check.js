/* Pistokoe: yksi kortti sovelluksen omalla polulla ja kirjan sivut rinnakkain
 * (docs/PISTOKOE.md).
 *
 *   node spot_check.js --seed 20260910           arvottu listarivi (deterministinen)
 *   node spot_check.js --list "Rogue" --ship "Tyrant"   nimella
 *   node spot_check.js ... --all                  kaikki omat optiot ja rivin paivitykset otettuna
 *   node spot_check.js ... --opt 2 --opt 5        optiot indeksilla (take)
 *   node spot_check.js ... --up "Power Ram"       listapaivitys nimella (take)
 *   node spot_check.js ... --hull "Mars"          Venerable-pohjarunko nimella
 *   node spot_check.js ... --n 4                  saattueen koko
 *   node spot_check.js ... --pages 96,97          lisasivut kirjasta
 *   node spot_check.js ... --no-book              ilman kirjan sivuja
 *   node spot_check.js --seed N --defences        arvonta myos planetary defences -riveista
 *                                                 (oletuksena ei: J175 f, ks. alla)
 *   node spot_check.js ... --from "Gothic Sector" --role reserve
 *                                                 LAINALAIVA (1.1): rivi otetaan --list/--seed
 *                                                 -listalta, laivasto on --from-lista. Tuloste
 *                                                 lisaa laivaston tarkistusrivit ja merkitsee
 *                                                 isantalistalta tulevat paivitykset.
 *
 * Tuloste: (1) ratkaistu yksikko (pisteet, statsit, aseet tiloineen, optiot,
 * paivitykset, saannot, vaurio, critical, issues), (2) kortin teksti sellaisena
 * kuin se tulostuu, (3) kirjan sivut: profiilisivu ja listan sivu, seka --pages.
 * Vertailu tehdaan kasin: puuttuuko, onko ylimaaraista, onko ristiriitaa.
 * Loydos kirjataan golden-tapaukseksi (card_contains / card_lacks) ENNEN korjausta.
 */
"use strict";
const fs = require("fs"), path = require("path");
const { execFileSync } = require("child_process");
const HERE = __dirname;
const argv = process.argv.slice(2);
const opt = (k, d) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : d; };
const opts = k => argv.map((a, i) => a === k ? argv[i + 1] : null).filter(x => x != null);
const has = k => argv.includes(k);

/* ---- sovellus Nodessa (sama tynka kuin layout_check.js) -------------- */
const els = {};
const mk = () => ({ textContent: "", innerHTML: "", value: "", className: "", dataset: {}, style: {}, id: "", hidden: false,
  querySelectorAll: () => [], querySelector: () => null, appendChild(){}, removeChild(){}, addEventListener(){}, setAttribute(){}, getAttribute: () => "", closest: () => mk(), classList: { add(){}, remove(){}, toggle(){}, contains: () => false } });
const el = k => (els[k] || (els[k] = mk()));
global.document = { getElementById: id => id === "bfgdata" ? { textContent: fs.readFileSync(path.join(HERE, "bfg_data.json"), "utf8") } : el("#" + id),
  querySelector: s => el(s), querySelectorAll: () => [], createElement: () => mk(), head: { appendChild(){} }, body: { appendChild(){}, removeChild(){}, dataset: {}, classList: { add(){}, remove(){} } }, addEventListener(){} };
global.window = { addEventListener(){}, print(){}, matchMedia: () => ({ matches: false, addEventListener(){} }) };
if (!global.navigator) Object.defineProperty(global, "navigator", { value: {}, configurable: true });
global.alert = () => {}; global.confirm = () => true; global.localStorage = { getItem: () => null, setItem(){}, removeItem(){} };
const html = fs.readFileSync(path.join(HERE, "Gothic Fleet Registry.html"), "utf8");
const js = html.split("<script>")[1].split("</script>")[0].replace(/^"use strict";/, "");
const api = new Function(js + "\n;return {LISTS,SHIPS,DATA,addUnit,addUnitFrom,checks,setOptState,setUpState,setHull,cardHTML,resolveUnit,upgradesFor,getS:()=>S};")();

/* ---- rivin valinta --------------------------------------------------- */
const rows = [];
/* J175 (f): 8.10.2026 jokainen lista sai PLANETARY DEFENCES -osion, ja sen
   noin 430 rivia tulivat arvontapopulaatioon - vanhat siemenet osoittivat
   eri riveihin ja otos painottui puolustuksiin. Oletuspopulaatio on taas
   laivastolistan rivit (osion laji "defence" pois); --defences ottaa
   puolustukset mukaan. Nimella haku (--list/--ship) loytaa ne aina. */
const WITH_DEF = has("--defences") || !has("--seed");
api.LISTS.forEach((L, li) => L.secs.forEach((sec, si) => sec.ents.forEach((en, ei) => {
  if (!WITH_DEF && sec.ct === "defence") return;
  if (en.r || en.k === "cmd") rows.push({ li, si, ei, L, sec, en });
})));
let pick = null;
if (has("--seed")) {
  /* mulberry32: sama siemen, sama rivi, kaikilla koneilla */
  let a = (parseInt(opt("--seed"), 10) >>> 0) || 1;
  const rnd = () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  pick = rows[Math.floor(rnd() * rows.length)];
} else {
  const lf = opt("--list", ""), sf = opt("--ship", "");
  const cands = rows.filter(r => r.L.nm.toLowerCase().includes(lf.toLowerCase()) && r.en.l.toLowerCase().includes(sf.toLowerCase()));
  if (!cands.length) { console.error("ei riveja: --list %j --ship %j", lf, sf); process.exit(2); }
  if (cands.length > 1 && !(lf && sf)) {
    console.error("useita riveja, tarkenna --list ja --ship:");
    cands.slice(0, 30).forEach(r => console.error("  %s | %s | %s", r.L.nm, r.sec.t, r.en.l));
    process.exit(2);
  }
  pick = cands[0];
}

/* ---- yksikko ---------------------------------------------------------- */
const S = api.getS();
S.limit = 100000; S.units = [];
/* Lainalaiva: laivasto on --from-lista, rivi lahdelistalta. S.li pysyy
   isannassa koko ajan - sama sopimus kuin sovelluksessa. */
let host = null;
if (has("--from")) {
  const hf = opt("--from", "").toLowerCase();
  const hi = api.LISTS.findIndex(L => L.nm.toLowerCase().includes(hf));
  if (hi < 0) { console.error("isantalistaa ei loydy: --from %j", hf); process.exit(2); }
  if (hi === pick.li) { console.error("--from on rivin oma lista; lainalaiva vaatii toisen"); process.exit(2); }
  host = api.LISTS[hi];
  S.li = hi;
  api.addUnitFrom(pick.li, pick.si, pick.ei, opt("--role", "reserve"));
} else {
  S.li = pick.li;
  api.addUnit(pick.si, pick.ei);
}
const u = S.units[0];
if (!u) { console.error("addUnit ei tuottanut yksikkoa"); process.exit(2); }
if (has("--n")) u.n = parseInt(opt("--n"), 10) || u.n;
if (has("--hull")) {
  const hf = opt("--hull").toLowerCase();
  const sh0 = api.SHIPS[String(pick.en.r)];
  const ref = Object.keys(api.SHIPS).find(k => (api.SHIPS[k].nm || "").toLowerCase().includes(hf) && k !== String(pick.en.r));
  if (!ref) { console.error("runkoa ei loydy: " + hf); process.exit(2); }
  try { api.setHull(u, +ref); } catch (e) { console.error("setHull: " + e.message); }
  void sh0;
}
const sh = api.SHIPS[String(u.ref != null ? u.ref : pick.en.r)];
if (has("--all") && sh) (sh.ol || []).forEach((o, i) => { try { api.setOptState(u, i, "take"); } catch (e) {} });
opts("--opt").forEach(i => { try { api.setOptState(u, parseInt(i, 10), "take"); } catch (e) { console.error("optio " + i + ": " + e.message); } });
const ups = api.upgradesFor(u);
if (has("--all")) ups.own.forEach(x => { try { api.setUpState(u, x[0], x[1], "take"); } catch (e) {} });
opts("--up").forEach(name => {
  const all = ups.own.concat(ups.other);
  /* Rivi kantaa nimensa itse (x[2]); listahaku indeksilla kaatui isannan
     avaimeen (si >= 1000) - pistokoe 20, siemen 2026091412. */
  const hit = all.find(x => String(x[2].l).toLowerCase().includes(name.toLowerCase()));
  if (!hit) { console.error("paivitysta ei loydy: " + name); return; }
  try { api.setUpState(u, hit[0], hit[1], "take"); } catch (e) { console.error("setUpState: " + e.message); }
});
const R = api.resolveUnit(u);

/* ---- tuloste ---------------------------------------------------------- */
const line = (s) => console.log(s);
const sec = t => line("\n" + "#".repeat(8) + " " + t);
line("PISTOKOE  " + pick.L.nm + " | " + pick.sec.t + " | " + pick.en.l + (sh ? "  (profiili s." + sh.pg + ")" : "") + "  lista s." + pick.L.pg);
sec("RATKAISTU YKSIKKO");
line("kind " + R.kind + "  class " + R.className + "  points " + R.points + "  maxPoints " + R.maxPoints +
     (R.entry ? "  entry " + JSON.stringify({ price: R.entry.price, openPrice: R.entry.openPrice, note: R.entry.note, badRef: R.entry.badRef, noopt: R.entry.noopt }) : ""));
if (R.stats) line("stats " + JSON.stringify(R.stats));
if (R.hull && R.hull.chosen) line("hull " + JSON.stringify({ chosen: R.hull.chosen, choices: (R.hull.choices || []).length }));
line("leadership " + JSON.stringify(R.leadership) + "  rerolls " + JSON.stringify(R.rerolls));
line("\nASEET (state: on = kaytossa, off = ei valittu):");
(R.weapons || []).forEach(w => line("  [" + (w.state || "-") + "] " + (Array.isArray(w.a) ? w.a.join(" | ") : String(w.a)) +
  (w.alt ? "  ALT" : "") + (w.grp ? "  grp:" + w.grp : "") + (w.opt != null ? "  opt:" + w.opt : "") + (w.count ? "  x" + w.count : "") + (w.stars ? "  " + w.stars : "")));
line("\nOPTIOT:");
(R.options || []).forEach(o => line("  [" + o.state + "] " + o.index + ". " + o.text + "  (" + (o.cost == null ? "?" : o.cost) + ")" +
  (o.qty > 1 ? " x" + o.qty : "") + (o.group ? "  grp:" + o.group : "") + (o.dependsOn ? "  dep:" + o.dependsOn : "") + (o.blockedBy ? "  blocked:" + o.blockedBy : "")));
line("\nPAIVITYKSET (tarjolla):");
(R.upgrades || []).forEach(x => line("  [" + x.state + "] " + x.label + "  " + (x.cost == null ? "" : x.cost) + (x.per ? " /" + x.per : "") + "  " + (x.owner || "") + (x.required ? "  REQUIRED" : "") +
  (host && +String(x.key || "").split(":")[0] >= 1000 ? "  ISANNALTA (" + host.nm + ")" : "") + (x.description ? "  - " + x.description : "")));
line("\nSAANNOT KORTILLA:");
(R.rules || []).forEach(r => line("  - " + (typeof r === "string" ? r : r.t)));
if (R.damage) line("\nVAURIO: " + JSON.stringify({ crippledAt: R.damage.crippledAt, note: R.damage.note, trigger: R.damage.trigger, repair: R.damage.repair }));
if (R.damage && R.damage.critical) {
  line("CRITICAL " + R.damage.critical.title + ":");
  (R.damage.critical.rows || []).forEach(r => line("  " + JSON.stringify(r)));
  if (R.damage.critical.foot) line("  foot: " + R.damage.critical.foot);
}
if (R.members) line("\nJASENET: " + JSON.stringify(R.members));
if (R.issues && R.issues.length) { line("\nISSUES:"); R.issues.forEach(i => line("  " + i.severity + " " + i.code + ": " + i.message)); }
if (host) {
  line("\nLAINALAIVA: rooli " + (u.role || "core") + ", lahdelista " + (u.lst || "-") + ", laivasto " + host.nm);
  line("LAIVASTON TARKISTUKSET (resolveFleet, vain tama yksi alus laivastossa):");
  api.checks().forEach(c => line("  " + (c.ok ? "ok " : "RED") + "  " + c.t + " = " + c.v + (c.s ? "   <- " + String(c.s).slice(0, 90) : "")));
}

sec("KORTIN TEKSTI (cardHTML)");
const card = api.cardHTML(u, "a");
const text = card
  .replace(/<\/(h3|h4|p|li|tr|div)>/g, "\n").replace(/<br\s*\/?>/g, "\n")
  .replace(/<td[^>]*>/g, " | ").replace(/<span class="c">/g, "  ")
  .replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&middot;/g, "·").replace(/&ndash;/g, "–")
  .replace(/&mdash;/g, "—").replace(/&rarr;/g, "→").replace(/&nbsp;/g, " ").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
  .replace(/&#(\d+);/g, (m, n) => String.fromCharCode(+n))
  .split("\n").map(s => s.replace(/\s+/g, " ").trim()).filter(Boolean).join("\n");
line(text);

if (!has("--no-book")) {
  sec("KIRJA");
  const pages = [];
  if (sh && sh.pg) pages.push(String(sh.pg));
  if (pick.L.pg) pages.push(String(pick.L.pg));
  if (host && host.pg) pages.push(String(host.pg));
  opts("--pages").forEach(p => p.split(",").forEach(x => pages.push(x.trim())));
  const uniq = [...new Set(pages)];
  try {
    const out = execFileSync("python", [path.join(HERE, "pdf_text.py")].concat(uniq), { encoding: "utf8", maxBuffer: 1 << 24 });
    line(out);
  } catch (e) { line("(pdf_text.py epaonnistui: " + (e.message || e) + ")"); }
}
