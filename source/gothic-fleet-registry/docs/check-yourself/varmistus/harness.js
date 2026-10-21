/* Koeajuri Check yourself -luokittelun varmistukseen. Lataa sovelluksen
   samoin kuin test_golden.js (DOM-tynka + Function), ei muuta mitaan.
   Kaytto: const H = require("./harness.js"); */
"use strict";
const fs = require("fs"), path = require("path");
const FB = "F:/3D print LLM/Battlefleet Gothic/fleet builder";
const mkEl = () => ({
  appendChild(){}, removeChild(){}, addEventListener(){}, setAttribute(){},
  getAttribute: () => null, removeAttribute(){}, focus(){}, remove(){},
  classList: { add(){}, remove(){}, toggle(){}, contains: () => false },
  querySelectorAll: () => [], querySelector: () => null,
  insertAdjacentHTML(){}, innerHTML: "", textContent: "", value: "",
  style: {}, id: "", dataset: {}, checked: false, disabled: false,
  onclick: null, onchange: null, oninput: null, children: [],
});
const els = {};
const el = key => (els[key] || (els[key] = mkEl()));
const DATA = fs.readFileSync(path.join(FB, "bfg_data.json"), "utf8");
global.document = {
  getElementById: id => (id === "bfgdata" ? { textContent: DATA } : el("#" + id)),
  querySelector: s => el(s), querySelectorAll: () => [], createElement: () => mkEl(),
  addEventListener(){}, head: { appendChild(){} },
  body: { appendChild(){}, removeChild(){}, dataset: {}, classList: { add(){}, remove(){} } },
};
global.window = { addEventListener(){}, print(){}, matchMedia: () => ({ matches: false, addEventListener(){} }) };
if (!global.navigator) Object.defineProperty(global, "navigator", { value: {}, configurable: true });
global.alert = () => {}; global.confirm = () => true;
let STORE = {};
global.localStorage = { getItem: k => (k in STORE ? STORE[k] : null), setItem: (k, v) => { STORE[k] = String(v); }, removeItem: k => { delete STORE[k]; } };
const html = fs.readFileSync(path.join(FB, "Gothic Fleet Registry.html"), "utf8");
const js = html.split("<script>")[1].split("</script>")[0].replace(/^"use strict";/, "");
const api = new Function(js + "\n;return {LISTS,SHIPS,addUnit,setOptState,unitPts,cardHTML,resolveUnit,upgradesFor,DOMAIN,setUpState,upState,shipOf,checks,total,addUnitFrom,getS:()=>S," +
  "unitCards:(typeof unitCards===\"function\"?unitCards:null)};")();

const li = nm => { const i = api.LISTS.findIndex(L => L.nm === nm || L.nm.indexOf(nm) >= 0); if (i < 0) throw new Error("lista? " + nm); return i; };
function place(lix, label) {
  const L = api.LISTS[lix], re = new RegExp(label, "i");
  for (let si = 0; si < L.secs.length; si++)
    for (let ei = 0; ei < L.secs[si].ents.length; ei++) {
      const en = L.secs[si].ents[ei];
      if (en.k !== "up" && re.test(String(en.l))) return { si, ei };
    }
  return null;
}
/* fleet(list, limit) -> builder: .add(entry, {from, role, n, ups:[re], opts:[re]}) */
function fleet(list, limit) {
  const S = api.getS(); S.li = li(list); S.limit = limit || 1500; S.units = [];
  const b = {
    add(entry, o) {
      o = o || {};
      const l2 = o.from ? li(o.from) : S.li;
      const at = place(l2, entry);
      if (!at) throw new Error("rivi? " + entry + " @ " + api.LISTS[l2].nm);
      if (o.from) api.addUnitFrom(l2, at.si, at.ei, o.role || "reserve"); else api.addUnit(at.si, at.ei);
      const u = S.units[S.units.length - 1];
      if (o.n != null) u.n = o.n;
      const sh = api.shipOf(u);
      (o.opts || []).forEach(p => { const i = (sh.ol || []).findIndex(x => new RegExp(p, "i").test(x.t)); if (i < 0) throw new Error("optio? " + p); api.setOptState(u, i, "take"); });
      (o.ups || []).forEach(p => { const ups = api.upgradesFor(u); const row = ups.own.concat(ups.other).find(x => new RegExp(p, "i").test(String(x[2].l)));
        if (!row) throw new Error("paivitys? " + p + " tarjolla: " + ups.own.concat(ups.other).map(x => x[2].l).join(" | ")); api.setUpState(u, row[0], row[1], "take"); });
      b.last = u; return b;
    },
    units: () => S.units,
  };
  return b;
}
const ups = u => { const x = api.upgradesFor(u); return x.own.concat(x.other).map(r => String(r[2].l)); };
const opts = u => (api.shipOf(u).ol || []).map(o => o.t);
const bad = () => api.checks().filter(c => !c.ok).map(c => c.t + " [" + c.v + "]");
const warns = () => api.checks().filter(c => c.ok && c.warn).map(c => c.t + " [" + c.v + "]");
const chk = re => api.checks().filter(c => new RegExp(re, "i").test(c.t + " " + c.s)).map(c => (c.ok ? (c.warn ? "WARN " : "ok ") : "BAD ") + c.t + " [" + c.v + "]");
const card = u => String(api.cardHTML(u)).replace(/<[^>]+>/g, " ").replace(/&[a-z#0-9]+;/g, " ").replace(/\s+/g, " ");
const tryit = (name, f) => { try { console.log("## " + name + "\n   " + [].concat(f()).join("\n   ")); } catch (e) { console.log("## " + name + "\n   VIRHE " + e.message); } };
module.exports = { api, fleet, ups, opts, bad, warns, chk, card, tryit, li };
