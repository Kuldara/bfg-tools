/* The refit table a Blood Axe Warlord's ship rolls on (user 29.10.2026,
   prototype A in Battlefleet Gothic/protot/bloodaxe_refit, as a collapsible
   box under the row and without recording the roll): "The Warlord's ship may
   take one refit from the Imperial Navy refit table (rolled randomly) for +20
   points" (Fleets p. 369).

   Ruling T61 (open interpretation): the book prints no table of that name;
   it is the Rulebook's refits, "the standard Imperial Navy refit table" the
   Mechanicus also earn refits from (Fleets p. 122): a D6 for the kind (p. 156,
   1-2 ship, 3-4 engine, 5-6 weapons refit), then a D6 on its table (pp.
   158-159); a result the ship already has is rolled again (p. 156).

   Each result's effect in short; its name and page on hover. */
import { esc } from "../../../packages/ui/format.js";

export const IN_REFITS = [
  { roll: "1–2", name: "Ship refit", page: 158, rows: [
    ["Improved Sensor Array", "+2 Ld, not +1, for enemies on special orders"],
    ["Additional Shield Generator", "+1 shield"],
    ["Superior Damage Control", "one more repair die in the End phase"],
    ["Reinforced Hull", "+25 % hits (rounded up), −5 cm speed"],
    ["Improved Logic Engines", "no −1 Ld from blast markers in contact"],
    ["Overload Shield Capacitors", "each hit on the shields: 6 = ignored, no blast marker"]] },
  { roll: "3–4", name: "Engine refit", page: 158, rows: [
    ["Secondary Reactors", "an extra 2D6 on All Ahead Full"],
    ["Evasive Jets", "Ld test at the start of the enemy's shooting: turn 45°; no special orders next turn"],
    ["Manoeuvring Thrusters", "turns after 5 cm less"],
    ["Arrester Engines", "+1 Ld for Burn Retros and Come to New Heading"],
    ["Auxiliary Power Relays", "+5 cm speed"],
    ["Navigational Shields", "no speed lost for blast markers, gas or dust"]] },
  { roll: "5–6", name: "Weapons refit", page: 159, rows: [
    ["Extra Turrets", "+1 turret"],
    ["Turbo-weapons", "no right column shift beyond 30 cm"],
    ["Targeting Matrix", "weapons batteries: one column left on the Gunnery table"],
    ["Auto-loaders", "+1 Ld for Reload Ordnance (re-roll if it has no ordnance)"],
    ["Superior Fire Control", "+1 Ld for Lock On"],
    ["Motion-Tracking Targeters", "on AAF, Burn Retros or CTNH: firepower and lances −25 %, not halved"]] }];

/* The box under the row: shut until opened, and it stays as the player left
   it (open, a Set of keys, lives in appState: the fleet pane is drawn anew on
   every click). key: the unit's uid and the row's key. */
export function refitInfoHTML(key, open){
  return `<details class="upinfo" data-upinfo="${esc(key)}"${open ? " open" : ""}>
    <summary>How the refit is rolled <span>D6 kind, D6 table &middot; 18 results</span></summary>
    <p class="rfx-how">Roll a D6 for the kind: <b>1&ndash;2</b> ship, <b>3&ndash;4</b> engine, <b>5&ndash;6</b> weapons refit; then a D6 on that table.
      A result the ship already has is rolled again.</p>
    <div class="rfx-tabs">${IN_REFITS.map(T => `<div class="rfx-t"><h6><span>${T.roll}</span>${esc(T.name)}</h6><ol>${
      T.rows.map((r, i) => `<li title="${esc(r[0] + ": " + r[1] + " (Rulebook p. " + T.page + ")")}"><b>${i + 1}</b><span><i>${esc(r[0])}</i> &ndash; ${esc(r[1])}</span></li>`).join("")}</ol></div>`).join("")}</div>
    <p class="rfx-src">Blood Axes, Fleets p. 369; the refit tables, Rulebook pp. 156, 158&ndash;159 (ruling T61)</p>
  </details>`;
}
