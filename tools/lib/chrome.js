/* Finds a Chrome (or Edge, or Chromium) for the headless checks: the CHROME
   environment variable first, then the usual install paths on Windows, macOS
   and Linux. */
"use strict";
const fs = require("fs");
const { execFileSync } = require("child_process");

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

module.exports = { findChrome, CANDIDATES };
