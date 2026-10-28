/* The printed card of a mixed escort squadron (user 28.10.2026, prototype E1
   in Battlefleet Gothic/protot/sekalaivue): one card for the squadron
   instead of one per class. Rulebook p. 95: "The ships in a squadron can be
   of different classes as long as they are all of the same type"; an escort
   squadron has one Leadership (p. 95) and gives its victory points as a
   whole (p. 123).

   The card is the escort card (cards.js shipCardHTML) with each part read
   from every class of the squadron:
     stats        one row per class
     loadout      each class's base row and then its own options
     armament     each class's rows, every row led by the class mark
     rules        every class's rule once; a rule not every class has is led
                  by the marks of those that have it
     hit points   one box per ship, each with its class mark
   The class mark is two letters (Cobra CO, Sword SW) in the card's own fleet
   colours, and its outline (solid, dashed, double, dotted) tells the
   classes apart in black and white too. */
import { armRowsHTML, cardRulesOf, ldCellHTML, optRowsHTML, shipCardParts } from "./cards.js";
import { giftsHTML } from "./format.js";
import { esc, fixedCardPoints, shortArmour, shortShield, starHTML, title } from "../../../packages/ui/format.js";

/* A class's short name: the first word of the class ("Cobra class
   destroyer" -> "Cobra"), as the squadron line and the marks use it. */
export const classShort = R => title(String(R.className || "").replace(/\s+class\b.*$/i, "").trim() || String(R.className || ""));

/* Two letters per class, unique on the card: the first two of the short
   name, else its first letter and a later one, else the first letter and a
   number. */
export function classCodes(Rs){
  const used = {};
  return Rs.map((R, i) => {
    const w = classShort(R).toUpperCase().replace(/[^A-Z]/g, "") || "X";
    const tries = [w.slice(0, 2)].concat(w.slice(2).split("").map(c => w[0] + c), [1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => w[0] + n));
    const c = tries.find(t => t.length === 2 && !used[t]) || w[0] + (i + 1);
    used[c] = 1;
    return c;
  });
}
export const markHTML = (code, k) => `<span class="cmk m${(k % 4) + 1}">${esc(code)}</span>`;

/* The card. Rs: the squadron's escort cards resolved, in fleet order;
   tag: the letter; tiddla: a Clanz tiddla skwadron (its word on the card). */
export function mixedEscortCardHTML(Rs, tag, pos, tiddla){
  const codes = classCodes(Rs), mk = i => markHTML(codes[i], i);
  const P0 = shipCardParts(Rs[0]);
  const kd = P0.kd, km = P0.km;
  const hulls = Rs.reduce((a, R) => a + (R.hulls || 1), 0);
  /* the price only when every card's is fixed: an open choice on any card
     leaves the box for the player, as on the class cards */
  const fixed = Rs.map(fixedCardPoints);
  const pts = fixed.every(p => p !== "") ? String(Rs.reduce((a, R) => a + (R.points || 0), 0)) : "";
  const faction = Rs[0].source && Rs[0].source.faction ? title(Rs[0].source.faction) : "";
  const pages = Rs.map(R => R.source && R.source.page).filter((p, i, a) => p != null && a.indexOf(p) === i);
  const sub = [faction, "Escort", "mixed: " + Rs.map(R => R.hulls + " " + classShort(R)).join(" + "),
               pages.length ? "pg. " + pages.join(" · ") : ""].filter(Boolean).join(" | ");
  const head = (tiddla ? "Tiddla Skwadron " : "Escort Squadron ") + tag;
  const sq = Rs[0].squadron || { min: 2, max: 6 };

  /* density: the classes' options together, plus a base row per class */
  const optionCount = Rs.reduce((a, R) => a + shipCardParts(R).optionCount, 0) + Rs.length - 1;
  const optMode = optionCount >= 9 ? " opt-overflow" : optionCount >= 7 ? " opt-dense" : optionCount >= 5 ? " opt-compact" : "";
  const optionHeight = optionCount >= 14 ? 45 : optionCount >= 10 ? 40 : optionCount >= 7 ? 35 : optionCount >= 5 ? 30 : optionCount >= 3 ? 27 : 24;

  const statRows = Rs.map((R, i) => `<tr><td class="cl">${mk(i)}${esc(classShort(R))} &times;${R.hulls}</td><td>${esc(R.stats.speed)}</td><td>${
    esc(R.stats.turns)}</td><td>${esc(shortShield(R.stats.shields))}</td><td>${esc(shortArmour(R.stats.armour))}</td><td>${esc(R.stats.turrets)}</td></tr>`).join("");
  const turretLabel = Rs[0].stats.turretLabel || "TURRETS";

  const loadout = Rs.map((R, i) => {
    const P = shipCardParts(R), each = R.defence && R.defence.stationary ? " each" : " /ship";
    return `<div class="k-opt"><span class="cb on"></span>
      <span class="tx"><b>${mk(i)}${esc(title(R.className))} / base &times;${R.hulls}</b>
      <span>Entry cost in ${esc(P.listName)}.${P.entryNote ? " " + esc(P.entryNote) : ""}</span></span>
      <span class="c">${P.basePrice}${each}</span></div>${optRowsHTML(R)}`;
  }).join("");

  /* each class's armament rows, every row led by its mark */
  const arm = Rs.map((R, i) => armRowsHTML(R).split('<td class="nm">').join('<td class="nm">' + mk(i))).join("");
  const lossCol = Rs.some(R => R.weapons.some(r => r.loss));
  const armTable = `<table class="k-arm">
          <thead>${lossCol
            ? `<tr><th style="width:42%">Armament</th><th style="width:14%">Range cm</th><th style="width:13%">Str/FP</th><th class="r" style="width:7%">Arc</th><th style="width:24%">Critical losses</th></tr>`
            : `<tr><th style="width:58%">Armament</th><th style="width:18%">Range cm</th><th style="width:16%">Str/FP</th><th class="r" style="width:8%">Arc</th></tr>`}</thead>
          ${arm}</table>`;

  /* every class's rules once, by their text */
  const seen = [];
  Rs.forEach((R, i) => {
    const rules = cardRulesOf(R);
    if(R.damage && R.damage.trigger) rules.push({ t: R.damage.trigger, ast: false });
    if(R.damage && R.damage.repair && !(R.damage.critical && R.damage.critical.groups)) rules.push({ t: R.damage.repair, ast: false });
    rules.forEach(r => {
      const t = String(r.t || "").replace(/^\*\s*/, "");
      const hit = seen.filter(x => x.t === t)[0];
      if(hit){ if(hit.who.indexOf(i) < 0) hit.who.push(i); }
      else seen.push({ t, r, who: [i] });
    });
  });
  const gifts = Rs.map(R => R.gifts).filter(Boolean)[0];
  const ruleList = `${gifts ? giftsHTML(gifts) : ""}<ul class="k-sr">
          ${seen.map(x => `<li${x.r.ast ? ' class="ast"' : ""}>${x.who.length < Rs.length ? x.who.map(mk).join("") : ""}${
            starHTML(x.r.refs)}${esc(x.t)}</li>`).join("")}
        </ul>`;

  /* one box per ship, each with its class mark and the member's name */
  const slots = Math.max(Math.min(6, sq.max), hulls);
  const boxClass = [], names = [];
  Rs.forEach((R, i) => { for(let h = 0; h < (R.hulls || 1); h++){ boxClass.push(i); names.push((R.members || [])[h] || ""); } });
  let cells = "";
  for(let j = 0; j < slots; j++){
    cells += `<div class="${j < hulls ? "" : "gh"}"><em>${j < hulls ? mk(boxClass[j]) : ""}${j + 1}</em>
        <u>${esc(names[j] || "")}</u><s>HP</s></div>`;
  }

  return `<div class="k ${pos} mixk${optMode}" data-card="mixed" data-option-count="${optionCount}"
    style="--kd:${kd};--km:${km}"><div class="kfit">
    <div class="k-hd">
      <div class="t"><h3>${esc(head)}</h3><p>${esc(sub)}</p></div>
      <div class="pts"><span>PTS</span><i>${pts}</i></div>
    </div>
    <div class="k-st mix">
      <div class="mstw"><table class="k-mst"><thead><tr><th></th><th>SPEED</th><th>TURNS</th><th>SHIELDS</th><th>ARMOUR</th><th>${esc(turretLabel)}</th></tr></thead>
        <tbody>${statRows}</tbody></table></div>
      ${ldCellHTML(Rs[0]).replace('<div class="wide', '<div class="wide mixld')}
    </div>
    <div class="k-row" style="height:${optionHeight}mm">
      <div style="flex:0 0 46mm;display:flex"><div class="k-box"><h4>SQUADRON STATE<em>1 box / ship</em></h4>
      <div class="k-bd"><div class="fit-content">
        <div class="k-sq">
          <div><span>BUILT</span><i></i></div>
          <div><span>DESTROYED</span><i></i></div>
          <div><span>REMAINING</span><i></i></div>
        </div>
        <p class="k-note">${esc(Rs[0].damage.note)} One Leadership for the squadron (Rulebook p. 95).</p></div></div></div></div>
      <div style="flex:1;display:flex"><div class="k-box" style="flex:1">
        <h4>LOADOUT / OPTIONS<em>X = taken</em></h4>
        <div class="k-bd k-optbox"><div class="k-opt-list fit-content">${loadout}</div></div></div></div>
    </div>
    <div class="k-row grow">
      <div style="flex:1.25;display:flex"><div class="k-box" style="flex:1">
        <h4>ARMAMENT<em>* = starred rule or option below &nbsp;|&nbsp; arc wedge = darken the one used</em></h4>
        <div class="k-bd"><div class="fit-content">${armTable}</div></div></div></div>
      <div style="flex:1;display:flex"><div class="k-box" style="flex:1">
        <h4>SPECIAL RULES / UPGRADES</h4>
        <div class="k-bd"><div class="fit-content">${ruleList}</div></div></div></div>
    </div>
    <div class="k-row" style="height:27mm">
      <div style="flex:1;display:flex"><div class="k-box"${slots < 6 ? ' style="flex:1"' : ""}><h4>SQUADRON HIT POINTS / MEMBERS<em>1 box / ship &middot; ${
        hulls} escorts &middot; squadron ${sq.min}&ndash;${sq.max} &middot; victory points for the whole squadron (Rulebook p. 123)</em></h4>
      <div class="k-bd"><div class="fit-content"><div class="k-mem${slots > 8 ? " tight" : ""}">${cells}</div></div></div></div></div>
    </div>
    <div class="k-foot">NOTES / STATUS</div>
  </div></div>`;
}
