/* The commander seen from his ship (user 31.10.2026: "for every fleet,
   attach the commander to that ship, and everything that follows from it,
   e.g. the Chaos marks then on the ship too").

   Who is aboard which ship is already settled by the rules engine (J215,
   placeCommanders: the book's placement rule or the player's pick). Until
   now only the commander's own row and card said it; his ship's row and
   card were silent, so a Mark of Khorne bought for a Warmaster never showed
   where it works. This module reads RF.aboard the other way round: for a
   ship, the commander on it, his Leadership, his re-rolls and the
   upgrades he carries onto it (a Mark, Abaddon's ...), with the same effect
   tags the commander's row shows.

   It changes no profile (J8 stands): the ship's stats stay the book's, and
   what the commander brings is said beside them, on the screen and on the
   printed card. */
import { appState } from "./state.js";
import { shipCall } from "./validation.js";
import { upFx, warlordColor, warlordIdx } from "./warlords.js";
import { L } from "./model.js";
import { esc, title } from "../../../packages/ui/format.js";

/* The palette of the commander stripes in a fleet that is not Da Ork Clanz
   (whose Warlords have their own colours, warlords.js). */
export const CMD_PALETTE = ["#b8862b", "#1b9aa0", "#8e5bd0", "#d0457f", "#6f8f2e", "#4a6fa5"];

/* A re-roll row is the commander's own (it is counted in his re-rolls); a
   Mark is not, even the Mark of Tzeentch that brings one. */
const OWN_ROW = /\bre-?rolls?\b/i;
const isMark = lab => /^(the )?mark of /i.test(lab);

/* The commander's Leadership as his ship uses it: a fixed value replaces
   the ship's roll, a modifier is added to it. */
export function shipLdText(ld){
  if(!ld || ld.value == null) return "";
  if(ld.kind === "modifier")
    return "ship's Ld " + (ld.value >= 0 ? "+" : "") + ld.value + (ld.max != null ? " (max " + ld.max + ")" : "");
  return "Ld " + ld.value + " (replaces the ship's roll)";
}

/* What a commander carries onto his ship: his taken upgrades but the re-roll
   rows, each with the effect tags his own row shows. */
export function carriedUps(C){
  const who = C.entry ? C.entry.label : "";
  return (C.upgrades || []).filter(up => up.state === "take" && (isMark(up.label) || !OWN_ROW.test(up.label)))
    .map(up => { const fx = upFx(up, who); return { label: title(up.label), tags: fx ? fx.tags : [], desc: up.description || "" }; });
}

/* For one ship (fleet index): the commanders aboard it, as
   [{ unit, name, ld, ldText, rr, ups, auto, color }]. Only a placement the
   engine calls good (a.ok): a ship he may not board does not carry him. */
export function commandersOn(RF, si){
  const out = [];
  (RF.aboard || []).forEach(a => {
    if(a.ship !== si || !a.ok) return;
    const C = RF.units[a.unit];
    if(!C) return;
    const u = appState.S.units[a.unit];
    out.push({ unit: a.unit, name: (u && u.name) || title(C.entry ? C.entry.label : "commander").replace(/\s*\(Ld [^)]*\)/i, ""),
      ld: C.leadership, ldText: shipLdText(C.leadership),
      rr: C.rerolls && C.rerolls.total ? C.rerolls.text : "", ups: carriedUps(C),
      auto: !a.chosen && a.choices.length > 1, color: cmdColor(RF, a.unit) });
  });
  return out;
}

/* A commander's stripe colour: his Warlord colour in Da Ork Clanz (the
   Clanz rows are striped already), else his place among the fleet's
   commanders. */
export function cmdColor(RF, ui){
  if(L().clanz){ const wi = warlordIdx(RF).indexOf(ui); if(wi >= 0) return warlordColor(appState.S.units[ui], wi); }
  const ws = (RF.aboard || []).map(a => a.unit);
  const k = ws.indexOf(ui);
  return CMD_PALETTE[(k < 0 ? 0 : k) % CMD_PALETTE.length];
}

const tagsHTML = tags => tags.map(x => {
  const t = Array.isArray(x) ? x[0] : x, lim = t[0] === "!";
  return `<span class="fx${lim ? " lim" : ""}">${esc(lim ? t.slice(1) : t)}</span>`;
}).join("");

/* The ship row's COMMANDER ABOARD block. */
export function cmdOnShipHTML(RF, si){
  return commandersOn(RF, si).map(c => `<div class="cmdon" style="--wl:${c.color}">
      <div class="cmdhd"><span class="abl">Commander aboard</span><b>${esc(c.name)}</b>${
        c.auto ? `<span class="sqr">automatic — change on his row</span>` : ""}</div>
      <div class="cmdbits">${c.ldText ? `<span class="fx">${esc(c.ldText)}</span>` : ""}${
        c.rr ? `<span class="fx">${esc(c.rr)}</span>` : ""}</div>${
      c.ups.map(up => `<div class="cmdup"><span class="cul">${esc(up.label)}</span>${
        up.tags.length ? `<span class="upfx">${tagsHTML(up.tags)}</span>` : up.desc ? `<span class="wlhint">${esc(up.desc)}</span>` : ""}</div>`).join("")}
    </div>`).join("");
}

/* The commander row's pointer to his ship: what moves over, in words. */
export function cmdPointerHTML(RF, ui){
  const a = (RF.aboard || []).filter(x => x.unit === ui)[0];
  if(!a || a.ship == null || !a.ok) return "";
  const ups = carriedUps(RF.units[ui] || {});
  const what = [RF.units[ui] && RF.units[ui].leadership && RF.units[ui].leadership.value != null ? "Leadership" : "", RF.units[ui] && RF.units[ui].rerolls && RF.units[ui].rerolls.total ? "re-rolls" : ""]
    .concat(ups.length ? [ups.map(u => u.label).join(", ")] : []).filter(Boolean);
  return `<div class="uctl cmdptr" style="--wl:${cmdColor(RF, ui)}"><span class="wlhint">His ${
    esc(what.join(", ").replace(/, ([^,]*)$/, " and $1"))} go with him: shown on ${esc(shipCall(RF.units[a.ship]))}'s row and card.</span></div>`;
}

/* The stripe pairs: commander row and his ship's row in one colour. Clanz
   rows keep their Warlord colours. */
export function cmdStripes(RF, isClanz){
  if(isClanz) return {};
  const of = {};
  (RF.aboard || []).forEach(a => {
    if(a.ship == null || !a.ok) return;
    const c = cmdColor(RF, a.unit);
    of[a.unit] = c;
    if(of[a.ship] == null) of[a.ship] = c;
  });
  return of;
}

/* For the printed ship card: the commander aboard, as one sentence the card
   prints in its options block, and his Leadership for the LEADERSHIP cell. */
export function cmdCardFacts(RF, si){
  const cs = commandersOn(RF, si);
  if(!cs.length) return null;
  return cs.map(c => ({ name: c.name, ld: c.ld,
    text: [c.ldText, c.rr].filter(Boolean).concat(c.ups.map(up =>
      up.label + (up.tags.length ? ": " + up.tags.map(x => { const t = Array.isArray(x) ? x[0] : x; return t[0] === "!" ? t.slice(1) : t; }).join(", ")
                                 : up.desc ? ": " + up.desc : ""))).join("; ") + "." }));
}

