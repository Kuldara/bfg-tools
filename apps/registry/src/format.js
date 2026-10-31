import { L } from "./model.js";
import { esc } from "../../../packages/ui/format.js";
import { ADMECH_GIFTS } from "../../../packages/ui/pregame-tables.js";
import DOMAIN from "../../../packages/rules/domain.js";


/* Weapon classes. G / T / O are the badge colours on the project's cards;
   L, N, R and P are new, added so lances, nova cannons, rams and Tau pulse
   weapons stop sharing the generic battery colour. */
export const WEP = DOMAIN.WEP, wepClass = DOMAIN.wepClass;


/* Critical pictograms (v1.2): the ship from above, prow up like the arc
   rosette, the part that was hit filled in. One dark colour, so nine of them
   do not turn the table into a second colour code. */
export const CRIT_HULL = "M12 1.5L16.2 8 17 19 14.6 24H9.4L7 19 7.8 8Z";
export function critIcon(id){
  const ship = z => `<svg class="cic" viewBox="4 0 16 28" aria-hidden="true"><path class="h" d="${CRIT_HULL}"/>${z}<path class="h o" d="${CRIT_HULL}"/></svg>`;
  switch(id){
    case "dorsal":    return ship('<rect class="z" x="10" y="9" width="4" height="8.5" rx=".6"/>');
    case "starboard": return ship('<path class="z" d="M12 8H16.2L17 19H12Z"/>');
    case "port":      return ship('<path class="z" d="M12 8H7.8L7 19H12Z"/>');
    case "prow":      return ship('<path class="z" d="M12 1.5L16.2 8H7.8Z"/>');
    case "engine":    return ship('<path class="z" d="M7 19H17L14.6 24H9.4Z"/>');
    case "thrusters": return ship('<path class="z" d="M8.6 24.6h2l-1 3.2zM11 24.6h2l-1 3.2zM13.4 24.6h2l-1 3.2z"/>');
    case "bridge":    return ship('<rect class="z" x="9.6" y="12.6" width="4.8" height="4.8" rx=".6"/><path class="l" d="M12 12.4V9.4"/>');
    case "fire":      return '<svg class="cic" viewBox="3 0 18 28" aria-hidden="true"><path class="z" d="M12 2C13 8 19 10 19 17.5A7 7 0 0 1 5 17.5C5 13 8.5 12 9.5 7.5 10.8 9.6 12.2 8.6 12 2Z"/><path class="f" d="M12 13C12.6 16 15.4 16.6 15.4 19.6A3.4 3.4 0 0 1 8.6 19.6C8.6 17.6 10.6 16.8 12 13Z"/></svg>';
    case "shields":   return '<svg class="cic" viewBox="3 0 18 28" aria-hidden="true"><path class="h" d="M12 2.5L20 5.5V13C20 18.5 16 22.5 12 25 8 22.5 4 18.5 4 13V5.5Z"/><path class="l" d="M5 23L19 5"/></svg>';
  }
  return "";
}





/* Critical tables and their footers live in domain.js (criticalModel). */
/* Fleets WiP p. 119: the Mechanicus Gifts table, shared with Play
   (packages/ui/pregame-tables.js). */
export { ADMECH_GIFTS };

/* A Mechanicus vessel is a capital ship from the Explorator list. The list's
   escorts are taken from the Imperial Navy and Space Marines lists "otherwise
   unmodified from their normal profiles" (Fleets p. 125), so they are not
   Mechanicus vessels and get neither gifts nor the repair bonus. */
export function isMechanicusVessel(sh){ return DOMAIN.isMechanicusVessel(sh, L()); }

export function giftsHTML(mech){
  if(!mech) return "";
  const cells = ADMECH_GIFTS.map((g, i) =>
    `<div><i>${i + 1}</i><span><u>${esc(g[0])}</u>
      <em><b>${esc(g[1])}</b> ${g[2]}</em></span></div>`).join("");
  return `<div class="k-gift"><b>GIFTS OF THE OMNISSIAH
    <em>&mdash; D6 per capital ship; colour in yours &middot; Fleets p. 119</em></b>
    <div class="k-gg">${cells}</div></div>`;
}

export const CRIP_LINE = DOMAIN.CRIP_LINE, REPAIR_LINE = DOMAIN.REPAIR_LINE,
      CRIT_LINE = DOMAIN.CRIT_LINE, ESCORT_LINE = DOMAIN.ESCORT_LINE;

/* Damage model (crippled line, hulk pages, critical tables): domain.js. */
export const isSpaceHulk = DOMAIN.isSpaceHulk, crippledLine = DOMAIN.crippledLine;


export const isOrkHulk = DOMAIN.isOrkHulk, isChaosHulk = DOMAIN.isChaosHulk, hulkPage = DOMAIN.hulkPage,
      criticalModel = DOMAIN.criticalModel, criticalTriggerLine = DOMAIN.criticalTriggerLine,
      criticalTriggerHint = DOMAIN.criticalTriggerHint;
export function repairLine(sh){ return DOMAIN.repairLine(sh, L()); }

