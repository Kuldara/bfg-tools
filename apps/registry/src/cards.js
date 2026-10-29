import { critIcon, giftsHTML, wepClass } from "./format.js";
import { L, intentOf, listOf, shortWeaponName, strengthCell } from "./model.js";
import { ruleCardHTML } from "./rule-card.js";
import { fortPlanCardHTML, fortRulesCardHTML } from "./star-fort-cards.js";
import { appState } from "./state.js";
import { fleetResolved, shipCall } from "./validation.js";
import { ldLabel } from "./view.js";
import { leadsText, warlordIdx } from "./warlords.js";
import { mixedEscortCardHTML } from "./mixed-card.js";
import { mixRule } from "./mixed.js";
import { DATA } from "../../../packages/ui/catalog.js";
import { arcGlyph, esc, factionCols, fixedCardPoints, optCostLabel, shortArmour, shortRange, shortShield, starHTML, title, upCostText } from "../../../packages/ui/format.js";
import DOMAIN from "../../../packages/rules/domain.js";

/* ---------------------------------------------------- resolveUnit ------
   One resolved view of a unit for every surface (docs/DOMAIN_CONTRACT.md).

   This is a facade over the calculators above: nothing is computed here
   that was not computed before. It exists because the same ship used to be
   resolved in four places that disagreed - the fleet view and the roster
   printed sh.hp and sh.sh, the card printed effHits and effShieldsText, and
   a Warsphere bought up to 16 hits showed 10 while being built. Every
   surface reads this object now; none of them reads sh.* for a value that
   an option or a list upgrade can change.

   v0 still leans on the global S through shipOf/entOf/upState. A pure
   resolveUnit(intent, fleet, catalog) is the recorded next step. */
/* v1 lives in domain.js; this is the adapter every surface calls until
   P1-8d gives them projections. */
export function resolveUnit(u){
  const ctx = { list: listOf(u), host: L() };
  /* intentOf: a Clanz tiddla row with its skwadron's clan and Gubbins (T60) */
  return DOMAIN.resolveUnit(intentOf(u, ctx), ctx, DATA);
}

/* A replacement weapon is not a profile row, so it has no pre-computed star.
   It is looked up the same way as the others: only rules that are genuinely
   on this card qualify. */
export function starsForRow(sh, rules, a){ return DOMAIN.starsForRow(sh, rules, a, L()); }

/* Rows are wrapped into groups: an alternatives group gets its own <tbody>,
   which CSS draws a spine on. A group is identified by the armament row index
   - the base row and its replacements carry the same i. */
export function armRowsHTML(R){
  const out = [];
  let open = null;
  /* A slot whose alternatives are all gone (the swap was taken) is no longer
     a choice: its one row prints as a plain weapon, without a round box or
     OR (user 30.9.2026: "(o) OR Port weapons battery" under nothing). */
  const inSlot = {};
  R.weapons.forEach(r => { if(r.grp) inSlot[r.i] = (inSlot[r.i] || 0) + 1; });
  const solo = r => r.grp && inSlot[r.i] < 2;
  const close = () => { if(open !== null){ out.push("</tbody>"); open = null; } };
  let wasGrp = false;
  /* A card that prints only the hull's own rules (R.brief) stars a row only
     for a rule it really prints. loss: a column of boxes for the minuses a
     critical has put on that row (space hulks). */
  const shown = R.brief ? shownRuleIds(R) : null;
  const lossCol = R.weapons.some(r => r.loss);
  const span = lossCol ? 5 : 4;
  R.weapons.forEach(r0 => {
    const r = solo(r0) ? Object.assign({}, r0, { grp: 0, alt: 0, box: null }) : r0;
    const key = r.grp ? "g" + r.i : "p";
    if(key !== open){
      const gap = (r.grp || wasGrp) && out.length;
      close();
      if(gap) out.push('<tbody class="gp"><tr><td colspan="' + span + '"></td></tr></tbody>');
      out.push(r.grp ? '<tbody class="g">' : "<tbody>");
      open = key;
      wasGrp = !!r.grp;
    }
    const a = r.a;
    const [letter, badge, wash] = wepClass(a[0]);
    /* one range: the number in its band's frame (the resolver's r.range);
       the unit is in the column heading */
    const rc = r.range;
    const star = starHTML(shown ? (r.stars || []).filter(x => shown[x.id]) : r.stars);
    const loss = !lossCol ? "" : `<td class="lo">${!r.loss ? "" :
      `<span class="ls" data-loss="${esc(r.loss.key)}"><em>&minus;${r.loss.per}</em>${"<i></i>".repeat(r.loss.n)}</span>`}</td>`;
    const box = r.box ? `<span class="${r.grp ? "rb" : "wb"}${
      r.box === "on" ? " on" : ""}"></span>` : "";
    /* A port / starboard pair (the resolver's r.pair, user 12.10.2026): the
       two rows keep their names and arcs, and share one badge, one range
       and one strength. The badge is drawn as two halves (i.pj), one in
       each name cell, meeting at the line between the rows; each row's own
       badge stays in place, unseen, so the name starts where it always
       did and the row is as high as any other. Range and strength are one
       cell two rows high, printed by the upper row. */
    const pair = lossCol || r.alt || r.grp || r.box ? 0 : r.pair || 0;
    const half = pair ? `<i class="pj" style="--bd:${badge}" data-l="${letter}"></i>` : "";
    const cells = pair === 2 ? "" : `
      <td class="rg"${pair ? ' rowspan="2"' : ""}>${rc ? `<span class="rp${rc.label.length > 3 ? " l" : ""}" style="--rb:${rc.color}">${esc(rc.label)}</span>`
        : esc(shortRange(a[1])).replace(/\//g, "/<wbr>")}</td><td class="st${r.writeIn ? " wr" : ""}"${pair ? ' rowspan="2"' : ""}>${
        strengthCell(a[2])}${r.writeIn ? '<i class="wi" title="write the value in play"></i>' : ""}${pair ? '<i class="ea">each</i>' : ""}</td>`;
    out.push(`<tr class="w${r.alt ? " alt" : ""}"${pair ? ` data-pair="${pair}"` : ""} style="--rw:${wash}">
      <td class="nm">${box}${half}<span class="bg" style="--bd:${badge}">${letter}</span>
        &nbsp;${r.alt ? '<i class="or">OR</i>' : ""}${star}${
        esc(shortWeaponName(a[0]))}${r.alt && r.both ? '<i class="both">both sides</i>' : ""}</td>${cells}
      <td class="ar" data-arc="${esc(String(a[3] == null ? "" : a[3]))}" title="${
        esc(String(a[3] == null ? "" : a[3]))}">${arcGlyph(a[3])}</td>${loss}</tr>`);
  });
  close();
  return out.join("");
}
/* The rules a brief card prints: everything but the rules of its standard
   weapons. One place, so the list, the stars and the checkers agree. */
export function cardRulesOf(R){
  return R.brief ? R.rules.filter(r => !r.weapon) : R.rules.slice();
}
export function shownRuleIds(R){
  const ids = {};
  cardRulesOf(R).forEach(r => (r.refs || []).forEach(x => { ids[x.id] = 1; }));
  return ids;
}


/* The price in the open-upgrades line: the result only ("+20"), the
   multiplier ("+5 x 4 bays") comes with the tick, on the upgrade's own row. */
/* ...and the name without its trailing qualifier: "(Space Hulk: double
   cost)" is already in the price, a clan's colour is on the model. */
export const bareLabel = l => String(l || "").replace(/\s*\([^()]*\)\s*$/, "") || String(l || "");
export function shortUpCost(up){
  if(up.price == null) return "see text";
  if(!up.price) return "free";
  return (up.cost > 0 ? "+" : "") + up.cost;
}
export function optRowsHTML(R){
  const rows = [];
  /* priced per member when the unit is bought N to a card (R.squadron); a
     stationary defence is not a ship, so its price reads "each" */
  const escort = !!R.squadron;
  const perEach = R.defence && R.defence.stationary ? " each" : " / ship";
  const listName = R.entry ? R.entry.list : "";
  /* A choose-one group (the Kraken's five weapons, a Hive Ship's prow) is
     marked the way the weapon table marks it: a round box, and the first
     member says "Choose one". On the builder screen the group is enforced;
     on paper it has to be said. */
  const seenGroup = {};
  R.options.forEach(o => {
    if(o.state === "off") return;
    /* Blocked by an upgrade or a swap already taken (Power Ram vs Nova
       Cannon): not a choice on this card. A choose-one group stays visible
       with its round boxes - the choice made is part of the card. */
    if(o.state !== "take" && o.blockedBy && o.blockedBy.length && !o.group) return;
    const cost = optCostLabel(o.cost == null ? null : o.cost * o.qty) +
      (o.cost && escort ? perEach : "");
    const n = o.qty;
    /* "(max. of Ld 10)" is one sentence: an abbreviation does not end it. */
    const head = o.text.split(/(?<=[.;])(?<!\b(?:max|min|approx|incl|pts|pg|cm|no|vs)\.)\s+/i)[0].replace(/\.$/, "") +
                 (n > 1 ? " \u00d7 " + n : "");
    let rest = o.text.slice(head.length).replace(/^[.;\s]+/, "");
    if(o.group && !seenGroup[o.group]){
      seenGroup[o.group] = 1;
      rest = "Choose one of the options marked with a round box." + (rest ? " " + rest : "");
    }
    const star = starHTML(R.brief ? (o.stars || []).filter(x => shownRuleIds(R)[x.id]) : o.stars);
    rows.push(`<div class="k-opt">
      <span class="cb${o.group ? " rd" : ""}${o.state === "take" ? " on" : ""}"></span>
      <span class="tx"><b>${star}${esc(head)}</b>${rest ? `<span>${esc(rest)}</span>` : ""}</span>
      <span class="c">${esc(cost)}</span></div>`);
  });
  /* The list's own upgrades (re-roll, Mark, gubbins, Dakka Dakka) go in the
     same block as the ship's options: to the player they are the same thing. */
  const openUps = [];
  R.upgrades.forEach(up => {
    if(up.state === "off") return;
    /* the skwadron pays for it on another of its rows (ruling T60): the
       card's narrow price column says so in one word */
    const cost = up.shared ? "skwadron" : upCostText(up);
    /* Every offered row now opens as an empty box (user 30.9.2026): the open
       ones are gathered into one line below; the book's sentence comes with
       the tick. */
    if(up.state === "opt" && !up.required){ openUps.push(up); return; }
    /* the row's own list: a borrowed ship's host rows are the host's (J120) */
    const upList = up.list || listName;
    const said = up.description || (up.required ? "Required by " + upList + "." : "Fleet-list upgrade, " + upList + ".");
    rows.push(`<div class="k-opt">
      <span class="cb${up.state === "take" ? " on" : ""}"></span>
      <span class="tx"><b>${esc(title(up.label))}</b>${said ? `<span>${esc(said)}</span>` : ""}</span>
      <span class="c">${esc(cost)}</span></div>`);
  });
  if(openUps.length){
    /* A choose-one group prints once: its shared prefix ("Clan:") and a round
       box per member - the price once when every member costs the same. */
    const items = [], seenG = {};
    openUps.forEach(up => {
      if(!up.group){
        items.push(`<i class="ui"><span class="cb"></span>${esc(title(bareLabel(up.label)))} <em>${esc(shortUpCost(up))}</em></i>`);
        return;
      }
      if(seenG[up.group]) return;
      seenG[up.group] = 1;
      const ms = openUps.filter(x => x.group === up.group);
      const pre = ms.every(x => /^[^:]{2,24}:\s/.test(x.label) && x.label.split(":")[0] === ms[0].label.split(":")[0])
        ? ms[0].label.split(":")[0] : "";
      const same = ms.every(x => shortUpCost(x) === shortUpCost(ms[0]));
      items.push(`<i class="ui">${pre ? `<u>${esc(title(pre))}:</u>` : ""}${ms.map(x =>
        `<span class="cb rd"></span>${esc(title(bareLabel(pre ? x.label.slice(pre.length + 1).trim() : x.label)))}${same ? "" : ` <em>${esc(shortUpCost(x))}</em>`}`).join(" ")}${
        same ? ` <em>${esc(shortUpCost(ms[0]))}</em>` : ""}</i>`);
    });
    rows.push(`<div class="k-opt k-upg"><span class="tx"><span class="ug"><b>Upgrades</b>${items.join("")}</span></span></div>`);
  }
  if((R.note || "").trim())
    rows.push(`<div class="k-opt"><span class="cb on"></span>
      <span class="tx"><b>${esc(R.note.trim())}</b>
      <span>Fleet-list upgrade entered in the builder.</span></span>
      <span class="c">${R.adjust ? (R.adjust > 0 ? "+" : "") + R.adjust : "incl."}</span></div>`);
  return rows.join("");
}

/* The commander's re-rolls as boxes to cross off (user 5.10.2026): one per
   re-roll, in the order included - bought - open option, the sentence
   beside the heading saying the same in words. A commander with no re-roll
   and none on offer keeps the plain box. */
export const RR_BOX = { included: "included", bought: "bought", optional: "option" };
export function rerollCellHTML(R){
  const rr = R.rerolls || {}, boxes = rr.boxes || [];
  const count = k => boxes.filter(x => x === k).length;
  if(!boxes.length)
    return `<div class="wide rr"><span>RE-ROLLS</span><div class="v"><i>${esc(rr.head || "none")}</i></div></div>`;
  /* The caption needs the room of a box and a half: from five boxes up
     (Lord Admiral Rath's two included and three more, Fleets p. 48) the
     boxes have the row to themselves - the words in them say what they are. */
  const tip = boxes.length > 4 ? "" : rr.unit === "per turn" ? "free again every turn" : "cross off when used";
  return `<div class="wide rr" data-boxes="included:${count("included")} bought:${count("bought")} optional:${count("optional")}">
        <div class="rrh"><span>RE-ROLLS</span><em>${esc(rr.head || "")}${
          count("optional") ? " \u00b7 dashed = only if bought" : ""}</em></div>
        <div class="v">${boxes.map(k => `<i class="rrb ${k}">${RR_BOX[k]}</i>`).join("")}${tip ? `<small class="rrt">${tip}</small>` : ""}</div></div>`;
}

/* A commander is a list row without a hull, so it never reached the card
   sheet: the player paid for a Warmaster or a Chapter Master, picked its
   upgrades, and none of it printed. It gets the same frame as a ship, with
   blank fields to fill in rather than invented game content. Read from the
   resolved unit alone (P1-8e), like shipCardHTML. */
/* The ship printed in the commander card's ASSIGNED TO box (J215): only
   when it is settled - the book leaves one ship, or the player picked it.
   Otherwise the box stays empty for the pen. */
export function aboardCardText(u){
  const i = appState.S.units.indexOf(u);
  if(i < 0) return "";
  const RF = fleetResolved();
  const a = (RF.aboard || []).filter(x => x.unit === i)[0];
  if(!a || a.ship == null || !a.ok || !(a.chosen || a.choices.length === 1)) return "";
  return shipCall(RF.units[a.ship]);
}
/* A Clanz Warlord's skwadrons on his card (J216). */
export function leadsCardText(u){
  const i = appState.S.units.indexOf(u);
  if(i < 0 || !L().clanz) return "";
  const RF = fleetResolved();
  return warlordIdx(RF).indexOf(i) >= 0 ? leadsText(RF, i) : "";
}
export function commanderCardHTML(R, pos, aboardTx, leadsTx){
  const listName = R.entry ? R.entry.list : "";
  const [kd, km] = factionCols(listName);
  const name = R.name;
  const sub = [name ? title(R.entry.label) : "", "Commander", listName]
    .filter(Boolean).join(" | ");
  const rows = optRowsHTML(R);
  const cmdRules = R.rules.map(r => r.t).concat(leadsTx ? ["Leads: " + leadsTx + ". His re-rolls count only for these skwadrons (Fleets p. 372)."] : []);
  const optionCount = R.upgrades.filter(x => x.state === "take" || (x.state === "opt" && x.required)).length +
    Math.ceil(R.upgrades.filter(x => x.state === "opt" && !x.required).length / 5) +
    ((R.note || "").trim() ? 1 : 0);
  const optMode = optionCount >= 9 ? " opt-overflow" :
                  optionCount >= 7 ? " opt-dense" :
                  optionCount >= 5 ? " opt-compact" : "";
  const basePrice = R.entry && R.entry.price != null ? R.entry.price : (R.custom|0);
  return `<div class="k ${pos}${optMode}" data-option-count="${optionCount}"
    style="--kd:${kd};--km:${km}"><div class="kfit">
    <div class="k-hd">
      <div class="t"><h3>${esc(name || title(R.entry.label))}</h3><p>${esc(sub)}</p></div>
      <div class="pts"><span>PTS</span><i>${fixedCardPoints(R)}</i></div>
    </div>
    <div class="k-st">
      <div class="wide ld"><span>LEADERSHIP</span><div class="v"><i>${esc(ldLabel(R.leadership))}</i></div></div>
      ${rerollCellHTML(R)}
      <div class="wide as"><span>ASSIGNED TO</span><div class="v"><i>${esc(aboardTx || "")}</i></div></div>
    </div>
    <div class="k-row grow">
      <div style="flex:1.1;display:flex"><div class="k-box" style="flex:1">
        <h4>LOADOUT / OPTIONS<em>X = taken${
          R.maxPoints > R.points ? " &middot; " + R.points + " pts as ticked, max " + R.maxPoints : ""}</em></h4>
        <div class="k-bd k-optbox"><div class="k-opt-list fit-content">
          <div class="k-opt"><span class="cb on"></span>
            <span class="tx"><b>${esc(title(R.entry.label))} / base</b>
            <span>Entry cost in ${esc(listName)}${
              R.rerolls && R.rerolls.base ? ", " + esc(R.rerolls.base) : ""}. Everything ticked below adds to it.${
              R.entry.note ? " " + esc(R.entry.note) : ""}</span></span>
            <span class="c">${basePrice}</span></div>
          ${rows}
        </div></div></div></div>
      <div style="flex:1;display:flex"><div class="k-box" style="flex:1">
        <h4>COMMANDER RULES<em>${esc(title(R.entry.section))}</em></h4>
        <div class="k-bd"><div class="fit-content"><ul class="k-sr">
          ${cmdRules.map(t => `<li>${esc(t)}</li>`).join("")}
        </ul></div></div></div></div>
    </div>
    <div class="k-foot">NOTES / STATUS</div>
  </div></div>`;
}

/* A unit's cards in print order, each as { id, html(pos) }. The resolved
   unit says which card it gets (R.card):
     capital / squadron  the ship card (shipCardHTML picks the variant)
     fort                two cards, the plan first and then the rules card
                         (Ramilies p. 500, Fortress-Monastery p. 110)
     rule                a rules card (orbital mine p. 512, minefield p. 513,
                         fire ship p. 516) - also for a row without a hull
   and a commander gets the commander card. A row with none of these (a
   plain fleet option) has no card. This is the one place that decides it:
   the sheet, the audits and every checker read it, so a unit cannot pass
   the sheet's filter and then render nothing. */
export function unitCards(u, single){
  const R = resolveUnit(u);
  if(!R) return [];
  /* A mixed escort squadron (two or more escort cards with one letter,
     28.10.2026) prints as ONE card on the sheet, the squadron's
     (mixed-card.js): its first card gives it, the others give none. single:
     the unit's own card all the same (cardHTML, a card shown on screen). */
  const grp = single ? null : mixedGroupOf(u, R);
  if(grp){
    if(grp[0] !== u) return [];
    const Rs = grp.map(x => x === u ? R : resolveUnit(x)), mr = mixRule(u.s);
    return [{ id: "mixed", html: pos => mixedEscortCardHTML(Rs, u.sq, pos, !!(mr && mr.tiddla)) }];
  }
  /* a lettered escort card by itself: the card says its letter and the
     other cards of the squadron, so the table knows the three cards are one */
  if(R.kind === "ship" && R.squadron && u.sq && !u.lst){
    const mates = appState.S.units.filter(x => x !== u && !x.lst && x.sq === u.sq).map(x => resolveUnit(x)).filter(x => x && x.squadron);
    R.sqTag = u.sq; R.sqMates = mates.map(x => x.hulls + " " + title(x.className)).join(" + ");
  }
  if(R.card === "fort" && R.kind === "ship")
    return [{ id: "plan", html: pos => fortPlanCardHTML(R, pos) },
            { id: "rules", html: pos => fortRulesCardHTML(R, pos) }];
  const one = R.card === "rule" && R.ruleCard ? pos => ruleCardHTML(R, pos)
            : R.kind === "ship" ? pos => shipCardHTML(R, pos)
            : R.kind === "commander" ? pos => commanderCardHTML(R, pos, aboardCardText(u), leadsCardText(u)) : null;
  return one ? [{ id: "card", html: one }] : [];
}
/* The escort cards of u's mixed squadron in fleet order, or null: u is an
   escort card of this fleet's own list with a letter that at least one other
   such card has. */
const isEscortCard = R => !!(R && R.kind === "ship" && R.squadron && !R.defence);
export function mixedGroupOf(u, R){
  if(!u || !u.sq || u.lst || !isEscortCard(R || resolveUnit(u))) return null;
  const g = appState.S.units.filter(x => x === u || (!x.lst && x.sq === u.sq && isEscortCard(resolveUnit(x))));
  return g.length >= 2 ? g : null;
}
/* One card of a unit: the only card of most, and of a star fort the RULES
   card - the one that carries what every ship card carries (stats, loadout,
   armament, rules). The plan comes from unitCards(). A member of a mixed
   squadron gives its own class card here; the sheet prints the squadron's. */
export function cardHTML(u, pos){
  const cs = unitCards(u, true);
  return cs.length ? cs[cs.length - 1].html(pos) : "";
}


/* A stats cell. The write-in box is for the value as it stands in play, and
   it only fits beside a short one: a long value used to run under the box,
   which is what looked like the box covering the numbers (user 20.9., Eldar
   speed). Every long value is also one nobody writes a single number for -
   Eldar speed is read off the wind each turn (Fleets pp. 302-305), turns
   "Special", a save instead of shields, quadrant armour - so those cells keep
   the value and drop the box. */
export function stCell(label, value){
  const v = String(value == null ? "" : value);
  /* Three parts, not one number: Eldar speed is sunward / crosswind / downwind
     and is read off the sun each turn (Fleets pp. 302-305), quadrant armour is
     per facing, and a save is not a shield count. Those keep the value and drop
     the box - the widest of them, "10/20/25 cm", needs 18.53 mm where the box
     leaves 15.1 mm. Two-part values like "6+/5+" fit beside the box. */
  const parts = (v.match(/\//g) || []).length >= 2;
  return `<div${parts ? ' class="nobox"' : ""}><span>${esc(label)}</span><div class="v"><b>${
    esc(v)}</b><i></i></div></div>`;
}
/* The LEADERSHIP cell of a ship's stats row. Rolled before the game: a blank
   box to write in, as it always was. Fixed by the book - a planetary
   defence's nominal 7 (Fleets p. 499), a Fortress-Monastery's 10 (p. 111) -
   the resolver gives the value and a short caption, and the card prints
   them without a box. */
export function ldCellHTML(R, extra){
  const ld = R.leadership;
  if(!ld || ld.kind !== "fixed" || ld.value == null)
    return `<div class="wide"><span>LEADERSHIP</span><div class="v"><i></i>${extra || ""}</div></div>`;
  return `<div class="wide ldfix"><span>LEADERSHIP</span><div class="v"><b>${esc(ld.value)}</b>${
    ld.note ? `<small class="ldn">${esc(ld.note)}</small>` : ""}${extra || ""}</div></div>`;
}
/* A ship's own re-rolls as small boxes beside its Leadership (J168 c): the
   Scion of Prospero's two (Fleets p. 258), a Mark of Tzeentch's one. A
   seventh cell did not fit the stat row; the box kinds are the commander
   card's (included, bought, dashed = only if bought). */
export function shipRerollBoxes(R){
  const boxes = (R.rerolls && R.rerolls.boxes) || [];
  if(!boxes.length) return "";
  return `<span class="rrm" title="${esc(R.rerolls.text || "")}"><small>RR</small>${
    boxes.map(k => `<i class="rrb ${k}"></i>`).join("")}</span>`;
}

/* What every card of one ship shares: the fleet's colours, the headline and
   the line under it, the option count that picks the density class, and the
   base row's price. One place, so the ordinary card and a star fort's two
   cards cannot drift apart. Pure, like the cards that read it. */
export function shipCardParts(R){
  const listName = R.entry ? R.entry.list : "";
  const [kd, km] = factionCols(listName, R.source.faction || "");
  const name = R.name;
  /* A hull-choice row prints the row's own name as the class ("Venerable
     Battle Barge") and the hull it sits on underneath - the card says what
     the ship is and what it is built from. */
  const rowName = R.hull && R.entry ? title(R.entry.label) : "";
  /* A named hull-choice ship keeps its role on the card as well (Fleets
     p.102: "battle barge" is a role, not a class): the name is the headline
     and "Venerable Battle Barge - Oberon Class Battleship" goes under it. */
  const cls = !(name || rowName) ? "" :
              name && rowName ? rowName + " \u2014 " + title(R.className) : title(R.className);
  /* A borrowed ship says so on the card, because its price, options and
     upgrades come from another fleet list and the player at the table has
     to be able to answer "where is this from" without the app open. Only a
     borrowed ship gets the extra words, so no existing card grows. */
  const borrowed = R.role === "reserve" || R.role === "ally";
  const sub = [cls, R.source.faction ? title(R.source.faction) : "",
               R.stats.type, "pg. " + R.source.page,
               borrowed ? R.role + ": " + listName : ""].filter(Boolean).join(" | ");
  /* the open fleet-list upgrades share one line on the card; it wraps about
     every five items, and each wrapped line counts like a row */
  const upShown = R.upgrades.filter(x => x.state === "take" || (x.state === "opt" && x.required)).length +
    Math.ceil(R.upgrades.filter(x => x.state === "opt" && !x.required).length / 5);
  const optionCount = R.options.filter(o => o.state !== "off").length +
    upShown + ((R.note || "").trim() ? 1 : 0);
  const optMode = optionCount >= 9 ? " opt-overflow" :
                  optionCount >= 7 ? " opt-dense" :
                  optionCount >= 5 ? " opt-compact" : "";
  /* The base line is the row's entry cost. A hull-choice row has no list
     price of its own: its base is the chosen hull's (listed cost +35 crew,
     Fleets p. 102), which the resolver already gives. Printing the open-
     price field there showed the first hull's price after a hull change. */
  const basePrice = R.hull ? R.entry.basePoints
    : (R.entry && R.entry.price != null ? R.entry.price : (R.custom|0));
  return { listName, kd, km, head: name || rowName || title(R.className), sub,
           optionCount, optMode, basePrice, entryNote: R.entry ? R.entry.note : "" };
}

export function shipCardHTML(R, pos){
  /* Squadron card or capital card: the resolved unit decides (R.squadron),
     not the book type - a one-hit planetary defence is type Defence or
     Ground and is still bought one to six to a card (Rulebook p. 100). */
  const sqd = R.squadron, escq = !!sqd, n = R.hulls;
  /* cardOnly (ground units, Fleets p. 517): the card holds up to that many,
     but the book gives them no squadron rule - the card must not print one. */
  const grouped = escq && !sqd.cardOnly;
  /* what one member is called: a stationary defence is not a ship */
  const each = R.defence && R.defence.stationary ? "defence" : "ship";
  const P = shipCardParts(R);
  const listName = P.listName, kd = P.kd, km = P.km, sub = P.sub,
        optionCount = P.optionCount, optMode = P.optMode;
  /* Rulebook v1.10 p. 65: "A ship which loses half its damage points is
     crippled", and the book's own example has an 8-hit Lunar crippled from
     its fourth point. The threshold is ceil(hp/2), not floor(hp/2)+1 - the
     latter is right only for odd values. */
  const hitPts = R.stats.hits;
  const crBox = Math.ceil(hitPts / 2);
  /* Tightening the bars freed vertical space; part goes to the option list
     and the rest flows by itself into the ARMAMENT/SPECIAL row, which is
     flex:1. */
  /* Fewer options, lower row: the height a card does not need for its
     loadout goes to the ARMAMENT/SPECIAL row, which is what runs short on
     ships with many rules (measured: layout_check.js). */
  const optionHeight = optionCount >= 14 ? 45 : optionCount >= 10 ? 40 :
                       optionCount >= 7 ? 35 : optionCount >= 5 ? 30 :
                       optionCount >= 3 ? 27 : 24;

  let left;
  if(escq){
    left = `<div class="k-box"><h4>${grouped ? "SQUADRON STATE" : "ON THIS CARD"}<em>1 box / ${each}</em></h4>
      <div class="k-bd"><div class="fit-content">
        <div class="k-sq">
          <div><span>BUILT</span><i></i></div>
          <div><span>DESTROYED</span><i></i></div>
          <div><span>REMAINING</span><i></i></div>
        </div>
        <p class="k-note">${esc(R.damage.note)}</p></div></div></div>`;
  }else{
    /* Top band still fighting, bottom band crippled. A band of nothing is
       not worth drawing, so very small hulls stay in one row. */
    const hp = hitPts, box = i => `<i>${i}</i>`;
    let hits = "";
    if(R.damage.crippled && crBox >= 2 && crBox <= hp){
      const okRow = [], crRow = [];
      for(let i = 1; i <= hp; i++) (i < crBox ? okRow : crRow).push(box(i));
      hits = `<div class="k-hits">${okRow.join("")}</div>
        <p class="k-cr">CRIPPLED <em>from box ${crBox}</em></p>
        <div class="k-hits cr">${crRow.join("")}</div>`;
    }else{
      let row = "";
      for(let i = 1; i <= hp; i++) row += box(i);
      hits = `<div class="k-hits">${row}</div>`;
    }
    left = `<div class="k-box"><h4>DAMAGE<em>tick per Hit</em></h4>
      <div class="k-bd"><div class="fit-content">${hits}
        <p class="k-note">${esc(R.damage.note)}</p></div></div></div>`;
  }

  let bottom;
  if(escq){
    const mem = R.members;
    /* One box per ship, not a fixed six: Ork tiddla squadrons run to ten
       and Tyranid escorts to twelve, and half the squadron used to have
       nowhere to record its hits. Six is kept as the floor so small
       squadrons still look like a card and not a stub. */
    /* The list's squadron size (R.squadron, J69) is printed with the boxes. */
    const sq = sqd;
    const slots = Math.max(Math.min(6, sq.max), n);
    let cells = "";
    for(let i = 0; i < slots; i++){
      const nm = mem[i] || "";
      cells += `<div class="${i < n ? "" : "gh"}"><em>${i + 1}</em>
        <u>${esc(nm)}</u><s>HP</s></div>`;
    }
    /* A squadron the book names says its size; a card that merely holds
       several (cardOnly) says how many it holds and nothing more. */
    /* Fewer than six boxes do not fill the row by their own width (an air
       base card holds four): the box is then told to take the row. */
    bottom = `<div class="k-box"${slots < 6 ? ' style="flex:1"' : ""}><h4>${grouped ? "SQUADRON HIT POINTS / MEMBERS" : "HIT POINTS / MEMBERS"}<em>1 box / ${each} &middot; ${
      grouped ? "squadron " + sq.min + "\u2013" + sq.max : "up to " + sq.max + " per card"}${
      slots > 6 ? " &middot; " + n + " ships" : ""}${
      R.sqTag ? " &middot; SQUADRON " + esc(R.sqTag) + (R.sqMates ? " with " + esc(R.sqMates) : "") : ""}</em></h4>
      <div class="k-bd"><div class="fit-content"><div class="k-mem${
        slots > 8 ? " tight" : ""}">${cells}</div></div></div></div>`;
  }else if(R.damage.critical.groups){
    /* Space hulk: the D6 table as its three results with their sub-results
       (Fleets pp. 288, 391). A loss that lands on a weapon is ticked on that
       weapon's row; shields, turrets and thrusters are ticked here. */
    const cm = R.damage.critical;
    const where = { lance: "lance row", bay: "launch bay row", torp: "torpedo row", wb: "battery row" };
    const boxes = cm.groups.map((g, gi) => `<div class="hg${gi === 1 ? " w2" : gi === 2 ? " w0" : ""}">
      <h6><u>${esc(g.roll)}</u>${esc(g.name)}<em>${esc(g.how)}</em></h6>
      <div class="hs">${g.subs.map(x => `<p${x.roll ? "" : ' class="col"'}>${x.roll ? `<s>${esc(x.roll)}</s>` : ""}<b>${esc(x.text)}</b>${
        x.track ? `<span>${'<i class="hb"></i>'.repeat(x.track.n)}</span>`
                : `<em>&rarr; tick ${x.both ? "both lance rows" : "the " + (where[x.on] || "weapon row")}</em>`}</p>`).join("")}</div></div>`).join("");
    bottom = `<div class="k-box"><h4>${esc(cm.title)}<em>${
      R.damage.triggerHint} &middot; one box per critical</em></h4>
      <div class="k-bd"><div class="fit-content"><div class="k-hcrit">${boxes}
        <div class="wide"><span>${esc(cm.wide[0])}</span><span>${esc(cm.wide[1])}</span><i>${esc(cm.foot)}</i></div>
      </div></div></div></div>`;
  }else{
    const cm = R.damage.critical;
    /* v1.2: a result that cannot be repaired is taken at most once and has
       one box (Rulebook p. 67, cm.once); the standard table's results carry a
       pictogram of where the ship was hit (cm.icons). */
    const once = cm.once || [], icons = cm.icons || {};
    const cells = cm.rows.map(c => `<div${icons[c[0]] ? ' class="ic"' : ""}>${icons[c[0]] ? critIcon(icons[c[0]]) : ""}<span class="lb"><b>${c[0]} ${esc(c[1])}</b>
      ${c[2] ? `<em>${esc(c[2])}</em>` : ""}</span>
      <span class="tk">${"<i></i>".repeat(once.indexOf(c[0]) >= 0 ? 1 : 5)}</span></div>`).join("");
    bottom = `<div class="k-box"><h4>${esc(cm.title)}<em>${
      R.damage.triggerHint} &middot; tick a box per result</em></h4>
      <div class="k-bd"><div class="fit-content"><div class="k-crit">${cells}
        <div class="wide"><span>${esc(cm.wide[0])}</span>
          <span>${esc(cm.wide[1])}</span><u>${esc(cm.foot)}</u></div></div></div></div></div>`;
  }

  const rules = cardRulesOf(R);
  if(R.damage.trigger) rules.push({t: R.damage.trigger, ast: false});
  /* the hulk's "cannot repair" is the foot of its critical box already */
  if(R.damage.repair && !R.damage.critical.groups) rules.push({t: R.damage.repair, ast: false});
  const hulkCard = !!R.damage.critical.groups;
  const basePrice = P.basePrice, entryNote = P.entryNote;
  /* A stationary defence whose rules outgrow the box beside the weapon
     table: an Eldar Haven (Fleets pp. 334-337) or a Tau Orbital (p. 480)
     carries over 2000 characters of rules and three or four weapon rows, and
     with the two side by side the rules came out at 3.9 pt while half the
     ARMAMENT box stood empty (layout_check.js, 8.10.2026). On such a card
     the two share ONE box set in two columns: the weapon table heads the
     first column and the rules run on under it and into the second, so the
     space under a short table is the rules'. The table keeps half the
     card's width - narrower than that and its Str column clips a hook's
     "Orca/Warden". Decided from the resolved unit (a defence, and how much
     rule text it has), so no ship of a fleet list changes. */
  const ruleChars = rules.reduce((a, r) => a + String(r.t || "").length, 0);
  const wide = !escq && !!R.defence && ruleChars >= 2000;
  const armTable = `<table class="k-arm">
          <thead>${R.weapons.some(r => r.loss)
            ? `<tr><th style="width:42%">Armament</th><th style="width:14%">Range cm</th><th style="width:13%">Str/FP</th><th class="r" style="width:7%">Arc</th><th style="width:24%">Critical losses</th></tr>`
            : `<tr><th style="width:58%">Armament</th><th style="width:18%">Range cm</th><th style="width:16%">Str/FP</th><th class="r" style="width:8%">Arc</th></tr>`}</thead>
          ${armRowsHTML(R)}</table>`;
  const ruleList = `${giftsHTML(R.gifts)}<ul class="k-sr">
          ${rules.map(r => `<li${r.ast ? ' class="ast"' : ""}>${
            starHTML(r.refs)}${esc(r.t.replace(/^\*\s*/, ""))}</li>`).join("")}
        </ul>`;
  const armHead = `<h4>ARMAMENT<em>* = starred rule or option below &nbsp;|&nbsp; arc wedge = darken the one used</em></h4>`;

  return `<div class="k ${pos}${optMode}${
    hitPts >= 16 ? " hp-big" : ""}${wide ? " widerules" : ""}" data-option-count="${optionCount}"
    style="--kd:${kd};--km:${km}"><div class="kfit">
    <div class="k-hd">
      <div class="t"><h3>${esc(P.head)}</h3><p>${esc(sub)}</p></div>
      <div class="pts"><span>PTS</span><i>${fixedCardPoints(R)}</i></div>
    </div>
    <div class="k-st">
      ${stCell("SPEED", R.stats.speed)}
      ${stCell("TURNS", R.stats.turns)}
      ${stCell("SHIELDS", shortShield(R.stats.shields))}
      ${stCell("ARMOUR", shortArmour(R.stats.armour))}
      ${stCell(R.stats.turretLabel, R.stats.turrets)}
      ${ldCellHTML(R, shipRerollBoxes(R))}
    </div>
    <div class="k-row" style="height:${optionHeight}mm">
      <div style="flex:0 0 ${escq ? 46 : hitPts >= 16 ? 58 : 38}mm;display:flex">${left}</div>
      <div style="flex:1;display:flex"><div class="k-box" style="flex:1">
        <h4>LOADOUT / OPTIONS<em>X = taken${
          R.maxPoints > R.points ? " &middot; " + R.points + " pts as ticked, max " + R.maxPoints : ""}</em></h4>
        <div class="k-bd k-optbox"><div class="k-opt-list fit-content">
          <div class="k-opt"><span class="cb on"></span>
            <span class="tx"><b>${esc(title(R.className))} / base</b>
            <span>Entry cost in ${esc(listName)}. Everything ticked below adds to it.${
              entryNote ? " " + esc(entryNote) : ""}</span></span>
            <span class="c">${basePrice}${escq ? (each === "ship" ? " /ship" : " each") : ""}</span></div>
          ${optRowsHTML(R)}
        </div></div></div></div>
    </div>
    <div class="k-row grow">${wide ? `
      <div style="flex:1;display:flex"><div class="k-box" style="flex:1">
        ${armHead}
        <div class="k-bd"><div class="fit-content k-flow">${armTable}
          <h5 class="k-subh">SPECIAL RULES / UPGRADES</h5>
          ${ruleList}</div></div></div></div>` : `
      <div style="flex:${hulkCard ? 1.7 : 1.25};display:flex"><div class="k-box" style="flex:1">
        ${armHead}
        <div class="k-bd"><div class="fit-content">${armTable}</div></div></div></div>
      <div style="flex:1;display:flex"><div class="k-box" style="flex:1">
        <h4>SPECIAL RULES / UPGRADES</h4>
        <div class="k-bd"><div class="fit-content">${ruleList}</div></div></div></div>`}
    </div>
    <div class="k-row" style="height:${hulkCard ? 28 : 27}mm">
      <div style="flex:1;display:flex">${bottom}</div>
    </div>
    <div class="k-foot">NOTES / STATUS</div>
  </div></div>`;
}

