/* The tables a fleet rolls on before the game, other than Leadership (that
   one is in apps/play/rules.js, PLAY.ldPlan): what a bought upgrade or a
   fleet rule leaves to a D6. Shared by the Registry (the card prints the
   table) and Play (the set-up screen rolls it, user 31.10.2026, RULINGS.md
   T44). Each table: rows[d - 1] = [name, short effect]; the effect may hold
   HTML entities, the name never does. */

/* Fleets WiP p. 119. "Mechanicus capital ships must also roll a D6 once
   against the Mechanicus Gifts table." The text is condensed for the card;
   the keyword at the start says what the gift affects. */
export const ADMECH_GIFTS = [
  ["Energy Reserves",      "CRIPPLED", "turrets/shields/weapons 75 %, not 50 %"],
  ["Advanced Engines",     "SPEED",    "+5 cm; AAF +1D6"],
  ["Repulsor Shielding",   "BLAST",    "ignore blast/gas; lost if Shields Collapse"],
  ["Fleet Defence Turrets","TURRETS",  "2 turrets: +2 to self or 1 ship &lt;=15 cm"],
  ["Targeting Matrix",     "ORDERS",   "AAF/CTNH/Burn: weapons 75 %; no nova"],
  ["Weapon Relays",        "GUNNERY",  "batteries shift left; lance 6 = double"]
];

/* The refit table a Blood Axe Warlord's ship rolls on: "The Warlord's ship
   may take one refit from the Imperial Navy refit table (rolled randomly)
   for +20 points" (Fleets p. 371). Ruling T61 (open interpretation): the
   book prints no table of that name; it is the Rulebook's refits, "the
   standard Imperial Navy refit table" the Mechanicus also earn refits from
   (Fleets p. 123): a D6 for the kind (p. 166, 1-2 ship, 3-4 engine, 5-6
   weapons refit), then a D6 on its table (pp. 158-159); a result the ship
   already has is rolled again (p. 166). */
export const IN_REFITS = [
  { roll: "1–2", name: "Ship refit", page: 168, rows: [
    ["Improved Sensor Array", "+2 Ld, not +1, for enemies on special orders"],
    ["Additional Shield Generator", "+1 shield"],
    ["Superior Damage Control", "one more repair die in the End phase"],
    ["Reinforced Hull", "+25 % hits (rounded up), −5 cm speed"],
    ["Improved Logic Engines", "no −1 Ld from blast markers in contact"],
    ["Overload Shield Capacitors", "each hit on the shields: 6 = ignored, no blast marker"]] },
  { roll: "3–4", name: "Engine refit", page: 168, rows: [
    ["Secondary Reactors", "an extra 2D6 on All Ahead Full"],
    ["Evasive Jets", "Ld test at the start of the enemy's shooting: turn 45°; no special orders next turn"],
    ["Manoeuvring Thrusters", "turns after 5 cm less"],
    ["Arrester Engines", "+1 Ld for Burn Retros and Come to New Heading"],
    ["Auxiliary Power Relays", "+5 cm speed"],
    ["Navigational Shields", "no speed lost for blast markers, gas or dust"]] },
  { roll: "5–6", name: "Weapons refit", page: 169, rows: [
    ["Extra Turrets", "+1 turret"],
    ["Turbo-weapons", "no right column shift beyond 30 cm"],
    ["Targeting Matrix", "weapons batteries: one column left on the Gunnery table"],
    ["Auto-loaders", "+1 Ld for Reload Ordnance (re-roll if it has no ordnance)"],
    ["Superior Fire Control", "+1 Ld for Lock On"],
    ["Motion-Tracking Targeters", "on AAF, Burn Retros or CTNH: firepower and lances −25 %, not halved"]] }];
/* the kind die: 1-2 ship, 3-4 engine, 5-6 weapons refit (Rulebook p. 166) */
export const inRefitKind = d => IN_REFITS[Math.floor((d - 1) / 2)];

/* Special torpedoes, Fleets pp. 19-21: "roll a D6 before the game, one type
   per ship" (the special_torpedoes rule in packages/rules). * = for the
   whole game, the rest for one salvo. */
export const SPECIAL_TORPEDOES = [
  ["Short Burn", "whole game: speed 40 cm; a 6 after the attack turns the salvo into a Blast Marker"],
  ["Guided", "whole game: turns up to 45° in the Ordnance phase on a passed Ld test"],
  ["Seeking", "one salvo: turns up to 45° toward the nearest (largest) enemy; 5+ to detonate in Blast Markers"],
  ["Barrage Bombs", "whole game: may launch in low orbit; hit ships like direct fire"],
  ["Melta", "one salvo: each hit is an automatic Fire critical instead of damage"],
  ["Vortex", "one salvo: each hit causes a critical"]
];

/* Xenotech systems, Fleets p. 185 (Rogue Traders; the Ordo Xenos
   Inquisitor's ship the same table, p. 151), in the book's order. */
export const XENOTECH = [
  ["Long Range Sensors", "+1 to base Leadership (max 10)"],
  ["Targeting Matrix", "all targets count as closing within 30 cm; no right shifts beyond 30 cm"],
  ["Advanced Shielding", "+1 shield"],
  ["Ship Defence Grid", "+1 turret"],
  ["Advanced Drive Technology", "+5 cm speed, +1D6 on All Ahead Full"],
  ["Gravitic Thrusters", "doubles the maximum turn"]
];

/* What a unit rolls before the game besides its Leadership, from what the
   card already knows: R.gifts (a Mechanicus capital ship, Fleets p. 119),
   the upgrades taken and the commander's row. Each roll: key (stored under
   st.pre[key]), title, page, two (a kind die before the table die: the IN
   refits), rows (one table) or tables (IN_REFITS), and pick: the player
   chooses instead of rolling (a bought choice). A crew skill is rolled on
   the Rulebook's table (p. 159), which is not in this project: the die is
   recorded and the player reads the result from the book. */
export function pregameRolls(R){
  if(!R) return [];
  const taken = (R.upgrades || []).filter(u => u.state === "take").map(u => String(u.label || ""));
  const has = re => taken.some(l => re.test(l));
  const out = [];
  if(R.gifts) out.push({ key: "gift", title: "Mechanicus Gift", page: 119,
    rows: ADMECH_GIFTS.map(g => [g[0], g[1].toLowerCase() + ": " + g[2]]),
    note: "D6 once per Mechanicus capital ship; re-roll a gift the ship cannot use. A natural 6 on its Leadership roll lets it choose the gift instead (Fleets p. 118)." });
  if(has(/^Special torpedoes \(/)) out.push({ key: "torp", title: "Special torpedoes", page: 19, rows: SPECIAL_TORPEDOES,
    note: "D6 before the game, one type per ship (Fleets pp. 19-21)." });
  const xenoRow = has(/^Xenotech System, rolled randomly/) || /^ordo xenos inquisitor lord/i.test(String(R.className || ""));
  if(xenoRow) out.push({ key: "xeno", title: "Xenotech system", page: R.kind === "commander" ? 151 : 185, rows: XENOTECH,
    pick: has(/^Choose the Xenotech/),
    note: has(/^Choose the Xenotech/) ? "Chosen, not rolled (bought for +5 pts): pick it." : "D6, or chosen when bought for +5 pts. Long Range Sensors: add the +1 to the ship's Leadership yourself." });
  if(has(/^Imperial Navy refit, rolled randomly/)) out.push({ key: "inrefit", title: "Imperial Navy refit", page: 371, two: true, tables: IN_REFITS,
    note: "Blood Axes: a D6 for the kind (1-2 ship, 3-4 engine, 5-6 weapons), then a D6 on that table (Rulebook pp. 158-159, 166; ruling T61)." });
  if(has(/^Crew skill, rolled randomly/)) out.push({ key: "crew", title: "Crew skill", page: 159, rows: null,
    note: "D6 on the Rulebook's crew skills table (Rulebook p. 159; Rogue Traders, Fleets p. 185): read the result from the book." });
  return out;
}
/* The words for a stored roll: { d } or { k, d } for the two-dice refit. */
export function pregameText(roll, v){
  if(!v || v.d == null) return "";
  if(roll.two){ const T = inRefitKind(v.k || 1); const r = T.rows[v.d - 1]; return T.name + " " + v.d + ": " + r[0]; }
  if(!roll.rows) return "D6 " + v.d + " (see Rulebook p. " + roll.page + ")";
  return roll.rows[v.d - 1][0];
}
