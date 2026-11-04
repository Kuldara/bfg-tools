/* The names a script takes from the global scope.

   A name the code reads or writes that no import, declaration or parameter
   binds is looked up on the global object: in a browser, window. Such a name
   must be the browser's own (document, setTimeout, JSON ...). Any other one is
   a ReferenceError when its line runs, unless some other code has put it on
   window first: a module that uses another module's export without importing
   it, for one. esbuild does not report it: it renames the real declaration out
   of the way (isEscGrp -> isEscGrp2), and the bare name points at nothing. A
   test harness that puts the page's exports on the global for its snippets
   (apps/play/smoke_play.js; the Registry's PAGE_GLOBALS_JS) even makes such a
   page pass. Gothic Fleet Play threw "isEscGrp is not defined" in Chrome this
   way in November 2026, on a line no check ran (a capital ship in a squadron
   failing its Disengage test).

   The list here is esbuild's own scope analysis, not a scan of the text.
   esbuild's define replaces a name only where it is unbound (its parser
   substitutes a define "for unbound or injected symbols"), so every
   identifier of the code is defined as a marker, and wherever a marker comes
   out, the code takes that name from the global scope. A parameter, a local,
   a property, a string or a comment of the same name is never counted. A
   source map takes each back to its line.

     ofBundle(options, js)  esbuild options of a bundle and its output
                            -> [{ name, file, line, col, text, exportedBy }]
     ofScript(code)         a built script (one bundle as the page has it)
                            -> [{ name, line, col, text, module }]
     allowed(name)          the language's own globals and BROWSER
     report(what, hits)     the build's error message */
"use strict";
const path = require("path"), vm = require("vm");
const REPO = path.resolve(__dirname, "..", "..");

/* The language's own globals: what a fresh V8 context has (Object, JSON,
   Math, parseInt, undefined, globalThis, console ...). The engine is the list,
   but for SharedArrayBuffer, which a browser gives only a cross-origin
   isolated page (these pages are not; Chrome checked, 4.11.2026). */
const ECMASCRIPT = new Set(vm.runInNewContext("Object.getOwnPropertyNames(globalThis)"));
ECMASCRIPT.delete("SharedArrayBuffer");

/* The browser's names the pages use, each one that window has. A page that
   starts using another adds it here (the build names it). Not window's short
   words that a slip reaches without an error (name, status, event, open,
   close, top, parent, length, origin ...): a forgotten declaration of one of
   those reads a wrong value instead of throwing, so they stay out until a
   page really means one. */
const BROWSER = new Set([
  "window", "document", "navigator", "location", "history", "localStorage", "sessionStorage",
  "setTimeout", "clearTimeout", "setInterval", "clearInterval", "requestAnimationFrame", "cancelAnimationFrame",
  "alert", "confirm", "matchMedia", "getComputedStyle", "innerWidth", "innerHeight", "performance", "crypto",
  "atob", "btoa", "TextEncoder", "TextDecoder", "URL", "URLSearchParams", "Blob", "FileReader", "Response",
  "CompressionStream", "DecompressionStream", "WebSocket",
]);
const allowed = name => ECMASCRIPT.has(name) || BROWSER.has(name);

/* Words that cannot be a define's key: the reserved words of strict code. */
const RESERVED = new Set(("break case catch class const continue debugger default delete do else enum export " +
  "extends false finally for function if import in instanceof new null return super switch this throw true try " +
  "typeof var void while with yield let static implements interface package private protected public await").split(" "));
const MARK = "__unbound$";
const MARKED = /__unbound\$([A-Za-z_$][\w$]*)/g;

/* Every identifier-shaped word of the text, each defined as its marker. A
   name the code takes from the global scope is never renamed by esbuild, so
   every one of them is among the words of the bundle. */
function markers(text, keep) {
  if (text.includes(MARK)) throw new Error("free-names: the code already contains " + MARK);
  const define = {};
  for (const w of new Set(text.match(/[A-Za-z_$][\w$]*/g)))
    if (!RESERVED.has(w) && w !== "__proto__" && !Object.prototype.hasOwnProperty.call(keep, w)) define[w] = MARK + w;
  return Object.assign(define, keep);
}

/* A source map's "mappings": per generated line, [column, source, line, column]. */
const B64 = new Int8Array(128);
"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/".split("").forEach((c, k) => { B64[c.charCodeAt(0)] = k; });
function decode(mappings) {
  const lines = [];
  let src = 0, sLine = 0, sCol = 0;
  for (const ln of mappings.split(";")) {
    const segs = [];
    let gCol = 0;
    if (ln) for (const seg of ln.split(",")) {
      const v = [];
      let shift = 0, val = 0;
      for (let c = 0; c < seg.length; c++) {
        const d = B64[seg.charCodeAt(c)];
        val += (d & 31) << shift;
        if (d & 32) shift += 5;
        else { v.push(val & 1 ? -(val >>> 1) : val >>> 1); val = 0; shift = 0; }
      }
      gCol += v[0];
      if (v.length >= 4) { src += v[1]; sLine += v[2]; sCol += v[3]; segs.push([gCol, src, sLine, sCol]); }
    }
    lines.push(segs);
  }
  return lines;
}

/* Each marker in the output, at its place in the sources. A marker that starts
   a mapping is exact; otherwise the name is the first use of the word at or
   after the mapping before it (the start of the expression it is in). */
function locate(out, map) {
  const lines = decode(map.mappings), texts = map.sourcesContent || [];
  /* each source's rows and where each row starts, made once */
  const cache = [];
  const rowsOf = k => cache[k] || (cache[k] = (() => {
    const rows = texts[k].split("\n"), starts = [0];
    for (let r = 0; r < rows.length - 1; r++) starts.push(starts[r] + rows[r].length + 1);
    return { rows, starts };
  })());
  const hits = [];
  out.split("\n").forEach((l, gl) => {
    for (const m of l.matchAll(MARKED)) {
      let s = null;
      for (const seg of lines[gl] || []) { if (seg[0] <= m.index) s = seg; else break; }
      if (!s || texts[s[1]] == null) { hits.push({ name: m[1], source: s ? s[1] : -1, line: s ? s[2] + 1 : 0, col: s ? s[3] + 1 : 0, text: "" }); continue; }
      const { rows, starts } = rowsOf(s[1]);
      let line = s[2], col = s[3];
      if (s[0] !== m.index) {
        const word = new RegExp("(?<![\\w$.])" + m[1].replace(/\$/g, "\\$") + "(?![\\w$])", "g");
        word.lastIndex = starts[line] + col;
        const w = word.exec(texts[s[1]]);
        if (w) {
          let lo = 0, hi = starts.length - 1;
          while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (starts[mid] <= w.index) lo = mid; else hi = mid - 1; }
          line = lo; col = w.index - starts[lo];
        }
      }
      hits.push({ name: m[1], source: s[1], line: line + 1, col: col + 1, text: (rows[line] || "").trim() });
    }
  });
  return hits;
}

/* The bundle again with every word a marker, and its source map: each name
   with the file and line it is used on. options are the bundle's own esbuild
   options; js is what they made. */
async function ofBundle(options, js) {
  const esbuild = require("esbuild");
  /* nothing is written (write: false); the name only places the source map */
  const out = path.join(REPO, "free-names.out.js");
  const r = await esbuild.build(Object.assign({}, options, {
    define: markers(js, options.define || {}), write: false, outfile: out, sourcemap: "external",
  }));
  /* the script and its map (by the ending: esbuild may spell a Windows path its own way) */
  const code = r.outputFiles.find(f => !f.path.endsWith(".map")).text;
  const map = JSON.parse(r.outputFiles.find(f => f.path.endsWith(".map")).text);
  const files = map.sources.map(s => path.relative(REPO, path.resolve(path.dirname(out), s)).replace(/\\/g, "/"));
  /* for the message: the modules that export a name no browser has (looked
     up once per such name; the browser's names are most of the uses) */
  const owners = new Map();
  const exportedBy = name => {
    if (allowed(name)) return [];
    if (!owners.has(name)) {
      const decl = new RegExp("^export\\s+(?:async\\s+)?(?:function\\*?|const|let|var|class)\\s+" + name.replace(/\$/g, "\\$") + "(?![\\w$])", "m");
      owners.set(name, files.filter((f, k) => decl.test((map.sourcesContent || [])[k] || "")));
    }
    return owners.get(name);
  };
  return locate(code, map).map(h => ({ name: h.name, file: files[h.source] || "?", line: h.line, col: h.col, text: h.text, exportedBy: exportedBy(h.name) }));
}

/* A built script, as the page carries it: the names, at their lines of the
   script, each with the module it came from (esbuild's "// path" comment
   above it). */
function ofScript(code) {
  const esbuild = require("esbuild");
  const r = esbuild.transformSync(code, { define: markers(code, {}), loader: "js", sourcemap: "external", sourcefile: "page.js", logLevel: "silent" });
  const rows = code.split("\n");
  const moduleAt = [];
  let cur = "";
  rows.forEach((l, k) => { const m = /^\s*\/\/ (\S+\.[cm]?js)$/.exec(l); if (m) cur = m[1]; moduleAt[k] = cur; });
  return locate(r.code, JSON.parse(r.map)).map(h => ({ name: h.name, line: h.line, col: h.col, text: h.text, module: moduleAt[h.line - 1] || "" }));
}

/* The build's message: each name once, with every line it is used on. */
function report(what, hits) {
  const by = new Map();
  for (const h of hits) { if (!by.has(h.name)) by.set(h.name, []); by.get(h.name).push(h); }
  const rows = [...by].map(([name, hs]) => "  " + name + "  " + hs.map(h => h.file + ":" + h.line).join(", ") +
    (hs[0].text ? "\n      " + hs[0].text.slice(0, 110) : "") +
    (hs[0].exportedBy && hs[0].exportedBy.length ? "\n      (an export of " + hs[0].exportedBy.join(", ") + ": import it from there)" : ""));
  return what + ": its code takes names from the global scope that a browser does not have.\n" +
    "  Each is a ReferenceError when its line runs, unless other code has put the name on window\n" +
    "  first; a test that puts the page's exports on the global hides it. Import it or declare it\n" +
    "  (tools/lib/free-names.js):\n" +
    rows.join("\n") + "\n" +
    "  A browser name a page has started to use goes in BROWSER there.";
}

module.exports = { ofBundle, ofScript, allowed, report, ECMASCRIPT, BROWSER };
