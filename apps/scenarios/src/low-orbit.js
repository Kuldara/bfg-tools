/* ---------------------------------------------------------------- low orbit table (RB p. 116)
   The low orbit table is drawn on the scenario's map under the main table at the same scale (mapSVG, m.lo; owner 21.10.:
   "best of course if it fits in the same map picture"), and this block is a numbered list of rules whose numbers are on
   the map. LOW_ORBIT = the scenarios with a separate low orbit table. Left out: siege-of-fularis ("No low orbit table is
   needed"), cl-planet-fall (its own 2 cm rule), fan-n-kravertus ("there is no low orbit table"), fan-p-spirit (only docking
   "as if in low orbit") and cl-abhorrence (the whole battle on the low orbit table, no interface). */
export const LOW_ORBIT = new Set(["planetary-assault", "exterminatus", "fall-of-arcianr", "fl-craftworld-assault", "cl-execution-hour", "cl-cerberus-4",
  "cl-belis-2", "cl-belis-3", "cl-belis-4", "cl-damocles-2", "cl-damocles-4", "wr-planet-killer-defence", "wr-planetary-disease", "wr-sw-rebel-world",
  "wr-sw-take-the-stations", "fan-n-governor", "fan-n-line", "fan-p-barrage", "fan-p-into-darkness", "fan-p-scheming", "fan-v-sirvos"]);
export function lowOrbitBlock(sc, st) {
  if (!LOW_ORBIT.has(sc.id)) return "";
  return "<div class='lowo'><p class='small muted' style='margin:0'>Drawn under the map to the same scale, 60 × 120 cm (the book: 45–60 cm wide, 90–135 cm long, one long edge is the planet). It does not join any edge of the main table: a ship goes in from the gravity well (the dashed line) and comes back touching the planet. The numbers match the map.</p><ol class='lorules'>" +
    "<li><b>Entering:</b> a ship within the planet’s gravity well may enter low orbit at the start of any of its turns. Place it touching the low orbit table’s edge furthest from the planet.</li>" +
    "<li><b>The pull:</b> at the start of each player’s turn, every ship within 45 cm of the planet edge moves straight toward it, without turning: small planet 5 cm, medium 8 cm, large 10 cm.</li>" +
    "<li><b>The planet edge:</b> a ship pulled over it is destroyed. Escorts and transports that move over it on purpose have landed and leave play; capital ships cannot land.</li>" +
    "<li><b>Leaving:</b> a ship that moves off any other edge leaves low orbit and goes back on the main table, touching the planet. A ship may not enter and leave in the same turn.</li>" +
    "</ol><p class='small muted'>In low orbit: no move needed before turning; all firepower one column right; lances and nova cannon need a 4+ to fire; no torpedoes. Short of space? A sheet of paper at 1 mm : 1 cm works (RB p. 116).</p></div>";
}
