/* Headless Chrome for the checks that drive a real browser.

   findChrome()   a Chrome (or Edge, or Chromium): the CHROME environment
                  variable first, then the usual install paths on Windows,
                  macOS and Linux.
   launch(opts)   starts it headless with a fresh profile and opens a DevTools
                  session on its first page; returns { send, once, evaluate,
                  close }. Four checks used to carry a copy of this each
                  (26.10.2026: --no-sandbox had to be added four times). */
"use strict";
const fs = require("fs"), os = require("os"), path = require("path");
const { execFileSync, spawn } = require("child_process");

const CANDIDATES = [
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome", "/usr/bin/google-chrome-stable", "/usr/bin/chromium", "/usr/bin/chromium-browser",
];

function findChrome() {
  if (process.env.CHROME && fs.existsSync(process.env.CHROME)) return process.env.CHROME;
  for (const c of CANDIDATES) if (fs.existsSync(c)) return c;
  for (const name of ["google-chrome", "chromium", "chromium-browser"]) {
    try { const p = execFileSync("which", [name], { encoding: "utf8" }).trim(); if (p) return p; } catch (e) { /* not there */ }
  }
  throw new Error("no Chrome found: set CHROME to its path");
}

/* opts.prefix: the temp profile folder's name prefix; opts.args: extra Chrome
   flags (a window size, --hide-scrollbars); opts.evaluateTimeout: ms one
   evaluate may take (300 000). The sandbox is off because the pages are this
   repository's own and a CI runner may refuse it. */
async function launch(opts = {}) {
  const exe = findChrome();
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), opts.prefix || "bfgtools-chrome-"));
  const proc = spawn(exe, ["--headless=new", "--no-sandbox", "--remote-debugging-port=0", "--user-data-dir=" + dir,
    "--no-first-run", "--no-default-browser-check", "--disable-extensions", ...(opts.args || []), "about:blank"], { stdio: "ignore" });
  const portFile = path.join(dir, "DevToolsActivePort");
  let port = null;
  for (let k = 0; k < 100 && !port; k++) {
    await new Promise(r => setTimeout(r, 100));
    /* Chrome may hold the file while it writes it (EBUSY on Windows): try again */
    try { if (fs.existsSync(portFile)) { const t = fs.readFileSync(portFile, "utf8").split("\n")[0].trim(); if (t) port = t; } }
    catch (e) { if (e.code !== "EBUSY" && e.code !== "EPERM") throw e; }
  }
  if (!port) { try { proc.kill(); } catch (e) { /* already gone */ } throw new Error("Chrome did not start: " + exe); }
  const list = await (await fetch("http://127.0.0.1:" + port + "/json/list")).json();
  const page = list.find(t => t.type === "page");
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((ok, no) => { ws.onopen = ok; ws.onerror = no; });
  let id = 0; const wait = new Map(), on = new Map();
  ws.onmessage = m => {
    const d = JSON.parse(m.data);
    if (d.id && wait.has(d.id)) { const w = wait.get(d.id); wait.delete(d.id); d.error ? w.no(new Error(JSON.stringify(d.error))) : w.ok(d.result); }
    else if (d.method && on.has(d.method)) { const f = on.get(d.method); on.delete(d.method); f(d.params); }
  };
  const send = (method, params) => new Promise((ok, no) => { const k = ++id; wait.set(k, { ok, no }); ws.send(JSON.stringify({ id: k, method, params: params || {} })); });
  const once = method => new Promise(ok => on.set(method, ok));
  /* A headless page has, a few times under a heavy machine load, stopped
     answering for good (no dialog, no CPU; cause not found). A check then
     fails with this instead of waiting for ever. */
  const LIMIT = opts.evaluateTimeout || 300000;
  const evaluate = async expr => {
    let timer;
    const r = await Promise.race([
      send("Runtime.evaluate", { expression: expr, awaitPromise: true, returnByValue: true }),
      new Promise((_, no) => { timer = setTimeout(() => no(new Error("the page did not answer in " + LIMIT / 1000 + " s (headless Chrome stalled)")), LIMIT); }),
    ]).finally(() => clearTimeout(timer));
    if (r.exceptionDetails) throw new Error("on the page: " + (r.exceptionDetails.exception && r.exceptionDetails.exception.description || r.exceptionDetails.text));
    return r.result.value;
  };
  const close = () => {
    try { ws.close(); } catch (e) { /* closed already */ }
    try { proc.kill(); } catch (e) { /* gone already */ }
    setTimeout(() => { try { fs.rmSync(dir, { recursive: true, force: true }); } catch (e) { /* a locked profile file; the OS temp cleans it */ } }, 800);
  };
  return { send, once, evaluate, close, port, dir };
}

module.exports = { findChrome, launch, CANDIDATES };
