import { BATTLES, RAIDS, RATINGS, SC, TRUST, v0, val } from "./data.js";
import { esc, fmt, seg } from "./helpers.js";
import { cols, layout } from "./layout.js";
import { fitOf } from "./maps.js";
import { verdict } from "./scenario-page.js";
import { prep, wins } from "./state.js";
import { tableWH } from "./table.js";
import { CL_GRPS, FAN_GRPS, SIZES, WR_GRPS, app, nav, secOf, sizeOk } from "./views.js";

/* ---------------------------------------------------------------- before the battle */
/* the scenario pool for rolling from the whole library */
export const POOL_SRC = [["core", "Core 10"], ["campaign", "Books"], ["classic", "Classic GW"], ["wr", "Warp Rift"], ["fan", "Fan supplements"]];
export function srcOf(sc) { return sc.grp === "core" ? "core" : sc.grp === "campaign" || sc.grp === "fleets" ? "campaign" : CL_GRPS.includes(sc.grp) ? "classic" : FAN_GRPS.includes(sc.grp) ? "fan" : secOf(sc); }
export function fitsTable(sc) {
  const [W, H] = tableWH(), vs = sc.variants ? sc.variants.map(x => x[0]) : ["std"];
  return vs.some(v => { const f = fitOf(sc, v); return W >= f[0] && H >= f[1]; });
}
export function poolFiltered(p) {
  /* p.src.wr === false comes from 0.6's saves (one Warp Rift button): it means every WR scenario */
  return SC.filter(sc => !(p.src && (p.src[srcOf(sc)] === false || (p.src.wr === false && WR_GRPS.includes(sc.grp)))) && !(p.bookOnly && sc.book !== "K") && !(p.fits && !fitsTable(sc)) && sizeOk(sc, p.size) && (sc.suggest ? ![p.sug, p.sug2].some(g => g && !sc.suggest.includes(g)) : !(p.noany && (p.sug || p.sug2))));
}
export function poolEligible(p) { return poolFiltered(p).filter(sc => !(p.excl && p.excl[sc.id])); }
export function rollPool(p) {
  const el = poolEligible(p), choices = el.length > 1 ? el.filter(sc => sc.id !== p.lpick) : el;
  if (!choices.length) { p.lpick = ""; return; }
  const u = new Uint32Array(1); crypto.getRandomValues(u);
  p.lpick = choices[u[0] % choices.length].id;
}
export function scCard(id, badge) {
  const sc = SC.find(x => x.id === id);
  return "<a class='card' href='#/s/" + id + "/setup' style='margin:0'><div class='card-t'><h3>" + esc(sc.name) + "</h3><span class='badge t-" + sc.trust + "'>" + esc(badge || TRUST[sc.trust].l) + "</span></div>" +
    "<div class='series'>" + esc(sc.series) + "</div><p class='pitch' style='margin-bottom:0'>" + esc(val(sc.pitch, v0(sc))) + " <b>Open ›</b></p></a>";
}

export function renderPrep() {
  nav.innerHTML = "<a class='back' href='#/'>‹ Scenarios</a>";
  document.title = "Before the battle · Scenario Library";
  const p = prep();
  let h = "<div class='shead'><div class='series'>Rulebook p. 120–127</div><h1>Before the battle</h1></div>";
  let left = "", right = "";
  left += "<h2>Order of play</h2><ol class='plain'>" + ["Pick the scenario: agree, roll it, or use attack ratings (below).", "Decide attacker and defender: agree, roll, or use attack ratings. If attack ratings chose the scenario, the chooser attacks.", "Choose forces as the scenario says.", "Set up the battlezone and celestial phenomena (RB p. 104–113).", "Roll Leadership for ships and squadrons.", "Declare capital ship squadrons; assign fleet commanders to their ships.", "Deploy as the scenario says.", "Find out who has the first turn.", "Fight!"].map(x => "<li>" + fmt(x) + "</li>").join("") + "</ol>";

  /* three ways to pick the scenario (RB p. 120) */
  left += "<h2>Pick the scenario</h2><p class='small muted' style='margin:0 0 8px'>The rulebook gives three ways — use any one of them (RB p. 120):</p>" +
    "<ol class='plain ways'><li><b>Agree.</b> Pick one together, for the ships you have, the time you have, or just because it is your favourite. <a href='#/'>Browse the scenarios</a>.</li>" +
    "<li><b>Roll it.</b> On the rulebook’s D6 tables, or — not in the book — from this whole library with filters (B below).</li>" +
    "<li><b>Attack ratings.</b> Both roll their fleet’s attack dice; the winner is the attacker and chooses the scenario. A tie: roll it instead (C below).</li></ol>";

  /* random scenario */
  const typ = p.typ || "", face = p.face || 0, tbl = typ === "raid" ? RAIDS : typ === "battle" ? BATTLES : null;
  const hit = tbl && face ? tbl.find(r => face >= r[0] && face <= r[1]) : null;
  const lib = p.bmode === "lib";
  right += "<h3 class='wayh'>B · Roll it</h3><div class='wg'><div class='rollrow'>" + seg("pbm", "bmode", ["book", "lib"], lib ? "lib" : "book", ["Rulebook tables", "Whole library"]) + "</div>";
  if (!lib) {
    right += "<div class='sub'>The rulebook’s own tables (RB p. 120). D6: 1–3 a raid, 4–6 a battle — or just pick one. Then a D6 on that table.</div>" +
      "<div class='rollrow'>" + seg("ptyp", "typ", ["raid", "battle"], typ, ["Raid", "Battle"]) + "<button class='btn" + (hit ? "" : " primary") + "' data-a='proll'>" + (hit ? "Reroll" : "Roll both") + "</button></div>" +
      "<div class='faces'>" + [1, 2, 3, 4, 5, 6].map(n => "<button class='face' data-a='pface' data-f='" + n + "' aria-pressed='" + (face === n) + "'>" + n + "</button>").join("") + "</div>" +
      (hit ? scCard(hit[2], typ === "raid" ? "Raid" : "Battle") : "<p class='calc'>Pick raid or battle and a die.</p>") +
      "<table class='ltab' style='margin-top:8px'>" + [["Raids", RAIDS], ["Battles", BATTLES]].map(([n, t]) => "<tr><td colspan='2'><b>" + n + "</b></td></tr>" + t.map(r => "<tr" + (hit && t === tbl && r === hit ? " class='hit'" : "") + "><td>" + (r[0] === r[1] ? r[0] : r[0] + "–" + r[1]) + "</td><td>" + esc(SC.find(s => s.id === r[2]).name) + "</td></tr>").join("")).join("") + "</table>";
  } else {
    if (p.src && p.src.wr === false) { ["wro", "played", "untested"].forEach(k => { p.src[k] = false; }); delete p.src.wr; }
    const [W, H] = tableWH(), fl = poolFiltered(p), el = poolEligible(p);
    const facs = [...new Set(SC.flatMap(x => x.suggest || []))].sort();
    right += "<div class='sub'>Every scenario in this app is equally likely. Narrow the pool, or tap a scenario below to leave it out.</div>" +
      "<div class='poolf'><div class='filters' role='group' aria-label='Sources'>" + POOL_SRC.map(([k, l]) => "<button class='fbtn' data-a='psrc' data-k='" + k + "' aria-pressed='" + !(p.src && p.src[k] === false) + "'>" + l + " <span class='n'>" + SC.filter(x => srcOf(x) === k).length + "</span></button>").join("") + "</div>" +
      "<div class='filters' role='group' aria-label='Filters'><button class='fbtn' data-a='pbook' aria-pressed='" + !!p.bookOnly + "'>Book rules only</button>" +
      "<button class='fbtn' data-a='pfits' aria-pressed='" + !!p.fits + "'>Fits my table (" + W + " × " + H + ")</button></div>" +
      "<div class='filters' role='group' aria-label='Size'>" + SIZES.map(([k, l]) => "<button class='fbtn' data-a='psize' data-k='" + k + "' aria-pressed='" + (p.size === k) + "'>" + l + "</button>").join("") + "</div>" +
      "<div class='tblctl'><select data-a='psug' aria-label='Suggested for'><option value=''>Suggested for: any fleet</option>" + facs.map(f => "<option value='" + esc(f) + "'" + (p.sug === f ? " selected" : "") + ">Suggested for: " + esc(f) + "</option>").join("") + "</select>" +
      "<select data-a='psug2' aria-label='Against'><option value=''>vs any fleet</option>" + facs.map(f => "<option value='" + esc(f) + "'" + (p.sug2 === f ? " selected" : "") + ">vs " + esc(f) + "</option>").join("") + "</select>" +
      (p.sug || p.sug2 ? "<button class='fbtn' data-a='pnoany' aria-pressed='" + !!p.noany + "'>Ignore any fleets</button>" : "") + "</div></div>" +
      "<div class='poolhead'>Pool: <b>" + el.length + "</b> of " + SC.length + (fl.length > el.length ? " · " + (fl.length - el.length) + " left out" : "") + "</div>" +
      "<div class='poolchips'>" + fl.map(x => "<button class='pchip' data-a='pex' data-id='" + x.id + "' aria-pressed='" + !(p.excl && p.excl[x.id]) + "'>" + esc(x.name) + "</button>").join("") + "</div>" +
      "<div class='rollrow' style='margin-top:10px'><button class='btn primary' data-a='plroll'" + (el.length ? "" : " disabled") + ">" + (p.lpick ? "Reroll" : "Roll a scenario") + "</button>" +
      (p.lpick ? "<button class='btn' data-a='plclr'>Clear</button>" : "") + "</div>" +
      (p.lpick && SC.some(x => x.id === p.lpick) ? scCard(p.lpick) : el.length ? "" : "<p class='calc'>Nothing in the pool — loosen the filters.</p>");
  }
  right += "</div>";

  /* attack ratings */
  const r1 = p.r1 || 2, r2 = p.r2 || 2, mode = p.rmode || "pick";
  let out = "<p class='calc'>Each player rolls as many D6 as their fleet’s attack rating; only the best single die counts.</p>";
  if (p.d1 && p.d2) {
    const b1 = Math.max(...p.d1), b2 = Math.max(...p.d2), w = b1 > b2 ? "Player 1" : b2 > b1 ? "Player 2" : "";
    const text = !w ? (mode === "pick" ? "Tie — nobody chooses: roll the scenario at random (B above)." : "Tie — roll again, or agree who attacks.")
      : mode === "pick" ? w + " wins: they are the attacker and choose which scenario to play." : w + " wins: they are the attacker in the scenario you already picked.";
    out = "<p class='calc'>Player 1: " + p.d1.join(", ") + " → best <b>" + b1 + "</b> · Player 2: " + p.d2.join(", ") + " → best <b>" + b2 + "</b></p>" +
      "<div class='verdict " + (b1 > b2 ? "a" : b2 > b1 ? "b" : "draw") + "' style='margin:8px 0 0'>" + esc(text) + "</div>" +
      (w && mode === "pick" ? "<div class='sub' style='margin-top:8px'>" + (p.bmode === "lib" ? "Choose from your pool:" : "Choose any scenario, for example:") + "</div><div class='poolchips'>" +
        (p.bmode === "lib" ? poolEligible(p) : SC.filter(x => x.grp === "core")).map(x => "<a class='pchip' href='#/s/" + x.id + "/setup'>" + esc(x.name) + "</a>").join("") + "</div>" : "");
  }
  right += "<h3 class='wayh'>C · Attack ratings</h3><div class='wg'><div class='minis'><div><label>What is the roll for?</label>" + seg("prat", "rmode", ["pick", "atk"], mode, ["Choose the scenario", "Only who attacks"]) + "</div></div>" +
    "<p class='small muted' style='margin:0 0 8px'>" + (mode === "pick" ? "The winner attacks and chooses the scenario (RB p. 120)." : "The scenario is already agreed or rolled; the roll only decides who attacks (RB p. 121).") + "</p>" +
    "<div class='minis'><div><label class='sa'>Player 1 attack rating</label>" + seg("prat", "r1", [1, 2, 3, 4], r1) + "</div><div><label class='sb'>Player 2 attack rating</label>" + seg("prat", "r2", [1, 2, 3, 4], r2) + "</div></div>" +
    "<div class='rollrow'><button class='btn primary' data-a='pratroll'>Roll attack dice</button></div>" + out +
    "<p class='small muted' style='margin:10px 0 0'>Rulebook ratings: " + RATINGS.map(([n, r]) => esc(n) + " " + r).join(" · ") + ". Other fleet lists give their own rating in Fleets v0.40.</p></div>";

  const spH = "<h2>Sub-plots</h2><p class='small muted'>Roll and browse them on the <a href='#/subplots'>Sub-plots</a> page, or in a scenario’s own Sub-plots tab, where their preparations, reminders, turn effects and result show up in the scenario (RB p. 124–127).</p>";
  /* the fleets' scenario rules at a glance (0.14): to support the choice and the attacker's decision */
  const flH = "<h2>Fleet rules for scenarios</h2><p class='small muted' style='margin:0 0 8px'>What the Fleets book changes when a fleet plays the scenarios. Each scenario’s Set-up tab shows the same rules for the fleets you choose there.</p>" +
    [...new Set(FLEET_RULES.map(r => r.f))].map(f => { const rs = FLEET_RULES.filter(r => r.f === f && !r.ok);
      return "<details class='fixed'><summary>" + esc(f) + " <span class='muted'>(" + rs.length + ")</span></summary><ul class='flother'>" + rs.map(r => "<li><b>" + (r.sc === "*" ? "Any scenario" : r.sc.map(id => { const x = SC.find(s => s.id === id); return x ? "<a href='#/s/" + id + "/setup'>" + esc(x.name) + "</a>" : ""; }).join(", ")) + "</b>: " + fmt(r.t) + " <span class='pg'>" + esc(r.p) + "</span></li>").join("") + "</ul></details>"; }).join("");
  app.innerHTML = h + (layout() === "narrow" ? left + right + spH + flH : cols([[left, spH, flH], [right]], "c-prep even"));
}
