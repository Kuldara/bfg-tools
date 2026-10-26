import { RR_BOX, armRowsHTML, ldCellHTML, optRowsHTML, shipCardParts, stCell } from "./cards.js";
import { giftsHTML, wepClass } from "./format.js";
import { shortStrength, shortWeaponName } from "./model.js";
import { esc, fixedCardPoints, shortArmour, shortShield, starHTML, title } from "../../../packages/ui/format.js";

/* ---------------------------------------------------- star fort cards ----
   A Ramilies (Fleets p. 500) or a Fortress-Monastery (p. 110) is four
   quadrants and a Basilica, and one card cannot hold both its plan and its
   rules: the pair is a PLAN card and a RULES card on one page. Both are
   projections of the resolved unit alone, like shipCardHTML: weapons by
   R.weapons[].zone, rule text by R.rules[].slot, critical names from
   R.damage.critical, re-roll boxes from R.rerolls. No rule sentence and no
   page number is typed here. */

/* Rules the plan card prints, by the slot the resolver gives them. Every
   other rule of the fort is on the rules card, so each R.rules entry is on
   exactly one card of the pair. */
export const FORT_PLAN_SLOTS = ["orders", "rerolls", "sectors", "boarding", "basilica"];
/* Where a star fort's critical result is ticked (table: Fleets p. 505).
   9 Command Tower and 11 Basilica Penetrated belong to the Basilica, once
   for the whole fort; 8 Hull Breach and 12 Reactor Struck are damage dealt
   at once, with nothing to keep track of afterwards; every other result
   stays with the quadrant that rolled it. The NAMES are R.damage.critical's.
   Only the placement is here, because the resolver's table carries no scope
   per result - a result this table does not know is ticked per quadrant, so
   nothing the resolver adds can drop off the card. */
export const FORT_CRIT_AT = { hub: ["9", "11"], none: ["8", "12"] };
/* special orders by the resolver's code, in the book's words */
export const ORDER_WORD = { AAF: "All Ahead Full", CTNH: "Come to New Heading", BR: "Burn Retros",
                     LO: "Lock On", RO: "Reload Ordnance", BFI: "Brace for Impact" };
export const FORT_QUADS = [
  ["NW", "NORTH-WEST", "top lft", "M6,6L6,1A5,5 0 0 0 1,6Z"],
  ["NE", "NORTH-EAST", "top rgt", "M6,6L11,6A5,5 0 0 0 6,1Z"],
  ["SW", "SOUTH-WEST", "bot lft", "M6,6L1,6A5,5 0 0 0 6,11Z"],
  ["SE", "SOUTH-EAST", "bot rgt", "M6,6L6,11A5,5 0 0 0 11,6Z"]
];
/* The plan in small for the FIRING SECTORS box: the quarter one quadrant
   covers, and a line from a firing ship to the centre of the fort. */
export const FORT_SECTOR_SVG = '<svg class="fsecg" viewBox="0 0 40 40" aria-hidden="true">' +
  '<path class="on" d="M20,20L20,0L40,0L40,20Z"/>' +
  '<path class="oct" fill-opacity="0" d="M13,5L27,5L35,13L35,27L27,35L13,35L5,27L5,13Z"/>' +
  '<line class="ax" x1="20" y1="0" x2="20" y2="40"/><line class="ax" x1="0" y1="20" x2="40" y2="20"/>' +
  '<rect class="pn" x="18.6" y="2" width="2.8" height="13"/><rect class="pr" x="18.6" y="25" width="2.8" height="13"/>' +
  '<rect class="pr" x="2" y="18.6" width="13" height="2.8"/><rect class="pr" x="25" y="18.6" width="13" height="2.8"/>' +
  '<circle class="bs" cx="20" cy="20" r="4.6"/>' +
  '<text x="11.5" y="13.5">NW</text><text x="28.5" y="13.5">NE</text>' +
  '<text x="11.5" y="29.5">SW</text><text x="28.5" y="29.5">SE</text>' +
  '<line class="ln" x1="36" y1="4" x2="22.4" y2="17.6"/><circle class="tg" cx="37" cy="3" r="1.7"/></svg>';

/* one rule line of a card, with its star if a weapon row points at it */
export function ruleLiHTML(r, cls){
  const c = [r.ast ? "ast" : "", cls || ""].filter(Boolean).join(" ");
  return `<li${c ? ` class="${c}"` : ""}>${starHTML(r.refs)}${esc(String(r.t).replace(/^\*\s*/, ""))}</li>`;
}

export function fortPlanCardHTML(R, pos){
  const P = shipCardParts(R);
  const st = R.stats, hp = st.hits;
  /* The first crippled box is the resolver's (ceil of half the hits,
     Rulebook p. 65; Fleets p. 501: a quadrant is crippled "once reduced to
     6 Damage Points" - of 12, so from box 6). */
  const crBox = R.damage.crippledAt;
  const shown = R.weapons.filter(w => w.state !== "hidden");
  const quad = shown.filter(w => w.zone === "quadrant"), bas = shown.filter(w => w.zone === "basilica");
  /* A row with no zone would be on neither part of the plan: it prints with
     the quadrant rows rather than vanish. */
  const loose = shown.filter(w => w.zone !== "quadrant" && w.zone !== "basilica");
  const wrow = r => {
    const a = r.a, cl = wepClass(a[0]);
    return `<tr style="--rw:${cl[2]}"><td class="n"><span class="bg" style="--bd:${cl[1]}">${cl[0]}</span>${
      starHTML(r.stars)}${esc(shortWeaponName(a[0]))}</td><td class="rg">${
      esc(String(a[1] == null ? "" : a[1])).replace(/(\d) cm/g, "$1\u00a0cm").split(" / ").join(" /<br>")}</td><td class="s">${
      esc(shortStrength(a[2]).replace(/\u200b/g, ""))}</td></tr>`;
  };
  const box = i => `<i>${i}</i>`;
  let track;
  if(R.damage.crippled && crBox >= 2 && crBox <= hp){
    let ok = "", cr = "";
    for(let i = 1; i <= hp; i++){ if(i < crBox) ok += box(i); else cr += box(i); }
    track = `<div class="k-hits">${ok}</div>
        <p class="k-cr">CRIPPLED <em>from box ${crBox}</em></p>
        <div class="k-hits cr">${cr}</div>`;
  }else{
    let row = "";
    for(let i = 1; i <= hp; i++) row += box(i);
    track = `<div class="k-hits">${row}</div>`;
  }
  /* Critical results as tick boxes: number and name from the resolver's
     table - its rows, and its two wide results (text up to the colon). */
  const cm = R.damage.critical;
  const results = (cm.rows || []).map(c => ({ roll: String(c[0]), name: String(c[1]) }))
    .concat((cm.wide || []).map(w => {
      const m = String(w).match(/^(\S+)\s+([^:]*)/);
      return m ? { roll: m[1], name: m[2].trim() } : { roll: "", name: String(w) };
    }));
  const tick = c => `<span><i></i><u><b>${esc(c.roll)}</b>${esc(c.name)}</u></span>`;
  const quadTicks = results.filter(c => FORT_CRIT_AT.hub.indexOf(c.roll) < 0 &&
                                        FORT_CRIT_AT.none.indexOf(c.roll) < 0).map(tick).join("");
  const hubTicks = results.filter(c => FORT_CRIT_AT.hub.indexOf(c.roll) >= 0).map(tick).join("");
  const slot = s => R.rules.filter(r => r.slot === s);
  const slotList = s => { const rs = slot(s); return rs.length ? `<ul class="k-sr">${rs.map(r => ruleLiHTML(r)).join("")}</ul>` : ""; };
  const quadStats = "SH " + shortShield(st.shields) + " \u00b7 " + String(st.turretLabel || "T").charAt(0) + " " +
                    st.turrets + " \u00b7 AR " + shortArmour(st.armour);
  const q = d => `<div class="k-box fq ${d[2]}" data-quadrant="${d[0]}"><div class="k-bd"><div class="fit-content">
        <h5><span><svg class="fcomp" viewBox="0 0 12 12" aria-hidden="true">${
          FORT_QUADS.map(o => `<path d="${o[3]}"${o[0] === d[0] ? ' class="on"' : ""}/>`).join("")
          }<circle cx="6" cy="6" r="5"/><line x1="6" y1="1" x2="6" y2="11"/><line x1="1" y1="6" x2="11" y2="6"/></svg>${d[1]}</span><em>${
          esc(quadStats)}</em></h5>
        ${track}
        <table class="fq-arm">${quad.concat(loose).map(wrow).join("")}</table>
        <div class="fct">${quadTicks}</div></div></div></div>`;
  /* the Basilica's rows say their arc once, in the heading */
  const basArc = bas.map(w => String(w.a[3] == null ? "" : w.a[3]))
    .filter((v, i, a) => v && v !== "\u2013" && v !== "-" && a.indexOf(v) === i).join(" / ");
  const hub = `<div class="k-box fbas"><h4><span>BASILICA</span><em>${esc(basArc)}</em></h4>
        <div class="k-bd"><div class="fit-content">
          <table class="fq-arm">${bas.map(wrow).join("")}</table>
          ${slotList("basilica")}
          <div class="fct">${hubTicks}</div></div></div></div>`;
  /* the column: Leadership and orders, re-rolls, firing sectors, boarding */
  const cbox = (h, body) => `<div class="k-box"><div class="k-bd"><div class="fit-content"><h6>${h}</h6>${body}</div></div></div>`;
  const ld = R.leadership;
  const orders = (R.orders || []).filter(o => ORDER_WORD[o]);
  const ldBox = cbox("LEADERSHIP &amp; ORDERS", `<div class="fline"><i class="fld">${
      ld && ld.value != null ? esc(ld.value) : ""}</i>${
      ld && ld.note ? `<span class="fldn">${esc(ld.note)}</span>` : ""}${
      orders.map(o => `<span class="ford">${esc(ORDER_WORD[o])}</span>`).join("")}</div>${slotList("orders")}`);
  const rr = R.rerolls || {}, boxes = rr.boxes || [];
  const rrBox = cbox("RE-ROLLS", (boxes.length
    ? `<div class="fline">${boxes.map(k => `<i class="rrb ${k}">${RR_BOX[k]}</i>`).join("")}</div>
       <p class="fcap">${esc(rr.head || "")}${boxes.indexOf("optional") >= 0 ? " \u00b7 dashed = only if bought" : ""} \u00b7 ${
         rr.unit === "per turn" ? "free again every turn" : "cross off when used"}</p>`
    : `<p class="fcap">${esc(rr.head || "none")}</p>`) + slotList("rerolls"));
  const secBox = slot("sectors").length ? cbox("FIRING SECTORS", FORT_SECTOR_SVG + slotList("sectors")) : "";
  const brdBox = slot("boarding").length ? cbox("BOARDING", slotList("boarding")) : "";

  return `<div class="k ${pos} fortp" data-card="fort-plan"
    style="--kd:${P.kd};--km:${P.km}"><div class="kfit">
    <div class="k-hd">
      <div class="t"><h3>${esc(P.head)}</h3><p>${esc(P.sub + " | card 1 of 2: plan")}</p></div>
      <div class="pts"><span>PTS</span><i>${fixedCardPoints(R)}</i></div>
    </div>
    <div class="fortw">
      <div class="fplan">
        ${FORT_QUADS.map(q).join("")}
        <span class="fpier v n">PIER N</span><span class="fpier v s">PIER</span><span class="fpier h w">PIER</span><span class="fpier h e">PIER</span>
        ${hub}
      </div>
      <div class="fcol">${ldBox}${rrBox}${secBox}${brdBox}</div>
    </div>
    <div class="k-foot">NOTES / STATUS</div>
  </div></div>`;
}

/* The second card of the pair: what every ship card carries - stats,
   loadout, armament, rules, the critical table - without a damage track
   (the plan has the tracks, one per quadrant: they exist once in the pair)
   and without the rules the plan already prints. The critical table is the
   legend here; the boxes to tick are on the plan, in the quadrant hit. */
export function fortRulesCardHTML(R, pos){
  const P = shipCardParts(R);
  const rules = R.rules.filter(r => FORT_PLAN_SLOTS.indexOf(r.slot) < 0);
  if(R.damage.trigger) rules.push({t: R.damage.trigger, ast: false});
  if(R.damage.repair) rules.push({t: R.damage.repair, ast: false});
  const cm = R.damage.critical;
  const cells = cm.rows.map(c => `<div><span class="lb"><b>${c[0]} ${esc(c[1])}</b>
      ${c[2] ? `<em>${esc(c[2])}</em>` : ""}</span></div>`).join("");
  return `<div class="k ${pos}${P.optMode} fortr" data-option-count="${P.optionCount}" data-card="fort-rules"
    style="--kd:${P.kd};--km:${P.km}"><div class="kfit">
    <div class="k-hd">
      <div class="t"><h3>${esc(P.head)}</h3><p>${esc(P.sub + " | card 2 of 2: rules")}</p></div>
      <div class="pts"><span>PTS</span><i>${fixedCardPoints(R)}</i></div>
    </div>
    <div class="k-st">
      ${stCell("SPEED", R.stats.speed)}
      ${stCell("TURNS", R.stats.turns)}
      ${stCell("SHIELDS", shortShield(R.stats.shields))}
      ${stCell("ARMOUR", shortArmour(R.stats.armour))}
      ${stCell(R.stats.turretLabel, R.stats.turrets)}
      ${ldCellHTML(R)}
    </div>
    <div class="k-row" style="height:25mm">
      <div style="flex:1;display:flex"><div class="k-box" style="flex:1">
        <h4>LOADOUT / OPTIONS<em>X = taken${
          R.maxPoints > R.points ? " &middot; " + R.points + " pts as ticked, max " + R.maxPoints : ""}</em></h4>
        <div class="k-bd k-optbox"><div class="k-opt-list fit-content">
          <div class="k-opt"><span class="cb on"></span>
            <span class="tx"><b>${esc(title(R.className))} / base</b>
            <span>Entry cost in ${esc(P.listName)}. Everything ticked below adds to it.${
              P.entryNote ? " " + esc(P.entryNote) : ""}</span></span>
            <span class="c">${P.basePrice}</span></div>
          ${optRowsHTML(R)}
        </div></div></div></div>
      <div style="flex:1.25;display:flex"><div class="k-box" style="flex:1">
        <h4>ARMAMENT<em>* = starred rule or option below &nbsp;|&nbsp; arc wedge = darken the one used</em></h4>
        <div class="k-bd"><div class="fit-content"><table class="k-arm">
          <thead><tr><th style="width:58%">Armament</th><th style="width:18%">Range cm</th><th style="width:16%">Str/FP</th><th class="r" style="width:8%">Arc</th></tr></thead>
          ${armRowsHTML(R)}</table></div></div></div></div>
    </div>
    <div class="k-row grow">
      <div style="flex:1;display:flex"><div class="k-box" style="flex:1">
        <h4>SPECIAL RULES / UPGRADES<em>hit tracks, orders, re-rolls, firing sectors and boarding are on the plan card</em></h4>
        <div class="k-bd"><div class="fit-content">${giftsHTML(R.gifts)}<ul class="k-sr cols">
          ${R.damage.note ? ruleLiHTML({t: R.damage.note}, "fnote") : ""}
          ${rules.map(r => ruleLiHTML(r)).join("")}
        </ul></div></div></div></div>
    </div>
    <div class="k-row" style="height:21mm">
      <div style="flex:1;display:flex"><div class="k-box"><h4>${esc(cm.title)}<em>${
        R.damage.triggerHint} &middot; tick the result on the plan card</em></h4>
        <div class="k-bd"><div class="fit-content"><div class="k-crit">${cells}
          <div class="wide"><span>${esc(cm.wide[0])}</span>
            <span>${esc(cm.wide[1])}</span><u>${esc(cm.foot)}</u></div></div></div></div></div></div>
    </div>
    <div class="k-foot">NOTES / STATUS</div>
  </div></div>`;
}

