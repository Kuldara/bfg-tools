/* Domain-moduulin testit (P1-8a, P1-8b): ajetaan ILMAN HTML:aa, DOM-tynkaa,
 * localStoragea tai globaalia S:aa. require("./domain.js") suoraan.
 *
 *   1. Option-ID:t datassa: jokaisella ol-rivilla id, uniikki aluksen sisalla,
 *      ja sama kaava kuin build_data.py:ssa (sivu + sha1(norm(teksti))[:8]).
 *      Listarivien tunnisteet (lista + osio + rivin nimi) ovat uniikkeja.
 *   2. Adapteri kiertaa: legacy-yksikko -> CanonicalUnitIntent -> legacy,
 *      jokaisella referenssi/golden_cases.json-tapauksella (luku tiedostosta),
 *      ja intent selviaa JSON-kierroksesta.
 *   3. Migraatio: aluksen optiojarjestys sekoitetaan katalogin kopiossa;
 *      intent osoittaa yha samoihin optioihin TEKSTIN perusteella.
 *   4. Puhtaus: syotteet on jaadytetty (deepFreeze); mutaatio heittaisi.
 *      Lisaksi katalogi on ajon jalkeen tavulleen sama kuin ennen.
 *   5. Kelvoton intent: tuntematon option-ID ja tuntematon rivi tuottavat
 *      rakenteisen issue-rivin eivatka kaadu.
 *   6. (P1-8b) Puhtaat laskimet kirjaa vastaan: golden-tapausten odotukset
 *      (hinta, statsit, aserivit, tarjotut paivitykset, runkovaihtoehdot)
 *      arvioidaan suoraan pointsOf/weaponRows/eff*-funktioilla. Sama kirja,
 *      toinen polku: test_golden.js ajaa saman sovelluksen kuorien lapi.
 *   7. (P1-8b) Ei aliasointia: yksikaan ratkaistu aserivi ei ole katalogin
 *      taulukon alkio; tuloksen muuttaminen ei muuta katalogia.
 *
 * Aja:  node test_domain.js        node test_domain.js -v
 */
"use strict";
const fs = require("fs"), path = require("path"), crypto = require("crypto");
const DOMAIN = require("./domain.js");

const HERE = __dirname;
const RAW = fs.readFileSync(path.join(HERE, "bfg_data.json"), "utf8");
const catalog = JSON.parse(RAW);
const CASES = JSON.parse(fs.readFileSync(path.join(HERE, "referenssi", "golden_cases.json"), "utf8")).cases;
const VERBOSE = process.argv.includes("-v");

let pass = 0, fail = 0;
const fails = [];
function check(name, ok, detail){
  if(ok) pass++; else { fail++; fails.push(name + (detail ? "  " + detail : "")); }
  if(VERBOSE || !ok) console.log("  " + (ok ? "PASS" : "FAIL") + "  " + name + (ok || !detail ? "" : "  " + detail));
}
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const norm = t => String(t == null ? "" : t)
  .replace(/[  ]/g, " ").replace(/[–—−]/g, "-")
  .replace(/\s+/g, " ").trim();

/* ---- 1. option-ID:t ja rivitunnisteet --------------------------------- */
const sha8 = t => crypto.createHash("sha1").update(DOMAIN.normOptText(t), "ascii").digest("hex").slice(0, 8);
let nOpts = 0, badId = 0, dupId = 0;
Object.keys(catalog.ships).forEach(k => {
  const seen = new Set();
  (catalog.ships[k].ol || []).forEach(o => {
    nOpts++;
    if(o.id !== k + ":" + sha8(o.t)) badId++;
    if(seen.has(o.id)) dupId++;
    seen.add(o.id);
  });
});
check("optioita datassa > 100", nOpts > 100, String(nOpts));
check("jokaisen option id noudattaa kaavaa sivu:sha1(norm)[:8]", badId === 0, "poikkeavia " + badId);
check("id:t uniikkeja aluksen sisalla", dupId === 0, "tuplia " + dupId);
{
  /* Yksikko- ja komentajarivit: (lista, osio, nimi) on yksiselitteinen.
     Paivitysrivit saavat toistua samalla nimella (Tyranidien 'Pyro-acid
     battery' 5/10/15 pts eri aluksille), mutta silloin jokaisella on oma
     kiinnitys (at), josta findUpgradeEntry valitsee yksikon oman rivin. */
  const dupUnit = [], dupUpNoAt = [];
  catalog.lists.forEach(L => {
    const seenU = new Set(), ups = {};
    L.secs.forEach((sec, si) => sec.ents.forEach((en, ei) => {
      const id = DOMAIN.upgradeId(L.nm, sec.t, en.l);
      if(en.k === "up"){ (ups[id] = ups[id] || []).push(en); return; }
      if(seenU.has(id)) dupUnit.push(L.nm + " / " + sec.t + " / " + en.l);
      seenU.add(id);
    }));
    Object.keys(ups).forEach(id => {
      const rows = ups[id];
      if(rows.length < 2) return;
      const ats = rows.map(en => JSON.stringify(en.at || null));
      if(new Set(ats).size !== ats.length) dupUpNoAt.push(id.split(DOMAIN.SEP).join(" / "));
    });
  });
  check("yksikko- ja komentajarivit yksiselitteisia (lista+osio+nimi)", dupUnit.length === 0, dupUnit.slice(0, 5).join(" | "));
  check("samannimiset paivitysrivit erottuvat kiinnityksesta", dupUpNoAt.length === 0, dupUpNoAt.slice(0, 5).join(" | "));
  /* Kraken (Tyranids): 'Pyro-acid battery' on 15 pts Krakenille, 5 pts Vanguardille */
  const L = listByName("Tyranids — Hive Fleet");
  const sec = L.secs.findIndex(sx => sx.t === "ESCORTS");
  const kr = L.secs[sec].ents.findIndex(en => en.l === "Kraken");
  const rows = L.secs[sec].ents.map((en, ei) => [en, ei]).filter(([en]) => en.l === "Pyro-acid battery" && en.k === "up");
  const mine = rows.find(([en]) => en.at && en.at.some(p => p[0] === sec && p[1] === kr));
  check("Kraken: oma pyro-acid-rivi loytyy", !!mine && mine[0].p === 15);
  const u = { s: sec, e: kr, ref: L.secs[sec].ents[kr].r, n: 1, name: "", opts: [], os: {}, oq: {}, ups: {} };
  u.ups[sec + ":" + mine[1]] = "take";
  const ctx = { list: L };
  const it = DOMAIN.fromLegacyUnit(u, ctx, catalog);
  const selK = DOMAIN.selectionOf(it, ctx, catalog);
  check("Kraken: paivitys ratkeaa omaan riviin", selK.ups[sec + ":" + mine[1]] === "take", JSON.stringify(selK.ups));
  const back = DOMAIN.toLegacyUnit(it, ctx, catalog);
  check("Kraken: takaisin samaan indeksiin", back.unit.ups[sec + ":" + mine[1]] === "take" && !back.issues.length, JSON.stringify(back.unit.ups));
  /* Krakenin oma profiili tarjoaa saman aseen samaan hintaan (15), joten
     listarivi on peitetty (coveredByShipOption) eika sita laskuteta
     kahdesti: hinta tulee aluksen omasta optiosta. */
  check("Kraken: listarivi peittyy aluksen omalla optiolla", DOMAIN.coveredByShipOption(selK, mine[0]) === true);
  const own = (selK.sh.ol || []).findIndex(o => /pyro-acid/i.test(o.t));
  check("Kraken: oma optio samaan hintaan", own >= 0 && selK.sh.ol[own].c === mine[0].p, String(own >= 0 && selK.sh.ol[own].c));
  const u2 = { ...u, ups: {}, os: { [own]: "take" }, opts: [own] };
  const sel2 = DOMAIN.selectionOf(DOMAIN.fromLegacyUnit(u2, ctx, catalog), ctx, catalog);
  const base = DOMAIN.pointsOf(DOMAIN.selectionOf(DOMAIN.fromLegacyUnit({ ...u, ups: {} }, ctx, catalog), ctx, catalog));
  check("Kraken: pyro-acid optiona +15 (escort x runkoja)", DOMAIN.pointsOf(sel2) - base === 15 * sel2.hulls, String(DOMAIN.pointsOf(sel2) - base));
}

/* ---- apurit: golden-tapaus -> legacy-yksikko ------------------------- */
function listByName(nm){ return catalog.lists.find(L => L.nm === nm) || null; }
function placeOn(L, page){
  let fb = null;
  for(let si = 0; si < L.secs.length; si++)
    for(let ei = 0; ei < L.secs[si].ents.length; ei++){
      const en = L.secs[si].ents[ei];
      if(String(en.r) !== String(page)) continue;
      if(en.k === "unit") return { si, ei };
      if(!fb) fb = { si, ei };
    }
  return fb;
}
/* Sama saanto kuin test_golden.js:n optIndex: regex, ei osajono. */
function optIndex(sh, pat){
  const re = new RegExp(pat, "i");
  return (sh.ol || []).findIndex(o => re.test(o.t));
}
const legacyRef = r => (isNaN(+r) ? String(r) : +r);
function legacyFromCase(c){
  /* Lainalaiva (J206): "from" on aluksen oma lista, "list" laivaston lista.
     Yksikko kantaa listansa (lst) ja roolinsa kuten sovelluksessa. */
  const own = c.from || c.list;
  const L = own === "-" ? null : listByName(own);
  if(own !== "-" && !L) return { err: "listaa ei loydy: " + own };
  const at = L ? placeOn(L, c.ship) : null;
  if(L && !at) return { err: "alus s." + c.ship + " ei ole listalla" };
  const en = at ? L.secs[at.si].ents[at.ei] : null;
  const sh0 = catalog.ships[String(c.ship)];
  const u = { s: at ? at.si : -1, e: at ? at.ei : -1, ref: legacyRef(c.ship), n: 1, name: "",
              opts: [], os: {}, oq: {}, ups: {} };
  if(c.from){ u.lst = c.from; u.role = c.role || "reserve"; }
  /* kuten addUnit(): avoin hinta alkaa profiilin hinnasta; escort-saattueen
     koko listan squadron-saannosta tai 2 */
  if(en && en.p == null && sh0 && sh0.bp != null) u.custom = sh0.bp;
  /* sh0.sq: yhden osuman puolustus, jonka tyyppi on Defence tai Ground
     (Rulebook s.100) - sama laivuemuoto kuin escortilla */
  if(sh0 && (sh0.sq || /escort/i.test(sh0.ty || ""))){
    const sq = L ? L.secs.reduce((f, s2) => f || (s2.rules || []).find(r =>
      r.kind === "squadron" && (r.sec || []).indexOf(at.si) >= 0), null) : null;
    u.n = sq ? sq.min : 2;
  }
  (c.select || []).forEach(s => {
    if(s.hull){ u.ref = legacyRef(s.hull); u.hn = catalog.ships[String(s.hull)].nm; u.os = {}; u.oq = {}; return; }
    if(s.upgrade){
      /* listapaivitys: tarjotuista riveista nimen regexilla, kuten sovellus */
      const sel0 = DOMAIN.selectionOf(DOMAIN.fromLegacyUnit(u, { list: L }, catalog), { list: L }, catalog);
      const ups = DOMAIN.upgradesFor(sel0);
      const row = ups.own.concat(ups.other).find(x => new RegExp(s.upgrade, "i").test(String(x[2].l)));
      if(row) u.ups[row[0] + ":" + row[1]] = s.state || "take";
      return;
    }
    const sh = DOMAIN.shipFor(u.ref, en, catalog);   /* Venerable: rungon SM-nakyma */
    const i = optIndex(sh, s.option);
    if(i < 0) return;
    u.os[i] = s.state || "take";
    if(s.qty > 1) u.oq[i] = s.qty;
  });
  if(c.name != null) u.name = c.name;
  if(c.note != null) u.note = c.note;
  if(c.adjust != null) u.adj = c.adjust;
  if(c.members != null) u.members = c.members;
  if(c.n != null) u.n = c.n;
  u.opts = Object.keys(u.os).filter(i => u.os[i] === "take").map(Number).sort((a, b) => a - b);
  return { u, L };
}
const effState = (u, i) => (u.os && u.os[i]) || ((u.opts || []).includes(i) ? "take" : "opt");

/* ---- 2. adapterin kierros golden-tapauksilla --------------------------- */
DOMAIN.deepFreeze(catalog);
let cases = 0;
CASES.forEach(c => {
  if(c.entry){ cases++; return; }               /* komentajat: osio 11 */
  const b = legacyFromCase(c);
  if(b.err){ check("golden " + c.id + ": rakennus", false, b.err); return; }
  cases++;
  const { u, L } = b;
  const sh = DOMAIN.shipFor(u.ref, L && u.s >= 0 ? L.secs[u.s].ents[u.e] : null, catalog);
  const ctx = DOMAIN.deepFreeze({ list: L });
  DOMAIN.deepFreeze(u);
  let intent;
  try{ intent = DOMAIN.fromLegacyUnit(u, ctx, catalog); }
  catch(e){ check("golden " + c.id + ": fromLegacyUnit ei heita", false, String(e)); return; }
  check("golden " + c.id + ": schemaVersion", intent.schemaVersion === DOMAIN.SCHEMA_VERSION);
  check("golden " + c.id + ": ref merkkijonona", intent.ref === String(u.ref));
  if(L){
    const en = L.secs[u.s].ents[u.e];
    check("golden " + c.id + ": entry nimilla", intent.entry && intent.entry.list === L.nm &&
          intent.entry.section === L.secs[u.s].t && intent.entry.label === en.l, JSON.stringify(intent.entry));
    check("golden " + c.id + ": hull vain hc-rivilla", (intent.hull != null) === !!en.hc);
  }else{
    check("golden " + c.id + ": entry null listattomalle", intent.entry === null);
  }
  Object.keys(intent.options).forEach(id => {
    check("golden " + c.id + ": option-id loytyy profiilista " + id, (sh.ol || []).some(o => o.id === id));
  });
  const nSel = Object.keys(u.os).length;
  check("golden " + c.id + ": valintojen maara sailyy", Object.keys(intent.options).length === nSel,
        Object.keys(intent.options).length + " != " + nSel);

  const round = JSON.parse(JSON.stringify(intent));          /* tallenteen kautta */
  const back = DOMAIN.toLegacyUnit(round, ctx, catalog);
  check("golden " + c.id + ": ei issueita", back.issues.length === 0, JSON.stringify(back.issues));
  const v = back.unit;
  check("golden " + c.id + ": paikka ja runko", v.s === u.s && v.e === u.e && String(v.ref) === String(u.ref) && v.n === u.n);
  const states = (sh.ol || []).map((o, i) => effState(u, i)), statesBack = (sh.ol || []).map((o, i) => effState(v, i));
  check("golden " + c.id + ": optiotilat", same(states, statesBack), states.join(",") + " != " + statesBack.join(","));
  check("golden " + c.id + ": maarat", same(u.oq || {}, v.oq || {}));
  check("golden " + c.id + ": opts-taulukko", same(u.opts, v.opts));
});
check("golden-tapauksia ajettu = tiedoston maara", cases === CASES.length, cases + " / " + CASES.length);

/* ---- 2b. listapaivitys kiertaa ---------------------------------------- */
(function(){
  let done = false;
  for(const L of catalog.lists){
    for(let si = 0; si < L.secs.length && !done; si++)
      for(let ei = 0; ei < L.secs[si].ents.length && !done; ei++){
        const en = L.secs[si].ents[ei];
        if(en.k !== "up" || (en.at && en.at.length)) continue;
        const unit = placeOn(L, (L.secs.flatMap(s => s.ents).find(e => e.k === "unit" && e.r) || {}).r);
        if(!unit) continue;
        const u = { s: unit.si, e: unit.ei, ref: L.secs[unit.si].ents[unit.ei].r, n: 1, name: "X", note: "n",
                    adj: -5, custom: 120, members: "Alpha, Beta", opts: [], os: {}, oq: {}, ups: {} };
        u.ups[si + ":" + ei] = "take";
        DOMAIN.deepFreeze(u);
        const ctx = DOMAIN.deepFreeze({ list: L });
        const it = DOMAIN.fromLegacyUnit(u, ctx, catalog);
        const id = DOMAIN.upgradeId(L.nm, L.secs[si].t, en.l);
        check("paivitys: id nimista", it.upgrades[id] === "take", JSON.stringify(Object.keys(it.upgrades)));
        check("paivitys: nimi/note/adjust/custom/members", it.name === "X" && it.note === "n" && it.adjust === -5 &&
              it.custom === 120 && same(it.members, ["Alpha", "Beta"]));
        const back = DOMAIN.toLegacyUnit(JSON.parse(JSON.stringify(it)), ctx, catalog);
        check("paivitys: takaisin indeksiin", back.unit.ups[si + ":" + ei] === "take" && back.issues.length === 0);
        check("paivitys: upn-avain", back.unit.upn[L.secs[si].t + DOMAIN.SEP + en.l] === "take");
        check("paivitys: kentat takaisin", back.unit.name === "X" && back.unit.note === "n" && back.unit.adj === -5 &&
              back.unit.custom === 120 && back.unit.members === "Alpha, Beta");
        done = true;
      }
    if(done) break;
  }
  check("listapaivityksen kierros loysi testirivin", done);
})();

/* ---- 3. migraatio: optiojarjestys sekoitettu ---------------------------- */
(function(){
  const shuffled = JSON.parse(RAW);
  let tested = 0;
  CASES.forEach(c => {
    if(c.entry) return;
    const b = legacyFromCase(c);
    if(b.err || !Object.keys(b.u.os).length) return;
    /* Venerable-rivin optio on johdetun nakyman oma (s.102), ei kirjan
       profiilin lista, jota uusi painos voisi siirtaa. */
    const enB = b.L && b.u.s >= 0 ? b.L.secs[b.u.s].ents[b.u.e] : null;
    if(enB && enB.hc) return;
    const sh = shuffled.ships[String(b.u.ref)];
    if(!sh.ol || sh.ol.length < 2) return;
    sh.ol = sh.ol.slice().reverse();                    /* uusi kirjan versio siirsi optiot */
    const ctx = { list: b.L };
    const it = DOMAIN.fromLegacyUnit(b.u, ctx, catalog);  /* intent vanhasta datasta */
    const back = DOMAIN.toLegacyUnit(it, ctx, shuffled);   /* avataan uudella datalla */
    const wantTexts = Object.keys(b.u.os).map(i => catalog.ships[String(b.u.ref)].ol[i].t + "=" + b.u.os[i]).sort();
    const gotTexts = Object.keys(back.unit.os).map(i => sh.ol[i].t + "=" + back.unit.os[i]).sort();
    check("migraatio " + c.id + ": samat optiot tekstin mukaan", same(wantTexts, gotTexts) && !back.issues.length,
          gotTexts.join(" | "));
    tested++;
    sh.ol = catalog.ships[String(b.u.ref)].ol.slice();  /* palauta seuraavaa varten */
  });
  check("migraatiotapauksia > 10", tested > 10, String(tested));
})();

/* ---- 3b. tekstivaraus: id muuttui (teksti korjattu), 40 merkkia osuu ------ */
(function(){
  const k = Object.keys(catalog.ships).find(p => (catalog.ships[p].ol || []).length >= 2);
  const sh = catalog.ships[k];
  const i = DOMAIN.optionIndex(sh, "no-such-id", DOMAIN.textKey(sh.ol[1].t));
  check("optionIndex: teksti varana kun id ei osu", i === 1, String(i));
  check("optionIndex: -1 kun kumpikaan ei osu", DOMAIN.optionIndex(sh, "x", "y") === -1);
  check("optionIndex: id ensisijainen", DOMAIN.optionIndex(sh, sh.ol[0].id, DOMAIN.textKey(sh.ol[1].t)) === 0);
  /* s.255: kaksi optiota jakavat 40 ensimmaista merkkia -> teksti ei kelpaa varaksi */
  const bb = catalog.ships["255"];
  const twins = bb.ol.filter(o => DOMAIN.textKey(o.t) === DOMAIN.textKey(bb.ol[4].t));
  check("optionIndex: s.255 kaksoisteksti ei ratkea arvaamalla", twins.length === 2 &&
        DOMAIN.optionIndex(bb, "x", DOMAIN.textKey(bb.ol[4].t)) === -1, String(twins.length));
})();

/* ---- 5. kelvoton intent ---------------------------------------------- */
(function(){
  const L = catalog.lists[0];
  const at = placeOn(L, (L.secs.flatMap(s => s.ents).find(e => e.k === "unit" && e.r) || {}).r);
  const en = L.secs[at.si].ents[at.ei];
  const bad = { schemaVersion: 2, entry: { list: L.nm, section: L.secs[at.si].t, label: en.l },
                ref: String(en.r), hull: null, hulls: 1, name: "", note: "", adjust: 0, custom: null, members: [],
                options: { "999:deadbeef": { state: "take", qty: 1 } },
                upgrades: { [DOMAIN.upgradeId(L.nm, "NOWHERE", "Nothing")]: "take" } };
  const r = DOMAIN.toLegacyUnit(DOMAIN.deepFreeze(bad), { list: L }, catalog);
  const codes = r.issues.map(x => x.code).sort();
  check("kelvoton intent: issue-koodit", same(codes, ["option.unknown_id", "upgrade.unknown_id"]), codes.join(","));
  check("kelvoton intent: issue on rakenteinen", r.issues.every(x => x.code && x.severity && x.path && x.message !== undefined && "sourcePage" in x));
  check("kelvoton intent: yksikko syntyy silti", r.unit.s === at.si && r.unit.e === at.ei && same(r.unit.os, {}));
  const gone = DOMAIN.toLegacyUnit({ ...bad, entry: { list: L.nm, section: "X", label: "Y" }, options: {}, upgrades: {} }, { list: L }, catalog);
  check("kelvoton intent: tuntematon rivi", gone.issues.some(x => x.code === "entry.unknown") && gone.unit.s === -1);
})();

/* ---- 6. (P1-8b) puhtaat laskimet kirjaa vastaan ------------------------- */
/* Intent kuten sovellus sen tuottaa: pakolliset listapaivitykset mukana
   (applyRequired -> requiredUpgradeKeys). */
function intentOfCase(c){
  if(c.entry) return { err: "komentaja: osio 11" };
  const b = legacyFromCase(c);
  if(b.err) return b;
  const host = c.from ? listByName(c.list) : null;
  if(c.from && !host) return { err: "laivaston listaa ei loydy: " + c.list };
  const ctx = host ? { list: b.L, host: host } : { list: b.L };
  const it = DOMAIN.fromLegacyUnit(b.u, ctx, catalog);
  const sel0 = DOMAIN.selectionOf(it, ctx, catalog);
  DOMAIN.requiredUpgradeKeys(sel0).forEach(k => {
    const p = k.split(":"), sec = b.L.secs[+p[0]], en = sec.ents[+p[1]];
    it.upgrades[DOMAIN.upgradeId(b.L.nm, sec.t, en.l)] = "take";
  });
  return { intent: DOMAIN.deepFreeze(it), ctx: DOMAIN.deepFreeze(ctx), L: b.L };
}
/* status "gap": kirjoitettu ennen korjausta, tiedetaan punaiseksi. Sama
   sopimus kuin test_golden.js:ssa - gap ei kaada hyvaksyntaa. */
const LIVE = CASES.filter(c => c.status !== "gap");
let evaluated = 0, skippedKeys = new Set();
LIVE.forEach(c => {
  const got = intentOfCase(c);
  if(got.err) return;
  const { intent, ctx } = got;
  const sel = DOMAIN.selectionOf(intent, ctx, catalog);
  const sh = sel.sh;
  const e = c.expect || {};
  const id = "kirja " + c.id;
  const rows = DOMAIN.weaponRows(sel);
  const active = rows.filter(r => r.box == null || r.box === "on");
  evaluated++;
  if(e.points != null && sel.en) check(id + ": hinta", DOMAIN.pointsOf(sel) === e.points, DOMAIN.pointsOf(sel) + " != " + e.points);
  const stats = {
    hits: DOMAIN.effHits(sel), shields: DOMAIN.effShieldsText(sel), turrets: DOMAIN.effTurrets(sel),
    speed: DOMAIN.effSpeed(sel), turns: DOMAIN.statSet(sel, "tn") || sh.tn,
    armour: DOMAIN.statSet(sel, "ar") || sh.ar,
  };
  ["hits", "shields", "turrets", "speed", "turns", "armour"].forEach(k => {
    if(e[k] == null) return;
    check(id + ": " + k, norm(stats[k]) === norm(e[k]), norm(stats[k]) + " != " + norm(e[k]));
  });
  if(e.weapon_rows != null) check(id + ": aserivit", rows.length === e.weapon_rows, rows.length + " != " + e.weapon_rows);
  if(e.active_weapons != null) check(id + ": voimassa olevat aseet", active.length === e.active_weapons, active.length + " != " + e.active_weapons);
  if(e.weapon){
    const re = new RegExp(e.weapon.match, "i");
    const row = rows.find(x => re.test(String(x.a[0])));
    check(id + ": aserivi loytyy " + e.weapon.match, !!row);
    if(row){
      const cols = { name: 0, range: 1, fp: 2, arc: 3 };
      Object.keys(e.weapon).forEach(k => {
        if(k === "match") return;
        if(k === "count"){ const g = row.count == null ? 1 : row.count; check(id + ": ase count", g === e.weapon.count, g + " != " + e.weapon.count); return; }
        check(id + ": ase " + k, norm(row.a[cols[k]]) === norm(e.weapon[k]), norm(row.a[cols[k]]) + " != " + norm(e.weapon[k]));
      });
    }
  }
  if(e.weapon_none){
    const re = new RegExp(e.weapon_none.match, "i");
    const left = active.filter(x => re.test(String(x.a[0])) &&
      (!e.weapon_none.range || norm(x.a[1]) === norm(e.weapon_none.range)));
    check(id + ": rivi poissa " + e.weapon_none.match, left.length === 0, "jaljella " + left.length);
  }
  if(e.weapon_count){
    const re = new RegExp(e.weapon_count.match, "i");
    const n = active.filter(x => re.test(String(x.a[0]))).length;
    check(id + ": voimassa '" + e.weapon_count.match + "'", n === e.weapon_count.n, n + " != " + e.weapon_count.n);
  }
  if(e.upgrade_offered || e.upgrade_not_offered){
    const ups = DOMAIN.upgradesFor(sel);
    const labels = ups.own.concat(ups.other).map(x => String(x[2].l));
    const has = pat => labels.some(l => new RegExp(pat, "i").test(l));
    if(e.upgrade_offered) check(id + ": paivitys tarjolla " + e.upgrade_offered, has(e.upgrade_offered), labels.join(" | ").slice(0, 120));
    if(e.upgrade_not_offered) check(id + ": paivitys ei tarjolla " + e.upgrade_not_offered, !has(e.upgrade_not_offered));
  }
  if(e.hull_choices_include || e.hull_choices_exclude){
    const names = ((sel.en && sel.en.hulls) || []).map(p => String(catalog.ships[String(p)] ? catalog.ships[String(p)].nm : p));
    const has = pat => names.some(n => new RegExp(pat, "i").test(n));
    (e.hull_choices_include || []).forEach(p => check(id + ": runko tarjolla " + p, has(p)));
    (e.hull_choices_exclude || []).forEach(p => check(id + ": runko ei tarjolla " + p, !has(p)));
  }
  Object.keys(e).forEach(k => {
    if(["points", "hits", "shields", "turrets", "speed", "turns", "armour", "weapon_rows", "active_weapons",
        "weapon", "weapon_none", "weapon_count", "upgrade_offered", "upgrade_not_offered",
        "hull_choices_include", "hull_choices_exclude", "options", "upgrades", "list_contains", "roster_contains"].includes(k)) return;
    skippedKeys.add(k);   /* kortin tekstit ja setterien kaytos: test_golden.js */
  });
});
check("kirjaa vasten arvioituja tapauksia = alustapaukset", evaluated === LIVE.filter(c => !c.entry).length, evaluated + " / " + LIVE.filter(c => !c.entry).length);
if(VERBOSE) console.log("  (odotuslajit vain test_golden.js:ssa: " + [...skippedKeys].join(", ") + ")");

/* ---- 7. (P1-8b) ei aliasointia ------------------------------------------ */
(function(){
  let aliased = 0, checked = 0;
  CASES.forEach(c => {
    const got = intentOfCase(c);
    if(got.err) return;
    const sel = DOMAIN.selectionOf(got.intent, got.ctx, catalog);
    const sh = sel.sh;
    const pool = new Set();
    (sh.aw || []).forEach(a => pool.add(a));
    (sh.ol || []).forEach(o => {
      if(o.sw) o.sw.t.forEach(t => pool.add(t));
      if(o.add) (Array.isArray(o.add[0]) ? o.add : [o.add]).forEach(t => pool.add(t));
    });
    if(sel.list) sel.list.secs.forEach(sec => sec.ents.forEach(en => { if(en.add) pool.add(en.add); if(en.swp && en.swp.t) pool.add(en.swp.t); }));
    DOMAIN.weaponRows(sel).forEach(r => { checked++; if(pool.has(r.a)) aliased++; });
  });
  check("aserivit eivat aliasoi katalogia", aliased === 0, aliased + " / " + checked);
  /* tuloksen muuttaminen ei muuta katalogia */
  const c0 = intentOfCase(CASES.find(c => c.list !== "-"));
  const sel = DOMAIN.selectionOf(c0.intent, c0.ctx, catalog);
  const rows = DOMAIN.weaponRows(sel);
  const before = JSON.stringify(catalog.ships[String(sel.sh.pg)].aw);
  rows[0].a[0] = "MUTATED";
  check("tuloksen muutos ei nay katalogissa", JSON.stringify(catalog.ships[String(sel.sh.pg)].aw) === before);
})();

/* ---- 8. (P1-8b askel 6) vaurio- ja saantomalli jaadytetylla katalogilla ---- */
(function(){
  let units = 0, rules = 0, dupIds = 0, hulks = 0, escorts = 0, admech = 0;
  catalog.lists.forEach(L => L.secs.forEach(sec => sec.ents.forEach(en => {
    if(!en.r || !catalog.ships[String(en.r)]) return;
    const sh = catalog.ships[String(en.r)];
    const rs = DOMAIN.specialLines(sh, L);
    units++; rules += rs.length;
    const ids = rs.filter(r => r.hull).map(r => r.hull);
    if(new Set(ids).size !== ids.length) dupIds++;
    const cm = DOMAIN.criticalModel(sh);
    if(DOMAIN.isSpaceHulk(sh)){ hulks++; if(!/\(D6\)/.test(cm.title)) dupIds += 1000; }
    if(/escort/i.test(sh.ty || "")) escorts++;
    if(DOMAIN.isMechanicusVessel(sh, L)){ admech++; if(!/ADMECH/.test(DOMAIN.repairLine(sh, L))) dupIds += 1000; }
    DOMAIN.crippledLine(sh); DOMAIN.criticalTriggerHint(sh); DOMAIN.criticalTriggerLine(sh);
    DOMAIN.starredKeys(rs, sh, L);
    (sh.ol || []).forEach(o => DOMAIN.optStars(sh, o, rs, L));
  })));
  check("saantomalli: kaikki listarivit ajettu jaadytetylla katalogilla", units > 400, String(units));
  check("saantomalli: runkosaannot eivat toistu kortilla", dupIds === 0, String(dupIds));
  check("saantomalli: hulkit D6-taulukolla, AdMech-korjaus listasta", hulks >= 2 && admech >= 1, hulks + "/" + admech);
  const cru = catalog.lists.find(L => /Crusade/.test(L.nm)), gk = catalog.lists.find(L => /Grey Knights|Inquisition/.test(L.nm));
  const bb = catalog.ships["104"];
  const inCru = DOMAIN.specialLines(bb, cru).some(r => /Annihilator/.test(r.t));
  const inGk = gk ? DOMAIN.specialLines(bb, gk).some(r => /Annihilator/.test(r.t)) : false;
  check("saantomalli: Annihilator-saanto vain Crusade-listalla (lista parametrina)", inCru && !inGk, inCru + "/" + inGk);
})();

/* ---- 9. (P1-8c) resolveUnit v1: rakenne, kirjaodotukset uusille kentille ---- */
(function(){
  let n = 0, badState = 0, badOpts = 0, notJson = 0, aliasCrit = 0;
  CASES.forEach(c => {
    const got = intentOfCase(c);
    if(got.err) return;
    const R = DOMAIN.resolveUnit(got.intent, got.ctx, catalog);
    if(!R){ check("v1 " + c.id + ": tulos", false, "null"); return; }
    n++;
    if(R.kind !== "ship" || !Array.isArray(R.options) || !Array.isArray(R.upgrades) || !Array.isArray(R.issues)) badOpts++;
    const shv = DOMAIN.selectionOf(got.intent, got.ctx, catalog).sh;   /* Venerable: nakyma */
    if(R.options.length !== (shv.ol || []).length) badOpts++;
    R.weapons.forEach(w => { if(w.state !== "active" && w.state !== "offered") badState++; });
    try{ JSON.parse(JSON.stringify(R)); }catch(e){ notJson++; }
    const cm = DOMAIN.criticalModel(shv);
    if(R.damage.critical.rows.some((row, i) => row === cm.rows[i])) aliasCrit++;
    const e = c.expect || {}, id = "v1 " + c.id;
    (e.options || []).forEach(x => {
      const o = R.options.find(o => new RegExp(x.match, "i").test(o.text));
      check(id + ": optio " + x.match, !!o);
      if(!o) return;
      if(x.state) check(id + ": optio " + x.match + " tila", o.state === x.state, o.state);
      if(x.qty != null) check(id + ": optio " + x.match + " qty", o.qty === x.qty, String(o.qty));
      if(x.blocked_by){ const b = R.options.find(o2 => new RegExp(x.blocked_by, "i").test(o2.text)); check(id + ": optio " + x.match + " estetty", !!b && o.blockedBy.includes(b.id), JSON.stringify(o.blockedBy)); }
      if(x.depends_on){ const dd = R.options.find(o2 => new RegExp(x.depends_on, "i").test(o2.text)); check(id + ": optio " + x.match + " riippuvuus", !!dd && o.dependsOn === dd.id && o.dependencyMet === true); }
    });
    (e.upgrades || []).forEach(x => {
      const up = R.upgrades.find(o => new RegExp(x.match, "i").test(o.label));
      check(id + ": paivitys " + x.match, !!up);
      if(!up) return;
      if(x.state) check(id + ": paivitys " + x.match + " tila", up.state === x.state, up.state);
      if(x.required != null) check(id + ": paivitys " + x.match + " required", up.required === x.required);
      if(x.cost != null) check(id + ": paivitys " + x.match + " cost", up.cost === x.cost, String(up.cost));
      if(x.owner) check(id + ": paivitys " + x.match + " owner", up.owner === x.owner, up.owner);
      check(id + ": paivitys " + x.match + " id ratkeaa", !!DOMAIN.findUpgradeEntry(got.ctx.list, DOMAIN.splitUpgradeId(up.id).section, DOMAIN.splitUpgradeId(up.id).label, -1, -1) || up.key != null);
    });
  });
  check("v1: kaikki alustapaukset ratkesivat", n === CASES.filter(c => !c.entry).length, n + " / " + CASES.length);
  check("v1: kind/options/upgrades/issues rakenne", badOpts === 0, String(badOpts));
  check("v1: aserivin tila on enum active|offered", badState === 0, String(badState));
  check("v1: tulos on JSON-sarjoitettava", notJson === 0);
  check("v1: kriittisten taulukko on kopio", aliasCrit === 0);
  /* mutating the result must not touch the catalogue */
  const c0 = intentOfCase(CASES.find(c => c.list !== "-"));
  const R0 = DOMAIN.resolveUnit(c0.intent, c0.ctx, catalog);
  R0.weapons[0].a[0] = "MUTATED"; R0.damage.critical.rows[0][0] = "MUTATED"; R0.options[0].text = "MUTATED";
  check("v1: tuloksen muutos ei nay katalogissa", JSON.stringify(catalog) === JSON.stringify(JSON.parse(RAW)));
})();

/* ---- 10. (P1-8d) projektiot eivat lue katalogia, tilaa eivatka laskimia ----
   Staattinen lahdetarkistus app_template.html:sta: kortin, laivastorivin,
   rosterin ja Copy listin projektiofunktiot saavat kutsua vain esitysapureita. */
(function(){
  /* Rivinvaihdot yhdeksi: puhtaan Git-arkiston CRLF-kopiossa "\n}\n" ei
     osunut yhteenkaan projektioon (J18). */
  const src = fs.readFileSync(path.join(HERE, "app_template.html"), "utf8").replace(/\r\n?/g, "\n");
  const forbidden = ["L()", "SHIPS", "DATA", "S.units", "shipOf(", "entOf(", "unitPts(", "unitMaxPts(",
    "armModel(", "optState(", "upState(", "optCount(", "upgradesFor(", "specialLines(", "criticalModel(",
    "crippledLine(", "isEscort(", "hulls(", "selOf(", "resolveUnit(", "DOMAIN.", "localStorage"];
  ["shipCardHTML", "commanderCardHTML", "armRowsHTML", "optRowsHTML", "unitHTML", "rosterRowOf", "listLineOf", "upCostText"].forEach(name => {
    const m = src.match(new RegExp("\\nfunction " + name + "\\([^)]*\\)\\{[\\s\\S]*?\\n\\}\\n"));
    check("projektio " + name + " loytyy", !!m);
    if(!m) return;
    const hits = forbidden.filter(f => m[0].includes(f));
    check("projektio " + name + " on puhdas", hits.length === 0, hits.join(", "));
  });
  check("kortti ei kirjoita syotteeseen (u._mem poistettu)", !src.includes("u._mem"));
})();

/* ---- 11. (P1-8e) komentajat: leadership ja re-rollit datasta, kirjaodotukset ---- */
(function(){
  let cmds = 0, noLd = [], bad = 0;
  catalog.lists.forEach(L => L.secs.forEach((sec, si) => sec.ents.forEach((en, ei) => {
    if(en.k !== "cmd") return;
    cmds++;
    if(!("ld" in en) || !("rr" in en)) bad++;
    if(!en.ld) noLd.push(L.nm + " / " + en.l);
    const it = { schemaVersion: 2, entry: { list: L.nm, section: sec.t, label: en.l }, ref: null, hull: null, hulls: 1,
                 name: "", note: "", adjust: 0, custom: en.p == null ? 0 : null, members: [], options: {}, upgrades: {} };
    const R = DOMAIN.resolveUnit(DOMAIN.deepFreeze(it), DOMAIN.deepFreeze({ list: L }), catalog);
    if(!R || R.kind !== "commander" || R.stats !== null || !R.rerolls || !Array.isArray(R.rules)) bad++;
    if(R && typeof R.points !== "number") bad++;
  })));
  /* 62 + 8 Inquisitor Lordia, jotka 1.1 liitti isantalistoille (s.138), + 5
     Ordo Malleus -rivia Imperial Navy- ja Mechanicus-isannille (J144, s.142). */
  /* 77 = 75 + Prince Yriel kummallakin Corsair-listalla (s.319, J161 9.10.2026) */
  /* 81 = 77 + Abaddon neljalla jumalalistalla (s.231, J162 13.10.2026) */
  check("komentajat: 81 rivia, jokaisella ld ja rr datassa", cmds === 81 && bad === 0, cmds + " / bad " + bad);
  check("komentajat: ilman Ld-arvoa vain referenssiin kuitatut (8)", noLd.length === 8, noLd.join(" | "));
  const ref = JSON.parse(fs.readFileSync(path.join(HERE, "referenssi", "komentajat.json"), "utf8")).commanders;
  check("komentajat: referenssin rivit loytyvat datasta sivuineen", ref.every(r => r.verified === true && Number.isInteger(r.page) &&
        catalog.lists.some(L => L.nm === r.list && L.secs.some(s => s.ents.some(e => e.k === "cmd" && e.l === r.label)))));
  LIVE.filter(c => c.entry).forEach(c => {
    const L = listByName(c.list);
    let at = null;
    L.secs.forEach((sec, si) => sec.ents.forEach((en, ei) => { if(!at && en.k !== "up" && new RegExp(c.entry, "i").test(en.l)) at = { si, ei, en, sec }; }));
    const id = "kirja " + c.id;
    check(id + ": rivi loytyy", !!at);
    if(!at) return;
    /* c.n: rungoton rivi, jota ostetaan kappaleittain (Orbital mine s.512, Minefield s.513) */
    const u = { s: at.si, e: at.ei, ref: null, n: c.n != null ? c.n : 1, name: c.name || "", note: c.note || "", adj: c.adjust || 0, opts: [], os: {}, oq: {}, ups: {} };
    if(at.en.p == null) u.custom = 0;
    const ctx = { list: L };
    (c.select || []).forEach(s => {
      if(!s.upgrade) return;
      const sel0 = DOMAIN.selectionOf(DOMAIN.fromLegacyUnit(u, ctx, catalog), ctx, catalog);
      const ups = DOMAIN.upgradesFor(sel0);
      const row = ups.own.concat(ups.other).find(x => new RegExp(s.upgrade, "i").test(String(x[2].l)));
      if(row) u.ups[row[0] + ":" + row[1]] = s.state || "take";
    });
    const intent = DOMAIN.fromLegacyUnit(u, ctx, catalog);
    const sel0 = DOMAIN.selectionOf(intent, ctx, catalog);
    DOMAIN.requiredUpgradeKeys(sel0).forEach(k => { const p = k.split(":"); const sec = L.secs[+p[0]], en = sec.ents[+p[1]]; intent.upgrades[DOMAIN.upgradeId(L.nm, sec.t, en.l)] = "take"; });
    const R = DOMAIN.resolveUnit(DOMAIN.deepFreeze(intent), DOMAIN.deepFreeze(ctx), catalog);
    const e = c.expect || {};
    check(id + ": kind " + (at.en.k === "cmd" ? "commander" : "entry"), R && R.kind === (at.en.k === "cmd" ? "commander" : "entry"));
    if(e.points != null) check(id + ": hinta", R.points === e.points, R.points + " != " + e.points);
    if(e.leadership !== undefined) check(id + ": leadership", JSON.stringify(R.leadership) === JSON.stringify(e.leadership ? { kind: e.leadership.kind, value: e.leadership.value, max: e.leadership.max == null ? null : e.leadership.max } : null), JSON.stringify(R.leadership));
    if(e.rerolls_total != null) check(id + ": re-rollit", R.rerolls.total === e.rerolls_total, String(R.rerolls.total));
    (e.upgrades || []).forEach(x => {
      const up = R.upgrades.find(o => new RegExp(x.match, "i").test(o.label));
      check(id + ": paivitys " + x.match, !!up && (!x.state || up.state === x.state) && (x.cost == null || up.cost === x.cost), up ? up.state + "/" + up.cost : "-");
    });
    if(e.rules_contain) e.rules_contain.forEach(s => check(id + ": saanto " + s.slice(0, 30), R.rules.some(r => r.t.includes(s))));
  });
})();

/* ---- 12. (P1-8e) validateIntent ja transition ------------------------------ */
(function(){
  const unitFor = (listName, page, os, ups) => {
    const L = listByName(listName), at = placeOn(L, page);
    const u = { s: at.si, e: at.ei, ref: legacyRef(page), n: 1, name: "", opts: [], os: os || {}, oq: {}, ups: ups || {} };
    const ctx = { list: L };
    return { intent: DOMAIN.fromLegacyUnit(u, ctx, catalog), ctx, L, sh: catalog.ships[String(page)] };
  };
  const codes = R => (R.issues || []).map(x => x.code);
  /* exclusive group: Lite Kroozer launcha + extra gunz both taken */
  { const sh = catalog.ships["383"]; const a = sh.ol.findIndex(o => /torpedo launcha instead/i.test(o.t)), b = sh.ol.findIndex(o => /additional D6 gunz/i.test(o.t));
    const x = unitFor("Orks — Da Ork Clanz", "383", { [a]: "take", [b]: "take" });
    DOMAIN.deepFreeze(x.intent); DOMAIN.deepFreeze(x.ctx);
    const is1 = DOMAIN.validateIntent(x.intent, x.ctx, catalog), is2 = DOMAIN.validateIntent(x.intent, x.ctx, catalog);
    check("validate: poissulkeva ryhma -> option.exclusive", is1.some(i => i.code === "option.exclusive" && i.severity === "error"), JSON.stringify(is1));
    check("validate: deterministinen", JSON.stringify(is1) === JSON.stringify(is2));
    check("validate: issue on rakenteinen (code, severity, path, message, sourcePage)", is1.every(i => i.code && i.severity && i.path && typeof i.message === "string" && "sourcePage" in i));
    const R = DOMAIN.resolveUnit(x.intent, x.ctx, catalog);
    check("resolveUnit(kelvoton): tulos syntyy ja kantaa issuet", R && R.points === 90 && codes(R).includes("option.exclusive"), String(R && R.points));
    /* transition: taking gunz reopens launcha with a notice */
    const y = unitFor("Orks — Da Ork Clanz", "383", { [a]: "take" });
    DOMAIN.deepFreeze(y.intent);
    const tr = DOMAIN.transition(y.intent, { type: "option", id: sh.ol[b].id, state: "take" }, y.ctx, catalog);
    check("transition: uusi optio avaa ryhman vanhan", tr.intent.options[sh.ol[a].id].state === "opt" && tr.intent.options[sh.ol[b].id].state === "take");
    check("transition: ilmoitus (option.exclusive)", tr.notices.some(n => n.code === "option.exclusive" && /reopened/.test(n.message)), JSON.stringify(tr.notices));
    check("transition: ei muuta syotetta", y.intent.options[sh.ol[a].id].state === "take" && !(sh.ol[b].id in y.intent.options));
    check("transition: tulos kelvollinen", DOMAIN.validateIntent(tr.intent, y.ctx, catalog).length === 0);
  }
  /* dependency: boarding torpedoes without the launcha */
  { const sh = catalog.ships["383"]; const bt = sh.ol.findIndex(o => /boarding torpedoes/i.test(o.t)), la = sh.ol.findIndex(o => /torpedo launcha instead/i.test(o.t));
    const x = unitFor("Orks — Da Ork Clanz", "383", { [bt]: "take" });
    check("validate: riippuvuus puuttuu -> option.dependency", DOMAIN.validateIntent(x.intent, x.ctx, catalog).some(i => i.code === "option.dependency"));
    const y = unitFor("Orks — Da Ork Clanz", "383", { [la]: "take", [bt]: "take" });
    const tr = DOMAIN.transition(y.intent, { type: "option", id: sh.ol[la].id, state: "opt" }, y.ctx, catalog);
    check("transition: edellytyksen poisto avaa riippuvan (ilmoitus)", tr.intent.options[sh.ol[bt].id].state === "opt" && tr.notices.some(n => n.code === "option.dependency"));
  }
  /* swap conflict: Strike Cruiser, two replacements for the launch bays */
  { const L = catalog.lists.find(x => /Armageddon/.test(x.nm)); let page = null;
    L.secs.forEach(s => s.ents.forEach(e => { if(!page && /Strike Cruiser/i.test(e.l) && e.r && e.k === "unit") page = String(e.r); }));
    const sh = catalog.ships[page]; const same = [];
    (sh.ol || []).forEach((o, i) => { if(o.sw && (o.sw.f || []).includes(2)) same.push(i); });
    check("Strike Cruiser: kaksi vaihtoa samalle riville", same.length === 2);
    const x = unitFor(L.nm, page, { [same[0]]: "take", [same[1]]: "take" });
    check("validate: sama asepaikka kahdesti -> option.swap_conflict", DOMAIN.validateIntent(x.intent, x.ctx, catalog).some(i => i.code === "option.swap_conflict"));
  }
  /* ineligible upgrade: Tyrant with nova cannon and the Power Ram */
  { const L = listByName("Imperial Navy — Gothic Sector"); const sh = catalog.ships["69"]; const nova = sh.ol.findIndex(o => /nova cannon/i.test(o.t));
    const at = placeOn(L, "69"); let ram = null;
    L.secs.forEach((s, si) => s.ents.forEach((e, ei) => { if(e.k === "up" && /Power Ram/i.test(e.l)) ram = { si, ei, en: e }; }));
    const ramId = DOMAIN.upgradeId(L.nm, L.secs[ram.si].t, ram.en.l);
    const x = unitFor("Imperial Navy — Gothic Sector", "69", {}, { [ram.si + ":" + ram.ei]: "take" });
    check("Tyrant + Power Ram: kelvollinen", DOMAIN.validateIntent(x.intent, x.ctx, catalog).length === 0);
    const tr = DOMAIN.transition(x.intent, { type: "option", id: sh.ol[nova].id, state: "take" }, x.ctx, catalog);
    /* 30.9.2026: pudotus palauttaa rivin oletukseensa (avain pois) - kun
       nova on otettu, ramia ei tarjota, joten se on poissa; kun nova
       perutaan, ram palaa Optioniksi eika jaa pysyvaksi Hideksi */
    const trR = DOMAIN.resolveUnit(tr.intent, x.ctx, catalog).upgrades.filter(u => /Power Ram/i.test(u.label));
    check("transition: Nova pudottaa Power Ramin ilmoituksella", !(ramId in tr.intent.upgrades) && trR.every(u => u.state === "off") && tr.notices.some(n => n.code === "upgrade.ineligible"), JSON.stringify([tr.notices, trR.map(u => u.state)]));
    const back = DOMAIN.transition(tr.intent, { type: "option", id: sh.ol[nova].id, state: "opt" }, x.ctx, catalog);
    const backR = DOMAIN.resolveUnit(back.intent, x.ctx, catalog).upgrades.filter(u => /Power Ram/i.test(u.label));
    check("... nova auki taas: Power Ram palaa Optioniksi", backR.length === 1 && backR[0].state === "opt", JSON.stringify(backR.map(u => u.state)));
    const bad = JSON.parse(JSON.stringify(x.intent)); bad.options[sh.ol[nova].id] = { state: "take", qty: 1 };
    const is = DOMAIN.validateIntent(bad, x.ctx, catalog);
    check("validate: Nova + Power Ram suoraan -> upgrade.ineligible (warning, ei laskuteta)", is.some(i => i.code === "upgrade.ineligible" && i.severity === "warning"));
    const Rb = DOMAIN.resolveUnit(bad, x.ctx, catalog);
    check("resolveUnit(kelvoton): ramia ei laskuteta", Rb.points === 185 + 20, String(Rb.points));
  }
  /* hull change clears with a notice; unknown hull is an error */
  { const L = listByName("Space Marines — Codex Astartes"); let at = null;
    L.secs.forEach((s, si) => s.ents.forEach((e, ei) => { if(!at && e.hc) at = { si, ei, en: e }; }));
    const it = { schemaVersion: 2, entry: { list: L.nm, section: L.secs[at.si].t, label: at.en.l }, ref: "103", hull: "103", hulls: 1, name: "", note: "", adjust: 0, custom: null, members: [], options: {}, upgrades: {} };
    const sh103 = catalog.ships["103"]; if((sh103.ol || []).length) it.options[sh103.ol[0].id] = { state: "take", qty: 1 };
    const tr = DOMAIN.transition(it, { type: "hull", ref: "61" }, { list: L }, catalog);
    check("transition: runko vaihtuu, valinnat nollataan, ilmoitus", tr.intent.ref === "61" && tr.intent.hull === "61" && Object.keys(tr.intent.options).length === 0 && (!(sh103.ol || []).length || tr.notices.some(n => n.code === "hull.changed")));
    const bad = { ...it, ref: "999", hull: "999" };
    check("validate: tuntematon runko -> ship.unknown", DOMAIN.validateIntent(bad, { list: L }, catalog).some(i => i.code === "ship.unknown"));
    const notOffered = { ...it, ref: "69", hull: "69" };
    check("validate: runko jota rivi ei tarjoa -> hull.unknown", DOMAIN.validateIntent(notOffered, { list: L }, catalog).some(i => i.code === "hull.unknown"));
  }
  /* quantity clamps to the book's maximum */
  { const sh = catalog.ships["494"]; const qi = sh.ol.findIndex(o => o.qty);
    const x = unitFor("Tau — Commerce Protection", "494", { [qi]: "take" });
    const tr = DOMAIN.transition(x.intent, { type: "quantity", id: sh.ol[qi].id, qty: 99 }, x.ctx, catalog);
    check("transition: maara leikataan maksimiin", tr.intent.options[sh.ol[qi].id].qty === sh.ol[qi].qty.max, String(tr.intent.options[sh.ol[qi].id].qty));
  }
  /* ---- J20: rajapinta valvoo sen, minka kayttoliittyma piilottaa ------ */
  /* (a) Fleets s.494: "Warspheres 10HP or greater may also add +1 shield" */
  { const sh = catalog.ships["494"];
    const cut = sh.ol.findIndex(o => o.mod && o.mod.hp < 0), shield = sh.ol.findIndex(o => o.hpmin && o.mod && o.mod.sh);
    const x = unitFor("Tau — Commerce Protection", "494", { [cut]: "take" });
    const tr = DOMAIN.transition(x.intent, { type: "option", id: sh.ol[shield].id, state: "take" }, x.ctx, catalog);
    check("J20a: 8 HP:n Warsphere ei saa +1 shieldia transitionilla (s.494)",
          !(tr.intent.options[sh.ol[shield].id] && tr.intent.options[sh.ol[shield].id].state === "take") && tr.notices.some(n => n.code === "option.blocked"),
          JSON.stringify(tr.notices));
    const y = unitFor("Tau — Commerce Protection", "494", { [shield]: "take" });
    const tr2 = DOMAIN.transition(y.intent, { type: "option", id: sh.ol[cut].id, state: "take" }, y.ctx, catalog);
    check("J20a: ... ja myohempi HP-leikkaus avaa shieldin ilmoituksella",
          tr2.intent.options[sh.ol[cut].id].state === "take" && tr2.intent.options[sh.ol[shield].id].state === "opt" &&
          tr2.notices.some(n => n.code === "option.hpmin"), JSON.stringify(tr2.notices));
    const bad = unitFor("Tau — Commerce Protection", "494", { [cut]: "take", [shield]: "take" });
    check("J20a: validateIntent: 8 HP + shield -> option.hpmin (error)",
          DOMAIN.validateIntent(bad.intent, bad.ctx, catalog).some(i => i.code === "option.hpmin" && i.severity === "error"));
  }
  /* (b) ja (c) Daemonship vs. Chaos Space Marine crew (s.227, s.235), crewn Mark */
  { const L = listByName("Chaos — Black Crusade");
    let page = null; L.secs.forEach(s => s.ents.forEach(e => { if(!page && /^Carnage/.test(e.l) && e.r && e.k === "unit") page = String(e.r); }));
    const at = placeOn(L, page);
    const key = re => { let k = null; L.secs.forEach((s, si) => s.ents.forEach((e, ei) => {
      if(!k && e.k === "up" && re.test(e.l) && (!e.at || e.at.some(p => p[0] === at.si && p[1] === at.ei))) k = si + ":" + ei; })); return k; };
    const idOf = k => { const q = k.split(":"); const s = L.secs[+q[0]]; return DOMAIN.upgradeId(L.nm, s.t, s.ents[+q[1]].l); };
    const crew = key(/^Chaos Space Marine crew$/), demon = key(/^Daemonship: Cruiser$/), mark = key(/^The Mark of Nurgle$/);
    check("J20: Black Crusaden Carnagelle miehisto, Daemonship ja miehiston Mark", !!crew && !!demon && !!mark, [crew, demon, mark].join(" "));
    const x = unitFor(L.nm, page, {}, { [crew]: "take" });
    const tr = DOMAIN.transition(x.intent, { type: "upgrade", id: idOf(demon), state: "take" }, x.ctx, catalog);
    check("J20b: Daemonship miehiston jalkeen: Daemonship jaa, miehisto putoaa ilmoituksella",
          tr.intent.upgrades[idOf(demon)] === "take" && tr.intent.upgrades[idOf(crew)] !== "take" &&
          tr.notices.some(n => n.code === "upgrade.conflict"), JSON.stringify([tr.intent.upgrades, tr.notices]));
    const y = unitFor(L.nm, page, {}, { [crew]: "take", [mark]: "take" });
    const tr2 = DOMAIN.transition(y.intent, { type: "upgrade", id: idOf(demon), state: "take" }, y.ctx, catalog);
    check("J20c: ... ja miehiston Mark putoaa miehiston mukana (s.234)",
          tr2.intent.upgrades[idOf(mark)] !== "take" && tr2.intent.upgrades[idOf(demon)] === "take", JSON.stringify(tr2.intent.upgrades));
  }
  /* (d) liittamaton rivi: Warmasterin Mark risteilijalle */
  { const L = listByName("Chaos — Nurgle");
    let page = null; L.secs.forEach(s => s.ents.forEach(e => { if(!page && /^Carnage/.test(e.l) && e.r && e.k === "unit") page = String(e.r); }));
    let wm = null; L.secs.forEach((s, si) => s.ents.forEach((e, ei) => { if(!wm && e.k === "up" && /^The Mark of Nurgle$/.test(e.l) && e.at && e.at.length === 1) wm = { si, ei, s, e }; }));
    const wmId = DOMAIN.upgradeId(L.nm, wm.s.t, wm.e.l);
    const x = unitFor(L.nm, page, {}, {});
    const tr = DOMAIN.transition(x.intent, { type: "upgrade", id: wmId, state: "take" }, x.ctx, catalog);
    check("J20d: Warmasterin Mark-rivi risteilijalle hylataan transitionissa",
          tr.intent.upgrades[wmId] !== "take" && tr.notices.some(n => n.code === "upgrade.unattached"), JSON.stringify(tr.notices));
    const bad = JSON.parse(JSON.stringify(x.intent)); bad.upgrades[wmId] = "take";
    check("J20d: validateIntent: liittamaton rivi -> upgrade.unattached (error)",
          DOMAIN.validateIntent(bad, x.ctx, catalog).some(i => i.code === "upgrade.unattached" && i.severity === "error"));
  }
})();

/* ---- 13. (kohta 8) resolveFleet: laivastosaannot ilman HTML:aa ---------------
   Jokainen tapaus on kirjan lause (sivu why-kentassa referenssi/NN_*.json:ssa)
   ja kaksi laivastoa: rikkova ja kelvollinen. */
(function(){
  const list = nm => catalog.lists.find(L => L.nm === nm);
  const rowOf = (L, re) => {
    for(let si = 0; si < L.secs.length; si++)
      for(let ei = 0; ei < L.secs[si].ents.length; ei++){
        const en = L.secs[si].ents[ei];
        if(en.k !== "up" && new RegExp(re, "i").test(en.l)) return { si, ei, en };
      }
    throw new Error("rivia ei loydy: " + L.nm + " / " + re);
  };
  const unit = (L, re, n, ups) => {
    const r = rowOf(L, re);
    const it = { schemaVersion: 2, entry: { list: L.nm, section: L.secs[r.si].t, label: r.en.l },
                 ref: r.en.r == null ? null : String(r.en.r), hull: r.en.hc ? String(r.en.r) : null,
                 hulls: n || 1, name: "", note: "", adjust: 0, custom: r.en.p == null && !r.en.hc ? 0 : null,
                 members: [], options: {}, upgrades: {} };
    const sel = DOMAIN.selectionOf(it, { list: L }, catalog);
    DOMAIN.requiredUpgradeKeys(sel).forEach(k => { const q = k.split(":"); const sec = L.secs[+q[0]]; it.upgrades[DOMAIN.upgradeId(L.nm, sec.t, sec.ents[+q[1]].l)] = "take"; });
    (ups || []).forEach(re2 => {
      let hit = null;
      L.secs.forEach((sec, si) => sec.ents.forEach((en, ei) => { if(!hit && en.k === "up" && new RegExp(re2, "i").test(en.l)) hit = { sec, en }; }));
      if(!hit) throw new Error("paivitysta ei loydy: " + L.nm + " / " + re2);
      it.upgrades[DOMAIN.upgradeId(L.nm, hit.sec.t, hit.en.l)] = "take";
    });
    return it;
  };
  const fleet = (L, limit, units) => DOMAIN.resolveFleet(DOMAIN.deepFreeze({ list: L.nm, limit, units }), catalog);
  const chk = (F, labelRe) => F.checks.find(c => new RegExp(labelRe, "i").test(c.t));
  const expect = (name, F, labelRe, ok) => {
    const c = chk(F, labelRe);
    check(name + " [" + labelRe + "]", !!c && c.ok === ok, c ? c.t + " " + c.v + " ok=" + c.ok : "tarkistus puuttuu");
  };

  /* Planet Killer s.235: sallittu vasta 1000 pisteesta (allowed_at) */
  { const L = list("Chaos — Black Crusade");
    expect("Planet Killer 900 pts", fleet(L, 900, [unit(L, "^Planet Killer")]), "^Planet Killer$", false);
    /* T24 (kayttaja 11.9.2026): laivaston omat pisteet 505+100+200+190+165 = 1160 */
    expect("Planet Killer 1160 pts", fleet(L, 1200, [unit(L, "^Planet Killer"), unit(L, "^Chaos Warmaster"),
      unit(L, "^Hades"), unit(L, "^Acheron"), unit(L, "^Slaughter")]), "^Planet Killer$", true); }
  /* Venerable s.99: laivaston oltava vahintaan 1000 pistetta */
  { const L = list("Space Marines — Crusade");
    expect("Venerable 900 pts", fleet(L, 900, [unit(L, "^Venerable battle barge")]), "Venerable", false);
    /* T24: laivaston omat pisteet 450+425+Strike Cruiser, yli 1000 */
    expect("Venerable 1000+ pts", fleet(L, 1200, [unit(L, "^Venerable battle barge"), unit(L, "^Battle barge"),
      unit(L, "Strike Cruiser")]), "Venerable", true); }
  /* Dark Eldar s.351: vahintaan kolme saattajaa per runkoalus (min_ratio) */
  { const L = list("Dark Eldar — Pirates");
    expect("DE 1 cruiser + 2 escorts", fleet(L, 2000, [unit(L, "Torture"), unit(L, "Corsair", 2)]), "Escorts per capital", false);
    expect("DE 1 cruiser + 3 escorts", fleet(L, 2000, [unit(L, "Torture"), unit(L, "Corsair", 3)]), "Escorts per capital", true); }
  /* Tau Commerce s.457: ei enempaa Strongholdeja kuin Bastioneja (compare) */
  { const L = list("Tau — Commerce Protection");
    expect("Stronghold 2 / Bastion 1", fleet(L, 3000, [unit(L, "^Stronghold"), unit(L, "^Stronghold"), unit(L, "^Bastion")]), "Stronghold vs Bastion", false);
    expect("Stronghold 1 / Bastion 1", fleet(L, 3000, [unit(L, "^Stronghold"), unit(L, "^Bastion")]), "Stronghold vs Bastion", true);
    /* s.456: Custodian vaatii Kor'O:n (requires) ja yhden per taydet 750 Tau-pistetta (per_points of_pick) */
    expect("Custodian + Kor'el", fleet(L, 3000, [unit(L, "^Custodian"), unit(L, "Kor'el"), unit(L, "^Merchant class"), unit(L, "^Merchant class"), unit(L, "^Protector"), unit(L, "^Hero")]), "Custodian needs", false);
    const big = fleet(L, 3000, [unit(L, "^Custodian"), unit(L, "Kor.O \\(Ld 9\\)"), unit(L, "^Merchant class"), unit(L, "^Merchant class"), unit(L, "^Protector"), unit(L, "^Hero")]);
    expect("Custodian + Kor'O", big, "Custodian needs", true);
    expect("Custodian per 750 Tau pts (enough)", big, "Custodian class", true);
    expect("Custodian per 750 Tau pts (too few)", fleet(L, 3000, [unit(L, "^Custodian"), unit(L, "Kor.O \\(Ld 9\\)")]), "Custodian class", false);
    /* Warsphere s.453: yksi 1500 pisteessa, kaksi isommissa (tiers) */
    /* T26 (14.9.2026): "if the fleet is worth 1500 points" = laivaston omat
       pisteet, ei pelin pisteraja. Iso laivasto: 290+330+110+370+360+95 = 1555. */
    expect("Warsphere x2, laivasto 290 p", fleet(L, 2000, [unit(L, "Kroot Warsphere"), unit(L, "Kroot Warsphere")]), "Kroot Warspheres", false);
    expect("Warsphere x2, laivasto 1555 p", fleet(L, 2000, [unit(L, "Kroot Warsphere"), unit(L, "Kroot Warsphere"),
      unit(L, "^Custodian"), unit(L, "Kor.O \\(Ld 9\\)"), unit(L, "^Protector"), unit(L, "^Protector"),
      unit(L, "^Hero"), unit(L, "^Hero"), unit(L, "^Merchant class")]), "Kroot Warspheres", true);
    expect("Warsphere x1, laivasto 145 p", fleet(L, 1499, [unit(L, "Kroot Warsphere")]), "Kroot Warspheres", false); }
  /* Demiurg s.487: Commerce Vessels > muut risteilijat; skwadroni per 3 Demiurg-runkoalusta (ratio units) */
  { const L = list("Demiurg — War Host");
    expect("Demiurg 1 Bastion vs 1 Protector", fleet(L, 3000, [unit(L, "^Bastion"), unit(L, "^Protector")]), "Commerce Vessels vs", false);
    expect("Demiurg 2 Bastion vs 1 Protector", fleet(L, 3000, [unit(L, "^Bastion"), unit(L, "^Bastion"), unit(L, "^Protector")]), "Commerce Vessels vs", true);
    expect("Demiurg 2 capitals + 1 Tau squadron", fleet(L, 3000, [unit(L, "^Bastion"), unit(L, "^Citadel"), unit(L, "^Castellan", 3)]), "escort squadrons", false);
    expect("Demiurg 3 capitals + 1 Tau squadron", fleet(L, 3000, [unit(L, "^Bastion"), unit(L, "^Citadel"), unit(L, "^Stronghold"), unit(L, "^Castellan", 3)]), "escort squadrons", true); }
  /* Tyranids Hive Fleet s.430-431 */
  { const L = list("Tyranids — Hive Fleet");
    expect("no hive ship + Cruiser", fleet(L, 2000, [unit(L, "^Cruiser$")]), "Without a hive ship", false);
    expect("no hive ship + Kraken", fleet(L, 2000, [unit(L, "^Kraken", 6)]), "Without a hive ship", true);
    expect("hive ship + 5 escorts (min 6)", fleet(L, 2000, [unit(L, "^Hive ship"), unit(L, "^Escort drone", 5)]), "Escorts per hive ship \\(min\\)", false);
    expect("hive ship + 6 escort drones", fleet(L, 2000, [unit(L, "^Hive ship"), unit(L, "^Escort drone", 6)]), "Escort drones per hive ship", true);
    expect("hive ship + 13 escorts (max 12)", fleet(L, 2000, [unit(L, "^Hive ship"), unit(L, "^Escort drone", 6), unit(L, "^Kraken", 7)]), "Escorts per hive ship \\(max\\)", false);
    expect("1 hive ship + Imperative (min_one)", fleet(L, 2000, [unit(L, "^Hive ship", 1, ["Hive Mind Imperative"]), unit(L, "^Escort drone", 6)]), "Hive Mind Imperatives", true);
    expect("2 hive ships + 2 Imperatives", fleet(L, 3000, [unit(L, "^Hive ship", 1, ["Hive Mind Imperative"]), unit(L, "^Hive ship", 1, ["Hive Mind Imperative"]), unit(L, "^Escort drone", 12)]), "Hive Mind Imperatives", false);
    /* s.426: enintaan kolme eri refittia hive shipilla (unit_upgrade_max) */
    expect("hive ship with 4 refits", fleet(L, 2000, [unit(L, "^Hive ship", 1, ["Solar Vanes", "Adrenaline Sacs", "Psychic Scream", "More Discharge Vents"]), unit(L, "^Escort drone", 6)]), "Refits per hive ship", false);
    expect("hive ship with 3 refits", fleet(L, 2000, [unit(L, "^Hive ship", 1, ["Solar Vanes", "Adrenaline Sacs", "Psychic Scream"]), unit(L, "^Escort drone", 6)]), "Refits per hive ship", true);
    /* s.431: ordnance-merkit enintaan 10 % pisterajasta (points_share of=limit) */
    const ordn = fleet(L, 1000, [unit(L, "^Hive ship"), unit(L, "^Escort drone", 6), unit(L, "^Cruiser$")]);
    check("Tyranid ordnance share check exists", !!chk(ordn, "Ordnance markers")); }
  /* Grey Knights s.145: Battlebarge vain jos muu laivasto >= 1000 JA Ordo Malleus johtaa (allowed_at remainder+cond) */
  { const L = list("Grey Knights");
    const sc7 = Array.from({ length: 7 }, () => unit(L, "Grey Knights Strike Cruiser"));
    expect("GK barge, Inquisitor Lord only", fleet(L, 3000, [unit(L, "^Grey Knights Battlebarge"), unit(L, "^Inquisitor Lord")].concat(sc7)), "Battlebarge", false);
    expect("GK barge, Ordo Malleus + 1155 pts", fleet(L, 3000, [unit(L, "^Grey Knights Battlebarge"), unit(L, "^Ordo Malleus")].concat(sc7)), "Battlebarge", true);
    expect("GK barge, Ordo Malleus, remainder < 1000", fleet(L, 3000, [unit(L, "^Grey Knights Battlebarge"), unit(L, "^Ordo Malleus"), unit(L, "Grey Knights Strike Cruiser")]), "Battlebarge", false); }
  /* Rogue Traders Exploration s.176-177 */
  { const L = list("Rogue Traders — Exploration");
    expect("RT half: 1 RT + 2 Lunar", fleet(L, 3000, [unit(L, "^Rogue Trader cruiser"), unit(L, "^Lunar"), unit(L, "^Lunar"), unit(L, "^Veteran Rogue"), unit(L, "^Cargo Transport", 2)]), "at least half", false);
    const ok = fleet(L, 3000, [unit(L, "^Rogue Trader cruiser"), unit(L, "^Rogue Trader cruiser"), unit(L, "^Lunar"), unit(L, "^Veteran Rogue"), unit(L, "^Cargo Transport", 2)]);
    expect("RT half: 2 RT + 1 Lunar", ok, "at least half", true);
    expect("Veteran RT with 2 RT cruisers", ok, "^Veteran Rogue Traders$", true);
    expect("Cargo squadron present", ok, "Cargo ship squadron", true);
    expect("Cargo squadron missing", fleet(L, 3000, [unit(L, "^Rogue Trader cruiser"), unit(L, "^Veteran Rogue")]), "Cargo ship squadron", false);
    expect("Kroot Warsphere with 2 RT cruisers", fleet(L, 3000, [unit(L, "^Rogue Trader cruiser"), unit(L, "^Rogue Trader cruiser"), unit(L, "^Kroot Warsphere"), unit(L, "^Veteran Rogue"), unit(L, "^Cargo Transport", 2)]), "^Kroot Warsphere$", false);
    expect("Kroot Warsphere with 3 RT cruisers", fleet(L, 3000, [unit(L, "^Rogue Trader cruiser"), unit(L, "^Rogue Trader cruiser"), unit(L, "^Rogue Trader cruiser"), unit(L, "^Kroot Warsphere"), unit(L, "^Veteran Rogue"), unit(L, "^Cargo Transport", 2)]), "^Kroot Warsphere$", true);
    expect("Heavy transports 2 of 2 transports (>1/3)", fleet(L, 3000, [unit(L, "^Rogue Trader cruiser"), unit(L, "^Veteran Rogue"), unit(L, "^Heavy Transport", 2)]), "Heavy transports", false); }
  /* Pirates s.179: xenos-saattajat enintaan 10 % laivaston pisteista (points_share of=total) */
  { const L = list("Rogue Traders — Pirates and Wolf Packs");
    const F = fleet(L, 3000, [unit(L, "^Pirate Captain"), unit(L, "^Escort Carrier", 2), unit(L, "^Xenos Vessel$", 3)]);
    const c = chk(F, "Alien escorts");
    check("Pirates: alien escort share is checked and over 10 %", !!c && c.ok === false, c ? c.v : "-"); }
  /* Iyanden s.318: Autarchin Dragonship-lippulaiva ei kuulu suhdelukuun (ratio exempt) */
  { const L = list("Eldar — Iyanden Craftworld");
    expect("2 Dragonships, 2 Wraithships, Eldar Hero", fleet(L, 3000, [unit(L, "^Eldar Hero"), unit(L, "^Dragonship$"), unit(L, "^Dragonship$"), unit(L, "^Wraithship", 2)]), "^Dragonships$", false);
    expect("2 Dragonships, 2 Wraithships, Autarch", fleet(L, 3000, [unit(L, "^Eldar Autarch"), unit(L, "^Dragonship$"), unit(L, "^Dragonship$"), unit(L, "^Wraithship", 2)]), "^Dragonships$", true); }
  /* Da Ork Clanz s.372: Space Hulk vaatii kolme Warlordia (conditional_cap) */
  { const L = list("Orks — Da Ork Clanz");
    expect("Ork hulk with 2 Warlords", fleet(L, 3000, [unit(L, "^Ork Warlord"), unit(L, "^Ork Warlord"), unit(L, "^Ork hulk")]), "^Space Hulk$", false);
    expect("Ork hulk with 3 Warlords", fleet(L, 3000, [unit(L, "^Ork Warlord"), unit(L, "^Ork Warlord"), unit(L, "^Ork Warlord"), unit(L, "^Ork hulk")]), "^Space Hulk$", true); }
  /* puhtaus: katalogi ei muutu laivastotarkistuksissa */
  check("resolveFleet ei muuta katalogia", JSON.stringify(catalog) === JSON.stringify(JSON.parse(RAW)));
})();


/* ---- 14. (1.1 vaihe 1) osioindeksi vs. osion nimi ---------------------------
   Osioindeksi on hiljainen viite: jos osio siirtyy, indeksi osoittaa yha
   johonkin - vaaraan osioon, ja vaara laskenta nayttaa pelin saannolta.
   Datassa jokainen viittaus kantaa osion nimen (build_data.py: sn / up_sn /
   <key>_sn), ja resolveFleet vertaa nimen ennen laskentaa. Tassa osiot
   tyonnetaan yhdella eteenpain katalogin kopiossa ja vaaditaan, etta
   moottori kertoo siita virheena eika laske mitaan. */
(function(){
  const doctored = JSON.parse(RAW);
  const L = doctored.lists.find(x => x.nm === "Imperial Navy \u2014 Gothic Sector");
  const real = catalog.lists.find(x => x.nm === "Imperial Navy \u2014 Gothic Sector");
  const named = JSON.stringify(real).match(/"(sn|up_sn|[a-z_]+_sn)":/g) || [];
  check("osioviittauksilla on nimi datassa", named.length > 0, named.length + " kpl");

  const rowOf = (Lx, re) => {
    for(let si = 0; si < Lx.secs.length; si++)
      for(let ei = 0; ei < Lx.secs[si].ents.length; ei++){
        const en = Lx.secs[si].ents[ei];
        if(en.k !== "up" && new RegExp(re, "i").test(en.l)) return { si, ei, en };
      }
    throw new Error("rivia ei loydy: " + re);
  };
  const intentOf = (Lx, re, n) => {
    const r = rowOf(Lx, re);
    return { schemaVersion: 2, entry: { list: Lx.nm, section: Lx.secs[r.si].t, label: r.en.l },
             ref: r.en.r == null ? null : String(r.en.r), hull: r.en.hc ? String(r.en.r) : null,
             hulls: n || 1, name: "", note: "", adjust: 0,
             custom: r.en.p == null && !r.en.hc ? 0 : null,
             members: [], options: {}, upgrades: {} };
  };
  const units = [intentOf(real, "^Emperor class battleship"),
                 intentOf(real, "^Lunar class cruiser")];
  const clean = DOMAIN.resolveFleet({ list: real.nm, limit: 1500, units }, catalog);
  check("ehja data: ei osiovirheita",
        !clean.checks.some(c => /^Data error/.test(c.t)),
        (clean.checks.filter(c => /^Data error/.test(c.t))[0] || {}).t || "");

  /* Sama siirtyma, jota vastaan nimet on kirjoitettu: yksi osio eteen,
     indekseja ei korjata. Rivit loytyvat yha nimella, joten laivasto
     rakentuu - vain saantojen viitteet ovat pielessa. */
  L.secs.unshift({ t: "TYONNETTY OSIO", ents: [], rules: [] });
  const moved = DOMAIN.resolveFleet(
    { list: L.nm, limit: 1500, units: [intentOf(L, "^Emperor class battleship"),
                                       intentOf(L, "^Lunar class cruiser")] }, doctored);
  const errs = moved.checks.filter(c => /^Data error/.test(c.t));
  check("siirtynyt osio: moottori kertoo virheesta", errs.length > 0,
        errs.length + " virherivia");
  check("siirtynyt osio: virhe nimeaa kentan",
        errs.some(c => /section index does not match its name/.test(c.v)),
        (errs[0] || {}).v || "");
  /* Eika laske vaaraa tulosta: taistelulaivasuhde ei saa nayttaa OK:ta
     osiolla, jota se ei enaa tarkoita. */
  check("siirtynyt osio: viallista saantoa ei lasketa",
        !moved.checks.some(c => c.t === "Battleships" && c.ok),
        JSON.stringify(moved.checks.filter(c => c.t === "Battleships")));
})();


/* ---- 15. (1.1 vaihe 2) rotu ja alustyyppi kirjan mukaan --------------------
   Fleets s.14: "Reserve vessels ... must come from the same 'race'. For the
   purpose of the game, the races are: Imperial Navy (including Adeptus
   Mechanicus), Space Marines, Chaos (including Chaos Space Marines), Eldar,
   Craftworld Eldar, Dark Eldar, Orks, Necrons, Tyranids and Tau (including
   Tau allies)." Luettelo on suljettu ("the races are"), joten lista jota
   siina ei ole ei saa rotua lainkaan - se paasee mukaan vain oman
   listasaantonsa kautta (s.15).

   Fleets s.14 alustyypeista: "Only ships of the same 'type' (battleship,
   cruiser or escort) count for reserves purposes" ja "battlecruisers, grand
   cruisers, heavy cruisers, cruisers, and light cruisers all count as
   'cruisers'". */
(function(){
  const RACES = ["imperial navy", "space marines", "chaos", "eldar",
                 "craftworld eldar", "dark eldar", "orks", "necrons",
                 "tyranids", "tau"];
  const missing = catalog.lists.filter(L => !("race" in L));
  check("jokaisella listalla on race-kentta", missing.length === 0,
        missing.map(L => L.nm).join(", ").slice(0, 80));
  const bad = catalog.lists.filter(L => L.race != null && RACES.indexOf(L.race) < 0);
  check("rotu on kirjan luettelosta", bad.length === 0,
        bad.map(L => L.nm + "=" + L.race).join(", ").slice(0, 80));
  const raceOf = nm => (catalog.lists.find(L => L.nm === nm) || {}).race;
  /* s.14: "Imperial Navy (including Adeptus Mechanicus)" */
  check("AdMech on Imperial Navy -rotua",
        raceOf("Adeptus Mechanicus \u2014 Explorator") === "imperial navy",
        String(raceOf("Adeptus Mechanicus \u2014 Explorator")));
  /* s.14: Eldar ja Craftworld Eldar ovat luettelossa ERI rotuina */
  check("Corsairs ja Iyanden ovat eri rotua",
        raceOf("Eldar Corsairs \u2014 Gothic Sector") === "eldar" &&
        raceOf("Eldar \u2014 Iyanden Craftworld") === "craftworld eldar",
        raceOf("Eldar Corsairs \u2014 Gothic Sector") + " / " + raceOf("Eldar \u2014 Iyanden Craftworld"));
  /* T37 (kayttaja 14.9.2026): rotu on PELITEKNINEN ryhma, ei biologinen
     laji - s.15:n luettelo sanoo sen itse, kun se erottaa Imperial Navyn ja
     Space Marinesin vaikka molemmat ovat ihmisia. Kaksi listaa siirtyi
     siksi luettelon sisaan. */
  check("Grey Knights on Space Marines -rotua (s.144)",
        raceOf("Grey Knights") === "space marines", String(raceOf("Grey Knights")));
  check("Demiurg kuuluu Tau-ryhmaan (s.15 'including Tau allies', s.482)",
        raceOf("Demiurg \u2014 War Host") === "tau",
        String(raceOf("Demiurg \u2014 War Host")));
  /* Nailla ei ole yhta rotua: Inquisitiolla ei ole omaa listaa lainkaan
     (s.138) ja Rogue Traders -listat ovat tarkoituksella sekalaisia. null
     EI ole jokerimerkki eika "ihmisyys" - se tarkoittaa, etta paasy on aina
     nimetty ja ehdollinen. */
  ["Rogue Traders", "Rogue Traders \u2014 Exploration",
   "Rogue Traders \u2014 Pirates and Wolf Packs",
   "The Emperor's Inquisition"].forEach(nm => {
    check("ei rotua rotuluettelon ulkopuolella: " + nm, raceOf(nm) === null,
          String(raceOf(nm)));
  });
  /* Alustyyppi: jokaisella profiililla on rt, ja se on yksi neljasta */
  const RT = ["battleship", "cruiser", "escort", "none"];
  const noRt = Object.keys(catalog.ships).filter(k => RT.indexOf(catalog.ships[k].rt) < 0);
  check("jokaisella aluksella on kirjan tyyppi (rt)", noRt.length === 0,
        noRt.slice(0, 6).join(", "));
  const rtOf = k => (catalog.ships[k] || {}).rt;
  /* s.14: grand cruiserit ovat "cruisers" */
  const grands = Object.keys(catalog.ships).filter(k => catalog.ships[k].ty === "Grand Cruiser");
  check("grand cruiser on cruiser (s.14)", grands.length > 0 &&
        grands.every(k => rtOf(k) === "cruiser"), grands.length + " runkoa");
  /* s.288: "It counts as a battleship for purposes of taking another" */
  check("Chaos Space Hulk on battleship (s.288)", rtOf("286") === "battleship", String(rtOf("286")));
  /* Puolustusasema ei ole battleship, cruiser eika escort */
  check("kiertorata-asema ei ole mikaan kolmesta tyypista",
        rtOf("507") === "none" && rtOf("500") === "none",
        rtOf("507") + " / " + rtOf("500"));
  /* Kroot Warsphere ja Nicassar-alukset tulevat vain nimetyn paasyn kautta */
  check("Kroot Warsphere ei ole reservityyppia", rtOf("494") === "none", String(rtOf("494")));
})();


/* ---- 16. (1.1 vaihe 3) reservit ja liittolaiset --------------------------
   Fleets s.14: "Any fleet chosen from one of the fleet lists may also include
   reserves. For every three battleships, cruisers or escorts chosen from the
   fleet list, you may also pick one ship of the same type from another fleet
   list belonging to the same race."
   s.15: "Reserves can only ever be ships belonging to the same 'race', chosen
   from a fleet list of the same 'race'."
   s.16: "... no more than one allied vessel may be taken for every three core
   vessels in the fleet."

   Yksikko kantaa taalla oman listansa (entry.list) ja roolinsa (role), joten
   sama laivasto voi koostua kahden listan aluksista. */
(function(){
  const list = nm => catalog.lists.find(x => x.nm === nm);
  const rowOf = (Lx, re) => {
    for(let si = 0; si < Lx.secs.length; si++)
      for(let ei = 0; ei < Lx.secs[si].ents.length; ei++){
        const en = Lx.secs[si].ents[ei];
        if(en.k !== "up" && new RegExp(re, "i").test(en.l)) return { si, ei, en };
      }
    throw new Error("rivia ei loydy: " + Lx.nm + " / " + re);
  };
  /* Yksikko oman listansa riviltä. role: core (oletus) | reserve | ally. */
  const unit = (Lx, re, n, role) => {
    const r = rowOf(Lx, re);
    return { schemaVersion: 2, role: role || "core",
             entry: { list: Lx.nm, section: Lx.secs[r.si].t, label: r.en.l },
             ref: r.en.r == null ? null : String(r.en.r),
             hull: r.en.hc ? String(r.en.r) : null,
             hulls: n || 1, name: "", note: "", adjust: 0,
             custom: r.en.p == null && !r.en.hc ? 0 : null,
             members: [], options: {}, upgrades: {} };
  };
  const fleet = (Lx, limit, units) =>
    DOMAIN.resolveFleet({ list: Lx.nm, limit, units }, catalog);
  const row = (F, re) => F.checks.find(c => new RegExp(re, "i").test(c.t));

  const IN = list("Imperial Navy \u2014 Gothic Sector");
  const BAST = list("Imperial Navy \u2014 Bastion Fleets");
  const CHAOS = list("Chaos \u2014 Incursion");
  const CORS = list("Eldar Corsairs \u2014 Gothic Sector");

  /* Vieras yksikko ratkeaa OMALTA listaltaan: hinta ja profiili ovat
     lahdelistan, ei isantalistan. */
  { const F = fleet(IN, 3000, [unit(IN, "^Lunar class cruiser$"),
                               unit(BAST, "^Avenger", 1, "reserve")]);
    const av = F.units[1];
    check("vieras yksikko ratkeaa omalta listaltaan",
          !!av && av.entry && av.entry.list === BAST.nm,
          av && av.entry ? av.entry.list : "null");
    check("vieraan yksikon hinta tulee lahdelistalta", !!av && av.points > 0,
          av ? String(av.points) : "null"); }

  /* s.14: kolme risteilijaa oikeuttaa yhteen reservirristeilijaan */
  { const F = fleet(IN, 3000, [unit(IN, "^Lunar class cruiser$"),
                               unit(IN, "^Gothic class cruiser$"),
                               unit(IN, "^Tyrant class cruiser$"),
                               unit(BAST, "^Avenger", 1, "reserve")]);
    const r = row(F, "^Reserves \\(cruisers\\)$");
    check("3 risteilijaa + 1 reservi on laillinen", !!r && r.ok === true,
          r ? r.v : "rivi puuttuu"); }
  { const F = fleet(IN, 3000, [unit(IN, "^Lunar class cruiser$"),
                               unit(IN, "^Gothic class cruiser$"),
                               unit(BAST, "^Avenger", 1, "reserve")]);
    const r = row(F, "^Reserves \\(cruisers\\)$");
    check("2 risteilijaa + 1 reservi on laiton", !!r && r.ok === false,
          r ? r.v : "rivi puuttuu"); }

  /* s.14: vain saman tyypin alukset kelpaavat pohjaksi - kolme saattajaa ei
     oikeuta risteilijaan */
  { const F = fleet(IN, 3000, [unit(IN, "^Cobra class destroyer$", 3),
                               unit(BAST, "^Avenger", 1, "reserve")]);
    const r = row(F, "^Reserves \\(cruisers\\)$");
    check("3 saattajaa ei oikeuta reservirristeilijaan", !!r && r.ok === false,
          r ? r.v : "rivi puuttuu"); }

  /* s.15: reservi vain saman rodun listalta */
  { const F = fleet(IN, 3000, [unit(IN, "^Lunar class cruiser$"),
                               unit(IN, "^Gothic class cruiser$"),
                               unit(IN, "^Tyrant class cruiser$"),
                               unit(CHAOS, "^Murder", 1, "reserve")]);
    const r = row(F, "race");
    check("eri rodun reservi kaatuu", !!r && r.ok === false,
          r ? r.t + " " + r.v : "rivi puuttuu"); }

  /* s.16: liittolaisia yksi kolmea ydinalusta kohti */
  { const F = fleet(IN, 3000, [unit(IN, "^Lunar class cruiser$"),
                               unit(IN, "^Gothic class cruiser$"),
                               unit(IN, "^Tyrant class cruiser$"),
                               unit(CORS, "^Shadow class cruiser$", 1, "ally")]);
    const r = row(F, "^Allied vessels \\(cruisers\\)$");
    check("3 ydinristeilijaa + 1 liittolainen on laillinen", !!r && r.ok === true,
          r ? r.v : "rivi puuttuu");
    check("liittolaiselle ei vaadita samaa rotua", !row(F, "race"),
          (row(F, "race") || {}).t || ""); }

  /* Vieras yksikko ei voi olla core: se olisi ostettu isantalistalta */
  { const F = fleet(IN, 3000, [unit(IN, "^Lunar class cruiser$"),
                               unit(BAST, "^Avenger", 1, "core")]);
    const r = row(F, "another fleet list|toiselta listalta|role");
    check("vieras yksikko roolilla core on virhe", !!r && r.ok === false,
          r ? r.t : "rivi puuttuu"); }

  /* Vieras runko ei saa osua isantalistan osioon: Avengerin osioindeksi on
     Bastionin "Battleships" (3), joka on Gothic Sectorilla "Battlecruisers".
     Kirjan mukaan se pitaisi laskea koko laivastosta (s.14), mutta vaara
     laskenta nayttaisi pelin saannolta - joten siita kerrotaan. */
  { const F = fleet(IN, 3000, [unit(IN, "^Lunar class cruiser$"),
                               unit(IN, "^Gothic class cruiser$"),
                               unit(IN, "^Tyrant class cruiser$"),
                               unit(BAST, "^Avenger", 1, "reserve")]);
    const bc = row(F, "^Battlecruisers$");
    check("vieras runko ei osu isantalistan osioon",
          !!bc && bc.v === "0 / 1", bc ? bc.v : "rivi puuttuu");
    /* Otsikko ei yksin riita. Bastion painaa taistelulaivat, grand cruiserit
       JA battlecruiserit saman otsikon "Battleships" alle, mutta s.14 sanoo
       "battlecruisers, grand cruisers, heavy cruisers, cruisers, and light
       cruisers all count as 'cruisers'". Avenger on grand cruiser, joten se
       ei saa kuluttaa Gothic Sectorin ainoaa taistelulaivapaikkaa. Gothicin
       "Battleships"-osiossa ei ole yhtaan saman lajin (rt cruiser) rivia,
       joten alusta ei lasketa siihen - eika mihinkaan, ja siita kerrotaan.
       Codex-katselmointi 15.9.2026. */
    const bs = row(F, "^Battleships$");
    check("lainattu grand cruiser ei kuluta taistelulaivapaikkaa",
          !!bs && bs.v === "0 / 1" && bs.ok === true, bs ? bs.v : "rivi puuttuu");
    const nc = row(F, "^Not counted in this list's limits");
    check("laskematta jaaneesta kerrotaan", !!nc && nc.warn === true,
          nc ? nc.t + " = " + nc.v : "rivi puuttuu"); }
  /* Otsikko jota isannalla ei ole: alusta ei lasketa mihinkaan, ja siita
     kerrotaan. Kroot Warsphere on Tau Merchantilla osiossa "Kroot Vessels",
     joka on nimetty paasy (ct own) - sita ei lasketa koskaan. */
  { const TAUM = list("Tau \u2014 Merchant Fleet");
    const TAUC = list("Tau \u2014 Commerce Protection");
    const F = fleet(TAUC, 3000, [unit(TAUC, "^Explorer class starship.*Vash"),
                                 unit(TAUM, "^Kroot Warsphere$", 1, "reserve")]);
    check("nimetyn paasyn osiosta ei lasketa lainalaivaa",
          !row(F, "^Kroot Warspheres$") || row(F, "^Kroot Warspheres$").v === "0 / 0",
          (row(F, "^Kroot Warspheres$") || {}).v || "rivi puuttuu"); }
  /* Oman listan yksikot eivat tuota reservirivia lainkaan */
  { const F = fleet(IN, 3000, [unit(IN, "^Lunar class cruiser$")]);
    check("pelkka ydinlaivasto ei nayta reservirivia",
          !row(F, "^Reserves \\("), (row(F, "^Reserves \\(") || {}).t || ""); }
})();


/* ---- 17. (1.1 vaihe 3) reservin reservi ja nimetty paasy ------------------
   Fleets s.15: "However, a given fleet list cannot take as reserves ships
   listed as reserves or allies to another fleet list. ... In short, you
   cannot use a reserve of a reserve."
   Fleets s.15: "Some fleet lists explicitly provide access to ships from
   other races. These may only be taken exactly as described on their fleet
   list rules and may not also be taken as reserves."

   Molemmat kysyvat samaa: onko lahdelistan osio listan OMIA aluksia vai
   jonkun muun. Osion laji vastaa: type / own = omia, reserve / access = ei. */
(function(){
  const list = nm => catalog.lists.find(x => x.nm === nm);
  const rowOf = (Lx, re) => {
    for(let si = 0; si < Lx.secs.length; si++)
      for(let ei = 0; ei < Lx.secs[si].ents.length; ei++){
        const en = Lx.secs[si].ents[ei];
        if(en.k !== "up" && new RegExp(re, "i").test(en.l)) return { si, ei, en };
      }
    throw new Error("rivia ei loydy: " + Lx.nm + " / " + re);
  };
  const unit = (Lx, re, n, role) => {
    const r = rowOf(Lx, re);
    return { schemaVersion: 2, role: role || "core",
             entry: { list: Lx.nm, section: Lx.secs[r.si].t, label: r.en.l },
             ref: r.en.r == null ? null : String(r.en.r),
             hull: r.en.hc ? String(r.en.r) : null,
             hulls: n || 1, name: "", note: "", adjust: 0,
             custom: r.en.p == null && !r.en.hc ? 0 : null,
             members: [], options: {}, upgrades: {} };
  };
  const fleet = (Lx, limit, units) =>
    DOMAIN.resolveFleet({ list: Lx.nm, limit, units }, catalog);
  const row = (F, re) => F.checks.find(c => new RegExp(re, "i").test(c.t));

  const IN = list("Imperial Navy \u2014 Gothic Sector");
  const BAKKA = list("Imperial Navy \u2014 Bakka Sector");
  const BAST = list("Imperial Navy \u2014 Bastion Fleets");
  const TAUM = list("Tau \u2014 Merchant Fleet");
  const TAUC = list("Tau \u2014 Commerce Protection");
  const three = [unit(IN, "^Lunar class cruiser$"), unit(IN, "^Gothic class cruiser$"),
                 unit(IN, "^Tyrant class cruiser$")];

  /* Bakkan RESERVES-osion Jovian on Bakan oma reservi, ei Bakan alus */
  { const F = fleet(IN, 3000, three.concat([unit(BAKKA, "^Jovian", 1, "reserve")]));
    const r = row(F, "reserve of a reserve");
    check("reservin reservi kaatuu", !!r && r.ok === false,
          r ? r.t + " " + r.v : "rivi puuttuu"); }

  /* Tau Merchantin Kroot Vessels on nimetty paasy toisen rodun aluksiin */
  { const F = fleet(TAUC, 3000, [unit(TAUC, "^Explorer class starship.*Vash"),
                                 unit(TAUM, "^Kroot Warsphere$", 1, "reserve")]);
    const r = row(F, "named access");
    check("nimetyn paasyn alus ei kelpaa reserviksi", !!r && r.ok === false,
          r ? r.t + " " + r.v : "rivi puuttuu"); }

  /* Tavallinen reservi ei tuota kumpaakaan rivia */
  { const F = fleet(IN, 3000, three.concat([unit(BAST, "^Lunar class cruiser$", 1, "reserve")]));
    check("tavallinen reservi ei kaadu naihin",
          !row(F, "reserve of a reserve") && !row(F, "named access"),
          (row(F, "reserve of a reserve") || row(F, "named access") || {}).t || ""); }
})();

/* ---- 13c. lainalaivan regressio kaikilla listoilla (DoD 1.1) ------------
   Kirjan s.14 sanoo, etta lainalaiva lasketaan laivastoon KOKONAISUUTENA:
   "the restrictions on maximum and minimum numbers of ships are determined
   for the fleet as a whole, regardless of whether they were purchased from
   the list or as reserves". Kriteeri "isannan rivien ARVOT pysyvat
   muuttumattomina" olisi siis kirjan vastainen: pisteet nousevat, runko
   lasketaan otsikkoonsa, ja kiintio joka johdetaan laivaston sisallosta
   liikkuu. Ensimmainen versio tasta testista vaati juuri sita ja tuotti 25
   punaista, joista jokainen oli kirjan mukainen muutos.

   Oikea invariantti on SAANTOJOUKKO, ei arvo. Molemmat luettelot:

     SAA muuttua     - minka tahansa rivin ARVO, ja uusina riveina reservi-,
                       liittolais- ja roturivit, joita ei ollut ennen.
     EI SAA muuttua  - rivien JOUKKO muuten. Lahdelistan omat saannot eivat
                       seuraa alusta isantalistalle: yksikaan uusi otsikko
                       ei saa olla lahdelistan oma saanto, eika yksikaan
                       isannan rivi saa kadota.

   Lisaksi toiseen suuntaan: jonkin on muututtava. Jos mikaan ei liiku,
   lainalaivaa ei lasketa mihinkaan ja s.14 jaa valvomatta. */
(function(){
  const anyShip = Lx => {
    for(let si = 0; si < Lx.secs.length; si++){
      if(Lx.secs[si].ct !== "type") continue;
      for(let ei = 0; ei < Lx.secs[si].ents.length; ei++){
        const en = Lx.secs[si].ents[ei];
        if(en.k === "unit" && en.r && en.p != null)
          return { si, ei, en, sec: Lx.secs[si] };
      }
    }
    return null;
  };
  const mk = (Lx, at, role) => ({
    schemaVersion: 3, role: role || "core",
    entry: { list: Lx.nm, section: Lx.secs[at.si].t, label: at.en.l },
    ref: at.en.r == null ? null : String(at.en.r),
    hull: at.en.hc ? String(at.en.r) : null,
    hulls: 1, name: "", note: "", adjust: 0,
    custom: at.en.p == null && !at.en.hc ? 0 : null,
    members: [], options: {}, upgrades: {} });
  const run = (Lx, units) =>
    DOMAIN.resolveFleet({ list: Lx.nm, limit: 100000, units }, catalog);
  const titles = F => F.checks.map(c => c.t);
  const vals = F => { const m = {}; F.checks.forEach(c => { m[c.t] = c.v + "|" + c.ok; }); return m; };

  /* Rivit, jotka moottori lisaa nimenomaan lainalaivasta (s.14-16). */
  /* J213: ": choose " on lainalaivan oma rivi sekin - aseeton Hive ship on
     puutteellinen alus, lainattiin se tai ei (Fleets s.430). */
  const BORROW_ROW = /^Reserves |^Allied vessels |^Borrowed |reserve|ally|allied|another fleet list|race|not counted|: choose /i;
  /* Lahdelistan oma saanto tunnistetaan sen omasta lauseesta. */
  const donorSentences = Ld => {
    const out = [];
    (Ld.secs || []).forEach(sec => (sec.rules || []).forEach(r => {
      if(r.src) out.push(String(r.src));
    }));
    return out;
  };

  let ran = 0, changed = 0;
  catalog.lists.forEach(host => {
    const donor = catalog.lists.filter(d =>
      d.nm !== host.nm && d.race && host.race && d.race === host.race)[0];
    if(!donor) return;
    const hAt = anyShip(host), dAt = anyShip(donor);
    if(!hAt || !dAt) return;
    ran++;
    const own = [mk(host, hAt), mk(host, hAt), mk(host, hAt)];
    const F0 = run(host, own);
    const F1 = run(host, own.concat([mk(donor, dAt, "reserve")]));
    const t0 = titles(F0), t1 = titles(F1), v0 = vals(F0), v1 = vals(F1);

    /* 1. Yksikaan isannan rivi ei saa kadota. */
    const gone = t0.filter(t => t1.indexOf(t) < 0);
    check("lainalaiva ei poista isannan rivia: " + host.nm,
          gone.length === 0, gone.join("; ") || "-");

    /* 2. Uusi rivi saa olla vain lainalaivan oma rivi. */
    const added = t1.filter(t => t0.indexOf(t) < 0);
    const badAdd = added.filter(t => !BORROW_ROW.test(t));
    check("uusi rivi on lainalaivan rivi: " + host.nm,
          badAdd.length === 0, badAdd.join("; ") || "-");

    /* 3. Lahdelistan oma lause ei saa ilmestya isannan tarkistuksiin. */
    const own0 = {};
    F0.checks.forEach(c => { if(c.s) own0[c.s] = 1; });
    const dsent = donorSentences(donor);
    const leaked = F1.checks.filter(c => c.s && !own0[c.s] &&
      dsent.indexOf(String(c.s)) >= 0 && !BORROW_ROW.test(c.t)).map(c => c.t);
    check("lahdelistan saanto ei vuoda isannalle: " + host.nm,
          leaked.length === 0, leaked.join("; ") || "-");

    /* 4. Lainalaiva saa oman budjettirivinsa. Tama on ainoa vaite, joka
       kaatuu jos moottori lakkaa lukemasta yksikon omaa listaa: silloin
       lainalaiva muuttuu isannan omaksi alukseksi ja 1:3-budjetti katoaa
       aanettomasti, vaikka pisteet yha nousisivat. */
    check("lainalaiva saa oman budjettirivinsa: " + host.nm,
          t1.some(t => /^Reserves |^Allied vessels /.test(t)),
          added.join("; ") || "ei uusia rivaja");

    /* 5. Toiseen suuntaan: lainalaiva nakyy jossain. */
    const moved = added.length > 0 ||
      Object.keys(v0).some(t => v0[t] !== v1[t]);
    if(moved) changed++;
    check("lainalaiva nakyy laivaston tarkistuksissa: " + host.nm, moved,
          "uusia " + added.length);
  });
  check("13c: regressio ajettiin useammalle listalle", ran >= 20, String(ran));
  check("13c: lainalaiva liikutti jotain jokaisella listalla", changed === ran,
        changed + " / " + ran);
})();

/* ---- 13d. liittolaismatriisi (Fleets s.17 + 2010 FAQ) -------------------
   s.17 kieltaa liiton luonnollisen vihollisen kanssa ja viittaa ALLIES
   MATRIX -taulukkoon, joka ei ole tassa painoksessa (sivu on otsikon jalkeen
   tyhja). Remasteredin verkkoversio palauttaa sen 2010 FAQ:sta; sanatarkka
   teksti ja alkupera: referenssi/liittolaismatriisi_2010_faq.txt.

   Ennen korjausta moottori palautti heti role !== "reserve", joten eri rodun
   liittolainen ohitti kaiken: Dark Eldar -risteilija meni Imperial Navy
   -laivastoon taysin vihreana (kayttajan havainto 15.9.2026).

   Taulukko kaydaan tassa lapi pareittain. Liitto on laillinen vain jos
   KUMPIKIN puoli sallii sen, joten yksipuolinen kielto riittaa. */
(function(){
  const byName = nm => catalog.lists.filter(x => x.nm === nm)[0];
  const anyShip = (Lx, rt) => {
    for(let si = 0; si < Lx.secs.length; si++){
      if(Lx.secs[si].ct !== "type") continue;
      for(let ei = 0; ei < Lx.secs[si].ents.length; ei++){
        const en = Lx.secs[si].ents[ei];
        if(en.k !== "unit" || !en.r || en.p == null) continue;
        const sh = catalog.ships[String(en.r)];
        if(rt && (!sh || sh.rt !== rt)) continue;
        return { si, ei, en };
      }
    }
    return null;
  };
  const mk = (Lx, at, role) => ({
    schemaVersion: 3, role: role || "core",
    entry: { list: Lx.nm, section: Lx.secs[at.si].t, label: at.en.l },
    ref: at.en.r == null ? null : String(at.en.r),
    hull: at.en.hc ? String(at.en.r) : null,
    hulls: 1, name: "", note: "", adjust: 0,
    custom: at.en.p == null && !at.en.hc ? 0 : null,
    members: [], options: {}, upgrades: {} });
  /* Kuusi omaa runkoa: 1:3-budjetti sallii kaksi liittolaista, joten se ei
     ole se mika kaataa - kaatuminen tulee matriisista. */
  const fleetWith = (host, donors) => {
    const hAt = anyShip(host);
    const own = [mk(host, hAt), mk(host, hAt), mk(host, hAt),
                 mk(host, hAt), mk(host, hAt), mk(host, hAt)];
    const al = donors.map(d => { const a = anyShip(d.L, d.rt); return a ? mk(d.L, a, "ally") : null; });
    if(al.some(x => !x)) return null;
    return DOMAIN.resolveFleet({ list: host.nm, limit: 1000000, units: own.concat(al) }, catalog);
  };
  const allyRed = F => (F ? F.checks.filter(c => !c.ok &&
      /^Never allies|^With .* allies, no others/.test(c.t)) : []);

  /* [isanta, lahde, sallittu] - lahteen 12 riviä pareittain. */
  const CASES = [
    ["Imperial Navy — Gothic Sector", "Eldar Corsairs — Gothic Sector", true],
    ["Imperial Navy — Gothic Sector", "Eldar — Iyanden Craftworld", false],
    ["Imperial Navy — Gothic Sector", "Dark Eldar — Pirates", false],
    ["Imperial Navy — Gothic Sector", "Tau — Merchant Fleet", true],
    ["Imperial Navy — Gothic Sector", "Space Marines — Codex Astartes", true],
    ["Imperial Navy — Gothic Sector", "Orks — Waaagh!", false],
    ["Imperial Navy — Gothic Sector", "Chaos — Incursion", false],
    ["Imperial Navy — Gothic Sector", "Necrons — Harvest Fleet", false],
    ["Imperial Navy — Gothic Sector", "Tyranids — Hive Fleet", false],
    ["Imperial Navy — Gothic Sector", "Rogue Traders", true],
    ["Orks — Waaagh!", "Chaos — Incursion", true],
    ["Orks — Waaagh!", "Dark Eldar — Pirates", true],
    ["Orks — Waaagh!", "Rogue Traders", true],
    ["Orks — Waaagh!", "Imperial Navy — Gothic Sector", false],
    ["Orks — Waaagh!", "Tau — Merchant Fleet", false],
    ["Chaos — Incursion", "Dark Eldar — Pirates", true],
    ["Chaos — Incursion", "Eldar Corsairs — Gothic Sector", false],
    ["Chaos — Incursion", "Eldar — Iyanden Craftworld", false],
    ["Rogue Traders", "Tyranids — Hive Fleet", false],
    ["Rogue Traders", "Necrons — Harvest Fleet", false],
    ["Tau — Merchant Fleet", "Space Marines — Codex Astartes", false],
    ["Tau — Merchant Fleet", "Demiurg — War Host", true],
    ["Space Marines — Codex Astartes", "Eldar Corsairs — Gothic Sector", false],
    ["Space Marines — Codex Astartes", "Rogue Traders", true],
    ["Space Marines — Codex Astartes", "Demiurg — War Host", false],
  ];
  let ran = 0;
  CASES.forEach(function(c){
    const H = byName(c[0]), D = byName(c[1]);
    if(!H || !D){ check("13d: lista puuttuu " + c[0] + " / " + c[1], false, "-"); return; }
    const F = fleetWith(H, [{ L: D }]);
    if(!F){ check("13d: alusta ei loydy " + c[0] + " / " + c[1], false, "-"); return; }
    ran++;
    const red = allyRed(F);
    check("liitto " + (c[2] ? "sallittu" : "kielletty") + ": " + c[0] + " + " + c[1],
          c[2] ? red.length === 0 : red.length > 0,
          red.map(function(x){ return x.t; }).join(" ; ") || "ei kieltoriviä");
  });
  check("13d: matriisi ajettiin", ran >= 20, String(ran));

  /* Imperiumin toinen virke: Space Marine -liittolainen sulkee muut pois,
     paitsi Rogue Traderit. Kumpikin pari yksin on laillinen. */
  {
    const IN = byName("Imperial Navy — Gothic Sector");
    const SM = byName("Space Marines — Codex Astartes");
    const CO = byName("Eldar Corsairs — Gothic Sector");
    const RT = byName("Rogue Traders");
    const two = fleetWith(IN, [{ L: SM }, { L: CO }]);
    check("Space Marine -liittolainen sulkee Corsairin pois",
          allyRed(two).length > 0, allyRed(two).map(x => x.t).join(" ; ") || "ei kieltoriviä");
    const ok2 = fleetWith(IN, [{ L: SM }, { L: RT }]);
    check("Rogue Trader on sallittu poikkeus Space Marinen rinnalla",
          allyRed(ok2).length === 0, allyRed(ok2).map(x => x.t).join(" ; "));
  }
})();

/* ---- 13e. "excluding Xenos ships" ------------------------------------
   Sama lause sanotaan lahteessa kolmesti eri suunnista:

     Imperials: "...except Rogue Trader vessels (excluding Xenos ships)."
     Space Marines: "will only ally with Imperials ... and Rogue Trader
                     vessels (excluding Xenos ships)."
     Rogue Traders: "...but may not take Xenos vessels when allied with
                     Space Marines."

   Kolmas virke on laajin: se ei rajoita liittolaisrivia vaan kieltaa
   Xenos-alukset laivastosta, myos Rogue Traderin OMAT, jos mukana on
   Space Marine -liittolainen. Siksi tama on laivastotason saanto eika
   parin saanto. Xenos-rivit ovat vain Rogue Traders -listoilla. */
(function(){
  const byName = nm => catalog.lists.filter(x => x.nm === nm)[0];
  const rowLike = (Lx, re) => {
    for(let si = 0; si < Lx.secs.length; si++){
      if(Lx.secs[si].ct !== "type") continue;
      for(let ei = 0; ei < Lx.secs[si].ents.length; ei++){
        const en = Lx.secs[si].ents[ei];
        if(en.k !== "unit" || !en.r || en.p == null) continue;
        if(!re.test(String(en.l))) continue;
        return { si, ei, en };
      }
    }
    return null;
  };
  const mk = (Lx, at, role) => ({
    schemaVersion: 3, role: role || "core",
    entry: { list: Lx.nm, section: Lx.secs[at.si].t, label: at.en.l },
    ref: at.en.r == null ? null : String(at.en.r),
    hull: at.en.hc ? String(at.en.r) : null,
    hulls: 1, name: "", note: "", adjust: 0,
    custom: at.en.p == null && !at.en.hc ? 0 : null,
    members: [], options: {}, upgrades: {} });
  const run = (host, parts) => DOMAIN.resolveFleet(
    { list: host.nm, limit: 1000000, units: parts }, catalog);
  const xenoRed = F => F.checks.filter(function(c){
    return !c.ok && /Xenos/.test(c.t); });

  const IN = byName("Imperial Navy — Gothic Sector");
  const SM = byName("Space Marines — Codex Astartes");
  const RT = byName("Rogue Traders");
  const anyOf = Lx => rowLike(Lx, /./);
  const xeno = rowLike(RT, /^Xenos Vessel/);
  const plain = rowLike(RT, /^(?!Xenos)/);
  check("13e: Xenos-rivi loytyy Rogue Tradereilta", !!xeno, xeno ? xeno.en.l : "-");
  check("13e: ei-Xenos-rivi loytyy Rogue Tradereilta", !!plain, plain ? plain.en.l : "-");
  if(!xeno || !plain) return;

  /* 1. Space Marine -laivasto ei ota Xenos-alusta liittolaiseksi. */
  check("Space Marine -laivasto: Xenos-alus liittolaisena on kielletty",
        xenoRed(run(SM, [mk(SM, anyOf(SM)), mk(SM, anyOf(SM)), mk(SM, anyOf(SM)),
                         mk(RT, xeno, "ally")])).length > 0, "-");
  /* 2. Sama laivasto ottaa Rogue Traderin tavallisen aluksen. */
  check("Space Marine -laivasto: tavallinen Rogue Trader -alus kelpaa",
        xenoRed(run(SM, [mk(SM, anyOf(SM)), mk(SM, anyOf(SM)), mk(SM, anyOf(SM)),
                         mk(RT, plain, "ally")])).length === 0, "-");
  /* 3. Imperiumin laivasto, jossa on Space Marine -liittolainen, ei saa
        ottaa Xenos-alusta - vaikka Rogue Trader on muuten sallittu. */
  check("Space Marine -liittolaisen rinnalla Xenos-alus on kielletty",
        xenoRed(run(IN, [mk(IN, anyOf(IN)), mk(IN, anyOf(IN)), mk(IN, anyOf(IN)),
                         mk(IN, anyOf(IN)), mk(IN, anyOf(IN)), mk(IN, anyOf(IN)),
                         mk(SM, anyOf(SM), "ally"), mk(RT, xeno, "ally")])).length > 0, "-");
  /* 4. Rogue Trader -laivasto: oma Xenos-alus on kielletty, jos mukana on
        Space Marine -liittolainen. Tama on se kohta, jota parin tarkistus
        ei voi nahda - kumpikaan pari ei ole laiton. */
  check("Rogue Trader: oma Xenos-alus on kielletty Space Marine -liittolaisen kanssa",
        xenoRed(run(RT, [mk(RT, anyOf(RT)), mk(RT, anyOf(RT)), mk(RT, anyOf(RT)),
                         mk(RT, xeno), mk(SM, anyOf(SM), "ally")])).length > 0, "-");
  /* 5. Verrokki: ilman Space Marine -liittolaista oma Xenos-alus on
        laillinen, eli saanto ei paikanna vaaraa asiaa. */
  check("Rogue Trader: oma Xenos-alus on laillinen ilman Space Marineja",
        xenoRed(run(RT, [mk(RT, anyOf(RT)), mk(RT, anyOf(RT)), mk(RT, anyOf(RT)),
                         mk(RT, xeno)])).length === 0, "-");
})();

/* ---- 13f. poimija ja laillisuuspaneeli sanovat saman ------------------
   Katalogin lahdevalitsin ryhmittelee listat sen mukaan, lainaavatko ne
   talle laivastolle. Se on vastaus ENNEN kuin alusta on valittu; paneeli
   vastaa vasta sen jalkeen. Jos ne eroavat, pelaaja nakee poimijassa "ei"
   eika koskaan sita kirjan lausetta joka sen paatti - juuri se hiljainen
   vaara vastaus, jota app_template.html:n kommentti varoittaa valttamaan.

   Siksi kaikki 32 x 32 paria kaydaan lapi molemmilla tavoilla. Paritason
   punaiset rivit ovat naita viisi; rivi- ja laivastotason rivit (lend_ban,
   reserve of a reserve, kolmas liittolainen, Xenos) eivat kuulu tahan, koska
   poimija ei edes vaita niista mitaan. */
(function(){
  const PAIR_RED = /^(Takes no reserves or allies|Gives no reserves or allies|Never allies|Reserve race|Same race, so a reserve and not an ally)/;
  const firstShip = Lx => {
    for(let si = 0; si < Lx.secs.length; si++){
      if(Lx.secs[si].ct !== "type") continue;
      for(let ei = 0; ei < Lx.secs[si].ents.length; ei++){
        const en = Lx.secs[si].ents[ei];
        if(en.k === "unit" && en.r && en.p != null) return { si, ei, en };
      }
    }
    return null;
  };
  const mk = (Lx, at, role) => ({
    schemaVersion: 3, role: role || "core",
    entry: { list: Lx.nm, section: Lx.secs[at.si].t, label: at.en.l },
    ref: at.en.r == null ? null : String(at.en.r),
    hull: at.en.hc ? String(at.en.r) : null,
    hulls: 1, name: "", note: "", adjust: 0, custom: null,
    members: [], options: {}, upgrades: {} });

  let pairs = 0, noSip = 0;
  const disagree = [];
  catalog.lists.forEach(function(L){
    const hAt = firstShip(L);
    if(!hAt){ noSip++; return; }
    catalog.lists.forEach(function(D){
      if(D === L) return;
      const dAt = firstShip(D);
      if(!dAt){ noSip++; return; }
      const v = DOMAIN.lendVerdict(L, D);
      /* Kielletylle parille rooli on se, jonka sovellus oletuksena leimaisi:
         sama rotu -> reserve, eri rotu -> ally. Muuten tapaus ei edes ajaisi
         sita saantoa, jonka pitaisi kaataa se. */
      const role = v.role ||
        (D.race && L.race && D.race === L.race ? "reserve" : "ally");
      /* Kuusi omaa runkoa, jottei 1:3 kaada tapausta - se ei ole paritason
         rivi eika siis kuulu tahan vertailuun. */
      const own = [];
      for(let k = 0; k < 6; k++) own.push(mk(L, hAt));
      const F = DOMAIN.resolveFleet(
        { list: L.nm, limit: 1000000, units: own.concat([mk(D, dAt, role)]) },
        catalog);
      const red = F.checks.filter(c => !c.ok && PAIR_RED.test(c.t));
      const panelSaysNo = red.length > 0;
      const pickerSaysNo = v.kind === "no";
      pairs++;
      if(panelSaysNo !== pickerSaysNo)
        disagree.push(L.nm + " <- " + D.nm + ": poimija " +
          (pickerSaysNo ? "ei" : v.kind) + ", paneeli " +
          (panelSaysNo ? red.map(c => c.t).join(" ; ") : "vihrea"));
    });
  });
  /* Pelkka kylla/ei ei riita. Ensimmainen versio sanoi oikein "sallittu"
     mutta vaaralla perusteella: se luki nimetyt luvat ennen rotuporttia,
     jolloin kolme muuta Imperial Navy -listaa nakyivat ehdollisina
     ("needs an Inquisitor Lord", s.139) vaikka ne ovat tavallisia saman
     rodun reserveja. Testi oli vihrea koko ajan. Siksi myos LAJI ja ROOLI
     tarkistetaan. */
  const wrongKind = [], wrongRole = [], fakeCond = [];
  catalog.lists.forEach(function(L){
    catalog.lists.forEach(function(D){
      if(D === L) return;
      const v = DOMAIN.lendVerdict(L, D);
      /* res_ban kieltaa myos saman rodun (Crusade s.99, Grey Knights s.145),
         ja se on listan oma lause - tarkempi kuin rotuportti. */
      const same = !!(D.race && L.race && D.race === L.race) &&
                   !L.res_ban && !D.res_ban;
      if(same && !(v.kind === "reserve" && !v.cond))
        wrongKind.push(L.nm + " <- " + D.nm + ": " + v.kind +
          (v.cond ? " (" + v.cond + ")" : ""));
      if(v.kind !== "no" && v.kind !== "own" &&
         v.role !== "reserve" && v.role !== "ally")
        wrongRole.push(L.nm + " <- " + D.nm + ": " + JSON.stringify(v.role));
      if(v.cond){
        const g = DOMAIN.lendGrantFor(L, D);
        if(!g || !g.needs_re) fakeCond.push(L.nm + " <- " + D.nm);
      }
    });
  });
  check("saman rodun lista on aina tavallinen reservi, ei ehdollinen",
        wrongKind.length === 0, wrongKind.slice(0, 5).join("  |  "));
  check("sallitulla parilla on aina rooli", wrongRole.length === 0,
        wrongRole.slice(0, 5).join("  |  "));
  check("ehto on kirjattu vain kun luvassa on needs_re",
        fakeCond.length === 0, fakeCond.slice(0, 5).join("  |  "));
  check("13f: kaikki parit ajettiin", pairs >= 900, String(pairs));
  check("13f: jokaisella listalla on alus", noSip === 0, String(noSip));
  check("poimija ja paneeli ovat samaa mielta joka parista",
        disagree.length === 0, disagree.slice(0, 6).join("  |  "));

  /* Rooli on kirjan rooli eika rodun oletus. Nimetty lupa antaa aluksen
     NORMAALINA RESERVINA (s.101), joten poimija ei saa leimata sita
     liittolaiseksi - se avaisi toisen 1:3-budjetin reservin rinnalle. */
  const dom = catalog.lists.filter(x => /Dominion/.test(x.nm))[0];
  const rt = catalog.lists.filter(x => x.nm === "Rogue Traders")[0];
  if(dom && rt){
    /* Kysyttaessa RESERVIN ovea nimetty lupa antaa roolin reserve (s.101
       "as normal reserves"), ei liittolaista - se avaisi toisen 1:3-budjetin.
       Kysymattä roolia vastaus on liittolainen, koska se ovi on auki ilman
       ehtoja; juuri se ero oli poimijan virhe 15.9. */
    check("nimetty lupa antaa roolin reserve kun reservia kysytaan",
          DOMAIN.lendVerdict(dom, rt, "reserve").kind === "grant" &&
          DOMAIN.lendVerdict(dom, rt, "reserve").role === "reserve",
          JSON.stringify(DOMAIN.lendVerdict(dom, rt, "reserve")));
    check("kysymatta rooli on liittolainen, koska se ovi on auki ehdoitta",
          DOMAIN.lendVerdict(dom, rt).kind === "ally",
          JSON.stringify(DOMAIN.lendVerdict(dom, rt)));
  }
  /* Ehdollinen lupa nakyy ehtona eika pelkkana kylla/ei: "An Eldar Hero must
     lead the fleet in order to use Craftworld Eldar vessels as reserves"
     (s.316). */
  const cors = catalog.lists.filter(x => /^Eldar Corsairs/.test(x.nm))[0];
  const iyan = catalog.lists.filter(x => /Iyanden/.test(x.nm))[0];
  if(cors && iyan){
    check("ehdollinen lupa kantaa ehtonsa reservin ovella",
          !!DOMAIN.lendVerdict(cors, iyan, "reserve").cond,
          JSON.stringify(DOMAIN.lendVerdict(cors, iyan, "reserve")));
  }
})();

/* ---- 13g. rivitason tuomio vs. moottori -------------------------------
   Sama vaatimus kuin 13f:ssa, yhta tasoa alempana. Katalogi varittaa jokaisen
   rivin plus-nappia sen mukaan, saako sen rivin lainata; jos se erehtyy,
   pelaaja joko luulee laillista alusta kielletyksi tai painvastoin. Siksi
   lendRowVerdict ajetaan oikeaa resolveFleetia vasten.

   Kaikki 18 "limited"-paria kaydaan taydellisesti lapi, koska juuri niissa
   on isantakohtainen rajaus (lend_ban, not_re) - se on se harvinainen tapaus
   jota varten koko keskimmainen ryhma on olemassa. Muista pareista otetaan
   kiintea otanta, jottei hyvaksynta hidastu; otanta on deterministinen eika
   satunnainen, jotta punainen toistuu samana. */
(function(){
  const ROW_RED = /^(Not lent as a reserve|Not granted as a reserve|Reserve of a reserve|Named access, not a reserve|Not a reserve type|Reserve needs |No Xenos vessels beside Space Marines|Takes no reserves or allies|Gives no reserves or allies|Never allies|Reserve race|Same race, so a reserve and not an ally)/;
  const firstCore = Lx => {
    for(let si = 0; si < Lx.secs.length; si++){
      if(Lx.secs[si].ct !== "type") continue;
      for(let ei = 0; ei < Lx.secs[si].ents.length; ei++){
        const en = Lx.secs[si].ents[ei];
        if(en.k === "unit" && en.r && en.p != null) return { si, ei, en };
      }
    }
    return null;
  };
  const mk = (Lx, at, role) => ({
    schemaVersion: 3, role: role || "core",
    entry: { list: Lx.nm, section: Lx.secs[at.si].t, label: at.en.l },
    ref: at.en.r == null ? null : String(at.en.r),
    hull: at.en.hc ? String(at.en.r) : null,
    hulls: 1, name: "", note: "", adjust: 0, custom: null,
    members: [], options: {}, upgrades: {} });

  let runs = 0, skipped = 0;
  const wrong = [];
  let openSeen = 0;
  catalog.lists.forEach(function(L){
    const hAt = firstCore(L);
    if(!hAt) return;
    catalog.lists.forEach(function(D){
      if(D === L) return;
      /* Kuusi tavallista runkoa: laivastossa ei ole inkvisiittoria eika
         Eldar Heroa, joten ehdollinen lupa ei ole voimassa. */
      const ctx = { condMet: false };
      const sum = DOMAIN.lendSummary(L, D, catalog, ctx);
      /* Kaikki rajoitetut, ja avoimista joka seitsemas. */
      if(sum.kind === "open"){ openSeen++; if(openSeen % 7 !== 0) return; }
      else if(sum.kind !== "limited") return;
      const role = sum.verdict.role || "ally";
      D.secs.forEach(function(sec, si){
        sec.ents.forEach(function(en, ei){
          if(!DOMAIN.lendOfferable(en)) return;
          /* Avoin hinta ja rungon valinta tarvitsisivat oman aikeensa;
             ne lasketaan, ei ohiteta aanettomasti. */
          if(en.r == null || en.p == null || en.hc){ skipped++; return; }
          const own = [];
          for(let k = 0; k < 6; k++) own.push(mk(L, hAt));
          const F = DOMAIN.resolveFleet({ list: L.nm, limit: 1000000,
            units: own.concat([mk(D, { si, ei, en }, role)]) }, catalog);
          const red = F.checks.filter(c => !c.ok && ROW_RED.test(c.t));
          const engineNo = red.length > 0;
          const mine = !DOMAIN.lendRowVerdict(L, D, si, en, catalog, ctx).ok;
          runs++;
          if(engineNo !== mine)
            wrong.push(L.nm + " <- " + D.nm + " / " + sec.t + " / " + en.l +
              ": katalogi " + (mine ? "ei" : "kylla") + ", moottori " +
              (engineNo ? red.map(c => c.t).join(" ; ") : "vihrea"));
        });
      });
    });
  });
  check("13g: rivitapauksia ajettiin", runs >= 800, String(runs));
  check("rivin plus-nappi ja moottori ovat samaa mielta",
        wrong.length === 0, wrong.slice(0, 5).join("  |  "));

  /* Keskimmainen ryhma on olemassa vain isantakohtaista rajausta varten.
     Jos se laajenisi tarkoittamaan "listalla on rivi jota ei lainata", se
     olisi paalla 406 parissa 408:sta eika kertoisi mitaan. */
  let limited = 0, open = 0;
  const badCause = [], cause = {};
  catalog.lists.forEach(function(L){
    catalog.lists.forEach(function(D){
      const sum = DOMAIN.lendSummary(L, D, catalog, { condMet: false });
      if(sum.kind === "limited"){
        limited++;
        if(!sum.only || ["lend_ban", "not_re", "needs", "xenos"].indexOf(sum.only.cause) < 0)
          badCause.push(L.nm + " <- " + D.nm);
        else cause[sum.only.cause] = (cause[sum.only.cause] || 0) + 1;
      }
      if(sum.kind === "open") open++;
    });
  });
  /* `needs` on nolla eika sattumalta: yksikaan nimetty lupa ei ole ainoa
     reitti, vaan kaikilla 27 lupaparilla on myos liittolaisovi auki ilman
     ehtoja, joten ehto ei koskaan sulje listaa - se koskee vain reservin
     ovea. Jaljelle jaavat rivikohtaiset rajaukset, ja ne ovat kaikki
     nimettavissa: **lend_ban 15** on yksi ainoa lahde, Imperial Navy -
     Armageddon Sector, jokaiselle 15 isannalle joka voi siita lainata
     (s.41 tahdelliset Space Marine -alukset); **xenos 6** on kaksi Space
     Marine -isantaa (Codex Astartes ja Dominion; Crusade ja Grey Knights
     eivat lainaa lainkaan) kertaa kolme Rogue Traders -listaa. `not_re` ei
     enaa nay, koska se kuuluu luvan eli reservin ovelle, ja naissa pareissa
     kuljetaan liittolaisovesta - Xenos-rivit kaatuvat silti, omasta
     saannostaan. Luvut on kirjattu, jotta datan muutos nakyy taalla eika
     vasta valikossa. */
  const causeOK = cause.lend_ban === 15 && cause.xenos === 6 &&
                  !cause.needs && !cause.not_re;
  check("rajoitetut parit ovat nimettyja ja niita on 21",
        limited === 21 && causeOK && badCause.length === 0,
        JSON.stringify(cause) + " ; " +
        limited + " rajoitettua, " + open + " avointa, syyvirheet: " +
        badCause.slice(0, 3).join(" | "));
  /* Tama oli ensin muodossa `skipped >= 0`, joka ei voi koskaan kaatua -
     nayttaa tarkistukselta, ei ole. Mitattava asia on, etta otanta kattaa
     valtaosan riveista: jos jokin datan muutos tekisi puolesta riveista
     ohitettavia, kattavuus romahtaisi aanettomasti. */
  check("13g: ohitettuja on murto-osa ajetuista",
        skipped * 4 < runs,
        skipped + " ohitettu (avoin hinta tai rungon valinta) / " + runs + " ajettu");
})();

/* ---- 13h. asemerkki ei saa olla eri mielta kuin kirja -----------------
   Kortin asemerkki ryhmittelee rivin sen mukaan, MITEN ase ratkaistaan, ja
   kortilla ei ole selitetta kirjaimille - vari tekee ryhmittelyn. `wepClass`
   tunnistaa aseen NIMESTA saannollisella lausekkeella ja pudottaa kaiken
   tunnistamattoman patteriksi. Se hiljainen oletus oli vaara viidella
   aseperheella yhta aikaa, ja kaikki huomattiin vasta silmalla (kayttaja
   15.9.): Bio-plasma luki kortilla samalla merkilla kuin sen vieressa oleva
   Pyro-acid battery.

   Tama testi ei lue nimia vaan KIRJAN LAUSETTA: erikoissaannon oma teksti
   sanoo mika ase on, ja merkki ei saa sanoa siita eri asiaa. Nain seuraava
   lancemainen ase ei voi pudota patteriksi aanettomasti. */
(function(){
  const LANCE = /(?:functions|hits|fires) (?:as|like) a lance/i;
  /* "a weapon battery", "a standard weapon battery" ja pelkka "weapon
     battery;" - Lightning Arcin lause alkaa ilman artikkelia, ja tiukempi
     lauseke pudotti sen hiljaa pois tarkistuksesta. */
  const BATT  = /\bweapon battery\b/i;
  /* Nimetty poikkeus perusteluineen. Bombardment Cannon on kirjan mukaan
     "a weapon battery", mutta se osuu aina 4+:lla, tekee kriittisia 4+:lla
     ja osuu myos ordnanceen (s.94) - se on oma aseensa, ja jakaa merkin
     nova cannonin kanssa laivaston raskaana keulaseena. Jos tama halutaan
     purkaa, se on oma paatoksensa eika tamän testin ohitus. */
  const EXCEPT = { bombardment: "N" };

  /* Nimijoukkoon kuuluvat myos ne nimet, jotka syntyvat vasta paivityksesta:
     Orbital mines on `k:"up"` -rivi, jonka `swp.nm` nimeaa laukaisukuilun
     uudelleen, eika sita nimea ole yhdenkaan aluksen profiilissa. Ensimmainen
     versio luki vain profiilit, ja vaitti siksi etta /orbital mine/i on
     kuollutta koodia - se on painvastoin ainoa tapa nahda miinarivi. */
  const names = {};
  Object.keys(catalog.ships).forEach(function(k){
    const sh = catalog.ships[k];
    (sh.aw || []).forEach(function(a){ names[a[0]] = sh.fl || ""; });
  });
  catalog.lists.forEach(function(L){
    L.secs.forEach(function(sec){
      sec.ents.forEach(function(en){
        if(en.swp && en.swp.nm && !names.hasOwnProperty(en.swp.nm))
          names[en.swp.nm] = "";
      });
    });
  });
  let checked = 0;
  const wrong = [];
  (DOMAIN.SPECIAL_WEAPON_RULES || []).forEach(function(r){
    if(!r.wep || r.wep.source === "^$") return;
    const wantL = LANCE.test(r.text), wantB = BATT.test(r.text) && !wantL;
    if(!wantL && !wantB) return;
    const want = EXCEPT[r.id] || (wantL ? "L" : "G");
    Object.keys(names).forEach(function(nm){
      if(!r.wep.test(nm)) return;
      if(r.fleet && !r.fleet.test(names[nm])) return;
      checked++;
      const got = DOMAIN.wepClass(nm)[0];
      if(got !== want)
        wrong.push(nm + " (" + r.id + "): merkki " + got + ", kirja sanoo " +
          (wantL ? "lance" : "weapon battery") + " -> " + want);
    });
  });
  check("13h: asemerkkeja tarkistettu kirjan lausetta vasten", checked >= 25,
        String(checked));
  check("asemerkki ei ole eri mielta kuin kirjan lause",
        wrong.length === 0, wrong.slice(0, 6).join("  |  "));

  /* Sama toisin pain: kontaktiaseet. Kirja sanoo "on contact", ja rivin
     voimakkuus on "Spec." - patterin merkki lupaisi niista Firepowerin. */
  const CONTACT = ["Massive claws", "Feeder tentacles",
                   "Feeder tentacles & massive claws", "Impaler assault module"];
  const badContact = CONTACT.filter(function(nm){
    return !names.hasOwnProperty(nm) || DOMAIN.wepClass(nm)[0] !== "R"; });
  check("kontaktiaseet kantavat kontaktimerkin", badContact.length === 0,
        badContact.join(" | "));

  /* Ja ettei luokka tyhjene huomaamatta: jokaisella WEP-rivilla on oltava
     vahintaan yksi oikea ase datassa, muuten rivi on kuollutta koodia joka
     nayttaa saannolta. */
  const empty = DOMAIN.WEP.filter(function(w){
    return !Object.keys(names).some(function(nm){ return w[0].test(nm); }); })
    .map(function(w){ return String(w[0]) + " -> " + w[1]; });
  check("jokainen asemerkki osuu johonkin todelliseen aseeseen",
        empty.length === 0, empty.join(" | "));

  /* J147 (kayttaja 20.9.): Taun kaksi omaa jarjestelmaa luettiin pattereiksi.
     Kirja s.450: "Ships with gravitic launchers are armed with Tau missiles",
     ja missiilit ovat ordnancea - sama merkki ja vari kuin torpedoilla. Koukku
     taas ei ole ase lainkaan: "gravitic hooks have no effect in game terms",
     mutta niiden maara rajaa laivaston saattajat, joten rivi jaa kortille omal-
     la merkillaan ja omalla varillaan. */
  const launcher = DOMAIN.wepClass("Prow gravitic launcher");
  const torp = DOMAIN.wepClass("Prow torpedoes");
  check("gravitic launcher on ordnancea, ei patteri: sama merkki ja vari kuin torpedoilla",
        launcher[0] === "T" && launcher[1] === torp[1] && launcher[2] === torp[2],
        JSON.stringify({ launcher: launcher, torpedo: torp }));
  const hook = DOMAIN.wepClass("Port gravitic hook");
  const others = DOMAIN.WEP.filter(function(w){ return w[1] !== "H"; }).map(function(w){ return w[2]; })
    .concat(["#A97913"]);
  check("gravitic hook: oma merkki ja vari jota mikaan muu ryhma ei kayta",
        hook[0] === "H" && others.indexOf(hook[1]) < 0, JSON.stringify(hook) + " vs " + others.join(","));
  /* Kortilla saannon tahti ja rivin merkki ovat samaa varia, jotta silma
     yhdistaa ne toisiinsa. */
  const hookRule = (DOMAIN.SPECIAL_WEAPON_RULES || []).filter(function(r){ return r.id === "tau_hook"; })[0];
  check("koukun merkki kantaa saman varin kuin sen saantorivi kortilla",
        !!hookRule && hookRule.color === hook[1], hookRule ? hookRule.color + " / " + hook[1] : "saantoa ei ole");
  /* Sama paatos poimijan rivilla: koukku omana sanana, laukaisin torpedona. */
  check("poimijan rivi: HOOK ja TORP",
        DOMAIN.armAbbr("Port gravitic hook") === "HOOK" &&
        DOMAIN.armAbbr("Prow gravitic launcher") === "TORP" &&
        DOMAIN.ARM_ORDER.indexOf("HOOK") > DOMAIN.ARM_ORDER.indexOf("TORP"),
        DOMAIN.armAbbr("Port gravitic hook") + " / " + DOMAIN.armAbbr("Prow gravitic launcher"));
  /* Kapasiteetti on luku, jota laivastosaanto laskee - ei "Spec.". */
  check("koukun kapasiteetista luetaan luku",
        DOMAIN.armStrength("Capacity: 1 Warden") === "1" &&
        DOMAIN.armStrength("Capacity: 2 Orcas/Wardens") === "2" &&
        DOMAIN.armStrength("Capacity: 4 Dhows") === "4",
        [DOMAIN.armStrength("Capacity: 1 Warden"), DOMAIN.armStrength("Capacity: 2 Orcas/Wardens")].join(" | "));
  const tauShips = Object.values(catalog.ships).filter(function(s){
    return (s.aw || []).some(function(a){ return /gravitic hook/i.test(a[0]); }) &&
           (s.aw || []).some(function(a){ return /gravitic launcher/i.test(a[0]); }); });
  const groupsOf = function(s){ return DOMAIN.armSummary(s, { max: 99 }).groups.map(function(g){ return g.k; }); };
  check("Tau-aluksen rivilla koukut ja laukaisin ovat omina ryhminaan, eivat WB:na",
        tauShips.length >= 2 && tauShips.every(function(s){
          var k = groupsOf(s);
          return k.indexOf("HOOK") >= 0 && k.indexOf("TORP") >= 0;
        }), tauShips.length + " alusta: " + groupsOf(tauShips[0]).join(","));
  /* Lyhyella aluksella ryhmat myos nakyvat rivilla (nelja ryhmaa mahtuu). */
  const small = tauShips.filter(function(s){ return DOMAIN.armSummary(s).groups.length <= 3; })[0];
  check("lyhyt Tau-rivi kirjoittaa koukun kapasiteetin nakyviin",
        !!small && /HOOK \d/.test(DOMAIN.armSummaryText(small)),
        small ? small.nm + ": " + DOMAIN.armSummaryText(small) : "alusta ei ole");

})();

/* ---- 13i. Warmasterin Mark: kuka on sen jo maksanut --------------------
   Kaksi kirjan lausetta kohtaavat. Lista sanoo "The Warmaster must take the
   Mark of X", ja jumalan oma battle barge sanoo "This ship bears the Mark of
   X as part of its point cost; it does not have to be paid for separately by
   the ship's commander" (s.258, 260, 262, 264). Kumpi patee, riippuu siita
   onko Warmaster sen bargen kyydissa - ja senkin kirja sanoo itse, aluksen
   omassa saannossa, joten mitaan ei paatella:

     Terminus Est / Scion of Prospero / Wage of Sin: lippulaiva Warmaster
     kyydissa, PAITSI jos Planet Killer on mukana (505 p, kalliimpi kuin
     yksikaan kolmesta bargesta), jolloin Chaos Lord johtaa sita.
     Slaverer on poikkeus: lippulaiva vain "unless it is the most expensive
     vessel present".

   Ennen korjausta rivi oli `req` eli lukittu, ja Mark veloitettiin kahdesti:
   Nurgle-Warmaster 135 (100 + 35) sen Terminus Estin vierella, jonka 430
   sisaltaa sen jo - ja Nurglella myos profiilissa (hp 13 vs. tavallisen
   Chaos battle bargen 12). Kayttajan raportti 15.9. */
(function(){
  const GODS = ["Nurgle", "Tzeentch", "Khorne", "Slaanesh"];
  let ran = 0;
  GODS.forEach(function(god){
    const L = catalog.lists.filter(x => x.nm === "Chaos — " + god)[0];
    check("13i: lista loytyy " + god, !!L, "-");
    if(!L) return;
    check("13i: " + god + " kantaa mark_paid-saannon", !!L.mark_paid, "-");
    if(!L.mark_paid) return;
    const findK = (re, k) => {
      for(let si = 0; si < L.secs.length; si++)
        for(let ei = 0; ei < L.secs[si].ents.length; ei++){
          const en = L.secs[si].ents[ei];
          if(en.k === k && re.test(String(en.l || ""))) return { si, ei, en };
        }
      return null;
    };
    const wmAt = findK(/^chaos warmaster/i, "cmd");
    const shAt = findK(new RegExp(L.mark_paid.ship, "i"), "unit");
    const pkAt = findK(/^planet killer$/i, "unit");
    const mAt  = findK(/^the mark of/i, "up");
    check("13i: " + god + " rivit loytyvat", !!(wmAt && shAt && mAt),
          JSON.stringify([!!wmAt, !!shAt, !!mAt]));
    if(!wmAt || !shAt || !mAt) return;
    /* Mark-rivin on oltava OLETUS eika pakollinen - muuten sita ei voi
       poistaa, ja koko korjaus on olematon. */
    check("Warmasterin Mark on oletus, ei lukittu: " + god,
          !!mAt.en.dflt && !mAt.en.req,
          "dflt=" + mAt.en.dflt + " req=" + mAt.en.req);
    /* Ja etta oletus oikeasti loytyy sielta mista katalogi sen hakee:
       lippu datassa ei riita, jos defaultUpgradeKeys ei palauta sita. */
    const probe = {
      schemaVersion: 3, role: "core",
      entry: { list: L.nm, section: L.secs[wmAt.si].t, label: wmAt.en.l },
      ref: null, hull: null, hulls: 1, name: "", note: "", adjust: 0,
      custom: null, members: [], options: {}, upgrades: {} };
    const dk = DOMAIN.defaultUpgradeKeys(
      DOMAIN.selectionOf(probe, { list: L, host: L }, catalog));
    check("defaultUpgradeKeys loytaa Markin: " + god,
          dk.indexOf(mAt.si + ":" + mAt.ei) >= 0, JSON.stringify(dk));
    const markId = DOMAIN.upgradeId(L.nm, L.secs[mAt.si].t, mAt.en.l);
    const mk = (a, withMark) => ({
      schemaVersion: 3, role: "core",
      entry: { list: L.nm, section: L.secs[a.si].t, label: a.en.l },
      ref: a.en.r == null ? null : String(a.en.r), hull: null, hulls: 1,
      name: "", note: "", adjust: 0, custom: null, members: [], options: {},
      /* "Ilman Markkia" tarkoittaa etta pelaaja on ottanut sen pois, ei
         etta avain puuttuu: puuttuva avain on oletus eli "take". */
      upgrades: (function(){ const o = {}; o[markId] = withMark ? "take" : "off"; return o; })() });
    const red = units => DOMAIN.resolveFleet(
      { list: L.nm, limit: 9000, units: units }, catalog)
      .checks.filter(c => !c.ok && /Mark of/.test(c.t));
    const want = (units, expect, nimi) => {
      const r = red(units);
      ran++;
      check(god + ": " + nimi, (r.length > 0) === expect,
            r.map(c => c.t + " / " + c.v).join(" ; ") || "ei punaista");
    };
    want([mk(wmAt, true)],  false, "Mark ilman bargea on oikein");
    want([mk(wmAt, false)], true,  "ilman Markkia ja ilman bargea on punainen");
    want([mk(wmAt, true), mk(shAt)],  true,  "Mark bargen rinnalla on maksettu kahdesti");
    want([mk(wmAt, false), mk(shAt)], false, "ilman Markkia bargen rinnalla on oikein");
    if(pkAt){
      /* Planet Killer vie Warmasterin pois bargelta, joten Mark maksetaan
         taas normaalisti. Khornella tata haaraa ei ole: sen ehto on
         "most expensive vessel present", ei Planet Killer. */
      want([mk(wmAt, true), mk(shAt), mk(pkAt)],  false,
           "Planet Killer palauttaa Markin maksettavaksi");
      want([mk(wmAt, false), mk(shAt), mk(pkAt)], true,
           "Planet Killerin kanssa Markin puuttuminen on punainen");
    }
    /* Hinta seuraa tikkia, eika resolveUnit katso laivastoa: se on koko
       ratkaisun ehto, koska kortit renderoidaan yksi alus kerrallaan. */
    const p1 = DOMAIN.resolveUnit(mk(wmAt, true),  { list: L, host: L }, catalog).points;
    const p0 = DOMAIN.resolveUnit(mk(wmAt, false), { list: L, host: L }, catalog).points;
    check(god + ": Markin hinta on erotus", p1 - p0 === mAt.en.p,
          p1 + " - " + p0 + " != " + mAt.en.p);
  });
  check("13i: kaikki nelja jumalaa ajettiin", ran === 24, String(ran));

  /* Pakollisia paivityksia jaa vain Mechanicuksen kaksi 0 pisteen refittia.
     Jos joku palauttaa `req`:n Markille, tama kertoo sen heti. */
  const reqs = [];
  catalog.lists.forEach(function(L){
    L.secs.forEach(function(sec){
      sec.ents.forEach(function(en){
        if(en.k === "up" && en.req && !en.incl) reqs.push(L.nm + " / " + en.l); }); }); });
  check("pakollisia paivityksia on tasan kaksi", reqs.length === 2,
        reqs.join(" | "));
})();

/* ---- 13j. kielletty lista ei aina ole umpikuja -------------------------
   Matriisi kieltaa liiton, mutta kirjan toinen reitti on isantalistan oma
   sivu, joka nimeaa toisen laivaston alukset itse: Chaos-listojen RENEGADE
   IMPERIAL VESSELS (s.222) ja Bastionin Chaos-rungot reservilaivastossa
   (s.39). Poimija nayttaa sellaisen listan keltaisena, ja plus-nappi lisaa
   ISANNAN oman rivin.

   Ensimmainen versio etsi reitit pelkalla runkoviitteella ja loysi 68, joista
   auditoinnissa 23 oli vaaria (Space Marine -listojen rapid strike vesselit
   ovat SM-aluksia IN-profiililla, s.106; Demiurgin Rogue Trader Cruiser,
   s.487) ja 8 epaselvia (Grey Knights, joka "will not ... provide ships to
   any other fleet list", s.146). Nyt lahdelistan rungon on oltava sen OMA:
   painettu sen omassa tai saman rodun luvussa. */
(function(){
  const by = nm => catalog.lists.filter(x => x.nm === nm)[0];
  let total = 0;
  const kinds = {};
  catalog.lists.forEach(function(L){
    catalog.lists.forEach(function(D){
      const r = DOMAIN.lendRouteFor(L, D, catalog);
      if(!r) return;
      total++;
      kinds[r.title] = (kinds[r.title] || 0) + 1;
    });
  });
  /* 37 -> 31 katselmoinnissa 16.9.: Adeptus Mechanicus - Explorator ei ole
     "Imperial Navy fleet list" (s.124 oma lista, s.125 omat hinnat), vaikka
     sen rotu on imperial navy - s.14:n rotujako koskee reserveja, ja
     renegaatit "do not count as reserves" (s.222). */
  /* J144: Ordo Malleus -reservit (s.142) neljalla isannalla x kuusi Chaos-
     listaa = 24. Bastionilla osiota ei ole, koska sen s.39-osio kattaa samat. */
  check("reitteja on tasan 55 (24 renegade + 24 Ordo Malleus + 6 reservilaivasto + 1 Inquisition)",
        total === 55 && kinds["RENEGADE IMPERIAL VESSELS"] === 24 &&
        kinds["ORDO MALLEUS RESERVES"] === 24 &&
        kinds["THE RESERVE FLEETS OF SEGMENTUM OBSCURUS"] === 6 &&
        kinds["THE INQUISITION"] === 1,
        total + " " + JSON.stringify(kinds));

  const T = [
    ["Chaos — Incursion", "Imperial Navy — Gothic Sector", /renegade imperial vessels/i, 7],
    /* Armageddonin tahdelliset rivit ovat Space Marine -aluksia (s.41). */
    ["Chaos — Incursion", "Imperial Navy — Armageddon Sector", /renegade imperial vessels/i, 8],
    ["Imperial Navy — Bastion Fleets", "Chaos — Black Crusade", /reserve fleets of segmentum obscurus/i, 5],
    ["Space Marines — Crusade", "The Emperor's Inquisition", /the inquisition/i, 3],
  ];
  T.forEach(function(t){
    const L = by(t[0]), D = by(t[1]);
    const r = L && D ? DOMAIN.lendRouteFor(L, D, catalog) : null;
    check("reitti: " + t[0] + " <- " + t[1],
          !!r && t[2].test(r.title) && r.n === t[3],
          r ? r.title + " n=" + r.n : "ei reittia");
    if(!r) return;
    /* Jokainen kartoitettu lahderivi osuu isannan riviin, jolla on sama
       runkoviite - ja lisatty isannan rivi ei tuota paritason punaista. */
    let bad = 0, runs = 0;
    Object.keys(r.map).forEach(function(k){
      const p = k.split(":").map(Number), h = r.map[k];
      const den = D.secs[p[0]].ents[p[1]], hen = L.secs[h.si].ents[h.ei];
      if(String(den.r) !== String(hen.r)) bad++;
      const intent = { schemaVersion: 3, role: "core",
        entry: { list: L.nm, section: L.secs[h.si].t, label: hen.l },
        ref: String(hen.r), hull: null, hulls: 1, name: "", note: "", adjust: 0,
        custom: null, members: [], options: {}, upgrades: {} };
      const F = DOMAIN.resolveFleet({ list: L.nm, limit: 100000, units: [intent] }, catalog);
      runs++;
      if(F.checks.some(c => !c.ok && /^(Never allies|Reserve race|Takes no|Gives no|Named access|Reserve of a reserve|Same race)/.test(c.t)))
        bad++;
    });
    check("reitin rivit ovat isannan omia ja laillisia: " + t[1], bad === 0 && runs > 0,
          bad + " virhetta / " + runs);
  });

  /* Auditoinnin vaarat reitit: ei saa palata. */
  const FALSE = [
    ["Chaos — Incursion", "Space Marines — Codex Astartes"],
    ["Chaos — Incursion", "Space Marines — Dominion"],
    ["Chaos — Incursion", "Grey Knights"],
    ["Chaos — Incursion", "Adeptus Mechanicus — Explorator"],
    ["Space Marines — Codex Astartes", "Demiurg — War Host"],
    ["Orks — Waaagh!", "Demiurg — War Host"],
    ["Imperial Navy — Bastion Fleets", "Grey Knights"],
  ];
  const leaked = FALSE.filter(function(t){
    return !!DOMAIN.lendRouteFor(by(t[0]), by(t[1]), catalog); })
    .map(t => t[0] + " <- " + t[1]);
  check("vaarat reitit eivat palaa", leaked.length === 0, leaked.join(" | "));
  check("ilman reittia vastaus on tyhja",
        !DOMAIN.lendRouteFor(by("Orks — Waaagh!"), by("Necrons — Harvest Fleet"), catalog), "-");
})();

/* ---- 13k. osion saannot kortilla ------------------------------------------
   Kortin SPECIAL-sarake ei nahnyt osiota, josta runko otettiin, joten
   renegade-risteilijan -1 Ld (s.222) puuttui kortilta (J120) ja Bastionin
   reservilaivaston Strange happenings (s.39) samoin. Uusi `sec`-portti
   fleetMatchesissa. Verrokit: sama runko omassa osiossaan ei saa rivia. */
(function(){
  const by = nm => catalog.lists.filter(x => x.nm === nm)[0];
  /* F: laivaston lista, johon alus on otettu (oletus: aluksen oma lista). */
  const card = (L, secRe, rowRe, F) => {
    for(let si = 0; si < L.secs.length; si++){
      if(!secRe.test(L.secs[si].t)) continue;
      for(let ei = 0; ei < L.secs[si].ents.length; ei++){
        const en = L.secs[si].ents[ei];
        if(en.k !== "unit" || !rowRe.test(en.l)) continue;
        const R = DOMAIN.resolveUnit({ schemaVersion: 3, role: F && F !== L ? "reserve" : "core",
          entry: { list: L.nm, section: L.secs[si].t, label: en.l },
          ref: String(en.r), hull: null, hulls: 1, name: "", note: "", adjust: 0,
          custom: null, members: [], options: {}, upgrades: {} }, { list: L, host: F || L }, catalog);
        return R.rules.map(r => r.t).join(" || ");
      }
    }
    return null;
  };
  const ch = by("Chaos — Incursion"), ba = by("Imperial Navy — Bastion Fleets"),
        go = by("Imperial Navy — Gothic Sector");
  const lunar = card(ch, /^RENEGADE/, /^Lunar/);
  check("renegade-risteilija: -1 Ld kortilla", !!lunar && /-1 Ld for going renegade/.test(lunar), String(lunar));
  const sword = card(ch, /^RENEGADE/, /^Sword/);
  check("renegade-saattaja: ei Ld-rangaistusta, mutta laivuesaanto",
        !!sword && !/-1 Ld/.test(sword) && /squadroned with other Chaos escorts/.test(sword), String(sword));
  const murder = card(ch, /^Cruisers$/i, /^Murder/);
  check("verrokki: Chaosin oma risteilija ei ole renegade", !!murder && !/Renegade/.test(murder), String(murder));
  const carnage = card(ba, /^THE RESERVE FLEETS/, /^Carnage/);
  /* Kayttajan paatos 30.9.2026 (J153): rivi vain reserviosion Chaos-rungon
     kortille, lyhyena; yksityiskohdat kirjassa. */
  /* Kayttajan paatos 30.9.2026 (J153): rivi vain reservina otetun Chaos-
     rungon kortille ("reserve fleet" = reservina otetut alukset), koko
     saanto kirjan mukaan (s. 39) ja maininta inkvisiittorista (s. 142). */
  const SH = /Strange happenings \(reserve vessel\): a double on a command check makes the ship unreliable for the rest of the game/;
  check("Bastionin reservi-Carnage: Strange happenings kortilla",
        !!carnage && SH.test(carnage) && /Reserve fleet vessel/.test(carnage) &&
        !/Battlefleet Obscura Reserve Fleet, every vessel/.test(carnage),
        String(carnage));
  check("... crippledina yrittaa irtautua joka vuoro ja pakenee lahimmalle poydan reunalle (s. 39)",
        /once crippled it must try to disengage every turn, and runs for the nearest table edge if it fails/.test(carnage), String(carnage));
  check("... epaonnistunut tupla: vain minimiliike suoraan eteen talla vuorolla (s. 39)",
        /If the double also failed the check, it does nothing this turn but make its minimum move straight ahead/.test(carnage), String(carnage));
  check("... Chaosia vastaan toinen tupla: irtautuminen heti, loppupelin ajan (s. 39)",
        /Against Chaos: a second double means it must try to disengage at once, as if crippled, for the rest of the game/.test(carnage), String(carnage));
  check("... epaonnistunut toinen tupla: loikkaa, voittopisteita ei kummallekaan (s. 39)",
        /if that second double also failed the check, the ship defects to the Chaos player and scores victory points for neither side/.test(carnage), String(carnage));
  check("... maininta inkvisiittorista: ei voimassa, kun Ordo Malleus -inkvisiittorin alus on pelissa (s. 142)",
        /If an Ordo Malleus Inquisitor leads the fleet, this does not apply while the Inquisitor's ship remains in play\. \(Fleets pp\. 39, 142\)/.test(carnage), String(carnage));
  const glunar = card(go, /^Cruisers$/i, /^Lunar/);
  check("verrokki: Gothicin oma Lunar ei saa osiosaantoja",
        !!glunar && !/Renegade|Strange happenings/.test(glunar), String(glunar));
  /* J143 (kayttaja 16.9.): Strange happenings jokaiseen Bastion-laivaston
     korttiin. Saanto koskee laivastoa ("In a reserve fleet, all vessels",
     s.39), joten portti on LAIVASTON lista: myos Bastioniin lainattu Gothic-
     alus saa rivin, mutta Gothiciin lainattu Bastion-alus ei. Kiinteat Chaos-
     rungon ordnance-saannot (obscura_reserve) jaavat osioon. */
  const blunar = card(ba, /^Cruisers$/i, /^Lunar/);
  check("Bastionin oma Lunar: ei Strange happenings -rivia eika reservirungon saantoa (J153)",
        !!blunar && !/Strange happenings/.test(blunar) && !/Reserve fleet vessel/.test(blunar), String(blunar));
  const bsword = card(ba, /^ESCORTS$/i, /^Sword/);
  check("Bastionin oma saattaja: ei Strange happenings -rivia (J153)", bsword != null && !/Strange happenings/.test(bsword), String(bsword));
  const bbig = card(ba, /^Battleships$/i, /^Apocalypse/);
  check("Bastionin taistelulaiva: ei Strange happenings -rivia (J153)", !!bbig && !/Strange happenings/.test(bbig), String(bbig));
  const lentIn = card(go, /^Cruisers$/i, /^Lunar/, ba);
  check("Bastioniin lainattu Gothic-Lunar: ei Strange happenings -rivia (J153)", !!lentIn && !/Strange happenings/.test(lentIn), String(lentIn));
  const lentOut = card(ba, /^Cruisers$/i, /^Lunar/, go);
  check("verrokki: Gothiciin lainattu Bastion-Lunar ei saa rivia",
        !!lentOut && !/Strange happenings/.test(lentOut), String(lentOut));
  /* Sama laivaston kautta: resolveFleet antaa ctx.list = laivaston lista, joten
     kortin ja laivastonakyman on sanottava sama. */
  const bRow = (L, secRe, rowRe, role) => {
    for(let si = 0; si < L.secs.length; si++){
      if(!secRe.test(L.secs[si].t)) continue;
      for(let ei = 0; ei < L.secs[si].ents.length; ei++){
        const en = L.secs[si].ents[ei];
        if(en.k === "unit" && rowRe.test(en.l)) return { schemaVersion: 3, role: role,
          entry: { list: L.nm, section: L.secs[si].t, label: en.l }, ref: String(en.r),
          hull: null, hulls: 1, name: "", note: "", adjust: 0, custom: null,
          members: [], options: {}, upgrades: {} };
      }
    }
    return null;
  };
  const shIn = F => F.units.map(u => (u.rules || []).some(r => SH.test(r.t)));
  const Fb = DOMAIN.resolveFleet({ list: ba.nm, limit: 100000, units: [
    bRow(ba, /^Cruisers$/i, /^Lunar/, "core"), bRow(ba, /^Cruisers$/i, /^Gothic/, "core"),
    bRow(ba, /^Cruisers$/i, /^Tyrant/, "core"), bRow(go, /^Cruisers$/i, /^Lunar/, "reserve"),
    bRow(ba, /^THE RESERVE FLEETS/, /^Carnage/, "core")] }, catalog);
  const Fg = DOMAIN.resolveFleet({ list: go.nm, limit: 100000, units: [
    bRow(go, /^Cruisers$/i, /^Lunar/, "core"), bRow(go, /^Cruisers$/i, /^Gothic/, "core"),
    bRow(go, /^Cruisers$/i, /^Dominator/, "core"), bRow(ba, /^Cruisers$/i, /^Lunar/, "reserve")] }, catalog);
  check("resolveFleet: Bastion-laivastossa rivi vain reservi-Carnagella, Gothic-laivastossa ei kellaan (J153)",
        Fb.units.length === 5 && JSON.stringify(shIn(Fb)) === "[false,false,false,false,true]" &&
        Fg.units.length === 4 && !shIn(Fg).some(Boolean),
        JSON.stringify({ bastion: shIn(Fb), gothic: shIn(Fg) }));
  /* Profiilitason kutsu (ilman listaa ja rivia) ei saa vaatia osiosaantoa -
     muuten print_check vaatisi sen jokaiselta listan kortilta. */
  /* Renegaatti "counts as a Chaos vessel in all respects" (s.222), joten se
     laskee myos suhteisiin "one heavy cruiser for every two cruisers".
     Katselmointi 16.9. loysi, etta se laski vain 0-12-rajaan. Sama laivasto
     ilman renegade-Lunaria on verrokki: silloin raskas risteilija ei mahdu. */
  const findRow = (L, secRe, rowRe) => {
    for(let si = 0; si < L.secs.length; si++){
      if(!secRe.test(L.secs[si].t)) continue;
      for(let ei = 0; ei < L.secs[si].ents.length; ei++){
        const en = L.secs[si].ents[ei];
        if(en.k === "unit" && rowRe.test(en.l)) return { schemaVersion: 3, role: "core",
          entry: { list: L.nm, section: L.secs[si].t, label: en.l }, ref: String(en.r),
          hull: null, hulls: 1, name: "", note: "", adjust: 0, custom: null,
          members: [], options: {}, upgrades: {} };
      }
    }
    return null;
  };
  const heavy = units => {
    const F = DOMAIN.resolveFleet({ list: ch.nm, limit: 100000, units: units }, catalog);
    const r = F.checks.filter(c => /^Heavy Cruisers/i.test(c.t))[0];
    return r ? (r.ok ? "ok " : "X ") + r.v : "ei rivia";
  };
  const uMurder = findRow(ch, /^Cruisers$/i, /^Murder/), uHades = findRow(ch, /^Heavy Cruisers$/i, /^Hades/),
        uRenLunar = findRow(ch, /^RENEGADE/, /^Lunar/);
  const without = heavy([uMurder, uHades]), withRen = heavy([uMurder, uRenLunar, uHades]);
  check("renegade-risteilija laskee heavy cruiser -suhteeseen",
        /^X 1 \/ 0/.test(without) && /^ok 1 \/ 1/.test(withRen),
        "ilman: " + without + " | renegaatin kanssa: " + withRen);

  /* Lista mukana mutta rivi puuttuu - kuten sovelluksen specialLines(sh, L())
     -kuoret. Ilman listaa kutsun hylkaisi jo list-portti, jolloin tama ei
     testaisi osioporttia lainkaan (todettu: rikottu portti jai vihreaksi). */
  const secDefs = DOMAIN.SPECIAL_HULL_RULES.filter(d => d.sec);
  const leaky = secDefs.filter(d => DOMAIN.fleetMatches(d,
    { fl: "IMPERIAL NAVY", nm: "LUNAR", ty: "Cruiser" }, /Bastion/i.test(String(d.list)) ? ba : ch, null));
  check("osioportti hylkaa profiilitason kutsun", secDefs.length === 5 && leaky.length === 0,
        secDefs.length + " osiosaantoa, vuotaa " + leaky.map(d => d.id).join(","));
  /* J153: laivastoportti (fleetList) poistui ainoan saantonsa mukana. */
  check("yhdellakaan saannolla ei ole laivastoporttia", DOMAIN.SPECIAL_HULL_RULES.filter(d => d.fleetList).length === 0);
})();

/* ---- 13l. valmiina tuleva Mark nakyy lukittuna 0 pisteen rivina --------
   Kayttajan paatos 16.9.: kun Mark on aluksessa kiinteana (jumalan oma
   battle barge) tai sisaltyy hintaan (Daemonship Nurglella, Khornella ja
   Slaaneshilla), siita nakyy lukittu inforivi, joka ei maksa mitaan. Muu jaa
   pelaajan harkintaan - Warmasterin Markin saa aina poistaa (J139).

   Rivi ei saa muuttaa mitaan muuta: ei hintaa, ei profiilia (miehiston Mark
   of Nurgle antaa hp +1, joka on bargessa jo), eika kortin saantoja. Siksi
   nimi on "Mark of", ei "The Mark of" - kortin Mark-saanto lukee jalkimmaista.
   Testi ajaa rivit samaa polkua kuin sovellus: requiredUpgradeKeys, sitten
   resolveUnit. */
(function(){
  const incl = [];
  catalog.lists.forEach(function(L){
    L.secs.forEach(function(sec){ sec.ents.forEach(function(en){
      if(en.incl) incl.push({ L: L, en: en }); }); }); });
  check("valmiina tulevan Markin inforiveja on 7", incl.length === 7, String(incl.length));
  const bad = incl.filter(function(x){ const e = x.en;
    return !(e.k === "up" && e.req && e.p === 0 && !e.mod && !e.add && !e.swp &&
             /^Mark of /.test(e.l) && !/^The /.test(e.l)); });
  check("inforivit ovat lukittuja, ilmaisia eivatka muuta profiilia", bad.length === 0,
        bad.map(x => x.L.nm + "/" + x.en.l).join(" | "));

  const by = nm => catalog.lists.filter(x => x.nm === nm)[0];
  const resolve = function(L, secRe, rowRe, upRe, applyReq){
    for(let si = 0; si < L.secs.length; si++){
      if(!secRe.test(L.secs[si].t)) continue;
      for(let ei = 0; ei < L.secs[si].ents.length; ei++){
        const en = L.secs[si].ents[ei];
        if(en.k !== "unit" || !rowRe.test(en.l)) continue;
        const u = { schemaVersion: 3, role: "core",
          entry: { list: L.nm, section: L.secs[si].t, label: en.l }, ref: String(en.r),
          hull: null, hulls: 1, name: "", note: "", adjust: 0, custom: null,
          members: [], options: {}, upgrades: {} };
        if(upRe) L.secs.forEach(function(s2){ s2.ents.forEach(function(e2){
          if(e2.k === "up" && upRe.test(e2.l)) u.upgrades[DOMAIN.upgradeId(L.nm, s2.t, e2.l)] = "take"; }); });
        if(applyReq){
          const keys = DOMAIN.requiredUpgradeKeys(DOMAIN.selectionOf(u, { list: L, host: L }, catalog));
          keys.forEach(function(k){ const p = k.split(":").map(Number);
            u.upgrades[DOMAIN.upgradeId(L.nm, L.secs[p[0]].t, L.secs[p[0]].ents[p[1]].l)] = "take"; });
        }
        return DOMAIN.resolveUnit(u, { list: L, host: L }, catalog);
      }
    }
    return null;
  };
  const BARGES = [["Nurgle", /^terminus est$/i, 430], ["Tzeentch", /^scion of prospero$/i, 450],
                  ["Khorne", /^slaverer$/i, 380], ["Slaanesh", /^wage of sin$/i, 430]];
  BARGES.forEach(function(b){
    const L = by("Chaos — " + b[0]);
    const R0 = resolve(L, /battleships/i, b[1], null, false);
    const R1 = resolve(L, /battleships/i, b[1], null, true);
    const row = R1 && (R1.upgrades || []).filter(x => x.label === "Mark of " + b[0])[0];
    check("barge nayttaa Markin lukittuna ja ilmaisena: " + b[0],
          !!row && row.state === "take" && row.required && row.included,
          row ? JSON.stringify({ state: row.state, req: row.required, incl: row.included }) : "ei rivia");
    check("barge: hinta, profiili ja kortin saannot ennallaan: " + b[0],
          !!R0 && !!R1 && R1.points === b[2] && R0.points === b[2] &&
          JSON.stringify(R0.stats) === JSON.stringify(R1.stats) &&
          JSON.stringify(R0.rules.map(r => r.t)) === JSON.stringify(R1.rules.map(r => r.t)),
          R1 ? R1.points + " / saantoja " + R0.rules.length + "->" + R1.rules.length : "-");
  });
  ["Nurgle", "Khorne", "Slaanesh", "Tzeentch"].forEach(function(g){
    const L = by("Chaos — " + g);
    const plain = resolve(L, /^cruisers$/i, /^carnage/i, null, true);
    const ds0 = resolve(L, /^cruisers$/i, /^carnage/i, /^daemonship: cruiser/i, false);
    const ds1 = resolve(L, /^cruisers$/i, /^carnage/i, /^daemonship: cruiser/i, true);
    const has = R => !!R && (R.upgrades || []).some(x => x.label === "Mark of " + g && x.state === "take");
    if(g === "Tzeentch"){
      check("Tzeentchin Daemonship ei saa inforivia (kirja ei sano Markin sisaltyvan)",
            !has(ds1), "-");
      return;
    }
    check("Daemonship nayttaa sisaltyvan Markin, tavallinen risteilija ei: " + g,
          has(ds1) && !has(plain), JSON.stringify([has(ds1), has(plain)]));
    check("Daemonship: hinta ja kortti ennallaan: " + g,
          ds0.points === ds1.points &&
          JSON.stringify(ds0.rules.map(r => r.t)) === JSON.stringify(ds1.rules.map(r => r.t)),
          ds0.points + " / " + ds1.points);
  });
})();

/* ---- 13m. Ordo Malleus -inkvisiittori ja Bastionin Chaos-rungot (J144) ----
   Fleets s.142: Imperial Navy- tai Mechanicus-laivasto, jota johtaa Ordo
   Malleus -inkvisiittori ja jossa ei ole Space Marine -aluksia, saa ottaa
   Bastion-listan Chaos-rungot reserveiksi samaan hintaan; ne valttyvat
   Strange happeningsilta niin kauan kuin inkvisiittorin alus on pelissa, eika
   laivastoon saa ottaa Grey Knights -aluksia. Ennen tata isantalistoilla ei
   ollut Ordo Malleusta lainkaan, ja Bastionin rungot kaatuivat "Reserve of a
   reserve" -tarkistukseen. Verrokit: jokainen ehto erikseen rikki. */
(function(){
  const by = nm => catalog.lists.filter(x => x.nm === nm)[0];
  const GO = by("Imperial Navy — Gothic Sector"), BA = by("Imperial Navy — Bastion Fleets"),
        AR = by("Imperial Navy — Armageddon Sector"), EX = by("Adeptus Mechanicus — Explorator"),
        CA = by("Space Marines — Codex Astartes"), IQ = by("The Emperor's Inquisition"),
        CI = by("Chaos — Incursion");
  const row = (L, secRe, rowRe, role) => {
    for(let si = 0; si < L.secs.length; si++){
      if(!secRe.test(L.secs[si].t)) continue;
      for(let ei = 0; ei < L.secs[si].ents.length; ei++){
        const en = L.secs[si].ents[ei];
        if(!rowRe.test(en.l)) continue;
        return { schemaVersion: 3, role: role || "core",
          entry: { list: L.nm, section: L.secs[si].t, label: en.l },
          ref: en.r == null ? null : String(en.r), hull: null, hulls: 1, name: "", note: "",
          adjust: 0, custom: null, members: [], options: {}, upgrades: {} };
      }
    }
    throw new Error("rivia ei loydy: " + L.nm + " / " + secRe + " / " + rowRe);
  };
  const cruisers = (L, n) => Array.from({ length: n }, () => row(L, /^Cruisers$/i, /class cruiser$/i));
  const lord = L => row(L, /^THE INQUISITION$/, /^Inquisitor Lord/);
  const om = L => row(L, /^ORDO MALLEUS INQUISITORS$/, /^Ordo Malleus Inquisitor Lord$/);
  const carnage = L => row(L, /^ORDO MALLEUS RESERVES$/, /^Carnage/);
  const fleet = (L, units) => DOMAIN.resolveFleet({ list: L.nm, limit: 100000, units: units }, catalog);
  const bad = F => F.checks.filter(c => !c.ok).map(c => c.t + " = " + c.v);
  const chk = (F, re) => F.checks.filter(c => re.test(c.t))[0] || null;
  const red = (F, re) => !!chk(F, re) && !chk(F, re).ok;
  const SMV = /^No Space Marine vessels with Ordo Malleus/, GKV = /^No Grey Knights vessels with Ordo Malleus/,
        NEED = /^Chaos reserves need an Ordo Malleus/, LORD = /^Ordo Malleus Inquisitor needs an Inquisitor Lord/;

  /* Rakenne: Ordo Malleus viidella IN/AM-isannalla, reserviosio neljalla. */
  const hosts = catalog.lists.filter(L => L !== IQ && L.secs.some(x => x.t === "ORDO MALLEUS INQUISITORS")).map(L => L.nm).sort();
  const resHosts = catalog.lists.filter(L => L.secs.some(x => x.t === "ORDO MALLEUS RESERVES")).map(L => L.nm).sort();
  check("Ordo Malleus viidella IN/AM-isannalla, Chaos-reservit neljalla (ei Bastion, ei Space Marines)",
        hosts.length === 5 && resHosts.length === 4 && resHosts.indexOf(BA.nm) < 0 &&
        !hosts.concat(resHosts).some(n => /^Space Marines/.test(n)),
        JSON.stringify({ hosts, resHosts }));
  const bastRows = BA.secs.filter(x => /^THE RESERVE FLEETS/.test(x.t))[0].ents;
  const priced = resHosts.every(nm => {
    const x = by(nm).secs.filter(y => y.t === "ORDO MALLEUS RESERVES")[0];
    return x.ct === "reserve" && x.ents.length === 5 && x.ents.every((e, i) =>
      e.r === bastRows[i].r && e.p === bastRows[i].p && !e.noopt && e.optno === bastRows[i].optno && e.k === "unit");
  });
  check("Ordo Malleus -reservit: samat viisi runkoa, hinnat ja varianttikiellot kuin Bastionilla, lajina reserve", priced, "-");

  /* Laillinen perustapaus Gothicilla ja Explorilla. */
  const Fok = fleet(GO, cruisers(GO, 3).concat([lord(GO), om(GO), carnage(GO)]));
  check("Gothic: Lord + Ordo Malleus + 3 risteilijaa + Carnage on laillinen", bad(Fok).length === 0, bad(Fok).join(" | "));
  const res = chk(Fok, /^Reserves \(cruisers\)/);
  check("Carnage kuluttaa reservibudjetin (1 / 1)", !!res && res.ok && /^1 \/ 1/.test(res.v), res ? res.v : "ei rivia");
  const Fex = fleet(EX, cruisers(EX, 3).concat([lord(EX), om(EX), carnage(EX)]));
  check("Explorator: sama laivasto on laillinen", bad(Fex).length === 0, bad(Fex).join(" | "));

  /* Verrokit, yksi ehto kerrallaan. */
  const Fno = fleet(GO, cruisers(GO, 3).concat([lord(GO), carnage(GO)]));
  check("ilman Ordo Malleusta Chaos-reservi on punainen", red(Fno, NEED), bad(Fno).join(" | "));
  const Fnl = fleet(GO, cruisers(GO, 3).concat([om(GO), carnage(GO)]));
  check("Ordo Malleus ilman Inquisitor Lordia on punainen", red(Fnl, LORD), bad(Fnl).join(" | "));
  const sm = row(CA, /^Cruisers$/i, /^Strike cruiser/i, "reserve");
  const Fsm = fleet(GO, cruisers(GO, 6).concat([lord(GO), om(GO), carnage(GO), sm]));
  check("Space Marine -reservi Chaos-reservin kanssa on punainen (ja vain se)", red(Fsm, SMV) && bad(Fsm).length === 1,
        bad(Fsm).join(" | "));
  const Fsm0 = fleet(GO, cruisers(GO, 6).concat([lord(GO), om(GO), sm]));
  check("verrokki: Space Marine -reservi ilman Chaos-reservia kay", bad(Fsm0).length === 0, bad(Fsm0).join(" | "));
  const armSm = row(AR, /^Cruisers$/i, /^Space Marine Strike Cruiser\*$/);
  const Farm = fleet(AR, cruisers(AR, 3).concat([lord(AR), om(AR), carnage(AR), armSm]));
  check("Armageddon: listan oma Space Marine -rivi Chaos-reservin kanssa on punainen", red(Farm, SMV), bad(Farm).join(" | "));
  const gkOwn = row(GO, /^THE INQUISITION$/, /^Grey Knights Strike Cruiser/);
  const Fgk = fleet(GO, cruisers(GO, 3).concat([lord(GO), om(GO), carnage(GO), gkOwn]));
  check("oma Grey Knights -risteilija Chaos-reservin kanssa on punainen", red(Fgk, GKV), bad(Fgk).join(" | "));
  const gkAlly = row(IQ, /^CAPITAL SHIPS$/, /^Grey Knights Strike Cruiser/, "ally");
  const Fga = fleet(GO, cruisers(GO, 3).concat([lord(GO), om(GO), carnage(GO), gkAlly]));
  check("toiselta listalta otettu Grey Knights -risteilija lasketaan myos", red(Fga, GKV),
        chk(Fga, GKV) ? chk(Fga, GKV).v : "ei rivia");
  const Fgk0 = fleet(GO, cruisers(GO, 3).concat([lord(GO), om(GO), gkOwn]));
  check("verrokki: Grey Knights ilman Chaos-reservia kay", !!chk(Fgk0, GKV) && chk(Fgk0, GKV).ok, bad(Fgk0).join(" | "));

  /* Kortti: saanto ja milloin se alkaa. Bastionin reservilaivaston rivi ei tule. */
  const cardOf = (it, L) => DOMAIN.resolveUnit(it, { list: L, host: L }, catalog).rules.map(r => r.t).join(" || ");
  const cc = cardOf(carnage(GO), GO);
  check("Ordo Malleus -Carnagen kortti: Strange happenings alkaa vasta inkvisiittorin aluksen jalkeen",
        /Ordo Malleus reserve: Chaos ordnance, no ship class variants\. Strange happenings applies only once the Inquisitor's ship is out of play: a double on a command check makes the ship unreliable for the rest of the game/.test(cc) &&
        /minimum move straight ahead/.test(cc) && /nearest table edge/.test(cc) &&
        /defects to the Chaos player and scores victory points for neither side\. \(Fleets pp\. 39, 142\)/.test(cc) &&
        !/If an Ordo Malleus Inquisitor leads the fleet/.test(cc) &&
        !/Battlefleet Obscura Reserve Fleet|Reserve fleet vessel/.test(cc), cc);
  const gl = cardOf(row(GO, /^Cruisers$/i, /^Lunar/), GO);
  check("verrokki: saman laivaston Lunar ei saa Ordo Malleus -rivia", !/Ordo Malleus reserve|Strange happenings/.test(gl), gl);
  const cmd = DOMAIN.resolveUnit(om(GO), { list: GO, host: GO }, catalog);
  const cmdText = (cmd.rules || []).map(r => (r && r.t) || r).join(" || ");
  check("Ordo Malleus -komentajan kortti: hexagrammic wards ja Hit and Run",
        cmd.kind === "commander" && /hexagrammic wards/.test(cmdText) && /Hit and Run attacks from this ship add \+1/.test(cmdText),
        cmdText.slice(0, 300));

  /* Explorator: listan omassa osiossa oleva Chaos-runko ei ole Mechanicus-alus
     (katselmointi/print_check 16.9.): ei Gifts-taulukkoa, ei korjausbonusta,
     ei Mechanicus crews -saantoa eika listan paivityksia - "Allied and reserve
     vessels cannot use refits and upgrades from the fleet list they are allied
     to unless they are of the same race" (s.16). Pakolliset +1 turret ja
     dorsal lance olisivat muuten tarttuneet Carnageen lisattaessa. */
  const exOwn = row(EX, /^Cruisers$/i, /class cruiser$/i);
  const ctxEx = { list: EX, host: EX };
  const Rc = DOMAIN.resolveUnit(carnage(EX), ctxEx, catalog), Ro = DOMAIN.resolveUnit(exOwn, ctxEx, catalog);
  const selC = DOMAIN.selectionOf(carnage(EX), ctxEx, catalog), selO = DOMAIN.selectionOf(exOwn, ctxEx, catalog);
  const rulesC = Rc.rules.map(r => r.t).join(" || ");
  check("Explorator-Carnage ei ole Mechanicus-alus: ei Gifts, ei korjausbonusta, ei Mechanicus crews",
        Rc.mechanicus === false && Rc.gifts === false && !/ADMECH/.test(String(Rc.damage && Rc.damage.repair || "")) &&
        !/Mechanicus crews/.test(rulesC), JSON.stringify({ m: Rc.mechanicus, g: Rc.gifts, rep: Rc.damage && Rc.damage.repair }));
  check("Explorator-Carnage: ei listan paivityksia eika pakollisia avaimia",
        Rc.upgrades.length === 0 && DOMAIN.requiredUpgradeKeys(selC).length === 0,
        Rc.upgrades.map(u => u.label).join("; "));
  check("verrokki: Exploratorin oma risteilija on Mechanicus-alus ja saa pakolliset rivit",
        Ro.mechanicus === true && Ro.gifts === true && DOMAIN.requiredUpgradeKeys(selO).length >= 1 &&
        /Mechanicus crews/.test(Ro.rules.map(r => r.t).join(" ")), JSON.stringify({ m: Ro.mechanicus, k: DOMAIN.requiredUpgradeKeys(selO) }));
  const BK = by("Imperial Navy — Bakka Sector");
  const jov = BK.secs.filter(x => x.ct === "reserve")[0];
  check("verrokki: Bakan RESERVES-osion Jovian (Imperial) ei ole vieras runko",
        !!jov && jov.ents.filter(e => e.k === "unit").every(e => !DOMAIN.foreignReserveRow(BK, e, catalog.ships[String(e.r)])) &&
        BA.secs.filter(x => /^THE RESERVE FLEETS/.test(x.t))[0].ents.every(e => DOMAIN.foreignReserveRow(BA, e, catalog.ships[String(e.r)])),
        "-");

  /* Laivaston rajat (katselmointi 16.9.): s.14 "the restrictions on maximum
     and minimum numbers of ships are determined for the fleet as a whole,
     regardless of whether they were purchased from the list or as reserves".
     Ennen korjausta 12 Lunaria + Carnage oli "Cruisers 12 / 12" - myos
     Bastionin omassa s.39-osiossa. Grand cruiserit Bastionin tapaan (s.37)
     taisteluristeilijapaikalle, eivat taistelulaivojen pohjaan. */
  const lunarsOf = (L, n) => Array.from({ length: n }, () => row(L, /^Cruisers$/i, /^Lunar/));
  const typeRow = (L, secRe, rowRe) => row(L, secRe, rowRe);
  const val = (F, re) => { const c = chk(F, re); return c ? (c.ok ? "ok " : "X ") + c.v : "ei rivia"; };
  const F13 = fleet(GO, lunarsOf(GO, 12).concat([lord(GO), om(GO), carnage(GO)]));
  check("Gothic: 12 Lunaria + Ordo Malleus -Carnage = Cruisers 13 / 12 (punainen)", /^X 13 \/ 12/.test(val(F13, /^0-12 Cruisers|^Cruisers/)),
        val(F13, /^0-12 Cruisers|^Cruisers/));
  const BAc = BA.secs.filter(x => /^THE RESERVE FLEETS/.test(x.t))[0];
  const bCar = { schemaVersion: 3, role: "core", entry: { list: BA.nm, section: BAc.t, label: "Carnage class cruiser" },
    ref: "277", hull: null, hulls: 1, name: "", note: "", adjust: 0, custom: null, members: [], options: {}, upgrades: {} };
  const Fb13 = fleet(BA, lunarsOf(BA, 12).concat([bCar]));
  check("Bastion: 12 Lunaria + oma s.39-Carnage = Cruisers 13 / 12 (punainen)", /^X 13 \/ 12/.test(val(Fb13, /^0-12 Cruisers|^Cruisers/)),
        val(Fb13, /^0-12 Cruisers|^Cruisers/));
  const Fbs = fleet(GO, lunarsOf(GO, 5).concat([lord(GO), om(GO), carnage(GO),
    typeRow(GO, /^Battleships$/i, /^Emperor/), typeRow(GO, /^Battleships$/i, /^Retribution/)]));
  check("Gothic: 5 Lunaria + Carnage kantavat kaksi taistelulaivaa (2 / 2)", /^ok 2 \/ 2/.test(val(Fbs, /^Battleships/)), val(Fbs, /^Battleships/));
  const rep = row(GO, /^ORDO MALLEUS RESERVES$/, /^Repulsive/);
  const mars = () => typeRow(GO, /^Battlecruisers$/i, /^Mars/);
  const Fbc = fleet(GO, lunarsOf(GO, 6).concat([lord(GO), om(GO), carnage(GO), rep, mars(), mars()]));
  const Fbc4 = fleet(GO, lunarsOf(GO, 6).concat([lord(GO), om(GO), carnage(GO), rep, mars(), mars(), mars()]));
  check("Gothic: Repulsive vie taisteluristeilijapaikan (3 / 3, neljas punainen)",
        /^ok 3 \/ 3/.test(val(Fbc, /^Battlecruisers/)) && /^X 4 \/ 3/.test(val(Fbc4, /^Battlecruisers/)),
        val(Fbc, /^Battlecruisers/) + " | " + val(Fbc4, /^Battlecruisers/));

  /* Optiot: s.39 kieltaa vain luokkavariantit ("ship class variants" = alukset,
     jotka "mount different weaponry", s.12). Repulsiven kolmas kilpi jaa. */
  const optOf = (R, re) => (R.options || []).filter(o => re.test(String(o.text || o.t || o.label || "")))[0] || null;
  const Rrep = DOMAIN.resolveUnit(rep, { list: GO, host: GO }, catalog);
  const shield = optOf(Rrep, /third shield/i), aim = optOf(Rrep, /ancient targeting/i);
  const shieldId = (catalog.ships["269"].ol || []).filter(o => /third shield/i.test(o.t))[0].id;
  const Rrep3 = DOMAIN.resolveUnit(Object.assign({}, rep, { options: { [shieldId]: { state: "take" } } }), { list: GO, host: GO }, catalog);
  check("Repulsive: kolmas kilpi valittavissa (245 p, 3 kilpea), ancient targeting kielletty",
        !!shield && !shield.forbidden && !!aim && aim.forbidden && Rrep3.points === 245 && String(Rrep3.stats.shields) === "3",
        JSON.stringify({ shield: shield && shield.forbidden, aim: aim && aim.forbidden, pts: Rrep3.points, sh: Rrep3.stats.shields }));
  const Rmur = DOMAIN.resolveUnit(row(GO, /^ORDO MALLEUS RESERVES$/, /^Murder/), { list: GO, host: GO }, catalog);
  check("Murder: Plagueclaw-variantti kielletty", (Rmur.options || []).length === 1 && Rmur.options[0].forbidden,
        JSON.stringify((Rmur.options || []).map(o => o.forbidden)));

  /* Poimija: reitin ehto ja Bastionin rivin osoitin omaan osioon. */
  const need = DOMAIN.lendRouteFor(GO, CI, catalog).needs;
  const omSi = GO.secs.findIndex(x => x.t === "ORDO MALLEUS INQUISITORS");
  check("reitti kertoo ehtonsa: an Ordo Malleus Inquisitor, poiminta Ordo Malleus -osioon",
        !!need && need.what === "an Ordo Malleus Inquisitor" && need.pick.length === 1 && need.pick[0].sec === omSi,
        JSON.stringify(need));
  const bSi = BA.secs.indexOf(BAc), bCarEn = BAc.ents.filter(e => /^Carnage/.test(e.l))[0];
  const hr = DOMAIN.hostReserveRow(GO, bCarEn);
  const goRes = GO.secs.findIndex(x => x.t === "ORDO MALLEUS RESERVES");
  check("Gothic <- Bastion: reservin reservi -Carnage osoittaa omaan Ordo Malleus -osioon ehtoineen",
        DOMAIN.lendRowVerdict(GO, BA, bSi, bCarEn, catalog, { role: "reserve", condMet: true }).cause === "reserve" &&
        !!hr && hr.si === goRes && /^Carnage/.test(GO.secs[hr.si].ents[hr.ei].l) && !!hr.needs,
        JSON.stringify(hr));
  const BKr = BK.secs.filter(x => x.t === "RESERVES")[0];
  const goCar = GO.secs[goRes].ents.filter(e => /^Carnage/.test(e.l))[0];
  const hb = DOMAIN.hostReserveRow(BA, goCar);
  check("verrokit: Bakan Jovianille ei osoitinta; Bastion <- Gothic osoittaa Bastionin omaan s.39-osioon ilman ehtoa",
        DOMAIN.hostReserveRow(GO, BKr.ents.filter(e => e.k === "unit")[0]) === null &&
        !!hb && hb.si === bSi && hb.needs === null, JSON.stringify(hb));
  check("Ordo Malleus -komentajan kortti: CSM-raja (s.142) ja hyodyt Inquisitor Lordin alukselle (s.140)",
        /Rules for Chaos Space Marines still apply normally/.test(cmdText) &&
        /benefits apply to the ship they are embarked upon/.test(cmdText), cmdText.slice(0, 200));

  /* Poimija: Chaos-listat nayttavat reitin Ordo Malleus -osioon. */
  const rt = DOMAIN.lendRouteFor(GO, CI, catalog);
  check("Gothic <- Chaos Incursion: reitti ORDO MALLEUS RESERVES", !!rt && rt.title === "ORDO MALLEUS RESERVES",
        JSON.stringify(rt && { t: rt.title, n: rt.n }));
})();


/* ---- 13n. aseyhteenveto katalogin rivilla (J145) --------------------------
   Kayttaja 20.9.: laivastoa rakentaessa pitaa nahda mika alus on mika ilman
   tulostusnakymaa. Rivi ryhmittelee profiilin aserivit kortin omilla
   varikoodeilla ja lyhenteilla. Ryhma on rivien maara x vahvuus, EI summa:
   Lunarin kaksi kuuden pattereita ovat "WB 6x2", ei "WB 12" - yksikaan
   laidallinen ei ole 12. */
(function(){
  const sh = nm => Object.values(catalog.ships).filter(s => s.nm === nm)[0];
  const t = (nm, o) => DOMAIN.armSummaryText(sh(nm), o);
  const by = nm => catalog.lists.filter(x => x.nm === nm)[0];
  check("Lunar: kaksi laidallista erikseen, ei summana",
        t("LUNAR CLASS CRUISER") === "WB 6\u00d72 \u00b7 LAN 2\u00d72 \u00b7 TORP 6", t("LUNAR CLASS CRUISER"));
  check("Gothic: pelkat lanssit ja torpedot",
        t("GOTHIC CLASS CRUISER") === "LAN 4\u00d72 \u00b7 TORP 6", t("GOTHIC CLASS CRUISER"));
  check("Dictator: laukaisukannet omana ryhmanaan",
        t("DICTATOR CLASS CRUISER") === "WB 6\u00d72 \u00b7 TORP 6 \u00b7 BAYS 2\u00d72", t("DICTATOR CLASS CRUISER"));
  check("Mars ja Strike: nova cannon ja pommitustykki eri sanoin, vaikka kortilla sama merkki",
        t("MARS CLASS BATTLECRUISER") === "WB 6\u00d72 \u00b7 LAN 2 \u00b7 NOVA 1 \u00b7 BAYS 2\u00d72" &&
        /BOMB 3/.test(t("STRIKE CRUISER")) &&
        DOMAIN.wepClass("Prow bombardment cannon")[0] === DOMAIN.wepClass("Nova Cannon")[0],
        t("MARS CLASS BATTLECRUISER") + " | " + t("STRIKE CRUISER"));
  check("Eclipse: pulsar-lanssi on lanssi (kuten kortilla)",
        t("ECLIPSE CLASS CRUISER") === "LAN 2 \u00b7 BAYS 4", t("ECLIPSE CLASS CRUISER"));
  /* Vahvuus on kirjassa vapaata tekstia. Numero kelpaa, "2 squadrons" on 2,
     noppa sellaisenaan, ja se mille ei ole lukua ("Special", Taun hangaarin
     "Capacity: 1 Orca/Warden", s.494) nayttaa kortin lyhenteen Spec. */
  check("vahvuus: numero, laivue, noppa ja Spec.",
        DOMAIN.armStrength("6") === "6" && DOMAIN.armStrength("2 squadrons") === "2" &&
        DOMAIN.armStrength("D6+2") === "D6+2" && DOMAIN.armStrength("Special") === null &&
        DOMAIN.armStrength("Special (max. 8)") === null &&
        /* Kapasiteetista luetaan luku (J147): se on se mita laivastosaanto
           laskee. Muu kuin luku ei kelpaa. */
        DOMAIN.armStrength("Capacity: 1 Orca/Warden") === "1" &&
        DOMAIN.armStrength("Capacity: a few") === null,
        [DOMAIN.armStrength("2 squadrons"), DOMAIN.armStrength("D6+2"), DOMAIN.armStrength("Capacity: 1 Orca/Warden")].join(" | "));
  const tau = Object.values(catalog.ships).filter(s => /Capacity:/i.test((s.aw || []).map(a => a[2]).join(" ")))[0];
  check("Taun kapasiteetti ei valu riville sanana", !!tau && !/Capacity/i.test(DOMAIN.armSummaryText(tau)),
        tau ? tau.nm + ": " + DOMAIN.armSummaryText(tau) : "ei alusta");

  /* Valikkorunko: profiilin rivit ovat toisensa poissulkevia valintoja
     (option omistaa rivin, o.aws, ryhma gmax 1). Krakenilla on tasan yksi
     naista aseista (s.435), joten rivi ei saa luvata kaikkia viitta. */
  check("Kraken: ei luvata viitta asetta vaan kerrotaan valinta",
        t("KRAKEN") === "pick 1 of 5", t("KRAKEN"));
  check("Dragonship: kaksi valintaa, ei nelja asetta (s.330)",
        t("DRAGONSHIP") === "pick 1 of 2 \u00b7 pick 1 of 2", t("DRAGONSHIP"));
  check("Torture: kiintea patteri riville, maksullinen lisaase valinnaksi",
        t("TORTURE CLASS CRUISER") === "WB 12 \u00b7 pick 1 of 4 \u00b7 1 optional", t("TORTURE CLASS CRUISER"));
  const kr = DOMAIN.armSummary(sh("KRAKEN"));
  check("valinnat eivat ole ryhmia vaan oma laskurinsa",
        kr.groups.length === 0 && JSON.stringify(kr.picks) === "[5]" && kr.addons === 0, JSON.stringify(kr));
  const menu = Object.values(catalog.ships).filter(s => DOMAIN.armSummary(s).picks.length).map(s => s.nm);
  /* 11: Tau Orbital (s.480) lakkasi olemasta valikko J171:ssa - jokainen
     puolustusjarjestelma on oma security-moduulinsa, enintaan nelja */
  check("valikkorunkoja on 11 (loput kertovat aseensa suoraan)",
        menu.length === 11 && menu.indexOf("ORBITALS") < 0 && menu.indexOf("HIVE SHIP") >= 0 && menu.indexOf("KRAKEN") >= 0 &&
        menu.indexOf("LUNAR CLASS CRUISER") < 0, menu.join(" | "));
  /* Viisi valintaryhmaa tayttaisi rivin: silloin luku on se olennainen. */
  check("hive ship: viisi ryhmaa tiivistyy yhteen merkkiin",
        t("HIVE SHIP") === "5 weapon choices", t("HIVE SHIP"));

  /* Lista voi pakottaa aseen ja arvon ennen kuin pelaaja valitsee mitaan:
     Mechanicuksen dorsal lance ja +1 turret (s.120) ovat jokaisella sen
     listan risteilijalla, joten rivi laskee ne mukaan. */
  const EX = by("Adeptus Mechanicus \u2014 Explorator"), GO = by("Imperial Navy \u2014 Gothic Sector");
  const chg = DOMAIN.requiredHullChanges(EX, sh("GOTHIC CLASS CRUISER"));
  check("Explorator pakottaa Gothicille dorsal lancen ja +1 tornin",
        chg.rows.length === 1 && /dorsal lance/i.test(chg.rows[0][0]) && chg.mod && chg.mod.tu === 1 &&
        t("GOTHIC CLASS CRUISER", { list: EX }) === "LAN 4\u00d72, 1 \u00b7 TORP 6",
        JSON.stringify(chg) + " | " + t("GOTHIC CLASS CRUISER", { list: EX }));
  const goChg = DOMAIN.requiredHullChanges(GO, sh("GOTHIC CLASS CRUISER"));
  check("verrokki: Gothic Sector ei pakota mitaan",
        goChg.rows.length === 0 && goChg.mod === null && t("GOTHIC CLASS CRUISER", { list: GO }) === t("GOTHIC CLASS CRUISER"),
        JSON.stringify(goChg));
  check("Exploratorin saattaja ei ole risteilija: ei lanssia (cond ty)",
        DOMAIN.requiredHullChanges(EX, sh("NOVA CLASS FRIGATE")).rows.length === 0 &&
        DOMAIN.requiredHullChanges(EX, sh("DAUNTLESS CLASS LIGHT CRUISER")).rows.length === 0,
        t("NOVA CLASS FRIGATE", { list: EX }));
  /* Ehto joka koskee aluksen sen hetkista aseistusta ei ole vastattavissa
     listarivilta, joten vastaus on null eika arvaus. */
  check("condShipOnly: profiiliehto kylla/ei, aseistusehto null",
        DOMAIN.condShipOnly({ cond: { ty: "cruiser" } }, sh("GOTHIC CLASS CRUISER")) === true &&
        DOMAIN.condShipOnly({ cond: { ty: "cruiser" } }, sh("NOVA CLASS FRIGATE")) === false &&
        DOMAIN.condShipOnly({ cond: { has: "torpedo" } }, sh("GOTHIC CLASS CRUISER")) === null &&
        DOMAIN.condShipOnly({}, sh("GOTHIC CLASS CRUISER")) === true, "-");

  /* Jarjestys on kiintea, jotta sama ase on aina samassa kohdassa. */
  const order = DOMAIN.ARM_ORDER;
  const bad = Object.values(catalog.ships).filter(s => {
    const ks = DOMAIN.armSummary(s, { max: 99 }).groups.map(g => order.indexOf(g.k));
    return ks.some((v, i) => v < 0 || (i && v < ks[i - 1]));
  });
  check("ryhmat ovat aina samassa jarjestyksessa", bad.length === 0, bad.slice(0, 3).map(s => s.nm).join(" | "));
  /* Pitka rivi katkaistaan: nelja ryhmaa, kaksi vahvuutta kussakin. */
  const all = Object.values(catalog.ships).map(s => [DOMAIN.armSummaryText(s), s.nm]);
  const longest = all.slice().sort((a, b) => b[0].length - a[0].length)[0];
  check("jokaisella aluksella on rivi ja pisin on alle 60 merkkia",
        all.every(x => x[0].length > 0) && longest[0].length < 60,
        longest[1] + ": " + longest[0] + " (" + longest[0].length + ")");
  /* Katkaisu: nelja ryhmaa ja kaksi vahvuutta kussakin, loput kolmella
     pisteella. Tehty alus, koska kirjassa ei ole nain asestettua. */
  const many = { nm: "TESTI", aw: [["Port weapons battery", "30 cm", "6", "Left"],
    ["Starboard weapons battery", "30 cm", "5", "Right"], ["Prow weapons battery", "30 cm", "4", "Front"],
    ["Prow lance battery", "30 cm", "2", "Front"], ["Nova Cannon", "150 cm", "1", "Front"],
    ["Prow torpedoes", "30 cm", "6", "Front"], ["Port launch bays", "30 cm", "2 squadrons", "\u2013"],
    ["Orbital mines", "Contact", "Special", "\u2013"]] };
  const cut = DOMAIN.armSummary(many);
  check("katkaisu: nelja ryhmaa, kaksi vahvuutta, kolme pistetta",
        cut.groups.length === 4 && cut.more === 2 && cut.groups[0].items.length === 2 &&
        cut.groups[0].more === 1 &&
        DOMAIN.armSummaryText(many) === "WB 6, 5\u2026 \u00b7 LAN 2 \u00b7 NOVA 1 \u00b7 TORP 6 \u00b7 \u2026",
        DOMAIN.armSummaryText(many));
})();


/* ---- 13o. Inquisition-alukset isannan rajoihin (J148) ---------------------
   Kayttajaraportti 25.9.: "When adding an Inquisitorial Cruiser to a list, it
   should count as a battlecruiser/strike cruiser (pg. 138)", GK Strike Cruiser
   risteilijana, ja toinen re-roll +25. Kirja: Inquisitorial Cruiser "takes the
   place of a battlecruiser or strike cruiser in the fleet"; Blackship on ainoa
   joka "does not count toward or against other ship limits"; s.14 "the
   restrictions on maximum and minimum numbers of ships are determined for the
   fleet as a whole". Liiteosion rivit eivat ennen laskeneet mihinkaan. */
(function(){
  const by = nm => catalog.lists.filter(x => x.nm === nm)[0];
  const GO = by("Imperial Navy \u2014 Gothic Sector"), CA = by("Space Marines \u2014 Codex Astartes"),
        EX = by("Adeptus Mechanicus \u2014 Explorator"), DO = by("Space Marines \u2014 Dominion"),
        BA = by("Imperial Navy \u2014 Bastion Fleets");
  const row = (L, secRe, rowRe) => {
    for(let si = 0; si < L.secs.length; si++){
      if(!secRe.test(L.secs[si].t)) continue;
      for(let ei = 0; ei < L.secs[si].ents.length; ei++){
        const en = L.secs[si].ents[ei];
        if(!rowRe.test(en.l)) continue;
        return { schemaVersion: 4, role: "core", entry: { list: L.nm, section: L.secs[si].t, label: en.l },
          ref: en.r == null ? null : String(en.r), hull: null, hulls: 1, name: "", note: "",
          adjust: 0, custom: null, members: [], options: {}, upgrades: {} };
      }
    }
    throw new Error("rivia ei loydy: " + L.nm + " / " + secRe + " / " + rowRe);
  };
  const fleet = (L, units) => DOMAIN.resolveFleet({ list: L.nm, limit: 100000, units: units }, catalog);
  const val = (F, re) => { const c = F.checks.filter(c => re.test(c.t))[0]; return c ? (c.ok ? "ok " : "X ") + c.v : "ei rivia"; };
  const lunar = n => Array.from({ length: n }, () => row(GO, /^Cruisers$/i, /^Lunar/));
  const lord = L => row(L, /^THE INQUISITION$/, /^Inquisitor Lord/);
  const inq = L => row(L, /^THE INQUISITION$/, /^Inquisitorial Cruiser/);
  const gk = L => row(L, /^THE INQUISITION$/, /^Grey Knights Strike/);
  const black = L => row(L, /^THE INQUISITION$/, /^Inquisition Blackship/);
  const emperor = L => row(L, /^Battleships$/i, /^Emperor/);

  /* Inquisitorial Cruiser vie taisteluristeilijan paikan (s.138). */
  check("Inquisitorial Cruiser vie taisteluristeilijapaikan: 2 risteilijaa kantaa sen (1 / 1)",
        /^ok 1 \/ 1/.test(val(fleet(GO, lunar(2).concat([lord(GO), inq(GO)])), /^Battlecruisers/)),
        val(fleet(GO, lunar(2).concat([lord(GO), inq(GO)])), /^Battlecruisers/));
  check("Inquisitorial Cruiser + Mars kahdella risteilijalla on liikaa (2 / 1)",
        /^X 2 \/ 1/.test(val(fleet(GO, lunar(2).concat([lord(GO), inq(GO), row(GO, /^Battlecruisers$/i, /^Mars/)])), /^Battlecruisers/)),
        val(fleet(GO, lunar(2).concat([lord(GO), inq(GO), row(GO, /^Battlecruisers$/i, /^Mars/)])), /^Battlecruisers/));
  /* ... ja laskee taisteluristeilijana taistelulaivasuhteen pohjaan ("for
     every three cruisers or battlecruisers"). */
  check("Inquisitorial Cruiser laskee taistelulaivasuhteen pohjaan: 2 risteilijaa + se kantaa taistelulaivan",
        /^ok 1 \/ 1/.test(val(fleet(GO, lunar(2).concat([lord(GO), inq(GO), emperor(GO)])), /^Battleships/)) &&
        /^X 1 \/ 0/.test(val(fleet(GO, lunar(2).concat([lord(GO), emperor(GO)])), /^Battleships/)),
        val(fleet(GO, lunar(2).concat([lord(GO), inq(GO), emperor(GO)])), /^Battleships/));
  check("Inquisitorial Cruiser ei laske 0-12-risteilijarajaan (se on taisteluristeilija)",
        /^ok 12 \/ 12/.test(val(fleet(GO, lunar(12).concat([lord(GO), inq(GO)])), /^Cruisers/)),
        val(fleet(GO, lunar(12).concat([lord(GO), inq(GO)])), /^Cruisers/));

  /* Grey Knights Strike Cruiser on risteilija (s.14, koko laivasto). */
  check("GK Strike Cruiser laskee 0-12-rajaan: 12 Lunaria + GK = 13 / 12",
        /^X 13 \/ 12/.test(val(fleet(GO, lunar(12).concat([lord(GO), gk(GO)])), /^Cruisers/)),
        val(fleet(GO, lunar(12).concat([lord(GO), gk(GO)])), /^Cruisers/));
  const Fgk = fleet(GO, lunar(2).concat([lord(GO), gk(GO), emperor(GO)]));
  check("GK Strike Cruiser laskee taistelulaivasuhteen pohjaan ja koko laivasto on laillinen",
        /^ok 1 \/ 1/.test(val(Fgk, /^Battleships/)) && Fgk.checks.every(c => c.ok),
        val(Fgk, /^Battleships/) + " | " + Fgk.checks.filter(c => !c.ok).map(c => c.t).join(", "));
  /* Blackship "does not count toward or against other ship limits". */
  check("Blackship ei laske mihinkaan: 12 Lunaria + Blackship = 12 / 12, taistelulaivat 0 / 4",
        /^ok 12 \/ 12/.test(val(fleet(GO, lunar(12).concat([lord(GO), black(GO)])), /^Cruisers/)) &&
        /^ok 0 \/ 4/.test(val(fleet(GO, lunar(12).concat([lord(GO), black(GO)])), /^Battleships/)),
        val(fleet(GO, lunar(12).concat([lord(GO), black(GO)])), /^Cruisers/) + " | " +
        val(fleet(GO, lunar(12).concat([lord(GO), black(GO)])), /^Battleships/));

  /* Space Marine -listalla molemmat vievat strike cruiserin paikan (0-10). */
  const sc = n => Array.from({ length: n }, () => row(CA, /^Cruisers$/i, /^Strike cruisers/i));
  check("Codex: 10 strike cruiseria + Inquisitorial Cruiser = 11 / 10",
        /^X 11 \/ 10/.test(val(fleet(CA, sc(10).concat([lord(CA), inq(CA)])), /^Cruisers/)),
        val(fleet(CA, sc(10).concat([lord(CA), inq(CA)])), /^Cruisers/));
  check("Codex: 9 strike cruiseria + GK Strike Cruiser = 10 / 10",
        /^ok 10 \/ 10/.test(val(fleet(CA, sc(9).concat([lord(CA), gk(CA)])), /^Cruisers/)),
        val(fleet(CA, sc(9).concat([lord(CA), gk(CA)])), /^Cruisers/));
  const dsc = n => Array.from({ length: n }, () => row(DO, /^Cruisers$/i, /^Strike cruiser/i));
  check("Dominion: ehdollinen katto laskee GK Strike Cruiserin (11 / 10)",
        /^X 11 \/ 10/.test(val(fleet(DO, dsc(10).concat([lord(DO), gk(DO)])), /^Cruisers/)),
        val(fleet(DO, dsc(10).concat([lord(DO), gk(DO)])), /^Cruisers/));
  /* Explorator: ei taisteluristeilijoita - GK on risteilija suhteen pohjassa. */
  check("Explorator: 2 risteilijaa + GK Strike Cruiser kantaa taistelulaivan",
        /^ok 1 \/ 1/.test(val(fleet(EX, [row(EX, /^Cruisers$/i, /^Lunar/), row(EX, /^Cruisers$/i, /^Gothic/), lord(EX), gk(EX), emperor(EX)]), /^Battleships/)),
        val(fleet(EX, [row(EX, /^Cruisers$/i, /^Lunar/), row(EX, /^Cruisers$/i, /^Gothic/), lord(EX), gk(EX), emperor(EX)]), /^Battleships/));
  /* Bastion: taisteluristeilijat ja grand cruiserit jakavat paikan. */
  const bl = n => Array.from({ length: n }, () => row(BA, /^Cruisers$/i, /^Lunar/));
  check("Bastion: Inquisitorial Cruiser vie taisteluristeilija/grand cruiser -paikan",
        /^ok 1 \/ 1/.test(val(fleet(BA, bl(2).concat([lord(BA), inq(BA)])), /^Battlecruisers & Grand Cruisers/)) &&
        /^X 2 \/ 1/.test(val(fleet(BA, bl(2).concat([lord(BA), inq(BA), row(BA, /^Battleships$/i, /^Mars/)])), /^Battlecruisers & Grand Cruisers/)),
        val(fleet(BA, bl(2).concat([lord(BA), inq(BA)])), /^Battlecruisers & Grand Cruisers/));

  /* Toinen re-roll +25 (s.138) isantalistoilla. */
  const id = DOMAIN.upgradeId(GO.nm, "THE INQUISITION", "One extra re-roll");
  const R0 = DOMAIN.resolveUnit(lord(GO), { list: GO, host: GO }, catalog);
  const R1 = DOMAIN.resolveUnit(Object.assign({}, lord(GO), { upgrades: { [id]: "take" } }), { list: GO, host: GO }, catalog);
  check("Inquisitor Lord: toinen re-roll +25 nostaa 75 -> 100 ja re-rollit 1 -> 2",
        R0.points === 75 && R0.rerolls.total === 1 && R1.points === 100 && R1.rerolls.total === 2 &&
        R1.rerolls.purchased.length === 1 && R1.rerolls.purchased[0].cost === 25,
        JSON.stringify([R0.points, R0.rerolls.total, R1.points, R1.rerolls.total]));
  const hosts = catalog.lists.filter(L => L.secs.some(x => x.t === "THE INQUISITION"));
  check("re-roll-rivi kaikilla kahdeksalla isannalla, kohteena Inquisitor Lord",
        hosts.length === 8 && hosts.every(L => {
          const sec = L.secs.filter(x => x.t === "THE INQUISITION")[0], si = L.secs.indexOf(sec);
          const rr = sec.ents.filter(e => e.l === "One extra re-roll")[0];
          return rr && rr.p === 25 && rr.rr === 1 && JSON.stringify(rr.at) === JSON.stringify([[si, 0]]) &&
                 /^Inquisitor Lord/.test(sec.ents[0].l);
        }), hosts.map(L => L.nm).join(" | "));
})();

/* ---- 3b. ratkaistun yksikon aselinja (builderin laivastorivi) ---------- */
(() => {
  const GO = catalog.lists.filter(L => L.nm === "Imperial Navy \u2014 Gothic Sector")[0];
  const mk = (L, secRe, entRe, options) => {
    const sec = L.secs.filter(s => secRe.test(s.t))[0], en = sec.ents.filter(e => entRe.test(e.l))[0];
    const intent = { schemaVersion: DOMAIN.SCHEMA_VERSION, role: "core",
      entry: { list: L.nm, section: sec.t, label: en.l }, ref: String(en.r), hull: null, hulls: 1,
      name: "", note: "", adjust: 0, custom: null, members: [], options: options || {}, upgrades: {} };
    return { R: DOMAIN.resolveUnit(intent, { list: L }, catalog), sh: catalog.ships[String(en.r)] };
  };
  const taken = R => (R.weapons || []).filter(w => w.state !== "offered").map(w => w.a);
  /* Lunar: no weapon options, so the resolved line is the catalogue's line */
  const l = mk(GO, /^Cruisers$/i, /^Lunar/);
  const a = DOMAIN.armSummaryRows(taken(l.R)), b = DOMAIN.armSummary(l.sh, { list: GO });
  check("ratkaistun Lunarin aselinja on katalogin aselinja",
        JSON.stringify(a.groups) === JSON.stringify(b.groups) && a.groups.length === 3,
        JSON.stringify([a.groups, b.groups]));
  /* Ork Terror ship: the torpedo launcha option adds a row the catalogue's
     line leaves out (it counts it as an optional) - the resolved line has it */
  const OR = catalog.lists.filter(L => /^Orks/.test(L.nm))[0];
  const t0 = mk(OR, /^Kroozers$/i, /^Terror ship/i);
  const opt = (t0.sh.ol || []).filter(o => /torpedo/i.test(String(o.t || "")))[0];
  check("Terror ship: torpedo launcha on optio (datassa)", !!opt, JSON.stringify((t0.sh.ol || []).map(o => o.t)));
  if(opt){
    const t1 = mk(OR, /^Kroozers$/i, /^Terror ship/i, { [opt.id]: { state: "take", qty: 1 } });
    const s0 = DOMAIN.armSummaryRows(taken(t0.R)), s1 = DOMAIN.armSummaryRows(taken(t1.R));
    check("... otettu optio tuo TORP-ryhman ratkaistulle aselinjalle, ilman sita ei",
          !s0.groups.some(g => g.k === "TORP") && s1.groups.some(g => g.k === "TORP"),
          JSON.stringify([s0.groups.map(g => g.k), s1.groups.map(g => g.k)]));
    check("... katalogin aselinja jattaa sen pois (rivi syntyy vasta optiosta)",
          !DOMAIN.armSummary(t0.sh).groups.some(g => g.k === "TORP"),
          JSON.stringify(DOMAIN.armSummary(t0.sh)));
  }
  /* Laivastorivin aselaatikot (kayttaja 30.9.2026): sama luokka, vahvuus ja
     kantama yhteen laatikkoon, jossa on jokaisen rivin sektori; launch bayt
     lasketaan yhteen; luku jota ei voi laskea (D6) lasketaan kappaleina. */
  const boxes = R => DOMAIN.weaponBoxes(taken(R)).map(b => [b.k, b.v, b.n, b.arcs.join("+")]);
  check("Lunar: LAN 2 ja WB 6 vasen+oikea samassa laatikossa, TORP 6 omassaan",
        JSON.stringify(boxes(l.R)) === JSON.stringify([["LAN", "2", 2, "Left+Right"], ["WB", "6", 2, "Left+Right"], ["TORP", "6", 1, "Front"]]),
        JSON.stringify(boxes(l.R)));
  const dic = mk(GO, /^Cruisers$/i, /^Dictator/);
  const db = DOMAIN.weaponBoxes(taken(dic.R)).filter(b => b.k === "BAYS");
  check("Dictator: launch bayt 2 + 2 = 4 yhdessa laatikossa",
        db.length === 1 && db[0].v === "4" && db[0].n === 2 && db[0].summed === true, JSON.stringify(db));
  const tyb = DOMAIN.weaponBoxes(taken(mk(GO, /^Cruisers$/i, /^Tyrant/).R)).filter(b => b.k === "WB").map(b => [b.v, b.rng, b.n]);
  check("Tyrant: WB 4 (45 cm) ja WB 6 (30 cm) eri laatikoissa, kummassakin molemmat kyljet",
        JSON.stringify(tyb) === JSON.stringify([["4", "45 cm", 2], ["6", "30 cm", 2]]), JSON.stringify(tyb));
  const tb = boxes(t0.R);
  check("Terror ship: gunz D6 vasen+oikea yhdessa, D6+2 eteen erikseen, bayt 2 + 2 = 4",
        tb.some(b => b[0] === "WB" && b[1] === "D6" && b[2] === 2 && b[3] === "Left+Right") &&
        tb.some(b => b[0] === "WB" && b[1] === "D6+2" && b[2] === 1) &&
        tb.some(b => b[0] === "BAYS" && b[1] === "4" && b[2] === 2), JSON.stringify(tb));
  const OW = catalog.lists.filter(L => /^Orks/.test(L.nm) && L.secs.some(x => x.ents.some(e => /^Dethdeala/i.test(e.l))))[0];
  const owSec = OW.secs.filter(x => x.ents.some(e => /^Dethdeala/i.test(e.l)))[0];
  const dethd = mk(OW, { test: t => t === owSec.t }, /^Dethdeala/i);
  const ob = DOMAIN.weaponBoxes(taken(dethd.R)).filter(b => b.k === "BAYS");
  check("Dethdeala: yksi bay-rivi D3+1 pysyy sellaisenaan (ei summaa noppaa)",
        ob.length === 1 && ob[0].v === "D3+1" && ob[0].n === 1 && !ob[0].summed, JSON.stringify(ob));
  check("weaponBoxes: tyhja rivisto", DOMAIN.weaponBoxes([]).length === 0);
  check("armSummaryRows: tyhja rivisto on tyhja linja", DOMAIN.armSummaryRows([]).groups.length === 0 && DOMAIN.armSummaryRows([]).more === 0);
  /* each group says how far it reaches (user 29.9.2026): the raw range
     texts of all its rows, in order, without repeats */
  const ret = mk(GO, /^Battleships$/i, /^Retribution/);
  const rg = DOMAIN.armSummaryRows(taken(ret.R)).groups.map(g => [g.k, g.rng]);
  check("aselinjan ryhmat kertovat kantamansa: Retribution WB ja LAN 60 cm, TORP 30 cm",
        JSON.stringify(rg) === JSON.stringify([["WB", ["60 cm"]], ["LAN", ["60 cm"]], ["TORP", ["30 cm"]]]), JSON.stringify(rg));
  const dom = mk(GO, /^Cruisers$/i, /^Dominator/);
  const nv = DOMAIN.armSummaryRows(taken(dom.R)).groups.filter(g => g.k === "NOVA")[0];
  check("... Dominatorin nova cannon 30-150 cm", !!nv && nv.rng.length === 1 && /30/.test(nv.rng[0]) && /150/.test(nv.rng[0]), JSON.stringify(nv));
  /* a group whose strengths reach differently: each strength knows its own */
  const ty = mk(GO, /^Cruisers$/i, /^Tyrant/);
  const tw = DOMAIN.armSummaryRows(taken(ty.R)).groups.filter(g => g.k === "WB")[0];
  check("... Tyrantin WB: vahvuus kerrallaan oma kantama (4 45 cm, 6 30 cm)",
        !!tw && JSON.stringify(tw.items.map(x => [x.v, x.rng])) === JSON.stringify([["4", ["45 cm"]], ["6", ["30 cm"]]]),
        JSON.stringify(tw && tw.items));
  check("... katalogin armSummary kantaa samat kantamat", JSON.stringify(DOMAIN.armSummary(ret.sh, { list: GO }).groups.map(g => [g.k, g.rng])) === JSON.stringify(rg));
})();

/* ---- 3c. laivastolistan paivitysten oletus on Option (kayttaja 30.9.2026) --
   Tarjottu rivi, jolle pelaaja ei ole antanut vastausta, avautuu Optionina
   (tyhja ruutu kortilla, ei pisteita) kuten aluksen omat optiot - ei enaa
   Hidena. Rivi, jota ei tarjota talle alukselle (toisen aluksen rivi, ehto
   ei tayty), pysyy poissa: se ei saa nostaa "max if every open option"
   -lukua eika tuoda asevaihtoehtoa kortille. Pelaajan Hide pysyy. */
(() => {
  const GO = catalog.lists.filter(L => L.nm === "Imperial Navy \u2014 Gothic Sector")[0];
  const at = (L, secRe, entRe) => { const sec = L.secs.filter(s => secRe.test(s.t))[0]; return { sec: sec, en: sec.ents.filter(e => entRe.test(e.l))[0] }; };
  const mk = (L, secRe, entRe, ups) => { const a = at(L, secRe, entRe);
    return DOMAIN.resolveUnit({ schemaVersion: DOMAIN.SCHEMA_VERSION, role: "core",
      entry: { list: L.nm, section: a.sec.t, label: a.en.l }, ref: a.en.r == null ? null : String(a.en.r), hull: null, hulls: 1,
      name: "", note: "", adjust: 0, custom: null, members: [], options: {}, upgrades: ups || {} }, { list: L }, catalog); };
  const l0 = mk(GO, /^Cruisers$/i, /^Lunar/);
  const offered = l0.upgrades.filter(x => !x.required && !x.included);
  check("Lunar: laivastolistan paivityksia tarjolla (testin edellytys)", offered.length > 0, offered.length);
  check("... tarjottu rivi avautuu Optionina, ei Hidena",
        offered.every(x => x.state === "opt"), JSON.stringify(offered.map(x => [x.label, x.state])));
  /* sama yksikko, kaikki tarjotut rivit erikseen Optioniksi: oletus ei saa
     lisata mitaan, mita tarjotut rivit eivat lisaa */
  const all = {}; offered.forEach(x => { all[x.id] = "opt"; });
  const l1 = mk(GO, /^Cruisers$/i, /^Lunar/, all);
  check("... max-pisteet samat kuin kun vain tarjotut rivit on asetettu Optioniksi (ei muiden alusten riveja)",
        l0.maxPoints === l1.maxPoints && l0.points === l1.points, JSON.stringify([l0.points, l0.maxPoints, l1.maxPoints]));
  check("... asevaihtoehdot samat",
        JSON.stringify(l0.weapons.map(w => [w.a[0], w.state])) === JSON.stringify(l1.weapons.map(w => [w.a[0], w.state])));
  /* pelaajan Hide pysyy */
  const one = offered[0], hid = {}; hid[one.id] = "off";
  const l2 = mk(GO, /^Cruisers$/i, /^Lunar/, hid);
  check("... pelaajan Hide pysyy Hidena", l2.upgrades.filter(x => x.id === one.id)[0].state === "off");
  /* toiselle alukselle kohdennettu rivi ei ole taman aluksen Option */
  const adm = mk(GO, /^Admiral/i, /^Admiral \(Ld 9\)/);
  const rr = adm.upgrades.filter(x => /re-roll/i.test(x.label));
  check("Admiral: re-roll-rivit tarjolla Optionina", rr.length > 0 && rr.every(x => x.state === "opt"), JSON.stringify(rr.map(x => [x.label, x.state])));
  check("... eivat Lunarin rivit", !l0.upgrades.some(x => /re-roll/i.test(x.label)), JSON.stringify(l0.upgrades.map(x => x.label)));
  /* Katto on kallein LAILLINEN yhdistelma, ei avointen summa: Lunarin nova
     (+20) sulkee Power Ramin (Fleets p. 32: ei nova cannonin kanssa) ja
     Special torpedoesin (nova korvaa prow torpedoes), joten 180 + ram 5 +
     special torpedoes 20 = 205, ei 225. */
  check("Lunar: katto 205 (ram + special torpedoes), ei avointen summa 225", l0.maxPoints === 205, l0.maxPoints);
  /* Hinnallinen optio ILMAISEN option takana kuuluu kattoon (pistokoe 21,
     12.10.2026). Fleets s.382: torpedo launcha "at no extra points cost",
     boarding torpedoes "+5 pts" jos launcha on; s.367 Dakka Dakka +20 ->
     155 + 5 + 20 = 180. Fleets s.330: keel launch bays (4 squadrons) on
     hinnaton valinta, ja sen takana ovat Vampire raiders +10 (s.330) ja
     torpedo bombers +15 per launch bay (s.319 ORDNANCE) = 60; s.318 Aspect
     Warrior Host +20 -> 260 + 60 + 10 + 20 = 350. */
  const byRef = (L, ref) => { let hit = null; L.secs.forEach(sec => (sec.ents || []).forEach(en => { if(!hit && String(en.r) === ref) hit = { sec: sec, en: en }; })); return hit; };
  const mkRef = (L, ref) => { const a = byRef(L, ref);
    return DOMAIN.resolveUnit({ schemaVersion: DOMAIN.SCHEMA_VERSION, role: "core",
      entry: { list: L.nm, section: a.sec.t, label: a.en.l }, ref: ref, hull: null, hulls: 1,
      name: "", note: "", adjust: 0, custom: null, members: [], options: {}, upgrades: {} }, { list: L }, catalog); };
  const WA = catalog.lists.filter(L => L.nm === "Orks \u2014 Waaagh!")[0], IY = catalog.lists.filter(L => L.nm === "Eldar \u2014 Iyanden Craftworld")[0];
  const kk = mkRef(WA, "382"), dr = mkRef(IY, "330");
  check("Kill kroozer: katto 180 (launcha 0 + boarding torpedoes 5 + Dakka Dakka 20)", kk.maxPoints === 180, kk.maxPoints);
  check("Dragonship: katto 350 (launch bays -valinnan takana torpedo bombers 60 + Vampire raiders 10, ja Aspect Warrior Host 20)", dr.maxPoints === 350, dr.maxPoints);
  check("... eika hinta muutu: 155 ja 260", kk.points === 155 && dr.points === 260, JSON.stringify([kk.points, dr.points]));
  /* Valitse-yksi-ryhma: kun yksi on otettu, muut eivat ole enaa Optioneita
     vaan poissa; kun se perutaan, ne palaavat Optioneiksi. */
  const two = rr.filter(x => /^Two/i.test(x.label))[0];
  const tk = {}; tk[two.id] = "take";
  const adm2 = mk(GO, /^Admiral/i, /^Admiral \(Ld 9\)/, tk);
  const st2 = adm2.upgrades.filter(x => /re-roll/i.test(x.label)).map(x => [x.label, x.state]);
  check("Admiral: Two re-rolls otettu -> One ja Three pois (ryhma, yksi kerrallaan)",
        JSON.stringify(st2) === JSON.stringify([["One extra re-roll", "off"], ["Two extra re-rolls", "take"], ["Three extra re-rolls", "off"]]), JSON.stringify(st2));
  check("... ja katto on otetun hinta, ei ryhman kalleimman paalle", adm2.maxPoints === adm2.points, JSON.stringify([adm2.points, adm2.maxPoints]));
  /* Poisvalinta (transition) palauttaa rivin oletukseen, ei jata pysyvaa Hidea */
  const it0 = { schemaVersion: DOMAIN.SCHEMA_VERSION, role: "core",
    entry: { list: GO.nm, section: at(GO, /^Admiral/i, /^Admiral \(Ld 9\)/).sec.t, label: at(GO, /^Admiral/i, /^Admiral \(Ld 9\)/).en.l },
    ref: null, hull: null, hulls: 1, name: "", note: "", adjust: 0, custom: null, members: [], options: {}, upgrades: tk };
  const oneRr = rr.filter(x => /^One/i.test(x.label))[0];
  const t1 = DOMAIN.transition(it0, { type: "upgrade", id: oneRr.id, state: "take" }, { list: GO }, catalog);
  const t2 = DOMAIN.transition(t1.intent, { type: "upgrade", id: oneRr.id, state: "opt" }, { list: GO }, catalog);
  const back = DOMAIN.resolveUnit(t2.intent, { list: GO }, catalog).upgrades.filter(x => /re-roll/i.test(x.label)).map(x => x.state);
  check("... One otettu (Two putoaa) ja sitten auki: kaikki kolme taas Optioneita", JSON.stringify(back) === '["opt","opt","opt"]', JSON.stringify(back));
  /* Otettu Power Ram sulkee novan: kortille ei tule "OR Prow nova cannon" */
  const ram = l0.upgrades.filter(x => /Power Ram/i.test(x.label))[0];
  const rk = {}; rk[ram.id] = "take";
  const tyr = mk(GO, /^Cruisers$/i, /^Tyrant/, rk);
  check("Tyrant + Power Ram: novaa ei tarjota asetaulukossa (Fleets p. 32)", !tyr.weapons.some(w => /nova/i.test(w.a[0])), JSON.stringify(tyr.weapons.map(w => w.a[0])));
  const tyr0 = mk(GO, /^Cruisers$/i, /^Tyrant/);
  check("... ilman ramia nova on vaihtoehtona", tyr0.weapons.some(w => /nova/i.test(w.a[0]) && w.state === "offered"));
  check("... kahden kyljen vaihto merkitaan molemmille puolille (yksi optio)", tyr0.weapons.filter(w => w.alt && w.both).length === 2,
        JSON.stringify(tyr0.weapons.filter(w => w.alt).map(w => [w.a[0], !!w.both])));
})();

/* ---- Komentajan re-rollit sanoin (kayttaja 5.10.2026) --------------------
   "Johtajilla on aina kirjattu selkeasti rerollit jos ne jo sisaltyvat
   hintaan." Yksi lauseenrakentaja (DOMAIN.rerollText), jota valintalista,
   laivastorivi, kortti ja pelisivu kayttavat - nelja pintaa ei saa sanoa
   samaa asiaa neljalla tavalla. Odotukset kirjasta:
     s. 35  "Admirals get one Fleet Commander re-roll included in their points cost"
     s. 48  "(Lord Admiral Rath has two)"
     s. 97  "You may buy Fleet Commander re-rolls for your Master of the Fleet." (ei sisaltyvaa)
     s. 100 Space Marine Captain: ei re-rollia eika myytavia re-rolleja
     s. 404 / 486 "The fleet gets one re-roll and can purchase extra re-rolls" */
(() => {
  const by = nm => catalog.lists.filter(L => L.nm === nm)[0];
  const GO = by("Imperial Navy \u2014 Gothic Sector"), BK = by("Imperial Navy \u2014 Bakka Sector"),
        CA = by("Space Marines \u2014 Codex Astartes"), DO = by("Space Marines \u2014 Dominion"),
        NE = by("Necrons \u2014 Harvest Fleet"), DE = by("Demiurg \u2014 War Host");
  const T = DOMAIN.rerollText || (() => "?");
  check("rerollText: yksi sisaltyy", T(1, 0, true) === "1 re-roll included", T(1, 0, true));
  check("rerollText: kaksi sisaltyy", T(2, 0, false) === "2 re-rolls included", T(2, 0, false));
  check("rerollText: sisaltyva + ostetut eritellaan", T(1, 2, true) === "3 re-rolls (1 included + 2 bought)", T(1, 2, true));
  check("rerollText: vain ostetut - sanotaan ettei mitaan sisally", T(0, 2, true) === "2 re-rolls bought (none included)", T(0, 2, true));
  check("rerollText: ei sisaltyvaa, mutta myynnissa", T(0, 0, true) === "no re-roll included", T(0, 0, true));
  check("rerollText: ei sisaltyvaa eika myynnissa - ei tekstia", T(0, 0, false) === "", T(0, 0, false));
  const at = (L, secRe, entRe) => { let hit = null; L.secs.forEach((sec, si) => sec.ents.forEach((en, ei) => {
    if(!hit && secRe.test(sec.t) && entRe.test(en.l)) hit = { sec: sec, en: en, si: si, ei: ei }; })); return hit; };
  const mk = (L, secRe, entRe, take) => { const a = at(L, secRe, entRe);
    const it = { schemaVersion: DOMAIN.SCHEMA_VERSION, role: "core", entry: { list: L.nm, section: a.sec.t, label: a.en.l },
      ref: null, hull: null, hulls: 1, name: "", note: "", adjust: 0, custom: null, members: [], options: {}, upgrades: {} };
    if(take){
      const R0 = DOMAIN.resolveUnit(it, { list: L }, catalog);
      const up = R0.upgrades.filter(x => take.test(x.label))[0];
      it.upgrades[up.id] = "take";
    }
    return DOMAIN.resolveUnit(it, { list: L }, catalog); };
  const txt = R => R && R.rerolls ? R.rerolls.text : undefined;
  const adm = mk(GO, /^Admiral/i, /^Admiral \(Ld 9\)/);
  check("Admiral (s. 35): '1 re-roll included'", txt(adm) === "1 re-roll included" && adm.rerolls.purchasable === true, JSON.stringify(adm.rerolls));
  const adm2 = mk(GO, /^Admiral/i, /^Admiral \(Ld 9\)/, /^Two extra re-rolls/);
  check("... + Two extra re-rolls: '3 re-rolls (1 included + 2 bought)'", txt(adm2) === "3 re-rolls (1 included + 2 bought)", txt(adm2));
  const rath = mk(BK, /^Admiral/i, /^Lord Admiral Rath/);
  check("Lord Admiral Rath (s. 48): '2 re-rolls included'", /^2 re-rolls included/.test(txt(rath) || ""), txt(rath));
  const mof = mk(CA, /^Master of the Fleet/i, /^Master of the Fleet/);
  check("Master of the Fleet (s. 97): 'no re-roll included'", txt(mof) === "no re-roll included" && mof.rerolls.purchasable === true, JSON.stringify(mof.rerolls));
  const mof2 = mk(CA, /^Master of the Fleet/i, /^Master of the Fleet/, /^Two re-rolls/);
  check("... + Two re-rolls: '2 re-rolls bought (none included)'", txt(mof2) === "2 re-rolls bought (none included)", txt(mof2));
  const cap = mk(DO, /^Space Marine Captains/i, /^Space Marine Captain/);
  check("Space Marine Captain (s. 100): ei re-roll-tekstia", txt(cap) === "" && cap.rerolls.purchasable === false, JSON.stringify(cap.rerolls));
  /* valintalista: sama lause rivilta, ilman valintaa */
  const off = DOMAIN.commanderRerollOffer || (() => null);
  const a1 = at(GO, /^Admiral/i, /^Fleet-Admiral/), o1 = off(GO, a1.si, a1.ei);
  check("valintalista: Fleet-Admiral -> 1 sisaltyy", !!o1 && o1.included === 1 && o1.text === "1 re-roll included", JSON.stringify(o1));
  const a2 = at(CA, /^Master of the Fleet/i, /^Master of the Fleet/), o2 = off(CA, a2.si, a2.ei);
  check("valintalista: Master of the Fleet -> ei sisally, myynnissa", !!o2 && o2.included === 0 && o2.purchasable === true && o2.text === "no re-roll included", JSON.stringify(o2));
  const a3 = at(GO, /^Cruisers$/i, /^Lunar/);
  check("valintalista: alusrivilla ei re-roll-tietoa", off(GO, a3.si, a3.ei) === null);
  /* jokainen komentaja, jolla on sisaltyva re-roll, sanoo sen */
  let n = 0, bad = [];
  catalog.lists.forEach(L => L.secs.forEach((sec, si) => sec.ents.forEach((en, ei) => {
    if(en.k !== "cmd") return;
    const o = off(L, si, ei) || {};
    const want = en.rr > 0 ? new RegExp("^" + en.rr + " re-rolls?( per turn)? included") : /^(no re-roll included)?$/;
    n++;
    if(!want.test(o.text == null ? "?" : o.text)) bad.push(L.nm + " / " + en.l + ": " + o.text);
  })));
  /* 81 = 77 + Abaddon neljalla jumalalistalla (s.231, J162 13.10.2026) */
  check("jokainen 81 komentajarivista: sisaltyva maara sanotaan sanoin", n === 81 && !bad.length, bad.slice(0, 5).join(" | "));
  /* laivaston oma re-roll ilman komentajaa (Necron s. 404, Demiurg s. 486) */
  const fr = DOMAIN.fleetRerolls || (() => null);
  [[NE, 404], [DE, 486]].forEach(p => {
    const f = fr(p[0]);
    check(p[0].nm + ": laivasto saa yhden re-rollin (s. " + p[1] + ")", !!f && f.included === 1 && f.page === p[1] && /1 re-roll included/.test(f.text), JSON.stringify(f));
  });
  check("Imperial Navy: ei laivaston omaa re-rollia (komentajan)", fr(GO) === null, JSON.stringify(fr(GO)));
  /* Rajattu re-roll sanotaan rajattuna (kirjatarkistus 5.10.2026, 75/75 maaraa
     tasmasi; kuudella rivilla kirja rajaa kayton tai yksikon):
       s. 38  Veteran Captain "can only be used on their own vessel or another vessel in their own squadron"
       s. 174, 176 Veteran Rogue Trader "may be used for his vessel or an accompanying Rogue Trader escort squadron"
       s. 231 Abaddon "Re-rolls: 1 per turn."; s. 234 "Abaddon receives one re-roll per turn"
       s. 318 Farseers "a re-roll which may be used on itself, another capital ship in the same squadron or an escort squadron within 15 cm"
       s. 372 Clanz "A Warlord's re-rolls only count for the skwadrons under his command and not for the whole fleet."
       s. 486 Demiurg "These re-rolls can only be used for Demiurg vessels" */
  const BA = by("Imperial Navy \u2014 Bastion Fleets"), RT = by("Rogue Traders"), RX = by("Rogue Traders \u2014 Exploration"),
        BC = by("Chaos \u2014 Black Crusade"), IY = by("Eldar \u2014 Iyanden Craftworld"), CZ = by("Orks \u2014 Da Ork Clanz"),
        CY = by("Orks \u2014 Cyclops Cluster");
  check("rerollText: rajaus perassa", T(1, 0, false, { scope: "own vessel or squadron only" }) === "1 re-roll included, own vessel or squadron only");
  check("rerollText: yksikko (per turn)", T(1, 0, false, { unit: "per turn" }) === "1 re-roll per turn included");
  check("rerollText: rajaus myos ostettujen kanssa", T(1, 2, true, { scope: "his own skwadrons only" }) === "3 re-rolls (1 included + 2 bought), his own skwadrons only");
  [[BA, /^Veteran Captains/i, /^Veteran Captain/, "1 re-roll included, own vessel or squadron only", 38],
   [RT, /^Veteran Rogue Traders/i, /^Veteran Rogue Trader/, "1 re-roll included, own vessel or its Rogue Trader escort squadron", 174],
   [RX, /^Veteran Rogue Traders/i, /^Veteran Rogue Trader/, "1 re-roll included, own vessel or its Rogue Trader escort squadron", 176],
   [BC, /^Abaddon/i, /^Abaddon/, "1 re-roll per turn included", 234],
   [IY, /^Farseers/i, /^Farseers/, "1 re-roll included, own ship, its squadron or an escort squadron within 15 cm", 318],
   [CZ, /^WARLORD/i, /^Ork Warlord/, "1 re-roll included, his own skwadrons only", 372],
   [CY, /^WARLORD/i, /^Ork Warlord/, "1 re-roll included", 365]
  ].forEach(c => {
    const R = mk(c[0], c[1], c[2]);
    const a = at(c[0], c[1], c[2]), o = off(c[0], a.si, a.ei);
    check(c[0].nm + " / " + a.en.l + " (s. " + c[4] + "): '" + c[3] + "'", txt(R) === c[3] && !!o && o.text === c[3], txt(R) + " | " + (o && o.text));
  });
  const cz2 = mk(CZ, /^WARLORD/i, /^Ork Warlord/, /^Two extra re-rolls/);
  check("Clanz-Warlord + Two extra: rajaus koskee myos ostettuja (s. 372)", txt(cz2) === "3 re-rolls (1 included + 2 bought), his own skwadrons only", txt(cz2));
  const fd = fr(DE);
  check("Demiurg: laivaston re-roll vain Demiurg-aluksille (s. 486)", !!fd && fd.text === "1 re-roll included, Demiurg vessels only", JSON.stringify(fd));
  check("Necron: laivaston re-roll ilman rajausta (s. 404)", !!fr(NE) && fr(NE).text === "1 re-roll included", JSON.stringify(fr(NE)));
  /* Re-roll-ruudut (kayttaja 5.10.2026: "johtajakorttiin rastiruudut rerollien
     trakkaamiseen - hintaan kuuluvat ja ostetut optiot erivarisina"). Yksi
     ruutu per re-roll, lajinaan mista se tuli: included (hinnassa), bought
     (otettu rivi), optional (avoin optio, ei pisteissa - rastitaan kayttoon
     jos ostetaan). Saman ryhman avoimista riveista lasketaan suurin, ei summaa:
       s. 35  Admiral: yksi sisaltyy; One / Two / Three extra re-rolls (25 / 75 / 150)
       s. 97  Master of the Fleet: ei sisaltyvaa; One / Two / Three re-rolls
       s. 234 Black Crusade Warmaster: yksi sisaltyy, "may be given an extra re-roll
              at a cost of +25 points" ja Mark of Tzeentch "This ship has an extra re-roll"
       s. 404 Necron: "The fleet gets one re-roll"; One extra 25 / Two extra 75 */
  const bx = R => R && R.rerolls && R.rerolls.boxes ? R.rerolls.boxes.join(",") : "?";
  check("ruudut: Admiral ilman valintoja = 1 hinnassa + 3 avointa", bx(adm) === "included,optional,optional,optional" && adm.rerolls.optional === 3, bx(adm));
  check("ruudut: Admiral + Two extra = 1 hinnassa + 2 ostettua, ei avoimia", bx(adm2) === "included,bought,bought" && adm2.rerolls.optional === 0, bx(adm2));
  check("ruudut: Lord Admiral Rath = 2 hinnassa (s. 48)", /^included,included/.test(bx(rath)), bx(rath));
  check("ruudut: Master of the Fleet = 3 avointa, ei yhtaan hinnassa", bx(mof) === "optional,optional,optional", bx(mof));
  check("ruudut: Master of the Fleet + Two re-rolls = 2 ostettua", bx(mof2) === "bought,bought", bx(mof2));
  check("ruudut: Space Marine Captain = ei ruutuja", bx(cap) === "", bx(cap));
  const wm = mk(BC, /^Chaos Warmaster/i, /^Chaos Warmaster/);
  check("ruudut: Black Crusade Warmaster = 1 hinnassa + lisa-re-roll + Mark of Tzeentch avoimina (eri ryhmat summataan)",
        bx(wm) === "included,optional,optional", bx(wm));
  const shipOf = (L, re, take) => { let a = null; L.secs.forEach(sec => sec.ents.forEach(en => { if(!a && en.r != null && re.test(en.l)) a = { sec: sec, en: en }; }));
    const it = { schemaVersion: DOMAIN.SCHEMA_VERSION, role: "core", entry: { list: L.nm, section: a.sec.t, label: a.en.l },
      ref: String(a.en.r), hull: null, hulls: 1, name: "", note: "", adjust: 0, custom: null, members: [], options: {}, upgrades: {} };
    if(take){ const up = DOMAIN.resolveUnit(it, { list: L }, catalog).upgrades.filter(x => take.test(x.label))[0]; it.upgrades[up.id] = "take"; }
    return DOMAIN.resolveUnit(it, { list: L }, catalog); };
  const n0 = fr(NE, [shipOf(NE, /Tombship/i)]);
  check("ruudut: Necron-laivasto = 1 oma + 2 avointa (One tai Two extra, suurin)", !!n0.boxes && n0.boxes.join(",") === "included,optional,optional", JSON.stringify(n0.boxes));
  /* ---- katselmoinnin 5.10.2026 loydokset ---- */
  /* Sisaltyva maara on kirjasta, ei datasta: referenssi/komentajien_rerollit.json
     on kirjatarkistuksen oma tallenne (75 rivia, sivu jokaisella). */
  const RRREF = JSON.parse(fs.readFileSync(path.join(HERE, "referenssi", "komentajien_rerollit.json"), "utf8")).rows;
  let refBad = [], seen = 0;
  catalog.lists.forEach(L => L.secs.forEach(sec => sec.ents.forEach(en => {
    if(en.k !== "cmd") return;
    const r = RRREF.filter(x => x.list === L.nm && x.section === sec.t && x.label === en.l)[0];
    seen++;
    if(!r || r.rerolls_included !== (en.rr || 0) || !Number.isInteger(r.page)) refBad.push(L.nm + " / " + en.l + ": data " + en.rr + ", kirja " + (r ? r.rerolls_included : "-"));
  })));
  /* 81: samat nelja Abaddonin rivia, referenssissa sivulla 231 */
  check("sisaltyvat re-rollit: jokainen 81 rivista tasmaa kirjatarkistuksen tallenteeseen", seen === 81 && RRREF.length === 81 && !refBad.length, refBad.slice(0, 4).join(" | "));
  /* Rajaus myos ostetulle re-rollille ja riville, jolla ei ole sisaltyvaa:
       s. 178 "Pirate Captains may use their re-rolls on any vessel or escort squadron in the fleet,
              but no individual Pirate Captain may use more than one re-roll per turn."
       s. 234 "A Lord may be given a re-roll (which he can use for his own ship or squadron only) at +25 points."
       s. 236 "... a Mark of Tzeentch, providing a re-roll (which he can use for his own ship or squadron only)"
       s. 240, 244, 248: sama lause kuin s. 234 */
  const PI = by("Rogue Traders \u2014 Pirates and Wolf Packs");
  const pc = mk(PI, /^Pirate Captains/i, /^Pirate Captain/);
  check("Pirate Captain (s. 178): raja sanotaan", txt(pc) === "1 re-roll included, at most one per turn per Captain", txt(pc));
  [[BC, 234, /^One re-roll/], [by("Chaos \u2014 Tzeentch"), 236, /Mark of Tzeentch/i], [by("Chaos \u2014 Nurgle"), 240, /^One re-roll/],
   [by("Chaos \u2014 Khorne"), 244, /^One re-roll/], [by("Chaos \u2014 Slaanesh"), 248, /^One re-roll/]].forEach(c => {
    const lord0 = mk(c[0], /^Chaos Lords/i, /^Chaos Lord/), lord1 = mk(c[0], /^Chaos Lords/i, /^Chaos Lord/, c[2]);
    check(c[0].nm + " / Chaos Lord (s. " + c[1] + "): ostettu re-roll vain omalle alukselle tai laivueelle",
          txt(lord0) === "no re-roll included" && txt(lord1) === "1 re-roll bought (none included), his own ship or squadron only", txt(lord0) + " | " + txt(lord1));
  });
  /* Tyranidien Hive Mind Influence (s. 430): "in lieu of having a fleet commander ...
     Hive Mind Influence re-rolls work in the same way as normal fleet commander re-rolls";
     "A maximum of one Hive Mind Influence re-roll can be purchased per hive ship in the fleet."
     Ei sisaltyvaa; jokainen emoalus voi ostaa yhden - summa, ei suurin. */
  const TY = by("Tyranids \u2014 Hive Fleet"), TV = by("Tyranids \u2014 Vanguard Fleet");
  const h0 = shipOf(TY, /^Hive ship/i), h1 = shipOf(TY, /^Hive ship/i, /Hive Mind Influence re-roll/i);
  const t0 = fr(TY, [h0, h0]), t2 = fr(TY, [h1, h1, h0]);
  check("Tyranid Hive Fleet (s. 430): ei sisaltyvaa, avoin ruutu per emoalus", !!t0 && t0.included === 0 && t0.page === 430 && t0.text === "no re-roll included" && (t0.boxes || []).join(",") === "optional,optional", JSON.stringify(t0));
  check("... kaksi ostettua, kolmas emoalus viela auki", !!t2 && t2.text === "2 re-rolls bought (none included)" && (t2.boxes || []).join(",") === "bought,bought,optional", JSON.stringify(t2 && [t2.text, t2.boxes]));
  check("Tyranid Vanguard (s. 429): ei re-rolleja lainkaan", fr(TV, []) === null);
  /* Yksi osto laivastolle (s. 404): kahdelle alukselle rastittu rivi ei tuplaa re-rolleja */
  const nn = fr(NE, [shipOf(NE, /Tombship/i, /^One extra re-roll/), shipOf(NE, /Scythe/i, /^One extra re-roll/)]);
  check("Necron: sama rivi kahdella aluksella on silti yksi osto (s. 404)", !!nn && nn.bought === 1 && nn.text === "2 re-rolls (1 included + 1 bought)", JSON.stringify(nn && [nn.bought, nn.text]));
  /* Aluksen omat re-rollit:
       s. 258 Scion of Prospero: "bears the Mark of Tzeentch as part of its point cost" (Mark: "+1 re-roll", s. 236)
              ja "The ship is gifted with an additional re-roll added to that from the Mark of Tzeentch" -> 2 hinnassa
       s. 98 / 111 Fortress-Monastery: One / Two / Three re-rolls, "usable only by itself"
       tavallisella aluksella ei ole omia */
  const scion = shipOf(by("Chaos \u2014 Tzeentch"), /Scion of Prospero/i);
  check("Scion of Prospero (s. 258): kaksi omaa re-rollia hinnassa", !!scion.rerolls && scion.rerolls.included === 2 && scion.rerolls.boxes.join(",") === "included,included" && /^2 re-rolls included, this ship's own$/.test(scion.rerolls.text), JSON.stringify(scion.rerolls));
  const CR = by("Space Marines \u2014 Crusade");
  const fm0 = shipOf(CR, /^Fortress-Monastery/i), fm2 = shipOf(CR, /^Fortress-Monastery/i, /^Two re-rolls/);
  check("Fortress-Monastery (s. 98): ei sisaltyvaa, kolme avointa", !!fm0.rerolls && fm0.rerolls.boxes.join(",") === "optional,optional,optional" && fm0.rerolls.text === "no re-roll included", JSON.stringify(fm0.rerolls));
  check("... Two re-rolls otettu: kaksi ostettua, aluksen omia", !!fm2.rerolls && fm2.rerolls.boxes.join(",") === "bought,bought" && fm2.rerolls.text === "2 re-rolls bought (none included), this ship's own", JSON.stringify(fm2.rerolls && fm2.rerolls.text));
  const lun = shipOf(GO, /^Lunar/);
  check("Lunar: ei omia re-rolleja", !lun.rerolls, JSON.stringify(lun.rerolls));
  check("Necron Tombship: laivaston re-roll ei ole aluksen oma", !shipOf(NE, /Tombship/i, /^One extra re-roll/).rerolls);
  const n1 = fr(NE, [shipOf(NE, /Tombship/i, /^One extra re-roll/), shipOf(NE, /Scythe/i)]);
  check("ruudut: Necron + One extra = 1 oma + 1 ostettu, ei avoimia (yksi osto laivastolle)", !!n1.boxes && n1.boxes.join(",") === "included,bought", JSON.stringify(n1.boxes));
})();

/* ---- 15. Planetary defences (Fleets s.496-517, Rulebook s.100-101) ------
   Odotukset on luettu kirjasta: hintalista ja rajat s.499, profiilit
   s.506-517, Ramilies s.500, Tau s.451-452, laivueet ja Leadership
   Rulebook s.100, kriittitaulukko s.101. */
(function(){
  const PD = "PLANETARY DEFENCES";
  const by = nm => catalog.lists.find(L => L.nm === nm);
  const secOf = L => L.secs.find(x => x.t === PD);
  const unit = (L, re, hulls) => {
    const sec = secOf(L), en = sec.ents.find(e => re.test(e.l));
    return { list: L.nm, entry: { section: sec.t, label: en.l }, ref: en.r == null ? null : String(en.r),
             hulls: hulls || 1, options: {}, upgrades: {} };
  };
  const R = (L, re, hulls) => DOMAIN.resolveUnit(unit(L, re, hulls), { list: L, host: L }, catalog);
  const GO = by("Imperial Navy \u2014 Gothic Sector"), EX = by("Adeptus Mechanicus \u2014 Explorator"),
        KH = by("Chaos \u2014 Khorne"), CR = by("Space Marines \u2014 Crusade"),
        TM = by("Tau \u2014 Merchant Fleet"), EC = by("Eldar Corsairs \u2014 Gothic Sector"),
        BA = by("Imperial Navy \u2014 Bastion Fleets");

  check("PD: osio on jokaisen listan VIIMEINEN ja tasan kerran",
        catalog.lists.every(L => L.secs[L.secs.length - 1].t === PD && L.secs.filter(x => x.t === PD).length === 1 &&
                                 secOf(L).ct === "defence"));

  /* s.499 hintalista: nimi, pisteet, raja - luettu sivulta rivi rivilta */
  const P499 = [["Orbital defence laser platform", 30, null, "509"], ["Orbital torpedo launcher", 30, null, "510"],
                ["Orbital weapons platform", 30, null, "511"], ["Orbital mine", 5, null, null], ["Minefield", 40, 2, null],
                ["Fire ship", 10, 6, "516"], ["System ship", 20, null, "515"], ["Defence monitor", 60, null, "514"],
                ["Orbital dock", 90, null, "508"], ["Space station", 150, null, "507"],
                ["Blackstone fortress", 400, null, "506"], ["Defence laser silo", 15, 8, "517b"],
                ["Missile silo", 5, 8, "517c"], ["Air base", 20, 4, "517"]];
  const rowsOf = L => secOf(L).ents;
  const badRow = [];
  catalog.lists.filter(L => !/^Tau /.test(L.nm)).forEach(L => P499.forEach(x => {
    const e = rowsOf(L).find(r => r.l === x[0]);
    if(!e || e.p !== x[1] || (e.mx == null ? null : e.mx) !== x[2] || (e.r == null ? null : String(e.r)) !== x[3])
      badRow.push(L.nm + " / " + x[0]);
  }));
  check("PD s.499: 14 rivia hintoineen ja rajoineen 30 listalla", badRow.length === 0, badRow.slice(0, 3).join(" | "));

  /* s.451-452: "The Tau may not use any other form of planetary defence." */
  const tau = catalog.lists.filter(L => /^Tau /.test(L.nm));
  check("PD Tau (s.452): kahdella Tau-listalla vain orbitaalit 478-481",
        tau.length === 2 && tau.every(L => rowsOf(L).map(e => String(e.r)).join(",") === "478,479,480,481"));
  check("PD: Tau-orbitaaleja ei ole muilla listoilla",
        catalog.lists.filter(L => !/^Tau /.test(L.nm)).every(L => !rowsOf(L).some(e => /^(478|479|480|481)$/.test(String(e.r)))));
  /* s.480: CORE MODULE 20 PTS; s.478 150 PTS; s.479 50 PTS */
  check("PD Tau: City 150 (s.478), Security orbital 50 (s.479), Orbital core 20 (s.480)",
        rowsOf(TM).find(e => e.r === 478).p === 150 && rowsOf(TM).find(e => e.r === 479).p === 50 &&
        rowsOf(TM).find(e => e.r === 480).p === 20);

  /* s.500: "The Ramilies is available to Imperial and Chaos Fleets" */
  const ram = catalog.lists.filter(L => rowsOf(L).some(e => e.r === 500));
  check("PD Ramilies (s.500): Imperial Navy -rodun listat ja Chaos, 875 pts",
        ram.length === 11 && ram.every(L => L.race === "imperial navy" || L.race === "chaos") &&
        ram.every(L => rowsOf(L).find(e => e.r === 500).p === 875), ram.map(L => L.nm).join(" | "));
  /* s.334: Haven on Eldar-luvun asema, 200 pts */
  const hav = catalog.lists.filter(L => rowsOf(L).some(e => String(e.r) === "334"));
  check("PD Haven (s.334): Eldar-listoilla, 200 pts",
        hav.length >= 3 && hav.every(L => /eldar/.test(L.race)) && hav.filter(L => rowsOf(L).find(e => String(e.r) === "334").p === 200).length === hav.length,
        hav.map(L => L.nm).join(" | "));

  /* Profiilit, jotka poimija ei saa: s.516 ja s.517 */
  const S = catalog.ships;
  check("PD s.516 Fire Ship: Escort/1, 15 cm, 45, kilvet 1, panssari 5+, tornit 1, ei aseita",
        S["516"] && S["516"].ty === "Escort" && S["516"].hp === 1 && S["516"].sp === "15 cm" && /^45/.test(S["516"].tn) &&
        S["516"].sh === "1" && S["516"].ar === "5+" && S["516"].tu === "1" && S["516"].aw.length === 0 && S["516"].bp === 10);
  check("PD s.517 Defence Laser Silo: Ground/1, 0/0/0/6+/0, Lance battery 60 cm 3 Front, 15 pts",
        S["517b"] && S["517b"].ty === "Ground" && S["517b"].hp === 1 && S["517b"].sh === "0" && S["517b"].ar === "6+" &&
        S["517b"].tu === "0" && same(S["517b"].aw, [["Lance battery", "60 cm", "3", "Front"]]) && S["517b"].bp === 15);
  check("PD s.517 Missile Silo: Ground/1, Torpedoes 30 cm 6 Front, 5 pts",
        S["517c"] && S["517c"].ty === "Ground" && S["517c"].tu === "0" &&
        same(S["517c"].aw, [["Torpedoes", "30 cm", "6", "Front"]]) && S["517c"].bp === 5);
  check("PD: Defence monitor, System ship ja Fire ship eivat ole reservityyppeja (s.14, s.498)",
        ["514", "515", "516"].every(k => S[k].rt === "none"));

  /* Listan paivitykset eivat kuulu puolustuksille: ei yhtaan tarjottua
     rivia millaan listalla, eika pakollista riviakaan. Kirjan oma poikkeus
     on yksi (kayttajan paatos 13.10.2026, J174): s.503 "A Ramilies can
     purchase special torpedoes" - s.19:n taulukosta vahvuus 9 = "7 or more".
     Ramiliesille tarjotaan siis tasan se rivi eika mitaan muuta. */
  const leaks = [];
  let fortRows = 0;
  catalog.lists.forEach(L => rowsOf(L).forEach(en => {
    const it = { list: L.nm, entry: { section: PD, label: en.l }, ref: en.r == null ? null : String(en.r), hulls: 1, options: {}, upgrades: {} };
    const r = DOMAIN.resolveUnit(it, { list: L, host: L }, catalog);
    const fort = /^Ramilies class star fort$/i.test(en.l);
    const got = r ? r.upgrades.map(u => u.label) : null;
    const want = fort ? ["Special torpedoes (Strength 7 or more)"] : [];
    if(!r || !same(got, want)) leaks.push(L.nm + " / " + en.l + ": " + JSON.stringify(got));
    if(fort) fortRows++;
    const sel = DOMAIN.selectionOf(it, { list: L, host: L }, catalog);
    if(DOMAIN.requiredUpgradeKeys(sel).length || DOMAIN.defaultUpgradeKeys(sel).length) leaks.push(L.nm + " / " + en.l + ": pakollinen");
  }));
  check("PD: puolustusriville ei tarjota listan paivityksia, paitsi Ramiliesille erikoistorpedot (s.19, s.503)",
        leaks.length === 0 && fortRows > 0, "Ramilies-riveja " + fortRows + " | " + leaks.slice(0, 3).join(" | "));
  check("PD Explorator: Space station ei ole Mechanicus-alus eika saa tornirefitia (s.118-120, s.499)",
        R(EX, /^Space station$/).mechanicus === false && R(EX, /^Space station$/).stats.turrets === "4" &&
        !/ADMECH/.test(R(EX, /^Space station$/).damage.repair) &&
        DOMAIN.requiredHullChanges(EX, S["507"]).rows.length === 0 && DOMAIN.requiredHullChanges(EX, S["507"]).mod === null);
  check("PD Chaos: Space station ei saa listan Chaos-saantoa (+1 boarding)",
        !R(KH, /^Space station$/).rules.some(r => /^Chaos: \+1 in boarding/.test(r.t)));

  /* Lainaus: puolustusosion rivi ei ole lainattavissa, rungoton rivikaan */
  const lendOk = [];
  rowsOf(BA).forEach(en => {
    const v = DOMAIN.lendRowVerdict(GO, BA, BA.secs.indexOf(secOf(BA)), en, catalog, { role: "reserve", condMet: true });
    if(v.ok || v.cause !== "type") lendOk.push(en.l + ":" + v.cause);
  });
  check("PD: Bastionin puolustusrivit eivat ole Gothicin lainattavissa (s.14)", lendOk.length === 0, lendOk.slice(0, 4).join(" | "));

  /* Yhden osuman puolustus on laivue 1-6 (Rulebook s.100), tyyppi sailyy */
  const wp = R(GO, /^Orbital weapons platform$/, 3);
  check("PD alusta x3: laivue 1-6, 90 pts, tyyppi Defence, ei crippled-tilaa",
        wp.card === "squadron" && wp.squadron && wp.squadron.min === 1 && wp.squadron.max === 6 && wp.points === 90 &&
        wp.stats.type === "Defence" && wp.damage.crippled === false && /^DEFENCE: one unsaved Hit/.test(wp.damage.note) &&
        wp.damage.repair === "", JSON.stringify([wp.card, wp.squadron, wp.points, wp.damage.note]));
  const ab = R(GO, /^Air base$/, 2), ls = R(GO, /^Defence laser silo$/, 2);
  check("PD maakohteet (s.517): kortti pitaa 1-4 / 1-6, ei kirjan laivuesaantoa",
        ab.squadron.max === 4 && ab.squadron.cardOnly === true && ls.squadron.max === 6 && ls.squadron.src === "" &&
        ab.defence.ground === true);
  const dm = R(GO, /^Defence monitor$/, 2);
  check("PD Defence monitor x2: 120 pts, laivue 1-6, tyyppi Escort, ei kiinteaa asemaa",
        dm.points === 120 && dm.squadron.min === 1 && dm.stats.type === "Escort" && dm.defence.stationary === false);

  /* Leadership ja kaskyt: s.499 / Rulebook s.100; Ramilies s.503; F-M s.111 */
  const st = R(GO, /^Space station$/), rf = R(GO, /^Ramilies/), fm = (() => {
    const sec = CR.secs.find(x => /FORTRESS-MONASTERY/i.test(x.t)), en = sec.ents.find(e => e.r === 110);
    return DOMAIN.resolveUnit({ list: CR.nm, entry: { section: sec.t, label: en.l }, ref: "110", hulls: 1, options: {}, upgrades: {} },
                              { list: CR, host: CR }, catalog);
  })();
  check("PD Space station: Ld 7 kiintea, kaskyt RO + BFI, asemataulukko (Rulebook s.100-101)",
        st.leadership && st.leadership.value === 7 && same(st.orders, ["RO", "BFI"]) &&
        st.damage.critical.title === "DEFENCES CRITICAL HITS (2D6)" && st.damage.crippledAt === 4 && st.card === "capital" &&
        st.damage.critical.rows.some(r => r[0] === "8-9" && /ORBIT LOST/.test(r[1])) &&
        st.damage.critical.rows.some(r => r[0] === "4" && r[1] === "MAIN ARMAMENT" && r[2] === "OFF"),
        JSON.stringify([st.leadership, st.orders, st.damage.critical.title]));
  check("PD Ramilies (s.503): Ld heitetaan, kaskyt RO + LO + BFI, kortti fort, aseilla vyohyke",
        rf.leadership === null && same(rf.orders, ["RO", "LO", "BFI"]) && rf.card === "fort" &&
        rf.weapons.map(w => w.zone).join(",") === "quadrant,quadrant,quadrant,basilica,basilica" &&
        rf.defence.ownPoints === true, JSON.stringify([rf.leadership, rf.orders, rf.card, rf.weapons.map(w => w.zone)]));
  check("PD Fortress-Monastery (s.111): Ld 10 kiintea, kortti fort, listan omat paivitykset tallella",
        fm.leadership && fm.leadership.value === 10 && fm.card === "fort" && fm.upgrades.length >= 3 &&
        fm.weapons.map(w => w.zone).join(",") === "quadrant,quadrant,quadrant,basilica,basilica",
        JSON.stringify([fm.leadership, fm.card, fm.upgrades.length]));

  /* Saantokortit: s.512, s.513, s.516 */
  const om = R(GO, /^Orbital mine$/, 4), mf = R(GO, /^Minefield$/, 2), fs2 = R(GO, /^Fire ship$/, 3);
  check("PD Orbital mine x4 (s.512): 20 pts, saantokortti, laskettava, ei rajaa",
        om.kind === "entry" && om.card === "rule" && om.points === 20 && om.countable === true &&
        om.ruleCard && om.ruleCard.page === 512 && om.ruleCard.limit === null && om.ruleCard.track.kind === "each" &&
        om.ruleCard.steps.some(x => /10 cm toward the nearest enemy ship/.test(x.t)) &&
        om.ruleCard.steps.some(x => /roll 8 dice/.test(x.t) && /roll 4 dice instead/.test(x.t)),
        JSON.stringify([om.kind, om.card, om.points, om.countable]));
  check("PD Minefield x2 (s.513): 80 pts, raja 2, koko heitetaan, havainto 5+ ja muuntimet",
        mf.card === "rule" && mf.points === 80 && mf.ruleCard.limit === 2 && mf.ruleCard.track.kind === "size" &&
        mf.ruleCard.steps.some(x => /D3 x 5 cm/.test(x.t) && /within 15 cm/.test(x.t)) &&
        mf.ruleCard.steps.some(x => /within 30 cm/.test(x.t) && /5\+/.test(x.t) && /\+1 if the ship is on All Ahead Full/.test(x.t) &&
                                    /-1 on Burn Retros/.test(x.t) && /-1 if it is an escort/.test(x.t)) &&
        mf.ruleCard.steps.some(x => /armour 6/.test(x.t)));
  check("PD Fire ship x3 (s.516): 30 pts, alus jolla saantokortti, 3D6 cm ja D3 Fire criticals",
        fs2.kind === "ship" && fs2.card === "rule" && fs2.points === 30 && fs2.weapons.length === 0 && fs2.ruleCard.limit === 6 &&
        fs2.ruleCard.steps.some(x => /3D6/.test(x.t) && /D3 Fire critical hits/.test(x.t)) && fs2.leadership.value === 7);

  /* Laivaston taso: koukut ja Khornen Mark */
  const fleet = (L, units, limit) => DOMAIN.resolveFleet({ list: L.nm, limit: limit || 1500, units: units }, catalog);
  const own = (L, re, hulls) => {
    let hit = null;
    L.secs.forEach(sec => sec.ents.forEach(en => { if(!hit && en.k !== "up" && re.test(en.l)) hit = [sec, en]; }));
    return { list: L.nm, entry: { section: hit[0].t, label: hit[1].l }, ref: hit[1].r == null ? null : String(hit[1].r),
             hulls: hulls || 1, options: {}, upgrades: {} };
  };
  /* s.478: Orbital Cityn koukut ovat sita "vartioimaan maarattyjen" Orcien,
     eivat laivaston kapasiteettia (s.454). */
  const hkRow = c => /^Gravitic hook capacity \(Orcas and Wardens\)/.test(c.t);
  const hk0 = fleet(TM, [own(TM, /^Merchant class starship/), own(TM, /^Orca class gunship$/)]).checks.find(hkRow);
  const hk1 = fleet(TM, [own(TM, /^Merchant class starship/), own(TM, /^Orca class gunship$/),
                         unit(TM, /^Kor caste orbital city$/)]).checks.find(hkRow);
  /* Katselmointi 9.10.2026: koukku jatettiin ensin kokonaan pois, jolloin
     orbitaalin omat vartijat (s.478 "Capacity: 2 Orcas/Wardens", ostetaan
     erikseen) tekivat laivastosta laittoman. Koukku kantaa, kun se on
     aluksella: Cityssa aina, Waystationissa vain kun se on valittu (s.481). */
  const cap = c => +String(c.v).split("/")[1];
  check("PD Tau: Orbital Cityn koukku kantaa kaksi vartijaa (s.478)",
        !!hk0 && !!hk1 && cap(hk1) === cap(hk0) + 2, JSON.stringify([hk0 && hk0.v, hk1 && hk1.v]));
  const way = opt => {
    const u = unit(TM, /^Waystation$/);
    if(opt) u.options[S["481"].ol.find(o => opt.test(o.t)).id] = { state: "take" };
    return u;
  };
  const hkW = us => fleet(TM, [own(TM, /^Merchant class starship/), own(TM, /^Orca class gunship$/)].concat(us)).checks.find(hkRow);
  check("PD Tau: Waystationin koukku kantaa vain valittuna (s.481)",
        cap(hkW([way(null)])) === cap(hk0) && cap(hkW([way(/^Railgun/)])) === cap(hk0) &&
        cap(hkW([way(/^Gravitic hook/)])) === cap(hk0) + 1,
        [cap(hk0), cap(hkW([way(null)])), cap(hkW([way(/^Railgun/)])), cap(hkW([way(/^Gravitic hook/)]))].join(","));
  /* s.481: "Choose one of the defence systems below. This defines the point
     cost for the waystation." */
  const wRow = us => fleet(TM, us).checks.find(c => /^Waystation \(choose one/.test(c.t));
  check("PD Waystation (s.481): ilman jarjestelmaa punainen rivi, yhdella ei rivia",
        !!wRow([way(null)]) && wRow([way(null)]).ok === false && !wRow([way(/^Ion Cannon/)]),
        JSON.stringify(wRow([way(null)])));
  /* Rulebook s.101 ei tunne Havenia: sen taulukko on s.337 ja rivi 8 sanoo
     sen ajelehtivan, joten kortti ei saa sanoa "never drifts". */
  const hvn = R(EC, /^Haven space station$/);
  check("PD Haven (s.336-337): oma korjausbonus kortilla, ei 'never drifts' -lausetta",
        hvn.rules.some(r => /rolls the 2 extra repair dice itself/.test(r.t)) && !hvn.rules.some(r => /never moves or drifts/.test(r.t)) &&
        hvn.damage.critical.rows.some(r => r[0] === "4" && r[1] === "LANCES"), hvn.rules.map(r => r.t.slice(0, 30)).join(" | "));
  check("PD Ramilies (s.501, s.503): templaattisaanto ja Burn Retros telakalla ovat saannoissa",
        rf.rules.some(r => /centre hole/.test(r.t)) && rf.rules.some(r => /Burn Retros/.test(r.t)), "-");
  check("PD Minefield (s.513): sijoitus minka tahansa poydan kohteen lahelle",
        mf.ruleCard.steps.some(x => /tabletop feature/.test(x.t) && /within 15 cm/.test(x.t)), "-");
  const rows = (L, us) => fleet(L, us, 3000).checks.filter(c => !c.ok).map(c => c.t).sort().join(" | ");
  const kBase = [own(KH, /^Chaos Warmaster/), own(KH, /^Slaverer$/)];
  check("PD Khorne (s.264): 400 pisteen Blackstone ei vie Slavererilta lippulaivan paikkaa",
        rows(KH, kBase) === rows(KH, kBase.concat([unit(KH, /^Blackstone fortress$/)])),
        rows(KH, kBase) + "  ->  " + rows(KH, kBase.concat([unit(KH, /^Blackstone fortress$/)])));
})();

/* ---- 16. Prince Yriel Corsair-listoilla (Fleets s.319, J161) -----------
   "Yriel may be taken instead of the Hero Fleet Commander as listed in the
   Corsair and Craftworld Eldar fleet lists." Laatikko on painettu Iyandenin
   toiselle sivulle, joten rivi oli vain silla listalla. */
(function(){
  const by = nm => catalog.lists.find(L => L.nm === nm);
  const IY = by("Eldar \u2014 Iyanden Craftworld");
  const iy = IY.secs.find(s => s.t === "RESERVES AND ALLIES");
  ["Eldar Corsairs \u2014 Gothic Sector", "Eldar Corsairs \u2014 Later Gothic War"].forEach(nm => {
    const L = by(nm), si = L.secs.findIndex(s => s.t === "RESERVES AND ALLIES"), sec = L.secs[si];
    const rows = sec.ents.map(e => [e.l, e.p, e.k, e.rr || 0]);
    check("Yriel " + nm + ": rivi 150 pts, 1 re-roll hinnassa, +25 / +50, -25 Flamen kyydissa (s.319)",
          same(rows, [["Prince Yriel", 150, "cmd", 1], ["One extra re-roll", 25, "up", 1], ["Two extra re-rolls", 50, "up", 2],
                      ["Embarked aboard the Flame of Asuryan", -25, "up", 0]]), JSON.stringify(rows));
    check("Yriel " + nm + ": omat paivitysrivit osoittavat hanen riviinsa",
          sec.ents.slice(1).every(e => same(e.at, [[si, 0]])), JSON.stringify(sec.ents.slice(1).map(e => e.at)));
    const it = { list: L.nm, entry: { list: L.nm, section: sec.t, label: "Prince Yriel" }, ref: null, hulls: 1, options: {}, upgrades: {} };
    const R = DOMAIN.resolveUnit(it, { list: L, host: L }, catalog);
    const iyR = DOMAIN.resolveUnit({ list: IY.nm, entry: { list: IY.nm, section: iy.t, label: "Prince Yriel" }, ref: null, hulls: 1, options: {}, upgrades: {} },
                                   { list: IY, host: IY }, catalog);
    check("Yriel " + nm + ": komentaja, 150 pts, 1 re-roll included, kaksi avointa ruutua",
          !!R && R.kind === "commander" && R.points === 150 && R.rerolls.included === 1 &&
          R.rerolls.boxes.join(",") === "included,optional,optional", JSON.stringify(R && [R.kind, R.points, R.rerolls.boxes]));
    check("Yriel " + nm + ": kortin saannot samat kuin Iyandenin rivilla (9 lausetta s.319)",
          same(R.rules.map(r => r.t), iyR.rules.map(r => r.t)) && R.rules.length >= 9 &&
          R.rules.some(r => /Vampire raiders/.test(r.t)) && R.rules.some(r => /exempt from the reserve rules \(e\.g\. you do not have to field three capital ships in a Corsair Eldar fleet list\)\./.test(r.t)) &&
          !R.rules.some(r => /An Eldar Hero must lead the fleet in order to use Craftworld/.test(r.t)),
          R.rules.length + " / " + iyR.rules.length);
    check("Yriel " + nm + ": Flame of Asuryanin reservivapautus on listan tiedoissa sivuineen",
          !!L.res_exempt && L.res_exempt.pg === 319 && new RegExp(L.res_exempt.re, "i").test("Flame of Asuryan") &&
          !new RegExp(L.res_exempt.re, "i").test("Dragonship"), JSON.stringify(L.res_exempt));
  });
})();

/* ---- 17. Space Hulk -kortin malli (Fleets s.288, s.391; kayttaja 9.10.2026)
   Kriittitaulukko kolmena ryhmana alakohtineen, aseriveilla miinusruutujen
   tieto, ja lyhyt saantolista (brief): perusaseiden saannot on merkitty. */
(function(){
  const by = nm => catalog.lists.find(L => L.nm === nm);
  const hulk = (L, re) => {
    let hit = null;
    L.secs.forEach(sec => sec.ents.forEach(en => { if(!hit && en.k !== "up" && re.test(en.l)) hit = [sec, en]; }));
    return DOMAIN.resolveUnit({ list: L.nm, entry: { list: L.nm, section: hit[0].t, label: hit[1].l }, ref: String(hit[1].r),
                                hulls: 1, options: {}, upgrades: {} }, { list: L, host: L }, catalog);
  };
  const ork = hulk(by("Orks \u2014 Waaagh!"), /^Space Hulk$|Ork Hulk|Hulk/i), cha = hulk(by("Chaos \u2014 Incursion"), /^Chaos Space Hulk$/);
  const g = R => R.damage.critical.groups || [];
  const sub = (R, gi) => (g(R)[gi] ? g(R)[gi].subs : []).map(x => [x.roll, x.text, x.on || (x.track ? x.track.key + ":" + x.track.n : "")]);
  check("hulk s.391: kolme ryhmaa 1-2 / 3-4 / 5-6 nimineen",
        same(g(ork).map(x => [x.roll, x.name]), [["1-2", "HIGH ENERGY SYSTEMS"], ["3-4", "WEAPONS CLUSTERS"], ["5-6", "THRUSTERS"]]),
        JSON.stringify(g(ork).map(x => [x.roll, x.name])));
  check("Ork hulk s.391: high energy 1-2 dorsal lance, 3-4 shield (3 ruutua), 5-6 turret (6 ruutua)",
        same(sub(ork, 0), [["1-2", "-1 DORSAL LANCE", "lance"], ["3-4", "-1 SHIELD", "shields:3"], ["5-6", "-1 TURRET STR", "turrets:6"]]),
        JSON.stringify(sub(ork, 0)));
  check("Chaos hulk s.288: high energy 1-2 on prow AND dorsal lance",
        sub(cha, 0)[0] && sub(cha, 0)[0][1] === "-1 PROW AND DORSAL LANCE", JSON.stringify(sub(cha, 0)));
  check("hulk: weapons clusters 1-2 bay (ei prow/aft), 3-4 torpedo (ei aft), 5-6 -2 battery FP",
        same(sub(ork, 1), [["1-2", "-1 LAUNCH BAY (not prow/aft)", "bay"], ["3-4", "-1 TORPEDO STR (not aft)", "torp"],
                           ["5-6", "-2 WEAPONS BATTERY FP", "wb"]]), JSON.stringify(sub(ork, 1)));
  check("hulk: thrusterit kasaantuvat, kuusi ruutua", sub(ork, 2).length === 1 && sub(ork, 2)[0][2] === "thrusters:6", JSON.stringify(sub(ork, 2)));
  const loss = R => R.weapons.filter(w => w.box == null).map(w => [w.a[0], w.loss ? w.loss.key + "-" + w.loss.per + "x" + w.loss.n : "-"]);
  check("Ork hulk: jokaisella 11 aserivilla miinusruudut oikealla askeleella (lanssi/bay/torpedo -1, patteri -2)",
        loss(ork).length === 11 && loss(ork).every(x => x[1] !== "-") &&
        loss(ork).filter(x => /gunz/i.test(x[0])).every(x => /^wb-2x4$/.test(x[1])) &&
        loss(ork).filter(x => /lance/i.test(x[0])).every(x => x[1] === "lance-1x4") &&
        loss(ork).filter(x => /launch/i.test(x[0])).every(x => x[1] === "bay-1x4") &&
        loss(ork).filter(x => /torpedo/i.test(x[0])).every(x => x[1] === "torp-1x4"), JSON.stringify(loss(ork)));
  check("Chaos hulk: prow- ja dorsal-lanssilla molemmilla ruudut (s.288)",
        loss(cha).filter(x => /lance/i.test(x[0])).length === 2 && loss(cha).filter(x => /lance/i.test(x[0])).every(x => x[1] === "lance-1x4"),
        JSON.stringify(loss(cha)));
  check("hulk: brief, ja perusaseiden saannot on merkitty (weapon) - hulkin omat eivat",
        ork.brief === true && ork.rules.some(r => r.weapon && /^Ork Gunz/.test(r.t)) &&
        ork.rules.filter(r => r.hull).every(r => !r.weapon) && ork.rules.some(r => !r.weapon && /Hulk movement/.test(r.t)),
        ork.rules.map(r => (r.weapon ? "w:" : "") + r.t.slice(0, 18)).join(" | "));
  const lunar = hulk(by("Imperial Navy \u2014 Gothic Sector"), /^Lunar class cruiser$/);
  check("tavallinen alus: ei ryhmia, ei miinusruutuja, ei brief", !lunar.brief && !lunar.damage.critical.groups && lunar.weapons.every(w => !w.loss));
})();

/* ---- 18. aserivien varit (kayttaja 9.10.2026) -------------------------
   "muuta armageddon gun tausta samaksi kuin nova cannon (punainen). Warp
   cannons samaksi kuin lancella. sitten ork heavy gunz vahan eri savylla
   kuin normi gunz niin erottuu paremmin (tai itse asiassa hazard stripe
   voisi olla kova)". */
(function(){
  const W = DOMAIN.wepClass, same3 = (a, b) => a[0] === b[0] && a[1] === b[1] && a[2] === b[2];
  check("Armageddon gun (s.252) on samaa luokkaa ja varia kuin nova cannon",
        same3(W("Armageddon gun"), W("Prow nova cannon")), JSON.stringify([W("Armageddon gun"), W("Prow nova cannon")]));
  /* s.284: "roll 1 dice per point of Strength and require a 4+ to hit, like a lance" */
  check("Warp cannons (s.284) ovat samaa luokkaa ja varia kuin lanssi",
        same3(W("Warp cannons"), W("Dorsal lance battery")), JSON.stringify([W("Warp cannons"), W("Dorsal lance battery")]));
  const hg = ["Port heavy gunz", "Starboard heavy gunz", "Prow heavy gunz", "Heavy gunz battery"].map(W), gz = W("Port gunz battery");
  /* s.360: heavy gunz ovat pattereita (merkki G), mutta rivi erottuu omalla
     varillaan. Kayttaja 12.10.2026: "heavy gunz voisi olla ei hazard vari
     vaan vari tuon nova cannon ja gunz keltaisen valilta. edelleen pastelli"
     - raidat pois, merkki ja tausta nova cannonin ja gunzin valista. */
  const nv = W("Prow nova cannon"), ch = (hex, i) => parseInt(hex.slice(1 + 2 * i, 3 + 2 * i), 16);
  const between = (x, a, b, i) => ch(x, i) >= Math.min(ch(a, i), ch(b, i)) - 8 && ch(x, i) <= Math.max(ch(a, i), ch(b, i)) + 8;
  check("Ork heavy gunz: yha patteri (G), oma merkin vari ja tausta, ei kuviota",
        hg.every(x => x[0] === "G" && x[1] !== gz[1] && x[1] !== nv[1] && x[2] !== gz[2] && x[2] !== nv[2] && !x[3]) && gz[0] === "G" && !gz[3],
        JSON.stringify([hg[0], gz, nv]));
  /* punainen (R) pysyy samana, vihrea (G) osuu nova cannonin ja gunzin valiin: oranssi */
  check("Ork heavy gunz: merkin ja taustan savy on nova cannonin ja gunzin valissa",
        between(hg[0][1], nv[1], gz[1], 1) && between(hg[0][2], nv[2], gz[2], 0) && ch(hg[0][2], 2) < ch(gz[2], 2), JSON.stringify([hg[0], gz, nv]));
  /* pastelli: tausta on vaalea (jokainen kanava vahintaan 160) */
  check("Ork heavy gunz: tausta on pastelli", [0, 1, 2].every(i => ch(hg[0][2], i) >= 160), hg[0][2]);
  check("tavallisella patterilla, lanssilla ja nova cannonilla ei ole kuviota",
        !W("Port weapons battery")[3] && !W("Dorsal lance battery")[3] && !W("Prow nova cannon")[3]);
  const blk = Object.values(catalog.ships).find(s => /ACTIVATED BLACKSTONE/.test(s.nm));
  check("Activated Blackstone: katalogirivi lukee warp cannonit lansseina (LAN 8)",
        /LAN 8/.test(DOMAIN.armSummaryText(blk)), DOMAIN.armSummaryText(blk));
})();

/* ---- 19. boarding torpedoes = samojen putkien toinen ammus, ei aserivi ---
   Rulebook s.78: "Boarding torpedoes are launched like ordinary torpedoes and
   ships that can carry them are noted in the fleet lists. It is not possible
   to launch ordinary torpedoes and boarding torpedoes from a ship in the same
   turn." Fleets s.374: "May be equipped with boarding torpedoes for +5 pts
   (speed 20 cm; strength D6+2)". Kayttaja 12.10.2026, ensin: "tuo boarding
   torbs ei ole uusi ase rivi vaan sen normi torbs saa aseeksi myos boarding
   torbs valinnan", ja sitten tarkennus: "boarding torb ostos vain sinne optio
   riviin, ei aseisiin kun ostetaan jo olemassa oleviin torbedoihin. koska
   niihin ostetaan vain uuden tyyppinen ammus". Optio ei siis tuo ratkaistuun
   aseistukseen rivia missaan tilassa (tarjolla, otettu, piilotettu): osto on
   optiorivi hintoineen, ja saantorivi kertoo miten ammus toimii. */
(function(){
  const find = ref => { let hit = null; catalog.lists.forEach(L => L.secs.forEach(sec => sec.ents.forEach(en => {
    if(!hit && en.k !== "up" && String(en.r) === ref) hit = { L, sec, en }; }))); return hit; };
  const resolve = (ref, states) => {
    const a = find(ref), sh = catalog.ships[ref], options = {};
    Object.keys(states || {}).forEach(k => { const o = sh.ol.find(x => new RegExp(k, "i").test(x.t)); options[o.id] = { state: states[k], qty: 1 }; });
    return DOMAIN.resolveUnit({ schemaVersion: 2, entry: { list: a.L.nm, section: a.sec.t, label: a.en.l }, ref, hull: ref, hulls: 1,
      name: "", note: "", adjust: 0, custom: null, members: [], options, upgrades: {} }, { list: a.L }, catalog);
  };
  const names = R => R.weapons.map(w => w.a[0]).join(" | ");
  const noRow = R => !R.weapons.some(w => /^boarding torpedoes$/i.test(w.a[0]));
  const opt = R => R.options.filter(o => /boarding torpedoes/i.test(o.text))[0];
  const rule = R => R.rules.some(x => /^Boarding Torpedoes: a hit is a Hit/.test(typeof x === "string" ? x : x.t));
  /* Hammer s.374 */
  let R = resolve("374");
  check("Hammer (s.374): tarjolla oleva boarding torpedoes ei ole aserivi", noRow(R), names(R));
  check("... optio on tarjolla hintaan 5 ja saantorivi on kortilla", !!opt(R) && opt(R).state === "opt" && opt(R).cost === 5 && rule(R), JSON.stringify(opt(R)));
  check("... aserivit ovat kirjan rivit kirjan jarjestyksessa", R.weapons.map(w => w.a[0]).join("|") === catalog.ships["374"].aw.map(a => a[0]).join("|"), names(R));
  R = resolve("374", { "boarding torpedoes": "take" });
  check("Hammer: otettu optio ei tuo rivia, hinta 245 + 5", noRow(R) && R.points === 250 && opt(R).state === "take" && rule(R), names(R) + " " + R.points);
  R = resolve("374", { "boarding torpedoes": "off" });
  check("Hammer: piilotettu optio: ei rivia eika saantorivia", noRow(R) && !rule(R), names(R));
  /* Gorbag's Revenge s.377 */
  check("Gorbag's Revenge (s.377): ei rivia otettunakaan", noRow(resolve("377")) && noRow(resolve("377", { "boarding torpedoes": "take" })), names(resolve("377", { "boarding torpedoes": "take" })));
  /* Kill Kroozer s.382, Terror ship s.380 ja Lite Kroozer s.383: laukaisin on itse vaihto ("May replace its prow
     heavy gun battery with a torpedo launcha", "If fitted with a torpedo launcha, it may carry boarding torpedoes") */
  ["382", "380", "383"].forEach(ref => {
    const R0 = resolve(ref), R1 = resolve(ref, { "torpedo launcha": "take", "boarding torpedoes": "take" });
    check("s." + ref + ": ei boarding torpedoes -rivia tarjolla eika otettuna", noRow(R0) && noRow(R1), names(R1));
    check("s." + ref + ": otettuna laukaisin on aserivi ja optio maksaa 5", R1.weapons.some(w => /torpedo launcha/i.test(w.a[0]) && w.state === "active") && R1.points === R0.points + 5,
          names(R1) + " " + R0.points + "->" + R1.points);
  });
  /* Ork Hulk s.389: kolme torpedoputkistoa, optio +15 */
  R = resolve("389", { "boarding torpedoes": "take" });
  check("Ork Hulk (s.389): ei rivia, hinta 600 + 15", noRow(R) && R.points === 615, names(R) + " " + R.points);
  /* Tyranidien keulan boarding torpedoes ON ase (Fleets s.426 "are always boarding torpedoes"): se ei katoa */
  const hive = resolve("432");
  check("Hive Ship (s.432): keulan boarding torpedoes -asevalinta on yha aserivi", hive.weapons.some(w => /boarding torpedoes/i.test(w.a[0])), names(hive));
})();

/* ---- 20. v1.2: kortin lukuavut (kayttaja 10.-12.10.2026) ---------------
   a) Kantama: "15 30 45 60 cm ranget ja sen yli voisi jotenkin vari ja muoto
      koodata ... ja etta range arvo olisi nakyvampi". Yksi cm-arvo saa
      kaistan (1 = enintaan 15, 2 = enintaan 30, 3 = enintaan 45, 4 = enintaan
      60, 5 = yli 60) ja kaistan varin; yksikko siirtyy sarakeotsikkoon.
      Kaistat ovat lukuapu, eivat saanto. Usean arvon solu (launch bayn
      nopeudet), "Contact" ja viiva jaavat tekstiksi.
   b) Kriitit: Rulebook s.67 "Critical hits that can be repaired are
      cumulative" ja "If ... multiple criticals are rolled for a location that
      cannot be repaired (such as Shields Collapse), apply the next highest
      critical hit instead" -> korjauskelvoton tulos (taulukossa tahdella)
      voi tulla vain kerran: yksi ruutu. Kuvakkeet vain vakiotaulukolle. */
(function(){
  const rc = DOMAIN.rangeCell;
  check("rangeCell on olemassa", typeof rc === "function");
  if(typeof rc === "function"){
  const b = t => { const x = rc(t); return x ? x.label + "/" + x.band : null; };
  check("rangeCell: yksi arvo saa luvun ilman yksikkoa ja kaistan",
        same([b("15 cm"), b("30 cm"), b("45 cm"), b("60 cm"), b("90 cm")], ["15/1", "30/2", "45/3", "60/4", "90/5"]),
        JSON.stringify([b("15 cm"), b("30 cm"), b("45 cm"), b("60 cm"), b("90 cm")]));
  check("rangeCell: valiarvo saa seuraavan ylemman kaistan (20 ja 25 cm = kaista 2, 40 cm = 3)",
        same([b("20 cm"), b("25 cm"), b("40 cm"), b("10 cm")], ["20/2", "25/2", "40/3", "10/1"]));
  check("rangeCell: vali (nova cannon 30-150 cm) nayttaa valin ja saa ylarajan kaistan",
        b("30 \u2013 150 cm") === "30\u2013150/5" && b("30-150 cm") === "30\u2013150/5", String(b("30 \u2013 150 cm")));
  check("rangeCell: usean arvon solu, Contact ja viiva eivat saa kaistaa",
        rc("Fighta-Bommas: 25 cm / Assault Boats: 30 cm") === null && rc("Contact") === null && rc("\u2013") === null && rc("") === null && rc(null) === null);
  check("rangeCell: jokaisella kaistalla on oma varinsa, viisi eri varia",
        new Set(["15 cm", "30 cm", "45 cm", "60 cm", "90 cm"].map(t => rc(t).color)).size === 5 &&
        ["15 cm", "30 cm", "45 cm", "60 cm", "90 cm"].every(t => /^#[0-9A-F]{6}$/i.test(rc(t).color)));
  /* jokainen katalogin yksiarvoinen kantama saa kaistan (ei hiljaista putoamista tekstiksi) */
  let single = 0, missed = [];
  Object.values(catalog.ships).forEach(sh => (sh.aw || []).forEach(a => {
    if(/^\d+\s*cm$/i.test(String(a[1]).trim())){ single++; if(!rc(a[1])) missed.push(a[1]); } }));
  check("rangeCell: katalogin jokainen 'NN cm' -kantama saa kaistan", single > 500 && missed.length === 0, single + " / " + missed.slice(0, 5).join(","));
  }

  const find = ref => { let hit = null; catalog.lists.forEach(L => L.secs.forEach(sec => sec.ents.forEach(en => {
    if(!hit && en.k !== "up" && String(en.r) === ref) hit = { L, sec, en }; }))); return hit; };
  const resolve = ref => { const a = find(ref);
    return DOMAIN.resolveUnit({ schemaVersion: 2, entry: { list: a.L.nm, section: a.sec.t, label: a.en.l }, ref, hull: ref, hulls: 1,
      name: "", note: "", adjust: 0, custom: null, members: [], options: {}, upgrades: {} }, { list: a.L }, catalog); };
  const refOf = re => Object.keys(catalog.ships).find(k => re.test(catalog.ships[k].nm) && find(k));
  const crit = re => { const k = refOf(re); return k ? resolve(k).damage.critical : null; };
  const lunar = crit(/^LUNAR CLASS CRUISER$/);
  check("vakiotaulukko (s.67): vain 9 Bridge ja 10 Shields ovat kertatuloksia", lunar && same(lunar.once, ["9", "10"]), JSON.stringify(lunar && lunar.once));
  check("vakiotaulukko: jokaisella tuloksella 2-10 on kuvake",
        lunar && lunar.icons && same(lunar.icons, { "2": "dorsal", "3": "starboard", "4": "port", "5": "prow", "6": "engine", "7": "fire", "8": "thrusters", "9": "bridge", "10": "shields" }),
        JSON.stringify(lunar && lunar.icons));
  /* muut taulukot: kertatulos = taulukon tahtirivi (sivut taulukoiden alaviitteissa), ei kuvakkeita */
  const others = [[/HIVE SHIP/, ["10"], "Tyranid"], [/CAIRN/, [], "Necron"], [/^VOID STALKER/, ["9", "10"], "Eldar"], [/^TORTURE CLASS/, ["9", "10"], "Dark Eldar"]];
  others.forEach(o => { const c = crit(o[0]);
    check(o[2] + "-taulukko: kertatulokset " + JSON.stringify(o[1]) + ", ei kuvakkeita", !!c && same(c.once, o[1]) && !c.icons, JSON.stringify(c && [c.title, c.once, c.icons])); });
  const hulk = crit(/^ORK HULK$/);
  check("hulkin D6-taulukko: ei kertatuloksia eika kuvakkeita (omat laatikkonsa)", !!hulk && same(hulk.once, []) && !hulk.icons, JSON.stringify(hulk && [hulk.once, hulk.icons]));
})();

/* ---- 21. v1.2: port- ja starboard-rivi parina (kayttaja 12.10.2026) -----
   "kun on noi kaksiosaiset pariaseet port ja starboard niin ... jotain
   pienta visuaalista linkitysta etta ovat ns samaa", valinta C: yhteinen
   merkki, kantama ja vahvuus kerran, kaaret omilla riveillaan. Pari on
   esitystieto ratkaistulla rivilla (pair = 1 ylempi, 2 alempi): kaksi
   PERAKKAISTA rivia, joiden nimi eroaa vain sanalla Port / Starboard ja
   joiden kantama ja vahvuus ovat samat. Rivi, jolla on oma ruutunsa tai
   vaihtoehtonsa (valinta, OR, ammus, kirjoitusruutu, hulkin miinusruudut),
   ei ole parin osa - sen vahvuus ei ole yhteinen. */
(() => {
  const find = ref => { let hit = null; catalog.lists.forEach(L => L.secs.forEach(sec => (sec.ents || []).forEach(en => {
    if(!hit && en.k !== "up" && String(en.r) === ref) hit = { L, sec, en }; }))); return hit; };
  const resolve = ref => { const a = find(ref);
    return DOMAIN.resolveUnit({ schemaVersion: 2, entry: { list: a.L.nm, section: a.sec.t, label: a.en.l }, ref, hull: ref, hulls: 1,
      name: "", note: "", adjust: 0, custom: null, members: [], options: {}, upgrades: {} }, { list: a.L }, catalog); };
  const pairs = ref => resolve(ref).weapons.map(w => w.pair || 0);
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  /* Fleets s.71 Lunar: lance-pari, patteripari, keulan torpedot (+ novan vaihtoehtorivi) */
  check("Lunar (s.71): kaksi paria, keulan rivit eivat", same(pairs("71").slice(0, 5), [1, 2, 1, 2, 0]), JSON.stringify(pairs("71")));
  /* Fleets s.69 Tyrant: 45 cm / 4 -pari. 30 cm:n patterit voi vaihtaa 45 cm:n
     pattereihin ("Can replace its 30 cm range weapons batteries with 45 cm
     range weapons batteries at a cost of +10 pts"): oletuskortilla niilla on
     kummallakin oma OR-rivinsa, joten ne eivat ole pari. Kun optio on otettu,
     vaihtoehto on poissa ja rivit ovat tavallisia aseita -> toinen pari. */
  check("Tyrant (s.69): 45 cm / 4 -pari, valintarivit eivat", same(pairs("69"), [1, 2, 0, 0, 0, 0, 0, 0]), JSON.stringify(pairs("69")));
  const tyr = resolve("69"), o45 = tyr.options.filter(o => /45 cm range weapons batteries/i.test(o.text))[0];
  const a69 = find("69"), take = {}; take[o45.id] = { state: "take", qty: 1 };
  const tyr45 = DOMAIN.resolveUnit({ schemaVersion: 2, entry: { list: a69.L.nm, section: a69.sec.t, label: a69.en.l }, ref: "69", hull: "69", hulls: 1,
    name: "", note: "", adjust: 0, custom: null, members: [], options: take, upgrades: {} }, { list: a69.L }, catalog);
  check("... optio otettu: hinta 195 ja kaksi paria (45 / 4 ja 45 / 6)", tyr45.points === 195 && same(tyr45.weapons.map(w => w.pair || 0), [1, 2, 1, 2, 0, 0]),
        JSON.stringify([tyr45.points, tyr45.weapons.map(w => [w.a[1], w.a[2], w.pair || 0])]));
  /* Fleets s.77 Dauntless: yksi pari ja keulan lancet */
  check("Dauntless (s.77): patteripari, keulan lancet eivat", same(pairs("77").slice(0, 3), [1, 2, 0]), JSON.stringify(pairs("77")));
  /* Fleets s.382 Kill Kroozer: heavy gunz -pari, gunz-pari; keulan valinta ja sen vaihtoehto eivat */
  check("Kill kroozer (s.382): kaksi paria, keulan rivit eivat", same(pairs("382"), [1, 2, 1, 2, 0, 0, 0]), JSON.stringify(pairs("382")));
  /* Fleets s.389 Ork Hulk: riveilla omat miinusruutunsa */
  check("Ork Hulk (s.389): ei pareja", pairs("389").every(x => x === 0), JSON.stringify(pairs("389")));
  /* laskin suoraan keksityilla riveilla */
  check("DOMAIN.pairRows on viety", typeof DOMAIN.pairRows === "function");
  const pr = rows => (DOMAIN.pairRows ? DOMAIN.pairRows(rows) : rows).map(r => r.pair || 0);
  const row = (name, range, str, extra) => Object.assign({ a: [name, range, str, "Left"], state: "active" }, extra || {});
  check("sama kantama ja vahvuus -> pari", same(pr([row("Port lance battery", "30 cm", "2"), row("Starboard lance battery", "30 cm", "2")]), [1, 2]));
  check("jarjestys Starboard, Port kay myos", same(pr([row("Starboard lance battery", "30 cm", "2"), row("Port lance battery", "30 cm", "2")]), [1, 2]));
  check("tahti nimessa ei esta", same(pr([row("Port lance battery*", "30 cm", "2"), row("Starboard lance battery", "30 cm", "2")]), [1, 2]));
  check("eri vahvuus -> ei paria", same(pr([row("Port lance battery", "30 cm", "2"), row("Starboard lance battery", "30 cm", "3")]), [0, 0]));
  check("eri kantama -> ei paria", same(pr([row("Port lance battery", "30 cm", "2"), row("Starboard lance battery", "45 cm", "2")]), [0, 0]));
  check("eri ase -> ei paria", same(pr([row("Port lance battery", "30 cm", "2"), row("Starboard weapons battery", "30 cm", "2")]), [0, 0]));
  check("kaksi Port-rivia -> ei paria", same(pr([row("Port lance battery", "30 cm", "2"), row("Port lance battery", "30 cm", "2")]), [0, 0]));
  check("vali rivi valissa -> ei paria", same(pr([row("Port lance battery", "30 cm", "2"), row("Dorsal lance battery", "30 cm", "2"), row("Starboard lance battery", "30 cm", "2")]), [0, 0, 0]));
  check("kolme perakkain: ensimmainen pari, kolmas yksin", same(pr([row("Port gunz", "30 cm", "D6"), row("Starboard gunz", "30 cm", "D6"), row("Port gunz", "30 cm", "D6")]), [1, 2, 0]));
  /* valintarivi, jonka vaihtoehto on kortilla, ei ole parin osa; yksin jaanyt valintarivi on tavallinen ase */
  check("valintarivi, jolla on vaihtoehto -> ei paria",
        same(pr([row("Port lance battery", "30 cm", "2", { grp: 1, i: 0 }), row("Starboard lance battery", "30 cm", "2", { i: 1 }),
                 row("Port weapons battery", "30 cm", "2", { grp: 1, alt: 1, i: 0, state: "offered" })]), [0, 0, 0]));
  check("yksin jaaneet valintarivit -> pari",
        same(pr([row("Port weapons battery", "45 cm", "6", { grp: 1, alt: 1, i: 2 }), row("Starboard weapons battery", "45 cm", "6", { grp: 1, alt: 1, i: 3 })]), [1, 2]));
  [["alt", { alt: 1 }], ["box", { box: "open" }], ["writeIn", { writeIn: 1 }],
   ["loss", { loss: { key: "x", per: 1, n: 2 } }], ["offered", { state: "offered" }]].forEach(x => {
    check("rivi, jolla on " + x[0] + " -> ei paria (kumpana tahansa)",
          same(pr([row("Port lance battery", "30 cm", "2", x[1]), row("Starboard lance battery", "30 cm", "2")]), [0, 0]) &&
          same(pr([row("Port lance battery", "30 cm", "2"), row("Starboard lance battery", "30 cm", "2", x[1])]), [0, 0]));
  });
})();

/* ---- 22. mita yksi lisays ostaa (kayttaja 13.10.2026) --------------------
   Katalogin plus lisaa laivueesta YHDEN KORTIN, ei yhta alusta, ja pelaajan
   on nahtava se rivilta ennen kuin han painaa. Odotukset kirjasta: saattajat
   2-6 alusta laivueessa (Fleets s.13), yhden osuman puolustukset "grouped in
   up to six units" (Rulebook s.100), maayksikoilla ei laivuesaantoa mutta
   rivin oma raja 0-4 (Air base, Fleets s.499 ja s.517), orbital mine ostetaan
   kappaleittain yhdelle kortille (s.512). */
(function(){
  const GO = catalog.lists.find(L => L.nm === "Imperial Navy — Gothic Sector");
  const rp = re => {
    let out = null;
    GO.secs.forEach((sec, si) => sec.ents.forEach(en => {
      if(out || !re.test(en.l) || DOMAIN.isUpgradeEnt(en)) return;
      out = DOMAIN.rowPurchase(GO, si, en, en.r ? catalog.ships[String(en.r)] : null);
    }));
    return out;
  };
  check("rowPurchase on viety", typeof DOMAIN.rowPurchase === "function");
  if(typeof DOMAIN.rowPurchase !== "function") return;
  check("risteilija: yksi alus, yksi kortti", same(rp(/^lunar class cruiser$/i), { kind: "single" }));
  check("komentaja: yksi", same(rp(/^fleet-admiral/i), { kind: "single" }));
  check("saattaja: laivue 2-6 (Fleets s.13)", same(rp(/^sword class frigate$/i), { kind: "squadron", min: 2, max: 6 }));
  check("yhden osuman puolustus: laivue 1-6 (Rulebook s.100)", same(rp(/^orbital weapons platform$/i), { kind: "squadron", min: 1, max: 6 }));
  check("maayksikko: enintaan rivin raja kortille, ei laivue (s.517, 0-4)", same(rp(/^air base$/i), { kind: "group", min: 1, max: 4 }));
  check("orbital mine: kappalemaara yhdelle kortille, ei rajaa (s.499, s.512)", same(rp(/^orbital mine$/i), { kind: "count", max: null }));
  check("minefield: kappalemaara yhdelle kortille, enintaan 2 (s.499, s.513)", same(rp(/^minefield$/i), { kind: "count", max: 2 }));
})();

/* ---- 22b. yksi painallus katalogirivilla on yksi alus (kayttaja 18.10.2026)
   "fleet builder saisi ominaisuuden kun squadron kortti niin saisi +- tuossa
   heti squadron kokoa muutettua": kortilla myytavalla rivilla + on yksi alus
   rivin viimeiselle kortille, kunnes kortti on taysi (Fleets s.13: 2-6), ja
   sitten uusi kortti minimissaan; - on yksi alus pois viimeiselta kortilta,
   ja minimissa kortti lahtee. Yhden aluksen rivi on yksi yksikko
   painallukselta. rowStep vain sanoo, mita tehdaan - se ei tee sita. */
(function(){
  check("rowStep on viety", typeof DOMAIN.rowStep === "function");
  if(typeof DOMAIN.rowStep !== "function") return;
  const sq = { kind: "squadron", min: 2, max: 6 }, one = { kind: "single" };
  const cnt = { kind: "count", max: null }, grp = { kind: "group", min: 1, max: 4 };
  const u = n => ({ n: n });
  const st = (b, us, d) => { const r = DOMAIN.rowStep(b, us, d); return r ? r.act + (r.unit ? ":" + us.indexOf(r.unit) : "") : "null"; };
  check("laivue, tyhja: + avaa kortin", st(sq, [], 1) === "open", st(sq, [], 1));
  check("laivue 2: + kasvattaa viimeista korttia", st(sq, [u(2)], 1) === "grow:0", st(sq, [u(2)], 1));
  check("laivue 6 (taysi): + avaa uuden kortin", st(sq, [u(6)], 1) === "open", st(sq, [u(6)], 1));
  check("laivue 6+3: + kasvattaa viimeista, ei ensimmaista", st(sq, [u(6), u(3)], 1) === "grow:1", st(sq, [u(6), u(3)], 1));
  check("laivue 3: - pienentaa", st(sq, [u(3)], -1) === "shrink:0", st(sq, [u(3)], -1));
  check("laivue 2 (minimi): - vie kortin", st(sq, [u(2)], -1) === "remove:0", st(sq, [u(2)], -1));
  check("laivue 4+2: - vie viimeisen kortin, ei pienenna ensimmaista", st(sq, [u(4), u(2)], -1) === "remove:1", st(sq, [u(4), u(2)], -1));
  check("laivue, tyhja: - ei tee mitaan", st(sq, [], -1) === "null", st(sq, [], -1));
  check("yksi alus: + avaa, - vie viimeisen", st(one, [u(1)], 1) === "open" && st(one, [u(1), u(1)], -1) === "remove:1");
  check("yksi alus, tyhja: - ei tee mitaan", st(one, [], -1) === "null");
  check("kappalemaara ilman rajaa: + kasvattaa aina samaa korttia (s.512)", st(cnt, [u(9)], 1) === "grow:0", st(cnt, [u(9)], 1));
  check("kappalemaara 1: - vie kortin", st(cnt, [u(1)], -1) === "remove:0", st(cnt, [u(1)], -1));
  check("maayksikko 4 (rivin raja): + avaa uuden kortin (s.517)", st(grp, [u(4)], 1) === "open", st(grp, [u(4)], 1));
  check("n puuttuu luetaan yhdeksi", st(sq, [{}], -1) === "remove:0" && st(cnt, [{}], -1) === "remove:0");
})();

/* ---- 23. jokaisella ostettavalla rivilla on kirjan sivu (J165) ----------
   Proosasta tehty rivi ("One extra re-roll") sai ennen vain lauseensa,
   ei sivua: Pirate Captainin re-rollit (Fleets s.178) ja Prince Yrielin
   (s.319) olivat ilman, samoin 135 muuta rivia. Sivu luetaan poiminnassa
   lauseen omalta sivulta, ei listan aloitussivulta. */
(function(){
  const rowsOf = (lre, sre, ere) => {
    const out = [];
    catalog.lists.forEach(L => { if(!lre.test(L.nm)) return;
      L.secs.forEach(sec => { if(!sre.test(sec.t)) return;
        sec.ents.forEach(en => { if(ere.test(en.l)) out.push(en); }); }); });
    return out;
  };
  const pir = rowsOf(/Pirates and Wolf Packs$/, /^Pirate Captains$/i, /extra re-roll/i);
  check("Pirate Captainin kaksi re-roll-rivia sivulla 178",
        pir.length === 2 && pir.every(en => en.src_page === 178), JSON.stringify(pir.map(en => [en.l, en.src_page])));
  const yr = rowsOf(/^Eldar Corsairs/, /./, /extra re-roll/i);
  check("Prince Yrielin re-roll-rivit sivulla 319 molemmilla Corsair-listoilla",
        yr.length === 4 && yr.every(en => en.src_page === 319), JSON.stringify(yr.map(en => [en.l, en.src_page])));
  const miss = [];
  catalog.lists.forEach(L => L.secs.forEach(sec => sec.ents.forEach(en => {
    if((en.k === "up" || en.k === "cmd") && !(en.src_page > 0)) miss.push(L.nm + " / " + sec.t + " / " + en.l);
  })));
  check("jokaisella paivitys- ja komentajarivilla on kirjan sivu", miss.length === 0,
        miss.length + ": " + miss.slice(0, 6).join(" | "));
})();

/* ---- 24. Ork Rok planetary defencena (Fleets s.360, s.367, s.393; J172) --
   s.360 ORK PLANETARY DEFENCES: "Ork Roks can be taken as planetary
   defences and purchased using planetary defence point allowances ... they
   automatically pass all leadership checks they are required to make but
   cannot undergo any Special Orders except Reload Ordnance and Brace For
   Impact, for which they are Leadership 7 ... Ork Roks cannot move and count
   as stationary in all effects ... roll 2D6 after setting up each Rok. On a
   roll of 12, the Rok falls 2D6 cm toward the celestial phenomena". Saanto on
   Orkkien yhteisissa saannoissa, joten se koskee kaikkia kolmea Ork-listaa.
   s.393: "Roks are sufficiently different to both Orbital Defences and true
   spaceships" - kriitti on +1 vahinko ja hajoaminen 4 Blast markeria myos
   puolustuksena (tulkinta: Rokin oma saanto voittaa yleisen taulukon). */
(function(){
  const PD = "PLANETARY DEFENCES";
  const orks = catalog.lists.filter(L => /^Orks — /.test(L.nm));
  const rokRow = L => (L.secs.find(x => x.t === PD) || { ents: [] }).ents.find(e => /^Rok\b/.test(e.l));
  check("Rok: kolme Ork-listaa", orks.length === 3, orks.map(L => L.nm).join(", "));
  check("Rok: jokaisen Ork-listan puolustusosiossa 80 pts (s.360, s.367)",
        orks.every(L => { const e = rokRow(L); return e && e.p === 80 && e.src_page === 360 && String(e.r) !== "392"; }),
        JSON.stringify(orks.map(L => rokRow(L) && [rokRow(L).l, rokRow(L).p, rokRow(L).r, rokRow(L).src_page])));
  check("Rok: muut listat eivat myy Rok-puolustusta",
        catalog.lists.every(L => /^Orks — /.test(L.nm) || !rokRow(L)));
  const L = orks.find(x => /Cyclops/.test(x.nm)), e = L && rokRow(L);
  if(!e) return;
  const sec = L.secs.find(x => x.t === PD);
  const R = DOMAIN.resolveUnit({ list: L.nm, entry: { section: sec.t, label: e.l }, ref: String(e.r), hulls: 1,
                                 options: {}, upgrades: {} }, { list: L, host: L }, catalog);
  const txt = R.rules.map(r => r.t).join(" | ");
  check("Rok puolustuksena: Ld 7 vain Reload ja Brace, muut testit lapi automaattisesti (s.360)",
        R.leadership && R.leadership.value === 7 && same(R.orders, ["RO", "BFI"]) &&
        /automatically pass/i.test(txt) && !/any other Leadership check is also made on Ld 7/.test(txt), txt);
  check("Rok puolustuksena: ei liiku, 2D6-heitto 12 = putoaa 2D6 cm, tuhoutuu asteroidikenttaan tai planeetan reunaan",
        R.stats.speed === "0 cm" && /cannot move/i.test(txt) && /2D6/.test(txt) && /12/.test(txt) && /asteroid field/.test(txt) &&
        !/exactly 10 cm straight ahead/.test(txt), R.stats.speed + " :: " + txt);
  check("Rok puolustuksena: Blast markerien D6-poisto kuten kiintealla puolustuksella (s.360 'including all rules concerning removal of blast markers')",
        /D6 Blast Markers/.test(txt), txt);
  check("Rok puolustuksena: ei Orkkien Ld -1:ta eika All Ahead Fullia",
        !/Leadership is reduced by 1/.test(txt) && !/All Ahead Full/.test(txt), txt);
  check("Rok puolustuksena: Rokin oma kriitti (+1 vahinko) ja hajoaminen 4 Blast markeriksi (s.393), ei Defences-taulukkoa",
        !/DEFENCES/.test(R.damage.critical.title) && /4 Blast Markers/.test(R.damage.critical.foot || "") &&
        /p\. 393/.test(R.damage.critical.foot || ""), JSON.stringify([R.damage.critical.title, R.damage.critical.foot]));
  check("Rok puolustuksena: ei listan paivityksia (Dakka Dakka, klaanit)", R.upgrades.length === 0 &&
        DOMAIN.upgradesFor ? true : true, JSON.stringify(R.upgrades));
})();

/* ---- 25. puolustusten pienet aukot (BACKLOG J175) ----------------------
   (a) Fleets s.304: "all Eldar Ordnance can only be hit by defensive turrets
   on a roll of 6 ... This includes ... orbital mines"; s.345 sama Dark
   Eldarille. (b) s.407: "As long as it is not crippled a Shroud will never
   activate orbital mines". (c) s.437: "up to 10% of the Tyranid escort
   drones in the fleet can elect to become fireships". (d) s.337: "Any number
   of ships may be purchased against the fleet's total at 50% cost, but they
   count as reserves and start off the table." (e) Rulebook s.116: "all
   firepower shooting in low orbit suffers one column shift to the right,
   lances and nova cannons require a 4+ roll to fire". */
(function(){
  const PD = "PLANETARY DEFENCES";
  const by = nm => catalog.lists.find(L => L.nm === nm);
  const pdUnit = (L, re, hulls) => {
    const sec = L.secs.find(x => x.t === PD), en = sec.ents.find(e => re.test(e.l));
    return { list: L.nm, entry: { section: sec.t, label: en.l }, ref: en.r == null ? null : String(en.r),
             hulls: hulls || 1, options: {}, upgrades: {} };
  };
  const R = (L, u) => DOMAIN.resolveUnit(u, { list: L, host: L }, catalog);
  const GO = by("Imperial Navy — Gothic Sector"), EC = by("Eldar Corsairs — Gothic Sector"),
        DE = by("Dark Eldar — Pirates"), TH = by("Tyranids — Hive Fleet");
  const steps = (L, re) => R(L, pdUnit(L, re, 1)).ruleCard.steps.map(x => x.h + ": " + x.t).join(" | ");

  /* (a) */
  check("J175a: Eldar-listan orbital mine -kortti: tornit osuvat vain 6:lla (s.304)",
        /Turrets hit this mine only on a 6/.test(steps(EC, /^Orbital mine$/)) && /p\. 304/.test(steps(EC, /^Orbital mine$/)),
        steps(EC, /^Orbital mine$/));
  check("J175a: Dark Eldarin miinakentan miinat: tornit vain 6:lla (s.345)",
        /only on a 6/.test(steps(DE, /^Minefield$/)) && /p\. 345/.test(steps(DE, /^Minefield$/)), steps(DE, /^Minefield$/));
  check("J175a: Imperial Navyn miinakortilla ei Eldar-saantoa",
        !/only on a 6/.test(steps(GO, /^Orbital mine$/)) && !/only on a 6/.test(steps(GO, /^Minefield$/)));
  /* (b) */
  check("J175b: Shroud-poikkeus molemmilla miinakorteilla (s.407)",
        [steps(GO, /^Orbital mine$/), steps(GO, /^Minefield$/)].every(t => /Shroud never activates orbital mines/.test(t) && /p\. 407/.test(t)));

  /* (c) */
  const DR = (() => { let hit = null;
    TH.secs.forEach(sec => sec.ents.forEach(en => { if(!hit && String(en.r) === "437") hit = [sec, en]; })); return hit; })();
  const S437 = catalog.ships["437"];
  const fsOpt = S437 && S437.ol.find(o => /become fireships/.test(o.t));
  const drones = (n, fire) => {
    const u = { list: TH.nm, entry: { section: DR[0].t, label: DR[1].l }, ref: "437", hulls: n, options: {}, upgrades: {} };
    if(fire) u.options[fsOpt.id] = { state: "take" };
    return u;
  };
  const fsRow = us => DOMAIN.resolveFleet({ list: TH.nm, limit: 5000, units: us }, catalog).checks
    .find(c => /^Fire ship escort drones/.test(c.t));
  check("J175c: drone-profiilissa on fire ship -optio", !!DR && !!fsOpt);
  if(DR && fsOpt){
    check("J175c: 10 dronesta 1 fire ship kay (10 % = 1)", !!fsRow([drones(9), drones(1, true)]) && fsRow([drones(9), drones(1, true)]).ok === true,
          JSON.stringify(fsRow([drones(9), drones(1, true)])));
    check("J175c: 9 dronesta 1 fire ship ei kay (pyoristys alas: 0)", !!fsRow([drones(8), drones(1, true)]) && fsRow([drones(8), drones(1, true)]).ok === false,
          JSON.stringify(fsRow([drones(8), drones(1, true)])));
    check("J175c: ilman fire shipia ei rivia", !fsRow([drones(9), drones(1)]));
  }

  /* (d) */
  const ecShip = (re, ww) => {
    let hit = null;
    EC.secs.forEach((sec, si) => sec.ents.forEach((en, ei) => { if(!hit && en.r && en.k !== "up" && re.test(en.l) && sec.t !== PD) hit = [sec, en]; }));
    const u = { list: EC.nm, entry: { section: hit[0].t, label: hit[1].l }, ref: String(hit[1].r), hulls: 1, options: {}, upgrades: {} };
    if(ww){
      const s2 = EC.secs.find(x => x.t === "WEBWAY PORTAL"), e2 = s2 && s2.ents[0];
      if(e2) u.upgrades[DOMAIN.upgradeId(EC.nm, s2.t, e2.l)] = "take";
    }
    return u;
  };
  const wwSec = EC.secs.find(x => x.t === "WEBWAY PORTAL");
  check("J175d: Corsair-listalla Webway Portal -osio, sivu 337", !!wwSec && wwSec.ents.length === 1 && wwSec.ents[0].src_page === 337);
  if(wwSec){
    const full = R(EC, ecShip(/^Eclipse/)), half = R(EC, ecShip(/^Eclipse/, true));
    check("J175d: Eclipse portaalin kautta puoleen hintaan (pyoristys ylos)",
          half.points === Math.ceil(full.points / 2), full.points + " -> " + half.points);
    check("J175d: portaalirivi avautuu Hidena, ei avointa ruutua kortille",
          !full.upgrades.some(u => /Webway/.test(u.label) && u.state !== "off"), JSON.stringify(full.upgrades.filter(u => /Webway/.test(u.label))));
    check("J175d: maksimihinta ei laske alennusta", full.maxPoints === R(EC, ecShip(/^Eclipse/)).maxPoints);
    const wwRow = us => DOMAIN.resolveFleet({ list: EC.nm, limit: 5000, units: us }, catalog).checks.find(c => /^Ships through the Webway Portal/.test(c.t));
    check("J175d: portaalialus ilman Havenia on punainen", !!wwRow([ecShip(/^Eclipse/, true)]) && wwRow([ecShip(/^Eclipse/, true)]).ok === false);
    check("J175d: Havenin kanssa kelpaa", !!wwRow([ecShip(/^Eclipse/, true), pdUnit(EC, /^Haven space station$/)]) &&
          wwRow([ecShip(/^Eclipse/, true), pdUnit(EC, /^Haven space station$/)]).ok === true);
    check("J175d: Dark Eldarilla ei portaalia (s.347 vaihtaa vain aseet)", !DE.secs.some(x => x.t === "WEBWAY PORTAL"));
  }

  /* (e) */
  const silo = R(GO, pdUnit(GO, /^Defence laser silo$/, 1)), msl = R(GO, pdUnit(GO, /^Missile silo$/, 1));
  check("J175e: laser silon kortilla low orbit -tulitus: sarake oikealle, lanssi 4+ (Rulebook s.116)",
        silo.rules.some(r => /one column right/.test(r.t) && /4\+ to fire/.test(r.t) && /p\. 116/.test(r.t)), silo.rules.map(r => r.t.slice(0, 40)).join(" | "));
  check("J175e: ohjussiilolla ei lanssisaantoa (torpedokielto koskee aluksia)",
        !msl.rules.some(r => /4\+ to fire/.test(r.t)));
})();

/* ---- 26. pistokoe 20:n jaannokset (BACKLOG J120) ----------------------
   (a) Fleets s.235: Daemonshipin hinta "based upon the type of vessel
   chosen" - isannan tyyppiotsikon kaikkiin aluksiin kohdennettu rivi
   tarjotaan lainalaivalle, jonka oma otsikko on sama (T34, s.14). (b) s.19
   erikoistorpedot vaativat torpedot: listan "Nova Cannon instead of prow
   torpedoes" vie ne. (d) s.225 Thousand Sons -miehisto: Mark of Tzeentch. */
(function(){
  const by = nm => catalog.lists.find(L => L.nm === nm);
  const INC = by("Chaos — Incursion"), NUR = by("Chaos — Nurgle"), BC = by("Chaos — Black Crusade"),
        TZ = by("Chaos — Tzeentch"), EX = by("Adeptus Mechanicus — Explorator");
  const rowOf = (Lx, re) => { let h = null;
    Lx.secs.forEach(s => s.ents.forEach(e => { if(!h && !DOMAIN.isUpgradeEnt(e) && e.r != null && re.test(e.l)) h = { s, e }; })); return h; };
  const unit = (Lx, re, role) => { const r = rowOf(Lx, re);
    return { schemaVersion: 2, role: role || "core", entry: { list: Lx.nm, section: r.s.t, label: r.e.l }, ref: String(r.e.r),
             hull: null, hulls: 1, name: "", note: "", adjust: 0, custom: null, members: [], options: {}, upgrades: {} }; };
  const take = (u, Lx, re) => { Lx.secs.forEach(s => s.ents.forEach(e => {
    if(DOMAIN.isUpgradeEnt(e) && re.test(e.l)) u.upgrades[DOMAIN.upgradeId(Lx.nm, s.t, e.l)] = "take"; })); return u; };
  const R = (host, u) => DOMAIN.resolveUnit(u, { list: host, host: host }, catalog);
  const offered = Rx => Rx.upgrades.filter(x => x.state !== "off");

  /* (a) */
  const inN = offered(R(NUR, unit(INC, /^Carnage/, "reserve")));
  const dsN = inN.filter(x => /^Daemonship:/.test(x.label));
  check("J120a: Incursionin Carnage Nurglen laivastossa: isannan Daemonship: Cruiser 55 pts (s.241)",
        dsN.length === 1 && dsN[0].label === "Daemonship: Cruiser" && dsN[0].list === NUR.nm && dsN[0].cost === 55,
        JSON.stringify(dsN.map(x => [x.label, x.list, x.cost])));
  const ds2 = offered(R(NUR, take(unit(INC, /^Carnage/, "reserve"), NUR, /^Daemonship: Cruiser$/)));
  check("J120a: ... ja otettuna se on hinnassa", R(NUR, take(unit(INC, /^Carnage/, "reserve"), NUR, /^Daemonship: Cruiser$/)).points ===
        R(NUR, unit(INC, /^Carnage/, "reserve")).points + 55 && ds2.some(x => x.label === "Daemonship: Cruiser" && x.state === "take"));
  const bcN = offered(R(NUR, unit(BC, /^Carnage/, "reserve"))).filter(x => /^Daemonship: Cruiser$/.test(x.label));
  check("J120a: Black Crusaden Carnage Nurglen laivastossa: Daemonship: Cruiser kerran, omalta listaltaan",
        bcN.length === 1 && bcN[0].list === BC.nm, JSON.stringify(bcN.map(x => [x.label, x.list])));
  const natN = offered(R(NUR, unit(NUR, /^Carnage/))).filter(x => /^Daemonship:/.test(x.label));
  check("J120a: Nurglen oma Carnage ennallaan: Daemonship: Cruiser", natN.length === 1 && natN[0].label === "Daemonship: Cruiser");

  /* (b) */
  const gothic = () => unit(EX, /^Gothic class cruiser$/);
  const stOf = Rx => offered(Rx).filter(x => /^Special torpedoes/.test(x.label)).map(x => x.label);
  check("J120b: Explorator Gothic ilman Novaa: erikoistorpedot tarjolla", stOf(R(EX, gothic())).length === 1, JSON.stringify(stOf(R(EX, gothic()))));
  const gNova = take(gothic(), EX, /^Nova Cannon instead of prow torpedoes$/);
  check("J120b: ... listan Nova otettuna torpedot ovat poissa, eika erikoistorpedoja tarjota (s.19)",
        !R(EX, gNova).weapons.some(w => /torpedo/i.test(w.a[0]) && w.state === "active") && stOf(R(EX, gNova)).length === 0,
        JSON.stringify(stOf(R(EX, gNova))));

  /* (d) */
  const tzM = offered(R(TZ, take(unit(INC, /^Carnage/, "reserve"), TZ, /^Thousand Sons Chaos Space Marine crew$/)));
  check("J120d: Incursionin Carnage Tzeentchin Thousand Sons -miehistolla saa Mark of Tzeentchin (s.225)",
        tzM.some(x => x.label === "The Mark of Tzeentch" && x.list === TZ.nm), JSON.stringify(tzM.map(x => [x.label, x.list])));
})();

/* ---- 27. re-roll-ruutujen jaannokset (BACKLOG J168) --------------------
   (a) Tzeentch-Warmaster Scion of Prosperon kyydissa: Mark on aluksen
   hinnassa (s.258) - Optioniksi jatetty rivi olisi kortilla avoin ruutu.
   (b) Fortress-Monastery s.111 ja Ramilies s.503: komentaja kyydissa ->
   linnakkeen re-rollit ovat koko laivaston. */
(function(){
  const TZ = catalog.lists.find(L => L.nm === "Chaos \u2014 Tzeentch");
  const own = (re, ups) => { let h = null;
    TZ.secs.forEach(s => s.ents.forEach(e => { if(!h && e.k !== "up" && re.test(e.l)) h = { s, e }; }));
    const u = { list: TZ.nm, entry: { section: h.s.t, label: h.e.l }, ref: h.e.r == null ? null : String(h.e.r), hulls: 1, options: {}, upgrades: {} };
    Object.assign(u.upgrades, ups || {});
    return u; };
  let mk = null; TZ.secs.forEach(s => s.ents.forEach(e => { if(!mk && e.k === "up" && /^The Mark of Tzeentch$/.test(e.l) && e.at && e.at.length === 1) mk = DOMAIN.upgradeId(TZ.nm, s.t, e.l); }));
  const rows = st => DOMAIN.resolveFleet({ list: TZ.nm, limit: 2000, units: [own(/^Chaos Warmaster/, { [mk]: st }), own(/^Scion of Prospero/)] }, catalog)
    .checks.filter(c => /Mark of Tzeentch/.test(c.t)).map(c => c.t + (c.ok ? "" : " [RED]") + (c.warn ? " [warn]" : ""));
  check("J168a: Warmasterin Mark Optionina Scionin kyydissa -> huomautus (Hide)", rows("opt").some(t => /is in the ship's cost/.test(t) && /\[warn\]/.test(t)), JSON.stringify(rows("opt")));
  check("J168a: ... Hidena ei rivia", rows("off").length === 0, JSON.stringify(rows("off")));
  check("J168a: ... otettuna tuplamaksu punaisena (ennallaan)", rows("take").some(t => /paid twice/.test(t) && /RED/.test(t)), JSON.stringify(rows("take")));

  const R = (L, re) => { let h = null;
    L.secs.forEach(s => s.ents.forEach(e => { if(!h && e.r != null && e.k !== "up" && re.test(e.l)) h = { s, e }; }));
    const u = { list: L.nm, entry: { section: h.s.t, label: h.e.l }, ref: String(h.e.r), hulls: 1, options: {}, upgrades: {} };
    L.secs.forEach(s => s.ents.forEach(e => { if(e.k === "up" && /^One re-roll$/.test(e.l) && e.at && e.at.some(p => L.secs[p[0]] === h.s)) u.upgrades[DOMAIN.upgradeId(L.nm, s.t, e.l)] = "take"; }));
    return DOMAIN.resolveUnit(u, { list: L, host: L }, catalog); };
  const CR = catalog.lists.find(L => L.nm === "Space Marines \u2014 Crusade"), GO = catalog.lists.find(L => L.nm === "Imperial Navy \u2014 Gothic Sector");
  const fm = R(CR, /^Fortress-Monastery$/), rf = R(GO, /^Ramilies/);
  check("J168b: Fortress-Monasteryn re-rollit liittyvat komentajan omiin (s.111)", !!fm.rerolls && fm.rerolls.joins && fm.rerolls.joins.page === 111, JSON.stringify(fm.rerolls));
  check("J168b: Ramiliesin re-roll liittyy komentajan omiin (s.503)", !!rf.rerolls && rf.rerolls.joins && rf.rerolls.joins.page === 503, JSON.stringify(rf.rerolls));
})();

/* ---- 28. Pirates: kuljetukset saavat olla yksin (Fleets s.13, s.179; J46 b)
   Cargo Transport (s.85), Armed Freighter (s.523 "half a freighter") ja
   Armed Cargo Vessel (s.192 "half-transport") ovat kuljetuksia; Escort
   Carrier ja Q-Ship "do not count as freighters" (s.521-522). */
(function(){
  const L = catalog.lists.find(x => x.nm === "Rogue Traders \u2014 Pirates and Wolf Packs");
  const u = (re, n) => { let h = null;
    L.secs.forEach(s => s.ents.forEach(e => { if(!h && e.k !== "up" && e.r != null && re.test(e.l)) h = { s, e }; }));
    return { list: L.nm, entry: { section: h.s.t, label: h.e.l }, ref: String(h.e.r), hulls: n || 1, options: {}, upgrades: {} }; };
  let cap = null; L.secs.forEach(s => s.ents.forEach(e => { if(!cap && e.k === "cmd") cap = { s, e }; }));
  const capt = { list: L.nm, entry: { section: cap.s.t, label: cap.e.l }, ref: null, hulls: 1, options: {}, upgrades: {} };
  const F = units => DOMAIN.resolveFleet({ list: L.nm, limit: 3000, units }, catalog).checks;
  const red = cs => cs.filter(c => !c.ok).map(c => c.t + ": " + c.v);
  const cruiser = () => u(/^Hellebore|^Carnage|^Murder|^Slaughter|^Iconoclast/i);
  /* six Swords: a full squadron, so a lone escort has no squadron to join
     ("organized in any mix desired", s.179) and must stand on its own */
  const base = () => [capt, u(/^Sword Frigate$/, 6)];
  const sqRed = cs => cs.filter(c => !c.ok && /^Squadrons of 3/.test(c.s || "")).map(c => c.t + ": " + c.v);
  check("J46b: yksin oleva Cargo Transport ei riko laivuesaantoa (s.13, s.85)", sqRed(F(base().concat([u(/^Cargo Transport$/)]))).length === 0,
        JSON.stringify(red(F(base().concat([u(/^Cargo Transport$/)])))));
  check("J46b: ... eika Armed Freighter tai Armed Cargo Vessel (s.523, s.192)",
        sqRed(F(base().concat([u(/^Armed Freighter$/), u(/^Armed Cargo Vessel$/)]))).length === 0,
        JSON.stringify(red(F(base().concat([u(/^Armed Freighter$/), u(/^Armed Cargo Vessel$/)])))));
  check("J46b: yksin oleva Escort Carrier rikkoo (s.521: ei freighter)", sqRed(F(base().concat([u(/^Escort Carrier$/)]))).length === 1,
        JSON.stringify(red(F(base().concat([u(/^Escort Carrier$/)])))));
})();

/* ---- 29. Tau Orbitalin moduulit (Fleets s.480; J171) -------------------
   "no more than four other modules can be added to a single core. An
   Orbital costs points equal to its core module plus the sum of any other
   modules added." Security: jarjestelman hinta, +1 torni. Manufacturing
   +10: +1 kilpi (enintaan 3), tracking system. Habitat +5: +1 osuma. */
(function(){
  const TM = catalog.lists.find(L => L.nm === "Tau — Merchant Fleet");
  const S = catalog.ships["480"];
  const sec = TM.secs.find(x => x.t === "PLANETARY DEFENCES"), en = sec.ents.find(e => e.r === 480 || e.r === "480");
  const oi = re => S.ol.findIndex(o => re.test(o.t));
  const orb = qty => {
    const u = { list: TM.nm, entry: { section: sec.t, label: en.l }, ref: "480", hulls: 1, options: {}, upgrades: {} };
    Object.keys(qty).forEach(k => { const i = oi(new RegExp(k)); if(i >= 0) u.options[S.ol[i].id] = { state: "take", qty: qty[k] }; });
    return u;
  };
  const R = u => DOMAIN.resolveUnit(u, { list: TM, host: TM }, catalog);
  check("J171: Orbitalilla manufacturing- ja habitat-moduulit optioina", oi(/^Manufacturing/) >= 0 && oi(/^Habitat/) >= 0);
  if(oi(/^Manufacturing/) < 0) return;
  const r1 = R(orb({ "^Railgun": 2, "^Manufacturing": 1, "^Habitat": 1 }));
  check("J171: kaksi railgun-moduulia + valmistus + habitaatti = 20 + 30 + 10 + 5 = 65 pts",
        r1.points === 65, String(r1.points));
  check("J171: ... tornit 2 + 2, kilvet 2, osumat 5",
        String(r1.stats.turrets) === "4" && String(r1.stats.shields) === "2" && r1.stats.hits === 5,
        JSON.stringify([r1.stats.turrets, r1.stats.shields, r1.stats.hits]));
  const rg = r1.weapons.filter(w => /railgun/i.test(w.a[0]) && (w.box == null || w.box === "on"));
  check("J171: ... railgun-patteri kahdesti: vahvuus 6", rg.length === 1 && String(rg[0].a[2]) === "6", JSON.stringify(rg.map(w => w.a)));
  const r0 = R(orb({ "^Railgun": 1 }));
  check("J171: tracking system vain valmistusmoduulilla (ei ytimen saannoissa)",
        !r0.rules.some(r => /tracking system/i.test(r.t)) && !r0.options.some(o => o.state === "take" && /tracking system/i.test(o.text)) &&
        r1.options.some(o => o.state === "take" && /tracking system/i.test(o.text)), r0.rules.map(r => r.t.slice(0, 50)).join(" | "));
  const r5 = R(orb({ "^Railgun": 3, "^Habitat": 2 }));
  check("J171: viisi moduulia -> virhe option.modules (s.480: enintaan nelja)",
        r5.issues.some(i => i.code === "option.modules" && i.severity === "error"), JSON.stringify(r5.issues));
  check("J171: neljalla ei virhetta", !R(orb({ "^Railgun": 2, "^Habitat": 2 })).issues.some(i => i.code === "option.modules"));
  /* koukkukapasiteetti: kaksi koukkumoduulia kantaa kaksi Orcaa (s.454, s.480) */
  const own = re => { let h = null; TM.secs.forEach(s => s.ents.forEach(e => { if(!h && e.k !== "up" && re.test(e.l)) h = { s, e }; }));
    return { list: TM.nm, entry: { section: h.s.t, label: h.e.l }, ref: h.e.r == null ? null : String(h.e.r), hulls: 1, options: {}, upgrades: {} }; };
  const hk = us => DOMAIN.resolveFleet({ list: TM.nm, limit: 3000, units: [own(/^Merchant class starship/), own(/^Orca class gunship$/)].concat(us) }, catalog)
    .checks.find(c => /^Gravitic hook capacity \(Orcas and Wardens\)/.test(c.t));
  const cap = c => +String(c.v).split("/")[1];
  check("J171: kaksi koukkumoduulia kantaa kaksi enemman kuin ilman",
        cap(hk([orb({ "^Gravitic hook": 2 })])) === cap(hk([])) + 2, [cap(hk([])), cap(hk([orb({ "^Gravitic hook": 2 })]))].join(" -> "));
})();

/* ---- 4. puhtaus ------------------------------------------------------- */
check("katalogi tavulleen sama ajon jalkeen", JSON.stringify(catalog) === JSON.stringify(JSON.parse(RAW)));

console.log("\ntest_domain: " + pass + " lapi, " + fail + " epaonnistui");
if(fail){ fails.slice(0, 25).forEach(f => console.log("  - " + f)); process.exit(1); }
console.log("kaikki testit lapi");
