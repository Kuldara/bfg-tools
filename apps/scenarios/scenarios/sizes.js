/* Scenario size (0.12, 21.10.2026). Owner: "the scenario's size could be one more filter, e.g. three: about 750,
   1250, and 1500 or bigger". The home page's Filters and the Before the battle roll read this table.

   SIZE[id] = { s, pts, why }
   s    classes by the bigger side's points (how much a player must bring): "S" ≤ 1000, "M" 1001–1499, "L" ≥ 1500.
        An array (["S", "M"]) = a range, or versions fall into several classes. "any" = the size is agreed (Equal,
        Agreed, Any) or a campaign whose battles are played as other scenarios: shown in every class, like "any fleets".
   pts  the points in short, why = the reason. In English like the other tables' reasons (it may show on the page).

   Rules:
   - A budget "up to X" = X. The source's recommendation ("1500 works well", "500–1250 recommended", "about 1000")
     decides; a mere worked example ("660 against 2000") does not, then "any".
   - Mobile ships given on top of the budget count at list price (Blackstone, space hulk, a free flagship). Fixed
     defences, D6×10 defences, transports and objectives (a hulk being escorted) do not raise the class.
   - Fixed forces: everything with a list price (ships and defences, Fleets v0.40 = data/bfg_data.json), no
     transports. Commanders, Marks and upgrades are not in the sum; if they would take the bigger side over a
     threshold (or the sum is close to one), the scenario gets both classes and why says so.
   - Random attackers (D3+5 rolls on a table): the typical number, the extremes mentioned. */
const SIZE = {};
(function () {
const Z = (id, s, pts, why) => { SIZE[id] = { s: s === "any" ? "any" : s.split(""), pts, why }; };
const AGREED = "The players agree the size; the source sets no points.";
const EQUAL = "Equal points at a size the players agree.";
const CAMP = "A campaign: each battle is played as its own scenario at that scenario’s size.";
const TOUR = "Tournament sizes: 1250 or 1500 pts (Tournament Mission Pack p. 2); the Advanced Scenarios version is up to 1250.";
const NEM_T = "Book of Nemesis tournament scenario: equal points, size agreed.";

/* ---------------------------------------------------------------- Core 10 (RB p. 128–143) */
Z("cruiser-clash", "S", "1–4 cruisers ≤ 185 each (max 740); alternatives 750 or 1000", "Up to four cruisers of at most 185 pts; the alternatives suggest an agreed total such as 750, or 1000 with fleet commanders (RB p. 128).");
Z("the-bait", "S", "Pursuers 500 · Pursued 250 + 500", "The pursued side brings 750 pts in all, the pursuers 500 (RB p. 130).");
Z("the-raiders", "any", "Defender agreed · Raiders half", AGREED);
Z("surprise-attack", "any", "Equal + defences", EQUAL);
Z("blockade-run", "any", "Blockade agreed · Runners half", AGREED);
Z("convoy", "any", "100 pts per 2 transports · attackers rolled", "The size follows the number of transports the convoy player takes; the attackers are rolled to match.");
Z("planetary-assault", "any", "Equal + defences + transports", EQUAL);
Z("escalating-engagement", "any", "Agreed", AGREED);
Z("exterminatus", "any", "Agreed + Exterminators + defences", AGREED);
Z("fleet-engagement", "any", "Equal", EQUAL);

/* ---------------------------------------------------------------- The book's campaigns */
Z("gauntlet", "any", "100 pts per 2 transports, each side", "The size follows the number of transports in the convoy (at least two).");
Z("parols-bait", "S", "Pursuers 500 · Pursued 250 + 500", "As The Bait: the pursued side brings 750 pts, mines included.");
Z("pelucidar", "L", "Defender 1500 · horde rolled", "The defender brings 1500 pts; the horde arrives from the chart.");
Z("bc-chance-encounter", "SM", "Fixed: Patrol 755 · Planet Killer fleet 950 (ships)", "Ships at list price: Mars 270, Tyrant 185, Gothic 180, 4 Cobras 120 = 755; Planet Killer 505, Devastation 190, Slaughter 165, 3 Iconoclasts 90 = 950. The Warmaster (Ld 9, 3 re-rolls) takes the Chaos side past 1000.");
Z("bc-rearguard-attack", "any", "Disorder agreed · Order half", AGREED);
Z("bc-alien-intervention", "any", "Disorder agreed · Order 75% + 25% Eldar", AGREED);
Z("bc-above-belis-corona", "L", "Disorder 1500 · Order 750 + defences", "The attacker brings 1500 pts (RB p. 194).");
Z("bc-daemon-blockade", "any", "Blockade agreed − 100 · Runners half", AGREED);
Z("bc-navigate-the-storm", "S", "Convoy 1000 + 10 transports · Raiders 750", "The convoy’s warships are 1000 pts; the ten transports are the objective and do not count.");
Z("bc-macharias-end", "L", "Defenders 2000 · Chaos 1500 + Planet Killer", "2000 pts against 1500 + the Planet Killer.");

/* ---------------------------------------------------------------- Warp Rift in index.html */
Z("siege-of-fularis", "L", "1500 each + 2 free Blackstones", "1500 pts a side; the attacker also gets two Activated Blackstone Fortresses (3000 pts in all).");
Z("assassination", "any", "Agreed limit", AGREED);
Z("eliarenaths-gift", "M", "Patrol 1000 + Lunar · Ambush 1250 · Eclipse 250", "Patrol 1000 + the Lunar (180) = 1180; ambush 1250. The Eclipse (250) is a third party — if the ambush player also runs it, that player brings 1500.");
Z("diasporex-gambit", "S", "Fixed: Inquisitorial cruiser vs Rogue Trader cruiser + escorts", "Ships at list price: Inquisitorial cruiser 270; Rogue Trader cruiser 185 + 2 armed freighters 40 (transports not counted).");
Z("event-horizon", "S", "750 each", "750 pts a side.");
Z("fall-of-arcianr", "L", "Relief 1750 · Invaders 750 + 500 + 400", "1750 pts against 1650.");
Z("unknown-weapons", "any", "Ambushers ≈ 1.5 × hive group", "The hive group’s size is agreed; the ambushers bring about 1.5 times it.");

/* ---------------------------------------------------------------- Fleets-kirja */
Z("fl-merchantmens-folly", "S", "Convoy 10 transports + 500/750 · attackers rolled", "The convoy brings 500 pts (750 against a threat table) beside its transports. The attackers roll D3+5 times: on average about 500–950 pts, more only with lucky rolls.");
Z("fl-hunter-and-prey", "any", "Hunters agreed · Raiders half", AGREED);
Z("fl-rt-gauntlet", "S", "1 cruiser + up to 3 escorts each", "A Rogue Trader cruiser (185) and up to three escorts, about 300–350 pts; the attacker the same.");
Z("fl-explorers-prize", "any", "Equal + a derelict", EQUAL);
Z("fl-space-hulk", "M", "Escort up to 1200 + the hulk · attackers rolled", "The escort brings up to 1200 pts beside the hulk (the objective). The attackers roll D3+5 times: about 1000 pts on average.");
Z("fl-void-malevolent", "any", "Two equal fleets · foe 1.5×", AGREED);
Z("fl-craftworld-assault", "any", "Equal", EQUAL);

/* ---------------------------------------------------------------- Classic GW */
Z("cl-callavell", "L", "2000 or more each", "The source: as big as you can, 2000 pts or more each.");
Z("cl-torpedo-run", "S", "One cruiser to battleship · hunters the same", "A single cruiser, battlecruiser or battleship (about 180–400 pts) and hunters of the same value.");
Z("cl-space-hulk-convoy", "L", "Convoy 1500 + hulk · Ambushers 2000", "1500 + the hulk against 2000.");
Z("cl-phillipa", "any", "400–800 rising to 2000", CAMP + " Here the battles grow from 400–800 pts to 2000.");
Z("cl-corribra-1", "S", "300 pts of escorts each", "300 pts of escorts a side.");
Z("cl-corribra-2", "S", "400 (500) pts of escorts each", "400 pts of escorts a side, 500 for Mission 1’s winner.");
Z("cl-corribra-3", "S", "250 pts of escorts + the Thebes", "250 pts of escorts a side, plus a light cruiser.");
Z("cl-corribra-4", "S", "250 pts of escorts vs a kill kroozer", "250 pts of escorts (and the Thebes) against one kill kroozer.");
Z("cl-pirates-campaign", "any", "Rosters: Imperial 2000 · Pirates 1500", CAMP + " The rosters are 2000 and 1500 pts; each game uses part of them.");
Z("cl-treasure-fleet", "S", "750 each + 2D6×10 defences", "750 pts a side; the defenders’ rolled defences add at most 120.");
Z("cl-evacuation", "S", "Convoy 200 + 300 · attackers rolled", "The convoy brings 300 pts of warships beside its transports. The attackers roll D3+3 times: about 550 pts on average, at most about 1260.");
Z("cl-cadian-line", "any", "Agreed, at most 1500 · infiltrators 75%", "Agreed points up to 1500.");
Z("cl-ahriman", "L", "2000 each", "2000 pts a side.");
Z("cl-raths-last-stand", "L", "Bakka 2000 · Tyranids 3000", "2000 against 3000.");
Z("cl-antioc-1", "any", "Defenders agreed · flotilla a third", "Agreed; the 660 against 2000 in the source is only an example.");
Z("cl-antioc-3", "any", "Equal", EQUAL);
Z("cl-antioc-4", "SML", "Equal, 1000 or more", "Equal points, 1000 or more: from the top of Small upwards.");
Z("cl-execution-hour", "L", "Fixed: about 1600 vs about 3000", "Ships and defences at list price: the evacuation fleet about 1100 of ships plus 510 of stations and platforms; the Chaos fleet about 3000 (Planet Killer, Styx, battle barge, two Desolators, cruisers and escorts).");
Z("cl-siege", "L", "Equal, 1500 recommended", "The source: agree the points — 1500 works well, so the fortress is not overwhelmed at once.");
Z("cl-defence-of-macragge", "L", "Ultramarines 2500 + Bakka 3000 · Tyranids 5000", "2500 + 3000 against 5000.");
Z("cl-numitor", "any", "Historical fleets, or agreed", "Agreed points work. The historical fleets are large: about 1850 pts of Imperial ships at list price, and the Chaos fleet about the same.");
Z("cl-cold-passage", "S", "Fixed: 745 vs 530", "Ships at list price: Invincible 290 (the scenario’s profile), Victory 345, Dauntless 110 = 745; Desolator 300, Repulsive 230 = 530.");
Z("cl-come-only-to-murder", "any", "Defender agreed · Raiders 75%", AGREED);
Z("cl-cerberus-1", "L", "1600 each", "1600 pts a side.");
Z("cl-cerberus-2", "S", "1000 each", "1000 pts a side.");
Z("cl-cerberus-3", "L", "Rearguard 1500 · attackers rolled", "The rearguard brings 1500 pts.");
Z("cl-cerberus-4", "L", "Equal, 3000 or more", "Equal points, at least 3000.");
Z("cl-belis-1", "any", "Equal", EQUAL);
Z("cl-belis-2", "any", "Attacker agreed · Defender +50%", AGREED);
Z("cl-belis-3", "any", "Normal fleets from the campaign", "Your fleets as they stand in the campaign; without it, any agreed size.");
Z("cl-belis-4", "any", "Agreed — ideally every ship", AGREED);
Z("cl-damocles-1", "any", "Equal", EQUAL);
Z("cl-damocles-2", "any", "Imperial any · Tau the Hydrass survivors", "The Imperial side takes any ships; the Tau have what survived Scenario 1.");
Z("cl-damocles-3", "L", "Task force 1000 · defenders up to 2000", "The task force is 1000 pts; the Tau and Demiurg up to 2000.");
Z("cl-damocles-4", "any", "Equal + a free Tau station", EQUAL);
Z("cl-wolf-packs", "S", "Agreed, 400 or less", "Agreed points, 400 or less.");
Z("cl-tau-trade", "any", "Raiders agreed · Hunters +50%", AGREED);
Z("cl-daemon-run", "L", "Set fleets: about 1550 vs 1660", "Ships at list price: Grey Knights battle barge 440, 4 strike cruisers 660, 10 escorts 445 = 1545; Despoiler 400, Repulsive 230, five cruisers 870, 4 Infidels 160 = 1660.");
Z("cl-lachlon", "M", "1000 each + a free flagship", "1000 pts a side plus a free flagship: the Emperor class Legatus Stygies (365) or the Repulsive Foe-Reaper (230) — 1365 and 1230.");
Z("cl-port-maw", "any", "Agreed + defences", AGREED);
Z("cl-abhorrence", "any", "Set fleets, or an agreed points match", "An agreed points match works. The historical fleets are about 1450 (Imperial) and 1375 (Eldar) at list price.");
Z("cl-planet-fall", "S", "Imperial 750 + 250 defences · Raiders 1000", "Both sides bring 1000 pts.");
Z("cl-kotol", "SML", "Battles 1–5: 750 → 1500", "Five battles: 750/500, 750, 1000, 1250 and 1500 pts (+ defences).");
Z("cl-inv-chart", "any", "Equal", EQUAL);
Z("cl-inv-conquest", "any", "Equal", EQUAL);
Z("cl-inv-breakthrough", "any", "Equal", EQUAL);
Z("cl-inv-snake", "any", "Equal", EQUAL);
Z("cl-inv-retrieval", "any", "Equal", EQUAL);
Z("cl-inv-ring", "any", "Equal", EQUAL);
Z("cl-inv-port-maw", "any", "Defender 4 × the attacker", AGREED);
Z("cl-inv-boarding", "any", "Defender +25%", AGREED);
Z("cl-inv-deadline", "any", "Equal", EQUAL);

/* ---------------------------------------------------------------- Warp Rift */
Z("wr-depth-of-space", "SL", "Patrol 750 · opponent 500–750, or 1500", "Most versions are 750 a side (the convoy in “Merchants” is transports). “Flood” has a 1500 pt enemy, and the quick sketch suggests 500 or 1500.");
Z("wr-diasporex-diversions", "S", "Fixed: three escorts vs a light cruiser", "Three Operations Vessels against one light cruiser.");
Z("wr-solblade-1", "L", "Solblade 250 · Tyranids 1500", "The Tyranid player brings 1500 pts.");
Z("wr-solblade-2", "L", "Solblade 250 · Tyranids 1500", "The Tyranid player brings 1500 pts.");
Z("wr-solblade-3", "S", "Solblade 175 · Tyranids 1000", "The Tyranid player brings 1000 pts.");
Z("wr-solblade-4", "L", "Solblade 250 + 250 defences · Tyranids 1500", "The Tyranid player brings 1500 pts.");
Z("wr-solblade-5", "L", "Solblade 250 · Tyranids 1500", "The Tyranid player brings 1500 pts.");
Z("wr-solblade-6", "L", "Three Solblades 750 · Tyranids 2000", "The Tyranid player brings 2000 pts.");
Z("wr-who-goes-there", "S", "About 1000 each", "The author suggests about 1000 pts a side.");
Z("wr-fannons-patrol", "S", "Fixed patrol · rolled pirates", "Two cruisers and six Swords (about 570–650 pts); the pirates are rolled escorts, about 14 on average.");
Z("wr-planet-killer-defence", "L", "2000 each", "2000 pts a side, as played in the report.");
Z("wr-minor-engagement", "any", "Equal, up to 1500", "Agreed points up to 1500.");
Z("wr-commerce-raiders", "any", "Equal + transports", EQUAL);
Z("wr-nest-raid", "SM", "Any; 500–1250 suggested", "The author suggests 500–1250 pts.");
Z("wr-planetary-disease", "SM", "Any; 500–1250 suggested", "The author suggests 500–1250 pts.");
Z("wr-the-corpse", "SM", "Any; 500–1250 suggested", "The author suggests 500–1250 pts.");
Z("wr-sw-convoy-raid", "S", "Fixed: about 340 + 12 cargo ships vs about 500", "Ships at list price: 4 Swords, 3 Cobras and a Dauntless = 340 beside the cargo ships; the Orks about 500 (kill kroozer and ten escorts).");
Z("wr-sw-orbital-raid", "M", "Fixed: about 600 + station vs about 1100", "Ships at list price: two Dominator groups = 600 plus the station; the Orks 1095 (two Terror ships, kill kroozer, 18 escorts).");
Z("wr-sw-counter-strike", "M", "Fixed: 4 cruisers + 10 escorts vs 2 cruisers + 6 escorts", "Four cruisers and ten escorts come to 1020 pts at the least and about 1100–1300 as usually picked.");
Z("wr-sw-death-and-glory", "L", "Fixed: about 2000+ each", "Two battleships, two battlecruisers, four cruisers and 14 escorts — well over 2000 pts; the renegades about 2000.");
Z("wr-sw-rear-guard", "SM", "Fixed: about 870–1040 each", "Three light cruisers, two cruisers and six escorts come to 870–1040 pts depending on the classes; the renegades 780–1000.");
Z("wr-sw-down-the-slot", "S", "Fixed: attack craft vs a light cruiser and 5 escorts", "A light cruiser and five escorts (about 260 pts) against attack craft and one frigate.");
Z("wr-sw-wrecking-yard", "S", "Fixed: about 550–630", "A heavy cruiser, a cruiser and six Iconoclasts: 545–630 pts.");
Z("wr-sw-rebel-world", "L", "Imperials 2000 + transports · Rebels 1200", "The Imperial player brings 2000 pts.");
Z("wr-sw-take-the-stations", "L", "Fixed: about 2100 vs about 1000 + stations", "Battle barge, four strike cruisers and eight escorts (about 1365) plus a Navy group (about 735).");
Z("wr-sw-rebellion-1", "ML", "1200 or 1500, drawn blind", "Each side writes a 1200 and a 1500 pt roster; one of them fights.");
Z("wr-sw-rebellion-2", "ML", "The other roster: 1200 or 1500", "The roster that did not fight the first raid.");
Z("wr-mobeel-narrows", "L", "Fixed: about 1500 + 520 reinforcements vs about 1390", "Ships at list price: 2 Dominators, 2 Gothics, 4 Dauntless and 10 escorts = 1500, reinforcements 520; the defence about 1390 with stations and reinforcements.");
Z("wr-choir-thousand-voices", "S", "Fixed: Black Ship + 2 cruisers + 5 escorts vs 4 cruisers", "Four raiding cruisers are about 720 pts; the escort about 535 plus the Black Ship.");
Z("wr-wolf-hunt", "M", "Wolves 1250 · Imperials 750 + 500 transports", "The wolves bring 1250 pts.");
Z("wr-hunter-hunted", "L", "Imperials 1500 · Wolves 1000 + prize", "The blockade brings 1500 pts.");
Z("wr-cat-and-mouse", "any", "Cat 4 : mouse 1", "Agreed; 1000 against 250 is the source’s example.");
Z("wr-solar-collectors", "any", "Equal", EQUAL);
Z("wr-eldar-hunt-1", "L", "Searchers 1500 · Eldar 1000", "The searchers bring 1500 pts.");
Z("wr-eldar-hunt-2", "ML", "Survivors of part 1 + the Haven (500)", "The uncrippled survivors of part 1 (1500 against 1000) and the Haven: usually between Medium and Large.");
Z("wr-convoy-battle", "any", "Equal; convoy adds transports", "Agreed; 2000 in the source is an example.");
Z("wr-limante-contact", "S", "Historical: about 620 vs about 790", "Ships at list price: Lunar, Dauntless, 5 Cobras and 3 escort carriers = 620 beside the heavy transports; the Orks 790.");
Z("wr-falling-down", "S", "Fixed: a light cruiser + 3 escorts vs a fake convoy", "About 260 pts of Tau against a few Corsair escorts and a light cruiser.");
Z("wr-darkening-raid", "S", "Fixed: a battlecruiser + light cruiser vs a garrison", "About 250–400 pts a side beside the cargo ships.");
Z("wr-stygies-tree", "any", "Rosters 1500–2000 · neutral 500–800", CAMP + " The master rosters are 1500–2000 pts.");
Z("wr-looting-the-hulk", "any", "Equal, or raiders half", AGREED);
Z("wr-pirate-bases", "S", "About 9 fighters, 9 bombers, 3 escorts", "Mostly attack craft and a few escorts.");
Z("wr-battles-in-the-warp", "S", "Small", "The author: keep it small.");
Z("wr-fe-variant", "any", "Equal", EQUAL);
Z("wr-solitaire-campaign", "any", "Set for each battle", CAMP);
Z("wr-the-trap", "S", "Raiders 500 · outpost 250 + 500", "750 pts at the most.");
Z("wr-hive-ship-base", "any", "As the base scenario", "The size of the scenario it is played with.");
Z("wr-norduun", "M", "Fixed: about 350–420 vs about 1020–1090", "Ships at list price: the Chaos convoy’s hunters 1020 (1090 in the Vanquisher version) beside 12 transports; the raiders 350–420.");
Z("wr-fall-of-hyra", "S", "Pre-made lists, about 740 each", "Each player takes a pre-made list of about 730–750 pts; a side may have several players.");
Z("wr-shattered-gate", "SM", "750–1250 each", "750–1250 pts each, as agreed.");
Z("wr-srinagar", "L", "2000 each", "2000 pts a side.");

/* ---------------------------------------------------------------- Fan supplements: tournament */
["fan-t-manna", "fan-t-road-to-hell", "fan-t-space-power", "fan-t-edge-of-warp", "fan-t-scavenger", "fan-t-black-hole", "fan-t-bismark", "fan-t-unexpected",
  "fan-t-derelict-base", "fan-t-station", "fan-t-retrieve-salvage", "fan-t-protect-salvage", "fan-t-brace", "fan-t-wrecks", "fan-t-neutron", "fan-t-shepard", "fan-t-hide"]
  .forEach(id => Z(id, "ML", "1250 or 1500 each", TOUR));

/* ---------------------------------------------------------------- Book of Nemesis */
Z("fan-n-governor", "S", "Defenders 1000 + ground defences · Attackers 500", "The defenders bring 1000 pts.");
Z("fan-n-naravona", "S", "1000 each + the battlestation", "1000 pts a side; the defenders’ battlestation is the scenario’s objective.");
Z("fan-n-comet", "S", "500 each + defences", "500 pts a side.");
Z("fan-n-line", "L", "Attackers 1000 + space hulk · Defenders 500 + 1000", "1000 + the Chaos space hulk (650) against two fleets of 500 and 1000.");
Z("fan-n-kravertus", "S", "Fixed: two grand cruisers, a station, two patrols", "At list price: Repulsive 230 against Vengeance 230, a space station 150 and six escorts 225 = 605.");
Z("fan-n-armada", "L", "Chaos 1500 + fireships · Imperial 2500", "2500 against 1500.");
Z("fan-n-longest", "M", "Expedition 1200 · Raiders 700", "The expedition brings 1200 pts.");
Z("fan-n-recon", "any", "Equal", NEM_T);
Z("fan-n-flanks", "any", "Equal", NEM_T);
Z("fan-n-titan", "any", "Equal", NEM_T);
Z("fan-n-hulk", "any", "Equal", NEM_T);
Z("fan-n-ambush", "SML", "Attackers 500–750 each · Defender 1000–1500", "The defender brings 1000–1500 pts, twice one attacker.");
Z("fan-n-gunnery", "S", "One cruiser", "One cruiser.");

/* ---------------------------------------------------------------- Project Distant Darkness (fixed forces) */
Z("fan-p-hunter-prey", "S", "Fixed: one ship each", "An Emissary (110) against a strike cruiser (145).");
Z("fan-p-light-dark", "S", "Fixed: about 385 vs about 485", "Protector 185 + 4 Castellans 200; three light cruisers and four escorts = 485 beside six freighters.");
Z("fan-p-stolen-goods", "S", "Fixed: about 365 vs about 360", "Rogue Trader cruiser, two escorts and six armed cargo vessels = 365; three Castellans, two Wardens and an orbital city = 360.");
Z("fan-p-barrage", "M", "Fixed: about 1050 vs about 1050", "At list price: Custodian 330, 2 Emissaries 220, the Marauder 110, 3 Wardens 90, 6 Castellans 300 = 1050; the Chaos ships 910 plus platforms and ground batteries.");
Z("fan-p-crossfire", "S", "Fixed, three fleets: 285 · 810 · 605", "The Orks are the largest: Terror ship, two kill kroozers and nine escorts = 810. One player running both Tau forces brings 890.");
Z("fan-p-silent-strike", "L", "Tau 1000 · Imperial 1500 + defences", "The Imperial player brings 1500 pts.");
Z("fan-p-hunter-cadre", "S", "Fixed: about 520 vs about 640", "Two Protectors and three Castellans = 520; Murder, Endeavour, two escort carriers and seven escorts = 640.");
Z("fan-p-another-day", "S", "Fixed: about 810 vs about 395", "Explorer, two Wardens and the rescue fleet (two Protectors, three Castellans) = 810; the Corsairs 395.");
Z("fan-p-into-darkness", "S", "Fixed: two light cruisers vs two escorts", "Two Emissaries (220) against two Corsairs (100).");
Z("fan-p-comes-back", "S", "Fixed: about 345 vs 360", "A Protector, a Castellan and an Emissary against two Heroes.");
Z("fan-p-labyrinth", "S", "Fixed: 3 escorts vs 5 raiders", "Three Castellans (150) against five Necron raiders (230).");
Z("fan-p-scheming", "S", "Fixed: a light cruiser vs a dock and two orbitals", "An Emissary (110) against an orbital dock and two security orbitals (190).");
Z("fan-p-find-light", "S", "Fixed: about 275 + transports vs 220", "A Protector and two Defenders beside five transports, against five Necron raiders.");
Z("fan-p-no-way-out", "S", "Fixed: two ships vs a light cruiser and 4 escorts", "About 205 against 250.");
Z("fan-p-distant-darkness", "SM", "Fixed: five cruisers (925) vs drones", "Five Protectors are 925 pts at list price; with the five named commanders the side passes 1000.");
Z("fan-p-lytan-flight", "S", "Fixed: a shuttle vs a cruiser", "A shuttle marker against one Merchant (95).");
Z("fan-p-lost-tale", "M", "Fixed: 925 vs about 1130", "Five Protectors (925) against two Scythes, two Shrouds and six raiders (1130).");
Z("fan-p-art-command-1", "ML", "Fixed: about 1385 vs about 1460", "At list price: the Tau 1385; the Novamarines 1035 plus the Horizon’s Edge (a battle barge: 1460). With the Master of the Fleet the Marines reach about 1500.");
Z("fan-p-art-command-2", "L", "Fixed: about 1495 vs about 1605", "At list price: Distant Darkness 1495, the Tau Empire 1605 (two battleships, cruisers and escorts).");
Z("fan-p-garit", "S", "Fixed: a shuttle vs fighters", "A shuttle marker against attack craft.");
Z("fan-p-greater-good", "M", "Fixed: about 1215 vs about 880", "Explorer, two Wardens and five Protectors (damaged) = 1215; two Heroes, two Protectors and three Castellans = 880.");
Z("fan-p-claw", "S", "Fixed: 555 vs about 565", "Three Protectors (555) against 8 vanguard drone ships and 10 Kraken (about 565 with their weapons).");
Z("fan-p-supply", "S", "Fixed: 370 vs about 490 + transports", "Two Protectors against a Hero, two Emissaries and two Defenders beside ten transports.");
Z("fan-p-nightmares", "M", "Fixed: 875 vs about 1150", "Three Protectors and the Flame of Asuryan (875) against a hive ship, two cruisers, 20 escorts and attack craft (about 1150 with their weapons).");
Z("fan-p-spirit", "S", "Fixed: a cruiser vs a kill kroozer and 4 escorts", "185 against 295.");
Z("fan-p-rising-shadow", "S", "Fixed: 555 vs about 725", "Three Protectors against a hive ship, two cruisers and six escort drones (about 725 with weapons).");
Z("fan-p-abandon", "L", "Fixed: 925 vs about 2100", "Five Protectors against two hive ships, two cruisers, 20 escorts and 20 Kraken (about 2100 with weapons).");
Z("fan-p-ever-dream", "SM", "Fixed: about 875 vs about 970 (damaged)", "What is left of Abandon All Hope is about 970 pts with weapons and attack craft; with evolutions and commanders both sides sit at about 1000.");

/* ---------------------------------------------------------------- Starblade (fixed forces) */
Z("fan-s-crescent", "S", "Fixed: 480 vs about 605", "Flame of Asuryan and a wraithship against a Terror ship and twelve escorts.");
Z("fan-s-veil", "M", "Fixed: about 1060 vs 750", "Flame, dragonship, two wraithships and four Shadowhunters = 1060; three cruisers and six escorts = 750.");
Z("fan-s-path", "M", "Fixed: about 1020 vs about 1060", "Flame, dragonship, two wraithships and three Shadowhunters = 1020; a station 150, Overlord, Lunar, two Dauntless and eight escorts = 1060.");
Z("fan-s-grace", "ML", "Fixed: 1450 vs 1450", "Both fleets are 1450 pts at list price; with the admirals (Ld 9, 2 re-rolls each) they pass 1500.");
Z("fan-s-tragedy", "M", "Fixed: about 1210 vs about 1255", "Eldar 1210; Explorer, three Protectors, two Emissaries and five Castellans = 1255.");
Z("fan-s-visions", "M", "Fixed: 790 vs about 1190", "The Tau: orbital city and two orbitals 250, two Protectors, Custodian and six escorts 940.");
Z("fan-s-prophecy", "S", "Fixed: 420 vs 460", "A dragonship and a wraithship against a Torture cruiser and five Corsairs.");
Z("fan-s-tears", "SM", "Fixed: 550 vs 930 + marks", "Four grand cruisers are 930 at list price; their Marks and daemonship status take them past 1000.");
Z("fan-s-starblade", "SM", "Fixed: 400 vs 830 + commanders", "Despoiler, two Murders and two Idolators are 830 at list price; the Warmaster (Ld 10, 2 re-rolls) and the Marks of Nurgle take them to about 1000.");
/* Book of the Void (25.10.2026): fixed forces' sizes estimated from Book of the Void I's and the Fleets Book's prices */
Z("fan-v-first-contact", "S", "Fixed: about 350 vs 450", "A Priory strike cruiser and five Swords against a Callisto with Archaeotech, five Terran escorts and a Mercury.");
Z("fan-v-smash", "S", "Fixed: about 550 vs 500", "A Terror krooza, a Grot krooza, six Savage gunships and three Onslaughts against a Neptune command carrier and six Terran escorts.");
Z("fan-v-eres", "L", "Fixed: about 1800 vs 2000", "An Oberon, two Chalice battlecruisers, four strike cruisers and twelve frigates against a Terror krooza, a Hammer, six Grot kroozas, two Freeboota Bashas and 24 attack ships.");
Z("fan-v-ancients", "L", "Fixed: over 2000 each", "Two battleships, a battlecruiser, cruisers, strike cruisers and eleven escorts against a Diasporex carrier, a battleship, eight cruisers and six escorts.");
Z("fan-v-solar", "SML", "Raid 500–1000 · battle 1000–2000", "The players pick a raid or a battle in the given range; collectors are extra.");
Z("fan-v-krump", "L", "Grots 1000 · defender 1500", "The defender’s 1500 sets the class.");
Z("fan-v-relic", "L", "1500–2000 each", "The players agree a value in that range.");
Z("fan-v-avaheim", "S", "Fixed: 90 vs about 160", "Three Cobras against eight drones with their weapons.");
Z("fan-v-gambit", "S", "Seiche 1000 · Tyranids 500", "Up to 1000 including the bait.");
Z("fan-v-eulogy", "S", "1000 each + 75 defences", "Planetary defences do not raise the class.");
Z("fan-v-sirvos", "L", "1500 each", "Both lists up to 1500 pts, including the Immortal Flame and the Omega.");
Z("fan-b-poi", "S", "750 each", "Both fleets up to 750 pts (BBGM p. 64).");
Z("fan-b-chance", "S", "750 each", "Both fleets up to 750 pts (BBGM p. 68).");
Z("fan-b-starfort", "S", "1000 each", "Both fleets up to 1000 pts; the star fort is on the table for free (BBGM p. 73).");
Z("fan-b-patrol", "any", "Equal", EQUAL);
Z("fan-b-raiders", "S", "Defender 1000 + transports · Raiders 750", "The defender up to 1000 pts plus rolled transports, the raiders up to 750 pts (BBGM p. 63).");
Z("fan-b-ring", "S", "Attacker 600 · Defender 300 + defences", "600 pts against 300 pts plus a rolled base (BBGM p. 65).");
Z("fan-b-assault", "any", "Equal + defences + transports", EQUAL);
Z("fan-v-last-wave", "L", "2000 each", "Both lists up to 2000 pts; the rearguard is part of the Imperial total.");
})();
