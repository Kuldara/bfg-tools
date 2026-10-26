import { KIND, extents, makeRng } from "../../../packages/battlezone/core.js";

/* ═══════════════════════════════════════════════════════════════ DRAWING
   Colours come from the stylesheet at draw time, so the chart follows the
   reader's theme instead of carrying a second, stale palette of its own. */

export const canvas = document.getElementById('chart');
export const ctx = canvas.getContext('2d');
export let current = null;
export let starfield = null;
export let view = null;        // { s, ox, oy } from the last draw, for hit testing
export let selected = null;    // the piece whose rules are showing, or null for the battlezone

export function tok(name) {
  return getComputedStyle(document.documentElement).getPropertyValue('--' + name).trim();
}

export function makeStars(seed, W, H) {
  const r = makeRng((seed ^ 0x9E3779B9) >>> 0);
  const out = [];
  for (let i = 0; i < 380; i++) {
    out.push({ x: r() * W, y: r() * H, r: 0.05 + r() * 0.16, a: 0.12 + r() * 0.6 });
  }
  return out;
}

export function draw() {
  if (!current) return;
  const m = current.meta;
  const dpr = Math.min(2, window.devicePixelRatio || 1);

  // fit the canvas box to the table's proportions, then to the column width
  const cssW = canvas.parentElement.clientWidth - 24;
  const pad = 26;
  const cssH = Math.max(220, Math.min(620, Math.round((cssW - pad * 2) * (m.H / m.W)) + pad * 2));
  canvas.style.height = cssH + 'px';
  canvas.width = Math.round(cssW * dpr);
  canvas.height = Math.round(cssH * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const s = Math.min((cssW - pad * 2) / m.W, (cssH - pad * 2) / m.H);
  const ox = (cssW - m.W * s) / 2, oy = (cssH - m.H * s) / 2;
  view = { s: s, ox: ox, oy: oy };           // kept so a click can be turned back into cm
  const X = function (cm) { return ox + cm * s; };
  const Y = function (cm) { return oy + cm * s; };
  const L = function (cm) { return cm * s; };

  const C = {
    bg: tok('chart-bg'), grid: tok('chart-grid'), sect: tok('chart-sect'),
    frame: tok('chart-frame'), label: tok('chart-label'), star: tok('chart-star'),
    sun: tok('sun'), ast: tok('ast'), gas: tok('gas'),
    pln: tok('pln'), moon: tok('moon'), rift: tok('rift')
  };
  const mono = '"IBM Plex Mono", ui-monospace, monospace';

  ctx.clearRect(0, 0, cssW, cssH);

  /* table ground */
  ctx.fillStyle = C.bg;
  ctx.fillRect(X(0), Y(0), L(m.W), L(m.H));

  /* starfield — only where the ground is dark enough to carry it */
  if (C.star && C.star !== 'transparent') {
    if (!starfield || starfield.seed !== m.seed) {
      starfield = { seed: m.seed, stars: makeStars(m.seed, m.W, m.H) };
    }
    ctx.save();
    ctx.beginPath(); ctx.rect(X(0), Y(0), L(m.W), L(m.H)); ctx.clip();
    for (const st of starfield.stars) {
      ctx.globalAlpha = st.a;
      ctx.fillStyle = C.star;
      ctx.beginPath(); ctx.arc(X(st.x), Y(st.y), Math.max(0.4, L(st.r)), 0, 7); ctx.fill();
    }
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  /* 10 cm grid */
  ctx.strokeStyle = C.grid; ctx.lineWidth = 1; ctx.beginPath();
  for (let x = 10; x < m.W; x += 10) { ctx.moveTo(X(x), Y(0)); ctx.lineTo(X(x), Y(m.H)); }
  for (let y = 10; y < m.H; y += 10) { ctx.moveTo(X(0), Y(y)); ctx.lineTo(X(m.W), Y(y)); }
  ctx.stroke();

  /* area grid, plus each area's number for the log to refer to */
  ctx.strokeStyle = C.sect; ctx.lineWidth = 1; ctx.setLineDash([5, 4]); ctx.beginPath();
  for (let x = m.sector; x < m.W; x += m.sector) { ctx.moveTo(X(x), Y(0)); ctx.lineTo(X(x), Y(m.H)); }
  for (let y = m.sector; y < m.H; y += m.sector) { ctx.moveTo(X(0), Y(y)); ctx.lineTo(X(m.W), Y(y)); }
  ctx.stroke(); ctx.setLineDash([]);

  ctx.fillStyle = C.label; ctx.font = '500 10px ' + mono;
  for (const a of m.areas) ctx.fillText(String(a.n), X(a.x0) + 4, Y(a.y0) + 12);

  /* the templates */
  for (const t of current.terrain) {
    if (t.kind === 'ring') {
      const col = t.ringKind === 'gas' ? C.gas : C.ast;
      ctx.save();
      ctx.beginPath(); ctx.rect(X(0), Y(0), L(m.W), L(m.H)); ctx.clip();
      ctx.strokeStyle = col;
      ctx.globalAlpha = 0.5;
      ctx.lineWidth = Math.max(1, L(t.outer - t.inner));
      ctx.beginPath();
      ctx.arc(X(t.x), Y(t.y), L((t.inner + t.outer) / 2), 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.restore();
      continue;
    }

    const col = C[KIND[t.kind].colour];
    const seed = (t.id.charCodeAt(0) * 2654435761 + parseInt(t.id.slice(1), 10) * 40503) >>> 0;
    const rnd = makeRng(seed || 1);

    if (t.kind === 'planet' || t.kind === 'moon') {
      // round bodies are drawn in table coordinates; only bands need rotating
      // gravity well first, so the planet sits on top of it
      ctx.strokeStyle = col; ctx.globalAlpha = 0.42; ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.arc(X(t.x), Y(t.y), L(t.rx + t.gravity), 0, Math.PI * 2); ctx.stroke();
      ctx.setLineDash([]); ctx.globalAlpha = 1;

      const g = ctx.createRadialGradient(
        X(t.x) - L(t.rx) * 0.35, Y(t.y) - L(t.ry) * 0.35, L(t.rx) * 0.08,
        X(t.x), Y(t.y), Math.max(1, L(t.rx)));
      g.addColorStop(0, col);
      g.addColorStop(1, C.bg);
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(X(t.x), Y(t.y), L(t.rx), 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = col; ctx.lineWidth = 1.2;
      ctx.stroke();
      for (let i = 0; i < (t.kind === 'planet' ? 11 : 5); i++) {
        const a = rnd() * Math.PI * 2, r = Math.sqrt(rnd()) * L(t.rx) * 0.66;
        ctx.globalAlpha = 0.22; ctx.fillStyle = C.frame;
        ctx.beginPath();
        ctx.arc(X(t.x) + Math.cos(a) * r, Y(t.y) + Math.sin(a) * r, Math.max(0.6, L(0.15 + rnd() * 0.3)), 0, 7);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      continue;
    }

    ctx.save();
    ctx.translate(X(t.x), Y(t.y));
    ctx.rotate(t.angle || 0);

    if (t.kind === 'rift') {
      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, Math.max(1, L(Math.max(t.rx, t.ry))));
      g.addColorStop(0, col); g.addColorStop(1, C.bg);
      ctx.globalAlpha = 0.5; ctx.fillStyle = g;
      ctx.beginPath(); ctx.ellipse(0, 0, L(t.rx), L(t.ry), 0, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
      ctx.strokeStyle = col; ctx.lineWidth = 1.4; ctx.setLineDash([5, 3]);
      ctx.beginPath(); ctx.ellipse(0, 0, L(t.rx), L(t.ry), 0, 0, Math.PI * 2); ctx.stroke();
      ctx.setLineDash([]);
      for (let i = 0; i < 7; i++) {
        const f = 0.25 + rnd() * 0.7;
        ctx.globalAlpha = 0.16 + rnd() * 0.26; ctx.strokeStyle = col; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.ellipse(0, 0, L(t.rx) * f, L(t.ry) * f, rnd() * Math.PI, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    } else {
      // asteroid field or gas band: dashed outline plus its own speckle
      ctx.globalAlpha = 0.13; ctx.fillStyle = col;
      ctx.beginPath(); ctx.ellipse(0, 0, L(t.rx), L(t.ry), 0, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
      ctx.strokeStyle = col; ctx.lineWidth = 1.25;
      ctx.setLineDash(t.kind === 'gas' ? [6, 5] : [4, 3]);
      ctx.beginPath(); ctx.ellipse(0, 0, L(t.rx), L(t.ry), 0, 0, Math.PI * 2); ctx.stroke();
      ctx.setLineDash([]);

      if (t.kind === 'asteroid') {
        for (let i = 0; i < 30; i++) {
          const a = rnd() * Math.PI * 2, r = Math.sqrt(rnd()) * 0.9;
          ctx.globalAlpha = 0.55 + rnd() * 0.4; ctx.fillStyle = col;
          ctx.beginPath();
          ctx.arc(Math.cos(a) * L(t.rx) * r, Math.sin(a) * L(t.ry) * r, Math.max(0.7, L(0.14 + rnd() * 0.3)), 0, 7);
          ctx.fill();
        }
      } else {
        for (let i = 0; i < 14; i++) {
          const a = rnd() * Math.PI * 2, r = Math.sqrt(rnd());
          const px = Math.cos(a) * L(t.rx) * 0.78 * r, py = Math.sin(a) * L(t.ry) * 0.7 * r;
          const rr = Math.max(2, L(0.6 + rnd() * 1.2));
          const g = ctx.createRadialGradient(px, py, 0, px, py, rr);
          g.addColorStop(0, col); g.addColorStop(1, C.bg);
          ctx.globalAlpha = 0.3; ctx.fillStyle = g;
          ctx.beginPath(); ctx.arc(px, py, rr, 0, 7); ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  }

  /* the piece whose rules are on screen gets a ring, so map and panel agree */
  if (selected && current.terrain.indexOf(selected) !== -1) {
    const e = extents(selected);
    ctx.save();
    ctx.strokeStyle = C.sun;
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.ellipse(X(selected.x), Y(selected.y),
      Math.max(6, L(e.hw) + 5), Math.max(6, L(e.hh) + 5), 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  /* template labels, sized in screen pixels so they stay legible on a phone */
  ctx.font = '600 10px ' + mono;
  ctx.textAlign = 'center';
  for (const t of current.terrain) {
    if (t.kind === 'ring') continue;
    const e = extents(t);
    if (L(Math.max(e.hw, e.hh)) < 9) continue;
    ctx.fillStyle = C[KIND[t.kind].colour];
    ctx.fillText(t.id, X(t.x), Y(t.y + e.hh) + 12);
  }
  ctx.textAlign = 'left';

  /* frame, ruler ticks and the sunward edge */
  ctx.strokeStyle = C.frame; ctx.lineWidth = 1.5;
  ctx.strokeRect(X(0), Y(0), L(m.W), L(m.H));

  ctx.strokeStyle = C.frame; ctx.lineWidth = 1; ctx.beginPath();
  for (let x = 30; x < m.W; x += 30) { ctx.moveTo(X(x), Y(0)); ctx.lineTo(X(x), Y(0) - 5); }
  for (let y = 30; y < m.H; y += 30) { ctx.moveTo(X(0), Y(y)); ctx.lineTo(X(0) - 5, Y(y)); }
  ctx.stroke();

  ctx.fillStyle = C.label; ctx.font = '400 9.5px ' + mono;
  for (let x = 30; x < m.W; x += 30) ctx.fillText(String(x), X(x) - 7, Y(0) - 9);
  for (let y = 30; y < m.H; y += 30) ctx.fillText(String(y), X(0) - 22, Y(y) + 3);
  ctx.fillText(m.W + ' × ' + m.H + ' cm', X(0), Y(m.H) + 15);

  ctx.strokeStyle = C.sun; ctx.lineWidth = 3; ctx.setLineDash([9, 5]);
  ctx.beginPath();
  if (m.sunEdge === 'top')         { ctx.moveTo(X(0), Y(0));    ctx.lineTo(X(m.W), Y(0)); }
  else if (m.sunEdge === 'bottom') { ctx.moveTo(X(0), Y(m.H));  ctx.lineTo(X(m.W), Y(m.H)); }
  else if (m.sunEdge === 'left')   { ctx.moveTo(X(0), Y(0));    ctx.lineTo(X(0), Y(m.H)); }
  else                             { ctx.moveTo(X(m.W), Y(0));  ctx.lineTo(X(m.W), Y(m.H)); }
  ctx.stroke(); ctx.setLineDash([]);

  ctx.fillStyle = C.sun; ctx.font = '600 10px ' + mono;
  const tag = 'SUNWARD  D6 = ' + m.sunDie;
  if (m.sunEdge === 'top')         ctx.fillText(tag, X(0) + 6, Y(0) + 14);
  else if (m.sunEdge === 'bottom') ctx.fillText(tag, X(0) + 6, Y(m.H) - 7);
  else {
    ctx.save();
    ctx.translate(m.sunEdge === 'left' ? X(0) + 14 : X(m.W) - 6, Y(m.H) - 6);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(tag, 0, 0);
    ctx.restore();
  }
}

/* ═══════════════════════════════════════════════════════════════ READOUT */


/* set from the other modules (a module cannot assign another's let) */
export function setCurrent(r) { current = r; }
export function setSelected(p) { selected = p; }
export function resetStarfield() { starfield = null; }
