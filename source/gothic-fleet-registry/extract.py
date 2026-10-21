# -*- coding: utf-8 -*-
"""Poimii alusprofiilit + OPTIONS/SPECIAL-lohkot Fleets WiP -PDF:sta.

Statsirivi jasennetaan hahmolla (sarakkeet vuotavat toisiinsa kun ARMOUR on pitka),
aseistustaulukko geometrialla otsikoiden keskikohtien perusteella.
"""
import fitz, json, re, sys, io

SRC = r"F:\3D print LLM\Battlefleet Gothic\tulosteet\ref\BFG-Remastered-Official-Fleets_WIP.pdf"
d = fitz.open(SRC)

STATS = ["TYPE/HITS", "SPEED", "TURNS", "SHIELDS", "ARMOUR", "TURRETS"]
TYRANID_STATS = ["TYPE/HITS", "SPEED", "TURNS", "SHIELDS", "ARMOUR", "SPORES"]
ARMS = ["ARMAMENT", "RANGE/SPEED", "FIREPOWER/STR", "FIRE"]
ARM_KEYS = ["armament", "range", "fp", "arc"]
SECTIONS = ("OPTIONS", "NOTES", "NOTE", "SPECIAL", "UPGRADES", "REFITS")

Q = r"(?: \(quadrant\))?"
STAT_RE = re.compile(
    r"^(?P<type>\S+(?: \S+)?/\S+)" + Q + r"\s+"
    r"(?P<speed>[\d/]+\s*cm|[Ss]pecial|[–-])\s+"
    r"(?P<turns>\d+\s*°|[Ss]pecial|[–-])\s+"
    r"(?P<shields>\d+" + Q + r"|Holofields|[–-])\s+"
    r"(?P<armour>.+?)\s+"
    r"(?P<turrets>\d+" + Q + r"|[–-])$")


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


def text_of(ws):
    return " ".join(w[4] for w in ws).replace("\u2009", " ").replace("\u00a0", " ")


def section_name(ws):
    """Palauta oikea profiililohkon otsikko, ei leipätekstin alkusanaa.

    Esimerkiksi Escort Dronen lause "special rules detailed..." alkaa
    sanalla special, mutta on sisennetty eikä ole SPECIAL-otsikko.
    """
    first = ws[0][4].upper().strip(":")
    return first if first in SECTIONS and ws[0][0] < 90 else None


def label_row(rws, labels):
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


def col_of(x, cen):
    bnds = [(cen[i] + cen[i + 1]) / 2 for i in range(len(cen) - 1)]
    i = 0
    while i < len(bnds) and x >= bnds[i]:
        i += 1
    return i


CELL_GAP = 14.0


def cells_of(ws):
    """Rivin sanat soluiksi vaakavalin perusteella.

    Solun sisalla sanavali on 1-6 pt, solujen valissa >= 20 pt; 14 pt osuu
    naiden valiin jaavaan tyhjaan kaistaan (mitattu 20 692 valista).
    """
    out = []
    for w in ws:
        if out and w[0] - out[-1][-1][2] < CELL_GAP:
            out[-1].append(w)
        else:
            out.append([w])
    return out


def cols_of(ws, cen):
    """Sarake -> teksti, solu kerrallaan ja solun KESKIKOHDAN mukaan.

    Sanakohtainen x0 ei kelpaa: solut ovat keskitettyja ja levenevat
    vasemmalle, joten leveaan soluun kuuluva ensimmainen sana voi ylittaa
    sarakerajan yksin. Nain kavi gravitic hookin "Capacity:"-sanalle, joka
    paatyi kantamasarakkeeseen kolmella Tau-aluksella.
    """
    buf = {}
    for c in cells_of(ws):
        mid = (c[0][0] + c[-1][2]) / 2
        k = min(range(len(cen)), key=lambda i: abs(cen[i] - mid))
        txt = " ".join(w[4] for w in c)
        buf[k] = (buf[k] + " " + txt).strip() if k in buf else txt
    return buf


def parse(page):
    txt = page.get_text()
    if "TYPE/HITS" not in txt or "ARMAMENT" not in txt:
        return None
    lines = [l.strip() for l in txt.split("\n") if l.strip()]
    fleet, head, pts_raw = lines[1], lines[2].rstrip("\t").strip(), lines[3]
    # Nelja alusta kantaa hinnan samalla rivilla otsikon kanssa, sarkaimella
    # erotettuna. Silloin lines[3] on jo TYPE/HITS, ei hinta - ja ilman
    # jakoa hinta jaa aluksen nimeen ja tulostuu kortin otsikkoon.
    if "\t" in head:
        _name, _tail = head.split("\t", 1)
        _name, _tail = _name.strip(), _tail.strip()
        if _name and re.search(r"\bPTS\b", _tail, re.I):
            head, pts_raw = _name, _tail

    rws = rows(page)
    stat_labels = TYRANID_STATS if "SPORES" in txt else STATS
    si, sc, sy = label_row(rws, stat_labels)
    ai, ac, ay = label_row(rws, ARMS)
    if si is None or ai is None:
        return None

    # --- statsit: hahmo ensin, geometria varalla -------------------------
    srow = text_of(rws[si + 1][1]) if si + 1 < len(rws) else ""
    srow = re.sub(r"\s+", " ", srow).strip()
    m = STAT_RE.match(srow)
    if m:
        g = m.groupdict()
        stats = {"TYPE/HITS": g["type"], "SPEED": g["speed"], "TURNS": g["turns"],
                 "SHIELDS": g["shields"], "ARMOUR": g["armour"], "TURRETS": g["turrets"]}
        stat_ok = True
    else:
        buf = cols_of(rws[si + 1][1], sc)
        # sama normalisointi kuin hahmopolulla, muuten kapea valilyonti jaa
        # Sisainen avain pysyy TURRETS-nimisenä, jotta vanha datamalli ja
        # laskenta toimivat. defense_label kertoo käyttöliittymälle, että
        # Tyranideilla sama arvo on SPORES.
        stats = {STATS[k]: v.replace(" ", " ").replace(" ", " ")
                 for k, v in buf.items()}
        stat_ok = False

    # --- aseistus ---------------------------------------------------------
    # Taulukko paattyy osiootsikkoon, isoon pystyvaliin tai lorekappaleeseen.
    # Rivin x0:aan ei voi luottaa: solut ovat keskitettyja ja levenevat vasemmalle.
    arms, cur, stop = [], None, len(rws)
    prev_y = ay
    for j in range(ai + 1, len(rws)):
        yc, ws = rws[j]
        first = section_name(ws)
        if first or yc - prev_y >= 16 or len(ws) >= 14:
            stop = j
            break
        prev_y = yc
        full_row = text_of(ws).strip()
        # Monivalintataulukoiden koko rivin levyiset väliotsikot eivät ole
        # aseita. Ilman tätä Dragonship sai aseen "Choose", Hammer aseen
        # "OR" ja otsikon loppu liimautui edellisen aseen soluihin.
        if re.match(r"^(?:(?:in addition,\s*)?choose\b|or\s*$|below\b)", full_row, re.I):
            cur = None
            continue
        # Ryhmaotsikko ("QUADRANT WEAPONS", "BASILICA WEAPONS") on yksi solu,
        # jonka kirjaimet ovat kaikki isoja. Ilman tata se liimautui
        # edellisen rivin kantamasoluun, koska siina ei ole asesaraketta.
        _cells = cells_of(ws)
        _letters = [c for c in full_row if c.isalpha()]
        if len(_cells) == 1 and _letters and all(c.isupper() for c in _letters):
            cur = None
            continue
        buf = cols_of(ws, ac)
        row = {ARM_KEYS[k]: v.replace("\u2009", " ") for k, v in buf.items()}
        if row.get("armament"):
            cur = {k: row.get(k, "") for k in ARM_KEYS}
            arms.append(cur)
        elif cur is not None:
            for k in ARM_KEYS:
                if row.get(k):
                    cur[k] = (cur[k] + " / " + row[k]).strip(" /")

    # --- OPTIONS / SPECIAL / NOTES ----------------------------------------
    extras, k = {}, stop
    while k < len(rws):
        yc, ws = rws[k]
        first = section_name(ws)
        if first:
            body, prev, kk = [], yc, k
            while kk < len(rws):
                y2, w2 = rws[kk]
                if kk > k and (y2 - prev >= 18 or section_name(w2)):
                    break
                t = text_of(w2)
                if kk == k:
                    t = t[len(ws[0][4]):].strip()
                body.append(t)
                prev, kk = y2, kk + 1
            # Sivulla voi olla useita saman otsikon lohkoja (esim. Tau
            # Orbitals: SPECIAL per moduuli). Aiemmin myohempi ylikirjoitti
            # aiemmat ja erikoissaantoja katosi kortilta.
            txtb = re.sub(r"\s+", " ", " ".join(body)).strip()
            extras[first] = (extras[first] + " " + txtb).strip() if first in extras else txtb
            k = kk
        else:
            k += 1

    # Kirja merkitsee tahtilinnakkeiden arvot "(quadrant)": ne ovat
    # neljanneskohtaisia. Merkinta oli epajohdonmukainen - se katosi
    # osumaluvusta mutta jai kilpiin ja torneihin - joten se pudotetaan
    # kaikista arvoista ja nostetaan aluksen omaksi lipuksi. Nain kortti
    # voi kertoa asian kerran kokonaan sen sijaan etta toistaisi sen
    # kahdessa ahtaassa ruudussa ja unohtaisi kolmannesta.
    quadrant = "(quadrant)" in srow.lower()
    if quadrant:
        stats = {k: re.sub(r"\s*\(quadrant\)", "", v, flags=re.I)
                 for k, v in stats.items()}

    fl = ""
    mm = re.search(r"FLEET LISTS\s*\n(.+?)(?:\n\s*\d+\s*\n|\Z)", txt, re.S)
    if mm:
        fl = re.sub(r"\s+", " ", mm.group(1)).strip()
        fl = re.split(r"Famous Ships", fl)[0].strip()

    pm = re.match(r"^(\d+)\s*PTS", pts_raw)
    if head.upper() == "TYPE/HITS":
        # Jatkosivu, jolla on vain saman aluksen lisäkonfiguraatio (Tau
        # Il'Porrui s. 473), ei ole itsenäinen alusprofiili.
        return None

    return dict(page=page.number + 1, fleet=fleet, title=head,
                pts=int(pm.group(1)) if pm else None, pts_raw=pts_raw,
                stats=stats, stat_ok=stat_ok, statline=srow, quadrant=quadrant,
                defense_label="SPORES" if stat_labels is TYRANID_STATS else "TURRETS",
                arms=arms, extras=extras, fleet_lists=fl)


out = []
for i in range(len(d)):
    try:
        r = parse(d[i])
    except Exception as e:
        print("VIRHE s.%d: %s" % (i + 1, e), file=sys.stderr)
        r = None
    if r:
        out.append(r)

io.open("profiles_raw.json", "w", encoding="utf-8").write(
    json.dumps(out, ensure_ascii=False, indent=1))

bad = [p for p in out if not p["stat_ok"]]
print("poimittu %d profiilia" % len(out))
print("statsirivi ei osunut hahmoon: %d" % len(bad))
for p in bad[:12]:
    print("   s.%-4d %-34s %r" % (p["page"], p["title"], p["statline"][:60]))
print("aseistusrivien jakauma:", {n: sum(1 for p in out if len(p["arms"]) == n)
                                 for n in sorted({len(p["arms"]) for p in out})})
print("OPTIONS:", sum(1 for p in out if "OPTIONS" in p["extras"]),
      " SPECIAL:", sum(1 for p in out if "SPECIAL" in p["extras"]),
      " NOTES:", sum(1 for p in out if "NOTES" in p["extras"]))
