import { KEY, STASH_PTS, stashAll } from "./save.js";
import { appState } from "./state.js";
import { fleetResolved } from "./validation.js";
import { rangeLabel, render } from "./view.js";
import { activeWarlordIdx, clanzSkwadronSec } from "./warlords.js";
import { DATA, LISTS, SHIPS } from "../../../packages/ui/catalog.js";
import { esc } from "../../../packages/ui/format.js";
import DOMAIN from "../../../packages/rules/domain.js";

export const L = () => LISTS[appState.S.li];
/* The list a UNIT was bought from. A borrowed ship (Fleets pg. 14) comes
   from another fleet list, and its u.s, u.e and u.ups all index THAT list -
   so every function taking a unit resolves through here, never through L().
   This is the app's mirror of domain.js listOfIntent, which is not exported;
   the two must agree, because the engine reads u.lst the same way. */
export const listOf = u => (u && u.lst && LISTS.filter(x => x.nm === u.lst)[0]) || L();

/* The list the CATALOGUE is showing. Null means the fleet's own list. It is
   never written onto a unit and never saved: it only decides what the left
   pane offers. Keeping S.li on the fleet's list is what stops a render from
   handing one list's required upgrades to another list's ships - the bug the
   golden driver had to work around (backlog J103). */
appState.SRC_LI = null;
/* The role the catalogue will stamp on the next borrowed ship. Also view
   state only - the unit carries its own role once it is added. */
appState.SRC_ROLE = "reserve";
export const SRC = () => (appState.SRC_LI == null ? L() : (LISTS[appState.SRC_LI] || L()));
/* The catalogue sections the player folded shut or opened, by the shown
   list's name and the section's title - never by index, sections move. The
   catalogue is rebuilt on every render, and each section was written open
   again: a phone player folded Planetary Defences to shorten the scroll and
   the next tap on anything unfolded it all (player report 12.10.2026). View
   state like SRC_LI - not on a unit, not in the fleet document - so it is
   kept under a key of its own for this browser, and only what differs from
   the section's default is stored. */
export const FOLD_KEY = KEY + "-folds";
/* J234: Your fleet one line per unit (Discord 25.10.2026: "a way to
   collapse the fleet legality checks and units so it's quicker to have your
   fleet at a glance"): the player's switch, kept per viewer; one unit opens
   and closes with a tap on its name, for this visit only. */
export const FLEET_FOLD_KEY = KEY + "-compact";
appState.FLEET_FOLD = false;
try{ appState.FLEET_FOLD = localStorage.getItem(FLEET_FOLD_KEY) === "1"; }catch(e){}
export const UOPEN = new WeakSet();
export let FOLDS = {};
try{
  const f = JSON.parse(localStorage.getItem(FOLD_KEY));
  if(f && typeof f === "object" && !Array.isArray(f)) FOLDS = f;
}catch(e){}
export const foldKey = (l, sec) => l.nm + "|" + sec.t;
/* The role is chosen BEFORE the list now, because the two roles offer
   different lists - often with nothing in common. An Ork fleet may take
   reserves from two lists and allies from ten, and not one list is on both.
   Guessing the role from the list the player picked would be exactly the
   mix-up this ordering exists to prevent, so nothing guesses it any more. */

/* Which lists lend to this fleet, and which of their rows. Both answers come
   from the engine, never from a rule written again here: the picker and the
   legality panel have to agree, and test_domain 13f and 13g walk every pair
   and every row to prove they do. The picker still OFFERS every list - the
   grouping says what the book allows, it does not decide for the player. */
export const condMetFor = src => {
  const g = DOMAIN.lendGrantFor(L(), src);
  if(!g || !g.needs_re) return true;
  /* The engine asks this of the fleet's own ships ("An Eldar Hero must lead
     the fleet in order to use Craftworld Eldar vessels as reserves",
     Fleets pg. 316), so the picker asks it the same way. */
  const re = new RegExp(g.needs_re, "i");
  return appState.S.units.some(u => !u.lst && entOf(u) && re.test(String(entOf(u).l)));
};
/* Both the grouping and the row marks ask about the door the player has
   chosen, so the two can never describe different doors. That is the whole
   point: a Space Marine ship in an Imperial fleet is a legal ALLY with nobody
   in charge, and a legal RESERVE only with an Inquisitor Lord leading
   (Fleets pg. 139). Answering without the role announced the Inquisitor on a
   pairing the engine passes green - 194 rows across 21 pairs. */
export const lendOf = src => DOMAIN.lendSummary(L(), src, DATA,
  { role: appState.SRC_ROLE, condMet: condMetFor(src) });
/* How many lists each door opens, for the role buttons. The player should be
   able to see which door has ships in it before opening it. */
/* A list both doors refuse can still be reachable: this fleet's own pages
   may take its hulls (DOMAIN.lendRouteFor) - every Chaos list takes Imperial
   Navy cruisers and escorts as Renegade Imperial Vessels (pg. 222), Bastion
   Fleets takes five Chaos hulls into its reserve fleet (pg. 39). Such a list
   is shown with the limited ones, in both doors, because the door does not
   decide it: the ship is added from this fleet's own section. The groups,
   the door counts and the note all read this one predicate. */
export const routeOf = src => DOMAIN.lendRouteFor(L(), src, DATA);
export const lendCount = role => LISTS.filter((l, i) => i !== appState.S.li &&
  (DOMAIN.lendVerdict(L(), l, role).kind !== "no" || !!routeOf(l))).length;
/* Short tag for a route row, by the section it is added from. */
/* One <b> per weapon word in the card's colour, then its strengths. The
   groups and their order come from the engine (DOMAIN.armSummary), so the
   picker cannot drift from the card. */
export const ARM_CLS = { WB:"wb", LAN:"lan", NOVA:"nov", BOMB:"bom", TORP:"tor",
                  BAYS:"bay", HOOK:"hook", MINES:"min", PULSE:"pul", RAM:"ram" };
export const armLineHTML = (sh, en, list) => {
  if(!sh) return "";
  const s = DOMAIN.armSummary(sh, { list });
  /* Options the list row forbids are not this ship's options here: the Rogue
     Trader rows take no variants (pg. 180) and a reserve fleet no class
     variants (pg. 39). */
  const optno = en && en.optno ? new RegExp(en.optno, "i") : null;
  const nOpt = en && en.noopt ? 0
    : (sh.ol || []).filter(o => !(optno && optno.test(String(o.t || "")))).length;
  /* How far each group reaches, "cm" kept so it reads as a distance; when
     every group reaches the same, it is said once at the end. */
  const lab = s.groups.map(g => rangeLabel(g.rng));
  const one = lab.length > 1 && lab.every(x => x && x === lab[0]) ? lab[0] : "";
  /* A group whose strengths reach differently (Tyrant WB 4 at 45 cm, 6 at
     30 cm) puts the range on each strength, so the pairing is not lost. */
  const cnt = x => (x.v == null ? "Spec." : x.v) + (x.n > 1 ? "\u00d7" + x.n : "");
  const perItem = g => g.items.length > 1 && new Set(g.items.map(x => rangeLabel(x.rng))).size > 1;
  const parts = s.groups.map((g, gi) => `<span><b class="${ARM_CLS[g.k] || ""}">${esc(g.k)}</b>${
    one || !perItem(g)
      ? esc(g.items.map(cnt).join(", ") + (g.more ? "\u2026" : "")) + (!one && lab[gi] ? `<i class="rng">${esc(lab[gi])}</i>` : "")
      : g.items.map(x => esc(cnt(x)) + (rangeLabel(x.rng) ? `<i class="rng">${esc(rangeLabel(x.rng))}</i>` : "")).join(", ") + (g.more ? "\u2026" : "")
  }</span>`);
  if(one) parts.push(`<i class="rng all">all ${esc(one)}</i>`);
  if(s.more) parts.push("<span>\u2026</span>");
  /* A weapon the ship picks is not a weapon it has: the line leaves those out
     and says how many there are to pick from. */
  if(s.picks.length > 2)
    parts.push(`<span class="opts pick" title="${esc(
      "The profile's weapons are choices: " + s.picks.length + " groups, one weapon from each")
      }">${s.picks.length} weapon choices</span>`);
  else s.picks.forEach(n => parts.push(`<span class="opts pick" title="${
    esc("The profile's weapons are a choice: one of these " + n)}">pick 1 of ${n}</span>`));
  /* One option is usually a +5 pts extra; from two up it changes the ship. */
  if(nOpt >= 2) parts.push(`<span class="opts">${nOpt} options</span>`);
  return parts.length ? `<span class="arms">${parts.join("")}</span>` : "";
};
export const routeTag = t => /renegade/i.test(t) ? "renegade" : /ordo malleus/i.test(t)
  ? "Ordo Malleus reserve" : /reserve/i.test(t) ? "reserve fleet" : "own list";
/* A host section's own condition (DOMAIN.sectionNeeds): met when this fleet
   has one of its own rows the rule asks for - the same question the engine's
   requires rule asks, from the same pick. */
export const routeNeedsMet = needs => !needs || needs.pick.some(p => {
  const re = p.re ? new RegExp(p.re, "i") : null;
  return appState.S.units.some(u => !u.lst && u.s === p.sec && entOf(u) && (!re || re.test(String(entOf(u).l))));
});
/* Which door to start at. Reserves are the book's primary mechanism
   (pg. 14-15) and allies the exception (pg. 16-17), so reserve is the
   default - but eight of the 32 lists open no reserve door at all. All three
   Rogue Trader lists take no reserves and 26 allies, and Dark Eldar none and
   16. Starting those on an empty group would make the player prove a
   negative before finding the other door. */
export const defaultRole = () =>
  lendCount("reserve") === 0 && lendCount("ally") > 0 ? "ally" : "reserve";
export const rowLendOf = (src, si, en) =>
  DOMAIN.lendRowVerdict(L(), src, si, en, DATA,
    { role: appState.SRC_ROLE, condMet: condMetFor(src) });
/* Short labels for the row marks. The book sentence goes in the title, so
   the mark stays the width of a tag and the reason is one hover away. */
export const LEND_TAG = {
  pair: "not allowed here", reserve: "reserve of a reserve",
  access: "named access only", lend_ban: "not lent",
  not_re: "not granted", type: "not a reserve type",
  xenos: "no xenos with space marines" };

/* The profile a unit fields. A Venerable battle barge row (en.hc) fields
   the Space Marine view of the chosen hull (DOMAIN.venerableView), not the
   Navy or Chaos profile as printed. */
export const shipOf = u => { const Lu = listOf(u);
  return u.ref ? DOMAIN.shipFor(u.ref, u.s >= 0 && Lu.secs[u.s] ? Lu.secs[u.s].ents[u.e] : null, DATA) : null; };

/* Change the hull under a hull-choice row (Venerable battle barge). Options,
   quantities and list upgrades index the old hull's rows, so they start
   over; the hull's name is kept so a save survives a page renumbering. */
/* ---- P1-8e: every change of a choice goes through DOMAIN.transition, which
   returns the new intent and the notices for what it had to reopen or drop.
   The notices are shown in the fleet pane (NOTICE), never applied silently. */
appState.NOTICE = null;
/* Action feedback (see the stylesheet). All of it is view state: never on a
   unit, never saved, and every render that finds none of it draws exactly
   what it drew before.
   JUST - what the tap that caused this render did. unit: the row to wash.
          did: the catalogue button that was tapped, pop: the + whose count
          changed (selectors - the buttons are rebuilt by the render). keep:
          the controls that may stand in the tapped one's place, first found
          wins, each with the height on the screen its middle must keep. Set
          by the handler, cleared by render().
   LAST_* - what the last render showed, to tell what moved. */
appState.JUST = null; appState.LAST_TOT = null; appState.DELTA = null; appState.LAST_CHK = null;
export const LAST_PTS = new WeakMap();
export const midY = el => { const r = el.getBoundingClientRect(); return r.top + r.height / 2; };
/* How many units of the fleet were bought from one catalogue row; lst is the
   lending list's name, null for the fleet's own list. */
export const rowUnits = (lst, si, ei) => appState.S.units.filter(u => (u.lst || null) === lst && u.s === si && u.e === ei);
export const inFleet = (lst, si, ei) => rowUnits(lst, si, ei).length;
/* The catalogue button a unit was bought from, as a selector - empty when the
   catalogue is showing a list the unit did not come from. A route row is
   this fleet's own ship under another list's heading (data-hs / data-he). */
export function rowSelOf(u){
  const SL = SRC(), foreign = SL !== L();
  if(u.lst) return foreign && SL.nm === u.lst ? `.add[data-s="${u.s}"][data-e="${u.e}"]:not([data-hs])` : "";
  return foreign ? `.add[data-hs="${u.s}"][data-he="${u.e}"]` : `.add[data-s="${u.s}"][data-e="${u.e}"]`;
}
/* What one press of a catalogue row's + or - does to the row's cards in the
   fleet (DOMAIN.rowStep, user 18.10. and 28.10.2026): the row behind a route button
   (data-hs) is this fleet's own, otherwise the source list's, bought
   under its name. */
export function rowStepFor(b, dir, skip){
  const own = b.dataset.hs != null, L2 = own ? L() : SRC();
  const lst = own || L2 === L() ? null : L2.nm;
  const si = +(own ? b.dataset.hs : b.dataset.s), ei = +(own ? b.dataset.he : b.dataset.e);
  const sec = L2.secs[si], en = sec && sec.ents[ei];
  if(!en) return null;
  const sh = en.r ? SHIPS[String(en.r)] : null;
  return DOMAIN.rowStep(DOMAIN.rowPurchase(L2, si, en, sh), rowCards(L2, lst, si, ei, dir, skip), dir);
}
/* The row's cards its catalogue buttons work on, in fleet order - the -,
   and the newest card's own - n + beside it (28.10.2026). L2: the list the
   row is on; lst: its name when it lends, else null. */
export function rowCards(L2, lst, si, ei, dir, skip){
  let units = rowUnits(lst, si, ei);
  /* a card in a mixed squadron is that squadron's, not this row's last card
     (mixed.js mixMember): + and - here keep to the plain cards */
  if(skip) units = units.filter(u => !skip(u));
  /* Clanz (J226): - takes the card of the Warlord new skwadrons go to, not
     another Warlord's (a new card from + goes to him in addUnitFrom) */
  if(L2 === L() && !lst && clanzSkwadronSec(si)){
    const RF = fleetResolved(), wa = activeWarlordIdx(RF);
    const his = wa >= 0 ? units.filter(u => RF.command && RF.command[appState.S.units.indexOf(u)] === wa) : units;
    /* a minus with none of his on the row takes the row's last, as before */
    units = dir > 0 || his.length ? his : units;
  }
  return units;
}
export function applyTransition(u, action){
  /* The unit's own list, not the fleet's: a borrowed ship's options and
     upgrade rows live on the list it was bought from. toLegacyUnit only
     re-emits u.lst when the resolved list differs from ctx.list, and this
     function does not copy lst or role back, so the stamp survives. */
  const ctx = { list: listOf(u), host: L() };
  const r = DOMAIN.transition(DOMAIN.fromLegacyUnit(u, ctx, DATA), action, ctx, DATA);
  const back = DOMAIN.toLegacyUnit(r.intent, ctx, DATA).unit;
  u.os = back.os; u.oq = back.oq; u.opts = back.opts; u.ups = back.ups; u.upn = back.upn;
  if(action.type === "hull"){ u.ref = back.ref; u.hn = back.hn; }
  /* J232: one action may change several ships (Send to): every notice stays */
  if(r.notices.length) appState.NOTICE = { u: u, items: (appState.NOTICE ? appState.NOTICE.items : []).concat(r.notices) };
  return r;
}

/* Change the hull under a hull-choice row (Venerable battle barge). Options,
   quantities and list upgrades index the old hull's rows, so they start
   over; the hull's name is kept so a save survives a page renumbering. */
export function setHull(u, ref){
  if(!SHIPS[String(ref)]) return;
  applyTransition(u, { type: "hull", ref: String(ref) });
}
export const entOf = u => { const sec = listOf(u).secs[u.s]; return sec && sec.ents[u.e]; };

/* Every ship option has three states:
   take = included, costs points, prints ticked
   opt = leaves an empty box on the card, costs nothing
   off = does not print at all
   The default is "opt", which makes the card look like the project's
   PROTO_Peruskortit_valinnoilla - you tick it later at the table. */
/* Two swap options can point at the same armament row: a Strike Cruiser
   exchanges its launch bays for either torpedoes OR a bombardment cannon. The
   ship carries one set of launch bays, so it cannot take both - and if it
   does, the card shows two marked rows in the same slot and both options are
   charged. Keeps the one whose index is `keep` and reopens the rest. */

/* A save may predate the point where the conflict was prevented, so the same
   clean-up runs on every unit at load time. */


/* The book prints a priced row and then the lines describing it, so the
   owner of each sentence is known from the page layout - no guessing from
   the wording. build_data records it as sec.own. */
export function ownedText(si, label){
  const sec = L().secs[si];
  if(!sec || !sec.own) return "";
  const out = [];
  sec.own.forEach((o, i) => { if(o === label) out.push(sec.text[i]); });
  return out.join(" ");
}

export function optState(u, i){
  if(u.os && u.os[i]) return u.os[i];
  /* A list row can forbid the ship's own variants: Rogue Traders using a
     Lunar, Tyrant, Carnage or Murder may use "no special variants in the
     notes of these ships' profiles" (Fleets p.180). Every option is off. */
  if(u.s >= 0){
    /* noopt and optno belong to the ROW the ship was bought from, so they
       follow a borrowed ship into its new fleet and must not touch the
       host's own ships. */
    const secU = listOf(u).secs[u.s];
    const en0 = secU && secU.ents[u.e];
    if(en0 && en0.noopt) return "off";
    /* optno: the list forbids this one option (Mechanicus Sharks, p. 125). */
    if(en0 && en0.optno){
      const sh0 = shipOf(u), o0 = sh0 && sh0.ol && sh0.ol[i];
      if(o0 && new RegExp(en0.optno, "i").test(String(o0.t || ""))) return "off";
    }
  }
  if((u.opts||[]).includes(i)) return "take";   /* an old save */
  return "opt";
}
export function setOptState(u, i, v){
  const sh = shipOf(u);
  if(!sh || !sh.ol[i]) return;
  applyTransition(u, { type: "option", id: sh.ol[i].id, state: v });
}

/* ---- fleet list upgrades (re-rolls, Marks, gubbins, Dakka Dakka) ----
   Data gives each row its kind k and its attachment targets at. An upgrade
   with no target is fleet-wide: it is offered to any ship. */
export function isUpgradeEnt(en){ return en && en.k === "up"; }

/* ---- P1-8b: the calculators live in domain.js as pure functions over a
   Selection. The functions below keep their old names as shells: each one
   builds the Selection THROUGH the canonical intent, so the intent is
   proven to carry everything the calculators need (docs/DOMAIN_CONTRACT.md).
   Setters (setOptState, setUpState, setHull) still mutate the legacy unit;
   P1-8e replaces them with transition(). ---- */
export function selOf(u){
  /* ctx.list = the unit's own list, ctx.host = the fleet's list. Two
     different things: p. 14 lets a borrowed ship take upgrades from both. */
  const ctx = { list: listOf(u), host: L() };
  return DOMAIN.selectionOf(intentOf(u, ctx), ctx, DATA);
}
/* The unit's canonical intent as its fleet resolves it. A row of a Da Ork
   Clanz tiddla skwadron (a Squadron letter) carries the skwadron's clan and
   Gubbins - on every row of the tag, paid on one (Fleets pp. 369-370, ruling
   T60, DOMAIN.shareSkwadronUpgrades) - so the card, the fleet view and the
   points say what the legality panel says. Kept by the rows it depends on:
   selOf is asked many times per render. */
const SHARE_MEMO = new Map();
export function intentOf(u, ctx){
  ctx = ctx || { list: listOf(u), host: L() };
  const it = DOMAIN.fromLegacyUnit(u, ctx, DATA);
  if(!u.sq || u.lst || !L().clanz) return it;
  const mates = appState.S.units.filter(x => x.sq === u.sq && !x.lst), k = mates.indexOf(u);
  if(k < 0 || mates.length < 2) return it;
  const sig = L().nm + "|" + JSON.stringify(mates);
  let its = SHARE_MEMO.get(sig);
  if(!its){
    const c0 = { list: L(), host: L() };
    its = DOMAIN.shareSkwadronUpgrades(mates.map(x => DOMAIN.fromLegacyUnit(x, c0, DATA)), c0, DATA);
    if(SHARE_MEMO.size > 200) SHARE_MEMO.clear();
    SHARE_MEMO.set(sig, its);
  }
  return its[k];
}
/* The other rows of u's tiddla skwadron (ruling T60), [] for any other row. */
export function skwadronMates(u){
  if(!u.sq || u.lst || !L().clanz) return [];
  const us = appState.S.units, c0 = { list: L(), host: L() };
  return DOMAIN.skwadronMates(us.map(x => DOMAIN.fromLegacyUnit(x, { list: listOf(x), host: L() }, DATA)), us.indexOf(u), c0, DATA)
    .map(j => us[j]);
}

/* Launch bay strength = the sum of the strengths on every launch bay row. The
   book's own example: Terror Ship 2 + 2 = 4, so torpedo bommas cost 4 x 10 =
   40 points. Dice values count at their maximum ("per (maximal) launch bay
   strength"), which makes an Ork hulk's D6+2 + D6+2 = 16 and the price 160 -
   that figure is the book's too. */
export function bayStrength(sh, u){ return DOMAIN.bayStrength(sh, u ? selOf(u) : null); }

/* Prow armour as a number: "6+ front / 5+" -> 6, "5+" -> 5. */
export function prowArmour(sh){ return DOMAIN.prowArmour(sh); }

/* Eligibility condition. An empty condition always passes. Armament is
   read AFTER THE SWAPS, so taking a nova cannon rules out the Power Ram
   exactly as the book says. */
export function condOK(u, en, si, ei){ return DOMAIN.condOK(selOf(u), en, si, ei); }

export function upgradeKey(si, ei){ return si + ":" + ei; }

export function upTokens(t){ return DOMAIN.upTokens(t); }

/* Is this upgrade already one of the ship's own options at the same price? */
/* The same upgrade can be taken two ways: as the list's own upgrade row
   (u.ups) or as an option printed on the ship's profile (u.os). The Necron
   Sepulchre is both, and the list row is hidden whenever the ship option
   covers it - so counting only the list row missed every real choice. */
export function upgradeTakenAnyWay(u, si, ei){ return DOMAIN.upgradeTakenAnyWay(selOf(u), si, ei); }

export function coveredByShipOption(u, en){ return DOMAIN.coveredByShipOption(selOf(u), en); }

/* Every fleet list upgrade in two sets: the ones belonging to this row and
   the rest. */
export function upgradesFor(u){ return DOMAIN.upgradesFor(selOf(u)); }

export function upState(u, si, ei){ return DOMAIN.upState(selOf(u), si, ei); }

/* One choice can rule out another: a nova cannon makes the Power Ram
   ineligible, and replacing the prow torpedoes makes the list's own nova
   row ineligible too. Both setters run this, so the result does not depend
   on the order the player clicked in. */

export function setUpState(u, si, ei, v){
  /* si and ei index the unit's OWN list, because that is where
     DOMAIN.upgradesFor found the row. Building the id from L() instead
     would name the wrong list, and toLegacyUnit drops an id whose list half
     does not match - the purchase would vanish without a word. */
  /* si >= 1000 is a section of the host list (domain.js HOST_OFF): a
     borrowed ship is also offered the rows of the fleet's own list (p. 14). */
  const Lu = si >= 1000 ? L() : listOf(u);
  const sec = Lu.secs[si >= 1000 ? si - 1000 : si], en = sec && sec.ents[ei];
  if(!en) return;
  const id = DOMAIN.upgradeId(Lu.nm, sec.t, en.l);
  applyTransition(u, { type: "upgrade", id: id, state: v });
  /* A Da Ork Clanz tiddla skwadron's clan or Gubbin is one choice for the
     skwadron (Fleets pp. 369-370, ruling T60): the other rows of its tag
     that are offered the row get the same answer, so a row never says "off"
     while the skwadron has it. */
  if(si < 1000 && !u.lst && DOMAIN.isSkwadronUpgrade(L(), si, en))
    skwadronMates(u).forEach(x => {
      const ups = upgradesFor(x);
      if(ups.own.concat(ups.other).some(y => y[0] === si && y[1] === ei)) applyTransition(x, { type: "upgrade", id: id, state: v });
    });
}

/* Required upgrades are attached as soon as a unit is added. */
export function applyRequired(u){
  const keys = DOMAIN.requiredUpgradeKeys(selOf(u));
  u.ups = u.ups || {};
  keys.forEach(k => { u.ups[k] = "take"; });
  /* Default rows differ from required ones in exactly one way, and it is the
     whole point: they are set only when the unit has no answer yet, so the
     opening position is the same as before but the player may change it.
     Forcing them here instead would put the lock straight back, and the lock
     is what charged the Chaos Warmaster's Mark twice beside a battle barge
     that already includes it (Fleets pp. 258, 260, 262, 264). */
  DOMAIN.defaultUpgradeKeys(selOf(u)).forEach(k => {
    if(!Object.prototype.hasOwnProperty.call(u.ups, k)) u.ups[k] = "take"; });
}

export function upCost(u, en){ return DOMAIN.upCost(selOf(u), en); }

/* The price text gives both the multiplier and the result, because "+10 /
   bay" alone does not help you add up points. */
export function upCostLabel(u, en){
  if(en.p == null) return "see text";
  if(!en.p) return "free";
  const sign = en.p > 0 ? "+" : "";
  if(en.per === "hull")
    return sign + en.p + " / ship = " + sign + upCost(u, en);
  if(en.per === "bay"){
    const b = bayStrength(shipOf(u), u), s = selOf(u);
    /* an escort squadron pays for the bays of every ship in it (Fleets p. 22) */
    const k = s.escort && s.hulls > 1 ? " x " + s.hulls + " ships" : "";
    return sign + en.p + " x " + b.n + " bays" + k + " = " + sign + upCost(u, en) +
      (b.exact ? "" : " (check)");
  }
  return sign + en.p;
}

/* Price what is actually offered, not what the raw state still remembers.
   A row that upgradesFor() hides - because the ship no longer qualifies,
   or because the ship's own option already covers it - must not keep
   charging: that is how a Power Ram stayed on the bill after a nova
   cannon replaced the prow torpedoes, and how one prow swap was charged
   twice. Visibility, the card and the price now read the same set. */
export function upgradePts(u){ return DOMAIN.upgradePts(selOf(u)); }

/* Fleets p.102: a Venerable battle barge is "chosen from any available
   Imperial or Chaos battleship, grand cruiser, battlecruiser or heavy
   cruiser at the listed cost, plus an additional +35 points for its Space
   Marine crew". The Seditio Opprimere (p.103) is the book's own venerable
   barge and already a Space Marine vessel, so it costs its listed price. */
export function hullPts(u, en){ return DOMAIN.hullPts(selOf(u), en); }

export function unitPts(u){ return DOMAIN.pointsOf(selOf(u)); }

/* Ceiling price: what the unit costs if every choice still left open is
   ticked at the table. That way the list total also says how much slack the
   open options need. */
export function unitMaxPts(u){ return DOMAIN.maxPointsOf(selOf(u)); }
export const totalMax = () => appState.S.units.reduce((a, u) => a + unitMaxPts(u), 0);

/* Weapon name: established abbreviations only, no cutting words. "Port /
   Starboard" is the book's way of writing one weapon on both sides; without
   the spaces it fits the column even with a tick box. */
export function shortWeaponName(v){
  return String(v || "")
    .replace(/\*/g, "")
    .replace(/\s*\/\s*/g, "/")
    .replace(/\bbatteries\b/gi, "batt.")
    .replace(/\s+/g, " ").trim();
}

/* The column is 9.4 mm wide, and a gravitic hook's "1 Warden" needs 9.8 - it
   broke over two lines for the sake of 0.4 mm. A value of more than a few
   characters is set a shade narrower so it stays on one line; the long ones
   ("2 Orcas/Wardens") still wrap, at the slash. */
export function strengthCell(v){
  const t = shortStrength(v);
  return t.replace(/\u200B/g, "").length > 6 ? `<span class="tight">${esc(t)}</span>` : esc(t);
}
/* FIREPOWER/STR is a deliberately tight column. Game terms are written out
   elsewhere, but here only established abbreviations are used. */
export function shortStrength(v){
  return String(v || "")
    .replace(/\bsquadrons?\b/gi, "Sqn")
    /* "Capacity: 1 Orca/Warden" in an 11.9 mm column wrapped to two lines and
       still said the obvious: the badge already says it is a hook, and the
       rule line says what a capacity is. The number and the ship stay. */
    .replace(/\bcapacity\s*:\s*/gi, "")
    .replace(/\bper enemy\b/gi, "/enemy")
    .replace(/\bspecial\b/gi, "Spec.")
    .replace(/\s*\/\s*/g, "/")
    /* A zero-width space after the slash: "1 Orca/Warden" does not fit an
       11.9 mm column on one line, and without this the browser may not break
       it anywhere. The invisible character puts the break at the slash rather
       than mid-word. */
    .replace(/\//g, "/\u200B")
    .replace(/\s+/g, " ").trim();
}
export const total = () => appState.S.units.reduce((a,u) => a + unitPts(u), 0);
/* Points of a fleet kept for another list (J146). Its own list is the host,
   not the open one: a borrowed ship is priced on its own row and its upgrades
   come from the pair of lists it was bought under. */
export function fleetPoints(units, ln){
  const L0 = LISTS.filter(x => x.nm === ln)[0];
  if(!L0) return 0;
  try{
    return (units || []).reduce((a, u) => {
      const ctx = { list: (u.lst && LISTS.filter(x => x.nm === u.lst)[0]) || L0, host: L0 };
      return a + DOMAIN.pointsOf(DOMAIN.selectionOf(DOMAIN.fromLegacyUnit(u, ctx, DATA), ctx, DATA));
    }, 0);
  }catch(e){ return 0; }
}
/* Put the open fleet away under its own list's name, so switching lists keeps
   it. An empty fleet is not kept: the menu would then say "0 pts" for a list
   the player only glanced at. */
export function stashCurrent(){
  const nm = LISTS[appState.S.li] && LISTS[appState.S.li].nm;
  if(!nm) return;
  if(appState.S.units.length){ stashAll()[nm] = { units: appState.S.units, limit: appState.S.limit | 0 }; STASH_PTS[nm] = total(); }
  else { delete stashAll()[nm]; delete STASH_PTS[nm]; }
}
/* Open another list. The order matters and is load-bearing: the fleet is put
   away while S.li still names its own list (total() and stashCurrent read it),
   and S.li is set before render(), whose applyRequired sweep resolves upgrade
   rows through L() (backlog J103). */
export function switchList(to){
  if(!LISTS[to]) return;
  stashCurrent();
  const nm = LISTS[to].nm, had = stashAll()[nm];
  appState.S.units = had ? had.units : [];
  if(had && typeof had.limit === "number") appState.S.limit = had.limit;
  delete appState.S.stash[nm]; delete STASH_PTS[nm];
  /* The catalogue goes back to the new fleet's own list: a source list
     left over from the previous fleet would offer borrowed ships the new
     fleet may not be allowed to take. */
  appState.S.li = to; appState.SRC_LI = null; appState.SRC_ROLE = defaultRole(); render();
}
/* Ships counted for ratio / cap rules: an escort squadron counts as its
   number of hulls, a capital ship as one. */
export const hulls = u => u.n || 1;

