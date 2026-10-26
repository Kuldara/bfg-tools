/* ------------------------------------------------------------ QR code --- */
/* A QR code for the link, drawn here so the page stays one file with no
   network (ISO/IEC 18004: byte mode, error correction L where it gives a
   smaller code than M, else M, the mask with the lowest penalty). Checked
   against reportlab's encoder module for module (apps/play/metrics/qr_check.py). */
export const QR = (function(){
  const ECW = [[-1,7,10,15,20,26,18,20,24,30,18,20,24,26,30,22,24,28,30,28,28,28,28,30,30,26,28,30,30,30,30,30,30,30,30,30,30,30,30,30,30],
               [-1,10,16,26,18,24,16,18,22,22,26,30,22,22,24,24,28,28,26,26,26,26,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28]];
  const NB = [[-1,1,1,1,1,1,2,2,2,2,4,4,4,4,4,6,6,6,6,7,8,8,9,9,10,12,12,12,13,14,15,16,17,18,19,19,20,21,22,24,25],
              [-1,1,1,1,2,2,4,4,4,5,5,5,8,9,9,10,10,11,13,14,16,17,17,18,20,21,23,25,26,28,29,31,33,35,37,38,40,43,45,47,49]];
  const FMT = [1, 0];   /* format bits of L and M */
  function rawModules(v){
    let r = (16 * v + 128) * v + 64;
    if(v >= 2){ const na = Math.floor(v / 7) + 2; r -= (25 * na - 10) * na - 55; if(v >= 7) r -= 36; }
    return r;
  }
  const dataCw = (v, e) => Math.floor(rawModules(v) / 8) - ECW[e][v] * NB[e][v];
  function mul(x, y){ let z = 0; for(let i = 7; i >= 0; i--){ z = (z << 1) ^ ((z >>> 7) * 0x11D); z ^= ((y >>> i) & 1) * x; } return z; }
  function divisor(deg){
    const r = []; for(let i = 0; i < deg - 1; i++) r.push(0); r.push(1);
    let root = 1;
    for(let i = 0; i < deg; i++){
      for(let j = 0; j < r.length; j++){ r[j] = mul(r[j], root); if(j + 1 < r.length) r[j] ^= r[j + 1]; }
      root = mul(root, 2);
    }
    return r;
  }
  function remainder(data, div){
    const r = div.map(() => 0);
    for(const b of data){ const f = b ^ r.shift(); r.push(0); div.forEach((c, i) => { r[i] ^= mul(c, f); }); }
    return r;
  }
  function encode(text, forceMask){
    const bytes = Array.from(new TextEncoder().encode(text));
    const fits = lv => { for(let t = 1; t <= 40; t++) if(4 + (t < 10 ? 8 : 16) + 8 * bytes.length <= dataCw(t, lv) * 8) return t; return 0; };
    /* The smallest code reads best when one phone shows it to another
       (19.10.2026): L wherever it is a smaller version than M, M where both
       are the same size. A screen is not a scuffed sticker - L's 7 %
       recovery is enough, and bigger modules matter more. */
    const vM = fits(1), vL = fits(0);
    const e = vM && vM === vL ? 1 : 0, v = e ? vM : vL;
    if(!v) throw new Error("the link is too long for a QR code");
    /* bits: byte mode, the count, the data, terminator, padding */
    const bits = [];
    const put = (val, n) => { for(let i = n - 1; i >= 0; i--) bits.push((val >>> i) & 1); };
    put(4, 4); put(bytes.length, v < 10 ? 8 : 16); bytes.forEach(b => put(b, 8));
    const cap = dataCw(v, e) * 8;
    put(0, Math.min(4, cap - bits.length));
    put(0, (8 - bits.length % 8) % 8);
    for(let pad = 0xEC; bits.length < cap; pad ^= 0xEC ^ 0x11) put(pad, 8);
    const data = []; for(let i = 0; i < bits.length; i += 8){ let b = 0; for(let j = 0; j < 8; j++) b = (b << 1) | bits[i + j]; data.push(b); }
    /* error correction, blocks interleaved */
    const nb = NB[e][v], ecl = ECW[e][v], raw = Math.floor(rawModules(v) / 8);
    const nShort = nb - raw % nb, shortLen = Math.floor(raw / nb), div = divisor(ecl);
    const blocks = [];
    for(let i = 0, k = 0; i < nb; i++){
      const dat = data.slice(k, k + shortLen - ecl + (i < nShort ? 0 : 1)); k += dat.length;
      const ecc = remainder(dat, div);
      if(i < nShort) dat.push(0);
      blocks.push(dat.concat(ecc));
    }
    const cw = [];
    for(let i = 0; i < blocks[0].length; i++) blocks.forEach((b, j) => { if(i !== shortLen - ecl || j >= nShort) cw.push(b[i]); });
    /* the matrix */
    const size = v * 4 + 17;
    const M = [], F = [];
    for(let y = 0; y < size; y++){ M.push(new Array(size).fill(false)); F.push(new Array(size).fill(false)); }
    const fn = (x, y, d) => { M[y][x] = d; F[y][x] = true; };
    for(let i = 0; i < size; i++){ fn(6, i, i % 2 === 0); fn(i, 6, i % 2 === 0); }
    const finder = (cx, cy) => { for(let dy = -4; dy <= 4; dy++) for(let dx = -4; dx <= 4; dx++){
      const d = Math.max(Math.abs(dx), Math.abs(dy)), x = cx + dx, y = cy + dy;
      if(x >= 0 && x < size && y >= 0 && y < size) fn(x, y, d !== 2 && d !== 4); } };
    finder(3, 3); finder(size - 4, 3); finder(3, size - 4);
    const al = [];
    if(v > 1){
      const na = Math.floor(v / 7) + 2, step = Math.floor((v * 8 + na * 3 + 5) / (na * 4 - 4)) * 2;
      for(let pos = size - 7; al.length < na - 1; pos -= step) al.unshift(pos);
      al.unshift(6);
    }
    al.forEach((ax, i) => al.forEach((ay, j) => {
      if((i === 0 && j === 0) || (i === 0 && j === al.length - 1) || (i === al.length - 1 && j === 0)) return;
      for(let dy = -2; dy <= 2; dy++) for(let dx = -2; dx <= 2; dx++) fn(ax + dx, ay + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
    }));
    const format = mask => {
      const d = FMT[e] << 3 | mask;
      let r = d; for(let i = 0; i < 10; i++) r = (r << 1) ^ ((r >>> 9) * 0x537);
      const b = (d << 10 | r) ^ 0x5412, bit = i => ((b >>> i) & 1) === 1;
      for(let i = 0; i <= 5; i++) fn(8, i, bit(i));
      fn(8, 7, bit(6)); fn(8, 8, bit(7)); fn(7, 8, bit(8));
      for(let i = 9; i < 15; i++) fn(14 - i, 8, bit(i));
      for(let i = 0; i < 8; i++) fn(size - 1 - i, 8, bit(i));
      for(let i = 8; i < 15; i++) fn(8, size - 15 + i, bit(i));
      fn(8, size - 8, true);
    };
    format(0);
    if(v >= 7){
      let r = v; for(let i = 0; i < 12; i++) r = (r << 1) ^ ((r >>> 11) * 0x1F25);
      const b = v << 12 | r;
      for(let i = 0; i < 18; i++){ const d = ((b >>> i) & 1) === 1, a = size - 11 + i % 3, c = Math.floor(i / 3); fn(a, c, d); fn(c, a, d); }
    }
    let bi = 0;
    for(let right = size - 1; right >= 1; right -= 2){
      if(right === 6) right = 5;
      for(let vert = 0; vert < size; vert++) for(let j = 0; j < 2; j++){
        const x = right - j, up = ((right + 1) & 2) === 0, y = up ? size - 1 - vert : vert;
        if(!F[y][x] && bi < cw.length * 8){ M[y][x] = ((cw[bi >>> 3] >>> (7 - (bi & 7))) & 1) === 1; bi++; }
      }
    }
    const inv = (m, x, y) => m === 0 ? (x + y) % 2 === 0 : m === 1 ? y % 2 === 0 : m === 2 ? x % 3 === 0 : m === 3 ? (x + y) % 3 === 0 :
      m === 4 ? (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0 : m === 5 ? (x * y) % 2 + (x * y) % 3 === 0 :
      m === 6 ? ((x * y) % 2 + (x * y) % 3) % 2 === 0 : ((x + y) % 2 + (x * y) % 3) % 2 === 0;
    const applyMask = m => { for(let y = 0; y < size; y++) for(let x = 0; x < size; x++) if(!F[y][x] && inv(m, x, y)) M[y][x] = !M[y][x]; };
    /* the penalty of ISO 18004 8.8.2, simplified only in the finder-like
       pattern count (a 1:1:3:1:1 run with four light modules on one side) */
    const penalty = () => {
      let p = 0, dark = 0;
      const line = get => {
        let run = 1, s = 0;
        for(let i = 1; i < size; i++){ if(get(i) === get(i - 1)) run++; else { if(run >= 5) s += run - 2; run = 1; } }
        if(run >= 5) s += run - 2;
        for(let i = 0; i + 6 < size; i++){
          if(get(i) && !get(i + 1) && get(i + 2) && get(i + 3) && get(i + 4) && !get(i + 5) && get(i + 6)){
            const before = [1, 2, 3, 4].every(k => i - k < 0 || !get(i - k)), after = [1, 2, 3, 4].every(k => i + 6 + k >= size || !get(i + 6 + k));
            if(before || after) s += 40;
          }
        }
        return s;
      };
      for(let y = 0; y < size; y++) p += line(i => M[y][i]);
      for(let x = 0; x < size; x++) p += line(i => M[i][x]);
      for(let y = 0; y + 1 < size; y++) for(let x = 0; x + 1 < size; x++){ const c = M[y][x]; if(c === M[y][x + 1] && c === M[y + 1][x] && c === M[y + 1][x + 1]) p += 3; }
      for(let y = 0; y < size; y++) for(let x = 0; x < size; x++) if(M[y][x]) dark++;
      return p + Math.floor(Math.abs(dark * 20 - size * size * 10) / (size * size)) * 10;
    };
    let mask = forceMask;
    if(mask == null){
      let best = 1e9;
      for(let m = 0; m < 8; m++){ applyMask(m); format(m); const s = penalty(); if(s < best){ best = s; mask = m; } applyMask(m); }
    }
    applyMask(mask); format(mask);
    return { size: size, version: v, ecc: e === 1 ? "M" : "L", mask: mask, rows: M };
  }
  return { encode: encode };
})();
export function qrSvg(text){
  const q = QR.encode(text), n = q.size + 8;
  let d = "";
  q.rows.forEach((row, y) => row.forEach((on, x) => { if(on) d += "M" + (x + 4) + " " + (y + 4) + "h1v1h-1z"; }));
  return `<svg class="qrsvg" viewBox="0 0 ${n} ${n}" shape-rendering="crispEdges" role="img" aria-label="QR code of the link (version ${q.version}, ${q.ecc})"><rect width="${n}" height="${n}" fill="#fff"/><path d="${d}" fill="#000"/></svg>`;
}
/* The code as big as the screen (user 19.10.2026: "make the QR codes a bit
   bigger, and at least a clear button to make them exactly as big as you
   want"): Full screen lays the code on a white layer over the page at the
   largest size that fits, Smaller and Bigger step it by a tenth of that, and
   this device remembers the size. Only Close (or Esc) closes it - a tap on
   the code does nothing, so a phone held against the screen cannot shut it.
   The layer carries its own styles: both the Registry and Play use it. */
export const QR_FULL_KEY = "gothic-fleet-qr-full";
export function qrFull(svg){
  if(typeof document === "undefined" || !document.createElement || !document.body || !svg) return null;
  const old = document.getElementById("qrfull"); if(old && old.parentNode) old.parentNode.removeChild(old);
  let pct = 100;
  try{ const v = parseInt(localStorage.getItem(QR_FULL_KEY), 10); if(v >= 30 && v <= 100) pct = v; }catch(e){}
  const el = document.createElement("div");
  el.id = "qrfull"; el.tabIndex = -1;
  el.setAttribute("role", "dialog"); el.setAttribute("aria-modal", "true"); el.setAttribute("aria-label", "QR code, full screen");
  el.style.cssText = "position:fixed;inset:0;z-index:2147483000;background:#fff;color:#111;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;padding:8px;box-sizing:border-box;overflow:hidden";
  const bs = "min-height:48px;min-width:76px;padding:0 14px;border:1px solid #777;border-radius:10px;background:#eee;color:#111;font:600 15px/1 system-ui,sans-serif;cursor:pointer";
  el.innerHTML = `<div data-qf-code style="flex:0 0 auto">${svg}</div>
    <div data-qf-bar style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;justify-content:center">
      <button type="button" data-qf="-" style="${bs}">Smaller</button>
      <span data-qf-pct style="min-width:56px;text-align:center;font:600 15px/1 ui-monospace,monospace"></span>
      <button type="button" data-qf="+" style="${bs}">Bigger</button>
      <button type="button" data-qf="x" style="${bs}">Close</button></div>`;
  const code = el.querySelector("[data-qf-code]"), bar = el.querySelector("[data-qf-bar]");
  const sv = code.querySelector("svg"); if(sv){ sv.style.display = "block"; sv.style.width = "100%"; sv.style.height = "100%"; }
  const fit = () => {
    const w = window.innerWidth - 16, h = window.innerHeight - bar.offsetHeight - 28;
    code.style.width = code.style.height = Math.max(120, Math.floor(Math.min(w, h) * pct / 100)) + "px";
    el.querySelector("[data-qf-pct]").textContent = pct + "%";
    [["-", pct <= 30], ["+", pct >= 100]].forEach(([k, off]) => {
      const b = el.querySelector('[data-qf="' + k + '"]'); b.disabled = off; b.style.opacity = off ? ".4" : "1";
    });
  };
  const key = e => { if(e.key === "Escape"){ e.preventDefault(); e.stopPropagation(); close(); } };
  const close = () => {
    window.removeEventListener("resize", fit); document.removeEventListener("keydown", key, true);
    if(el.parentNode) el.parentNode.removeChild(el);
  };
  el.addEventListener("click", e => {
    e.stopPropagation();
    const b = e.target.closest ? e.target.closest("button[data-qf]") : null;
    if(!b) return;
    if(b.dataset.qf === "x"){ close(); return; }
    pct = Math.max(30, Math.min(100, pct + (b.dataset.qf === "+" ? 10 : -10)));
    try{ localStorage.setItem(QR_FULL_KEY, String(pct)); }catch(x){}
    fit();
  });
  document.body.appendChild(el);
  window.addEventListener("resize", fit);
  document.addEventListener("keydown", key, true);
  fit(); el.focus();
  return el;
}
