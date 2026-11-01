import { SC, WR, v0, val } from "./data.js";
import { SIDECLS, esc, fmt, seg, vis } from "./helpers.js";
import { cols, layout } from "./layout.js";
import { verdict } from "./scenario-page.js";
import { DB, d6, get, prep } from "./state.js";
import { CL_GRPS, FAN_GRPS, app, nav } from "./views.js";
import { widget } from "./widgets.js";

/* ---------------------------------------------------------------- sub-plots (RB p. 124–127)
   Each sub-plot says what to do before the battle (with dice tools), what to remember
   during it, what completes it, and how it changes the turn track. Summarised in our
   own words. "auto": no extra goal, so it counts as completed exactly when the main
   mission is won (the book: win and it is heroic, lose and you are condemned). */
export const SP_TABLES = ["Legacies of War", "Chance Circumstances", "Secret Ploys"];
export const SP = [
  { n: "Gunnery Practice", ren: [1, -1],
    before: ["Roll a D6 for each of your capital ships: on 4+ that ship gets +1 Leadership when it tries to go on Lock On."],
    tools: [{ k: "shiproll", id: "r", l: "Gunnery drill — D6 per capital ship", out: d => d >= 4 ? "+1 Ld for Lock On" : "no bonus" }],
    play: ["Lock On tests: +1 Leadership for the ships that rolled 4+ before the battle."],
    goal: "Inflict at least 1 point of damage on every enemy capital ship." },
  { n: "Extended Duty", ren: [1, 0],
    before: ["Roll a D6 for each of your capital ships: 1 = it starts D3 damage points down; 2 = −1 Leadership for Lock On and Reload Ordnance; 3+ = no effect."],
    tools: [{ k: "shiproll", id: "r", l: "Wear and tear — D6 per capital ship", out: d => d === 1 ? "starts D3 damage points down" : d === 2 ? "−1 Ld for Lock On and Reload Ordnance" : "no effect" }],
    play: ["Ships that rolled 2: −1 Leadership for Lock On and Reload Ordnance."],
    goal: "Destroy or cripple more points of enemy ships than you lose." },
  { n: "Blood Bond", ren: [1, -1],
    play: ["When one of your capital ships is crippled or destroyed, all your other capital ships get +1 Leadership for the next turn."],
    goal: "Finish with fewer than half of your capital ships crippled or destroyed." },
  { n: "Fleet Experience", ren: [1, 0],
    play: ["Ships within 30 cm of your fleet commander’s ship may use his Leadership instead of their own."],
    goal: "Your fleet commander’s ship ends the battle with at least 75% of its starting damage points." },
  { n: "No Quarter!", ren: [1, -1],
    goal: "Cripple or destroy at least half the points value of the enemy fleet." },
  { n: "Vendetta", ren: [1, -2],
    before: ["Nominate one enemy capital ship as the target of your vendetta."],
    tools: [{ k: "text", id: "who", l: "Vendetta target" }],
    goal: "Cripple or destroy the nominated ship." },

  { n: "Meteor Storm!", ren: [3, -2], auto: 1,
    start: ["At the start of the game, roll a D6 for each of your capital ships: on 1–3 it rolls once on the Critical Damage table."],
    tools: [{ k: "shiproll", id: "r", l: "Meteor storm — D6 per capital ship", out: d => d <= 3 ? "roll once on the Critical Damage table" : "unharmed" }],
    goal: "No extra goal. Win anyway and it is a heroic victory; lose and you are blamed for poor navigation." },
  { n: "Signalling Problems", ren: [1, -1],
    play: ["Fleet commander re-rolls only for squadrons with a ship within 30 cm of your fleet commander’s ship."],
    goal: "At least half of your fleet’s escorts survive." },
  { n: "Unexpected Help", ren: [0, -2],
    before: ["Add one capital ship or escort squadron worth up to D3×50 pts to your fleet before deployment."],
    tools: [{ k: "val", id: "pts", l: "Reinforcement budget — D3×50 pts", opts: [50, 100, 150], roll: () => 50 * Math.ceil(d6() / 2), unit: " pts" }],
    goal: "At least one ship from the reinforcement survives without being crippled or destroyed." },
  { n: "Navigational Hazards", ren: [1, -1], auto: 1,
    before: ["Roll a D6 and add celestial phenomena to the table before deployment."],
    tools: [{ k: "roll", id: "nav", l: "Extra phenomena", sub: "D6", rows: () => [[1, 2, "One extra gas/dust cloud"], [3, 4, "Two extra gas/dust clouds"], [5, 5, "One extra asteroid field"], [6, 6, "One extra asteroid field and D3 gas/dust clouds"]] }],
    goal: "No extra goal. Win and you are praised for using the terrain; lose and you are blamed for it." },
  { n: "Fresh Captain", ren: [1, -1],
    before: ["Pick one of your capital ships at random, not the fleet commander’s: it has −1 Leadership."],
    tools: [{ k: "rand", id: "ship", l: "Random capital ship (not the commander’s)" }],
    play: ["The fresh captain’s ship: −1 Leadership."],
    goal: "That ship cripples or destroys enemy ships worth at least its own points value." },
  { n: "Enemy Plans", ren: [1, -1],
    play: ["Each boarding action against an enemy capital ship: roll a D6, on 4+ you find the plans (+1 if it is the enemy fleet commander’s ship)."],
    goal: "Capture the enemy’s battle plans." },

  { n: "Surprise Attack!", ren: [2, -2], auto: 1,
    before: ["Roll a D3: the enemy may not use special orders for that many turns."],
    tools: [{ k: "val", id: "d3", l: "Turns without enemy special orders — D3", opts: [1, 2, 3], roll: () => Math.ceil(d6() / 2), unit: "" }],
    turn: (T, g) => { const n = g("d3"); return n ? (T <= n ? [["enemy", "No special orders (enemy Surprise Attack!, turns 1–" + n + ")"]] : []) : T === 1 ? [["own", "Roll the Surprise Attack! D3 (Sub-plots tab)"]] : []; },
    goal: "No extra goal. Win and your plan is praised; lose and it is called hasty." },
  { n: "Secret Intelligence", ren: [0, -1],
    before: ["Take one extra fleet commander re-roll for this battle.", "Nominate one enemy capital ship where your informant is hiding."],
    tools: [{ k: "text", id: "who", l: "Informant’s ship" }],
    goal: "Board that ship, or make a hit-and-run attack on it at least once." },
  { n: "Experimental Ship", ren: [1, -1],
    before: ["Pick one of your capital ships at random: it carries an untested system.", "Roll a D6 for its improvement and a D6 for its side effect. Re-roll a side effect that contradicts the improvement."],
    tools: [
      { k: "rand", id: "ship", l: "Random capital ship" },
      { k: "roll", id: "imp", l: "Improvement", sub: "D6", rows: () => [[1, 1, "Weapon batteries and lances +50% range"], [2, 2, "+1 shield"], [3, 3, "Speed +5 cm"], [4, 4, "+2 damage"], [5, 5, "May make 90° turns"], [6, 6, "+1 Leadership"]] },
      { k: "roll", id: "side", l: "Side effect", sub: "D6", rows: () => [[1, 1, "−1 shield"], [2, 2, "Weapon batteries and lances at 50% range"], [3, 3, "−2 damage"], [4, 4, "Speed −5 cm"], [5, 5, "−1 Leadership"], [6, 6, "Weapon battery firepower and lance strength halved (round up)"]] }
    ],
    goal: "Keep the experimental ship from being crippled or destroyed." },
  { n: "Desperate Mission", ren: [1, -1],
    before: ["Nominate one of your capital ships for the desperate mission."],
    tools: [{ k: "text", id: "who", l: "Ship on the mission" }],
    goal: "Keep that ship from being crippled or destroyed." },
  { n: "Decoy", ren: [1, -1],
    before: ["Add an extra capital ship to your fleet that is really a transport. Keep secret which one until it fires or is fired at. It is worth 0 VP."],
    tools: [{ k: "text", id: "who", l: "Which model is the decoy (keep this hidden)" }],
    goal: "The enemy fires at the decoy with a capital ship." },
  { n: "Hit-and-Run", ren: [1, -1],
    before: ["Roll 2D6: you must win within that many turns."],
    tools: [{ k: "val", id: "h", l: "Turns to win — 2D6", opts: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], roll: () => d6() + d6(), unit: "" }],
    turn: (T, g) => { const n = g("h"); if (!n) return T === 1 ? [["own", "Roll the Hit-and-Run 2D6 (Sub-plots tab)"]] : []; return T === n ? [["own", "Hit-and-Run: last turn to win"]] : T > n ? [["own", "Hit-and-Run deadline has passed"]] : []; },
    goal: "Win the battle within the rolled number of turns." }
];
export const SP_RESULT = { yy: "Heroic Victory!", yn: "Victory!", ny: "Heroic Defeat!", nn: "Miserable Defeat!" };

/* sides that can take a sub-plot: the two main fleets */
export function spSides(sc) { return ["a", "b"].filter(k => sc.sides[k]); }
export function spState(st, side) { if (!st.sp) st.sp = {}; if (!st.sp[side]) st.sp[side] = {}; return st.sp[side]; }
export function spOf(st, side) { const p = st.sp && st.sp[side]; return p && p.t >= 0 && p.e ? SP[p.t * 6 + p.e - 1] : null; }
export function spKey(side, id) { return "sp_" + side + "_" + id; }
export function spTools(sc, st) {
  const out = [];
  for (const side of spSides(sc)) { const p = spOf(st, side); if (p && p.tools) p.tools.forEach(t => out.push(Object.assign({}, t, { id: spKey(side, t.id), side }))); }
  return out;
}
export function spHidden(st, side) { return !!(st.sp && st.sp[side] && st.sp[side].hide); }
/* set-up steps contributed by sub-plots: "before" go first, "start" just before the first turn */
export function spSteps(sc, st, when) {
  const out = [];
  for (const side of spSides(sc)) {
    const p = spOf(st, side); if (!p) continue;
    if (spHidden(st, side)) { if (when === "before" && (p.before || p.start)) out.push({ s: side, k: "sp_" + side + "_h", t: "Secret sub-plot: do its preparations (Sub-plots tab).", sp: 1 }); continue; }
    (p[when] || []).forEach((t, i) => out.push({ s: side, k: "sp_" + side + "_" + when + i, t: "Sub-plot " + p.n + ": " + t + (p.tools ? " (tool in the Sub-plots tab)" : ""), sp: 1 }));
  }
  return out;
}
export function allSteps(sc, st, v) {
  const base = sc.steps.filter(x => vis(x, v));
  return spSteps(sc, st, "before").concat(base.slice(0, -1), spSteps(sc, st, "start"), base.slice(-1));
}
export function spPlay(sc, st) {
  const out = [];
  for (const side of spSides(sc)) {
    const p = spOf(st, side); if (!p) continue;
    if (spHidden(st, side)) { out.push({ w: "Secret sub-plot", s: side, t: "Its rules are in the Sub-plots tab." }); continue; }
    (p.play || []).forEach(t => out.push({ w: "Sub-plot: " + p.n, s: side, t }));
    out.push({ w: "Sub-plot goal: " + p.n, s: side, t: p.goal });
  }
  return out;
}
export function spTurn(sc, st, T) {
  const out = [];
  for (const side of spSides(sc)) {
    const p = spOf(st, side); if (!p || !p.turn) continue;
    const other = side === "a" ? "b" : "a";
    p.turn(T, id => get(st, spKey(side, id), 0)).forEach(([who, txt]) => {
      if (who === "own" && spHidden(st, side)) return;
      out.push([who === "own" ? side : other, txt]);
    });
  }
  return out;
}

/* sources page (#/sources): what the books, the magazine and the badges are */
export function renderSources() {
  nav.innerHTML = "<a class='back' href='#/'>‹ Scenarios</a>";
  document.title = "Sources · Scenario Library";
  const cnt = g => SC.filter(s => s.grp === g).length;
  const sec = (t, body) => "<div class='wg srcsec'><h3>" + t + "</h3>" + body + "</div>";
  let h = "<div class='shead'><div class='series'>Where the scenarios come from</div><h1>Sources</h1></div>";
  h += "<p class='intro'>Battlefleet Gothic is no longer published, so its rules and scenarios now live in community documents. Every scenario here names its source and page, and this page explains what those sources are and how far to trust them.</p>";
  h += "<div class='srcgrid'>";
  h += sec("Battlefleet Gothic", "<p>Games Workshop’s game of fleet battles in the 41st millennium, first released in 1999. The rulebook credits the game to Andy Chambers, Gavin Thorpe, Jervis Johnson, Matt Keefe, Andy Hall, Pete Haines, Tim Adcock, Warwick Kinrade, Bob Henderson, Ray Bell and Nate Montes (RB p. 3). The supplement <i>Armada</i> followed in 2004 and a digital rulebook in 2007. Games Workshop no longer supports the game; the community keeps it alive.</p>");
  h += sec("BFG Remastered — Rulebook v1.11 and Fleets v0.40 <span class='badge t-rulebook'>RB · FL</span>",
    "<p>The current edition of the rules, used today as the official rules of the game. It combines the 2007 digital rulebook, the campaigns of <i>Armada</i> and the 2010 Compendium into two free PDFs, the <b>Rulebook</b> (RB) and the <b>Fleets</b> book (FL). Unclear rules are settled in FAQ runs (RB p. 4). The 2026 FAQ names v1.10 and v0.36 as the current versions, and every page number in this app refers to them.</p>" +
    "<p class='small muted'>From the rulebook: the " + cnt("core") + " core scenarios (RB p. 128–143), the three Third Armageddon War scenarios (RB p. 178–181), which first appeared in <i>Armada</i>, and the seven 13th Black Crusade scenarios (RB p. 191–199). From the Fleets book: the six Rogue Trader scenarios and their convoy threat tables (FL p. 208–221) and Craftworld Assault (FL p. 336–339). On the scenario list the campaigns and the Fleets book scenarios share the <b>Books</b> category.</p>");
  h += sec("Classic Games Workshop publications <span class='badge t-classic'>Classic GW</span>",
    "<p>Between 1999 and 2008 Games Workshop published a steady stream of Battlefleet Gothic scenarios outside the rulebooks: in <i>White Dwarf</i> (collected in <i>Warp Storm</i>, 2000), in the <i>Planet Killer</i> fanzine and <i>Battlefleet Gothic Magazine</i> from Fanatic Press (2000–2004), in the <i>Invasion</i> booklet and the <i>2002 Annual</i>, and finally in <i>Fanatic Magazine</i> and on the <i>Fanatic Online</i> website (2004–2008). Many were written by players, several of whom later joined the rules committee.</p>" +
    "<p>They were official publications in their day, but they were written for the original 1999 rules or for <i>Armada</i>, not for Remastered. Where a rule has since changed or moved, the scenario page says so in a source note, and page references to old books are given as their Remastered equivalents where one exists. Scenarios that were later reprinted in the Remastered books (the Armageddon scenarios, Craftworld Assault, Hunter and the Prey) appear only once, under the book. The <i>2002 Annual</i> reprinted earlier material, so it adds no scenarios of its own.</p>" +
    "<p class='small muted'>Page numbers are PDF pages of the scans in circulation. " + SC.filter(s => CL_GRPS.includes(s.grp)).length + " classic scenarios in this app.</p>");
  h += sec("Warp Rift <span class='badge bk'>WR</span>",
    "<p>A free fan magazine for Battlefleet Gothic, published as PDF since April 2004 — 49 issues by June 2026. It is put together by a small team of players: founded by Cybershadow and edited by Roy “horizon” Amkreutz. Issues carry fleet lists, scenarios, campaigns, tactics, painting and fiction.</p>" +
    "<p>Being a fan magazine, Warp Rift is <b>not</b> an official rules source: its articles are written by whoever submits one, and they all have the same fan-work status. On the scenario list Warp Rift is one category, in issue order. Tags add what the source says: <b>Rules writer</b> (the author also writes the rules), <b>Lore competition</b>, <b>Community</b>, <b>Played</b> and <b>Play both sides</b> — search for any of them. The one exception to fan-work status is issue 48’s <i>Armada Indomitus: Codex Orks</i>, which the magazine credits to the BFG Rules Review Committee; it reprints and updates the Armageddon scenarios.</p>" +
    "<p class='small muted'>All issues can be downloaded free from <a href='" + WR + "' target='_blank' rel='noopener'>specialist-arms.com/bfg/warprift</a>. Page numbers here are PDF pages (in issues 1–10 the printed number is one lower).</p>");
  h += sec("Fan supplements <span class='badge t-fan'>Fan supplement</span>",
    "<p>Players have also written whole supplements of their own. Like Warp Rift, they are fan work, not official rules. Most of the ships they name are now in the Fleets book; where a scenario needs something the books do not have, its page gives the source’s profile and a book alternative.</p>" +
    "<ul class='plain'><li><b>Tournament Mission Pack</b> and <b>Advanced Scenarios</b>: the missions of the AdeptiCon Battlefleet Gothic tournaments (2007–2016), collected by Paolo Barbero for the Babafleet Gothic group of the Baba Yaga Dungeon Club (Alessandria, Italy). <i>Advanced Scenarios</i> revises six of them; each of those six appears here once, with both versions.</li>" +
    "<li><b>Book of Nemesis</b> (2007): rules and scenarios of the Polish Cypra Probatii community, edited by Marcin “MKG” Gerkowicz — the Gehenna campaign’s special scenarios and the historical, tournament and special scenarios.</li>" +
    "<li><b>Project Distant Darkness</b> with its <b>Chapter I: The Art of Command</b> and <b>Chapter II: Distant Sun</b>: Tau narrative scenarios by Roy “horizon” Amkreutz and Chris “Zhai Morenn” Lautermilch, one running story in three parts.</li>" +
    "<li><b>Starblade</b>: a nine-scenario Craftworld Eldar series by Roy “horizon” Amkreutz.</li>" +
    "<li><b>Book of the Void I: The Discordia Incident</b> and <b>II: Xenos Tide</b>: the Discordia sector books of the Battlefleet Gothic Discord community — the Diasporex, Adepta Sororitas, Grot Rev’looshun, Mercantile, Demiurg, Rak’Gol and Helian fleets, with historical and bonus scenarios. All the scenarios in both are by Roy “horizon” Amkreutz; book I’s project leads were Robert C. M. “Zelnik” Passovoy, Lucas F. “Fr05ty” Zocco and horizon, and book II is largely horizon’s own.</li></ul>" +
    "<ul class='plain'><li><b>BBGM</b> (version May 2026): a compilation of house rules, FAQs and errata by Bear, BinExis, DarthGoogle and Mazilka, built on the original rules and FAQ 2007. Seven of its scenarios have their own cards here. Five more are a Version switch on the existing card: Escalating Engagement, Blockade Run, The Bait, Retrieval and Exterminatus. Convoy and Fleet Engagement differ too little to add.</li></ul>" +
    "<p>Project Distant Darkness, Starblade and Book of the Void carry the <b>Rules writer</b> tag, as horizon also writes the rules; the tag says who wrote a scenario, not where it was published.</p>" +
    "<p><b>Open the original.</b> A scenario page links to the source where its authors or the community share it: the Remastered books and Warp Rift issues 1–47 at specialist-arms.com, opening at the scenario’s page, and the fan supplements through the community’s <i>BFG Scenario Listing</i> (Project Distant Darkness and Starblade as horizon shares them). The classic Games Workshop and Fanatic publications have no authorised download, Book of the Void is shared on horizon’s public Google Drive, and Warp Rift 48–49 are on their way to specialist-arms.com — until they are linked here, those pages give the reference only. This app never hosts copies of the sources.</p>" +
    "<p class='small muted'>The supplements circulate as free PDFs; the community’s <i>BFG Scenario Listing</i> links them. Page numbers are PDF pages. " + SC.filter(s => FAN_GRPS.includes(s.grp)).length + " fan supplement scenarios in this app.</p>");
  h += sec("The High Admiralty",
    "<p>The volunteer rules committee for Battlefleet Gothic, responsible for the 2010 FAQ/Compendium (written by Bob Henderson, Ray Bell and Nate Montes, RB p. 3). Warp Rift 48 names the BFG Rules Review Committee as Bob Henderson, Ray Bell, Nate Montes and Roy Amkreutz. Rules questions are still answered, most recently in the <i>Collected FAQ 2026</i>.</p>");
  h += sec("What the sources leave open",
    "<p>Many scenarios leave something out: who goes first, how long the game lasts, how deep the deployment zones are. Their Set-up tab lists these under <i>Agree before you start</i>, each with a default you can change. Where the books have a matching case, the default comes from it with its page (for example, the first turn is rolled off as in RB p. 143); otherwise it is marked <i>Our suggestion</i>. The agreed values show up in the steps, on the map and on the Play tab.</p>");
  h += sec("Badges in this app",
    "<table class='ltab'>" +
    "<tr><td><span class='badge t-rulebook'>Rulebook</span></td><td>Printed in the BFG Remastered Rulebook v1.11 — as official as it gets.</td></tr>" +
    "<tr><td><span class='badge t-fleets'>Fleets book</span></td><td>Printed in the BFG Remastered Fleets book v0.40, the rulebook’s companion.</td></tr>" +
    "<tr><td><span class='badge t-classic'>Classic GW</span></td><td>Published by Games Workshop or its Fanatic imprint between 1999 and 2008, for the original rules.</td></tr>" +
    "<tr><td><span class='badge t-wr'>Warp Rift</span></td><td>From the Warp Rift fan magazine. Everything in it is fan work, whoever wrote it.</td></tr>" +
    "<tr><td><span class='badge t-fan'>Fan supplement</span></td><td>From a fan-made supplement or tournament pack outside Warp Rift. Fan work, like Warp Rift.</td></tr>" +
    "<tr><td><span class='chip tag'>Agree first</span></td><td>Tag: the victory condition, or the scenario as a whole, depends on something the source leaves open — settle it before you start.</td></tr>" +
    "<tr><td><span class='chip tag'>Linked games optional</span></td><td>Tag: written to be linked with another game (Warhammer 40,000, Kill Team…); the page says how to play the space battle on its own.</td></tr>" +
    "<tr><td><span class='chip tag'>Community</span></td><td>Tag: written by a Warp Rift reader; Played when the source mentions playing it.</td></tr>" +
    "<tr><td><span class='chip tag'>Fan rules optional</span></td><td>Tag: written for fan-made ships or rules, but the books offer a clear alternative, given on the page.</td></tr>" +
    "<tr><td><span class='chip tag'>Rules writer</span></td><td>Tag: the author also writes the rules (a High Admiralty / rules committee member or a Remastered author) — on Warp Rift articles and on fan supplements alike. Still a personal work, not a committee release.</td></tr>" +
    "<tr><td><span class='chip tag'>Played</span></td><td>Tag: the source mentions a battle report, play-testing or a club that played it.</td></tr>" +
    "<tr><td><span class='chip tag'>Lore competition</span></td><td>Tag: from Warp Rift’s Shadowsun competition, built on published background.</td></tr>" +
    "<tr><td><span class='chip tag'>Tournament</span></td><td>Tag: written for tournament play — equal fleets, a time limit and battle points. The page also gives the plain victory point result.</td></tr>" +
    "<tr><td><span class='chip tag'>Fixed forces</span></td><td>Tag: the source lists the exact ships, often named; the page says how to play it with your own fleets.</td></tr>" +
    "<tr><td><span class='chip tag'>Play both sides</span></td><td>Tag: lopsided on purpose — the author suggests playing it twice, swapping sides, and comparing victory points.</td></tr>" +
    "<tr><td><span class='badge bk'>Book rules only</span></td><td>Needs nothing beyond the Rulebook and Fleets books.</td></tr>" +
    "<tr><td><span class='badge bk'>Book + scenario rules</span></td><td>Also uses special rules written into the scenario itself — all of them are on its page here.</td></tr>" +
    "<tr><td><span class='badge bk'>Needs fan rules</span></td><td>Can only be played with fan-made fleets or rules; the scenario page gives them where the source prints them. When the books offer a clear alternative, the scenario is marked Book + scenario rules instead.</td></tr>" +
    "<tr><td><span class='badge bk'>Needs Warhammer 40,000</span></td><td>A linked pair: part of the story is fought out as a game of Warhammer 40,000. The 40K half is summarised on the scenario page.</td></tr>" +
    "<tr><td><span class='chip any'>Any fleets</span></td><td>Written for any fleet list. Other scenarios name the fleets they were written for as a suggestion; any fleets can play them.</td></tr>" +
    "</table><p class='small muted'>Where a source is unclear or contradicts itself, the scenario page says so in a <b>Source notes</b> box instead of quietly picking one reading. Notes marked <b>Suggestion</b> are ours, not the source’s.</p>");
  h += sec("Abbreviations", "<p>RB = Rulebook v1.11 · FL = Fleets v0.40 · WR = Warp Rift · VP = victory points · Ld = Leadership.</p>");
  h += "</div>";
  h += "<p class='small muted'>Credit for every scenario belongs to its authors, named on each scenario page. This app summarises them in its own words for play at the table.</p>";
  app.innerHTML = h;
}

/* standalone sub-plots page (#/subplots): Player 1 / Player 2 without a scenario */
export const FREE_SC = { id: "_free", sides: { a: { n: "Player 1" }, b: { n: "Player 2" } }, tools: [], rtools: [], stools: [] };
export function freeSt() { if (!DB.free) DB.free = { turn: 1, v: "std", done: {}, w: {} }; return DB.free; }
export function renderSubplots() {
  nav.innerHTML = "<a class='back' href='#/'>‹ Scenarios</a>";
  document.title = "Sub-plots · Scenario Library";
  const st = freeSt();
  let h = "<div class='shead'><div class='series'>Rulebook p. 124–127</div><h1>Sub-plots</h1></div>";
  h += "<p class='intro'>A sub-plot is a second, personal goal on top of the scenario: something to prepare before the battle, a rule to remember during it, and a goal that turns a win into a heroic one — or a loss into an honourable one. Playing a scenario from this library? Use its own Sub-plots tab instead: the preparations, reminders and turn effects then appear inside the scenario.</p>";
  let A = subplotsView(FREE_SC, st, "std");
  A += "<h2>How it ends</h2><table class='ltab'><tr><td>Both</td><td>Main mission and sub-plot: <b>Heroic Victory!</b></td></tr><tr><td>Main</td><td>Main mission only: <b>Victory!</b></td></tr><tr><td>Sub-plot</td><td>Sub-plot only: <b>Heroic Defeat!</b></td></tr><tr><td>Neither</td><td><b>Miserable Defeat!</b></td></tr></table>" +
    "<p class='small muted'>In a campaign each sub-plot also gains or loses renown, shown as +gain / −loss (RB p. 125).</p>";
  let B = "<h2>All sub-plots</h2>";
  SP_TABLES.forEach((tn, ti) => {
    B += "<h3 style='margin:14px 0 6px'>" + esc(tn) + " <span class='muted small'>(D6 " + ["1–2", "3–4", "5–6"][ti] + ")</span></h3>";
    for (let e = 1; e <= 6; e++) {
      const x = SP[ti * 6 + e - 1], prep = (x.before || []).concat(x.start || []);
      B += "<details class='spbrowse'><summary><span class='n'>" + e + "</span><b>" + esc(x.n) + "</b><span class='muted small'>renown +" + x.ren[0] + " / " + (x.ren[1] ? "−" + Math.abs(x.ren[1]) : "0") + "</span></summary>" +
        (prep.length ? "<div class='sph2'>Before the battle</div><ul class='plain'>" + prep.map(t => "<li>" + fmt(t) + "</li>").join("") + "</ul>" : "") +
        "<div class='sph2'>During the battle</div>" + (x.play && x.play.length ? "<ul class='plain'>" + x.play.map(t => "<li>" + fmt(t) + "</li>").join("") + "</ul>" : "<p class='calc' style='margin:0'>No special rule.</p>") +
        "<div class='sph2'>To complete it</div><p style='margin:0'>" + fmt(x.goal) + "</p></details>";
    }
  });
  app.innerHTML = h + (layout() === "narrow" ? A + B : cols([[A], [B]], "c-sp even"));
}

export function subplotsView(sc, st, v) {
  const free = sc.id === "_free";
  let h = "<p class='small muted' style='margin-top:14px'>Optional: each player may roll one sub-plot (in a campaign both must). D6 for the table — 1–2 Legacies of War, 3–4 Chance Circumstances, 5–6 Secret Ploys — then a D6 on it." + (free ? "" : " Its preparations, reminders and turn effects appear in the other tabs.") + "</p>";
  h += "<div class='spgrid'>";
  for (const side of spSides(sc)) {
    const ps = spState(st, side), p = spOf(st, side), sn = sc.sides[side].n, cls = SIDECLS[side];
    h += "<div class='wg spcard'><div class='sphead'><h3 class='" + cls + "'>" + esc(sn) + "</h3>" +
      (p ? "<button class='btn' data-a='sph' data-side='" + side + "'>" + (ps.hide ? "Show" : "Hide from opponent") + "</button>" : "") + "</div>";
    if (ps.hide && p) { h += "<div class='shown'>Sub-plot hidden ••••••</div></div>"; continue; }
    h += "<div class='rollrow'>" + seg("sps", side, [0, 1, 2], ps.t === undefined ? -1 : ps.t, ["1–2 Legacies", "3–4 Chance", "5–6 Secret"]) + "<button class='btn' data-a='spr' data-side='" + side + "'>Roll both</button>" + (p ? "<button class='btn' data-a='spn' data-side='" + side + "'>None</button>" : "") + "</div>" +
      "<div class='faces'>" + [1, 2, 3, 4, 5, 6].map(n => "<button class='face' data-a='spf' data-side='" + side + "' data-f='" + n + "' aria-pressed='" + (ps.e === n) + "'>" + n + "</button>").join("") + "</div>";
    if (ps.t >= 0) h += "<div class='sub'>" + esc(SP_TABLES[ps.t]) + ": " + [1, 2, 3, 4, 5, 6].map(n => n + " " + SP[ps.t * 6 + n - 1].n).join(" · ") + "</div>";
    if (!p) { h += "<p class='calc'>No sub-plot. Pick a table and a die, or roll both.</p></div>"; continue; }
    const ren = "renown +" + p.ren[0] + " / " + (p.ren[1] ? "−" + Math.abs(p.ren[1]) : "0");
    h += "<div class='subplot'><b>" + esc(p.n) + "</b> <span class='muted'>· " + esc(SP_TABLES[ps.t]) + " · " + ren + "</span>";
    const prep = (p.before || []).concat(p.start || []);
    if (prep.length) h += "<div class='sph2'>Before the battle</div><ul class='plain'>" + prep.map(t => "<li>" + fmt(t) + "</li>").join("") + "</ul>";
    if (p.tools) h += p.tools.map(t => widget(sc, st, v, Object.assign({}, t, { id: spKey(side, t.id), side }))).join("");
    h += "<div class='sph2'>During the battle</div>" + (p.play && p.play.length ? "<ul class='plain'>" + p.play.map(t => "<li>" + fmt(t) + "</li>").join("") + "</ul>" : "<p class='calc' style='margin:0'>No special rule.</p>");
    if (p.turn && !free) h += "<p class='small muted' style='margin:4px 0 0'>Shown on the turn track in Play.</p>";
    h += "<div class='sph2'>To complete it</div><p style='margin:0'>" + fmt(p.goal) + "</p>" +
      (p.auto ? "<p class='small muted' style='margin:4px 0 0'>Completed when you win the main mission.</p>" : widget(sc, st, v, { k: "obj", id: spKey(side, "goal"), l: "Sub-plot goal" })) + "</div></div>";
  }
  return h + "</div>";
}

/* result: main mission x sub-plot per side */
export function spResultBlock(sc, st, v, main) {
  const sides = spSides(sc).filter(s => spOf(st, s));
  if (!sides.length) return "<h2>Sub-plots</h2><p class='small muted'>No sub-plots in this game. Add them in the Sub-plots tab.</p>";
  let win = main[0] === "a" || main[0] === "b" ? main[0] : main[0] === "draw" ? "draw" : get(st, "mainwin", "");
  let h = "<h2>Sub-plots</h2>";
  if (!(main[0] === "a" || main[0] === "b" || main[0] === "draw"))
    h += "<div class='wg'><h3>Who won the main mission?</h3>" + seg("mw", "mainwin", spSides(sc).concat(["draw"]), win, spSides(sc).map(s => sc.sides[s].n).concat(["Draw"])) + "</div>";
  for (const side of sides) {
    const p = spOf(st, side), g = p.auto ? (win === side ? "y" : win && win !== "draw" ? "n" : "") : get(st, spKey(side, "goal"), "");
    const m = win === side ? "y" : win && win !== "draw" ? "n" : "";
    let res = !m && win !== "draw" ? "Mark who won the main mission." : "Mark the sub-plot goal.";
    if (win === "draw") res = "Draw: the sub-plot results assume a win or a loss (RB p. 124) — agree how to count it.";
    else if (m && g) res = SP_RESULT[m + g] + (g === "y" ? " Renown +" + p.ren[0] : p.ren[1] ? " Renown −" + Math.abs(p.ren[1]) : " Renown ±0");
    h += "<div class='wg'><h3 class='" + SIDECLS[side] + "'>" + esc(sc.sides[side].n) + " · " + esc(spHidden(st, side) ? "secret sub-plot" : p.n) + "</h3>" +
      (p.auto ? "<p class='calc' style='margin:0 0 6px'>Counts as completed if you win the main mission.</p>" : widget(sc, st, v, { k: "obj", id: spKey(side, "goal"), l: spHidden(st, side) ? "Sub-plot goal" : p.goal })) +
      "<div class='verdict " + (m === "y" ? side : m === "n" ? "" : "") + "' style='margin:6px 0 0'><span class='k'>With sub-plot</span>" + esc(res) + "</div></div>";
  }
  h += "<p class='small muted'>Main mission and sub-plot: Heroic Victory. Main only: Victory. Sub-plot only: Heroic Defeat. Neither: Miserable Defeat. Renown counts in a campaign (RB p. 124–125).</p>";
  return h;
}
