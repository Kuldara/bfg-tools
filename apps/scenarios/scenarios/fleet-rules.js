/* Fleet-specific scenario rules (0.14, 23.10.2026). Some fleet lists of Fleets v0.36 say how that fleet
   plays the book's scenarios (e.g. the Tyranids' Scenario Notes, FL p. 428). Every row was checked against
   the Fleets Book's text (extractor/lists_raw.json and data/bfg_data.json, pages from bfg_data.json's cpg
   fields), not from memory or another AI's summary. What was left out and why: the Finnish notes,
   docs/history/scenarios/LUEMINUT.md, the section on fleet scenario rules (0.14), in Finnish.

   Row fields:
     f     the fleet (a FLEET_LIST name)
     sc    scenario ids, or "*" = every scenario (shown only when the fleet is chosen)
     s     the side the row applies to (absent = either); may be { scenario: side }
     t     the rule in our own words (Set-up)
     p     the source
     ok    true = the source says explicitly that no changes are needed
     bad   a side the fleet cannot play (a warning when the fleet is chosen for it)
     w, play  a reminder on the Play tab (when, what)
     arr   an addition to the arrival roll (Escalating Engagement: the ARRIVAL tool) */
const FLEET_LIST = ["Imperial Navy", "Space Marines", "Adeptus Mechanicus", "Inquisition", "Rogue Traders", "Chaos", "Craftworld Eldar", "Eldar Corsairs", "Dark Eldar", "Orks", "Necrons", "Tyranids", "Tau", "Demiurg"];

const FLEET_RULES = [
  /* ---------------- Tyranids: Scenario Notes, FL p. 428 */
  { f: "Tyranids", sc: ["escalating-engagement"], p: "FL p. 428", arr: 1,
    t: "Hive fleets stay concentrated, but their slow hive ships suffer here: add +1 to every roll for a division to arrive.",
    w: "Start of your turn", play: "+1 to each arrival roll (FL p. 428)." },
  { f: "Tyranids", sc: ["cruiser-clash"], p: "FL p. 428",
    t: "May field one hive ship and three cruisers instead of four cruisers. If so: no refits or escorts, the hive ship is at most Ld 8, and in this scenario Brace for Impact uses Ld 7 and navigating celestial phenomena Ld 10.",
    w: "All game", play: "With a hive ship: Brace for Impact at Ld 7, navigating phenomena at Ld 10 (FL p. 428)." },
  { f: "Tyranids", sc: ["planetary-assault"], s: "a", p: "FL p. 428",
    t: "No free transports. Instead score 1 assault point for each spore cyst on ships that get within 30 cm of the planet’s surface, and 1 for each torpedo strength point and each assault boat marker that reaches the surface.",
    w: "Landing troops", play: "Assault points: 1 per spore cyst on ships within 30 cm of the surface, 1 per torpedo strength point and per assault boat marker reaching it (FL p. 428)." },
  { f: "Tyranids", sc: ["fl-craftworld-assault"], s: "b", p: "FL p. 428",
    t: "The scenario notes’ assault points apply on the craftworld: 1 for each spore cyst on ships within 30 cm of its edge, and 1 for each torpedo strength point and each assault boat marker that reaches it. No transports.",
    w: "Landing troops", play: "Assault points: 1 per spore cyst on ships within 30 cm of the craftworld, 1 per torpedo strength point and per assault boat marker reaching it (FL p. 428)." },
  { f: "Tyranids", sc: ["planetary-assault", "exterminatus"], s: "b", p: "FL p. 428",
    t: "Defending, the hive fleet may spend its extra planetary defence points on ordnance instead." },
  { f: "Tyranids", sc: ["exterminatus"], bad: "a", p: "FL p. 428",
    t: "Never the attacker in Exterminatus: if it is rolled with the Tyranids attacking, play Planetary Assault instead. Infested worlds make them common defenders." },
  { f: "Tyranids", sc: ["convoy"], bad: "a", p: "FL p. 428",
    t: "A void-dwelling race has no convoys, so the Tyranids cannot be the convoy. They make good attackers." },
  { f: "Tyranids", sc: ["the-bait", "the-raiders", "surprise-attack", "blockade-run", "fleet-engagement"], ok: true, p: "FL p. 428",
    t: "No changes: the scenario notes say the Tyranids play this one as written." },

  /* ---------------- Space Marines */
  { f: "Space Marines", sc: ["planetary-assault"], s: "a", p: "FL p. 94, 96",
    t: "Strike cruisers and battle barges score 2 assault points for each turn landing troops or bombarding, not 1; drop pods give every Space Marine capital ship the same +2.",
    w: "Landing troops", play: "Capital ships score 2 assault points a turn instead of 1 (FL p. 94, 96)." },
  { f: "Space Marines", sc: ["exterminatus"], s: "a", p: "FL p. 94",
    t: "A battle barge can be an Exterminator exactly as it is (virus bombs and cyclotronic warheads are standard). In position, it exterminates the planet on 3+ instead of 4+.",
    w: "Exterminating", play: "A battle barge in position exterminates on 3+ (FL p. 94)." },
  { f: "Space Marines", sc: "*", p: "FL p. 99",
    t: "A Crusade fleet with a fortress-monastery is always the defender. The fortress-monastery is used only as a defence, or in place of the planet in scenarios that have one." },

  /* ---------------- Inquisition (and Grey Knights) */
  { f: "Inquisition", sc: ["convoy"], s: "a", p: "FL p. 149",
    t: "A Blackship may be the convoy on its own, counting as eight transports when working out the escort. One Inquisitorial cruiser may join the escort, and the Blackship’s points count against the escorting fleet. (Grey Knights fleets too.)" },
  { f: "Inquisition", sc: ["exterminatus"], s: "a", p: "FL p. 149, 150, 160",
    t: "Ships with torpedo tubes can be Exterminators at no cost. An Inquisitorial cruiser with the torpedo refit exterminates on 3+ instead of 4+. A Blackship used as an Exterminator must be led by an Ordo Hereticus Inquisitor.",
    w: "Exterminating", play: "An Inquisitorial cruiser with torpedoes exterminates on 3+ (FL p. 160)." },

  /* ---------------- Chaos */
  { f: "Chaos", sc: ["planetary-assault"], s: "a", p: "FL p. 237",
    t: "Daemonships score no assault points for landing troops.",
    w: "Landing troops", play: "Daemonships score no assault points (FL p. 237)." },
  { f: "Chaos", sc: ["exterminatus"], s: "a", p: "RB p. 140, FL p. 227",
    t: "An Activated Blackstone Fortress may be the Exterminator and keeps all its weapons. Daemonships cannot carry Exterminatus weapons." },

  /* ---------------- Dark Eldar */
  { f: "Dark Eldar", sc: ["convoy"], s: "a", p: "FL p. 349",
    t: "Defending, the Dark Eldar may use Imperial transports of any type — captured merchantmen on their way to the lair." },

  /* ---------------- Orks (fleet rules, all Ork lists) */
  { f: "Orks", sc: ["planetary-assault", "exterminatus", "surprise-attack"], s: "b", p: "FL p. 362, 369",
    t: "Roks may be bought with the planetary defence points. Bought that way a Rok cannot move, passes Leadership tests automatically and may only Reload Ordnance or Brace for Impact (at Ld 7). Roll 2D6 for each Rok after setting it up: on a 12 it falls 2D6 cm toward the phenomenon it orbits, and is destroyed if it touches an asteroid field or the planet edge. Orks may also use the rulebook’s defences, with a non-moving Space Hulk in place of a Blackstone Fortress." },

  /* ---------------- Tau */
  { f: "Tau", sc: ["planetary-assault", "exterminatus", "surprise-attack"], s: "b", p: "FL p. 451–452",
    t: "Planetary defence points may be spent only on Tau orbitals, which follow the High Orbit and satellite defence rules. No other planetary defences." },
  { f: "Tau", sc: "*", p: "FL p. 481",
    t: "Defending, the Tau may use a Waystation in any scenario, even one without planetary defences." },

  /* ---------------- Rogue Traders */
  { f: "Rogue Traders", sc: ["convoy"], s: "a", p: "FL p. 187, 192, 202",
    t: "A heavy transport counts as two transports (one if crippled), an armed cargo vessel as half a transport, rounding down — one alone counts as none. An Exploration fleet pays full cost for its cargo ships." },
  { f: "Rogue Traders", sc: ["planetary-assault"], s: "a", p: "FL p. 192, 202",
    t: "Within 30 cm of the planet edge a heavy transport is worth 4 assault points (2 if crippled) instead of a transport’s 2; an armed cargo vessel is worth 1.",
    w: "Landing troops", play: "Heavy transport 4 assault points (2 crippled), armed cargo vessel 1 (FL p. 192, 202)." },
  { f: "Rogue Traders", sc: "*", p: "FL p. 185",
    t: "A game with a Rogue Trader cruiser must use a sub-plot (Sub-plots tab). Fail it and the enemy scores the cruiser as if crippled — as destroyed if it really was crippled.",
    w: "End of the game", play: "Rogue Trader cruiser: failed sub-plot = enemy scores it as crippled, or destroyed if it was crippled (FL p. 185)." },
  { f: "Rogue Traders", sc: "*", p: "FL p. 188",
    t: "A Pirates fleet rolls its scenario on the raid table. As an attacker of 1,500 pts or more it may play Planetary Assault on a roll of 6." },

  /* ---------------- Necrons */
  { f: "Necrons", sc: "*", p: "FL p. 404",
    t: "Fading out does not deny victory points: a capital ship that disengages undamaged counts as 10% destroyed, a damaged one or any raider 25%, crippled 50%, destroyed 200% and a drifting hulk 300%.",
    w: "End of the game", play: "Necron losses: disengaged undamaged 10%, damaged or raider 25%, crippled 50%, destroyed 200%, hulk 300% (FL p. 404)." }
];

/* the rows for this scenario; the general ones ("*") only for the chosen fleet */
function fleetRulesFor(sc, picked) {
  const fs = Object.values(picked || {}).filter(Boolean);
  return FLEET_RULES.filter(r => r.sc === "*" ? fs.includes(r.f) : r.sc.includes(sc.id));
}
function fleetRuleSide(r, sc) { return r.s && typeof r.s === "object" ? r.s[sc.id] : r.s; }
