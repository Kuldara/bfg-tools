/* Warp Riftin skenaarioiden luokitus (käyttäjän linja 21.10.2026).
   Kirjaston oma arvio SKENAARIOSTA, ei kirjoittajasta: Warp Riftin kaikki artikkelit ovat samaa
   fanityötä (horizon Discordissa 20.10.). Perusteet: pelataanko kirjan säännöillä, kertooko lähde
   pelaamisesta ja kuinka paljon perusasioita (asettelu, aloitus, kesto, voittoehto, kartta) puuttuu.
     rec   = Recommended: kirjan säännöt ja pöytävalmis (yhdistetty Solid + Recommended, käyttäjä 21.10.)
     agree = Agree first: perusasioita puuttuu tai ne ovat epäselviä
     fan   = Needs fan rules: aina kun book on "E"
   Perustelu näkyy skenaarion sivulla ("Library rating"). Tason voi vaihtaa tässä; sisältötesti
   tarkistaa, että jokaisella WR-skenaariolla on rivi ja että fan ⇔ book "E". */
const WR_RATE = {
  /* Recommended */
  "siege-of-fularis":        ["rec", "Book and scenario rules, complete apart from one points slip handled here. The author warns it is hard on the defender."],
  "assassination":           ["rec", "Book rules only; one small gap (where re-deployed ships may go)."],
  "eliarenaths-gift":        ["rec", "Book and scenario rules; only the optional third player’s turn order is left open."],
  "diasporex-gambit":        ["rec", "Book and scenario rules, every ship in the Fleets book; two small gaps."],
  "fall-of-arcianr":         ["rec", "Competition winner on published background, played with the book’s lists; complete."],
  "unknown-weapons":         ["rec", "Competition entry on published background, played with the book’s lists; only a 200 × 200 cm table is described."],
  "wr-who-goes-there":       ["rec", "Played many times by the author’s group; first turn, deployment depth and length are yours to agree."],
  "wr-fannons-patrol":       ["rec", "Book rules only, played in the author’s campaign; complete."],
  "wr-minor-engagement":     ["rec", "Book rules only, play-tested for a year and a half; you choose between two deployment diagrams."],
  "wr-commerce-raiders":     ["rec", "Book rules only; play-tested, updated by the author and reused in later Warp Rift campaigns."],
  "wr-nest-raid":            ["rec", "Played in the author’s campaign; only the first turn is left to a roll-off."],
  "wr-planetary-disease":    ["rec", "Played in the author’s campaign; roll off for the first turn and for attacker and defender."],
  "wr-the-corpse":           ["rec", "Played in the author’s campaign; only the first turn is left to a roll-off."],
  "wr-sw-convoy-raid":       ["rec", "Book rules only, played through by the author’s club. Lopsided on purpose: play it twice, swapping sides."],
  "wr-sw-orbital-raid":      ["rec", "Played through by the author’s club; the Ork entry and first turn are yours to agree. Lopsided on purpose."],
  "wr-sw-counter-strike":    ["rec", "Played through by the author’s club; complete. Lopsided on purpose: play it twice, swapping sides."],
  "wr-sw-death-and-glory":   ["rec", "Played through by the author’s club; complete. Lopsided on purpose: play it twice, swapping sides."],
  "wr-sw-rear-guard":        ["rec", "Played through by the author’s club; table set-up, deployment and first turn are yours to agree. Lopsided on purpose."],
  "wr-sw-down-the-slot":     ["rec", "Played through by the author’s club; the first turn follows from the rules. Lopsided on purpose."],
  "wr-sw-wrecking-yard":     ["rec", "Played through by the author’s club; the first turn follows from the rules. Lopsided on purpose."],
  "wr-sw-rebel-world":       ["rec", "Played through by the author’s club; one old Armada page reference is unmatched and the first turn is yours to agree. Lopsided on purpose."],
  "wr-sw-take-the-stations": ["rec", "Played through by the author’s club; one defence platform is never described. Lopsided on purpose."],
  "wr-sw-rebellion-1":       ["rec", "Played through by the author’s club; its old rulebook page references are unmatched. Lopsided on purpose."],
  "wr-sw-rebellion-2":       ["rec", "Played through by the author’s club; one old rulebook page reference is unmatched. Lopsided on purpose."],
  "wr-choir-thousand-voices":["rec", "Book and scenario rules; one outcome (the Black Ship destroyed after desecration) is yours to agree. No play report."],
  "wr-cat-and-mouse":        ["rec", "Book rules only; the cat’s deployment depth is yours to agree. No play report."],
  "wr-stygies-tree":         ["rec", "A branching campaign built from the rulebook scenarios; its old page references are converted. No play report."],
  "wr-looting-the-hulk":     ["rec", "Book rules only; roll off for the first turn and play until one side has left. No play report."],
  "wr-battles-in-the-warp":  ["rec", "An environment for a small rulebook scenario; you set the number of phenomena. No play report."],
  "wr-fe-variant":           ["rec", "A drop-in alternative to the rulebook’s Fleet Engagement formations; complete. No play report."],
  "wr-solitaire-campaign":   ["rec", "A solo campaign, deliberately very hard; one branch is not covered. No play report."],
  "wr-the-trap":             ["rec", "Complete; this page adds a rule for shorter tables. No play report."],
  "wr-hive-ship-base":       ["rec", "Complete campaign rules for a Tyranid vanguard fleet. No play report."],
  "wr-norduun":              ["rec", "Fixed historical forces the author says balance the scenario; first turn and length are yours to agree. No play report."],
  "wr-shattered-gate":       ["rec", "Book rules only; one unclear holofield rule, and how several fleets share the edges is yours to agree. No play report."],
  /* Agree first */
  "wr-depth-of-space":       ["agree", "Quick, deliberately one-sided sketches in the author’s own words; first turn, edges and game length are left to you."],
  "event-horizon":           ["agree", "The attacker, the table size and the size of the deployment corners are not defined."],
  "wr-planet-killer-defence":["agree", "A battle report’s quick rules rather than a written scenario: zones, length and how often the shot may be tried are left open."],
  "wr-mobeel-narrows":       ["agree", "No table size, first turn or game length, and the line objective is hard to read."],
  "wr-wolf-hunt":            ["agree", "How a capture works and which ships must escape are not given."],
  "wr-hunter-hunted":        ["agree", "Points to a captured-cruiser rule that is not in the current books; minefield placement is not given."],
  "wr-eldar-hunt-1":         ["agree", "No first turn, deployment depth or turn limit."],
  "wr-convoy-battle":        ["agree", "The map was never printed; cargo points and result bands are our reading."],
  "wr-limante-contact":      ["agree", "No Imperial deployment or victory condition of its own, and one upgrade has no rules."],
  "wr-falling-down":         ["agree", "The printed map does not match the text; no first turn, deployment depth or game length."],
  /* Needs fan rules (book "E") */
  "wr-diasporex-diversions": ["fan", "Needs the fan-made Diasporex fleet and a fan-made Inquisition escort."],
  "wr-solblade-1":           ["fan", "Needs the Solblade fleet rules from Warp Rift 40."],
  "wr-solblade-2":           ["fan", "Needs the Solblade fleet rules from Warp Rift 40."],
  "wr-solblade-3":           ["fan", "Needs the Solblade fleet rules from Warp Rift 40."],
  "wr-solblade-4":           ["fan", "Needs the Solblade fleet rules from Warp Rift 40."],
  "wr-solblade-5":           ["fan", "Needs the Solblade fleet rules from Warp Rift 40."],
  "wr-solblade-6":           ["fan", "Needs the Solblade fleet rules from Warp Rift 40."],
  "wr-solar-collectors":     ["fan", "Needs the fan-made Diasporex fleet (Warp Rift 15)."],
  "wr-eldar-hunt-2":         ["fan", "Needs the Haven rules, written for the Eldar MMS fan rules."],
  "wr-darkening-raid":       ["fan", "Built on the author’s own stealth house rules (summarised here)."],
  "wr-pirate-bases":         ["fan", "Written for the author’s fan attack craft rules; it plays with the standard ones, but the author warns it gets dull fast."],
  "wr-fall-of-hyra":         ["fan", "Played at the author’s event alongside Kill Team and One Page Rules games; needs fan-made pieces and some agreement."],
  "wr-srinagar":             ["fan", "Needs the issue’s fan-made ship profiles, and one ship has none."]
};
