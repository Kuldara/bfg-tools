/* domain.js - the Gothic Fleet Registry's rules engine, one file.

   GENERATED from packages/rules/src/ by packages/rules/build.js: edit the
   modules there and run the build (npm run build does). The apps bundle this
   file, the Node tests and the battle simulator require() it, so it stays a
   UMD module: DOMAIN in a browser, module.exports in Node.

   Rules (packages/rules/CONTRACT.md):
     - nothing in here reads or writes anything outside its arguments
     - nothing in here returns a reference into its arguments
     - ASCII only */
var __rules = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // packages/rules/src/index.js
  var index_exports = {};
  __export(index_exports, {
    default: () => index_default
  });

  // packages/rules/src/lending.js
  function listByName(catalog, nm) {
    var ls = catalog && catalog.lists || [];
    for (var i = 0; i < ls.length; i++) if (ls[i].nm === nm) return ls[i];
    return null;
  }
  function listOfIntent(intent, ctx, catalog) {
    var nm = intent && intent.entry && intent.entry.list;
    var own = nm ? listByName(catalog, nm) : null;
    return own || (ctx && ctx.list ? ctx.list : null);
  }
  function lendGrantFor(L, D) {
    var hit = null;
    (L.res_ok || []).forEach(function(g) {
      if (g.race && (!D || D.race !== g.race)) return;
      if (g.list && (!D || D.nm !== g.list)) return;
      if (!g.race && !g.list) return;
      if (!hit || hit.needs_re && !g.needs_re) hit = g;
    });
    return hit;
  }
  function allyPairOk(L, D) {
    var okWith = function(rule, other) {
      if (!rule) return true;
      if (rule.only) return rule.only.indexOf(other) >= 0;
      return (rule.never || []).indexOf(other) < 0;
    };
    return okWith(L.ally_rule, D.ally_race) && okWith(D.ally_rule, L.ally_race);
  }
  function lendVerdict(L, D, role) {
    if (!L || !D) return { kind: "no", role: null, cond: null, why: "" };
    if (D === L || D.nm === L.nm)
      return { kind: "own", role: null, cond: null, why: "" };
    if (L.res_ban) return { kind: "no", role: null, cond: null, why: L.res_ban };
    if (D.res_ban) return { kind: "no", role: null, cond: null, why: D.res_ban };
    var same = !!(D.race && L.race && D.race === L.race);
    var g = same ? null : lendGrantFor(L, D);
    var asReserve = function() {
      if (same) return { kind: "reserve", role: "reserve", cond: null, why: "" };
      if (g) return {
        kind: "grant",
        role: "reserve",
        cond: g.needs_re ? g.needs_what || "a condition" : null,
        why: L.res_src || ""
      };
      return {
        kind: "no",
        role: null,
        cond: null,
        why: 'Reserves can only ever be ships belonging to the same "race", chosen from a fleet list of the same "race". (Fleets p. 15)'
      };
    };
    var asAlly = function() {
      if (same) return {
        kind: "no",
        role: null,
        cond: null,
        why: 'Reserves can only ever be ships belonging to the same "race", chosen from a fleet list of the same "race". (Fleets p. 15)'
      };
      if (allyPairOk(L, D))
        return { kind: "ally", role: "ally", cond: null, why: "" };
      return {
        kind: "no",
        role: null,
        cond: null,
        why: "Never allies: " + L.ally_race + " and " + D.ally_race
      };
    };
    if (role === "reserve") return asReserve();
    if (role === "ally") return asAlly();
    if (same) return asReserve();
    var a = asAlly();
    if (a.kind !== "no") return a;
    var r = asReserve();
    return r.kind !== "no" ? r : a;
  }
  function lendRowVerdict(L, D, si, en, catalog, ctx) {
    var v = lendVerdict(L, D, ctx && ctx.role);
    if (v.kind === "own") return { ok: true, why: "", cause: "" };
    if (v.kind === "no") return { ok: false, why: v.why, cause: "pair" };
    if (v.cond && ctx && ctx.condMet === false)
      return { ok: false, cause: "needs", what: v.cond, why: L.res_src || "" };
    var sec = D.secs[si];
    if (!sec || !en) return { ok: false, why: "", cause: "" };
    if (sec.ct === "defence") return {
      ok: false,
      cause: "type",
      why: "Only ships of the same 'type' (battleship, cruiser or escort) count for reserves purposes. (Fleets p. 14)"
    };
    if (sec.ct === "reserve") return {
      ok: false,
      cause: "reserve",
      why: "However, a given fleet list cannot take as reserves ships listed as reserves or allies to another fleet list. In short, you cannot use a reserve of a reserve. (Fleets p. 15)"
    };
    if (sec.ct === "access") return {
      ok: false,
      cause: "access",
      why: "Some fleet lists explicitly provide access to ships from other races. These may only be taken exactly as described on their fleet list rules and may not also be taken as reserves. (Fleets p. 15)"
    };
    if (D.lend_ban && new RegExp(D.lend_ban.re, "i").test(String(en.l || "")))
      return { ok: false, why: D.lend_ban.src, cause: "lend_ban" };
    var g = lendGrantFor(L, D);
    if (g && g.not_re && v.kind === "grant" && new RegExp(g.not_re, "i").test(String(en.l || "")))
      return { ok: false, why: L.res_src || "", cause: "not_re" };
    if (L.ally_xenos && v.role === "ally" && L.ally_race === L.ally_xenos.when && new RegExp(L.ally_xenos.re, "i").test(String(en.l || "")))
      return { ok: false, why: L.ally_xenos.src, cause: "xenos" };
    var sh = en.r != null && catalog && catalog.ships ? catalog.ships[String(en.r)] : null;
    if (sh && (!sh.rt || sh.rt === "none")) return {
      ok: false,
      cause: "type",
      why: "Only ships of the same 'type' (battleship, cruiser or escort) count for reserves purposes. (Fleets p. 14)"
    };
    return { ok: true, why: "", cause: "" };
  }
  function lendOfferable(en) {
    return !!en && en.k !== "up" && en.k !== "cmd";
  }
  function sectionNeeds(L, si) {
    var sec = L && L.secs ? L.secs[si] : null, hit = null;
    (sec && sec.rules || []).forEach(function(r) {
      if (hit || r.kind !== "requires" || !r.what || !r.if_pick || !r.if_pick.length) return;
      if (r.if_pick.every(function(p) {
        return p.sec === si && !p.re;
      }))
        hit = { what: r.what, pick: r.then_pick || [] };
    });
    return hit;
  }
  function hostReserveRow(L, en) {
    if (!L || !en || en.k !== "unit" || en.r == null) return null;
    var out = null;
    (L.secs || []).forEach(function(sec, si) {
      if (out || sec.ct !== "reserve") return;
      (sec.ents || []).forEach(function(e2, ei) {
        if (!out && e2.k === "unit" && String(e2.r) === String(en.r))
          out = { si, ei, title: sec.t, needs: sectionNeeds(L, si) };
      });
    });
    return out;
  }
  function lendOwnRoute(L, D, catalog) {
    if (!L || !D || L === D) return null;
    if (D.res_ban) return null;
    var ships = catalog && catalog.ships;
    var native = D.native_chaps || null;
    var banRe = D.lend_ban ? new RegExp(D.lend_ban.re, "i") : null;
    var theirs = {};
    (D.secs || []).forEach(function(sec, si) {
      if (sec.ct !== "type") return;
      (sec.ents || []).forEach(function(en, ei) {
        if (en.k !== "unit" || en.r == null) return;
        if (banRe && banRe.test(String(en.l || ""))) return;
        var sh = ships ? ships[String(en.r)] : null;
        if (native && sh && native.indexOf(sh.chap) < 0) return;
        (theirs[String(en.r)] = theirs[String(en.r)] || []).push(si + ":" + ei);
      });
    });
    var best = null;
    (L.secs || []).forEach(function(sec, si) {
      if (sec.ct !== "access" && sec.ct !== "reserve" && sec.ct !== "own") return;
      if (sec.noroute) return;
      var n = 0, map = {};
      (sec.ents || []).forEach(function(en, ei) {
        if (en.k !== "unit" || en.r == null || !theirs[String(en.r)]) return;
        n++;
        theirs[String(en.r)].forEach(function(k) {
          if (!map[k]) map[k] = { si, ei };
        });
      });
      if (n && (!best || n > best.n))
        best = { title: sec.t, n, ct: sec.ct, si, map, needs: sectionNeeds(L, si) };
    });
    return best;
  }
  function lendRouteFor(L, D, catalog) {
    if (!L || !D || L === D) return null;
    if (lendVerdict(L, D, "reserve").kind !== "no") return null;
    if (lendVerdict(L, D, "ally").kind !== "no") return null;
    return lendOwnRoute(L, D, catalog);
  }
  function lendSummary(L, D, catalog, ctx) {
    var v = lendVerdict(L, D, ctx && ctx.role);
    if (v.kind === "own") return { kind: "own", verdict: v, ok: 0, bad: 0, only: null };
    if (v.kind === "no") return { kind: "none", verdict: v, ok: 0, bad: 0, only: null };
    var ok = 0, bad = 0, only = null;
    (D.secs || []).forEach(function(sec, si) {
      (sec.ents || []).forEach(function(en) {
        if (!lendOfferable(en)) return;
        var r = lendRowVerdict(
          L,
          D,
          si,
          en,
          catalog,
          { role: v.role, condMet: ctx && ctx.condMet }
        );
        if (r.ok) {
          ok++;
          return;
        }
        bad++;
        if (["lend_ban", "not_re", "needs", "xenos"].indexOf(r.cause) >= 0)
          only = only || r;
      });
    });
    var limited = !!only;
    return {
      kind: ok === 0 && !limited ? "none" : limited ? "limited" : "open",
      verdict: v,
      ok,
      bad,
      only
    };
  }
  function roleOfIntent(intent) {
    var r = intent && intent.role;
    return r === "reserve" || r === "ally" ? r : "core";
  }

  // packages/rules/src/arms.js
  var WEP = [
    /* The badge groups a row by HOW IT RESOLVES, and the card prints no key
       for the letters, so the colour carries the grouping and the row's star
       points at the rule below that names the exceptions. Two weapons resolve
       as lances without the word in their name, and both used to fall through
       to the weapon-battery default, reading on the card exactly like the
       Pyro-acid battery beside them: "Bio-plasma: hits like a lance on 4+"
       (Fleets p. 419) and "Gauss Particle Whip: fires as a lance" (p. 400).
       Pyro-acid and the Lightning Arc stay batteries, because the book calls
       each one "a weapon battery" (pp. 420, 400) - the default is right for
       them and only for them. */
    /* Warp cannons "roll 1 dice per point of Strength and require a 4+ to hit,
       like a lance" (Fleets p. 284), and the Armageddon gun is fired with the
       Nova template (p. 252): both read as weapon batteries until the user
       asked for the lance and the nova colours (9.10.2026). */
    [/lance|bio-plasma|particle whip|ion cannon|warp cannon/i, "L", "#1F6F8B", "#DCEAF0"],
    [/nova cannon|bombardment|armageddon gun/i, "N", "#A33A2E", "#F6DFDB"],
    /* Ork heavy gunz are weapon batteries (Fleets p. 360) and keep the G, but
       they are short-ranged and every hit is two: the row must not read as the
       gunz battery beside it. Its own colour, halfway between the nova
       cannon's red and the gunz' yellow, still a pastel (user 12.10.2026:
       "not a hazard colour but a colour between the nova cannon and the gunz
       yellow, still a pastel"). The hazard stripes of 9.10. are gone; a fifth field
       here would still name a pattern for wepClass to pass on. */
    [/heavy gunz/i, "G", "#A65A20", "#F7CFAD"],
    /* The Tau gravitic launcher is not a gun: "Ships with gravitic launchers are
       armed with Tau missiles" (Fleets p. 450), and those missiles are ordnance -
       they are placed, move 20-40 cm and lose Strength as they go (pp. 450-451).
       It resolved as a weapon battery by default, beside the railgun batteries
       that really are one (user 20.9.). */
    [/torpedo|gravitic launcher/i, "T", "#5B646D", "#E5E8EA"],
    /* Orbital mines replace the launch bays' attack craft (Fleets p. 23): an
       own badge, so a mine row never reads as fighters or bombers (J21). */
    [/orbital mine/i, "M", "#6B6E1C", "#EEF0D8"],
    [/launch bay|attack craft|bays/i, "O", "#70469A", "#E9DEF3"],
    /* A gravitic hook carries an escort, it does not shoot: "gravitic hooks have
       no effect in game terms - ships do not start a game attached to their
       parent ship, and can never be docked during a game" (Fleets p. 450). The
       number still matters when building the fleet - a Tau fleet may not have
       more Orcas and Wardens than its hooks - so the row stays on the card with
       a badge of its own, in the same teal its rule already uses. */
    [/gravitic hook/i, "H", "#00806F", "#D8EDE8"],
    /* Contact weapons. The Ork spelling "klaw" was here but not the Tyranid
       "claws", so Massive Claws and Feeder Tentacles - both "on contact", both
       Strength "Spec." - carried the weapon-battery badge (Fleets pp. 419-420).
       The Impaler is an assault module with a Hit & Run of its own (p. 346).
       /torpedo/ is tested before this line, so Boarding torpedoes stay T. */
    [/ram|klaw|claw|tentacle|boarding|impaler/i, "R", "#7A5230", "#EFE2D4"],
    /* This line used to read /pulse|railgun|ion / and so painted three weapons
       one colour that the book classes three different ways: "Ion Cannon:
       functions as a lance in all respects" (Fleets p. 450) - now with the
       lances; "Railgun Battery: functions as a standard weapon battery"
       (p. 450) - now the default, like every other battery; and the Star Pulse
       Generator, which is neither: "one attack against every non-Necron target
       within 20 cm" (p. 400). Only the last one is left here, and it keeps a
       badge of its own for the same reason the orbital mine has one. */
    [/star pulse/i, "P", "#2E6B4A", "#DFEDE2"]
  ];
  function wepClass(name) {
    for (const [re, l, b, w, p] of WEP) if (re.test(name)) return p ? [l, b, w, p] : [l, b, w];
    return ["G", "#A97913", "#F4E5BC"];
  }
  var RANGE_BANDS = [[15, "#C4550A"], [30, "#E69F00"], [45, "#00855E"], [60, "#0072B2"], [Infinity, "#5D3A9B"]];
  function rangeCell(text) {
    var t = String(text == null ? "" : text).trim();
    var one = /^(\d+)\s*cm$/i.exec(t), span = /^(\d+)\s*[\u2013-]\s*(\d+)\s*cm$/i.exec(t);
    if (!one && !span) return null;
    var cm = parseInt(one ? one[1] : span[2], 10), band = 0;
    while (cm > RANGE_BANDS[band][0]) band++;
    return { label: one ? one[1] : span[1] + "\u2013" + span[2], band: band + 1, color: RANGE_BANDS[band][1] };
  }
  function pairRows(rows) {
    var side = function(r) {
      var m = /^(port|starboard)\s+(.+)$/i.exec(String(r.a && r.a[0] || "").replace(/\*/g, "").replace(/\s+/g, " ").trim());
      return m ? [m[1].toLowerCase(), m[2].toLowerCase()] : null;
    };
    var inSlot = {};
    rows.forEach(function(r) {
      if (r.grp) inSlot[r.i] = (inSlot[r.i] || 0) + 1;
    });
    var plain = function(r) {
      if (r.loss || r.writeIn || r.state !== "active") return false;
      if (r.grp) return inSlot[r.i] < 2;
      return !r.alt && !r.box;
    };
    var txt = function(v) {
      return String(v == null ? "" : v).replace(/\s+/g, " ").trim();
    };
    for (var k = 0; k + 1 < rows.length; k++) {
      var p = rows[k], q = rows[k + 1], a = side(p), b = side(q);
      if (!a || !b || a[0] === b[0] || a[1] !== b[1]) continue;
      if (!plain(p) || !plain(q)) continue;
      if (txt(p.a[1]) !== txt(q.a[1]) || txt(p.a[2]) !== txt(q.a[2])) continue;
      p.pair = 1;
      q.pair = 2;
      k++;
    }
    return rows;
  }
  var ARM_ABBR = [
    [/nova cannon/i, "NOVA"],
    [/bombardment/i, "BOMB"],
    [/lance|pulsar|bio-plasma|particle whip|ion cannon|warp cannon/i, "LAN"],
    [/gravitic hook/i, "HOOK"],
    [/torpedo|gravitic launcher/i, "TORP"],
    [/launch bay|attack craft|bays/i, "BAYS"],
    [/orbital mine/i, "MINES"],
    [/star pulse/i, "PULSE"],
    [/ram|klaw|claw|tentacle|impaler/i, "RAM"]
  ];
  var ARM_ORDER = ["WB", "LAN", "NOVA", "BOMB", "TORP", "BAYS", "HOOK", "MINES", "PULSE", "RAM"];
  function armAbbr(name) {
    for (var i = 0; i < ARM_ABBR.length; i++) if (ARM_ABBR[i][0].test(String(name || ""))) return ARM_ABBR[i][1];
    return "WB";
  }
  function armStrength(s) {
    var t = String(s == null ? "" : s).trim();
    var m = t.match(/^(D\d+(?:\s*\+\s*\d+)?|\d+)(\s*squadrons?)?$/i);
    if (m) return m[1].replace(/\s+/g, "");
    var cap = t.match(/^capacity\s*:\s*(\d+)\b/i);
    if (cap) return cap[1];
    return null;
  }
  function condShipOnly(en, sh) {
    var c = en && en.cond;
    if (!c) return true;
    if (!sh) return false;
    if (c.has || c.wep || c.opt || c.up) return null;
    var esc = /escort/i.test(sh.ty || "");
    if (c.cap && esc) return false;
    if (c.esc && !esc) return false;
    if (c.ty && !new RegExp(c.ty, "i").test(sh.ty || "")) return false;
    if (c.nm && !new RegExp(c.nm, "i").test(sh.nm || "")) return false;
    if (c.nmno && new RegExp(c.nmno, "i").test(sh.nm || "")) return false;
    if (c.fl && !new RegExp(c.fl, "i").test(sh.fl || "")) return false;
    if (c.flno && new RegExp(c.flno, "i").test(sh.fl || "")) return false;
    return true;
  }
  function requiredHullChanges(list, sh) {
    var rows = [], mod = null;
    if (!list || !sh || sh.df) return { rows, mod };
    (list.secs || []).forEach(function(sec) {
      (sec.ents || []).forEach(function(en) {
        if (!en || en.k !== "up" || !en.req || en.at) return;
        if (condShipOnly(en, sh) !== true) return;
        if (en.add) rows = rows.concat(Array.isArray(en.add[0]) ? en.add : [en.add]);
        if (en.mod) {
          mod = mod || {};
          Object.keys(en.mod).forEach(function(k) {
            mod[k] = (mod[k] || 0) + en.mod[k];
          });
        }
      });
    });
    return { rows, mod };
  }
  function armSummary(sh, opts) {
    var o2 = typeof opts === "number" ? { max: opts } : opts || {};
    var max = o2.max;
    var owner = {}, grpN = {}, picks = [], addons = 0;
    (sh && sh.ol || []).forEach(function(o) {
      (o.aws || []).forEach(function(i) {
        owner[i] = o;
      });
      if (o.grp && (o.aws || []).length) grpN[o.grp] = (grpN[o.grp] || 0) + 1;
    });
    Object.keys(grpN).forEach(function(g) {
      if (grpN[g] > 1 && (sh.ol.filter(function(o) {
        return o.grp === g;
      })[0].gmax || 1) === 1) picks.push(grpN[g]);
    });
    var rows = (sh && sh.aw || []).filter(function(a, i) {
      if (!owner[i]) return true;
      var g = owner[i].grp;
      if (!(g && grpN[g] > 1)) addons++;
      return false;
    }).concat(o2.list ? requiredHullChanges(o2.list, sh).rows : []);
    var s = armSummaryRows(rows, max);
    s.picks = picks.sort(function(a, b) {
      return b - a;
    });
    s.addons = addons;
    return s;
  }
  function armSummaryRows(rows, max) {
    var order = {}, out = [];
    ARM_ORDER.forEach(function(k, i) {
      order[k] = i;
    });
    (rows || []).forEach(function(a) {
      var k = armAbbr(a[0]), v = armStrength(a[2]);
      var g = null;
      out.forEach(function(x) {
        if (x.k === k) g = x;
      });
      if (!g) {
        g = { k, items: [], rng: [] };
        out.push(g);
      }
      var rr = String(a[1] == null ? "" : a[1]).trim();
      if (rr && rr !== "\u2013" && rr !== "-" && g.rng.indexOf(rr) < 0) g.rng.push(rr);
      var hit = null;
      g.items.forEach(function(x) {
        if (x.v === v) hit = x;
      });
      if (hit) hit.n++;
      else {
        hit = { v, n: 1, rng: [] };
        g.items.push(hit);
      }
      if (rr && rr !== "\u2013" && rr !== "-" && hit.rng.indexOf(rr) < 0) hit.rng.push(rr);
    });
    out.sort(function(a, b) {
      return (order[a.k] == null ? 99 : order[a.k]) - (order[b.k] == null ? 99 : order[b.k]);
    });
    var cap = max == null ? 4 : max;
    var more = Math.max(0, out.length - cap);
    out = out.slice(0, cap);
    out.forEach(function(g) {
      g.more = Math.max(0, g.items.length - 2);
      g.items = g.items.slice(0, 2);
    });
    return { groups: out, more, picks: [], addons: 0 };
  }
  function weaponBoxes(rows) {
    var out = [];
    (rows || []).forEach(function(a) {
      var k = armAbbr(a[0]), v = armStrength(a[2]), rng = String(a[1] == null ? "" : a[1]).trim();
      var num = v != null && /^\d+$/.test(v) ? parseInt(v, 10) : null;
      var adds = k === "BAYS" && num != null;
      var hit = null;
      out.forEach(function(x) {
        if (hit || x.k !== k || x.rng !== rng) return;
        if (adds ? x.adds : !x.adds && x.raw === v) hit = x;
      });
      if (!hit) {
        hit = { k, v, raw: v, n: 0, sum: 0, adds, summed: false, rng, arcs: [], names: [] };
        out.push(hit);
      }
      hit.n++;
      if (adds) {
        hit.sum += num;
        hit.v = String(hit.sum);
        hit.summed = hit.n > 1;
      }
      hit.arcs.push(String(a[3] == null ? "" : a[3]).trim());
      hit.names.push(String(a[0] == null ? "" : a[0]).trim());
    });
    return out;
  }
  function armSummaryText(sh, max) {
    var s = armSummary(sh, max);
    var t = s.groups.map(function(g) {
      var v = g.items.map(function(x) {
        return (x.v == null ? "Spec." : x.v) + (x.n > 1 ? "\xD7" + x.n : "");
      }).join(", ");
      return g.k + (v ? " " + v : "") + (g.more ? "\u2026" : "");
    }).join(" \xB7 ");
    var tail = (s.picks.length > 2 ? [s.picks.length + " weapon choices"] : s.picks.map(function(n) {
      return "pick 1 of " + n;
    })).concat(s.addons ? [s.addons + " optional"] : []);
    if (!t && !tail.length && !(sh.aw || []).length) return "no armament";
    return t + (s.more ? " \xB7 \u2026" : "") + (tail.length ? (t ? " \xB7 " : "") + tail.join(" \xB7 ") : "");
  }

  // packages/rules/src/commanders.js
  var FORWARD_REF = /\b(shown below|noted below|listed below|the following|as follows)\b/i;
  var COMMANDER_RULES = [
    /* Fleets p. 141: the Ordo Xenos ship rolls on (or picks from, +5 pts) the
       xenotech table; the table itself is not in the section text. */
    {
      id: "ordo_xenos_table",
      entry: /^ordo xenos inquisitor lord/i,
      text: "Xenotech refit (D6, or choose for +5 pts): 1 Long Range Sensors: +1 to base Leadership (max 10). 2 Targeting Matrix: all targets count as closing within 30 cm, no right-shift modifiers beyond 30 cm. 3 Advanced Shielding: +1 shield. 4 Ship Defence Grid: +1 turret. 5 Advanced Drive Technology: +5 cm Speed and +1D6 on All Ahead Full. 6 Gravitic Thrusters: double the maximum turn. (Fleets p. 141)"
    },
    /* Fleets p. 231: the special rules that apply to Abaddon. */
    {
      id: "abaddon",
      entry: /^abaddon\b/i,
      text: `Abaddon the Despoiler: his ship doubles its value in boarding actions and adds +1 to the Boarding modifier. Hit & Run raids against his ship suffer -1; his own teleport attacks add +1 (boarding torpedoes and assault boats do not). "You have failed me for the last time": if his re-roll is used for another ship's or squadron's Command check or Leadership test and it fails again, in the next Chaos Shooting phase his ship directs at least half its firepower and lance strength at them, resolved as if it were an enemy. (Fleets p. 231)`
    },
    {
      id: "mesme",
      entry: /kor.o.mesme/i,
      text: "Kor'O Vash'ya Y'eldi Mesme: embarked aboard the Custodian class battleship Bor'kan Or'es El'Leath Se'arle O'Mesme; Leadership 9 and two re-rolls included. Aun'Shear of the Ethereal caste always accompanies him, so extra re-rolls may be bought. Excellent Pilots: the attack craft squadrons of his flagship have the Excellent Pilots crew skill. Improved Logic Engines (+10 pts): his vessel ignores Leadership effects from contact with Blast Markers. (Fleets p. 453)"
    }
  ];
  function namedCommanderRules(en) {
    return COMMANDER_RULES.filter(function(d) {
      return d.entry.test(String(en && en.l || ""));
    }).map(function(d) {
      return d.text;
    });
  }
  function commanderRules(list, si, en) {
    var sec = list && list.secs[si];
    if (!sec || !sec.text) return [];
    return sec.text.filter(function(t, i) {
      if ((en.skiptx || []).indexOf(t) >= 0) return false;
      var owner = sec.own && sec.own[i];
      if (!owner) return true;
      if ((sec.ownx || []).indexOf(i) >= 0) return owner === en.l;
      var ei = sec.ents.findIndex(function(e) {
        return e.l === owner;
      });
      var row = ei >= 0 ? sec.ents[ei] : null;
      if (!row || row.k !== "up") return true;
      if (FORWARD_REF.test(t)) return true;
      return false;
    });
  }

  // packages/rules/src/fleet.js
  var HUMAN_FL = /^(IMPERIAL NAVY|SPACE MARINES|ADEPTUS MECHANICUS|INQUISITION|ROGUE TRADERS|CHAOS|HIGH ORBIT|LOW ORBIT|ADDITIONAL)/i;
  function isXenosMember(m) {
    var sh = m && m.sel && m.sel.sh;
    if (!sh || !m.unitRow) return false;
    if (/xenos/i.test(String(m.en && m.en.l || ""))) return true;
    return !HUMAN_FL.test(String(sh.fl || ""));
  }
  function victoryWorth(sh, en, host) {
    var V = host && host.vp;
    if (!V || !sh || !en || !new RegExp(V.fl, "i").test(String(sh.fl || ""))) return null;
    var row = V.rows.filter(function(r) {
      return new RegExp(r.re, "i").test(String(en.l));
    })[0];
    return row ? { points: row.v, name: row.nm, page: V.cite[0].pg, text: V.cite[0].s } : null;
  }
  function originTags(m, L) {
    var src = m.sel && m.sel.list;
    if (src && src !== L) return [String(src.race || ""), String(src.nm || "")];
    var sec = L.secs[m.si];
    if (sec && sec.ct === "access") return [String(sec.t || "")];
    return [String(L.race || ""), String(L.nm || "")];
  }
  function citeText(c) {
    return c.s + " (" + (c.rb ? "Rulebook" : "Fleets") + " p. " + c.pg + ")";
  }
  function fleetFacts(L, members) {
    var out = [];
    if (!L) return out;
    var labs = members.filter(function(m) {
      return m.en;
    }).map(function(m) {
      return String(m.en.l);
    });
    var has = function(re) {
      var x = new RegExp(re, "i");
      return labs.some(function(l) {
        return x.test(l);
      });
    };
    var ships = members.filter(function(m) {
      return m.unitRow && m.hulls > 0 && !m.defence && m.R && m.R.kind === "ship";
    });
    var from = function(res) {
      return ships.some(function(m) {
        return originTags(m, L).some(function(t) {
          return res.some(function(re) {
            return new RegExp(re, "i").test(t);
          });
        });
      });
    };
    var holds = function(w) {
      return (w.all || []).every(has) && !(w.none || []).some(has) && (!w.frm || from(w.frm));
    };
    var AR = L.ar;
    if (AR) {
      var rules = AR.rules || [];
      var hit = rules.filter(function(r) {
        return r.when && holds(r.when);
      });
      var use = hit.length ? hit : rules.filter(function(r) {
        return !r.when;
      });
      if (!use.length) {
        out.push({
          k: "attack",
          t: "Attack rating",
          v: "not given",
          warn: true,
          s: "This fleet list gives no attack rating of its own. " + (AR.none || []).map(citeText).join(" ") + " Agree one with your opponent."
        });
      } else {
        var vals = [], cites = [];
        use.forEach(function(r) {
          if (vals.indexOf(r.v) < 0) vals.push(r.v);
          r.cite.forEach(function(c) {
            var t = citeText(c);
            if (cites.indexOf(t) < 0) cites.push(t);
          });
        });
        vals.sort(function(a, b) {
          return a - b;
        });
        out.push({
          k: "attack",
          t: "Attack rating",
          v: vals.join(" or "),
          warn: vals.length > 1,
          s: cites.join(" ") + (vals.length > 1 ? " The book gives both and does not say which applies: agree one with your opponent." : "")
        });
      }
    }
    (L.opp || []).forEach(function(o) {
      var n = members.filter(function(m) {
        return m.en && o.pick.some(function(re) {
          return new RegExp(re, "i").test(String(m.en.l));
        });
      }).reduce(function(a, m) {
        return a + (m.hulls || 1);
      }, 0);
      if (!n) return;
      out.push({
        k: "opponent",
        t: "Enemy gets for free",
        v: o.fixed || n + " " + (n === 1 ? o.what : o.many),
        s: o.cite.map(citeText).join(" ")
      });
    });
    if (L.vp) {
      var got = {};
      members.forEach(function(m) {
        var w = m.unitRow ? victoryWorth(m.sel && m.sel.sh, m.en, L) : null;
        if (w) got[w.name] = (got[w.name] || 0) + (m.hulls || 1);
      });
      var parts = L.vp.rows.filter(function(r) {
        return got[r.nm];
      }).map(function(r) {
        return r.nm + " " + r.v + (got[r.nm] > 1 ? " (\xD7" + got[r.nm] + ")" : "");
      });
      if (parts.length)
        out.push({ k: "vp", t: "Victory points", v: parts.join(" \xB7 "), s: L.vp.cite.map(citeText).join(" ") });
    }
    return out;
  }
  var SQ_CR = { min: 2, max: 4, cite: { s: "Cruisers, heavy cruisers and battlecruisers may be formed into squadrons of two to four ships. Battlecruisers, heavy cruisers and cruisers may be mixed together in the same squadron.", pg: 13 } };
  var SQ_BIG = { min: 2, max: 3, cite: { s: "Grand cruisers and battleships may be formed into squadrons of two to three ships, but you may not mix battleships and grand cruisers in a squadron.", pg: 13 } };
  function sqClass(m) {
    var t = String(m.R && m.R.stats && m.R.stats.type || "").toLowerCase();
    return /grand cruiser/.test(t) ? "grand cruiser" : /battleship/.test(t) ? "battleship" : /cruiser/.test(t) ? "cruiser" : t || "ship";
  }
  var DEMIURG_CMD = { s: "Demiurg ships can never carry fleet commanders, use fleet commander re-rolls or be placed in squadrons with non-Demiurg vessels.", pg: 483 };
  function isDemiurg(m) {
    return /^DEMIURG$/i.test(String(m && m.sel && m.sel.sh && m.sel.sh.fl || ""));
  }
  function carriesCommander(m) {
    if (!m.unitRow || !(m.hulls > 0) || !m.R || m.R.kind !== "ship") return false;
    if (isDemiurg(m)) return false;
    if (!m.defence) return true;
    var sh = m.sel && m.sel.sh;
    return !!(sh && (sh.qd || defenceOwnPoints(sh)));
  }
  function placeRe(re, m) {
    var x = new RegExp(re, "i");
    return x.test(String(m.en && m.en.l || "")) || x.test(String(m.sel && m.sel.sh && m.sel.sh.nm || ""));
  }
  function placeArm(m, arm) {
    var x = new RegExp(arm, "i");
    return (m.R && m.R.weapons || []).some(function(w) {
      return w.state === "active" && x.test(String(w.a && w.a[0] || ""));
    });
  }
  function placeTaken(m, re) {
    var x = new RegExp(re, "i");
    return (m.R && m.R.upgrades || []).some(function(u) {
      return u.state === "take" && x.test(String(u.label));
    }) || (m.R && m.R.options || []).some(function(o) {
      return o.state === "take" && x.test(String(o.text));
    });
  }
  function clanzCommand(L, members) {
    var C = L && L.clanz;
    if (!C) return null;
    var wRe = new RegExp(C.warlord, "i");
    var unitRe = [C.tiddla, C.big, C.uge, C.hulk, C.rok].map(function(x) {
      return new RegExp(x, "i");
    });
    var ws = members.filter(function(m) {
      return m.en && m.en.k === "cmd" && wRe.test(String(m.en.l));
    });
    var of = members.map(function() {
      return -1;
    });
    if (!ws.length) return { warlords: ws, of };
    var byUid = {};
    ws.forEach(function(w) {
      if (w.intent && w.intent.uid) byUid[w.intent.uid] = w;
    });
    var last = null;
    members.forEach(function(m, i) {
      if (ws.indexOf(m) >= 0) {
        last = m;
        return;
      }
      var sec = m.own && L.secs[m.si];
      if (!sec || !m.R || m.R.kind !== "ship" || !unitRe.some(function(x) {
        return x.test(String(sec.t).trim());
      })) return;
      var w = m.intent && m.intent.cmd && byUid[m.intent.cmd] || last || ws[0];
      of[i] = members.indexOf(w);
    });
    clanzTiddlas(L, members).forEach(function(t) {
      var wi = of[t.ork[0]];
      t.com.forEach(function(i) {
        of[i] = wi;
      });
    });
    return { warlords: ws, of };
  }
  function escortSquadronKeys(L, members) {
    return members.map(function(m, i) {
      return L && L.esq && m.escort && !m.defence && m.unitRow && m.intent && m.intent.sq ? "sq:" + m.intent.sq : "u:" + i;
    });
  }
  function clanzTiddlas(L, members) {
    var C = L && L.clanz;
    if (!C) return [];
    var inS = function(m, re) {
      return !!re && m.own && m.unitRow && !!L.secs[m.si] && new RegExp(re, "i").test(String(L.secs[m.si].t).trim());
    };
    var out = [], byTag = {};
    members.forEach(function(m, i) {
      if (!inS(m, C.tiddla)) return;
      var tg = m.intent && m.intent.sq || null, t = tg && byTag[tg];
      if (!t) {
        t = { tag: tg, ork: [], com: [] };
        out.push(t);
        if (tg) byTag[tg] = t;
      }
      t.ork.push(i);
    });
    members.forEach(function(m, i) {
      var tg = m.intent && m.intent.sq;
      if (tg && byTag[tg] && inS(m, L.bloodaxe && L.bloodaxe.sec)) byTag[tg].com.push(i);
    });
    var hullsOf = function(ix) {
      return ix.reduce(function(a, i) {
        return a + Math.max(1, members[i].hulls);
      }, 0);
    };
    out.forEach(function(t) {
      t.orkN = hullsOf(t.ork);
      t.comN = hullsOf(t.com);
      t.n = t.orkN + t.comN;
    });
    return out;
  }
  function placeCommanders(L, members, cmdOf) {
    var P = L && L.place || [];
    var ships = members.filter(carriesCommander);
    var cost = function(m) {
      return m.points / Math.max(1, m.hulls);
    };
    var byUid = {};
    members.forEach(function(m) {
      if (m.intent && m.intent.uid) byUid[m.intent.uid] = m;
    });
    var ruleOf = function(m) {
      var PL = !m.own && m.sel && m.sel.list && m.sel.list.place ? m.sel.list.place : P;
      return PL.filter(function(r) {
        return new RegExp(r.cmd, "i").test(String(m.en.l));
      })[0] || null;
    };
    var todo = members.filter(function(m) {
      return m.en && m.en.k === "cmd" && m.R && m.R.kind === "commander";
    }).map(function(m) {
      return { m, r: ruleOf(m) };
    }).filter(function(x) {
      return !(x.r && x.r.skip);
    });
    var late = function(x) {
      return x.r && x.r.not_with ? 1 : 0;
    };
    todo = todo.filter(function(x) {
      return !late(x);
    }).concat(todo.filter(late));
    var placed = [], out = [];
    var desc = function(a, b) {
      return (a.defence ? 1 : 0) - (b.defence ? 1 : 0) || cost(b) - cost(a) || members.indexOf(a) - members.indexOf(b);
    };
    todo.forEach(function(x) {
      var m = x.m, r = x.r || {}, drop = [];
      var base = ships.slice();
      var cut = function(keep, cite) {
        base = base.filter(function(sm) {
          var k2 = keep(sm);
          if (!k2) drop.push({ m: sm, cite });
          return k2;
        });
      };
      if (r.only) cut(function(sm) {
        return (!r.only.any || r.only.any.some(function(o) {
          return placeRe(o.re, sm) && (!o.arm || placeArm(sm, o.arm));
        })) && (!r.only.capital || !sm.escort) && (!r.only.mech || !!(sm.R && sm.R.mechanicus));
      }, r.only.cite);
      (r.no_up || []).forEach(function(nu) {
        cut(function(sm) {
          return !placeTaken(sm, nu.re);
        }, nu.cite);
      });
      (r.not_with || []).forEach(function(nw) {
        var re = new RegExp(nw.cmd, "i");
        var theirs = placed.filter(function(p) {
          return p.ship && re.test(String(p.m.en.l));
        }).map(function(p) {
          return p.ship;
        });
        cut(function(sm) {
          return theirs.indexOf(sm) < 0;
        }, nw.cite);
      });
      var allowed = base, why = null;
      (r.prefer || []).some(function(p) {
        var hit = base.filter(function(sm) {
          return placeRe(p.re, sm);
        });
        if (hit.length) {
          allowed = hit;
          why = p.cite;
          return true;
        }
        return false;
      });
      if (r.dearest && r.dearest.own && cmdOf) {
        var mi = members.indexOf(m);
        cut(function(sm) {
          return cmdOf[members.indexOf(sm)] === mi;
        }, r.dearest.cite);
      }
      if (!why && r.dearest && base.length) {
        var k = r.dearest.n ? todo.filter(function(y) {
          return y.r === x.r;
        }).length : 1;
        var pool = base.filter(function(sm) {
          return !sm.defence;
        });
        if (!pool.length) pool = base;
        var top = pool.slice().sort(desc).map(cost)[Math.min(k, pool.length) - 1];
        allowed = pool.filter(function(sm) {
          return cost(sm) >= top;
        });
        why = r.dearest.cite;
      }
      if (allowed !== base) base.forEach(function(sm) {
        if (allowed.indexOf(sm) < 0) drop.push({ m: sm, cite: why });
      });
      var allowedOf = function() {
        return allowed.map(function(sm) {
          return members.indexOf(sm);
        });
      };
      if (r.alone) {
        var mine = placed.filter(function(p) {
          return p.ship && p.r === x.r;
        }).map(function(p) {
          return p.ship;
        });
        allowed = allowed.filter(function(sm) {
          if (mine.indexOf(sm) < 0) return true;
          drop.push({ m: sm, cite: r.alone.cite });
          return false;
        });
      }
      var pick = m.intent && m.intent.aboard ? byUid[m.intent.aboard] : null;
      if (pick && isDemiurg(pick)) {
        placed.push({ m, r: x.r, ship: pick });
        out.push({
          unit: members.indexOf(m),
          ship: members.indexOf(pick),
          choices: allowedOf(),
          chosen: true,
          ok: false,
          ruled: true,
          cite: DEMIURG_CMD
        });
        return;
      }
      if (pick && ships.indexOf(pick) < 0) pick = null;
      var ok = !pick || allowed.indexOf(pick) >= 0;
      var ship = pick || allowed.slice().sort(desc)[0] || null;
      var bad = pick && !ok ? drop.filter(function(d) {
        return d.m === pick;
      })[0] : null;
      var ruled = !!(r.prefer || r.dearest || r.only || r.no_up || r.not_with || r.alone);
      placed.push({ m, r: x.r, ship });
      out.push({
        unit: members.indexOf(m),
        ship: ship ? members.indexOf(ship) : null,
        choices: allowed.map(function(sm) {
          return members.indexOf(sm);
        }),
        chosen: !!pick,
        ok: ok && (!!ship || !ruled),
        ruled,
        cite: bad ? bad.cite : why || r.only && r.only.cite || r.alone && r.alone.cite || r.not_with && r.not_with[0].cite || r.no_up && r.no_up[0].cite || null
      });
    });
    return out;
  }

  // packages/rules/src/pricing.js
  function upCost(sel, en) {
    if (en.pct) return Math.ceil(pctBase(sel) * en.pct / 100);
    if (en.p == null) return 0;
    if (en.per === "hull") return en.p * sel.hulls;
    if (en.per === "bay") return en.p * bayStrength(sel.sh, sel).n * (sel.escort ? sel.hulls : 1);
    return en.p;
  }
  function upgradePts(sel) {
    var p = 0;
    var ups = upgradesFor(sel);
    ups.own.concat(ups.other).forEach(function(x) {
      if (upState(sel, x[0], x[1]) === "take") p += upCost(sel, x[2]);
    });
    return p;
  }
  function hullPts(sel, en) {
    var sh = sel.sh;
    if (!sh) return 0;
    var crew = !sh.ven && /SPACE MARINES/i.test(String(sh.fl || "")) ? 0 : en.hcp || 0;
    return (sh.bp || 0) + crew;
  }
  function hullOptionPts(sel) {
    var en = sel.en, sh = sel.sh;
    var p = (en.hc ? hullPts(sel, en) : en.p == null ? sel.custom | 0 : en.p) * sel.hulls;
    if (sh) sh.ol.forEach(function(o, i) {
      if (o.c != null && optState(sel, i) === "take")
        p += o.c * optCount(sel, i) * (sel.escort ? sel.hulls : 1);
    });
    return p;
  }
  function pointsOf(sel) {
    if (!sel.en) return null;
    return hullOptionPts(sel) + upgradePts(sel) + (sel.adjust | 0);
  }
  function pctBase(sel) {
    if (!sel.en) return 0;
    var p = hullOptionPts(sel);
    var ups = upgradesFor(sel);
    ups.own.concat(ups.other).forEach(function(x) {
      if (!x[2].pct && upState(sel, x[0], x[1]) === "take") p += upCost(sel, x[2]);
    });
    return p;
  }
  function flatMaxPointsOf(sel) {
    var sh = sel.sh;
    var p = pointsOf(sel);
    if (p == null) return null;
    var seen = {}, decided = {};
    var blockedOpt = optionsOf(sel).map(function(o) {
      return o.blockedBy.length > 0;
    });
    if (sh) sh.ol.forEach(function(o, i) {
      if (o.grp && optState(sel, i) === "take") decided["opt:" + o.grp] = 1;
    });
    if (sel.list) upSecs(sel).forEach(function(sec, si) {
      sec.ents.forEach(function(en, ei) {
        if (isUpgradeEnt(en) && en.grp && upState(sel, si, ei) === "take") decided[en.grp] = 1;
      });
    });
    var optCost = function(o) {
      return o.c * (o.qty ? o.qty.max || 1 : 1) * (sel.escort ? sel.hulls : 1);
    };
    var depAdd = {};
    if (sh) sh.ol.forEach(function(o, i) {
      if (o.dep == null || !(o.c > 0) || optState(sel, i) !== "opt" || blockedOpt[i]) return;
      var d = o.dep, pre = sh.ol[d];
      if (!pre) return;
      var ds = optState(sel, d);
      if (ds === "take") {
        p += optCost(o);
        return;
      }
      if (ds !== "opt" || blockedOpt[d] || pre.grp && decided["opt:" + pre.grp]) return;
      depAdd[d] = (depAdd[d] || 0) + optCost(o);
    });
    if (sh) sh.ol.forEach(function(o, i) {
      if (o.dep != null || optState(sel, i) !== "opt" || blockedOpt[i]) return;
      var c = (o.c > 0 ? optCost(o) : 0) + (depAdd[i] || 0);
      if (!(c > 0)) return;
      if (o.grp) {
        if (!decided["opt:" + o.grp]) seen["opt:" + o.grp] = Math.max(seen["opt:" + o.grp] || 0, c);
      } else p += c;
    });
    if (sel.list) upSecs(sel).forEach(function(sec, si) {
      sec.ents.forEach(function(en, ei) {
        if (!isUpgradeEnt(en) || upState(sel, si, ei) !== "opt") return;
        if (en.grp) {
          if (!decided[en.grp]) seen[en.grp] = Math.max(seen[en.grp] || 0, upCost(sel, en), 0);
          return;
        }
        p += Math.max(0, upCost(sel, en));
      });
    });
    Object.keys(seen).forEach(function(g) {
      p += seen[g];
    });
    return p;
  }
  var MAX_SEARCH_NODES = 600;
  var MAXPTS = {};
  var MAXPTS_N = 0;
  function maxPointsOf(sel) {
    var sig = JSON.stringify([
      sel.list && sel.list.nm,
      sel.host && sel.host.nm,
      sel.si,
      sel.ei,
      sel.sh && [sel.sh.nm, sel.sh.pg],
      sel.ost,
      sel.oqty,
      sel.ups,
      sel.hulls,
      sel.adjust,
      sel.custom,
      sel.escort
    ]);
    if (Object.prototype.hasOwnProperty.call(MAXPTS, sig)) return MAXPTS[sig];
    var v = maxPointsSearch(sel);
    if (++MAXPTS_N > 3e3) {
      MAXPTS = {};
      MAXPTS_N = 1;
    }
    MAXPTS[sig] = v;
    return v;
  }
  function maxPointsSearch(sel) {
    var base = pointsOf(sel);
    if (base == null) return null;
    var sh = sel.sh, ol = sh && sh.ol || [];
    var escortMul = sel.escort ? sel.hulls : 1;
    var bioCap = (function() {
      var t = String(sh && sh.ty || "");
      return /escort/i.test(t) ? 1 : /battleship/i.test(t) ? 3 : 2;
    })();
    var isBio = function(s, si) {
      var sec = secOf(s, si);
      return !!sec && String(sec.t).trim().toUpperCase() === "BIO-ENHANCEMENTS";
    };
    var take = function(s, items) {
      var ost = Object.assign({}, s.ost), oqty = Object.assign({}, s.oqty), ups = Object.assign({}, s.ups);
      items.forEach(function(it) {
        if (it.i != null) {
          ost[it.i] = "take";
          var q = ol[it.i].qty;
          if (q && q.max > 1) oqty[it.i] = q.max;
        } else ups[it.key] = "take";
      });
      return Object.assign({}, s, { ost, oqty, ups });
    };
    var behind = {};
    for (var pass = 0; pass < ol.length; pass++) {
      var next = {};
      ol.forEach(function(o, j) {
        if (o.dep == null || !ol[o.dep]) return;
        next[o.dep] = (next[o.dep] || 0) + (o.c > 0 ? o.c * (o.qty ? o.qty.max || 1 : 1) * escortMul : 0) + (behind[j] || 0);
      });
      if (JSON.stringify(next) === JSON.stringify(behind)) break;
      behind = next;
    }
    var OPEN = typeof WeakMap === "function" ? /* @__PURE__ */ new WeakMap() : null;
    var open = function(s) {
      var hit = OPEN && OPEN.get(s);
      if (hit) return hit;
      var out = [], opts = optionsOf(s);
      ol.forEach(function(o, i) {
        if (optState(s, i) !== "opt" || !(o.c > 0 || behind[i] > 0)) return;
        if (s.en && s.en.optno && new RegExp(s.en.optno, "i").test(String(o.t || ""))) return;
        if (o.dep != null && optState(s, o.dep) !== "take") return;
        if (opts[i] && opts[i].blockedBy.length) return;
        out.push({ k: "o" + i, i, c: (o.c > 0 ? o.c : 0) * (o.qty ? o.qty.max || 1 : 1) * escortMul, o });
      });
      if (s.list) {
        var u = upgradesFor(s), bio = {};
        u.own.concat(u.other).forEach(function(x) {
          if (isBio(s, x[0]) && upState(s, x[0], x[1]) === "take") bio[x[2].grp || x[2].l] = 1;
        });
        var bioFull = Object.keys(bio).length >= bioCap;
        u.own.concat(u.other).forEach(function(x) {
          if (x[2].req || upState(s, x[0], x[1]) !== "opt") return;
          var b = isBio(s, x[0]);
          if (b && (bioFull || bio[x[2].grp || x[2].l])) return;
          var c = x[2].pct ? Math.ceil(base * x[2].pct / 100) + 1 : Math.max(0, upCost(s, x[2]));
          if (c > 0) out.push({ k: "u" + upgradeKey(x[0], x[1]), key: upgradeKey(x[0], x[1]), c, pct: !!x[2].pct, bio: b ? x[2].grp || x[2].l : null, en: x[2] });
        });
      }
      if (OPEN) OPEN.set(s, out);
      return out;
    };
    var keys = function(list) {
      return list.map(function(it) {
        return it.k;
      });
    };
    var root = open(sel);
    if (!root.length) return base;
    var named = [];
    upSecs(sel).forEach(function(sec) {
      (sec.ents || []).forEach(function(e2) {
        if (isUpgradeEnt(e2) && e2.cond) {
          if (e2.cond.up) named.push(new RegExp(e2.cond.up, "i"));
          if (e2.cond.noup) named.push(new RegExp(e2.cond.noup, "i"));
        }
      });
    });
    var depOn = {};
    ol.forEach(function(o) {
      if (o.dep != null) depOn[o.dep] = 1;
    });
    var active = function(a) {
      if (a.o) return !!(a.o.sw || a.o.add || a.o.del || a.o.mod || a.o.cov || a.o.grp || a.o.swp || depOn[a.i]);
      var e = a.en;
      return !!(e.grp || e.swp || e.add || e.mod || e.cond && e.cond.no || named.some(function(rx) {
        return rx.test(String(e.l || ""));
      }));
    };
    var rootKeys = keys(root), inter = {};
    root.forEach(function(a) {
      if (a.bio || !active(a)) return;
      var aft = keys(open(take(sel, [a])));
      var lost = rootKeys.filter(function(k) {
        return k !== a.k && aft.indexOf(k) < 0;
      });
      var gained = aft.filter(function(k) {
        return rootKeys.indexOf(k) < 0;
      });
      if (lost.length || gained.length) {
        inter[a.k] = 1;
        lost.forEach(function(k) {
          inter[k] = 1;
        });
      }
    });
    var indep = root.filter(function(a) {
      return !inter[a.k] && !a.bio;
    });
    var indepKey = {};
    indep.forEach(function(a) {
      indepKey[a.k] = 1;
    });
    var value = function(s) {
      var op = open(s), o = keys(op);
      var add = indep.filter(function(a) {
        return o.indexOf(a.k) >= 0;
      });
      var kinds = {}, taken = {};
      if (s.list) {
        var u = upgradesFor(s);
        u.own.concat(u.other).forEach(function(x) {
          if (isBio(s, x[0]) && upState(s, x[0], x[1]) === "take") taken[x[2].grp || x[2].l] = 1;
        });
      }
      op.forEach(function(it) {
        if (it.bio && !taken[it.bio] && (!kinds[it.bio] || kinds[it.bio].c < it.c)) kinds[it.bio] = it;
      });
      var room = Math.max(0, bioCap - Object.keys(taken).length);
      add = add.concat(Object.keys(kinds).map(function(k) {
        return kinds[k];
      }).sort(function(p, q) {
        return q.c - p.c;
      }).slice(0, room));
      return pointsOf(add.length ? take(s, add) : s);
    };
    var best = base, nodes = 0, capped = false;
    var walk = function(s, skipped) {
      if (++nodes > MAX_SEARCH_NODES) {
        capped = true;
        return;
      }
      var v = value(s);
      if (v > best) best = v;
      var items = open(s).filter(function(it2) {
        return !indepKey[it2.k] && !it2.bio && !skipped[it2.k];
      });
      if (!items.length) return;
      var sum = 0, pct = 0, grp = {};
      items.forEach(function(it2) {
        var g = it2.o && it2.o.grp ? "o:" + it2.o.grp : it2.en && it2.en.grp ? "u:" + it2.en.grp : null;
        var c = it2.c + (it2.i != null ? behind[it2.i] || 0 : 0);
        if (g) {
          (grp[g] = grp[g] || { n: it2.o ? Math.max(1, it2.o.gmax || 1) : 1, c: [] }).c.push(c);
          return;
        }
        if (it2.pct) pct += it2.c;
        else sum += c;
      });
      Object.keys(grp).forEach(function(g) {
        grp[g].c.sort(function(p, q) {
          return q - p;
        }).slice(0, grp[g].n).forEach(function(c) {
          sum += c;
        });
      });
      if (v + sum + pct * 2 <= best) return;
      items.sort(function(p, q) {
        return q.c - p.c;
      });
      var it = items[0];
      walk(take(s, [it]), skipped);
      if (capped) return;
      var sk = Object.assign({}, skipped);
      sk[it.k] = 1;
      walk(s, sk);
    };
    walk(sel, {});
    if (capped) return Math.max(best, flatMaxPointsOf(sel));
    return best;
  }
  function timesStrength(txt, n) {
    var t = String(txt == null ? "" : txt);
    if (n <= 1) return t;
    if (!/^\s*\d+(\s*\/\s*\d+)*(\s*squadrons?)?\s*$/i.test(t)) return t + " \xD7" + n;
    var out = t.replace(/\d+/g, function(m) {
      return String(parseInt(m, 10) * n);
    });
    if (/squadron/i.test(out) && !/squadrons/i.test(out)) out = out.replace(/squadron/i, "squadrons");
    return out;
  }
  function swapRuledOutByUp(sel, o) {
    if (!sel.list || !sel.sh) return false;
    var names = (o.sw.t || []).map(function(t) {
      return String(t[0] || "");
    }), hit = false;
    upSecs(sel).forEach(function(sec, si) {
      (sec.ents || []).forEach(function(en, ei) {
        if (hit || !isUpgradeEnt(en) || sel.ups[upgradeKey(si, ei)] !== "take") return;
        if (en.cond && en.cond.no) {
          var rx = new RegExp(String(en.cond.no).split("@")[0], "i");
          if (names.some(function(nm) {
            return rx.test(nm);
          })) hit = true;
        }
        if (!hit && en.swp) {
          var rx2 = new RegExp(en.swp.f, "i");
          if ((o.sw.f || []).some(function(fi) {
            return sel.sh.aw[fi] && rx2.test(String(sel.sh.aw[fi][0]));
          })) hit = true;
        }
      });
    });
    return hit;
  }

  // packages/rules/src/weapons.js
  function weaponRows(sel, skip, noList) {
    var sh = sel.sh, L = sel.list;
    var rows = [];
    if (!sh) return rows;
    var alts = {}, gone = {};
    var owner = {};
    (sh.ol || []).forEach(function(o, i) {
      (o.aws || []).forEach(function(r) {
        (owner[r] = owner[r] || []).push(i);
      });
    });
    var rowFix = [];
    var qtyRows = [];
    (sh.ol || []).forEach(function(o, i) {
      if (o.swp && o.qty && optState(sel, i) !== "off") qtyRows.push(new RegExp(o.swp.f, "i"));
      if (!o.swp || optState(sel, i) !== "take") return;
      rowFix.push([new RegExp(o.swp.f, "i"), o.swp, optCount(sel, i)]);
    });
    (sh.ol || []).forEach(function(o, i) {
      if (!o.sw) return;
      var st = optState(sel, i);
      if (st === "off") return;
      if (st !== "take" && swapRuledOutByUp(sel, o)) return;
      var both = (o.sw.f || []).length > 1 ? 1 : 0;
      o.sw.f.forEach(function(fi, k) {
        (alts[fi] = alts[fi] || []).push([(o.sw.t[k] || o.sw.t[0]).slice(), st, 0, both]);
        if (st === "take") gone[fi] = 1;
      });
    });
    var lswp = [];
    if (L && !noList) upSecs(sel).forEach(function(sec, si) {
      sec.ents.forEach(function(en, ei) {
        if (!isUpgradeEnt(en) || !en.swp) return;
        if (skip === upgradeKey(si, ei)) return;
        if (coveredByShipOption(sel, en)) return;
        lswp.push({ en, si, ei, n: lswp.length });
      });
    });
    lswp.sort(function(p, q) {
      return String(q.en.swp.f).length - String(p.en.swp.f).length || p.n - q.n;
    });
    lswp.forEach(function(x) {
      var en = x.en, si = x.si, ei = x.ei;
      var st = upState(sel, si, ei);
      if (st === "off") return;
      if (st === "opt" && !Object.prototype.hasOwnProperty.call(sel.ups, upgradeKey(si, ei))) return;
      var rx = new RegExp(en.swp.f, "i");
      sh.aw.forEach(function(a, fi) {
        if (!rx.test(a[0])) return;
        if (gone[fi]) return;
        if (en.swp.onlyrg && String(a[1]).indexOf(en.swp.onlyrg) < 0) return;
        var st2 = en.swp.st || a[2];
        if (en.swp.halfst) {
          st2 = String(a[2]).replace(/\d+/, function(m) {
            return String(Math.floor(+m / 2));
          }).replace(/\b1 squadrons\b/, "1 squadron");
        }
        if (en.swp.permine) {
          var mc = String(a[2]).match(/\d+/);
          st2 = mc ? mc[0] + (mc[0] === "1" ? " mine" : " mines") : a[2];
        }
        var nm0 = a[0];
        if (en.swp.nm) {
          nm0 = String(a[0]).replace(new RegExp(en.swp.nmf || en.swp.f, "i"), en.swp.nm);
          if (/^[A-Z]/.test(a[0])) nm0 = nm0.charAt(0).toUpperCase() + nm0.slice(1);
        }
        var row = en.swp.t ? en.swp.t.slice() : [nm0, en.swp.rg || a[1], st2, en.swp.ar || a[3]];
        (alts[fi] = alts[fi] || []).push([row, st, en.swp.permine ? 1 : 0]);
        if (st === "take") gone[fi] = 1;
      });
    });
    sh.aw.forEach(function(a, i) {
      var own = owner[i];
      var menuBox = null, count = 1;
      if (own) {
        var states = own.map(function(oi) {
          return optState(sel, oi);
        });
        if (states.every(function(x) {
          return x === "off";
        })) return;
        menuBox = states.some(function(x) {
          return x === "take";
        }) ? "on" : "open";
        count = Math.max(1, own.reduce(function(a2, oi) {
          return a2 + (optState(sel, oi) === "take" ? optCount(sel, oi) : 0);
        }, 0));
      }
      var alt = alts[i];
      if (!gone[i]) {
        var shown = count > 1 ? [a[0], a[1], timesStrength(a[2], count), a[3]] : a.slice();
        rows.push({ a: shown, i, grp: alt ? 1 : 0, box: alt ? "on" : menuBox, count, own: own || null });
      }
      var mineRow = null;
      (alt || []).forEach(function(pair) {
        if (pair[2] && pair[1] === "take") mineRow = pair;
      });
      var others = (alt || []).filter(function(pair) {
        return pair !== mineRow;
      });
      if (mineRow) rows.push({
        a: mineRow[0],
        i,
        grp: others.length ? 1 : 0,
        box: others.length ? "on" : null,
        swapped: 1
      });
      others.forEach(function(pair) {
        rows.push({ a: pair[0], i, alt: 1, grp: 1, box: pair[1] === "take" ? "on" : "open", both: pair[3] ? 1 : 0 });
      });
    });
    if (L) upSecs(sel).forEach(function(sec, si) {
      sec.ents.forEach(function(en, ei) {
        if (!isUpgradeEnt(en) || !en.add) return;
        if (skip === upgradeKey(si, ei)) return;
        if (coveredByShipOption(sel, en)) return;
        if (upState(sel, si, ei) !== "take") return;
        if (rows.some(function(r) {
          return r.a[0] === en.add[0];
        })) return;
        rows.push({ a: en.add.slice(), i: -1, box: null, extra: 1 });
      });
    });
    (sh.ol || []).forEach(function(o, i) {
      if (!o.add) return;
      var st = optState(sel, i);
      if (st === "off") return;
      var adds = Array.isArray(o.add[0]) ? o.add : [o.add];
      adds.forEach(function(a) {
        rows.push({ a: a.slice(), i: -1, box: st === "take" ? "on" : "open", extra: 1, opt: i, own: [i] });
      });
    });
    (sh.ol || []).forEach(function(o, i) {
      if (!o.del || optState(sel, i) !== "take") return;
      var rx = new RegExp(o.del, "i");
      for (var k = rows.length - 1; k >= 0; k--)
        if (!rows[k].alt && rx.test(String(rows[k].a[0]))) rows.splice(k, 1);
    });
    if (qtyRows.length) rows.forEach(function(r) {
      if (qtyRows.some(function(rx) {
        return rx.test(r.a[0]);
      })) r.writeIn = 1;
    });
    if (rowFix.length) rows.forEach(function(r) {
      rowFix.forEach(function(fx) {
        var rx = fx[0], sp = fx[1], n = fx[2];
        if (!rx.test(r.a[0])) return;
        if (sp.onlyrg && String(r.a[1]).indexOf(sp.onlyrg) < 0) return;
        var a = r.a.slice();
        if (sp.rg) a[1] = sp.rg;
        if (sp.rgadd && String(a[1]).indexOf(sp.rgadd) < 0)
          a[1] = (a[1] ? String(a[1]) + " / " : "") + sp.rgadd;
        if (sp.st != null) {
          var d = /^[+-]/.test(String(sp.st)) ? parseInt(sp.st, 10) * n : null;
          if (d == null) a[2] = sp.st;
          else if (/^\s*\d+\s*$/.test(String(a[2])))
            a[2] = String(Math.max(0, parseInt(a[2], 10) + d));
        }
        r.a = a;
      });
    });
    return rows;
  }
  function statMod(sel, key) {
    var d = 0;
    if (sel.list) upSecs(sel).forEach(function(sec, si) {
      sec.ents.forEach(function(en, ei) {
        if (!isUpgradeEnt(en) || !en.mod || en.mod[key] == null) return;
        if (coveredByShipOption(sel, en)) return;
        if (upState(sel, si, ei) !== "take") return;
        d += en.mod[key];
      });
    });
    (sel.sh && sel.sh.ol || []).forEach(function(o, i) {
      if (!o.mod || o.mod[key] == null) return;
      if (optState(sel, i) !== "take") return;
      d += o.mod[key] * optCount(sel, i);
    });
    return d;
  }
  function statSet(sel, key) {
    var v = null;
    if (sel.list) upSecs(sel).forEach(function(sec, si) {
      sec.ents.forEach(function(en, ei) {
        if (!isUpgradeEnt(en) || !en.set || en.set[key] == null) return;
        if (coveredByShipOption(sel, en)) return;
        if (upState(sel, si, ei) !== "take") return;
        v = en.set[key];
      });
    });
    (sel.sh && sel.sh.ol || []).forEach(function(o, i) {
      if (!o.set || o.set[key] == null) return;
      if (optState(sel, i) !== "take") return;
      v = o.set[key];
    });
    return v;
  }
  function effHits(sel) {
    return Math.max(1, (sel.sh && sel.sh.hp || 0) + statMod(sel, "hp"));
  }
  function fixedSpeed(sh) {
    return isRockVessel(sh);
  }
  function effSpeed(sel) {
    var base = String(statSet(sel, "sp") || sel.sh && sel.sh.sp || "");
    var d = fixedSpeed(sel.sh) ? 0 : statMod(sel, "sp");
    if (!d) return base;
    return base.replace(/\d+/g, function(n) {
      return String(+n + d);
    });
  }
  function effShieldsText(sel) {
    var d = statMod(sel, "sh"), base = String(sel.sh && sel.sh.sh || "");
    if (!d) return base;
    var m = base.match(/^\s*(\d+)/);
    return m ? base.replace(/^\s*\d+/, String(Math.max(0, +m[1] + d))) : base;
  }
  function effTurrets(sel) {
    var set = statSet(sel, "tu");
    var d = statMod(sel, "tu"), base = String(set != null ? set : sel.sh && sel.sh.tu || "");
    if (!d) return base;
    var m = base.match(/^\s*(\d+)/);
    return m ? base.replace(/^\s*\d+/, String(+m[1] + d)) : base;
  }

  // packages/rules/src/special-rules.js
  function wepKey(name) {
    return String(name || "").toLowerCase().replace(/^(port|starboard|prow|dorsal|forward|aft)\s+/g, "").replace(/\*/g, "").replace(/\s+(battery|batteries|bays|bay)$/g, "").trim();
  }
  var SPECIAL_WEAPON_RULES = [
    {
      id: "nova",
      color: "#C43D4D",
      wep: /nova cannon/i,
      mentions: [/nova cannon/i],
      text: "Nova Cannon: place the template 30-150 cm away; scatter by range. Centre hole causes D6 hits, other contact 1 hit; touched ordnance is removed. No firing while crippled or on AAF, Burn Retros, CTNH or Brace. (Rulebook pp. 63-66)"
    },
    {
      id: "special_torpedoes",
      color: "#5B646D",
      wep: /^$/,
      up: /^special torpedoes/i,
      mentions: [/special torpedo/i],
      text: "Special Torpedoes: roll a D6 before the game, one type per ship - 1 Short Burn*, 2 Guided*, 3 Seeking, 4 Barrage Bombs*, 5 Melta, 6 Vortex (* for the whole game, the rest for one salvo). Short Burn: speed 40 cm; after moving and attacking roll a D6 per salvo, on a 6 it becomes a Blast Marker. Guided: turns up to 45 degrees at the start of the Ordnance phase if the launching ship passes a Leadership test; if it fails, one enemy ship that passes a test turns them. Seeking: turns up to 45 degrees towards the nearest (largest) enemy ship; detonates in Blast Markers on a 5+; never attacks friendly ships. Barrage Bombs: may launch in low orbit; 1 assault point (2 from Strength 7); against ships they hit like direct fire. Melta: each hit is an automatic Fire critical instead of damage. Vortex: each hit causes a critical. A prow critical while carrying unused Melta or Vortex torpedoes: +D3 Fire criticals (Melta) or +D3 damage and a critical (Vortex). (Fleets pp. 19-21)"
    },
    {
      id: "orbital_mine",
      color: "#6B6E1C",
      wep: /orbital mine/i,
      mentions: [/orbital mine/i],
      text: "Orbital Mines: launched like attack craft, one per launch bay Strength; no waves, not subject to ordnance limits. Each moves 10 cm towards the nearest enemy ship in every Ordnance phase; on contact with its base it detonates with 8 dice against armour (4 if turrets hit the mine); shields do not protect (FAQ 2026). A critical to the launch bays causes an extra D3 damage. (Fleets pp. 23, 512)"
    },
    {
      id: "bombardment",
      color: "#7B3FB2",
      wep: /bombardment cannon/i,
      mentions: [/bombardment cannon/i, /bombardment shells/i],
      text: "Bombardment Cannon: a weapon battery that always hits on 4+ (ordnance too) and causes criticals on 4+. (Fleets p. 94)"
    },
    /* Tyranid torpedoes "are always boarding torpedoes" (Fleets p. 426), so the
       ordinary-torpedo clause does not apply and the hive ship card has no
       room for it. */
    {
      id: "boarding_torpedo_tyranid",
      color: "#59636F",
      wep: /boarding torpedo/i,
      list: /Tyranid/i,
      mentions: [/boarding torpedo/i],
      text: "Boarding Torpedoes: Hit & Run, not damage; one 45\xB0 turn each later Ordnance phase. (Rulebook p. 78)"
    },
    {
      id: "boarding_torpedo",
      color: "#59636F",
      wep: /boarding torpedo/i,
      notList: /Tyranid/i,
      mentions: [/boarding torpedo/i],
      text: "Boarding Torpedoes: a hit is a Hit & Run attack, not damage; never in the same turn as ordinary torpedoes from the same ship; one 45\xB0 turn at the start of each later Ordnance phase; may ignore hulks. (Rulebook p. 78)"
    },
    /* Fleets pp. 233, 235, 237 ORDNANCE: "Ships with torpedo tubes are armed with
       normal and boarding torpedoes." The Nurgle, Khorne and Slaanesh pages (241,
       245, 249) break off before the sentence in the book (T25). Renegade
       Imperial hulls keep their own ordnance (Fleets p. 222). */
    {
      id: "chaos_torpedoes_233",
      color: "#59636F",
      wep: /torpedo/i,
      notWep: /boarding|bomber/i,
      list: /Incursion/i,
      fleet: /CHAOS/i,
      text: "Torpedoes: may be normal or boarding torpedoes (Rulebook p. 78). (Fleets p. 233)"
    },
    {
      id: "chaos_torpedoes_235",
      color: "#59636F",
      wep: /torpedo/i,
      notWep: /boarding|bomber/i,
      list: /Black Crusade/i,
      fleet: /CHAOS/i,
      text: "Torpedoes: may be normal or boarding torpedoes (Rulebook p. 78). (Fleets p. 235)"
    },
    {
      id: "chaos_torpedoes_237",
      color: "#59636F",
      wep: /torpedo/i,
      notWep: /boarding|bomber/i,
      list: /Tzeentch/i,
      fleet: /CHAOS/i,
      text: "Torpedoes: may be normal or boarding torpedoes (Rulebook p. 78). (Fleets p. 237)"
    },
    /* T25 (user decision 11.9.2026): the Nurgle, Khorne and Slaanesh paragraphs
       (pp. 241, 245, 249) break off in the book; the parallel lists complete them. */
    {
      id: "chaos_torpedoes_241",
      color: "#59636F",
      wep: /torpedo/i,
      notWep: /boarding|bomber/i,
      list: /Nurgle/i,
      fleet: /CHAOS/i,
      text: "Torpedoes: may be normal or boarding torpedoes (Rulebook p. 78). (Fleets pp. 235, 241)"
    },
    {
      id: "chaos_torpedoes_245",
      color: "#59636F",
      wep: /torpedo/i,
      notWep: /boarding|bomber/i,
      list: /Khorne/i,
      fleet: /CHAOS/i,
      text: "Torpedoes: may be normal or boarding torpedoes (Rulebook p. 78). (Fleets pp. 235, 245)"
    },
    {
      id: "chaos_torpedoes_249",
      color: "#59636F",
      wep: /torpedo/i,
      notWep: /boarding|bomber/i,
      list: /Slaanesh/i,
      fleet: /CHAOS/i,
      text: "Torpedoes: may be normal or boarding torpedoes (Rulebook p. 78). (Fleets pp. 235, 249)"
    },
    {
      id: "thunderhawk",
      color: "#70469A",
      wep: /launch bay/i,
      range: /thunderhawk/i,
      opt: /thunderhawk/i,
      mentions: [/thunderhawk/i],
      text: "Thunderhawk Gunship: a 20 cm fighter/assault boat. It removes one enemy ordnance marker and stops; on 4+ it survives. At a ship it makes a Space Marine Hit & Run attack. (Fleets p. 95)"
    },
    /* Crusade fleets only: the same bays may fly Annihilators instead. Grey
       Knights and Inquisition hulls say in their own SPECIAL text that they
       have no access to them, so the rule is tied to the list, not the fleet. */
    {
      id: "thunderhawk_annihilator",
      color: "#3B5BA5",
      list: /Crusade/i,
      wep: /launch bay/i,
      range: /thunderhawk/i,
      opt: /annihilator/i,
      mentions: [/annihilator/i],
      text: "Thunderhawk Annihilator: the bays may launch Annihilators instead - 20 cm fighter/bombers with the Thunderhawk 4+ resilience but no assault boat attack. They bomb a ship on contact and each surviving marker adds +1 attack after turrets; markers may forgo their attack to suppress turrets instead. (Fleets p. 96)"
    },
    /* Rapid strike vessels are Navy hulls on a Space Marine list with the
       Space Marine special rules (Fleets p. 106, the +5 pts); Mechanicus
       escorts are Navy or Marine hulls WITHOUT the Space Marine boarding
       bonuses (p. 121). */
    {
      id: "astartes_boarding",
      color: "#59636F",
      fleet: /SPACE MARINES|GREY KNIGHTS/i,
      entry: /rapid strike vessel/i,
      notList: /Mechanicus/i,
      wep: /torpedo/i,
      mentions: [/boarding torpedo|torpedo/i],
      text: "Astartes Torpedoes: may fire boarding torpedoes instead of ordinary torpedoes; their Hit & Run attack gains the Space Marine +1 bonus. (Fleets p. 95)"
    },
    /* Bought abilities. The price is not the option: a ship option (opt) or a
       list upgrade taken (up) brings the rule it buys onto the card. wep never
       matches a weapon row. */
    {
      id: "sepulchre",
      color: "#4B7A3F",
      fleet: /NECRON/i,
      wep: /^$/,
      opt: /sepulchre/i,
      up: /^sepulchre/i,
      mentions: [/sepulchre/i],
      text: "Sepulchre: the ship has Leadership 10. Used when not on Special Orders or Crippled: one enemy ship within 20 cm takes a Leadership test; if it fails, its Leadership is permanently -1 and it may use no Special Orders (Brace included) until the end of its next turn. Ordnance within 20 cm, except non-boarding torpedoes, is destroyed on 4+. (Fleets p. 400)"
    },
    {
      id: "csm_crew",
      color: "#7B3FB2",
      fleet: /CHAOS/i,
      wep: /^$/,
      opt: /embark chaos space marines/i,
      up: /space marine crew/i,
      notOpt: /chosen terminators/i,
      mentions: [/chaos space marine crew/i],
      text: "Chaos Space Marine crew: Leadership +1, maximum 10. +2 in boarding actions; enemy Hit & Run rolls -1; own Hit & Run by boarding torpedoes, Dreadclaws, Thunderhawks or teleport +1. 2 Assault Points per turn in a Planetary Assault. (Fleets p. 224)"
    },
    {
      id: "chosen_terminators",
      color: "#7B3FB2",
      fleet: /CHAOS/i,
      wep: /^$/,
      opt: /chosen terminators/i,
      up: /chosen terminators/i,
      mentions: [/chosen terminators/i],
      text: "Chosen Terminators: in a teleport Hit & Run attack roll two dice and choose which counts, +1 as normal. (Fleets p. 224)"
    },
    /* Chaos Marks (Fleets p. 232 and the god lists pp. 236-248) and the
       Daemonship (pp. 227-228): bought as list rows, so they print only when
       taken. On the Nurgle, Khorne and Slaanesh lists the Daemonship price
       includes the Mark ("must take the Mark ..., which is already included",
       pp. 241, 245, 249), so the Daemonship row brings the Mark's rule with it;
       Tzeentch pays for it separately (p. 237). ship: not on a commander card,
       whose row already prints the book's own description. */
    {
      id: "daemonship",
      color: "#7B3FB2",
      fleet: /CHAOS/i,
      wep: /^$/,
      up: /^daemonship:/i,
      ship: true,
      mentions: [/daemon ?ship/i],
      text: "Daemonship: may wait in the Warp and arrive in the End phase of any Chaos turn after the first, within 20 cm of a capital ship and scattered 4D6 cm. It is spectral until it translates on a 2+ in a later End phase: enemies within 15 cm are -1 Ld for Special Orders, it cannot act and cannot be attacked. It may disengage at the end of any Movement phase without a roll and return later, repairing D6: 4-5 = +1 Hp, 6 = +2 Hp (+1 if a battleship, +1 per full turn in the Warp), criticals on 4+. No Warmaster, Lord or Chaos Space Marine crew, no squadrons, no Exterminatus or planetary assault points. (Fleets pp. 227-228)"
    },
    {
      id: "mark_slaanesh",
      color: "#B5236B",
      fleet: /CHAOS/i,
      wep: /^$/,
      up: /^the mark of slaanesh/i,
      ship: true,
      mentions: [/mark of slaanesh/i],
      text: "Mark of Slaanesh: enemy ships within 15 cm suffer -2 Leadership; an area effect, not blocked by line of sight. (Fleets pp. 232, 248)"
    },
    {
      id: "mark_slaanesh",
      color: "#B5236B",
      list: /Slaanesh/i,
      wep: /^$/,
      up: /^daemonship:/i,
      ship: true,
      mentions: [/mark of slaanesh/i],
      text: "Mark of Slaanesh (included in the Daemonship): enemy ships within 15 cm suffer -2 Leadership; an area effect, not blocked by line of sight. (Fleets pp. 232, 248-249)"
    },
    {
      id: "mark_khorne",
      color: "#B5236B",
      fleet: /CHAOS/i,
      wep: /^$/,
      up: /^the mark of khorne/i,
      ship: true,
      mentions: [/mark of khorne/i],
      text: "Mark of Khorne: the ship doubles its value in boarding actions. (Fleets pp. 232, 244)"
    },
    {
      id: "mark_khorne",
      color: "#B5236B",
      list: /Khorne/i,
      wep: /^$/,
      up: /^daemonship:/i,
      ship: true,
      mentions: [/mark of khorne/i],
      text: "Mark of Khorne (included in the Daemonship): the ship doubles its value in boarding actions. (Fleets pp. 232, 244-245)"
    },
    {
      id: "mark_tzeentch",
      color: "#B5236B",
      fleet: /CHAOS/i,
      wep: /^$/,
      up: /^the mark of tzeentch/i,
      ship: true,
      mentions: [/mark of tzeentch/i],
      text: "Mark of Tzeentch: the ship gains one re-roll of its own. (Fleets pp. 232, 236)"
    },
    {
      id: "mark_nurgle",
      color: "#B5236B",
      fleet: /CHAOS/i,
      wep: /^$/,
      up: /^the mark of nurgle/i,
      ship: true,
      mentions: [/mark of nurgle/i],
      text: "Mark of Nurgle: +1 Damage Point (counted in HITS) and the ship may not be boarded; Hit & Run attacks still allowed. (Fleets pp. 232, 240; Rulebook p. 91)"
    },
    {
      id: "mark_nurgle",
      color: "#B5236B",
      list: /Nurgle/i,
      wep: /^$/,
      up: /^daemonship:/i,
      ship: true,
      mentions: [/mark of nurgle/i],
      text: "Mark of Nurgle (included in the Daemonship): +1 Damage Point (counted in HITS) and the ship may not be boarded; Hit & Run attacks still allowed. (Fleets pp. 232, 240-241; Rulebook p. 91)"
    },
    {
      id: "terminator_boarding",
      color: "#59636F",
      fleet: /SPACE MARINES|GREY KNIGHTS/i,
      wep: /^$/,
      up: /terminator boarding|grey knights terminators/i,
      mentions: [/terminator boarding/i],
      text: "Terminator boarding party: once per turn, in a teleport Hit & Run attack roll two dice and apply both results, +1 as Space Marines; in addition to a normal teleport attack. (Fleets p. 96)"
    },
    {
      id: "honour_guard",
      color: "#59636F",
      fleet: /SPACE MARINES|GREY KNIGHTS/i,
      wep: /^$/,
      up: /honour guard/i,
      mentions: [/honour guard/i],
      text: "Honour Guard: once per turn, in a teleport Hit & Run attack roll two dice and choose which counts, +1 as Space Marines; in addition to a normal teleport attack. (Fleets p. 96)"
    },
    {
      id: "fast_clipper",
      color: "#8A7340",
      wep: /^$/,
      opt: /fast clipper/i,
      mentions: [/fast clipper|advanced drive/i],
      text: "Fast Clipper: the weapons battery is removed; Advanced Drive Technology gives +5 cm Speed (shown above) and +1D6 cm on All Ahead Full. (Fleets pp. 175, 192)"
    },
    {
      id: "aspect_host",
      color: "#1474C4",
      fleet: /^ELDAR$/i,
      wep: /^$/,
      up: /aspect warrior host/i,
      mentions: [/aspect warrior/i],
      text: "Aspect Warrior Host: +2 in boarding actions, +1 to Hit & Run attacks. Not on a Ghostship. (Fleets pp. 305, 318)"
    },
    {
      id: "ghostship",
      color: "#5A6E8C",
      fleet: /^ELDAR$/i,
      wep: /^$/,
      up: /^ghostship/i,
      mentions: [/ghostship/i],
      text: "Ghostship: normal Eldar Leadership. If it fails a Command check for Special Orders it may do nothing but move this turn, and no other Ghostship may test that turn (a failed Brace may still Brace, then does nothing but move next turn). Deathless: critical hits only on a 6. Uncrewed: no Aspect Warriors, no launch bays, no boarding or Hit & Run attacks; enemies get +1 boarding and +1 Hit & Run against it; damage control rolls half the dice. (Fleets p. 307)"
    },
    {
      id: "klaws",
      color: "#A97913",
      fleet: /ORKS/i,
      wep: /^$/,
      opt: /\bklaws\b/i,
      up: /^klaws/i,
      mentions: [/\bklaws\b/i],
      text: "Klaws: once per turn, when the ship moves into base contact with an enemy ship, roll 2D6; each 4+ is one hit ignoring shields (not holofields). Brace works; unaffected by Special Orders; a crippled capital ship cannot use them. If both hit it latches on: neither ship moves if the target is the same class or smaller (a larger one moves at half rate), both shoot at half effect with no nova cannon or similar weapons, and it attacks again each End phase (both hitting again adds a third hit). Either may board; Klaw damage causes criticals as normal. (Fleets p. 371)"
    },
    {
      id: "power_ram",
      color: "#8A7340",
      wep: /^$/,
      up: /power ram/i,
      mentions: [/power ram/i],
      text: "Power Ram: one automatic hit on a successful ram, before rolling for hits. Not with a Nova Cannon. (Fleets p. 118)"
    },
    {
      id: "ork_gunz",
      color: "#A97913",
      fleet: /ORKS/i,
      wep: /\bgunz(?: battery)?\b/i,
      notWep: /heavy gunz/i,
      mentions: [/\bgunz\b/i],
      text: "Ork Gunz: weapon batteries; roll the printed random Firepower each time they fire. (Fleets p. 360)"
    },
    {
      id: "heavy_gunz",
      color: "#D14900",
      fleet: /ORKS/i,
      wep: /heavy gunz/i,
      mentions: [/heavy gunz/i],
      text: "Heavy Gunz: weapon batteries without the range column shift; every hit causes 2 Hits. (Fleets p. 360)"
    },
    {
      id: "ork_torpedo",
      color: "#52606D",
      fleet: /ORKS/i,
      wep: /torpedo/i,
      notOpt: /boarding torpedo|torpedo[- ]?bomma/i,
      mentions: [/torpedo(?:es| launcha| launchas)?/i],
      text: "Ork Torpedo Launchas: roll the printed salvo Strength each time they fire; a squadron may not combine salvoes. (Fleets p. 360)"
    },
    {
      id: "ork_torpedo_bomma",
      color: "#B14E25",
      fleet: /ORKS/i,
      wep: /torpedo[- ]?bomma/i,
      opt: /torpedo[- ]?bomma/i,
      mentions: [/torpedo[- ]?bomma/i],
      text: "Torpedo-Bommas: 20 cm bombers, no fighter ability. From the turn after launch each marker may become a Strength-2 torpedo salvo; an additional carrier option. (Fleets p. 359)"
    },
    {
      id: "ork_fighta_bomma",
      color: "#70469A",
      fleet: /ORKS/i,
      wep: /launch bay/i,
      range: /fighta-bomma/i,
      mentions: [/fighta-bomma|launch capacit|attack craft/i],
      text: "Fighta-Bommas: 25 cm fighter/bombers; attack a ship with D3 instead of D6, survivors add +1 attack each after turrets; some may forgo attacks to suppress. Fleet launch capacity: each Ordnance phase roll every variable launch bay Strength and add the fixed ones; attack craft above the total are removed at the end of the turn. (Fleets p. 359)"
    },
    {
      id: "eldar_pulsar",
      color: "#1474C4",
      fleet: /^ELDAR$/i,
      wep: /pulsar lance/i,
      mentions: [/pulsar lance/i],
      text: "Pulsar Lance: hits as a lance on 4+; after a hit, roll again until it misses or that shot has caused 3 hits. (Fleets p. 304)"
    },
    {
      id: "eldar_shadow",
      color: "#28699B",
      fleet: /^ELDAR$/i,
      wep: /shadow lance/i,
      mentions: [/shadow lance/i],
      text: "Shadow Lance: counts as a normal lance; it does not gain the Pulsar's repeat-hit rolls. (Fleets p. 304)"
    },
    {
      id: "eldar_battery",
      color: "#C99500",
      fleet: /^ELDAR$/i,
      wep: /weapons battery/i,
      mentions: [/weapons batter/i],
      text: "Eldar Weapons Battery: treat every target as Closing on the Gunnery table. (Fleets p. 304)"
    },
    {
      id: "eldar_ordnance",
      color: "#70469A",
      fleet: /^ELDAR$/i,
      wep: /launch bay|torpedo/i,
      mentions: [/ordnance|torpedo|attack craft|launch bay/i],
      text: "Eldar Ordnance: turrets hit it only on 6. Torpedoes re-roll their first failed hit; fighters have a 4+ resilience save and bombers re-roll attacks. (Fleets p. 304)"
    },
    {
      id: "dark_battery",
      color: "#A33B54",
      fleet: /DARK ELDAR/i,
      wep: /weapons battery/i,
      mentions: [/weapons batter/i],
      text: "Dark Eldar Weapons Battery: treat every target as Closing on the Gunnery table. (Fleets p. 345)"
    },
    {
      id: "phantom_lance",
      color: "#6C2E91",
      fleet: /DARK ELDAR|^ELDAR$/i,
      wep: /phantom lance/i,
      mentions: [/phantom lance/i],
      text: "Phantom Lance: each Strength die scores 0 hits on 1-3, 1 hit on 4, and 2 hits on 5-6. (Fleets p. 345)"
    },
    {
      id: "dark_ordnance",
      color: "#70469A",
      fleet: /DARK ELDAR/i,
      wep: /launch bay|torpedo|impaler/i,
      mentions: [/ordnance|torpedo|attack craft|impaler/i],
      text: "Dark Eldar Ordnance: turrets hit it only on 6; Raptor fighters have a 4+ resilience save and Razorwing bombers re-roll attacks. (Fleets p. 345)"
    },
    {
      id: "dark_torpedo",
      color: "#52606D",
      fleet: /DARK ELDAR/i,
      wep: /torpedo/i,
      mentions: [/leech torpedo|eldar torpedo/i],
      text: "Dark Eldar Torpedoes: ordinary Eldar torpedoes re-roll their first miss. Leech torpedoes instead cause one automatic critical: Speed -10 cm and no All Ahead Full until every leech is repaired. (Fleets p. 347)"
    },
    {
      id: "impaler",
      color: "#7A5230",
      fleet: /DARK ELDAR/i,
      wep: /impaler/i,
      mentions: [/impaler/i],
      text: "Impaler: independent assault module; 4+ save against a fighter, then a special Hit & Run. On 2-6 roll 2D6 on the critical table; a natural 1 loses it for the game. (Fleets p. 346)"
    },
    {
      id: "mimic_engine",
      color: "#00806F",
      fleet: /DARK ELDAR/i,
      wep: /mimic engine/i,
      opt: /mimic engine/i,
      mentions: [/mimic engine/i],
      text: "Mimic Engines: make one normal move after deployment. If then over 30 cm away, the vessel cannot be targeted in turn 1 until it attacks; no effect against Tyranids or Necrons. (Fleets p. 343)"
    },
    {
      id: "tau_railgun",
      color: "#2E6B4A",
      fleet: /TAU/i,
      wep: /railgun battery/i,
      mentions: [/railgun batter/i],
      text: "Railgun Battery: functions as a standard weapon battery. (Fleets p. 450)"
    },
    {
      id: "tau_ion",
      color: "#1474C4",
      fleet: /TAU/i,
      wep: /ion cannon/i,
      mentions: [/ion cannon/i],
      text: "Ion Cannon: functions as a lance in all respects. (Fleets p. 450)"
    },
    {
      id: "tau_missile",
      color: "#59636F",
      fleet: /TAU/i,
      wep: /gravitic launcher/i,
      mentions: [/gravitic launcher|tau missile/i],
      text: "Gravitic Launcher: fires guided Tau missiles; move 20-40 cm, turn 45 degrees before moving, and lose 1 Strength for every 6 rolled after launch. (Fleets pp. 450-451)"
    },
    {
      id: "tau_hook",
      color: "#00806F",
      fleet: /TAU|NICASSAR/i,
      wep: /gravitic hook/i,
      mentions: [/gravitic hook/i],
      text: "Gravitic Hook: its capacity limits the listed transported escorts; they deploy separately and cannot dock during play. (Fleets p. 450)"
    },
    {
      id: "tau_manta",
      color: "#70469A",
      fleet: /TAU/i,
      wep: /launch bay/i,
      range: /manta/i,
      mentions: [/manta|attack craft|launch bay/i],
      text: "Tau Launch Bay: Barracuda fighters move 25 cm; Manta bombers move 20 cm and have one 4+ resilience save against fighters each Ordnance phase. (Fleets p. 451)"
    },
    {
      id: "lightning_arc",
      color: "#A96B00",
      fleet: /NECRON/i,
      wep: /lightning arc/i,
      mentions: [/lightning arc/i],
      text: "Lightning Arc: weapon battery; all targets count as Closing, holofields cause no right shift, and Firepower may be divided among its fire arcs. (Fleets p. 400)"
    },
    {
      id: "particle_whip",
      color: "#1769B0",
      fleet: /NECRON/i,
      wep: /particle whip/i,
      mentions: [/particle whip/i],
      text: "Gauss Particle Whip: fires as a lance; a natural 6 to hit ignores shields, holofields and similar saves. (Fleets p. 400)"
    },
    {
      id: "star_pulse",
      color: "#C12F70",
      fleet: /NECRON/i,
      wep: /star pulse/i,
      mentions: [/star pulse/i],
      text: "Star Pulse Generator: one attack against every non-Necron target within 20 cm; ordnance is hit on 4+. No use while Crippled or on any Special Order. (Fleets p. 400)"
    },
    {
      id: "portal",
      color: "#6542B5",
      fleet: /NECRON/i,
      wep: /\bportal\b/i,
      mentions: [/\bportal/i],
      text: "Portal: grants the printed number of 10 cm Hit & Run attacks. It works on Special Orders; halve it while Crippled or Braced. (Fleets p. 401)"
    },
    {
      id: "bio_plasma",
      color: "#1474C4",
      fleet: /TYRANID/i,
      wep: /bio-plasma/i,
      mentions: [/bio-plasma/i],
      text: "Bio-plasma: hits like a lance on 4+, ignores shields, turrets cannot shoot it down; holofields and reactive saves still work. (Fleets p. 419)"
    },
    {
      id: "feeder",
      color: "#8A469F",
      fleet: /TYRANID/i,
      wep: /feeder tentacle/i,
      mentions: [/feeder tentacle/i],
      text: "Feeder Tentacles: once per turn on contact roll D6; 1-3 = that many Hit & Run attacks, 4-6 = 1 Hit plus one Hit & Run. No attack while Crippled. (Fleets p. 419)"
    },
    {
      id: "claws",
      color: "#C33C3C",
      fleet: /TYRANID/i,
      wep: /massive claws/i,
      mentions: [/massive claws/i],
      text: "Massive Claws: on contact roll 2D6 per pair, each 4+ = 1 Hit ignoring shields (not holofields); one target per turn. Two hits grapple it: neither ship moves (a larger class at half rate), no disengaging, both shoot at half effect, boarding as normal; every End phase attack again, and two hits on a grappled target cause a third additional hit. Not against a ship that made contact in the enemy turn; no attack while Crippled. (Fleets p. 420)"
    },
    {
      id: "pyro_acid",
      color: "#B77800",
      fleet: /TYRANID/i,
      wep: /pyro-acid/i,
      mentions: [/pyro-acid/i],
      text: "Pyro-acid Battery: a weapon battery; each critical hit also causes a Fire critical. (Fleets p. 420)"
    },
    {
      id: "tyranid_ordnance",
      color: "#70469A",
      fleet: /TYRANID/i,
      wep: /launch bay/i,
      mentions: [/launch bay|attack craft|ordnance/i],
      text: "Tyranid Launch Bay: fighters (20 cm) and assault boats (15 cm) only; the fleet may have twice its launch-bay capacity in attack craft. A Crippled bio-ship cannot launch. (Fleets p. 424)"
    },
    {
      id: "fire_ship",
      color: "#C43D4D",
      fleet: /TYRANID/i,
      wep: /fire\s*ship/i,
      opt: /fire\s*ship/i,
      mentions: [/fire\s*ship/i],
      text: "Fire Ship: detonate at any point in its move; every ship within 3D6 cm suffers D3 Fire criticals, escorts and ordnance in the blast are destroyed, then replace it with a Blast Marker. (Fleets p. 516)"
    },
    {
      id: "cutting_beam",
      color: "#007C91",
      fleet: /DEMIURG/i,
      wep: /cutting beam/i,
      mentions: [/cutting beam/i],
      text: "Cutting Beam: lance Strength starts at 1 and gains +1 per Blast Marker collected that turn (max 8); at 30 cm halve Strength, rounding down. (Fleets p. 484)"
    },
    {
      id: "demiurg_bay",
      color: "#70469A",
      fleet: /DEMIURG/i,
      wep: /launch bay/i,
      range: /torpedo/i,
      mentions: [/launch bay|attack craft|torpedo/i],
      selfText: /may launch either attack craft or torpedoes/i,
      text: "Demiurg Launch Bay: if its profile lists torpedoes, launch either attack craft or torpedoes in a turn, never both. (Fleets p. 484)"
    },
    {
      id: "disruptor",
      color: "#28699B",
      wep: /disruptor cannon/i,
      mentions: [/disruptor cannon/i],
      selfText: /functions as a standard lance in all respects/i,
      text: "Disruptor Cannon: functions as a standard lance in all respects. (Fleets p. 186)"
    },
    {
      id: "whisperlance",
      color: "#28699B",
      wep: /whisperlance/i,
      mentions: [/whisperlance/i],
      selfText: /behaves as a lance battery in all respects/i,
      text: "Whisperlance Cannon: functions as a standard lance in all respects. (Fleets p. 188)"
    },
    {
      id: "ghost_light",
      color: "#A33B54",
      wep: /ghost-light/i,
      mentions: [/ghost-light/i],
      text: "Ghost-Light weapons: act as the indicated battery or lance but never roll for or inflict critical damage. (Fleets p. 196)"
    },
    {
      id: "hives_nurgle",
      color: "#5D722D",
      wep: /hives of nurgle/i,
      mentions: [/hives of nurgle/i],
      text: "Hives of Nurgle: function as weapons batteries; after each move place one Blast Marker anywhere along the ship's course. (Fleets p. 263)"
    },
    {
      id: "warp_cannon",
      color: "#7A3F98",
      wep: /warp cannon/i,
      mentions: [/warp cannon/i],
      text: "Warp Cannons: hit on 4+ like lances and ignore shields, holofields and similar saves; Brace saves still apply. (Fleets p. 284)"
    },
    {
      id: "armageddon",
      color: "#BD2C2C",
      wep: /armageddon gun/i,
      mentions: [/armageddon gun/i],
      text: "Armageddon Gun: move the Nova template 90 cm straight ahead; centre causes D6 hits (friend or foe), other contact 1, touched ordnance is destroyed. Line of sight only: an obstacle stops it and takes D6 Blast Markers. Reload Ordnance before firing again - a double 6 is a critical hit and the gun is lost for the battle, any other double lets it fire once more. No use while Crippled, Braced, on AAF or Burn Retros. (Fleets p. 253)"
    },
    {
      id: "armageddon_overcharge",
      color: "#BD2C2C",
      wep: /armageddon gun/i,
      mentions: [/overcharge/i],
      text: "Armageddon Overcharge: declare a charge over three consecutive turns - no turning, shooting or Special Orders, +2 shields, cannot be stopped. After the third turn's move fire 60 cm ahead: every ship touched is destroyed, no saves; the first planet or moon under the centre is removed on 2+ in D3 turns and becomes a 2D6 x 2D6 asteroid field. Then Reload Ordnance for two turns with no shooting. (Fleets p. 253)"
    }
  ];
  var STRANGE_HAPPENINGS = "a double on a command check makes the ship unreliable for the rest of the game: once crippled it must try to disengage every turn, and runs for the nearest table edge if it fails. If the double also failed the check, it does nothing this turn but make its minimum move straight ahead. Against Chaos: a second double means it must try to disengage at once, as if crippled, for the rest of the game; if that second double also failed the check, the ship defects to the Chaos player and scores victory points for neither side.";
  var SPECIAL_HULL_RULES = [
    /* Fleets p.145: every Grey Knights capital ship. Escorts of the list are
       Navy hulls "otherwise unmodified", so the ward is a capital-ship rule. */
    {
      id: "gk_wards",
      fleet: /GREY KNIGHTS/i,
      when: function(sh) {
        return !/escort/i.test(String(sh.ty || ""));
      },
      text: "Hexagrammic wards: ignores Chaos Marks and Daemonship effects on Leadership and boarding (a Mark of Slaanesh does not touch its Leadership, a Mark of Khorne does not double boarding against it). Chaos Space Marine rules still apply. (Fleets p. 145)"
    },
    /* The Fortress-Monastery has "a base leadership of 10" (Fleets p. 111):
       its own rule below replaces the Astartes Leadership table. */
    {
      id: "astartes_core",
      fleet: /SPACE MARINES|GREY KNIGHTS/i,
      entry: /rapid strike vessel/i,
      notList: /Mechanicus/i,
      when: function(sh) {
        return !/FORTRESS-MONASTERY/i.test(String(sh.nm || ""));
      },
      text: "Astartes crew: Leadership 8-10; +2 in boarding and +1 to Hit & Run. Enemy Hit & Run rolls suffer -1. (Fleets p. 94)"
    },
    {
      id: "eldar_move",
      fleet: /^ELDAR$/i,
      notDefence: true,
      text: "Eldar movement: turn to any facing, then use the sunward value of the three-part Speed; move again in your Ordnance phase. No AAF, Burn Retros, CTNH or ramming. Boarding: in either move, but not after shooting or launching ordnance; boarding in the Movement phase gives up the second move. (Fleets pp. 302-305)"
    },
    {
      id: "eldar_holo",
      fleet: /^ELDAR$/i,
      text: "Holofields: one right column shift against Gunnery; against other attacks save each hit on 2+, placing a Blast Marker for each save. (Fleets pp. 303-304)"
    },
    {
      id: "dark_move",
      fleet: /DARK ELDAR/i,
      text: "Dark Eldar movement: CTNH succeeds automatically; no minimum move, escorts included; cannot use Burn Retros. (Fleets p. 342; FAQ 2026)"
    },
    {
      id: "dark_shadow",
      fleet: /DARK ELDAR/i,
      text: "Shadowfields: one right column shift against Gunnery; against other attacks save each hit on 2+, placing a Blast Marker for each save. (Fleets pp. 342-343)"
    },
    {
      id: "dark_boarding",
      fleet: /DARK ELDAR/i,
      text: "Dark Eldar: boarding +1 in round one and -1 thereafter; Hit & Run +1 except Impalers. A Hit & Run may instead take slaves for Victory Points. (Fleets pp. 342-343)"
    },
    /* Space hulk rule pages - they follow the profile page, which the
       extractor reads alone. Chaos p.287-288, Ork p.390-391. */
    {
      id: "hulk_move",
      fleet: /SPACE HULK|ORK HULK/i,
      text: "Hulk movement: exactly 10 cm straight ahead each turn, never slowed by Blast Markers or damage; a 45\xB0 turn only in every second Movement phase, at the end of the move; no CTNH or Burn Retros. (Fleets pp. 287/390)"
    },
    {
      id: "hulk_gravity",
      fleet: /SPACE HULK|ORK HULK/i,
      text: "Hulk gravity well: 5 cm from the base edge, like a planet's; ships may orbit and move with it, and a ship breaking orbit decides so before the hulk moves. In a planet's or moon's well the hulk may turn 45\xB0 towards it at the end of its move, even if it turned last phase. (Fleets pp. 287/390)"
    },
    {
      id: "hulk_upgrades",
      fleet: /SPACE HULK|ORK HULK/i,
      text: "Hulk upgrades: none that improve Boarding Value, Turning or Speed. (Fleets pp. 288/390)"
    },
    {
      id: "chaos_hulk_ld",
      fleet: /CHAOS SPACE HULK/i,
      text: "Chaos Space Hulk: -1 Ld applied after all other modifiers, including the Warmaster and Chaos Space Marines. May launch up to twice as many attack craft as its remaining launch bays. (Fleets p. 287)"
    },
    /* Fleets p. 245: "Bezerker Fleets led by a Space Hulk may have more than
       two battleships, but other restrictions remain unchanged." */
    {
      id: "chaos_hulk_using_khorne",
      fleet: /CHAOS SPACE HULK/i,
      list: /Khorne/i,
      text: "Using the hulk: 0-1 per fleet and it must be the flagship. Not with the Planet Killer, an Activated Blackstone Fortress or another mandatory flagship. Takes no Chaos Mark; counts as a battleship for taking another. A Bezerker Fleet led by it may have more than two battleships. (Fleets pp. 245, 288)"
    },
    {
      id: "chaos_hulk_using",
      fleet: /CHAOS SPACE HULK/i,
      notList: /Khorne/i,
      text: "Using the hulk: 0-1 per fleet and it must be the flagship. Not with the Planet Killer, an Activated Blackstone Fortress or another mandatory flagship. Takes no Chaos Mark; counts as a battleship for taking another, at most two other battleships. (Fleets p. 288)"
    },
    /* The hulk's own rule (p.390) replaces the Ork general text (p.358) where
       they conflict - Leadership and the All Ahead Full move - and keeps what
       still applies: no Command check for AAF, +1 in boarding actions. */
    {
      id: "ork_hulk_ld",
      fleet: /ORK HULK/i,
      text: "Ork Hulk: always Leadership 6 (not the Ork -1). All Ahead Full needs no Command check but gives no extra move; as a Defence it rams on 3D6 Ld (2D6 against another defence). +1 in boarding actions. (Fleets pp. 358, 390)"
    },
    {
      id: "ork_hulk_warlord",
      fleet: /ORK HULK/i,
      text: "Warlord aboard: does not double Boarding Value. Looted Torpedoes and Maniac Gunners affect one weapon system per turn; Extra Powerfields cost +50; Mad Meks ignore a critical on a 6; Mega-armoured Boarding Parties unchanged. (Fleets p. 390)"
    },
    /* Roks, Kroot Warspheres and Stryxis Caravan Vessels (Fleets pp. 393,
       495, 197): the Rok's own All Ahead Full replaces the Ork one ("any rules
       which are not specifically noted as being modified below, apply in full
       to Roks"). */
    {
      id: "rock_move",
      when: function(sh) {
        return isRockVessel(sh) && !sh.df;
      },
      text: "Movement: exactly 10 cm straight ahead in each Movement phase; no turns, Burn Retros or Come to New Heading. All Ahead Full: an extra 2D6 cm in any direction at the end of the move, and 10 cm or more to a side becomes the new direction of travel. Crippling and Blast Markers do not reduce its speed; in a gravity well it may make a free 45 degree turn and/or take a stationary or low orbit. (Fleets pp. 393, 495, 197)"
    },
    {
      id: "rok_orks",
      when: function(sh) {
        return /^\s*ROK\s*$/i.test(String(sh.nm || "")) && !sh.df;
      },
      text: "Orks: Leadership is reduced by 1; All Ahead Full needs no Command check; +1 in boarding actions. (Fleets p. 358)"
    },
    /* Ruling T57: only on a Rok that has bought a speed upgrade, so the card
       says why its speed did not change (see fixedSpeed). */
    {
      id: "rok_fixed_speed",
      when: function(sh) {
        return /^\s*ROK\s*$/i.test(String(sh.nm || "")) && !sh.df;
      },
      whenSel: function(sel) {
        return statMod(sel, "sp") > 0;
      },
      text: "Speed upgrades: the Rok still moves exactly 10 cm - the +5 cm of Evil Sunz or Soopa Boostas does not change it. (Fleets pp. 369-370, 393; ruling T57, read as written)"
    },
    /* Fleets p. 360, ORK PLANETARY DEFENCES: bought with the defence points,
       a Rok "cannot move and count[s] as stationary in all effects ...
       including all rules concerning removal of blast markers from planetary
       defences", "automatically pass[es] all leadership checks" and takes only
       Reload Ordnance and Brace For Impact, "for which they are Leadership 7".
       Its own Ld wording replaces the p. 499 "any other check on Ld 7". The
       Ork +1 in boarding (p. 358) is a crew rule p. 360 does not take away. */
    {
      id: "rok_defence",
      slot: "orders",
      when: function(sh) {
        return /^\s*ROK\s*$/i.test(String(sh.nm || "")) && !!sh.df;
      },
      text: "Rok as a planetary defence: cannot move and counts as stationary in all effects - End Phase: remove D6 Blast Markers from it. Automatically passes every Leadership check; special orders only Reload Ordnance and Brace for Impact, both on Ld 7. After setting up each Rok roll 2D6: on a 12 it falls 2D6 cm toward the celestial phenomenon it orbits, and is destroyed if that brings it into contact with an asteroid field or the planet edge. +1 in boarding actions. (Fleets pp. 358, 360)"
    },
    {
      id: "warsphere_boarding",
      when: function(sh) {
        return /WARSPHERE/i.test(String(sh.nm || ""));
      },
      text: "Warsphere boarding: its boarding strength equals double its remaining hit points. (Fleets p. 495)"
    },
    {
      id: "stryxis_caravan",
      when: function(sh) {
        return /STRYXIS CARAVAN/i.test(String(sh.nm || ""));
      },
      text: "Stryxis caravan: the vessels stay grouped in a straight line no more than 10 cm apart and separate only once one of them is destroyed. All Ahead Full is free; no fleet re-rolls. (Fleets p. 197)"
    },
    {
      id: "ork_core",
      fleet: /ORKS/i,
      when: function(sh) {
        return !isOrkHulk(sh) && !isRockVessel(sh);
      },
      text: "Orks: Leadership is reduced by 1; All Ahead Full needs no Command check and adds 2D6 cm; +1 in boarding actions. (Fleets p. 358)"
    },
    /* Fleets p. 222: "Chaos has a +1 boarding modifier. The Chaos Space Marine
       upgrade replaces this, providing them with a total +2 boarding modifier."
       The list decides, not the profile: a Chaos fleet crews its renegade
       Imperial hulls too. p. 284: the Activated Blackstone Fortress "has no
       crew". */
    /* Rules of the section a hull was bought from (fleetMatches' sec gate).
       The build-time restrictions of p. 222 - no Nova Cannon, special weapon
       rules, Chaos Lords, crews, Chaos ordnance or Daemonship upgrades - are
       already enforced by the catalogue (the rows offer none of them), so the
       card carries what matters at the table. */
    {
      id: "renegade_cruiser",
      list: /^Chaos\b/,
      sec: /^RENEGADE IMPERIAL VESSELS$/i,
      when: function(sh) {
        return !/escort/i.test(String(sh.ty || ""));
      },
      text: "Renegade Imperial vessel: -1 Ld for going renegade; +1 in boarding actions as a Chaos vessel. Not a reserve - it counts as a Chaos vessel in all respects. (Fleets p. 222)"
    },
    {
      id: "renegade_escort",
      list: /^Chaos\b/,
      sec: /^RENEGADE IMPERIAL VESSELS$/i,
      when: function(sh) {
        return /escort/i.test(String(sh.ty || ""));
      },
      text: "Renegade Imperial escort: may be squadroned with other Chaos escorts; +1 in boarding actions as a Chaos vessel. Not a reserve - it counts as a Chaos vessel in all respects. (Fleets p. 222)"
    },
    /* p. 39 offers these Chaos hulls "since a reserve fleet also draws on very
       old or scarce vessels", and Strange happenings opens "In a reserve fleet,
       all vessels are prone to certain unexpected events". The card keeps the
       book's own condition in its first words rather than asserting more. */
    {
      id: "obscura_reserve",
      list: /Bastion/i,
      sec: /^THE RESERVE FLEETS OF SEGMENTUM OBSCURUS$/i,
      text: "Reserve fleet vessel: keeps its Chaos ordnance; no ship class variants. (Fleets p. 39)"
    },
    {
      id: "strange_happenings",
      list: /Bastion/i,
      sec: /^THE RESERVE FLEETS OF SEGMENTUM OBSCURUS$/i,
      /* Owner's decision 30 Sept 2026 (J153, narrows J143): "reserve fleet" is
         read as the ships taken as reserves - a subset of the fleet - so the row
         goes only on the card of a Chaos hull taken from the reserve section.
         The book's sentence "In a reserve fleet, all vessels are prone..."
         (p. 39) can be read more widely; p. 142 speaks of the rule as a property
         of these hulls ("These vessels are free of..."). The whole rule is on
         the card (space is not tight when the row is only on these cards), and
         p. 142's exemption is mentioned: in a fleet led by an Ordo Malleus
         Inquisitor the rule does not apply while his ship is in play. */
      text: "Strange happenings (reserve vessel): " + STRANGE_HAPPENINGS + " If an Ordo Malleus Inquisitor leads the fleet, this does not apply while the Inquisitor's ship remains in play. (Fleets pp. 39, 142)"
    },
    /* J144, Fleets p. 142: a fleet led by an Ordo Malleus Inquisitor "may take as
       reserves any Chaos ship listed in the Bastion Fleet List. These vessels are
       free of the Strange Happenings special rule as long as the Inquisitor's
       ship remains in play" - so the card carries the rule and when it starts.
       Chaos ordnance and no variants follow p. 39, whose reserve hulls these are. */
    {
      id: "malleus_reserve",
      sec: /^ORDO MALLEUS RESERVES$/i,
      text: "Ordo Malleus reserve: Chaos ordnance, no ship class variants. Strange happenings applies only once the Inquisitor's ship is out of play: " + STRANGE_HAPPENINGS + " (Fleets pp. 39, 142)"
    },
    /* Fleets p. 178: "All pirate vessels suffer a -1 leadership modifier,
       meaning their unmodified starting leadership will be from 5 to 8."
       Printed on the card like the Ork -1 and the Eldar +1. Not for the
       xenos: p. 179 has them "use the unmodified leadership from the fleet
       lists of their respective races", and p. 197 has Stryxis Caravan
       Vessels "rolling for leadership normally", as does p. 194 for Fra'al
       battleships ("rolling for leadership normally and counting as
       cruisers"). The Rogue Trader Xenos Vessel (p. 184) is read as xenos
       too - the line is left off rather than asserted (spot check
       2026-10-18/1, Fra'al found on its third round). */
    {
      id: "pirate_ld",
      list: /Pirates and Wolf Packs/i,
      notSec: /^STRYXIS/i,
      when: function(sh) {
        return !/XENOS VESSEL|STRYXIS|FRA.AL/i.test(String(sh.nm || ""));
      },
      text: "Pirate vessel: -1 Leadership, for an unmodified starting Leadership of 5-8. (Fleets p. 178)"
    },
    /* p. 222 refuses Chaos Space Marines to a renegade Imperial hull, so the
       crew clause would be a rule that ship cannot use: the renegade lines
       above carry the +1 on their own (spot check 2026-10-18/1). */
    {
      id: "chaos_core",
      list: /^Chaos\b/,
      notSec: /^RENEGADE IMPERIAL VESSELS$/i,
      when: function(sh) {
        return !/BLACKSTONE/i.test(String(sh.nm || ""));
      },
      text: "Chaos: +1 in boarding actions; a Chaos Space Marine crew makes it +2 in total. (Fleets p. 222)"
    },
    /* Fleets p. 486: "Vessels allied with the Demiurg rely on the basic leadership
       applicable to their fleets. They cannot use Demiurg fleet re-rolls, but if
       available they may purchase special characters with any re-rolls they come
       with." The fleet re-roll already says "Demiurg vessels only" (frr scope),
       but only as a tooltip; the ally's card says it where it is played
       (spot check 2026-10-18/1, round 9). Planetary defences are bought beside the
       list and are not its vessels (fleetMatches df gate). */
    {
      id: "demiurg_ally",
      list: /^Demiurg\b/,
      when: function(sh) {
        return !/DEMIURG/i.test(String(sh.fl || ""));
      },
      text: "Allied with the Demiurg: uses its own fleet's basic Leadership and cannot use Demiurg fleet re-rolls. (Fleets p. 486)"
    },
    /* Fleets p. 121, a Mechanicus fleet's reserves and allies: "Mechanicus
       vessels cannot be placed in squadrons with Rogue Trader, regular Imperial
       Navy or Adeptus Astartes vessels. Mechanicus re-rolls cannot be used on
       these vessels, and other fleet commander re-rolls cannot be used on
       Mechanicus vessels." Printed on the borrowed ship's card, where the
       re-roll is spent; the Explorator list's own Imperial hulls are
       Mechanicus vessels and are not borrowed (spot check 2026-10-18/1). */
    {
      id: "mechanicus_guest",
      inFleet: /Mechanicus/i,
      when: function(sh) {
        return /IMPERIAL NAVY|ROGUE TRADER|SPACE MARINE/i.test(String(sh.fl || ""));
      },
      text: "In a Mechanicus fleet: Mechanicus re-rolls cannot be used on this ship, nor this fleet's other commander re-rolls on Mechanicus vessels; it may not squadron with Mechanicus vessels. (Fleets p. 121)"
    },
    {
      id: "necron_hull",
      fleet: /NECRON/i,
      text: "Reactive Hull: printed save replaces Brace; Brace improves it to 2+ but Armour becomes 4+. No save against boarding damage, critical damage from unsaved hits, or Hit & Run attacks unless braced; Warp cannons ignore it unless braced. Immune to damage, Leadership and movement modifiers from flares, radiation, gas and Blast Markers. (Fleets p. 402)"
    },
    {
      id: "necron_drive",
      fleet: /NECRON/i,
      text: "Inertialess Drive: AAF adds D6 x 10 cm and permits one turn per 20 cm travelled. A Necron may fade out automatically at the end of its Movement phase. (Fleets p. 402)"
    },
    {
      id: "tyranid_control",
      fleet: /TYRANID/i,
      notList: /Vanguard/i,
      text: "Synaptic control: a Hive Ship may test to override Instinctive Behaviour within 45 cm; otherwise follow the Instinctive Orders flowchart. Navigation uses Ld 10. (Fleets pp. 416-418)"
    },
    /* Fleets p. 429: the Vanguard list has no hive ships; its escort squadrons
       lead themselves. */
    {
      id: "vanguard_control",
      fleet: /TYRANID/i,
      list: /Vanguard/i,
      text: "Vanguard squadron: Leadership equals the vessels remaining in the squadron, up to 10. At the start of each turn the squadron may test with its own Leadership to override Instinctive Behaviour; if it fails it acts on instinct. Brace for Impact against Ld 7 when no hive ship is within 45 cm. (Fleets pp. 416, 429)"
    },
    {
      id: "tyranid_target",
      fleet: /TYRANID/i,
      text: "Target the nearest enemy; Vanguard Drones highlight all targets within 15 cm. Boarding value doubled, 2D6 take the higher. Hit & Run vs Tyranids: 2D6, take the lowest (escort dies on 4+); own +1. (Fleets p. 418)"
    },
    {
      id: "tyranid_spores",
      fleet: /TYRANID/i,
      when: hasSpores,
      text: "Spores: each cyst is one replenishing shield and one turret. Blast Markers degrade their ordnance roll to 6+; spores may fire at torpedoes and attack craft in the same phase. (Fleets pp. 421-422)"
    },
    {
      id: "tau_core",
      fleet: /TAU/i,
      text: "Tau ships cannot make teleport attacks. Kor'vattra vessels and Tau defences halve boarding value; Kor'or'vesh capital ships use normal boarding value. (Fleets p. 450)"
    },
    /* Fleets pp. 450-451: "Deflectors are NOT shields and do not count as such
       for the purpose of boarding, blast markers or other effects which apply
       to shields." The profile's own line gives the 6+ prow. */
    {
      id: "tau_deflector",
      when: function(sh) {
        return /deflector/i.test(String(sh.sr || ""));
      },
      text: "Deflector: not a shield - it does not count as one for boarding, Blast Markers or other effects which apply to shields. (Fleets pp. 450-451)"
    },
    /* Fleets p. 329: the Flame "embarks the most fearsome members of Yriel's own
       pirate warband, which count as an Aspect Warrior fighting crew"; p. 305
       gives the bonus. */
    {
      id: "flame_aspect",
      when: function(sh) {
        return /FLAME OF ASURYAN/i.test(String(sh.nm || ""));
      },
      text: "Aspect Warrior fighting crew (included): +2 in boarding actions, +1 to Hit & Run attacks. (Fleets pp. 305, 329)"
    },
    /* Fleets p. 118: "the attacker may re-roll the dice if desired during
       boarding actions as well as Hit and Run attacks against Mechanicus
       vessels, but the second roll stands." p. 121: the list's escorts "count
       as Mechanicus vessels". */
    {
      id: "mechanicus_crew",
      list: /Mechanicus/i,
      native: true,
      text: "Mechanicus crews: attackers may re-roll their dice in boarding actions and Hit & Run attacks against this ship, but the second roll stands. (Fleets p. 118)"
    },
    {
      id: "demiurg_core",
      fleet: /DEMIURG/i,
      text: "Demiurg: remove every Blast Marker moved over; it causes no movement or transit penalty. Ignore solar flares, gas/dust clouds and radiation. (Fleets p. 483)"
    },
    /* Fleets p. 483: hired Demiurg leave when crippled - unless the list is
       their own war host, whose Determination rule (p. 486) replaces it. */
    {
      id: "demiurg_mercenary",
      fleet: /DEMIURG/i,
      notList: /Demiurg/i,
      text: "Mercenary Demiurg: a crippled ship tries to disengage every turn and otherwise runs for the nearest table edge; against Orks only at 1-2 Hp. (Fleets p. 483)"
    },
    {
      id: "demiurg_determination",
      fleet: /DEMIURG/i,
      list: /Demiurg/i,
      text: "Determination: in a Demiurg war host the ship does not attempt to disengage until it has 2 Hp or fewer. Victory Points: Stronghold 400, Bastion 300, Citadel 200. (Fleets p. 486)"
    },
    /* Fleets p. 302 / p. 342: the fleet-wide Leadership bonus. */
    {
      id: "eldar_ld",
      fleet: /^ELDAR$/i,
      text: "Eldar Leadership: add +1 to the rolled Leadership, for a value of 7-10. A Leadership check ignores gas clouds and solar flares (passing in a flare: no damage, turn away from the sun edge and move 2D6 cm); escorts re-roll it for free. Warp rift test on 2D6; asteroids, planets and radiation bursts as for any fleet. (Fleets pp. 302-303; FAQ 2026)"
    },
    {
      id: "dark_ld",
      fleet: /DARK ELDAR/i,
      text: "Dark Eldar Leadership: add +1 to the rolled Leadership, for 7-10. A Leadership check ignores celestial phenomena (not radiation bursts or explosions); escorts re-roll it for free. (Fleets p. 342)"
    },
    /* Fleets p. 451: a profile that says it carries a tracking system. */
    {
      id: "tau_tracking",
      when: function(sh) {
        return /tracking system/i.test(String(sh.sr || ""));
      },
      text: "Tracking System: Tau vessels within 10 cm (this one included) re-roll turret misses and ignore the column shift for firing batteries at more than 30 cm; it works on any Special Order, Brace For Impact included. (Fleets p. 451)"
    },
    /* Fleets p. 492: the Caravan is one vessel with its own damage model. */
    {
      id: "caravan",
      when: isCaravan,
      text: "Nicassar Caravan: Rig and Dhows fight as one vessel that never separates. It can be crippled but takes no critical damage - a critical is 1 extra Hp of damage instead. At 0 Hp it and its Dhows are destroyed; replace it with four Blast Markers. (Fleets p. 492)"
    },
    /* Fleets p. 99: "A fortress-monastery is equipped with Terminator boarding
       parties and an Honour Guard as part of its point cost"; p. 96 defines both. */
    {
      id: "fortress_monastery",
      when: function(sh) {
        return /FORTRESS-MONASTERY/i.test(String(sh.nm || ""));
      },
      text: "Fortress-Monastery (Ramilies rules, p. 500, except as below): base Leadership of 10. Special orders only Reload Ordnance, Lock On and Brace for Impact; re-rolls bought for it serve only the fortress. Only a Space Hulk may board it, and it has +2 for being Space Marines; enemy Hit & Run rolls suffer -1. Each uncrippled quadrant makes one teleport Hit & Run attack (+1); Thunderhawks are not doubled at the launch limit. (Fleets p. 111)"
    },
    {
      id: "fortress_monastery_crew",
      when: function(sh) {
        return /FORTRESS-MONASTERY/i.test(String(sh.nm || ""));
      },
      text: "Terminator boarding parties and an Honour Guard are included in the points cost. Once per turn each may be used in addition to a normal teleport attack: Terminators roll two dice for the Hit & Run teleport attack and apply both, the Honour Guard rolls two dice and chooses one, both with the Space Marine +1. (Fleets pp. 96, 99)"
    },
    /* Fleets p. 126: gifts included in the price, defined on p. 119. */
    {
      id: "omnissiah_gifts",
      when: function(sh) {
        return /OMNISSIAH/i.test(String(sh.nm || ""));
      },
      text: "Repulsor Shielding: ignore Blast Marker and gas cloud effects on Ld, movement and repairs (until Shields Collapsed). Augmented Weapon Relays: batteries one column left; lance hits double on a 6. (Fleets p. 119)"
    },
    /* Fleets p. 260: the Wage of Sin "always counts as being crewed by Emperor's
       Children Chaos Space Marines (included it its cost)" and bears the Mark of
       Slaanesh "as part of its point cost"; pp. 224 and 248 give the effects. */
    {
      id: "wage_of_sin_crew",
      when: function(sh) {
        return /^WAGE OF SIN/i.test(String(sh.nm || ""));
      },
      text: "Chaos Space Marine crew (Emperor's Children, included in the cost): Leadership +1, maximum 10. +2 in boarding actions; enemy Hit & Run rolls -1; own Hit & Run by boarding torpedoes, Dreadclaws, Thunderhawks or teleport +1. 2 Assault Points per turn in a Planetary Assault. (Fleets pp. 224, 260)"
    },
    {
      id: "wage_of_sin_mark",
      when: function(sh) {
        return /^WAGE OF SIN/i.test(String(sh.nm || ""));
      },
      text: "Mark of Slaanesh (included in the cost): enemy ships within 15 cm suffer -2 Leadership; an area effect, not blocked by line of sight. (Fleets pp. 248, 260)"
    },
    /* Fleets pp. 258, 262, 264: the Mark (and on the Slaverer a World Eaters
       crew) is part of the point cost; pp. 224 and 236-244 give the effects.
       Fleets p. 381: Zukov's Klaw carries Klaws as part of its cost (p. 371). */
    {
      id: "slaverer_crew",
      when: function(sh) {
        return /^SLAVERER/i.test(String(sh.nm || ""));
      },
      text: "Chaos Space Marine crew (World Eaters, included in the cost): Leadership +1, maximum 10. +2 in boarding actions; enemy Hit & Run rolls -1; own Hit & Run by boarding torpedoes, Dreadclaws, Thunderhawks or teleport +1. 2 Assault Points per turn in a Planetary Assault. (Fleets pp. 224, 264)"
    },
    {
      id: "slaverer_mark",
      when: function(sh) {
        return /^SLAVERER/i.test(String(sh.nm || ""));
      },
      text: "Mark of Khorne (included in the cost): the ship doubles its value in boarding actions. (Fleets pp. 244, 264)"
    },
    {
      id: "scion_mark",
      when: function(sh) {
        return /^SCION OF PROSPERO/i.test(String(sh.nm || ""));
      },
      text: "Mark of Tzeentch (included in the cost): the ship gains one re-roll of its own. (Fleets pp. 236, 258)"
    },
    {
      id: "terminus_mark",
      when: function(sh) {
        return /^TERMINUS EST/i.test(String(sh.nm || ""));
      },
      text: "Mark of Nurgle (included in the cost; the extra Hit is in the profile): the ship may not be boarded; Hit & Run attacks still allowed. (Fleets pp. 240, 262; Rulebook p. 91)"
    },
    /* ---- Planetary defences (Fleets pp. 498-499, Rulebook pp. 100-101) ----
       None of the profile pages 506-517 prints a SPECIAL box of its own
       (p. 516 excepted): the rules are in the chapter's opening pages and in
       the Rulebook, so the card would print a station with no rules at all. */
    /* Fleets p. 499 / Rulebook p. 100: "do not roll for leadership or have a
       leadership value ... reload ordnance (where applicable) on a nominal
       leadership of 7 ... cannot take on any special orders except Reload
       Ordnance, though they may also attempt to Brace For Impact against this
       same leadership. They also make all other leadership checks they may
       have to make against Ld 7". Book contradiction, recorded: the left
       column of p. 499 ends a paragraph with "However, they automatically pass
       any other leadership tests they may be required to make" - an orphan of
       the older rule; the box on the same page and the Rulebook both say Ld 7. */
    {
      id: "pd_orders",
      slot: "orders",
      when: function(sh) {
        return !!sh.df && sh.dld === 7 && hasOrdnance(sh) && !isRockVessel(sh);
      },
      text: "Planetary defence: no Leadership value and no Leadership roll. Special orders: only Reload Ordnance and Brace for Impact, both on Ld 7; any other Leadership check is also made on Ld 7. (Fleets p. 499; Rulebook p. 100)"
    },
    /* "they reload ordnance (where applicable)": a defence with no torpedoes
       and no launch bays is left with Brace for Impact alone. */
    {
      id: "pd_orders_brace",
      slot: "orders",
      when: function(sh) {
        return !!sh.df && sh.dld === 7 && !hasOrdnance(sh) && !isRockVessel(sh);
      },
      text: "Planetary defence: no Leadership value and no Leadership roll. Special orders: only Brace for Impact, on Ld 7 - it has no ordnance to reload; any other Leadership check is also made on Ld 7. (Fleets p. 499; Rulebook p. 100)"
    },
    /* Rulebook p. 101: "defences never drift, they always remain in place"
       and "You remove D6 Blast Markers from each defence with a speed of 0 cm
       in each End Phase after all other actions in the End Phase. This only
       applies to stationary defences, not planetary defences that behave as
       ships (such as monitors or system ships)." p. 100: satellites "fire all
       round". The quadrant forts have their own blast rule (Fleets p. 502). */
    {
      id: "pd_station",
      slot: "blast",
      when: function(sh) {
        return !!sh.df && !sh.qd && isStationaryDefence(sh) && (sh.hp | 0) > 1 && !isHaven(sh) && !isRockVessel(sh);
      },
      text: "Stationary defence: cannot move and never drifts. It takes damage, critical hits and crippling like a capital ship and rolls on the Catastrophic Damage table at 0 Hits. End Phase: remove D6 Blast Markers from it after everything else. (Rulebook p. 101)"
    },
    {
      id: "pd_platform",
      slot: "blast",
      when: function(sh) {
        return !!sh.df && !!sh.sq && !/ground/i.test(String(sh.ty || ""));
      },
      text: "Stationary defence: cannot move; its weapons fire all round. End Phase: remove D6 Blast Markers from it after everything else. (Rulebook pp. 100-101)"
    },
    /* Fleets p. 498: "Low orbit defences may only be deployed on the low orbit
       table. They are all ground-based, so must be placed along the table edge
       which has been designated as representing the ground. Laser and missile
       silos have a front fire arc which faces away from the planet's surface
       and into space. Low orbit defences can never attack ships which are not
       on the low orbit table ... ordnance launched from the ground cannot move
       up to high orbit". */
    {
      id: "pd_ground",
      slot: "placement",
      when: function(sh) {
        return !!sh.df && /ground/i.test(String(sh.ty || ""));
      },
      text: "Low orbit defence: deployed only on the low orbit table, along the edge that represents the ground; it can never attack ships that are not on that table, and ordnance launched from the ground cannot climb to high orbit. Silos fire in a front arc away from the surface. End Phase: remove D6 Blast Markers from it. (Fleets p. 498; Rulebook p. 101)"
    },
    /* Rulebook p. 116, FIGHTING IN LOW ORBIT: "all firepower shooting in low
       orbit suffers one column shift to the right, lances and nova cannons
       require a 4+ roll to fire" - every gun on that table, the silos' too.
       The torpedo ban there is for ships ("torpedoes may not be fired by ships
       at all"), so a missile silo is not named. */
    {
      id: "pd_low_orbit_fire",
      slot: "placement",
      when: function(sh) {
        return !!sh.df && /ground/i.test(String(sh.ty || "")) && (sh.aw || []).some(function(a) {
          return /battery|lance/i.test(String(a[0] || ""));
        });
      },
      text: "Firing in low orbit: firepower shifts one column right on the gunnery table, and each lance needs a 4+ to fire. (Rulebook p. 116)"
    },
    /* Fleets p. 498: "High orbit defences may be placed around a planet or its
       moons. They must be deployed within the planet or moon's gravity well". */
    {
      id: "pd_high_orbit",
      slot: "placement",
      when: function(sh) {
        return !!sh.df && !sh.qd && isStationaryDefence(sh) && !/ground/i.test(String(sh.ty || "")) && !isHaven(sh);
      },
      text: "High orbit defence: deployed inside the gravity well of the planet or one of its moons; stationary defences may touch bases but never overlap. (Fleets p. 498)"
    },
    /* Rulebook p. 101: the D6 removal "only applies to stationary defences,
       not planetary defences that behave as ships (such as monitors or system
       ships)". Fleets p. 498: "these ships have no warp engines and are
       therefore confined to the system". */
    {
      id: "pd_vessel",
      slot: "blast",
      when: function(sh) {
        return !!sh.df && /escort/i.test(String(sh.ty || ""));
      },
      text: "System defence vessel: moves and fights as an escort but is a planetary defence - squadrons of one to six one-hit defences, and no D6 Blast Marker removal: that is for stationary defences only. (Rulebook pp. 100-101)"
    },
    /* ---- Quadrant star forts: Ramilies (Fleets pp. 500-505) and, through
       "follows all rules for the Ramilies Class Star Fortress detailed on
       pg. 500 except as specifically outlined here" (p. 110), the
       Fortress-Monastery. The profile page holds two bullets; everything a
       player needs at the table is on the four pages after it (AGENTS.md 6).
       slot: where the fort's plan card puts the rule; the rest print on its
       rules card. The texts are the app's own short wording; the facts were
       read from the pages and checked by a second reader (8.10.2026). */
    {
      id: "fort_orders",
      slot: "orders",
      when: function(sh) {
        return !!sh.qd;
      },
      text: "Special orders: only Reload Ordnance, Lock On and Brace for Impact. The quadrants may be grouped and each group given its own order, one Command check per group; a single quadrant may Brace alone. (Fleets p. 503)"
    },
    {
      id: "ramilies_ld",
      slot: "orders",
      when: function(sh) {
        return !!sh.qd && !sh.dld;
      },
      text: "Leadership is rolled as for a capital ship. A fleet commander may be aboard: the fort then uses his Leadership. (Fleets p. 503)"
    },
    {
      id: "ramilies_reroll",
      slot: "rerolls",
      when: function(sh) {
        return !!sh.qd && (sh.rr | 0) > 0;
      },
      text: "The fort has one command re-roll of its own. With a fleet commander aboard it joins his re-rolls and may then be used anywhere in the fleet. (Fleets p. 503)"
    },
    /* p. 501: "draw a straight line from the stem of the firing ship to the
       centre of the Ramilies" - written for fire AT the fort. That a quadrant
       fires out of its own quarter is the profile's arc word "Quadrant" and
       the p. 501 diagram; the tie rule is the general fire-arc rule of
       Rulebook p. 60, not a Ramilies sentence. The book calls the quadrants
       'North', 'East', 'South' and 'West' with the piers between them; the
       card follows the player's model (piers on the axes), the same plan
       turned 45 degrees. */
    {
      id: "fort_sectors",
      slot: "sectors",
      when: function(sh) {
        return !!sh.qd;
      },
      text: "Which quadrant is hit: draw a line from the firing ship's stem to the centre of the fort - the quadrant it comes in through takes the fire; ordnance attacks the quadrant it moves in from (Fleets p. 501). Fire arc 'Quadrant': the book prints only the word and the p. 501 diagram - read here as the quadrant's own quarter, between its two piers. On a boundary the shooting player chooses, as with any fire arc (Rulebook p. 60)."
    },
    {
      id: "fort_templates",
      slot: "templates",
      when: function(sh) {
        return !!sh.qd;
      },
      text: "Templates: a Nova cannon or Armageddon gun scores its full D6 hits only on the quadrant most under the centre hole of the marker. (Fleets p. 501)"
    },
    {
      id: "fort_basilica",
      slot: "basilica",
      when: function(sh) {
        return !!sh.qd;
      },
      text: "Basilica weapons fire all round and count as being on every quadrant's special orders at once; Brace for Impact halves them as normal. Critical 11 destroys them. (Fleets pp. 503, 505)"
    },
    {
      id: "fort_boarding",
      slot: "boarding",
      when: function(sh) {
        return !!sh.qd;
      },
      text: "Boarding: only a Space Hulk may board it - against the Hits left in all four quadrants plus the turrets of the boarded quadrant; results go to that quadrant. Hit & Run raids and ramming affect one quadrant only. In its own End Phase the fort may board an enemy in base contact with as many quadrants as it likes. (Fleets p. 502)"
    },
    {
      id: "fort_turrets",
      slot: "turrets",
      when: function(sh) {
        return !!sh.qd;
      },
      text: "Massed turrets: +1 from each neighbouring quadrant that is not crippled or destroyed (+2 at most), +3 at most together with ships in base contact. (Fleets p. 502)"
    },
    {
      id: "fort_blast",
      slot: "blast",
      when: function(sh) {
        return !!sh.qd;
      },
      text: "Blast Markers: each quadrant has its own shields. One round of shooting puts markers on the quadrant hit and on at most one other; a quadrant with none placed against it counts as clear. End Phase: remove D6 Blast Markers from the whole fort, not per quadrant. (Fleets p. 502)"
    },
    {
      id: "fort_damage",
      slot: "damage",
      when: function(sh) {
        return !!sh.qd;
      },
      text: "A quadrant at 0 Hits takes no more damage and counts as an asteroid field from then on. Damage control is rolled for each quadrant. The fort is destroyed only when all four quadrants are at 0. (Fleets pp. 501-502)"
    },
    {
      id: "fort_catastrophic",
      slot: "catastrophic",
      when: function(sh) {
        return !!sh.qd;
      },
      text: "Catastrophic damage (D6, when all four quadrants are at 0): 1-2 a wreck that blocks line of fire and counts as an asteroid field; 3 an asteroid field 15 cm across; 4-5 eight lance shots at every ship within 4D6 cm, ordnance there removed, a solar flare on everything else, then 2D6 Blast Markers in its place; 6 four lance shots at every ship and ordnance marker within 4D6 cm, then a warp rift in its place that draws everything 15 cm toward it. (Fleets p. 505)"
    },
    {
      id: "fort_docking",
      slot: "docking",
      when: function(sh) {
        return !!sh.qd;
      },
      text: "Docking: a friendly ship touching the fort may halt as in a gravity well and may use Burn Retros to turn without a Command check. A ship touching a docking pier may dock fully: while docked it rolls 4 extra damage control dice, and after two full turns docked without bracing its ordnance is reloaded. No ship may dock with a rotating fort. (Fleets pp. 502-503)"
    },
    {
      id: "fort_rotating",
      slot: "rotating",
      when: function(sh) {
        return !!sh.qd;
      },
      text: "Rotating: decided before the game and not changed. A rotating fort turns 45 degrees once per game turn at the start of its owner's Movement phase, always the same way; Blast Markers stay where they are. (Fleets p. 502)"
    },
    {
      id: "ramilies_ordnance",
      slot: "ordnance",
      when: function(sh) {
        return !!sh.qd && !/FORTRESS-MONASTERY/i.test(String(sh.nm || ""));
      },
      text: "Attack craft: it may have twice as many markers in play as it has launch bays remaining. (Fleets p. 502)"
    },
    /* ---- Eldar Haven (Fleets pp. 334-337); as a Dark Eldar pirate base
       pp. 337 and 347. The profile bullets (Netherfield, Polarization Field)
       and the Eldar holofield and Leadership rules print by themselves. */
    {
      id: "haven_orders",
      slot: "orders",
      when: isHaven,
      text: "Haven: an Eldar or Dark Eldar fleet commander may lead the battle from it. Special orders: only Lock On, Reload Ordnance and Brace for Impact. (Fleets p. 336)"
    },
    {
      id: "haven_blast",
      slot: "blast",
      when: isHaven,
      text: "Large defence: at the end of each turn remove D6 Blast Markers in base contact with it, apart from the normal removal. (Fleets p. 336)"
    },
    {
      id: "haven_docking",
      slot: "docking",
      when: isHaven,
      text: "Docking: Eldar ships dock on a Leadership check. A capital ship docked for a full turn rolls 2 extra repair dice and reloads its ordnance, but may not move, shoot or launch that turn. In a turn with no ship docked the Haven rolls the 2 extra repair dice itself. (Fleets p. 336)"
    },
    {
      id: "haven_webway",
      slot: "webway",
      when: isHaven,
      text: "Webway Portal: ships bought at half cost wait off the table. From turn 2, after the fleet has moved, roll a D6: on 5+ one capital ship or escort squadron arrives at the table edge nearest the Haven and does not move that turn. (Fleets p. 337)"
    },
    {
      id: "haven_points",
      slot: "placement",
      when: isHaven,
      text: "Campaign: a Haven counts as a pirate base, and its value counts against the fleet list in the battles it takes part in. (Fleets p. 337)"
    },
    {
      id: "haven_dark",
      slot: "swaps",
      when: function(sh) {
        return isHaven(sh) && (sh.aw || []).some(function(a) {
          return /phantom/i.test(String(a[0] || ""));
        });
      },
      text: "Dark Eldar pirate base: Slavebringer assault boats replace the bombers and Phantom lances the Pulsar lances, at no change in cost; nothing else changes - it keeps its holofields and its 5+ critical threshold. (Fleets pp. 337, 347)"
    },
    {
      id: "zukov_klaws",
      when: function(sh) {
        return /^ZUKOV/i.test(String(sh.nm || ""));
      },
      text: "Klaws (included in the cost): once per turn, when the ship moves into base contact with an enemy ship, roll 2D6; each 4+ is one hit ignoring shields (not holofields). Brace works; unaffected by Special Orders; a crippled capital ship cannot use them. If both hit it latches on: neither ship moves if the target is the same class or smaller (a larger one moves at half rate), both shoot at half effect with no nova cannon or similar weapons, and it attacks again each End phase (both hitting again adds a third hit). Either may board; Klaw damage causes criticals as normal. (Fleets pp. 371, 381)"
    }
  ];
  function fleetMatches(def, sh, list, en, sel) {
    if (def.inFleet) {
      var fl0 = sel && sel.fleet, own0 = sel && sel.list;
      if (!fl0 || !own0 || fl0.nm === own0.nm || !def.inFleet.test(String(fl0.nm || ""))) return false;
    }
    const fl = String(sh.fl || ""), ctx = fl + " " + String(sh.nm || "");
    if (sh.df && (def.list || def.sec || def.entry || def.notDefence)) return false;
    if (def.list && !(list && def.list.test(list.nm))) return false;
    if (def.native && foreignReserveRow(list, en, sh)) return false;
    if (def.notList && list && def.notList.test(list.nm)) return false;
    if (def.when && !def.when(sh)) return false;
    if (def.whenSel && !(sel && def.whenSel(sel))) return false;
    if (def.sec || def.notSec) {
      var st = null;
      if (list && en) (list.secs || []).forEach(function(s2) {
        if (st === null && (s2.ents || []).indexOf(en) >= 0) st = String(s2.t || "");
      });
      if (def.sec && (st === null || !def.sec.test(st))) return false;
      if (def.notSec && st !== null && def.notSec.test(st)) return false;
    }
    if (def.entry && en && def.entry.test(String(en.l || ""))) return true;
    return !def.fleet || def.fleet.test(fl) || def.fleet.test(ctx);
  }
  function hasSpores(sh) {
    return /SPORES/i.test(String(sh.tl || "")) && !/^\s*[\u2013\u2014-]?\s*$/.test(String(sh.tu || ""));
  }
  function defMatches(def, sh, arm, list, en) {
    return fleetMatches(def, sh, list, en) && def.wep.test(String(arm[0] || "")) && (!def.notWep || !def.notWep.test(String(arm[0] || ""))) && (!def.range || def.range.test(String(arm[1] || "")));
  }
  function defOptionMatches(def, sh, option, list, en) {
    const text = String(option && option.t || option || "");
    if (!fleetMatches(def, sh, list, en)) return false;
    if (def.notOpt && def.notOpt.test(text)) return false;
    if (def.opt) return def.opt.test(text);
    if (option && option.sw && sh) {
      const removed = (option.sw.f || []).map((fi) => String(((sh.aw || [])[fi] || [])[0] || ""));
      if (removed.some((nm) => def.wep.test(nm))) return false;
    }
    if (option && option.aws && sh && option.aws.some((i) => {
      const a = (sh.aw || [])[i];
      return !!a && def.wep.test(String(a[0] || "")) && (!def.range || def.range.test(String(a[1] || "")));
    })) return true;
    return def.wep.test(text) && (!def.range || def.range.test(text));
  }
  function uniqRefs(refs) {
    const out = [], seen = {};
    refs.forEach((r) => {
      if (r && !seen[r.id]) {
        seen[r.id] = 1;
        out.push(r);
      }
    });
    return out;
  }
  function sourceStarDef(sh) {
    return (sh.aw || []).some((a) => /\*/.test(a[0])) ? { id: "source_asterisk", color: "#A33B54", mentions: [/^\s*\*/] } : null;
  }
  function weaponMentioned(text, arm) {
    const low = String(text || "").toLowerCase();
    const name = wepKey(arm[0]).replace(/\b(battery|batteries|bay|bays)\b/g, "").trim();
    if (name.length >= 4 && low.includes(name)) return true;
    if (/lance/i.test(arm[0]) && /\blances?\b/i.test(text)) return true;
    if (/torpedo/i.test(arm[0]) && /\btorpedo(?:es)?\b|\blauncha/i.test(text)) return true;
    if (/launch bay/i.test(arm[0]) && /launch bays?|attack craft/i.test(text)) return true;
    if (/weapons battery/i.test(arm[0]) && /weapons batter(?:y|ies)/i.test(text)) return true;
    return false;
  }
  function localRef(arm) {
    const [letter, color] = wepClass(arm[0]);
    const family = /lance/i.test(arm[0]) ? "lance" : /torpedo/i.test(arm[0]) ? "torpedo" : /launch bay/i.test(arm[0]) ? "launch" : /battery|gunz/i.test(arm[0]) ? "battery" : wepKey(arm[0]);
    return { id: "local_" + family, color, letter };
  }
  function specialModel(sh, list, sel) {
    const raw = (sh.sr || "").trim();
    const parts = [];
    if (raw) {
      (raw.indexOf("\u2022") >= 0 ? raw.split("\u2022") : raw.split(/(?<=\.)\s+(?=[A-Z])/)).forEach((t) => {
        t = t.trim().replace(/^[\u2022\s]+/, "");
        if (t.length > 2) parts.push(t);
      });
    }
    const en = sel ? sel.en : null;
    const arms = sel ? weaponRows(sel).filter((r) => r.box == null || r.box === "on").map((r) => r.a) : sh.aw || [];
    const byWeapon = arms.map((a) => SPECIAL_WEAPON_RULES.filter((d) => defMatches(d, sh, a, list, en)));
    const blocked = sel ? optionsOf(sel).map((o) => o.blockedBy.length > 0) : [];
    const optionDefs = (sh.ol || []).map((o, i) => sel && (optState(sel, i) === "off" || blocked[i]) ? [] : SPECIAL_WEAPON_RULES.filter((d) => defOptionMatches(d, sh, o, list, en)));
    const upDefs = sel ? boughtDefs(sel, sh, list) : [];
    const defs = uniqRefs(byWeapon.flat().concat(optionDefs.flat()).concat(upDefs));
    const sourceDef = sourceStarDef(sh);
    const rules = parts.map((t) => {
      let refs = defs.filter((d) => (d.mentions || []).some((re) => re.test(t)));
      arms.forEach((a, i) => {
        if (!weaponMentioned(t, a)) return;
        refs = refs.concat(byWeapon[i].length ? byWeapon[i] : [localRef(a)]);
      });
      if (sourceDef && /^\s*\*/.test(t)) refs.push(sourceDef);
      return { t, refs: uniqRefs(refs), ast: refs.length > 0 };
    });
    const explained = /* @__PURE__ */ new Set();
    parts.forEach((t) => defs.forEach((d) => {
      if (d.selfText && d.selfText.test(t)) explained.add(d.id);
    }));
    const bought = {};
    (sel ? optionDefs.filter((x, i) => optState(sel, i) === "take").flat() : []).concat(upDefs).forEach((d) => {
      bought[d.id] = 1;
    });
    defs.forEach((def) => {
      if (!explained.has(def.id))
        rules.push({ t: def.text, refs: [def], ast: true, canonical: true, weapon: !bought[def.id] });
    });
    SPECIAL_HULL_RULES.filter((d) => fleetMatches(d, sh, list, en, sel)).forEach((d) => rules.push({ t: d.text, refs: [], ast: false, canonical: true, hull: d.id, slot: d.slot || null }));
    return { rules, byWeapon, optionDefs, sourceDef };
  }
  function boughtDefs(sel, sh, list) {
    var labels = upgradesOf(sel).filter(function(x) {
      return x.state === "take";
    }).map(function(x) {
      return x.label;
    });
    if (!labels.length) return [];
    return SPECIAL_WEAPON_RULES.filter(function(d) {
      if (!d.up || !labels.some(function(l) {
        return d.up.test(l);
      })) return false;
      if (sh) return fleetMatches(d, sh, list, sel.en);
      if (d.ship) return false;
      return (!d.fleet || list && d.fleet.test(list.nm)) && (!d.list || list && d.list.test(list.nm));
    });
  }
  function specialLines(sh, list, sel) {
    return specialModel(sh, list, sel).rules;
  }
  function starredKeys(rules, sh, list) {
    const model = specialModel(sh, list), out = {};
    (sh.aw || []).forEach((a, i) => {
      let refs = model.byWeapon[i].slice();
      rules.forEach((r) => {
        if (weaponMentioned(r.t, a) && !refs.length) refs.push(localRef(a));
      });
      if (model.sourceDef && /\*/.test(a[0])) refs.push(model.sourceDef);
      const used = new Set(rules.flatMap((r) => (r.refs || []).map((x) => x.id)));
      refs = uniqRefs(refs).filter((r) => used.has(r.id));
      if (refs.length) out[i] = refs;
    });
    return out;
  }
  function optStars(sh, o, rules, list) {
    const model = specialModel(sh, list), text = String(o.t || "");
    const oi = (sh.ol || []).indexOf(o);
    let refs = oi >= 0 ? model.optionDefs[oi].slice() : [];
    model.byWeapon.forEach((defs, i) => {
      if (weaponMentioned(text, sh.aw[i])) refs = refs.concat(defs);
    });
    const used = new Set(rules.flatMap((r) => (r.refs || []).map((x) => x.id)));
    return uniqRefs(refs).filter((r) => used.has(r.id));
  }
  function ownedText(list, si, label) {
    var sec = list && list.secs[si];
    if (!sec || !sec.own) return "";
    var out = [];
    sec.own.forEach(function(o, i) {
      if (o === label && !/:\s*$/.test(String(sec.text[i] || ""))) out.push(sec.text[i]);
    });
    return out.join(" ");
  }
  function starsForRow(sh, rules, a, list, en) {
    var refs = SPECIAL_WEAPON_RULES.filter(function(dd) {
      return defMatches(dd, sh, a, list, en);
    });
    if (!refs.length)
      rules.forEach(function(r) {
        if (weaponMentioned(r.t, a)) refs = [localRef(a)];
      });
    var used = {};
    rules.forEach(function(r) {
      (r.refs || []).forEach(function(x) {
        used[x.id] = 1;
      });
    });
    return uniqRefs(refs).filter(function(r) {
      return used[r.id];
    });
  }
  function hullOptionsOf(en, catalog) {
    return (en.hulls || []).map(function(pg) {
      var h = catalog.ships[String(pg)];
      if (!h) return null;
      var crew = /SPACE MARINES/i.test(String(h.fl || "")) ? 0 : en.hcp || 0;
      return { ref: String(pg), name: h.nm, points: (h.bp || 0) + crew };
    }).filter(Boolean);
  }

  // packages/rules/src/validation.js
  function inclIn(en, text, anywhere) {
    if (!en || !en.frees) return false;
    return new RegExp(anywhere ? String(en.frees).replace(/^\^/, "") : en.frees, "i").test(String(text || ""));
  }
  function issue(code, severity, path, message, page) {
    return { code, severity, path, message, sourcePage: page == null ? null : page };
  }
  function shortText(t) {
    var s = String(t || "");
    return s.length > 48 ? s.slice(0, 45) + "..." : s;
  }
  function validateIntent(intent, ctx, catalog) {
    var out = [];
    var L = listOfIntent(intent, ctx, catalog);
    var at = intent.entry && L ? findEntry(L, intent.entry.section, intent.entry.label) : null;
    if (intent.entry && !at) out.push(issue("entry.unknown", "error", "entry", "list row not found: " + intent.entry.label));
    var en = at ? L.secs[at.si].ents[at.ei] : null;
    var sh = shipFor(intent.ref, en, catalog);
    if (intent.ref != null && !sh) out.push(issue("ship.unknown", "error", "ref", "profile not found: " + intent.ref));
    if (en && en.hc && sh && (en.hulls || []).map(String).indexOf(String(intent.ref)) < 0)
      out.push(issue("hull.unknown", "error", "hull", "hull " + intent.ref + " is not one this row offers", sh.pg));
    var sel = selectionOf(intent, ctx, catalog);
    var ol = sh && sh.ol || [];
    Object.keys(intent.options || {}).forEach(function(id) {
      if (optionIndex(sh, id, null) < 0)
        out.push(issue("option.unknown_id", "error", "options." + id, "option id not in profile " + intent.ref, sh ? sh.pg : null));
    });
    var seenGrp = {};
    ol.forEach(function(o, i) {
      if (optState(sel, i) !== "take") return;
      var path = "options." + o.id;
      if (o.dep != null && ol[o.dep] && optState(sel, o.dep) !== "take")
        out.push(issue(
          "option.dependency",
          "error",
          path,
          "'" + shortText(o.t) + "' needs '" + shortText(ol[o.dep].t) + "' taken first",
          sh.pg
        ));
      if (o.grp && !seenGrp[o.grp]) {
        var max = Math.max(1, o.gmax || 1);
        var taken = ol.filter(function(p, j) {
          return p.grp === o.grp && optState(sel, j) === "take";
        });
        if (taken.length > max) {
          seenGrp[o.grp] = 1;
          out.push(issue(
            "option.exclusive",
            "error",
            path,
            taken.length + " options taken where the profile allows " + max,
            sh.pg
          ));
        }
      }
      if (o.sw) ol.forEach(function(p, j) {
        if (j <= i || !p.sw || optState(sel, j) !== "take") return;
        if ((o.sw.f || []).some(function(f) {
          return (p.sw.f || []).indexOf(f) >= 0;
        }))
          out.push(issue(
            "option.swap_conflict",
            "error",
            path,
            "'" + shortText(o.t) + "' and '" + shortText(p.t) + "' replace the same weapon",
            sh.pg
          ));
      });
    });
    if (sh) {
      var hpIn = +sh.hp || 0;
      ol.forEach(function(p, j) {
        if (optState(sel, j) === "take" && p.mod && p.mod.hp) hpIn += p.mod.hp * optCount(sel, j);
      });
      ol.forEach(function(o, i) {
        if (optState(sel, i) === "take" && o.hpmin && hpIn < o.hpmin)
          out.push(issue(
            "option.hpmin",
            "error",
            "options." + o.id,
            "'" + shortText(o.t) + "' needs " + o.hpmin + " Hits; the ship has " + hpIn + " as configured",
            sh.pg
          ));
      });
    }
    if (sh && sh.modmax) {
      var modN = 0;
      ol.forEach(function(o, i) {
        if (o.mods && optState(sel, i) === "take") modN += optCount(sel, i);
      });
      if (modN > sh.modmax.n)
        out.push(issue(
          "option.modules",
          "error",
          "options",
          modN + " modules where the core takes " + sh.modmax.n,
          sh.modmax.pg
        ));
    }
    var seenUpGrp = {};
    var hostUpV = hostUpgradesAllowed(L, ctx && ctx.host ? ctx.host : null) ? ctx.host : null;
    var rowOf = function(id) {
      var p = splitUpgradeId(id);
      var a2 = p && L && p.list === L.nm ? findUpgradeEntry(L, p.section, p.label, sel.si, sel.ei) : null;
      if (a2) return { at: a2, en: L.secs[a2.si].ents[a2.ei] };
      var a3 = p && hostUpV && p.list === hostUpV.nm ? findUpgradeEntry(hostUpV, p.section, p.label, -1, -1) : null;
      return a3 ? { at: { si: HOST_OFF + a3.si, ei: a3.ei }, en: hostUpV.secs[a3.si].ents[a3.ei] } : null;
    };
    Object.keys(intent.upgrades || {}).forEach(function(id) {
      var st = intent.upgrades[id];
      var row = rowOf(id);
      if (!row) {
        out.push(issue("upgrade.unknown_id", "error", "upgrades." + id, "upgrade row not found or not attached to this unit"));
        return;
      }
      if (st === "off") return;
      var e2 = row.en;
      if (e2.req) return;
      if (st === "take" && !rowAttached(sel, row.at.si, e2)) {
        out.push(issue(
          "upgrade.unattached",
          "error",
          "upgrades." + id,
          "'" + e2.l + "' is aimed at other ships of the list, not this one",
          e2.src_page
        ));
        return;
      }
      if (coveredByShipOption(sel, e2))
        out.push(issue(
          "upgrade.covered",
          "warning",
          "upgrades." + id,
          "'" + e2.l + "' is one of the ship's own options; the list row is not counted",
          e2.src_page
        ));
      else if (!condOK(sel, e2, row.at.si, row.at.ei))
        out.push(issue(
          "upgrade.ineligible",
          "warning",
          "upgrades." + id,
          "'" + e2.l + "' is not available to this ship as configured; it is not counted",
          e2.src_page
        ));
      if (st === "take" && e2.grp && !seenUpGrp[e2.grp]) {
        var others = Object.keys(intent.upgrades).filter(function(id2) {
          if (id2 === id || intent.upgrades[id2] !== "take") return false;
          var r2 = rowOf(id2);
          return r2 && r2.en.grp === e2.grp;
        });
        if (others.length) {
          seenUpGrp[e2.grp] = 1;
          out.push(issue(
            "upgrade.exclusive",
            "error",
            "upgrades." + id,
            others.length + 1 + " upgrades taken from a group that allows one",
            e2.src_page
          ));
        }
      }
    });
    if (sel && sel.sh && L) {
      var bioKinds = {};
      Object.keys(intent.upgrades || {}).forEach(function(id) {
        if (intent.upgrades[id] !== "take") return;
        var row = rowOf(id);
        var secB = row ? secOf(sel, row.at.si) : null;
        if (!secB || String(secB.t).trim().toUpperCase() !== "BIO-ENHANCEMENTS") return;
        bioKinds[row.en.grp || row.en.l] = 1;
      });
      var nBio = Object.keys(bioKinds).length, tyB = String(sel.sh.ty || "");
      var capB = /escort/i.test(tyB) ? 1 : /battleship/i.test(tyB) ? 3 : 2;
      if (nBio > capB)
        out.push(issue(
          "upgrade.bio_limit",
          "error",
          "upgrades",
          nBio + " different bio-enhancements taken; a " + (capB === 3 ? "hive ship" : capB === 2 ? "cruiser" : "escort") + " may have at most " + capB,
          426
        ));
    }
    return out;
  }
  function transition(intent, action, ctx, catalog) {
    var it = JSON.parse(JSON.stringify(intent)), notices = [];
    it.options = it.options || {};
    it.upgrades = it.upgrades || {};
    var L = listOfIntent(it, ctx, catalog);
    var at0 = it.entry && L ? findEntry(L, it.entry.section, it.entry.label) : null;
    var sh = shipFor(it.ref, at0 ? L.secs[at0.si].ents[at0.ei] : null, catalog);
    var ol = sh && sh.ol || [];
    var note = function(code, path, message) {
      notices.push({ code, path, message });
    };
    var byId = function(id) {
      return ol.filter(function(o3) {
        return o3.id === id;
      })[0] || null;
    };
    var stateOf = function(o3) {
      var x = it.options[o3.id];
      return x && x.state ? x.state : "opt";
    };
    var setState = function(o3, st) {
      var x = it.options[o3.id] || { state: "opt", qty: 1 };
      x.state = st;
      it.options[o3.id] = x;
    };
    if (action.type === "option") {
      var o = byId(action.id);
      if (!o) {
        note("option.unknown_id", "options." + action.id, "unknown option");
        return { intent: it, notices };
      }
      var hpIn = function() {
        var h = +(sh && sh.hp) || 0;
        ol.forEach(function(p) {
          var x = it.options[p.id];
          if (x && x.state === "take" && p.mod && p.mod.hp) h += p.mod.hp * (p.qty ? Math.max(1, x.qty | 0) : 1);
        });
        return h;
      };
      if (action.state === "take" && stateOf(o) !== "take" && o.hpmin && hpIn() < o.hpmin) {
        note("option.blocked", "options." + o.id, "'" + shortText(o.t) + "' needs " + o.hpmin + " Hits; the ship has " + hpIn());
        return { intent: it, notices };
      }
      setState(o, action.state);
      ol.forEach(function(p) {
        if (p !== o && p.hpmin && stateOf(p) === "take" && hpIn() < p.hpmin) {
          setState(p, "opt");
          note("option.hpmin", "options." + p.id, "'" + shortText(p.t) + "' reopened: it needs " + p.hpmin + " Hits");
        }
      });
      if (action.state === "take") {
        if (o.grp) {
          var max = Math.max(1, o.gmax || 1);
          var others = ol.filter(function(p) {
            return p !== o && p.grp === o.grp && stateOf(p) === "take";
          });
          while (others.length >= max) {
            var q = others.shift();
            setState(q, "opt");
            note(
              "option.exclusive",
              "options." + q.id,
              "'" + shortText(q.t) + "' reopened: only " + max + " of this group can be taken"
            );
          }
        }
        if (o.sw) ol.forEach(function(p) {
          if (p === o || !p.sw || stateOf(p) !== "take") return;
          if ((o.sw.f || []).some(function(f) {
            return (p.sw.f || []).indexOf(f) >= 0;
          })) {
            setState(p, "opt");
            note(
              "option.swap_conflict",
              "options." + p.id,
              "'" + shortText(p.t) + "' reopened: it replaces the same weapon as '" + shortText(o.t) + "'"
            );
          }
        });
      }
      if (action.state === "take" && o.cov && L) {
        Object.keys(it.upgrades).forEach(function(id3) {
          if (it.upgrades[id3] !== "take") return;
          var q3 = splitUpgradeId(id3);
          var sel3 = selectionOf(it, ctx, catalog);
          var a4 = q3 && findUpgradeEntry(L, q3.section, q3.label, sel3.si, sel3.ei);
          var e4 = a4 && L.secs[a4.si].ents[a4.ei];
          if (!e4 || !e4.cond || !e4.cond.noup) return;
          if (coversExcludedRow(L, o, e4.cond.noup)) {
            it.upgrades[id3] = "off";
            note(
              "upgrade.conflict",
              "upgrades." + id3,
              "'" + e4.l + "' dropped: it may not be combined with '" + shortText(o.t) + "'"
            );
          }
        });
      }
      ol.forEach(function(p) {
        if (p.dep != null && ol[p.dep] && stateOf(p) === "take" && stateOf(ol[p.dep]) !== "take") {
          setState(p, "opt");
          note(
            "option.dependency",
            "options." + p.id,
            "'" + shortText(p.t) + "' reopened: it needs '" + shortText(ol[p.dep].t) + "'"
          );
        }
      });
    } else if (action.type === "quantity") {
      var o2 = byId(action.id);
      if (o2) {
        var x2 = it.options[o2.id] || { state: "opt", qty: 1 };
        var mx = o2.qty ? o2.qty.max || 1 : 1;
        x2.qty = Math.min(mx, Math.max(1, action.qty | 0));
        it.options[o2.id] = x2;
      }
    } else if (action.type === "upgrade") {
      var pre = splitUpgradeId(action.id);
      var selP = selectionOf(it, ctx, catalog);
      var atP = pre && L ? findUpgradeEntry(L, pre.section, pre.label, selP.si, selP.ei) : null;
      var eP = atP ? L.secs[atP.si].ents[atP.ei] : null;
      if (action.state === "take" && eP && !rowAttached(selP, atP.si, eP)) {
        note("upgrade.unattached", "upgrades." + action.id, "'" + eP.l + "' is not one of this ship's rows");
        return { intent: it, notices };
      }
      it.upgrades[action.id] = action.state;
      var sel0 = selectionOf(it, ctx, catalog);
      var p2 = splitUpgradeId(action.id);
      var at2 = p2 && L ? findUpgradeEntry(L, p2.section, p2.label, sel0.si, sel0.ei) : null;
      var e2 = at2 ? L.secs[at2.si].ents[at2.ei] : null;
      if (action.state === "take" && e2) {
        Object.keys(it.upgrades).forEach(function(id5) {
          if (id5 === action.id || it.upgrades[id5] !== "take") return;
          var q5 = splitUpgradeId(id5);
          var a5 = q5 && findUpgradeEntry(L, q5.section, q5.label, sel0.si, sel0.ei);
          var e5 = a5 && L.secs[a5.si].ents[a5.ei];
          if (!e5) return;
          var hit = e2.cond && e2.cond.noup && new RegExp(e2.cond.noup, "i").test(String(e5.l)) || e5.cond && e5.cond.noup && new RegExp(e5.cond.noup, "i").test(String(e2.l));
          if (!hit) return;
          if (e5.dflt) it.upgrades[id5] = "off";
          else delete it.upgrades[id5];
          note("upgrade.conflict", "upgrades." + id5, "'" + e5.l + "' dropped: " + (inclIn(e2, e5.l) ? "'" + e2.l + "' includes it for free" : "it may not be combined with '" + e2.l + "'"));
        });
      }
      if (action.state === "take" && e2) {
        ol.forEach(function(p) {
          if (stateOf(p) !== "take") return;
          if (p.cov && e2.cond && e2.cond.noup && coversExcludedRow(L, p, e2.cond.noup) || coveredRowExcludes(L, p, e2.l)) {
            setState(p, "opt");
            note("option.conflict", "options." + p.id, "'" + shortText(p.t) + "' reopened: " + (inclIn(e2, p.t, true) ? "'" + e2.l + "' includes it for free" : "it may not be combined with '" + e2.l + "'"));
          }
        });
      }
      if (action.state === "take" && e2 && e2.grp) {
        Object.keys(it.upgrades).forEach(function(id2) {
          if (id2 === action.id || it.upgrades[id2] !== "take") return;
          var q2 = splitUpgradeId(id2);
          var a3 = q2 && findUpgradeEntry(L, q2.section, q2.label, sel0.si, sel0.ei);
          var e3 = a3 && L.secs[a3.si].ents[a3.ei];
          if (e3 && e3.grp === e2.grp) {
            if (e3.dflt) it.upgrades[id2] = "off";
            else delete it.upgrades[id2];
            note("upgrade.exclusive", "upgrades." + id2, "'" + e3.l + "' dropped: one of this group at a time");
          }
        });
      }
    } else if (action.type === "hull") {
      if (catalog.ships[String(action.ref)]) {
        var had = Object.keys(it.options).length + Object.keys(it.upgrades).length;
        it.ref = String(action.ref);
        it.hull = String(action.ref);
        it.options = {};
        it.upgrades = {};
        if (had) note("hull.changed", "hull", "hull changed: options and upgrades start over");
      }
    }
    if (L && action.type !== "hull") {
      for (var pass = 0; pass < 20; pass++) {
        var sel1 = selectionOf(it, ctx, catalog), fell = 0;
        Object.keys(it.upgrades).forEach(function(id2) {
          if (it.upgrades[id2] === "off") return;
          var q2 = splitUpgradeId(id2);
          var a3 = q2 && findUpgradeEntry(L, q2.section, q2.label, sel1.si, sel1.ei);
          var e3 = a3 && L.secs[a3.si].ents[a3.ei];
          if (e3 && !e3.req && !condOK(sel1, e3, a3.si, a3.ei)) {
            if (e3.dflt) it.upgrades[id2] = "off";
            else delete it.upgrades[id2];
            fell++;
            note("upgrade.ineligible", "upgrades." + id2, "'" + e3.l + "' dropped: not available to this ship as configured");
          }
        });
        if (!fell) break;
      }
    }
    return { intent: it, notices };
  }
  function secTitleIs(L, i, want) {
    var sec = L.secs[i];
    return !!sec && String(sec.t).trim().toLowerCase() === String(want);
  }
  function secNameIssues(L, node, out) {
    var i, k, v, want;
    if (Object.prototype.toString.call(node) === "[object Array]") {
      for (i = 0; i < node.length; i++) secNameIssues(L, node[i], out);
      return out;
    }
    if (!node || typeof node !== "object") return out;
    for (k in node) {
      if (!Object.prototype.hasOwnProperty.call(node, k)) continue;
      v = node[k];
      if ((k === "sec" || k === "allow_sec" || k === "per_sec") && Object.prototype.toString.call(v) === "[object Array]" && node[k + "_sn"]) {
        for (i = 0; i < v.length; i++)
          if (!secTitleIs(L, v[i], node[k + "_sn"][i])) out.push(k + "[" + i + "]");
      } else if ((k === "sec" || k === "up_sec") && typeof v === "number") {
        want = k === "sec" ? node.sn : node.up_sn;
        if (want != null && !secTitleIs(L, v, want)) out.push(k);
      } else if (v && typeof v === "object" && k !== "sn" && k.slice(-3) !== "_sn") {
        secNameIssues(L, v, out);
      }
    }
    return out;
  }

  // packages/rules/src/unit.js
  function weaponState(row) {
    return row.box == null || row.box === "on" ? "active" : "offered";
  }
  function optionsOf(sel) {
    var sh = sel.sh, ol = sh && sh.ol || [];
    return ol.map(function(o, i) {
      var st = optState(sel, i);
      var blockedBy = [];
      if (st !== "take") {
        var max = Math.max(1, o.gmax || 1);
        var inGroup = o.grp ? ol.filter(function(p, j) {
          return j !== i && p.grp === o.grp && optState(sel, j) === "take";
        }) : [];
        if (o.grp && inGroup.length >= max) inGroup.forEach(function(p) {
          blockedBy.push(p.id);
        });
        if (o.sw) ol.forEach(function(p, j) {
          if (j === i || !p.sw || optState(sel, j) !== "take" || blockedBy.indexOf(p.id) >= 0) return;
          if ((o.sw.f || []).some(function(f) {
            return (p.sw.f || []).indexOf(f) >= 0;
          })) blockedBy.push(p.id);
        });
        if (o.sw && sel.list) {
          var names = (o.sw.t || []).map(function(t) {
            return String(t[0] || "");
          });
          var ups = upgradesFor(sel);
          ups.own.concat(ups.other).forEach(function(x) {
            var en2 = x[2];
            if (!en2.cond || !en2.cond.no || upState(sel, x[0], x[1]) !== "take") return;
            var rx = new RegExp(String(en2.cond.no).split("@")[0], "i");
            if (names.some(function(nm) {
              return rx.test(nm);
            }))
              blockedBy.push(upgradeId(listOfSec(sel, x[0]).nm, secOf(sel, x[0]).t, en2.l));
          });
          ups.own.concat(ups.other).forEach(function(x) {
            var en2 = x[2];
            if (!en2.swp || upState(sel, x[0], x[1]) !== "take") return;
            var rx2 = new RegExp(en2.swp.f, "i");
            if ((o.sw.f || []).some(function(fi) {
              return sh.aw[fi] && rx2.test(String(sh.aw[fi][0]));
            })) {
              var uid = upgradeId(listOfSec(sel, x[0]).nm, secOf(sel, x[0]).t, en2.l);
              if (blockedBy.indexOf(uid) < 0) blockedBy.push(uid);
            }
          });
        }
      }
      if (st !== "take" && sh) {
        var hpNow = +sh.hp || 0;
        ol.forEach(function(p, j) {
          if (optState(sel, j) === "take" && p.mod && p.mod.hp) hpNow += p.mod.hp * optCount(sel, j);
        });
        if (o.hpmin && hpNow < o.hpmin) ol.forEach(function(p, j) {
          if (optState(sel, j) === "take" && p.mod && p.mod.hp < 0 && blockedBy.indexOf(p.id) < 0) blockedBy.push(p.id);
        });
        if (o.mod && o.mod.hp < 0) ol.forEach(function(p, j) {
          if (optState(sel, j) === "take" && p.hpmin && hpNow + o.mod.hp < p.hpmin && blockedBy.indexOf(p.id) < 0) blockedBy.push(p.id);
        });
      }
      if (st !== "take" && o.cov && sel.list) {
        var ups3 = upgradesFor(sel);
        ups3.own.concat(ups3.other).forEach(function(x) {
          var en3 = x[2];
          if (!en3.cond || !en3.cond.noup || upState(sel, x[0], x[1]) !== "take") return;
          if (coversExcludedRow(sel.list, o, en3.cond.noup))
            blockedBy.push(upgradeId(listOfSec(sel, x[0]).nm, secOf(sel, x[0]).t, en3.l));
        });
      }
      if (st !== "take" && sel.list) {
        var ups4 = upgradesFor(sel);
        ups4.own.concat(ups4.other).forEach(function(x) {
          if (upState(sel, x[0], x[1]) !== "take") return;
          var uid4 = upgradeId(listOfSec(sel, x[0]).nm, secOf(sel, x[0]).t, x[2].l);
          if (blockedBy.indexOf(uid4) < 0 && coveredRowExcludes(sel.list, o, x[2].l)) blockedBy.push(uid4);
        });
      }
      var dep = o.dep != null && ol[o.dep] ? ol[o.dep].id : null;
      return {
        id: o.id,
        text: o.t,
        cost: o.c == null ? null : o.c,
        variable: !!o.var,
        state: st,
        qty: optCount(sel, i),
        max: o.qty ? o.qty.max || 1 : 1,
        group: o.grp || null,
        groupMax: o.grp ? Math.max(1, o.gmax || 1) : null,
        dependsOn: dep,
        dependencyMet: dep == null || optState(sel, o.dep) === "take",
        blockedBy,
        index: i,
        forbidden: !!(sel.en && sel.en.optno && new RegExp(sel.en.optno, "i").test(String(o.t || "")))
      };
    });
  }
  function coveredRowExcludes(list, o, label) {
    var hit = false;
    (list ? list.secs : []).forEach(function(sec) {
      (sec.ents || []).forEach(function(en) {
        if (!hit && isUpgradeEnt(en) && en.cond && en.cond.noup && new RegExp(en.cond.noup, "i").test(String(label || "")) && optionCoversRow(o, en)) hit = true;
      });
    });
    return hit;
  }
  function coversExcludedRow(list, o, noup) {
    var rx = new RegExp(String(noup), "i"), hit = false;
    (list ? list.secs : []).forEach(function(sec) {
      (sec.ents || []).forEach(function(en) {
        if (!hit && isUpgradeEnt(en) && rx.test(String(en.l || "")) && optionCoversRow(o, en)) hit = true;
      });
    });
    return hit;
  }
  function rerollText(included, bought, can, q) {
    var inc = included | 0, b = bought | 0;
    var unit = q && q.unit ? " " + q.unit : "", scope = q && q.scope ? ", " + q.scope : "";
    var rr = function(k) {
      return k + (k === 1 ? " re-roll" : " re-rolls") + unit;
    };
    if (inc && b) return rr(inc + b) + " (" + inc + " included + " + b + " bought)" + scope;
    if (inc) return rr(inc) + " included" + scope;
    if (b) return rr(b) + " bought (none included)" + scope;
    return can ? "no re-roll included" : "";
  }
  function openRerolls(rows) {
    var best = {};
    (rows || []).forEach(function(x) {
      if (x.state !== "opt" || !(x.rerolls > 0)) return;
      var g = x.group || x.id;
      best[g] = Math.max(best[g] || 0, x.rerolls);
    });
    return Object.keys(best).reduce(function(a, g) {
      return a + best[g];
    }, 0);
  }
  function rerollBoxes(included, bought, optional) {
    var out = [], i;
    for (i = 0; i < (included | 0); i++) out.push("included");
    for (i = 0; i < (bought | 0); i++) out.push("bought");
    for (i = 0; i < (optional | 0); i++) out.push("optional");
    return out;
  }
  function shipRerolls(sh, ups) {
    var rows = (ups || []).filter(function(x) {
      return x.rerolls > 0 && !x.fleetWide;
    });
    var inc = (sh.rr | 0) + rows.reduce(function(a, x) {
      return a + (x.state === "take" && x.included ? x.rerolls : 0);
    }, 0);
    var purchased = rows.filter(function(x) {
      return x.state === "take" && !x.included;
    }).map(function(x) {
      return { id: x.id, label: x.label, cost: x.cost, count: x.rerolls };
    });
    var b = purchased.reduce(function(a, x) {
      return a + x.count;
    }, 0);
    var ownRows = rows.filter(function(x) {
      return x.owner === "own";
    });
    var open = openRerolls(ownRows);
    if (!inc && !b && !open) return null;
    var q = { scope: "this ship's own" }, can = ownRows.length > 0;
    return {
      included: inc,
      purchased,
      total: inc + b,
      optional: open,
      boxes: rerollBoxes(inc, b, open),
      purchasable: can,
      scope: q.scope,
      unit: null,
      /* joins: with the fleet commander aboard they are his - "added to
         the commander's own re-rolls and can be used by the entire
         fleet" (Fortress-Monastery, Fleets p. 111; Ramilies p. 503) */
      joins: sh.rrj ? { page: sh.rrj } : null,
      text: rerollText(inc, b, can, inc || b ? q : null),
      head: rerollText(inc, b, can, null),
      base: rerollText(inc, 0, can, inc ? q : null)
    };
  }
  function commanderRerollOffer(list, si, ei) {
    var sec = list && list.secs[si], en = sec && sec.ents[ei];
    if (!en || en.k !== "cmd") return null;
    var can = list.secs.some(function(s2) {
      return s2.ents.some(function(u) {
        return isUpgradeEnt(u) && u.rr > 0 && (u.at || []).some(function(p) {
          return p[0] === si && p[1] === ei;
        });
      });
    });
    var inc = en.rr || 0;
    return {
      included: inc,
      purchasable: can,
      text: rerollText(inc, 0, can, en.rrq),
      /* head: the count alone, for a tag; scope: the limit, for the line under it */
      head: rerollText(inc, 0, can, en.rrq && en.rrq.unit ? { unit: en.rrq.unit } : null),
      scope: en.rrq && en.rrq.scope || null
    };
  }
  function fleetRerolls(list, units) {
    var f = list && list.frr;
    if (!f) return null;
    var per = (units || []).map(function(R) {
      var rows = (R && R.upgrades || []).filter(function(x) {
        return x.fleetWide && x.rerolls > 0;
      });
      return {
        took: rows.reduce(function(a, x) {
          return a + (x.state === "take" ? x.rerolls : 0);
        }, 0),
        open: openRerolls(rows),
        cap: R && R.entry && f.per && R.entry.section === f.per ? R.hulls || 1 : 0
      };
    });
    var bought, open;
    if (f.each) {
      bought = per.reduce(function(a, x) {
        return a + x.took;
      }, 0);
      open = Math.max(0, per.reduce(function(a, x) {
        return a + x.cap;
      }, 0) - bought);
      if (!per.some(function(x) {
        return x.open > 0;
      })) open = 0;
    } else {
      bought = per.reduce(function(a, x) {
        return Math.max(a, x.took);
      }, 0);
      open = bought ? 0 : per.reduce(function(a, x) {
        return Math.max(a, x.open);
      }, 0);
    }
    return {
      included: f.n,
      bought,
      total: f.n + bought,
      page: f.pg,
      source: f.src,
      how: f.how || f.src,
      optional: open,
      boxes: rerollBoxes(f.n, bought, open),
      section: f.sec,
      scope: f.scope || null,
      text: rerollText(f.n, bought, true, f.scope ? { scope: f.scope } : null)
    };
  }
  function upgradesOf(sel) {
    var ups = upgradesFor(sel), L = sel.list;
    var mk = function(owner) {
      return function(x) {
        var si = x[0], ei = x[1], en = x[2];
        return {
          id: upgradeId(listOfSec(sel, si).nm, secOf(sel, si).t, en.l),
          label: en.l,
          cost: upCost(sel, en),
          price: en.p == null ? null : en.p,
          per: en.per || null,
          state: upState(sel, si, ei),
          owner,
          required: !!en.req,
          /* incl: a Mark that comes with the ship, not a choice (build_data). */
          included: !!en.incl,
          group: en.grp || null,
          source: en.src_page || null,
          key: upgradeKey(si, ei),
          /* P1-8d: the card prints the book's own text for the row, the fleet
             view its note, and a per-bay price shows its multiplier. */
          /* The row's own book sentence (desc) wins: a section sentence can be
             owned by the wrong row (Tyranid "Increase to Ld 9" owned the weapon
             choice heading, Fleets p. 430). */
          /* A host row (si >= HOST_OFF): the sentence and the list name from its
             own list - the donor list's section at the moved index was empty, and
             the card sold an ability without its mechanics (spot check 20, seed 2026091443). */
          list: listOfSec(sel, si) ? listOfSec(sel, si).nm : L.nm,
          description: en.desc || ownedText(listOfSec(sel, si) || L, si >= HOST_OFF ? si - HOST_OFF : si, en.l) || "",
          note: en.nt || "",
          bays: en.per === "bay" ? bayStrength(sel.sh, sel) : null,
          ships: en.per === "bay" && sel.escort ? sel.hulls : 1,
          rerolls: en.rr || 0,
          /* fxg: bought once for the whole fleet, not for this ship (p. 404,
             486); frw: a fleet re-roll bought ship by ship (Tyranid Hive Mind
             Influence, p. 430) */
          fleetWide: !!(en.fxg || en.frw)
        };
      };
    };
    return ups.own.map(mk("own")).concat(ups.other.map(mk("other")));
  }
  var RULE_CARDS = {
    orbital_mine: {
      title: "Orbital mine",
      page: 512,
      each: "mine",
      lead: "Heavy ordnance that homes on the nearest enemy ship.",
      steps: [
        ["Deploy", "Set up as a high orbit defence, inside the gravity well of the planet or moon it guards (Fleets p. 498). From then on it is active until destroyed."],
        ["Ordnance phase", "Every Ordnance phase, move it 10 cm toward the nearest enemy ship."],
        ["Contact", "When it touches an enemy ship's base it detonates: roll 8 dice to hit that ship. The ship fires its turrets first as normal - if they hit the mine, roll 4 dice instead. Shields do not protect against it (FAQ 2026; Fleets p. 512 said they did)."],
        ["As ordnance", "It is an ordnance marker for movement, Blast Markers and being shot at. Only fighters interact with it: mine and fighters remove each other. Other ordnance ignores it, and friendly attack craft never attack it."],
        ["Victory points", "A mine bought on its own is worth its points to the enemy when destroyed, however it leaves play."]
      ],
      track: { kind: "each", label: "MINES - tick when gone" }
    },
    minefield: {
      title: "Minefield",
      page: 513,
      each: "minefield",
      lead: "An area that releases orbital mines at enemy ships that come near.",
      steps: [
        ["Set up", "Roll D3 x 5 cm for each of its two sides. Place it with one edge within 15 cm of a tabletop feature such as a planet, moon or asteroid field."],
        ["Terrain", "It blocks line of sight. To your ships it is an asteroid field in every way; an enemy ship may try to cross it on the same Leadership check. Torpedoes that touch it are destroyed. Attack craft do not set it off and may hide in it (destroyed on a 6)."],
        ["Your Ordnance phase", "Roll a D6 for each enemy ship within 30 cm of its edge: 5+ detects the ship. +1 if the ship is on All Ahead Full, -1 on Burn Retros, -1 if it is an escort, -1 if a Blast Marker touches the minefield."],
        ["Mines", "For each ship detected you may place one orbital mine touching the edge. It then acts as an orbital mine: 10 cm toward the nearest enemy ship each Ordnance phase, 8 dice on contact, 4 if turrets hit it (Fleets p. 512)."],
        ["Ships inside", "Enemy ships inside the field set off mines just the same and are attacked first; with several inside, you choose the order."],
        ["Suppression", "It is shot at like an ordnance marker, armour 6 (ordnance for target priority). Each hit puts a Blast Marker on it. Each End Phase it sheds D6 Blast Markers of its own."],
        ["Victory points", "Mines it releases are not worth victory points."]
      ],
      track: { kind: "size", label: "SIZE - roll D3 x 5 cm twice" }
    },
    fire_ship: {
      title: "Fire ship",
      page: 516,
      each: "fire ship",
      lead: "A hulk packed with plasma and explosives. It has no weapons: the ship is the weapon.",
      steps: [
        ["Move", "It moves and is shot at as an escort with the profile above. As a planetary defence it has no Leadership: it may Brace for Impact on Ld 7 and takes no other special order (Fleets p. 499)."],
        ["Detonate", "At any point in its Movement phase you may detonate it. Roll 3D6: every ship within that many cm suffers D3 Fire critical hits."],
        ["Blast", "Escorts in the blast are destroyed outright, as any escort that suffers a critical hit is; ordnance markers in it are removed too."],
        ["Afterwards", "Remove the fire ship and put a Blast Marker in its place."]
      ],
      track: { kind: "each", label: "FIRE SHIPS - tick when gone" }
    }
  };
  var MINE_TURRETS_6 = [[/^dark eldar$/, "Dark Eldar", 345], [/eldar/, "Eldar", 304]];
  function mineSteps(key, list) {
    if (key !== "orbital_mine" && key !== "minefield") return [];
    var out = [], race = String(list && list.race || "").toLowerCase();
    var e6 = MINE_TURRETS_6.filter(function(x) {
      return x[0].test(race);
    })[0];
    if (e6) out.push({ h: e6[1] + " mines", t: "Turrets hit " + (key === "minefield" ? "the mines it releases" : "this mine") + " only on a 6, like all " + e6[1] + " ordnance (Fleets p. " + e6[2] + ")." });
    out.push({ h: "Necron Shroud", t: "An uncrippled Necron Shroud never activates orbital mines (Fleets p. 407)." });
    return out;
  }
  function ruleCardOf(key, limit, list) {
    var c = key ? RULE_CARDS[key] : null;
    if (!c) return null;
    return {
      key,
      title: c.title,
      page: c.page,
      each: c.each,
      lead: c.lead,
      limit: limit == null ? null : limit,
      steps: c.steps.map(function(x) {
        return { h: x[0], t: x[1] };
      }).concat(mineSteps(key, list)),
      track: { kind: c.track.kind, label: c.track.label }
    };
  }
  function hasOrdnance(sh) {
    return (sh && sh.aw || []).some(function(a) {
      return /torpedo|launch bay|missile/i.test(String(a[0] || ""));
    });
  }
  function shipOrders(sh) {
    if (!sh || !sh.dor) return null;
    var ord = hasOrdnance(sh);
    return sh.dor.filter(function(o) {
      return o !== "RO" || ord;
    });
  }
  function shipLeadership(sh) {
    if (!sh || !sh.dld) return null;
    return sh.dld === 7 ? { kind: "fixed", value: 7, max: null, rolled: false, note: "no Ld roll", page: 499 } : { kind: "fixed", value: sh.dld, max: null, rolled: false, note: "base Ld", page: 111 };
  }
  function resolveUnit(intent, ctx, catalog) {
    var sel = selectionOf(intent, ctx, catalog);
    var sh = sel.sh, en = sel.en;
    if (!sh) {
      if (!en) return null;
      var kindE = en.k === "cmd" ? "commander" : "entry";
      var upsE = upgradesOf(sel);
      var bought = upsE.filter(function(x) {
        return x.state === "take" && x.rerolls > 0;
      }).map(function(x) {
        return { id: x.id, label: x.label, cost: x.cost, count: x.rerolls };
      });
      var incl = en.rr || 0;
      var boughtN = bought.reduce(function(a, x) {
        return a + x.count;
      }, 0);
      var canBuy = kindE === "commander" && upsE.some(function(x) {
        return x.owner === "own" && x.rerolls > 0;
      });
      var openN = kindE === "commander" ? openRerolls(upsE.filter(function(x) {
        return x.owner === "own";
      })) : 0;
      return {
        kind: kindE,
        className: en.l,
        mechanicus: false,
        /* card: which printed card this unit gets. A row with a rule card
           (orbital mine, minefield) prints one; any other hull-less row that is
           not a commander prints none. countable: bought N at a time. */
        card: kindE === "commander" ? "commander" : en.rc ? "rule" : null,
        ruleCard: ruleCardOf(en.rc, en.mx, sel.list),
        countable: !!en.cnt,
        defence: sel.defence ? { stationary: true, ground: false, ownPoints: false } : null,
        orders: null,
        /* A borrowed ship carries its role into the resolved unit too, so the
           card and the fleet view do not read the legacy unit directly. */
        role: roleOfIntent(intent),
        ref: null,
        name: String(intent.name || "").trim(),
        hulls: sel.hulls,
        entry: {
          list: sel.list.nm,
          section: sel.list.secs[sel.si].t,
          label: en.l,
          basePoints: en.p == null ? sel.custom : en.p,
          price: en.p == null ? null : en.p,
          openPrice: en.p == null && !en.hc,
          note: en.nt || "",
          badRef: !!en.badref,
          noopt: false
        },
        source: { page: en.src_page || null, faction: "" },
        members: [],
        note: intent.note || "",
        adjust: sel.adjust,
        custom: sel.custom,
        points: pointsOf(sel),
        maxPoints: maxPointsOf(sel),
        stats: null,
        weapons: [],
        damage: null,
        leadership: en.ld ? { kind: en.ld.kind, value: en.ld.value, max: en.ld.max == null ? null : en.ld.max } : null,
        rerolls: {
          included: incl,
          purchased: bought,
          total: incl + boughtN,
          /* optional: open re-roll rows, not in the points; boxes: one per re-roll by kind */
          optional: openN,
          boxes: kindE === "commander" ? rerollBoxes(incl, boughtN, openN) : [],
          purchasable: canBuy,
          scope: en.rrq && en.rrq.scope || null,
          unit: en.rrq && en.rrq.unit || null,
          text: kindE === "commander" ? rerollText(incl, boughtN, canBuy, en.rrq) : "",
          /* head: the same without the scope (the card's box); base: what
             the entry cost alone includes (the card's first row) */
          head: kindE === "commander" ? rerollText(incl, boughtN, canBuy, en.rrq && en.rrq.unit ? { unit: en.rrq.unit } : null) : "",
          base: kindE === "commander" ? rerollText(incl, 0, canBuy, en.rrq) : ""
        },
        rules: (kindE === "commander" ? commanderRules(sel.list, sel.si, en).concat(namedCommanderRules(en)).map(function(t) {
          return { t, ast: false };
        }) : []).concat(boughtDefs(sel, null, sel.list).map(function(dd) {
          return { t: dd.text, ast: false, canonical: true };
        })),
        hull: null,
        options: [],
        upgrades: upsE,
        issues: validateIntent(intent, ctx, catalog),
        warnings: []
      };
    }
    var hits = effHits(sel);
    var escort = sel.escort;
    var cm = criticalModel(sh);
    var ghost = takenUpgradeLabels(sel).some(function(l) {
      return /^ghostship/i.test(l);
    });
    var tanker = (sh.ol || []).some(function(o, i) {
      return optState(sel, i) === "take" && /^fuel tanker/i.test(String(o.t || ""));
    });
    var rows = weaponRows(sel).map(function(r) {
      r.state = weaponState(r);
      return r;
    });
    rows.forEach(function(r) {
      r.range = rangeCell(r.a[1]);
    });
    var rules = specialLines(sh, sel.list, sel);
    var starred = starredKeys(rules, sh, sel.list);
    rows.forEach(function(r) {
      r.stars = r.alt || r.swapped ? starsForRow(sh, rules, r.a, sel.list, sel.en) : (starred[r.i] || []).slice();
    });
    var opts = optionsOf(sel);
    opts.forEach(function(o, i) {
      o.stars = optStars(sh, sh.ol[i], rules, sel.list);
    });
    var upsS = upgradesOf(sel);
    if (sh.qd) rows.forEach(function(r) {
      r.zone = /all\s*round/i.test(String(r.a && r.a[3] || "")) ? "basilica" : "quadrant";
    });
    var hulk = isSpaceHulk(sh);
    if (hulk) rows.forEach(function(r) {
      if (r.box == null) r.loss = hulkLoss(r.a, isChaosHulk(sh));
    });
    if (!hulk) pairRows(rows);
    var trackN = function(key) {
      var v = key === "shields" ? parseInt(effShieldsText(sel), 10) : key === "turrets" ? parseInt(effTurrets(sel), 10) : 6;
      return isNaN(v) ? 4 : Math.max(1, Math.min(8, v));
    };
    return {
      kind: "ship",
      /* card: which printed card. rule = an instruction card (fire ship),
         fort = the quadrant plan plus the ordinary card, squadron = one-hit
         hulls bought N at a time, capital = everything else. */
      card: sh.rc ? "rule" : sh.qd ? "fort" : escort ? "squadron" : "capital",
      /* brief: the card prints the hull's own rules only, not the rules of its
         standard weapons (rules[].weapon) - the space hulks. */
      brief: hulk,
      ruleCard: ruleCardOf(sh.rc, en ? en.mx : null, sel.list),
      countable: false,
      defence: sel.defence || sh.qd ? {
        stationary: isStationaryDefence(sh),
        ground: /ground/i.test(String(sh.ty || "")),
        ownPoints: defenceOwnPoints(sh)
      } : null,
      leadership: shipLeadership(sh),
      orders: shipOrders(sh),
      className: sh.nm,
      mechanicus: isMechanicusVessel(sh, sel.list, sel.en),
      /* no gift when the Fleet Defence Turrets refit is taken "instead of
         rolling randomly on the Mechanicus Gifts table" (Fleets p. 50) */
      gifts: isMechanicusVessel(sh, sel.list, sel.en) && !/omnissiah.s victory/i.test(sh.nm || "") && !upsS.some(function(u) {
        return u.state === "take" && /^fleet defence turrets/i.test(String(u.label));
      }),
      ref: String(intent.ref),
      name: String(intent.name || "").trim(),
      hulls: sel.hulls,
      entry: en ? {
        list: sel.list.nm,
        section: sel.list.secs[sel.si].t,
        label: en.l,
        basePoints: en.hc ? hullPts(sel, en) : en.p == null ? sel.custom : en.p,
        price: en.p == null ? null : en.p,
        openPrice: en.p == null && !en.hc,
        note: en.nt || "",
        badRef: !!en.badref,
        noopt: !!en.noopt
      } : null,
      source: { page: sh.pg, faction: String(sh.fl || "") },
      role: roleOfIntent(intent),
      members: (intent.members || []).slice(),
      squadron: escort ? squadronLimits(sel) : null,
      note: intent.note || "",
      adjust: sel.adjust,
      custom: sel.custom,
      points: pointsOf(sel),
      maxPoints: maxPointsOf(sel),
      stats: {
        type: sh.ty,
        hits,
        speed: effSpeed(sel),
        turns: statSet(sel, "tn") || sh.tn,
        shields: effShieldsText(sel),
        armour: statSet(sel, "ar") || sh.ar,
        turrets: effTurrets(sel),
        turretLabel: sh.tl || "TURRETS",
        quadrant: !!sh.qd
      },
      weapons: rows,
      damage: {
        crippledAt: Math.ceil(hits / 2),
        /* Escorts are destroyed by one unsaved hit, never crippled; the card
           prints ESCORT_LINE for them, so the resolver says the same. */
        crippled: !isSpaceHulk(sh) && !escort,
        note: escort ? sh.sq ? DEFENCE_ONE_HIT_LINE : ESCORT_LINE : crippledLine(sh, rows),
        critTable: cm.title,
        critical: {
          title: cm.title,
          rows: cm.rows.map(function(r) {
            return r.slice();
          }),
          once: critOnce(cm),
          icons: cm.rows === CRIT ? JSON.parse(JSON.stringify(CRIT_ICONS)) : null,
          wide: cm.wide.slice(),
          foot: ghost ? String(cm.foot).replace("Critical on 4+", "Critical only on a 6 (Ghostship)") : cm.foot,
          groups: cm.groups ? cm.groups.map(function(g) {
            return { roll: g.roll, name: g.name, how: g.how, subs: g.subs.map(function(x) {
              return {
                roll: x.roll,
                text: x.text,
                on: x.on || null,
                both: !!x.both,
                track: x.track ? { key: x.track, n: trackN(x.track) } : null
              };
            }) };
          }) : null
        },
        /* Rulebook p. 66: "Escort ships which suffer a critical hit for any
           reason, such as during a boarding action, are automatically
           destroyed." ESCORT_LINE says so; an Eldar 4+ trigger would send the
           player to a table that is never rolled. */
        trigger: escort && !tanker ? null : ghost ? String(criticalTriggerLine(sh) || "").replace("on 4+", "only on a 6 (Ghostship)") : tanker ? "CRITICAL: a Hit that gets through the shields causes critical damage on 5+ (Fuel Tanker); roll 2D6." : criticalTriggerLine(sh),
        triggerHint: ghost ? String(criticalTriggerHint(sh) || "").replace("4+", "6 (Ghostship)") : tanker ? String(criticalTriggerHint(sh) || "").replace(": 6", ": 5+ (Fuel Tanker)") : criticalTriggerHint(sh),
        repair: repairLine(sh, sel.list, sel.en)
      },
      rules,
      hull: en && en.hc ? {
        chosen: String(intent.ref),
        choices: (en.hulls || []).map(String),
        options: hullOptionsOf(en, catalog)
      } : null,
      options: opts,
      upgrades: upsS,
      /* the ship's own re-rolls, null for nearly every ship */
      rerolls: shipRerolls(sh, upsS),
      /* victory points when they are not the cost (Demiurg, Fleets p. 486) */
      victory: victoryWorth(sh, en, ctx && ctx.host),
      issues: validateIntent(intent, ctx, catalog),
      warnings: []
    };
  }

  // packages/rules/src/crits.js
  var CRIT = [
    ["2", "DORSAL", ""],
    ["3", "STARBOARD", ""],
    ["4", "PORT", ""],
    ["5", "PROW", ""],
    ["6", "ENGINE +1", "NO TURNS"],
    ["7", "FIRE! +1/turn", ""],
    ["8", "THRUST +1", "SPEED -10"],
    ["9", "BRIDGE -3Ld*", ""],
    ["10", "SHIELDS 0*", ""]
  ];
  var CRIT_WIDE = ["11 Hull Breach +D3", "12 Bulkhead Collapse +D6"];
  var CRIT_FOOT = "* flagship also loses its remaining re-rolls; 9 and 10 cannot be repaired";
  function critOnce(cm) {
    if (cm.groups) return [];
    return cm.rows.filter(function(r) {
      return /\*\s*$/.test(String(r[1])) || /\*\s*$/.test(String(r[2]));
    }).map(function(r) {
      return r[0];
    });
  }
  var CRIT_ICONS = {
    "2": "dorsal",
    "3": "starboard",
    "4": "port",
    "5": "prow",
    "6": "engine",
    "7": "fire",
    "8": "thrusters",
    "9": "bridge",
    "10": "shields"
  };
  var RAMILIES_CRIT = [
    ["2-3", "LANCES", "OFF"],
    ["4", "MAIN ARMAMENT", "1/2"],
    ["5", "ORDNANCE BAYS", "OFF"],
    ["6", "REACTORS +1", "SHLD+TURRETS 1/2"],
    ["7", "FIRE! +1/turn", ""],
    ["8", "HULL BREACH +D3", ""],
    ["9", "COMMAND TOWER", "-2Ld*"],
    ["10", "SHIELDS", "0*"]
  ];
  var RAMILIES_CRIT_WIDE = [
    "11 Basilica Penetrated +D3: every quadrant D3, Basilica weapons lost",
    "12 Reactor Struck +D6: every quadrant +D6, roll again"
  ];
  var RAMILIES_CRIT_FOOT = "Per quadrant; * 9 and 10 cannot be repaired (Fleets pp. 111, 505).";
  var DEFENCE_CRIT = [
    ["2-3", "LANCES", "OFF"],
    ["4", "MAIN ARMAMENT", "OFF"],
    ["5", "ORDNANCE BAYS", "OFF"],
    ["6", "REACTORS +1", "SHLD+TURRETS 1/2"],
    ["7", "FIRE! +1/turn", ""],
    ["8-9", "ORBIT LOST +1", "FALLS D6 cm/turn"],
    ["10", "SHIELDS", "0*"]
  ];
  var DEFENCE_CRIT_WIDE = ["11 Hull Breach +D3", "12 Bulkhead Collapse +D6"];
  var DEFENCE_CRIT_FOOT = "A result it cannot suffer counts as the next highest. 8-9: falls D6 cm toward the planet in each of its Movement Phases until repaired; destroyed if it hits. * 10 cannot be repaired (Rulebook p. 101).";
  var HAVEN_CRIT = [
    ["2", "INFINITY CIRCUIT", "-1Ld"],
    ["3", "BATTERIES", "OFF"],
    ["4", "LANCES", "OFF"],
    ["5", "LAUNCH BAYS", "OFF"],
    ["6", "MAINSAIL", "WEAPONS 1/2"],
    ["7", "SUPERSTRUCTURE +1", "D6: 1 = +1 HIT"],
    ["8", "POLARIZATION FIELD", "OFF"],
    ["9", "CIRCUIT SMASHED +1", "-3Ld*"],
    ["10", "HOLOFIELDS", "LOST*"]
  ];
  var HAVEN_CRIT_WIDE = ["11 Hull Breach +D3", "12 Bulkhead Collapse +D6"];
  var HAVEN_CRIT_FOOT = "Critical on 5+. 7: roll a D6 at the start of each turn, on a 1 it takes one more Hit. 8: drifts 5 cm toward the nearest celestial phenomenon and no longer ignores Blast Markers and solar flares. 10 also ends the Netherfield. * 9 and 10 cannot be repaired (Fleets pp. 336-337).";
  var NECRON_CRIT = [
    ["2", "PORT POWER", "ARC + WHIP OFF"],
    ["3", "STBD POWER", "ARC + WHIP OFF"],
    ["4", "LIGHTNING ARC OFF", "ALL ARCS"],
    ["5", "POWER FLOW", "ARC + WHIP OFF"],
    ["6", "DRIVE", "NO TURNS; -1Ld"],
    ["7", "DRIVE", "SPEED -5; -1Ld"],
    ["8", "INERTIALESS", "NO AAF; -1Ld"],
    ["9", "SEPULCHRE", "OFF; -2Ld"],
    ["10", "COMMAND CORE", "-3Ld"]
  ];
  var NECRON_CRIT_WIDE = ["11 Power Surge +D3; -2Ld", "12 Ruptured Power Core +D6; -2Ld"];
  var NECRON_CRIT_FOOT = "Necron critical repairs succeed on 4+ (Fleets pg. 402).";
  var ORK_HULK_CRIT = [
    ["1-2", "HIGH ENERGY: D6 1-2", "-1 DORSAL LANCE"],
    ["1-2", "HIGH ENERGY: D6 3-4", "-1 SHIELD"],
    ["1-2", "HIGH ENERGY: D6 5-6", "-1 TURRET STR"],
    ["3-4", "WEAPONS, ARC HIT: D6 1-2", "-1 LAUNCH BAY (not prow/aft)"],
    ["3-4", "WEAPONS, ARC HIT: D6 3-4", "-1 TORPEDO STR (not aft)"],
    ["3-4", "WEAPONS, ARC HIT: D6 5-6", "-2 WEAPONS BATTERY FP"],
    ["5-6", "THRUSTERS", "to turn: D6 > thruster crits taken"]
  ];
  var ORK_HULK_CRIT_WIDE = [
    "Attacker rolls D6 (Fleets p. 391)",
    "Result that cannot apply: next higher result"
  ];
  var ORK_HULK_CRIT_FOOT = "Space hulks cannot repair any critical damage during a battle.";
  var CHAOS_HULK_CRIT = [
    ["1-2", "HIGH ENERGY: D6 1-2", "-1 PROW AND DORSAL LANCE"],
    ["1-2", "HIGH ENERGY: D6 3-4", "-1 SHIELD"],
    ["1-2", "HIGH ENERGY: D6 5-6", "-1 TURRET STR"],
    ["3-4", "WEAPONS, ARC HIT: D6 1-2", "-1 LAUNCH BAY (not prow/aft)"],
    ["3-4", "WEAPONS, ARC HIT: D6 3-4", "-1 TORPEDO STR (not aft)"],
    ["3-4", "WEAPONS, ARC HIT: D6 5-6", "-2 WEAPONS BATTERY FP"],
    ["5-6", "THRUSTERS", "to turn: D6 > thruster crits taken"]
  ];
  var CHAOS_HULK_CRIT_WIDE = [
    "Attacker rolls D6 (Fleets p. 288)",
    "Result that cannot apply: next higher result"
  ];
  var TYRANID_CRIT = [
    ["2", "SPORE CYSTS", "OFF"],
    ["3", "STARBOARD", "OFF"],
    ["4", "PORT", "OFF"],
    ["5", "PROW", "OFF"],
    ["6", "THORAX +1", "OFF"],
    ["7", "HEAVY WOUND", "+1/turn until fixed"],
    ["8", "VENTS +1", "NO TURNS"],
    ["9", "SYNAPSE", "NO HIVE OVERRIDE"],
    ["10", "SPORES OFF*", "PERMANENT"]
  ];
  var TYRANID_CRIT_WIDE = ["11 Severe Wound +D3", "12 Massive Haemorrhage +D6; bio-plasma splash"];
  var TYRANID_CRIT_FOOT = "* result 10 cannot be repaired; result 12 is a Strength 1 bio-plasma attack on another target within 2D6 cm, holofields do not protect";
  var ELDAR_CRIT = [
    ["2", "INFINITY CIRCUIT", "-1Ld"],
    ["3", "KEEL", "OFF"],
    ["4", "PROW", "OFF"],
    ["5", "MAST LINES", "MAX TURN 90"],
    ["6", "MAINSAIL", "ALL SPEEDS -5"],
    ["7", "SUPERSTRUCTURE +1", "TURN >45: 1 = +1"],
    ["8", "MAINSAIL", "NO 2ND MOVE"],
    ["9", "INFINITY CIRCUIT +1", "-3Ld*"],
    ["10", "HOLOFIELDS", "OFF*"]
  ];
  var ELDAR_CRIT_WIDE = ["11 Hull Breach +D3", "12 Bulkhead Collapse +D6"];
  var ELDAR_CRIT_FOOT = "Critical on 4+; * results 9 and 10 cannot be repaired (Fleets p. 305).";
  var DARK_ELDAR_CRIT = [
    ["2", "WEAPON SYSTEMS", "ALL OFF"],
    ["3", "PROW MAIN", "OFF"],
    ["4", "MANOEUVRING", "TEST FOR CTNH"],
    ["5", "BATTERIES", "OFF"],
    ["6", "TURNING FINS", "MAX TURN 45"],
    ["7", "ENGINES", "SPEED -10"],
    ["8", "SUPERSTRUCTURE +1", "SO: 1 = +1"],
    ["9", "COMMANDERS", "-1Ld*"],
    ["10", "SHADOWFIELDS", "OFF*"]
  ];
  var DARK_ELDAR_CRIT_WIDE = ["11 Hull Breach +D3", "12 Bulkhead Collapse +D6"];
  var DARK_ELDAR_CRIT_FOOT = "* results 9 and 10 cannot be repaired (Fleets p. 344).";
  function foreignReserveRow(list, en, sh) {
    if (!list || !en || !sh || !/^CHAOS/i.test(String(sh.fl || "")) || /^chaos/i.test(String(list.race || ""))) return false;
    var sec = null;
    (list.secs || []).forEach(function(s2) {
      if (!sec && (s2.ents || []).indexOf(en) >= 0) sec = s2;
    });
    return !!sec && sec.ct === "reserve";
  }
  function isMechanicusVessel(sh, list, en) {
    if (en && en.mech) return !/escort/i.test(sh.ty || "") && !sh.df;
    if (/^DEMIURG$/i.test(String(sh.fl || ""))) return false;
    return !!list && /Mechanicus/i.test(list.nm) && !/escort/i.test(sh.ty || "") && !sh.df && !foreignReserveRow(list, en, sh);
  }
  var CRIP_LINE = "CRIPPLED: Speed -5 cm; weapons, ordnance, shields and turrets 1/2.";
  var REPAIR_LINE = "REPAIR: End Phase, D6 / remaining Hit; 6 = 1 crit; blast contact 1/2 dice.";
  var CRIT_LINE = "A hit that gets through the shields: D6, a 6 rolls 2D6 on this table.";
  var ESCORT_LINE = "ESCORT: one unsaved Hit destroys the ship; a Critical Hit destroys the escort outright.";
  var DEFENCE_ONE_HIT_LINE = "DEFENCE: one unsaved Hit destroys it; tick one box per defence lost.";
  function isSpaceHulk(sh) {
    return /\bhulk\b/i.test(String(sh.nm || ""));
  }
  function isHaven(sh) {
    return !!sh && /^HAVEN\b/i.test(String(sh.nm || ""));
  }
  function defenceOwnPoints(sh) {
    return !!sh && (!!sh.qd || isHaven(sh));
  }
  function isStationaryDefence(sh) {
    return !!sh && (!!sh.qd || !!sh.df && !/escort/i.test(String(sh.ty || "")));
  }
  function squadronLimits(sel) {
    var L = sel.list, lo = null, hi = null, lone = null, src = "";
    var label = String(sel.en && sel.en.l || "");
    if (L) L.secs.forEach(function(sec, secIdx) {
      (sec.rules || []).forEach(function(r) {
        if (r.kind !== "squadron") return;
        var covers = r.pick ? r.pick.some(function(p) {
          return p.sec === sel.si && (!p.re || new RegExp(p.re, "i").test(label));
        }) : (r.sec || [secIdx]).indexOf(sel.si) >= 0;
        if (!covers) return;
        lo = lo == null ? r.min : Math.max(lo, r.min);
        hi = hi == null ? r.max : Math.min(hi, r.max);
        lone = lone == null ? !!r.lone : lone && !!r.lone;
        if (!src) src = String(r.src || "");
      });
    });
    if (lo == null && sel.sh && sel.sh.df) {
      var cap = sel.en && sel.en.mx != null ? Math.min(6, sel.en.mx) : 6;
      return { min: 1, max: cap, lone: false, src: "", cardOnly: true };
    }
    if (lo == null) return { min: 2, max: 6, lone: true, src: "Fleets p. 13" };
    return { min: lo, max: hi, lone: !!lone, src };
  }
  function rowPurchase(list, si, en, sh) {
    if (sh && (sh.sq || /escort/i.test(sh.ty || ""))) {
      var q = squadronLimits({ list, si, en, sh });
      return { kind: q.cardOnly ? "group" : "squadron", min: q.min, max: q.max };
    }
    if (!sh && en && en.cnt) return { kind: "count", max: en.mx == null ? null : en.mx };
    return { kind: "single" };
  }
  function rowStep(buy, units, dir) {
    var last = units.length ? units[units.length - 1] : null;
    if (!buy || buy.kind === "single")
      return dir > 0 ? { act: "open" } : last ? { act: "remove", unit: last } : null;
    var min = Math.max(1, buy.min || 1), max = buy.max == null ? Infinity : buy.max;
    if (dir > 0) return last && (last.n || 1) < max ? { act: "grow", unit: last } : { act: "open" };
    if (!last) return null;
    return (last.n || 1) > min ? { act: "shrink", unit: last } : { act: "remove", unit: last };
  }
  function crippledLine(sh, rows) {
    const ctx = String(sh.fl || "") + " " + String(sh.nm || "");
    if (sh.qd)
      return "PER QUADRANT: hits, shields and turrets above are one quarter's. The fort has four; damage, criticals and boarding are resolved against the quadrant hit, and each is crippled on its own. (Fleets p. 501)";
    if (isSpaceHulk(sh))
      return "NOT CRIPPLED: a hulk is eroded hit by hit, never crippled. At 0 Damage roll on the Catastrophic Damage table: Plasma Drive Overload = no damage to others, it becomes an asteroid field D3\xD75 cm; Warp Drive Implosion = replace with a Warp rift. (Fleets p. " + hulkPage(sh) + ")";
    if (/TYRANID/i.test(ctx))
      return "CRIPPLED: Speed -5 cm; Bio-plasma and Pyro-acid 1/2; Spores unchanged; no Torpedoes, Attack Craft, Claws or Tentacles.";
    if (/NECRON/i.test(ctx))
      return "CRIPPLED: Speed -5 cm; weapons and Turrets 1/2; Star Pulse off; Portals 1/2 (round down).";
    if (isHaven(sh))
      return "CRIPPLED: weapons and ordnance 1/2; Holofields unchanged.";
    if (/^ELDAR\b/i.test(String(sh.fl || "")))
      return "CRIPPLED: all Speed values -5 cm; weapons and ordnance 1/2; Holofields unchanged.";
    if (/DARK ELDAR/i.test(ctx))
      return "CRIPPLED: Speed -5 cm; weapons and ordnance 1/2; Shadowfields unchanged.";
    if (isRockVessel(sh) || isCaravan(sh))
      return "CRIPPLED: Speed unchanged; weapons, ordnance, shields and turrets 1/2.";
    if (/^\s*0\s*(cm)?\s*$/.test(String(sh.sp || "")))
      return "CRIPPLED: weapons, ordnance, shields and turrets 1/2.";
    const nova = rows ? rows.some(function(r) {
      return weaponState(r) === "active" && /nova cannon/i.test(String(r.a && r.a[0] || ""));
    }) : (sh.aw || []).some((a) => /nova cannon/i.test(a[0]));
    return CRIP_LINE + (nova ? " No Nova Cannon." : "");
  }
  function isOrkHulk(sh) {
    return isSpaceHulk(sh) && /\bORK\b/i.test(String(sh.nm || ""));
  }
  function isChaosHulk(sh) {
    return isSpaceHulk(sh) && /\bCHAOS\b/i.test(String(sh.nm || ""));
  }
  function hulkPage(sh) {
    return isChaosHulk(sh) ? 288 : 391;
  }
  function hulkCritGroups(chaos) {
    return [
      { roll: "1-2", name: "HIGH ENERGY SYSTEMS", how: "roll a D6", subs: [
        { roll: "1-2", text: chaos ? "-1 PROW AND DORSAL LANCE" : "-1 DORSAL LANCE", on: "lance", both: !!chaos },
        { roll: "3-4", text: "-1 SHIELD", track: "shields" },
        { roll: "5-6", text: "-1 TURRET STR", track: "turrets" }
      ] },
      { roll: "3-4", name: "WEAPONS CLUSTERS", how: "roll a D6 - only the arc that was hit", subs: [
        { roll: "1-2", text: "-1 LAUNCH BAY (not prow/aft)", on: "bay" },
        { roll: "3-4", text: "-1 TORPEDO STR (not aft)", on: "torp" },
        { roll: "5-6", text: "-2 WEAPONS BATTERY FP", on: "wb" }
      ] },
      { roll: "5-6", name: "THRUSTERS", how: "every one counts", subs: [
        { roll: "", text: "TO TURN: ROLL A D6 HIGHER THAN THE BOXES TICKED", track: "thrusters" }
      ] }
    ];
  }
  function hulkLoss(a, chaos) {
    var nm = String(a && a[0] || ""), st = String(a && a[2] || "").trim();
    var key = /lance/i.test(nm) ? (chaos ? /prow|dorsal/i : /dorsal/i).test(nm) ? "lance" : null : /launch bay/i.test(nm) ? "bay" : /torpedo/i.test(nm) ? "torp" : /batter|gunz/i.test(nm) ? "wb" : null;
    if (!key) return null;
    var per = key === "wb" ? 2 : 1;
    var num = /^\d+(\s|$)/.test(st) ? parseInt(st, 10) : null;
    return { key, per, n: num == null ? 4 : Math.max(1, Math.min(4, Math.ceil(num / per))) };
  }
  function criticalModel(sh) {
    const ctx = String(sh.fl || "") + " " + String(sh.nm || "");
    if (sh.qd) return {
      title: "STAR FORT CRITICAL DAMAGE (2D6)",
      rows: RAMILIES_CRIT,
      wide: RAMILIES_CRIT_WIDE,
      foot: RAMILIES_CRIT_FOOT
    };
    if (isChaosHulk(sh)) return {
      title: "CHAOS SPACE HULK CRITICAL HITS (D6)",
      rows: CHAOS_HULK_CRIT,
      wide: CHAOS_HULK_CRIT_WIDE,
      foot: ORK_HULK_CRIT_FOOT,
      groups: hulkCritGroups(true)
    };
    if (isOrkHulk(sh)) return {
      title: "ORK HULK CRITICAL HITS (D6)",
      rows: ORK_HULK_CRIT,
      wide: ORK_HULK_CRIT_WIDE,
      foot: ORK_HULK_CRIT_FOOT,
      groups: hulkCritGroups(false)
    };
    if (isHaven(sh)) return {
      title: "HAVEN CRITICAL HITS (2D6)",
      rows: HAVEN_CRIT,
      wide: HAVEN_CRIT_WIDE,
      foot: HAVEN_CRIT_FOOT
    };
    if (sh.df && isStationaryDefence(sh) && (sh.hp | 0) > 1 && !isHaven(sh) && !isRockVessel(sh)) return {
      title: "DEFENCES CRITICAL HITS (2D6)",
      rows: DEFENCE_CRIT,
      wide: DEFENCE_CRIT_WIDE,
      foot: DEFENCE_CRIT_FOOT
    };
    if (/TYRANID/i.test(ctx)) return {
      title: "TYRANID CRITICAL DAMAGE (2D6)",
      rows: TYRANID_CRIT,
      wide: TYRANID_CRIT_WIDE,
      foot: TYRANID_CRIT_FOOT
    };
    if (/NECRON/i.test(ctx)) return {
      title: "NECRON CRITICAL DAMAGE (2D6)",
      rows: NECRON_CRIT,
      wide: NECRON_CRIT_WIDE,
      foot: NECRON_CRIT_FOOT
    };
    if (/^ELDAR\b/i.test(String(sh.fl || ""))) return {
      title: "ELDAR CRITICAL DAMAGE (2D6)",
      rows: ELDAR_CRIT,
      wide: ELDAR_CRIT_WIDE,
      foot: ELDAR_CRIT_FOOT
    };
    if (/DARK ELDAR/i.test(ctx)) return {
      title: "DARK ELDAR CRITICAL DAMAGE (2D6)",
      rows: DARK_ELDAR_CRIT,
      wide: DARK_ELDAR_CRIT_WIDE,
      foot: DARK_ELDAR_CRIT_FOOT
    };
    if (isRockVessel(sh)) return {
      title: "CRITICAL DAMAGE",
      rows: [["2-12", "NO CRITICAL", "+1 Hp"]],
      wide: ["no critical table", "at 0 Hp: 4 Blast Markers"],
      foot: "Takes no critical damage: each critical hit inflicts +1 point of damage. At 0 Damage it breaks up into 4 Blast Markers - no Catastrophic Damage roll (Fleets p. " + rockPage(sh) + ")."
    };
    if (isCaravan(sh)) return {
      title: "CRITICAL DAMAGE",
      rows: [["2-12", "NO CRITICAL", "1 EXTRA Hp"]],
      wide: ["Rig and Dhows are one vessel", "at 0 Hp: four Blast Markers"],
      foot: "Takes no critical damage: each critical is 1 extra Hp of damage instead (Fleets p. 492)."
    };
    if (/^defence/i.test(String(sh.ty || "")) && (sh.hp | 0) > 1) return {
      title: "DEFENCES CRITICAL HITS (2D6)",
      rows: DEFENCE_CRIT,
      wide: DEFENCE_CRIT_WIDE,
      foot: DEFENCE_CRIT_FOOT
    };
    return { title: "CRITICAL DAMAGE (2D6)", rows: CRIT, wide: CRIT_WIDE, foot: CRIT_FOOT };
  }
  function isCaravan(sh) {
    return /^\s*CARAVAN\s*$/i.test(String(sh.nm || ""));
  }
  function isRockVessel(sh) {
    return /^\s*ROK\s*$|WARSPHERE|STRYXIS CARAVAN/i.test(String(sh && sh.nm || ""));
  }
  function rockPage(sh) {
    var n = String(sh && sh.nm || "");
    return /WARSPHERE/i.test(n) ? 495 : /STRYXIS/i.test(n) ? 197 : 393;
  }
  function repairLine(sh, list, en) {
    const ctx = String(sh.fl || "") + " " + String(sh.nm || "");
    if (/escort/i.test(String(sh.ty || ""))) return "";
    if (sh.sq) return "";
    if (isRockVessel(sh)) return "";
    if (isOrkHulk(sh) || isChaosHulk(sh))
      return "NO REPAIR: a space hulk cannot repair critical damage during a battle (Fleets p. " + hulkPage(sh) + ").";
    if (/NECRON/i.test(ctx))
      return "REPAIR: End Phase, D6 / remaining Hit; 4+ = 1 crit; blast contact 1/2 dice.";
    if (isMechanicusVessel(sh, list, en)) return "ALL ADMECH: REPAIR +1D6.";
    return REPAIR_LINE;
  }
  function criticalTriggerLine(sh) {
    if (isHaven(sh))
      return "CRITICAL: Every Hit causes critical damage on 5+; roll 2D6 on the Haven table.";
    if (/^ELDAR\b/i.test(String(sh.fl || "")))
      return "CRITICAL: Every Hit causes critical damage on 4+; roll 2D6 on the Eldar table.";
    if (/DARK ELDAR/i.test(String(sh.fl || "") + " " + String(sh.nm || "")))
      return "CRITICAL: Every Hit causes critical damage on 6; roll 2D6 on the Dark Eldar table.";
    return null;
  }
  function criticalTriggerHint(sh) {
    const ctx = String(sh.fl || "") + " " + String(sh.nm || "");
    if (isCaravan(sh)) return "through shields: 6 &rarr; 1 extra Hp, no critical";
    if (isOrkHulk(sh) || isChaosHulk(sh)) return "through shields: 6 &rarr; attacker rolls D6";
    if (isHaven(sh)) return "every Hit: 5+ &rarr; 2D6";
    if (/^ELDAR\b/i.test(String(sh.fl || ""))) return "every Hit: 4+ &rarr; 2D6";
    if (/DARK ELDAR/i.test(ctx)) return "every Hit: 6 &rarr; 2D6";
    return "through shields: 6 &rarr; 2D6";
  }

  // packages/rules/src/upgrades.js
  function isUpgradeEnt(en) {
    return !!(en && en.k === "up");
  }
  function upgradeKey(si, ei) {
    return si + ":" + ei;
  }
  var HOST_OFF = 1e3;
  function hostUpgradesAllowed(donor, host) {
    if (!donor || !host || donor === host) return false;
    return !!(donor.race && host.race && donor.race === host.race);
  }
  function upSecs(sel) {
    if (!sel.list) return [];
    if (!sel.host) return sel.list.secs;
    var a = sel.list.secs.slice();
    sel.host.secs.forEach(function(sec, i) {
      a[HOST_OFF + i] = sec;
    });
    return a;
  }
  function secOf(sel, si) {
    if (si >= HOST_OFF) return sel.host ? sel.host.secs[si - HOST_OFF] : null;
    return sel.list ? sel.list.secs[si] : null;
  }
  function listOfSec(sel, si) {
    return si >= HOST_OFF ? sel.host : sel.list;
  }
  function hostTypeRow(sel, si, en) {
    if (!sel.host || !sel.list || si < HOST_OFF || !en || !en.at || !en.at.length) return false;
    var ds = sel.list.secs[sel.si];
    if (!ds || ds.ct !== "type") return false;
    var tsi = en.at[0][0];
    if (!en.at.every(function(p) {
      return p[0] === tsi;
    })) return false;
    var ts = sel.host.secs[tsi];
    var key = function(s) {
      return String(s.t || "").trim().toLowerCase();
    };
    if (!ts || ts.ct !== "type" || key(ts) !== key(ds)) return false;
    var every = ts.ents.every(function(e2, j) {
      return isUpgradeEnt(e2) || e2.r == null || en.at.some(function(p) {
        return p[1] === j;
      });
    });
    if (!every) return false;
    return !sel.list.secs.some(function(s2) {
      return s2.ents.some(function(e2) {
        return isUpgradeEnt(e2) && e2.l === en.l;
      });
    });
  }
  function hostRowShadowed(sel, en) {
    if (!sel.list || !en) return false;
    var lab = String(en.l || ""), grp = en.grp || null, hit = false;
    sel.list.secs.forEach(function(sec) {
      sec.ents.forEach(function(e2) {
        if (hit || !isUpgradeEnt(e2) || e2.at) return;
        if (String(e2.l || "") === lab) hit = true;
        else if (grp && e2.grp === grp) hit = true;
      });
    });
    return hit;
  }
  function selectionOf(intent, ctx, catalog) {
    var L = listOfIntent(intent, ctx, catalog);
    var at = intent.entry && L ? findEntry(L, intent.entry.section, intent.entry.label) : null;
    var en = at ? L.secs[at.si].ents[at.ei] : null;
    var sh = shipFor(intent.ref, en, catalog);
    var ol = sh && sh.ol || [];
    var opts = intent.options || {};
    var dflt = en && en.noopt ? "off" : "opt";
    var optno = en && en.optno ? new RegExp(en.optno, "i") : null;
    var ost = ol.map(function(o) {
      if (optno && optno.test(String(o.t || ""))) return "off";
      var x = opts[o.id];
      return x && x.state ? x.state : dflt;
    });
    var oqty = ol.map(function(o) {
      var x = opts[o.id], q = x && x.qty > 1 ? +x.qty : 1;
      if (!o.qty) return 1;
      return Math.min(Math.max(q, 1), o.qty.max || 1);
    });
    var host = ctx && ctx.host ? ctx.host : null;
    var hostUp = hostUpgradesAllowed(L, host) ? host : null;
    var ups = {};
    Object.keys(intent.upgrades || {}).forEach(function(id) {
      var p = splitUpgradeId(id);
      if (!p || !L) return;
      var at2 = p.list === L.nm ? findUpgradeEntry(L, p.section, p.label, at ? at.si : -1, at ? at.ei : -1) : null;
      if (at2 && intent.upgrades[id]) {
        ups[upgradeKey(at2.si, at2.ei)] = intent.upgrades[id];
        return;
      }
      if (hostUp && p.list === hostUp.nm) {
        var at3 = findUpgradeEntry(hostUp, p.section, p.label, -1, -1);
        if (at3 && intent.upgrades[id])
          ups[upgradeKey(HOST_OFF + at3.si, at3.ei)] = intent.upgrades[id];
      }
    });
    var fleet = ctx ? ctx.host || ctx.list || null : null;
    return {
      list: L,
      host: hostUp,
      fleet,
      sh,
      en,
      si: at ? at.si : -1,
      ei: at ? at.ei : -1,
      ost,
      oqty,
      ups,
      hulls: intent.hulls > 0 ? intent.hulls : 1,
      custom: intent.custom == null ? null : intent.custom,
      adjust: intent.adjust ? +intent.adjust : 0,
      /* escort = the SHAPE of the unit: one-hit hulls bought N at a time on one
         card. The book type Escort, and the one-hit planetary defences that
         Rulebook p. 100 groups the same way ("1HP defences grouped in up to
         six units") - sh.sq, because their printed type is Defence or Ground.
         defence = the KIND: bought from the planetary defences list (Fleets
         p. 499), not from the fleet list. A row without a hull (orbital mine,
         minefield) is one by its section. */
      escort: !!(sh && (sh.sq || /escort/i.test(sh.ty || ""))),
      defence: !!(sh && sh.df || at && L.secs[at.si].ct === "defence")
    };
  }
  function optState(sel, i) {
    return sel.ost[i] || "opt";
  }
  function optCount(sel, i) {
    return sel.oqty[i] || 1;
  }
  var OFFERED = typeof WeakMap === "function" ? /* @__PURE__ */ new WeakMap() : null;
  var OFFERED_BUSY = false;
  function offeredUpKeys(sel) {
    var sig = JSON.stringify(sel.ups || {});
    var c = OFFERED ? OFFERED.get(sel) : null;
    if (c && c.sig === sig) return c.keys;
    var keys = {};
    OFFERED_BUSY = true;
    try {
      var u = upgradesFor(sel);
      u.own.concat(u.other).forEach(function(x) {
        keys[upgradeKey(x[0], x[1])] = 1;
      });
    } finally {
      OFFERED_BUSY = false;
    }
    if (OFFERED) OFFERED.set(sel, { sig, keys });
    return keys;
  }
  function grpTakenElsewhere(sel, si, ei, g) {
    var hit = false;
    upSecs(sel).forEach(function(sec, sj) {
      (sec.ents || []).forEach(function(e2, ej) {
        if (hit || !isUpgradeEnt(e2) || e2.grp !== g || sj === si && ej === ei) return;
        var k2 = upgradeKey(sj, ej);
        if (sel.ups[k2] === "take" || e2.req && sel.si === sj || e2.dflt && sel.si === sj && !Object.prototype.hasOwnProperty.call(sel.ups, k2)) hit = true;
      });
    });
    return hit;
  }
  function upState(sel, si, ei) {
    var sec = secOf(sel, si);
    var en = sec && sec.ents[ei];
    if (si >= HOST_OFF && (!en || en.at && !hostTypeRow(sel, si, en) || en.req || hostRowShadowed(sel, en))) return "off";
    if (en && en.req && sel.si === si) return "take";
    var k = upgradeKey(si, ei);
    if (en && en.dflt && sel.si === si && !Object.prototype.hasOwnProperty.call(sel.ups, k)) return "take";
    if (sel.ups[k] === "take") return "take";
    if (en && en.off0 && !Object.prototype.hasOwnProperty.call(sel.ups, k)) return "off";
    if (en && en.grp && grpTakenElsewhere(sel, si, ei, en.grp)) return "off";
    if (sel.ups[k]) return sel.ups[k];
    if (OFFERED_BUSY || !sel.list) return "off";
    return offeredUpKeys(sel)[k] ? "opt" : "off";
  }
  function bayStrength(sh, sel) {
    var n = 0, exact = true;
    var owner = {};
    if (sel) (sh && sh.ol || []).forEach(function(o, i) {
      (o.aws || []).forEach(function(r) {
        (owner[r] = owner[r] || []).push(i);
      });
    });
    (sh && sh.aw || []).forEach(function(a, ai) {
      if (!/launch bay/i.test(a[0])) return;
      var times = 1;
      if (sel && owner[ai]) {
        times = owner[ai].filter(function(oi) {
          return optState(sel, oi) === "take";
        }).length;
        if (!times) return;
      }
      var n0 = n;
      var txt = String(a[2] || "");
      var dice = txt.match(/D(\d+)\s*\+\s*(\d+)/i);
      if (dice) {
        n += +dice[1] + +dice[2];
        return;
      }
      var nums = (txt.match(/\d+/g) || []).map(Number);
      if (!nums.length) {
        exact = false;
        return;
      }
      if (/\bport\b/i.test(a[0]) && /\bstarboard\b/i.test(a[0]))
        n += nums.reduce(function(x, y) {
          return x + y;
        }, 0);
      else {
        var sq = txt.match(/(\d+)\s*squadrons?\b/i);
        if (sq) n += +sq[1];
        else {
          n += Math.max.apply(null, nums);
          if (nums.length > 1) exact = false;
        }
      }
      n = n0 + (n - n0) * times;
    });
    return { n, exact };
  }
  function prowArmour(sh) {
    var t = String(sh && sh.ar || "");
    var m = t.match(/(\d)\+\s*(?:front|prow)/i) || t.match(/(\d)\+/);
    return m ? +m[1] : 0;
  }
  function upTokens(t) {
    return String(t || "").toLowerCase().replace(/[^a-z0-9 ]/g, " ").split(/\s+/).filter(function(w) {
      return w.length > 2;
    });
  }
  function coveredByShipOption(sel, en) {
    var sh = sel.sh;
    if (!sh || en.p == null) return false;
    var want = upTokens(en.l);
    if (!want.length) return false;
    return (sh.ol || []).some(function(o) {
      return optionCoversRow(o, en);
    });
  }
  function optionCoversRow(o, en) {
    if (o.cov && new RegExp(o.cov, "i").test(String(en.l || ""))) return o.c === en.p;
    var want = upTokens(en.l);
    if (!want.length) return false;
    if (!want.every(function(w) {
      return upTokens(o.t).indexOf(w) >= 0;
    })) return false;
    return en.per ? true : o.c === en.p;
  }
  function upgradeTakenAnyWay(sel, si, ei) {
    if (upState(sel, si, ei) === "take") return true;
    var sh = sel.sh, sec0 = secOf(sel, si), en = sec0 && sec0.ents[ei];
    if (!sh || !en || en.p == null) return false;
    var want = upTokens(en.l);
    if (!want.length) return false;
    return (sh.ol || []).some(function(o, i) {
      return optionCoversRow(o, en) && optState(sel, i) === "take";
    });
  }
  function condOK(sel, en, si, ei) {
    var c = en && en.cond;
    if (!c) return true;
    var sh = sel.sh;
    if (!sh) return false;
    if (c.nohost && si != null && si >= HOST_OFF) return false;
    if (c.mech != null || c.nomech != null) {
      var isMech = isMechanicusVessel(sh, sel.list, sel.en);
      if (c.mech && !isMech) return false;
      if (c.nomech && isMech) return false;
    }
    var esc = /escort/i.test(sh.ty || "");
    if (c.cap && esc) return false;
    if (c.esc && !esc) return false;
    if (c.ty && !new RegExp(c.ty, "i").test(sh.ty || "") && !(c.qd && sh.qd)) return false;
    var nmT = (sh.nm || "") + (sh.ven ? " / VENERABLE BATTLE BARGE" : "");
    if (c.nm && !new RegExp(c.nm, "i").test(nmT)) return false;
    if (c.nmno && new RegExp(c.nmno, "i").test(nmT)) return false;
    if (c.fl && !new RegExp(c.fl, "i").test(sh.fl || "")) return false;
    if (c.flno && new RegExp(c.flno, "i").test(sh.fl || "")) return false;
    if (c.prow && prowArmour({ ar: statSet(sel, "ar") || sh.ar }) < +c.prow) return false;
    var skip = si == null ? null : upgradeKey(si, ei);
    var all = weaponRows(sel, skip);
    var takeable = function(oi) {
      var o = sh.ol && sh.ol[oi];
      if (!o) return false;
      if (optState(sel, oi) === "take") return true;
      if (o.dep != null && optState(sel, o.dep) !== "take") return false;
      if (o.grp) {
        var max = Math.max(1, o.gmax || 1);
        var n = sh.ol.filter(function(p, j) {
          return j !== oi && p.grp === o.grp && optState(sel, j) === "take";
        }).length;
        if (n >= max) return false;
      }
      return true;
    };
    var inForce = all.filter(function(r) {
      return r.box == null || r.box === "on";
    });
    var maybe = all.filter(function(r) {
      return r.box === "open" && !r.alt && r.own && r.own.some(takeable);
    });
    var rowHit = function(pat, list) {
      var p = String(pat).split("@");
      var rx = new RegExp(p[0], "i");
      return list.some(function(r) {
        var a = r.a;
        return rx.test(a[0]) && (p.length < 2 || String(a[1]).indexOf(p[1]) >= 0);
      });
    };
    if (c.has) {
      var own = weaponRows(sel, skip, true).filter(function(r) {
        return r.box == null || r.box === "on";
      });
      if (!(Array.isArray(c.has) ? c.has : [c.has]).every(function(p) {
        return rowHit(p, own);
      })) return false;
    }
    if (c.tsmin != null || c.tsmax != null) {
      var ts = 0, torps = false;
      inForce.forEach(function(r) {
        if (!/torpedo|launcha/i.test(r.a[0]) || /bomb|boarding/i.test(r.a[0])) return;
        torps = true;
        var tm = String(r.a[2]).match(/\d+/);
        if (tm) ts = Math.max(ts, +tm[0]);
      });
      if (!torps) return false;
      if (c.tsmin != null && ts < +c.tsmin) return false;
      if (c.tsmax != null && ts > +c.tsmax) return false;
    }
    if (c.no && rowHit(c.no, inForce.concat(maybe))) return false;
    if (c.noopt && (sh.ol || []).some(function(o) {
      return new RegExp(c.noopt, "i").test(o.t);
    }))
      return false;
    if (c.offopt && (sh.ol || []).some(function(o, i) {
      return (sel.ost || [])[i] === "take" && new RegExp(c.offopt, "i").test(o.t);
    }))
      return false;
    if (c.up || c.noup) {
      var taken = takenUpgradeLabels(sel, si, ei);
      if (c.up && !taken.some(function(l) {
        return new RegExp(c.up, "i").test(l);
      })) return false;
      if (c.noup && taken.some(function(l) {
        return new RegExp(c.noup, "i").test(l);
      })) return false;
    }
    return true;
  }
  function rowAttached(sel, si, en) {
    if (!en || !en.at) return true;
    if (si >= HOST_OFF) return hostTypeRow(sel, si, en);
    return en.at.some(function(p) {
      return p[0] === sel.si && p[1] === sel.ei;
    });
  }
  function takenUpgradeLabels(sel, si, ei) {
    var out = [];
    if (!sel.list) return out;
    var sh = sel.sh;
    upSecs(sel).forEach(function(sec, sj) {
      sec.ents.forEach(function(en, ej) {
        if (!isUpgradeEnt(en) || sj === si && ej === ei) return;
        if (!rowAttached(sel, sj, en)) return;
        if (upState(sel, sj, ej) === "take") out.push(String(en.l || ""));
        else if (sh && (sh.ol || []).some(function(o, i) {
          return o.cov && optionCoversRow(o, en) && optState(sel, i) === "take";
        }))
          out.push(String(en.l || ""));
      });
    });
    return out;
  }
  var UPFOR = typeof WeakMap === "function" ? /* @__PURE__ */ new WeakMap() : null;
  function upgradesFor(sel) {
    var sig = UPFOR ? JSON.stringify([sel.ups || {}, sel.ost || {}, sel.oqty || {}, OFFERED_BUSY]) : "";
    var hit = UPFOR ? UPFOR.get(sel) : null;
    if (hit && hit.sig === sig) return hit.res;
    var res = upgradesForRaw(sel);
    if (UPFOR) UPFOR.set(sel, { sig, res });
    return res;
  }
  function upgradesForRaw(sel) {
    var own = [], other = [];
    if (!sel.list) return { own, other };
    var fortRows = !!sel.defence;
    if (fortRows && !(sel.sh && sel.sh.qd)) return { own, other };
    var foreign = foreignReserveRow(sel.list, sel.en, sel.sh);
    upSecs(sel).forEach(function(sec, si) {
      sec.ents.forEach(function(en, ei) {
        if (!isUpgradeEnt(en)) return;
        if (fortRows && !(en.cond && en.cond.qd)) return;
        var hostType = si >= HOST_OFF && hostTypeRow(sel, si, en);
        if (si >= HOST_OFF && (en.at && !hostType || en.req || hostRowShadowed(sel, en))) return;
        if (foreign && si < HOST_OFF) return;
        if (coveredByShipOption(sel, en)) return;
        if (!condOK(sel, en, si, ei)) return;
        var at = en.at;
        if (en.req) {
          if (!at || at.some(function(p) {
            return p[0] === sel.si && p[1] === sel.ei;
          })) own.push([si, ei, en]);
          return;
        }
        if (hostType) {
          own.push([si, ei, en]);
          return;
        }
        if (!at) {
          other.push([si, ei, en]);
          return;
        }
        if (at.some(function(p) {
          return p[0] === sel.si && p[1] === sel.ei;
        })) own.push([si, ei, en]);
      });
    });
    return { own, other };
  }
  function requiredUpgradeKeys(sel) {
    var keys = [];
    if (!sel.list || sel.defence || foreignReserveRow(sel.list, sel.en, sel.sh)) return keys;
    var ups = {};
    Object.keys(sel.ups).forEach(function(k) {
      ups[k] = sel.ups[k];
    });
    var cur = Object.assign({}, sel, { ups });
    sel.list.secs.forEach(function(sec, si) {
      sec.ents.forEach(function(en, ei) {
        if (!isUpgradeEnt(en) || !en.req) return;
        var mine = en.at ? en.at.some(function(p) {
          return p[0] === sel.si && p[1] === sel.ei;
        }) : condOK(cur, en, si, ei);
        if (!mine) return;
        var k = upgradeKey(si, ei);
        ups[k] = "take";
        keys.push(k);
      });
    });
    return keys;
  }
  function defaultUpgradeKeys(sel) {
    var keys = [];
    if (!sel.list || sel.defence) return keys;
    var ups = {};
    Object.keys(sel.ups).forEach(function(k) {
      ups[k] = sel.ups[k];
    });
    var cur = Object.assign({}, sel, { ups });
    sel.list.secs.forEach(function(sec, si) {
      sec.ents.forEach(function(en, ei) {
        if (!isUpgradeEnt(en) || !en.dflt) return;
        var mine = en.at ? en.at.some(function(p) {
          return p[0] === sel.si && p[1] === sel.ei;
        }) : condOK(cur, en, si, ei);
        if (!mine) return;
        var k = upgradeKey(si, ei);
        ups[k] = "take";
        keys.push(k);
      });
    });
    return keys;
  }

  // packages/rules/src/legacy.js
  var SCHEMA_VERSION = 4;
  var SEP = "\u0001";
  var TEXT_KEY_LEN = 40;
  function normOptText(t) {
    return String(t == null ? "" : t).toLowerCase().replace(/[^a-z0-9]/g, "");
  }
  function textKey(t) {
    return String(t == null ? "" : t).slice(0, TEXT_KEY_LEN);
  }
  function optionIndex(sh, id, text) {
    var ol = sh && sh.ol || [];
    var i, hit = -1, hits = 0;
    for (i = 0; i < ol.length; i++) if (id != null && ol[i].id === id) return i;
    if (text) {
      for (i = 0; i < ol.length; i++) if (textKey(ol[i].t) === text) {
        hit = i;
        hits++;
      }
    }
    return hits === 1 ? hit : -1;
  }
  function upgradeId(listName, secTitle, label) {
    return String(listName) + SEP + String(secTitle) + SEP + String(label);
  }
  function splitUpgradeId(id) {
    var p = String(id).split(SEP);
    return p.length === 3 ? { list: p[0], section: p[1], label: p[2] } : null;
  }
  function splitMembers(s) {
    if (Array.isArray(s)) return s.slice();
    return String(s == null ? "" : s).split(/[,\/]/).map(function(x) {
      return x.trim();
    }).filter(Boolean);
  }
  function joinMembers(a) {
    return (a || []).join(", ");
  }
  function refKey(ref) {
    return ref == null ? null : String(ref);
  }
  var VEN_VIEWS = typeof WeakMap === "function" ? /* @__PURE__ */ new WeakMap() : null;
  function venerableView(sh) {
    if (!sh || /SPACE MARINES/i.test(String(sh.fl || ""))) return sh;
    if (VEN_VIEWS && VEN_VIEWS.get(sh)) return VEN_VIEWS.get(sh);
    var v = JSON.parse(JSON.stringify(sh));
    v.ven = 1;
    v.fl0 = sh.fl;
    v.fl = "SPACE MARINES";
    var bays = false;
    v.aw = (sh.aw || []).map(function(a) {
      if (!/launch bay/i.test(a[0])) return a.slice();
      bays = true;
      var st = String(a[2]).replace(/\d+/, function(m) {
        return String(Math.ceil(+m / 2));
      });
      if (/^1\b/.test(st)) st = st.replace(/\bsquadrons\b/i, "squadron");
      return [a[0], "Thunderhawk: 20 cm", st, a[3]];
    });
    var prow = -1;
    v.aw.forEach(function(a, i) {
      if (prow < 0 && /^prow\b/i.test(a[0]) && !/torpedo/i.test(a[0])) prow = i;
    });
    v.ol = prow < 0 ? [] : [{
      id: "venerable_prow_torpedoes",
      c: 0,
      var: 0,
      t: "Venerable refit: may replace the prow weapon with strength-6 torpedo tubes (speed 30 cm) for no change in cost (Fleets p. 102).",
      sw: { f: [prow], t: [["Prow torpedoes", "30 cm", "6", "Front"]] }
    }];
    v.sr = [
      String(sh.sr || "").trim(),
      "\u2022 Venerable battle barge: an ancient, revered vessel with a Space Marine crew. It may not take the refits or upgrades of its own profile and is used exactly as is. Worth 100% Victory Points if crippled and 150% if destroyed. (Fleets p. 102)",
      bays ? "\u2022 Its launch bays carry Thunderhawks only, at half the printed capacity, rounding up. (Fleets p. 102)" : ""
    ].filter(Boolean).join(" ");
    if (VEN_VIEWS) VEN_VIEWS.set(sh, v);
    return v;
  }
  function shipFor(ref, en, catalog) {
    var sh = ref == null ? null : catalog.ships[refKey(ref)];
    return sh && en && en.hc ? venerableView(sh) : sh;
  }
  function legacyRef(ref) {
    return ref == null ? null : isNaN(+ref) ? String(ref) : +ref;
  }
  function findEntry(list, section, label) {
    if (!list) return null;
    var si, ei, sec;
    for (si = 0; si < list.secs.length; si++) {
      sec = list.secs[si];
      if (sec.t !== section) continue;
      for (ei = 0; ei < sec.ents.length; ei++) if (sec.ents[ei].l === label) return { si, ei };
    }
    for (si = 0; si < list.secs.length; si++) {
      sec = list.secs[si];
      for (ei = 0; ei < sec.ents.length; ei++) if (sec.ents[ei].l === label) return { si, ei };
    }
    return null;
  }
  function findUpgradeEntry(list, section, label, si, ei) {
    if (!list) return null;
    var cands = [], s2, e2, sec, en;
    for (s2 = 0; s2 < list.secs.length; s2++) {
      sec = list.secs[s2];
      if (sec.t !== section) continue;
      for (e2 = 0; e2 < sec.ents.length; e2++)
        if (sec.ents[e2].l === label && isUpgradeEnt(sec.ents[e2])) cands.push({ si: s2, ei: e2 });
    }
    if (!cands.length) {
      for (s2 = 0; s2 < list.secs.length; s2++) {
        sec = list.secs[s2];
        for (e2 = 0; e2 < sec.ents.length; e2++)
          if (sec.ents[e2].l === label && isUpgradeEnt(sec.ents[e2])) cands.push({ si: s2, ei: e2 });
      }
    }
    if (cands.length === 1) return cands[0];
    if (!cands.length) return null;
    var attached = cands.filter(function(c) {
      en = list.secs[c.si].ents[c.ei];
      return en.at && en.at.some(function(p) {
        return p[0] === si && p[1] === ei;
      });
    });
    if (attached.length) return attached[0];
    var free = cands.filter(function(c) {
      return !list.secs[c.si].ents[c.ei].at;
    });
    return free.length ? free[0] : null;
  }
  function fromLegacyUnit(u, ctx, catalog) {
    var L = u.lst && listByName(catalog, u.lst) || (ctx && ctx.list ? ctx.list : null);
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
    if (u.uid) intent.uid = String(u.uid);
    if (u.aboard) intent.aboard = String(u.aboard);
    if (u.sq) intent.sq = String(u.sq);
    if (u.cmd) intent.cmd = String(u.cmd);
    if (u.clan) intent.clan = String(u.clan);
    var ol = sh && sh.ol || [];
    ol.forEach(function(o, i) {
      var st = u.os && u.os[i] || null;
      if (!st && (u.opts || []).indexOf(i) >= 0) st = "take";
      var q = u.oq && u.oq[i] > 1 ? +u.oq[i] : 1;
      if (st || q > 1) intent.options[o.id] = { state: st || "opt", qty: q };
    });
    var hostUp = hostUpgradesAllowed(L, ctx && ctx.host ? ctx.host : null) ? ctx.host : null;
    Object.keys(u.ups || {}).forEach(function(k) {
      var p = k.split(":"), si = +p[0];
      var Lx = si >= HOST_OFF ? hostUp : L;
      var s2 = Lx && Lx.secs[si >= HOST_OFF ? si - HOST_OFF : si];
      var e2 = s2 && s2.ents[+p[1]];
      if (e2 && u.ups[k]) intent.upgrades[upgradeId(Lx.nm, s2.t, e2.l)] = u.ups[k];
    });
    return intent;
  }
  function toLegacyUnit(intent, ctx, catalog) {
    var issues = [];
    var L = listOfIntent(intent, ctx, catalog);
    var at = intent.entry && L ? findEntry(L, intent.entry.section, intent.entry.label) : null;
    if (intent.entry && !at)
      issues.push({
        code: "entry.unknown",
        severity: "error",
        path: "entry",
        message: "list row not found: " + intent.entry.label,
        sourcePage: null
      });
    var sh = shipFor(intent.ref, at ? L.secs[at.si].ents[at.ei] : null, catalog);
    if (intent.ref != null && !sh)
      issues.push({
        code: "ship.unknown",
        severity: "error",
        path: "ref",
        message: "profile not found: " + intent.ref,
        sourcePage: null
      });
    var u = {
      s: at ? at.si : -1,
      e: at ? at.ei : -1,
      ref: legacyRef(intent.ref),
      n: intent.hulls > 0 ? intent.hulls : 1,
      name: intent.name || "",
      opts: [],
      os: {},
      oq: {},
      ups: {},
      upn: {}
    };
    if (L && ctx && ctx.list && L !== ctx.list) u.lst = L.nm;
    if (roleOfIntent(intent) !== "core") u.role = roleOfIntent(intent);
    if (intent.note) u.note = intent.note;
    if (intent.adjust) u.adj = intent.adjust;
    if (intent.custom != null) u.custom = intent.custom;
    if (intent.members && intent.members.length) u.members = joinMembers(intent.members);
    if (intent.hull != null && sh) u.hn = sh.nm;
    if (intent.uid) u.uid = String(intent.uid);
    if (intent.aboard) u.aboard = String(intent.aboard);
    if (intent.sq) u.sq = String(intent.sq);
    if (intent.cmd) u.cmd = String(intent.cmd);
    if (intent.clan) u.clan = String(intent.clan);
    Object.keys(intent.options || {}).forEach(function(id) {
      var o = intent.options[id];
      var i = optionIndex(sh, id, null);
      if (i < 0) {
        issues.push({
          code: "option.unknown_id",
          severity: "error",
          path: "options." + id,
          message: "option id not in profile " + intent.ref,
          sourcePage: sh ? sh.pg : null
        });
        return;
      }
      if (o.state) u.os[i] = o.state;
      if (o.qty > 1) u.oq[i] = o.qty;
    });
    u.opts = Object.keys(u.os).filter(function(i) {
      return u.os[i] === "take";
    }).map(function(i) {
      return +i;
    }).sort(function(a, b) {
      return a - b;
    });
    var hostUp = hostUpgradesAllowed(L, ctx && ctx.host ? ctx.host : null) ? ctx.host : null;
    Object.keys(intent.upgrades || {}).forEach(function(id) {
      var p = splitUpgradeId(id);
      var at2 = p && L && p.list === L.nm ? findUpgradeEntry(L, p.section, p.label, u.s, u.e) : null;
      if (at2) {
        u.ups[at2.si + ":" + at2.ei] = intent.upgrades[id];
        u.upn[L.secs[at2.si].t + SEP + p.label] = intent.upgrades[id];
        return;
      }
      var at3 = p && hostUp && p.list === hostUp.nm ? findUpgradeEntry(hostUp, p.section, p.label, -1, -1) : null;
      if (at3) {
        u.ups[HOST_OFF + at3.si + ":" + at3.ei] = intent.upgrades[id];
        u.upn[hostUp.nm + SEP + hostUp.secs[at3.si].t + SEP + p.label] = intent.upgrades[id];
        return;
      }
      issues.push({
        code: "upgrade.unknown_id",
        severity: "error",
        path: "upgrades." + id,
        message: "upgrade row not found or not attached to this unit",
        sourcePage: null
      });
    });
    return { unit: u, issues };
  }
  function deepFreeze(o) {
    if (o && typeof o === "object" && !Object.isFrozen(o)) {
      Object.freeze(o);
      Object.keys(o).forEach(function(k) {
        deepFreeze(o[k]);
      });
    }
    return o;
  }

  // packages/rules/src/fleet-purchases.js
  function checkWarmasterMark(F) {
    var L = F.L, members = F.members, out = F.out;
    if (L.mark_paid) {
      var MP = L.mark_paid;
      var markRe = new RegExp("^the mark of " + MP.god, "i");
      var wm = members.filter(function(m) {
        return m.en && m.en.k === "cmd" && /warmaster/i.test(String(m.en.l || ""));
      });
      if (wm.length) {
        var shipRe = new RegExp(MP.ship, "i");
        var aboard = members.filter(function(m) {
          return m.unitRow && m.en && shipRe.test(String(m.en.l || ""));
        });
        var paid = false;
        if (aboard.length) {
          if (MP.dearest) {
            var top = members.reduce(function(a2, m) {
              return m.unitRow && !m.defence && m.points > a2 ? m.points : a2;
            }, -1);
            paid = aboard.some(function(m) {
              return m.points >= top;
            }) && members.filter(function(m) {
              return m.unitRow && !m.defence && m.points === top;
            }).length === 1;
          } else {
            var pkRe = new RegExp(MP.unless, "i");
            paid = !members.some(function(m) {
              return m.unitRow && m.en && pkRe.test(String(m.en.l || ""));
            });
          }
        }
        wm.forEach(function(m) {
          var ups;
          try {
            ups = upgradesFor(m.sel);
          } catch (e) {
            return;
          }
          var row = ups.own.concat(ups.other).filter(function(x) {
            return x[2] && markRe.test(String(x[2].l || ""));
          })[0];
          if (!row) return;
          var upSt = upState(m.sel, row[0], row[1]), took = upSt === "take";
          if (paid && took)
            out.push({
              ok: false,
              t: "Mark of " + MP.god + " paid twice",
              v: "already in the ship's cost",
              s: MP.src_ship
            });
          else if (paid && upSt === "opt")
            out.push({
              ok: true,
              warn: true,
              t: "Mark of " + MP.god + " is in the ship's cost",
              v: "set the Warmaster's Mark row to Hide",
              s: MP.src_ship
            });
          else if (!paid && !took)
            out.push({
              ok: false,
              t: "Warmaster without the Mark of " + MP.god,
              v: "the list requires it",
              s: "The Warmaster must take the Mark of " + MP.god + "."
            });
        });
      }
    }
  }
  function checkUnitIssues(F) {
    var members = F.members, out = F.out;
    members.forEach(function(m) {
      var errs = (m.R && m.R.issues || []).filter(function(x) {
        return x.severity === "error";
      });
      if (errs.length)
        out.push({
          ok: false,
          t: "Unit issues: " + m.R.className.toLowerCase().replace(/(^|[\s(\-\u2013/])([a-z])/g, function(a, b, c) {
            return b + c.toUpperCase();
          }),
          v: errs.length + " problem" + (errs.length > 1 ? "s" : ""),
          s: errs.map(function(x) {
            return x.message;
          }).join("; ")
        });
    });
  }
  function checkCommanderPrice(F) {
    var L = F.L, members = F.members, out = F.out;
    if (L.aboard) {
      var AB = L.aboard;
      var abCmd = members.filter(function(m) {
        return m.own && m.en && m.en.k === "cmd" && new RegExp(AB.cmd_re, "i").test(String(m.en.l));
      })[0];
      if (abCmd) {
        var abShip = members.some(function(m) {
          return m.unitRow && m.en && new RegExp(AB.ship_re, "i").test(String(m.en.l));
        });
        var abTook = (abCmd.R && abCmd.R.upgrades || []).some(function(u) {
          return u.state === "take" && new RegExp(AB.up_re, "i").test(String(u.label));
        });
        if (abShip || abTook)
          out.push({
            ok: abShip || !abTook,
            warn: abShip && !abTook,
            t: abCmd.en.l + " aboard the Flame of Asuryan",
            v: !abShip ? "the Flame of Asuryan is not in the fleet" : abTook ? "125 pts" : "125 pts if the row is ticked",
            s: AB.src + " (Fleets p. " + AB.pg + ")"
          });
      }
    }
  }
  function checkDefences(F) {
    var lim = F.lim, members = F.members, out = F.out;
    var defs = members.filter(function(m) {
      return m.defence;
    });
    if (defs.length) {
      var budget = defs.reduce(function(a, m) {
        return a + (defenceOwnPoints(m.sel.sh) ? 0 : m.points);
      }, 0);
      var third = Math.floor(lim / 3);
      if (budget > 0 || defs.some(function(m) {
        return !defenceOwnPoints(m.sel.sh);
      }))
        out.push({
          ok: true,
          warn: budget > third,
          t: "Planetary defences (up to one third of the points)",
          v: budget + " / " + third + " pts",
          s: "When desired, the defender in a scenario may spend up to one-third of his allocated point value on planetary defences, in addition to any planetary defences provided by the specific scenario. (Rulebook p. 100)"
        });
      defs.forEach(function(m) {
        var n1 = m.sel.sh && m.sel.sh.need1;
        if (!n1) return;
        var took = (m.R && m.R.options || []).filter(function(o) {
          return o.group === n1.grp && o.state === "take";
        }).length;
        if (took === 0)
          out.push({
            ok: false,
            t: m.en.l + " (choose one " + n1.what + ")",
            v: "none chosen",
            s: n1.src + " (Fleets p. " + n1.pg + ")"
          });
      });
      if (defs.some(function(m) {
        return m.sel.sh && m.sel.sh.qd;
      }))
        out.push({
          ok: true,
          warn: true,
          t: "Ramilies class star fort",
          v: "by prior agreement",
          s: "Bought from the fleet's points, rather than defences, and in competitive play only by prior agreement with the opponent. (Fleets p. 500)"
        });
    }
  }
  function checkRequiredWeapons(F) {
    var members = F.members, out = F.out;
    members.forEach(function(m) {
      var nd = m.sel && m.sel.sh && m.sel.sh.need;
      if (!nd || !m.unitRow) return;
      nd.forEach(function(n) {
        var took = (m.R && m.R.options || []).filter(function(o) {
          return o.group === n.grp && o.state === "take";
        }).length;
        if (!took) out.push({
          ok: false,
          t: (m.en ? m.en.l : "?") + ": choose " + n.what,
          v: "none chosen",
          s: n.src + " (Fleets p. " + n.pg + ")"
        });
      });
    });
  }
  function checkOptionShares(F) {
    var members = F.members, out = F.out;
    var fracs = {};
    members.forEach(function(m) {
      var fr = m.sel && m.sel.sh && m.sel.sh.frac;
      if (!fr) return;
      var g = fracs[fr.what] = fracs[fr.what] || { fr, all: 0, took: 0 };
      g.all += m.hulls;
      var rx = new RegExp(fr.opt, "i");
      if ((m.R && m.R.options || []).some(function(o) {
        return o.state === "take" && rx.test(String(o.text || ""));
      }))
        g.took += m.hulls;
    });
    Object.keys(fracs).forEach(function(k) {
      var g = fracs[k], cap = Math.floor(g.all * g.fr.pct / 100);
      if (g.took) out.push({
        ok: g.took <= cap,
        t: g.fr.label,
        v: g.took + " / " + cap + " of " + g.all,
        s: g.fr.src + " (Fleets p. " + g.fr.pg + ")"
      });
    });
  }
  function checkWebway(F) {
    var L = F.L, members = F.members, out = F.out;
    if (L.webway) {
      var WW = L.webway, wwRe = new RegExp(WW.up, "i"), hvRe = new RegExp(WW.haven, "i");
      var wwN = members.filter(function(m) {
        return (m.R && m.R.upgrades || []).some(function(u) {
          return u.state === "take" && wwRe.test(String(u.label));
        });
      }).length;
      if (wwN) {
        var hv = members.some(function(m) {
          return m.unitRow && m.en && hvRe.test(String(m.en.l || ""));
        });
        out.push({
          ok: hv,
          t: "Ships through the Webway Portal",
          v: hv ? wwN + " at half cost" : "no Eldar Haven in the fleet",
          s: WW.src + " (Fleets p. " + WW.pg + ")"
        });
      }
    }
  }

  // packages/rules/src/fleet-reserves.js
  function checkReserveTypes(F) {
    var L = F.L, members = F.members, out = F.out, allySpecial = F.allySpecial;
    var RES_TYPES = [
      ["battleship", "battleships"],
      ["cruiser", "cruisers"],
      ["escort", "escorts"]
    ];
    var RES_SRC = "For every three battleships, cruisers or escorts chosen from the fleet list, you may also pick one ship of the same type from another fleet list belonging to the same race. (Fleets p. 14)";
    var ALLY_SRC = "In all cases these follow the standard rules for reserves in that no more than one allied vessel may be taken for every three core vessels in the fleet. (Fleets p. 16)";
    var typeOf = function(m) {
      return m.sel && m.sel.sh && m.sel.sh.rt || "none";
    };
    var RX = L.res_exempt || null, rxShip = null;
    if (RX && members.some(function(x) {
      return x.own && x.en && x.en.k === "cmd" && new RegExp(RX.needs_re, "i").test(String(x.en.l));
    }))
      rxShip = members.filter(function(m) {
        return m.role === "reserve" && m.unitRow && m.hulls === 1 && new RegExp(RX.re, "i").test(String(m.en.l));
      })[0] || null;
    if (rxShip) out.push({
      ok: true,
      t: "Exempt from the reserve rules: " + rxShip.en.l,
      v: "with Prince Yriel",
      s: RX.src + " (Fleets p. " + RX.pg + ")"
    });
    if (RX && RX.unique_src) {
      var rxN = members.reduce(function(a, m) {
        return a + (m.unitRow && m.en && new RegExp(RX.re, "i").test(String(m.en.l)) ? m.hulls : 0);
      }, 0);
      if (rxN > 1) out.push({
        ok: false,
        t: "Flame of Asuryan (unique)",
        v: rxN + " / 1",
        s: RX.unique_src + " (Fleets p. " + RX.unique_pg + ")"
      });
    }
    var MECH = L.res_mech || null;
    var isSMres = function(m) {
      return m.role === "reserve" && !!m.sel && !!m.sel.list && m.sel.list !== L && m.sel.list.race === "space marines";
    };
    var smRes = MECH ? members.filter(isSMres) : [];
    var mechXenos = MECH ? members.some(isXenosMember) : false;
    var capLists = {};
    if (MECH) members.forEach(function(m) {
      if (m.role === "reserve" && m.sel && m.sel.list && m.sel.list !== L && !isSMres(m) && (typeOf(m) === "battleship" || typeOf(m) === "cruiser")) capLists[m.sel.list.nm] = 1;
    });
    var escFree = function(m) {
      return !!MECH && !(mechXenos && smRes.length) && m.role === "reserve" && typeOf(m) === "escort" && !!m.sel && !!m.sel.list && !!capLists[m.sel.list.nm];
    };
    var hullsOf = function(role, ty) {
      return members.reduce(function(a, m) {
        if (m.role !== role || m === rxShip || typeOf(m) !== ty) return a;
        if (MECH && role === "reserve" && (isSMres(m) || escFree(m))) return a;
        return a + m.hulls;
      }, 0);
    };
    RES_TYPES.forEach(function(t) {
      var base = Math.floor(hullsOf("core", t[0]) / 3);
      var res = hullsOf("reserve", t[0]);
      var free = t[0] !== "escort" ? 0 : members.reduce(function(a, m) {
        return a + (escFree(m) ? m.hulls : 0);
      }, 0);
      if (res || free) out.push({
        ok: res <= base,
        t: "Reserves (" + t[1] + ")",
        v: res + " / " + base + (free ? " (+" + free + " with their list's capital ships, no limit)" : ""),
        s: free ? MECH.esc_src + " " + MECH.interp.note : RES_SRC
      });
      var ally = hullsOf("ally", t[0]);
      if (ally) out.push({
        ok: ally <= base,
        t: "Allied vessels (" + t[1] + ")",
        v: ally + " / " + base,
        s: ALLY_SRC
      });
    });
    if (MECH) {
      var mechCap = hullsOf("core", "battleship") + hullsOf("core", "cruiser");
      var resCapN = hullsOf("reserve", "battleship") + hullsOf("reserve", "cruiser");
      if (resCapN) out.push({
        ok: resCapN <= Math.floor(mechCap / 3),
        t: "Reserve capital ships (one per three capital ships)",
        v: resCapN + " / " + Math.floor(mechCap / 3),
        s: MECH.cap_src
      });
      var smHulls = function(ty) {
        return smRes.reduce(function(a, m) {
          return a + (typeOf(m) === ty ? m.hulls : 0);
        }, 0);
      };
      var smCr = smHulls("cruiser"), smBs = smHulls("battleship");
      if (smCr || smBs) out.push({
        ok: smCr <= Math.floor(mechCap / 3),
        t: "Space Marine strike cruisers (one per three Mechanicus capital ships)",
        v: smCr + " / " + Math.floor(mechCap / 3),
        s: MECH.sm_src
      });
      if (smBs) out.push({
        ok: smBs <= Math.floor(smCr / 3),
        t: "Space Marine battle barges (one per three strike cruisers)",
        v: smBs + " / " + Math.floor(smCr / 3),
        s: MECH.sm_src
      });
    }
    members.filter(function(m) {
      return m.role !== "core" && typeOf(m) === "none" && !allySpecial(m);
    }).forEach(function(m) {
      out.push({
        ok: false,
        t: "Not a reserve type: " + (m.en ? m.en.l : "?"),
        v: "battleship, cruiser or escort",
        s: "Only ships of the same 'type' (battleship, cruiser or escort) count for reserves purposes. (Fleets p. 14)"
      });
    });
  }
  function checkReserveRaces(F) {
    var L = F.L, members = F.members, out = F.out;
    var saidHere = {};
    var sayOnce = function(row) {
      var k = row.t + " | " + row.v;
      if (saidHere[k]) return;
      saidHere[k] = 1;
      out.push(row);
    };
    members.filter(function(m) {
      return m.role === "reserve" || m.role === "ally";
    }).forEach(function(m) {
      var dl = m.sel && m.sel.list, dr = dl ? dl.race : null;
      if (dl && dl !== L && L.res_ban) {
        sayOnce({
          ok: false,
          t: "Takes no reserves or allies: " + L.nm,
          v: "not from " + dl.nm,
          s: L.res_ban
        });
        return;
      }
      if (dl && dl !== L && dl.res_ban) {
        sayOnce({
          ok: false,
          t: "Gives no reserves or allies: " + dl.nm,
          v: "not to " + L.nm,
          s: dl.res_ban
        });
        return;
      }
      if (dl && dl !== L && dl.lend_ban && m.en && new RegExp(dl.lend_ban.re, "i").test(String(m.en.l || ""))) {
        sayOnce({
          ok: false,
          t: "Not lent as a reserve: " + m.en.l,
          v: "stays with " + dl.nm,
          s: dl.lend_ban.src
        });
        return;
      }
      if (m.role === "ally" && dl && dl !== L && dr && L.race && dr === L.race) {
        sayOnce({
          ok: false,
          t: "Same race, so a reserve and not an ally: " + (m.en ? m.en.l : "?"),
          v: dl.nm + " is " + dr,
          s: 'Reserves can only ever be ships belonging to the same "race", chosen from a fleet list of the same "race". (Fleets p. 15)'
        });
        return;
      }
      if (m.role === "ally" && dl && dl !== L) {
        var mine = L.ally_rule || {}, theirs = dl.ally_rule || {};
        var okWith = function(rule, other) {
          if (!rule) return true;
          if (rule.only) return rule.only.indexOf(other) >= 0;
          return (rule.never || []).indexOf(other) < 0;
        };
        var a1 = L.ally_race, a2 = dl.ally_race;
        var named = false;
        (L.res_ok || []).forEach(function(g) {
          if (g.race && dl.race !== g.race) return;
          if (g.list && dl.nm !== g.list) return;
          if (!g.race && !g.list) return;
          if (g.not_re && m.en && new RegExp(g.not_re, "i").test(String(m.en.l))) return;
          named = true;
        });
        if (!named && !(okWith(mine, a2) && okWith(theirs, a1))) {
          sayOnce({
            ok: false,
            t: "Never allies: " + a1 + " and " + a2,
            v: dl.nm + " cannot be an ally here",
            s: mine.src || theirs.src || "Allies Matrix"
          });
          return;
        }
        if (!named && L.ally_excl && a1 === L.ally_excl.who) {
          var allies = {};
          members.forEach(function(x) {
            if (x.role === "ally" && x.sel && x.sel.list && x.sel.list !== L)
              allies[x.sel.list.ally_race] = 1;
          });
          var trig = L.ally_excl.trigger;
          if (allies[trig] && a2 !== trig && (L.ally_excl.allow || []).indexOf(a2) < 0) {
            sayOnce({
              ok: false,
              t: "With " + trig + " allies, no others: " + a2,
              v: dl.nm + " is a third ally",
              s: L.ally_excl.src
            });
            return;
          }
        }
        return;
      }
      if (m.role !== "reserve") return;
      if (dl === L) return;
      if (dl && dl !== L && dr && dr === L.race) return;
      var hit = null, excluded = null, needs = null;
      (L.res_ok || []).forEach(function(g) {
        if (g.race && (!dl || dl.race !== g.race)) return;
        if (g.list && (!dl || dl.nm !== g.list)) return;
        if (!g.race && !g.list) return;
        if (g.not_re && m.en && new RegExp(g.not_re, "i").test(String(m.en.l))) {
          excluded = g;
          return;
        }
        if (g.needs_re) {
          var re2 = new RegExp(g.needs_re, "i");
          var led = members.some(function(x) {
            return x.own && x.en && re2.test(String(x.en.l));
          });
          if (!led) {
            needs = g;
            return;
          }
        }
        if ((g.unless_fl || g.unless_xenos) && members.some(function(x) {
          var sh3 = x.sel && x.sel.sh;
          if (!sh3 || !x.unitRow) return false;
          if (g.unless_fl && !x.own && /battleship|cruiser/.test(sh3.rt || "") && new RegExp(g.unless_fl, "i").test(String(sh3.fl || ""))) return true;
          return !!g.unless_xenos && isXenosMember(x);
        })) {
          needs = g;
          return;
        }
        hit = g;
      });
      if (hit) return;
      if (excluded) {
        sayOnce({
          ok: false,
          t: "Not granted as a reserve: " + (m.en ? m.en.l : "?"),
          v: dl.nm + " is allowed, this row is not",
          s: L.res_src || ""
        });
        return;
      }
      if (needs) {
        sayOnce({
          ok: false,
          t: "Reserve needs " + (needs.needs_what || "a condition") + ": " + (m.en ? m.en.l : "?"),
          v: dl.nm + " is allowed only then",
          s: needs.src || L.res_src || ""
        });
        return;
      }
      sayOnce({
        ok: false,
        t: "Reserve race: " + (dl ? dl.nm : "?"),
        v: (dr || "no race") + " / " + (L.race || "no race"),
        s: 'Reserves can only ever be ships belonging to the same "race", chosen from a fleet list of the same "race". (Fleets p. 15)'
      });
    });
  }
  function checkReserveSources(F) {
    var L = F.L, members = F.members, out = F.out, secKey = F.secKey, matches = F.matches;
    members.filter(function(m) {
      if (m.own || !m.unitRow || !m.sel.list) return false;
      var ds = m.sel.list.secs[m.si];
      return !!ds && (ds.ct === "reserve" || ds.ct === "access");
    }).forEach(function(m) {
      var ds = m.sel.list.secs[m.si];
      out.push(ds.ct === "reserve" ? {
        ok: false,
        t: "Reserve of a reserve: " + (m.en ? m.en.l : "?"),
        v: ds.t + " on " + m.sel.list.nm,
        s: "However, a given fleet list cannot take as reserves ships listed as reserves or allies to another fleet list. In short, you cannot use a reserve of a reserve. (Fleets p. 15)"
      } : {
        ok: false,
        t: "Named access, not a reserve: " + (m.en ? m.en.l : "?"),
        v: ds.t + " on " + m.sel.list.nm,
        s: "Some fleet lists explicitly provide access to ships from other races. These may only be taken exactly as described on their fleet list rules and may not also be taken as reserves. (Fleets p. 15)"
      });
    });
    if (L.ally_xenos) {
      var XN = L.ally_xenos;
      var smAlly = members.some(function(x) {
        return x.role === "ally" && x.sel && x.sel.list && x.sel.list.ally_race === XN.when;
      });
      if (smAlly || L.ally_race === XN.when) {
        var xre = new RegExp(XN.re, "i");
        var saidX = {};
        members.forEach(function(m) {
          var lab = m.en ? String(m.en.l) : "";
          if (!lab || !xre.test(lab) || saidX[lab]) return;
          if (!smAlly && m.role !== "ally") return;
          saidX[lab] = 1;
          out.push({
            ok: false,
            t: "No Xenos vessels beside Space Marines: " + lab,
            v: (m.sel && m.sel.list ? m.sel.list.nm : L.nm) + " row",
            s: XN.src
          });
        });
      }
    }
    members.filter(function(m) {
      if (m.own || !m.unitRow) return false;
      var ds = m.sel.list && m.sel.list.secs[m.si];
      if (!ds || ds.ct !== "type") return false;
      return !L.secs.some(function(sec, si) {
        return sec.ct === "type" && secKey(sec) === secKey(ds) && matches(m, si, null);
      });
    }).forEach(function(m) {
      out.push({
        ok: true,
        warn: true,
        t: "Not counted in this list's limits: " + (m.en ? m.en.l : "?"),
        v: (m.sel.list ? m.sel.list.secs[m.si].t : "?") + " has no counterpart here",
        s: "Basically, the restrictions on maximum and minimum numbers of ships are determined for the fleet as a whole, regardless of whether they were purchased from the list or as reserves. (Fleets p. 14)"
      });
    });
    members.filter(function(m) {
      return m.role === "core" && !m.own;
    }).forEach(function(m) {
      out.push({
        ok: false,
        t: "Borrowed ship without a role: " + (m.en ? m.en.l : "?"),
        v: (m.sel.list ? m.sel.list.nm : "?") + " is not the fleet's list",
        s: "Any fleet chosen from one of the fleet lists may also include reserves. (Fleets p. 14)"
      });
    });
  }

  // packages/rules/src/fleet-sections.js
  function fleetCounters(L, catalog, members) {
    var secKey = function(sec) {
      return String(sec && sec.t || "").trim().toLowerCase();
    };
    var rtOf = function(en2) {
      var sh2 = en2 && en2.r != null ? catalog.ships[String(en2.r)] : null;
      return sh2 ? sh2.rt : null;
    };
    var matches = function(m, si, re) {
      if (!m.unitRow) return false;
      if (m.own) return m.si === si && (!re || re.test(m.en.l));
      var sec = L.secs[si];
      if (!sec || sec.ct !== "type") return false;
      var ds = m.sel.list && m.sel.list.secs[m.si];
      if (!ds || ds.ct !== "type" || secKey(ds) !== secKey(sec)) return false;
      var mine = rtOf(m.en);
      if (mine && !sec.ents.some(function(e2) {
        return e2.k === "unit" && rtOf(e2) === mine;
      })) return false;
      return !re || re.test(m.en.l);
    };
    var secShips = function(si, re) {
      return members.filter(function(m) {
        return matches(m, si, re);
      }).reduce(function(a, m) {
        return a + m.hulls;
      }, 0);
    };
    var secUnits = function(si, re) {
      return members.filter(function(m) {
        return matches(m, si, re);
      }).length;
    };
    var rx = function(p) {
      return p.re ? new RegExp(p.re, "i") : null;
    };
    var pickHas = function(m, p) {
      if (p.race == null && p.hull == null) return matches(m, p.sec, rx(p));
      if (!m.unitRow) return false;
      if (p.race != null && (m.own || !m.sel.list || m.sel.list.race !== p.race)) return false;
      if (p.hull != null && !(m.sel.sh && new RegExp(p.hull, "i").test(String(m.sel.sh.nm || "")))) return false;
      return !p.re || rx(p).test(m.en.l);
    };
    var esqKeys = L.esq ? escortSquadronKeys(L, members) : null;
    var count = function(pick, secs, units) {
      if (units && esqKeys) {
        var seen = {};
        members.forEach(function(m, i) {
          if (pick ? pick.some(function(p) {
            return pickHas(m, p);
          }) : (secs || []).some(function(si) {
            return matches(m, si, null);
          }))
            seen[esqKeys[i]] = 1;
        });
        return Object.keys(seen).length;
      }
      var f = units ? secUnits : secShips;
      return pick ? pick.reduce(function(a, p) {
        var ms = members.filter(function(m) {
          return pickHas(m, p);
        });
        return a + (units ? ms.length : ms.reduce(function(b, m) {
          return b + m.hulls;
        }, 0));
      }, 0) : (secs || []).reduce(function(a, i) {
        return a + f(i, null);
      }, 0);
    };
    var pointsOfPick = function(pick, secs) {
      return members.filter(function(m) {
        return pick ? pick.some(function(p) {
          return pickHas(m, p);
        }) : (secs || []).indexOf(m.si) >= 0 && m.unitRow;
      }).reduce(function(a, m) {
        return a + m.points;
      }, 0);
    };
    var distinctKinds = function(pick) {
      var seen = {};
      members.forEach(function(m) {
        if (pick.some(function(p) {
          return pickHas(m, p);
        }))
          seen[String(m.en.l).split(" \u2014 ")[0].trim().toLowerCase()] = 1;
      });
      return Object.keys(seen).length;
    };
    var upShare = function(secIdx) {
      return members.reduce(function(a, m) {
        if (!m.sel || !m.sel.sh) return a;
        var ups;
        try {
          ups = upgradesFor(m.sel);
        } catch (e) {
          return a;
        }
        return a + ups.own.concat(ups.other).filter(function(x) {
          return x[0] === secIdx && upState(m.sel, x[0], x[1]) === "take";
        }).reduce(function(b, x) {
          return b + upCost(m.sel, x[2]);
        }, 0);
      }, 0);
    };
    var condMet = function(r) {
      return !r.cond_pick || count(r.cond_pick, null) >= (r.cond_min == null ? 1 : r.cond_min);
    };
    var tookUp = function(m, si, ei) {
      return upgradeTakenAnyWay(m.sel, m.own ? si : HOST_OFF + si, ei);
    };
    var upRows = function(secIdx, re) {
      var rows = [];
      (L.secs[secIdx] ? L.secs[secIdx].ents : []).forEach(function(en, ei) {
        if (isUpgradeEnt(en) && (!re || re.test(en.l))) rows.push([secIdx, ei, en]);
      });
      return rows;
    };
    var allySpecial = function(m) {
      return !!(L.ally_cmd && m.role === "ally" && m.en && m.en.k === "cmd" && new RegExp(L.ally_cmd.re, "i").test(String(m.en.l)));
    };
    return { secKey, matches, secShips, secUnits, pickHas, count, pointsOfPick, distinctKinds, upShare, condMet, tookUp, upRows, allySpecial };
  }
  function checkSectionRules(F) {
    var L = F.L, out = F.out;
    L.secs.forEach(function(sec, si) {
      (sec.rules || []).forEach(function(r) {
        var lab = r.label || sec.t;
        if (r.interp) lab += " (open interpretation " + r.interp.id + ")";
        var badSec = secNameIssues(L, r, []);
        if (badSec.length) {
          out.push({
            ok: false,
            t: "Data error: " + lab,
            v: "section index does not match its name (" + badSec.join(", ") + ")",
            s: r.src
          });
          return;
        }
        if (Object.prototype.hasOwnProperty.call(SECTION_RULES, r.kind)) SECTION_RULES[r.kind](F, r, sec, si, lab);
      });
    });
  }
  var SECTION_RULES = {
    section_count: ruleSectionCount,
    cap: ruleCap,
    ratio: ruleRatio,
    per_points: rulePerPoints,
    mandatory_at: ruleMandatoryAt,
    squadron: ruleSquadron,
    allowed_at: ruleAllowedAt,
    conditional_cap: ruleConditionalCap,
    requires: ruleRequires,
    min_ratio: ruleMinRatio,
    compare: ruleCompare,
    points_share: rulePointsShare,
    tiers: ruleTiers,
    upgrade_ratio: ruleUpgradeRatio,
    option_ratio: ruleOptionRatio,
    notice: ruleNotice,
    one_donor: ruleOneDonor,
    agreement: ruleAgreement,
    hook_capacity: ruleHookCapacity,
    up_budget: ruleUpBudget,
    unit_upgrade_max: ruleUnitUpgradeMax
  };
  function ruleSectionCount(F, r, sec, si, lab) {
    var out = F.out, secShips = F.secShips, count = F.count;
    var c = r.pick ? count(r.pick, null) : secShips(si);
    out.push({ ok: c <= r.max && (c === 0 || c >= r.min), t: lab, v: c + " / " + r.max, s: r.src });
  }
  function ruleCap(F, r, sec, si, lab) {
    var out = F.out, secShips = F.secShips, count = F.count;
    var cc = r.pick ? count(r.pick, null) : (r.sec || [si]).reduce(function(a, i) {
      return a + secShips(i);
    }, 0);
    out.push({ ok: cc <= r.max, t: lab, v: cc + " / " + r.max, s: r.src });
  }
  function ruleRatio(F, r, sec, si, lab) {
    var out = F.out, count = F.count, distinctKinds = F.distinctKinds;
    if (r.when_pick && count(r.when_pick, null) < 1) return;
    var have = count(r.allow_pick, r.allow_sec || [si], !!r.units);
    var base = r.distinct ? distinctKinds(r.per_pick) : count(r.per_pick, r.per_sec);
    var allowed = Math.floor(base / r.per) * r.allow;
    if (r.min_one && base >= 1) allowed = Math.max(1, allowed);
    if (r.exempt && count(r.exempt.cond_pick, null) >= (r.exempt.cond_min == null ? 1 : r.exempt.cond_min))
      allowed += r.exempt.count == null ? 1 : r.exempt.count;
    if (r.at_least && count(r.at_least.cond_pick, null) >= (r.at_least.cond_min == null ? 1 : r.at_least.cond_min))
      allowed = Math.max(allowed, r.at_least.count == null ? 1 : r.at_least.count);
    out.push({ ok: have <= allowed, t: lab, v: have + " / " + allowed, s: r.src });
    var strictR = Math.floor(base / r.per) * r.allow;
    if (r.interp && r.interp.strict === "min_one" && have <= allowed && have > strictR)
      out.push({
        ok: true,
        warn: true,
        t: "Open interpretation (" + r.interp.id + "): " + r.label,
        v: have + " / " + strictR + " on the strict reading",
        s: r.interp.note
      });
  }
  function rulePerPoints(F, r, sec, si, lab) {
    var lim = F.lim, worth = F.worth, out = F.out, secUnits = F.secUnits, count = F.count, pointsOfPick = F.pointsOfPick, condMet = F.condMet;
    var cp = r.pick ? count(r.pick, null) : (r.sec || [si]).reduce(function(a, i) {
      return a + secUnits(i);
    }, 0);
    var basePts = r.of_pick ? pointsOfPick(r.of_pick, null) : r.basis === "limit" ? lim : worth;
    var ap = r.full ? Math.floor(basePts / r.per) * r.each : Math.max(1, Math.ceil(basePts / r.per)) * r.each;
    if (!condMet(r)) ap = 0;
    out.push({
      ok: r.exact ? cp === ap : cp <= ap,
      t: lab,
      v: cp + " / " + ap + (r.exact ? " exactly" : ""),
      s: r.src
    });
    if (r.interp && r.interp.strict_max != null && cp <= ap && cp > r.interp.strict_max)
      out.push({
        ok: true,
        warn: true,
        t: "Open interpretation (" + r.interp.id + "): " + r.label,
        v: cp + " / " + r.interp.strict_max + " on the strict reading",
        s: r.interp.note
      });
  }
  function ruleMandatoryAt(F, r, sec, si, lab) {
    var worth = F.worth, out = F.out, secUnits = F.secUnits, count = F.count;
    var cm = r.pick ? count(r.pick, null) : (r.sec || [si]).reduce(function(a, i) {
      return a + secUnits(i);
    }, 0);
    var need = r.over ? worth > r.points : worth >= r.points;
    out.push({
      ok: !need || cm >= 1,
      t: lab + (r.points ? " (" + (r.over ? "over " : "from ") + r.points + " pts)" : " required"),
      v: need ? cm >= 1 ? "included" : "missing" : "not required",
      s: r.src,
      warn: !need
    });
  }
  function ruleSquadron(F, r, sec, si, lab) {
    var members = F.members, out = F.out, pickHas = F.pickHas;
    var insec = r.sec || [si];
    var sizeV = function(n, word) {
      return n + " " + word + (n === 1 ? "" : "s") + ": ";
    };
    var sizeWhy = function(n) {
      return n < r.min ? " - too few, at least " + r.min : n > r.max ? " - too many, at most " + r.max : "";
    };
    var CZ = F.L.clanz;
    if (CZ && !r.pick && insec.some(function(i) {
      return F.L.secs[i] && new RegExp(CZ.tiddla, "i").test(String(F.L.secs[i].t).trim());
    })) {
      clanzTiddlas(F.L, members).forEach(function(t) {
        var ok = t.n >= r.min && t.n <= r.max;
        if (!t.tag) {
          var m = members[t.ork[0]];
          out.push({ ok, t: m.sel.sh.nm, v: t.n + " ships", s: "Squadrons of " + r.min + "\u2013" + r.max + ". " + r.src });
          return;
        }
        var names = t.ork.concat(t.com).map(function(i) {
          return members[i].hulls + " " + members[i].en.l;
        });
        out.push({
          ok,
          t: "Tiddla skwadron " + t.tag,
          v: sizeV(t.n, "escort") + names.join(" + ") + sizeWhy(t.n),
          s: "Squadrons of " + r.min + "\u2013" + r.max + ". " + r.src
        });
      });
      return;
    }
    var inRule = members.filter(function(m) {
      return m.escort && (r.pick ? r.pick.some(function(p) {
        return pickHas(m, p);
      }) : insec.indexOf(m.si) >= 0);
    });
    var escortsInFleet = members.filter(function(m) {
      return m.escort && !m.defence;
    }).reduce(function(a, m) {
      return a + m.hulls;
    }, 0);
    if (F.L.esq && inRule.length && !inRule.some(function(m) {
      return m.defence;
    })) {
      var ek = escortSquadronKeys(F.L, members), said = F.esqSaid || (F.esqSaid = {});
      var srcOf = "Squadrons of " + r.min + "\u2013" + r.max + ". " + r.src;
      inRule.forEach(function(m) {
        var k = ek[members.indexOf(m)];
        if (k.indexOf("sq:") !== 0) {
          var n = m.hulls, ok = n >= r.min && n <= r.max, v = n + " ships";
          if (n < r.min && !!r.lone && escortsInFleet === 1) {
            ok = true;
            v += " (the only escort in the fleet)";
          }
          out.push({ ok, t: m.sel.sh.nm, v, s: srcOf });
          return;
        }
        if (said[k]) return;
        said[k] = 1;
        var g = members.filter(function(x, j) {
          return ek[j] === k;
        });
        var gn = g.reduce(function(a, x) {
          return a + x.hulls;
        }, 0);
        var sep = (F.L.esq.sep || []).filter(function(re) {
          return g.some(function(x) {
            return x.own && F.L.secs[x.si] && new RegExp(re, "i").test(String(F.L.secs[x.si].t).trim());
          });
        });
        out.push({
          ok: gn >= r.min && gn <= r.max && sep.length <= 1,
          t: "Escort squadron " + k.slice(3),
          v: sizeV(gn, "ship") + g.map(function(x) {
            return x.hulls + " " + x.en.l;
          }).join(" + ") + sizeWhy(gn) + (sep.length > 1 ? " - may not be mixed" : ""),
          s: srcOf + (sep.length > 1 ? " " + citeText(F.L.esq.sep_cite) : "")
        });
      });
      return;
    }
    var letterOf = function(m) {
      return m.escort && !m.defence && m.unitRow && m.own && m.intent && m.intent.sq ? "sq:" + m.intent.sq : null;
    };
    var lettered = inRule.filter(letterOf);
    if (lettered.length) {
      var saidL = F.esqSaid || (F.esqSaid = {});
      var srcL = "Squadrons of " + r.min + "\u2013" + r.max + ". " + r.src;
      lettered.forEach(function(m) {
        var k = letterOf(m);
        if (saidL[k]) return;
        saidL[k] = 1;
        var g = members.filter(function(x) {
          return letterOf(x) === k;
        });
        var gn = g.reduce(function(a, x) {
          return a + x.hulls;
        }, 0);
        var fls = r.split_fl ? g.map(function(x) {
          return String(x.sel.sh && x.sel.sh.fl || "");
        }).filter(function(f, j, a) {
          return a.indexOf(f) === j;
        }) : [];
        var split = fls.length > 1 && fls.some(function(f) {
          return /SPACE MARINE/i.test(f);
        });
        out.push({
          ok: gn >= r.min && gn <= r.max && !split,
          t: "Escort squadron " + k.slice(3),
          v: sizeV(gn, "ship") + g.map(function(x) {
            return x.hulls + " " + x.en.l;
          }).join(" + ") + sizeWhy(gn) + (split ? " - Space Marine vessels with others" : ""),
          s: srcL + (split ? " Space Marine vessels may not be squadroned with non-Space Marine vessels. (Fleets p. 41)" : "")
        });
      });
      inRule = inRule.filter(function(m) {
        return !letterOf(m);
      });
      if (!inRule.length) return;
    }
    var poolKey = function(m) {
      return r.split_fl ? String(m.sel.sh && m.sel.sh.fl || "") : "";
    };
    var pools = {};
    inRule.forEach(function(m) {
      var k = poolKey(m);
      (pools[k] = pools[k] || []).push(m);
    });
    var partners = r.with_pick ? members.filter(function(m) {
      return inRule.indexOf(m) < 0 && !letterOf(m) && r.with_pick.some(function(p) {
        return pickHas(m, p);
      });
    }) : [];
    var fits = function(x) {
      if (x === 0) return true;
      for (var q = 1; q * r.min <= x; q++) if (x <= q * r.max) return true;
      return false;
    };
    Object.keys(pools).forEach(function(k) {
      var pool = pools[k];
      var shortN = pool.filter(function(m) {
        return m.hulls < r.min;
      }).reduce(function(a, m) {
        return a + m.hulls;
      }, 0);
      var room = pool.filter(function(m) {
        return m.hulls >= r.min && m.hulls <= r.max;
      }).reduce(function(a, m) {
        return a + (r.max - m.hulls);
      }, 0) + partners.filter(function(m) {
        return poolKey(m) === k;
      }).reduce(function(a, m) {
        return a + Math.max(0, r.max - m.hulls);
      }, 0);
      var placed = false;
      for (var j = 0; j <= Math.min(shortN, room) && !placed; j++) placed = fits(shortN - j);
      var lone = !!r.lone && escortsInFleet === 1;
      pool.forEach(function(m) {
        var n = m.hulls, ok = n >= r.min && n <= r.max, v = n + " ships";
        if (n < r.min && lone) {
          ok = true;
          v += " (the only escort in the fleet)";
        } else if (n < r.min && placed) {
          ok = true;
          v += " (joins other escorts in a mixed squadron)";
        }
        out.push({
          ok,
          t: m.sel.sh.nm,
          v: m.defence ? n + (n === 1 ? " defence" : " defences") : v,
          s: "Squadrons of " + r.min + "\u2013" + r.max + ". " + r.src
        });
      });
    });
  }
  function ruleAllowedAt(F, r, sec, si, lab) {
    var worth = F.worth, out = F.out, count = F.count, pointsOfPick = F.pointsOfPick, condMet = F.condMet;
    var ca = count(r.pick, null);
    var basis = r.basis === "remainder" ? worth - pointsOfPick(r.pick, null) : worth;
    var okPts = r.over ? basis > r.points : basis >= r.points;
    var okCond = condMet(r);
    out.push({
      ok: ca === 0 || okPts && okCond,
      t: lab,
      v: ca === 0 ? "none" : okPts && okCond ? "allowed" : "not allowed",
      s: r.src,
      warn: ca === 0
    });
  }
  function ruleConditionalCap(F, r, sec, si, lab) {
    var members = F.members, out = F.out, count = F.count, condMet = F.condMet;
    var cq = count(r.pick, null);
    var met = r.cond_role ? members.some(function(m) {
      return m.role === r.cond_role;
    }) : condMet(r);
    var cap = met ? r.max_met : r.max_unmet;
    out.push({
      ok: cap == null || cq <= cap,
      t: lab,
      v: cq + " / " + (cap == null ? "any" : cap),
      s: r.src
    });
  }
  function ruleRequires(F, r, sec, si, lab) {
    var out = F.out, count = F.count;
    var ifc = count(r.if_pick, null, !!r.if_units), thenc = count(r.then_pick, null), min = r.min == null ? 1 : r.min;
    var ifMin = r.if_min == null ? 1 : r.if_min;
    var need = ifc >= ifMin && !(r.unless_pick && count(r.unless_pick, null) >= 1);
    out.push({
      ok: !need || thenc >= min,
      t: lab,
      v: !need ? "not required" : thenc >= min ? "included" : "missing",
      s: r.src,
      warn: !need
    });
  }
  function ruleMinRatio(F, r, sec, si, lab) {
    var out = F.out, count = F.count;
    var b2 = count(r.per_pick, null), h2 = count(r.allow_pick, null, !!r.units), needN = b2 * r.min;
    out.push({ ok: b2 === 0 || h2 >= needN, t: lab, v: h2 + " / " + needN + " min", s: r.src });
  }
  function ruleCompare(F, r, sec, si, lab) {
    var out = F.out, count = F.count;
    var a3 = count(r.a_pick, null, !!r.a_units) * (r.a_mult || 1), b3 = count(r.b_pick, null, !!r.b_units) + (r.b_add || 0);
    var okc = r.op === "<=" ? a3 <= b3 : r.op === "<" ? a3 < b3 : r.op === ">=" ? a3 >= b3 : r.op === ">" ? b3 === 0 || a3 > b3 : a3 === b3;
    out.push({ ok: okc, t: lab, v: a3 + " " + r.op + " " + b3, s: r.src });
  }
  function rulePointsShare(F, r, sec, si, lab) {
    var lim = F.lim, worth = F.worth, out = F.out, pointsOfPick = F.pointsOfPick, upShare = F.upShare, condMet = F.condMet;
    var share = r.up_sec != null ? upShare(r.up_sec) : pointsOfPick(r.pick, null);
    var baseP = r.of === "limit" ? lim : r.of === "pick" ? pointsOfPick(r.of_pick, null) : worth;
    var allow = r.pct != null ? baseP * r.pct / 100 : baseP * (r.frac || 1);
    if (!condMet(r)) allow = 0;
    out.push({ ok: share <= allow + 1e-9, t: lab, v: share + " / " + Math.floor(allow) + " pts", s: r.src });
  }
  function ruleTiers(F, r, sec, si, lab) {
    var lim = F.lim, worth = F.worth, out = F.out, count = F.count;
    var ct = count(r.pick, null), capT = 0, tierBase = r.basis === "limit" ? lim : worth;
    (r.tiers || []).forEach(function(t) {
      if (tierBase >= t[0]) capT = t[1];
    });
    out.push({ ok: ct <= capT, t: lab, v: ct + " / " + capT, s: r.src });
  }
  function ruleUpgradeRatio(F, r, sec, si, lab) {
    var members = F.members, out = F.out, count = F.count, tookUp = F.tookUp, upRows = F.upRows;
    var rows = upRows(r.up_sec, r.up_re ? new RegExp(r.up_re, "i") : null);
    var nU = members.filter(function(m) {
      return rows.some(function(x) {
        return tookUp(m, x[0], x[1]);
      });
    }).length;
    var bU = count(r.per_pick, null);
    var aU = Math.floor(bU / r.per) * r.allow;
    if (r.min_one && bU >= 1) aU = Math.max(1, aU);
    out.push({ ok: nU <= aU, t: lab, v: nU + " / " + aU, s: r.src });
  }
  function ruleOptionRatio(F, r, sec, si, lab) {
    var members = F.members, out = F.out, pickHas = F.pickHas;
    var orx = new RegExp(r.opt_re, "i");
    var inPick = members.filter(function(m) {
      return (r.pick || []).some(function(p) {
        return pickHas(m, p);
      });
    });
    var tookO = inPick.filter(function(m) {
      var shO = m.sel && m.sel.sh;
      return !!shO && (shO.ol || []).some(function(o, i) {
        return orx.test(o.t || "") && optState(m.sel, i) === "take";
      });
    }).length;
    var baseO = inPick.reduce(function(a, m) {
      return a + m.hulls;
    }, 0);
    var allowO = Math.floor(baseO / r.per) * r.allow;
    out.push({ ok: tookO <= allowO, t: lab, v: tookO + " / " + allowO, s: r.src, warn: tookO === 0 });
  }
  function ruleNotice(F, r, sec, si, lab) {
    var out = F.out;
    out.push({ ok: true, warn: true, t: lab, v: "not checked by the app", s: r.src });
  }
  function ruleOneDonor(F, r, sec, si, lab) {
    var L = F.L, members = F.members, out = F.out;
    var donors = {};
    members.forEach(function(m) {
      if ((r.roles || []).indexOf(m.role) >= 0 && m.sel && m.sel.list && m.sel.list !== L) donors[m.sel.list.nm] = 1;
    });
    var nd = Object.keys(donors).length;
    if (nd) out.push({ ok: nd <= 1, t: lab, v: nd + " / 1" + (nd > 1 ? ": " + Object.keys(donors).join(", ") : ""), s: r.src });
  }
  function ruleAgreement(F, r, sec, si, lab) {
    var members = F.members, out = F.out, count = F.count, tookUp = F.tookUp, upRows = F.upRows;
    var agN = r.pick ? count(r.pick, null) : 0;
    if (r.up_sec != null) upRows(r.up_sec, null).forEach(function(x) {
      members.forEach(function(m) {
        if (tookUp(m, x[0], x[1])) agN++;
      });
    });
    if (agN) out.push({
      ok: true,
      warn: true,
      t: "By agreement with your opponent: " + lab,
      v: agN + " in the fleet",
      s: r.src
    });
  }
  function ruleHookCapacity(F, r, sec, si, lab) {
    var members = F.members, out = F.out, count = F.count;
    var carriedH = count(r.carry, null);
    var capH = members.reduce(function(a, m) {
      var hk = m.sel && m.sel.sh && m.sel.sh.hk;
      if (!hk) return a;
      var hkRow = (m.R && m.R.weapons || []).filter(function(w) {
        return (w.box == null || w.box === "on") && /gravitic hook/i.test(String(w.a && w.a[0] || ""));
      })[0];
      if (m.defence && !hkRow) return a;
      var hkN = m.defence && hkRow ? Math.max(1, hkRow.count || 1) : 1;
      return a + (r.caps || [0]).reduce(function(b, i) {
        return b + (hk[i] || 0);
      }, 0) * m.hulls * hkN;
    }, 0);
    out.push({
      ok: carriedH <= capH || !!r.soft,
      warn: !!r.soft && carriedH > capH,
      t: lab,
      v: carriedH + " / " + capH,
      s: r.src + (r.interp ? " " + r.interp.note : "")
    });
  }
  function ruleUpBudget(F, r, sec, si, lab) {
    var members = F.members, out = F.out, count = F.count, tookUp = F.tookUp, upRows = F.upRows;
    var usedB = 0, budget = 0;
    var budRows = upRows(r.up_sec, r.up_re ? new RegExp(r.up_re, "i") : null);
    members.forEach(function(m) {
      budRows.forEach(function(x) {
        if (tookUp(m, x[0], x[1])) usedB++;
      });
    });
    (r.budget || []).forEach(function(b) {
      if (b.pick) budget += (b.units || 1) * count(b.pick, null, true);
      if (b.up_re) upRows(b.up_sec, new RegExp(b.up_re, "i")).forEach(function(x) {
        members.forEach(function(m) {
          if (tookUp(m, x[0], x[1])) budget += b.weight || 1;
        });
      });
    });
    out.push({ ok: usedB <= budget, t: lab, v: usedB + " / " + budget, s: r.src, warn: usedB === 0 });
  }
  function ruleUnitUpgradeMax(F, r, sec, si, lab) {
    var members = F.members, out = F.out, pickHas = F.pickHas, tookUp = F.tookUp, upRows = F.upRows;
    var rowsM = upRows(r.up_sec, r.up_re ? new RegExp(r.up_re, "i") : null);
    var over = 0;
    members.forEach(function(m) {
      if (!r.unit_pick.some(function(p) {
        return pickHas(m, p);
      })) return;
      var k = rowsM.filter(function(x) {
        return tookUp(m, x[0], x[1]);
      }).length;
      if (k > r.max) {
        over++;
        out.push({
          ok: false,
          t: lab + ": " + (m.R ? m.R.className : m.en.l),
          v: k + " / " + r.max,
          s: r.src
        });
      }
    });
    if (!over) out.push({ ok: true, t: lab, v: "max " + r.max, s: r.src, warn: true });
  }
  function checkRowLimits(F) {
    var L = F.L, members = F.members, out = F.out, tookUp = F.tookUp;
    L.secs.forEach(function(sec, si) {
      sec.ents.forEach(function(en, ei) {
        if (en.mx == null) return;
        if (isUpgradeEnt(en)) {
          var n = members.filter(function(m) {
            return m.own && tookUp(m, si, ei);
          }).length;
          if (n > 0 || en.mx === 0)
            out.push({
              ok: n <= en.mx,
              t: en.l,
              v: n + " / " + en.mx,
              s: "The fleet may take this upgrade " + en.mx + (en.mx === 1 ? " time." : " times.")
            });
          return;
        }
        var c = members.filter(function(m) {
          return m.own && m.si === si && m.ei === ei;
        }).reduce(function(a, m) {
          return a + m.hulls;
        }, 0);
        if (c > 0 || en.mx === 0)
          out.push({ ok: c <= en.mx, t: en.l, v: c + " / " + en.mx, s: "Entry is limited to " + en.mx + " in the list." });
      });
    });
    var fxg = {};
    L.secs.forEach(function(sec, si) {
      sec.ents.forEach(function(en, ei) {
        if (!en.fxg || !isUpgradeEnt(en)) return;
        var g = fxg[en.fxg] || (fxg[en.fxg] = { n: 0, t: sec.t, labels: [] });
        g.labels.push(en.l);
        g.n += members.filter(function(m) {
          return tookUp(m, si, ei);
        }).length;
      });
    });
    Object.keys(fxg).forEach(function(k) {
      var g = fxg[k];
      if (g.n > 0) out.push({
        ok: g.n <= 1,
        t: g.t + " (bought once for the fleet)",
        v: g.n + " / 1",
        s: "One purchase for the whole fleet: " + g.labels.join(" or ") + "."
      });
    });
  }

  // packages/rules/src/fleet-specials.js
  function checkSquadrons(F) {
    var L = F.L, members = F.members, out = F.out;
    var sqTags = [];
    members.forEach(function(m) {
      var t = m.intent && m.intent.sq;
      if (t && m.R && m.R.kind === "ship" && !m.escort && sqTags.indexOf(t) < 0) sqTags.push(t);
    });
    sqTags.sort();
    var sqOf = {};
    sqTags.forEach(function(tag) {
      var ms = members.filter(function(m) {
        return m.intent && m.intent.sq === tag && m.R && m.R.kind === "ship" && !m.escort;
      });
      sqOf[tag] = ms;
      var n = ms.reduce(function(a, m) {
        return a + Math.max(1, m.hulls);
      }, 0);
      var nTxt = n + (n === 1 ? " ship" : " ships");
      var inX = function(m, x) {
        return m.own && L.secs[m.si] && new RegExp(x.sec, "i").test(String(L.secs[m.si].t).trim());
      };
      var X = (L.sqx || []).filter(function(x) {
        return ms.length && inX(ms[0], x);
      })[0] || (L.sqx || []).filter(function(x) {
        return ms.some(function(m) {
          return inX(m, x);
        });
      })[0];
      if (X) {
        var outside = X.only && ms.some(function(m) {
          return !(m.own && L.secs[m.si] && new RegExp(X.sec, "i").test(String(L.secs[m.si].t).trim()));
        });
        out.push({
          ok: !outside && n >= X.min && n <= X.max,
          t: "Squadron " + tag,
          v: outside ? "not only " + X.name : nTxt,
          s: citeText(X.cite)
        });
        return;
      }
      var cls = [];
      ms.forEach(function(m) {
        var c = sqClass(m);
        if (cls.indexOf(c) < 0) cls.push(c);
      });
      var big = cls.length === 1 && (cls[0] === "battleship" || cls[0] === "grand cruiser");
      var lim = big ? SQ_BIG : SQ_CR;
      var mixed = cls.length > 1;
      out.push({
        ok: !mixed && n >= lim.min && n <= lim.max,
        t: "Squadron " + tag,
        v: mixed ? cls.join(" + ") : nTxt,
        s: citeText(mixed && cls.some(function(c) {
          return c !== "cruiser";
        }) ? SQ_BIG : lim)
      });
    });
    return { sqTags, sqOf };
  }
  function checkBorrowedShips(F) {
    var L = F.L, members = F.members, worth = F.worth, out = F.out, sqTags = F.sqTags, sqOf = F.sqOf;
    sqTags.forEach(function(tag) {
      var dm = sqOf[tag].filter(isDemiurg).length;
      if (dm && dm < sqOf[tag].length)
        out.push({
          ok: false,
          t: "Squadron " + tag + ": Demiurg ships only with Demiurg ships",
          v: dm + " Demiurg + " + (sqOf[tag].length - dm) + " other",
          s: citeText(DEMIURG_CMD)
        });
    });
    if (L.merc) {
      var mercN = members.filter(function(m) {
        return m.own && m.unitRow && L.secs[m.si] && new RegExp(L.merc.sec, "i").test(String(L.secs[m.si].t).trim());
      }).reduce(function(a, m) {
        return a + Math.max(1, m.hulls);
      }, 0);
      if (mercN) out.push({
        ok: true,
        t: "Demiurg mercenaries",
        v: mercN + (mercN === 1 ? " Bastion" : " Bastions"),
        s: citeText(L.merc.cite) + " " + citeText(DEMIURG_CMD)
      });
    }
    (L.borrow_cond || []).forEach(function(bc) {
      var re = new RegExp(bc.re, "i");
      var hits = members.filter(function(m) {
        return m.unitRow && m.en && re.test(String(m.en.l));
      });
      if (!hits.length) return;
      var needN = members.filter(function(m) {
        return m.unitRow && !re.test(String(m.en && m.en.l || "")) && m.sel && m.sel.list && new RegExp(bc.need.list_re, "i").test(String(m.sel.list.nm)) && new RegExp(bc.need.type_re, "i").test(String(m.R && m.R.stats && m.R.stats.type || ""));
      }).reduce(function(a, m) {
        return a + Math.max(1, m.hulls);
      }, 0);
      var tooMany = hits.length > bc.max, tooSmall = worth < bc.min_worth;
      out.push({
        ok: !tooMany && !tooSmall && needN >= bc.need.n,
        t: bc.label,
        v: needN + " / " + bc.need.n + " " + bc.need.what + (tooSmall ? ", fleet under " + bc.min_worth + " pts" : "") + (tooMany ? ", " + hits.length + " taken" : ""),
        s: citeText(bc.cite)
      });
    });
    if (L.rt_hulls) {
      var RH = L.rt_hulls, hRe = new RegExp(RH.hull, "i"), aRe = new RegExp(RH.all, "i");
      var nH = 0, nA = 0;
      members.forEach(function(m) {
        if (!m.unitRow || !m.en) return;
        if (aRe.test(String(m.en.l))) nA += Math.max(1, m.hulls);
        if (hRe.test(String(m.en.l))) nH += Math.max(1, m.hulls);
      });
      if (nH) out.push({
        ok: true,
        warn: nH > nA - 1,
        t: "Rogue Trader cruiser hulls (second cruiser onwards)",
        v: nH + " / " + Math.max(0, nA - 1),
        s: citeText(RH.cite) + " " + citeText(RH.cite2) + " " + RH.interp
      });
    }
    if (L.rt_esc) {
      var RE = L.rt_esc, eRe = new RegExp(RE.esc, "i"), cRe = new RegExp(RE.cru, "i");
      var inSecR = function(m) {
        return m.own && L.secs[m.si] && new RegExp(RE.sec, "i").test(String(L.secs[m.si].t).trim());
      };
      var sqR = members.filter(function(m) {
        return m.unitRow && m.en && inSecR(m) && eRe.test(String(m.en.l));
      }).length;
      var cruR = members.filter(function(m) {
        return m.unitRow && m.en && cRe.test(String(m.en.l));
      }).reduce(function(a, m) {
        return a + Math.max(1, m.hulls);
      }, 0);
      var needOk = !RE.needs || members.some(function(m) {
        return m.en && new RegExp(RE.needs, "i").test(String(m.en.l));
      });
      if (sqR) out.push({
        ok: sqR <= cruR && needOk,
        t: "Rogue Trader escort squadrons (one per Rogue Trader cruiser)",
        v: needOk ? sqR + " / " + cruR : "needs an Inquisitor Lord",
        s: citeText(RE.cite)
      });
    }
    if (L.aux) {
      var raceOf = function(m) {
        var D = m.sel && m.sel.list;
        return D ? String(D.race || D.ally_race || D.nm) : "";
      };
      var auxM = members.filter(function(m) {
        return !m.own && m.unitRow && m.escort && (m.role === "ally" || m.role === "reserve") && !/^xenos vessel/i.test(String(m.en && m.en.l || ""));
      });
      var races = [];
      auxM.forEach(function(m) {
        var r = raceOf(m);
        if (r && races.indexOf(r) < 0) races.push(r);
      });
      if (auxM.length) out.push({
        ok: races.length <= 1,
        t: "Auxiliary vessels from one race",
        v: races.length + " / 1",
        s: citeText(L.aux.cite_one)
      });
      races.forEach(function(r) {
        if (L.aux.never.indexOf(r.toLowerCase()) >= 0)
          out.push({
            ok: false,
            t: "Auxiliary vessels: not from " + r.replace(/(^|\s)([a-z])/g, function(a, b, c) {
              return b + c.toUpperCase();
            }),
            v: "auxiliary escorts",
            s: citeText(L.aux.cite_never)
          });
      });
    }
    if (L.ally_bb) {
      var bbN = 0, capN = 0;
      members.forEach(function(m) {
        if (m.own || !m.unitRow || m.escort || !m.R || m.R.kind !== "ship") return;
        var bs = /battleship/i.test(String(m.R.stats && m.R.stats.type || ""));
        if (bs && m.role === "ally") bbN += Math.max(1, m.hulls);
        else if (!bs && (m.role === "ally" || m.role === "reserve")) capN += Math.max(1, m.hulls);
      });
      var bbMax = capN >= 3 ? 1 : 0;
      if (bbN) out.push({
        ok: bbN <= bbMax,
        t: "Allied battleship (0-1, with three reserve or allied capital ships)",
        v: bbN + " / " + bbMax,
        s: citeText(L.ally_bb.cite)
      });
    }
  }
  function checkListSpecials(F) {
    var L = F.L, members = F.members, out = F.out, tookUp = F.tookUp, upRows = F.upRows, allySpecial = F.allySpecial, aboard = F.aboard, sqTags = F.sqTags, sqOf = F.sqOf;
    if (L.bloodaxe) {
      var BA = L.bloodaxe, CZd = L.clanz;
      var baIx = function(re) {
        var x = new RegExp(re, "i");
        return L.secs.findIndex(function(sc) {
          return x.test(String(sc.t).trim());
        });
      };
      var inSecB = function(m, re) {
        return m.own && L.secs[m.si] && new RegExp(re, "i").test(String(L.secs[m.si].t).trim());
      };
      var baClan = upRows(baIx(CZd.clan_sec), new RegExp(BA.clan, "i"));
      var com = members.filter(function(m) {
        return m.unitRow && inSecB(m, BA.sec);
      });
      var tagsB = [];
      com.forEach(function(m) {
        var tg = m.intent && m.intent.sq;
        if (!tg) out.push({
          ok: false,
          t: "Commandeered escorts: " + m.en.l,
          v: "not in a Blood Axe tiddla",
          s: citeText(BA.cite)
        });
        else if (tagsB.indexOf(tg) < 0) tagsB.push(tg);
      });
      var tids = clanzTiddlas(L, members);
      tagsB.sort().forEach(function(tg) {
        var T = tids.filter(function(t) {
          return t.tag === tg;
        })[0];
        var orkN = T ? T.orkN : 0;
        var comN = com.filter(function(m) {
          return m.intent && m.intent.sq === tg;
        }).reduce(function(a, m) {
          return a + Math.max(1, m.hulls);
        }, 0);
        var axe = !!T && T.ork.some(function(i) {
          return baClan.some(function(x) {
            return tookUp(members[i], x[0], x[1]);
          });
        });
        out.push({
          ok: axe && orkN + comN >= BA.min && comN <= BA.max,
          t: "Blood Axe tiddla " + tg,
          v: orkN + " Ork + " + comN + " commandeered" + (axe ? "" : ", no Blood Axe clan"),
          s: citeText(BA.cite) + " Ruling T59: the six include the commandeered escorts."
        });
      });
    }
    if (L.warden_only) {
      var nW = 0, nO = 0;
      members.forEach(function(m) {
        if (!m.unitRow || !m.en) return;
        if (/^warden/i.test(String(m.en.l))) nW += Math.max(1, m.hulls);
        else if (/^orca/i.test(String(m.en.l))) nO += Math.max(1, m.hulls);
      });
      if (nW && nO) {
        var anyCaps = [], wOnly = 0;
        members.forEach(function(m) {
          var hk = m.sel && m.sel.sh && m.sel.sh.hk;
          if (!hk) return;
          if (m.defence && !(m.R && m.R.weapons || []).some(function(w) {
            return (w.box == null || w.box === "on") && /gravitic hook/i.test(String(w.a && w.a[0] || ""));
          })) return;
          for (var h = 0; h < Math.max(1, m.hulls); h++) {
            if (hk[0]) anyCaps.push(hk[0]);
            wOnly += hk[1] || 0;
          }
        });
        var totA = anyCaps.reduce(function(a, c) {
          return a + c;
        }, 0), needW = Math.max(0, nW - wOnly);
        var sums = [0];
        anyCaps.forEach(function(c) {
          sums.slice().forEach(function(x) {
            if (sums.indexOf(x + c) < 0) sums.push(x + c);
          });
        });
        var split = sums.some(function(x) {
          return x >= needW && totA - x >= nO;
        });
        out.push({
          ok: split,
          t: "Wardens on ships of their own",
          v: nW + " Wardens, " + nO + " Orcas",
          s: citeText(L.warden_only.cite)
        });
      }
    }
    if (L.ally_cmd) {
      var scN = members.filter(function(m) {
        return !m.own && m.en && m.en.k === "cmd";
      });
      var scOk = scN.filter(allySpecial);
      if (scN.length) out.push({
        ok: scN.length === scOk.length && scOk.length <= L.ally_cmd.max,
        t: "Allied special character (0-" + L.ally_cmd.max + ")",
        v: scOk.length === scN.length ? scOk.length + " / " + L.ally_cmd.max : "not a special character",
        s: citeText(L.ally_cmd.cite)
      });
    }
    (L.sq_noup || []).forEach(function(x) {
      sqTags.forEach(function(tag) {
        sqOf[tag].forEach(function(m) {
          if (placeTaken(m, x.re)) out.push({
            ok: false,
            t: "Daemonship in a squadron: " + m.en.l,
            v: "squadron " + tag,
            s: citeText(x.cite)
          });
        });
      });
    });
    (L.sq_need || []).forEach(function(x) {
      aboard.forEach(function(a) {
        var cm = members[a.unit];
        if (!new RegExp(x.cmd, "i").test(String(cm.en.l))) return;
        var sm = a.ship != null ? members[a.ship] : null;
        var inSq = !!sm && (sm.escort ? sm.hulls >= 2 : !!(sm.intent && sm.intent.sq && sqOf[sm.intent.sq] && sqOf[sm.intent.sq].length >= 2));
        out.push({
          ok: inSq,
          t: "Squadroned: " + cm.en.l,
          v: sm ? sm.en.l + (inSq ? " in a squadron" : " alone") : "no ship",
          s: citeText(x.cite)
        });
      });
    });
  }
  function checkOrkClanz(F) {
    var L = F.L, members = F.members, out = F.out, tookUp = F.tookUp, upRows = F.upRows, CZ = F.CZ, aboard = F.aboard, sqTags = F.sqTags, sqOf = F.sqOf;
    var wsum = [];
    if (CZ && CZ.warlords.length) {
      var C = L.clanz;
      var secIx = function(re) {
        var x = new RegExp(re, "i");
        return L.secs.findIndex(function(sc) {
          return x.test(String(sc.t).trim());
        });
      };
      var inSec = function(m, re) {
        return m.own && L.secs[m.si] && new RegExp(re, "i").test(String(L.secs[m.si].t).trim());
      };
      var clanRows = upRows(secIx(C.clan_sec)), gubRows = upRows(secIx(C.gub_sec), new RegExp(C.gub_re, "i"));
      var tids = clanzTiddlas(L, members);
      var clansOf = function(m) {
        return clanRows.filter(function(x) {
          return tookUp(m, x[0], x[1]);
        }).map(function(x) {
          return String(x[2].l).replace(/^clan:\s*/i, "").replace(/\s*\(.*$/, "");
        });
      };
      var clanNames = clanRows.map(function(x) {
        return String(x[2].l).replace(/^clan:\s*/i, "").replace(/\s*\(.*$/, "");
      });
      var bornClan = function(m) {
        var o = /\(([a-z][a-z ]*?) only\)/i.exec(String(m.en && m.en.l || ""));
        return o ? clanNames.filter(function(c) {
          return c.toLowerCase().indexOf(o[1].toLowerCase()) === 0;
        }).slice(0, 1) : [];
      };
      CZ.warlords.forEach(function(w, k) {
        var wi = members.indexOf(w), tag = "Warlord " + (k + 1) + ": ";
        var mine = members.filter(function(m, i) {
          return CZ.of[i] === wi;
        });
        var rr = w.R && w.R.rerolls && w.R.rerolls.total || 1;
        var hulks = mine.filter(function(m) {
          return inSec(m, C.hulk);
        });
        var S1 = { unit: wi, n: k + 1, rr, hulk: hulks.length, units: mine.map(function(m) {
          return members.indexOf(m);
        }) };
        wsum.push(S1);
        if (hulks.length) {
          var others = mine.length - 1;
          out.push({
            ok: hulks.length === 1 && others === 0,
            t: tag + "Space Hulk",
            v: others === 0 && hulks.length === 1 ? "only the hulk" : "hulk + " + others + " other",
            s: citeText(C.hulk1) + " " + citeText(C.hulk2)
          });
        } else {
          var tid = tids.filter(function(t) {
            return CZ.of[t.ork[0]] === wi;
          }).length;
          var groups = {};
          mine.forEach(function(m) {
            if (inSec(m, C.tiddla) || L.bloodaxe && inSec(m, L.bloodaxe.sec)) return;
            var g2 = (inSec(m, C.big) || inSec(m, C.rok)) && m.intent && m.intent.sq ? "sq:" + m.intent.sq : "u:" + members.indexOf(m);
            groups[g2] = 1;
          });
          var total = tid + Object.keys(groups).length, t1 = Math.min(tid, rr);
          S1.tiddla = tid;
          S1.total = total;
          S1.lone = mine.filter(function(m) {
            if (!inSec(m, C.big)) return false;
            var tg = m.intent && m.intent.sq;
            return !tg || mine.filter(function(o) {
              return inSec(o, C.big) && o.intent && o.intent.sq === tg;
            }).length === 1;
          }).map(function(m) {
            return members.indexOf(m);
          });
          out.push({
            ok: tid >= rr && total === 2 * rr,
            t: tag + "skwadrons",
            v: t1 + " tiddla + " + (total - t1) + " other / " + rr + " + " + rr,
            s: citeText(C.sk) + " " + C.sk_interp
          });
        }
        var uge = mine.filter(function(m) {
          return inSec(m, C.uge);
        }).length;
        var kro = mine.filter(function(m) {
          return inSec(m, C.big);
        }).length;
        S1.uge = uge;
        S1.kro = kro;
        if (uge) out.push({
          ok: uge <= 1 && kro >= 2,
          t: tag + "'Uge ship",
          v: uge + " / 1, " + kro + (kro === 1 ? " kroozer" : " kroozers"),
          s: citeText(C.uge1) + " " + citeText(C.uge2)
        });
        var wClan = w.intent && w.intent.clan ? String(w.intent.clan) : "";
        var clans = wClan ? [wClan] : [];
        mine.concat([w]).forEach(function(m) {
          clansOf(m).concat(bornClan(m)).forEach(function(c) {
            if (clans.indexOf(c) < 0) clans.push(c);
          });
        });
        if (C.snake && wClan && new RegExp(C.snake_clan, "i").test(wClan)) {
          var notSnake = mine.filter(function(m) {
            return !m.escort && !inSec(m, C.tiddla) && !inSec(m, C.hulk) && !inSec(m, C.rok) && !(L.bloodaxe && inSec(m, L.bloodaxe.sec));
          });
          out.push({
            ok: !notSnake.length,
            t: tag + "Snakebite capital ships",
            v: notSnake.length ? notSnake.map(function(m) {
              return m.en.l;
            }).join(", ") + ": not a hulk or Rok" : "hulks and Roks only",
            s: citeText(C.snake)
          });
        }
        if (clans.length) out.push({ ok: clans.length <= 1, t: tag + "one clan", v: clans.join(", "), s: citeText(C.clan) });
        S1.clans = clans;
        var ab = aboard.filter(function(a) {
          return a.unit === wi;
        })[0];
        var own = ab && ab.ship != null ? members[ab.ship] : null;
        var g = 0, off = 0;
        mine.forEach(function(m) {
          gubRows.forEach(function(x) {
            if (tookUp(m, x[0], x[1])) {
              g++;
              if (m !== own) off++;
            }
          });
        });
        if (g) out.push({
          ok: g <= rr && !off,
          t: tag + "Gubbins",
          v: g + " / " + rr + (off ? ", " + off + " not on his own ship" : ""),
          s: citeText(C.gub)
        });
        S1.gub = g;
        S1.gubOff = off;
        S1.ship = own ? members.indexOf(own) : null;
      });
      sqTags.forEach(function(tag) {
        var ms = sqOf[tag], sets = ms.map(function(m) {
          var cs = clansOf(m);
          bornClan(m).forEach(function(c) {
            if (cs.indexOf(c) < 0) cs.push(c);
          });
          return cs.sort().join(",");
        });
        if (sets.some(function(x) {
          return x;
        }) && sets.some(function(x) {
          return x !== sets[0];
        }))
          out.push({
            ok: false,
            t: "Squadron " + tag + ": the clan on every ship",
            v: sets.map(function(x) {
              return x || "none";
            }).join(" / "),
            s: citeText(C.clan_sq)
          });
      });
      var splitOf = function(label, ixs) {
        var wl = [];
        ixs.forEach(function(i) {
          var w = CZ.of[i];
          if (w >= 0 && wl.indexOf(w) < 0) wl.push(w);
        });
        if (wl.length > 1) out.push({
          ok: false,
          t: label + ": one Warlord",
          v: wl.map(function(w) {
            return "Warlord " + (CZ.warlords.indexOf(members[w]) + 1);
          }).join(" + "),
          s: citeText(C.split)
        });
      };
      if (C.split) {
        sqTags.forEach(function(tag) {
          splitOf("Squadron " + tag, sqOf[tag].map(function(m) {
            return members.indexOf(m);
          }));
        });
        tids.forEach(function(t) {
          if (t.tag) splitOf("Tiddla skwadron " + t.tag, t.ork);
        });
      }
    }
    return wsum;
  }
  function checkHulkPowerfields(F) {
    var L = F.L, members = F.members, out = F.out, tookUp = F.tookUp, upRows = F.upRows, aboard = F.aboard;
    if (L.hulk_pf) {
      var HP = L.hulk_pf;
      var hpSec = L.secs.findIndex(function(sc) {
        return new RegExp(HP.sec, "i").test(String(sc.t).trim());
      });
      var hp25 = upRows(hpSec, new RegExp(HP.row, "i")), hp50 = upRows(hpSec, new RegExp(HP.hulk_row, "i"));
      aboard.forEach(function(a) {
        var cm = members[a.unit];
        if (!cm.own || !new RegExp(HP.cmd, "i").test(String(cm.en.l))) return;
        var t25 = hp25.some(function(x) {
          return tookUp(cm, x[0], x[1]);
        });
        var t50 = hp50.some(function(x) {
          return tookUp(cm, x[0], x[1]);
        });
        if (!t25 && !t50) return;
        var sm = a.ship != null ? members[a.ship] : null;
        var onHulk = !!sm && placeRe(HP.ship, sm);
        if (!onHulk && !t50) return;
        var ok = onHulk ? t50 && !t25 : t25 && !t50;
        out.push({
          ok,
          t: "Extra Power Fields: " + cm.en.l + " aboard " + (sm ? sm.en.l : "no ship"),
          v: "+" + (t50 ? 50 : 25) + " pts" + (ok ? "" : onHulk ? " (+50 aboard a space hulk)" : " (+25 off a space hulk)"),
          s: citeText(HP.cite)
        });
      });
    }
  }

  // packages/rules/src/resolve-fleet.js
  function resolveFleet(fleetIntent, catalog) {
    var L = catalog.lists.filter(function(x) {
      return x.nm === fleetIntent.list;
    })[0] || null;
    var ctx = { list: L, host: L };
    var lim = fleetIntent.limit | 0;
    var members = (fleetIntent.units || []).map(function(it) {
      var sel = selectionOf(it, ctx, catalog);
      var R = resolveUnit(it, ctx, catalog);
      var en = sel.en;
      var ownSec = sel.list && sel.list.secs[sel.si];
      var role = roleOfIntent(it);
      if (role === "core" && sel.list === L && ownSec && ownSec.ct === "reserve")
        role = "reserve";
      return {
        intent: it,
        sel,
        R,
        si: sel.si,
        ei: sel.ei,
        en,
        role,
        own: !sel.list || sel.list === L,
        unitRow: !!en && !isUpgradeEnt(en),
        hulls: sel.hulls,
        escort: sel.escort,
        /* a planetary defence: outside the fleet list's own counts */
        defence: sel.defence,
        points: R && R.points != null ? R.points : 0,
        maxPoints: R && R.maxPoints != null ? R.maxPoints : 0
      };
    });
    var tot = members.reduce(function(a, m) {
      return a + m.points;
    }, 0);
    var totMax = members.reduce(function(a, m) {
      return a + m.maxPoints;
    }, 0);
    var defPts = members.reduce(function(a, m) {
      return a + (m.defence && !defenceOwnPoints(m.sel.sh) ? m.points : 0);
    }, 0);
    var worth = tot - defPts;
    var out = [];
    out.push({
      ok: tot <= lim,
      t: "Points limit",
      v: tot + " / " + lim,
      s: tot <= lim ? lim - tot + " pts remaining" : tot - lim + " pts over the limit"
    });
    if (!L) return {
      list: null,
      limit: lim,
      units: members.map(function(m) {
        return m.R;
      }),
      totals: { points: tot, maxPoints: totMax, hulls: 0 },
      checks: out,
      facts: [],
      aboard: []
    };
    var F = fleetCounters(L, catalog, members);
    F.L = L;
    F.lim = lim;
    F.members = members;
    F.worth = worth;
    F.out = out;
    checkSectionRules(F);
    checkRowLimits(F);
    checkWarmasterMark(F);
    checkUnitIssues(F);
    checkCommanderPrice(F);
    checkDefences(F);
    checkRequiredWeapons(F);
    checkOptionShares(F);
    checkWebway(F);
    checkReserveTypes(F);
    checkReserveRaces(F);
    checkReserveSources(F);
    var CZ = clanzCommand(L, members);
    var aboard = placeCommanders(L, members, CZ ? CZ.of : null);
    F.CZ = CZ;
    F.aboard = aboard;
    var SQ = checkSquadrons(F);
    F.sqTags = SQ.sqTags;
    F.sqOf = SQ.sqOf;
    checkBorrowedShips(F);
    checkListSpecials(F);
    var wsum = checkOrkClanz(F);
    checkHulkPowerfields(F);
    aboard.forEach(function(a) {
      if (!a.ruled) return;
      var cm = members[a.unit], sm = a.ship != null ? members[a.ship] : null;
      out.push({
        ok: a.ok,
        t: "Aboard: " + cm.en.l,
        v: sm ? sm.en.l : "no ship he may board",
        s: a.cite ? citeText(a.cite) : ""
      });
    });
    return {
      list: L.nm,
      limit: lim,
      units: members.map(function(m) {
        return m.R;
      }),
      /* hulls: the ships on the table, not a commander or a bought row
         (ChatGPT audit UX-06: four escorts and a Warlord said 5 hulls) */
      totals: {
        points: tot,
        maxPoints: totMax,
        hulls: members.reduce(function(a, m) {
          return a + (m.R && m.R.kind === "ship" ? m.hulls : 0);
        }, 0)
      },
      checks: out,
      facts: fleetFacts(L, members),
      aboard,
      /* Clanz (J216): the Warlord of each unit (unit index -> Warlord's
         unit index, -1 = none) */
      command: CZ ? CZ.of : null,
      /* Clanz (J226): per Warlord {unit, n, rr, tiddla, total, hulk,
         uge, kro, lone, clans, gub, gubOff, ship, units} */
      warlords: wsum
    };
  }

  // packages/rules/src/index.js
  var DOMAIN = {
    /* P1-8c */
    weaponState,
    optionsOf,
    upgradesOf,
    resolveUnit,
    RULE_CARDS,
    ruleCardOf,
    shipLeadership,
    isStationaryDefence,
    defenceOwnPoints,
    rowPurchase,
    rowStep,
    ownedText,
    starsForRow,
    hullOptionsOf,
    shipFor,
    venerableView,
    defaultUpgradeKeys,
    commanderRules,
    validateIntent,
    transition,
    resolveFleet,
    lendVerdict,
    lendGrantFor,
    lendRowVerdict,
    lendSummary,
    lendOwnRoute,
    lendRouteFor,
    lendOfferable,
    /* P1-8b step 6 */
    WEP,
    wepClass,
    wepKey,
    rangeCell,
    RANGE_BANDS,
    pairRows,
    CRIP_LINE,
    REPAIR_LINE,
    CRIT_LINE,
    ESCORT_LINE,
    isSpaceHulk,
    isOrkHulk,
    isChaosHulk,
    hulkPage,
    crippledLine,
    criticalModel,
    repairLine,
    criticalTriggerLine,
    criticalTriggerHint,
    isMechanicusVessel,
    armAbbr,
    armStrength,
    armSummary,
    armSummaryRows,
    weaponBoxes,
    rerollText,
    commanderRerollOffer,
    fleetRerolls,
    rerollBoxes,
    openRerolls,
    shipRerolls,
    armSummaryText,
    ARM_ORDER,
    condShipOnly,
    requiredHullChanges,
    sectionNeeds,
    hostReserveRow,
    foreignReserveRow,
    SPECIAL_WEAPON_RULES,
    SPECIAL_HULL_RULES,
    fleetMatches,
    defMatches,
    defOptionMatches,
    uniqRefs,
    sourceStarDef,
    weaponMentioned,
    localRef,
    specialModel,
    specialLines,
    starredKeys,
    optStars,
    SCHEMA_VERSION,
    SEP,
    TEXT_KEY_LEN,
    normOptText,
    textKey,
    optionIndex,
    upgradeId,
    splitUpgradeId,
    splitMembers,
    joinMembers,
    findEntry,
    findUpgradeEntry,
    fromLegacyUnit,
    toLegacyUnit,
    deepFreeze,
    /* P1-8b */
    isUpgradeEnt,
    upgradeKey,
    selectionOf,
    optState,
    optCount,
    upState,
    bayStrength,
    prowArmour,
    upTokens,
    coveredByShipOption,
    upgradeTakenAnyWay,
    condOK,
    upgradesFor,
    requiredUpgradeKeys,
    upCost,
    upgradePts,
    hullPts,
    pointsOf,
    maxPointsOf,
    timesStrength,
    weaponRows,
    statMod,
    statSet,
    effHits,
    effShieldsText,
    effTurrets,
    effSpeed
  };
  var index_default = DOMAIN;
  return __toCommonJS(index_exports);
})();
var DOMAIN = __rules.default;
if (typeof module !== "undefined" && module.exports) module.exports = DOMAIN;
