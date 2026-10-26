import { L, entOf, hulls, isUpgradeEnt, shipOf } from "./model.js";
import { ensureUids } from "./save.js";
import { appState } from "./state.js";
import { DATA } from "../../../packages/ui/catalog.js";
import { esc, title } from "../../../packages/ui/format.js";
import DOMAIN from "../../../packages/rules/domain.js";

/* -------------------------------------------------------- validation ---- */
/* "Bought N at a time on one card", not "counts as an escort": a real escort
   by its book type, and a one-hit planetary defence by the profile flag sq
   (platforms, air base, silos - book type Defence or Ground, Fleets
   pp. 509-517). The resolved unit says the same as R.squadron; this is the
   same answer for the helpers that have no resolved unit in hand. What the
   FLEET counts as an escort is the engine's business (resolveFleet). */
export function isEscort(u){ const sh = shipOf(u); return !!sh && (!!sh.sq || /escort/i.test(sh.ty)); }
/* An upgrade row is neither a hull nor a unit: it must not raise the section
   counter. Old saves may hold an upgrade as a row of its own, so the
   filtering happens here and not only when one is added. */
export function isUnitRow(u){ return !isUpgradeEnt(entOf(u)); }
/* The optional name filter narrows a section. A heading is not always one
   kind of ship: Bastion Fleets prints battleships, battlecruisers and
   grand cruisers under "Battleships", and the ratios there count
   different subsets of that one section. */
/* A section index means nothing across two lists, so a borrowed ship is
   never counted here. The book's own cross-list counting (pg. 14, "the
   fleet as a whole") is done by DOMAIN.resolveFleet, which matches by
   section HEADING instead of by index. */
export const ownRow = u => !u.lst && u.s >= 0 && !!entOf(u);
export function secShips(si, re){ return appState.S.units
  .filter(u => u.s === si && ownRow(u) && isUnitRow(u) && (!re || re.test(entOf(u).l)))
  .reduce((a,u) => a + hulls(u), 0); }
export function secUnits(si){ return appState.S.units.filter(u => u.s === si && ownRow(u) && isUnitRow(u)).length; }

/* The legality checks come from the pure resolveFleet (domain.js, item 8);
   this shell only builds the fleet intent from the app's state. */
export function fleetResolved(){
  ensureUids(appState.S.units);
  /* ctx.host too: without it fromLegacyUnit drops a borrowed ship's
     host-list upgrade keys, so the legality panel neither counted nor
     priced them (spot check 20, seed 2026091443 - the host's Strand of
     Fortune stayed green with no Lord in the fleet). */
  const ctx = { list: L(), host: L() };
  return DOMAIN.resolveFleet({ list: L().nm, limit: appState.S.limit|0,
    units: appState.S.units.map(u => DOMAIN.fromLegacyUnit(u, ctx, DATA)) }, DATA);
}
export function checks(){ return fleetResolved().checks; }
/* Fleet facts (J214): the attack rating, what the enemy gets for free and
   victory points that are not a ship's cost - worked out from the fleet,
   not checked. */
export function fleetFacts(){ return fleetResolved().facts || []; }
/* Who is aboard which ship (J215), by row label: the golden driver's view
   and the cards'. */
export function fleetAboard(){
  const RF = fleetResolved();
  const lab = i => { const R = RF.units[i]; return R ? (R.entry ? R.entry.label : R.className) : ""; };
  return (RF.aboard || []).map(a => ({ cmd: lab(a.unit), ship: a.ship == null ? null : lab(a.ship),
    choices: a.choices.map(lab), ok: a.ok, chosen: a.chosen, ruled: a.ruled, unit: a.unit, at: a.ship }));
}
/* A ship as the Aboard line names it: the player's name, else its class. */
export function shipCall(R){ return R ? (R.name ? R.name + " (" + title(R.className) + ")" : title(R.className)) : ""; }
/* A commander's Aboard line in the fleet pane: his ship, and a menu only
   when the book leaves a choice (or the player's pick breaks the rule). */
export function aboardHTML(ui, a, RF){
  if(!a) return "";
  /* two ships of one class without names are told apart by their order in
     the fleet ("Lunar Class Cruiser 2") */
  const same = {};
  RF.units.forEach((R, i) => { if(R && R.kind === "ship"){ const k = shipCall(R); (same[k] = same[k] || []).push(i); } });
  const nm = i => { const k = shipCall(RF.units[i]), g = same[k] || [];
    return g.length > 1 ? k + " " + (g.indexOf(i) + 1) : k; };
  const uidOf = i => appState.S.units[i] ? appState.S.units[i].uid : "";
  const why = a.ruled ? "" : " (your choice)";
  if(a.ship == null)
    return `<div class="uctl aboard"><span class="abl">Aboard</span><span class="abv${a.ruled ? " bad" : ""}">${
      a.ruled ? "no ship he may board" : "no ship in the fleet yet"}</span></div>`;
  const opts = a.choices.slice();
  if(a.chosen && opts.indexOf(a.ship) < 0) opts.unshift(a.ship);
  if(opts.length < 2 && a.ok)
    return `<div class="uctl aboard"><span class="abl">Aboard</span><span class="abv">${esc(nm(a.ship))}</span>${
      a.ruled && !a.chosen ? `<span class="sqr">set by the book</span>` : ""}</div>`;
  return `<div class="uctl aboard"><span class="abl">Aboard</span><select class="abin${a.ok ? "" : " bad"}" data-u="${ui}"
    title="The ship this commander is aboard${why}">
    <option value=""${a.chosen ? "" : " selected"}>Automatic${a.chosen ? "" : ": " + esc(nm(a.ship))}</option>${
    opts.map(i => `<option value="${esc(uidOf(i))}"${a.chosen && i === a.ship ? " selected" : ""}>${esc(nm(i))}${
      a.choices.indexOf(i) < 0 ? " \u2014 not allowed" : ""}</option>`).join("")}</select></div>`;
}
