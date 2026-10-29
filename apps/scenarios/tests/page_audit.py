"""Scenario Library page reference audit (20.10.2026).

Every refs pair ["heading", "RB p. N"] / ["heading", "FL p. N"] is checked against the rulebooks'
text dumps (books/text/): is there a HEADING with the label's keyword on the referenced page
(or range)? If not, the reference is printed together with the pages that have such a
heading. Exceptions checked by hand (the right page, but the heading detection does not
hit, e.g. the special orders RB p. 46 or the battlezone tables p. 107–108) are in BY_HAND.

    python -X utf8 apps/scenarios/tests/page_audit.py

Result 20.10.: 222 references, 0 unchecked (37 wrong references fixed, 23 without a page completed).
Result 26.10.: 332 references, 0 unchecked (two Book of the Void references fixed, RB p. 107 and p. 124).
Note: checks only the refs pairs. References inside the text were checked with a sample of 40.
Exits 1 when a reference is unchecked or has no page."""
import io, re, glob, os
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
# Text dumps of the rulebooks (rulebook.txt, fleets.txt): third-party text, kept in
# books/text/ (gitignored) or wherever BFG_BOOKS points.
TXT = os.path.join(os.environ.get("BFG_BOOKS") or os.path.join(ROOT, "..", "..", "books"), "text")

BY_HAND = {  # (heading, reference) -> why it is right; checked against the text dumps 20.10.
    ("Abaddon’s rules", "FL p. 240–241"): "ABADDON THE DESPOILER p. 240",
    ("Mark of Slaanesh", "FL p. 242"): "the Incursion list's Mark rows (v0.40 prints them without a space before the dots; checked 29.10.)",
    ("Mark of Tzeentch", "FL p. 242"): "the Incursion list's Mark rows (checked 29.10.)",
    ("Advanced Shielding", "FL p. 185"): "row 3 of the refit table",
    ("All Ahead Full", "RB p. 46"): "the special orders described on p. 46",
    ("Battlezone generators", "RB p. 107"): "the generator tables p. 107–108",
    ("Battlezone generators", "RB p. 107–108"): "the generator tables p. 107–108",
    ("Blood Bond", "RB p. 125"): "sub-plot 3",
    ("Burn Retros", "RB p. 46"): "the special orders described on p. 46",
    ("Contact markers", "RB p. 134"): "the Convoy set-up uses contact markers",
    ("Contact markers", "RB p. 134–135"): "the Convoy set-up uses contact markers",
    ("Deep space battlezone", "RB p. 107–"): "Deep Space Generator p. 108",
    ("Deep space generator", "RB p. 107–108"): "Deep Space Generator p. 108",
    ("Deep space generator, Method 2", "RB p. 105–108"): "Method 1/2 p. 105, the table p. 108",
    ("Leadership modifiers (enemy on special orders +1)", "RB p. 48"): "Command check modifiers p. 48",
    ("Mercurial zone generator", "RB p. 107"): "Mercurial Zone Generator p. 107",
    ("Outer Reaches", "RB p. 108"): "Outer Reaches Generator p. 108",
    ("Reload Ordnance", "RB p. 46"): "the special orders described on p. 46",
    ("Reload Ordnance and running out", "RB p. 46–47"): "the special orders p. 46–47",
    ("Rulebook scenarios", "RB p. 128–143"): "scenarios 1–10",
    ("Threat tables", "FL p. 208–209"): "the Rogue Trader threat tables",
    ("Tyranid instinctive behaviour", "FL p. 418"): "Special rules: Instinctive Behaviour",
    ("Instinctive Behaviour", "FL p. 418"): "Special rules: Instinctive Behaviour (checked 26.10.)",
    ("Flare region", "RB p. 107"): "1. Flare Region Generator p. 107 (checked 26.10.)",
    ("Miserable defeat", "RB p. 124"): "the results table row Miserable Defeat! p. 124 (checked 26.10.)",
    ("Blazing and drifting hulks", "RB p. 71"): "hulks in the Catastrophic Damage section p. 71",
    ("Gravity wells", "RB p. 112–113"): "the planets' gravity wells p. 112–113",
}

def heads(f):
    T = io.open(os.path.join(TXT, f), encoding="utf-8").read()
    p = re.split(r"===== PAGE (\d+) =====", T)
    H = {}
    for i in range(1, len(p), 2):
        n = int(p[i]); body = p[i + 1]; hs = []
        for line in body.split("\n"):
            l = line.strip()
            letters = re.sub(r"[^A-Za-z]", "", l)
            if len(letters) >= 4 and letters.upper() == letters:
                hs.append(l.lower())
            elif 3 <= len(l) <= 40 and not l.endswith((".", ",")) and re.match(r"^[A-Z][\w’'!\-]*( [A-Z&][\w’'!\-]*| of| and| the| in| to| a| for){0,6}$", l):
                hs.append(l.lower())
        H[n] = hs
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
    for m in re.finditer(r'\["([^"\]]{2,90})",\s*"((?:RB|FL)(?: p\. [^"]+)?)"\]', s):
        seen.setdefault((m.group(1), m.group(2)), set()).add(os.path.basename(f))
weak, by_hand, nopage = [], 0, []
for (lab, ref), fs in sorted(seen.items()):
    if ref in ("RB", "FL"):
        nopage.append((lab, ref, ",".join(sorted(fs)))); continue
    if (lab, ref) in BY_HAND:
        by_hand += 1; continue
    for chunk in re.split(r";\s*|,\s*(?=(?:RB|FL) )", ref):
        m = re.match(r"(RB|FL) p\. (.+)", chunk.strip())
        if not m: continue
        H = BOOK[m.group(1)]
        pg = rng(m.group(2)); k = kws(lab)
        if not k or not pg: continue
        if not any(any(w in h for w in k) for n in pg for h in H.get(n, [])):
            where = sorted({n for n, hs in H.items() for h in hs if sum(w in h for w in k) >= max(1, (len(k) + 1) // 2)})[:12]
            weak.append((lab, chunk.strip(), where, ",".join(sorted(fs))))
print("references", len(seen), "· checked by hand", by_hand, "· unchecked", len(weak), "· without a page", len(nopage))
for w in weak: print("- CHECK", repr(w[0]), w[1], "| heading on pages", w[2], "|", w[3])
for w in nopage: print("- NO PAGE", repr(w[0]), w[1], "|", w[2])
raise SystemExit(1 if weak or nopage else 0)
