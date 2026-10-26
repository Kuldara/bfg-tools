# Rules audit

The book's composition rules compared with what the app enforces.
Produced by `rules_audit.py` on 2026-10-26. Source: Battlefleet Gothic: Remastered — Fleets Book WiP v0.36 (28 Aug 2025) and Rulebook v1.10 (7 May 2024)

## Summary

| | |
|---|---|
| fleet lists | 32 |
| rules enforced by machine | **400** |
| composition sentences left for the player to check | 211 |
| ship profiles | 176 |
| selectable list rows | 1712 |

Why sentences are left unenforced:

| reason | sentences |
|---|---|
| the sentence does not parse with the current patterns | 138 |
| tied to a points limit, but the target is a ship class and not a section | 34 |
| the number of commanders; already enforced as a section limit (0-1) | 12 |
| an equipment or Mark choice, not fleet composition | 9 |
| limits nothing | 9 |
| a ratio to a ship class, not to a section | 5 |
| an example of the previous sentence | 3 |
| a comparison between two hulls; the engine has no such rule type | 1 |

## By list

### Imperial Navy — Gothic Sector (book page 35)

Enforced **15** (allowed_at 1, cap 1, conditional_cap 2, mandatory_at 1, per_points 2, ratio 2, requires 2, section_count 2, squadron 2). Left to check 6.

| type | enforced rule |
|---|---|
| `mandatory_at` | If the fleet is worth over 750 points an Admiral must be included to lead it. |
| `section_count` | 0-1 Admiral |
| `ratio` | You may include up to one battleship in your fleet for every three cruisers or battlecruisers. |
| `ratio` | You may include up to one battlecruiser in your fleet for every two cruisers. |
| `section_count` | 0-12 Cruisers Rogue Trader cruisers always count against cruiser restrictions in any fleet list that has such restrictions. |
| `squadron` | You may include any number of escorts in your fleet in squadrons of 2–6 unless specified (see pg 13). |
| `allowed_at` | Any Imperial or Space Marine fleet 750 points or greater may be led by an Inquisitor Lord. |
| `per_points` | If an Inquisitor Lord is leading the fleet, up to one Grey Knights Strike Cruiser may be taken for every 500 points in the fleet. |
| `cap` | Any Imperial or Space Marine fleet 750 points or greater may be led by an Inquisitor Lord. |
| `requires` | The listed cost is added to that of the Inquisitor Lord, and its benefits apply to the ship they are embarked upon. |
| `requires` | An Imperial Navy or Adeptus Mechanicus fleet led by an Inquisitor that does not include Space Marine vessels may has the following addition to its res |
| `conditional_cap` | An Imperial Navy or Adeptus Mechanicus fleet led by an Inquisitor that does not include Space Marine vessels may has the following addition to its res |
| `conditional_cap` | These vessels are free of the “Strange Happenings” special rule as long as the Inquisitor’s ship remains in play, but the fleet may not take any Grey  |
| `per_points` | Tau, Demiurg and Imperial fleets may include one Rogue Trader cruiser for every 750 points or part thereof in their fleet. |
| `squadron` | Orbital defences or ships that count as defences may be placed in squadrons, with 1HP defences grouped in up to six units and larger defences grouped  |

| section | sentence not enforced | reason |
|---|---|---|
| Admiral | You may include 1 Admiral in your fleet, who must be assigned to a ship and improves its Leadership to the value shown. | the number of commanders; already enforced as a section limit (0-1) |
| THE INQUISITION | Any Imperial or Space Marine fleet may include a single Inquisitorial Cruiser in the fleet, which takes the place of a battlecruiser or strike cruiser | the sentence does not parse with the current patterns |
| THE INQUISITION | A fleet may include a single Blackship, which as a special vessel does not count toward or against other ship limits in the fleet. | the sentence does not parse with the current patterns |
| ROGUE TRADERS | Any fleet except Necrons or Tyranids may include a single Rogue Trader capital ship. | the sentence does not parse with the current patterns |
| ROGUE TRADERS | Tau, Demiurg and Imperial fleets may include one Rogue Trader cruiser for every 750 points or part thereof in their fleet. | tied to a points limit, but the target is a ship class and not a section |
| PLANETARY DEFENCES | It is also a good idea to put an upper limit on the amount of points that can be spent (for example, in a standard battle perhaps no more than 10% of  | the sentence does not parse with the current patterns |

### Imperial Navy — Bastion Fleets (book page 36)

Enforced **14** (allowed_at 1, cap 1, compare 1, mandatory_at 1, per_points 2, ratio 2, requires 1, section_count 3, squadron 2). Left to check 7.

| type | enforced rule |
|---|---|
| `mandatory_at` | If the fleet is worth over 750 points an Admiral must be included to lead it. |
| `section_count` | 0-1 Admiral |
| `ratio` | You may include up to one battleship in your fleet for every three cruisers or battlecruisers. |
| `ratio` | You may include up to one battlecruiser or grand cruiser in your fleet for every two cruisers. |
| `section_count` | 0-12 Cruisers Rogue Trader cruisers always count against cruiser restrictions in any fleet list that has such restrictions. |
| `squadron` | You may include any number of escorts in your fleet in squadrons of 2–6 unless specified (see pg 13). |
| `compare` | The Endurance and Defiant class light cruisers are rare variants of the Endeavour, hence the combined numbers of Endurance and Defiant class vessels m |
| `section_count` | You may include up to five Veteran Captains in your fleet. |
| `allowed_at` | Any Imperial or Space Marine fleet 750 points or greater may be led by an Inquisitor Lord. |
| `per_points` | If an Inquisitor Lord is leading the fleet, up to one Grey Knights Strike Cruiser may be taken for every 500 points in the fleet. |
| `cap` | Any Imperial or Space Marine fleet 750 points or greater may be led by an Inquisitor Lord. |
| `requires` | The listed cost is added to that of the Inquisitor Lord, and its benefits apply to the ship they are embarked upon. |
| `per_points` | Tau, Demiurg and Imperial fleets may include one Rogue Trader cruiser for every 750 points or part thereof in their fleet. |
| `squadron` | Orbital defences or ships that count as defences may be placed in squadrons, with 1HP defences grouped in up to six units and larger defences grouped  |

| section | sentence not enforced | reason |
|---|---|---|
| Admiral | You may include 1 Admiral in your fleet, who must be assigned to a ship and improves its Leadership to the value shown. | the number of commanders; already enforced as a section limit (0-1) |
| ORDNANCE | * The Endurance and Defiant class light cruisers are rare variants of the Endeavour, hence the combined numbers of Endurance and Defiant class vessels | a comparison between two hulls; the engine has no such rule type |
| THE INQUISITION | Any Imperial or Space Marine fleet may include a single Inquisitorial Cruiser in the fleet, which takes the place of a battlecruiser or strike cruiser | the sentence does not parse with the current patterns |
| THE INQUISITION | A fleet may include a single Blackship, which as a special vessel does not count toward or against other ship limits in the fleet. | the sentence does not parse with the current patterns |
| ROGUE TRADERS | Any fleet except Necrons or Tyranids may include a single Rogue Trader capital ship. | the sentence does not parse with the current patterns |
| ROGUE TRADERS | Tau, Demiurg and Imperial fleets may include one Rogue Trader cruiser for every 750 points or part thereof in their fleet. | tied to a points limit, but the target is a ship class and not a section |
| PLANETARY DEFENCES | It is also a good idea to put an upper limit on the amount of points that can be spent (for example, in a standard battle perhaps no more than 10% of  | the sentence does not parse with the current patterns |

### Imperial Navy — Armageddon Sector (book page 40)

Enforced **18** (allowed_at 1, cap 1, conditional_cap 2, mandatory_at 1, per_points 3, ratio 2, requires 4, section_count 2, squadron 2). Left to check 7.

| type | enforced rule |
|---|---|
| `mandatory_at` | If the fleet is worth over 750 points a fleet commander must be included to lead it. |
| `section_count` | 0-1 Fleet Commander |
| `requires` | As long as at least one Space Marine Battle barge is included you may choose a Master of the Fleet, who will always be assigned to a Battle barge and  |
| `requires` | As long as the fleet includes at least one Imperial capital ship it may include a fleet-admiral, admiral or solar admiral, who will always be assigned |
| `ratio` | You may include up to one battleship in your fleet for every three cruisers or battlecruisers. |
| `ratio` | You may include up to one battlecruiser in your fleet for every cruiser. |
| `section_count` | 0-12 Cruisers Rogue Trader cruisers always count against cruiser restrictions in any fleet list that has such restrictions. |
| `squadron` | You may include any number of escorts in your fleet in squadrons of 2–6 unless specified (see pg 13). |
| `per_points` | No more than two of these vessels (Endurance and Defiant class light cruisers) may be taken for every 500 points (or portion thereof) in the fleet. |
| `allowed_at` | Any Imperial or Space Marine fleet 750 points or greater may be led by an Inquisitor Lord. |
| `per_points` | If an Inquisitor Lord is leading the fleet, up to one Grey Knights Strike Cruiser may be taken for every 500 points in the fleet. |
| `cap` | Any Imperial or Space Marine fleet 750 points or greater may be led by an Inquisitor Lord. |
| `requires` | The listed cost is added to that of the Inquisitor Lord, and its benefits apply to the ship they are embarked upon. |
| `requires` | An Imperial Navy or Adeptus Mechanicus fleet led by an Inquisitor that does not include Space Marine vessels may has the following addition to its res |
| `conditional_cap` | An Imperial Navy or Adeptus Mechanicus fleet led by an Inquisitor that does not include Space Marine vessels may has the following addition to its res |
| `conditional_cap` | These vessels are free of the “Strange Happenings” special rule as long as the Inquisitor’s ship remains in play, but the fleet may not take any Grey  |
| `per_points` | Tau, Demiurg and Imperial fleets may include one Rogue Trader cruiser for every 750 points or part thereof in their fleet. |
| `squadron` | Orbital defences or ships that count as defences may be placed in squadrons, with 1HP defences grouped in up to six units and larger defences grouped  |

| section | sentence not enforced | reason |
|---|---|---|
| Fleet Commander | You may include a commander in your fleet, who must be assigned to a ship and improves its Leadership to the value shown. | the sentence does not parse with the current patterns |
| Master of the Fleet Re-r | As long as the fleet includes at least one Imperial capital ship it may include a fleet-admiral, admiral or solar admiral, who will always be assigned | the sentence does not parse with the current patterns |
| THE INQUISITION | Any Imperial or Space Marine fleet may include a single Inquisitorial Cruiser in the fleet, which takes the place of a battlecruiser or strike cruiser | the sentence does not parse with the current patterns |
| THE INQUISITION | A fleet may include a single Blackship, which as a special vessel does not count toward or against other ship limits in the fleet. | the sentence does not parse with the current patterns |
| ROGUE TRADERS | Any fleet except Necrons or Tyranids may include a single Rogue Trader capital ship. | the sentence does not parse with the current patterns |
| ROGUE TRADERS | Tau, Demiurg and Imperial fleets may include one Rogue Trader cruiser for every 750 points or part thereof in their fleet. | tied to a points limit, but the target is a ship class and not a section |
| PLANETARY DEFENCES | It is also a good idea to put an upper limit on the amount of points that can be spent (for example, in a standard battle perhaps no more than 10% of  | the sentence does not parse with the current patterns |

### Imperial Navy — Bakka Sector (book page 48)

Enforced **17** (allowed_at 2, cap 1, conditional_cap 2, mandatory_at 1, per_points 2, ratio 2, requires 3, section_count 2, squadron 2). Left to check 6.

| type | enforced rule |
|---|---|
| `mandatory_at` | If the fleet is worth over 750 points an Admiral must be included to lead it. |
| `allowed_at` | An Imperial Bakka Battlefleet with 1,500 points or greater may be led by Lord Admiral Rath, who must always be placed on a battleship, though it not n |
| `section_count` | 0-1 Admiral |
| `ratio` | You may include up to one battleship in your fleet for every three cruisers or battlecruisers. |
| `requires` | An Emperor class battleship can only be taken as reserves unless Admiral Rath leads the fleet. |
| `ratio` | You may include up to one battlecruiser in your fleet for every two cruisers. |
| `section_count` | 0-12 Cruisers |
| `squadron` | You may include any number of escorts in your fleet in squadrons of 2–6 unless specified (see pg 13). |
| `allowed_at` | Any Imperial or Space Marine fleet 750 points or greater may be led by an Inquisitor Lord. |
| `per_points` | If an Inquisitor Lord is leading the fleet, up to one Grey Knights Strike Cruiser may be taken for every 500 points in the fleet. |
| `cap` | Any Imperial or Space Marine fleet 750 points or greater may be led by an Inquisitor Lord. |
| `requires` | The listed cost is added to that of the Inquisitor Lord, and its benefits apply to the ship they are embarked upon. |
| `requires` | An Imperial Navy or Adeptus Mechanicus fleet led by an Inquisitor that does not include Space Marine vessels may has the following addition to its res |
| `conditional_cap` | An Imperial Navy or Adeptus Mechanicus fleet led by an Inquisitor that does not include Space Marine vessels may has the following addition to its res |
| `conditional_cap` | These vessels are free of the “Strange Happenings” special rule as long as the Inquisitor’s ship remains in play, but the fleet may not take any Grey  |
| `per_points` | One Rogue Trader cruiser and its attendant escorts may be taken for every 750 points in the fleet. |
| `squadron` | Orbital defences or ships that count as defences may be placed in squadrons, with 1HP defences grouped in up to six units and larger defences grouped  |

| section | sentence not enforced | reason |
|---|---|---|
| Admiral | You may include 1 Admiral in your fleet, who must be assigned to a ship and improves its Leadership to the value shown. | the number of commanders; already enforced as a section limit (0-1) |
| RESERVES | One Rogue Trader cruiser and its attendant escorts may be taken for every 750 points in the fleet. | tied to a points limit, but the target is a ship class and not a section |
| THE INQUISITION | Any Imperial or Space Marine fleet may include a single Inquisitorial Cruiser in the fleet, which takes the place of a battlecruiser or strike cruiser | the sentence does not parse with the current patterns |
| THE INQUISITION | A fleet may include a single Blackship, which as a special vessel does not count toward or against other ship limits in the fleet. | the sentence does not parse with the current patterns |
| ROGUE TRADERS | One Rogue Trader cruiser and its attendant escorts may be taken for every 750 points in the fleet. | tied to a points limit, but the target is a ship class and not a section |
| PLANETARY DEFENCES | It is also a good idea to put an upper limit on the amount of points that can be spent (for example, in a standard battle perhaps no more than 10% of  | the sentence does not parse with the current patterns |

### Space Marines — Codex Astartes (book page 97)

Enforced **11** (allowed_at 1, cap 1, mandatory_at 1, per_points 3, section_count 3, squadron 2). Left to check 6.

| type | enforced rule |
|---|---|
| `mandatory_at` | If the fleet is worth over 750 points, the Master of the Fleet must be included to lead it. |
| `section_count` | 0-1 Master of the Fleet |
| `per_points` | You may include one Space Marine battle barge for every 1,000 points or part thereof in your fleet. |
| `section_count` | 0-3 Battle Barges |
| `section_count` | 0-10 Cruisers Rogue Trader cruisers always count against cruiser restrictions in any fleet list that has such restrictions. |
| `squadron` | You may include any number of escorts in your fleet in squadrons of 2–6 unless specified (see pg 13). |
| `allowed_at` | Any Imperial or Space Marine fleet 750 points or greater may be led by an Inquisitor Lord. |
| `per_points` | If an Inquisitor Lord is leading the fleet, up to one Grey Knights Strike Cruiser may be taken for every 500 points in the fleet. |
| `cap` | Any Imperial or Space Marine fleet 750 points or greater may be led by an Inquisitor Lord. |
| `per_points` | Tau, Demiurg and Imperial fleets may include one Rogue Trader cruiser for every 750 points or part thereof in their fleet. |
| `squadron` | Orbital defences or ships that count as defences may be placed in squadrons, with 1HP defences grouped in up to six units and larger defences grouped  |

| section | sentence not enforced | reason |
|---|---|---|
| Master of the Fleet | You may include 1 Master of the Fleet. | the number of commanders; already enforced as a section limit (0-1) |
| THE INQUISITION | Any Imperial or Space Marine fleet may include a single Inquisitorial Cruiser in the fleet, which takes the place of a battlecruiser or strike cruiser | the sentence does not parse with the current patterns |
| THE INQUISITION | A fleet may include a single Blackship, which as a special vessel does not count toward or against other ship limits in the fleet. | the sentence does not parse with the current patterns |
| ROGUE TRADERS | Any fleet except Necrons or Tyranids may include a single Rogue Trader capital ship. | the sentence does not parse with the current patterns |
| ROGUE TRADERS | Tau, Demiurg and Imperial fleets may include one Rogue Trader cruiser for every 750 points or part thereof in their fleet. | tied to a points limit, but the target is a ship class and not a section |
| PLANETARY DEFENCES | It is also a good idea to put an upper limit on the amount of points that can be spent (for example, in a standard battle perhaps no more than 10% of  | the sentence does not parse with the current patterns |

### Space Marines — Crusade (book page 98)

Enforced **13** (allowed_at 3, cap 1, mandatory_at 1, per_points 2, section_count 4, squadron 2). Left to check 4.

| type | enforced rule |
|---|---|
| `mandatory_at` | If the fleet is worth over 750 points, the Master of the Fleet must be included to lead it. |
| `section_count` | 0-1 Master of the Fleet |
| `allowed_at` | If your fleet is worth at least 2,000 points, it may include one Fortress-Monastery. |
| `section_count` | 0-1 Fortress-Monastery |
| `allowed_at` | The fleet must be worth at least 1,000 points to include a single Venerable battle barge (counting as one of the three allowed), chosen from any avail |
| `per_points` | You may include one Space Marine battle barge for every 1,000 points or part thereof in your fleet. |
| `section_count` | 0-3 Battle Barges |
| `section_count` | 0-10 Cruisers |
| `squadron` | You may include any number of escorts in your fleet in squadrons of 2–6 unless specified (see pg 13). |
| `allowed_at` | Any Imperial or Space Marine fleet 750 points or greater may be led by an Inquisitor Lord. |
| `per_points` | If an Inquisitor Lord is leading the fleet, up to one Grey Knights Strike Cruiser may be taken for every 500 points in the fleet. |
| `cap` | Any Imperial or Space Marine fleet 750 points or greater may be led by an Inquisitor Lord. |
| `squadron` | Orbital defences or ships that count as defences may be placed in squadrons, with 1HP defences grouped in up to six units and larger defences grouped  |

| section | sentence not enforced | reason |
|---|---|---|
| Master of the Fleet | You may include 1 Master of the Fleet. | the number of commanders; already enforced as a section limit (0-1) |
| THE INQUISITION | Any Imperial or Space Marine fleet may include a single Inquisitorial Cruiser in the fleet, which takes the place of a battlecruiser or strike cruiser | the sentence does not parse with the current patterns |
| THE INQUISITION | A fleet may include a single Blackship, which as a special vessel does not count toward or against other ship limits in the fleet. | the sentence does not parse with the current patterns |
| PLANETARY DEFENCES | It is also a good idea to put an upper limit on the amount of points that can be spent (for example, in a standard battle perhaps no more than 10% of  | the sentence does not parse with the current patterns |

### Space Marines — Dominion (book page 100)

Enforced **13** (allowed_at 2, cap 1, conditional_cap 1, mandatory_at 1, per_points 3, ratio 1, section_count 2, squadron 2). Left to check 7.

| type | enforced rule |
|---|---|
| `mandatory_at` | If the fleet is worth over 750 points, a Master of the Fleet must be included to lead it. |
| `section_count` | 0-1 Master of the Fleet |
| `ratio` | Any Imperial Navy battleship, grand cruiser or battlecruiser may have a Space Marine Captain assigned to it. |
| `allowed_at` | The fleet must be worth at least 1,000 points to include a single Venerable battle barge (counting as one of the three allowed), chosen from any avail |
| `per_points` | You may include one Space Marine battle barge for every 1,000 points or part thereof in your fleet. |
| `section_count` | 0-3 Battle Barges |
| `conditional_cap` | 0-10 Cruisers When reserves are taken in this manner, the fleet can have up to twelve cruisers. |
| `squadron` | You may include any number of escorts in your fleet in squadrons of 2–6 unless specified (see pg 13). |
| `allowed_at` | Any Imperial or Space Marine fleet 750 points or greater may be led by an Inquisitor Lord. |
| `per_points` | If an Inquisitor Lord is leading the fleet, up to one Grey Knights Strike Cruiser may be taken for every 500 points in the fleet. |
| `cap` | Any Imperial or Space Marine fleet 750 points or greater may be led by an Inquisitor Lord. |
| `per_points` | Tau, Demiurg and Imperial fleets may include one Rogue Trader cruiser for every 750 points or part thereof in their fleet. |
| `squadron` | Orbital defences or ships that count as defences may be placed in squadrons, with 1HP defences grouped in up to six units and larger defences grouped  |

| section | sentence not enforced | reason |
|---|---|---|
| Master of the Fleet | You may include 1 Master of the Fleet. | the number of commanders; already enforced as a section limit (0-1) |
| Choosing a Battle Barge | In addition to their fleet list, any Space Marine fleet may include a single – meaning only one! | the sentence does not parse with the current patterns |
| THE INQUISITION | Any Imperial or Space Marine fleet may include a single Inquisitorial Cruiser in the fleet, which takes the place of a battlecruiser or strike cruiser | the sentence does not parse with the current patterns |
| THE INQUISITION | A fleet may include a single Blackship, which as a special vessel does not count toward or against other ship limits in the fleet. | the sentence does not parse with the current patterns |
| ROGUE TRADERS | Any fleet except Necrons or Tyranids may include a single Rogue Trader capital ship. | the sentence does not parse with the current patterns |
| ROGUE TRADERS | Tau, Demiurg and Imperial fleets may include one Rogue Trader cruiser for every 750 points or part thereof in their fleet. | tied to a points limit, but the target is a ship class and not a section |
| PLANETARY DEFENCES | It is also a good idea to put an upper limit on the amount of points that can be spent (for example, in a standard battle perhaps no more than 10% of  | the sentence does not parse with the current patterns |

### Adeptus Mechanicus — Explorator (book page 124)

Enforced **13** (allowed_at 1, cap 1, conditional_cap 2, mandatory_at 1, per_points 2, ratio 1, requires 2, section_count 1, squadron 2). Left to check 11.

| type | enforced rule |
|---|---|
| `mandatory_at` | If the fleet is worth 1,000 points or more, a Mechanicus Archmagos must be included to lead it. |
| `section_count` | 0-1 Mechanicus Archmagos |
| `ratio` | You may include 1 battleship for every three cruisers in the fleet. |
| `squadron` | You may include any number of escorts in your fleet in squadrons of 2–6 unless specified (see pg 13), taken from both the Imperial Navy and Space Mari |
| `allowed_at` | Any Imperial or Space Marine fleet 750 points or greater may be led by an Inquisitor Lord. |
| `per_points` | If an Inquisitor Lord is leading the fleet, up to one Grey Knights Strike Cruiser may be taken for every 500 points in the fleet. |
| `cap` | Any Imperial or Space Marine fleet 750 points or greater may be led by an Inquisitor Lord. |
| `requires` | The listed cost is added to that of the Inquisitor Lord, and its benefits apply to the ship they are embarked upon. |
| `requires` | An Imperial Navy or Adeptus Mechanicus fleet led by an Inquisitor that does not include Space Marine vessels may has the following addition to its res |
| `conditional_cap` | An Imperial Navy or Adeptus Mechanicus fleet led by an Inquisitor that does not include Space Marine vessels may has the following addition to its res |
| `conditional_cap` | These vessels are free of the “Strange Happenings” special rule as long as the Inquisitor’s ship remains in play, but the fleet may not take any Grey  |
| `per_points` | Tau, Demiurg and Imperial fleets may include one Rogue Trader cruiser for every 750 points or part thereof in their fleet. |
| `squadron` | Orbital defences or ships that count as defences may be placed in squadrons, with 1HP defences grouped in up to six units and larger defences grouped  |

| section | sentence not enforced | reason |
|---|---|---|
| FLEET RULES (pg. 118–123 | No more than one reserve vessel can be taken for every three capital ships in the fleet. | a ratio to a ship class, not to a section |
| FLEET RULES (pg. 118–123 | For every three cruisers, one reserve cruiser-class, battlecruiser or grand cruiser may be taken. | the sentence does not parse with the current patterns |
| FLEET RULES (pg. 118–123 | For every three battleships, one battleship- class vessel may be taken. | the sentence does not parse with the current patterns |
| FLEET RULES (pg. 118–123 | They can be taken in the ratio of one strike cruiser for every three Mechanicus capital ships, and one battle barge for every three strike cruisers. | the sentence does not parse with the current patterns |
| FLEET RULES (pg. 118–123 | When calculating repair points at the end of a battle, the Adeptus Mechanicus fleet will always have +1 Repair point for every 10 renown or portion th | the sentence does not parse with the current patterns |
| Mechanicus Archmagos | You may include 1 Mechanicus Archmagos in your fleet, which must be assigned to a capital ship and replaces its Leadership with the value shown. | the number of commanders; already enforced as a section limit (0-1) |
| THE INQUISITION | Any Imperial or Space Marine fleet may include a single Inquisitorial Cruiser in the fleet, which takes the place of a battlecruiser or strike cruiser | the sentence does not parse with the current patterns |
| THE INQUISITION | A fleet may include a single Blackship, which as a special vessel does not count toward or against other ship limits in the fleet. | the sentence does not parse with the current patterns |
| ROGUE TRADERS | Any fleet except Necrons or Tyranids may include a single Rogue Trader capital ship. | the sentence does not parse with the current patterns |
| ROGUE TRADERS | Tau, Demiurg and Imperial fleets may include one Rogue Trader cruiser for every 750 points or part thereof in their fleet. | tied to a points limit, but the target is a ship class and not a section |
| PLANETARY DEFENCES | It is also a good idea to put an upper limit on the amount of points that can be spent (for example, in a standard battle perhaps no more than 10% of  | the sentence does not parse with the current patterns |

### The Emperor's Inquisition (book page 138)

Enforced **10** (allowed_at 1, cap 1, option_ratio 1, per_points 3, requires 2, section_count 1, squadron 1). Left to check 7.

| type | enforced rule |
|---|---|
| `allowed_at` | Any Imperial or Space Marine fleet 750 points or greater may be led by an Inquisitor Lord. |
| `section_count` | 0-1 Inquisitor Lord |
| `per_points` | If an Inquisitor Lord is leading the fleet, up to one Grey Knights Strike Cruiser may be taken for every 500 points in the fleet. |
| `option_ratio` | Up to half of the Grey Knights strike cruisers in a fleet may replace their launch bays with one of the refits listed below, in any mix desired. |
| `requires` | A Space Marine fleet led by an Ordo Malleus Inquisitor including at least 1000 points of Inquisition vessels and Grey Knights strike cruisers may incl |
| `per_points` | A Space Marine fleet led by an Ordo Malleus Inquisitor including at least 1000 points of Inquisition vessels and Grey Knights strike cruisers may incl |
| `requires` | The listed cost is added to that of the Inquisitor Lord, and its benefits apply to the ship they are embarked upon. |
| `cap` | If desired, vessels with an embarking Inquisitor may gain special characteristics, depending upon the Ordo the Inquisitor leading the fleet is affilia |
| `per_points` | Tau, Demiurg and Imperial fleets may include one Rogue Trader cruiser for every 750 points or part thereof in their fleet. |
| `squadron` | Orbital defences or ships that count as defences may be placed in squadrons, with 1HP defences grouped in up to six units and larger defences grouped  |

| section | sentence not enforced | reason |
|---|---|---|
| Accompanying a fleet | This may include the specific ship so-called in the Inquisition rules, but it can be any Imperial cruiser-class vessel. | the sentence does not parse with the current patterns |
| CAPITAL SHIPS | Any Imperial or Space Marine fleet may include a single Inquisitorial Cruiser in the fleet, which takes the place of a battlecruiser or strike cruiser | the sentence does not parse with the current patterns |
| CAPITAL SHIPS | A fleet may include a single Blackship, which as a special vessel does not count toward or against other ship limits in the fleet. | the sentence does not parse with the current patterns |
| CAPITAL SHIPS | A Space Marine fleet led by an Ordo Malleus Inquisitor including at least 1000 points of Inquisition vessels and Grey Knights strike cruisers may incl | the sentence does not parse with the current patterns |
| ROGUE TRADERS | Any fleet except Necrons or Tyranids may include a single Rogue Trader capital ship. | the sentence does not parse with the current patterns |
| ROGUE TRADERS | Tau, Demiurg and Imperial fleets may include one Rogue Trader cruiser for every 750 points or part thereof in their fleet. | tied to a points limit, but the target is a ship class and not a section |
| PLANETARY DEFENCES | It is also a good idea to put an upper limit on the amount of points that can be spent (for example, in a standard battle perhaps no more than 10% of  | the sentence does not parse with the current patterns |

### Grey Knights (book page 144)

Enforced **7** (allowed_at 1, mandatory_at 1, option_ratio 1, per_points 1, section_count 1, squadron 2). Left to check 4.

| type | enforced rule |
|---|---|
| `mandatory_at` | If the fleet is above 750 points an Inquisitor Lord must lead the fleet. |
| `section_count` | If the fleet is above 750 points an Inquisitor Lord must lead the fleet. If an Inquisitorial Cruiser is present the Inquisitor Lord must be placed abo |
| `allowed_at` | You may include a single Grey Knights Battle barge if the remainder of the fleet is at least worth 1000 points. Furthermore an Ordo Malleus Inquisitor |
| `per_points` | One Grey Knights Strike Cruiser may be taken per 500 points (e.g. one from 0-500 points, two from 501-1000 points, etc.). |
| `option_ratio` | Up to half of the Grey Knights strike cruisers in a fleet may replace their launch bays with one of the refits listed below, in any mix desired. |
| `squadron` | You may include any number of escorts in your fleet in squadrons of 2–6 unless specified (see pg 13). |
| `squadron` | Orbital defences or ships that count as defences may be placed in squadrons, with 1HP defences grouped in up to six units and larger defences grouped  |

| section | sentence not enforced | reason |
|---|---|---|
| CAPITAL SHIPS | You may include a single Grey Knights Battle barge if the remainder of the fleet is at least worth 1000 points. | the sentence does not parse with the current patterns |
| CAPITAL SHIPS | A Grey Knights fleet may include a single Inquisitorial Cruiser in the fleet. | the sentence does not parse with the current patterns |
| CAPITAL SHIPS | A Grey Knights fleet may include a single Blackship, which as a special vessel does not count toward or against other ship limits in the fleet. | the sentence does not parse with the current patterns |
| PLANETARY DEFENCES | It is also a good idea to put an upper limit on the amount of points that can be spent (for example, in a standard battle perhaps no more than 10% of  | the sentence does not parse with the current patterns |

### Rogue Traders (book page 174)

Enforced **10** (agreement 1, per_points 2, ratio 2, requires 2, section_count 1, squadron 2). Left to check 5.

| type | enforced rule |
|---|---|
| `requires` | If a fleet has more than one Rogue Trader cruiser or also includes more than one squadron of transports, a Veteran Rogue Trader must be assigned to a  |
| `requires` | If a fleet has more than one Rogue Trader cruiser or also includes more than one squadron of transports, a Veteran Rogue Trader must be assigned to a  |
| `ratio` | A Veteran Rogue Trader may lead each Rogue Trader cruiser in a fleet. |
| `section_count` | 0-2 Veteran Rogue Traders |
| `per_points` | Any fleet except Necrons or Tyranids may include a single Rogue Trader capital ship. Tau, Demiurg and Imperial fleets may include one Rogue Trader cru |
| `squadron` | A single squadron of 2-6 Rogue Trader escorts and auxiliary vessels may accompany each Rogue Trader capital ship in a fleet, in any mix desired. |
| `ratio` | A single squadron of 2-6 Rogue Trader escorts and auxiliary vessels may accompany each Rogue Trader capital ship in a fleet, in any mix desired. |
| `agreement` | Siluria Class Light Cruisers and Havoc Class Frigates are older, outdated ships, and much more commonly seen outside of the Imperial Navy. If both pla |
| `per_points` | For every 750 points in the fleet, Rogue Traders may be accompanied by a single Demiurg or Kroot vessel unless the fleet is using auxiliary ships that |
| `squadron` | Orbital defences or ships that count as defences may be placed in squadrons, with 1HP defences grouped in up to six units and larger defences grouped  |

| section | sentence not enforced | reason |
|---|---|---|
| CAPITAL SHIPS | Any fleet except Necrons or Tyranids may include a single Rogue Trader capital ship. | the sentence does not parse with the current patterns |
| CAPITAL SHIPS | Tau, Demiurg and Imperial fleets may include one Rogue Trader cruiser for every 750 points or part thereof in their fleet. | tied to a points limit, but the target is a ship class and not a section |
| XENOS ALLIES | For every 750 points in the fleet, Rogue Traders may be accompanied by a single Demiurg or Kroot vessel unless the fleet is using auxiliary ships that | tied to a points limit, but the target is a ship class and not a section |
| SUB-PLOTS | Any game that includes a Rogue Trader cruiser must include a sub- plot from [???] p.82-84 in the Rulebook. | the sentence does not parse with the current patterns |
| PLANETARY DEFENCES | It is also a good idea to put an upper limit on the amount of points that can be spent (for example, in a standard battle perhaps no more than 10% of  | the sentence does not parse with the current patterns |

### Rogue Traders — Exploration (book page 176)

Enforced **15** (agreement 1, cap 1, compare 1, conditional_cap 3, mandatory_at 2, one_donor 1, points_share 1, ratio 2, squadron 3). Left to check 8.

| type | enforced rule |
|---|---|
| `ratio` | A Veteran Rogue Trader may be present for every two Rogue Trader cruisers in a fleet. At least one Veteran Rogue Trader must be assigned to a Rogue Tr |
| `mandatory_at` | A Veteran Rogue Trader may be present for every two Rogue Trader cruisers in a fleet. At least one Veteran Rogue Trader must be assigned to a Rogue Tr |
| `cap` | Your fleet may include no more than twelve capital s hips, at least half of which must be Rogue Trader Cruisers and/or Endeavour light cruisers, follo |
| `compare` | Your fleet may include no more than twelve capital s hips, at least half of which must be Rogue Trader Cruisers and/or Endeavour light cruisers, follo |
| `agreement` | Siluria Class Light Cruisers and Havoc Class Frigates are older, outdated ships, and much more commonly seen outside of the Imperial Navy. If both pla |
| `squadron` | A single squadron of 2-6 Rogue Trader escorts, Rogue Trader cargo ships and auxiliary vessels may accompany each Rogue Trader cruiser in a fleet, in a |
| `mandatory_at` | The fleet must include at least one squadron of escort-sized cargo ships of any type (whether or not the scenario requires transports), in a squadron  |
| `points_share` | No more than 1/3 of the fleet’s total transport value can be made up of heavy transports. |
| `squadron` | The fleet must include at least one squadron of escort-sized cargo ships of any type (whether or not the scenario requires transports), in a squadron  |
| `one_donor` | Capital ships taken count against the cruiser limit, they can only be from one fleet and cannot be from a fleet list differing from that used to provi |
| `ratio` | At least one Demiurg vessel of any class may be taken for every three Rogue Trader cruisers in the fleet. |
| `conditional_cap` | Demiurg vessels may not be employed if Space Marines are taken as reserves, allies or escort squadron auxiliary vessels. |
| `conditional_cap` | A single Kroot Warsphere may be taken if there are at least three Rogue Trader cruisers in the fleet. |
| `conditional_cap` | A Kroot Warsphere may not be employed if Space Marines are taken as reserves, allies or escort squadron auxiliary vessels. |
| `squadron` | Orbital defences or ships that count as defences may be placed in squadrons, with 1HP defences grouped in up to six units and larger defences grouped  |

| section | sentence not enforced | reason |
|---|---|---|
| Sub-plots | Any game using the Rogue Trader fleet list must include a sub-plot from [???]-[???] of the Remastered Rulebook. | the sentence does not parse with the current patterns |
| Veteran Rogue Traders | A Veteran Rogue Trader may be present for every two Rogue Trader cruisers in a fleet. | the sentence does not parse with the current patterns |
| CAPITAL SHIPS | Your fleet may include no more than twelve capital s hips, at least half of which must be Rogue Trader Cruisers and/or Endeavour light cruisers, follo | the sentence does not parse with the current patterns |
| TRANSPORTS | No more than 1/3 of the fleet’s total transport value can be made up of heavy transports. | the sentence does not parse with the current patterns |
| RESERVES AND ALLIES | Up to one cruiser from any fleet except Orks, Necrons and Tyranids can be taken for every three Rogue Trader cruisers in the fleet. | the sentence does not parse with the current patterns |
| The Demiurg | At least one Demiurg vessel of any class may be taken for every three Rogue Trader cruisers in the fleet. | the sentence does not parse with the current patterns |
| The Demiurg | This is separate from and in addition to any reserve or allied cruisers taken, but each Demiurg vessel taken still counts against the twelve-cruiser l | the sentence does not parse with the current patterns |
| PLANETARY DEFENCES | It is also a good idea to put an upper limit on the amount of points that can be spent (for example, in a standard battle perhaps no more than 10% of  | the sentence does not parse with the current patterns |

### Rogue Traders — Pirates and Wolf Packs (book page 178)

Enforced **10** (agreement 1, compare 1, mandatory_at 1, min_ratio 1, per_points 2, points_share 1, section_count 1, squadron 2). Left to check 2.

| type | enforced rule |
|---|---|
| `mandatory_at` | If a pirate fleet has more than 750 points of ships, a Pirate Captain must lead it. |
| `per_points` | A Pirate Captain may be embarked on a cruiser for every 500 points or portion thereof in a fleet. |
| `section_count` | 0-3 Pirate Captains |
| `per_points` | A human pirate fleet may have up to one cruiser for every 500 points of ships in the fleet or portion thereof. |
| `squadron` | At least one squadron of 3–6 escort vessels must be included for each cruiser in the fleet, organized in any mix desired. This rule exempts escorts th |
| `min_ratio` | At least one squadron of 3–6 escort vessels must be included for each cruiser in the fleet, organized in any mix desired. |
| `compare` | The number of escort vessels that utilize ordnance or lance weaponry may not outnumber those that rely solely on weapon batteries. Xenos vessels of al |
| `points_share` | Up to 10% of a pirate fleet may be made up of alien escorts from any race except Tyranids, Necrons or vessels that require support from a capital ship |
| `agreement` | Siluria Class Light Cruisers and Havoc Class Frigates are older, outdated ships, and much more commonly seen outside of the Imperial Navy. If both pla |
| `squadron` | Orbital defences or ships that count as defences may be placed in squadrons, with 1HP defences grouped in up to six units and larger defences grouped  |

| section | sentence not enforced | reason |
|---|---|---|
| CAPITAL SHIPS | A human pirate fleet may have up to one cruiser for every 500 points of ships in the fleet or portion thereof. | tied to a points limit, but the target is a ship class and not a section |
| PLANETARY DEFENCES | It is also a good idea to put an upper limit on the amount of points that can be spent (for example, in a standard battle perhaps no more than 10% of  | the sentence does not parse with the current patterns |

### Chaos — Incursion (book page 232)

Enforced **15** (cap 1, conditional_cap 2, mandatory_at 1, per_points 3, ratio 3, section_count 3, squadron 2). Left to check 6.

| type | enforced rule |
|---|---|
| `mandatory_at` | You must include a Chaos Warmaster in your fleet, even if it is worth 750 points or less. |
| `section_count` | You may include up to three Chaos Lords in your fleet. |
| `conditional_cap` | It may not be taken in a fleet that has the Planet Killer, an Activated Blackstone Fortress or ships that must be used as flagships such as the Termin |
| `conditional_cap` | A Chaos fleet including a Space Hulk may have no more than two other battleships. |
| `section_count` | You may include up to one Space Hulk in the fleet. |
| `ratio` | You may include up to one battleship in your fleet for every three cruisers or heavy cruisers. |
| `ratio` | You may include up to one grand cruiser in your fleet for every three cruisers or heavy cruisers. |
| `ratio` | You may include up to one heavy cruiser in your fleet for every two cruisers. |
| `section_count` | 0-12 Cruisers Rogue Trader cruisers always count against cruiser restrictions in any fleet list that has such restrictions. |
| `squadron` | You may include any number of escorts in your fleet in squadrons of 2–6 unless specified (see pg 13). |
| `per_points` | Only one Activated Blackstone Fortress may be fielded for every FULL 750 points of other ships in a Chaos fleet. No more than three may be taken. |
| `per_points` | For every 1,500 points in a Chaos fleet, one cruiser from any Imperial Navy fleet list up to 185 points and/or up to six Imperial Navy escorts may be  |
| `per_points` | For every 1,500 points in a Chaos fleet, one cruiser from any Imperial Navy fleet list up to 185 points and/or up to six Imperial Navy escorts may be  |
| `cap` | Any fleet except Necrons or Tyranids may include a single Rogue Trader capital ship. |
| `squadron` | Orbital defences or ships that count as defences may be placed in squadrons, with 1HP defences grouped in up to six units and larger defences grouped  |

| section | sentence not enforced | reason |
|---|---|---|
| Chaos Lords | A Chaos Lord may be given up to one of the following Marks of Chaos. | the sentence does not parse with the current patterns |
| ACTIVATED BLACKSTONE FOR | Only one Activated Blackstone Fortress may be fielded for every FULL 750 points of other ships in a Chaos fleet. No more than three may be taken. | the sentence does not parse with the current patterns |
| RENEGADE IMPERIAL VESSEL | For every 1,500 points in a Chaos fleet, one cruiser from any Imperial Navy fleet list up to 185 points and/or up to six Imperial Navy escorts may be  | tied to a points limit, but the target is a ship class and not a section |
| ROGUE TRADERS | Any fleet except Necrons or Tyranids may include a single Rogue Trader capital ship. | the sentence does not parse with the current patterns |
| ROGUE TRADERS | Tau, Demiurg and Imperial fleets may include one Rogue Trader cruiser for every 750 points or part thereof in their fleet. | tied to a points limit, but the target is a ship class and not a section |
| PLANETARY DEFENCES | It is also a good idea to put an upper limit on the amount of points that can be spent (for example, in a standard battle perhaps no more than 10% of  | the sentence does not parse with the current patterns |

### Chaos — Black Crusade (book page 234)

Enforced **20** (allowed_at 2, cap 2, conditional_cap 2, mandatory_at 1, per_points 3, ratio 3, requires 1, section_count 4, squadron 2). Left to check 7.

| type | enforced rule |
|---|---|
| `mandatory_at` | A Chaos Warmaster (and their required capital ship) must be taken in fleets of 750 points or more. |
| `section_count` | 0-1 Chaos Warmaster |
| `requires` | You can only include a Chaos Warmaster in your fleet if it includes any capital ships. |
| `allowed_at` | Abaddon can be chosen to act as fleet commander in any game in which the Chaos fleet is worth 1,000 points or more. |
| `cap` | You may include Abaddon the Despoiler as the Warmaster in any Chaos Fleet worth more than 1,000 points. |
| `allowed_at` | A fleet of 1,000 points or more may include the Planet Killer. |
| `section_count` | 0-1 Planet Killer |
| `conditional_cap` | It may not be taken in a fleet that has the Planet Killer, an Activated Blackstone Fortress or ships that must be used as flagships such as the Termin |
| `conditional_cap` | A Chaos fleet including a Space Hulk may have no more than two other battleships. |
| `section_count` | You may include up to one Space Hulk in the fleet. |
| `ratio` | You may include up to one battleship in your fleet for every three cruisers or heavy cruisers. |
| `ratio` | You may include up to one grand cruiser in your fleet for every three cruisers or heavy cruisers. |
| `ratio` | You may include up to one heavy cruiser in your fleet for every two cruisers. |
| `section_count` | 0-12 Cruisers Rogue Trader cruisers always count against cruiser restrictions in any fleet list that has such restrictions. |
| `squadron` | You may include any number of escorts in your fleet in squadrons of 2–6 unless specified (see pg 13). |
| `per_points` | Only one Activated Blackstone Fortress may be fielded for every FULL 750 points of other ships in a Chaos fleet. No more than three may be taken. |
| `per_points` | For every 1,500 points in a Chaos fleet, one cruiser from any Imperial Navy fleet list up to 185 points and/or up to six Imperial Navy escorts may be  |
| `per_points` | For every 1,500 points in a Chaos fleet, one cruiser from any Imperial Navy fleet list up to 185 points and/or up to six Imperial Navy escorts may be  |
| `cap` | Any fleet except Necrons or Tyranids may include a single Rogue Trader capital ship. |
| `squadron` | Orbital defences or ships that count as defences may be placed in squadrons, with 1HP defences grouped in up to six units and larger defences grouped  |

| section | sentence not enforced | reason |
|---|---|---|
| Abaddon | You may include Abaddon the Despoiler as the Warmaster in any Chaos Fleet worth more than 1,000 points. | the sentence does not parse with the current patterns |
| CHAOS SPACE MARINE CREWS | For +10 points, battleships and grand cruisers with Chaos Space Marine Warmasters, Lords or crews may include Chosen Terminators. | an equipment or Mark choice, not fleet composition |
| ACTIVATED BLACKSTONE FOR | Only one Activated Blackstone Fortress may be fielded for every FULL 750 points of other ships in a Chaos fleet. No more than three may be taken. | the sentence does not parse with the current patterns |
| RENEGADE IMPERIAL VESSEL | For every 1,500 points in a Chaos fleet, one cruiser from any Imperial Navy fleet list up to 185 points and/or up to six Imperial Navy escorts may be  | tied to a points limit, but the target is a ship class and not a section |
| ROGUE TRADERS | Any fleet except Necrons or Tyranids may include a single Rogue Trader capital ship. | the sentence does not parse with the current patterns |
| ROGUE TRADERS | Tau, Demiurg and Imperial fleets may include one Rogue Trader cruiser for every 750 points or part thereof in their fleet. | tied to a points limit, but the target is a ship class and not a section |
| PLANETARY DEFENCES | It is also a good idea to put an upper limit on the amount of points that can be spent (for example, in a standard battle perhaps no more than 10% of  | the sentence does not parse with the current patterns |

### Chaos — Tzeentch (book page 236)

Enforced **22** (allowed_at 3, cap 2, conditional_cap 2, mandatory_at 1, per_points 3, ratio 3, requires 1, section_count 4, squadron 2, up_budget 1). Left to check 8.

| type | enforced rule |
|---|---|
| `mandatory_at` | A Chaos Warmaster (and their required capital ship) must be taken in fleets of 750 points or more. |
| `section_count` | 0-1 Chaos Warmaster of Tzeentch |
| `requires` | You can only include a Chaos Warmaster in your fleet if it includes any capital ships. |
| `up_budget` | Any ship led by a Lord of Tzeentch (and not the Warmaster!) may be granted a Strand of Fortune. |
| `allowed_at` | A fleet of 1,000 points or more may include the Planet Killer. |
| `section_count` | 0-1 Planet Killer |
| `conditional_cap` | It may not be taken in a fleet that has the Planet Killer, an Activated Blackstone Fortress or ships that must be used as flagships such as the Termin |
| `conditional_cap` | A Chaos fleet including a Space Hulk may have no more than two other battleships. |
| `section_count` | You may include up to one Space Hulk in the fleet. |
| `ratio` | You may include up to one battleship in your fleet for every three cruisers or heavy cruisers. |
| `allowed_at` | A fleet 1,000 points or more may include the Scion of Prospero as one of its battleships, subject to normal restrictions. |
| `ratio` | You may include up to one grand cruiser in your fleet for every three cruisers or heavy cruisers. |
| `ratio` | You may include up to one heavy cruiser in your fleet for every two cruisers. |
| `section_count` | 0-12 Cruisers Rogue Trader cruisers always count against cruiser restrictions in any fleet list that has such restrictions. |
| `squadron` | You may include any number of escorts in your fleet in squadrons of 2–6 unless specified (see pg 13). |
| `per_points` | Only one Activated Blackstone Fortress may be fielded for every FULL 750 points of other ships in a Chaos fleet. No more than three may be taken. |
| `per_points` | For every 1,500 points in a Chaos fleet, one cruiser from any Imperial Navy fleet list up to 185 points and/or up to six Imperial Navy escorts may be  |
| `per_points` | For every 1,500 points in a Chaos fleet, one cruiser from any Imperial Navy fleet list up to 185 points and/or up to six Imperial Navy escorts may be  |
| `cap` | Any fleet except Necrons or Tyranids may include a single Rogue Trader capital ship. |
| `allowed_at` | Abaddon can be chosen to act as fleet commander in any game in which the Chaos fleet is worth 1,000 points or more. |
| `cap` | Abaddon can be chosen to act as fleet commander in any game in which the Chaos fleet is worth 1,000 points or more. |
| `squadron` | Orbital defences or ships that count as defences may be placed in squadrons, with 1HP defences grouped in up to six units and larger defences grouped  |

| section | sentence not enforced | reason |
|---|---|---|
| CHAOS SPACE MARINE CREWS | For +10 points, battleships and grand cruisers with Chaos Space Marine Warmasters, Lords or crews may include Chosen Terminators. | an equipment or Mark choice, not fleet composition |
| FORCES OF CHAOS | Up to two capital ships (including the flagship), that have the Mark of Tzeentch, can have daemonic entities and warp beasts swirl about its hull, inc | an equipment or Mark choice, not fleet composition |
| DAEMONSHIPS | Daemonships in a Sorcerous Fleet may only take the Mark of Tzeentch, paid for separately. | an equipment or Mark choice, not fleet composition |
| ACTIVATED BLACKSTONE FOR | Only one Activated Blackstone Fortress may be fielded for every FULL 750 points of other ships in a Chaos fleet. No more than three may be taken. | the sentence does not parse with the current patterns |
| RENEGADE IMPERIAL VESSEL | For every 1,500 points in a Chaos fleet, one cruiser from any Imperial Navy fleet list up to 185 points and/or up to six Imperial Navy escorts may be  | tied to a points limit, but the target is a ship class and not a section |
| ROGUE TRADERS | Any fleet except Necrons or Tyranids may include a single Rogue Trader capital ship. | the sentence does not parse with the current patterns |
| ROGUE TRADERS | Tau, Demiurg and Imperial fleets may include one Rogue Trader cruiser for every 750 points or part thereof in their fleet. | tied to a points limit, but the target is a ship class and not a section |
| PLANETARY DEFENCES | It is also a good idea to put an upper limit on the amount of points that can be spent (for example, in a standard battle perhaps no more than 10% of  | the sentence does not parse with the current patterns |

### Chaos — Nurgle (book page 240)

Enforced **22** (allowed_at 3, cap 2, conditional_cap 2, mandatory_at 1, per_points 3, ratio 3, requires 1, section_count 4, squadron 2, upgrade_ratio 1). Left to check 7.

| type | enforced rule |
|---|---|
| `mandatory_at` | A Chaos Warmaster (and their required capital ship) must be taken in fleets of 750 points or more. |
| `section_count` | 0-1 Chaos Warmaster of Nurgle |
| `requires` | You can only include a Chaos Warmaster in your fleet if it includes any capital ships. |
| `allowed_at` | A fleet of 1,000 points or more may include the Planet Killer. |
| `section_count` | 0-1 Planet Killer |
| `conditional_cap` | It may not be taken in a fleet that has the Planet Killer, an Activated Blackstone Fortress or ships that must be used as flagships such as the Termin |
| `conditional_cap` | A Chaos fleet including a Space Hulk may have no more than two other battleships. |
| `section_count` | You may include up to one Space Hulk in the fleet. |
| `ratio` | You may include up to one battleship in your fleet for every three cruisers or heavy cruisers. |
| `allowed_at` | A fleet 1,000 points or more may include the Terminus Est as one of its battleships, subject to normal restrictions. |
| `ratio` | You may include up to one grand cruiser in your fleet for every three cruisers or heavy cruisers. |
| `ratio` | You may include up to one heavy cruiser in your fleet for every two cruisers. |
| `section_count` | 0-12 Cruisers Rogue Trader cruisers always count against cruiser restrictions in any fleet list that has such restrictions. |
| `upgrade_ratio` | Up to a third of the capital ships (not the Terminus Est or flagship) in a Plaguefleet may be upgraded to Daemonships at the additional points cost sh |
| `squadron` | You may include any number of escorts in your fleet in squadrons of 2–6 unless specified (see pg 13). |
| `per_points` | Only one Activated Blackstone Fortress may be fielded for every FULL 750 points of other ships in a Chaos fleet. No more than three may be taken. |
| `per_points` | For every 1,500 points in a Chaos fleet, one cruiser from any Imperial Navy fleet list up to 185 points and/or up to six Imperial Navy escorts may be  |
| `per_points` | For every 1,500 points in a Chaos fleet, one cruiser from any Imperial Navy fleet list up to 185 points and/or up to six Imperial Navy escorts may be  |
| `cap` | Any fleet except Necrons or Tyranids may include a single Rogue Trader capital ship. |
| `allowed_at` | Abaddon can be chosen to act as fleet commander in any game in which the Chaos fleet is worth 1,000 points or more. |
| `cap` | Abaddon can be chosen to act as fleet commander in any game in which the Chaos fleet is worth 1,000 points or more. |
| `squadron` | Orbital defences or ships that count as defences may be placed in squadrons, with 1HP defences grouped in up to six units and larger defences grouped  |

| section | sentence not enforced | reason |
|---|---|---|
| CHAOS SPACE MARINE CREWS | For +10 points, battleships and grand cruisers with Chaos Space Marine Warmasters, Lords or crews may include Chosen Terminators. | an equipment or Mark choice, not fleet composition |
| FORCES OF CHAOS | Up to three capital ships with the Mark of Nurgle (including the flagship) may also become Arks of Pestilence. | an equipment or Mark choice, not fleet composition |
| ACTIVATED BLACKSTONE FOR | Only one Activated Blackstone Fortress may be fielded for every FULL 750 points of other ships in a Chaos fleet. No more than three may be taken. | the sentence does not parse with the current patterns |
| RENEGADE IMPERIAL VESSEL | For every 1,500 points in a Chaos fleet, one cruiser from any Imperial Navy fleet list up to 185 points and/or up to six Imperial Navy escorts may be  | tied to a points limit, but the target is a ship class and not a section |
| ROGUE TRADERS | Any fleet except Necrons or Tyranids may include a single Rogue Trader capital ship. | the sentence does not parse with the current patterns |
| ROGUE TRADERS | Tau, Demiurg and Imperial fleets may include one Rogue Trader cruiser for every 750 points or part thereof in their fleet. | tied to a points limit, but the target is a ship class and not a section |
| PLANETARY DEFENCES | It is also a good idea to put an upper limit on the amount of points that can be spent (for example, in a standard battle perhaps no more than 10% of  | the sentence does not parse with the current patterns |

### Chaos — Khorne (book page 244)

Enforced **21** (allowed_at 3, cap 2, conditional_cap 1, mandatory_at 1, per_points 3, ratio 3, requires 1, section_count 4, squadron 2, upgrade_ratio 1). Left to check 6.

| type | enforced rule |
|---|---|
| `mandatory_at` | A Chaos Warmaster (and their required capital ship) must be taken in fleets of 750 points or more. |
| `section_count` | 0-1 Chaos Warmaster of Khorne |
| `requires` | You can only include a Chaos Warmaster in your fleet if it includes any capital ships. |
| `allowed_at` | A fleet of 1,000 points or more may include the Planet Killer. |
| `section_count` | 0-1 Planet Killer |
| `conditional_cap` | It may not be taken in a fleet that has the Planet Killer, an Activated Blackstone Fortress or ships that must be used as flagships such as the Termin |
| `section_count` | You may include up to one Space Hulk in the fleet, which must be the flagship if chosen. |
| `ratio` | You may include up to one battleship in your fleet for every three cruisers or heavy cruisers. |
| `allowed_at` | A fleet 1,000 points or more may include the Slaverer as one of its battleships, subject to normal restrictions. |
| `ratio` | You may include up to one grand cruiser in your fleet for every three cruisers or heavy cruisers. |
| `ratio` | You may include up to one heavy cruiser in your fleet for every two cruisers. |
| `section_count` | 0-12 Cruisers Rogue Trader cruisers always count against cruiser restrictions in any fleet list that has such restrictions. |
| `upgrade_ratio` | Up to a quarter of the capital ships (not battleships or the flagship) in a Berzerker Fleet may be upgraded to Daemonships at the additional points co |
| `squadron` | You may include any number of escorts in your fleet in squadrons of 2–6 unless specified (see pg 13). |
| `per_points` | Only one Activated Blackstone Fortress may be fielded for every FULL 750 points of other ships in a Chaos fleet. No more than three may be taken. |
| `per_points` | For every 1,500 points in a Chaos fleet, one cruiser from any Imperial Navy fleet list up to 185 points and/or up to six Imperial Navy escorts may be  |
| `per_points` | For every 1,500 points in a Chaos fleet, one cruiser from any Imperial Navy fleet list up to 185 points and/or up to six Imperial Navy escorts may be  |
| `cap` | Any fleet except Necrons or Tyranids may include a single Rogue Trader capital ship. |
| `allowed_at` | Abaddon can be chosen to act as fleet commander in any game in which the Chaos fleet is worth 1,000 points or more. |
| `cap` | Abaddon can be chosen to act as fleet commander in any game in which the Chaos fleet is worth 1,000 points or more. |
| `squadron` | Orbital defences or ships that count as defences may be placed in squadrons, with 1HP defences grouped in up to six units and larger defences grouped  |

| section | sentence not enforced | reason |
|---|---|---|
| CHAOS SPACE MARINE CREWS | For +10 points, battleships and grand cruisers with Chaos Space Marine Warmasters, Lords or crews may include Chosen Terminators. | an equipment or Mark choice, not fleet composition |
| ACTIVATED BLACKSTONE FOR | Only one Activated Blackstone Fortress may be fielded for every FULL 750 points of other ships in a Chaos fleet. No more than three may be taken. | the sentence does not parse with the current patterns |
| RENEGADE IMPERIAL VESSEL | For every 1,500 points in a Chaos fleet, one cruiser from any Imperial Navy fleet list up to 185 points and/or up to six Imperial Navy escorts may be  | tied to a points limit, but the target is a ship class and not a section |
| ROGUE TRADERS | Any fleet except Necrons or Tyranids may include a single Rogue Trader capital ship. | the sentence does not parse with the current patterns |
| ROGUE TRADERS | Tau, Demiurg and Imperial fleets may include one Rogue Trader cruiser for every 750 points or part thereof in their fleet. | tied to a points limit, but the target is a ship class and not a section |
| PLANETARY DEFENCES | It is also a good idea to put an upper limit on the amount of points that can be spent (for example, in a standard battle perhaps no more than 10% of  | the sentence does not parse with the current patterns |

### Chaos — Slaanesh (book page 248)

Enforced **22** (allowed_at 3, cap 2, conditional_cap 2, mandatory_at 1, per_points 3, ratio 3, requires 1, section_count 4, squadron 2, upgrade_ratio 1). Left to check 7.

| type | enforced rule |
|---|---|
| `mandatory_at` | A Chaos Warmaster (and their required capital ship) must be taken in fleets of 750 points or more. |
| `section_count` | 0-1 Chaos Warmaster of Slaanesh |
| `requires` | You can only include a Chaos Warmaster in your fleet if it includes any capital ships. |
| `allowed_at` | A fleet of 1,000 points or more may include the Planet Killer. |
| `section_count` | 0-1 Planet Killer |
| `conditional_cap` | It may not be taken in a fleet that has the Planet Killer, an Activated Blackstone Fortress or ships that must be used as flagships such as the Termin |
| `conditional_cap` | A Chaos fleet including a Space Hulk may have no more than two other battleships. |
| `section_count` | You may include up to one Space Hulk in the fleet. |
| `ratio` | You may include up to one battleship in your fleet for every three cruisers or heavy cruisers. |
| `allowed_at` | A fleet 1,000 points or more may include the Wage of Sin as one of its battleships, subject to normal restrictions. |
| `ratio` | You may include up to one grand cruiser in your fleet for every three cruisers or heavy cruisers. |
| `ratio` | You may include up to one heavy cruiser in your fleet for every two cruisers. |
| `section_count` | 0-12 Cruisers Rogue Trader cruisers always count against cruiser restrictions in any fleet list that has such restrictions. |
| `upgrade_ratio` | Up to half of the capital ships (not the Wage of Sin or the flagship) in a Pleasurefleet may be upgraded to Daemonships at the additional points cost  |
| `squadron` | You may include any number of escorts in your fleet in squadrons of 2–6 unless specified (see pg 13). |
| `per_points` | Only one Activated Blackstone Fortress may be fielded for every FULL 750 points of other ships in a Chaos fleet. No more than three may be taken. |
| `per_points` | For every 1,500 points in a Chaos fleet, one cruiser from any Imperial Navy fleet list up to 185 points and/or up to six Imperial Navy escorts may be  |
| `per_points` | For every 1,500 points in a Chaos fleet, one cruiser from any Imperial Navy fleet list up to 185 points and/or up to six Imperial Navy escorts may be  |
| `cap` | Any fleet except Necrons or Tyranids may include a single Rogue Trader capital ship. |
| `allowed_at` | Abaddon can be chosen to act as fleet commander in any game in which the Chaos fleet is worth 1,000 points or more. |
| `cap` | Abaddon can be chosen to act as fleet commander in any game in which the Chaos fleet is worth 1,000 points or more. |
| `squadron` | Orbital defences or ships that count as defences may be placed in squadrons, with 1HP defences grouped in up to six units and larger defences grouped  |

| section | sentence not enforced | reason |
|---|---|---|
| CHAOS SPACE MARINE CREWS | For +10 points, battleships and grand cruisers with Chaos Space Marine Warmasters, Lords or crews may include Chosen Terminators. | an equipment or Mark choice, not fleet composition |
| FORCES OF CHAOS | Up to two capital ships with the Mark of Slaanesh (including the flagship) may take the Siren’s Summon. | an equipment or Mark choice, not fleet composition |
| ACTIVATED BLACKSTONE FOR | Only one Activated Blackstone Fortress may be fielded for every FULL 750 points of other ships in a Chaos fleet. No more than three may be taken. | the sentence does not parse with the current patterns |
| RENEGADE IMPERIAL VESSEL | For every 1,500 points in a Chaos fleet, one cruiser from any Imperial Navy fleet list up to 185 points and/or up to six Imperial Navy escorts may be  | tied to a points limit, but the target is a ship class and not a section |
| ROGUE TRADERS | Any fleet except Necrons or Tyranids may include a single Rogue Trader capital ship. | the sentence does not parse with the current patterns |
| ROGUE TRADERS | Tau, Demiurg and Imperial fleets may include one Rogue Trader cruiser for every 750 points or part thereof in their fleet. | tied to a points limit, but the target is a ship class and not a section |
| PLANETARY DEFENCES | It is also a good idea to put an upper limit on the amount of points that can be spent (for example, in a standard battle perhaps no more than 10% of  | the sentence does not parse with the current patterns |

### Eldar Corsairs — Gothic Sector (book page 316)

Enforced **7** (cap 2, mandatory_at 1, section_count 2, squadron 2). Left to check 7.

| type | enforced rule |
|---|---|
| `mandatory_at` | If the fleet is worth over 750 points a Pirate Prince must be included to lead it. |
| `section_count` | 0-1 Pirate Prince |
| `cap` | Your fleet may be led by an Eldar Hero, in place of its normal fleet commander. Yriel may be taken instead of the Hero Fleet Commander as listed in th |
| `section_count` | 0-12 Cruisers Rogue Trader cruisers always count against cruiser restrictions in any fleet list that has such restrictions. |
| `squadron` | You may include any number of escorts in your fleet in squadrons of 2–6 unless specified (see pg 13). |
| `cap` | Any fleet except Necrons or Tyranids may include a single Rogue Trader capital ship. |
| `squadron` | Orbital defences or ships that count as defences may be placed in squadrons, with 1HP defences grouped in up to six units and larger defences grouped  |

| section | sentence not enforced | reason |
|---|---|---|
| FLEET RULES (pg. 310–315 | The number of pulsar lances fired at each enemy ship in low orbit is reduced by 1 for every Fortress destroyed. | the sentence does not parse with the current patterns |
| Pirate Prince | You may include 1 Pirate Prince in your fleet, who must be assigned to a ship and adds +2 to its Leadership, to a maximum of 10. | the number of commanders; already enforced as a section limit (0-1) |
| RESERVES AND ALLIES | Following this, one Craftworld Eldar Flame of Asuryan, Dragonship or Wraithship may be taken for every three cruisers in the fleet. | the sentence does not parse with the current patterns |
| RESERVES AND ALLIES | Craftworld Eldar Shadowhunters may be taken in the same ratio of no more than one for every three escort vessels in the fleet. | a ratio to a ship class, not to a section |
| ROGUE TRADERS | Any fleet except Necrons or Tyranids may include a single Rogue Trader capital ship. | the sentence does not parse with the current patterns |
| ROGUE TRADERS | Tau, Demiurg and Imperial fleets may include one Rogue Trader cruiser for every 750 points or part thereof in their fleet. | tied to a points limit, but the target is a ship class and not a section |
| PLANETARY DEFENCES | It is also a good idea to put an upper limit on the amount of points that can be spent (for example, in a standard battle perhaps no more than 10% of  | the sentence does not parse with the current patterns |

### Eldar Corsairs — Later Gothic War (book page 317)

Enforced **8** (cap 2, mandatory_at 1, per_points 1, section_count 2, squadron 2). Left to check 7.

| type | enforced rule |
|---|---|
| `mandatory_at` | If the fleet is worth over 750 points a Pirate Prince must be included to lead it. |
| `section_count` | 0-1 Pirate Prince |
| `cap` | Your fleet may be led by an Eldar Hero, in place of its normal fleet commander. Yriel may be taken instead of the Hero Fleet Commander as listed in th |
| `per_points` | Your fleet may include up to one battleship for every full 1,000 points it contains. |
| `section_count` | 0-12 Cruisers Rogue Trader cruisers always count against cruiser restrictions in any fleet list that has such restrictions. |
| `squadron` | You may include any number of escorts in your fleet in squadrons of 2–6 unless specified (see pg 13). |
| `cap` | Any fleet except Necrons or Tyranids may include a single Rogue Trader capital ship. |
| `squadron` | Orbital defences or ships that count as defences may be placed in squadrons, with 1HP defences grouped in up to six units and larger defences grouped  |

| section | sentence not enforced | reason |
|---|---|---|
| FLEET RULES (pg. 310–315 | The number of pulsar lances fired at each enemy ship in low orbit is reduced by 1 for every Fortress destroyed. | the sentence does not parse with the current patterns |
| Pirate Prince | You may include 1 Pirate Prince in your fleet, who must be assigned to a ship and adds +2 to its Leadership, to a maximum of 10. | the number of commanders; already enforced as a section limit (0-1) |
| RESERVES AND ALLIES | Following this, one Craftworld Eldar Flame of Asuryan, Dragonship or Wraithship may be taken for every three cruisers in the fleet. | the sentence does not parse with the current patterns |
| RESERVES AND ALLIES | Craftworld Eldar Shadowhunters may be taken in the same ratio of no more than one for every three escort vessels in the fleet. | a ratio to a ship class, not to a section |
| ROGUE TRADERS | Any fleet except Necrons or Tyranids may include a single Rogue Trader capital ship. | the sentence does not parse with the current patterns |
| ROGUE TRADERS | Tau, Demiurg and Imperial fleets may include one Rogue Trader cruiser for every 750 points or part thereof in their fleet. | tied to a points limit, but the target is a ship class and not a section |
| PLANETARY DEFENCES | It is also a good idea to put an upper limit on the amount of points that can be spent (for example, in a standard battle perhaps no more than 10% of  | the sentence does not parse with the current patterns |

### Eldar — Iyanden Craftworld (book page 318)

Enforced **9** (cap 2, mandatory_at 1, ratio 1, requires 1, section_count 2, squadron 2). Left to check 10.

| type | enforced rule |
|---|---|
| `mandatory_at` | If the fleet is worth over 750 points, an Autarch must be included to lead it. |
| `section_count` | 0-1 Autarch |
| `section_count` | You may include up to three Farseers in your fleet, each of whom must be assigned to a capital ship (including the flagship if desired) and gives the  |
| `ratio` | Your fleet may include up to one Dragonship for every two Wraithships included in the fleet. |
| `requires` | In order to take the Flame of Asuryan, an Eldar Hero must lead the fleet and be embarked aboard it. Yriel (Fleets p. 319): "you may instead pick the F |
| `squadron` | You may include any number of escorts in your fleet in squadrons of 2–6 unless specified (see pg 13). |
| `cap` | Yriel may be taken instead of the Hero Fleet Commander as listed in the Corsair and Craftworld Eldar fleet lists. |
| `cap` | Any fleet except Necrons or Tyranids may include a single Rogue Trader capital ship. |
| `squadron` | Orbital defences or ships that count as defences may be placed in squadrons, with 1HP defences grouped in up to six units and larger defences grouped  |

| section | sentence not enforced | reason |
|---|---|---|
| FLEET RULES (pg. 310–315 | The number of pulsar lances fired at each enemy ship in low orbit is reduced by 1 for every Fortress destroyed. | the sentence does not parse with the current patterns |
| Autarch | You may include one Eldar Autarch in your fleet, who replaces the ship’s Leadership with his own. | the sentence does not parse with the current patterns |
| Dragonships | If your fleet is led by an Autarch, you may include a single Dragonship as his flagship which does not count against this limitation. | the sentence does not parse with the current patterns |
| Wraithships | Your fleet may include any number of Wraithships. | limits nothing |
| RESERVES AND ALLIES | Following this, one Corsair Eldar cruiser or light cruiser may be taken for every three Dragonships and / or Wraithships in the fleet. | the sentence does not parse with the current patterns |
| RESERVES AND ALLIES | Corsair Eldar escort vessels may be taken in the same ratio of no more than one for every three Shadowhunters in the fleet. | the sentence does not parse with the current patterns |
| RESERVES AND ALLIES | Up to one Void Stalker may be taken in the fleet as long as the fleet is at least 1000 points and at least three Corsair Eldar cruisers and / or light | the sentence does not parse with the current patterns |
| ROGUE TRADERS | Any fleet except Necrons or Tyranids may include a single Rogue Trader capital ship. | the sentence does not parse with the current patterns |
| ROGUE TRADERS | Tau, Demiurg and Imperial fleets may include one Rogue Trader cruiser for every 750 points or part thereof in their fleet. | tied to a points limit, but the target is a ship class and not a section |
| PLANETARY DEFENCES | It is also a good idea to put an upper limit on the amount of points that can be spent (for example, in a standard battle perhaps no more than 10% of  | the sentence does not parse with the current patterns |

### Dark Eldar — Pirates (book page 351)

Enforced **7** (cap 1, mandatory_at 1, min_ratio 1, section_count 2, squadron 2). Left to check 4.

| type | enforced rule |
|---|---|
| `mandatory_at` | 1f the fleet is worth over 750 points a Dread Archon must be included to lead it. |
| `section_count` | 0-1 Dread Archon |
| `section_count` | 0-12 Cruisers Rogue Trader cruisers always count against cruiser restrictions in any fleet list that has such restrictions. |
| `squadron` | You may include any number of escorts in your fleet in squadrons of 2–6 unless specified (see pg 13). |
| `min_ratio` | However, Dark Eldar fleets must contain at least three escorts for every capital ship taken. |
| `cap` | Any fleet except Necrons or Tyranids may include a single Rogue Trader capital ship. |
| `squadron` | Orbital defences or ships that count as defences may be placed in squadrons, with 1HP defences grouped in up to six units and larger defences grouped  |

| section | sentence not enforced | reason |
|---|---|---|
| Dread Archon | You may include 1 Dread Archon in your fleet, who must be assigned to a ship and adds + 2 to its Leadership, to a maximum of 10. | the number of commanders; already enforced as a section limit (0-1) |
| ROGUE TRADERS | Any fleet except Necrons or Tyranids may include a single Rogue Trader capital ship. | the sentence does not parse with the current patterns |
| ROGUE TRADERS | Tau, Demiurg and Imperial fleets may include one Rogue Trader cruiser for every 750 points or part thereof in their fleet. | tied to a points limit, but the target is a ship class and not a section |
| PLANETARY DEFENCES | It is also a good idea to put an upper limit on the amount of points that can be spent (for example, in a standard battle perhaps no more than 10% of  | the sentence does not parse with the current patterns |

### Orks — Cyclops Cluster (book page 365)

Enforced **6** (cap 2, mandatory_at 1, per_points 1, squadron 2). Left to check 6.

| type | enforced rule |
|---|---|
| `mandatory_at` | If the fleet is worth 500 points or more it must include at least 1 Warlord to lead it. |
| `per_points` | An Ork fleet can include a max of one Warlord per 500 points. |
| `cap` | You may include up to six kroozers in your fleet. |
| `squadron` | You may include any number of escorts in your fleet in squadrons of 2–6 unless specified (see pg 13). |
| `cap` | Any fleet except Necrons or Tyranids may include a single Rogue Trader capital ship. |
| `squadron` | Orbital defences or ships that count as defences may be placed in squadrons, with 1HP defences grouped in up to six units and larger defences grouped  |

| section | sentence not enforced | reason |
|---|---|---|
| WARLORD | You may include 1 or more Warlord in your fleet, each of whom must be assigned to a ship or squadron. | the number of commanders; already enforced as a section limit (0-1) |
| WARLORD | A vessel carrying a Warlord doubles its boarding value and may include up to one of the upgrades shown below at the additional cost indicated. | the sentence does not parse with the current patterns |
| DAKKA DAKKA | Ork capital ships can add +2 turrets to their ships for +20 points (this is not the same thing as saying “up to two turrets at +10 points each”). | the sentence does not parse with the current patterns |
| ROGUE TRADERS | Any fleet except Necrons or Tyranids may include a single Rogue Trader capital ship. | the sentence does not parse with the current patterns |
| ROGUE TRADERS | Tau, Demiurg and Imperial fleets may include one Rogue Trader cruiser for every 750 points or part thereof in their fleet. | tied to a points limit, but the target is a ship class and not a section |
| PLANETARY DEFENCES | It is also a good idea to put an upper limit on the amount of points that can be spent (for example, in a standard battle perhaps no more than 10% of  | the sentence does not parse with the current patterns |

### Orks — Waaagh! (book page 366)

Enforced **9** (cap 2, compare 1, mandatory_at 1, per_points 2, ratio 1, squadron 2). Left to check 9.

| type | enforced rule |
|---|---|
| `mandatory_at` | If the fleet is worth 500 points or more it must include at least 1 Warlord to lead it. |
| `per_points` | An Ork fleet can include a max of one Warlord per 500 points. |
| `per_points` | An Ork fleet can include a maximum of one space hulk per 1,500 points. |
| `compare` | Each Ork hulk must be assigned an Ork Warlord to command it. |
| `ratio` | For every two kroozers included in your fleet, you may pick one vessel from the list below. |
| `cap` | You may include up to six kroozers in your fleet. |
| `squadron` | You may include any number of escorts in your fleet in squadrons of 2–6 unless specified (see pg 13). |
| `cap` | Any fleet except Necrons or Tyranids may include a single Rogue Trader capital ship. |
| `squadron` | Orbital defences or ships that count as defences may be placed in squadrons, with 1HP defences grouped in up to six units and larger defences grouped  |

| section | sentence not enforced | reason |
|---|---|---|
| WARLORD | You may include 1 or more Warlord in your fleet, each of whom must be assigned to a ship or squadron. | the number of commanders; already enforced as a section limit (0-1) |
| WARLORD | A vessel carrying a Warlord doubles its boarding value and may include up to one of the upgrades shown below at the additional cost indicated. | the sentence does not parse with the current patterns |
| SPACE HULKS | You may include up to one Ork Space Hulk in your fleet per 1,500 points. | tied to a points limit, but the target is a ship class and not a section |
| SPACE HULKS | So if the fleet is worth up to 1,500 points, it may include one Space hulk. | an example of the previous sentence |
| ORK ROKS | Ork Roks may be squadroned with up to three other Roks (total squadron size of four), but not with any other vessels. | the sentence does not parse with the current patterns |
| DAKKA DAKKA | Ork capital ships can add +2 turrets to their ships for +20 points (this is not the same thing as saying “up to two turrets at +10 points each”). | the sentence does not parse with the current patterns |
| ROGUE TRADERS | Any fleet except Necrons or Tyranids may include a single Rogue Trader capital ship. | the sentence does not parse with the current patterns |
| ROGUE TRADERS | Tau, Demiurg and Imperial fleets may include one Rogue Trader cruiser for every 750 points or part thereof in their fleet. | tied to a points limit, but the target is a ship class and not a section |
| PLANETARY DEFENCES | It is also a good idea to put an upper limit on the amount of points that can be spent (for example, in a standard battle perhaps no more than 10% of  | the sentence does not parse with the current patterns |

### Orks — Da Ork Clanz (book page 372)

Enforced **8** (allowed_at 1, cap 1, conditional_cap 1, per_points 1, ratio 1, squadron 2, up_budget 1). Left to check 8.

| type | enforced rule |
|---|---|
| `per_points` | Ork fleets always include one Warlord for every 500 points, or part, that the fleet is worth – no more, no less. |
| `squadron` | Tiddla skwadron 3-10 Escorts, chosen from the following list in any mix desired |
| `conditional_cap` | An Ork fleet with at least three Warlords may include one Space Hulk. |
| `ratio` | However, no more than one of each of the named Ork battleships may be in the fleet, no more than one ‘Uge ship may be taken in the fleet for every two |
| `allowed_at` | However, no more than one of each of the named Ork battleships may be in the fleet, no more than one ‘Uge ship may be taken in the fleet for every two |
| `up_budget` | A vessel or escort skwadron led by a Warlord may be given up to one of the following upgrades per Command re-roll the Warlord has. Each upgrade can on |
| `cap` | Any fleet except Necrons or Tyranids may include a single Rogue Trader capital ship. |
| `squadron` | Orbital defences or ships that count as defences may be placed in squadrons, with 1HP defences grouped in up to six units and larger defences grouped  |

| section | sentence not enforced | reason |
|---|---|---|
| Big ship skwadron | 1-2 Kroozers, chosen from the following list: | the sentence does not parse with the current patterns |
| Tiddla skwadron | 3-10 Escorts, chosen from the following list in any mix desired: | the sentence does not parse with the current patterns |
| USING SKWADRONS | While there must be at least one Warlord for every 500 points in the fleet or portion thereof, not all Warlords are created equal! | tied to a points limit, but the target is a ship class and not a section |
| CLAN UPGRADES | A Blood Axe tiddla skwadron of at least six escorts may include up to three Imperial Navy and/or Chaos escorts from any fleet list at their listed cos | the sentence does not parse with the current patterns |
| ROGUE TRADERS | Any fleet except Necrons or Tyranids may include a single Rogue Trader capital ship. | the sentence does not parse with the current patterns |
| ROGUE TRADERS | Tau, Demiurg and Imperial fleets may include one Rogue Trader cruiser for every 750 points or part thereof in their fleet. | tied to a points limit, but the target is a ship class and not a section |
| BLOOD AXE COMMANDEERED E | A Blood Axe tiddla skwadron of at least six escorts may include up to three Imperial Navy and/or Chaos escorts from any fleet list at their listed cos | the sentence does not parse with the current patterns |
| PLANETARY DEFENCES | It is also a good idea to put an upper limit on the amount of points that can be spent (for example, in a standard battle perhaps no more than 10% of  | the sentence does not parse with the current patterns |

### Necrons — Harvest Fleet (book page 404)

Enforced **3** (ratio 1, squadron 2). Left to check 3.

| type | enforced rule |
|---|---|
| `ratio` | Your fleet may include up to one tombship for every Scythe class harvest ship it contains. |
| `squadron` | Your fleet may include up to twelve Jackal class raiders, and up to twelve Dirge class raiders, in squadrons of 2–6. |
| `squadron` | Orbital defences or ships that count as defences may be placed in squadrons, with 1HP defences grouped in up to six units and larger defences grouped  |

| section | sentence not enforced | reason |
|---|---|---|
| FLEET RULES (pg. 398–403 | The drive is fired whenever All Ahead Full orders are issued; instead of obeying the normal rules for this order the ship gains D6 × 10 cm additional  | the sentence does not parse with the current patterns |
| Cruisers | Your fleet may include up to six Scythe class harvest ships and up to three Shroud class light cruisers. | the sentence does not parse with the current patterns |
| PLANETARY DEFENCES | It is also a good idea to put an upper limit on the amount of points that can be spent (for example, in a standard battle perhaps no more than 10% of  | the sentence does not parse with the current patterns |

### Tyranids — Vanguard Fleet (book page 429)

Enforced **4** (agreement 1, squadron 2, unit_upgrade_max 1). Left to check 7.

| type | enforced rule |
|---|---|
| `unit_upgrade_max` | No hive ship may ever have more than three different special refits, no cruiser more than two and no escort more than one. |
| `squadron` | Vanguard drone ships and Kraken may be deployed in squadrons of 6 to 12 models. You may combine the two types in a single squadron if you wish. |
| `agreement` | These refits can only be used in one-off games if both players agree. |
| `squadron` | Orbital defences or ships that count as defences may be placed in squadrons, with 1HP defences grouped in up to six units and larger defences grouped  |

| section | sentence not enforced | reason |
|---|---|---|
| FLEET RULES (pg. 423–428 | Example: A Hive ship can have four reinforced carapaces, two extra spore cysts and one other refit, resulting in no more than three different refits. | the sentence does not parse with the current patterns |
| FLEET RULES (pg. 423–428 | No more than two spore cysts can be gained in this manner. | the sentence does not parse with the current patterns |
| FLEET RULES (pg. 423–428 | No more than four additional Hits may be gained in this manner for Hive ships, and no more than three for cruisers. | the sentence does not parse with the current patterns |
| VANGUARD DRONE SHIPS | Your fleet may include any number of Vanguard drone ships. | limits nothing |
| KRAKEN | Your fleet may include any number of Kraken. | limits nothing |
| LEADERSHIP | Escort squadrons in a Tyranid Vanguard fleet each have a Leadership value equal to the number of vessels remaining in the squadron (up to a maximum of | the sentence does not parse with the current patterns |
| PLANETARY DEFENCES | It is also a good idea to put an upper limit on the amount of points that can be spent (for example, in a standard battle perhaps no more than 10% of  | the sentence does not parse with the current patterns |

### Tyranids — Hive Fleet (book page 430)

Enforced **14** (agreement 1, conditional_cap 1, min_ratio 2, points_share 1, ratio 2, squadron 2, unit_upgrade_max 3, upgrade_ratio 2). Left to check 6.

| type | enforced rule |
|---|---|
| `unit_upgrade_max` | No hive ship may ever have more than three different special refits, no cruiser more than two and no escort more than one. |
| `unit_upgrade_max` | No hive ship may ever have more than three different special refits, no cruiser more than two and no escort more than one. |
| `unit_upgrade_max` | No hive ship may ever have more than three different special refits, no cruiser more than two and no escort more than one. |
| `upgrade_ratio` | A maximum of one Hive Mind Influence re-roll can be purchased per hive ship in the fleet. |
| `upgrade_ratio` | A maximum of one Hive Mind Imperative can be purchased per two hive ships in the fleet, though a single Hive Mind Imperative may be purchased as long  |
| `ratio` | You may include up to 2 capital ships for each hive ship in the fleet. |
| `min_ratio` | You may include between 6 and 12 escort class ships for each hive ship. |
| `ratio` | You may include between 6 and 12 escort class ships for each hive ship. |
| `min_ratio` | The fleet must have at least six escort drones for every hive ship in the fleet. |
| `conditional_cap` | If no hive ships are chosen, only Kraken and Vanguard drone ships may be included in the fleet. |
| `squadron` | Tyranid Escorts come as squadrons of 1 to 12 vessels, while all other types are individuals and may not deploy in squadrons. |
| `points_share` | Up to 10 % of the fleet’s points allowance may be spent on Ordnance markers as long as at least one hive ship is chosen. |
| `agreement` | These refits can only be used in one-off games if both players agree. |
| `squadron` | Orbital defences or ships that count as defences may be placed in squadrons, with 1HP defences grouped in up to six units and larger defences grouped  |

| section | sentence not enforced | reason |
|---|---|---|
| FLEET RULES (pg. 423–428 | Example: A Hive ship can have four reinforced carapaces, two extra spore cysts and one other refit, resulting in no more than three different refits. | the sentence does not parse with the current patterns |
| FLEET RULES (pg. 423–428 | No more than two spore cysts can be gained in this manner. | the sentence does not parse with the current patterns |
| FLEET RULES (pg. 423–428 | No more than four additional Hits may be gained in this manner for Hive ships, and no more than three for cruisers. | the sentence does not parse with the current patterns |
| ESCORTS | A Vanguard drone ship must be armed with one weapon chosen from the following list: The fleet must have at least six escort drones for every hive ship | a ratio to a ship class, not to a section |
| ESCORTS | If desired, this may be in addition to the 6–12 escorts (of any type) that may be taken for every hive ship in the fleet. | a ratio to a ship class, not to a section |
| PLANETARY DEFENCES | It is also a good idea to put an upper limit on the amount of points that can be spent (for example, in a standard battle perhaps no more than 10% of  | the sentence does not parse with the current patterns |

### Tau — Merchant Fleet (book page 454)

Enforced **11** (hook_capacity 2, mandatory_at 2, per_points 2, ratio 2, section_count 1, squadron 1, tiers 1). Left to check 9.

| type | enforced rule |
|---|---|
| `mandatory_at` | Your fleet must include a commander if it is greater than 750 pts. |
| `section_count` | 0-1 Commander |
| `mandatory_at` | If your fleets is worth more than 750 pts it must include at least one Explorer. |
| `ratio` | It may also include up to one Hero class starship for every Merchant or Explorer in the fleet. |
| `per_points` | Your fleet may include up to one Messenger class starship per 500 points. |
| `hook_capacity` | You may not have more Orcas and Wardens than the gravitic hook capacity of the fleet. |
| `hook_capacity` | You may not have more Dhows (or Orcas) than the gravitic hook capacity of the fleet. A ship may have either Orcas or Dhows, but not both so the gravit |
| `squadron` | Defenders are fielded in squadrons of 2–6 ships. |
| `tiers` | A Tau fleet can include up to one Warsphere if the fleet is worth 1500 points, or up to two Warspheres in games larger than that. |
| `ratio` | A Tau fleet can include up to one Demiurg vessel for every three Tau capital ships in the fleet. |
| `per_points` | Tau, Demiurg and Imperial fleets may include one Rogue Trader cruiser for every 750 points or part thereof in their fleet. |

| section | sentence not enforced | reason |
|---|---|---|
| FLEET RULES (pg. 448–453 | ALLIES, SUBJECTS & MERCENARIES Tau fleets may include allies, subjects and mercenaries, selected from the fleet lists as normal. | the sentence does not parse with the current patterns |
| Commander | Your fleet may include a fleet commander to lead it if you wish. | the sentence does not parse with the current patterns |
| Battleships | Your fleet may include any number of battleships. | limits nothing |
| Cruisers | Your fleet may include any number of Merchant class starships. | limits nothing |
| ESCORTS | Your fleet may include any number of Defender class starships. | limits nothing |
| ALLIES, SUBJECTS & MERCE | Your fleet may include mercenaries chosen from the following, subject to the relevant restrictions. | the sentence does not parse with the current patterns |
| Nicassar Vessels | Your fleet may include Nicassar Dhows in place of some or all of its Orcas. | the sentence does not parse with the current patterns |
| ROGUE TRADERS | Any fleet except Necrons or Tyranids may include a single Rogue Trader capital ship. | the sentence does not parse with the current patterns |
| ROGUE TRADERS | Tau, Demiurg and Imperial fleets may include one Rogue Trader cruiser for every 750 points or part thereof in their fleet. | tied to a points limit, but the target is a ship class and not a section |

### Tau — Commerce Protection (book page 456)

Enforced **16** (compare 2, hook_capacity 2, mandatory_at 1, per_points 3, ratio 2, requires 2, section_count 1, squadron 2, tiers 1). Left to check 11.

| type | enforced rule |
|---|---|
| `requires` | KOR’O VASH’YA Y’ELDI MESME: 110 PTS Kor’O’Mesme is embarked aboard the Kor’or’vesh vessel Bor’kan Or’es El’Leath Se’arle O’Mesme (Custodian Class Batt |
| `mandatory_at` | Your fleet must include a commander if it is greater than 750 pts. |
| `requires` | If the fleet includes a Custodian, a Kor’O must lead it. |
| `section_count` | 0-1 Commander |
| `per_points` | Your fleet may include up to one Custodian per FULL 750 points of Tau vessels. Allied, Subject, Mercenary and Reserve vessels don't count toward this  |
| `ratio` | It may also include up to one Hero class starship for every other type of capital ship in the fleet. |
| `per_points` | Your fleet may include up to one Messenger class starship per 500 points. |
| `hook_capacity` | You may not have more Orcas and Wardens than the gravitic hook capacity of the fleet. |
| `hook_capacity` | You may not have more Dhows (or Orcas) than the gravitic hook capacity of the fleet. Gravitic hooks on a Custodian battleship or Emissary starship can |
| `squadron` | Defenders are fielded in squadrons of 2–6 ships. |
| `tiers` | A Tau fleet can include up to one Warsphere if the fleet is worth 1500 points, or up to two Warspheres in games larger than that. |
| `ratio` | A Tau fleet can include up to one Demiurg vessel for every three Tau capital ships in the fleet. |
| `compare` | There cannot be more Stronghold than Bastion vessels in the fleet. |
| `per_points` | Up to one Rogue Trader cruiser and its attendant escorts may accompany the fleet for every 750 points of Tau ships in the fleet. |
| `squadron` | Up to one Rogue Trader cruiser and its attendant escorts may accompany the fleet for every 750 points of Tau ships in the fleet. Additionally, a singl |
| `compare` | Additionally, a single squadron of up to six Xenos escorts can be taken as per the Rogue Trader rules and fleet list. |

| section | sentence not enforced | reason |
|---|---|---|
| FLEET RULES (pg. 448–453 | ALLIES, SUBJECTS & MERCENARIES Tau fleets may include allies, subjects and mercenaries, selected from the fleet lists as normal. | the sentence does not parse with the current patterns |
| Commander | Your fleet may include a fleet commander to lead it if you wish. | the sentence does not parse with the current patterns |
| Battleships | Your fleet may include any number of Explorer battleships. | limits nothing |
| Battleships | Your fleet may include up to one Custodian per FULL 750 points of Tau vessels. | the sentence does not parse with the current patterns |
| Battleships | For example, a fleet that has at least 750 points of Tau vessels in it may include a single Custodian. | an example of the previous sentence |
| Battleships | Fleets of at least 1,500 points may include two Custodians etc. | an example of the previous sentence |
| Cruisers | Your fleet may include any number of Merchant, Emissary or Protector class starships. | limits nothing |
| Cruisers | It may also include up to one Hero class starship for every other type of capital ship in the fleet. | the sentence does not parse with the current patterns |
| ESCORTS | Your fleet may include any number of Defender and/or Castellan class starships. | limits nothing |
| ALLIES, SUBJECTS & MERCE | Your fleet may include mercenaries chosen from the following, subject to the relevant restrictions. | the sentence does not parse with the current patterns |
| Nicassar Vessels | Your fleet may include Nicassar Dhows in place of some or all of its Orcas. | the sentence does not parse with the current patterns |

### Demiurg — War Host (book page 486)

Enforced **10** (cap 1, compare 1, hook_capacity 1, per_points 1, ratio 2, section_count 1, squadron 3). Left to check 3.

| type | enforced rule |
|---|---|
| `ratio` | Your fleet may include one battleship for every two cruiser-class vessels in the fleet. |
| `cap` | Your fleet may include no more than twelve cruisers. |
| `compare` | Demiurg Commerce Vessels must outnumber all non-Demiurg cruisers combined. |
| `per_points` | The fleet may have one Kroot Warsphere in the fleet for every 750 points in the fleet or portion thereof. |
| `section_count` | Kroot Vessels (0–3) |
| `ratio` | For every three Demiurg capital ships in the fleet, it may include one squadron of up to six Tau or Rogue Trader escorts. |
| `hook_capacity` | Nicassar Dhows, Tau Wardens or Orcas can be taken for every starship in the fleet equipped with gravitic hooks. |
| `squadron` | For every three Demiurg capital ships in the fleet, it may include one squadron of up to six Tau or Rogue Trader escorts. Tau, Nicassar and Rogue Trad |
| `squadron` | For every three Demiurg capital ships in the fleet, it may include one squadron of up to six Tau or Rogue Trader escorts. Tau, Nicassar and Rogue Trad |
| `squadron` | Orbital defences or ships that count as defences may be placed in squadrons, with 1HP defences grouped in up to six units and larger defences grouped  |

| section | sentence not enforced | reason |
|---|---|---|
| FLEET RULES (pg. 482–485 | The cutting beam counts as a single lance but each Blast marker picked up by the Demiurg vessel in the Movement phase gives the beam the equivalent of | the sentence does not parse with the current patterns |
| ESCORTS | Nicassar Dhows, Tau Wardens or Orcas can be taken for every starship in the fleet equipped with gravitic hooks. | the sentence does not parse with the current patterns |
| PLANETARY DEFENCES | It is also a good idea to put an upper limit on the amount of points that can be spent (for example, in a standard battle perhaps no more than 10% of  | the sentence does not parse with the current patterns |

