/* A ship's info popup (user 28.10.2026, prototype C in Battlefleet
   Gothic/protot/laivainfo): an "i" beside the class name - on a catalogue
   row, on a ship in Your fleet and on a mixed squadron's row - opens
   everything about the ship.

   On a wide screen the popup is the printed card itself, made by unitCards()
   and fitCards() as the sheet makes it, so it is what prints: a ship in the
   fleet with its choices, names and squadron; a catalogue row as a new unit
   of it would print, its options still open; a mixed squadron its one card
   (mixed-card.js); a star fort both its cards. Below 700 px that card would
   be too small to read, so the popup lays the same details out for the
   screen (profile, armament, special rules, options and upgrades, damage)
   with one button for the printed card - nothing to choose first.

   It closes with x, Escape or a tap outside it: it only shows things, so
   closing it loses nothing. Nothing closes it by itself. */
import { $ } from "./boot.js";
import { cardRulesOf, resolveUnit, unitCards } from "./cards.js";
import { mixGroups } from "./mixed.js";
import { L } from "./model.js";
import { fitCards } from "./rule-card.js";
import { appState } from "./state.js";
import { newUnit } from "./view.js";
import { LISTS, SHIPS } from "../../../packages/ui/catalog.js";
import { esc, title, upCostText } from "../../../packages/ui/format.js";

const NARROW = 700;
const MM = 96 / 25.4, CARD_W = 144 * MM, CARD_H = 135 * MM;

/* The button. key: "u:<unit index>", "m:<letter>" or "c:<list>.<section>.<row>"
   (the catalogue's list: a borrowed row is a ship of its own list). */
export const infoBtnHTML = (key, what) =>
  `<button type="button" class="ibtn" data-info="${esc(key)}" title="${esc(what)}" aria-label="${esc(what)}">i</button>`;
/* a catalogue row gets one when it is a ship (a profile with a class) */
export const rowHasInfo = en => !!(en && en.r && SHIPS[String(en.r)]);

/* What a key stands for: the unit, and for a mixed squadron its group. A
   catalogue row is the new unit + would add (newUnit): its list, its
   required upgrades, an escort at its squadron's minimum. */
function targetOf(key){
  const k = String(key), v = k.slice(2);
  if(k[0] === "u"){ const u = appState.S.units[+v]; return u ? { u, inFleet: true } : null; }
  if(k[0] === "m"){
    const g = mixGroups().filter(x => x.tag === v && x.idx.length)[0];
    return g ? { u: appState.S.units[g.first], g, inFleet: true } : null;
  }
  const [li, si, ei] = v.split(".").map(Number), Lx = LISTS[li];
  if(!Lx || !rowHasInfo((Lx.secs[si] || { ents: [] }).ents[ei])) return null;
  const u = newUnit(li, si, ei, appState.SRC_ROLE);
  return u ? { u, inFleet: false } : null;
}

/* The printed cards, fitted on the sheet as for printing, then given back;
   a group's first card is its squadron card, a card alone its own. */
function fittedCards(t){
  const sheet = $("#sheet"), saved = sheet.innerHTML;
  const cs = unitCards(t.u, !t.g);
  sheet.innerHTML = cs.map(c => `<div class="page">${c.html("top")}</div>`).join("");
  fitCards();
  const out = [...sheet.querySelectorAll(".page")].map(p => p.innerHTML);
  sheet.innerHTML = saved;
  return out;
}
function cardsHTML(t){
  const cards = fittedCards(t);
  const w = Math.min(innerWidth - 32, 900) - 28, h = innerHeight - 32 - 64 - 28;
  const k = Math.max(.4, Math.min(1.35, w / CARD_W, cards.length > 1 ? 9 : h / CARD_H));
  return `<div class="if-cards">${cards.map(c => `<div class="if-card" style="width:${Math.round(CARD_W * k)}px;height:${Math.round(CARD_H * k)}px">
    <div class="page" style="transform:scale(${k.toFixed(3)})">${c}</div></div>`).join("")}</div>`;
}

/* The same details laid out for a phone */
function detailsHTML(R){
  const s = R.stats || {};
  const stat = (l, v) => v == null || v === "" ? "" : `<div><small>${esc(l)}</small><b>${esc(v)}</b></div>`;
  const arm = (R.weapons || []).map(w => `<tr><td>${esc(w.a[0])}${w.state !== "active" ? `<span class="if-tag">option</span>` : ""}</td>
    <td class="n"><span class="rd" style="background:${esc((w.range && w.range.color) || "transparent")}"></span>${esc(w.a[1])}</td>
    <td class="n">${esc(w.a[2])}</td><td>${esc(w.a[3])}</td></tr>`).join("");
  const rules = cardRulesOf(R).map(r => `<li>${esc(String(r.t || "").replace(/^\*\s*/, ""))}</li>`).join("");
  const word = st => st === "take" ? "taken" : st === "hide" ? "not printed" : "option";
  const opts = (R.options || []).filter(o => !o.forbidden).map(o => `<div><span class="st${o.state === "take" ? " on" : ""}">${word(o.state)}</span>
      <span>${esc(o.text)}</span><span class="c">${o.cost ? (o.cost > 0 ? "+" : "") + o.cost : ""}</span></div>`)
    .concat((R.upgrades || []).filter(up => up.state === "take").map(up => `<div><span class="st on">taken</span>
      <span>${esc(title(up.label))}</span><span class="c">${esc(upCostText(up))}</span></div>`)).join("");
  const d = R.damage || {};
  return `<div class="if-sec"><h4>Profile</h4><div class="if-stats">${stat("Hits", s.hits)}${stat("Speed", s.speed)}${stat("Turns", s.turns)}${
      stat("Shields", s.shields)}${stat("Armour", s.armour)}${stat(title(String(s.turretLabel || "Turrets").toLowerCase()), s.turrets)}${
      stat("Ships", R.squadron ? R.hulls : "")}</div></div>
    ${arm ? `<div class="if-sec"><h4>Armament</h4><table class="if-arm"><thead><tr><th>Weapon</th><th>Range</th><th>Str/FP</th><th>Arc</th></tr></thead><tbody>${arm}</tbody></table></div>` : ""}
    ${rules ? `<div class="if-sec"><h4>Special rules</h4><ul class="if-rules">${rules}</ul></div>` : ""}
    ${opts ? `<div class="if-sec"><h4>Options</h4><div class="if-opts">${opts}</div></div>` : ""}
    ${d.note ? `<div class="if-sec"><h4>Damage</h4><p class="if-dmg">${d.crippledAt ? "Crippled at " + esc(d.crippledAt) + " damage. " : ""}${esc(d.note)}</p></div>` : ""}`;
}

function headHTML(t, R){
  const g = t.g;
  const pts = g ? g.idx.reduce((a, j) => a + (resolveUnit(appState.S.units[j]).points || 0), 0) : R.points;
  const name = g ? (g.tiddla ? "Tiddla skwadron " : "Escort squadron ") + g.tag : title(R.className) + (t.u.name ? " – " + t.u.name : "");
  const pages = (g ? g.idx.map(j => resolveUnit(appState.S.units[j])) : [R]).map(x => x.source && x.source.page)
    .filter((p, i, a) => p != null && a.indexOf(p) === i);
  const sub = [g ? g.hulls + " escorts, mixed" : R.stats && R.stats.type, t.u.lst || L().nm, pages.length ? "Fleets p. " + pages.join(", ") : ""]
    .filter(Boolean).join(" · ");
  return `<div class="if-hd"><div class="t"><b id="infodlg-h">${esc(name)}</b><i>${esc(sub)}</i></div>
    <div class="pts">${esc(pts)} pts</div><button type="button" class="if-x" data-iclose title="Close" aria-label="Close">×</button></div>`;
}

const box = () => $("#infodlg");
export function infoOpen(){ const b = box(); return !!b && !b.hidden; }
export function closeInfo(){ const b = box(); if(b){ b.hidden = true; b.innerHTML = ""; } }
/* view: "card" or "details"; without one, the screen's width decides */
export function showInfo(key, view){
  const t = targetOf(key), b = box();
  if(!t || !b) return false;
  const R = resolveUnit(t.u);
  const v = view || (innerWidth < NARROW ? "details" : "card");
  const body = v === "card" ? cardsHTML(t)
    : t.g ? t.g.idx.map(j => { const Rj = resolveUnit(appState.S.units[j]);
        return `<h5 class="if-cls">${Rj.hulls}&times; ${esc(title(Rj.className))} <span>${Rj.points} pts</span></h5>${detailsHTML(Rj)}`; }).join("")
    : detailsHTML(R);
  const note = v === "card"
    ? (t.inFleet ? "The card as it prints: this unit's options, names and squadron." : "The book's card for a new unit: its options still open.")
    : "Everything on the card, laid out for the screen.";
  b.innerHTML = `<div class="if-box${v === "card" ? " card" : ""}">${headHTML(t, R)}<div class="if-bd">${body}</div>
    <div class="if-ft"><span>${note}</span>${v === "details" ? `<button type="button" class="btn" data-iview="${esc(key)}">Printed card</button>` : ""}</div></div>`;
  b.hidden = false;
  const x = b.querySelector("[data-iclose]");
  if(x && x.focus) try{ x.focus(); }catch(e){}
  return true;
}

if(typeof document !== "undefined" && document.addEventListener){
  /* capture: the i sits in a unit's name, whose own click opens or closes
     the unit in Compact; the i must do only its own thing */
  document.addEventListener("click", e => {
    const t = e.target && e.target.closest ? e.target.closest("button[data-info]") : null;
    if(!t) return;
    e.stopPropagation(); e.preventDefault();
    showInfo(t.dataset.info);
  }, true);
  const b = box();
  if(b) b.addEventListener("click", e => {
    if(e.target === b) return closeInfo();
    const t = e.target && e.target.closest ? e.target.closest("button[data-iclose],button[data-iview]") : null;
    if(!t) return;
    if(t.dataset.iview) showInfo(t.dataset.iview, "card");
    else closeInfo();
  });
  document.addEventListener("keydown", e => { if(e.key === "Escape" && infoOpen()) closeInfo(); });
}
