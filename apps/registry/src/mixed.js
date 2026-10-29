/* Mixed escort squadrons (user 27.-28.10.2026): "The ships in a squadron can
   be of different classes as long as they are all of the same type"
   (Rulebook p. 95; escorts, Fleets p. 13). In every escort section with a
   squadron rule and two or more escort classes (28.10.2026: every list, not
   only those that count escort squadrons, L.esq, and Da Ork Clanz's tiddla
   section), the section's top row "Mixed squadron" starts one: it takes the next free
   letter, and while it is filling the section's + puts ONE ship of the
   pressed row into it (a card of that class with the letter, grown by one),
   instead of a new card of that class. Filling ends with Done, when the
   squadron is full, or when + is pressed in another section. In the fleet a
   squadron of two or more cards with one letter is drawn as one group row
   with its members; the cards are still there (open the row), and the
   saved fleet, the rules and Play see only the letters, as before. The
   printed sheet gives the squadron one card (mixed-card.js). */
import { resolveUnit } from "./cards.js";
import { L } from "./model.js";
import { SHIPS } from "../../../packages/ui/catalog.js";
import { appState } from "./state.js";
import { checks } from "./validation.js";
import { infoBtnHTML } from "./info.js";
import { clanzIn, freeSqTag, isCommandeered, orkTiddlaHint } from "./warlords.js";
import { esc, title } from "../../../packages/ui/format.js";

/* The squadron rule that sizes this section's cards, where the section is
   one whose squadrons the player may mix: an escort section with a squadron
   rule (min two or more) and at least two escort classes to mix. A section
   without a squadron rule (a list's Rogue Trader or renegade escorts, whose
   own rules decide) gets no row. */
const isEscortRow = en => !!(en && en.r && SHIPS[String(en.r)] && /escort/i.test(String(SHIPS[String(en.r)].ty || "")));
export function mixRule(si){
  const Lx = L(), sec = Lx.secs[si];
  if(!sec || sec.ct === "defence") return null;
  const tiddla = !!(Lx.clanz && clanzIn(si, Lx.clanz.tiddla));
  const r = Lx.secs.reduce((f, s2) => f || (s2.rules || []).find(x => x.kind === "squadron" && (x.sec || []).indexOf(si) >= 0), null);
  if(!r || r.min < 2) return null;
  if(!tiddla && sec.ents.filter(isEscortRow).length < 2) return null;
  return { min: r.min, max: r.max, tiddla };
}
export const mixSec = si => !!mixRule(si);
/* The rules' red rows for the squadron with this letter (user 28.10.2026:
   a custom squadron always says so when it is not legal, short of the
   minimum above all), on the squadron's own row as well as in Legality.
   Read from the checks, so the row says what the rules say: the size, Space
   Marine vessels with others, Demiurg's escorts that may not be mixed. */
export function sqErrorsHTML(tag){
  const re = new RegExp("\\b(squadron|skwadron|tiddla) " + String(tag).replace(/[^\w]/g, "\\$&") + "$", "i");
  const bad = checks().filter(c => !c.ok && re.test(String(c.t || "")));
  return bad.length ? `<div class="issues">${bad.map(c =>
    `<p class="error">⚠ ${esc(c.t)}: ${esc(c.v)}</p>`).join("")}</div>` : "";
}
export function mixActive(si){
  const M = appState.MIX;
  return M && M.list === L().nm && (si == null || M.si === si) ? M : null;
}
export function mixStart(si){ appState.MIX = { tag: freeSqTag(), si, list: L().nm }; }
export function mixStop(){ delete appState.MIX; }
/* the cards of one letter in the sections the player's squadrons live in,
   with a Blood Axe tiddla's commandeered escorts (Fleets p. 369, 29.10.2026) */
const inMix = u => mixSec(u.s) || isCommandeered(u);
export function mixUnits(tag){
  return appState.S.units.filter(u => !u.lst && u.sq === tag && inMix(u));
}
export const mixHulls = tag => mixUnits(tag).reduce((a, u) => a + (u.n || 1), 0);
/* a card that belongs to a mixed squadron: its letter is on another card
   too, or it is the squadron being filled */
export function mixMember(u){
  if(u.lst || !u.sq || !inMix(u)) return false;
  const M = mixActive();
  return (M && M.tag === u.sq) || mixUnits(u.sq).length >= 2;
}
/* The groups the fleet pane draws as one row: a letter on two or more cards,
   and the squadron being filled whatever its size. */
export function mixGroups(){
  const out = [], seen = {}, M = mixActive();
  appState.S.units.forEach((u, i) => {
    if(u.lst || !u.sq || !inMix(u) || seen[u.sq]) return;
    const idx = appState.S.units.map((x, j) => !x.lst && x.sq === u.sq && inMix(x) ? j : -1).filter(j => j >= 0);
    if(idx.length < 2 && !(M && M.tag === u.sq)) return;
    /* the squadron's own cards decide its rule; commandeered ones alone are no squadron */
    const own = idx.map(j => appState.S.units[j]).filter(x => mixSec(x.s))[0];
    if(!own) return;
    seen[u.sq] = 1;
    const r = mixRule(own.s);
    out.push({ tag: u.sq, si: own.s, idx, first: idx[0], hulls: idx.reduce((a, j) => a + (appState.S.units[j].n || 1), 0),
               com: idx.reduce((a, j) => a + (isCommandeered(appState.S.units[j]) ? appState.S.units[j].n || 1 : 0), 0),
               min: r.min, max: r.max, tiddla: r.tiddla, filling: !!(M && M.tag === u.sq) });
  });
  if(M && !seen[M.tag]){ const r = mixRule(M.si) || { min: 2, max: 6 };
    out.push({ tag: M.tag, si: M.si, idx: [], first: -1, hulls: 0, min: r.min, max: r.max, tiddla: !!r.tiddla, filling: true }); }
  return out;
}
const meterHTML = g => {
  const short = g.hulls < g.min;
  const word = short ? (g.min - g.hulls) + " more to reach " + g.min : g.hulls < g.max ? "room for " + (g.max - g.hulls) + " more" : "full";
  return `<div class="mixmeter${short ? " short" : ""}"><i style="width:${Math.round(100 * Math.min(g.hulls, g.max) / g.max)}%"></i><em style="left:${Math.round(100 * g.min / g.max)}%"></em></div>
    <div class="mixlab"><span>${g.hulls} ship${g.hulls === 1 ? "" : "s"}</span><span>${word} &middot; squadron ${g.min}&ndash;${g.max}</span></div>`;
};
const kindWord = g => g.tiddla ? "Tiddla skwadron" : "Escort squadron";
/* the section's top row: start, or the state while filling */
export function mixRowHTML(si){
  const r = mixRule(si), M = mixActive(si);
  if(!r) return "";
  if(M){
    const g = mixGroups().filter(x => x.tag === M.tag)[0] || { hulls: 0, min: r.min, max: r.max };
    return `<div class="pick mixrow on"><div class="nm">Mixed squadron ${esc(M.tag)}<span class="tag sq">filling</span>
      <small>+ on the rows below puts one ship into it &middot; ${g.hulls} ship${g.hulls === 1 ? "" : "s"}, ${
        g.hulls < g.min ? (g.min - g.hulls) + " more to reach " + g.min : g.hulls < g.max ? "room for " + (g.max - g.hulls) + " more" : "full"}</small></div>
      <div class="p"></div><span class="acts"><button type="button" class="mixdone" data-mixdone title="Stop filling; the squadron stays">Done</button></span></div>`;
  }
  return `<div class="pick mixrow"><div class="nm">Mixed squadron<span class="tag sq">any mix &middot; ${r.min}&ndash;${r.max}</span>
    <small>${r.tiddla ? "escorts" : "escorts"} of different classes in one squadron</small></div>
    <div class="p"></div><span class="acts"><button type="button" class="add mixstart" data-mixstart="${si}"
      title="Start a mixed squadron: each + below then adds one ship to it">+</button></span></div>`;
}
/* the fleet pane's group row; open shows the cards under it */
export function mixGroupHTML(g, open){
  const mem = g.idx.map(j => { const u = appState.S.units[j], R = resolveUnit(u);
    return `<b>${R.hulls}&times;</b><span>${esc(title(R.className))}${isCommandeered(u) ? " <i>commandeered</i>" : ""}${u.name ? " <i>" + esc(u.name) + "</i>" : ""}</span><span>${R.points} pts</span>`; }).join("");
  const pts = g.idx.reduce((a, j) => a + (resolveUnit(appState.S.units[j]).points || 0), 0);
  const errs = g.idx.length ? sqErrorsHTML(g.tag) : "";
  return `<div class="unit mixg${g.filling ? " filling" : ""}${errs ? " bad" : ""}" data-mixui="${g.first}" data-mixtag="${esc(g.tag)}">
    <div class="uhead">
      ${g.idx.length ? `<button type="button" class="ufold" data-mixfold="${esc(g.tag)}" aria-expanded="${!!open}" title="${open ? "Hide the cards" : "Show the cards"}">${open ? "▾" : "▸"}</button>` : `<span class="ufold"></span>`}
      <span class="cls">${kindWord(g)} ${esc(g.tag)}</span>${g.idx.length ? infoBtnHTML("m:" + g.tag, "Everything about this squadron") : ""}
      <span class="ty">${g.hulls} escort${g.hulls === 1 ? "" : "s"}${g.com ? " (" + (g.hulls - g.com) + " Ork + " + g.com + " commandeered)" : ""} &middot; mixed${g.filling ? " &middot; filling" : ""}</span>
      <span class="pts">${pts} pts</span>
      ${g.filling ? `<button type="button" class="del mixdone" data-mixdone title="Stop filling; the squadron stays">Done</button>`
                  : `<button type="button" class="del" data-mixmore="${esc(g.tag)}" title="The section's + adds to this squadron again">Add more</button>`}
      <button type="button" class="del" data-mixrm="${esc(g.tag)}" title="Remove the whole squadron">Remove</button>
    </div>
    ${mem ? `<div class="mixmem">${mem}</div>` : `<div class="mixmem empty">nothing yet &mdash; press + on the escorts in the catalogue</div>`}
    ${errs}
    ${g.filling ? `<div class="mixfill">${meterHTML(g)}</div>` : ""}
    ${g.tiddla ? `<div class="mixfill">${orkTiddlaHint(g.hulls)}</div>` : ""}
  </div>`;
}
