/* The link preview layouts: each is a 1200 x 630 HTML page around the app's
   picture (shots.js) and its facts (facts.js), photographed by tools/og.js.
   The fonts are the ones the apps embed (packages/ui/fonts.css), so the image
   comes out the same on any machine with Chrome.

   style(f, shot) -> HTML. f: facts.js; shot: { src (data URL), w, h } */
"use strict";
const fs = require("fs"), path = require("path");
const FONTS = fs.readFileSync(path.join(__dirname, "..", "..", "packages", "ui", "fonts.css"), "utf8");

const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const host = f => f.url.replace(/^https:\/\//, "").replace(/\/$/, "");
const page = (css, body) => `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${FONTS}
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:1200px;height:630px;overflow:hidden}
body{font-family:'IBM Plex Sans',sans-serif;-webkit-font-smoothing:antialiased}
.nar{font-family:'Archivo Narrow',sans-serif}.mono{font-family:'IBM Plex Mono',monospace}
${css}</style></head><body>${body}</body></html>`;
/* a tall picture (a phone screen) or a wide one (a card, a map) */
const tall = shot => shot.h > shot.w * 1.05;
/* the picture's size inside a box of maxW x maxH, nothing cut off */
const fit = (shot, maxW, maxH) => { const k = Math.min(maxW / shot.w, maxH / shot.h); return { w: Math.round(shot.w * k), h: Math.round(shot.h * k) }; };
const statRow = (f, cls) => f.stats.map(s => `<div class="${cls}"><b>${esc(s.n)}</b><span>${esc(s.label)}</span></div>`).join("");

const STYLES = {
  /* The October 2026 Registry image, for every app: dark slate, a bar of the
     app's colour on the left, the name, the numbers in boxes, the picture on
     the right. */
  classic(f, shot) {
    const t = tall(shot), z = fit(shot, t ? 330 : 620, 574), right = t ? 60 : 30;
    const lw = Math.min(640, 1200 - right - z.w - 54 - 44);
    return page(`
body{background:#211F20;color:#F3EEE6}
.bar{position:absolute;left:0;top:0;bottom:0;width:10px;background:${f.accent}}
.l{position:absolute;left:54px;top:0;bottom:0;width:${lw}px;display:flex;flex-direction:column;justify-content:center}
h1{font-size:62px;line-height:1.06;font-weight:700;letter-spacing:.5px}
.rule{height:3px;background:${f.accent};margin:20px 0 26px;width:100%}
.tag{font-size:25px;line-height:1.3;color:#CFC8BE;font-weight:300}
.tag b{color:${f.accent};font-weight:500}
.stats{display:flex;gap:10px;margin-top:34px}
.st{flex:1;background:#2E2B2C;padding:16px 14px 12px;border-top:5px solid ${f.accent}}
.st:nth-child(2){border-color:#4C7FB8}.st:nth-child(3){border-color:#6FA36B}
.st b{display:block;font-size:40px;font-weight:600;line-height:1}.st span{font-size:19px;color:#CFC8BE}
ul{list-style:none;margin-top:30px;font-size:21px;color:#B7B0A6;line-height:1.45;font-weight:300}
ul li:before{content:"-  ";color:#8A847C}
.pic{position:absolute;right:${right}px;top:${Math.round((630 - z.h) / 2)}px}
.pic img{display:block;width:${z.w}px;height:${z.h}px;${t ? "border-radius:22px;border:6px solid #3A3637;" : ""}box-shadow:0 12px 40px rgba(0,0,0,.5)}`,
      `<div class="bar"></div><div class="l"><h1>${f.head.map(esc).join("<br>")}</h1><div class="rule"></div>
<div class="tag">${esc(f.tagline)} for<br><b>Battlefleet Gothic: Remastered</b></div>
<div class="stats">${statRow(f, "st")}</div><ul>${f.bullets.map(b => "<li>" + esc(b) + "</li>").join("")}</ul></div>
<div class="pic"><img src="${shot.src}"></div>`);
  },

  /* The app fills the frame; the name sits on a dark fade at the bottom. */
  poster(f, shot) {
    return page(`
body{background:#07080B;color:#fff}
.bg{position:absolute;inset:0;background:url(${shot.src}) ${tall(shot) ? "center 20%/cover" : "center top/cover"} no-repeat;filter:saturate(1.1)}
.fade{position:absolute;inset:0;background:linear-gradient(180deg,rgba(7,8,11,0) 20%,rgba(7,8,11,.82) 58%,#07080B 92%)}
.k{position:absolute;left:56px;top:40px;font-size:18px;letter-spacing:4px;text-transform:uppercase;color:#fff;
  background:rgba(7,8,11,.7);padding:8px 14px;border-left:4px solid ${f.accent}}
.t{position:absolute;left:56px;right:56px;bottom:48px}
h1{font-size:92px;line-height:.92;font-weight:700;text-transform:uppercase;letter-spacing:1px}
h1 em{font-style:normal;color:${f.accent}}
.row{display:flex;align-items:flex-end;gap:36px;margin-top:22px}
.tag{font-size:24px;color:#C9CED8;flex:1;line-height:1.3}
.n{text-align:right}.n b{display:block;font-size:44px;font-weight:600;line-height:1;color:#fff}
.n span{font-size:16px;letter-spacing:2px;text-transform:uppercase;color:#9AA3B2}`,
      `<div class="bg"></div><div class="fade"></div><div class="k mono">Battlefleet Gothic · free</div>
<div class="t"><h1 class="nar">${esc(f.head[0])} <em>${esc(f.head[1])}</em></h1>
<div class="row"><div class="tag">${esc(f.tagline)}.<br><span class="mono" style="font-size:18px;color:#8C95A5">${esc(host(f))}</span></div>
${statRow(f, "n")}</div></div>`);
  },

  /* Gothic: near black and old gold, a framed window onto the app, the
     numbers as an inscription. */
  gothic(f, shot) {
    const t = tall(shot), z = fit(shot, t ? 300 : 520, 500);
    return page(`
body{background:radial-gradient(ellipse at 70% 40%,#2A2230 0,#120F15 60%,#0A080C 100%);color:#EADFC8}
.frame{position:absolute;inset:18px;border:1px solid #6E5A35;outline:1px solid #3A3020;outline-offset:6px}
.l{position:absolute;left:70px;top:76px;width:${t ? 660 : 520}px}
.k{font-size:17px;letter-spacing:6px;color:#B8975A;text-transform:uppercase}
h1{font-family:Georgia,'Times New Roman',serif;font-size:66px;line-height:1.02;font-weight:400;margin:18px 0 0;color:#F1E4C6;letter-spacing:1px}
.orn{display:flex;align-items:center;gap:14px;margin:24px 0;color:#B8975A}
.orn:before,.orn:after{content:"";height:1px;flex:1;background:linear-gradient(90deg,transparent,#B8975A,transparent)}
.tag{font-size:23px;line-height:1.4;color:#CDBFA4;font-style:italic;font-family:Georgia,serif}
.ins{display:flex;gap:0;margin-top:34px;border-top:1px solid #4E4128;border-bottom:1px solid #4E4128}
.ins div{flex:1;padding:14px 0;text-align:center}.ins div+div{border-left:1px solid #4E4128}
.ins b{display:block;font-family:Georgia,serif;font-size:40px;color:#E9C77A;font-weight:400}
.ins span{font-size:14px;letter-spacing:3px;text-transform:uppercase;color:#A89878}
.ft{position:absolute;left:70px;bottom:44px;font-size:15px;letter-spacing:2px;color:#7F7158}
.win{position:absolute;right:${t ? 84 : 56}px;top:${Math.round((630 - z.h) / 2) - 8}px;padding:8px;
  border:1px solid #8A7040;background:#0A080C;box-shadow:0 0 0 6px #17121B,0 0 0 7px #4E4128,0 18px 50px rgba(0,0,0,.6)}
.win img{display:block;width:${z.w}px;height:${z.h}px}`,
      `<div class="frame"></div><div class="l"><div class="k">Battlefleet Gothic · Remastered</div>
<h1>${f.head.map(esc).join("<br>")}</h1><div class="orn">✦</div><div class="tag">${esc(f.tagline)}.</div>
<div class="ins">${f.stats.map(s => `<div><b>${esc(s.n)}</b><span>${esc(s.label)}</span></div>`).join("")}</div></div>
<div class="ft mono">${esc(host(f))} · ${esc(f.books)}</div><div class="win"><img src="${shot.src}"></div>`);
  },

  /* The picture tilted in perspective off the right edge, a glow of the
     app's colour behind it. */
  tilt(f, shot) {
    const t = tall(shot);
    return page(`
body{background:#0B0D12;color:#EEF1F6;overflow:hidden}
.glow{position:absolute;right:-120px;top:-80px;width:900px;height:800px;background:radial-gradient(circle,${f.accent}55 0,transparent 62%)}
.grid{position:absolute;inset:0;background-image:linear-gradient(#ffffff08 1px,transparent 1px),linear-gradient(90deg,#ffffff08 1px,transparent 1px);background-size:40px 40px}
.stage{position:absolute;right:${t ? 40 : -150}px;top:${t ? 30 : 70}px;perspective:1600px}
.stage img{display:block;${t ? "height:600px" : "width:820px"};transform:rotateY(-18deg) rotateX(6deg) rotateZ(1deg);
  border-radius:${t ? 26 : 8}px;box-shadow:-30px 40px 80px rgba(0,0,0,.7),0 0 0 1px #ffffff22}
.l{position:absolute;left:60px;top:84px;width:520px}
.k{display:inline-block;font-size:15px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:#0B0D12;background:${f.accent};padding:6px 12px;border-radius:4px}
h1{font-size:76px;line-height:.96;font-weight:700;margin-top:22px;letter-spacing:-.5px}
.tag{font-size:24px;line-height:1.35;color:#AAB2C0;margin-top:20px}
.stats{display:flex;gap:28px;margin-top:40px}
.s b{display:block;font-size:46px;font-weight:600;line-height:1;color:#fff}.s span{font-size:16px;color:#8F98A8;text-transform:uppercase;letter-spacing:1.5px}
.u{position:absolute;left:60px;bottom:44px;font-size:18px;color:${f.accent}}`,
      `<div class="grid"></div><div class="glow"></div><div class="stage"><img src="${shot.src}"></div>
<div class="l"><span class="k">Free · Battlefleet Gothic</span><h1 class="nar">${f.head.map(esc).join("<br>")}</h1>
<div class="tag">${esc(f.tagline)}.</div><div class="stats">${statRow(f, "s")}</div></div><div class="u mono">${esc(host(f))}</div>`);
  },

  /* One family: the same BFG Tools header on every app, the app's colour as
     the only difference, the book versions in the footer. */
  suite(f, shot) {
    const t = tall(shot), z = fit(shot, t ? 300 : 600, 440);
    return page(`
body{background:#F4F1EA;color:#1C1B1F}
.top{position:absolute;left:0;right:0;top:0;height:64px;background:#1C1B1F;color:#F4F1EA;display:flex;align-items:center;padding:0 48px;gap:16px;font-size:20px}
.top b{letter-spacing:3px}.top i{font-style:normal;color:#9C978E}
.dots{margin-left:auto;display:flex;gap:8px}.dots span{width:14px;height:14px;border-radius:50%;background:#4A474E}
.dots span.on{background:${f.accent}}
.l{position:absolute;left:48px;top:108px;width:${t ? 700 : 500}px}
h1{font-size:64px;line-height:1;font-weight:700;letter-spacing:-.5px}
h1 span{color:${f.accent}}
.tag{font-size:24px;line-height:1.35;color:#4D4A52;margin-top:18px}
.stats{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:34px}
.st{background:#fff;border:1px solid #DDD7CC;border-radius:10px;padding:14px 16px}
.st b{display:block;font-size:38px;font-weight:600;line-height:1.05}.st span{font-size:16px;color:#6B6670}
.ft{position:absolute;left:48px;right:48px;bottom:30px;display:flex;justify-content:space-between;font-size:17px;color:#6B6670;border-top:1px solid #DDD7CC;padding-top:14px}
.pic{position:absolute;right:${t ? 70 : 40}px;top:${84 + Math.round((450 - z.h) / 2)}px;border-radius:12px;overflow:hidden;box-shadow:0 18px 50px rgba(28,27,31,.28);border:1px solid #CFC8BB}
.pic img{display:block;width:${z.w}px;height:${z.h}px}`,
      `<div class="top nar"><b>BFG TOOLS</b><i>free tools for Battlefleet Gothic: Remastered</i><div class="dots">${
        ["registry", "play", "scenarios", "boarding", "terrain"].map(a => `<span class="${a === f.id ? "on" : ""}"></span>`).join("")}</div></div>
<div class="l"><h1 class="nar">${esc(f.head[0])}<br><span>${esc(f.head[1])}</span></h1><div class="tag">${esc(f.tagline)}.</div>
<div class="stats">${statRow(f, "st")}</div></div><div class="pic"><img src="${shot.src}"></div>
<div class="ft mono"><span>${esc(host(f))}</span><span>${esc(f.books)}</span></div>`);
  },

  /* The first number is the headline; everything else is small. */
  number(f, shot) {
    const [a, ...rest] = f.stats;
    return page(`
body{background:${f.accent};color:#111}
.pic{position:absolute;right:0;top:0;bottom:0;width:560px;background:url(${shot.src}) left top/cover no-repeat;
  -webkit-mask-image:linear-gradient(90deg,transparent 0,#000 30%);opacity:.95}
.l{position:absolute;left:56px;top:50px;width:640px}
.k{font-size:24px;font-weight:700;letter-spacing:4px;text-transform:uppercase}
.big{font-size:230px;line-height:.86;font-weight:700;letter-spacing:-6px;margin-top:18px}
.lab{font-size:44px;font-weight:600;margin-top:4px}
.rest{display:flex;gap:30px;margin-top:26px;font-size:24px}.rest b{font-weight:700}
.tag{position:absolute;left:56px;bottom:46px;font-size:22px;max-width:600px;line-height:1.3}
.tag span{display:block;font-size:17px;opacity:.75;margin-top:6px}`,
      `<div class="pic"></div><div class="l"><div class="k nar">${esc(f.head.join(" "))}</div><div class="big nar">${esc(a.n)}</div>
<div class="lab">${esc(a.label)}</div><div class="rest">${rest.map(s => `<div><b>${esc(s.n)}</b> ${esc(s.label)}</div>`).join("")}</div></div>
<div class="tag">${esc(f.tagline)}.<span class="mono">${esc(host(f))}</span></div>`);
  },

  /* Made for the size a chat shows it at (about 400 px wide): one name, one
     number, one picture, nothing under 22 px. The picture bleeds off the
     right and bottom edges, behind a sheared panel of the app's colour. */
  bleed(f, shot) {
    const t = tall(shot), [a] = f.stats;
    const z = t ? fit(shot, 420, 760) : fit(shot, 760, 760);
    return page(`
body{background:#0E0F13;color:#F4F2EC}
.pic{position:absolute;right:${t ? 90 : -60}px;top:${t ? 60 : 50}px;width:${z.w}px;height:${z.h}px;
  border-radius:${t ? 28 : 6}px;overflow:hidden;box-shadow:0 30px 80px rgba(0,0,0,.7),0 0 0 1px #ffffff1a}
.pic img{display:block;width:100%;height:100%}
.pic:after{content:"";position:absolute;inset:0;background:linear-gradient(90deg,#0E0F13 0,transparent 32%)}
.wedge{position:absolute;left:-80px;top:0;bottom:0;width:${t ? 640 : 600}px;background:#0E0F13;transform:skewX(-8deg);
  border-right:6px solid ${f.accent};box-shadow:30px 0 60px rgba(14,15,19,.85)}
.l{position:absolute;left:56px;top:0;bottom:0;width:470px;display:flex;flex-direction:column;justify-content:center}
.k{font-size:22px;letter-spacing:5px;text-transform:uppercase;color:${f.accent};font-weight:600}
h1{font-size:${f.head.join(" ").length > 17 ? 92 : 104}px;line-height:.9;font-weight:700;text-transform:uppercase;margin-top:14px;letter-spacing:-1px}
.n{margin-top:34px;display:flex;align-items:baseline;gap:14px}
.n b{font-size:88px;line-height:1;font-weight:700;color:${f.accent}}.n span{font-size:30px;color:#C9C4B8}
.tag{font-size:25px;line-height:1.3;color:#9A968E;margin-top:22px;max-width:440px}
.u{font-size:22px;color:#6F6B64;margin-top:26px}`,
      `<div class="pic"><img src="${shot.src}"></div><div class="wedge"></div>
<div class="l"><div class="k mono">Battlefleet Gothic</div><h1 class="nar">${f.head.map(esc).join("<br>")}</h1>
<div class="n"><b class="nar">${esc(a.n)}</b><span>${esc(a.label)}</span></div><div class="tag">${esc(f.tagline)}.</div>
<div class="u mono">${esc(host(f))}</div></div>`);
  },

  /* An Imperial data-slate: a terminal readout in monospace, the picture as
     the slate's screen, the facts as a transmission header. */
  slate(f, shot) {
    const t = tall(shot), z = fit(shot, t ? 330 : 560, 470);
    return page(`
body{background:#0B0D0C;color:#CFE3C8;font-family:'IBM Plex Mono',monospace}
body:before{content:"";position:absolute;inset:0;background:repeating-linear-gradient(0deg,transparent 0 3px,#00000055 3px 4px);pointer-events:none;z-index:3}
.hdr{position:absolute;left:0;right:0;top:0;height:54px;background:${f.accent};color:#0B0D0C;display:flex;align-items:center;padding:0 44px;font-size:20px;letter-spacing:4px;font-weight:700;text-transform:uppercase}
.hdr span{margin-left:auto;font-weight:400;letter-spacing:2px}
.stripe{position:absolute;left:0;right:0;top:54px;height:10px;background:repeating-linear-gradient(135deg,${f.accent} 0 16px,#0B0D0C 16px 32px)}
.l{position:absolute;left:44px;top:100px;width:${1200 - 44 - (z.w + 24) - (t ? 90 : 44) - 40 - 44}px}
.k{font-size:17px;letter-spacing:3px;color:#6F8F6A}
h1{font-family:'Archivo Narrow',sans-serif;font-size:74px;line-height:.95;text-transform:uppercase;color:#F0F5EA;margin:14px 0 24px;letter-spacing:1px}
.r{display:flex;justify-content:space-between;border-top:1px solid #243126;padding:10px 0;font-size:22px}
.r span{color:#8FAF88}.r b{color:#F0F5EA;font-weight:600}
.r.hi b{color:${f.accent};font-size:30px}
.scr{position:absolute;${t ? "right:90px;top:88px" : "right:44px;top:100px"};width:${z.w + 24}px;padding:12px;background:#121614;border:2px solid #2E3D30;border-radius:6px;box-shadow:inset 0 0 40px #000,0 0 30px ${f.accent}33}
.scr img{display:block;width:${z.w}px;height:${z.h}px;filter:contrast(1.05)}
.scr i{position:absolute;left:12px;top:-14px;background:#0B0D0C;padding:0 8px;font-size:14px;letter-spacing:3px;font-style:normal;color:${f.accent}}
.ft{position:absolute;left:44px;right:44px;bottom:26px;font-size:16px;letter-spacing:2px;color:#4F6A4C;display:flex;justify-content:space-between}`,
      `<div class="hdr">++ ${esc(f.head.join(" "))} ++<span>${esc(host(f))}</span></div><div class="stripe"></div>
<div class="l"><div class="k">// TRANSMISSION: ${esc(f.tagline)}</div><h1>${f.head.map(esc).join("<br>")}</h1>
${f.stats.map((s, i) => `<div class="r${i ? "" : " hi"}"><span>${esc(s.label)}</span><b>${esc(s.n)}</b></div>`).join("")}</div>
<div class="scr"><i>PICT-FEED</i><img src="${shot.src}"></div>
<div class="ft"><span>FREE // NO INSTALL // WORKS OFFLINE</span><span>SOURCE: ${esc(f.books).toUpperCase()}</span></div>`);
  },
};

module.exports = { STYLES };
