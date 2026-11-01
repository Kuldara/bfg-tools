/* What a ship in a Registry fleet brings to a boarding action: Gothic Fleet Play
   sends these to the Boarding page it opens.

   Pure, no DOM: Play's bundle and the tests import it too.

   optsFromUnit(R, commanders, list) -> { opts, hints }
     R           the unit as DOMAIN.resolveUnit gives it
     commanders  the commanders aboard, { label, R }: a Chaos Lord's Mark is bought
                 on him and works on his ship (FL p.242)
     list        the fleet list's name
     opts        the engine's option ids that apply
     hints       choices the fleet does not make: the player's (see below)

   crewOf(data, unit) -> the ship base row of the fleet that crews the hull
     unit: { list, sec, label, ref }; data: ships.json

   Every upgrade row or commander in the data that can matter to a boarding
   action must be in one of these tables: apps/play/test_board_link.js fails on
   a new one. */
"use strict";

/* upgrade rows and ship options bought in the builder */
export const UPGRADE_OPTS = [
  [/^thunderhawk/i, null],                                   /* a launch option, not a crew */
  [/mark of khorne/i, "khorne"],                             /* FL p.244 */
  [/mark of nurgle/i, "nurgle"],                             /* FL p.244 */
  [/chaos space marine crew|embark chaos space marines/i, "csm"],  /* FL p.232 */
  [/chosen terminators/i, "terminators"],                    /* FL p.234 */
  [/clan: goffs/i, "goff"],                                  /* FL p.371 */
  [/mega-armou?red boarding part/i, "megaarmour"],           /* FL p.372 */
  [/ghostship/i, "ghostship"],                               /* FL p.311 */
  [/aspect warrior host/i, "aspect"],                        /* FL p.307 */
  [/berzerker tide/i, "berzerkerfleet"],                     /* FL p.250 */
  [/ark of pestilence/i, "ark"],                             /* FL p.248 */
  [/terminator boarding party|grey knights terminators/i, "terminators"],  /* FL p.96, p.155 */
];
/* rows that sound like boarding and change nothing in the roll */
export const NO_BOARDING_EFFECT = /boarding torpedo|torpedo marker|mark of slaanesh|mark of tzeentch|klaws|embarked aboard the flame|embarks the inquisitor|honour guard|mega-spore|thunderhawk|refit, rolled randomly|clan: /i;

/* commanders, by their label */
export function commanderOpts(labels, list){
  const opts = [], hints = [];
  (labels || []).forEach(l => {
    if(/abaddon/i.test(l)) opts.push("abaddon");                      /* FL p.241 */
    else if(/lord admiral rath/i.test(l)) opts.push("rath");          /* FL p.48 */
    else if(/ordo malleus/i.test(l)) opts.push("inq_malleus");        /* FL p.150 */
    else if(/ordo hereticus/i.test(l)) opts.push("inq_hereticus");    /* FL p.150 */
    else if(/ordo xenos/i.test(l)) opts.push("inq_xenos");            /* FL p.151 */
    /* the list does not say which Ordo; each has its own bonus */
    else if(/inquisitor lord/i.test(l)) hints.push("ordo");
    else if(/ork warlord/i.test(l)){
      /* "+2 to one boarding dice roll per game" (FL p.374): the player picks the
         action, so it is offered and not spent by itself; elsewhere he doubles
         the boarding value in every action (FL p.367) */
      if(/clanz/i.test(list || "")) hints.push("clanzwarlord");
      else opts.push("warlord");
    }
  });
  return { opts, hints };
}

/* a row is bought when its state is a count or a word other than "opt" */
const taken = r => !!r.included || (typeof r.state === "number" ? r.state > 0 : /^(take|taken|req|required|on|yes)$/.test(String(r.state)));

export function optsFromUnit(R, commanders, list){
  const opts = [], add = o => { if(o && opts.indexOf(o) < 0) opts.push(o); };
  const fromRows = U => (U.upgrades || []).concat(U.options || []).forEach(r => {
    if(!taken(r)) return;
    const text = String(r.label || r.text || "");
    for(const [re, id] of UPGRADE_OPTS) if(re.test(text)){ add(id); break; }
  });
  fromRows(R);
  (commanders || []).forEach(c => { if(c.R) fromRows(c.R); });
  const c = commanderOpts((commanders || []).map(x => x.label), list);
  c.opts.forEach(add);
  return { opts, hints: c.hints };
}

export function crewOf(data, unit){
  const book = data.crew && data.crew.ref[String(unit.ref)];
  if(!book) return null;
  const key = unit.list + "|" + unit.sec + "|" + unit.label;
  const fi = key in data.crew.ex ? data.crew.ex[key] : book[0];
  const hit = f => data.ships.find(s => s.f === f && s.full === book[1]);
  return hit(fi) || hit(book[0]) || null;
}
