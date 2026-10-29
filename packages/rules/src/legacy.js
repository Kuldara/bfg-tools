import { listByName, listOfIntent, roleOfIntent } from "./lending.js";
import { HOST_OFF, hostUpgradesAllowed, isUpgradeEnt } from "./upgrades.js";


/* 3 since 1.1: a unit may name the list it was bought from (u.lst) and its
   role (u.role). Both are omitted for a ship from the fleet's own list, so
   a single-list document is byte-identical to schema 2. */
export var SCHEMA_VERSION = 4;
export var SEP = "\u0001";          /* same separator as the save's upn keys */
export var TEXT_KEY_LEN = 40;       /* fallback key when an id no longer matches */

/* Whole text, never truncated: the Chaos battle barge (Fleets p. 257) has two
   options that differ only after their 80th character (45 cm/FP 8 versus
   30 cm/FP 10), and a truncated hash gave them one id. */
export function normOptText(t){
  return String(t == null ? "" : t).toLowerCase().replace(/[^a-z0-9]/g, "");
}
export function textKey(t){ return String(t == null ? "" : t).slice(0, TEXT_KEY_LEN); }

/* Index of a ship option by id, then by the first 40 characters of its text,
   -1 when neither matches. The text fallback covers an id that changed
   because the extracted text was corrected (docs/SAVE_SCHEMA.md); it only
   counts when exactly one option carries that prefix, otherwise the choice
   would be a guess (p. 257 again: two options share their first 40). */
export function optionIndex(sh, id, text){
  var ol = (sh && sh.ol) || [];
  var i, hit = -1, hits = 0;
  for(i = 0; i < ol.length; i++) if(id != null && ol[i].id === id) return i;
  if(text){
    for(i = 0; i < ol.length; i++) if(textKey(ol[i].t) === text){ hit = i; hits++; }
  }
  return hits === 1 ? hit : -1;
}

export function upgradeId(listName, secTitle, label){
  return String(listName) + SEP + String(secTitle) + SEP + String(label);
}
export function splitUpgradeId(id){
  var p = String(id).split(SEP);
  return p.length === 3 ? { list: p[0], section: p[1], label: p[2] } : null;
}

export function splitMembers(s){
  if(Array.isArray(s)) return s.slice();
  return String(s == null ? "" : s).split(/[,\/]/).map(function(x){ return x.trim(); }).filter(Boolean);
}
export function joinMembers(a){ return (a || []).join(", "); }

export function refKey(ref){ return ref == null ? null : String(ref); }

/* Fleets p.102: a Venerable battle barge is an Imperial or Chaos hull with a
   Space Marine crew. The catalog profile is the Navy or Chaos ship; what the
   fleet fields is that hull "exactly as is, in its basic form" with the
   Space Marine refits: none of the profile's own optional refits or
   upgrades, launch bays halved (rounding up) and Thunderhawks only, and -
   if it has a prow weapon - the choice of strength-6 torpedo tubes (30 cm)
   at no cost. The view is derived once per hull and served wherever the
   profile is looked up (shipFor), so every calculator sees the barge and
   not the Navy ship. The Seditio Opprimere (p.103) is already a Space
   Marine vessel and is used as printed. */
/* Cached per catalog object, so a replaced catalog (a test's shuffled copy,
   a re-loaded page) gets its own view. */
export var VEN_VIEWS = typeof WeakMap === "function" ? new WeakMap() : null;
export function venerableView(sh){
  if(!sh || /SPACE MARINES/i.test(String(sh.fl || ""))) return sh;
  if(VEN_VIEWS && VEN_VIEWS.get(sh)) return VEN_VIEWS.get(sh);
  var v = JSON.parse(JSON.stringify(sh));
  v.ven = 1; v.fl0 = sh.fl; v.fl = "SPACE MARINES";
  var bays = false;
  v.aw = (sh.aw || []).map(function(a){
    if(!/launch bay/i.test(a[0])) return a.slice();
    bays = true;
    var st = String(a[2]).replace(/\d+/, function(m){ return String(Math.ceil(+m / 2)); });
    if(/^1\b/.test(st)) st = st.replace(/\bsquadrons\b/i, "squadron");
    return [a[0], "Thunderhawk: 20 cm", st, a[3]];
  });
  var prow = -1;
  v.aw.forEach(function(a, i){ if(prow < 0 && /^prow\b/i.test(a[0]) && !/torpedo/i.test(a[0])) prow = i; });
  v.ol = prow < 0 ? [] : [{
    id: "venerable_prow_torpedoes", c: 0, var: 0,
    t: "Venerable refit: may replace the prow weapon with strength-6 torpedo tubes (speed 30 cm) for no change in cost (Fleets p. 102).",
    sw: { f: [prow], t: [["Prow torpedoes", "30 cm", "6", "Front"]] }
  }];
  v.sr = [String(sh.sr || "").trim(),
    "\u2022 Venerable battle barge: an ancient, revered vessel with a Space Marine crew. It may not take the refits or upgrades of its own profile and is used exactly as is. Worth 100% Victory Points if crippled and 150% if destroyed. (Fleets p. 102)",
    bays ? "\u2022 Its launch bays carry Thunderhawks only, at half the printed capacity, rounding up. (Fleets p. 102)" : ""
  ].filter(Boolean).join(" ");
  if(VEN_VIEWS) VEN_VIEWS.set(sh, v);
  return v;
}
/* The profile a unit fields: the catalog ship, or the Venerable view of it
   when the list row is a hull choice (en.hc). */
export function shipFor(ref, en, catalog){
  var sh = ref == null ? null : catalog.ships[refKey(ref)];
  return sh && en && en.hc ? venerableView(sh) : sh;
}
/* The app stores a numeric page as a number and a variant page ("472b") as a
   string; keep that so the legacy object is what the app produced. */
export function legacyRef(ref){ return ref == null ? null : (isNaN(+ref) ? String(ref) : +ref); }

export function findEntry(list, section, label){
  if(!list) return null;
  var si, ei, sec;
  for(si = 0; si < list.secs.length; si++){
    sec = list.secs[si];
    if(sec.t !== section) continue;
    for(ei = 0; ei < sec.ents.length; ei++) if(sec.ents[ei].l === label) return { si: si, ei: ei };
  }
  /* The row moved to another section: same rule as load(). */
  for(si = 0; si < list.secs.length; si++){
    sec = list.secs[si];
    for(ei = 0; ei < sec.ents.length; ei++) if(sec.ents[ei].l === label) return { si: si, ei: ei };
  }
  return null;
}

/* An upgrade row by section and label, seen from one unit. The same label
   can appear several times in a section with a different attachment each
   (Tyranids, Fleets: 'Pyro-acid battery' at 5/10/15 points for the Vanguard
   drone, Escort drone and Kraken), and a section title can repeat across the
   list. The row that is attached to this unit wins; a targetless row is
   next; several candidates with none attached is ambiguous -> null. The
   legacy load() settled the same case with the same preference. */
export function findUpgradeEntry(list, section, label, si, ei){
  if(!list) return null;
  var cands = [], s2, e2, sec, en;
  for(s2 = 0; s2 < list.secs.length; s2++){
    sec = list.secs[s2];
    if(sec.t !== section) continue;
    for(e2 = 0; e2 < sec.ents.length; e2++)
      if(sec.ents[e2].l === label && isUpgradeEnt(sec.ents[e2])) cands.push({ si: s2, ei: e2 });
  }
  if(!cands.length){
    /* the row moved to another section */
    for(s2 = 0; s2 < list.secs.length; s2++){
      sec = list.secs[s2];
      for(e2 = 0; e2 < sec.ents.length; e2++)
        if(sec.ents[e2].l === label && isUpgradeEnt(sec.ents[e2])) cands.push({ si: s2, ei: e2 });
    }
  }
  if(cands.length === 1) return cands[0];
  if(!cands.length) return null;
  var attached = cands.filter(function(c){
    en = list.secs[c.si].ents[c.ei];
    return en.at && en.at.some(function(p){ return p[0] === si && p[1] === ei; });
  });
  if(attached.length) return attached[0];
  var free = cands.filter(function(c){ return !list.secs[c.si].ents[c.ei].at; });
  return free.length ? free[0] : null;
}

/* Legacy unit (S.units[i]) -> CanonicalUnitIntent.
   ctx = { list } where list is the fleet list object the unit sits on (or
   null for a unit bought outside any list); catalog = { ships, lists }. */
export function fromLegacyUnit(u, ctx, catalog){
  /* u.lst: the unit was bought from another list (reserve or ally). Its
     section and row indexes are that list's, so it must be read there. */
  var L = (u.lst && listByName(catalog, u.lst)) || (ctx && ctx.list ? ctx.list : null);
  var sec = L && u.s >= 0 ? L.secs[u.s] : null;
  var en = sec ? sec.ents[u.e] : null;
  var sh = shipFor(u.ref, en, catalog);
  var intent = {
    schemaVersion: SCHEMA_VERSION,
    role: u.role === "reserve" || u.role === "ally" ? u.role : "core",
    entry: en ? { list: L.nm, section: sec.t, label: en.l } : null,
    ref: refKey(u.ref),
    hull: en && en.hc ? refKey(u.ref) : null,
    hulls: u.n > 0 ? u.n : 1,
    name: u.name || "",
    note: u.note || "",
    adjust: u.adj ? +u.adj : 0,
    custom: u.custom == null ? null : +u.custom,
    members: splitMembers(u.members),
    options: {},
    upgrades: {}
  };
  /* J215: the unit's own handle and, on a commander, the ship he is aboard
     (that ship's uid). Only when present: a save without them is read as
     before. */
  if(u.uid) intent.uid = String(u.uid);
  if(u.aboard) intent.aboard = String(u.aboard);
  /* J216: the squadron the ship is in (same tag, same squadron) and, in Da
     Ork Clanz, the Warlord whose command it is (his uid) */
  if(u.sq) intent.sq = String(u.sq);
  if(u.cmd) intent.cmd = String(u.cmd);
  /* J226/RAW-04: a Clanz Warlord's own clan, which his skwadrons are of */
  if(u.clan) intent.clan = String(u.clan);
  var ol = (sh && sh.ol) || [];
  ol.forEach(function(o, i){
    var st = (u.os && u.os[i]) || null;
    if(!st && (u.opts || []).indexOf(i) >= 0) st = "take";   /* pre-os save */
    var q = u.oq && u.oq[i] > 1 ? +u.oq[i] : 1;
    if(st || q > 1) intent.options[o.id] = { state: st || "opt", qty: q };
  });
  /* The key "si:ei" points at a row of the unit's own list, and a key moved by
     HOST_OFF at the fleet's list (p. 14: upgrades from either list for the
     same race). The id is always built from the name of the list the row is
     on - otherwise it would not resolve back. */
  var hostUp = hostUpgradesAllowed(L, ctx && ctx.host ? ctx.host : null)
             ? ctx.host : null;
  Object.keys(u.ups || {}).forEach(function(k){
    var p = k.split(":"), si = +p[0];
    var Lx = si >= HOST_OFF ? hostUp : L;
    var s2 = Lx && Lx.secs[si >= HOST_OFF ? si - HOST_OFF : si];
    var e2 = s2 && s2.ents[+p[1]];
    if(e2 && u.ups[k]) intent.upgrades[upgradeId(Lx.nm, s2.t, e2.l)] = u.ups[k];
  });
  return intent;
}

/* CanonicalUnitIntent -> { unit: legacy unit, issues: [] }.
   Issues use the structure P1-8e makes general:
   { code, severity, path, message, sourcePage }. */
export function toLegacyUnit(intent, ctx, catalog){
  var issues = [];
  var L = listOfIntent(intent, ctx, catalog);
  var at = intent.entry && L ? findEntry(L, intent.entry.section, intent.entry.label) : null;
  if(intent.entry && !at)
    issues.push({ code: "entry.unknown", severity: "error", path: "entry",
                  message: "list row not found: " + intent.entry.label, sourcePage: null });
  var sh = shipFor(intent.ref, at ? L.secs[at.si].ents[at.ei] : null, catalog);
  if(intent.ref != null && !sh)
    issues.push({ code: "ship.unknown", severity: "error", path: "ref",
                  message: "profile not found: " + intent.ref, sourcePage: null });
  var u = {
    s: at ? at.si : -1, e: at ? at.ei : -1,
    ref: legacyRef(intent.ref),
    n: intent.hulls > 0 ? intent.hulls : 1,
    name: intent.name || "",
    opts: [], os: {}, oq: {}, ups: {}, upn: {}
  };
  if(L && ctx && ctx.list && L !== ctx.list) u.lst = L.nm;
  if(roleOfIntent(intent) !== "core") u.role = roleOfIntent(intent);
  if(intent.note) u.note = intent.note;
  if(intent.adjust) u.adj = intent.adjust;
  if(intent.custom != null) u.custom = intent.custom;
  if(intent.members && intent.members.length) u.members = joinMembers(intent.members);
  if(intent.hull != null && sh) u.hn = sh.nm;
  if(intent.uid) u.uid = String(intent.uid);
  if(intent.aboard) u.aboard = String(intent.aboard);
  if(intent.sq) u.sq = String(intent.sq);
  if(intent.cmd) u.cmd = String(intent.cmd);
  if(intent.clan) u.clan = String(intent.clan);
  Object.keys(intent.options || {}).forEach(function(id){
    var o = intent.options[id];
    var i = optionIndex(sh, id, null);
    if(i < 0){
      issues.push({ code: "option.unknown_id", severity: "error", path: "options." + id,
                    message: "option id not in profile " + intent.ref, sourcePage: sh ? sh.pg : null });
      return;
    }
    if(o.state) u.os[i] = o.state;
    if(o.qty > 1) u.oq[i] = o.qty;
  });
  u.opts = Object.keys(u.os).filter(function(i){ return u.os[i] === "take"; })
                           .map(function(i){ return +i; }).sort(function(a, b){ return a - b; });
  /* A row of the host list is legal for a borrowed ship (p. 14), and its key
     is moved by HOST_OFF the same way selectionOf does. The name-based
     fallback key (upn) then carries the list's name, because two lists can
     have a section and a row of the same name. */
  var hostUp = hostUpgradesAllowed(L, ctx && ctx.host ? ctx.host : null)
             ? ctx.host : null;
  Object.keys(intent.upgrades || {}).forEach(function(id){
    var p = splitUpgradeId(id);
    var at2 = p && L && p.list === L.nm ? findUpgradeEntry(L, p.section, p.label, u.s, u.e) : null;
    if(at2){
      u.ups[at2.si + ":" + at2.ei] = intent.upgrades[id];
      u.upn[L.secs[at2.si].t + SEP + p.label] = intent.upgrades[id];
      return;
    }
    var at3 = p && hostUp && p.list === hostUp.nm
            ? findUpgradeEntry(hostUp, p.section, p.label, -1, -1) : null;
    if(at3){
      u.ups[(HOST_OFF + at3.si) + ":" + at3.ei] = intent.upgrades[id];
      u.upn[hostUp.nm + SEP + hostUp.secs[at3.si].t + SEP + p.label] = intent.upgrades[id];
      return;
    }
    issues.push({ code: "upgrade.unknown_id", severity: "error", path: "upgrades." + id,
                  message: "upgrade row not found or not attached to this unit", sourcePage: null });
  });
  return { unit: u, issues: issues };
}

/* Test helper, also usable by the app in development: a frozen input makes
   any accidental write throw in strict mode instead of silently changing
   the catalogue. */
export function deepFreeze(o){
  if(o && typeof o === "object" && !Object.isFrozen(o)){
    Object.freeze(o);
    Object.keys(o).forEach(function(k){ deepFreeze(o[k]); });
  }
  return o;
}
