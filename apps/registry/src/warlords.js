import { resolveUnit } from "./cards.js";
import { L, listOf, setUpState, upState, upgradesFor } from "./model.js";
import { save } from "./save.js";
import { appState } from "./state.js";
import { fleetResolved, shipCall } from "./validation.js";
import { esc } from "../../../packages/ui/format.js";

/* Da Ork Clanz (J226): the Warlord new skwadrons go to. The catalogue's +
   adds to him, so a fleet need not be built in its Warlords' order: adding a
   Warlord makes him the one, and so does tapping his block. Viewer state,
   not saved - a reopened fleet starts with its last Warlord. */
appState.ACTIVE_WL = null;
export function activeWarlordIdx(RF){
  const ws = warlordIdx(RF);
  if(!ws.length) return -1;
  const a = ws.filter(i => appState.S.units[i].uid === appState.ACTIVE_WL)[0];
  return a != null ? a : ws[ws.length - 1];
}
/* A row of a skwadron section of the Clanz list (tiddla, big ship, 'Uge
   ship, Rok, Space Hulk) - what a Warlord commands. */
export function clanzSkwadronSec(si){
  const C = L().clanz, sc = L().secs[si];
  return !!C && !!sc && [C.tiddla, C.big, C.uge, C.hulk, C.rok].some(re => new RegExp(re, "i").test(String(sc.t).trim()));
}
export const clanzIn = (si, re) => { const sc = L().secs[si]; return !!sc && new RegExp(re, "i").test(String(sc.t).trim()); };
export function freeSqTag(){
  const used = appState.S.units.map(u => u.sq).filter(Boolean);
  return "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").filter(c => used.indexOf(c) < 0)[0] || "Z";
}
/* J232 (user 24.10.2026: "wherever it says tiddla etc. it could say it
   plainly right away, e.g. tiddla (escort) skwadrons"): the book's Ork words with
   plain English beside them. On screen only - the book's section names, the
   domain's check rows and the saved fleet keep the book's words (Fleets
   pp. 359-360, 370, 372, 392). */
export const ORK_SEC_GLOSS = [
  [/^tiddla skwadron$/i, "escorts \u00b7 3\u201310 in a skwadron"],
  [/^big ship skwadron$/i, "kroozers = cruisers \u00b7 1\u20132 in a skwadron"],
  [/uge ship skwadron$/i, "one battleship or battlekroozer"],
  [/^roks$/i, "hollowed-out asteroids \u00b7 1\u20134 in a skwadron"],
  [/^ork roks$/i, "hollowed-out asteroids \u00b7 up to 4 in a squadron"],
  [/^space hulks$/i, "one Warlord's whole command", "clanz"],
  [/^gubbins$/i, "upgrades \u00b7 Warlord's own ship, one per re-roll"],
  [/^clan upgrades$/i, "his clan on every skwadron"],
  [/^mob rule$/i, "+1 Ld with 6+ escorts"],
  [/^young gunz$/i, "a free escort at Ld 5\u20136"]
];
export function orkSecGloss(SL, sec){
  if(!/^Orks/.test(String(SL && SL.nm))) return "";
  const g = ORK_SEC_GLOSS.find(x => x[0].test(String(sec.t).trim()) && (!x[2] || !!SL.clanz));
  return g ? g[1] : "";
}
/* The same in a sentence the builder or the domain wrote: the first of each
   word gets its English in brackets. */
export const ORK_WORDS = [[/\btiddla\b(?!\s*\()/i, "escort"], [/\bkroozers\b(?!\s*\()/i, "cruisers"],
                   [/\bkroozer\b(?!\s*\()/i, "cruiser"], [/[\u2019']Uge ship\b(?!\s*\()/i, "battleship"]];
export function orkPlain(s){
  s = String(s == null ? "" : s);
  ORK_WORDS.forEach(([re, en]) => { s = s.replace(re, m => m + " (" + en + ")"); });
  return s;
}
/* J232: a Warlord's skwadrons as the book counts them (Fleets p. 372): an
   'Uge ship and a hulk each by itself, 1-2 kroozers, 1-4 Roks and 3-10
   tiddla escorts "in any mix desired" by their tag, a card without a tag by
   itself (the domain reads them the same way, clanzTiddlas). */
export const SKW_MAX = { tiddla: 10, kroozer: 2, rok: 4 };
export const SKW_LABEL = { tiddla: "tiddla (escorts)", kroozer: "kroozers (cruisers)", uge: "'Uge ship (battleship)", rok: "Roks", hulk: "Space Hulk" };
const SKW_TIP = { tiddla: "A tiddla skwadron is 3-10 escorts in any mix; the same letter on two cards makes them one (Fleets p. 372)",
  kroozer: "A big ship skwadron is 1-2 kroozers (Fleets p. 372)", rok: "A Rok skwadron is 1-4 Roks (Fleets p. 372)" };
export function skwKind(u){
  const C = L().clanz;
  if(!C || !u || u.lst) return "";
  return clanzIn(u.s, C.tiddla) ? "tiddla" : clanzIn(u.s, C.big) ? "kroozer" : clanzIn(u.s, C.uge) ? "uge"
    : clanzIn(u.s, C.rok) ? "rok" : clanzIn(u.s, C.hulk) ? "hulk" : "";
}
/* a Blood Axe tiddla's commandeered escorts are members of the tiddla of
   their tag (Fleets p. 369), in its count and its line */
export function isCommandeered(u){ const BA = L().bloodaxe; return !!(BA && u && !u.lst && clanzIn(u.s, BA.sec)); }
const comKind = u => isCommandeered(u) && u.sq ? "tiddla" : "";
export function warlordSkwadrons(RF, wi){
  const out = [], byTag = {};
  appState.S.units.forEach((u, i) => {
    if(!RF.command || RF.command[i] !== wi) return;
    const k = skwKind(u) || comKind(u);
    if(!k) return;
    const h = RF.units[i] ? Math.max(1, RF.units[i].hulls | 0) : 1;
    const key = SKW_MAX[k] && u.sq ? k + ":" + u.sq : "";
    if(key && byTag[key]){ byTag[key].units.push(i); byTag[key].hulls += h; return; }
    const g = { kind: k, units: [i], tag: key ? u.sq : "", hulls: h };
    if(key) byTag[key] = g;
    out.push(g);
  });
  return out;
}
/* two skwadrons of his that would make one, in words for Needs */
export function skwJoinable(RF, wi){
  const gs = warlordSkwadrons(RF, wi);
  for(const k of ["kroozer", "rok"]){
    const of = gs.filter(g => g.kind === k).sort((a, b) => a.hulls - b.hulls);
    if(of.length >= 2 && of[0].hulls + of[1].hulls <= SKW_MAX[k]) return k === "kroozer" ? "two kroozers" : "the Roks";
  }
  return "";
}
export const skwNames = (RF, g) => g.units.map(i => shipCall(RF.units[i]) + (RF.units[i].hulls > 1 ? " \u00d7" + RF.units[i].hulls : "")).join(" + ");
/* The Warlord block's Skwadrons (J232, user 24.10.2026: "when you give a
   warboss capital ships, you should be able to put them in a squadron right
   there ... the same for Rok units"): one line per skwadron, and on a
   kroozer or Rok skwadron a menu of the moves the book allows - split it, or
   join one of his own of the same kind that has room. Pair with / Split on
   the kroozer's row (J226) is this menu now. */
export function skwadronsHTML(RF, wi){
  const gs = warlordSkwadrons(RF, wi);
  if(!gs.length) return `<span class="abv">nothing yet</span>`;
  return `<ol class="wlsk">${gs.map(g => {
    const max = SKW_MAX[g.kind];
    let pick = "";
    if(max){
      const tid = g.kind === "tiddla";
      const opts = [`<option value="" selected>${g.units.length > 1 ? "in one skwadron" : "on its own"}</option>`];
      if(g.units.length > 1 || g.tag) opts.push(`<option value="split">${tid ? "split into its cards" : "split into single ships"}</option>`);
      gs.forEach(h => { if(h !== g && h.kind === g.kind && g.hulls + h.hulls <= max)
        opts.push(`<option value="join:${h.units[0]}">join ${esc(skwNames(RF, h))}</option>`); });
      /* UX-01 (ChatGPT audit 27.10.2026): a second tiddla of the same
         escorts in one choice, instead of filling the first card to ten to
         get a new one - the book's smallest Warlord is "two tiddla
         skwadrons, each with three escorts" (Fleets p. 373) */
      const ork = tid ? g.units.filter(i => skwKind(appState.S.units[i]) === "tiddla") : [];
      if(ork.length) opts.push(`<option value="again:${ork[ork.length - 1]}">new tiddla of ${esc(shipCall(RF.units[ork[ork.length - 1]]))}</option>`);
      if(opts.length > 1) pick = `<select class="wlsq" data-wlsq="${g.units.join(",")}" aria-label="${esc("Skwadron of " + skwNames(RF, g))}"
        title="${esc(SKW_TIP[g.kind])}">${opts.join("")}</select>`;
    }
    return `<li><span class="skk">${esc(SKW_LABEL[g.kind])}${max ? " " + g.hulls + "/" + max : ""}</span><span class="skn">${esc(skwNames(RF, g))}</span>${pick}</li>`;
  }).join("")}</ol>`;
}
/* J232: ships handed to a Warlord are his (u.cmd) with the clan chosen for
   him, as addUnitFrom does: a clan bought on one skwadron is that
   skwadron's own choice, so nothing is bought for the player. A clan that
   then differs turns "one clan" red (Fleets p. 369). */
export function handToWarlord(us, to){
  const w = appState.S.units[to];
  /* a commandeered escort is in its tiddla, which pays the clan once (p. 369) */
  us.forEach(x => { x.cmd = w.uid; if(w.clan && !isCommandeered(x)) setClan(x, w.clan, true); });
}
/* Every Warlord's skwadrons right under him, in his order; a row no Warlord
   leads keeps its place (J232). order: the Warlords' unit indexes in the
   order wanted, else as they stand. */
export function clanzRegroup(order){
  const RF = fleetResolved(), ws = warlordIdx(RF);
  if(!ws.length || !RF.command) return;
  /* Blood Axe commandeered escorts ride with the tiddla of their tag (Fleets
     p. 369, J220) */
  const BA = L().bloodaxe;
  const ride = appState.S.units.map((u, i) => !BA || !u.sq || u.lst || RF.command[i] >= 0 || ws.indexOf(i) >= 0 || !clanzIn(u.s, BA.sec) ? -1 :
    appState.S.units.findIndex((x, j) => x.sq === u.sq && RF.command[j] >= 0 && skwKind(x) === "tiddla"));
  const slots = [], seq = [];
  appState.S.units.forEach((u, i) => { if(ws.indexOf(i) >= 0 || RF.command[i] >= 0 || ride[i] >= 0) slots.push(i); });
  (order || ws).forEach(w => { seq.push(appState.S.units[w]); appState.S.units.forEach((u, i) => { if(RF.command[i] !== w) return;
    seq.push(u); appState.S.units.forEach((x, j) => { if(ride[j] === i) seq.push(x); }); }); });
  if(seq.length !== slots.length) return;
  const next = appState.S.units.slice();
  slots.forEach((p, k) => { next[p] = seq[k]; });
  appState.S.units.splice(0, appState.S.units.length, ...next);
}
/* Send to (J232, the user on 24.10.2026: next to the drag button, a send-to
   drop-down): the whole skwadron - his ships of its tag (Fleets p. 373:
   "you can't split up skwadrons") - goes to the other Warlord, with his
   clan, to the end of his group. */
export function sendSkwadron(u, uid){
  const RF = fleetResolved(), ws = warlordIdx(RF), i = appState.S.units.indexOf(u);
  const to = ws.filter(w => appState.S.units[w].uid === uid)[0];
  if(to == null || i < 0 || !RF.command) return false;
  const from = RF.command[i], k = skwKind(u);
  if(to === from || !k) return false;
  const group = SKW_MAX[k] && u.sq ? appState.S.units.filter((x, j) => x.sq === u.sq && RF.command[j] === from && skwKind(x) === k) : [u];
  handToWarlord(group, to);
  group.forEach(x => { appState.S.units.splice(appState.S.units.indexOf(x), 1); appState.S.units.push(x); });
  clanzRegroup();
  /* what setClan had to say (a clan or a free Deathskullz row dropped) stays */
  appState.NOTICE = { u: u, items: [{ message: group.map(x => shipCall(resolveUnit(x))).join(" + ") + " sent to Warlord " + (ws.indexOf(to) + 1) }]
    .concat(appState.NOTICE ? appState.NOTICE.items : []) };
  appState.JUST = { unit: u };
  return true;
}
/* Drag (J232, user 24.10.2026: "dragging those ships under another warboss
   should change the colour and whose they are"): a skwadron row moved
   under another Warlord is his from then on - the nearest Warlord above it,
   the domain's own reading of a row without one (J216) - with his clan; it
   leaves a skwadron whose other ships stay behind. A Warlord moved takes his
   skwadrons along. */
export function clanzAfterMove(u){
  const RF = fleetResolved(), ws = warlordIdx(RF), i = appState.S.units.indexOf(u);
  if(!ws.length || i < 0 || !RF.command) return;
  if(ws.indexOf(i) < 0 && skwKind(u) && RF.command[i] >= 0){
    const above = ws.filter(w => w < i), to = above.length ? above[above.length - 1] : ws[0], from = RF.command[i];
    if(to !== from){
      const left = u.sq && appState.S.units.some((x, j) => x !== u && x.sq === u.sq && RF.command[j] === from);
      if(left) delete u.sq;
      handToWarlord([u], to);
      appState.NOTICE = { u: u, items: [{ message: shipCall(resolveUnit(u)) + " is now Warlord " + (ws.indexOf(to) + 1) + "'s" +
        (left ? " (it left its skwadron)" : "") }].concat(appState.NOTICE ? appState.NOTICE.items : []) };
    }
  }
  clanzRegroup();
}
/* Before a move (J232): every row the domain reads as a Warlord's by its
   place alone (no u.cmd: bought before the first Warlord, an older save) is
   written down as his, so the move knows where it came from and a Warlord
   moved takes it along. */
export function clanzPin(){
  const RF = fleetResolved(), ws = warlordIdx(RF);
  if(!ws.length || !RF.command) return;
  appState.S.units.forEach((x, j) => { const w = RF.command[j]; if(w >= 0 && !x.cmd && appState.S.units[w].uid) x.cmd = appState.S.units[w].uid; });
}
/* A Warlord's arrow key moves his whole group past the next Warlord's, or
   past the next row no Warlord leads. */
export function clanzMoveBlock(u, dir){
  const RF = fleetResolved(), ws = warlordIdx(RF), k = ws.indexOf(appState.S.units.indexOf(u));
  if(k < 0) return false;
  const j = k + dir;
  if(j < 0 || j >= ws.length){
    const cm = RF.command || [], mine = [];
    appState.S.units.forEach((x, i) => { if(i === ws[k] || cm[i] === ws[k]) mine.push(i); });
    const lo = mine[0], hi = mine[mine.length - 1], o = dir < 0 ? lo - 1 : hi + 1;
    if(o < 0 || o >= appState.S.units.length) return true;
    const x = appState.S.units.splice(o, 1)[0];
    appState.S.units.splice(dir < 0 ? hi : lo, 0, x);
    appState.JUST = { unit: u };
    save();
    return true;
  }
  const order = ws.slice();
  order[k] = ws[j]; order[j] = ws[k];
  clanzRegroup(order);
  appState.JUST = { unit: u };
  save();
  return true;
}
/* J232: an Ork hulk with a Warlord aboard (Fleets p. 390, in every Ork list
   that has one) and what a clan gives the hulk (p. 369 read with p. 390:
   "Hulks cannot take any upgrade that improves Boarding Value, Turning or
   Speed"). */
export const isOrkHulkUnit = R => !!R && /\bork hulk\b/i.test(String((R.entry && R.entry.label) || R.className || ""));
export const HULK_FX = [
  [/^Maniac Gunners/, ["re-roll gunz firepower", "hulk: one battery per turn"]],
  [/^Looted Torpedoes/, ["re-roll torpedo strength", "hulk: one salvo per turn"]],
  [/^Mad Meks/, ["hulk: ignore a critical on a 6"]]
];
export const HULK_CLAN_FX = {
  "Goffs": ["+1 to boarding rolls, not boarding value", "+1 Ld to ram"],
  "Evil Sunz": ["!not for a hulk: speed (p. 390)"],
  "Bad Moonz": ["Maniac Gunners: one battery per turn"],
  "Deathskullz": ["free looted torps / lances"],
  "Blood Axes": ["Warlord: random IN refit, +20"],
  "Snakebites": ["+1 to Brace"]
};
/* Take one clan's row on a unit, where the unit is offered it; "" takes
   none of them (the rows go back to their open state). */
/* keepOff: a move to another Warlord keeps a skwadron's own "not this
   benefit" (its clan row set off): being of a clan does not oblige it to pay
   for the benefit (Fleets p. 369, ChatGPT audit UX-02). The Warlord's clan
   button buys it for all, which is what it says. */
export function setClan(u, name, keepOff){
  const ups = upgradesFor(u);
  ups.own.concat(ups.other).forEach(x => {
    const m = /^Clan: (.+?) \(/i.exec(String(x[2].l));
    /* an included clan (Zukov's Goffs, p. 381) is locked: not bought, not dropped */
    if(!m || x[2].incl) return;
    if(name && m[1].toLowerCase() === name.toLowerCase()){
      if(!(keepOff && upState(u, x[0], x[1]) === "off")) setUpState(u, x[0], x[1], "take");
    }
    else if(upState(u, x[0], x[1]) === "take") setUpState(u, x[0], x[1], "opt");
  });
}
export const CLANS = ["Goffs", "Evil Sunz", "Bad Moonz", "Deathskullz", "Blood Axes", "Snakebites"];
/* A Warlord's colour (J226): his clan's colour from the book - Goffs black,
   Evil Sunz red, Bad Moonz yellow, Deathskullz blue, Blood Axes green,
   Snakebites brown (Fleets p. 369) - and before a clan is chosen one of six
   others, by his number. The same colour marks his block, his ships, his
   chip in the catalogue and his button in the bar. */
export const CLAN_COLOR = { "Goffs": "#8d939c", "Evil Sunz": "#c8372d", "Bad Moonz": "#d4a017", "Deathskullz": "#2f6fd0",
                     "Blood Axes": "#3f9b4f", "Snakebites": "#8a5a2b" };
export const WL_PALETTE = ["#d9711c", "#1b9aa0", "#8e5bd0", "#d0457f", "#6f8f2e", "#4a6fa5"];
export function warlordColor(w, k){ return (w && w.clan && CLAN_COLOR[w.clan]) || WL_PALETTE[k % WL_PALETTE.length]; }
/* What each clan does and costs, from the list's own clan rows (J227, user
   20.10.2026: "add to the clan choice what effect that clan has"). The text
   is the book's (Fleets p. 369), the price
   the row's: every capital ship of a skwadron pays it, and so does every Rok
   (ruling T58: p. 369 counts Rok skwadrons among the capital ship
   skwadrons), a tiddla skwadron once (the rows' own note). */
export function clanInfo(){
  const out = {};
  L().secs.forEach(sec => (sec.ents || []).forEach(en => {
    const m = /^Clan: (.+?) \(/i.exec(String(en.l || ""));
    if(m && en.k === "up" && !en.incl) out[m[1]] = { desc: en.desc || "", p: en.p | 0 };
  }));
  return out;
}
export const clanCost = c => c && c.p ? "+" + c.p + " pts per capital ship or Rok, once per tiddla (escort) skwadron" : "free";
/* The same as game effects only, one tag each (user 20.10.2026: "highlighted
   somehow so you notice at once ... no description in words at all, just the
   game effects"). Read from the clan rows' text, Fleets p. 369; a "!"
   tag is a restriction, not a bonus. The book's sentence stays in the
   tooltip. */
export const CLAN_FX = {
  "Goffs": ["+1 boarding", "+1 Ld to ram"],
  "Evil Sunz": ["+5cm speed"],
  "Bad Moonz": ["re-roll gunz firepower"],
  "Deathskullz": ["free looted torps / lances"],
  "Blood Axes": ["Warlord: random IN refit, +20", "tiddla (escort) skwadron of 6+: up to 3 IN/Chaos escorts"],
  "Snakebites": ["+1 to Brace", "!capital ships: hulks / roks only"]
};
/* The fleet-list upgrades as game effects, one tag each (J229 Orks, J230
   every fleet; user 21.10.2026: "these could say briefly what each one
   does", 22.10. "finish it"). A row whose label already says it
   ("+1 turret", "Increase to Ld 9", re-rolls, Tyranid weapons) gets none.
   [label, list or null, tags, the unit's own entry or omitted]; "!" marks a
   drawback; first match wins; the book's text and the row's note stay in
   its tooltip. Pages (Fleets unless said): Ork Gubbins 370-371, Waaagh! and
   Cyclops Warlord 365-366 (their Mega-armoured Boarding Parties is "+1
   modifier on boarding" only), Torpedo-bommas 359, boarding torpedoes 360
   and Rulebook 78, special torpedoes 19, torpedo bombers 22, orbital mines
   23, power ram 32 (FAQ 2026 Power ram), Fleet Defence Turrets 50, Shark
   assault boats 49, plasma-boosted batteries 121, Honour Guard and
   Terminator boarding parties 99 and 145, Rogue Traders 175, Chaos Space
   Marines 224, Daemonships 227-228, Marks of Chaos 232 and 234 (the
   Incursion Warmaster's Khorne also +1 to boarding critical rolls), Legion
   gifts 236, 240, 244, 248, Thunderhawks 235-250 (bays halved), Aspect
   Warriors 305, Ghostships 307, Webway Portal 337, Leech torpedoes 347,
   Mimic Engines 351, Sepulchre 404, bio-enhancements 426-427, Hive Mind
   430, Improved Logic Engines 453. */
export const UP_FX = [
  // Orks
  [/^Soopa Boostas/, null, ["+5cm speed", "4D6 on All Ahead Full"]],
  [/^Extra Power Fields/, null, ["+1 shield"]],
  [/^Extra Turrets \(escorts/, null, ["+1 turret"]],
  [/^Extra Turrets/, null, ["+2 turrets"]],
  [/^Maniac Turrets/, null, ["turrets become D3"]],
  [/^Looted Lances \(escorts/, null, ["heavy gunz \u2192 S2 lance, 15cm"]],
  [/^Looted Lances/, null, ["heavy gunz \u2192 S2 lance, 30cm"]],
  [/^Looted Torpedoes/, null, ["re-roll torpedo strength"]],
  [/^Mad Meks/, null, ["re-roll damage control"]],
  [/^Maniac Gunners/, null, ["re-roll gunz firepower"]],
  [/^Mega-armoured Boarding Parties/i, /Clanz/, ["+1 boarding", "+1 hit-and-run"]],
  [/^Mega-armoured Boarding Parties/i, null, ["+1 boarding"]],
  [/^Prow Ram/, null, ["+1 Ld to ram", "+1 hit when ramming"]],
  [/^Tellyporta/, null, ["teleport hit-and-run to 30cm"]],
  [/^Klaws/, null, ["base contact: 2D6, each 4+ hits past shields", "both hit: latched on"]],
  [/^Shokk-Attack Lance/, null, ["replaces prow heavy gunz", "shields down: 4+ at 30cm", "D3+1 snotling hordes: +D6 to its Ld"]],
  [/^Assault Karrier/, null, ["free boarding torpedoes", "+1 assault boat per launch", "!assault boats only"]],
  [/^Torpedo-bommas/i, null, ["20cm bombers, no fighter role", "later turns: S2 torpedo salvo each", "added to fighta-bommas"]],
  [/^Boarding torpedoes/, /^Orks/, ["torpedo hits are hit-and-run attacks"]],
  // every fleet's ordnance
  [/^Orbital mines/i, null, ["mines instead of attack craft", "!bay critical: +D3 damage"]],
  [/^Special torpedoes/, null, ["D6: one special torpedo type"]],
  [/^Torpedo bombers/, null, ["20cm bombers", "later turns: S2 torpedo salvo", "added to bombers"]],
  // Imperial
  [/^Imperial Power Ram/, null, ["+1 hit when ramming"]],
  [/^Fleet Defence Turrets/, null, ["+2 turrets to itself or a ship within 15cm"]],
  [/^Shark assault boats/, null, ["Shark assault boats, 30cm"]],
  [/^Plasma-boosted batteries/, null, ["batteries 30cm \u2192 45cm"]],
  [/^Terminator boarding party|^Grey Knights Terminators/, null, ["extra teleport attack", "2 dice, both count"]],
  [/^(Grey Knights )?Honour Guard/, null, ["extra teleport attack", "2 dice, pick one"]],
  [/^Crew skill, rolled randomly/, null, ["random crew skill (D6)"]],
  [/^Xenotech System, rolled randomly/, null, ["random Xenotech system (D6)"]],
  // Chaos
  [/^(The )?Mark of Khorne/, /Incursion/, ["double boarding value", "+1 to boarding critical rolls"], /Warmaster/],
  [/^(The )?Mark of Khorne/, null, ["double boarding value"]],
  [/^(The )?Mark of Slaanesh/, null, ["enemies within 15cm: -2 Ld"]],
  [/^(The )?Mark of Tzeentch/, null, ["+1 re-roll"]],
  [/^(The )?Mark of Nurgle/, null, ["+1 Hit", "cannot be boarded"]],
  [/Chaos Space Marine crew$/, null, ["+1 Ld, max 10", "+2 boarding", "own hit-and-run +1, enemy's -1"]],
  [/Chosen Terminators/, null, ["teleport hit-and-run: 2 dice, pick one"]],
  [/^Thunderhawk Gunships/, null, ["Thunderhawks only", "!launch bays halved"]],
  [/^Daemonship:/, null, ["can start in the Warp", "disengages without a roll", "!no squadrons, Lords or CSM crew"]],
  [/^Warp Beasts/, null, ["once per battle: D6 hits on a ship within 15cm, no shields"]],
  [/^Strand of Fortune/, null, ["once per battle: auto-pass a Command check or Ld test"]],
  [/^Hives of Nurgle/, null, ["ships within 15cm get no left shift against it"]],
  [/^Ark of Pestilence/, null, ["ships it boards also take a Fire critical"]],
  [/^Berzerker Tide/, null, ["boarding: +D3 critical rolls, then no orders next turn", "carriers: +D3 attack craft under 20cm, then reload"]],
  [/^Veil of Lust/, null, ["gunnery against it: right column shift"]],
  [/^Siren.s Summon/, null, ["enemies within 15cm: no special orders or Ld tests"]],
  // Eldar and Dark Eldar
  [/^Aspect Warrior Host/, null, ["+2 boarding", "+1 hit-and-run"]],
  [/^Ghostship/, null, ["criticals only on a 6", "!failed order: only moves", "!cannot board or hit-and-run", "!enemy +1 to board or hit-and-run it"]],
  [/^Summoned through the Webway Portal/, null, ["starts off the table", "turn 2+: arrives on a 5+"]],
  [/^Leech torpedoes/, null, ["hit: one critical instead of damage", "-10cm speed, no All Ahead Full"]],
  [/^Mimic Engines/, null, ["free move after deployment", "turn 1: untargetable beyond 30cm"]],
  // Necrons, Tau
  [/^Sepulchre/, null, ["Ld 10", "20cm: enemy Ld test or -1 Ld and no orders", "ordnance within 20cm: destroyed on 4+"]],
  [/^Improved Logic Engines/, null, ["ignores Blast Marker Ld penalties"]],
  // Tyranids
  [/^Accelerated Healing/, null, ["+2 dice to repair criticals"]],
  [/^Adrenaline Sacs/, null, ["+1D6 on All Ahead Full"]],
  [/^Drone Link/, null, ["pyro-acid: left shift within 15cm of a Vanguard drone"]],
  [/^Extra Spore Cysts \(each/, null, ["+1 spore cyst (shield and turret)"]],
  [/^Extra Spore Cysts/, null, ["+2 spore cysts (shields and turrets)"]],
  [/^Mega-Spore Mines/, null, ["bays launch mega-spore mines", "their hits are Fire criticals"]],
  [/^More Discharge Vents/, null, ["-5cm before turning"]],
  [/^Mucous Membrane/, null, ["bombers and assault boats -1 attack", "torpedoes need +1 to hit it"]],
  [/^Psychic Scream/, null, ["enemies within 15cm: -2 Ld"]],
  [/^Reinforced Carapace \(each/, null, ["+1 Hit"]],
  [/^Solar Vanes/, null, ["+5cm speed"]],
  [/^Tenacity/, null, ["weapons unaffected by AAF, Burn Retros, New Heading"]],
  [/^Hive Mind Imperative/, null, ["auto-pass one Command check or Ld test"]],
  [/^Hive Mind Influence/, null, ["+1 fleet re-roll"]]
];
/* Ruling T57 (Fleets p. 393): a Rok moves exactly 10 cm, so on a Rok a +5 cm
   speed row says that instead of promising the speed. */
export const ROK_FX = [
  [/^Clan: Evil Sunz/, ["!Rok: stays 10 cm (p. 393)"]],
  [/^Soopa Boostas/, ["!Rok: stays 10 cm (p. 393)", "4D6 on All Ahead Full"]]
];
export function upFx(up, who, hulk){
  const lab = String(up.label || ""), list = String(up.list || ""), cm = /^Clan: (.+?) \(/.exec(lab);
  if(/^\s*Rok\s*$/i.test(String(who || ""))){
    const r = ROK_FX.find(x => x[0].test(lab));
    if(r) return { tags: r[1], color: cm ? CLAN_COLOR[cm[1]] : null };
  }
  /* J232: on an Ork hulk, or a Warlord aboard one (Fleets p. 390) */
  const onHulk = !!hulk || /\bork hulk\b/i.test(String(who || ""));
  if(cm && CLAN_FX[cm[1]]) return { tags: (onHulk && HULK_CLAN_FX[cm[1]]) || CLAN_FX[cm[1]], color: CLAN_COLOR[cm[1]] };
  if(onHulk || /\(Space Hulk/.test(lab)){ const h = HULK_FX.find(x => x[0].test(lab)); if(h) return { tags: h[1], color: null }; }
  const hit = UP_FX.find(x => x[0].test(lab) && (!x[1] || x[1].test(list)) && (!x[3] || x[3].test(String(who || ""))));
  return hit ? { tags: hit[2], color: null } : null;
}
/* A ship option whose book sentence only gives the price ("May add Mimic
   engines for +20 pts", Fleets p. 351; the Sepulchre, p. 404) takes the
   upgrade row's tags (J230). */
export const OPT_FX = [[/\bmimic engines\b/i, "Mimic Engines"], [/\bSepulchre\b/, "Sepulchre"]];
export function optFxHTML(text, list){
  const o = OPT_FX.find(x => x[0].test(String(text || "")));
  const fx = o ? upFx({ label: o[1], list: list || "" }) : null;
  return fx ? `<span class="upfx">${fxTagsHTML(fx.tags)}</span>` : "";
}
export const fxTagsHTML = tags => tags.map(t => t[0] === "!" ? `<span class="fx lim">${esc(t.slice(1))}</span>` : `<span class="fx">${esc(t)}</span>`).join("");
export function clanLineHTML(c, I, hulk){
  const fx = (hulk && HULK_CLAN_FX[c]) || CLAN_FX[c] || [I.desc];
  return `<li style="--wl:${CLAN_COLOR[c] || "var(--ink-3)"}" title="${esc(I.desc + " (" + clanCost(I) + ", Fleets p. 369)")}"><b>${esc(c)}<span class="wlhint">${I.p ? "+" + I.p + " pts" : "free"}</span></b><span class="fxs">${
    fx.map(t => t[0] === "!" ? `<span class="fx lim">${esc(t.slice(1))}</span>` : `<span class="fx">${esc(t)}</span>`).join("")
  }</span></li>`;
}
/* The Warlord's re-rolls as one number: one included, two or three with the
   extra rows (Fleets p. 372). */
export function setWarlordRerolls(u, n){
  const ups = upgradesFor(u);
  ups.own.concat(ups.other).forEach(x => {
    const l = String(x[2].l);
    if(/^One extra re-roll/i.test(l)) setUpState(u, x[0], x[1], n === 2 ? "take" : "off");
    if(/^Two extra re-rolls/i.test(l)) setUpState(u, x[0], x[1], n === 3 ? "take" : "off");
  });
}
/* What a Warlord still needs, in words (Fleets pp. 372-373). */
export function warlordNeeds(W, RF){
  if(!W) return { ok: true, text: "" };
  if(W.hulk) return W.units.length === 1 ? { ok: true, text: "the Space Hulk is all his skwadrons" }
    : { ok: false, text: "a hulk's Warlord leads only the hulk: send the other ships to another Warlord" };
  const rr = W.rr, tid = W.tiddla || 0, total = W.total || 0, oth = total - Math.min(tid, rr);
  const say = [], s = n => n > 1 ? "s" : "";
  /* J232: the Ork words with their English */
  if(tid < rr) say.push("add " + (rr - tid) + " tiddla (escort) skwadron" + s(rr - tid) + " of 3 or more escorts");
  if(oth < rr){
    /* a second tiddla is an other skwadron too (Fleets p. 373: "two tiddla
       skwadrons"); an 'Uge ship needs two kroozers of his and is one per
       Warlord (p. 373) */
    const need = rr - oth, opts = ["another tiddla (escorts)", "1\u20132 kroozers (cruisers)"]
      .concat(!W.uge && ((W.kro || 0) >= 2 || need >= 2) ? ["an 'Uge ship (battleship)"] : [], ["1\u20134 Roks"]);
    say.push("add " + need + " other skwadron" + s(need) + ": " + opts.slice(0, -1).join(", ") + " or " + opts[opts.length - 1]);
  }
  if(oth > rr){
    const join = skwJoinable(RF, W.unit);
    say.push((oth - rr) + " skwadron" + s(oth - rr) + " too many: " + (join ? "put " + join + " in one skwadron, " : "") +
      "buy a re-roll or send one to another Warlord");
  }
  if(W.uge && W.kro < 2) say.push("an 'Uge ship (battleship) needs two kroozers (cruisers)");
  if(W.uge > 1) say.push("only one 'Uge ship (battleship)");
  if(W.clans && W.clans.length > 1) say.push("one clan only");
  if(W.gubOff) say.push("Gubbins (his upgrades) only on his own ship");
  return say.length ? { ok: false, text: say.join("; ") }
    : { ok: true, text: rr + " tiddla (escort) + " + rr + " other skwadron" + s(rr) + " \u2014 complete" };
}
/* Clanz (J226): the upgrade rows the fleet pane leaves out, by unit index.
   The Warlord's re-rolls are his block's 1-2-3, and the Gubbins his re-rolls
   pay for go on his own ship only (Fleets p. 372): another ship is not
   offered them unless one is already taken there, so the red check can be
   put right where it is. */
export function clanzHiddenUps(RF){
  const C = L().clanz, out = [];
  if(!C) return out;
  const wsI = warlordIdx(RF), ships = (RF.warlords || []).map(W => W.ship);
  appState.S.units.forEach((u, i) => {
    const R = RF.units[i];
    if(!R || u.lst) return;
    const keys = [];
    R.upgrades.forEach(up => {
      const sc = L().secs[+String(up.key).split(":")[0]];
      if(!sc) return;
      if(wsI.indexOf(i) >= 0 && /re-roll/i.test(String(up.label))) keys.push(up.key);
      else if(new RegExp(C.gub_sec, "i").test(String(sc.t).trim()) && new RegExp(C.gub_re, "i").test(String(up.label)) &&
              ships.indexOf(i) < 0 && up.state !== "take") keys.push(up.key);
    });
    out[i] = keys;
  });
  return out;
}
/* The Warlords of a Da Ork Clanz fleet, by unit index (J216). */
export function warlordIdx(RF){
  const C = L().clanz;
  if(!C || !RF.command) return [];
  const re = new RegExp(C.warlord, "i");
  return appState.S.units.map((u, i) => RF.units[i] && RF.units[i].kind === "commander" && RF.units[i].entry &&
    re.test(RF.units[i].entry.label) ? i : -1).filter(i => i >= 0);
}
/* What a Warlord leads, as his row and his card say it (Fleets p. 372: "A
   Warlord's re-rolls only count for the skwadrons under his command"). */
export function leadsText(RF, wi){
  if(!RF.command) return "";
  return appState.S.units.map((u, i) => RF.command[i] === wi ? shipCall(RF.units[i]) +
    (RF.units[i].hulls > 1 ? " \u00d7" + RF.units[i].hulls : "") + (u.sq ? " (squadron " + u.sq + ")" : "") : "")
    .filter(Boolean).join(", ");
}
/* The fleet pane's squadron and Warlord menus (J216), by unit index. A
   squadron menu on every capital ship once there are two; a Warlord menu on
   every Clanz skwadron once there are two Warlords, and each Warlord's row
   says what he leads. */
export function fleetControlsHTML(RF){
  const out = [];
  const add = (i, h) => { out[i] = (out[i] || "") + h; };
  const caps0 = appState.S.units.map((u, i) => { const R = RF.units[i];
    return R && R.kind === "ship" && !R.squadron && !(R.defence && R.defence.stationary) ? i : -1; }).filter(i => i >= 0);
  /* A Blood Axe tiddla and the escorts it commandeers share a tag too
     (Fleets p. 369, J220) */
  const BA = L().bloodaxe, inSecU = (u, re) => { const sc = listOf(u).secs[u.s]; return !!sc && new RegExp(re, "i").test(String(sc.t).trim()); };
  const com = BA ? appState.S.units.map((u, i) => !u.lst && inSecU(u, BA.sec) ? i : -1).filter(i => i >= 0) : [];
  /* ...and so do tiddla cards of one mixed tiddla ("in any mix desired",
     Fleets p. 372): the letter is what makes two cards one skwadron, since
     a short card no longer joins one by itself (ChatGPT audit RAW-01) */
  const tid = L().clanz ? appState.S.units.map((u, i) => !u.lst && inSecU(u, L().clanz.tiddla) ? i : -1).filter(i => i >= 0) : [];
  /* Clanz (J226): kroozers pair with a button of their own (below), and
     an 'Uge ship, a Rok or a hulk is a skwadron by itself - no letters */
  /* A list whose rules count escort squadrons (L.esq: Rogue Traders,
     Exploration, Pirates and Wolf Packs, Tau Commerce Protection, Demiurg War
     Host): its escort cards take a letter too, since there the letter, not a
     short card by itself, makes a mixed squadron (27.10.2026) */
  const escs = L().esq ? appState.S.units.map((u, i) => { const R = RF.units[i];
    return !u.lst && R && R.kind === "ship" && R.squadron && !R.defence ? i : -1; }).filter(i => i >= 0) : [];
  const caps = L().clanz ? com.concat(tid) : caps0.length >= 2 || escs.length ? caps0.concat(com, tid, escs) : com.concat(tid);
  if(caps.length >= 2){
    /* escorts and capital ships never share a squadron: each card is offered
       the letters of its own kind, and a new letter is free in both */
    const isEsc = i => !!(RF.units[i] && RF.units[i].squadron);
    const all = [], tagsOf = { true: [], false: [] };
    caps.forEach(i => { const t = appState.S.units[i].sq, g = tagsOf[isEsc(i)];
      if(t && all.indexOf(t) < 0) all.push(t); if(t && g.indexOf(t) < 0) g.push(t); });
    tagsOf[true].sort(); tagsOf[false].sort();
    const next = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").filter(c => all.indexOf(c) < 0)[0] || "Z";
    caps.forEach(i => {
      const cur = appState.S.units[i].sq || "", tags = tagsOf[isEsc(i)];
      const opts = [""].concat(tags, tags.indexOf(next) < 0 ? [next] : []);
      add(i, `<div class="uctl aboard"><span class="abl">Squadron</span><select class="sqin" data-u="${i}"
        title="Ships with the same letter form one squadron (Fleets p. 13)">${opts.map(t =>
        `<option value="${esc(t)}"${t === cur ? " selected" : ""}>${t ? (tags.indexOf(t) >= 0 ? "Squadron " + esc(t) :
          "New squadron " + esc(t)) : "No squadron"}</option>`).join("")}</select></div>`);
    });
  }
  const ws = warlordIdx(RF), wa = activeWarlordIdx(RF), CI = ws.length ? clanInfo() : {};
  ws.forEach((wi, k) => {
    const W = (RF.warlords || []).filter(x => x.unit === wi)[0];
    const need = warlordNeeds(W, RF), rr = W ? W.rr : 1, hulk = !!(W && W.hulk);
    const clan = appState.S.units[wi].clan || (W && W.clans && W.clans.length === 1 ? W.clans[0] : "");
    const ship = W && W.ship != null ? shipCall(RF.units[W.ship]) : "";
    const seg = (attr, val, lab, on, tip, off) => `<button type="button" class="segb${on ? " on" : ""}" ${attr}="${wi}" ${val}
      aria-pressed="${on}"${tip ? ` title="${esc(tip)}"` : ""}${off ? " disabled" : ""}>${esc(lab)}</button>`;
    add(wi, `<div class="wlpanel${wi === wa ? " on" : ""}" style="--wl:${warlordColor(appState.S.units[wi], k)}">
      <div class="wlrow"><b class="wlname">Warlord ${k + 1}</b>${ws.length > 1 || wi !== wa
        ? `<button type="button" class="wlact${wi === wa ? " on" : ""}" data-wlactive="${wi}" aria-pressed="${wi === wa}">${
            wi === wa ? "New skwadrons come here" : "Add skwadrons here"}</button>` : `<span class="wlhint">new skwadrons come here</span>`}</div>
      <div class="wlrow"><span class="abl">Re-rolls</span><span class="seg">${[1, 2, 3].map(n =>
        seg("data-wlrr", `data-n="${n}"`, String(n), rr === n, n === 1 ? "One re-roll, included" : (n - 1) + " extra")).join("")}</span>
        <span class="wlhint">each re-roll: one tiddla (escort) skwadron + one other skwadron</span></div>
      <div class="wlrow"><span class="abl">Clan</span><span class="seg wrap">${seg("data-wlclan", `data-c=""`, "None", !clan && !(W && W.clans && W.clans.length > 1))}${
        CLANS.map(c => seg("data-wlclan", `data-c="${esc(c)}"`, c, clan === c,
          hulk && c === "Evil Sunz" ? "Not for a hulk: it gives speed (Fleets p. 390)"
            : (CI[c] ? CI[c].desc + " (" + clanCost(CI[c]) + ")" : "") + " His clan, bought for every skwadron of his;" +
              " a skwadron may leave the benefit unpaid (Fleets p. 369): set its Clan row off under Other fleet-list upgrades.",
          hulk && c === "Evil Sunz" && clan !== c)).join("")}</span></div>
      <div class="wlrow"><span class="abl"></span><ul class="wlclans">${(clan && CI[clan] ? [clan] : CLANS.filter(c => CI[c]))
        .map(c => clanLineHTML(c, CI[c], hulk)).join("")}</ul></div>
      <div class="wlrow"><span class="abl">Skwadrons</span>${skwadronsHTML(RF, wi)}</div>
      <div class="wlrow"><span class="abl">${need.ok ? "Done" : "Needs"}</span><span class="wlneed ${need.ok ? "ok" : "bad"}">${esc(need.text)}</span></div>
      ${ship ? `<div class="wlrow"><span class="abl">Gubbins</span><span class="wlhint">upgrades on his own ship only: ${W.gub || 0} / ${rr}, ${esc(ship)}${
        hulk ? " \u00b7 double cost, none for speed, turning or boarding value (Fleets pp. 372, 390)" : ""} \u00b7 Klaws, Shokk-Attack Lance and Assault Karrier on any capital ship (p. 371)</span></div>` : ""}
    </div>`);
  });
  /* Send to (J232, user 24.10.2026: "next to the drag button there could
     also be ... a send-to drop-down"): beside the grip, the Warlord whose skwadron
     this is; another one sends the whole skwadron to him (sendSkwadron).
     It replaces the Warlord menu under the row (J216) and keeps its class,
     so the old drivers still find it. A hulk's Warlord leads only the hulk
     (Fleets p. 373). */
  const send = out.send = [];
  if(ws.length >= 2) appState.S.units.forEach((u, i) => {
    const w = RF.command && RF.command[i];
    if(w == null || w < 0 || !skwKind(u)) return;
    send[i] = `<select class="wlin wlsend" data-u="${i}" style="--wl:${warlordColor(appState.S.units[w], ws.indexOf(w))}"
      aria-label="Warlord of this skwadron" title="The Warlord whose skwadron this is - pick another to send the whole skwadron to him, with his clan (Fleets pp. 369, 372-373)">${
      ws.map((wi, k) => {
        const W2 = (RF.warlords || []).filter(x => x.unit === wi)[0], cl = appState.S.units[wi].clan || "", off = wi !== w && !!(W2 && W2.hulk);
        return `<option value="${esc(appState.S.units[wi].uid)}"${wi === w ? " selected" : ""}${off ? " disabled" : ""}>${wi === w ? "" : "\u2192 "}Warlord ${k + 1}${
          cl ? " \u00b7 " + esc(cl) : ""}${off ? " (leads his hulk only)" : ""}</option>`; }).join("")}</select>`;
  });
  /* A Warlord aboard an Ork hulk (J232, Fleets p. 390) - Da Ork Clanz and
     Waaagh! alike */
  (RF.aboard || []).forEach(a => {
    const cm = RF.units[a.unit], sh = a.ship != null ? RF.units[a.ship] : null;
    if(!cm || !sh || !/warlord/i.test(String((cm.entry && cm.entry.label) || "")) || !isOrkHulkUnit(sh)) return;
    add(a.unit, `<div class="uctl aboard"><span class="abl">On the hulk</span><span class="wlhint">no doubled boarding value; Maniac Gunners and Looted Torpedoes one weapon system per turn; Extra Powerfields +50; Mad Meks ignore a critical on a 6 (Fleets p. 390)</span></div>`);
  });
  return out;
}
export function factRowsHTML(fs){
  return fs.length ? `<div class="facthd">Fleet facts</div>` + fs.map(f =>
    `<div class="chk fact${f.warn ? " warn" : ""}">
      <span class="dot"></span>
      <span><b>${esc(f.t)}</b><span class="src">${esc(f.s)}</span></span>
      <span class="val">${esc(f.v)}</span></div>`).join("") : "";
}

