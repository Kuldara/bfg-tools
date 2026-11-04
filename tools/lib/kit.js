/* Build helpers shared by the apps' build.js files: reading and writing,
   @@include expansion, bundling with esbuild, the BFG Tools badge, a
   deterministic one-file ZIP, and the guards every published page passes. */
"use strict";
const fs = require("fs"), os = require("os"), path = require("path"), zlib = require("zlib"), crypto = require("crypto");

const REPO = path.resolve(__dirname, "..", "..");
const DIST = path.join(REPO, "dist");
const abs = p => (path.isAbsolute(p) ? p : path.join(REPO, p));

const read = p => fs.readFileSync(abs(p), "utf8");
const readBytes = p => fs.readFileSync(abs(p));
function write(p, content) {
  const f = abs(p);
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, content);
  return f;
}
const copy = (from, to) => write(to, readBytes(from));

/* Every line "@@include <path>" becomes that file (relative to baseDir), as is. */
function expandIncludes(text, baseDir) {
  return text.split("\n").map(ln => {
    const m = /^@@include (\S+)$/.exec(ln);
    if (!m) return ln;
    const part = read(path.join(baseDir, m[1]));
    if (!part.endsWith("\n")) throw new Error(m[1] + " must end with a newline");
    return part.slice(0, -1);
  }).join("\n");
}

/* Replaces the marker <!--@name--> exactly `count` times. The value goes in
   as is (no $-patterns), which matters for code and data. */
function fill(text, name, value, count = 1) {
  const mark = "<!--@" + name + "-->";
  const n = text.split(mark).length - 1;
  if (n !== count) throw new Error(`marker ${mark}: found ${n}, expected ${count}`);
  return text.split(mark).join(value);
}

/* One self-contained script from an ES module entry. charset ascii keeps the
   page pure ASCII whatever the source contains; the global name exposes the
   module's exports to the page tools (card printing, layout checks).
   checkImports: the build fails when a module uses, without importing it, a
   name that a module of the same bundle exports (freeExports). */
async function bundle({ entry, globalName, define = {}, checkImports = false }) {
  const esbuild = require("esbuild");
  const opts = {
    entryPoints: [abs(entry)], bundle: true, write: false, format: "iife", globalName,
    charset: "ascii", legalComments: "none", platform: "browser",
    define, logLevel: "silent",
  };
  const r = await esbuild.build(Object.assign({ metafile: checkImports }, opts));
  if (checkImports) {
    const free = await freeExports(esbuild, opts, r.metafile);
    if (free.length) throw new Error(entry + ": " + free.map(f => `${f.users.length ? f.users.join(", ") : "a module"} uses ${f.name} without importing it ` +
      `(${f.exporters.join(", ")} exports it): in the page it is not defined`).join("; "));
  }
  /* esbuild prints an escaped control character ("\u0001", the separator of
     saved-fleet keys) as the raw byte. Raw control characters can only stand
     inside string, template or regex literals, where the escape means the
     same, so they go back to escapes; the page guards reject raw ones. */
  const js = r.outputFiles[0].text.replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g,
    c => "\\u" + c.charCodeAt(0).toString(16).padStart(4, "0"));
  if (/<\/script/i.test(js)) throw new Error(entry + ": the bundle contains </script");
  return js;
}

/* A name a module uses without importing it, though another module of the
   bundle exports it, is a free global to esbuild: the bundle renames the
   export (isEscGrp became isEscGrp2) and leaves the bare name, which the
   browser cannot resolve - a ReferenceError at the first tap that reaches
   it, and a test harness that makes the exports globals hides it (Play,
   4.11.2026). esbuild's own scope analysis finds these: the bundle is built
   again with an injected module that exports every exported name as a
   marker, and inject binds exactly the free references to it. Returns
   [{ name, users, exporters }], users the modules that use the name. */
const FREE = "__bfg_free_name__";
async function freeExports(esbuild, opts, metafile) {
  const cwd = process.cwd(), rel = p => path.relative(REPO, path.resolve(cwd, p)).replace(/\\/g, "/");
  const js = Object.keys(metafile.inputs).filter(p => /^(esm|cjs)$/.test(metafile.inputs[p].format || ""));
  const esm = js.filter(p => metafile.inputs[p].format === "esm");
  /* what each module exports: the modules one by one, not bundled */
  const own = await esbuild.build({ entryPoints: esm.map(p => path.resolve(cwd, p)), bundle: false, write: false, format: "esm",
    metafile: true, outdir: path.join(os.tmpdir(), "bfg-exports"), logLevel: "silent" });
  const exporters = new Map();
  for (const o of Object.values(own.metafile.outputs)) for (const n of o.exports || []) {
    if (n === "default" || !/^[A-Za-z_$][\w$]*$/.test(n)) continue;
    exporters.set(n, (exporters.get(n) || []).concat(rel(o.entryPoint)));
  }
  if (!exporters.size) return [];
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "bfg-free-"));
  try {
    const inject = path.join(dir, "free-names.js");
    fs.writeFileSync(inject, [...exporters.keys()].map((n, k) => `const m${k} = "${FREE}${n}"; export { m${k} as ${n} };`).join("\n") + "\n");
    const marks = text => [...new Set([...text.matchAll(new RegExp(FREE + "([\\w$]+)", "g"))].map(m => m[1]))];
    const found = marks((await esbuild.build(Object.assign({}, opts, { inject: [inject] }))).outputFiles[0].text);
    if (!found.length) return [];
    /* who uses them: each module alone, its imports left out */
    const users = new Map(found.map(n => [n, []]));
    for (const p of js) {
      const one = await esbuild.build({ entryPoints: [path.resolve(cwd, p)], bundle: true, write: false, format: "esm",
        external: ["*"], inject: [inject], define: opts.define, logLevel: "silent" });
      for (const n of marks(one.outputFiles[0].text)) if (users.has(n)) users.get(n).push(rel(p));
    }
    return found.map(n => ({ name: n, users: users.get(n), exporters: exporters.get(n) }));
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

function badge(here) {
  const html = read("packages/ui/tools-badge.html").replace(/\r\n/g, "\n").replace(/\n+$/, "");
  if (html.split("__HERE__").length !== 2) throw new Error("tools-badge.html: __HERE__ must appear once");
  return "\n" + html.replace("__HERE__", here) + "\n";
}

/* ---------------------------------------------------------------- guards */
const guards = {
  /* Pure ASCII: the file stays readable even when served without a charset. */
  ascii(page, name) {
    const bad = [...new Set([...page].filter(c => c.charCodeAt(0) > 127))];
    if (bad.length) throw new Error(`${name}: non-ASCII characters ${bad.slice(0, 8).map(c => "U+" + c.charCodeAt(0).toString(16)).join(" ")}`);
  },
  /* A control character does not show when the code is read; it just breaks
     things (a NUL once reached a release this way). */
  controlChars(page, name) {
    const bad = [...new Set([...page].filter(c => { const k = c.charCodeAt(0); return (k < 32 && k !== 9 && k !== 10 && k !== 13) || k === 127; }))];
    if (bad.length) throw new Error(`${name}: control characters ${bad.map(c => "0x" + c.charCodeAt(0).toString(16)).join(" ")}`);
  },
  /* An undefined CSS variable is not an error to a browser: the property just
     drops, and in one theme the text became white on white. */
  cssVars(page, name) {
    /* var(--x, fallback) has a value either way; a variable the script sets
       with style.setProperty("--x", ...) is defined at run time */
    const used = new Set([...page.matchAll(/var\(\s*(--[A-Za-z0-9_-]+)\s*\)/g)].map(m => m[1]));
    const defined = new Set([...page.matchAll(/(--[A-Za-z0-9_-]+)\s*:/g)].map(m => m[1])
      .concat([...page.matchAll(/setProperty\(\s*["'](--[A-Za-z0-9_-]+)["']/g)].map(m => m[1])));
    const bad = [...used].filter(v => !defined.has(v)).sort();
    if (bad.length) throw new Error(`${name}: CSS variables used but never defined: ${bad.join(", ")}`);
  },
  /* The badge links to the sister tools: only these hosts, only as links that
     open in a new tab (an unsaved fleet must not be navigated away from). */
  badge(page, name, hosts) {
    const blocks = page.match(/<!--BFGTOOLS-->[\s\S]*?<!--\/BFGTOOLS-->/g) || [];
    if (blocks.length !== 1) throw new Error(`${name}: the BFG Tools badge must appear exactly once`);
    const b = blocks[0];
    const links = b.match(/<a [^>]*>/g) || [];
    const found = new Set([...b.matchAll(/https?:\/\/([a-zA-Z0-9.\-]+)/g)].map(m => m[1]));
    const want = new Set(hosts);
    const diff = [...found].filter(h => !want.has(h)).concat([...want].filter(h => !found.has(h)));
    if (diff.length) throw new Error(`${name}: badge hosts differ: ${diff.join(", ")}`);
    if (links.length !== want.size || !links.every(a => a.includes('target="_blank"') && a.includes('rel="noopener"')))
      throw new Error(`${name}: every badge link must open in a new tab`);
    if ((b.match(/https?:\/\//g) || []).length !== links.length) throw new Error(`${name}: an address in the badge outside a link`);
    return b;
  },
  /* Nothing is fetched from anywhere: only the listed origins may appear
     outside the badge (the SVG namespace, the page's own address). */
  externalUrls(page, name, allowed, badgeBlock = "") {
    const rest = badgeBlock ? page.split(badgeBlock).join("") : page;
    const found = [...new Set([...rest.matchAll(/https?:\/\/[a-zA-Z0-9.\-]+/g)].map(m => m[0]))];
    const bad = found.filter(u => !allowed.includes(u)).sort();
    if (bad.length) throw new Error(`${name}: external addresses in the page: ${bad.join(", ")}`);
  },
};

/* ------------------------------------------------------------------- zip */
/* A ZIP of deflated files with a fixed timestamp, so the same build gives a
   byte-identical package. entries: [[name, string or Buffer], ...] */
function zip(entries) {
  const DOS_TIME = 0, DOS_DATE = (0 << 9) | (1 << 5) | 1;   /* 1980-01-01 00:00 */
  const locals = [], centrals = [];
  let offset = 0;
  for (const [name, content] of entries) {
    const data = Buffer.isBuffer(content) ? content : Buffer.from(content, "utf8");
    const comp = zlib.deflateRawSync(data, { level: 9 });
    const crc = zlib.crc32(data) >>> 0;
    const nameBuf = Buffer.from(name, "utf8");
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0); local.writeUInt16LE(20, 4); local.writeUInt16LE(0, 6);
    local.writeUInt16LE(8, 8); local.writeUInt16LE(DOS_TIME, 10); local.writeUInt16LE(DOS_DATE, 12);
    local.writeUInt32LE(crc, 14); local.writeUInt32LE(comp.length, 18); local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(nameBuf.length, 26); local.writeUInt16LE(0, 28);
    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0); central.writeUInt16LE((3 << 8) | 20, 4); central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0, 8); central.writeUInt16LE(8, 10); central.writeUInt16LE(DOS_TIME, 12);
    central.writeUInt16LE(DOS_DATE, 14); central.writeUInt32LE(crc, 16); central.writeUInt32LE(comp.length, 20);
    central.writeUInt32LE(data.length, 24); central.writeUInt16LE(nameBuf.length, 28);
    central.writeUInt16LE(0, 30); central.writeUInt16LE(0, 32); central.writeUInt16LE(0, 34);
    central.writeUInt16LE(0, 36); central.writeUInt32LE((0o100644 << 16) >>> 0, 38); central.writeUInt32LE(offset, 42);
    locals.push(local, nameBuf, comp);
    centrals.push(central, nameBuf);
    offset += local.length + nameBuf.length + comp.length;
  }
  const cd = Buffer.concat(centrals);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(0, 4); end.writeUInt16LE(0, 6);
  end.writeUInt16LE(entries.length, 8); end.writeUInt16LE(entries.length, 10); end.writeUInt32LE(cd.length, 12);
  end.writeUInt32LE(offset, 16); end.writeUInt16LE(0, 20);
  return Buffer.concat([...locals, cd, end]);
}

/* ------------------------------------------------------------- _headers */
/* A site's HTTP headers (Cloudflare Workers static assets read _headers):
   the same safety headers on every file, the page's Content-Security-Policy,
   a charset on the HTML (a page served without one once showed mojibake),
   HTML always revalidated so a release shows at once, and the link preview
   image cached for a week (its address carries a content hash). */
function siteHeaders(csp, extra = "") {
  const page = `  Content-Type: text/html; charset=utf-8
  Cache-Control: public, max-age=0, must-revalidate
`;
  return `/*
  X-Content-Type-Options: nosniff
  Referrer-Policy: no-referrer
  X-Frame-Options: SAMEORIGIN
  Permissions-Policy: geolocation=(), camera=(), microphone=(), payment=()
  Content-Security-Policy: ${csp}

/
${page}
/index.html
${page}
/og.png
  Cache-Control: public, max-age=604800
` + extra;
}

/* Cloudflare Web Analytics: the zone injects its cookieless beacon into the
   pages it serves, and the visitor counts of Boarding, Scenario Library and
   the Battlezone Generator come from it. Their CSPs allow it (the Registry and
   the Meta Almanac keep theirs closed: connect-src 'none'). The beacon reports
   to the site's own /cdn-cgi/rum, hence 'self'. */
const BEACON = { script: "https://static.cloudflareinsights.com", connect: "'self' https://cloudflareinsights.com" };

const sha = s => crypto.createHash("sha256").update(s).digest("hex");
const kB = n => (n / 1024).toFixed(0).padStart(6) + " kB";

module.exports = { REPO, DIST, abs, read, readBytes, write, copy, expandIncludes, fill, bundle, badge, guards, zip, sha, kB, siteHeaders, BEACON };
