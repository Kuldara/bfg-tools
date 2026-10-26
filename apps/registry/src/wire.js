import { $ } from "./boot.js";
import { switchList } from "./model.js";

/* -------------------------------------------------------------- wire ---- */
/* Changing the fleet list used to empty the fleet, and asked first because
   that was a real loss. Now each list keeps its own fleet (J146): the open
   one goes into the stash and the new list's own comes back, so there is
   nothing to lose and nothing to confirm. */
$("#listsel").onchange = e => switchList(+e.target.value);
/* Throwing away a fleet kept for another list is deliberate and asks first,
   the same as Clear does for the open one. */
