# -*- coding: utf-8 -*-
"""Rivi riviltä -audit: verrataan bfg_data.json takaisin lahde-PDF:iin.

  A  statsirivin arvot loytyvat lahdesivulta
  B  jokaisen aseistusrivin jokainen solu loytyy lahdesivulta
     (moniarvoiset solut pilkotaan " / " kohdalta)
  C  OPTIONS/SPECIAL-lohko ei ole katkennut kesken
  D  ORVOT OSIOT: onko aseistustaulukon ja lorekappaleen valissa
     saantotekstia jota poimija EI ottanut talteen. Tama on se kohta jossa
     aseiden erikoissaannot katoaisivat kortilta.
  E  listarivin hinta loytyy listasivulta
  F  listarivin sivuviite osoittaa oikeaan alukseen

Aja:  python audit.py            koko aineisto
      python audit.py -v         nayta myos jokainen loydos kokonaan
"""
import fitz, json, io, re, sys, os, collections

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = r"F:\3D print LLM\Battlefleet Gothic\tulosteet\ref\BFG-Remastered-Official-Fleets_WIP.pdf"
D = json.load(io.open(os.path.join(HERE, "bfg_data.json"), encoding="utf-8"))
doc = fitz.open(SRC)
VERBOSE = "-v" in sys.argv

SECTIONS = ("OPTIONS", "NOTES", "NOTE", "SPECIAL", "UPGRADES", "REFITS")
issues = collections.defaultdict(list)


def norm(t):
    t = (t.replace("\u2009", " ").replace("\u00a0", " ").replace("\u2013", "-")
          .replace("\u2019", "'").replace("\u2018", "'"))
    return re.sub(r"\s+", " ", t).strip().lower()


_pt = {}


def page_text(n):
    if n not in _pt:
        _pt[n] = norm(doc[n - 1].get_text())
    return _pt[n]


def add(kind, ref, msg):
    issues[kind].append((ref, msg))


def rows_of(page, tol=3.5):
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


# ------------------------------------------------------------------ ALUKSET
ships = D["ships"]
def profile_sort(item):
    m = re.match(r"^(\d+)(.*)$", item[0])
    return (int(m.group(1)), m.group(2)) if m else (10**9, item[0])


for pg, sh in sorted(ships.items(), key=profile_sort):
    t = page_text(sh["pg"])
    ref = "s.%s %s" % (pg, sh["nm"][:34])

    # A ---------------------------------------------------------------
    for label, v in (("speed", sh["sp"]), ("shields", sh["sh"]),
                     ("turrets", sh["tu"]), ("turns", sh["tn"])):
        if v and norm(v) not in t:
            add("A statsi", ref, "%s=%r ei loydy sivulta" % (label, v))
    if sh["hp"] is not None and ("/%d" % sh["hp"]) not in t:
        add("A statsi", ref, "hits=%s ei loydy" % sh["hp"])

    # B --- moniarvoiset solut pilkotaan, koska poimija yhdistaa rivit
    for a in sh["aw"]:
        if norm(a[0]) and norm(a[0]) not in t:
            add("B aseistus", ref, "asetta %r ei loydy sivulta" % a[0])
        for cell in a[1:]:
            for part in str(cell).split(" / "):
                p = norm(part).strip("()")
                if p and p not in ("-", "") and p not in t:
                    add("B aseistus", ref, "%r: %r ei loydy" % (a[0], part))
    if not sh["aw"]:
        add("B aseistus", ref, "ei yhtaan aseistusrivia")

    # C ---------------------------------------------------------------
    for key, val in (("OPTIONS", sh["op"]), ("SPECIAL", sh["sr"])):
        v = (val or "").strip()
        if v and not re.search(r"([.!?)\]]|\d|pts|points|cm)$", v, re.I):
            add("C lohko", ref, "%s paattyy kesken: ...%r" % (key, v[-50:]))
        if "[???]" in v:
            add("C lohko", ref, "%s: lahteessa rikkinainen ristiviite [???]" % key)

    # D --- katosiko saantolohko? --------------------------------------
    # Kaksi asiaa voi menna pieleen: (1) sivulla on osio-otsikko jota
    # poimija ei ottanut lainkaan, (2) lohko katkesi kesken, jolloin
    # aseen erikoissaanto jaa pois kortilta. Lorekappaleet EIVAT ole
    # loydos: ne alkavat sivun vasemmasta marginaalista, osioiden
    # leipateksti on sisennetty.
    page = doc[sh["pg"] - 1]
    rws = rows_of(page)
    ai = None
    for i, (yc, ws) in enumerate(rws):
        toks = [w[4] for w in ws]
        if "ARMAMENT" in toks and "FIRE" in toks:
            ai = i
            break
    if ai is None:
        continue
    captured = norm((sh["op"] or "") + " " + (sh["sr"] or ""))
    body = [(yc, ws) for yc, ws in rws[ai + 1:] if yc < 610]
    lore_x = None
    longs = [ws[0][0] for yc, ws in body if len(ws) >= 13]
    if longs:
        lore_x = min(longs)

    # D1: otsikko sivulla mutta ei poimituissa lohkoissa
    on_page = {ws[0][4].upper().strip(":") for yc, ws in body
               if ws[0][4].upper().strip(":") in SECTIONS}
    got = set()
    if (sh["op"] or "").strip():
        got.add("OPTIONS")
    if (sh["sr"] or "").strip():
        got |= {"SPECIAL", "NOTES", "NOTE"}
    for h in sorted(on_page - got):
        add("D1 osio kadonnut", ref, "sivulla on %s-lohko jota ei poimittu" % h)

    # D2: lohko katkesi kesken - seuraava rivi on yha sisennettya leipatekstia
    started = False
    for yc, ws in body:
        first = ws[0][4].upper().strip(":")
        if first in SECTIONS:
            started = True
            continue
        if not started:
            continue
        if lore_x is not None and ws[0][0] <= lore_x + 6:
            break                        # lorekappale alkoi, ei loydos
        line = " ".join(w[4] for w in ws)
        if re.match(r"^[A-Z &]+MODULE\b", line):
            continue                    # Tau Orbitalin seuraavan moduulin nimi
        n = norm(re.sub(r"^(OPTIONS|SPECIAL|NOTES?|UPGRADES|REFITS)\s*:?\s*", "", line))
        n = n.lstrip("• \t")
        if sh["pg"] in (184, 192):
            n = n.replace("[???]", "p. 175")  # kirjan tunnettu Xenotech-viitevirhe
        if len(n) > 12 and n[:45] not in captured:
            add("D2 lohko katkesi", ref, "poimimatta: %r" % line[:95])
            break

# ----------------------------------------------------------------- LISTAT
for L in D["lists"]:
    for sec in L["secs"]:
        for e in sec["ents"]:
            ref = "%s / %s" % (L["nm"][:26], e["l"][:30])
            if e["r"]:
                if str(e["r"]) not in ships:
                    add("F sivuviite", ref, "pg. %s ei ole profiilisivu" % e["r"])
                elif e.get("badref"):
                    add("F sivuviite", ref, "KIRJAN VIRHE, merkitty: -> %r"
                        % ships[str(e["r"])]["nm"])
                else:
                    # sama sanavertailu kuin build_data.py:n ristiintarkistuksessa
                    def tok(t):
                        t = re.sub(r"pg\.\s*\d+", " ", norm(t))
                        t = re.sub(r"[^a-z0-9' ]", " ", t)
                        return {w for w in t.split() if len(w) > 2 and w not in {
                            "class", "the", "and", "ship", "vessel", "heavy",
                            "light", "grand", "battleship", "cruiser", "escort",
                            "destroyer", "frigate", "raider", "starship",
                            "attack", "assault", "gunship", "ramship", "kroozer",
                            "battlekroozer", "battlecruiser", "transport"}}
                    if tok(e["l"]) and tok(ships[str(e["r"])]["nm"]) and \
                       not (tok(e["l"]) & tok(ships[str(e["r"])]["nm"])):
                        add("F sivuviite", ref, "-> %r" % ships[str(e["r"])]["nm"])
            if e["p"] is not None and e.get("src_page"):
                pt = page_text(e["src_page"])
                # Nolla tulee kirjassa sanana: "Ork Warlord....Free".
                ok_price = (re.search(r"\b%d\s*pts" % e["p"], pt) or
                            (e["p"] == 0 and re.search(r"\bFree\b", pt, re.I)))
                # Rikkinainen listarivi: kun listasivu ja profiilisivu ovat
                # eri mielta hinnasta, profiilisivu on auktoriteetti. Sivun
                # 372 rivi "(pg. 377)). 2310 pts" on kirjan oma sotku, ja
                # oikea 210 lukee profiilisivulla 381. Loydos jaa yha
                # voimaan jos hintaa ei ole kummallakaan sivulla.
                if not ok_price and e.get("r"):
                    ok_price = bool(re.search(r"\b%d\s*pts\b" % e["p"],
                                              # profiilin SIVU, ei avain: varianttiavain
                                              # ("334b", "517b") ei ole sivunumero
                                              page_text(ships[str(e["r"])]["pg"]), re.I))
                if not ok_price:
                    add("E lista", ref, "hintaa %d pts ei loydy sivulta %s"
                        % (e["p"], e.get("src_page")))

# --------------------------------------------------------------- RAPORTTI
tot = sum(len(v) for v in issues.values())
print("Auditoitu: %d alusta, %d listaa, %d listarivia" % (
    len(ships), len(D["lists"]),
    sum(len(sec["ents"]) for L in D["lists"] for sec in L["secs"])))
print("Loydoksia yhteensa: %d\n" % tot)
for kind in sorted(issues):
    rows = issues[kind]
    print("== %s: %d ==" % (kind, len(rows)))
    lim = len(rows) if VERBOSE else 25
    for ref, msg in rows[:lim]:
        print("   %-40s %s" % (ref[:40], msg[:130]))
    if len(rows) > lim:
        print("   ... ja %d muuta (-v nayttaa kaikki)" % (len(rows) - lim))
    print()
