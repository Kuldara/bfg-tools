"""A second, strict check of the page references (spot check 21.10.2026).

page_audit.py accepts a reference if the referenced page has any heading containing the keyword.
This looks for references whose page has the hit only as a mixed-case line, while the actual rule
heading in CAPITALS is on some other page (e.g. "Warp Rifts" RB p. 101 =
the placing of defences, the rule is on p. 111). Hits are checked by hand.

    python -X utf8 apps/scenarios/tests/page_audit_strict.py

Exits 1 when a reference is flagged.
"""
import io, re, glob, os
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
# Text dumps of the rulebooks (rulebook.txt, fleets.txt): third-party text, kept in
# books/text/ (gitignored) or wherever BFG_BOOKS points.
TXT = os.path.join(os.environ.get("BFG_BOOKS") or os.path.join(ROOT, "..", "..", "books"), "text")

BY_HAND = {  # checked by hand: the right page although the capital heading is elsewhere
    ("Lock On", "RB p. 63"): "the shooting chapter's Special Order: Lock On p. 63 (p. 133/196 are scenario text)",
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
files = [os.path.join(ROOT, "index.html")] + sorted(glob.glob(os.path.join(ROOT, "src", "*.js"))) + sorted(glob.glob(os.path.join(ROOT, "scenarios", "*.js")))
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
    if not cited_caps and cited_mixed and other_caps and (label, ref) not in BY_HAND:
        n += 1
        print(f"{label!r:55} {ref:16} caps elsewhere: {other_caps[:8]}  ({', '.join(sorted(fs))})")
print("flagged", n, "of", len(seen))
raise SystemExit(1 if n else 0)
