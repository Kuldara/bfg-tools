# -*- coding: utf-8 -*-
"""Kattavuusraportti: mika kirjan hinnoiteltu asia EI ole valittavissa.

    python coverage.py           # vain kattamattomat
    python coverage.py --all     # myos katetut, tarkistusta varten

MITA TAMA TEKEE

Kayy jokaisen listan KOKO saantotekstin lause lauseelta ja poimii ne
lauseet joissa on pistehinta. Sitten se katsoo, loytyyko listalta rivi
joka vastaa lausetta - joko hinnalla ja nimella tai pelkalla nimella.
Jaljelle jaavat lauseet ovat niita joita pelaaja ei voi valita
rakentajassa.

MIKSI

Kirja kirjoittaa osan paivityksista riveiksi ja osan leipatekstiin.
Leipatekstiin jaaneet loytyvat vain lukemalla, ja juuri ne unohtuvat.
Tama tekee siita mekaanisen tarkistuksen, joka voidaan ajaa uudelleen
aina kun lahde paivittyy.

MITA TAMA EI OLE

Tama ei paata mika on virhe. Moni loydos on tarkoituksella pelkkaa
tekstia: laivaston kokorajoja, skenaariohankintoja, kampanjasaantoja.
Raportti on katselmoitava lista, ei virhelista.
"""
import io, json, os, re, sys, collections

HERE = os.path.dirname(os.path.abspath(__file__))
SHOW_ALL = "--all" in sys.argv

RAW = json.load(io.open(os.path.join(HERE, "lists_raw.json"), encoding="utf-8"))
DATA = json.load(io.open(os.path.join(HERE, "bfg_data.json"), encoding="utf-8"))

COST = re.compile(r"\+?(\d+)\s*(?:points|pts)\b", re.I)
ABBR = [(r"\bmax\.", "max"), (r"\bpg\.", "pg"), (r"\bapprox\.", "approx"),
        (r"\bi\.e\.", "ie"), (r"\be\.g\.", "eg"), (r"\bNo\.", "No"),
        (r"\bMk\.", "Mk"), (r"\bSt\.", "St")]

# Lauseet jotka EIVAT ole ostettavia paivityksia.
NOISE = re.compile(
    r"\bper\s+[\d,]{3,}\s*points"              # "one Warlord per 500 points"
    r"|fleet\s+(?:is\s+)?(?:of|worth)\s+[\d,]{3,}"
    r"|worth\s+(?:at\s+least\s+|over\s+|more\s+than\s+)?[\d,]{3,}\s*(?:points|pts)"
    r"|[\d,]{3,}\s*(?:points|pts)\s+(?:or\s+)?(?:more|greater|less|and\s+above)"
    r"|victory\s+points|renown|\bD6\s*x\s*\d+\s*points"
    r"|battle\s+will\s+be|scenario|campaign"
    # laivaston kokoon sidotut maararajat, eivat ostettavia paivityksia
    r"|for\s+every\s+(?:full\s+)?[\d,]{3,}\s*points"
    r"|per\s+FULL\s+[\d,]{3,}\s*points"
    r"|[\d,]{3,}\s*points\s+of\s+(?:ships|\w+\s+vessels)"
    r"|(?:if|while|between)\b[^.]*\b[\d,]{3,}\s*(?:points|pts)\b"
    r"|\bat\s+least\s+[\d,]{3,}"
    r"|\bworth\s+up\s+to\s+[\d,]{3,}", re.I)

# Katselmoidut tapaukset: tarkistettu kasin, ei lisattavaa. Avain on
# lauseen alusta, arvo on syy. Nain raporttia ei tarvitse lajitella
# samaa uudelleen joka ajolla.
REVIEWED = {
    "Battleship...":
        "naapurilistan daemonship-hinnat vuotivat sivunvaihdosta; "
        "jokaisella kulttilistalla on oma DAEMONSHIPS-osionsa",
    "Cruiser...":
        "sama sivunvaihdon vuoto kuin edella",
    "185 pts The Kroot":
        "Rogue Traders - Exploration -listan sivu 177 vuoti Pirates-"
        "listan saantoteksteihin; alukset ovat Exploration-listalla",
    "145 pts":
        "sama vuoto: Kroot Warsphere on Exploration-listalla",
    "Improved Logic Engines":
        "Kor'O'Mesmen aluksen refit; hanet voi valita vain Commerce "
        "Protection -listalla, jossa rivi on",
    "The enemy Xenos fleet adds":
        "vastustajan saama lisays, ei ostettava paivitys; Ordo Xenos "
        "-inkvisiittorin haittapuoli",
    "KOR’O VASH’YA":
        "Kor'O'Mesme on valittavissa Commerce Protection -listalla; "
        "Merchant Fleetin komentajaosiossa hanta ei ole",
}

# Rivin nimen ja lauseen yhteiset sanat: tunnistaa "on jo rivina".
STOP = {"the", "a", "an", "of", "for", "and", "or", "to", "in", "at", "may",
        "can", "be", "is", "are", "with", "any", "all", "one", "two", "three",
        "each", "per", "points", "pts", "cost", "additional", "extra", "this",
        "that", "their", "its", "his", "have", "has", "take", "taken", "ship",
        "ships", "vessel", "vessels", "fleet", "point", "add", "given",
        "purchase", "purchased", "include", "included", "must", "not", "if",
        "they", "them", "you", "your", "from", "by", "as", "on", "no"}


def toks(t):
    t = re.sub(r"[^a-z0-9' ]", " ", str(t or "").lower())
    return {w for w in t.split() if len(w) > 2 and w not in STOP}


def sentences(t):
    for pat, rep in ABBR:
        t = re.sub(pat, rep, t)
    return [x.strip() for x in re.split(r"(?<=[.!?])\s+", t) if x.strip()]


def split_leaders(s):
    """Pisteviivarivit ovat oma asiansa, vaikka ne olisivat samassa lauseessa.

    "Soopa Boostas.....+25 pts The ship gains +5 cm speed" on yksi lause
    mutta kaksi asiaa. Katkaisu pisteviivan jalkeisesta hinnasta.
    """
    out, last = [], 0
    for m in re.finditer(r"\.{2,}\s*\+?\d+\s*(?:pts|points)\b", s):
        out.append(s[last:m.end()])
        last = m.end()
    tail = s[last:].strip()
    if tail:
        out.append(tail)
    return out or [s]


weak = 0
rows = collections.defaultdict(list)
for lst in RAW:
    name = lst["name"]
    own = [e for L in DATA["lists"] if L["nm"] == name
           for s in L["secs"] for e in s["ents"]]
    own_costs = {e["p"] for e in own if e.get("p") is not None}
    own_toks = [(toks(e["l"]), e.get("p")) for e in own]

    seen = set()
    for sec in lst["sections"]:
        for para in sec["rules"]:
            for sent in sentences(para):
                for piece in split_leaders(sent):
                    if not COST.search(piece) or NOISE.search(piece):
                        continue
                    if re.search(r"\(pg\s*\.?\s*\d+\)", piece):
                        continue          # alusrivi, on jo listalla
                    if len(piece) > 300:
                        piece = piece[:300]
                    key = re.sub(r"\s+", " ", piece)[:120]
                    if key in seen:
                        continue
                    seen.add(key)
                    costs = {int(c) for c in COST.findall(piece)}
                    st = toks(piece)
                    hit = None
                    for lt, p in own_toks:
                        if not lt:
                            continue
                        shared = lt & st
                        # Yksi yhteinen sana ei riita. Bakan "Fleet Defence
                        # Turret +5 points" tasmasi nain riviin "+1 turret
                        # (Battlefleet Bakka refit) 5 pts": sama hinta ja
                        # sana "turret", mutta eri paivitys. Monisanaiselta
                        # rivilta vaaditaan kaksi yhteista sanaa.
                        need = 2 if len(lt) >= 2 else 1
                        if p in costs and len(shared) >= need:
                            hit = "hinta+nimi"
                            break
                        if len(shared) >= 2 and len(shared) >= len(lt) - 1:
                            hit = "nimi"
                            break
                    if hit is None and costs & own_costs:
                        hit = "vain hinta"
                    if hit is None:
                        for pre, why in REVIEWED.items():
                            if piece.lstrip().startswith(pre):
                                hit = "katselmoitu: " + why
                                break
                    rows[name].append((hit, sec["title"], piece))

tot = miss = 0
for name in [l["name"] for l in RAW]:
    items = rows.get(name) or []
    tot += len(items)
    show = [x for x in items if SHOW_ALL or x[0] is None]
    miss += sum(1 for x in items if x[0] is None)
    # "vain hinta" tarkoittaa etta listalta loytyi jokin samanhintainen
    # rivi mutta nimi ei tasmannyt. Se on heikko osuma: Bakan "Fleet
    # Defence Turret +5 points" nayttaisi katetulta koska listalla on
    # toinen viiden pisteen paivitys. Naytetaan luku erikseen, jottei
    # heikko osuma piiloudu vahvojen joukkoon.
    weak += sum(1 for x in items if x[0] == "vain hinta")
    if not show:
        continue
    print("=" * 100)
    print(name)
    print("=" * 100)
    for hit, sect, piece in show:
        mark = "EI KATETTU " if hit is None else "[%s] " % hit
        print("  %-12s %-22s %s" % (mark, sect[:22], re.sub(r"\s+", " ", piece)[:260]))
    print()

print("hinnoiteltuja lauseita %d, niista kattamatta %d"
      % (tot, miss))
print("naista vain hinnan perusteella katettuja: %d "
      "(nimi ei tasmannyt - tarkista silmamaaraisesti: "
      "python coverage.py --all)" % weak)
