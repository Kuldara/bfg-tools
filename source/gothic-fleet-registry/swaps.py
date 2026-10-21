# -*- coding: utf-8 -*-
"""Aseiden vaihto-optiot aseistustaulukon riveiksi.

Kirjan OPTIONS-rivi "May replace its prow heavy gun battery with a torpedo
launcha (Speed 30 cm, Strength D6+2)" muuttaa aseistustaulukkoa. Kortilla
pitaa nakya kumpikin vaihtoehto rastiruutuineen, jotta pelaaja voi valita
poydalla - tai vain toinen, jos valinta on lukittu jo rakentajassa.

Tama jasentaa vaihdon dataksi:

    o["sw"] = {"from": [rivi-indeksit], "to": [[nimi, kantama, voima, kaari]]}

Jasennys on TAHALLAAN tiukka. Jos korvattavaa rivia ei tunnisteta yksiselit-
teisesti, kentta jatetaan pois ja optio nakyy pelkkana tekstina kuten ennenkin.
Vaarin arvattu ase olisi pahempi kuin puuttuva.
"""
import re

SWAP = re.compile(
    r"\b(?:may|can|could)?\s*(?:replace|exchange|swap)\s+"
    r"(?:its|their|the)?\s*(?P<a>.+?)\s+(?:with|for)\s+(?P<b>.+)$", re.I)

POS = {"port", "starboard", "prow", "dorsal", "forward", "aft"}
SOFT = {"battery", "batteries", "bay", "bays", "tube", "tubes",
        "launcher", "launchers", "launcha", "launchas"}
NOISE = {"range", "cm", "speed", "strength", "firepower", "str", "its", "their",
         "the", "a", "an", "and", "or", "of", "for", "with", "at", "no", "extra",
         "additional", "points", "point", "pts", "cost", "change", "in", "only",
         "all", "each", "arc", "arcs", "firing", "front", "left", "right",
         "which", "may", "fire", "normal", "boarding", "torpedoes"}

STRENGTH = re.compile(
    r"(?:strength|firepower|str|fp)\s*[-:]?\s*(D?\d+(?:\+\d+)?)", re.I)
RANGE = re.compile(r"(?:range|speed)\s*[-:]?\s*(\d+\s*cm)|(\d+\s*cm)\s*range", re.I)
ARCS = [
    (re.compile(r"front\s+arc\s+only", re.I), "Front"),
    (re.compile(r"firing\s+([A-Za-z]+(?:\s*/\s*[A-Za-z]+)+)", re.I), None),
    (re.compile(r"port\s+and\s+starboard\s+arcs", re.I), "Left / Right"),
    (re.compile(r"all\s+round", re.I), "All round"),
]


def words(t):
    t = re.sub(r"[^a-z0-9+ ]", " ", str(t or "").lower())
    return [w for w in t.split() if w]


def stem(w):
    """Orkkikirjoitus mukaan: gunz -> gun, bommas -> bomma."""
    if w.endswith("ies"):
        return w[:-3] + "y"
    if len(w) > 3 and w.endswith("z"):
        return w[:-1]
    if len(w) > 3 and w.endswith("s"):
        return w[:-1]
    return w


def parts(t):
    """(sijainnit, ydinsanat) -- kevyet ja merkityksettomat sanat pois."""
    ws = [stem(w) for w in words(t)]
    pos = {w for w in ws if w in POS}
    core = {w for w in ws
            if w not in POS and w not in SOFT and w not in NOISE
            and not w.isdigit()}
    return pos, core


def find_rows(aw, phrase):
    """Korvattavien aseistusrivien indeksit, tai None jos epaselva."""
    fpos, fcore = parts(phrase)
    if not fcore:
        return None
    want_range = re.search(r"(\d+)\s*cm", phrase, re.I)
    hits = []
    for i, a in enumerate(aw):
        rpos, rcore = parts(a[0])
        if not fcore <= rcore:
            continue
        if fpos and not (rpos & fpos):
            continue
        if want_range and want_range.group(1) not in str(a[1]):
            continue
        hits.append(i)
    return hits or None


def replacement(text, old_row, catalogue):
    """Uusi aseistusrivi [nimi, kantama, voima, kaari] tai None."""
    st = STRENGTH.search(text)
    rg = RANGE.search(text)
    arc = None
    for rx, fixed in ARCS:
        m = rx.search(text)
        if m:
            arc = fixed or " / ".join(x.strip().title()
                                      for x in m.group(1).split("/"))
            break

    # nimi: poista stat-lausekkeet ja sulkeet, jata substantiivi
    nm = re.sub(r",\s*(?:which|that)\b.*$", " ", text, flags=re.I)
    nm = re.sub(r"\b(?:at|for)\s+(?:no|an?|\+|-|\d).*$", " ", nm, flags=re.I)
    nm = re.sub(r"\([^)]*\)", " ", nm)
    nm = re.sub(r"(?:strength|firepower|str|fp)\s*[-:]?\s*D?\d+(?:\+\d+)?", " ", nm, flags=re.I)
    nm = re.sub(r"(?:range|speed)\s*[-:]?\s*\d+\s*cm", " ", nm, flags=re.I)
    nm = re.sub(r"\d+\s*cm(\s*range)?", " ", nm, flags=re.I)
    nm = re.sub(r"\bfiring\s+[A-Za-z/ ]+", " ", nm, flags=re.I)
    nm = re.sub(r"^[\s,.;]*(?:a|an|the)\s+", " ", nm, flags=re.I)
    nm = re.sub(r"[\s,.;]+", " ", nm).strip(" ,.;")
    nm = re.sub(r"^(?:which|that)\b.*$", "", nm, flags=re.I).strip()
    if not nm or len(nm) > 46:
        # "for range 45 cm, strength 4" = sama ase uusilla arvoilla
        if st or rg:
            nm = str(old_row[0])
        else:
            return None

    # sijaintimaare peritaan korvattavalta rivilta
    opos, _ = parts(old_row[0])
    if opos and not (parts(nm)[0]):
        nm = "%s %s" % (sorted(opos)[0].title(), nm)
    nm = nm[0].upper() + nm[1:]

    strength = st.group(1) if st else None
    rng = (rg.group(1) or rg.group(2)).replace("cm", " cm").replace("  ", " ") if rg else None

    # Jos ase pysyy samana ja vain arvo muuttuu, puuttuva arvo on entinen -
    # ja rivin NIMI on korvattavan rivin nimi, ei option lauseesta poimittu
    # monikko: Tyrant s.69 "45 cm range weapons batteries" korvaa rivin
    # "Port weapons battery", ja kortin pitaa nimeta sen kuten kirjan taulukko.
    _, ncore = parts(nm)
    _, ocore = parts(old_row[0])
    if ncore and ncore == ocore:
        nm = str(old_row[0])
        strength = strength or str(old_row[2])
        rng = rng or str(old_row[1])

    # muuten: sama ase muualla kirjassa kelpaa lahteeksi
    if not (strength and rng):
        _, core = parts(nm)
        cand = [v for k, v in catalogue.items() if k == frozenset(core)]
        if len(cand) == 1:
            if not rng:
                rng = cand[0][0]
            if not strength:
                strength = cand[0][1]
    # Torpedot kulkevat nopeutensa verran (Rulebook s.76), ja jokainen
    # Imperial- ja Chaos-torpedorivi kirjassa on 30 cm (Retribution s.54,
    # Lunar s.71, Desolator s.267). Optiolause ("Strength 8 torpedoes",
    # "strength-9 torpedo launchers") ei toista nopeutta - kortti ei saa
    # sanoa "see text" (Dauntless s.77, Despoiler s.266, Victory s.55,
    # Mercury s.64).
    if not rng and any(w.startswith("torpedo") for w in parts(nm)[1]):
        rng = "30 cm"
    # Torpedoputket ampuvat keulasta, kun lause ei sano muuta (s.105
    # Strike cruiser "strength-6, speed: 30 cm torpedo tubes" korvaa
    # launch bayt, joiden kaari on "-"; pistokoe 6 rivi 68).
    if (not arc and any(w.startswith("torpedo") for w in parts(nm)[1])
            and not re.search(r"\d|left|right|front", str(old_row[3] or ""), re.I)):
        arc = "Front"
    return [nm, rng or "see text", strength or "see text", arc or old_row[3]]


def build_catalogue(ships):
    """Aseen ydinsanat -> (kantama, voima), vain jos koko kirja on yksimielinen."""
    seen = {}
    for sh in ships.values():
        for a in sh.get("aw", []):
            key = frozenset(parts(a[0])[1])
            if not key:
                continue
            seen.setdefault(key, set()).add((str(a[1]), str(a[2])))
    return {k: sorted(v)[0] for k, v in seen.items() if len(v) == 1}


def annotate(ships):
    """Lisaa o['sw'] niihin optioihin jotka jasentyvat. Palauttaa (ok, ohi)."""
    cat = build_catalogue(ships)
    ok, skipped = [], []
    for pg, sh in ships.items():
        for o in sh.get("ol", []):
            t = str(o.get("t") or "")
            if not re.search(r"\breplace|\bexchang|\bswap", t, re.I):
                continue
            m = SWAP.search(t)
            if not m:
                skipped.append((pg, sh["nm"], t, "lause ei jasenny"))
                continue
            rows = find_rows(sh["aw"], m.group("a"))
            if not rows:
                skipped.append((pg, sh["nm"], t, "korvattavaa ei tunnisteta"))
                continue
            # "..., which may fire normal or boarding torpedoes" on selite,
            # ei toinen vaihtoehto: se karsitaan ennen monitulkintaisuustestia.
            tail = re.split(r"(?<=[a-z0-9)])\.\s+(?=[A-Z])", m.group("b"))[0]
            tail = re.sub(r",\s*(?:which|that)\b.*$", "", tail, flags=re.I)
            if re.search(r"\bor\b", tail) or len(STRENGTH.findall(tail)) > 1:
                # "X or Y" / kaksi asetta yhdessa: liian monitulkintaista
                skipped.append((pg, sh["nm"], t, "monitulkintainen korvaaja"))
                continue
            new = [replacement(tail, sh["aw"][i], cat) for i in rows]
            if any(x is None for x in new):
                skipped.append((pg, sh["nm"], t, "korvaajaa ei jasenny"))
                continue
            o["sw"] = dict(f=rows, t=new)
            ok.append((pg, sh["nm"], [sh["aw"][i][0] for i in rows], new))
    return ok, skipped
