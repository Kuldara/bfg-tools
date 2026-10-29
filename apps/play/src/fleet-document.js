import { appState } from "./state.js";
import { clone, fnv, listByName, listOf } from "./helpers.js";
import DOMAIN from "../../../packages/rules/domain.js";
import { resolveSaved } from "../../../packages/ui/saved-fleet.js";
import { DATA } from "../../../packages/ui/catalog.js";

/* ================================================= THE FLEET DOCUMENT ===== */
export function parseDoc(raw){
  let o = null;
  try{ o = JSON.parse(raw); }catch(e){ return { error: "That is not a fleet document (JSON could not be read)." }; }
  if(!o || typeof o !== "object" || !Array.isArray(o.units)) return { error: "The document has no fleet in it." };
  if(typeof o.schemaVersion === "number" && o.schemaVersion > DOMAIN.SCHEMA_VERSION)
    return { error: "The fleet was saved by a newer builder (schema " + o.schemaVersion + "); this page reads " + DOMAIN.SCHEMA_VERSION + "." };
  return { o: o };
}
/* The open fleet and every stashed one (schema 4). */
export function fleetsIn(o){
  const out = [];
  if(o.units.length) out.push({ name: o.name || "", ln: o.ln, limit: o.limit, units: o.units, open: true });
  (Array.isArray(o.fleets) ? o.fleets : []).forEach(f => {
    if(f && typeof f === "object" && Array.isArray(f.units) && f.units.length)
      out.push({ name: f.name || "", ln: f.ln, limit: f.limit, units: f.units, open: false });
  });
  return out;
}
/* Resolve exactly as the builder does: resolveSaved (by name, attachment
   filter, one purchase one row) and then the domain. */
export function resolveFleet(f){
  const L0 = listByName(f.ln);
  if(!L0) return { error: "The fleet list \"" + f.ln + "\" is not in this build." };
  const lost = [];
  const kept = resolveSaved(clone(f.units), L0, lost);
  const ctxs = kept.map(u => ({ list: listOf(u, L0), host: L0 }));
  /* a Da Ork Clanz tiddla skwadron's clan and Gubbins are on every row of
     its tag and paid once (Fleets pp. 371-372, ruling T60), as the builder
     resolves them */
  const its = DOMAIN.shareSkwadronUpgrades(kept.map((u, i) => DOMAIN.fromLegacyUnit(u, ctxs[i], DATA)), { list: L0, host: L0 }, DATA);
  const units = kept.map((u, i) => {
    const R = DOMAIN.resolveUnit(its[i], ctxs[i], DATA);
    return R ? { u: u, R: R, it: its[i] } : null;
  }).filter(Boolean);
  return { L0: L0, units: units, lost: lost,
           fp: fnv(JSON.stringify([f.ln, f.units])),
           doc: { ln: f.ln, limit: f.limit, units: f.units } };
}
export function fleetPoints(units){ return units.reduce((a, x) => a + (x.R.points | 0), 0); }
/* Fleet facts (J214): the attack rating, what the enemy gets for free and
   victory points that are not a ship's cost - the builder's own resolveFleet
   on the same units. */
export function fleetFactsNow(){
  if(!appState.L0 || !appState.U.length) return [];
  return DOMAIN.resolveFleet({ list: appState.L0.nm, limit: appState.G.limit | 0, units: appState.U.map(x => x.it) }, DATA).facts || [];
}

