"""Scenario Libraryn sivuviiteauditointi (20.10.2026).

Jokainen refs-pari ["otsikko", "RB p. N"] / ["otsikko", "FL p. N"] tarkistetaan sääntökirjojen
tekstidumppeja vasten (simulaattorin saannot_txt/): löytyykö viitatulta sivulta (tai väliltä)
OTSIKKO, jossa on otsikon avainsana. Jos ei, viite tulostetaan yhdessä niiden sivujen kanssa,
joilla sellainen otsikko on. Käsin tarkistetut poikkeukset (oikea sivu, mutta otsikkotunnistus ei
osu, esim. erikoiskäskyt RB s. 46 tai battlezone-taulukot s. 107–108) ovat listassa KASIN.

    python -X utf8 "scenario library/testit/sivuaudit.py"

Tulos 20.10.: 222 viitettä, 0 tarkistamatonta (37 väärää viitettä korjattu, 23 sivunumerotonta täydennetty).
Huom: tarkistaa vain refs-parit. Tekstin sisäiset viitteet tarkistettiin 40 kpl otoksella."""
import io, re, glob, os
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
TXT = os.path.join(ROOT, "..", "simulaattorit yms", "simulaattori", "saannot_txt")

KASIN = {  # (otsikko, viite) -> miksi oikein; tarkistettu tekstidumpeista 20.10.
    ("Abaddon’s rules", "FL p. 230–231"): "ABADDON THE DESPOILER s. 230",
    ("Advanced Shielding", "FL p. 175"): "refit-taulukon rivi 3",
    ("All Ahead Full", "RB p. 46"): "erikoiskäskyjen kuvaus s. 46",
    ("Battlezone generators", "RB p. 107"): "generaattoritaulukot s. 107–108",
    ("Battlezone generators", "RB p. 107–108"): "generaattoritaulukot s. 107–108",
    ("Blood Bond", "RB p. 125"): "sub-plot 3",
    ("Burn Retros", "RB p. 46"): "erikoiskäskyjen kuvaus s. 46",
    ("Contact markers", "RB p. 134"): "Convoyn asettelu käyttää kontaktimerkkejä",
    ("Contact markers", "RB p. 134–135"): "Convoyn asettelu käyttää kontaktimerkkejä",
    ("Deep space battlezone", "RB p. 107–"): "Deep Space Generator s. 108",
    ("Deep space generator", "RB p. 107–108"): "Deep Space Generator s. 108",
    ("Deep space generator, Method 2", "RB p. 105–108"): "Method 1/2 s. 105, taulukko s. 108",
    ("Leadership modifiers (enemy on special orders +1)", "RB p. 48"): "Command check modifiers s. 48",
    ("Mercurial zone generator", "RB p. 107"): "Mercurial Zone Generator s. 107",
    ("Outer Reaches", "RB p. 108"): "Outer Reaches Generator s. 108",
    ("Reload Ordnance", "RB p. 46"): "erikoiskäskyjen kuvaus s. 46",
    ("Reload Ordnance and running out", "RB p. 46–47"): "erikoiskäskyt s. 46–47",
    ("Rulebook scenarios", "RB p. 128–143"): "skenaariot 1–10",
    ("Threat tables", "FL p. 198–199"): "Rogue Trader -uhkataulukot",
    ("Tyranid instinctive behaviour", "FL p. 416"): "Special rules: Instinctive Behaviour",
    ("Blazing and drifting hulks", "RB p. 71"): "hulkit Catastrophic Damage -osiossa s. 71",
    ("Gravity wells", "RB p. 112–113"): "planeettojen painovoimakaivot s. 112–113",
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

files = [os.path.join(ROOT, "index.html")] + sorted(glob.glob(os.path.join(ROOT, "scenarios", "*.js")))
seen = {}
for f in files:
    s = io.open(f, encoding="utf-8").read()
    for m in re.finditer(r'\["([^"\]]{2,90})",\s*"((?:RB|FL)(?: p\. [^"]+)?)"\]', s):
        seen.setdefault((m.group(1), m.group(2)), set()).add(os.path.basename(f))
weak, kasin, nopage = [], 0, []
for (lab, ref), fs in sorted(seen.items()):
    if ref in ("RB", "FL"):
        nopage.append((lab, ref, ",".join(sorted(fs)))); continue
    if (lab, ref) in KASIN:
        kasin += 1; continue
    for chunk in re.split(r";\s*|,\s*(?=(?:RB|FL) )", ref):
        m = re.match(r"(RB|FL) p\. (.+)", chunk.strip())
        if not m: continue
        H = BOOK[m.group(1)]
        pg = rng(m.group(2)); k = kws(lab)
        if not k or not pg: continue
        if not any(any(w in h for w in k) for n in pg for h in H.get(n, [])):
            where = sorted({n for n, hs in H.items() for h in hs if sum(w in h for w in k) >= max(1, (len(k) + 1) // 2)})[:12]
            weak.append((lab, chunk.strip(), where, ",".join(sorted(fs))))
print("viitteitä", len(seen), "· käsin tarkistettuja", kasin, "· tarkistamatta", len(weak), "· ilman sivua", len(nopage))
for w in weak: print("- TARKISTA", repr(w[0]), w[1], "| otsikko sivuilla", w[2], "|", w[3])
for w in nopage: print("- EI SIVUA", repr(w[0]), w[1], "|", w[2])
