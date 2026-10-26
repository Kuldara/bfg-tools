import { tableWH } from "./table.js";
import { bzToolId, bzToolWg } from "./battlezone.js";
import { FORM, FORM_T, SC, val } from "./data.js";
import { SIDECLS, esc, fmt, seg } from "./helpers.js";
import { get, num, sideName, treeAt } from "./state.js";

/* ---------------------------------------------------------------- widgets */
export function widget(sc, st, v, t) {
  if (t.id && bzToolId(sc) === t.id) return bzToolWg(sc, st, v, t);
  const sTag = t.s ? " " + SIDECLS[t.s] : "";
  if (t.k === "counter") {
    const val = get(st, t.id, t.start || 0), w = t.warn ? t.warn(val) : "";
    return "<div class='wg'><div class='ctr'><span class='lab" + sTag + "'>" + esc(t.l) + "</span><button class='sq' data-a='cnt' data-id='" + t.id + "' data-d='-1'" + (val <= (t.min || 0) ? " disabled" : "") + " aria-label='Less'>−</button><span class='val'>" + val + "</span><button class='sq' data-a='cnt' data-id='" + t.id + "' data-d='1'" + (t.max !== undefined && val >= t.max ? " disabled" : "") + " aria-label='More'>+</button>" + (t.bulk ? "<button class='sq bulk' data-a='cnt' data-id='" + t.id + "' data-d='" + t.bulk + "'" + (t.max !== undefined && val >= t.max ? " disabled" : "") + " aria-label='Add " + t.bulk + "'>+" + t.bulk + "</button>" : "") + "</div>" +
      (t.goal ? "<div class='goal'>" + (val >= t.goal ? "✓ " : "") + "goal " + t.goal + "</div>" : "") + (w ? "<div class='note' style='margin:8px 0 0'>" + fmt(w) + "</div>" : "") + "</div>";
  }
  if (t.k === "toggle") {
    const on = !!get(st, t.id, false);
    return "<button class='tog' data-a='tog' data-id='" + t.id + "' aria-pressed='" + on + "'><span class='box'>" + (on ? "✓" : "") + "</span><span class='" + (t.s ? SIDECLS[t.s] : "") + "' style='font-weight:600'>" + esc(t.l) + "</span></button>";
  }
  if (t.k === "obj") {
    const val = get(st, t.id, "");
    return "<div class='wg obj'><div class='ot'>" + fmt(t.l) + "</div>" + (t.hint ? "<div class='sub'>" + esc(t.hint(st)) + "</div>" : "") +
      "<div class='seg' role='group'><button data-a='obj' data-id='" + t.id + "' data-val='y' aria-pressed='" + (val === "y") + "'>Achieved</button><button data-a='obj' data-id='" + t.id + "' data-val='n' aria-pressed='" + (val === "n") + "'>Failed</button></div></div>";
  }
  if (t.k === "pick") {
    const sel = get(st, t.id, -1);
    return "<div class='wg'><h3>" + esc(t.l) + "</h3>" + (t.foot ? "<div class='sub'>" + esc(t.foot) + "</div>" : "") + "<div class='picks'>" +
      t.rows.map((r, i) => "<button class='pk' data-a='pick' data-id='" + t.id + "' data-i='" + i + "' aria-pressed='" + (sel === i) + "'><span>" + esc(r[0]) + "</span><span class='r'>" + esc(r[1]) + "</span></button>").join("") + "</div></div>";
  }
  if (t.k === "roll") {
    const rows = t.rows(v, st), f = get(st, t.id, 0), add = t.turn ? st.turn : 0, tot = f ? f + add : 0;
    const hit = tot ? rows.findIndex(r => tot >= r[0] && tot <= r[1]) : -1, die = t.d2 ? "2D6" : "D" + (t.die || 6), nf = t.die || 6;
    let h = "<div class='wg'><h3>" + esc(t.l) + "</h3><div class='sub'>" + esc(t.sub || die) + " · tap your " + (t.d2 ? "total" : "die") + ", or roll here</div><div class='faces" + (t.d2 || nf > 6 ? " f11" : "") + "'>" +
      (t.d2 ? [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] : Array.from({ length: nf }, (x, i) => i + 1)).map(n => "<button class='face' data-a='face' data-id='" + t.id + "' data-f='" + n + "' aria-pressed='" + (f === n) + "'>" + n + "</button>").join("") + "</div>";
    h += "<div class='rollrow'><button class='btn' data-a='rnd' data-id='" + t.id + "'>Roll " + die + "</button><span class='calc'>" + (f ? (t.turn ? die + " <b>" + f + "</b> + turn <b>" + add + "</b> = <b>" + tot + "</b>" : "Rolled <b>" + f + "</b>") + (hit >= 0 ? " → <b>" + esc(rows[hit][2].split(":")[0]) + "</b>" : "") : "No roll yet") + "</span></div>";
    h += "<table class='ltab'>" + rows.map((r, i) => "<tr" + (i === hit ? " class='hit'" : "") + "><td>" + (r[1] >= 99 ? r[0] + "+" : r[0] === r[1] ? r[0] : r[0] + "–" + r[1]) + "</td><td>" + fmt(r[2]) + "</td></tr>").join("") + "</table></div>";
    return h;
  }
  if (t.k === "secret") {
    const c = get(st, t.id, -1), shown = !!get(st, t.id + "_s", false);
    let h = "<div class='wg secret'><h3>" + esc(t.l) + "</h3>";
    if (c < 0) h += "<div class='sub'>" + esc(t.sub || "Pick the ship Lart is hiding on. It stays hidden until you show it.") + "</div><div class='opts'>" + (t.rnd ? "<button class='btn primary' data-a='secr' data-id='" + t.id + "'>Draw at random, hidden</button>" : "") + t.opts.map((o, i) => "<button class='btn' data-a='sec' data-id='" + t.id + "' data-i='" + i + "'>" + esc(o) + "</button>").join("") + "</div>";
    else h += "<div class='shown'>" + (shown ? esc(t.opts[c]) : "Hidden ••••••") + "</div><div class='rollrow' style='margin-top:8px'><button class='btn' data-a='secshow' data-id='" + t.id + "'>" + (shown ? "Hide" : "Show") + "</button><button class='btn' data-a='secclr' data-id='" + t.id + "'>Choose again</button></div>";
    return h + "</div>";
  }
  if (t.k === "ending") {
    const sel = get(st, t.id, -1);
    return "<div class='wg'><h3>" + esc(t.l) + "</h3><div class='picks'>" + t.rows.map((r, i) => "<button class='pk' data-a='end' data-id='" + t.id + "' data-i='" + i + "' aria-pressed='" + (sel === i) + "'><span>" + esc(r[0]) + "</span><span class='r " + (SIDECLS[r[1]] || "") + "'>" + esc(r[2] || (r[1] === "draw" ? "Draw" : sideName(sc, r[1]))) + "</span></button>").join("") + "</div></div>";
  }
  if (t.k === "num") {
    const val = get(st, t.id, "");
    return "<div class='wg'><h3 class='" + (t.s ? SIDECLS[t.s] : "") + "'>" + esc(t.l) + "</h3><div class='num-in'><input type='number' inputmode='numeric' min='0' step='5' data-a='num' data-id='" + t.id + "' value='" + esc(val) + "' aria-label='" + esc(t.l) + "'><span class='calc' data-after='" + t.id + "'>" + t.after(num(st, t.id)) + "</span></div></div>";
  }
  if (t.k === "shiproll") {
    const n = get(st, t.id + "_n", n0Of(t, st)), res = get(st, t.id, null);
    return "<div class='wg'><h3>" + esc(t.l) + "</h3>" + (t.sub ? "<div class='sub'>" + esc(t.sub) + "</div>" : "") + "<div class='ctr'><span class='lab'>" + esc(t.cl || "Capital ships") + "</span><button class='sq' data-a='cnt2' data-id='" + t.id + "_n' data-d='-1'" + (n <= 1 ? " disabled" : "") + " aria-label='Fewer'>−</button><span class='val'>" + n + "</span><button class='sq' data-a='cnt2' data-id='" + t.id + "_n' data-d='1' aria-label='More'>+</button></div>" +
      "<div class='rollrow' style='margin-top:8px'><button class='btn primary' data-a='shr' data-id='" + t.id + "'>" + esc(t.btn ? t.btn(n) : "Roll " + n + " × D6") + "</button>" + (res ? "<button class='btn' data-a='shc' data-id='" + t.id + "'>Clear</button>" : "") + "</div>" +
      (res ? "<ol class='plain'>" + res.map((d, i) => "<li>" + esc(t.il ? t.il(i) : "Ship " + (i + 1)) + ": <b>" + (t.show ? t.show(d) : Array.isArray(d) ? d.join(" + ") : d) + "</b> → " + esc(t.out(d, st)) + "</li>").join("") + "</ol>" : "<p class='calc' style='margin:0'>" + esc(t.none || "Roll here, or roll your own dice and read the rule above.") + "</p>") + (t.foot ? t.foot(st) : "") + "</div>";
  }
  if (t.k === "val") {
    const cur = get(st, t.id, 0);
    return "<div class='wg'><h3>" + esc(t.l) + "</h3><div class='rollrow'>" + (t.opts.length ? seg("valset", t.id, t.opts, cur) : "") + "<button class='btn' data-a='valr' data-id='" + t.id + "'>Roll</button></div>" +
      "<p class='calc' style='margin:0'>" + (cur ? "Result: <b>" + cur + (t.unit || "") + "</b>" : t.opts.length ? "Tap your result, or roll here." : "Roll here, or roll your own dice.") + "</p></div>";
  }
  if (t.k === "rand") {
    const n = get(st, t.id + "_n", 4), pick = get(st, t.id, 0);
    return "<div class='wg'><h3>" + esc(t.l) + "</h3><div class='ctr'><span class='lab'>Ships to choose from</span><button class='sq' data-a='cnt2' data-id='" + t.id + "_n' data-d='-1'" + (n <= 1 ? " disabled" : "") + " aria-label='Fewer'>−</button><span class='val'>" + n + "</span><button class='sq' data-a='cnt2' data-id='" + t.id + "_n' data-d='1' aria-label='More'>+</button></div>" +
      "<div class='rollrow' style='margin-top:8px'><button class='btn primary' data-a='rr' data-id='" + t.id + "'>Pick at random</button><span class='calc'>" + (pick ? "Ship number <b>" + pick + "</b> of " + n + " (count them in an agreed order)" : "") + "</span></div></div>";
  }
  if (t.k === "text") {
    return "<div class='wg'><h3>" + esc(t.l) + "</h3><input class='txtin' type='text' data-a='txt' data-id='" + t.id + "' value='" + esc(get(st, t.id, "")) + "' placeholder='Optional note' aria-label='" + esc(t.l) + "'></div>";
  }
  if (t.k === "salvage") {
    const r = Object.assign({ need: 5, found: 0, empty: false, pend: false, last: "" }, get(st, t.id, null) || {});
    let h = "<div class='wg'><h3>" + esc(t.l) + "</h3><div class='sub'>Tech found in the hulk so far: <b>" + r.found + "</b></div>";
    if (r.empty) h += "<p class='calc'>The hulk is stripped — there is nothing more to find.</p>";
    else if (r.pend) h += "<p class='calc'>Piece " + r.found + " found. Roll a D6: on <b>" + (r.found - 1 === 1 ? "1" : "1–" + (r.found - 1)) + "</b> the hulk is now empty.</p><div class='rollrow'><button class='btn primary' data-a='slr' data-id='" + t.id + "'>Roll D6</button><button class='btn' data-a='sle' data-id='" + t.id + "'>It is empty</button><button class='btn' data-a='slm' data-id='" + t.id + "'>More to find</button></div>";
    else h += "<p class='calc'>End phase search by the crew aboard: needs <b>" + r.need + "+</b> on a D6.</p><div class='rollrow'><button class='btn primary' data-a='slr' data-id='" + t.id + "'>Roll D6</button><button class='btn' data-a='slf' data-id='" + t.id + "'>Found tech</button><button class='btn' data-a='sln' data-id='" + t.id + "'>Nothing</button><button class='btn' data-a='slc' data-id='" + t.id + "'>New crew aboard</button></div>";
    if (r.last) h += "<p class='calc' style='margin:6px 0 0'>" + r.last + "</p>";
    return h + "</div>";
  }
  if (t.k === "tree") {
    const path = get(st, t.id, null) || [], cur = treeAt(t, path), n = t.nodes[cur];
    let h = "<div class='wg tree'><h3>" + esc(t.l) + "</h3>";
    if (path.length) h += "<ol class='tpath'>" + path.map(([id, i]) => "<li><b>" + esc(t.nodes[id].n) + "</b> → " + esc(t.nodes[id].kids[i][0]) + "</li>").join("") + "</ol>";
    if (n.end) h += "<div class='tnode end'><div class='tn " + (SIDECLS[n.end] || "") + "'>" + esc(n.n) + "</div>" + (n.txt ? "<p>" + fmt(n.txt) + "</p>" : "") + "</div>";
    else {
      const link = n.sc && SC.find(x => x.id === n.sc);
      h += "<div class='tnode'><div class='sub'>" + (path.length ? "Next battle" : "First battle") + "</div><div class='tn'>" + esc(n.n) + "</div>" + (n.txt ? "<p>" + fmt(n.txt) + "</p>" : "") +
        (link ? "<p><a href='#/s/" + link.id + "/setup'>Open " + esc(link.name) + " ›</a></p>" : "") +
        "<div class='sub'>How did it end?</div><div class='picks'>" + n.kids.map((k, i) => "<button class='pk' data-a='trk' data-id='" + t.id + "' data-i='" + i + "'><span>" + esc(k[0]) + "</span><span class='r'>" + esc(t.nodes[k[1]].n) + "</span></button>").join("") + "</div></div>";
    }
    if (path.length) h += "<div class='rollrow' style='margin-top:8px'><button class='btn' data-a='trb' data-id='" + t.id + "'>Step back</button></div>";
    return h + "</div>";
  }
  if (t.k === "reinf") {
    const r = get(st, t.id, null) || { arr: {}, last: null }, die = t.die || 20, from = t.from || 1, early = st.turn < from, allIn = t.rows.every((x, i) => x[2] || r.arr[i]), done = allIn || !!(r.last && r.last[0] === st.turn) && !reinfAgain(t, r, st.turn);
    const lastHit = r.last ? t.rows.findIndex(x => x[0] === r.last[1]) : -1, rowVerb = i => i >= 0 && t.rows[i][2] ? "" : verb;
    const verb = t.verb === undefined ? " arrive" : t.verb ? " " + t.verb : "";
    let h = "<div class='wg'><h3" + (t.s ? " class='" + SIDECLS[t.s] + "'" : "") + ">" + esc(t.l) + "</h3><div class='sub'>" + esc(t.sub || "D" + die + " each turn from turn " + from + " · each result arrives once · tap a row to mark it by hand") + "</div>" +
      "<div class='rollrow'><button class='btn primary' data-a='rfr' data-id='" + t.id + "'" + (early || done ? " disabled" : "") + ">" + (allIn ? "Everything is in" : done ? "Rolled for turn " + st.turn : "Roll D" + die + " for turn " + st.turn) + "</button></div>";
    h += "<p class='calc' style='margin:6px 0 0'>" + (early ? "No rolls before turn " + from + "." : r.last && r.last[0] === st.turn ? "Turn " + st.turn + ": rolled <b>" + r.last[1] + "</b> → " + (lastHit < 0 ? "nothing arrives." : r.last[2] ? "<b>" + esc(t.rows[lastHit][1]) + "</b>" + rowVerb(lastHit) + (t.where && !t.rows[lastHit][2] ? " " + esc(t.where) : "") + "." : esc(t.dup || "already arrived — ignore.")) + (reinfAgain(t, r, st.turn) ? " Roll again." : "") : "Not rolled this turn yet.") + "</p>";
    h += "<table class='ltab' style='margin-top:8px'>" + t.rows.map((x, i) => "<tr><td>" + x[0] + "</td><td><button class='linkish' data-a='rft' data-id='" + t.id + "' data-i='" + i + "'>" + (r.arr[i] ? "✓ " : "") + esc(x[1]) + "</button>" + (r.arr[i] ? " <span class='muted small'>arrived turn " + r.arr[i] + "</span>" : "") + "</td></tr>").join("") + "</table></div>";
    return h;
  }
  if (t.k === "terrain") {
    const g0 = gridOf(...tableWH(), t.size || 60), r0 = get(st, t.id, null), stale = !!(r0 && r0.length !== g0.c * g0.r), res = stale ? null : r0;
    return "<div class='wg'><h3>" + esc(t.l) + "</h3><div class='sub'>" + esc(t.sub || "") + "</div><div class='rollrow'><button class='btn primary' data-a='trr' data-id='" + t.id + "'>" + (res ? "Roll again" : "Roll every square") + "</button>" + (res ? "<button class='btn' data-a='trc' data-id='" + t.id + "'>Clear</button>" : "") + "</div>" +
      (stale ? "<p class='calc' style='margin:0'>The table size changed after this roll — roll again for " + g0.c * g0.r + " squares.</p>" : res ? "<p class='calc' style='margin:0'>Shown on the map above. " + res.map((r, i) => "Square " + (i + 1) + ": <b>" + esc(r) + "</b>").join(" · ") + "</p>" : "<p class='calc' style='margin:0'>Roll here, or roll your own dice and place by the table.</p>") +
      "<table class='ltab' style='margin-top:8px'>" + t.rows.map(r => "<tr><td>" + (r[0] === r[1] ? r[0] : r[0] + "–" + r[1]) + "</td><td>" + esc(r[2]) + "</td></tr>").join("") + "</table></div>";
  }
  if (t.k === "timer") {
    const t0 = get(st, t.id, 0), lim = t.min || 150, el = t0 ? Math.floor((Date.now() - t0) / 60000) : 0;
    return "<div class='wg'><h3>" + esc(t.l) + "</h3><div class='rollrow'><button class='btn" + (t0 ? "" : " primary") + "' data-a='tmr' data-id='" + t.id + "'>" + (t0 ? "Stop and reset" : "Start the clock") + "</button><span class='calc' data-timer='" + t.id + "' data-t0='" + t0 + "' data-lim='" + lim + "'>" + timerText(t0, lim) + "</span></div></div>";
  }
  if (t.k === "info") return "<div class='wg'>" + t.html(st) + "</div>";
  if (t.k === "html") return "<div class='wg'>" + t.html + "</div>";
  if (t.k === "board") {
    const ld = get(st, "bd_ld", 8), own = get(st, "bd_own", 0), en = get(st, "bd_en", 0), p = boardChance(ld, own, en);
    return "<div class='wg'><h3>" + esc(t.l) + "</h3><div class='sub'>3D6, drop the lowest, then adjust the highest die; pass if the total is equal to or under the Leadership.</div><div class='minis'>" +
      "<div><label>Leadership</label>" + seg("bset", "bd_ld", [6, 7, 8, 9, 10], ld) + "</div><div><label>Extra own ships</label>" + seg("bset", "bd_own", [0, 1, 2, 3], own) + "</div><div><label>Enemy ships joining</label>" + seg("bset", "bd_en", [0, 1, 2, 3], en) + "</div></div>" +
      "<div class='calc'>Chance to score: <b>" + Math.round(p * 100) + " %</b></div></div>";
  }
  if (t.k === "formation") {
    const f1 = get(st, "f1", -1), f2 = get(st, "f2", -1);
    let out = "<p class='calc'>Pick both formations.</p>";
    if (f1 >= 0 && f2 >= 0) {
      const c = FORM_T[f1][f2];
      if (c.length === 1) out = "<p class='calc'>Set-up <b>" + c[0] + "</b>. The book does not say who takes which zone here — roll off or agree.</p>";
      else if (c[2] === "x") out = "<p class='calc'>Set-up <b>D</b>, either zone. Roll off with the modifiers in step 3; the winner picks dark or light.</p>";
      else out = "<p class='calc'>Set-up <b>" + c[0] + "</b> or <b>" + c[1] + "</b>. Player 1 takes the <b>" + (c[2] === "d" ? "dark" : "light") + "</b> zone, Player 2 the " + (c[2] === "d" ? "light" : "dark") + ". Roll off with the modifiers in step 3; the winner picks the set-up.</p>";
      const opts = [...new Set(c.slice(0, c.length === 1 ? 1 : 2))];
      out += "<div class='rollrow'>" + opts.map(x => "<button class='btn" + (v === x ? " primary" : "") + "' data-a='var' data-v='" + x + "'>Show set-up " + x + "</button>").join("") + "</div>";
    }
    return "<div class='wg'><h3>Formations</h3><div class='minis'><div><label>Player 1</label>" + seg("bset", "f1", [0, 1, 2], f1, FORM) + "</div><div><label>Player 2</label>" + seg("bset", "f2", [0, 1, 2], f2, FORM) + "</div></div>" + out + "</div>";
  }
  return "";
}
/* reinf: may it be rolled again this turn ("again" row, or a result already arrived when t.again) */
export function reinfAgain(t, r, turn) {
  if (!r.last || r.last[0] !== turn) return false;
  const i = t.rows.findIndex(x => x[0] === r.last[1]);
  return (i >= 0 && t.rows[i][2] === "again") || (!!t.again && !r.last[2]);
}
/* shiproll: the default number (a number or a function of the state, e.g. the number of rolls from another tool) */
export function n0Of(t, st) { const n = typeof t.n0 === "function" ? t.n0(st) : t.n0; return Math.max(1, Math.min(20, n || 4)); }
export function timerText(t0, lim) {
  if (!t0) return "Time limit " + [Math.floor(lim / 60) ? Math.floor(lim / 60) + " h" : "", lim % 60 ? lim % 60 + " min" : ""].filter(Boolean).join(" ") + ". Not started.";
  const m = Math.floor((Date.now() - t0) / 60000), left = lim - m;
  return left > 0 ? "<b>" + Math.floor(m / 60) + " h " + (m % 60) + " min</b> played · " + left + " min left" : "<b>Time is up</b> — finish the current turn.";
}
setInterval(() => document.querySelectorAll("[data-timer]").forEach(e => { e.innerHTML = timerText(+e.dataset.t0, +e.dataset.lim); }), 30000);
/* squares of a terrain grid on the current table: n columns × m rows of about `size` cm */
export function gridOf(W, H, size) { const c = Math.max(1, Math.round(W / size)), r = Math.max(1, Math.round(H / size)); return { c, r, sw: W / c, sh: H / r }; }
export function boardChance(ld, own, en) {
  let ok = 0;
  for (let a = 1; a <= 6; a++) for (let b = 1; b <= 6; b++) for (let c = 1; c <= 6; c++) {
    const d = [a, b, c].sort((x, y) => x - y), hi = Math.max(0, d[2] - own + en);
    if (d[1] + hi <= ld) ok++;
  }
  return ok / 216;
}
