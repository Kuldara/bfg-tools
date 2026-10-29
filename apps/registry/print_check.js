/* Print check: renders the full cards of EVERY fleet list with the app's
   own cardHTML() and compares every card with its profile.

   Checks card by card:
     1  every section is on the card
     2  the stats match the profile (speed, turns, shields, armour, turrets)
     3  the number and names of the armament rows match the profile
     4  every weapon has a colour code and an arc
     5  the SPECIAL block's rules are on the card if the profile has one
     6  star reference: if a rule names a weapon, both the rule and the weapon get a star
     7  options are on the card and their prices show
     8  there are as many HIT boxes as the hits value, squadron boxes for escorts
     9  the card has no undefined/NaN values

   Run:  node print_check.js            summary
         node print_check.js -v         every finding
         node print_check.js Orks       only lists whose name contains 'Orks'
*/
const fs = require("fs");
const path = require("path");

const el = () => ({
  textContent: "", innerHTML: "", value: "", className: "", dataset: {},
  querySelectorAll: () => [], appendChild(){}, setAttribute(){}, getAttribute: () => "",
  style: {}, id: "", onclick: null, onchange: null, oninput: null
});
global.document = {
  getElementById: id => id === "bfgdata"
    ? { textContent: fs.readFileSync(path.join(__dirname, "..", "..", "data", "bfg_data.json"), "utf8") }
    : el(),
  querySelector: () => el(), createElement: () => el(),
  head: { appendChild(){} }, body: { appendChild(){}, removeChild(){}, dataset: {} },
};
global.window = {}; global.navigator = {};
global.localStorage = { getItem: () => null, setItem(){} };
global.alert = () => {}; global.confirm = () => false;

/* The app's modules, loaded under the stubs above (test-support.js). */
const api = require(require("path").join(__dirname, "./test-support.js")).loadApp();
const { LISTS, SHIPS } = api;

const args = process.argv.slice(2);
const VERBOSE = args.includes("-v");
const filter = args.filter(a => a !== "-v")[0];

const strip = h => h.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ")
  .replace(/&amp;/g, "&").replace(/&ndash;/g, "-").replace(/\s+/g, " ").trim();
const norm = t => String(t == null ? "" : t)
  .replace(/ | /g, " ").replace(/\s+/g, " ").trim().toLowerCase();

const SECTIONS_CAP = ["DAMAGE", "LOADOUT / OPTIONS", "ARMAMENT",
                      "SPECIAL RULES / UPGRADES", "CRITICAL DAMAGE (2D6)", "NOTES / STATUS"];
const SECTIONS_ESC = ["SQUADRON STATE", "LOADOUT / OPTIONS", "ARMAMENT",
                      "SPECIAL RULES / UPGRADES", "SQUADRON HIT POINTS / MEMBERS",
                      "NOTES / STATUS"];
/* A card that only HOLDS several units (ground targets, Fleets p.517): the book
   gives them no squadron rule (Rulebook p.100 speaks of orbital defences
   and ships, p.498 says low orbit defences are "all ground-
   based"), so the card has no squadron word. */
const SECTIONS_HELD = ["ON THIS CARD", "LOADOUT / OPTIONS", "ARMAMENT",
                       "SPECIAL RULES / UPGRADES", "HIT POINTS / MEMBERS",
                       "NOTES / STATUS"];
/* A star fort (Ramilies p.500, Fortress-Monastery p.110) prints as two
   cards. Fleets p.501: "The Ramilies star fort is so large that its
   weapons, hits and defences are divided up into four 'quadrants'" - so
   the plan card has FOUR hit tracks and the quadrant weapons four times,
   the Basilica weapons once in the middle (p.500 BASILICA WEAPONS). The rule
   card is an ordinary card without a damage track: the tracks appear exactly once in the pair. */
const SECTIONS_FORT_RULES = ["LOADOUT / OPTIONS", "ARMAMENT", "SPECIAL RULES / UPGRADES",
                             "CRITICAL DAMAGE (2D6)", "NOTES / STATUS"];
const SECTIONS_FORT_PLAN = ["NORTH-WEST", "NORTH-EAST", "SOUTH-WEST", "SOUTH-EAST", "PIER N",
                            "BASILICA", "LEADERSHIP & ORDERS", "RE-ROLLS", "NOTES / STATUS"];
/* The same split as on the card (FORT_PLAN_SLOTS in the app): the rules of these
   slots are on the plan card, all others on the rule card. */
const FORT_PLAN_SLOTS = ["orders", "rerolls", "sectors", "boarding", "basilica"];

let cards = 0, bad = 0;
const found = [];
function fail(list, ship, msg) {
  bad++;
  found.push([list, ship, msg]);
}

LISTS.forEach((L, li) => {
  if (filter && !L.nm.toLowerCase().includes(filter.toLowerCase())) return;
  // the whole list at once: every ship row as one unit
  api.S.li = li; api.S.limit = 100000; api.S.units = [];
  L.secs.forEach((sec, si) => sec.ents.forEach((en, ei) => {
    if (!en.r || !SHIPS[String(en.r)]) return;
    const u = { s: si, e: ei, ref: en.r, n: 1, opts: [], os: {}, name: "" };
    api.applyRequired(u);      // required list changes as in real use
    api.S.units.push(u);
  }));
  /* The default build is a valid intent: no issue rows at all (P1-8e). */
  api.S.units.forEach(u => {
    const R = api.resolveUnit(u);
    ((R && R.issues) || []).forEach(x => fail(L.nm, String(u.ref || "cmd"), "issue with the default build: " + x.code + " " + x.message.slice(0, 60)));
  });

  api.S.units.forEach(u => {
    const sh = SHIPS[String(u.ref)];
    /* The card kind comes from the RESOLVED unit (R.card), not from the book's
       type word: a one-hit defence is of type Defence or Ground and still
       a squadron card (Rulebook p.100: "1HP defences grouped in up to six
       units"), a star fort is a pair of two cards (Fleets p.501) and a fire ship
       (p.516) is of type Escort but a rule card. The earlier isEscort(u) read
       the type word and demanded capital card sections from a platform. */
    const kind = (api.resolveUnit(u) || {}).card;
    /* rule cards (p.512, 513, 516) are checked in their own loop below */
    if (kind === "rule") return;
    const esc = kind === "squadron";
    const fort = kind === "fort";
    if (esc) u.n = 3;
    const cs = api.unitCards(u).map(c => c.html("top"));
    /* cardHTML = the unit's only card, for a fort the rule card (the one with
       stats, loadout, armament table and rules); the plan card is the
       first of the pair. */
    const h = api.cardHTML(u, "top");
    const plan = fort ? cs[0] : "";
    if (fort && (cs.length !== 2 || cs[1] !== h))
      fail(L.nm, "p." + sh.pg + " " + sh.nm, "fort cards " + cs.length + ", expected the pair plan + rules");
    if (!fort && (cs.length !== 1 || cs[0] !== h))
      fail(L.nm, "p." + sh.pg + " " + sh.nm, "unit cards " + cs.length + ", expected 1");
    cards += cs.length;
    const txt = strip(h);
    /* A fort's rules are split over two cards: "the rule is on the card"
       is read from the pair. */
    const txtAll = fort ? strip(cs.join("\n")) : txt;
    const ref = "s." + sh.pg + " " + sh.nm;
    /* J144: a Chaos hull in the list's own reserve section (Bastion p.39, Ordo
       Malleus p.152) is not the list's own ship - the same exception as the
       domain's foreignReserveRow: no Mechanicus blocks and no native rules. */
    const foreignReserve = (L.secs[u.s] || {}).ct === "reserve" && /^CHAOS/i.test(String(sh.fl || "")) &&
      !/^Chaos/.test(L.nm);

    // 1 sections. The critical table heading comes from the resolver's model, not
    // a constant: the faction tables happened to contain "CRITICAL DAMAGE
    // (2D6)" as a substring, the ork hulk's D6 table does not (Fleets p.393).
    const Rk = api.resolveUnit(u) || {};
    const held = esc && !!(Rk.squadron && Rk.squadron.cardOnly);
    (fort ? SECTIONS_FORT_RULES : esc ? (held ? SECTIONS_HELD : SECTIONS_ESC) : SECTIONS_CAP).forEach(s => {
      const want = s === "CRITICAL DAMAGE (2D6)" ? api.criticalModel(sh).title : s;
      if (!txt.includes(want)) fail(L.nm, ref, "section missing: " + want);
    });
    if (fort) {
      const ptxt = strip(plan);
      SECTIONS_FORT_PLAN.forEach(s => {
        if (!ptxt.includes(s)) fail(L.nm, ref, "missing from the plan card: " + s);
      });
      [plan, h].forEach((c, i) => {
        if (!/^<div class="k /.test(c)) fail(L.nm, ref, "linnakkeen kortti " + (i + 1) + " ei ala k-kehyksella");
        if (!/<div class="k-hd">[\s\S]*?<h3>[^<]+<\/h3>/.test(c)) fail(L.nm, ref, "fort card " + (i + 1) + " has no heading");
      });
    }
    /* A fixed Leadership (the profile's dld): a defence's nominal 7 (Fleets
       p.499: "do not roll for leadership or have a leadership value ... on a
       nominal leadership of 7"), the Fortress-Monastery's 10 (p.111: "a base
       leadership of 10"). The card prints the value; a write-in box is only for
       a rolled Leadership (Ramilies p.503: "rolled as for a capital
       ship", other ships). */
    const ldFixed = '<span>LEADERSHIP</span><div class="v"><b>' + sh.dld + "</b>";
    /* the write-in box first; a ship's own re-roll boxes may follow it in
       the same cell (J168 c: Scion of Prospero) */
    const ldBlank = '<span>LEADERSHIP</span><div class="v"><i></i>';
    if (sh.dld != null && !h.includes(ldFixed))
      fail(L.nm, ref, "fixed Leadership " + sh.dld + " is not in the LEADERSHIP box");
    if (sh.dld == null && !h.includes(ldBlank))
      fail(L.nm, ref, "the write-in box for a rolled Leadership is missing");

    // 2 statsit
    // A list may change the profile as a requirement (AdMech's +1 turret), so
    // the card is expected to show the changed value.
    [["speed", sh.sp], ["turns", sh.tn], ["shields", api.shortShield(sh.sh)],
     ["turrets", api.effTurrets(u, sh)]]
      .forEach(([k, v]) => {
        if (v && !norm(txt).includes(norm(v)))
          fail(L.nm, ref, "stat " + k + "=" + JSON.stringify(v) + " does not show on the card");
      });
    // armour is abbreviated on purpose
    const armNums = String(sh.ar).match(/\d\+/g);
    if (armNums && !norm(txt).includes(norm(armNums.join("/"))) &&
        !norm(txt).includes(norm(sh.ar)))
      fail(L.nm, ref, "armour " + JSON.stringify(sh.ar) + " does not show on the card");

    // 10 contradictions within the card (spot check 19, M13). The crippled row must not
    // slow a ship whose own rule says crippled does not slow it (Fleets
    // p.207/395/492/495); an escort has no critical hit trigger
    // (Rulebook p.66); an active Nova Cannon shows on the crippled row
    // (Rulebook p.65); a Chaos list card has +1 boarding (Fleets p.232, not
    // for the Activated Blackstone Fortress, p.286 "It has no crew").
    const R0 = api.resolveUnit(u) || {};
    /* J168 c: the ship's own re-rolls as boxes on the card, as for a commander
       (the Scion of Prospero's two, p.260); a fort's boxes are on the plan card */
    if (!fort) {
      const rrs = (R0.rerolls && R0.rerolls.boxes) || [];
      ["included", "bought", "optional"].forEach(k => {
        const n = h.split('<i class="rrb ' + k + '">').length - 1;
        if (n !== rrs.filter(x => x === k).length)
          fail(L.nm, ref, "ship card re-roll boxes (" + k + ") " + n + " != " + rrs.filter(x => x === k).length);
      });
    }
    const crip = (R0.damage && R0.damage.note) || "";
    // Only the ship's own rules: the card's Mechanicus Gifts table has the
    // optional "Energy Reserves CRIPPLED ... not 50 %" row.
    const rulesTxt = (R0.rules || []).map(x => String((x && x.t) || "")).join(" ");
    if (/Speed -5 cm/.test(crip) &&
        /crippl[^.]{0,80}\b(do not|does not|never|not)\b[^.]{0,40}(speed|slow)|not slowed[^.]{0,60}crippl/i.test(rulesTxt))
      fail(L.nm, ref, "the crippled row slows the ship although its rule says crippled does not slow it");
    if (esc && /Every Hit causes critical damage/i.test(txt))
      fail(L.nm, ref, "critical hit trigger on an escort card");
    if (!esc && /^CRIPPLED:/.test(crip) && !/No Nova Cannon/.test(crip) &&
        (R0.weapons || []).some(w => w.state === "active" && /nova cannon/i.test(String((w.a || [])[0] || ""))))
      fail(L.nm, ref, "the active Nova Cannon is missing from the crippled row");
    /* A planetary defence (the profile's df) is bought from the Fleets p.499 price
       list, not from the Chaos list's rows: a station, platform or monitor is not
       a Chaos ship, so p.232's "+1 in boarding actions" does not belong on its card
       and the domain rightly leaves it out. The exception covers only df profiles;
       every own ship of a Chaos list still needs the row. */
    /* On a renegade hull the row is "+1 in boarding actions as a Chaos vessel"
       (p.232 forbids a Chaos Space Marine crew, so the chaos_core row's
       crew sentence does not belong on its card; spot check 2026-10-18/1). */
    if (/^Chaos\b/.test(L.nm) && !/BLACKSTONE/i.test(sh.nm) && !sh.df && !/\+1 in boarding actions/.test(txt))
      fail(L.nm, ref, "the Chaos +1 boarding is missing");
    if (/^Chaos\b/.test(L.nm) && sh.df && txtAll.includes("Chaos: +1 in boarding actions"))
      fail(L.nm, ref, "a defence card has the Chaos list's +1 boarding (p.499: not a list ship)");

    /* J145: a stat box's write-in box fits only beside a short value.
       A long value (the Eldar three-part speed p.304-307, "Special", a save
       in place of shields, quadrant armour) slid under the box, so it
       prints without a box - and no single number is written into them. */
    const stats = [...h.matchAll(/<div( class="nobox")?><span>([^<]*)<\/span><div class="v"><b>([^<]*)<\/b>/g)];
    stats.forEach(m => {
      const parts = (m[3].match(/\//g) || []).length >= 2, box = !m[1];
      if (parts === box)
        fail(L.nm, ref, "stat box " + m[2] + " = " + JSON.stringify(m[3]) +
             (parts ? ": three-part value, the box is still there" : ": one value, the box is missing"));
    });
    if (!stats.length) fail(L.nm, ref, "no stats row found on the card");

    // 3+4 aseistus
    // An open swap option shows both the original and the replacing
    // row; both must be in the table and tickable.
    const swapRows = (sh.ol || []).reduce((a, o, i) =>
      a + (o.sw && api.optState(u, i) !== "off" ? o.sw.t.length : 0), 0);
    const gone = (sh.ol || []).reduce((a, o, i) =>
      a + (o.sw && api.optState(u, i) === "take" ? o.sw.f.length : 0), 0);
    // A list may add a required extra weapon (AdMech's dorsal lance).
    const addRows = L.secs.reduce((a, sec, si) => a + sec.ents.reduce(
      (b, en, ei) => b + (en.k === "up" && en.add &&
        api.upState(u, si, ei) === "take" ? 1 : 0), 0), 0)
      // The ship's own option may add a row (assault torpedoes, P1-3). It is
      // on the card as an empty box in the "opt" state and ticked in the "take" state;
      // only "off" removes it - the same rule as in armModel().
      // add may be one row or a list of rows (Murder p.281: port and
      // starboard lance), the same contract as in armModel().
      + (sh.ol || []).reduce((a, o, i) =>
          a + (o.add && api.optState(u, i) !== "off"
               ? (Array.isArray(o.add[0]) ? o.add.length : 1) : 0), 0);
    // del removes the rows matching by name only in the "take" state (Cobra p.84).
    const delRows = (sh.ol || []).reduce((a, o, i) =>
      a + (o.del && api.optState(u, i) === "take"
           ? sh.aw.filter(r => new RegExp(o.del, "i").test(String(r[0]))).length : 0), 0);
    // 30.9.2026: list upgrade rows open as Option, so the list's own
    // swap (orbital mines, looted lances, plasma-boosted...) adds the replacing
    // row as an OR alternative to each of its rows that the ship's own taken
    // swap did not already replace. A taken list swap replaces the row: the count stays.
    const shipGone = new Set();
    (sh.ol || []).forEach((o, i) => { if (o.sw && api.optState(u, i) === "take") o.sw.f.forEach(f => shipGone.add(f)); });
    const listAlt = L.secs.reduce((a, sec, si) => a + sec.ents.reduce((b, en, ei) => {
      // only one set to Option on purpose: an unanswered list swap is
      // just a LOADOUT box (domain weaponRows)
      if (en.k !== "up" || !en.swp || api.upState(u, si, ei) !== "opt" || !(u.ups && Object.prototype.hasOwnProperty.call(u.ups, si + ":" + ei))) return b;
      const rx = new RegExp(en.swp.f, "i");
      return b + sh.aw.filter((r, fi) => !shipGone.has(fi) && rx.test(String(r[0])) &&
        (!en.swp.onlyrg || String(r[1]).indexOf(en.swp.onlyrg) >= 0)).length;
    }, 0), 0);
    const wantRows = sh.aw.length - gone + swapRows + addRows - delRows + listAlt;
    const rows = (h.match(/<tr class="w(?: alt| ammo)?"/g) || []).length;
    if (rows !== wantRows)
      fail(L.nm, ref, "weapon rows " + rows + " != expected " + wantRows);
    // A slot whose alternatives are all used (the swap taken) is no longer
    // a choice: its only row prints as an ordinary one (no OR, no circle).
    const model = api.armModel(u, sh);
    const slotN = {};
    model.forEach(r => { if (r.grp) slotN[r.i] = (slotN[r.i] || 0) + 1; });
    const wantAlt = model.filter(r => r.alt && slotN[r.i] > 1).length;
    const altRows = (h.match(/<tr class="w alt"/g) || []).length;
    if (altRows !== wantAlt)
      fail(L.nm, ref, "alternative weapon rows " + altRows + " != " + wantAlt);
    if (wantAlt) {
      // A group always has exactly one filled circle: either the base row (when
      // nothing was swapped) or the replacement that was taken.
      const groups = new Set(model.filter(r => r.grp && slotN[r.i] > 1).map(r => r.i));
      const marks = (h.match(/class="rb on"/g) || []).length;
      if (!/class="rb/.test(h))
        fail(L.nm, ref, "alternative armament has no choice circle");
      else if (marks !== groups.size)
        fail(L.nm, ref, "filled choice circles " + marks +
             " != alternative groups " + groups.size);
      if ((h.match(/<tbody class="g">/g) || []).length !== groups.size)
        fail(L.nm, ref, "alternative groups are not wrapped in their own tbody");
    }
    sh.aw.forEach(a => {
      // The card abbreviates the name the same way as the range and strength,
      // so the expected value is the abbreviated name - not the original.
      const printedName = api.shortWeaponName(a[0]);
      if (printedName && !norm(txt).includes(norm(printedName)))
        fail(L.nm, ref, "weapon missing from the card: " + a[0]);
      if (/\bsquadrons?\b/i.test(api.shortStrength(a[2])))
        fail(L.nm, ref, "a long squadron word was left in the STR/FP column: " + a[2]);
    });
    const badges = (h.match(/class="bg" style="--bd:#[0-9A-F]{6}"/gi) || []).length;
    if (badges !== wantRows)
      fail(L.nm, ref, "colour codes " + badges + " != weapon rows " + wantRows);
    // The arc is an image, so its proof is the data-arc attribute. Every
    // row must have it, and every arc must produce either a rosette
    // or a dash - an empty cell would mean lost information.
    const arcCells = (h.match(/<td class="ar" data-arc="[^"]*"/g) || []).length;
    if (arcCells !== wantRows)
      fail(L.nm, ref, "arc cells " + arcCells + " != weapon rows " + wantRows);
    const arcMarks = (h.match(/class="arcg"|class="noarc"/g) || []).length;
    if (arcMarks !== wantRows)
      fail(L.nm, ref, "arc marks " + arcMarks + " != weapon rows " + wantRows);

    /* J147: "Capacity: 1 Orca/Warden" broke mid-word in the narrow Str/FP
       column. The column now has the number and what it carries, without the
       "Cap." prefix. */
    if (/\bCap\./.test(txt))
      fail(L.nm, ref, "the weapon strength still reads Cap.");

    // 5 special. For a fort the rules are on the pair's two cards (txtAll).
    if ((sh.sr || "").trim().length > 20) {
      const first = norm(sh.sr).replace(/^[•\s]+/, "").slice(0, 40);
      if (first && !norm(txtAll).includes(first))
        fail(L.nm, ref, "a SPECIAL rule does not show on the card: " + first.slice(0, 50));
    }
    /* The gate gets the row (secs[u.s].ents[u.e]) like the card's own path: a section rule
       (sec / notSec) resolves only from the row. */
    api.SPECIAL_HULL_RULES.filter(d => api.DOMAIN.fleetMatches(d, sh, L, L.secs[u.s].ents[u.e]) && !(d.native && foreignReserve)).forEach(d => {
      const first = norm(d.text).slice(0, 42);
      if (!norm(txtAll).includes(first))
        fail(L.nm, ref, "a fleet-wide rule is missing from the SPECIAL section: " + d.id);
    });
    /* Every rule and damage note of the resolved unit is on the card - and
       for a fort on exactly one card of the pair: the plan card slots
       on the plan card, everything else on the rule card (Fleets p.501-505, p.111). */
    (R0.rules || []).forEach(x => {
      const first = norm(String(x.t || "").replace(/^\*\s*/, "")).slice(0, 42);
      if (!first) return;
      /* A short rule list (R.brief, space hulks; the user 9.10.2026 asked for only
         the HULK-specific special instructions and no basic weapon
         instructions): a basic weapon's rule (rules[].weapon) must NOT be on the card. */
      if (R0.brief && x.weapon) {
        if (norm(txt).includes(first)) fail(L.nm, ref, "a basic weapon rule on a short rule list card: " + first);
        return;
      }
      if (!fort) {
        if (!norm(txt).includes(first)) fail(L.nm, ref, "a rule of the resolved unit is missing from the card: " + first);
        return;
      }
      const onPlan = norm(strip(plan)).includes(first), onRules = norm(txt).includes(first);
      const wantPlan = FORT_PLAN_SLOTS.indexOf(x.slot) >= 0;
      if (onPlan !== wantPlan || onRules === wantPlan)
        fail(L.nm, ref, "a fort rule on the wrong card (slot " + (x.slot || "-") + "): plan=" + onPlan + " rules=" + onRules + " " + first);
    });
    if (R0.damage && R0.damage.note && !norm(txtAll).includes(norm(R0.damage.note).slice(0, 42)))
      fail(L.nm, ref, "the damage note is missing from the card");

    // 6 star reference: count the stars separately from the table and the loadout,
    //   otherwise the same regex hits both and the comparison means nothing
    const rules = api.specialLines(sh);
    const starred = api.starredKeys(rules, sh);
    const armTbl = (h.match(/<table class="k-arm"[\s\S]*?<\/table>/) || [""])[0];
    const loadout = (h.split("LOADOUT / OPTIONS")[1] || "").split("ARMAMENT")[0];
    const special = (h.split("SPECIAL RULES / UPGRADES")[1] || "").split("CRITICAL DAMAGE")[0]
      .split("SQUADRON HIT POINTS")[0];
    const ids = part => [...part.matchAll(/<b class="ast"[^>]*data-rule="([^"]+)"[^>]*>\*<\/b>/g)]
      .map(m => m[1]);
    const armIds = ids(armTbl), ruleIds = ids(special), optIds = ids(loadout);
    const wantedIds = Object.values(starred).flat().map(r => r.id);
    /* On a short rule list a weapon's star shows only if its rule is on the
       card (a bought option or upgrade): a star is not required, but
       every visible star must still have its rule (below). */
    (R0.brief ? [] : wantedIds).forEach(id => {
      if (!armIds.includes(id))
        fail(L.nm, ref, "the weapon's coloured star is missing: " + id);
      if (!ruleIds.includes(id))
        fail(L.nm, ref, "the weapon's star has no SPECIAL counterpart: " + id);
    });
    armIds.forEach(id => {
      if (!ruleIds.includes(id))
        fail(L.nm, ref, "a weapon marked with a star without a SPECIAL rule of the same colour: " + id);
    });
    /* A fort's plan card repeats the weapon rows (quadrant x 4, Basilica x 1):
       the same star as in the rule card's table, and every star on the plan
       card has its rule on the pair's rule card. */
    if (fort) {
      const planIds = ids(plan);
      armIds.forEach(id => {
        if (!planIds.includes(id)) fail(L.nm, ref, "a plan card weapon row has no star: " + id);
      });
      planIds.forEach(id => {
        if (!ruleIds.includes(id)) fail(L.nm, ref, "a plan card star has no rule on the rule card: " + id);
      });
    }

    // Every special weapon type recorded in the handbook gets a star on both the
    // weapon and its SPECIAL row. An ordinary battery/lance needs no star.
    sh.aw.forEach((a, i) => {
      const defs = R0.brief ? [] : api.SPECIAL_WEAPON_RULES.filter(d => api.defMatches(d, sh, a));
      defs.forEach(d => {
        if (!armIds.includes(d.id)) fail(L.nm, ref, "a special weapon without a star reference: " + a[0] + " -> " + d.id);
        if (!ruleIds.includes(d.id)) fail(L.nm, ref, "a special weapon without a rule row: " + a[0] + " -> " + d.id);
      });
    });
    // A list row may forbid the ship's own options entirely (RT Exploration
    // p.190, en.noopt): then the card has no options and no stars for them.
    const enRow = L.secs[u.s] && L.secs[u.s].ents[u.e];
    const noopt = !!(enRow && enRow.noopt);
    // A list row may forbid a single option (en.optno: the Mechanicus does not use
    // assault boats, p.125): it is not on the card.
    const optno = enRow && enRow.optno ? new RegExp(enRow.optno, "i") : null;
    const shownOl = noopt ? [] : (sh.ol || []).filter(o => !(optno && optno.test(o.t)));
    if (optno && (sh.ol || []).some(o => optno.test(o.t) && norm(txt).includes(norm(o.t).slice(0, 30))))
      fail(L.nm, ref, "an option forbidden by the list shows on the card");
    shownOl.forEach(o => {
      const defs = api.SPECIAL_WEAPON_RULES.filter(d => api.defOptionMatches(d, sh, o));
      defs.forEach(d => {
        if (R0.brief) return;   /* an open option's rule is not on a short list */
        if (!optIds.includes(d.id)) fail(L.nm, ref, "a special weapon option's star reference is missing: " + o.t + " -> " + d.id);
        if (!ruleIds.includes(d.id)) fail(L.nm, ref, "a special weapon option has no rule row: " + o.t + " -> " + d.id);
      });
      if (/torpedo[- ]?bomma/i.test(o.t)) {
        if (!defs.some(d => d.id === "ork_torpedo_bomma"))
          fail(L.nm, ref, "the Torpedo-Bomma option did not get its own special rule");
        if (defs.some(d => d.id === "ork_torpedo"))
          fail(L.nm, ref, "the Torpedo-Bomma was mixed up with the Ork Torpedo Launcha rule");
      }
    });

    // 7 optiot
    shownOl.forEach(o => {
      const head = norm(o.t).slice(0, 30);
      if (head && !norm(txt).includes(head))
        fail(L.nm, ref, "option missing from the card: " + o.t.slice(0, 45));
    });
    if (noopt && /Can replace|may be upgraded|may take/i.test(txt) &&
        (sh.ol || []).some(o => norm(txt).includes(norm(o.t).slice(0, 30))))
      fail(L.nm, ref, "an option still shows on the card of a noopt row");
    // the same count as on the card: the ship's options, list upgrades and the note
    const ups0 = R0.upgrades || [];
    const optCount = (R0.options || []).filter(o => o.state !== "off").length +
      ups0.filter(x => x.state === "take" || (x.state === "opt" && x.required)).length +
      Math.ceil(ups0.filter(x => x.state === "opt" && !x.required).length / 5) + ((R0.note || "").trim() ? 1 : 0);
    const wantMode = optCount >= 9 ? "opt-overflow" :
                     optCount >= 7 ? "opt-dense" :
                     optCount >= 5 ? "opt-compact" : "";
    if (wantMode && !h.includes(wantMode))
      fail(L.nm, ref, "a long option list did not get the compaction class " + wantMode);
    if (!h.includes('class="k-bd k-optbox"><div class="k-opt-list fit-content">'))
      fail(L.nm, ref, "the separate overflow fit for options is missing");

    // 8 boxes
    if (!esc) {
      /* Fleets p.501: a fort's hits are per quadrant - a quadrant
         carries the profile's hits value (12) and there are four quadrants, so
         there are four tracks and they are on the plan card. The rule card has no
         track: they appear exactly once in the pair. Other ships have one track. */
      const hitSrc = fort ? plan : h, tracks = fort ? 4 : 1;
      if (fort && /class="k-hits/.test(h))
        fail(L.nm, ref, "the fort rule card has a damage track although the tracks are on the plan card");
      // Damage bands only: `<i>number</i>` otherwise also hits the number
      // circles of the Gifts of the Omnissiah block.
      const bands = hitSrc.match(/<div class="k-hits(?: cr)?">[\s\S]*?<\/div>/g) || [];
      const boxes = bands.reduce(
        (a, b) => a + (b.match(/<i>\d+<\/i>/g) || []).length, 0);
      if (sh.hp && boxes !== sh.hp * tracks)
        fail(L.nm, ref, "HIT boxes " + boxes + " != hits " + sh.hp + (fort ? " x 4 quadrants" : ""));
      if (fort) {
        /* Quadrant weapons four times, Basilica weapons once
           (p.500 QUADRANT WEAPONS / BASILICA WEAPONS; p.110). The group is
           the resolver's field (zone), which the golden weapon_zones locks. */
        const act = (R0.weapons || []).filter(w => w.state !== "hidden");
        const nq = act.filter(w => w.zone === "quadrant").length;
        const nb = act.filter(w => w.zone === "basilica").length;
        if (nq + nb !== act.length || !nq || !nb)
          fail(L.nm, ref, "the fort weapon rows have no group: quadrant " + nq + ", basilica " + nb + ", rows " + act.length);
        const prow = (plan.match(/<tr style="--rw:#[0-9A-F]{6}">/gi) || []).length;
        if (prow !== nq * 4 + nb)
          fail(L.nm, ref, "plan card weapon rows " + prow + " != " + nq + " x 4 + " + nb);
        const pbadge = (plan.match(/class="bg" style="--bd:#[0-9A-F]{6}"/gi) || []).length;
        if (pbadge !== prow) fail(L.nm, ref, "plan card colour codes " + pbadge + " != rows " + prow);
        const ptxt = norm(strip(plan));
        const wantByName = {};
        act.forEach(w => {
          const key = api.shortWeaponName(w.a[0]);
          wantByName[key] = (wantByName[key] || 0) + (w.zone === "basilica" ? 1 : 4);
          /* the full range: the prototype dropped a launch bay's second value
             ("Fighters: 30 cm / Bombers: 20 cm" -> "30 cm") */
          String(w.a[1] || "").split(" / ").forEach(part => {
            if (part && /\d/.test(part) && !ptxt.includes(norm(part)))
              fail(L.nm, ref, "a plan card weapon row is missing part of its range: " + part);
          });
        });
        Object.keys(wantByName).forEach(key => {
          const got = plan.split(">" + key + "</td>").length - 1;
          if (got !== wantByName[key])
            fail(L.nm, ref, "weapon on the plan card " + got + " times, expected " + wantByName[key] + ": " + key);
        });
        const quads = (plan.match(/data-quadrant="(?:NW|NE|SW|SE)"/g) || []).length;
        if (quads !== 4) fail(L.nm, ref, "quadrants on the plan card " + quads + " != 4");
        /* re-roll boxes: the resolved unit's boxes as they are (Ramilies
           p.503 one included in the price; Fortress-Monastery p.111 bought) */
        const rrb = (R0.rerolls && R0.rerolls.boxes) || [];
        ["included", "bought", "optional"].forEach(k => {
          const n = plan.split('<i class="rrb ' + k + '">').length - 1;
          if (n !== rrb.filter(x => x === k).length)
            fail(L.nm, ref, "plan card re-roll boxes (" + k + ") " + n + " != " + rrb.filter(x => x === k).length);
        });
        /* criticals: every result's number and name are in the pair (p.505);
           a tick box in a quadrant or the Basilica, or the result is damage
           dealt at once (8 Hull breach +D3, 12 Reactor struck +D6) */
        const cmF = api.criticalModel(sh);
        cmF.rows.forEach(c => {
          if (!norm(txt).includes(norm(c[0] + " " + c[1])))
            fail(L.nm, ref, "a critical result is missing from the rule card table: " + c[0] + " " + c[1]);
        });
        const ticks = (plan.match(/<span><i><\/i><u><b>/g) || []).length;
        const perQuad = cmF.rows.filter(c => ["8", "9"].indexOf(String(c[0])) < 0).length;
        if (ticks !== perQuad * 4 + 2)
          fail(L.nm, ref, "plan card critical boxes " + ticks + " != " + perQuad + " x 4 + 2 (9 and 11 in the Basilica)");
        if (/class="tk"/.test(h))
          fail(L.nm, ref, "tick boxes in the rule card critical table although they are on the plan card");
      }
      // The boxes are in two bands: intact and crippled. Rulebook v1.10
      // p.65: "A ship which loses half its damage points is crippled", and
      // the book's example says an 8-hit Lunar is crippled at the FOURTH
      // point. So the limit is ceil(hp/2). This test used to expect
      // floor(hp/2)+1, which is right only for odd hull values.
      const crBox = Math.ceil((sh.hp || 0) / 2);
      // Fleets p.393: space hulks are not crippled, so there is no band.
      // Fleets p.501: a star fort's stats row is per quadrant.
      if (sh.qd && !h.includes("PER QUADRANT"))
        fail(L.nm, ref, "a quadrant ship has no quadrant mark on the card");
      // Fleets p.393 (Ork) and p.290 (Chaos): each hulk has its own
      // D6 table, repair ban and rules pages that the profile page does not
      // contain. The first version guarded only the ork, because the Chaos hulk's
      // p.290 was left unread - the printed card revealed it.
      if (/\bHULK\b/i.test(String(sh.nm || ""))) {
        const chaos = /\bCHAOS\b/i.test(String(sh.nm || ""));
        const want = chaos ? "CHAOS SPACE HULK CRITICAL" : "ORK HULK CRITICAL";
        if (!h.includes(want))
          fail(L.nm, ref, "the hulk is missing its own critical table: " + want);
        if (h.includes("CRITICAL DAMAGE (2D6)"))
          fail(L.nm, ref, "the hulk has the general 2D6 table");
        if (!/cannot repair/i.test(h))
          fail(L.nm, ref, "the hulk is missing its repair ban");
        if (!/exactly 10 cm/.test(h))
          fail(L.nm, ref, "the hulk is missing its movement rule (Fleets pp. 289/392)");
        if (chaos && !/twice as many attack craft/.test(h))
          fail(L.nm, ref, "the Chaos hulk is missing 2x attack craft (p.289)");
        if (!chaos && !/always Leadership 6/.test(h))
          fail(L.nm, ref, "the ork hulk is missing Ld 6 (p.392)");
      }
      const hulk = /\bhulk\b/i.test(String(sh.nm || ""));
      if (hulk) {
        if (h.includes('class="k-hits cr"'))
          fail(L.nm, ref, "the hulk has a crippled band although it is never crippled");
        if (!h.includes("NOT CRIPPLED"))
          fail(L.nm, ref, "the hulk card does not say that it is never crippled");
      } else if (sh.hp && crBox >= 2 && crBox <= sh.hp) {
        /* A fort has the band on each of its four tracks: Fleets p.501
           "Quadrants are crippled individually once they are reduced to 6
           Damage Points" - out of 12 hits, i.e. from box 6 (ceil(12/2)). */
        const crBands = hitSrc.match(/<div class="k-hits cr">([\s\S]*?)<\/div>/g) || [];
        if (crBands.length !== tracks)
          fail(L.nm, ref, "crippled bands " + crBands.length + " != " + tracks);
        const band = (hitSrc.match(/<div class="k-hits cr">([\s\S]*?)<\/div>/) || [, ""])[1];
        const crBoxes = (band.match(/<i>\d+<\/i>/g) || []).length;
        if (crBoxes !== sh.hp - crBox + 1)
          fail(L.nm, ref, "the crippled band has " + crBoxes + " boxes, expected " +
               (sh.hp - crBox + 1));
        crBands.forEach(b => {
          if ((b.match(/<i>\d+<\/i>/g) || []).length !== sh.hp - crBox + 1 || !b.includes("<i>" + crBox + "</i>"))
            fail(L.nm, ref, "the crippled band does not start at box " + crBox + " or has the wrong length");
        });
        if (hitSrc.split("CRIPPLED <em>from box " + crBox + "</em>").length - 1 !== tracks)
          fail(L.nm, ref, "the crippled band heading does not state its first box");
        // The book's own example locked in: 8 hits -> box 4.
        if (sh.hp === 8 && crBox !== 4)
          fail(L.nm, ref, "an 8-hit ship's crippled limit is not box 4");
      }
      const ctx = String(sh.fl || "") + " " + String(sh.nm || "");
      const cm = api.criticalModel(sh);
      if (/TYRANID/i.test(ctx) && (!txt.includes(cm.title) || !txt.includes("SPORES OFF")))
        fail(L.nm, ref, "a Tyranid ship is missing the Tyranid critical table");
      if (/NECRON/i.test(ctx) && (!txt.includes(cm.title) || !txt.includes("COMMAND CORE") ||
          !/4\+ = 1 crit/.test(txt)))
        fail(L.nm, ref, "a Necron ship is missing the Necron critical/repair table");
      /* Gifts of the Omnissiah: all six on every Mechanicus capital ship,
         never on the list's Imperial Navy escorts. */
      /* J217: a Demiurg mercenary (p.483) is a Demiurg ship in a Mechanicus
         fleet too - the same exception as the domain's isMechanicusVessel. */
      const isDemiurg = /^DEMIURG$/i.test(String(sh.fl || ""));
      if (/Mechanicus/i.test(L.nm) && isDemiurg && (txtAll.includes("GIFTS OF THE OMNISSIAH") || txtAll.includes("ALL ADMECH")))
        fail(L.nm, ref, "a Demiurg mercenary card has the Mechanicus block (p.483: a Demiurg ship)");
      const isAdMechList = /Mechanicus/i.test(L.nm) && !foreignReserve && !isDemiurg;
      const isEscortShip = /escort/i.test(sh.ty || "");
      /* p.126: the Omnissiah's Victory "cannot take any refits (from the
         Mechanicus Gifts table or from elsewhere)" - no Gifts block, but it
         is still a Mechanicus vessel for the repair bonus. */
      const noGifts = /omnissiah.s victory/i.test(sh.nm || "");
      /* A planetary defence (the profile's df) at the end of the Explorator list is not
         a Mechanicus ship: it is bought from the Fleets p.499 price list, and
         p.118-120 give the Gifts table, +1 turret and the repair bonus to the list's
         own capital ships ("Mechanicus capital ships must also roll
         ..."). The domain rightly leaves them off a defence; the card must not
         have the Gifts block or the REPAIR +1D6 row. The exception covers only
         df profiles. */
      const isDefence = !!sh.df;
      if (isAdMechList && isDefence && (txtAll.includes("GIFTS OF THE OMNISSIAH") || txtAll.includes("ALL ADMECH")))
        fail(L.nm, ref, "a defence card has the Mechanicus block (p.499: not a list ship)");
      if (isAdMechList && !isEscortShip && !noGifts && !isDefence) {
        if (!txt.includes("GIFTS OF THE OMNISSIAH"))
          fail(L.nm, ref, "an AdMech capital ship is missing the Gifts block");
        ["Energy Reserves", "Advanced Engines", "Repulsor Shielding",
         "Fleet Defence Turrets", "Targeting Matrix", "Weapon Relays"].forEach(g => {
          if (!txt.includes(g)) fail(L.nm, ref, "missing from the Gifts block: " + g);
        });
      }
      if (isAdMechList && !isEscortShip && !isDefence && !txt.includes("ALL ADMECH: REPAIR +1D6"))
        fail(L.nm, ref, "AdMech is missing the REPAIR +1D6 deviation");
      if (isAdMechList && (isEscortShip || noGifts) && txt.includes("GIFTS OF THE OMNISSIAH"))
        fail(L.nm, ref, noGifts ? "the Omnissiah's Victory must not have a Gifts block (p.126)"
                                : "an escort must not have a Gifts block");

      /* The standard trigger moved to the heading row; it must no longer be a rule row. */
      if (txt.includes("A hit that gets through the shields"))
        fail(L.nm, ref, "the old standard sentence is still a special rule");
      if (!/(through shields|every Hit): 6|4\+/.test(txt))
        fail(L.nm, ref, "the critical trigger hint is missing from the heading row");

      /* The Haven Space Station (Fleets p.332) is an Eldar hull, but not an Eldar
         ship in these two respects: p.334 "armour 5+ and take critical
         damage on a 5+" (Eldar ships 4+, p.307) and p.335 its own
         CRITICAL HITS TABLE (Infinity Circuit, Pulsar Lances, Polarization
         Field ...). The checker demanded the Eldar ships' 4+ from it; the expectation is now
         the Haven's own threshold and its own table. The Holofields row is in both
         tables. */
      const haven = /^HAVEN\b/i.test(String(sh.nm || ""));
      if (haven && (!txt.includes(cm.title) || !/HAVEN/.test(cm.title) || !txt.includes("HOLOFIELDS") ||
                    !txt.includes("INFINITY CIRCUIT") || !txt.includes("critical damage on 5+") ||
                    !/every Hit: 5\+/.test(txt) || txt.includes("critical damage on 4+")))
        fail(L.nm, ref, "the Haven is missing its own critical table or the 5+ threshold (p.334-335)");
      if (/^ELDAR\b/i.test(String(sh.fl || "")) && !haven &&
          (!txt.includes(cm.title) || !txt.includes("HOLOFIELDS") || !txt.includes("critical damage on 4+")))
        fail(L.nm, ref, "an Eldar ship is missing the Eldar critical table");
      if (/DARK ELDAR/i.test(ctx) &&
          (!txt.includes(cm.title) || !txt.includes("SHADOWFIELDS") || !txt.includes("Dark Eldar table")))
        fail(L.nm, ref, "a Dark Eldar ship is missing the Dark Eldar critical table");
    } else {
      /* There are at least six member boxes, or the card's own cap if it is
         smaller: Fleets p.499 "0-4 Air bases" - the card holds at most
         four. The squadron size or the card's cap is stated in the heading: a
         squadron named by the book "squadron min-max" (escorts from the list's rule,
         one-hit defences Rulebook p.100 "up to six units"), a bare
         card cap "up to N per card" without the word squadron. */
      const sq = Rk.squadron || {};
      const wantSlots = Math.max(Math.min(6, sq.max || 6), 3);
      const slots = (h.match(/<div class="(gh)?"><em>/g) || []).length;
      if (slots !== wantSlots) fail(L.nm, ref, "squadron boxes " + slots + " != " + wantSlots);
      const live = (h.match(/<div class=""><em>/g) || []).length;
      if (live !== 3) fail(L.nm, ref, "boxes for bought members " + live + " != 3");
      if (held) {
        if (!txt.includes("up to " + sq.max + " per card"))
          fail(L.nm, ref, "the card cap 'up to " + sq.max + " per card' is missing");
        if (/SQUADRON|squadron \d/.test(txt))
          fail(L.nm, ref, "a squadron rule on the card of a unit the book gives none (p.517)");
      } else {
        const m = txt.match(/squadron (\d+)\D(\d+)/);
        if (!m || +m[1] !== sq.min || +m[2] !== sq.max)
          fail(L.nm, ref, "the squadron size is not on the card: expected " + sq.min + "-" + sq.max);
      }
      if (/class="k-hits|class="k-crit"/.test(h))
        fail(L.nm, ref, "a squadron card has a damage track or a critical table");
      /* A planetary defence is neither a Chaos nor a Mechanicus ship (p.499), and
         a unit of type Defence/Ground is not an escort: no ESCORT sentence. */
      if (sh.df && !/escort/i.test(sh.ty || "") && /ESCORT:/.test(txt))
        fail(L.nm, ref, "a Defence/Ground card has the escort sentence");
    }

    // 9 junk - on every card of the unit
    ["undefined", "NaN", "[object", "null"].forEach(w => {
      if (cs.some(c => c.includes(w))) fail(L.nm, ref, "the card contains " + w);
    });
  });
});

/* ------------------------------------------------- rule cards ----
   Orbital mine (Fleets p.512), Minefield (p.513) and Fire ship (p.516) are
   rules, not profiles: the card is the resolved unit's ruleCard - a lead,
   numbered steps and record boxes. The first two are rows without a
   hull, which the loop above never visits; the fire ship is a ship
   that gets the same card with a stats row. For each: the card is not empty, has no
   junk, every step heading and text is on the card, and there are as many record
   boxes as bought items. */
let ruleCards = 0;
LISTS.forEach((L, li) => {
  if (filter && !L.nm.toLowerCase().includes(filter.toLowerCase())) return;
  api.S.li = li; api.S.limit = 100000;
  L.secs.forEach((sec, si) => sec.ents.forEach((en, ei) => {
    if (en.k === "up" || en.k === "cmd") return;
    if (en.r && !SHIPS[String(en.r)]) return;
    const N = 3;
    const u = { s: si, e: ei, ref: en.r || null, n: N, opts: [], os: {}, name: "" };
    api.S.units = [u];
    api.applyRequired(u);
    const R = api.resolveUnit(u) || {};
    const ref = "s." + (en.src_page || "?") + " " + en.l;
    /* a hull-less row that is not a commander must be a rule card,
       or the player pays for a row that prints nothing */
    if (!en.r && R.card !== "rule") { fail(L.nm, ref, "a hull-less row without a rule card (card=" + R.card + ")"); return; }
    if (R.card !== "rule") return;
    const rc = R.ruleCard;
    if (!rc) { fail(L.nm, ref, "the rule card content (ruleCard) is missing from the resolved unit"); return; }
    let cs = [];
    try { cs = api.unitCards(u).map(c => c.html("top")); }
    catch (e) { fail(L.nm, ref, "the rule card threw: " + e.message); return; }
    if (cs.length !== 1 || cs[0] !== api.cardHTML(u, "top")) { fail(L.nm, ref, "rule cards " + cs.length + ", expected 1"); return; }
    const h = cs[0], txt = norm(strip(h).replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">"));
    ruleCards++;
    if (h.length < 400 || !/^<div class="k /.test(h)) fail(L.nm, ref, "the rule card came out empty or without the k frame");
    ["undefined", "NaN", "[object", "null"].forEach(w => {
      if (h.includes(w)) fail(L.nm, ref, "the rule card contains " + w);
    });
    if (!/<div class="k-hd">[\s\S]*?<h3>[^<]+<\/h3>/.test(h)) fail(L.nm, ref, "the rule card has no heading");
    if (!txt.includes(norm(rc.title))) fail(L.nm, ref, "the rule card has no name: " + rc.title);
    if (!txt.includes("pg. " + rc.page)) fail(L.nm, ref, "the rule card has no page reference pg. " + rc.page);
    if (rc.lead && !txt.includes(norm(rc.lead))) fail(L.nm, ref, "the rule card has no lead");
    (rc.steps || []).forEach((s, i) => {
      if (!txt.includes(norm(s.h))) fail(L.nm, ref, "step " + (i + 1) + " heading missing: " + s.h);
      if (!txt.includes(norm(s.t))) fail(L.nm, ref, "step " + (i + 1) + " text missing: " + s.t.slice(0, 40));
    });
    const stepNos = (h.match(/<div class="rstep"><b>\d+<\/b>/g) || []).length;
    if (stepNos !== (rc.steps || []).length) fail(L.nm, ref, "numbered steps " + stepNos + " != " + (rc.steps || []).length);
    /* the price in words: the unit price and the number bought (the p.499 price row) */
    if (en.p != null && !txt.includes(N + " bought") ) fail(L.nm, ref, "the number bought is missing from the card");
    if (en.p != null && !txt.includes(en.p + " pts each")) fail(L.nm, ref, "the unit price is missing from the card");
    if (en.p != null && !new RegExp('<span>PTS</span><i>' + (en.p * N) + "</i>").test(h))
      fail(L.nm, ref, "the PTS box does not hold " + (en.p * N));
    /* the row's own limit (p.499: "0-2 Minefields", "0-6 Fire ships") */
    if (en.mx != null && !new RegExp("0\\D" + en.mx + " per fleet").test(txt))
      fail(L.nm, ref, "the row limit 0-" + en.mx + " is missing from the card");
    /* record boxes = the number bought */
    const kind = rc.track && rc.track.kind;
    const ticks = h.split('<i class="rtk"></i>').length - 1;
    const sizes = h.split('<i class="rwr"></i>').length - 1;
    const members = (h.match(/<div class=""><em>/g) || []).length;
    if (R.squadron) {
      if (members !== N) fail(L.nm, ref, "member boxes " + members + " != bought " + N);
    } else if (kind === "size") {
      /* p.513: "D3 x 5 cm by D3 x 5 cm" - two write-in boxes per field */
      if (sizes !== 2 * N || ticks) fail(L.nm, ref, "size boxes " + sizes + " != 2 x " + N);
    } else if (ticks !== N) fail(L.nm, ref, "tick boxes " + ticks + " != bought " + N);
    /* a ship (fire ship): stats row from the profile, fixed Ld, its own rules, no armament table */
    const sh = en.r ? SHIPS[String(en.r)] : null;
    if (sh) {
      [["speed", sh.sp], ["turns", sh.tn], ["shields", api.shortShield(sh.sh)], ["turrets", sh.tu]].forEach(([k, v]) => {
        if (v && !new RegExp("<div class=\"v\"><b>" + String(v).replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "</b>").test(h))
          fail(L.nm, ref, "stat " + k + "=" + JSON.stringify(v) + " does not show on the rule card stats row");
      });
      if (sh.dld != null && !h.includes('<span>LEADERSHIP</span><div class="v"><b>' + sh.dld + "</b>"))
        fail(L.nm, ref, "fixed Leadership " + sh.dld + " is missing from the rule card");
      (R.rules || []).forEach(x => {
        if (!txt.includes(norm(String(x.t).replace(/^\*\s*/, "")).slice(0, 42)))
          fail(L.nm, ref, "a ship rule is missing from the rule card: " + String(x.t).slice(0, 40));
      });
      if (R.damage && R.damage.note && !txt.includes(norm(R.damage.note).slice(0, 42)))
        fail(L.nm, ref, "the damage note is missing from the rule card");
      if ((sh.aw || []).length === 0 && /class="k-arm"/.test(h))
        fail(L.nm, ref, "an unarmed ship has an armament table (p.516: no ARMAMENT table)");
    } else if (/class="k-st"/.test(h)) fail(L.nm, ref, "a hull-less row has a stats row");
  }));
});
api.S.units = [];
console.log("Rule cards %d.", ruleCards);

/* --------------------------------------- one colour per list ---- */
LISTS.forEach((L, li) => {
  if (filter && !L.nm.toLowerCase().includes(filter.toLowerCase())) return;
  api.S.li = li;
  const cols = {};
  L.secs.forEach((sec, si) => sec.ents.forEach((en, ei) => {
    if (!en.r || !SHIPS[String(en.r)]) return;
    api.S.units = [{ s: si, e: ei, ref: en.r, n: 1, opts: [], os: {}, name: "" }];
    const h = api.cardHTML(api.S.units[0], "top");
    const m = h.match(/--kd:(#[0-9A-Fa-f]{6})/);
    if (m) (cols[m[1]] = cols[m[1]] || []).push(SHIPS[String(en.r)].nm);
  }));
  const keys = Object.keys(cols);
  if (keys.length > 1)
    fail(L.nm, "-", "cards in " + keys.length + " different colours: " +
         keys.map(k => k + " (" + cols[k][0] + ")").join(", "));
});
api.S.units = [];

/* ---------------------------------------------- komentajakortit ---- */
const FWD = /\b(shown below|noted below|listed below|the following|as follows)\b/i;
let cmdCards = 0;
LISTS.forEach((L, li) => {
  if (filter && !L.nm.toLowerCase().includes(filter.toLowerCase())) return;
  api.S.li = li;
  L.secs.forEach((sec, si) => sec.ents.forEach((en, ei) => {
    if (en.k !== "cmd") return;
    api.S.units = [{ s: si, e: ei, ref: null, n: 1, opts: [], os: {}, name: "" }];
    let h = "";
    try { h = api.cardHTML(api.S.units[0], "top"); }
    catch (e) { fail(L.nm, en.l, "the commander card threw: " + e.message); return; }
    if (!h || h.length < 400) { fail(L.nm, en.l, "the commander card stayed empty"); return; }
    cmdCards++;
    (sec.own || []).forEach((owner, i) => {
      if (!owner) return;
      const oe = sec.ents.find(x => x.l === owner);
      const txt = sec.text[i];
      const key = txt.slice(0, 40);
      if ((sec.ownx || []).indexOf(i) >= 0) {
        // a block started by its own price row: only for that row
        if (h.includes(key) !== (owner === en.l))
          fail(L.nm, en.l, (owner === en.l ? "the card is missing its own rule: "
                                           : "the card has another commander's rule: ") + key);
      } else if ((en.skiptx || []).indexOf(txt) >= 0) {
        // A section's general sentence that does not hold for this row: Kor'O'Mesme has
        // two re-rolls (p.453 "Re-rolls: 2"), not the one of the list's general sentence
        // (p.456 "The commander has one re-roll included in his points
        // cost."). The card must not state two different numbers (review
        // 5.10.2026), so the sentence must NOT be on his card.
        if (h.includes(key))
          fail(L.nm, en.l, "the card has a general sentence that does not hold for this commander: " + key);
      } else if (!oe || oe.k !== "up") {
        // the section's shared paragraph: for every commander
        if (!h.includes(key))
          fail(L.nm, en.l, "the card is missing the base commander rule: " + key);
      } else if (!FWD.test(txt)) {
        // the effect of an upgrade not bought - only in the rules block: in the options
        // list the upgrade is now an empty box (30.9.2026)
        if ((h.split("COMMANDER RULES")[1] || "").includes(key))
          fail(L.nm, en.l, "the card shows the effect of an upgrade not bought: " + key);
      }
    });
  }));
});
api.S.units = [];
console.log("Commander cards %d.", cmdCards);

console.log("Rendered %d cards from %d lists.", cards,
  LISTS.filter(L => !filter || L.nm.toLowerCase().includes(filter.toLowerCase())).length);
console.log("Findings: %d\n", bad);

const byMsg = {};
found.forEach(([l, s, m]) => {
  const key = m.replace(/[:=].*$/, "").trim();
  (byMsg[key] = byMsg[key] || []).push([l, s, m]);
});
Object.keys(byMsg).sort().forEach(k => {
  const rows = byMsg[k];
  console.log("== %s: %d ==", k, rows.length);
  const lim = VERBOSE ? rows.length : 8;
  rows.slice(0, lim).forEach(([l, s, m]) =>
    console.log("   %s | %s | %s", l.slice(0, 24).padEnd(24), s.slice(0, 34).padEnd(34), m.slice(0, 90)));
  if (rows.length > lim) console.log("   ... and %d more", rows.length - lim);
  console.log();
});
process.exit(bad ? 1 : 0);
