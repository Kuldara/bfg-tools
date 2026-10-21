/* Scenario Libraryn regressiotesti selaimessa (20.10.2026).

   Käyttö: avaa sovellus Browser-paneelissa (preview_start "scenario-library",
   lataa uudella ?v=N:llä) ja aja tämän tiedoston sisältö sivun kontekstissa
   (javascript_tool). Tulos: skenaarioiden määrä, näkymien määrä, erillisten
   otsikoiden määrä ja virheet.

   TÄRKEÄÄ: reittiä EI vaihdeta history.replaceState-/location.hash-kutsuilla.
   Chrome jättää ne huomiotta noin sadan kutsun jälkeen lyhyessä ajassa, jolloin
   testi renderöi saman sivun yhä uudelleen ja näyttää vihreää (sattui 20.10.).
   parseHash ohitetaan siksi suoraan, ja distinctTitles = skenaarioiden määrä
   todistaa, että jokainen skenaario todella renderöitiin.

   Huom. myös välimuisti: skenaariotiedostot ladataan ?v=-parametrilla
   (index.html:n script-tagit). Nosta sitä, kun scenarios/*.js muuttuu. */
(async () => {
  window.__R = null;
  const origPH = parseHash;
  parseHash = () => window.__R || origPH();
  const errs = [], tables = [[183, 122], [120, 120], [90, 90], [244, 122], [60, 60]], oldT = DB.table;
  let views = 0;
  const titles = new Set();
  for (const sc of SC) {
    const vs = sc.variants ? sc.variants.map(x => x[0]) : [null];
    for (const v of vs) for (const tb of tables) {
      DB.table = { p: "custom", w: tb[0], h: tb[1] };
      const st = stOf(sc); if (v) st.v = v;
      for (const T of [1, 3, 11]) {
        st.turn = T;
        for (const tab of ["setup", "subplots", "play", "result"]) {
          try {
            window.__R = { view: "sc", id: sc.id, tab }; render(false); views++; titles.add(document.title);
            const t = document.getElementById("app").innerText;
            if (/undefined|NaN|\[object|function|=>/.test(t)) errs.push(sc.id + "/" + v + "/" + tab + "/" + tb[0] + ": " + (t.match(/.{0,40}(undefined|NaN|\[object|function|=>).{0,30}/) || [""])[0]);
          } catch (e) { errs.push(sc.id + "/" + v + "/" + tab + ": " + e.message); }
        }
      }
      st.turn = 1;
    }
  }
  for (const view of ["list", "prep", "subplots", "sources"]) { try { window.__R = { view }; render(false); views++; } catch (e) { errs.push(view + ": " + e.message); } }
  window.__R = null; parseHash = origPH; DB.table = oldT; render(false);
  return JSON.stringify({ n: SC.length, views, distinctTitles: titles.size, nerr: errs.length, errs: errs.slice(0, 20) });
})();
