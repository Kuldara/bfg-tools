# -*- coding: utf-8 -*-
"""Onko statsi- ja aseistusarvo OIKEASSA SARAKKEESSA - ei vain sivulla?

audit.py:n tarkistukset A ja B kysyvat, loytyyko arvo lahdesivun tekstista.
Se todistaa, ettei poimija ole keksinyt mitaan, ja se on vahva tulos: 3 627
arvosta nolla puuttuu. Se ei kuitenkaan katso saraketta. Kun arvo esiintyy
sivulla useammin kuin kerran - ja 2 028 arvoa eli 56 % esiintyy - tarkistus
lapaisee myos silloin, kun arvo on vaarassa sarakkeessa. Juuri sellainen
virhe tulostaa uskottavan nakoisen kortin vaarilla arvoilla.

Tama tarkistin johtaa taulukot uudelleen PDF:sta ja vertaa bfg_data.jsoniin.
Jotta se todistaisi jotain, sen on paateltava sarakkeet ERI SAANNOLLA kuin
extract.py:

  extract.py   sijoittaa jokaisen SANAN erikseen sen VASEMMAN REUNAN (w[0])
               perusteella. Tiedosto varoittaa itse: "Rivin x0:aan ei voi
               luottaa: solut ovat keskitettyja ja levenevat vasemmalle."

  tama         kokoaa rivin sanat ensin SOLUIKSI vaakavalin perusteella ja
               sijoittaa kokonaisen SOLUN sen KESKIKOHDAN mukaan lahimpaan
               sarakkeeseen.

Solurajan 14 pt ei ole arvattu vaan mitattu: 20 692 sanavalia jakautuu
kahteen kasaan, 1-6 pt solun sisalla ja >=20 pt solujen valissa; valiin jaa
tyhja kaista, jonka keskelta raja on otettu.

RAJAUS. Riippumatonta on sarakkeen paattely - se on se akseli, jota tama
vaittaa tarkistavansa. Rivien tunnistus ja valiotsikoiden ohitus on
tarkoituksella samanlainen kuin extract.py:ssa, koska ero siina ei kertoisi
mitaan arvojen oikeellisuudesta. Yksi ero on kuitenkin tahallinen:

  extract.py KATKAISEE taulukon, jos rivilla on >=14 sanaa (leveä
  valilause). Tama tarkistin OHITTAA sellaisen rivin ja jatkaa. Nain
  loytyvat sivut, joilla kirjassa on enemman taulukkoa kuin poimija otti.
  Ne eivat ole automaattisesti virheita: esim. Torture s.352 on korjattu
  kasin build_data.py:ssa. Ne raportoidaan omana luokkanaan
  tarkistettavaksi, ei loydoksena.

Aja:  python check_profiles.py         yhteenveto
      python check_profiles.py -v      jokainen loydos kokonaan
Palauttaa 1, jos varsinaisia loydoksia on.
"""
import fitz, json, io, re, sys, os, collections

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = r"F:\3D print LLM\Battlefleet Gothic\tulosteet\ref\BFG-Remastered-Official-Fleets_WIP.pdf"
D = json.load(io.open(os.path.join(HERE, "bfg_data.json"), encoding="utf-8"))
doc = fitz.open(SRC)
VERBOSE = "-v" in sys.argv

STATS = ["TYPE/HITS", "SPEED", "TURNS", "SHIELDS", "ARMOUR", "TURRETS"]
TYR = ["TYPE/HITS", "SPEED", "TURNS", "SHIELDS", "ARMOUR", "SPORES"]
ARMS = ["ARMAMENT", "RANGE/SPEED", "FIREPOWER/STR", "FIRE"]
ARM_KEYS = ["armament", "range", "fp", "arc"]
SECTIONS = ("OPTIONS", "NOTES", "NOTE", "SPECIAL", "UPGRADES", "REFITS")
SKIP_ROW = re.compile(r"^(?:(?:in addition,\s*)?choose\b|or\s*$|below\b)", re.I)

CELL_GAP = 14.0   # mitattu; ks. moduulin selitys
CLOSE = 6.0       # nain lahella sarakerajaa sijoitus ei ole yksiselitteinen

issues = collections.defaultdict(list)
seen = collections.Counter()


def add(kind, ref, msg):
    issues[kind].append((ref, msg))


def norm(t):
    t = (str(t).replace("\u2009", " ").replace("\u00a0", " ")
         .replace("\u2013", "-").replace("\u2212", "-").replace("\u2014", "-"))
    return re.sub(r"\s+", " ", t).strip()


def cmpable(t):
    """Vertailumuoto. "(quadrant)" pudotetaan, koska extract.py pudottaa sen
    tahallaan statsihahmossaan - se ei ole sarakevirhe vaan tietoinen
    yksinkertaistus, ja se raportoidaan erikseen omana huomionaan."""
    t = re.sub(r"\s*\(quadrant\)", "", norm(t), flags=re.I)
    # s.181 Endeavour painaa TURNS-arvon "90" ilman astemerkkia; build_data
    # lisaa merkin (turns_text), ja se on tietoinen normalisointi, ei
    # sarakevirhe.
    return re.sub("(\\d)\u00b0$", "\\1", t)


def rows(page, tol=3.5):
    out = []
    for w in sorted((w[:5] for w in page.get_text("words")),
                    key=lambda w: (round((w[1] + w[3]) / 2, 1), w[0])):
        yc = (w[1] + w[3]) / 2
        if out and abs(out[-1][0] - yc) <= tol:
            out[-1][1].append(w)
        else:
            out.append([yc, [w]])
    for r in out:
        r[1].sort(key=lambda w: w[0])
    return out


def header(rws, labels):
    for i, (yc, ws) in enumerate(rws):
        toks = [w[4] for w in ws]
        if all(l in toks for l in labels):
            cen = []
            for l in labels:
                j = toks.index(l)
                xa, xb = ws[j][0], ws[j][2]
                if l == "FIRE" and j + 1 < len(ws) and ws[j + 1][4] == "ARC":
                    xb = ws[j + 1][2]
                cen.append((xa + xb) / 2)
            return i, cen, yc
    return None, None, None


def cells(ws):
    """Rivin sanat soluiksi vaakavalin perusteella.

    Tama on tarkistimen ydin: extract.py ei koskaan muodosta solua vaan
    sijoittaa sanat yksitellen, jolloin leveaan soluun kuuluva sana voi
    ylittaa sarakerajan yksin. Kun solu muodostetaan ensin, sen keskikohta
    kertoo sarakkeen.
    """
    out = []
    for w in ws:
        if out and w[0] - out[-1][-1][2] < CELL_GAP:
            out[-1].append(w)
        else:
            out.append([w])
    return [(c[0][0], c[-1][2], " ".join(x[4] for x in c)) for c in out]


def place(cell, cen):
    """Solu lahimpaan sarakkeeseen KESKIKOHDAN mukaan.

    Palauttaa (sarake, marginaali, ylitysten maara). Pieni marginaali
    tarkoittaa, ettei sijoitus ole yksiselitteinen. Pelkka rajan ylitys ei
    riita huomautukseen: pitkat asenimet levittyvat luonnostaan seuraavan
    sarakkeen puolelle, ja niiden keskikohta on silti selvasti omassaan.
    """
    x0, x1, _ = cell
    c = (x0 + x1) / 2
    i = min(range(len(cen)), key=lambda k: abs(cen[k] - c))
    bs = [(cen[k] + cen[k + 1]) / 2 for k in range(len(cen) - 1)]
    margin = min((abs(c - b) for b in bs), default=999.0)
    crosses = sum(1 for b in bs if x0 < b < x1)
    return i, margin, crosses


def statline_of(sh):
    ty, hp = sh.get("ty"), sh.get("hp")
    head = "%s/%s" % (ty, hp) if ty and hp is not None else (ty or "")
    return [head, sh.get("sp"), sh.get("tn"), sh.get("sh"),
            sh.get("ar"), sh.get("tu")]


by_page = collections.defaultdict(list)
for key, sh in D["ships"].items():
    m = re.match(r"(\d+)", str(sh.get("pg") or key))
    if m:
        by_page[int(m.group(1))].append((key, sh))

pages_checked = variants_skipped = 0

for pg in sorted(by_page):
    page = doc[pg - 1]
    txt = page.get_text()
    if "TYPE/HITS" not in txt or "ARMAMENT" not in txt:
        continue
    rws = rows(page)
    labels = TYR if "SPORES" in txt else STATS
    si, scen, _ = header(rws, labels)
    ai, acen, ay = header(rws, ARMS)
    if si is None or ai is None:
        continue
    pages_checked += 1

    exact = [(k, s) for k, s in by_page[pg] if str(k) == str(pg)]
    if not exact:
        variants_skipped += len(by_page[pg])
        continue
    if len(by_page[pg]) > 1:
        variants_skipped += len(by_page[pg]) - 1
    key, sh = exact[0]
    ref = "s.%d %s" % (pg, sh.get("nm", "")[:32])

    # ---- statsirivi ------------------------------------------------------
    want = statline_of(sh)
    got = [""] * len(labels)
    for cell in (cells(rws[si + 1][1]) if si + 1 < len(rws) else []):
        i, margin, _ = place(cell, scen)
        got[i] = (got[i] + " " + cell[2]).strip()
        if margin < CLOSE:
            add("S epavarma", ref, "%r on %.1f pt sarakerajasta (%s)"
                % (cell[2], margin, labels[i]))
    for i, lab in enumerate(labels):
        seen["statsi"] += 1
        w, g = cmpable(want[i]), cmpable(got[i])
        if w == "" and g == "":
            continue
        if w != g:
            add("S statsi", ref, "%s: data=%r  sivulta sarakkeesta=%r"
                % (lab, norm(want[i]), norm(got[i])))
        # Kirjan "(quadrant)" on merkitseva: 12 osumaa NELJANNESTA kohti
        # ei ole sama asia kuin 12 osumaa. Merkinta pudotetaan arvoista
        # tahallaan - se ei mahdu ruutuun eika kuulu kokonaislukuun - ja
        # tieto kannetaan qd-lipussa, jonka kortti kertoo kerran. Tassa
        # vaaditaan, etta lippu todella on: ilman sita kortti valehtelee.
        if "(quadrant)" in norm(got[i]).lower() and not sh.get("qd"):
            add("S quadrant", ref, "%s: kirjassa %r, mutta alukselta puuttuu qd"
                % (lab, norm(got[i])))

    # ---- aseistustaulukko ------------------------------------------------
    derived, cur, prev_y, skipped_wide = [], None, ay, 0
    for j in range(ai + 1, len(rws)):
        yc, ws = rws[j]
        first = ws[0][4].upper().strip(":")
        if (first in SECTIONS and ws[0][0] < 90) or yc - prev_y >= 16:
            break
        prev_y = yc
        full = norm(" ".join(w[4] for w in ws))
        cs = cells(ws)
        wide_prose = len(ws) >= 14
        if wide_prose:
            skipped_wide += 1
        # valiotsikko: yksi solu joka ylittaa sarakerajan, tai kirjan oma
        # "Choose ..." / "OR" -erotin
        if wide_prose or SKIP_ROW.match(full) or \
                (len(cs) == 1 and place(cs[0], acen)[2] >= 1):
            cur = None
            continue
        row = {}
        for cell in cs:
            i, margin, crosses = place(cell, acen)
            row[ARM_KEYS[i]] = (row.get(ARM_KEYS[i], "") + " " + cell[2]).strip()
            if margin < CLOSE:
                add("B epavarma", ref, "%r on %.1f pt sarakerajasta (%s)"
                    % (cell[2], margin, ARM_KEYS[i]))
        if row.get("armament"):
            cur = {k: row.get(k, "") for k in ARM_KEYS}
            derived.append(cur)
        elif cur is not None:
            for k in ARM_KEYS:
                if row.get(k):
                    cur[k] = (cur[k] + " / " + row[k]).strip(" /")

    stored = [[norm(c) for c in a] for a in (sh.get("aw") or [])]
    mine = [[norm(r[k]) for k in ARM_KEYS] for r in derived]
    if len(stored) != len(mine):
        # Datassa enemman kuin sivulla = poimijan katkeaminen on korjattu
        # kasin (Torture s.352, Waystation s.481). Sivulla enemman kuin
        # datassa = aseita puuttuu, ja se on loydos.
        kind = "B kasin taydennetty" if len(stored) > len(mine) else "B rivimaara"
        add(kind, ref, "data %d aserivia, sivulta %d%s"
            % (len(stored), len(mine),
               " (sivulla %d levea valilause)" % skipped_wide if skipped_wide else ""))
    for n, (s, m) in enumerate(zip(stored, mine)):
        for ci, (a, b) in enumerate(zip(s, m)):
            seen["ase"] += 1
            if a != b:
                add("B aseistus", ref, "rivi %d %s: data=%r  sivulta=%r"
                    % (n + 1, ARM_KEYS[ci], a, b))

# --- raportti -------------------------------------------------------------
SOFT = ("S epavarma", "B epavarma", "B kasin taydennetty")
print("Sijaintitarkistus: %d profiilisivua" % pages_checked)
print("  statsiarvoja %d, aseistussoluja %d" % (seen["statsi"], seen["ase"]))
if variants_skipped:
    print("  ohitettu %d varianttia, jotka syntyvat vasta build_data.py:ssa"
          % variants_skipped)
print()
hard = 0
for kind in sorted(issues):
    n = len(issues[kind])
    if kind not in SOFT:
        hard += n
    print("%-14s %4d%s" % (kind, n, "" if kind not in SOFT else "   (tarkistettavaksi, ei loydos)"))
    show = issues[kind] if VERBOSE else issues[kind][:8]
    for r, msg in show:
        print("   %-36s %s" % (r[:36], msg[:112]))
    if not VERBOSE and n > len(show):
        print("   ... ja %d muuta (-v nayttaa kaikki)" % (n - len(show)))
print()
print("varsinaisia loydoksia: %d" % hard)
sys.exit(1 if hard else 0)
