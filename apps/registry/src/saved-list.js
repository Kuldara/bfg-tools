import { $ } from "./boot.js";
import { appState } from "./state.js";
import { esc } from "../../../packages/ui/format.js";

/* ------------------------------------- the saved fleets, many of them ---- */
/* (user 31.10.2026: "make this list work better as the number of fleets
   grows - phone and PC, but above all PC". With 27 fleets every row had its
   name, a line of facts and five buttons, and the panel was ten screens tall.)
   PROTOTYPE: three ways to show the same list, switched in the panel's bar so
   they can be compared on real fleets; the one kept loses the switch.
     rows    one line per fleet; the buttons show on the row under the pointer
             or the chosen one (a phone: Open, and the rest when tapped)
     groups  the same rows under their race, the open list's race first;
             a group folds, and a name loses the list's name it repeats
     wide    two panes on a wide screen: the list on the left, the chosen
             fleet's ships and its buttons on the right
   All three have a search (name, list, points, date), a sort and, for rows
   and wide, a race filter; the keyboard works from the search box
   (Up/Down choose, Enter opens, Esc clears and then closes). */
const VIEW_KEY = "gothic-fleet-registry-saves-view";
export const VIEWS = [["rows", "Rows"], ["groups", "Groups"], ["wide", "Two panes"]];
const SORTS = [["new", "Newest"], ["old", "Oldest"], ["name", "Name A-Z"], ["pts", "Points"], ["list", "Fleet list"]];
function readPrefs(){
  let o = null;
  try{ o = JSON.parse(localStorage.getItem(VIEW_KEY) || "null"); }catch(e){}
  if(typeof o === "string") o = { view: o };
  o = o && typeof o === "object" ? o : {};
  return { view: VIEWS.some(v => v[0] === o.view) ? o.view : "rows", sort: SORTS.some(v => v[0] === o.sort) ? o.sort : "new", shut: o.shut && typeof o.shut === "object" ? o.shut : {} };
}
const P = readPrefs();
appState.SAVES = { q: "", race: "", sel: null, view: P.view, sort: P.sort, shut: P.shut };
function keepPrefs(){
  const s = appState.SAVES;
  try{ localStorage.setItem(VIEW_KEY, JSON.stringify({ view: s.view, sort: s.sort, shut: s.shut })); }catch(e){}
}

export const raceOf = ln => String(ln || "").split(" \u2014 ")[0];
export const subOf = ln => { const p = String(ln || "").split(" \u2014 "); return p.length > 1 ? p.slice(1).join(" \u2014 ") : p[0]; };
const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export function shortDate(d){
  const m = /^(\d{4})-(\d\d)-(\d\d)$/.exec(String(d || ""));
  if(!m) return esc(d || "");
  const now = new Date(), y = +m[1];
  return (+m[3]) + " " + MON[+m[2] - 1] + (y !== now.getFullYear() ? " " + y : "");
}
const FROM = { link: "from a link", file: "from a file", paste: "pasted", kept: "kept when a link opened" };

/* The search: every word must be found in the name, the list, the points or
   the date ("orks 1500", "clanz 31.10" - a d.m date is read too). */
export function matches(s, q){
  const words = String(q || "").toLowerCase().split(/\s+/).filter(Boolean);
  if(!words.length) return true;
  const dm = /^(\d{4})-(\d\d)-(\d\d)$/.exec(s.saved || "");
  const hay = [s.name, s.ln, String(s.pts | 0) + " pts", s.saved || "", dm ? (+dm[3]) + "." + (+dm[2]) + "." : "", FROM[s.from] || ""].join(" ").toLowerCase();
  return words.every(w => hay.indexOf(w) >= 0);
}
export function sorted(saves, how){
  const ix = new Map(saves.map((s, i) => [s, i]));
  const by = {
    new: (a, b) => String(b.saved || "").localeCompare(String(a.saved || "")) || ix.get(a) - ix.get(b),
    old: (a, b) => String(a.saved || "").localeCompare(String(b.saved || "")) || ix.get(b) - ix.get(a),
    name: (a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" }),
    pts: (a, b) => (b.pts | 0) - (a.pts | 0) || ix.get(a) - ix.get(b),
    list: (a, b) => a.ln.localeCompare(b.ln) || ix.get(a) - ix.get(b),
  }[how] || (() => 0);
  return saves.slice().sort(by);
}
/* What the panel shows, in order, after the search and the race filter. */
export function shown(lib){
  const st = appState.SAVES;
  return sorted(lib.saves, st.sort).filter(s => matches(s, st.q) && (!st.race || st.view === "groups" || raceOf(s.ln) === st.race));
}
/* A name that starts with its list's name loses it under the list's group:
   "Orks \u2014 Da Ork Clanz 1500" under Orks reads "Da Ork Clanz 1500". */
function trimmed(name, ln){
  const n = String(name), r = raceOf(ln);
  for(const pre of [ln, r]){
    const re = new RegExp("^" + pre.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/ \u2014 /g, "\\s*[\u2014\u2013-]\\s*") + "\\s*[\u2014\u2013:|-]?\\s*", "i");
    const m = re.exec(n);
    if(m && n.length - m[0].length >= 3) return n.slice(m[0].length);
  }
  return n;
}

/* One fleet's row. ctx: { openId, changed, groups, wide }. */
function rowHTML(s, ctx){
  const st = appState.SAVES, isOpen = s.id === ctx.openId, sel = st.sel === s.id;
  const name = ctx.groups ? trimmed(s.name, s.ln) : s.name;
  const tags = [];
  if(isOpen) tags.push(`<em class="sf-tag on">${ctx.changed ? "open, changed" : "open"}</em>`);
  if(s.from && FROM[s.from]) tags.push(`<em class="sf-tag">${FROM[s.from]}</em>`);
  const acts = ctx.wide ? "" : `<span class="sf-acts">${
      isOpen ? "" : `<button class="go pri" data-libopen="${esc(s.id)}" title="${esc("Open " + s.name + " on the " + s.ln + " list")}">Open</button>`
    }<span class="sf-more"><button class="go" data-libexport="${esc(s.id)}" title="${esc("Save " + s.name + " as a file")}">Export</button><button class="go" data-copytext="${esc(s.id)}" title="${esc("Copy " + s.name + " as text")}">Copy</button><button class="go${appState.PHONE.key === s.id ? " on" : ""}" data-phone="${esc(s.id)}" title="${esc("A QR code of " + s.name + " for Gothic Fleet Play on a phone")}">To phone</button><button class="del" data-libdel="${esc(s.id)}" title="${esc("Delete the saved fleet " + s.name)}">Delete</button></span></span>`;
  return `<div class="sf-row${isOpen ? " open" : ""}${sel ? " sel" : ""}${ctx.fresh(s.id) ? " fresh" : ""}" data-sfsel="${esc(s.id)}" role="option" aria-selected="${sel}" title="${esc(s.name)}">` +
    `<span class="sf-nm"><b>${esc(name)}</b>${tags.join("")}</span>` +
    `<span class="sf-ln">${esc(ctx.groups ? subOf(s.ln) : s.ln)}</span>` +
    `<span class="sf-pts">${s.pts | 0}</span><span class="sf-dt">${shortDate(s.saved)}</span>` +
    `<span class="sf-meta">${esc(ctx.groups ? subOf(s.ln) : s.ln)} &middot; ${s.pts | 0} pts &middot; ${shortDate(s.saved)}</span>${acts}</div>` +
    (!ctx.wide && appState.COPYBOX && appState.COPYBOX.key === s.id ? ctx.copyBox() : "") +
    (!ctx.wide && appState.PHONE.key === s.id ? ctx.phonePanel() : "");
}
/* The race chips: every race with saved fleets, the most first. */
function chipsHTML(lib){
  const st = appState.SAVES, n = {};
  lib.saves.filter(s => matches(s, st.q)).forEach(s => { const r = raceOf(s.ln); n[r] = (n[r] || 0) + 1; });
  const races = Object.keys(n).sort((a, b) => n[b] - n[a] || a.localeCompare(b));
  if(races.length < 2 && !st.race) return "";
  const total = races.reduce((t, r) => t + n[r], 0);
  return `<div class="sf-chips" role="group" aria-label="Show one race">` +
    `<button class="sf-chip${st.race ? "" : " on"}" data-sfrace="">All <b>${total}</b></button>` +
    races.map(r => `<button class="sf-chip${st.race === r ? " on" : ""}" data-sfrace="${esc(r)}">${esc(r)} <b>${n[r]}</b></button>`).join("") +
    (st.race && !n[st.race] ? `<button class="sf-chip on" data-sfrace="">${esc(st.race)} <b>0</b></button>` : "") + `</div>`;
}
/* The chosen fleet in the right pane: its facts, its ships and every button. */
function detailHTML(s, ctx){
  if(!s) return `<div class="sf-detail empty">Choose a fleet on the left to see its ships.</div>`;
  const isOpen = s.id === ctx.openId;
  const ships = {};
  const order = [];
  (s.units || []).forEach(u => {
    const k = (u.el || "?");
    if(!ships[k]){ ships[k] = { n: 0, sn: u.sn || "" }; order.push(k); }
    ships[k].n += Math.max(1, u.n | 0);
  });
  const facts = [esc(s.ln), (s.pts | 0) + " / " + (s.limit | 0) + " pts", "saved " + shortDate(s.saved), FROM[s.from] || "", isOpen ? (ctx.changed ? "open, changed" : "open now") : ""].filter(Boolean);
  return `<div class="sf-detail"><h3>${esc(s.name)}</h3><p class="sf-facts">${facts.join(" &middot; ")}</p>
    <ul class="sf-ships">${order.map(k => `<li><span>${ships[k].n > 1 ? ships[k].n + " &times; " : ""}${esc(k)}</span></li>`).join("") || "<li><i>no ships</i></li>"}</ul>
    <div class="sf-dacts">${isOpen ? `<button class="go" disabled>Open now</button>` : `<button class="go pri" data-libopen="${esc(s.id)}">Open</button>`}
      <button class="go" data-libexport="${esc(s.id)}">Export file</button><button class="go" data-copytext="${esc(s.id)}">Copy text</button>
      <button class="go${appState.PHONE.key === s.id ? " on" : ""}" data-phone="${esc(s.id)}">To phone</button><button class="del" data-libdel="${esc(s.id)}">Delete</button></div>
    ${appState.COPYBOX && appState.COPYBOX.key === s.id ? ctx.copyBox() : ""}${appState.PHONE.key === s.id ? ctx.phonePanel() : ""}</div>`;
}

/* The whole browser: bar, chips, the list (and the detail pane). */
export function savedListHTML(lib, ctx){
  const st = appState.SAVES;
  const list = shown(lib);
  if(st.sel && !lib.saves.some(s => s.id === st.sel)) st.sel = null;
  if(st.view === "wide" && (!st.sel || !list.some(s => s.id === st.sel))) st.sel = (list.filter(s => s.id === ctx.openId)[0] || list[0] || {}).id || null;
  const bar = `<div class="sf-bar">
    <input id="savesq" type="search" autocomplete="off" spellcheck="false" placeholder="Search ${lib.saves.length} fleets: name, list, points, date" value="${esc(st.q)}" aria-label="Search the saved fleets">
    <select id="savessort" aria-label="Sort">${SORTS.map(o => `<option value="${o[0]}"${st.sort === o[0] ? " selected" : ""}>${o[1]}</option>`).join("")}</select>
    <span class="sf-views" role="group" aria-label="Prototype view">${VIEWS.map(v => `<button class="sf-v${st.view === v[0] ? " on" : ""}" data-sfview="${v[0]}" title="Prototype: ${v[1]}">${v[1]}</button>`).join("")}</span></div>`;
  let body;
  if(!list.length) body = `<div class="empty">No saved fleet matches${st.q ? " &ldquo;" + esc(st.q) + "&rdquo;" : ""}${st.race && st.view !== "groups" ? " in " + esc(st.race) : ""}.</div>`;
  else if(st.view === "groups"){
    const cur = raceOf(ctx.curLn), g = {}, order = [];
    list.forEach(s => { const r = raceOf(s.ln); if(!g[r]){ g[r] = []; order.push(r); } g[r].push(s); });
    order.sort((a, b) => (b === cur) - (a === cur) || g[b].length - g[a].length || a.localeCompare(b));
    const c = Object.assign({}, ctx, { groups: true });
    body = order.map(r => {
      const shut = !st.q && st.shut[r] != null ? st.shut[r] : (!st.q && r !== cur && order.length > 1 && lib.saves.length > 12);
      return `<div class="sf-group${shut ? " shut" : ""}"><button class="sf-gh" data-sfgroup="${esc(r)}" aria-expanded="${!shut}"><span class="sf-car"></span>${esc(r)} <b>${g[r].length}</b><i>${
        esc([...new Set(g[r].map(s => subOf(s.ln)))].join(", "))}</i></button>${shut ? "" : g[r].map(s => rowHTML(s, c)).join("")}</div>`;
    }).join("");
  }else body = list.map(s => rowHTML(s, Object.assign({}, ctx, { wide: st.view === "wide" }))).join("");
  const chips = st.view === "groups" ? "" : chipsHTML(lib);
  if(st.view === "wide")
    return bar + chips + `<div class="sf-split"><div class="sf-list" role="listbox" aria-label="Saved fleets">${body}</div>${detailHTML(lib.saves.filter(s => s.id === st.sel)[0], ctx)}</div>`;
  return bar + chips + `<div class="sf-list" role="listbox" aria-label="Saved fleets">${body}</div>`;
}
export function savesViewClass(){ return "sf-view-" + appState.SAVES.view; }

/* The panel's own events. Each returns true when it took the event; rerender
   redraws the panel. */
export function savesClick(e, rerender){
  const t = e.target, st = appState.SAVES;
  const v = t.closest("[data-sfview]");
  if(v){ st.view = v.dataset.sfview; keepPrefs(); rerender(); return true; }
  const c = t.closest("[data-sfrace]");
  if(c){ st.race = st.race === c.dataset.sfrace ? "" : c.dataset.sfrace; rerender(); return true; }
  const g = t.closest("[data-sfgroup]");
  if(g){ const r = g.dataset.sfgroup, now = g.parentNode.classList.contains("shut"); st.shut[r] = !now; keepPrefs(); rerender(); return true; }
  if(t.closest("button,input,select,textarea,a")) return false;
  const row = t.closest("[data-sfsel]");
  if(row){ st.sel = st.sel === row.dataset.sfsel && st.view !== "wide" ? null : row.dataset.sfsel; rerender(); return true; }
  return false;
}
export function savesDblClick(e){
  const row = e.target.closest && e.target.closest("[data-sfsel]");
  if(!row || e.target.closest("button")) return null;
  return row.dataset.sfsel;
}
export function savesInput(e, rerender){
  if(e.target.id !== "savesq") return false;
  const st = appState.SAVES, pos = e.target.selectionStart;
  st.q = e.target.value;
  rerender();
  const n = $("#savesq"); if(n){ n.focus(); try{ n.setSelectionRange(pos, pos); }catch(x){} }
  return true;
}
export function savesChange(e, rerender){
  if(e.target.id !== "savessort") return false;
  appState.SAVES.sort = e.target.value; keepPrefs(); rerender(); return true;
}
/* Keys in the search box. Returns "open:<id>", "close" or a boolean. */
export function savesKey(e, lib, rerender){
  if(!e.target || e.target.id !== "savesq") return false;
  const st = appState.SAVES;
  const ids = [...document.querySelectorAll("#savesbody [data-sfsel]")].map(r => r.dataset.sfsel);
  if(e.key === "ArrowDown" || e.key === "ArrowUp"){
    e.preventDefault();
    let i = ids.indexOf(st.sel);
    i = e.key === "ArrowDown" ? Math.min(ids.length - 1, i + 1) : Math.max(0, i < 0 ? 0 : i - 1);
    st.sel = ids[i] || null;
    rerender();
    const n = $("#savesq"); if(n) n.focus();
    const r = document.querySelector("#savesbody .sf-row.sel"); if(r && r.scrollIntoView) r.scrollIntoView({ block: "nearest" });
    return true;
  }
  if(e.key === "Enter"){
    const id = ids.indexOf(st.sel) >= 0 ? st.sel : ids.length === 1 ? ids[0] : null;
    if(id){ e.preventDefault(); return "open:" + id; }
    return false;
  }
  if(e.key === "Escape"){
    e.preventDefault();
    if(st.q){ st.q = ""; rerender(); const n = $("#savesq"); if(n) n.focus(); return true; }
    return "close";
  }
  return false;
}
