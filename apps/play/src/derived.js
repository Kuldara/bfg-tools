import { appState } from "./state.js";
import { wepClass } from "./setup.js";
import { OPT } from "./storage.js";
import { MID, TIMES } from "./helpers.js";
import { groupUnits } from "./actions.js";
import { fleetRR } from "./render.js";
import { arcGlyph, esc, shortArmour, shortRange, title } from "../../../packages/ui/format.js";
import PLAY from "../rules.js";

/* ============================================================ DERIVED ===== */
export function baseName(i){
  const R = appState.U[i].R;
  if(R.name) return R.name;
  const t = title(R.className || (R.entry && R.entry.label) || "");
  /* unnamed commanders of one kind are numbered as in the builder:
     Ork Warlord 1, 2 and 3 (J233) */
  if(R.kind === "commander"){
    const same = appState.U.map((x, k) => x.R.kind === "commander" && !x.R.name &&
      String(x.R.entry && x.R.entry.label) === String(R.entry && R.entry.label) ? k : -1).filter(k => k >= 0);
    if(same.length > 1) return t + " " + (same.indexOf(i) + 1);
  }
  return t;
}
/* a name the player gave the ship at the set-up (user 19.10.2026: "you can
   also still write new names for the ships") is this game's: G.nm, by row */
export function unitName(i){ const n = appState.G && appState.G.nm && appState.G.nm[i]; return n || baseName(i); }
export function classTag(R){
  const t = String(R.stats ? R.stats.type : "");
  if(/grand/i.test(t)) return "GC";
  if(/battleship/i.test(t)) return "BB";
  if(/cruiser/i.test(t)) return "CR";
  if(/escort/i.test(t)) return "ESC";
  if(/defence/i.test(t)) return "DEF";
  if(/ground/i.test(t)) return "GND";
  return t.slice(0, 3).toUpperCase() || "?";
}
/* What the members of a member-model unit are called: ships for escorts,
   units for platforms, silos and air bases ("grouped in up to six units",
   Rulebook p. 100). */
export function memberWord(R, n){ return /escort/i.test(String(R.stats.type || "")) ? (n === 1 ? "ship" : "ships") : (n === 1 ? "unit" : "units"); }
export function crippledNow(R, st){
  const v = PLAY.view(R, st, appState.G.fleet);
  const note = String(R.damage.note || "").replace(/^crippled:\s*/i, "").replace(/\s*no nova cannon\.?$/i, "");
  const now = [];
  /* a unit that does not move has no speed to lose (Rulebook p. 100-101) */
  if(v.still){ /* nothing */ }
  else if(v.speed.now != null) now.push("speed " + v.speed.now + " cm");
  else if(v.speed.mods.length) now.push("speed " + v.speed.text + " " + v.speed.mods.map(m => m.v).join(""));
  if(v.shields.now != null) now.push("shields " + v.shields.now);
  if(v.turrets.now != null) now.push("turrets " + v.turrets.now);
  /* a star fort: the crippled quadrant's own weapons and bays, never the
     Basilica's (Fleets p. 501) */
  if(v.fort) return "now " + now.join(", ") + " " + MID + " its own weapons and launch bays halved, the Basilica's not";
  const nova = (R.weapons || []).some(w => w.state !== "offered" && /nova cannon/i.test(w.a[0]));
  return (now.length ? "now " + now.join(", ") + " " + MID + " " : "") + note + (nova ? " No nova cannon." : "");
}
export const ARM_CLS = { WB: "w-wb", LAN: "w-lan", NOVA: "w-nov", BOMB: "w-nov", TORP: "w-tor", BAYS: "w-bay", HOOK: "w-hook", MINES: "w-min", PULSE: "w-pul", RAM: "w-ram" };
/* The row's armament line: current strengths by weapon group, in the
   card's colours, a silenced row struck through. */




export function ldTile(i, extraCls, short){
  const grp = appState.G.grp[i];
  const ms = grp ? groupUnits(grp) : [i];
  const l = grp ? PLAY.squadronLd(ms.map(j => ({ R: appState.U[j].R, st: appState.G.st[j] })), appState.G.fleet) : PLAY.leadership(appState.U[i].R, appState.G.st[i], appState.G.fleet);
  /* a squadron's tile edits the ship whose Leadership it shows (p. 95) */
  const who = grp && l.idx != null ? ms[l.idx] : i;
  const st = appState.G.st[who];
  const mods = l.mods.map(m => (m.v > 0 ? "+" : "") + m.v + " " + m.t.split(" ")[0]).join(" ");
  /* short (the compact row): the big number is the value; the line under
     it keeps only what qualifies it - "Ld 10 cmdr" cut to "Ld 10 cm..."
     read as centimetres (19.10.2026) */
  const qual = st.ldFrom === "commander" ? "cmdr" : st.ldFrom === "fixed" ? "fixed" : "";
  const sub = l.now == null ? "set Ld" : (mods || (short && qual ? qual : "Ld " + l.base + (qual ? " " + qual : "")));
  return `<button class="ldt ${l.now == null ? "na" : ""} ${extraCls || ""}" data-act="pop" data-i="${who}" data-arg="ld" aria-label="Leadership">
    <b>${l.now == null ? "?" : l.now}</b><small>${sub}</small></button>`;
}


export function ordChip(st){
  if(st.order === "BFI" || st.braceTurn) return `<span class="chip br">BRACED</span>`;
  if(st.order) return `<span class="chip ord">${esc(PLAY.ORDER_BY[st.order].name)}</span>`;
  return "";
}
export function ordnancePills(i, v){
  const st = appState.G.st[i];
  const has = { torp: v.arms.some(a => a.torp), bays: v.arms.some(a => a.bays) };
  let s = "";
  if(has.torp) s += `<button class="stat pill2 ${st.torps ? "on" : "spent"}" data-act="torps" data-i="${i}">TORP <b>${st.torps ? "loaded" : "fired"}</b></button>`;
  if(has.bays) s += `<button class="stat pill2 ${st.craft ? "on" : "spent"}" data-act="craft" data-i="${i}">AC <b>${st.craft ? "ready" : "launched"}</b></button>`;
  return s;
}
export function renderFleetPop(){
  const fl = appState.G.fleet;
  const frr = fleetRR(), C = appState.G.cmd != null ? appState.U[appState.G.cmd].R : null;
  /* whose they are and what the price included, then the rule */
  const rrHead = frr ? "Fleet re-rolls" : fl.rerollsPerTurn ? "Fleet Commander re-rolls " + MID + " per turn" : "Fleet Commander re-rolls";
  const rrOwn = frr ? "The fleet's own: " + esc(frr.text) + " (Fleets p. " + frr.page + ")."
    : C && C.rerolls && C.rerolls.text ? esc(unitName(appState.G.cmd)) + ": " + esc(C.rerolls.text) + "." : "";
  const rrRule = frr ? esc(frr.how || "") + " One re-roll per check at most (p. 48)."
    : fl.rerollsPerTurn ? "One re-roll per check at most (p. 48). It is one per turn (Fleets p. 231), and the enemy's turn is a turn too: " +
        (OPT.orders ? "the box comes back at the start of yours and of the enemy's." : "the box comes back at NEW TURN - tap it back yourself when the enemy's turn starts.") +
        " Lost for the battle if the flagship's bridge is smashed (p. 67)."
    : "One re-roll per check at most; lost for the battle if the flagship's bridge is smashed (p. 48, 67).";
  if(appState.V.pop.kind === "rr") return `<div class="pop"><h4>${rrHead}</h4><p>${rrOwn ? `<b>${rrOwn}</b> ` : ""}${rrRule}</p>
    <div class="steprow"><button data-act="rr" data-i="-1" data-arg="-1" ${fl.rerollsLost ? "disabled" : ""}>&minus;</button><div class="val">${fl.rerolls | 0}<small>${fl.rerollsLost ? "lost: flagship bridge smashed (p. 67)" : "left"}</small></div><button data-act="rr" data-i="-1" data-arg="1" ${fl.rerollsLost ? "disabled" : ""}>+</button></div>
    <button class="close" data-act="closepop">close</button></div>`;
  if(appState.V.pop.kind === "ac") return `<div class="pop"><h4>Attack craft in play</h4><p>No more attack craft markers in play than surviving launch bays, fleet-wide; crippled carriers count half (p. 73).</p>
    <div class="steprow"><button data-act="ac" data-i="-1" data-arg="-1">&minus;</button><div class="val">${appState.G.ac | 0}<small>markers on the table</small></div><button data-act="ac" data-i="-1" data-arg="1">+</button></div>
    <button class="close" data-act="closepop">close</button></div>`;
  return "";
}
export function critChips(R, st, i){
  const rows = (R.damage && R.damage.critical && R.damage.critical.rows) || [];
  return PLAY.activeCrits(st, R).map(c => {
    const row = rows.find(r => String(r[0]) === c.key);
    const nm = row ? row[1] : (c.def ? c.def.name : c.key);
    const fire = PLAY.standardCrits(R) && c.key === "7";
    /* An unrepaired fire costs a hit each in the End Phase (p. 67): the
       chip is the button that adds them. */
    if(fire && !PLAY.destroyed(R, st)) return `<button class="chip crit fire" data-act="fire" data-i="${i}" title="End Phase: one hit per unrepaired fire (p. 67)">${esc(String(nm).split(/\s+\+/)[0])}${c.count > 1 ? " " + TIMES + c.count : ""} ${MID} +${c.count} hit${c.count > 1 ? "s" : ""}</button>`;
    return `<span class="chip crit">${esc(String(nm).split(/\s+\+/)[0])}${c.count > 1 ? " " + TIMES + c.count : ""}</span>`;
  }).join("");
}

/* The spec line under the name: the profile as it stands now, a value a
   critical or crippling changed marked in the crippled colour. */
export function statsLine(v, R, esq){
  const sp = v.speed.now != null ? v.speed.now + " cm" : v.speed.text + (v.speed.mods.length ? " " + v.speed.mods.map(m => m.v).join("") : "");
  /* a unit that does not move (Rulebook p. 100) has one word where a ship
     has its speed and turns */
  const parts = (v.still ? [["", "STATIONARY", false]] : [
    ["SPD", sp, v.speed.mods.length > 0],
    [v.turns.none ? "TURNS" : "", v.turns.none ? "NONE" : v.turns.text, v.turns.none]]).concat([
    ["SH", v.shields.now == null ? v.shields.text : v.shields.now, v.shields.now != null && v.shields.now !== v.shields.base],
    ["ARM", shortArmour(R.stats.armour), false],
    [/spore/i.test(R.stats.turretLabel || "") ? "SPORES" : "T", v.turrets.now == null ? v.turrets.text : v.turrets.now, v.turrets.now != null && v.turrets.now !== v.turrets.base],
  ]);
  if(esq) parts.push(["HITS", R.stats.hits + " each", false]);
  return `<div class="stl">${parts.map(x => `<span class="${x[2] ? "mod" : ""}">${x[0] ? x[0] + " " : ""}<b>${esc(String(x[1]))}</b></span>`).join(`<em>${MID}</em>`)}</div>`;
}
/* The armament as a table: badge, name, range, strength, the halved value
   (crippled p. 65, braced p. 47, All Ahead Full etc. p. 46 - whichever the
   table says applies), arc. A location knocked out by a critical (p. 67)
   is struck through. Escort squadrons show the per-ship value, the
   squadron total (p. 99) and half of the total. */
/* The range column: the builder's shortRange collapses "Furies: 30 cm /
   Starhawks: 20 cm" to "30/20"; a single craft label ("Thunderhawk: 20 cm")
   keeps only its number too - the craft is in the rules text. */
export function rangeText(t){
  const r = shortRange(t);
  const m = String(r).match(/(\d+)\s*cm/);
  return /:/.test(r) && m ? m[1] : r;
}
/* The printed card's own rows (v1.2): the same filter and order as the
   rules layer's armament and escortFire, so row k of the table is row k
   here - and with it the card's range band (domain.js rangeCell, J183) and
   port / starboard pair (domain.js pairRows, J188). The page computes
   neither itself: it reads what the card prints. */
export function cardRows(R){ return (R.weapons || []).filter(w => w.state !== "offered"); }
/* Which rows are a pair right now: the card's pair, held only while both
   sides are the same in play - neither silenced, the same value now. A
   critical on one side (p. 67) parts it, so the struck-through row shows
   which side. 1 = upper row, 2 = lower, 0 = no pair. */
export function livePairs(R, rows, esq){
  if(esq) return rows.map(() => 0);
  const ws = cardRows(R);
  const same = (p, q) => !p.silent && !q.silent && String(p.now) === String(q.now) && String(p.strength) === String(q.strength) && String(p.range) === String(q.range);
  return rows.map((a, k) => {
    const w = ws[k];
    if(!w || !w.pair) return 0;
    const m = w.pair === 1 ? k + 1 : k - 1, wm = ws[m];
    if(!wm || wm.pair !== 3 - w.pair || !rows[m]) return 0;
    return same(a, rows[m]) ? w.pair : 0;
  });
}
/* The range as the card prints it (J183): one value in a frame of its
   band's colour - 15, 30, 45, 60 cm and beyond - the unit in the heading;
   a cell that is not one range (a launch bay's craft speeds, "Contact")
   stays text. */
export function rangeHTML(R, a, k, cls){
  const rc = cardRows(R)[k] && cardRows(R)[k].range;
  if(rc) return `<span class="${cls}${rc.label.length > 3 ? " l" : ""}" style="--rb:${rc.color}">${esc(rc.label)}</span>`;
  return esc(String(rangeText(a.range)).replace(/\s*cm\b/g, ""));
}
/* The compact row's armament: one chip per row of the table - the badge,
   the strength in force now (halved when crippled or braced, struck through
   when silenced), the range in its band's colour and the arc; a live pair
   is one chip with both arcs. The names are on the card. */
export function weaponsLine(R, st, esq){
  const v = PLAY.view(R, st, appState.G.fleet);
  const rows = esq ? PLAY.escortFire(R, st) : v.arms;
  if(!rows.length) return `<p class="noarm">No armament</p>`;
  const pairs = livePairs(R, rows, esq);
  const cr = !esq && (v.crippled || (OPT.orders && (v.braced || (v.order && v.order.arm < 1))));
  return `<div class="wline">${rows.map((a, k) => {
    if(pairs[k] === 2) return "";
    const ps = pairs[k] === 1;
    const [letter, badge] = wepClass(a.name);
    const n = PLAY.num(a.strength), alive = esq ? a.ships : 1;
    const val = n == null ? String(a.strength).replace(/\s*squadrons?$/i, "") : esq ? n * alive : (cr && PLAY.num(a.now) != null ? PLAY.num(a.now) : n);
    const glyph = ps ? arcGlyph("left right").replace(/class="pick"/g, 'class="on"') : arcGlyph(a.arc);
    const title = ps ? a.name + " / " + rows[k + 1].name + ", each" : a.name;
    return `<span class="wc${!esq && a.silent ? " off" : ""}${cr && n != null && !a.whole ? " half" : ""}" title="${esc(title)}"><i style="--bd:${badge}">${letter}</i><b>${esc(String(val))}</b>${rangeHTML(R, a, k, "rpc")}${glyph}</span>`;
  }).join("")}</div>`;
}
/* The armament as a table, drawn the way the printed card is (v1.2): a
   pair of port / starboard rows keeps both names and both arcs and shares
   one tall badge, one range and one strength with "each" under it (the
   user's choice C, 12.10.2026 - one merged row was turned down as busy); a
   range in its band's frame. Then the play page's own: the halved value
   (crippled p. 65, braced p. 47, All Ahead Full etc. p. 46 - whichever the
   table says applies), a location knocked out by a critical (p. 67) struck
   through, an escort squadron's per-ship value, total (p. 99) and half. */
export function weaponsTable(R, st, esq){
  const v = PLAY.view(R, st, appState.G.fleet);
  const rows = esq ? PLAY.escortFire(R, st) : v.arms;
  /* a fire ship has no armament at all (Fleets p. 516): say so rather
     than show an empty table */
  if(!rows.length) return `<p class="noarm">No armament</p>`;
  /* "now" when something halves the armament: crippled always; an order
     or brace only when the page tracks them */
  const cr = v.crippled || (OPT.orders && !esq && (v.braced || (v.order && v.order.arm < 1)));
  const pairs = livePairs(R, rows, esq);
  let zone = null;
  const trs = rows.map((a, k) => {
    const [letter, badge] = wepClass(a.name);
    const n = PLAY.num(a.strength);
    const alive = esq ? a.ships : 1;
    const full = n == null ? null : n * alive;
    /* the halved value: the rules layer's own when the ship is crippled (a
       Necron Portal rounds down, Fleets p. 401), else the generic ceil */
    let half = full == null ? "" : PLAY.half(full);
    /* a star fort's Basilica row is whole while the quadrant is crippled
       (Fleets p. 501): its strength stays the value in force */
    const keep = !esq && a.whole && !(OPT.orders && (v.braced || (v.order && v.order.arm < 1)));
    if(!esq && cr && !keep && n != null && PLAY.num(a.now) != null) half = PLAY.num(a.now);
    if(!esq && cr && !keep && n == null && a.now !== a.strength) half = esc(String(a.now));
    const silent = !esq && !!a.silent;
    const txt = n == null;
    const pr = pairs[k];
    /* one heading per group: the selected quadrant's rows, the Basilica's */
    let head = "";
    if(!esq && a.zone && a.zone !== zone){
      zone = a.zone;
      head = `<tr class="zn"><td colspan="6">${a.zone === "basilica" ? "Basilica " + MID + " the whole fort's" : esc(PLAY.QUADS[v.quad]) + " quadrant"}</td></tr>`;
    }
    const cls = `${silent ? "silent" : ""}${half === "" ? " nohalf" : ""}${keep ? " keep" : ""}`.trim();
    /* the card's own shortening (v1.2 J186): a name that would wrap onto a
       second line on a phone says Stbd - the full name is the tooltip */
    const nm = String(a.name).length > 22 ? String(a.name).replace(/\bStarboard\b/, "Stbd") : String(a.name);
    const name = `<td class="nm"${nm !== a.name ? ` title="${esc(a.name)}"` : ""}>${esc(nm)}${silent ? `<small>${esc(a.silent)}</small>` : ""}</td>`;
    const arc = `<td class="ar">${arcGlyph(a.arc)}</td>`;
    /* the lower row of a pair: its name and its arc - the badge, range,
       strength and half are the upper row's, two rows high */
    if(pr === 2) return `<tr class="${cls}" data-pair="2">${name}${arc}</tr>`;
    const rs = pr === 1 ? ' rowspan="2"' : "";
    return `${head}<tr class="${cls}"${pr ? ' data-pair="1"' : ""}>
      <td class="bd"${rs}><span class="bg${pr ? " tall" : ""}" style="--bd:${badge}">${letter}</span></td>
      ${name}
      <td class="rg"${rs}>${rangeHTML(R, a, k, "rp")}</td>
      <td class="st${txt ? " txt" : ""}"${rs}>${txt ? esc(a.strength) : n}${esq && alive !== 1 ? `<small>${TIMES}${alive}${a.nocombine ? " separate" : n != null ? " = " + full : ""}</small>` : pr ? `<i class="ea">each</i>` : ""}</td>
      <td class="hf${txt ? " txt" : ""}"${rs}>${silent ? "" : half}</td>
      ${arc}</tr>`;
  }).join("");
  return `<table class="wt${cr ? " crippled" : ""}"><thead><tr><th></th><th>Armament</th><th class="rg">Range cm</th><th class="st">Str</th><th class="hf">&frac12;${cr ? "<small>now</small>" : ""}</th><th></th></tr></thead><tbody>${trs}</tbody></table>`;
}

