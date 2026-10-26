import { $ } from "./boot.js";
import { ldCellHTML, stCell } from "./cards.js";
import { ruleLiHTML } from "./star-fort-cards.js";
import { esc, factionCols, fixedCardPoints, shortArmour, shortShield, title } from "../../../packages/ui/format.js";

/* ----------------------------------------------------------- rule card ----
   A unit that is a rule to follow rather than a profile to read: the orbital
   mine (Fleets p. 512), the minefield (p. 513) and the fire ship (p. 516).
   The resolver carries the card as R.ruleCard - a lead, numbered steps, what
   to keep count of and the row's own limit - and this draws it: one card per
   list row, the steps in the order they come up in play, and a tracking box.
   A fire ship is also a ship: it keeps its stats row, its squadron's member
   boxes and its own rules. Nothing is typed here but headings. */
export function ruleCardHTML(R, pos){
  const rc = R.ruleCard, n = R.hulls;
  const listName = R.entry ? R.entry.list : "";
  const src = R.source || {};
  const cols = factionCols(listName, src.faction || "");
  const what = title(rc.title);
  const name = R.stats ? R.name : "";
  const price = R.entry && R.entry.price != null ? R.entry.price : null;
  const sub = [name ? what : "",
               src.faction ? title(src.faction) : (R.entry ? title(R.entry.section) : ""),
               R.stats ? R.stats.type : "", "pg. " + rc.page, "rules card"].filter(Boolean).join(" | ");
  /* what was bought, in words: how many, what one costs, the row's limit */
  const bought = [n + " bought", price != null ? price + " pts each" : "",
                  rc.limit != null ? "0\u2013" + rc.limit + " per fleet" : ""].filter(Boolean).join(" \u00b7 ");
  const sq = R.squadron;
  let track, trackRows;
  if(sq){
    /* a ship bought N to a card: the squadron card's member boxes */
    const mem = R.members || [], slots = Math.max(Math.min(6, sq.max), n);
    let cells = "";
    for(let i = 0; i < slots; i++)
      cells += `<div class="${i < n ? "" : "gh"}"><em>${i + 1}</em>
        <u>${esc(mem[i] || "")}</u><s>HP</s></div>`;
    track = `<div class="k-mem${slots > 8 ? " tight" : ""}">${cells}</div>${
      R.damage && R.damage.note ? `<p class="k-note">${esc(R.damage.note)}</p>` : ""}`;
    trackRows = Math.ceil(slots / 3) + 1;
  }else if(rc.track && rc.track.kind === "size"){
    /* a size rolled at set-up: two boxes to write it in, per item */
    let cells = "";
    for(let i = 0; i < n; i++)
      cells += `<span class="rsz"><em>${i + 1}</em><i class="rwr"></i>cm \u00d7 <i class="rwr"></i>cm</span>`;
    track = `<div class="rtrk">${cells}</div>`;
    trackRows = Math.ceil(n / 3);
  }else{
    let cells = "";
    for(let i = 0; i < n; i++) cells += '<i class="rtk"></i>';
    track = `<div class="rtrk">${cells}</div>`;
    trackRows = Math.ceil(n / 18);
  }
  const trackHead = esc(rc.track && rc.track.label ? rc.track.label : what.toUpperCase()) + `<em>${esc(bought)}${
    sq ? " &middot; " + (sq.cardOnly ? "up to " + sq.max + " per card" : "squadron " + sq.min + "\u2013" + sq.max) : ""}</em>`;
  const steps = (rc.steps || []).map((s, i) => `<div class="rstep"><b>${i + 1}</b><div><h5>${esc(s.h)}</h5><p>${esc(s.t)}</p></div></div>`).join("");
  const rules = (R.rules || []).slice();
  if(R.damage && R.damage.trigger) rules.push({t: R.damage.trigger, ast: false});
  if(R.damage && R.damage.repair) rules.push({t: R.damage.repair, ast: false});
  return `<div class="k ${pos} rulek" data-card="rule"
    style="--kd:${cols[0]};--km:${cols[1]}"><div class="kfit">
    <div class="k-hd">
      <div class="t"><h3>${esc(name || what)}${!name && n > 1 ? " \u00d7 " + n : ""}</h3><p>${esc(sub)}</p></div>
      <div class="pts"><span>PTS</span><i>${fixedCardPoints(R)}</i></div>
    </div>${R.stats ? `
    <div class="k-st">
      ${stCell("SPEED", R.stats.speed)}
      ${stCell("TURNS", R.stats.turns)}
      ${stCell("SHIELDS", shortShield(R.stats.shields))}
      ${stCell("ARMOUR", shortArmour(R.stats.armour))}
      ${stCell(R.stats.turretLabel, R.stats.turrets)}
      ${ldCellHTML(R)}
    </div>` : ""}
    <div class="k-row" style="height:${(7 + 7.5 * trackRows).toFixed(1)}mm">
      <div style="flex:1;display:flex"><div class="k-box" style="flex:1"><h4>${trackHead}</h4>
        <div class="k-bd"><div class="fit-content">${track}</div></div></div></div>
    </div>
    <div class="k-row grow">
      <div style="flex:1;display:flex"><div class="k-box" style="flex:1"><h4>HOW IT WORKS<em>step by step</em></h4>
        <div class="k-bd"><div class="fit-content">${rc.lead ? `<p class="rlead">${esc(rc.lead)}</p>` : ""}${steps}</div></div></div></div>
    </div>${rules.length ? `
    <div class="k-row" style="height:22mm">
      <div style="flex:1;display:flex"><div class="k-box" style="flex:1"><h4>SPECIAL RULES</h4>
        <div class="k-bd"><div class="fit-content"><ul class="k-sr">
          ${rules.map(r => ruleLiHTML(r)).join("")}
        </ul></div></div></div></div>
    </div>` : ""}
    <div class="k-foot">NOTES / STATUS</div>
  </div></div>`;
}

/* Card content varies; the box is a fixed 135 mm, so an over-long card is
   shrunk to fit rather than clipped.
   One long function on purpose: download-editable.js copies its source text
   (fitCards.toString()) into the downloaded sheet, and layout_check.js into
   its test page, so every helper it needs (setScale, roomOf, fitInto,
   balance ...) lives inside it. A helper moved out would be missing there. */
export function fitCards(){
  const sheet = $("#sheet");
  const prev = sheet.getAttribute("style") || "";
  sheet.setAttribute("style", "display:block;position:absolute;left:-20000px;top:0");

  /* k below 1 shrinks a block into its box, k above 1 (v1.2) grows it: the
     layout box is made narrower or wider by the same factor, so the text
     re-flows and the scaled block is again exactly as wide as its box. */
  const setScale = (content, k) => {
    const on = k < .999 || k > 1.001;
    content.style.transform = on ? "scale(" + k.toFixed(4) + ")" : "";
    content.style.width = on ? (100 / k).toFixed(2) + "%" : "";
  };
  /* A second run (print after preview, the edited download) starts from the
     same state as the first: no scale left on any block, no growth mark. The
     weapon-table cells below are measured before the rows are balanced, and
     a block still scaled from the last run would be measured narrower or
     wider than it is. */
  sheet.querySelectorAll(".k-box > .k-bd > .fit-content").forEach(content => {
    setScale(content, 1);
    delete content.dataset.growMax;
    content.classList.remove("fit-grow");
  });
  /* A weapon name the last run abbreviated (below) gets its full text back,
     unless somebody has edited the cell since - then the edit stands. */
  const nameNode = td => {
    let n = null;
    td.childNodes.forEach(c => { if(c.nodeType === 3 && c.nodeValue.replace(/\u00a0/g, " ").trim()) n = c; });
    return n;
  };
  sheet.querySelectorAll(".k-arm .rp.t").forEach(e => e.classList.remove("t"));
  sheet.querySelectorAll(".k-arm td.nm[data-abbr]").forEach(td => {
    const n = nameNode(td);
    if(n && n.nodeValue === td.dataset.abbr) n.nodeValue = td.dataset.full;
    delete td.dataset.abbr;
    delete td.dataset.full;
  });
  /* Each section's content is fitted into its own box. The scale is found by
     bisection - the old 4 % steps overshot by up to a step - and has no hard
     floor: nothing is cut or hidden, even if unusual data ends in very
     small text. */
  /* The room is the box's content area: a fit against the padding box let
     the last line run into the bottom padding and be clipped. */
  const roomOf = box => {
    const cs = getComputedStyle(box);
    return box.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom) + .5;
  };
  /* kmax (v1.2): how far the block may GROW when it fits at full size - the
     row balance decides it per block (data-grow-max) and gives none to a card
     on which anything had to shrink. Growth under 4 % is not taken: nobody
     sees it, and the narrower layout it needs can wrap a line that just fitted. */
  const fitInto = (box, content, kmax) => {
    const room = roomOf(box);
    const fits = k => { setScale(content, k); return content.getBoundingClientRect().height <= room; };
    let k = 1;
    if(!fits(1)){
      let lo = .1, hi = 1;
      if(fits(lo)) for(let i = 0; i < 10; i++){ const mid = (lo + hi) / 2; if(fits(mid)) lo = mid; else hi = mid; }
      k = lo; setScale(content, k);
    }else if(kmax > 1.001){
      if(fits(kmax)) k = kmax;
      else{
        let lo = 1, hi = kmax;
        for(let i = 0; i < 10; i++){ const mid = (lo + hi) / 2; if(fits(mid)) lo = mid; else hi = mid; }
        k = lo < 1.04 ? 1 : lo;
      }
      setScale(content, k);
    }
    const overflow = content.getBoundingClientRect().height > room;
    content.dataset.fitScale = k.toFixed(4);
    content.dataset.fitOverflow = overflow ? "true" : "false";
    return {k, overflow};
  };

  /* Row balance. Below the stats a ship card has three rows: LOADOUT with
     the damage box, ARMAMENT / SPECIAL RULES, and the critical table. The
     heights in the markup are a starting point, not the answer: a hulk with
     two options and twelve rules wants its height where the rules are. The
     rows are re-cut so that the smallest text of every box would come out
     the same size - each box's natural height and its own base size are
     measured - and then correction passes move height from the row whose
     text came out largest to the one whose text is smallest, until the two
     are within a few percent. A box is scaled down as a whole, so the base
     size is what its smallest text starts from. Rows without fitted content
     keep their height. */
  const balance = card => {
    const rows = [...card.querySelectorAll(".kfit > .k-row")]
      .filter(r => r.querySelector(".k-box > .k-bd > .fit-content"));
    if(rows.length < 2) return;
    /* The markup's own height of a fixed row is kept (data-h0) and restored,
       so that a second run cuts the rows from the designed heights again and
       not from what the first run made of them. */
    rows.forEach(r => {
      if(r.classList.contains("grow")) return;
      if(r.dataset.h0 === undefined) r.dataset.h0 = r.style.height || "";
      else r.style.height = r.dataset.h0;
    });
    /* .rstep p, .rlead, .rsz: the rule card's own text (steps, lead, the
       size write-ins) - without them a rule card's boxes would be taken for
       the 8 px default and its rows cut on a guess. */
    const TEXT = ".k-sr li,.k-opt .tx b,.k-arm td,.k-crit b,.k-hcrit b,.k-note,.k-mem div,.k-cr,.rstep p,.rlead,.rsz";
    const boxesOf = row => [...row.querySelectorAll(".k-box")].map(box => {
      const bd = box.querySelector(":scope > .k-bd");
      const content = bd && bd.querySelector(":scope > .fit-content");
      if(!content) return null;
      setScale(content, 1);
      const sizes = [...content.querySelectorAll(TEXT)].slice(0, 40)
        .map(el => parseFloat(getComputedStyle(el).fontSize));
      return { bd, content, natural: content.getBoundingClientRect().height,
               over: box.offsetHeight - roomOf(bd),
               base: sizes.length ? Math.min(...sizes) : 8, k: 1 };
    }).filter(Boolean);
    const info = rows.map(row => {
      const tallest = Math.max(...[...row.querySelectorAll(".k-box")].map(b => b.offsetHeight));
      return { row, boxes: boxesOf(row), pad: row.offsetHeight - tallest,
               designed: row.offsetHeight, fixed: !row.classList.contains("grow") };
    });
    /* Where the rules run past the weapon table, the SPECIAL RULES box takes
       width from ARMAMENT: 1.25 : 1 becomes 1 : 1.25, and long weapon names
       wrap. The rules re-flow into fewer lines; the table may grow by the
       wrapped names. Both are measured and the shift stays only if the row
       comes out shorter. */
    const grow = info.find(r => !r.fixed);
    if(grow && grow.boxes.length === 2 && grow.row.children.length === 2){
      const [arm, rules] = grow.boxes;
      /* Height the row needs per point of text size: the taller box decides. */
      const cost = boxes => Math.max(...boxes.map(b => b.natural / b.base));
      /* Not when the table carries the critical-loss boxes (space hulks):
         narrowed, its names wrap and its range cells clip, and the boxes are
         what the card is for. */
      if(rules.content.querySelector(".k-sr") && !arm.content.querySelector("td.lo") &&
         rules.natural > arm.natural * 1.15){
        const before = cost(grow.boxes);
        const kept = [grow.row.children[0].style.flex, grow.row.children[1].style.flex];
        grow.row.children[0].style.flex = "1";
        grow.row.children[1].style.flex = "1.25";
        grow.row.classList.add("narrow-arm");
        const after = boxesOf(grow.row);
        if(cost(after) < before) grow.boxes = after;
        else{
          grow.row.children[0].style.flex = kept[0];
          grow.row.children[1].style.flex = kept[1];
          grow.row.classList.remove("narrow-arm");
          grow.boxes = boxesOf(grow.row);
        }
      }
    }
    /* Height a row needs for its smallest text to be e px: each box scaled
       by e / base, never above 1. */
    const need = (r, e) => r.pad + Math.max(...r.boxes.map(b => b.over + b.natural * Math.min(1, e / b.base)));
    const total = info.reduce((a, r) => a + r.row.offsetHeight, 0);
    if(!(total > 0)) return;
    const sum = e => info.reduce((a, r) => a + need(r, e), 0);
    const top = Math.max(...info.map(r => Math.max(...r.boxes.map(b => b.base))));
    let e = top;
    if(sum(top) > total){
      let lo = 0, hi = top;
      for(let i = 0; i < 18; i++){ const mid = (lo + hi) / 2; if(sum(mid) <= total) lo = mid; else hi = mid; }
      e = lo;
    }
    /* Height nobody needs goes back towards the designed heights first
       (the option row by its count, the critical table its 27 mm), so a
       sparse card keeps the look of the rest; what is left is the grow
       row's. */
    const spare = Math.max(0, total - sum(e));
    const wants = info.map(r => r.fixed ? Math.max(0, r.designed - need(r, e)) : 0);
    const wanted = wants.reduce((a, w) => a + w, 0);
    const grant = wanted > 0 ? Math.min(1, spare / wanted) : 0;
    info.forEach((r, i) => {
      r.h = need(r, e) + wants[i] * grant;
      if(r.fixed) r.row.style.height = r.h.toFixed(2) + "px";
    });
    /* The fit, and the effective size of the row's smallest text. */
    const fitRow = r => {
      r.boxes.forEach(b => { b.k = fitInto(b.bd, b.content).k; });
      const low = r.boxes.reduce((a, b) => b.base * b.k < a.base * a.k ? b : a);
      r.eff = low.base * low.k; r.low = low;
    };
    info.forEach(fitRow);
    for(let pass = 0; pass < 6; pass++){
      const worst = info.reduce((a, r) => r.eff < a.eff ? r : a);
      const best = info.reduce((a, r) => r.eff > a.eff ? r : a);
      if(best === worst || best.eff < worst.eff * 1.04) break;
      const target = (best.eff + worst.eff) / 2;
      /* A row at full size gives its unused height; a scaled row gives the
         share its text would lose in proportion, which is an over-estimate
         once the text re-flows - the next pass sees the actual result. */
      const slackOf = r => Math.min(...r.boxes.map(b =>
        roomOf(b.bd) - b.content.getBoundingClientRect().height));
      const give = best.low.k >= .999
        ? Math.min(slackOf(best), best.low.bd.clientHeight * (1 - target / best.eff))
        : best.low.bd.clientHeight * (1 - target / best.eff);
      const take = worst.low.bd.clientHeight * (target / worst.eff - 1);
      const d = Math.floor(Math.min(give, take));
      if(d < 2) break;
      if(best.fixed) best.row.style.height = (best.row.offsetHeight - d).toFixed(2) + "px";
      if(worst.fixed) worst.row.style.height = (worst.row.offsetHeight + d).toFixed(2) + "px";
      fitRow(worst); fitRow(best);
    }

    /* Growth (v1.2; user 10-12 Oct 2026: "what if the fonts grew up to a
       point when there is room ... with many weapons as now. The same in
       special rules and options", then "a big simplification, closer to what
       is live now ... the texts a little bigger"). Only on a card where nothing had to be scaled down - a
       full card is left exactly as the passes above made it. The spare
       height of such a card used to go back to the designed heights of the
       option row and the critical table, which left the weapon table at 6 pt
       beside an empty box. Now the blocks may first grow, each to its own
       ceiling and in the order a player needs them: weapons 6 -> 9 pt, rules
       5.4 -> 7.5 pt, options -> 6.5 pt. What is still spare goes to the
       designed heights as before. The ceilings are for a card on the table
       in a dim room and ordinary eyesight; beyond them the card only gets
       louder. The critical table does not grow: its tiles wrap by width,
       and a grown table went from rows of five and four to four, four and
       one (12.10.2026). */
    const all = info.reduce((a, r) => a.concat(r.boxes), []);
    if(!all.every(b => b.k >= .999)) return;
    const CAP = { arm: 1.5, rules: 1.39, opts: 1.17 };
    const kindOf = c => c.classList.contains("k-flow") ? null
      : c.querySelector(".k-arm") ? "arm" : c.querySelector(".k-sr") ? "rules"
      : c.classList.contains("k-opt-list") ? "opts" : null;
    all.forEach(b => { b.kind = kindOf(b.content); b.g = 1; b.gmax = b.kind ? CAP[b.kind] : 1; });
    /* The weapon table has a second limit, its width. The columns are shares
       of the table, so a cell gets narrower in the layout as the block grows,
       and a name or a value cut to an ellipsis would be worse than a smaller
       one. Cell by cell: what is on one line now stays on one line (the
       whole text must fit); what wraps now may go on wrapping (its longest
       word must fit - "Thunderhawk:"); several speeds in one cell may break
       after a slash once the table has grown; the arc rosette must fit; and
       a cell that is cut already at full size allows no growth at all. The
       factor is the cell's width over the text and the padding, and the
       cell that sets it is remembered (td). */
    const widthOf = (td, css, cls) => {
      const probe = document.createElement("span");
      probe.style.cssText = "display:inline-block;visibility:hidden;position:absolute;" + css;
      if(cls) probe.className = cls;
      probe.innerHTML = td.innerHTML;
      td.appendChild(probe);
      const w = probe.offsetWidth;
      td.removeChild(probe);
      return w;
    };
    const widthLimit = content => {
      let lim = Infinity, who = null;
      const take = (v, td) => { if(v < lim){ lim = v; who = td; } };
      content.querySelectorAll("tr.w td.nm,tr.w td.rg,tr.w td.st,tr.w td.ar").forEach(td => {
        if(td.scrollWidth > td.clientWidth + 1 && !td.classList.contains("ar")){ take(1, td); return; }
        const cs = getComputedStyle(td);
        const padX = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight);
        const whole = widthOf(td, "white-space:nowrap");
        let need = whole;
        if(td.querySelector("wbr")) need = widthOf(td, "width:min-content", "fit-probe");
        else if(whole + padX > td.clientWidth + .5 && !td.classList.contains("ar")) need = widthOf(td, "width:min-content");
        if(need > 0) take(td.clientWidth / (need + padX), td);
      });
      return { lim, td: who };
    };
    const arms = all.filter(b => b.kind === "arm");
    const capWidths = () => arms.forEach(b => {
      setScale(b.content, 1);
      b.wl = widthLimit(b.content);
      b.gmax = b.wl.lim === Infinity ? CAP.arm : Math.max(1, Math.min(CAP.arm, b.wl.lim * .985));
    });
    /* a grown weapon table lets its headings wrap (CSS .fit-grow) - marked
       before anything is measured, taken back if the block does not grow */
    const mark = () => all.forEach(b => b.content.classList.toggle("fit-grow", b.gmax > 1.04));
    const hAt = (b, k) => { setScale(b.content, k); return b.content.getBoundingClientRect().height; };
    /* 1.5 px of air per row: cut to the pixel, a row came out a fraction
       short in the last fit and its block was scaled to 99 % */
    const needG = r => r.pad + Math.max(...r.boxes.map(b => b.over + hAt(b, b.g))) + 1.5;
    const sumG = () => info.reduce((a, r) => a + needG(r), 0);
    const solve = () => {
      all.forEach(b => { b.g = 1; });
      if(sumG() > total) return false;
      ["arm", "rules", "opts"].forEach(kind => {
        const bs = all.filter(b => b.kind === kind && b.gmax > 1.04);
        if(!bs.length) return;
        const put = v => bs.forEach(b => { b.g = Math.min(v, b.gmax); });
        let lo = 1, hi = Math.max(...bs.map(b => b.gmax));
        put(hi);
        if(sumG() <= total) lo = hi;
        else for(let i = 0; i < 10; i++){ const mid = (lo + hi) / 2; put(mid); if(sumG() <= total) lo = mid; else hi = mid; }
        put(lo < 1.04 ? 1 : lo);
      });
      return true;
    };
    capWidths();
    mark();
    let solved = all.some(b => b.gmax > 1.04) && solve();
    /* Abbreviation (user 12.10.2026: "if an armament name is super long, the
       longest ones that lock the left/right space, abbreviate the longest so
       they are as long as the others"). When the weapon table stopped at its WIDTH, short of
       its ceiling, and the cell that stopped it is a name, that name is the
       longest of the table: the word that makes it long is abbreviated - in
       every row of the table, so one card does not say both Starboard and
       Stbd - and the table is measured again. "Starboard" is nine letters
       against Port's four and is the usual culprit. A step that buys no
       growth (the height was the real limit) is taken back. The full name
       stays in data-full, and a full card is never abbreviated. */
    const ABBR = [["\\bStarboard\\b", "Stbd"], ["\\bbombardment\\b", "bombard."], ["\\bbattery\\b", "batt."]];
    for(let round = 0; solved && round < ABBR.length + 1; round++){
      const b = arms.find(x => x.gmax < CAP.arm - .005 && x.g >= x.gmax - .005 && x.wl.td);
      if(!b) break;
      const td0 = b.wl.td, before = b.g, undo = [];
      if(td0.classList.contains("nm")){
        const n0 = nameNode(td0);
        const step = n0 && ABBR.find(x => new RegExp(x[0], "i").test(n0.nodeValue));
        if(!step) break;
        b.content.querySelectorAll("tr.w td.nm").forEach(td => {
          const n = nameNode(td);
          if(!n) return;
          const next = n.nodeValue.replace(new RegExp(step[0], "gi"),
            m => m.charAt(0) === m.charAt(0).toUpperCase() ? step[1] : step[1].toLowerCase());
          if(next === n.nodeValue) return;
          const was = [n.nodeValue, td.dataset.full, td.dataset.abbr];
          undo.push(() => {
            n.nodeValue = was[0];
            if(was[1] === undefined) delete td.dataset.full; else td.dataset.full = was[1];
            if(was[2] === undefined) delete td.dataset.abbr; else td.dataset.abbr = was[2];
          });
          if(td.dataset.full === undefined) td.dataset.full = n.nodeValue;
          n.nodeValue = next;
          td.dataset.abbr = next;
        });
      }else if(td0.classList.contains("rg") && td0.querySelector(".rp.l:not(.t)")){
        /* the same for a span of ranges: "30-150" is set tighter where it,
           and not a name, is what the table stopped at */
        b.content.querySelectorAll(".rp.l:not(.t)").forEach(e => { e.classList.add("t"); undo.push(() => e.classList.remove("t")); });
      }else break;
      capWidths(); mark();
      solved = solve();
      if(!solved || b.g < before + .02){
        undo.forEach(f => f());
        capWidths(); mark();
        solved = solve();
        break;
      }
    }
    if(solved){
      const spareG = Math.max(0, total - sumG());
      const wantsG = info.map(r => r.fixed ? Math.max(0, r.designed - needG(r)) : 0);
      const wantedG = wantsG.reduce((a, w) => a + w, 0);
      const grantG = wantedG > 0 ? Math.min(1, spareG / wantedG) : 0;
      info.forEach((r, i) => { if(r.fixed) r.row.style.height = (needG(r) + wantsG[i] * grantG).toFixed(2) + "px"; });
    }else all.forEach(b => { b.g = 1; });
    /* the scale itself is set by the last pass below, which fits every block
       into its box once more; here only the ceiling it may grow to */
    all.forEach(b => {
      setScale(b.content, 1);
      delete b.content.dataset.growBy;
      if(b.g > 1.001){
        b.content.dataset.growMax = b.g.toFixed(4);
        /* for whoever reads the page source: which cell set the width limit */
        if(b.wl && b.wl.td) b.content.dataset.growBy = b.wl.lim.toFixed(3) + " " + b.wl.td.className + " " +
          b.wl.td.textContent.replace(/\s+/g, " ").trim().slice(0, 28);
      }else b.content.classList.remove("fit-grow");
    });
  };

  /* An over-long cell is shrunk rather than clipped. In the name column that
     covers the whole name; in the wrapping columns only a word that is wider
     than the column on its own - wrapping cannot break inside a word. Floor
     0.8: smaller than that would be as lost on the card as an ellipsis.
     Reading and writing are separated so that each cell does not force its
     own reflow. */
  const cells = [...sheet.querySelectorAll(".k-arm td.nm,.k-arm td.rg,.k-arm td.st")];
  cells.forEach(td => { td.style.fontSize = ""; });
  cells.filter(td => td.scrollWidth > td.clientWidth).forEach(td => {
    const base = parseFloat(getComputedStyle(td).fontSize);
    /* The name column is the row's main heading and keeps the 0.8 floor.
       Range and Str are secondary, and they hold single words wider than the
       column on their own ("Thunderhawks:"); those are allowed 0.72, which is
       still 6.5 pt in a 150 % print. */
    const floor = td.classList.contains("nm") ? .8 : .72;
    let px = base, guard = 0;
    while(td.scrollWidth > td.clientWidth && guard < 24 && px > base * floor){
      px *= .98; td.style.fontSize = px.toFixed(3) + "px"; guard++;
    }
    /* One extra step as rounding headroom: scrollWidth is an integer, so the
       loop stops while there is still under a pixel of overflow - and that is
       exactly what leaves the ellipsis visible. */
    if(guard){ px *= .98; td.style.fontSize = px.toFixed(3) + "px"; }
  });

  sheet.querySelectorAll(".k").forEach(card => {
    card.dataset.contentOverflow = "false";
    balance(card);
  });
  /* Star fort plan card: the column beside the plan is cut between its
     boxes by what each one holds - its content's natural height plus the
     box's own frame - so that they all come out at the same scale. Equal
     shares left the firing sectors at half size beside a half-empty
     re-roll box. The plan itself is fixed geometry and is not re-cut. */
  sheet.querySelectorAll(".k .fcol").forEach(col => {
    [...col.children].forEach(box => {
      const bd = box.querySelector(":scope > .k-bd");
      const content = bd && bd.querySelector(":scope > .fit-content");
      if(!content) return;
      setScale(content, 1);
      const need = content.getBoundingClientRect().height + (box.offsetHeight - roomOf(bd));
      box.style.flex = Math.max(1, need).toFixed(1) + " 1 0px";
    });
  });
  sheet.querySelectorAll(".k-box > .k-bd > .fit-content").forEach(content => {
    const result = fitInto(content.parentElement, content, parseFloat(content.dataset.growMax || "1"));
    if(result.k <= 1.001) content.classList.remove("fit-grow");
    const card = content.closest(".k");
    if(content.classList.contains("k-opt-list")) card.dataset.optionScale = result.k.toFixed(4);
    if(result.overflow) card.dataset.contentOverflow = "true";
  });

  /* A long name must not end in an ellipsis: only the title is shrunk until
     it fits. */
  sheet.querySelectorAll(".k-hd h3").forEach(title => {
    let px = parseFloat(getComputedStyle(title).fontSize), guard = 0;
    while(title.scrollWidth > title.clientWidth && guard < 160){
      px *= .96; title.style.fontSize = px.toFixed(3) + "px"; guard++;
    }
  });

  sheet.querySelectorAll(".k > .kfit").forEach(fit => {
    const room = fit.parentElement.clientHeight;
    let k = 1, guard = 0;
    while(fit.scrollHeight * k > room + .5 && guard < 240){
      k *= .96;
      fit.style.transform = "scale(" + k.toFixed(4) + ")";
      fit.style.width = (100 / k).toFixed(2) + "%";
      guard++;
    }
    fit.parentElement.dataset.cardScale = k.toFixed(4);
    if(fit.scrollHeight * k > room + .5)
      fit.parentElement.dataset.contentOverflow = "true";
  });
  sheet.setAttribute("style", prev);
}

