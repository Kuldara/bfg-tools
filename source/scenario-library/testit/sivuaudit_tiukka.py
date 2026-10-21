"""Sivuviitteiden tiukka toinen tarkistus (pistokoetarkastus 21.10.2026).

sivuaudit.py hyväksyy viitteen, jos viitatulla sivulla on mikä tahansa avainsanan sisältävä otsikko.
Tämä etsii viitteet, joiden sivulla osuma on vain sekakirjaiminen rivi, mutta varsinainen ISOIN
KIRJAIMIN kirjoitettu sääntöotsikko on jollain toisella sivulla (esim. "Warp Rifts" RB s. 101 =
puolustusten sijoitus, sääntö on s. 111). Osumat tarkistetaan käsin.

    python -X utf8 "scenario library/testit/sivuaudit_tiukka.py"
"""
import io, re, glob, os
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
TXT = os.path.join(ROOT, "..", "simulaattorit yms", "simulaattori", "saannot_txt")

KASIN = {  # käsin tarkistetut: oikea sivu, vaikka iso otsikko on muualla
    ("Lock On", "RB p. 63"): "ampumisluvun Special Order: Lock On s. 63 (s. 133/196 ovat skenaariotekstiä)",
}

def heads(f):
    T = io.open(os.path.join(TXT, f), encoding="utf-8").read()
    p = re.split(r"===== PAGE (\d+) =====", T)
    H = {}
    for i in range(1, len(p), 2):
        n = int(p[i]); body = p[i + 1]; caps, mixed = [], []
        for line in body.split("\n"):
            l = line.strip()
            letters = re.sub(r"[^A-Za-z]", "", l)
            if len(letters) >= 4 and letters.upper() == letters:
                caps.append(l.lower())
            elif 3 <= len(l) <= 40 and not l.endswith((".", ",")) and re.match(r"^[A-Z][\w’'!\-]*( [A-Z&][\w’'!\-]*| of| and| the| in| to| a| for){0,6}$", l):
                mixed.append(l.lower())
        H[n] = (caps, mixed)
    return H
BOOK = {"RB": heads("rulebook.txt"), "FL": heads("fleets.txt")}
STOP = set("the a an of and or in on to for with as by at from is its it this that be are rules rule list general table class ships ship vessels vessel scenario scenarios set up set-up old new".split())
def kws(label):
    return [x.rstrip("s") for x in re.findall(r"[a-z][a-z'’\-]+", label.lower()) if x not in STOP and len(x) > 2]
def rng(s):
    out = []
    for part in re.split(r",\s*", s):
        m = re.match(r"(\d+)\s*[–-]\s*(\d+)?", part)
        if m:
            a = int(m.group(1)); b = int(m.group(2)) if m.group(2) else a + 2
            out += list(range(a, min(max(a, b), a + 25) + 1))
        else:
            m = re.match(r"(\d+)", part)
            if m: out.append(int(m.group(1)))
    return out
files = [os.path.join(ROOT, "index.html")] + sorted(glob.glob(os.path.join(ROOT, "scenarios", "*.js")))
seen = {}
for f in files:
    s = io.open(f, encoding="utf-8").read()
    for m in re.finditer(r'\["([^"\]]{2,90})",\s*"((?:RB|FL) p\. [^"]+)"\]', s):
        seen.setdefault((m.group(1), m.group(2)), set()).add(os.path.basename(f))
n = 0
for (label, ref), fs in sorted(seen.items()):
    book, pages = ref[:2], rng(ref[6:])
    K = kws(label)
    if not K: continue
    H = BOOK[book]
    def hit(hs): return any(all(k in h for k in K) for h in hs)
    cited_caps = any(hit(H.get(p, ([], []))[0]) for p in pages)
    cited_mixed = any(hit(H.get(p, ([], []))[1]) for p in pages)
    other_caps = [p for p in H if p not in pages and hit(H[p][0])]
    if not cited_caps and cited_mixed and other_caps and (label, ref) not in KASIN:
        n += 1
        print(f"{label!r:55} {ref:16} caps elsewhere: {other_caps[:8]}  ({', '.join(sorted(fs))})")
print("flagged", n, "of", len(seen))
