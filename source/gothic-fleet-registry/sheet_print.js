/* Tulostaa sivun PDF:ksi headless-Chromella DevTools-protokollan kautta niin
 * kuin selaimen tulostusikkuna sen tekee: CSS:n @page-koko ja -suunta otetaan
 * huomioon (preferCSSPageSize). Komentorivin --print-to-pdf ei tee sita, joten
 * silla ei voi todeta, tuleeko Letter-arkista Letter-sivu.
 *
 * sheet_check.py kayttaa tata. Yksinaan:
 *   node sheet_print.js <sivu.html> <tuloskansio> <tapaus> [tapaus ...]
 * Sivu saa tapauksen osoitteen #-osassa ja ilmoittaa valmiista asettamalla
 * document.titlen JSON-olioksi; se tallennetaan PDF:n viereen (.json).
 */
"use strict";
const fs = require("fs"), path = require("path"), os = require("os"), http = require("http");
const { spawn } = require("child_process");
const CHROMES = ["C:/Program Files/Google/Chrome/Application/chrome.exe",
                 "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
                 "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
                 "C:/Program Files/Microsoft/Edge/Application/msedge.exe"];
const chrome = CHROMES.find(p => fs.existsSync(p));
if (!chrome) { console.error("headless-selainta ei loydy: " + CHROMES.join(", ")); process.exit(2); }
if (typeof WebSocket !== "function") { console.error("tarvitaan Node 22 tai uudempi (globaali WebSocket)"); process.exit(2); }
const [file, outdir, ...cases] = process.argv.slice(2);
const PORT = 9339;
const base = "file:///" + file.replace(/\\/g, "/").replace(/ /g, "%20");
const sleep = ms => new Promise(r => setTimeout(r, ms));
const getJSON = url => new Promise((res, rej) => http.get(url, r => {
  let b = ""; r.on("data", d => b += d); r.on("end", () => { try { res(JSON.parse(b)); } catch (e) { rej(e); } });
}).on("error", rej));

(async () => {
  const prof = fs.mkdtempSync(path.join(os.tmpdir(), "gfr_sheet_"));
  const proc = spawn(chrome, ["--headless=new", "--disable-gpu", "--no-sandbox", "--user-data-dir=" + prof,
    "--remote-debugging-port=" + PORT, "about:blank"], { stdio: "ignore" });
  try {
    let list = null;
    for (let i = 0; i < 80 && !list; i++) { await sleep(250); try { list = await getJSON("http://127.0.0.1:" + PORT + "/json/list"); } catch (e) {} }
    if (!list) throw new Error("selain ei vastannut portissa " + PORT);
    const ws = new WebSocket(list.find(t => t.type === "page").webSocketDebuggerUrl);
    await new Promise((res, rej) => { ws.addEventListener("open", res); ws.addEventListener("error", rej); });
    let id = 0; const wait = {};
    ws.addEventListener("message", ev => { const m = JSON.parse(ev.data); if (m.id && wait[m.id]) { wait[m.id](m); delete wait[m.id]; } });
    const send = (method, params) => new Promise(r => { const n = ++id; wait[n] = r; ws.send(JSON.stringify({ id: n, method, params: params || {} })); });
    await send("Page.enable"); await send("Runtime.enable");
    for (const c of cases) {
      /* tyhjan sivun kautta: pelkka #-osan vaihto ei lataisi sivua uudelleen */
      await send("Page.navigate", { url: "about:blank" }); await sleep(150);
      await send("Page.navigate", { url: base + "#" + c });
      let title = "";
      for (let i = 0; i < 160; i++) {
        await sleep(250);
        const r = await send("Runtime.evaluate", { expression: "document.title" });
        title = (r.result && r.result.result && r.result.result.value) || "";
        if (title.charAt(0) === "{") break;
      }
      if (title.charAt(0) !== "{") throw new Error(c + ": sivu ei ilmoittanut valmista (title: " + title + ")");
      await sleep(300);
      const pdf = await send("Page.printToPDF", { preferCSSPageSize: true, printBackground: true });
      if (!pdf.result || !pdf.result.data) throw new Error(c + ": printToPDF epaonnistui " + JSON.stringify(pdf.error || {}));
      const out = path.join(outdir, c.replace(/,/g, "_") + ".pdf");
      fs.writeFileSync(out, Buffer.from(pdf.result.data, "base64"));
      fs.writeFileSync(out + ".json", title);
    }
    ws.close();
  } finally {
    proc.kill();
    await sleep(500);
    try { fs.rmSync(prof, { recursive: true, force: true }); } catch (e) {}
  }
})().catch(e => { console.error(String(e && e.message || e)); process.exit(1); });
