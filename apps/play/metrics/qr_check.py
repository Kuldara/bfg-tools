# -*- coding: utf-8 -*-
"""The play page's QR encoder checked against an independent implementation.

Gothic Fleet Play draws the "to phone" link's QR code itself (packages/ui/qr.js,
QR.encode), so the page stays one file with no network. This runs the page's
encoder in Node (the built page, smoke_play.js's boot) and compares every
module with reportlab's own QR encoder at the same version, error correction
level and mask. All eight masks, several lengths (versions 1-40 throughout
with their different block structures), byte mode.

  python apps/play/metrics/qr_check.py
"""
import io, json, os, subprocess, sys
from reportlab.graphics.barcode import qrencoder as q

HERE = os.path.dirname(os.path.abspath(__file__))
PLAY = os.path.dirname(HERE)

# test strings: short to long, so that versions 1-40 and both levels come up
texts = ["https://bfgtools.kuldare.com/play/Gothic%20Fleet%20Play.html#fleet=" + ("AbC-_x9" * k)[:n]
         for k, n in [(1, 0), (2, 5), (8, 40), (20, 120), (40, 250), (80, 500), (140, 900), (200, 1300), (300, 1900), (420, 2800)]]
texts = ["a", "hello world", "x" * 30, "y" * 50, "z" * 75, "q" * 105, "w" * 150, "e" * 190, "r" * 230] + texts
js = r"""
const run = require(process.argv[1]);
const fs = require("fs");
const pg = run.boot(fs.readFileSync(run.BUILT, "utf8"));
const texts = JSON.parse(fs.readFileSync(0, "utf8"));
const out = [];
for(const t of texts){
  const base = JSON.parse(pg.P("JSON.stringify((() => { const r = QR.encode(" + JSON.stringify(t) + "); return { v: r.version, e: r.ecc, mask: r.mask }; })())"));
  for(let m = 0; m < 8; m++){
    const rows = JSON.parse(pg.P("JSON.stringify(QR.encode(" + JSON.stringify(t) + ", " + m + ").rows.map(r => r.map(x => x ? 1 : 0).join('')))"));
    out.push({ t: t, v: base.v, e: base.e, mask: m, best: base.mask, rows: rows });
  }
}
process.stdout.write(JSON.stringify(out));
"""
# TextEncoder is missing from the smoke context: give it to the page's context
js = js.replace('const pg = run.boot(fs.readFileSync(run.BUILT, "utf8"));',
                'const pg = run.boot(fs.readFileSync(run.BUILT, "utf8")); pg.ctx.TextEncoder = TextEncoder;')
res = subprocess.run(["node", "-e", js, os.path.join(PLAY, "smoke_play.js")], input=json.dumps(texts).encode("utf-8"),
                     capture_output=True, cwd=PLAY)
if res.returncode:
    print(res.stderr.decode("utf-8", "replace")); sys.exit(1)
cases = json.loads(res.stdout.decode("utf-8"))
LEVEL = {"L": q.QRErrorCorrectLevel.L, "M": q.QRErrorCorrectLevel.M}
fails = 0
seen = set()
for c in cases:
    qr = q.QRCode(c["v"], LEVEL[c["e"]])
    qr.addData(c["t"].encode("utf-8") if False else c["t"])
    qr.makeImpl(False, c["mask"])
    n = qr.getModuleCount()
    ref = ["".join("1" if qr.isDark(r, col) else "0" for col in range(n)) for r in range(n)]
    ok = ref == c["rows"]
    seen.add((c["v"], c["e"]))
    if not ok:
        fails += 1
        diff = sum(1 for r in range(n) for col in range(n) if ref[r][col] != c["rows"][r][col]) if len(c["rows"]) == n else -1
        print("DIFF: length %d, version %d%s, mask %d: %d modules" % (len(c["t"]), c["v"], c["e"], c["mask"], diff))
print("%d cases (%d version/level combinations: %s), %d differences" % (len(cases), len(seen), ", ".join("%d%s" % s for s in sorted(seen)), fails))
sys.exit(1 if fails else 0)
