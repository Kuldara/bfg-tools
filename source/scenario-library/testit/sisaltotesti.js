/* Sisältötesti: aja sivulla kuten selaintesti
     await eval(await fetch("testit/sisaltotesti.js?v="+Date.now()).then(r=>r.text()))
   Tarkistaa koneellisesti sisältövirheitä, joita selain- ja karttatesti eivät näe:
   1. VÄRI: kartan teksti nimeää puolen (sides.x.n), mutta on piirretty toisen puolen värillä.
      Reunat (edge) ohitetaan: ne väritetään sen mukaan, kuka reunaa käyttää (esim. pakoreuna).
   2. PUOLI: set-up-askel, Play-sääntö tai vuoromuistutus on merkitty puolelle s, mutta lause alkaa
      toisen puolen nimellä ("The attacker takes…" puolustajan kohdalla). Kotolin "The defender picks
      three of your cruisers" on tarkoituksellinen (puhuttelee toista puolta) ja sallittu.
   3. TULOS: jokaisen skenaarion result() satunnaisilla syötteillä (60 × versio): ei poikkeuksia,
      otsikossa ei undefined/NaN, ja verbi taipuu (monikko "win", yksikkö "wins").
   4. TYHJÄ: koskemattomassa pelissä (ei syötteitä, vuoro 1) näkyvä tuomio (verdict) ei saa nimetä
      voittajaa — löytyi 0.7:ssä: Planetary Assault -perhe sanoi "Defender's victory" ennen peliä.
   Palauttaa JSON-merkkijonon { counts, err, items }. */
(() => {
  const items = [], esc2 = s => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const ALLOW_PUOLI = new Set(["cl-kotol"]);
  let maps = 0, lines = 0, results = 0;
  const rnd = n => Math.floor(Math.random() * n);
  for (const sc of SC) {
    const names = Object.entries(sc.sides).map(([k, x]) => [k, x.n]).filter(x => x[1]);
    const vs = sc.variants ? sc.variants.map(x => x[0]) : ["std"];
    /* 1. VÄRI */
    const fn = sc.draw || MAPS[sc.id];
    for (const v of vs) {
      if (!fn) break;
      let its; try { its = fn(v, 180, 120, { w: {}, turn: 1 }).filter(Boolean); } catch (e) { items.push("err MAP " + sc.id + " " + v + " :: " + e.message); continue; }
      maps++;
      for (const it of its) {
        const l = String(it.l || ""); if (!l || !it.s || it.s === "n" || it.z === "edge") continue; /* reunat väritetään sen mukaan, kuka niitä käyttää */
        const hits = names.filter(([k, n]) => new RegExp("(^|[^A-Za-z])" + esc2(n) + "([^A-Za-z]|$)", "i").test(l));
        if (hits.length === 1 && hits[0][0] !== it.s) items.push("warn VÄRI " + sc.id + " " + v + " :: " + JSON.stringify(l) + " nimeää puolen " + hits[0][0] + ", väri " + it.s);
      }
    }
    /* 2. PUOLI */
    if (!ALLOW_PUOLI.has(sc.id)) {
      const seen = new Set();
      for (const v of vs) {
        const list = (sc.steps || []).concat(sc.play || []).filter(x => vis(x, v)).map(x => [x.s, x.t]);
        const fx = sc.fx || TURNFX[sc.id];
        if (fx) for (let T = 1; T <= 12; T++) { try { fx(T, stOf(sc), v).forEach(e => list.push([e[0], e[1]])); } catch (e) { items.push("err FX " + sc.id + " " + v + " T" + T + " :: " + e.message); } }
        for (const [s, t] of list) {
          if (!s || !t || seen.has(s + t)) continue; seen.add(s + t); lines++;
          for (const [k, n] of names) if (k !== s && new RegExp("^(The )?" + esc2(n) + "(s)?( |’s |'s )", "i").test(t.trim()))
            items.push("err PUOLI " + sc.id + " :: merkitty " + s + ", alkaa " + JSON.stringify(t.slice(0, 70)));
        }
      }
    }
    /* 4. TYHJÄ */
    for (const v of vs) {
      try { const r = verdict(sc, { w: {}, turn: 1, v }, v); if (r && r[0]) items.push("err TYHJÄ " + sc.id + " " + v + " :: " + r[1]); }
      catch (e) { items.push("err TYHJÄ " + sc.id + " " + v + " :: " + e.message); }
    }
    /* 3. TULOS */
    const tools = (sc.tools || []).concat(sc.rtools || [], sc.stools || []);
    for (const v of vs) for (let k = 0; k < 60; k++) {
      const w = {};
      for (const t of tools) {
        if (!t.id) continue;
        if (t.k === "num") w[t.id] = rnd(4) ? rnd(40) * 25 : 0;
        else if (t.k === "counter") w[t.id] = (t.min || 0) + rnd(8);
        else if (t.k === "toggle") w[t.id] = !!rnd(2);
        else if (t.k === "ending" || t.k === "pick") w[t.id] = rnd((t.rows || []).length + 1) - 1;
        else if (t.k === "roll") w[t.id] = rnd(7);
      }
      if (rnd(2)) w.over = true;
      let r;
      try { r = sc.result({ w, turn: 1 + rnd(12), v }, v, sc); results++; } catch (e) { items.push("err TULOS " + sc.id + " " + v + " :: " + e.message); break; }
      const h = r && r[1] ? String(r[1]) : "";
      if (/undefined|NaN|\[object/.test(h + " " + (r && r[2] || ""))) { items.push("err TULOS " + sc.id + " :: " + h + " / " + r[2]); break; }
      if (/\b(\w+s|Eldar) wins\b/.test(h) && !/\b(\w*ss|Chaos) wins\b/.test(h)) { items.push("err TAIPUMINEN " + sc.id + " :: " + h); break; }
    }
  }
  /* 5. ARVIO (21.10.): jokaisella Warp Rift -skenaariolla on kirjaston taso ja perustelu (scenarios/wr-rating.js),
     taso fan ⇔ book "E", eikä luokitustiedostossa ole tuntemattomia tunnisteita. */
  const wrIds = new Set(SC.filter(sc => sc.trust === "wr").map(sc => sc.id));
  for (const sc of SC.filter(sc => sc.trust === "wr")) {
    const r = WR_RATE[sc.id];
    if (!r) { items.push("err ARVIO " + sc.id + " :: ei riviä wr-rating.js:ssä"); continue; }
    if (!r.r) items.push("err ARVIO " + sc.id + " :: perustelu puuttuu");
    if (!["rec", "agree", "fan"].includes(sc.tier)) items.push("err ARVIO " + sc.id + " :: taso " + sc.tier);
    if ((sc.tier === "fan") !== (sc.book === "E")) items.push("err ARVIO " + sc.id + " :: taso " + sc.tier + " mutta book " + sc.book);
    const ids = new Set();
    for (const x of r.a || []) {
      if (!x.id || !x.l || x.d === undefined || x.d === "") items.push("err ARVIO " + sc.id + " :: kohdasta puuttuu id, l tai d");
      if (!x.o && !x.s) items.push("err ARVIO " + sc.id + " :: " + x.id + ": oletuksella ei lähdettä eikä o:1");
      if (ids.has(x.id)) items.push("err ARVIO " + sc.id + " :: " + x.id + " kahdesti"); ids.add(x.id);
    }
    /* {a:id} askelissa ja huomautuksissa osoittaa olemassa olevaan kohtaan */
    const vs = sc.variants ? sc.variants.map(x => x[0]) : ["std"];
    for (const v of vs) for (const t of sc.steps.map(x => x.t).concat((sc.play || []).map(x => x.t), pickV(sc.win, v) || [], pickV(sc.end, v) || [], [val(sc.mapNote, v) || "", val(sc.noMap, v) || ""])) {
      for (const m of String(t).matchAll(/\{a:(\w+)\}/g)) if (!ids.has(m[1])) items.push("err ARVIO " + sc.id + " :: {a:" + m[1] + "} ilman kohtaa");
    }
  }
  /* sama {a:id}-tarkistus muille kuin WR-skenaarioille (niillä ei ole kohtia) */
  for (const sc of SC.filter(sc => sc.trust !== "wr")) for (const x of sc.steps) if (/\{a:\w+\}/.test(x.t)) items.push("err ARVIO " + sc.id + " :: {a:..} ilman kohtia");
  for (const id of Object.keys(WR_RATE)) if (!wrIds.has(id)) items.push("err ARVIO " + id + " :: tuntematon tunniste");
  const err = items.filter(x => x.startsWith("err")).length;
  return JSON.stringify({ counts: { scenarios: SC.length, maps, lines, results, rated: wrIds.size }, err, warn: items.length - err, items });
})()
