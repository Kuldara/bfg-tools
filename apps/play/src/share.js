import { rosterOrder } from "./reorder.js";
import { anyRepairRoll, repairBtn, repairLines } from "./repair.js";
import { appState } from "./state.js";
import { builderRaw, lsGet, lsSet } from "./storage.js";
import { MID, TIMES, fnv } from "./helpers.js";
import { fleetsIn, parseDoc, resolveFleet } from "./fleet-document.js";
import { BUILDER_URL, KEY_LINKED, save } from "./game-state.js";
import { baseName, unitName } from "./derived.js";
import { render } from "./render.js";
import { PHONE_LINK, packFleet } from "../../../packages/ui/share-link.js";
import DOMAIN from "../../../packages/rules/domain.js";
import { openSendSheet } from "../../../packages/ui/send.js";
import PLAY from "../rules.js";
import { esc, factionCols } from "../../../packages/ui/format.js";

/* ========================================== FLEETS BY LINK OR FILE ===== */
/* PHONE_LINK, b64url, packFleet, QR and qrSvg come from packages/ui (the
   share link and the QR code): the builder's Saved fleets make the same
   links. */
/* A phone has no builder save of its own. A fleet comes to it inside a
   link (#fleet=..., the fleet document deflated and base64url'd - nothing
   is uploaded anywhere, the link IS the fleet) or as the builder's export
   file. Either way it goes on the page's own list (KEY_LINKED), never into
   the builder's key. */
export function linkedFleets(){
  let a = null; try{ a = JSON.parse(lsGet(KEY_LINKED) || "[]"); }catch(e){}
  return Array.isArray(a) ? a.filter(f => f && f.doc && Array.isArray(f.doc.units) && f.doc.units.length) : [];
}
export function addLinked(doc, how){
  const d = { name: doc.name || "", ln: doc.ln, limit: doc.limit, units: doc.units };
  const fp = fnv(JSON.stringify([d.ln, d.units]));
  const now = new Date(), pad = n => (n < 10 ? "0" : "") + n;
  const all = linkedFleets().filter(f => f.fp !== fp);
  all.unshift({ fp: fp, how: how, date: now.getFullYear() + "-" + pad(now.getMonth() + 1) + "-" + pad(now.getDate()), doc: d });
  lsSet(KEY_LINKED, JSON.stringify(all.slice(0, 40)));
  return fp;
}
export function forgetLinked(k){ const all = linkedFleets(); all.splice(k, 1); lsSet(KEY_LINKED, JSON.stringify(all)); }
/* A fleet document as text (a file, a pasted one, a link's content): every
   fleet in it goes on the list, the first one is marked new. */
export function takeFleetText(text, how){
  const p = parseDoc(text);
  if(p.error){ appState.V.loadErr = p.error; render(); return false; }
  const fs = fleetsIn(p.o);
  if(!fs.length){ appState.V.loadErr = "The document has no ships in it."; render(); return false; }
  const bad = fs.map(f => resolveFleet(f)).find(r => r.error);
  if(bad && fs.length === 1){ appState.V.loadErr = bad.error; render(); return false; }
  const fresh = [];
  fs.slice().reverse().forEach(f => { fresh.push(addLinked(f, how)); });
  appState.V.loadErr = ""; appState.V.linkNew = fresh; appState.V.screen = "load";
  render();
  return true;
}
/* The builder's fleets on this device, the named library first (J208,
   gothic-fleet-registry-saves-v1) and then the fleet each list is editing
   (gothic-fleet-registry-v1). Read, never written. */
export const KEY_LIB_BUILDER = "gothic-fleet-registry-saves-v1";
export function builderFleets(){
  const out = [];
  let lib = null; try{ lib = JSON.parse(lsGet(KEY_LIB_BUILDER) || "null"); }catch(e){}
  (lib && Array.isArray(lib.saves) ? lib.saves : []).forEach(f => {
    if(f && Array.isArray(f.units) && f.units.length) out.push({ name: f.name || "", ln: f.ln, limit: f.limit, units: f.units, saved: true });
  });
  const p = parseDoc(builderRaw() || "");
  if(p.o) fleetsIn(p.o).forEach(f => out.push(Object.assign({ saved: false }, f)));
  return out;
}
/* Where the phone opens the link: the fleet builder (J236, user 25.10.2026:
   "to phone should always open in the fleet builder") - this site's when
   the page is on the web, the published one when it runs from a disk or
   from localhost (a phone cannot reach either). A link made before J236
   still opens here as before. */
export function playBase(){
  const loc = typeof location !== "undefined" ? location : null;
  const local = !loc || loc.protocol !== "https:" || /^(localhost|127\.0\.0\.1|\[::1\])$/.test(loc.hostname);
  return local ? { url: PHONE_LINK.builder, remote: true } : { url: new URL(BUILDER_URL, loc.href).href, remote: false };
}
/* What a "to phone" sends: "b:<k>" a builder fleet on this device, "s:<k>"
   one of this page's own saved fleets, "all" every one of them - from phone
   to phone too (user 19.10.2026: "the QR code ... should work for a phone
   as well, so you can go e.g. from phone to phone"). Names travel along. */
export function phoneDoc(key){
  const one = f => ({ name: f.name || undefined, ln: f.ln, limit: f.limit, units: f.units });
  if(key === "all"){
    const lk = linkedFleets().map(f => f.doc);
    if(!lk.length) return null;
    const d = Object.assign({ schemaVersion: DOMAIN.SCHEMA_VERSION }, one(lk[0]));
    if(lk.length > 1) d.fleets = lk.slice(1).map(one);
    return d;
  }
  const m = /^([bs]):(\d+)$/.exec(String(key));
  const f = !m ? null : m[1] === "b" ? builderFleets()[+m[2]] : (linkedFleets()[+m[2]] || {}).doc;
  return f ? Object.assign({ schemaVersion: DOMAIN.SCHEMA_VERSION }, one(f)) : null;
}
/* Send (packages/ui/send.js): the sheet, with the send page beside this site's Play. */
export function openSend(key){
  const d = phoneDoc(key);
  if(!d) return;
  const name = (d.fleets ? (1 + d.fleets.length) + " fleets" : String(d.name || d.ln).replace(/[^\w .()-]+/g, "_")) + ".json";
  openSendSheet({ doc: d, file: d, fileName: name, linkBase: playBase().url, page: "../send/index.html" });
}
/* Copy and share answer in place: the button says "Copied" (no toast). */
export function copyText(text, what){
  const done = () => { appState.V.copied = what; render(); };
  try{
    if(navigator.clipboard && navigator.clipboard.writeText){ navigator.clipboard.writeText(text).then(done, () => fallbackCopy(text) && done()); return; }
  }catch(e){}
  if(fallbackCopy(text)) done();
}
export function fallbackCopy(text){
  const t = document.createElement("textarea"); t.value = text; t.setAttribute("readonly", ""); t.style.position = "fixed"; t.style.opacity = "0";
  document.body.appendChild(t); t.select(); let ok = false; try{ ok = document.execCommand("copy"); }catch(e){} t.remove(); return ok;
}
export function shareText(title, text){
  if(navigator.share){ navigator.share(/^https?:/.test(text) ? { title: title, url: text } : { title: title, text: text }).catch(() => {}); }
  else copyText(text, "link");
}


/* ------------------------------------------------------ the End Phase --- */
/* p. 88: in every End Phase - both players' - capital ships roll 1D6 per
   hit left (half with blast markers), each 6 repairs one system or puts out
   one fire; p. 67: a fire not put out costs a hit. The page rolls nothing:
   it lists the ships with something to repair and takes the results. */
export function repairable(R, key){
  const cm = R.damage && R.damage.critical;
  if(cm && /cannot repair any critical/i.test(String(cm.foot || ""))) return false;
  const row = cm && cm.rows.find(r => String(r[0]) === String(key));
  if(row && (/\*\s*$/.test(String(row[1])) || /\*\s*$/.test(String(row[2] || "")))) return false;
  if(PLAY.standardCrits(R) && PLAY.CRITS[key] && PLAY.CRITS[key].perm) return false;
  return true;
}
export function endPending(){
  let fires = 0, crits = 0;
  appState.U.forEach((x, i) => {
    const R = x.R, st = appState.G.st[i];
    if(R.kind !== "ship" || st.disengaged || PLAY.isEscort(R) || PLAY.isFort(R) || PLAY.destroyed(R, st)) return;
    PLAY.activeCrits(st, R).forEach(c => {
      if(PLAY.standardCrits(R) && c.key === "7") fires += c.count;
      if(repairable(R, c.key)) crits += c.count;
    });
  });
  return { fires: fires, crits: crits, n: crits };
}
export function renderEndPhase(){
  const fl = appState.G.fleet;
  const rows = appState.U.map((x, i) => {
    const R = x.R, st = appState.G.st[i];
    if(R.kind !== "ship" || st.disengaged || PLAY.isEscort(R) || PLAY.isFort(R)) return "";
    const v = PLAY.view(R, st, fl);
    if(v.destroyed) return "";
    const crits = PLAY.activeCrits(st, R);
    if(!crits.length) return "";
    const nm = c => { const cm = R.damage.critical, row = cm && cm.rows.find(r => String(r[0]) === c.key); return String(row ? row[1] : (c.def ? c.def.name : c.key)).replace(/\s*\*\s*$/, ""); };
    const reps = crits.map(c => repairable(R, c.key)
      ? `<button data-act="repair" data-i="${i}" data-arg="${esc(c.key)}"><b>${esc(c.key)}</b> ${esc(nm(c))}${c.count > 1 ? " " + TIMES + c.count : ""}<small>tap when repaired</small></button>`
      : `<span class="perm"><b>${esc(c.key)}</b> ${esc(nm(c))} ${MID} no repair (p. 67)</span>`).join("");
    const fire = PLAY.standardCrits(R) && crits.some(c => c.key === "7");
    const n = fire ? Math.max(1, PLAY.fireDamage(R, st)) : 0;
    const times = st.fireTurn === fl.turn ? st.fireN | 0 : 0;
    const fireBtn = fire ? `<button class="fireb${times ? " done" : ""}" data-act="fire" data-i="${i}">Fire not put out: +${n} hit${n > 1 ? "s" : ""}<small>${times ? "added " + times + TIMES + " this turn" : "after the repair rolls (p. 67)"}</small></button>` : "";
    return `<div class="eprow" style="--kd:${factionCols(R.entry ? R.entry.list : appState.G.ln, R.source.faction || "")[0]}"><div class="ephd"><b>${esc(unitName(i))}</b><small>damage control ${v.repairDice}D6${R.damage.repair && R.damage.repair !== DOMAIN.REPAIR_LINE ? " " + MID + " " + esc(R.damage.repair) : ", a 6 repairs one (p. 88)"}</small></div>
      ${repairBtn(i)}${repairLines(i)}<div class="eprep">${reps}</div>${fireBtn}</div>`;
  }).join("");
  return `<div class="menu endp" data-act="endph"><div class="box">
    <h2>End phase</h2>
    <p class="foot">Both players repair in every End Phase (p. 88). Roll the dice shown, tap what was repaired, then a fire left burning costs a hit (p. 67); a ship's Crit table can roll for you. Blast Markers in contact halve the dice.</p>
    ${anyRepairRoll() ? `<button class="btn" data-act="repairall">Repair all<small>roll for every ship below</small></button>` : ""}
    ${rows || `<p class="foot">Nothing to repair.</p>`}
    <button class="btn sec" data-act="endph">Done</button>
  </div></div>`;
}

/* A reminder at the change of turn, never damage (user 1.11.2026): the fires still
   burning whose hit has not gone on this turn. It sits in the bottom bar, above its
   buttons, so nothing moves under a finger; a name goes to that ship. */
export function fireReminder(){
  if(!appState.V.fireWarn) return "";
  const G = appState.G, ships = [];
  appState.U.forEach((x, i) => {
    const R = x.R, st = G.st[i];
    if(R.kind !== "ship" || PLAY.destroyed(R, st) || !PLAY.standardCrits(R) || st.fireTurn === G.fleet.turn) return;
    const n = PLAY.fireDamage(R, st);
    if(n) ships.push(`<button data-act="jump" data-i="${i}">${esc(unitName(i))}${n > 1 ? " " + TIMES + n : ""}</button>`);
  });
  return ships.length ? `<div class="firewarn"><span>Fires burning, tap each for its hit (p. 67):</span>${ships.join("")}<button class="x" data-act="firewarn" aria-label="Dismiss">&#10005;</button></div>` : "";
}

/* ------------------------------------------------- the strip of ships --- */
/* The bottom strip (full view): one chip per unit in the roster's order,
   its state in its colour - crippled, out of action, played. A tap moves
   the screen to that row. */
export function shortName(i){
  const w = unitName(i).split(/\s+/).filter(Boolean);
  if(w.length > 1 && w[w.length - 1].length <= 3) return w[0].slice(0, 8) + " " + w[w.length - 1];
  return w.join(" ").length <= 10 ? w.join(" ") : w[0].slice(0, 9);
}
export function jumpStrip(){
  const chips = rosterOrder().map(i => {
    const R = appState.U[i].R, st = appState.G.st[i];
    if(R.kind !== "ship" && !R.ruleCard) return "";
    const v = R.kind === "ship" ? PLAY.view(R, st, appState.G.fleet) : null;
    const cls = v ? (v.destroyed ? "dead" : v.crippled ? "cr" : "") + (st.played >= 2 ? " done" : "") : "";
    return `<button class="${cls.trim()}" data-act="jump" data-i="${i}">${esc(shortName(i))}${v && v.escort ? `<small>${TIMES}${v.alive}</small>` : ""}</button>`;
  }).join("");
  return `<div class="jump" role="navigation" aria-label="Go to a ship">${chips}</div>`;
}

/* a ship's name at the set-up: kept as it is typed, no re-render (the field
   keeps its focus); an empty field or the old name is the old name again.
   The flagship choice beside it follows at once. */
document.addEventListener("input", ev => {
  const a = ev.target && ev.target.getAttribute && ev.target.getAttribute("data-nm");
  if(a == null || !appState.G) return;
  const i = parseInt(a, 10);
  if(!appState.U[i]) return;
  const v = String(ev.target.value || "").replace(/\s+/g, " ").trim();
  appState.G.nm = appState.G.nm || {};
  if(!v || v === baseName(i)) delete appState.G.nm[i]; else appState.G.nm[i] = v;
  save();
  document.querySelectorAll('select[data-sel] option[value="' + i + '"]').forEach(o => { o.textContent = "aboard " + unitName(i); });
});
/* Enter (the keyboard's Done) puts the keyboard away */
document.addEventListener("keydown", ev => {
  if(ev.key === "Enter" && ev.target && ev.target.getAttribute && ev.target.getAttribute("data-nm") != null){ ev.preventDefault(); ev.target.blur(); }
});

