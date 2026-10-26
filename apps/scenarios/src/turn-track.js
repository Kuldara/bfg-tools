import { SC } from "./data.js";
import { SIDECLS, esc, fmt } from "./helpers.js";
import { get } from "./state.js";
import { spTurn } from "./subplots.js";
import { tableWH } from "./table.js";

/* ---------------------------------------------------------------- turn track
   TURNFX[id](T, st, v) lists what is special about turn T: [side or null, text].
   The Play tab shows these as a track of turns and a "this turn" list. */
export const arrivalSpan = (T, v) => {
  const rows = SC.find(s => s.id === "pelucidar").tools[0].rows(v), lo = 1 + T, hi = 6 + T;
  const hits = rows.filter(r => r[1] >= lo && r[0] <= hi).map(r => r[2]);
  return "Arrivals: D6 + " + T + " = " + lo + "–" + hi + " → " + hits.join(" · ");
};
/* 30 cm more each turn; once the distance exceeds the table's length, the whole long edge (spot check 21.10.) */
export const entryFx = T => [["a", T === 1 ? "Reinforcements: from the short edge only" : (T - 1) * 30 >= tableWH()[0] ? "Reinforcements: short edge, or anywhere along the long edges" : "Reinforcements: short edge, or up to " + (T - 1) * 30 + " cm along the long edges"]];
export const TURNFX = {
  "cruiser-clash": T => T === 8 ? [[null, "Last turn"]] : [],
  "the-bait": T => entryFx(T),
  "the-raiders": (T, st) => {
    const n = get(st, "alert", 0), o = [];
    if (!n && T === 1) o.push(["b", "Roll the alert penalty (D6) — tool below"]);
    if (n && T <= n) o.push(["b", "At −1 Leadership (alert penalty, turns 1–" + n + ")"]);
    if (T === 1) o.push(["a", "Move on from one table edge"]);
    if (T === 8) o.push([null, "Last turn"]);
    return o;
  },
  "surprise-attack": (T, st) => {
    const o = [];
    if (T === 1) o.push(["a", "Move on from the edge of your choice"]);
    if (get(st, "stb", 0) > 0) o.push(["b", get(st, "stb", 0) + " still on standby: Leadership test to go on alert"]);
    return o;
  },
  "blockade-run": T => T === 6 ? [[null, "Last turn"]] : [],
  "convoy": T => T === 1 ? [["a", "Move on from the marked point"]] : T === 2 ? [["a", "Last chance to enter: convoy ships not on the table after this turn are lost in the warp"]] : [],
  "planetary-assault": () => [],
  "escalating-engagement": (T, st) => {
    const o = [];
    /* on turn 1 the edge has no markers yet: the first is placed in your own turn's end phase (RB p. 139) */
    const txt = T === 1 ? "End phase: place your first marker on a random edge (no arrival rolls yet)" : "Arrival rolls at the start, a new marker in the end phase";
    if (get(st, "offa", 4) > 0) o.push(["a", txt]);
    if (get(st, "offb", 4) > 0) o.push(["b", txt]);
    return o;
  },
  "exterminatus": () => [["a", "Start of turn: D6 per Exterminator within 45 cm of the planet edge, 4+ destroys the planet"], ["b", "Start of your turn: patrol arrival rolls"]],
  "fleet-engagement": () => [],
  "gauntlet": (T, st, v) => {
    const o = [];
    if (T === 1) o.push(["b", "Move on from either long edge"]);
    if (v === "run") { o.push(["a", "End of your turn: everything back 20 cm; D6, on 6 a new phenomenon"]); if (T === 10) o.push([null, "Last turn"]); }
    return o;
  },
  "parols-bait": T => entryFx(T),
  "pelucidar": (T, st, v) => [["b", arrivalSpan(T, v)]],
  "siege-of-fularis": () => [["b", "Start of your turn: patrol arrival rolls (optional)"]],
  "assassination": T => T === 1 ? [["a", "Squadrons that failed the start test are on Reload Ordnance; only Brace for Impact otherwise"]] : [],
  "eliarenaths-gift": (T, st) => {
    const o = [];
    if (T === 1) o.push(["c", "Acts first; then the ambush may move its markers"]);
    if (T >= 2 && get(st, "mk", 4) > 0) o.push(["b", "May activate a marker voluntarily"]);
    if (!get(st, "trap", false)) o.push(["c", "Trap not sprung: no second move, and may not be attacked"]);
    return o;
  },
  "diasporex-gambit": () => [],
  "event-horizon": (T, st) => {
    const o = [[null, "End phase: Horrors of the Warp (D6)"]];
    if (get(st, "hp", 10) <= 2) o.push([null, "End phase: warp bound, 4+ the Event Horizon is gone"]);
    return o;
  },
  "fall-of-arcianr": (T, st) => {
    const o = [["b", "Start of your turn: 4+ overruns each ground defence"]];
    if (get(st, "f3", false)) o.push(["b", "Start of your turn: Force 3 arrives on 4+"]);
    return o;
  },
  "unknown-weapons": T => T === 10 ? [["a", "Last turn for your objective"]] : T > 10 ? [[null, "The ambushers’ deadline has passed"]] : []
};
export function turnTrack(sc, st, v) {
  const base = sc.fx || TURNFX[sc.id] || (() => []), max = sc.turnMax ? sc.turnMax(v) : 0;
  const fx = (T, st2, v2) => base(T, st2, v2).concat(spTurn(sc, st2, T));
  const N = Math.max(max || 8, st.turn + 1), cur = fx(st.turn, st, v);
  const sig = T => fx(T, st, v).map(x => x[0] + x[1]).join("|");
  let cells = "";
  for (let T = 1; T <= N; T++) {
    const e = fx(T, st, v), changes = T === 1 || sig(T) !== sig(T - 1);
    const dots = [...new Set(e.map(x => x[0] || "n"))].map(s => "<i class='d " + s + "'></i>").join("");
    cells += "<button class='tc" + (T === max ? " last" : "") + (changes && (T > 1 || e.length) ? " chg" : "") + "' data-a='tset' data-t='" + T + "' aria-current='" + (T === st.turn) + "'>" + T + "<span>" + dots + "</span></button>";
  }
  let next = "";
  for (let T = st.turn + 1; T <= st.turn + 12; T++) if (sig(T) !== sig(T - 1)) {
    const e = fx(T, st, v);
    next = "<div class='next'>Next change: <b>turn " + T + "</b>" + (e.length ? " — " + e.map(x => esc(x[1])).join("; ") : " — no special rules") + "</div>";
    break;
  }
  return "<div class='track" + (N >= 11 ? " dense" : "") + "' role='group' aria-label='Turns'>" + cells + "</div>" +
    "<div class='now'><div class='when'>Turn " + st.turn + (st.turn === max ? " · last turn" : max && st.turn > max ? " · past the last turn" : "") + "</div>" +
    (cur.length ? "<ul>" + cur.map(x => "<li>" + (x[0] ? "<span class='" + SIDECLS[x[0]] + "'>" + esc(sc.sides[x[0]] ? sc.sides[x[0]].n : "") + "</span> " : "") + fmt(x[1]) + "</li>").join("") + "</ul>" : "<p class='calc' style='margin:0'>Nothing turn-specific this turn.</p>") + next + "</div>";
}
