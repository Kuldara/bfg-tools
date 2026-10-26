/* Scenario Library regression test in the browser (20.10.2026).

   Use: serve the built site (npm run serve), open the Scenario Library in a
   browser and run this file's contents in the page context (DevTools console or
   an automation tool). Result: the number of scenarios, the number of views, the number
   of distinct headings and the errors.

   IMPORTANT: the route is NOT changed with history.replaceState / location.hash calls.
   Chrome ignores them after about a hundred calls in a short time, and then the
   test renders the same page again and again and shows green (happened 20.10.).
   parseHash is therefore bypassed directly, and distinctTitles = the number of scenarios
   proves that every scenario really was rendered.

   The cache is no trap: the build gives every scenario file a ?v=<content hash>
   (apps/scenarios/build.js), so a changed file always loads anew. */
/* the page's names, from the bundle's namespace (apps/scenarios/src/index.js) */
const { SC, app, prep, render, stOf } = window.SL;
const DB = SL.DB;   /* a let: read once, its object is never replaced on the page */
(async () => {
  window.__R = null;
  SL.setRouteHook(() => window.__R);
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
  window.__R = null; SL.setRouteHook(null); DB.table = oldT; render(false);
  return JSON.stringify({ n: SC.length, views, distinctTitles: titles.size, nerr: errs.length, errs: errs.slice(0, 20) });
})();
