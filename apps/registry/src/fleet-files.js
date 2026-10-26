import { $, APP_VERSION } from "./boot.js";
import { L } from "./model.js";
import { stashAll, stashUnits, unitDocs } from "./save.js";
import { afterAdd, libAddText } from "./saved-fleets.js";
import { appState } from "./state.js";
import { renderTop } from "./view.js";
import { LISTS } from "../../../packages/ui/catalog.js";
import DOMAIN from "../../../packages/rules/domain.js";

/* ----------------------------------------------------- fleet files ---- */
/* A fleet as a file: the same one-list document save() writes (docs/
   SAVE_SCHEMA.md), tagged with the app's name. Names are the keys and
   indexes only a fallback, so the file survives a book update on the same
   terms as the browser's own save. */
export const FILE_TAG = "Gothic Fleet Registry fleet";
export function fleetDocument(nm){
  const Lx = LISTS.filter(x => x.nm === nm)[0];
  if(!Lx) return null;
  const open = L() === Lx;
  const units = open ? appState.S.units : stashUnits(nm);
  if(!units.length) return null;
  return { app: FILE_TAG, page: APP_VERSION, schemaVersion: DOMAIN.SCHEMA_VERSION,
           ln: nm, limit: open ? appState.S.limit | 0 : (stashAll()[nm].limit | 0),
           units: unitDocs(units, Lx) };
}
/* A fleet file (one fleet or Export all) goes into Saved fleets: nothing on
   screen is replaced, so nothing has to be asked (J208). */
export function importFleetFile(file){
  if(!file) return;
  const r = new FileReader();
  r.onload = () => afterAdd(libAddText(String(r.result || ""), "file"), "the file");
  r.onerror = () => fileNote("The file could not be read.");
  r.readAsText(file);
}
export function fileNote(msg){
  appState.FILE_NOTE = msg;
  renderTop();
  setTimeout(() => { if(appState.FILE_NOTE === msg){ appState.FILE_NOTE = ""; renderTop(); } }, 12000);
}
export const importInput = $("#importfile");
if(importInput) importInput.onchange = e => {
  const f = e.target && e.target.files && e.target.files[0];
  importFleetFile(f);
  try{ e.target.value = ""; }catch(x){}
};

