import { $ } from "./boot.js";
import { appState } from "./state.js";
import { esc } from "../../../packages/ui/format.js";

/* ------------------------------------- the saved fleets, many of them ---- */
/* (user 31.10.2026: "make this list work better as the number of fleets
   grows - phone and PC, but above all PC". With 27 fleets every row had its
   name, a line of facts and five buttons, and the panel was ten screens tall.)
   One line per fleet; the buttons show on the row under the pointer or the
   chosen one (a phone: Open, and the rest when the row is tapped). Above the
   rows a search (name, list, points, date), a sort and race chips; the
   keyboard works from the search box (Up/Down choose, Enter opens, Esc
   clears and then closes), and a double click opens. Groups by race and two
   panes with the chosen fleet's ships were tried as prototypes and not kept. */
const PREF_KEY = "gothic-fleet-registry-saves-sort";
const SORTS = [["new", "Newest"], ["old", "Oldest"], ["name", "Name A-Z"], ["pts", "Points"], ["list", "Fleet list"]];
function readSort(){
  let o = null;
  try{ o = localStorage.getItem(PREF_KEY); }catch(e){}
  return SORTS.some(v => v[0] === o) ? o : "new";
}
appState.SAVES = { q: "", race: "", sel: null, sort: readSort() };
function keepSort(){ try{ localStorage.setItem(PREF_KEY, appState.SAVES.sort); }catch(e){} }

export const raceOf = ln => String(ln || "").split(" \u2014 ")[0];
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
  return sorted(lib.saves, st.sort).filter(s => matches(s, st.q) && (!st.race || raceOf(s.ln) === st.race));
}
/* One fleet's row. ctx: { openId, changed, fresh }. */
function rowHTML(s, ctx){
  const st = appState.SAVES, isOpen = s.id === ctx.openId, sel = st.sel === s.id;
  const name = s.name;
  const tags = [];
  if(isOpen) tags.push(`<em class="sf-tag on">${ctx.changed ? "open, changed" : "open"}</em>`);
  if(s.from && FROM[s.from]) tags.push(`<em class="sf-tag">${FROM[s.from]}</em>`);
  const acts = `<span class="sf-acts">${
      isOpen ? "" : `<button class="go pri" data-libopen="${esc(s.id)}" title="${esc("Open " + s.name + " on the " + s.ln + " list")}">Open</button>`
    }<span class="sf-more"><button class="go" data-send="${esc(s.id)}" title="${esc("Send " + s.name + " to another device, by link or as a file")}">Send</button><button class="del" data-libdel="${esc(s.id)}" title="${esc("Delete the saved fleet " + s.name)}">Delete</button></span></span>`;
  return `<div class="sf-row${isOpen ? " open" : ""}${sel ? " sel" : ""}${ctx.fresh(s.id) ? " fresh" : ""}" data-sfsel="${esc(s.id)}" role="option" aria-selected="${sel}" title="${esc(s.name)}">` +
    `<span class="sf-nm"><b>${esc(name)}</b>${tags.join("")}</span>` +
    `<span class="sf-ln">${esc(s.ln)}</span>` +
    `<span class="sf-pts">${s.pts | 0}</span><span class="sf-dt">${shortDate(s.saved)}</span>` +
    `<span class="sf-meta">${esc(s.ln)} &middot; ${s.pts | 0} pts &middot; ${shortDate(s.saved)}</span>${acts}</div>`;
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
/* The whole list: bar, chips, rows. */
export function savedListHTML(lib, ctx){
  const st = appState.SAVES;
  const list = shown(lib);
  if(st.sel && !lib.saves.some(s => s.id === st.sel)) st.sel = null;
  const bar = `<div class="sf-bar">
    <input id="savesq" type="search" autocomplete="off" spellcheck="false" placeholder="Search ${lib.saves.length} fleets: name, list, points, date" value="${esc(st.q)}" aria-label="Search the saved fleets">
    <select id="savessort" aria-label="Sort">${SORTS.map(o => `<option value="${o[0]}"${st.sort === o[0] ? " selected" : ""}>${o[1]}</option>`).join("")}</select></div>`;
  const body = list.length ? list.map(s => rowHTML(s, ctx)).join("")
    : `<div class="empty">No saved fleet matches${st.q ? " &ldquo;" + esc(st.q) + "&rdquo;" : ""}${st.race ? " in " + esc(st.race) : ""}.</div>`;
  return bar + chipsHTML(lib) + `<div class="sf-list" role="listbox" aria-label="Saved fleets">${body}</div>`;
}

/* The panel's own events. Each returns true when it took the event; rerender
   redraws the panel. */
export function savesClick(e, rerender){
  const t = e.target, st = appState.SAVES;
  const c = t.closest("[data-sfrace]");
  if(c){ st.race = st.race === c.dataset.sfrace ? "" : c.dataset.sfrace; rerender(); return true; }
  if(t.closest("button,input,select,textarea,a")) return false;
  const row = t.closest("[data-sfsel]");
  if(row){ st.sel = st.sel === row.dataset.sfsel ? null : row.dataset.sfsel; rerender(); return true; }
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
  appState.SAVES.sort = e.target.value; keepSort(); rerender(); return true;
}
/* Keys in the search box. Returns "open:<id>", "close" or a boolean. */
export function savesKey(e, rerender){
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
