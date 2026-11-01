# Gothic Fleet Play: rulings

Where the books are unclear, contradict each other or are silent, the page makes a
choice. The choices are listed here, so that each can be disputed, and the code
cites them by number (`T11`). The numbers are the original ones; T37-T39 were
never used.

Sources: a bare page (**p. 67**) is Rulebook v1.10; **Fleets p.** is the Fleets
Book WiP v0.36. Printed page = PDF page. The Finnish original of this list, with
the design notes around it, is `docs/history/registry/play/LUEMINUT.md`.

## Rulings

**T1. Shields and blast markers.** One number per ship: the Blast Markers in
contact with its hull. A shield places a marker for every hit it stops (p. 70)
and every marker takes down a shield in shooting (p. 69), so "shields up" =
shields - markers, and there is no separate used-shields counter. Shields come
back only when the ship moves clear of the markers (p. 70): MOVED CLEAR is a tap
of its own, not the change of turn.

**T2. A failed Brace.** It locks the brace against this attacker (p. 47) **and**
the fleet's other orders this turn (p. 48: a failed Command check), because Brace
is a Command check. Brace itself is free of the lock (p. 48).

**T3. How long a brace lasts.** "Until the end of its next turn" (p. 47): it ends
with the END TURN tap of that turn, not at the start of the next turn. A brace
taken in the enemy's turn lasts to the end of the ship's own next turn.

**T4. Criticals that cannot be applied.** p. 67: a repeated result on a location
that cannot be repaired applies as the next result - a second 9 is a 10, a second
10 is an 11 - and so does a result for armament the ship does not have (the
book's example: no dorsal weapons -> 3 starboard). Ld -3 only once. If the next
result is 11 or 12, the card asks for the roll first (`critTarget`).

**T5. Criticals from other tables.** The Eldar, Necron, Tyranid and hulk tables
(`R.damage.critical`) count the results and the repairs, but the standard table's
effects (no turns, -10 cm, Ld -3, shields 0, firing bans) apply only when the
heading is `CRITICAL DAMAGE (2D6)`.

**T6. A critical's extra damage.** 6 and 8 (+1) are added automatically: that is
the book's arithmetic, not a judgement, and it saves a tap. 11 and 12 (+D3/+D6)
ask for the roll. Fire damage in the End Phase is not automatic (the repair roll
comes in between): the row's FIRE mark is a button "FIRE xN · +N hits", N = the
number of unrepaired fires (p. 67: criticals are cumulative, every fire takes a
hit).

**T7. An escort squadron "crippled".** A conflict: p. 57 "at least half ...
destroyed (rounding down)", p. 123 "loses half of its ships, rounding up". In a
squadron of 5 ships that is 2 vs 3. The page uses **p. 57** (disengagement's own
rule) for the VP of a disengaged squadron; otherwise an escort squadron concedes
points only when destroyed entirely (p. 123). Recorded, not chosen silently.

**T8. The flagship's Ld.** The Fleets book's commander row "improves its
Leadership to the value shown" (e.g. Imperial Navy Fleets p. 35): a fixed value
replaces the roll, a modifier (+1, max 10) is added to the roll.

**T9. A hulk's VP.** A hulk is a destroyed ship (full points, p. 123). "Holding
the field" 50 % is the holder's bonus, not a concession; the page does not count
it.

**T10. The fleet's ordnance limit.** Attack craft markers in the air vs. the
launch bays alive (halved when crippled, p. 73) is a top-bar counter that the
player updates. Torpedoes have no limit (p. 73). A bay count given as dice (Ork
D3+1) shows in the counter as "+?".

**T11. A commander's points in VP.** p. 123: the value of a destroyed or
disengaged ship includes "any Admiral, Warmaster or Chaos Lord on board". The
flagship's VP rows include the commander's points (`conceded(R, st, plus)`).

**T12. The Necron reactive hull.** Fleets p. 402: the 4+/5+/6+ save "is treated in
the same manner as a brace save" - not a shield, not halved, not used up by blast
markers; shown as text. The same page: "immune to Damage, Leadership and Movement
modifiers from ... Blast Markers" -> no Under Fire -1. Halving the damage control
dice for blast markers (p. 88) stays standard for now - open.

**T13. Dice strengths in a squadron's fire.** Ork gunz (D6+2, Fleets p. 360) is not
a number: in combined fire (p. 99) the numbers are summed and the dice listed
beside them ("WB 12 + D6+2 + D6+2"), for an escort squadron "D6x3".

**T14. A squadron's Ld and Under Fire.** p. 95: "even if only some of the ships in
a squadron have Blast Markers" - one marked member brings -1 to the squadron's
highest Ld.

**T15. The Necron Portal.** Fleets p. 401: orders do not limit it, but crippled or
braced halves it **rounding down**; both -> no Portal attacks.

**T16. The Necron Star Pulse.** Fleets p. 400: does not work while crippled nor
under any order (Lock On included).

**T17. Old saves.** A game saved before 28.9.2026 (blast, order, brace in the
counts) is cleaned when it is continued: the page no longer owns those fields.

**T18. A squadron's combined ordnance.** p. 99: torpedoes and attack craft combine
into one salvo or wave only from base contact - the squadron table shows the sum
marked "base contact". Ork torpedo launchas never combine (Fleets p. 360, the
card's rule row): they add nothing to the sum and the escort row reads
"separate". Nova cannons are not combined.

**T19. Catastrophic damage at 0 hits.** When a capital ship falls to zero, its own
table opens on the card by itself, with the numbers already computed **from its
starting hits** (p. 71): the Rulebook's 2D6 (2-6 drifting hulk, 7-8 blazing hulk,
9-11 plasma drive overload: ½ hits Blast Markers and lance hits Str ½ hits, 12
warp drive implosion: hits BM and Str hits); 3D6 when the ship's rule says so
(Mercury Fleets p. 64, the fuel tanker p. 182; over 12 = 12); the Tyranids' own
table (Fleets p. 423: 2-7 drifting carcass, 8-9 death throes = rolls again after
every move, 10-11 biological eruption, 12 bio-plasma detonation); and, without a
roll, four Blast Markers for the ships whose own damage block says so - the rock
ships (Rok Fleets p. 393, Warsphere p. 495, the Stryxis caravan p. 197) and the
Nicassar Caravan (p. 492, a page of its own, not a rock ship). The ship is
recognised from its own text, not its name. A ship brought to zero in a boarding
action is a drifting hulk without a roll (p. 90), a button of its own. The player
taps the rolled row; the card turns into a hulk: the name struck through, an icon
(drifting / blazing / gone), the book's row and a hulk row (no shields or
holofields, turrets 0, hit on its original Armour, a roll on this table each time
an enemy ship, squadron or ordnance wave inflicts hits - however many, p. 71), no
specs and no weapons; the CATASTROPHIC button stays. Note: p. 71's "roll once ...
each time hits are inflicted" applies to all hulks, not only a blazing one; a
blazing hulk also rolls after every move. The pop-up holds the whole list: drifts
4D6 cm + BM; no shields, bombers do not reduce turrets, blocks lines of fire;
targeting (no Ld test to ignore it when nearest, a normal test when not nearest;
torpedoes do not ignore it, boarding torpedoes may, guided ones swerve, pp.
77-78); own ships may not shoot at or board it (own torpedoes that go astray do
hit, p. 71) - **the Necrons may** (Fleets p. 402), **the Mechanicus** with an Ld
test at its own *drifting* hulk (Fleets p. 118); VP: the holder of the field gets
half a hulk's value, own ones too (p. 123). An explosion is an area effect:
holofields do not protect, shields do; one BM in place, the rest fanned out in
contact (p. 71). Space hulks (Chaos Fleets p. 288, Ork p. 391): 9-11 breaks up
into an asteroid field D3x5 cm without damage, 12 a warp rift. **Defences do not
drift** (p. 101: "defences never drift, they always remain in place", the
Blackstone is the book's example): the drifting/blazing rows and the hulk row say
"stays in place"; a blazing one rolls again in every Movement phase where a ship
would have moved (interpretation). **The star fort** (Ramilies Fleets pp.
500-505; the Fortress-Monastery by reference p. 110, `R.stats.quadrant`): since
8.10.2026 the card has all four quadrant tracks (T29; before that one) - a
quadrant at zero takes no more damage and is an asteroid field (p. 501); the fort
itself rolls a D6 on its own table (1-2 Wrecked in place, 3 a 15 cm asteroid
field, 4-5 hyper-plasma meltdown, 6 warpbubble implosion, p. 505) only when all
four quadrants are at zero (p. 502) - the table opens only then, and the pop-up
states the rule. The Tyranid pop-up does not claim shields protect: row 12 says
the opposite (Fleets p. 423). Once the roll's result is on the card, the hulk's
hit track is no longer edited by tapping (HIT and the track skip it) - UNDO is the
way back; a table row can be chosen only at 0 hits, and UNDO closes the table if
the ship is no longer at zero.

**T20. The admiral on the flagship's card.** A commander is not a roster row of
his own but a CMD row on the flagship's card (name, Ld modifier, re-rolls) - the
card that is played carries what is on its deck. The commander's points count in
the flagship's VP (T11).

**T21. A squadron's sum follows the ships' state.** p. 99 sums each ship's
*current* value: a destroyed member (p. 71 "no hits left ... out of action"), a
hulk (p. 71) or a disengaged one (p. 57, removed from the table) is not in the
sum and the heading says "N of M firing"; in the member list an absent one is
struck through with its reason, a crippled one is marked (values halve one by
one, p. 99). A weapon silenced by a critical (p. 67) shows under its row struck
through with its name and reason, so the drop in the sum is visible. The
squadron's Ld skips a disengaged member too (p. 95). All gone -> "No ship left
firing". Strengths given as dice (Ork gunz) do not vanish from the table
silently: the bottom row says "Rolled ship by ship, not summed" (Fleets p. 360,
T13). Ork gunz are weapon batteries (Fleets p. 360) and add to the battery row;
heavy gunz (each hit 2 hits, p. 360) and bombardment cannons add to rows of their
own, because their hits cannot share a gunnery roll with the ordinary ones.

**T22. VP the Necrons concede.** Fleets p. 402 "count up the Necron losses":
disengaged undamaged 10 %, disengaged damaged or a disengaged raider 25 %,
crippled 50 %, destroyed 200 %, left as a drifting hulk 300 % (blazing = "not left
as a drifting hulk" = 200 %, until it drifts). A destroyed raider normally 100 %.
Menu > VP uses the same `conceded` count, and the card's VP row cites the page the
number comes from (`concededPage`: Necrons Fleets p. 402, escorts p. 57 and 123,
others p. 123).

**T23. Tyranid self-destruction.** Fleets p. 418: a capital ship boarded by
Tyranids may destroy itself in the End Phase with an Ld test (D6 1-3 plasma drive
overload, 4-6 warp drive implosion). Not on the card: it happens before 0 hits and
is not a 0-hit state; recorded here.

**T24. A critical's minus.** Every result in the critical table has a plus and,
right next to it, a minus (the user, 30.9.2026). The summary under the table and
its REPAIR buttons were removed: the minus is now both the game's repair (damage
control, p. 88) and the fix for a wrong tap. So the minus takes off only the
result, never hits - a repair does not heal damage; the +1 hit of a wrongly tapped
result (6 Engine, 8 Thrusters) goes with UNDO or on the hit track. The minus also
takes off a result that cannot be repaired in the game (9, 10, p. 67): that is the
player's bookkeeping, and the table's star is a reminder of the rule. When the
ship does not have the result, the minus is clearly disabled. The End Phase hits
of fires are added from the row's FIRE mark (T6).

**T25. Re-rolls in words, and Abaddon's per turn.** A commander's re-rolls are
shown in the builder's own sentence (`DOMAIN.rerollText`): what the price already
includes, what was bought on top and the book's limit (the user, 5.10.2026). A
fleet without a commander has a re-roll of its own (Necrons p. 404, Demiurg p. 486
"The fleet gets one re-roll"): the RR counter shows for them too, and it is not
lost with the flagship, because there is no flagship. Abaddon's re-roll is "1 per
turn" (Fleets p. 231: "Abaddon's fleet is allowed to re-roll a single Command
check or Leadership test each turn"). A turn is one player's turn (p. 50), and a
re-roll can also be used in the opponent's turn (the Brace for Impact check,
p. 47), so the counter returns to one at the start of both the own and the
opponent's turn. Interpretation: if you play a "turn" as the whole round, reduce
the counter by hand. Other commanders' re-rolls are once per game (Fleets p. 11)
and do not return.

**T26. Re-roll boxes.** Every re-roll has a box of its own (the user, 5.10.2026:
tick boxes to track the re-rolls, the ones in the price and the bought ones in
different colours): a tap marks exactly that box used, a second tap returns it (a
wrong tap). The colour and the word tell the origin: *incl.* is in the price,
*bought* was bought in the builder, *option* is the list's open option that was
taken at the table, *added* was added with the counter's plus (e.g. a sub-plot's
extra re-roll, p. 127). A dashed box is an open option: it is not counted in the
fleet's points, and a tap makes it a box of its own (every box switches only
between free and used: the review of 5.10.2026 showed that a third "off" state
gave a used re-roll back as free when a stray tap was corrected on the same spot;
an option taken by mistake is undone with UNDO or ticked used) - the page does
not change the built fleet or its points, it only records. Of the open rows of
the same group the largest is offered (One / Two / Three extra = three boxes). A
ship can also have re-rolls of its own (Scion of Prospero p. 258: two in the
price; Mark of Tzeentch p. 234 "This ship has an extra re-roll"; the
Fortress-Monastery p. 111 "usable only by the fortress-monastery itself"): they
are on the ship's card in a row of their own "Ship's own re-rolls" and are not
part of the fleet's pool. The Tyranids' Hive Mind Influence re-rolls (p. 430) are
a fleet pool like the Necrons' and the Demiurg's. The boxes are under the CMD row
of the flagship's card; another commander's own boxes (Veteran Captain p. 38,
Farseer p. 318, a second Warlord) are on his own row, because they are not the
fleet's shared ones; a fleet without a commander has its boxes on the Fleet
re-rolls row. The top bar's RR counter (with Tracking on) shows the same pool:
minus uses the first free box, plus returns the last used one or adds a box.
Bridge Smashed on the flagship (p. 67) locks all the boxes. If the 9 was a wrong
tap and it is taken off with the minus, the boxes return as they were. The
fleet's commander is the commander who comes first in the FLEET LIST (Admiral
before Veteran Captain, Warmaster before Chaos Lord, Autarch before Farseer) - not
the first in the roster, because the roster's order is the player's. The
counter's minus first undoes its own plus. Abaddon's per-turn box returns on NEW
TURN; without Orders tracking the page has no start of the opponent's turn, so
the box is tapped back by hand then (the text says so). A game saved before the
boxes gets boxes on top of the number it read (`PLAY.adoptRerolls`).

**T27. One-hit units are a member model.** Planetary defences, 8.10.2026 (Fleets
pp. 496-517). The builder tells in the field `R.squadron` that the unit is N
one-hit pieces bought together: the book's Escort types and one-hit defences
(p. 100: "1HP defences grouped in up to six units"; platforms Defence/1 Fleets
pp. 509-511, silos and the air base Ground/1 p. 517). Six platforms = six boxes:
a hit or a critical destroys ONE (p. 66), no hit track, no critical table, no
Catastrophic roll. `PLAY.isEscort` is, despite its name, this member model; the
type regex was kept as a fallback for hand-made test stubs. **A defect fixed:**
the last loss of an escort squadron announced "roll 2D6 on the Catastrophic
damage table". An escort does not roll: "When an escort is destroyed, replace it
with a Blast Marker" (p. 71) - the notice now says that, and no table opens. **A
gap in the book:** for a one-hit defence p. 101 gives a roll only for "defence
with multiple hits" targets, but the book does not say whether a destroyed
platform leaves a Blast Marker (p. 71 speaks of escorts). The page says only "no
roll (p. 101)" and does not invent a marker.

**T28. VP the defences concede.** p. 123, "Escort Ships, Orbital Defences and
Other Vessels": "Each destroyed planetary defence installation earns a player a
number of victory points equal to the installation's points value. Each destroyed
escort earns its value in victory points provided the entire escort squadron is
destroyed." **Reading:** a defence that stays in place (`R.defence.stationary`)
is an installation. (1) One-hit platforms, silos and air bases concede their
points piece by piece (the unit's points / pieces x destroyed) - not all or
nothing like an escort squadron. (2) A station, a dock, a Blackstone, a Tau
orbital and the Haven with many hits concede their points only when destroyed;
**crippled concedes nothing**, because the 25 % on the same page is explicitly
"If a capital ship is crippled". The alternative reading (not chosen): p. 101
"these work just like capital ships" -> 25 %; p. 101 limits that sentence to
taking damage, though ("When it comes to taking damage"). If you play otherwise,
add the 25 % by hand; in the code the decision is one line (`conceded`:
`isInstallation`). (3) A star fort is destroyed only when all four quadrants are
at zero (Fleets p. 502) - a crippled or destroyed quadrant concedes nothing; the
commander's points are included as on a flagship (T11). (4) The Defence Monitor,
the System Ship and the Fire Ship are of the type Escort/1 (Fleets pp. 514-516),
so the escort sentence applies to them: points only when the whole squadron is
destroyed, disengagement as for escorts (p. 57). The alternative (not chosen):
they too are "planetary defences" and would pay ship by ship. (5) **A gap in the
book:** a Fire Ship that blew itself up (p. 516) - the book does not say whether
it is "destroyed" for VP (mines have a sentence of their own, the fire ship does
not). The page does not tell a shot one from a detonated one: ticked = gone, and
the squadron pays when all are gone. (6) Orbital mines bought singly: "count for
victory points when destroyed, regardless of how they are removed from play"
(Fleets p. 512) - every ticked mine is its points (5). A minefield is not
destroyed but suppressed, and the mines released from it "do not normally count
for victory points" (p. 513) -> a minefield concedes nothing. The page's VP sum
now counts all rows (`vpTotal`), not only ships.

**T29. The star fort's four quadrants.** Fleets pp. 501-505 (the
Fortress-Monastery likewise, pp. 110-111). In the game state `st.quads` = four
{hits, crits} and `st.qsel` = the chosen one. **The names NW / NE / SW / SE** are
the printed card's: the book's diagram on p. 501 names the quadrants
North/East/South/West and draws the docking piers between them; in the user's
physical model the piers are at the cardinal points and the quadrants between
them. The chosen quadrant is the one whose track, shields, turrets, quadrant
weapons, criticals and repair dice (p. 502 "Damage control is also undertaken
individually") the card shows and where the next HIT/CRIT goes ("All damage and
criticals only affect the quadrant that they are inflicted against", p. 501). The
choice is a choice of view, not an event: it takes no UNDO step and does not
close an open table. A quadrant is crippled at six hits ("crippled individually
once they are reduced to 6 Damage Points", p. 501) and gone at zero: further hits
do nothing and it is an asteroid field (p. 501) - its weapons fall silent,
shields and turrets 0, the HIT button disabled. The fort is destroyed only when
all four are at zero (p. 502); only then does the D6 table (p. 505) open, without
the ships' "Boarded to 0" button, because only a space hulk may board a fort
(p. 502, p. 111). **The Basilica rows** (`zone: "basilica"`) belong to the whole
fort. Interpretation: a quadrant's crippled does not halve them (the book does
not say this separately; it follows from p. 501's sentence that damage affects
only the quadrant hit). Brace halves them ("as normal", p. 503) and a critical 11
in any quadrant takes them ("the Basilica weapons are lost", p. 505) - this one
effect of the fort's critical is derived, the others are counted and shown (T5):
6 Reactors, 9 Command Tower -2 Ld, 10 Shields and 11/12's "every quadrant D3/D6"
are done by hand quadrant by quadrant. Boarding value: the remaining hits of all
quadrants + the boarded quadrant's turrets (p. 502). **An old save** (one track):
hits and criticals move to the NW quadrant (`PLAY.adoptUnit`); if the save
already had a Catastrophic result, the player had declared the fort destroyed,
and it stays destroyed (all four at zero) with its result.

**T30. A fixed Leadership.** `R.leadership.kind === "fixed"` on a ship: 7 for
planetary defences - "do not roll for leadership or have a leadership value ... on
a nominal leadership of 7" (p. 100; the same in the box on Fleets p. 499) - and 10
for the Fortress-Monastery ("base leadership of 10", Fleets p. 111). The set-up
screen shows a pill with the value, the reason and the page, no dice tiles, and
the unit does not block starting the game; the Ld pop-up shows the unit's own rule
row. The Ramilies rolls ("rolled as for a capital ship", p. 503) and the Haven
rolls (p. 336). In a game saved before 8.10.2026 a value tapped for the
Fortress-Monastery changes to the book's 10. **A conflict on Fleets p. 499:** at
the end of the left column, after the "In a campaign" paragraph, there is a loose
sentence "However, they automatically pass any other leadership tests they may be
required to make", while the same page's box and p. 100 say "They also make all
other leadership checks they may have to make against Ld 7". The page shows the
builder's rule row (Ld 7); the conflict is recorded, not resolved silently. A
commander in the fort: his own value replaces the fort's ("their own Leadership
value is used by the fort", p. 503; the Fortress-Monastery "even if less!",
p. 111); when he moves off, the fort gets its own value back.

**T31. The orders a unit may take.** `R.orders` limits the order menu, `canOrder`
and the INFO table: defences only Reload Ordnance and Brace (p. 100), the
Ramilies, the Fortress-Monastery and the Haven also Lock On (Fleets pp. 503, 111,
336). The reason and the page show on the unit's own rule row (`R.rules`, slot
"orders") - the page does not write the rule again. The fort's per-quadrant
orders ("split orders", p. 503) are not tracked: the page has one order and one
brace for the whole fort.

**T32. Who a commander may ride with.** Only a capital ship, a star fort ("Fleet
Commanders may be placed aboard a Ramilies", Fleets p. 503; "aboard a fortress",
p. 111) or the Haven ("can lead the battle aboard it instead of a ship", p. 336 -
recognised from the Haven's own rule row, because the builder has no field for
this). Never a platform, a station, a Blackstone, an air base or a defence ship:
they have no Ld value at all (p. 100). The default flagship is the largest real
capital ship; a fort only when there are no ships; otherwise no one (the
commander stays on his own row). A star fort gets no SQN button ("A Ramilies Star
Fort cannot squadron with other orbital defences", p. 100). The Ramilies' own
re-roll (p. 503) comes from the builder as the ship's own row; the rule "added to
the commander's own re-rolls" is not merged into the pool - with the commander
aboard, both rows of boxes are on the same card.

**T33. A defence that stays in place.** `PLAY.isStill`: the builder's
`R.defence.stationary`, otherwise the profile's speed 0 or a dash. A speed "0"
without cm (Fleets pp. 506-511, 517) is read as a number; crippled never shows
-5 cm (p. 65's reduction is a moving ship's; "Satellite units may not move",
p. 100; "defences never drift, they always remain in place", p. 101). The row
reads STATIONARY in place of the speed and turns; the played mark goes TO PLAY <->
SHOT without a MOVED state. **Interpretation:** the disengagement switches are not
shown - the disengagement test is made "at the end of its Movement Phase" (p. 56),
and a unit that does not move cannot leave the table. Removing D6 Blast Markers in
the End Phase (p. 101; the Ramilies from the whole fort p. 502; the Haven p. 336)
is the unit's rule row (INFO and the blast pop-up), not a counter. **The Defences
Critical Hits Table** (p. 101): the builder gives it to multi-hit stationary
defences with a heading that does not start with "CRITICAL DAMAGE", so the ships'
table effects (no turns, -10 cm, Ld -3, location weapons) do not hit them -
tested. Per T5 the results are counted and shown, but the table's own effects are
not derived: 10 does not zero the shields, 6 does not halve shields and turrets,
the FIRE mark is not a button, and the "+1" of rows 6 and 8-9 is tapped on the
track by hand. 11 and 12 ask for the D3/D6 as before.

**T34. Rule cards: mines, minefields, fire ships.** A hull-less row that has
`R.ruleCard` is a real row: name, number, points, page and a one-sentence
description; the name opens a card with all the steps (`R.ruleCard.steps`,
heading + text - the builder's text, the page does not write the rule itself),
and with INFO on the steps also show on the row. Orbital mines have a tick per
mine (tick = the mine has left play, T28). A minefield has a number and a note on
its size, which is rolled at set-up (D3 x 5 cm twice, Fleets p. 513) - the size,
the detection rolls and the mines released from the field are not recorded. The
Fire Ship is a ship (Escort/1, p. 516): member boxes as for a squadron, "No
armament" in place of the weapon table and its steps always visible on the row and
the card.

**T35. The attack craft limit with defences.** With Tracking "Fleet counters" on:
`PLAY.launchBays` counts the bays of every living member of a squadron (two air
bases 2 x 4, Fleets p. 517) and of every quadrant of a fort - halved when
crippled, zero when destroyed - doubled for the Ramilies ("up to twice the attack
craft markers as the number of launch bays it has remaining", Fleets p. 502), not
for the Fortress-Monastery ("Use the value listed in its profile", p. 111;
recognised from the builder's rule row).

**T36. The smoke test.** Nothing used to run the Play page's own code.
`smoke_play.js` loads the BUILT page (`dist/registry/play/`, made by
`npm run build`) into Node's vm with a stub DOM and plays fleets through: an
Imperial Navy fleet with a commander, a capital ship, an escort squadron and every
PLANETARY DEFENCES row of the list; the Space Marines Crusade (the
Fortress-Monastery, continuing an old save); the Eldar (the Haven); the Tau (the
orbitals). Every set-up screen, row, card (INFO on and off, tracking on and off),
pop-up and menu is drawn; the test fails on an exception or on "undefined"/"NaN"
text, and claims read from the book are checked on top (the page in the claim).
`test_play.js` runs it at the end (`--rules` skips it). A new defence row enters
the smoke test by itself. Two old defects of the page that the smoke test brought
out were fixed at the same time: the card's SPEED box always showed a struck-out
base value ("20 cm ~~20~~"), and the Fleets book's pages showed in notices
without the book's name ("p. 423").

**T40. An Ld choice of 5-10, no automation.** **The user's decision 13.10.2026:**
Leadership automation of any kind is entirely out of scope for Play; just a
simple choice by the user. The player chooses the value and makes the related
sums themselves. **The menu.** The set-up screen and the Ld pop-up offer the values
5-10 (`PLAY.LD_VALUES`) to every unit that rolls: the Rulebook's table gives 6-9
(p. 45), the Orks, the pirates and transports 5-8 ("a Leadership range of 5 to 8",
Fleets p. 358; p. 178, p. 85), the Adeptus Mechanicus 7-9 (p. 118), the Eldar and
the Dark Eldar 7-10 (pp. 302, 342), the Space Marines 8-10 (p. 94), and "Grey
Knights count as Space Marines in all respects" (p. 144); nothing rises over 10
(p. 48). One fleet has ships of several tables, so the menu is not narrowed per
ship. **Not derived.** A ship's own +1 (Emperor p. 53, Oberon p. 56, Nicassar
Caravan p. 492): the page added it by itself for one day (BACKLOG J196) and it was
removed the same evening (J198) - the player chooses directly the value the ship
tests with. For the same reason the page does not model the Demiurg's fixed
starting Ld and its fall with damage (pp. 488-490), the transports' -1 (pp. 85,
289, 333, 476), the Chaos Space Hulk's -1 (p. 287), a Dhow's Ld from its mother
ship (p. 491), the Sepulchre's Ld 10 (p. 400), the Veteran Captain (p. 38) or the
Inquisitor's ship's +1 (pp. 140-142). The earlier reading (the commander's value
replaces the ship's natural Ld and the ship's +1 stays on top) lapsed: the page
adds neither. **Outside the menu.** A Tyranid Vanguard squadron's Ld is the number
of ships left in the squadron (p. 429), so it can be under 5; it is not chosen
from the menu but read from the table. **Unchanged, confirmed by the user
14.10.2026** (not removed; made before J196, see T8): the commander's Ld row on the
flagship, the defences' fixed Ld 7 (p. 100) and the Fortress-Monastery's Ld 10
(Fleets p. 111), a squadron's highest Ld (p. 95) and the tracked Bridge Smashed
critical's -3 (p. 67).

**T41. Fire and repair in every End Phase.** p. 88: "Both players can attempt to
repair critical damage during the End Phase" and p. 67 Fire!: "Roll to repair
(extinguish) the fire in the End Phase, if it is not put out it causes one point
of extra damage and keeps burning". **Reading:** the End Phase is at the end of
each player's turn, and both repair in it, so a fire can burn twice per round (the
simulator does the same: `endPhase` repairs all living ships). So the FIRE button
is not locked for the turn; it counts how many times the fires were added this
turn ("added 2x this turn", J192's counter model), and a wrong tap is undone with
UNDO. The order in the End Phase panel is the book's: repairs first (p. 88 item
2), then the fires that burn (p. 67).

**T42. The builder's squadrons start as SQN groups.** J222 (20.10.2026): the
builder saves a squadron id `sq` for a unit (J216; the same letter = the same
squadron, `apps/registry/docs/save-format.md`). A new game (`newGame` ->
`builderGroups`, also from a link or a pasted fleet) gives an SQN group to the
ships for which Set up offers the SQN button (`sqnShip`: a capital ship, not an
escort and not a star fort, p. 100). An id that is on at least two such ships gets
a letter A-C in the alphabetical order of the builder's ids (the builder's B and D
-> A and B), because the page has three SQN letters and their colours. **Limits:**
a lone id (the Clanz one-kroozer skwadron p. 372 or an unfinished squadron) makes
no group, because a one-ship group changes nothing on the table; the fourth and
later squadrons start without a group; an escort squadron and a Blood Axe tiddla's
commandeered escorts (J220) stay units of their own as before. The page does not
enforce the squadron: a squadron the builder shows as red (e.g. a battleship and a
grand cruiser together, Fleets p. 13) still starts as a group, because it is the
fleet the player saved. The SQN button changes the group as before, and a
continued game keeps its own groups (`G.grp` in the game save). Smoke test: two
Lunars with the id C in the same group; a Lunar without an id, a lone Lunar with
the id E and an escort squadron with the id C without a group.

**T43. Every commander aboard a ship of his own (the Orks' Warlords).** J233
(25.10.2026, Discord: *"you can only assign one of the warlords to a ship, the
other two are left just floating"*). p. 123: *"Assign the Fleet Commander(s) to
their ship(s)"*, and the VP of a destroyed ship includes *"any Admiral, Warmaster
or Chaos Lord on board"*. For the Orks every Warlord *"must be assigned to a ship
or squadron"* (Fleets pp. 365 and 366), and in the Clanz his place is *"the most
expensive ship under his own command ... even if it is an escort"* (p. 372).
**The model.** The fleet's commander is on the flagship as before (`G.flag`), and
every other commander is on his own ship (`G.on[j]`, in the game save). A game
saved before J233 gets `G.on` when it is continued. By default the builder's
placement (`resolveFleet().aboard`) is used, when the book or the player has
decided it. Otherwise the commander goes to the first ship without another
commander. A Warlord's alternatives are the builder's `choices`, escort squadrons
included (`carriersOf`). For other commanders the alternatives are as before
(T32). A commander with one alternative is shown a pill *aboard X*, one with
several a menu. **In the game.** There is no floating row: every commander's CMD
row and own re-roll boxes are on his ship's card. Unnamed commanders of the same
type are numbered the builder's way (Ork Warlord 1, 2, 3). In the Clanz (at least
two Warlords) the ship has a W1/W2/W3 tag in the colour of the Warlord's clan or
of his number (the builder's J226 colours), because a Warlord's re-rolls *"only
count for the skwadrons under his command"* (p. 372). A Clanz Warlord's *"+2 to
one boarding dice roll per game"* (p. 372) is a one-use box in the row of re-roll
boxes. On the Waaagh! and Cyclops lists the CMD row reads *"his ship doubles its
boarding value"* (pp. 366/365), but not on a hulk (p. 390). The top bar's RR
counter is hidden when there are several Warlords, because it would be only the
first Warlord's pool. **Interpretation.** Bridge Smashed (p. 67) speaks of *"the
Fleet Commander's flagship"*. A second or third Warlord (the same commander row as
the fleet's commander, `coCmd`) leads his own ships, so Bridge Smashed on his ship
takes **his** re-rolls. A lower commander (Chaos Lord, Veteran Captain) does not
lose his own, because the book does not say so. The minus of a wrongly tapped 9
returns the boxes as in T26. **Ld.** T40 is unchanged: another commander's Ld row
is the player's to tap, and it is not added to the ship's Ld. The Clanz Ld swap
(p. 372) is in the Set up instructions. **VP.** Every commander's points belong to
his ship's VP (`cmdPts`, p. 123), so now a Chaos Lord's points too. Smoke test:
three Clanz Warlords, the third one's ship is an escort squadron. The test checks
the placement, that there are no floating rows, the boxes on the card, the W tags,
Bridge Smashed only for W2 and its undoing, and continuing an old save.

**T44. Roll Ld and the pre-game upgrade dice (prototype).** **The user's decision
31.10.2026** (Joona, project thread): *"Roll Ld button: roll the Ld for every ship
by its fleet's rules, but leave a way to change it; a short collapsible guide to
the fleet's Ld rules; the same for the upgrades that are rolled (AdMech, Ork
clans etc.), with a manual option and changes after the roll"*. This lifts T40's
"no automation" for the roll itself; T40's menu (5-10) and its taps stay, and a
tapped value always wins. **The roll.** `PLAY.ldPlan(R)` picks the table from the
card's own rule lines: the Rulebook's (p. 45), the Space Marines' (Fleets p. 94,
Grey Knights p. 154), the Adeptus Mechanicus' (p. 118) for every vessel of the
Explorator list - its Navy and Astartes escorts too, since the Astartes crew rule
is not on them there (`astartes_core` notList Mechanicus) and the table is "for a
given vessel". Added to the die: Orks -1 (p. 360), pirates -1 (p. 188), Eldar and
Dark Eldar +1 (pp. 304, 344), a Chaos Space Marine crew +1 (p. 234), a transport
-1 (pp. 85, 291, 331, 476), the ship's own +1 (Emperor p. 53, Oberon p. 56, their
Mechanicus copies pp. 128, 130, Nicassar Caravan p. 492); at most 10 (p. 48). Not
rolled but put in by the same button: an Ork Hulk 6 (p. 392), a Sepulchre ship 10
(p. 406), a Demiurg's starting value (pp. 488-490; its fall with damage is not
tracked). Left to the player: the Tyranids (pp. 418-420, 429), the Ork
battleships' and the Clanz Warlord's Ld swaps (pp. 374, 376-381), a Space Marine
Captain on a Navy ship (p. 109), the Inquisitor's +1 (pp. 140-142), Long Range
Sensors (p. 185) - the guide names them. One roll per escort squadron (p. 45); a
fleet commander's fixed value on his flagship is not rolled over (T8). A natural 6
on the Mechanicus table marks the ship's Gift as one it may choose (p. 118).
**The other dice** (`packages/ui/pregame-tables.js`): the Mechanicus Gift (p. 119),
special torpedoes (pp. 19-21), a Xenotech system (pp. 151, 185; a chosen one is
picked, not rolled), the Blood Axes' Imperial Navy refit (p. 371, T61's tables), a
Rogue Trader crew skill (the die only: the Rulebook's table, p. 159, is not in this
project). Each has a select to pick or change it. **No re-roll** (the user, 31.10.2026: *"no
re-roll all buttons; an edit is like a manual input"*): the buttons roll only what
is still without a value and are gone once everything has one, and the rolling is
an option beside the taps; the result is printed on the card
with its page, and its effect is not applied to the stats. **Not covered yet:** the
Bakka Fleet-Admiral's rolled refits (p. 48) and the Mechanicus experimental
cruiser (p. 124).

**T45. Repair with one tap.** **The user's request 1.11.2026.** Repair on a
ship rolls its damage-control dice (p. 88), repairs, and adds the hit of a fire
left burning (p. 67). The book says each 6 "enables the ship to repair one
critically damaged system or put out one fire" and does not rank them, so the
page does not either: when the sixes cannot repair everything and more than one
kind is on the ship, the player picks; otherwise there is nothing to choose and
it goes at once. Dice: `PLAY.repairPlan`, from the card's own repair line. Necrons
4+ (Fleets p. 404). Mechanicus +1D6 (Fleets p. 120) is added **after** Blast
Markers halve the dice: "always add +1D6". Repulsor Shielding ignores the halving
until Shields Collapsed. With the orders track on, each End Phase rolls once (a
turn's mine/enemy half); without it the page cannot tell the two End Phases apart
and a second roll stays open. Own dice still work: the End Phase panel's taps are
unchanged. Docking's 2 extra dice (Fleets) and a re-roll of damage control are not
applied by the button; the ship's rule lines say so and UNDO plus the taps do it.
**T46. A ship's Actions: ram, disengage, teleport.** **The user's request
1.11.2026.** The top corner of a card opens Board, Ram, Disengage and Teleport
attack. Each says the rule, works out the dice and rolls if asked; Passed and
Failed are for own dice. **Leadership.** The ship's own value with a smashed
bridge. p. 48's Under Fire and enemy contacts are headed "Command check modifiers",
and neither the ram test (p. 55, "a Leadership test") nor disengaging (p. 56, its
own list) is a Command check, so they do not apply: an open reading. **A contradiction, recorded.** The table on p. 56 gives
celestial phenomena +3, while the example on p. 57 counts three Blast Markers and an
asteroid field as +4 (Ld 9 to 13), which would make the field +1. The page uses
the table. The example's point stands either way: 11 and 12 fail. **Half.**
The rammed ship's "half its starting damage" rounds up as p. 64 does; the book's
example is even. **What it marks.** Ram: hits on this ship through the track, the
target's hits are said to its player, as Board does. Disengage: passed sets
`disengaged` on the card or the whole escort squadron (p. 57); failed sets
no-fire and takes a capital ship out of its squadron (p. 57). Teleport: the
once-a-turn flag; the result is on the enemy. **Not done:** criticals from a ram's
hits and a ship's own ram rules are the player's (its rule lines are shown).

**T47. Celestial phenomena in Actions.** **The user's request 1.11.2026.** The
Rulebook's phenomena (pp. 109-115) in short. Three have helpers. **Asteroids**
(p. 110): the Leadership test, then D6 less the shields up; hits go on a capital
ship's track, an escort squadron's are tapped by the player, because the book shares
them among the ships that touched. **Gas and dust** (p. 110): one Blast Marker on the
ship. **Warp rift** (pp. 111-112): 3D6, Eldar 2D6 (FAQ 2026, *Warp Rift*). A ship
lost in the warp "disappears from the battle". **The user's decision 1.11.2026:**
it is destroyed and gives its full points, the same as exploding in an asteroid
field, not a disengaged ship's. An escort card loses one ship. Planets, moons,
Sunward, solar flares and radiation bursts are text; flares and bursts belong to
the whole table, not to one ship, and the burst's Leadership is the menu's existing
counter, which the helpers of T46 and T47 also subtract (p. 115). Leadership as in T46.

**T48. Blast Markers on or off, no counter.** **The user's decisions 1.11.2026.**
The page does not count Blast Markers, and shields show as printed; T1 no longer
applies on the card. The menu's Blast Markers switch gives each card an on/off
button: a marker in contact or not. On, it is Under Fire -1 (p. 48) and half the
damage-control dice (p. 88), since both only ask whether there is any. Off, Repair
has a second button for the half dice. A gas cloud (p. 110) is text only.

**T45, fire, changed by the user 1.11.2026.** Repair never adds a fire's hit: the note says one still burns, and the fire chip or the End Phase button adds it. Nothing adds it by itself: the change of turn lists the ships still burning in the bottom bar.

**T45, changed by the user 1.11.2026.** Repair sits in the critical table, and every
success is a wrench the player spends by tapping what to repair, even with only one
kind on the ship. The menu's Auto repair brings back the first form described above.
The table offers Full repair and Half repair side by side, with the reason (p. 88); with Blast Markers tracked the ship's state marks one, and the other stays on offer.

## What is not tracked, and why

- The strength of torpedo salvoes and attack craft markers on the table
  (pp. 76-77): they are objects on the table, not the ship's state.
- Assigning turrets to torpedoes vs. attack craft per Ordnance Phase (p. 80):
  small, once per phase and obvious at the table.
- In formation / not in formation (p. 96), grapple (p. 90), teleport used
  (p. 92): left out; a note in the NOTES field.
- Of the star fort (the quadrants' hits and criticals are tracked, T29):
  per-quadrant orders (p. 503), per-quadrant blast markers and shields (p. 502 -
  tracking has one marker counter for the whole fort), massed turrets (p. 502),
  rotation (p. 502), docking (p. 503) and criticals 11/12's "D3/D6 for every
  quadrant" (p. 505, by hand).
- The Defences and Star Fort critical tables' own effects (p. 101, Fleets
  p. 505): the results are counted, the player applies the effects (T33) - except
  the loss of the Basilica from critical 11 (T29). Falling D6 cm per turn after
  Orbit Lost is a matter for the table.
- A minefield's size, detection rolls and the mines released from the field
  (Fleets p. 513): they are not VP and not the unit's state (T34).
- The low orbit table (Fleets p. 498): silos and air bases are rows like the
  others; the page does not know which table they are on.
