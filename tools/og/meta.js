/* The link preview tags of an app's site page, from the same facts as its
   image (facts.js): Discord, Slack, WhatsApp and the like read og:*, X reads
   twitter:*. Only the published page gets them; the one-file packages are
   opened from a disk, where a preview means nothing.

   addTo(html, id) -> html with the tags before </head>
   copyImage(id, outDir) -> the og.png copied next to the page */
"use strict";
const path = require("path");
const kit = require("../lib/kit.js");
const { facts } = require("./facts.js");

const attr = s => String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

function tags(id) {
  const f = facts(id);
  return [
    '<meta property="og:type" content="website">',
    `<meta property="og:site_name" content="${attr(f.title)}">`,
    `<meta property="og:title" content="${attr(f.title)}">`,
    `<meta property="og:description" content="${attr(f.description)}">`,
    `<meta property="og:url" content="${attr(f.url)}">`,
    `<meta property="og:image" content="${attr(f.image)}">`,
    '<meta property="og:image:type" content="image/png">',
    '<meta property="og:image:width" content="1200">',
    '<meta property="og:image:height" content="630">',
    `<meta property="og:image:alt" content="${attr(f.alt)}">`,
    '<meta name="twitter:card" content="summary_large_image">',
    `<meta name="twitter:image" content="${attr(f.image)}">`,
    `<link rel="canonical" href="${attr(f.url)}">`,
  ].join("\n") + "\n";
}

function addTo(html, id) {
  if (html.split("</head>").length !== 2) throw new Error(id + ": one </head> expected for the link preview tags");
  if (/property="og:/.test(html)) throw new Error(id + ": the page has og: tags of its own; they come from tools/og/meta.js");
  return html.replace("</head>", tags(id) + "</head>");
}

const copyImage = (id, outDir) => kit.copy(path.join("apps", id, "assets", "og.png"), path.posix.join(outDir, "og.png"));

module.exports = { tags, addTo, copyImage };
