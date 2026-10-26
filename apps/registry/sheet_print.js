/* Prints a page to PDF with headless Chrome through the DevTools protocol, the
 * way the browser's print dialog does: the CSS @page size and orientation are
 * honoured (preferCSSPageSize). The command-line --print-to-pdf does not do that, so
 * it cannot tell whether a Letter sheet becomes a Letter page.
 *
 * sheet_check.py uses this. On its own:
 *   node sheet_print.js <page.html> <output folder> <case> [case ...]
 * The page gets the case in the #-part of its address and signals that it is ready by setting
 * document.title to a JSON object; that is saved beside the PDF (.json).
 */
"use strict";
const fs = require("fs"), path = require("path"), os = require("os"), http = require("http");
const { spawn } = require("child_process");
let chrome;
try { chrome = require("../../tools/lib/chrome.js").findChrome(); } catch (e) { console.error(e.message); process.exit(2); }
if (typeof WebSocket !== "function") { console.error("Node 22 or newer is needed (global WebSocket)"); process.exit(2); }
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
    if (!list) throw new Error("the browser did not answer on port " + PORT);
    const ws = new WebSocket(list.find(t => t.type === "page").webSocketDebuggerUrl);
    await new Promise((res, rej) => { ws.addEventListener("open", res); ws.addEventListener("error", rej); });
    let id = 0; const wait = {};
    ws.addEventListener("message", ev => { const m = JSON.parse(ev.data); if (m.id && wait[m.id]) { wait[m.id](m); delete wait[m.id]; } });
    const send = (method, params) => new Promise(r => { const n = ++id; wait[n] = r; ws.send(JSON.stringify({ id: n, method, params: params || {} })); });
    await send("Page.enable"); await send("Runtime.enable");
    for (const c of cases) {
      /* through an empty page: changing only the #-part would not reload the page */
      await send("Page.navigate", { url: "about:blank" }); await sleep(150);
      await send("Page.navigate", { url: base + "#" + c });
      let title = "";
      for (let i = 0; i < 160; i++) {
        await sleep(250);
        const r = await send("Runtime.evaluate", { expression: "document.title" });
        title = (r.result && r.result.result && r.result.result.value) || "";
        if (title.charAt(0) === "{") break;
      }
      if (title.charAt(0) !== "{") throw new Error(c + ": the page did not signal ready (title: " + title + ")");
      await sleep(300);
      const pdf = await send("Page.printToPDF", { preferCSSPageSize: true, printBackground: true });
      if (!pdf.result || !pdf.result.data) throw new Error(c + ": printToPDF failed " + JSON.stringify(pdf.error || {}));
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
