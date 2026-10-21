# Saantoauditointi

Kirjan koostumussaannot verrattuna siihen mita sovellus valvoo.
Tuotettu `saantoaudit.py`:lla 2026-09-08. Lahde: Battlefleet Gothic: Remastered — Fleets Book WiP v0.36 (28 Aug 2025) and Rulebook v1.10 (7 May 2024)

## Yhteenveto

| | |
|---|---|
| laivastolistoja | 32 |
| koneellisesti valvottuja saantoja | **157** |
| koostumuslauseita jotka jaavat pelaajan tarkistettaviksi | 135 |
| alusprofiileja | 171 |
| valittavia listarivaja | 810 |

Valvomatta jaavien syyt:

| syy | lauseita |
|---|---|
| lause ei jasenny nykyisilla kaavoilla | 79 |
| pisterajaan sidottu, mutta kohteena alusluokka eika osio | 14 |
| komentajan maara; jo valvottu osiorajana (0-1) | 12 |
| varuste- tai merkkivalinta, ei laivaston koostumus | 10 |
| ei rajoita mitaan | 9 |
| suhdeluku alusluokkaan, ei osioon | 6 |
| edellisen lauseen esimerkki | 3 |
| vertailu kahden rungon valilla; moottorissa ei ole tata saantotyyppia | 2 |

## Listakohtaisesti

### Imperial Navy — Gothic Sector (kirjan sivu 35)

Valvottuja **6** (mandatory_at 1, ratio 2, section_count 2, squadron 1). Tarkistettavaksi jaa 1.

| tyyppi | valvottu saanto |
|---|---|
| `mandatory_at` | If the fleet is worth over 750 points an Admiral must be included to lead it. |
| `section_count` | 0-1 Admiral |
| `ratio` | You may include up to one battleship in your fleet for every three cruisers or battlecruisers. |
| `ratio` | You may include up to one battlecruiser in your fleet for every two cruisers. |
| `section_count` | 0-12 Cruisers |
| `squadron` | You may include any number of escorts in your fleet in squadrons of 2–6 unless specified (see pg 13). |

| osio | lause jota ei valvota | syy |
|---|---|---|
| Admiral | You may include 1 Admiral in your fleet, who must be assigned to a ship and improves its Leadership to the value shown. | komentajan maara; jo valvottu osiorajana (0-1) |

### Imperial Navy — Bastion Fleets (kirjan sivu 36)

Valvottuja **7** (mandatory_at 1, ratio 2, section_count 3, squadron 1). Tarkistettavaksi jaa 2.

| tyyppi | valvottu saanto |
|---|---|
| `mandatory_at` | If the fleet is worth over 750 points an Admiral must be included to lead it. |
| `section_count` | 0-1 Admiral |
| `ratio` | You may include up to one battleship in your fleet for every three cruisers or battlecruisers. |
| `ratio` | You may include up to one battlecruiser or grand cruiser in your fleet for every two cruisers. |
| `section_count` | 0-12 Cruisers |
| `squadron` | You may include any number of escorts in your fleet in squadrons of 2–6 unless specified (see pg 13). |
| `section_count` | You may include up to five Veteran Captains in your fleet. |

| osio | lause jota ei valvota | syy |
|---|---|---|
| Admiral | You may include 1 Admiral in your fleet, who must be assigned to a ship and improves its Leadership to the value shown. | komentajan maara; jo valvottu osiorajana (0-1) |
| ORDNANCE | * The Endurance and Defiant class light cruisers are rare variants of the Endeavour, hence the combined numbers of Endurance and Defiant class vessels | vertailu kahden rungon valilla; moottorissa ei ole tata saantotyyppia |

### Imperial Navy — Armageddon Sector (kirjan sivu 40)

Valvottuja **6** (mandatory_at 1, ratio 2, section_count 2, squadron 1). Tarkistettavaksi jaa 3.

| tyyppi | valvottu saanto |
|---|---|
| `mandatory_at` | If the fleet is worth over 750 points a fleet commander must be included to lead it. |
| `section_count` | 0-1 Fleet Commander |
| `ratio` | You may include up to one battleship in your fleet for every three cruisers or battlecruisers. |
| `ratio` | You may include up to one battlecruiser in your fleet for every cruiser. |
| `section_count` | 0-12 Cruisers |
| `squadron` | You may include any number of escorts in your fleet in squadrons of 2–6 unless specified (see pg 13). |

| osio | lause jota ei valvota | syy |
|---|---|---|
| Fleet Commander | You may include a commander in your fleet, who must be assigned to a ship and improves its Leadership to the value shown. | lause ei jasenny nykyisilla kaavoilla |
| Master of the Fleet Re-r | As long as the fleet includes at least one Imperial capital ship it may include a fleet-admiral, admiral or solar admiral, who will always be assigned | lause ei jasenny nykyisilla kaavoilla |
| RESERVES | No more than two of these vessels (Endurance and Defiant class light cruisers) may be taken for every 500 points (or portion thereof) in the fleet. | pisterajaan sidottu, mutta kohteena alusluokka eika osio |

### Imperial Navy — Bakka Sector (kirjan sivu 48)

Valvottuja **6** (mandatory_at 1, ratio 2, section_count 2, squadron 1). Tarkistettavaksi jaa 2.

| tyyppi | valvottu saanto |
|---|---|
| `mandatory_at` | If the fleet is worth over 750 points an Admiral must be included to lead it. |
| `section_count` | 0-1 Admiral |
| `ratio` | You may include up to one battleship in your fleet for every three cruisers or battlecruisers. |
| `ratio` | You may include up to one battlecruiser in your fleet for every two cruisers. |
| `section_count` | 0-12 Cruisers |
| `squadron` | You may include any number of escorts in your fleet in squadrons of 2–6 unless specified (see pg 13). |

| osio | lause jota ei valvota | syy |
|---|---|---|
| Admiral | You may include 1 Admiral in your fleet, who must be assigned to a ship and improves its Leadership to the value shown. | komentajan maara; jo valvottu osiorajana (0-1) |
| RESERVES | One Rogue Trader cruiser and its attendant escorts may be taken for every 750 points in the fleet. | pisterajaan sidottu, mutta kohteena alusluokka eika osio |

### Space Marines — Codex Astartes (kirjan sivu 97)

Valvottuja **5** (mandatory_at 1, section_count 3, squadron 1). Tarkistettavaksi jaa 2.

| tyyppi | valvottu saanto |
|---|---|
| `mandatory_at` | If the fleet is worth over 750 points, the Master of the Fleet must be included to lead it. |
| `section_count` | 0-1 Master of the Fleet |
| `section_count` | 0-3 Battle Barges |
| `section_count` | 0-10 Cruisers |
| `squadron` | You may include any number of escorts in your fleet in squadrons of 2–6 unless specified (see pg 13). |

| osio | lause jota ei valvota | syy |
|---|---|---|
| Master of the Fleet | You may include 1 Master of the Fleet. | komentajan maara; jo valvottu osiorajana (0-1) |
| Battle Barges | You may include one Space Marine battle barge for every 1,000 points or part thereof in your fleet. | pisterajaan sidottu, mutta kohteena alusluokka eika osio |

### Space Marines — Crusade (kirjan sivu 98)

Valvottuja **6** (mandatory_at 1, section_count 4, squadron 1). Tarkistettavaksi jaa 3.

| tyyppi | valvottu saanto |
|---|---|
| `mandatory_at` | If the fleet is worth over 750 points, the Master of the Fleet must be included to lead it. |
| `section_count` | 0-1 Master of the Fleet |
| `section_count` | 0-1 Fortress-Monastery |
| `section_count` | 0-3 Battle Barges |
| `section_count` | 0-10 Cruisers |
| `squadron` | You may include any number of escorts in your fleet in squadrons of 2–6 unless specified (see pg 13). |

| osio | lause jota ei valvota | syy |
|---|---|---|
| Master of the Fleet | You may include 1 Master of the Fleet. | komentajan maara; jo valvottu osiorajana (0-1) |
| Fortress-Monastery | If your fleet is worth at least 2,000 points, it may include one Fortress-Monastery. | lause ei jasenny nykyisilla kaavoilla |
| Battle Barges | You may include one Space Marine battle barge for every 1,000 points or part thereof in your fleet. | pisterajaan sidottu, mutta kohteena alusluokka eika osio |

### Space Marines — Dominion (kirjan sivu 100)

Valvottuja **5** (mandatory_at 1, section_count 3, squadron 1). Tarkistettavaksi jaa 3.

| tyyppi | valvottu saanto |
|---|---|
| `mandatory_at` | If the fleet is worth over 750 points, a Master of the Fleet must be included to lead it. |
| `section_count` | 0-1 Master of the Fleet |
| `section_count` | 0-3 Battle Barges |
| `section_count` | 0-10 Cruisers |
| `squadron` | You may include any number of escorts in your fleet in squadrons of 2–6 unless specified (see pg 13). |

| osio | lause jota ei valvota | syy |
|---|---|---|
| Master of the Fleet | You may include 1 Master of the Fleet. | komentajan maara; jo valvottu osiorajana (0-1) |
| Battle Barges | You may include one Space Marine battle barge for every 1,000 points or part thereof in your fleet. | pisterajaan sidottu, mutta kohteena alusluokka eika osio |
| Choosing a Battle Barge | In addition to their fleet list, any Space Marine fleet may include a single – meaning only one! | lause ei jasenny nykyisilla kaavoilla |

### Adeptus Mechanicus — Explorator (kirjan sivu 124)

Valvottuja **4** (mandatory_at 1, ratio 1, section_count 1, squadron 1). Tarkistettavaksi jaa 6.

| tyyppi | valvottu saanto |
|---|---|
| `mandatory_at` | If the fleet is worth 1,000 points or more, a Mechanicus Archmagos must be included to lead it. |
| `section_count` | 0-1 Mechanicus Archmagos |
| `ratio` | You may include 1 battleship for every three cruisers in the fleet. |
| `squadron` | You may include any number of escorts in your fleet in squadrons of 2–6 unless specified (see pg 13), taken from both the Imperial Navy and Space Mari |

| osio | lause jota ei valvota | syy |
|---|---|---|
| FLEET RULES (pg. 118–123 | No more than one reserve vessel can be taken for every three capital ships in the fleet. | suhdeluku alusluokkaan, ei osioon |
| FLEET RULES (pg. 118–123 | For every three cruisers, one reserve cruiser-class, battlecruiser or grand cruiser may be taken. | lause ei jasenny nykyisilla kaavoilla |
| FLEET RULES (pg. 118–123 | For every three battleships, one battleship- class vessel may be taken. | lause ei jasenny nykyisilla kaavoilla |
| FLEET RULES (pg. 118–123 | They can be taken in the ratio of one strike cruiser for every three Mechanicus capital ships, and one battle barge for every three strike cruisers. | lause ei jasenny nykyisilla kaavoilla |
| FLEET RULES (pg. 118–123 | When calculating repair points at the end of a battle, the Adeptus Mechanicus fleet will always have +1 Repair point for every 10 renown or portion th | lause ei jasenny nykyisilla kaavoilla |
| Mechanicus Archmagos | You may include 1 Mechanicus Archmagos in your fleet, which must be assigned to a capital ship and replaces its Leadership with the value shown. | komentajan maara; jo valvottu osiorajana (0-1) |

### The Emperor's Inquisition (kirjan sivu 138)

Valvottuja **1** (section_count 1). Tarkistettavaksi jaa 5.

| tyyppi | valvottu saanto |
|---|---|
| `section_count` | 0-1 Inquisitor Lord |

| osio | lause jota ei valvota | syy |
|---|---|---|
| Accompanying a fleet | This may include the specific ship so-called in the Inquisition rules, but it can be any Imperial cruiser-class vessel. | lause ei jasenny nykyisilla kaavoilla |
| CAPITAL SHIPS | Any Imperial or Space Marine fleet may include a single Inquisitorial Cruiser in the fleet, which takes the place of a battlecruiser or strike cruiser | lause ei jasenny nykyisilla kaavoilla |
| CAPITAL SHIPS | A fleet may include a single Blackship, which as a special vessel does not count toward or against other ship limits in the fleet. | lause ei jasenny nykyisilla kaavoilla |
| CAPITAL SHIPS | If an Inquisitor Lord is leading the fleet, up to one Grey Knights Strike Cruiser may be taken for every 500 points in the fleet. | pisterajaan sidottu, mutta kohteena alusluokka eika osio |
| CAPITAL SHIPS | A Space Marine fleet led by an Ordo Malleus Inquisitor including at least 1000 points of Inquisition vessels and Grey Knights strike cruisers may incl | lause ei jasenny nykyisilla kaavoilla |

### Grey Knights (kirjan sivu 144)

Valvottuja **2** (mandatory_at 1, squadron 1). Tarkistettavaksi jaa 4.

| tyyppi | valvottu saanto |
|---|---|
| `mandatory_at` | If the fleet is above 750 points an Inquisitor Lord must lead the fleet. |
| `squadron` | You may include any number of escorts in your fleet in squadrons of 2–6 unless specified (see pg 13) Rapid strike vessel (Firestorm) (pg 106) (pg 79). |

| osio | lause jota ei valvota | syy |
|---|---|---|
| CAPITAL SHIPS | You may include a single Grey Knights Battle barge if the remainder of the fleet is at least worth 1000 points. | lause ei jasenny nykyisilla kaavoilla |
| CAPITAL SHIPS | A Grey Knights fleet may include a single Inquisitorial Cruiser in the fleet. | lause ei jasenny nykyisilla kaavoilla |
| CAPITAL SHIPS | A Grey Knights fleet may include a single Blackship, which as a special vessel does not count toward or against other ship limits in the fleet. | lause ei jasenny nykyisilla kaavoilla |
| CAPITAL SHIPS | One Grey Knights Strike Cruiser may be taken per 500 points (eg one from 0-500 points, two from 501-1000 points, etc.). | pisterajaan sidottu, mutta kohteena alusluokka eika osio |

### Rogue Traders (kirjan sivu 174)

Valvottuja **2** (section_count 1, squadron 1). Tarkistettavaksi jaa 4.

| tyyppi | valvottu saanto |
|---|---|
| `section_count` | 0-2 Veteran Rogue Traders |
| `squadron` | A single squadron of 2-6 Rogue Trader escorts and auxiliary vessels may accompany each Rogue Trader capital ship in a fleet, in any mix desired. |

| osio | lause jota ei valvota | syy |
|---|---|---|
| CAPITAL SHIPS | Any fleet except Necrons or Tyranids may include a single Rogue Trader capital ship. | lause ei jasenny nykyisilla kaavoilla |
| CAPITAL SHIPS | Tau, Demiurg and Imperial fleets may include one Rogue Trader cruiser for every 750 points or part thereof in their fleet. | pisterajaan sidottu, mutta kohteena alusluokka eika osio |
| XENOS ALLIES | For every 750 points in the fleet, Rogue Traders may be accompanied by a single Demiurg or Kroot vessel unless the fleet is using auxiliary ships that | pisterajaan sidottu, mutta kohteena alusluokka eika osio |
| SUB-PLOTS | Any game that includes a Rogue Trader cruiser must include a sub- plot from [???] p.82-84 in the Rulebook. | lause ei jasenny nykyisilla kaavoilla |

### Rogue Traders — Exploration (kirjan sivu 176)

Valvottuja **1** (squadron 1). Tarkistettavaksi jaa 7.

| tyyppi | valvottu saanto |
|---|---|
| `squadron` | A single squadron of 2-6 Rogue Trader escorts, Rogue Trader cargo ships and auxiliary vessels may accompany each Rogue Trader cruiser in a fleet, in a |

| osio | lause jota ei valvota | syy |
|---|---|---|
| Sub-plots | Any game using the Rogue Trader fleet list must include a sub-plot from [???]-[???] of the Remastered Rulebook. | lause ei jasenny nykyisilla kaavoilla |
| Veteran Rogue Traders | A Veteran Rogue Trader may be present for every two Rogue Trader cruisers in a fleet. | lause ei jasenny nykyisilla kaavoilla |
| CAPITAL SHIPS | Your fleet may include no more than twelve capital s hips, at least half of which must be Rogue Trader Cruisers and/or Endeavour light cruisers, follo | lause ei jasenny nykyisilla kaavoilla |
| TRANSPORTS | No more than 1/3 of the fleet’s total transport value can be made up of heavy transports. | lause ei jasenny nykyisilla kaavoilla |
| RESERVES AND ALLIES | Up to one cruiser from any fleet except Orks, Necrons and Tyranids can be taken for every three Rogue Trader cruisers in the fleet. | lause ei jasenny nykyisilla kaavoilla |
| The Demiurg | At least one Demiurg vessel of any class may be taken for every three Rogue Trader cruisers in the fleet. | lause ei jasenny nykyisilla kaavoilla |
| The Demiurg | This is separate from and in addition to any reserve or allied cruisers taken, but each Demiurg vessel taken still counts against the twelve-cruiser l | lause ei jasenny nykyisilla kaavoilla |

### Rogue Traders — Pirates and Wolf Packs (kirjan sivu 178)

Valvottuja **3** (mandatory_at 1, section_count 1, squadron 1). Tarkistettavaksi jaa 2.

| tyyppi | valvottu saanto |
|---|---|
| `mandatory_at` | If a pirate fleet has more than 750 points of ships, a Pirate Captain must lead it. |
| `section_count` | 0-3 Pirate Captains |
| `squadron` | At least one squadron of 3–6 escort vessels must be included for each cruiser in the fleet, organized in any mix desired. |

| osio | lause jota ei valvota | syy |
|---|---|---|
| Pirate Captains | A Pirate Captain may be embarked on a cruiser for every 500 points or portion thereof in a fleet. | pisterajaan sidottu, mutta kohteena alusluokka eika osio |
| CAPITAL SHIPS | A human pirate fleet may have up to one cruiser for every 500 points of ships in the fleet or portion thereof. | pisterajaan sidottu, mutta kohteena alusluokka eika osio |

### Chaos — Incursion (kirjan sivu 232)

Valvottuja **8** (mandatory_at 1, ratio 3, section_count 3, squadron 1). Tarkistettavaksi jaa 1.

| tyyppi | valvottu saanto |
|---|---|
| `mandatory_at` | You must include a Chaos Warmaster in your fleet, even if it is worth 750 points or less. |
| `section_count` | You may include up to three Chaos Lords in your fleet. |
| `section_count` | You may include up to one Space Hulk in the fleet. |
| `ratio` | You may include up to one battleship in your fleet for every three cruisers or heavy cruisers. |
| `ratio` | You may include up to one grand cruiser in your fleet for every three cruisers or heavy cruisers. |
| `ratio` | You may include up to one heavy cruiser in your fleet for every two cruisers. |
| `section_count` | 0-12 Cruisers |
| `squadron` | You may include any number of escorts in your fleet in squadrons of 2–6 unless specified (see pg 13). |

| osio | lause jota ei valvota | syy |
|---|---|---|
| Chaos Lords | A Chaos Lord may be given up to one of the following Marks of Chaos. | lause ei jasenny nykyisilla kaavoilla |

### Chaos — Black Crusade (kirjan sivu 234)

Valvottuja **9** (mandatory_at 1, ratio 3, section_count 4, squadron 1). Tarkistettavaksi jaa 3.

| tyyppi | valvottu saanto |
|---|---|
| `mandatory_at` | A Chaos Warmaster (and their required capital ship) must be taken in fleets of 750 points or more. |
| `section_count` | 0-1 Chaos Warmaster |
| `section_count` | 0-1 Planet Killer |
| `section_count` | You may include up to one Space Hulk in the fleet. |
| `ratio` | You may include up to one battleship in your fleet for every three cruisers or heavy cruisers. |
| `ratio` | You may include up to one grand cruiser in your fleet for every three cruisers or heavy cruisers. |
| `ratio` | You may include up to one heavy cruiser in your fleet for every two cruisers. |
| `section_count` | 0-12 Cruisers |
| `squadron` | You may include any number of escorts in your fleet in squadrons of 2–6 unless specified (see pg 13). |

| osio | lause jota ei valvota | syy |
|---|---|---|
| Abaddon | You may include Abaddon the Despoiler as the Warmaster in any Chaos Fleet worth more than 1,000 points. | lause ei jasenny nykyisilla kaavoilla |
| CHAOS SPACE MARINE CREWS | For +10 points, battleships and grand cruisers with Chaos Space Marine Warmasters, Lords or crews may include Chosen Terminators. | varuste- tai merkkivalinta, ei laivaston koostumus |
| Planet Killer | A fleet of 1,000 points or more may include the Planet Killer. | lause ei jasenny nykyisilla kaavoilla |

### Chaos — Tzeentch (kirjan sivu 236)

Valvottuja **9** (mandatory_at 1, ratio 3, section_count 4, squadron 1). Tarkistettavaksi jaa 5.

| tyyppi | valvottu saanto |
|---|---|
| `mandatory_at` | A Chaos Warmaster (and their required capital ship) must be taken in fleets of 750 points or more. |
| `section_count` | 0-1 Chaos Warmaster of Tzeentch |
| `section_count` | 0-1 Planet Killer |
| `section_count` | You may include up to one Space Hulk in the fleet. |
| `ratio` | You may include up to one battleship in your fleet for every three cruisers or heavy cruisers. |
| `ratio` | You may include up to one grand cruiser in your fleet for every three cruisers or heavy cruisers. |
| `ratio` | You may include up to one heavy cruiser in your fleet for every two cruisers. |
| `section_count` | 0-12 Cruisers |
| `squadron` | You may include any number of escorts in your fleet in squadrons of 2–6 unless specified (see pg 13). |

| osio | lause jota ei valvota | syy |
|---|---|---|
| CHAOS SPACE MARINE CREWS | For +10 points, battleships and grand cruisers with Chaos Space Marine Warmasters, Lords or crews may include Chosen Terminators. | varuste- tai merkkivalinta, ei laivaston koostumus |
| FORCES OF CHAOS | Up to two capital ships (including the flagship), that have the Mark of Tzeentch, can have daemonic entities and warp beasts swirl about its hull, inc | varuste- tai merkkivalinta, ei laivaston koostumus |
| Planet Killer | A fleet of 1,000 points or more may include the Planet Killer. | lause ei jasenny nykyisilla kaavoilla |
| Battleships | A fleet 1,000 points or more may include the Scion of Prospero as one of its battleships, subject to normal restrictions. | lause ei jasenny nykyisilla kaavoilla |
| DAEMONSHIPS | Daemonships in a Sorcerous Fleet may only take the Mark of Tzeentch, paid for separately. | varuste- tai merkkivalinta, ei laivaston koostumus |

### Chaos — Nurgle (kirjan sivu 240)

Valvottuja **9** (mandatory_at 1, ratio 3, section_count 4, squadron 1). Tarkistettavaksi jaa 4.

| tyyppi | valvottu saanto |
|---|---|
| `mandatory_at` | A Chaos Warmaster (and their required capital ship) must be taken in fleets of 750 points or more. |
| `section_count` | 0-1 Chaos Warmaster of Nurgle |
| `section_count` | 0-1 Planet Killer |
| `section_count` | You may include up to one Space Hulk in the fleet. |
| `ratio` | You may include up to one battleship in your fleet for every three cruisers or heavy cruisers. |
| `ratio` | You may include up to one grand cruiser in your fleet for every three cruisers or heavy cruisers. |
| `ratio` | You may include up to one heavy cruiser in your fleet for every two cruisers. |
| `section_count` | 0-12 Cruisers |
| `squadron` | You may include any number of escorts in your fleet in squadrons of 2–6 unless specified (see pg 13). |

| osio | lause jota ei valvota | syy |
|---|---|---|
| CHAOS SPACE MARINE CREWS | For +10 points, battleships and grand cruisers with Chaos Space Marine Warmasters, Lords or crews may include Chosen Terminators. | varuste- tai merkkivalinta, ei laivaston koostumus |
| FORCES OF CHAOS | Up to three capital ships with the Mark of Nurgle (including the flagship) may also become Arks of Pestilence. | varuste- tai merkkivalinta, ei laivaston koostumus |
| Planet Killer | A fleet of 1,000 points or more may include the Planet Killer. | lause ei jasenny nykyisilla kaavoilla |
| Battleships | A fleet 1,000 points or more may include the Terminus Est as one of its battleships, subject to normal restrictions. | lause ei jasenny nykyisilla kaavoilla |

### Chaos — Khorne (kirjan sivu 244)

Valvottuja **9** (mandatory_at 1, ratio 3, section_count 4, squadron 1). Tarkistettavaksi jaa 3.

| tyyppi | valvottu saanto |
|---|---|
| `mandatory_at` | A Chaos Warmaster (and their required capital ship) must be taken in fleets of 750 points or more. |
| `section_count` | 0-1 Chaos Warmaster of Khorne |
| `section_count` | 0-1 Planet Killer |
| `section_count` | You may include up to one Space Hulk in the fleet, which must be the flagship if chosen. |
| `ratio` | You may include up to one battleship in your fleet for every three cruisers or heavy cruisers. |
| `ratio` | You may include up to one grand cruiser in your fleet for every three cruisers or heavy cruisers. |
| `ratio` | You may include up to one heavy cruiser in your fleet for every two cruisers. |
| `section_count` | 0-12 Cruisers |
| `squadron` | You may include any number of escorts in your fleet in squadrons of 2–6 unless specified (see pg 13). |

| osio | lause jota ei valvota | syy |
|---|---|---|
| CHAOS SPACE MARINE CREWS | For +10 points, battleships and grand cruisers with Chaos Space Marine Warmasters, Lords or crews may include Chosen Terminators. | varuste- tai merkkivalinta, ei laivaston koostumus |
| Planet Killer | A fleet of 1,000 points or more may include the Planet Killer. | lause ei jasenny nykyisilla kaavoilla |
| Battleships | A fleet 1,000 points or more may include the Slaverer as one of its battleships, subject to normal restrictions. | lause ei jasenny nykyisilla kaavoilla |

### Chaos — Slaanesh (kirjan sivu 248)

Valvottuja **9** (mandatory_at 1, ratio 3, section_count 4, squadron 1). Tarkistettavaksi jaa 4.

| tyyppi | valvottu saanto |
|---|---|
| `mandatory_at` | A Chaos Warmaster (and their required capital ship) must be taken in fleets of 750 points or more. |
| `section_count` | 0-1 Chaos Warmaster of Slaanesh |
| `section_count` | 0-1 Planet Killer |
| `section_count` | You may include up to one Space Hulk in the fleet. |
| `ratio` | You may include up to one battleship in your fleet for every three cruisers or heavy cruisers. |
| `ratio` | You may include up to one grand cruiser in your fleet for every three cruisers or heavy cruisers. |
| `ratio` | You may include up to one heavy cruiser in your fleet for every two cruisers. |
| `section_count` | 0-12 Cruisers |
| `squadron` | You may include any number of escorts in your fleet in squadrons of 2–6 unless specified (see pg 13). |

| osio | lause jota ei valvota | syy |
|---|---|---|
| CHAOS SPACE MARINE CREWS | For +10 points, battleships and grand cruisers with Chaos Space Marine Warmasters, Lords or crews may include Chosen Terminators. | varuste- tai merkkivalinta, ei laivaston koostumus |
| FORCES OF CHAOS | Up to two capital ships with the Mark of Slaanesh (including the flagship) may take the Siren’s Summon. | varuste- tai merkkivalinta, ei laivaston koostumus |
| Planet Killer | A fleet of 1,000 points or more may include the Planet Killer. | lause ei jasenny nykyisilla kaavoilla |
| Battleships | A fleet 1,000 points or more may include the Wage of Sin as one of its battleships, subject to normal restrictions. | lause ei jasenny nykyisilla kaavoilla |

### Eldar Corsairs — Gothic Sector (kirjan sivu 316)

Valvottuja **4** (mandatory_at 1, section_count 2, squadron 1). Tarkistettavaksi jaa 4.

| tyyppi | valvottu saanto |
|---|---|
| `mandatory_at` | If the fleet is worth over 750 points a Pirate Prince must be included to lead it. |
| `section_count` | 0-1 Pirate Prince |
| `section_count` | 0-12 Cruisers |
| `squadron` | You may include any number of escorts in your fleet in squadrons of 2–6 unless specified (see pg 13). |

| osio | lause jota ei valvota | syy |
|---|---|---|
| FLEET RULES (pg. 310–315 | The number of pulsar lances fired at each enemy ship in low orbit is reduced by 1 for every Fortress destroyed. | lause ei jasenny nykyisilla kaavoilla |
| Pirate Prince | You may include 1 Pirate Prince in your fleet, who must be assigned to a ship and adds +2 to its Leadership, to a maximum of 10. | komentajan maara; jo valvottu osiorajana (0-1) |
| RESERVES AND ALLIES | Following this, one Craftworld Eldar Flame of Asuryan, Dragonship or Wraithship may be taken for every three cruisers in the fleet. | lause ei jasenny nykyisilla kaavoilla |
| RESERVES AND ALLIES | Craftworld Eldar Shadowhunters may be taken in the same ratio of no more than one for every three escort vessels in the fleet. | suhdeluku alusluokkaan, ei osioon |

### Eldar Corsairs — Later Gothic War (kirjan sivu 317)

Valvottuja **5** (mandatory_at 1, per_points 1, section_count 2, squadron 1). Tarkistettavaksi jaa 4.

| tyyppi | valvottu saanto |
|---|---|
| `mandatory_at` | If the fleet is worth over 750 points a Pirate Prince must be included to lead it. |
| `section_count` | 0-1 Pirate Prince |
| `per_points` | Your fleet may include up to one battleship for every full 1,000 points it contains. |
| `section_count` | 0-12 Cruisers |
| `squadron` | You may include any number of escorts in your fleet in squadrons of 2–6 unless specified (see pg 13). |

| osio | lause jota ei valvota | syy |
|---|---|---|
| FLEET RULES (pg. 310–315 | The number of pulsar lances fired at each enemy ship in low orbit is reduced by 1 for every Fortress destroyed. | lause ei jasenny nykyisilla kaavoilla |
| Pirate Prince | You may include 1 Pirate Prince in your fleet, who must be assigned to a ship and adds +2 to its Leadership, to a maximum of 10. | komentajan maara; jo valvottu osiorajana (0-1) |
| RESERVES AND ALLIES | Following this, one Craftworld Eldar Flame of Asuryan, Dragonship or Wraithship may be taken for every three cruisers in the fleet. | lause ei jasenny nykyisilla kaavoilla |
| RESERVES AND ALLIES | Craftworld Eldar Shadowhunters may be taken in the same ratio of no more than one for every three escort vessels in the fleet. | suhdeluku alusluokkaan, ei osioon |

### Eldar — Iyanden Craftworld (kirjan sivu 318)

Valvottuja **5** (mandatory_at 1, ratio 1, section_count 2, squadron 1). Tarkistettavaksi jaa 7.

| tyyppi | valvottu saanto |
|---|---|
| `mandatory_at` | If the fleet is worth over 750 points, an Autarch must be included to lead it. |
| `section_count` | 0-1 Autarch |
| `section_count` | You may include up to three Farseers in your fleet, each of whom must be assigned to a capital ship (including the flagship if desired) and gives the  |
| `ratio` | Your fleet may include up to one Dragonship for every two Wraithships included in the fleet. |
| `squadron` | You may include any number of escorts in your fleet in squadrons of 2–6 unless specified (see pg 13). |

| osio | lause jota ei valvota | syy |
|---|---|---|
| FLEET RULES (pg. 310–315 | The number of pulsar lances fired at each enemy ship in low orbit is reduced by 1 for every Fortress destroyed. | lause ei jasenny nykyisilla kaavoilla |
| Autarch | You may include one Eldar Autarch in your fleet, who replaces the ship’s Leadership with his own. | lause ei jasenny nykyisilla kaavoilla |
| Dragonships | If your fleet is led by an Autarch, you may include a single Dragonship as his flagship which does not count against this limitation. | lause ei jasenny nykyisilla kaavoilla |
| Wraithships | Your fleet may include any number of Wraithships. | ei rajoita mitaan |
| RESERVES AND ALLIES | Following this, one Corsair Eldar cruiser or light cruiser may be taken for every three Dragonships and / or Wraithships in the fleet. | lause ei jasenny nykyisilla kaavoilla |
| RESERVES AND ALLIES | Corsair Eldar escort vessels may be taken in the same ratio of no more than one for every three Shadowhunters in the fleet. | lause ei jasenny nykyisilla kaavoilla |
| RESERVES AND ALLIES | Up to one Void Stalker may be taken in the fleet as long as the fleet is at least 1000 points and at least three Corsair Eldar cruisers and / or light | lause ei jasenny nykyisilla kaavoilla |

### Dark Eldar — Pirates (kirjan sivu 351)

Valvottuja **4** (mandatory_at 1, section_count 2, squadron 1). Tarkistettavaksi jaa 2.

| tyyppi | valvottu saanto |
|---|---|
| `mandatory_at` | 1f the fleet is worth over 750 points a Dread Archon must be included to lead it. |
| `section_count` | 0-1 Dread Archon |
| `section_count` | 0-12 Cruisers |
| `squadron` | You may include any number of escorts in your fleet in squadrons of 2–6 unless specified (see pg 13). |

| osio | lause jota ei valvota | syy |
|---|---|---|
| Dread Archon | You may include 1 Dread Archon in your fleet, who must be assigned to a ship and adds + 2 to its Leadership, to a maximum of 10. | komentajan maara; jo valvottu osiorajana (0-1) |
| ESCORTS | However, Dark Eldar fleets must contain at least three escorts for every capital ship taken. | suhdeluku alusluokkaan, ei osioon |

### Orks — Cyclops Cluster (kirjan sivu 365)

Valvottuja **4** (cap 1, mandatory_at 1, per_points 1, squadron 1). Tarkistettavaksi jaa 3.

| tyyppi | valvottu saanto |
|---|---|
| `mandatory_at` | If the fleet is worth 500 points or more it must include at least 1 Warlord to lead it. |
| `per_points` | An Ork fleet can include a max of one Warlord per 500 points. |
| `cap` | You may include up to six kroozers in your fleet. |
| `squadron` | You may include any number of escorts in your fleet in squadrons of 2–6 unless specified (see pg 13). |

| osio | lause jota ei valvota | syy |
|---|---|---|
| WARLORD | You may include 1 or more Warlord in your fleet, each of whom must be assigned to a ship or squadron. | komentajan maara; jo valvottu osiorajana (0-1) |
| WARLORD | A vessel carrying a Warlord doubles its boarding value and may include up to one of the upgrades shown below at the additional cost indicated. | lause ei jasenny nykyisilla kaavoilla |
| DAKKA DAKKA | Ork capital ships can add +2 turrets to their ships for +20 points (this is not the same thing as saying “up to two turrets at +10 points each”). | lause ei jasenny nykyisilla kaavoilla |

### Orks — Waaagh! (kirjan sivu 366)

Valvottuja **6** (cap 1, mandatory_at 1, per_points 2, ratio 1, squadron 1). Tarkistettavaksi jaa 6.

| tyyppi | valvottu saanto |
|---|---|
| `mandatory_at` | If the fleet is worth 500 points or more it must include at least 1 Warlord to lead it. |
| `per_points` | An Ork fleet can include a max of one Warlord per 500 points. |
| `per_points` | An Ork fleet can include a maximum of one space hulk per 1,500 points. |
| `ratio` | For every two kroozers included in your fleet, you may pick one vessel from the list below. |
| `cap` | You may include up to six kroozers in your fleet. |
| `squadron` | You may include any number of escorts in your fleet in squadrons of 2–6 unless specified (see pg 13). |

| osio | lause jota ei valvota | syy |
|---|---|---|
| WARLORD | You may include 1 or more Warlord in your fleet, each of whom must be assigned to a ship or squadron. | komentajan maara; jo valvottu osiorajana (0-1) |
| WARLORD | A vessel carrying a Warlord doubles its boarding value and may include up to one of the upgrades shown below at the additional cost indicated. | lause ei jasenny nykyisilla kaavoilla |
| SPACE HULKS | You may include up to one Ork Space Hulk in your fleet per 1,500 points. | pisterajaan sidottu, mutta kohteena alusluokka eika osio |
| SPACE HULKS | So if the fleet is worth up to 1,500 points, it may include one Space hulk. | edellisen lauseen esimerkki |
| ORK ROKS | Ork Roks may be squadroned with up to three other Roks (total squadron size of four), but not with any other vessels. | lause ei jasenny nykyisilla kaavoilla |
| DAKKA DAKKA | Ork capital ships can add +2 turrets to their ships for +20 points (this is not the same thing as saying “up to two turrets at +10 points each”). | lause ei jasenny nykyisilla kaavoilla |

### Orks — Da Ork Clanz (kirjan sivu 372)

Valvottuja **1** (per_points 1). Tarkistettavaksi jaa 5.

| tyyppi | valvottu saanto |
|---|---|
| `per_points` | Ork fleets always include one Warlord for every 500 points, or part, that the fleet is worth – no more, no less. |

| osio | lause jota ei valvota | syy |
|---|---|---|
| Big ship skwadron | 1-2 Kroozers, chosen from the following list: | lause ei jasenny nykyisilla kaavoilla |
| Tiddla skwadron | 3-10 Escorts, chosen from the following list in any mix desired: | lause ei jasenny nykyisilla kaavoilla |
| Space Hulks | An Ork fleet with at least three Warlords may include one Space Hulk. | lause ei jasenny nykyisilla kaavoilla |
| USING SKWADRONS | While there must be at least one Warlord for every 500 points in the fleet or portion thereof, not all Warlords are created equal! | pisterajaan sidottu, mutta kohteena alusluokka eika osio |
| CLAN UPGRADES | A Blood Axe tiddla skwadron of at least six escorts may include up to three Imperial Navy and/or Chaos escorts from any fleet list at their listed cos | lause ei jasenny nykyisilla kaavoilla |

### Necrons — Harvest Fleet (kirjan sivu 404)

Valvottuja **2** (ratio 1, squadron 1). Tarkistettavaksi jaa 2.

| tyyppi | valvottu saanto |
|---|---|
| `ratio` | Your fleet may include up to one tombship for every Scythe class harvest ship it contains. |
| `squadron` | Your fleet may include up to twelve Jackal class raiders, and up to twelve Dirge class raiders, in squadrons of 2–6. |

| osio | lause jota ei valvota | syy |
|---|---|---|
| FLEET RULES (pg. 398–403 | The drive is fired whenever All Ahead Full orders are issued; instead of obeying the normal rules for this order the ship gains D6 × 10 cm additional  | lause ei jasenny nykyisilla kaavoilla |
| Cruisers | Your fleet may include up to six Scythe class harvest ships and up to three Shroud class light cruisers. | lause ei jasenny nykyisilla kaavoilla |

### Tyranids — Vanguard Fleet (kirjan sivu 429)

Valvottuja **1** (squadron 1). Tarkistettavaksi jaa 6.

| tyyppi | valvottu saanto |
|---|---|
| `squadron` | Vanguard drone ships and Kraken may be deployed in squadrons of 6 to 12 models. You may combine the two types in a single squadron if you wish. |

| osio | lause jota ei valvota | syy |
|---|---|---|
| FLEET RULES (pg. 423–428 | Example: A Hive ship can have four reinforced carapaces, two extra spore cysts and one other refit, resulting in no more than three different refits. | lause ei jasenny nykyisilla kaavoilla |
| FLEET RULES (pg. 423–428 | No more than two spore cysts can be gained in this manner. | lause ei jasenny nykyisilla kaavoilla |
| FLEET RULES (pg. 423–428 | No more than four additional Hits may be gained in this manner for Hive ships, and no more than three for cruisers. | lause ei jasenny nykyisilla kaavoilla |
| VANGUARD DRONE SHIPS | Your fleet may include any number of Vanguard drone ships. | ei rajoita mitaan |
| KRAKEN | Your fleet may include any number of Kraken. | ei rajoita mitaan |
| LEADERSHIP | Escort squadrons in a Tyranid Vanguard fleet each have a Leadership value equal to the number of vessels remaining in the squadron (up to a maximum of | lause ei jasenny nykyisilla kaavoilla |

### Tyranids — Hive Fleet (kirjan sivu 430)

Valvottuja **2** (ratio 1, squadron 1). Tarkistettavaksi jaa 7.

| tyyppi | valvottu saanto |
|---|---|
| `ratio` | You may include up to 2 capital ships for each hive ship in the fleet. |
| `squadron` | Tyranid Escorts come as squadrons of 1 to 12 vessels, while all other types are individuals and may not deploy in squadrons. |

| osio | lause jota ei valvota | syy |
|---|---|---|
| FLEET RULES (pg. 423–428 | Example: A Hive ship can have four reinforced carapaces, two extra spore cysts and one other refit, resulting in no more than three different refits. | lause ei jasenny nykyisilla kaavoilla |
| FLEET RULES (pg. 423–428 | No more than two spore cysts can be gained in this manner. | lause ei jasenny nykyisilla kaavoilla |
| FLEET RULES (pg. 423–428 | No more than four additional Hits may be gained in this manner for Hive ships, and no more than three for cruisers. | lause ei jasenny nykyisilla kaavoilla |
| FLEET COMMANDER | A maximum of one Hive Mind Imperative can be purchased per two hive ships in the fleet, though a single Hive Mind Imperative may be purchased as long  | varuste- tai merkkivalinta, ei laivaston koostumus |
| ESCORTS | You may include between 6 and 12 escort class ships for each hive ship. | lause ei jasenny nykyisilla kaavoilla |
| ESCORTS | A Vanguard drone ship must be armed with one weapon chosen from the following list: The fleet must have at least six escort drones for every hive ship | suhdeluku alusluokkaan, ei osioon |
| ESCORTS | If desired, this may be in addition to the 6–12 escorts (of any type) that may be taken for every hive ship in the fleet. | suhdeluku alusluokkaan, ei osioon |

### Tau — Merchant Fleet (kirjan sivu 454)

Valvottuja **7** (mandatory_at 2, per_points 1, ratio 2, section_count 1, squadron 1). Tarkistettavaksi jaa 8.

| tyyppi | valvottu saanto |
|---|---|
| `mandatory_at` | Your fleet must include a commander if it is greater than 750 pts. |
| `section_count` | 0-1 Commander |
| `mandatory_at` | If your fleets is worth more than 750 pts it must include at least one Explorer. |
| `ratio` | It may also include up to one Hero class starship for every Merchant or Explorer in the fleet. |
| `per_points` | Your fleet may include up to one Messenger class starship per 500 points. |
| `squadron` | Defenders are fielded in squadrons of 2–6 ships. |
| `ratio` | A Tau fleet can include up to one Demiurg vessel for every three Tau capital ships in the fleet. |

| osio | lause jota ei valvota | syy |
|---|---|---|
| FLEET RULES (pg. 448–453 | ALLIES, SUBJECTS & MERCENARIES Tau fleets may include allies, subjects and mercenaries, selected from the fleet lists as normal. | lause ei jasenny nykyisilla kaavoilla |
| Commander | Your fleet may include a fleet commander to lead it if you wish. | lause ei jasenny nykyisilla kaavoilla |
| Battleships | Your fleet may include any number of battleships. | ei rajoita mitaan |
| Cruisers | Your fleet may include any number of Merchant class starships. | ei rajoita mitaan |
| ESCORTS | Your fleet may include any number of Defender class starships. | ei rajoita mitaan |
| ALLIES, SUBJECTS & MERCE | Your fleet may include mercenaries chosen from the following, subject to the relevant restrictions. | lause ei jasenny nykyisilla kaavoilla |
| Kroot Vessels | A Tau fleet can include up to one Warsphere if the fleet is worth 1500 points, or up to two Warspheres in games larger than that. | lause ei jasenny nykyisilla kaavoilla |
| Nicassar Vessels | Your fleet may include Nicassar Dhows in place of some or all of its Orcas. | lause ei jasenny nykyisilla kaavoilla |

### Tau — Commerce Protection (kirjan sivu 456)

Valvottuja **5** (mandatory_at 1, per_points 1, ratio 1, section_count 1, squadron 1). Tarkistettavaksi jaa 13.

| tyyppi | valvottu saanto |
|---|---|
| `mandatory_at` | Your fleet must include a commander if it is greater than 750 pts. |
| `section_count` | 0-1 Commander |
| `per_points` | Your fleet may include up to one Messenger class starship per 500 points. |
| `squadron` | Defenders are fielded in squadrons of 2–6 ships. |
| `ratio` | A Tau fleet can include up to one Demiurg vessel for every three Tau capital ships in the fleet. |

| osio | lause jota ei valvota | syy |
|---|---|---|
| FLEET RULES (pg. 448–453 | ALLIES, SUBJECTS & MERCENARIES Tau fleets may include allies, subjects and mercenaries, selected from the fleet lists as normal. | lause ei jasenny nykyisilla kaavoilla |
| Commander | Your fleet may include a fleet commander to lead it if you wish. | lause ei jasenny nykyisilla kaavoilla |
| Battleships | Your fleet may include any number of Explorer battleships. | ei rajoita mitaan |
| Battleships | Your fleet may include up to one Custodian per FULL 750 points of Tau vessels. | lause ei jasenny nykyisilla kaavoilla |
| Battleships | For example, a fleet that has at least 750 points of Tau vessels in it may include a single Custodian. | edellisen lauseen esimerkki |
| Battleships | Fleets of at least 1,500 points may include two Custodians etc. | edellisen lauseen esimerkki |
| Cruisers | Your fleet may include any number of Merchant, Emissary or Protector class starships. | ei rajoita mitaan |
| Cruisers | It may also include up to one Hero class starship for every other type of capital ship in the fleet. | lause ei jasenny nykyisilla kaavoilla |
| ESCORTS | Your fleet may include any number of Defender and/or Castellan class starships. | ei rajoita mitaan |
| ALLIES, SUBJECTS & MERCE | Your fleet may include mercenaries chosen from the following, subject to the relevant restrictions. | lause ei jasenny nykyisilla kaavoilla |
| Kroot Vessels | A Tau fleet can include up to one Warsphere if the fleet is worth 1500 points, or up to two Warspheres in games larger than that. | lause ei jasenny nykyisilla kaavoilla |
| Nicassar Vessels | Your fleet may include Nicassar Dhows in place of some or all of its Orcas. | lause ei jasenny nykyisilla kaavoilla |
| Rogue Traders | Up to one Rogue Trader cruiser and its attendant escorts may accompany the fleet for every 750 points of Tau ships in the fleet. | pisterajaan sidottu, mutta kohteena alusluokka eika osio |

### Demiurg — War Host (kirjan sivu 486)

Valvottuja **4** (cap 1, per_points 1, ratio 1, section_count 1). Tarkistettavaksi jaa 4.

| tyyppi | valvottu saanto |
|---|---|
| `ratio` | Your fleet may include one battleship for every two cruiser-class vessels in the fleet. |
| `cap` | Your fleet may include no more than twelve cruisers. |
| `per_points` | The fleet may have one Kroot Warsphere in the fleet for every 750 points in the fleet or portion thereof. |
| `section_count` | Kroot Vessels (0–3) |

| osio | lause jota ei valvota | syy |
|---|---|---|
| FLEET RULES (pg. 482–485 | The cutting beam counts as a single lance but each Blast marker picked up by the Demiurg vessel in the Movement phase gives the beam the equivalent of | lause ei jasenny nykyisilla kaavoilla |
| Cruisers | Demiurg Commerce Vessels must outnumber all non-Demiurg cruisers combined. | vertailu kahden rungon valilla; moottorissa ei ole tata saantotyyppia |
| ESCORTS | For every three Demiurg capital ships in the fleet, it may include one squadron of up to six Tau or Rogue Trader escorts. | lause ei jasenny nykyisilla kaavoilla |
| ESCORTS | Nicassar Dhows, Tau Wardens or Orcas can be taken for every starship in the fleet equipped with gravitic hooks. | lause ei jasenny nykyisilla kaavoilla |

