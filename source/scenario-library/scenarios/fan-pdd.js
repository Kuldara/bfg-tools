/* Fan supplements: Project Distant Darkness, the Tau supplement by Roy "horizon" Amkreutz and
   Chris "Zhai Morenn" Lautermilch — the nine scenarios of "For the Greater Good: Revival" (p. 19–29)
   and the seven of Chapter II, "Distant Sun" (p. 9–51). Fixed forces, a running story.
   The Tau ship designs became the Kor'or'vesh list of the Fleets book (FL p. 456–478); the supplement's
   own extras (characters, Mantis, Marauder, Tigersharks) are given on the pages with a book alternative.
   Page numbers are PDF pages. Summarised in our own words; every scenario is hand-made (see LUEMINUT.md). */
(function () {
  const REV = "Project Distant Darkness — For the Greater Good: Revival, a Tau fan supplement by Roy “horizon” Amkreutz (project lead) and Chris “Zhai Morenn” Lautermilch (project advisor), with a cover by Erwin Leufkens and photo work by Jack Watling.";
  const SUN = "Project Distant Darkness: Distant Sun (Chapter II), written by Roy “horizon” Amkreutz and Chris “Zhai Morenn” Lautermilch; art and page design by K. “Khar” Górniak, writing advice by Mark “Valhallan” Hehlen and Darth Drac. Its scenarios were play-tested by Sergey “Bear” Filippov, Anton “Mazila” Reutov, Pavel “Pabloddon” Grebeshev and Sergey “adm. Kanaris” Medvedev.";
  const OTHERS_T = "Written for the Distant Darkness Tau, whose ships are now the Fleets book’s Kor’or’vesh list (FL p. 456). Any fleets can play with ships of similar size; the supplement’s own extras are on the page with a book alternative.";
  const REVP = n => "Project Distant Darkness p. " + n;
  const SUNP = n => "Distant Sun p. " + n;
  /* the supplement's characters (Revival p. 17; Distant Sun p. 3) */
  const CHARS_REV = "<h3>Distant Darkness commanders (Revival p. 17)</h3><ul class='plain small'>" +
    "<li><b>Kor’O Ry’zon</b>, Ld 9, 1 re-roll — elite command crew: once per battle his ship passes a Leadership test or command check without rolling.</li>" +
    "<li><b>Kor’vre L’ikei</b>, Ld 8, 2 re-rolls — after deployment, one capital ship or escort squadron may be redeployed up to its full speed.</li>" +
    "<li><b>Kor’vre Nua’ta</b>, Ld 8, 1 re-roll — ambush specialist: for the first two turns his ship is on the table, its attacks get +1 to the critical hit roll.</li>" +
    "<li><b>Kor’el Tas’ka</b>, Ld 8, 1 re-roll — strike craft admiral: her ship may merge its waves of attack craft into larger ones, up to its number of launch bays.</li>" +
    "<li><b>Kor’vre Sheva’s</b>, Ld 8, 1 re-roll — arrogant: his ship tests Brace for Impact at −2 Ld. Boarding: +1, and no halving in combined boarding actions.</li></ul>" +
    "<p class='small muted' style='margin:6px 0 0'>Book alternative: any Tau commander from the Kor’or’vesh list (FL p. 456), with the Leadership above.</p>";
  const CHARS_SUN = "<h3>The five in Distant Sun (p. 3)</h3><ul class='plain small'>" +
    "<li><b>Kor’O Ry’zon</b>, Ld 10 — elite command crew: once per battle, pass a Leadership test or command check without rolling.</li>" +
    "<li><b>Kor’el L’ikei</b>, Ld 9 — expert pilot: Come to New Heading without halving weapons.</li>" +
    "<li><b>Kor’el Nua’ta</b>, Ld 9 — survival instinct: re-roll a failed Brace for Impact.</li>" +
    "<li><b>Kor’el Tas’ka</b>, Ld 9 — strike craft admiral: merge waves launched from up to three other ships into one.</li>" +
    "<li><b>Kor’el Sheva’s</b>, Ld 9 — elite Fire Warrior crew: +1 in boarding actions.</li></ul>" +
    "<p class='small muted' style='margin:6px 0 0'>Shared re-rolls: 1 with one or two of them in the battle, 2 with three or four, 3 with all five. They may join and leave squadrons with each other during the game. All fly Protector class cruisers (FL p. 470); Ry’zon’s carries Tigershark fighter-bombers instead of Mantas.</p>";
  const TIGER = "Tigershark fighter-bombers (Revival p. 15): a ship with Mantas may swap them for Tigersharks at no cost. Speed 25 cm; they work as fighter-bombers, each marker making D3 attacks +1 per turret of its carrier (at most +3). Book alternative: keep the Mantas.";
  const MANTIS = "<h3>Il’Porrui Mantis (Revival p. 11, 16)</h3><p class='small' style='margin:0 0 6px'>Light cruiser, 150 pts: 4 hits, 25 cm, 90°, shields 1, armour 6+ prow / 5+, turrets 1. Port and starboard railgun batteries 30 cm, 2 each, front; dorsal launch bay, 1 Barracuda squadron; prow gravitic missiles 20–40 cm, strength 3. Prow deflector, integrated tracking systems.</p>" +
    "<p class='small' style='margin:0'><b>Experimental stealth system:</b> the ship may stay off the table in warp space. In any of its movement phases, place a marker anywhere: it moves at normal speed and cannot shoot or be attacked. In a later movement phase it may dive into real space, facing any way, and then moves and fights as usual. It may dive back out at the start of a movement phase. Each dive, in or out, fails on a 4+: the ship stays where it is for the rest of the battle — a failed dive out of the warp means it counts as disengaged.</p>" +
    "<p class='small muted' style='margin:6px 0 0'>Book alternative: an Il’porrui (Emissary), FL p. 472, keeping the stealth system as a scenario rule.</p>";
  const MARAUDER = "<h3>Il’Porrui Marauder (Revival p. 11, 16)</h3><p class='small' style='margin:0 0 6px'>Light cruiser, 130 pts: 4 hits, 25 cm, 90°, shields 1, armour 6+ prow / 5+, turrets 2. Prow railgun battery 45 cm, 2; gravitic missiles 20–40 cm — prow 3, port 2, starboard 2; dorsal launch bay, 1 Barracuda squadron. Prow deflector, integrated tracking systems.</p>" +
    "<p class='small' style='margin:0'><b>Advanced missile system:</b> it may fire its missiles from low orbit to bombard the planet, as barrage bombs (FL p. 20) that ignore shields and follow the normal Tau missile rules, but then fires nothing else. It may split or join its salvoes: 7, or 5 + 2, or 3 + 2 + 2.</p>" +
    "<p class='small muted' style='margin:6px 0 0'>Book alternative: an Il’porrui (Emissary), FL p. 472, keeping the missile system as a scenario rule.</p>";
  const DISENGAGE_DRAW = { w: "If the Tau disengage", t: "{a:dis}." };
  const swap = items => items.map(it => it && (it.s === "a" || it.s === "b") ? Object.assign({}, it, { s: it.s === "a" ? "b" : "a" }) : it);
  const vpr = (st, a, b) => { const x = num(st, "va"), y = num(st, "vb"); if (!x && !y) return [null, "Count victory points", "Enter both totals below."]; return x === y ? ["draw", "Level", "Both " + x + " VP."] : [x > y ? "a" : "b", wins(x > y ? a : b), a + " " + x + " – " + b + " " + y + " VP."]; };
  const vpTools = (a, b) => [{ k: "num", id: "va", s: "a", l: a + ": victory points", after: v => v + " VP" }, { k: "num", id: "vb", s: "b", l: b + ": victory points", after: v => v + " VP" }];
  const ending = (st, rows, id) => { const i = get(st, id || "how", -1); if (i < 0 || !rows[i]) return [null, "Battle in progress", "Mark how the game ended below."]; return [rows[i][1], rows[i][2], rows[i][0] + "."]; };
  const endTool = rows => ({ k: "ending", id: "how", l: "How did it end?", rows });

  /* Distant Sun: Tau victory structure shared by Into the Claw, Nightmares, Spirit Within and Rising Shadow */
  const SUN_ROWS = [["A Tau ship was destroyed", "b", "The Tau lose"], ["Every enemy ship destroyed", "a", "Major Tau victory"]];

  addScenarios([
  /* ============================================================ REVIVAL 1 HUNTER-PREY */
  {
    id: "fan-p-hunter-prey", grp: "fan-pdd", name: "Hunter-Prey", series: "Project Distant Darkness · Scenario One", trust: "fan",
    why: "A one-on-one duel in a dense nebula: the experimental Tau Mantis must shake off a Space Marine strike cruiser.", src: REVP(19), book: "O", suggest: ["Tau", "Space Marines"],
    others: "Any light cruiser against any strike cruiser or light cruiser. The Mantis is the supplement’s own ship; an Emissary (FL p. 472) works as well.",
    sides: { a: { n: "L’ikei", f: "Tau: the Mantis" }, b: { n: "Novamarines", f: "Space Marines: strike cruiser Daedalus" } },
    pitch: "A Novamarine strike cruiser has been following an unknown contact into a nebula. The contact is Kor’vre L’ikei’s Mantis — and it must get away without leading the Marines anywhere they should not go.",
    glance: [["Points", "Fixed: one ship each"], ["Table", "120 × 120 cm"], ["Battlezone", "A dense nebula: D3+1 gas clouds per 40 cm square"], ["First turn", "L’ikei"], ["Game ends", "A ship is destroyed or leaves the table"]],
    bring: ["A Tau light cruiser for the Mantis", "A Space Marine strike cruiser (FL p. 105)", "Lots of gas and dust clouds", "A scatter dice"],
    forces: { a: ["Mantis class Emissary, commanded by Kor’vre L’ikei (profile in the tools)."], b: ["Strike cruiser Daedalus, Captain Veliaz: Ld 9, 1 re-roll."] },
    draw: (v, W, H, st) => { const g = gridOf(W, H, 40), r = st && st.w && st.w.neb, out = [];
      for (let i = 1; i < g.c; i++) out.push({ z: "line", x1: i * g.sw, y1: 0, x2: i * g.sw, y2: H }); for (let j = 1; j < g.r; j++) out.push({ z: "line", x1: 0, y1: j * g.sh, x2: W, y2: j * g.sh });
      if (r && r.length === g.c * g.r) r.forEach((x, i) => out.push({ z: "text", x: (i % g.c + .5) * g.sw, y: (Math.floor(i / g.c) + .5) * g.sh, l: x, s: "n" }));
      return out.concat([R(W - 20, 0, 20, 20, "a", "escape"), { z: "mark", x: 40, y: H - 40, s: "a", l: "Mantis" }, { z: "mark", x: W - 40, y: H - 20, s: "b", l: "Daedalus" }]); },
    fit: () => [100, 100], srcTable: [120, 120],
    mapNote: "The Mantis starts 40 cm from the left and bottom edges, the Daedalus 40 cm from the right edge and 20 cm from the bottom. L’ikei escapes through the 20 × 20 cm corner at the top right. Numbers: gas clouds rolled for each square.",
    steps: [
      { t: "Divide the table into 40 cm squares and roll D3+1 gas and dust clouds for each (tool below). There is no sunward edge in the nebula: roll a scatter dice for each cloud’s length-wise direction." },
      { s: "a", t: "Place the Mantis 40 cm from your left edge and 40 cm from the bottom edge (map). Facing: {a:face}." },
      { s: "b", t: "Place the Daedalus 40 cm from the right edge and 20 cm from the bottom edge. Facing: {a:face}." },
      { s: "a", t: "You take the first turn." }
    ],
    stools: [{ k: "terrain", id: "neb", l: "Gas and dust clouds per square", sub: "D3+1 for every 40 cm square", size: 40, rows: [[1, 2, "2 clouds", "2"], [3, 4, "3 clouds", "3"], [5, 6, "4 clouds", "4"]] }],
    notes: ["The Mantis appears in the nebula, strikes, and then moves like an ordinary Emissary so as not to give itself away: it starts on the table and does not use its stealth system here.", "The supplement does not say whether a successful hit-and-run ends the game, or which way the ships face; the defaults are our suggestion."],
    refs: [["Gas and dust clouds", "RB p. 109"], ["Hit-and-run attacks", "RB p. 91"], ["Boarding actions", "RB p. 89–90"], ["Strike cruiser", "FL p. 105"], ["Emissary class envoy ship", "FL p. 472"]],
    play: [
      { w: "The nebula", t: "Its clouds block line of sight and fire. A ship touching one suffers the normal gas cloud effects and moves 10 cm less. No All Ahead Full in the nebula, and no ship gets the Leadership bonus for an enemy on special orders." },
      { w: "No disengaging", t: "Neither ship may disengage." },
      { w: "Goals", t: "L’ikei escapes through the corner zone, or destroys the Daedalus. The Novamarines win a hit-and-run or boarding action against the Mantis ({a:hr}), or destroy it." }
    ],
    tools: [{ k: "html", html: MANTIS }],
    rtools: [endTool([["L’ikei escaped through the corner zone", "a"], ["The Daedalus was destroyed", "a"], ["A Novamarine hit-and-run or boarding action succeeded", "b"], ["The Mantis was destroyed", "b"]])],
    end: ["One ship is destroyed or leaves the table.", "Does a successful hit-and-run or boarding action end it? {a:hr}."],
    win: ["L’ikei: escape through the Tau corner zone, or destroy the Daedalus.", "Novamarines: one successful hit-and-run or boarding action against the Mantis, or destroy it."],
    result(st, v, S) { return endingResult(st, S, "how"); },
    info: { bg: "An Imperial strike cruiser carrying an Inquisition agent has been tracking a strange contact. L’ikei leads it into a nebula, dives out of the warp behind it and fires — and from then on her Mantis must pass for an ordinary Emissary and simply get away.", cr: [REV + " " + REVP(18) + "–19."] }
  },
  /* ============================================================ REVIVAL 2 LIGHT AND DARKNESS */
  {
    id: "fan-p-light-dark", grp: "fan-pdd", name: "Light and Darkness", series: "Project Distant Darkness · Scenario Two", trust: "fan",
    why: "A raid on an Imperial convoy that turns out to carry civilians: the raiders must change their goal mid-battle.", src: REVP(20), book: "O", suggest: ["Tau", "Imperial Navy"],
    others: OTHERS_T + " The convoy can be any escorted convoy with six transports.",
    sides: { a: { n: "Ry’zon", f: "Tau: Protector and 4 Castellans" }, b: { n: "Convoy", f: "Imperial Navy" } },
    pitch: "Kor’O Ry’zon falls on what his briefing called a convoy of cargo freighters. As his guns come in range, the scans show people — thousands of civilians on the move.",
    glance: [["Points", "Fixed forces"], ["Table", "180 × 120 cm"], ["Battlezone", "Outer reaches; phenomena as usual"], ["First turn", "Ry’zon"], ["Game ends", "A fleet is destroyed or disengages, or the freighters are all gone"]],
    bring: ["6 transports", "Celestial phenomena"],
    forces: { a: ["Phase II Protector class cruiser (FL p. 470), commanded by Kor’O Ry’zon.", "4 Castellan class escorts (FL p. 474)."], b: ["Endeavour class light cruiser, Captain Murinsk: Ld 8, 1 re-roll.", "Endurance class light cruiser, Defiant class light cruiser.", "1 Firestorm and 3 Sword class escorts.", "6 cargo freighters (transports)."] },
    draw: (v, W, H, st, sc) => { const er = agN(sc, st, "entry"), bx = Math.min(W - 40, 60); return [R(bx - 15, H / 2 - 10, 30, 20, "b", "Convoy"), { z: "dim", x1: 0, y1: H / 2 + 16, x2: bx, y2: H / 2 + 16, l: "60 cm" },
      { z: "circ", cx: W / 2, cy: H, r: er, s: "a", l: "" }, { z: "text", x: W / 2, y: H - 8, l: "Ry’zon enters", s: "a" },
      { z: "edge", e: "r", s: "b", l: "freighters escape here (see Agree)" }]; },
    fit: () => [140, 90], srcTable: [180, 120],
    mapNote: "The convoy sets up in a 30 × 20 cm box centred 60 cm from the left short edge. Ry’zon enters around the middle of the bottom long edge.",
    steps: [
      { t: "Place celestial phenomena as usual for the outer reaches (RB p. 108)." },
      { s: "b", t: "Set up the whole convoy in the 30 × 20 cm box (map)." },
      { s: "a", t: "Keep your fleet off the table: it enters from the Tau entry zone, {a:entry} cm around the middle of the bottom long edge." },
      { s: "a", t: "You take the first turn." }
    ],
    stools: [],
    notes: ["The text sends the freighters off “the long table edge”, but the map marks the escape zone on the right short edge. Agree which (Agree before you start).", "The escape table counts 1–6 freighters; none at all is read as a major Tau victory too.", "Ry’zon’s Phase II Protector is the supplement’s early design; the Fleets book Protector (FL p. 470) stands in."],
    refs: [["Protector class cruiser", "FL p. 470"], ["Castellan class escort", "FL p. 474"], ["Endeavour class light cruiser", "FL p. 72"], ["Transports", "RB p. 135"], ["Battlezone generators", "RB p. 107–108"]],
    play: [
      { w: "Ry’zon within 45 cm of the freighters", s: "a", t: "(Read this when it happens.) The freighters carry only civilians. Your new goal: take them as hostages — destroy every Imperial warship before any freighter leaves the table, and leave the freighters alone." },
      { w: "Freighters", s: "b", t: "Escape with as many as you can: {a:edge}." }
    ],
    tools: [{ k: "toggle", id: "near", s: "a", l: "Ry’zon has come within 45 cm of the freighters" }, { k: "counter", id: "out", s: "b", res: 1, max: 6, l: "Freighters escaped" }],
    rtools: [],
    end: ["A fleet is destroyed or has disengaged, or every freighter has left the table."],
    win: ["5–6 freighters escaped: major Imperial victory.", "3–4: draw.", "1–2: major Tau victory."],
    result(st) { const n = get(st, "out", 0); return n >= 5 ? ["b", "Major Imperial victory", n + " freighters escaped."] : n >= 3 ? ["draw", "Draw", n + " freighters escaped."] : ["a", "Major Tau victory", n + " freighter" + (n === 1 ? "" : "s") + " escaped" + (n ? "." : " — none at all.")]; },
    info: { bg: "Kor’O Ry’zon leads a raid on an Imperial convoy in the Nurinor system’s outer reaches. The briefing promised cargo; his sensors show human families. Afterwards he says nothing about the mission to anyone.", cr: [REV + " " + REVP(20) + "."] }
  },
  /* ============================================================ REVIVAL 3 STOLEN GOODS */
  {
    id: "fan-p-stolen-goods", grp: "fan-pdd", name: "Stolen Goods", series: "Project Distant Darkness · Scenario Three", trust: "fan",
    why: "Tau escorts must board the right freighter out of six before a Rogue Trader slips away with the stolen cargo.", src: REVP(21), book: "O", suggest: ["Tau", "Rogue Traders"],
    others: "Any small escort force against any trader with six armed freighters. The Rogue Trader ships come from Warp Rift 17; the Fleets book has the Rogue Trader cruiser, recommissioned escorts and armed cargo vessels (FL p. 180, 189, 192).",
    sides: { a: { n: "Rogue Trader", f: "Rogue Traders" }, b: { n: "Tau patrol", f: "Tau: Kor’vre Sheva’s" } },
    pitch: "A Rogue Trader has stolen goods from the Orbital City that fronts for the project. Kor’vre Sheva’s and his Fire Warriors must search the freighters one by one before they escape.",
    glance: [["Points", "Fixed forces"], ["Table", "Not given — the map is square"], ["Battlezone", "Inner biosphere; phenomena as agreed"], ["First turn", "Rogue Trader, no special orders"], ["Game ends", "The goods are found, or every freighter has left"]],
    bring: ["A Tau orbital city (FL p. 478)", "6 armed freighters, numbered 1–6 in secret", "A Rogue Trader galleon or cruiser and four escorts", "3 Castellans and 2 Wardens"],
    forces: { a: ["Trade galleon, Archis Noca pattern, with an extra turret (Warp Rift 17; a Rogue Trader cruiser, FL p. 180): Captain Lunerton, Ld 8, 1 re-roll.", "2 recommissioned escorts, a pinnace and a brigantine (recommissioned escorts, FL p. 189).", "6 armed cargo vessels (FL p. 192)."], b: ["3 Castellan class escorts commanded by Kor’vre Sheva’s.", "2 Warden class escorts.", "A Tau orbital city."] },
    draw: (v, W, H) => { const cx = Math.max(30, W - 60); return [{ z: "edge", e: "t", s: "a", l: "Rogue Trader escapes here" }, { z: "mark", x: cx, y: H - 20, s: "b", l: "" }, { z: "text", x: cx - textLen("orbital city", W) / 2 - 6, y: H - 20, l: "orbital city", s: "b" },
      { z: "mark", x: cx, y: H - 40, s: "a", l: "" }, { z: "text", x: cx - textLen("Rogue Trader", W) / 2 - 6, y: H - 40, l: "Rogue Trader", s: "a" }, { z: "arrow", x1: cx, y1: H - 3, x2: cx, y2: H - 13, s: "b" }, { z: "text", x: cx + 6 + textLen("Sheva’s enters", W) / 2, y: H - 8, l: "Sheva’s enters", s: "b" },
      { z: "dim", x1: cx, y1: H / 2, x2: W, y2: H / 2, l: "60 cm" }]; },
    fit: () => [90, 90],
    mapNote: "The orbital city is 60 cm from the right edge and 20 cm from the bottom; the Rogue Trader fleet 20 cm above it. Sheva’s enters straight below the city.",
    steps: [
      { t: "Table and phenomena: {a:table}." },
      { s: "b", t: "Place the orbital city 60 cm from the right edge and 20 cm from the bottom edge (map)." },
      { s: "a", t: "Place your fleet 20 cm above the city. Number your six transports 1–6 in secret, then roll which one carries the stolen goods (tool below)." },
      { s: "b", t: "Your Castellans and Wardens enter from the bottom edge, straight below the city ({a:enter})." },
      { s: "a", t: "You take the first turn, but may not use special orders in it." }
    ],
    stools: [{ k: "secret", id: "goods", s: "a", l: "The stolen goods are on transport…", sub: "Rogue Trader: roll in secret. Show it when the Tau find it.", opts: ["1", "2", "3", "4", "5", "6"], rnd: true }],
    notes: ["The supplement places the phenomena “as shown on the map”, but its map shows only the ships; the default is our suggestion.", "The orbital city has its own profile in the supplement (130 pts, 12 hits, railguns 45 cm 12, missiles 6, 2 launch bays); the Fleets book’s Kor Caste Orbital City (FL p. 478) replaces it.", "Pinnace and brigantine are Warp Rift 17 designs; recommissioned escorts stand in."],
    refs: [["Kor Caste orbital city", "FL p. 478"], ["Castellan class escort", "FL p. 474"], ["Warden class gunship", "FL p. 475"], ["Rogue Trader cruiser", "FL p. 180"], ["Armed cargo vessel", "FL p. 192"], ["Boarding actions", "RB p. 89–90"]],
    play: [
      { w: "Searching", s: "b", t: "Board a transport successfully to search it. When you board the right one, the Tau win." },
      { w: "Escape", s: "a", t: "Get the transport with the goods off the top edge." }
    ],
    fx: T => T === 1 ? [["a", "No special orders this turn"]] : [],
    tools: [{ k: "secret", id: "goods", s: "a", l: "The stolen goods are on transport…", sub: "Rogue Trader: roll in secret. Show it when the Tau find it.", opts: ["1", "2", "3", "4", "5", "6"], rnd: true }, { k: "counter", id: "srch", s: "b", l: "Transports searched", max: 6 }],
    rtools: [endTool([["The Tau found the goods", "b"], ["The transport with the goods escaped", "a"]])],
    end: ["The Tau find the goods, or every transport has left the table."],
    win: ["Tau patrol: board the transport that carries the goods.", "Rogue Trader: get it away."],
    result(st, v, S) { return endingResult(st, S, "how"); },
    info: { bg: "Near the Orbital City that serves as the project’s public face, a Rogue Trader has made off with goods that should never have left it. Kor’vre Sheva’s takes a squadron of Castellans and a team of Fire Warriors to search every freighter.", cr: [REV + " " + REVP(21) + ". The Rogue Trader ships are from Warp Rift 17."] }
  },
  /* ============================================================ REVIVAL 4 BARRAGE */
  {
    id: "fan-p-barrage", grp: "fan-pdd", name: "Barrage", series: "Project Distant Darkness · Scenario Four", trust: "fan",
    why: "Tau strike on a Chaos reliquary on a desert world: it must be destroyed from low orbit before a warp gate opens.", src: REVP(22), book: "O", suggest: ["Tau", "Chaos"],
    others: OTHERS_T + " The Marauder is the supplement’s own ship; an Emissary (FL p. 472) with the missile system on the Play tab stands in.",
    sides: { a: { n: "Tau strike fleet", f: "Tau" }, b: { n: "Chaos", f: "Chaos" } },
    pitch: "Chaos worshippers in orbit of a dead desert world are building a gateway to the warp, like the one seen at Medusa. The Tau must bomb the reliquary on the surface before it opens.",
    glance: [["Points", "Fixed forces"], ["Table", "Not given — the map shows 180 × 120 cm"], ["Battlezone", "Flare region; a small desert planet"], ["First turn", "Tau"], ["Game ends", "The reliquary or a fleet is destroyed"]],
    bring: ["A small planet", "A low orbit table (RB p. 116)", "Defences: 2 weapons platforms, a lance platform, a minefield; on the planet a torpedo and a weapons battery", "A marker for the reliquary"],
    forces: { a: ["Custodian class battleship (FL p. 468) with 3 Wardens.", "2 Emissary class light cruisers.", "Marauder class Emissary, Kor’vre Nua’ta (tools).", "6 Castellan class escorts."], b: ["Hades class heavy cruiser, Lord Gha’har’hagnish: Ld 9, 1 re-roll.", "Devastation class cruiser, 2 Murder class cruisers.", "3 Iconoclast and 2 Idolator class escorts.", "In orbit: 2 weapons platforms, a lance platform and a minefield. On the planet: a torpedo battery and a weapons battery.", "The reliquary on the planet: 4 hits, armour 6+, no weapons."] },
    draw: (v, W, H) => { const px = Math.max(20, W - 150); return [{ z: "planet", cx: px, cy: 22, r: 7 }, { z: "circ", cx: px, cy: 22, r: 17, s: "b", l: "" }, { z: "text", x: px, y: 46, l: "Chaos: within\n10 cm of the planet", s: "b" },
      R(W - 20, 0, 20, H, "a", "Tau: 20 cm", { rot: 90 }), { z: "dim", x1: px, y1: H - 12, x2: W, y2: H - 12, l: "150 cm" }]; },
    fit: () => [150, 70], srcTable: [180, 120],
    mapNote: "The planet stands 150 cm from the Tau edge, near a corner as on the supplement’s map. Chaos sets up within 10 cm of it, in its gravity well.",
    steps: [
      { t: "Place a small desert planet with no rings or moons as on the map, 150 cm from the Tau short edge, then other phenomena for the flare region (RB p. 107). Set up a low orbit table." },
      { s: "b", t: "Place the reliquary, the torpedo battery and the weapons battery on the planet, the platforms and the minefield in orbit, and your fleet within 10 cm of the planet." },
      { s: "a", t: "Deploy within 20 cm of your short edge ({a:dep})." },
      { s: "a", t: "You take the first turn." }
    ],
    stools: [],
    notes: ["The orbital defences are the Fleets book’s: orbital weapons platforms, an orbital defence laser platform and a minefield (FL p. 509–513). For the torpedo and weapons batteries on the planet, missile silos and defence laser silos (FL p. 517) are the nearest book defences.", "The supplement says the reliquary is destroyed “from low orbit” but not how. The default treats it as a low orbit target (RB p. 116).", "Its map shows the deployment zones only; whether the Tau set up in their zone or enter from it is open."],
    refs: [["Fighting in low orbit", "RB p. 116"], ["Planetary defences", "FL p. 496–499"], ["Barrage bombs", "FL p. 20"], ["Custodian class battleship", "FL p. 468"], ["Hades class heavy cruiser", "FL p. 274"]],
    play: [
      { w: "The reliquary", s: "a", t: "Destroy it from the low orbit table: 4 hits, armour 6+, no weapons ({a:how})." },
      { w: "Nua’ta’s Marauder", s: "a", t: "From low orbit its missiles bombard the planet as barrage bombs that ignore shields — but then it fires nothing else (tools)." },
      { w: "Victory", t: "Reliquary destroyed with a Tau capital ship still alive: Tau victory. Destroyed, but no Tau cruiser left to salvage the wrecks: a draw. Reliquary standing: Chaos victory." }
    ],
    tools: [{ k: "counter", id: "rel", s: "a", res: 1, max: 4, l: "Hits on the reliquary (4 destroys it)" }, { k: "html", html: MARAUDER }],
    rtools: [endTool([["Reliquary destroyed, a Tau capital ship survived", "a", "Tau victory"], ["Reliquary destroyed, no Tau capital ship left", "draw", "Draw"], ["The reliquary survived", "b", "Chaos victory"]])],
    end: ["The reliquary is destroyed, or one fleet is destroyed."],
    win: ["Tau: destroy the reliquary from low orbit and keep at least one capital ship alive to salvage the lost ships. Without a surviving cruiser it is only a draw.", "Chaos: keep the reliquary standing."],
    result(st) { return ending(st, [["Reliquary destroyed, a Tau capital ship survived", "a", "Tau victory"], ["Reliquary destroyed, no Tau capital ship left", "draw", "Draw"], ["The reliquary survived", "b", "Chaos victory"]]); },
    info: { bg: "A Tau agent has found a Chaos force above a dead desert world, building what looks like the gateway seen at Medusa. If it opens, things beyond understanding will pour through. A strike fleet goes in before it does.", cr: [REV + " " + REVP(22) + "."] }
  },
  /* ============================================================ REVIVAL 5 CROSSFIRE */
  {
    id: "fan-p-crossfire", grp: "fan-pdd", name: "Crossfire", series: "Project Distant Darkness · Scenario Five · three players", trust: "fan", players: [2, 3],
    why: "Three sides: a secret Tau cruiser must slip away from a battle between Orks and an ordinary Tau fleet without being recognised.", src: REVP(24), book: "O", suggest: ["Tau", "Orks"],
    others: OTHERS_T + " The Tau ECF ships are the Kor’vattra list (FL p. 454): Hero, Merchant, Orca and Defender.",
    sides: { a: { n: "Tas’ka", f: "Tau: Distant Darkness" }, b: { n: "Orks", f: "Orks" }, c: { n: "Tau ECF", f: "Tau Kor’vattra" } },
    pitch: "Kor’el Tas’ka has just struck an Ork raiding fleet when an official Tau battlegroup arrives to do the same. Nobody in the Empire may learn that her ship exists.",
    glance: [["Points", "Fixed forces, three fleets"], ["Table", "180 × 120 cm"], ["Battlezone", "Outer reaches; a medium planet"], ["First turn", "Tas’ka"], ["Game ends", "Tas’ka escapes unseen, or is discovered"]],
    bring: ["A medium planet", "Celestial phenomena"],
    forces: { a: ["Protector class cruiser, commanded by Kor’el Tas’ka.", "2 Castellan class escorts."], b: ["Terror Kroozer, Warlord Raghaxhor.", "Kill Kroozer with 6 hits left and its port armament damaged; a second Kill Kroozer.", "2 Brute ram ships, 4 Ravagers, 3 Onslaughts."], c: ["Hero class cruiser.", "2 Merchant class light cruisers with gravitic hooks.", "4 Orca and 3 Defender class escorts."] },
    draw: (v, W, H) => [R(W - 10, 0, 10, H, "a", ""), { z: "text", x: W - 22, y: 16, l: "Tau entry zone", s: "a" }, R(W / 2 - 20, H / 2 - 15, 40, 30, "b", "Orks"), { z: "planet", cx: 22, cy: H / 2, r: 10 },
      { z: "mark", x: Math.max(12, W - 150), y: H - 20, s: "a", l: "Tas’ka" }, { z: "dim", x1: Math.max(12, W - 150), y1: H - 8, x2: W, y2: H - 8, l: "150 cm" }],
    fit: () => [150, 90], srcTable: [180, 120],
    mapNote: "Tas’ka starts 150 cm from the Tau edge, near the bottom; the Orks in a 40 × 30 cm box in the middle, facing the Tau edge. She may leave only through the Tau entry zone along the right edge.",
    steps: [
      { t: "Place a medium planet with no rings or moons as on the map, then other phenomena for the outer reaches (RB p. 108)." },
      { s: "b", t: "Set up in the 40 × 30 cm box in the middle, every ship facing the Tau edge." },
      { s: "a", t: "Place your ships 150 cm from the Tau edge, near the bottom edge (map)." },
      { s: "c", t: "Your fleet: {a:ecf}." },
      { t: "Turn order: {a:order}." }
    ],
    stools: [],
    notes: ["Played by three, or by two: then the Tas’ka player also runs the Tau ECF, which may only fight the Orks and detects her by dice alone (suggestion).", "The supplement does not say where the ECF starts or in what order three fleets take their turns; the defaults are our suggestion.", "It ends when Tas’ka escapes or is discovered, which may leave the Orks and the ECF mid-fight; see Agree for the result then."],
    refs: [["Protector class cruiser", "FL p. 470"], ["Hero class starship", "FL p. 460"], ["Merchant class starship", "FL p. 462"], ["Kill Kroozer", "FL p. 382"], ["Leadership", "RB p. 45"]],
    play: [
      { w: "Escape", s: "a", t: "You may leave only through the Tau entry zone — not off any other edge, and not by disengaging." },
      { w: "Discovery", s: "c", t: "Whenever Tas’ka moves within 30 cm of one of your ships, it tests Leadership: pass and she is discovered. +1 to the test if she fired at an Ork ship that turn." },
      { w: "The ECF’s orders", s: "c", t: "Fight the Orks; do not hunt Tas’ka (play it in the spirit of the story)." },
      { w: "Orks", s: "b", t: "You may attack any Tau." }
    ],
    tools: [{ k: "toggle", id: "shot", s: "a", l: "Tas’ka fired at an Ork ship this turn (+1 to detect her)" }],
    rtools: [endTool([["Tas’ka escaped unnoticed", "a", "Tas’ka wins"], ["Tas’ka was discovered", "draw", "Tas’ka is discovered"]]), { k: "pick", id: "ok", l: "Between the Orks and the Tau ECF", rows: [["The Ork fleet was destroyed", "Tau ECF win"], ["The Tau ECF was destroyed", "Orks win"], ["Neither", "see Agree"]] }],
    end: ["Tas’ka escapes unnoticed, or is discovered."],
    win: ["Tas’ka: escape through the Tau entry zone.", "Tau ECF: destroy the Ork fleet. Orks: destroy the Tau ECF.", "If she is discovered: {a:found}."],
    result(st) { const h = get(st, "how", -1), o = get(st, "ok", -1); if (h < 0) return [null, "Battle in progress", "Mark how it ended below."];
      if (h === 0) return ["a", "Tas’ka wins", "She slipped away unseen." + (o === 0 ? " The ECF also destroyed the Orks." : o === 1 ? " The Orks also destroyed the ECF." : "")];
      return [o === 0 ? "c" : o === 1 ? "b" : "draw", "Tas’ka is discovered", o === 0 ? "The Tau ECF win: the Ork fleet is destroyed." : o === 1 ? "The Orks win: the Tau ECF is destroyed." : "Between the Orks and the ECF: as agreed."]; },
    info: { bg: "Kor’el Tas’ka has been hunting raiders around a Tau trade route. Just as her ships open fire on an Ork fleet, an official Tau escort group arrives on the same errand. The project must stay hidden, even from her own people.", cr: [REV + " " + REVP(23) + "–24."] }
  },
  /* ============================================================ REVIVAL 6 SILENT STRIKE */
  {
    id: "fan-p-silent-strike", grp: "fan-pdd", name: "Silent Strike", series: "Project Distant Darkness · Scenario Six", trust: "fan",
    why: "A raid on four Imperial supply depots by an asteroid field — and no Tau wreck may be left behind for the official fleet to find.", src: REVP(25), book: "O", suggest: ["Tau", "Imperial Navy"],
    others: OTHERS_T + " Any raider of 1000 pts against any defender of 1500 pts with four depots.",
    sides: { a: { n: "Tau strike fleet", f: "Tau: Distant Darkness" }, b: { n: "Imperial Navy", f: "Imperial Navy" } },
    pitch: "A quickly built Imperial base threatens the Tau border. Ry’zon’s fleet must blow up its fuel and munitions depots before the official Tau fleet arrives — and leave no trace of itself.",
    glance: [["Points", "Tau 1000 · Imperial 1500 + 150 of defences + 4 depots"], ["Table", "180 × 120 cm"], ["Battlezone", "Outer reaches; a large asteroid field on a long edge"], ["First turn", "Tau"], ["Game ends", "After 8 turns"]],
    bring: ["A large asteroid field", "4 depots", "Up to 150 pts of orbital defences for the Imperial Navy"],
    forces: { a: ["Up to 1000 pts, with one or more of the Distant Darkness commanders (tools)."], b: ["Up to 1500 pts, led by Fleet Admiral Starking (Ld 8, 2 re-rolls, cost included).", "Up to 150 pts of orbital defences, but no space stations or orbital docks.", "500 pts of the fleet start in the patrol zone.", "4 depots: Defence/4, armour 5+, shields 2, turrets 3; weapons battery 30 cm, firepower 4, all round."] },
    draw: (v, W, H) => [{ z: "hatch", x: 0, y: H - 30, w: W, h: 30, l: "large asteroid field" }, R(0, 0, 20, H - 30, "b", "Imperial", { rot: -90 }), R(Math.min(W - 60, 80), H / 2 - 15, 30, 30, "b", "patrol"),
      R(W - 20, 0, 20, H - 30, "a", "Tau", { rot: 90 }), { z: "dim", x1: 0, y1: 12, x2: Math.min(W - 60, 80), y2: 12, l: "80 cm" }],
    fit: () => [140, 90], srcTable: [180, 120],
    mapNote: "The asteroid field runs along a long edge, 30 cm deep. The depots go in the Imperial zone within 30 cm of the field.",
    steps: [
      { t: "Place a large asteroid field along one long edge, reaching 30 cm onto the table, and other phenomena for the outer reaches (RB p. 108)." },
      { s: "b", t: "Place the four depots in your zone, within 30 cm of the asteroid field, and your defences. Deploy 500 pts in the patrol zone and the rest in your zone along the left edge." },
      { s: "a", t: "Deploy in your zone along the right edge." },
      { s: "a", t: "You take the first turn." }
    ],
    stools: [{ k: "val", id: "surp", s: "b", l: "Imperial −2 Ld for the first … turns (D3)", opts: [1, 2, 3], roll: () => dn(3) }],
    notes: ["The supplement’s deployment zones are read from its map: 20 cm deep at either short edge, and a 30 cm patrol box 80 cm from the Imperial edge.", "Victory: “the Tau should try to destroy as many Imperial ships as possible” is a goal without a score; the default ignores it.", "It mentions surviving ships leaving at the end of turn 6, but the battle lasts eight turns; we keep eight. Tau hulks still on the table after turn 8 uncover the project."],
    refs: [["Orbital weapons platform", "FL p. 511"], ["Asteroid fields", "RB p. 110"], ["Blazing and drifting hulks", "RB p. 71"]],
    play: [
      { w: "Turns 1 to D3", s: "b", t: "Your ships suffer −2 Leadership (tool)." },
      { w: "Destroying your own hulks", s: "a", t: "You may shoot at your own hulks to destroy them, so the Kor’vattra finds nothing." },
      { w: "End of turn 8", t: "The official Tau fleet (1000 pts) arrives at the start of turn 9: any Tau hulk still on the table uncovers Distant Darkness." }
    ],
    turnMax: () => 8,
    fx: (T, st) => { const d = get(st, "surp", 0); return (d && T <= d ? [["b", "−2 Leadership"]] : !d && T === 1 ? [["b", "Roll the D3 for the −2 Leadership turns"]] : []).concat(T === 8 ? [[null, "Last turn: no Tau hulk may be left"]] : []); },
    tools: [{ k: "counter", id: "dep", s: "a", res: 1, max: 4, l: "Depots destroyed" }, { k: "toggle", id: "hulk", s: "a", l: "A Tau hulk is still on the table", res: 1 }, { k: "html", html: CHARS_REV }],
    rtools: [],
    end: ["After 8 turns."],
    win: ["Tau: destroy at least 3 depots, and leave no Tau hulk on the table at the end of turn 8.", "Imperial Navy: protect the depots.", "Depots destroyed but a Tau hulk left behind: {a:hulk}."],
    result(st) { const d = get(st, "dep", 0), h = get(st, "hulk", false); if (d >= 3) return h ? ["draw", "The raid worked, the secret did not", d + " depots destroyed, but a Tau hulk is left for the Kor’vattra to find (as agreed)."] : ["a", "The Tau strike fleet wins", d + " depots destroyed and no trace left."]; return ["b", "The Imperial Navy wins", d + " depot" + (d === 1 ? "" : "s") + " destroyed — 3 were needed."]; },
    info: { bg: "Since a Kor’vattra scout found it, an Imperial base near Tau space has nearly doubled. Ry’zon will not warn his comrades — that would reveal the project — so he raids the base himself, aiming at its fuel and munitions depots, before the official fleet arrives.", cr: [REV + " " + REVP(25) + "."] }
  },
  /* ============================================================ REVIVAL 7 HUNTER CADRE */
  {
    id: "fan-p-hunter-cadre", grp: "fan-pdd", name: "Hunter Cadre", series: "Project Distant Darkness · Scenario Seven", trust: "fan",
    why: "A pre-emptive strike on a pirate band caught off guard: the Tau may come in from any edge.", src: REVP(26), book: "O", suggest: ["Tau", "Chaos renegades"],
    others: OTHERS_T + " The pirates are a mixed renegade fleet; any raider fleet of similar size will do.",
    sides: { a: { n: "Tau hunters", f: "Tau: Distant Darkness" }, b: { n: "Pirates", f: "Renegades" } },
    pitch: "A pirate band raiding Tau supply lines is heading straight for the project’s hidden facilities. Ry’zon and Tas’ka strike first.",
    glance: [["Points", "Fixed forces"], ["Table", "120 × 120 cm"], ["Battlezone", "Not in the rulebook (“outer biosphere”) — see Agree"], ["First turn", "Tau"], ["Game ends", "A fleet is destroyed or disengages"]],
    bring: ["Celestial phenomena"],
    forces: { a: ["Phase 2 Protector, commanded by Kor’O Ry’zon, with Tigershark fighter-bombers.", "Phase 3 Protector, commanded by Kor’el Tas’ka.", "3 Castellan class escorts."], b: ["Murder class cruiser, Master DuPouzin: Ld 8, 2 re-rolls.", "Endeavour class light cruiser, 2 escort carriers.", "3 Iconoclast, 2 Sword and 2 Firestorm class escorts."] },
    draw: (v, W, H) => [R(W / 2 - 20, H / 2 - 20, 40, 40, "b", "Pirates"), { z: "text", x: W / 2, y: H / 2 + 26, l: "all facing the same way", s: "b" }, { z: "dim", x1: 0, y1: H / 2 - 26, x2: W / 2 - 20, y2: H / 2 - 26, l: "40 cm" },
      { z: "edge", e: "t", s: "a", dash: 1, l: "Tau enter from any edge" }, { z: "edge", e: "b", s: "a", dash: 1, l: "" }, { z: "edge", e: "l", s: "a", dash: 1, l: "" }, { z: "edge", e: "r", s: "a", dash: 1, l: "" }],
    fit: () => [90, 90], srcTable: [120, 120],
    mapNote: "The pirates set up in a 40 × 40 cm box in the middle of the table.",
    steps: [
      { t: "Set up celestial phenomena: {a:bz}." },
      { s: "b", t: "Set up in the 40 × 40 cm box in the middle, every ship facing the same way." },
      { s: "a", t: "Your ships enter from any table edge in your first turn." },
      { s: "a", t: "You take the first turn." }
    ],
    stools: [{ k: "val", id: "surp", s: "b", l: "Pirates −2 Ld for the first … turns (D3)", opts: [1, 2, 3], roll: () => dn(3) }],
    notes: [TIGER, "The escort carriers are the Fleets book’s (FL p. 521)."],
    refs: [["Protector class cruiser", "FL p. 470"], ["Murder class cruiser", "FL p. 279"], ["Escort carrier", "FL p. 521"], ["Victory points", "RB p. 122"]],
    play: [{ w: "Turns 1 to D3", s: "b", t: "Caught by surprise: −2 Leadership (tool)." }],
    fx: (T, st) => { const d = get(st, "surp", 0); return d && T <= d ? [["b", "−2 Leadership"]] : !d && T === 1 ? [["b", "Roll the D3 for the −2 Leadership turns"]] : []; },
    tools: [{ k: "html", html: CHARS_REV }],
    rtools: vpTools("Tau hunters", "Pirates"),
    end: ["A fleet is destroyed or has disengaged."],
    win: ["Standard victory points (RB p. 122); most points wins."],
    result(st) { return vpr(st, "Tau hunters", "Pirates"); },
    info: { bg: "A roving pirate band has become a serious threat to Tau supply lines, and its trail of butchery leads toward the secret Distant Darkness facilities. Ry’zon and Tas’ka are sent to strike before it gets there.", cr: [REV + " " + REVP(26) + "."] }
  },
  /* ============================================================ REVIVAL 8 ANOTHER DAY, ANOTHER PLAN */
  {
    id: "fan-p-another-day", grp: "fan-pdd", name: "Another Day, Another Plan", series: "Project Distant Darkness · Scenario Eight", trust: "fan",
    why: "The Bait with a secret Tau battleship as bait: Eldar Corsairs pounce, and a rescue squadron races in.", src: REVP(27), book: "O", suggest: ["Tau", "Eldar Corsairs"],
    others: OTHERS_T + " Fio’O Ly’tan’s Explorer has its own profile (tools); the Fleets book’s Explorer (FL p. 458) and Wardens (FL p. 475) stand in.",
    sides: { a: { n: "Ly’tan", f: "Tau" }, b: { n: "Corsairs", f: "Eldar Corsairs" } },
    pitch: "Eldar Corsairs find a lone Tau explorer and attack. It is no ordinary explorer — and it has already called for help.",
    glance: [["Points", "Fixed forces"], ["Table", "180 × 120 cm"], ["Battlezone", "Deep space; phenomena as usual"], ["First turn", "Ly’tan"], ["Game ends", "As The Bait: a fleet is destroyed"]],
    bring: ["A Tau battleship for the Ly’tan", "Celestial phenomena"],
    forces: { a: ["Explorer “Ly’tan” class battleship, Fio’O Ly’tan: Ld 9, 1 re-roll, with 2 Wardens of the “Xi’s’or Shi’ntai” configuration (tools).", "Rescue fleet, arriving as The Bait’s reinforcements: Protector class cruiser commanded by Kor’vre Sheva’s, a Protector with Tigershark fighter-bombers, 3 Castellans."], b: ["Solaris class light cruiser, Prince Makaviel: Ld 9, 2 re-rolls.", "2 Hellebore class escorts.", "2 Nightshades with an Aconite in the same squadron."] },
    draw: (v, W, H) => [{ z: "mark", x: 60, y: H / 2, s: "a", l: "Ly’tan" }, { z: "arrow", x1: 66, y1: H / 2 + 8, x2: 84, y2: H / 2 + 8, s: "a" }, { z: "dim", x1: 0, y1: H / 2 + 18, x2: 60, y2: H / 2 + 18, l: "60 cm" },
      { z: "edge", e: "l", s: "b", l: "Corsairs enter" }, { z: "edge", e: "r", s: "a", l: "Sheva’s rescue fleet enters" }, { z: "tick", e: "t", s: "a", list: TICKS(W) }, { z: "tick", e: "b", s: "a", list: TICKS(W) }],
    fit: () => [130, 60], srcTable: [180, 120],
    mapNote: "Ly’tan starts 60 cm from the Corsairs’ short edge, facing away from it. The rescue fleet enters from the far short edge, or from turn 2 up to 30 cm further along a long edge each turn (The Bait).",
    steps: [
      { t: "Place celestial phenomena for deep space (RB p. 108)." },
      { s: "a", t: "Place the Ly’tan and its Wardens 60 cm from the Corsairs’ short edge, facing the far short edge." },
      { s: "b", t: "Your fleet enters from your short edge, behind the Ly’tan." },
      { s: "a", t: "Keep Sheva’s rescue fleet off the table: it enters from the far short edge, on any turn, as The Bait’s reinforcements." },
      { s: "a", t: "You take the first turn." }
    ],
    stools: [],
    notes: ["The supplement points to The Bait (RB p. 130) for everything not given; its map puts the bait 60 cm from the Corsairs’ edge rather than in the centre.", "Neither side may disengage on purpose. The victory conditions leave open what happens if the Tau lose a ship but not all; see Agree.", TIGER],
    refs: [["The Bait", "RB p. 130"], ["Explorer", "FL p. 458"], ["Warden class gunship", "FL p. 475"], ["Solaris class light cruiser", "FL p. 324"], ["Nightshade class destroyer", "FL p. 328"]],
    play: [
      { w: "Rescue fleet", s: "a", t: "It may enter on any turn, turn 1 included; from turn 2 also up to 30 cm along a long edge for each turn after the first (tools)." },
      { w: "No disengaging", t: "No ship may disengage voluntarily." },
      { w: "Goals", t: "Tau: Ly’tan and Sheva’s must both survive. Corsairs: destroy every Tau ship." }
    ],
    tools: [{ k: "info", html: st => entryInfo(st.turn) }, { k: "html", html: "<h3>Explorer “Ly’tan” class (p. 27)</h3><p class='small' style='margin:0 0 6px'>12 hits, 20 cm, 45°, shields 3, armour 5+ (prow deflector 6+), turrets 4, integrated tracking systems. Prow weapons battery 45 cm, 8, left/front/right; dorsal weapons battery 45 cm, 6, left/front/right; port and starboard launch bays, 3 each; gravitic hooks for 2 Wardens.</p><p class='small' style='margin:0'><b>Warden “Xi’s’or Shi’ntai”:</b> 1 hit, 25 cm, 90°, shields 1, armour 5+, turrets 1; ion cannon 30 cm, strength 2, front.</p>" }, { k: "html", html: CHARS_REV }],
    rtools: [endTool([["Ly’tan and Sheva’s both survived", "a", "Tau victory"], ["Every Tau ship was destroyed", "b", "Corsairs’ victory"], ["Ly’tan or Sheva’s was lost, some Tau survived", "b", "As agreed"]])],
    end: ["As The Bait: until one fleet is destroyed — no one may disengage on purpose."],
    win: ["Tau: Fio’O Ly’tan and Kor’vre Sheva’s both survive.", "Corsairs: destroy every Tau ship.", "Anything in between: {a:mid}."],
    result(st) { return ending(st, [["Ly’tan and Sheva’s both survived", "a", "Tau victory"], ["Every Tau ship was destroyed", "b", "Corsairs’ victory"], ["Ly’tan or Sheva’s was lost, some Tau survived", "b", "Corsairs’ victory (as agreed)"]]); },
    info: { bg: "Unknown to all but High Command, Fio’O Ly’tan built himself a command ship during the first phase of the project. When Eldar Corsairs find it alone, they attack an ‘explorer’ that fights back far too well — and it sends a secret distress call to a nearby test patrol.", cr: [REV + " " + REVP(27) + "."] }
  },
  /* ============================================================ REVIVAL 9 INTO DARKNESS */
  {
    id: "fan-p-into-darkness", grp: "fan-pdd", name: "Into Darkness", series: "Project Distant Darkness · Scenario Nine", trust: "fan",
    why: "A Tau commander haunted by a Dark Eldar spectre wants to bomb a colony; his comrade must stop him without losing either ship.", src: REVP(29), book: "O", suggest: ["Tau", "Dark Eldar"],
    others: OTHERS_T + " The Marauder and the Mantis are the supplement’s own ships; two Emissaries (FL p. 472) with their rules on the Play tab stand in.",
    sides: { a: { n: "Tau", f: "Tau: Nua’ta and L’ikei" }, b: { n: "Dark Eldar", f: "Dark Eldar" } },
    pitch: "Nua’ta has gone missing to fight Dark Eldar raiders over a young colony. When they are gone, he means to bomb the occupied city himself — and L’ikei has been sent to bring him back.",
    glance: [["Points", "Fixed: two Tau light cruisers, two Corsair escorts"], ["Table", "180 × 120 cm"], ["Battlezone", "Inner biosphere; a medium planet and a moon"], ["First turn", "Nua’ta"], ["Game ends", "Not given — see Agree"]],
    bring: ["A medium planet and a moon", "A low orbit table (RB p. 116)", "Two Tau light cruisers, two Dark Eldar escorts", "A marker for L’ikei’s stealth dive"],
    forces: { a: ["Kor’vre Nua’ta in his Marauder class Emissary (tools).", "Kor’vre L’ikei in her Mantis class Emissary (tools), arriving from turn 2."], b: ["2 Corsair class escorts: one with weapons batteries, one with torpedoes (FL p. 353)."] },
    draw: (v, W, H) => [{ z: "planet", cx: 18, cy: 18, r: 10 }, { z: "planet", cx: Math.min(W - 20, 94), cy: H / 2, r: 3 }, { z: "circ", cx: 60, cy: 40, r: 8, s: "b", l: "" }, { z: "text", x: 60, y: 54, l: "Dark Eldar", s: "b" },
      { z: "mark", x: Math.min(W - 14, 100), y: H / 2, s: "a", l: "Nua’ta" }, { z: "dim", x1: 0, y1: H / 2 + 12, x2: Math.min(W - 14, 100), y2: H / 2 + 12, l: "100 cm" }],
    fit: () => [120, 90], srcTable: [180, 120],
    mapNote: "Nua’ta starts 100 cm from the left edge on the centre line, beside the moon; the Dark Eldar 60 cm from the left and 40 cm from the top. The planet sits in the top left corner.",
    steps: [
      { t: "Place a medium planet in the top left corner and a moon as on the map. Set up a low orbit table for the colony." },
      { s: "a", t: "Place Nua’ta 100 cm from the left edge on the centre line. Keep L’ikei off the table: she can dive in from turn 2." },
      { s: "b", t: "Place both Corsairs 60 cm from the left edge and 40 cm from the top." },
      { t: "Who plays Nua’ta: {a:who}. Nua’ta takes the first turn." }
    ],
    stools: [],
    notes: ["The supplement does not say how long the game lasts, or who decides Nua’ta’s moves once he turns on the colony; the defaults are our suggestion.", "Its own epilogue tells how it went: L’ikei shielded the city with her ship, and Nua’ta, seeing her hit, diverted his missiles at the last moment."],
    refs: [["Fighting in low orbit", "RB p. 116"], ["Barrage bombs", "FL p. 20"], ["Corsair class escort", "FL p. 353"], ["Emissary class envoy ship", "FL p. 472"]],
    play: [
      { w: "Start of turn 2", s: "a", t: "L’ikei may enter using the Mantis’s stealth system (tools)." },
      { w: "Once the Dark Eldar are gone", s: "a", t: "Nua’ta must enter low orbit at the first chance and bomb the city with the Marauder’s missiles: the target counts as a ground defence with 4 hits and armour 5+, no turrets or shields." },
      { w: "Talking him down", s: "a", t: "Once the Dark Eldar are destroyed, whenever L’ikei is within 15 cm of Nua’ta she may roll 2D6: 9 or more talks him down, and the mission succeeds." },
      { w: "Firing on a comrade", s: "a", t: "L’ikei may fire on Nua’ta to cripple him; he may fire back, but never first. If either Tau ship is crippled — or hit while already crippled — by the other, Nua’ta snaps out of it: success." }
    ],
    tools: [{ k: "roll", id: "talk", s: "a", l: "Talk him down", d2: true, sub: "2D6 when L’ikei is within 15 cm of Nua’ta", rows: () => [[2, 8, "He does not listen"], [9, 12, "Nua’ta stands down: mission successful"]] }, { k: "counter", id: "city", s: "a", res: 1, max: 4, l: "Hits on the city (4 destroys it)" }, { k: "html", html: MANTIS }, { k: "html", html: MARAUDER }],
    rtools: [endTool([["Both Tau ships survived and the city was spared", "a", "Tau victory"], ["A Tau ship was destroyed, or the city was", "b", "Tau defeat"], ["Both Tau ships destroyed or gone, a Dark Eldar escort still in play", "b", "Dark Eldar: appalling"]])],
    end: ["{a:len}."],
    win: ["Tau victory: both Tau ships survive, and L’ikei stops Nua’ta destroying the colony.", "Tau defeat: a Tau ship is destroyed, or the city is.", "Appalling Dark Eldar victory: both Tau ships are destroyed or disengage while a Dark Eldar escort is still in play."],
    result(st) { return ending(st, [["Both Tau ships survived and the city was spared", "a", "Tau victory"], ["A Tau ship was destroyed, or the city was", "b", "Tau defeat"], ["Both Tau ships destroyed or gone, a Dark Eldar escort still in play", "b", "Dark Eldar: appalling"]]); },
    info: { bg: "Nua’ta, once tortured by Dark Eldar, hears a Haemonculus’ voice in his head. When a young colony falls silent he slips away to find Dark Eldar raiding it — and the voice urges him to destroy the city they hold. Ry’zon sends L’ikei and her Mantis after him.", cr: [REV + " " + REVP(28) + "–29."] }
  },
  /* ============================================================ DISTANT SUN 1 INTO THE CLAW */
  {
    id: "fan-p-claw", grp: "fan-pdd", name: "Into the Claw", series: "Distant Sun · Chapter One", trust: "fan",
    why: "Three Tau cruisers against a Tyranid vanguard swarm: lose a ship and you lose the battle.", src: SUNP(9), book: "O", suggest: ["Tau", "Tyranids"],
    others: OTHERS_T + " The Tyranids are a vanguard fleet (FL p. 429).",
    sides: { a: { n: "Tau hunters", f: "Tau: Distant Darkness" }, b: { n: "Tyranids", f: "Tyranid vanguard" } },
    pitch: "Investigating a wrecked waystation, Ry’zon finds it stripped of all life. A small Tyranid fleet is already heading into Nua’ta’s patrol path.",
    glance: [["Points", "Fixed forces"], ["Table", "120 × 120 cm"], ["Battlezone", "Deep space: a warp rift, two small asteroid fields"], ["First turn", "Tau"], ["Game ends", "A fleet is destroyed or has disengaged"]],
    bring: ["A sacked waystation (a model only)", "A warp rift and two small asteroid fields"],
    forces: { a: ["Three Protector class cruisers, commanded by Kor’O Ry’zon, Kor’el L’ikei and Kor’el Nua’ta (tools)."], b: ["8 vanguard drone ships: 4 with pyro-acid batteries, 4 with feeder tentacles.", "6 Kraken: 3 with massive claws, 3 with torpedoes.", "4 Kraken: 2 with pyro-acid batteries, 2 with feeder tentacles."] },
    draw: (v, W, H) => [R(0, 0, W, 15, "b", "Tyranids: 15 cm"), { z: "mark", x: W / 2, y: H - 10, s: "n", l: "waystation" }, R(0, H - 15, 15, 15, "a", ""), R(W - 15, H - 15, 15, 15, "a", ""),
      { z: "text", x: 22, y: H - 24, l: "Ry’zon", s: "a" }, { z: "text", x: W - 24, y: H - 24, l: "L’ikei", s: "a" }, { z: "mark", x: W / 2, y: H / 2, s: "a", l: "Nua’ta" }],
    fit: () => [90, 90], srcTable: [120, 120],
    mapNote: "The waystation sits 10 cm from the bottom edge. Ry’zon and L’ikei set up in the corners at that edge, up to 15 cm in; Nua’ta in the centre. All three face the far edge.",
    steps: [
      { t: "Any edge may be sunward. Place one warp rift and two small asteroid fields at random." },
      { t: "Place the sacked waystation 10 cm from one edge." },
      { s: "a", t: "Place Nua’ta in the centre, Ry’zon in the left corner and L’ikei in the right corner at the waystation edge, up to 15 cm onto the table. All three face the far edge." },
      { s: "b", t: "Deploy along the far edge, up to 15 cm onto the table." },
      { s: "a", t: "You take the first turn." }
    ],
    stools: [],
    notes: ["Exactly half the Tyranids surviving when the Tau have all disengaged is not covered: call it a plain draw.", "The vanguard drone ships and Kraken are in the Fleets book’s Tyranid lists (FL p. 429, 435–436)."],
    refs: [["Vanguard fleet list", "FL p. 429"], ["Kraken", "FL p. 435"], ["Vanguard drone ship", "FL p. 436"], ["Protector class cruiser", "FL p. 470"], ["Warp rifts", "RB p. 111"]],
    play: [{ w: "Disengaging", s: "a", t: "Your ships may disengage, but losing a single ship loses the battle." }],
    tools: [{ k: "html", html: CHARS_SUN }],
    rtools: [endTool([["A Tau ship was destroyed", "b", "The Tau lose"], ["Every Tyranid destroyed", "a", "Major Tau victory"], ["All Tau disengaged, under half the Tyranids left", "draw", "Tau: winning draw"], ["All Tau disengaged, over half the Tyranids left", "draw", "Tau: losing draw"]])],
    end: ["One fleet is destroyed or has disengaged completely."],
    win: ["Any Tau ship destroyed: the Tau lose.", "Every Tyranid destroyed: major Tau victory.", "All Tau disengaged: a losing draw if more than half the Tyranids survived, a winning draw if fewer did."],
    result(st) { return ending(st, [["A Tau ship was destroyed", "b", "The Tau lose"], ["Every Tyranid destroyed", "a", "Major Tau victory"], ["All Tau disengaged, under half the Tyranids left", "draw", "Tau: winning draw"], ["All Tau disengaged, over half the Tyranids left", "draw", "Tau: losing draw"]]); },
    info: { bg: "Disease has struck the project’s crews, and while Tas’ka and Sheva’s hunt for medicine, Ry’zon, L’ikei and Nua’ta investigate a destroyed waypoint at the edge of the Empire. The images on its security core show the Y’he — the Tyranids.", cr: [SUN + " " + SUNP(7) + "–9."] }
  },
  /* ============================================================ DISTANT SUN 2 SUPPLY AND DEMAND */
  {
    id: "fan-p-supply", grp: "fan-pdd", name: "Supply and Demand", series: "Distant Sun · Chapter Two", trust: "fan",
    why: "Two Tau ships must lift medicine from a Tau convoy without being caught — and without killing their own people.", src: SUNP(14), book: "O", suggest: ["Tau"],
    others: OTHERS_T + " The convoy is a Kor’vattra escort group (FL p. 454) with ten transports.",
    sides: { a: { n: "Tau hunters", f: "Tau: Distant Darkness" }, b: { n: "Tau convoy", f: "Tau Empire" } },
    pitch: "Half the project’s crews are sick with a Tau disease, and the medicine they need is on a Tau Empire convoy. Tas’ka and Sheva’s go to take some — from their own people.",
    glance: [["Points", "Fixed forces"], ["Table", "120 × 120 cm"], ["Battlezone", "Outer reaches: an asteroid field along one edge, two gas clouds"], ["First turn", "Tau hunters"], ["Game ends", "Mission done, or a fleet destroyed or disengaged"]],
    bring: ["10 Tau transports", "An asteroid field 90 cm long", "Two gas or dust clouds"],
    forces: { a: ["Two Protector class cruisers, commanded by Kor’el Tas’ka and Kor’el Sheva’s (tools)."], b: ["Hero class cruiser, Ld 7.", "Emissary class light cruisers, Ld 8 and Ld 6.", "2 Defender class escorts, Ld 7.", "10 Tau cargo transports, Ld 6."] },
    draw: (v, W, H) => [{ z: "hatch", x: 0, y: H - 30, w: Math.min(90, W - 30), h: 30, l: "asteroid field, 90 cm" }, R(W - 30, H - 30, 30, 30, "a", "hunters"), R(W - 40, H - 80, 30, 30, "b", "convoy", { dash: 1 }), { z: "text", x: W - 54, y: H - 92, l: "(see Agree)", s: "b" }],
    fit: () => [100, 100], srcTable: [120, 120],
    mapNote: "The asteroid field covers 90 cm of one edge, 30 cm deep. The hunters set up in the free 30 cm corner beside it; the convoy box follows the default agreed below.",
    steps: [
      { t: "Any edge may be sunward. Place an asteroid field along one edge, 90 cm long and 30 cm deep, and two gas or dust clouds at random." },
      { s: "a", t: "Set up in the free zone beside the asteroid field, up to 30 cm onto the table, facing inward." },
      { s: "b", t: "Set up the convoy in a box: {a:box}." },
      { s: "a", t: "You take the first turn." }
    ],
    stools: [],
    notes: ["The convoy’s box is described as on the hunters’ side, 30 cm deep, at least 10 cm from the edge behind it and 20–30 cm from the asteroid field — it cannot be all of these along the same edge as the field. The default is our reading; agree yours.", "Sheva’s +1 boarding bonus also helps here: his ship lifts the medicine on a 3+."],
    refs: [["Hero class starship", "FL p. 460"], ["Emissary class envoy ship", "FL p. 472"], ["Defender class starship", "FL p. 464"], ["Transports", "RB p. 135"], ["Disengaging", "RB p. 56"]],
    play: [
      { w: "Turns 1–3", s: "b", t: "−2 Leadership: the convoy is taken by surprise." },
      { w: "Lifting the medicine", s: "a", t: "Bring a ship into contact with a cargo transport and roll a D6 instead of a boarding action: 4+ succeeds (3+ for Sheva’s). Then get away — disengage any way you can." },
      { w: "No losses", s: "a", t: "If any of your ships is destroyed, you lose." }
    ],
    fx: T => T <= 3 ? [["b", "−2 Leadership"]] : [],
    tools: [{ k: "roll", id: "lift", s: "a", l: "Lifting the medicine", sub: "D6 for a ship in contact with a transport", rows: () => [[1, 2, "Failed"], [3, 3, "Succeeds for Sheva’s only"], [4, 6, "Medicine aboard"]] }, { k: "toggle", id: "got", s: "a", res: 1, l: "The medicine is aboard" }, { k: "html", html: CHARS_SUN }],
    rtools: [endTool([["Medicine lifted and the hunters disengaged", "a", "Mission successful"], ["A Tau hunter ship was destroyed", "b", "The hunters lose"], ["The hunters left without the medicine", "b", "Mission failed"]])],
    end: ["The hunters complete their mission, or a fleet is destroyed or has disengaged completely."],
    win: ["Hunters: lift the medicine (4+, Sheva’s 3+) and then disengage. Losing any ship loses the game."],
    result(st) { return ending(st, [["Medicine lifted and the hunters disengaged", "a", "Mission successful"], ["A Tau hunter ship was destroyed", "b", "The hunters lose"], ["The hunters left without the medicine", "b", "Mission failed"]]); },
    info: { bg: "A disease peculiar to the Tau is spreading through the project’s crews, and the Novamarine base that shelters them has no cure. Tas’ka and Sheva’s track down a Tau convoy carrying medical supplies, very close to Empire space.", cr: [SUN + " " + SUNP(10) + "–14."] }
  },
  /* ============================================================ DISTANT SUN 3 NIGHTMARES */
  {
    id: "fan-p-nightmares", grp: "fan-pdd", name: "Nightmares", series: "Distant Sun · Chapter Three", trust: "fan",
    why: "Three Tau cruisers come to the rescue of an Eldar grand cruiser chased by a hive fleet.", src: SUNP(21), book: "O", suggest: ["Tau", "Craftworld Eldar", "Tyranids"],
    others: OTHERS_T + " The Eldar ship is the Flame of Asuryan (FL p. 329) — Akaeris’ Spirit of Arina from Starblade.",
    sides: { a: { n: "Tau and Eldar", f: "Tau, with an Eldar grand cruiser" }, b: { n: "Tyranids", f: "Tyranids" } },
    pitch: "An Eldar vessel streaks past the planet with Kraken on its tail and a hive fleet ahead. Three Tau cruisers decide to help.",
    glance: [["Points", "Fixed forces"], ["Table", "180 × 120 cm"], ["Battlezone", "Mercurial zone; a medium planet and an asteroid line"], ["First turn", "Tau"], ["Game ends", "A fleet is destroyed or has disengaged"]],
    bring: ["A medium planet", "An asteroid field 20 × 10 cm", "A Tyranid hive fleet", "An Eldar grand cruiser", "D3+2 blast markers"],
    forces: { a: ["Three Protector class cruisers, commanded by Kor’O Ry’zon, Kor’el Tas’ka and Kor’el Sheva’s (tools).", "Void Dragon class grand cruiser: Ld 10, 3 re-rolls — the Flame of Asuryan (FL p. 329)."], b: ["Hive ship, Ld 8: prow feeder tentacles and massive claws, thorax pyro-acid battery, two launch bays each side, bio-plasma discharge; adrenaline sacs.", "Cruiser: prow torpedoes, thorax feeder tentacles, pyro-acid batteries each side, bio-plasma discharge.", "Cruiser: prow massive claws, thorax torpedoes, two pyro-acid batteries each side; solar vanes.", "6 escort drones (3 feeder tentacles, 3 bio-plasma), 8 vanguard drone ships (4 pyro-acid, 4 feeder tentacles), 6 Kraken (2 massive claws, 4 torpedoes).", "4 fighters and 4 assault boats."] },
    draw: (v, W, H) => { const px = 40, py = H - 40; return [{ z: "sun", e: "t" }, { z: "planet", cx: px, cy: py, r: 10 }, { z: "hatch", x: px + 30, y: py - 5, w: 20, h: 10, l: "" }, { z: "mark", x: px + 20, y: py, s: "a", l: "" }, { z: "text", x: px + 30, y: py + 13, l: "Eldar ship", s: "a" },
      { z: "mark", x: Math.max(4, px - 10), y: py - 18, s: "b", l: "" }, { z: "text", x: Math.max(4, px - 10), y: py - 28, l: "Kraken", s: "b" }, R(60, 30, Math.max(10, W - 140), H - 60, "b", "Tyranid fleet", { dash: 1 }),
      R(W - 30, 45, 8, Math.max(4, H - 90), "a", ""), { z: "text", x: W - 26, y: 36, l: "Tau", s: "a" }]; },
    fit: () => [170, 110], srcTable: [180, 120],
    mapNote: "The planet’s edge is 30 cm from a short and a long edge; the asteroid field runs from 20 cm beyond it toward the middle. The Kraken start 30 cm behind the Eldar ship. The Tau start 30 cm from the far short edge, 45 cm from the long edges.",
    steps: [
      { t: "One long edge is sunward. Place a medium planet 30 cm from a short edge and 30 cm from a long edge, and a 20 × 10 cm asteroid field 20 cm from its edge, pointing straight at the middle of the table. Generate other phenomena for the mercurial zone (RB p. 107), ignoring planets." },
      { s: "a", t: "Place the Eldar ship between the planet and the asteroid field, facing the far short edge, with D3+2 blast markers scattered behind it." },
      { s: "b", t: "Place the Kraken squadron 30 cm behind the Eldar ship, chasing it, each with a blast marker in contact. Place the rest in a box 60 cm from the Eldar short edge, 80 cm from the Tau short edge and 30 cm from the long edges; roll a scatter dice for each capital ship’s and squadron’s facing." },
      { s: "a", t: "Place your three cruisers 30 cm from the far short edge and 45 cm from the long edges, in a triangle with Ry’zon leading." },
      { s: "a", t: "You take the first turn." }
    ],
    stools: [{ k: "val", id: "bm", l: "Blast markers behind the Eldar ship (D3+2)", opts: [3, 4, 5], roll: () => dn(3) + 2 }],
    notes: ["The supplement asks for the Eldar MMS rules for the grand cruiser; the Fleets book’s Flame of Asuryan (FL p. 329) is the book equivalent.", "The Tyranid evolutions are in the Fleets book (FL p. 426–427)."],
    refs: [["Flame of Asuryan", "FL p. 329"], ["Hive ship", "FL p. 432"], ["Tyranid cruiser", "FL p. 434"], ["Evolution of the hive mind", "FL p. 426"], ["Battlezone generators", "RB p. 107–108"]],
    play: [{ w: "No losses", s: "a", t: "If any Tau ship or the Eldar ship is destroyed, you lose." }, DISENGAGE_DRAW],
    tools: [{ k: "html", html: CHARS_SUN }],
    rtools: [endTool([["A Tau ship or the Eldar ship was destroyed", "b", "The Tau lose"], ["Every Tyranid destroyed", "a", "Tau victory"], ["The Tau and Eldar disengaged", "draw", "As agreed"]])],
    end: ["One fleet is destroyed or has disengaged completely."],
    win: ["Any Tau ship or the Eldar ship destroyed: the Tau lose.", "Every Tyranid destroyed: Tau victory."],
    result(st) { return ending(st, [["A Tau ship or the Eldar ship was destroyed", "b", "The Tau lose"], ["Every Tyranid destroyed", "a", "Tau victory"], ["The Tau and Eldar disengaged", "draw", "Draw (as agreed)"]]); },
    info: { bg: "Following the Tyranid trail, the three Tau cruisers find an Eldar grand cruiser fleeing a hive fleet. Its captain is Akaeris of Starblade, and helping him will change what the outcasts become.", cr: [SUN + " " + SUNP(15) + "–21."] }
  },
  /* ============================================================ DISTANT SUN 4 SPIRIT WITHIN, SPIRIT WITHOUT */
  {
    id: "fan-p-spirit", grp: "fan-pdd", name: "Spirit Within, Spirit Without", series: "Distant Sun · Chapter Four", trust: "fan",
    why: "One Tau cruiser against an Ork kroozer and two squadrons, in a crowded asteroid field around a relic station.", src: SUNP(27), book: "O", suggest: ["Tau", "Orks"],
    others: OTHERS_T + " Any cruiser against a light cruiser and four escorts.",
    sides: { a: { n: "Nua’ta", f: "Tau: Distant Darkness" }, b: { n: "Orks", f: "Orks" } },
    pitch: "Orks are picking over an ancient asteroid station. Nua’ta comes in alone, from any direction he likes.",
    glance: [["Points", "Fixed forces"], ["Table", "120 × 120 cm"], ["Battlezone", "Inner biosphere; D3+2 asteroid fields per quarter"], ["First turn", "Nua’ta"], ["Game ends", "A fleet is destroyed or has disengaged"]],
    bring: ["An asteroid-built space station", "Plenty of asteroid fields"],
    forces: { a: ["Protector class cruiser, commanded by Kor’el Nua’ta (tools)."], b: ["Kill Kroozer, Ld 7.", "Two squadrons of 2 Onslaught attack ships, Ld 5 and Ld 6."] },
    draw: (v, W, H) => [{ z: "line", x1: W / 2, y1: 0, x2: W / 2, y2: H }, { z: "line", x1: 0, y1: H / 2, x2: W, y2: H / 2 }, { z: "mark", x: W / 2, y: H / 2, s: "b", l: "station" }, { z: "ring", cx: W / 2, cy: H / 2, r: 30, s: "b" },
       { z: "text", x: W / 4, y: H / 4, l: "D3+2 asteroid\nfields per quarter", s: "n" },
      { z: "edge", e: "t", s: "a", dash: 1, l: "Nua’ta enters from any edge" }, { z: "edge", e: "b", s: "a", dash: 1, l: "" }, { z: "edge", e: "l", s: "a", dash: 1, l: "" }, { z: "edge", e: "r", s: "a", dash: 1, l: "" }],
    fit: () => [90, 90], srcTable: [120, 120],
    mapNote: "The station is in the centre; the Onslaughts start within 30 cm of it.",
    steps: [
      { t: "Roll which edge is sunward. Place D3+2 asteroid fields at random in each quarter of the table (tool below)." },
      { s: "b", t: "Place the asteroid station in the centre. Your Kill Kroozer is docked at it as if in low orbit; place both Onslaught squadrons within 30 cm of it, facing any way." },
      { s: "a", t: "You enter from any table edge in turn 1, and take the first turn." }
    ],
    stools: [{ k: "shiproll", id: "q", l: "Asteroid fields per quarter (D3+2)", cl: "Quarters", n0: 4, roll: () => dn(3) + 2, il: i => "Quarter " + (i + 1), out: d => d + " asteroid fields" }],
    notes: ["The supplement does not say what happens if Nua’ta disengages; the default follows Into the Claw, where the Tau disengaging is a draw."],
    refs: [["Kill Kroozer", "FL p. 382"], ["Onslaught attack ship", "FL p. 384"], ["Asteroid fields", "RB p. 110"], ["Fighting in low orbit", "RB p. 116"]],
    play: [{ w: "The docked kroozer", s: "b", t: "It must pass a Leadership test to leave the station." }, { w: "Turns 1–3", s: "b", t: "−1 Leadership." }, { w: "No losses", s: "a", t: "If your ship is destroyed, you lose." }, DISENGAGE_DRAW],
    fx: T => T === 1 ? [["a", "Enter from any edge"], ["b", "−1 Leadership"]] : T <= 3 ? [["b", "−1 Leadership"]] : [],
    tools: [{ k: "html", html: CHARS_SUN }],
    rtools: [endTool([["Nua’ta’s ship was destroyed", "b", "The Tau lose"], ["Every Ork destroyed", "a", "Major Tau victory"], ["Nua’ta disengaged", "draw", "As agreed"]])],
    end: ["One fleet is destroyed or has disengaged completely."],
    win: ["Nua’ta’s ship destroyed: the Tau lose.", "Every Ork destroyed: major Tau victory."],
    result(st) { return ending(st, [["Nua’ta’s ship was destroyed", "b", "The Tau lose"], ["Every Ork destroyed", "a", "Major Tau victory"], ["Nua’ta disengaged", "draw", "Draw (as agreed)"]]); },
    info: { bg: "Nua’ta follows a lead to an ancient station built inside an asteroid, where an Ork crew is plundering a relic. The voice in his head has opinions about it.", cr: [SUN + " " + SUNP(22) + "–27."] }
  },
  /* ============================================================ DISTANT SUN 5 RISING SHADOW */
  {
    id: "fan-p-rising-shadow", grp: "fan-pdd", name: "Rising Shadow", series: "Distant Sun · Chapter Five", trust: "fan",
    why: "The Bait against a hive fleet: Sheva’s is the bait, Ry’zon and Tas’ka the jaws.", src: SUNP(32), book: "O", suggest: ["Tau", "Tyranids"],
    others: OTHERS_T + " Any small hive fleet will do.",
    sides: { a: { n: "Tau hunters", f: "Tau: Distant Darkness" }, b: { n: "Tyranids", f: "Tyranids" } },
    pitch: "Sheva’s draws a hive ship and its brood into a chase — straight toward the guns of Ry’zon and Tas’ka.",
    glance: [["Points", "Fixed forces"], ["Table", "180 × 120 cm"], ["Battlezone", "Deep space: a warp rift, 4 gas clouds"], ["First turn", "Tau"], ["Game ends", "A fleet is destroyed or has disengaged"]],
    bring: ["A warp rift about 20 × 35 cm", "4 gas or dust clouds", "A Tyranid hive fleet"],
    forces: { a: ["Kor’el Sheva’s in a Protector: the bait.", "Reinforcements: Protectors commanded by Kor’O Ry’zon and Kor’el Tas’ka (tools)."], b: ["Hive ship, Ld 8: prow bio-plasma spines, thorax pyro-acid battery, a launch bay each side, two bio-plasma discharges; more discharge vents.", "Cruiser: prow massive claws, thorax feeder tentacles, pyro-acid batteries each side, bio-plasma discharge; reinforced carapace.", "Cruiser: prow pyro-acid battery, thorax torpedoes, two pyro-acid batteries each side; extra spore cysts.", "6 escort drones (3 feeder tentacles, 3 pyro-acid), 2 fighters, 3 assault boats."] },
    draw: (v, W, H) => MAPS["the-bait"](v, W, H).concat([R(0, 30, 45, H - 60, "n", "", { dash: 1 }), { z: "text", x: 22, y: 22, l: "warp rift box", s: "n" }]),
    fit: () => [140, 60], srcTable: [180, 120],
    mapNote: "As The Bait (RB p. 130): Sheva’s in the centre, the Tyranids more than 60 cm behind, Ry’zon and Tas’ka entering from the edge ahead. The warp rift is placed by scatter dice in a box up to 45 cm from a short edge ({a:rift}).",
    steps: [
      { t: "Roll which edge is sunward. Place a warp rift about 20 × 35 cm with a scatter dice, in a box up to 45 cm from a short edge ({a:rift}), and 4 gas or dust clouds spread evenly." },
      { s: "a", t: "Place Sheva’s in the centre, facing a short edge. Keep Ry’zon and Tas’ka off the table: they enter from the edge in front of him." },
      { s: "b", t: "Deploy more than 60 cm behind Sheva’s." },
      { s: "a", t: "You take the first turn." }
    ],
    stools: [],
    notes: ["The supplement does not say which short edge gets the warp rift, or what happens if the Tau disengage; the defaults are our suggestion."],
    refs: [["The Bait", "RB p. 130"], ["Hive ship", "FL p. 432"], ["Evolution of the hive mind", "FL p. 426"], ["Warp rifts", "RB p. 111"]],
    play: [{ w: "Any turn", s: "a", t: "Ry’zon and Tas’ka may enter on any turn; from turn 2 also up to 30 cm along a long edge for each turn after the first (tools)." }, { w: "No losses", s: "a", t: "If any of your ships is destroyed, you lose." }, DISENGAGE_DRAW],
    fx: T => entryFx(T),
    tools: [{ k: "info", html: st => entryInfo(st.turn) }, { k: "html", html: CHARS_SUN }],
    rtools: [endTool([["A Tau ship was destroyed", "b", "The Tau lose"], ["Every Tyranid destroyed", "a", "Major Tau victory"], ["The Tau disengaged", "draw", "As agreed"]])],
    end: ["One fleet is destroyed or has disengaged completely."],
    win: ["Any Tau ship destroyed: the Tau lose.", "Every Tyranid destroyed: major Tau victory."],
    result(st) { return ending(st, [["A Tau ship was destroyed", "b", "The Tau lose"], ["Every Tyranid destroyed", "a", "Major Tau victory"], ["The Tau disengaged", "draw", "Draw (as agreed)"]]); },
    info: { bg: "The Tyranid invasion is growing, and the outcasts begin to fight it in earnest. Sheva’s, proud as ever, volunteers to be the bait.", cr: [SUN + " " + SUNP(28) + "–32."] }
  },
  /* ============================================================ DISTANT SUN 6 ABANDON ALL HOPE */
  {
    id: "fan-p-abandon", grp: "fan-pdd", name: "Abandon All Hope", series: "Distant Sun · Chapter Six", trust: "fan",
    why: "All five Tau cruisers against two hive ships: Nua’ta must reach the Kraken swarm and sow orbital mines among them.", src: SUNP(41), book: "O", suggest: ["Tau", "Tyranids"],
    others: OTHERS_T + " Any big hive fleet will do.",
    sides: { a: { n: "Tau hunters", f: "Tau: Distant Darkness" }, b: { n: "Tyranids", f: "Tyranids" } },
    pitch: "The hive fleet is about to fall on an Eldar maiden world. Five Tau cruisers set up the trap; Nua’ta carries the mines that might break the Kraken swarm.",
    glance: [["Points", "Fixed forces"], ["Table", "180 × 120 cm"], ["Battlezone", "Primary biosphere; random phenomena"], ["First turn", "Tau"], ["Game ends", "Nua’ta launches his mines, or a Tau ship dies"]],
    bring: ["A large hive fleet with two hive ships", "20 Kraken", "Orbital mine markers (FL p. 512)"],
    forces: { a: ["Five Protector class cruisers, commanded by Kor’O Ry’zon, Kor’el L’ikei, Kor’el Nua’ta (carrying orbital mines), Kor’el Sheva’s and Kor’el Tas’ka (tools)."], b: ["Hive ship, Ld 9: prow feeder tentacles and massive claws, thorax pyro-acid battery, two launch bays each side, bio-plasma discharge; solar vanes, extra spore cysts.", "Hive ship, Ld 8: prow pyro-acid battery, thorax bio-plasma discharge, a launch bay, bio-plasma discharge and pyro-acid battery each side; reinforced carapace, mucous membrane.", "Two cruisers (see the source for weapons) and 2 × 6 escort drones, 2 × 4 vanguard drone ships, 3 fighters, 4 assault boats, 3 boarding torpedoes.", "Kraken group, arriving in turn 2: 10 Kraken (5 massive claws, 5 torpedoes) and 10 Kraken (5 pyro-acid, 5 feeder tentacles)."] },
    draw: (v, W, H) => swap(MAPS["fleet-engagement"]("A", W, H)),
    fit: () => [140, 100], srcTable: [180, 120],
    mapNote: "Fleet Engagement set-up A (RB p. 142): the Tau in the white box, the Tyranids in the three dark divisions. The Kraken arrive in turn 2 from the Tyranids’ left short edge.",
    steps: [
      { t: "Roll which long edge is sunward and place celestial phenomena at random for the primary biosphere (RB p. 107)." },
      { s: "a", t: "Deploy in the white box of Fleet Engagement set-up A (map)." },
      { s: "b", t: "Deploy in the three dark divisions. Keep the two Kraken squadrons off the table: they enter in turn 2 from your left short edge." },
      { s: "a", t: "You take the first turn." }
    ],
    stools: [],
    notes: ["The special rules say Nua’ta must launch within 10 cm of both Kraken squadrons, the victory conditions within 15 cm. Agree which.", "Orbital mines (FL p. 512): Nua’ta has enough for three launches, each a normal launch of ordnance."],
    refs: [["Fleet Engagement", "RB p. 142–143"], ["Orbital mine", "FL p. 512"], ["Kraken", "FL p. 435"], ["Hive ship", "FL p. 432"], ["Evolution of the hive mind", "FL p. 426"]],
    play: [{ w: "Turn 2", s: "b", t: "Both Kraken squadrons enter from your left short edge. They are hive-linked: at least one escort of each squadron must stay within 10 cm of the other." },
      { w: "Nua’ta’s mines", s: "a", t: "Get Nua’ta to the Kraken group and launch his orbital mines as normal ordnance, within {a:range} cm of both squadrons. He has three launches. The moment he launches, the game ends." },
      { w: "No losses", s: "a", t: "If any of your ships is destroyed, the game ends and you lose." }],
    fx: T => T === 2 ? [["b", "The Kraken group enters from your left short edge"]] : [],
    tools: [{ k: "counter", id: "mines", s: "a", max: 3, l: "Mine launches used" }, { k: "html", html: CHARS_SUN }],
    rtools: [endTool([["Nua’ta launched his mines in range", "a", "Tau victory"], ["A Tau ship was destroyed", "b", "The Tau lose"]])],
    end: ["Nua’ta launches his orbital mines, or a Tau ship is destroyed."],
    win: ["Tau: Nua’ta launches his mines within range of both Kraken squadrons.", "Any Tau ship destroyed first: the Tau lose."],
    result(st, v, S) { return endingResult(st, S, "how"); },
    info: { bg: "The hive fleet’s path leads to an Eldar maiden world. To protect it, the five outcasts and their crews — many of them still sick — stake everything on one plan.", cr: [SUN + " " + SUNP(33) + "–41."] }
  },
  /* ============================================================ DISTANT SUN 7 EVER DREAM */
  {
    id: "fan-p-ever-dream", grp: "fan-pdd", name: "Ever Dream", series: "Distant Sun · Chapter Seven", trust: "fan",
    why: "Three wrecked Tau cruisers surrounded by an endless hive fleet: hold on until the Eldar can teleport the crews out.", src: SUNP(51), book: "O", suggest: ["Tau", "Craftworld Eldar", "Tyranids"],
    others: OTHERS_T + " The Eldar ship is the Flame of Asuryan (FL p. 329), Akaeris’ Spirit of Arina.",
    sides: { a: { n: "Tau and Eldar", f: "Tau, with an Eldar grand cruiser" }, b: { n: "Tyranids", f: "Tyranids" } },
    pitch: "Three battered Tau cruisers sit surrounded by the hive fleet, and every creature that dies is replaced. Their only way out is the Eldar ship coming in from the edge of the table.",
    glance: [["Points", "Fixed forces, damaged"], ["Table", "180 × 120 cm"], ["Battlezone", "As Abandon All Hope"], ["First turn", "Tau"], ["Game ends", "The rescue succeeds, or Ry’zon, L’ikei or the Eldar ship dies"]],
    bring: ["The hive fleet that survived Abandon All Hope", "An Eldar grand cruiser", "Blast markers"],
    forces: { a: ["Kor’O Ry’zon’s Protector: 5 hits left, port ion cannon damaged, no attack craft.", "Kor’el L’ikei’s Protector: 5 hits left, 2 blast markers in contact.", "Kor’el Sheva’s Protector: 1 hit left, shields collapsed, port weapons offline, starts braced for impact, no attack craft.", "Void Dragon class grand cruiser (the Flame of Asuryan, FL p. 329): Ld 10, 3 re-rolls, entering in turn 1."], b: ["The hive fleet of Abandon All Hope, battered: the second hive ship down to 9 hits, one cruiser to 5, the other to 3 and crippled; 4 + 5 escort drones, 2 + 4 vanguard drone ships, a fighter, 5 assault boats, 5 boarding torpedoes."] },
    draw: (v, W, H) => [R(W / 2 - 15, H / 2 - 10, 30, 20, "a", "Tau"), { z: "ring", cx: W / 2, cy: H / 2, r: 30, s: "b" }, { z: "ring", cx: W / 2, cy: H / 2, r: 58, s: "b" }, { z: "text", x: W / 2, y: H / 2 + 38, l: "Tyranids: 15–45 cm from the Tau", s: "b" },
      { z: "edge", e: "l", s: "a", l: "Eldar enter at the centre of a short edge" }, { z: "edge", e: "r", s: "a", l: "" }],
    fit: () => [140, 120], srcTable: [180, 120],
    mapNote: "The Tau sit in a 30 × 20 cm box in the centre, all facing the same long edge. Every Tyranid starts 15–45 cm from them, no two Tyranid units within 15 cm of each other.",
    steps: [
      { t: "Set up the celestial phenomena exactly as in Abandon All Hope." },
      { s: "a", t: "Place your three cruisers in a box in the centre, 30 cm along the long edges and 20 cm along the short ones, all facing the same long edge." },
      { s: "b", t: "Place every ship 15–45 cm from a Tau ship, no capital ship or squadron within 15 cm of another. Roll a scatter dice for the facing of capital ships and escort drones; the vanguard point at the Tau." },
      { s: "a", t: "The Eldar ship enters from the centre of either short edge at the start of turn 1. You take the first turn." }
    ],
    stools: [],
    notes: ["The supplement asks for the Eldar MMS rules; the Fleets book’s Flame of Asuryan (FL p. 329) is the book equivalent.", "How the rescue teleport works is only partly given: whose shields count and who is rescued. The default is our reading."],
    refs: [["All is Lost", "FL p. 418"], ["Teleport attacks", "RB p. 92"], ["Flame of Asuryan", "FL p. 329"], ["Hive ship", "FL p. 432"]],
    play: [
      { w: "Every turn after the first", s: "b", t: "At the start of your turn, every ship destroyed so far comes back: a new one of the same profile at the centre of a random table edge. Escorts wait until three can form a squadron." },
      { w: "Sheva’s", s: "a", t: "Sheva’s may blow up his own ship using the Tyranid rules’ All is Lost option (FL p. 418)." },
      { w: "Rescue teleport", s: "a", t: "The Eldar ship may try a special teleport within 10 cm of Tau ships ({a:rescue}): 2+ if their shields are down, 4+ if they are up. It cannot make a normal teleport attack in the same turn." }
    ],
    fx: T => T === 1 ? [["a", "The Eldar ship enters from the centre of a short edge"]] : [["b", "Start of your turn: replace every destroyed ship at a random edge"]],
    tools: [{ k: "roll", id: "tp", s: "a", l: "Rescue teleport", rows: () => [[1, 1, "Failed"], [2, 3, "Rescued only if the shields are down"], [4, 6, "Rescued"]] }, { k: "roll", id: "edge", s: "b", l: "Where a new creature appears", die: 4, sub: "D4: centre of a table edge", rows: () => [[1, 1, "Top long edge"], [2, 2, "Right short edge"], [3, 3, "Bottom long edge"], [4, 4, "Left short edge"]] }, { k: "html", html: CHARS_SUN }],
    rtools: [endTool([["Ry’zon and L’ikei were teleported to safety", "a", "Tau victory"], ["Ry’zon, L’ikei or the Eldar ship was destroyed", "b", "The Tau lose"]])],
    end: ["Ry’zon, L’ikei or the Eldar ship is destroyed, or the Eldar make a successful rescue teleport."],
    win: ["Tau: the Eldar teleport Ry’zon and L’ikei to safety.", "Otherwise the Tau lose."],
    result(st, v, S) { return endingResult(st, S, "how"); },
    info: { bg: "The plan worked, but at a cost: three Tau cruisers are wrecks, ringed by a hive fleet that keeps on coming. Akaeris turns the Spirit of Arina back to get them out — and the epilogue sees the survivors settle on the Eldar maiden world they saved.", cr: [SUN + " " + SUNP(42) + "–54."] }
  }
  ]);
})();
